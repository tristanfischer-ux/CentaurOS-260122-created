/**
 * SendInvitationModal Component
 *
 * Modal for founders to send invitations to executives/apprentices with rate proposals
 * Now using secure Supabase invitation system with cryptographic tokens
 */

import { View, Text, Modal, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { X, Send, CheckCircle, Copy, Mail } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCurrentWorkspace, useCurrentUser } from '@/lib/state/app-store';
import { createSecureInvitation, generateInvitationLink } from '@/lib/supabase-invitation-service';
import type { Candidate } from '@/lib/candidates-seed';
import * as Clipboard from 'expo-clipboard';

interface SendInvitationModalProps {
  visible: boolean;
  onClose: () => void;
  candidate: Candidate | null;
}

export function SendInvitationModal({ visible, onClose, candidate }: SendInvitationModalProps) {
  const currentWorkspace = useCurrentWorkspace();
  const currentUser = useCurrentUser();

  const [email, setEmail] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [invitationSent, setInvitationSent] = useState(false);

  const resetForm = () => {
    setEmail('');
    setPersonalMessage('');
    setInviteLink(null);
    setInvitationSent(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSend = async () => {
    if (!candidate || !currentWorkspace || !currentUser) return;

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      // Create secure invitation in Supabase
      const result = await createSecureInvitation({
        email: email.toLowerCase(),
        workspaceId: currentWorkspace.id,
        userId: currentUser.id,
        prefillName: candidate.name,
        prefillRoleArchetypes: [candidate.role],
        prefillSourceNotes: personalMessage || `Invited by ${currentUser.name} from ${currentWorkspace.name}`,
        expiresInDays: 7,
      });

      if (!result.success) {
        Alert.alert('Error', result.error);
        setIsLoading(false);
        return;
      }

      // Generate invitation link
      const link = generateInvitationLink(result.data.token);
      setInviteLink(link);
      setInvitationSent(true);

      console.log(`[SendInvitation] Secure invitation created for ${email}`);
      console.log(`[SendInvitation] Invitation link: ${link}`);
      console.log(`[SendInvitation] Token: ${result.data.token}`);
      console.log(`[SendInvitation] Expires: ${result.data.expires_at}`);

    } catch (error) {
      console.error('[SendInvitation] Error:', error);
      Alert.alert('Error', 'Failed to create invitation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (inviteLink) {
      await Clipboard.setStringAsync(inviteLink);
      Alert.alert('Copied!', 'Invitation link copied to clipboard');
    }
  };

  const handleSendAnother = () => {
    resetForm();
  };

  if (!candidate) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
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
                  {invitationSent ? 'Invitation Sent!' : 'Send Invitation'}
                </Text>
                <Text className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">
                  {invitationSent
                    ? 'Share the link with your candidate'
                    : `Invite ${candidate.name} to join your team`}
                </Text>
              </View>
              <Pressable
                onPress={handleClose}
                className="w-9 h-9 bg-gray-100 dark:bg-slate-800 rounded-full items-center justify-center active:opacity-70"
              >
                <X size={20} color="#64748b" />
              </Pressable>
            </View>

            {/* Success View */}
            {invitationSent && inviteLink ? (
              <ScrollView className="px-5 py-6" showsVerticalScrollIndicator={false}>
                {/* Success Icon */}
                <View className="items-center py-6">
                  <View className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full items-center justify-center mb-4">
                    <CheckCircle size={40} color="#22c55e" />
                  </View>
                  <Text className="text-gray-900 dark:text-white font-bold text-lg text-center">
                    Secure Invitation Created
                  </Text>
                  <Text className="text-gray-500 dark:text-slate-400 text-sm text-center mt-2">
                    Invitation sent to {email}
                  </Text>
                </View>

                {/* Invitation Link */}
                <View className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 mb-4">
                  <Text className="text-gray-900 dark:text-white font-semibold mb-2">
                    Invitation Link
                  </Text>
                  <Text className="text-gray-600 dark:text-slate-400 text-xs mb-3">
                    {inviteLink}
                  </Text>
                  <Pressable
                    onPress={handleCopyLink}
                    className="bg-purple-500 rounded-lg py-3 active:opacity-70"
                  >
                    <View className="flex-row items-center justify-center">
                      <Copy size={18} color="#fff" />
                      <Text className="text-white font-semibold ml-2">Copy Link</Text>
                    </View>
                  </Pressable>
                </View>

                {/* Security Info */}
                <View className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-4">
                  <Text className="text-blue-900 dark:text-blue-300 font-semibold mb-2 text-sm">
                    🔒 Secure Invitation
                  </Text>
                  <Text className="text-blue-800 dark:text-blue-400 text-xs leading-5">
                    • Cryptographically secure token{'\n'}
                    • Expires in 7 days{'\n'}
                    • One-time use only{'\n'}
                    • Email verification required
                  </Text>
                </View>

                {/* Action Buttons */}
                <View className="flex-row gap-3 pt-4">
                  <Pressable
                    onPress={handleSendAnother}
                    className="flex-1 bg-gray-200 dark:bg-slate-800 rounded-xl py-4 active:opacity-70"
                  >
                    <Text className="text-gray-900 dark:text-white font-semibold text-center">
                      Send Another
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleClose}
                    className="flex-1 bg-purple-500 rounded-xl py-4 active:opacity-70"
                  >
                    <Text className="text-white font-semibold text-center">
                      Done
                    </Text>
                  </Pressable>
                </View>
              </ScrollView>
            ) : (
              /* Form View */
              <ScrollView className="px-5 py-6" showsVerticalScrollIndicator={false}>
                {/* Candidate Info */}
                <View className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 mb-6">
                  <Text className="text-gray-900 dark:text-white font-semibold text-lg">
                    {candidate.name}
                  </Text>
                  <Text className="text-gray-600 dark:text-slate-400 text-sm mt-1">
                    {candidate.role} • {candidate.specialization.join(', ')}
                  </Text>
                  {candidate.costPerDay && (
                    <Text className="text-gray-500 dark:text-slate-500 text-xs mt-2">
                      Suggested rate: £{candidate.costPerDay}/day
                    </Text>
                  )}
                </View>

                {/* Email */}
                <View className="mb-4">
                  <Text className="text-gray-900 dark:text-white font-semibold mb-2">
                    Email Address *
                  </Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder={candidate.email || "candidate@example.com"}
                    placeholderTextColor="#9ca3af"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 text-gray-900 dark:text-white"
                  />
                  <Text className="text-gray-500 dark:text-slate-400 text-xs mt-2">
                    A secure invitation link will be sent to this email
                  </Text>
                </View>

                {/* Personal Message */}
                <View className="mb-6">
                  <Text className="text-gray-900 dark:text-white font-semibold mb-2">
                    Personal Message (Optional)
                  </Text>
                  <TextInput
                    value={personalMessage}
                    onChangeText={setPersonalMessage}
                    placeholder="Add a personal note to your invitation..."
                    placeholderTextColor="#9ca3af"
                    multiline
                    numberOfLines={4}
                    className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 text-gray-900 dark:text-white min-h-[100px]"
                    textAlignVertical="top"
                  />
                </View>

                {/* Info Box */}
                <View className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-4">
                  <Text className="text-blue-900 dark:text-blue-300 font-semibold mb-2 text-sm">
                    How It Works
                  </Text>
                  <Text className="text-blue-800 dark:text-blue-400 text-xs leading-5">
                    1. We'll create a secure invitation link{'\n'}
                    2. You can copy and send it via email or any channel{'\n'}
                    3. The candidate clicks the link to accept{'\n'}
                    4. Link expires in 7 days for security
                  </Text>
                </View>
              </ScrollView>
            )}

            {/* Footer with Send Button (only show if not sent) */}
            {!invitationSent && (
              <View className="p-5 border-t border-gray-200 dark:border-slate-800">
                <Pressable
                  onPress={handleSend}
                  disabled={isLoading}
                  className="active:opacity-70"
                >
                  <LinearGradient
                    colors={['#8b5cf6', '#6d28d9']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ borderRadius: 12, padding: 16, opacity: isLoading ? 0.6 : 1 }}
                  >
                    <View className="flex-row items-center justify-center">
                      {isLoading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Mail size={20} color="#fff" />
                          <Text className="text-white font-bold text-base ml-2">
                            Create Invitation
                          </Text>
                        </>
                      )}
                    </View>
                  </LinearGradient>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
