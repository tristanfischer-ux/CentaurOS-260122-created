/**
 * AI Assistant Screen
 * Intelligent suggestions and automation
 */

import { View, Text, ScrollView, Modal, Alert } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Sparkles,
  Target,
  ListTodo,
  Users,
  FileText,
  TrendingUp,
  Lightbulb,
  Check,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HapticPressable } from '@/components/HapticPressable';
import { showToast } from '@/components/ToastContainer';
import { successNotification } from '@/lib/haptics';
import {
  AIAssistantService,
  type OKRSuggestion,
  type TaskBreakdown,
  type ResourceOptimization,
  type StrategicInsight,
} from '@/lib/ai-assistant';

export default function AIAssistantScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState<string | null>(null);
  const [okrSuggestions, setOkrSuggestions] = useState<OKRSuggestion[]>([]);
  const [taskBreakdown, setTaskBreakdown] = useState<TaskBreakdown | null>(null);
  const [resourceOpt, setResourceOpt] = useState<ResourceOptimization | null>(null);
  const [insights, setInsights] = useState<StrategicInsight[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<any>(null);

  const features = [
    {
      id: 'okr-generation',
      icon: Target,
      title: 'Generate OKRs',
      description: 'AI-powered OKR suggestions based on your company goals and function',
      color: '#3b82f6',
      action: async () => {
        setLoading('okr-generation');
        try {
          const suggestions = await AIAssistantService.generateOKRs({
            function: 'Marketing',
            companyGoals: ['Grow user base', 'Increase revenue'],
          });
          setOkrSuggestions(suggestions);
          setModalContent({ type: 'okr', data: suggestions });
          setShowModal(true);
        } catch (error) {
          showToast.error('Error', 'Failed to generate OKRs');
        } finally {
          setLoading(null);
        }
      },
    },
    {
      id: 'task-breakdown',
      icon: ListTodo,
      title: 'Break Down Tasks',
      description: 'Convert high-level work into detailed, actionable tasks with time estimates',
      color: '#8b5cf6',
      action: async () => {
        setLoading('task-breakdown');
        try {
          const breakdown = await AIAssistantService.breakdownTask(
            'Build user authentication system'
          );
          setTaskBreakdown(breakdown);
          setModalContent({ type: 'tasks', data: breakdown });
          setShowModal(true);
        } catch (error) {
          showToast.error('Error', 'Failed to break down task');
        } finally {
          setLoading(null);
        }
      },
    },
    {
      id: 'resource-optimization',
      icon: Users,
      title: 'Optimize Resources',
      description: 'Get recommendations to balance workload and maximize team efficiency',
      color: '#10b981',
      action: async () => {
        setLoading('resource-optimization');
        try {
          const optimization = await AIAssistantService.optimizeResources();
          setResourceOpt(optimization);
          setModalContent({ type: 'resources', data: optimization });
          setShowModal(true);
        } catch (error) {
          showToast.error('Error', 'Failed to optimize resources');
        } finally {
          setLoading(null);
        }
      },
    },
    {
      id: 'strategic-insights',
      icon: Lightbulb,
      title: 'Strategic Insights',
      description: 'Identify risks, opportunities, and trends from your team data',
      color: '#f59e0b',
      action: async () => {
        setLoading('strategic-insights');
        try {
          const strategicInsights = await AIAssistantService.getStrategicInsights({
            okrs: [],
            tasks: [],
            team: [],
          });
          setInsights(strategicInsights);
          setModalContent({ type: 'insights', data: strategicInsights });
          setShowModal(true);
        } catch (error) {
          showToast.error('Error', 'Failed to get insights');
        } finally {
          setLoading(null);
        }
      },
    },
    {
      id: 'report-generation',
      icon: FileText,
      title: 'Generate Reports',
      description: 'Auto-generate weekly reports, OKR summaries, and function updates',
      color: '#ec4899',
      action: async () => {
        setLoading('report-generation');
        try {
          const report = await AIAssistantService.generateReport('weekly', {});
          setModalContent({ type: 'report', data: report });
          setShowModal(true);
        } catch (error) {
          showToast.error('Error', 'Failed to generate report');
        } finally {
          setLoading(null);
        }
      },
    },
    {
      id: 'meeting-summary',
      icon: TrendingUp,
      title: 'Summarize Meetings',
      description: 'Extract action items, decisions, and key points from meeting transcripts',
      color: '#14b8a6',
      action: async () => {
        setLoading('meeting-summary');
        try {
          const summary = await AIAssistantService.summarizeMeeting('transcript...');
          setModalContent({ type: 'meeting', data: summary });
          setShowModal(true);
        } catch (error) {
          showToast.error('Error', 'Failed to summarize meeting');
        } finally {
          setLoading(null);
        }
      },
    },
  ];

  const renderModalContent = () => {
    if (!modalContent) return null;

    switch (modalContent.type) {
      case 'okr':
        const okr = modalContent.data[0] as OKRSuggestion;
        return (
          <ScrollView className="max-h-96">
            <Text className="text-gray-900 dark:text-white text-xl font-bold mb-2">
              {okr.objective}
            </Text>
            <View className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 mb-4 border border-blue-200 dark:border-blue-800">
              <Text className="text-blue-700 dark:text-blue-400 text-xs font-semibold mb-1">
                {okr.function}
              </Text>
              <Text className="text-blue-700 dark:text-blue-400 text-sm">{okr.rationale}</Text>
            </View>
            <Text className="text-gray-900 dark:text-white font-bold mb-3">Key Results:</Text>
            {okr.keyResults.map((kr, idx) => (
              <View
                key={idx}
                className="bg-gray-100 dark:bg-slate-900 rounded-xl p-3 mb-2 border border-gray-300 dark:border-slate-800"
              >
                <Text className="text-gray-900 dark:text-white font-semibold text-sm mb-1">
                  {kr.description}
                </Text>
                <Text className="text-gray-600 dark:text-slate-400 text-xs">
                  Target: {kr.target} {kr.unit} by {kr.timeframe}
                </Text>
              </View>
            ))}
          </ScrollView>
        );

      case 'tasks':
        const tasks = modalContent.data as TaskBreakdown;
        return (
          <ScrollView className="max-h-96">
            <Text className="text-gray-900 dark:text-white font-bold mb-3">
              Estimated: {tasks.totalEstimate}
            </Text>
            {tasks.tasks.map((task, idx) => (
              <View
                key={idx}
                className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 mb-2 border border-gray-300 dark:border-slate-800"
              >
                <View className="flex-row items-center mb-2">
                  <View className="w-6 h-6 rounded-full bg-purple-500 items-center justify-center mr-2">
                    <Text className="text-white text-xs font-bold">{idx + 1}</Text>
                  </View>
                  <Text className="text-gray-900 dark:text-white font-bold flex-1">
                    {task.title}
                  </Text>
                </View>
                <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">
                  {task.description}
                </Text>
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-500 dark:text-slate-500 text-xs">
                    {task.estimatedHours}h
                  </Text>
                  <Text className="text-gray-500 dark:text-slate-500 text-xs">
                    {task.skills.join(', ')}
                  </Text>
                </View>
              </View>
            ))}
            <Text className="text-gray-900 dark:text-white font-bold mt-4 mb-2">
              Suggested Assignees:
            </Text>
            {tasks.suggestedAssignees.map((assignee, idx) => (
              <View
                key={idx}
                className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 mb-2 border border-emerald-200 dark:border-emerald-800"
              >
                <Text className="text-emerald-700 dark:text-emerald-400 font-semibold">
                  {assignee.name} - {assignee.role}
                </Text>
                <Text className="text-emerald-600 dark:text-emerald-500 text-xs">
                  Match Score: {assignee.matchScore}%
                </Text>
              </View>
            ))}
          </ScrollView>
        );

      case 'resources':
        const resources = modalContent.data as ResourceOptimization;
        return (
          <ScrollView className="max-h-96">
            {resources.overallocated.length > 0 && (
              <>
                <Text className="text-red-600 dark:text-red-400 font-bold mb-3">
                  ⚠️ Overallocated
                </Text>
                {resources.overallocated.map((person, idx) => (
                  <View
                    key={idx}
                    className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 mb-3 border border-red-200 dark:border-red-800"
                  >
                    <Text className="text-gray-900 dark:text-white font-bold mb-1">
                      {person.name}
                    </Text>
                    <Text className="text-red-700 dark:text-red-400 text-sm mb-2">
                      Current: {person.currentLoad}h/week → Recommended: {person.recommendedLoad}
                      h/week
                    </Text>
                    {person.suggestions.map((suggestion, i) => (
                      <Text key={i} className="text-gray-600 dark:text-slate-400 text-xs mb-1">
                        • {suggestion}
                      </Text>
                    ))}
                  </View>
                ))}
              </>
            )}
            {resources.underutilized.length > 0 && (
              <>
                <Text className="text-blue-600 dark:text-blue-400 font-bold mb-3 mt-4">
                  💡 Underutilized
                </Text>
                {resources.underutilized.map((person, idx) => (
                  <View
                    key={idx}
                    className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 mb-3 border border-blue-200 dark:border-blue-800"
                  >
                    <Text className="text-gray-900 dark:text-white font-bold mb-1">
                      {person.name}
                    </Text>
                    <Text className="text-blue-700 dark:text-blue-400 text-sm mb-2">
                      Current: {person.currentLoad}h/week (Capacity: {person.capacity}h/week)
                    </Text>
                    {person.recommendations.map((rec, i) => (
                      <Text key={i} className="text-gray-600 dark:text-slate-400 text-xs mb-1">
                        • {rec}
                      </Text>
                    ))}
                  </View>
                ))}
              </>
            )}
          </ScrollView>
        );

      case 'insights':
        const insightsList = modalContent.data as StrategicInsight[];
        return (
          <ScrollView className="max-h-96">
            {insightsList.map((insight, idx) => {
              const categoryColors = {
                risk: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
                opportunity:
                  'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
                trend: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
                recommendation:
                  'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
              };

              return (
                <View
                  key={idx}
                  className={`${categoryColors[insight.category]} rounded-xl p-4 mb-3 border`}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-gray-900 dark:text-white font-bold flex-1">
                      {insight.title}
                    </Text>
                    <View className="bg-gray-900 dark:bg-white px-2 py-1 rounded">
                      <Text className="text-white dark:text-gray-900 text-xs font-bold uppercase">
                        {insight.impact}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-gray-700 dark:text-slate-300 text-sm mb-3">
                    {insight.description}
                  </Text>
                  <Text className="text-gray-900 dark:text-white text-xs font-semibold mb-1">
                    Suggested Actions:
                  </Text>
                  {insight.suggested_actions.map((action, i) => (
                    <Text key={i} className="text-gray-600 dark:text-slate-400 text-xs mb-1">
                      • {action}
                    </Text>
                  ))}
                </View>
              );
            })}
          </ScrollView>
        );

      case 'report':
        return (
          <ScrollView className="max-h-96">
            <Text className="text-gray-700 dark:text-slate-300 text-sm leading-7">
              {modalContent.data}
            </Text>
          </ScrollView>
        );

      case 'meeting':
        const meeting = modalContent.data;
        return (
          <ScrollView className="max-h-96">
            <Text className="text-gray-900 dark:text-white font-bold mb-2">Key Points:</Text>
            {meeting.key_points.map((point: string, idx: number) => (
              <Text key={idx} className="text-gray-700 dark:text-slate-300 text-sm mb-1">
                • {point}
              </Text>
            ))}
            <Text className="text-gray-900 dark:text-white font-bold mt-4 mb-2">
              Action Items:
            </Text>
            {meeting.action_items.map((item: any, idx: number) => (
              <View
                key={idx}
                className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 mb-2 border border-blue-200 dark:border-blue-800"
              >
                <Text className="text-gray-900 dark:text-white font-semibold text-sm">
                  {item.task}
                </Text>
                <Text className="text-gray-600 dark:text-slate-400 text-xs">
                  Owner: {item.owner} • Due: {item.dueDate}
                </Text>
              </View>
            ))}
          </ScrollView>
        );

      default:
        return null;
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-slate-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-300 dark:border-slate-800 flex-row items-center">
        <HapticPressable
          onPress={() => router.back()}
          className="mr-4 w-10 h-10 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-900 active:opacity-70"
        >
          <ArrowLeft size={20} color="#64748b" />
        </HapticPressable>
        <View className="flex-row items-center gap-2">
          <Sparkles size={24} color="#8b5cf6" />
          <Text className="text-gray-900 dark:text-white text-2xl font-bold">AI Assistant</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        <Text className="text-gray-600 dark:text-slate-400 text-base mb-6">
          Intelligent suggestions and automation to accelerate your team's performance
        </Text>

        {features.map((feature) => {
          const Icon = feature.icon;
          const isLoading = loading === feature.id;

          return (
            <HapticPressable
              key={feature.id}
              onPress={feature.action}
              disabled={isLoading}
              className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-300 dark:border-slate-800 mb-4 ${
                isLoading ? 'opacity-50' : 'active:opacity-70'
              }`}
            >
              <View className="flex-row items-start">
                <View
                  className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                  style={{ backgroundColor: feature.color + '20' }}
                >
                  <Icon size={24} color={feature.color} />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 dark:text-white text-lg font-bold mb-1">
                    {feature.title}
                  </Text>
                  <Text className="text-gray-600 dark:text-slate-400 text-sm leading-6">
                    {isLoading ? 'Processing...' : feature.description}
                  </Text>
                </View>
              </View>
            </HapticPressable>
          );
        })}

        <View className="h-8" />
      </ScrollView>

      {/* Results Modal */}
      {showModal && (
        <Modal
          visible={showModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowModal(false)}
        >
          <View className="flex-1 bg-black/50">
            <View className="flex-1" />
            <View
              className="bg-white dark:bg-slate-950 rounded-t-3xl p-6"
              style={{ paddingBottom: insets.bottom + 24, maxHeight: '80%' }}
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-gray-900 dark:text-white text-2xl font-bold">
                  AI Suggestions
                </Text>
                <HapticPressable
                  onPress={() => setShowModal(false)}
                  className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-900"
                >
                  <X size={20} color="#64748b" />
                </HapticPressable>
              </View>

              {renderModalContent()}

              <View className="flex-row gap-3 mt-6">
                <HapticPressable
                  onPress={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 dark:bg-slate-800 rounded-xl py-3 items-center"
                >
                  <Text className="text-gray-900 dark:text-white font-bold">Close</Text>
                </HapticPressable>
                <HapticPressable
                  onPress={async () => {
                    await successNotification();
                    showToast.success('Applied', 'Suggestions applied successfully');
                    setShowModal(false);
                  }}
                  hapticType="medium"
                  className="flex-1 bg-blue-500 rounded-xl py-3 items-center active:opacity-80"
                >
                  <Text className="text-white font-bold">Apply</Text>
                </HapticPressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
