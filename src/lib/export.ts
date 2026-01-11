// Export utility for generating CSV/JSON exports

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { Objective, KeyResult, Task, Review } from '@/types';

export async function exportToCSV(data: any[], filename: string): Promise<void> {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  // Get all unique keys from the data
  const keys = Array.from(
    new Set(data.flatMap((item) => Object.keys(item)))
  );

  // Create CSV header
  const header = keys.join(',');

  // Create CSV rows
  const rows = data.map((item) =>
    keys
      .map((key) => {
        const value = item[key];
        if (value === null || value === undefined) return '';
        // Escape commas and quotes in values
        const stringValue = String(value).replace(/"/g, '""');
        return `"${stringValue}"`;
      })
      .join(',')
  );

  // Combine header and rows
  const csv = [header, ...rows].join('\n');

  // Save to file
  const fileUri = `${FileSystem.documentDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(fileUri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  // Share the file
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: `Export ${filename}`,
      UTI: 'public.comma-separated-values-text',
    });
  } else {
    throw new Error('Sharing is not available on this device');
  }
}

export async function exportToJSON(data: any, filename: string): Promise<void> {
  const json = JSON.stringify(data, null, 2);

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
      dialogTitle: `Export ${filename}`,
    });
  } else {
    throw new Error('Sharing is not available on this device');
  }
}

// Format OKRs for export
export function formatOKRsForExport(objectives: Objective[], keyResults: KeyResult[]) {
  return objectives.map((obj) => {
    const objKRs = keyResults.filter((kr) => kr.objectiveId === obj.id);
    return {
      objective: obj.title,
      description: obj.description || '',
      status: obj.status,
      startDate: obj.startDate,
      endDate: obj.endDate,
      keyResults: objKRs.length,
      progress:
        objKRs.length > 0
          ? Math.round(
              (objKRs.reduce((sum, kr) => sum + (kr.currentValue / kr.targetValue) * 100, 0) /
                objKRs.length)
            )
          : 0,
      keyResultsDetail: objKRs.map((kr) => ({
        title: kr.title,
        current: kr.currentValue,
        target: kr.targetValue,
        unit: kr.unit,
        health: kr.healthStatus,
      })),
    };
  });
}

// Format Tasks for export
export function formatTasksForExport(tasks: Task[], users: Record<string, any>) {
  return tasks.map((task) => ({
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
    function: task.function,
    assignee: task.assigneeId ? users[task.assigneeId]?.name || 'Unknown' : 'Unassigned',
    dueDate: task.dueDate || '',
    createdAt: task.createdAt,
    completedAt: task.completedAt || '',
  }));
}

// Format Reviews for export
export function formatReviewsForExport(reviews: Review[], tasks: Record<string, Task>, users: Record<string, any>) {
  return reviews.map((review) => ({
    task: tasks[review.taskId]?.title || 'Unknown Task',
    reviewer: users[review.reviewerId]?.name || 'Unknown',
    status: review.status,
    notes: review.notes || '',
    requestedAt: review.requestedAt,
    reviewedAt: review.reviewedAt || '',
  }));
}
