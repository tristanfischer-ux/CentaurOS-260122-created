// Reports screen with role-based views
import { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { FileText, Download, Calendar, TrendingUp, Users, Target, AlertTriangle } from 'lucide-react-native';
import { useAppStore } from '@/lib/state/app-store';
import { generateReport } from '@/lib/reports/generator';
import { exportBoardPack, exportReportAsCSV, exportReportAsJSON } from '@/lib/reports/export-board-pack';
import type { Report, ReportPeriod, FounderReportData, ExecutiveReportData, ApprenticeReportData } from '@/types';
import { cn } from '@/lib/cn';

export default function ReportsScreen() {
  const currentUser = useAppStore((s) => s.currentUser);
  const currentWorkspace = useAppStore((s) => s.currentWorkspace);
  const currentMembership = useAppStore((s) => s.currentMembership);

  const [period, setPeriod] = useState<ReportPeriod>('week');
  const [generatedReport, setGeneratedReport] = useState<Report | null>(null);

  const tasks = useAppStore((s) => Object.values(s.tasks));
  const timeEntries = useAppStore((s) => Object.values(s.timeEntries));
  const objectives = useAppStore((s) => Object.values(s.objectives));
  const keyResults = useAppStore((s) => Object.values(s.keyResults));
  const projects = useAppStore((s) => Object.values(s.projects));
  const reviews = useAppStore((s) => Object.values(s.reviews));
  const users = useAppStore((s) => s.users);
  const memberships = useAppStore((s) => Object.values(s.memberships));

  const userId = currentUser?.id;
  const role = currentMembership?.role;

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      if (!currentWorkspace || !userId || !role) {
        throw new Error('Missing required data');
      }

      const reportType = role === 'Founder' ? 'founder' : role === 'FractionalExec' ? 'executive' : 'apprentice';

      return await generateReport(
        reportType,
        currentWorkspace.id,
        userId,
        role,
        period,
        undefined,
        undefined,
        {
          tasks,
          timeEntries,
          objectives,
          keyResults,
          projects,
          workflowItems: [], // Empty for now - will be added when workflow items are implemented
          reviews,
          users,
          memberships,
        }
      );
    },
    onSuccess: (report) => {
      setGeneratedReport(report);
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message);
    },
  });

  const exportBoardPackMutation = useMutation({
    mutationFn: async () => {
      if (!generatedReport) throw new Error('No report to export');
      await exportBoardPack(generatedReport);
    },
    onSuccess: () => {
      Alert.alert('Success', 'Board pack exported successfully');
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message);
    },
  });

  const exportCSVMutation = useMutation({
    mutationFn: async () => {
      if (!generatedReport) throw new Error('No report to export');
      await exportReportAsCSV(generatedReport);
    },
    onSuccess: () => {
      Alert.alert('Success', 'CSV exported successfully');
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message);
    },
  });

  const exportJSONMutation = useMutation({
    mutationFn: async () => {
      if (!generatedReport) throw new Error('No report to export');
      await exportReportAsJSON(generatedReport);
    },
    onSuccess: () => {
      Alert.alert('Success', 'JSON exported successfully');
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message);
    },
  });

  const periods: { value: ReportPeriod; label: string }[] = [
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
    { value: 'quarter', label: 'Last 90 Days' },
  ];

  return (
    <View className="flex-1 bg-zinc-950">
      <Stack.Screen
        options={{
          title: 'Reports',
          headerStyle: { backgroundColor: '#09090b' },
          headerTintColor: '#fff',
        }}
      />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="p-6 border-b border-zinc-800">
          <View className="flex-row items-center mb-2">
            <FileText size={24} color="#fff" />
            <Text className="text-2xl font-bold text-white ml-3">
              {role === 'Founder' && 'Business Overview'}
              {role === 'FractionalExec' && 'Executive Performance'}
              {role === 'Apprentice' && 'My Work Summary'}
            </Text>
          </View>
          <Text className="text-zinc-400 text-sm">
            {role === 'Founder' && 'Board-ready reports across all functions'}
            {role === 'FractionalExec' && 'Your function performance and team metrics'}
            {role === 'Apprentice' && 'Track your completed work and time'}
          </Text>
        </View>

        {/* Period Selector */}
        <View className="p-6 border-b border-zinc-800">
          <Text className="text-white font-semibold mb-3">Report Period</Text>
          <View className="flex-row gap-3">
            {periods.map((p) => (
              <Pressable
                key={p.value}
                onPress={() => setPeriod(p.value)}
                className={cn(
                  'flex-1 py-3 px-4 rounded-xl border',
                  period === p.value
                    ? 'bg-blue-600 border-blue-500'
                    : 'bg-zinc-900 border-zinc-700'
                )}
              >
                <Text
                  className={cn(
                    'text-center font-medium',
                    period === p.value ? 'text-white' : 'text-zinc-400'
                  )}
                >
                  {p.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Generate Button */}
        <View className="p-6">
          <Pressable
            onPress={() => generateReportMutation.mutate()}
            disabled={generateReportMutation.isPending}
            className={cn(
              'py-4 rounded-xl items-center flex-row justify-center',
              generateReportMutation.isPending ? 'bg-zinc-700' : 'bg-blue-600'
            )}
          >
            {generateReportMutation.isPending ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text className="text-white font-semibold ml-3">Generating Report...</Text>
              </>
            ) : (
              <>
                <Calendar size={20} color="#fff" />
                <Text className="text-white font-semibold ml-3">Generate Report</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Report Display */}
        {generatedReport && (
          <>
            {role === 'Founder' && <FounderReportView report={generatedReport} />}
            {role === 'FractionalExec' && <ExecutiveReportView report={generatedReport} />}
            {role === 'Apprentice' && <ApprenticeReportView report={generatedReport} />}

            {/* Export Actions */}
            <View className="p-6 gap-3">
              <Text className="text-white font-semibold mb-2">Export Options</Text>

              {role === 'Founder' && (
                <Pressable
                  onPress={() => exportBoardPackMutation.mutate()}
                  disabled={exportBoardPackMutation.isPending}
                  className="bg-emerald-600 py-4 rounded-xl flex-row items-center justify-center"
                >
                  {exportBoardPackMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Download size={20} color="#fff" />
                      <Text className="text-white font-semibold ml-3">Export Board Pack (.md)</Text>
                    </>
                  )}
                </Pressable>
              )}

              <Pressable
                onPress={() => exportCSVMutation.mutate()}
                disabled={exportCSVMutation.isPending}
                className="bg-zinc-800 py-4 rounded-xl flex-row items-center justify-center border border-zinc-700"
              >
                {exportCSVMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Download size={20} color="#fff" />
                    <Text className="text-white font-semibold ml-3">Export CSV</Text>
                  </>
                )}
              </Pressable>

              <Pressable
                onPress={() => exportJSONMutation.mutate()}
                disabled={exportJSONMutation.isPending}
                className="bg-zinc-800 py-4 rounded-xl flex-row items-center justify-center border border-zinc-700"
              >
                {exportJSONMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Download size={20} color="#fff" />
                    <Text className="text-white font-semibold ml-3">Export JSON</Text>
                  </>
                )}
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// Founder Report View Component
function FounderReportView({ report }: { report: Report }) {
  const data = report.data as FounderReportData;

  return (
    <View className="p-6 gap-6">
      {/* Overview Cards */}
      <View>
        <Text className="text-white font-semibold text-lg mb-4">Overview</Text>
        <View className="gap-3">
          <View className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-zinc-400 text-sm">Task Completion Rate</Text>
                <Text className="text-white text-2xl font-bold mt-1">{data.overview.completionRate}%</Text>
                <Text className="text-zinc-500 text-xs mt-1">
                  {data.overview.completedTasks} of {data.overview.totalTasks} tasks
                </Text>
              </View>
              <Target size={32} color="#3b82f6" />
            </View>
          </View>

          <View className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-zinc-400 text-sm">Total Time Logged</Text>
                <Text className="text-white text-2xl font-bold mt-1">{data.overview.totalTimeLogged}h</Text>
                <Text className="text-zinc-500 text-xs mt-1">Across {data.overview.totalTeamMembers} team members</Text>
              </View>
              <TrendingUp size={32} color="#10b981" />
            </View>
          </View>

          <View className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-zinc-400 text-sm">Workflow Progress</Text>
                <Text className="text-white text-2xl font-bold mt-1">{data.overview.completedWorkflowItems}</Text>
                <Text className="text-zinc-500 text-xs mt-1">
                  {data.overview.activeWorkflowItems} items in progress
                </Text>
              </View>
              <Users size={32} color="#f59e0b" />
            </View>
          </View>
        </View>
      </View>

      {/* Risks */}
      {data.risks.length > 0 && (
        <View>
          <Text className="text-white font-semibold text-lg mb-4">Risks & Alerts</Text>
          <View className="gap-2">
            {data.risks.map((risk, idx) => (
              <View
                key={idx}
                className={cn(
                  'p-4 rounded-xl border flex-row items-start',
                  risk.severity === 'high' && 'bg-red-950/30 border-red-900',
                  risk.severity === 'medium' && 'bg-yellow-950/30 border-yellow-900',
                  risk.severity === 'low' && 'bg-zinc-900 border-zinc-800'
                )}
              >
                <AlertTriangle
                  size={20}
                  color={risk.severity === 'high' ? '#ef4444' : risk.severity === 'medium' ? '#f59e0b' : '#71717a'}
                />
                <View className="flex-1 ml-3">
                  <Text className="text-white text-sm">{risk.message}</Text>
                  <Text className="text-zinc-500 text-xs mt-1">{risk.affectedArea}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* OKR Progress */}
      {data.okrProgress.length > 0 && (
        <View>
          <Text className="text-white font-semibold text-lg mb-4">OKR Progress</Text>
          <View className="gap-3">
            {data.okrProgress.map((okr) => (
              <View key={okr.objectiveId} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                <Text className="text-white font-medium">{okr.objectiveTitle}</Text>
                <View className="flex-row items-center justify-between mt-3">
                  <Text className="text-zinc-400 text-sm">{okr.progress}% complete</Text>
                  <View
                    className={cn(
                      'px-3 py-1 rounded-full',
                      okr.healthStatus === 'on_track' && 'bg-emerald-950',
                      okr.healthStatus === 'at_risk' && 'bg-yellow-950',
                      okr.healthStatus === 'off_track' && 'bg-red-950'
                    )}
                  >
                    <Text
                      className={cn(
                        'text-xs font-medium',
                        okr.healthStatus === 'on_track' && 'text-emerald-400',
                        okr.healthStatus === 'at_risk' && 'text-yellow-400',
                        okr.healthStatus === 'off_track' && 'text-red-400'
                      )}
                    >
                      {okr.healthStatus.replace('_', ' ')}
                    </Text>
                  </View>
                </View>
                <View className="bg-zinc-800 rounded-full h-2 mt-3 overflow-hidden">
                  <View
                    className={cn(
                      'h-full rounded-full',
                      okr.healthStatus === 'on_track' && 'bg-emerald-500',
                      okr.healthStatus === 'at_risk' && 'bg-yellow-500',
                      okr.healthStatus === 'off_track' && 'bg-red-500'
                    )}
                    style={{ width: `${okr.progress}%` }}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Executive Performance */}
      {data.executivePerformance.length > 0 && (
        <View>
          <Text className="text-white font-semibold text-lg mb-4">Executive Performance</Text>
          <View className="gap-3">
            {data.executivePerformance.map((exec) => (
              <View key={exec.executiveId} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                <View className="flex-row items-center justify-between mb-3">
                  <View>
                    <Text className="text-white font-medium">{exec.executiveName}</Text>
                    <Text className="text-zinc-400 text-sm">{exec.function}</Text>
                  </View>
                  <Text className="text-blue-400 font-semibold">{exec.hoursLogged}h</Text>
                </View>
                <View className="flex-row justify-between">
                  <View>
                    <Text className="text-zinc-500 text-xs">Tasks</Text>
                    <Text className="text-white font-medium">{exec.tasksCompleted}/{exec.tasksCreated}</Text>
                  </View>
                  <View>
                    <Text className="text-zinc-500 text-xs">Workflow Items</Text>
                    <Text className="text-white font-medium">{exec.workflowItemsStructured}</Text>
                  </View>
                  <View>
                    <Text className="text-zinc-500 text-xs">Verified</Text>
                    <Text className="text-white font-medium">{exec.apprenticeWorkVerified}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Apprentice Utilization */}
      {data.apprenticeUtilization.length > 0 && (
        <View>
          <Text className="text-white font-semibold text-lg mb-4">Apprentice Utilization</Text>
          <View className="gap-3">
            {data.apprenticeUtilization.map((apprentice) => (
              <View key={apprentice.apprenticeId} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                <View className="flex-row items-center justify-between mb-3">
                  <View>
                    <Text className="text-white font-medium">{apprentice.apprenticeName}</Text>
                    <Text className="text-zinc-400 text-sm">{apprentice.function}</Text>
                  </View>
                  <Text className="text-emerald-400 font-semibold">{apprentice.utilizationRate}%</Text>
                </View>
                <View className="flex-row justify-between">
                  <View>
                    <Text className="text-zinc-500 text-xs">Tasks</Text>
                    <Text className="text-white font-medium">{apprentice.tasksCompleted}/{apprentice.tasksAssigned}</Text>
                  </View>
                  <View>
                    <Text className="text-zinc-500 text-xs">Hours</Text>
                    <Text className="text-white font-medium">{apprentice.hoursLogged}h</Text>
                  </View>
                  <View>
                    <Text className="text-zinc-500 text-xs">Avg Time</Text>
                    <Text className="text-white font-medium">{apprentice.averageTaskCompletionDays}d</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// Executive Report View Component
function ExecutiveReportView({ report }: { report: Report }) {
  const data = report.data as ExecutiveReportData;

  return (
    <View className="p-6 gap-6">
      <View>
        <Text className="text-white font-semibold text-lg mb-4">Your Summary</Text>
        <View className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 gap-3">
          <View className="flex-row justify-between">
            <Text className="text-zinc-400">Function</Text>
            <Text className="text-white font-medium">{data.function}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-zinc-400">Tasks Created</Text>
            <Text className="text-white font-medium">{data.summary.tasksCreated}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-zinc-400">Tasks Completed</Text>
            <Text className="text-white font-medium">{data.summary.tasksCompleted}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-zinc-400">Workflow Items Structured</Text>
            <Text className="text-white font-medium">{data.summary.workflowItemsStructured}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-zinc-400">Apprentice Work Verified</Text>
            <Text className="text-white font-medium">{data.summary.apprenticeWorkVerified}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-zinc-400">Hours Logged</Text>
            <Text className="text-emerald-400 font-bold">{data.summary.hoursLogged}h</Text>
          </View>
        </View>
      </View>

      {data.apprenticePerformance.length > 0 && (
        <View>
          <Text className="text-white font-semibold text-lg mb-4">Apprentice Performance</Text>
          <View className="gap-3">
            {data.apprenticePerformance.map((apprentice) => (
              <View key={apprentice.apprenticeId} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                <Text className="text-white font-medium mb-3">{apprentice.apprenticeName}</Text>
                <View className="flex-row justify-between">
                  <View>
                    <Text className="text-zinc-500 text-xs">Tasks</Text>
                    <Text className="text-white font-medium">{apprentice.tasksCompleted}/{apprentice.tasksAssigned}</Text>
                  </View>
                  <View>
                    <Text className="text-zinc-500 text-xs">Hours</Text>
                    <Text className="text-white font-medium">{apprentice.hoursLogged}h</Text>
                  </View>
                  <View>
                    <Text className="text-zinc-500 text-xs">Pending</Text>
                    <Text className="text-yellow-400 font-medium">{apprentice.pendingVerifications}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// Apprentice Report View Component
function ApprenticeReportView({ report }: { report: Report }) {
  const data = report.data as ApprenticeReportData;

  return (
    <View className="p-6 gap-6">
      <View>
        <Text className="text-white font-semibold text-lg mb-4">Your Summary</Text>
        <View className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 gap-3">
          <View className="flex-row justify-between">
            <Text className="text-zinc-400">Function</Text>
            <Text className="text-white font-medium">{data.function}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-zinc-400">Tasks Assigned</Text>
            <Text className="text-white font-medium">{data.summary.tasksAssigned}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-zinc-400">Tasks Completed</Text>
            <Text className="text-emerald-400 font-bold">{data.summary.tasksCompleted}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-zinc-400">Tasks In Progress</Text>
            <Text className="text-blue-400 font-medium">{data.summary.tasksInProgress}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-zinc-400">Total Hours Logged</Text>
            <Text className="text-white font-bold">{data.summary.totalHoursLogged}h</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-zinc-400">Verifications Pending</Text>
            <Text className="text-yellow-400 font-medium">{data.summary.verificationsPending}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-zinc-400">Verifications Approved</Text>
            <Text className="text-emerald-400 font-medium">{data.summary.verificationsApproved}</Text>
          </View>
        </View>
      </View>

      {data.achievements.length > 0 && (
        <View>
          <Text className="text-white font-semibold text-lg mb-4">Achievements</Text>
          <View className="gap-2">
            {data.achievements.map((achievement, idx) => (
              <View key={idx} className="bg-emerald-950/30 border border-emerald-900 p-3 rounded-xl">
                <Text className="text-emerald-400">✓ {achievement}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {data.taskDetails.length > 0 && (
        <View>
          <Text className="text-white font-semibold text-lg mb-4">Recent Tasks</Text>
          <View className="gap-2">
            {data.taskDetails.slice(0, 5).map((task) => (
              <View key={task.taskId} className="bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                <View className="flex-row items-center justify-between">
                  <Text className="text-white text-sm flex-1">{task.title}</Text>
                  <View
                    className={cn(
                      'px-2 py-1 rounded',
                      task.status === 'done' && 'bg-emerald-950',
                      task.status === 'in_progress' && 'bg-blue-950',
                      task.status === 'in_review' && 'bg-yellow-950'
                    )}
                  >
                    <Text
                      className={cn(
                        'text-xs',
                        task.status === 'done' && 'text-emerald-400',
                        task.status === 'in_progress' && 'text-blue-400',
                        task.status === 'in_review' && 'text-yellow-400'
                      )}
                    >
                      {task.status}
                    </Text>
                  </View>
                </View>
                {task.hoursLogged > 0 && (
                  <Text className="text-zinc-500 text-xs mt-2">{task.hoursLogged}h logged</Text>
                )}
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
