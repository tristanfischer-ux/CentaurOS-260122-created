/**
 * Simple Voice Recording Test
 * Tests just the recording and file reading part
 */

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export async function testVoiceRecording() {
  console.log('🎤 Starting voice recording test...');

  try {
    // Step 1: Request permissions
    console.log('Step 1: Requesting permissions...');
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Microphone permission denied');
    }
    console.log('✅ Permissions granted');

    // Step 2: Set audio mode
    console.log('Step 2: Setting audio mode...');
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
    console.log('✅ Audio mode set');

    // Step 3: Start recording with LINEAR16 PCM format (WAV)
    console.log('Step 3: Starting recording with WAV format...');
    const { recording } = await Audio.Recording.createAsync({
      isMeteringEnabled: true,
      android: {
        extension: '.wav',
        outputFormat: Audio.AndroidOutputFormat.DEFAULT,
        audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
        sampleRate: 16000,
        numberOfChannels: 1,
        bitRate: 128000,
      },
      ios: {
        extension: '.wav',
        outputFormat: Audio.IOSOutputFormat.LINEARPCM,
        audioQuality: Audio.IOSAudioQuality.HIGH,
        sampleRate: 16000,
        numberOfChannels: 1,
        bitRate: 128000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
      web: {
        mimeType: 'audio/webm',
        bitsPerSecond: 128000,
      },
    });
    console.log('✅ Recording started with WAV format');

    // Record for 3 seconds
    console.log('Recording for 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 4: Stop recording
    console.log('Step 4: Stopping recording...');
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

    const uri = recording.getURI();
    console.log('✅ Recording stopped, URI:', uri);

    if (!uri) {
      throw new Error('No URI returned from recording');
    }

    // Step 5: Read file as base64
    console.log('Step 5: Reading file as base64...');
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    console.log('✅ File read successfully, size:', base64.length);

    // Step 6: Verify it's valid base64
    if (base64.length < 100) {
      throw new Error('Base64 string too short - recording might be empty');
    }

    console.log('✅ All steps passed! Recording works correctly.');
    console.log('📊 Summary:', {
      uri,
      base64Length: base64.length,
      format: 'LINEAR16 PCM (WAV)',
      sampleRate: '16kHz',
      channels: 'Mono',
    });

    return { success: true, uri, base64, base64Length: base64.length };

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return { success: false, error };
  }
}

// To test: Call this function when the voice button is pressed
// testVoiceRecording().then(result => console.log('Test result:', result));
