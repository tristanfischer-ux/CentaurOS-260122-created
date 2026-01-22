/**
 * InvitationCreationModal
 *
 * Modal for founders to create and send team invitations.
 * Supports role selection, rate proposals, and optional email sending.
 */

import { View, Text, Pressable, Modal, ScrollView, TextInput } from 'react-native';
import { useState, useCallback } from 'react';
import {
  X, UserPlus, Mail, Briefcase, GraduationCap, DollarSign,
  Calendar, ChevronDown, Send, AlertCircle
} from 'lucide-react-native';
import { useInvitationStore, type NegotiationType } from '@/lib/state/invitation-store';
import { useCurrentMembership } from '@/lib/state/app-store';
import { composeInvitationEmail, isEmailAvailable } from '@/lib/email-service';
import type { Function as BusinessFunction } from '@/types';

interface InvitationCreationModalProps {
  visible: boolean;
  onClose: () => void;
  workspaceId: string;
  companyName: string;
}

const FUNCTIONS: BusinessFunction[] = ['Marketing', 'Sales', 'Finance', 'Engineering', 'Ops', 'Admin'];

const RATE_TYPES: { value: NegotiationType; label: string; description: string }[] = [
  { value: 'hourly_rate', label: 'Hourly', description: 'Per hour worked' },
  { value: 'daily_rate', label: 'Daily', description: 'Per day worked' },
  { value: 'monthly_retainer', label: 'Monthly', description: 'Fixed monthly fee' },
];

export function InvitationCreationModal({ visible, onClose, workspaceId, companyName }: InvitationCreationModalProps) {
  const createInvitation = useInvitationStore(s => s.createInvitation);
  const currentMembership = useCurrentMembership();

  // Form state
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidateRole, setCandidateRole] = useState<'FractionalExec' | 'Apprentice'>('Apprentice');
  const [candidateFunction, setCandidateFunction] = useState<BusinessFunction>('Engineering');
  const [position, setPosition] = useState('');
  const [description, setDescription] = useState('');
  const [rateType, setRateType] = useState<NegotiationType>('hourly_rate');
  const [rateAmount, setRateAmount] = useState('');
  const [daysPerWeek, setDaysPerWeek] = useState('5');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  // UI state
  const [showFunctionPicker, setShowFunctionPicker] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setCandidateName('');
    setCandidateEmail('');
    setCandidateRole('Apprentice');
    setCandidateFunction('Engineering');
    setPosition('');
    setDescription('');
    setRateType('hourly_rate');
    setRateAmount('');
    setDaysPerWeek('5');
    setStartDate(new Date().toISOString().split('T')[0]);
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!candidateName.trim()) {
      setError('Please enter candidate name');
      return false;
    }
    if (!candidateEmail.trim() || !candidateEmail.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!position.trim()) {
      setError('Please enter position title');
      return false;
    }
    if (!rateAmount || parseFloat(rateAmount) <= 0) {
      setError('Please enter a valid rate');
      return false;
    }
    return true;
  };

  const handleSend = useCallback(async () => {
    if (!validateForm() || !workspaceId || !currentMembership) return;

    setError(null);
    setSending(true);

    try {
      // Create the invitation
      const invitation = createInvitation({
        workspaceId,
        companyName,
        candidateId: `unaffiliated-${Date.now()}`, // Temp ID until they sign up
        candidateName: candidateName.trim(),
        candidateEmail: candidateEmail.trim().toLowerCase(),
        candidateRole,
        candidateFunction,
        position: position.trim(),
        description: description.trim(),
        startDate,
        currentRate: {
          proposedBy: 'founder',
          amount: parseFloat(rateAmount),
          currency: 'GBP',
          type: rateType,
          daysPerWeek: candidateRole === 'FractionalExec' ? parseInt(daysPerWeek) : undefined,
          timestamp: new Date().toISOString(),
        },
        createdBy: currentMembership.id,
      });

      // Optionally send email
      const emailAvailable = await isEmailAvailable();
      if (emailAvailable) {
        await composeInvitationEmail(candidateEmail.trim().toLowerCase(), {
          recipientName: candidateName.trim(),
          companyName,
          position: position.trim(),
          proposedRate: parseFloat(rateAmount),
          rateType: rateType === 'hourly_rate' ? 'hourly' : rateType === 'daily_rate' ? 'daily' : 'monthly',
          senderName: companyName, // Use company name as sender
        });
      }

      resetForm();
      onClose();
    } catch (err) {
      setError('Failed to create invitation. Please try again.');
    } finally {
      setSending(false);
    }
  }, [
    candidateName, candidateEmail, candidateRole, candidateFunction,
    position, description, startDate, rateType, rateAmount, daysPerWeek,
    workspaceId, companyName, currentMembership, createInvitation, onClose
  ]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable className="flex-1 bg-black/70" onPress={handleClose}>
        <View className="flex-1" />
        <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '90%' }}>
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl">
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <View className="flex-row items-center gap-3">
                <View className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                  <UserPlus size={20} color="#3b82f6" />
                </View>
                <View>
                  <Text className="text-slate-900 dark:text-white font-bold text-lg">
                    Invite Team Member
                  </Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-sm">
                    Send an invitation to join your team
                  </Text>
                </View>
              </View>
              <Pressable onPress={handleClose} className="p-2">
                <X size={24} color="#64748b" />
              </Pressable>
            </View>

            {/* Form */}
            <ScrollView
              className="px-6 py-4"
              contentContainerStyle={{ paddingBottom: 40 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Error Message */}
              {error && (
                <View className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-4">
                  <View className="flex-row items-center gap-2">
                    <AlertCircle size={18} color="#ef4444" />
                    <Text className="text-red-700 dark:text-red-300 flex-1">{error}</Text>
                  </View>
                </View>
              )}

              {/* Role Selection */}
              <View className="mb-4">
                <Text className="text-slate-700 dark:text-slate-300 font-medium mb-2">Role</Text>
                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => setCandidateRole('Apprentice')}
                    className={`flex-1 p-4 rounded-xl border-2 ${
                      candidateRole === 'Apprentice'
                        ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                    }`}
                  >
                    <View className="items-center">
                      <GraduationCap size={24} color={candidateRole === 'Apprentice' ? '#10b981' : '#9ca3af'} />
                      <Text className={`font-semibold mt-2 ${
                        candidateRole === 'Apprentice' ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-400'
                      }`}>
                        Apprentice
                      </Text>
                      <Text className="text-slate-500 dark:text-slate-400 text-xs text-center mt-1">
                        Junior team member
                      </Text>
                    </View>
                  </Pressable>
                  <Pressable
                    onPress={() => setCandidateRole('FractionalExec')}
                    className={`flex-1 p-4 rounded-xl border-2 ${
                      candidateRole === 'FractionalExec'
                        ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                    }`}
                  >
                    <View className="items-center">
                      <Briefcase size={24} color={candidateRole === 'FractionalExec' ? '#3b82f6' : '#9ca3af'} />
                      <Text className={`font-semibold mt-2 ${
                        candidateRole === 'FractionalExec' ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400'
                      }`}>
                        Executive
                      </Text>
                      <Text className="text-slate-500 dark:text-slate-400 text-xs text-center mt-1">
                        Fractional leader
                      </Text>
                    </View>
                  </Pressable>
                </View>
              </View>

              {/* Name */}
              <View className="mb-4">
                <Text className="text-slate-700 dark:text-slate-300 font-medium mb-2">Full Name</Text>
                <TextInput
                  value={candidateName}
                  onChangeText={setCandidateName}
                  placeholder="John Smith"
                  placeholderTextColor="#94a3b8"
                  className="bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white"
                />
              </View>

              {/* Email */}
              <View className="mb-4">
                <Text className="text-slate-700 dark:text-slate-300 font-medium mb-2">Email Address</Text>
                <TextInput
                  value={candidateEmail}
                  onChangeText={setCandidateEmail}
                  placeholder="john@example.com"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white"
                />
              </View>

              {/* Function */}
              <View className="mb-4">
                <Text className="text-slate-700 dark:text-slate-300 font-medium mb-2">Function</Text>
                <Pressable
                  onPress={() => setShowFunctionPicker(!showFunctionPicker)}
                  className="bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 flex-row items-center justify-between"
                >
                  <Text className="text-slate-900 dark:text-white">{candidateFunction}</Text>
                  <ChevronDown size={20} color="#64748b" />
                </Pressable>
                {showFunctionPicker && (
                  <View className="bg-slate-100 dark:bg-slate-800 rounded-xl mt-2 overflow-hidden">
                    {FUNCTIONS.map(func => (
                      <Pressable
                        key={func}
                        onPress={() => {
                          setCandidateFunction(func);
                          setShowFunctionPicker(false);
                        }}
                        className={`px-4 py-3 border-b border-slate-200 dark:border-slate-700 ${
                          candidateFunction === func ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        <Text className={`${
                          candidateFunction === func ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-700 dark:text-slate-300'
                        }`}>
                          {func}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              {/* Position */}
              <View className="mb-4">
                <Text className="text-slate-700 dark:text-slate-300 font-medium mb-2">Position Title</Text>
                <TextInput
                  value={position}
                  onChangeText={setPosition}
                  placeholder={candidateRole === 'Apprentice' ? 'Junior Marketing Assistant' : 'VP of Marketing'}
                  placeholderTextColor="#94a3b8"
                  className="bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white"
                />
              </View>

              {/* Description */}
              <View className="mb-4">
                <Text className="text-slate-700 dark:text-slate-300 font-medium mb-2">Role Description (Optional)</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe the responsibilities..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={3}
                  className="bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white"
                  style={{ minHeight: 80, textAlignVertical: 'top' }}
                />
              </View>

              {/* Rate Proposal */}
              <View className="mb-4">
                <Text className="text-slate-700 dark:text-slate-300 font-medium mb-2">Proposed Rate</Text>

                {/* Rate Type */}
                <View className="flex-row gap-2 mb-3">
                  {RATE_TYPES.map(type => (
                    <Pressable
                      key={type.value}
                      onPress={() => setRateType(type.value)}
                      className={`flex-1 py-2 px-3 rounded-lg ${
                        rateType === type.value
                          ? 'bg-blue-500'
                          : 'bg-slate-100 dark:bg-slate-800'
                      }`}
                    >
                      <Text className={`text-center text-sm font-medium ${
                        rateType === type.value ? 'text-white' : 'text-slate-600 dark:text-slate-300'
                      }`}>
                        {type.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Rate Amount */}
                <View className="flex-row items-center gap-2">
                  <View className="bg-slate-100 dark:bg-slate-800 px-3 py-3 rounded-l-xl">
                    <Text className="text-slate-600 dark:text-slate-400 font-semibold">£</Text>
                  </View>
                  <TextInput
                    value={rateAmount}
                    onChangeText={setRateAmount}
                    placeholder={rateType === 'hourly_rate' ? '25' : rateType === 'daily_rate' ? '200' : '2000'}
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-r-xl px-4 py-3 text-slate-900 dark:text-white"
                  />
                </View>
                <Text className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                  {rateType === 'hourly_rate' ? 'Per hour worked' :
                   rateType === 'daily_rate' ? 'Per day worked' : 'Fixed monthly retainer'}
                </Text>
              </View>

              {/* Days per week (for Fractional Exec) */}
              {candidateRole === 'FractionalExec' && (
                <View className="mb-4">
                  <Text className="text-slate-700 dark:text-slate-300 font-medium mb-2">Days Per Week</Text>
                  <View className="flex-row gap-2">
                    {[1, 2, 3, 4, 5].map(days => (
                      <Pressable
                        key={days}
                        onPress={() => setDaysPerWeek(days.toString())}
                        className={`flex-1 py-3 rounded-lg ${
                          daysPerWeek === days.toString()
                            ? 'bg-blue-500'
                            : 'bg-slate-100 dark:bg-slate-800'
                        }`}
                      >
                        <Text className={`text-center font-semibold ${
                          daysPerWeek === days.toString() ? 'text-white' : 'text-slate-600 dark:text-slate-300'
                        }`}>
                          {days}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Actions */}
            <View className="flex-row gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800">
              <Pressable
                onPress={handleClose}
                className="flex-1 bg-slate-100 dark:bg-slate-800 py-3.5 rounded-xl items-center"
              >
                <Text className="text-slate-700 dark:text-slate-300 font-semibold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSend}
                disabled={sending}
                className={`flex-1 py-3.5 rounded-xl items-center flex-row justify-center gap-2 ${
                  sending ? 'bg-blue-300 dark:bg-blue-800' : 'bg-blue-500'
                }`}
              >
                <Send size={18} color="white" />
                <Text className="text-white font-semibold">
                  {sending ? 'Sending...' : 'Send Invitation'}
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default InvitationCreationModal;
