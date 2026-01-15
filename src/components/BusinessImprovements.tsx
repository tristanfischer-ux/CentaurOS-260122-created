// Business Improvements Component - Surfaces consulting insights on Home tab
// Shows actionable recommendations from McKinsey, BCG, Bain, Deloitte, etc.

import { View, Text, Pressable, ScrollView } from 'react-native';
import { useState, useCallback } from 'react';
import { router } from 'expo-router';
import {
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Plus,
} from 'lucide-react-native';
import { useBusinessImprovementsStore, type BusinessImprovement } from '@/lib/state/business-improvements-store';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { useCurrentWorkspace } from '@/lib/state/app-store';
import { cn } from '@/lib/cn';

// Consulting firm colors
const FIRM_COLORS: Record<string, string> = {
  McKinsey: '#1a365d',
  BCG: '#00843d',
  Bain: '#cc0000',
  Deloitte: '#86bc25',
  Accenture: '#a100ff',
  EY: '#ffe600',
  PwC: '#dc6900',
  KPMG: '#00338d',
  'Oliver Wyman': '#0066cc',
  Mercer: '#005eb8',
};

interface BusinessImprovementsProps {
  isDark?: boolean;
  onRefresh?: () => void;
}

export function BusinessImprovements({ isDark = false, onRefresh }: BusinessImprovementsProps) {
  const currentWorkspace = useCurrentWorkspace();
  const improvements = useBusinessImprovementsStore((s) => s.getUnconvertedImprovements());
  const markAsConverted = useBusinessImprovementsStore((s) => s.markAsConverted);
  const addWorkPlan = useWorkPlanStore((s) => s.addWorkPlan);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Group by priority
  const criticalImprovements = improvements.filter(imp => imp.priority === 1);
  const importantImprovements = improvements.filter(imp => imp.priority === 2);
  const niceToHaveImprovements = improvements.filter(imp => imp.priority === 3);

  const handleConvertToTask = useCallback((improvement: BusinessImprovement) => {
    if (!currentWorkspace) return;

    // Create a work plan from the improvement
    const newWorkPlan = {
      id: `wp-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      workspaceId: currentWorkspace.id,
      title: improvement.title,
      description: `${improvement.rationale}\n\nExpected Impact: ${improvement.expectedImpact}\n\nSource: ${improvement.firm} ${improvement.category} analysis`,
      function: 'Admin' as const, // Default, user can change in Decide tab
      status: 'not-started' as const,
      progress: 0,
      estimatedTimeUnits: 10, // Default estimate
      allocations: [],
      appliedAITools: [],
      tusExpended: 0,
      allocatedTimeUnitsPerWeek: 0,
      assignedMemberIds: [],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      linkedOKRTitle: '',
      assignedBy: 'Consulting Insights',
      needsSubmission: false,
    };

    addWorkPlan(newWorkPlan);
    markAsConverted(improvement.id);

    // Navigate to Decide tab
    router.push('/(tabs)/decide');
  }, [currentWorkspace, addWorkPlan, markAsConverted]);

  if (improvements.length === 0) {
    return (
      <View className="px-5 pb-4">
        <View className={cn(
          'p-4 rounded-xl border flex-row items-center',
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
        )}>
          <CheckCircle2 size={20} color="#10b981" />
          <View className="ml-3 flex-1">
            <Text className={cn('font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
              No business improvements available
            </Text>
            <Text className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-gray-600')}>
              Generate a consulting dashboard report to see strategic recommendations
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/reports')}
            className="ml-2 bg-blue-500 px-3 py-2 rounded-lg active:opacity-70"
          >
            <Text className="text-white text-xs font-bold">Generate</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const renderImprovement = (improvement: BusinessImprovement) => {
    const isExpanded = expandedId === improvement.id;
    const firmColor = FIRM_COLORS[improvement.firm] || '#3b82f6';
    const priorityConfig = {
      1: { label: 'CRITICAL', color: '#ef4444', bg: isDark ? 'bg-red-500/10' : 'bg-red-50', border: 'border-red-500/30' },
      2: { label: 'IMPORTANT', color: '#f59e0b', bg: isDark ? 'bg-amber-500/10' : 'bg-amber-50', border: 'border-amber-500/30' },
      3: { label: 'OPPORTUNITY', color: '#10b981', bg: isDark ? 'bg-emerald-500/10' : 'bg-emerald-50', border: 'border-emerald-500/30' },
    }[improvement.priority];

    return (
      <Pressable
        key={improvement.id}
        onPress={() => setExpandedId(isExpanded ? null : improvement.id)}
        className={cn(
          'p-4 rounded-xl border mb-3',
          priorityConfig.bg,
          priorityConfig.border
        )}
      >
        {/* Header */}
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1 mr-3">
            <View className="flex-row items-center mb-1">
              <View
                className="px-2 py-0.5 rounded"
                style={{ backgroundColor: firmColor }}
              >
                <Text className="text-white text-[10px] font-bold">{improvement.firm}</Text>
              </View>
              <Text className="ml-2 text-[10px] font-bold uppercase" style={{ color: priorityConfig.color }}>
                {priorityConfig.label}
              </Text>
            </View>
            <Text className={cn('font-bold text-sm', isDark ? 'text-white' : 'text-gray-900')}>
              {improvement.title}
            </Text>
            <Text className={cn('text-[10px] mt-0.5 uppercase', isDark ? 'text-slate-400' : 'text-gray-600')}>
              {improvement.category} · {improvement.timeline} · {improvement.estimatedEffort || 'TBD effort'}
            </Text>
          </View>
          <ChevronRight
            size={18}
            color={isDark ? '#94a3b8' : '#64748b'}
            style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
          />
        </View>

        {/* Expanded Details */}
        {isExpanded && (
          <View className="mt-3 pt-3 border-t" style={{ borderTopColor: priorityConfig.color + '30' }}>
            <Text className={cn('text-xs font-semibold mb-1', isDark ? 'text-slate-300' : 'text-gray-700')}>
              Why This Matters:
            </Text>
            <Text className={cn('text-xs mb-3', isDark ? 'text-slate-400' : 'text-gray-600')}>
              {improvement.rationale}
            </Text>

            <Text className={cn('text-xs font-semibold mb-1', isDark ? 'text-slate-300' : 'text-gray-700')}>
              Expected Impact:
            </Text>
            <Text className={cn('text-xs mb-3', isDark ? 'text-slate-400' : 'text-gray-600')}>
              {improvement.expectedImpact}
            </Text>

            {improvement.impactMetrics && (
              <View className="flex-row gap-2 mb-3">
                {improvement.impactMetrics.runway && (
                  <View className="bg-blue-500/20 px-2 py-1 rounded">
                    <Text className="text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                      +{improvement.impactMetrics.runway.toFixed(1)}mo runway
                    </Text>
                  </View>
                )}
                {improvement.impactMetrics.burn && (
                  <View className="bg-emerald-500/20 px-2 py-1 rounded">
                    <Text className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                      £{Math.abs(improvement.impactMetrics.burn).toFixed(0)}k saved
                    </Text>
                  </View>
                )}
                {improvement.impactMetrics.productivity && (
                  <View className="bg-purple-500/20 px-2 py-1 rounded">
                    <Text className="text-purple-600 dark:text-purple-400 text-[10px] font-bold">
                      +{improvement.impactMetrics.productivity}% productivity
                    </Text>
                  </View>
                )}
              </View>
            )}

            <Pressable
              onPress={() => handleConvertToTask(improvement)}
              className="bg-blue-500 py-2.5 rounded-lg flex-row items-center justify-center active:opacity-70"
            >
              <Plus size={14} color="#fff" />
              <Text className="text-white font-bold text-xs ml-1.5">Convert to Task in Decide Tab</Text>
            </Pressable>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <View className="px-5 pb-4">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-1">
          <Text className={cn('font-black text-lg', isDark ? 'text-white' : 'text-gray-900')}>
            Business Improvements
          </Text>
          <Text className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-gray-600')}>
            Strategic recommendations from elite consulting firms
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/reports')}
          className="flex-row items-center bg-purple-500/10 px-3 py-2 rounded-lg active:opacity-70"
        >
          <Sparkles size={14} color="#a855f7" />
          <Text className="text-purple-600 dark:text-purple-400 text-xs font-bold ml-1.5">Dashboard</Text>
        </Pressable>
      </View>

      {/* Critical Improvements */}
      {criticalImprovements.length > 0 && (
        <View className="mb-3">
          <View className="flex-row items-center mb-2">
            <AlertTriangle size={14} color="#ef4444" />
            <Text className={cn('ml-1.5 text-xs font-bold uppercase', isDark ? 'text-red-400' : 'text-red-600')}>
              Critical Priority ({criticalImprovements.length})
            </Text>
          </View>
          {criticalImprovements.map(renderImprovement)}
        </View>
      )}

      {/* Important Improvements */}
      {importantImprovements.length > 0 && (
        <View className="mb-3">
          <View className="flex-row items-center mb-2">
            <Lightbulb size={14} color="#f59e0b" />
            <Text className={cn('ml-1.5 text-xs font-bold uppercase', isDark ? 'text-amber-400' : 'text-amber-600')}>
              Important ({importantImprovements.length})
            </Text>
          </View>
          {importantImprovements.slice(0, 3).map(renderImprovement)}
          {importantImprovements.length > 3 && (
            <Pressable
              onPress={() => router.push('/reports')}
              className={cn('py-2 rounded-lg', isDark ? 'bg-slate-800' : 'bg-gray-100')}
            >
              <Text className={cn('text-center text-xs font-semibold', isDark ? 'text-slate-400' : 'text-gray-600')}>
                +{importantImprovements.length - 3} more in dashboard
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Nice to Have (show 1) */}
      {niceToHaveImprovements.length > 0 && (
        <View>
          <View className="flex-row items-center mb-2">
            <TrendingUp size={14} color="#10b981" />
            <Text className={cn('ml-1.5 text-xs font-bold uppercase', isDark ? 'text-emerald-400' : 'text-emerald-600')}>
              Growth Opportunities ({niceToHaveImprovements.length})
            </Text>
          </View>
          {niceToHaveImprovements.slice(0, 1).map(renderImprovement)}
          {niceToHaveImprovements.length > 1 && (
            <Pressable
              onPress={() => router.push('/reports')}
              className={cn('py-2 rounded-lg', isDark ? 'bg-slate-800' : 'bg-gray-100')}
            >
              <Text className={cn('text-center text-xs font-semibold', isDark ? 'text-slate-400' : 'text-gray-600')}>
                +{niceToHaveImprovements.length - 1} more in dashboard
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
