/**
 * LinkToObjectiveModal
 * Modal for linking a task to one or more objectives
 * Shows available objectives with search and selection
 */

import { View, Text, ScrollView, Pressable, Modal, TextInput } from 'react-native';
import { useState, useMemo, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X, Search, Target, Check, Link2, Unlink
} from 'lucide-react-native';
import { useTheme } from '@/lib/ThemeContext';
import { useObjectivesStore, type BusinessObjective } from '@/lib/state/objectives-store';
import { lightImpact, mediumImpact } from '@/lib/haptics';

interface LinkToObjectiveModalProps {
  visible: boolean;
  taskId: string;
  taskTitle: string;
  onClose: () => void;
  onSave?: (objectiveIds: string[]) => void;
}

// Category colors
const CATEGORY_COLORS = {
  growth: { bg: '#ecfdf5', text: '#059669' },
  product: { bg: '#eff6ff', text: '#2563eb' },
  operations: { bg: '#fef3c7', text: '#d97706' },
  financial: { bg: '#f0fdf4', text: '#16a34a' },
  team: { bg: '#faf5ff', text: '#7c3aed' },
};

// Status colors
const STATUS_COLORS = {
  'on-track': '#10b981',
  'at-risk': '#f59e0b',
  'behind': '#ef4444',
  'completed': '#8b5cf6',
};

export function LinkToObjectiveModal({
  visible,
  taskId,
  taskTitle,
  onClose,
  onSave,
}: LinkToObjectiveModalProps) {
  const insets = useSafeAreaInsets();
  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';

  // Stores
  const objectives = useObjectivesStore(s => s.objectives);
  const linkTask = useObjectivesStore(s => s.linkTask);
  const unlinkTask = useObjectivesStore(s => s.unlinkTask);

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Initialize selected objectives based on current links
  useEffect(() => {
    if (visible && taskId) {
      const linkedObjectiveIds = objectives
        .filter(obj => obj.linkedTaskIds.includes(taskId))
        .map(obj => obj.id);
      setSelectedIds(new Set(linkedObjectiveIds));
    }
  }, [visible, taskId, objectives]);

  // Filter objectives
  const filteredObjectives = useMemo(() => {
    if (!searchQuery.trim()) return objectives;
    const query = searchQuery.toLowerCase();
    return objectives.filter(obj =>
      obj.title.toLowerCase().includes(query) ||
      obj.description.toLowerCase().includes(query) ||
      obj.category.toLowerCase().includes(query)
    );
  }, [objectives, searchQuery]);

  // Toggle selection
  const handleToggle = (objectiveId: string) => {
    lightImpact();
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(objectiveId)) {
        newSet.delete(objectiveId);
      } else {
        newSet.add(objectiveId);
      }
      return newSet;
    });
  };

  // Save changes
  const handleSave = () => {
    mediumImpact();

    // Find objectives that were previously linked but now unlinked
    const previouslyLinked = objectives
      .filter(obj => obj.linkedTaskIds.includes(taskId))
      .map(obj => obj.id);

    // Unlink objectives that were removed
    previouslyLinked.forEach(objId => {
      if (!selectedIds.has(objId)) {
        unlinkTask(objId, taskId);
      }
    });

    // Link newly selected objectives
    selectedIds.forEach(objId => {
      if (!previouslyLinked.includes(objId)) {
        linkTask(objId, taskId);
      }
    });

    if (onSave) {
      onSave(Array.from(selectedIds));
    }

    onClose();
  };

  // Theme colors
  const cardBg = isDark ? 'bg-slate-900' : isOffWhite ? 'bg-stone-50' : 'bg-white';
  const borderColor = isDark ? 'border-slate-700' : isOffWhite ? 'border-stone-200' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : isOffWhite ? 'text-stone-900' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-stone-500' : 'text-gray-500';
  const textMuted = isDark ? 'text-slate-500' : isOffWhite ? 'text-stone-400' : 'text-gray-400';
  const inputBg = isDark ? 'bg-slate-800' : isOffWhite ? 'bg-stone-100' : 'bg-gray-100';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/70" onPress={onClose}>
        <View className="flex-1" />
        <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '85%' }}>
          <View className={`${cardBg} rounded-t-3xl`} style={{ paddingBottom: insets.bottom + 16 }}>
            {/* Header */}
            <View className={`flex-row items-center justify-between px-5 py-4 border-b ${borderColor}`}>
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-xl bg-purple-600 items-center justify-center">
                  <Link2 size={20} color="#fff" />
                </View>
                <View>
                  <Text className={`text-lg font-bold ${textPrimary}`}>Link to Objective</Text>
                  <Text className={`${textMuted} text-xs`} numberOfLines={1}>
                    {taskTitle}
                  </Text>
                </View>
              </View>
              <Pressable onPress={onClose} className="p-2 -mr-2 active:opacity-70">
                <X size={24} color="#94a3b8" />
              </Pressable>
            </View>

            {/* Search */}
            <View className="px-5 py-3">
              <View className={`flex-row items-center ${inputBg} rounded-xl px-3 py-2.5`}>
                <Search size={18} color="#94a3b8" />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search objectives..."
                  placeholderTextColor="#94a3b8"
                  className={`flex-1 ml-2 text-sm ${textPrimary}`}
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')}>
                    <X size={18} color="#94a3b8" />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Selection count */}
            <View className="px-5 pb-2">
              <Text className={`${textSecondary} text-xs`}>
                {selectedIds.size} objective{selectedIds.size !== 1 ? 's' : ''} selected
              </Text>
            </View>

            {/* Objectives List */}
            <ScrollView className="px-5" style={{ maxHeight: 400 }}>
              {filteredObjectives.length === 0 ? (
                <View className={`p-6 rounded-xl ${inputBg} items-center`}>
                  <Target size={32} color="#94a3b8" />
                  <Text className={`${textPrimary} font-semibold mt-3`}>
                    {searchQuery ? 'No matching objectives' : 'No objectives yet'}
                  </Text>
                  <Text className={`${textSecondary} text-sm text-center mt-1`}>
                    {searchQuery ? 'Try a different search term' : 'Create objectives in the Objectives tab'}
                  </Text>
                </View>
              ) : (
                <View className="gap-2 pb-4">
                  {filteredObjectives.map((objective) => {
                    const isSelected = selectedIds.has(objective.id);
                    const categoryColor = CATEGORY_COLORS[objective.category] || CATEGORY_COLORS.product;
                    const statusColor = STATUS_COLORS[objective.status] || STATUS_COLORS['on-track'];

                    return (
                      <Pressable
                        key={objective.id}
                        onPress={() => handleToggle(objective.id)}
                        className={`p-3 rounded-xl border-2 active:opacity-80 ${
                          isSelected
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : `${borderColor} ${inputBg}`
                        }`}
                      >
                        <View className="flex-row items-start">
                          {/* Selection indicator */}
                          <View
                            className={`w-6 h-6 rounded-full items-center justify-center mr-3 ${
                              isSelected ? 'bg-purple-500' : isDark ? 'bg-slate-700' : 'bg-gray-200'
                            }`}
                          >
                            {isSelected && <Check size={14} color="#fff" strokeWidth={3} />}
                          </View>

                          {/* Content */}
                          <View className="flex-1">
                            <View className="flex-row items-center gap-2 mb-1">
                              <View
                                className="px-2 py-0.5 rounded"
                                style={{ backgroundColor: categoryColor.bg }}
                              >
                                <Text style={{ color: categoryColor.text }} className="text-[10px] font-semibold capitalize">
                                  {objective.category}
                                </Text>
                              </View>
                              <View
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: statusColor }}
                              />
                              <Text className={`${textMuted} text-[10px]`}>{objective.period}</Text>
                            </View>
                            <Text className={`${textPrimary} font-medium text-sm`} numberOfLines={2}>
                              {objective.title}
                            </Text>
                            <View className="flex-row items-center gap-3 mt-1.5">
                              <Text className={`${textMuted} text-xs`}>
                                {objective.progress}% complete
                              </Text>
                              <Text className={`${textMuted} text-xs`}>
                                {objective.linkedTaskIds.length} task{objective.linkedTaskIds.length !== 1 ? 's' : ''} linked
                              </Text>
                            </View>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            {/* Actions */}
            <View className={`flex-row gap-3 px-5 pt-4 border-t ${borderColor}`}>
              <Pressable
                onPress={onClose}
                className={`flex-1 py-3.5 rounded-xl items-center ${inputBg} active:opacity-80`}
              >
                <Text className={`font-semibold ${textPrimary}`}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                className="flex-1 py-3.5 rounded-xl items-center bg-purple-600 active:opacity-80"
              >
                <Text className="text-white font-semibold">
                  Save {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/**
 * Compact version for showing in task cards
 * Shows linked objectives as badges
 */
interface ObjectiveBadgesProps {
  taskId: string;
  onPress?: () => void;
  maxBadges?: number;
}

export function ObjectiveBadges({ taskId, onPress, maxBadges = 2 }: ObjectiveBadgesProps) {
  const objectives = useObjectivesStore(s => s.objectives);

  const linkedObjectives = useMemo(() => {
    return objectives.filter(obj => obj.linkedTaskIds.includes(taskId));
  }, [objectives, taskId]);

  if (linkedObjectives.length === 0) return null;

  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-1.5 active:opacity-70">
      <Target size={12} color="#8b5cf6" />
      {linkedObjectives.slice(0, maxBadges).map((obj) => {
        const categoryColor = CATEGORY_COLORS[obj.category] || CATEGORY_COLORS.product;
        return (
          <View
            key={obj.id}
            className="px-1.5 py-0.5 rounded"
            style={{ backgroundColor: categoryColor.bg }}
          >
            <Text style={{ color: categoryColor.text }} className="text-[9px] font-medium" numberOfLines={1}>
              {obj.title.length > 12 ? `${obj.title.slice(0, 12)}...` : obj.title}
            </Text>
          </View>
        );
      })}
      {linkedObjectives.length > maxBadges && (
        <Text className="text-purple-500 text-[10px] font-medium">
          +{linkedObjectives.length - maxBadges}
        </Text>
      )}
    </Pressable>
  );
}
