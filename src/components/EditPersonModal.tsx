import { View, Text, TextInput, Pressable, Modal } from 'react-native';
import { useState } from 'react';
import { X, Check, Edit2, Trash2 } from 'lucide-react-native';
import { useTheme } from '@/lib/ThemeContext';
import type { OrganizationMember } from '@/lib/organization-seed';

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
  const { theme } = useTheme();
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
        <View className={`flex-1 mt-16 ${isDark ? 'bg-slate-950' : 'bg-white'} rounded-t-3xl`}>
          {/* Header */}
          <View
            className={`flex-row items-center justify-between px-5 py-4 border-b ${
              isDark ? 'border-slate-800' : 'border-gray-200'
            }`}
          >
            <View className="flex-1">
              <Text className={`${isDark ? 'text-white' : 'text-gray-900'} text-xl font-bold`}>
                Edit Team Member
              </Text>
              <Text className={`${isDark ? 'text-slate-400' : 'text-gray-600'} text-sm`}>
                {member.role}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              className="w-9 h-9 rounded-full items-center justify-center"
              style={{ backgroundColor: isDark ? '#1e293b' : '#f3f4f6' }}
            >
              <X size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            </Pressable>
          </View>

          {/* Content */}
          <View className="flex-1 px-5 py-6">
            {/* Name */}
            <View className="mb-4">
              <Text
                className={`${
                  isDark ? 'text-slate-400' : 'text-gray-600'
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
                  isDark ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-900'
                } border ${
                  isDark ? 'border-slate-800' : 'border-gray-200'
                } rounded-xl px-4 py-3`}
              />
            </View>

            {/* Email */}
            <View className="mb-4">
              <Text
                className={`${
                  isDark ? 'text-slate-400' : 'text-gray-600'
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
                  isDark ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-900'
                } border ${
                  isDark ? 'border-slate-800' : 'border-gray-200'
                } rounded-xl px-4 py-3`}
              />
            </View>

            {/* Phone */}
            <View className="mb-4">
              <Text
                className={`${
                  isDark ? 'text-slate-400' : 'text-gray-600'
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
                  isDark ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-900'
                } border ${
                  isDark ? 'border-slate-800' : 'border-gray-200'
                } rounded-xl px-4 py-3`}
              />
            </View>

            {/* Function */}
            <View className="mb-4">
              <Text
                className={`${
                  isDark ? 'text-slate-400' : 'text-gray-600'
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
                    isDark ? 'text-slate-400' : 'text-gray-600'
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
                    isDark ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-900'
                  } border ${
                    isDark ? 'border-slate-800' : 'border-gray-200'
                  } rounded-xl px-4 py-3`}
                />
              </View>
            )}

            {/* Cost per day */}
            <View className="mb-4">
              <Text
                className={`${
                  isDark ? 'text-slate-400' : 'text-gray-600'
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
                  isDark ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-900'
                } border ${
                  isDark ? 'border-slate-800' : 'border-gray-200'
                } rounded-xl px-4 py-3`}
              />
            </View>

            {/* Bio */}
            <View className="mb-4">
              <Text
                className={`${
                  isDark ? 'text-slate-400' : 'text-gray-600'
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
                  isDark ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-900'
                } border ${
                  isDark ? 'border-slate-800' : 'border-gray-200'
                } rounded-xl px-4 py-3 min-h-[80px]`}
              />
            </View>
          </View>

          {/* Footer */}
          <View
            className={`p-5 border-t ${isDark ? 'border-slate-800' : 'border-gray-200'} gap-3`}
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
                    isDark ? 'text-slate-300' : 'text-gray-700'
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
