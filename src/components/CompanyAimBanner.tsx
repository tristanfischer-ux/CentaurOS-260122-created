/**
 * Company Aim Banner
 *
 * Displays the company's high-level aim at the top of key screens
 * to remind everyone what the company is ultimately trying to achieve.
 */

import { View, Text, Pressable } from 'react-native';
import { Target } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCompanyAimStore } from '@/lib/state/company-aim-store';

interface CompanyAimBannerProps {
  workspaceId: string;
  onEdit: () => void;
}

/**
 * Company Aim Display Banner
 * Shows the company aim in a prominent purple gradient banner
 */
export function CompanyAimBanner({ workspaceId, onEdit }: CompanyAimBannerProps) {
  const aim = useCompanyAimStore((s) => s.getAimByWorkspace(workspaceId));

  if (!aim) return null;

  return (
    <Pressable onPress={onEdit} className="active:opacity-70 mb-4">
      <LinearGradient
        colors={['#8b5cf6', '#6366f1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 12, padding: 16 }}
      >
        <View className="flex-row items-center mb-2">
          <View className="w-8 h-8 bg-white/20 rounded-lg items-center justify-center">
            <Target size={16} color="#fff" />
          </View>
          <Text className="text-white/70 text-xs font-bold ml-2">COMPANY AIM</Text>
        </View>
        <Text className="text-white font-bold text-base leading-snug">
          {aim.aim}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}
