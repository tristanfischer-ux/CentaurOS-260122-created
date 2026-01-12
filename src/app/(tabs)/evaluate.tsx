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
      <View className="flex-1 bg-white dark:bg-slate-950 items-center justify-center">
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
      <ScrollView className="flex-1 bg-white dark:bg-slate-950">
        {/* Header */}
        <View className="p-6 pb-4">
          <Text className="text-gray-900 dark:text-white text-2xl font-bold">Review Queue</Text>
          <Text className="text-gray-600 dark:text-slate-400 text-sm mt-1">
            Access restricted
          </Text>
        </View>

        <View className="px-6">
          <View className="items-center py-8">
            <AlertTriangle size={64} color="#eab308" />
            <Text className="text-gray-900 dark:text-white text-xl font-semibold mt-4 mb-2">Access Restricted</Text>
            <Text className="text-gray-600 dark:text-slate-400 text-center mb-6">
              Only Fractional Executives and Founders can access the Review Queue
            </Text>
          </View>

          {/* Role Explanation */}
          <View className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-5 border border-gray-200 dark:border-slate-800">
            <Text className="text-gray-900 dark:text-white font-bold text-lg mb-4">About Review Access</Text>

            <View className="gap-4">
              <View>
                <Text className="text-gray-900 dark:text-white font-semibold mb-2">Who Can Review?</Text>
                <View className="gap-2 ml-2">
                  <View className="flex-row items-center gap-2">
                    <View className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    <Text className="text-gray-600 dark:text-slate-400 text-sm">Founders (full access)</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <View className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    <Text className="text-gray-600 dark:text-slate-400 text-sm">Fractional Executives</Text>
                  </View>
                </View>
              </View>

              <View>
                <Text className="text-gray-900 dark:text-white font-semibold mb-2">Your Role</Text>
                <Text className="text-gray-600 dark:text-slate-400 text-sm">
                  Current role: <Text className="font-bold text-blue-600 dark:text-blue-400">{currentMembership?.role || 'Unknown'}</Text>
                </Text>
                <Text className="text-gray-600 dark:text-slate-400 text-sm mt-2">
                  {currentMembership?.role === 'Apprentice'
                    ? 'As an Apprentice, you can submit work for review but cannot review others\' work.'
                    : 'Contact your workspace founder to adjust your permissions.'}
                </Text>
              </View>
            </View>
          </View>

          {/* What You Can Do */}
          {currentMembership?.role === 'Apprentice' && (
            <View className="mt-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-200 dark:border-blue-800 mb-6">
              <View className="flex-row items-center gap-2 mb-1">
                <CheckCircle size={18} color="#3b82f6" />
                <Text className="text-blue-700 dark:text-blue-400 font-bold">What You Can Do</Text>
              </View>
              <Text className="text-blue-600 dark:text-blue-400 text-xs">
                Go to the Work tab to view and complete tasks. When ready, you can request reviews from executives.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    );
  }

  if (pendingReviews.length === 0 && completedReviews.length === 0) {
    return (
      <ScrollView className="flex-1 bg-white dark:bg-slate-950">
        {/* Header */}
        <View className="p-6 pb-4">
          <Text className="text-gray-900 dark:text-white text-2xl font-bold">Review Queue</Text>
          <Text className="text-gray-600 dark:text-slate-400 text-sm mt-1">
            No reviews pending
          </Text>
        </View>

        {/* Empty State with Info */}
        <View className="px-6">
          <View className="items-center py-8">
            <CheckCircle size={64} color="#10b981" />
            <Text className="text-gray-900 dark:text-white text-xl font-semibold mt-4 mb-2">All Caught Up!</Text>
            <Text className="text-gray-600 dark:text-slate-400 text-center mb-6">
              No reviews pending. Check back when apprentices submit work for review.
            </Text>
          </View>

          {/* How It Works */}
          <View className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-5 border border-gray-200 dark:border-slate-800">
            <Text className="text-gray-900 dark:text-white font-bold text-lg mb-4">How Review Queue Works</Text>

            <View className="gap-4">
              <View className="flex-row items-start gap-3">
                <View className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full items-center justify-center">
                  <Text className="text-blue-600 dark:text-blue-400 font-bold text-sm">1</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 dark:text-white font-semibold mb-1">Apprentices Submit Work</Text>
                  <Text className="text-gray-600 dark:text-slate-400 text-sm">
                    When apprentices complete tasks, they can request a review from executives
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start gap-3">
                <View className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full items-center justify-center">
                  <Text className="text-purple-600 dark:text-purple-400 font-bold text-sm">2</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 dark:text-white font-semibold mb-1">Reviews Appear Here</Text>
                  <Text className="text-gray-600 dark:text-slate-400 text-sm">
                    All pending reviews show up in your queue, ordered by request date
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start gap-3">
                <View className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full items-center justify-center">
                  <Text className="text-green-600 dark:text-green-400 font-bold text-sm">3</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 dark:text-white font-semibold mb-1">Approve or Request Changes</Text>
                  <Text className="text-gray-600 dark:text-slate-400 text-sm">
                    Review the work, add feedback notes, and either approve or request changes
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quick Stats */}
          <View className="mt-4 gap-3 pb-6">
            <View className="bg-green-50 dark:bg-green-900/10 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <View className="flex-row items-center gap-2 mb-1">
                <CheckCircle size={18} color="#10b981" />
                <Text className="text-green-700 dark:text-green-400 font-bold">Fast Reviews Build Trust</Text>
              </View>
              <Text className="text-green-600 dark:text-green-400 text-xs">
                Aim to review within 24 hours to keep apprentices productive and motivated
              </Text>
            </View>

            <View className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <View className="flex-row items-center gap-2 mb-1">
                <ThumbsUp size={18} color="#3b82f6" />
                <Text className="text-blue-700 dark:text-blue-400 font-bold">Quality Feedback Matters</Text>
              </View>
              <Text className="text-blue-600 dark:text-blue-400 text-xs">
                Detailed notes help apprentices learn and improve, even when requesting changes
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white dark:bg-slate-950">
      {/* Header */}
      <View className="p-6 pb-4">
        <Text className="text-gray-900 dark:text-white text-2xl font-bold">Review Queue</Text>
        <Text className="text-gray-600 dark:text-slate-400 text-sm mt-1">
          {pendingReviews.length} pending review{pendingReviews.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Pending Reviews */}
      {pendingReviews.length > 0 && (
        <View className="px-6 pb-6">
          <Text className="text-gray-900 dark:text-white text-lg font-semibold mb-3">Pending</Text>
          <View className="gap-3">
            {pendingReviews.map((review) => (
              <Pressable
                key={review.id}
                onPress={() => {
                  setSelectedReview(review);
                  setShowReviewModal(true);
                }}
                className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 border-2 border-yellow-500/30 active:opacity-70"
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
                    <Text className="text-gray-900 dark:text-white font-semibold text-base mb-1">
                      {review.task?.title || 'Task'}
                    </Text>
                    {review.task?.description && (
                      <Text className="text-gray-600 dark:text-slate-400 text-sm" numberOfLines={2}>
                        {review.task.description}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Review Meta */}
                <View className="flex-row items-center justify-between pt-3 border-t border-gray-300 dark:border-slate-800">
                  <View className="flex-row items-center gap-3">
                    <Text className="text-gray-600 dark:text-slate-400 text-xs">
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
          <Text className="text-gray-900 dark:text-white text-lg font-semibold mb-3">Completed</Text>
          <View className="gap-3">
            {completedReviews.map((review) => {
              const isApproved = review.status === 'approved';

              return (
                <View
                  key={review.id}
                  className={`bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 border ${
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
                      <Text className="text-gray-900 dark:text-white font-semibold text-base mb-1">
                        {review.task?.title || 'Task'}
                      </Text>
                      {review.notes && (
                        <View className="mt-2 bg-gray-200 dark:bg-slate-800 rounded-lg p-3">
                          <Text className="text-gray-700 dark:text-slate-300 text-sm">{review.notes}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Review Meta */}
                  <View className="flex-row items-center gap-3 pt-3 border-t border-gray-300 dark:border-slate-800">
                    {review.reviewer && (
                      <>
                        <View className="flex-row items-center">
                          <View className="w-6 h-6 bg-purple-500 rounded-full items-center justify-center mr-2">
                            <Text className="text-gray-900 dark:text-white text-xs font-semibold">
                              {review.reviewer.name.charAt(0)}
                            </Text>
                          </View>
                          <Text className="text-gray-600 dark:text-slate-400 text-xs">{review.reviewer.name}</Text>
                        </View>
                        <Text className="text-gray-700 dark:text-slate-600">•</Text>
                      </>
                    )}
                    <Text className="text-gray-600 dark:text-slate-400 text-xs">
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
      <Modal visible={showReviewModal} transparent animationType="slide" onRequestClose={() => setShowReviewModal(false)}>
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-gray-100 dark:bg-slate-900 rounded-t-3xl" style={{ maxHeight: '90%', minHeight: '60%' }}>
            {/* Fixed Header */}
            <View className="px-6 pt-6 pb-4 border-b border-gray-300 dark:border-slate-800 flex-row items-center justify-between">
              <Text className="text-gray-900 dark:text-white text-xl font-bold">Review Task</Text>
              <Pressable onPress={() => setShowReviewModal(false)}>
                <X size={24} color="#94a3b8" />
              </Pressable>
            </View>

            {/* Scrollable Content */}
            <ScrollView showsVerticalScrollIndicator={true} bounces={false} className="flex-1">
              {selectedReview && (
                <View className="p-6">
                  <View className="mb-4">
                    <Text className="text-gray-900 dark:text-white font-semibold text-lg mb-2">
                      {selectedReview.task?.title}
                    </Text>
                    {selectedReview.task?.description && (
                      <Text className="text-gray-600 dark:text-slate-400 text-sm">{selectedReview.task.description}</Text>
                    )}
                  </View>

                  {/* Notes Input */}
                  <View className="mb-6">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">Review Notes (Optional)</Text>
                    <TextInput
                      className="bg-gray-200 dark:bg-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-base min-h-[100px]"
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
                      className="bg-green-500 rounded-xl py-4 flex-row items-center justify-center active:opacity-70"
                    >
                      <ThumbsUp size={20} color="white" />
                      <Text className="text-gray-900 dark:text-white font-bold ml-2 text-base">Approve</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => handleSubmitReview('changes_requested')}
                      disabled={submitReviewMutation.isPending}
                      className="bg-red-500 rounded-xl py-4 flex-row items-center justify-center active:opacity-70"
                    >
                      <XCircle size={20} color="white" />
                      <Text className="text-gray-900 dark:text-white font-bold ml-2 text-base">Request Changes</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setShowReviewModal(false)}
                      className="bg-gray-200 dark:bg-slate-800 rounded-xl py-3 items-center active:opacity-70"
                    >
                      <Text className="text-gray-600 dark:text-slate-400 font-semibold">Cancel</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
