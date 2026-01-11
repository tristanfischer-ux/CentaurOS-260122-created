import { View, Text, ScrollView, Pressable, ActivityIndicator, Modal, TextInput } from 'react-native';
import { useState } from 'react';
import { CheckCircle, XCircle, Clock, X, ThumbsUp, AlertTriangle } from 'lucide-react-native';
import { useCurrentWorkspace, useCurrentMembership } from '@/lib/state/app-store';
import { useReviews, useSubmitReview } from '@/lib/hooks/queries';
import type { ReviewStatus } from '@/types';

export default function ReviewsScreen() {
  const currentWorkspace = useCurrentWorkspace();
  const currentMembership = useCurrentMembership();

  const { data: reviews, isLoading } = useReviews(currentWorkspace?.id ?? null);
  const submitReviewMutation = useSubmitReview();

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const pendingReviews = reviews?.filter((r) => r.status === 'pending') || [];
  const completedReviews = reviews?.filter((r) => r.status !== 'pending') || [];

  const canReview = currentMembership?.role === 'FractionalExec' || currentMembership?.role === 'Founder';

  const handleSubmitReview = async (status: ReviewStatus) => {
    if (!selectedReview || !currentWorkspace) return;

    try {
      await submitReviewMutation.mutateAsync({
        reviewId: selectedReview.id,
        workspaceId: currentWorkspace.id,
        status,
        notes: reviewNotes.trim() || undefined,
      });

      setShowReviewModal(false);
      setSelectedReview(null);
      setReviewNotes('');
    } catch (error) {
      console.error('Failed to submit review:', error);
    }
  };

  if (!canReview) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center p-6">
        <AlertTriangle size={64} color="#eab308" />
        <Text className="text-white text-xl font-semibold mt-4 mb-2">Access Restricted</Text>
        <Text className="text-slate-400 text-center">
          Only Fractional Executives and Founders can access the Review Queue
        </Text>
      </View>
    );
  }

  if (pendingReviews.length === 0 && completedReviews.length === 0) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center p-6">
        <CheckCircle size={64} color="#10b981" />
        <Text className="text-white text-xl font-semibold mt-4 mb-2">All Caught Up!</Text>
        <Text className="text-slate-400 text-center">
          No reviews pending. Check back when apprentices submit work for review.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="p-6 pb-4">
        <Text className="text-white text-2xl font-bold">Review Queue</Text>
        <Text className="text-slate-400 text-sm mt-1">
          {pendingReviews.length} pending review{pendingReviews.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Pending Reviews */}
      {pendingReviews.length > 0 && (
        <View className="px-6 pb-6">
          <Text className="text-white text-lg font-semibold mb-3">Pending</Text>
          <View className="gap-3">
            {pendingReviews.map((review) => (
              <Pressable
                key={review.id}
                onPress={() => {
                  setSelectedReview(review);
                  setShowReviewModal(true);
                }}
                className="bg-slate-900 rounded-2xl p-4 border-2 border-yellow-500/30 active:opacity-70"
              >
                {/* Review Header */}
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1 mr-3">
                    <View className="flex-row items-center gap-2 mb-2">
                      <Clock size={16} color="#eab308" />
                      <Text className="text-yellow-400 text-xs font-semibold uppercase tracking-wide">
                        Awaiting Review
                      </Text>
                    </View>
                    <Text className="text-white font-semibold text-base mb-1">
                      {review.task?.title || 'Task'}
                    </Text>
                    {review.task?.description && (
                      <Text className="text-slate-400 text-sm" numberOfLines={2}>
                        {review.task.description}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Review Meta */}
                <View className="flex-row items-center justify-between pt-3 border-t border-slate-800">
                  <View className="flex-row items-center gap-3">
                    <Text className="text-slate-400 text-xs">
                      Requested {new Date(review.requestedAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Completed Reviews */}
      {completedReviews.length > 0 && (
        <View className="px-6 pb-6">
          <Text className="text-white text-lg font-semibold mb-3">Completed</Text>
          <View className="gap-3">
            {completedReviews.map((review) => {
              const isApproved = review.status === 'approved';

              return (
                <View
                  key={review.id}
                  className={`bg-slate-900 rounded-2xl p-4 border ${
                    isApproved ? 'border-green-500/30' : 'border-red-500/30'
                  }`}
                >
                  {/* Review Header */}
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1 mr-3">
                      <View className="flex-row items-center gap-2 mb-2">
                        {isApproved ? (
                          <CheckCircle size={16} color="#10b981" />
                        ) : (
                          <XCircle size={16} color="#ef4444" />
                        )}
                        <Text
                          className={`text-xs font-semibold uppercase tracking-wide ${
                            isApproved ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {isApproved ? 'Approved' : 'Changes Requested'}
                        </Text>
                      </View>
                      <Text className="text-white font-semibold text-base mb-1">
                        {review.task?.title || 'Task'}
                      </Text>
                      {review.notes && (
                        <View className="mt-2 bg-slate-800 rounded-lg p-3">
                          <Text className="text-slate-300 text-sm">{review.notes}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Review Meta */}
                  <View className="flex-row items-center gap-3 pt-3 border-t border-slate-800">
                    {review.reviewer && (
                      <>
                        <View className="flex-row items-center">
                          <View className="w-6 h-6 bg-purple-500 rounded-full items-center justify-center mr-2">
                            <Text className="text-white text-xs font-semibold">
                              {review.reviewer.name.charAt(0)}
                            </Text>
                          </View>
                          <Text className="text-slate-400 text-xs">{review.reviewer.name}</Text>
                        </View>
                        <Text className="text-slate-600">•</Text>
                      </>
                    )}
                    <Text className="text-slate-400 text-xs">
                      {review.reviewedAt ? new Date(review.reviewedAt).toLocaleDateString() : 'N/A'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Review Modal */}
      <Modal visible={showReviewModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-slate-900 rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-xl font-bold">Review Task</Text>
              <Pressable onPress={() => setShowReviewModal(false)}>
                <X size={24} color="#94a3b8" />
              </Pressable>
            </View>

            {selectedReview && (
              <>
                <View className="mb-4">
                  <Text className="text-white font-semibold text-lg mb-2">
                    {selectedReview.task?.title}
                  </Text>
                  {selectedReview.task?.description && (
                    <Text className="text-slate-400 text-sm">{selectedReview.task.description}</Text>
                  )}
                </View>

                {/* Notes Input */}
                <View className="mb-6">
                  <Text className="text-slate-400 text-sm mb-2">Review Notes (Optional)</Text>
                  <TextInput
                    className="bg-slate-800 rounded-xl px-4 py-3 text-white text-base min-h-[100px]"
                    value={reviewNotes}
                    onChangeText={setReviewNotes}
                    placeholder="Add feedback or comments..."
                    placeholderTextColor="#475569"
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                {/* Action Buttons */}
                <View className="gap-3">
                  <Pressable
                    onPress={() => handleSubmitReview('approved')}
                    disabled={submitReviewMutation.isPending}
                    className="bg-green-500 rounded-xl py-4 flex-row items-center justify-center active:opacity-80"
                  >
                    <ThumbsUp size={20} color="white" />
                    <Text className="text-white font-bold ml-2 text-base">Approve</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleSubmitReview('changes_requested')}
                    disabled={submitReviewMutation.isPending}
                    className="bg-red-500 rounded-xl py-4 flex-row items-center justify-center active:opacity-80"
                  >
                    <XCircle size={20} color="white" />
                    <Text className="text-white font-bold ml-2 text-base">Request Changes</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setShowReviewModal(false)}
                    className="bg-slate-800 rounded-xl py-3 items-center active:opacity-80"
                  >
                    <Text className="text-slate-400 font-semibold">Cancel</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
