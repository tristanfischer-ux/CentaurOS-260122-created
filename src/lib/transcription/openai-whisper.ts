/**
 * OpenAI Whisper API for Speech-to-Text
 * Uses server-side route to keep API keys secure
 */

export interface TranscriptionResult {
  transcript: string;
  confidence?: number;
}

/**
 * Transcribe audio using OpenAI Whisper API via server route
 * @param base64Audio - Base64 encoded audio data
 * @param mimeType - MIME type of the audio (e.g., 'audio/wav', 'audio/webm')
 * @returns Transcription result
 */
export async function transcribeAudioWithWhisper(
  base64Audio: string,
  mimeType: string = 'audio/wav'
): Promise<TranscriptionResult> {
  console.log('[OpenAI Whisper] Starting transcription via server route...', {
    audioSize: base64Audio.length,
    mimeType,
  });

  try {
    // Call server-side API route (keeps API key secure)
    const response = await fetch('/api/transcribe/whisper', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audioBase64: base64Audio,
        mimeType,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[OpenAI Whisper] Server error:', data);
      throw new Error(data.error || `Transcription failed: ${response.status}`);
    }

    console.log('[OpenAI Whisper] Transcription successful:', {
      transcript: data.transcript?.substring(0, 100),
      confidence: data.confidence,
    });

    return {
      transcript: data.transcript,
      confidence: data.confidence ?? 100,
    };
  } catch (error) {
    console.error('[OpenAI Whisper] Transcription failed:', error);
    throw error;
  }
}
