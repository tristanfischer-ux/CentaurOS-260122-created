/**
 * DualBottomDrawers Component
 * Side-by-side resource pool and task timeline drawers
 * Saves vertical space by placing drawers horizontally
 */

import { View, Text, Pressable, ScrollView, Dimensions } from 'react-native';
import { useMemo, useState } from 'react';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import {
  ChevronUp,
  ChevronDown,
  Users,
  Calendar,
  Clock,
  AlertTriangle,
} from 'lucide-react-native';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useWorkPlanStore, type WorkPlan } from '@/lib/state/work-plan-store';
import { type OrganizationMember } from '@/lib/organization-seed';
import { PersonDetailsModal } from './PersonDetailsModal';
import { MiniGanttChart } from './MiniGanttChart';
import { useTheme } from '@/lib/ThemeContext';
import { RoleAvatar, getInitials, ROLE_COLORS } from './Avatar';

const getCapacityPerWeek = (member: OrganizationMember): { normal: number; overtime: number } => {
  if (member.role === 'Founder' || member.role === 'Apprentice') {
    return { normal: 10, overtime: 5 };
  }
  const daysPerWeek = member.daysPerWeek || 2;
  const normalSquares = daysPerWeek * 2;
  const overtimeSquares = Math.min((5 - daysPerWeek) * 2, 10);
  return { normal: normalSquares, overtime: overtimeSquares };
};

const getAllocatedTUs = (memberId: string, workPlans: WorkPlan[]): number => {
  return workPlans
    .filter(wp => wp.status !== 'completed' && wp.status !== 'abandoned')
    .reduce((total, wp) => {
      const allocation = wp.allocations.find(a => a.memberId === memberId);
      return total + (allocation?.squaresPerWeek || 0);
    }, 0);
};

interface DualBottomDrawersProps {
  onTaskPress?: (taskId: string) => void;
}

export function DualBottomDrawers({ onTaskPress }: DualBottomDrawersProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const drawerWidth = (screenWidth - 24) / 2; // 8px padding on each side + 8px gap

  // Left drawer state (Resource Pool)
  const [leftExpanded, setLeftExpanded] = useState(false);
  const leftHeight = useSharedValue(64);

  // Right drawer state (Timeline)
  const [rightExpanded, setRightExpanded] = useState(false);
  const rightHeight = useSharedValue(64);

  // Store data
  const allMembers = useOrganizationStore(s => s.members);
  const workPlans = useWorkPlanStore(s => s.workPlans);

  // Modal state
  const [showPersonModal, setShowPersonModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null);

  // Filtered members
  const members = useMemo(() =>
    allMembers.filter(m => m.status === 'active'),
    [allMembers]
  );

  // Active tasks
  const activeTasks = useMemo(() =>
    workPlans.filter(wp => wp.status !== 'completed' && wp.status !== 'abandoned'),
    [workPlans]
  );

  // Team capacity totals
  const { totalAllocated, totalUnallocated } = useMemo(() => {
    let allocated = 0;
    let total = 0;
    members.forEach((member) => {
      const capacity = getCapacityPerWeek(member);
      const totalCapacity = capacity.normal + capacity.overtime;
      const memberAllocated = getAllocatedTUs(member.id, workPlans);
      allocated += memberAllocated;
      total += totalCapacity;
    });
    return {
      totalAllocated: allocated,
      totalUnallocated: Math.max(0, total - allocated),
    };
  }, [members, workPlans]);

  // Preview tasks for collapsed timeline
  const previewTasks = useMemo(() => {
    const inProgress = workPlans.filter(wp => wp.status === 'in-progress').slice(0, 1);
    const blocked = workPlans.filter(wp => wp.status === 'blocked').slice(0, 1);
    return { inProgress, blocked };
  }, [workPlans]);

  const COLLAPSED_HEIGHT = 64;
  const MAX_EXPANDED_HEIGHT = Math.min(screenHeight * 0.45, 300);

  const leftAnimatedStyle = useAnimatedStyle(() => ({
    height: withSpring(leftHeight.value, { damping: 20, stiffness: 90 }),
  }));

  const rightAnimatedStyle = useAnimatedStyle(() => ({
    height: withSpring(rightHeight.value, { damping: 20, stiffness: 90 }),
  }));

  const toggleLeft = () => {
    const newExpanded = !leftExpanded;
    setLeftExpanded(newExpanded);
    leftHeight.value = newExpanded ? MAX_EXPANDED_HEIGHT : COLLAPSED_HEIGHT;
    // Collapse right if expanding left
    if (newExpanded && rightExpanded) {
      setRightExpanded(false);
      rightHeight.value = COLLAPSED_HEIGHT;
    }
  };

  const toggleRight = () => {
    const newExpanded = !rightExpanded;
    setRightExpanded(newExpanded);
    rightHeight.value = newExpanded ? MAX_EXPANDED_HEIGHT : COLLAPSED_HEIGHT;
    // Collapse left if expanding right
    if (newExpanded && leftExpanded) {
      setLeftExpanded(false);
      leftHeight.value = COLLAPSED_HEIGHT;
    }
  };

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 8,
        right: 8,
        flexDirection: 'row',
        gap: 8,
      }}
    >
      {/* Left Drawer - Resource Pool */}
      <Animated.View
        style={[
          leftAnimatedStyle,
          {
            flex: 1,
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 10,
            overflow: 'hidden',
          },
        ]}
      >
        {/* Header */}
        <Pressable
          onPress={toggleLeft}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: isDark ? '#334155' : '#e5e7eb',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{
                width: 28,
                height: 28,
                backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : '#f3e8ff',
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={14} color="#8b5cf6" />
            </View>
            <View>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: isDark ? '#ffffff' : '#0f172a',
                }}
              >
                Team
              </Text>
              <Text
                style={{
                  fontSize: 9,
                  color: isDark ? '#94a3b8' : '#64748b',
                }}
              >
                {totalUnallocated} TU free
              </Text>
            </View>
          </View>
          <View
            style={{
              width: 20,
              height: 20,
              backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {leftExpanded ? (
              <ChevronDown size={12} color={isDark ? '#94a3b8' : '#64748b'} />
            ) : (
              <ChevronUp size={12} color={isDark ? '#94a3b8' : '#64748b'} />
            )}
          </View>
        </Pressable>

        {/* Expanded Content */}
        {leftExpanded && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
          >
            {members.map((member) => {
              const capacity = getCapacityPerWeek(member);
              const totalCapacity = capacity.normal + capacity.overtime;
              const allocated = getAllocatedTUs(member.id, workPlans);
              const available = Math.max(0, totalCapacity - allocated);
              const roleColor = ROLE_COLORS[member.role] || '#8b5cf6';

              return (
                <Pressable
                  key={member.id}
                  onPress={() => {
                    setSelectedMember(member);
                    setShowPersonModal(true);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: isDark ? '#1e293b' : '#f1f5f9',
                  }}
                >
                  {/* Avatar */}
                  <RoleAvatar name={member.name} role={member.role} size="sm" />

                  {/* Name & Info */}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '600',
                        color: isDark ? '#ffffff' : '#0f172a',
                      }}
                      numberOfLines={1}
                    >
                      {member.name.split(' ')[0]}
                    </Text>
                    <Text
                      style={{
                        fontSize: 9,
                        color: isDark ? '#64748b' : '#94a3b8',
                      }}
                    >
                      {allocated}/{totalCapacity} TU
                    </Text>
                  </View>

                  {/* Capacity Bar */}
                  <View
                    style={{
                      width: 40,
                      height: 6,
                      backgroundColor: isDark ? '#1e293b' : '#e2e8f0',
                      borderRadius: 3,
                      overflow: 'hidden',
                    }}
                  >
                    <View
                      style={{
                        width: `${Math.min(100, (allocated / totalCapacity) * 100)}%`,
                        height: '100%',
                        backgroundColor: allocated > totalCapacity ? '#ef4444' : '#10b981',
                        borderRadius: 3,
                      }}
                    />
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {/* Collapsed Preview */}
        {!leftExpanded && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 8,
              paddingVertical: 4,
              gap: 4,
            }}
          >
            {members.slice(0, 4).map((member) => (
              <RoleAvatar
                key={member.id}
                name={member.name}
                role={member.role}
                size="xs"
                showBorder
              />
            ))}
            {members.length > 4 && (
              <Text
                style={{
                  fontSize: 9,
                  color: isDark ? '#64748b' : '#94a3b8',
                  marginLeft: 2,
                }}
              >
                +{members.length - 4}
              </Text>
            )}
          </View>
        )}
      </Animated.View>

      {/* Right Drawer - Timeline */}
      <Animated.View
        style={[
          rightAnimatedStyle,
          {
            flex: 1,
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 10,
            overflow: 'hidden',
          },
        ]}
      >
        {/* Header */}
        <Pressable
          onPress={toggleRight}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: isDark ? '#334155' : '#e5e7eb',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{
                width: 28,
                height: 28,
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe',
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Calendar size={14} color="#3b82f6" />
            </View>
            <View>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: isDark ? '#ffffff' : '#0f172a',
                }}
              >
                Timeline
              </Text>
              <Text
                style={{
                  fontSize: 9,
                  color: isDark ? '#94a3b8' : '#64748b',
                }}
              >
                {activeTasks.length} active
              </Text>
            </View>
          </View>
          <View
            style={{
              width: 20,
              height: 20,
              backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {rightExpanded ? (
              <ChevronDown size={12} color={isDark ? '#94a3b8' : '#64748b'} />
            ) : (
              <ChevronUp size={12} color={isDark ? '#94a3b8' : '#64748b'} />
            )}
          </View>
        </Pressable>

        {/* Expanded Content */}
        {rightExpanded && (
          <View style={{ flex: 1 }}>
            <MiniGanttChart
              workPlans={workPlans}
              members={allMembers}
              onTaskPress={onTaskPress}
            />
          </View>
        )}

        {/* Collapsed Preview */}
        {!rightExpanded && (
          <View style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
            {previewTasks.inProgress.length > 0 || previewTasks.blocked.length > 0 ? (
              <View style={{ gap: 4 }}>
                {previewTasks.inProgress.map((task) => (
                  <Pressable
                    key={task.id}
                    onPress={() => onTaskPress?.(task.id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff',
                      borderRadius: 6,
                      paddingHorizontal: 6,
                      paddingVertical: 4,
                    }}
                  >
                    <Clock size={10} color="#3b82f6" />
                    <Text
                      style={{
                        fontSize: 9,
                        color: isDark ? '#93c5fd' : '#1d4ed8',
                        marginLeft: 4,
                        flex: 1,
                      }}
                      numberOfLines={1}
                    >
                      {task.title}
                    </Text>
                  </Pressable>
                ))}
                {previewTasks.blocked.map((task) => (
                  <Pressable
                    key={task.id}
                    onPress={() => onTaskPress?.(task.id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2',
                      borderRadius: 6,
                      paddingHorizontal: 6,
                      paddingVertical: 4,
                    }}
                  >
                    <AlertTriangle size={10} color="#ef4444" />
                    <Text
                      style={{
                        fontSize: 9,
                        color: isDark ? '#fca5a5' : '#b91c1c',
                        marginLeft: 4,
                        flex: 1,
                      }}
                      numberOfLines={1}
                    >
                      {task.title}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text
                style={{
                  fontSize: 9,
                  color: isDark ? '#475569' : '#94a3b8',
                  textAlign: 'center',
                }}
              >
                No active tasks
              </Text>
            )}
          </View>
        )}
      </Animated.View>

      {/* Person Details Modal */}
      <PersonDetailsModal
        visible={showPersonModal}
        onClose={() => {
          setShowPersonModal(false);
          setSelectedMember(null);
        }}
        member={selectedMember}
      />
    </View>
  );
}
