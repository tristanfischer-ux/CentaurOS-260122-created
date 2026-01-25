import { View, Text, ScrollView, Pressable, Modal } from 'react-native';
import { useState } from 'react';
import { Building2, Check, ChevronDown, Bell, X } from 'lucide-react-native';
import { useTheme } from '@/lib/ThemeContext';

interface Workspace {
  id: string;
  name: string;
  role: 'Founder' | 'FractionalExec' | 'Apprentice';
  commitment?: string;
  unreadCount: number;
  isActive: boolean;
}

// DISABLED: Demo data removed for multi-tenant architecture
// Workspaces should be loaded from app-store
const DEMO_WORKSPACES: Workspace[] = [];

/* REFERENCE: Original demo data (will be migrated to use app-store)
const DEMO_WORKSPACES_ORIGINAL: Workspace[] = [
  {
    id: 'ws-1',
    name: 'My Startup',
    role: 'Founder',
    unreadCount: 5,
    isActive: true,
  },
  {
    id: 'ws-2',
    name: 'Acme Hardware Inc',
    role: 'FractionalExec',
    commitment: '2 days/week',
    unreadCount: 3,
    isActive: false,
  },
  {
    id: 'ws-3',
    name: 'TechForge Systems',
    role: 'FractionalExec',
    commitment: '2 days/week',
    unreadCount: 0,
    isActive: false,
  },
];
*/

interface WorkspaceSwitcherProps {
  currentWorkspace?: { id: string; name: string };
  onWorkspaceChange?: (workspaceId: string) => void;
}

export function WorkspaceSwitcher({ currentWorkspace, onWorkspaceChange }: WorkspaceSwitcherProps) {
  const [showModal, setShowModal] = useState(false);
  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';

  // Theme-aware colors
  const bgPrimary = isDark ? 'bg-slate-900' : isOffWhite ? 'bg-stone-50' : 'bg-gray-100';
  const bgCard = isDark ? 'bg-slate-800' : isOffWhite ? 'bg-stone-100' : 'bg-gray-200';
  const bgModal = isDark ? 'bg-slate-900' : isOffWhite ? 'bg-stone-50' : 'bg-gray-100';
  const borderColor = isDark ? 'border-slate-800' : isOffWhite ? 'border-stone-300' : 'border-gray-300';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-stone-600' : 'text-gray-600';
  const textMuted = isDark ? 'text-slate-500' : isOffWhite ? 'text-stone-500' : 'text-gray-500';
  const iconColor = isDark ? '#94a3b8' : isOffWhite ? '#78716c' : '#64748b';

  const handleSwitchWorkspace = (workspace: Workspace) => {
    setShowModal(false);
    onWorkspaceChange?.(workspace.id);
    // In real app, this would switch the active workspace context
  };

  const activeWorkspace = DEMO_WORKSPACES.find(w => w.isActive) || DEMO_WORKSPACES[0];
  const totalUnread = DEMO_WORKSPACES.reduce((sum, ws) => sum + ws.unreadCount, 0);

  return (
    <>
      {/* Workspace Selector Button */}
      <Pressable
        onPress={() => setShowModal(true)}
        className={`flex-row items-center ${bgPrimary} border ${borderColor} rounded-xl px-4 py-3 active:opacity-70`}
      >
        <View className="flex-1 flex-row items-center">
          <View className="bg-blue-500 w-8 h-8 rounded-lg items-center justify-center mr-3">
            <Building2 size={16} color="#fff" />
          </View>
          <View className="flex-1">
            <Text className={`${textPrimary} font-semibold text-sm`}>
              {activeWorkspace?.name}
            </Text>
            {activeWorkspace?.role !== 'Founder' && activeWorkspace?.commitment && (
              <Text className={`${textMuted} text-xs`}>
                {activeWorkspace.commitment}
              </Text>
            )}
          </View>
        </View>
        <View className="flex-row items-center">
          {totalUnread > 0 && (
            <View className="bg-red-500 rounded-full w-5 h-5 items-center justify-center mr-2">
              <Text className="text-white text-xs font-bold">{totalUnread}</Text>
            </View>
          )}
          <ChevronDown size={18} color={iconColor} />
        </View>
      </Pressable>

      {/* Workspace Switcher Modal */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View className="flex-1 bg-black/70 justify-center items-center px-6">
          <View className={`${bgModal} rounded-3xl w-full`} style={{ maxHeight: '70%' }}>
            <View className={`px-6 pt-6 pb-4 border-b ${borderColor}`}>
              <View className="flex-row items-center justify-between">
                <Text className={`${textPrimary} text-xl font-bold`}>
                  Switch Workspace
                </Text>
                <Pressable onPress={() => setShowModal(false)}>
                  <X size={24} color={iconColor} />
                </Pressable>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={true} className="flex-1">
              <View className="px-6 py-4">
                {DEMO_WORKSPACES.map((workspace) => (
                  <Pressable
                    key={workspace.id}
                    onPress={() => handleSwitchWorkspace(workspace)}
                    className={`mb-3 rounded-2xl p-4 border ${
                      workspace.isActive
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                        : `${bgCard} ${borderColor}`
                    } active:opacity-70`}
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <View className="flex-row items-center mb-1">
                          <Text className={`font-bold text-base ${
                            workspace.isActive
                              ? 'text-blue-900 dark:text-blue-100'
                              : textPrimary
                          }`}>
                            {workspace.name}
                          </Text>
                          {workspace.isActive && (
                            <View className="ml-2 bg-blue-500 rounded-full px-2 py-0.5">
                              <Text className="text-white text-xs font-semibold">Active</Text>
                            </View>
                          )}
                        </View>
                        <Text className={`text-sm ${
                          workspace.isActive
                            ? 'text-blue-700 dark:text-blue-300'
                            : textSecondary
                        }`}>
                          {workspace.role}
                          {workspace.commitment && ` • ${workspace.commitment}`}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        {workspace.unreadCount > 0 && (
                          <View className="flex-row items-center bg-red-500 rounded-full px-2 py-1 mr-2">
                            <Bell size={12} color="#fff" />
                            <Text className="text-white text-xs font-bold ml-1">
                              {workspace.unreadCount}
                            </Text>
                          </View>
                        )}
                        {workspace.isActive && <Check size={20} color="#3b82f6" />}
                      </View>
                    </View>
                  </Pressable>
                ))}

                <View className={`${isDark ? 'bg-blue-900/20 border-blue-800' : isOffWhite ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'} border rounded-xl p-4 mt-2`}>
                  <Text className={`${isDark ? 'text-blue-100' : isOffWhite ? 'text-amber-900' : 'text-blue-900'} font-semibold mb-2`}>
                    Multi-Company Workflows
                  </Text>
                  <Text className={`${isDark ? 'text-blue-200' : isOffWhite ? 'text-amber-800' : 'text-blue-800'} text-sm leading-5`}>
                    As a fractional executive or apprentice, you can work with multiple companies. Switch between workspaces to see tasks, OKRs, and updates for each.
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
