/**
 * Time Unit (TU) Report Export Utilities
 *
 * Export TU metrics in multiple formats for board packs, analysis, and integration
 * Formats: Markdown, CSV, JSON, PDF-ready
 */

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { WorkPlan } from '../state/work-plan-store';
import type { OrganizationMember } from '../organization-seed';
import {
  calculateTUMetrics,
  analyzeTaskTU,
  analyzeMemberTU,
  forecastTUs,
  identifyTUOpportunities,
  generateTULeaderboard,
  type TUMetrics,
  type TaskTUAnalysis,
  type MemberTUPerformance,
  type TUForecast,
  type TUOpportunity,
} from './tu-analytics';

// ============================================
// MARKDOWN EXPORT (Board-Ready)
// ============================================

export function exportTUReportAsMarkdown(
  workPlans: WorkPlan[],
  members: OrganizationMember[],
  period: 'week' | 'month' | 'quarter' | 'all' = 'month'
): string {
  const metrics = calculateTUMetrics(workPlans, members, period);
  const forecast = forecastTUs(workPlans, members);
  const opportunities = identifyTUOpportunities(workPlans, members);
  const leaderboard = generateTULeaderboard(workPlans, members);

  const periodLabel = period === 'all' ? 'All Time' :
                      period === 'week' ? 'This Week' :
                      period === 'month' ? 'This Month' : 'This Quarter';

  let md = `# Time Unit (TU) Performance Report\n\n`;
  md += `**Period**: ${periodLabel}\n`;
  md += `**Generated**: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}\n\n`;
  md += `---\n\n`;

  // ============================================
  // EXECUTIVE SUMMARY
  // ============================================
  md += `## Executive Summary\n\n`;

  md += `### Key Metrics\n\n`;
  md += `| Metric | Value | Status |\n`;
  md += `|--------|-------|--------|\n`;
  md += `| **Total TUs Allocated** | ${metrics.totalTUsAllocated}□ | ${metrics.velocityTrend === 'improving' ? '📈 Improving' : metrics.velocityTrend === 'declining' ? '📉 Declining' : '➡️ Stable'} |\n`;
  md += `| **TUs Expended** | ${metrics.totalTUsExpended}□ | ${metrics.tuVariancePercent > 0 ? '⚠️ Over' : '✅ Under'} Budget (${metrics.tuVariancePercent >= 0 ? '+' : ''}${metrics.tuVariancePercent.toFixed(1)}%) |\n`;
  md += `| **TU Efficiency** | ${(metrics.tuEfficiency * 100).toFixed(0)}% | ${metrics.tuEfficiency < 1.0 ? '✅ Excellent' : metrics.tuEfficiency < 1.2 ? '🟡 Good' : '🔴 Poor'} |\n`;
  md += `| **Weekly TU Burn** | ${metrics.tuPerWeek}□/week | - |\n`;
  md += `| **Tasks per TU** | ${metrics.tasksPerTU.toFixed(2)} | ${metrics.tasksPerTU > 0.1 ? '✅' : '⚠️'} |\n\n`;

  md += `### Financial Summary\n\n`;
  md += `| Metric | Budgeted | Actual | Variance |\n`;
  md += `|--------|----------|--------|----------|\n`;
  md += `| **Total Cost** | £${(metrics.totalBudgeted / 1000).toFixed(1)}k | £${(metrics.totalActual / 1000).toFixed(1)}k | ${metrics.costVariancePercent >= 0 ? '+' : ''}${metrics.costVariancePercent.toFixed(1)}% |\n`;
  md += `| **Cost per TU** | - | £${Math.round(metrics.totalActual / Math.max(1, metrics.totalTUsExpended))} | - |\n`;
  md += `| **Total Savings** | - | £${(metrics.totalSavings / 1000).toFixed(1)}k | ${metrics.totalSavings > 0 ? '✅' : '🔴'} |\n\n`;

  md += `### AI Impact\n\n`;
  md += `| Metric | Value |\n`;
  md += `|--------|-------|\n`;
  md += `| **AI Cost** | £${(metrics.aiCostSpend / 1000).toFixed(1)}k |\n`;
  md += `| **Human Cost Savings** | £${(metrics.aiMultiplierSavings / 1000).toFixed(1)}k |\n`;
  md += `| **Net Savings** | £${((metrics.aiMultiplierSavings - metrics.aiCostSpend) / 1000).toFixed(1)}k |\n`;
  md += `| **AI ROI** | ${(metrics.aiROI * 100).toFixed(0)}% ${metrics.aiROI > 2 ? '✅ Excellent' : metrics.aiROI > 0.5 ? '🟡 Good' : '🔴 Review'} |\n\n`;

  // ============================================
  // FORECAST
  // ============================================
  md += `## Forecast & Planning\n\n`;

  md += `### Next Week\n`;
  md += `- **Planned TUs**: ${forecast.nextWeek.tusPlanned}□\n`;
  md += `- **Expected Output**: ${forecast.nextWeek.tusExpected}□ (adjusted for efficiency)\n`;
  md += `- **Cost**: £${(forecast.nextWeek.cost / 1000).toFixed(1)}k\n`;
  md += `- **Tasks to Complete**: ${forecast.nextWeek.tasksToComplete}\n\n`;

  md += `### Next Month\n`;
  md += `- **Planned TUs**: ${forecast.nextMonth.tusPlanned}□\n`;
  md += `- **Expected Output**: ${forecast.nextMonth.tusExpected}□\n`;
  md += `- **Cost**: £${(forecast.nextMonth.cost / 1000).toFixed(1)}k\n`;
  md += `- **Tasks to Complete**: ${forecast.nextMonth.tasksToComplete}\n\n`;

  md += `### Next Quarter\n`;
  md += `- **Planned TUs**: ${forecast.nextQuarter.tusPlanned}□\n`;
  md += `- **Expected Output**: ${forecast.nextQuarter.tusExpected}□\n`;
  md += `- **Cost**: £${(forecast.nextQuarter.cost / 1000).toFixed(1)}k\n`;
  md += `- **Tasks to Complete**: ${forecast.nextQuarter.tasksToComplete}\n\n`;

  if (forecast.capacityBottlenecks.length > 0) {
    md += `### ⚠️ Capacity Bottlenecks\n\n`;
    forecast.capacityBottlenecks.forEach(bottleneck => {
      md += `**${bottleneck.function}**: Shortfall of ${bottleneck.shortfall}□/week\n`;
      md += `- Impacted tasks (${bottleneck.impactedTasks.length}): ${bottleneck.impactedTasks.slice(0, 3).join(', ')}${bottleneck.impactedTasks.length > 3 ? '...' : ''}\n\n`;
    });
  }

  // ============================================
  // OPPORTUNITIES
  // ============================================
  if (opportunities.length > 0) {
    md += `## Improvement Opportunities\n\n`;

    const highPriority = opportunities.filter(o => o.priority === 'high');
    const mediumPriority = opportunities.filter(o => o.priority === 'medium');

    if (highPriority.length > 0) {
      md += `### 🔴 High Priority\n\n`;
      highPriority.forEach((opp, i) => {
        md += `**${i + 1}. ${opp.title}**\n`;
        md += `- ${opp.description}\n`;
        md += `- **Impact**: ${opp.impact}\n`;
        md += `- **Potential Savings**: £${(opp.savings / 1000).toFixed(1)}k\n`;
        if (opp.affectedTasks.length > 0) {
          md += `- **Tasks**: ${opp.affectedTasks.slice(0, 3).join(', ')}${opp.affectedTasks.length > 3 ? ` (+${opp.affectedTasks.length - 3} more)` : ''}\n`;
        }
        md += `\n`;
      });
    }

    if (mediumPriority.length > 0) {
      md += `### 🟡 Medium Priority\n\n`;
      mediumPriority.forEach((opp, i) => {
        md += `**${i + 1}. ${opp.title}**\n`;
        md += `- ${opp.description}\n`;
        md += `- **Impact**: ${opp.impact}\n`;
        md += `- **Potential Savings**: £${(opp.savings / 1000).toFixed(1)}k\n\n`;
      });
    }
  }

  // ============================================
  // TEAM PERFORMANCE
  // ============================================
  md += `## Team Performance Leaderboard\n\n`;
  md += `| Rank | Name | Role | Utilization | Efficiency | Trend |\n`;
  md += `|------|------|------|-------------|------------|-------|\n`;

  leaderboard.slice(0, 10).forEach((perf, i) => {
    const trendIcon = perf.trend === 'improving' ? '📈' :
                      perf.trend === 'declining' ? '📉' : '➡️';
    const utilIcon = perf.utilizationPercent > 85 ? '🔴' :
                     perf.utilizationPercent > 60 ? '🟡' : '🟢';

    md += `| ${i + 1} | ${perf.memberName} | ${perf.role} | ${utilIcon} ${perf.utilizationPercent}% | ${perf.efficiencyScore}/100 | ${trendIcon} ${perf.trend} |\n`;
  });
  md += `\n`;

  // ============================================
  // DETAILED TEAM BREAKDOWN
  // ============================================
  md += `## Detailed Team Breakdown\n\n`;

  leaderboard.forEach(perf => {
    md += `### ${perf.memberName} (${perf.role} - ${perf.function})\n\n`;
    md += `- **Capacity**: ${perf.allocatedTUs}□ / ${perf.totalCapacity}□ per week (${perf.utilizationPercent}% utilized)\n`;
    md += `- **Available**: ${perf.availableTUs}□/week\n`;
    md += `- **Active Tasks**: ${perf.tasksWorking}\n`;
    md += `- **TUs Completed**: ${perf.tusExpended}□\n`;
    md += `- **Weekly Cost**: £${(perf.weeklyCost / 1000).toFixed(1)}k (£${perf.costPerTU}/□)\n`;
    md += `- **Skill Match Rate**: ${perf.skillMatchRate}% (working in-function)\n`;
    md += `- **Efficiency Score**: ${perf.efficiencyScore}/100\n\n`;
  });

  // ============================================
  // TASK ANALYSIS
  // ============================================
  const activeTasks = workPlans.filter(wp =>
    wp.status === 'in-progress' || wp.status === 'not-started'
  );

  if (activeTasks.length > 0) {
    md += `## Active Task Analysis\n\n`;
    md += `| Task | Status | Estimated | Allocated | Expended | Variance | Completion |\n`;
    md += `|------|--------|-----------|-----------|----------|----------|------------|\n`;

    activeTasks.slice(0, 15).forEach(task => {
      const analysis = analyzeTaskTU(task, members);
      const varianceIcon = analysis.variancePercent > 10 ? '🔴' :
                          analysis.variancePercent > -5 ? '🟡' : '✅';

      md += `| ${task.title.substring(0, 30)}${task.title.length > 30 ? '...' : ''} | ${task.status} | ${analysis.estimatedTUs}□ | ${analysis.allocatedTUs}□/wk | ${analysis.expendedTUs}□ | ${varianceIcon} ${analysis.variancePercent >= 0 ? '+' : ''}${analysis.variancePercent.toFixed(0)}% | ${analysis.daysToCompletion}d |\n`;
    });
    md += `\n`;
  }

  // ============================================
  // APPENDIX
  // ============================================
  md += `---\n\n`;
  md += `## Appendix: Methodology\n\n`;
  md += `### Time Unit (TU) System\n`;
  md += `- **1 TU = 4 hours** of focused work\n`;
  md += `- **Capacity**: Founders/Apprentices = 10 TU/week, Executives = (days/week × 2) TU/week\n`;
  md += `- **Cost per TU**: Founders = £960, Executives = (day rate ÷ 2), Apprentices = £70\n\n`;

  md += `### AI Multipliers\n`;
  md += `- **2x Assist**: Basic AI help (£5/TU)\n`;
  md += `- **5x Copilot**: AI handles routine work (£15/TU)\n`;
  md += `- **10x Heavy**: AI does most work (£30/TU)\n`;
  md += `- **20x Autonomous**: AI handles everything (£50/TU)\n\n`;

  md += `### Efficiency Penalties\n`;
  md += `- **Skill Mismatch**: 50% efficiency penalty when working outside function\n`;
  md += `- **Overtime**: 20% efficiency penalty on sprint mode\n`;
  md += `- **Team Size**: Brooks' Law applied to coordination overhead\n\n`;

  md += `### Metrics Definitions\n`;
  md += `- **TU Variance**: (Actual TUs - Estimated TUs) / Estimated TUs\n`;
  md += `- **TU Efficiency**: Actual TUs / Estimated TUs (1.0 = perfect, <1.0 = under budget)\n`;
  md += `- **Cost Efficiency**: Actual Cost / Budgeted Cost\n`;
  md += `- **AI ROI**: (Human Cost Savings - AI Cost) / AI Cost\n`;
  md += `- **Team Efficiency Score**: Composite of utilization, skill match, and completion rate\n\n`;

  return md;
}

// ============================================
// CSV EXPORT (Spreadsheet Analysis)
// ============================================

export function exportTUMetricsAsCSV(
  workPlans: WorkPlan[],
  members: OrganizationMember[]
): string {
  let csv = 'Category,Metric,Value,Unit,Status\n';

  const metrics = calculateTUMetrics(workPlans, members);

  // Summary metrics
  csv += `Summary,Total TUs Allocated,${metrics.totalTUsAllocated},squares,\n`;
  csv += `Summary,TUs Expended,${metrics.totalTUsExpended},squares,\n`;
  csv += `Summary,TUs Remaining,${metrics.totalTUsRemaining},squares,\n`;
  csv += `Summary,TU Variance,${metrics.tuVariance},squares,${metrics.tuVariance > 0 ? 'Over Budget' : 'Under Budget'}\n`;
  csv += `Summary,TU Variance %,${metrics.tuVariancePercent.toFixed(2)},percent,\n`;
  csv += `Summary,TU Efficiency,${(metrics.tuEfficiency * 100).toFixed(1)},percent,${metrics.tuEfficiency < 1.2 ? 'Good' : 'Poor'}\n`;
  csv += `Summary,Weekly TU Burn,${metrics.tuPerWeek},squares/week,\n`;
  csv += `Summary,Tasks per TU,${metrics.tasksPerTU.toFixed(3)},tasks/square,\n`;

  // Financial metrics
  csv += `Finance,Total Budgeted,${metrics.totalBudgeted},GBP,\n`;
  csv += `Finance,Total Actual,${metrics.totalActual},GBP,\n`;
  csv += `Finance,Cost Variance,${metrics.costVariance},GBP,${metrics.costVariance > 0 ? 'Over Budget' : 'Under Budget'}\n`;
  csv += `Finance,Cost Variance %,${metrics.costVariancePercent.toFixed(2)},percent,\n`;
  csv += `Finance,Total Savings,${metrics.totalSavings},GBP,\n`;

  // AI metrics
  csv += `AI,AI Cost Spend,${metrics.aiCostSpend},GBP,\n`;
  csv += `AI,AI Multiplier Savings,${metrics.aiMultiplierSavings},GBP,\n`;
  csv += `AI,AI ROI,${(metrics.aiROI * 100).toFixed(1)},percent,${metrics.aiROI > 1.0 ? 'Excellent' : metrics.aiROI > 0.5 ? 'Good' : 'Review'}\n`;

  return csv;
}

export function exportTaskTUAnalysisAsCSV(
  workPlans: WorkPlan[],
  members: OrganizationMember[]
): string {
  let csv = 'Task ID,Task Title,Function,Status,Estimated TUs,Allocated TUs/wk,Expended TUs,Remaining TUs,Days to Completion,Budgeted Cost,Actual Cost,Projected Cost,Variance,Variance %,Team Size,AI Multiplier,Efficiency Rating,Skill Match %\n';

  workPlans.forEach(task => {
    const analysis = analyzeTaskTU(task, members);
    csv += `"${analysis.taskId}","${analysis.taskTitle.replace(/"/g, '""')}",${analysis.function},${analysis.status},${analysis.estimatedTUs},${analysis.allocatedTUs},${analysis.expendedTUs},${analysis.remainingTUs},${analysis.daysToCompletion},${analysis.budgetedCost},${analysis.actualCost},${analysis.projectedCost},${analysis.variance},${analysis.variancePercent},${analysis.teamSize},${analysis.aiMultiplier},${analysis.efficiencyRating},${analysis.skillMatchScore}\n`;
  });

  return csv;
}

export function exportMemberTUPerformanceAsCSV(
  workPlans: WorkPlan[],
  members: OrganizationMember[]
): string {
  let csv = 'Member ID,Member Name,Role,Function,Total Capacity,Allocated TUs,Available TUs,Utilization %,Tasks Working,TUs Expended,Weekly Cost,Cost per TU,Skill Match Rate %,Efficiency Score,Trend\n';

  const leaderboard = generateTULeaderboard(workPlans, members);

  leaderboard.forEach(perf => {
    csv += `"${perf.memberId}","${perf.memberName}",${perf.role},${perf.function},${perf.totalCapacity},${perf.allocatedTUs},${perf.availableTUs},${perf.utilizationPercent},${perf.tasksWorking},${perf.tusExpended},${perf.weeklyCost},${perf.costPerTU},${perf.skillMatchRate},${perf.efficiencyScore},${perf.trend}\n`;
  });

  return csv;
}

// ============================================
// JSON EXPORT (API Integration)
// ============================================

export interface TUReportJSON {
  generatedAt: string;
  period: string;
  summary: TUMetrics;
  forecast: TUForecast;
  opportunities: TUOpportunity[];
  teamPerformance: MemberTUPerformance[];
  taskAnalysis: TaskTUAnalysis[];
}

export function exportTUReportAsJSON(
  workPlans: WorkPlan[],
  members: OrganizationMember[],
  period: 'week' | 'month' | 'quarter' | 'all' = 'month'
): string {
  const metrics = calculateTUMetrics(workPlans, members, period);
  const forecast = forecastTUs(workPlans, members);
  const opportunities = identifyTUOpportunities(workPlans, members);
  const teamPerformance = generateTULeaderboard(workPlans, members);
  const taskAnalysis = workPlans.map(wp => analyzeTaskTU(wp, members));

  const report: TUReportJSON = {
    generatedAt: new Date().toISOString(),
    period,
    summary: metrics,
    forecast,
    opportunities,
    teamPerformance,
    taskAnalysis,
  };

  return JSON.stringify(report, null, 2);
}

// ============================================
// FILE EXPORT & SHARING
// ============================================

export async function exportAndShareTUReport(
  workPlans: WorkPlan[],
  members: OrganizationMember[],
  format: 'markdown' | 'csv-metrics' | 'csv-tasks' | 'csv-team' | 'json',
  period: 'week' | 'month' | 'quarter' | 'all' = 'month'
): Promise<void> {
  let content: string;
  let filename: string;
  let mimeType: string;

  const timestamp = new Date().toISOString().split('T')[0];

  switch (format) {
    case 'markdown':
      content = exportTUReportAsMarkdown(workPlans, members, period);
      filename = `tu-report-${period}-${timestamp}.md`;
      mimeType = 'text/markdown';
      break;

    case 'csv-metrics':
      content = exportTUMetricsAsCSV(workPlans, members);
      filename = `tu-metrics-${period}-${timestamp}.csv`;
      mimeType = 'text/csv';
      break;

    case 'csv-tasks':
      content = exportTaskTUAnalysisAsCSV(workPlans, members);
      filename = `tu-task-analysis-${period}-${timestamp}.csv`;
      mimeType = 'text/csv';
      break;

    case 'csv-team':
      content = exportMemberTUPerformanceAsCSV(workPlans, members);
      filename = `tu-team-performance-${period}-${timestamp}.csv`;
      mimeType = 'text/csv';
      break;

    case 'json':
      content = exportTUReportAsJSON(workPlans, members, period);
      filename = `tu-report-${period}-${timestamp}.json`;
      mimeType = 'application/json';
      break;

    default:
      throw new Error(`Unsupported format: ${format}`);
  }

  // Write to file
  const fileUri = `${FileSystem.documentDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(fileUri, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  // Share the file
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType,
      dialogTitle: `Export TU Report (${format.toUpperCase()})`,
      UTI: mimeType,
    });
  } else {
    throw new Error('Sharing is not available on this device');
  }
}
