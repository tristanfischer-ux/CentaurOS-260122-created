/**
 * Google Cloud Speech-to-Text Client-Side Helper
 * Uses server-side route to keep API keys secure
 */

export interface TranscriptionResult {
  transcript: string;
  confidence: number; // 0-100
}

export interface TranscriptionError {
  code: string;
  message: string;
}

/**
 * Transcribe audio using Google Cloud Speech-to-Text API via server route
 * @param base64Audio - Base64 encoded audio data (without data URI prefix)
 * @param mimeType - Audio MIME type (e.g., 'audio/caf', 'audio/m4a')
 * @returns Transcription result with text and confidence
 */
export async function transcribeAudioWithGoogle(
  base64Audio: string,
  mimeType: string = 'audio/caf'
): Promise<TranscriptionResult> {
  console.log('[GoogleSpeech] Starting transcription via server route:', {
    audioSize: base64Audio.length,
    mimeType,
  });

  try {
    // Call existing server-side API route (keeps API key secure)
    const response = await fetch('/api/transcribe', {
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
      console.error('[GoogleSpeech] Server error:', data);

      // Provide user-friendly error messages
      if (data.error?.includes('API key')) {
        throw new Error('Google API key is invalid or not configured');
      }
      if (data.error?.includes('quota')) {
        throw new Error('Google API quota exceeded. Please try again later.');
      }
      if (data.error?.includes('No speech detected')) {
        throw new Error('No speech detected in audio. Please try speaking more clearly.');
      }

      throw new Error(data.error || `Transcription failed: ${response.status}`);
    }

    console.log('[GoogleSpeech] Transcription successful:', {
      transcript: data.transcript?.substring(0, 100),
      confidence: data.confidence,
    });

    return {
      transcript: data.transcript,
      confidence: data.confidence ?? 0,
    };
  } catch (error: any) {
    console.error('[GoogleSpeech] Transcription failed:', error);
    throw error;
  }
}
