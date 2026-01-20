/**
 * TaskEffortTimeline
 * Displays effort timeline in compact format: "16 TU @ 8/wk = ~2w"
 * Includes progress bar
 */

import { View, Text } from 'react-native';
import { TaskProgressBar } from './TaskProgressBar';

interface TaskEffortTimelineProps {
  totalTU: number;
  velocityPerWeek: number;
  estimatedWeeks: number;
  completed: number;
  showProgressBar?: boolean;
}

export function TaskEffortTimeline({
  totalTU,
  velocityPerWeek,
  estimatedWeeks,
  completed,
  showProgressBar = true,
}: TaskEffortTimelineProps) {
  // Format estimated weeks
  const weeksFormatted = !isFinite(estimatedWeeks)
    ? '∞'
    : estimatedWeeks === 0
    ? '0w'
    : `~${estimatedWeeks < 10 ? Math.round(estimatedWeeks * 10) / 10 : Math.round(estimatedWeeks)}w`;

  // Format velocity
  const velocityFormatted = Math.round(velocityPerWeek);

  return (
    <View className="gap-1">
      {showProgressBar && (
        <TaskProgressBar completed={completed} total={totalTU} variant="thin" />
      )}
      <Text className="text-slate-600 dark:text-slate-400 text-[11px]">
        {totalTU} TU @ {velocityFormatted}/wk = {weeksFormatted}
      </Text>
    </View>
  );
}
