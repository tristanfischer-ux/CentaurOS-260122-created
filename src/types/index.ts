// Core domain types for Centaur OS

export type Role = 'Founder' | 'Apprentice' | 'FractionalExec' | 'Government';
export type Function = 'Finance' | 'Sales' | 'Marketing' | 'Ops' | 'Engineering' | 'Admin';
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ProjectStatus = 'planning' | 'active' | 'paused' | 'completed' | 'cancelled';
export type ReviewStatus = 'pending' | 'approved' | 'changes_requested';
export type KRHealthStatus = 'on_track' | 'at_risk' | 'off_track';
export type ThemeMode = 'light' | 'dark' | 'off-white' | 'system';
export type WorkflowItemStatus = 'suggested' | 'allocated' | 'structured' | 'assigned' | 'in_progress' | 'submitted' | 'verified' | 'completed';
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'counter-offered';
export type EngagementStatus = 'active' | 'paused' | 'ended';
export type Availability = '1-day' | '2-day' | '3-day' | 'full-time' | 'part-time';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

// OKR Planner types
export type PlanConfidence = 'high' | 'medium' | 'low';
export type PlanArchetype =
  | 'Speed Run'
  | 'Lean Baseline'
  | 'Expert Burst'
  | 'Two-Track'
  | 'Manufacturing Loop'
  | 'Quality Shield'
  | 'Revenue Strike'
  | 'Overhead Reset';

// Manufacturing capabilities
export type ManufacturingCapability =
  | 'Additive Manufacturing - Plastic'
  | 'Additive Manufacturing - Metal'
  | 'EPS Molding'
  | 'EPP Molding'
  | 'Heat Chest Molding'
  | 'Injection Molding'
  | 'Blow Molding'
  | 'Rotational Molding'
  | 'Vacuum Forming'
  | 'Vacuum Casting'
  | 'Laser Cutting'
  | 'CNC Machining'
  | 'Waterjet Cutting'
  | 'Sheet Metal Fabrication'
  | 'Welding & Assembly'
  | 'Wire Harness Assembly'
  | 'PCB Assembly'
  | 'Electronic Assembly'
  | 'Cable Assembly'
  | 'Powder Coating'
  | 'Anodizing'
  | 'Electroplating'
  | 'Electroforming'
  | 'Screen Printing'
  | 'Pad Printing'
  | 'Die Casting'
  | 'Investment Casting'
  | 'Extrusion'
  | 'Compression Molding'
  | 'Overmolding'
  | 'Insert Molding'
  | 'Ultrasonic Welding'
  | 'Heat Staking'
  | 'Final Assembly & Packaging'
  | 'Quality Control & Testing'
  | 'Certification Support'
  | 'Design for Manufacturing';

export type SupplierStatus = 'pending_approval' | 'approved' | 'verified' | 'suspended' | 'rejected';

export type SupplierRegion = 'UK' | 'EU' | 'North America' | 'Asia' | 'Global';

// User
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
  preferences?: {
    themeMode: ThemeMode;
  };
  // Extended profile data for different roles
  executiveProfile?: ExecutiveProfile;
  apprenticeProfile?: ApprenticeProfile;
}

// Executive Profile (for fractional executives offering services)
export interface ExecutiveProfile {
  userId: string;
  primaryFunction: Function;
  secondaryFunctions?: Function[];
  yearsOfExperience: number;
  availability: Availability;
  dayRate: number;
  currency: string;
  skills: string[];
  bio: string;
  linkedInUrl?: string;
  portfolioUrl?: string;
  currentEngagements: string[]; // companyIds/workspaceIds
  maxEngagements: number;
  isAvailable: boolean;
  completedEngagements?: number;
  rating?: number; // 1-5 stars
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;
}

// Apprentice Profile (for apprentices seeking work opportunities)
export interface ApprenticeProfile {
  userId: string;
  functionInterest: Function;
  secondaryFunctionInterests?: Function[];
  education?: {
    degree?: string;
    institution?: string;
    graduationYear?: number;
  };
  technicalSkills: {
    name: string;
    level: SkillLevel;
  }[];
  softSkills: string[];
  learningGoals: string;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedInUrl?: string;
  availability: Availability;
  dayRate: number;
  currency: string;
  isAvailable: boolean;
  currentEngagement?: string; // workspaceId
  completedTasks?: number;
  rating?: number; // 1-5 stars
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;
}

// Invitation (from founder to executive/apprentice)
export interface Invitation {
  id: string;
  fromWorkspaceId: string;
  fromUserId: string; // Founder who sent invitation
  toUserId: string; // Executive or Apprentice
  role: Role;
  function: Function;
  roleName: string; // e.g., "VP of Sales", "Marketing Apprentice"
  commitment: string; // e.g., "2 days/week", "Full-time"
  proposedRate: number;
  currency: string;
  message?: string;
  status: InvitationStatus;
  counterOffer?: {
    rate: number;
    commitment: string;
    message: string;
  };
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Engagement (accepted invitation becomes an engagement)
export interface Engagement {
  id: string;
  invitationId: string;
  workspaceId: string;
  userId: string;
  role: Role;
  function: Function;
  roleName: string;
  commitment: string;
  rate: number;
  currency: string;
  startDate: string;
  endDate?: string;
  status: EngagementStatus;
  createdAt: string;
  updatedAt: string;
}

// Workspace
export interface Workspace {
  id: string;
  name: string;
  createdAt: string;
  ownerId: string;
  companyProfile?: CompanyProfile; // Optional public profile
}

// Company Profile (for networking and discovery)
export interface CompanyProfile {
  workspaceId: string;
  companyName: string;
  tagline?: string;
  description?: string;
  industry: string;
  stage: 'idea' | 'pre-seed' | 'seed' | 'series-a' | 'series-b+' | 'revenue' | 'growth';
  location: {
    city: string;
    country: string;
    region?: string;
  };
  website?: string;
  linkedIn?: string;
  twitter?: string;
  teamSize?: string; // '1-5', '6-10', '11-25', '26-50', '51-100', '100+'
  productType?: 'hardware' | 'software' | 'hardware+software' | 'services' | 'other';
  lookingFor: string[]; // e.g., 'co-founders', 'advisors', 'suppliers', 'customers', 'investors', 'partnerships'
  tags: string[]; // e.g., 'IoT', 'Medical Devices', 'Consumer Electronics', 'Climate Tech'
  isPublic: boolean; // Whether the profile is visible in the directory
  visibility: 'public' | 'network-only' | 'private'; // Who can see the profile
  updatedAt: string;
  createdAt: string;
}

// Company Connection (between workspaces)
export interface CompanyConnection {
  id: string;
  fromWorkspaceId: string;
  toWorkspaceId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  requestedBy: string; // User ID
  requestMessage?: string;
  respondedBy?: string; // User ID
  responseMessage?: string;
  connectedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Community Event (meetups, workshops, office hours)
export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  eventType: 'meetup' | 'workshop' | 'office-hours' | 'demo-day' | 'networking' | 'social' | 'webinar';
  organizerWorkspaceId: string;
  organizerUserId: string;
  startTime: string;
  endTime: string;
  timezone: string;
  location: {
    type: 'in-person' | 'virtual' | 'hybrid';
    venue?: string;
    address?: string;
    city?: string;
    country?: string;
    virtualLink?: string;
  };
  capacity?: number;
  isPublic: boolean; // Visible to all Centaur OS users or just connections
  requiresApproval: boolean; // Whether RSVPs need organizer approval
  tags: string[];
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Event RSVP
export interface EventRSVP {
  id: string;
  eventId: string;
  workspaceId: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected' | 'confirmed' | 'cancelled';
  attendeeCount: number; // How many people from this company
  note?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Membership
export interface Membership {
  id: string;
  workspaceId: string;
  userId: string;
  role: Role;
  function: Function;
  joinedAt: string;
  permissions?: Record<string, boolean>;
}

// Objective
export interface Objective {
  id: string;
  workspaceId: string;
  title: string;
  description?: string;
  ownerId: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'archived';
  calculatedProgress?: number; // Auto-calculated from linked tasks (0-100)
  createdAt: string;
  updatedAt: string;
}

// Key Result
export interface KeyResult {
  id: string;
  objectiveId: string;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: string; // e.g., "%", "$", "users", "MRR"
  ownerId: string;
  healthStatus: KRHealthStatus;
  createdAt: string;
  updatedAt: string;
}

// Metric Event (for tracking KR progress over time)
export interface MetricEvent {
  id: string;
  keyResultId: string;
  value: number;
  note?: string;
  recordedBy: string;
  recordedAt: string;
}

// Project
export interface Project {
  id: string;
  workspaceId: string;
  objectiveId?: string; // Optional link to objective
  title: string;
  description?: string;
  ownerId: string;
  status: ProjectStatus;
  startDate?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Task
export interface Task {
  id: string;
  workspaceId: string;
  projectId?: string;
  objectiveId?: string; // Link task to an objective
  okrId?: string; // Direct link to OKR for planning
  title: string;
  description?: string;
  assigneeId?: string;
  status: TaskStatus;
  priority: TaskPriority;
  function: Function;
  dueDate?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  attachments?: Attachment[];
  // Planning system extensions
  estimatedHours?: number; // Required for capacity planning
  actualHours?: number; // Logged hours on this task
  reopenedCount?: number; // Rework tracking (tasks sent back)
  blockerId?: string; // What's blocking this task (task/supplier ID)
  blockerType?: 'task' | 'supplier' | 'approval' | 'external';
}

// Time Entry
export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  workspaceId: string;
  hours: number;
  date: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

// Attachment
export interface Attachment {
  id: string;
  name: string;
  uri: string;
  type: string; // 'image' | 'document' | 'other'
  size: number;
  uploadedBy: string;
  uploadedAt: string;
}

// Task Comment
export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// Review
export interface Review {
  id: string;
  taskId: string;
  reviewerId: string;
  status: ReviewStatus;
  notes?: string;
  attachments?: Attachment[];
  requestedAt: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Weekly Pack
export interface WeeklyPack {
  id: string;
  workspaceId: string;
  title: string;
  htmlContent: string;
  weekStart: string;
  weekEnd: string;
  generatedBy: string;
  generatedAt: string;
  metadata?: {
    okrSnapshot: any;
    tasksCompleted: number;
    risksCount: number;
    decisionsCount: number;
  };
}

// Template
export interface Template {
  id: string;
  workspaceId?: string; // null for system templates
  title: string;
  description?: string;
  function: Function;
  taskTemplate: {
    title: string;
    description?: string;
    priority: TaskPriority;
    estimatedDays?: number;
  };
  createdBy?: string;
  isSystem: boolean;
  createdAt: string;
}

// Audit Log
export interface AuditLog {
  id: string;
  workspaceId: string;
  actorId: string;
  action: string; // e.g., "task.created", "review.approved", "okr.updated"
  objectType: string; // e.g., "task", "review", "objective"
  objectId: string;
  payloadSummary?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Copilot Types
export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  proposedActions?: ProposedAction[];
}

export interface ProposedAction {
  id: string;
  type: 'create_task' | 'update_kr' | 'create_project' | 'flag_risk';
  description: string;
  payload: any;
  status: 'pending' | 'approved' | 'rejected';
}

// Workflow Item (for suggested task sequences)
export interface WorkflowItem {
  id: string;
  workspaceId: string;
  function: Function;
  title: string;
  description: string;
  sequenceOrder: number;
  status: WorkflowItemStatus;
  allocatedToExecId?: string; // Founder allocates to Exec
  structuredByExecId?: string; // Exec structures the task
  taskId?: string; // Linked task when assigned to Apprentice
  submittedAt?: string; // When Apprentice submits for verification
  verifiedAt?: string; // When Exec verifies
  completedAt?: string; // When Founder marks complete
  createdAt: string;
  updatedAt: string;
  metadata?: {
    estimatedHours?: number;
    dependencies?: string[]; // Other workflow item IDs
    resources?: string[];
  };
}

// Suggested Workflow Templates
export interface WorkflowTemplate {
  id: string;
  function: Function;
  title: string;
  description: string;
  items: {
    title: string;
    description: string;
    sequenceOrder: number;
    estimatedHours?: number;
    dependencies?: number[]; // Indexes of dependent items
  }[];
  isSystem: boolean;
  createdBy?: string;
  createdAt: string;
}

// Supplier (shared across all workspaces on the platform)
export interface Supplier {
  id: string;
  name: string;
  description: string;
  capabilities: ManufacturingCapability[];
  region: SupplierRegion;
  location: {
    city: string;
    country: string;
    postcode?: string;
  };
  contact: {
    email: string;
    phone?: string;
    website?: string;
    contactName?: string;
  };
  certifications: string[]; // e.g., "ISO 9001", "ISO 13485"
  minimumOrderQuantity?: number;
  leadTimeWeeks?: number;
  status: SupplierStatus;
  rating?: number; // 1-5 stars
  reviewCount?: number;
  recommendedByWorkspaceIds: string[]; // Which workspaces recommended this supplier
  approvedByAdminAt?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    notes?: string;
    yearEstablished?: number;
    employeeCount?: string;
    priceRange?: 'budget' | 'mid-range' | 'premium';
  };
  // Enhanced detailed fields (matching AI tools)
  detailedDescription?: string; // Long-form description
  specialties?: string[]; // What they're best known for
  materials?: string[]; // Materials they work with
  industries?: string[]; // Industries they serve
  caseStudies?: {
    title: string;
    client: string;
    challenge: string;
    solution: string;
    results: string[];
  }[];
  pricing?: {
    setup?: string;
    perUnit?: string;
    minimumProject?: string;
    notes?: string;
  };
  qualityControl?: {
    processes: string[];
    certifications: string[];
    defectRate?: string;
  };
  equipment?: {
    machines: string[];
    capacity: string;
    technology: string[];
  };
  support?: {
    designAssistance: boolean;
    prototyping: boolean;
    engineering: boolean;
    logistics: boolean;
  };
  customerReviews?: {
    rating: number;
    totalReviews: number;
    pros: string[];
    cons: string[];
    testimonials?: {
      company: string;
      quote: string;
      author: string;
      role: string;
    }[];
  };
}

// Supplier Recommendation (when someone suggests a new supplier)
export interface SupplierRecommendation {
  id: string;
  supplierId?: string; // If recommending existing supplier for new capability
  workspaceId: string;
  recommendedBy: string; // User ID
  supplierName: string;
  description: string;
  capabilities: ManufacturingCapability[];
  region: SupplierRegion;
  location: {
    city: string;
    country: string;
  };
  contact: {
    email: string;
    phone?: string;
    website?: string;
  };
  rationale: string; // Why they're recommending this supplier
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string; // Admin/Executive who reviewed
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
}

// View models for UI
export interface TaskWithDetails extends Task {
  assignee?: User;
  project?: Project;
  comments?: TaskComment[];
  review?: Review;
}

export interface ObjectiveWithKRs extends Objective {
  keyResults: KeyResult[];
  owner: User;
  projects: Project[];
}

export interface DashboardStats {
  role: Role;
  kpiTiles?: {
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'flat';
    delta?: string;
  }[];
  krProgress?: {
    krId: string;
    title: string;
    progress: number;
    healthStatus: KRHealthStatus;
  }[];
  riskAlerts?: {
    id: string;
    type: 'kr_off_track' | 'task_overdue' | 'decision_pending';
    message: string;
    severity: 'low' | 'medium' | 'high';
  }[];
  todaysTasks?: Task[];
  reviewQueue?: Review[];
}

// Report Types
export type ReportType = 'founder' | 'executive' | 'apprentice';
export type ReportPeriod = 'week' | 'month' | 'quarter' | 'custom';

export interface Report {
  id: string;
  workspaceId: string;
  reportType: ReportType;
  period: ReportPeriod;
  startDate: string;
  endDate: string;
  generatedAt: string;
  generatedBy: string;
  data: FounderReportData | ExecutiveReportData | ApprenticeReportData;
  metadata?: {
    totalPages?: number;
    includeCharts?: boolean;
    exportFormat?: 'pdf' | 'csv' | 'json';
  };
}

// Founder Report - Board-ready business overview
export interface FounderReportData {
  overview: {
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    totalTimeLogged: number;
    activeWorkflowItems: number;
    completedWorkflowItems: number;
    totalTeamMembers: number;
    activeFunctions: Function[];
  };
  okrProgress: {
    objectiveId: string;
    objectiveTitle: string;
    progress: number;
    healthStatus: KRHealthStatus;
    keyResultsCount: number;
    owner: string;
  }[];
  executivePerformance: {
    executiveId: string;
    executiveName: string;
    function: Function;
    tasksCreated: number;
    tasksCompleted: number;
    workflowItemsStructured: number;
    apprenticeWorkVerified: number;
    hoursLogged: number;
  }[];
  apprenticeUtilization: {
    apprenticeId: string;
    apprenticeName: string;
    function: Function;
    tasksAssigned: number;
    tasksCompleted: number;
    hoursLogged: number;
    averageTaskCompletionDays: number;
    utilizationRate: number;
  }[];
  projectStatus: {
    projectId: string;
    projectTitle: string;
    status: ProjectStatus;
    tasksTotal: number;
    tasksCompleted: number;
    owner: string;
  }[];
  risks: {
    type: 'kr_off_track' | 'task_overdue' | 'workflow_blocked' | 'low_utilization';
    severity: 'low' | 'medium' | 'high';
    message: string;
    affectedArea: Function | 'general';
  }[];
  weeklyHighlights: string[];
  // McKinsey-grade enhancements
  executiveSummary?: any; // ExecutiveSummary from board-executive-summary.ts
  enhancedRisks?: any[]; // EnhancedRisk[] from risk-assessment.ts
  recommendations?: any[]; // Recommendation[] from recommendations-engine.ts
  previousPeriodData?: {
    completionRate?: number;
    totalTimeLogged?: number;
    totalTasks?: number;
  };
  // Elite Consulting Frameworks Analysis (McKinsey/BCG/Bain/Deloitte/Accenture/EY/PwC/KPMG)
  consultingAnalysis?: {
    // McKinsey 7S + BCG Growth-Share + Bain NPS + Oliver Wyman Risk + Roland Berger Transformation
    strategy?: any;
    // McKinsey Ops + BCG Lean + Deloitte Digital Ops + Accenture Intelligent Ops + Bain Supply Chain
    operations?: any;
    // EY Performance + Deloitte Risk + PwC Value Creation + Charles River Economics
    finance?: any;
    // McKinsey Human Capital + Deloitte HR + Mercer Total Rewards + Korn Ferry Talent + Aon Risk
    talent?: any;
    // Accenture BPM + KPMG Excellence + PwC Risk + Deloitte Analytics
    process?: any;
    // BCG Manufacturing + Deloitte Industry 4.0 + McKinsey Digital + KPMG Operational Excellence
    manufacturing?: any;
    // Integrated Analysis
    integratedScore?: number;
    consultingInsights?: {
      source: string; // Which firm's framework
      category: string;
      insight: string;
      recommendation: string;
      impact: string;
    }[];
  };
}

// Executive Report - Function-specific performance
export interface ExecutiveReportData {
  executiveId: string;
  executiveName: string;
  function: Function;
  summary: {
    tasksCreated: number;
    tasksCompleted: number;
    workflowItemsAllocated: number;
    workflowItemsStructured: number;
    apprenticeWorkVerified: number;
    hoursLogged: number;
  };
  apprenticePerformance: {
    apprenticeId: string;
    apprenticeName: string;
    tasksAssigned: number;
    tasksCompleted: number;
    hoursLogged: number;
    pendingVerifications: number;
    averageCompletionTime: number;
  }[];
  workflowProgress: {
    workflowItemId: string;
    title: string;
    status: WorkflowItemStatus;
    sequenceOrder: number;
    completedAt?: string;
  }[];
  tasksBreakdown: {
    byStatus: Record<TaskStatus, number>;
    byPriority: Record<TaskPriority, number>;
    overdueTasks: number;
  };
  functionOKRs: {
    objectiveId: string;
    objectiveTitle: string;
    progress: number;
    keyResults: {
      title: string;
      current: number;
      target: number;
      unit: string;
    }[];
  }[];
}

// Apprentice Report - Individual work summary
export interface ApprenticeReportData {
  apprenticeId: string;
  apprenticeName: string;
  function: Function;
  summary: {
    tasksAssigned: number;
    tasksCompleted: number;
    tasksInProgress: number;
    totalHoursLogged: number;
    verificationsPending: number;
    verificationsApproved: number;
    averageTaskDuration: number;
  };
  taskDetails: {
    taskId: string;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
    hoursLogged: number;
    createdAt: string;
    completedAt?: string;
    verifiedAt?: string;
  }[];
  timeBreakdown: {
    byDate: { date: string; hours: number; }[];
    byTask: { taskTitle: string; hours: number; }[];
    totalHours: number;
  };
  workflowContributions: {
    workflowItemId: string;
    title: string;
    status: WorkflowItemStatus;
    hoursSpent: number;
  }[];
  achievements: string[];
}

// ==================== ARMORY SYSTEM ====================
// RPG-style equipment system for AI tools

export type EquipmentSlot = 'weapon' | 'armor' | 'utility' | 'support';
export type GearRarity = 'common' | 'rare' | 'epic';
export type EffectTag = '+Speed' | '+Quality' | '+Automation' | '+Revenue' | '+RiskControl' | '+Analysis' | '+Creative';

export interface PersonLoadout {
  workspaceId: string;
  memberId: string; // OrganizationMember id
  aiToolIds: string[]; // Array of AI Agent ids (unlimited)
  updatedAt: string;
}

export interface Squad {
  id: string;
  workspaceId: string;
  name: string;
  function: Function;
  leaderMemberId: string; // Executive id
  apprenticeMemberIds: string[];
  deployedOKRId?: string;
  deployedWorkPlanId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIToolEffects {
  aiToolId: string;
  suggestedSlot: EquipmentSlot;
  effectTags: EffectTag[];
  rarity: GearRarity;
  category: 'sales' | 'marketing' | 'engineering' | 'operations' | 'finance' | 'productivity' | 'design';
}
