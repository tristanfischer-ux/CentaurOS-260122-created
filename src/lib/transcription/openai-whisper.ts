/**
 * OpenAI Whisper API for Speech-to-Text
 * Uses server-side route to keep API keys secure
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

export interface TranscriptionResult {
  transcript: string;
  confidence?: number;
}

/**
 * Get the API base URL for the current environment
 */
function getApiUrl(): string {
  if (Platform.OS === 'web') {
    return ''; // Relative URLs work on web
  }

  // For native, construct the dev server URL
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    const host = debuggerHost.split(':').shift();
    return `http://${host}:8081`;
  }

  // Fallback to localhost
  return 'http://localhost:8081';
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
    const apiUrl = getApiUrl();
    const url = `${apiUrl}/api/transcribe/whisper`;

    console.log('[OpenAI Whisper] Calling:', url);

    // Call server-side API route (keeps API key secure)
    const response = await fetch(url, {
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
      console.log('[OpenAI Whisper] Server error:', data);
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
    console.log('[OpenAI Whisper] Transcription failed:', error);
    throw error;
  }
}
