/**
 * Build Queue Card Component
 *
 * Homeworld-style task card showing:
 * - Progress squares (filled/empty blocks)
 * - AI adjustment indicator
 * - Assigned people
 * - Predicted completion
 * - Quality/risk indicators
 */

import { View, Text, Pressable } from 'react-native';
import { useState } from 'react';
import {
  GripVertical,
  Clock,
  Users,
  Zap,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Bot,
  Pause,
  Play,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { BuildQueueTask, PersonCapacity, AIMode } from '@/lib/state/build-queue-store';

interface BuildQueueCardProps {
  task: BuildQueueTask;
  people: PersonCapacity[];
  onPress: () => void;
  onDragStart?: () => void;
  isActive?: boolean;
}

export function BuildQueueCard({
  task,
  people,
  onPress,
  onDragStart,
  isActive = false,
}: BuildQueueCardProps) {
  const progressPercent = task.aiAdjustedSquares > 0
    ? Math.round((task.completedSquares / task.aiAdjustedSquares) * 100)
    : 0;

  const remainingSquares = task.aiAdjustedSquares - task.completedSquares;

  // Calculate daily burn rate
  const dailyBurnRate = task.assignments.reduce((sum, a) => sum + a.squaresPerDay, 0) * task.aiThroughputBoost;
  const daysRemaining = dailyBurnRate > 0 ? Math.ceil(remainingSquares / dailyBurnRate) : null;

  // Get assigned people details
  const assignedPeople = task.assignments.map(a =>
    people.find(p => p.id === a.personId)
  ).filter(Boolean) as PersonCapacity[];

  const getStatusColor = () => {
    switch (task.status) {
      case 'in_progress': return '#10b981';
      case 'queued': return '#f59e0b';
      case 'blocked': return '#ef4444';
      case 'paused': return '#6b7280';
      case 'completed': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getAIModeLabel = (mode: AIMode) => {
    switch (mode) {
      case 'none': return null;
      case 'assist': return { label: 'AI Assist', color: '#3b82f6' };
      case 'heavy': return { label: 'AI Heavy', color: '#8b5cf6' };
      case 'autonomous': return { label: 'AI Auto', color: '#ec4899' };
      default: return null;
    }
  };

  const aiModeInfo = getAIModeLabel(task.aiMode);

  const getUrgencyColor = () => {
    switch (task.urgency) {
      case 'critical': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      case 'low': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getFunctionColor = () => {
    switch (task.function) {
      case 'Marketing': return '#f59e0b';
      case 'Sales': return '#ec4899';
      case 'Engineering': return '#3b82f6';
      case 'Finance': return '#10b981';
      case 'Ops': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onDragStart}
      className={`bg-white dark:bg-slate-900 rounded-xl border-2 ${
        isActive
          ? 'border-purple-500'
          : 'border-gray-200 dark:border-slate-800'
      } overflow-hidden active:opacity-70`}
    >
      {/* Progress Bar Header */}
      <View className="h-2 bg-gray-100 dark:bg-slate-800">
        <View
          className="h-full rounded-r"
          style={{
            width: `${progressPercent}%`,
            backgroundColor: getStatusColor(),
          }}
        />
      </View>

      <View className="p-4">
        {/* Top Row: Drag Handle + Title + Status */}
        <View className="flex-row items-start mb-3">
          <View className="mr-2 opacity-40">
            <GripVertical size={20} color="#9ca3af" />
          </View>

          <View className="flex-1">
            <View className="flex-row items-center mb-1">
              {/* Function badge */}
              <View
                className="px-2 py-0.5 rounded-full mr-2"
                style={{ backgroundColor: getFunctionColor() + '20' }}
              >
                <Text style={{ color: getFunctionColor(), fontSize: 10, fontWeight: '600' }}>
                  {task.function}
                </Text>
              </View>

              {/* Urgency indicator */}
              <View
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getUrgencyColor() }}
              />
            </View>

            <Text className="text-gray-900 dark:text-white font-bold text-base" numberOfLines={2}>
              {task.title}
            </Text>
          </View>

          {/* Status indicator */}
          <View className="ml-2">
            {task.status === 'in_progress' ? (
              <View className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full items-center justify-center">
                <Play size={16} color="#10b981" />
              </View>
            ) : task.status === 'paused' ? (
              <View className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center">
                <Pause size={16} color="#6b7280" />
              </View>
            ) : task.status === 'completed' ? (
              <View className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full items-center justify-center">
                <CheckCircle2 size={16} color="#3b82f6" />
              </View>
            ) : null}
          </View>
        </View>

        {/* Squares Progress - Visual Block Grid */}
        <View className="mb-3">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-gray-500 dark:text-slate-400 text-xs font-semibold">
              PROGRESS
            </Text>
            <Text className="text-gray-900 dark:text-white text-xs font-bold">
              {task.completedSquares} / {task.aiAdjustedSquares} squares
            </Text>
          </View>

          {/* Visual squares grid */}
          <View className="flex-row flex-wrap gap-1">
            {Array.from({ length: Math.min(task.aiAdjustedSquares, 20) }).map((_, i) => (
              <View
                key={i}
                className="w-4 h-4 rounded-sm"
                style={{
                  backgroundColor: i < task.completedSquares ? getStatusColor() : '#e5e7eb',
                }}
              />
            ))}
            {task.aiAdjustedSquares > 20 && (
              <Text className="text-gray-500 text-xs ml-1">
                +{task.aiAdjustedSquares - 20} more
              </Text>
            )}
          </View>

          {/* AI Effort Reduction indicator */}
          {task.aiMode !== 'none' && (
            <View className="flex-row items-center mt-2">
              <Bot size={12} color={aiModeInfo?.color} />
              <Text className="text-xs ml-1" style={{ color: aiModeInfo?.color }}>
                {aiModeInfo?.label}: {task.originalSquares} → {task.aiAdjustedSquares} squares
              </Text>
            </View>
          )}
        </View>

        {/* Assigned People */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <Users size={14} color="#9ca3af" />
            <Text className="text-gray-500 dark:text-slate-400 text-xs ml-1.5">
              {assignedPeople.length} assigned
            </Text>
          </View>

          {assignedPeople.length > 0 ? (
            <View className="flex-row">
              {assignedPeople.slice(0, 3).map((person, i) => (
                <View
                  key={person.id}
                  className="w-6 h-6 rounded-full items-center justify-center border-2 border-white dark:border-slate-900"
                  style={{
                    backgroundColor:
                      person.role === 'Founder' ? '#8b5cf6' :
                      person.role === 'FractionalExec' ? '#3b82f6' : '#10b981',
                    marginLeft: i > 0 ? -8 : 0,
                  }}
                >
                  <Text className="text-white text-xs font-bold">
                    {person.name.charAt(0)}
                  </Text>
                </View>
              ))}
              {assignedPeople.length > 3 && (
                <View
                  className="w-6 h-6 rounded-full items-center justify-center border-2 border-white dark:border-slate-900 bg-gray-400"
                  style={{ marginLeft: -8 }}
                >
                  <Text className="text-white text-xs font-bold">
                    +{assignedPeople.length - 3}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <Text className="text-amber-600 text-xs font-semibold">
              No one assigned
            </Text>
          )}
        </View>

        {/* Bottom Row: Timeline + Quality */}
        <View className="flex-row items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-800">
          {/* Timeline */}
          <View className="flex-row items-center">
            <Clock size={14} color="#9ca3af" />
            {daysRemaining !== null ? (
              <Text className="text-gray-900 dark:text-white text-xs font-semibold ml-1.5">
                {daysRemaining === 0 ? 'Today' : daysRemaining === 1 ? '1 day' : `${daysRemaining} days`}
              </Text>
            ) : (
              <Text className="text-amber-600 text-xs font-semibold ml-1.5">
                Not scheduled
              </Text>
            )}
            {dailyBurnRate > 0 && (
              <Text className="text-gray-500 dark:text-slate-400 text-xs ml-1">
                ({dailyBurnRate.toFixed(1)} □/day)
              </Text>
            )}
          </View>

          {/* Quality/Risk Indicators */}
          <View className="flex-row items-center gap-2">
            {task.qualityConfidence < 60 && (
              <View className="flex-row items-center bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded">
                <AlertTriangle size={12} color="#f59e0b" />
                <Text className="text-amber-700 dark:text-amber-300 text-xs ml-1">
                  {task.reworkRisk}% risk
                </Text>
              </View>
            )}

            {task.requiresQA && !task.qaReviewerId && (
              <View className="flex-row items-center bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">
                <AlertTriangle size={12} color="#ef4444" />
                <Text className="text-red-700 dark:text-red-300 text-xs ml-1">
                  Needs QA
                </Text>
              </View>
            )}

            <ChevronRight size={16} color="#9ca3af" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}
