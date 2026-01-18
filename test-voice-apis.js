/**
 * Manual Test Script for Voice Transcription
 * Run this to verify Google APIs are accessible
 */

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_AI_API_KEY;

console.log('🧪 Testing Voice Transcription Setup...\n');

// Test 1: API Key Check
console.log('Test 1: API Key');
if (GOOGLE_API_KEY) {
  console.log('✅ Google API key found:', GOOGLE_API_KEY.substring(0, 10) + '...');
} else {
  console.log('❌ No Google API key found!');
  console.log('Available keys:', Object.keys(process.env).filter(k => k.includes('GOOGLE')));
}

// Test 2: Google Speech-to-Text API
async function testSpeechAPI() {
  console.log('\nTest 2: Google Speech-to-Text API');

  // Create a tiny test audio (silence, base64)
  const silenceBase64 = 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQAAAAA=';

  try {
    const response = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            encoding: 'LINEAR16',
            sampleRateHertz: 16000,
            languageCode: 'en-GB',
          },
          audio: { content: silenceBase64 },
        }),
      }
    );

    if (response.ok) {
      console.log('✅ Speech API accessible');
      const data = await response.json();
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Speech API error:', response.status);
      const error = await response.text();
      console.log('Error details:', error);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

// Test 3: Google Gemini API
async function testGeminiAPI() {
  console.log('\nTest 3: Google Gemini API');

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: 'Say "Hello World"' }]
          }]
        }),
      }
    );

    if (response.ok) {
      console.log('✅ Gemini API accessible');
      const data = await response.json();
      console.log('Response:', data.candidates?.[0]?.content?.parts?.[0]?.text);
    } else {
      console.log('❌ Gemini API error:', response.status);
      const error = await response.text();
      console.log('Error details:', error);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

// Run tests
(async () => {
  if (GOOGLE_API_KEY) {
    await testSpeechAPI();
    await testGeminiAPI();
  }

  console.log('\n✅ Test complete!');
})();
