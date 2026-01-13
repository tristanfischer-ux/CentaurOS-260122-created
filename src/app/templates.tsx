/**
 * Templates Screen
 * Browse and use pre-built work plan templates
 */

import { View, Text, ScrollView, Pressable } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, FileText, Search, Sparkles } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HapticPressable } from '@/components/HapticPressable';
import { TemplateCard } from '@/components/TemplateCard';
import { EmptyState } from '@/components/EmptyState';
import {
  ALL_TEMPLATES,
  getTemplatesByFunction,
  getTemplateById,
  type BusinessFunction,
  type WorkPlanTemplate,
} from '@/lib/templates/work-plan-templates';

export default function TemplatesScreen() {
  const insets = useSafeAreaInsets();
  const [selectedFunction, setSelectedFunction] = useState<BusinessFunction | 'All'>('All');
  const [selectedTemplate, setSelectedTemplate] = useState<WorkPlanTemplate | null>(null);

  const functions: Array<BusinessFunction | 'All'> = [
    'All',
    'Marketing',
    'Engineering',
    'Sales',
    'Product',
    'Operations',
    'Finance',
    'HR',
    'Design',
  ];

  const filteredTemplates =
    selectedFunction === 'All' ? ALL_TEMPLATES : getTemplatesByFunction(selectedFunction);

  const handleTemplatePress = (template: WorkPlanTemplate) => {
    setSelectedTemplate(template);
  };

  const handleUseTemplate = () => {
    if (!selectedTemplate) return;
    // Navigate to work plan creation with template pre-filled
    router.push({
      pathname: '/(tabs)/do',
      params: { templateId: selectedTemplate.id },
    });
  };

  // Template Detail View
  if (selectedTemplate) {
    const totalHours = selectedTemplate.tasks.reduce((sum, task) => sum + task.estimatedHours, 0);

    return (
      <View className="flex-1 bg-white dark:bg-slate-950" style={{ paddingTop: insets.top }}>
        {/* Header */}
        <View className="px-6 py-4 border-b border-gray-300 dark:border-slate-800 flex-row items-center">
          <HapticPressable
            onPress={() => setSelectedTemplate(null)}
            className="mr-4 w-10 h-10 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-900 active:opacity-70"
          >
            <ArrowLeft size={20} color="#64748b" />
          </HapticPressable>
          <Text className="text-gray-900 dark:text-white text-2xl font-bold flex-1">
            Template Details
          </Text>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Template Info */}
          <View className="px-6 pt-6 pb-4">
            <Text className="text-gray-900 dark:text-white text-3xl font-bold mb-2">
              {selectedTemplate.name}
            </Text>
            <View className="flex-row items-center gap-2 mb-4">
              <View className="bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded">
                <Text className="text-blue-700 dark:text-blue-400 text-sm font-semibold">
                  {selectedTemplate.function}
                </Text>
              </View>
              <View className="bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded">
                <Text className="text-gray-700 dark:text-slate-300 text-sm font-semibold">
                  {selectedTemplate.difficulty}
                </Text>
              </View>
            </View>
            <Text className="text-gray-600 dark:text-slate-400 text-base leading-7 mb-6">
              {selectedTemplate.description}
            </Text>

            {/* Quick Stats */}
            <View className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 mb-6">
              <View className="flex-row items-center justify-around">
                <View className="items-center">
                  <Text className="text-gray-900 dark:text-white text-2xl font-bold mb-1">
                    {selectedTemplate.estimatedDuration}
                  </Text>
                  <Text className="text-gray-600 dark:text-slate-400 text-xs">Duration</Text>
                </View>
                <View className="w-px h-10 bg-gray-300 dark:bg-slate-700" />
                <View className="items-center">
                  <Text className="text-gray-900 dark:text-white text-2xl font-bold mb-1">
                    {selectedTemplate.tasks.length}
                  </Text>
                  <Text className="text-gray-600 dark:text-slate-400 text-xs">Tasks</Text>
                </View>
                <View className="w-px h-10 bg-gray-300 dark:bg-slate-700" />
                <View className="items-center">
                  <Text className="text-gray-900 dark:text-white text-2xl font-bold mb-1">
                    {totalHours}h
                  </Text>
                  <Text className="text-gray-600 dark:text-slate-400 text-xs">Total Hours</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Tasks */}
          <View className="px-6 pb-4">
            <Text className="text-gray-900 dark:text-white text-xl font-bold mb-3">
              Tasks Breakdown
            </Text>
            <View className="gap-2">
              {selectedTemplate.tasks
                .sort((a, b) => a.order - b.order)
                .map((task, idx) => (
                  <View
                    key={idx}
                    className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 border border-gray-300 dark:border-slate-800"
                  >
                    <View className="flex-row items-start gap-3">
                      <View className="w-8 h-8 rounded-full bg-blue-500 items-center justify-center">
                        <Text className="text-white font-bold text-sm">{task.order}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-900 dark:text-white font-bold text-base mb-1">
                          {task.title}
                        </Text>
                        <Text className="text-gray-600 dark:text-slate-400 text-sm leading-6 mb-2">
                          {task.description}
                        </Text>
                        <View className="flex-row items-center gap-3">
                          <Text className="text-gray-500 dark:text-slate-500 text-xs">
                            {task.estimatedHours}h
                          </Text>
                          <Text className="text-gray-500 dark:text-slate-500 text-xs">•</Text>
                          <Text className="text-gray-500 dark:text-slate-500 text-xs">
                            {task.skills.join(', ')}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
            </View>
          </View>

          {/* Deliverables */}
          <View className="px-6 pb-4">
            <Text className="text-gray-900 dark:text-white text-xl font-bold mb-3">
              Deliverables
            </Text>
            <View className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 border border-gray-300 dark:border-slate-800">
              {selectedTemplate.deliverables.map((deliverable, idx) => (
                <View key={idx} className="flex-row items-start gap-2 mb-2">
                  <Text className="text-emerald-500 font-bold">✓</Text>
                  <Text className="text-gray-700 dark:text-slate-300 text-sm flex-1">
                    {deliverable}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* AI Tools Suggested */}
          {selectedTemplate.aiToolsSuggested.length > 0 && (
            <View className="px-6 pb-4">
              <View className="flex-row items-center gap-2 mb-3">
                <Sparkles size={20} color="#8b5cf6" />
                <Text className="text-gray-900 dark:text-white text-xl font-bold">
                  AI Tools to Accelerate
                </Text>
              </View>
              <View className="gap-2">
                {selectedTemplate.aiToolsSuggested.map((tool, idx) => (
                  <View
                    key={idx}
                    className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-3"
                  >
                    <Text className="text-purple-700 dark:text-purple-300 text-sm font-semibold">
                      {tool}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Tags */}
          {selectedTemplate.tags.length > 0 && (
            <View className="px-6 pb-8">
              <Text className="text-gray-900 dark:text-white text-xl font-bold mb-3">Tags</Text>
              <View className="flex-row flex-wrap gap-2">
                {selectedTemplate.tags.map((tag, idx) => (
                  <View
                    key={idx}
                    className="bg-gray-100 dark:bg-slate-800 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700"
                  >
                    <Text className="text-gray-700 dark:text-slate-300 text-sm">{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Use Template Button */}
        <View
          className="px-6 py-4 border-t border-gray-300 dark:border-slate-800 bg-white dark:bg-slate-950"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <HapticPressable
            onPress={handleUseTemplate}
            hapticType="medium"
            className="bg-blue-500 rounded-xl py-4 items-center active:opacity-80"
          >
            <Text className="text-white font-bold text-lg">Use This Template</Text>
          </HapticPressable>
        </View>
      </View>
    );
  }

  // Templates List View
  return (
    <View className="flex-1 bg-white dark:bg-slate-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-300 dark:border-slate-800">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <HapticPressable
              onPress={() => router.back()}
              className="mr-4 w-10 h-10 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-900 active:opacity-70"
            >
              <ArrowLeft size={20} color="#64748b" />
            </HapticPressable>
            <View className="flex-row items-center gap-2">
              <FileText size={24} color="#3b82f6" />
              <Text className="text-gray-900 dark:text-white text-2xl font-bold">
                Templates
              </Text>
            </View>
          </View>
        </View>

        {/* Search (placeholder) */}
        <Pressable className="flex-row items-center bg-gray-100 dark:bg-slate-900 rounded-xl px-4 py-3 mb-3">
          <Search size={20} color="#94a3b8" />
          <Text className="text-gray-500 dark:text-slate-400 ml-3">Search templates...</Text>
        </Pressable>

        {/* Function Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
          {functions.map((func) => (
            <HapticPressable
              key={func}
              onPress={() => setSelectedFunction(func)}
              className={`px-4 py-2 rounded-lg mr-2 ${
                selectedFunction === func
                  ? 'bg-blue-500'
                  : 'bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-800'
              }`}
            >
              <Text
                className={`font-semibold text-sm ${
                  selectedFunction === func
                    ? 'text-white'
                    : 'text-gray-700 dark:text-slate-300'
                }`}
              >
                {func}
              </Text>
            </HapticPressable>
          ))}
        </ScrollView>
      </View>

      {/* Templates List */}
      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
        {filteredTemplates.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No templates found"
            description="Try selecting a different function to see available templates"
            iconColor="#64748b"
          />
        ) : (
          filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onPress={() => handleTemplatePress(template)}
            />
          ))
        )}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
