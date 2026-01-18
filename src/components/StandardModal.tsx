/**
 * StandardModal Component
 *
 * A consistent modal component that follows STYLE_GUIDE.md patterns exactly.
 * Prevents common modal bugs and ensures consistent UX across the app.
 *
 * Features:
 * - Tap-outside-to-dismiss with proper stopPropagation
 * - Android back button support with onRequestClose
 * - Scrollable content with proper height constraints
 * - Consistent header with close button
 * - Optional footer for actions
 * - Keyboard handling for forms
 *
 * Usage:
 * ```tsx
 * <StandardModal
 *   visible={showModal}
 *   onClose={() => setShowModal(false)}
 *   title="Modal Title"
 * >
 *   <Text>Your content here</Text>
 * </StandardModal>
 * ```
 */

import { type ReactNode } from 'react';
import { View, Text, Modal, Pressable, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '@/lib/ThemeContext';

interface StandardModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxHeight?: number | `${number}%`;
  footer?: ReactNode;
  showCloseButton?: boolean;
}

export function StandardModal({
  visible,
  onClose,
  title,
  children,
  maxHeight = '90%',
  footer,
  showCloseButton = true,
}: StandardModalProps) {
  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Backdrop with tap-to-dismiss */}
      <Pressable
        className="flex-1 bg-black/70"
        onPress={onClose}
      >
        {/* Spacer pushes content down for slide-up animation */}
        <View className="flex-1" />

        {/* Modal content container */}
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{ maxHeight: typeof maxHeight === 'string' ? maxHeight : maxHeight }}
        >
          <View className={`${isDark ? 'bg-slate-950' : isOffWhite ? 'bg-stone-50' : 'bg-white'} rounded-t-3xl`}>
            {/* Header */}
            <View className={`flex-row items-center justify-between px-5 py-4 border-b ${isDark ? 'border-slate-800' : isOffWhite ? 'border-stone-300' : 'border-gray-200'}`}>
              <Text className={`text-lg font-bold flex-1 ${isDark ? 'text-white' : isOffWhite ? 'text-stone-900' : 'text-gray-900'}`}>
                {title}
              </Text>

              {showCloseButton && (
                <Pressable
                  onPress={onClose}
                  className={`w-9 h-9 rounded-full items-center justify-center ${isDark ? 'bg-slate-800' : isOffWhite ? 'bg-stone-200' : 'bg-gray-100'} active:opacity-70`}
                >
                  <X size={20} color={isDark ? '#fff' : isOffWhite ? '#57534e' : '#374151'} />
                </Pressable>
              )}
            </View>

            {/* Scrollable content */}
            <ScrollView
              className="px-5 py-6"
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>

            {/* Optional footer */}
            {footer && (
              <View className={`p-5 border-t ${isDark ? 'border-slate-800' : isOffWhite ? 'border-stone-300' : 'border-gray-200'}`}>
                {footer}
              </View>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/**
 * StandardCenteredModal
 *
 * A centered modal variant for confirmations, alerts, and small dialogs.
 * Fades in instead of sliding up.
 *
 * Usage:
 * ```tsx
 * <StandardCenteredModal
 *   visible={showConfirm}
 *   onClose={() => setShowConfirm(false)}
 *   title="Confirm Action"
 *   footer={
 *     <View className="flex-row gap-3">
 *       <Pressable onPress={onCancel}>Cancel</Pressable>
 *       <Pressable onPress={onConfirm}>Confirm</Pressable>
 *     </View>
 *   }
 * >
 *   <Text>Are you sure?</Text>
 * </StandardCenteredModal>
 * ```
 */
export function StandardCenteredModal({
  visible,
  onClose,
  title,
  children,
  footer,
  showCloseButton = true,
}: StandardModalProps) {
  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Backdrop with tap-to-dismiss */}
      <Pressable
        className="flex-1 bg-black/50 items-center justify-center p-6"
        onPress={onClose}
      >
        {/* Modal content container */}
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full max-w-sm"
        >
          <View className={`${isDark ? 'bg-slate-900' : isOffWhite ? 'bg-stone-50' : 'bg-white'} rounded-2xl`}>
            {/* Header */}
            <View className={`flex-row items-center justify-between p-5 border-b ${isDark ? 'border-slate-800' : isOffWhite ? 'border-stone-300' : 'border-gray-200'}`}>
              <Text className={`text-lg font-bold flex-1 ${isDark ? 'text-white' : isOffWhite ? 'text-stone-900' : 'text-gray-900'}`}>
                {title}
              </Text>

              {showCloseButton && (
                <Pressable
                  onPress={onClose}
                  className={`w-9 h-9 rounded-full items-center justify-center ${isDark ? 'bg-slate-800' : isOffWhite ? 'bg-stone-200' : 'bg-gray-100'} active:opacity-70`}
                >
                  <X size={20} color={isDark ? '#fff' : isOffWhite ? '#57534e' : '#374151'} />
                </Pressable>
              )}
            </View>

            {/* Content */}
            <View className="p-5">
              {children}
            </View>

            {/* Optional footer */}
            {footer && (
              <View className={`p-5 border-t ${isDark ? 'border-slate-800' : isOffWhite ? 'border-stone-300' : 'border-gray-200'}`}>
                {footer}
              </View>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
