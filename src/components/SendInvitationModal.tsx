/**
 * SendInvitationModal Component
 *
 * Modal for founders to send invitations to executives/apprentices with rate proposals
 */

import { View, Text, Modal, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { X, Send, DollarSign, Calendar, Briefcase, User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useInvitationStore, type NegotiationType } from '@/lib/state/invitation-store';
import { useCurrentWorkspace } from '@/lib/state/app-store';
import type { Candidate } from '@/lib/candidates-seed';

interface SendInvitationModalProps {
  visible: boolean;
  onClose: () => void;
  candidate: Candidate | null;
}

export function SendInvitationModal({ visible, onClose, candidate }: SendInvitationModalProps) {
  const currentWorkspace = useCurrentWorkspace();
  const createInvitation = useInvitationStore(s => s.createInvitation);

  const [position, setPosition] = useState('');
  const [description, setDescription] = useState('');
  const [rateAmount, setRateAmount] = useState('');
  const [rateType, setRateType] = useState<NegotiationType>('hourly_rate');
  const [daysPerWeek, setDaysPerWeek] = useState('');
  const [hoursPerWeek, setHoursPerWeek] = useState('');
  const [startDate, setStartDate] = useState('');
  const [message, setMessage] = useState('');

  const resetForm = () => {
    setPosition('');
    setDescription('');
    setRateAmount('');
    setRateType('hourly_rate');
    setDaysPerWeek('');
    setHoursPerWeek('');
    setStartDate('');
    setMessage('');
  };

  const handleSend = () => {
    if (!candidate || !currentWorkspace) return;

    // Validate required fields
    if (!position || !description || !rateAmount) {
      alert('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(rateAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid rate amount');
      return;
    }

    // Validate candidate role (can only invite executives or apprentices)
    if (candidate.role !== 'FractionalExec' && candidate.role !== 'Apprentice') {
      alert('Can only send invitations to Fractional Executives or Apprentices');
      return;
    }

    // Create the invitation
    createInvitation({
      workspaceId: currentWorkspace.id,
      companyName: currentWorkspace.name,
      candidateId: `candidate-${candidate.id}`,
      candidateName: candidate.name,
      candidateEmail: candidate.email || `${candidate.name.toLowerCase().replace(' ', '.')}@example.com`,
      candidateRole: candidate.role,
      candidateFunction: candidate.specialization[0] || 'Marketing',
      position,
      description,
      startDate: startDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: 'founder-current', // TODO: Get actual user ID
      currentRate: {
        proposedBy: 'founder',
        amount,
        currency: 'GBP',
        type: rateType,
        daysPerWeek: daysPerWeek ? parseInt(daysPerWeek) : undefined,
        hoursPerWeek: hoursPerWeek ? parseInt(hoursPerWeek) : undefined,
        message: message || undefined,
        timestamp: new Date().toISOString(),
      },
    });

    resetForm();
    onClose();
    alert(`Invitation sent to ${candidate.name}!`);
  };

  if (!candidate) return null;

  const suggestedRate = candidate.costPerDay;
  const hourlyEquivalent = Math.round(suggestedRate / 8);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white dark:bg-slate-950 rounded-t-3xl max-h-[90%]">
            {/* Header */}
            <View className="flex-row items-center justify-between p-5 border-b border-gray-200 dark:border-slate-800">
              <View className="flex-1">
                <Text className="text-gray-900 dark:text-white font-bold text-xl">
                  Send Invitation
                </Text>
                <Text className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">
                  Invite {candidate.name} to join your team
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                className="w-9 h-9 bg-gray-100 dark:bg-slate-800 rounded-full items-center justify-center active:opacity-70"
              >
                <X size={20} color="#64748b" />
              </Pressable>
            </View>

            {/* Form */}
            <ScrollView className="px-5" showsVerticalScrollIndicator={false}>
              {/* Candidate Info */}
              <View className="py-4 border-b border-gray-200 dark:border-slate-800">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 bg-purple-500 rounded-full items-center justify-center">
                    <User size={24} color="#fff" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-gray-900 dark:text-white font-semibold">
                      {candidate.name}
                    </Text>
                    <Text className="text-gray-500 dark:text-slate-400 text-sm">
                      {candidate.role} • {candidate.specialization.join(', ')}
                    </Text>
                    <Text className="text-gray-500 dark:text-slate-400 text-xs mt-0.5">
                      Suggested rate: £{suggestedRate}/day (≈ £{hourlyEquivalent}/hr)
                    </Text>
                  </View>
                </View>
              </View>

              {/* Position */}
              <View className="pt-4">
                <Text className="text-gray-900 dark:text-white font-semibold mb-2">
                  Position Title *
                </Text>
                <TextInput
                  value={position}
                  onChangeText={setPosition}
                  placeholder="e.g., Marketing Apprentice"
                  placeholderTextColor="#9ca3af"
                  className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 text-gray-900 dark:text-white"
                />
              </View>

              {/* Description */}
              <View className="pt-4">
                <Text className="text-gray-900 dark:text-white font-semibold mb-2">
                  Role Description *
                </Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe the role, responsibilities, and expectations..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={4}
                  className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 text-gray-900 dark:text-white min-h-[100px]"
                  textAlignVertical="top"
                />
              </View>

              {/* Rate Type */}
              <View className="pt-4">
                <Text className="text-gray-900 dark:text-white font-semibold mb-2">
                  Rate Structure
                </Text>
                <View className="flex-row gap-2">
                  {[
                    { value: 'hourly_rate' as NegotiationType, label: 'Hourly' },
                    { value: 'daily_rate' as NegotiationType, label: 'Daily' },
                    { value: 'monthly_retainer' as NegotiationType, label: 'Monthly' },
                  ].map(option => (
                    <Pressable
                      key={option.value}
                      onPress={() => setRateType(option.value)}
                      className={`flex-1 py-3 px-4 rounded-xl border-2 ${
                        rateType === option.value
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <Text
                        className={`text-center font-semibold ${
                          rateType === option.value
                            ? 'text-purple-600 dark:text-purple-400'
                            : 'text-gray-700 dark:text-slate-300'
                        }`}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Rate Amount */}
              <View className="pt-4">
                <Text className="text-gray-900 dark:text-white font-semibold mb-2">
                  Proposed Rate (GBP) *
                </Text>
                <View className="flex-row items-center bg-gray-100 dark:bg-slate-900 rounded-xl px-4">
                  <DollarSign size={20} color="#9ca3af" />
                  <TextInput
                    value={rateAmount}
                    onChangeText={setRateAmount}
                    placeholder={`${suggestedRate}`}
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                    className="flex-1 p-4 text-gray-900 dark:text-white"
                  />
                  <Text className="text-gray-500 dark:text-slate-400 text-sm">
                    /{rateType === 'hourly_rate' ? 'hr' : rateType === 'daily_rate' ? 'day' : 'mo'}
                  </Text>
                </View>
              </View>

              {/* Days/Hours per week */}
              {rateType !== 'monthly_retainer' && (
                <View className="flex-row gap-3 pt-4">
                  {rateType === 'daily_rate' && (
                    <View className="flex-1">
                      <Text className="text-gray-900 dark:text-white font-semibold mb-2">
                        Days per Week
                      </Text>
                      <TextInput
                        value={daysPerWeek}
                        onChangeText={setDaysPerWeek}
                        placeholder="e.g., 3"
                        placeholderTextColor="#9ca3af"
                        keyboardType="numeric"
                        className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 text-gray-900 dark:text-white"
                      />
                    </View>
                  )}
                  {rateType === 'hourly_rate' && (
                    <View className="flex-1">
                      <Text className="text-gray-900 dark:text-white font-semibold mb-2">
                        Hours per Week
                      </Text>
                      <TextInput
                        value={hoursPerWeek}
                        onChangeText={setHoursPerWeek}
                        placeholder="e.g., 40"
                        placeholderTextColor="#9ca3af"
                        keyboardType="numeric"
                        className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 text-gray-900 dark:text-white"
                      />
                    </View>
                  )}
                </View>
              )}

              {/* Start Date */}
              <View className="pt-4">
                <Text className="text-gray-900 dark:text-white font-semibold mb-2">
                  Proposed Start Date
                </Text>
                <TextInput
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="YYYY-MM-DD (leave blank for ~2 weeks)"
                  placeholderTextColor="#9ca3af"
                  className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 text-gray-900 dark:text-white"
                />
              </View>

              {/* Message */}
              <View className="pt-4 pb-6">
                <Text className="text-gray-900 dark:text-white font-semibold mb-2">
                  Personal Message (Optional)
                </Text>
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Add a personal note to your invitation..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={3}
                  className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 text-gray-900 dark:text-white min-h-[80px]"
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            {/* Footer with Send Button */}
            <View className="p-5 border-t border-gray-200 dark:border-slate-800">
              <Pressable onPress={handleSend} className="active:opacity-70">
                <LinearGradient
                  colors={['#8b5cf6', '#6d28d9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 12, padding: 16 }}
                >
                  <View className="flex-row items-center justify-center">
                    <Send size={20} color="#fff" />
                    <Text className="text-white font-bold text-base ml-2">
                      Send Invitation
                    </Text>
                  </View>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
