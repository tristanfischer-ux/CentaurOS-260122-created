import { View, Text, ScrollView, Pressable, Modal } from 'react-native';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Clock,
  DollarSign,
  PlayCircle,
  PauseCircle,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Plus,
  GripVertical,
  Layers,
  Target,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Stores
import { useQueueStore, type QueueItem, type QueueItemStatus } from '@/lib/state/okr-queue-store';
import { useOKRStore } from '@/lib/state/okr-store';
import { useFinanceStore } from '@/lib/state/finance-store';
import { useCurrentWorkspace } from '@/lib/state/app-store';

const DEFAULT_WORKSPACE_ID = 'workspace-demo-company';

export default function BuildQueueScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const currentWorkspace = useCurrentWorkspace();
  const workspaceId = currentWorkspace?.id ?? DEFAULT_WORKSPACE_ID;

  // Stores - use primitive selectors to avoid re-renders
  const queueItems = useQueueStore((s) => s.items.filter((i) => i.workspaceId === workspaceId));
  const startOKR = useQueueStore((s) => s.startOKR);
  const pauseOKR = useQueueStore((s) => s.pauseOKR);
  const completeOKR = useQueueStore((s) => s.completeOKR);
  const removeFromQueue = useQueueStore((s) => s.removeFromQueue);
  const initializeQueue = useQueueStore((s) => s.initializeQueue);

  const okrs = useOKRStore((s) => s.okrs);
  const initializeFinance = useFinanceStore((s) => s.initializeFinance);

  // Get finance snapshot for memoized data access
  const financeSnapshots = useFinanceStore((s) => s.snapshots);
  const snapshot = useMemo(() =>
    financeSnapshots.find((s) => s.workspaceId === workspaceId),
    [financeSnapshots, workspaceId]
  );
  const runway = snapshot?.runwayWeeks ?? 0;

  // State
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Initialize stores
  useEffect(() => {
    initializeQueue();
    initializeFinance();
  }, []);

  // Calculate summary from queueItems
  const summary = useMemo(() => {
    const inProgress = queueItems.filter(i => i.status === 'in_progress').length;
    const queued = queueItems.filter(i => i.status === 'queued').length;
    const blocked = queueItems.filter(i => i.status === 'blocked').length;
    const completed = queueItems.filter(i => i.status === 'completed').length;
    const totalEtaWeeks = queueItems.reduce((sum, i) => sum + (i.totalEtaWeeks ?? 0), 0);
    const totalBurnGBP = queueItems.reduce((sum, i) => sum + (i.burnPerWeekGBP ?? 0), 0);
    const totalCostGBP = queueItems.reduce((sum, i) => sum + (i.totalCostGBP ?? 0), 0);

    return {
      totalOKRs: queueItems.length,
      inProgress,
      queued,
      blocked,
      completed,
      totalEtaWeeks,
      totalBurnGBP,
      totalCostGBP,
      runwayImpactWeeks: runway > 0 ? Math.round(totalCostGBP / ((snapshot?.weeklyBurnGBP ?? 1) * runway) * 100) / 100 : 0,
    };
  }, [queueItems, runway, snapshot?.weeklyBurnGBP]);

  // Group items by lane
  const itemsByLane = useMemo(() => {
    const grouped = new Map<string, QueueItem[]>();
    for (const item of queueItems) {
      const existing = grouped.get(item.lane) ?? [];
      existing.push(item);
      grouped.set(item.lane, existing);
    }
    return grouped;
  }, [queueItems]);

  // Get OKRs not in queue
  const okrsNotInQueue = useMemo(() => {
    const queuedOkrIds = new Set(queueItems.map((i) => i.okrId));
    return okrs.filter((o) => !queuedOkrIds.has(o.id) && o.workspaceId === workspaceId);
  }, [okrs, queueItems, workspaceId]);

  const getStatusIcon = (status: QueueItemStatus) => {
    switch (status) {
      case 'in_progress':
        return <PlayCircle size={18} color="#22c55e" />;
      case 'paused':
        return <PauseCircle size={18} color="#f59e0b" />;
      case 'completed':
        return <CheckCircle size={18} color="#3b82f6" />;
      case 'blocked':
        return <AlertTriangle size={18} color="#ef4444" />;
      default:
        return <Clock size={18} color="#64748b" />;
    }
  };

  const getStatusColor = (status: QueueItemStatus) => {
    switch (status) {
      case 'in_progress':
        return 'border-emerald-500 bg-emerald-500/10';
      case 'paused':
        return 'border-amber-500 bg-amber-500/10';
      case 'completed':
        return 'border-blue-500 bg-blue-500/10';
      case 'blocked':
        return 'border-red-500 bg-red-500/10';
      default:
        return 'border-gray-700 bg-gray-800/50';
    }
  };

  const getLaneColor = (lane: string) => {
    switch (lane) {
      case 'Engineering':
        return '#3b82f6';
      case 'Marketing':
        return '#f59e0b';
      case 'Sales':
        return '#ec4899';
      case 'Finance':
        return '#10b981';
      case 'Ops':
        return '#8b5cf6';
      default:
        return '#64748b';
    }
  };

  const handleAddToQueue = useQueueStore((s) => s.addToQueue);

  const addOKRToQueue = (okr: typeof okrs[0]) => {
    handleAddToQueue({
      workspaceId,
      okrId: okr.id,
      okrTitle: okr.title,
      lane: okr.function,
      priority: queueItems.filter((i) => i.lane === okr.function).length + 1,
      status: 'queued',
      dependencies: [],
      etaWeeksFromStart: 4, // Default estimate
      queuePositionEta: 0,
      totalEtaWeeks: 4,
      burnPerWeekGBP: 5000, // Default estimate
      totalCostGBP: 20000,
    });
    setShowAddModal(false);
  };

  return (
    <View className="flex-1 bg-slate-950">
      {/* Header */}
      <LinearGradient
        colors={['#6366f1', '#8b5cf6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ paddingHorizontal: 20, paddingTop: insets.top + 12, paddingBottom: 16 }}
      >
        <View className="flex-row items-center justify-between mb-3">
          <Pressable onPress={() => router.back()} className="mr-3">
            <ArrowLeft size={24} color="#fff" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-white/70 text-xs font-medium">HOMEWORLD-STYLE</Text>
            <Text className="text-white text-xl font-bold">Build Queue</Text>
          </View>
          <Pressable
            onPress={() => setShowAddModal(true)}
            className="bg-white/20 rounded-xl p-2.5 active:opacity-70"
          >
            <Plus size={20} color="#fff" />
          </Pressable>
        </View>

        {/* Summary Bar */}
        <View className="flex-row justify-between bg-white/10 rounded-xl p-3">
          <View className="items-center">
            <Text className="text-white/70 text-xs">Active</Text>
            <Text className="text-white font-bold text-lg">{summary.inProgress}</Text>
          </View>
          <View className="items-center">
            <Text className="text-white/70 text-xs">Queued</Text>
            <Text className="text-white font-bold text-lg">{summary.queued}</Text>
          </View>
          <View className="items-center">
            <Text className="text-white/70 text-xs">Total ETA</Text>
            <Text className="text-white font-bold text-lg">{summary.totalEtaWeeks}w</Text>
          </View>
          <View className="items-center">
            <Text className="text-white/70 text-xs">Total Cost</Text>
            <Text className="text-white font-bold text-lg">£{(summary.totalCostGBP / 1000).toFixed(0)}K</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView className="flex-1 px-5 py-4" contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>
        {/* Runway Warning */}
        {runway > 0 && summary.totalEtaWeeks > runway * 0.5 && (
          <View className="bg-amber-900/30 border border-amber-500/50 rounded-xl p-4 mb-4">
            <View className="flex-row items-center gap-2 mb-2">
              <AlertTriangle size={18} color="#f59e0b" />
              <Text className="text-amber-400 font-bold">Runway Warning</Text>
            </View>
            <Text className="text-amber-200 text-sm">
              Queue completion ({summary.totalEtaWeeks} weeks) consumes {Math.round((summary.totalEtaWeeks / runway) * 100)}% of runway ({runway} weeks).
            </Text>
          </View>
        )}

        {/* Empty State */}
        {queueItems.length === 0 ? (
          <View className="bg-slate-900 border border-slate-800 rounded-2xl p-8 items-center">
            <Layers size={48} color="#64748b" />
            <Text className="text-white font-bold text-lg mt-4">No OKRs in Queue</Text>
            <Text className="text-slate-400 text-center mt-2">
              Add OKRs to your build queue to plan and track parallel work streams.
            </Text>
            <Pressable
              onPress={() => setShowAddModal(true)}
              className="bg-violet-500 rounded-xl px-6 py-3 mt-4 active:opacity-70"
            >
              <Text className="text-white font-semibold">Add OKR to Queue</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Lanes */}
            {Array.from(itemsByLane.entries()).map(([laneName, items]) => {
              const laneColor = getLaneColor(laneName);
              const activeInLane = items.filter((i) => i.status === 'in_progress').length;

              return (
                <View key={laneName} className="mb-6">
                  {/* Lane Header */}
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center gap-2">
                      <View className="w-3 h-3 rounded-full" style={{ backgroundColor: laneColor }} />
                      <Text className="text-white font-bold text-base">{laneName}</Text>
                      <View className="bg-slate-800 rounded px-2 py-0.5">
                        <Text className="text-slate-400 text-xs">{items.length} OKRs</Text>
                      </View>
                    </View>
                    <Text className="text-slate-500 text-xs">
                      {activeInLane}/1 active
                    </Text>
                  </View>

                  {/* Lane Items */}
                  <View className="gap-2">
                    {items
                      .sort((a, b) => a.priority - b.priority)
                      .map((item, idx) => (
                        <Pressable
                          key={item.id}
                          onPress={() => setSelectedItem(item)}
                          className={`border rounded-xl p-4 ${getStatusColor(item.status)} active:opacity-70`}
                        >
                          <View className="flex-row items-start gap-3">
                            {/* Drag Handle / Priority */}
                            <View className="items-center pt-1">
                              <GripVertical size={16} color="#64748b" />
                              <Text className="text-slate-500 text-xs mt-1">#{item.priority}</Text>
                            </View>

                            {/* Content */}
                            <View className="flex-1">
                              <View className="flex-row items-center justify-between mb-1">
                                <Text className="text-white font-semibold flex-1" numberOfLines={1}>
                                  {item.okrTitle}
                                </Text>
                                {getStatusIcon(item.status)}
                              </View>

                              <View className="flex-row items-center gap-4 mt-2">
                                <View className="flex-row items-center gap-1">
                                  <Clock size={14} color="#64748b" />
                                  <Text className="text-slate-400 text-xs">
                                    {item.queuePositionEta > 0 && `+${item.queuePositionEta}w → `}
                                    {item.etaWeeksFromStart}w
                                  </Text>
                                </View>
                                <View className="flex-row items-center gap-1">
                                  <DollarSign size={14} color="#64748b" />
                                  <Text className="text-slate-400 text-xs">
                                    £{(item.totalCostGBP / 1000).toFixed(0)}K
                                  </Text>
                                </View>
                                {item.dependencies.length > 0 && (
                                  <View className="flex-row items-center gap-1">
                                    <Target size={14} color="#64748b" />
                                    <Text className="text-slate-400 text-xs">
                                      {item.dependencies.length} deps
                                    </Text>
                                  </View>
                                )}
                              </View>
                            </View>

                            <ChevronRight size={18} color="#64748b" />
                          </View>
                        </Pressable>
                      ))}
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* Item Detail Modal */}
      <Modal
        visible={selectedItem !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedItem(null)}
      >
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-slate-900 rounded-t-3xl" style={{ paddingBottom: insets.bottom + 20 }}>
            <View className="px-6 pt-6 pb-4 border-b border-slate-800">
              <View className="flex-row items-center justify-between">
                <Text className="text-white text-xl font-bold">{selectedItem?.okrTitle}</Text>
                <Pressable onPress={() => setSelectedItem(null)} className="p-2">
                  <Text className="text-slate-400">Close</Text>
                </Pressable>
              </View>
            </View>

            <View className="px-6 py-4 gap-4">
              {/* Status */}
              <View className="bg-slate-800 rounded-xl p-4">
                <Text className="text-slate-400 text-sm mb-2">Status</Text>
                <View className="flex-row items-center gap-2">
                  {selectedItem && getStatusIcon(selectedItem.status)}
                  <Text className="text-white font-semibold capitalize">
                    {selectedItem?.status.replace('_', ' ')}
                  </Text>
                </View>
              </View>

              {/* Metrics */}
              <View className="flex-row gap-3">
                <View className="flex-1 bg-slate-800 rounded-xl p-4">
                  <Text className="text-slate-400 text-xs mb-1">Queue Wait</Text>
                  <Text className="text-white font-bold text-lg">
                    {selectedItem?.queuePositionEta ?? 0}w
                  </Text>
                </View>
                <View className="flex-1 bg-slate-800 rounded-xl p-4">
                  <Text className="text-slate-400 text-xs mb-1">Duration</Text>
                  <Text className="text-white font-bold text-lg">
                    {selectedItem?.etaWeeksFromStart ?? 0}w
                  </Text>
                </View>
                <View className="flex-1 bg-slate-800 rounded-xl p-4">
                  <Text className="text-slate-400 text-xs mb-1">Cost</Text>
                  <Text className="text-white font-bold text-lg">
                    £{((selectedItem?.totalCostGBP ?? 0) / 1000).toFixed(0)}K
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <View className="gap-2">
                {selectedItem?.status === 'queued' && (
                  <Pressable
                    onPress={() => {
                      startOKR(selectedItem.id);
                      setSelectedItem(null);
                    }}
                    className="bg-emerald-500 rounded-xl py-3 flex-row items-center justify-center gap-2"
                  >
                    <PlayCircle size={20} color="#fff" />
                    <Text className="text-white font-semibold">Start Work</Text>
                  </Pressable>
                )}

                {selectedItem?.status === 'in_progress' && (
                  <>
                    <Pressable
                      onPress={() => {
                        pauseOKR(selectedItem.id);
                        setSelectedItem(null);
                      }}
                      className="bg-amber-500 rounded-xl py-3 flex-row items-center justify-center gap-2"
                    >
                      <PauseCircle size={20} color="#fff" />
                      <Text className="text-white font-semibold">Pause</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        completeOKR(selectedItem.id);
                        setSelectedItem(null);
                      }}
                      className="bg-blue-500 rounded-xl py-3 flex-row items-center justify-center gap-2"
                    >
                      <CheckCircle size={20} color="#fff" />
                      <Text className="text-white font-semibold">Mark Complete</Text>
                    </Pressable>
                  </>
                )}

                <Pressable
                  onPress={() => {
                    if (selectedItem) {
                      removeFromQueue(selectedItem.id);
                      setSelectedItem(null);
                    }
                  }}
                  className="bg-red-500/20 border border-red-500/50 rounded-xl py-3"
                >
                  <Text className="text-red-400 text-center font-semibold">Remove from Queue</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add OKR Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-slate-900 rounded-t-3xl" style={{ maxHeight: '80%', paddingBottom: insets.bottom + 20 }}>
            <View className="px-6 pt-6 pb-4 border-b border-slate-800">
              <View className="flex-row items-center justify-between">
                <Text className="text-white text-xl font-bold">Add OKR to Queue</Text>
                <Pressable onPress={() => setShowAddModal(false)} className="p-2">
                  <Text className="text-slate-400">Cancel</Text>
                </Pressable>
              </View>
            </View>

            <ScrollView className="px-6 py-4">
              {okrsNotInQueue.length === 0 ? (
                <View className="bg-slate-800 rounded-xl p-6 items-center">
                  <Target size={32} color="#64748b" />
                  <Text className="text-slate-400 text-center mt-3">
                    All OKRs are already in the queue.
                  </Text>
                </View>
              ) : (
                <View className="gap-3">
                  {okrsNotInQueue.map((okr) => (
                    <Pressable
                      key={okr.id}
                      onPress={() => addOKRToQueue(okr)}
                      className="bg-slate-800 border border-slate-700 rounded-xl p-4 active:opacity-70"
                    >
                      <View className="flex-row items-center gap-3">
                        <View
                          className="w-10 h-10 rounded-lg items-center justify-center"
                          style={{ backgroundColor: getLaneColor(okr.function) + '30' }}
                        >
                          <Target size={20} color={getLaneColor(okr.function)} />
                        </View>
                        <View className="flex-1">
                          <Text className="text-white font-semibold">{okr.title}</Text>
                          <Text className="text-slate-400 text-sm">
                            {okr.function} • {okr.owner}
                          </Text>
                        </View>
                        <Plus size={20} color="#8b5cf6" />
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
