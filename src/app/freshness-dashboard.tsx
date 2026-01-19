/**
 * Freshness Dashboard Admin Screen
 *
 * Displays:
 * - Stale entries count by org type
 * - Recent verification jobs
 * - Review queue with approve/reject buttons
 * - Ability to trigger manual verification runs
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  Play,
  Pause,
} from 'lucide-react-native';

// ============================================================================
// TYPES
// ============================================================================

interface FreshnessStats {
  org_type: string;
  total_count: number;
  fresh_count: number;
  stale_count: number;
  unknown_count: number;
  pending_reviews: number;
  avg_confidence: number;
}

interface FreshnessJob {
  id: string;
  scope: string;
  frequency: string;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  entities_checked: number;
  changes_detected: number;
  review_items_created: number;
  errors_count: number;
}

interface ReviewItem {
  id: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  change_type: string;
  change_summary: string;
  proposed_changes_json: Record<string, unknown>;
  evidence_url: string | null;
  confidence_score: number;
  priority: string;
  status: string;
  created_at: string;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function fetchFreshnessData(): Promise<{
  recent_jobs: FreshnessJob[];
  pending_reviews: number;
  stats: FreshnessStats[];
}> {
  const response = await fetch('/api/freshness/run');
  if (!response.ok) {
    throw new Error('Failed to fetch freshness data');
  }
  return response.json();
}

async function fetchReviews(status = 'pending'): Promise<{ reviews: ReviewItem[] }> {
  const response = await fetch(`/api/freshness/reviews?status=${status}&limit=20`);
  if (!response.ok) {
    throw new Error('Failed to fetch reviews');
  }
  return response.json();
}

async function triggerJob(options: {
  scope?: string;
  max_urls?: number;
  dry_run?: boolean;
}): Promise<{ success: boolean; job_id?: string; error?: string }> {
  const response = await fetch('/api/freshness/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });
  return response.json();
}

async function processReview(
  reviewId: string,
  action: 'approve' | 'reject' | 'defer',
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const response = await fetch('/api/freshness/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      review_id: reviewId,
      action,
      review_notes: notes,
    }),
  });
  return response.json();
}

// ============================================================================
// COMPONENTS
// ============================================================================

function StatCard({
  label,
  value,
  subValue,
  color = 'text-zinc-100',
}: {
  label: string;
  value: string | number;
  subValue?: string;
  color?: string;
}) {
  return (
    <View className="bg-zinc-800/50 rounded-xl p-4 flex-1 min-w-[140px]">
      <Text className="text-zinc-400 text-xs mb-1">{label}</Text>
      <Text className={`text-2xl font-bold ${color}`}>{value}</Text>
      {subValue && <Text className="text-zinc-500 text-xs mt-1">{subValue}</Text>}
    </View>
  );
}

function OrgTypeRow({ stat }: { stat: FreshnessStats }) {
  const freshPercent =
    stat.total_count > 0 ? Math.round((stat.fresh_count / stat.total_count) * 100) : 0;

  return (
    <View className="flex-row items-center justify-between py-3 border-b border-zinc-800">
      <View className="flex-1">
        <Text className="text-zinc-100 font-medium">{stat.org_type}</Text>
        <Text className="text-zinc-500 text-xs">
          {stat.total_count} total | {stat.stale_count} stale
        </Text>
      </View>
      <View className="flex-row items-center gap-3">
        <View className="items-end">
          <Text className="text-zinc-400 text-sm">{freshPercent}% fresh</Text>
          <Text className="text-zinc-500 text-xs">avg {stat.avg_confidence}% conf</Text>
        </View>
        {stat.pending_reviews > 0 && (
          <View className="bg-amber-500/20 px-2 py-1 rounded-full">
            <Text className="text-amber-400 text-xs font-medium">{stat.pending_reviews}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function JobRow({ job }: { job: FreshnessJob }) {
  const statusColor =
    job.status === 'done'
      ? 'text-green-400'
      : job.status === 'running'
        ? 'text-blue-400'
        : job.status === 'failed'
          ? 'text-red-400'
          : 'text-zinc-400';

  const StatusIcon =
    job.status === 'done'
      ? CheckCircle
      : job.status === 'running'
        ? RefreshCw
        : job.status === 'failed'
          ? XCircle
          : Clock;

  const startedAt = job.started_at ? new Date(job.started_at).toLocaleString('en-GB') : 'N/A';

  return (
    <View className="flex-row items-center justify-between py-3 border-b border-zinc-800">
      <View className="flex-row items-center gap-3 flex-1">
        <StatusIcon size={18} className={statusColor} />
        <View>
          <Text className="text-zinc-100 font-medium">
            {job.scope} / {job.frequency}
          </Text>
          <Text className="text-zinc-500 text-xs">{startedAt}</Text>
        </View>
      </View>
      <View className="items-end">
        <Text className="text-zinc-400 text-sm">{job.entities_checked} checked</Text>
        <Text className="text-zinc-500 text-xs">
          {job.changes_detected} changes | {job.errors_count} errors
        </Text>
      </View>
    </View>
  );
}

function ReviewCard({
  review,
  onApprove,
  onReject,
  isProcessing,
}: {
  review: ReviewItem;
  onApprove: () => void;
  onReject: () => void;
  isProcessing: boolean;
}) {
  const priorityColor =
    review.priority === 'urgent'
      ? 'bg-red-500/20 text-red-400'
      : review.priority === 'high'
        ? 'bg-amber-500/20 text-amber-400'
        : review.priority === 'normal'
          ? 'bg-blue-500/20 text-blue-400'
          : 'bg-zinc-700/50 text-zinc-400';

  const changeTypeLabel =
    review.change_type === 'contact_changed'
      ? 'Contact Changed'
      : review.change_type === 'portfolio_changed'
        ? 'Portfolio Updated'
        : review.change_type === 'tags_changed'
          ? 'Tags Changed'
          : review.change_type === 'confidence_dropped'
            ? 'Confidence Drop'
            : review.change_type === 'not_found'
              ? 'Not Found'
              : 'Needs Review';

  return (
    <View className="bg-zinc-800/50 rounded-xl p-4 mb-3">
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <Text className="text-zinc-100 font-semibold text-base" numberOfLines={1}>
            {review.entity_name}
          </Text>
          <View className="flex-row items-center gap-2 mt-1">
            <View className={`px-2 py-0.5 rounded-full ${priorityColor}`}>
              <Text className="text-xs font-medium">{review.priority}</Text>
            </View>
            <Text className="text-zinc-500 text-xs">{review.entity_type}</Text>
          </View>
        </View>
        <View className="items-end">
          <Text className="text-zinc-400 text-sm">{review.confidence_score}%</Text>
          <Text className="text-zinc-500 text-xs">{changeTypeLabel}</Text>
        </View>
      </View>

      <Text className="text-zinc-400 text-sm mb-3" numberOfLines={3}>
        {review.change_summary}
      </Text>

      {review.evidence_url && (
        <Text className="text-blue-400 text-xs mb-3" numberOfLines={1}>
          {review.evidence_url}
        </Text>
      )}

      <View className="flex-row gap-2">
        <Pressable
          className="flex-1 bg-green-600/20 border border-green-600/50 rounded-lg py-2.5 items-center"
          onPress={onApprove}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#22c55e" />
          ) : (
            <Text className="text-green-400 font-medium">Approve</Text>
          )}
        </Pressable>
        <Pressable
          className="flex-1 bg-red-600/20 border border-red-600/50 rounded-lg py-2.5 items-center"
          onPress={onReject}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#ef4444" />
          ) : (
            <Text className="text-red-400 font-medium">Reject</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

// ============================================================================
// MAIN SCREEN
// ============================================================================

export default function FreshnessDashboardScreen() {
  const queryClient = useQueryClient();
  const [processingReviewId, setProcessingReviewId] = useState<string | null>(null);

  // Fetch data
  const {
    data: freshnessData,
    isLoading: isLoadingData,
    refetch: refetchData,
  } = useQuery({
    queryKey: ['freshness-data'],
    queryFn: fetchFreshnessData,
    refetchInterval: 30000, // Refresh every 30s
  });

  const {
    data: reviewsData,
    isLoading: isLoadingReviews,
    refetch: refetchReviews,
  } = useQuery({
    queryKey: ['freshness-reviews'],
    queryFn: () => fetchReviews('pending'),
    refetchInterval: 30000,
  });

  // Mutations
  const triggerJobMutation = useMutation({
    mutationFn: triggerJob,
    onSuccess: (data) => {
      if (data.success) {
        Alert.alert('Job Started', `Job ID: ${data.job_id?.substring(0, 8)}...`);
        queryClient.invalidateQueries({ queryKey: ['freshness-data'] });
      } else {
        Alert.alert('Error', data.error || 'Failed to start job');
      }
    },
    onError: (error) => {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
    },
  });

  const processReviewMutation = useMutation({
    mutationFn: ({ reviewId, action }: { reviewId: string; action: 'approve' | 'reject' }) =>
      processReview(reviewId, action),
    onSuccess: () => {
      setProcessingReviewId(null);
      queryClient.invalidateQueries({ queryKey: ['freshness-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['freshness-data'] });
    },
    onError: (error) => {
      setProcessingReviewId(null);
      Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
    },
  });

  const handleRefresh = useCallback(() => {
    refetchData();
    refetchReviews();
  }, [refetchData, refetchReviews]);

  const { mutate: triggerJobMutate, isPending: isTriggerPending } = triggerJobMutation;
  const { mutate: processReviewMutate } = processReviewMutation;

  const handleTriggerJob = useCallback(
    (dryRun = false) => {
      Alert.alert(
        dryRun ? 'Dry Run' : 'Start Verification Job',
        dryRun
          ? 'This will simulate a verification run without making changes.'
          : 'This will start a verification job for curated marketplace entries.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Start',
            onPress: () =>
              triggerJobMutate({
                scope: 'curated',
                max_urls: 50,
                dry_run: dryRun,
              }),
          },
        ]
      );
    },
    [triggerJobMutate]
  );

  const handleApprove = useCallback(
    (reviewId: string) => {
      setProcessingReviewId(reviewId);
      processReviewMutate({ reviewId, action: 'approve' });
    },
    [processReviewMutate]
  );

  const handleReject = useCallback(
    (reviewId: string) => {
      setProcessingReviewId(reviewId);
      processReviewMutate({ reviewId, action: 'reject' });
    },
    [processReviewMutate]
  );

  const stats = freshnessData?.stats || [];
  const recentJobs = freshnessData?.recent_jobs || [];
  const pendingReviews = freshnessData?.pending_reviews || 0;
  const reviews = reviewsData?.reviews || [];

  const totalStale = stats.reduce((sum, s) => sum + s.stale_count, 0);
  const totalEntities = stats.reduce((sum, s) => sum + s.total_count, 0);
  const avgConfidence =
    stats.length > 0 ? Math.round(stats.reduce((sum, s) => sum + s.avg_confidence, 0) / stats.length) : 0;

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top']}>
      <Stack.Screen
        options={{
          title: 'Freshness Dashboard',
          headerStyle: { backgroundColor: '#09090b' },
          headerTintColor: '#f4f4f5',
        }}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingData || isLoadingReviews}
            onRefresh={handleRefresh}
            tintColor="#71717a"
          />
        }
      >
        {/* Header Stats */}
        <View className="flex-row gap-3 mb-6">
          <StatCard
            label="Total Entries"
            value={totalEntities}
            subValue={`${totalStale} stale`}
          />
          <StatCard
            label="Pending Reviews"
            value={pendingReviews}
            color={pendingReviews > 0 ? 'text-amber-400' : 'text-zinc-100'}
          />
          <StatCard label="Avg Confidence" value={`${avgConfidence}%`} />
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-3 mb-6">
          <Pressable
            className="flex-1 bg-blue-600 rounded-xl py-3.5 flex-row items-center justify-center gap-2"
            onPress={() => handleTriggerJob(false)}
            disabled={isTriggerPending}
          >
            {isTriggerPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Play size={18} color="#fff" />
                <Text className="text-white font-semibold">Run Verification</Text>
              </>
            )}
          </Pressable>
          <Pressable
            className="bg-zinc-800 rounded-xl py-3.5 px-4 flex-row items-center justify-center gap-2"
            onPress={() => handleTriggerJob(true)}
            disabled={isTriggerPending}
          >
            <Pause size={18} color="#a1a1aa" />
            <Text className="text-zinc-400 font-medium">Dry Run</Text>
          </Pressable>
        </View>

        {/* Stats by Org Type */}
        <View className="mb-6">
          <Text className="text-zinc-100 text-lg font-semibold mb-3">By Organization Type</Text>
          <View className="bg-zinc-900/50 rounded-xl p-4">
            {stats.length > 0 ? (
              stats.map((stat) => <OrgTypeRow key={stat.org_type} stat={stat} />)
            ) : (
              <Text className="text-zinc-500 text-center py-4">No data available</Text>
            )}
          </View>
        </View>

        {/* Recent Jobs */}
        <View className="mb-6">
          <Text className="text-zinc-100 text-lg font-semibold mb-3">Recent Jobs</Text>
          <View className="bg-zinc-900/50 rounded-xl p-4">
            {recentJobs.length > 0 ? (
              recentJobs.slice(0, 5).map((job) => <JobRow key={job.id} job={job} />)
            ) : (
              <Text className="text-zinc-500 text-center py-4">No jobs run yet</Text>
            )}
          </View>
        </View>

        {/* Review Queue */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-zinc-100 text-lg font-semibold">Review Queue</Text>
            {pendingReviews > 0 && (
              <View className="bg-amber-500/20 px-3 py-1 rounded-full">
                <Text className="text-amber-400 font-medium">{pendingReviews} pending</Text>
              </View>
            )}
          </View>

          {reviews.length > 0 ? (
            reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onApprove={() => handleApprove(review.id)}
                onReject={() => handleReject(review.id)}
                isProcessing={processingReviewId === review.id}
              />
            ))
          ) : (
            <View className="bg-zinc-900/50 rounded-xl p-8 items-center">
              <CheckCircle size={32} color="#22c55e" />
              <Text className="text-zinc-400 mt-3">No pending reviews</Text>
              <Text className="text-zinc-500 text-sm mt-1">All marketplace data is up to date</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
