// API service layer - Part 2: Tasks, Projects, Reviews, etc.

import { v4 as uuidv4 } from 'uuid';
import { db } from '../storage';
import type {
  Project,
  Task,
  TaskComment,
  Review,
  WeeklyPack,
  Template,
  MetricEvent,
  TimeEntry,
  Role,
  Function,
  TaskStatus,
  TaskPriority,
  ProjectStatus,
  ReviewStatus,
} from '@/types';
import { checkPermission, objectiveApi } from './index';

async function logAudit(params: any): Promise<void> {
  try {
    const logs = await db.getAuditLogs();
    const auditLog = {
      id: uuidv4(),
      ...params,
      timestamp: new Date().toISOString(),
    };
    logs[auditLog.id] = auditLog;
    await db.setAuditLogs(logs);
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
}

// ============================================================================
// PROJECT API
// ============================================================================

export const projectApi = {
  async getByWorkspace(workspaceId: string): Promise<Project[]> {
    const projects = await db.getProjects();
    return Object.values(projects).filter((p: any) => p.workspaceId === workspaceId);
  },

  async getById(projectId: string): Promise<Project | null> {
    const projects = await db.getProjects();
    return projects[projectId] || null;
  },

  async create(
    data: {
      workspaceId: string;
      objectiveId?: string;
      title: string;
      description?: string;
      ownerId: string;
      startDate?: string;
      dueDate?: string;
    },
    actorId: string,
    actorRole: Role
  ): Promise<Project> {
    if (!checkPermission(actorRole, 'create', 'project')) {
      throw new Error('Permission denied');
    }

    const projects = await db.getProjects();
    const project: Project = {
      id: uuidv4(),
      workspaceId: data.workspaceId,
      objectiveId: data.objectiveId,
      title: data.title,
      description: data.description,
      ownerId: data.ownerId,
      status: 'planning',
      startDate: data.startDate,
      dueDate: data.dueDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    projects[project.id] = project;
    await db.setProjects(projects);

    await logAudit({
      workspaceId: data.workspaceId,
      actorId,
      action: 'project.created',
      objectType: 'project',
      objectId: project.id,
      payloadSummary: `Created project: ${project.title}`,
    });

    return project;
  },

  async update(
    projectId: string,
    data: Partial<Project>,
    actorId: string,
    actorRole: Role
  ): Promise<Project | null> {
    if (!checkPermission(actorRole, 'update', 'project')) {
      throw new Error('Permission denied');
    }

    const projects = await db.getProjects();
    const project = projects[projectId];
    if (!project) return null;

    const updated = {
      ...project,
      ...data,
      id: projectId,
      updatedAt: new Date().toISOString(),
    };
    projects[projectId] = updated;
    await db.setProjects(projects);

    await logAudit({
      workspaceId: project.workspaceId,
      actorId,
      action: 'project.updated',
      objectType: 'project',
      objectId: projectId,
      payloadSummary: `Updated project: ${project.title}`,
    });

    return updated;
  },
};

// ============================================================================
// TASK API
// ============================================================================

export const taskApi = {
  async getByWorkspace(workspaceId: string): Promise<Task[]> {
    const tasks = await db.getTasks();
    return Object.values(tasks).filter((t: any) => t.workspaceId === workspaceId);
  },

  async getById(taskId: string): Promise<Task | null> {
    const tasks = await db.getTasks();
    return tasks[taskId] || null;
  },

  async getByAssignee(workspaceId: string, assigneeId: string): Promise<Task[]> {
    const tasks = await db.getTasks();
    return Object.values(tasks).filter(
      (t: any) => t.workspaceId === workspaceId && t.assigneeId === assigneeId
    );
  },

  async getByStatus(workspaceId: string, status: TaskStatus): Promise<Task[]> {
    const tasks = await db.getTasks();
    return Object.values(tasks).filter(
      (t: any) => t.workspaceId === workspaceId && t.status === status
    );
  },

  async create(
    data: {
      workspaceId: string;
      projectId?: string;
      objectiveId?: string;
      title: string;
      description?: string;
      assigneeId?: string;
      status?: TaskStatus;
      priority: TaskPriority;
      function: Function;
      dueDate?: string;
    },
    actorId: string,
    actorRole: Role
  ): Promise<Task> {
    if (!checkPermission(actorRole, 'create', 'task')) {
      throw new Error('Permission denied');
    }

    const tasks = await db.getTasks();
    const task: Task = {
      id: uuidv4(),
      workspaceId: data.workspaceId,
      projectId: data.projectId,
      objectiveId: data.objectiveId,
      title: data.title,
      description: data.description,
      assigneeId: data.assigneeId,
      status: data.status || 'todo',
      priority: data.priority,
      function: data.function,
      dueDate: data.dueDate,
      createdBy: actorId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    tasks[task.id] = task;
    await db.setTasks(tasks);

    await logAudit({
      workspaceId: data.workspaceId,
      actorId,
      action: 'task.created',
      objectType: 'task',
      objectId: task.id,
      payloadSummary: `Created task: ${task.title}`,
    });

    return task;
  },

  async update(
    taskId: string,
    data: Partial<Task>,
    actorId: string,
    actorRole: Role,
    currentUserId: string
  ): Promise<Task | null> {
    const tasks = await db.getTasks();
    const task = tasks[taskId];
    if (!task) return null;

    // Check permissions
    const isOwn = task.createdBy === currentUserId || task.assigneeId === currentUserId;
    const canUpdate = checkPermission(actorRole, 'update', 'task');
    const canUpdateOwn = checkPermission(actorRole, 'update_own', 'task');

    if (!canUpdate && !(canUpdateOwn && isOwn)) {
      throw new Error('Permission denied');
    }

    const updated = {
      ...task,
      ...data,
      id: taskId,
      updatedAt: new Date().toISOString(),
      completedAt: data.status === 'done' ? new Date().toISOString() : task.completedAt,
    };
    tasks[taskId] = updated;
    await db.setTasks(tasks);

    await logAudit({
      workspaceId: task.workspaceId,
      actorId,
      action: 'task.updated',
      objectType: 'task',
      objectId: taskId,
      payloadSummary: `Updated task: ${task.title} to ${data.status || task.status}`,
    });

    // Auto-calculate OKR progress if task is linked to an objective
    if (updated.linkedObjectiveId) {
      await updateOKRProgressFromTasks(updated.linkedObjectiveId);
    }

    return updated;
  },

  async delete(taskId: string, actorId: string, actorRole: Role): Promise<void> {
    if (!checkPermission(actorRole, 'delete', 'task')) {
      throw new Error('Permission denied');
    }

    const tasks = await db.getTasks();
    const task = tasks[taskId];
    if (!task) return;

    const linkedObjectiveId = task.linkedObjectiveId; // Save before deletion

    delete tasks[taskId];
    await db.setTasks(tasks);

    await logAudit({
      workspaceId: task.workspaceId,
      actorId,
      action: 'task.deleted',
      objectType: 'task',
      objectId: taskId,
      payloadSummary: `Deleted task: ${task.title}`,
    });

    // Recalculate OKR progress if task was linked
    if (linkedObjectiveId) {
      await updateOKRProgressFromTasks(linkedObjectiveId);
    }
  },
};

// ============================================================================
// TASK COMMENT API
// ============================================================================

export const taskCommentApi = {
  async getByTask(taskId: string): Promise<TaskComment[]> {
    const comments = await db.getTaskComments();
    return Object.values(comments)
      .filter((c: any) => c.taskId === taskId)
      .sort((a: any, b: any) => a.createdAt.localeCompare(b.createdAt));
  },

  async create(
    data: {
      taskId: string;
      content: string;
    },
    actorId: string,
    actorRole: Role
  ): Promise<TaskComment> {
    if (!checkPermission(actorRole, 'create', 'comment')) {
      throw new Error('Permission denied');
    }

    const comments = await db.getTaskComments();
    const comment: TaskComment = {
      id: uuidv4(),
      taskId: data.taskId,
      authorId: actorId,
      content: data.content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    comments[comment.id] = comment;
    await db.setTaskComments(comments);

    const task = await taskApi.getById(data.taskId);
    if (task) {
      await logAudit({
        workspaceId: task.workspaceId,
        actorId,
        action: 'comment.created',
        objectType: 'comment',
        objectId: comment.id,
        payloadSummary: `Commented on task: ${task.title}`,
      });
    }

    return comment;
  },
};

// ============================================================================
// REVIEW API
// ============================================================================

export const reviewApi = {
  async getByWorkspace(workspaceId: string): Promise<Review[]> {
    const reviews = await db.getReviews();
    const tasks = await db.getTasks();
    return Object.values(reviews).filter(
      (r: any) => tasks[r.taskId]?.workspaceId === workspaceId
    );
  },

  async getByTask(taskId: string): Promise<Review | null> {
    const reviews = await db.getReviews();
    return Object.values(reviews).find((r: any) => r.taskId === taskId) || null;
  },

  async getPendingReviews(workspaceId: string): Promise<Review[]> {
    const reviews = await this.getByWorkspace(workspaceId);
    return reviews.filter((r: any) => r.status === 'pending');
  },

  async requestReview(taskId: string, actorId: string, actorRole: Role): Promise<Review> {
    if (!checkPermission(actorRole, 'request_review', 'task')) {
      throw new Error('Permission denied');
    }

    const task = await taskApi.getById(taskId);
    if (!task) throw new Error('Task not found');

    // Update task status
    await taskApi.update(taskId, { status: 'in_review' }, actorId, actorRole, actorId);

    const reviews = await db.getReviews();
    const review: Review = {
      id: uuidv4(),
      taskId,
      reviewerId: '', // Will be assigned by FractionalExec
      status: 'pending',
      requestedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    reviews[review.id] = review;
    await db.setReviews(reviews);

    await logAudit({
      workspaceId: task.workspaceId,
      actorId,
      action: 'review.requested',
      objectType: 'review',
      objectId: review.id,
      payloadSummary: `Requested review for task: ${task.title}`,
    });

    return review;
  },

  async submitReview(
    reviewId: string,
    data: {
      status: ReviewStatus;
      notes?: string;
    },
    actorId: string,
    actorRole: Role
  ): Promise<Review | null> {
    if (!checkPermission(actorRole, 'approve', 'review')) {
      throw new Error('Permission denied');
    }

    const reviews = await db.getReviews();
    const review = reviews[reviewId];
    if (!review) return null;

    const updated = {
      ...review,
      reviewerId: actorId,
      status: data.status,
      notes: data.notes,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    reviews[reviewId] = updated;
    await db.setReviews(reviews);

    // Update task status based on review
    const task = await taskApi.getById(review.taskId);
    if (task) {
      const newStatus: TaskStatus = data.status === 'approved' ? 'done' : 'in_progress';
      await taskApi.update(review.taskId, { status: newStatus }, actorId, actorRole, actorId);

      await logAudit({
        workspaceId: task.workspaceId,
        actorId,
        action: `review.${data.status}`,
        objectType: 'review',
        objectId: reviewId,
        payloadSummary: `${data.status === 'approved' ? 'Approved' : 'Requested changes for'} task: ${task.title}`,
      });
    }

    return updated;
  },
};

// ============================================================================
// WEEKLY PACK API
// ============================================================================

export const weeklyPackApi = {
  async getByWorkspace(workspaceId: string): Promise<WeeklyPack[]> {
    const packs = await db.getWeeklyPacks();
    return Object.values(packs)
      .filter((p: any) => p.workspaceId === workspaceId)
      .sort((a: any, b: any) => b.generatedAt.localeCompare(a.generatedAt));
  },

  async getById(packId: string): Promise<WeeklyPack | null> {
    const packs = await db.getWeeklyPacks();
    return packs[packId] || null;
  },

  async generate(workspaceId: string, actorId: string, actorRole: Role): Promise<WeeklyPack> {
    if (!checkPermission(actorRole, 'generate', 'weeklyPack')) {
      throw new Error('Permission denied');
    }

    // Generate pack content (will implement detailed logic later)
    const htmlContent = await this.generatePackHTML(workspaceId);
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay())).toISOString();
    const weekEnd = new Date(now.setDate(now.getDate() + 6)).toISOString();

    const packs = await db.getWeeklyPacks();
    const pack: WeeklyPack = {
      id: uuidv4(),
      workspaceId,
      title: `Weekly Pack - Week of ${new Date(weekStart).toLocaleDateString()}`,
      htmlContent,
      weekStart,
      weekEnd,
      generatedBy: actorId,
      generatedAt: new Date().toISOString(),
    };
    packs[pack.id] = pack;
    await db.setWeeklyPacks(packs);

    await logAudit({
      workspaceId,
      actorId,
      action: 'weeklyPack.generated',
      objectType: 'weeklyPack',
      objectId: pack.id,
      payloadSummary: `Generated weekly pack`,
    });

    return pack;
  },

  async generatePackHTML(workspaceId: string): Promise<string> {
    // Simplified HTML generation - will enhance later
    const objectives = await objectiveApi.getByWorkspace(workspaceId);
    const tasks = await taskApi.getByWorkspace(workspaceId);
    const completedThisWeek = tasks.filter((t: any) => {
      if (!t.completedAt) return false;
      const completed = new Date(t.completedAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return completed >= weekAgo;
    });

    return `
      <html>
        <head><title>Weekly Pack</title></head>
        <body>
          <h1>Weekly Pack</h1>
          <h2>Objectives Status</h2>
          <p>${objectives.length} active objectives</p>
          <h2>This Week</h2>
          <p>${completedThisWeek.length} tasks completed</p>
          <p>${tasks.filter((t: any) => t.status === 'in_progress').length} tasks in progress</p>
        </body>
      </html>
    `;
  },
};

// ============================================================================
// TEMPLATE API
// ============================================================================

export const templateApi = {
  async getByWorkspace(workspaceId: string): Promise<Template[]> {
    const templates = await db.getTemplates();
    return Object.values(templates).filter(
      (t: any) => t.isSystem || t.workspaceId === workspaceId
    );
  },

  async getByFunction(workspaceId: string, func: Function): Promise<Template[]> {
    const templates = await this.getByWorkspace(workspaceId);
    return templates.filter((t: any) => t.function === func);
  },

  async getById(templateId: string): Promise<Template | null> {
    const templates = await db.getTemplates();
    return templates[templateId] || null;
  },

  async create(
    data: {
      workspaceId?: string;
      title: string;
      description?: string;
      function: Function;
      taskTemplate: any;
      isSystem?: boolean;
    },
    actorId: string
  ): Promise<Template> {
    const templates = await db.getTemplates();
    const template: Template = {
      id: uuidv4(),
      workspaceId: data.workspaceId,
      title: data.title,
      description: data.description,
      function: data.function,
      taskTemplate: data.taskTemplate,
      createdBy: actorId,
      isSystem: data.isSystem || false,
      createdAt: new Date().toISOString(),
    };
    templates[template.id] = template;
    await db.setTemplates(templates);

    if (data.workspaceId) {
      await logAudit({
        workspaceId: data.workspaceId,
        actorId,
        action: 'template.created',
        objectType: 'template',
        objectId: template.id,
        payloadSummary: `Created template: ${template.title}`,
      });
    }

    return template;
  },
};

// ============================================================================
// METRIC EVENT API
// ============================================================================

export const metricEventApi = {
  async getByKeyResult(keyResultId: string): Promise<MetricEvent[]> {
    const events = await db.getMetricEvents();
    return Object.values(events)
      .filter((e: any) => e.keyResultId === keyResultId)
      .sort((a: any, b: any) => b.recordedAt.localeCompare(a.recordedAt));
  },

  async create(
    data: {
      keyResultId: string;
      value: number;
      note?: string;
    },
    actorId: string
  ): Promise<MetricEvent> {
    const events = await db.getMetricEvents();
    const event: MetricEvent = {
      id: uuidv4(),
      keyResultId: data.keyResultId,
      value: data.value,
      note: data.note,
      recordedBy: actorId,
      recordedAt: new Date().toISOString(),
    };
    events[event.id] = event;
    await db.setMetricEvents(events);

    return event;
  },
};

// ============================================================================
// TIME ENTRY API
// ============================================================================

export const timeEntryApi = {
  async getByTask(taskId: string): Promise<TimeEntry[]> {
    const entries = await db.getTimeEntries();
    return Object.values(entries)
      .filter((e: any) => e.taskId === taskId)
      .sort((a: any, b: any) => b.date.localeCompare(a.date));
  },

  async getByUser(userId: string, workspaceId: string): Promise<TimeEntry[]> {
    const entries = await db.getTimeEntries();
    return Object.values(entries)
      .filter((e: any) => e.userId === userId && e.workspaceId === workspaceId)
      .sort((a: any, b: any) => b.date.localeCompare(a.date));
  },

  async getByWorkspace(workspaceId: string, startDate?: string, endDate?: string): Promise<TimeEntry[]> {
    const entries = await db.getTimeEntries();
    let filtered = Object.values(entries).filter((e: any) => e.workspaceId === workspaceId);

    if (startDate) {
      filtered = filtered.filter((e: any) => e.date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter((e: any) => e.date <= endDate);
    }

    return filtered.sort((a: any, b: any) => b.date.localeCompare(a.date));
  },

  async create(
    data: {
      taskId: string;
      workspaceId: string;
      hours: number;
      date: string;
      note?: string;
    },
    userId: string,
    role: Role
  ): Promise<TimeEntry> {
    // Check permissions
    if (!checkPermission(role, 'create', 'timeEntry')) {
      throw new Error('Permission denied: Cannot create time entry');
    }

    const entries = await db.getTimeEntries();
    const entry: TimeEntry = {
      id: uuidv4(),
      taskId: data.taskId,
      userId,
      workspaceId: data.workspaceId,
      hours: data.hours,
      date: data.date,
      note: data.note,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    entries[entry.id] = entry;
    await db.setTimeEntries(entries);

    await logAudit({
      workspaceId: data.workspaceId,
      actorId: userId,
      action: 'timeEntry.created',
      objectType: 'timeEntry',
      objectId: entry.id,
      payloadSummary: `Logged ${data.hours} hours`,
    });

    return entry;
  },

  async update(
    entryId: string,
    data: Partial<Pick<TimeEntry, 'hours' | 'date' | 'note'>>,
    userId: string,
    role: Role
  ): Promise<TimeEntry> {
    const entries = await db.getTimeEntries();
    const entry = entries[entryId];

    if (!entry) {
      throw new Error('Time entry not found');
    }

    // Only the creator or Founder can update
    if (entry.userId !== userId && role !== 'Founder') {
      throw new Error('Permission denied: Can only update your own time entries');
    }

    const updated = {
      ...entry,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    entries[entryId] = updated;
    await db.setTimeEntries(entries);

    await logAudit({
      workspaceId: entry.workspaceId,
      actorId: userId,
      action: 'timeEntry.updated',
      objectType: 'timeEntry',
      objectId: entryId,
      payloadSummary: `Updated time entry`,
    });

    return updated;
  },

  async delete(entryId: string, userId: string, role: Role): Promise<void> {
    const entries = await db.getTimeEntries();
    const entry = entries[entryId];

    if (!entry) {
      throw new Error('Time entry not found');
    }

    // Only the creator or Founder can delete
    if (entry.userId !== userId && role !== 'Founder') {
      throw new Error('Permission denied: Can only delete your own time entries');
    }

    delete entries[entryId];
    await db.setTimeEntries(entries);

    await logAudit({
      workspaceId: entry.workspaceId,
      actorId: userId,
      action: 'timeEntry.deleted',
      objectType: 'timeEntry',
      objectId: entryId,
      payloadSummary: `Deleted time entry`,
    });
  },
};

// ============================================================================
// OKR PROGRESS AUTO-CALCULATION
// ============================================================================

/**
 * Calculate OKR progress based on linked tasks
 * Returns progress percentage (0-100) based on completed vs total tasks
 */
export async function calculateOKRProgress(objectiveId: string): Promise<number> {
  const tasks = await db.getTasks();
  const linkedTasks = Object.values(tasks).filter(
    (t: any) => t.linkedObjectiveId === objectiveId
  );

  if (linkedTasks.length === 0) {
    return 0; // No tasks linked, 0% progress
  }

  const completedTasks = linkedTasks.filter((t: any) => t.status === 'done');
  const progress = (completedTasks.length / linkedTasks.length) * 100;

  return Math.round(progress);
}

/**
 * Update all key results for an objective with auto-calculated progress
 * Call this whenever a task is completed or status changes
 */
export async function updateOKRProgressFromTasks(objectiveId: string): Promise<void> {
  try {
    const progress = await calculateOKRProgress(objectiveId);
    
    // Update the objective's implicit progress
    // This can be used to show overall objective health
    const objectives = await db.getObjectives();
    if (objectives[objectiveId]) {
      objectives[objectiveId].calculatedProgress = progress;
      objectives[objectiveId].updatedAt = new Date().toISOString();
      await db.setObjectives(objectives);
    }
  } catch (error) {
    console.error('Failed to update OKR progress:', error);
  }
}
