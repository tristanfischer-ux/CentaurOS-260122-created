// Report generation engine with data aggregation
import { v4 as uuidv4 } from 'uuid';
import type {
  Report,
  ReportType,
  ReportPeriod,
  FounderReportData,
  ExecutiveReportData,
  ApprenticeReportData,
  Role,
  Task,
  TimeEntry,
  Objective,
  KeyResult,
  Project,
  WorkflowItem,
  Review,
  User,
  Membership,
} from '@/types';
import { generateExecutiveSummary, type ReportDataForSummary } from './board-executive-summary';
import { identifyRisks, type RiskAssessmentData } from './risk-assessment';
import { generateRecommendations, type RecommendationContext } from './recommendations-engine';
import { analyzeTrend } from './trend-analysis';

// Helper to get date range for report period
export function getDateRange(period: ReportPeriod, customStart?: string, customEnd?: string): { startDate: string; endDate: string } {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;

  if (period === 'custom' && customStart && customEnd) {
    return { startDate: customStart, endDate: customEnd };
  }

  switch (period) {
    case 'week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 3);
      break;
    default:
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
  }

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
}

// Filter data by date range
function filterByDateRange<T extends { createdAt: string }>(data: T[], startDate: string, endDate: string): T[] {
  return data.filter((item) => {
    const itemDate = new Date(item.createdAt);
    return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
  });
}

// Generate Founder Report - Board-ready business overview
export async function generateFounderReport(
  workspaceId: string,
  userId: string,
  period: ReportPeriod,
  customStart?: string,
  customEnd?: string,
  data?: {
    tasks: Task[];
    timeEntries: TimeEntry[];
    objectives: Objective[];
    keyResults: KeyResult[];
    projects: Project[];
    workflowItems: WorkflowItem[];
    reviews: Review[];
    users: Record<string, User>;
    memberships: Membership[];
  }
): Promise<Report> {
  const { startDate, endDate } = getDateRange(period, customStart, customEnd);

  if (!data) {
    throw new Error('Data required for report generation');
  }

  // Filter data by workspace and date range
  const workspaceTasks = data.tasks.filter((t) => t.workspaceId === workspaceId);
  const periodTasks = filterByDateRange(workspaceTasks, startDate, endDate);
  const workspaceTimeEntries = data.timeEntries.filter((te) => te.workspaceId === workspaceId);
  const periodTimeEntries = filterByDateRange(workspaceTimeEntries, startDate, endDate);
  const workspaceObjectives = data.objectives.filter((o) => o.workspaceId === workspaceId);
  const workspaceProjects = data.projects.filter((p) => p.workspaceId === workspaceId);
  const workspaceWorkflowItems = data.workflowItems.filter((w) => w.workspaceId === workspaceId);
  const workspaceMemberships = data.memberships.filter((m) => m.workspaceId === workspaceId);

  // Calculate overview metrics
  const completedTasks = periodTasks.filter((t) => t.status === 'done');
  const completionRate = periodTasks.length > 0 ? Math.round((completedTasks.length / periodTasks.length) * 100) : 0;
  const totalTimeLogged = periodTimeEntries.reduce((sum, te) => sum + te.hours, 0);
  const activeWorkflowItems = workspaceWorkflowItems.filter((w) =>
    ['allocated', 'structured', 'assigned', 'in_progress', 'submitted'].includes(w.status)
  ).length;
  const completedWorkflowItems = workspaceWorkflowItems.filter((w) => w.status === 'completed').length;
  const activeFunctions = Array.from(new Set(workspaceMemberships.map((m) => m.function)));

  // Calculate OKR progress
  const okrProgress = workspaceObjectives.map((obj) => {
    const objKRs = data.keyResults.filter((kr) => kr.objectiveId === obj.id);
    const progress = objKRs.length > 0
      ? Math.round(objKRs.reduce((sum, kr) => sum + (kr.currentValue / kr.targetValue) * 100, 0) / objKRs.length)
      : 0;

    const healthStatuses = objKRs.map((kr) => kr.healthStatus);
    const healthStatus: import('@/types').KRHealthStatus = healthStatuses.includes('off_track') ? 'off_track' :
                        healthStatuses.includes('at_risk') ? 'at_risk' : 'on_track';

    return {
      objectiveId: obj.id,
      objectiveTitle: obj.title,
      progress,
      healthStatus,
      keyResultsCount: objKRs.length,
      owner: data.users[obj.ownerId]?.name || 'Unknown',
    };
  });

  // Calculate executive performance
  const executives = workspaceMemberships.filter((m) => m.role === 'FractionalExec');
  const executivePerformance = executives.map((exec) => {
    const execTasks = periodTasks.filter((t) => t.createdBy === exec.userId);
    const execCompletedTasks = execTasks.filter((t) => t.status === 'done');
    const execWorkflowItems = workspaceWorkflowItems.filter((w) => w.structuredByExecId === exec.userId);
    const execVerifications = data.reviews.filter((r) => r.reviewerId === exec.userId && r.status === 'approved');
    const execTimeEntries = periodTimeEntries.filter((te) => te.userId === exec.userId);

    return {
      executiveId: exec.userId,
      executiveName: data.users[exec.userId]?.name || 'Unknown',
      function: exec.function,
      tasksCreated: execTasks.length,
      tasksCompleted: execCompletedTasks.length,
      workflowItemsStructured: execWorkflowItems.length,
      apprenticeWorkVerified: execVerifications.length,
      hoursLogged: execTimeEntries.reduce((sum, te) => sum + te.hours, 0),
    };
  });

  // Calculate apprentice utilization
  const apprentices = workspaceMemberships.filter((m) => m.role === 'Apprentice');
  const apprenticeUtilization = apprentices.map((apprentice) => {
    const apprenticeTasks = periodTasks.filter((t) => t.assigneeId === apprentice.userId);
    const apprenticeCompletedTasks = apprenticeTasks.filter((t) => t.status === 'done');
    const apprenticeTimeEntries = periodTimeEntries.filter((te) => te.userId === apprentice.userId);

    const completedTasksWithDuration = apprenticeCompletedTasks.filter((t) => t.completedAt);
    const avgCompletionDays = completedTasksWithDuration.length > 0
      ? Math.round(
          completedTasksWithDuration.reduce((sum, t) => {
            const created = new Date(t.createdAt);
            const completed = new Date(t.completedAt!);
            const days = (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
            return sum + days;
          }, 0) / completedTasksWithDuration.length
        )
      : 0;

    const hoursLogged = apprenticeTimeEntries.reduce((sum, te) => sum + te.hours, 0);

    // Calculate expected hours based on period
    const periodDays = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
    const expectedWorkDays = Math.min(periodDays, 30); // Cap at 30 days for reasonable utilization calculation
    const expectedHours = expectedWorkDays * 8; // 8 hours per work day
    const utilizationRate = expectedHours > 0 ? Math.min(Math.round((hoursLogged / expectedHours) * 100), 100) : 0;

    return {
      apprenticeId: apprentice.userId,
      apprenticeName: data.users[apprentice.userId]?.name || 'Unknown',
      function: apprentice.function,
      tasksAssigned: apprenticeTasks.length,
      tasksCompleted: apprenticeCompletedTasks.length,
      hoursLogged,
      averageTaskCompletionDays: avgCompletionDays,
      utilizationRate,
    };
  });

  // Calculate project status
  const projectStatus = workspaceProjects.map((proj) => {
    const projTasks = workspaceTasks.filter((t) => t.projectId === proj.id);
    const projCompletedTasks = projTasks.filter((t) => t.status === 'done');

    return {
      projectId: proj.id,
      projectTitle: proj.title,
      status: proj.status,
      tasksTotal: projTasks.length,
      tasksCompleted: projCompletedTasks.length,
      owner: data.users[proj.ownerId]?.name || 'Unknown',
    };
  });

  // Identify risks
  const risks: FounderReportData['risks'] = [];

  // OKRs off track
  okrProgress.filter((okr) => okr.healthStatus === 'off_track').forEach((okr) => {
    risks.push({
      type: 'kr_off_track',
      severity: 'high',
      message: `Objective "${okr.objectiveTitle}" is off track (${okr.progress}% complete)`,
      affectedArea: 'general',
    });
  });

  // Overdue tasks
  const overdueTasks = workspaceTasks.filter((t) => {
    if (!t.dueDate || t.status === 'done') return false;
    return new Date(t.dueDate) < new Date();
  });
  if (overdueTasks.length > 0) {
    risks.push({
      type: 'task_overdue',
      severity: overdueTasks.length > 5 ? 'high' : 'medium',
      message: `${overdueTasks.length} tasks are overdue`,
      affectedArea: 'general',
    });
  }

  // Low utilization
  apprenticeUtilization.filter((a) => a.utilizationRate < 50).forEach((a) => {
    risks.push({
      type: 'low_utilization',
      severity: 'medium',
      message: `${a.apprenticeName} has low utilization (${a.utilizationRate}%)`,
      affectedArea: a.function,
    });
  });

  // Generate weekly highlights
  const weeklyHighlights: string[] = [];
  const topCompletedTasks = completedTasks.slice(0, 5).map((t) => `✓ ${t.title}`);
  weeklyHighlights.push(...topCompletedTasks);
  if (completedWorkflowItems > 0) {
    weeklyHighlights.push(`✓ ${completedWorkflowItems} workflow items completed`);
  }

  // ============================================================================
  // McKINSEY-GRADE ENHANCEMENTS
  // ============================================================================

  // Calculate metrics for McKinsey modules
  const avgUtilization = apprenticeUtilization.length > 0
    ? Math.round(apprenticeUtilization.reduce((sum, a) => sum + a.utilizationRate, 0) / apprenticeUtilization.length)
    : 0;

  const overutilizedCount = apprenticeUtilization.filter((a) => a.utilizationRate > 90).length;
  const underutilizedCount = apprenticeUtilization.filter((a) => a.utilizationRate < 60).length;

  const avgOKRProgress = okrProgress.length > 0
    ? Math.round(okrProgress.reduce((sum, okr) => sum + okr.progress, 0) / okrProgress.length)
    : 0;

  const atRiskOKRs = okrProgress.filter((okr) => okr.healthStatus === 'at_risk' || okr.healthStatus === 'off_track').length;

  // Mock financial data (would come from actual finance module in production)
  const mockRevenue = 45; // £45k/month
  const mockBurn = 75; // £75k/month
  const mockCashBalance = 450; // £450k
  const mockRunway = mockCashBalance / mockBurn;

  // 1. Executive Summary (McKinsey Pyramid Principle)
  const executiveSummaryData: ReportDataForSummary = {
    revenue: mockRevenue,
    previousRevenue: null,
    burn: mockBurn,
    previousBurn: null,
    runway: mockRunway,
    previousRunway: null,
    okrProgress: avgOKRProgress,
    previousOKRProgress: null,
    completionRate,
    previousCompletionRate: null,
    tasksCompleted: completedTasks.length,
    previousTasksCompleted: null,
    teamSize: workspaceMemberships.length,
    utilization: avgUtilization,
    previousUtilization: null,
    overutilizedCount,
    underutilizedCount,
    atRiskOKRs,
    criticalTasks: periodTasks.filter((t) => t.priority === 'urgent' && t.status !== 'done').length,
    period: period === 'week' ? 'Last 7 Days' : period === 'month' ? 'Last 30 Days' : 'Last 90 Days',
  };

  const executiveSummary = generateExecutiveSummary(executiveSummaryData);

  // 2. Enhanced Risk Assessment
  const riskAssessmentData: RiskAssessmentData = {
    revenue: mockRevenue,
    burn: mockBurn,
    runway: mockRunway,
    previousRunway: undefined,
    burnToRevenue: mockBurn / mockRevenue,
    okrProgress: avgOKRProgress,
    atRiskOKRs,
    totalOKRs: okrProgress.length,
    completionRate,
    tasksCompleted: completedTasks.length,
    previousTasksCompleted: undefined,
    teamSize: workspaceMemberships.length,
    utilization: avgUtilization,
    overutilizedMembers: overutilizedCount,
    underutilizedMembers: underutilizedCount,
    executives: executives.length,
    apprentices: apprentices.length,
    monthlyRevenue: mockRevenue,
    monthlyBurn: mockBurn,
    cashBalance: mockCashBalance,
  };

  const enhancedRisks = identifyRisks(riskAssessmentData);

  // 3. Strategic Recommendations
  const recommendationContext: RecommendationContext = {
    revenue: mockRevenue,
    burn: mockBurn,
    runway: mockRunway,
    burnToRevenue: mockBurn / mockRevenue,
    cashBalance: mockCashBalance,
    okrProgress: avgOKRProgress,
    atRiskOKRs,
    totalOKRs: okrProgress.length,
    completionRate,
    tasksCompleted: completedTasks.length,
    velocity: completedTasks.length / 7, // tasks per week
    teamSize: workspaceMemberships.length,
    utilization: avgUtilization,
    overutilizedMembers: overutilizedCount,
    underutilizedMembers: underutilizedCount,
    executives: executives.length,
    apprentices: apprentices.length,
    previousRevenue: undefined,
    previousBurn: undefined,
    previousRunway: undefined,
    quarterProgress: 50, // Mid-quarter assumption
  };

  const recommendations = generateRecommendations(recommendationContext);

  const reportData: FounderReportData = {
    overview: {
      totalTasks: periodTasks.length,
      completedTasks: completedTasks.length,
      completionRate,
      totalTimeLogged,
      activeWorkflowItems,
      completedWorkflowItems,
      totalTeamMembers: workspaceMemberships.length,
      activeFunctions,
    },
    okrProgress,
    executivePerformance,
    apprenticeUtilization,
    projectStatus,
    risks,
    weeklyHighlights,
    // McKinsey-grade enhancements
    executiveSummary,
    enhancedRisks,
    recommendations,
  };

  return {
    id: uuidv4(),
    workspaceId,
    reportType: 'founder',
    period,
    startDate,
    endDate,
    generatedAt: new Date().toISOString(),
    generatedBy: userId,
    data: reportData,
  };
}

// Generate Executive Report - Function-specific performance
export async function generateExecutiveReport(
  workspaceId: string,
  userId: string,
  period: ReportPeriod,
  customStart?: string,
  customEnd?: string,
  data?: {
    tasks: Task[];
    timeEntries: TimeEntry[];
    objectives: Objective[];
    keyResults: KeyResult[];
    workflowItems: WorkflowItem[];
    reviews: Review[];
    users: Record<string, User>;
    memberships: Membership[];
  }
): Promise<Report> {
  const { startDate, endDate } = getDateRange(period, customStart, customEnd);

  if (!data) {
    throw new Error('Data required for report generation');
  }

  // Find executive's membership to get their function
  const execMembership = data.memberships.find((m) => m.userId === userId && m.workspaceId === workspaceId);
  if (!execMembership) {
    throw new Error('Executive membership not found');
  }

  const execFunction = execMembership.function;

  // Filter data by workspace and executive's function
  const workspaceTasks = data.tasks.filter((t) => t.workspaceId === workspaceId);
  const periodTasks = filterByDateRange(workspaceTasks, startDate, endDate);
  const execTasks = periodTasks.filter((t) => t.createdBy === userId || t.function === execFunction);
  const workspaceTimeEntries = data.timeEntries.filter((te) => te.workspaceId === workspaceId);
  const periodTimeEntries = filterByDateRange(workspaceTimeEntries, startDate, endDate);
  const workspaceWorkflowItems = data.workflowItems.filter((w) => w.workspaceId === workspaceId && w.function === execFunction);

  // Calculate summary
  const tasksCreated = execTasks.filter((t) => t.createdBy === userId).length;
  const tasksCompleted = execTasks.filter((t) => t.status === 'done').length;
  const workflowItemsAllocated = workspaceWorkflowItems.filter((w) => w.allocatedToExecId === userId).length;
  const workflowItemsStructured = workspaceWorkflowItems.filter((w) => w.structuredByExecId === userId).length;
  const execVerifications = data.reviews.filter((r) => r.reviewerId === userId && r.status === 'approved');
  const execTimeEntries = periodTimeEntries.filter((te) => te.userId === userId);

  // Find apprentices in this function
  const apprentices = data.memberships.filter((m) => m.workspaceId === workspaceId && m.role === 'Apprentice' && m.function === execFunction);

  // Calculate apprentice performance
  const apprenticePerformance = apprentices.map((apprentice) => {
    const apprenticeTasks = execTasks.filter((t) => t.assigneeId === apprentice.userId);
    const apprenticeCompletedTasks = apprenticeTasks.filter((t) => t.status === 'done');
    const apprenticeTimeEntries = periodTimeEntries.filter((te) => te.userId === apprentice.userId);
    const pendingVerifications = data.reviews.filter((r) => r.reviewerId === userId && r.status === 'pending').length;

    const completedTasksWithDuration = apprenticeCompletedTasks.filter((t) => t.completedAt);
    const avgCompletionTime = completedTasksWithDuration.length > 0
      ? Math.round(
          completedTasksWithDuration.reduce((sum, t) => {
            const created = new Date(t.createdAt);
            const completed = new Date(t.completedAt!);
            const days = (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
            return sum + days;
          }, 0) / completedTasksWithDuration.length
        )
      : 0;

    return {
      apprenticeId: apprentice.userId,
      apprenticeName: data.users[apprentice.userId]?.name || 'Unknown',
      tasksAssigned: apprenticeTasks.length,
      tasksCompleted: apprenticeCompletedTasks.length,
      hoursLogged: apprenticeTimeEntries.reduce((sum, te) => sum + te.hours, 0),
      pendingVerifications,
      averageCompletionTime: avgCompletionTime,
    };
  });

  // Workflow progress
  const workflowProgress = workspaceWorkflowItems.map((w) => ({
    workflowItemId: w.id,
    title: w.title,
    status: w.status,
    sequenceOrder: w.sequenceOrder,
    completedAt: w.completedAt,
  }));

  // Tasks breakdown
  const byStatus = execTasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byPriority = execTasks.reduce((acc, t) => {
    acc[t.priority] = (acc[t.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const overdueTasks = execTasks.filter((t) => {
    if (!t.dueDate || t.status === 'done') return false;
    return new Date(t.dueDate) < new Date();
  }).length;

  // Function OKRs
  const functionObjectives = data.objectives.filter((o) => o.workspaceId === workspaceId && o.ownerId === userId);
  const functionOKRs = functionObjectives.map((obj) => {
    const objKRs = data.keyResults.filter((kr) => kr.objectiveId === obj.id);
    const progress = objKRs.length > 0
      ? Math.round(objKRs.reduce((sum, kr) => sum + (kr.currentValue / kr.targetValue) * 100, 0) / objKRs.length)
      : 0;

    return {
      objectiveId: obj.id,
      objectiveTitle: obj.title,
      progress,
      keyResults: objKRs.map((kr) => ({
        title: kr.title,
        current: kr.currentValue,
        target: kr.targetValue,
        unit: kr.unit,
      })),
    };
  });

  const reportData: ExecutiveReportData = {
    executiveId: userId,
    executiveName: data.users[userId]?.name || 'Unknown',
    function: execFunction,
    summary: {
      tasksCreated,
      tasksCompleted,
      workflowItemsAllocated,
      workflowItemsStructured,
      apprenticeWorkVerified: execVerifications.length,
      hoursLogged: execTimeEntries.reduce((sum, te) => sum + te.hours, 0),
    },
    apprenticePerformance,
    workflowProgress,
    tasksBreakdown: {
      byStatus: byStatus as any,
      byPriority: byPriority as any,
      overdueTasks,
    },
    functionOKRs,
  };

  return {
    id: uuidv4(),
    workspaceId,
    reportType: 'executive',
    period,
    startDate,
    endDate,
    generatedAt: new Date().toISOString(),
    generatedBy: userId,
    data: reportData,
  };
}

// Generate Apprentice Report - Individual work summary
export async function generateApprenticeReport(
  workspaceId: string,
  userId: string,
  period: ReportPeriod,
  customStart?: string,
  customEnd?: string,
  data?: {
    tasks: Task[];
    timeEntries: TimeEntry[];
    workflowItems: WorkflowItem[];
    reviews: Review[];
    users: Record<string, User>;
    memberships: Membership[];
  }
): Promise<Report> {
  const { startDate, endDate } = getDateRange(period, customStart, customEnd);

  if (!data) {
    throw new Error('Data required for report generation');
  }

  // Find apprentice's membership to get their function
  const apprenticeMembership = data.memberships.find((m) => m.userId === userId && m.workspaceId === workspaceId);
  if (!apprenticeMembership) {
    throw new Error('Apprentice membership not found');
  }

  const apprenticeFunction = apprenticeMembership.function;

  // Filter data
  const workspaceTasks = data.tasks.filter((t) => t.workspaceId === workspaceId && t.assigneeId === userId);
  const periodTasks = filterByDateRange(workspaceTasks, startDate, endDate);
  const workspaceTimeEntries = data.timeEntries.filter((te) => te.workspaceId === workspaceId && te.userId === userId);
  const periodTimeEntries = filterByDateRange(workspaceTimeEntries, startDate, endDate);

  // Calculate summary
  const tasksAssigned = periodTasks.length;
  const tasksCompleted = periodTasks.filter((t) => t.status === 'done').length;
  const tasksInProgress = periodTasks.filter((t) => t.status === 'in_progress').length;
  const totalHoursLogged = periodTimeEntries.reduce((sum, te) => sum + te.hours, 0);

  const verifications = data.reviews.filter((r) => {
    const task = data.tasks.find((t) => t.id === r.taskId);
    return task?.assigneeId === userId;
  });
  const verificationsPending = verifications.filter((r) => r.status === 'pending').length;
  const verificationsApproved = verifications.filter((r) => r.status === 'approved').length;

  const completedTasksWithDuration = periodTasks.filter((t) => t.status === 'done' && t.completedAt);
  const averageTaskDuration = completedTasksWithDuration.length > 0
    ? Math.round(
        completedTasksWithDuration.reduce((sum, t) => {
          const created = new Date(t.createdAt);
          const completed = new Date(t.completedAt!);
          const days = (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0) / completedTasksWithDuration.length
      )
    : 0;

  // Task details
  const taskDetails = periodTasks.map((t) => {
    const taskTimeEntries = periodTimeEntries.filter((te) => te.taskId === t.id);
    const taskReview = verifications.find((r) => r.taskId === t.id);

    return {
      taskId: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      hoursLogged: taskTimeEntries.reduce((sum, te) => sum + te.hours, 0),
      createdAt: t.createdAt,
      completedAt: t.completedAt,
      verifiedAt: taskReview?.reviewedAt,
    };
  });

  // Time breakdown by date
  const timeByDate = periodTimeEntries.reduce((acc, te) => {
    const existing = acc.find((item) => item.date === te.date);
    if (existing) {
      existing.hours += te.hours;
    } else {
      acc.push({ date: te.date, hours: te.hours });
    }
    return acc;
  }, [] as { date: string; hours: number }[]);

  // Time breakdown by task
  const timeByTask = periodTasks.map((t) => {
    const taskTimeEntries = periodTimeEntries.filter((te) => te.taskId === t.id);
    return {
      taskTitle: t.title,
      hours: taskTimeEntries.reduce((sum, te) => sum + te.hours, 0),
    };
  }).filter((item) => item.hours > 0);

  // Workflow contributions
  const workflowContributions = data.workflowItems.filter((w) => {
    return w.workspaceId === workspaceId && w.taskId && periodTasks.some((t) => t.id === w.taskId);
  }).map((w) => {
    const taskTimeEntries = periodTimeEntries.filter((te) => te.taskId === w.taskId);
    return {
      workflowItemId: w.id,
      title: w.title,
      status: w.status,
      hoursSpent: taskTimeEntries.reduce((sum, te) => sum + te.hours, 0),
    };
  });

  // Achievements
  const achievements: string[] = [];
  if (tasksCompleted > 0) {
    achievements.push(`Completed ${tasksCompleted} tasks`);
  }
  if (totalHoursLogged > 0) {
    achievements.push(`Logged ${totalHoursLogged} hours`);
  }
  if (verificationsApproved > 0) {
    achievements.push(`${verificationsApproved} tasks verified by executive`);
  }

  const reportData: ApprenticeReportData = {
    apprenticeId: userId,
    apprenticeName: data.users[userId]?.name || 'Unknown',
    function: apprenticeFunction,
    summary: {
      tasksAssigned,
      tasksCompleted,
      tasksInProgress,
      totalHoursLogged,
      verificationsPending,
      verificationsApproved,
      averageTaskDuration,
    },
    taskDetails,
    timeBreakdown: {
      byDate: timeByDate,
      byTask: timeByTask,
      totalHours: totalHoursLogged,
    },
    workflowContributions,
    achievements,
  };

  return {
    id: uuidv4(),
    workspaceId,
    reportType: 'apprentice',
    period,
    startDate,
    endDate,
    generatedAt: new Date().toISOString(),
    generatedBy: userId,
    data: reportData,
  };
}

// Main report generation function
export async function generateReport(
  reportType: ReportType,
  workspaceId: string,
  userId: string,
  role: Role,
  period: ReportPeriod,
  customStart?: string,
  customEnd?: string,
  data?: any
): Promise<Report> {
  switch (reportType) {
    case 'founder':
      if (role !== 'Founder') {
        throw new Error('Only founders can generate founder reports');
      }
      return generateFounderReport(workspaceId, userId, period, customStart, customEnd, data);

    case 'executive':
      if (role !== 'FractionalExec') {
        throw new Error('Only executives can generate executive reports');
      }
      return generateExecutiveReport(workspaceId, userId, period, customStart, customEnd, data);

    case 'apprentice':
      if (role !== 'Apprentice') {
        throw new Error('Only apprentices can generate apprentice reports');
      }
      return generateApprenticeReport(workspaceId, userId, period, customStart, customEnd, data);

    default:
      throw new Error('Invalid report type');
  }
}
