import { View, Text, Modal, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Users, Zap, UserPlus, Briefcase, GraduationCap, AlertCircle, CheckCircle } from 'lucide-react-native';
import { useTheme } from '@/lib/ThemeContext';
import { useOrganizationStore } from '@/lib/state/organization-store';
import type { OrganizationMember } from '@/lib/organization-seed';
import { useFinanceStore } from '@/lib/state/finance-store';
import type { OKR } from '@/lib/state/okr-store';
import type { BusinessFunction } from '@/lib/templates/work-plan-templates';

interface HireResourceModalProps {
  visible: boolean;
  onClose: () => void;
  okr: OKR;
}

type ResourceType = 'executive' | 'apprentice' | 'ai';

interface HireCost {
  costPerWeek: number;
  daysPerWeek: number;
  description: string;
}

const HIRE_COSTS: Record<ResourceType, HireCost> = {
  executive: {
    costPerWeek: 2000,
    daysPerWeek: 2,
    description: 'Fractional Executive - Expert guidance, 2 days/week',
  },
  apprentice: {
    costPerWeek: 500,
    daysPerWeek: 5,
    description: 'Full-time Apprentice - Execution support, 5 days/week',
  },
  ai: {
    costPerWeek: 200,
    daysPerWeek: 7,
    description: 'AI Agent - 24/7 automated support',
  },
};

export default function HireResourceModal({ visible, onClose, okr }: HireResourceModalProps) {
  const insets = useSafeAreaInsets();
  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';

  const [selectedType, setSelectedType] = useState<ResourceType>('apprentice');
  const [name, setName] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const addMember = useOrganizationStore(s => s.addMember);
  const cashBalance = useFinanceStore(s => s.getCashBalance(okr.workspaceId));
  const weeklyBurn = useFinanceStore(s => s.getWeeklyBurn(okr.workspaceId));
  // TODO: Add financial transaction to Supabase instead of direct updates
  // const addTransaction = useFinanceStore(s => s.addTransaction);

  // Theme colors
  const bgPrimary = isDark ? 'bg-slate-900' : isOffWhite ? 'bg-white' : 'bg-white';
  const borderColor = isDark ? 'border-slate-700' : isOffWhite ? 'border-orange-200' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-orange-700' : 'text-gray-600';
  const textMuted = isDark ? 'text-slate-500' : isOffWhite ? 'text-orange-600' : 'text-gray-500';
  const bgSecondary = isDark ? 'bg-slate-800' : isOffWhite ? 'bg-orange-50' : 'bg-gray-50';
  const inputBg = isDark ? 'bg-slate-800' : isOffWhite ? 'bg-orange-100' : 'bg-gray-100';

  const selectedCost = HIRE_COSTS[selectedType];
  const canAfford = cashBalance >= selectedCost.costPerWeek * 4; // Need at least 4 weeks of runway

  const handleHire = () => {
    if (!name.trim()) return;
    if (!canAfford) return;

    const newMember: OrganizationMember = {
      id: `member-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      workspaceId: okr.workspaceId,
      name: name.trim(),
      role: selectedType === 'executive' ? 'FractionalExec' : 'Apprentice',
      function: okr.function,
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@company.com`,
      costPerDay: selectedCost.costPerWeek / selectedCost.daysPerWeek,
      daysPerWeek: selectedCost.daysPerWeek,
      startDate: new Date().toISOString(),
      status: 'active',
      bio: `Hired to accelerate ${okr.title}`,
    };

    // Add member
    if (selectedType !== 'ai') {
      addMember(newMember);
    }

    // TODO: Add financial transactions to Supabase
    // Deduct hiring cost (4 weeks upfront)
    // const hiringCost = selectedCost.costPerWeek * 4;
    // await addTransaction({
    //   workspace_id: okr.workspaceId,
    //   type: 'cost',
    //   category: 'team',
    //   amount: selectedCost.costPerWeek,
    //   transaction_date: new Date().toISOString(),
    //   description: `Hired ${name} as ${selectedType}`,
    //   recurring: true,
    //   recurrence_period: 'weekly'
    // });

    // Show success
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setName('');
      onClose();
    }, 2000);
  };

  const renderTypeSelector = () => (
    <View className="mb-6">
      <Text className={`${textPrimary} font-semibold mb-3`}>Resource Type</Text>
      <View className="gap-3">
        {(['executive', 'apprentice', 'ai'] as ResourceType[]).map(type => {
          const isSelected = selectedType === type;
          const cost = HIRE_COSTS[type];
          const Icon = type === 'executive' ? Briefcase : type === 'apprentice' ? GraduationCap : Zap;

          return (
            <Pressable
              key={type}
              onPress={() => setSelectedType(type)}
              className={`${bgSecondary} border rounded-xl p-4 active:opacity-70 ${
                isSelected ? `border-blue-500 ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}` : borderColor
              }`}
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-row items-start gap-3 flex-1">
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center ${
                      isSelected ? 'bg-blue-500' : isDark ? 'bg-slate-700' : 'bg-gray-200'
                    }`}
                  >
                    <Icon size={18} color={isSelected ? '#fff' : '#64748b'} />
                  </View>
                  <View className="flex-1">
                    <Text className={`${textPrimary} font-semibold capitalize mb-1`}>{type}</Text>
                    <Text className={`${textSecondary} text-sm mb-2`}>{cost.description}</Text>
                    <View className="flex-row items-center gap-3">
                      <Text className={`${textMuted} text-xs`}>
                        £{cost.costPerWeek}/week
                      </Text>
                      <View className="w-1 h-1 rounded-full bg-gray-400" />
                      <Text className={`${textMuted} text-xs`}>
                        {type === 'ai' ? '24/7' : `${cost.daysPerWeek} days/week`}
                      </Text>
                    </View>
                  </View>
                </View>
                {isSelected && (
                  <View className="w-6 h-6 rounded-full bg-blue-500 items-center justify-center">
                    <CheckCircle size={16} color="#fff" />
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const renderCostBreakdown = () => (
    <View className={`${bgSecondary} border ${borderColor} rounded-xl p-4 mb-6`}>
      <Text className={`${textPrimary} font-semibold mb-3`}>Cost Breakdown</Text>

      <View className="gap-2">
        <View className="flex-row justify-between">
          <Text className={textSecondary}>Weekly cost</Text>
          <Text className={`${textPrimary} font-semibold`}>£{selectedCost.costPerWeek}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className={textSecondary}>Upfront payment (4 weeks)</Text>
          <Text className={`${textPrimary} font-semibold`}>£{selectedCost.costPerWeek * 4}</Text>
        </View>
        <View className={`border-t ${borderColor} pt-2 mt-2 flex-row justify-between`}>
          <Text className={`${textPrimary} font-bold`}>Total now</Text>
          <Text className={`${textPrimary} font-bold text-lg`}>£{selectedCost.costPerWeek * 4}</Text>
        </View>
      </View>

      <View className={`mt-4 pt-4 border-t ${borderColor}`}>
        <View className="flex-row justify-between mb-1">
          <Text className={textSecondary}>Current cash</Text>
          <Text className={`${textPrimary} font-medium`}>£{cashBalance.toLocaleString()}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className={textSecondary}>After hire</Text>
          <Text className={`${textPrimary} font-medium`}>
            £{(cashBalance - selectedCost.costPerWeek * 4).toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );

  if (showSuccess) {
    return (
      <Modal visible={visible} animationType="fade" transparent>
        <View className="flex-1 bg-black/50 items-center justify-center p-5">
          <View className={`${bgPrimary} rounded-3xl p-8 items-center max-w-sm`}>
            <View className="w-16 h-16 rounded-full bg-emerald-500 items-center justify-center mb-4">
              <CheckCircle size={32} color="#fff" />
            </View>
            <Text className={`${textPrimary} font-bold text-xl mb-2`}>Hired Successfully!</Text>
            <Text className={`${textSecondary} text-center`}>
              {name} has been added to {okr.function} to accelerate this OKR
            </Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="justify-end">
          <View
            className={`${bgPrimary} rounded-t-3xl`}
            style={{ paddingBottom: insets.bottom + 16, maxHeight: '90%' }}
          >
          {/* Header */}
          <View className={`flex-row items-center justify-between px-5 py-4 border-b ${borderColor}`}>
            <View className="flex-1 mr-4">
              <View className="flex-row items-center gap-2 mb-1">
                <Users size={18} color="#3b82f6" />
                <Text className={`${textPrimary} font-bold text-lg`}>Hire Resources</Text>
              </View>
              <Text className={`${textSecondary} text-sm`}>Speed up: {okr.title}</Text>
            </View>
            <Pressable
              onPress={onClose}
              className={`w-9 h-9 rounded-full ${bgSecondary} items-center justify-center`}
            >
              <X size={18} color={isDark ? '#fff' : '#374151'} />
            </Pressable>
          </View>

          <ScrollView className="px-5 py-6" showsVerticalScrollIndicator={false}>
            {/* Type Selector */}
            {renderTypeSelector()}

            {/* Name Input */}
            {selectedType !== 'ai' && (
              <View className="mb-6">
                <Text className={`${textPrimary} font-semibold mb-2`}>
                  {selectedType === 'executive' ? 'Executive' : 'Apprentice'} Name
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter name..."
                  placeholderTextColor="#64748b"
                  className={`${inputBg} ${textPrimary} rounded-xl px-4 py-3`}
                />
              </View>
            )}

            {selectedType === 'ai' && (
              <View className="mb-6">
                <Text className={`${textPrimary} font-semibold mb-2`}>AI Agent Name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., Marketing Assistant AI"
                  placeholderTextColor="#64748b"
                  className={`${inputBg} ${textPrimary} rounded-xl px-4 py-3`}
                />
              </View>
            )}

            {/* Cost Breakdown */}
            {renderCostBreakdown()}

            {/* Warning if can't afford */}
            {!canAfford && (
              <View className={`${isDark ? 'bg-red-900/20' : 'bg-red-50'} border ${isDark ? 'border-red-500/30' : 'border-red-200'} rounded-xl p-4 mb-4`}>
                <View className="flex-row items-start gap-2">
                  <AlertCircle size={18} color="#ef4444" />
                  <View className="flex-1">
                    <Text className={`${isDark ? 'text-red-400' : 'text-red-700'} font-semibold mb-1`}>
                      Insufficient Cash
                    </Text>
                    <Text className={`${isDark ? 'text-red-300' : 'text-red-600'} text-sm`}>
                      You need at least £{selectedCost.costPerWeek * 4} to hire this resource (4 weeks upfront payment).
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Info */}
            <View className={`${isDark ? 'bg-blue-900/20' : 'bg-blue-50'} border ${isDark ? 'border-blue-500/30' : 'border-blue-200'} rounded-xl p-4`}>
              <Text className={`${isDark ? 'text-blue-400' : 'text-blue-700'} text-sm`}>
                💡 Hiring additional resources speeds up OKR completion by increasing team capacity and reducing bottlenecks.
              </Text>
            </View>
          </ScrollView>

          {/* Action Button */}
          <View className="px-5 pt-4">
            <Pressable
              onPress={handleHire}
              disabled={!name.trim() || !canAfford}
              className={`rounded-xl py-4 flex-row items-center justify-center active:opacity-70 ${
                name.trim() && canAfford
                  ? 'bg-blue-500'
                  : isDark
                  ? 'bg-slate-700'
                  : 'bg-gray-300'
              }`}
            >
              <UserPlus size={20} color={name.trim() && canAfford ? '#fff' : '#64748b'} />
              <Text
                className={`font-bold text-lg ml-2 ${
                  name.trim() && canAfford ? 'text-white' : 'text-gray-500'
                }`}
              >
                Hire for £{selectedCost.costPerWeek * 4}
              </Text>
            </Pressable>
          </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
