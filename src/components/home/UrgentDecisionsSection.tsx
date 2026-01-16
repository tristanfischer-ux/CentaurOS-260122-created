/**
 * UrgentDecisionsSection
 * Displays critical decisions requiring immediate action at the top of the home screen
 */

import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  AlertTriangle,
  Clock,
  X,
  ChevronRight,
  CheckCircle2,
  User,
  DollarSign,
  Briefcase,
  Target,
  Scale,
  FileText,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useDecisionsStore, type Decision, type UrgencyLevel } from '@/lib/state/decisions-store';

const URGENCY_COLORS: Record<UrgencyLevel, { bg: string; text: string; border: string; gradient: [string, string] }> = {
  critical: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', gradient: ['#ef4444', '#dc2626'] },
  high: { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa', gradient: ['#f97316', '#ea580c'] },
  normal: { bg: '#fefce8', text: '#ca8a04', border: '#fef08a', gradient: ['#eab308', '#ca8a04'] },
};

const CATEGORY_ICONS: Record<Decision['category'], React.ComponentType<any>> = {
  hiring: User,
  budget: DollarSign,
  strategy: Target,
  operations: Briefcase,
  product: Target,
  legal: Scale,
};

function getTimeRemaining(deadline?: string): string {
  if (!deadline) return '';
  const now = new Date();
  const due = new Date(deadline);
  const diffMs = due.getTime() - now.getTime();

  if (diffMs < 0) return 'Overdue';

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d left`;
  if (hours > 0) return `${hours}h left`;
  return 'Due soon';
}

interface DecisionCardProps {
  decision: Decision;
  onPress: () => void;
  index: number;
}

function DecisionCard({ decision, onPress, index }: DecisionCardProps) {
  const colors = URGENCY_COLORS[decision.urgency];
  const Icon = CATEGORY_ICONS[decision.category] || FileText;
  const timeRemaining = getTimeRemaining(decision.deadline);

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <Pressable
        onPress={onPress}
        className="rounded-xl overflow-hidden mb-3 active:opacity-90"
        style={{ borderWidth: 2, borderColor: colors.border }}
      >
        <LinearGradient
          colors={[colors.bg, '#ffffff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ padding: 16 }}
        >
          {/* Header */}
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-row items-center gap-2 flex-1">
              <View
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.text + '20' }}
              >
                <Icon size={16} color={colors.text} />
              </View>
              <View className="flex-1">
                <Text className="text-slate-900 font-bold text-sm" numberOfLines={1}>
                  {decision.title}
                </Text>
                <Text className="text-slate-500 text-xs capitalize">
                  {decision.category} • {decision.requiredDecisionMaker}
                </Text>
              </View>
            </View>

            {/* Urgency Badge */}
            <View
              className="px-2 py-1 rounded-full flex-row items-center gap-1"
              style={{ backgroundColor: colors.text + '20' }}
            >
              {decision.urgency === 'critical' && <AlertTriangle size={10} color={colors.text} />}
              <Text className="text-xs font-bold uppercase" style={{ color: colors.text }}>
                {decision.urgency}
              </Text>
            </View>
          </View>

          {/* Question */}
          <Text className="text-slate-700 text-sm mb-2" numberOfLines={2}>
            {decision.question}
          </Text>

          {/* Footer */}
          <View className="flex-row items-center justify-between">
            {timeRemaining ? (
              <View className="flex-row items-center gap-1">
                <Clock size={12} color={colors.text} />
                <Text className="text-xs font-semibold" style={{ color: colors.text }}>
                  {timeRemaining}
                </Text>
              </View>
            ) : (
              <View />
            )}

            <View className="flex-row items-center gap-1">
              <Text className="text-xs font-semibold" style={{ color: colors.text }}>
                View Details
              </Text>
              <ChevronRight size={14} color={colors.text} />
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

interface DecisionDetailModalProps {
  decision: Decision | null;
  visible: boolean;
  onClose: () => void;
  onDecide: (decisionId: string, optionId: string) => void;
}

function DecisionDetailModal({ decision, visible, onClose, onDecide }: DecisionDetailModalProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  if (!decision) return null;

  const colors = URGENCY_COLORS[decision.urgency];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/70" onPress={onClose}>
        <View className="flex-1" />
        <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '90%' }}>
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl">
            {/* Header */}
            <LinearGradient
              colors={colors.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                  <AlertTriangle size={20} color="white" />
                  <Text className="text-white/80 text-xs font-bold uppercase">
                    {decision.urgency} Decision
                  </Text>
                </View>
                <Pressable onPress={onClose} className="bg-white/20 p-2 rounded-full">
                  <X size={18} color="white" />
                </Pressable>
              </View>
              <Text className="text-white font-bold text-xl">{decision.title}</Text>
              {decision.deadline && (
                <View className="flex-row items-center gap-1 mt-2">
                  <Clock size={14} color="white" />
                  <Text className="text-white/90 text-sm">
                    {getTimeRemaining(decision.deadline)}
                  </Text>
                </View>
              )}
            </LinearGradient>

            <ScrollView className="p-5" contentContainerStyle={{ paddingBottom: 40 }}>
              {/* Question */}
              <View className="mb-4">
                <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-1">
                  Decision Required
                </Text>
                <Text className="text-slate-900 dark:text-white text-lg font-semibold">
                  {decision.question}
                </Text>
              </View>

              {/* Context */}
              <View className="mb-4 bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-2">
                  Context
                </Text>
                <Text className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                  {decision.context}
                </Text>
              </View>

              {/* Options */}
              {decision.options && decision.options.length > 0 && (
                <View className="mb-4">
                  <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-3">
                    Options
                  </Text>
                  <View className="gap-2">
                    {decision.options.map((option) => (
                      <Pressable
                        key={option.id}
                        onPress={() => setSelectedOption(option.id)}
                        className={`rounded-xl p-4 border-2 ${
                          selectedOption === option.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                        }`}
                      >
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-slate-900 dark:text-white font-bold text-sm">
                            {option.label}
                          </Text>
                          {option.recommended && (
                            <View className="bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                              <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                                RECOMMENDED
                              </Text>
                            </View>
                          )}
                        </View>
                        {option.description && (
                          <Text className="text-slate-600 dark:text-slate-400 text-xs mb-1">
                            {option.description}
                          </Text>
                        )}
                        {option.impact && (
                          <Text className="text-slate-500 dark:text-slate-500 text-xs italic">
                            Impact: {option.impact}
                          </Text>
                        )}
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View className="gap-3 mt-4">
                <Pressable
                  onPress={() => {
                    if (selectedOption) {
                      onDecide(decision.id, selectedOption);
                      onClose();
                    }
                  }}
                  disabled={!selectedOption}
                  className={`py-4 rounded-xl items-center ${
                    selectedOption ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <View className="flex-row items-center gap-2">
                    <CheckCircle2 size={18} color="white" />
                    <Text className="text-white font-bold text-base">
                      {selectedOption ? 'Confirm Decision' : 'Select an Option'}
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={onClose}
                  className="py-3 rounded-xl items-center border-2 border-slate-200 dark:border-slate-700"
                >
                  <Text className="text-slate-600 dark:text-slate-400 font-semibold text-sm">
                    Decide Later
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function UrgentDecisionsSection() {
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
  const [showModal, setShowModal] = useState(false);

  const initialize = useDecisionsStore((s) => s.initialize);
  const getUrgentDecisions = useDecisionsStore((s) => s.getUrgentDecisions);
  const makeDecision = useDecisionsStore((s) => s.makeDecision);

  // Initialize on mount
  useState(() => {
    initialize();
  });

  const urgentDecisions = getUrgentDecisions();

  if (urgentDecisions.length === 0) {
    return null;
  }

  const criticalCount = urgentDecisions.filter((d) => d.urgency === 'critical').length;
  const highCount = urgentDecisions.filter((d) => d.urgency === 'high').length;

  return (
    <View className="mb-4">
      {/* Section Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <View className="bg-red-500 p-1.5 rounded-lg">
            <AlertTriangle size={16} color="white" />
          </View>
          <Text className="text-slate-900 dark:text-white font-bold text-base">
            Urgent Decisions
          </Text>
          <View className="bg-red-500 px-2 py-0.5 rounded-full">
            <Text className="text-white text-xs font-bold">{urgentDecisions.length}</Text>
          </View>
        </View>

        {/* Urgency Summary */}
        <View className="flex-row gap-1">
          {criticalCount > 0 && (
            <View className="bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full">
              <Text className="text-red-600 dark:text-red-400 text-xs font-bold">
                {criticalCount} critical
              </Text>
            </View>
          )}
          {highCount > 0 && (
            <View className="bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full">
              <Text className="text-orange-600 dark:text-orange-400 text-xs font-bold">
                {highCount} high
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Decision Cards */}
      <View>
        {urgentDecisions.slice(0, 3).map((decision, index) => (
          <DecisionCard
            key={decision.id}
            decision={decision}
            index={index}
            onPress={() => {
              setSelectedDecision(decision);
              setShowModal(true);
            }}
          />
        ))}

        {urgentDecisions.length > 3 && (
          <Pressable className="py-2 items-center">
            <Text className="text-blue-600 dark:text-blue-400 text-sm font-semibold">
              View {urgentDecisions.length - 3} more decisions
            </Text>
          </Pressable>
        )}
      </View>

      {/* Decision Detail Modal */}
      <DecisionDetailModal
        decision={selectedDecision}
        visible={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedDecision(null);
        }}
        onDecide={(decisionId, optionId) => {
          makeDecision(decisionId, optionId, 'Founder');
        }}
      />
    </View>
  );
}
