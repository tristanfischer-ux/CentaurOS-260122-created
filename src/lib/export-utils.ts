import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// Export all workspace data as JSON
export async function exportWorkspaceData(workspaceId: string): Promise<string> {
  try {
    // Gather all data from AsyncStorage
    const keys = await AsyncStorage.getAllKeys();
    const stores = await AsyncStorage.multiGet(keys);

    const workspaceData: Record<string, any> = {};

    stores.forEach(([key, value]) => {
      if (value) {
        try {
          const parsed = JSON.parse(value);
          // Filter by workspaceId if the data has it
          if (parsed.state) {
            workspaceData[key] = parsed.state;
          } else {
            workspaceData[key] = parsed;
          }
        } catch {
          workspaceData[key] = value;
        }
      }
    });

    return JSON.stringify(workspaceData, null, 2);
  } catch (error) {
    console.error('Export failed:', error);
    throw new Error('Failed to export data');
  }
}

// Export to CSV for specific data types
export function exportToCSV(data: any[], columns: string[]): string {
  const headers = columns.join(',');
  const rows = data.map((item) => {
    return columns
      .map((col) => {
        const value = item[col];
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      })
      .join(',');
  });

  return [headers, ...rows].join('\n');
}

// Save export to device and share
export async function saveAndShareExport(
  content: string,
  filename: string,
  format: 'json' | 'csv'
): Promise<void> {
  try {
    const fileUri = `${FileSystem.documentDirectory}${filename}.${format}`;
    await FileSystem.writeAsStringAsync(fileUri, content);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: format === 'json' ? 'application/json' : 'text/csv',
        dialogTitle: `Export ${filename}`,
      });
    } else {
      throw new Error('Sharing is not available on this device');
    }
  } catch (error) {
    console.error('Save and share failed:', error);
    throw new Error('Failed to save and share export');
  }
}

// Create backup of all data
export async function createBackup(): Promise<string> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const stores = await AsyncStorage.multiGet(keys);

    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: Object.fromEntries(stores.map(([key, value]) => [key, value])),
    };

    return JSON.stringify(backup, null, 2);
  } catch (error) {
    console.error('Backup failed:', error);
    throw new Error('Failed to create backup');
  }
}

// Restore from backup
export async function restoreFromBackup(backupJson: string): Promise<void> {
  try {
    const backup = JSON.parse(backupJson);

    if (!backup.data) {
      throw new Error('Invalid backup format');
    }

    // Clear existing data
    await AsyncStorage.clear();

    // Restore data
    const entries = Object.entries(backup.data) as [string, string][];
    await AsyncStorage.multiSet(entries);
  } catch (error) {
    console.error('Restore failed:', error);
    throw new Error('Failed to restore from backup');
  }
}
