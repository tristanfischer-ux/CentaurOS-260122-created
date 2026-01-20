/**
 * CoordinationCostDisplay
 * Shows coordination overhead breakdown (Full view only)
 */

import { View, Text } from 'react-native';
import { Info } from 'lucide-react-native';
import {
  calculateCoordinationCost,
  calculateNetVelocity,
  getCoordinationPenalty,
} from '@/lib/task-calculations';

interface CoordinationCostDisplayProps {
  teamSize: number;
  rawVelocity: number;
}

export function CoordinationCostDisplay({ teamSize, rawVelocity }: CoordinationCostDisplayProps) {
  const penalty = getCoordinationPenalty(teamSize);
  const coordinationCost = calculateCoordinationCost(teamSize, rawVelocity);
  const netVelocity = calculateNetVelocity(teamSize, rawVelocity);

  return (
    <View className="gap-3">
      {/* Summary */}
      <View className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
        <View className="flex-row justify-between mb-1">
          <Text className="text-slate-600 dark:text-slate-400 text-xs">Raw Velocity:</Text>
          <Text className="text-slate-900 dark:text-white text-xs font-semibold">
            {rawVelocity.toFixed(1)} TU/wk
          </Text>
        </View>
        <View className="flex-row justify-between mb-1">
          <Text className="text-slate-600 dark:text-slate-400 text-xs">
            Coordination: ({Math.round(penalty * 100)}% with {teamSize})
          </Text>
          <Text className="text-amber-600 dark:text-amber-400 text-xs font-semibold">
            -{coordinationCost.toFixed(1)} TU/wk
          </Text>
        </View>
        <View className="h-px bg-slate-300 dark:bg-slate-600 my-1" />
        <View className="flex-row justify-between">
          <Text className="text-slate-900 dark:text-white text-sm font-bold">Net Velocity:</Text>
          <Text className="text-blue-600 dark:text-blue-400 text-sm font-bold">
            {netVelocity.toFixed(1)} TU/wk
          </Text>
        </View>
      </View>

      {/* Explanation */}
      <View className="flex-row gap-2 bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
        <Info size={16} color="#3B82F6" style={{ marginTop: 2 }} />
        <View className="flex-1">
          <Text className="text-blue-900 dark:text-blue-100 text-xs font-semibold mb-1">
            More people = faster delivery BUT higher coordination cost
          </Text>
          <View className="gap-0.5">
            <Text className="text-blue-700 dark:text-blue-300 text-[10px]">
              • 1 person: No overhead (100% efficient)
            </Text>
            <Text className="text-blue-700 dark:text-blue-300 text-[10px]">
              • 2 people: 5% overhead (95% efficient)
            </Text>
            <Text className="text-blue-700 dark:text-blue-300 text-[10px]">
              • 3 people: 10% overhead (90% efficient)
            </Text>
            <Text className="text-blue-700 dark:text-blue-300 text-[10px]">
              • 4 people: 15% overhead (85% efficient)
            </Text>
            <Text className="text-blue-700 dark:text-blue-300 text-[10px]">
              • 5+ people: 20% overhead (80% efficient)
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
