import { View, Text, ScrollView, Pressable, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Target, Plus, X, ChevronDown, ChevronRight, CheckCircle2, Circle, Clock, Users, DollarSign, Lightbulb, ChevronUp, UserPlus, Zap, AlertTriangle, AlertCircle, TrendingDown, CalendarClock, ArrowRight, HelpCircle, Bot, Briefcase, GraduationCap, CheckCircle, GripVertical } from 'lucide-react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS, FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { useCurrentWorkspace, useCurrentMembership } from '@/lib/state/app-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useQueueStore } from '@/lib/state/okr-queue-store';
import type { Function as BusinessFunction } from '@/types';
import { useOKRStore, type OKR, type Objective, type QueueStatus } from '@/lib/state/okr-store';
import { OKR_CATEGORIES, OKR_SUGGESTIONS, type OKRSuggestion, type OKRCategory } from '@/lib/okr-suggestions';
import { fractionalExecutives, apprentices, type Candidate } from '@/lib/candidates-seed';
import { useMarketplaceRequestsStore, type MarketplaceRequest } from '@/lib/state/marketplace-requests-store';
import { MARKETPLACE_EXECUTIVES } from '@/lib/marketplace-executives';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { type OrganizationMember, type AIAgent, AI_AGENTS } from '@/lib/organization-seed';
import { useWorkPlanStore, type WorkPlan } from '@/lib/state/work-plan-store';
import { HelpModal, HelpButton, type HelpContent } from '@/components/HelpModal';
import HireResourceModal from '@/components/HireResourceModal';
import { DraggableOKRCard, DraggableTaskCard } from '@/components/DraggableOKRCard';
import { CompanyAimBanner } from '@/components/CompanyAimBanner';
import { CompanyAimModal } from '@/components/CompanyAimModal';
import { SquaresDisplay } from '@/components/SquaresDisplay';
import { ResourceBar } from '@/components/ResourceBar';
import { useResourceStore, type PersonResource } from '@/lib/state/resource-store';

const DECIDE_HELP: HelpContent = {
  title: 'Strategic Decisions',
  subtitle: 'Set direction and allocate resources',
  description: 'The Decide tab is where you set strategic direction through OKRs (Objectives & Key Results), allocate resources, and make critical decisions that impact your startup\'s trajectory.',
  tips: [
    'Address "Needs Your Decision" items first - these are blocking progress',
    'Review at-risk OKRs weekly to catch problems before they become critical',
    'Use the Build Queue to see how OKRs are progressing and ETA',
    'Approve hiring requests promptly to unblock resource needs',
    'Create new OKRs using the Ideas button for inspiration',
  ],
  quickActions: [
    { label: 'Build Queue', description: 'View your OKR build queue with ETAs and resource allocation' },
    { label: 'Capacity', description: 'Check team capacity and workload distribution' },
    { label: 'Create OKR', description: 'Add a new strategic objective with key results' },
    { label: 'OKR Ideas', description: 'Browse suggested OKRs by category for inspiration' },
  ],
};

// Initialize OKR store once
if (useOKRStore.getState().okrs.length === 0) {
  useOKRStore.getState().initializeOKRs();
}
if (useWorkPlanStore.getState().workPlans.length === 0) {
  useWorkPlanStore.getState().initializeWorkPlans();
}

const DEFAULT_WORKSPACE_ID = 'workspace-demo-company';

interface WorkPlanItem {
  id: string;
  title: string;
  assignedTo: string;
  assignedRole: 'Founder' | 'FractionalExec' | 'Apprentice';
}

export default function DecideScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const currentWorkspace = useCurrentWorkspace();
  const currentMembership = useCurrentMembership();
  const params = useLocalSearchParams<{ function?: string }>();

  // Use centralized OKR store
  const okrs = useOKRStore(s => s.okrs);
  const toggleOKRExpanded = useOKRStore(s => s.toggleOKRExpanded);
  const addOKR = useOKRStore(s => s.addOKR);
  const reorderOKRs = useOKRStore(s => s.reorderOKRs);

  // Work plans for decision context
  const workPlans = useWorkPlanStore(s => s.workPlans);
  const addWorkPlan = useWorkPlanStore(s => s.addWorkPlan);

  // Marketplace requests
  const allRequests = useMarketplaceRequestsStore((s) => s.requests);
  const approveRequest = useMarketplaceRequestsStore((s) => s.approveRequest);
  const rejectRequest = useMarketplaceRequestsStore((s) => s.rejectRequest);
  const addMember = useOrganizationStore((s) => s.addMember);

  // Queue store - only need initializeQueue for syncing statuses
  const initializeQueue = useQueueStore((s) => s.initializeQueue);

  // Filter pending requests with useMemo
  const pendingRequests = useMemo(() => {
    return allRequests.filter((req) => req.status === 'pending');
  }, [allRequests]);

  // Calculate items that NEED DECISIONS - this is the core of the Decide tab
  const decisionItems = useMemo(() => {
    // Off-track OKRs need immediate intervention
    const offTrackOKRs = okrs.filter(o => o.status === 'off-track');

    // At-risk OKRs need monitoring/decisions
    const atRiskOKRs = okrs.filter(o => o.status === 'at-risk');

    // OKRs without any linked work plans (need resource allocation)
    const okrsWithoutPlans = okrs.filter(okr => {
      const linkedPlans = workPlans.filter(wp => wp.linkedOKRTitle === okr.title);
      return linkedPlans.length === 0;
    });

    // Blocked work plans need founder escalation
    const blockedWorkPlans = workPlans.filter(wp => wp.status === 'blocked');

    // Work plans with no progress in 7+ days (stalled) - simplified check
    const stalledWorkPlans = workPlans.filter(wp =>
      wp.status === 'in-progress' && wp.progress < 10
    );

    return {
      offTrackOKRs,
      atRiskOKRs,
      okrsWithoutPlans,
      blockedWorkPlans,
      stalledWorkPlans,
      pendingApprovals: pendingRequests.length,
      totalCritical: offTrackOKRs.length + blockedWorkPlans.length + pendingRequests.length,
      totalWarning: atRiskOKRs.length + okrsWithoutPlans.length + stalledWorkPlans.length,
    };
  }, [okrs, workPlans, pendingRequests]);

  const [selectedFunction, setSelectedFunction] = useState<BusinessFunction | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showIdeasModal, setShowIdeasModal] = useState(false);
  const [showApprovalQueue, setShowApprovalQueue] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<OKRCategory | 'all'>('all');
  const [selectedSuggestion, setSelectedSuggestion] = useState<OKRSuggestion | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showHireModal, setShowHireModal] = useState(false);
  const [selectedOKRForHire, setSelectedOKRForHire] = useState<OKR | null>(null);
  const [showGetResourcesModal, setShowGetResourcesModal] = useState(false);
  const [showCompanyAimModal, setShowCompanyAimModal] = useState(false);
  const [resourceTypeTab, setResourceTypeTab] = useState<'people' | 'ai'>('people');
  const [hireName, setHireName] = useState('');
  const [hireRole, setHireRole] = useState<'FractionalExec' | 'Apprentice'>('Apprentice');
  const [hireFunction, setHireFunction] = useState<BusinessFunction>('Marketing');
  const [selectedAI, setSelectedAI] = useState<AIAgent | null>(null);

  // Drag and drop state
  const [draggingOKRId, setDraggingOKRId] = useState<string | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dropTargetTaskId, setDropTargetTaskId] = useState<string | null>(null);
  const [dropZoneActive, setDropZoneActive] = useState<'active' | 'queued' | 'create-okr' | null>(null);
  const [dragOverOKRId, setDragOverOKRId] = useState<string | null>(null);
  const [showRenameOKRModal, setShowRenameOKRModal] = useState(false);
  const [renameOKRTitle, setRenameOKRTitle] = useState('');
  const [pendingMergeTaskIds, setPendingMergeTaskIds] = useState<string[]>([]);

  // Dropdown states
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);

  // Form state for creating OKR
  const [newOKRTitle, setNewOKRTitle] = useState('');
  const [newOKRDescription, setNewOKRDescription] = useState('');
  const [newOKRFunction, setNewOKRFunction] = useState<BusinessFunction>('Marketing');
  const [newOKROwner, setNewOKROwner] = useState('');
  const [newOKROwnerRole, setNewOKROwnerRole] = useState<'Founder' | 'FractionalExec' | 'Apprentice'>('Founder');

  // Work plan state
  const [workPlanItems, setWorkPlanItems] = useState<WorkPlanItem[]>([]);
  const [showWorkPlanSection, setShowWorkPlanSection] = useState(false);

  // Team member assignment state
  const [selectedMemberForAssign, setSelectedMemberForAssign] = useState<string | null>(null);
  const [showTeamDock, setShowTeamDock] = useState(true);

  // Organization members for assignment
  const orgMembers = useOrganizationStore(s => s.members);
  const updateWorkPlan = useWorkPlanStore(s => s.updateWorkPlan);

  // Initialize organization if empty
  useEffect(() => {
    if (orgMembers.length === 0) {
      useOrganizationStore.getState().initializeOrganization();
    }
  }, [orgMembers.length]);

  // Initialize resource store if empty
  const resourcePeople = useResourceStore(s => s.people);
  const seedResourceData = useResourceStore(s => s.seedDemoData);
  useEffect(() => {
    if (resourcePeople.length === 0 && currentWorkspace) {
      seedResourceData(currentWorkspace.id);
    }
  }, [resourcePeople.length, currentWorkspace]);

  // Get team members grouped by role
  const teamMembers = useMemo(() => {
    const founders = orgMembers.filter(m => m.role === 'Founder' && m.status === 'active');
    const executives = orgMembers.filter(m => m.role === 'FractionalExec' && m.status === 'active');
    const apprenticeMembers = orgMembers.filter(m => m.role === 'Apprentice' && m.status === 'active');
    return { founders, executives, apprentices: apprenticeMembers };
  }, [orgMembers]);

  // Get initials from name
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Get role color
  const getRoleColor = (role: 'Founder' | 'FractionalExec' | 'Apprentice') => {
    switch (role) {
      case 'Founder': return '#8b5cf6'; // Purple
      case 'FractionalExec': return '#10b981'; // Emerald
      case 'Apprentice': return '#3b82f6'; // Blue
    }
  };

  // Handle assigning a member to a work plan
  const handleAssignMember = (workPlanId: string, memberId: string) => {
    const workPlan = workPlans.find(wp => wp.id === workPlanId);
    if (!workPlan) return;

    const currentAssigned = workPlan.assignedMemberIds || [];
    if (!currentAssigned.includes(memberId)) {
      updateWorkPlan(workPlanId, {
        assignedMemberIds: [...currentAssigned, memberId]
      });
    }
    setSelectedMemberForAssign(null);
  };

  // Handle removing a member from a work plan
  const handleRemoveMember = (workPlanId: string, memberId: string) => {
    const workPlan = workPlans.find(wp => wp.id === workPlanId);
    if (!workPlan) return;

    const currentAssigned = workPlan.assignedMemberIds || [];
    updateWorkPlan(workPlanId, {
      assignedMemberIds: currentAssigned.filter(id => id !== memberId)
    });
  };

  // Get assigned members for a work plan
  const getAssignedMembers = (workPlan: WorkPlan) => {
    const memberIds = workPlan.assignedMemberIds || [];
    return memberIds
      .map(id => orgMembers.find(m => m.id === id))
      .filter((m): m is OrganizationMember => m !== undefined);
  };

  // Calculate task costs based on assigned members and squares
  const calculateTaskCost = (workPlan: WorkPlan) => {
    const assignedMembers = getAssignedMembers(workPlan);
    const totalSquares = workPlan.estimatedTimeUnits;
    const allocatedPerWeek = workPlan.allocatedTimeUnitsPerWeek || 2; // Default 2□/week
    const remainingSquares = Math.ceil(totalSquares * (1 - workPlan.progress / 100));

    // Calculate average cost per square from assigned members
    // Cost per square = costPerDay / 2 (since 1 day = 2 squares)
    let avgCostPerSquare = 0;
    if (assignedMembers.length > 0) {
      const totalCostPerSquare = assignedMembers.reduce((sum, member) => {
        const costPerSquare = (member.costPerDay || 0) / 2;
        return sum + costPerSquare;
      }, 0);
      avgCostPerSquare = totalCostPerSquare / assignedMembers.length;
    } else {
      // Default estimate if no members assigned (use apprentice rate)
      avgCostPerSquare = 75; // £150/day / 2
    }

    // Cumulative cost = total squares × average cost per square
    const cumulativeCost = Math.round(totalSquares * avgCostPerSquare);

    // Remaining cost = remaining squares × average cost per square
    const remainingCost = Math.round(remainingSquares * avgCostPerSquare);

    // Cost per week = allocated squares per week × average cost per square
    const costPerWeek = Math.round(allocatedPerWeek * avgCostPerSquare);

    // Weeks to complete = remaining squares / allocated per week
    const weeksToComplete = allocatedPerWeek > 0 ? Math.ceil(remainingSquares / allocatedPerWeek) : 0;

    return {
      cumulativeCost,
      remainingCost,
      costPerWeek,
      weeksToComplete,
      avgCostPerSquare,
      allocatedPerWeek,
      totalSquares,
      remainingSquares,
    };
  };

  // Handle hiring a new team member
  const handleHireNewMember = () => {
    if (!hireName.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    const newMember: OrganizationMember = {
      id: `member-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      workspaceId: 'workspace-demo-company',
      name: hireName.trim(),
      role: hireRole,
      function: hireFunction,
      email: `${hireName.toLowerCase().replace(/\s+/g, '.')}@company.com`,
      costPerDay: hireRole === 'FractionalExec' ? 800 : 150,
      daysPerWeek: hireRole === 'FractionalExec' ? 2 : 5,
      startDate: new Date().toISOString().split('T')[0],
      status: 'active',
      bio: `New ${hireRole === 'FractionalExec' ? 'Executive' : 'Apprentice'} hire for ${hireFunction}`,
    };

    addMember(newMember);
    setHireName('');
    setShowGetResourcesModal(false);
    Alert.alert('Success', `${newMember.name} has been added to your team!`);
  };

  // Available AI agents that aren't already active
  const aiAgents = useOrganizationStore(s => s.aiAgents);
  const availableAIs = useMemo(() => {
    const activeAIIds = aiAgents.filter(a => a.status === 'active').map(a => a.id);
    return AI_AGENTS.filter(a => !activeAIIds.includes(a.id)).slice(0, 10);
  }, [aiAgents]);

  // Handle adding an AI agent
  const handleAddAI = () => {
    if (!selectedAI) return;

    // In a real app, this would add to organization store
    Alert.alert('AI Agent Added', `${selectedAI.name} has been added to your team. It will help with ${selectedAI.functions.join(', ')}.`);
    setSelectedAI(null);
    setShowGetResourcesModal(false);
  };

  // Set initial function from params if provided
  useEffect(() => {
    if (params.function && params.function !== 'all') {
      setSelectedFunction(params.function as BusinessFunction);
    }
  }, [params.function]);

  // Initialize queue to sync statuses with OKRs
  useEffect(() => {
    initializeQueue();
  }, []);

  const functions: BusinessFunction[] = ['Marketing', 'Sales', 'Engineering', 'Ops', 'Finance', 'Admin'];

  // Get all available team members
  const allTeamMembers: Array<{ name: string; role: 'Founder' | 'FractionalExec' | 'Apprentice'; info?: string }> = [
    { name: 'Founder', role: 'Founder' },
    ...fractionalExecutives.slice(0, 10).map(exec => ({
      name: exec.name,
      role: 'FractionalExec' as const,
      info: exec.specialization.join(', ')
    })),
    ...apprentices.slice(0, 10).map(app => ({
      name: app.name,
      role: 'Apprentice' as const,
      info: app.specialization.join(', ')
    })),
  ];

  // DECIDE tab shows all OKRs for strategic decision-making
  // Filter by selected function only (workspace filtering handled by store initialization)
  const filteredOKRs = selectedFunction === 'all'
    ? okrs
    : okrs.filter(okr => okr.function === selectedFunction);

  // Split OKRs into active (has resources allocated) and queued (no resources)
  const { activeOKRs, queuedOKRs } = useMemo(() => {
    const active: OKR[] = [];
    const queued: OKR[] = [];

    filteredOKRs.forEach(okr => {
      const linkedPlans = workPlans.filter(wp => wp.linkedOKRTitle === okr.title);
      if (linkedPlans.length > 0) {
        active.push(okr);
      } else {
        queued.push(okr);
      }
    });

    // Sort active OKRs by priority (off-track first, then at-risk, then on-track)
    const priorityOrder = { 'off-track': 0, 'at-risk': 1, 'on-track': 2 };
    active.sort((a, b) => priorityOrder[a.status] - priorityOrder[b.status]);

    // Sort queued OKRs by status as well
    queued.sort((a, b) => priorityOrder[a.status] - priorityOrder[b.status]);

    return { activeOKRs: active, queuedOKRs: queued };
  }, [filteredOKRs, workPlans]);

  // Drag and drop handlers for OKR reordering
  const handleOKRDragEnd = useCallback((okrId: string, translationY: number, absoluteY: number, isActive: boolean) => {
    const ITEM_HEIGHT = 80;
    const itemsMoved = Math.round(translationY / ITEM_HEIGHT);

    // Use dropZoneActive to determine movement
    if (dropZoneActive === 'queued' && isActive) {
      // Move from active to queue - remove all assigned members from linked work plans
      const okr = activeOKRs.find(o => o.id === okrId);
      if (okr) {
        const linkedPlans = workPlans.filter(wp => wp.linkedOKRTitle === okr.title);
        linkedPlans.forEach(plan => {
          updateWorkPlan(plan.id, { assignedMemberIds: [], status: 'not-started' });
        });
        Alert.alert('Moved to Queue', 'OKR moved to queue. All team members have been unassigned and work is paused.');
      }
      setDraggingOKRId(null);
      setDropZoneActive(null);
      return;
    }

    if (dropZoneActive === 'active' && !isActive) {
      // Move from queue to active - prompt user to assign resources
      Alert.alert('Activate OKR', 'Tap on the OKR to expand it, then assign team members to tasks.');
      setDraggingOKRId(null);
      setDropZoneActive(null);
      return;
    }

    if (Math.abs(itemsMoved) === 0) {
      setDraggingOKRId(null);
      setDropZoneActive(null);
      return;
    }

    const sourceList = isActive ? activeOKRs : queuedOKRs;
    const sourceIndex = sourceList.findIndex(o => o.id === okrId);

    if (sourceIndex === -1) {
      setDraggingOKRId(null);
      setDropZoneActive(null);
      return;
    }

    // Reorder within same section
    const destIndex = Math.max(0, Math.min(sourceList.length - 1, sourceIndex + itemsMoved));
    if (destIndex !== sourceIndex) {
      // Build new order
      const reorderedList = [...sourceList];
      const [movedItem] = reorderedList.splice(sourceIndex, 1);
      reorderedList.splice(destIndex, 0, movedItem);

      // Create new full order maintaining the other section
      const otherList = isActive ? queuedOKRs : activeOKRs;
      const newOrder = isActive
        ? [...reorderedList.map(o => o.id), ...otherList.map(o => o.id)]
        : [...otherList.map(o => o.id), ...reorderedList.map(o => o.id)];

      reorderOKRs(newOrder);
    }

    setDraggingOKRId(null);
    setDropZoneActive(null);
  }, [activeOKRs, queuedOKRs, workPlans, reorderOKRs, updateWorkPlan, dropZoneActive]);

  // Handle OKR drag move for drop zone detection
  const handleOKRDragMove = useCallback((okrId: string, absoluteY: number) => {
    // Get screen regions - simplified detection
    const screenMidpoint = 400; // Approximate midpoint

    if (draggingOKRId) {
      const isFromActive = activeOKRs.some(o => o.id === okrId);
      if (isFromActive && absoluteY > screenMidpoint + 100) {
        setDropZoneActive('queued');
      } else if (!isFromActive && absoluteY < screenMidpoint - 100) {
        setDropZoneActive('active');
      } else {
        setDropZoneActive(null);
      }
    }
  }, [draggingOKRId, activeOKRs]);

  // Handle task drag for merging or moving between OKRs
  const handleTaskDragEnd = useCallback((taskId: string, translationY: number, absoluteY: number, parentOKRTitle: string) => {
    // Check if dropped on the queued drop zone
    if (dropZoneActive === 'queued') {
      // Unassign all members from this task
      updateWorkPlan(taskId, { assignedMemberIds: [], status: 'not-started' });
      Alert.alert('Task Paused', 'Team members have been unassigned and the task is now paused.');
      setDraggingTaskId(null);
      setDropTargetTaskId(null);
      setDropZoneActive(null);
      return;
    }

    // Check if dropped on another task for merging
    if (dropTargetTaskId && dropTargetTaskId !== taskId) {
      // Merging two tasks into a new OKR
      const sourceTask = workPlans.find(wp => wp.id === taskId);
      const targetTask = workPlans.find(wp => wp.id === dropTargetTaskId);

      if (sourceTask && targetTask) {
        // Show rename modal for the new OKR
        setRenameOKRTitle(`${sourceTask.title} & ${targetTask.title}`);
        setPendingMergeTaskIds([taskId, dropTargetTaskId]);
        setShowRenameOKRModal(true);
      }
    }

    // Check if dropped on a different OKR to move the task
    if (dragOverOKRId) {
      const targetOKR = okrs.find(o => o.id === dragOverOKRId);
      if (targetOKR && targetOKR.title !== parentOKRTitle) {
        updateWorkPlan(taskId, { linkedOKRTitle: targetOKR.title });
        Alert.alert('Task Moved', `Task moved to "${targetOKR.title}"`);
      }
    }

    setDraggingTaskId(null);
    setDropTargetTaskId(null);
    setDropZoneActive(null);
    setDragOverOKRId(null);
  }, [workPlans, dropTargetTaskId, dropZoneActive, dragOverOKRId, okrs, updateWorkPlan]);

  // Handle task drag move for drop zone detection
  const handleTaskDragMove = useCallback((taskId: string, absoluteY: number) => {
    // Detect if we're over the queued section
    const screenMidpoint = 400;

    if (absoluteY > screenMidpoint + 150) {
      setDropZoneActive('queued');
    } else {
      setDropZoneActive(null);
    }
  }, []);

  // Confirm merge of tasks into OKR
  const handleConfirmTaskMerge = useCallback(() => {
    if (pendingMergeTaskIds.length < 2 || !renameOKRTitle.trim()) {
      Alert.alert('Error', 'Please enter an OKR title');
      return;
    }

    const tasksToMerge = pendingMergeTaskIds
      .map(id => workPlans.find(wp => wp.id === id))
      .filter((wp): wp is WorkPlan => wp !== undefined);

    if (tasksToMerge.length < 2) {
      setShowRenameOKRModal(false);
      setPendingMergeTaskIds([]);
      return;
    }

    // Create new OKR from merged tasks
    const newOKR: OKR = {
      id: `okr-merged-${Date.now()}`,
      workspaceId: DEFAULT_WORKSPACE_ID,
      function: tasksToMerge[0].function || 'Ops',
      title: renameOKRTitle.trim(),
      description: `Combined OKR from: ${tasksToMerge.map(t => t.title).join(', ')}`,
      owner: 'Founder',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'on-track',
      objectives: tasksToMerge.map((task, idx) => ({
        id: `kr-merged-${idx}-${Date.now()}`,
        title: task.title,
        target: '100%',
        current: `${task.progress}%`,
        progress: task.progress,
        status: task.progress >= 70 ? 'on-track' : task.progress >= 40 ? 'at-risk' : 'off-track',
      })),
    };

    addOKR(newOKR);

    // Update work plans to link to the new OKR
    tasksToMerge.forEach(task => {
      updateWorkPlan(task.id, { linkedOKRTitle: renameOKRTitle.trim() });
    });

    Alert.alert('OKR Created', `"${renameOKRTitle.trim()}" has been created from ${tasksToMerge.length} tasks.`);
    setShowRenameOKRModal(false);
    setPendingMergeTaskIds([]);
    setRenameOKRTitle('');
  }, [pendingMergeTaskIds, renameOKRTitle, workPlans, addOKR, updateWorkPlan]);

  const toggleOKR = (okrId: string) => {
    toggleOKRExpanded(okrId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track':
        return 'text-emerald-500 bg-emerald-500/20';
      case 'at-risk':
        return 'text-amber-500 bg-amber-500/20';
      case 'off-track':
        return 'text-red-500 bg-red-500/20';
      default:
        return 'text-gray-500 bg-gray-500/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'on-track':
        return 'On Track';
      case 'at-risk':
        return 'At Risk';
      case 'off-track':
        return 'Off Track';
      default:
        return 'Unknown';
    }
  };

  const getQueueStatusDisplay = (queueStatus?: QueueStatus) => {
    switch (queueStatus) {
      case 'in_progress':
        return { label: 'Active', color: '#22c55e', bgColor: 'bg-emerald-500/20' };
      case 'queued':
        return { label: 'Queued', color: '#3b82f6', bgColor: 'bg-blue-500/20' };
      case 'paused':
        return { label: 'Paused', color: '#f59e0b', bgColor: 'bg-amber-500/20' };
      case 'blocked':
        return { label: 'Blocked', color: '#ef4444', bgColor: 'bg-red-500/20' };
      case 'completed':
        return { label: 'Done', color: '#8b5cf6', bgColor: 'bg-violet-500/20' };
      default:
        return null;
    }
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

  // Calculate summary stats
  const totalOKRs = filteredOKRs.length;
  const atRiskOKRs = filteredOKRs.filter((okr: OKR) => okr.status === 'at-risk').length;
  const offTrackOKRs = filteredOKRs.filter((okr: OKR) => okr.status === 'off-track').length;
  const approvalQueueCount = pendingRequests.length;

  const handleApproveMarketplaceRequest = (requestId: string, candidateId: string) => {
    // Find the candidate
    const candidate = MARKETPLACE_EXECUTIVES.find(e => e.id === candidateId);
    const request = pendingRequests.find((r: MarketplaceRequest) => r.id === requestId);

    if (!candidate || !request) return;

    // Add to organization
    addMember({
      id: `member-${Date.now()}`,
      workspaceId: 'workspace-demo-company',
      name: candidate.name,
      role: candidate.role as 'FractionalExec' | 'Apprentice',
      function: candidate.function,
      email: `${candidate.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      phone: undefined,
      linkedIn: candidate.linkedIn,
      bio: candidate.bio,
      costPerDay: request.proposedDayRate,
      daysPerWeek: request.proposedDaysPerWeek,
      status: 'active',
      startDate: new Date().toISOString().split('T')[0],
    });

    // Approve the request
    approveRequest(requestId, currentMembership?.role || 'Founder');
    Alert.alert('Success', `${candidate.name} has been added to your team!`);
  };

  const handleRejectMarketplaceRequest = (requestId: string) => {
    rejectRequest(requestId, currentMembership?.role || 'Founder');
    Alert.alert('Rejected', 'The hiring request has been rejected.');
  };

  // Filter suggestions by category
  const filteredSuggestions = selectedCategory === 'all'
    ? OKR_SUGGESTIONS
    : OKR_SUGGESTIONS.filter(s => s.category === selectedCategory);

  const handleSelectSuggestion = (suggestion: OKRSuggestion) => {
    setNewOKRTitle(suggestion.title);
    setNewOKRDescription(suggestion.description);
    setSelectedSuggestion(suggestion);
    setShowIdeasModal(false);
    setShowCreateModal(true);
  };

  const handleAddWorkPlanItem = () => {
    const newItem: WorkPlanItem = {
      id: `wpi-${Date.now()}`,
      title: '',
      assignedTo: 'Founder',
      assignedRole: 'Founder',
    };
    setWorkPlanItems([...workPlanItems, newItem]);
  };

  const handleUpdateWorkPlanItem = (id: string, field: keyof WorkPlanItem, value: string) => {
    setWorkPlanItems(items =>
      items.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleRemoveWorkPlanItem = (id: string) => {
    setWorkPlanItems(items => items.filter(item => item.id !== id));
  };

  const handleCreateOKR = () => {
    if (!newOKRTitle.trim()) {
      Alert.alert('Error', 'Please enter an OKR title');
      return;
    }
    if (!newOKRDescription.trim()) {
      Alert.alert('Error', 'Please enter an OKR description');
      return;
    }
    if (!newOKROwner.trim()) {
      Alert.alert('Error', 'Please select an owner');
      return;
    }

    // Create objectives from key results if using suggestion
    const objectives: Objective[] = selectedSuggestion
      ? selectedSuggestion.keyResults.map((kr, index) => ({
          id: `kr-${Date.now()}-${index}`,
          title: kr.title,
          target: `${kr.targetValue} ${kr.unit}`,
          current: '0',
          progress: 0,
          status: 'on-track' as const,
        }))
      : [];

    const newOKR: OKR = {
      id: `okr-${Date.now()}`,
      workspaceId: currentWorkspace?.id || 'workspace-demo-company',
      function: newOKRFunction,
      title: newOKRTitle,
      description: newOKRDescription,
      owner: newOKROwner,
      startDate: 'Q1 2026',
      endDate: 'Q4 2026',
      status: 'on-track',
      objectives,
      isExpanded: false,
    };

    addOKR(newOKR);

    // Show work plan success message
    const workPlanMessage = workPlanItems.length > 0
      ? `\n\n${workPlanItems.length} work items have been created and assigned to the team.`
      : '';

    // Reset form
    setNewOKRTitle('');
    setNewOKRDescription('');
    setNewOKRFunction('Marketing');
    setNewOKROwner('');
    setNewOKROwnerRole('Founder');
    setWorkPlanItems([]);
    setShowWorkPlanSection(false);
    setSelectedSuggestion(null);
    setShowCreateModal(false);

    Alert.alert('Success', `OKR created successfully!${workPlanMessage}`);
  };

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
      {/* Help Modal */}
      <HelpModal
        visible={showHelp}
        onClose={() => setShowHelp(false)}
        content={DECIDE_HELP}
        gradientColors={['#8b5cf6', '#6366f1']}
      />

      {/* Company Aim Modal */}
      <CompanyAimModal
        visible={showCompanyAimModal}
        onClose={() => setShowCompanyAimModal(false)}
        workspaceId={currentWorkspace?.id || ''}
      />

      {/* Header - Matching Home Tab Style */}
      <LinearGradient
        colors={['#8b5cf6', '#6366f1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ paddingHorizontal: 24, paddingTop: insets.top + 16, paddingBottom: 16 }}
      >
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1">
            <Text className="text-white/70 text-xs font-medium">STRATEGIC DECISIONS</Text>
            <Text className="text-white text-xl font-bold">Decide</Text>
          </View>
          <View className="flex-row gap-2">
            <HelpButton onPress={() => setShowHelp(true)} />
            <Pressable
              onPress={() => setShowCreateModal(true)}
              className="bg-white/20 rounded-xl p-2.5 active:opacity-70"
            >
              <Plus size={20} color="#fff" />
            </Pressable>
            <Pressable
              onPress={() => setShowIdeasModal(true)}
              className="bg-white/20 rounded-xl p-2.5 active:opacity-70"
            >
              <Lightbulb size={20} color="#fff" />
            </Pressable>
          </View>
        </View>
        {/* Quick Health Indicators */}
        <View className="flex-row gap-4">
          {activeOKRs.length > 0 && (
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full mr-1.5 bg-emerald-400" />
              <Text className="text-white/90 text-xs">{activeOKRs.length} active</Text>
            </View>
          )}
          {queuedOKRs.length > 0 && (
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full mr-1.5 bg-blue-400" />
              <Text className="text-white/90 text-xs">{queuedOKRs.length} queued</Text>
            </View>
          )}
          {decisionItems.totalCritical > 0 && (
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full mr-1.5 bg-red-400" />
              <Text className="text-white/90 text-xs">{decisionItems.totalCritical} critical</Text>
            </View>
          )}
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full mr-1.5 bg-emerald-400" />
            <Text className="text-white/90 text-xs">{totalOKRs} OKRs tracked</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Resource Bar - Team with Squares */}
      <ResourceBar
        workspaceId={currentWorkspace?.id || ''}
        onPersonPress={(person) => setSelectedMemberForAssign(selectedMemberForAssign === person.id ? null : person.id)}
        selectedPersonId={selectedMemberForAssign || undefined}
        compact
      />

      <ScrollView className="flex-1 px-5 py-4">
        {/* Company Aim Banner */}
        {currentWorkspace && (
          <CompanyAimBanner
            workspaceId={currentWorkspace.id}
            onEdit={() => setShowCompanyAimModal(true)}
          />
        )}

        {/* SECTION 1: NEEDS YOUR DECISION (Critical) */}
        {decisionItems.totalCritical > 0 && (
          <View className="mb-5">
            <Text className="text-red-600 dark:text-red-400 text-xs font-bold mb-2 tracking-wide">
              NEEDS YOUR DECISION
            </Text>
            <View className="gap-2">
              {/* Off-Track OKRs */}
              {decisionItems.offTrackOKRs.map((okr: OKR) => (
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
              {decisionItems.blockedWorkPlans.map((wp) => (
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

              {/* Pending Approvals */}
              {pendingRequests.length > 0 && (
                <Pressable
                  onPress={() => setShowApprovalQueue(true)}
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
            </View>
          </View>
        )}

        {/* SECTION 2: NEEDS REVIEW (Warning) */}
        {decisionItems.totalWarning > 0 && (
          <View className="mb-5">
            <Text className="text-amber-600 dark:text-amber-400 text-xs font-bold mb-2 tracking-wide">
              NEEDS REVIEW
            </Text>
            <View className="gap-2">
              {/* At-Risk OKRs */}
              {decisionItems.atRiskOKRs.slice(0, 3).map((okr: OKR) => (
                <Pressable
                  key={okr.id}
                  onPress={() => {
                    toggleOKR(okr.id);
                  }}
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
                    <ChevronRight size={16} color="#eab308" />
                  </View>
                </Pressable>
              ))}

              {/* OKRs Without Resource Plans */}
              {decisionItems.okrsWithoutPlans.slice(0, 2).map((okr: OKR) => (
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

        {/* SECTION 3: Function Filter */}
        <View className="mb-3">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setSelectedFunction('all')}
                className={`px-3 py-1.5 rounded-lg ${selectedFunction === 'all' ? 'bg-purple-500' : 'bg-gray-200 dark:bg-slate-800'}`}
              >
                <Text className={`text-xs font-semibold ${selectedFunction === 'all' ? 'text-white' : 'text-gray-600 dark:text-slate-400'}`}>
                  All ({okrs.length})
                </Text>
              </Pressable>
              {functions.map((func) => {
                const count = okrs.filter(o => o.function === func).length;
                if (count === 0) return null;
                return (
                  <Pressable
                    key={func}
                    onPress={() => setSelectedFunction(func)}
                    className={`px-3 py-1.5 rounded-lg ${selectedFunction === func ? 'bg-purple-500' : 'bg-gray-200 dark:bg-slate-800'}`}
                  >
                    <Text className={`text-xs font-semibold ${selectedFunction === func ? 'text-white' : 'text-gray-600 dark:text-slate-400'}`}>
                      {func} ({count})
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* SECTION 4: ACTIVE OKRs (with resources allocated) */}
        {activeOKRs.length > 0 && (
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-wide">
                ACTIVE - RESOURCES ALLOCATED
              </Text>
              <View className="bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded">
                <Text className="text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                  {activeOKRs.length} OKR{activeOKRs.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            <View className="gap-2">
              {activeOKRs.map((okr: OKR, index: number) => {
                const isExpanded = okr.isExpanded || false;
                const functionColor = getFunctionColor(okr.function);
                const linkedPlans = workPlans.filter(wp => wp.linkedOKRTitle === okr.title);
                const totalProgress = linkedPlans.length > 0
                  ? Math.round(linkedPlans.reduce((sum, p) => sum + p.progress, 0) / linkedPlans.length)
                  : 0;

                return (
                  <View key={okr.id}>
                    <DraggableOKRCard
                      okrId={okr.id}
                      onDragStart={(id) => setDraggingOKRId(id)}
                      onDragEnd={(id, translationY, absoluteY) => handleOKRDragEnd(id, translationY, absoluteY, true)}
                      onDragMove={handleOKRDragMove}
                      onPress={() => toggleOKR(okr.id)}
                      isDragging={draggingOKRId === okr.id}
                      isDropTarget={dropZoneActive === 'active' && !activeOKRs.some(o => o.id === okr.id)}
                    >
                      <View
                        className={`bg-emerald-50 dark:bg-emerald-900/10 border rounded-xl p-3 ${
                          draggingOKRId === okr.id ? 'border-purple-400 dark:border-purple-600' :
                          okr.status === 'off-track'
                            ? 'border-red-300 dark:border-red-800'
                            : okr.status === 'at-risk'
                            ? 'border-amber-300 dark:border-amber-800'
                            : 'border-emerald-200 dark:border-emerald-800'
                        }`}
                      >
                        <View className="flex-row items-center">
                          <View
                            className="w-1.5 h-12 rounded-full mr-3"
                            style={{
                              backgroundColor:
                                okr.status === 'off-track' ? '#ef4444' :
                                okr.status === 'at-risk' ? '#f59e0b' : '#10b981'
                            }}
                          />

                          <View className="flex-1">
                            <View className="flex-row items-center mb-1 flex-wrap gap-1">
                              <View
                                className="px-1.5 py-0.5 rounded"
                                style={{ backgroundColor: functionColor + '20' }}
                              >
                                <Text className="text-xs font-semibold" style={{ color: functionColor }}>
                                  {okr.function}
                                </Text>
                              </View>
                              <View className={`px-1.5 py-0.5 rounded ${getStatusColor(okr.status)}`}>
                                <Text className="text-xs font-semibold">{getStatusText(okr.status)}</Text>
                              </View>
                              <View className="px-1.5 py-0.5 rounded bg-emerald-500/20">
                                <Text className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                  {totalProgress}% done
                                </Text>
                              </View>
                            </View>

                            <Text className="text-gray-900 dark:text-white font-semibold text-sm" numberOfLines={1}>
                              {okr.title}
                            </Text>

                            <View className="flex-row items-center mt-1 gap-3 flex-wrap">
                              <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                                {linkedPlans.length} task{linkedPlans.length !== 1 ? 's' : ''}
                              </Text>
                              <Text className="text-gray-500 dark:text-slate-400 text-xs">
                                {okr.objectives.length} KRs
                              </Text>
                              {linkedPlans.length > 0 && (
                                <>
                                  <View className="flex-row items-center">
                                    <View className="flex-row items-center gap-0.5">
                                      {Array.from({ length: Math.min(linkedPlans.reduce((sum, p) => sum + p.estimatedTimeUnits, 0), 5) }).map((_, i) => {
                                        const completedSquares = linkedPlans.reduce((sum, p) => sum + Math.round((p.progress / 100) * p.estimatedTimeUnits), 0);
                                        return (
                                          <View
                                            key={i}
                                            className="w-2 h-2 rounded-sm"
                                            style={{
                                              backgroundColor: i < completedSquares ? '#10b981' : '#d1d5db',
                                            }}
                                          />
                                        );
                                      })}
                                    </View>
                                    <Text className="text-gray-500 dark:text-slate-400 text-[10px] ml-1">
                                      {linkedPlans.reduce((sum, p) => sum + p.estimatedTimeUnits, 0)}□
                                    </Text>
                                  </View>
                                  {/* OKR Total Cost */}
                                  <View className="bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">
                                    <Text className="text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">
                                      £{linkedPlans.reduce((sum, p) => sum + calculateTaskCost(p).cumulativeCost, 0).toLocaleString()}
                                    </Text>
                                  </View>
                                </>
                              )}
                            </View>
                          </View>

                          {isExpanded ? (
                            <ChevronDown size={18} color="#64748b" />
                          ) : (
                            <ChevronRight size={18} color="#64748b" />
                          )}
                        </View>
                      </View>
                    </DraggableOKRCard>

                    {isExpanded && (
                      <View className="mt-2 ml-4 gap-2">
                        {/* Work Plans (Tasks) with Assigned Members - Draggable */}
                        {linkedPlans.map((plan) => {
                          const assignedMembers = getAssignedMembers(plan);
                          const taskCost = calculateTaskCost(plan);
                          return (
                            <DraggableTaskCard
                              key={plan.id}
                              taskId={plan.id}
                              onDragStart={(id) => setDraggingTaskId(id)}
                              onDragEnd={(id, translationY, absoluteY) => handleTaskDragEnd(id, translationY, absoluteY, okr.title)}
                              onDragMove={handleTaskDragMove}
                              onPress={() => {
                                if (selectedMemberForAssign) {
                                  handleAssignMember(plan.id, selectedMemberForAssign);
                                }
                              }}
                              isDragging={draggingTaskId === plan.id}
                              isDropTarget={draggingTaskId !== null && draggingTaskId !== plan.id && dropTargetTaskId === plan.id}
                              isBeingDraggedOver={draggingTaskId !== null && draggingTaskId !== plan.id}
                            >
                              <View
                                className={`bg-white dark:bg-slate-800 border rounded-xl p-3 ${
                                  selectedMemberForAssign
                                    ? 'border-purple-400 dark:border-purple-600 border-2'
                                    : draggingTaskId === plan.id
                                      ? 'border-purple-400 dark:border-purple-500'
                                      : 'border-gray-200 dark:border-slate-700'
                                }`}
                              >
                                <View className="flex-row items-start justify-between mb-2">
                                  <View className="flex-1 mr-2">
                                    <Text className="text-gray-900 dark:text-white font-semibold text-sm" numberOfLines={2}>
                                      {plan.title}
                                    </Text>
                                    <View className="flex-row items-center mt-1 gap-2">
                                      <View className={`px-1.5 py-0.5 rounded ${
                                        plan.status === 'completed' ? 'bg-emerald-500/20' :
                                        plan.status === 'in-progress' ? 'bg-blue-500/20' :
                                        plan.status === 'blocked' ? 'bg-red-500/20' : 'bg-gray-500/20'
                                      }`}>
                                        <Text className={`text-[10px] font-semibold ${
                                          plan.status === 'completed' ? 'text-emerald-600 dark:text-emerald-400' :
                                          plan.status === 'in-progress' ? 'text-blue-600 dark:text-blue-400' :
                                          plan.status === 'blocked' ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                                        }`}>{plan.status}</Text>
                                      </View>
                                      <Text className="text-gray-500 dark:text-slate-400 text-[10px]">{plan.progress}%</Text>
                                    </View>
                                  </View>

                                  {/* Assigned Members Avatars */}
                                  <View className="flex-row items-center">
                                    {assignedMembers.length > 0 ? (
                                      <View className="flex-row -space-x-2">
                                        {assignedMembers.slice(0, 4).map((member, idx) => (
                                          <Pressable
                                            key={member.id}
                                            onPress={() => handleRemoveMember(plan.id, member.id)}
                                            style={{ marginLeft: idx > 0 ? -8 : 0, zIndex: 10 - idx }}
                                          >
                                            <View
                                              className="w-8 h-8 rounded-full items-center justify-center border-2 border-white dark:border-slate-800"
                                              style={{ backgroundColor: getRoleColor(member.role) }}
                                            >
                                              <Text className="text-white font-bold text-[10px]">{getInitials(member.name)}</Text>
                                            </View>
                                          </Pressable>
                                        ))}
                                        {assignedMembers.length > 4 && (
                                          <View className="w-8 h-8 rounded-full items-center justify-center bg-gray-400 border-2 border-white dark:border-slate-800" style={{ marginLeft: -8 }}>
                                            <Text className="text-white font-bold text-[10px]">+{assignedMembers.length - 4}</Text>
                                          </View>
                                        )}
                                      </View>
                                    ) : (
                                      <View className="w-8 h-8 rounded-full items-center justify-center bg-gray-200 dark:bg-slate-700 border-2 border-dashed border-gray-400 dark:border-slate-500">
                                        <Plus size={14} color="#9ca3af" />
                                      </View>
                                    )}
                                  </View>
                                </View>

                                {/* Progress Bar */}
                                <View className="bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                  <View
                                    className={`h-full ${
                                      plan.status === 'completed' ? 'bg-emerald-500' :
                                      plan.status === 'blocked' ? 'bg-red-500' : 'bg-blue-500'
                                    }`}
                                    style={{ width: `${plan.progress}%` }}
                                  />
                                </View>

                                {/* Squares & Cost Display */}
                                <View className="mt-2 flex-row items-center justify-between">
                                  <View className="flex-row items-center gap-2">
                                    <SquaresDisplay
                                      totalSquares={plan.estimatedTimeUnits}
                                      completedSquares={Math.round((plan.progress / 100) * plan.estimatedTimeUnits)}
                                      variant="compact"
                                      statusColor={
                                        plan.status === 'completed' ? '#10b981' :
                                        plan.status === 'blocked' ? '#ef4444' : '#3b82f6'
                                      }
                                    />
                                    <Text className="text-gray-400 dark:text-slate-500 text-[10px]">
                                      {taskCost.allocatedPerWeek}□/wk
                                    </Text>
                                  </View>

                                  {/* Cost Information */}
                                  <View className="flex-row items-center gap-2">
                                    <View className="bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">
                                      <Text className="text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">
                                        £{taskCost.cumulativeCost.toLocaleString()} total
                                      </Text>
                                    </View>
                                    <View className="bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">
                                      <Text className="text-blue-700 dark:text-blue-300 text-[10px] font-semibold">
                                        £{taskCost.costPerWeek}/wk
                                      </Text>
                                    </View>
                                  </View>
                                </View>

                                {/* Time to complete estimate */}
                                {plan.progress < 100 && taskCost.weeksToComplete > 0 && (
                                  <View className="mt-1.5 flex-row items-center">
                                    <Clock size={10} color="#9ca3af" />
                                    <Text className="text-gray-400 dark:text-slate-500 text-[10px] ml-1">
                                      {taskCost.weeksToComplete} wk{taskCost.weeksToComplete !== 1 ? 's' : ''} remaining • £{taskCost.remainingCost.toLocaleString()} left
                                    </Text>
                                  </View>
                                )}
                              </View>
                            </DraggableTaskCard>
                          );
                        })}

                        {/* Key Results Summary */}
                        <View className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-2">
                          <Text className="text-gray-500 dark:text-slate-400 text-[10px] font-semibold mb-1">KEY RESULTS</Text>
                          {okr.objectives.slice(0, 3).map((objective: Objective) => (
                            <View key={objective.id} className="flex-row items-center justify-between py-1">
                              <Text className="text-gray-700 dark:text-slate-300 text-xs flex-1 mr-2" numberOfLines={1}>
                                {objective.title}
                              </Text>
                              <Text className={`text-xs font-semibold ${
                                objective.status === 'on-track' ? 'text-emerald-500' :
                                objective.status === 'at-risk' ? 'text-amber-500' : 'text-red-500'
                              }`}>{objective.progress}%</Text>
                            </View>
                          ))}
                        </View>

                        <View className="gap-2">
                          <Pressable
                            onPress={() => router.push(`/okr-planner?okrId=${okr.id}`)}
                            className="bg-purple-500 rounded-lg py-2.5 flex-row items-center justify-center gap-2 active:opacity-70"
                          >
                            <Zap size={16} color="#fff" />
                            <Text className="text-white text-sm font-semibold">View Resource Plan</Text>
                          </Pressable>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Drop Zone / Divider between Active and Queued */}
        {(activeOKRs.length > 0 || queuedOKRs.length > 0) && (
          <View className="my-3">
            {(draggingOKRId || draggingTaskId) ? (
              <View
                className={`border-2 border-dashed rounded-xl p-4 items-center justify-center ${
                  dropZoneActive === 'queued'
                    ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-500'
                    : 'bg-gray-100 dark:bg-slate-800 border-gray-300 dark:border-slate-600'
                }`}
              >
                <Text className={`text-sm font-semibold ${
                  dropZoneActive === 'queued'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-slate-400'
                }`}>
                  {dropZoneActive === 'queued'
                    ? '↓ Drop here to pause work & free resources'
                    : '↓ Drag below this line to queue'}
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center">
                <View className="flex-1 h-0.5 bg-gray-300 dark:bg-slate-700" />
                <View className="bg-gray-200 dark:bg-slate-800 px-3 py-1 rounded-full mx-2">
                  <Text className="text-gray-500 dark:text-slate-400 text-[10px] font-bold">
                    HOLD & DRAG TO REORDER
                  </Text>
                </View>
                <View className="flex-1 h-0.5 bg-gray-300 dark:bg-slate-700" />
              </View>
            )}
          </View>
        )}

        {/* SECTION 5: QUEUED OKRs (no resources allocated yet) */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-blue-600 dark:text-blue-400 text-xs font-bold tracking-wide">
              QUEUED - AWAITING RESOURCES
            </Text>
            <View className="bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded">
              <Text className="text-blue-700 dark:text-blue-300 text-xs font-semibold">
                {queuedOKRs.length} OKR{queuedOKRs.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {queuedOKRs.length === 0 && activeOKRs.length === 0 ? (
            <View className="items-center justify-center py-8 bg-gray-100 dark:bg-slate-900 rounded-xl">
              <Target size={32} color="#64748b" />
              <Text className="text-gray-600 dark:text-slate-400 text-center font-semibold mt-3">
                No OKRs Found
              </Text>
              <Text className="text-gray-500 dark:text-slate-400 text-center text-sm mt-1">
                {selectedFunction === 'all' ? 'Create your first OKR' : `No OKRs for ${selectedFunction}`}
              </Text>
              <Pressable
                onPress={() => setShowCreateModal(true)}
                className="bg-purple-500 rounded-lg px-4 py-2 mt-3 active:opacity-70"
              >
                <Text className="text-white text-sm font-semibold">Create OKR</Text>
              </Pressable>
            </View>
          ) : queuedOKRs.length === 0 ? (
            <View className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <Text className="text-blue-700 dark:text-blue-300 text-sm text-center">
                All OKRs have resources allocated. Create a new OKR to add to the queue.
              </Text>
            </View>
          ) : (
            <View className="gap-2">
              {queuedOKRs.map((okr: OKR, index: number) => {
                const isExpanded = okr.isExpanded || false;
                const functionColor = getFunctionColor(okr.function);

                return (
                  <View key={okr.id}>
                    <DraggableOKRCard
                      okrId={okr.id}
                      onDragStart={(id) => setDraggingOKRId(id)}
                      onDragEnd={(id, translationY, absoluteY) => handleOKRDragEnd(id, translationY, absoluteY, false)}
                      onDragMove={handleOKRDragMove}
                      onPress={() => toggleOKR(okr.id)}
                      isDragging={draggingOKRId === okr.id}
                      isDropTarget={dropZoneActive === 'queued' && activeOKRs.some(o => o.id === draggingOKRId)}
                    >
                      <View
                        className={`bg-blue-50 dark:bg-blue-900/10 border rounded-xl p-3 ${
                          draggingOKRId === okr.id ? 'border-purple-400 dark:border-purple-600' :
                          okr.status === 'off-track'
                            ? 'border-red-300 dark:border-red-800'
                            : okr.status === 'at-risk'
                            ? 'border-amber-300 dark:border-amber-800'
                            : 'border-blue-200 dark:border-blue-800'
                        }`}
                      >
                        <View className="flex-row items-center">
                          {/* Queue Position */}
                          <View className="w-8 h-8 bg-blue-500/20 rounded-lg items-center justify-center mr-3">
                            <Text className="text-blue-600 dark:text-blue-400 text-sm font-bold">
                              #{index + 1}
                            </Text>
                          </View>

                          <View className="flex-1">
                            <View className="flex-row items-center mb-1 flex-wrap gap-1">
                              <View
                                className="px-1.5 py-0.5 rounded"
                                style={{ backgroundColor: functionColor + '20' }}
                              >
                                <Text className="text-xs font-semibold" style={{ color: functionColor }}>
                                  {okr.function}
                                </Text>
                              </View>
                              <View className={`px-1.5 py-0.5 rounded ${getStatusColor(okr.status)}`}>
                                <Text className="text-xs font-semibold">{getStatusText(okr.status)}</Text>
                              </View>
                              <View className="px-1.5 py-0.5 rounded bg-blue-500/20">
                                <Text className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                  No resources
                                </Text>
                              </View>
                            </View>

                            <Text className="text-gray-900 dark:text-white font-semibold text-sm" numberOfLines={1}>
                              {okr.title}
                            </Text>

                            <View className="flex-row items-center mt-1 gap-3">
                              <Text className="text-gray-500 dark:text-slate-400 text-xs">
                                {okr.objectives.length} KRs
                              </Text>
                            </View>
                          </View>

                          {isExpanded ? (
                            <ChevronDown size={18} color="#64748b" />
                          ) : (
                            <ChevronRight size={18} color="#64748b" />
                          )}
                        </View>
                      </View>
                    </DraggableOKRCard>

                    {isExpanded && (
                      <View className="mt-2 ml-4 gap-2">
                        {/* Info Card - Needs Resources */}
                        <View className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                          <View className="flex-row items-center">
                            <AlertCircle size={16} color="#f59e0b" />
                            <Text className="text-amber-800 dark:text-amber-200 text-xs ml-2 flex-1">
                              This OKR needs a resource plan. Create work plans and assign team members to move it to Active.
                            </Text>
                          </View>
                        </View>

                        {/* Key Results */}
                        <View className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-2">
                          <Text className="text-gray-500 dark:text-slate-400 text-[10px] font-semibold mb-1">KEY RESULTS</Text>
                          {okr.objectives.map((objective: Objective) => (
                            <View key={objective.id} className="flex-row items-center justify-between py-1.5 border-b border-gray-200 dark:border-slate-700 last:border-0">
                              <Text className="text-gray-700 dark:text-slate-300 text-xs flex-1 mr-2" numberOfLines={1}>
                                {objective.title}
                              </Text>
                              <Text className={`text-xs font-semibold ${
                                objective.status === 'on-track' ? 'text-emerald-500' :
                                objective.status === 'at-risk' ? 'text-amber-500' : 'text-red-500'
                              }`}>{objective.progress}%</Text>
                            </View>
                          ))}
                        </View>

                        <Pressable
                          onPress={() => router.push(`/okr-planner?okrId=${okr.id}`)}
                          className="bg-purple-500 rounded-lg py-2.5 flex-row items-center justify-center gap-2 active:opacity-70"
                        >
                          <Zap size={16} color="#fff" />
                          <Text className="text-white text-sm font-semibold">Create Resource Plan</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* OKR Ideas Modal */}
      <Modal
        visible={showIdeasModal}
        transparent
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowIdeasModal(false)}
      >
        <View className="flex-1 bg-black/70 justify-end">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end">
            <View className="bg-gray-100 dark:bg-slate-900 rounded-t-3xl" style={{ maxHeight: '90%' }}>
              <View className="px-6 pt-6 pb-4 border-b border-gray-300 dark:border-slate-800">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Lightbulb size={24} color="#8b5cf6" />
                    <Text className="text-gray-900 dark:text-white text-xl font-bold ml-2">OKR Ideas</Text>
                  </View>
                  <Pressable
                    onPress={() => setShowIdeasModal(false)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    className="w-10 h-10 items-center justify-center rounded-full bg-gray-200 dark:bg-slate-800 active:opacity-70"
                  >
                    <X size={24} color="#64748b" />
                  </Pressable>
                </View>
                <Text className="text-gray-600 dark:text-slate-400 text-sm mt-2">
                  Browse proven OKR templates for startups across different business functions
                </Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={true} className="px-6 py-4">
                {/* Category Filter */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => setSelectedCategory('all')}
                      className={`px-3 py-2 rounded-lg ${selectedCategory === 'all' ? 'bg-violet-500' : 'bg-gray-100 dark:bg-slate-800'}`}
                    >
                      <Text className={`text-xs font-semibold ${selectedCategory === 'all' ? 'text-white' : 'text-gray-600 dark:text-slate-400'}`}>
                        All
                      </Text>
                    </Pressable>
                    {OKR_CATEGORIES.map((cat) => (
                      <Pressable
                        key={cat.id}
                        onPress={() => setSelectedCategory(cat.id as OKRCategory)}
                        className={`px-3 py-2 rounded-lg ${selectedCategory === cat.id ? 'bg-violet-500' : 'bg-gray-100 dark:bg-slate-800'}`}
                      >
                        <Text className={`text-xs font-semibold ${selectedCategory === cat.id ? 'text-white' : 'text-gray-600 dark:text-slate-400'}`}>
                          {cat.icon} {cat.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>

                {/* Suggestion Cards */}
                {filteredSuggestions.map((suggestion) => (
                  <Pressable
                    key={suggestion.id}
                    onPress={() => handleSelectSuggestion(suggestion)}
                    className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 mb-3 active:opacity-70"
                  >
                    <Text className="text-gray-900 dark:text-white font-bold text-base mb-2">
                      {suggestion.title}
                    </Text>
                    <Text className="text-gray-600 dark:text-slate-400 text-sm mb-3">
                      {suggestion.description}
                    </Text>
                    <View className="flex-row items-center gap-2 mb-2">
                      <View className="bg-violet-100 dark:bg-violet-900/30 px-2 py-1 rounded">
                        <Text className="text-violet-700 dark:text-violet-300 text-xs font-semibold">
                          {suggestion.keyResults.length} Key Results
                        </Text>
                      </View>
                      <View className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                        <Text className="text-blue-700 dark:text-blue-300 text-xs font-semibold">
                          {suggestion.suggestedDuration} days
                        </Text>
                      </View>
                    </View>
                    <Text className="text-violet-600 dark:text-violet-400 text-xs font-semibold">
                      Tap to use this template →
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Create OKR Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowCreateModal(false);
          setSelectedSuggestion(null);
          setWorkPlanItems([]);
          setShowWorkPlanSection(false);
        }}
      >
        <View className="flex-1 bg-black/70 justify-end">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end">
            <View className="bg-gray-100 dark:bg-slate-900 rounded-t-3xl" style={{ maxHeight: '90%' }}>
              <View className="px-6 pt-6 pb-4 border-b border-gray-300 dark:border-slate-800">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-900 dark:text-white text-xl font-bold">Create OKR</Text>
                  <Pressable
                    onPress={() => {
                      setShowCreateModal(false);
                      setSelectedSuggestion(null);
                      setWorkPlanItems([]);
                      setShowWorkPlanSection(false);
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    className="w-10 h-10 items-center justify-center rounded-full bg-gray-200 dark:bg-slate-800 active:opacity-70"
                  >
                    <X size={24} color="#64748b" />
                  </Pressable>
                </View>
              </View>

              <ScrollView showsVerticalScrollIndicator={true} className="px-6 py-4">
                {selectedSuggestion && (
                  <View className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl p-4 mb-4">
                    <Text className="text-violet-900 dark:text-violet-100 font-semibold mb-1">
                      Using template: {selectedSuggestion.title}
                    </Text>
                    <Text className="text-violet-700 dark:text-violet-300 text-xs">
                      {selectedSuggestion.keyResults.length} key results will be auto-generated
                    </Text>
                  </View>
                )}

                <Text className="text-blue-700 dark:text-blue-300 text-sm mb-4">
                  Create a new OKR and assign it to a team member. You can also create initial work items.
                </Text>

                {/* Title Input */}
                <Text className="text-gray-900 dark:text-white font-semibold mb-2">Title</Text>
                <TextInput
                  value={newOKRTitle}
                  onChangeText={setNewOKRTitle}
                  placeholder="e.g., Achieve Product-Market Fit"
                  placeholderTextColor="#64748b"
                  className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white mb-4"
                />

                {/* Description Input */}
                <Text className="text-gray-900 dark:text-white font-semibold mb-2">Description</Text>
                <TextInput
                  value={newOKRDescription}
                  onChangeText={setNewOKRDescription}
                  placeholder="Describe the objective and why it matters"
                  placeholderTextColor="#64748b"
                  multiline
                  numberOfLines={3}
                  className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white mb-4"
                  style={{ minHeight: 80, textAlignVertical: 'top' }}
                />

                {/* Owner Selection with Dropdown */}
                <Text className="text-gray-900 dark:text-white font-semibold mb-2">Owner</Text>
                <Pressable
                  onPress={() => setShowOwnerDropdown(!showOwnerDropdown)}
                  className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-3 flex-row items-center justify-between mb-2"
                >
                  <Text className={`text-base ${newOKROwner ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-slate-400'}`}>
                    {newOKROwner || 'Select an owner...'}
                  </Text>
                  {showOwnerDropdown ? (
                    <ChevronUp size={20} color="#94a3b8" />
                  ) : (
                    <ChevronDown size={20} color="#94a3b8" />
                  )}
                </Pressable>

                {/* Dropdown */}
                {showOwnerDropdown && (
                  <View className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl mb-4 max-h-60">
                    <ScrollView>
                      {allTeamMembers.map((member, index) => (
                        <Pressable
                          key={index}
                          onPress={() => {
                            setNewOKROwner(member.name);
                            setNewOKROwnerRole(member.role);
                            setShowOwnerDropdown(false);
                          }}
                          className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 active:bg-gray-100 dark:active:bg-slate-700"
                        >
                          <View className="flex-row items-center justify-between">
                            <View className="flex-1">
                              <Text className="text-gray-900 dark:text-white font-semibold text-sm">
                                {member.name}
                              </Text>
                              {member.info && (
                                <Text className="text-gray-600 dark:text-slate-400 text-xs mt-0.5">
                                  {member.info}
                                </Text>
                              )}
                            </View>
                            <View
                              className={`px-2 py-1 rounded ${
                                member.role === 'Founder'
                                  ? 'bg-blue-100 dark:bg-blue-900/30'
                                  : member.role === 'FractionalExec'
                                  ? 'bg-violet-100 dark:bg-violet-900/30'
                                  : 'bg-emerald-100 dark:bg-emerald-900/30'
                              }`}
                            >
                              <Text
                                className={`text-xs font-semibold ${
                                  member.role === 'Founder'
                                    ? 'text-blue-700 dark:text-blue-300'
                                    : member.role === 'FractionalExec'
                                    ? 'text-violet-700 dark:text-violet-300'
                                    : 'text-emerald-700 dark:text-emerald-300'
                                }`}
                              >
                                {member.role === 'FractionalExec' ? 'Executive' : member.role}
                              </Text>
                            </View>
                          </View>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Function Selection */}
                <Text className="text-gray-900 dark:text-white font-semibold mb-2">Function</Text>
                <View className="flex-row flex-wrap gap-2 mb-6">
                  {functions.map((func) => (
                    <Pressable
                      key={func}
                      onPress={() => setNewOKRFunction(func)}
                      className={`px-3 py-2 rounded-lg ${
                        newOKRFunction === func
                          ? 'bg-blue-500'
                          : 'bg-gray-100 dark:bg-slate-800'
                      }`}
                    >
                      <Text className={`text-sm font-semibold ${
                        newOKRFunction === func
                          ? 'text-white'
                          : 'text-gray-700 dark:text-slate-300'
                      }`}>
                        {func}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Work Plan Section */}
                <Pressable
                  onPress={() => setShowWorkPlanSection(!showWorkPlanSection)}
                  className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4 flex-row items-center justify-between"
                >
                  <View className="flex-1">
                    <Text className="text-amber-900 dark:text-amber-100 font-semibold mb-1">
                      Create Initial Work Plan (Optional)
                    </Text>
                    <Text className="text-amber-700 dark:text-amber-300 text-xs">
                      Add tasks and assign them to team members
                    </Text>
                  </View>
                  {showWorkPlanSection ? (
                    <ChevronUp size={20} color="#d97706" />
                  ) : (
                    <ChevronDown size={20} color="#d97706" />
                  )}
                </Pressable>

                {showWorkPlanSection && (
                  <View className="mb-4">
                    {workPlanItems.map((item, index) => (
                      <View key={item.id} className="bg-gray-100 dark:bg-slate-800 rounded-xl p-3 mb-2">
                        <View className="flex-row items-center justify-between mb-2">
                          <Text className="text-gray-900 dark:text-white font-semibold text-sm">
                            Work Item {index + 1}
                          </Text>
                          <Pressable onPress={() => handleRemoveWorkPlanItem(item.id)}>
                            <X size={18} color="#ef4444" />
                          </Pressable>
                        </View>
                        <TextInput
                          value={item.title}
                          onChangeText={(val) => handleUpdateWorkPlanItem(item.id, 'title', val)}
                          placeholder="e.g., Create social media strategy"
                          placeholderTextColor="#64748b"
                          className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white mb-2 text-sm"
                        />
                        <Text className="text-gray-700 dark:text-slate-300 text-xs mb-1">Assign to:</Text>
                        <View className="flex-row flex-wrap gap-2">
                          {allTeamMembers.slice(0, 5).map((member) => (
                            <Pressable
                              key={member.name}
                              onPress={() => {
                                handleUpdateWorkPlanItem(item.id, 'assignedTo', member.name);
                                handleUpdateWorkPlanItem(item.id, 'assignedRole', member.role);
                              }}
                              className={`px-2 py-1 rounded ${
                                item.assignedTo === member.name
                                  ? 'bg-blue-500'
                                  : 'bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700'
                              }`}
                            >
                              <Text className={`text-xs ${item.assignedTo === member.name ? 'text-white font-semibold' : 'text-gray-700 dark:text-slate-300'}`}>
                                {member.name}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    ))}
                    <Pressable
                      onPress={handleAddWorkPlanItem}
                      className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 flex-row items-center justify-center active:opacity-70"
                    >
                      <Plus size={18} color="#3b82f6" />
                      <Text className="text-blue-700 dark:text-blue-300 font-semibold ml-2 text-sm">
                        Add Work Item
                      </Text>
                    </Pressable>
                  </View>
                )}

                <Pressable
                  onPress={handleCreateOKR}
                  className="bg-blue-500 py-4 rounded-xl active:opacity-70"
                >
                  <Text className="text-white text-center font-bold">Create OKR</Text>
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Approval Queue Modal */}
      <Modal
        visible={showApprovalQueue}
        transparent
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowApprovalQueue(false)}
      >
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-gray-100 dark:bg-slate-900 rounded-t-3xl" style={{ maxHeight: '90%' }}>
            <View className="px-6 pt-6 pb-4 border-b border-gray-300 dark:border-slate-800">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-900 dark:text-white text-xl font-bold">Approval Queue</Text>
                <Pressable
                  onPress={() => setShowApprovalQueue(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  className="w-10 h-10 items-center justify-center rounded-full bg-gray-200 dark:bg-slate-800 active:opacity-70"
                >
                  <X size={24} color="#64748b" />
                </Pressable>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={true} className="px-6 py-4">
              <Text className="text-gray-600 dark:text-slate-400 text-sm mb-4">
                Review and approve hiring requests from the marketplace.
              </Text>

              {/* Marketplace hiring requests */}
              {pendingRequests.length > 0 ? (
                pendingRequests.map((request: MarketplaceRequest) => {
                  const candidate = MARKETPLACE_EXECUTIVES.find(e => e.id === request.candidateId);
                  if (!candidate) return null;

                  return (
                    <View key={request.id} className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 mb-3">
                      <View className="flex-row items-center mb-3">
                        <UserPlus size={16} color="#a855f7" />
                        <Text className="text-purple-700 dark:text-purple-300 text-xs font-bold ml-1">HIRING REQUEST</Text>
                      </View>

                      {/* Candidate Info Header */}
                      <View className="flex-row items-start justify-between mb-3">
                        <View className="flex-row items-start flex-1">
                          <View className="bg-purple-500/20 rounded-full w-12 h-12 items-center justify-center mr-3">
                            <Text className="text-2xl">
                              {candidate.role === 'FractionalExec' ? '👔' : '🎓'}
                            </Text>
                          </View>
                          <View className="flex-1">
                            <Text className="text-purple-900 dark:text-purple-100 font-black text-base">{candidate.name}</Text>
                            <Text className="text-purple-700 dark:text-purple-300 text-sm">{candidate.function}</Text>
                            <View className="flex-row items-center gap-2 mt-1 flex-wrap">
                              <View className="bg-amber-500/20 px-2 py-0.5 rounded">
                                <Text className="text-amber-700 dark:text-amber-300 text-xs font-bold">⭐ {candidate.rating}</Text>
                              </View>
                              <View className={candidate.role === 'FractionalExec' ? 'bg-violet-500/20 px-2 py-0.5 rounded' : 'bg-emerald-500/20 px-2 py-0.5 rounded'}>
                                <Text className={candidate.role === 'FractionalExec' ? 'text-violet-700 dark:text-violet-300 text-xs font-bold' : 'text-emerald-700 dark:text-emerald-300 text-xs font-bold'}>
                                  {candidate.role === 'FractionalExec' ? 'Executive' : 'Apprentice'}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>
                        <View className="items-end ml-2">
                          <Text className="text-purple-700 dark:text-purple-300 font-black text-lg">
                            £{request.proposedDayRate}
                          </Text>
                          <Text className="text-purple-600 dark:text-purple-400 text-xs">/day</Text>
                        </View>
                      </View>

                      {/* Experience */}
                      <View className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-3 mb-3">
                        <Text className="text-purple-700 dark:text-purple-300 text-xs font-bold mb-1">EXPERIENCE</Text>
                        <Text className="text-gray-900 dark:text-white text-sm">{candidate.experience}</Text>
                      </View>

                      {/* Specialties */}
                      <View className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-3 mb-3">
                        <Text className="text-purple-700 dark:text-purple-300 text-xs font-bold mb-1">SPECIALTIES</Text>
                        <Text className="text-gray-900 dark:text-white text-sm">{candidate.specialties.join(', ')}</Text>
                      </View>

                      {/* Location */}
                      <View className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-3 mb-3">
                        <Text className="text-purple-700 dark:text-purple-300 text-xs font-bold mb-1">LOCATION</Text>
                        <Text className="text-gray-900 dark:text-white text-sm">
                          {candidate.location.city}, {candidate.location.country}
                          {candidate.location.remote && ' • Remote'}
                        </Text>
                      </View>

                      {/* Proposed Terms */}
                      <View className="bg-purple-100 dark:bg-purple-900/40 rounded-xl p-3 mb-3">
                        <Text className="text-purple-700 dark:text-purple-300 text-xs font-bold mb-1">PROPOSED TERMS</Text>
                        <Text className="text-purple-900 dark:text-purple-100 text-sm font-semibold">
                          {request.proposedDaysPerWeek} days/week • £{Math.round(request.proposedDayRate * request.proposedDaysPerWeek * 4.33)}/month
                        </Text>
                      </View>

                      {/* Request Notes */}
                      {request.notes && (
                        <View className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-3 mb-3">
                          <Text className="text-purple-700 dark:text-purple-300 text-xs font-bold mb-1">NOTES</Text>
                          <Text className="text-gray-900 dark:text-white text-sm italic">{request.notes}</Text>
                        </View>
                      )}

                      {/* Action Buttons */}
                      <View className="flex-row gap-2">
                        <Pressable
                          onPress={() => {
                            handleRejectMarketplaceRequest(request.id);
                            setShowApprovalQueue(false);
                          }}
                          className="flex-1 bg-red-500/20 border border-red-500/30 py-3 rounded-xl active:opacity-70"
                        >
                          <Text className="text-red-700 dark:text-red-400 text-center font-bold text-sm">Reject</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            handleApproveMarketplaceRequest(request.id, request.candidateId);
                            setShowApprovalQueue(false);
                          }}
                          className="flex-1 bg-emerald-500 py-3 rounded-xl active:opacity-70"
                        >
                          <Text className="text-white text-center font-bold text-sm">Approve & Add to Team</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <Text className="text-blue-900 dark:text-blue-100 text-sm">
                    No pending approvals. Hiring requests from the Team Management tab will appear here for founder review.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Hire Resource Modal */}
      {selectedOKRForHire && (
        <HireResourceModal
          visible={showHireModal}
          onClose={() => {
            setShowHireModal(false);
            setSelectedOKRForHire(null);
          }}
          okr={selectedOKRForHire}
        />
      )}

      {/* Get More Resources Modal */}
      <Modal
        visible={showGetResourcesModal}
        transparent
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowGetResourcesModal(false)}
      >
        <View className="flex-1 bg-black/70 justify-end">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end">
            <View className="bg-gray-100 dark:bg-slate-900 rounded-t-3xl" style={{ maxHeight: '85%' }}>
              {/* Header */}
              <View className="px-6 pt-6 pb-4 border-b border-gray-300 dark:border-slate-800">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <UserPlus size={24} color="#8b5cf6" />
                    <Text className="text-gray-900 dark:text-white text-xl font-bold ml-2">Get More Resources</Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      setShowGetResourcesModal(false);
                      setHireName('');
                      setSelectedAI(null);
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    className="w-10 h-10 items-center justify-center rounded-full bg-gray-200 dark:bg-slate-800 active:opacity-70"
                  >
                    <X size={24} color="#64748b" />
                  </Pressable>
                </View>
                <Text className="text-gray-600 dark:text-slate-400 text-sm mt-2">
                  Add team members or AI assistants to increase your capacity
                </Text>
              </View>

              {/* Tab Selector */}
              <View className="flex-row px-6 pt-4 gap-3">
                <Pressable
                  onPress={() => setResourceTypeTab('people')}
                  className={`flex-1 flex-row items-center justify-center py-3 rounded-xl ${
                    resourceTypeTab === 'people' ? 'bg-purple-500' : 'bg-gray-200 dark:bg-slate-800'
                  }`}
                >
                  <Users size={18} color={resourceTypeTab === 'people' ? '#fff' : '#64748b'} />
                  <Text className={`font-semibold ml-2 ${
                    resourceTypeTab === 'people' ? 'text-white' : 'text-gray-600 dark:text-slate-400'
                  }`}>Hire People</Text>
                </Pressable>
                <Pressable
                  onPress={() => setResourceTypeTab('ai')}
                  className={`flex-1 flex-row items-center justify-center py-3 rounded-xl ${
                    resourceTypeTab === 'ai' ? 'bg-purple-500' : 'bg-gray-200 dark:bg-slate-800'
                  }`}
                >
                  <Bot size={18} color={resourceTypeTab === 'ai' ? '#fff' : '#64748b'} />
                  <Text className={`font-semibold ml-2 ${
                    resourceTypeTab === 'ai' ? 'text-white' : 'text-gray-600 dark:text-slate-400'
                  }`}>Add AIs</Text>
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator className="px-6 py-4">
                {resourceTypeTab === 'people' ? (
                  <View>
                    {/* Role Selection */}
                    <Text className="text-gray-900 dark:text-white font-semibold mb-2">Role</Text>
                    <View className="flex-row gap-3 mb-4">
                      <Pressable
                        onPress={() => setHireRole('FractionalExec')}
                        className={`flex-1 p-3 rounded-xl border ${
                          hireRole === 'FractionalExec'
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400 dark:border-emerald-600'
                            : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'
                        }`}
                      >
                        <View className="flex-row items-center mb-1">
                          <Briefcase size={16} color={hireRole === 'FractionalExec' ? '#10b981' : '#64748b'} />
                          <Text className={`font-semibold ml-2 ${
                            hireRole === 'FractionalExec' ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-700 dark:text-slate-300'
                          }`}>Executive</Text>
                        </View>
                        <Text className={`text-xs ${
                          hireRole === 'FractionalExec' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-slate-500'
                        }`}>£800/day • 2 days/wk</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setHireRole('Apprentice')}
                        className={`flex-1 p-3 rounded-xl border ${
                          hireRole === 'Apprentice'
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600'
                            : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'
                        }`}
                      >
                        <View className="flex-row items-center mb-1">
                          <GraduationCap size={16} color={hireRole === 'Apprentice' ? '#3b82f6' : '#64748b'} />
                          <Text className={`font-semibold ml-2 ${
                            hireRole === 'Apprentice' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-slate-300'
                          }`}>Apprentice</Text>
                        </View>
                        <Text className={`text-xs ${
                          hireRole === 'Apprentice' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-slate-500'
                        }`}>£150/day • 5 days/wk</Text>
                      </Pressable>
                    </View>

                    {/* Name Input */}
                    <Text className="text-gray-900 dark:text-white font-semibold mb-2">Name</Text>
                    <TextInput
                      value={hireName}
                      onChangeText={setHireName}
                      placeholder="e.g., Sarah Johnson"
                      placeholderTextColor="#64748b"
                      className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white mb-4"
                    />

                    {/* Function Selection */}
                    <Text className="text-gray-900 dark:text-white font-semibold mb-2">Function</Text>
                    <View className="flex-row flex-wrap gap-2 mb-6">
                      {functions.map((func) => (
                        <Pressable
                          key={func}
                          onPress={() => setHireFunction(func)}
                          className={`px-3 py-2 rounded-lg ${
                            hireFunction === func
                              ? 'bg-purple-500'
                              : 'bg-gray-200 dark:bg-slate-800'
                          }`}
                        >
                          <Text className={`text-sm font-semibold ${
                            hireFunction === func
                              ? 'text-white'
                              : 'text-gray-700 dark:text-slate-300'
                          }`}>
                            {func}
                          </Text>
                        </Pressable>
                      ))}
                    </View>

                    {/* Hire Button */}
                    <Pressable
                      onPress={handleHireNewMember}
                      disabled={!hireName.trim()}
                      className={`py-4 rounded-xl flex-row items-center justify-center ${
                        hireName.trim() ? 'bg-purple-500 active:opacity-70' : 'bg-gray-300 dark:bg-slate-700'
                      }`}
                    >
                      <UserPlus size={20} color={hireName.trim() ? '#fff' : '#64748b'} />
                      <Text className={`font-bold text-lg ml-2 ${
                        hireName.trim() ? 'text-white' : 'text-gray-500'
                      }`}>
                        Hire {hireRole === 'FractionalExec' ? 'Executive' : 'Apprentice'}
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <View>
                    <Text className="text-gray-600 dark:text-slate-400 text-sm mb-4">
                      Select an AI assistant to help your team work faster
                    </Text>

                    {availableAIs.length === 0 ? (
                      <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                        <Text className="text-blue-700 dark:text-blue-300 text-center">
                          All available AI agents are already active in your organization.
                        </Text>
                      </View>
                    ) : (
                      <View className="gap-3 mb-4">
                        {availableAIs.map((ai) => (
                          <Pressable
                            key={ai.id}
                            onPress={() => setSelectedAI(selectedAI?.id === ai.id ? null : ai)}
                            className={`bg-white dark:bg-slate-800 border rounded-xl p-4 ${
                              selectedAI?.id === ai.id
                                ? 'border-purple-400 dark:border-purple-600'
                                : 'border-gray-200 dark:border-slate-700'
                            }`}
                          >
                            <View className="flex-row items-start justify-between">
                              <View className="flex-row items-start flex-1">
                                <View className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 items-center justify-center">
                                  <Bot size={20} color="#8b5cf6" />
                                </View>
                                <View className="ml-3 flex-1">
                                  <Text className="text-gray-900 dark:text-white font-bold">{ai.name}</Text>
                                  <Text className="text-gray-600 dark:text-slate-400 text-xs mt-0.5">{ai.purpose}</Text>
                                  <View className="flex-row items-center mt-2 gap-2 flex-wrap">
                                    <View className="bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded">
                                      <Text className="text-purple-700 dark:text-purple-300 text-[10px] font-semibold">
                                        {ai.functions.join(', ')}
                                      </Text>
                                    </View>
                                    <Text className="text-gray-500 dark:text-slate-500 text-[10px]">
                                      £{ai.costPerMonth}/mo
                                    </Text>
                                  </View>
                                </View>
                              </View>
                              {selectedAI?.id === ai.id && (
                                <View className="w-6 h-6 rounded-full bg-purple-500 items-center justify-center">
                                  <CheckCircle size={14} color="#fff" />
                                </View>
                              )}
                            </View>
                          </Pressable>
                        ))}
                      </View>
                    )}

                    {/* Add AI Button */}
                    {availableAIs.length > 0 && (
                      <Pressable
                        onPress={handleAddAI}
                        disabled={!selectedAI}
                        className={`py-4 rounded-xl flex-row items-center justify-center ${
                          selectedAI ? 'bg-purple-500 active:opacity-70' : 'bg-gray-300 dark:bg-slate-700'
                        }`}
                      >
                        <Bot size={20} color={selectedAI ? '#fff' : '#64748b'} />
                        <Text className={`font-bold text-lg ml-2 ${
                          selectedAI ? 'text-white' : 'text-gray-500'
                        }`}>
                          Add AI Assistant
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Rename OKR Modal (for merged tasks) */}
      <Modal
        visible={showRenameOKRModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowRenameOKRModal(false);
          setPendingMergeTaskIds([]);
          setRenameOKRTitle('');
        }}
      >
        <View className="flex-1 bg-black/50 items-center justify-center p-5">
          <View className="bg-white dark:bg-slate-900 rounded-2xl p-5 w-full max-w-sm">
            <Text className="text-gray-900 dark:text-white text-lg font-bold mb-2">
              Create OKR from Tasks
            </Text>
            <Text className="text-gray-600 dark:text-slate-400 text-sm mb-4">
              These tasks will be combined into a new OKR. Give it a name:
            </Text>
            <TextInput
              value={renameOKRTitle}
              onChangeText={setRenameOKRTitle}
              placeholder="Enter OKR title..."
              placeholderTextColor="#64748b"
              className="bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white mb-4"
              autoFocus
            />
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => {
                  setShowRenameOKRModal(false);
                  setPendingMergeTaskIds([]);
                  setRenameOKRTitle('');
                }}
                className="flex-1 bg-gray-200 dark:bg-slate-800 py-3 rounded-xl"
              >
                <Text className="text-gray-700 dark:text-slate-300 text-center font-semibold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmTaskMerge}
                disabled={!renameOKRTitle.trim()}
                className={`flex-1 py-3 rounded-xl ${
                  renameOKRTitle.trim() ? 'bg-purple-500' : 'bg-gray-300 dark:bg-slate-700'
                }`}
              >
                <Text className={`text-center font-semibold ${
                  renameOKRTitle.trim() ? 'text-white' : 'text-gray-500'
                }`}>Create OKR</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
