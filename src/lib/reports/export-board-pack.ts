// Board pack export utilities
// Formats founder reports for easy inclusion in board presentations

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { Report, FounderReportData } from '@/types';

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
