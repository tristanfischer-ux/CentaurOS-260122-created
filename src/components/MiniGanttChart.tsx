import { View, Text, ScrollView, Pressable } from 'react-native';
import { useMemo } from 'react';
import { type WorkPlan } from '@/lib/state/work-plan-store';
import { Calendar } from 'lucide-react-native';

interface MiniGanttChartProps {
  workPlans: WorkPlan[];
  onTaskPress?: (taskId: string) => void;
}

// Calculate week number from a date
const getWeekNumber = (date: Date): number => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

// Get the start of week for a date (Monday)
const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff));
};

// Format date as "Jan 15"
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
};

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'not-started': { bg: 'bg-gray-200 dark:bg-gray-700', border: 'border-gray-400 dark:border-gray-600', text: 'text-gray-700 dark:text-gray-300' },
  'in-progress': { bg: 'bg-blue-400 dark:bg-blue-600', border: 'border-blue-600 dark:border-blue-400', text: 'text-white' },
  'blocked': { bg: 'bg-red-400 dark:bg-red-600', border: 'border-red-600 dark:border-red-400', text: 'text-white' },
  'completed': { bg: 'bg-emerald-400 dark:bg-emerald-600', border: 'border-emerald-600 dark:border-emerald-400', text: 'text-white' },
  'abandoned': { bg: 'bg-gray-300 dark:bg-gray-800', border: 'border-gray-500 dark:border-gray-700', text: 'text-gray-600 dark:text-gray-400' },
};

export function MiniGanttChart({ workPlans, onTaskPress }: MiniGanttChartProps) {
  const today = useMemo(() => new Date(), []);
  const currentWeek = useMemo(() => getWeekNumber(today), [today]);

  // Generate 13 weeks: 6 weeks before, current week, 6 weeks after
  const weeks = useMemo(() => {
    const result = [];
    for (let i = -6; i <= 6; i++) {
      const weekDate = new Date(today);
      weekDate.setDate(today.getDate() + i * 7);
      const weekStart = getWeekStart(weekDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      result.push({
        offset: i,
        weekNumber: getWeekNumber(weekDate),
        weekStart,
        weekEnd,
        label: i === 0 ? 'This Week' : formatDate(weekStart),
        isCurrentWeek: i === 0,
      });
    }
    return result;
  }, [today]);

  // Filter active tasks (not completed or abandoned)
  const activeTasks = useMemo(() => {
    return workPlans
      .filter(wp => wp.status !== 'completed' && wp.status !== 'abandoned')
      .sort((a, b) => {
        // Sort by due date
        const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return aDate - bDate;
      });
  }, [workPlans]);

  // Calculate task position and width for each task
  const taskBars = useMemo(() => {
    return activeTasks.map(task => {
      const dueDate = task.dueDate ? new Date(task.dueDate) : new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000); // Default 2 weeks from today

      // Calculate start date based on estimated time units (1 TU = 4 hours, assume 8 hours per day)
      const estimatedDays = Math.ceil((task.estimatedTimeUnits * 4) / 8);
      const startDate = new Date(dueDate.getTime() - estimatedDays * 24 * 60 * 60 * 1000);

      // Find which weeks this task spans
      const startWeek = getWeekNumber(startDate);
      const endWeek = getWeekNumber(dueDate);

      // Calculate offset from current week
      const startOffset = startWeek - currentWeek;
      const endOffset = endWeek - currentWeek;

      // Calculate width (how many weeks this task spans)
      const widthInWeeks = Math.max(1, endOffset - startOffset + 1);

      return {
        task,
        startOffset,
        endOffset,
        widthInWeeks,
        startDate,
        dueDate,
      };
    });
  }, [activeTasks, currentWeek]);

  const WEEK_WIDTH = 80; // Width of each week column in pixels
  const TASK_HEIGHT = 32; // Height of each task bar

  return (
    <View className="mb-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden">
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Calendar size={18} color="#6b7280" />
          <Text className="text-gray-900 dark:text-white text-sm font-bold">
            TASK TIMELINE
          </Text>
        </View>
        <Text className="text-gray-500 dark:text-slate-400 text-xs">
          {activeTasks.length} active tasks
        </Text>
      </View>

      {/* Timeline Content */}
      <View className="relative">
        {/* Week Headers */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          contentOffset={{ x: WEEK_WIDTH * 5.5, y: 0 }} // Start slightly before current week
          className="border-b border-gray-200 dark:border-slate-700"
        >
          <View className="flex-row">
            {weeks.map((week, idx) => (
              <View
                key={idx}
                className={`border-r border-gray-200 dark:border-slate-700 py-2 ${
                  week.isCurrentWeek ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
                style={{ width: WEEK_WIDTH }}
              >
                <Text
                  className={`text-center text-[10px] font-semibold ${
                    week.isCurrentWeek
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-slate-400'
                  }`}
                >
                  {week.label}
                </Text>
                <Text className="text-center text-[9px] text-gray-400 dark:text-slate-500 mt-0.5">
                  W{week.weekNumber}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Task Bars */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: WEEK_WIDTH * 5.5, y: 0 }} // Start slightly before current week
          className="max-h-[280px]"
        >
          <View style={{ width: WEEK_WIDTH * weeks.length }}>
            {/* Current week indicator line */}
            <View
              className="absolute top-0 bottom-0 w-0.5 bg-blue-500 dark:bg-blue-400 opacity-50"
              style={{ left: WEEK_WIDTH * 6 + WEEK_WIDTH / 2 }}
            />

            {/* Task bars */}
            <View className="py-2">
              {taskBars.map((bar, idx) => {
                const colors = STATUS_COLORS[bar.task.status] || STATUS_COLORS['not-started'];
                const leftPosition = WEEK_WIDTH * (bar.startOffset + 6); // +6 to account for weeks before
                const barWidth = WEEK_WIDTH * bar.widthInWeeks - 8; // -8 for padding

                return (
                  <Pressable
                    key={bar.task.id}
                    onPress={() => onTaskPress?.(bar.task.id)}
                    className="mb-2"
                    style={{
                      marginLeft: Math.max(0, leftPosition) + 4,
                      width: Math.max(60, barWidth),
                      height: TASK_HEIGHT,
                    }}
                  >
                    <View
                      className={`flex-row items-center px-2 py-1 rounded-lg border-2 ${colors.bg} ${colors.border} active:opacity-70`}
                      style={{ height: TASK_HEIGHT }}
                    >
                      <View className="flex-1">
                        <Text
                          className={`text-[10px] font-semibold ${colors.text}`}
                          numberOfLines={1}
                        >
                          {bar.task.title}
                        </Text>
                        <Text
                          className={`text-[8px] ${colors.text} opacity-80`}
                          numberOfLines={1}
                        >
                          {bar.task.function} • {bar.task.progress}%
                        </Text>
                      </View>
                      {/* Progress indicator */}
                      {bar.task.status === 'in-progress' && (
                        <View className="ml-1 w-1 h-1 rounded-full bg-white" />
                      )}
                    </View>
                  </Pressable>
                );
              })}

              {/* Empty state */}
              {taskBars.length === 0 && (
                <View className="items-center justify-center py-8">
                  <Text className="text-gray-400 dark:text-slate-500 text-sm">
                    No active tasks
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Legend */}
        <View className="px-4 py-2 border-t border-gray-200 dark:border-slate-700 flex-row items-center justify-end gap-3">
          <View className="flex-row items-center gap-1">
            <View className="w-2.5 h-2.5 rounded border-2 bg-gray-200 border-gray-400" />
            <Text className="text-gray-600 dark:text-slate-400 text-[9px]">Not Started</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <View className="w-2.5 h-2.5 rounded border-2 bg-blue-400 border-blue-600" />
            <Text className="text-gray-600 dark:text-slate-400 text-[9px]">In Progress</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <View className="w-2.5 h-2.5 rounded border-2 bg-red-400 border-red-600" />
            <Text className="text-gray-600 dark:text-slate-400 text-[9px]">Blocked</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
