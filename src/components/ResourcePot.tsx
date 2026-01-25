/**
 * Resource Pot Component
 *
 * Displays total capacity (squares) available vs allocated
 * Shows breakdown by role and daily/weekly view
 */

import { View, Text, Pressable } from 'react-native';
import { useState } from 'react';
import { Users, Clock, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useBuildQueueStore } from '@/lib/state/build-queue-store';

interface ResourcePotProps {
  workspaceId: string;
}

export function ResourcePot({ workspaceId }: ResourcePotProps) {
  const [expanded, setExpanded] = useState(false);

  const getTotalDailyCapacity = useBuildQueueStore(s => s.getTotalDailyCapacity);
  const getWeeklyCapacity = useBuildQueueStore(s => s.getWeeklyCapacity);
  const people = useBuildQueueStore(s => s.people);

  const dailyCapacity = getTotalDailyCapacity(workspaceId);
  const weeklyCapacity = getWeeklyCapacity(workspaceId);

  const isOverAllocated = dailyCapacity.allocatedSquares > dailyCapacity.totalSquares;
  const utilizationPercent = dailyCapacity.totalSquares > 0
    ? Math.round((dailyCapacity.allocatedSquares / dailyCapacity.totalSquares) * 100)
    : 0;

  // Get weekly totals
  const weeklyTotalSquares = dailyCapacity.totalSquares * 5; // 5 working days
  const weeklyAllocated = weeklyCapacity.slice(0, 5).reduce((sum, d) => sum + d.allocatedSquares, 0);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Founder': return '#8b5cf6';
      case 'FractionalExec': return '#3b82f6';
      case 'Apprentice': return '#10b981';
      default: return '#64748b';
    }
  };

  return (
    <View className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <Pressable
        onPress={() => setExpanded(!expanded)}
        className="active:opacity-70"
      >
        <LinearGradient
          colors={isOverAllocated ? ['#ef4444', '#dc2626'] : ['#8b5cf6', '#6366f1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ padding: 16 }}
        >
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-white/20 rounded-lg items-center justify-center">
                <Clock size={20} color="#fff" />
              </View>
              <View className="ml-3">
                <Text className="text-white/70 text-xs font-medium">RESOURCE POT</Text>
                <Text className="text-white font-bold text-lg">
                  {dailyCapacity.availableSquares} squares available today
                </Text>
              </View>
            </View>
            {expanded ? (
              <ChevronUp size={20} color="#fff" />
            ) : (
              <ChevronDown size={20} color="#fff" />
            )}
          </View>

          {/* Quick Stats */}
          <View className="flex-row gap-3">
            <View className="flex-1 bg-white/10 rounded-lg p-2">
              <Text className="text-white/70 text-xs">Total</Text>
              <Text className="text-white font-bold">{dailyCapacity.totalSquares} □/day</Text>
            </View>
            <View className="flex-1 bg-white/10 rounded-lg p-2">
              <Text className="text-white/70 text-xs">Allocated</Text>
              <Text className="text-white font-bold">{dailyCapacity.allocatedSquares} □/day</Text>
            </View>
            <View className="flex-1 bg-white/10 rounded-lg p-2">
              <Text className="text-white/70 text-xs">Utilization</Text>
              <Text className="text-white font-bold">{utilizationPercent}%</Text>
            </View>
          </View>

          {/* Over-allocation Warning */}
          {isOverAllocated && (
            <View className="flex-row items-center mt-3 bg-white/20 rounded-lg p-2">
              <AlertTriangle size={16} color="#fff" />
              <Text className="text-white font-semibold text-xs ml-2">
                Over-allocated by {dailyCapacity.allocatedSquares - dailyCapacity.totalSquares} squares!
              </Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>

      {/* Expanded Content */}
      {expanded && (
        <View className="p-4">
          {/* By Role */}
          <Text className="text-gray-500 dark:text-slate-400 text-xs font-bold mb-3 tracking-wide">
            CAPACITY BY ROLE
          </Text>
          <View className="gap-2 mb-4">
            {(['Founder', 'FractionalExec', 'Apprentice'] as const).map(role => {
              const roleCapacity = dailyCapacity.byRole[role];
              const rolePeople = people.filter(p => p.role === role);

              return (
                <View
                  key={role}
                  className="flex-row items-center justify-between bg-gray-50 dark:bg-slate-900 rounded-xl p-3"
                >
                  <View className="flex-row items-center">
                    <View
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getRoleColor(role) }}
                    />
                    <Text className="text-gray-900 dark:text-white font-semibold text-sm ml-2">
                      {role === 'FractionalExec' ? 'Executives' : role + 's'}
                    </Text>
                    <Text className="text-gray-500 dark:text-slate-400 text-xs ml-2">
                      ({rolePeople.length} people)
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    {/* Visual squares */}
                    <View className="flex-row gap-0.5 mr-2">
                      {Array.from({ length: Math.min(roleCapacity, 6) }).map((_, i) => (
                        <View
                          key={i}
                          className="w-3 h-3 rounded-sm"
                          style={{ backgroundColor: getRoleColor(role) }}
                        />
                      ))}
                      {roleCapacity > 6 && (
                        <Text className="text-gray-500 text-xs ml-1">+{roleCapacity - 6}</Text>
                      )}
                    </View>
                    <Text className="text-gray-900 dark:text-white font-bold text-sm">
                      {roleCapacity} □
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Weekly View */}
          <Text className="text-gray-500 dark:text-slate-400 text-xs font-bold mb-3 tracking-wide">
            WEEKLY FORECAST
          </Text>
          <View className="bg-gray-50 dark:bg-slate-900 rounded-xl p-3">
            <View className="flex-row justify-between mb-2">
              {weeklyCapacity.slice(0, 5).map((day, i) => {
                const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
                const utilization = day.totalSquares > 0
                  ? (day.allocatedSquares / day.totalSquares) * 100
                  : 0;

                return (
                  <View key={i} className="items-center flex-1">
                    <Text className="text-gray-500 dark:text-slate-400 text-xs mb-1">
                      {dayNames[i]}
                    </Text>
                    <View className="w-8 h-16 bg-gray-200 dark:bg-slate-700 rounded overflow-hidden">
                      <View
                        className="absolute bottom-0 left-0 right-0 rounded-b"
                        style={{
                          height: `${Math.min(utilization, 100)}%`,
                          backgroundColor: utilization > 100 ? '#ef4444' : '#8b5cf6',
                        }}
                      />
                    </View>
                    <Text className="text-gray-900 dark:text-white text-xs font-semibold mt-1">
                      {day.availableSquares}
                    </Text>
                  </View>
                );
              })}
            </View>
            <View className="flex-row justify-between pt-2 border-t border-gray-200 dark:border-slate-700">
              <Text className="text-gray-500 dark:text-slate-400 text-xs">
                Weekly Total: {weeklyTotalSquares} squares
              </Text>
              <Text className="text-gray-900 dark:text-white text-xs font-semibold">
                {weeklyTotalSquares - weeklyAllocated} available
              </Text>
            </View>
          </View>

          {/* Legend */}
          <View className="flex-row items-center justify-center mt-3 gap-4">
            <View className="flex-row items-center">
              <View className="w-3 h-3 bg-purple-500 rounded-sm" />
              <Text className="text-gray-500 dark:text-slate-400 text-xs ml-1">Allocated</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 bg-gray-200 dark:bg-slate-700 rounded-sm" />
              <Text className="text-gray-500 dark:text-slate-400 text-xs ml-1">Available</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 bg-red-500 rounded-sm" />
              <Text className="text-gray-500 dark:text-slate-400 text-xs ml-1">Over</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
