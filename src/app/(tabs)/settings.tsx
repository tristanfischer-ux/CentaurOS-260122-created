import { View, Text, Pressable, ScrollView } from 'react-native';
import { LogOut } from 'lucide-react-native';
import { useAppStore, useCurrentUser } from '@/lib/state/app-store';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const currentUser = useCurrentUser();
  const logout = useAppStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    router.replace('/sign-in');
  };

  return (
    <ScrollView className="flex-1 bg-slate-950">
      <View className="p-4">
        <View className="bg-slate-900 rounded-2xl p-6 mb-4">
          <Text className="text-slate-400 text-sm mb-2">Logged in as</Text>
          <Text className="text-white text-lg font-semibold">{currentUser?.name}</Text>
          <Text className="text-slate-400 text-sm">{currentUser?.email}</Text>
        </View>

        <Pressable
          onPress={handleLogout}
          className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex-row items-center active:opacity-80"
        >
          <LogOut size={20} color="#ef4444" />
          <Text className="text-red-500 font-semibold ml-3">Sign Out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
