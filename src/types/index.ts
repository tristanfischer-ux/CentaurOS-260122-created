// Core domain types for Centaur OS

export type Role = 'Founder' | 'Apprentice' | 'FractionalExec';
export type Function = 'Finance' | 'Sales' | 'Marketing' | 'Ops' | 'Engineering' | 'Admin';
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ProjectStatus = 'planning' | 'active' | 'paused' | 'completed' | 'cancelled';
export type ReviewStatus = 'pending' | 'approved' | 'changes_requested';
export type KRHealthStatus = 'on_track' | 'at_risk' | 'off_track';
export type ThemeMode = 'light' | 'dark' | 'system';

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
}

// Workspace
export interface Workspace {
  id: string;
  name: string;
  createdAt: string;
  ownerId: string;
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
