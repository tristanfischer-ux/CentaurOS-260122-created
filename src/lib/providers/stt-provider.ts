/**
 * Speech-to-Text Provider Interface
 * Abstraction for STT with mock fallback
 */

export interface STTResult {
  transcript: string;
  confidence?: number; // 0-100
  words?: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
  }>;
}

export interface STTProvider {
  transcribe(audio: Blob | File): Promise<STTResult>;
}

// ============================================================================
// MOCK PROVIDER (Dev Fallback)
// ============================================================================

export const MOCK_TRANSCRIPTS = {
  simple: "Create a task to update the landing page and another to review analytics dashboard. Both should be done by next Friday.",

  complex: "Hey team, we need to finish the Q1 marketing campaign. Sarah should handle the social media posts, should take about 3 days. John can work on the email templates, probably 2 days of work. And we need someone to review the analytics from last quarter before our board meeting on March 15th.",

  brainstorm: "I want to think through our go-to-market strategy. We're launching a new product in 3 months and need to figure out the right channels and messaging.",

  quick: "Add task to fix the bug in checkout flow by tomorrow.",
};

export class MockSTTProvider implements STTProvider {
  async transcribe(audio: Blob | File): Promise<STTResult> {
    console.log('[MockSTTProvider] Transcribing audio (mock mode)');

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Return simple mock transcript
    return {
      transcript: MOCK_TRANSCRIPTS.simple,
      confidence: 95,
    };
  }
}

// ============================================================================
// WEB SPEECH API PROVIDER (Client-Side)
// ============================================================================

/**
 * Uses browser Web Speech API for client-side transcription
 * Note: This is client-side only and requires browser support
 */
export class WebSpeechSTTProvider implements STTProvider {
  async transcribe(audio: Blob | File): Promise<STTResult> {
    // Check if Web Speech API available
    const SpeechRecognition = (window as any).SpeechRecognition ||
                              (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      throw new Error('Web Speech API not supported in this browser');
    }

    return new Promise((resolve, reject) => {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-GB'; // UK English
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence * 100;

        resolve({
          transcript,
          confidence,
        });
      };

      recognition.onerror = (event: any) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      // Start recognition
      // Note: For file/blob, we'd need to convert to audio stream
      // For now, this provider only works with live microphone
      recognition.start();
    });
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createSTTProvider(provider: string = 'mock'): STTProvider {
  if (provider === 'webspeech') {
    // Check if supported
    const SpeechRecognition = (window as any).SpeechRecognition ||
                              (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Web Speech API not supported. Falling back to mock.');
      return new MockSTTProvider();
    }

    return new WebSpeechSTTProvider();
  }

  return new MockSTTProvider();
}
