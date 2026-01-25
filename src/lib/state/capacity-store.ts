/**
 * Capacity Store - Squares-Based Capacity Management
 *
 * Key concepts:
 * - 1 Square (□) = Half Day = 4 hours
 * - 1 Day = 2□ (normal) or 3□ (stretched, 12 hours)
 * - 1 Week = 10□ (5 days × 2□)
 * - Rolling window: 10 days (20□)
 *
 * Capacity limits:
 * - Apprentice: 10□/week normal, 15□/week stretched
 * - Executive: 2-6□/week based on daysPerWeek, up to 9□ stretched
 * - Founder: 10□/week normal, 15□/week stretched
 */

import { create } from 'zustand';
import type { OrganizationMember } from '@/lib/organization-seed';
import type { WorkPlan } from './work-plan-store';
import type { ThirdPartyAITool } from '@/lib/third-party-ai-tools';

// Constants (squares = time units internally)
const SQUARES_PER_HALF_DAY = 1;
const SQUARES_PER_DAY_NORMAL = 2;
const SQUARES_PER_DAY_STRETCHED = 3;
const SQUARES_PER_WEEK_NORMAL = 10;
const ROLLING_WINDOW_DAYS = 10;

export interface TimeSlot {
  date: string;           // YYYY-MM-DD
  slotIndex: 0 | 1 | 2;   // 0 = morning, 1 = afternoon, 2 = evening (stretched)
  memberId: string;
  workPlanId?: string;
  okrTitle?: string;
  isStretched: boolean;   // true if this is the 3rd slot of the day
}

export interface MemberCapacityView {
  memberId: string;
  name: string;
  role: 'Founder' | 'CoFounder' | 'FractionalExec' | 'Apprentice';
  function: string;

  // Capacity metrics
  baseTimeUnitsPerWeek: number;        // Normal capacity based on daysPerWeek
  maxTimeUnitsPerWeek: number;         // Max with stretch (1.5x normal)
  allocatedTimeUnits: number;          // Currently allocated □
  availableTimeUnits: number;          // Remaining □
  utilizationPct: number;              // 0-100+
  isStretched: boolean;                // True if over 100% normal capacity

  // AI efficiency
  aiMultiplier: number;                // Combined from equipped tools (1.0 - 20.0)
  effectiveCapacity: number;           // baseTimeUnits * aiMultiplier

  // Daily breakdown for 10-day rolling view
  // Each day has up to 3 slots (morning, afternoon, evening if stretched)
  dailyAllocation: {
    date: string;
    dayOfWeek: string;           // Mon, Tue, etc.
    normalSlots: number;         // 0-2
    stretchSlots: number;        // 0-1
    totalSlots: number;          // 0-3
    workPlanIds: string[];
  }[];

  // Cost
  costPerDay: number;
  totalWeeklyCost: number;
}

export interface TeamCapacitySummary {
  totalCapacityTU: number;
  totalAllocatedTU: number;
  totalAvailableTU: number;
  utilizationPct: number;
  stretchedCount: number;
  overloadedCount: number;        // Members over max capacity
  underutilizedCount: number;     // Members under 50%
}

export interface FunctionCapacitySummary {
  function: string;
  apprenticeCapacityTU: number;
  executiveCapacityTU: number;
  founderCapacityTU: number;
  totalCapacityTU: number;
  allocatedTU: number;
  availableTU: number;
  utilizationPct: number;
  memberCount: number;
}

interface CapacityState {
  // Rolling window dates
  startDate: string;
  endDate: string;

  // Member capacities
  memberCapacities: MemberCapacityView[];

  // Summaries
  teamSummary: TeamCapacitySummary;
  functionSummaries: FunctionCapacitySummary[];

  // Actions
  calculateCapacity: (
    members: OrganizationMember[],
    workPlans: WorkPlan[],
    aiTools: ThirdPartyAITool[],
    memberAIToolIds: Map<string, string[]>  // memberId -> toolIds
  ) => void;

  getMemberCapacity: (memberId: string) => MemberCapacityView | undefined;
  getFunctionCapacity: (func: string) => FunctionCapacitySummary | undefined;

  // Calculate effective time for a task considering AI multipliers
  calculateEffectiveTime: (
    baseTimeUnits: number,
    memberAITools: ThirdPartyAITool[]
  ) => number;

  // Check if member can take on additional work
  canAllocate: (memberId: string, additionalTU: number) => {
    canAllocate: boolean;
    wouldBeStretched: boolean;
    wouldBeOverloaded: boolean;
    remainingCapacity: number;
  };

  // Project completion time for a task
  projectCompletionDays: (
    timeUnits: number,
    assignedMemberIds: string[],
    sprintMode: boolean,
    allocatedPerWeek?: number
  ) => number;
}

// Helper: Get base squares per week for a member
function getBaseTimeUnitsPerWeek(member: OrganizationMember): number {
  const daysPerWeek = member.daysPerWeek ?? 5;
  return daysPerWeek * SQUARES_PER_DAY_NORMAL;
}

// Helper: Get max squares per week (with stretch)
function getMaxTimeUnitsPerWeek(member: OrganizationMember): number {
  const daysPerWeek = member.daysPerWeek ?? 5;
  return daysPerWeek * SQUARES_PER_DAY_STRETCHED;
}

// Helper: Calculate AI multiplier from equipped tools
function calculateAIMultiplier(
  memberToolIds: string[],
  allTools: ThirdPartyAITool[]
): number {
  if (!memberToolIds || memberToolIds.length === 0) return 1.0;

  // Get the highest efficiency multiplier from equipped tools
  const multipliers = memberToolIds
    .map(id => allTools.find(t => t.id === id)?.efficiencyMultiplier ?? 1.0)
    .filter(m => m > 1.0);

  if (multipliers.length === 0) return 1.0;

  // Use the highest multiplier (tools don't stack multiplicatively)
  return Math.max(...multipliers);
}

// Helper: Get rolling window dates
function getRollingWindowDates(): { startDate: string; endDate: string; dates: string[] } {
  const today = new Date();
  const dates: string[] = [];

  for (let i = 0; i < ROLLING_WINDOW_DAYS; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }

  return {
    startDate: dates[0],
    endDate: dates[dates.length - 1],
    dates,
  };
}

// Helper: Get day of week abbreviation
function getDayOfWeek(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
}

// Helper: Check if a day is a working day
function isWorkingDay(dateStr: string): boolean {
  const dayOfWeek = getDayOfWeek(dateStr);
  return dayOfWeek !== 'Sat' && dayOfWeek !== 'Sun';
}

export const useCapacityStore = create<CapacityState>((set, get) => ({
  startDate: '',
  endDate: '',
  memberCapacities: [],
  teamSummary: {
    totalCapacityTU: 0,
    totalAllocatedTU: 0,
    totalAvailableTU: 0,
    utilizationPct: 0,
    stretchedCount: 0,
    overloadedCount: 0,
    underutilizedCount: 0,
  },
  functionSummaries: [],

  calculateCapacity: (members, workPlans, aiTools, memberAIToolIds) => {
    const { startDate, endDate, dates } = getRollingWindowDates();

    // Calculate capacity for each member
    const memberCapacities: MemberCapacityView[] = members
      .filter(m => m.status === 'active')
      .map(member => {
        const baseTimeUnitsPerWeek = getBaseTimeUnitsPerWeek(member);
        const maxTimeUnitsPerWeek = getMaxTimeUnitsPerWeek(member);
        const memberToolIds = memberAIToolIds.get(member.id) || [];
        const aiMultiplier = calculateAIMultiplier(memberToolIds, aiTools);

        // Calculate allocated time from work plans
        const memberWorkPlans = workPlans.filter(wp =>
          wp.assignedMemberIds?.includes(member.id) ||
          wp.function === member.function
        );

        // Sum up squares from active work plans
        const allocatedTimeUnits = memberWorkPlans
          .filter(wp => wp.status !== 'completed')
          .reduce((sum, wp) => {
            // Calculate remaining squares based on progress
            const remainingPct = (100 - wp.progress) / 100;
            const remainingSquares = Math.ceil(wp.estimatedTimeUnits * remainingPct);
            return sum + remainingSquares;
          }, 0);

        const availableTimeUnits = Math.max(0, baseTimeUnitsPerWeek - allocatedTimeUnits);
        const utilizationPct = baseTimeUnitsPerWeek > 0
          ? Math.round((allocatedTimeUnits / baseTimeUnitsPerWeek) * 100)
          : 0;
        const isStretched = allocatedTimeUnits > baseTimeUnitsPerWeek;

        // Build daily allocation
        const dailyAllocation = dates
          .filter(isWorkingDay)
          .map(date => {
            // Simplified: distribute allocated squares evenly across working days
            const workingDaysInWindow = dates.filter(isWorkingDay).length;
            const avgSquaresPerDay = allocatedTimeUnits / workingDaysInWindow;
            const normalSlots = Math.min(2, Math.floor(avgSquaresPerDay));
            const stretchSlots = avgSquaresPerDay > 2 ? 1 : 0;

            return {
              date,
              dayOfWeek: getDayOfWeek(date),
              normalSlots,
              stretchSlots,
              totalSlots: normalSlots + stretchSlots,
              workPlanIds: memberWorkPlans.map(wp => wp.id),
            };
          });

        const costPerDay = member.costPerDay ?? 0;
        const totalWeeklyCost = costPerDay * (member.daysPerWeek ?? 5);

        return {
          memberId: member.id,
          name: member.name,
          role: member.role,
          function: member.function,
          baseTimeUnitsPerWeek,
          maxTimeUnitsPerWeek,
          allocatedTimeUnits,
          availableTimeUnits,
          utilizationPct,
          isStretched,
          aiMultiplier,
          effectiveCapacity: Math.round(baseTimeUnitsPerWeek * aiMultiplier),
          dailyAllocation,
          costPerDay,
          totalWeeklyCost,
        };
      });

    // Calculate team summary
    const teamSummary: TeamCapacitySummary = {
      totalCapacityTU: memberCapacities.reduce((sum, m) => sum + m.baseTimeUnitsPerWeek, 0),
      totalAllocatedTU: memberCapacities.reduce((sum, m) => sum + m.allocatedTimeUnits, 0),
      totalAvailableTU: memberCapacities.reduce((sum, m) => sum + m.availableTimeUnits, 0),
      utilizationPct: 0,
      stretchedCount: memberCapacities.filter(m => m.isStretched).length,
      overloadedCount: memberCapacities.filter(m => m.allocatedTimeUnits > m.maxTimeUnitsPerWeek).length,
      underutilizedCount: memberCapacities.filter(m => m.utilizationPct < 50).length,
    };
    teamSummary.utilizationPct = teamSummary.totalCapacityTU > 0
      ? Math.round((teamSummary.totalAllocatedTU / teamSummary.totalCapacityTU) * 100)
      : 0;

    // Calculate function summaries
    const functionMap = new Map<string, FunctionCapacitySummary>();
    for (const member of memberCapacities) {
      const existing = functionMap.get(member.function);
      if (existing) {
        if (member.role === 'Apprentice') {
          existing.apprenticeCapacityTU += member.baseTimeUnitsPerWeek;
        } else if (member.role === 'FractionalExec') {
          existing.executiveCapacityTU += member.baseTimeUnitsPerWeek;
        } else {
          existing.founderCapacityTU += member.baseTimeUnitsPerWeek;
        }
        existing.totalCapacityTU += member.baseTimeUnitsPerWeek;
        existing.allocatedTU += member.allocatedTimeUnits;
        existing.availableTU += member.availableTimeUnits;
        existing.memberCount += 1;
      } else {
        functionMap.set(member.function, {
          function: member.function,
          apprenticeCapacityTU: member.role === 'Apprentice' ? member.baseTimeUnitsPerWeek : 0,
          executiveCapacityTU: member.role === 'FractionalExec' ? member.baseTimeUnitsPerWeek : 0,
          founderCapacityTU: member.role === 'Founder' ? member.baseTimeUnitsPerWeek : 0,
          totalCapacityTU: member.baseTimeUnitsPerWeek,
          allocatedTU: member.allocatedTimeUnits,
          availableTU: member.availableTimeUnits,
          utilizationPct: 0,
          memberCount: 1,
        });
      }
    }

    // Calculate utilization for each function
    const functionSummaries = Array.from(functionMap.values()).map(func => ({
      ...func,
      utilizationPct: func.totalCapacityTU > 0
        ? Math.round((func.allocatedTU / func.totalCapacityTU) * 100)
        : 0,
    }));

    set({
      startDate,
      endDate,
      memberCapacities,
      teamSummary,
      functionSummaries,
    });
  },

  getMemberCapacity: (memberId) => {
    return get().memberCapacities.find(m => m.memberId === memberId);
  },

  getFunctionCapacity: (func) => {
    return get().functionSummaries.find(f => f.function === func);
  },

  calculateEffectiveTime: (baseTimeUnits, memberAITools) => {
    // Get highest efficiency multiplier from equipped tools
    const maxMultiplier = Math.max(
      1,
      ...memberAITools.map(t => t.efficiencyMultiplier || 1)
    );

    // Calculate effective time (rounded up, minimum 1)
    return Math.max(1, Math.ceil(baseTimeUnits / maxMultiplier));
  },

  canAllocate: (memberId, additionalTU) => {
    const member = get().memberCapacities.find(m => m.memberId === memberId);
    if (!member) {
      return {
        canAllocate: false,
        wouldBeStretched: false,
        wouldBeOverloaded: false,
        remainingCapacity: 0,
      };
    }

    const newAllocated = member.allocatedTimeUnits + additionalTU;
    const wouldBeStretched = newAllocated > member.baseTimeUnitsPerWeek;
    const wouldBeOverloaded = newAllocated > member.maxTimeUnitsPerWeek;

    return {
      canAllocate: !wouldBeOverloaded,
      wouldBeStretched,
      wouldBeOverloaded,
      remainingCapacity: member.maxTimeUnitsPerWeek - member.allocatedTimeUnits,
    };
  },

  projectCompletionDays: (timeUnits, assignedMemberIds, sprintMode, allocatedPerWeek) => {
    const memberCapacities = get().memberCapacities;

    if (sprintMode) {
      // Sprint mode: use all available capacity from assigned members
      const totalDailySquares = assignedMemberIds.reduce((sum, id) => {
        const member = memberCapacities.find(m => m.memberId === id);
        if (!member) return sum;
        // Assume 2□ per day per member in sprint mode
        return sum + SQUARES_PER_DAY_NORMAL;
      }, 0);

      if (totalDailySquares === 0) return timeUnits; // Fallback: 1□ per day

      return Math.ceil(timeUnits / totalDailySquares);
    } else {
      // Spread mode: use allocated squares per week
      const squaresPerWeek = allocatedPerWeek || 2; // Default 2□ per week
      const weeks = Math.ceil(timeUnits / squaresPerWeek);
      return weeks * 5; // Convert weeks to working days
    }
  },
}));

// Selector hooks for optimized re-renders
export const useTeamCapacity = () => useCapacityStore(s => s.teamSummary);
export const useMemberCapacities = () => useCapacityStore(s => s.memberCapacities);
export const useFunctionCapacities = () => useCapacityStore(s => s.functionSummaries);
