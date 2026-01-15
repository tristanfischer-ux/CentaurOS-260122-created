/**
 * Resource Store - Core Squares System
 *
 * Central system for managing time units (squares) across the app.
 * 1 Square = 4 hours of focused work
 *
 * Key concepts:
 * - People have capacity (squares per week)
 * - Tasks consume squares
 * - AI provides multiplier effect on effort
 * - Everything has a cost per square
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Function as BusinessFunction } from '@/types';

// ============ TYPES ============

export type PersonClass = 'Founder' | 'Executive' | 'Apprentice';

export interface PersonResource {
  id: string;
  name: string;
  initials: string;
  personClass: PersonClass;
  function: BusinessFunction;

  // Capacity
  baseSquaresPerWeek: number;      // Standard capacity (Founder/Apprentice: 10, Exec: varies)
  overtimeSquaresPerWeek: number;  // Extra capacity when overtime enabled (5 for F/A, up to 15 for Exec)
  overtimeEnabled: boolean;        // Whether overtime is currently enabled

  // Cost
  costPerSquare: number;           // £ per time unit
  dayRate?: number;                // For executives - their contracted day rate

  // Current allocation
  allocatedSquares: number;        // How many squares allocated to tasks this week

  // Avatar
  avatarColor: string;
}

export interface TaskResource {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  function: BusinessFunction;

  // Effort
  totalSquaresRequired: number;    // Total effort needed
  squaresCompleted: number;        // Work done so far

  // AI Multiplier
  aiMultiplier: number;            // 1x = no AI, 2x-20x = AI acceleration
  aiCostPerSquare: number;         // Cost of AI per square used
  effectiveSquaresRequired: number; // totalSquaresRequired / aiMultiplier

  // Allocation - who's working on it and how much
  allocations: TaskAllocation[];
  squaresAllocatedThisWeek: number; // Sum of all allocations

  // Timeline
  estimatedWeeksToComplete: number;

  // Cost
  totalEstimatedCost: number;      // Sum of all person costs + AI costs

  // Status
  status: 'active' | 'queued' | 'completed';
  isOKR: boolean;                  // Standalone task = OKR
  parentTaskId?: string;           // If merged under another task
  childTaskIds: string[];          // Tasks merged into this one

  // Queue position
  queuePosition: number;

  createdAt: string;
}

export interface TaskAllocation {
  personId: string;
  squaresPerWeek: number;          // How many squares this person contributes
}

export interface AITool {
  id: string;
  name: string;
  multiplier: number;              // 2x, 5x, 10x, 20x
  costPerSquare: number;           // £ per square when using this AI
  description: string;
  icon: string;
}

// ============ CONSTANTS ============

export const DEFAULT_AI_TOOLS: AITool[] = [
  { id: 'none', name: 'No AI', multiplier: 1, costPerSquare: 0, description: 'Manual work only', icon: 'user' },
  { id: 'assist', name: 'AI Assist', multiplier: 2, costPerSquare: 5, description: 'Basic AI assistance', icon: 'bot' },
  { id: 'copilot', name: 'AI Copilot', multiplier: 5, costPerSquare: 15, description: 'AI handles routine work', icon: 'zap' },
  { id: 'heavy', name: 'AI Heavy', multiplier: 10, costPerSquare: 30, description: 'AI does most work', icon: 'sparkles' },
  { id: 'autonomous', name: 'AI Autonomous', multiplier: 20, costPerSquare: 50, description: 'AI handles everything', icon: 'cpu' },
];

export const PERSON_CLASS_COLORS: Record<PersonClass, string> = {
  Founder: '#8b5cf6',      // Purple
  Executive: '#3b82f6',    // Blue
  Apprentice: '#10b981',   // Green
};

// ============ STORE ============

interface ResourceState {
  people: PersonResource[];
  tasks: TaskResource[];
  aiTools: AITool[];

  // Company cost basis
  companyAnnualCost: number;       // Total annual cost of company
  workingHoursPerYear: number;     // Default 2080 (52 weeks * 40 hours)

  // Getters
  getPeopleByClass: (personClass: PersonClass) => PersonResource[];
  getPeopleByWorkspace: (workspaceId: string) => PersonResource[];
  getPersonById: (id: string) => PersonResource | undefined;
  getAvailableSquares: (personId: string) => number;
  getTotalCapacity: () => { total: number; allocated: number; available: number };
  getCapacityByClass: (personClass: PersonClass) => { total: number; allocated: number; available: number };

  // Task getters
  getTasksByWorkspace: (workspaceId: string) => TaskResource[];
  getActiveTasks: (workspaceId: string) => TaskResource[];
  getQueuedTasks: (workspaceId: string) => TaskResource[];
  getTaskById: (id: string) => TaskResource | undefined;
  getTaskCost: (taskId: string) => number;

  // Actions - People
  addPerson: (person: Omit<PersonResource, 'id' | 'allocatedSquares'>) => string;
  updatePerson: (id: string, updates: Partial<PersonResource>) => void;
  toggleOvertime: (personId: string) => void;
  setOvertimeSquares: (personId: string, squares: number) => void;

  // Actions - Tasks
  addTask: (task: Omit<TaskResource, 'id' | 'createdAt' | 'effectiveSquaresRequired' | 'estimatedWeeksToComplete' | 'totalEstimatedCost' | 'squaresAllocatedThisWeek' | 'queuePosition'>) => string;
  updateTask: (id: string, updates: Partial<TaskResource>) => void;
  deleteTask: (id: string) => void;

  // Actions - Allocation
  allocateToTask: (taskId: string, personId: string, squaresPerWeek: number) => void;
  removeAllocation: (taskId: string, personId: string) => void;
  updateAllocation: (taskId: string, personId: string, squaresPerWeek: number) => void;

  // Actions - AI
  setTaskAI: (taskId: string, aiToolId: string) => void;

  // Actions - Task merging
  mergeTasks: (targetTaskId: string, sourceTaskId: string) => void;
  separateTask: (parentTaskId: string, childTaskId: string) => void;

  // Actions - Queue
  moveTaskToActive: (taskId: string) => void;
  moveTaskToQueue: (taskId: string) => void;
  reorderTasks: (workspaceId: string, taskIds: string[]) => void;

  // Calculations
  recalculateTask: (taskId: string) => void;
  recalculateAllAllocations: () => void;

  // Initialization
  seedDemoData: (workspaceId: string) => void;
  setCompanyCost: (annualCost: number) => void;
}

// ============ TEAM SIZE EFFICIENCY MODIFIERS ============
// Reflects communication overhead and coordination costs
// Based on Brooks' Law - adding people increases coordination overhead

export type TeamSizeEfficiency = {
  teamSize: number;
  efficiencyMultiplier: number;  // < 1 = penalty, > 1 = bonus, 1 = neutral
  label: string;
  description: string;
};

/**
 * Calculate team efficiency based on number of people assigned to a task
 *
 * 1 person: No efficiency barrier (1.0x)
 * 2 people: 10% efficiency boost (1.1x) - pair programming/collaboration benefit
 * 3 people: No efficiency penalty (1.0x) - optimal small team
 * 4-9 people: 10% efficiency loss (0.9x) - coordination overhead
 * 10-19 people: 20% efficiency loss (0.8x) - significant communication overhead
 * 20+ people: 50% efficiency loss (0.5x) - major coordination challenges
 */
export const getTeamSizeEfficiency = (teamSize: number): TeamSizeEfficiency => {
  if (teamSize <= 0) {
    return { teamSize: 0, efficiencyMultiplier: 1, label: 'No team', description: 'No one assigned' };
  }
  if (teamSize === 1) {
    return { teamSize: 1, efficiencyMultiplier: 1, label: 'Solo', description: 'No coordination overhead' };
  }
  if (teamSize === 2) {
    return { teamSize: 2, efficiencyMultiplier: 1.1, label: 'Pair', description: '+10% efficiency from collaboration' };
  }
  if (teamSize === 3) {
    return { teamSize: 3, efficiencyMultiplier: 1, label: 'Small team', description: 'Optimal team size' };
  }
  if (teamSize >= 4 && teamSize <= 9) {
    return { teamSize, efficiencyMultiplier: 0.9, label: 'Medium team', description: '-10% efficiency from coordination' };
  }
  if (teamSize >= 10 && teamSize <= 19) {
    return { teamSize, efficiencyMultiplier: 0.8, label: 'Large team', description: '-20% efficiency from communication overhead' };
  }
  // 20+ people
  return { teamSize, efficiencyMultiplier: 0.5, label: 'Very large team', description: '-50% efficiency from major coordination challenges' };
};

// Helper to calculate effective squares with AI
const calculateEffectiveSquares = (total: number, multiplier: number): number => {
  return Math.ceil(total / multiplier);
};

// Helper to calculate weeks to complete (includes team efficiency)
const calculateWeeksToComplete = (effectiveSquares: number, squaresPerWeek: number, teamSize: number = 1): number => {
  if (squaresPerWeek <= 0) return Infinity;
  const efficiency = getTeamSizeEfficiency(teamSize);
  // Effective output per week = allocated squares * efficiency multiplier
  const effectiveOutputPerWeek = squaresPerWeek * efficiency.efficiencyMultiplier;
  return Math.ceil(effectiveSquares / effectiveOutputPerWeek);
};

// Helper to calculate task cost (includes team efficiency)
const calculateTaskCost = (
  task: TaskResource,
  people: PersonResource[],
  aiTools: AITool[]
): number => {
  const teamSize = task.allocations.length;
  const efficiency = getTeamSizeEfficiency(teamSize);

  // Effective output per week accounting for team efficiency
  const effectiveOutputPerWeek = task.squaresAllocatedThisWeek * efficiency.efficiencyMultiplier;

  // Weeks to complete with efficiency factored in
  const weeksToComplete = effectiveOutputPerWeek > 0
    ? Math.ceil((task.effectiveSquaresRequired - task.squaresCompleted) / effectiveOutputPerWeek)
    : Infinity;

  // Person costs
  const personCost = task.allocations.reduce((sum, alloc) => {
    const person = people.find(p => p.id === alloc.personId);
    if (!person) return sum;
    return sum + (alloc.squaresPerWeek * person.costPerSquare * weeksToComplete);
  }, 0);

  // AI cost
  const aiCost = task.effectiveSquaresRequired * task.aiCostPerSquare;

  return personCost + aiCost;
};

// Helper to generate initials
const getInitials = (name: string): string => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const useResourceStore = create<ResourceState>()(
  persist(
    (set, get) => ({
      people: [],
      tasks: [],
      aiTools: DEFAULT_AI_TOOLS,
      companyAnnualCost: 500000,   // £500k default
      workingHoursPerYear: 2080,

      // ===== GETTERS =====

      getPeopleByClass: (personClass) => {
        return get().people.filter(p => p.personClass === personClass);
      },

      getPeopleByWorkspace: () => {
        return get().people; // For now, all people belong to workspace
      },

      getPersonById: (id) => {
        return get().people.find(p => p.id === id);
      },

      getAvailableSquares: (personId) => {
        const person = get().people.find(p => p.id === personId);
        if (!person) return 0;
        const maxSquares = person.baseSquaresPerWeek + (person.overtimeEnabled ? person.overtimeSquaresPerWeek : 0);
        return maxSquares - person.allocatedSquares;
      },

      getTotalCapacity: () => {
        const people = get().people;
        const total = people.reduce((sum, p) => {
          return sum + p.baseSquaresPerWeek + (p.overtimeEnabled ? p.overtimeSquaresPerWeek : 0);
        }, 0);
        const allocated = people.reduce((sum, p) => sum + p.allocatedSquares, 0);
        return { total, allocated, available: total - allocated };
      },

      getCapacityByClass: (personClass) => {
        const people = get().people.filter(p => p.personClass === personClass);
        const total = people.reduce((sum, p) => {
          return sum + p.baseSquaresPerWeek + (p.overtimeEnabled ? p.overtimeSquaresPerWeek : 0);
        }, 0);
        const allocated = people.reduce((sum, p) => sum + p.allocatedSquares, 0);
        return { total, allocated, available: total - allocated };
      },

      getTasksByWorkspace: (workspaceId) => {
        return get().tasks
          .filter(t => t.workspaceId === workspaceId && !t.parentTaskId)
          .sort((a, b) => a.queuePosition - b.queuePosition);
      },

      getActiveTasks: (workspaceId) => {
        return get().getTasksByWorkspace(workspaceId).filter(t => t.status === 'active');
      },

      getQueuedTasks: (workspaceId) => {
        return get().getTasksByWorkspace(workspaceId).filter(t => t.status === 'queued');
      },

      getTaskById: (id) => {
        return get().tasks.find(t => t.id === id);
      },

      getTaskCost: (taskId) => {
        const task = get().tasks.find(t => t.id === taskId);
        if (!task) return 0;
        return task.totalEstimatedCost;
      },

      // ===== PEOPLE ACTIONS =====

      addPerson: (personData) => {
        const id = `person-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newPerson: PersonResource = {
          ...personData,
          id,
          allocatedSquares: 0,
          initials: personData.initials || getInitials(personData.name),
        };
        set(state => ({ people: [...state.people, newPerson] }));
        return id;
      },

      updatePerson: (id, updates) => {
        set(state => ({
          people: state.people.map(p => p.id === id ? { ...p, ...updates } : p),
        }));
      },

      toggleOvertime: (personId) => {
        set(state => ({
          people: state.people.map(p =>
            p.id === personId ? { ...p, overtimeEnabled: !p.overtimeEnabled } : p
          ),
        }));
      },

      setOvertimeSquares: (personId, squares) => {
        set(state => ({
          people: state.people.map(p =>
            p.id === personId ? { ...p, overtimeSquaresPerWeek: squares } : p
          ),
        }));
      },

      // ===== TASK ACTIONS =====

      addTask: (taskData) => {
        const id = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const tasks = get().tasks;
        const maxPosition = tasks.length > 0 ? Math.max(...tasks.map(t => t.queuePosition)) : 0;

        const effectiveSquares = calculateEffectiveSquares(taskData.totalSquaresRequired, taskData.aiMultiplier);

        const newTask: TaskResource = {
          ...taskData,
          id,
          createdAt: new Date().toISOString(),
          effectiveSquaresRequired: effectiveSquares,
          squaresAllocatedThisWeek: taskData.allocations.reduce((sum, a) => sum + a.squaresPerWeek, 0),
          estimatedWeeksToComplete: Infinity,
          totalEstimatedCost: 0,
          queuePosition: maxPosition + 1,
        };

        // Calculate estimates
        newTask.estimatedWeeksToComplete = calculateWeeksToComplete(
          effectiveSquares - taskData.squaresCompleted,
          newTask.squaresAllocatedThisWeek
        );
        newTask.totalEstimatedCost = calculateTaskCost(newTask, get().people, get().aiTools);

        set(state => ({ tasks: [...state.tasks, newTask] }));
        get().recalculateAllAllocations();
        return id;
      },

      updateTask: (id, updates) => {
        set(state => ({
          tasks: state.tasks.map(t => {
            if (t.id !== id) return t;
            const updated = { ...t, ...updates };

            // Recalculate derived values
            if (updates.totalSquaresRequired !== undefined || updates.aiMultiplier !== undefined) {
              updated.effectiveSquaresRequired = calculateEffectiveSquares(
                updated.totalSquaresRequired,
                updated.aiMultiplier
              );
            }

            if (updates.allocations !== undefined) {
              updated.squaresAllocatedThisWeek = updated.allocations.reduce((sum, a) => sum + a.squaresPerWeek, 0);
            }

            updated.estimatedWeeksToComplete = calculateWeeksToComplete(
              updated.effectiveSquaresRequired - updated.squaresCompleted,
              updated.squaresAllocatedThisWeek
            );

            updated.totalEstimatedCost = calculateTaskCost(updated, state.people, state.aiTools);

            // Auto-queue if no allocation
            if (updated.squaresAllocatedThisWeek === 0 && updated.status === 'active') {
              updated.status = 'queued';
            }

            return updated;
          }),
        }));
        get().recalculateAllAllocations();
      },

      deleteTask: (id) => {
        const task = get().tasks.find(t => t.id === id);
        if (!task) return;

        // Also delete children
        const childIds = task.childTaskIds || [];

        set(state => ({
          tasks: state.tasks.filter(t => t.id !== id && !childIds.includes(t.id)),
        }));
        get().recalculateAllAllocations();
      },

      // ===== ALLOCATION ACTIONS =====

      allocateToTask: (taskId, personId, squaresPerWeek) => {
        const task = get().tasks.find(t => t.id === taskId);
        const person = get().people.find(p => p.id === personId);
        if (!task || !person) return;

        // Check available capacity
        const available = get().getAvailableSquares(personId);
        const actualSquares = Math.min(squaresPerWeek, available);
        if (actualSquares <= 0) return;

        const existingAlloc = task.allocations.find(a => a.personId === personId);
        let newAllocations: TaskAllocation[];

        if (existingAlloc) {
          newAllocations = task.allocations.map(a =>
            a.personId === personId ? { ...a, squaresPerWeek: a.squaresPerWeek + actualSquares } : a
          );
        } else {
          newAllocations = [...task.allocations, { personId, squaresPerWeek: actualSquares }];
        }

        get().updateTask(taskId, {
          allocations: newAllocations,
          status: 'active', // Move to active when allocated
        });
      },

      removeAllocation: (taskId, personId) => {
        const task = get().tasks.find(t => t.id === taskId);
        if (!task) return;

        const newAllocations = task.allocations.filter(a => a.personId !== personId);
        get().updateTask(taskId, { allocations: newAllocations });
      },

      updateAllocation: (taskId, personId, squaresPerWeek) => {
        const task = get().tasks.find(t => t.id === taskId);
        if (!task) return;

        if (squaresPerWeek <= 0) {
          get().removeAllocation(taskId, personId);
          return;
        }

        const newAllocations = task.allocations.map(a =>
          a.personId === personId ? { ...a, squaresPerWeek } : a
        );
        get().updateTask(taskId, { allocations: newAllocations });
      },

      // ===== AI ACTIONS =====

      setTaskAI: (taskId, aiToolId) => {
        const aiTool = get().aiTools.find(a => a.id === aiToolId);
        if (!aiTool) return;

        get().updateTask(taskId, {
          aiMultiplier: aiTool.multiplier,
          aiCostPerSquare: aiTool.costPerSquare,
        });
      },

      // ===== TASK MERGING =====

      mergeTasks: (targetTaskId, sourceTaskId) => {
        const targetTask = get().tasks.find(t => t.id === targetTaskId);
        const sourceTask = get().tasks.find(t => t.id === sourceTaskId);
        if (!targetTask || !sourceTask) return;

        // Update target to include source's squares
        const newTotalSquares = targetTask.totalSquaresRequired + sourceTask.totalSquaresRequired;
        const newChildIds = [...(targetTask.childTaskIds || []), sourceTaskId];

        // Update source to be a child
        set(state => ({
          tasks: state.tasks.map(t => {
            if (t.id === targetTaskId) {
              return {
                ...t,
                totalSquaresRequired: newTotalSquares,
                childTaskIds: newChildIds,
                isOKR: true, // Merged tasks become OKRs
              };
            }
            if (t.id === sourceTaskId) {
              return {
                ...t,
                parentTaskId: targetTaskId,
                status: 'active' as const,
              };
            }
            return t;
          }),
        }));

        get().recalculateTask(targetTaskId);
      },

      separateTask: (parentTaskId, childTaskId) => {
        const parentTask = get().tasks.find(t => t.id === parentTaskId);
        const childTask = get().tasks.find(t => t.id === childTaskId);
        if (!parentTask || !childTask) return;

        // Remove child from parent
        const newChildIds = (parentTask.childTaskIds || []).filter(id => id !== childTaskId);
        const newTotalSquares = parentTask.totalSquaresRequired - childTask.totalSquaresRequired;

        set(state => ({
          tasks: state.tasks.map(t => {
            if (t.id === parentTaskId) {
              return {
                ...t,
                totalSquaresRequired: Math.max(1, newTotalSquares),
                childTaskIds: newChildIds,
              };
            }
            if (t.id === childTaskId) {
              return {
                ...t,
                parentTaskId: undefined,
                isOKR: true, // Separated task becomes its own OKR
              };
            }
            return t;
          }),
        }));

        get().recalculateTask(parentTaskId);
      },

      // ===== QUEUE ACTIONS =====

      moveTaskToActive: (taskId) => {
        get().updateTask(taskId, { status: 'active' });
      },

      moveTaskToQueue: (taskId) => {
        const task = get().tasks.find(t => t.id === taskId);
        if (!task) return;

        // Clear allocations when moving to queue
        get().updateTask(taskId, {
          status: 'queued',
          allocations: [],
        });
      },

      reorderTasks: (workspaceId, taskIds) => {
        set(state => ({
          tasks: state.tasks.map(t => {
            if (t.workspaceId !== workspaceId) return t;
            const newPosition = taskIds.indexOf(t.id);
            if (newPosition === -1) return t;
            return { ...t, queuePosition: newPosition };
          }),
        }));
      },

      // ===== CALCULATIONS =====

      recalculateTask: (taskId) => {
        const task = get().tasks.find(t => t.id === taskId);
        if (!task) return;

        const effectiveSquares = calculateEffectiveSquares(task.totalSquaresRequired, task.aiMultiplier);
        const squaresPerWeek = task.allocations.reduce((sum, a) => sum + a.squaresPerWeek, 0);
        const weeksToComplete = calculateWeeksToComplete(effectiveSquares - task.squaresCompleted, squaresPerWeek);
        const cost = calculateTaskCost(task, get().people, get().aiTools);

        set(state => ({
          tasks: state.tasks.map(t => t.id === taskId ? {
            ...t,
            effectiveSquaresRequired: effectiveSquares,
            squaresAllocatedThisWeek: squaresPerWeek,
            estimatedWeeksToComplete: weeksToComplete,
            totalEstimatedCost: cost,
          } : t),
        }));
      },

      recalculateAllAllocations: () => {
        // Reset all person allocations
        const personAllocations: Record<string, number> = {};

        // Sum up allocations from all active tasks
        get().tasks.forEach(task => {
          if (task.status === 'active') {
            task.allocations.forEach(alloc => {
              personAllocations[alloc.personId] = (personAllocations[alloc.personId] || 0) + alloc.squaresPerWeek;
            });
          }
        });

        // Update people
        set(state => ({
          people: state.people.map(p => ({
            ...p,
            allocatedSquares: personAllocations[p.id] || 0,
          })),
        }));
      },

      // ===== INITIALIZATION =====

      setCompanyCost: (annualCost) => {
        const workingHours = get().workingHoursPerYear;
        const costPerHour = annualCost / workingHours;
        const costPerSquare = costPerHour * 4; // 4 hours per square

        set(state => ({
          companyAnnualCost: annualCost,
          // Update founder costs
          people: state.people.map(p =>
            p.personClass === 'Founder' ? { ...p, costPerSquare } : p
          ),
        }));
      },

      seedDemoData: (workspaceId) => {
        const { companyAnnualCost, workingHoursPerYear } = get();
        const founderCostPerSquare = (companyAnnualCost / workingHoursPerYear) * 4;

        // Demo people - matches organization-seed.ts (13 team members)
        const demoPeople: PersonResource[] = [
          // Founders (2)
          {
            id: 'founder-1',
            name: 'Sarah Chen',
            initials: 'SC',
            personClass: 'Founder',
            function: 'Admin',
            baseSquaresPerWeek: 10,
            overtimeSquaresPerWeek: 5,
            overtimeEnabled: false,
            costPerSquare: founderCostPerSquare,
            allocatedSquares: 0,
            avatarColor: '#8b5cf6',
          },
          {
            id: 'founder-2',
            name: 'Marcus Thompson',
            initials: 'MT',
            personClass: 'Founder',
            function: 'Engineering',
            baseSquaresPerWeek: 10,
            overtimeSquaresPerWeek: 5,
            overtimeEnabled: false,
            costPerSquare: founderCostPerSquare,
            allocatedSquares: 0,
            avatarColor: '#7c3aed',
          },
          // Executives (4)
          {
            id: 'exec-1',
            name: 'Jordan Martinez',
            initials: 'JM',
            personClass: 'Executive',
            function: 'Finance',
            baseSquaresPerWeek: 6, // 3 days/week = 6 squares
            overtimeSquaresPerWeek: 9,
            overtimeEnabled: false,
            costPerSquare: 400, // £850/day ÷ 2 squares/day ≈ £400
            dayRate: 850,
            allocatedSquares: 0,
            avatarColor: '#3b82f6',
          },
          {
            id: 'exec-2',
            name: 'Emma Richardson',
            initials: 'ER',
            personClass: 'Executive',
            function: 'Sales',
            baseSquaresPerWeek: 6, // 3 days/week
            overtimeSquaresPerWeek: 9,
            overtimeEnabled: false,
            costPerSquare: 500, // £920/day ÷ 2 ≈ £500
            dayRate: 920,
            allocatedSquares: 0,
            avatarColor: '#2563eb',
          },
          {
            id: 'exec-3',
            name: 'David Park',
            initials: 'DP',
            personClass: 'Executive',
            function: 'Engineering',
            baseSquaresPerWeek: 6, // 3 days/week
            overtimeSquaresPerWeek: 9,
            overtimeEnabled: false,
            costPerSquare: 600, // £1100/day ÷ 2 ≈ £600
            dayRate: 1100,
            allocatedSquares: 0,
            avatarColor: '#1d4ed8',
          },
          {
            id: 'exec-4',
            name: 'Sophie Adams',
            initials: 'SA',
            personClass: 'Executive',
            function: 'Marketing',
            baseSquaresPerWeek: 4, // 2 days/week
            overtimeSquaresPerWeek: 11,
            overtimeEnabled: false,
            costPerSquare: 400, // £780/day ÷ 2 ≈ £400
            dayRate: 780,
            allocatedSquares: 0,
            avatarColor: '#4f46e5',
          },
          // Apprentices (7)
          {
            id: 'apprentice-1',
            name: 'Alex Rivera',
            initials: 'AR',
            personClass: 'Apprentice',
            function: 'Finance',
            baseSquaresPerWeek: 10,
            overtimeSquaresPerWeek: 5,
            overtimeEnabled: false,
            costPerSquare: 70, // £140/day ÷ 2 = £70
            allocatedSquares: 0,
            avatarColor: '#10b981',
          },
          {
            id: 'apprentice-2',
            name: 'Priya Sharma',
            initials: 'PS',
            personClass: 'Apprentice',
            function: 'Finance',
            baseSquaresPerWeek: 10,
            overtimeSquaresPerWeek: 5,
            overtimeEnabled: false,
            costPerSquare: 70, // £135/day ÷ 2 ≈ £70
            allocatedSquares: 0,
            avatarColor: '#059669',
          },
          {
            id: 'apprentice-3',
            name: 'James Wilson',
            initials: 'JW',
            personClass: 'Apprentice',
            function: 'Sales',
            baseSquaresPerWeek: 10,
            overtimeSquaresPerWeek: 5,
            overtimeEnabled: false,
            costPerSquare: 70, // £145/day ÷ 2 ≈ £70
            allocatedSquares: 0,
            avatarColor: '#047857',
          },
          {
            id: 'apprentice-4',
            name: 'Lily Chen',
            initials: 'LC',
            personClass: 'Apprentice',
            function: 'Sales',
            baseSquaresPerWeek: 10,
            overtimeSquaresPerWeek: 5,
            overtimeEnabled: false,
            costPerSquare: 80, // £150/day ÷ 2 ≈ £80
            allocatedSquares: 0,
            avatarColor: '#065f46',
          },
          {
            id: 'apprentice-5',
            name: 'Omar Hassan',
            initials: 'OH',
            personClass: 'Apprentice',
            function: 'Engineering',
            baseSquaresPerWeek: 10,
            overtimeSquaresPerWeek: 5,
            overtimeEnabled: false,
            costPerSquare: 80, // £155/day ÷ 2 ≈ £80
            allocatedSquares: 0,
            avatarColor: '#0d9488',
          },
          {
            id: 'apprentice-6',
            name: 'Maya Patel',
            initials: 'MP',
            personClass: 'Apprentice',
            function: 'Engineering',
            baseSquaresPerWeek: 10,
            overtimeSquaresPerWeek: 5,
            overtimeEnabled: false,
            costPerSquare: 80, // £160/day ÷ 2 = £80
            allocatedSquares: 0,
            avatarColor: '#14b8a6',
          },
          {
            id: 'apprentice-7',
            name: 'Lucas Silva',
            initials: 'LS',
            personClass: 'Apprentice',
            function: 'Marketing',
            baseSquaresPerWeek: 10,
            overtimeSquaresPerWeek: 5,
            overtimeEnabled: false,
            costPerSquare: 70, // £142/day ÷ 2 ≈ £70
            allocatedSquares: 0,
            avatarColor: '#34d399',
          },
        ];

        // Demo tasks
        const demoTasks: TaskResource[] = [
          {
            id: 'task-1',
            workspaceId,
            title: 'Launch Marketing Campaign',
            description: 'Execute Q1 digital marketing campaign',
            function: 'Marketing',
            totalSquaresRequired: 20,
            squaresCompleted: 5,
            aiMultiplier: 5, // AI Copilot
            aiCostPerSquare: 15,
            effectiveSquaresRequired: 4,
            allocations: [
              { personId: 'exec-4', squaresPerWeek: 2 }, // Sophie Adams (Marketing exec)
              { personId: 'apprentice-7', squaresPerWeek: 4 }, // Lucas Silva (Marketing apprentice)
            ],
            squaresAllocatedThisWeek: 6,
            estimatedWeeksToComplete: 1,
            totalEstimatedCost: 0,
            status: 'active',
            isOKR: true,
            childTaskIds: [],
            queuePosition: 0,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'task-2',
            workspaceId,
            title: 'Build Sales Pipeline',
            description: 'Create qualified lead pipeline with 50 prospects',
            function: 'Sales',
            totalSquaresRequired: 15,
            squaresCompleted: 2,
            aiMultiplier: 2, // AI Assist
            aiCostPerSquare: 5,
            effectiveSquaresRequired: 8,
            allocations: [
              { personId: 'exec-2', squaresPerWeek: 2 }, // Emma Richardson (Sales exec)
              { personId: 'apprentice-3', squaresPerWeek: 3 }, // James Wilson (Sales apprentice)
            ],
            squaresAllocatedThisWeek: 5,
            estimatedWeeksToComplete: 2,
            totalEstimatedCost: 0,
            status: 'active',
            isOKR: true,
            childTaskIds: [],
            queuePosition: 1,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'task-3',
            workspaceId,
            title: 'Product Documentation',
            description: 'Create comprehensive product documentation',
            function: 'Engineering',
            totalSquaresRequired: 10,
            squaresCompleted: 0,
            aiMultiplier: 10, // AI Heavy
            aiCostPerSquare: 30,
            effectiveSquaresRequired: 1,
            allocations: [],
            squaresAllocatedThisWeek: 0,
            estimatedWeeksToComplete: Infinity,
            totalEstimatedCost: 0,
            status: 'queued',
            isOKR: true,
            childTaskIds: [],
            queuePosition: 2,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'task-4',
            workspaceId,
            title: 'Customer Discovery Interviews',
            description: 'Conduct 20 customer discovery interviews',
            function: 'Marketing',
            totalSquaresRequired: 8,
            squaresCompleted: 0,
            aiMultiplier: 1, // No AI - requires human interaction
            aiCostPerSquare: 0,
            effectiveSquaresRequired: 8,
            allocations: [],
            squaresAllocatedThisWeek: 0,
            estimatedWeeksToComplete: Infinity,
            totalEstimatedCost: 0,
            status: 'queued',
            isOKR: true,
            childTaskIds: [],
            queuePosition: 3,
            createdAt: new Date().toISOString(),
          },
        ];

        set({ people: demoPeople, tasks: demoTasks });
        get().recalculateAllAllocations();

        // Recalculate costs for all tasks
        demoTasks.forEach(t => get().recalculateTask(t.id));
      },
    }),
    {
      name: 'resource-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
