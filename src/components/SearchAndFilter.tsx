import { View, Text, Pressable, TextInput } from 'react-native';
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react-native';
import { useState } from 'react';
import { useTheme } from '@/lib/ThemeContext';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  showFilter?: boolean;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search...',
  onFilterPress,
  showFilter = false,
}: SearchBarProps) {
  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';

  return (
    <View className="flex-row items-center gap-2">
      <View className={`flex-1 flex-row items-center ${isDark ? 'bg-slate-800' : isOffWhite ? 'bg-stone-200' : 'bg-gray-100'} rounded-xl px-4 py-3`}>
        <Search size={20} color={isDark ? '#94a3b8' : isOffWhite ? '#78716c' : '#64748b'} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={isDark ? '#64748b' : isOffWhite ? '#a8a29e' : '#9ca3af'}
          className={`flex-1 ml-2 ${isDark ? 'text-white' : isOffWhite ? 'text-stone-900' : 'text-gray-900'}`}
        />
        {value.length > 0 && (
          <Pressable onPress={() => onChangeText('')} className="p-1">
            <X size={16} color={isDark ? '#94a3b8' : isOffWhite ? '#78716c' : '#64748b'} />
          </Pressable>
        )}
      </View>
      {showFilter && (
        <Pressable
          onPress={onFilterPress}
          className={`p-3 rounded-xl ${isDark ? 'bg-slate-800' : isOffWhite ? 'bg-stone-200' : 'bg-gray-100'}`}
        >
          <SlidersHorizontal size={20} color={isDark ? '#94a3b8' : isOffWhite ? '#78716c' : '#64748b'} />
        </Pressable>
      )}
    </View>
  );
}

// Filter chip component
export function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Pressable
      onPress={onPress}
      className={`px-4 py-2 rounded-full border-2 ${
        selected
          ? 'bg-purple-600 border-purple-600'
          : isDark
          ? 'border-slate-700 bg-slate-800'
          : isOffWhite
          ? 'border-stone-300 bg-stone-100'
          : 'border-gray-200 bg-white'
      }`}
    >
      <Text
        className={`font-semibold text-sm ${
          selected ? 'text-white' : isDark ? 'text-slate-300' : isOffWhite ? 'text-stone-700' : 'text-gray-700'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// Filter section
export function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';

  return (
    <View className="mb-6">
      <Text className={`${isDark ? 'text-white' : isOffWhite ? 'text-stone-900' : 'text-gray-900'} font-bold text-sm mb-3`}>
        {title}
      </Text>
      <View className="flex-row flex-wrap gap-2">{children}</View>
    </View>
  );
}
