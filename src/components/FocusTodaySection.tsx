/**
 * Focus Today Section - Redesigned
 * More compact, actionable AI-Powered Priority Task Surfacing
 * Shows inline quick actions without horizontal scrolling
 */

import { View, Text, Pressable } from 'react-native';
import { Sparkles, CheckCircle, Play, AlertTriangle, ChevronRight } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useWorkPlanStore, type WorkPlan } from '@/lib/state/work-plan-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { getFocusTodayTasks, type PriorityScore } from '@/lib/ai-priority-scoring';
import { useTheme } from '@/lib/ThemeContext';
import { TaskQuickActionsModal } from './TaskQuickActionsModal';
import { lightImpact, successNotification } from '@/lib/haptics';

interface FocusTodaySectionProps {
  onTaskPress?: (taskId: string) => void;
}

// Status badge component
function StatusBadge({ status }: { status: WorkPlan['status'] }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const config = {
    'not-started': { label: 'Todo', color: '#6b7280', bg: isDark ? 'rgba(107, 114, 128, 0.2)' : '#f3f4f6' },
    'in-progress': { label: 'Doing', color: '#3b82f6', bg: isDark ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe' },
    'blocked': { label: 'Blocked', color: '#ef4444', bg: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2' },
    'completed': { label: 'Done', color: '#10b981', bg: isDark ? 'rgba(16, 185, 129, 0.2)' : '#d1fae5' },
    'abandoned': { label: 'Closed', color: '#9ca3af', bg: isDark ? 'rgba(156, 163, 175, 0.2)' : '#f3f4f6' },
  };

  const c = config[status] || config['not-started'];

  return (
    <View style={{ backgroundColor: c.bg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
      <Text style={{ fontSize: 9, fontWeight: '600', color: c.color }}>{c.label}</Text>
    </View>
  );
}

// Compact task row
function FocusTaskRow({
  priorityScore,
  onPress,
  onQuickAction,
}: {
  priorityScore: PriorityScore;
  onPress: () => void;
  onQuickAction: () => void;
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const task = priorityScore.task;
  const updateWorkPlan = useWorkPlanStore(s => s.updateWorkPlan);

  const handleStartTask = () => {
    lightImpact();
    updateWorkPlan(task.id, { status: 'in-progress' });
    successNotification();
  };

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: isDark ? '#334155' : '#e2e8f0',
      }}
    >
      {/* Priority indicator */}
      <View
        style={{
          width: 4,
          height: 36,
          backgroundColor: priorityScore.level === 'critical' ? '#ef4444' : priorityScore.level === 'high' ? '#f59e0b' : '#22c55e',
          borderRadius: 2,
          marginRight: 10,
        }}
      />

      {/* Task info */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <StatusBadge status={task.status} />
          {task.function && (
            <Text style={{ fontSize: 9, color: isDark ? '#94a3b8' : '#64748b' }}>
              {task.function}
            </Text>
          )}
        </View>
        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: isDark ? '#ffffff' : '#0f172a',
            marginBottom: 2,
          }}
          numberOfLines={1}
        >
          {task.title}
        </Text>
        <Text
          style={{
            fontSize: 10,
            color: isDark ? '#64748b' : '#94a3b8',
          }}
          numberOfLines={1}
        >
          {priorityScore.reasoning}
        </Text>
      </View>

      {/* Quick actions */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {task.status === 'not-started' && (
          <Pressable
            onPress={handleStartTask}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Play size={14} color="#3b82f6" fill="#3b82f6" />
          </Pressable>
        )}
        {task.status === 'blocked' && (
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertTriangle size={14} color="#ef4444" />
          </View>
        )}
        <Pressable
          onPress={onQuickAction}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: isDark ? '#334155' : '#f1f5f9',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronRight size={14} color={isDark ? '#94a3b8' : '#64748b'} />
        </Pressable>
      </View>
    </Pressable>
  );
}

export function FocusTodaySection({ onTaskPress }: FocusTodaySectionProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const workPlans = useWorkPlanStore(s => s.workPlans);
  const members = useOrganizationStore(s => s.members);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const priorityTasks = useMemo(() => {
    return getFocusTodayTasks(workPlans, members, 3); // Only show top 3
  }, [workPlans, members]);

  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return workPlans.find(wp => wp.id === selectedTaskId) || null;
  }, [selectedTaskId, workPlans]);

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

      {/* Task List */}
      {priorityTasks.map((priorityScore) => (
        <FocusTaskRow
          key={priorityScore.task.id}
          priorityScore={priorityScore}
          onPress={() => onTaskPress?.(priorityScore.task.id)}
          onQuickAction={() => setSelectedTaskId(priorityScore.task.id)}
        />
      ))}

      {/* Task Quick Actions Modal */}
      <TaskQuickActionsModal
        visible={selectedTaskId !== null}
        onClose={() => setSelectedTaskId(null)}
        task={selectedTask}
        onNavigateToDetails={(taskId) => {
          setSelectedTaskId(null);
          onTaskPress?.(taskId);
        }}
      />
    </View>
  );
}
