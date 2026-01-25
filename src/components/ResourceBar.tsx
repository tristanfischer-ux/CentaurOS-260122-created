/**
 * Resource Bar Component
 *
 * Shows all people in the company ordered by class:
 * Founders -> Executives -> Apprentices
 *
 * Each person shows:
 * - Avatar with initials
 * - Squares (filled = allocated, empty = available)
 * - Overtime toggle
 * - Cost per square
 *
 * CLICKABLE: Opens expanded capacity allocation view
 */

import { View, Text, Pressable, ScrollView } from 'react-native';
import { useState } from 'react';
import { Plus, Clock, DollarSign, Zap, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import {
  useResourceStore,
  type PersonResource,
  type PersonClass,
  PERSON_CLASS_COLORS,
} from '@/lib/state/resource-store';

interface ResourceBarProps {
  workspaceId: string;
  onPersonPress?: (person: PersonResource) => void;
  selectedPersonId?: string;
  compact?: boolean;
  selectedTaskId?: string | null;
  onTaskSelect?: (taskId: string | null) => void;
}

// Single square component
function Square({
  filled,
  overtime,
  size = 'normal',
}: {
  filled: boolean;
  overtime?: boolean;
  size?: 'small' | 'normal';
}) {
  const sizeClass = size === 'small' ? 'w-2 h-2' : 'w-3 h-3';
  return (
    <View
      className={`${sizeClass} rounded-sm ${
        filled
          ? overtime
            ? 'bg-amber-400'
            : 'bg-emerald-500'
          : overtime
            ? 'bg-amber-200 dark:bg-amber-900/30'
            : 'bg-gray-200 dark:bg-slate-700'
      }`}
    />
  );
}

// Person card component
function PersonCard({
  person,
  onPress,
  isSelected,
  compact,
}: {
  person: PersonResource;
  onPress?: () => void;
  isSelected?: boolean;
  compact?: boolean;
}) {
  const maxSquares = person.baseSquaresPerWeek + (person.overtimeEnabled ? person.overtimeSquaresPerWeek : 0);
  const availableSquares = maxSquares - person.allocatedSquares;

  const toggleOvertime = useResourceStore(s => s.toggleOvertime);

  if (compact) {
    return (
      <Pressable
        onPress={onPress}
        className={`items-center mr-3 ${isSelected ? 'opacity-100' : 'opacity-80'}`}
      >
        {/* Avatar */}
        <View
          className={`w-10 h-10 rounded-full items-center justify-center mb-1 ${
            isSelected ? 'border-2 border-white' : ''
          }`}
          style={{ backgroundColor: person.avatarColor }}
        >
          <Text className="text-white font-bold text-sm">{person.initials}</Text>
        </View>

        {/* Mini squares row */}
        <View className="flex-row gap-0.5">
          {Array.from({ length: Math.min(maxSquares, 6) }).map((_, i) => (
            <Square
              key={i}
              filled={i < person.allocatedSquares}
              overtime={i >= person.baseSquaresPerWeek}
              size="small"
            />
          ))}
          {maxSquares > 6 && (
            <Text className="text-gray-400 text-[8px]">+{maxSquares - 6}</Text>
          )}
        </View>

        {/* Available count */}
        <Text className="text-gray-500 dark:text-slate-400 text-[10px] mt-0.5">
          {availableSquares} free
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      className={`bg-white dark:bg-slate-900 rounded-xl p-3 mr-3 border-2 ${
        isSelected
          ? 'border-purple-500'
          : 'border-gray-200 dark:border-slate-700'
      } min-w-[140px]`}
    >
      {/* Header */}
      <View className="flex-row items-center mb-2">
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-2"
          style={{ backgroundColor: person.avatarColor }}
        >
          <Text className="text-white font-bold text-sm">{person.initials}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-gray-900 dark:text-white font-semibold text-sm" numberOfLines={1}>
            {person.name}
          </Text>
          <View
            className="px-1.5 py-0.5 rounded self-start"
            style={{ backgroundColor: PERSON_CLASS_COLORS[person.personClass] + '20' }}
          >
            <Text
              className="text-[10px] font-semibold"
              style={{ color: PERSON_CLASS_COLORS[person.personClass] }}
            >
              {person.personClass}
            </Text>
          </View>
        </View>
      </View>

      {/* Squares Grid */}
      <View className="mb-2">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-gray-500 dark:text-slate-400 text-[10px] font-semibold">
            SQUARES/WEEK
          </Text>
          <Text className="text-gray-900 dark:text-white text-[10px] font-bold">
            {person.allocatedSquares}/{maxSquares}
          </Text>
        </View>

        {/* Base squares */}
        <View className="flex-row flex-wrap gap-1 mb-1">
          {Array.from({ length: person.baseSquaresPerWeek }).map((_, i) => (
            <Square key={`base-${i}`} filled={i < person.allocatedSquares} />
          ))}
        </View>

        {/* Overtime squares (if enabled) */}
        {person.overtimeEnabled && (
          <View className="flex-row flex-wrap gap-1">
            {Array.from({ length: person.overtimeSquaresPerWeek }).map((_, i) => (
              <Square
                key={`ot-${i}`}
                filled={i + person.baseSquaresPerWeek < person.allocatedSquares}
                overtime
              />
            ))}
          </View>
        )}
      </View>

      {/* Overtime Toggle */}
      <Pressable
        onPress={() => toggleOvertime(person.id)}
        className={`flex-row items-center justify-center py-1.5 rounded-lg mb-2 ${
          person.overtimeEnabled
            ? 'bg-amber-100 dark:bg-amber-900/30'
            : 'bg-gray-100 dark:bg-slate-900'
        }`}
      >
        <Clock size={12} color={person.overtimeEnabled ? '#f59e0b' : '#9ca3af'} />
        <Text
          className={`text-[10px] font-semibold ml-1 ${
            person.overtimeEnabled
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-gray-500 dark:text-slate-400'
          }`}
        >
          {person.overtimeEnabled
            ? `+${person.overtimeSquaresPerWeek} OT`
            : 'Enable Overtime'}
        </Text>
      </Pressable>

      {/* Cost */}
      <View className="flex-row items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-700">
        <View className="flex-row items-center">
          <DollarSign size={10} color="#9ca3af" />
          <Text className="text-gray-500 dark:text-slate-400 text-[10px] ml-0.5">
            £{person.costPerSquare}/□
          </Text>
        </View>
        <Text className="text-gray-900 dark:text-white text-[10px] font-semibold">
          {availableSquares} available
        </Text>
      </View>
    </Pressable>
  );
}

// Class section header
function ClassHeader({ personClass, count }: { personClass: PersonClass; count: number }) {
  return (
    <View className="flex-row items-center mb-2 mr-2">
      <View
        className="w-1.5 h-6 rounded-full mr-2"
        style={{ backgroundColor: PERSON_CLASS_COLORS[personClass] }}
      />
      <Text
        className="text-xs font-bold"
        style={{ color: PERSON_CLASS_COLORS[personClass] }}
      >
        {personClass.toUpperCase()}S ({count})
      </Text>
    </View>
  );
}

export function ResourceBar({
  workspaceId,
  onPersonPress,
  selectedPersonId,
  compact = false,
  selectedTaskId,
  onTaskSelect,
}: ResourceBarProps) {
  const people = useResourceStore(s => s.people);
  const getTotalCapacity = useResourceStore(s => s.getTotalCapacity);

  // Sort people: Founders (as-is), then Executives (by function), then Apprentices (by function)
  const founders = people.filter(p => p.personClass === 'Founder');
  const executives = people
    .filter(p => p.personClass === 'Executive')
    .sort((a, b) => a.function.localeCompare(b.function));
  const apprentices = people
    .filter(p => p.personClass === 'Apprentice')
    .sort((a, b) => a.function.localeCompare(b.function));

  const capacity = getTotalCapacity();
  const utilizationPercent = capacity.total > 0
    ? Math.round((capacity.allocated / capacity.total) * 100)
    : 0;

  if (compact) {
    return (
      <Pressable
        className="bg-slate-800 rounded-xl p-3"
      >
          {/* Capacity Summary - Clickable Header */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Text className="text-white/70 text-xs font-semibold">TEAM CAPACITY</Text>
              <ChevronRight size={14} color="#94a3b8" style={{ marginLeft: 4 }} />
            </View>
            <View className="flex-row items-center">
              <View className="flex-row items-center gap-1 mr-3 ml-2">
                {Array.from({ length: Math.min(capacity.total, 10) }).map((_, i) => (
                  <View
                    key={i}
                    className={`w-2 h-2 rounded-sm ${
                      i < capacity.allocated ? 'bg-emerald-500' : 'bg-slate-600'
                    }`}
                  />
                ))}
                {capacity.total > 10 && (
                  <Text className="text-slate-400 text-[10px] ml-0.5">+{capacity.total - 10}</Text>
                )}
              </View>
              <Text className="text-white font-bold text-sm">
                {utilizationPercent}%
              </Text>
            </View>
          </View>

          {/* People Row */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} scrollEnabled={false}>
            <View className="flex-row items-start">
              {/* Founders */}
              {founders.map(person => (
                <PersonCard
                  key={person.id}
                  person={person}
                  onPress={() => onPersonPress?.(person)}
                  isSelected={selectedPersonId === person.id}
                  compact
                />
              ))}

              {/* Divider */}
              {founders.length > 0 && executives.length > 0 && (
                <View className="w-px h-12 bg-slate-600 mr-3" />
              )}

              {/* Executives */}
              {executives.map(person => (
                <PersonCard
                  key={person.id}
                  person={person}
                  onPress={() => onPersonPress?.(person)}
                  isSelected={selectedPersonId === person.id}
                  compact
                />
              ))}

              {/* Divider */}
              {executives.length > 0 && apprentices.length > 0 && (
                <View className="w-px h-12 bg-slate-600 mr-3" />
              )}

              {/* Apprentices */}
              {apprentices.map(person => (
                <PersonCard
                  key={person.id}
                  person={person}
                  onPress={() => onPersonPress?.(person)}
                  isSelected={selectedPersonId === person.id}
                  compact
                />
              ))}
            </View>
          </ScrollView>
        </Pressable>
    );
  }

  return (
    <Pressable
      className="bg-white dark:bg-slate-950"
    >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
          <View>
            <View className="flex-row items-center">
              <Text className="text-gray-500 dark:text-slate-400 text-xs font-semibold">
                TEAM RESOURCES
              </Text>
              <ChevronRight size={14} color="#94a3b8" style={{ marginLeft: 4 }} />
            </View>
            <Text className="text-gray-900 dark:text-white font-bold text-lg">
              {capacity.allocated}/{capacity.total} squares allocated
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-gray-500 dark:text-slate-400 text-xs">Utilization</Text>
            <View className="flex-row items-center">
              <View
                className={`w-3 h-3 rounded-full mr-1.5 ${
                  utilizationPercent > 80
                    ? 'bg-emerald-500'
                    : utilizationPercent > 50
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                }`}
              />
              <Text className="text-gray-900 dark:text-white font-bold text-xl">
                {utilizationPercent}%
              </Text>
            </View>
          </View>
        </View>

        {/* People by Class */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 py-3" scrollEnabled={false}>
          <View className="flex-row">
            {/* Founders Section */}
            {founders.length > 0 && (
              <View className="mr-4">
                <ClassHeader personClass="Founder" count={founders.length} />
                <View className="flex-row">
                  {founders.map(person => (
                    <PersonCard
                      key={person.id}
                      person={person}
                      onPress={() => onPersonPress?.(person)}
                      isSelected={selectedPersonId === person.id}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Executives Section */}
            {executives.length > 0 && (
              <View className="mr-4">
                <ClassHeader personClass="Executive" count={executives.length} />
                <View className="flex-row">
                  {executives.map(person => (
                    <PersonCard
                      key={person.id}
                      person={person}
                      onPress={() => onPersonPress?.(person)}
                      isSelected={selectedPersonId === person.id}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Apprentices Section */}
            {apprentices.length > 0 && (
              <View>
                <ClassHeader personClass="Apprentice" count={apprentices.length} />
                <View className="flex-row">
                  {apprentices.map(person => (
                    <PersonCard
                      key={person.id}
                      person={person}
                      onPress={() => onPersonPress?.(person)}
                      isSelected={selectedPersonId === person.id}
                    />
                  ))}
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </Pressable>
  );
}

/**
 * Compact inline resource indicator for cards
 */
export function ResourceIndicator({
  allocatedSquares,
  totalSquares,
  cost,
  showCost = true,
}: {
  allocatedSquares: number;
  totalSquares: number;
  cost?: number;
  showCost?: boolean;
}) {
  return (
    <View className="flex-row items-center">
      <View className="flex-row items-center gap-0.5 mr-2">
        {Array.from({ length: Math.min(totalSquares, 8) }).map((_, i) => (
          <View
            key={i}
            className={`w-2 h-2 rounded-sm ${
              i < allocatedSquares ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-slate-700'
            }`}
          />
        ))}
        {totalSquares > 8 && (
          <Text className="text-gray-400 text-[8px]">+{totalSquares - 8}</Text>
        )}
      </View>
      <Text className="text-gray-600 dark:text-slate-300 text-[10px] font-semibold">
        {allocatedSquares}/{totalSquares}□
      </Text>
      {showCost && cost !== undefined && cost > 0 && (
        <Text className="text-gray-400 dark:text-slate-500 text-[10px] ml-1.5">
          £{cost.toLocaleString()}
        </Text>
      )}
    </View>
  );
}
