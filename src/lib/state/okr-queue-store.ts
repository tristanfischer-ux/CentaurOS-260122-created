/**
 * OKR Queue Store
 * Homeworld-style build queue for OKRs
 *
 * Key concepts:
 * - Multiple "lanes" can run in parallel (based on available functions)
 * - Each lane processes one OKR at a time
 * - Serial dependencies force sequential processing
 * - Parallel work runs simultaneously when no conflicts
 * - Queue position affects ETA calculations
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'okr-queue-store-v1';
const DEFAULT_WORKSPACE_ID = 'workspace-demo-company';

export type QueueItemStatus = 'queued' | 'in_progress' | 'blocked' | 'completed' | 'paused';

export interface QueueItem {
  id: string;
  workspaceId: string;
  okrId: string;
  okrTitle: string;
  planId?: string;
  lane: string; // Function-based lane (e.g., 'Engineering', 'Marketing')
  priority: number; // Lower = higher priority (1 is top)
  status: QueueItemStatus;
  dependencies: string[]; // OKR IDs this depends on
  etaWeeksFromStart: number;
  queuePositionEta: number; // Weeks until this starts (after dependencies)
  totalEtaWeeks: number; // queuePositionEta + etaWeeksFromStart
  burnPerWeekGBP: number;
  totalCostGBP: number;
  addedAt: string;
  startedAt?: string;
  completedAt?: string;
  pausedAt?: string;
}

export interface QueueLane {
  name: string;
  function: string;
  maxParallel: number; // How many OKRs can run in parallel in this lane
  currentItems: string[]; // Currently active QueueItem IDs
  queuedItems: string[]; // Waiting QueueItem IDs in order
}

export interface QueueSummary {
  totalOKRs: number;
  inProgress: number;
  queued: number;
  blocked: number;
  completed: number;
  totalEtaWeeks: number;
  totalBurnGBP: number;
  totalCostGBP: number;
  runwayImpactWeeks: number;
}

interface QueueState {
  items: QueueItem[];
  lanes: QueueLane[];
  isInitialized: boolean;

  // Actions
  initializeQueue: () => Promise<void>;

  // Queue operations
  addToQueue: (item: Omit<QueueItem, 'id' | 'addedAt'>) => void;
  removeFromQueue: (itemId: string) => void;
  reorderQueue: (workspaceId: string, lane: string, newOrder: string[]) => void;
  moveToLane: (itemId: string, newLane: string) => void;

  // Status changes
  startOKR: (itemId: string) => void;
  pauseOKR: (itemId: string) => void;
  resumeOKR: (itemId: string) => void;
  completeOKR: (itemId: string) => void;
  blockOKR: (itemId: string, blockerOkrId: string) => void;
  unblockOKR: (itemId: string) => void;

  // Priority changes
  setPriority: (itemId: string, priority: number) => void;
  promoteToTop: (itemId: string) => void;

  // Dependency management
  addDependency: (itemId: string, dependsOnOkrId: string) => void;
  removeDependency: (itemId: string, dependsOnOkrId: string) => void;

  // Getters
  getQueueByWorkspace: (workspaceId: string) => QueueItem[];
  getQueueByLane: (workspaceId: string, lane: string) => QueueItem[];
  getActiveItems: (workspaceId: string) => QueueItem[];
  getBlockedItems: (workspaceId: string) => QueueItem[];
  getQueueSummary: (workspaceId: string) => QueueSummary;

  // Lane management
  getLanes: (workspaceId: string) => QueueLane[];
  ensureLane: (lane: string, func: string) => void;

  // Calculations
  recalculateETAs: (workspaceId: string) => void;

  // Persistence
  saveToStorage: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

// Default lanes based on business functions
const DEFAULT_LANES: QueueLane[] = [
  { name: 'Engineering', function: 'Engineering', maxParallel: 2, currentItems: [], queuedItems: [] },
  { name: 'Marketing', function: 'Marketing', maxParallel: 1, currentItems: [], queuedItems: [] },
  { name: 'Sales', function: 'Sales', maxParallel: 1, currentItems: [], queuedItems: [] },
  { name: 'Finance', function: 'Finance', maxParallel: 1, currentItems: [], queuedItems: [] },
  { name: 'Ops', function: 'Ops', maxParallel: 1, currentItems: [], queuedItems: [] },
];

export const useQueueStore = create<QueueState>((set, get) => ({
  items: [],
  lanes: DEFAULT_LANES,
  isInitialized: false,

  initializeQueue: async () => {
    await get().loadFromStorage();
    set({ isInitialized: true });
  },

  addToQueue: (itemData) => {
    const newItem: QueueItem = {
      ...itemData,
      id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      addedAt: new Date().toISOString(),
    };

    set((state) => {
      // Find the lane
      const laneIndex = state.lanes.findIndex((l) => l.name === itemData.lane);
      if (laneIndex >= 0) {
        const updatedLanes = [...state.lanes];
        updatedLanes[laneIndex] = {
          ...updatedLanes[laneIndex],
          queuedItems: [...updatedLanes[laneIndex].queuedItems, newItem.id],
        };
        return {
          items: [...state.items, newItem],
          lanes: updatedLanes,
        };
      }
      return { items: [...state.items, newItem] };
    });

    get().recalculateETAs(itemData.workspaceId);
    get().saveToStorage();
  },

  removeFromQueue: (itemId) => {
    set((state) => {
      const item = state.items.find((i) => i.id === itemId);
      if (!item) return state;

      // Remove from lanes
      const updatedLanes = state.lanes.map((lane) => ({
        ...lane,
        currentItems: lane.currentItems.filter((id) => id !== itemId),
        queuedItems: lane.queuedItems.filter((id) => id !== itemId),
      }));

      return {
        items: state.items.filter((i) => i.id !== itemId),
        lanes: updatedLanes,
      };
    });
    get().saveToStorage();
  },

  reorderQueue: (workspaceId, laneName, newOrder) => {
    set((state) => ({
      lanes: state.lanes.map((lane) =>
        lane.name === laneName ? { ...lane, queuedItems: newOrder } : lane
      ),
    }));
    get().recalculateETAs(workspaceId);
    get().saveToStorage();
  },

  moveToLane: (itemId, newLane) => {
    set((state) => {
      const item = state.items.find((i) => i.id === itemId);
      if (!item) return state;

      // Remove from old lane
      const updatedLanes = state.lanes.map((lane) => ({
        ...lane,
        currentItems: lane.currentItems.filter((id) => id !== itemId),
        queuedItems: lane.queuedItems.filter((id) => id !== itemId),
      }));

      // Add to new lane
      const newLaneIndex = updatedLanes.findIndex((l) => l.name === newLane);
      if (newLaneIndex >= 0) {
        updatedLanes[newLaneIndex].queuedItems.push(itemId);
      }

      return {
        items: state.items.map((i) =>
          i.id === itemId ? { ...i, lane: newLane } : i
        ),
        lanes: updatedLanes,
      };
    });
    get().saveToStorage();
  },

  startOKR: (itemId) => {
    set((state) => {
      const item = state.items.find((i) => i.id === itemId);
      if (!item) return state;

      // Move from queued to current in lane
      const updatedLanes = state.lanes.map((lane) => {
        if (lane.name === item.lane) {
          return {
            ...lane,
            queuedItems: lane.queuedItems.filter((id) => id !== itemId),
            currentItems: [...lane.currentItems, itemId],
          };
        }
        return lane;
      });

      return {
        items: state.items.map((i) =>
          i.id === itemId
            ? { ...i, status: 'in_progress' as QueueItemStatus, startedAt: new Date().toISOString() }
            : i
        ),
        lanes: updatedLanes,
      };
    });
    get().saveToStorage();
  },

  pauseOKR: (itemId) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.id === itemId
          ? { ...i, status: 'paused' as QueueItemStatus, pausedAt: new Date().toISOString() }
          : i
      ),
    }));
    get().saveToStorage();
  },

  resumeOKR: (itemId) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.id === itemId
          ? { ...i, status: 'in_progress' as QueueItemStatus, pausedAt: undefined }
          : i
      ),
    }));
    get().saveToStorage();
  },

  completeOKR: (itemId) => {
    set((state) => {
      const item = state.items.find((i) => i.id === itemId);
      if (!item) return state;

      // Remove from current in lane
      const updatedLanes = state.lanes.map((lane) => ({
        ...lane,
        currentItems: lane.currentItems.filter((id) => id !== itemId),
      }));

      return {
        items: state.items.map((i) =>
          i.id === itemId
            ? { ...i, status: 'completed' as QueueItemStatus, completedAt: new Date().toISOString() }
            : i
        ),
        lanes: updatedLanes,
      };
    });

    // Check if completing this unblocks any other items
    const state = get();
    const completedItem = state.items.find((i) => i.id === itemId);
    if (completedItem) {
      state.items
        .filter((i) => i.dependencies.includes(completedItem.okrId) && i.status === 'blocked')
        .forEach((blockedItem) => {
          // Check if all dependencies are now completed
          const allDepsCompleted = blockedItem.dependencies.every((depOkrId) => {
            const depItem = state.items.find((i) => i.okrId === depOkrId);
            return depItem?.status === 'completed';
          });
          if (allDepsCompleted) {
            get().unblockOKR(blockedItem.id);
          }
        });
    }

    get().saveToStorage();
  },

  blockOKR: (itemId, blockerOkrId) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.id === itemId
          ? {
              ...i,
              status: 'blocked' as QueueItemStatus,
              dependencies: [...new Set([...i.dependencies, blockerOkrId])],
            }
          : i
      ),
    }));
    get().saveToStorage();
  },

  unblockOKR: (itemId) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.id === itemId ? { ...i, status: 'queued' as QueueItemStatus } : i
      ),
    }));
    get().saveToStorage();
  },

  setPriority: (itemId, priority) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.id === itemId ? { ...i, priority } : i
      ),
    }));
    get().saveToStorage();
  },

  promoteToTop: (itemId) => {
    set((state) => {
      const item = state.items.find((i) => i.id === itemId);
      if (!item) return state;

      // Find lowest priority in the lane
      const laneItems = state.items.filter(
        (i) => i.lane === item.lane && i.workspaceId === item.workspaceId
      );
      const minPriority = Math.min(...laneItems.map((i) => i.priority), 1);

      return {
        items: state.items.map((i) =>
          i.id === itemId ? { ...i, priority: minPriority - 1 } : i
        ),
      };
    });
    get().saveToStorage();
  },

  addDependency: (itemId, dependsOnOkrId) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.id === itemId
          ? { ...i, dependencies: [...new Set([...i.dependencies, dependsOnOkrId])] }
          : i
      ),
    }));
    get().saveToStorage();
  },

  removeDependency: (itemId, dependsOnOkrId) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.id === itemId
          ? { ...i, dependencies: i.dependencies.filter((d) => d !== dependsOnOkrId) }
          : i
      ),
    }));
    get().saveToStorage();
  },

  getQueueByWorkspace: (workspaceId) => {
    return get().items.filter((i) => i.workspaceId === workspaceId);
  },

  getQueueByLane: (workspaceId, lane) => {
    return get()
      .items.filter((i) => i.workspaceId === workspaceId && i.lane === lane)
      .sort((a, b) => a.priority - b.priority);
  },

  getActiveItems: (workspaceId) => {
    return get().items.filter(
      (i) => i.workspaceId === workspaceId && i.status === 'in_progress'
    );
  },

  getBlockedItems: (workspaceId) => {
    return get().items.filter(
      (i) => i.workspaceId === workspaceId && i.status === 'blocked'
    );
  },

  getQueueSummary: (workspaceId) => {
    const items = get().getQueueByWorkspace(workspaceId);

    const inProgress = items.filter((i) => i.status === 'in_progress');
    const queued = items.filter((i) => i.status === 'queued');
    const blocked = items.filter((i) => i.status === 'blocked');
    const completed = items.filter((i) => i.status === 'completed');

    const activeAndQueued = [...inProgress, ...queued];
    const totalEtaWeeks =
      activeAndQueued.length > 0
        ? Math.max(...activeAndQueued.map((i) => i.totalEtaWeeks))
        : 0;
    const totalBurnGBP = activeAndQueued.reduce((sum, i) => sum + i.burnPerWeekGBP, 0);
    const totalCostGBP = activeAndQueued.reduce((sum, i) => sum + i.totalCostGBP, 0);

    return {
      totalOKRs: items.length,
      inProgress: inProgress.length,
      queued: queued.length,
      blocked: blocked.length,
      completed: completed.length,
      totalEtaWeeks,
      totalBurnGBP,
      totalCostGBP,
      runwayImpactWeeks: totalCostGBP > 0 ? totalEtaWeeks : 0,
    };
  },

  getLanes: (workspaceId) => {
    return get().lanes;
  },

  ensureLane: (laneName, func) => {
    set((state) => {
      const exists = state.lanes.some((l) => l.name === laneName);
      if (exists) return state;

      return {
        lanes: [
          ...state.lanes,
          {
            name: laneName,
            function: func,
            maxParallel: 1,
            currentItems: [],
            queuedItems: [],
          },
        ],
      };
    });
    get().saveToStorage();
  },

  recalculateETAs: (workspaceId) => {
    set((state) => {
      const workspaceItems = state.items.filter(
        (i) => i.workspaceId === workspaceId && i.status !== 'completed'
      );

      // Group by lane
      const byLane = new Map<string, QueueItem[]>();
      for (const item of workspaceItems) {
        const laneItems = byLane.get(item.lane) || [];
        laneItems.push(item);
        byLane.set(item.lane, laneItems);
      }

      // Calculate queue position ETA for each lane
      const updatedItems = state.items.map((item) => {
        if (item.workspaceId !== workspaceId || item.status === 'completed') {
          return item;
        }

        const laneItems = byLane.get(item.lane) || [];
        const sortedLane = laneItems.sort((a, b) => a.priority - b.priority);

        let queuePositionEta = 0;
        for (const queuedItem of sortedLane) {
          if (queuedItem.id === item.id) break;
          if (queuedItem.status === 'in_progress' || queuedItem.status === 'queued') {
            queuePositionEta += queuedItem.etaWeeksFromStart;
          }
        }

        // Add dependency wait time
        let dependencyWait = 0;
        for (const depOkrId of item.dependencies) {
          const depItem = state.items.find((i) => i.okrId === depOkrId);
          if (depItem && depItem.status !== 'completed') {
            dependencyWait = Math.max(dependencyWait, depItem.totalEtaWeeks);
          }
        }

        const totalEtaWeeks = Math.max(queuePositionEta, dependencyWait) + item.etaWeeksFromStart;
        const totalCostGBP = item.burnPerWeekGBP * item.etaWeeksFromStart;

        return {
          ...item,
          queuePositionEta: Math.max(queuePositionEta, dependencyWait),
          totalEtaWeeks,
          totalCostGBP,
        };
      });

      return { items: updatedItems };
    });
  },

  saveToStorage: async () => {
    try {
      const { items, lanes } = get();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ items, lanes }));
    } catch (error) {
      console.error('Failed to save queue store:', error);
    }
  },

  loadFromStorage: async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) {
        const data = JSON.parse(json);
        set({
          items: data.items || [],
          lanes: data.lanes || DEFAULT_LANES,
        });
      }
    } catch (error) {
      console.error('Failed to load queue store:', error);
    }
  },
}));

// Selector hooks
export const useQueueItems = (workspaceId: string) =>
  useQueueStore((s) => s.items.filter((i) => i.workspaceId === workspaceId));

export const useActiveQueueItems = (workspaceId: string) =>
  useQueueStore((s) =>
    s.items.filter((i) => i.workspaceId === workspaceId && i.status === 'in_progress')
  );

export const useQueueSummary = (workspaceId: string) => {
  const items = useQueueStore((s) => s.items.filter((i) => i.workspaceId === workspaceId));
  const inProgress = items.filter((i) => i.status === 'in_progress').length;
  const queued = items.filter((i) => i.status === 'queued').length;
  return { total: items.length, inProgress, queued };
};
