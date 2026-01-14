// Elite Consulting-Grade Reports Screen
// Frameworks: McKinsey, BCG, Bain, Deloitte, Accenture, EY, PwC, KPMG, Oliver Wyman,
// Roland Berger, Mercer, Korn Ferry, Charles River Associates, Aon

import { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import {
  FileText, Download, TrendingUp, TrendingDown, Users, Target, AlertTriangle,
  Lightbulb, CheckCircle, Info, BarChart3, PieChart, Activity, Shield,
  Briefcase, Settings2, Factory, DollarSign, UserCheck, Workflow,
  ChevronRight, Award, Zap, Brain, Building2, LineChart, Gauge
} from 'lucide-react-native';
import { useAppStore } from '@/lib/state/app-store';
import { generateReport } from '@/lib/reports/generator';
import { exportBoardPack, exportReportAsCSV, exportReportAsJSON } from '@/lib/reports/export-board-pack';
import { exportReportAsPDF } from '@/lib/reports/export-pdf';
import type { Report, ReportPeriod, FounderReportData, ExecutiveReportData, ApprenticeReportData } from '@/types';
import { cn } from '@/lib/cn';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Dashboard view types for the consulting modules
type DashboardView = 'overview' | 'strategy' | 'operations' | 'finance' | 'talent' | 'process';

// Consulting Firm Badges
const FIRM_BADGES: Record<string, { name: string; color: string }> = {
  mckinsey: { name: 'McKinsey', color: '#1a365d' },
  bcg: { name: 'BCG', color: '#00843d' },
  bain: { name: 'Bain', color: '#cc0000' },
  deloitte: { name: 'Deloitte', color: '#86bc25' },
  accenture: { name: 'Accenture', color: '#a100ff' },
  ey: { name: 'EY', color: '#ffe600' },
  pwc: { name: 'PwC', color: '#dc6900' },
  kpmg: { name: 'KPMG', color: '#00338d' },
  mercer: { name: 'Mercer', color: '#005eb8' },
  kornferry: { name: 'Korn Ferry', color: '#e31837' },
};

export default function ReportsScreen() {
  const params = useLocalSearchParams<{ period?: string; export?: string }>();

  const currentUser = useAppStore((s) => s.currentUser);
  const currentWorkspace = useAppStore((s) => s.currentWorkspace);
  const currentMembership = useAppStore((s) => s.currentMembership);
  const userId = currentUser?.id;
  const role = currentMembership?.role;

  const initialPeriod = (params.period as ReportPeriod) || 'week';
  const [period, setPeriod] = useState<ReportPeriod>(initialPeriod);
  const [generatedReport, setGeneratedReport] = useState<Report | null>(null);
  const [activeView, setActiveView] = useState<DashboardView>('overview');

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
          workflowItems: [],
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
    onSuccess: () => Alert.alert('Success', 'Board pack exported successfully'),
    onError: (error: Error) => Alert.alert('Error', error.message),
  });

  const exportCSVMutation = useMutation({
    mutationFn: async () => {
      if (!generatedReport) throw new Error('No report to export');
      await exportReportAsCSV(generatedReport);
    },
    onSuccess: () => Alert.alert('Success', 'CSV exported successfully'),
    onError: (error: Error) => Alert.alert('Error', error.message),
  });

  const exportJSONMutation = useMutation({
    mutationFn: async () => {
      if (!generatedReport) throw new Error('No report to export');
      await exportReportAsJSON(generatedReport);
    },
    onSuccess: () => Alert.alert('Success', 'JSON exported successfully'),
    onError: (error: Error) => Alert.alert('Error', error.message),
  });

  const exportPDFMutation = useMutation({
    mutationFn: async () => {
      if (!generatedReport || !currentWorkspace || !currentUser) {
        throw new Error('No report to export or missing data');
      }
      await exportReportAsPDF(generatedReport, currentWorkspace.name, currentUser.name);
    },
    onSuccess: () => Alert.alert('Success', 'PDF exported successfully'),
    onError: (error: Error) => Alert.alert('Error', error.message),
  });

  const periods: { value: ReportPeriod; label: string }[] = [
    { value: 'week', label: '7 Days' },
    { value: 'month', label: '30 Days' },
    { value: 'quarter', label: '90 Days' },
  ];

  useEffect(() => {
    if (params.period && currentWorkspace && userId && role) {
      const timer = setTimeout(() => {
        generateReportMutation.mutate(params.period as ReportPeriod);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [params.period, currentWorkspace?.id, userId, role]);

  useEffect(() => {
    if (params.export === 'boardpack' && generatedReport && role === 'Founder') {
      const timer = setTimeout(() => {
        exportBoardPackMutation.mutate();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [generatedReport, params.export, role]);

  // Dashboard navigation for founders
  const dashboardViews: { id: DashboardView; label: string; icon: any; color: string }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3, color: '#3b82f6' },
    { id: 'strategy', label: 'Strategy', icon: Target, color: '#8b5cf6' },
    { id: 'operations', label: 'Operations', icon: Activity, color: '#10b981' },
    { id: 'finance', label: 'Finance', icon: DollarSign, color: '#f59e0b' },
    { id: 'talent', label: 'Talent', icon: Users, color: '#ec4899' },
    { id: 'process', label: 'Process', icon: Workflow, color: '#06b6d4' },
  ];

  return (
    <View className="flex-1 bg-slate-950">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View className="px-5 pt-4 pb-4">
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <Text className="text-white text-2xl font-bold mb-1">
              {role === 'Founder' && 'Consulting Dashboard'}
              {role === 'FractionalExec' && 'Executive Dashboard'}
              {role === 'Apprentice' && 'Performance Report'}
            </Text>
            <Text className="text-slate-400 text-sm">
              {role === 'Founder' && 'Elite insights from McKinsey, BCG, Bain, Deloitte, and more'}
              {role === 'FractionalExec' && 'Function performance and team analytics'}
              {role === 'Apprentice' && 'Your work summary and achievements'}
            </Text>
          </Animated.View>
        </View>

        {/* Period Selector */}
        <Animated.View entering={FadeInDown.delay(200).springify()} className="px-5 pb-4">
          <View className="flex-row bg-slate-900 rounded-xl p-1">
            {periods.map((p) => (
              <Pressable
                key={p.value}
                onPress={() => setPeriod(p.value)}
                className={cn(
                  'flex-1 py-2.5 rounded-lg',
                  period === p.value ? 'bg-blue-500' : ''
                )}
              >
                <Text className={cn(
                  'text-center font-semibold text-sm',
                  period === p.value ? 'text-white' : 'text-slate-400'
                )}>
                  {p.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Generate Button */}
        <Animated.View entering={FadeInDown.delay(300).springify()} className="px-5 pb-4">
          <Pressable
            onPress={() => generateReportMutation.mutate(period)}
            disabled={generateReportMutation.isPending}
            className={cn(
              'py-3.5 rounded-xl items-center flex-row justify-center',
              generateReportMutation.isPending ? 'bg-slate-800' : 'bg-blue-500'
            )}
          >
            {generateReportMutation.isPending ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text className="text-white font-bold ml-2">Analyzing...</Text>
              </>
            ) : (
              <>
                <Brain size={18} color="#fff" />
                <Text className="text-white font-bold ml-2">Generate Analysis</Text>
              </>
            )}
          </Pressable>
        </Animated.View>

        {/* Dashboard Navigation - Only for Founders */}
        {generatedReport && role === 'Founder' && (
          <Animated.View entering={FadeInDown.delay(400).springify()} className="px-5 pb-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
              <View className="flex-row gap-2">
                {dashboardViews.map((view) => {
                  const Icon = view.icon;
                  const isActive = activeView === view.id;
                  return (
                    <Pressable
                      key={view.id}
                      onPress={() => setActiveView(view.id)}
                      className={cn(
                        'px-4 py-2.5 rounded-xl flex-row items-center',
                        isActive ? 'bg-slate-800 border border-slate-700' : 'bg-slate-900/50'
                      )}
                    >
                      <Icon size={16} color={isActive ? view.color : '#64748b'} />
                      <Text className={cn(
                        'ml-2 font-medium text-sm',
                        isActive ? 'text-white' : 'text-slate-500'
                      )}>
                        {view.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </Animated.View>
        )}

        {/* Report Display */}
        {generatedReport && (
          <>
            {role === 'Founder' && (
              <FounderConsultingDashboard
                report={generatedReport}
                activeView={activeView}
              />
            )}
            {role === 'FractionalExec' && <ExecutiveReportView report={generatedReport} />}
            {role === 'Apprentice' && <ApprenticeReportView report={generatedReport} />}

            {/* Export Actions */}
            <Animated.View entering={FadeInUp.delay(600).springify()} className="px-5 pt-4 pb-4">
              <Text className="text-white font-bold text-lg mb-3">Export Options</Text>
              <View className="gap-2">
                <Pressable
                  onPress={() => exportPDFMutation.mutate()}
                  disabled={exportPDFMutation.isPending}
                  className="bg-blue-500 py-3.5 rounded-xl flex-row items-center justify-center"
                >
                  {exportPDFMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <FileText size={18} color="#fff" />
                      <Text className="text-white font-bold ml-2">Export as PDF</Text>
                    </>
                  )}
                </Pressable>

                {role === 'Founder' && (
                  <Pressable
                    onPress={() => exportBoardPackMutation.mutate()}
                    disabled={exportBoardPackMutation.isPending}
                    className="bg-emerald-500 py-3.5 rounded-xl flex-row items-center justify-center"
                  >
                    {exportBoardPackMutation.isPending ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Download size={18} color="#fff" />
                        <Text className="text-white font-bold ml-2">Export Board Pack</Text>
                      </>
                    )}
                  </Pressable>
                )}

                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => exportCSVMutation.mutate()}
                    disabled={exportCSVMutation.isPending}
                    className="flex-1 bg-slate-800 py-3.5 rounded-xl flex-row items-center justify-center"
                  >
                    <Download size={16} color="#94a3b8" />
                    <Text className="text-slate-200 font-semibold ml-2 text-sm">CSV</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => exportJSONMutation.mutate()}
                    disabled={exportJSONMutation.isPending}
                    className="flex-1 bg-slate-800 py-3.5 rounded-xl flex-row items-center justify-center"
                  >
                    <Download size={16} color="#94a3b8" />
                    <Text className="text-slate-200 font-semibold ml-2 text-sm">JSON</Text>
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ===========================================================================
// FOUNDER CONSULTING DASHBOARD
// ===========================================================================

function FounderConsultingDashboard({ report, activeView }: { report: Report; activeView: DashboardView }) {
  const data = report.data as FounderReportData;

  switch (activeView) {
    case 'overview':
      return <OverviewDashboard data={data} />;
    case 'strategy':
      return <StrategyDashboard data={data} />;
    case 'operations':
      return <OperationsDashboard data={data} />;
    case 'finance':
      return <FinanceDashboard data={data} />;
    case 'talent':
      return <TalentDashboard data={data} />;
    case 'process':
      return <ProcessDashboard data={data} />;
    default:
      return <OverviewDashboard data={data} />;
  }
}

// ===========================================================================
// OVERVIEW DASHBOARD
// ===========================================================================

function OverviewDashboard({ data }: { data: FounderReportData }) {
  const consultingAnalysis = data.consultingAnalysis;
  const integratedScore = consultingAnalysis?.integratedScore ?? 0;

  return (
    <View className="px-5 gap-4">
      {/* Integrated Consulting Score */}
      <Animated.View entering={FadeIn.delay(100)}>
        <View className={cn(
          'p-5 rounded-2xl border-2',
          integratedScore >= 75 ? 'bg-emerald-500/10 border-emerald-500/40' :
          integratedScore >= 55 ? 'bg-amber-500/10 border-amber-500/40' :
          'bg-red-500/10 border-red-500/40'
        )}>
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                Integrated Consulting Score
              </Text>
              <Text className="text-white text-3xl font-bold mt-1">{integratedScore}%</Text>
            </View>
            <View className={cn(
              'w-16 h-16 rounded-full items-center justify-center',
              integratedScore >= 75 ? 'bg-emerald-500/20' :
              integratedScore >= 55 ? 'bg-amber-500/20' : 'bg-red-500/20'
            )}>
              <Gauge
                size={32}
                color={integratedScore >= 75 ? '#10b981' : integratedScore >= 55 ? '#f59e0b' : '#ef4444'}
              />
            </View>
          </View>

          <View className="flex-row flex-wrap gap-2">
            {Object.entries(FIRM_BADGES).slice(0, 5).map(([key, badge]) => (
              <View key={key} className="bg-slate-900/50 px-2 py-1 rounded-md">
                <Text className="text-slate-400 text-xs font-medium">{badge.name}</Text>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>

      {/* Executive Summary */}
      {data.executiveSummary && (
        <Animated.View entering={FadeIn.delay(200)}>
          <View className={cn(
            'p-5 rounded-2xl border',
            data.executiveSummary.overallStatus === 'green' ? 'bg-emerald-500/5 border-emerald-500/30' :
            data.executiveSummary.overallStatus === 'yellow' ? 'bg-amber-500/5 border-amber-500/30' :
            'bg-red-500/5 border-red-500/30'
          )}>
            <View className="flex-row items-center mb-3">
              <View className={cn(
                'w-2.5 h-2.5 rounded-full mr-2',
                data.executiveSummary.overallStatus === 'green' ? 'bg-emerald-500' :
                data.executiveSummary.overallStatus === 'yellow' ? 'bg-amber-500' : 'bg-red-500'
              )} />
              <Text className="text-white font-bold">{data.executiveSummary.statusLabel}</Text>
            </View>
            <Text className="text-slate-300 text-sm leading-5">{data.executiveSummary.headline}</Text>

            {data.executiveSummary.boardDecisionRequired && (
              <View className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex-row items-start">
                <AlertTriangle size={16} color="#f59e0b" />
                <Text className="text-amber-400 text-sm ml-2 flex-1">{data.executiveSummary.boardDecisionRequired}</Text>
              </View>
            )}
          </View>
        </Animated.View>
      )}

      {/* Key Metrics Grid */}
      <Animated.View entering={FadeIn.delay(300)}>
        <Text className="text-white font-bold text-lg mb-3">Key Metrics</Text>
        <View className="flex-row flex-wrap gap-2">
          <MetricCard
            icon={Target}
            color="#3b82f6"
            label="Completion"
            value={`${data.overview.completionRate}%`}
            subtext={`${data.overview.completedTasks}/${data.overview.totalTasks} tasks`}
          />
          <MetricCard
            icon={TrendingUp}
            color="#10b981"
            label="Time Tracked"
            value={`${data.overview.totalTimeLogged}h`}
            subtext={`${data.overview.totalTeamMembers} members`}
          />
          <MetricCard
            icon={Users}
            color="#f59e0b"
            label="Workflow"
            value={`${data.overview.completedWorkflowItems}`}
            subtext={`${data.overview.activeWorkflowItems} active`}
          />
        </View>
      </Animated.View>

      {/* Consulting Insights */}
      {consultingAnalysis?.consultingInsights && consultingAnalysis.consultingInsights.length > 0 && (
        <Animated.View entering={FadeIn.delay(400)}>
          <Text className="text-white font-bold text-lg mb-3">Consulting Insights</Text>
          <View className="gap-3">
            {consultingAnalysis.consultingInsights.slice(0, 4).map((insight: any, idx: number) => (
              <View key={idx} className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="bg-slate-800 px-2 py-1 rounded">
                    <Text className="text-xs text-slate-400 font-medium">{insight.source}</Text>
                  </View>
                  <Text className="text-xs text-slate-500 uppercase">{insight.category}</Text>
                </View>
                <Text className="text-white font-medium mb-2">{insight.insight}</Text>
                <View className="flex-row items-start">
                  <Lightbulb size={14} color="#f59e0b" />
                  <Text className="text-amber-400 text-sm ml-2 flex-1">{insight.recommendation}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>
      )}

      {/* Top Recommendations */}
      {data.recommendations && data.recommendations.length > 0 && (
        <Animated.View entering={FadeIn.delay(500)}>
          <Text className="text-white font-bold text-lg mb-3">Priority Actions</Text>
          <View className="gap-3">
            {data.recommendations.slice(0, 3).map((rec: any) => (
              <View
                key={rec.id}
                className={cn(
                  'p-4 rounded-xl border',
                  rec.priority === 1 ? 'bg-red-500/5 border-red-500/30' :
                  rec.priority === 2 ? 'bg-amber-500/5 border-amber-500/30' :
                  'bg-emerald-500/5 border-emerald-500/30'
                )}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className={cn(
                    'text-xs font-bold uppercase',
                    rec.priority === 1 ? 'text-red-400' :
                    rec.priority === 2 ? 'text-amber-400' : 'text-emerald-400'
                  )}>{rec.priorityLabel}</Text>
                  <Text className="text-slate-500 text-xs">{rec.timeline}</Text>
                </View>
                <Text className="text-white font-semibold mb-2">{rec.title}</Text>
                <Text className="text-slate-400 text-sm">{rec.expectedImpact}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

// ===========================================================================
// STRATEGY DASHBOARD (McKinsey 7S, BCG Growth-Share, Bain NPS)
// ===========================================================================

function StrategyDashboard({ data }: { data: FounderReportData }) {
  const strategy = data.consultingAnalysis?.strategy;

  if (!strategy) {
    return (
      <View className="px-5 py-8 items-center">
        <Text className="text-slate-400">Strategy analysis not available</Text>
      </View>
    );
  }

  return (
    <View className="px-5 gap-4">
      {/* Framework Attribution */}
      <View className="flex-row flex-wrap gap-2 mb-2">
        {['mckinsey', 'bcg', 'bain'].map((firm) => (
          <View key={firm} className="bg-slate-800 px-3 py-1.5 rounded-lg">
            <Text className="text-slate-300 text-xs font-medium">{FIRM_BADGES[firm].name}</Text>
          </View>
        ))}
      </View>

      {/* McKinsey 7S Framework */}
      <Animated.View entering={FadeIn.delay(100)}>
        <View className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <View className="flex-row items-center mb-4">
            <View className="w-8 h-8 bg-blue-500/20 rounded-lg items-center justify-center mr-3">
              <Target size={18} color="#3b82f6" />
            </View>
            <View>
              <Text className="text-white font-bold">McKinsey 7S Framework</Text>
              <Text className="text-slate-400 text-xs">Organizational Alignment: {strategy.overallAlignment}%</Text>
            </View>
          </View>

          <View className="gap-3">
            {Object.entries(strategy.sevenS).map(([key, value]: [string, any]) => (
              <View key={key} className="flex-row items-center justify-between">
                <Text className="text-slate-400 capitalize text-sm">{key}</Text>
                <View className="flex-row items-center">
                  <View className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden mr-3">
                    <View
                      className={cn(
                        'h-full rounded-full',
                        value.score >= 75 ? 'bg-emerald-500' :
                        value.score >= 55 ? 'bg-amber-500' : 'bg-red-500'
                      )}
                      style={{ width: `${value.score}%` }}
                    />
                  </View>
                  <Text className="text-white font-semibold text-sm w-10">{value.score}%</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>

      {/* BCG Growth-Share Matrix */}
      <Animated.View entering={FadeIn.delay(200)}>
        <View className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <View className="flex-row items-center mb-4">
            <View className="w-8 h-8 bg-green-500/20 rounded-lg items-center justify-center mr-3">
              <PieChart size={18} color="#10b981" />
            </View>
            <View>
              <Text className="text-white font-bold">BCG Growth-Share Matrix</Text>
              <Text className="text-slate-400 text-xs">Market Position Analysis</Text>
            </View>
          </View>

          <View className={cn(
            'p-4 rounded-xl border',
            strategy.growthSharePosition === 'star' ? 'bg-amber-500/10 border-amber-500/30' :
            strategy.growthSharePosition === 'cash_cow' ? 'bg-emerald-500/10 border-emerald-500/30' :
            strategy.growthSharePosition === 'question_mark' ? 'bg-purple-500/10 border-purple-500/30' :
            'bg-red-500/10 border-red-500/30'
          )}>
            <Text className={cn(
              'text-lg font-bold capitalize mb-2',
              strategy.growthSharePosition === 'star' ? 'text-amber-400' :
              strategy.growthSharePosition === 'cash_cow' ? 'text-emerald-400' :
              strategy.growthSharePosition === 'question_mark' ? 'text-purple-400' : 'text-red-400'
            )}>
              {strategy.growthSharePosition.replace('_', ' ')}
            </Text>
            <Text className="text-slate-400 text-sm">
              Market Growth: {strategy.marketGrowthRate}% | Relative Share: {strategy.relativeMarketShare.toFixed(2)}x
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Bain NPS Analysis */}
      <Animated.View entering={FadeIn.delay(300)}>
        <View className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <View className="flex-row items-center mb-4">
            <View className="w-8 h-8 bg-red-500/20 rounded-lg items-center justify-center mr-3">
              <Award size={18} color="#ef4444" />
            </View>
            <View>
              <Text className="text-white font-bold">Bain Net Promoter System</Text>
              <Text className="text-slate-400 text-xs">Customer Loyalty Analysis</Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-slate-400 text-xs uppercase">NPS Score</Text>
              <Text className={cn(
                'text-3xl font-bold',
                strategy.npsAnalysis.score > 50 ? 'text-emerald-400' :
                strategy.npsAnalysis.score > 0 ? 'text-amber-400' : 'text-red-400'
              )}>{strategy.npsAnalysis.score}</Text>
            </View>
            <View className="bg-slate-800 px-3 py-2 rounded-lg">
              <Text className="text-white font-semibold">{strategy.npsAnalysis.benchmark}</Text>
            </View>
          </View>

          <View className="flex-row gap-2">
            <View className="flex-1 bg-emerald-500/10 p-3 rounded-lg">
              <Text className="text-emerald-400 text-xs mb-1">Promoters</Text>
              <Text className="text-white font-bold">{strategy.npsAnalysis.promoters}%</Text>
            </View>
            <View className="flex-1 bg-slate-800 p-3 rounded-lg">
              <Text className="text-slate-400 text-xs mb-1">Passives</Text>
              <Text className="text-white font-bold">{strategy.npsAnalysis.passives}%</Text>
            </View>
            <View className="flex-1 bg-red-500/10 p-3 rounded-lg">
              <Text className="text-red-400 text-xs mb-1">Detractors</Text>
              <Text className="text-white font-bold">{strategy.npsAnalysis.detractors}%</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Transformation Readiness (Roland Berger) */}
      <Animated.View entering={FadeIn.delay(400)}>
        <View className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <View className="flex-row items-center mb-4">
            <View className="w-8 h-8 bg-purple-500/20 rounded-lg items-center justify-center mr-3">
              <Zap size={18} color="#a855f7" />
            </View>
            <View>
              <Text className="text-white font-bold">Transformation Readiness</Text>
              <Text className="text-slate-400 text-xs">Roland Berger Assessment</Text>
            </View>
          </View>

          <View className="gap-3">
            {[
              { label: 'Overall Score', value: strategy.transformationReadiness.score },
              { label: 'Digital Maturity', value: strategy.transformationReadiness.digitalMaturity },
              { label: 'Change Capacity', value: strategy.transformationReadiness.changeCapacity },
              { label: 'Leadership Alignment', value: strategy.transformationReadiness.leadershipAlignment },
            ].map((item) => (
              <View key={item.label} className="flex-row items-center justify-between">
                <Text className="text-slate-400 text-sm">{item.label}</Text>
                <View className="flex-row items-center">
                  <View className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden mr-3">
                    <View
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${item.value}%` }}
                    />
                  </View>
                  <Text className="text-white font-semibold text-sm w-10">{item.value}%</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

// ===========================================================================
// OPERATIONS DASHBOARD (Deloitte, Accenture, BCG Lean)
// ===========================================================================

function OperationsDashboard({ data }: { data: FounderReportData }) {
  const operations = data.consultingAnalysis?.operations;

  if (!operations) {
    return (
      <View className="px-5 py-8 items-center">
        <Text className="text-slate-400">Operations analysis not available</Text>
      </View>
    );
  }

  return (
    <View className="px-5 gap-4">
      {/* Framework Attribution */}
      <View className="flex-row flex-wrap gap-2 mb-2">
        {['deloitte', 'accenture', 'bcg'].map((firm) => (
          <View key={firm} className="bg-slate-800 px-3 py-1.5 rounded-lg">
            <Text className="text-slate-300 text-xs font-medium">{FIRM_BADGES[firm].name}</Text>
          </View>
        ))}
      </View>

      {/* Overall Ops Score */}
      <Animated.View entering={FadeIn.delay(100)}>
        <View className={cn(
          'p-5 rounded-2xl border-2',
          operations.overallOpsScore >= 75 ? 'bg-emerald-500/10 border-emerald-500/40' :
          operations.overallOpsScore >= 55 ? 'bg-amber-500/10 border-amber-500/40' :
          'bg-red-500/10 border-red-500/40'
        )}>
          <Text className="text-slate-400 text-xs font-semibold uppercase mb-2">
            Operations Excellence Score
          </Text>
          <Text className="text-white text-4xl font-bold">{operations.overallOpsScore}%</Text>
        </View>
      </Animated.View>

      {/* BCG Lean Maturity */}
      <Animated.View entering={FadeIn.delay(200)}>
        <View className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <View className="flex-row items-center mb-4">
            <View className="w-8 h-8 bg-green-500/20 rounded-lg items-center justify-center mr-3">
              <Activity size={18} color="#10b981" />
            </View>
            <View>
              <Text className="text-white font-bold">BCG Lean Operations</Text>
              <Text className="text-slate-400 text-xs">Maturity Level: {operations.leanMaturity.score}/5</Text>
            </View>
          </View>

          <View className="gap-3">
            {[
              { label: 'Waste Elimination', value: operations.leanMaturity.wasteElimination },
              { label: 'Continuous Improvement', value: operations.leanMaturity.continuousImprovement },
              { label: 'Value Stream', value: operations.leanMaturity.valueStreamOptimization },
              { label: 'Pull System', value: operations.leanMaturity.pullSystem },
            ].map((item) => (
              <View key={item.label} className="flex-row items-center justify-between">
                <Text className="text-slate-400 text-sm">{item.label}</Text>
                <View className="flex-row">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <View
                      key={level}
                      className={cn(
                        'w-5 h-5 rounded-full mx-0.5',
                        level <= item.value ? 'bg-emerald-500' : 'bg-slate-800'
                      )}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>

      {/* Deloitte Digital Operations Index */}
      <Animated.View entering={FadeIn.delay(300)}>
        <View className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <View className="flex-row items-center mb-4">
            <View className="w-8 h-8 bg-lime-500/20 rounded-lg items-center justify-center mr-3">
              <Settings2 size={18} color="#84cc16" />
            </View>
            <View>
              <Text className="text-white font-bold">Deloitte Digital Ops Index</Text>
              <Text className="text-slate-400 text-xs">Overall: {operations.digitalOpsIndex.score}%</Text>
            </View>
          </View>

          <View className="gap-3">
            {[
              { label: 'Automation Level', value: operations.digitalOpsIndex.automationLevel, color: '#3b82f6' },
              { label: 'Data Utilization', value: operations.digitalOpsIndex.dataUtilization, color: '#8b5cf6' },
              { label: 'Process Digitization', value: operations.digitalOpsIndex.processDigitization, color: '#10b981' },
              { label: 'Analytics Capability', value: operations.digitalOpsIndex.analyticsCapability, color: '#f59e0b' },
            ].map((item) => (
              <View key={item.label}>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-slate-400 text-sm">{item.label}</Text>
                  <Text className="text-white font-semibold text-sm">{Math.round(item.value)}%</Text>
                </View>
                <View className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{ width: `${item.value}%`, backgroundColor: item.color }}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>

      {/* Accenture Intelligent Operations */}
      <Animated.View entering={FadeIn.delay(400)}>
        <View className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <View className="flex-row items-center mb-4">
            <View className="w-8 h-8 bg-purple-500/20 rounded-lg items-center justify-center mr-3">
              <Brain size={18} color="#a855f7" />
            </View>
            <View>
              <Text className="text-white font-bold">Accenture Intelligent Ops</Text>
              <Text className="text-slate-400 text-xs">AI & Automation Readiness</Text>
            </View>
          </View>

          <View className="flex-row flex-wrap gap-2">
            {[
              { label: 'AI Adoption', value: operations.intelligentOps.aiAdoption },
              { label: 'Predictive', value: operations.intelligentOps.predictiveCapability },
              { label: 'Self-Healing', value: operations.intelligentOps.selfHealingProcesses },
              { label: 'Real-time', value: operations.intelligentOps.realTimeInsights },
            ].map((item) => (
              <View key={item.label} className="bg-slate-800 p-3 rounded-xl flex-1 min-w-[45%]">
                <Text className="text-slate-400 text-xs mb-1">{item.label}</Text>
                <Text className="text-white font-bold text-lg">{Math.round(item.value)}%</Text>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>

      {/* Operations Recommendations */}
      {operations.recommendations?.length > 0 && (
        <Animated.View entering={FadeIn.delay(500)}>
          <Text className="text-white font-bold text-lg mb-3">Operations Priorities</Text>
          <View className="gap-3">
            {operations.recommendations.slice(0, 3).map((rec: any, idx: number) => (
              <View key={idx} className={cn(
                'p-4 rounded-xl border',
                rec.priority === 'critical' ? 'bg-red-500/5 border-red-500/30' :
                rec.priority === 'high' ? 'bg-amber-500/5 border-amber-500/30' :
                'bg-slate-800 border-slate-700'
              )}>
                <Text className={cn(
                  'text-xs font-bold uppercase mb-2',
                  rec.priority === 'critical' ? 'text-red-400' :
                  rec.priority === 'high' ? 'text-amber-400' : 'text-slate-400'
                )}>{rec.priority} - {rec.category}</Text>
                <Text className="text-white font-semibold mb-1">{rec.title}</Text>
                <Text className="text-slate-400 text-sm">{rec.impact}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

// ===========================================================================
// FINANCE DASHBOARD (EY, PwC, Deloitte, Charles River)
// ===========================================================================

function FinanceDashboard({ data }: { data: FounderReportData }) {
  const finance = data.consultingAnalysis?.finance;

  if (!finance) {
    return (
      <View className="px-5 py-8 items-center">
        <Text className="text-slate-400">Finance analysis not available</Text>
      </View>
    );
  }

  return (
    <View className="px-5 gap-4">
      {/* Framework Attribution */}
      <View className="flex-row flex-wrap gap-2 mb-2">
        {['ey', 'pwc', 'deloitte'].map((firm) => (
          <View key={firm} className="bg-slate-800 px-3 py-1.5 rounded-lg">
            <Text className="text-slate-300 text-xs font-medium">{FIRM_BADGES[firm].name}</Text>
          </View>
        ))}
      </View>

      {/* Overall Financial Health */}
      <Animated.View entering={FadeIn.delay(100)}>
        <View className={cn(
          'p-5 rounded-2xl border-2',
          finance.overallFinancialHealth >= 75 ? 'bg-emerald-500/10 border-emerald-500/40' :
          finance.overallFinancialHealth >= 55 ? 'bg-amber-500/10 border-amber-500/40' :
          'bg-red-500/10 border-red-500/40'
        )}>
          <Text className="text-slate-400 text-xs font-semibold uppercase mb-2">
            Financial Health Score
          </Text>
          <Text className="text-white text-4xl font-bold">{finance.overallFinancialHealth}%</Text>

          <View className={cn(
            'mt-3 px-3 py-1.5 rounded-lg self-start',
            finance.financialRiskProfile.overallRisk === 'low' ? 'bg-emerald-500/20' :
            finance.financialRiskProfile.overallRisk === 'moderate' ? 'bg-amber-500/20' :
            'bg-red-500/20'
          )}>
            <Text className={cn(
              'text-xs font-bold uppercase',
              finance.financialRiskProfile.overallRisk === 'low' ? 'text-emerald-400' :
              finance.financialRiskProfile.overallRisk === 'moderate' ? 'text-amber-400' : 'text-red-400'
            )}>
              {finance.financialRiskProfile.overallRisk} Risk
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* EY Performance Indicators */}
      <Animated.View entering={FadeIn.delay(200)}>
        <View className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <View className="flex-row items-center mb-4">
            <View className="w-8 h-8 bg-yellow-500/20 rounded-lg items-center justify-center mr-3">
              <LineChart size={18} color="#eab308" />
            </View>
            <Text className="text-white font-bold">EY Performance Indicators</Text>
          </View>

          <View className="flex-row flex-wrap gap-2">
            {[
              { label: 'Profitability', value: finance.eyPerformanceIndicators.profitabilityIndex, color: '#10b981' },
              { label: 'Liquidity', value: finance.eyPerformanceIndicators.liquidityIndex, color: '#3b82f6' },
              { label: 'Solvency', value: finance.eyPerformanceIndicators.solvencyIndex, color: '#8b5cf6' },
              { label: 'Efficiency', value: finance.eyPerformanceIndicators.efficiencyIndex, color: '#f59e0b' },
              { label: 'Growth', value: finance.eyPerformanceIndicators.growthIndex, color: '#ec4899' },
            ].map((item) => (
              <View key={item.label} className="bg-slate-800 p-3 rounded-xl flex-1 min-w-[30%]">
                <Text className="text-slate-400 text-xs mb-1">{item.label}</Text>
                <Text style={{ color: item.color }} className="font-bold text-lg">{Math.round(item.value)}</Text>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>

      {/* Charles River Unit Economics */}
      <Animated.View entering={FadeIn.delay(300)}>
        <View className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <View className="flex-row items-center mb-4">
            <View className="w-8 h-8 bg-blue-500/20 rounded-lg items-center justify-center mr-3">
              <DollarSign size={18} color="#3b82f6" />
            </View>
            <Text className="text-white font-bold">Unit Economics</Text>
          </View>

          <View className="gap-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-slate-400">LTV:CAC Ratio</Text>
              <Text className={cn(
                'font-bold text-lg',
                finance.economicIndicators.unitEconomics.ltvCacRatio >= 3 ? 'text-emerald-400' :
                finance.economicIndicators.unitEconomics.ltvCacRatio >= 2 ? 'text-amber-400' : 'text-red-400'
              )}>
                {finance.economicIndicators.unitEconomics.ltvCacRatio.toFixed(1)}x
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-slate-400">Payback Period</Text>
              <Text className="text-white font-bold text-lg">
                {finance.economicIndicators.unitEconomics.paybackMonths.toFixed(0)} mo
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-slate-400">Net Revenue Retention</Text>
              <Text className={cn(
                'font-bold text-lg',
                finance.economicIndicators.growthMetrics.netRevenueRetention >= 100 ? 'text-emerald-400' : 'text-amber-400'
              )}>
                {finance.economicIndicators.growthMetrics.netRevenueRetention}%
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Margin Analysis */}
      <Animated.View entering={FadeIn.delay(400)}>
        <View className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <View className="flex-row items-center mb-4">
            <View className="w-8 h-8 bg-orange-500/20 rounded-lg items-center justify-center mr-3">
              <PieChart size={18} color="#f97316" />
            </View>
            <Text className="text-white font-bold">Margin Analysis</Text>
          </View>

          <View className="gap-3">
            {[
              { label: 'Gross Margin', value: finance.economicIndicators.marginAnalysis.grossMargin },
              { label: 'Contribution Margin', value: finance.economicIndicators.marginAnalysis.contributionMargin },
              { label: 'Operating Margin', value: finance.economicIndicators.marginAnalysis.operatingMargin },
              { label: 'Net Margin', value: finance.economicIndicators.marginAnalysis.netMargin },
            ].map((item) => (
              <View key={item.label}>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-slate-400 text-sm">{item.label}</Text>
                  <Text className={cn(
                    'font-semibold text-sm',
                    item.value >= 0 ? 'text-emerald-400' : 'text-red-400'
                  )}>{item.value.toFixed(1)}%</Text>
                </View>
                <View className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <View
                    className={cn('h-full rounded-full', item.value >= 0 ? 'bg-emerald-500' : 'bg-red-500')}
                    style={{ width: `${Math.min(100, Math.abs(item.value))}%` }}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>

      {/* Key Insights */}
      {finance.keyInsights?.length > 0 && (
        <Animated.View entering={FadeIn.delay(500)}>
          <Text className="text-white font-bold text-lg mb-3">Financial Insights</Text>
          <View className="gap-3">
            {finance.keyInsights.map((insight: any, idx: number) => (
              <View key={idx} className={cn(
                'p-4 rounded-xl border',
                insight.category === 'strength' ? 'bg-emerald-500/5 border-emerald-500/30' :
                insight.category === 'concern' ? 'bg-red-500/5 border-red-500/30' :
                'bg-amber-500/5 border-amber-500/30'
              )}>
                <Text className={cn(
                  'text-xs font-bold uppercase mb-2',
                  insight.category === 'strength' ? 'text-emerald-400' :
                  insight.category === 'concern' ? 'text-red-400' : 'text-amber-400'
                )}>{insight.category}</Text>
                <Text className="text-white font-semibold mb-1">{insight.title}</Text>
                <Text className="text-slate-400 text-sm mb-2">{insight.metric}</Text>
                <Text className="text-slate-500 text-xs">{insight.implication}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

// ===========================================================================
// TALENT DASHBOARD (Mercer, Korn Ferry, Aon, Deloitte HR)
// ===========================================================================

function TalentDashboard({ data }: { data: FounderReportData }) {
  const talent = data.consultingAnalysis?.talent;

  if (!talent) {
    return (
      <View className="px-5 py-8 items-center">
        <Text className="text-slate-400">Talent analysis not available</Text>
      </View>
    );
  }

  return (
    <View className="px-5 gap-4">
      {/* Framework Attribution */}
      <View className="flex-row flex-wrap gap-2 mb-2">
        {['mercer', 'kornferry', 'deloitte'].map((firm) => (
          <View key={firm} className="bg-slate-800 px-3 py-1.5 rounded-lg">
            <Text className="text-slate-300 text-xs font-medium">{FIRM_BADGES[firm].name}</Text>
          </View>
        ))}
      </View>

      {/* Overall Talent Score */}
      <Animated.View entering={FadeIn.delay(100)}>
        <View className={cn(
          'p-5 rounded-2xl border-2',
          talent.overallTalentScore >= 75 ? 'bg-emerald-500/10 border-emerald-500/40' :
          talent.overallTalentScore >= 55 ? 'bg-amber-500/10 border-amber-500/40' :
          'bg-red-500/10 border-red-500/40'
        )}>
          <Text className="text-slate-400 text-xs font-semibold uppercase mb-2">
            Human Capital Score
          </Text>
          <Text className="text-white text-4xl font-bold">{talent.overallTalentScore}%</Text>

          <View className={cn(
            'mt-3 px-3 py-1.5 rounded-lg self-start',
            talent.humanCapitalRisk.overallRisk === 'low' ? 'bg-emerald-500/20' :
            talent.humanCapitalRisk.overallRisk === 'moderate' ? 'bg-amber-500/20' :
            'bg-red-500/20'
          )}>
            <Text className={cn(
              'text-xs font-bold uppercase',
              talent.humanCapitalRisk.overallRisk === 'low' ? 'text-emerald-400' :
              talent.humanCapitalRisk.overallRisk === 'moderate' ? 'text-amber-400' : 'text-red-400'
            )}>
              {talent.humanCapitalRisk.overallRisk} Risk
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Team Composition */}
      <Animated.View entering={FadeIn.delay(200)}>
        <View className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <View className="flex-row items-center mb-4">
            <View className="w-8 h-8 bg-pink-500/20 rounded-lg items-center justify-center mr-3">
              <Users size={18} color="#ec4899" />
            </View>
            <Text className="text-white font-bold">Team Composition</Text>
          </View>

          <View className="flex-row gap-2 mb-4">
            <View className="flex-1 bg-slate-800 p-3 rounded-xl items-center">
              <Text className="text-slate-400 text-xs mb-1">Exec:Apprentice</Text>
              <Text className="text-white font-bold text-lg">
                1:{(1/talent.teamComposition.executiveToApprenticeRatio).toFixed(0)}
              </Text>
            </View>
            <View className="flex-1 bg-slate-800 p-3 rounded-xl items-center">
              <Text className="text-slate-400 text-xs mb-1">Avg Utilization</Text>
              <Text className={cn(
                'font-bold text-lg',
                talent.teamComposition.avgUtilization >= 60 && talent.teamComposition.avgUtilization <= 90 ?
                'text-emerald-400' : 'text-amber-400'
              )}>
                {talent.teamComposition.avgUtilization}%
              </Text>
            </View>
          </View>

          {/* Capacity Distribution */}
          <View className="flex-row gap-2">
            <View className="flex-1 bg-red-500/10 p-3 rounded-xl">
              <Text className="text-red-400 text-xs mb-1">Over-utilized</Text>
              <Text className="text-white font-bold text-lg">{talent.teamComposition.capacityDistribution.overutilized}</Text>
            </View>
            <View className="flex-1 bg-emerald-500/10 p-3 rounded-xl">
              <Text className="text-emerald-400 text-xs mb-1">Optimal</Text>
              <Text className="text-white font-bold text-lg">{talent.teamComposition.capacityDistribution.optimal}</Text>
            </View>
            <View className="flex-1 bg-amber-500/10 p-3 rounded-xl">
              <Text className="text-amber-400 text-xs mb-1">Under-utilized</Text>
              <Text className="text-white font-bold text-lg">{talent.teamComposition.capacityDistribution.underutilized}</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Aon Human Capital Risk */}
      <Animated.View entering={FadeIn.delay(300)}>
        <View className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <View className="flex-row items-center mb-4">
            <View className="w-8 h-8 bg-red-500/20 rounded-lg items-center justify-center mr-3">
              <Shield size={18} color="#ef4444" />
            </View>
            <Text className="text-white font-bold">Aon Human Capital Risk</Text>
          </View>

          <View className="gap-3">
            {[
              { label: 'Attrition Risk', value: talent.humanCapitalRisk.attritionRisk },
              { label: 'Burnout Risk', value: talent.humanCapitalRisk.burnoutRisk },
              { label: 'Skills Gap Risk', value: talent.humanCapitalRisk.skillsGapRisk },
              { label: 'Succession Risk', value: talent.humanCapitalRisk.successionRisk },
              { label: 'Engagement Risk', value: talent.humanCapitalRisk.engagementRisk },
            ].map((item) => (
              <View key={item.label}>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-slate-400 text-sm">{item.label}</Text>
                  <Text className={cn(
                    'font-semibold text-sm',
                    item.value < 30 ? 'text-emerald-400' :
                    item.value < 60 ? 'text-amber-400' : 'text-red-400'
                  )}>{item.value}%</Text>
                </View>
                <View className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <View
                    className={cn(
                      'h-full rounded-full',
                      item.value < 30 ? 'bg-emerald-500' :
                      item.value < 60 ? 'bg-amber-500' : 'bg-red-500'
                    )}
                    style={{ width: `${item.value}%` }}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>

      {/* Korn Ferry Talent Assessment */}
      <Animated.View entering={FadeIn.delay(400)}>
        <View className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <View className="flex-row items-center mb-4">
            <View className="w-8 h-8 bg-rose-500/20 rounded-lg items-center justify-center mr-3">
              <UserCheck size={18} color="#e11d48" />
            </View>
            <Text className="text-white font-bold">Korn Ferry Assessment</Text>
          </View>

          <View className="flex-row flex-wrap gap-2">
            {[
              { label: 'Leadership Bench', value: talent.talentAssessment.leadershipBench },
              { label: 'High Potential %', value: talent.talentAssessment.highPotentialRatio },
              { label: 'Succession Ready', value: talent.talentAssessment.successionReadiness },
              { label: 'Skills Coverage', value: talent.talentAssessment.skillsCoverage },
            ].map((item) => (
              <View key={item.label} className="bg-slate-800 p-3 rounded-xl flex-1 min-w-[45%]">
                <Text className="text-slate-400 text-xs mb-1">{item.label}</Text>
                <Text className="text-white font-bold text-lg">{Math.round(item.value)}%</Text>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>

      {/* Talent Insights */}
      {talent.insights?.length > 0 && (
        <Animated.View entering={FadeIn.delay(500)}>
          <Text className="text-white font-bold text-lg mb-3">Talent Insights</Text>
          <View className="gap-3">
            {talent.insights.map((insight: any, idx: number) => (
              <View key={idx} className={cn(
                'p-4 rounded-xl border flex-row items-start',
                insight.severity === 'positive' ? 'bg-emerald-500/5 border-emerald-500/30' :
                insight.severity === 'warning' ? 'bg-amber-500/5 border-amber-500/30' :
                insight.severity === 'critical' ? 'bg-red-500/5 border-red-500/30' :
                'bg-slate-800 border-slate-700'
              )}>
                {insight.severity === 'positive' && <CheckCircle size={18} color="#10b981" />}
                {insight.severity === 'warning' && <AlertTriangle size={18} color="#f59e0b" />}
                {insight.severity === 'critical' && <AlertTriangle size={18} color="#ef4444" />}
                <View className="flex-1 ml-3">
                  <Text className="text-white font-semibold mb-1">{insight.title}</Text>
                  <Text className="text-slate-400 text-sm mb-2">{insight.metric}</Text>
                  <Text className="text-slate-500 text-xs">{insight.action}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

// ===========================================================================
// PROCESS DASHBOARD (Accenture BPM, KPMG, PwC, Deloitte)
// ===========================================================================

function ProcessDashboard({ data }: { data: FounderReportData }) {
  const process = data.consultingAnalysis?.process;

  if (!process) {
    return (
      <View className="px-5 py-8 items-center">
        <Text className="text-slate-400">Process analysis not available</Text>
      </View>
    );
  }

  const maturityColors = {
    1: '#ef4444',
    2: '#f97316',
    3: '#f59e0b',
    4: '#84cc16',
    5: '#10b981',
  };

  return (
    <View className="px-5 gap-4">
      {/* Framework Attribution */}
      <View className="flex-row flex-wrap gap-2 mb-2">
        {['accenture', 'kpmg', 'pwc'].map((firm) => (
          <View key={firm} className="bg-slate-800 px-3 py-1.5 rounded-lg">
            <Text className="text-slate-300 text-xs font-medium">{FIRM_BADGES[firm].name}</Text>
          </View>
        ))}
      </View>

      {/* Process Maturity Level */}
      <Animated.View entering={FadeIn.delay(100)}>
        <View className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <Text className="text-slate-400 text-xs font-semibold uppercase mb-3">
            Accenture BPM Maturity
          </Text>

          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-white text-4xl font-bold">Level {process.processMaturityLevel}</Text>
              <Text className="text-slate-400 text-sm mt-1">{process.processMaturityLabel.split(' - ')[0]}</Text>
            </View>
            <View className="flex-row">
              {[1, 2, 3, 4, 5].map((level) => (
                <View
                  key={level}
                  className="w-8 h-8 rounded-lg mx-0.5 items-center justify-center"
                  style={{
                    backgroundColor: level <= process.processMaturityLevel
                      ? maturityColors[level as keyof typeof maturityColors]
                      : '#1e293b'
                  }}
                >
                  <Text className="text-white font-bold text-sm">{level}</Text>
                </View>
              ))}
            </View>
          </View>

          <Text className="text-slate-500 text-sm">{process.processMaturityLabel.split(' - ')[1]}</Text>
        </View>
      </Animated.View>

      {/* KPMG Process Excellence */}
      <Animated.View entering={FadeIn.delay(200)}>
        <View className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <View className="flex-row items-center mb-4">
            <View className="w-8 h-8 bg-blue-500/20 rounded-lg items-center justify-center mr-3">
              <Workflow size={18} color="#3b82f6" />
            </View>
            <Text className="text-white font-bold">KPMG Process Excellence</Text>
          </View>

          <View className="gap-3">
            {[
              { label: 'Efficiency', value: process.processExcellence.efficiency, color: '#3b82f6' },
              { label: 'Effectiveness', value: process.processExcellence.effectiveness, color: '#10b981' },
              { label: 'Compliance', value: process.processExcellence.compliance, color: '#8b5cf6' },
              { label: 'Adaptability', value: process.processExcellence.adaptability, color: '#f59e0b' },
              { label: 'Innovation', value: process.processExcellence.innovation, color: '#ec4899' },
            ].map((item) => (
              <View key={item.label}>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-slate-400 text-sm">{item.label}</Text>
                  <Text className="text-white font-semibold text-sm">{item.value}%</Text>
                </View>
                <View className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{ width: `${item.value}%`, backgroundColor: item.color }}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>

      {/* Process Metrics */}
      <Animated.View entering={FadeIn.delay(300)}>
        <View className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <View className="flex-row items-center mb-4">
            <View className="w-8 h-8 bg-cyan-500/20 rounded-lg items-center justify-center mr-3">
              <BarChart3 size={18} color="#06b6d4" />
            </View>
            <Text className="text-white font-bold">Process Metrics</Text>
          </View>

          <View className="flex-row flex-wrap gap-2">
            {[
              { label: 'Cycle Time', value: `${process.processMetrics.avgCycleTime.toFixed(1)}d`, status: process.processMetrics.avgCycleTime < 5 ? 'good' : 'warn' },
              { label: 'Variability', value: `${process.processMetrics.processVariability}%`, status: process.processMetrics.processVariability < 25 ? 'good' : 'warn' },
              { label: 'Automation', value: `${process.processMetrics.automationRate}%`, status: process.processMetrics.automationRate > 50 ? 'good' : 'warn' },
              { label: 'Error Rate', value: `${process.processMetrics.errorRate}%`, status: process.processMetrics.errorRate < 10 ? 'good' : 'warn' },
              { label: 'Rework Rate', value: `${process.processMetrics.reworkRate}%`, status: process.processMetrics.reworkRate < 15 ? 'good' : 'warn' },
            ].map((item) => (
              <View key={item.label} className={cn(
                'p-3 rounded-xl flex-1 min-w-[30%]',
                item.status === 'good' ? 'bg-emerald-500/10' : 'bg-amber-500/10'
              )}>
                <Text className="text-slate-400 text-xs mb-1">{item.label}</Text>
                <Text className={cn(
                  'font-bold text-lg',
                  item.status === 'good' ? 'text-emerald-400' : 'text-amber-400'
                )}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>

      {/* PwC Process Risks */}
      {(process.processRisks.controlGaps.length > 0 ||
        process.processRisks.efficiencyLeaks.length > 0 ||
        process.processRisks.qualityIssues.length > 0) && (
        <Animated.View entering={FadeIn.delay(400)}>
          <View className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
            <View className="flex-row items-center mb-4">
              <View className="w-8 h-8 bg-orange-500/20 rounded-lg items-center justify-center mr-3">
                <AlertTriangle size={18} color="#f97316" />
              </View>
              <Text className="text-white font-bold">PwC Process Risks</Text>
            </View>

            <View className="gap-3">
              {[
                ...process.processRisks.controlGaps.map((r: string) => ({ type: 'Control Gap', text: r })),
                ...process.processRisks.efficiencyLeaks.map((r: string) => ({ type: 'Efficiency Leak', text: r })),
                ...process.processRisks.qualityIssues.map((r: string) => ({ type: 'Quality Issue', text: r })),
              ].slice(0, 4).map((risk, idx) => (
                <View key={idx} className="flex-row items-start">
                  <View className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3" />
                  <View className="flex-1">
                    <Text className="text-orange-400 text-xs font-bold uppercase">{risk.type}</Text>
                    <Text className="text-slate-300 text-sm">{risk.text}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>
      )}

      {/* Bottlenecks */}
      {process.processMetrics.bottlenecks.length > 0 && (
        <Animated.View entering={FadeIn.delay(500)}>
          <View className="bg-red-500/5 p-4 rounded-xl border border-red-500/30">
            <Text className="text-red-400 font-bold mb-2">Identified Bottlenecks</Text>
            <View className="gap-2">
              {process.processMetrics.bottlenecks.map((bottleneck: string, idx: number) => (
                <View key={idx} className="flex-row items-center">
                  <View className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                  <Text className="text-slate-300 text-sm">{bottleneck}</Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>
      )}

      {/* Process Recommendations */}
      {process.recommendations?.length > 0 && (
        <Animated.View entering={FadeIn.delay(600)}>
          <Text className="text-white font-bold text-lg mb-3">Process Improvements</Text>
          <View className="gap-3">
            {process.recommendations.map((rec: any, idx: number) => (
              <View key={idx} className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-blue-400 text-xs font-bold uppercase">{rec.processArea}</Text>
                  <Text className="text-slate-500 text-xs">{rec.effort}</Text>
                </View>
                <Text className="text-white font-semibold mb-1">{rec.title}</Text>
                <Text className="text-slate-400 text-sm mb-2">{rec.currentState} → {rec.targetState}</Text>
                <Text className="text-slate-500 text-xs">{rec.impact}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

// ===========================================================================
// HELPER COMPONENTS
// ===========================================================================

function MetricCard({ icon: Icon, color, label, value, subtext }: {
  icon: any;
  color: string;
  label: string;
  value: string;
  subtext: string;
}) {
  return (
    <View className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex-1 min-w-[30%]">
      <View className="w-8 h-8 rounded-lg items-center justify-center mb-2" style={{ backgroundColor: `${color}20` }}>
        <Icon size={16} color={color} />
      </View>
      <Text className="text-slate-400 text-xs font-medium">{label}</Text>
      <Text className="text-white text-xl font-bold">{value}</Text>
      <Text className="text-slate-500 text-xs mt-1">{subtext}</Text>
    </View>
  );
}

// ===========================================================================
// EXECUTIVE REPORT VIEW
// ===========================================================================

function ExecutiveReportView({ report }: { report: Report }) {
  const data = report.data as ExecutiveReportData;

  return (
    <View className="px-5 gap-4">
      <Animated.View entering={FadeIn.delay(100)}>
        <View className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <Text className="text-slate-400 text-xs font-semibold uppercase mb-1">Function</Text>
          <Text className="text-white text-xl font-bold mb-4">{data.function}</Text>

          <View className="gap-3">
            <View className="flex-row justify-between">
              <Text className="text-slate-400">Tasks Created</Text>
              <Text className="text-white font-bold">{data.summary.tasksCreated}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-slate-400">Tasks Completed</Text>
              <Text className="text-emerald-400 font-bold">{data.summary.tasksCompleted}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-slate-400">Hours Logged</Text>
              <Text className="text-blue-400 font-bold">{data.summary.hoursLogged}h</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {data.apprenticePerformance.length > 0 && (
        <Animated.View entering={FadeIn.delay(200)}>
          <Text className="text-white font-bold text-lg mb-3">Team Performance</Text>
          <View className="gap-3">
            {data.apprenticePerformance.map((apprentice) => (
              <View key={apprentice.apprenticeId} className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <Text className="text-white font-semibold mb-3">{apprentice.apprenticeName}</Text>
                <View className="flex-row justify-between">
                  <View className="items-center">
                    <Text className="text-slate-500 text-xs">Tasks</Text>
                    <Text className="text-white font-bold">{apprentice.tasksCompleted}/{apprentice.tasksAssigned}</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-slate-500 text-xs">Hours</Text>
                    <Text className="text-white font-bold">{apprentice.hoursLogged}h</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-slate-500 text-xs">Pending</Text>
                    <Text className="text-amber-400 font-bold">{apprentice.pendingVerifications}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

// ===========================================================================
// APPRENTICE REPORT VIEW
// ===========================================================================

function ApprenticeReportView({ report }: { report: Report }) {
  const data = report.data as ApprenticeReportData;

  return (
    <View className="px-5 gap-4">
      <Animated.View entering={FadeIn.delay(100)}>
        <View className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <Text className="text-slate-400 text-xs font-semibold uppercase mb-1">Function</Text>
          <Text className="text-white text-xl font-bold mb-4">{data.function}</Text>

          <View className="gap-3">
            <View className="flex-row justify-between">
              <Text className="text-slate-400">Tasks Assigned</Text>
              <Text className="text-white font-bold">{data.summary.tasksAssigned}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-slate-400">Tasks Completed</Text>
              <Text className="text-emerald-400 font-bold">{data.summary.tasksCompleted}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-slate-400">In Progress</Text>
              <Text className="text-blue-400 font-bold">{data.summary.tasksInProgress}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-slate-400">Total Hours</Text>
              <Text className="text-white font-bold">{data.summary.totalHoursLogged}h</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {data.achievements.length > 0 && (
        <Animated.View entering={FadeIn.delay(200)}>
          <Text className="text-white font-bold text-lg mb-3">Achievements</Text>
          <View className="gap-2">
            {data.achievements.map((achievement, idx) => (
              <View key={idx} className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex-row items-center">
                <CheckCircle size={18} color="#10b981" />
                <Text className="text-emerald-400 font-medium ml-3 flex-1">{achievement}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      )}

      {data.taskDetails.length > 0 && (
        <Animated.View entering={FadeIn.delay(300)}>
          <Text className="text-white font-bold text-lg mb-3">Recent Tasks</Text>
          <View className="gap-3">
            {data.taskDetails.slice(0, 5).map((task) => (
              <View key={task.taskId} className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <View className="flex-row items-start justify-between">
                  <Text className="text-white font-medium flex-1 mr-2">{task.title}</Text>
                  <View className={cn(
                    'px-2 py-1 rounded',
                    task.status === 'done' ? 'bg-emerald-500/20' :
                    task.status === 'in_progress' ? 'bg-blue-500/20' : 'bg-amber-500/20'
                  )}>
                    <Text className={cn(
                      'text-xs font-bold uppercase',
                      task.status === 'done' ? 'text-emerald-400' :
                      task.status === 'in_progress' ? 'text-blue-400' : 'text-amber-400'
                    )}>{task.status.replace('_', ' ')}</Text>
                  </View>
                </View>
                {task.hoursLogged > 0 && (
                  <Text className="text-slate-500 text-sm mt-2">{task.hoursLogged}h logged</Text>
                )}
              </View>
            ))}
          </View>
        </Animated.View>
      )}
    </View>
  );
}
