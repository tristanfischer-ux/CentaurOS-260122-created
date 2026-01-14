// PDF export functionality for reports
// Generates professional, board-ready PDF reports with beautiful styling

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { Report, FounderReportData, ExecutiveReportData, ApprenticeReportData } from '@/types';
import { CURRENT_FINANCIALS, calculateFinancialRatios } from '@/lib/financial-seed';

// Generate HTML for PDF with beautiful styling
function generateReportHTML(report: Report, companyName: string, producerName: string): string {
  const reportDate = new Date(report.generatedAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const startDate = new Date(report.startDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const endDate = new Date(report.endDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const periodLabel =
    report.period === 'week'
      ? 'Weekly Report'
      : report.period === 'month'
      ? 'Monthly Report'
      : 'Quarterly Report';

  // Common styles
  const styles = `
    <style>
      @page {
        margin: 40px;
      }
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        color: #1e293b;
        line-height: 1.6;
        font-size: 11px;
      }
      .header {
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 3px solid #3b82f6;
      }
      .company-name {
        font-size: 24px;
        font-weight: 700;
        color: #0f172a;
        margin-bottom: 5px;
      }
      .report-title {
        font-size: 18px;
        font-weight: 600;
        color: #3b82f6;
        margin-bottom: 10px;
      }
      .report-meta {
        font-size: 10px;
        color: #64748b;
      }
      .meta-row {
        display: flex;
        justify-content: space-between;
        margin-top: 5px;
      }
      .section {
        margin-bottom: 25px;
        page-break-inside: avoid;
      }
      .section-title {
        font-size: 16px;
        font-weight: 700;
        color: #0f172a;
        margin-bottom: 12px;
        padding-bottom: 6px;
        border-bottom: 2px solid #e2e8f0;
      }
      .subsection-title {
        font-size: 13px;
        font-weight: 600;
        color: #334155;
        margin: 15px 0 8px 0;
      }
      .metric-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 15px;
        margin: 15px 0;
      }
      .metric-card {
        background: #f8fafc;
        padding: 12px;
        border-radius: 8px;
        border-left: 3px solid #3b82f6;
      }
      .metric-label {
        font-size: 9px;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      }
      .metric-value {
        font-size: 20px;
        font-weight: 700;
        color: #0f172a;
      }
      .metric-trend {
        font-size: 9px;
        color: #10b981;
        margin-top: 2px;
      }
      .metric-trend.negative {
        color: #ef4444;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 10px 0;
        font-size: 10px;
      }
      th {
        background: #f1f5f9;
        padding: 8px;
        text-align: left;
        font-weight: 600;
        color: #475569;
        border-bottom: 2px solid #cbd5e1;
      }
      td {
        padding: 8px;
        border-bottom: 1px solid #e2e8f0;
      }
      .status-badge {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 9px;
        font-weight: 600;
      }
      .status-on-track {
        background: #dcfce7;
        color: #166534;
      }
      .status-at-risk {
        background: #fef3c7;
        color: #92400e;
      }
      .status-off-track {
        background: #fee2e2;
        color: #991b1b;
      }
      .risk-high {
        color: #dc2626;
        font-weight: 600;
      }
      .risk-medium {
        color: #f59e0b;
        font-weight: 600;
      }
      .risk-low {
        color: #10b981;
      }
      .list-item {
        margin: 6px 0;
        padding-left: 15px;
        position: relative;
      }
      .list-item:before {
        content: "•";
        position: absolute;
        left: 0;
        color: #3b82f6;
        font-weight: bold;
      }
      .footer {
        margin-top: 40px;
        padding-top: 15px;
        border-top: 1px solid #e2e8f0;
        text-align: center;
        font-size: 9px;
        color: #94a3b8;
      }
      .page-break {
        page-break-after: always;
      }
    </style>
  `;

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      ${styles}
    </head>
    <body>
      <div class="header">
        <div class="company-name">${companyName}</div>
        <div class="report-title">${periodLabel}</div>
        <div class="report-meta">
          <div class="meta-row">
            <span>Report Period: ${startDate} - ${endDate}</span>
            <span>Generated: ${reportDate}</span>
          </div>
          <div class="meta-row">
            <span>Prepared by: ${producerName}</span>
            <span>Type: ${
              report.reportType === 'founder'
                ? 'Business Overview'
                : report.reportType === 'executive'
                ? 'Executive Dashboard'
                : 'Performance Report'
            }</span>
          </div>
        </div>
      </div>
  `;

  if (report.reportType === 'founder') {
    html += generateFounderReportHTML(report.data as FounderReportData);
  } else if (report.reportType === 'executive') {
    html += generateExecutiveReportHTML(report.data as ExecutiveReportData);
  } else {
    html += generateApprenticeReportHTML(report.data as ApprenticeReportData);
  }

  html += `
      <div class="footer">
        <p>This report was generated using Centaur OS</p>
        <p>Confidential - For Internal Use Only</p>
      </div>
    </body>
    </html>
  `;

  return html;
}

function generateFounderReportHTML(data: FounderReportData): string {
  const financials = CURRENT_FINANCIALS;
  const ratios = calculateFinancialRatios(financials);

  let html = `
    <!-- Executive Summary -->
    <div class="section">
      <h2 class="section-title">Executive Summary</h2>
      <div class="metric-grid">
        <div class="metric-card">
          <div class="metric-label">Total Tasks</div>
          <div class="metric-value">${data.overview.totalTasks}</div>
          <div class="metric-trend">${data.overview.completedTasks} completed</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Completion Rate</div>
          <div class="metric-value">${data.overview.completionRate}%</div>
          ${
            data.previousPeriodData?.completionRate
              ? `<div class="metric-trend ${
                  data.overview.completionRate >= data.previousPeriodData.completionRate ? '' : 'negative'
                }">
              ${
                data.overview.completionRate >= data.previousPeriodData.completionRate ? '+' : ''
              }${(data.overview.completionRate - data.previousPeriodData.completionRate).toFixed(1)}% vs last period
            </div>`
              : ''
          }
        </div>
        <div class="metric-card">
          <div class="metric-label">Team Size</div>
          <div class="metric-value">${data.overview.totalTeamMembers}</div>
          <div class="metric-trend">${data.overview.activeFunctions.length} functions</div>
        </div>
      </div>
    </div>

    <!-- Financial Overview -->
    <div class="section">
      <h2 class="section-title">Financial Overview</h2>
      <div class="metric-grid">
        <div class="metric-card">
          <div class="metric-label">Monthly Revenue</div>
          <div class="metric-value">£${(financials.revenue.total / 1000).toFixed(1)}k</div>
          <div class="metric-trend">${financials.revenue.growth > 0 ? '+' : ''}${financials.revenue.growth}% growth</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Gross Profit</div>
          <div class="metric-value">£${(ratios.grossProfit / 1000).toFixed(1)}k</div>
          <div class="metric-trend">${ratios.grossMargin.toFixed(1)}% margin</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Runway</div>
          <div class="metric-value">${financials.runway.toFixed(1)}mo</div>
          <div class="metric-trend">£${(financials.burnRate / 1000).toFixed(1)}k burn</div>
        </div>
      </div>

      <h3 class="subsection-title">Revenue Breakdown</h3>
      <table>
        <tr>
          <th>Category</th>
          <th style="text-align: right;">Amount</th>
          <th style="text-align: right;">Percentage</th>
        </tr>
        <tr>
          <td>Product Sales</td>
          <td style="text-align: right;">£${(financials.revenue.breakdown.productSales / 1000).toFixed(1)}k</td>
          <td style="text-align: right;">${((financials.revenue.breakdown.productSales / financials.revenue.total) * 100).toFixed(1)}%</td>
        </tr>
        <tr>
          <td>Services</td>
          <td style="text-align: right;">£${(financials.revenue.breakdown.services / 1000).toFixed(1)}k</td>
          <td style="text-align: right;">${((financials.revenue.breakdown.services / financials.revenue.total) * 100).toFixed(1)}%</td>
        </tr>
        <tr>
          <td>Recurring</td>
          <td style="text-align: right;">£${(financials.revenue.breakdown.recurring / 1000).toFixed(1)}k</td>
          <td style="text-align: right;">${((financials.revenue.breakdown.recurring / 1000) * 100).toFixed(1)}%</td>
        </tr>
      </table>
    </div>

    <div class="page-break"></div>

    <!-- OKR Progress -->
    ${
      data.okrProgress.length > 0
        ? `
    <div class="section">
      <h2 class="section-title">Objectives & Key Results</h2>
      <table>
        <tr>
          <th>Objective</th>
          <th style="text-align: center;">Progress</th>
          <th style="text-align: center;">Key Results</th>
          <th style="text-align: center;">Health</th>
        </tr>
        ${data.okrProgress
          .map(
            (okr) => `
          <tr>
            <td>${okr.objectiveTitle}</td>
            <td style="text-align: center;">${okr.progress}%</td>
            <td style="text-align: center;">${okr.keyResultsCount}</td>
            <td style="text-align: center;">
              <span class="status-badge status-${okr.healthStatus.replace('_', '-')}">${okr.healthStatus.replace('_', ' ')}</span>
            </td>
          </tr>
        `
          )
          .join('')}
      </table>
    </div>
    `
        : ''
    }

    <!-- Executive Performance -->
    ${
      data.executivePerformance.length > 0
        ? `
    <div class="section">
      <h2 class="section-title">Executive Performance</h2>
      <table>
        <tr>
          <th>Executive</th>
          <th>Function</th>
          <th style="text-align: right;">Tasks Created</th>
          <th style="text-align: right;">Tasks Completed</th>
          <th style="text-align: right;">Hours Logged</th>
        </tr>
        ${data.executivePerformance
          .map(
            (exec) => `
          <tr>
            <td>${exec.executiveName}</td>
            <td>${exec.function}</td>
            <td style="text-align: right;">${exec.tasksCreated}</td>
            <td style="text-align: right;">${exec.tasksCompleted}</td>
            <td style="text-align: right;">${exec.hoursLogged}h</td>
          </tr>
        `
          )
          .join('')}
      </table>
    </div>
    `
        : ''
    }

    <!-- Risks & Recommendations -->
    ${
      data.risks.length > 0
        ? `
    <div class="section">
      <h2 class="section-title">Risks & Alerts</h2>
      ${
        data.risks.filter((r) => r.severity === 'high').length > 0
          ? `
        <h3 class="subsection-title">High Priority</h3>
        ${data.risks
          .filter((r) => r.severity === 'high')
          .map(
            (risk) => `
          <div class="list-item risk-high">${risk.message} [${risk.affectedArea}]</div>
        `
          )
          .join('')}
      `
          : ''
      }
      ${
        data.risks.filter((r) => r.severity === 'medium').length > 0
          ? `
        <h3 class="subsection-title">Medium Priority</h3>
        ${data.risks
          .filter((r) => r.severity === 'medium')
          .map(
            (risk) => `
          <div class="list-item risk-medium">${risk.message} [${risk.affectedArea}]</div>
        `
          )
          .join('')}
      `
          : ''
      }
    </div>
    `
        : ''
    }
  `;

  return html;
}

function generateExecutiveReportHTML(data: ExecutiveReportData): string {
  let html = `
    <!-- Summary -->
    <div class="section">
      <h2 class="section-title">Executive Summary - ${data.function}</h2>
      <div class="metric-grid">
        <div class="metric-card">
          <div class="metric-label">Tasks Created</div>
          <div class="metric-value">${data.summary.tasksCreated}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Tasks Completed</div>
          <div class="metric-value">${data.summary.tasksCompleted}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Hours Logged</div>
          <div class="metric-value">${data.summary.hoursLogged}h</div>
        </div>
      </div>
    </div>

    <!-- Apprentice Performance -->
    ${
      data.apprenticePerformance.length > 0
        ? `
    <div class="section">
      <h2 class="section-title">Team Performance</h2>
      <table>
        <tr>
          <th>Apprentice</th>
          <th style="text-align: right;">Assigned</th>
          <th style="text-align: right;">Completed</th>
          <th style="text-align: right;">Hours</th>
          <th style="text-align: right;">Avg. Completion Time</th>
        </tr>
        ${data.apprenticePerformance
          .map(
            (app) => `
          <tr>
            <td>${app.apprenticeName}</td>
            <td style="text-align: right;">${app.tasksAssigned}</td>
            <td style="text-align: right;">${app.tasksCompleted}</td>
            <td style="text-align: right;">${app.hoursLogged}h</td>
            <td style="text-align: right;">${app.averageCompletionTime.toFixed(1)} days</td>
          </tr>
        `
          )
          .join('')}
      </table>
    </div>
    `
        : ''
    }
  `;

  return html;
}

function generateApprenticeReportHTML(data: ApprenticeReportData): string {
  let html = `
    <!-- Summary -->
    <div class="section">
      <h2 class="section-title">Performance Summary - ${data.function}</h2>
      <div class="metric-grid">
        <div class="metric-card">
          <div class="metric-label">Tasks Assigned</div>
          <div class="metric-value">${data.summary.tasksAssigned}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Tasks Completed</div>
          <div class="metric-value">${data.summary.tasksCompleted}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Total Hours</div>
          <div class="metric-value">${data.summary.totalHoursLogged}h</div>
        </div>
      </div>
    </div>

    <!-- Task Details -->
    ${
      data.taskDetails.length > 0
        ? `
    <div class="section">
      <h2 class="section-title">Recent Tasks</h2>
      <table>
        <tr>
          <th>Task</th>
          <th style="text-align: center;">Status</th>
          <th style="text-align: center;">Priority</th>
          <th style="text-align: right;">Hours</th>
        </tr>
        ${data.taskDetails
          .slice(0, 10)
          .map(
            (task) => `
          <tr>
            <td>${task.title}</td>
            <td style="text-align: center;">${task.status.replace('_', ' ')}</td>
            <td style="text-align: center;">${task.priority}</td>
            <td style="text-align: right;">${task.hoursLogged}h</td>
          </tr>
        `
          )
          .join('')}
      </table>
    </div>
    `
        : ''
    }

    <!-- Achievements -->
    ${
      data.achievements.length > 0
        ? `
    <div class="section">
      <h2 class="section-title">Achievements</h2>
      ${data.achievements.map((achievement) => `<div class="list-item">${achievement}</div>`).join('')}
    </div>
    `
        : ''
    }
  `;

  return html;
}

/**
 * Export report as PDF using expo-print
 */
export async function exportReportAsPDF(
  report: Report,
  companyName: string,
  producerName: string
): Promise<void> {
  try {
    const html = generateReportHTML(report, companyName, producerName);

    // Generate PDF using expo-print
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    // Share the PDF
    if (uri) {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Report',
          UTI: 'com.adobe.pdf',
        });
      } else {
        // Fallback: just print the PDF if sharing is not available
        await Print.printAsync({ uri });
      }
    }
  } catch (error) {
    console.error('Failed to export PDF:', error);
    throw error;
  }
}
