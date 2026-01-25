/**
 * OpenAI Whisper Transcription API
 * POST /api/transcribe/whisper
 *
 * Server-side route for audio transcription using OpenAI Whisper
 * Keeps API keys secure on the server
 * Protected by AI guardrails to prevent cost overruns
 */

import { aiGuardrails } from '@/lib/ai-guardrails';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { audioBase64, mimeType = 'audio/wav', userId } = body;

    if (!audioBase64) {
      return Response.json(
        { error: 'No audio data provided' },
        { status: 400 }
      );
    }

    // Check guardrails before making request
    const guardrailCheck = await aiGuardrails.canMakeRequest(userId);
    if (!guardrailCheck.allowed) {
      console.warn('[Whisper API] Blocked by guardrails:', guardrailCheck.reason);
      return Response.json(
        { error: guardrailCheck.reason, blocked: true },
        { status: 429 }
      );
    }

    // Get API key from environment (server-side only, not EXPO_PUBLIC_)
    const apiKey = process.env.OPENAI_API_KEY ||
      process.env.EXPO_PUBLIC_CENTAUROS_OPENAI_API_KEY;

    if (!apiKey) {
      console.error('[Whisper API] No OpenAI API key found');
      return Response.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    console.log('[Whisper API] Processing audio:', {
      mimeType,
      size: audioBase64.length,
    });

    // Convert base64 to blob
    const byteCharacters = atob(audioBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    // Create form data for OpenAI API
    const formData = new FormData();
    formData.append('file', blob, 'audio.wav');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
    formData.append('response_format', 'json');

    console.log('[Whisper API] Sending request to OpenAI...');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Whisper API] OpenAI error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      return Response.json(
        { error: `OpenAI Whisper API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    console.log('[Whisper API] Transcription successful:', {
      transcript: data.text?.substring(0, 100),
    });

    // Record usage with guardrails (Whisper pricing: $0.006 per minute)
    // Estimate audio duration from base64 size
    const estimatedDurationSeconds = Math.ceil(audioBase64.length / 44000);
    const estimatedTokens = estimatedDurationSeconds * 100;

    await aiGuardrails.recordUsage({
      model: 'whisper-1',
      inputTokens: estimatedTokens,
      outputTokens: Math.ceil((data.text?.length || 0) / 4),
      endpoint: 'transcribe-whisper',
      userId,
      success: !!data.text,
    });

    if (!data.text) {
      return Response.json(
        { error: 'No transcription text in response' },
        { status: 400 }
      );
    }

    return Response.json({
      success: true,
      transcript: data.text,
      confidence: 100, // Whisper doesn't provide confidence scores
    });
  } catch (error: any) {
    console.error('[Whisper API] Unexpected error:', error);
    return Response.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
