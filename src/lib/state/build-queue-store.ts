/**
 * Build Queue Store
 *
 * Homeworld-style build queue system with time unit (square) allocation
 * 1 Time Unit = 4 hours of focused work
 *
 * Core concepts:
 * - People produce squares (capacity)
 * - Tasks consume squares (effort)
 * - AI can reduce effort and boost throughput
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '@/lib/storage/mmkv-storage';
import type { Function as BusinessFunction } from '@/types';

// ============ TYPES ============

export type AIMode = 'none' | 'assist' | 'heavy' | 'autonomous';
export type Cadence = 'slow' | 'normal' | 'fast' | 'crash';
export type PersonRole = 'Founder' | 'FractionalExec' | 'Apprentice';

export interface PersonCapacity {
  id: string;
  name: string;
  role: PersonRole;
  function: BusinessFunction;
  baseSquaresPerDay: number; // Typical: 2 for apprentice, 1-2 for exec/founder
  variability: [number, number]; // Min-max range, e.g., [1, 3]
  qualityMultiplier: number; // 1.0 = normal, 1.5 = high quality/QA value
  avatarUrl?: string;
}

export interface TaskAssignment {
  personId: string;
  squaresPerDay: number; // How many squares this person contributes
  startDate: string;
}

export interface BuildQueueTask {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  function: BusinessFunction;

  // Effort estimation
  originalSquares: number; // Base effort without AI
  aiAdjustedSquares: number; // Effort after AI reduction
  completedSquares: number; // Progress

  // AI settings
  aiMode: AIMode;
  aiEffortReduction: number; // 0-1, e.g., 0.5 = 50% reduction
  aiThroughputBoost: number; // 1.0 = normal, 1.5 = 50% faster

  // Staffing
  assignments: TaskAssignment[];
  cadence: Cadence;

  // Quality/QA
  requiresQA: boolean;
  qaReviewerId?: string; // Exec/founder who reviews
  qualityConfidence: number; // 0-100%
  reworkRisk: number; // 0-100%

  // Timeline
  createdAt: string;
  startDate?: string;
  predictedEndDate?: string;
  actualEndDate?: string;

  // OKR link
  linkedOKRId?: string;

  // Queue position
  queuePosition: number;
  status: 'queued' | 'in_progress' | 'blocked' | 'completed' | 'paused';

  // Priority
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export interface DailyCapacity {
  date: string;
  totalSquares: number;
  allocatedSquares: number;
  availableSquares: number;
  byRole: {
    Founder: number;
    FractionalExec: number;
    Apprentice: number;
  };
}

interface BuildQueueState {
  tasks: BuildQueueTask[];
  people: PersonCapacity[];

  // Getters
  getTasksByWorkspace: (workspaceId: string) => BuildQueueTask[];
  getQueuedTasks: (workspaceId: string) => BuildQueueTask[];
  getInProgressTasks: (workspaceId: string) => BuildQueueTask[];
  getTaskById: (id: string) => BuildQueueTask | undefined;

  // Capacity calculations
  getPersonCapacity: (personId: string) => PersonCapacity | undefined;
  getTotalDailyCapacity: (workspaceId: string) => DailyCapacity;
  getWeeklyCapacity: (workspaceId: string) => DailyCapacity[];
  getAllocatedSquares: (workspaceId: string, date: string) => number;
  getAvailableSquares: (workspaceId: string, date: string) => number;

  // Timeline predictions
  predictEndDate: (task: BuildQueueTask) => string;
  getDailyBurnRate: (task: BuildQueueTask) => number;

  // Actions
  addTask: (task: Omit<BuildQueueTask, 'id' | 'queuePosition' | 'createdAt' | 'aiAdjustedSquares' | 'qualityConfidence' | 'reworkRisk'>) => string;
  updateTask: (id: string, updates: Partial<BuildQueueTask>) => void;
  deleteTask: (id: string) => void;

  // Queue management
  reorderQueue: (workspaceId: string, taskIds: string[]) => void;
  moveTaskUp: (id: string) => void;
  moveTaskDown: (id: string) => void;

  // Assignment
  assignPerson: (taskId: string, personId: string, squaresPerDay: number) => void;
  unassignPerson: (taskId: string, personId: string) => void;
  updateAssignment: (taskId: string, personId: string, squaresPerDay: number) => void;

  // AI settings
  setAIMode: (taskId: string, mode: AIMode) => void;

  // Progress
  addProgress: (taskId: string, squares: number) => void;
  completeTask: (taskId: string) => void;

  // People management
  addPerson: (person: Omit<PersonCapacity, 'id'>) => string;
  updatePerson: (id: string, updates: Partial<PersonCapacity>) => void;

  // Initialization
  seedDemoData: (workspaceId: string) => void;
}

// ============ HELPERS ============

const calculateAIReduction = (mode: AIMode): number => {
  switch (mode) {
    case 'none': return 0;
    case 'assist': return 0.2; // 20% reduction
    case 'heavy': return 0.4; // 40% reduction
    case 'autonomous': return 0.6; // 60% reduction
    default: return 0;
  }
};

const calculateAIThroughputBoost = (mode: AIMode): number => {
  switch (mode) {
    case 'none': return 1.0;
    case 'assist': return 1.2;
    case 'heavy': return 1.5;
    case 'autonomous': return 2.0;
    default: return 1.0;
  }
};

const calculateQualityConfidence = (task: BuildQueueTask, people: PersonCapacity[]): number => {
  let confidence = 50; // Base confidence

  // Add confidence for senior reviewers
  if (task.qaReviewerId) {
    const reviewer = people.find(p => p.id === task.qaReviewerId);
    if (reviewer?.role === 'Founder') confidence += 30;
    else if (reviewer?.role === 'FractionalExec') confidence += 20;
  }

  // Check assigned people
  const assignedPeople = task.assignments.map(a =>
    people.find(p => p.id === a.personId)
  ).filter(Boolean) as PersonCapacity[];

  const hasSenior = assignedPeople.some(p =>
    p.role === 'Founder' || p.role === 'FractionalExec'
  );
  if (hasSenior) confidence += 15;

  // AI mode affects confidence
  if (task.aiMode === 'autonomous' && !task.qaReviewerId) {
    confidence -= 20; // Risk flag
  }

  return Math.min(100, Math.max(0, confidence));
};

const calculateReworkRisk = (task: BuildQueueTask, people: PersonCapacity[]): number => {
  let risk = 20; // Base risk

  // Higher AI modes without QA increase risk
  if (task.aiMode === 'heavy' && !task.qaReviewerId) risk += 15;
  if (task.aiMode === 'autonomous' && !task.qaReviewerId) risk += 30;

  // Senior involvement reduces risk
  const assignedPeople = task.assignments.map(a =>
    people.find(p => p.id === a.personId)
  ).filter(Boolean) as PersonCapacity[];

  if (assignedPeople.some(p => p.role === 'Founder')) risk -= 15;
  if (assignedPeople.some(p => p.role === 'FractionalExec')) risk -= 10;

  return Math.min(100, Math.max(0, risk));
};

// ============ STORE ============

export const useBuildQueueStore = create<BuildQueueState>()(
  persist(
    (set, get) => ({
      tasks: [],
      people: [],

      // Getters
      getTasksByWorkspace: (workspaceId: string) => {
        return get().tasks
          .filter(t => t.workspaceId === workspaceId)
          .sort((a, b) => a.queuePosition - b.queuePosition);
      },

      getQueuedTasks: (workspaceId: string) => {
        return get().getTasksByWorkspace(workspaceId)
          .filter(t => t.status === 'queued' || t.status === 'in_progress');
      },

      getInProgressTasks: (workspaceId: string) => {
        return get().getTasksByWorkspace(workspaceId)
          .filter(t => t.status === 'in_progress');
      },

      getTaskById: (id: string) => {
        return get().tasks.find(t => t.id === id);
      },

      getPersonCapacity: (personId: string) => {
        return get().people.find(p => p.id === personId);
      },

      getTotalDailyCapacity: (workspaceId: string) => {
        const people = get().people;
        const today = new Date().toISOString().split('T')[0];

        const byRole = {
          Founder: 0,
          FractionalExec: 0,
          Apprentice: 0,
        };

        let totalSquares = 0;
        people.forEach(p => {
          byRole[p.role] += p.baseSquaresPerDay;
          totalSquares += p.baseSquaresPerDay;
        });

        const allocatedSquares = get().getAllocatedSquares(workspaceId, today);

        return {
          date: today,
          totalSquares,
          allocatedSquares,
          availableSquares: totalSquares - allocatedSquares,
          byRole,
        };
      },

      getWeeklyCapacity: (workspaceId: string) => {
        const days: DailyCapacity[] = [];
        const today = new Date();

        for (let i = 0; i < 7; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() + i);
          const dateStr = date.toISOString().split('T')[0];

          const dailyCap = get().getTotalDailyCapacity(workspaceId);
          const allocated = get().getAllocatedSquares(workspaceId, dateStr);

          days.push({
            ...dailyCap,
            date: dateStr,
            allocatedSquares: allocated,
            availableSquares: dailyCap.totalSquares - allocated,
          });
        }

        return days;
      },

      getAllocatedSquares: (workspaceId: string, date: string) => {
        const tasks = get().getInProgressTasks(workspaceId);
        let total = 0;

        tasks.forEach(task => {
          task.assignments.forEach(a => {
            total += a.squaresPerDay;
          });
        });

        return total;
      },

      getAvailableSquares: (workspaceId: string, date: string) => {
        const total = get().getTotalDailyCapacity(workspaceId).totalSquares;
        const allocated = get().getAllocatedSquares(workspaceId, date);
        return Math.max(0, total - allocated);
      },

      predictEndDate: (task: BuildQueueTask) => {
        const remainingSquares = task.aiAdjustedSquares - task.completedSquares;
        const dailyBurnRate = get().getDailyBurnRate(task);

        if (dailyBurnRate <= 0) {
          // No assignments, return far future date
          const farFuture = new Date();
          farFuture.setFullYear(farFuture.getFullYear() + 1);
          return farFuture.toISOString();
        }

        const daysRemaining = Math.ceil(remainingSquares / dailyBurnRate);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + daysRemaining);

        return endDate.toISOString();
      },

      getDailyBurnRate: (task: BuildQueueTask) => {
        let baseRate = task.assignments.reduce((sum, a) => sum + a.squaresPerDay, 0);

        // Apply AI throughput boost
        baseRate *= task.aiThroughputBoost;

        // Apply cadence modifier
        switch (task.cadence) {
          case 'slow': return baseRate * 0.5;
          case 'normal': return baseRate;
          case 'fast': return baseRate * 1.5;
          case 'crash': return baseRate * 2;
          default: return baseRate;
        }
      },

      // Actions
      addTask: (taskData) => {
        const id = `task-${Date.now()}`;
        const tasks = get().tasks;
        const maxPosition = tasks.length > 0
          ? Math.max(...tasks.map(t => t.queuePosition))
          : 0;

        const aiReduction = calculateAIReduction(taskData.aiMode);
        const aiAdjustedSquares = Math.ceil(taskData.originalSquares * (1 - aiReduction));

        const newTask: BuildQueueTask = {
          ...taskData,
          id,
          queuePosition: maxPosition + 1,
          createdAt: new Date().toISOString(),
          aiAdjustedSquares,
          aiEffortReduction: aiReduction,
          aiThroughputBoost: calculateAIThroughputBoost(taskData.aiMode),
          qualityConfidence: 50,
          reworkRisk: 20,
        };

        // Calculate quality metrics
        newTask.qualityConfidence = calculateQualityConfidence(newTask, get().people);
        newTask.reworkRisk = calculateReworkRisk(newTask, get().people);

        set(state => ({ tasks: [...state.tasks, newTask] }));
        return id;
      },

      updateTask: (id, updates) => {
        set(state => ({
          tasks: state.tasks.map(t => {
            if (t.id !== id) return t;

            const updated = { ...t, ...updates };

            // Recalculate AI-adjusted values if AI mode changed
            if (updates.aiMode !== undefined) {
              const reduction = calculateAIReduction(updates.aiMode);
              updated.aiEffortReduction = reduction;
              updated.aiAdjustedSquares = Math.ceil(t.originalSquares * (1 - reduction));
              updated.aiThroughputBoost = calculateAIThroughputBoost(updates.aiMode);
            }

            // Recalculate quality metrics
            updated.qualityConfidence = calculateQualityConfidence(updated, state.people);
            updated.reworkRisk = calculateReworkRisk(updated, state.people);

            return updated;
          }),
        }));
      },

      deleteTask: (id) => {
        set(state => ({
          tasks: state.tasks.filter(t => t.id !== id),
        }));
      },

      reorderQueue: (workspaceId, taskIds) => {
        set(state => ({
          tasks: state.tasks.map(t => {
            if (t.workspaceId !== workspaceId) return t;
            const newPosition = taskIds.indexOf(t.id);
            if (newPosition === -1) return t;
            return { ...t, queuePosition: newPosition };
          }),
        }));
      },

      moveTaskUp: (id) => {
        const task = get().getTaskById(id);
        if (!task || task.queuePosition === 0) return;

        const tasks = get().getTasksByWorkspace(task.workspaceId);
        const taskAbove = tasks.find(t => t.queuePosition === task.queuePosition - 1);

        if (taskAbove) {
          set(state => ({
            tasks: state.tasks.map(t => {
              if (t.id === id) return { ...t, queuePosition: t.queuePosition - 1 };
              if (t.id === taskAbove.id) return { ...t, queuePosition: t.queuePosition + 1 };
              return t;
            }),
          }));
        }
      },

      moveTaskDown: (id) => {
        const task = get().getTaskById(id);
        if (!task) return;

        const tasks = get().getTasksByWorkspace(task.workspaceId);
        const taskBelow = tasks.find(t => t.queuePosition === task.queuePosition + 1);

        if (taskBelow) {
          set(state => ({
            tasks: state.tasks.map(t => {
              if (t.id === id) return { ...t, queuePosition: t.queuePosition + 1 };
              if (t.id === taskBelow.id) return { ...t, queuePosition: t.queuePosition - 1 };
              return t;
            }),
          }));
        }
      },

      assignPerson: (taskId, personId, squaresPerDay) => {
        set(state => ({
          tasks: state.tasks.map(t => {
            if (t.id !== taskId) return t;

            // Check if already assigned
            if (t.assignments.some(a => a.personId === personId)) return t;

            const updated = {
              ...t,
              assignments: [
                ...t.assignments,
                { personId, squaresPerDay, startDate: new Date().toISOString() },
              ],
            };

            // Recalculate quality
            updated.qualityConfidence = calculateQualityConfidence(updated, state.people);
            updated.reworkRisk = calculateReworkRisk(updated, state.people);

            return updated;
          }),
        }));
      },

      unassignPerson: (taskId, personId) => {
        set(state => ({
          tasks: state.tasks.map(t => {
            if (t.id !== taskId) return t;

            const updated = {
              ...t,
              assignments: t.assignments.filter(a => a.personId !== personId),
            };

            // Recalculate quality
            updated.qualityConfidence = calculateQualityConfidence(updated, state.people);
            updated.reworkRisk = calculateReworkRisk(updated, state.people);

            return updated;
          }),
        }));
      },

      updateAssignment: (taskId, personId, squaresPerDay) => {
        set(state => ({
          tasks: state.tasks.map(t => {
            if (t.id !== taskId) return t;

            return {
              ...t,
              assignments: t.assignments.map(a =>
                a.personId === personId ? { ...a, squaresPerDay } : a
              ),
            };
          }),
        }));
      },

      setAIMode: (taskId, mode) => {
        get().updateTask(taskId, { aiMode: mode });
      },

      addProgress: (taskId, squares) => {
        set(state => ({
          tasks: state.tasks.map(t => {
            if (t.id !== taskId) return t;

            const newCompleted = Math.min(
              t.aiAdjustedSquares,
              t.completedSquares + squares
            );

            return {
              ...t,
              completedSquares: newCompleted,
              status: newCompleted >= t.aiAdjustedSquares ? 'completed' : t.status,
            };
          }),
        }));
      },

      completeTask: (taskId) => {
        set(state => ({
          tasks: state.tasks.map(t => {
            if (t.id !== taskId) return t;
            return {
              ...t,
              status: 'completed',
              completedSquares: t.aiAdjustedSquares,
              actualEndDate: new Date().toISOString(),
            };
          }),
        }));
      },

      addPerson: (personData) => {
        const id = `person-${Date.now()}`;
        const newPerson: PersonCapacity = { ...personData, id };
        set(state => ({ people: [...state.people, newPerson] }));
        return id;
      },

      updatePerson: (id, updates) => {
        set(state => ({
          people: state.people.map(p =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }));
      },

      seedDemoData: (workspaceId: string) => {
        // Demo people
        const demoPeople: PersonCapacity[] = [
          {
            id: 'person-founder-1',
            name: 'Alex Chen',
            role: 'Founder',
            function: 'Admin',
            baseSquaresPerDay: 2,
            variability: [1, 3],
            qualityMultiplier: 1.5,
          },
          {
            id: 'person-exec-1',
            name: 'Sarah Mitchell',
            role: 'FractionalExec',
            function: 'Sales',
            baseSquaresPerDay: 2,
            variability: [1, 2],
            qualityMultiplier: 1.3,
          },
          {
            id: 'person-exec-2',
            name: 'Priya Sharma',
            role: 'FractionalExec',
            function: 'Marketing',
            baseSquaresPerDay: 2,
            variability: [1, 3],
            qualityMultiplier: 1.3,
          },
          {
            id: 'person-apprentice-1',
            name: 'Jordan Lee',
            role: 'Apprentice',
            function: 'Marketing',
            baseSquaresPerDay: 2,
            variability: [1, 3],
            qualityMultiplier: 1.0,
          },
          {
            id: 'person-apprentice-2',
            name: 'Emma Watson',
            role: 'Apprentice',
            function: 'Sales',
            baseSquaresPerDay: 2,
            variability: [2, 3],
            qualityMultiplier: 1.0,
          },
          {
            id: 'person-apprentice-3',
            name: 'Mike Chen',
            role: 'Apprentice',
            function: 'Engineering',
            baseSquaresPerDay: 2,
            variability: [1, 2],
            qualityMultiplier: 1.0,
          },
        ];

        // Demo tasks
        const demoTasks: BuildQueueTask[] = [
          {
            id: 'task-demo-1',
            workspaceId,
            title: 'Launch Marketing Campaign',
            description: 'Execute Q1 digital marketing campaign across all channels',
            function: 'Marketing',
            originalSquares: 20,
            aiAdjustedSquares: 12,
            completedSquares: 5,
            aiMode: 'heavy',
            aiEffortReduction: 0.4,
            aiThroughputBoost: 1.5,
            assignments: [
              { personId: 'person-exec-2', squaresPerDay: 2, startDate: '2026-01-10' },
              { personId: 'person-apprentice-1', squaresPerDay: 2, startDate: '2026-01-10' },
            ],
            cadence: 'fast',
            requiresQA: true,
            qaReviewerId: 'person-founder-1',
            qualityConfidence: 85,
            reworkRisk: 10,
            createdAt: '2026-01-08',
            startDate: '2026-01-10',
            queuePosition: 0,
            status: 'in_progress',
            urgency: 'high',
          },
          {
            id: 'task-demo-2',
            workspaceId,
            title: 'Build Sales Pipeline',
            description: 'Create qualified lead pipeline with 50 prospects',
            function: 'Sales',
            originalSquares: 15,
            aiAdjustedSquares: 9,
            completedSquares: 2,
            aiMode: 'assist',
            aiEffortReduction: 0.2,
            aiThroughputBoost: 1.2,
            assignments: [
              { personId: 'person-exec-1', squaresPerDay: 1, startDate: '2026-01-12' },
              { personId: 'person-apprentice-2', squaresPerDay: 2, startDate: '2026-01-12' },
            ],
            cadence: 'normal',
            requiresQA: false,
            qualityConfidence: 70,
            reworkRisk: 15,
            createdAt: '2026-01-10',
            startDate: '2026-01-12',
            queuePosition: 1,
            status: 'in_progress',
            urgency: 'high',
          },
          {
            id: 'task-demo-3',
            workspaceId,
            title: 'Product Documentation',
            description: 'Create comprehensive product documentation and user guides',
            function: 'Engineering',
            originalSquares: 10,
            aiAdjustedSquares: 4,
            completedSquares: 0,
            aiMode: 'autonomous',
            aiEffortReduction: 0.6,
            aiThroughputBoost: 2.0,
            assignments: [
              { personId: 'person-apprentice-3', squaresPerDay: 2, startDate: '2026-01-14' },
            ],
            cadence: 'normal',
            requiresQA: true,
            qaReviewerId: undefined,
            qualityConfidence: 45,
            reworkRisk: 35,
            createdAt: '2026-01-12',
            queuePosition: 2,
            status: 'queued',
            urgency: 'medium',
          },
          {
            id: 'task-demo-4',
            workspaceId,
            title: 'Customer Interviews',
            description: 'Conduct 20 customer discovery interviews',
            function: 'Marketing',
            originalSquares: 8,
            aiAdjustedSquares: 8,
            completedSquares: 0,
            aiMode: 'none',
            aiEffortReduction: 0,
            aiThroughputBoost: 1.0,
            assignments: [],
            cadence: 'slow',
            requiresQA: false,
            qualityConfidence: 50,
            reworkRisk: 20,
            createdAt: '2026-01-13',
            queuePosition: 3,
            status: 'queued',
            urgency: 'medium',
          },
          {
            id: 'task-demo-5',
            workspaceId,
            title: 'Financial Model Update',
            description: 'Update financial projections for investor deck',
            function: 'Finance',
            originalSquares: 6,
            aiAdjustedSquares: 4,
            completedSquares: 0,
            aiMode: 'assist',
            aiEffortReduction: 0.2,
            aiThroughputBoost: 1.2,
            assignments: [],
            cadence: 'normal',
            requiresQA: true,
            qualityConfidence: 50,
            reworkRisk: 25,
            createdAt: '2026-01-14',
            queuePosition: 4,
            status: 'queued',
            urgency: 'low',
          },
        ];

        set({ people: demoPeople, tasks: demoTasks });
      },
    }),
    {
      name: 'build-queue-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
