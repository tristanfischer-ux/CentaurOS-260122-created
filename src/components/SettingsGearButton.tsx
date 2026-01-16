/**
 * Global Settings Gear Button
 * Can be placed in any screen header to provide quick access to Settings
 */

import { Pressable, View } from 'react-native';
import { Settings } from 'lucide-react-native';
import { router } from 'expo-router';

interface SettingsGearButtonProps {
  color?: string;
  size?: number;
  style?: 'default' | 'glass' | 'solid';
}

export function SettingsGearButton({
  color = '#ffffff',
  size = 20,
  style = 'default'
}: SettingsGearButtonProps) {
  const handlePress = () => {
    router.push('/(tabs)/settings');
  };

  if (style === 'glass') {
    return (
      <Pressable
        onPress={handlePress}
        className="bg-white/20 p-2.5 rounded-full active:opacity-70"
      >
        <Settings size={size} color={color} />
      </Pressable>
    );
  }

  if (style === 'solid') {
    return (
      <Pressable
        onPress={handlePress}
        className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-full active:opacity-70"
      >
        <Settings size={size} color="#64748b" />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      className="p-2 active:opacity-70"
    >
      <Settings size={size} color={color} />
    </Pressable>
  );
}
