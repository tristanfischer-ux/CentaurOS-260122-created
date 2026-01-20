/**
 * Focus Today Section - Progressive Inline Disclosure
 * AI-Powered Priority Task Surfacing
 * Click once for Medium (quick actions), click again for Full (resource planning)
 */

import { View, Text } from 'react-native';
import { Sparkles, CheckCircle } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useWorkPlanStore, type WorkPlan } from '@/lib/state/work-plan-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { getFocusTodayTasks } from '@/lib/ai-priority-scoring';
import { useTheme } from '@/lib/ThemeContext';
import { TaskCardCompact, TaskCardExpansion } from '@/components/tasks';

type ExpansionLevel = 'medium' | 'full' | null;

interface TaskExpansionState {
  taskId: string;
  level: ExpansionLevel;
}

interface FocusTodaySectionProps {
  onTaskPress?: (taskId: string) => void;
}

export function FocusTodaySection({ onTaskPress }: FocusTodaySectionProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const workPlans = useWorkPlanStore((s) => s.workPlans);
  const updateWorkPlan = useWorkPlanStore((s) => s.updateWorkPlan);
  const members = useOrganizationStore((s) => s.members);

  const [expansionState, setExpansionState] = useState<TaskExpansionState | null>(null);

  const priorityTasks = useMemo(() => {
    return getFocusTodayTasks(workPlans, members, 3);
  }, [workPlans, members]);

  const handleTaskPress = (taskId: string) => {
    if (onTaskPress) {
      onTaskPress(taskId);
    }

    // Toggle or expand
    if (expansionState?.taskId === taskId) {
      if (expansionState.level === 'medium') {
        // Go from medium → full
        setExpansionState({ taskId, level: 'full' });
      } else {
        // Collapse from full
        setExpansionState(null);
      }
    } else {
      // Expand to medium
      setExpansionState({ taskId, level: 'medium' });
    }
  };

  const handleExpandMore = (taskId: string) => {
    setExpansionState({ taskId, level: 'full' });
  };

  const handleClose = () => {
    setExpansionState(null);
  };

  if (priorityTasks.length === 0) {
    return (
      <View style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
        <View
          style={{
            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ecfdf5',
            borderRadius: 12,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <CheckCircle size={32} color="#10b981" />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: isDark ? '#ffffff' : '#0f172a',
              }}
            >
              All Caught Up!
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: isDark ? '#94a3b8' : '#64748b',
              }}
            >
              No critical tasks need attention right now.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ paddingHorizontal: 20, paddingVertical: 8 }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : '#f3e8ff',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={14} color="#8b5cf6" />
          </View>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '700',
              color: isDark ? '#ffffff' : '#0f172a',
            }}
          >
            Focus Today
          </Text>
          <View
            style={{
              backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : '#f3e8ff',
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 8,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#8b5cf6' }}>AI</Text>
          </View>
        </View>
        <View
          style={{
            backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 10,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: '600',
              color: isDark ? '#94a3b8' : '#64748b',
            }}
          >
            {priorityTasks.length} priority
          </Text>
        </View>
      </View>

      {/* Task List with Progressive Disclosure */}
      {priorityTasks.map((priorityScore) => {
        const task = priorityScore.task;
        const isExpanded = expansionState?.taskId === task.id;
        const expansionLevel = expansionState?.taskId === task.id ? expansionState.level : null;

        return (
          <View key={task.id}>
            {/* Compact card */}
            <TaskCardCompact
              task={task}
              priorityLevel={priorityScore.level}
              isExpanded={isExpanded}
              onPress={() => handleTaskPress(task.id)}
            />

            {/* Progressive inline expansion */}
            {isExpanded && expansionLevel && (
              <TaskCardExpansion
                task={task}
                level={expansionLevel}
                onClose={handleClose}
                onExpandMore={() => handleExpandMore(task.id)}
                onUpdateStatus={(status) => {
                  updateWorkPlan(task.id, { status });
                }}
                onUpdateProgress={(progress) => {
                  updateWorkPlan(task.id, { progress });
                }}
                onRescheduleDays={(days) => {
                  const currentDate = new Date(task.dueDate);
                  currentDate.setDate(currentDate.getDate() + days);
                  updateWorkPlan(task.id, {
                    dueDate: currentDate.toISOString().split('T')[0],
                  });
                }}
                onUpdateDescription={(description) => {
                  updateWorkPlan(task.id, { description });
                }}
                onSave={(updates) => {
                  updateWorkPlan(task.id, updates);
                }}
                priorityLevel={priorityScore.level}
                priorityReasoning={priorityScore.reasoning}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}
