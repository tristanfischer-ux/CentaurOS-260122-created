// API service layer for Centaur OS
// Simulates backend CRUD operations with AsyncStorage
// Includes RBAC enforcement and audit logging

import { v4 as uuidv4 } from 'uuid';
import { db } from '../storage';
import type {
  User,
  Workspace,
  Membership,
  Objective,
  KeyResult,
  MetricEvent,
  Project,
  Task,
  TaskComment,
  Review,
  WeeklyPack,
  Template,
  AuditLog,
  Role,
  Function,
  TaskStatus,
  TaskPriority,
  ProjectStatus,
  ReviewStatus,
} from '@/types';

// RBAC helper
export function checkPermission(
  role: Role,
  action: string,
  resource: string
): boolean {
  const permissions: Record<Role, Record<string, string[]>> = {
    Founder: {
      // Founders can do everything
      '*': ['*'],
    },
    Apprentice: {
      task: ['read', 'create', 'update_own', 'request_review'],
      project: ['read'],
      objective: ['read'],
      comment: ['create', 'read'],
      template: ['read', 'use'],
    },
    FractionalExec: {
      task: ['read', 'update', 'approve'],
      project: ['read', 'update'],
      objective: ['read', 'update'],
      review: ['create', 'approve', 'reject'],
      weeklyPack: ['read', 'generate'],
      comment: ['create', 'read'],
    },
  };

  const rolePerms = permissions[role];
  if (rolePerms['*']?.includes('*')) return true; // Founder has all permissions

  const resourcePerms = rolePerms[resource];
  return resourcePerms?.includes(action) || resourcePerms?.includes('*') || false;
}

// Audit logging helper
async function logAudit(params: {
  workspaceId: string;
  actorId: string;
  action: string;
  objectType: string;
  objectId: string;
  payloadSummary?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    const logs = await db.getAuditLogs();
    const auditLog: AuditLog = {
      id: uuidv4(),
      workspaceId: params.workspaceId,
      actorId: params.actorId,
      action: params.action,
      objectType: params.objectType,
      objectId: params.objectId,
      payloadSummary: params.payloadSummary,
      timestamp: new Date().toISOString(),
      metadata: params.metadata,
    };
    logs[auditLog.id] = auditLog;
    await db.setAuditLogs(logs);
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
}

// ============================================================================
// USER API
// ============================================================================

export const userApi = {
  async getById(userId: string): Promise<User | null> {
    const users = await db.getUsers();
    return users[userId] || null;
  },

  async getByEmail(email: string): Promise<User | null> {
    const users = await db.getUsers();
    return Object.values(users).find((u: any) => u.email === email) || null;
  },

  async create(data: { email: string; name: string; avatarUrl?: string }): Promise<User> {
    const users = await db.getUsers();
    const user: User = {
      id: uuidv4(),
      email: data.email,
      name: data.name,
      avatarUrl: data.avatarUrl,
      createdAt: new Date().toISOString(),
    };
    users[user.id] = user;
    await db.setUsers(users);
    return user;
  },

  async update(userId: string, data: Partial<User>): Promise<User | null> {
    const users = await db.getUsers();
    const user = users[userId];
    if (!user) return null;

    const updated = { ...user, ...data, id: userId };
    users[userId] = updated;
    await db.setUsers(users);
    return updated;
  },
};

// ============================================================================
// WORKSPACE API
// ============================================================================

export const workspaceApi = {
  async getById(workspaceId: string): Promise<Workspace | null> {
    const workspaces = await db.getWorkspaces();
    return workspaces[workspaceId] || null;
  },

  async getByUserId(userId: string): Promise<Workspace[]> {
    const memberships = await db.getMemberships();
    const workspaces = await db.getWorkspaces();
    const userMemberships = Object.values(memberships).filter((m: any) => m.userId === userId);
    return userMemberships.map((m: any) => workspaces[m.workspaceId]).filter(Boolean);
  },

  async create(data: { name: string; ownerId: string }): Promise<Workspace> {
    const workspaces = await db.getWorkspaces();
    const workspace: Workspace = {
      id: uuidv4(),
      name: data.name,
      ownerId: data.ownerId,
      createdAt: new Date().toISOString(),
    };
    workspaces[workspace.id] = workspace;
    await db.setWorkspaces(workspaces);

    // Create owner membership
    await membershipApi.create({
      workspaceId: workspace.id,
      userId: data.ownerId,
      role: 'Founder',
      function: 'Admin',
    });

    return workspace;
  },

  async update(
    workspaceId: string,
    data: Partial<Workspace>,
    actorId: string
  ): Promise<Workspace | null> {
    const workspaces = await db.getWorkspaces();
    const workspace = workspaces[workspaceId];
    if (!workspace) return null;

    const updated = { ...workspace, ...data, id: workspaceId };
    workspaces[workspaceId] = updated;
    await db.setWorkspaces(workspaces);

    await logAudit({
      workspaceId,
      actorId,
      action: 'workspace.updated',
      objectType: 'workspace',
      objectId: workspaceId,
      payloadSummary: `Updated workspace: ${workspace.name}`,
    });

    return updated;
  },
};

// ============================================================================
// MEMBERSHIP API
// ============================================================================

export const membershipApi = {
  async getByWorkspace(workspaceId: string): Promise<Membership[]> {
    const memberships = await db.getMemberships();
    return Object.values(memberships).filter((m: any) => m.workspaceId === workspaceId);
  },

  async getByUser(workspaceId: string, userId: string): Promise<Membership | null> {
    const memberships = await db.getMemberships();
    return (
      Object.values(memberships).find(
        (m: any) => m.workspaceId === workspaceId && m.userId === userId
      ) || null
    );
  },

  async create(data: {
    workspaceId: string;
    userId: string;
    role: Role;
    function: Function;
    permissions?: Record<string, boolean>;
  }): Promise<Membership> {
    const memberships = await db.getMemberships();
    const membership: Membership = {
      id: uuidv4(),
      workspaceId: data.workspaceId,
      userId: data.userId,
      role: data.role,
      function: data.function,
      joinedAt: new Date().toISOString(),
      permissions: data.permissions,
    };
    memberships[membership.id] = membership;
    await db.setMemberships(memberships);
    return membership;
  },

  async update(
    membershipId: string,
    data: Partial<Membership>,
    actorId: string,
    actorRole: Role
  ): Promise<Membership | null> {
    if (!checkPermission(actorRole, 'update', 'membership')) {
      throw new Error('Permission denied');
    }

    const memberships = await db.getMemberships();
    const membership = memberships[membershipId];
    if (!membership) return null;

    const updated = { ...membership, ...data, id: membershipId };
    memberships[membershipId] = updated;
    await db.setMemberships(memberships);

    await logAudit({
      workspaceId: membership.workspaceId,
      actorId,
      action: 'membership.updated',
      objectType: 'membership',
      objectId: membershipId,
      payloadSummary: `Updated membership role to ${data.role}`,
    });

    return updated;
  },
};

// ============================================================================
// OBJECTIVE API
// ============================================================================

export const objectiveApi = {
  async getByWorkspace(workspaceId: string): Promise<Objective[]> {
    const objectives = await db.getObjectives();
    return Object.values(objectives).filter((o: any) => o.workspaceId === workspaceId);
  },

  async getById(objectiveId: string): Promise<Objective | null> {
    const objectives = await db.getObjectives();
    return objectives[objectiveId] || null;
  },

  async create(
    data: {
      workspaceId: string;
      title: string;
      description?: string;
      ownerId: string;
      startDate: string;
      endDate: string;
    },
    actorId: string,
    actorRole: Role
  ): Promise<Objective> {
    if (!checkPermission(actorRole, 'create', 'objective')) {
      throw new Error('Permission denied');
    }

    const objectives = await db.getObjectives();
    const objective: Objective = {
      id: uuidv4(),
      workspaceId: data.workspaceId,
      title: data.title,
      description: data.description,
      ownerId: data.ownerId,
      startDate: data.startDate,
      endDate: data.endDate,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    objectives[objective.id] = objective;
    await db.setObjectives(objectives);

    await logAudit({
      workspaceId: data.workspaceId,
      actorId,
      action: 'objective.created',
      objectType: 'objective',
      objectId: objective.id,
      payloadSummary: `Created objective: ${objective.title}`,
    });

    return objective;
  },

  async update(
    objectiveId: string,
    data: Partial<Objective>,
    actorId: string,
    actorRole: Role
  ): Promise<Objective | null> {
    if (!checkPermission(actorRole, 'update', 'objective')) {
      throw new Error('Permission denied');
    }

    const objectives = await db.getObjectives();
    const objective = objectives[objectiveId];
    if (!objective) return null;

    const updated = {
      ...objective,
      ...data,
      id: objectiveId,
      updatedAt: new Date().toISOString(),
    };
    objectives[objectiveId] = updated;
    await db.setObjectives(objectives);

    await logAudit({
      workspaceId: objective.workspaceId,
      actorId,
      action: 'objective.updated',
      objectType: 'objective',
      objectId: objectiveId,
      payloadSummary: `Updated objective: ${objective.title}`,
    });

    return updated;
  },

  async delete(objectiveId: string, actorId: string, actorRole: Role): Promise<void> {
    if (!checkPermission(actorRole, 'delete', 'objective')) {
      throw new Error('Permission denied');
    }

    const objectives = await db.getObjectives();
    const objective = objectives[objectiveId];
    if (!objective) return;

    delete objectives[objectiveId];
    await db.setObjectives(objectives);

    await logAudit({
      workspaceId: objective.workspaceId,
      actorId,
      action: 'objective.deleted',
      objectType: 'objective',
      objectId: objectiveId,
      payloadSummary: `Deleted objective: ${objective.title}`,
    });
  },
};

// ============================================================================
// KEY RESULT API
// ============================================================================

export const keyResultApi = {
  async getByObjective(objectiveId: string): Promise<KeyResult[]> {
    const keyResults = await db.getKeyResults();
    return Object.values(keyResults).filter((kr: any) => kr.objectiveId === objectiveId);
  },

  async getById(krId: string): Promise<KeyResult | null> {
    const keyResults = await db.getKeyResults();
    return keyResults[krId] || null;
  },

  async create(
    data: {
      objectiveId: string;
      title: string;
      description?: string;
      targetValue: number;
      currentValue: number;
      unit: string;
      ownerId: string;
    },
    actorId: string,
    actorRole: Role
  ): Promise<KeyResult> {
    if (!checkPermission(actorRole, 'create', 'objective')) {
      throw new Error('Permission denied');
    }

    const keyResults = await db.getKeyResults();
    const objective = await objectiveApi.getById(data.objectiveId);
    if (!objective) throw new Error('Objective not found');

    const progress = data.targetValue > 0 ? data.currentValue / data.targetValue : 0;
    const healthStatus: any =
      progress >= 0.7 ? 'on_track' : progress >= 0.4 ? 'at_risk' : 'off_track';

    const keyResult: KeyResult = {
      id: uuidv4(),
      objectiveId: data.objectiveId,
      title: data.title,
      description: data.description,
      targetValue: data.targetValue,
      currentValue: data.currentValue,
      unit: data.unit,
      ownerId: data.ownerId,
      healthStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    keyResults[keyResult.id] = keyResult;
    await db.setKeyResults(keyResults);

    await logAudit({
      workspaceId: objective.workspaceId,
      actorId,
      action: 'keyResult.created',
      objectType: 'keyResult',
      objectId: keyResult.id,
      payloadSummary: `Created KR: ${keyResult.title}`,
    });

    return keyResult;
  },

  async update(
    krId: string,
    data: Partial<KeyResult>,
    actorId: string,
    actorRole: Role
  ): Promise<KeyResult | null> {
    if (!checkPermission(actorRole, 'update', 'objective')) {
      throw new Error('Permission denied');
    }

    const keyResults = await db.getKeyResults();
    const kr = keyResults[krId];
    if (!kr) return null;

    const currentValue = data.currentValue ?? kr.currentValue;
    const targetValue = data.targetValue ?? kr.targetValue;
    const progress = targetValue > 0 ? currentValue / targetValue : 0;
    const healthStatus: any =
      progress >= 0.7 ? 'on_track' : progress >= 0.4 ? 'at_risk' : 'off_track';

    const updated = {
      ...kr,
      ...data,
      healthStatus,
      id: krId,
      updatedAt: new Date().toISOString(),
    };
    keyResults[krId] = updated;
    await db.setKeyResults(keyResults);

    const objective = await objectiveApi.getById(kr.objectiveId);
    if (objective) {
      await logAudit({
        workspaceId: objective.workspaceId,
        actorId,
        action: 'keyResult.updated',
        objectType: 'keyResult',
        objectId: krId,
        payloadSummary: `Updated KR: ${kr.title} to ${currentValue}${kr.unit}`,
      });
    }

    return updated;
  },
};

// Continue in next file...
