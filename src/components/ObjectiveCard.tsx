/**
 * ObjectiveCard Component
 * Displays a business objective with progress, metrics, and milestones
 * Supports collapsed (compact) and expanded views
 */

import { View, Text, Pressable } from 'react-native';
import { useState, useMemo } from 'react';
import {
  Target, TrendingUp, TrendingDown, Minus, ChevronRight,
  CheckCircle2, Circle, AlertTriangle, Trophy, Link2, Calendar
} from 'lucide-react-native';
import { useTheme } from '@/lib/ThemeContext';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { lightImpact } from '@/lib/haptics';
import type { BusinessObjective, ObjectiveMetric } from '@/lib/state/objectives-store';

type ViewState = 'collapsed' | 'expanded';

interface ObjectiveCardProps {
  objective: BusinessObjective;
  onPress?: () => void;
  onLinkTasks?: () => void;
}

// Get category color
const getCategoryColor = (category: BusinessObjective['category']): { bg: string; text: string; badge: string } => {
  const colors = {
    growth: { bg: '#ecfdf5', text: '#059669', badge: '#10b981' },
    product: { bg: '#eff6ff', text: '#2563eb', badge: '#3b82f6' },
    operations: { bg: '#fef3c7', text: '#d97706', badge: '#f59e0b' },
    financial: { bg: '#f0fdf4', text: '#16a34a', badge: '#22c55e' },
    team: { bg: '#faf5ff', text: '#7c3aed', badge: '#8b5cf6' },
  };
  return colors[category] || colors.product;
};

// Get status color and icon
const getStatusStyle = (status: BusinessObjective['status']): { color: string; bgColor: string; label: string } => {
  const styles = {
    'on-track': { color: '#10b981', bgColor: '#ecfdf5', label: 'On Track' },
    'at-risk': { color: '#f59e0b', bgColor: '#fef3c7', label: 'At Risk' },
    'behind': { color: '#ef4444', bgColor: '#fef2f2', label: 'Behind' },
    'completed': { color: '#8b5cf6', bgColor: '#faf5ff', label: 'Completed' },
  };
  return styles[status] || styles['on-track'];
};

// Trend icon component
function TrendIcon({ trend, size = 12 }: { trend: 'up' | 'down' | 'stable'; size?: number }) {
  if (trend === 'up') return <TrendingUp size={size} color="#10b981" />;
  if (trend === 'down') return <TrendingDown size={size} color="#ef4444" />;
  return <Minus size={size} color="#94a3b8" />;
}

export function ObjectiveCard({ objective, onPress, onLinkTasks }: ObjectiveCardProps) {
  const [viewState, setViewState] = useState<ViewState>('collapsed');
  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';
  const workPlans = useWorkPlanStore(s => s.workPlans);

  const categoryColor = getCategoryColor(objective.category);
  const statusStyle = getStatusStyle(objective.status);

  // Get linked tasks
  const linkedTasks = useMemo(() => {
    return workPlans.filter(wp => objective.linkedTaskIds.includes(wp.id));
  }, [workPlans, objective.linkedTaskIds]);

  // Calculate milestones progress
  const milestonesCompleted = objective.milestones.filter(m => m.completed).length;
  const totalMilestones = objective.milestones.length;

  const handlePress = () => {
    lightImpact();
    if (viewState === 'collapsed') {
      setViewState('expanded');
    } else if (onPress) {
      onPress();
    }
  };

  const cardBg = isDark ? 'bg-slate-900' : isOffWhite ? 'bg-stone-50' : 'bg-white';
  const borderStyle = isDark ? 'border-slate-800' : isOffWhite ? 'border-stone-200' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : isOffWhite ? 'text-stone-900' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-stone-500' : 'text-gray-500';
  const textMuted = isDark ? 'text-slate-500' : isOffWhite ? 'text-stone-400' : 'text-gray-400';

  return (
    <Pressable
      onPress={handlePress}
      className={`${cardBg} rounded-2xl mb-3 overflow-hidden active:opacity-90 border ${borderStyle}`}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.3 : 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      {/* Header Row */}
      <View className="flex-row items-start p-4">
        {/* Category Icon */}
        <View
          className="w-10 h-10 rounded-xl items-center justify-center"
          style={{ backgroundColor: categoryColor.bg }}
        >
          <Target size={20} color={categoryColor.text} />
        </View>

        {/* Title & Period */}
        <View className="flex-1 ml-3">
          <Text className={`${textPrimary} font-semibold text-base`} numberOfLines={2}>
            {objective.title}
          </Text>
          <View className="flex-row items-center gap-2 mt-1">
            <View
              className="px-2 py-0.5 rounded-full"
              style={{ backgroundColor: categoryColor.bg }}
            >
              <Text style={{ color: categoryColor.text }} className="text-[10px] font-semibold capitalize">
                {objective.category}
              </Text>
            </View>
            <Text className={`${textMuted} text-xs`}>{objective.period}</Text>
          </View>
        </View>

        {/* Status Badge */}
        <View
          className="px-2.5 py-1 rounded-full"
          style={{ backgroundColor: statusStyle.bgColor }}
        >
          <Text style={{ color: statusStyle.color }} className="text-xs font-bold">
            {statusStyle.label}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View className="px-4 pb-3">
        <View className="flex-row items-center justify-between mb-1.5">
          <Text className={`${textSecondary} text-xs`}>Progress</Text>
          <Text className={`${textPrimary} text-xs font-bold`}>{objective.progress}%</Text>
        </View>
        <View className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : isOffWhite ? 'bg-stone-200' : 'bg-gray-100'}`}>
          <View
            className="h-full rounded-full"
            style={{
              width: `${Math.min(100, objective.progress)}%`,
              backgroundColor: statusStyle.color,
            }}
          />
        </View>
      </View>

      {/* Collapsed Quick Stats */}
      {viewState === 'collapsed' && (
        <View className="flex-row items-center justify-between px-4 pb-3">
          {/* Stats Pills */}
          <View className="flex-row items-center gap-2">
            {/* Milestones */}
            <View className={`flex-row items-center gap-1 px-2 py-1 rounded-full ${isDark ? 'bg-slate-700' : isOffWhite ? 'bg-stone-200' : 'bg-gray-100'}`}>
              <CheckCircle2 size={10} color={statusStyle.color} />
              <Text className={`${textSecondary} text-[10px] font-semibold`}>
                {milestonesCompleted}/{totalMilestones}
              </Text>
            </View>

            {/* Linked Tasks */}
            {linkedTasks.length > 0 && (
              <View className={`flex-row items-center gap-1 px-2 py-1 rounded-full ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                <Link2 size={10} color="#3b82f6" />
                <Text className="text-blue-600 dark:text-blue-400 text-[10px] font-semibold">
                  {linkedTasks.length} task{linkedTasks.length !== 1 ? 's' : ''}
                </Text>
              </View>
            )}

            {/* Metrics Count */}
            {objective.metrics.length > 0 && (
              <View className={`flex-row items-center gap-1 px-2 py-1 rounded-full ${isDark ? 'bg-emerald-900/30' : 'bg-emerald-50'}`}>
                <TrendingUp size={10} color="#10b981" />
                <Text className="text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                  {objective.metrics.length} metric{objective.metrics.length !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>
          <ChevronRight size={16} color="#94a3b8" />
        </View>
      )}

      {/* Expanded View */}
      {viewState === 'expanded' && (
        <View className="px-4 pb-4">
          {/* Description */}
          {objective.description && (
            <View className="mb-4">
              <Text className={`${textSecondary} text-sm leading-5`}>
                {objective.description}
              </Text>
            </View>
          )}

          {/* Key Metrics */}
          {objective.metrics.length > 0 && (
            <View className="mb-4">
              <Text className={`${textSecondary} text-[11px] font-medium mb-2`}>
                Key Metrics
              </Text>
              <View className="gap-2">
                {objective.metrics.slice(0, 3).map((metric) => (
                  <MetricRow key={metric.id} metric={metric} isDark={isDark} isOffWhite={isOffWhite} />
                ))}
              </View>
            </View>
          )}

          {/* Milestones */}
          {objective.milestones.length > 0 && (
            <View className="mb-4">
              <Text className={`${textSecondary} text-[11px] font-medium mb-2`}>
                Milestones ({milestonesCompleted}/{totalMilestones})
              </Text>
              <View className="gap-2">
                {objective.milestones.slice(0, 4).map((milestone) => (
                  <View
                    key={milestone.id}
                    className={`flex-row items-center p-2.5 rounded-xl ${isDark ? 'bg-slate-700/50' : isOffWhite ? 'bg-stone-100' : 'bg-gray-50'}`}
                  >
                    {milestone.completed ? (
                      <CheckCircle2 size={16} color="#10b981" />
                    ) : (
                      <Circle size={16} color="#94a3b8" />
                    )}
                    <Text
                      className={`flex-1 ml-2.5 text-xs ${milestone.completed ? textMuted : textPrimary}`}
                      style={milestone.completed ? { textDecorationLine: 'line-through' } : undefined}
                      numberOfLines={1}
                    >
                      {milestone.title}
                    </Text>
                    {milestone.dueDate && !milestone.completed && (
                      <View className="flex-row items-center gap-1">
                        <Calendar size={10} color="#94a3b8" />
                        <Text className={`${textMuted} text-[10px]`}>
                          {new Date(milestone.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
                {objective.milestones.length > 4 && (
                  <Text className={`${textMuted} text-[10px] text-center mt-1`}>
                    +{objective.milestones.length - 4} more milestones
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Linked Tasks */}
          {linkedTasks.length > 0 && (
            <View className="mb-4">
              <Text className={`${textSecondary} text-[11px] font-medium mb-2`}>
                Linked Tasks ({linkedTasks.length})
              </Text>
              <View className="gap-2">
                {linkedTasks.slice(0, 3).map((task) => (
                  <View
                    key={task.id}
                    className={`flex-row items-center p-2.5 rounded-xl ${isDark ? 'bg-slate-700/50' : isOffWhite ? 'bg-stone-100' : 'bg-gray-50'}`}
                  >
                    <View
                      className="w-2 h-2 rounded-full mr-2.5"
                      style={{
                        backgroundColor:
                          task.status === 'completed' ? '#10b981' :
                          task.status === 'in-progress' ? '#3b82f6' :
                          task.status === 'blocked' ? '#ef4444' : '#94a3b8',
                      }}
                    />
                    <Text className={`flex-1 text-xs ${textPrimary}`} numberOfLines={1}>
                      {task.title}
                    </Text>
                    <Text className={`${textMuted} text-[10px]`}>{task.progress}%</Text>
                  </View>
                ))}
                {linkedTasks.length > 3 && (
                  <Text className={`${textMuted} text-[10px] text-center`}>
                    +{linkedTasks.length - 3} more tasks
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Quick Actions */}
          <View className="flex-row gap-2">
            {onLinkTasks && (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  lightImpact();
                  onLinkTasks();
                }}
                className="flex-1 bg-blue-500 rounded-xl py-2.5 flex-row items-center justify-center gap-1.5 active:opacity-80"
              >
                <Link2 size={14} color="#fff" />
                <Text className="text-white text-xs font-semibold">Link Tasks</Text>
              </Pressable>
            )}
            {onPress && (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  lightImpact();
                  onPress();
                }}
                className="flex-1 bg-purple-500 rounded-xl py-2.5 flex-row items-center justify-center gap-1.5 active:opacity-80"
              >
                <Target size={14} color="#fff" />
                <Text className="text-white text-xs font-semibold">View Details</Text>
              </Pressable>
            )}
          </View>

          {/* Tap hint */}
          {onPress && (
            <Text className={`${textMuted} text-[10px] text-center mt-3`}>
              Tap again for full details
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
}

// Metric Row Component
function MetricRow({ metric, isDark, isOffWhite }: { metric: ObjectiveMetric; isDark: boolean; isOffWhite: boolean }) {
  const progress = Math.min(100, Math.round((metric.currentValue / metric.targetValue) * 100));
  const progressColor = progress >= 80 ? '#10b981' : progress >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <View className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-700/50' : isOffWhite ? 'bg-stone-100' : 'bg-gray-50'}`}>
      <View className="flex-row items-center justify-between mb-1.5">
        <View className="flex-row items-center gap-1.5">
          <Text className={`text-xs font-medium ${isDark ? 'text-white' : isOffWhite ? 'text-stone-900' : 'text-gray-900'}`}>
            {metric.name}
          </Text>
          <TrendIcon trend={metric.trend} />
        </View>
        <Text className={`text-xs font-bold ${isDark ? 'text-white' : isOffWhite ? 'text-stone-900' : 'text-gray-900'}`}>
          {metric.unit === '£' ? `£${metric.currentValue.toLocaleString()}` :
           metric.unit === '%' ? `${metric.currentValue}%` :
           `${metric.currentValue.toLocaleString()} ${metric.unit}`}
        </Text>
      </View>
      <View className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-600' : isOffWhite ? 'bg-stone-200' : 'bg-gray-200'}`}>
        <View
          className="h-full rounded-full"
          style={{ width: `${progress}%`, backgroundColor: progressColor }}
        />
      </View>
      <View className="flex-row items-center justify-between mt-1">
        <Text className={`text-[10px] ${isDark ? 'text-slate-500' : isOffWhite ? 'text-stone-400' : 'text-gray-400'}`}>
          Current
        </Text>
        <Text className={`text-[10px] ${isDark ? 'text-slate-500' : isOffWhite ? 'text-stone-400' : 'text-gray-400'}`}>
          Target: {metric.unit === '£' ? `£${metric.targetValue.toLocaleString()}` :
                   metric.unit === '%' ? `${metric.targetValue}%` :
                   `${metric.targetValue.toLocaleString()} ${metric.unit}`}
        </Text>
      </View>
    </View>
  );
}
