import { View, Text, Pressable } from 'react-native';
import { CheckSquare, Square } from 'lucide-react-native';
import { useState } from 'react';
import { useTheme } from '@/lib/ThemeContext';

interface BulkSelectionBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onCancel: () => void;
  actions: {
    label: string;
    icon: React.ReactNode;
    onPress: () => void;
    variant?: 'default' | 'destructive';
  }[];
}

export function BulkSelectionBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onCancel,
  actions,
}: BulkSelectionBarProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const allSelected = selectedCount === totalCount;

  return (
    <View className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} border-t py-3 px-5`}>
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={allSelected ? onDeselectAll : onSelectAll}
            className="flex-row items-center gap-2"
          >
            {allSelected ? (
              <CheckSquare size={20} color="#8b5cf6" />
            ) : (
              <Square size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            )}
            <Text className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold`}>
              {selectedCount} of {totalCount} selected
            </Text>
          </Pressable>
        </View>
        <Pressable onPress={onCancel}>
          <Text className="text-purple-600 dark:text-purple-400 font-semibold">Cancel</Text>
        </Pressable>
      </View>

      <View className="flex-row gap-2">
        {actions.map((action, index) => (
          <Pressable
            key={index}
            onPress={action.onPress}
            className={`flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl ${
              action.variant === 'destructive'
                ? 'bg-red-600'
                : isDark
                ? 'bg-purple-600'
                : 'bg-purple-600'
            }`}
          >
            {action.icon}
            <Text className="text-white font-semibold">{action.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// Hook for managing bulk selection
export function useBulkSelection<T extends { id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      if (next.size === 0) {
        setSelectionMode(false);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(items.map((item) => item.id)));
    setSelectionMode(true);
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  const getSelectedItems = () => {
    return items.filter((item) => selectedIds.has(item.id));
  };

  const enterSelectionMode = (id?: string) => {
    setSelectionMode(true);
    if (id) {
      setSelectedIds(new Set([id]));
    }
  };

  return {
    selectedIds,
    selectionMode,
    toggleSelection,
    selectAll,
    deselectAll,
    getSelectedItems,
    enterSelectionMode,
    selectedCount: selectedIds.size,
  };
}
