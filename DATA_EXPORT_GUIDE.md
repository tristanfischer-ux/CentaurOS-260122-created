# Data Export Architecture
## Phase 4 - CentaurOS

**Date**: 2026-01-13
**Status**: Architecture & Implementation Guide
**Export Formats**: Excel, PDF, CSV

---

## Overview

Data export functionality allows users to download their analytics, reports, benchmarks, and OKRs in multiple formats for offline analysis, presentations, and record-keeping.

---

## Export Types

### 1. Excel (.xlsx)
- Multi-sheet workbooks
- Formatted tables with colors and borders
- Charts and graphs
- Formulas and calculations
- Best for: Detailed analysis, pivot tables, data manipulation

### 2. PDF (.pdf)
- Professional formatted documents
- Charts and visualizations
- Branded headers and footers
- Best for: Presentations, board reports, archiving

### 3. CSV (.csv)
- Raw data tables
- Universal compatibility
- Lightweight file size
- Best for: Data import to other tools, database loading

---

## Technical Implementation

### Required Packages

```bash
# Excel generation
bun add xlsx

# PDF generation
bun add @react-pdf/renderer

# File system and sharing
# Already installed: expo-file-system, expo-sharing
```

### Excel Export Service

```typescript
// src/lib/export/excel-export.ts
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { KPI } from '@/lib/advanced-analytics';
import type { BenchmarkData } from '@/lib/benchmarking';

export interface ExcelExportOptions {
  filename: string;
  sheets: ExcelSheet[];
  author?: string;
  company?: string;
}

export interface ExcelSheet {
  name: string;
  data: any[][];
  headers?: string[];
  columnWidths?: number[];
  formatting?: {
    headerStyle?: CellStyle;
    dataStyle?: CellStyle;
  };
}

export interface CellStyle {
  font?: { bold?: boolean; color?: string; size?: number };
  fill?: { fgColor?: string };
  alignment?: { horizontal?: string; vertical?: string };
  border?: any;
}

export class ExcelExportService {
  static async exportKPIs(kpis: KPI[], filename: string): Promise<void> {
    const headers = ['Metric', 'Value', 'Unit', 'Target', 'Change %', 'Trend', 'Category'];

    const data = kpis.map((kpi) => [
      kpi.name,
      kpi.value,
      kpi.unit,
      kpi.target || 'N/A',
      `${kpi.changePercentage > 0 ? '+' : ''}${kpi.changePercentage.toFixed(1)}%`,
      kpi.trend,
      kpi.category,
    ]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

    // Set column widths
    ws['!cols'] = [
      { wch: 30 }, // Metric
      { wch: 12 }, // Value
      { wch: 8 },  // Unit
      { wch: 12 }, // Target
      { wch: 12 }, // Change
      { wch: 10 }, // Trend
      { wch: 15 }, // Category
    ];

    // Add formatting (basic - requires xlsx-style for advanced)
    const range = XLSX.utils.decode_range(ws['!ref']!);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + '1';
      if (!ws[address]) continue;
      ws[address].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '3B82F6' } },
        alignment: { horizontal: 'center' },
      };
    }

    XLSX.utils.book_append_sheet(wb, ws, 'KPIs');

    // Write to file
    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    const uri = FileSystem.documentDirectory + filename;
    await FileSystem.writeAsStringAsync(uri, wbout, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Share file
    await Sharing.shareAsync(uri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Export KPIs',
      UTI: 'com.microsoft.excel.xlsx',
    });
  }

  static async exportBenchmarks(benchmarks: BenchmarkData[], filename: string): Promise<void> {
    const headers = [
      'Metric',
      'Your Value',
      'Industry Avg',
      'Top 25%',
      'Bottom 25%',
      'Unit',
      'Category',
      'Performance',
    ];

    const data = benchmarks.map((b) => {
      const score = calculatePerformanceScore(b);
      const performance = getPerformanceLevel(score);

      return [
        b.metric,
        b.yourValue,
        b.industryAverage,
        b.topQuartile,
        b.bottomQuartile,
        b.unit,
        b.category,
        `${score} - ${performance.level}`,
      ];
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

    ws['!cols'] = [
      { wch: 30 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 10 },
      { wch: 15 },
      { wch: 20 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Benchmarks');

    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    const uri = FileSystem.documentDirectory + filename;
    await FileSystem.writeAsStringAsync(uri, wbout, {
      encoding: FileSystem.EncodingType.Base64,
    });

    await Sharing.shareAsync(uri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Export Benchmarks',
      UTI: 'com.microsoft.excel.xlsx',
    });
  }

  static async exportMultiSheet(options: ExcelExportOptions): Promise<void> {
    const wb = XLSX.utils.book_new();

    // Set workbook properties
    wb.Props = {
      Title: options.filename,
      Author: options.author || 'CentaurOS',
      Company: options.company || 'Your Company',
      CreatedDate: new Date(),
    };

    // Add each sheet
    options.sheets.forEach((sheet) => {
      const data = sheet.headers
        ? [sheet.headers, ...sheet.data]
        : sheet.data;

      const ws = XLSX.utils.aoa_to_sheet(data);

      // Set column widths if provided
      if (sheet.columnWidths) {
        ws['!cols'] = sheet.columnWidths.map((w) => ({ wch: w }));
      }

      XLSX.utils.book_append_sheet(wb, ws, sheet.name);
    });

    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    const uri = FileSystem.documentDirectory + options.filename;
    await FileSystem.writeAsStringAsync(uri, wbout, {
      encoding: FileSystem.EncodingType.Base64,
    });

    await Sharing.shareAsync(uri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Export Data',
      UTI: 'com.microsoft.excel.xlsx',
    });
  }
}
```

### PDF Export Service

```typescript
// src/lib/export/pdf-export.ts
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, pdf } from '@react-pdf/renderer';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    color: '#1f2937',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 10,
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  table: {
    width: '100%',
    border: '1px solid #e5e7eb',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #e5e7eb',
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
    fontWeight: 'bold',
  },
  tableCell: {
    padding: 8,
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 9,
    color: '#6b7280',
    textAlign: 'center',
  },
});

// PDF Document Components
export const KPIReportPDF = ({ kpis, title, date }: any) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View>
        <Text style={styles.header}>{title || 'KPI Report'}</Text>
        <Text style={{ fontSize: 10, color: '#6b7280', marginBottom: 20 }}>
          Generated on {date || new Date().toLocaleDateString()}
        </Text>
      </View>

      {/* KPI Table */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Performance Indicators</Text>
        <View style={styles.table}>
          {/* Table Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, { flex: 2 }]}>Metric</Text>
            <Text style={styles.tableCell}>Value</Text>
            <Text style={styles.tableCell}>Target</Text>
            <Text style={styles.tableCell}>Change</Text>
            <Text style={styles.tableCell}>Category</Text>
          </View>

          {/* Table Rows */}
          {kpis.map((kpi: any, idx: number) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2 }]}>{kpi.name}</Text>
              <Text style={styles.tableCell}>{kpi.value} {kpi.unit}</Text>
              <Text style={styles.tableCell}>{kpi.target || 'N/A'}</Text>
              <Text style={styles.tableCell}>
                {kpi.changePercentage > 0 ? '+' : ''}{kpi.changePercentage.toFixed(1)}%
              </Text>
              <Text style={styles.tableCell}>{kpi.category}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        Generated by CentaurOS • Confidential
      </Text>
    </Page>
  </Document>
);

export class PDFExportService {
  static async exportKPIReport(kpis: any[], filename: string): Promise<void> {
    const blob = await pdf(
      <KPIReportPDF
        kpis={kpis}
        title="KPI Performance Report"
        date={new Date().toLocaleDateString()}
      />
    ).toBlob();

    // Convert blob to base64 for React Native
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
      const base64data = reader.result?.toString().split(',')[1];
      if (!base64data) return;

      const uri = FileSystem.documentDirectory + filename;
      await FileSystem.writeAsStringAsync(uri, base64data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Export PDF Report',
        UTI: 'com.adobe.pdf',
      });
    };
  }
}

// Note: react-pdf/renderer has limitations in React Native
// For production, consider using backend PDF generation or html-to-pdf
```

### CSV Export Service

```typescript
// src/lib/export/csv-export.ts
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export class CSVExportService {
  static escapeCSV(value: any): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  static arrayToCSV(headers: string[], data: any[][]): string {
    const rows = [headers, ...data];
    return rows.map((row) => row.map(this.escapeCSV).join(',')).join('\n');
  }

  static async exportKPIs(kpis: any[], filename: string): Promise<void> {
    const headers = [
      'Metric',
      'Value',
      'Unit',
      'Target',
      'Previous Value',
      'Change Percentage',
      'Trend',
      'Category',
      'Timeframe',
      'Last Updated',
    ];

    const data = kpis.map((kpi) => [
      kpi.name,
      kpi.value,
      kpi.unit,
      kpi.target || '',
      kpi.previousValue || '',
      kpi.changePercentage,
      kpi.trend,
      kpi.category,
      kpi.timeframe,
      new Date(kpi.lastUpdated).toLocaleDateString(),
    ]);

    const csv = this.arrayToCSV(headers, data);
    const uri = FileSystem.documentDirectory + filename;
    await FileSystem.writeAsStringAsync(uri, csv);

    await Sharing.shareAsync(uri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export CSV',
      UTI: 'public.comma-separated-values-text',
    });
  }

  static async exportBenchmarks(benchmarks: any[], filename: string): Promise<void> {
    const headers = [
      'Metric',
      'Your Value',
      'Industry Average',
      'Top Quartile',
      'Bottom Quartile',
      'Unit',
      'Category',
      'Better When Higher',
    ];

    const data = benchmarks.map((b) => [
      b.metric,
      b.yourValue,
      b.industryAverage,
      b.topQuartile,
      b.bottomQuartile,
      b.unit,
      b.category,
      b.betterWhenHigher ? 'Yes' : 'No',
    ]);

    const csv = this.arrayToCSV(headers, data);
    const uri = FileSystem.documentDirectory + filename;
    await FileSystem.writeAsStringAsync(uri, csv);

    await Sharing.shareAsync(uri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export CSV',
      UTI: 'public.comma-separated-values-text',
    });
  }

  static async exportGeneric(
    headers: string[],
    data: any[][],
    filename: string
  ): Promise<void> {
    const csv = this.arrayToCSV(headers, data);
    const uri = FileSystem.documentDirectory + filename;
    await FileSystem.writeAsStringAsync(uri, csv);

    await Sharing.shareAsync(uri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Data',
      UTI: 'public.comma-separated-values-text',
    });
  }
}
```

---

## Usage Examples

### Export KPIs to Excel

```typescript
import { ExcelExportService } from '@/lib/export/excel-export';
import { getAllKPIs } from '@/lib/advanced-analytics';

const handleExportExcel = async () => {
  const kpis = getAllKPIs();
  await ExcelExportService.exportKPIs(kpis, 'kpis-report.xlsx');
  showToast.success('Exported', 'KPIs exported to Excel');
};
```

### Export Benchmarks to CSV

```typescript
import { CSVExportService } from '@/lib/export/csv-export';
import { BENCHMARK_DATA } from '@/lib/benchmarking';

const handleExportCSV = async () => {
  await CSVExportService.exportBenchmarks(BENCHMARK_DATA, 'benchmarks.csv');
  showToast.success('Exported', 'Benchmarks exported to CSV');
};
```

### Multi-Sheet Excel Export

```typescript
const handleExportComplete = async () => {
  const kpis = getAllKPIs();
  const benchmarks = BENCHMARK_DATA;

  await ExcelExportService.exportMultiSheet({
    filename: 'complete-report.xlsx',
    author: 'CentaurOS',
    company: 'Your Company',
    sheets: [
      {
        name: 'KPIs',
        headers: ['Metric', 'Value', 'Target', 'Trend'],
        data: kpis.map((k) => [k.name, k.value, k.target, k.trend]),
        columnWidths: [30, 12, 12, 10],
      },
      {
        name: 'Benchmarks',
        headers: ['Metric', 'Your Value', 'Industry Avg'],
        data: benchmarks.map((b) => [b.metric, b.yourValue, b.industryAverage]),
        columnWidths: [30, 15, 15],
      },
    ],
  });
};
```

---

## Best Practices

### Performance
- Export in background thread for large datasets
- Show progress indicator for exports >1000 rows
- Limit PDF exports to 10 pages or less (performance)
- Use CSV for very large datasets (>10K rows)

### File Naming
```typescript
const generateFilename = (prefix: string, format: string) => {
  const date = new Date().toISOString().split('T')[0];
  const timestamp = Date.now();
  return `${prefix}-${date}-${timestamp}.${format}`;
};
```

### Error Handling
```typescript
try {
  await ExcelExportService.exportKPIs(kpis, filename);
  showToast.success('Success', 'Data exported successfully');
} catch (error) {
  console.error('Export failed:', error);
  showToast.error('Export Failed', 'Please try again');
}
```

### User Experience
- Show export progress for large files
- Provide format selection modal
- Allow custom date range selection
- Enable scheduled exports (daily/weekly/monthly)

---

## Implementation Timeline

### Week 1: Core Services
- Implement Excel export service
- Implement CSV export service
- Add file sharing functionality
- Basic error handling

### Week 2: PDF & UI
- Implement PDF generation (simplified)
- Create export button components
- Add format selection modal
- Progress indicators

### Week 3: Advanced Features
- Multi-sheet Excel support
- Custom report builder
- Scheduled exports
- Email export option

### Week 4: Polish & Testing
- Test with large datasets
- Optimize performance
- Add export history
- User documentation

---

**Next Steps**: Install xlsx package and implement Excel export service as the primary export format.
