/**
 * Quick Assign Modal
 * Allows quick assignment of tasks to a team member
 * Shows capacity impact before assigning
 */

import { View, Text, Modal, Pressable, ScrollView, TextInput } from 'react-native';
import { useState, useMemo } from 'react';
import { X, Search, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react-native';
import type { OrganizationMember } from '@/lib/organization-seed';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { useTaskAssignmentStore } from '@/lib/state/task-assignment-store';
import { useAppStore } from '@/lib/state/app-store';
import { lightImpact, heavyImpact } from '@/lib/haptics';
import { cn } from '@/lib/cn';

interface QuickAssignModalProps {
  visible: boolean;
  onClose: () => void;
  member: OrganizationMember;
  currentCapacity: {
    allocated: number;
    total: number;
  };
}

export function QuickAssignModal({ visible, onClose, member, currentCapacity }: QuickAssignModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [proposedTU, setProposedTU] = useState(2); // Default 2 TU/week

  const workPlans = useWorkPlanStore(s => s.workPlans);
  const updateWorkPlan = useWorkPlanStore(s => s.updateWorkPlan);
  const createAssignment = useTaskAssignmentStore(s => s.createAssignment);
  const currentMembership = useAppStore(s => s.currentMembership);
  const currentWorkspace = useAppStore(s => s.currentWorkspace);

  // Get assignable tasks (not completed, not abandoned, member not already assigned)
  const assignableTasks = useMemo(() => {
    return workPlans.filter(wp => {
      // Must be active
      if (wp.status === 'completed' || wp.status === 'abandoned') return false;

      // Member must not already be assigned
      const isAlreadyAssigned = wp.allocations?.some(a => a.memberId === member.id);
      if (isAlreadyAssigned) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          wp.title.toLowerCase().includes(query) ||
          wp.description?.toLowerCase().includes(query) ||
          wp.function.toLowerCase().includes(query)
        );
      }

      return true;
    }).sort((a, b) => {
      // Sort by: not-started first, then in-progress, then by due date
      if (a.status === 'not-started' && b.status === 'in-progress') return -1;
      if (a.status === 'in-progress' && b.status === 'not-started') return 1;

      const dateA = new Date(a.dueDate || '9999-12-31');
      const dateB = new Date(b.dueDate || '9999-12-31');
      return dateA.getTime() - dateB.getTime();
    });
  }, [workPlans, member.id, searchQuery]);

  const selectedTask = useMemo(() => {
    return selectedTaskId ? workPlans.find(wp => wp.id === selectedTaskId) : null;
  }, [selectedTaskId, workPlans]);

  // Calculate capacity impact
  const capacityImpact = useMemo(() => {
    const newAllocated = currentCapacity.allocated + proposedTU;
    const utilizationPercent = Math.round((newAllocated / currentCapacity.total) * 100);
    const isOverallocated = newAllocated > currentCapacity.total;
    const available = currentCapacity.total - newAllocated;

    return {
      newAllocated,
      utilizationPercent,
      isOverallocated,
      available,
      status: isOverallocated
        ? 'overallocated'
        : utilizationPercent >= 85
        ? 'warning'
        : 'good',
    };
  }, [currentCapacity, proposedTU]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overallocated': return 'red';
      case 'warning': return 'amber';
      case 'good': return 'emerald';
      default: return 'blue';
    }
  };

  const handleAssign = async () => {
    if (!selectedTask || !currentMembership || !currentWorkspace) return;

    heavyImpact();

    try {
      // Create new allocation with all required fields
      const newAllocation = {
        memberId: member.id,
        memberName: member.name,
        squaresPerWeek: proposedTU,
        costPerSquare: member.costPerDay ? (member.costPerDay / ((member.daysPerWeek || 5) * 2)) : 0,
      };

      // Update work plan with new allocation
      const updatedAllocations = [...(selectedTask.allocations || []), newAllocation];
      updateWorkPlan(selectedTask.id, { allocations: updatedAllocations });

      // Create assignment record
      await createAssignment({
        workPlanId: selectedTask.id,
        workspaceId: currentWorkspace.id,
        assignedTo: member.id,
        assignedBy: currentMembership.id,
        proposedAllocation: {
          squaresPerWeek: proposedTU,
          estimatedWeeks: selectedTask.estimatedTimeUnits
            ? Math.ceil(selectedTask.estimatedTimeUnits / proposedTU)
            : 1,
        },
        taskTitle: selectedTask.title,
        taskDescription: selectedTask.description || '',
        taskDueDate: selectedTask.dueDate || '',
        taskEstimatedTUs: selectedTask.estimatedTimeUnits || 0,
      });

      // Close modal
      onClose();

      // Reset state
      setSelectedTaskId(null);
      setProposedTU(2);
      setSearchQuery('');
    } catch (error) {
      console.error('[QuickAssign] Failed to assign task:', error);
    }
  };

  const handleCancel = () => {
    lightImpact();
    setSelectedTaskId(null);
    setProposedTU(2);
    setSearchQuery('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <Pressable className="flex-1 bg-black/70" onPress={handleCancel}>
        <View className="flex-1" />
        <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '90%' }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View className="bg-white dark:bg-slate-900 rounded-t-2xl p-6">
              {/* Header */}
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-1">
                  <Text className="text-slate-900 dark:text-white text-xl font-bold">
                    Assign Task
                  </Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-sm">
                    to {member.name}
                  </Text>
                </View>
                <Pressable onPress={handleCancel} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full">
                  <X size={18} color="#64748b" />
                </Pressable>
              </View>

              {/* Current Capacity */}
              <View className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 mb-4">
                <Text className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Current Capacity
                </Text>
                <View className="flex-row items-center justify-between">
                  <Text className="text-slate-900 dark:text-white font-bold">
                    {currentCapacity.allocated}/{currentCapacity.total} TU
                  </Text>
                  <Text className="text-slate-600 dark:text-slate-400 text-sm">
                    ({Math.round((currentCapacity.allocated / currentCapacity.total) * 100)}% utilized)
                  </Text>
                </View>
              </View>

              {/* Search */}
              <View className="mb-4">
                <View className="flex-row items-center bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2">
                  <Search size={16} color="#94a3b8" />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search tasks..."
                    placeholderTextColor="#94a3b8"
                    className="flex-1 ml-2 text-slate-900 dark:text-white"
                  />
                </View>
              </View>

              {/* Task List */}
              <View className="mb-4">
                <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
                  Available Tasks ({assignableTasks.length})
                </Text>
                <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={true} nestedScrollEnabled>
                  <View className="gap-2">
                    {assignableTasks.length === 0 ? (
                      <View className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 items-center">
                        <Text className="text-slate-400 dark:text-slate-500 text-sm">
                          {searchQuery ? 'No tasks match your search' : 'No tasks available to assign'}
                        </Text>
                      </View>
                    ) : (
                      assignableTasks.map(task => {
                        const isSelected = task.id === selectedTaskId;
                        const statusColors: Record<string, string> = {
                          'not-started': 'border-gray-400',
                          'in-progress': 'border-blue-400',
                          'blocked': 'border-red-400',
                          'completed': 'border-emerald-400',
                          'abandoned': 'border-gray-400',
                        };

                        return (
                          <Pressable
                            key={task.id}
                            onPress={() => {
                              lightImpact();
                              setSelectedTaskId(task.id);
                            }}
                            className={cn(
                              'rounded-lg p-3 border-l-4',
                              statusColors[task.status] || 'border-gray-400',
                              isSelected
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                                : 'bg-slate-50 dark:bg-slate-800'
                            )}
                          >
                            <Text className="text-slate-900 dark:text-white font-semibold text-sm" numberOfLines={2}>
                              {task.title}
                            </Text>
                            <View className="flex-row items-center gap-2 mt-1">
                              <Text className="text-slate-500 dark:text-slate-400 text-xs">
                                {task.function}
                              </Text>
                              <Text className="text-slate-400 dark:text-slate-500 text-xs">•</Text>
                              <Text className="text-slate-500 dark:text-slate-400 text-xs">
                                {task.estimatedTimeUnits || 0} TU total
                              </Text>
                              {task.dueDate && (
                                <>
                                  <Text className="text-slate-400 dark:text-slate-500 text-xs">•</Text>
                                  <Text className="text-slate-500 dark:text-slate-400 text-xs">
                                    Due {new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                  </Text>
                                </>
                              )}
                            </View>
                            {isSelected && (
                              <View className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                                <CheckCircle size={16} color="#3b82f6" />
                              </View>
                            )}
                          </Pressable>
                        );
                      })
                    )}
                  </View>
                </ScrollView>
              </View>

              {/* Allocation Settings (only show if task selected) */}
              {selectedTask && (
                <>
                  <View className="mb-4">
                    <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
                      Allocation (TU per week)
                    </Text>
                    <View className="flex-row gap-2">
                      {[1, 2, 3, 4, 5].map(tu => (
                        <Pressable
                          key={tu}
                          onPress={() => {
                            lightImpact();
                            setProposedTU(tu);
                          }}
                          className={cn(
                            'flex-1 py-2 rounded-lg',
                            proposedTU === tu
                              ? 'bg-purple-500'
                              : 'bg-slate-100 dark:bg-slate-800'
                          )}
                        >
                          <Text
                            className={cn(
                              'text-center font-bold text-sm',
                              proposedTU === tu
                                ? 'text-white'
                                : 'text-slate-600 dark:text-slate-400'
                            )}
                          >
                            {tu}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  {/* Capacity Impact */}
                  <View className={cn(
                    'rounded-xl p-3 mb-4 border',
                    capacityImpact.status === 'overallocated'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : capacityImpact.status === 'warning'
                      ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                      : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                  )}>
                    <View className="flex-row items-center gap-2 mb-2">
                      {capacityImpact.status === 'overallocated' ? (
                        <AlertTriangle size={16} color="#ef4444" />
                      ) : capacityImpact.status === 'warning' ? (
                        <AlertTriangle size={16} color="#f59e0b" />
                      ) : (
                        <CheckCircle size={16} color="#10b981" />
                      )}
                      <Text className={cn(
                        'font-bold text-sm',
                        capacityImpact.status === 'overallocated'
                          ? 'text-red-700 dark:text-red-300'
                          : capacityImpact.status === 'warning'
                          ? 'text-amber-700 dark:text-amber-300'
                          : 'text-emerald-700 dark:text-emerald-300'
                      )}>
                        Capacity Impact
                      </Text>
                    </View>

                    <Text className={cn(
                      'text-xs mb-1',
                      capacityImpact.status === 'overallocated'
                        ? 'text-red-600 dark:text-red-400'
                        : capacityImpact.status === 'warning'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    )}>
                      After assignment: {capacityImpact.newAllocated}/{currentCapacity.total} TU ({capacityImpact.utilizationPercent}%)
                    </Text>

                    {capacityImpact.isOverallocated ? (
                      <Text className="text-xs text-red-600 dark:text-red-400 font-bold">
                        ⚠️ This would overallocate {member.name.split(' ')[0]} by {Math.abs(capacityImpact.available)} TU
                      </Text>
                    ) : (
                      <Text className="text-xs text-emerald-600 dark:text-emerald-400">
                        ✓ {capacityImpact.available} TU would remain available
                      </Text>
                    )}
                  </View>
                </>
              )}

              {/* Actions */}
              <View className="flex-row gap-3">
                <Pressable
                  onPress={handleCancel}
                  className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-xl py-3"
                >
                  <Text className="text-slate-700 dark:text-slate-300 font-semibold text-center">
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleAssign}
                  disabled={!selectedTask}
                  className={cn(
                    'flex-1 rounded-xl py-3',
                    selectedTask
                      ? 'bg-blue-500'
                      : 'bg-slate-300 dark:bg-slate-700'
                  )}
                >
                  <Text className={cn(
                    'font-semibold text-center',
                    selectedTask ? 'text-white' : 'text-slate-400'
                  )}>
                    Assign Task
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
