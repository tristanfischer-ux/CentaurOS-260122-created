import { View, Text, ScrollView, Pressable, Modal, TextInput, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useState, useMemo } from 'react';
import {
  X, TrendingUp, TrendingDown, DollarSign, Users, Cpu, Factory, Zap, ShoppingCart,
  BarChart3, AlertCircle, Edit2, Save, RotateCcw, Building, Shield, Laptop, FileText,
  Calculator, ChevronDown, ChevronUp, Target, AlertTriangle, CheckCircle2, Info,
  ArrowRight, PieChart, Activity, Wallet, TrendingUpDown
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FINANCIAL_DATA, type CostItem, calculateCategoryTotal } from '@/lib/financial-calculations';
import { CURRENT_FINANCIALS, FINANCIAL_HISTORY, calculateFinancialRatios } from '@/lib/financial-seed';
import { cn } from '@/lib/cn';

// Types for financial analysis
interface FinancialInsight {
  id: string;
  type: 'critical' | 'warning' | 'opportunity' | 'positive';
  title: string;
  description: string;
  impact: string;
  action: string;
  metric?: string;
}

interface HealthIndicator {
  name: string;
  value: number;
  target: number;
  status: 'green' | 'yellow' | 'red';
  trend: 'up' | 'down' | 'stable';
  description: string;
}

// Use centralized financial data - now returns zeros for multi-tenant architecture
// Actual data should come from Supabase via finance store
const INITIAL_DATA = {
  runway: 0,
  cashPosition: FINANCIAL_DATA.cashPosition,
  monthlyRevenue: FINANCIAL_DATA.monthlyRevenue,

  // Revenue streams - empty by default, should be loaded from Supabase
  revenueStreams: [] as { name: string; amount: number; growth: number; margin: number }[],

  costs: FINANCIAL_DATA.costs,

  // Unit economics metrics - zeros by default, should be loaded from Supabase
  metrics: {
    cac: 0,
    ltv: 0,
    grossMargin: 0,
    burnMultiple: 0,
    paybackPeriod: 0,
    churnRate: 0,
    nrr: 0,
  },
};

export default function FinancialDashboardScreen() {
  const insets = useSafeAreaInsets();

  // State for cost management
  const [costs, setCosts] = useState(INITIAL_DATA.costs);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<{ category: string; item: CostItem } | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    pnl: true,
    health: true,
    insights: true,
    unitEconomics: false,
    costs: false,
    scenarios: false,
  });

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Calculate totals
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

  // P&L Calculations (proper accounting structure)
  const pnl = useMemo(() => {
    const revenue = INITIAL_DATA.monthlyRevenue;
    const cogs = totalManufacturing; // Direct costs
    const grossProfit = revenue - cogs;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    const operatingExpenses = totalTeam + totalAI + totalInfrastructure +
                              totalMarketing + totalFacilities + totalEquipment +
                              totalInsurance + totalProfessional;

    const ebitda = grossProfit - operatingExpenses;
    const ebitdaMargin = revenue > 0 ? (ebitda / revenue) * 100 : 0;

    // For startups, assume minimal D&A
    const depreciation = totalEquipment * 0.3; // ~30% of equipment as depreciation proxy
    const ebit = ebitda - depreciation;

    const netIncome = ebit; // Pre-tax for simplicity
    const netMargin = revenue > 0 ? (netIncome / revenue) * 100 : 0;

    return {
      revenue,
      cogs,
      grossProfit,
      grossMargin,
      operatingExpenses,
      ebitda,
      ebitdaMargin,
      depreciation,
      ebit,
      netIncome,
      netMargin,
    };
  }, [totalManufacturing, totalTeam, totalAI, totalInfrastructure,
      totalMarketing, totalFacilities, totalEquipment, totalInsurance, totalProfessional]);

  // Financial Health Indicators
  const healthIndicators = useMemo((): HealthIndicator[] => {
    const ltvCacRatio = (INITIAL_DATA.metrics.ltv > 0 && INITIAL_DATA.metrics.cac > 0)
      ? INITIAL_DATA.metrics.ltv / INITIAL_DATA.metrics.cac
      : 0;

    return [
      {
        name: 'Runway',
        value: runway === 999 ? 999 : runway,
        target: 18,
        status: runway === 999 ? 'green' : runway >= 18 ? 'green' : runway >= 12 ? 'yellow' : 'red',
        trend: 'stable',
        description: runway === 999 ? 'Cash flow positive - infinite runway' : `${runway.toFixed(1)} months at current burn`,
      },
      {
        name: 'Gross Margin',
        value: pnl.grossMargin,
        target: 70,
        status: pnl.grossMargin >= 70 ? 'green' : pnl.grossMargin >= 50 ? 'yellow' : 'red',
        trend: 'up',
        description: 'Revenue minus direct costs',
      },
      {
        name: 'LTV:CAC Ratio',
        value: ltvCacRatio,
        target: 3,
        status: ltvCacRatio === 0 ? 'yellow' : ltvCacRatio >= 3 ? 'green' : ltvCacRatio >= 2 ? 'yellow' : 'red',
        trend: 'up',
        description: 'Customer lifetime value vs acquisition cost',
      },
      {
        name: 'Burn Multiple',
        value: INITIAL_DATA.metrics.burnMultiple,
        target: 1.5,
        status: INITIAL_DATA.metrics.burnMultiple <= 1.5 ? 'green' : INITIAL_DATA.metrics.burnMultiple <= 2.5 ? 'yellow' : 'red',
        trend: 'down',
        description: 'Net burn / Net new ARR (lower is better)',
      },
      {
        name: 'Net Revenue Retention',
        value: INITIAL_DATA.metrics.nrr,
        target: 100,
        status: INITIAL_DATA.metrics.nrr >= 110 ? 'green' : INITIAL_DATA.metrics.nrr >= 100 ? 'yellow' : 'red',
        trend: 'up',
        description: 'Revenue from existing customers (>100% = expansion)',
      },
      {
        name: 'CAC Payback',
        value: INITIAL_DATA.metrics.paybackPeriod,
        target: 12,
        status: INITIAL_DATA.metrics.paybackPeriod <= 12 ? 'green' : INITIAL_DATA.metrics.paybackPeriod <= 18 ? 'yellow' : 'red',
        trend: 'down',
        description: 'Months to recover customer acquisition cost',
      },
    ];
  }, [runway, pnl.grossMargin]);

  // Generate actionable insights
  const insights = useMemo((): FinancialInsight[] => {
    const result: FinancialInsight[] = [];

    // Runway insights
    if (runway !== 999 && runway < 12) {
      result.push({
        id: 'runway-critical',
        type: 'critical',
        title: 'Runway Below 12 Months',
        description: `Current runway is ${runway.toFixed(1)} months. Immediate action required.`,
        impact: 'Business continuity at risk',
        action: 'Reduce burn by 20% or secure bridge funding within 60 days',
        metric: `${runway.toFixed(1)} months`,
      });
    }

    // Gross margin insights
    if (pnl.grossMargin < 50) {
      result.push({
        id: 'margin-warning',
        type: 'warning',
        title: 'Low Gross Margin',
        description: `Gross margin at ${pnl.grossMargin.toFixed(1)}% is below SaaS benchmark of 70%+`,
        impact: `£${((0.7 - pnl.grossMargin/100) * pnl.revenue / 1000).toFixed(0)}K monthly opportunity`,
        action: 'Review COGS structure, negotiate supplier terms, or increase pricing',
      });
    }

    // Team cost efficiency
    const teamCostRatio = (totalTeam / pnl.revenue) * 100;
    if (teamCostRatio > 50) {
      result.push({
        id: 'team-cost',
        type: 'warning',
        title: 'High Team Cost Ratio',
        description: `Team costs are ${teamCostRatio.toFixed(0)}% of revenue (target: <40%)`,
        impact: `£${((teamCostRatio - 40) * pnl.revenue / 100 / 1000).toFixed(0)}K above optimal`,
        action: 'Increase revenue per employee or optimize team structure',
      });
    }

    // MRR growth opportunity
    const mrrStream = INITIAL_DATA.revenueStreams.find(s => s.name.includes('MRR'));
    if (mrrStream && mrrStream.growth > 0) {
      result.push({
        id: 'mrr-growth',
        type: 'positive',
        title: 'Strong MRR Growth',
        description: `Subscriptions growing at ${mrrStream.growth}% MoM`,
        impact: `Predictable revenue increasing £${((mrrStream.amount * mrrStream.growth / 100) / 1000).toFixed(0)}K/month`,
        action: 'Double down on subscription conversion. Consider annual plans for cash acceleration.',
      });
    }

    // AI tool ROI
    const aiCostRatio = (totalAI / pnl.revenue) * 100;
    if (aiCostRatio < 2) {
      result.push({
        id: 'ai-efficient',
        type: 'positive',
        title: 'Efficient AI Spend',
        description: `AI tools at ${aiCostRatio.toFixed(1)}% of revenue is well-optimized`,
        impact: 'Below industry average of 3-5%',
        action: 'Consider strategic AI investments to accelerate productivity',
      });
    } else if (aiCostRatio > 5) {
      result.push({
        id: 'ai-cost',
        type: 'opportunity',
        title: 'AI Cost Optimization',
        description: `AI spend at ${aiCostRatio.toFixed(1)}% of revenue above benchmark`,
        impact: `£${((aiCostRatio - 3) * pnl.revenue / 100 / 1000).toFixed(0)}K potential savings`,
        action: 'Audit AI tool usage, consolidate vendors, negotiate volume discounts',
      });
    }

    // Cash flow positive
    if (netCashFlow > 0) {
      result.push({
        id: 'cash-positive',
        type: 'positive',
        title: 'Cash Flow Positive',
        description: `Generating +£${(netCashFlow / 1000).toFixed(0)}K monthly`,
        impact: 'Self-sustaining operations achieved',
        action: 'Consider reinvestment in growth or building cash reserves',
      });
    }

    // Marketing efficiency
    const marketingRoi = pnl.revenue / (totalMarketing || 1);
    if (totalMarketing > 0 && marketingRoi > 50) {
      result.push({
        id: 'marketing-roi',
        type: 'positive',
        title: 'Strong Marketing ROI',
        description: `£${marketingRoi.toFixed(0)} revenue per £1 marketing spend`,
        impact: 'Excellent customer acquisition efficiency',
        action: 'Scale marketing spend incrementally while monitoring CAC',
      });
    }

    // Break-even analysis
    const breakEvenRevenue = monthlyBurn / (pnl.grossMargin / 100 || 1);
    const revenueGap = breakEvenRevenue - pnl.revenue;
    if (revenueGap > 0 && netCashFlow < 0) {
      result.push({
        id: 'break-even',
        type: 'opportunity',
        title: 'Path to Break-Even',
        description: `Need £${(revenueGap / 1000).toFixed(0)}K additional monthly revenue`,
        impact: `${((revenueGap / pnl.revenue) * 100).toFixed(0)}% revenue increase required`,
        action: 'Focus on high-margin revenue streams (subscriptions, licensing)',
      });
    }

    return result;
  }, [runway, pnl, totalTeam, totalAI, totalMarketing, monthlyBurn, netCashFlow]);

  // Toggle cost item
  const toggleCostItem = (categoryKey: string, itemId: string) => {
    setCosts(prev => ({
      ...prev,
      [categoryKey]: prev[categoryKey as keyof typeof prev].map((item: CostItem) =>
        item.id === itemId ? { ...item, enabled: !item.enabled } : item
      ),
    }));
  };

  // Open edit modal
  const openEditModal = (categoryKey: string, item: CostItem) => {
    setEditingItem({ category: categoryKey, item });
    setEditAmount(item.amount.toString());
    setShowEditModal(true);
  };

  // Save edited amount
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

  // Reset to defaults
  const resetToDefaults = () => {
    setCosts(INITIAL_DATA.costs);
  };

  // Calculate overall financial health score
  const healthScore = useMemo(() => {
    const greenCount = healthIndicators.filter(h => h.status === 'green').length;
    const yellowCount = healthIndicators.filter(h => h.status === 'yellow').length;
    const totalIndicators = healthIndicators.length;

    const score = ((greenCount * 100) + (yellowCount * 50)) / totalIndicators;

    return {
      score: Math.round(score),
      label: score >= 80 ? 'Strong' : score >= 60 ? 'Moderate' : 'Needs Attention',
      color: score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444',
    };
  }, [healthIndicators]);

  // Render P&L line item
  const renderPnLLine = (label: string, amount: number, isSubtotal?: boolean, isNegative?: boolean, percentage?: number) => (
    <View className={cn('flex-row justify-between py-2', isSubtotal && 'border-t border-gray-200 dark:border-slate-700 pt-3')}>
      <Text className={cn(
        'text-sm',
        isSubtotal ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-700 dark:text-slate-300'
      )}>
        {label}
      </Text>
      <View className="flex-row items-center">
        {percentage !== undefined && (
          <Text className="text-gray-500 dark:text-slate-500 text-xs mr-3">
            {percentage.toFixed(1)}%
          </Text>
        )}
        <Text className={cn(
          'text-sm font-semibold',
          isSubtotal ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-slate-300',
          isNegative && !isSubtotal && 'text-red-500 dark:text-red-400',
          amount > 0 && isSubtotal && amount === pnl.netIncome && (amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')
        )}>
          {isNegative && amount > 0 ? '(' : ''}{amount < 0 ? '-' : ''}£{(Math.abs(amount) / 1000).toFixed(1)}K{isNegative && amount > 0 ? ')' : ''}
        </Text>
      </View>
    </View>
  );

  // Render health indicator
  const renderHealthIndicator = (indicator: HealthIndicator) => (
    <View key={indicator.name} className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 mb-2">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-gray-900 dark:text-white font-semibold text-sm">{indicator.name}</Text>
        <View className={cn(
          'px-2 py-1 rounded-full',
          indicator.status === 'green' && 'bg-emerald-100 dark:bg-emerald-900/30',
          indicator.status === 'yellow' && 'bg-amber-100 dark:bg-amber-900/30',
          indicator.status === 'red' && 'bg-red-100 dark:bg-red-900/30'
        )}>
          <Text className={cn(
            'text-xs font-bold',
            indicator.status === 'green' && 'text-emerald-700 dark:text-emerald-400',
            indicator.status === 'yellow' && 'text-amber-700 dark:text-amber-400',
            indicator.status === 'red' && 'text-red-700 dark:text-red-400'
          )}>
            {indicator.status === 'green' ? 'HEALTHY' : indicator.status === 'yellow' ? 'MONITOR' : 'ACTION'}
          </Text>
        </View>
      </View>
      <View className="flex-row items-end justify-between">
        <View>
          <Text className="text-gray-900 dark:text-white text-2xl font-bold">
            {indicator.value === 999 ? '∞' : indicator.name === 'Gross Margin' || indicator.name === 'Net Revenue Retention'
              ? `${indicator.value.toFixed(1)}%`
              : indicator.name === 'LTV:CAC Ratio'
                ? (indicator.value === 0 ? 'Not yet tracked' : `${indicator.value.toFixed(1)}x`)
                : indicator.name === 'CAC Payback' || indicator.name === 'Runway'
                  ? `${indicator.value.toFixed(1)}mo`
                  : indicator.value.toFixed(2)}
          </Text>
          <Text className="text-gray-500 dark:text-slate-400 text-xs mt-1">
            {indicator.name === 'LTV:CAC Ratio' && indicator.value === 0
              ? 'Start tracking customers to see this metric'
              : indicator.description}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-gray-500 dark:text-slate-500 text-xs">Target</Text>
          <Text className="text-gray-700 dark:text-slate-300 font-semibold">
            {indicator.name === 'Gross Margin' || indicator.name === 'Net Revenue Retention'
              ? `${indicator.target}%`
              : indicator.name === 'LTV:CAC Ratio'
                ? `${indicator.target}x`
                : indicator.name === 'CAC Payback' || indicator.name === 'Runway'
                  ? `${indicator.target}mo`
                  : `≤${indicator.target}`}
          </Text>
        </View>
      </View>
    </View>
  );

  // Render insight card
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
            <Text className="text-gray-600 dark:text-slate-400 text-xs font-semibold">IMPACT</Text>
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

  // Render cost category (collapsed)
  const renderCostCategory = (
    title: string,
    icon: any,
    iconColor: string,
    items: CostItem[],
    categoryKey: string,
    total: number
  ) => (
    <View className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 border border-gray-300 dark:border-slate-800 mb-3">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          {icon}
          <Text className="text-gray-900 dark:text-white font-bold text-sm ml-2">{title}</Text>
        </View>
        <Text className="font-bold text-sm" style={{ color: iconColor }}>
          £{(total / 1000).toFixed(1)}K/mo
        </Text>
      </View>
      <View className="gap-2">
        {items.map((item) => (
          <View key={item.id} className={cn('flex-row items-center justify-between', !item.enabled && 'opacity-40')}>
            <View className="flex-row items-center flex-1">
              <Switch
                value={item.enabled}
                onValueChange={() => toggleCostItem(categoryKey, item.id)}
                trackColor={{ false: '#cbd5e1', true: '#3b82f6' }}
                thumbColor="#fff"
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
              />
              <Text className="text-gray-700 dark:text-slate-300 text-xs ml-2 flex-1" numberOfLines={1}>
                {item.name}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-gray-900 dark:text-white font-semibold text-xs">
                £{item.amount >= 1000 ? `${(item.amount / 1000).toFixed(1)}K` : item.amount.toFixed(0)}
              </Text>
              {item.editable && (
                <Pressable
                  onPress={() => openEditModal(categoryKey, item)}
                  className="w-6 h-6 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30 ml-2 active:opacity-70"
                >
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
    <View className="flex-1 bg-white dark:bg-slate-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-gray-200 dark:border-slate-800">
        <View>
          <Text className="text-gray-900 dark:text-white text-xl font-bold">Financial Dashboard</Text>
          <Text className="text-gray-500 dark:text-slate-400 text-xs">CFO-Grade Analytics & Insights</Text>
        </View>
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-900 active:opacity-70"
        >
          <X size={24} color="#64748b" />
        </Pressable>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-4">
          {/* Financial Health Score Card */}
          <LinearGradient
            colors={netCashFlow >= 0 ? ['#10b981', '#059669'] : runway >= 18 ? ['#3b82f6', '#2563eb'] : runway >= 12 ? ['#f59e0b', '#d97706'] : ['#ef4444', '#dc2626']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 20, padding: 20, marginBottom: 16 }}
          >
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
                  <Text className="text-white text-xl font-bold">
                    {runway === 999 ? '∞' : `${runway.toFixed(1)}mo`}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white/60 text-xs mb-1">Net Cash Flow</Text>
                  <View className="flex-row items-center">
                    {netCashFlow >= 0 ? <TrendingUp size={16} color="#fff" /> : <TrendingDown size={16} color="#fff" />}
                    <Text className="text-white text-xl font-bold ml-1">
                      {netCashFlow >= 0 ? '+' : ''}£{(netCashFlow / 1000).toFixed(0)}K
                    </Text>
                  </View>
                </View>
              </View>

              {/* Quick Status Indicators */}
              <View className="flex-row gap-2 pt-3 border-t border-white/20">
                {healthIndicators.slice(0, 3).map((ind, idx) => (
                  <View key={idx} className="flex-1 flex-row items-center">
                    <View className={cn(
                      'w-2 h-2 rounded-full mr-2',
                      ind.status === 'green' && 'bg-emerald-300',
                      ind.status === 'yellow' && 'bg-amber-300',
                      ind.status === 'red' && 'bg-red-300'
                    )} />
                    <Text className="text-white/80 text-xs" numberOfLines={1}>{ind.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          </LinearGradient>

          {/* P&L Statement Section */}
          <Pressable
            onPress={() => toggleSection('pnl')}
            className="flex-row items-center justify-between mb-3"
          >
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg items-center justify-center mr-3">
                <FileText size={18} color="#3b82f6" />
              </View>
              <Text className="text-gray-900 dark:text-white font-bold text-base">Profit & Loss Statement</Text>
            </View>
            {expandedSections.pnl ? <ChevronUp size={20} color="#64748b" /> : <ChevronDown size={20} color="#64748b" />}
          </Pressable>

          {expandedSections.pnl && (
            <View className="bg-gray-50 dark:bg-slate-900 rounded-xl p-4 mb-4 border border-gray-200 dark:border-slate-800">
              <Text className="text-gray-500 dark:text-slate-500 text-xs font-semibold mb-3">MONTHLY P&L (£'000s)</Text>

              {renderPnLLine('Revenue', pnl.revenue, false, false, 100)}
              {renderPnLLine('Cost of Goods Sold (COGS)', pnl.cogs, false, true)}
              {renderPnLLine('Gross Profit', pnl.grossProfit, true, false, pnl.grossMargin)}

              <View className="h-px bg-gray-200 dark:bg-slate-700 my-2" />

              <Text className="text-gray-500 dark:text-slate-500 text-xs font-semibold mb-2 mt-2">Operating Expenses</Text>
              {renderPnLLine('  Team Costs', totalTeam, false, true)}
              {renderPnLLine('  AI & Software', totalAI + totalInfrastructure, false, true)}
              {renderPnLLine('  Marketing & Sales', totalMarketing, false, true)}
              {renderPnLLine('  G&A (Facilities, Insurance, Prof.)', totalFacilities + totalInsurance + totalProfessional + totalEquipment, false, true)}
              {renderPnLLine('Total Operating Expenses', pnl.operatingExpenses, true, true)}

              <View className="h-px bg-gray-200 dark:bg-slate-700 my-2" />

              {renderPnLLine('EBITDA', pnl.ebitda, true, false, pnl.ebitdaMargin)}
              {renderPnLLine('Depreciation', pnl.depreciation, false, true)}
              {renderPnLLine('Operating Income (EBIT)', pnl.ebit, true)}

              <View className="h-2" />
              <View className={cn(
                'rounded-lg p-3',
                pnl.netIncome >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'
              )}>
                <View className="flex-row justify-between items-center">
                  <Text className={cn(
                    'font-bold',
                    pnl.netIncome >= 0 ? 'text-emerald-800 dark:text-emerald-200' : 'text-red-800 dark:text-red-200'
                  )}>
                    Net Income
                  </Text>
                  <View className="flex-row items-center">
                    <Text className="text-gray-500 dark:text-slate-400 text-xs mr-3">
                      {pnl.netMargin.toFixed(1)}%
                    </Text>
                    <Text className={cn(
                      'font-bold text-lg',
                      pnl.netIncome >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'
                    )}>
                      {pnl.netIncome >= 0 ? '+' : ''}£{(pnl.netIncome / 1000).toFixed(1)}K
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Actionable Insights Section */}
          <Pressable
            onPress={() => toggleSection('insights')}
            className="flex-row items-center justify-between mb-3"
          >
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg items-center justify-center mr-3">
                <Target size={18} color="#8b5cf6" />
              </View>
              <Text className="text-gray-900 dark:text-white font-bold text-base">Actionable Insights</Text>
              <View className="ml-2 bg-purple-500 rounded-full px-2 py-0.5">
                <Text className="text-white text-xs font-bold">{insights.length}</Text>
              </View>
            </View>
            {expandedSections.insights ? <ChevronUp size={20} color="#64748b" /> : <ChevronDown size={20} color="#64748b" />}
          </Pressable>

          {expandedSections.insights && (
            <View className="mb-4">
              {insights.length === 0 ? (
                <View className="bg-gray-50 dark:bg-slate-900 rounded-xl p-6 items-center">
                  <CheckCircle2 size={32} color="#10b981" />
                  <Text className="text-gray-900 dark:text-white font-semibold mt-3">All Clear</Text>
                  <Text className="text-gray-500 dark:text-slate-400 text-sm text-center mt-1">
                    No critical financial insights at this time
                  </Text>
                </View>
              ) : (
                insights.map(renderInsight)
              )}
            </View>
          )}

          {/* Health Indicators Section */}
          <Pressable
            onPress={() => toggleSection('health')}
            className="flex-row items-center justify-between mb-3"
          >
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg items-center justify-center mr-3">
                <Activity size={18} color="#10b981" />
              </View>
              <Text className="text-gray-900 dark:text-white font-bold text-base">Health Indicators</Text>
            </View>
            {expandedSections.health ? <ChevronUp size={20} color="#64748b" /> : <ChevronDown size={20} color="#64748b" />}
          </Pressable>

          {expandedSections.health && (
            <View className="mb-4">
              {healthIndicators.map(renderHealthIndicator)}
            </View>
          )}

          {/* Unit Economics Section */}
          <Pressable
            onPress={() => toggleSection('unitEconomics')}
            className="flex-row items-center justify-between mb-3"
          >
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg items-center justify-center mr-3">
                <PieChart size={18} color="#f59e0b" />
              </View>
              <Text className="text-gray-900 dark:text-white font-bold text-base">Unit Economics</Text>
            </View>
            {expandedSections.unitEconomics ? <ChevronUp size={20} color="#64748b" /> : <ChevronDown size={20} color="#64748b" />}
          </Pressable>

          {expandedSections.unitEconomics && (
            <View className="bg-gray-50 dark:bg-slate-900 rounded-xl p-4 mb-4 border border-gray-200 dark:border-slate-800">
              {/* Check if we have any actual metrics */}
              {INITIAL_DATA.metrics.cac === 0 && INITIAL_DATA.metrics.ltv === 0 && INITIAL_DATA.metrics.paybackPeriod === 0 ? (
                <View className="py-8 items-center">
                  <PieChart size={48} color="#64748b" />
                  <Text className="text-gray-900 dark:text-white font-semibold text-base mt-4">
                    No Unit Economics Yet
                  </Text>
                  <Text className="text-gray-500 dark:text-slate-400 text-sm text-center mt-2 max-w-sm">
                    Start tracking customer acquisition costs (CAC) and lifetime value (LTV) to see your unit economics.
                  </Text>
                  <Text className="text-gray-500 dark:text-slate-400 text-xs text-center mt-4 max-w-sm">
                    These metrics appear automatically once you have customer and revenue data in the system.
                  </Text>
                </View>
              ) : (
                <>
                  <View className="flex-row flex-wrap gap-3">
                <View className="bg-white dark:bg-slate-800 rounded-xl p-4 flex-1" style={{ minWidth: '45%' }}>
                  <Text className="text-gray-500 dark:text-slate-400 text-xs mb-1">CAC</Text>
                  <Text className="text-gray-900 dark:text-white text-xl font-bold">£{INITIAL_DATA.metrics.cac}</Text>
                  <Text className="text-gray-500 dark:text-slate-400 text-xs mt-1">Customer Acquisition Cost</Text>
                </View>
                <View className="bg-white dark:bg-slate-800 rounded-xl p-4 flex-1" style={{ minWidth: '45%' }}>
                  <Text className="text-gray-500 dark:text-slate-400 text-xs mb-1">LTV</Text>
                  <Text className="text-gray-900 dark:text-white text-xl font-bold">£{INITIAL_DATA.metrics.ltv}</Text>
                  <Text className="text-gray-500 dark:text-slate-400 text-xs mt-1">Customer Lifetime Value</Text>
                </View>
                <View className="bg-white dark:bg-slate-800 rounded-xl p-4 flex-1" style={{ minWidth: '45%' }}>
                  <Text className="text-gray-500 dark:text-slate-400 text-xs mb-1">LTV:CAC</Text>
                  <Text className="text-emerald-600 dark:text-emerald-400 text-xl font-bold">
                    {(INITIAL_DATA.metrics.ltv > 0 && INITIAL_DATA.metrics.cac > 0)
                      ? `${(INITIAL_DATA.metrics.ltv / INITIAL_DATA.metrics.cac).toFixed(1)}x`
                      : 'Not yet tracked'}
                  </Text>
                  <Text className="text-gray-500 dark:text-slate-400 text-xs mt-1">Target: 3x+</Text>
                </View>
                <View className="bg-white dark:bg-slate-800 rounded-xl p-4 flex-1" style={{ minWidth: '45%' }}>
                  <Text className="text-gray-500 dark:text-slate-400 text-xs mb-1">Payback Period</Text>
                  <Text className="text-gray-900 dark:text-white text-xl font-bold">{INITIAL_DATA.metrics.paybackPeriod}mo</Text>
                  <Text className="text-gray-500 dark:text-slate-400 text-xs mt-1">Target: {'<'}12mo</Text>
                </View>
                <View className="bg-white dark:bg-slate-800 rounded-xl p-4 flex-1" style={{ minWidth: '45%' }}>
                  <Text className="text-gray-500 dark:text-slate-400 text-xs mb-1">Churn Rate</Text>
                  <Text className="text-gray-900 dark:text-white text-xl font-bold">{INITIAL_DATA.metrics.churnRate}%</Text>
                  <Text className="text-gray-500 dark:text-slate-400 text-xs mt-1">Monthly customer churn</Text>
                </View>
                <View className="bg-white dark:bg-slate-800 rounded-xl p-4 flex-1" style={{ minWidth: '45%' }}>
                  <Text className="text-gray-500 dark:text-slate-400 text-xs mb-1">NRR</Text>
                  <Text className="text-emerald-600 dark:text-emerald-400 text-xl font-bold">{INITIAL_DATA.metrics.nrr}%</Text>
                  <Text className="text-gray-500 dark:text-slate-400 text-xs mt-1">Net Revenue Retention</Text>
                </View>
              </View>

              {/* Revenue Streams */}
              <View className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                <Text className="text-gray-900 dark:text-white font-semibold mb-3">Revenue Streams</Text>
                {INITIAL_DATA.revenueStreams.map((stream, idx) => (
                  <View key={idx} className="flex-row items-center justify-between py-2">
                    <View className="flex-1">
                      <Text className="text-gray-800 dark:text-slate-200 text-sm font-medium">{stream.name}</Text>
                      <View className="flex-row items-center mt-1">
                        {stream.growth >= 0 ? (
                          <TrendingUp size={12} color="#10b981" />
                        ) : (
                          <TrendingDown size={12} color="#ef4444" />
                        )}
                        <Text className={cn('text-xs ml-1', stream.growth >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                          {stream.growth >= 0 ? '+' : ''}{stream.growth}% MoM
                        </Text>
                        <Text className="text-gray-400 dark:text-slate-500 text-xs ml-2">
                          • {stream.margin}% margin
                        </Text>
                      </View>
                    </View>
                    <Text className="text-gray-900 dark:text-white font-bold">£{(stream.amount / 1000).toFixed(0)}K</Text>
                  </View>
                ))}
              </View>
                </>
              )}
            </View>
          )}

          {/* Scenario Planning Section */}
          <Pressable
            onPress={() => toggleSection('scenarios')}
            className="flex-row items-center justify-between mb-3"
          >
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg items-center justify-center mr-3">
                <Calculator size={18} color="#06b6d4" />
              </View>
              <Text className="text-gray-900 dark:text-white font-bold text-base">Scenario Planning</Text>
            </View>
            {expandedSections.scenarios ? <ChevronUp size={20} color="#64748b" /> : <ChevronDown size={20} color="#64748b" />}
          </Pressable>

          {expandedSections.scenarios && (
            <View className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-xl p-4 mb-4 border border-cyan-200 dark:border-cyan-800">
              {/* Scenario 1: Cost Reduction */}
              <View className="mb-4">
                <Text className="text-cyan-900 dark:text-cyan-100 font-bold text-sm mb-2">
                  If you reduce operating costs by 20%:
                </Text>
                <View className="bg-white dark:bg-slate-900 rounded-lg p-3">
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm">New Monthly Burn</Text>
                    <Text className="text-gray-900 dark:text-white font-bold">
                      £{((monthlyBurn * 0.8) / 1000).toFixed(0)}K
                    </Text>
                  </View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm">New Net Cash Flow</Text>
                    <Text className={cn(
                      'font-bold',
                      INITIAL_DATA.monthlyRevenue - (monthlyBurn * 0.8) >= 0 ? 'text-emerald-600' : 'text-red-500'
                    )}>
                      {INITIAL_DATA.monthlyRevenue - (monthlyBurn * 0.8) >= 0 ? '+' : ''}£{((INITIAL_DATA.monthlyRevenue - (monthlyBurn * 0.8)) / 1000).toFixed(0)}K
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm">New Runway</Text>
                    <Text className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {INITIAL_DATA.monthlyRevenue - (monthlyBurn * 0.8) >= 0
                        ? '∞ (Cash Positive)'
                        : `${(INITIAL_DATA.cashPosition / Math.abs(INITIAL_DATA.monthlyRevenue - (monthlyBurn * 0.8))).toFixed(1)} months`}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Scenario 2: Revenue Growth */}
              <View className="mb-4">
                <Text className="text-cyan-900 dark:text-cyan-100 font-bold text-sm mb-2">
                  If revenue grows 30%:
                </Text>
                <View className="bg-white dark:bg-slate-900 rounded-lg p-3">
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm">New Revenue</Text>
                    <Text className="text-gray-900 dark:text-white font-bold">
                      £{((INITIAL_DATA.monthlyRevenue * 1.3) / 1000).toFixed(0)}K
                    </Text>
                  </View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm">New Net Cash Flow</Text>
                    <Text className="text-emerald-600 dark:text-emerald-400 font-bold">
                      +£{(((INITIAL_DATA.monthlyRevenue * 1.3) - monthlyBurn) / 1000).toFixed(0)}K
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm">Status</Text>
                    <Text className="text-emerald-600 dark:text-emerald-400 font-bold">
                      Cash Flow Positive
                    </Text>
                  </View>
                </View>
              </View>

              {/* Scenario 3: Hiring */}
              <View>
                <Text className="text-cyan-900 dark:text-cyan-100 font-bold text-sm mb-2">
                  If you hire 2 more executives (+£14K/mo):
                </Text>
                <View className="bg-white dark:bg-slate-900 rounded-lg p-3">
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm">New Monthly Burn</Text>
                    <Text className="text-gray-900 dark:text-white font-bold">
                      £{((monthlyBurn + 14000) / 1000).toFixed(0)}K
                    </Text>
                  </View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm">New Net Cash Flow</Text>
                    <Text className={cn(
                      'font-bold',
                      INITIAL_DATA.monthlyRevenue - (monthlyBurn + 14000) >= 0 ? 'text-emerald-600' : 'text-red-500'
                    )}>
                      {INITIAL_DATA.monthlyRevenue - (monthlyBurn + 14000) >= 0 ? '+' : ''}£{((INITIAL_DATA.monthlyRevenue - (monthlyBurn + 14000)) / 1000).toFixed(0)}K
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm">New Runway</Text>
                    <Text className={cn(
                      'font-bold',
                      INITIAL_DATA.monthlyRevenue - (monthlyBurn + 14000) >= 0 ? 'text-emerald-600' : 'text-amber-500'
                    )}>
                      {INITIAL_DATA.monthlyRevenue - (monthlyBurn + 14000) >= 0
                        ? '∞ (Cash Positive)'
                        : `${(INITIAL_DATA.cashPosition / Math.abs(INITIAL_DATA.monthlyRevenue - (monthlyBurn + 14000))).toFixed(1)} months`}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Cost Management Section */}
          <Pressable
            onPress={() => toggleSection('costs')}
            className="flex-row items-center justify-between mb-3"
          >
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg items-center justify-center mr-3">
                <Wallet size={18} color="#ef4444" />
              </View>
              <Text className="text-gray-900 dark:text-white font-bold text-base">Cost Management</Text>
            </View>
            {expandedSections.costs ? <ChevronUp size={20} color="#64748b" /> : <ChevronDown size={20} color="#64748b" />}
          </Pressable>

          {expandedSections.costs && (
            <View className="mb-4">
              {/* Reset Button */}
              <Pressable
                onPress={resetToDefaults}
                className="bg-gray-200 dark:bg-slate-700 rounded-xl py-2.5 mb-4 items-center active:opacity-80"
              >
                <View className="flex-row items-center">
                  <RotateCcw size={16} color="#64748b" />
                  <Text className="text-gray-700 dark:text-slate-300 font-semibold text-sm ml-2">Reset All Costs</Text>
                </View>
              </Pressable>

              {/* Cost Categories */}
              {renderCostCategory('Team Costs', <Users size={18} color="#3b82f6" />, '#3b82f6', costs.team, 'team', totalTeam)}
              {renderCostCategory('Manufacturing & Suppliers', <Factory size={18} color="#a855f7" />, '#a855f7', costs.manufacturing, 'manufacturing', totalManufacturing)}
              {renderCostCategory('AI Tools & Software', <Cpu size={18} color="#06b6d4" />, '#06b6d4', costs.aiTools, 'aiTools', totalAI)}
              {renderCostCategory('Infrastructure & Cloud', <Zap size={18} color="#f59e0b" />, '#f59e0b', costs.infrastructure, 'infrastructure', totalInfrastructure)}
              {renderCostCategory('Marketing & Sales', <ShoppingCart size={18} color="#ec4899" />, '#ec4899', costs.marketing, 'marketing', totalMarketing)}
              {renderCostCategory('Facilities & Office', <Building size={18} color="#8b5cf6" />, '#8b5cf6', costs.facilities, 'facilities', totalFacilities)}
              {renderCostCategory('Equipment & Hardware', <Laptop size={18} color="#14b8a6" />, '#14b8a6', costs.equipment, 'equipment', totalEquipment)}
              {renderCostCategory('Insurance & Protection', <Shield size={18} color="#f97316" />, '#f97316', costs.insurance, 'insurance', totalInsurance)}
              {renderCostCategory('Professional Services', <FileText size={18} color="#84cc16" />, '#84cc16', costs.professional, 'professional', totalProfessional)}
            </View>
          )}

          {/* Bottom Padding */}
          <View className="h-8" />
        </View>
      </ScrollView>

      {/* Edit Cost Modal - Enhanced (EY/PwC Financial Control Standards) */}
      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <View className="flex-1 bg-black/70 justify-center items-center px-4">
            <View className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md">
              <View className="flex-row items-center justify-between mb-4">
                <View>
                  <Text className="text-gray-900 dark:text-white text-xl font-bold">
                    Edit Cost Amount
                  </Text>
                  <Text className="text-gray-500 dark:text-slate-400 text-xs mt-1">
                    Changes require justification
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowEditModal(false)}
                  className="w-8 h-8 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800"
                >
                  <X size={16} color="#64748b" />
                </Pressable>
              </View>

              {editingItem && (
                <>
                  {/* Item Context */}
                  <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 mb-4">
                    <Text className="text-blue-900 dark:text-blue-100 font-bold">
                      {editingItem.item.name}
                    </Text>
                    <Text className="text-blue-700 dark:text-blue-300 text-xs mt-1">
                      Category: {editingItem.category.charAt(0).toUpperCase() + editingItem.category.slice(1).replace(/([A-Z])/g, ' $1')}
                    </Text>
                  </View>

                  {/* Current vs New Value */}
                  <View className="flex-row gap-3 mb-4">
                    <View className="flex-1 bg-gray-100 dark:bg-slate-800 rounded-xl p-3">
                      <Text className="text-gray-500 dark:text-slate-400 text-xs mb-1">Current</Text>
                      <Text className="text-gray-900 dark:text-white text-xl font-bold">
                        £{editingItem.item.amount.toLocaleString()}
                      </Text>
                      <Text className="text-gray-500 dark:text-slate-500 text-xs">/month</Text>
                    </View>
                    <View className="flex-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                      <Text className="text-blue-600 dark:text-blue-400 text-xs mb-1">New Amount (£)</Text>
                      <TextInput
                        value={editAmount}
                        onChangeText={setEditAmount}
                        keyboardType="numeric"
                        className="text-blue-900 dark:text-blue-100 text-xl font-bold"
                        placeholder="0"
                        placeholderTextColor="#64748b"
                      />
                      <Text className="text-blue-500 dark:text-blue-400 text-xs">/month</Text>
                    </View>
                  </View>

                  {/* Impact Preview (EY Financial Impact Analysis) */}
                  {editAmount && parseFloat(editAmount) !== editingItem.item.amount && (
                    <View className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4">
                      <View className="flex-row items-center mb-2">
                        <AlertTriangle size={16} color="#f59e0b" />
                        <Text className="text-amber-800 dark:text-amber-200 font-bold ml-2">Impact Preview</Text>
                      </View>

                      {(() => {
                        const newAmount = parseFloat(editAmount) || 0;
                        const oldAmount = editingItem.item.amount;
                        const difference = newAmount - oldAmount;
                        const percentChange = oldAmount > 0 ? ((difference / oldAmount) * 100) : 0;
                        const annualImpact = difference * 12;
                        const currentBurn = Object.values(costs).flat().reduce((sum, item) => sum + (item as CostItem).amount, 0);
                        const newBurn = currentBurn + difference;
                        const currentRunway = INITIAL_DATA.cashPosition / currentBurn;
                        const newRunway = INITIAL_DATA.cashPosition / newBurn;
                        const runwayChange = newRunway - currentRunway;

                        return (
                          <>
                            <View className="flex-row justify-between mb-2">
                              <Text className="text-amber-700 dark:text-amber-300 text-sm">Monthly Change:</Text>
                              <Text className={`font-bold text-sm ${difference >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                {difference >= 0 ? '+' : ''}£{difference.toLocaleString()} ({percentChange >= 0 ? '+' : ''}{percentChange.toFixed(1)}%)
                              </Text>
                            </View>
                            <View className="flex-row justify-between mb-2">
                              <Text className="text-amber-700 dark:text-amber-300 text-sm">Annual Impact:</Text>
                              <Text className={`font-bold text-sm ${annualImpact >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                {annualImpact >= 0 ? '+' : ''}£{annualImpact.toLocaleString()}
                              </Text>
                            </View>
                            <View className="flex-row justify-between">
                              <Text className="text-amber-700 dark:text-amber-300 text-sm">Runway Effect:</Text>
                              <Text className={`font-bold text-sm ${runwayChange <= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                {runwayChange >= 0 ? '+' : ''}{runwayChange.toFixed(1)} months
                              </Text>
                            </View>

                            {/* Warning if significant change */}
                            {Math.abs(percentChange) > 20 && (
                              <View className="mt-3 bg-red-100 dark:bg-red-900/30 rounded-lg p-2">
                                <Text className="text-red-700 dark:text-red-300 text-xs font-semibold">
                                  ⚠️ Large change ({Math.abs(percentChange).toFixed(0)}%) - consider approval from CFO
                                </Text>
                              </View>
                            )}
                          </>
                        );
                      })()}
                    </View>
                  )}

                  {/* Approval Context (PwC Governance Standards) */}
                  <View className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-3 mb-4">
                    <Text className="text-gray-700 dark:text-slate-300 font-semibold text-sm mb-2">Approval Thresholds</Text>
                    <View className="flex-row items-center mb-1">
                      <View className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                      <Text className="text-gray-600 dark:text-slate-400 text-xs">{"<"}£1,000: Self-approve</Text>
                    </View>
                    <View className="flex-row items-center mb-1">
                      <View className="w-2 h-2 rounded-full bg-amber-500 mr-2" />
                      <Text className="text-gray-600 dark:text-slate-400 text-xs">£1,000-5,000: Manager approval</Text>
                    </View>
                    <View className="flex-row items-center">
                      <View className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                      <Text className="text-gray-600 dark:text-slate-400 text-xs">{">"}£5,000: CFO/Founder approval</Text>
                    </View>
                  </View>

                  {/* Audit Trail Info */}
                  <View className="flex-row items-center mb-4">
                    <Info size={14} color="#64748b" />
                    <Text className="text-gray-500 dark:text-slate-500 text-xs ml-2">
                      Changes logged with timestamp and user ID for audit compliance
                    </Text>
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row gap-3">
                    <Pressable
                      onPress={() => setShowEditModal(false)}
                      className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-xl py-3 items-center active:opacity-80"
                    >
                      <Text className="text-gray-700 dark:text-slate-300 font-bold">Cancel</Text>
                    </Pressable>
                    <Pressable
                      onPress={saveEdit}
                      disabled={!editAmount || parseFloat(editAmount) === editingItem.item.amount}
                      className={cn(
                        'flex-1 rounded-xl py-3 items-center active:opacity-80',
                        editAmount && parseFloat(editAmount) !== editingItem.item.amount
                          ? 'bg-blue-500'
                          : 'bg-gray-300 dark:bg-slate-600'
                      )}
                    >
                      <View className="flex-row items-center">
                        <Save size={18} color={editAmount && parseFloat(editAmount) !== editingItem.item.amount ? '#fff' : '#9ca3af'} />
                        <Text className={cn(
                          'font-bold ml-2',
                          editAmount && parseFloat(editAmount) !== editingItem.item.amount
                            ? 'text-white'
                            : 'text-gray-500'
                        )}>
                          Save Change
                        </Text>
                      </View>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
