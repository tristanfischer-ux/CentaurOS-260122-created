import { View, Text, ScrollView, Pressable, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, LayoutChangeEvent } from 'react-native';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Target, Plus, Minus, X, ChevronDown, ChevronRight, CheckCircle2, Circle, Clock, Users, DollarSign, Lightbulb, ChevronUp, UserPlus, Zap, AlertTriangle, AlertCircle, TrendingDown, CalendarClock, ArrowRight, HelpCircle, Bot, Briefcase, GraduationCap, CheckCircle, GripVertical, Archive, Gauge } from 'lucide-react-native';
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
import { useRequestStore, type Request } from '@/lib/state/request-store';
import { HelpModal, HelpButton, type HelpContent } from '@/components/HelpModal';
import HireResourceModal from '@/components/HireResourceModal';
import { SwipeableOKRCard, SwipeableTaskCard } from '@/components/SwipeableOKRCard';
import { CompanyAimBanner } from '@/components/CompanyAimBanner';
import { CompanyAimModal } from '@/components/CompanyAimModal';
import { SquaresDisplay } from '@/components/SquaresDisplay';
import { useResourceStore, type PersonResource, getTeamSizeEfficiency } from '@/lib/state/resource-store';
import { ResourcePoolHeader } from '@/components/ResourcePoolHeader';
import { TaskDetailsModal } from '@/components/TaskDetailsModal';
import { MiniGanttChart } from '@/components/MiniGanttChart';
import { identifyTUOpportunities, type TUOpportunity } from '@/lib/reports/tu-analytics';

// Team efficiency types

const DECIDE_HELP: HelpContent = {
  title: 'Strategic Decisions',
  subtitle: 'Allocate resources and optimize with AI',
  description: 'The Decide tab is your strategic command center for resource allocation. Fractional Foundry uses Time Units (TU = 4 hours) as the fundamental unit of work. Here you allocate team capacity to tasks, leverage AI tools to boost productivity, and optimize your resource allocation based on real-time analytics.',
  tips: [
    'Use the ⚡ Auto-Allocate button to intelligently distribute available capacity across queued tasks',
    'Check Optimization Opportunities for skill mismatches, underutilization, and AI adoption recommendations—use "Auto-Fix All" to resolve issues instantly',
    'Tap the purple Gauge icon to access the TU Analytics Dashboard for deep insights into efficiency, forecasting, and team performance',
    'Tasks show AI efficiency badges when team members have AI tools equipped—these boost effective output per TU',
    'Tap a task to allocate resources, view details, and see AI boost options that can increase speed, quality, or flow',
    'The Resource Pool shows available capacity per person—Founders/Apprentices have 10 TU/week, Execs have 2 TU per day worked',
    'Swipe left on tasks to delete and free up allocated resources back to the pool',
    'Use the Ideas button for AI-powered task suggestions by business function',
  ],
  quickActions: [
    { label: '⚡ Auto-Allocate', description: 'Automatically distribute available capacity to queued tasks based on skills and availability' },
    { label: 'TU Analytics', description: 'Access comprehensive Time Unit analytics: efficiency, variance, forecasting, AI ROI, and team performance' },
    { label: 'Optimization Opportunities', description: 'View detected issues (skill mismatches, underutilization, AI gaps) with auto-fix capabilities' },
    { label: 'Resource Pool', description: 'View team capacity in Time Units (1 TU = 4 hours). Shows available vs. allocated capacity per person' },
    { label: 'Create Task', description: 'Add a new task with title, function, estimated TU, and priority. Tasks enter the queue until resources are allocated' },
    { label: 'Task Ideas', description: 'Browse AI-suggested tasks organized by business function: Build, Make, Sell, Serve, Ops' },
    { label: 'AI Loadout Display', description: 'Each person\'s equipped AI tools (Think/Create/Verify/Execute/Ops slots) boost their effective output per TU allocated' },
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
  const params = useLocalSearchParams<{ function?: string; showApprovalQueue?: string }>();

  // Use centralized OKR store
  const okrs = useOKRStore(s => s.okrs);
  const toggleOKRExpanded = useOKRStore(s => s.toggleOKRExpanded);
  const addOKR = useOKRStore(s => s.addOKR);
  const reorderOKRs = useOKRStore(s => s.reorderOKRs);

  // Work plans for decision context
  const workPlans = useWorkPlanStore(s => s.workPlans);
  const addWorkPlan = useWorkPlanStore(s => s.addWorkPlan);
  const updateWorkPlan = useWorkPlanStore(s => s.updateWorkPlan);
  const completeWorkPlan = useWorkPlanStore(s => s.completeWorkPlan);
  const abandonWorkPlan = useWorkPlanStore(s => s.abandonWorkPlan);

  // Debug: Log when workPlans changes
  useEffect(() => {
    console.log('[Decide] workPlans updated, count:', workPlans.length);
    workPlans.forEach(wp => {
      if (wp.assignedMemberIds && wp.assignedMemberIds.length > 0) {
        console.log('[Decide] Task with resources:', wp.title, 'members:', wp.assignedMemberIds.length);
      }
    });
  }, [workPlans]);

  // Task/OKR requests
  const taskOKRRequests = useRequestStore(s => s.requests);
  const approveTaskOKRRequest = useRequestStore(s => s.approveRequest);
  const rejectTaskOKRRequest = useRequestStore(s => s.rejectRequest);
  const initializeDemoRequests = useRequestStore(s => s.initializeDemoRequests);

  // Initialize demo requests on mount
  useEffect(() => {
    if (taskOKRRequests.length === 0) {
      initializeDemoRequests();
    }
  }, []);

  // Filter pending task/OKR requests
  const pendingTaskOKRRequests = useMemo(() => {
    return taskOKRRequests.filter(req => req.status === 'pending');
  }, [taskOKRRequests]);

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

  // Swipe-to-queue confirmation modal state
  const [showQueueConfirmModal, setShowQueueConfirmModal] = useState(false);
  const [pendingQueueOKR, setPendingQueueOKR] = useState<OKR | null>(null);
  const [pendingQueueTask, setPendingQueueTask] = useState<WorkPlan | null>(null);

  // Resource allocation flow state
  // When a task is selected, it appears below the resource pool
  // Then you tap people in the pool to allocate to the selected task
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [selectedTaskForAllocation, setSelectedTaskForAllocation] = useState<WorkPlan | null>(null);
  const [editedTaskTitle, setEditedTaskTitle] = useState<string>('');
  const [editedTaskDescription, setEditedTaskDescription] = useState<string>('');

  // Task details modal state (for completed/abandoned tasks)
  const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false);
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<WorkPlan | null>(null);


  // Old drag and drop state (to be removed)
  const [draggingOKRId, setDraggingOKRId] = useState<string | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dropTargetTaskId, setDropTargetTaskId] = useState<string | null>(null);
  const [dropZoneActive, setDropZoneActive] = useState<'active' | 'queued' | 'create-okr' | null>(null);
  const [dragOverOKRId, setDragOverOKRId] = useState<string | null>(null);
  const [showRenameOKRModal, setShowRenameOKRModal] = useState(false);
  const [renameOKRTitle, setRenameOKRTitle] = useState('');
  const [pendingMergeTaskIds, setPendingMergeTaskIds] = useState<string[]>([]);

  // Drop zone position tracking
  const [dropZoneY, setDropZoneY] = useState<number>(0);
  const dropZoneRef = useRef<View>(null);

  // Re-measure drop zone position
  const measureDropZone = useCallback(() => {
    if (dropZoneRef.current) {
      dropZoneRef.current.measureInWindow((x, y, width, height) => {
        console.log('[MeasureDropZone]', { x, y, width, height, center: y + height / 2 });
        if (y > 0) {
          setDropZoneY(y + height / 2);
        }
      });
    }
  }, []);

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

  // Organization members for assignment
  const orgMembers = useOrganizationStore(s => s.members);

  // Initialize organization if empty
  useEffect(() => {
    if (orgMembers.length === 0) {
      useOrganizationStore.getState().initializeOrganization();
    }
  }, [orgMembers.length]);

  // Initialize resource store if empty
  const resourcePeople = useResourceStore(s => s.people);
  const seedResourceData = useResourceStore(s => s.seedDemoData);
  const getTotalCapacity = useResourceStore(s => s.getTotalCapacity);
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

  // Calculate TU optimization opportunities
  const tuOpportunities = useMemo(() => {
    const activeMembers = orgMembers.filter(m => m.status === 'active');
    return identifyTUOpportunities(workPlans, activeMembers);
  }, [workPlans, orgMembers]);

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

  // Get assigned members for a work plan, sorted by seniority
  const getAssignedMembers = (workPlan: WorkPlan) => {
    const memberIds = workPlan.assignedMemberIds || [];
    const roleOrder = { Founder: 0, FractionalExec: 1, Apprentice: 2 };

    return memberIds
      .map(id => orgMembers.find(m => m.id === id))
      .filter((m): m is OrganizationMember => m !== undefined)
      .sort((a, b) => roleOrder[a.role] - roleOrder[b.role]); // Most senior first
  };

  // Calculate task costs based on assigned members and squares
  const calculateTaskCost = (workPlan: WorkPlan) => {
    const assignedMembers = getAssignedMembers(workPlan);
    const teamSize = assignedMembers.length;
    const totalSquares = workPlan.estimatedTimeUnits;
    const allocatedPerWeek = workPlan.allocatedTimeUnitsPerWeek || 2; // Default 2□/week
    const remainingSquares = Math.ceil(totalSquares * (1 - workPlan.progress / 100));

    // Get team efficiency based on team size
    const teamEfficiency = getTeamSizeEfficiency(teamSize);

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

    // Effective output per week (accounting for team efficiency)
    const effectiveOutputPerWeek = allocatedPerWeek * teamEfficiency.efficiencyMultiplier;

    // Cumulative cost = total squares × average cost per square
    const cumulativeCost = Math.round(totalSquares * avgCostPerSquare);

    // Remaining cost = remaining squares × average cost per square
    const remainingCost = Math.round(remainingSquares * avgCostPerSquare);

    // Cost per week = allocated squares per week × average cost per square
    const costPerWeek = Math.round(allocatedPerWeek * avgCostPerSquare);

    // Weeks to complete = remaining squares / effective output per week (with efficiency)
    const weeksToComplete = effectiveOutputPerWeek > 0 ? Math.ceil(remainingSquares / effectiveOutputPerWeek) : 0;

    return {
      cumulativeCost,
      remainingCost,
      costPerWeek,
      weeksToComplete,
      avgCostPerSquare,
      allocatedPerWeek,
      totalSquares,
      remainingSquares,
      teamEfficiency,
      effectiveOutputPerWeek: Math.round(effectiveOutputPerWeek * 10) / 10,
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

  // Auto-open approval queue if requested from home tab
  useEffect(() => {
    if (params.showApprovalQueue === 'true' && pendingRequests.length > 0) {
      setShowApprovalQueue(true);
    }
  }, [params.showApprovalQueue, pendingRequests.length]);

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
      // An OKR is active if it has work plans WITH assigned members
      const hasActiveWork = linkedPlans.some(plan =>
        plan.assignedMemberIds && plan.assignedMemberIds.length > 0
      );

      if (hasActiveWork) {
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

  // Keep selected task synchronized with latest workPlans data
  useEffect(() => {
    if (selectedTaskForAllocation) {
      const updatedTask = workPlans.find(wp => wp.id === selectedTaskForAllocation.id);
      if (updatedTask) {
        setSelectedTaskForAllocation(updatedTask);
      }
    }
  }, [workPlans, selectedTaskForAllocation]);

  // Handle swipe-left on OKR to move to queue
  const handleOKRSwipeLeft = useCallback((okrId: string) => {
    const okr = activeOKRs.find(o => o.id === okrId);
    if (okr) {
      setPendingQueueOKR(okr);
      setShowQueueConfirmModal(true);
    }
  }, [activeOKRs]);

  // Handle swipe-left on task to abandon (delete)
  const handleTaskSwipeLeft = useCallback((taskId: string) => {
    const task = workPlans.find(wp => wp.id === taskId);
    if (task) {
      setPendingQueueTask(task);
      setShowQueueConfirmModal(true);
    }
  }, [workPlans]);

  // Handle person selection from resource pool
  // If a task is already selected, allocate this person's TUs to it
  // Otherwise, just select the person for later allocation
  const handlePersonSelect = useCallback((personId: string) => {
    if (selectedTaskForAllocation) {
      // Task is selected: allocate this person's TUs to the task
      const member = orgMembers.find(m => m.id === personId);
      if (!member) return;

      // Calculate available TUs for this person
      const totalCapacity = member.role === 'Founder' || member.role === 'Apprentice' ? 10 : (member.daysPerWeek || 2) * 2;
      const allocated = workPlans
        .filter(wp => wp.status !== 'completed' && wp.status !== 'abandoned')
        .reduce((total, wp) => {
          const allocation = wp.allocations.find(a => a.memberId === personId);
          return total + (allocation?.squaresPerWeek || 0);
        }, 0);
      const available = totalCapacity - allocated;

      if (available <= 0) {
        Alert.alert('No Available TUs', `${member.name} has no available time units to allocate.`);
        return;
      }

      // Allocate 1 TU to the selected task
      const allocateAmount = Math.min(1, available);

      // Add allocation to task
      const existingAlloc = selectedTaskForAllocation.allocations.find(a => a.memberId === personId);
      const newAllocations = existingAlloc
        ? selectedTaskForAllocation.allocations.map(a =>
            a.memberId === personId
              ? { ...a, squaresPerWeek: a.squaresPerWeek + allocateAmount }
              : a
          )
        : [
            ...selectedTaskForAllocation.allocations,
            {
              memberId: personId,
              memberName: member.name,
              squaresPerWeek: allocateAmount,
              costPerSquare: member.costPerDay ? (member.costPerDay / 2) : 50,
            }
          ];

      updateWorkPlan(selectedTaskForAllocation.id, {
        allocations: newAllocations,
        assignedMemberIds: newAllocations.map(a => a.memberId),
        status: 'in-progress' as const,
      });

      // Update the selected task state to show new allocations
      const updatedTask = workPlans.find(wp => wp.id === selectedTaskForAllocation.id);
      if (updatedTask) {
        setSelectedTaskForAllocation(updatedTask);
      }
    } else {
      // No task selected: just select this person for later allocation
      setSelectedPersonId(personId);
    }
  }, [selectedTaskForAllocation, orgMembers, workPlans, updateWorkPlan, setSelectedPersonId]);

  // Handle task card press for allocation
  const handleTaskPress = useCallback((task: WorkPlan) => {
    if (selectedPersonId) {
      // Allocation mode: allocate person's TUs to this task
      const member = useOrganizationStore.getState().members.find(m => m.id === selectedPersonId);
      if (!member) return;

      // Calculate available TUs for this person
      const totalCapacity = member.role === 'Founder' || member.role === 'Apprentice' ? 10 : (member.daysPerWeek || 2) * 2;
      const allocated = workPlans
        .filter(wp => wp.status !== 'completed' && wp.status !== 'abandoned')
        .reduce((total, wp) => {
          const allocation = wp.allocations.find(a => a.memberId === selectedPersonId);
          return total + (allocation?.squaresPerWeek || 0);
        }, 0);
      const available = totalCapacity - allocated;

      if (available <= 0) {
        Alert.alert('No Available TUs', `${member.name} has no available time units to allocate.`);
        return;
      }

      // Default allocation: allocate 1 TU to start (user can adjust in modal)
      const allocateAmount = Math.min(1, available);

      // Add allocation to task
      const existingAlloc = task.allocations.find(a => a.memberId === selectedPersonId);
      const newAllocations = existingAlloc
        ? task.allocations.map(a =>
            a.memberId === selectedPersonId
              ? { ...a, squaresPerWeek: a.squaresPerWeek + allocateAmount }
              : a
          )
        : [
            ...task.allocations,
            {
              memberId: selectedPersonId,
              memberName: member.name,
              squaresPerWeek: allocateAmount,
              costPerSquare: member.costPerDay ? (member.costPerDay / 2) : 50, // Rough estimate
            }
          ];

      updateWorkPlan(task.id, {
        allocations: newAllocations,
        assignedMemberIds: newAllocations.map(a => a.memberId),
        status: 'in-progress' as const,
      });

      // Clear selection after allocation
      setSelectedPersonId(null);

      Alert.alert(
        'TUs Allocated',
        `${allocateAmount} TU${allocateAmount !== 1 ? 's' : ''} from ${member.name} allocated to "${task.title}". Tap the task again to adjust allocation.`
      );
    } else {
      // No person selected: select this task to show details panel below resource pool
      setSelectedTaskForAllocation(task);
    }
  }, [selectedPersonId, workPlans, updateWorkPlan]);

  // Handle adjusting allocation amount for a team member
  const handleAdjustAllocation = useCallback((taskId: string, memberId: string, change: number) => {
    const task = workPlans.find(wp => wp.id === taskId);
    if (!task) return;

    const member = useOrganizationStore.getState().members.find(m => m.id === memberId);
    if (!member) return;

    // Calculate available TUs for this person
    const totalCapacity = member.role === 'Founder' || member.role === 'Apprentice' ? 10 : (member.daysPerWeek || 2) * 2;
    const allocated = workPlans
      .filter(wp => wp.status !== 'completed' && wp.status !== 'abandoned' && wp.id !== taskId)
      .reduce((total, wp) => {
        const allocation = wp.allocations.find(a => a.memberId === memberId);
        return total + (allocation?.squaresPerWeek || 0);
      }, 0);
    const available = totalCapacity - allocated;

    const currentAlloc = task.allocations.find(a => a.memberId === memberId);
    if (!currentAlloc) return;

    const newAmount = currentAlloc.squaresPerWeek + change;

    // If going to 0 or below, remove the person entirely
    if (newAmount <= 0) {
      const newAllocations = task.allocations.filter(a => a.memberId !== memberId);

      updateWorkPlan(taskId, {
        allocations: newAllocations,
        assignedMemberIds: newAllocations.map(a => a.memberId),
        // If no one is allocated, move to not-started
        status: newAllocations.length === 0 ? 'not-started' : task.status,
      });

      // Update the selected task state to reflect changes
      setSelectedTaskForAllocation(prev => prev ? {
        ...prev,
        allocations: newAllocations,
        assignedMemberIds: newAllocations.map(a => a.memberId),
        status: newAllocations.length === 0 ? 'not-started' : prev.status,
      } : null);
      return;
    }

    if (change > 0 && change > available) {
      Alert.alert('Insufficient Capacity', `${member.name} only has ${available}□ available.`);
      return;
    }

    // Update allocation
    const newAllocations = task.allocations.map(a =>
      a.memberId === memberId
        ? { ...a, squaresPerWeek: newAmount }
        : a
    );

    updateWorkPlan(taskId, {
      allocations: newAllocations,
      assignedMemberIds: newAllocations.map(a => a.memberId),
    });

    // Update the selected task state to reflect changes
    setSelectedTaskForAllocation(prev => prev ? { ...prev, allocations: newAllocations } : null);
  }, [workPlans, updateWorkPlan]);

  // Adjust estimated time units (Required field)
  const handleAdjustEstimatedTimeUnits = useCallback((taskId: string, change: number) => {
    const task = workPlans.find(wp => wp.id === taskId);
    if (!task) return;

    const newEstimatedTimeUnits = task.estimatedTimeUnits + change;

    // Don't allow going below 1 TU
    if (newEstimatedTimeUnits < 1) {
      Alert.alert('Minimum Required', 'Task must require at least 1□.');
      return;
    }

    // Update work plan
    updateWorkPlan(taskId, {
      estimatedTimeUnits: newEstimatedTimeUnits,
    });

    // Update the selected task state to reflect changes
    setSelectedTaskForAllocation(prev => prev ? { ...prev, estimatedTimeUnits: newEstimatedTimeUnits } : null);
  }, [workPlans, updateWorkPlan]);

  // Confirm allocation changes
  const handleConfirmAllocation = useCallback(() => {
    if (selectedTaskForAllocation) {
      // Save title and description if they were edited
      const updates: Partial<WorkPlan> = {};
      if (editedTaskTitle && editedTaskTitle !== selectedTaskForAllocation.title) {
        updates.title = editedTaskTitle;
      }
      if (editedTaskDescription && editedTaskDescription !== selectedTaskForAllocation.description) {
        updates.description = editedTaskDescription;
      }
      if (Object.keys(updates).length > 0) {
        updateWorkPlan(selectedTaskForAllocation.id, updates);
      }
      setSelectedTaskForAllocation(null);
      setEditedTaskTitle('');
      setEditedTaskDescription('');
      Alert.alert('Confirmed', 'Resource allocation confirmed!');
    }
  }, [selectedTaskForAllocation, editedTaskTitle, editedTaskDescription, updateWorkPlan]);

  // Handle saving task title
  const handleSaveTaskTitle = useCallback(() => {
    if (selectedTaskForAllocation && editedTaskTitle && editedTaskTitle !== selectedTaskForAllocation.title) {
      updateWorkPlan(selectedTaskForAllocation.id, { title: editedTaskTitle });
      setSelectedTaskForAllocation(prev => prev ? { ...prev, title: editedTaskTitle } : null);
    }
  }, [selectedTaskForAllocation, editedTaskTitle, updateWorkPlan]);

  // Handle saving task description
  const handleSaveTaskDescription = useCallback(() => {
    if (selectedTaskForAllocation && editedTaskDescription && editedTaskDescription !== selectedTaskForAllocation.description) {
      updateWorkPlan(selectedTaskForAllocation.id, { description: editedTaskDescription });
      setSelectedTaskForAllocation(prev => prev ? { ...prev, description: editedTaskDescription } : null);
    }
  }, [selectedTaskForAllocation, editedTaskDescription, updateWorkPlan]);

  // Initialize edited title and description when task is selected
  useEffect(() => {
    if (selectedTaskForAllocation) {
      setEditedTaskTitle(selectedTaskForAllocation.title);
      setEditedTaskDescription(selectedTaskForAllocation.description || '');
    } else {
      setEditedTaskTitle('');
      setEditedTaskDescription('');
    }
  }, [selectedTaskForAllocation?.id]);

  // Auto-allocate resources to tasks intelligently
  const handleAutoAllocate = useCallback(() => {
    const orgMembers = useOrganizationStore.getState().members.filter(m => m.status === 'active');

    // Calculate available capacity for each member
    const memberAvailability = orgMembers.map(member => {
      const totalCapacity = member.role === 'Founder' || member.role === 'Apprentice'
        ? 10
        : (member.daysPerWeek || 2) * 2;

      const allocated = workPlans
        .filter(wp => wp.status !== 'completed' && wp.status !== 'abandoned')
        .reduce((total, wp) => {
          const allocation = wp.allocations.find(a => a.memberId === member.id);
          return total + (allocation?.squaresPerWeek || 0);
        }, 0);

      const available = totalCapacity - allocated;
      const costPerTU = member.role === 'Founder'
        ? 960
        : member.role === 'FractionalExec'
          ? Math.round((member.costPerDay || 800) / 2)
          : 70;

      return {
        id: member.id,
        name: member.name,
        role: member.role,
        function: member.function,
        available,
        costPerTU,
      };
    }).filter(m => m.available > 0); // Only members with availability

    // Get tasks that need resources (prioritize active tasks with partial allocation, then queued tasks)
    const tasksNeedingResources = workPlans
      .filter(wp =>
        wp.status !== 'completed' &&
        wp.status !== 'abandoned'
      )
      .map(wp => {
        const currentAllocation = wp.allocations?.reduce((sum, a) => sum + a.squaresPerWeek, 0) || 0;
        const needed = wp.estimatedTimeUnits - currentAllocation;
        const hasPartialAllocation = currentAllocation > 0 && needed > 0;
        const isQueued = !wp.assignedMemberIds || wp.assignedMemberIds.length === 0;

        return {
          task: wp,
          needed,
          hasPartialAllocation,
          isQueued,
          priority: hasPartialAllocation ? 1 : isQueued ? 2 : 3, // Active partial > Queued > Active full
        };
      })
      .filter(t => t.needed > 0)
      .sort((a, b) => a.priority - b.priority); // Sort by priority

    if (tasksNeedingResources.length === 0) {
      Alert.alert('Auto-Allocate', 'All tasks are fully allocated!');
      return;
    }

    if (memberAvailability.length === 0) {
      Alert.alert('Auto-Allocate', 'No available capacity to allocate!');
      return;
    }

    let allocationsAdded = 0;

    // Allocate resources
    tasksNeedingResources.forEach(({ task, needed }) => {
      // Find members matching the task function first
      const matchingMembers = memberAvailability
        .filter(m => m.function === task.function && m.available > 0)
        .sort((a, b) => a.costPerTU - b.costPerTU); // Prefer lower cost

      // Then find other available members
      const otherMembers = memberAvailability
        .filter(m => m.function !== task.function && m.available > 0)
        .sort((a, b) => a.costPerTU - b.costPerTU);

      const availableMembers = [...matchingMembers, ...otherMembers];

      let remaining = needed;

      availableMembers.forEach(member => {
        if (remaining <= 0 || member.available <= 0) return;

        const allocateAmount = Math.min(remaining, member.available, 2); // Allocate max 2 TUs at a time for distribution

        const existingAlloc = task.allocations.find(a => a.memberId === member.id);
        const newAllocations = existingAlloc
          ? task.allocations.map(a =>
              a.memberId === member.id
                ? { ...a, squaresPerWeek: a.squaresPerWeek + allocateAmount }
                : a
            )
          : [
              ...task.allocations,
              {
                memberId: member.id,
                memberName: member.name,
                squaresPerWeek: allocateAmount,
                costPerSquare: member.costPerTU,
              }
            ];

        updateWorkPlan(task.id, {
          allocations: newAllocations,
          assignedMemberIds: newAllocations.map(a => a.memberId),
          status: 'in-progress' as const,
        });

        member.available -= allocateAmount;
        remaining -= allocateAmount;
        allocationsAdded++;
      });
    });

    Alert.alert(
      'Auto-Allocate Complete',
      `Successfully allocated resources to tasks!\n\n${allocationsAdded} allocation${allocationsAdded !== 1 ? 's' : ''} added.`
    );
  }, [workPlans, updateWorkPlan]);

  // Auto-allocate a single task
  const handleAutoAllocateTask = useCallback((taskId: string) => {
    const task = workPlans.find(wp => wp.id === taskId);
    if (!task) return;

    const orgMembers = useOrganizationStore.getState().members.filter(m => m.status === 'active');

    // Calculate available capacity for each member
    const memberAvailability = orgMembers.map(member => {
      const totalCapacity = member.role === 'Founder' || member.role === 'Apprentice' ? 10 : (member.daysPerWeek || 2) * 2;
      const allocated = workPlans
        .filter(wp => wp.status !== 'completed' && wp.status !== 'abandoned')
        .reduce((total, wp) => {
          const allocation = wp.allocations?.find(a => a.memberId === member.id);
          return total + (allocation?.squaresPerWeek || 0);
        }, 0);
      const available = totalCapacity - allocated;
      const costPerTU = member.role === 'Founder' ? 960 :
                        member.role === 'FractionalExec' ? Math.round((member.costPerDay || 800) / 2) :
                        70;

      return { ...member, available, costPerTU };
    });

    // Find members matching the task function first
    const matchingMembers = memberAvailability
      .filter(m => m.function === task.function && m.available > 0)
      .sort((a, b) => a.costPerTU - b.costPerTU); // Prefer lower cost

    // Then find other available members
    const otherMembers = memberAvailability
      .filter(m => m.function !== task.function && m.available > 0)
      .sort((a, b) => a.costPerTU - b.costPerTU);

    const availableMembers = [...matchingMembers, ...otherMembers];

    if (availableMembers.length === 0) {
      Alert.alert('No Available Resources', 'No team members have available capacity for this task.');
      return;
    }

    let needed = task.estimatedTimeUnits;
    const newAllocations: Array<{ memberId: string; memberName: string; squaresPerWeek: number; costPerSquare: number }> = [];

    availableMembers.forEach(member => {
      if (needed <= 0 || member.available <= 0) return;

      const allocateAmount = Math.min(needed, member.available, 2); // Allocate max 2 TUs at a time for distribution

      newAllocations.push({
        memberId: member.id,
        memberName: member.name,
        squaresPerWeek: allocateAmount,
        costPerSquare: member.costPerTU,
      });

      member.available -= allocateAmount;
      needed -= allocateAmount;
    });

    if (newAllocations.length > 0) {
      updateWorkPlan(task.id, {
        allocations: newAllocations,
        assignedMemberIds: newAllocations.map(a => a.memberId),
        allocatedTimeUnitsPerWeek: newAllocations.reduce((sum, a) => sum + a.squaresPerWeek, 0),
        status: 'in-progress' as const,
      });

      Alert.alert(
        'Task Auto-Allocated',
        `Resources allocated to "${task.title}"!\n\n${newAllocations.map(a => `• ${a.memberName}: ${a.squaresPerWeek}□/wk`).join('\n')}`
      );
    } else {
      Alert.alert('Unable to Allocate', 'No available capacity to allocate to this task.');
    }
  }, [workPlans, updateWorkPlan]);

  // Auto-fix TU optimization opportunity
  const handleAutoFixOpportunity = useCallback((opportunity: TUOpportunity) => {
    if (opportunity.type === 'skill_mismatch') {
      // Find tasks with skill mismatches and try to reassign
      const tasksToFix = workPlans.filter(wp => opportunity.affectedTasks.includes(wp.title));

      tasksToFix.forEach(task => {
        // Find mismatched allocations
        const mismatchedAllocs = task.allocations?.filter(alloc => {
          const member = orgMembers.find(m => m.id === alloc.memberId);
          return member && member.function !== task.function;
        }) || [];

        // Try to find matching replacements
        mismatchedAllocs.forEach(alloc => {
          const replacementMember = orgMembers.find(m =>
            m.status === 'active' &&
            m.function === task.function &&
            !task.allocations?.some(a => a.memberId === m.id)
          );

          if (replacementMember) {
            // Calculate capacity
            const totalCapacity = replacementMember.role === 'Founder' || replacementMember.role === 'Apprentice'
              ? 10
              : (replacementMember.daysPerWeek || 2) * 2;

            const allocated = workPlans
              .filter(wp => wp.status !== 'completed' && wp.status !== 'abandoned' && wp.id !== task.id)
              .reduce((total, wp) => {
                const allocation = wp.allocations?.find(a => a.memberId === replacementMember.id);
                return total + (allocation?.squaresPerWeek || 0);
              }, 0);

            const available = totalCapacity - allocated;

            if (available >= alloc.squaresPerWeek) {
              // Remove old allocation and add new one
              const newAllocations = [
                ...(task.allocations?.filter(a => a.memberId !== alloc.memberId) || []),
                {
                  memberId: replacementMember.id,
                  memberName: replacementMember.name,
                  squaresPerWeek: alloc.squaresPerWeek,
                  costPerSquare: replacementMember.role === 'Founder' ? 960 :
                                 replacementMember.role === 'FractionalExec' ? Math.round((replacementMember.costPerDay || 800) / 2) :
                                 70,
                }
              ];

              updateWorkPlan(task.id, {
                allocations: newAllocations,
                assignedMemberIds: newAllocations.map(a => a.memberId),
              });
            }
          }
        });
      });

      Alert.alert('Fixed', `Skill mismatches resolved for ${tasksToFix.length} task(s).`);
    } else if (opportunity.type === 'ai_adoption') {
      Alert.alert('AI Tools', 'Navigate to the task allocation panel to add AI tools with multipliers (2x-20x).');
    } else if (opportunity.type === 'underutilization') {
      Alert.alert('Underutilization', 'Use the ⚡ Auto-Allocate button to distribute spare capacity to queued tasks.');
    }
  }, [workPlans, orgMembers, updateWorkPlan]);

  // Apply all opportunity fixes
  const handleAutoFixAll = useCallback(() => {
    let fixedCount = 0;

    tuOpportunities.forEach(opp => {
      if (opp.type === 'skill_mismatch') {
        handleAutoFixOpportunity(opp);
        fixedCount++;
      }
    });

    if (fixedCount > 0) {
      Alert.alert('Auto-Fix Complete', `Applied ${fixedCount} optimization fix(es).`);
    } else {
      Alert.alert('Auto-Fix', 'No automatic fixes available. Some optimizations require manual intervention.');
    }
  }, [tuOpportunities, handleAutoFixOpportunity]);

  // Confirm moving OKR to queue or abandoning task
  const confirmMoveToQueue = useCallback(() => {
    if (pendingQueueOKR) {
      // Move OKR to queue - remove all assigned members from linked work plans
      const linkedPlans = workPlans.filter(wp => wp.linkedOKRTitle === pendingQueueOKR.title);
      linkedPlans.forEach(plan => {
        updateWorkPlan(plan.id, { assignedMemberIds: [], status: 'not-started' });
      });
    } else if (pendingQueueTask) {
      // Abandon task - frees all TU allocations and moves to abandoned list
      abandonWorkPlan(pendingQueueTask.id, 'User deleted task via swipe');
    }

    setShowQueueConfirmModal(false);
    setPendingQueueOKR(null);
    setPendingQueueTask(null);
  }, [pendingQueueOKR, pendingQueueTask, workPlans, updateWorkPlan, abandonWorkPlan]);

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
    // Use the actual drop zone Y position with a threshold
    const threshold = 100; // pixels of tolerance (increased for better detection)

    if (draggingOKRId) {
      const isFromActive = activeOKRs.some(o => o.id === okrId);

      console.log('[DragMove]', {
        okrId,
        absoluteY,
        dropZoneY,
        isFromActive,
        diff: absoluteY - dropZoneY,
        threshold,
      });

      // If dragging from active section and cursor is below the drop zone, activate queue drop
      if (isFromActive && dropZoneY > 0 && absoluteY > dropZoneY - threshold) {
        console.log('[DragMove] Activating QUEUED drop zone');
        setDropZoneActive('queued');
      }
      // If dragging from queue and cursor is above the drop zone, activate active drop
      else if (!isFromActive && dropZoneY > 0 && absoluteY < dropZoneY + threshold) {
        console.log('[DragMove] Activating ACTIVE drop zone');
        setDropZoneActive('active');
      }
      else {
        setDropZoneActive(null);
      }
    }
  }, [draggingOKRId, activeOKRs, dropZoneY]);

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
    // Use the actual drop zone Y position
    const threshold = 50;

    if (dropZoneY > 0 && absoluteY > dropZoneY - threshold) {
      setDropZoneActive('queued');
    } else {
      setDropZoneActive(null);
    }
  }, [dropZoneY]);

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
      Alert.alert('Error', 'Please enter a task title');
      return;
    }
    if (!newOKRDescription.trim()) {
      Alert.alert('Error', 'Please enter a task description');
      return;
    }

    // Create a work plan (task) instead of an OKR
    const newWorkPlan: WorkPlan = {
      id: `wp-${Date.now()}`,
      workspaceId: currentWorkspace?.id || 'workspace-demo-company',
      title: newOKRTitle,
      description: newOKRDescription,
      function: newOKRFunction,
      linkedOKRTitle: '',
      dueDate: '',
      status: 'not-started',
      progress: 0,
      assignedBy: 'User',
      needsSubmission: false,
      estimatedTimeUnits: 8, // Default 8 TUs (can be adjusted later)
      allocations: [],
      appliedAITools: [],
      assignedMemberIds: [],
      tusExpended: 0,
    };

    addWorkPlan(newWorkPlan);

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

    Alert.alert('Success', 'Task created successfully! You can now allocate resources to it.');
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
              onPress={() => router.push('/tu-dashboard')}
              className="bg-purple-500/90 rounded-xl p-2.5 active:opacity-70"
            >
              <Gauge size={20} color="#fff" />
            </Pressable>
            <Pressable
              onPress={handleAutoAllocate}
              className="bg-emerald-500/90 rounded-xl p-2.5 active:opacity-70"
            >
              <Zap size={20} color="#fff" />
            </Pressable>
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
          {(() => {
            const activeTasks = workPlans.filter(wp =>
              wp.status !== 'completed' &&
              wp.status !== 'abandoned' &&
              wp.assignedMemberIds &&
              wp.assignedMemberIds.length > 0
            );
            const queuedTasks = workPlans.filter(wp =>
              wp.status !== 'completed' &&
              wp.status !== 'abandoned' &&
              (!wp.assignedMemberIds || wp.assignedMemberIds.length === 0)
            );

            return (
              <>
                {activeTasks.length > 0 && (
                  <View className="flex-row items-center">
                    <View className="w-2 h-2 rounded-full mr-1.5 bg-emerald-400" />
                    <Text className="text-white/90 text-xs">{activeTasks.length} active</Text>
                  </View>
                )}
                {queuedTasks.length > 0 && (
                  <View className="flex-row items-center">
                    <View className="w-2 h-2 rounded-full mr-1.5 bg-blue-400" />
                    <Text className="text-white/90 text-xs">{queuedTasks.length} queued</Text>
                  </View>
                )}
              </>
            );
          })()}
        </View>
      </LinearGradient>

      {/* SECTION 1: TASK TIMELINE GANTT CHART - TOP */}
      <MiniGanttChart
        workPlans={workPlans}
        members={orgMembers}
        selectedTaskId={selectedTaskForAllocation?.id}
        onTaskPress={(taskId) => {
          const task = workPlans.find(wp => wp.id === taskId);
          if (task) {
            handleTaskPress(task);
          }
        }}
      />

      {/* SECTION 2: TASK QUEUE - MIDDLE (Scrollable) */}
      <ScrollView className="flex-1 px-5 py-4">
        {/* Section Title */}
        <View className="mb-4">
          <Text className="text-gray-900 dark:text-white text-lg font-bold">
            Task Queue
          </Text>
          <Text className="text-gray-600 dark:text-slate-400 text-xs mt-0.5">
            Current activities and upcoming work
          </Text>
        </View>

        {/* Selected Task Allocation Panel - Appears below resource pool */}
        {selectedTaskForAllocation && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            className="mb-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-2 border-blue-400 dark:border-blue-600 rounded-2xl p-4 shadow-lg"
          >
            {/* Close button */}
            <Pressable
              onPress={() => setSelectedTaskForAllocation(null)}
              className="absolute top-3 right-3 z-10 bg-white dark:bg-slate-800 rounded-full p-1"
            >
              <X size={16} color="#3b82f6" />
            </Pressable>

            {/* Editable Title */}
            <View className="mb-2">
              <Text className="text-blue-600 dark:text-blue-400 text-xs font-semibold mb-1">
                Task Name
              </Text>
              <TextInput
                value={editedTaskTitle}
                onChangeText={setEditedTaskTitle}
                onBlur={handleSaveTaskTitle}
                className="text-blue-900 dark:text-blue-100 font-bold text-base bg-white dark:bg-slate-800 rounded-lg px-3 py-2 border border-blue-200 dark:border-blue-700"
                placeholder="Enter task name"
                placeholderTextColor="#94a3b8"
                multiline
              />
            </View>

            {/* Editable Description */}
            <View className="mb-3">
              <Text className="text-blue-600 dark:text-blue-400 text-xs font-semibold mb-1">
                Description
              </Text>
              <TextInput
                value={editedTaskDescription}
                onChangeText={setEditedTaskDescription}
                onBlur={handleSaveTaskDescription}
                className="text-blue-700 dark:text-blue-300 text-sm bg-white dark:bg-slate-800 rounded-lg px-3 py-2 border border-blue-200 dark:border-blue-700"
                placeholder="Enter task description"
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Resource allocation display */}
            <View className="bg-white dark:bg-slate-800 rounded-lg p-3 mb-3">
              <View className="flex-row items-center justify-between mb-2">
                {/* Required field with +/- buttons */}
                <View className="flex-row items-center gap-2">
                  <Text className="text-gray-600 dark:text-slate-400 text-xs mr-1">Required:</Text>

                  {/* Minus button */}
                  <Pressable
                    onPress={() => handleAdjustEstimatedTimeUnits(selectedTaskForAllocation.id, -1)}
                    className="bg-red-100 dark:bg-red-900/30 w-7 h-7 rounded-full items-center justify-center active:opacity-70"
                  >
                    <Minus size={14} color="#ef4444" />
                  </Pressable>

                  {/* Display */}
                  <View className="bg-gray-50 dark:bg-slate-900 px-3 py-1 rounded">
                    <Text className="text-gray-900 dark:text-white font-bold">
                      {selectedTaskForAllocation.estimatedTimeUnits}□
                    </Text>
                  </View>

                  {/* Plus button */}
                  <Pressable
                    onPress={() => handleAdjustEstimatedTimeUnits(selectedTaskForAllocation.id, 1)}
                    className="bg-emerald-100 dark:bg-emerald-900/30 w-7 h-7 rounded-full items-center justify-center active:opacity-70"
                  >
                    <Plus size={14} color="#10b981" />
                  </Pressable>
                </View>

                {/* Allocated field */}
                <Text className={`font-semibold ${
                  (selectedTaskForAllocation.allocations?.reduce((sum, a) => sum + a.squaresPerWeek, 0) || 0) >= selectedTaskForAllocation.estimatedTimeUnits
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-orange-600 dark:text-orange-400'
                }`}>
                  Allocated: {selectedTaskForAllocation.allocations?.reduce((sum, a) => sum + a.squaresPerWeek, 0) || 0}□
                </Text>
              </View>

              {/* Progress bar */}
              <View className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <View
                  className={`h-full ${
                    (selectedTaskForAllocation.allocations?.reduce((sum, a) => sum + a.squaresPerWeek, 0) || 0) >= selectedTaskForAllocation.estimatedTimeUnits
                      ? 'bg-emerald-500'
                      : 'bg-orange-500'
                  }`}
                  style={{
                    width: `${Math.min(100, ((selectedTaskForAllocation.allocations?.reduce((sum, a) => sum + a.squaresPerWeek, 0) || 0) / selectedTaskForAllocation.estimatedTimeUnits) * 100)}%`
                  }}
                />
              </View>

              {/* Team members allocated */}
              {selectedTaskForAllocation.allocations && selectedTaskForAllocation.allocations.length > 0 && (
                <View className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700">
                  <Text className="text-gray-600 dark:text-slate-400 text-xs font-semibold mb-2">
                    Team Members:
                  </Text>
                  {selectedTaskForAllocation.allocations.map((alloc) => (
                    <View key={alloc.memberId} className="flex-row items-center justify-between mb-2 bg-gray-50 dark:bg-slate-900 rounded-lg p-2">
                      <Text className="text-gray-900 dark:text-white text-sm flex-1">
                        {alloc.memberName}
                      </Text>
                      <View className="flex-row items-center gap-2">
                        {/* Minus button */}
                        <Pressable
                          onPress={() => handleAdjustAllocation(selectedTaskForAllocation.id, alloc.memberId, -1)}
                          className="bg-red-100 dark:bg-red-900/30 w-7 h-7 rounded-full items-center justify-center active:opacity-70"
                        >
                          <Minus size={14} color="#ef4444" />
                        </Pressable>

                        {/* Allocation display */}
                        <View className="bg-white dark:bg-slate-800 px-2 py-1 rounded">
                          <Text className="text-gray-900 dark:text-white text-sm font-semibold">
                            {alloc.squaresPerWeek}□/wk
                          </Text>
                        </View>

                        {/* Plus button */}
                        <Pressable
                          onPress={() => handleAdjustAllocation(selectedTaskForAllocation.id, alloc.memberId, 1)}
                          className="bg-emerald-100 dark:bg-emerald-900/30 w-7 h-7 rounded-full items-center justify-center active:opacity-70"
                        >
                          <Plus size={14} color="#10b981" />
                        </Pressable>

                        <Text className="text-gray-500 dark:text-slate-500 text-xs ml-1">
                          £{alloc.costPerSquare * alloc.squaresPerWeek}/wk
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Cost and timeline calculation */}
            <View className="flex-row gap-2">
              <View className="flex-1 bg-white dark:bg-slate-800 rounded-lg p-2">
                <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">
                  Total Cost
                </Text>
                <Text className="text-gray-900 dark:text-white font-bold">
                  £{Math.round(
                    (selectedTaskForAllocation.allocations?.reduce((sum, a) => sum + (a.costPerSquare * a.squaresPerWeek), 0) || 0) *
                    (selectedTaskForAllocation.estimatedTimeUnits / Math.max(1, selectedTaskForAllocation.allocations?.reduce((sum, a) => sum + a.squaresPerWeek, 0) || 1))
                  ).toLocaleString()}
                </Text>
              </View>
              <View className="flex-1 bg-white dark:bg-slate-800 rounded-lg p-2">
                <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">
                  Completion Time
                </Text>
                <Text className="text-gray-900 dark:text-white font-bold">
                  {(() => {
                    const weeks = Math.ceil(
                      selectedTaskForAllocation.estimatedTimeUnits /
                      Math.max(1, selectedTaskForAllocation.allocations?.reduce((sum, a) => sum + a.squaresPerWeek, 0) || 1)
                    );
                    const days = weeks * 5; // 5 working days per week
                    return `${days} day${days !== 1 ? 's' : ''}`;
                  })()}
                </Text>
              </View>
            </View>

            {/* Instructions */}
            <View className="mt-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg p-2">
              <Text className="text-blue-800 dark:text-blue-200 text-xs text-center">
                💡 Tap team members in the resource pool above to allocate their time to this task
              </Text>
            </View>

            {/* Confirm button */}
            <Pressable
              onPress={handleConfirmAllocation}
              className="mt-3 bg-emerald-500 py-3 rounded-lg active:opacity-80"
            >
              <Text className="text-white font-bold text-center text-base">
                ✓ Confirm Allocation
              </Text>
            </Pressable>

            {/* Delete button */}
            <Pressable
              onPress={() => {
                Alert.alert(
                  'Delete Task',
                  'Delete this task and free all allocated resources?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => {
                        abandonWorkPlan(selectedTaskForAllocation.id, 'Deleted by user');
                        setSelectedTaskForAllocation(null);
                      }
                    }
                  ]
                );
              }}
              className="mt-2 bg-red-100 dark:bg-red-900/30 py-2 rounded-lg active:opacity-70"
            >
              <Text className="text-red-600 dark:text-red-400 font-semibold text-center text-sm">
                Delete Task & Free Resources
              </Text>
            </Pressable>
          </Animated.View>
        )}

        {/* ACTIVE TASKS (with resources allocated) */}
        {(() => {
          // Helper to calculate days to completion
          const calculateDaysToCompletion = (plan: WorkPlan): number => {
            const totalAllocated = plan.allocations?.reduce((sum, a) => sum + a.squaresPerWeek, 0) || 0;
            if (totalAllocated === 0) return Infinity; // No allocation = infinite days
            const weeks = Math.ceil(plan.estimatedTimeUnits / totalAllocated);
            return weeks * 5; // 5 working days per week
          };

          const activeTasks = workPlans
            .filter(wp =>
              (selectedFunction === 'all' || wp.function === selectedFunction) &&
              wp.status !== 'completed' &&
              wp.status !== 'abandoned' &&
              wp.assignedMemberIds &&
              wp.assignedMemberIds.length > 0
            )
            .sort((a, b) => calculateDaysToCompletion(a) - calculateDaysToCompletion(b)); // Sort by days (shortest first)

          return activeTasks.length > 0 ? (
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <View>
                  <Text className="text-gray-900 dark:text-white text-base font-bold">
                    Current Activities
                  </Text>
                  <Text className="text-gray-600 dark:text-slate-400 text-xs mt-0.5">
                    Tasks in progress with team assigned
                  </Text>
                </View>
                <View className="bg-emerald-500/10 dark:bg-emerald-500/20 px-3 py-1 rounded-full">
                  <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                    {activeTasks.length} active
                  </Text>
                </View>
              </View>

              <View className="gap-3">{activeTasks.map((plan) => {
                  const assignedMembers = getAssignedMembers(plan);
                  const taskCost = calculateTaskCost(plan);
                  const daysToCompletion = calculateDaysToCompletion(plan);

                  return (
                    <View key={plan.id} className="flex-row items-center gap-2">
                      {/* Team Avatars - positioned immediately to the left */}
                      {assignedMembers.length > 0 ? (
                        <View className="flex-row">
                          {assignedMembers.length > 3 && (
                            <View className="w-8 h-8 rounded-full items-center justify-center bg-gray-400 border-2 border-white dark:border-slate-950" style={{ marginRight: -10, zIndex: 0 }}>
                              <Text className="text-white font-bold text-[10px]">+{assignedMembers.length - 3}</Text>
                            </View>
                          )}
                          {assignedMembers.slice(0, 3).map((member, idx) => (
                            <View
                              key={member.id}
                              className="w-8 h-8 rounded-full items-center justify-center border-2 border-white dark:border-slate-950"
                              style={{
                                backgroundColor: getRoleColor(member.role),
                                marginRight: idx < assignedMembers.slice(0, 3).length - 1 ? -10 : 0,
                                zIndex: idx + 1
                              }}
                            >
                              <Text className="text-white font-bold text-[10px]">{getInitials(member.name)}</Text>
                            </View>
                          ))}
                        </View>
                      ) : null}

                      {/* Task Card */}
                      <View className="flex-1">
                    <SwipeableTaskCard
                      taskId={plan.id}
                      onSwipeLeft={handleTaskSwipeLeft}
                      onPress={() => handleTaskPress(plan)}
                    >
                      <View
                        className={`bg-white dark:bg-slate-800 border rounded-2xl p-4 shadow-sm ${
                          selectedTaskForAllocation?.id === plan.id
                            ? 'border-blue-500 dark:border-blue-400'
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
                                <View className="bg-purple-100 dark:bg-purple-900/30 px-1.5 py-0.5 rounded">
                                  <Text className="text-purple-600 dark:text-purple-400 text-[10px] font-semibold">
                                    {plan.function}
                                  </Text>
                                </View>
                              </View>
                            </View>

                            {/* Days to Completion Badge */}
                            <View className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-lg">
                              <Text className="text-blue-700 dark:text-blue-300 text-xs font-bold">
                                {daysToCompletion}d
                              </Text>
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
                          <Text className="text-gray-600 dark:text-slate-400 text-[10px] font-semibold">
                            £{taskCost.cumulativeCost.toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    </SwipeableTaskCard>
                  </View>
                </View>
                );
                })}
              </View>
            </View>
          ) : null;
        })()}

        {/* QUEUED TASKS (no resources allocated) */}
        {(() => {
          const queuedTasks = workPlans
            .filter(wp =>
              (selectedFunction === 'all' || wp.function === selectedFunction) &&
              wp.status !== 'completed' &&
              wp.status !== 'abandoned' &&
              (!wp.assignedMemberIds || wp.assignedMemberIds.length === 0)
            )
            .sort((a, b) => a.estimatedTimeUnits - b.estimatedTimeUnits); // Sort by required TUs (smallest first)

          return queuedTasks.length > 0 ? (
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <View>
                  <Text className="text-gray-900 dark:text-white text-base font-bold">
                    Future Activities
                  </Text>
                  <Text className="text-gray-600 dark:text-slate-400 text-xs mt-0.5">
                    Upcoming tasks awaiting resource allocation
                  </Text>
                </View>
                <View className="bg-orange-500/10 dark:bg-orange-500/20 px-3 py-1 rounded-full">
                  <Text className="text-orange-600 dark:text-orange-400 text-xs font-bold">
                    {queuedTasks.length} queued
                  </Text>
                </View>
              </View>

              <View className="gap-3">{queuedTasks.map((plan) => {
                  const assignedMembers = getAssignedMembers(plan);
                  const taskCost = calculateTaskCost(plan);
                  // Estimate days if allocated minimum (1 TU per week)
                  const estimatedDays = Math.ceil(plan.estimatedTimeUnits / 1) * 5; // Assume 1 TU/week minimum

                  return (
                    <SwipeableTaskCard
                      key={plan.id}
                      taskId={plan.id}
                      onSwipeLeft={handleTaskSwipeLeft}
                      onPress={() => handleTaskPress(plan)}
                    >
                      <View
                        className={`bg-white dark:bg-slate-800 border rounded-2xl shadow-sm ${
                          selectedTaskForAllocation?.id === plan.id
                            ? 'border-blue-500 dark:border-blue-400'
                            : 'border-gray-200 dark:border-slate-700'
                        }`}
                      >
                        {/* Card Header */}
                        <View className="p-3 pb-0">
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
                                <View className="bg-purple-100 dark:bg-purple-900/30 px-1.5 py-0.5 rounded">
                                  <Text className="text-purple-600 dark:text-purple-400 text-[10px] font-semibold">
                                    {plan.function}
                                  </Text>
                                </View>
                              </View>
                            </View>

                            {/* Estimated Days Badge */}
                            <View className="bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-lg mr-2">
                              <Text className="text-orange-700 dark:text-orange-300 text-xs font-bold">
                                ~{estimatedDays}d
                              </Text>
                            </View>

                            {/* Empty avatar placeholder */}
                            <View className="w-8 h-8 rounded-full items-center justify-center bg-gray-200 dark:bg-slate-700 border-2 border-dashed border-gray-400 dark:border-slate-500">
                              <Plus size={14} color="#9ca3af" />
                            </View>
                          </View>

                          {/* Squares Display */}
                          <View className="mt-2 flex-row items-center justify-between">
                            <View className="flex-row items-center gap-2">
                              <Text className="text-gray-600 dark:text-slate-400 text-xs">
                                Needs {plan.estimatedTimeUnits}□
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Action Buttons */}
                        <View className="px-3 pb-3 pt-2 flex-row gap-2">
                          <Pressable
                            onPress={(e) => {
                              e.stopPropagation();
                              handleAutoAllocateTask(plan.id);
                            }}
                            className="flex-1 bg-emerald-500 rounded-lg py-2.5 px-3 flex-row items-center justify-center active:opacity-70"
                          >
                            <Zap size={14} color="#fff" />
                            <Text className="text-white text-xs font-bold ml-1.5">Auto-Allocate</Text>
                          </Pressable>
                          <Pressable
                            onPress={(e) => {
                              e.stopPropagation();
                              handleTaskPress(plan);
                            }}
                            className="flex-1 bg-purple-500 rounded-lg py-2.5 px-3 flex-row items-center justify-center active:opacity-70"
                          >
                            <UserPlus size={14} color="#fff" />
                            <Text className="text-white text-xs font-bold ml-1.5">Choose Team</Text>
                          </Pressable>
                        </View>
                      </View>
                    </SwipeableTaskCard>
                  );
                })}
              </View>
            </View>
          ) : null;
        })()}
      </ScrollView>

      {/* SECTION 3: WEEKLY RESOURCE POOL - BOTTOM */}
      <View className="border-t-2 border-gray-200 dark:border-slate-700">
        <View className="px-5 pt-3 pb-2 bg-gray-50 dark:bg-slate-900">
          <Text className="text-gray-900 dark:text-white text-lg font-bold">
            Weekly Resource Pool
          </Text>
          <Text className="text-gray-600 dark:text-slate-400 text-xs mt-0.5">
            Team capacity and availability
          </Text>
        </View>
        <ResourcePoolHeader
          selectedPersonId={selectedPersonId}
          onPersonSelect={handlePersonSelect}
        />
      </View>

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
                  <Text className="text-gray-900 dark:text-white text-xl font-bold">Create Tasks</Text>
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
                  Create new tasks and assign them to team members. Tasks will appear in the Queued section until you allocate resources.
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

      {/* Queue Confirmation Modal */}
      <Modal
        visible={showQueueConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowQueueConfirmModal(false);
          setPendingQueueOKR(null);
          setPendingQueueTask(null);
        }}
      >
        <View className="flex-1 bg-black/70 items-center justify-center p-5">
          <View className="bg-white dark:bg-slate-900 rounded-2xl p-5 w-full max-w-sm">
            <View className="items-center mb-4">
              <View className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 items-center justify-center mb-3">
                <Archive size={28} color="#ef4444" />
              </View>
              <Text className="text-gray-900 dark:text-white text-lg font-bold mb-2 text-center">
                {pendingQueueOKR ? 'Move OKR to Queue?' : 'Delete Task?'}
              </Text>
              <Text className="text-gray-600 dark:text-slate-400 text-sm text-center">
                {pendingQueueOKR
                  ? `All team members will be unassigned from "${pendingQueueOKR.title}" and work will be paused.`
                  : pendingQueueTask
                  ? `All team members will be unassigned from "${pendingQueueTask.title}" and all allocated TUs will be returned to the resource pool. The task will move to the abandoned tasks list at the bottom.`
                  : ''}
              </Text>
            </View>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => {
                  setShowQueueConfirmModal(false);
                  setPendingQueueOKR(null);
                  setPendingQueueTask(null);
                }}
                className="flex-1 bg-gray-200 dark:bg-slate-800 py-3 rounded-xl active:opacity-70"
              >
                <Text className="text-gray-700 dark:text-slate-300 text-center font-semibold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={confirmMoveToQueue}
                className="flex-1 bg-red-500 py-3 rounded-xl active:opacity-70"
              >
                <Text className="text-white text-center font-semibold">
                  {pendingQueueOKR ? 'Move to Queue' : 'Delete Task'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Task Details Modal (for completed/abandoned tasks) */}
      <TaskDetailsModal
        visible={showTaskDetailsModal}
        onClose={() => {
          setShowTaskDetailsModal(false);
          setSelectedTaskForDetails(null);
        }}
        task={selectedTaskForDetails}
      />
    </View>
  );
}
