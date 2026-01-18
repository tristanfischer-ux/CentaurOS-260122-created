/**
 * Google Cloud Speech-to-Text Client-Side Helper
 * Direct API calls to Google Speech-to-Text from React Native
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
 * Transcribe audio using Google Cloud Speech-to-Text API
 * @param base64Audio - Base64 encoded audio data (without data URI prefix)
 * @param mimeType - Audio MIME type (e.g., 'audio/caf', 'audio/m4a')
 * @returns Transcription result with text and confidence
 */
export async function transcribeAudioWithGoogle(
  base64Audio: string,
  mimeType: string = 'audio/caf'
): Promise<TranscriptionResult> {
  // Get API key from environment
  const apiKey =
    process.env.EXPO_PUBLIC_GOOGLE_AI_API_KEY ||
    process.env.EXPO_PUBLIC_VIBECODE_GOOGLE_API_KEY;

  console.log('[GoogleSpeech] API Key check:', {
    hasGoogleKey: !!process.env.EXPO_PUBLIC_GOOGLE_AI_API_KEY,
    hasVibeKey: !!process.env.EXPO_PUBLIC_VIBECODE_GOOGLE_API_KEY,
    envKeys: Object.keys(process.env).filter(k => k.includes('GOOGLE')),
  });

  if (!apiKey) {
    console.error('[GoogleSpeech] No API key found in environment');
    throw new Error('Google API key not configured. Please add EXPO_PUBLIC_GOOGLE_AI_API_KEY to your environment variables.');
  }

  // Determine audio encoding from MIME type
  // Google Speech-to-Text supports: FLAC, LINEAR16, MULAW, AMR, AMR_WB, OGG_OPUS, SPEEX_WITH_HEADER_BYTE, WEBM_OPUS
  let audioEncoding: string;

  if (mimeType.includes('wav')) {
    audioEncoding = 'LINEAR16'; // WAV files use LINEAR16 PCM encoding
  } else if (mimeType.includes('flac')) {
    audioEncoding = 'FLAC';
  } else if (mimeType.includes('webm')) {
    audioEncoding = 'WEBM_OPUS';
  } else {
    audioEncoding = 'ENCODING_UNSPECIFIED'; // Let Google auto-detect
  }

  console.log('[GoogleSpeech] Starting transcription:', {
    audioSize: base64Audio.length,
    mimeType,
    encoding: audioEncoding,
  });

  try {
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
            sampleRateHertz: audioEncoding === 'LINEAR16' ? 16000 : undefined, // Set for LINEAR16
            languageCode: 'en-GB', // UK English
            enableAutomaticPunctuation: true,
            model: 'default',
            audioChannelCount: 1, // Mono audio
          },
          audio: {
            content: base64Audio,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GoogleSpeech] API error:', errorText);

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        throw new Error(`Google API error: ${response.status} - ${errorText}`);
      }

      throw new Error(
        errorData.error?.message || `Transcription failed: ${response.status}`
      );
    }

    const data = await response.json();

    // Extract transcript from response
    if (!data.results || data.results.length === 0) {
      console.warn('[GoogleSpeech] No transcription results - no speech detected');
      throw new Error('No speech detected in audio. Please try speaking more clearly.');
    }

    const transcript = data.results
      .map((result: any) => result.alternatives[0].transcript)
      .join(' ');

    const confidence = Math.round(
      (data.results[0]?.alternatives[0]?.confidence || 0) * 100
    );

    console.log('[GoogleSpeech] Transcription successful:', {
      transcript: transcript.substring(0, 100),
      confidence,
      resultsCount: data.results.length,
    });

    return {
      transcript,
      confidence,
    };
  } catch (error: any) {
    console.error('[GoogleSpeech] Transcription failed:', error);

    // Provide user-friendly error messages
    if (error.message.includes('API key')) {
      throw new Error('Google API key is invalid or not configured');
    }

    if (error.message.includes('quota')) {
      throw new Error('Google API quota exceeded. Please try again later.');
    }

    throw error;
  }
}
