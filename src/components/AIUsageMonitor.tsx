/**
 * AI Usage Monitor Component
 *
 * Displays current AI API usage stats and budget information
 * Can be added to settings or admin screens
 */

import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useAIGuardrails } from '@/lib/ai-guardrails';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Shield } from 'lucide-react-native';

export function AIUsageMonitor() {
  const { report, stats, loading, refresh, resetCircuitBreaker } = useAIGuardrails();

  if (loading) {
    return (
      <View className="p-4 bg-white dark:bg-zinc-900 rounded-xl">
        <ActivityIndicator />
      </View>
    );
  }

  if (!report) {
    return null;
  }

  const getStatusColor = () => {
    switch (report.status) {
      case 'ok': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      case 'blocked': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = () => {
    switch (report.status) {
      case 'ok': return <CheckCircle size={20} color="#10b981" />;
      case 'warning': return <AlertTriangle size={20} color="#f59e0b" />;
      case 'critical': return <AlertTriangle size={20} color="#ef4444" />;
      case 'blocked': return <XCircle size={20} color="#dc2626" />;
      default: return <Shield size={20} color="#6b7280" />;
    }
  };

  const getStatusLabel = () => {
    switch (report.status) {
      case 'ok': return 'Normal';
      case 'warning': return 'Approaching limit';
      case 'critical': return 'Near limit';
      case 'blocked': return 'Blocked';
      default: return 'Unknown';
    }
  };

  return (
    <View className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <View className="flex-row items-center gap-2">
          <Shield size={18} color="#6b7280" />
          <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            AI Usage
          </Text>
        </View>
        <Pressable onPress={refresh} className="p-2 -mr-2">
          <RefreshCw size={16} color="#6b7280" />
        </Pressable>
      </View>

      {/* Status Banner */}
      <View
        className="flex-row items-center gap-2 px-4 py-2"
        style={{ backgroundColor: getStatusColor() + '15' }}
      >
        {getStatusIcon()}
        <Text style={{ color: getStatusColor() }} className="font-medium">
          {getStatusLabel()}
        </Text>
      </View>

      {/* Today's Usage */}
      <View className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
        <Text className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
          Today
        </Text>
        <View className="flex-row justify-between mb-2">
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">Spent</Text>
          <Text className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {report.today.cost} / {report.limits.daily}
          </Text>
        </View>
        {/* Progress bar */}
        <View className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{
              width: `${Math.min(report.today.budgetPercent, 100)}%`,
              backgroundColor: report.today.budgetPercent > 80 ? '#ef4444' :
                               report.today.budgetPercent > 50 ? '#f59e0b' : '#10b981'
            }}
          />
        </View>
        <View className="flex-row justify-between mt-2">
          <Text className="text-xs text-zinc-500 dark:text-zinc-400">
            {report.today.requests} requests
          </Text>
          <Text className="text-xs text-zinc-500 dark:text-zinc-400">
            {(report.today.tokens / 1000).toFixed(1)}K tokens
          </Text>
        </View>
      </View>

      {/* This Month */}
      <View className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
        <Text className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
          This Month
        </Text>
        <View className="flex-row justify-between mb-2">
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">Spent</Text>
          <Text className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {report.month.cost} / {report.limits.monthly}
          </Text>
        </View>
        {/* Progress bar */}
        <View className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{
              width: `${Math.min(report.month.budgetPercent, 100)}%`,
              backgroundColor: report.month.budgetPercent > 80 ? '#ef4444' :
                               report.month.budgetPercent > 50 ? '#f59e0b' : '#10b981'
            }}
          />
        </View>
        <View className="flex-row justify-between mt-2">
          <Text className="text-xs text-zinc-500 dark:text-zinc-400">
            {report.month.requests} requests
          </Text>
          <Text className="text-xs text-zinc-500 dark:text-zinc-400">
            {(report.month.tokens / 1000).toFixed(1)}K tokens
          </Text>
        </View>
      </View>

      {/* Circuit Breaker Status */}
      {stats?.circuitBreakerTripped && (
        <View className="px-4 py-3 bg-red-50 dark:bg-red-900/20">
          <View className="flex-row items-center gap-2 mb-2">
            <XCircle size={16} color="#dc2626" />
            <Text className="text-sm font-medium text-red-700 dark:text-red-400">
              Circuit Breaker Active
            </Text>
          </View>
          <Text className="text-xs text-red-600 dark:text-red-400 mb-2">
            AI calls are paused due to unusual cost spike.
            {stats.circuitBreakerResetTime && (
              ` Resets in ${Math.ceil((stats.circuitBreakerResetTime - Date.now()) / 60000)} minutes.`
            )}
          </Text>
          <Pressable
            onPress={resetCircuitBreaker}
            className="bg-red-600 px-3 py-2 rounded-lg"
          >
            <Text className="text-white text-sm font-medium text-center">
              Reset Circuit Breaker
            </Text>
          </Pressable>
        </View>
      )}

      {/* Alerts */}
      {stats && stats.alerts.length > 0 && (
        <View className="px-4 py-3">
          <Text className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
            Alerts
          </Text>
          {stats.alerts.slice(0, 3).map((alert) => (
            <View
              key={alert.id}
              className="flex-row items-center gap-2 py-1"
            >
              <AlertTriangle size={14} color="#f59e0b" />
              <Text className="text-xs text-zinc-600 dark:text-zinc-400 flex-1">
                {alert.message}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

/**
 * Compact version for status bars
 */
export function AIUsageIndicator() {
  const { report, loading } = useAIGuardrails();

  if (loading || !report) {
    return null;
  }

  const getColor = () => {
    switch (report.status) {
      case 'ok': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      case 'blocked': return '#dc2626';
      default: return '#6b7280';
    }
  };

  return (
    <View className="flex-row items-center gap-1">
      <View
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: getColor() }}
      />
      <Text className="text-xs text-zinc-500 dark:text-zinc-400">
        {report.today.cost}
      </Text>
    </View>
  );
}
