import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Target,
  Users,
  Briefcase,
  TrendingUp,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Bot,
  Factory,
  ArrowRight,
  BarChart3,
  Zap,
  Award,
  Sparkles,
  Building2,
  PlayCircle,
  Plus,
  DollarSign,
  TrendingDown,
  FileText,
  Download,
  PieChart,
  Lightbulb,
  Calendar,
  MessageSquare,
  HelpCircle,
  Activity,
  Trophy,
  ListOrdered,
  GripVertical,
  UserPlus,
  CalendarClock,
  Gauge,
} from 'lucide-react-native';
import { useCurrentWorkspace, useCurrentMembership, useCurrentUser } from '@/lib/state/app-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import type { Function as BusinessFunction } from '@/types';
import { getFinancialMetrics, getCostBreakdown } from '@/lib/financial-calculations';
import { useOKRStore } from '@/lib/state/okr-store';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useArmoryStore } from '@/lib/state/armory-store';
import { useCapacityStore } from '@/lib/state/capacity-store';
import { useMarketplaceRequestsStore } from '@/lib/state/marketplace-requests-store';
import { useRequestStore } from '@/lib/state/request-store';
import { THIRD_PARTY_AI_TOOLS } from '@/lib/third-party-ai-tools';
import { HelpModal, HelpButton, type HelpContent } from '@/components/HelpModal';
import { CapacityHeatMap } from '@/components/CapacityHeatMap';
import { CapacityBreakdownModal } from '@/components/CapacityBreakdownModal';
import { useMessagesStore, initializeDemoMessages } from '@/lib/state/messages-store';
import { useCalendarStore } from '@/lib/state/calendar-store';
import { GoalQuestionnaireModal } from '@/components/GoalQuestionnaireModal';
import { StrategyResultsModal } from '@/components/StrategyResultsModal';
import { CompanyAimModal } from '@/components/CompanyAimModal';
import { CompanyAimBanner } from '@/components/CompanyAimBanner';
import { useResourceStore } from '@/lib/state/resource-store';
import { getWeekCounterInfo } from '@/lib/time-utils';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

// Help content for each role
const FOUNDER_HELP: HelpContent = {
  title: 'Command Center',
  subtitle: 'Your startup dashboard',
  description: 'This is your central hub for monitoring your startup\'s health. Track OKRs, financials, team performance, and urgent items that need your attention.',
  tips: [
    'Check the "Attention Required" section first thing each day for urgent items',
    'Monitor runway and cash flow to ensure financial health',
    'Use the financial dashboard for deeper cost analysis',
    'Review pending approvals to unblock your team',
  ],
  quickActions: [
    { label: 'View Financial Dashboard', description: 'Tap the runway indicator to see detailed financial metrics and cost breakdowns' },
    { label: 'Review OKRs', description: 'Navigate to the Decide tab to review and adjust your strategic objectives' },
    { label: 'Access Calendar & Messages', description: 'Quick access to schedule and team communications' },
  ],
};

const EXECUTIVE_HELP: HelpContent = {
  title: 'Executive Dashboard',
  subtitle: 'Manage your function',
  description: 'As a Fractional Executive, this dashboard helps you oversee your function\'s work, manage apprentices, and track OKR progress in your domain.',
  tips: [
    'Review apprentice progress daily to catch blockers early',
    'Keep pending reviews under 3 days for optimal team velocity',
    'Use AI tools to boost your team\'s productivity',
    'Coordinate with other executives on cross-functional OKRs',
  ],
  quickActions: [
    { label: 'Review Work Plans', description: 'Check and approve work submitted by your apprentices' },
    { label: 'Manage AI Tools', description: 'Equip your team with AI tools to increase output quality' },
    { label: 'Track OKR Progress', description: 'Monitor how your function\'s OKRs are progressing' },
  ],
};

const APPRENTICE_HELP: HelpContent = {
  title: 'My Workspace',
  subtitle: 'Execute and deliver',
  description: 'This is your personal workspace where you can see your active work, track progress on your objectives, and stay connected with your executive and team.',
  tips: [
    'Focus on completing tasks that contribute to your linked OKR',
    'Update your work progress regularly so your executive can track status',
    'Use AI tools to help with research, writing, and analysis',
    'Reach out to your executive if you\'re blocked on anything',
  ],
  quickActions: [
    { label: 'View My Work', description: 'See all your active tasks and their deadlines' },
    { label: 'Ask AI for Help', description: 'Get AI assistance with your work tasks' },
    { label: 'Contact My Team', description: 'Message your executive or view team members' },
  ],
};

// Initialize stores once
if (useOKRStore.getState().okrs.length === 0) {
  useOKRStore.getState().initializeOKRs();
}
if (useWorkPlanStore.getState().workPlans.length === 0) {
  useWorkPlanStore.getState().initializeWorkPlans();
}
if (useOrganizationStore.getState().members.length === 0) {
  useOrganizationStore.getState().initializeOrganization();
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const currentWorkspace = useCurrentWorkspace();
  const currentMembership = useCurrentMembership();
  const currentUser = useCurrentUser();

  // Help modal state
  const [showHelp, setShowHelp] = useState(false);

  // Capacity breakdown modal state
  const [showCapacityModal, setShowCapacityModal] = useState(false);

  // Goal questionnaire modal states
  const [showGoalQuestionnaire, setShowGoalQuestionnaire] = useState(false);
  const [showStrategyResults, setShowStrategyResults] = useState(false);
  const [goalResponses, setGoalResponses] = useState<Record<string, string>>({});

  // Company aim modal state
  const [showCompanyAimModal, setShowCompanyAimModal] = useState(false);

  // Edit mode for draggable sections
  const [isEditMode, setIsEditMode] = useState(false);
  const wiggleRotation = useSharedValue(0);

  // Wiggle animation when in edit mode
  useEffect(() => {
    if (isEditMode) {
      wiggleRotation.value = withRepeat(
        withSequence(
          withTiming(1.5, { duration: 80 }),
          withTiming(-1.5, { duration: 80 }),
          withTiming(1.5, { duration: 80 }),
          withTiming(0, { duration: 80 })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(wiggleRotation);
      wiggleRotation.value = withTiming(0, { duration: 100 });
    }
  }, [isEditMode, wiggleRotation]);

  const wiggleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${wiggleRotation.value}deg` }],
  }));

  // Long press handler to enter edit mode
  const handleLongPress = useCallback(() => {
    setIsEditMode(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);

  const exitEditMode = useCallback(() => {
    setIsEditMode(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Use centralized stores - select primitive values to avoid infinite loops
  const okrs = useOKRStore(s => s.okrs);
  const workPlans = useWorkPlanStore(s => s.workPlans);
  const members = useOrganizationStore(s => s.members);
  const aiAgents = useOrganizationStore(s => s.aiAgents);
  const engagements = useOrganizationStore(s => s.supplierEngagements);
  const personLoadouts = useArmoryStore(s => s.personLoadouts);

  // Capacity store
  const calculateCapacity = useCapacityStore(s => s.calculateCapacity);
  const memberCapacities = useCapacityStore(s => s.memberCapacities);
  const teamCapacitySummary = useCapacityStore(s => s.teamSummary);

  // Messages and Calendar stores
  const allConversations = useMessagesStore(s => s.conversations);
  const getEventsForDateRange = useCalendarStore(s => s.getEventsForDateRange);

  // Filter conversations by workspace (memoized to prevent infinite loops)
  const conversations = useMemo(() => {
    return allConversations.filter(c => c.workspaceId === currentWorkspace?.id);
  }, [allConversations, currentWorkspace?.id]);

  // Initialize demo data on mount
  useEffect(() => {
    if (currentWorkspace?.id) {
      initializeDemoMessages(currentWorkspace.id);
    }
  }, [currentWorkspace?.id]);

  // Initialize resource store if empty
  const resourcePeople = useResourceStore(s => s.people);
  const seedResourceData = useResourceStore(s => s.seedDemoData);

  // Marketplace requests for pending approvals
  const allRequests = useMarketplaceRequestsStore(s => s.requests);
  const pendingRequests = useMemo(() => {
    return allRequests.filter(req => req.status === 'pending');
  }, [allRequests]);

  useEffect(() => {
    if (resourcePeople.length === 0 && currentWorkspace) {
      seedResourceData(currentWorkspace.id);
    }
  }, [resourcePeople.length, currentWorkspace]);

  // Calculate capacity on mount and when dependencies change
  useEffect(() => {
    // Build member AI tool IDs map
    const memberAIToolIds = new Map<string, string[]>();
    personLoadouts.forEach(loadout => {
      if (loadout.aiToolIds && loadout.aiToolIds.length > 0) {
        memberAIToolIds.set(loadout.memberId, loadout.aiToolIds);
      }
    });

    calculateCapacity(members, workPlans, THIRD_PARTY_AI_TOOLS, memberAIToolIds);
  }, [members, workPlans, personLoadouts, calculateCapacity]);

  // Get real-time financial metrics - SINGLE SOURCE OF TRUTH (memoized inside component)
  const financialMetrics = useMemo(() => getFinancialMetrics(), []);
  const costBreakdown = useMemo(() => getCostBreakdown(), []);

  // Calculate actual AI tool costs from person loadouts
  const actualAIToolCost = useMemo(() => {
    const allEquippedToolIds = personLoadouts.flatMap(loadout => loadout.aiToolIds || []);
    const uniqueToolIds = [...new Set(allEquippedToolIds)];

    return uniqueToolIds.reduce((total, toolId) => {
      const tool = THIRD_PARTY_AI_TOOLS.find(t => t.id === toolId);
      return total + (tool?.costPerMonth || 0);
    }, 0);
  }, [personLoadouts]);

  // Adjust monthly burn to use actual AI tool costs
  const adjustedMonthlyBurn = useMemo(() => {
    return financialMetrics.monthlyBurn - costBreakdown.aiTools + actualAIToolCost;
  }, [financialMetrics.monthlyBurn, costBreakdown.aiTools, actualAIToolCost]);

  // Recalculate runway with adjusted burn
  const adjustedRunway = useMemo(() => {
    if (adjustedMonthlyBurn <= 0) return 999; // No burn means infinite runway

    const adjustedNetCashFlow = financialMetrics.monthlyRevenue - adjustedMonthlyBurn;

    // If we have positive cash flow, runway is infinite
    if (adjustedNetCashFlow >= 0) {
      return 999;
    }

    // If we're burning cash, calculate months until we run out
    const monthlyNetBurn = Math.abs(adjustedNetCashFlow);
    return financialMetrics.cashPosition / monthlyNetBurn;
  }, [financialMetrics.cashPosition, financialMetrics.monthlyRevenue, adjustedMonthlyBurn]);

  // Recalculate net cash flow with adjusted burn
  const adjustedNetCashFlow = useMemo(() => {
    return financialMetrics.monthlyRevenue - adjustedMonthlyBurn;
  }, [financialMetrics.monthlyRevenue, adjustedMonthlyBurn]);

  // Memoize counts to prevent re-renders
  const okrCounts = useMemo(() => ({
    total: okrs.length,
    onTrack: okrs.filter(o => o.status === 'on-track').length,
    atRisk: okrs.filter(o => o.status === 'at-risk').length,
    offTrack: okrs.filter(o => o.status === 'off-track').length,
  }), [okrs]);

  const workPlanCounts = useMemo(() => ({
    total: workPlans.length,
    active: workPlans.filter(wp => wp.status !== 'completed').length,
    inProgress: workPlans.filter(wp => wp.status === 'in-progress').length,
    completed: workPlans.filter(wp => wp.status === 'completed').length,
    blocked: workPlans.filter(wp => wp.status === 'blocked').length,
  }), [workPlans]);

  const orgCounts = useMemo(() => ({
    executives: members.filter(m => m.role === 'FractionalExec' && m.status === 'active').length,
    apprentices: members.filter(m => m.role === 'Apprentice' && m.status === 'active').length,
    activeAI: (aiAgents || []).filter(a => a.status === 'active').length,
  }), [members, aiAgents]);

  // Calculate OKRs by function
  const okrsByFunction = useMemo(() => {
    const functions: BusinessFunction[] = ['Marketing', 'Sales', 'Engineering', 'Ops', 'Finance', 'Admin'];
    return functions.map(func => {
      const functionOKRs = okrs.filter(okr => okr.function === func);
      const avgProgress = functionOKRs.length > 0
        ? Math.round(functionOKRs.reduce((sum, okr) => {
            const okrProgress = okr.objectives.reduce((oSum, obj) => oSum + obj.progress, 0) / okr.objectives.length;
            return sum + okrProgress;
          }, 0) / functionOKRs.length)
        : 0;

      // Determine overall status for the function
      const statuses = functionOKRs.map(okr => okr.status);
      const status = statuses.includes('off-track') ? 'off-track'
        : statuses.includes('at-risk') ? 'at-risk'
        : 'on-track';

      return {
        function: func,
        okrs: functionOKRs.length,
        status,
        progress: avgProgress,
      };
    }).filter(item => item.okrs > 0); // Only show functions with OKRs
  }, [okrs]);

  // Task/OKR requests
  const taskOKRRequests = useRequestStore(s => s.requests);
  const initializeDemoRequests = useRequestStore(s => s.initializeDemoRequests);

  // Initialize demo requests on mount
  useEffect(() => {
    if (taskOKRRequests.length === 0) {
      initializeDemoRequests();
    }
  }, []);

  const pendingTaskOKRRequests = useMemo(() => {
    return taskOKRRequests.filter(req => req.status === 'pending');
  }, [taskOKRRequests]);

  // Calculate urgent items that need attention (moved from Decide tab)
  const urgentItems = useMemo(() => {
    const offTrackOKRs = okrs.filter(o => o.status === 'off-track');
    const atRiskOKRs = okrs.filter(o => o.status === 'at-risk');
    const blockedPlans = workPlans.filter(wp => wp.status === 'blocked');
    const pendingSubmissions = workPlans.filter(wp => wp.status === 'in-progress' && wp.progress >= 90);

    // OKRs without any linked work plans (need resource allocation)
    const okrsWithoutPlans = okrs.filter(okr => {
      const linkedPlans = workPlans.filter(wp => wp.linkedOKRTitle === okr.title);
      return linkedPlans.length === 0;
    });

    // Stalled work plans - in progress but low completion
    const stalledPlans = workPlans.filter(wp =>
      wp.status === 'in-progress' && wp.progress < 10
    );

    return {
      offTrackOKRs,
      atRiskOKRs,
      blockedPlans,
      pendingSubmissions,
      okrsWithoutPlans,
      stalledPlans,
      pendingApprovals: pendingRequests.length,
      pendingTaskOKRRequests,
      totalUrgent: offTrackOKRs.length + blockedPlans.length + pendingRequests.length + pendingTaskOKRRequests.length,
      totalWarning: atRiskOKRs.length + okrsWithoutPlans.length + stalledPlans.length,
    };
  }, [okrs, workPlans, pendingRequests, pendingTaskOKRRequests]);

  // Get recent messages (top 2)
  const recentMessages = useMemo(() => {
    return conversations
      .filter(conv => conv.lastMessage)
      .sort((a, b) => {
        const aTime = a.lastMessage?.timestamp.getTime() || 0;
        const bTime = b.lastMessage?.timestamp.getTime() || 0;
        return bTime - aTime;
      })
      .slice(0, 2);
  }, [conversations]);

  // Get upcoming calendar events (next 2 business days)
  const upcomingEvents = useMemo(() => {
    if (!currentWorkspace?.id) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate 2 business days ahead
    let businessDaysCount = 0;
    let currentDate = new Date(today);
    let endDate = new Date(today);

    while (businessDaysCount < 2) {
      currentDate.setDate(currentDate.getDate() + 1);
      const dayOfWeek = currentDate.getDay();
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        businessDaysCount++;
        endDate = new Date(currentDate);
      }
    }
    endDate.setHours(23, 59, 59, 999);

    const events = getEventsForDateRange(currentWorkspace.id, today, endDate);
    return events
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 2);
  }, [currentWorkspace?.id, getEventsForDateRange]);

  // Calculate tasks due soon (Founder view - across all functions)
  const tasksDueSoon = useMemo(() => {
    const today = new Date();
    const activePlans = workPlans.filter(wp => wp.status !== 'completed');

    const dueTodayOrOverdue = activePlans.filter(wp => {
      const dueDate = new Date(wp.dueDate);
      return dueDate <= today;
    });

    const dueThisWeek = activePlans.filter(wp => {
      const dueDate = new Date(wp.dueDate);
      const weekFromNow = new Date(today);
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return dueDate > today && dueDate <= weekFromNow;
    });

    // Get tasks awaiting executive review
    const awaitingReview = workPlans.filter(wp =>
      wp.status === 'in-progress' && wp.progress >= 90
    );

    return {
      overdue: dueTodayOrOverdue.length,
      thisWeek: dueThisWeek.length,
      awaitingReview: awaitingReview.length,
      topUrgent: [...dueTodayOrOverdue, ...dueThisWeek]
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 3),
    };
  }, [workPlans]);

  // Calculate workload by role (Founder view)
  const workloadByRole = useMemo(() => {
    const activePlans = workPlans.filter(wp => wp.status !== 'completed');

    // Group by assignee function to estimate role distribution
    const founderTasks = activePlans.filter(wp => wp.function === 'Admin' || !wp.function).length;
    const execTasks = activePlans.filter(wp => ['Marketing', 'Sales', 'Finance', 'Engineering', 'Ops'].includes(wp.function || '')).length;
    const apprenticeTasks = activePlans.length; // All tasks eventually flow to apprentices

    return {
      founder: founderTasks,
      executives: execTasks,
      apprentices: apprenticeTasks,
    };
  }, [workPlans]);

  // Demo data for the dashboard - now using centralized stores
  const FOUNDER_DATA = {
    okrs: okrCounts,
    workPlans: {
      total: workPlanCounts.total,
      active: workPlanCounts.active,
      inProgress: workPlanCounts.inProgress,
      completed: workPlanCounts.completed,
      blocked: workPlanCounts.blocked,
    },
    team: {
      executives: orgCounts.executives,
      apprentices: orgCounts.apprentices,
      aiAgents: orgCounts.activeAI,
    },
    financials: {
      runway: adjustedRunway,
      burnRate: adjustedMonthlyBurn,
      revenue: financialMetrics.monthlyRevenue,
      netCashFlow: adjustedNetCashFlow,
    },
    pendingApprovals: 1, // This would need a separate approval store in the future
  };

  // Executive data - derived from stores based on current user
  const executiveData = useMemo(() => {
    // Find current user's function (if they're an executive)
    const currentMember = members.find(m => m.name === currentUser?.name);
    const myFunction = currentMember?.function || 'Marketing';

    // Get work plans in my function (assigned by executives in my function)
    const functionWorkPlans = workPlans.filter(wp => wp.function === myFunction);
    const myInProgress = functionWorkPlans.filter(wp => wp.status === 'in-progress').length;
    const myCompleted = functionWorkPlans.filter(wp => wp.status === 'completed').length;

    // Separate: Tasks I'm doing directly vs tasks I'm overseeing (apprentice work)
    const myOwnTasks = functionWorkPlans.filter(wp =>
      wp.assignedBy === currentMember?.name || wp.status === 'not-started'
    );
    const overseeingTasks = functionWorkPlans.filter(wp =>
      wp.assignedBy !== currentMember?.name && wp.status !== 'not-started'
    );

    // Get my next action - highest priority task
    const today = new Date();
    const sortedOwnTasks = myOwnTasks
      .filter(wp => wp.status !== 'completed')
      .sort((a, b) => {
        const aDue = new Date(a.dueDate).getTime();
        const bDue = new Date(b.dueDate).getTime();
        return aDue - bDue;
      });
    const nextAction = sortedOwnTasks[0] || null;

    // Get tasks due today/this week for executive
    const tasksDueToday = functionWorkPlans.filter(wp => {
      const dueDate = new Date(wp.dueDate);
      return dueDate <= today && wp.status !== 'completed';
    }).length;

    const tasksDueThisWeek = functionWorkPlans.filter(wp => {
      const dueDate = new Date(wp.dueDate);
      const weekFromNow = new Date(today);
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return dueDate > today && dueDate <= weekFromNow && wp.status !== 'completed';
    }).length;

    // Get apprentices in my function
    const myApprentices = members
      .filter(m => m.role === 'Apprentice' && m.function === myFunction && m.status === 'active')
      .map(apprentice => {
        const apprenticeWorkPlans = workPlans.filter(wp => wp.assignedBy === apprentice.name || wp.function === myFunction);
        const avgProgress = apprenticeWorkPlans.length > 0
          ? Math.round(apprenticeWorkPlans.reduce((sum, wp) => sum + wp.progress, 0) / apprenticeWorkPlans.length)
          : 0;
        return {
          name: apprentice.name,
          workPlans: apprenticeWorkPlans.filter(wp => wp.function === myFunction).length,
          progress: avgProgress,
        };
      });

    // Get pending reviews (work plans ready for review)
    const pendingReviews = workPlans.filter(wp =>
      wp.status === 'in-progress' &&
      wp.progress >= 90 &&
      wp.function === myFunction
    ).length;

    // Get OKRs for my function
    const functionOKRs = okrs.filter(okr => okr.function === myFunction);

    // Calculate OKR health summary
    const okrHealth = {
      onTrack: functionOKRs.filter(o => o.status === 'on-track').length,
      atRisk: functionOKRs.filter(o => o.status === 'at-risk').length,
      offTrack: functionOKRs.filter(o => o.status === 'off-track').length,
    };

    // Get my capacity from the capacity store
    const myCapacity = memberCapacities.find(mc => mc.memberId === currentMember?.id);

    // Get AI tools from armory
    const myLoadout = personLoadouts.find(l => l.memberId === currentMember?.id);
    const equippedToolIds = myLoadout?.aiToolIds || [];
    const equippedTools = equippedToolIds
      .map(id => THIRD_PARTY_AI_TOOLS.find(t => t.id === id)?.name)
      .filter(Boolean) as string[];

    return {
      myWorkPlans: {
        total: functionWorkPlans.length,
        inProgress: myInProgress,
        completed: myCompleted,
      },
      myOwnTasks: {
        total: myOwnTasks.filter(t => t.status !== 'completed').length,
        inProgress: myOwnTasks.filter(t => t.status === 'in-progress').length,
      },
      overseeingTasks: {
        total: overseeingTasks.filter(t => t.status !== 'completed').length,
        awaitingReview: overseeingTasks.filter(t => t.progress >= 90).length,
      },
      nextAction,
      tasksDueToday,
      tasksDueThisWeek,
      apprentices: myApprentices.slice(0, 3), // Show max 3
      pendingReviews,
      myFunction: myFunction as BusinessFunction,
      linkedOKRs: functionOKRs.length,
      okrHealth,
      myCapacity,
      aiUsage: {
        thisWeek: equippedTools.length * 4, // Approximate usage
        tools: equippedTools.slice(0, 3),
      },
      aiAgents: aiAgents.filter(a => a.status === 'active').slice(0, 3),
    };
  }, [members, workPlans, okrs, currentUser, personLoadouts, aiAgents, memberCapacities]);

  // Apprentice data - derived from stores based on current user
  const apprenticeData = useMemo(() => {
    // Find current user's member record
    const currentMember = members.find(m => m.name === currentUser?.name);
    const myFunction = currentMember?.function || 'Marketing';

    // Get work plans in my function (for the apprentice)
    const myWorkPlans = workPlans.filter(wp => wp.function === myFunction);
    const activeCount = myWorkPlans.filter(wp => wp.status !== 'completed').length;
    const completedCount = myWorkPlans.filter(wp => wp.status === 'completed').length;

    // Tasks by status
    const inProgress = myWorkPlans.filter(wp => wp.status === 'in-progress');
    const awaitingReview = inProgress.filter(wp => wp.progress >= 90);
    const readyToSubmit = inProgress.filter(wp => wp.progress >= 80 && wp.progress < 90);

    // Calculate urgency - due today/soon
    const today = new Date();
    const dueTodayOrOverdue = myWorkPlans.filter(wp => {
      const dueDate = new Date(wp.dueDate);
      return dueDate <= today && wp.status !== 'completed';
    });

    const dueThisWeek = myWorkPlans.filter(wp => {
      const dueDate = new Date(wp.dueDate);
      const weekFromNow = new Date(today);
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return dueDate > today && dueDate <= weekFromNow && wp.status !== 'completed';
    });

    // Next task to work on (highest priority)
    const nextTask = myWorkPlans
      .filter(wp => wp.status !== 'completed')
      .sort((a, b) => {
        // Priority: overdue first, then by due date
        const aDue = new Date(a.dueDate).getTime();
        const bDue = new Date(b.dueDate).getTime();
        return aDue - bDue;
      })[0] || null;

    // Find my executive (supervisor)
    const myExecutive = members.find(m =>
      m.role === 'FractionalExec' &&
      m.function === myFunction &&
      m.status === 'active'
    );

    // Find the founder
    const founder = members.find(m => m.role === 'Founder' && m.status === 'active');

    // Get linked OKR for my function
    const myOKR = okrs.find(okr => okr.function === myFunction);
    const okrProgress = myOKR
      ? Math.round(myOKR.objectives.reduce((sum, obj) => sum + obj.progress, 0) / myOKR.objectives.length)
      : 0;

    // Recent work - my active work plans sorted by due date
    const recentWork = myWorkPlans
      .filter(wp => wp.status !== 'completed')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 3)
      .map(wp => ({
        id: wp.id,
        title: wp.title,
        progress: wp.progress,
        dueDate: wp.dueDate,
        status: wp.status,
      }));

    // Get my AI tools from armory
    const myLoadout = personLoadouts.find(l => l.memberId === currentMember?.id);
    const equippedToolIds = myLoadout?.aiToolIds || [];
    const equippedTools = equippedToolIds
      .map(id => THIRD_PARTY_AI_TOOLS.find(t => t.id === id)?.name)
      .filter(Boolean) as string[];

    // Team members I work with
    const teamMembers: Array<{ name: string; role: 'Executive' | 'Founder'; function?: string }> = [];
    if (myExecutive) {
      teamMembers.push({ name: myExecutive.name, role: 'Executive', function: myFunction });
    }
    if (founder) {
      teamMembers.push({ name: founder.name, role: 'Founder', function: undefined });
    }

    // Get my capacity from the capacity store
    const myCapacity = memberCapacities.find(mc => mc.memberId === currentMember?.id);

    // Calculate streak (consecutive completions)
    const completedTasks = myWorkPlans.filter(wp => wp.status === 'completed');
    const streak = Math.min(completedTasks.length, 5); // Cap at 5 for display

    return {
      myWorkPlans: {
        active: activeCount,
        completed: completedCount,
        inProgress: inProgress.length,
      },
      awaitingReview: awaitingReview.length,
      readyToSubmit: readyToSubmit.length,
      dueTodayOrOverdue: dueTodayOrOverdue.length,
      dueThisWeek: dueThisWeek.length,
      nextTask,
      assignedBy: {
        executive: myExecutive?.name || 'Not assigned',
        founder: founder?.name || 'Not assigned',
      },
      linkedOKR: myOKR ? {
        title: myOKR.title,
        function: myOKR.function,
        progress: okrProgress,
        status: myOKR.status,
      } : {
        title: 'No OKR assigned',
        function: myFunction as BusinessFunction,
        progress: 0,
        status: 'on-track' as const,
      },
      recentWork: recentWork.length > 0 ? recentWork : [
        { id: '0', title: 'No active work plans', progress: 0, dueDate: new Date().toISOString().split('T')[0], status: 'not-started' as const }
      ],
      aiTools: equippedTools.length > 0 ? equippedTools : ['No tools equipped'],
      teamMembers,
      myCapacity,
      streak,
    };
  }, [members, workPlans, okrs, currentUser, personLoadouts, memberCapacities]);

  const [isLoading] = useState(false);

  if (isLoading) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!currentMembership || !currentWorkspace) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-950 items-center justify-center p-6">
        <Text className="text-gray-600 dark:text-slate-400 text-center">
          No workspace selected
        </Text>
      </View>
    );
  }

  const role = currentMembership.role;
  const isFounder = role === 'Founder';
  const isExecutive = role === 'FractionalExec';
  const isApprentice = role === 'Apprentice';

  const getRoleColor = () => {
    if (isFounder) return '#8b5cf6';
    if (isExecutive) return '#3b82f6';
    return '#10b981';
  };

  const getRoleGradient = (): [string, string] => {
    if (isFounder) return ['#8b5cf6', '#6366f1'];
    if (isExecutive) return ['#3b82f6', '#2563eb'];
    return ['#10b981', '#059669'];
  };

  const getFunctionColor = (func: BusinessFunction) => {
    switch (func) {
      case 'Marketing':
        return '#f59e0b';
      case 'Sales':
        return '#ec4899';
      case 'Engineering':
        return '#3b82f6';
      case 'Ops':
        return '#8b5cf6';
      case 'Finance':
        return '#10b981';
      case 'Admin':
        return '#64748b';
      default:
        return '#64748b';
    }
  };

  // Goal questionnaire handlers
  const handleGoalQuestionnaireComplete = (responses: Record<string, string>) => {
    setGoalResponses(responses);
    setShowGoalQuestionnaire(false);
    setShowStrategyResults(true);
  };

  const handleCreateOKRs = (okrRecommendations: any[]) => {
    if (!currentWorkspace || !currentUser) return;

    // Add each OKR recommendation to the store
    const addOKR = useOKRStore.getState().addOKR;

    okrRecommendations.forEach((recommendation, index) => {
      const newOKR = {
        id: `okr-generated-${Date.now()}-${index}`,
        workspaceId: currentWorkspace.id,
        function: recommendation.function as BusinessFunction,
        title: recommendation.title,
        description: recommendation.objective,
        owner: currentUser.name,
        startDate: recommendation.quarter,
        endDate: recommendation.quarter,
        status: 'on-track' as const,
        objectives: recommendation.keyResults.map((kr: string, krIndex: number) => ({
          id: `kr-generated-${Date.now()}-${index}-${krIndex}`,
          title: kr,
          target: '100',
          current: '0',
          progress: 0,
          status: 'on-track' as const,
        })),
      };

      addOKR(newOKR);
    });

    // Close modal and navigate to Decide tab
    setShowStrategyResults(false);
    router.push('/(tabs)/decide');
  };

  // Founder View
  if (isFounder) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-950">
        {/* Help Modal */}
        <HelpModal
          visible={showHelp}
          onClose={() => setShowHelp(false)}
          content={FOUNDER_HELP}
          gradientColors={['#8b5cf6', '#6366f1']}
        />

        <CapacityBreakdownModal
          visible={showCapacityModal}
          onClose={() => setShowCapacityModal(false)}
          memberCapacities={memberCapacities}
          totalAvailableTU={teamCapacitySummary.totalAvailableTU}
        />

        {/* Goal Questionnaire Modals */}
        <GoalQuestionnaireModal
          visible={showGoalQuestionnaire}
          onClose={() => setShowGoalQuestionnaire(false)}
          onComplete={handleGoalQuestionnaireComplete}
        />

        <StrategyResultsModal
          visible={showStrategyResults}
          onClose={() => setShowStrategyResults(false)}
          responses={goalResponses}
          onCreateOKRs={handleCreateOKRs}
        />

        {/* Company Aim Modal */}
        <CompanyAimModal
          visible={showCompanyAimModal}
          onClose={() => setShowCompanyAimModal(false)}
          workspaceId={currentWorkspace.id}
        />

        {/* Role Header - Compact with Key Metrics */}
        <LinearGradient
          colors={getRoleGradient()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ paddingHorizontal: 24, paddingTop: insets.top + 16, paddingBottom: 16 }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-1">
              <Text className="text-white/70 text-xs font-medium">COMMAND CENTER</Text>
              <Text className="text-white text-xl font-bold">
                {currentWorkspace.name}
              </Text>
              {/* Week Counter */}
              {(() => {
                const weekInfo = getWeekCounterInfo(currentWorkspace.createdAt);
                return (
                  <View className="mt-1 flex-row items-center gap-2">
                    <View className="bg-white/20 px-2 py-1 rounded">
                      <Text className="text-white text-[10px] font-semibold">
                        {weekInfo.displayText}
                      </Text>
                    </View>
                    {weekInfo.weeksSinceFounding > 0 && (
                      <View className="bg-purple-500/40 px-2 py-1 rounded">
                        <Text className="text-white text-[10px] font-semibold">
                          {weekInfo.foundingText}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })()}
            </View>
            <View className="flex-row items-center gap-2">
              <HelpButton onPress={() => setShowHelp(true)} />
              <Pressable
                onPress={() => router.push('/tu-dashboard')}
                className="bg-purple-500/30 px-3 py-2 rounded-xl active:opacity-70 border border-purple-400/50"
              >
                <View className="flex-row items-center gap-1">
                  <Gauge size={14} color="#e9d5ff" />
                  <Text className="text-purple-100 text-xs font-medium">TU</Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => router.push('/financial-dashboard')}
                className="bg-white/20 px-3 py-2 rounded-xl active:opacity-70"
              >
                <Text className="text-white/80 text-xs font-medium">RUNWAY</Text>
                <Text className="text-white text-lg font-bold">
                  {FOUNDER_DATA.financials.runway >= 999 ? '∞' : `${FOUNDER_DATA.financials.runway.toFixed(0)}mo`}
                </Text>
              </Pressable>
            </View>
          </View>
          {/* Quick Health Indicators */}
          <View className="flex-row gap-4">
            <View className="flex-row items-center">
              <View className={`w-2 h-2 rounded-full mr-1.5 ${urgentItems.totalUrgent > 0 ? 'bg-red-400' : 'bg-emerald-400'}`} />
              <Text className="text-white/90 text-xs">
                {FOUNDER_DATA.okrs.onTrack}/{FOUNDER_DATA.okrs.total} OKRs on track
              </Text>
            </View>
            <View className="flex-row items-center">
              <View className={`w-2 h-2 rounded-full mr-1.5 ${FOUNDER_DATA.financials.netCashFlow >= 0 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <Text className="text-white/90 text-xs">
                {FOUNDER_DATA.financials.netCashFlow >= 0 ? '+' : ''}£{(FOUNDER_DATA.financials.netCashFlow / 1000).toFixed(0)}K/mo
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Edit Mode Banner */}
        {isEditMode && (
          <View className="bg-purple-600 py-3 px-5 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <GripVertical size={18} color="#fff" />
              <Text className="text-white font-semibold ml-2">Editing Layout - Hold & Drag to Reorder</Text>
            </View>
            <Pressable
              onPress={exitEditMode}
              className="bg-white/20 px-4 py-1.5 rounded-full active:opacity-70"
            >
              <Text className="text-white font-semibold">Done</Text>
            </Pressable>
          </View>
        )}

        <ScrollView className="flex-1">
          <View className="px-5 py-4">
            {/* Company Aim Banner - Long press to edit layout */}
            <Pressable onLongPress={handleLongPress} delayLongPress={400}>
              <Animated.View style={isEditMode ? wiggleStyle : undefined}>
                <CompanyAimBanner
                  workspaceId={currentWorkspace.id}
                  onEdit={() => !isEditMode && setShowCompanyAimModal(true)}
                />
                {isEditMode && (
                  <View className="absolute -left-1 top-0 bottom-0 justify-center">
                    <View className="bg-purple-600/90 rounded-l-lg p-1.5">
                      <GripVertical size={14} color="#fff" />
                    </View>
                  </View>
                )}
              </Animated.View>
            </Pressable>

            {/* RECENT MESSAGES */}
            {recentMessages.length > 0 && (
              <View className="mb-4">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-gray-500 dark:text-slate-500 text-xs font-bold tracking-wide">
                    RECENT MESSAGES
                  </Text>
                  <Pressable onPress={() => router.push('/messages')}>
                    <Text className="text-blue-500 text-xs font-semibold">View All</Text>
                  </Pressable>
                </View>

                <View className="gap-2">
                  {recentMessages.map((conv) => (
                    <Pressable
                      key={conv.id}
                      onPress={() => router.push('/messages')}
                      className="bg-gray-100 dark:bg-slate-900 rounded-xl p-3 active:opacity-70"
                    >
                      <View className="flex-row items-start justify-between mb-1">
                        <View className="flex-1">
                          <Text className="text-gray-900 dark:text-white font-semibold text-sm mb-0.5">
                            {conv.name}
                          </Text>
                          <Text className="text-gray-600 dark:text-slate-400 text-xs" numberOfLines={2}>
                            {conv.lastMessage?.content}
                          </Text>
                        </View>
                        {conv.unreadCount > 0 && (
                          <View className="bg-blue-500 rounded-full w-5 h-5 items-center justify-center ml-2">
                            <Text className="text-white text-xs font-bold">{conv.unreadCount}</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-gray-500 dark:text-slate-500 text-xs">
                        {new Date(conv.lastMessage?.timestamp || '').toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* ATTENTION REQUIRED - Most Critical (moved from Decide tab) */}
            {(urgentItems.totalUrgent > 0 || urgentItems.totalWarning > 0) && (
              <View className="mb-4">
                <Text className="text-red-600 dark:text-red-400 text-xs font-bold mb-2 tracking-wide">
                  NEEDS YOUR DECISION
                </Text>
                <View className="gap-2">
                  {/* Off-Track OKRs - Critical */}
                  {urgentItems.offTrackOKRs.map((okr) => (
                    <Pressable
                      key={okr.id}
                      onPress={() => router.push(`/okr-planner?okrId=${okr.id}`)}
                      className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 active:opacity-70"
                    >
                      <View className="flex-row items-center">
                        <View className="w-9 h-9 bg-red-500 rounded-lg items-center justify-center">
                          <TrendingDown size={18} color="#fff" />
                        </View>
                        <View className="ml-3 flex-1">
                          <Text className="text-red-900 dark:text-red-100 font-bold text-sm" numberOfLines={1}>
                            {okr.title}
                          </Text>
                          <Text className="text-red-700 dark:text-red-300 text-xs">
                            {okr.function} • Off-track • Needs intervention
                          </Text>
                        </View>
                        <ArrowRight size={16} color="#ef4444" />
                      </View>
                    </Pressable>
                  ))}

                  {/* Blocked Work Plans */}
                  {urgentItems.blockedPlans.map((wp) => (
                    <Pressable
                      key={wp.id}
                      onPress={() => router.push('/(tabs)/do')}
                      className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 active:opacity-70"
                    >
                      <View className="flex-row items-center">
                        <View className="w-9 h-9 bg-amber-500 rounded-lg items-center justify-center">
                          <AlertCircle size={18} color="#fff" />
                        </View>
                        <View className="ml-3 flex-1">
                          <Text className="text-amber-900 dark:text-amber-100 font-bold text-sm" numberOfLines={1}>
                            {wp.title}
                          </Text>
                          <Text className="text-amber-700 dark:text-amber-300 text-xs">
                            {wp.function} • Blocked • Team waiting
                          </Text>
                        </View>
                        <ArrowRight size={16} color="#f59e0b" />
                      </View>
                    </Pressable>
                  ))}

                  {/* Pending Hiring Requests */}
                  {pendingRequests.length > 0 && (
                    <Pressable
                      onPress={() => router.push('/(tabs)/decide?showApprovalQueue=true')}
                      className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-3 active:opacity-70"
                    >
                      <View className="flex-row items-center">
                        <View className="w-9 h-9 bg-purple-500 rounded-lg items-center justify-center">
                          <UserPlus size={18} color="#fff" />
                        </View>
                        <View className="ml-3 flex-1">
                          <Text className="text-purple-900 dark:text-purple-100 font-bold text-sm">
                            {pendingRequests.length} Hiring Request{pendingRequests.length > 1 ? 's' : ''}
                          </Text>
                          <Text className="text-purple-700 dark:text-purple-300 text-xs">
                            Marketplace candidates awaiting approval
                          </Text>
                        </View>
                        <ArrowRight size={16} color="#a855f7" />
                      </View>
                    </Pressable>
                  )}

                  {/* Pending Task/OKR Requests */}
                  {urgentItems.pendingTaskOKRRequests.map((request) => (
                    <Pressable
                      key={request.id}
                      onPress={() => router.push('/(tabs)/decide')}
                      className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-3 active:opacity-70"
                    >
                      <View className="flex-row items-center">
                        <View className="w-9 h-9 bg-indigo-500 rounded-lg items-center justify-center">
                          {request.type === 'okr' ? <Target size={18} color="#fff" /> : <Briefcase size={18} color="#fff" />}
                        </View>
                        <View className="ml-3 flex-1">
                          <Text className="text-indigo-900 dark:text-indigo-100 font-bold text-sm" numberOfLines={1}>
                            {request.title}
                          </Text>
                          <Text className="text-indigo-700 dark:text-indigo-300 text-xs">
                            {request.type.toUpperCase()} • Requested by {request.requestedByName}
                          </Text>
                        </View>
                        <ArrowRight size={16} color="#6366f1" />
                      </View>
                    </Pressable>
                  ))}
                </View>

                {/* NEEDS REVIEW Section */}
                {urgentItems.totalWarning > 0 && (
                  <View className="mt-3">
                    <Text className="text-amber-600 dark:text-amber-400 text-xs font-bold mb-2 tracking-wide">
                      NEEDS REVIEW
                    </Text>
                    <View className="gap-2">
                      {/* At-Risk OKRs */}
                      {urgentItems.atRiskOKRs.slice(0, 3).map((okr) => (
                        <Pressable
                          key={okr.id}
                          onPress={() => router.push('/(tabs)/decide')}
                          className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 active:opacity-70"
                        >
                          <View className="flex-row items-center">
                            <View className="w-8 h-8 bg-yellow-500 rounded-lg items-center justify-center">
                              <AlertTriangle size={16} color="#fff" />
                            </View>
                            <View className="ml-3 flex-1">
                              <Text className="text-yellow-900 dark:text-yellow-100 font-semibold text-sm" numberOfLines={1}>
                                {okr.title}
                              </Text>
                              <Text className="text-yellow-700 dark:text-yellow-300 text-xs">
                                {okr.function} • At risk
                              </Text>
                            </View>
                            <ArrowRight size={16} color="#eab308" />
                          </View>
                        </Pressable>
                      ))}

                      {/* OKRs Without Resource Plans */}
                      {urgentItems.okrsWithoutPlans.slice(0, 2).map((okr) => (
                        <Pressable
                          key={okr.id}
                          onPress={() => router.push(`/okr-planner?okrId=${okr.id}`)}
                          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 active:opacity-70"
                        >
                          <View className="flex-row items-center">
                            <View className="w-8 h-8 bg-blue-500 rounded-lg items-center justify-center">
                              <CalendarClock size={16} color="#fff" />
                            </View>
                            <View className="ml-3 flex-1">
                              <Text className="text-blue-900 dark:text-blue-100 font-semibold text-sm" numberOfLines={1}>
                                {okr.title}
                              </Text>
                              <Text className="text-blue-700 dark:text-blue-300 text-xs">
                                {okr.function} • No resource plan
                              </Text>
                            </View>
                            <Text className="text-blue-500 text-xs font-semibold">Plan →</Text>
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* DEFINE YOUR GOALS - Strategic Planning */}
            <View className="mb-4">
              <Pressable
                onPress={() => setShowGoalQuestionnaire(true)}
                className="active:opacity-70"
              >
                <LinearGradient
                  colors={['#8b5cf6', '#6366f1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 16, padding: 20 }}
                >
                  <View className="flex-row items-center mb-3">
                    <View className="w-12 h-12 bg-white/20 rounded-xl items-center justify-center">
                      <Target size={24} color="#fff" />
                    </View>
                    <View className="flex-1 ml-4">
                      <Text className="text-white font-bold text-lg">Define Your Goals</Text>
                      <Text className="text-white/80 text-sm">
                        5-minute strategic questionnaire
                      </Text>
                    </View>
                    <ArrowRight size={20} color="#fff" />
                  </View>

                  <View className="bg-white/10 rounded-xl p-3">
                    <Text className="text-white/90 text-xs leading-relaxed mb-2">
                      Answer 5 strategic questions about your vision, metrics, and priorities. Our AI will generate actionable next steps and OKR recommendations.
                    </Text>
                    <View className="flex-row items-center">
                      <Sparkles size={14} color="#fff" />
                      <Text className="text-white font-semibold text-xs ml-1.5">
                        AI-Powered Strategic Planning
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </Pressable>
            </View>

            {/* QUICK ACTIONS */}
            <Pressable onLongPress={handleLongPress} delayLongPress={400}>
              <Animated.View style={isEditMode ? wiggleStyle : undefined} className="relative">
                <View className="mb-4">
                  <Text className="text-gray-500 dark:text-slate-500 text-xs font-bold mb-2 tracking-wide">
                    QUICK ACTIONS
                  </Text>
                  <View className="flex-row gap-2 mb-2">
                    <Pressable
                      onPress={() => !isEditMode && router.push('/(tabs)/decide')}
                      className="flex-1 bg-purple-500 rounded-xl p-3 active:opacity-70"
                    >
                      <View className="flex-row items-center justify-center">
                        <Plus size={18} color="#fff" />
                        <Text className="text-white font-bold text-sm ml-1.5">New OKR</Text>
                      </View>
                    </Pressable>
                    <Pressable
                      onPress={() => !isEditMode && router.push('/(tabs)/evaluate')}
                      className="flex-1 bg-blue-500 rounded-xl p-3 active:opacity-70"
                    >
                      <View className="flex-row items-center justify-center">
                        <CheckCircle2 size={18} color="#fff" />
                        <Text className="text-white font-bold text-sm ml-1.5">Review</Text>
                      </View>
                    </Pressable>
                    <Pressable
                      onPress={() => !isEditMode && router.push('/financial-dashboard')}
                      className="flex-1 bg-emerald-500 rounded-xl p-3 active:opacity-70"
                    >
                      <View className="flex-row items-center justify-center">
                        <DollarSign size={18} color="#fff" />
                        <Text className="text-white font-bold text-sm ml-1.5">Finance</Text>
                      </View>
                    </Pressable>
                  </View>
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => !isEditMode && router.push('/leaderboard')}
                      className="flex-1 bg-yellow-500 rounded-xl p-3 active:opacity-70"
                    >
                      <View className="flex-row items-center justify-center">
                        <Trophy size={18} color="#fff" />
                        <Text className="text-white font-bold text-sm ml-1.5">Rankings</Text>
                      </View>
                    </Pressable>
                    <Pressable
                      onPress={() => !isEditMode && router.push('/calendar')}
                      className="flex-1 bg-amber-500 rounded-xl p-3 active:opacity-70"
                    >
                      <View className="flex-row items-center justify-center">
                        <Calendar size={18} color="#fff" />
                        <Text className="text-white font-bold text-sm ml-1.5">Calendar</Text>
                      </View>
                    </Pressable>
                    <Pressable
                      onPress={() => !isEditMode && router.push('/messages')}
                      className="flex-1 bg-cyan-500 rounded-xl p-3 active:opacity-70"
                    >
                      <View className="flex-row items-center justify-center">
                        <MessageSquare size={18} color="#fff" />
                        <Text className="text-white font-bold text-sm ml-1.5">Messages</Text>
                      </View>
                    </Pressable>
                  </View>
                </View>
                {isEditMode && (
                  <View className="absolute -left-1 top-0 bottom-0 justify-center">
                    <View className="bg-purple-600/90 rounded-l-lg p-1.5">
                      <GripVertical size={14} color="#fff" />
                    </View>
                  </View>
                )}
              </Animated.View>
            </Pressable>


            {/* FINANCIAL SNAPSHOT - Simplified */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-gray-500 dark:text-slate-500 text-xs font-bold tracking-wide">
                  FINANCIAL SNAPSHOT
                </Text>
                <Pressable onPress={() => router.push('/financial-dashboard')}>
                  <Text className="text-emerald-500 text-xs font-semibold">Details</Text>
                </Pressable>
              </View>

              <Pressable
                onPress={() => router.push('/financial-dashboard')}
                className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 active:opacity-70"
              >
                <View className="flex-row justify-between mb-3">
                  <View className="flex-1">
                    <Text className="text-gray-500 dark:text-slate-400 text-xs mb-0.5">Revenue</Text>
                    <Text className="text-gray-900 dark:text-white font-bold text-base">
                      £{(FOUNDER_DATA.financials.revenue / 1000).toFixed(0)}K
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-500 dark:text-slate-400 text-xs mb-0.5">Burn</Text>
                    <Text className="text-gray-900 dark:text-white font-bold text-base">
                      £{(FOUNDER_DATA.financials.burnRate / 1000).toFixed(0)}K
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-500 dark:text-slate-400 text-xs mb-0.5">Net Flow</Text>
                    <Text className={`font-bold text-base ${FOUNDER_DATA.financials.netCashFlow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {FOUNDER_DATA.financials.netCashFlow >= 0 ? '+' : ''}£{(FOUNDER_DATA.financials.netCashFlow / 1000).toFixed(0)}K
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center justify-between pt-3 border-t border-gray-200 dark:border-slate-700">
                  <Text className="text-gray-500 dark:text-slate-400 text-xs">Cash Position</Text>
                  <Text className="text-gray-900 dark:text-white font-bold">
                    £{(financialMetrics.cashPosition / 1000).toFixed(0)}K
                  </Text>
                </View>
              </Pressable>
            </View>

            {/* REPORTS & INSIGHTS - Founder */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-gray-500 dark:text-slate-500 text-xs font-bold tracking-wide">
                  REPORTS & INSIGHTS
                </Text>
                <Pressable onPress={() => router.push('/reports')}>
                  <Text className="text-purple-500 text-xs font-semibold">All Reports</Text>
                </Pressable>
              </View>

              {/* Board Pack - Primary CTA for Founders */}
              <Pressable
                onPress={() => router.push({ pathname: '/reports', params: { period: 'month', export: 'boardpack' } })}
                className="mb-2 active:opacity-70"
              >
                <LinearGradient
                  colors={['#7c3aed', '#6d28d9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 12, padding: 16 }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="w-10 h-10 bg-white/20 rounded-lg items-center justify-center">
                        <Download size={20} color="#fff" />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-white font-bold text-sm">Board Pack</Text>
                        <Text className="text-white/70 text-xs">
                          Executive summary, financials, OKRs & risks
                        </Text>
                      </View>
                    </View>
                    <ArrowRight size={18} color="#fff" />
                  </View>
                </LinearGradient>
              </Pressable>

              {/* Quick Report Options */}
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => router.push({ pathname: '/reports', params: { period: 'week' } })}
                  className="flex-1 bg-gray-100 dark:bg-slate-900 rounded-xl p-3 active:opacity-70"
                >
                  <View className="flex-row items-center">
                    <View className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg items-center justify-center">
                      <FileText size={16} color="#3b82f6" />
                    </View>
                    <View className="ml-2 flex-1">
                      <Text className="text-gray-900 dark:text-white font-semibold text-xs">Weekly</Text>
                      <Text className="text-gray-500 dark:text-slate-400 text-xs">7 day summary</Text>
                    </View>
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => router.push({ pathname: '/reports', params: { period: 'quarter' } })}
                  className="flex-1 bg-gray-100 dark:bg-slate-900 rounded-xl p-3 active:opacity-70"
                >
                  <View className="flex-row items-center">
                    <View className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg items-center justify-center">
                      <PieChart size={16} color="#10b981" />
                    </View>
                    <View className="ml-2 flex-1">
                      <Text className="text-gray-900 dark:text-white font-semibold text-xs">Quarterly</Text>
                      <Text className="text-gray-500 dark:text-slate-400 text-xs">90 day trends</Text>
                    </View>
                  </View>
                </Pressable>
              </View>

              {/* Analytics Quick Link */}
              <Pressable
                onPress={() => router.push('/analytics')}
                className="mt-2 bg-gray-100 dark:bg-slate-900 rounded-xl p-3 active:opacity-70"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg items-center justify-center">
                      <BarChart3 size={16} color="#f59e0b" />
                    </View>
                    <View className="ml-3">
                      <Text className="text-gray-900 dark:text-white font-semibold text-sm">Live Analytics</Text>
                      <Text className="text-gray-500 dark:text-slate-400 text-xs">Real-time team performance</Text>
                    </View>
                  </View>
                  <ArrowRight size={16} color="#64748b" />
                </View>
              </Pressable>
            </View>

            {/* UPCOMING CALENDAR */}
            {upcomingEvents.length > 0 && (
              <View className="mb-4">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-gray-500 dark:text-slate-500 text-xs font-bold tracking-wide">
                    UPCOMING (NEXT 2 BUSINESS DAYS)
                  </Text>
                  <Pressable onPress={() => router.push('/calendar')}>
                    <Text className="text-emerald-500 text-xs font-semibold">View Calendar</Text>
                  </Pressable>
                </View>

                <View className="gap-2">
                  {upcomingEvents.map((event) => {
                    const eventDate = new Date(event.startDate);
                    const isToday = eventDate.toDateString() === new Date().toDateString();
                    const isTomorrow = eventDate.toDateString() === new Date(Date.now() + 86400000).toDateString();

                    let dateLabel = eventDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
                    if (isToday) dateLabel = 'Today';
                    else if (isTomorrow) dateLabel = 'Tomorrow';

                    return (
                      <Pressable
                        key={event.id}
                        onPress={() => router.push('/calendar')}
                        className="bg-gray-100 dark:bg-slate-900 rounded-xl p-3 active:opacity-70"
                      >
                        <View className="flex-row items-center mb-2">
                          <View
                            className="w-1 h-10 rounded-full mr-3"
                            style={{ backgroundColor: event.color }}
                          />
                          <View className="flex-1">
                            <Text className="text-gray-900 dark:text-white font-semibold text-sm mb-0.5">
                              {event.title}
                            </Text>
                            <Text className="text-gray-600 dark:text-slate-400 text-xs">
                              {dateLabel}
                              {!event.allDay && ` • ${eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                            </Text>
                          </View>
                        </View>
                        {event.description && (
                          <Text className="text-gray-500 dark:text-slate-500 text-xs" numberOfLines={1}>
                            {event.description}
                          </Text>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* STARTUP PACK - Company Setup */}
            <View className="mb-6">
              <Pressable
                onPress={() => router.push('/startup-pack')}
                className="active:opacity-70"
              >
                <LinearGradient
                  colors={['#f59e0b', '#d97706']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 12, padding: 16 }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="w-10 h-10 bg-white/20 rounded-lg items-center justify-center">
                        <Lightbulb size={20} color="#fff" />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-white font-bold text-sm">Startup Pack</Text>
                        <Text className="text-white/70 text-xs">
                          Company setup & investor readiness
                        </Text>
                      </View>
                    </View>
                    <ArrowRight size={18} color="#fff" />
                  </View>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Executive View
  if (isExecutive) {
    const functionColor = getFunctionColor(executiveData.myFunction);

    return (
      <View className="flex-1 bg-white dark:bg-slate-950">
        {/* Help Modal */}
        <HelpModal
          visible={showHelp}
          onClose={() => setShowHelp(false)}
          content={EXECUTIVE_HELP}
          gradientColors={['#3b82f6', '#2563eb']}
        />

        {/* Role Header */}
        <LinearGradient
          colors={getRoleGradient()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ paddingHorizontal: 24, paddingTop: insets.top + 20, paddingBottom: 20 }}
        >
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-1">
              <Text className="text-white/80 text-sm font-medium">EXECUTIVE DASHBOARD</Text>
              <Text className="text-white text-2xl font-bold mt-1">
                {executiveData.myFunction}
              </Text>
              {/* Week Counter */}
              {(() => {
                const weekInfo = getWeekCounterInfo(currentWorkspace.createdAt);
                return (
                  <View className="mt-1.5 flex-row items-center gap-2">
                    <View className="bg-white/20 px-2 py-1 rounded">
                      <Text className="text-white text-[10px] font-semibold">
                        {weekInfo.displayText}
                      </Text>
                    </View>
                    {weekInfo.weeksSinceFounding > 0 && (
                      <View className="bg-blue-500/40 px-2 py-1 rounded">
                        <Text className="text-white text-[10px] font-semibold">
                          {weekInfo.foundingText}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })()}
            </View>
            <View className="flex-row items-center gap-2">
              <HelpButton onPress={() => setShowHelp(true)} />
              <View className="bg-white/20 px-3 py-1.5 rounded-full">
                <Text className="text-white text-xs font-bold">EXECUTIVE</Text>
              </View>
            </View>
          </View>
          <Text className="text-white/90 text-sm">
            Evaluate • Create work plans • Review apprentice work
          </Text>
        </LinearGradient>

        <ScrollView className="flex-1">
          <View className="px-6 py-4">
            {/* FOCUS: Next Action - What to do right now */}
            {executiveData.nextAction && (
              <Pressable
                onPress={() => router.push('/(tabs)/do')}
                className="mb-4 active:opacity-70"
              >
                <LinearGradient
                  colors={[functionColor, functionColor + 'cc']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 16, padding: 16 }}
                >
                  <View className="flex-row items-center mb-2">
                    <Zap size={16} color="#fff" />
                    <Text className="text-white/80 text-xs font-bold ml-1.5">YOUR NEXT ACTION</Text>
                  </View>
                  <Text className="text-white font-bold text-base mb-1" numberOfLines={2}>
                    {executiveData.nextAction.title}
                  </Text>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-white/80 text-sm">
                      {executiveData.nextAction.progress}% complete
                    </Text>
                    <View className="flex-row items-center">
                      <Clock size={12} color="#fff" />
                      <Text className="text-white/80 text-xs ml-1">
                        Due {executiveData.nextAction.dueDate}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </Pressable>
            )}

            {/* Pending Reviews Alert */}
            {executiveData.pendingReviews > 0 && (
              <Pressable
                onPress={() => router.push('/(tabs)/evaluate')}
                className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-2xl p-4 mb-4 active:opacity-70"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 bg-purple-500 rounded-full items-center justify-center">
                      <AlertCircle size={24} color="#fff" />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-purple-900 dark:text-purple-100 font-bold text-base">
                        {executiveData.pendingReviews} Work Submissions to Review
                      </Text>
                      <Text className="text-purple-700 dark:text-purple-300 text-sm">
                        Apprentices waiting for your feedback
                      </Text>
                    </View>
                  </View>
                  <ArrowRight size={20} color="#a855f7" />
                </View>
              </Pressable>
            )}

            {/* MY WORK vs OVERSEEING - Split View */}
            <View className="mb-4">
              <Text className="text-gray-500 dark:text-slate-500 text-xs font-bold mb-2 tracking-wide">
                MY WORKLOAD
              </Text>
              <View className="flex-row gap-3">
                {/* My Own Tasks */}
                <Pressable
                  onPress={() => router.push('/(tabs)/do')}
                  className="flex-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 active:opacity-70"
                >
                  <View className="flex-row items-center mb-2">
                    <Briefcase size={14} color="#3b82f6" />
                    <Text className="text-blue-700 dark:text-blue-300 text-xs font-semibold ml-1">
                      MY TASKS
                    </Text>
                  </View>
                  <Text className="text-blue-900 dark:text-blue-100 text-2xl font-bold">
                    {executiveData.myOwnTasks.total}
                  </Text>
                  <Text className="text-blue-600 dark:text-blue-400 text-xs">
                    {executiveData.myOwnTasks.inProgress} in progress
                  </Text>
                </Pressable>

                {/* Overseeing Tasks */}
                <Pressable
                  onPress={() => router.push('/(tabs)/evaluate')}
                  className="flex-1 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-3 active:opacity-70"
                >
                  <View className="flex-row items-center mb-2">
                    <Users size={14} color="#8b5cf6" />
                    <Text className="text-purple-700 dark:text-purple-300 text-xs font-semibold ml-1">
                      OVERSEEING
                    </Text>
                  </View>
                  <Text className="text-purple-900 dark:text-purple-100 text-2xl font-bold">
                    {executiveData.overseeingTasks.total}
                  </Text>
                  <Text className="text-purple-600 dark:text-purple-400 text-xs">
                    {executiveData.overseeingTasks.awaitingReview} need review
                  </Text>
                </Pressable>
              </View>

              {/* Due Soon Row */}
              {(executiveData.tasksDueToday > 0 || executiveData.tasksDueThisWeek > 0) && (
                <View className="flex-row gap-3 mt-3">
                  {executiveData.tasksDueToday > 0 && (
                    <View className="flex-1 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                      <Text className="text-red-700 dark:text-red-300 text-xs font-semibold mb-1">DUE TODAY</Text>
                      <Text className="text-red-900 dark:text-red-100 text-xl font-bold">{executiveData.tasksDueToday}</Text>
                    </View>
                  )}
                  <View className="flex-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                    <Text className="text-amber-700 dark:text-amber-300 text-xs font-semibold mb-1">DUE THIS WEEK</Text>
                    <Text className="text-amber-900 dark:text-amber-100 text-xl font-bold">{executiveData.tasksDueThisWeek}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* OKR HEALTH - Function specific */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-gray-500 dark:text-slate-500 text-xs font-bold tracking-wide">
                  {executiveData.myFunction.toUpperCase()} OKR HEALTH
                </Text>
                <Pressable onPress={() => router.push('/(tabs)/decide')}>
                  <Text className="text-blue-500 text-xs font-semibold">View All</Text>
                </Pressable>
              </View>

              <View className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <Target size={20} color={functionColor} />
                    <Text className="text-gray-900 dark:text-white font-bold ml-2">
                      {executiveData.linkedOKRs} OKRs
                    </Text>
                  </View>
                </View>
                <View className="flex-row gap-2">
                  <View className="flex-1 items-center p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <Text className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">{executiveData.okrHealth.onTrack}</Text>
                    <Text className="text-emerald-600 dark:text-emerald-400 text-xs">On Track</Text>
                  </View>
                  <View className="flex-1 items-center p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <Text className="text-amber-600 dark:text-amber-400 font-bold text-lg">{executiveData.okrHealth.atRisk}</Text>
                    <Text className="text-amber-600 dark:text-amber-400 text-xs">At Risk</Text>
                  </View>
                  <View className="flex-1 items-center p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <Text className="text-red-600 dark:text-red-400 font-bold text-lg">{executiveData.okrHealth.offTrack}</Text>
                    <Text className="text-red-600 dark:text-red-400 text-xs">Off Track</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* My Apprentices */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-gray-900 dark:text-white text-lg font-bold">
                  My Apprentices
                </Text>
                <Pressable onPress={() => router.push('/create-team')}>
                  <Text className="text-blue-500 text-sm font-semibold">View All</Text>
                </Pressable>
              </View>

              <View className="gap-2">
                {executiveData.apprentices.map((apprentice, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => router.push('/create-team')}
                    className="bg-gray-100 dark:bg-slate-900 rounded-xl p-3 active:opacity-70"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center flex-1">
                        <View className="w-8 h-8 bg-emerald-500 rounded-full items-center justify-center">
                          <Text className="text-white text-xs font-bold">
                            {apprentice.name.split(' ').map(n => n[0]).join('')}
                          </Text>
                        </View>
                        <View className="ml-3 flex-1">
                          <Text className="text-gray-900 dark:text-white font-semibold text-sm">
                            {apprentice.name}
                          </Text>
                          <Text className="text-gray-600 dark:text-slate-400 text-xs">
                            {apprentice.workPlans} work plan{apprentice.workPlans !== 1 ? 's' : ''}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-gray-900 dark:text-white font-bold text-sm">
                        {apprentice.progress}%
                      </Text>
                    </View>
                    <View className="bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <View
                        className="h-full bg-emerald-500"
                        style={{ width: `${apprentice.progress}%` }}
                      />
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Resources in Use */}
            <View className="mb-4">
              <Text className="text-gray-900 dark:text-white text-lg font-bold mb-3">
                Resources in Use
              </Text>

              <View className="bg-gray-100 dark:bg-slate-900 rounded-xl border border-gray-300 dark:border-slate-800 overflow-hidden">
                <Pressable
                  onPress={() => router.push({ pathname: '/(tabs)/make', params: { tab: 'ai' } })}
                  className="p-4 active:opacity-70"
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                      <Bot size={20} color="#8b5cf6" />
                      <Text className="text-gray-900 dark:text-white font-semibold ml-2">
                        AI Tools This Week
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Text className="text-gray-900 dark:text-white font-bold mr-2">
                        {executiveData.aiUsage.thisWeek}
                      </Text>
                      <ArrowRight size={16} color="#64748b" />
                    </View>
                  </View>
                  <View className="flex-row flex-wrap gap-2">
                    {executiveData.aiUsage.tools.map((tool, idx) => (
                      <View key={idx} className="bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded">
                        <Text className="text-purple-700 dark:text-purple-300 text-xs">{tool}</Text>
                      </View>
                    ))}
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => router.push({ pathname: '/(tabs)/make', params: { tab: 'ai' } })}
                  className="p-4 border-t border-gray-300 dark:border-slate-700 active:opacity-70"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Bot size={20} color="#8b5cf6" />
                      <Text className="text-gray-900 dark:text-white font-semibold ml-2">
                        AI Agents
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Text className="text-gray-900 dark:text-white font-bold mr-2">
                        {executiveData.aiAgents.length}
                      </Text>
                      <ArrowRight size={16} color="#64748b" />
                    </View>
                  </View>
                </Pressable>
              </View>
            </View>

            {/* View Team Management Button */}
            <Pressable
              onPress={() => router.push('/create-team')}
              className="bg-blue-500 rounded-xl py-3 mb-4 items-center active:opacity-80"
            >
              <View className="flex-row items-center">
                <Users size={18} color="#fff" />
                <Text className="text-white font-bold ml-2">View Team Management</Text>
              </View>
            </Pressable>

            {/* REPORTS - Executive */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-gray-500 dark:text-slate-500 text-xs font-bold tracking-wide">
                  REPORTS
                </Text>
                <Pressable onPress={() => router.push('/reports')}>
                  <Text className="text-blue-500 text-xs font-semibold">All Reports</Text>
                </Pressable>
              </View>

              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => router.push({ pathname: '/reports', params: { period: 'week' } })}
                  className="flex-1 bg-gray-100 dark:bg-slate-900 rounded-xl p-3 active:opacity-70"
                >
                  <View className="flex-row items-center">
                    <View className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-lg items-center justify-center">
                      <FileText size={18} color="#3b82f6" />
                    </View>
                    <View className="ml-2.5 flex-1">
                      <Text className="text-gray-900 dark:text-white font-semibold text-sm">Weekly Report</Text>
                      <Text className="text-gray-500 dark:text-slate-400 text-xs">Function performance</Text>
                    </View>
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => router.push('/analytics')}
                  className="flex-1 bg-gray-100 dark:bg-slate-900 rounded-xl p-3 active:opacity-70"
                >
                  <View className="flex-row items-center">
                    <View className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg items-center justify-center">
                      <BarChart3 size={18} color="#10b981" />
                    </View>
                    <View className="ml-2.5 flex-1">
                      <Text className="text-gray-900 dark:text-white font-semibold text-sm">Analytics</Text>
                      <Text className="text-gray-500 dark:text-slate-400 text-xs">Team insights</Text>
                    </View>
                  </View>
                </Pressable>
              </View>
            </View>

            {/* RECENT MESSAGES - Executive */}
            {recentMessages.length > 0 && (
              <View className="mb-4">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-gray-500 dark:text-slate-500 text-xs font-bold tracking-wide">
                    RECENT MESSAGES
                  </Text>
                  <Pressable onPress={() => router.push('/messages')}>
                    <Text className="text-blue-500 text-xs font-semibold">View All</Text>
                  </Pressable>
                </View>

                <View className="gap-2">
                  {recentMessages.map((conv) => (
                    <Pressable
                      key={conv.id}
                      onPress={() => router.push('/messages')}
                      className="bg-gray-100 dark:bg-slate-900 rounded-xl p-3 active:opacity-70"
                    >
                      <View className="flex-row items-start justify-between mb-1">
                        <View className="flex-1">
                          <Text className="text-gray-900 dark:text-white font-semibold text-sm mb-0.5">
                            {conv.name}
                          </Text>
                          <Text className="text-gray-600 dark:text-slate-400 text-xs" numberOfLines={2}>
                            {conv.lastMessage?.content}
                          </Text>
                        </View>
                        {conv.unreadCount > 0 && (
                          <View className="bg-blue-500 rounded-full w-5 h-5 items-center justify-center ml-2">
                            <Text className="text-white text-xs font-bold">{conv.unreadCount}</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-gray-500 dark:text-slate-500 text-xs">
                        {new Date(conv.lastMessage?.timestamp || '').toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* UPCOMING CALENDAR - Executive */}
            {upcomingEvents.length > 0 && (
              <View className="mb-4">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-gray-500 dark:text-slate-500 text-xs font-bold tracking-wide">
                    UPCOMING
                  </Text>
                  <Pressable onPress={() => router.push('/calendar')}>
                    <Text className="text-emerald-500 text-xs font-semibold">View Calendar</Text>
                  </Pressable>
                </View>

                <View className="gap-2">
                  {upcomingEvents.map((event) => {
                    const eventDate = new Date(event.startDate);
                    const isToday = eventDate.toDateString() === new Date().toDateString();
                    const isTomorrow = eventDate.toDateString() === new Date(Date.now() + 86400000).toDateString();

                    let dateLabel = eventDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
                    if (isToday) dateLabel = 'Today';
                    else if (isTomorrow) dateLabel = 'Tomorrow';

                    return (
                      <Pressable
                        key={event.id}
                        onPress={() => router.push('/calendar')}
                        className="bg-gray-100 dark:bg-slate-900 rounded-xl p-3 active:opacity-70"
                      >
                        <View className="flex-row items-center mb-1">
                          <View
                            className="w-1 h-8 rounded-full mr-3"
                            style={{ backgroundColor: event.color }}
                          />
                          <View className="flex-1">
                            <Text className="text-gray-900 dark:text-white font-semibold text-sm mb-0.5">
                              {event.title}
                            </Text>
                            <Text className="text-gray-600 dark:text-slate-400 text-xs">
                              {dateLabel}
                              {!event.allDay && ` • ${eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                            </Text>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Quick Actions */}
            <View className="flex-row gap-3 mb-4">
              <Pressable
                onPress={() => router.push('/(tabs)/evaluate')}
                className="flex-1 bg-blue-500 rounded-xl p-4 active:opacity-70"
              >
                <Briefcase size={24} color="#fff" />
                <Text className="text-white font-bold text-sm mt-2">Work Plans</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/calendar')}
                className="flex-1 bg-purple-500 rounded-xl p-4 active:opacity-70"
              >
                <Calendar size={24} color="#fff" />
                <Text className="text-white font-bold text-sm mt-2">Calendar</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/messages')}
                className="flex-1 bg-cyan-500 rounded-xl p-4 active:opacity-70"
              >
                <MessageSquare size={24} color="#fff" />
                <Text className="text-white font-bold text-sm mt-2">Messages</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Apprentice View
  if (isApprentice) {
    const functionColor = getFunctionColor(apprenticeData.linkedOKR.function);

    return (
      <View className="flex-1 bg-white dark:bg-slate-950">
        {/* Help Modal */}
        <HelpModal
          visible={showHelp}
          onClose={() => setShowHelp(false)}
          content={APPRENTICE_HELP}
          gradientColors={['#10b981', '#059669']}
        />

        {/* Role Header */}
        <LinearGradient
          colors={getRoleGradient()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ paddingHorizontal: 24, paddingTop: insets.top + 20, paddingBottom: 20 }}
        >
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-1">
              <Text className="text-white/80 text-sm font-medium">APPRENTICE WORKSPACE</Text>
              <Text className="text-white text-2xl font-bold mt-1">
                My Work
              </Text>
              {/* Week Counter */}
              {(() => {
                const weekInfo = getWeekCounterInfo(currentWorkspace.createdAt);
                return (
                  <View className="mt-1.5 flex-row items-center gap-2">
                    <View className="bg-white/20 px-2 py-1 rounded">
                      <Text className="text-white text-[10px] font-semibold">
                        {weekInfo.displayText}
                      </Text>
                    </View>
                    {weekInfo.weeksSinceFounding > 0 && (
                      <View className="bg-emerald-500/40 px-2 py-1 rounded">
                        <Text className="text-white text-[10px] font-semibold">
                          {weekInfo.foundingText}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })()}
            </View>
            <View className="flex-row items-center gap-2">
              <HelpButton onPress={() => setShowHelp(true)} />
              <View className="bg-white/20 px-3 py-1.5 rounded-full">
                <Text className="text-white text-xs font-bold">APPRENTICE</Text>
              </View>
            </View>
          </View>
          <Text className="text-white/90 text-sm">
            Execute • Learn • Deliver results
          </Text>
        </LinearGradient>

        <ScrollView className="flex-1">
          <View className="px-6 py-4">
            {/* FOCUS: Next Task - What to work on now */}
            {apprenticeData.nextTask && (
              <Pressable
                onPress={() => router.push('/(tabs)/do')}
                className="mb-4 active:opacity-70"
              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 16, padding: 16 }}
                >
                  <View className="flex-row items-center mb-2">
                    <Zap size={16} color="#fff" />
                    <Text className="text-white/80 text-xs font-bold ml-1.5">WORK ON THIS NOW</Text>
                  </View>
                  <Text className="text-white font-bold text-base mb-1" numberOfLines={2}>
                    {apprenticeData.nextTask.title}
                  </Text>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <View className="bg-white/20 h-1.5 w-20 rounded-full overflow-hidden">
                        <View
                          className="h-full bg-white rounded-full"
                          style={{ width: `${apprenticeData.nextTask.progress}%` }}
                        />
                      </View>
                      <Text className="text-white/80 text-sm ml-2">
                        {apprenticeData.nextTask.progress}%
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Clock size={12} color="#fff" />
                      <Text className="text-white/80 text-xs ml-1">
                        Due {apprenticeData.nextTask.dueDate}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </Pressable>
            )}

            {/* URGENCY ALERTS */}
            {(apprenticeData.dueTodayOrOverdue > 0 || apprenticeData.awaitingReview > 0) && (
              <View className="mb-4">
                <Text className="text-gray-500 dark:text-slate-500 text-xs font-bold mb-2 tracking-wide">
                  NEEDS ATTENTION
                </Text>
                <View className="gap-2">
                  {apprenticeData.dueTodayOrOverdue > 0 && (
                    <Pressable
                      onPress={() => router.push('/(tabs)/do')}
                      className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 flex-row items-center active:opacity-70"
                    >
                      <View className="w-8 h-8 bg-red-500 rounded-lg items-center justify-center">
                        <AlertTriangle size={16} color="#fff" />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-red-900 dark:text-red-100 font-bold text-sm">
                          {apprenticeData.dueTodayOrOverdue} task{apprenticeData.dueTodayOrOverdue > 1 ? 's' : ''} overdue
                        </Text>
                        <Text className="text-red-700 dark:text-red-300 text-xs">
                          Needs immediate attention
                        </Text>
                      </View>
                      <ArrowRight size={16} color="#ef4444" />
                    </Pressable>
                  )}
                  {apprenticeData.awaitingReview > 0 && (
                    <View className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-3 flex-row items-center">
                      <View className="w-8 h-8 bg-purple-500 rounded-lg items-center justify-center">
                        <Clock size={16} color="#fff" />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-purple-900 dark:text-purple-100 font-bold text-sm">
                          {apprenticeData.awaitingReview} awaiting review
                        </Text>
                        <Text className="text-purple-700 dark:text-purple-300 text-xs">
                          Submitted to executive
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* MY TASK STATUS - Enhanced */}
            <View className="mb-4">
              <Text className="text-gray-500 dark:text-slate-500 text-xs font-bold mb-2 tracking-wide">
                MY TASKS
              </Text>
              <View className="flex-row gap-2">
                <View className="flex-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                  <Text className="text-blue-700 dark:text-blue-300 text-xs font-semibold mb-1">IN PROGRESS</Text>
                  <Text className="text-blue-900 dark:text-blue-100 text-xl font-bold">{apprenticeData.myWorkPlans.inProgress}</Text>
                </View>
                <View className="flex-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                  <Text className="text-amber-700 dark:text-amber-300 text-xs font-semibold mb-1">DUE THIS WEEK</Text>
                  <Text className="text-amber-900 dark:text-amber-100 text-xl font-bold">{apprenticeData.dueThisWeek}</Text>
                </View>
                <View className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3">
                  <Text className="text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-1">COMPLETED</Text>
                  <Text className="text-emerald-900 dark:text-emerald-100 text-xl font-bold">{apprenticeData.myWorkPlans.completed}</Text>
                </View>
              </View>

              {/* Streak indicator if they have completions */}
              {apprenticeData.streak > 0 && (
                <View className="mt-3 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-xl p-3 flex-row items-center">
                  <Award size={20} color="#f59e0b" />
                  <Text className="text-amber-800 dark:text-amber-200 font-semibold ml-2">
                    {apprenticeData.streak} task streak!
                  </Text>
                  <Text className="text-amber-600 dark:text-amber-400 text-xs ml-auto">Keep it up!</Text>
                </View>
              )}
            </View>

            {/* Linked OKR - Compact */}
            <View className="mb-4">
              <Text className="text-gray-500 dark:text-slate-500 text-xs font-bold mb-2 tracking-wide">
                MY OBJECTIVE
              </Text>

              <Pressable
                onPress={() => router.push('/(tabs)/decide')}
                className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 active:opacity-70"
              >
                <View className="flex-row items-center mb-3">
                  <View
                    className="w-10 h-10 rounded-lg items-center justify-center"
                    style={{ backgroundColor: functionColor + '20' }}
                  >
                    <Target size={20} color={functionColor} />
                  </View>
                  <View className="ml-3 flex-1">
                    <View className="flex-row items-center mb-1">
                      <Text
                        className="text-xs font-bold px-2 py-0.5 rounded"
                        style={{ backgroundColor: functionColor + '20', color: functionColor }}
                      >
                        {apprenticeData.linkedOKR.function}
                      </Text>
                      {apprenticeData.linkedOKR.status !== 'on-track' && (
                        <View className={`ml-2 px-2 py-0.5 rounded ${
                          apprenticeData.linkedOKR.status === 'off-track' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
                        }`}>
                          <Text className={`text-xs font-semibold ${
                            apprenticeData.linkedOKR.status === 'off-track' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
                          }`}>
                            {apprenticeData.linkedOKR.status === 'off-track' ? 'Off Track' : 'At Risk'}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-gray-900 dark:text-white font-bold text-sm" numberOfLines={1}>
                      {apprenticeData.linkedOKR.title}
                    </Text>
                  </View>
                </View>
                <View className="bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden mb-1">
                  <View
                    className="h-full bg-emerald-500"
                    style={{ width: `${apprenticeData.linkedOKR.progress}%` }}
                  />
                </View>
                <Text className="text-gray-600 dark:text-slate-400 text-xs">
                  {apprenticeData.linkedOKR.progress}% progress • Your work contributes to this
                </Text>
              </Pressable>
            </View>

            {/* Recent Work */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-gray-900 dark:text-white text-lg font-bold">
                  Recent Work
                </Text>
                <Pressable onPress={() => router.push('/(tabs)/do')}>
                  <Text className="text-blue-500 text-sm font-semibold">View All</Text>
                </Pressable>
              </View>

              <View className="gap-2">
                {apprenticeData.recentWork.map((work, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => router.push('/(tabs)/do')}
                    className="bg-gray-100 dark:bg-slate-900 rounded-xl p-3 active:opacity-70"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-1">
                        <Text className="text-gray-900 dark:text-white font-semibold text-sm mb-1">
                          {work.title}
                        </Text>
                        <View className="flex-row items-center">
                          <Clock size={12} color="#64748b" />
                          <Text className="text-gray-600 dark:text-slate-400 text-xs ml-1">
                            Due {work.dueDate}
                          </Text>
                        </View>
                      </View>
                      <View className="items-end">
                        {work.progress === 100 ? (
                          <CheckCircle2 size={20} color="#10b981" />
                        ) : (
                          <Text className="text-gray-900 dark:text-white font-bold text-sm">
                            {work.progress}%
                          </Text>
                        )}
                      </View>
                    </View>
                    {work.progress < 100 && (
                      <View className="bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <View
                          className="h-full bg-blue-500"
                          style={{ width: `${work.progress}%` }}
                        />
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* My Team */}
            <View className="mb-4">
              <Text className="text-gray-900 dark:text-white text-lg font-bold mb-3">
                Working With
              </Text>

              <Pressable
                onPress={() => router.push('/create-team')}
                className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 border border-gray-300 dark:border-slate-800 active:opacity-70"
              >
                {apprenticeData.teamMembers.map((member, idx) => (
                  <View key={idx} className={`flex-row items-center justify-between ${idx > 0 ? 'pt-3 mt-3 border-t border-gray-300 dark:border-slate-700' : ''}`}>
                    <View className="flex-row items-center flex-1">
                      <View className={`w-10 h-10 rounded-full items-center justify-center ${
                        member.role === 'Executive' ? 'bg-blue-500' : 'bg-purple-500'
                      }`}>
                        <Text className="text-white text-xs font-bold">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </Text>
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-gray-900 dark:text-white font-semibold text-sm">
                          {member.name}
                        </Text>
                        <Text className="text-gray-600 dark:text-slate-400 text-xs">
                          {member.role}{member.function ? ` • ${member.function}` : ''}
                        </Text>
                      </View>
                    </View>
                    {idx === apprenticeData.teamMembers.length - 1 && (
                      <ArrowRight size={16} color="#64748b" />
                    )}
                  </View>
                ))}
              </Pressable>
            </View>

            {/* View Team Management Button */}
            <Pressable
              onPress={() => router.push('/create-team')}
              className="bg-blue-500 rounded-xl py-3 mb-4 items-center active:opacity-80"
            >
              <View className="flex-row items-center">
                <Users size={18} color="#fff" />
                <Text className="text-white font-bold ml-2">View My Team</Text>
              </View>
            </Pressable>

            {/* Ask AI Assistant */}
            <View className="mb-4">
              <Text className="text-gray-900 dark:text-white text-lg font-bold mb-3">
                Need Help?
              </Text>

              <Pressable
                onPress={() => router.push('/(tabs)/make')}
                className="active:opacity-70"
              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 12, padding: 16 }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center">
                        <Bot size={24} color="#fff" />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-white font-bold text-base">Ask AI Assistant</Text>
                        <Text className="text-white/80 text-sm">Get help with your work tasks</Text>
                      </View>
                    </View>
                    <ArrowRight size={20} color="#fff" />
                  </View>
                </LinearGradient>
              </Pressable>
            </View>

            {/* AI Tools */}
            <View className="mb-4">
              <Text className="text-gray-900 dark:text-white text-lg font-bold mb-3">
                My AI Tools
              </Text>

              <Pressable
                onPress={() => router.push({ pathname: '/(tabs)/make', params: { tab: 'ai' } })}
                className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl active:opacity-70"
              >
                <LinearGradient
                  colors={['#8b5cf6', '#6366f1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 12, padding: 16 }}
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                      <Bot size={24} color="#fff" />
                      <Text className="text-white font-bold text-base ml-2">
                        AI Tools Available
                      </Text>
                    </View>
                    <ArrowRight size={20} color="#fff" />
                  </View>
                  <View className="flex-row flex-wrap gap-2">
                    {apprenticeData.aiTools.map((tool, idx) => (
                      <View key={idx} className="bg-white/20 px-3 py-1 rounded-full">
                        <Text className="text-white text-xs font-semibold">{tool}</Text>
                      </View>
                    ))}
                  </View>
                </LinearGradient>
              </Pressable>
            </View>

            {/* MY PROGRESS REPORT - Apprentice */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-gray-500 dark:text-slate-500 text-xs font-bold tracking-wide">
                  MY PROGRESS
                </Text>
                <Pressable onPress={() => router.push('/reports')}>
                  <Text className="text-emerald-500 text-xs font-semibold">Full Report</Text>
                </Pressable>
              </View>

              <Pressable
                onPress={() => router.push({ pathname: '/reports', params: { period: 'week' } })}
                className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 active:opacity-70"
              >
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg items-center justify-center">
                      <Award size={20} color="#10b981" />
                    </View>
                    <View className="ml-3">
                      <Text className="text-gray-900 dark:text-white font-semibold text-sm">Performance Report</Text>
                      <Text className="text-gray-500 dark:text-slate-400 text-xs">View your achievements & stats</Text>
                    </View>
                  </View>
                  <ArrowRight size={16} color="#64748b" />
                </View>
                <View className="flex-row justify-between pt-3 border-t border-gray-200 dark:border-slate-700">
                  <View className="items-center flex-1">
                    <Text className="text-emerald-500 font-bold text-lg">{apprenticeData.myWorkPlans.completed}</Text>
                    <Text className="text-gray-500 dark:text-slate-400 text-xs">Completed</Text>
                  </View>
                  <View className="items-center flex-1">
                    <Text className="text-blue-500 font-bold text-lg">{apprenticeData.myWorkPlans.active}</Text>
                    <Text className="text-gray-500 dark:text-slate-400 text-xs">In Progress</Text>
                  </View>
                  <View className="items-center flex-1">
                    <Text className="text-purple-500 font-bold text-lg">{apprenticeData.linkedOKR.progress}%</Text>
                    <Text className="text-gray-500 dark:text-slate-400 text-xs">OKR Progress</Text>
                  </View>
                </View>
              </Pressable>
            </View>

            {/* RECENT MESSAGES - Apprentice */}
            {recentMessages.length > 0 && (
              <View className="mb-4">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-gray-500 dark:text-slate-500 text-xs font-bold tracking-wide">
                    RECENT MESSAGES
                  </Text>
                  <Pressable onPress={() => router.push('/messages')}>
                    <Text className="text-cyan-500 text-xs font-semibold">View All</Text>
                  </Pressable>
                </View>

                <View className="gap-2">
                  {recentMessages.map((conv) => (
                    <Pressable
                      key={conv.id}
                      onPress={() => router.push('/messages')}
                      className="bg-gray-100 dark:bg-slate-900 rounded-xl p-3 active:opacity-70"
                    >
                      <View className="flex-row items-start justify-between mb-1">
                        <View className="flex-1">
                          <Text className="text-gray-900 dark:text-white font-semibold text-sm mb-0.5">
                            {conv.name}
                          </Text>
                          <Text className="text-gray-600 dark:text-slate-400 text-xs" numberOfLines={2}>
                            {conv.lastMessage?.content}
                          </Text>
                        </View>
                        {conv.unreadCount > 0 && (
                          <View className="bg-cyan-500 rounded-full w-5 h-5 items-center justify-center ml-2">
                            <Text className="text-white text-xs font-bold">{conv.unreadCount}</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-gray-500 dark:text-slate-500 text-xs">
                        {new Date(conv.lastMessage?.timestamp || '').toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* UPCOMING CALENDAR - Apprentice */}
            {upcomingEvents.length > 0 && (
              <View className="mb-4">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-gray-500 dark:text-slate-500 text-xs font-bold tracking-wide">
                    UPCOMING
                  </Text>
                  <Pressable onPress={() => router.push('/calendar')}>
                    <Text className="text-purple-500 text-xs font-semibold">View Calendar</Text>
                  </Pressable>
                </View>

                <View className="gap-2">
                  {upcomingEvents.map((event) => {
                    const eventDate = new Date(event.startDate);
                    const isToday = eventDate.toDateString() === new Date().toDateString();
                    const isTomorrow = eventDate.toDateString() === new Date(Date.now() + 86400000).toDateString();

                    let dateLabel = eventDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
                    if (isToday) dateLabel = 'Today';
                    else if (isTomorrow) dateLabel = 'Tomorrow';

                    return (
                      <Pressable
                        key={event.id}
                        onPress={() => router.push('/calendar')}
                        className="bg-gray-100 dark:bg-slate-900 rounded-xl p-3 active:opacity-70"
                      >
                        <View className="flex-row items-center mb-1">
                          <View
                            className="w-1 h-8 rounded-full mr-3"
                            style={{ backgroundColor: event.color }}
                          />
                          <View className="flex-1">
                            <Text className="text-gray-900 dark:text-white font-semibold text-sm mb-0.5">
                              {event.title}
                            </Text>
                            <Text className="text-gray-600 dark:text-slate-400 text-xs">
                              {dateLabel}
                              {!event.allDay && ` • ${eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                            </Text>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Quick Actions */}
            <View className="flex-row gap-3 mb-4">
              <Pressable
                onPress={() => router.push('/(tabs)/do')}
                className="flex-1 bg-emerald-500 rounded-xl p-4 active:opacity-70"
              >
                <Zap size={24} color="#fff" />
                <Text className="text-white font-bold text-sm mt-2">Progress</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/calendar')}
                className="flex-1 bg-purple-500 rounded-xl p-4 active:opacity-70"
              >
                <Calendar size={24} color="#fff" />
                <Text className="text-white font-bold text-sm mt-2">Calendar</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/messages')}
                className="flex-1 bg-cyan-500 rounded-xl p-4 active:opacity-70"
              >
                <MessageSquare size={24} color="#fff" />
                <Text className="text-white font-bold text-sm mt-2">Messages</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return null;
}
