/**
 * Decisions Store
 * Manages urgent decisions that require founder/leadership attention
 * Integrates with WorkPlans - decisions create tasks when resolved
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWorkPlanStore } from './work-plan-store';
import type { WorkPlan } from './work-plan-store';

export type UrgencyLevel = 'critical' | 'high' | 'normal';

export interface Decision {
  id: string;
  title: string;
  question: string;
  context: string;
  category: 'hiring' | 'budget' | 'strategy' | 'operations' | 'product' | 'legal';
  urgency: UrgencyLevel;
  urgencyReason?: string; // NEW: Why is this decision urgent?
  linkedOKRId?: string; // NEW: Link to related OKR
  linkedTaskId?: string; // NEW: Link to related task
  deadline?: string; // ISO date string
  requiredDecisionMaker: 'founder' | 'executive' | 'team';
  options?: DecisionOption[];
  relatedTaskIds?: string[]; // WorkPlans created from this decision
  relatedMemberIds?: string[];
  status: 'pending' | 'decided' | 'deferred';
  decidedOption?: string;
  decidedAt?: string;
  decidedBy?: string;
  createdAt: string;
  createdBy?: string;
  workspaceId?: string; // For multi-tenant support
}

export interface DecisionOption {
  id: string;
  label: string;
  description?: string;
  impact?: string;
  recommended?: boolean;
  // NEW: What tasks to create if this option is chosen
  tasksToCreate?: Array<{
    title: string;
    description: string;
    function: 'Ops' | 'Marketing' | 'Sales' | 'Finance' | 'Engineering' | 'Admin';
    estimatedTimeUnits: number;
    dueInDays?: number;
  }>;
}

interface DecisionsState {
  decisions: Decision[];
  initialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  addDecision: (decision: Omit<Decision, 'id' | 'createdAt' | 'status'>) => void;
  makeDecision: (decisionId: string, optionId: string, decidedBy: string) => void;
  deferDecision: (decisionId: string) => void;
  removeDecision: (decisionId: string) => void;

  // Queries
  getPendingDecisions: () => Decision[];
  getUrgentDecisions: () => Decision[];
  getDecisionsByCategory: (category: Decision['category']) => Decision[];
}

const STORAGE_KEY = 'decisions-store';

// Sample decisions for demo
const sampleDecisions: Decision[] = [
  {
    id: 'dec-1',
    title: 'Approve Q1 Marketing Budget',
    question: 'Should we increase marketing spend by 30% for Q1?',
    context: 'Marketing team has proposed increasing paid acquisition budget to capitalize on seasonal demand. Current CAC is £45, target is £40.',
    category: 'budget',
    urgency: 'high',
    urgencyReason: 'Q1 seasonal demand window closes in 2 weeks. Delaying reduces customer acquisition by 40%.',
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days
    requiredDecisionMaker: 'founder',
    options: [
      {
        id: 'opt-1',
        label: 'Approve Full Increase',
        description: 'Approve 30% increase (£15K additional)',
        impact: 'Higher acquisition, faster growth',
        recommended: true,
        tasksToCreate: [
          {
            title: 'Execute Q1 Marketing Campaign',
            description: 'Launch paid acquisition campaign with increased budget. Monitor CAC and adjust channels for optimal performance.',
            function: 'Marketing',
            estimatedTimeUnits: 20,
            dueInDays: 7,
          },
          {
            title: 'Track Q1 Marketing KPIs',
            description: 'Set up weekly tracking dashboard for CAC, conversion rates, and ROAS. Report to founder weekly.',
            function: 'Marketing',
            estimatedTimeUnits: 5,
            dueInDays: 3,
          }
        ]
      },
      {
        id: 'opt-2',
        label: 'Partial Increase',
        description: 'Approve 15% increase (£7.5K additional)',
        impact: 'Moderate growth, lower risk',
        tasksToCreate: [
          {
            title: 'Execute Scaled Q1 Marketing Campaign',
            description: 'Launch paid acquisition campaign with partial budget increase. Focus on highest-performing channels only.',
            function: 'Marketing',
            estimatedTimeUnits: 15,
            dueInDays: 7,
          }
        ]
      },
      {
        id: 'opt-3',
        label: 'Decline',
        description: 'Keep current budget',
        impact: 'Preserve runway, slower growth'
      },
    ],
    status: 'pending',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'Marketing Lead',
    workspaceId: 'default-workspace',
  },
  {
    id: 'dec-2',
    title: 'Hire Senior Developer',
    question: 'Should we hire the senior developer candidate at £650/day?',
    context: 'Strong candidate with React Native expertise. Would accelerate product roadmap by 40%. Current burn would increase by £13K/month.',
    category: 'hiring',
    urgency: 'critical',
    urgencyReason: 'Candidate has 2 other offers and needs answer by tomorrow. Losing this hire delays Q1 product launch by 6 weeks.',
    linkedTaskId: 'wp-1', // Link to existing engineering task
    deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day - candidate has other offers
    requiredDecisionMaker: 'founder',
    options: [
      {
        id: 'opt-1',
        label: 'Hire Now',
        description: 'Extend offer at £650/day',
        impact: 'Fast product delivery, higher burn',
        recommended: true,
        tasksToCreate: [
          {
            title: 'Onboard New Senior Developer',
            description: 'Complete onboarding process: contracts, setup accounts, introduce to team, assign first project.',
            function: 'Ops',
            estimatedTimeUnits: 10,
            dueInDays: 3,
          },
          {
            title: 'Assign Developer to Priority Project',
            description: 'Brief developer on current sprint priorities and allocate to highest-value feature work.',
            function: 'Engineering',
            estimatedTimeUnits: 5,
            dueInDays: 5,
          }
        ]
      },
      {
        id: 'opt-2',
        label: 'Negotiate',
        description: 'Counter at £550/day',
        impact: 'Lower cost, risk losing candidate',
        tasksToCreate: [
          {
            title: 'Negotiate Developer Rate',
            description: 'Prepare counter-offer at £550/day with performance bonus structure. Present within 24 hours.',
            function: 'Ops',
            estimatedTimeUnits: 3,
            dueInDays: 1,
          }
        ]
      },
      {
        id: 'opt-3',
        label: 'Pass',
        description: 'Continue search',
        impact: 'Delay roadmap, preserve runway',
        tasksToCreate: [
          {
            title: 'Source Alternative Developer Candidates',
            description: 'Update job posting, reach out to recruitment agencies, post on developer communities.',
            function: 'Ops',
            estimatedTimeUnits: 8,
            dueInDays: 7,
          }
        ]
      },
    ],
    status: 'pending',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    createdBy: 'HR',
    workspaceId: 'default-workspace',
  },
  {
    id: 'dec-3',
    title: 'Product Feature Priority',
    question: 'Which feature should we prioritize for the next sprint?',
    context: 'Team can only complete one major feature. Analytics shows users requesting both equally.',
    category: 'product',
    urgency: 'normal',
    urgencyReason: 'Sprint planning starts Monday. Decision needed to allocate team resources effectively.',
    linkedOKRId: 'okr-1', // Link to Q1 product OKR
    requiredDecisionMaker: 'founder',
    options: [
      {
        id: 'opt-1',
        label: 'Payment Integration',
        description: 'Enable in-app purchases',
        impact: 'Revenue enablement',
        tasksToCreate: [
          {
            title: 'Implement Payment Integration',
            description: 'Integrate Stripe/RevenueCat, implement checkout flow, test payment processing.',
            function: 'Engineering',
            estimatedTimeUnits: 30,
            dueInDays: 14,
          },
          {
            title: 'Set Up Payment Analytics',
            description: 'Configure revenue tracking, conversion funnels, and payment failure monitoring.',
            function: 'Engineering',
            estimatedTimeUnits: 8,
            dueInDays: 7,
          }
        ]
      },
      {
        id: 'opt-2',
        label: 'Social Sharing',
        description: 'Add viral growth features',
        impact: 'User acquisition',
        tasksToCreate: [
          {
            title: 'Build Social Sharing Features',
            description: 'Implement share to social media, invite friends, referral tracking.',
            function: 'Engineering',
            estimatedTimeUnits: 25,
            dueInDays: 14,
          }
        ]
      },
    ],
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'Product Manager',
    workspaceId: 'default-workspace',
  },
];

export const useDecisionsStore = create<DecisionsState>((set, get) => ({
  decisions: [],
  initialized: false,

  initialize: async () => {
    if (get().initialized) return;

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        set({ decisions: parsed, initialized: true });
      } else {
        // Seed with sample data
        set({ decisions: sampleDecisions, initialized: true });
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sampleDecisions));
      }
    } catch (error) {
      console.error('[DecisionsStore] Failed to initialize:', error);
      set({ decisions: sampleDecisions, initialized: true });
    }
  },

  addDecision: (decision) => {
    const newDecision: Decision = {
      ...decision,
      id: `dec-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    set((state) => {
      const updated = [...state.decisions, newDecision];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { decisions: updated };
    });
  },

  makeDecision: (decisionId, optionId, decidedBy) => {
    const decision = get().decisions.find(d => d.id === decisionId);
    const selectedOption = decision?.options?.find(o => o.id === optionId);

    // Create WorkPlans if the selected option specifies tasks
    const createdTaskIds: string[] = [];
    if (selectedOption?.tasksToCreate && decision?.workspaceId) {
      const workPlanStore = useWorkPlanStore.getState();
      const workspaceId = decision.workspaceId; // Capture for type safety

      selectedOption.tasksToCreate.forEach(taskSpec => {
        const dueDate = taskSpec.dueInDays
          ? new Date(Date.now() + taskSpec.dueInDays * 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(); // Default 2 weeks

        const newTask: WorkPlan = {
          id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          workspaceId: workspaceId,
          title: taskSpec.title,
          description: `${taskSpec.description}\n\n📋 Created from decision: ${decision.title}`,
          function: taskSpec.function,
          status: 'not-started',
          progress: 0,
          estimatedTimeUnits: taskSpec.estimatedTimeUnits,
          allocations: [],
          appliedAITools: [],
          tusExpended: 0,
          startDate: new Date().toISOString(),
          dueDate,
          assignedBy: decidedBy,
          needsSubmission: false,
          linkedDecisionId: decisionId, // Link back to the decision
        };

        workPlanStore.addWorkPlan(newTask);
        createdTaskIds.push(newTask.id);
      });
    }

    // Update the decision with the linked tasks
    set((state) => {
      const updated = state.decisions.map((d) =>
        d.id === decisionId
          ? {
              ...d,
              status: 'decided' as const,
              decidedOption: optionId,
              decidedAt: new Date().toISOString(),
              decidedBy,
              relatedTaskIds: [...(d.relatedTaskIds || []), ...createdTaskIds],
            }
          : d
      );
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { decisions: updated };
    });
  },

  deferDecision: (decisionId) => {
    set((state) => {
      const updated = state.decisions.map((d) =>
        d.id === decisionId ? { ...d, status: 'deferred' as const } : d
      );
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { decisions: updated };
    });
  },

  removeDecision: (decisionId) => {
    set((state) => {
      const updated = state.decisions.filter((d) => d.id !== decisionId);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { decisions: updated };
    });
  },

  getPendingDecisions: () => {
    return get().decisions.filter((d) => d.status === 'pending');
  },

  getUrgentDecisions: () => {
    return get()
      .decisions
      .filter((d) => d.status === 'pending')
      .sort((a, b) => {
        // Sort by urgency (critical > high > normal), then by deadline
        const urgencyOrder = { critical: 0, high: 1, normal: 2 };
        const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
        if (urgencyDiff !== 0) return urgencyDiff;

        if (a.deadline && b.deadline) {
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }
        if (a.deadline) return -1;
        if (b.deadline) return 1;
        return 0;
      });
  },

  getDecisionsByCategory: (category) => {
    return get().decisions.filter((d) => d.category === category);
  },
}));
