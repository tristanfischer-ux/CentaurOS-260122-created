// Board pack export utilities
// Formats founder reports for easy inclusion in board presentations

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { Report, FounderReportData } from '@/types';
import { CURRENT_FINANCIALS, calculateFinancialRatios } from '@/lib/financial-seed';

// Format founder report as markdown for board pack
export function formatFounderReportAsMarkdown(report: Report): string {
  if (report.reportType !== 'founder') {
    throw new Error('Only founder reports can be exported as board packs');
  }

  const data = report.data as FounderReportData;
  const startDate = new Date(report.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const endDate = new Date(report.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  let markdown = `# Board Report: ${startDate} - ${endDate}\n\n`;
  markdown += `*Generated: ${new Date(report.generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}*\n\n`;
  markdown += `---\n\n`;

  // Executive Summary
  markdown += `## Executive Summary\n\n`;
  markdown += `**Team Performance**\n`;
  markdown += `- Total Tasks: ${data.overview.totalTasks}\n`;
  markdown += `- Completed: ${data.overview.completedTasks} (${data.overview.completionRate}%)\n`;
  markdown += `- Total Hours Logged: ${data.overview.totalTimeLogged}h\n`;
  markdown += `- Team Members: ${data.overview.totalTeamMembers}\n`;
  markdown += `- Active Functions: ${data.overview.activeFunctions.join(', ')}\n\n`;

  markdown += `**Workflow Progress**\n`;
  markdown += `- Active Items: ${data.overview.activeWorkflowItems}\n`;
  markdown += `- Completed Items: ${data.overview.completedWorkflowItems}\n\n`;

  // Financial Overview
  const financials = CURRENT_FINANCIALS;
  const ratios = calculateFinancialRatios(financials);

  markdown += `## Financial Overview\n\n`;
  markdown += `**Revenue & Profitability (${financials.currentMonth})**\n`;
  markdown += `- Revenue: £${(financials.revenue.total / 1000).toFixed(1)}k (${financials.revenue.growth > 0 ? '+' : ''}${financials.revenue.growth}% growth)\n`;
  markdown += `- Gross Profit: £${(ratios.grossProfit / 1000).toFixed(1)}k (${ratios.grossMargin.toFixed(1)}% margin)\n`;
  markdown += `- Net Profit/Loss: £${(ratios.netProfit / 1000).toFixed(1)}k (${ratios.netMargin.toFixed(1)}% margin)\n\n`;

  markdown += `**Revenue Breakdown**\n`;
  markdown += `- Product Sales: £${(financials.revenue.breakdown.productSales / 1000).toFixed(1)}k\n`;
  markdown += `- Services: £${(financials.revenue.breakdown.services / 1000).toFixed(1)}k\n`;
  markdown += `- Recurring: £${(financials.revenue.breakdown.recurring / 1000).toFixed(1)}k\n\n`;

  markdown += `**Cost Structure**\n`;
  markdown += `- COGS: £${(financials.cogs.total / 1000).toFixed(1)}k (${((financials.cogs.total / financials.burnRate) * 100).toFixed(1)}% of burn)\n`;
  markdown += `  - Materials: £${(financials.cogs.breakdown.materials / 1000).toFixed(1)}k\n`;
  markdown += `  - Manufacturing: £${(financials.cogs.breakdown.manufacturing / 1000).toFixed(1)}k\n`;
  markdown += `  - Shipping: £${(financials.cogs.breakdown.shipping / 1000).toFixed(1)}k\n`;
  markdown += `- Team Costs: £${(financials.teamCosts.total / 1000).toFixed(1)}k (${ratios.teamBurnPercentage.toFixed(1)}% of burn)\n`;
  markdown += `  - Fractional Execs (${financials.teamCosts.headcount.fractionalExecs}): £${(financials.teamCosts.breakdown.fractionalExecs / 1000).toFixed(1)}k\n`;
  markdown += `  - Apprentices (${financials.teamCosts.headcount.apprentices}): £${(financials.teamCosts.breakdown.apprentices / 1000).toFixed(1)}k\n`;
  markdown += `- AI Services: £${(financials.aiCosts.total / 1000).toFixed(1)}k (${ratios.aiBurnPercentage.toFixed(1)}% of burn)\n`;
  markdown += `  - OpenAI: £${(financials.aiCosts.breakdown.openai / 1000).toFixed(1)}k\n`;
  markdown += `  - Anthropic: £${(financials.aiCosts.breakdown.anthropic / 1000).toFixed(1)}k\n`;
  markdown += `  - Google: £${(financials.aiCosts.breakdown.google / 1000).toFixed(1)}k\n`;
  markdown += `  - ElevenLabs: £${(financials.aiCosts.breakdown.elevenlabs / 1000).toFixed(1)}k\n`;
  markdown += `- Other Costs: £${(financials.otherCosts.total / 1000).toFixed(1)}k\n`;
  markdown += `  - Office: £${(financials.otherCosts.breakdown.office / 1000).toFixed(1)}k\n`;
  markdown += `  - Software: £${(financials.otherCosts.breakdown.software / 1000).toFixed(1)}k\n`;
  markdown += `  - Marketing: £${(financials.otherCosts.breakdown.marketing / 1000).toFixed(1)}k\n`;
  markdown += `  - Legal: £${(financials.otherCosts.breakdown.legal / 1000).toFixed(1)}k\n\n`;

  markdown += `**Cash Position**\n`;
  markdown += `- Monthly Burn Rate: £${(financials.burnRate / 1000).toFixed(1)}k\n`;
  markdown += `- Cash Balance: £${(financials.cashBalance / 1000).toFixed(0)}k\n`;
  markdown += `- Runway: ${financials.runway.toFixed(1)} months\n\n`;

  // Risks & Alerts
  if (data.risks.length > 0) {
    markdown += `## Risks & Alerts\n\n`;
    const highRisks = data.risks.filter((r) => r.severity === 'high');
    const mediumRisks = data.risks.filter((r) => r.severity === 'medium');
    const lowRisks = data.risks.filter((r) => r.severity === 'low');

    if (highRisks.length > 0) {
      markdown += `### 🔴 High Priority\n`;
      highRisks.forEach((risk) => {
        markdown += `- ${risk.message} [${risk.affectedArea}]\n`;
      });
      markdown += `\n`;
    }

    if (mediumRisks.length > 0) {
      markdown += `### 🟡 Medium Priority\n`;
      mediumRisks.forEach((risk) => {
        markdown += `- ${risk.message} [${risk.affectedArea}]\n`;
      });
      markdown += `\n`;
    }

    if (lowRisks.length > 0) {
      markdown += `### 🟢 Low Priority\n`;
      lowRisks.forEach((risk) => {
        markdown += `- ${risk.message} [${risk.affectedArea}]\n`;
      });
      markdown += `\n`;
    }
  }

  // OKR Progress
  markdown += `## OKR Progress\n\n`;
  if (data.okrProgress.length > 0) {
    markdown += `| Objective | Progress | Health | Key Results | Owner |\n`;
    markdown += `|-----------|----------|--------|-------------|-------|\n`;
    data.okrProgress.forEach((okr) => {
      const healthEmoji = okr.healthStatus === 'on_track' ? '🟢' : okr.healthStatus === 'at_risk' ? '🟡' : '🔴';
      markdown += `| ${okr.objectiveTitle} | ${okr.progress}% | ${healthEmoji} ${okr.healthStatus} | ${okr.keyResultsCount} | ${okr.owner} |\n`;
    });
    markdown += `\n`;
  } else {
    markdown += `*No objectives tracked during this period.*\n\n`;
  }

  // Executive Performance
  markdown += `## Executive Performance\n\n`;
  if (data.executivePerformance.length > 0) {
    markdown += `| Executive | Function | Tasks Created | Tasks Completed | Workflow Items | Apprentice Work Verified | Hours |\n`;
    markdown += `|-----------|----------|---------------|-----------------|----------------|--------------------------|-------|\n`;
    data.executivePerformance.forEach((exec) => {
      markdown += `| ${exec.executiveName} | ${exec.function} | ${exec.tasksCreated} | ${exec.tasksCompleted} | ${exec.workflowItemsStructured} | ${exec.apprenticeWorkVerified} | ${exec.hoursLogged}h |\n`;
    });
    markdown += `\n`;
  } else {
    markdown += `*No executives tracked during this period.*\n\n`;
  }

  // Apprentice Utilization
  markdown += `## Apprentice Utilization\n\n`;
  if (data.apprenticeUtilization.length > 0) {
    markdown += `| Apprentice | Function | Tasks Assigned | Tasks Completed | Hours | Avg Completion | Utilization |\n`;
    markdown += `|------------|----------|----------------|-----------------|-------|----------------|-------------|\n`;
    data.apprenticeUtilization.forEach((apprentice) => {
      markdown += `| ${apprentice.apprenticeName} | ${apprentice.function} | ${apprentice.tasksAssigned} | ${apprentice.tasksCompleted} | ${apprentice.hoursLogged}h | ${apprentice.averageTaskCompletionDays}d | ${apprentice.utilizationRate}% |\n`;
    });
    markdown += `\n`;
  } else {
    markdown += `*No apprentices tracked during this period.*\n\n`;
  }

  // Project Status
  if (data.projectStatus.length > 0) {
    markdown += `## Project Status\n\n`;
    markdown += `| Project | Status | Tasks Total | Tasks Completed | Owner |\n`;
    markdown += `|---------|--------|-------------|-----------------|-------|\n`;
    data.projectStatus.forEach((proj) => {
      const statusEmoji = proj.status === 'completed' ? '✓' : proj.status === 'active' ? '▶' : proj.status === 'paused' ? '⏸' : '✕';
      markdown += `| ${proj.projectTitle} | ${statusEmoji} ${proj.status} | ${proj.tasksTotal} | ${proj.tasksCompleted} | ${proj.owner} |\n`;
    });
    markdown += `\n`;
  }

  // Weekly Highlights
  if (data.weeklyHighlights.length > 0) {
    markdown += `## Highlights\n\n`;
    data.weeklyHighlights.forEach((highlight) => {
      markdown += `${highlight}\n`;
    });
    markdown += `\n`;
  }

  markdown += `---\n\n`;
  markdown += `*Report ID: ${report.id}*\n`;

  return markdown;
}

// Export founder report as markdown file for board pack
export async function exportBoardPack(report: Report): Promise<void> {
  if (report.reportType !== 'founder') {
    throw new Error('Only founder reports can be exported as board packs');
  }

  const markdown = formatFounderReportAsMarkdown(report);
  const filename = `board-pack-${new Date(report.startDate).toISOString().split('T')[0]}-to-${new Date(report.endDate).toISOString().split('T')[0]}.md`;

  // Save to file
  const fileUri = `${FileSystem.documentDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(fileUri, markdown, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  // Share the file
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/markdown',
      dialogTitle: 'Export Board Pack',
      UTI: 'net.daringfireball.markdown',
    });
  } else {
    throw new Error('Sharing is not available on this device');
  }
}

// Export report as CSV (for all report types)
export async function exportReportAsCSV(report: Report): Promise<void> {
  let csvContent = '';
  const filename = `report-${report.reportType}-${new Date(report.startDate).toISOString().split('T')[0]}.csv`;

  if (report.reportType === 'founder') {
    const data = report.data as FounderReportData;

    // Overview section
    csvContent += `Overview\n`;
    csvContent += `Metric,Value\n`;
    csvContent += `Total Tasks,${data.overview.totalTasks}\n`;
    csvContent += `Completed Tasks,${data.overview.completedTasks}\n`;
    csvContent += `Completion Rate,${data.overview.completionRate}%\n`;
    csvContent += `Total Time Logged,${data.overview.totalTimeLogged}h\n`;
    csvContent += `Active Workflow Items,${data.overview.activeWorkflowItems}\n`;
    csvContent += `Completed Workflow Items,${data.overview.completedWorkflowItems}\n`;
    csvContent += `Total Team Members,${data.overview.totalTeamMembers}\n\n`;

    // Financial Metrics
    const financials = CURRENT_FINANCIALS;
    const ratios = calculateFinancialRatios(financials);

    csvContent += `Financial Metrics (${financials.currentMonth})\n`;
    csvContent += `Metric,Value\n`;
    csvContent += `Revenue,£${financials.revenue.total}\n`;
    csvContent += `Revenue Growth,${financials.revenue.growth}%\n`;
    csvContent += `Gross Profit,£${ratios.grossProfit.toFixed(0)}\n`;
    csvContent += `Gross Margin,${ratios.grossMargin.toFixed(1)}%\n`;
    csvContent += `Net Profit,£${ratios.netProfit.toFixed(0)}\n`;
    csvContent += `Net Margin,${ratios.netMargin.toFixed(1)}%\n`;
    csvContent += `COGS,£${financials.cogs.total}\n`;
    csvContent += `Team Costs,£${financials.teamCosts.total}\n`;
    csvContent += `AI Costs,£${financials.aiCosts.total}\n`;
    csvContent += `Other Costs,£${financials.otherCosts.total}\n`;
    csvContent += `Burn Rate,£${financials.burnRate}\n`;
    csvContent += `Cash Balance,£${financials.cashBalance}\n`;
    csvContent += `Runway,${financials.runway.toFixed(1)} months\n\n`;

    csvContent += `Revenue Breakdown\n`;
    csvContent += `Category,Amount\n`;
    csvContent += `Product Sales,£${financials.revenue.breakdown.productSales}\n`;
    csvContent += `Services,£${financials.revenue.breakdown.services}\n`;
    csvContent += `Recurring,£${financials.revenue.breakdown.recurring}\n`;
    csvContent += `Other,£${financials.revenue.breakdown.other}\n\n`;

    csvContent += `Team Headcount\n`;
    csvContent += `Role,Count\n`;
    csvContent += `Founders,${financials.teamCosts.headcount.founders}\n`;
    csvContent += `Fractional Execs,${financials.teamCosts.headcount.fractionalExecs}\n`;
    csvContent += `Apprentices,${financials.teamCosts.headcount.apprentices}\n\n`;

    // Executive Performance
    csvContent += `Executive Performance\n`;
    csvContent += `Executive,Function,Tasks Created,Tasks Completed,Workflow Items Structured,Apprentice Work Verified,Hours Logged\n`;
    data.executivePerformance.forEach((exec) => {
      csvContent += `"${exec.executiveName}",${exec.function},${exec.tasksCreated},${exec.tasksCompleted},${exec.workflowItemsStructured},${exec.apprenticeWorkVerified},${exec.hoursLogged}\n`;
    });
    csvContent += `\n`;

    // Apprentice Utilization
    csvContent += `Apprentice Utilization\n`;
    csvContent += `Apprentice,Function,Tasks Assigned,Tasks Completed,Hours Logged,Avg Completion Days,Utilization Rate\n`;
    data.apprenticeUtilization.forEach((apprentice) => {
      csvContent += `"${apprentice.apprenticeName}",${apprentice.function},${apprentice.tasksAssigned},${apprentice.tasksCompleted},${apprentice.hoursLogged},${apprentice.averageTaskCompletionDays},${apprentice.utilizationRate}%\n`;
    });
  } else if (report.reportType === 'executive') {
    const data = report.data as import('@/types').ExecutiveReportData;

    // Summary
    csvContent += `Executive Summary\n`;
    csvContent += `Metric,Value\n`;
    csvContent += `Executive,${data.executiveName}\n`;
    csvContent += `Function,${data.function}\n`;
    csvContent += `Tasks Created,${data.summary.tasksCreated}\n`;
    csvContent += `Tasks Completed,${data.summary.tasksCompleted}\n`;
    csvContent += `Workflow Items Allocated,${data.summary.workflowItemsAllocated}\n`;
    csvContent += `Workflow Items Structured,${data.summary.workflowItemsStructured}\n`;
    csvContent += `Apprentice Work Verified,${data.summary.apprenticeWorkVerified}\n`;
    csvContent += `Hours Logged,${data.summary.hoursLogged}h\n\n`;

    // Apprentice Performance
    csvContent += `Apprentice Performance\n`;
    csvContent += `Apprentice,Tasks Assigned,Tasks Completed,Hours Logged,Pending Verifications,Avg Completion Time\n`;
    data.apprenticePerformance.forEach((apprentice) => {
      csvContent += `"${apprentice.apprenticeName}",${apprentice.tasksAssigned},${apprentice.tasksCompleted},${apprentice.hoursLogged},${apprentice.pendingVerifications},${apprentice.averageCompletionTime}d\n`;
    });
  } else if (report.reportType === 'apprentice') {
    const data = report.data as import('@/types').ApprenticeReportData;

    // Summary
    csvContent += `Apprentice Summary\n`;
    csvContent += `Metric,Value\n`;
    csvContent += `Apprentice,${data.apprenticeName}\n`;
    csvContent += `Function,${data.function}\n`;
    csvContent += `Tasks Assigned,${data.summary.tasksAssigned}\n`;
    csvContent += `Tasks Completed,${data.summary.tasksCompleted}\n`;
    csvContent += `Tasks In Progress,${data.summary.tasksInProgress}\n`;
    csvContent += `Total Hours Logged,${data.summary.totalHoursLogged}h\n`;
    csvContent += `Verifications Pending,${data.summary.verificationsPending}\n`;
    csvContent += `Verifications Approved,${data.summary.verificationsApproved}\n`;
    csvContent += `Average Task Duration,${data.summary.averageTaskDuration}d\n\n`;

    // Task Details
    csvContent += `Task Details\n`;
    csvContent += `Task,Status,Priority,Hours Logged,Created,Completed,Verified\n`;
    data.taskDetails.forEach((task) => {
      csvContent += `"${task.title}",${task.status},${task.priority},${task.hoursLogged},${task.createdAt},${task.completedAt || 'N/A'},${task.verifiedAt || 'N/A'}\n`;
    });
  }

  // Save to file
  const fileUri = `${FileSystem.documentDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(fileUri, csvContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  // Share the file
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: `Export ${report.reportType} Report`,
      UTI: 'public.comma-separated-values-text',
    });
  } else {
    throw new Error('Sharing is not available on this device');
  }
}

// Export report as JSON (for all report types)
export async function exportReportAsJSON(report: Report): Promise<void> {
  const json = JSON.stringify(report, null, 2);
  const filename = `report-${report.reportType}-${new Date(report.startDate).toISOString().split('T')[0]}.json`;

  // Save to file
  const fileUri = `${FileSystem.documentDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(fileUri, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  // Share the file
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/json',
      dialogTitle: `Export ${report.reportType} Report`,
    });
  } else {
    throw new Error('Sharing is not available on this device');
  }
}
