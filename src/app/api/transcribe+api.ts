/**
 * Transcription API
 * POST /api/transcribe
 *
 * Converts audio to text using Google Cloud Speech-to-Text API
 */

export async function POST(request: Request) {
  try {
    // Parse JSON body with audio URI and metadata
    const body = await request.json();
    const { audioUri, mimeType } = body;

    if (!audioUri) {
      return Response.json(
        { error: 'No audio URI provided' },
        { status: 400 }
      );
    }

    // Fetch the audio file from URI
    const audioResponse = await fetch(audioUri);
    if (!audioResponse.ok) {
      throw new Error('Failed to fetch audio file');
    }

    // Get API key from environment
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_AI_API_KEY ||
                   process.env.EXPO_PUBLIC_VIBECODE_GOOGLE_API_KEY;

    if (!apiKey) {
      console.error('[Transcribe] No Google API key found');
      return Response.json(
        { error: 'Google API key not configured' },
        { status: 500 }
      );
    }

    // Convert audio file to base64
    const arrayBuffer = await audioResponse.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');

    // Determine audio encoding from file type
    const audioEncoding = (mimeType && mimeType.includes('wav'))
      ? 'LINEAR16'
      : (mimeType && (mimeType.includes('m4a') || mimeType.includes('mp4') || mimeType.includes('caf')))
      ? 'MP3' // Google accepts MP3 for m4a/mp4/caf files
      : 'LINEAR16';

    console.log('[Transcribe] Processing audio:', {
      type: mimeType,
      size: arrayBuffer.byteLength,
      encoding: audioEncoding,
    });

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
            content: base64Audio,
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
