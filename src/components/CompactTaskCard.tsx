/**
 * CompactTaskCard
 *
 * Progressive disclosure task card with 3 states:
 * 1. Collapsed: Title, status, small capacity indicator
 * 2. Expanded Preview: + Assigned people, squad, capacity details
 * 3. Full Detail Modal: Complete editing interface
 */

import { View, Text, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import { Clock, Users as UsersIcon, CheckCircle2, AlertTriangle, Circle, ChevronDown, ChevronUp, Edit3, Calendar, UserPlus } from 'lucide-react-native';
import { type WorkPlan, useWorkPlanStore } from '@/lib/state/work-plan-store';
import { type OrganizationMember } from '@/lib/organization-seed';
import { useSquadStore } from '@/lib/state/squad-store';
import { RescheduleDateButtons } from './RescheduleDateButtons';

interface CompactTaskCardProps {
  task: WorkPlan;
  assignedMembers?: OrganizationMember[];
  onPress: () => void;
  onFullDetailPress: () => void;
  isSelected?: boolean;
  onAddResourcePress?: () => void; // Callback when "Add Person" is pressed
}

const ROLE_COLORS: Record<string, string> = {
  Founder: '#8b5cf6',
  FractionalExec: '#3b82f6',
  Apprentice: '#10b981',
};

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

export function CompactTaskCard({
  task,
  assignedMembers: assignedMembersProp,
  onPress,
  onFullDetailPress,
  isSelected,
  onAddResourcePress,
}: CompactTaskCardProps) {
  // Ensure assignedMembers is always an array, even if undefined is passed
  const assignedMembers = assignedMembersProp ?? [];
  const [isExpanded, setIsExpanded] = useState(false);
  const getSquadsByTask = useSquadStore(s => s.getSquadsByTask);
  const updateWorkPlan = useWorkPlanStore(s => s.updateWorkPlan);

  const squads = getSquadsByTask(task.id);

  // Calculate allocated TU per week
  const allocatedPerWeek = task.allocations?.reduce((sum, alloc) => sum + (alloc.squaresPerWeek || 0), 0) || 0;

  // Status icon
  const StatusIcon = task.status === 'in-progress' ? Clock :
                     task.status === 'completed' ? CheckCircle2 :
                     task.status === 'blocked' ? AlertTriangle : Circle;

  const statusColor = task.status === 'in-progress' ? '#3b82f6' :
                      task.status === 'completed' ? '#10b981' :
                      task.status === 'blocked' ? '#ef4444' : '#64748b';

  // Toggle expand/collapse on card press
  const handleCardPress = () => {
    setIsExpanded(prev => !prev);
    onPress();
  };

  // Open full detail modal
  const handleEditPress = () => {
    onFullDetailPress();
  };

  return (
    <Pressable
      onPress={handleCardPress}
      className={`bg-white dark:bg-slate-800 rounded-xl p-3 mb-2 border-2 ${
        isSelected ? 'border-blue-500' : isExpanded ? 'border-blue-300 dark:border-blue-700' : 'border-gray-200 dark:border-slate-700'
      } active:opacity-90`}
    >
      {/* COLLAPSED VIEW - Always visible */}
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-3">
          <View className="flex-row items-center gap-2 mb-1">
            <StatusIcon size={14} color={statusColor} />
            <Text className="text-gray-900 dark:text-white font-semibold text-sm flex-1" numberOfLines={1}>
              {task.title}
            </Text>
            {/* Expand/Collapse indicator */}
            {isExpanded ? (
              <ChevronUp size={16} color="#94a3b8" />
            ) : (
              <ChevronDown size={16} color="#94a3b8" />
            )}
          </View>

          <View className="flex-row items-center gap-2">
            <View
              className="px-1.5 py-0.5 rounded"
              style={{ backgroundColor: statusColor + '20' }}
            >
              <Text className="text-[10px] font-bold" style={{ color: statusColor }}>
                {task.status.toUpperCase()}
              </Text>
            </View>

            <View className="bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
              <Text className="text-gray-600 dark:text-slate-400 text-[10px] font-semibold">
                {allocatedPerWeek}□/wk
              </Text>
            </View>

            <View className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-full h-1 overflow-hidden">
              <View
                className="h-full"
                style={{
                  width: `${task.progress}%`,
                  backgroundColor: statusColor
                }}
              />
            </View>
            <Text className="text-gray-500 dark:text-slate-400 text-[10px]">
              {task.progress}%
            </Text>
          </View>
        </View>

        {/* Mini team indicator */}
        {assignedMembers?.length > 0 && (
          <View className="flex-row">
            {assignedMembers.slice(0, 2).map((member, idx) => (
              <View
                key={member.id}
                className="w-6 h-6 rounded-full items-center justify-center border-2 border-white dark:border-slate-800"
                style={{
                  backgroundColor: ROLE_COLORS[member.role] || '#64748b',
                  marginLeft: idx > 0 ? -6 : 0,
                  zIndex: 2 - idx
                }}
              >
                <Text className="text-white font-bold text-[8px]">
                  {getInitials(member.name)}
                </Text>
              </View>
            ))}
            {assignedMembers?.length > 2 && (
              <View
                className="w-6 h-6 rounded-full items-center justify-center bg-gray-400 border-2 border-white dark:border-slate-800"
                style={{ marginLeft: -6, zIndex: 0 }}
              >
                <Text className="text-white font-bold text-[8px]">
                  +{assignedMembers.length - 2}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* EXPANDED PREVIEW - Shows on first tap */}
      {isExpanded && (
        <View className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700">
          {/* Assigned People */}
          {assignedMembers?.length > 0 && (
            <View className="mb-2">
              <Text className="text-gray-500 dark:text-slate-400 text-[10px] font-bold mb-1">
                TEAM ({assignedMembers.length})
              </Text>
              <View className="flex-row flex-wrap gap-1">
                {assignedMembers.map(member => {
                  const allocation = task.allocations?.find(a => a.memberId === member.id);
                  return (
                    <View
                      key={member.id}
                      className="flex-row items-center gap-1 px-2 py-1 rounded-full"
                      style={{ backgroundColor: (ROLE_COLORS[member.role] || '#64748b') + '20' }}
                    >
                      <Text
                        className="text-[10px] font-semibold"
                        style={{ color: ROLE_COLORS[member.role] || '#64748b' }}
                      >
                        {member.name.split(' ')[0]}
                      </Text>
                      <Text className="text-gray-500 dark:text-slate-400 text-[9px]">
                        {allocation?.squaresPerWeek || 0}□
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Squads */}
          {squads.length > 0 && (
            <View className="mb-2">
              <Text className="text-gray-500 dark:text-slate-400 text-[10px] font-bold mb-1">
                SQUADS ({squads.length})
              </Text>
              <View className="flex-row flex-wrap gap-1">
                {squads.map(squad => (
                  <View
                    key={squad.id}
                    className="flex-row items-center gap-1 px-2 py-1 rounded-full border"
                    style={{
                      borderColor: squad.color || '#8b5cf6',
                      backgroundColor: (squad.color || '#8b5cf6') + '15'
                    }}
                  >
                    <UsersIcon size={10} color={squad.color || '#8b5cf6'} />
                    <Text
                      className="text-[10px] font-semibold"
                      style={{ color: squad.color || '#8b5cf6' }}
                    >
                      {squad.name}
                    </Text>
                    <Text className="text-[8px] font-bold" style={{ color: squad.color || '#8b5cf6' }}>
                      {squad.type === 'automatic' ? 'AUTO' : 'MANUAL'}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Capacity Details */}
          <View className="flex-row items-center justify-between bg-gray-50 dark:bg-slate-900 rounded-lg p-2">
            <View>
              <Text className="text-gray-500 dark:text-slate-400 text-[9px]">Total Capacity</Text>
              <Text className="text-gray-900 dark:text-white text-xs font-bold">
                {task.estimatedTimeUnits} TU
              </Text>
            </View>
            <View>
              <Text className="text-gray-500 dark:text-slate-400 text-[9px]">Per Week</Text>
              <Text className="text-blue-600 dark:text-blue-400 text-xs font-bold">
                {allocatedPerWeek} TU
              </Text>
            </View>
            <View>
              <Text className="text-gray-500 dark:text-slate-400 text-[9px]">Progress</Text>
              <Text className="text-gray-900 dark:text-white text-xs font-bold">
                {task.progress}%
              </Text>
            </View>
          </View>

          {/* Quick Reschedule */}
          <View className="mt-3">
            <Text className="text-gray-500 dark:text-slate-400 text-[10px] font-bold mb-2">
              RESCHEDULE
            </Text>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <RescheduleDateButtons
                currentDate={task.dueDate}
                onReschedule={(newDate) => updateWorkPlan(task.id, { dueDate: newDate })}
                compact={true}
                showDateDisplay={true}
              />
            </Pressable>
          </View>

          {/* Action buttons */}
          <View className="mt-3 flex-row gap-2">
            {/* Add Person button */}
            {onAddResourcePress && (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  onAddResourcePress();
                }}
                className="flex-1 bg-emerald-500 rounded-lg py-2.5 flex-row items-center justify-center gap-2 active:opacity-80"
              >
                <UserPlus size={16} color="#fff" />
                <Text className="text-white font-semibold text-sm">Add Person</Text>
              </Pressable>
            )}

            {/* Edit button */}
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleEditPress();
              }}
              className={`${onAddResourcePress ? 'flex-1' : ''} bg-blue-500 rounded-lg py-2.5 flex-row items-center justify-center gap-2 active:opacity-80`}
            >
              <Edit3 size={16} color="#fff" />
              <Text className="text-white font-semibold text-sm">Edit Task</Text>
            </Pressable>
          </View>

          {/* Collapse hint */}
          <Text className="text-center text-gray-400 dark:text-slate-500 text-[9px] mt-2">
            Tap card to collapse
          </Text>
        </View>
      )}
    </Pressable>
  );
}
