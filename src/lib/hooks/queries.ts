// React Query hooks for Centaur OS

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  userApi,
  workspaceApi,
  membershipApi,
  objectiveApi,
  keyResultApi,
} from '../api/index';
import {
  projectApi,
  taskApi,
  reviewApi,
  weeklyPackApi,
  templateApi,
  taskCommentApi,
  metricEventApi,
} from '../api/operations';
import { db } from '../storage';
import type {
  Workspace,
  Membership,
  Objective,
  KeyResult,
  Project,
  Task,
  Review,
  WeeklyPack,
  Template,
  TaskComment,
  MetricEvent,
  User,
} from '@/types';
import { useAppStore } from '../state/app-store';

// ============================================================================
// WORKSPACE HOOKS
// ============================================================================

export function useWorkspaces(userId: string) {
  return useQuery({
    queryKey: ['workspaces', userId],
    queryFn: () => workspaceApi.getByUserId(userId),
    enabled: !!userId,
  });
}

export function useWorkspace(workspaceId: string | null) {
  return useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => (workspaceId ? workspaceApi.getById(workspaceId) : null),
    enabled: !!workspaceId,
  });
}

// ============================================================================
// MEMBERSHIP HOOKS
// ============================================================================

export function useWorkspaceMembers(workspaceId: string | null) {
  return useQuery({
    queryKey: ['memberships', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const memberships = await membershipApi.getByWorkspace(workspaceId);
      const users = await db.getUsers();
      return memberships.map((m) => ({
        ...m,
        user: users[m.userId],
      }));
    },
    enabled: !!workspaceId,
  });
}

export function useCurrentMembership(workspaceId: string | null, userId: string | null) {
  return useQuery({
    queryKey: ['membership', workspaceId, userId],
    queryFn: () =>
      workspaceId && userId ? membershipApi.getByUser(workspaceId, userId) : null,
    enabled: !!workspaceId && !!userId,
  });
}

// ============================================================================
// OBJECTIVE & KEY RESULT HOOKS
// ============================================================================

export function useObjectives(workspaceId: string | null) {
  return useQuery({
    queryKey: ['objectives', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const objectives = await objectiveApi.getByWorkspace(workspaceId);
      const users = await db.getUsers();
      const keyResults = await db.getKeyResults();
      const projects = await db.getProjects();

      return objectives.map((obj) => ({
        ...obj,
        owner: users[obj.ownerId],
        keyResults: Object.values(keyResults).filter((kr: any) => kr.objectiveId === obj.id),
        projects: Object.values(projects).filter((p: any) => p.objectiveId === obj.id),
      }));
    },
    enabled: !!workspaceId,
  });
}

export function useKeyResults(objectiveId: string | null) {
  return useQuery({
    queryKey: ['keyResults', objectiveId],
    queryFn: () => (objectiveId ? keyResultApi.getByObjective(objectiveId) : []),
    enabled: !!objectiveId,
  });
}

export function useMetricEvents(keyResultId: string | null) {
  return useQuery({
    queryKey: ['metricEvents', keyResultId],
    queryFn: () => (keyResultId ? metricEventApi.getByKeyResult(keyResultId) : []),
    enabled: !!keyResultId,
  });
}

// ============================================================================
// PROJECT HOOKS
// ============================================================================

export function useProjects(workspaceId: string | null) {
  return useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const projects = await projectApi.getByWorkspace(workspaceId);
      const users = await db.getUsers();
      const objectives = await db.getObjectives();

      return projects.map((proj) => ({
        ...proj,
        owner: users[proj.ownerId],
        objective: proj.objectiveId ? objectives[proj.objectiveId] : undefined,
      }));
    },
    enabled: !!workspaceId,
  });
}

// ============================================================================
// TASK HOOKS
// ============================================================================

export function useTasks(workspaceId: string | null) {
  return useQuery({
    queryKey: ['tasks', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const tasks = await taskApi.getByWorkspace(workspaceId);
      const users = await db.getUsers();
      const projects = await db.getProjects();
      const reviews = await db.getReviews();

      return tasks.map((task) => ({
        ...task,
        assignee: task.assigneeId ? users[task.assigneeId] : undefined,
        project: task.projectId ? projects[task.projectId] : undefined,
        review: Object.values(reviews).find((r: any) => r.taskId === task.id),
      }));
    },
    enabled: !!workspaceId,
  });
}

export function useTaskComments(taskId: string | null) {
  return useQuery({
    queryKey: ['taskComments', taskId],
    queryFn: async () => {
      if (!taskId) return [];
      const comments = await taskCommentApi.getByTask(taskId);
      const users = await db.getUsers();
      return comments.map((comment) => ({
        ...comment,
        author: users[comment.authorId],
      }));
    },
    enabled: !!taskId,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const currentUser = useAppStore((s) => s.currentUser);
  const currentMembership = useAppStore((s) => s.currentMembership);

  return useMutation({
    mutationFn: async (data: {
      workspaceId: string;
      projectId?: string;
      title: string;
      description?: string;
      assigneeId?: string;
      priority: any;
      function: any;
      dueDate?: string;
    }) => {
      if (!currentUser || !currentMembership) throw new Error('Not authenticated');
      return await taskApi.create(data, currentUser.id, currentMembership.role);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.workspaceId] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  const currentUser = useAppStore((s) => s.currentUser);
  const currentMembership = useAppStore((s) => s.currentMembership);

  return useMutation({
    mutationFn: async (data: { taskId: string; workspaceId: string; updates: any }) => {
      if (!currentUser || !currentMembership) throw new Error('Not authenticated');
      return await taskApi.update(
        data.taskId,
        data.updates,
        currentUser.id,
        currentMembership.role,
        currentUser.id
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.workspaceId] });
    },
  });
}

// ============================================================================
// REVIEW HOOKS
// ============================================================================

export function useReviews(workspaceId: string | null) {
  return useQuery({
    queryKey: ['reviews', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const reviews = await reviewApi.getByWorkspace(workspaceId);
      const users = await db.getUsers();
      const tasks = await db.getTasks();

      return reviews.map((review) => ({
        ...review,
        reviewer: review.reviewerId ? users[review.reviewerId] : undefined,
        task: tasks[review.taskId],
      }));
    },
    enabled: !!workspaceId,
  });
}

export function usePendingReviews(workspaceId: string | null) {
  return useQuery({
    queryKey: ['reviews', 'pending', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const reviews = await reviewApi.getPendingReviews(workspaceId);
      const users = await db.getUsers();
      const tasks = await db.getTasks();

      return reviews.map((review) => ({
        ...review,
        task: tasks[review.taskId],
        requestedBy: tasks[review.taskId]?.createdBy
          ? users[tasks[review.taskId].createdBy]
          : undefined,
      }));
    },
    enabled: !!workspaceId,
  });
}

export function useRequestReview() {
  const queryClient = useQueryClient();
  const currentUser = useAppStore((s) => s.currentUser);
  const currentMembership = useAppStore((s) => s.currentMembership);

  return useMutation({
    mutationFn: async (data: { taskId: string; workspaceId: string }) => {
      if (!currentUser || !currentMembership) throw new Error('Not authenticated');
      return await reviewApi.requestReview(data.taskId, currentUser.id, currentMembership.role);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.workspaceId] });
    },
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();
  const currentUser = useAppStore((s) => s.currentUser);
  const currentMembership = useAppStore((s) => s.currentMembership);

  return useMutation({
    mutationFn: async (data: {
      reviewId: string;
      workspaceId: string;
      status: any;
      notes?: string;
    }) => {
      if (!currentUser || !currentMembership) throw new Error('Not authenticated');
      return await reviewApi.submitReview(
        data.reviewId,
        { status: data.status, notes: data.notes },
        currentUser.id,
        currentMembership.role
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.workspaceId] });
    },
  });
}

// ============================================================================
// WEEKLY PACK HOOKS
// ============================================================================

export function useWeeklyPacks(workspaceId: string | null) {
  return useQuery({
    queryKey: ['weeklyPacks', workspaceId],
    queryFn: () => (workspaceId ? weeklyPackApi.getByWorkspace(workspaceId) : []),
    enabled: !!workspaceId,
  });
}

export function useGenerateWeeklyPack() {
  const queryClient = useQueryClient();
  const currentUser = useAppStore((s) => s.currentUser);
  const currentMembership = useAppStore((s) => s.currentMembership);

  return useMutation({
    mutationFn: async (workspaceId: string) => {
      if (!currentUser || !currentMembership) throw new Error('Not authenticated');
      return await weeklyPackApi.generate(workspaceId, currentUser.id, currentMembership.role);
    },
    onSuccess: (_, workspaceId) => {
      queryClient.invalidateQueries({ queryKey: ['weeklyPacks', workspaceId] });
    },
  });
}

// ============================================================================
// TEMPLATE HOOKS
// ============================================================================

export function useTemplates(workspaceId: string | null) {
  return useQuery({
    queryKey: ['templates', workspaceId],
    queryFn: () => (workspaceId ? templateApi.getByWorkspace(workspaceId) : []),
    enabled: !!workspaceId,
  });
}

export function useTemplatesByFunction(workspaceId: string | null, func: any) {
  return useQuery({
    queryKey: ['templates', workspaceId, func],
    queryFn: () => (workspaceId && func ? templateApi.getByFunction(workspaceId, func) : []),
    enabled: !!workspaceId && !!func,
  });
}

// ============================================================================
// DASHBOARD STATS HOOKS
// ============================================================================

export function useDashboardStats(workspaceId: string | null) {
  const currentMembership = useAppStore((s) => s.currentMembership);
  const membershipId = currentMembership?.id;
  const role = currentMembership?.role;
  const userId = currentMembership?.userId;

  return useQuery({
    queryKey: ['dashboardStats', workspaceId, membershipId, role, userId],
    queryFn: async () => {
      if (!workspaceId || !role || !userId) return null;

      const tasks = await taskApi.getByWorkspace(workspaceId);
      const objectives = await objectiveApi.getByWorkspace(workspaceId);
      const keyResults = await db.getKeyResults();
      const reviews = await reviewApi.getPendingReviews(workspaceId);

      const todaysTasks = tasks.filter((t: any) => {
        if (role === 'Founder') return true; // Founders see all
        return t.assigneeId === userId;
      });

      const completedThisWeek = tasks.filter((t: any) => {
        if (!t.completedAt) return false;
        const completed = new Date(t.completedAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return completed >= weekAgo;
      });

      const krProgress = Object.values(keyResults).map((kr: any) => ({
        krId: kr.id,
        title: kr.title,
        progress: kr.targetValue > 0 ? kr.currentValue / kr.targetValue : 0,
        healthStatus: kr.healthStatus,
      }));

      return {
        role,
        kpiTiles: [
          { label: 'Active Objectives', value: objectives.length },
          { label: 'Completed This Week', value: completedThisWeek.length },
          { label: 'In Progress', value: tasks.filter((t: any) => t.status === 'in_progress').length },
          { label: 'Pending Reviews', value: reviews.length },
        ],
        krProgress,
        todaysTasks: todaysTasks.slice(0, 10),
        reviewQueue: reviews,
      };
    },
    enabled: !!workspaceId && !!membershipId,
  });
}
