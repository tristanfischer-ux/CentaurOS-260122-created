/**
 * FilingCabinetDrawers Component
 * Two full-width drawers with offset tab handles like a filing cabinet
 * Team tab on left, Timeline tab on right
 */

import { View, Text, Pressable, ScrollView, Dimensions } from 'react-native';
import { useMemo, useState } from 'react';
import Animated, { useAnimatedStyle, withSpring, useSharedValue, interpolate, Extrapolation } from 'react-native-reanimated';
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
import { RoleAvatar, ROLE_COLORS } from './Avatar';

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

interface FilingCabinetDrawersProps {
  onTaskPress?: (taskId: string) => void;
}

export function FilingCabinetDrawers({ onTaskPress }: FilingCabinetDrawersProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const screenHeight = Dimensions.get('window').height;

  // Which drawer is expanded: 'team' | 'timeline' | null
  const [expandedDrawer, setExpandedDrawer] = useState<'team' | 'timeline' | null>(null);

  // Animated height for content area
  const contentHeight = useSharedValue(0);

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

  const COLLAPSED_HEIGHT = 0;
  const EXPANDED_HEIGHT = Math.min(screenHeight * 0.4, 280);

  const toggleDrawer = (drawer: 'team' | 'timeline') => {
    if (expandedDrawer === drawer) {
      setExpandedDrawer(null);
      contentHeight.value = withSpring(COLLAPSED_HEIGHT, { damping: 20, stiffness: 90 });
    } else {
      setExpandedDrawer(drawer);
      contentHeight.value = withSpring(EXPANDED_HEIGHT, { damping: 20, stiffness: 90 });
    }
  };

  const animatedContentStyle = useAnimatedStyle(() => ({
    height: contentHeight.value,
  }));

  const TAB_HEIGHT = 44;
  const tabBg = isDark ? '#1e293b' : '#ffffff';
  const activeTabBg = isDark ? '#0f172a' : '#f8fafc';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
      }}
    >
      {/* Tab Row - Filing Cabinet Style */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16 }}>
        {/* Team Tab - Left side */}
        <Pressable
          onPress={() => toggleDrawer('team')}
          style={{
            flex: 1,
            height: TAB_HEIGHT,
            backgroundColor: expandedDrawer === 'team' ? activeTabBg : tabBg,
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            borderWidth: 1,
            borderBottomWidth: expandedDrawer === 'team' ? 0 : 1,
            borderColor: borderColor,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 12,
            marginRight: 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: expandedDrawer === 'team' ? 0.1 : 0.05,
            shadowRadius: 4,
            elevation: expandedDrawer === 'team' ? 5 : 2,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{
                width: 24,
                height: 24,
                backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : '#f3e8ff',
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={12} color="#8b5cf6" />
            </View>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: isDark ? '#ffffff' : '#0f172a',
              }}
            >
              Team
            </Text>
            <Text
              style={{
                fontSize: 10,
                color: isDark ? '#94a3b8' : '#64748b',
                fontWeight: '500',
              }}
            >
              {totalUnallocated} TU free
            </Text>
          </View>
          {expandedDrawer === 'team' ? (
            <ChevronDown size={16} color={isDark ? '#94a3b8' : '#64748b'} />
          ) : (
            <ChevronUp size={16} color={isDark ? '#94a3b8' : '#64748b'} />
          )}
        </Pressable>

        {/* Timeline Tab - Right side */}
        <Pressable
          onPress={() => toggleDrawer('timeline')}
          style={{
            flex: 1,
            height: TAB_HEIGHT,
            backgroundColor: expandedDrawer === 'timeline' ? activeTabBg : tabBg,
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            borderWidth: 1,
            borderBottomWidth: expandedDrawer === 'timeline' ? 0 : 1,
            borderColor: borderColor,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 12,
            marginLeft: 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: expandedDrawer === 'timeline' ? 0.1 : 0.05,
            shadowRadius: 4,
            elevation: expandedDrawer === 'timeline' ? 5 : 2,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{
                width: 24,
                height: 24,
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe',
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Calendar size={12} color="#3b82f6" />
            </View>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: isDark ? '#ffffff' : '#0f172a',
              }}
            >
              Timeline
            </Text>
            <Text
              style={{
                fontSize: 10,
                color: isDark ? '#94a3b8' : '#64748b',
                fontWeight: '500',
              }}
            >
              {activeTasks.length} active
            </Text>
          </View>
          {expandedDrawer === 'timeline' ? (
            <ChevronDown size={16} color={isDark ? '#94a3b8' : '#64748b'} />
          ) : (
            <ChevronUp size={16} color={isDark ? '#94a3b8' : '#64748b'} />
          )}
        </Pressable>
      </View>

      {/* Content Area - Full Width */}
      <Animated.View
        style={[
          animatedContentStyle,
          {
            backgroundColor: activeTabBg,
            borderTopWidth: expandedDrawer ? 1 : 0,
            borderTopColor: borderColor,
            overflow: 'hidden',
          },
        ]}
      >
        {/* Team Content */}
        {expandedDrawer === 'team' && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* Capacity Summary */}
            <View
              style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                borderBottomWidth: 1,
                borderBottomColor: isDark ? '#334155' : '#e2e8f0',
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b', fontWeight: '500' }}>
                  Total Capacity
                </Text>
                <Text style={{ fontSize: 11, color: isDark ? '#ffffff' : '#0f172a', fontWeight: '600' }}>
                  {totalAllocated + totalUnallocated} TU/week
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b', fontWeight: '500' }}>
                  Allocated
                </Text>
                <Text style={{ fontSize: 11, color: isDark ? '#fbbf24' : '#d97706', fontWeight: '600' }}>
                  {totalAllocated} TU/week
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b', fontWeight: '500' }}>
                  Available
                </Text>
                <Text style={{ fontSize: 11, color: isDark ? '#10b981' : '#059669', fontWeight: '600' }}>
                  {totalUnallocated} TU/week
                </Text>
              </View>

              {/* Utilization bar */}
              <View
                style={{
                  marginTop: 12,
                  height: 8,
                  backgroundColor: isDark ? '#0f172a' : '#e2e8f0',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    width: `${Math.min(100, (totalAllocated / (totalAllocated + totalUnallocated)) * 100)}%`,
                    height: '100%',
                    backgroundColor: isDark ? '#3b82f6' : '#2563eb',
                    borderRadius: 4,
                  }}
                />
              </View>
              <Text
                style={{
                  fontSize: 9,
                  color: isDark ? '#64748b' : '#94a3b8',
                  marginTop: 4,
                  textAlign: 'center',
                }}
              >
                {Math.round((totalAllocated / (totalAllocated + totalUnallocated)) * 100)}% utilized
              </Text>
            </View>

            {/* Team Members */}
            {members.map((member) => {
              const capacity = getCapacityPerWeek(member);
              const totalCapacity = capacity.normal + capacity.overtime;
              const allocated = getAllocatedTUs(member.id, workPlans);
              const available = Math.max(0, totalCapacity - allocated);
              const roleColor = ROLE_COLORS[member.role] || '#8b5cf6';
              const isOverallocated = allocated > totalCapacity;
              const utilizationPercent = (allocated / totalCapacity) * 100;

              // Determine status
              let statusText = '';
              let statusColor = '';
              if (isOverallocated) {
                statusText = 'Overloaded';
                statusColor = '#ef4444';
              } else if (utilizationPercent >= 90) {
                statusText = 'Fully booked';
                statusColor = '#f59e0b';
              } else if (utilizationPercent >= 70) {
                statusText = 'Busy';
                statusColor = '#3b82f6';
              } else if (utilizationPercent > 0) {
                statusText = 'Available';
                statusColor = '#10b981';
              } else {
                statusText = 'Free';
                statusColor = '#6b7280';
              }

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
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: isDark ? '#1e293b' : '#f1f5f9',
                  }}
                >
                  {/* Avatar */}
                  <RoleAvatar name={member.name} role={member.role} size="md" />

                  {/* Name & Info */}
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: isDark ? '#ffffff' : '#0f172a',
                      }}
                    >
                      {member.name}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: isDark ? '#64748b' : '#94a3b8',
                        marginBottom: 4,
                      }}
                    >
                      {member.role === 'FractionalExec' ? 'Exec' : member.role} • {member.function}
                    </Text>

                    {/* Capacity Squares - Visual TU representation */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, flexWrap: 'wrap', marginTop: 2 }}>
                      {/* Allocated squares (red/coral) */}
                      {Array.from({ length: Math.min(allocated, totalCapacity) }).map((_, i) => (
                        <View
                          key={`alloc-${i}`}
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 2,
                            backgroundColor: '#ef4444', // Red for allocated
                          }}
                        />
                      ))}
                      {/* Overtime allocated squares (orange) */}
                      {isOverallocated && Array.from({ length: allocated - totalCapacity }).map((_, i) => (
                        <View
                          key={`ot-${i}`}
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 2,
                            backgroundColor: '#f97316', // Orange for overtime
                          }}
                        />
                      ))}
                      {/* Available squares (green) */}
                      {!isOverallocated && Array.from({ length: available }).map((_, i) => (
                        <View
                          key={`avail-${i}`}
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 2,
                            backgroundColor: '#22c55e', // Green for available
                          }}
                        />
                      ))}
                    </View>
                  </View>

                  {/* TU Badge */}
                  <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        backgroundColor: isOverallocated ? '#ef4444' : (available === 0 ? '#f59e0b' : '#3b82f6'),
                        borderRadius: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '700',
                          color: '#ffffff',
                        }}
                      >
                        {allocated}/{totalCapacity} TU
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 9,
                        color: statusColor,
                        fontWeight: '500',
                        marginTop: 4,
                      }}
                    >
                      {statusText}
                    </Text>
                  </View>
                </Pressable>
              );
            })}

            {/* Legend */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 10,
                gap: 12,
                borderTopWidth: 1,
                borderTopColor: isDark ? '#1e293b' : '#f1f5f9',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#22c55e' }} />
                <Text style={{ fontSize: 10, color: isDark ? '#94a3b8' : '#64748b' }}>Avail</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#ef4444' }} />
                <Text style={{ fontSize: 10, color: isDark ? '#94a3b8' : '#64748b' }}>Alloc</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#f97316' }} />
                <Text style={{ fontSize: 10, color: isDark ? '#94a3b8' : '#64748b' }}>OT</Text>
              </View>
            </View>
          </ScrollView>
        )}

        {/* Timeline Content */}
        {expandedDrawer === 'timeline' && (
          <View style={{ flex: 1 }}>
            <MiniGanttChart
              workPlans={workPlans}
              members={allMembers}
              onTaskPress={onTaskPress}
            />
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
