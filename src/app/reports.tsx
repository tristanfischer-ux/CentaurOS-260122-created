// Reports screen with role-based views
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { FileText, Download, TrendingUp, Users, Target, AlertTriangle } from 'lucide-react-native';
import { useAppStore } from '@/lib/state/app-store';
import { generateReport } from '@/lib/reports/generator';
import { exportBoardPack, exportReportAsCSV, exportReportAsJSON } from '@/lib/reports/export-board-pack';
import type { Report, ReportPeriod, FounderReportData, ExecutiveReportData, ApprenticeReportData } from '@/types';
import { cn } from '@/lib/cn';

export default function ReportsScreen() {
  const params = useLocalSearchParams<{ period?: string; export?: string }>();

  // Use selectors that return stable references
  const currentUser = useAppStore((s) => s.currentUser);
  const currentWorkspace = useAppStore((s) => s.currentWorkspace);
  const currentMembership = useAppStore((s) => s.currentMembership);
  const userId = currentUser?.id;
  const role = currentMembership?.role;

  const initialPeriod = (params.period as ReportPeriod) || 'week';
  const [period, setPeriod] = useState<ReportPeriod>(initialPeriod);
  const [generatedReport, setGeneratedReport] = useState<Report | null>(null);

  // Update period when params change
  useEffect(() => {
    if (params.period) {
      setPeriod(params.period as ReportPeriod);
    }
  }, [params.period]);

  const generateReportMutation = useMutation({
    mutationFn: async (periodOverride?: ReportPeriod) => {
      if (!currentWorkspace || !userId || !role) {
        throw new Error('Missing required data');
      }

      // Get fresh data from store at mutation time
      const store = useAppStore.getState();
      const tasks = Object.values(store.tasks);
      const timeEntries = Object.values(store.timeEntries);
      const objectives = Object.values(store.objectives);
      const keyResults = Object.values(store.keyResults);
      const projects = Object.values(store.projects);
      const reviews = Object.values(store.reviews);
      const users = store.users;
      const memberships = Object.values(store.memberships);

      const reportType = role === 'Founder' ? 'founder' : role === 'FractionalExec' ? 'executive' : 'apprentice';
      const effectivePeriod = periodOverride || period;

      return await generateReport(
        reportType,
        currentWorkspace.id,
        userId,
        role,
        effectivePeriod,
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

  // Auto-generate report when coming from home screen or when period changes
  useEffect(() => {
    if (params.period && currentWorkspace && userId && role) {
      // Auto-generate after a short delay to allow UI to settle
      const timer = setTimeout(() => {
        generateReportMutation.mutate(params.period as ReportPeriod);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [params.period, currentWorkspace?.id, userId, role]); // Re-run when params or context changes

  // Auto-export board pack if requested
  useEffect(() => {
    if (params.export === 'boardpack' && generatedReport && role === 'Founder') {
      const timer = setTimeout(() => {
        exportBoardPackMutation.mutate();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [generatedReport, params.export, role]);

  return (
    <View className="flex-1 bg-slate-950">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="px-6 pt-6 pb-5">
          <Text className="text-white text-3xl font-bold mb-2">
            {role === 'Founder' && 'Business Overview'}
            {role === 'FractionalExec' && 'Executive Dashboard'}
            {role === 'Apprentice' && 'Performance Report'}
          </Text>
          <Text className="text-slate-400 text-base">
            {role === 'Founder' && 'Comprehensive insights across all functions'}
            {role === 'FractionalExec' && 'Function performance and team analytics'}
            {role === 'Apprentice' && 'Your work summary and achievements'}
          </Text>
        </View>

        {/* Period Selector */}
        <View className="px-6 pb-6">
          <Text className="text-white font-semibold text-sm uppercase tracking-wider mb-3 text-slate-400">Report Period</Text>
          <View className="flex-row gap-2">
            {periods.map((p) => (
              <Pressable
                key={p.value}
                onPress={() => setPeriod(p.value)}
                className={cn(
                  'flex-1 py-3.5 px-4 rounded-xl',
                  period === p.value
                    ? 'bg-blue-500'
                    : 'bg-slate-900'
                )}
              >
                <Text
                  className={cn(
                    'text-center font-semibold text-sm',
                    period === p.value ? 'text-white' : 'text-slate-400'
                  )}
                >
                  {p.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Generate Button */}
        <View className="px-6 pb-6">
          <Pressable
            onPress={() => generateReportMutation.mutate(period)}
            disabled={generateReportMutation.isPending}
            className={cn(
              'py-4 rounded-xl items-center flex-row justify-center shadow-lg',
              generateReportMutation.isPending ? 'bg-slate-800' : 'bg-blue-500'
            )}
          >
            {generateReportMutation.isPending ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text className="text-white font-bold ml-3 text-base">Generating...</Text>
              </>
            ) : (
              <>
                <FileText size={20} color="#fff" />
                <Text className="text-white font-bold ml-3 text-base">Generate Report</Text>
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
            <View className="px-6 pt-4 pb-6">
              <Text className="text-white font-bold text-lg mb-4">Export Options</Text>
              <View className="gap-3">
                {role === 'Founder' && (
                  <Pressable
                    onPress={() => exportBoardPackMutation.mutate()}
                    disabled={exportBoardPackMutation.isPending}
                    className="bg-gradient-to-r from-emerald-600 to-emerald-500 py-4 rounded-xl flex-row items-center justify-center active:opacity-80"
                    style={{ backgroundColor: '#10b981' }}
                  >
                    {exportBoardPackMutation.isPending ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Download size={20} color="#fff" />
                        <Text className="text-white font-bold ml-3">Export Board Pack</Text>
                      </>
                    )}
                  </Pressable>
                )}

                <Pressable
                  onPress={() => exportCSVMutation.mutate()}
                  disabled={exportCSVMutation.isPending}
                  className="bg-slate-800 py-4 rounded-xl flex-row items-center justify-center active:opacity-80"
                >
                  {exportCSVMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Download size={20} color="#94a3b8" />
                      <Text className="text-slate-200 font-bold ml-3">Export as CSV</Text>
                    </>
                  )}
                </Pressable>

                <Pressable
                  onPress={() => exportJSONMutation.mutate()}
                  disabled={exportJSONMutation.isPending}
                  className="bg-slate-800 py-4 rounded-xl flex-row items-center justify-center active:opacity-80"
                >
                  {exportJSONMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Download size={20} color="#94a3b8" />
                      <Text className="text-slate-200 font-bold ml-3">Export as JSON</Text>
                    </>
                  )}
                </Pressable>
              </View>
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
    <View className="px-6 pt-2 pb-4 gap-6">
      {/* Overview Cards */}
      <View>
        <Text className="text-white font-bold text-xl mb-4">Key Metrics</Text>
        <View className="gap-3">
          <View className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 p-5 rounded-2xl border border-blue-500/20">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <View className="flex-row items-center mb-2">
                  <Target size={20} color="#3b82f6" />
                  <Text className="text-slate-400 text-sm ml-2 font-medium">Task Completion</Text>
                </View>
                <Text className="text-white text-3xl font-bold">{data.overview.completionRate}%</Text>
                <Text className="text-slate-500 text-sm mt-1">
                  {data.overview.completedTasks} of {data.overview.totalTasks} tasks completed
                </Text>
              </View>
            </View>
          </View>

          <View className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 p-5 rounded-2xl border border-emerald-500/20">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <View className="flex-row items-center mb-2">
                  <TrendingUp size={20} color="#10b981" />
                  <Text className="text-slate-400 text-sm ml-2 font-medium">Time Tracked</Text>
                </View>
                <Text className="text-white text-3xl font-bold">{data.overview.totalTimeLogged}h</Text>
                <Text className="text-slate-500 text-sm mt-1">
                  Across {data.overview.totalTeamMembers} team members
                </Text>
              </View>
            </View>
          </View>

          <View className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 p-5 rounded-2xl border border-amber-500/20">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <View className="flex-row items-center mb-2">
                  <Users size={20} color="#f59e0b" />
                  <Text className="text-slate-400 text-sm ml-2 font-medium">Workflow Items</Text>
                </View>
                <Text className="text-white text-3xl font-bold">{data.overview.completedWorkflowItems}</Text>
                <Text className="text-slate-500 text-sm mt-1">
                  {data.overview.activeWorkflowItems} items in progress
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Risks */}
      {data.risks.length > 0 && (
        <View>
          <Text className="text-white font-bold text-xl mb-4">Risks & Alerts</Text>
          <View className="gap-3">
            {data.risks.map((risk, idx) => (
              <View
                key={idx}
                className={cn(
                  'p-4 rounded-xl flex-row items-start',
                  risk.severity === 'high' && 'bg-red-500/10 border border-red-500/30',
                  risk.severity === 'medium' && 'bg-amber-500/10 border border-amber-500/30',
                  risk.severity === 'low' && 'bg-slate-800/50 border border-slate-700'
                )}
              >
                <AlertTriangle
                  size={20}
                  color={risk.severity === 'high' ? '#ef4444' : risk.severity === 'medium' ? '#f59e0b' : '#94a3b8'}
                />
                <View className="flex-1 ml-3">
                  <Text className="text-white font-medium mb-1">{risk.message}</Text>
                  <Text className="text-slate-400 text-xs">{risk.affectedArea}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* OKR Progress */}
      {data.okrProgress.length > 0 && (
        <View>
          <Text className="text-white font-bold text-xl mb-4">OKR Progress</Text>
          <View className="gap-3">
            {data.okrProgress.map((okr) => (
              <View key={okr.objectiveId} className="bg-slate-900 p-5 rounded-xl border border-slate-800">
                <View className="flex-row items-start justify-between mb-3">
                  <Text className="text-white font-semibold text-base flex-1">{okr.objectiveTitle}</Text>
                  <View
                    className={cn(
                      'px-3 py-1.5 rounded-full ml-3',
                      okr.healthStatus === 'on_track' && 'bg-emerald-500/20',
                      okr.healthStatus === 'at_risk' && 'bg-amber-500/20',
                      okr.healthStatus === 'off_track' && 'bg-red-500/20'
                    )}
                  >
                    <Text
                      className={cn(
                        'text-xs font-bold uppercase',
                        okr.healthStatus === 'on_track' && 'text-emerald-400',
                        okr.healthStatus === 'at_risk' && 'text-amber-400',
                        okr.healthStatus === 'off_track' && 'text-red-400'
                      )}
                    >
                      {okr.healthStatus.replace('_', ' ')}
                    </Text>
                  </View>
                </View>
                <View className="bg-slate-800 rounded-full h-3 overflow-hidden">
                  <View
                    className={cn(
                      'h-full rounded-full',
                      okr.healthStatus === 'on_track' && 'bg-emerald-500',
                      okr.healthStatus === 'at_risk' && 'bg-amber-500',
                      okr.healthStatus === 'off_track' && 'bg-red-500'
                    )}
                    style={{ width: `${okr.progress}%` }}
                  />
                </View>
                <Text className="text-slate-400 text-sm mt-2 font-medium">{okr.progress}% complete</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Executive Performance */}
      {data.executivePerformance.length > 0 && (
        <View>
          <Text className="text-white font-bold text-xl mb-4">Executive Performance</Text>
          <View className="gap-3">
            {data.executivePerformance.map((exec) => (
              <View key={exec.executiveId} className="bg-slate-900 p-5 rounded-xl border border-slate-800">
                <View className="flex-row items-start justify-between mb-4">
                  <View className="flex-1">
                    <Text className="text-white font-semibold text-base">{exec.executiveName}</Text>
                    <Text className="text-slate-400 text-sm mt-1">{exec.function}</Text>
                  </View>
                  <View className="bg-blue-500/20 px-3 py-2 rounded-lg">
                    <Text className="text-blue-400 font-bold text-lg">{exec.hoursLogged}h</Text>
                  </View>
                </View>
                <View className="flex-row justify-between pt-3 border-t border-slate-800">
                  <View className="items-center">
                    <Text className="text-slate-500 text-xs mb-1">Tasks</Text>
                    <Text className="text-white font-semibold text-base">{exec.tasksCompleted}/{exec.tasksCreated}</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-slate-500 text-xs mb-1">Structured</Text>
                    <Text className="text-white font-semibold text-base">{exec.workflowItemsStructured}</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-slate-500 text-xs mb-1">Verified</Text>
                    <Text className="text-white font-semibold text-base">{exec.apprenticeWorkVerified}</Text>
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
          <Text className="text-white font-bold text-xl mb-4">Apprentice Utilization</Text>
          <View className="gap-3">
            {data.apprenticeUtilization.map((apprentice) => (
              <View key={apprentice.apprenticeId} className="bg-slate-900 p-5 rounded-xl border border-slate-800">
                <View className="flex-row items-start justify-between mb-4">
                  <View className="flex-1">
                    <Text className="text-white font-semibold text-base">{apprentice.apprenticeName}</Text>
                    <Text className="text-slate-400 text-sm mt-1">{apprentice.function}</Text>
                  </View>
                  <View className="bg-emerald-500/20 px-3 py-2 rounded-lg">
                    <Text className="text-emerald-400 font-bold text-lg">{apprentice.utilizationRate}%</Text>
                  </View>
                </View>
                <View className="flex-row justify-between pt-3 border-t border-slate-800">
                  <View className="items-center">
                    <Text className="text-slate-500 text-xs mb-1">Tasks</Text>
                    <Text className="text-white font-semibold text-base">{apprentice.tasksCompleted}/{apprentice.tasksAssigned}</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-slate-500 text-xs mb-1">Hours</Text>
                    <Text className="text-white font-semibold text-base">{apprentice.hoursLogged}h</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-slate-500 text-xs mb-1">Avg Days</Text>
                    <Text className="text-white font-semibold text-base">{apprentice.averageTaskCompletionDays}d</Text>
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
    <View className="px-6 pt-2 pb-4 gap-6">
      <View>
        <Text className="text-white font-bold text-xl mb-4">Performance Summary</Text>
        <View className="bg-slate-900 p-5 rounded-xl border border-slate-800">
          <View className="mb-4 pb-4 border-b border-slate-800">
            <Text className="text-slate-400 text-sm mb-1">Function</Text>
            <Text className="text-white font-semibold text-lg">{data.function}</Text>
          </View>

          <View className="gap-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-slate-400 font-medium">Tasks Created</Text>
              <Text className="text-white font-bold text-lg">{data.summary.tasksCreated}</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-slate-400 font-medium">Tasks Completed</Text>
              <Text className="text-emerald-400 font-bold text-lg">{data.summary.tasksCompleted}</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-slate-400 font-medium">Workflow Items Structured</Text>
              <Text className="text-white font-bold text-lg">{data.summary.workflowItemsStructured}</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-slate-400 font-medium">Work Verified</Text>
              <Text className="text-white font-bold text-lg">{data.summary.apprenticeWorkVerified}</Text>
            </View>

            <View className="mt-3 pt-3 border-t border-slate-800">
              <View className="flex-row justify-between items-center">
                <Text className="text-slate-400 font-medium">Total Hours Logged</Text>
                <View className="bg-blue-500/20 px-4 py-2 rounded-lg">
                  <Text className="text-blue-400 font-bold text-xl">{data.summary.hoursLogged}h</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>

      {data.apprenticePerformance.length > 0 && (
        <View>
          <Text className="text-white font-bold text-xl mb-4">Team Performance</Text>
          <View className="gap-3">
            {data.apprenticePerformance.map((apprentice) => (
              <View key={apprentice.apprenticeId} className="bg-slate-900 p-5 rounded-xl border border-slate-800">
                <Text className="text-white font-semibold text-base mb-4">{apprentice.apprenticeName}</Text>
                <View className="flex-row justify-between">
                  <View className="items-center flex-1">
                    <Text className="text-slate-500 text-xs mb-1.5">Tasks</Text>
                    <Text className="text-white font-bold text-lg">{apprentice.tasksCompleted}/{apprentice.tasksAssigned}</Text>
                  </View>
                  <View className="items-center flex-1">
                    <Text className="text-slate-500 text-xs mb-1.5">Hours</Text>
                    <Text className="text-white font-bold text-lg">{apprentice.hoursLogged}h</Text>
                  </View>
                  <View className="items-center flex-1">
                    <Text className="text-slate-500 text-xs mb-1.5">Pending</Text>
                    <Text className="text-amber-400 font-bold text-lg">{apprentice.pendingVerifications}</Text>
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
    <View className="px-6 pt-2 pb-4 gap-6">
      <View>
        <Text className="text-white font-bold text-xl mb-4">Your Performance</Text>
        <View className="bg-slate-900 p-5 rounded-xl border border-slate-800">
          <View className="mb-4 pb-4 border-b border-slate-800">
            <Text className="text-slate-400 text-sm mb-1">Function</Text>
            <Text className="text-white font-semibold text-lg">{data.function}</Text>
          </View>

          <View className="gap-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-slate-400 font-medium">Tasks Assigned</Text>
              <Text className="text-white font-bold text-lg">{data.summary.tasksAssigned}</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-slate-400 font-medium">Tasks Completed</Text>
              <Text className="text-emerald-400 font-bold text-lg">{data.summary.tasksCompleted}</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-slate-400 font-medium">In Progress</Text>
              <Text className="text-blue-400 font-bold text-lg">{data.summary.tasksInProgress}</Text>
            </View>

            <View className="mt-3 pt-3 border-t border-slate-800">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-slate-400 font-medium">Total Hours</Text>
                <View className="bg-blue-500/20 px-4 py-2 rounded-lg">
                  <Text className="text-blue-400 font-bold text-xl">{data.summary.totalHoursLogged}h</Text>
                </View>
              </View>
            </View>

            <View className="flex-row justify-between items-center">
              <Text className="text-slate-400 font-medium">Pending Review</Text>
              <Text className="text-amber-400 font-bold text-lg">{data.summary.verificationsPending}</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-slate-400 font-medium">Approved</Text>
              <Text className="text-emerald-400 font-bold text-lg">{data.summary.verificationsApproved}</Text>
            </View>
          </View>
        </View>
      </View>

      {data.achievements.length > 0 && (
        <View>
          <Text className="text-white font-bold text-xl mb-4">Achievements</Text>
          <View className="gap-2">
            {data.achievements.map((achievement, idx) => (
              <View key={idx} className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex-row items-center">
                <View className="w-6 h-6 bg-emerald-500/20 rounded-full items-center justify-center mr-3">
                  <Text className="text-emerald-400 font-bold">✓</Text>
                </View>
                <Text className="text-emerald-400 font-medium flex-1">{achievement}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {data.taskDetails.length > 0 && (
        <View>
          <Text className="text-white font-bold text-xl mb-4">Recent Tasks</Text>
          <View className="gap-3">
            {data.taskDetails.slice(0, 5).map((task) => (
              <View key={task.taskId} className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <View className="flex-row items-start justify-between mb-2">
                  <Text className="text-white font-medium text-base flex-1 mr-3">{task.title}</Text>
                  <View
                    className={cn(
                      'px-3 py-1.5 rounded-full',
                      task.status === 'done' && 'bg-emerald-500/20',
                      task.status === 'in_progress' && 'bg-blue-500/20',
                      task.status === 'in_review' && 'bg-amber-500/20'
                    )}
                  >
                    <Text
                      className={cn(
                        'text-xs font-bold uppercase',
                        task.status === 'done' && 'text-emerald-400',
                        task.status === 'in_progress' && 'text-blue-400',
                        task.status === 'in_review' && 'text-amber-400'
                      )}
                    >
                      {task.status.replace('_', ' ')}
                    </Text>
                  </View>
                </View>
                {task.hoursLogged > 0 && (
                  <View className="mt-2 pt-2 border-t border-slate-800">
                    <Text className="text-slate-400 text-sm">
                      <Text className="font-semibold text-blue-400">{task.hoursLogged}h</Text> logged
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
