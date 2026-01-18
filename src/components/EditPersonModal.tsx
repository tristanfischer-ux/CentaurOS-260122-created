import { View, Text, TextInput, Pressable, Modal, ScrollView } from 'react-native';
import { useState } from 'react';
import { X, Check, Edit2, Trash2, Plus, Minus, Cpu } from 'lucide-react-native';
import { useTheme } from '@/lib/ThemeContext';
import type { OrganizationMember } from '@/lib/organization-seed';
import { AI_TOOLS_CATALOG, type AITool } from '@/lib/ai-tools-system';
import { useArmoryStore } from '@/lib/state/armory-store';

interface EditPersonModalProps {
  visible: boolean;
  member: OrganizationMember;
  onClose: () => void;
  onSave: (updates: Partial<OrganizationMember>) => void;
  onDelete?: () => void;
}

export function EditPersonModal({
  visible,
  member,
  onClose,
  onSave,
  onDelete,
}: EditPersonModalProps) {
  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';

  const [name, setName] = useState(member.name);
  const [email, setEmail] = useState(member.email);
  const [phone, setPhone] = useState(member.phone || '');
  const [bio, setBio] = useState(member.bio || '');
  const [daysPerWeek, setDaysPerWeek] = useState(
    member.daysPerWeek?.toString() || '5'
  );
  const [costPerDay, setCostPerDay] = useState(
    member.costPerDay?.toString() || '0'
  );

  const functions = ['Finance', 'Sales', 'Marketing', 'Ops', 'Engineering', 'Admin'];
  const [selectedFunction, setSelectedFunction] = useState(member.function);

  // AI Tools management
  const loadout = useArmoryStore((s) => s.getLoadoutForMember(member.id));
  const addAITool = useArmoryStore((s) => s.addAITool);
  const removeAITool = useArmoryStore((s) => s.removeAITool);

  const selectedAIToolIds = loadout?.aiToolIds || [];

  const handleToggleAITool = async (toolId: string) => {
    if (selectedAIToolIds.includes(toolId)) {
      await removeAITool(member.id, toolId);
    } else {
      await addAITool(member.id, toolId);
    }
  };

  const handleSave = () => {
    onSave({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      bio: bio.trim() || undefined,
      function: selectedFunction,
      daysPerWeek: parseInt(daysPerWeek) || 5,
      costPerDay: parseFloat(costPerDay) || 0,
    });
    onClose();
  };

  const canSave = name.trim().length > 0 && email.trim().length > 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50">
        <View className={`flex-1 mt-16 ${isDark ? 'bg-slate-950' : isOffWhite ? 'bg-stone-50' : 'bg-white'} rounded-t-3xl`}>
          {/* Header */}
          <View
            className={`flex-row items-center justify-between px-5 py-4 border-b ${
              isDark ? 'border-slate-800' : isOffWhite ? 'border-stone-300' : 'border-gray-200'
            }`}
          >
            <View className="flex-1">
              <Text className={`${isDark ? 'text-white' : isOffWhite ? 'text-stone-900' : 'text-gray-900'} text-xl font-bold`}>
                Edit Team Member
              </Text>
              <Text className={`${isDark ? 'text-slate-400' : isOffWhite ? 'text-stone-600' : 'text-gray-600'} text-sm`}>
                {member.role}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              className="w-9 h-9 rounded-full items-center justify-center"
              style={{ backgroundColor: isDark ? '#1e293b' : isOffWhite ? '#e7e5e4' : '#f3f4f6' }}
            >
              <X size={20} color={isDark ? '#94a3b8' : isOffWhite ? '#78716c' : '#64748b'} />
            </Pressable>
          </View>

          {/* Content - Wrapped in ScrollView */}
          <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
            <View className="px-5 py-6">
              {/* Name */}
            <View className="mb-4">
              <Text
                className={`${
                  isDark ? 'text-slate-400' : isOffWhite ? 'text-stone-600' : 'text-gray-600'
                } text-xs font-bold mb-2 tracking-wide uppercase`}
              >
                NAME *
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Full name"
                placeholderTextColor="#9ca3af"
                className={`${
                  isDark ? 'bg-slate-900 text-white' : isOffWhite ? 'bg-stone-100 text-stone-900' : 'bg-gray-50 text-gray-900'
                } border ${
                  isDark ? 'border-slate-800' : isOffWhite ? 'border-stone-300' : 'border-gray-200'
                } rounded-xl px-4 py-3`}
              />
            </View>

            {/* Email */}
            <View className="mb-4">
              <Text
                className={`${
                  isDark ? 'text-slate-400' : isOffWhite ? 'text-stone-600' : 'text-gray-600'
                } text-xs font-bold mb-2 tracking-wide uppercase`}
              >
                EMAIL *
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="email@company.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                className={`${
                  isDark ? 'bg-slate-900 text-white' : isOffWhite ? 'bg-stone-100 text-stone-900' : 'bg-gray-50 text-gray-900'
                } border ${
                  isDark ? 'border-slate-800' : isOffWhite ? 'border-stone-300' : 'border-gray-200'
                } rounded-xl px-4 py-3`}
              />
            </View>

            {/* Phone */}
            <View className="mb-4">
              <Text
                className={`${
                  isDark ? 'text-slate-400' : isOffWhite ? 'text-stone-600' : 'text-gray-600'
                } text-xs font-bold mb-2 tracking-wide uppercase`}
              >
                PHONE
              </Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="+1 (555) 123-4567"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
                className={`${
                  isDark ? 'bg-slate-900 text-white' : isOffWhite ? 'bg-stone-100 text-stone-900' : 'bg-gray-50 text-gray-900'
                } border ${
                  isDark ? 'border-slate-800' : isOffWhite ? 'border-stone-300' : 'border-gray-200'
                } rounded-xl px-4 py-3`}
              />
            </View>

            {/* Function */}
            <View className="mb-4">
              <Text
                className={`${
                  isDark ? 'text-slate-400' : isOffWhite ? 'text-stone-600' : 'text-gray-600'
                } text-xs font-bold mb-2 tracking-wide uppercase`}
              >
                FUNCTION
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {functions.map((func) => (
                  <Pressable
                    key={func}
                    onPress={() => setSelectedFunction(func)}
                    className={`px-4 py-2 rounded-full border-2 ${
                      selectedFunction === func
                        ? 'bg-purple-600 border-purple-600'
                        : isDark
                        ? 'border-slate-700 bg-slate-800'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <Text
                      className={`font-semibold text-sm ${
                        selectedFunction === func
                          ? 'text-white'
                          : isDark
                          ? 'text-slate-300'
                          : 'text-gray-700'
                      }`}
                    >
                      {func}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Days per week (for fractional execs) */}
            {member.role === 'FractionalExec' && (
              <View className="mb-4">
                <Text
                  className={`${
                    isDark ? 'text-slate-400' : isOffWhite ? 'text-stone-600' : 'text-gray-600'
                  } text-xs font-bold mb-2 tracking-wide uppercase`}
                >
                  DAYS PER WEEK
                </Text>
                <TextInput
                  value={daysPerWeek}
                  onChangeText={setDaysPerWeek}
                  placeholder="5"
                  placeholderTextColor="#9ca3af"
                  keyboardType="number-pad"
                  className={`${
                    isDark ? 'bg-slate-900 text-white' : isOffWhite ? 'bg-stone-100 text-stone-900' : 'bg-gray-50 text-gray-900'
                  } border ${
                    isDark ? 'border-slate-800' : isOffWhite ? 'border-stone-300' : 'border-gray-200'
                  } rounded-xl px-4 py-3`}
                />
              </View>
            )}

            {/* Cost per day */}
            <View className="mb-4">
              <Text
                className={`${
                  isDark ? 'text-slate-400' : isOffWhite ? 'text-stone-600' : 'text-gray-600'
                } text-xs font-bold mb-2 tracking-wide uppercase`}
              >
                COST PER DAY (£)
              </Text>
              <TextInput
                value={costPerDay}
                onChangeText={setCostPerDay}
                placeholder="0"
                placeholderTextColor="#9ca3af"
                keyboardType="decimal-pad"
                className={`${
                  isDark ? 'bg-slate-900 text-white' : isOffWhite ? 'bg-stone-100 text-stone-900' : 'bg-gray-50 text-gray-900'
                } border ${
                  isDark ? 'border-slate-800' : isOffWhite ? 'border-stone-300' : 'border-gray-200'
                } rounded-xl px-4 py-3`}
              />
            </View>

            {/* Bio */}
            <View className="mb-4">
              <Text
                className={`${
                  isDark ? 'text-slate-400' : isOffWhite ? 'text-stone-600' : 'text-gray-600'
                } text-xs font-bold mb-2 tracking-wide uppercase`}
              >
                BIO
              </Text>
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Brief bio or role description..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className={`${
                  isDark ? 'bg-slate-900 text-white' : isOffWhite ? 'bg-stone-100 text-stone-900' : 'bg-gray-50 text-gray-900'
                } border ${
                  isDark ? 'border-slate-800' : isOffWhite ? 'border-stone-300' : 'border-gray-200'
                } rounded-xl px-4 py-3 min-h-[80px]`}
              />
            </View>

            {/* AI Tools Section */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2">
                  <Cpu size={16} color={isDark ? '#a78bfa' : '#8b5cf6'} />
                  <Text
                    className={`${
                      isDark ? 'text-slate-400' : isOffWhite ? 'text-stone-600' : 'text-gray-600'
                    } text-xs font-bold tracking-wide uppercase`}
                  >
                    AI SYSTEMS
                  </Text>
                </View>
                <Text className={`${isDark ? 'text-slate-500' : 'text-gray-500'} text-xs`}>
                  {selectedAIToolIds.length} active
                </Text>
              </View>

              {/* AI Tools Grid */}
              <View className="gap-2">
                {AI_TOOLS_CATALOG.map((tool) => {
                  const isSelected = selectedAIToolIds.includes(tool.id);
                  const slotColors = {
                    Think: '#3b82f6',
                    Create: '#8b5cf6',
                    Verify: '#10b981',
                    Execute: '#f59e0b',
                    Ops: '#ef4444',
                  };
                  const slotColor = slotColors[tool.slot];

                  return (
                    <Pressable
                      key={tool.id}
                      onPress={() => handleToggleAITool(tool.id)}
                      className={`flex-row items-center justify-between p-3 rounded-xl border-2 ${
                        isSelected
                          ? 'border-purple-500 bg-purple-500/10'
                          : isDark
                          ? 'border-slate-700 bg-slate-800/50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <View className="flex-1 mr-3">
                        <View className="flex-row items-center gap-2 mb-1">
                          <View
                            className="px-2 py-0.5 rounded"
                            style={{ backgroundColor: slotColor + '20' }}
                          >
                            <Text className="text-xs font-bold" style={{ color: slotColor }}>
                              {tool.slot}
                            </Text>
                          </View>
                          <Text
                            className={`font-semibold ${
                              isSelected
                                ? isDark
                                  ? 'text-purple-300'
                                  : 'text-purple-700'
                                : isDark
                                ? 'text-white'
                                : 'text-gray-900'
                            }`}
                          >
                            {tool.name}
                          </Text>
                        </View>
                        <Text
                          className={`text-xs ${
                            isDark ? 'text-slate-400' : isOffWhite ? 'text-stone-600' : 'text-gray-600'
                          }`}
                          numberOfLines={1}
                        >
                          {tool.description}
                        </Text>
                        <Text
                          className={`text-xs mt-1 ${
                            isDark ? 'text-slate-500' : 'text-gray-500'
                          }`}
                        >
                          £{tool.pricePerSeatPerMonth}/mo • {tool.vendor}
                        </Text>
                      </View>

                      {/* Toggle Button */}
                      <View
                        className={`w-8 h-8 rounded-full items-center justify-center ${
                          isSelected
                            ? 'bg-purple-500'
                            : isDark
                            ? 'bg-slate-700'
                            : 'bg-gray-200'
                        }`}
                      >
                        {isSelected ? (
                          <Minus size={16} color="white" />
                        ) : (
                          <Plus size={16} color={isDark ? '#94a3b8' : isOffWhite ? '#78716c' : '#64748b'} />
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {selectedAIToolIds.length === 0 && (
                <View
                  className={`p-4 rounded-xl mt-2 ${
                    isDark ? 'bg-slate-800/50' : 'bg-gray-50'
                  }`}
                >
                  <Text
                    className={`text-sm text-center ${
                      isDark ? 'text-slate-400' : isOffWhite ? 'text-stone-600' : 'text-gray-600'
                    }`}
                  >
                    No AI systems selected. Tap to add AI tools that boost productivity.
                  </Text>
                </View>
              )}
            </View>
          </View>
          </ScrollView>

          {/* Footer */}
          <View
            className={`p-5 border-t ${isDark ? 'border-slate-800' : isOffWhite ? 'border-stone-300' : 'border-gray-200'} gap-3`}
          >
            {/* Delete button (if applicable) */}
            {onDelete && member.role !== 'Founder' && (
              <Pressable
                onPress={() => {
                  onClose();
                  onDelete();
                }}
                className="bg-red-600 rounded-xl py-4 flex-row items-center justify-center active:opacity-70"
              >
                <Trash2 size={18} color="#fff" />
                <Text className="text-white font-bold text-center ml-2">Delete Member</Text>
              </Pressable>
            )}

            <View className="flex-row gap-3">
              <Pressable
                onPress={onClose}
                className={`flex-1 ${
                  isDark ? 'bg-slate-900' : 'bg-gray-100'
                } rounded-xl py-4 active:opacity-70`}
              >
                <Text
                  className={`${
                    isDark ? 'text-slate-300' : isOffWhite ? 'text-stone-700' : 'text-gray-700'
                  } font-semibold text-center`}
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSave}
                disabled={!canSave}
                className={`flex-1 rounded-xl py-4 flex-row items-center justify-center active:opacity-70 ${
                  canSave ? 'bg-purple-600' : isDark ? 'bg-slate-800' : 'bg-gray-200'
                }`}
              >
                <Check size={18} color={canSave ? '#fff' : '#9ca3af'} />
                <Text
                  className={`font-bold text-center ml-2 ${
                    canSave ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  Save Changes
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
