import { View, Text, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Calendar, DollarSign, Clock, MessageSquare } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SendInvitationScreen() {
  const params = useLocalSearchParams<{
    candidateId: string;
    candidateName: string;
    candidateRole: string;
    candidateRate: string;
  }>();

  const insets = useSafeAreaInsets();

  const [roleTitle, setRoleTitle] = useState('');
  const [commitment, setCommitment] = useState('');
  const [proposedRate, setProposedRate] = useState(params.candidateRate || '');
  const [startDate, setStartDate] = useState('');
  const [message, setMessage] = useState('');

  const handleSendInvitation = () => {
    if (!roleTitle || !commitment || !proposedRate || !startDate) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    // In real app, this would send to backend
    Alert.alert(
      'Invitation Sent!',
      `Your invitation to ${params.candidateName} has been sent successfully. You'll be notified when they respond.`,
      [
        {
          text: 'View My Invitations',
          onPress: () => router.push('/invitations')
        },
        {
          text: 'Back to Marketplace',
          onPress: () => router.push('/(tabs)/community'),
          style: 'cancel'
        }
      ]
    );
  };

  return (
    <View className="flex-1 bg-white dark:bg-slate-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-300 dark:border-slate-700">
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
            className="bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
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
            className="bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
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
          <View className="flex-row items-center bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-4">
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
          <View className="flex-row items-center bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-4">
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
          <View className="bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl p-4">
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
      <View className="px-6 py-4 border-t border-gray-300 dark:border-slate-700" style={{ paddingBottom: insets.bottom + 16 }}>
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
