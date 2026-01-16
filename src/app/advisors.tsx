/**
 * Hard Tech Advisor Database Screen
 * Browse VCs, lawyers, accountants, and strategic advisors in the hard tech space
 */

import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Building2, HelpCircle } from 'lucide-react-native';
import { HardTechAdvisorBrowser } from '@/components/HardTechAdvisorBrowser';
import { HelpButton, type HelpContent } from '@/components/HelpModal';
import { SettingsGearButton } from '@/components/SettingsGearButton';
import { useState } from 'react';
import { HelpModal } from '@/components/HelpModal';

const ADVISOR_HELP: HelpContent = {
  title: 'Hard Tech Advisors',
  subtitle: 'VCs, lawyers, accountants, and strategic advisors',
  description: 'Comprehensive database of venture capital firms, law firms, accounting firms, and strategic advisors specializing in hard technology sectors including deep tech, climate tech, biotech, space tech, robotics, and advanced manufacturing.',
  tips: [
    'Use the search bar to find advisors by name, focus area, or specialty',
    'Filter by category (VC, Law Firm, Accounting Firm, Advisor) using the pills',
    'Tap any card to expand and see full details including specialties and key people',
    'Click "Visit Website" to open the advisor\'s website in your browser',
    'Look for check sizes and stages to find VCs that match your funding needs',
  ],
  quickActions: [
    { label: 'Search', description: 'Find advisors by name, focus, or keyword' },
    { label: 'Filter by Category', description: 'Browse VCs, lawyers, accountants, or advisors' },
    { label: 'Expand Details', description: 'Tap cards to see specialties, investments, and key people' },
    { label: 'Visit Website', description: 'Click to open advisor website in browser' },
  ],
};

export default function AdvisorDatabaseScreen() {
  const insets = useSafeAreaInsets();
  const [showHelp, setShowHelp] = useState(false);

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <HelpModal
        visible={showHelp}
        onClose={() => setShowHelp(false)}
        content={ADVISOR_HELP}
      />

      {/* Header */}
      <LinearGradient
        colors={['#10b981', '#059669', '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 12,
          paddingBottom: 16,
        }}
      >
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-white/70 text-xs font-medium uppercase tracking-wide">
              Resources
            </Text>
            <Text className="text-white text-2xl font-bold">Hard Tech Advisors</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <SettingsGearButton style="glass" />
            <HelpButton onPress={() => setShowHelp(true)} />
          </View>
        </View>

        {/* Info Card */}
        <View className="bg-white/10 rounded-xl p-4">
          <View className="flex-row items-center gap-2 mb-2">
            <Building2 size={20} color="white" />
            <Text className="text-white font-semibold">Complete Database</Text>
          </View>
          <Text className="text-white/80 text-sm">
            50+ VCs, law firms, accounting firms, and advisors specializing in deep tech, climate
            tech, biotech, space tech, robotics, and advanced manufacturing
          </Text>
        </View>
      </LinearGradient>

      {/* Browser */}
      <HardTechAdvisorBrowser />
    </View>
  );
}
