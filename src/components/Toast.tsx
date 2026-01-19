/**
 * Toast Notification System
 * Simple, beautiful toast notifications for success/error/info messages
 */

import { View, Text } from 'react-native';
import { useEffect, useState } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react-native';
import { successNotification, errorNotification, lightImpact } from '@/lib/haptics';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

// Global toast queue
let toastQueue: ToastMessage[] = [];
let toastListener: ((messages: ToastMessage[]) => void) | null = null;

export const showToast = (
  type: ToastType,
  title: string,
  message?: string,
  duration: number = 3000
) => {
  const id = `toast-${Date.now()}-${Math.random()}`;
  const toast: ToastMessage = { id, type, title, message, duration };

  toastQueue = [...toastQueue, toast];
  toastListener?.(toastQueue);

  // Haptic feedback
  if (type === 'success') successNotification();
  if (type === 'error') errorNotification();
  if (type === 'info') lightImpact();

  // Auto-remove after duration
  setTimeout(() => {
    toastQueue = toastQueue.filter(t => t.id !== id);
    toastListener?.(toastQueue);
  }, duration);
};

export const toast = {
  success: (title: string, message?: string, duration?: number) =>
    showToast('success', title, message, duration),
  error: (title: string, message?: string, duration?: number) =>
    showToast('error', title, message, duration),
  info: (title: string, message?: string, duration?: number) =>
    showToast('info', title, message, duration),
};

export function ToastContainer() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    toastListener = setMessages;
    return () => {
      toastListener = null;
    };
  }, []);

  return (
    <View
      className="absolute top-0 left-0 right-0 pointer-events-none"
      style={{ paddingTop: insets.top + 12, zIndex: 9999 }}
    >
      {messages.map(msg => (
        <ToastItem key={msg.id} {...msg} />
      ))}
    </View>
  );
}

function ToastItem({ id, type, title, message }: ToastMessage) {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Slide in
    translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    opacity.value = withTiming(1, { duration: 200 });

    // Slide out after delay
    const timeout = setTimeout(() => {
      translateY.value = withTiming(-100, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }, 2500);

    return () => clearTimeout(timeout);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const colors = {
    success: {
      bg: 'bg-emerald-500',
      icon: '#fff',
    },
    error: {
      bg: 'bg-red-500',
      icon: '#fff',
    },
    info: {
      bg: 'bg-blue-500',
      icon: '#fff',
    },
  };

  const Icon = type === 'success' ? CheckCircle2 : type === 'error' ? AlertCircle : Info;
  const style = colors[type];

  return (
    <Animated.View
      style={animatedStyle}
      className={`mx-4 mb-2 rounded-xl shadow-lg ${style.bg} pointer-events-auto`}
    >
      <View className="flex-row items-start p-4">
        <Icon size={20} color={style.icon} />
        <View className="flex-1 ml-3">
          <Text className="text-white font-semibold text-sm">{title}</Text>
          {message && (
            <Text className="text-white/90 text-xs mt-0.5">{message}</Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}
