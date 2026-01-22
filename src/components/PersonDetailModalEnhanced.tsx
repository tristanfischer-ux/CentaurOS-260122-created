import { View, Text, Modal, Pressable, ScrollView, TextInput, Dimensions } from 'react-native';
import { useState, useMemo, useRef } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Check,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Package,
  ChevronRight as ChevronRightIcon,
  Users,
} from 'lucide-react-native';
import { type OrganizationMember } from '@/lib/organization-seed';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useSquadStore } from '@/lib/state/squad-store';

interface PersonDetailModalEnhancedProps {
  visible: boolean;
  onClose: () => void;
  members: OrganizationMember[]; // All members in order
  initialMemberIndex: number; // Which member to show first
  onNavigate?: (taskId: string) => void;
}

const ROLE_COLORS: Record<string, string> = {
  Founder: '#8b5cf6',
  FractionalExec: '#3b82f6',
  Apprentice: '#10b981',
};

const ROLE_LABELS: Record<string, string> = {
  Founder: 'Founder',
  FractionalExec: 'Fractional Executive',
  Apprentice: 'Apprentice',
};

const SCREEN_WIDTH = Dimensions.get('window').width;

export function PersonDetailModalEnhanced({
  visible,
  onClose,
  members,
  initialMemberIndex,
  onNavigate,
}: PersonDetailModalEnhancedProps) {
  const [currentIndex, setCurrentIndex] = useState(initialMemberIndex);
  const [isEditMode, setIsEditMode] = useState(false);

  // Edit form state
  const [editedName, setEditedName] = useState('');
  const [editedFunction, setEditedFunction] = useState('');

  const workPlans = useWorkPlanStore(s => s.workPlans);
  const updateMember = useOrganizationStore(s => s.updateMember);
  const getSquadsByMember = useSquadStore(s => s.getSquadsByMember);
  const allMembers = useOrganizationStore(s => s.members);

  const currentMember = members[currentIndex] || null;
  const translateX = useSharedValue(0);
  const screenWidth = SCREEN_WIDTH;

  // Get squads this member belongs to
  const memberSquads = useMemo(() => {
    if (!currentMember) return [];
    return getSquadsByMember(currentMember.id);
  }, [currentMember, getSquadsByMember]);

  // Calculate member's workload and capacity
  const memberData = useMemo(() => {
    if (!currentMember) return null;

    // Get tasks assigned to this member
    const assignedTasks = workPlans.filter(wp =>
      wp.status !== 'completed' &&
      wp.status !== 'abandoned' &&
      wp.assignedMemberIds?.includes(currentMember.id)
    );

    // Calculate allocated TU
    const totalAllocated = workPlans
      .filter(wp => wp.status !== 'completed' && wp.status !== 'abandoned')
      .reduce((sum, wp) => {
        const allocation = wp.allocations?.find(a => a.memberId === currentMember.id);
        return sum + (allocation?.squaresPerWeek || 0);
      }, 0);

    // Calculate capacity
    const totalCapacity = currentMember.role === 'Founder' || currentMember.role === 'Apprentice'
      ? 15 // 10 normal + 5 overtime
      : ((currentMember.daysPerWeek || 2) * 2) + Math.min((5 - (currentMember.daysPerWeek || 2)) * 2, 10);

    const remaining = totalCapacity - totalAllocated;
    const utilizationPercent = totalCapacity > 0 ? (totalAllocated / totalCapacity) * 100 : 0;

    // Get suggested tasks (tasks in their function that need allocation)
    const suggestedTasks = workPlans.filter(wp =>
      wp.status === 'not-started' &&
      wp.function === currentMember.function &&
      (!wp.assignedMemberIds || wp.assignedMemberIds.length === 0) &&
      wp.estimatedTimeUnits <= remaining
    ).slice(0, 3);

    return {
      tasks: assignedTasks,
      totalAllocated,
      totalCapacity,
      remaining,
      utilizationPercent,
      suggestedTasks,
    };
  }, [currentMember, workPlans]);

  // Initialize edit form when member changes or edit mode activates
  useMemo(() => {
    if (currentMember && isEditMode) {
      setEditedName(currentMember.name);
      setEditedFunction(currentMember.function);
    }
  }, [currentMember, isEditMode]);

  const handleSaveEdit = () => {
    if (!currentMember) return;

    updateMember(currentMember.id, {
      name: editedName,
      function: editedFunction,
    });

    setIsEditMode(false);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsEditMode(false);
    }
  };

  const goToNext = () => {
    if (currentIndex < members.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsEditMode(false);
    }
  };

  // Swipe gesture
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      const threshold = screenWidth * 0.3;

      if (event.translationX > threshold && currentIndex > 0) {
        // Swipe right - go to previous
        runOnJS(goToPrevious)();
      } else if (event.translationX < -threshold && currentIndex < members.length - 1) {
        // Swipe left - go to next
        runOnJS(goToNext)();
      }

      translateX.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  if (!currentMember || !memberData) return null;

  const roleColor = ROLE_COLORS[currentMember.role];

  // Determine capacity status
  let capacityStatus: 'spare' | 'full' | 'overloaded' = 'full';
  let capacityColor = '#f59e0b';
  let capacityLabel = 'Fully Utilized';

  if (memberData.utilizationPercent < 80) {
    capacityStatus = 'spare';
    capacityColor = '#10b981';
    capacityLabel = 'Has Spare Capacity';
  } else if (memberData.utilizationPercent > 100) {
    capacityStatus = 'overloaded';
    capacityColor = '#ef4444';
    capacityLabel = 'Overloaded';
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/70 justify-center items-center p-4">
        <View className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md" style={{ maxHeight: '90%' }}>
          {/* Navigation Header */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-800">
            <Pressable
              onPress={goToPrevious}
              disabled={currentIndex === 0}
              className={`p-2 rounded-full ${currentIndex === 0 ? 'opacity-30' : 'active:opacity-70'}`}
            >
              <ChevronLeft size={20} color="#64748b" />
            </Pressable>

            <View className="flex-row items-center gap-2">
              <Text className="text-gray-500 dark:text-slate-400 text-sm">
                {currentIndex + 1} / {members.length}
              </Text>
              {!isEditMode && (
                <Pressable
                  onPress={() => setIsEditMode(true)}
                  className="flex-row items-center gap-1 bg-blue-100 dark:bg-blue-900/30 px-3 py-1.5 rounded-full active:opacity-70"
                >
                  <Edit3 size={14} color="#3b82f6" />
                  <Text className="text-blue-600 dark:text-blue-400 text-xs font-bold">Edit</Text>
                </Pressable>
              )}
              {isEditMode && (
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={handleCancelEdit}
                    className="bg-gray-200 dark:bg-slate-700 px-3 py-1.5 rounded-full active:opacity-70"
                  >
                    <Text className="text-gray-700 dark:text-slate-300 text-xs font-bold">Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleSaveEdit}
                    className="flex-row items-center gap-1 bg-emerald-500 px-3 py-1.5 rounded-full active:opacity-70"
                  >
                    <Check size={14} color="#fff" />
                    <Text className="text-white text-xs font-bold">Save</Text>
                  </Pressable>
                </View>
              )}
            </View>

            <Pressable
              onPress={goToNext}
              disabled={currentIndex === members.length - 1}
              className={`p-2 rounded-full ${currentIndex === members.length - 1 ? 'opacity-30' : 'active:opacity-70'}`}
            >
              <ChevronRight size={20} color="#64748b" />
            </Pressable>
          </View>

          <GestureDetector gesture={panGesture}>
            <Animated.View style={animatedStyle}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header with Avatar */}
                <View className="p-6 rounded-t-2xl" style={{ backgroundColor: roleColor + '15' }}>
                  <Pressable
                    onPress={onClose}
                    className="absolute top-4 right-4 z-10 bg-white dark:bg-slate-800 rounded-full p-2 active:opacity-70"
                  >
                    <X size={20} color="#64748b" />
                  </Pressable>

                  <View className="items-center">
                    <View
                      className="w-20 h-20 rounded-full items-center justify-center mb-3"
                      style={{ backgroundColor: roleColor }}
                    >
                      <Text className="text-white font-bold text-2xl">
                        {currentMember.name.split(' ').map(n => n[0]).join('')}
                      </Text>
                    </View>

                    {isEditMode ? (
                      <TextInput
                        value={editedName}
                        onChangeText={setEditedName}
                        className="text-gray-900 dark:text-white text-xl font-bold text-center bg-white dark:bg-slate-800 px-4 py-2 rounded-lg mb-2"
                        placeholder="Name"
                      />
                    ) : (
                      <Text className="text-gray-900 dark:text-white text-xl font-bold text-center">
                        {currentMember.name}
                      </Text>
                    )}

                    <View
                      className="px-3 py-1 rounded-full mt-2"
                      style={{ backgroundColor: roleColor + '30' }}
                    >
                      <Text className="font-semibold text-sm" style={{ color: roleColor }}>
                        {ROLE_LABELS[currentMember.role]}
                      </Text>
                    </View>

                    {isEditMode ? (
                      <TextInput
                        value={editedFunction}
                        onChangeText={setEditedFunction}
                        className="text-gray-700 dark:text-slate-300 text-sm text-center bg-white dark:bg-slate-800 px-4 py-2 rounded-lg mt-2"
                        placeholder="Function"
                      />
                    ) : (
                      <Text className="text-gray-700 dark:text-slate-300 text-sm mt-1">
                        {currentMember.function}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Capacity Status Banner */}
                <View
                  className="mx-6 -mt-4 rounded-xl p-4 shadow-lg"
                  style={{ backgroundColor: capacityColor + '15', borderWidth: 2, borderColor: capacityColor }}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center gap-2">
                      {capacityStatus === 'spare' && <CheckCircle2 size={18} color={capacityColor} />}
                      {capacityStatus === 'full' && <Clock size={18} color={capacityColor} />}
                      {capacityStatus === 'overloaded' && <AlertTriangle size={18} color={capacityColor} />}
                      <Text className="font-bold text-base" style={{ color: capacityColor }}>
                        {capacityLabel}
                      </Text>
                    </View>
                    <Text className="font-bold text-lg" style={{ color: capacityColor }}>
                      {Math.round(memberData.utilizationPercent)}%
                    </Text>
                  </View>

                  {/* Capacity Bar */}
                  <View className="h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(memberData.utilizationPercent, 100)}%`,
                        backgroundColor: capacityColor,
                      }}
                    />
                  </View>

                  <View className="flex-row justify-between mt-2">
                    <Text className="text-xs" style={{ color: capacityColor }}>
                      {memberData.totalAllocated} TU used
                    </Text>
                    <Text className="text-xs" style={{ color: capacityColor }}>
                      {memberData.remaining} TU free
                    </Text>
                  </View>
                </View>

                {/* Squad Membership */}
                {memberSquads.length > 0 && (
                  <View className="px-6 py-4 border-b border-gray-200 dark:border-slate-800">
                    <View className="flex-row items-center gap-2 mb-3">
                      <Users size={18} color="#8b5cf6" />
                      <Text className="text-gray-900 dark:text-white font-bold text-base">
                        Squad{memberSquads.length > 1 ? 's' : ''} ({memberSquads.length})
                      </Text>
                    </View>

                    {memberSquads.map((squad) => {
                      const otherMembers = squad.memberIds
                        .filter(id => id !== currentMember.id)
                        .map(id => allMembers.find(m => m.id === id))
                        .filter((m): m is OrganizationMember => m !== undefined);

                      return (
                        <View
                          key={squad.id}
                          className="bg-white dark:bg-slate-800 border-2 rounded-xl p-3 mb-2"
                          style={{ borderColor: squad.color || '#8b5cf6' }}
                        >
                          <View className="flex-row items-start justify-between mb-2">
                            <View className="flex-1">
                              <Text className="text-gray-900 dark:text-white font-semibold text-sm">
                                {squad.name}
                              </Text>
                              {squad.function && (
                                <Text className="text-gray-500 dark:text-slate-400 text-xs mt-0.5">
                                  {squad.function}
                                </Text>
                              )}
                            </View>
                            <View
                              className="px-2 py-1 rounded"
                              style={{ backgroundColor: (squad.color || '#8b5cf6') + '20' }}
                            >
                              <Text className="text-xs font-bold" style={{ color: squad.color || '#8b5cf6' }}>
                                {squad.type === 'automatic' ? 'AUTO' : 'MANUAL'}
                              </Text>
                            </View>
                          </View>

                          {/* Team members */}
                          {otherMembers.length > 0 && (
                            <View className="flex-row flex-wrap gap-1 mt-2">
                              {otherMembers.map((member) => (
                                <View
                                  key={member.id}
                                  className="px-2 py-1 rounded-full"
                                  style={{ backgroundColor: (squad.color || '#8b5cf6') + '15' }}
                                >
                                  <Text className="text-xs" style={{ color: squad.color || '#8b5cf6' }}>
                                    {member.name.split(' ')[0]}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Current Work */}
                <View className="px-6 py-4 border-b border-gray-200 dark:border-slate-800">
                  <Text className="text-gray-900 dark:text-white font-bold text-base mb-3">
                    Current Work ({memberData.tasks.length})
                  </Text>

                  {memberData.tasks.length === 0 ? (
                    <View className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 items-center">
                      <Package size={32} color="#64748b" />
                      <Text className="text-gray-500 dark:text-slate-400 text-sm mt-2">
                        No active tasks
                      </Text>
                    </View>
                  ) : (
                    memberData.tasks.map((task, idx) => {
                      const allocation = task.allocations?.find(a => a.memberId === currentMember.id);
                      const allocatedTU = allocation?.squaresPerWeek || 0;

                      return (
                        <Pressable
                          key={task.id}
                          onPress={() => {
                            onClose();
                            onNavigate?.(task.id);
                          }}
                          className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 mb-2 active:opacity-70"
                        >
                          <View className="flex-row items-start justify-between mb-2">
                            <View className="flex-1 mr-2">
                              <Text className="text-gray-900 dark:text-white font-semibold text-sm">
                                {task.title}
                              </Text>
                              <Text className="text-gray-500 dark:text-slate-400 text-xs mt-0.5">
                                {task.function}
                              </Text>
                            </View>
                            <View className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                              <Text className="text-blue-600 dark:text-blue-400 text-xs font-bold">
                                {allocatedTU} TU/wk
                              </Text>
                            </View>
                          </View>

                          {/* Progress Bar */}
                          <View className="h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                            <View
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${task.progress}%` }}
                            />
                          </View>

                          <View className="flex-row items-center justify-between">
                            <Text className="text-gray-500 dark:text-slate-400 text-xs">
                              {task.progress}% complete
                            </Text>
                            <View className="flex-row items-center gap-1">
                              <Text className="text-gray-400 dark:text-slate-500 text-xs">View</Text>
                              <ChevronRightIcon size={12} color="#64748b" />
                            </View>
                          </View>
                        </Pressable>
                      );
                    })
                  )}
                </View>

                {/* Suggested Work (only if spare capacity) */}
                {capacityStatus === 'spare' && memberData.suggestedTasks.length > 0 && (
                  <View className="px-6 py-4">
                    <View className="flex-row items-center gap-2 mb-3">
                      <TrendingUp size={18} color="#10b981" />
                      <Text className="text-gray-900 dark:text-white font-bold text-base">
                        Suggested Work
                      </Text>
                    </View>
                    <Text className="text-gray-600 dark:text-slate-400 text-xs mb-3">
                      Tasks in {currentMember.function} that could use their help:
                    </Text>

                    {memberData.suggestedTasks.map((task) => (
                      <Pressable
                        key={task.id}
                        onPress={() => {
                          onClose();
                          onNavigate?.(task.id);
                        }}
                        className="bg-emerald-50 dark:bg-emerald-900/10 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl p-3 mb-2 active:opacity-70"
                      >
                        <View className="flex-row items-start justify-between">
                          <View className="flex-1 mr-2">
                            <Text className="text-gray-900 dark:text-white font-semibold text-sm">
                              {task.title}
                            </Text>
                            <Text className="text-emerald-700 dark:text-emerald-300 text-xs mt-0.5">
                              {task.function} • Needs {task.estimatedTimeUnits} TU
                            </Text>
                          </View>
                          <View className="bg-emerald-500 px-2 py-1 rounded">
                            <Text className="text-white text-xs font-bold">Assign</Text>
                          </View>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}
              </ScrollView>
            </Animated.View>
          </GestureDetector>
        </View>
      </View>
    </Modal>
  );
}
