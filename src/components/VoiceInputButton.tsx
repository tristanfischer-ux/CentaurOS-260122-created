/**
 * Voice Input Button
 * Floating button for voice recording with transcription
 *
 * Uses Google Cloud Speech-to-Text API for real-time transcription (client-side)
 */

import { View, Text, Pressable, Modal, Animated as RNAnimated, Platform } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Mic, X, Loader } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { transcribeAudioWithWhisper } from '@/lib/transcription/openai-whisper';

interface VoiceInputButtonProps {
  onTranscriptComplete: (transcript: string) => void;
  onError?: (error: string) => void;
  color?: string;
  size?: number;
  inline?: boolean; // NEW: When true, don't show modal, just pulse in place
}

export function VoiceInputButton({
  onTranscriptComplete,
  onError,
  color = '#3b82f6',
  size = 60,
  inline = false, // Default to modal behavior
}: VoiceInputButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animation values
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.6);

  // Request audio permissions on mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Audio.requestPermissionsAsync();
        setHasPermission(status === 'granted');
      } catch (error) {
        console.log('[VoiceInput] Permission error:', error);
        setHasPermission(false);
      }
    })();
  }, []);

  // Start recording
  const startRecording = async () => {
    try {
      if (hasPermission === false) {
        onError?.('Microphone permission denied');
        return;
      }

      console.log('[VoiceInput] Starting recording...');

      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create and start recording with LINEAR16 PCM format (Google Speech-to-Text compatible)
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

      recordingRef.current = recording;
      setIsRecording(true);
      setShowModal(!inline); // Only show modal if not inline
      setRecordingDuration(0);

      // Start pulse animation
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.6, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );

      // Start duration timer
      durationTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      console.log('[VoiceInput] Recording started');
    } catch (error) {
      console.log('[VoiceInput] Failed to start recording:', error);
      onError?.('Failed to start recording');
      setIsRecording(false);
      setShowModal(false);
    }
  };

  // Stop recording and process
  const stopRecording = async () => {
    try {
      if (!recordingRef.current) return;

      console.log('[VoiceInput] Stopping recording...');

      // Stop timer
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }

      // Stop animation
      pulseScale.value = withTiming(1);
      pulseOpacity.value = withTiming(0.6);

      setIsRecording(false);
      setIsProcessing(true);

      // Stop and get recording
      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      console.log('[VoiceInput] Recording stopped, URI:', uri);

      if (!uri) {
        throw new Error('Failed to get recording URI');
      }

      // Read the audio file as base64
      console.log('[VoiceInput] Reading audio file...');
      let base64Audio: string;

      if (Platform.OS === 'web') {
        // On web, fetch the blob URL and convert to base64
        console.log('[VoiceInput] Web platform - fetching blob...');
        const response = await fetch(uri);
        const blob = await response.blob();

        // Convert blob to base64 using FileReader
        base64Audio = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        // On native, use expo-file-system
        console.log('[VoiceInput] Native platform - using FileSystem...');
        base64Audio = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      console.log('[VoiceInput] Audio converted to base64, size:', base64Audio.length);

      // Call OpenAI Whisper API for transcription
      console.log('[VoiceInput] Transcribing with OpenAI Whisper...');

      const result = await transcribeAudioWithWhisper(base64Audio, 'audio/wav');

      console.log('[VoiceInput] Transcription complete:', {
        transcript: result.transcript.substring(0, 100),
        confidence: result.confidence,
      });

      setIsProcessing(false);
      setShowModal(false);
      setRecordingDuration(0);

      onTranscriptComplete(result.transcript);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log('[VoiceInput] Failed to stop recording:', errorMessage);

      onError?.(errorMessage.includes('API key')
        ? 'Voice transcription is not configured. Please add your OpenAI API key in the ENV tab.'
        : `Failed to process recording: ${errorMessage}`
      );

      setIsRecording(false);
      setIsProcessing(false);
      setShowModal(false);
      setRecordingDuration(0);
    }
  };

  // Cancel recording
  const cancelRecording = async () => {
    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
        recordingRef.current = null;
      }

      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }

      pulseScale.value = withTiming(1);
      pulseOpacity.value = withTiming(0.6);

      setIsRecording(false);
      setIsProcessing(false);
      setShowModal(false);
      setRecordingDuration(0);
    } catch (error) {
      console.log('[VoiceInput] Failed to cancel recording:', error);
    }
  };

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Animated pulse style
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  if (hasPermission === false) {
    return (
      <View className="items-center">
        <Text className="text-red-500 text-sm">Microphone permission required</Text>
      </View>
    );
  }

  return (
    <>
      {/* Recording Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={cancelRecording}
      >
        <View className="flex-1 bg-black/80 items-center justify-center">
          <View className="bg-white dark:bg-slate-900 rounded-3xl p-8 mx-6 items-center">
            {isProcessing ? (
              <>
                <View className="mb-4">
                  <Loader size={48} color={color} />
                </View>
                <Text className="text-slate-900 dark:text-white font-semibold text-lg">
                  Processing...
                </Text>
                <Text className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                  Transcribing your recording
                </Text>
              </>
            ) : (
              <>
                {/* Pulse animation */}
                <View className="relative items-center justify-center mb-6">
                  <Animated.View
                    style={[
                      pulseStyle,
                      {
                        width: 120,
                        height: 120,
                        borderRadius: 60,
                        backgroundColor: color + '40',
                        position: 'absolute',
                      },
                    ]}
                  />
                  <View
                    className="w-20 h-20 rounded-full items-center justify-center"
                    style={{ backgroundColor: color }}
                  >
                    <Mic size={32} color="white" />
                  </View>
                </View>

                <Text className="text-slate-900 dark:text-white font-semibold text-lg mb-2">
                  Recording...
                </Text>
                <Text className="text-slate-500 dark:text-slate-400 text-2xl font-mono mb-6">
                  {formatDuration(recordingDuration)}
                </Text>

                {/* Progressive Prompts - shown based on recording duration */}
                <View className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6 mx-4">
                  {recordingDuration < 3 ? (
                    <View>
                      <Text className="text-blue-900 dark:text-blue-100 font-semibold text-base mb-1">
                        Start with WHO:
                      </Text>
                      <Text className="text-blue-700 dark:text-blue-300 text-sm">
                        Who needs to do this task? Say their name or role.
                      </Text>
                    </View>
                  ) : recordingDuration < 6 ? (
                    <View>
                      <Text className="text-blue-900 dark:text-blue-100 font-semibold text-base mb-1">
                        Now tell us WHAT:
                      </Text>
                      <Text className="text-blue-700 dark:text-blue-300 text-sm">
                        What exactly needs to be done? Be specific.
                      </Text>
                    </View>
                  ) : recordingDuration < 9 ? (
                    <View>
                      <Text className="text-blue-900 dark:text-blue-100 font-semibold text-base mb-1">
                        When should it start?
                      </Text>
                      <Text className="text-blue-700 dark:text-blue-300 text-sm">
                        Say when they should begin (e.g., "today", "next Monday").
                      </Text>
                    </View>
                  ) : (
                    <View>
                      <Text className="text-blue-900 dark:text-blue-100 font-semibold text-base mb-1">
                        How long will it take?
                      </Text>
                      <Text className="text-blue-700 dark:text-blue-300 text-sm">
                        Estimate the time needed (e.g., "2 hours", "3 days").
                      </Text>
                    </View>
                  )}
                </View>

                <View className="flex-row gap-4">
                  <Pressable
                    onPress={cancelRecording}
                    className="bg-slate-200 dark:bg-slate-700 px-6 py-3 rounded-xl"
                  >
                    <Text className="text-slate-700 dark:text-slate-300 font-semibold">
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={stopRecording}
                    className="px-6 py-3 rounded-xl"
                    style={{ backgroundColor: color }}
                  >
                    <Text className="text-white font-semibold">Done</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Floating Button */}
      <Pressable
        onPress={isRecording ? stopRecording : startRecording}
        disabled={isProcessing || hasPermission === null}
        className="rounded-full shadow-lg"
        style={{
          width: size,
          height: size,
          opacity: isProcessing ? 0.5 : 1,
        }}
      >
        {/* Pulse animation (only when inline and recording) */}
        {inline && isRecording && (
          <Animated.View
            style={[
              pulseStyle,
              {
                width: size * 1.5,
                height: size * 1.5,
                borderRadius: (size * 1.5) / 2,
                backgroundColor: color + '40',
                position: 'absolute',
                top: -(size * 0.25),
                left: -(size * 0.25),
              },
            ]}
          />
        )}

        <LinearGradient
          colors={[color, color + 'dd']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isProcessing ? (
            <Loader size={size * 0.4} color="white" />
          ) : (
            <Mic size={size * 0.4} color="white" />
          )}
        </LinearGradient>
      </Pressable>

      {/* Inline status text */}
      {inline && (isRecording || isProcessing) && (
        <Text
          className="text-xs font-semibold mt-2 text-center"
          style={{ color: color }}
        >
          {isProcessing ? 'Processing...' : `Recording ${formatDuration(recordingDuration)}`}
        </Text>
      )}
    </>
  );
}
