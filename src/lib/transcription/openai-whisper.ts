/**
 * OpenAI Whisper API for Speech-to-Text
 * Uses the Whisper model for accurate transcription
 */

export interface TranscriptionResult {
  transcript: string;
  confidence?: number;
}

/**
 * Transcribe audio using OpenAI Whisper API
 * @param base64Audio - Base64 encoded audio data
 * @param mimeType - MIME type of the audio (e.g., 'audio/wav', 'audio/webm')
 * @returns Transcription result
 */
export async function transcribeAudioWithWhisper(
  base64Audio: string,
  mimeType: string = 'audio/wav'
): Promise<TranscriptionResult> {
  const apiKey = process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;

  if (!apiKey) {
    console.error('[OpenAI Whisper] No API key found');
    throw new Error('OpenAI API key not configured');
  }

  console.log('[OpenAI Whisper] Starting transcription...', {
    audioSize: base64Audio.length,
    mimeType,
  });

  try {
    // Convert base64 to blob
    const byteCharacters = atob(base64Audio);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    // Create form data
    const formData = new FormData();
    formData.append('file', blob, 'audio.wav');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en'); // English
    formData.append('response_format', 'json');

    console.log('[OpenAI Whisper] Sending request to OpenAI...');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[OpenAI Whisper] API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      throw new Error(`OpenAI Whisper API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    console.log('[OpenAI Whisper] Transcription successful:', {
      transcript: data.text?.substring(0, 100),
      fullResponse: data,
    });

    if (!data.text) {
      throw new Error('No transcription text in response');
    }

    return {
      transcript: data.text,
      confidence: 1.0, // Whisper doesn't provide confidence scores
    };
  } catch (error) {
    console.error('[OpenAI Whisper] Transcription failed:', error);
    throw error;
  }
}
