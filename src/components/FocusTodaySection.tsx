/**
 * Focus Today Section - Redesigned with Standardized Task Cards
 * AI-Powered Priority Task Surfacing using TaskCardCompact
 * Inline expansion for quick actions
 */

import { View, Text, Pressable } from 'react-native';
import { Sparkles, CheckCircle } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useWorkPlanStore, type WorkPlan } from '@/lib/state/work-plan-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { getFocusTodayTasks, type PriorityScore } from '@/lib/ai-priority-scoring';
import { useTheme } from '@/lib/ThemeContext';
import { TaskCardCompact, TaskCardMediumInline, TaskCardFull } from '@/components/tasks';

interface FocusTodaySectionProps {
  onTaskPress?: (taskId: string) => void;
  expandedTaskId?: string | null;
  onExpandTask?: (taskId: string | null) => void;
  selectedTask?: WorkPlan | null;
  showFullModal?: boolean;
  onShowFullModal?: (show: boolean, task: WorkPlan | null) => void;
}

export function FocusTodaySection({
  onTaskPress,
  expandedTaskId,
  onExpandTask,
  selectedTask,
  showFullModal,
  onShowFullModal,
}: FocusTodaySectionProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const workPlans = useWorkPlanStore(s => s.workPlans);
  const updateWorkPlan = useWorkPlanStore(s => s.updateWorkPlan);
  const members = useOrganizationStore(s => s.members);

  // Local state fallback if parent doesn't manage state
  const [localExpandedId, setLocalExpandedId] = useState<string | null>(null);
  const [localSelectedTask, setLocalSelectedTask] = useState<WorkPlan | null>(null);
  const [localShowFullModal, setLocalShowFullModal] = useState(false);

  const activeExpandedId = expandedTaskId !== undefined ? expandedTaskId : localExpandedId;
  const setActiveExpandedId = onExpandTask || setLocalExpandedId;
  const activeSelectedTask = selectedTask !== undefined ? selectedTask : localSelectedTask;
  const activeShowFullModal = showFullModal !== undefined ? showFullModal : localShowFullModal;
  const setActiveShowFullModal = onShowFullModal || ((show: boolean, task: WorkPlan | null) => {
    setLocalShowFullModal(show);
    setLocalSelectedTask(task);
  });

  const priorityTasks = useMemo(() => {
    return getFocusTodayTasks(workPlans, members, 3); // Only show top 3
  }, [workPlans, members]);

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
      {/* Compact Header */}
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

      {/* Task List with Priority Indicators */}
      {priorityTasks.map((priorityScore) => {
        const task = priorityScore.task;
        const isExpanded = activeExpandedId === task.id;

        return (
          <View key={task.id}>
            {/* Compact card with priority indicator built-in */}
            <TaskCardCompact
              task={task}
              priorityLevel={priorityScore.level}
              isExpanded={isExpanded}
              onPress={() => {
                if (isExpanded) {
                  setActiveExpandedId(null);
                } else {
                  setActiveExpandedId(task.id);
                }
              }}
            />

            {/* Inline Expansion */}
            {isExpanded && (
              <TaskCardMediumInline
                task={task}
                onClose={() => setActiveExpandedId(null)}
                onViewFullDetails={() => {
                  setActiveExpandedId(null);
                  setActiveShowFullModal(true, task);
                }}
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
                priorityLevel={priorityScore.level}
                priorityReasoning={priorityScore.reasoning}
              />
            )}
          </View>
        );
      })}

      {/* Full Modal - only render if managed by parent */}
      {activeSelectedTask && activeShowFullModal && onShowFullModal && (
        <TaskCardFull
          task={activeSelectedTask}
          visible={activeShowFullModal}
          onClose={() => setActiveShowFullModal(false, null)}
          onSave={(updates) => {
            updateWorkPlan(activeSelectedTask.id, updates);
            setActiveShowFullModal(false, null);
          }}
        />
      )}
    </View>
  );
}
