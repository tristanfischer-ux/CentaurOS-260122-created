/**
 * Voice Input Button
 * Floating button for voice recording with transcription
 */

import { View, Text, Pressable, Modal, Animated as RNAnimated } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
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

interface VoiceInputButtonProps {
  onTranscriptComplete: (transcript: string) => void;
  onError?: (error: string) => void;
  color?: string;
  size?: number;
}

export function VoiceInputButton({
  onTranscriptComplete,
  onError,
  color = '#3b82f6',
  size = 60,
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
        console.error('[VoiceInput] Permission error:', error);
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

      // Create and start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);
      setShowModal(true);
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
      console.error('[VoiceInput] Failed to start recording:', error);
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

      // For now, use mock transcription (placeholder for real STT API)
      // In production, you would send the audio file to a speech-to-text service
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call

      // Mock transcript based on duration
      const mockTranscript = recordingDuration < 3
        ? "Quick task example"
        : "This is a longer transcription example. Create a task to implement the user authentication flow, assign it to the engineering team, and set a deadline for next Friday.";

      console.log('[VoiceInput] Mock transcript:', mockTranscript);

      setIsProcessing(false);
      setShowModal(false);
      setRecordingDuration(0);

      onTranscriptComplete(mockTranscript);
    } catch (error) {
      console.error('[VoiceInput] Failed to stop recording:', error);
      onError?.('Failed to process recording');
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
      console.error('[VoiceInput] Failed to cancel recording:', error);
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
                <Loader size={48} color={color} className="mb-4" />
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
        onPress={startRecording}
        disabled={isRecording || isProcessing || hasPermission === null}
        className="rounded-full shadow-lg"
        style={{
          width: size,
          height: size,
          opacity: isRecording || isProcessing ? 0.5 : 1,
        }}
      >
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
          <Mic size={size * 0.4} color="white" />
        </LinearGradient>
      </Pressable>
    </>
  );
}
