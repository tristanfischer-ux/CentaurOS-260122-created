/**
 * InvitationListItem Component
 *
 * Displays a single invitation with status, rate details, and actions.
 * Used in the People tab for founders to manage sent invitations.
 */

import React, { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, TextInput } from 'react-native';
import {
  User,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Send,
  X,
  DollarSign,
  Calendar,
  Briefcase
} from 'lucide-react-native';
import { cn } from '@/lib/cn';
import {
  TalentInvitation,
  RateProposal,
  useInvitationStore
} from '@/lib/state/invitation-store';
import { composeInvitationEmail } from '@/lib/email-service';

interface InvitationListItemProps {
  invitation: TalentInvitation;
  onUpdate?: () => void;
}

export function InvitationListItem({ invitation, onUpdate }: InvitationListItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [counterAmount, setCounterAmount] = useState('');
  const [counterMessage, setCounterMessage] = useState('');

  const { updateInvitationRate, withdrawInvitation } = useInvitationStore();

  const statusColors = {
    pending: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Pending' },
    counter_offered: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Counter Offer' },
    accepted: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Accepted' },
    rejected: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Rejected' },
    withdrawn: { bg: 'bg-neutral-500/20', text: 'text-neutral-400', label: 'Withdrawn' },
  };

  const rateTypeLabels = {
    hourly_rate: '/hour',
    daily_rate: '/day',
    monthly_retainer: '/month',
  };

  const status = statusColors[invitation.status];
  const currentRate = invitation.currentRate;
  const isAwaitingFounderResponse = invitation.status === 'counter_offered' &&
    currentRate?.proposedBy === 'candidate';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string = 'GBP') => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleWithdraw = () => {
    withdrawInvitation(invitation.id);
    onUpdate?.();
  };

  const handleCounterOffer = () => {
    const amount = parseFloat(counterAmount);
    if (isNaN(amount) || amount <= 0 || !currentRate) return;

    updateInvitationRate(invitation.id, {
      proposedBy: 'founder',
      amount,
      currency: currentRate.currency,
      type: currentRate.type,
      daysPerWeek: currentRate.daysPerWeek,
      hoursPerWeek: currentRate.hoursPerWeek,
      message: counterMessage || undefined,
      timestamp: new Date().toISOString(),
    });

    setShowCounterModal(false);
    setCounterAmount('');
    setCounterMessage('');
    onUpdate?.();
  };

  const handleResendEmail = async () => {
    if (!invitation.candidateEmail || !currentRate) return;

    await composeInvitationEmail(invitation.candidateEmail, {
      recipientName: invitation.candidateName,
      companyName: invitation.companyName,
      position: invitation.position,
      proposedRate: currentRate.amount,
      rateType: currentRate.type === 'hourly_rate' ? 'hourly' :
        currentRate.type === 'daily_rate' ? 'daily' : 'monthly',
      senderName: 'Your Team',
      invitationLink: 'https://centauros.app/join', // Placeholder for legacy
      expiresInDays: 7,
    });
  };

  return (
    <>
      <Pressable
        onPress={() => setExpanded(!expanded)}
        className={cn(
          'bg-neutral-800/60 rounded-xl border border-neutral-700/50 overflow-hidden',
          isAwaitingFounderResponse && 'border-purple-500/50'
        )}
      >
        {/* Header */}
        <View className="p-4">
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <View className="flex-row items-center gap-2 mb-1">
                <View className="w-8 h-8 rounded-full bg-neutral-700 items-center justify-center">
                  <User size={16} color="#a3a3a3" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-semibold text-base">
                    {invitation.candidateName}
                  </Text>
                  <Text className="text-neutral-400 text-sm">
                    {invitation.position}
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row items-center gap-2">
              <View className={cn('px-2 py-1 rounded-full', status.bg)}>
                <Text className={cn('text-xs font-medium', status.text)}>
                  {status.label}
                </Text>
              </View>
              {expanded ? (
                <ChevronUp size={20} color="#737373" />
              ) : (
                <ChevronDown size={20} color="#737373" />
              )}
            </View>
          </View>

          {/* Rate Summary */}
          {currentRate && (
            <View className="flex-row items-center gap-4 mt-3 pt-3 border-t border-neutral-700/50">
              <View className="flex-row items-center gap-1">
                <DollarSign size={14} color="#737373" />
                <Text className="text-neutral-300 text-sm">
                  {formatCurrency(currentRate.amount, currentRate.currency)}
                  {rateTypeLabels[currentRate.type]}
                </Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Calendar size={14} color="#737373" />
                <Text className="text-neutral-400 text-sm">
                  {formatDate(invitation.createdAt)}
                </Text>
              </View>
            </View>
          )}

          {/* Awaiting Response Banner */}
          {isAwaitingFounderResponse && currentRate && (
            <View className="mt-3 p-2 bg-purple-500/10 rounded-lg border border-purple-500/30">
              <Text className="text-purple-300 text-sm text-center">
                Candidate proposed {formatCurrency(currentRate.amount)} - Response needed
              </Text>
            </View>
          )}
        </View>

        {/* Expanded Content */}
        {expanded && (
          <View className="px-4 pb-4 border-t border-neutral-700/50 pt-3">
            {/* Candidate Info */}
            <View className="mb-4">
              <Text className="text-neutral-400 text-xs uppercase tracking-wider mb-2">
                Candidate Details
              </Text>
              <View className="flex-row items-center gap-2 mb-1">
                <Mail size={14} color="#737373" />
                <Text className="text-neutral-300 text-sm">
                  {invitation.candidateEmail || 'No email'}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Briefcase size={14} color="#737373" />
                <Text className="text-neutral-300 text-sm">
                  {invitation.candidateRole === 'FractionalExec' ? 'Executive' : 'Apprentice'}
                  {invitation.candidateFunction && ` • ${invitation.candidateFunction}`}
                </Text>
              </View>
            </View>

            {/* Rate History */}
            {invitation.rateHistory.length > 1 && (
              <View className="mb-4">
                <Text className="text-neutral-400 text-xs uppercase tracking-wider mb-2">
                  Negotiation History
                </Text>
                <View className="gap-2">
                  {invitation.rateHistory.map((rate, index) => (
                    <View
                      key={index}
                      className={cn(
                        'p-2 rounded-lg',
                        rate.proposedBy === 'founder' ? 'bg-blue-500/10' : 'bg-purple-500/10'
                      )}
                    >
                      <View className="flex-row items-center justify-between">
                        <Text className={cn(
                          'text-sm font-medium',
                          rate.proposedBy === 'founder' ? 'text-blue-300' : 'text-purple-300'
                        )}>
                          {rate.proposedBy === 'founder' ? 'You offered' : 'Candidate proposed'}
                        </Text>
                        <Text className="text-neutral-300 text-sm">
                          {formatCurrency(rate.amount)}{rateTypeLabels[rate.type]}
                        </Text>
                      </View>
                      {rate.message && (
                        <Text className="text-neutral-400 text-xs mt-1 italic">
                          "{rate.message}"
                        </Text>
                      )}
                      <Text className="text-neutral-500 text-xs mt-1">
                        {formatDate(rate.timestamp)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Description */}
            {invitation.description && (
              <View className="mb-4">
                <Text className="text-neutral-400 text-xs uppercase tracking-wider mb-2">
                  Position Description
                </Text>
                <Text className="text-neutral-300 text-sm">
                  {invitation.description}
                </Text>
              </View>
            )}

            {/* Actions */}
            {(invitation.status === 'pending' || invitation.status === 'counter_offered') && (
              <View className="flex-row gap-2 mt-2">
                {isAwaitingFounderResponse && currentRate && (
                  <>
                    <Pressable
                      onPress={() => {
                        // Accept the candidate's counter offer
                        updateInvitationRate(invitation.id, {
                          proposedBy: 'founder',
                          amount: currentRate.amount,
                          currency: currentRate.currency,
                          type: currentRate.type,
                          daysPerWeek: currentRate.daysPerWeek,
                          hoursPerWeek: currentRate.hoursPerWeek,
                          message: 'Accepted',
                          timestamp: new Date().toISOString(),
                        });
                        onUpdate?.();
                      }}
                      className="flex-1 flex-row items-center justify-center gap-2 py-2 px-3 bg-green-600 rounded-lg"
                    >
                      <CheckCircle size={16} color="white" />
                      <Text className="text-white font-medium">Accept</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setCounterAmount(currentRate.amount.toString());
                        setShowCounterModal(true);
                      }}
                      className="flex-1 flex-row items-center justify-center gap-2 py-2 px-3 bg-purple-600 rounded-lg"
                    >
                      <MessageSquare size={16} color="white" />
                      <Text className="text-white font-medium">Counter</Text>
                    </Pressable>
                  </>
                )}

                {invitation.status === 'pending' && (
                  <Pressable
                    onPress={handleResendEmail}
                    className="flex-1 flex-row items-center justify-center gap-2 py-2 px-3 bg-neutral-700 rounded-lg"
                  >
                    <Send size={16} color="white" />
                    <Text className="text-white font-medium">Resend Email</Text>
                  </Pressable>
                )}

                <Pressable
                  onPress={handleWithdraw}
                  className="flex-row items-center justify-center gap-2 py-2 px-3 bg-red-600/20 rounded-lg"
                >
                  <XCircle size={16} color="#f87171" />
                  <Text className="text-red-400 font-medium">Withdraw</Text>
                </Pressable>
              </View>
            )}

            {/* Completed States */}
            {invitation.status === 'accepted' && (
              <View className="flex-row items-center gap-2 p-3 bg-green-500/10 rounded-lg">
                <CheckCircle size={18} color="#4ade80" />
                <Text className="text-green-400 font-medium">
                  Invitation accepted - {invitation.candidateName} has joined the team
                </Text>
              </View>
            )}

            {invitation.status === 'rejected' && (
              <View className="flex-row items-center gap-2 p-3 bg-red-500/10 rounded-lg">
                <XCircle size={18} color="#f87171" />
                <Text className="text-red-400 font-medium">
                  Invitation declined by candidate
                </Text>
              </View>
            )}

            {invitation.status === 'withdrawn' && (
              <View className="flex-row items-center gap-2 p-3 bg-neutral-500/10 rounded-lg">
                <Clock size={18} color="#737373" />
                <Text className="text-neutral-400 font-medium">
                  Invitation withdrawn
                </Text>
              </View>
            )}
          </View>
        )}
      </Pressable>

      {/* Counter Offer Modal */}
      <Modal
        visible={showCounterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCounterModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/70"
          onPress={() => setShowCounterModal(false)}
        >
          <View className="flex-1" />
          <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '80%' }}>
            <View className="bg-neutral-900 rounded-t-3xl border-t border-neutral-700">
              {/* Header */}
              <View className="flex-row items-center justify-between p-4 border-b border-neutral-700">
                <Text className="text-white text-lg font-semibold">Counter Offer</Text>
                <Pressable
                  onPress={() => setShowCounterModal(false)}
                  className="w-8 h-8 items-center justify-center"
                >
                  <X size={24} color="#737373" />
                </Pressable>
              </View>

              <ScrollView className="p-4">
                {/* Current Offer */}
                {currentRate && (
                  <View className="mb-4 p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
                    <Text className="text-purple-300 text-sm mb-1">Their offer:</Text>
                    <Text className="text-white text-xl font-semibold">
                      {formatCurrency(currentRate.amount, currentRate.currency)}
                      {rateTypeLabels[currentRate.type]}
                    </Text>
                    {currentRate.message && (
                      <Text className="text-neutral-400 text-sm mt-2 italic">
                        "{currentRate.message}"
                      </Text>
                    )}
                  </View>
                )}

                {/* Counter Amount */}
                <View className="mb-4">
                  <Text className="text-neutral-400 text-sm mb-2">Your counter offer</Text>
                  <View className="flex-row items-center bg-neutral-800 rounded-xl px-4 py-3 border border-neutral-700">
                    <Text className="text-neutral-400 text-lg mr-2">£</Text>
                    <TextInput
                      value={counterAmount}
                      onChangeText={setCounterAmount}
                      placeholder="0"
                      placeholderTextColor="#525252"
                      keyboardType="decimal-pad"
                      className="flex-1 text-white text-xl"
                    />
                    {currentRate && (
                      <Text className="text-neutral-400 text-sm">
                        {rateTypeLabels[currentRate.type]}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Message */}
                <View className="mb-6">
                  <Text className="text-neutral-400 text-sm mb-2">Message (optional)</Text>
                  <TextInput
                    value={counterMessage}
                    onChangeText={setCounterMessage}
                    placeholder="Add a message explaining your counter offer..."
                    placeholderTextColor="#525252"
                    multiline
                    numberOfLines={3}
                    className="bg-neutral-800 rounded-xl px-4 py-3 text-white border border-neutral-700"
                    style={{ minHeight: 80, textAlignVertical: 'top' }}
                  />
                </View>

                {/* Submit Button */}
                <Pressable
                  onPress={handleCounterOffer}
                  disabled={!counterAmount || parseFloat(counterAmount) <= 0}
                  className={cn(
                    'flex-row items-center justify-center gap-2 py-4 rounded-xl mb-4',
                    counterAmount && parseFloat(counterAmount) > 0
                      ? 'bg-purple-600'
                      : 'bg-neutral-700'
                  )}
                >
                  <Send size={20} color="white" />
                  <Text className="text-white font-semibold text-lg">Send Counter Offer</Text>
                </Pressable>
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
