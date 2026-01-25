/**
 * Transcription API
 * POST /api/transcribe
 *
 * Converts audio to text using Google Cloud Speech-to-Text API
 * Protected by AI guardrails to prevent cost overruns
 */

import { aiGuardrails } from '@/lib/ai-guardrails';

export async function POST(request: Request) {
  try {
    // Parse JSON body with audio base64 and metadata
    const body = await request.json();
    const { audioBase64, mimeType, userId } = body;

    if (!audioBase64) {
      return Response.json(
        { error: 'No audio data provided' },
        { status: 400 }
      );
    }

    // Check guardrails before making request
    const guardrailCheck = await aiGuardrails.canMakeRequest(userId);
    if (!guardrailCheck.allowed) {
      console.warn('[Transcribe] Blocked by guardrails:', guardrailCheck.reason);
      return Response.json(
        { error: guardrailCheck.reason, blocked: true },
        { status: 429 }
      );
    }

    // Get API key from environment (prefer server-side key, fallback to public)
    const apiKey = process.env.GOOGLE_AI_API_KEY ||
      process.env.EXPO_PUBLIC_GOOGLE_AI_API_KEY ||
      process.env.EXPO_PUBLIC_CENTAUROS_GOOGLE_API_KEY;

    if (!apiKey) {
      console.error('[Transcribe] No Google API key found');
      return Response.json(
        { error: 'Google API key not configured' },
        { status: 500 }
      );
    }

    console.log('[Transcribe] Processing audio:', {
      type: mimeType,
      size: audioBase64.length,
    });

    // Determine audio encoding from file type
    const audioEncoding = (mimeType && mimeType.includes('wav'))
      ? 'LINEAR16'
      : 'MP3'; // Use MP3 for CAF, M4A, MP4 files

    // Call Google Cloud Speech-to-Text API
    const response = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: {
            encoding: audioEncoding,
            sampleRateHertz: 44100, // Standard for mobile recordings
            languageCode: 'en-GB', // UK English
            enableAutomaticPunctuation: true,
            model: 'default',
          },
          audio: {
            content: audioBase64,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[Transcribe] Google API error:', error);
      return Response.json(
        { error: 'Failed to transcribe audio', details: error },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extract transcript from response
    if (!data.results || data.results.length === 0) {
      console.warn('[Transcribe] No transcription results');
      return Response.json(
        { error: 'No speech detected in audio' },
        { status: 400 }
      );
    }

    const transcript = data.results
      .map((result: any) => result.alternatives[0].transcript)
      .join(' ');

    const confidence = data.results[0]?.alternatives[0]?.confidence || 0;

    // Record usage with guardrails (Google STT pricing: ~$0.006 per 15 seconds)
    // Estimate audio duration from base64 size (~44KB per second for 44.1kHz WAV)
    const estimatedDurationSeconds = Math.ceil(audioBase64.length / 44000);
    const estimatedTokens = estimatedDurationSeconds * 100; // Rough token equivalent

    await aiGuardrails.recordUsage({
      model: 'google-speech-to-text',
      inputTokens: estimatedTokens,
      outputTokens: Math.ceil(transcript.length / 4),
      endpoint: 'transcribe',
      userId,
      success: true,
    });

    console.log('[Transcribe] Success:', {
      transcript: transcript.substring(0, 100),
      confidence,
    });

    return Response.json({
      success: true,
      transcript,
      confidence: Math.round(confidence * 100),
    });
  } catch (error: any) {
    console.error('[Transcribe] Unexpected error:', error);
    return Response.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
