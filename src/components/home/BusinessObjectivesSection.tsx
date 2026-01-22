/**
 * BusinessObjectivesSection
 * Displays company objectives with progress tracking for the current period
 */

import { View, Text, Pressable, ScrollView, Modal } from 'react-native';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Rocket,
  DollarSign,
  Users,
  Briefcase,
} from 'lucide-react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useObjectivesStore, type BusinessObjective } from '@/lib/state/objectives-store';

const CATEGORY_CONFIG: Record<BusinessObjective['category'], { icon: React.ComponentType<any>; color: string; gradient: [string, string] }> = {
  growth: { icon: Rocket, color: '#10b981', gradient: ['#10b981', '#059669'] },
  product: { icon: Target, color: '#3b82f6', gradient: ['#3b82f6', '#2563eb'] },
  operations: { icon: Briefcase, color: '#f59e0b', gradient: ['#f59e0b', '#d97706'] },
  financial: { icon: DollarSign, color: '#8b5cf6', gradient: ['#8b5cf6', '#7c3aed'] },
  team: { icon: Users, color: '#ec4899', gradient: ['#ec4899', '#db2777'] },
};

const STATUS_CONFIG: Record<BusinessObjective['status'], { color: string; bgColor: string; label: string }> = {
  'on-track': { color: '#10b981', bgColor: '#d1fae5', label: 'On Track' },
  'at-risk': { color: '#f59e0b', bgColor: '#fef3c7', label: 'At Risk' },
  'behind': { color: '#ef4444', bgColor: '#fee2e2', label: 'Behind' },
  'completed': { color: '#6b7280', bgColor: '#f3f4f6', label: 'Completed' },
};

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
  if (trend === 'up') return <TrendingUp size={10} color="#10b981" />;
  if (trend === 'down') return <TrendingDown size={10} color="#ef4444" />;
  return <Minus size={10} color="#64748b" />;
};

interface ObjectiveCardProps {
  objective: BusinessObjective;
  onPress: () => void;
  index: number;
}

function ObjectiveCard({ objective, onPress, index }: ObjectiveCardProps) {
  const config = CATEGORY_CONFIG[objective.category];
  const statusConfig = STATUS_CONFIG[objective.status];
  const Icon = config.icon;

  return (
    <Animated.View entering={FadeInRight.delay(index * 80).springify()}>
      <Pressable
        onPress={onPress}
        className="bg-white dark:bg-slate-800 rounded-2xl mr-3 overflow-hidden active:opacity-90"
        style={{ width: 280, borderWidth: 1, borderColor: config.color + '30' }}
      >
        {/* Header with gradient */}
        <LinearGradient
          colors={config.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ padding: 12 }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="bg-white/20 p-1.5 rounded-lg">
                <Icon size={14} color="white" />
              </View>
              <Text className="text-white/80 text-xs font-medium uppercase">
                {objective.category}
              </Text>
            </View>
            <View
              className="px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
            >
              <Text className="text-white text-xs font-bold">{objective.period}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Content */}
        <View className="p-3">
          {/* Title */}
          <Text className="text-slate-900 dark:text-white font-bold text-sm mb-2" numberOfLines={2}>
            {objective.title}
          </Text>

          {/* Progress Bar */}
          <View className="mb-2">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-slate-500 dark:text-slate-400 text-xs">Progress</Text>
              <Text className="text-slate-900 dark:text-white text-xs font-bold">
                {objective.progress}%
              </Text>
            </View>
            <View className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{
                  width: `${objective.progress}%`,
                  backgroundColor: config.color,
                }}
              />
            </View>
          </View>

          {/* Status Badge */}
          <View className="flex-row items-center justify-between">
            <View
              className="px-2 py-1 rounded-full flex-row items-center gap-1"
              style={{ backgroundColor: statusConfig.bgColor }}
            >
              {objective.status === 'on-track' && <CheckCircle2 size={10} color={statusConfig.color} />}
              {objective.status === 'at-risk' && <AlertTriangle size={10} color={statusConfig.color} />}
              {objective.status === 'behind' && <Clock size={10} color={statusConfig.color} />}
              <Text className="text-xs font-semibold" style={{ color: statusConfig.color }}>
                {statusConfig.label}
              </Text>
            </View>

            {/* Key Metric Preview */}
            {objective.metrics[0] && (
              <View className="flex-row items-center gap-1">
                <TrendIcon trend={objective.metrics[0].trend} />
                <Text className="text-slate-600 dark:text-slate-400 text-xs">
                  {objective.metrics[0].currentValue}/{objective.metrics[0].targetValue}{' '}
                  {objective.metrics[0].unit}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

interface ObjectiveDetailModalProps {
  objective: BusinessObjective | null;
  visible: boolean;
  onClose: () => void;
}

function ObjectiveDetailModal({ objective, visible, onClose }: ObjectiveDetailModalProps) {
  if (!objective) return null;

  const config = CATEGORY_CONFIG[objective.category];
  const statusConfig = STATUS_CONFIG[objective.status];
  const Icon = config.icon;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/70" onPress={onClose}>
        <View className="flex-1" />
        <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '90%' }}>
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl">
            {/* Header */}
            <LinearGradient
              colors={config.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                  <Icon size={20} color="white" />
                  <Text className="text-white/80 text-xs font-bold uppercase">
                    {objective.category} Objective
                  </Text>
                </View>
                <Pressable onPress={onClose} className="bg-white/20 p-2 rounded-full">
                  <X size={18} color="white" />
                </Pressable>
              </View>
              <Text className="text-white font-bold text-xl">{objective.title}</Text>
              <View className="flex-row items-center gap-2 mt-2">
                <View className="bg-white/20 px-2 py-0.5 rounded-full">
                  <Text className="text-white text-xs font-medium">{objective.period}</Text>
                </View>
                {objective.owner && (
                  <View className="bg-white/20 px-2 py-0.5 rounded-full">
                    <Text className="text-white text-xs font-medium">{objective.owner}</Text>
                  </View>
                )}
              </View>
            </LinearGradient>

            <ScrollView className="p-5" contentContainerStyle={{ paddingBottom: 40 }}>
              {/* Progress Overview */}
              <View className="mb-4">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">
                    Overall Progress
                  </Text>
                  <View
                    className="px-2 py-1 rounded-full flex-row items-center gap-1"
                    style={{ backgroundColor: statusConfig.bgColor }}
                  >
                    <Text className="text-xs font-semibold" style={{ color: statusConfig.color }}>
                      {statusConfig.label}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-3">
                  <Text className="text-slate-900 dark:text-white text-4xl font-bold">
                    {objective.progress}%
                  </Text>
                  <View className="flex-1 h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{ width: `${objective.progress}%`, backgroundColor: config.color }}
                    />
                  </View>
                </View>
              </View>

              {/* Description */}
              <View className="mb-4 bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                <Text className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                  {objective.description}
                </Text>
              </View>

              {/* Key Metrics */}
              {objective.metrics.length > 0 && (
                <View className="mb-4">
                  <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-3">
                    Key Metrics
                  </Text>
                  <View className="gap-2">
                    {objective.metrics.map((metric) => {
                      const progressPercent = Math.min(
                        (metric.currentValue / metric.targetValue) * 100,
                        100
                      );
                      return (
                        <View
                          key={metric.id}
                          className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3"
                        >
                          <View className="flex-row items-center justify-between mb-2">
                            <Text className="text-slate-700 dark:text-slate-300 text-sm font-medium">
                              {metric.name}
                            </Text>
                            <View className="flex-row items-center gap-1">
                              <TrendIcon trend={metric.trend} />
                              <Text className="text-slate-900 dark:text-white text-sm font-bold">
                                {metric.currentValue.toLocaleString()} / {metric.targetValue.toLocaleString()}{' '}
                                {metric.unit}
                              </Text>
                            </View>
                          </View>
                          <View className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <View
                              className="h-full rounded-full"
                              style={{
                                width: `${progressPercent}%`,
                                backgroundColor:
                                  progressPercent >= 80
                                    ? '#10b981'
                                    : progressPercent >= 50
                                    ? '#f59e0b'
                                    : '#ef4444',
                              }}
                            />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Milestones */}
              {objective.milestones.length > 0 && (
                <View className="mb-4">
                  <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-3">
                    Milestones
                  </Text>
                  <View className="gap-2">
                    {objective.milestones.map((milestone) => (
                      <View
                        key={milestone.id}
                        className={`flex-row items-center gap-3 p-3 rounded-xl ${
                          milestone.completed
                            ? 'bg-emerald-50 dark:bg-emerald-900/20'
                            : 'bg-slate-50 dark:bg-slate-800'
                        }`}
                      >
                        <View
                          className={`w-6 h-6 rounded-full items-center justify-center ${
                            milestone.completed
                              ? 'bg-emerald-500'
                              : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                        >
                          {milestone.completed ? (
                            <CheckCircle2 size={14} color="white" />
                          ) : (
                            <View className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500" />
                          )}
                        </View>
                        <View className="flex-1">
                          <Text
                            className={`text-sm font-medium ${
                              milestone.completed
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {milestone.title}
                          </Text>
                          {milestone.dueDate && !milestone.completed && (
                            <Text className="text-slate-500 dark:text-slate-500 text-xs">
                              Due: {new Date(milestone.dueDate).toLocaleDateString()}
                            </Text>
                          )}
                          {milestone.completedAt && (
                            <Text className="text-emerald-600 dark:text-emerald-400 text-xs">
                              Completed: {new Date(milestone.completedAt).toLocaleDateString()}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Linked Tasks */}
              {objective.linkedTaskIds.length > 0 && (
                <View className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                  <Text className="text-blue-700 dark:text-blue-400 text-xs font-bold mb-1">
                    {objective.linkedTaskIds.length} tasks linked to this objective
                  </Text>
                  <Text className="text-blue-600 dark:text-blue-400 text-xs">
                    View in What tab to see task progress
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function BusinessObjectivesSection() {
  const [selectedObjective, setSelectedObjective] = useState<BusinessObjective | null>(null);
  const [showModal, setShowModal] = useState(false);

  const initialize = useObjectivesStore((s) => s.initialize);
  const objectives = useObjectivesStore((s) => s.objectives);
  const getActiveObjectives = useObjectivesStore((s) => s.getActiveObjectives);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const activeObjectives = getActiveObjectives();

  if (activeObjectives.length === 0) {
    return null;
  }

  const onTrackCount = activeObjectives.filter((o) => o.status === 'on-track').length;
  const atRiskCount = activeObjectives.filter((o) => o.status === 'at-risk' || o.status === 'behind').length;

  return (
    <View className="mb-4">
      {/* Section Header */}
      <View className="flex-row items-center justify-between mb-3 px-5">
        <View className="flex-row items-center gap-2">
          <View className="bg-purple-500 p-1.5 rounded-lg">
            <Target size={16} color="white" />
          </View>
          <Text className="text-slate-900 dark:text-white font-bold text-base">
            Business Objectives
          </Text>
        </View>

        {/* Status Summary */}
        <View className="flex-row gap-1">
          <View className="bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
            <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              {onTrackCount} on track
            </Text>
          </View>
          {atRiskCount > 0 && (
            <View className="bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
              <Text className="text-amber-600 dark:text-amber-400 text-xs font-bold">
                {atRiskCount} at risk
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Horizontal Scroll of Objective Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        style={{ flexGrow: 0 }}
      >
        {activeObjectives.map((objective, index) => (
          <ObjectiveCard
            key={objective.id}
            objective={objective}
            index={index}
            onPress={() => {
              setSelectedObjective(objective);
              setShowModal(true);
            }}
          />
        ))}
      </ScrollView>

      {/* Objective Detail Modal */}
      <ObjectiveDetailModal
        objective={selectedObjective}
        visible={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedObjective(null);
        }}
      />
    </View>
  );
}
