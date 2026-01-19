/**
 * OpenAI Whisper API for Speech-to-Text
 * Client-side transcription with API key from environment
 */

import { Platform } from 'react-native';

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
  console.log('[OpenAI Whisper] Starting transcription...', {
    audioSize: base64Audio.length,
    mimeType,
  });

  try {
    // Get API key from environment
    const apiKey = process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OpenAI API key not configured. Please add it in the ENV tab.');
    }

    // Create form data for OpenAI API
    const formData = new FormData();

    // React Native FormData supports base64 directly via uri parameter
    if (Platform.OS !== 'web') {
      // For React Native: use data URI format
      const dataUri = `data:${mimeType};base64,${base64Audio}`;
      formData.append('file', {
        uri: dataUri,
        type: mimeType,
        name: 'audio.wav',
      } as any);
    } else {
      // For web: convert base64 to Blob
      const byteCharacters = atob(base64Audio);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      formData.append('file', blob, 'audio.wav');
    }

    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
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
      console.log('[OpenAI Whisper] Error:', errorText);
      throw new Error(`Transcription failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.text) {
      throw new Error('No transcription text in response');
    }

    console.log('[OpenAI Whisper] Transcription successful:', {
      transcript: data.text?.substring(0, 100),
    });

    return {
      transcript: data.text,
      confidence: 100, // Whisper doesn't provide confidence scores
    };
  } catch (error) {
    console.log('[OpenAI Whisper] Transcription failed:', error);
    throw error;
  }
}
