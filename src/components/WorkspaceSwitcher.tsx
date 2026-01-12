import { View, Text, ScrollView, Pressable, Modal } from 'react-native';
import { useState } from 'react';
import { Building2, Check, ChevronDown, Bell, X } from 'lucide-react-native';

interface Workspace {
  id: string;
  name: string;
  role: 'Founder' | 'FractionalExec' | 'Apprentice';
  commitment?: string;
  unreadCount: number;
  isActive: boolean;
}

// Demo workspaces
const DEMO_WORKSPACES: Workspace[] = [
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

interface WorkspaceSwitcherProps {
  currentWorkspace?: { id: string; name: string };
  onWorkspaceChange?: (workspaceId: string) => void;
}

export function WorkspaceSwitcher({ currentWorkspace, onWorkspaceChange }: WorkspaceSwitcherProps) {
  const [showModal, setShowModal] = useState(false);

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
        className="flex-row items-center bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-800 rounded-xl px-4 py-3 active:opacity-70"
      >
        <View className="flex-1 flex-row items-center">
          <View className="bg-blue-500 w-8 h-8 rounded-lg items-center justify-center mr-3">
            <Building2 size={16} color="#fff" />
          </View>
          <View className="flex-1">
            <Text className="text-gray-900 dark:text-white font-semibold text-sm">
              {activeWorkspace?.name}
            </Text>
            {activeWorkspace?.role !== 'Founder' && activeWorkspace?.commitment && (
              <Text className="text-gray-500 dark:text-slate-500 text-xs">
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
          <ChevronDown size={18} color="#64748b" />
        </View>
      </Pressable>

      {/* Workspace Switcher Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-gray-100 dark:bg-slate-900 rounded-t-3xl" style={{ maxHeight: '70%' }}>
            <View className="px-6 pt-6 pb-4 border-b border-gray-300 dark:border-slate-800">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-900 dark:text-white text-xl font-bold">
                  Switch Workspace
                </Text>
                <Pressable onPress={() => setShowModal(false)}>
                  <X size={24} color="#94a3b8" />
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
                        : 'bg-gray-200 dark:bg-slate-800 border-gray-300 dark:border-slate-700'
                    } active:opacity-70`}
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <View className="flex-row items-center mb-1">
                          <Text className={`font-bold text-base ${
                            workspace.isActive
                              ? 'text-blue-900 dark:text-blue-100'
                              : 'text-gray-900 dark:text-white'
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
                            : 'text-gray-600 dark:text-slate-400'
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

                <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mt-2">
                  <Text className="text-blue-900 dark:text-blue-100 font-semibold mb-2">
                    💡 Multi-Company Workflows
                  </Text>
                  <Text className="text-blue-800 dark:text-blue-200 text-sm leading-5">
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
