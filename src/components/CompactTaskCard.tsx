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
import { Clock, Users as UsersIcon, CheckCircle2, AlertTriangle, Circle, ChevronDown, ChevronUp, Edit3, Check, TrendingUp, Trash2, Zap } from 'lucide-react-native';
import { type WorkPlan, useWorkPlanStore } from '@/lib/state/work-plan-store';
import { type OrganizationMember } from '@/lib/organization-seed';
import { useSquadStore } from '@/lib/state/squad-store';
import { getDelayInfo, formatDelay, getDelaySeverityColor, getOriginalTimeline } from '@/lib/task-delay-tracker';
import { calculateTaskImportance } from '@/lib/task-importance';

interface CompactTaskCardProps {
  task: WorkPlan;
  assignedMembers?: OrganizationMember[];
  onPress: () => void;
  onFullDetailPress: () => void;
  isSelected?: boolean;
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
  isSelected
}: CompactTaskCardProps) {
  // Ensure assignedMembers is always an array, even if undefined is passed
  const assignedMembers = assignedMembersProp ?? [];
  const [isExpanded, setIsExpanded] = useState(false);
  const getSquadsByTask = useSquadStore(s => s.getSquadsByTask);
  const completeWorkPlan = useWorkPlanStore(s => s.completeWorkPlan);
  const deleteWorkPlan = useWorkPlanStore(s => s.deleteWorkPlan);

  const squads = getSquadsByTask(task.id);

  // Calculate allocated TU per week
  const allocatedPerWeek = task.allocations?.reduce((sum, alloc) => sum + (alloc.squaresPerWeek || 0), 0) || 0;

  // Calculate TU progress
  const totalTUs = task.estimatedTimeUnits || 0;
  const completedTUs = Math.round((task.progress / 100) * totalTUs);
  const remainingTUs = totalTUs - completedTUs;

  // Calculate estimated time to finish (in weeks)
  const weeksToFinish = allocatedPerWeek > 0 ? Math.ceil(remainingTUs / allocatedPerWeek) : null;

  // Format time to finish display
  const getTimeToFinishText = () => {
    if (task.status === 'completed') return 'Done';
    if (allocatedPerWeek === 0) return 'No allocation';
    if (remainingTUs <= 0) return 'Ready to complete';
    if (weeksToFinish === 1) return '~1 week';
    if (weeksToFinish !== null && weeksToFinish <= 4) return `~${weeksToFinish} weeks`;
    if (weeksToFinish !== null && weeksToFinish > 4) {
      const months = Math.ceil(weeksToFinish / 4);
      return `~${months} month${months > 1 ? 's' : ''}`;
    }
    return 'TBD';
  };

  // Get delay information
  const delayInfo = getDelayInfo(task);
  const delayBadgeText = formatDelay(delayInfo);
  const delaySeverityColors = getDelaySeverityColor(delayInfo.severity);
  const originalTimeline = getOriginalTimeline(task);

  // Calculate task importance
  const importance = calculateTaskImportance(task);

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

  // Mark task as complete
  const handleMarkAsDone = (e: any) => {
    e.stopPropagation();
    completeWorkPlan(task.id);
  };

  // Delete task and reallocate resources
  const handleDeleteTask = (e: any) => {
    e.stopPropagation();
    deleteWorkPlan(task.id);
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
            {/* Delay badge in collapsed view */}
            {delayInfo.isDelayed && delayBadgeText && (
              <View
                className="px-1.5 py-0.5 rounded flex-row items-center gap-0.5"
                style={{ backgroundColor: delaySeverityColors.bar }}
              >
                <AlertTriangle size={9} color="#fff" />
                <Text className="text-white text-[9px] font-bold">
                  {delayBadgeText}
                </Text>
              </View>
            )}
            {/* Importance badge */}
            {importance.level !== 'low' && (
              <View
                className="px-1.5 py-0.5 rounded flex-row items-center gap-0.5"
                style={{ backgroundColor: importance.bgColor }}
              >
                <Zap size={9} color={importance.color} fill={importance.color} />
                <Text className="text-[9px] font-bold" style={{ color: importance.color }}>
                  {importance.label}
                </Text>
              </View>
            )}
          </View>

          <View className="flex-row items-center gap-2 flex-wrap">
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
                {allocatedPerWeek} TU/wk
              </Text>
            </View>

            {/* Team avatars - prominent in collapsed view */}
            {assignedMembers.length > 0 && (
              <View className="flex-row items-center">
                {assignedMembers.slice(0, 3).map((member, idx) => (
                  <View
                    key={member.id}
                    className="w-5 h-5 rounded-full items-center justify-center border border-white dark:border-slate-800"
                    style={{
                      backgroundColor: ROLE_COLORS[member.role] || '#64748b',
                      marginLeft: idx > 0 ? -4 : 0,
                      zIndex: 10 - idx
                    }}
                  >
                    <Text className="text-white font-bold text-[7px]">
                      {getInitials(member.name)}
                    </Text>
                  </View>
                ))}
                {assignedMembers.length > 3 && (
                  <View
                    className="w-5 h-5 rounded-full items-center justify-center bg-gray-400 border border-white dark:border-slate-800"
                    style={{ marginLeft: -4, zIndex: 0 }}
                  >
                    <Text className="text-white font-bold text-[7px]">
                      +{assignedMembers.length - 3}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* TU Progress - completed/total */}
            <View className="flex-row items-center gap-0.5">
              <Text className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                {completedTUs}
              </Text>
              <Text className="text-gray-400 dark:text-slate-500 text-[10px]">/</Text>
              <Text className="text-gray-600 dark:text-slate-400 text-[10px] font-semibold">
                {totalTUs} TU
              </Text>
            </View>

            {/* Time to finish estimate */}
            <View
              className="px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: task.status === 'completed' ? '#10b98120' :
                                 allocatedPerWeek === 0 ? '#f59e0b20' :
                                 weeksToFinish !== null && weeksToFinish > 4 ? '#ef444420' : '#3b82f620'
              }}
            >
              <Text
                className="text-[10px] font-semibold"
                style={{
                  color: task.status === 'completed' ? '#10b981' :
                         allocatedPerWeek === 0 ? '#f59e0b' :
                         weeksToFinish !== null && weeksToFinish > 4 ? '#ef4444' : '#3b82f6'
                }}
              >
                {getTimeToFinishText()}
              </Text>
            </View>

            {/* Expand/Collapse indicator */}
            {isExpanded ? (
              <ChevronUp size={16} color="#94a3b8" />
            ) : (
              <ChevronDown size={16} color="#94a3b8" />
            )}
          </View>
        </View>
      </View>

      {/* EXPANDED PREVIEW - Shows on first tap */}
      {isExpanded && (
        <View className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700">
          {/* Importance Score Breakdown */}
          <View className="mb-3 bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-2">
                <Zap size={14} color={importance.color} fill={importance.color} />
                <Text className="text-slate-900 dark:text-white font-bold text-sm">
                  Importance: {importance.label}
                </Text>
              </View>
              <View
                className="px-2 py-1 rounded-lg"
                style={{ backgroundColor: importance.bgColor }}
              >
                <Text className="font-bold text-xs" style={{ color: importance.color }}>
                  {importance.score}/100
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="flex-1">
                <Text className="text-slate-500 dark:text-slate-400 text-[9px] mb-0.5">TU Size</Text>
                <Text className="text-slate-700 dark:text-slate-300 text-xs font-semibold">
                  {importance.factors.tuSize} pts
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-slate-500 dark:text-slate-400 text-[9px] mb-0.5">Deadline</Text>
                <Text className="text-slate-700 dark:text-slate-300 text-xs font-semibold">
                  {importance.factors.deadline} pts
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-slate-500 dark:text-slate-400 text-[9px] mb-0.5">Progress</Text>
                <Text className="text-slate-700 dark:text-slate-300 text-xs font-semibold">
                  {importance.factors.progress} pts
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-slate-500 dark:text-slate-400 text-[9px] mb-0.5">Status</Text>
                <Text className="text-slate-700 dark:text-slate-300 text-xs font-semibold">
                  {importance.factors.status} pts
                </Text>
              </View>
            </View>
          </View>

          {/* Date Information */}
          <View className="flex-row items-center justify-between mb-3 bg-gray-50 dark:bg-slate-900 rounded-lg p-2">
            <View className="flex-1">
              <Text className="text-gray-500 dark:text-slate-400 text-[9px]">Start Date</Text>
              <Text className="text-gray-900 dark:text-white text-xs font-semibold">
                {task.startDate ? new Date(task.startDate).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                }) : 'Not set'}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-gray-500 dark:text-slate-400 text-[9px]">Due Date</Text>
              <Text className="text-gray-900 dark:text-white text-xs font-semibold">
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                }) : 'Not set'}
              </Text>
            </View>
            {task.function && (
              <View className="flex-1">
                <Text className="text-gray-500 dark:text-slate-400 text-[9px]">Function</Text>
                <Text className="text-gray-900 dark:text-white text-xs font-semibold">
                  {task.function}
                </Text>
              </View>
            )}
          </View>

          {/* TU Allocation Summary */}
          <View className="flex-row items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 mb-3">
            <View className="flex-1">
              <Text className="text-gray-500 dark:text-slate-400 text-[9px]">Total TU Needed</Text>
              <Text className="text-gray-900 dark:text-white text-sm font-bold">
                {task.estimatedTimeUnits} TU
              </Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-gray-500 dark:text-slate-400 text-[9px]">Allocated/Week</Text>
              <Text className="text-blue-600 dark:text-blue-400 text-sm font-bold">
                {allocatedPerWeek} TU
              </Text>
            </View>
            <View className="flex-1 items-end">
              <Text className="text-gray-500 dark:text-slate-400 text-[9px]">Weeks to Complete</Text>
              <Text className="text-gray-900 dark:text-white text-sm font-bold">
                {allocatedPerWeek > 0 ? Math.ceil(task.estimatedTimeUnits / allocatedPerWeek) : '—'}
              </Text>
            </View>
          </View>

          {/* Assigned People - Detailed TU Breakdown */}
          {assignedMembers?.length > 0 && (
            <View className="mb-3">
              <Text className="text-gray-500 dark:text-slate-400 text-[10px] font-bold mb-2">
                TEAM WORKLOAD ({assignedMembers.length})
              </Text>
              <View className="gap-2">
                {assignedMembers.map(member => {
                  const allocation = task.allocations?.find(a => a.memberId === member.id);
                  const memberTUsPerWeek = allocation?.squaresPerWeek || 0;

                  // Calculate member's share of total TUs based on their allocation proportion
                  const totalAllocationPerWeek = allocatedPerWeek || 1;
                  const memberShare = memberTUsPerWeek / totalAllocationPerWeek;
                  const memberTotalTUs = Math.round(totalTUs * memberShare);
                  const memberCompletedTUs = Math.round(completedTUs * memberShare);
                  const memberRemainingTUs = memberTotalTUs - memberCompletedTUs;

                  return (
                    <View
                      key={member.id}
                      className="bg-gray-50 dark:bg-slate-900 rounded-lg p-2"
                    >
                      {/* Member header row */}
                      <View className="flex-row items-center gap-2 mb-2">
                        <View
                          className="w-7 h-7 rounded-full items-center justify-center"
                          style={{ backgroundColor: ROLE_COLORS[member.role] || '#64748b' }}
                        >
                          <Text className="text-white font-bold text-[9px]">
                            {getInitials(member.name)}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text
                            className="text-xs font-semibold"
                            style={{ color: ROLE_COLORS[member.role] || '#64748b' }}
                          >
                            {member.name}
                          </Text>
                          <Text className="text-gray-400 dark:text-slate-500 text-[9px]">
                            {member.function || member.role}
                          </Text>
                        </View>
                      </View>

                      {/* TU Stats row */}
                      <View className="flex-row items-center justify-between">
                        {/* This Week */}
                        <View className="flex-1 items-center">
                          <Text className="text-gray-400 dark:text-slate-500 text-[8px] mb-0.5">THIS WEEK</Text>
                          <View className="flex-row items-center gap-0.5">
                            <Text className="text-blue-600 dark:text-blue-400 text-sm font-bold">
                              {memberTUsPerWeek}
                            </Text>
                            <Text className="text-gray-400 dark:text-slate-500 text-[9px]">TU</Text>
                          </View>
                        </View>

                        {/* Completed */}
                        <View className="flex-1 items-center border-l border-gray-200 dark:border-slate-700">
                          <Text className="text-gray-400 dark:text-slate-500 text-[8px] mb-0.5">COMPLETED</Text>
                          <View className="flex-row items-center gap-0.5">
                            <Text className="text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                              {memberCompletedTUs}
                            </Text>
                            <Text className="text-gray-400 dark:text-slate-500 text-[9px]">TU</Text>
                          </View>
                        </View>

                        {/* Remaining */}
                        <View className="flex-1 items-center border-l border-gray-200 dark:border-slate-700">
                          <Text className="text-gray-400 dark:text-slate-500 text-[8px] mb-0.5">REMAINING</Text>
                          <View className="flex-row items-center gap-0.5">
                            <Text
                              className="text-sm font-bold"
                              style={{ color: memberRemainingTUs > 0 ? '#f59e0b' : '#10b981' }}
                            >
                              {memberRemainingTUs}
                            </Text>
                            <Text className="text-gray-400 dark:text-slate-500 text-[9px]">TU</Text>
                          </View>
                        </View>
                      </View>
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

          {/* Timeline & Delay Details */}
          {delayInfo.isDelayed && (
            <View
              className="mt-2 rounded-lg p-2"
              style={{ backgroundColor: delaySeverityColors.bar + '15' }}
            >
              <View className="flex-row items-center gap-1 mb-1.5">
                <TrendingUp size={12} color={delaySeverityColors.bar} />
                <Text
                  className="text-[10px] font-bold"
                  style={{ color: delaySeverityColors.bar }}
                >
                  TIMELINE EXTENDED
                </Text>
              </View>

              <View className="flex-row items-center justify-between">
                {/* Original Timeline */}
                <View>
                  <Text className="text-gray-500 dark:text-slate-400 text-[9px]">Original</Text>
                  <Text className="text-gray-900 dark:text-white text-[10px] font-semibold">
                    {originalTimeline.originalTUs} TU
                  </Text>
                  {delayInfo.originalEndDate && (
                    <Text className="text-gray-500 dark:text-slate-400 text-[9px]">
                      Due {delayInfo.originalEndDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </Text>
                  )}
                </View>

                {/* Arrow */}
                <Text className="text-gray-400 dark:text-slate-500 text-lg">→</Text>

                {/* Current Timeline */}
                <View>
                  <Text className="text-gray-500 dark:text-slate-400 text-[9px]">Current</Text>
                  <Text
                    className="text-[10px] font-bold"
                    style={{ color: delaySeverityColors.bar }}
                  >
                    {task.estimatedTimeUnits} TU
                    {delayInfo.tuOverrun > 0 && (
                      <Text className="text-[9px]"> (+{delayInfo.tuOverrun})</Text>
                    )}
                  </Text>
                  {delayInfo.currentEndDate && (
                    <Text
                      className="text-[9px] font-semibold"
                      style={{ color: delaySeverityColors.bar }}
                    >
                      Due {delayInfo.currentEndDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      {delayInfo.delayDays > 0 && (
                        <Text> (+{delayInfo.delayDays}d)</Text>
                      )}
                    </Text>
                  )}
                </View>

                {/* Overrun Percentage */}
                <View className="items-center">
                  <Text
                    className="text-lg font-bold"
                    style={{ color: delaySeverityColors.bar }}
                  >
                    {Math.max(delayInfo.delayPercentage, delayInfo.tuOverrunPercentage)}%
                  </Text>
                  <Text className="text-gray-500 dark:text-slate-400 text-[8px]">
                    OVER
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Action buttons */}
          {task.status !== 'completed' && task.status !== 'abandoned' && (
            <View className="gap-2 mt-3">
              <View className="flex-row gap-2">
                <Pressable
                  onPress={handleMarkAsDone}
                  className="flex-1 bg-emerald-500 rounded-lg py-2.5 flex-row items-center justify-center gap-2 active:opacity-80"
                >
                  <Check size={16} color="#fff" />
                  <Text className="text-white font-semibold text-sm">Mark as Done</Text>
                </Pressable>

                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    handleEditPress();
                  }}
                  className="flex-1 bg-blue-500 rounded-lg py-2.5 flex-row items-center justify-center gap-2 active:opacity-80"
                >
                  <Edit3 size={16} color="#fff" />
                  <Text className="text-white font-semibold text-sm">Edit Details</Text>
                </Pressable>
              </View>

              {/* Delete button - full width below */}
              <Pressable
                onPress={handleDeleteTask}
                className="bg-red-500 rounded-lg py-2.5 flex-row items-center justify-center gap-2 active:opacity-80"
              >
                <Trash2 size={16} color="#fff" />
                <Text className="text-white font-semibold text-sm">Delete & Reallocate Resources</Text>
              </Pressable>
            </View>
          )}

          {/* Edit-only button for completed/abandoned tasks */}
          {(task.status === 'completed' || task.status === 'abandoned') && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleEditPress();
              }}
              className="mt-3 bg-blue-500 rounded-lg py-2.5 flex-row items-center justify-center gap-2 active:opacity-80"
            >
              <Edit3 size={16} color="#fff" />
              <Text className="text-white font-semibold text-sm">View Details</Text>
            </Pressable>
          )}

          {/* Collapse hint */}
          <Text className="text-center text-gray-400 dark:text-slate-500 text-[9px] mt-2">
            Tap card to collapse
          </Text>
        </View>
      )}
    </Pressable>
  );
}
