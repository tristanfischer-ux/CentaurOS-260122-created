import { View, Text, ScrollView, Pressable, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, Clock, DollarSign, Calendar, X, Check, MessageSquare } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCurrentMembership } from '@/lib/state/app-store';

type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'countered';

interface Invitation {
  id: string;
  candidateName: string;
  candidateRole: 'FractionalExec' | 'Apprentice';
  roleTitle: string;
  commitment: string;
  proposedRate: number;
  startDate: string;
  message?: string;
  status: InvitationStatus;
  sentAt: string;
  counterOffer?: {
    rate: number;
    commitment: string;
    message: string;
  };
}

// DISABLED: Demo data removed for multi-tenant architecture
// Invitations should be loaded from Supabase
const DEMO_SENT_INVITATIONS: Invitation[] = [];

const DEMO_RECEIVED_INVITATIONS: Invitation[] = [];

/* REFERENCE: Original demo data (will be migrated to Supabase)
const DEMO_SENT_INVITATIONS_ORIGINAL: Invitation[] = [
  {
    id: 'inv-1',
    candidateName: 'Sarah Mitchell',
    candidateRole: 'FractionalExec',
    roleTitle: 'VP of Sales',
    commitment: '2 days/week',
    proposedRate: 850,
    startDate: 'February 1, 2026',
    message: 'We\'re building an amazing sales team and think you\'d be perfect to lead it!',
    status: 'pending',
    sentAt: '2 days ago',
  },
  {
    id: 'inv-2',
    candidateName: 'James Chen',
    candidateRole: 'FractionalExec',
    roleTitle: 'CFO',
    commitment: '3 days/week',
    proposedRate: 950,
    startDate: 'January 25, 2026',
    status: 'accepted',
    sentAt: '5 days ago',
  },
  {
    id: 'inv-3',
    candidateName: 'Emily Carter',
    candidateRole: 'Apprentice',
    roleTitle: 'Marketing Apprentice',
    commitment: '40 hours/week',
    proposedRate: 150,
    startDate: 'January 20, 2026',
    status: 'countered',
    sentAt: '1 week ago',
    counterOffer: {
      rate: 165,
      commitment: '40 hours/week',
      message: 'Thank you for the opportunity! I\'d love to join but would need £165/day given my current skills and the market rate for marketing apprentices with my experience.',
    },
  },
];

const DEMO_RECEIVED_INVITATIONS_ORIGINAL: Invitation[] = [
  {
    id: 'inv-4',
    candidateName: 'Acme Hardware Inc',
    candidateRole: 'FractionalExec',
    roleTitle: 'VP of Engineering',
    commitment: '2 days/week',
    proposedRate: 1000,
    startDate: 'February 5, 2026',
    message: 'We\'re scaling fast and need someone who can build robust infrastructure. Your experience at Uber and Airbnb is exactly what we need.',
    status: 'pending',
    sentAt: '1 day ago',
  },
];
*/

export default function InvitationsScreen() {
  const insets = useSafeAreaInsets();
  const currentMembership = useCurrentMembership();
  const isFounder = currentMembership?.role === 'Founder';

  const [activeTab, setActiveTab] = useState<'sent' | 'received'>(isFounder ? 'sent' : 'received');
  const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null);
  const [showCounterOfferModal, setShowCounterOfferModal] = useState(false);
  const [counterRate, setCounterRate] = useState('');
  const [counterCommitment, setCounterCommitment] = useState('');
  const [counterMessage, setCounterMessage] = useState('');

  const sentInvitations = DEMO_SENT_INVITATIONS;
  const receivedInvitations = DEMO_RECEIVED_INVITATIONS;

  const getStatusColor = (status: InvitationStatus) => {
    switch (status) {
      case 'accepted':
        return 'bg-emerald-500/20 text-emerald-500';
      case 'declined':
        return 'bg-red-500/20 text-red-500';
      case 'countered':
        return 'bg-amber-500/20 text-amber-500';
      default:
        return 'bg-blue-500/20 text-blue-500';
    }
  };

  const getStatusText = (status: InvitationStatus) => {
    switch (status) {
      case 'accepted':
        return 'Accepted';
      case 'declined':
        return 'Declined';
      case 'countered':
        return 'Counter Offer';
      default:
        return 'Pending';
    }
  };

  const handleAcceptInvitation = (invitation: Invitation) => {
    Alert.alert(
      'Accept Invitation?',
      `You'll be joining as ${invitation.roleTitle} at £${invitation.proposedRate}/day.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: () => {
            setSelectedInvitation(null);
            Alert.alert('Success', 'You\'ve accepted the invitation! The company will be in touch soon.');
          },
        },
      ]
    );
  };

  const handleDeclineInvitation = (invitation: Invitation) => {
    Alert.alert(
      'Decline Invitation?',
      'This will notify the company that you\'re not interested.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => {
            setSelectedInvitation(null);
            Alert.alert('Declined', 'The invitation has been declined.');
          },
        },
      ]
    );
  };

  const handleCounterOffer = () => {
    if (!counterRate || !counterCommitment) {
      Alert.alert('Missing Information', 'Please specify your counter offer rate and commitment.');
      return;
    }

    setShowCounterOfferModal(false);
    setSelectedInvitation(null);
    Alert.alert('Counter Offer Sent', 'Your counter offer has been sent to the company.');
    setCounterRate('');
    setCounterCommitment('');
    setCounterMessage('');
  };

  const handleAcceptCounterOffer = (invitation: Invitation) => {
    if (!invitation.counterOffer) return;

    Alert.alert(
      'Accept Counter Offer?',
      `Accept their counter offer: £${invitation.counterOffer.rate}/day, ${invitation.counterOffer.commitment}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: () => {
            setSelectedInvitation(null);
            Alert.alert('Success', `You've accepted the counter offer from ${invitation.candidateName}! An engagement has been created.`);
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-white dark:bg-slate-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-300 dark:border-slate-700">
        <View className="flex-row items-center mb-3">
          <Pressable
            onPress={() => router.back()}
            className="mr-3 active:opacity-70"
          >
            <ArrowLeft size={24} color="#3b82f6" />
          </Pressable>
          <Text className="text-gray-900 dark:text-white text-xl font-bold">
            My Invitations
          </Text>
        </View>

        {/* Tab Selector */}
        {isFounder && (
          <View className="flex-row bg-gray-100 dark:bg-slate-900 rounded-xl p-1">
            <Pressable
              onPress={() => setActiveTab('sent')}
              className={`flex-1 py-2 rounded-lg ${activeTab === 'sent' ? 'bg-blue-500' : ''}`}
            >
              <Text className={`text-center text-sm font-semibold ${activeTab === 'sent' ? 'text-white' : 'text-gray-600 dark:text-slate-400'}`}>
                Sent ({sentInvitations.length})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('received')}
              className={`flex-1 py-2 rounded-lg ${activeTab === 'received' ? 'bg-blue-500' : ''}`}
            >
              <Text className={`text-center text-sm font-semibold ${activeTab === 'received' ? 'text-white' : 'text-gray-600 dark:text-slate-400'}`}>
                Received ({receivedInvitations.length})
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      <ScrollView className="flex-1 px-6 py-4">
        {/* Sent Invitations Tab */}
        {activeTab === 'sent' && (
          <View>
            {sentInvitations.length === 0 ? (
              <View className="items-center justify-center py-12">
                <MessageSquare size={48} color="#94a3b8" />
                <Text className="text-gray-500 dark:text-slate-400 text-center mt-4">
                  No invitations sent yet.
                </Text>
                <Pressable
                  onPress={() => router.push('/(tabs)/community')}
                  className="mt-4 bg-blue-500 px-6 py-3 rounded-xl active:opacity-70"
                >
                  <Text className="text-white font-semibold">Browse Talent</Text>
                </Pressable>
              </View>
            ) : (
              sentInvitations.map((invitation) => (
                <Pressable
                  key={invitation.id}
                  onPress={() => setSelectedInvitation(invitation)}
                  className="bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-2xl p-4 mb-3 active:opacity-70"
                >
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1">
                      <Text className="text-gray-900 dark:text-white font-bold text-base mb-1">
                        {invitation.candidateName}
                      </Text>
                      <Text className="text-gray-600 dark:text-slate-400 text-sm">
                        {invitation.roleTitle}
                      </Text>
                    </View>
                    <View className={`px-2 py-1 rounded ${getStatusColor(invitation.status)}`}>
                      <Text className="text-xs font-semibold">{getStatusText(invitation.status)}</Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between mt-2">
                    <View className="flex-row items-center">
                      <DollarSign size={14} color="#64748b" />
                      <Text className="text-gray-600 dark:text-slate-400 text-xs ml-1">
                        £{invitation.proposedRate}/day
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Clock size={14} color="#64748b" />
                      <Text className="text-gray-600 dark:text-slate-400 text-xs ml-1">
                        {invitation.commitment}
                      </Text>
                    </View>
                    <Text className="text-gray-500 dark:text-slate-500 text-xs">
                      {invitation.sentAt}
                    </Text>
                  </View>

                  {invitation.status === 'countered' && invitation.counterOffer && (
                    <View className="mt-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2">
                      <Text className="text-amber-900 dark:text-amber-100 text-xs font-semibold">
                        Counter: £{invitation.counterOffer.rate}/day, {invitation.counterOffer.commitment}
                      </Text>
                    </View>
                  )}
                </Pressable>
              ))
            )}
          </View>
        )}

        {/* Received Invitations Tab */}
        {activeTab === 'received' && (
          <View>
            {receivedInvitations.length === 0 ? (
              <View className="items-center justify-center py-12">
                <MessageSquare size={48} color="#94a3b8" />
                <Text className="text-gray-500 dark:text-slate-400 text-center mt-4">
                  No invitations received yet.
                </Text>
              </View>
            ) : (
              receivedInvitations.map((invitation) => (
                <Pressable
                  key={invitation.id}
                  onPress={() => setSelectedInvitation(invitation)}
                  className="bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-2xl p-4 mb-3 active:opacity-70"
                >
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1">
                      <Text className="text-gray-900 dark:text-white font-bold text-base mb-1">
                        {invitation.candidateName}
                      </Text>
                      <Text className="text-gray-600 dark:text-slate-400 text-sm">
                        {invitation.roleTitle}
                      </Text>
                    </View>
                    <View className={`px-2 py-1 rounded ${getStatusColor(invitation.status)}`}>
                      <Text className="text-xs font-semibold">{getStatusText(invitation.status)}</Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between mt-2">
                    <View className="flex-row items-center">
                      <DollarSign size={14} color="#64748b" />
                      <Text className="text-gray-600 dark:text-slate-400 text-xs ml-1">
                        £{invitation.proposedRate}/day
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Clock size={14} color="#64748b" />
                      <Text className="text-gray-600 dark:text-slate-400 text-xs ml-1">
                        {invitation.commitment}
                      </Text>
                    </View>
                    <Text className="text-gray-500 dark:text-slate-500 text-xs">
                      {invitation.sentAt}
                    </Text>
                  </View>
                </Pressable>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Invitation Detail Modal */}
      <Modal visible={selectedInvitation !== null} transparent animationType="fade" onRequestClose={() => setSelectedInvitation(null)}>
        <View className="flex-1 bg-black/70 justify-center items-center px-6">
          {selectedInvitation && (
            <View className="bg-gray-100 dark:bg-slate-900 rounded-3xl w-full" style={{ maxHeight: '85%' }}>
              <View className="px-6 pt-6 pb-4 border-b border-gray-300 dark:border-slate-700">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-1">
                    <Text className="text-gray-900 dark:text-white text-xl font-bold">
                      {selectedInvitation.candidateName}
                    </Text>
                    <Text className="text-gray-600 dark:text-slate-400">{selectedInvitation.roleTitle}</Text>
                  </View>
                  <Pressable onPress={() => setSelectedInvitation(null)}>
                    <X size={24} color="#94a3b8" />
                  </Pressable>
                </View>
              </View>

              <ScrollView showsVerticalScrollIndicator={true} className="flex-1 px-6 py-4">
                {/* Details Card */}
                <View className="bg-gray-200 dark:bg-slate-900 rounded-xl p-4 mb-4">
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-gray-600 dark:text-slate-400">Rate:</Text>
                    <Text className="text-emerald-400 text-lg font-bold">
                      £{selectedInvitation.proposedRate}/day
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-gray-600 dark:text-slate-400">Commitment:</Text>
                    <Text className="text-gray-900 dark:text-white font-semibold">
                      {selectedInvitation.commitment}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-600 dark:text-slate-400">Start Date:</Text>
                    <Text className="text-gray-900 dark:text-white font-semibold">
                      {selectedInvitation.startDate}
                    </Text>
                  </View>
                </View>

                {/* Message */}
                {selectedInvitation.message && (
                  <View className="mb-4">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-2">Message:</Text>
                    <Text className="text-gray-700 dark:text-slate-300">
                      {selectedInvitation.message}
                    </Text>
                  </View>
                )}

                {/* Counter Offer Info */}
                {selectedInvitation.status === 'countered' && selectedInvitation.counterOffer && (
                  <View className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4">
                    <Text className="text-amber-900 dark:text-amber-100 font-semibold mb-2">Counter Offer</Text>
                    <Text className="text-amber-800 dark:text-amber-200 mb-2">
                      Rate: £{selectedInvitation.counterOffer.rate}/day
                    </Text>
                    <Text className="text-amber-800 dark:text-amber-200 mb-2">
                      Commitment: {selectedInvitation.counterOffer.commitment}
                    </Text>
                    {selectedInvitation.counterOffer.message && (
                      <Text className="text-amber-700 dark:text-amber-300 text-sm mt-2">
                        "{selectedInvitation.counterOffer.message}"
                      </Text>
                    )}
                  </View>
                )}

                {/* Action Buttons */}
                {selectedInvitation.status === 'pending' && (
                  <View>
                    {activeTab === 'received' ? (
                      // For received invitations (exec/apprentice view)
                      <>
                        <Pressable
                          onPress={() => handleAcceptInvitation(selectedInvitation)}
                          className="bg-emerald-500 py-4 rounded-xl active:opacity-70 mb-2"
                        >
                          <Text className="text-white text-center font-bold">Accept Invitation</Text>
                        </Pressable>

                        <Pressable
                          onPress={() => {
                            setCounterRate(selectedInvitation.proposedRate.toString());
                            setCounterCommitment(selectedInvitation.commitment);
                            setShowCounterOfferModal(true);
                          }}
                          className="bg-amber-500 py-4 rounded-xl active:opacity-70 mb-2"
                        >
                          <Text className="text-white text-center font-bold">Send Counter Offer</Text>
                        </Pressable>

                        <Pressable
                          onPress={() => handleDeclineInvitation(selectedInvitation)}
                          className="bg-gray-200 dark:bg-slate-900 py-4 rounded-xl active:opacity-70"
                        >
                          <Text className="text-gray-900 dark:text-white text-center font-semibold">Decline</Text>
                        </Pressable>
                      </>
                    ) : (
                      // For sent invitations (founder view)
                      <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                        <Text className="text-blue-900 dark:text-blue-100 text-center">
                          Waiting for {selectedInvitation.candidateName}'s response...
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {selectedInvitation.status === 'countered' && activeTab === 'sent' && (
                  <Pressable
                    onPress={() => handleAcceptCounterOffer(selectedInvitation)}
                    className="bg-emerald-500 py-4 rounded-xl active:opacity-70"
                  >
                    <Text className="text-white text-center font-bold">Accept Counter Offer</Text>
                  </Pressable>
                )}
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>

      {/* Counter Offer Modal */}
      <Modal visible={showCounterOfferModal} transparent animationType="fade" onRequestClose={() => setShowCounterOfferModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-1 bg-black/70 justify-center items-center px-6">
            <View className="bg-gray-100 dark:bg-slate-900 rounded-3xl w-full" style={{ maxHeight: '70%' }}>
              <View className="px-6 pt-6 pb-4 border-b border-gray-300 dark:border-slate-700">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-900 dark:text-white text-xl font-bold">
                    Send Counter Offer
                  </Text>
                  <Pressable onPress={() => setShowCounterOfferModal(false)}>
                    <X size={24} color="#94a3b8" />
                  </Pressable>
                </View>
              </View>

              <ScrollView showsVerticalScrollIndicator={true} className="flex-1 px-6 py-4" keyboardShouldPersistTaps="handled">
              <View className="mb-4">
                <Text className="text-gray-900 dark:text-white font-semibold mb-2">Your Day Rate (£)</Text>
                <TextInput
                  value={counterRate}
                  onChangeText={setCounterRate}
                  placeholder="e.g., 900"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  className="bg-gray-200 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
                />
              </View>

              <View className="mb-4">
                <Text className="text-gray-900 dark:text-white font-semibold mb-2">Your Commitment</Text>
                <TextInput
                  value={counterCommitment}
                  onChangeText={setCounterCommitment}
                  placeholder="e.g., 3 days/week"
                  placeholderTextColor="#94a3b8"
                  className="bg-gray-200 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
                />
              </View>

              <View className="mb-4">
                <Text className="text-gray-900 dark:text-white font-semibold mb-2">Message (Optional)</Text>
                <TextInput
                  value={counterMessage}
                  onChangeText={setCounterMessage}
                  placeholder="Explain your counter offer..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  className="bg-gray-200 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white min-h-[80px]"
                />
              </View>

              <Pressable
                onPress={handleCounterOffer}
                className="bg-amber-500 py-4 rounded-xl active:opacity-70"
              >
                <Text className="text-white text-center font-bold">Send Counter Offer</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
