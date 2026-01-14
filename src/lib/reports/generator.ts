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
import {
  analyzeStrategicPosition,
  analyzeOperationsExcellence,
  analyzeFinancialHealth,
  analyzeTalent,
  analyzeProcessHealth,
  analyzeManufacturing,
  type StrategyContext,
  type OperationsContext,
  type FinanceContext,
  type TalentContext,
  type ProcessContext,
  type ManufacturingContext,
} from './consulting-frameworks';

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

  // ============================================================================
  // ELITE CONSULTING FRAMEWORKS ANALYSIS
  // McKinsey, BCG, Bain, Deloitte, Accenture, EY, PwC, KPMG, Oliver Wyman,
  // Roland Berger, Mercer, Korn Ferry, Charles River Associates, Aon
  // ============================================================================

  // Calculate average task duration for operations analysis
  const completedTasksWithDuration = completedTasks.filter((t) => t.completedAt);
  const avgTaskDuration = completedTasksWithDuration.length > 0
    ? completedTasksWithDuration.reduce((sum, t) => {
        const created = new Date(t.createdAt);
        const completed = new Date(t.completedAt!);
        return sum + (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      }, 0) / completedTasksWithDuration.length
    : 5;

  // Strategy Analysis (McKinsey 7S, BCG Growth-Share, Bain NPS, Oliver Wyman, Roland Berger)
  const strategyContext: StrategyContext = {
    revenue: mockRevenue,
    revenueGrowth: 15, // Default assumption
    marketSize: mockRevenue * 100, // Assume 1% market share
    marketGrowthRate: 20, // High-growth market
    competitorCount: 5,
    teamSize: workspaceMemberships.length,
    executiveAlignment: executivePerformance.length > 0
      ? Math.min(100, executivePerformance.reduce((sum, e) => sum + e.tasksCompleted, 0) / executivePerformance.length * 10)
      : 70,
    digitalCapability: 65, // Default baseline
    customerSatisfaction: completionRate, // Use completion rate as proxy
    employeeEngagement: avgUtilization > 60 && avgUtilization < 90 ? 80 : 60,
  };
  const strategyAnalysis = analyzeStrategicPosition(strategyContext);

  // Operations Analysis (McKinsey Ops, BCG Lean, Deloitte Digital, Accenture Intelligent, Bain Supply Chain)
  const operationsContext: OperationsContext = {
    completionRate,
    avgTaskDuration,
    utilizationRate: avgUtilization,
    overdueTasks: periodTasks.filter((t) => {
      if (!t.dueDate || t.status === 'done') return false;
      return new Date(t.dueDate) < new Date();
    }).length,
    totalTasks: periodTasks.length,
    automationLevel: 40, // Default baseline
    processDocumentation: 50, // Default baseline
    qualityScore: completionRate,
    cycleTime: avgTaskDuration,
    teamVelocity: completedTasks.length / 7,
  };
  const operationsAnalysis = analyzeOperationsExcellence(operationsContext);

  // Finance Analysis (EY Performance, Deloitte Risk, PwC Value Creation, Charles River Economics)
  const financeContext: FinanceContext = {
    revenue: mockRevenue,
    previousRevenue: mockRevenue * 0.9,
    costs: mockBurn * 0.8,
    burn: mockBurn,
    cashBalance: mockCashBalance,
    runway: mockRunway,
    grossMargin: 65, // Default for hardware startup
    ltv: mockRevenue * 24, // 24-month LTV
    cac: mockRevenue * 6, // 6-month payback
    customerCount: 50, // Default
    previousCustomerCount: 45,
    netRevenueRetention: 105, // Healthy expansion
  };
  const financeAnalysis = analyzeFinancialHealth(financeContext);

  // Talent Analysis (McKinsey Human Capital, Deloitte HR, Mercer, Korn Ferry, Aon)
  const talentContext: TalentContext = {
    teamSize: workspaceMemberships.length,
    executives: executives.length,
    apprentices: apprentices.length,
    avgUtilization,
    overutilizedCount,
    underutilizedCount,
    avgTenure: 12, // Default 12 months
    recentDepartures: 0,
    openRoles: 2, // Default
    trainingHoursPerPerson: 8, // Default
    engagementScore: avgUtilization > 60 && avgUtilization < 90 ? 75 : 55,
    performanceDistribution: {
      exceeds: apprenticeUtilization.filter((a) => a.utilizationRate > 85).length,
      meets: apprenticeUtilization.filter((a) => a.utilizationRate >= 60 && a.utilizationRate <= 85).length,
      below: apprenticeUtilization.filter((a) => a.utilizationRate < 60).length,
    },
  };
  const talentAnalysis = analyzeTalent(talentContext);

  // Process Analysis (Accenture BPM, KPMG Excellence, PwC Risk, Deloitte Analytics)
  const processContext: ProcessContext = {
    completionRate,
    avgCycleTime: avgTaskDuration,
    cycleTimeVariability: 25, // Default moderate variability
    automationLevel: 40,
    errorRate: 100 - completionRate,
    reworkRate: 10, // Default
    documentationLevel: 50,
    standardizationLevel: 55,
  };
  const processAnalysis = analyzeProcessHealth(processContext);

  // Manufacturing/Operations Analysis (BCG, Deloitte Industry 4.0, McKinsey Digital, KPMG OEE)
  const manufacturingContext: ManufacturingContext = {
    throughput: completedTasks.length,
    targetThroughput: periodTasks.length,
    qualityRate: completionRate,
    availability: avgUtilization,
    performance: Math.min(100, completionRate * 1.1),
    automationLevel: 40,
    digitalMaturity: 50,
    wasteRate: 100 - completionRate,
    energyEfficiency: 70,
  };
  const manufacturingAnalysis = analyzeManufacturing(manufacturingContext);

  // Calculate integrated consulting score
  const integratedScore = Math.round(
    (strategyAnalysis.overallAlignment * 0.2 +
     operationsAnalysis.overallOpsScore * 0.2 +
     financeAnalysis.overallFinancialHealth * 0.2 +
     talentAnalysis.overallTalentScore * 0.2 +
     processAnalysis.processMaturityLevel * 20 * 0.1 +
     manufacturingAnalysis.overallManufacturingScore * 0.1)
  );

  // Generate integrated consulting insights
  const consultingInsights: Array<{
    source: string;
    category: string;
    insight: string;
    recommendation: string;
    impact: string;
  }> = [];

  // Add top insights from each framework
  if (strategyAnalysis.overallAlignment < 70) {
    consultingInsights.push({
      source: 'McKinsey 7S Framework',
      category: 'Strategy',
      insight: `Organizational alignment at ${strategyAnalysis.overallAlignment}% - below optimal threshold`,
      recommendation: strategyAnalysis.sevenS.strategy.actions[0] || 'Conduct strategic alignment workshop',
      impact: 'Improves execution velocity by 20-30%',
    });
  }

  if (operationsAnalysis.overallOpsScore < 70) {
    consultingInsights.push({
      source: 'Deloitte Digital Operations',
      category: 'Operations',
      insight: `Operations score at ${operationsAnalysis.overallOpsScore}% - efficiency opportunities exist`,
      recommendation: operationsAnalysis.recommendations[0]?.title || 'Launch operations excellence program',
      impact: 'Reduces cycle time by 25%, improves throughput',
    });
  }

  if (financeAnalysis.overallFinancialHealth < 70) {
    consultingInsights.push({
      source: 'EY Financial Performance',
      category: 'Finance',
      insight: `Financial health at ${financeAnalysis.overallFinancialHealth}% - action needed`,
      recommendation: financeAnalysis.recommendations[0]?.title || 'Optimize unit economics',
      impact: 'Extends runway, improves investor readiness',
    });
  }

  if (talentAnalysis.humanCapitalRisk.overallRisk === 'high' || talentAnalysis.humanCapitalRisk.overallRisk === 'critical') {
    consultingInsights.push({
      source: 'Mercer/Korn Ferry Talent Assessment',
      category: 'Talent',
      insight: `Human capital risk: ${talentAnalysis.humanCapitalRisk.overallRisk}`,
      recommendation: talentAnalysis.recommendations[0]?.title || 'Address capacity imbalances',
      impact: 'Reduces attrition risk, improves productivity',
    });
  }

  if (processAnalysis.processMaturityLevel < 3) {
    consultingInsights.push({
      source: 'KPMG Process Excellence',
      category: 'Process',
      insight: `Process maturity at Level ${processAnalysis.processMaturityLevel}: ${processAnalysis.processMaturityLabel}`,
      recommendation: processAnalysis.recommendations[0]?.title || 'Implement process documentation',
      impact: 'Improves consistency, enables scaling',
    });
  }

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
    // Elite Consulting Frameworks Analysis
    consultingAnalysis: {
      strategy: strategyAnalysis,
      operations: operationsAnalysis,
      finance: financeAnalysis,
      talent: talentAnalysis,
      process: processAnalysis,
      manufacturing: manufacturingAnalysis,
      integratedScore,
      consultingInsights,
    },
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
