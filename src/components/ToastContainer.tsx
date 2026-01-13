/**
 * Toast Notification Component
 * In-app toast notifications for immediate feedback
 */

import { View, Text, Animated, Dimensions } from 'react-native';
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';
import { HapticPressable } from './HapticPressable';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react-native';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = Date.now().toString() + Math.random().toString();
    const duration = toast.duration ?? 4000;

    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clearAll: () => set({ toasts: [] }),
}));

/**
 * Helper to show toasts
 */
export const showToast = {
  success: (title: string, message?: string, duration?: number) => {
    useToastStore.getState().addToast({ type: 'success', title, message, duration });
  },
  error: (title: string, message?: string, duration?: number) => {
    useToastStore.getState().addToast({ type: 'error', title, message, duration });
  },
  info: (title: string, message?: string, duration?: number) => {
    useToastStore.getState().addToast({ type: 'info', title, message, duration });
  },
  warning: (title: string, message?: string, duration?: number) => {
    useToastStore.getState().addToast({ type: 'warning', title, message, duration });
  },
};

/**
 * Individual Toast Item
 */
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss());
  };

  const getConfig = () => {
    switch (toast.type) {
      case 'success':
        return {
          icon: CheckCircle2,
          iconColor: '#10b981',
          bgColor: 'bg-emerald-50 dark:bg-emerald-900/90',
          borderColor: 'border-emerald-200 dark:border-emerald-700',
        };
      case 'error':
        return {
          icon: AlertCircle,
          iconColor: '#ef4444',
          bgColor: 'bg-red-50 dark:bg-red-900/90',
          borderColor: 'border-red-200 dark:border-red-700',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconColor: '#f59e0b',
          bgColor: 'bg-amber-50 dark:bg-amber-900/90',
          borderColor: 'border-amber-200 dark:border-amber-700',
        };
      case 'info':
        return {
          icon: Info,
          iconColor: '#3b82f6',
          bgColor: 'bg-blue-50 dark:bg-blue-900/90',
          borderColor: 'border-blue-200 dark:border-blue-700',
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <Animated.View
      style={{
        transform: [{ translateY }],
        opacity,
        marginBottom: 8,
      }}
    >
      <View className={`${config.bgColor} border ${config.borderColor} rounded-2xl p-4 shadow-lg flex-row items-start`}>
        <View className="mr-3">
          <Icon size={24} color={config.iconColor} />
        </View>

        <View className="flex-1">
          <Text className="text-gray-900 dark:text-white font-bold text-base mb-0.5">
            {toast.title}
          </Text>
          {toast.message && (
            <Text className="text-gray-700 dark:text-slate-300 text-sm">
              {toast.message}
            </Text>
          )}
        </View>

        <HapticPressable onPress={dismiss} className="ml-2">
          <X size={20} color="#64748b" />
        </HapticPressable>
      </View>
    </Animated.View>
  );
}

/**
 * Toast Container - Add this to your root layout
 */
export function ToastContainer() {
  const insets = useSafeAreaInsets();
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: insets.top + 8,
        left: 16,
        right: 16,
        zIndex: 9999,
        pointerEvents: 'box-none',
      }}
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => removeToast(toast.id)}
        />
      ))}
    </View>
  );
}
