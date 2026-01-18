/**
 * ShareModal Component
 * Modal for sharing tasks with specific users, roles, or functions
 */

import { useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal, TextInput } from 'react-native';
import { X, Users, Briefcase, Building2, Check, Calendar } from 'lucide-react-native';
import type { TaskSharing, SharePermission } from '@/types/privacy';
import type { Role, Function as BusinessFunction } from '@/types';
import { useTheme } from '@/lib/ThemeContext';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { cn } from '@/lib/cn';

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  onShare: (sharing: TaskSharing) => void;
  currentSharing?: TaskSharing;
  workspaceId: string;
}

const PERMISSION_OPTIONS: {
  value: SharePermission;
  label: string;
  description: string;
}[] = [
  {
    value: 'view',
    label: 'Can View',
    description: 'Can only see the task',
  },
  {
    value: 'edit',
    label: 'Can Edit',
    description: 'Can view and modify',
  },
  {
    value: 'share',
    label: 'Can Share',
    description: 'Can view, edit, and share with others',
  },
];

const ROLE_OPTIONS: Role[] = ['Founder', 'FractionalExec', 'Apprentice'];

const FUNCTION_OPTIONS: BusinessFunction[] = [
  'Finance',
  'Sales',
  'Marketing',
  'Ops',
  'Engineering',
  'Admin',
];

export function ShareModal({
  visible,
  onClose,
  onShare,
  currentSharing,
  workspaceId,
}: ShareModalProps) {
  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';

  const members = useOrganizationStore((s) =>
    s.members.filter((m) => m.workspaceId === workspaceId && m.status === 'active')
  );

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
    currentSharing?.userIds || []
  );
  const [selectedRoles, setSelectedRoles] = useState<Role[]>(currentSharing?.roles || []);
  const [selectedFunctions, setSelectedFunctions] = useState<BusinessFunction[]>(
    currentSharing?.functions || []
  );
  const [permission, setPermission] = useState<SharePermission>(
    currentSharing?.permission || 'view'
  );
  const [expiresAt, setExpiresAt] = useState<string | undefined>(currentSharing?.expiresAt);
  const [showExpiration, setShowExpiration] = useState(!!currentSharing?.expiresAt);

  const bgPrimary = isDark ? 'bg-slate-950' : isOffWhite ? 'bg-orange-50' : 'bg-white';
  const bgCard = isDark ? 'bg-slate-900' : isOffWhite ? 'bg-white' : 'bg-white';
  const bgCardAlt = isDark ? 'bg-slate-800' : isOffWhite ? 'bg-orange-100' : 'bg-gray-100';
  const borderColor = isDark ? 'border-slate-700' : isOffWhite ? 'border-orange-200' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-orange-700' : 'text-gray-600';
  const iconColor = isDark ? '#94a3b8' : isOffWhite ? '#c2410c' : '#6b7280';

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleRole = (role: Role) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const toggleFunction = (func: BusinessFunction) => {
    setSelectedFunctions((prev) =>
      prev.includes(func) ? prev.filter((f) => f !== func) : [...prev, func]
    );
  };

  const handleShare = () => {
    const sharing: TaskSharing = {
      userIds: selectedUserIds.length > 0 ? selectedUserIds : undefined,
      roles: selectedRoles.length > 0 ? selectedRoles : undefined,
      functions: selectedFunctions.length > 0 ? selectedFunctions : undefined,
      permission,
      expiresAt: showExpiration ? expiresAt : undefined,
    };

    onShare(sharing);
    onClose();
  };

  const hasSelection =
    selectedUserIds.length > 0 || selectedRoles.length > 0 || selectedFunctions.length > 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/70" onPress={onClose}>
        <View className="flex-1" />
        <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '90%' }}>
          <View className={cn('rounded-t-3xl', bgPrimary)}>
            {/* Header */}
            <View className={cn('p-6 border-b', borderColor)}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="w-12 h-12 bg-blue-500/20 rounded-xl items-center justify-center">
                    <Users size={24} color="#3b82f6" />
                  </View>
                  <View>
                    <Text className={cn('text-xl font-bold', textPrimary)}>Share Task</Text>
                    <Text className={cn('text-xs', textSecondary)}>
                      Choose who can access this task
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={onClose}
                  className={cn('w-10 h-10 items-center justify-center rounded-full', bgCardAlt)}
                >
                  <X size={24} color={iconColor} />
                </Pressable>
              </View>
            </View>

            <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={true}>
              {/* Share with Specific People */}
              <View className="mb-6">
                <View className="flex-row items-center mb-3">
                  <Users size={18} color="#3b82f6" />
                  <Text className={cn('text-sm font-semibold ml-2', textPrimary)}>
                    Specific People
                  </Text>
                </View>

                <View className="gap-2">
                  {members.map((member) => {
                    const isSelected = selectedUserIds.includes(member.id);

                    return (
                      <Pressable
                        key={member.id}
                        onPress={() => toggleUser(member.id)}
                        className={cn(
                          'flex-row items-center p-3 rounded-xl border',
                          isSelected
                            ? 'bg-blue-500/10 border-blue-500'
                            : cn(bgCard, borderColor)
                        )}
                      >
                        <View className="flex-1">
                          <Text className={cn('font-semibold text-sm', textPrimary)}>
                            {member.name}
                          </Text>
                          <Text className={cn('text-xs', textSecondary)}>
                            {member.role} • {member.function}
                          </Text>
                        </View>
                        {isSelected && (
                          <View className="w-6 h-6 rounded-full bg-blue-500 items-center justify-center">
                            <Check size={14} color="#ffffff" />
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Share with Roles */}
              <View className="mb-6">
                <View className="flex-row items-center mb-3">
                  <Briefcase size={18} color="#8b5cf6" />
                  <Text className={cn('text-sm font-semibold ml-2', textPrimary)}>Roles</Text>
                </View>

                <View className="flex-row flex-wrap gap-2">
                  {ROLE_OPTIONS.map((role) => {
                    const isSelected = selectedRoles.includes(role);

                    return (
                      <Pressable
                        key={role}
                        onPress={() => toggleRole(role)}
                        className={cn(
                          'px-4 py-2 rounded-lg border',
                          isSelected
                            ? 'bg-violet-500/10 border-violet-500'
                            : cn(bgCardAlt, borderColor)
                        )}
                      >
                        <Text
                          className={cn(
                            'text-sm font-semibold',
                            isSelected ? 'text-violet-500' : textPrimary
                          )}
                        >
                          {role}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Share with Functions */}
              <View className="mb-6">
                <View className="flex-row items-center mb-3">
                  <Building2 size={18} color="#10b981" />
                  <Text className={cn('text-sm font-semibold ml-2', textPrimary)}>Functions</Text>
                </View>

                <View className="flex-row flex-wrap gap-2">
                  {FUNCTION_OPTIONS.map((func) => {
                    const isSelected = selectedFunctions.includes(func);

                    return (
                      <Pressable
                        key={func}
                        onPress={() => toggleFunction(func)}
                        className={cn(
                          'px-4 py-2 rounded-lg border',
                          isSelected
                            ? 'bg-emerald-500/10 border-emerald-500'
                            : cn(bgCardAlt, borderColor)
                        )}
                      >
                        <Text
                          className={cn(
                            'text-sm font-semibold',
                            isSelected ? 'text-emerald-500' : textPrimary
                          )}
                        >
                          {func}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Permission Level */}
              <View className="mb-6">
                <Text className={cn('text-sm font-semibold mb-3', textPrimary)}>
                  Permission Level
                </Text>

                <View className="gap-2">
                  {PERMISSION_OPTIONS.map((opt) => {
                    const isSelected = permission === opt.value;

                    return (
                      <Pressable
                        key={opt.value}
                        onPress={() => setPermission(opt.value)}
                        className={cn(
                          'flex-row items-center p-3 rounded-xl border',
                          isSelected
                            ? 'bg-blue-500/10 border-blue-500'
                            : cn(bgCard, borderColor)
                        )}
                      >
                        <View className="flex-1">
                          <Text
                            className={cn(
                              'font-semibold text-sm',
                              isSelected ? 'text-blue-500' : textPrimary
                            )}
                          >
                            {opt.label}
                          </Text>
                          <Text className={cn('text-xs', textSecondary)}>{opt.description}</Text>
                        </View>
                        {isSelected && (
                          <View className="w-6 h-6 rounded-full bg-blue-500 items-center justify-center">
                            <Check size={14} color="#ffffff" />
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Expiration (Optional) */}
              <View className="mb-6">
                <Pressable
                  onPress={() => setShowExpiration(!showExpiration)}
                  className="flex-row items-center mb-3"
                >
                  <Calendar size={18} color="#f59e0b" />
                  <Text className={cn('text-sm font-semibold ml-2', textPrimary)}>
                    Set Expiration (Optional)
                  </Text>
                  <View className="ml-auto">
                    <View
                      className={cn(
                        'w-12 h-6 rounded-full',
                        showExpiration ? 'bg-blue-500' : bgCardAlt
                      )}
                    >
                      <View
                        className={cn(
                          'w-5 h-5 rounded-full bg-white absolute top-0.5',
                          showExpiration ? 'right-0.5' : 'left-0.5'
                        )}
                      />
                    </View>
                  </View>
                </Pressable>

                {showExpiration && (
                  <TextInput
                    value={expiresAt || ''}
                    onChangeText={setExpiresAt}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={textSecondary}
                    className={cn(
                      'p-3 rounded-lg border',
                      bgCard,
                      borderColor,
                      textPrimary
                    )}
                  />
                )}
              </View>
            </ScrollView>

            {/* Footer */}
            <View className={cn('p-6 border-t gap-3', borderColor)}>
              <Pressable
                onPress={handleShare}
                disabled={!hasSelection}
                className={cn(
                  'py-4 rounded-xl items-center',
                  hasSelection ? 'bg-blue-500' : bgCardAlt
                )}
              >
                <Text className={cn('font-bold', hasSelection ? 'text-white' : textSecondary)}>
                  {hasSelection ? 'Share Task' : 'Select at least one option'}
                </Text>
              </Pressable>

              <Pressable onPress={onClose} className={cn('py-3 items-center')}>
                <Text className={cn('font-semibold', textSecondary)}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
