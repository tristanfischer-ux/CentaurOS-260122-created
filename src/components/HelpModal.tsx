import { View, Text, ScrollView, Pressable, Modal } from 'react-native';
import { X, HelpCircle, Lightbulb, CheckCircle2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export interface HelpContent {
  title: string;
  subtitle: string;
  description: string;
  tips: string[];
  quickActions?: { label: string; description: string }[];
}

interface HelpModalProps {
  visible: boolean;
  onClose: () => void;
  content: HelpContent;
  gradientColors?: [string, string];
}

export function HelpModal({ visible, onClose, content, gradientColors = ['#3b82f6', '#8b5cf6'] }: HelpModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-slate-950">
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24 }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center">
              <HelpCircle size={24} color="#fff" />
            </View>
            <Pressable
              onPress={onClose}
              className="w-10 h-10 bg-white/20 rounded-full items-center justify-center active:opacity-70"
            >
              <X size={20} color="#fff" />
            </Pressable>
          </View>
          <Text className="text-white text-2xl font-black">{content.title}</Text>
          <Text className="text-white/80 text-base mt-1">{content.subtitle}</Text>
        </LinearGradient>

        <ScrollView className="flex-1 px-6 py-6" showsVerticalScrollIndicator={false}>
          {/* Description */}
          <View className="mb-6">
            <Text className="text-white/90 text-base leading-6">
              {content.description}
            </Text>
          </View>

          {/* Tips Section */}
          <View className="mb-6">
            <View className="flex-row items-center mb-4">
              <Lightbulb size={20} color="#fbbf24" />
              <Text className="text-white font-bold text-lg ml-2">Tips & Best Practices</Text>
            </View>
            <View className="bg-white/5 border border-white/10 rounded-2xl p-4">
              {content.tips.map((tip, idx) => (
                <View key={idx} className={`flex-row items-start ${idx > 0 ? 'mt-3 pt-3 border-t border-white/10' : ''}`}>
                  <CheckCircle2 size={18} color="#22c55e" style={{ marginTop: 2 }} />
                  <Text className="text-white/80 text-sm ml-3 flex-1 leading-5">
                    {tip}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Quick Actions Section */}
          {content.quickActions && content.quickActions.length > 0 && (
            <View className="mb-6">
              <Text className="text-white font-bold text-lg mb-4">What You Can Do Here</Text>
              {content.quickActions.map((action, idx) => (
                <View
                  key={idx}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 mb-3"
                >
                  <Text className="text-white font-bold text-base mb-1">{action.label}</Text>
                  <Text className="text-white/60 text-sm leading-5">{action.description}</Text>
                </View>
              ))}
            </View>
          )}

          <View className="h-20" />
        </ScrollView>

        {/* Got It Button */}
        <View className="px-6 pb-8">
          <Pressable
            onPress={onClose}
            className="bg-blue-500 rounded-2xl py-4 items-center active:opacity-80"
          >
            <Text className="text-white font-bold text-base">Got It!</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// Help button component for consistent styling
interface HelpButtonProps {
  onPress: () => void;
  color?: string;
}

export function HelpButton({ onPress, color = '#fff' }: HelpButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className="w-10 h-10 bg-white/20 rounded-full items-center justify-center active:opacity-70"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <HelpCircle size={20} color={color} />
    </Pressable>
  );
}
