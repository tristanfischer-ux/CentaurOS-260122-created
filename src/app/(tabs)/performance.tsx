/**
 * Performance Tab - Reports & Metrics
 * Team performance, task completion, and comprehensive financial reports
 */

import { View, Text, ScrollView, Pressable, Switch, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Target,
  Zap,
  Activity,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  FileText,
  Wallet,
  Calculator,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ArrowRight,
  X,
  Edit2,
  Save,
  RotateCcw,
  Factory,
  Cpu,
  ShoppingCart,
  Building,
  Shield,
  Laptop,
  Info,
} from 'lucide-react-native';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { useOKRStore } from '@/lib/state/okr-store';
import { useFinanceStore } from '@/lib/state/finance-store';
import { useCurrentWorkspace, useCurrentMembership } from '@/lib/state/app-store';
import { HelpModal, HelpButton, type HelpContent } from '@/components/HelpModal';
import { SettingsGearButton } from '@/components/SettingsGearButton';
import { FINANCIAL_DATA, type CostItem, calculateCategoryTotal } from '@/lib/financial-calculations';
import { CURRENT_FINANCIALS, calculateFinancialRatios } from '@/lib/financial-seed';
import { cn } from '@/lib/cn';

const PERFORMANCE_HELP: HelpContent = {
  title: 'Performance & Reports',
  subtitle: 'Measure what matters',
  description: 'The Performance tab provides insights into team productivity, task completion rates, and comprehensive financial health. Track metrics over time and identify areas for improvement.',
  tips: [
    'Team utilization shows how much capacity is being used vs available',
    'Task velocity measures how many tasks are completed per week',
    'Financial tab includes full P&L, health indicators, unit economics, and scenario planning',
    'Individual performance shows each team member\'s output and efficiency',
    'Use Cost Management to model different scenarios and their impact on runway',
  ],
  quickActions: [
    { label: 'Team Overview', description: 'High-level team productivity metrics' },
    { label: 'Task Analytics', description: 'Completion rates, velocity, and blocked time' },
    { label: 'Financial Reports', description: 'Full P&L, runway, health indicators, scenario planning' },
    { label: 'Individual Performance', description: 'Per-person metrics and trends' },
  ],
};

type PerformanceTab = 'overview' | 'tasks' | 'financial' | 'team';

// Financial insight types
interface FinancialInsight {
  id: string;
  type: 'critical' | 'warning' | 'opportunity' | 'positive';
  title: string;
  description: string;
  impact: string;
  action: string;
}

interface HealthIndicator {
  name: string;
  value: number;
  target: number;
  status: 'green' | 'yellow' | 'red';
  trend: 'up' | 'down' | 'stable';
  description: string;
}

// Initial data from centralized financial calculations
const INITIAL_DATA = {
  runway: 14.2,
  cashPosition: FINANCIAL_DATA.cashPosition,
  monthlyRevenue: FINANCIAL_DATA.monthlyRevenue,
  revenueStreams: [
    { name: 'Product Sales', amount: 185000, growth: 12, margin: 42 },
    { name: 'Subscriptions (MRR)', amount: 87000, growth: 8, margin: 85 },
    { name: 'Professional Services', amount: 28000, growth: -3, margin: 65 },
    { name: 'Licensing', amount: 12000, growth: 5, margin: 95 },
  ],
  costs: FINANCIAL_DATA.costs,
  metrics: {
    cac: 125,
    ltv: 3600,
    grossMargin: 68,
    burnMultiple: 0.27,
    paybackPeriod: 4.2,
    churnRate: 2.1,
    nrr: 108,
  },
};

export default function PerformanceScreen() {
  const insets = useSafeAreaInsets();
  const currentWorkspace = useCurrentWorkspace();
  const currentMembership = useCurrentMembership();

  // Stores
  const members = useOrganizationStore(s => s.members);
  const workPlans = useWorkPlanStore(s => s.workPlans);
  const okrs = useOKRStore(s => s.okrs);
  const getCashBalance = useFinanceStore(s => s.getCashBalance);
  const getWeeklyBurn = useFinanceStore(s => s.getWeeklyBurn);
  const getMonthlyRevenue = useFinanceStore(s => s.getMonthlyRevenue);

  // State
  const [activeTab, setActiveTab] = useState<PerformanceTab>('overview');
  const [showHelp, setShowHelp] = useState(false);

  // Financial state
  const [costs, setCosts] = useState(INITIAL_DATA.costs);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<{ category: string; item: CostItem } | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [expandedFinancialSections, setExpandedFinancialSections] = useState<Record<string, boolean>>({
    pnl: true,
    health: true,
    insights: true,
    unitEconomics: false,
    costs: false,
    scenarios: false,
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    const activeMembers = members.filter(m => m.status === 'active');

    // Team capacity
    const totalCapacity = activeMembers.reduce((sum, m) => {
      if (m.role === 'Founder' || m.role === 'Apprentice') return sum + 15;
      return sum + ((m.daysPerWeek || 2) * 2) + Math.min((5 - (m.daysPerWeek || 2)) * 2, 10);
    }, 0);

    const allocatedCapacity = activeMembers.reduce((sum, member) => {
      return sum + workPlans
        .filter(wp => wp.status !== 'completed' && wp.status !== 'abandoned')
        .reduce((wpSum, wp) => {
          const allocation = wp.allocations?.find(a => a.memberId === member.id);
          return wpSum + (allocation?.squaresPerWeek || 0);
        }, 0);
    }, 0);

    // Task metrics
    const completedTasks = workPlans.filter(t => t.status === 'completed').length;
    const activeTasks = workPlans.filter(t => t.status === 'in-progress').length;
    const blockedTasks = workPlans.filter(t => t.status === 'blocked').length;
    const queuedTasks = workPlans.filter(t => t.status === 'not-started').length;
    const totalTasks = workPlans.length;

    // Financial
    const cashBalance = currentWorkspace ? getCashBalance(currentWorkspace.id) : 0;
    const weeklyBurn = currentWorkspace ? getWeeklyBurn(currentWorkspace.id) : 0;
    const monthlyRevenue = currentWorkspace ? getMonthlyRevenue(currentWorkspace.id) : 0;
    const monthlyBurn = weeklyBurn * 4.33;
    const netCashFlow = monthlyRevenue - monthlyBurn;
    const runway = netCashFlow >= 0 ? 999 : cashBalance / Math.abs(netCashFlow);

    // OKR progress
    const okrProgress = okrs.length > 0
      ? Math.round(okrs.reduce((sum, okr) => {
          const progress = okr.objectives.length > 0
            ? okr.objectives.reduce((objSum, obj) => objSum + (obj.progress || 0), 0) / okr.objectives.length
            : 0;
          return sum + progress;
        }, 0) / okrs.length)
      : 0;

    return {
      teamSize: activeMembers.length,
      totalCapacity,
      allocatedCapacity,
      availableCapacity: totalCapacity - allocatedCapacity,
      utilizationPercent: totalCapacity > 0 ? Math.round((allocatedCapacity / totalCapacity) * 100) : 0,
      completedTasks,
      activeTasks,
      blockedTasks,
      queuedTasks,
      totalTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      cashBalance,
      weeklyBurn,
      monthlyBurn,
      monthlyRevenue,
      netCashFlow,
      runway: runway > 99 ? '∞' : `${runway.toFixed(1)}mo`,
      okrProgress,
    };
  }, [members, workPlans, okrs, currentWorkspace, getCashBalance, getWeeklyBurn, getMonthlyRevenue]);

  // Per-member metrics
  const memberMetrics = useMemo(() => {
    return members.filter(m => m.status === 'active').map(member => {
      const memberTasks = workPlans.filter(wp =>
        wp.assignedMemberIds?.includes(member.id) ||
        wp.allocations?.some(a => a.memberId === member.id)
      );
      const completedByMember = memberTasks.filter(t => t.status === 'completed').length;
      const activeByMember = memberTasks.filter(t => t.status === 'in-progress').length;

      const capacity = member.role === 'Founder' || member.role === 'Apprentice'
        ? 15
        : ((member.daysPerWeek || 2) * 2) + Math.min((5 - (member.daysPerWeek || 2)) * 2, 10);

      const allocated = workPlans
        .filter(wp => wp.status !== 'completed' && wp.status !== 'abandoned')
        .reduce((sum, wp) => {
          const allocation = wp.allocations?.find(a => a.memberId === member.id);
          return sum + (allocation?.squaresPerWeek || 0);
        }, 0);

      return {
        ...member,
        totalTasks: memberTasks.length,
        completedTasks: completedByMember,
        activeTasks: activeByMember,
        capacity,
        allocated,
        utilizationPercent: capacity > 0 ? Math.round((allocated / capacity) * 100) : 0,
      };
    });
  }, [members, workPlans]);

  // ===========================================================================
  // FINANCIAL CALCULATIONS
  // ===========================================================================
  const totalTeam = calculateCategoryTotal(costs.team);
  const totalManufacturing = calculateCategoryTotal(costs.manufacturing);
  const totalAI = calculateCategoryTotal(costs.aiTools);
  const totalInfrastructure = calculateCategoryTotal(costs.infrastructure);
  const totalMarketing = calculateCategoryTotal(costs.marketing);
  const totalFacilities = calculateCategoryTotal(costs.facilities);
  const totalEquipment = calculateCategoryTotal(costs.equipment);
  const totalInsurance = calculateCategoryTotal(costs.insurance);
  const totalProfessional = calculateCategoryTotal(costs.professional);

  const monthlyBurn = totalTeam + totalManufacturing + totalAI + totalInfrastructure +
                      totalMarketing + totalFacilities + totalEquipment + totalInsurance + totalProfessional;

  const netCashFlow = INITIAL_DATA.monthlyRevenue - monthlyBurn;
  const runway = netCashFlow >= 0 ? 999 : INITIAL_DATA.cashPosition / Math.abs(netCashFlow);

  // P&L Calculations
  const pnl = useMemo(() => {
    const revenue = INITIAL_DATA.monthlyRevenue;
    const cogs = totalManufacturing;
    const grossProfit = revenue - cogs;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    const operatingExpenses = totalTeam + totalAI + totalInfrastructure +
                              totalMarketing + totalFacilities + totalEquipment +
                              totalInsurance + totalProfessional;

    const ebitda = grossProfit - operatingExpenses;
    const ebitdaMargin = revenue > 0 ? (ebitda / revenue) * 100 : 0;
    const depreciation = totalEquipment * 0.3;
    const ebit = ebitda - depreciation;
    const netIncome = ebit;
    const netMargin = revenue > 0 ? (netIncome / revenue) * 100 : 0;

    return { revenue, cogs, grossProfit, grossMargin, operatingExpenses, ebitda, ebitdaMargin, depreciation, ebit, netIncome, netMargin };
  }, [totalManufacturing, totalTeam, totalAI, totalInfrastructure, totalMarketing, totalFacilities, totalEquipment, totalInsurance, totalProfessional]);

  // Health Indicators
  const healthIndicators = useMemo((): HealthIndicator[] => {
    const ltvCacRatio = INITIAL_DATA.metrics.ltv / INITIAL_DATA.metrics.cac;
    return [
      { name: 'Runway', value: runway === 999 ? 999 : runway, target: 18, status: runway === 999 ? 'green' : runway >= 18 ? 'green' : runway >= 12 ? 'yellow' : 'red', trend: 'stable', description: runway === 999 ? 'Cash flow positive' : `${runway.toFixed(1)} months at current burn` },
      { name: 'Gross Margin', value: pnl.grossMargin, target: 70, status: pnl.grossMargin >= 70 ? 'green' : pnl.grossMargin >= 50 ? 'yellow' : 'red', trend: 'up', description: 'Revenue minus direct costs' },
      { name: 'LTV:CAC Ratio', value: ltvCacRatio, target: 3, status: ltvCacRatio >= 3 ? 'green' : ltvCacRatio >= 2 ? 'yellow' : 'red', trend: 'up', description: 'Customer lifetime value vs acquisition cost' },
      { name: 'Burn Multiple', value: INITIAL_DATA.metrics.burnMultiple, target: 1.5, status: INITIAL_DATA.metrics.burnMultiple <= 1.5 ? 'green' : INITIAL_DATA.metrics.burnMultiple <= 2.5 ? 'yellow' : 'red', trend: 'down', description: 'Net burn / Net new ARR' },
      { name: 'Net Revenue Retention', value: INITIAL_DATA.metrics.nrr, target: 100, status: INITIAL_DATA.metrics.nrr >= 110 ? 'green' : INITIAL_DATA.metrics.nrr >= 100 ? 'yellow' : 'red', trend: 'up', description: 'Revenue from existing customers' },
      { name: 'CAC Payback', value: INITIAL_DATA.metrics.paybackPeriod, target: 12, status: INITIAL_DATA.metrics.paybackPeriod <= 12 ? 'green' : INITIAL_DATA.metrics.paybackPeriod <= 18 ? 'yellow' : 'red', trend: 'down', description: 'Months to recover CAC' },
    ];
  }, [runway, pnl.grossMargin]);

  // Actionable Insights
  const insights = useMemo((): FinancialInsight[] => {
    const result: FinancialInsight[] = [];
    if (runway !== 999 && runway < 12) {
      result.push({ id: 'runway-critical', type: 'critical', title: 'Runway Below 12 Months', description: `Current runway is ${runway.toFixed(1)} months.`, impact: 'Business continuity at risk', action: 'Reduce burn by 20% or secure bridge funding' });
    }
    if (pnl.grossMargin < 50) {
      result.push({ id: 'margin-warning', type: 'warning', title: 'Low Gross Margin', description: `Gross margin at ${pnl.grossMargin.toFixed(1)}%`, impact: `£${((0.7 - pnl.grossMargin/100) * pnl.revenue / 1000).toFixed(0)}K monthly opportunity`, action: 'Review COGS, negotiate supplier terms' });
    }
    const mrrStream = INITIAL_DATA.revenueStreams.find(s => s.name.includes('MRR'));
    if (mrrStream && mrrStream.growth > 0) {
      result.push({ id: 'mrr-growth', type: 'positive', title: 'Strong MRR Growth', description: `Subscriptions growing at ${mrrStream.growth}% MoM`, impact: `Predictable revenue increasing`, action: 'Consider annual plans for cash acceleration' });
    }
    if (netCashFlow > 0) {
      result.push({ id: 'cash-positive', type: 'positive', title: 'Cash Flow Positive', description: `Generating +£${(netCashFlow / 1000).toFixed(0)}K monthly`, impact: 'Self-sustaining operations', action: 'Consider reinvestment in growth' });
    }
    return result;
  }, [runway, pnl, netCashFlow]);

  // Health score
  const healthScore = useMemo(() => {
    const greenCount = healthIndicators.filter(h => h.status === 'green').length;
    const yellowCount = healthIndicators.filter(h => h.status === 'yellow').length;
    const score = ((greenCount * 100) + (yellowCount * 50)) / healthIndicators.length;
    return { score: Math.round(score), label: score >= 80 ? 'Strong' : score >= 60 ? 'Moderate' : 'Needs Attention', color: score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444' };
  }, [healthIndicators]);

  // Toggle financial section
  const toggleFinancialSection = (section: string) => {
    setExpandedFinancialSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Cost management handlers
  const toggleCostItem = (categoryKey: string, itemId: string) => {
    setCosts(prev => ({
      ...prev,
      [categoryKey]: prev[categoryKey as keyof typeof prev].map((item: CostItem) =>
        item.id === itemId ? { ...item, enabled: !item.enabled } : item
      ),
    }));
  };

  const openEditModal = (categoryKey: string, item: CostItem) => {
    setEditingItem({ category: categoryKey, item });
    setEditAmount(item.amount.toString());
    setShowEditModal(true);
  };

  const saveEdit = () => {
    if (!editingItem) return;
    const newAmount = parseFloat(editAmount);
    if (isNaN(newAmount) || newAmount < 0) return;
    setCosts(prev => ({
      ...prev,
      [editingItem.category]: prev[editingItem.category as keyof typeof prev].map((item: CostItem) =>
        item.id === editingItem.item.id ? { ...item, amount: newAmount } : item
      ),
    }));
    setShowEditModal(false);
    setEditingItem(null);
  };

  const resetToDefaults = () => {
    setCosts(INITIAL_DATA.costs);
  };

  // Metric Card component
  const MetricCard = ({ title, value, subtitle, icon: Icon, color, trend }: { title: string; value: string | number; subtitle?: string; icon: any; color: string; trend?: 'up' | 'down' | 'neutral'; }) => (
    <View className="bg-white dark:bg-slate-800 rounded-xl p-4 flex-1">
      <View className="flex-row items-center justify-between mb-2">
        <View className="w-8 h-8 rounded-lg items-center justify-center" style={{ backgroundColor: color + '20' }}>
          <Icon size={18} color={color} />
        </View>
        {trend && trend !== 'neutral' && (
          <View className="flex-row items-center">
            {trend === 'up' ? <ArrowUpRight size={14} color="#10b981" /> : <ArrowDownRight size={14} color="#ef4444" />}
          </View>
        )}
      </View>
      <Text className="text-slate-900 dark:text-white font-bold text-xl">{value}</Text>
      <Text className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{title}</Text>
      {subtitle && <Text className="text-slate-400 dark:text-slate-500 text-xs">{subtitle}</Text>}
    </View>
  );

  // P&L line renderer
  const renderPnLLine = (label: string, amount: number, isSubtotal?: boolean, isNegative?: boolean, percentage?: number) => (
    <View className={cn('flex-row justify-between py-2', isSubtotal && 'border-t border-gray-200 dark:border-slate-700 pt-3')}>
      <Text className={cn('text-sm', isSubtotal ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-700 dark:text-slate-300')}>{label}</Text>
      <View className="flex-row items-center">
        {percentage !== undefined && <Text className="text-slate-500 dark:text-slate-500 text-xs mr-3">{percentage.toFixed(1)}%</Text>}
        <Text className={cn('text-sm font-semibold', isSubtotal ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300', isNegative && !isSubtotal && 'text-red-500')}>
          {isNegative && amount > 0 ? '(' : ''}{amount < 0 ? '-' : ''}£{(Math.abs(amount) / 1000).toFixed(1)}K{isNegative && amount > 0 ? ')' : ''}
        </Text>
      </View>
    </View>
  );

  // Health indicator renderer
  const renderHealthIndicator = (indicator: HealthIndicator) => (
    <View key={indicator.name} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-2">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-slate-900 dark:text-white font-semibold text-sm">{indicator.name}</Text>
        <View className={cn('px-2 py-1 rounded-full', indicator.status === 'green' && 'bg-emerald-100 dark:bg-emerald-900/30', indicator.status === 'yellow' && 'bg-amber-100 dark:bg-amber-900/30', indicator.status === 'red' && 'bg-red-100 dark:bg-red-900/30')}>
          <Text className={cn('text-xs font-bold', indicator.status === 'green' && 'text-emerald-700 dark:text-emerald-400', indicator.status === 'yellow' && 'text-amber-700 dark:text-amber-400', indicator.status === 'red' && 'text-red-700 dark:text-red-400')}>
            {indicator.status === 'green' ? 'HEALTHY' : indicator.status === 'yellow' ? 'MONITOR' : 'ACTION'}
          </Text>
        </View>
      </View>
      <View className="flex-row items-end justify-between">
        <View>
          <Text className="text-slate-900 dark:text-white text-2xl font-bold">
            {indicator.value === 999 ? '∞' : indicator.name === 'Gross Margin' || indicator.name === 'Net Revenue Retention' ? `${indicator.value.toFixed(1)}%` : indicator.name === 'LTV:CAC Ratio' ? `${indicator.value.toFixed(1)}x` : indicator.name === 'CAC Payback' || indicator.name === 'Runway' ? `${indicator.value.toFixed(1)}mo` : indicator.value.toFixed(2)}
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-xs mt-1">{indicator.description}</Text>
        </View>
        <View className="items-end">
          <Text className="text-slate-500 dark:text-slate-500 text-xs">Target</Text>
          <Text className="text-slate-700 dark:text-slate-300 font-semibold">
            {indicator.name === 'Gross Margin' || indicator.name === 'Net Revenue Retention' ? `${indicator.target}%` : indicator.name === 'LTV:CAC Ratio' ? `${indicator.target}x` : indicator.name === 'CAC Payback' || indicator.name === 'Runway' ? `${indicator.target}mo` : `≤${indicator.target}`}
          </Text>
        </View>
      </View>
    </View>
  );

  // Insight card renderer
  const renderInsight = (insight: FinancialInsight) => {
    const colors = {
      critical: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', icon: '#ef4444', text: 'text-red-900 dark:text-red-100' },
      warning: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', icon: '#f59e0b', text: 'text-amber-900 dark:text-amber-100' },
      opportunity: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', icon: '#3b82f6', text: 'text-blue-900 dark:text-blue-100' },
      positive: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', icon: '#10b981', text: 'text-emerald-900 dark:text-emerald-100' },
    };
    const style = colors[insight.type];
    const Icon = insight.type === 'critical' ? AlertCircle : insight.type === 'warning' ? AlertTriangle : insight.type === 'opportunity' ? Target : CheckCircle2;
    return (
      <View key={insight.id} className={cn('rounded-xl p-4 mb-3 border', style.bg, style.border)}>
        <View className="flex-row items-start mb-2">
          <Icon size={20} color={style.icon} />
          <View className="flex-1 ml-3">
            <Text className={cn('font-bold text-sm', style.text)}>{insight.title}</Text>
            <Text className={cn('text-sm mt-1 opacity-80', style.text)}>{insight.description}</Text>
          </View>
        </View>
        <View className="bg-white/50 dark:bg-slate-900/50 rounded-lg p-3 mt-2">
          <View className="flex-row justify-between mb-2">
            <Text className="text-slate-600 dark:text-slate-400 text-xs font-semibold">IMPACT</Text>
            <Text className={cn('text-xs font-medium', style.text)}>{insight.impact}</Text>
          </View>
          <View className="flex-row items-center">
            <ArrowRight size={14} color={style.icon} />
            <Text className={cn('text-xs ml-2 flex-1', style.text)}>{insight.action}</Text>
          </View>
        </View>
      </View>
    );
  };

  // Cost category renderer
  const renderCostCategory = (title: string, icon: any, iconColor: string, items: CostItem[], categoryKey: string, total: number) => (
    <View className="bg-slate-100 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 mb-3">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          {icon}
          <Text className="text-slate-900 dark:text-white font-bold text-sm ml-2">{title}</Text>
        </View>
        <Text className="font-bold text-sm" style={{ color: iconColor }}>£{(total / 1000).toFixed(1)}K/mo</Text>
      </View>
      <View className="gap-2">
        {items.map((item) => (
          <View key={item.id} className={cn('flex-row items-center justify-between', !item.enabled && 'opacity-40')}>
            <View className="flex-row items-center flex-1">
              <Switch value={item.enabled} onValueChange={() => toggleCostItem(categoryKey, item.id)} trackColor={{ false: '#cbd5e1', true: '#3b82f6' }} thumbColor="#fff" style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }} />
              <Text className="text-slate-700 dark:text-slate-300 text-xs ml-2 flex-1" numberOfLines={1}>{item.name}</Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-slate-900 dark:text-white font-semibold text-xs">£{item.amount >= 1000 ? `${(item.amount / 1000).toFixed(1)}K` : item.amount.toFixed(0)}</Text>
              {item.editable && (
                <Pressable onPress={() => openEditModal(categoryKey, item)} className="w-6 h-6 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30 ml-2 active:opacity-70">
                  <Edit2 size={12} color="#3b82f6" />
                </Pressable>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Help Modal */}
      <HelpModal visible={showHelp} onClose={() => setShowHelp(false)} content={PERFORMANCE_HELP} gradientColors={['#ec4899', '#be185d']} />

      {/* Edit Cost Modal */}
      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <View className="flex-1 bg-black/70 justify-center items-center px-4">
            <View className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-slate-900 dark:text-white text-xl font-bold">Edit Cost Amount</Text>
                <Pressable onPress={() => setShowEditModal(false)} className="w-8 h-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  <X size={16} color="#64748b" />
                </Pressable>
              </View>
              {editingItem && (
                <>
                  <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 mb-4">
                    <Text className="text-blue-900 dark:text-blue-100 font-bold">{editingItem.item.name}</Text>
                  </View>
                  <View className="flex-row gap-3 mb-4">
                    <View className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-3">
                      <Text className="text-slate-500 dark:text-slate-400 text-xs mb-1">Current</Text>
                      <Text className="text-slate-900 dark:text-white text-xl font-bold">£{editingItem.item.amount.toLocaleString()}</Text>
                    </View>
                    <View className="flex-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                      <Text className="text-blue-600 dark:text-blue-400 text-xs mb-1">New Amount (£)</Text>
                      <TextInput value={editAmount} onChangeText={setEditAmount} keyboardType="numeric" className="text-blue-900 dark:text-blue-100 text-xl font-bold" placeholder="0" placeholderTextColor="#64748b" />
                    </View>
                  </View>
                  <View className="flex-row gap-3">
                    <Pressable onPress={() => setShowEditModal(false)} className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-xl py-3 items-center active:opacity-80">
                      <Text className="text-slate-700 dark:text-slate-300 font-bold">Cancel</Text>
                    </Pressable>
                    <Pressable onPress={saveEdit} className="flex-1 bg-blue-500 rounded-xl py-3 items-center active:opacity-80">
                      <Text className="text-white font-bold">Save</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Header */}
      <LinearGradient colors={['#ec4899', '#db2777', '#be185d']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingHorizontal: 20, paddingTop: insets.top + 12, paddingBottom: 16 }}>
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-white/70 text-xs font-medium uppercase tracking-wide">Analytics</Text>
            <Text className="text-white text-2xl font-bold">Performance</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <SettingsGearButton style="glass" />
            <HelpButton onPress={() => setShowHelp(true)} />
          </View>
        </View>

        {/* Key Stats */}
        <View className="flex-row justify-between bg-white/10 rounded-xl p-3">
          <View className="items-center flex-1">
            <Text className="text-white/70 text-xs">Utilization</Text>
            <Text className="text-white font-bold text-lg">{metrics.utilizationPercent}%</Text>
          </View>
          <View className="items-center flex-1 border-l border-white/20">
            <Text className="text-white/70 text-xs">Completion</Text>
            <Text className="text-white font-bold text-lg">{metrics.completionRate}%</Text>
          </View>
          <View className="items-center flex-1 border-l border-white/20">
            <Text className="text-white/70 text-xs">OKR Progress</Text>
            <Text className="text-white font-bold text-lg">{metrics.okrProgress}%</Text>
          </View>
          <View className="items-center flex-1 border-l border-white/20">
            <Text className="text-white/70 text-xs">Runway</Text>
            <Text className="text-white font-bold text-lg">{runway === 999 ? '∞' : `${runway.toFixed(1)}mo`}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tab Switcher */}
      <View className="px-5 pt-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'tasks', label: 'Tasks' },
              { key: 'financial', label: 'Financial' },
              { key: 'team', label: 'Team' },
            ].map(tab => (
              <Pressable key={tab.key} onPress={() => setActiveTab(tab.key as PerformanceTab)} className={`px-4 py-2 rounded-lg ${activeTab === tab.key ? 'bg-pink-500' : 'bg-white dark:bg-slate-800'}`}>
                <Text className={`text-sm font-medium ${activeTab === tab.key ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>{tab.label}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 100 }}>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <View>
            <Text className="text-slate-900 dark:text-white font-semibold text-base mb-3">Team Capacity</Text>
            <View className="flex-row gap-3 mb-6">
              <MetricCard title="Team Size" value={metrics.teamSize} subtitle="active members" icon={Users} color="#3b82f6" />
              <MetricCard title="Total TU" value={metrics.totalCapacity} subtitle="per week" icon={Clock} color="#8b5cf6" />
            </View>
            <View className="flex-row gap-3 mb-6">
              <MetricCard title="Allocated" value={metrics.allocatedCapacity} subtitle="TU assigned" icon={Target} color="#f59e0b" />
              <MetricCard title="Available" value={metrics.availableCapacity} subtitle="TU free" icon={Zap} color="#10b981" />
            </View>
            <Text className="text-slate-900 dark:text-white font-semibold text-base mb-3">Task Summary</Text>
            <View className="flex-row gap-3 mb-6">
              <MetricCard title="Active" value={metrics.activeTasks} icon={Activity} color="#3b82f6" />
              <MetricCard title="Completed" value={metrics.completedTasks} icon={CheckCircle2} color="#10b981" />
            </View>
            <View className="flex-row gap-3 mb-6">
              <MetricCard title="Blocked" value={metrics.blockedTasks} icon={AlertTriangle} color="#ef4444" />
              <MetricCard title="Queued" value={metrics.queuedTasks} icon={Clock} color="#64748b" />
            </View>
          </View>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <View>
            <Text className="text-slate-900 dark:text-white font-semibold text-base mb-3">Task Analytics</Text>
            <View className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-4">
              <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-3 uppercase">Task Funnel</Text>
              {[
                { label: 'Total Tasks', value: metrics.totalTasks, color: '#64748b' },
                { label: 'In Progress', value: metrics.activeTasks, color: '#3b82f6' },
                { label: 'Completed', value: metrics.completedTasks, color: '#10b981' },
              ].map((item) => (
                <View key={item.label} className="mb-3">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-slate-700 dark:text-slate-300 text-sm">{item.label}</Text>
                    <Text className="text-slate-900 dark:text-white font-semibold">{item.value}</Text>
                  </View>
                  <View className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <View className="h-full rounded-full" style={{ width: `${metrics.totalTasks > 0 ? (item.value / metrics.totalTasks) * 100 : 0}%`, backgroundColor: item.color }} />
                  </View>
                </View>
              ))}
            </View>
            {metrics.blockedTasks > 0 && (
              <View className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 mb-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <AlertTriangle size={18} color="#ef4444" />
                  <Text className="text-red-700 dark:text-red-300 font-semibold">{metrics.blockedTasks} Blocked Tasks</Text>
                </View>
                <Text className="text-red-600 dark:text-red-400 text-sm">Review blocked tasks to unblock team progress</Text>
              </View>
            )}
          </View>
        )}

        {/* Financial Tab - FULL DASHBOARD */}
        {activeTab === 'financial' && (
          <View>
            {/* Financial Health Score Card */}
            <LinearGradient colors={netCashFlow >= 0 ? ['#10b981', '#059669'] : runway >= 18 ? ['#3b82f6', '#2563eb'] : runway >= 12 ? ['#f59e0b', '#d97706'] : ['#ef4444', '#dc2626']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 20, padding: 20, marginBottom: 16 }}>
              <View className="flex-row items-start justify-between mb-4">
                <View>
                  <Text className="text-white/70 text-xs font-semibold mb-1">FINANCIAL HEALTH</Text>
                  <Text className="text-white text-3xl font-bold">{healthScore.label}</Text>
                  <Text className="text-white/80 text-sm mt-1">Score: {healthScore.score}/100</Text>
                </View>
                <View className="bg-white/20 rounded-xl p-3">
                  <Activity size={32} color="#fff" />
                </View>
              </View>
              <View className="bg-white/10 rounded-xl p-4">
                <View className="flex-row justify-between mb-3">
                  <View className="flex-1">
                    <Text className="text-white/60 text-xs mb-1">Cash Position</Text>
                    <Text className="text-white text-xl font-bold">£{(INITIAL_DATA.cashPosition / 1000).toFixed(0)}K</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-white/60 text-xs mb-1">Runway</Text>
                    <Text className="text-white text-xl font-bold">{runway === 999 ? '∞' : `${runway.toFixed(1)}mo`}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-white/60 text-xs mb-1">Net Cash Flow</Text>
                    <View className="flex-row items-center">
                      {netCashFlow >= 0 ? <TrendingUp size={16} color="#fff" /> : <TrendingDown size={16} color="#fff" />}
                      <Text className="text-white text-xl font-bold ml-1">{netCashFlow >= 0 ? '+' : ''}£{(netCashFlow / 1000).toFixed(0)}K</Text>
                    </View>
                  </View>
                </View>
              </View>
            </LinearGradient>

            {/* P&L Statement */}
            <Pressable onPress={() => toggleFinancialSection('pnl')} className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg items-center justify-center mr-3">
                  <FileText size={18} color="#3b82f6" />
                </View>
                <Text className="text-slate-900 dark:text-white font-bold text-base">Profit & Loss Statement</Text>
              </View>
              {expandedFinancialSections.pnl ? <ChevronUp size={20} color="#64748b" /> : <ChevronDown size={20} color="#64748b" />}
            </Pressable>
            {expandedFinancialSections.pnl && (
              <View className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 mb-4 border border-slate-200 dark:border-slate-800">
                <Text className="text-slate-500 dark:text-slate-500 text-xs font-semibold mb-3">MONTHLY P&L (£'000s)</Text>
                {renderPnLLine('Revenue', pnl.revenue, false, false, 100)}
                {renderPnLLine('Cost of Goods Sold (COGS)', pnl.cogs, false, true)}
                {renderPnLLine('Gross Profit', pnl.grossProfit, true, false, pnl.grossMargin)}
                <View className="h-px bg-slate-200 dark:bg-slate-700 my-2" />
                <Text className="text-slate-500 dark:text-slate-500 text-xs font-semibold mb-2 mt-2">Operating Expenses</Text>
                {renderPnLLine('  Team Costs', totalTeam, false, true)}
                {renderPnLLine('  AI & Software', totalAI + totalInfrastructure, false, true)}
                {renderPnLLine('  Marketing & Sales', totalMarketing, false, true)}
                {renderPnLLine('  G&A', totalFacilities + totalInsurance + totalProfessional + totalEquipment, false, true)}
                {renderPnLLine('Total Operating Expenses', pnl.operatingExpenses, true, true)}
                <View className="h-px bg-slate-200 dark:bg-slate-700 my-2" />
                {renderPnLLine('EBITDA', pnl.ebitda, true, false, pnl.ebitdaMargin)}
                {renderPnLLine('Depreciation', pnl.depreciation, false, true)}
                {renderPnLLine('Operating Income (EBIT)', pnl.ebit, true)}
                <View className="h-2" />
                <View className={cn('rounded-lg p-3', pnl.netIncome >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30')}>
                  <View className="flex-row justify-between items-center">
                    <Text className={cn('font-bold', pnl.netIncome >= 0 ? 'text-emerald-800 dark:text-emerald-200' : 'text-red-800 dark:text-red-200')}>Net Income</Text>
                    <Text className={cn('font-bold text-lg', pnl.netIncome >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300')}>{pnl.netIncome >= 0 ? '+' : ''}£{(pnl.netIncome / 1000).toFixed(1)}K</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Actionable Insights */}
            <Pressable onPress={() => toggleFinancialSection('insights')} className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg items-center justify-center mr-3">
                  <Target size={18} color="#8b5cf6" />
                </View>
                <Text className="text-slate-900 dark:text-white font-bold text-base">Actionable Insights</Text>
                <View className="ml-2 bg-purple-500 rounded-full px-2 py-0.5">
                  <Text className="text-white text-xs font-bold">{insights.length}</Text>
                </View>
              </View>
              {expandedFinancialSections.insights ? <ChevronUp size={20} color="#64748b" /> : <ChevronDown size={20} color="#64748b" />}
            </Pressable>
            {expandedFinancialSections.insights && (
              <View className="mb-4">
                {insights.length === 0 ? (
                  <View className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 items-center">
                    <CheckCircle2 size={32} color="#10b981" />
                    <Text className="text-slate-900 dark:text-white font-semibold mt-3">All Clear</Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-sm text-center mt-1">No critical financial insights</Text>
                  </View>
                ) : insights.map(renderInsight)}
              </View>
            )}

            {/* Health Indicators */}
            <Pressable onPress={() => toggleFinancialSection('health')} className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg items-center justify-center mr-3">
                  <Activity size={18} color="#10b981" />
                </View>
                <Text className="text-slate-900 dark:text-white font-bold text-base">Health Indicators</Text>
              </View>
              {expandedFinancialSections.health ? <ChevronUp size={20} color="#64748b" /> : <ChevronDown size={20} color="#64748b" />}
            </Pressable>
            {expandedFinancialSections.health && <View className="mb-4">{healthIndicators.map(renderHealthIndicator)}</View>}

            {/* Unit Economics */}
            <Pressable onPress={() => toggleFinancialSection('unitEconomics')} className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg items-center justify-center mr-3">
                  <PieChart size={18} color="#f59e0b" />
                </View>
                <Text className="text-slate-900 dark:text-white font-bold text-base">Unit Economics</Text>
              </View>
              {expandedFinancialSections.unitEconomics ? <ChevronUp size={20} color="#64748b" /> : <ChevronDown size={20} color="#64748b" />}
            </Pressable>
            {expandedFinancialSections.unitEconomics && (
              <View className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 mb-4 border border-slate-200 dark:border-slate-800">
                <View className="flex-row flex-wrap gap-3">
                  {[
                    { label: 'CAC', value: `£${INITIAL_DATA.metrics.cac}`, desc: 'Customer Acquisition Cost' },
                    { label: 'LTV', value: `£${INITIAL_DATA.metrics.ltv}`, desc: 'Customer Lifetime Value' },
                    { label: 'LTV:CAC', value: `${(INITIAL_DATA.metrics.ltv / INITIAL_DATA.metrics.cac).toFixed(1)}x`, desc: 'Target: 3x+', color: '#10b981' },
                    { label: 'Payback', value: `${INITIAL_DATA.metrics.paybackPeriod}mo`, desc: 'Target: <12mo' },
                    { label: 'Churn', value: `${INITIAL_DATA.metrics.churnRate}%`, desc: 'Monthly churn' },
                    { label: 'NRR', value: `${INITIAL_DATA.metrics.nrr}%`, desc: 'Net Revenue Retention', color: '#10b981' },
                  ].map(item => (
                    <View key={item.label} className="bg-white dark:bg-slate-800 rounded-xl p-4 flex-1" style={{ minWidth: '45%' }}>
                      <Text className="text-slate-500 dark:text-slate-400 text-xs mb-1">{item.label}</Text>
                      <Text className={cn('text-xl font-bold', item.color ? `text-[${item.color}]` : 'text-slate-900 dark:text-white')} style={item.color ? { color: item.color } : undefined}>{item.value}</Text>
                      <Text className="text-slate-500 dark:text-slate-400 text-xs mt-1">{item.desc}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Scenario Planning */}
            <Pressable onPress={() => toggleFinancialSection('scenarios')} className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg items-center justify-center mr-3">
                  <Calculator size={18} color="#06b6d4" />
                </View>
                <Text className="text-slate-900 dark:text-white font-bold text-base">Scenario Planning</Text>
              </View>
              {expandedFinancialSections.scenarios ? <ChevronUp size={20} color="#64748b" /> : <ChevronDown size={20} color="#64748b" />}
            </Pressable>
            {expandedFinancialSections.scenarios && (
              <View className="bg-cyan-50 dark:bg-cyan-900/20 rounded-xl p-4 mb-4 border border-cyan-200 dark:border-cyan-800">
                <View className="mb-4">
                  <Text className="text-cyan-900 dark:text-cyan-100 font-bold text-sm mb-2">If you reduce costs by 20%:</Text>
                  <View className="bg-white dark:bg-slate-900 rounded-lg p-3">
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-slate-600 dark:text-slate-400 text-sm">New Monthly Burn</Text>
                      <Text className="text-slate-900 dark:text-white font-bold">£{((monthlyBurn * 0.8) / 1000).toFixed(0)}K</Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-slate-600 dark:text-slate-400 text-sm">New Net Cash Flow</Text>
                      <Text className={cn('font-bold', INITIAL_DATA.monthlyRevenue - (monthlyBurn * 0.8) >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                        {INITIAL_DATA.monthlyRevenue - (monthlyBurn * 0.8) >= 0 ? '+' : ''}£{((INITIAL_DATA.monthlyRevenue - (monthlyBurn * 0.8)) / 1000).toFixed(0)}K
                      </Text>
                    </View>
                  </View>
                </View>
                <View>
                  <Text className="text-cyan-900 dark:text-cyan-100 font-bold text-sm mb-2">If revenue grows 30%:</Text>
                  <View className="bg-white dark:bg-slate-900 rounded-lg p-3">
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-slate-600 dark:text-slate-400 text-sm">New Revenue</Text>
                      <Text className="text-slate-900 dark:text-white font-bold">£{((INITIAL_DATA.monthlyRevenue * 1.3) / 1000).toFixed(0)}K</Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-slate-600 dark:text-slate-400 text-sm">New Net Cash Flow</Text>
                      <Text className="text-emerald-600 dark:text-emerald-400 font-bold">+£{(((INITIAL_DATA.monthlyRevenue * 1.3) - monthlyBurn) / 1000).toFixed(0)}K</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Cost Management */}
            <Pressable onPress={() => toggleFinancialSection('costs')} className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg items-center justify-center mr-3">
                  <Wallet size={18} color="#ef4444" />
                </View>
                <Text className="text-slate-900 dark:text-white font-bold text-base">Cost Management</Text>
              </View>
              {expandedFinancialSections.costs ? <ChevronUp size={20} color="#64748b" /> : <ChevronDown size={20} color="#64748b" />}
            </Pressable>
            {expandedFinancialSections.costs && (
              <View className="mb-4">
                <Pressable onPress={resetToDefaults} className="bg-slate-200 dark:bg-slate-700 rounded-xl py-2.5 mb-4 items-center active:opacity-80">
                  <View className="flex-row items-center">
                    <RotateCcw size={16} color="#64748b" />
                    <Text className="text-slate-700 dark:text-slate-300 font-semibold text-sm ml-2">Reset All Costs</Text>
                  </View>
                </Pressable>
                {renderCostCategory('Team Costs', <Users size={18} color="#3b82f6" />, '#3b82f6', costs.team, 'team', totalTeam)}
                {renderCostCategory('Manufacturing', <Factory size={18} color="#a855f7" />, '#a855f7', costs.manufacturing, 'manufacturing', totalManufacturing)}
                {renderCostCategory('AI Tools', <Cpu size={18} color="#06b6d4" />, '#06b6d4', costs.aiTools, 'aiTools', totalAI)}
                {renderCostCategory('Infrastructure', <Zap size={18} color="#f59e0b" />, '#f59e0b', costs.infrastructure, 'infrastructure', totalInfrastructure)}
                {renderCostCategory('Marketing', <ShoppingCart size={18} color="#ec4899" />, '#ec4899', costs.marketing, 'marketing', totalMarketing)}
                {renderCostCategory('Facilities', <Building size={18} color="#8b5cf6" />, '#8b5cf6', costs.facilities, 'facilities', totalFacilities)}
                {renderCostCategory('Equipment', <Laptop size={18} color="#14b8a6" />, '#14b8a6', costs.equipment, 'equipment', totalEquipment)}
                {renderCostCategory('Insurance', <Shield size={18} color="#f97316" />, '#f97316', costs.insurance, 'insurance', totalInsurance)}
                {renderCostCategory('Professional', <FileText size={18} color="#84cc16" />, '#84cc16', costs.professional, 'professional', totalProfessional)}
              </View>
            )}
          </View>
        )}

        {/* Team Tab */}
        {activeTab === 'team' && (
          <View>
            <Text className="text-slate-900 dark:text-white font-semibold text-base mb-3">Individual Performance</Text>
            {memberMetrics.map((member, index) => (
              <Animated.View key={member.id} entering={FadeInDown.delay(index * 50).springify()}>
                <View className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-3">
                  <View className="flex-row items-center mb-3">
                    <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: member.role === 'Founder' ? '#8b5cf620' : member.role === 'FractionalExec' ? '#3b82f620' : '#10b98120' }}>
                      <Text className="font-bold" style={{ color: member.role === 'Founder' ? '#8b5cf6' : member.role === 'FractionalExec' ? '#3b82f6' : '#10b981' }}>
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-900 dark:text-white font-semibold">{member.name}</Text>
                      <Text className="text-slate-500 dark:text-slate-400 text-xs">{member.role === 'FractionalExec' ? 'Executive' : member.role} • {member.function}</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-slate-900 dark:text-white font-bold">{member.utilizationPercent}%</Text>
                      <Text className="text-slate-500 dark:text-slate-400 text-xs">utilized</Text>
                    </View>
                  </View>
                  <View className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                    <View className="h-full rounded-full" style={{ width: `${Math.min(member.utilizationPercent, 100)}%`, backgroundColor: member.utilizationPercent > 100 ? '#ef4444' : member.utilizationPercent > 80 ? '#f59e0b' : '#10b981' }} />
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-slate-500 dark:text-slate-400 text-xs">{member.allocated}/{member.capacity} TU allocated</Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-xs">{member.completedTasks} tasks completed</Text>
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
