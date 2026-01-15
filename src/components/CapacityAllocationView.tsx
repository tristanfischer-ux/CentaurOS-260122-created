/**
 * Capacity Allocation View
 *
 * Expanded view showing each person's time slots as tappable squares.
 * - Left column: Person avatar + name
 * - Middle: Squares grid (tappable for allocation)
 * - Right: Cost per square
 *
 * When a task is selected:
 * - Tap squares to allocate/deallocate time to that task
 * - Visual feedback shows which squares are used for which task
 */

import { View, Text, Pressable, ScrollView, Modal } from 'react-native';
import { useState, useCallback } from 'react';
import { X, ChevronDown, ChevronUp, Zap } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  useResourceStore,
  type PersonResource,
  type TaskResource,
  PERSON_CLASS_COLORS,
} from '@/lib/state/resource-store';

interface CapacityAllocationViewProps {
  visible: boolean;
  onClose: () => void;
  selectedTaskId?: string | null;
  onTaskSelect?: (taskId: string | null) => void;
  workspaceId: string;
}

// Individual square that can be tapped
function TappableSquare({
  index,
  filled,
  overtime,
  allocatedToTask,
  isSelectedTask,
  onPress,
  disabled,
}: {
  index: number;
  filled: boolean;
  overtime: boolean;
  allocatedToTask: boolean;
  isSelectedTask: boolean;
  onPress: () => void;
  disabled: boolean;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (disabled) return;
    scale.value = withSpring(0.8, { damping: 15 }, () => {
      scale.value = withSpring(1);
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const getBgColor = () => {
    if (allocatedToTask && isSelectedTask) {
      // This square is allocated to the currently selected task
      return 'bg-purple-500';
    }
    if (filled) {
      // Allocated to another task
      return overtime ? 'bg-amber-400' : 'bg-emerald-500';
    }
    // Available
    return overtime ? 'bg-amber-200/30' : 'bg-slate-700';
  };

  const getBorderStyle = () => {
    if (isSelectedTask && !disabled) {
      return 'border border-purple-400';
    }
    return '';
  };

  return (
    <Pressable onPress={handlePress} disabled={disabled}>
      <Animated.View
        style={animatedStyle}
        className={`w-6 h-6 rounded ${getBgColor()} ${getBorderStyle()} items-center justify-center`}
      >
        {allocatedToTask && isSelectedTask && (
          <Text className="text-white text-[8px] font-bold">✓</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

// Person row showing their squares
function PersonRow({
  person,
  selectedTaskId,
  onAllocate,
  onDeallocate,
  taskAllocations,
}: {
  person: PersonResource;
  selectedTaskId: string | null;
  onAllocate: (personId: string, squares: number) => void;
  onDeallocate: (personId: string) => void;
  taskAllocations: Map<string, { personId: string; squares: number }[]>;
}) {
  const maxSquares = person.baseSquaresPerWeek + (person.overtimeEnabled ? person.overtimeSquaresPerWeek : 0);
  const availableSquares = maxSquares - person.allocatedSquares;

  // Find which task each square is allocated to
  const getSquareAllocation = (squareIndex: number): { taskId: string; isForSelectedTask: boolean } | null => {
    let currentIndex = 0;

    for (const [taskId, allocations] of taskAllocations) {
      const personAlloc = allocations.find(a => a.personId === person.id);
      if (personAlloc) {
        if (squareIndex >= currentIndex && squareIndex < currentIndex + personAlloc.squares) {
          return { taskId, isForSelectedTask: taskId === selectedTaskId };
        }
        currentIndex += personAlloc.squares;
      }
    }
    return null;
  };

  // Get current allocation for selected task
  const getCurrentAllocationForTask = () => {
    if (!selectedTaskId) return 0;
    const allocations = taskAllocations.get(selectedTaskId);
    if (!allocations) return 0;
    const personAlloc = allocations.find(a => a.personId === person.id);
    return personAlloc?.squares || 0;
  };

  const currentTaskAllocation = getCurrentAllocationForTask();

  const handleSquarePress = (index: number) => {
    if (!selectedTaskId) return;

    const allocation = getSquareAllocation(index);

    if (allocation?.isForSelectedTask) {
      // Deallocate one square
      if (currentTaskAllocation > 1) {
        onAllocate(person.id, currentTaskAllocation - 1);
      } else {
        onDeallocate(person.id);
      }
    } else if (!allocation && index < maxSquares) {
      // Allocate one more square
      if (index < person.allocatedSquares + (maxSquares - person.allocatedSquares)) {
        onAllocate(person.id, currentTaskAllocation + 1);
      }
    }
  };

  return (
    <Animated.View
      entering={FadeIn.delay(50)}
      className="flex-row items-center py-3 border-b border-slate-700/50"
    >
      {/* Person Info - Left */}
      <View className="flex-row items-center w-28">
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-2"
          style={{ backgroundColor: person.avatarColor }}
        >
          <Text className="text-white font-bold text-sm">{person.initials}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-white font-medium text-xs" numberOfLines={1}>
            {person.name.split(' ')[0]}
          </Text>
          <Text
            className="text-[10px] font-semibold"
            style={{ color: PERSON_CLASS_COLORS[person.personClass] }}
          >
            {person.personClass.charAt(0)}
          </Text>
        </View>
      </View>

      {/* Squares Grid - Middle */}
      <View className="flex-1 flex-row flex-wrap gap-1 px-2">
        {/* Base squares */}
        {Array.from({ length: person.baseSquaresPerWeek }).map((_, i) => {
          const allocation = getSquareAllocation(i);
          return (
            <TappableSquare
              key={`base-${i}`}
              index={i}
              filled={i < person.allocatedSquares}
              overtime={false}
              allocatedToTask={allocation !== null}
              isSelectedTask={allocation?.isForSelectedTask || false}
              onPress={() => handleSquarePress(i)}
              disabled={!selectedTaskId}
            />
          );
        })}

        {/* Overtime squares */}
        {person.overtimeEnabled &&
          Array.from({ length: person.overtimeSquaresPerWeek }).map((_, i) => {
            const realIndex = person.baseSquaresPerWeek + i;
            const allocation = getSquareAllocation(realIndex);
            return (
              <TappableSquare
                key={`ot-${i}`}
                index={realIndex}
                filled={realIndex < person.allocatedSquares}
                overtime={true}
                allocatedToTask={allocation !== null}
                isSelectedTask={allocation?.isForSelectedTask || false}
                onPress={() => handleSquarePress(realIndex)}
                disabled={!selectedTaskId}
              />
            );
          })}
      </View>

      {/* Cost - Right */}
      <View className="items-end w-16">
        <Text className="text-white font-bold text-sm">
          £{person.costPerSquare}
        </Text>
        <Text className="text-slate-400 text-[10px]">per □</Text>
      </View>
    </Animated.View>
  );
}

// Task card for selection
function TaskSelectCard({
  task,
  isSelected,
  onPress,
  people,
}: {
  task: TaskResource;
  isSelected: boolean;
  onPress: () => void;
  people: PersonResource[];
}) {
  const progressPercent = task.totalSquaresRequired > 0
    ? Math.round((task.squaresCompleted / task.totalSquaresRequired) * 100)
    : 0;

  return (
    <Pressable
      onPress={onPress}
      className={`rounded-xl p-3 mr-3 min-w-[160px] ${
        isSelected
          ? 'bg-purple-600 border-2 border-purple-400'
          : 'bg-slate-800 border border-slate-700'
      }`}
    >
      <Text className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-slate-200'}`} numberOfLines={1}>
        {task.title}
      </Text>
      <View className="flex-row items-center mt-1">
        <Text className={`text-xs ${isSelected ? 'text-purple-200' : 'text-slate-400'}`}>
          {task.squaresAllocatedThisWeek}□/wk
        </Text>
        <View className="mx-2 w-px h-3 bg-slate-600" />
        <Text className={`text-xs ${isSelected ? 'text-purple-200' : 'text-slate-400'}`}>
          {progressPercent}%
        </Text>
      </View>
      {/* Assigned people avatars */}
      <View className="flex-row mt-2 -space-x-1">
        {task.allocations.slice(0, 4).map(alloc => {
          const person = people.find(p => p.id === alloc.personId);
          if (!person) return null;
          return (
            <View
              key={alloc.personId}
              className="w-5 h-5 rounded-full items-center justify-center border border-slate-900"
              style={{ backgroundColor: person.avatarColor }}
            >
              <Text className="text-white text-[8px] font-bold">{person.initials}</Text>
            </View>
          );
        })}
        {task.allocations.length === 0 && (
          <Text className={`text-[10px] ${isSelected ? 'text-purple-300' : 'text-slate-500'}`}>
            No one assigned
          </Text>
        )}
      </View>
    </Pressable>
  );
}

export function CapacityAllocationView({
  visible,
  onClose,
  selectedTaskId,
  onTaskSelect,
  workspaceId,
}: CapacityAllocationViewProps) {
  const people = useResourceStore(s => s.people);
  const tasks = useResourceStore(s => s.tasks);
  const getTotalCapacity = useResourceStore(s => s.getTotalCapacity);
  const allocateToTask = useResourceStore(s => s.allocateToTask);
  const removeAllocation = useResourceStore(s => s.removeAllocation);
  const updateAllocation = useResourceStore(s => s.updateAllocation);

  const capacity = getTotalCapacity();
  const utilizationPercent = capacity.total > 0
    ? Math.round((capacity.allocated / capacity.total) * 100)
    : 0;

  // Group people by class
  const founders = people.filter(p => p.personClass === 'Founder');
  const executives = people.filter(p => p.personClass === 'Executive');
  const apprentices = people.filter(p => p.personClass === 'Apprentice');

  // Get active tasks for task selection
  const activeTasks = tasks.filter(t => t.workspaceId === workspaceId && t.status === 'active');
  const queuedTasks = tasks.filter(t => t.workspaceId === workspaceId && t.status === 'queued');
  const allTasks = [...activeTasks, ...queuedTasks];

  // Build allocation map: taskId -> [{ personId, squares }]
  const taskAllocations = new Map<string, { personId: string; squares: number }[]>();
  tasks.forEach(task => {
    const allocations = task.allocations.map(a => ({ personId: a.personId, squares: a.squaresPerWeek }));
    taskAllocations.set(task.id, allocations);
  });

  const handleAllocate = useCallback((personId: string, totalSquares: number) => {
    if (!selectedTaskId) return;

    const task = tasks.find(t => t.id === selectedTaskId);
    if (!task) return;

    const existingAlloc = task.allocations.find(a => a.personId === personId);

    if (existingAlloc) {
      updateAllocation(selectedTaskId, personId, totalSquares);
    } else {
      // Need to use updateAllocation since allocateToTask adds to existing
      const newAllocations = [...task.allocations, { personId, squaresPerWeek: totalSquares }];
      // Directly update the task's allocations
      useResourceStore.getState().updateTask(selectedTaskId, {
        allocations: newAllocations,
        status: 'active',
      });
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [selectedTaskId, tasks, updateAllocation]);

  const handleDeallocate = useCallback((personId: string) => {
    if (!selectedTaskId) return;
    removeAllocation(selectedTaskId, personId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [selectedTaskId, removeAllocation]);

  const renderPersonSection = (sectionPeople: PersonResource[], title: string, color: string) => {
    if (sectionPeople.length === 0) return null;

    return (
      <View className="mb-4">
        <View className="flex-row items-center mb-2">
          <View className="w-1 h-4 rounded-full mr-2" style={{ backgroundColor: color }} />
          <Text className="text-slate-400 text-xs font-semibold uppercase">{title}</Text>
        </View>
        {sectionPeople.map(person => (
          <PersonRow
            key={person.id}
            person={person}
            selectedTaskId={selectedTaskId || null}
            onAllocate={handleAllocate}
            onDeallocate={handleDeallocate}
            taskAllocations={taskAllocations}
          />
        ))}
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/80">
        <Animated.View
          entering={SlideInDown.springify()}
          exiting={SlideOutDown}
          className="flex-1 bg-slate-900 mt-16 rounded-t-3xl"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-800">
            <View>
              <Text className="text-white font-bold text-xl">Team Capacity</Text>
              <Text className="text-slate-400 text-sm">
                {capacity.allocated}/{capacity.total}□ allocated • {utilizationPercent}% utilized
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              className="w-10 h-10 rounded-full bg-slate-800 items-center justify-center"
            >
              <X size={20} color="#fff" />
            </Pressable>
          </View>

          {/* Task Selection */}
          <View className="px-5 py-4 border-b border-slate-800">
            <Text className="text-slate-400 text-xs font-semibold uppercase mb-3">
              {selectedTaskId ? 'Selected Task (tap squares to allocate)' : 'Select a task to allocate time'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {allTasks.map(task => (
                <TaskSelectCard
                  key={task.id}
                  task={task}
                  isSelected={selectedTaskId === task.id}
                  onPress={() => {
                    onTaskSelect?.(selectedTaskId === task.id ? null : task.id);
                    Haptics.selectionAsync();
                  }}
                  people={people}
                />
              ))}
              {allTasks.length === 0 && (
                <Text className="text-slate-500 text-sm">No tasks available</Text>
              )}
            </ScrollView>
          </View>

          {/* People Grid */}
          <ScrollView className="flex-1 px-5 py-4">
            {/* Legend */}
            <View className="flex-row items-center justify-center mb-4 flex-wrap gap-4">
              <View className="flex-row items-center">
                <View className="w-4 h-4 rounded bg-slate-700 mr-1.5" />
                <Text className="text-slate-400 text-xs">Available</Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-4 h-4 rounded bg-emerald-500 mr-1.5" />
                <Text className="text-slate-400 text-xs">Allocated</Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-4 h-4 rounded bg-purple-500 mr-1.5" />
                <Text className="text-slate-400 text-xs">Selected Task</Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-4 h-4 rounded bg-amber-400 mr-1.5" />
                <Text className="text-slate-400 text-xs">Overtime</Text>
              </View>
            </View>

            {/* Column Headers */}
            <View className="flex-row items-center pb-2 mb-2 border-b border-slate-700">
              <Text className="w-28 text-slate-500 text-xs font-semibold">PERSON</Text>
              <Text className="flex-1 text-slate-500 text-xs font-semibold px-2">SQUARES / WEEK</Text>
              <Text className="w-16 text-slate-500 text-xs font-semibold text-right">COST</Text>
            </View>

            {renderPersonSection(founders, 'Founders', PERSON_CLASS_COLORS.Founder)}
            {renderPersonSection(executives, 'Executives', PERSON_CLASS_COLORS.Executive)}
            {renderPersonSection(apprentices, 'Apprentices', PERSON_CLASS_COLORS.Apprentice)}

            {/* Bottom padding */}
            <View className="h-20" />
          </ScrollView>

          {/* Bottom Action Bar */}
          {selectedTaskId && (
            <Animated.View
              entering={FadeIn}
              className="px-5 py-4 bg-slate-800 border-t border-slate-700"
            >
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-white font-semibold">
                    {tasks.find(t => t.id === selectedTaskId)?.title || 'Task'}
                  </Text>
                  <Text className="text-slate-400 text-sm">
                    {tasks.find(t => t.id === selectedTaskId)?.squaresAllocatedThisWeek || 0}□ allocated this week
                  </Text>
                </View>
                <Pressable
                  onPress={() => onTaskSelect?.(null)}
                  className="bg-purple-600 px-4 py-2 rounded-lg"
                >
                  <Text className="text-white font-semibold">Done</Text>
                </Pressable>
              </View>
            </Animated.View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}
