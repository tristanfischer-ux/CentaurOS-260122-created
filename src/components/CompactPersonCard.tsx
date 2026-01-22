/**
 * CompactPersonCard
 *
 * Progressive disclosure person card with 3 states:
 * 1. Collapsed: Name, role, capacity indicator
 * 2. Expanded Preview: + Current tasks, squad, performance modifiers
 * 3. Full Detail Modal: Complete person details with horizontal swipe
 */

import { View, Text, Pressable } from 'react-native';
import { useState } from 'react';
import {
  Crown,
  Briefcase,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Edit3,
  Users,
  Zap,
  UsersRound,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react-native';
import { type OrganizationMember } from '@/lib/organization-seed';
import { type WorkPlan } from '@/lib/state/work-plan-store';

interface CompactPersonCardProps {
  member: OrganizationMember;
  workPlans: WorkPlan[];
  onPress: () => void;
  onFullDetailPress: () => void;
  isSelected?: boolean;
}

const ROLE_COLORS: Record<string, string> = {
  Founder: '#8b5cf6',
  FractionalExec: '#3b82f6',
  Apprentice: '#10b981',
};

const ROLE_ICONS = {
  Founder: Crown,
  FractionalExec: Briefcase,
  Apprentice: GraduationCap,
};

const ROLE_LABELS = {
  Founder: 'Founder',
  FractionalExec: 'Executive',
  Apprentice: 'Apprentice',
};

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

export function CompactPersonCard({
  member,
  workPlans,
  onPress,
  onFullDetailPress,
  isSelected
}: CompactPersonCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const roleColor = ROLE_COLORS[member.role as keyof typeof ROLE_COLORS] || '#64748b';
  const RoleIcon = ROLE_ICONS[member.role as keyof typeof ROLE_ICONS] || Users;

  // Calculate utilization
  const totalCapacity = member.role === 'Founder' || member.role === 'Apprentice'
    ? 15
    : ((member.daysPerWeek || 2) * 2) + Math.min((5 - (member.daysPerWeek || 2)) * 2, 10);

  const allocated = workPlans
    .filter(wp => wp.status !== 'completed' && wp.status !== 'abandoned')
    .reduce((sum, wp) => {
      const allocation = wp.allocations?.find(a => a.memberId === member.id);
      return sum + (allocation?.squaresPerWeek || 0);
    }, 0);

  const utilizationPercent = totalCapacity > 0 ? Math.round((allocated / totalCapacity) * 100) : 0;
  const available = totalCapacity - allocated;

  // Get member's current tasks
  const memberTasks = workPlans.filter(wp =>
    (wp.status === 'in-progress' || wp.status === 'not-started' || wp.status === 'blocked') &&
    (wp.assignedMemberIds?.includes(member.id) || wp.allocations?.some(a => a.memberId === member.id))
  );

  const activeTasks = memberTasks.filter(t => t.status === 'in-progress');
  const blockedTasks = memberTasks.filter(t => t.status === 'blocked');

  // Toggle expand/collapse on card press
  const handleCardPress = () => {
    setIsExpanded(prev => !prev);
    onPress();
  };

  // Open full detail modal
  const handleViewDetailsPress = (e: any) => {
    e.stopPropagation();
    onFullDetailPress();
  };

  return (
    <Pressable
      onPress={handleCardPress}
      className={`bg-white dark:bg-slate-800 rounded-xl p-3 mb-2 ${
        isSelected ? 'border-2 border-blue-500' : isExpanded ? 'border-2 border-blue-300 dark:border-blue-700' : 'border border-gray-200 dark:border-slate-700'
      } active:opacity-90`}
      style={{ borderLeftWidth: 4, borderLeftColor: roleColor }}
    >
      {/* COLLAPSED VIEW - Always visible */}
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-3">
          <View className="flex-row items-center gap-2 mb-1">
            {/* Avatar */}
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: roleColor + '20' }}
            >
              <Text style={{ color: roleColor }} className="font-bold text-sm">
                {getInitials(member.name)}
              </Text>
            </View>

            {/* Name & Role */}
            <View className="flex-1">
              <Text className="text-gray-900 dark:text-white font-semibold text-sm" numberOfLines={1}>
                {member.name}
              </Text>
              <View className="flex-row items-center gap-1">
                <RoleIcon size={10} color={roleColor} />
                <Text className="text-gray-500 dark:text-slate-400 text-xs">
                  {ROLE_LABELS[member.role as keyof typeof ROLE_LABELS]} • {member.function}
                </Text>
              </View>
            </View>

            {/* Expand/Collapse indicator */}
            {isExpanded ? (
              <ChevronUp size={16} color="#94a3b8" />
            ) : (
              <ChevronDown size={16} color="#94a3b8" />
            )}
          </View>

          {/* Capacity mini bar */}
          <View className="flex-row items-center gap-2 mt-1">
            <View
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: utilizationPercent > 100 ? '#ef4444' :
                  utilizationPercent > 80 ? '#f59e0b' : '#10b981',
              }}
            />
            <View className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <View
                className="h-full"
                style={{
                  width: `${Math.min(utilizationPercent, 100)}%`,
                  backgroundColor: utilizationPercent > 100 ? '#ef4444' :
                    utilizationPercent > 80 ? '#f59e0b' : roleColor
                }}
              />
            </View>
            <Text className="text-gray-500 dark:text-slate-400 text-xs">
              {allocated}/{totalCapacity} TU
            </Text>
          </View>
        </View>
      </View>

      {/* EXPANDED PREVIEW - Shows on first tap */}
      {isExpanded && (
        <View className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700">
          {/* Current Tasks */}
          <View className="mb-3">
            <Text className="text-gray-500 dark:text-slate-400 text-[10px] font-bold mb-2">
              CURRENT TASKS ({memberTasks.length})
            </Text>
            {memberTasks.length === 0 ? (
              <View className="bg-gray-50 dark:bg-slate-900 rounded-lg p-3">
                <Text className="text-gray-500 dark:text-slate-400 text-xs text-center">
                  No active tasks assigned
                </Text>
              </View>
            ) : (
              <View className="gap-1">
                {memberTasks.slice(0, 3).map(task => {
                  const allocation = task.allocations?.find(a => a.memberId === member.id);
                  const TaskIcon = task.status === 'in-progress' ? Clock :
                    task.status === 'blocked' ? AlertTriangle : CheckCircle2;
                  const taskColor = task.status === 'in-progress' ? '#3b82f6' :
                    task.status === 'blocked' ? '#ef4444' : '#64748b';

                  return (
                    <View
                      key={task.id}
                      className="flex-row items-center gap-2 bg-gray-50 dark:bg-slate-900 rounded-lg p-2"
                    >
                      <TaskIcon size={12} color={taskColor} />
                      <Text className="flex-1 text-gray-900 dark:text-white text-xs" numberOfLines={1}>
                        {task.title}
                      </Text>
                      <Text className="text-gray-500 dark:text-slate-400 text-[10px]">
                        {allocation?.squaresPerWeek || 0}□/wk
                      </Text>
                    </View>
                  );
                })}
                {memberTasks.length > 3 && (
                  <Text className="text-gray-500 dark:text-slate-400 text-[10px] text-center mt-1">
                    +{memberTasks.length - 3} more tasks
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Performance Modifiers */}
          {(member.teamLeadershipMultiplier || member.collaborationMultiplier || member.aiProficiencyMultiplier) && (
            <View className="mb-3">
              <Text className="text-gray-500 dark:text-slate-400 text-[10px] font-bold mb-2">
                PERFORMANCE MODIFIERS
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {member.teamLeadershipMultiplier && member.teamLeadershipMultiplier !== 1 && (
                  <View className="flex-row items-center gap-1 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded-full">
                    <UsersRound size={10} color="#8b5cf6" />
                    <Text className="text-purple-600 dark:text-purple-400 text-[10px] font-bold">
                      {member.teamLeadershipMultiplier}x Leadership
                    </Text>
                  </View>
                )}
                {member.collaborationMultiplier && member.collaborationMultiplier !== 1 && (
                  <View className="flex-row items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                    <Users size={10} color="#3b82f6" />
                    <Text className="text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                      {member.collaborationMultiplier}x Collab
                    </Text>
                  </View>
                )}
                {member.aiProficiencyMultiplier && member.aiProficiencyMultiplier !== 1 && (
                  <View className="flex-row items-center gap-1 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-full">
                    <Zap size={10} color="#f59e0b" />
                    <Text className="text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                      {member.aiProficiencyMultiplier}x AI
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Capacity Details */}
          <View className="flex-row items-center justify-between bg-gray-50 dark:bg-slate-900 rounded-lg p-2 mb-3">
            <View>
              <Text className="text-gray-500 dark:text-slate-400 text-[9px]">Total Capacity</Text>
              <Text className="text-gray-900 dark:text-white text-xs font-bold">
                {totalCapacity} TU/wk
              </Text>
            </View>
            <View>
              <Text className="text-gray-500 dark:text-slate-400 text-[9px]">Allocated</Text>
              <Text style={{ color: roleColor }} className="text-xs font-bold">
                {allocated} TU
              </Text>
            </View>
            <View>
              <Text className="text-gray-500 dark:text-slate-400 text-[9px]">Available</Text>
              <Text className="text-gray-900 dark:text-white text-xs font-bold">
                {available} TU
              </Text>
            </View>
            <View>
              <Text className="text-gray-500 dark:text-slate-400 text-[9px]">Utilization</Text>
              <Text className="text-gray-900 dark:text-white text-xs font-bold">
                {utilizationPercent}%
              </Text>
            </View>
          </View>

          {/* View Details button */}
          <Pressable
            onPress={handleViewDetailsPress}
            className="bg-blue-500 rounded-lg py-2.5 flex-row items-center justify-center gap-2 active:opacity-80"
          >
            <Edit3 size={16} color="#fff" />
            <Text className="text-white font-semibold text-sm">View Full Details</Text>
          </Pressable>

          {/* Collapse hint */}
          <Text className="text-center text-gray-400 dark:text-slate-500 text-[9px] mt-2">
            Tap card to collapse
          </Text>
        </View>
      )}
    </Pressable>
  );
}
