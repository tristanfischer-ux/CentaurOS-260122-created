/**
 * Debug Toast - Shows console logs on screen
 * Temporary debugging tool
 */

import { View, Text, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';

interface LogEntry {
  message: string;
  timestamp: number;
}

let logBuffer: LogEntry[] = [];
let listeners: Set<() => void> = new Set();

// Intercept console.log
const originalLog = console.log;
const originalError = console.error;

console.log = (...args: any[]) => {
  originalLog(...args);
  const message = args.map(arg =>
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(' ');

  logBuffer.push({ message, timestamp: Date.now() });
  if (logBuffer.length > 50) logBuffer.shift();
  listeners.forEach(fn => fn());
};

console.error = (...args: any[]) => {
  originalError(...args);
  const message = '❌ ' + args.map(arg =>
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(' ');

  logBuffer.push({ message, timestamp: Date.now() });
  if (logBuffer.length > 50) logBuffer.shift();
  listeners.forEach(fn => fn());
};

export function DebugToast() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const update = () => setLogs([...logBuffer]);
    listeners.add(update);
    return () => { listeners.delete(update); };
  }, []);

  if (!visible) return null;

  const recentLogs = logs.slice(-10);

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 100,
        left: 10,
        right: 10,
        maxHeight: 300,
        backgroundColor: 'rgba(0,0,0,0.9)',
        borderRadius: 8,
        padding: 8,
        zIndex: 99999,
      }}
    >
      <Text style={{ color: '#fff', fontWeight: 'bold', marginBottom: 4 }}>
        Debug Logs (last 10):
      </Text>
      <ScrollView style={{ maxHeight: 250 }}>
        {recentLogs.map((log, i) => (
          <Text key={i} style={{ color: '#0f0', fontSize: 10, marginBottom: 2 }}>
            {log.message}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}
