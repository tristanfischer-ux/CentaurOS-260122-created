/**
 * Role Switcher Component
 * Allows users to switch between Founder, Executive, and Apprentice views
 * Updated: Founder Team label + Coming Soon for Executive/Apprentice
 */

import { View, Text, Pressable, Modal, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Building2,
  Briefcase,
  GraduationCap,
  Check,
  ChevronDown,
  X,
  Zap,
  Clock,
} from 'lucide-react-native';
import { useRoleStore, useActiveRole, type RoleView } from '@/lib/state/role-store';
import { getRoleCapabilities } from '@/lib/role-utils';

interface RoleSwitcherProps {
  compact?: boolean;
}

const ROLES: { id: RoleView; label: string; shortLabel: string; description: string; icon: any; color: string; gradient: readonly [string, string]; comingSoon?: boolean }[] = [
  {
    id: 'Founder',
    label: 'Founder & Founder Team',
    shortLabel: 'Founder',
    description: 'Full company overview with financials, strategy, and team management',
    icon: Building2,
    color: '#3b82f6',
    gradient: ['#3b82f6', '#2563eb'] as const,
    comingSoon: false,
  },
  {
    id: 'FractionalExec',
    label: 'Executive',
    shortLabel: 'Executive',
    description: 'Multi-company view with domain-specific access and time tracking',
    icon: Briefcase,
    color: '#8b5cf6',
    gradient: ['#8b5cf6', '#7c3aed'] as const,
    comingSoon: true,
  },
  {
    id: 'Apprentice',
    label: 'Apprentice',
    shortLabel: 'Apprentice',
    description: 'Task-focused view with learning resources and mentor communication',
    icon: GraduationCap,
    color: '#10b981',
    gradient: ['#10b981', '#059669'] as const,
    comingSoon: true,
  },
];

export function RoleSwitcher({ compact = false }: RoleSwitcherProps) {
  const [showModal, setShowModal] = useState(false);
  const activeRole = useActiveRole();
  const setActiveRole = useRoleStore((s) => s.setActiveRole);

  const currentRoleConfig = ROLES.find(r => r.id === activeRole) || ROLES[0];
  const Icon = currentRoleConfig.icon;

  const handleSelectRole = (roleId: RoleView) => {
    const role = ROLES.find(r => r.id === roleId);
    if (role?.comingSoon) {
      Alert.alert(
        'Coming Soon',
        `The ${role.label} view is coming soon! Stay tuned for updates.`,
        [{ text: 'OK' }]
      );
      return;
    }
    setActiveRole(roleId);
    setShowModal(false);
  };

  if (compact) {
    return (
      <>
        <Pressable
          onPress={() => setShowModal(true)}
          className="flex-row items-center gap-2 bg-white/20 px-3 py-2 rounded-full active:opacity-70"
        >
          <Icon size={16} color="white" />
          <Text className="text-white font-semibold text-sm">
            {currentRoleConfig.shortLabel}
          </Text>
          <ChevronDown size={14} color="white" />
        </Pressable>

        <RoleSwitcherModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          activeRole={activeRole}
          onSelectRole={handleSelectRole}
        />
      </>
    );
  }

  return (
    <>
      <Pressable
        onPress={() => setShowModal(true)}
        className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-4 active:opacity-70"
      >
        <View className="flex-row items-center gap-3">
          <View
            className="p-3 rounded-xl"
            style={{ backgroundColor: `${currentRoleConfig.color}20` }}
          >
            <Icon size={24} color={currentRoleConfig.color} />
          </View>
          <View className="flex-1">
            <Text className="text-slate-500 dark:text-slate-500 text-xs font-medium uppercase">
              Viewing as
            </Text>
            <Text className="text-slate-900 dark:text-white text-lg font-bold">
              {currentRoleConfig.shortLabel}
            </Text>
          </View>
          <ChevronDown size={20} color="#64748b" />
        </View>
      </Pressable>

      <RoleSwitcherModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        activeRole={activeRole}
        onSelectRole={handleSelectRole}
      />
    </>
  );
}

interface RoleSwitcherModalProps {
  visible: boolean;
  onClose: () => void;
  activeRole: RoleView;
  onSelectRole: (role: RoleView) => void;
}

function RoleSwitcherModal({ visible, onClose, activeRole, onSelectRole }: RoleSwitcherModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/70"
        onPress={onClose}
      >
        <View className="flex-1" />
        <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '80%' }}>
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl">
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <Text className="text-slate-900 dark:text-white text-xl font-bold">
                Switch View
              </Text>
              <Pressable onPress={onClose} className="p-2 active:opacity-70">
                <X size={24} color="#64748b" />
              </Pressable>
            </View>

            {/* Role Options */}
            <ScrollView className="px-6 py-4" contentContainerStyle={{ paddingBottom: 40 }}>
              <Text className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                Select a role to customize your dashboard experience
              </Text>

              <View className="gap-3">
                {ROLES.map((role) => {
                  const RoleIcon = role.icon;
                  const isActive = activeRole === role.id;
                  const isComingSoon = role.comingSoon;

                  return (
                    <Pressable
                      key={role.id}
                      onPress={() => onSelectRole(role.id)}
                      className="active:opacity-80"
                      disabled={isComingSoon}
                    >
                      <View
                        className={`rounded-2xl p-4 border-2 ${
                          isActive
                            ? 'border-transparent'
                            : isComingSoon
                            ? 'border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800/30'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                        }`}
                        style={isComingSoon ? { opacity: 0.6 } : undefined}
                      >
                        {isActive ? (
                          <LinearGradient
                            colors={role.gradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{
                              position: 'absolute',
                              left: 0,
                              right: 0,
                              top: 0,
                              bottom: 0,
                              borderRadius: 14,
                            }}
                          />
                        ) : null}

                        <View className="flex-row items-center gap-3">
                          <View
                            className={`p-3 rounded-xl ${
                              isActive ? 'bg-white/20' : ''
                            }`}
                            style={!isActive ? { backgroundColor: `${role.color}20` } : undefined}
                          >
                            <RoleIcon
                              size={24}
                              color={isActive ? 'white' : role.color}
                            />
                          </View>
                          <View className="flex-1">
                            <View className="flex-row items-center gap-2">
                              <Text
                                className={`text-lg font-bold ${
                                  isActive ? 'text-white' : 'text-slate-900 dark:text-white'
                                }`}
                              >
                                {role.label}
                              </Text>
                              {isComingSoon && (
                                <View className="bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full flex-row items-center gap-1">
                                  <Clock size={10} color="#f59e0b" />
                                  <Text className="text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                                    COMING SOON
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Text
                              className={`text-sm mt-0.5 ${
                                isActive ? 'text-white/80' : 'text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {role.description}
                            </Text>
                          </View>
                          {isActive && (
                            <View className="bg-white/20 p-2 rounded-full">
                              <Check size={20} color="white" />
                            </View>
                          )}
                        </View>

                        {/* Show capabilities for active role */}
                        {isActive && (
                          <View className="mt-3 pt-3 border-t border-white/20">
                            <View className="flex-row items-center gap-1 mb-2">
                              <Zap size={14} color="white" />
                              <Text className="text-white/90 text-xs font-semibold uppercase">
                                You can:
                              </Text>
                            </View>
                            {getRoleCapabilities(role.id as any).slice(0, 3).map((capability, idx) => (
                              <Text key={idx} className="text-white/80 text-xs mb-1">
                                • {capability}
                              </Text>
                            ))}
                            {getRoleCapabilities(role.id as any).length > 3 && (
                              <Text className="text-white/70 text-xs mt-1">
                                + {getRoleCapabilities(role.id as any).length - 3} more capabilities
                              </Text>
                            )}
                          </View>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* Info Note */}
              <View className="mt-6 bg-slate-100 dark:bg-slate-800 rounded-xl p-4">
                <View className="flex-row items-start gap-2">
                  <View className="mt-0.5">
                    <Zap size={16} color="#64748b" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-900 dark:text-white text-sm font-semibold mb-1">
                      Role-Based Views
                    </Text>
                    <Text className="text-slate-600 dark:text-slate-400 text-sm">
                      Each role shows a customized dashboard. You'll see only what's relevant for your responsibilities.
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
