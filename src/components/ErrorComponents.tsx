import { View, Text, Modal, Pressable } from 'react-native';
import { AlertTriangle, RefreshCw, X } from 'lucide-react-native';
import { useTheme } from '@/lib/ThemeContext';

interface ErrorModalProps {
  visible: boolean;
  title?: string;
  message: string;
  onClose: () => void;
  onRetry?: () => void;
}

export function ErrorModal({ visible, title = 'Error', message, onClose, onRetry }: ErrorModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 items-center justify-center p-6">
        <View className={`${isDark ? 'bg-slate-900' : 'bg-white'} rounded-2xl p-6 w-full max-w-sm`}>
          {/* Icon */}
          <View className="items-center mb-4">
            <View className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 items-center justify-center">
              <AlertTriangle size={32} color="#ef4444" />
            </View>
          </View>

          {/* Title */}
          <Text className={`${isDark ? 'text-white' : 'text-gray-900'} font-bold text-xl text-center mb-2`}>
            {title}
          </Text>

          {/* Message */}
          <Text className={`${isDark ? 'text-slate-400' : 'text-gray-600'} text-center mb-6`}>
            {message}
          </Text>

          {/* Actions */}
          <View className="gap-3">
            {onRetry && (
              <Pressable
                onPress={() => {
                  onClose();
                  onRetry();
                }}
                className="bg-purple-600 rounded-xl py-4 flex-row items-center justify-center active:opacity-70"
              >
                <RefreshCw size={20} color="#fff" />
                <Text className="text-white font-bold text-base ml-2">Try Again</Text>
              </Pressable>
            )}
            <Pressable
              onPress={onClose}
              className={`${isDark ? 'bg-slate-800' : 'bg-gray-100'} rounded-xl py-4 active:opacity-70`}
            >
              <Text className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold text-base text-center`}>
                Close
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Inline error message for forms
export function InlineError({ message }: { message: string }) {
  return (
    <View className="flex-row items-center mt-1">
      <AlertTriangle size={14} color="#ef4444" />
      <Text className="text-red-600 dark:text-red-400 text-xs ml-1">{message}</Text>
    </View>
  );
}

// Network status indicator
export function OfflineIndicator() {
  return (
    <View className="bg-red-500 py-2 px-4">
      <Text className="text-white text-center text-sm font-medium">
        No internet connection. Changes will sync when online.
      </Text>
    </View>
  );
}
