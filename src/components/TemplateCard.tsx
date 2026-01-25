/**
 * Template Card Component
 * Displays work plan template with preview information
 */

import { View, Text } from 'react-native';
import { Clock, Users, Award, Tag } from 'lucide-react-native';
import { HapticPressable } from './HapticPressable';
import type { WorkPlanTemplate } from '@/lib/templates/work-plan-templates';

interface TemplateCardProps {
  template: WorkPlanTemplate;
  onPress: () => void;
}

export function TemplateCard({ template, onPress }: TemplateCardProps) {
  const getDifficultyColor = (difficulty: WorkPlanTemplate['difficulty']) => {
    switch (difficulty) {
      case 'Beginner':
        return { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' };
      case 'Intermediate':
        return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' };
      case 'Advanced':
        return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' };
    }
  };

  const getFunctionColor = (func: WorkPlanTemplate['function']) => {
    const colors: Record<string, string> = {
      Marketing: '#ec4899',
      Engineering: '#3b82f6',
      Sales: '#10b981',
      Product: '#8b5cf6',
      Operations: '#f59e0b',
      Finance: '#14b8a6',
      HR: '#f97316',
      Design: '#a855f7',
    };
    return colors[func] || '#64748b';
  };

  const difficultyColors = getDifficultyColor(template.difficulty);
  const functionColor = getFunctionColor(template.function);

  const totalHours = template.tasks.reduce((sum, task) => sum + task.estimatedHours, 0);

  return (
    <HapticPressable
      onPress={onPress}
      className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-300 dark:border-slate-700 active:opacity-70 mb-3"
    >
      {/* Header */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1 mr-3">
          <Text className="text-gray-900 dark:text-white text-lg font-bold mb-1">
            {template.name}
          </Text>
          <View className="flex-row items-center gap-2">
            <View
              className="px-2 py-1 rounded"
              style={{ backgroundColor: functionColor + '20' }}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: functionColor }}
              >
                {template.function}
              </Text>
            </View>
            <View className={`${difficultyColors.bg} px-2 py-1 rounded`}>
              <Text className={`${difficultyColors.text} text-xs font-semibold`}>
                {template.difficulty}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Description */}
      <Text className="text-gray-600 dark:text-slate-400 text-sm leading-6 mb-4">
        {template.description}
      </Text>

      {/* Metadata */}
      <View className="flex-row items-center gap-4 mb-3">
        <View className="flex-row items-center gap-1.5">
          <Clock size={16} color="#64748b" />
          <Text className="text-gray-600 dark:text-slate-400 text-xs">
            {template.estimatedDuration}
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <Award size={16} color="#64748b" />
          <Text className="text-gray-600 dark:text-slate-400 text-xs">
            {totalHours}h total
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <Users size={16} color="#64748b" />
          <Text className="text-gray-600 dark:text-slate-400 text-xs">
            {template.tasks.length} tasks
          </Text>
        </View>
      </View>

      {/* Tags */}
      {template.tags.length > 0 && (
        <View className="flex-row items-center flex-wrap gap-2">
          {template.tags.slice(0, 3).map((tag, idx) => (
            <View key={idx} className="flex-row items-center bg-gray-100 dark:bg-slate-900 px-2 py-1 rounded">
              <Tag size={12} color="#64748b" />
              <Text className="text-gray-600 dark:text-slate-400 text-xs ml-1">
                {tag}
              </Text>
            </View>
          ))}
          {template.tags.length > 3 && (
            <Text className="text-gray-500 dark:text-slate-500 text-xs">
              +{template.tags.length - 3} more
            </Text>
          )}
        </View>
      )}
    </HapticPressable>
  );
}
