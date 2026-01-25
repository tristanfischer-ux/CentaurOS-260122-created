import { View, Text, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Calendar, DollarSign, Clock, MessageSquare, UserPlus, Send, AlertCircle, ChevronDown } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInvitationStore, type NegotiationType } from '@/lib/state/invitation-store';
import { useCurrentMembership, useCurrentWorkspace } from '@/lib/state/app-store';
import { composeInvitationEmail, isEmailAvailable } from '@/lib/email-service';
import type { Function as BusinessFunction } from '@/types';

const FUNCTIONS: BusinessFunction[] = ['Marketing', 'Sales', 'Finance', 'Engineering', 'Ops', 'Admin'];

export default function SendInvitationScreen() {
  const params = useLocalSearchParams<{
    candidateId: string;
    candidateName: string;
    candidateRole: string;
    candidateRate: string;
    candidateEmail: string;
    candidateFunction: string;
  }>();

  const insets = useSafeAreaInsets();
  const createInvitation = useInvitationStore(s => s.createInvitation);
  const currentWorkspace = useCurrentWorkspace();
  const currentMembership = useCurrentMembership();

  // Form state - pre-fill from params if available
  const [candidateName, setCandidateName] = useState(params.candidateName || '');
  const [candidateEmail, setCandidateEmail] = useState(params.candidateEmail || '');
  const [candidateRole, setCandidateRole] = useState<'FractionalExec' | 'Apprentice'>(
    params.candidateRole === 'FractionalExec' ? 'FractionalExec' : 'Apprentice'
  );
  const [candidateFunction, setCandidateFunction] = useState<BusinessFunction>(
    (params.candidateFunction as BusinessFunction) || 'Engineering'
  );
  const [roleTitle, setRoleTitle] = useState('');
  const [description, setDescription] = useState('');
  const [commitment, setCommitment] = useState('');
  const [proposedRate, setProposedRate] = useState(params.candidateRate || '');
  const [rateType, setRateType] = useState<NegotiationType>('daily_rate');
  const [startDate, setStartDate] = useState('');
  const [message, setMessage] = useState('');

  // UI state
  const [showFunctionPicker, setShowFunctionPicker] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If we have params, it means someone was selected - otherwise show a prompt
  const hasCandidate = !!params.candidateName;

  const handleSendInvitation = useCallback(async () => {
    // Validate
    if (!candidateName.trim()) {
      setError('Please enter candidate name');
      return;
    }
    if (!candidateEmail.trim() || !candidateEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (!roleTitle.trim()) {
      setError('Please enter a role title');
      return;
    }
    if (!proposedRate || parseFloat(proposedRate) <= 0) {
      setError('Please enter a valid rate');
      return;
    }
    if (!currentWorkspace || !currentMembership) {
      setError('No workspace selected');
      return;
    }

    setError(null);
    setSending(true);

    try {
      // Create the invitation
      const invitation = createInvitation({
        workspaceId: currentWorkspace.id,
        companyName: currentWorkspace.name,
        candidateId: params.candidateId || `unaffiliated-${Date.now()}`,
        candidateName: candidateName.trim(),
        candidateEmail: candidateEmail.trim().toLowerCase(),
        candidateRole,
        candidateFunction,
        position: roleTitle.trim(),
        description: description.trim(),
        startDate: startDate || new Date().toISOString(),
        currentRate: {
          proposedBy: 'founder',
          amount: parseFloat(proposedRate),
          currency: 'GBP',
          type: rateType,
          message: message.trim() || undefined,
          timestamp: new Date().toISOString(),
        },
        createdBy: currentMembership.id,
      });

      // Try to send email
      const emailAvailable = await isEmailAvailable();
      if (emailAvailable) {
        await composeInvitationEmail(candidateEmail.trim().toLowerCase(), {
          recipientName: candidateName.trim(),
          companyName: currentWorkspace.name,
          position: roleTitle.trim(),
          proposedRate: parseFloat(proposedRate),
          rateType: rateType === 'hourly_rate' ? 'hourly' : rateType === 'daily_rate' ? 'daily' : 'monthly',
          senderName: currentWorkspace.name,
          invitationLink: 'https://centauros.app/join', // Placeholder for legacy
          expiresInDays: 7,
        });
      }

      Alert.alert(
        'Invitation Sent!',
        `Your invitation to ${candidateName} has been created${emailAvailable ? ' and email composer opened' : ''}. You can track their response in the People tab.`,
        [
          {
            text: 'View Invitations',
            onPress: () => router.push('/(tabs)/who')
          },
          {
            text: 'Done',
            onPress: () => router.back(),
            style: 'cancel'
          }
        ]
      );
    } catch (err) {
      setError('Failed to create invitation. Please try again.');
    } finally {
      setSending(false);
    }
  }, [
    candidateName, candidateEmail, candidateRole, candidateFunction,
    roleTitle, description, startDate, rateType, proposedRate, message,
    currentWorkspace, currentMembership, createInvitation, params.candidateId
  ]);

  return (
    <View className="flex-1 bg-white dark:bg-slate-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-300 dark:border-slate-800">
        <View className="flex-row items-center mb-2">
          <Pressable
            onPress={() => router.back()}
            className="mr-3 active:opacity-70"
          >
            <ArrowLeft size={24} color="#3b82f6" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-gray-900 dark:text-white text-xl font-bold">
              Send Invitation
            </Text>
            <Text className="text-gray-600 dark:text-slate-400 text-sm mt-0.5">
              to {params.candidateName}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 py-4">
        {/* Role Title */}
        <View className="mb-4">
          <Text className="text-gray-900 dark:text-white font-semibold mb-2">
            Role Title <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={roleTitle}
            onChangeText={setRoleTitle}
            placeholder={`e.g., ${params.candidateRole === 'FractionalExec' ? 'VP of Sales' : 'Marketing Apprentice'}`}
            placeholderTextColor="#94a3b8"
            className="bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
          />
        </View>

        {/* Commitment */}
        <View className="mb-4">
          <Text className="text-gray-900 dark:text-white font-semibold mb-2">
            Commitment <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={commitment}
            onChangeText={setCommitment}
            placeholder="e.g., 2 days/week or 20 hours/week"
            placeholderTextColor="#94a3b8"
            className="bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
          />
          <Text className="text-gray-500 dark:text-slate-500 text-xs mt-1">
            Specify days per week or hours per week
          </Text>
        </View>

        {/* Proposed Rate */}
        <View className="mb-4">
          <Text className="text-gray-900 dark:text-white font-semibold mb-2">
            Proposed Day Rate (£) <Text className="text-red-500">*</Text>
          </Text>
          <View className="flex-row items-center bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-800 rounded-xl px-4">
            <DollarSign size={18} color="#64748b" />
            <TextInput
              value={proposedRate}
              onChangeText={setProposedRate}
              placeholder={params.candidateRate}
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              className="flex-1 py-3 ml-2 text-gray-900 dark:text-white"
            />
            <Text className="text-gray-600 dark:text-slate-400">/day</Text>
          </View>
          <Text className="text-gray-500 dark:text-slate-500 text-xs mt-1">
            Their current rate: £{params.candidateRate}/day
          </Text>
        </View>

        {/* Start Date */}
        <View className="mb-4">
          <Text className="text-gray-900 dark:text-white font-semibold mb-2">
            Proposed Start Date <Text className="text-red-500">*</Text>
          </Text>
          <View className="flex-row items-center bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-800 rounded-xl px-4">
            <Calendar size={18} color="#64748b" />
            <TextInput
              value={startDate}
              onChangeText={setStartDate}
              placeholder="e.g., February 1, 2026"
              placeholderTextColor="#94a3b8"
              className="flex-1 py-3 ml-2 text-gray-900 dark:text-white"
            />
          </View>
        </View>

        {/* Message */}
        <View className="mb-6">
          <Text className="text-gray-900 dark:text-white font-semibold mb-2">
            Personal Message (Optional)
          </Text>
          <View className="bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-800 rounded-xl p-4">
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Tell them why you'd like them to join your team..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              className="text-gray-900 dark:text-white min-h-[120px]"
            />
          </View>
          <Text className="text-gray-500 dark:text-slate-500 text-xs mt-1">
            Share details about your company, the role, or why you think they're a great fit
          </Text>
        </View>

        {/* Preview Card */}
        <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
          <Text className="text-blue-900 dark:text-blue-100 font-semibold mb-2">
            Invitation Summary
          </Text>
          <View className="space-y-2">
            <View className="flex-row items-center">
              <Clock size={14} color="#3b82f6" />
              <Text className="text-blue-800 dark:text-blue-200 text-sm ml-2">
                {commitment || 'Not specified'}
              </Text>
            </View>
            <View className="flex-row items-center">
              <DollarSign size={14} color="#3b82f6" />
              <Text className="text-blue-800 dark:text-blue-200 text-sm ml-2">
                £{proposedRate || '0'}/day
              </Text>
            </View>
            <View className="flex-row items-center">
              <Calendar size={14} color="#3b82f6" />
              <Text className="text-blue-800 dark:text-blue-200 text-sm ml-2">
                Starting {startDate || 'TBD'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View className="px-6 py-4 border-t border-gray-300 dark:border-slate-800" style={{ paddingBottom: insets.bottom + 16 }}>
        <Pressable
          onPress={handleSendInvitation}
          className="bg-blue-500 py-4 rounded-xl active:opacity-70"
        >
          <Text className="text-white text-center font-bold text-lg">Send Invitation</Text>
        </Pressable>
      </View>
    </View>
  );
}
