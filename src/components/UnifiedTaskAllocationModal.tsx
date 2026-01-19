/**
 * UnifiedTaskAllocationModal - Full inline editing for all task fields
 * Clean, elegant interface for viewing AND editing task details
 */

import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Modal, TextInput, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  X, Calendar, Clock, Users, Target, Crown, Briefcase, GraduationCap,
  Check, ChevronDown, Minus, Plus, Edit3, Save,
} from 'lucide-react-native';
import { useWorkPlanStore, type WorkPlan } from '@/lib/state/work-plan-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import type { Function as BusinessFunction } from '@/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  workPlan: WorkPlan | null;
}

const STATUS_OPTIONS: { value: WorkPlan['status']; label: string }[] = [
  { value: 'not-started', label: 'Queued' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'completed', label: 'Completed' },
  { value: 'abandoned', label: 'Abandoned' },
];

const FUNCTION_OPTIONS: BusinessFunction[] = [
  'Engineering', 'Sales', 'Marketing', 'Finance', 'Ops', 'Admin',
];

const STATUS_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  'not-started': { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', badge: '#6b7280' },
  'in-progress': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', badge: '#3b82f6' },
  'completed': { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', badge: '#10b981' },
  'blocked': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', badge: '#ef4444' },
  'abandoned': { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-500 dark:text-gray-500', badge: '#6b7280' },
};

const FUNCTION_COLORS: Record<string, string> = {
  'Engineering': '#8b5cf6',
  'Sales': '#3b82f6',
  'Marketing': '#ec4899',
  'Finance': '#10b981',
  'Ops': '#f59e0b',
  'Admin': '#6b7280',
};

const ROLE_COLORS: Record<string, string> = {
  Founder: '#8b5cf6',
  FractionalExec: '#3b82f6',
  Apprentice: '#10b981',
};

export function UnifiedTaskAllocationModal({ visible, onClose, workPlan }: Props) {
  const members = useOrganizationStore(s => s.members);
  const updateWorkPlan = useWorkPlanStore(s => s.updateWorkPlan);

  // Local edit state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<WorkPlan['status']>('not-started');
  const [businessFunction, setBusinessFunction] = useState<BusinessFunction>('Ops');
  const [progress, setProgress] = useState(0);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date>(new Date());
  const [estimatedTimeUnits, setEstimatedTimeUnits] = useState(1);
  const [allocatedPerWeek, setAllocatedPerWeek] = useState(1);

  // Picker visibility
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showFunctionPicker, setShowFunctionPicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);

  // Track if there are unsaved changes
  const [hasChanges, setHasChanges] = useState(false);

  // Populate form when workPlan changes
  useEffect(() => {
    if (workPlan) {
      setTitle(workPlan.title);
      setDescription(workPlan.description || '');
      setStatus(workPlan.status);
      setBusinessFunction(workPlan.function);
      setProgress(workPlan.progress);
      setStartDate(workPlan.startDate ? new Date(workPlan.startDate) : new Date());
      setDueDate(workPlan.dueDate ? new Date(workPlan.dueDate) : new Date());
      setEstimatedTimeUnits(workPlan.estimatedTimeUnits || 1);
      const totalAlloc = workPlan.allocations?.reduce((sum, a) => sum + (a.squaresPerWeek || 0), 0) || 1;
      setAllocatedPerWeek(totalAlloc);
      setHasChanges(false);
    }
  }, [workPlan]);

  // Get assigned team members
  const assignedMembers = useMemo(() => {
    if (!workPlan) return [];
    const memberIds = workPlan.assignedMemberIds || [];
    return memberIds
      .map(id => members.find(m => m.id === id))
      .filter((m): m is NonNullable<typeof m> => m !== undefined);
  }, [workPlan, members]);

  if (!workPlan || !visible) return null;

  const statusConfig = STATUS_COLORS[status] || STATUS_COLORS['not-started'];
  const functionColor = FUNCTION_COLORS[businessFunction] || '#8b5cf6';

  // Calculate metrics
  const weeksToComplete = allocatedPerWeek > 0 ? Math.ceil(estimatedTimeUnits / allocatedPerWeek) : 0;
  const completedTUs = Math.round((progress / 100) * estimatedTimeUnits);
  const remainingTUs = estimatedTimeUnits - completedTUs;

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const markChanged = () => setHasChanges(true);

  const handleSave = () => {
    if (!workPlan) return;

    // Update allocations proportionally if allocated per week changed
    const originalTotal = workPlan.allocations?.reduce((sum, a) => sum + (a.squaresPerWeek || 0), 0) || 1;
    const ratio = allocatedPerWeek / originalTotal;
    const updatedAllocations = workPlan.allocations?.map(a => ({
      ...a,
      squaresPerWeek: Math.max(1, Math.round((a.squaresPerWeek || 0) * ratio)),
    })) || [];

    updateWorkPlan(workPlan.id, {
      title,
      description,
      status,
      function: businessFunction,
      progress,
      startDate: startDate.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      estimatedTimeUnits,
      allocations: updatedAllocations,
    });

    setHasChanges(false);
    onClose();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  // Editable number field component
  const NumberStepper = ({
    value,
    onChange,
    min = 0,
    max = 100,
    label,
    suffix = '',
  }: {
    value: number;
    onChange: (n: number) => void;
    min?: number;
    max?: number;
    label: string;
    suffix?: string;
  }) => (
    <View className="flex-1">
      <Text className="text-slate-500 dark:text-slate-400 text-xs mb-2">{label}</Text>
      <View className="flex-row items-center bg-slate-100 dark:bg-slate-900 rounded-xl">
        <Pressable
          onPress={() => {
            if (value > min) {
              onChange(value - 1);
              markChanged();
            }
          }}
          className="p-3 active:opacity-50"
        >
          <Minus size={16} color="#64748b" />
        </Pressable>
        <View className="flex-1 items-center">
          <Text className="text-slate-900 dark:text-white font-bold text-base">
            {value}{suffix}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            if (value < max) {
              onChange(value + 1);
              markChanged();
            }
          }}
          className="p-3 active:opacity-50"
        >
          <Plus size={16} color="#64748b" />
        </Pressable>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/70" onPress={onClose}>
        <View className="flex-1" />
        <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '92%' }}>
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl overflow-hidden">
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 32 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Header Section */}
              <View className="bg-slate-50 dark:bg-slate-900 px-6 pt-6 pb-6">
                {/* Close Button */}
                <Pressable
                  onPress={onClose}
                  className="absolute top-4 right-4 z-10 bg-white dark:bg-slate-700 rounded-full p-2 active:opacity-70"
                >
                  <X size={20} color="#6b7280" />
                </Pressable>

                {/* Task Icon/Status */}
                <View className="items-center mb-4">
                  <View
                    className={`w-16 h-16 rounded-full items-center justify-center mb-3 ${statusConfig.bg}`}
                  >
                    <Target size={28} color={statusConfig.badge} />
                  </View>

                  {/* Editable Title */}
                  <TextInput
                    value={title}
                    onChangeText={(text) => {
                      setTitle(text);
                      markChanged();
                    }}
                    className="text-slate-900 dark:text-white text-xl font-bold text-center px-4 py-2 bg-white/50 dark:bg-slate-700/50 rounded-xl w-full"
                    placeholder="Task title"
                    placeholderTextColor="#94a3b8"
                  />

                  {/* Function & Status Selectors */}
                  <View className="flex-row items-center gap-2 mt-3">
                    <Pressable
                      onPress={() => setShowFunctionPicker(true)}
                      className="px-3 py-1.5 rounded-full flex-row items-center gap-1"
                      style={{ backgroundColor: functionColor + '30' }}
                    >
                      <Text className="font-semibold text-sm" style={{ color: functionColor }}>
                        {businessFunction}
                      </Text>
                      <ChevronDown size={14} color={functionColor} />
                    </Pressable>
                    <Pressable
                      onPress={() => setShowStatusPicker(true)}
                      className={`px-3 py-1.5 rounded-full flex-row items-center gap-1 ${statusConfig.bg}`}
                    >
                      <Text className={`font-semibold text-sm ${statusConfig.text}`}>
                        {STATUS_OPTIONS.find(s => s.value === status)?.label || status}
                      </Text>
                      <ChevronDown size={14} color={statusConfig.badge} />
                    </Pressable>
                  </View>
                </View>

                {/* Quick Stats */}
                <View className="flex-row justify-center gap-6 mt-2">
                  <View className="items-center">
                    <Text className="text-slate-500 dark:text-slate-400 text-xs">Progress</Text>
                    <Text className="text-slate-900 dark:text-white font-semibold text-base">
                      {progress}%
                    </Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-slate-500 dark:text-slate-400 text-xs">TU/Week</Text>
                    <Text className="text-slate-900 dark:text-white font-semibold text-base">
                      {allocatedPerWeek}
                    </Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-slate-500 dark:text-slate-400 text-xs">Weeks</Text>
                    <Text className="text-slate-900 dark:text-white font-semibold text-base">
                      {weeksToComplete > 0 ? weeksToComplete : 'TBD'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Description - Editable */}
              <View className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <View className="flex-row items-center gap-2 mb-2">
                  <Edit3 size={16} color="#64748b" />
                  <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium">Description</Text>
                </View>
                <TextInput
                  value={description}
                  onChangeText={(text) => {
                    setDescription(text);
                    markChanged();
                  }}
                  className="text-slate-700 dark:text-slate-300 text-sm leading-5 bg-slate-50 dark:bg-slate-900 rounded-xl p-3 min-h-[80px]"
                  placeholder="Add task description..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  textAlignVertical="top"
                />
              </View>

              {/* Timeline Section - Editable */}
              <View className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <View className="flex-row items-center gap-2 mb-3">
                  <Calendar size={18} color="#3b82f6" />
                  <Text className="text-slate-900 dark:text-white font-bold text-sm">
                    Timeline
                  </Text>
                </View>
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-slate-500 dark:text-slate-400 text-xs mb-2">Start Date</Text>
                    <Pressable
                      onPress={() => setShowStartDatePicker(true)}
                      className="bg-slate-100 dark:bg-slate-900 rounded-xl p-3 flex-row items-center justify-between"
                    >
                      <Text className="text-slate-900 dark:text-white text-sm font-semibold">
                        {formatDate(startDate)}
                      </Text>
                      <Calendar size={16} color="#64748b" />
                    </Pressable>
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-500 dark:text-slate-400 text-xs mb-2">Due Date</Text>
                    <Pressable
                      onPress={() => setShowDueDatePicker(true)}
                      className="bg-slate-100 dark:bg-slate-900 rounded-xl p-3 flex-row items-center justify-between"
                    >
                      <Text className="text-slate-900 dark:text-white text-sm font-semibold">
                        {formatDate(dueDate)}
                      </Text>
                      <Calendar size={16} color="#64748b" />
                    </Pressable>
                  </View>
                </View>
              </View>

              {/* Progress Section - Editable */}
              <View className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <View className="flex-row items-center gap-2 mb-3">
                  <Target size={18} color="#f59e0b" />
                  <Text className="text-slate-900 dark:text-white font-bold text-sm">
                    Progress
                  </Text>
                </View>
                <View className="flex-row items-center gap-4">
                  <View className="flex-1">
                    <View className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <View
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </View>
                  </View>
                  <View className="flex-row items-center bg-slate-100 dark:bg-slate-900 rounded-xl">
                    <Pressable
                      onPress={() => {
                        if (progress >= 10) {
                          setProgress(progress - 10);
                          markChanged();
                        }
                      }}
                      className="p-2 active:opacity-50"
                    >
                      <Minus size={16} color="#64748b" />
                    </Pressable>
                    <Text className="text-slate-900 dark:text-white font-bold text-base w-12 text-center">
                      {progress}%
                    </Text>
                    <Pressable
                      onPress={() => {
                        if (progress <= 90) {
                          setProgress(progress + 10);
                          markChanged();
                        }
                      }}
                      className="p-2 active:opacity-50"
                    >
                      <Plus size={16} color="#64748b" />
                    </Pressable>
                  </View>
                </View>
              </View>

              {/* Time Units Section - Editable */}
              <View className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <View className="flex-row items-center gap-2 mb-3">
                  <Clock size={18} color="#10b981" />
                  <Text className="text-slate-900 dark:text-white font-bold text-sm">
                    Time Units
                  </Text>
                </View>
                <View className="flex-row gap-3">
                  <NumberStepper
                    value={estimatedTimeUnits}
                    onChange={setEstimatedTimeUnits}
                    min={1}
                    max={50}
                    label="TU Needed"
                    suffix=" TU"
                  />
                  <NumberStepper
                    value={allocatedPerWeek}
                    onChange={setAllocatedPerWeek}
                    min={1}
                    max={15}
                    label="Allocated/Week"
                    suffix=" TU"
                  />
                </View>
                <View className="flex-row justify-between mt-3 bg-slate-50 dark:bg-slate-900 rounded-xl p-3">
                  <View className="items-center flex-1">
                    <Text className="text-slate-500 dark:text-slate-400 text-xs">Completed</Text>
                    <Text className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {completedTUs} TU
                    </Text>
                  </View>
                  <View className="items-center flex-1 border-l border-slate-200 dark:border-slate-700">
                    <Text className="text-slate-500 dark:text-slate-400 text-xs">Remaining</Text>
                    <Text className="text-slate-900 dark:text-white font-bold">
                      {remainingTUs} TU
                    </Text>
                  </View>
                  <View className="items-center flex-1 border-l border-slate-200 dark:border-slate-700">
                    <Text className="text-slate-500 dark:text-slate-400 text-xs">Weeks to Go</Text>
                    <Text className="text-blue-600 dark:text-blue-400 font-bold">
                      {weeksToComplete > 0 ? weeksToComplete : 'TBD'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Team Section */}
              {assignedMembers.length > 0 && (
                <View className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <View className="flex-row items-center gap-2 mb-3">
                    <Users size={18} color="#8b5cf6" />
                    <Text className="text-slate-900 dark:text-white font-bold text-sm">
                      Team ({assignedMembers.length})
                    </Text>
                  </View>
                  <View className="gap-2">
                    {assignedMembers.map((member) => {
                      const allocation = workPlan.allocations?.find(a => a.memberId === member.id);
                      const memberTUsPerWeek = allocation?.squaresPerWeek || 0;
                      const roleColor = ROLE_COLORS[member.role] || '#6b7280';

                      return (
                        <View
                          key={member.id}
                          className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 flex-row items-center justify-between"
                        >
                          <View className="flex-row items-center gap-3 flex-1">
                            {/* Avatar */}
                            <View
                              className="w-10 h-10 rounded-full items-center justify-center"
                              style={{ backgroundColor: roleColor + '30' }}
                            >
                              <Text className="font-bold text-xs" style={{ color: roleColor }}>
                                {getInitials(member.name)}
                              </Text>
                            </View>
                            {/* Info */}
                            <View className="flex-1">
                              <Text className="text-slate-900 dark:text-white font-semibold text-sm">
                                {member.name}
                              </Text>
                              <View className="flex-row items-center gap-1">
                                {member.role === 'Founder' && <Crown size={10} color={roleColor} />}
                                {member.role === 'FractionalExec' && <Briefcase size={10} color={roleColor} />}
                                {member.role === 'Apprentice' && <GraduationCap size={10} color={roleColor} />}
                                <Text className="text-slate-500 dark:text-slate-400 text-xs">
                                  {member.role === 'FractionalExec' ? 'Executive' : member.role}
                                </Text>
                              </View>
                            </View>
                          </View>
                          {/* TU Allocation */}
                          <View className="items-end">
                            <Text className="text-slate-900 dark:text-white font-bold text-sm">
                              {memberTUsPerWeek} TU
                            </Text>
                            <Text className="text-slate-500 dark:text-slate-400 text-xs">
                              per week
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Save Button */}
              <View className="px-6 pt-4">
                <Pressable
                  onPress={handleSave}
                  className={`rounded-xl py-4 flex-row items-center justify-center gap-2 active:opacity-80 ${
                    hasChanges ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  {hasChanges ? (
                    <>
                      <Save size={20} color="white" />
                      <Text className="text-white font-semibold text-base">Save Changes</Text>
                    </>
                  ) : (
                    <>
                      <Check size={20} color="#64748b" />
                      <Text className="text-slate-500 font-semibold text-base">No Changes</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>

      {/* Status Picker Modal */}
      <Modal
        visible={showStatusPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStatusPicker(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-center items-center"
          onPress={() => setShowStatusPicker(false)}
        >
          <View className="bg-white dark:bg-slate-900 rounded-2xl p-4 mx-6 w-[280px]">
            <Text className="text-slate-900 dark:text-white font-bold text-lg mb-3 text-center">
              Select Status
            </Text>
            {STATUS_OPTIONS.map((option) => {
              const config = STATUS_COLORS[option.value];
              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    setStatus(option.value);
                    markChanged();
                    setShowStatusPicker(false);
                  }}
                  className={`p-3 rounded-xl mb-2 flex-row items-center justify-between ${config.bg}`}
                >
                  <Text className={`font-semibold ${config.text}`}>{option.label}</Text>
                  {status === option.value && <Check size={18} color={config.badge} />}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>

      {/* Function Picker Modal */}
      <Modal
        visible={showFunctionPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFunctionPicker(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-center items-center"
          onPress={() => setShowFunctionPicker(false)}
        >
          <View className="bg-white dark:bg-slate-900 rounded-2xl p-4 mx-6 w-[280px]">
            <Text className="text-slate-900 dark:text-white font-bold text-lg mb-3 text-center">
              Select Function
            </Text>
            {FUNCTION_OPTIONS.map((func) => {
              const color = FUNCTION_COLORS[func];
              return (
                <Pressable
                  key={func}
                  onPress={() => {
                    setBusinessFunction(func);
                    markChanged();
                    setShowFunctionPicker(false);
                  }}
                  className="p-3 rounded-xl mb-2 flex-row items-center justify-between"
                  style={{ backgroundColor: color + '20' }}
                >
                  <Text className="font-semibold" style={{ color }}>{func}</Text>
                  {businessFunction === func && <Check size={18} color={color} />}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(Platform.OS === 'ios');
            if (selectedDate) {
              setStartDate(selectedDate);
              markChanged();
            }
            if (Platform.OS !== 'ios') {
              setShowStartDatePicker(false);
            }
          }}
        />
      )}

      {showDueDatePicker && (
        <DateTimePicker
          value={dueDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowDueDatePicker(Platform.OS === 'ios');
            if (selectedDate) {
              setDueDate(selectedDate);
              markChanged();
            }
            if (Platform.OS !== 'ios') {
              setShowDueDatePicker(false);
            }
          }}
        />
      )}
    </Modal>
  );
}
