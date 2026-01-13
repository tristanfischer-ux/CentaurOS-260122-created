import { View, Text, ScrollView, Pressable, Modal, TextInput, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { X, TrendingUp, TrendingDown, DollarSign, Users, Cpu, Factory, Zap, ShoppingCart, BarChart3, AlertCircle, Edit2, Plus, Minus, Save, RotateCcw, Building, Shield, Phone, Wifi, Laptop, FileText, Calculator } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FINANCIAL_DATA, type CostItem } from '@/lib/financial-calculations';

// Initial financial data with all operating costs
const INITIAL_DATA = {
  runway: 14.2,
  cashPosition: 1207000,
  monthlyRevenue: 312000,

  revenueStreams: [
    { name: 'Product Sales', amount: 185000, growth: 12 },
    { name: 'Subscriptions (MRR)', amount: 87000, growth: 8 },
    { name: 'Professional Services', amount: 28000, growth: -3 },
    { name: 'Licensing', amount: 12000, growth: 5 },
  ],

  costs: {
    team: [
      { id: 't1', name: 'Fractional Executives (5)', amount: 35000, enabled: true, details: '£7K each/month', editable: true },
      { id: 't2', name: 'Apprentices (8)', amount: 16000, enabled: true, details: '£2K each/month', editable: true },
      { id: 't3', name: 'Founder Salary', amount: 1000, enabled: true, details: 'Minimal draw', editable: true },
    ],
    manufacturing: [
      { id: 'm1', name: 'TechFab Manufacturing', amount: 12000, enabled: true, details: 'Primary manufacturer', editable: true },
      { id: 'm2', name: 'UK Electronics Supply', amount: 4500, enabled: true, details: 'Component supplier', editable: true },
      { id: 'm3', name: 'GlobalShip Fulfillment', amount: 1500, enabled: true, details: 'Shipping & logistics', editable: true },
    ],
    aiTools: [
      { id: 'ai1', name: 'OpenAI API', amount: 1200, enabled: true, details: '~40K requests/month', editable: true },
      { id: 'ai2', name: 'Anthropic Claude', amount: 800, enabled: true, details: '~25K requests/month', editable: true },
      { id: 'ai3', name: 'Midjourney Pro', amount: 600, enabled: true, details: 'Unlimited generations', editable: true },
      { id: 'ai4', name: 'ElevenLabs', amount: 400, enabled: true, details: '500K characters/month', editable: true },
    ],
    infrastructure: [
      { id: 'i1', name: 'AWS Cloud Hosting', amount: 3200, enabled: true, details: 'Production + staging', editable: true },
      { id: 'i2', name: 'Software Licenses', amount: 1200, enabled: true, details: 'Figma, Linear, Notion, etc.', editable: true },
      { id: 'i3', name: 'Communication Tools', amount: 600, enabled: true, details: 'Slack, Zoom, Google Workspace', editable: true },
    ],
    marketing: [
      { id: 'mk1', name: 'Digital Advertising', amount: 2500, enabled: true, details: 'Google Ads, LinkedIn', editable: true },
      { id: 'mk2', name: 'Content Creation', amount: 1200, enabled: true, details: '~8 pieces/month', editable: true },
      { id: 'mk3', name: 'Events & Conferences', amount: 800, enabled: true, details: '2 events/quarter', editable: true },
      { id: 'mk4', name: 'SEO Tools & Services', amount: 500, enabled: true, details: 'Semrush, Ahrefs', editable: true },
    ],
    facilities: [
      { id: 'f1', name: 'Office Rent', amount: 2000, enabled: true, details: '4 hot desks, coworking space', editable: true },
      { id: 'f2', name: 'Internet & Connectivity', amount: 300, enabled: true, details: 'Fiber internet + backup', editable: true },
      { id: 'f3', name: 'Utilities', amount: 200, enabled: true, details: 'Electricity, water', editable: true },
      { id: 'f4', name: 'Office Supplies', amount: 150, enabled: true, details: 'Paper, pens, misc.', editable: true },
    ],
    equipment: [
      { id: 'e1', name: 'Laptops & Computers', amount: 800, enabled: true, details: 'Amortized: £9.6K/yr', editable: true },
      { id: 'e2', name: 'Monitors & Peripherals', amount: 200, enabled: true, details: 'Keyboards, mice, displays', editable: true },
      { id: 'e3', name: 'Mobile Phones', amount: 400, enabled: true, details: '5 phones @ £80/mo each', editable: true },
      { id: 'e4', name: 'Equipment Maintenance', amount: 150, enabled: true, details: 'Repairs & replacements', editable: true },
    ],
    insurance: [
      { id: 'in1', name: 'Business Liability Insurance', amount: 350, enabled: true, details: '£1M coverage', editable: true },
      { id: 'in2', name: 'Professional Indemnity', amount: 250, enabled: true, details: 'PI insurance', editable: true },
      { id: 'in3', name: 'Equipment Insurance', amount: 100, enabled: true, details: 'Covers all tech equipment', editable: true },
      { id: 'in4', name: 'Cyber Insurance', amount: 200, enabled: true, details: 'Data breach coverage', editable: true },
    ],
    professional: [
      { id: 'p1', name: 'Legal Services', amount: 800, enabled: true, details: 'Contracts, compliance', editable: true },
      { id: 'p2', name: 'Accounting & Bookkeeping', amount: 600, enabled: true, details: 'Monthly bookkeeping + tax', editable: true },
      { id: 'p3', name: 'Banking Fees', amount: 150, enabled: true, details: 'Business account fees', editable: true },
      { id: 'p4', name: 'Payment Processing', amount: 450, enabled: true, details: '~1.5% of revenue', editable: true },
    ],
  },

  metrics: {
    cac: 125,
    ltv: 3600,
    grossMargin: 68,
    burnMultiple: 0.27,
  },
};

export default function FinancialDashboardScreen() {
  const insets = useSafeAreaInsets();

  // State for cost management
  const [costs, setCosts] = useState(INITIAL_DATA.costs);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<{ category: string; item: CostItem } | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [showScenario, setShowScenario] = useState(false);

  // Calculate totals
  const calculateCategoryTotal = (category: CostItem[]) => {
    return category.reduce((sum, item) => sum + (item.enabled ? item.amount : 0), 0);
  };

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
  const runway = INITIAL_DATA.cashPosition / monthlyBurn;

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

  // Render cost category
  const renderCostCategory = (
    title: string,
    icon: any,
    iconColor: string,
    items: CostItem[],
    categoryKey: string,
    total: number
  ) => (
    <View className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 border border-gray-300 dark:border-slate-800 mb-4">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          {icon}
          <Text className="text-gray-900 dark:text-white font-bold text-base ml-2">{title}</Text>
        </View>
        <Text className={`font-bold text-lg`} style={{ color: iconColor }}>
          £{(total / 1000).toFixed(1)}K/mo
        </Text>
      </View>
      <View className="gap-3">
        {items.map((item) => (
          <View key={item.id} className={`${!item.enabled ? 'opacity-40' : ''}`}>
            <View className="flex-row items-center justify-between mb-1">
              <View className="flex-row items-center flex-shrink">
                <Switch
                  value={item.enabled}
                  onValueChange={() => toggleCostItem(categoryKey, item.id)}
                  trackColor={{ false: '#cbd5e1', true: '#3b82f6' }}
                  thumbColor="#fff"
                  style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
                />
                <Text className="text-gray-900 dark:text-white font-semibold text-sm ml-3">
                  {item.name}
                </Text>
              </View>
              <View className="flex-row items-center ml-2">
                <Text className="text-gray-900 dark:text-white font-bold mr-2">
                  £{item.amount >= 1000 ? `${(item.amount / 1000).toFixed(1)}K` : item.amount.toFixed(0)}
                </Text>
                {item.editable && (
                  <Pressable
                    onPress={() => openEditModal(categoryKey, item)}
                    className="w-8 h-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 active:opacity-70"
                  >
                    <Edit2 size={14} color="#3b82f6" />
                  </Pressable>
                )}
              </View>
            </View>
            {item.details && (
              <Text className="text-gray-600 dark:text-slate-400 text-xs ml-14">{item.details}</Text>
            )}
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
          <Text className="text-gray-900 dark:text-white text-2xl font-bold">Financial Dashboard</Text>
          <Text className="text-gray-600 dark:text-slate-400 text-sm">Manage all costs and assumptions</Text>
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
          {/* Key Metrics Card */}
          <LinearGradient
            colors={['#10b981', '#14b8a6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderRadius: 16, padding: 20, marginBottom: 16 }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-emerald-100 text-xs font-semibold mb-1">RUNWAY</Text>
                <Text className="text-white text-4xl font-bold">
                  {runway.toFixed(1)} months
                </Text>
              </View>
              <BarChart3 size={40} color="#fff" />
            </View>

            <View className="h-px bg-white/20 mb-4" />

            <View className="gap-3">
              <View className="flex-row justify-between">
                <Text className="text-emerald-100 text-sm">Cash Position</Text>
                <Text className="text-white text-lg font-bold">
                  £{(INITIAL_DATA.cashPosition / 1000).toFixed(0)}K
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-emerald-100 text-sm">Monthly Revenue</Text>
                <Text className="text-white text-lg font-bold">
                  £{(INITIAL_DATA.monthlyRevenue / 1000).toFixed(0)}K
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-emerald-100 text-sm">Monthly Burn</Text>
                <Text className="text-white text-lg font-bold">
                  £{(monthlyBurn / 1000).toFixed(0)}K
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-emerald-100 text-sm">Net Cash Flow</Text>
                <View className="flex-row items-center">
                  {netCashFlow >= 0 ? (
                    <TrendingUp size={16} color="#fff" />
                  ) : (
                    <TrendingDown size={16} color="#fff" />
                  )}
                  <Text className="text-white text-lg font-bold ml-1">
                    {netCashFlow >= 0 ? '+' : ''}£{(netCashFlow / 1000).toFixed(0)}K
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Action Buttons */}
          <View className="flex-row gap-3 mb-4">
            <Pressable
              onPress={() => setShowScenario(!showScenario)}
              className="flex-1 bg-blue-500 rounded-xl py-2 items-center active:opacity-80"
            >
              <View className="flex-row items-center">
                <Calculator size={16} color="#fff" />
                <Text className="text-white font-semibold text-sm ml-2">Scenarios</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={resetToDefaults}
              className="flex-1 bg-gray-300 dark:bg-slate-700 rounded-xl py-2 items-center active:opacity-80"
            >
              <View className="flex-row items-center">
                <RotateCcw size={16} color="#64748b" />
                <Text className="text-gray-700 dark:text-slate-300 font-semibold text-sm ml-2">Reset</Text>
              </View>
            </Pressable>
          </View>

          {/* Scenario Planning */}
          {showScenario && (
            <View className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700 rounded-xl p-4 mb-4">
              <View className="flex-row items-center mb-3">
                <Calculator size={20} color="#f59e0b" />
                <Text className="text-amber-900 dark:text-amber-100 font-bold text-base ml-2">
                  Scenario Analysis
                </Text>
              </View>

              <Text className="text-amber-800 dark:text-amber-200 text-sm font-semibold mb-2">
                What if you cut 30% of discretionary spend?
              </Text>
              <View className="bg-white dark:bg-slate-900 rounded-lg p-3 mb-3">
                <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">New Monthly Burn</Text>
                <Text className="text-gray-900 dark:text-white text-xl font-bold">
                  £{((monthlyBurn - (totalMarketing + totalFacilities * 0.3)) / 1000).toFixed(0)}K
                </Text>
                <Text className="text-emerald-600 dark:text-emerald-400 text-xs mt-1">
                  Runway extends to {(INITIAL_DATA.cashPosition / (monthlyBurn - (totalMarketing + totalFacilities * 0.3))).toFixed(1)} months
                </Text>
              </View>

              <Text className="text-amber-800 dark:text-amber-200 text-sm font-semibold mb-2">
                What if you onboard 2 more Executives?
              </Text>
              <View className="bg-white dark:bg-slate-900 rounded-lg p-3 mb-3">
                <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">New Monthly Burn</Text>
                <Text className="text-gray-900 dark:text-white text-xl font-bold">
                  £{((monthlyBurn + 14000) / 1000).toFixed(0)}K
                </Text>
                <Text className="text-red-600 dark:text-red-400 text-xs mt-1">
                  Runway reduces to {(INITIAL_DATA.cashPosition / (monthlyBurn + 14000)).toFixed(1)} months
                </Text>
              </View>

              <Text className="text-amber-800 dark:text-amber-200 text-sm font-semibold mb-2">
                What if revenue grows 20%?
              </Text>
              <View className="bg-white dark:bg-slate-900 rounded-lg p-3">
                <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">New Monthly Cash Flow</Text>
                <Text className="text-gray-900 dark:text-white text-xl font-bold">
                  +£{((INITIAL_DATA.monthlyRevenue * 1.2 - monthlyBurn) / 1000).toFixed(0)}K
                </Text>
                <Text className="text-emerald-600 dark:text-emerald-400 text-xs mt-1">
                  Cash positive! Revenue covers all costs
                </Text>
              </View>
            </View>
          )}

          {/* Unit Economics */}
          <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
            <Text className="text-blue-900 dark:text-blue-100 font-bold text-base mb-3">
              Unit Economics
            </Text>
            <View className="gap-2">
              <View className="flex-row justify-between">
                <Text className="text-blue-800 dark:text-blue-200 text-sm">CAC (Customer Acquisition Cost)</Text>
                <Text className="text-blue-900 dark:text-blue-100 font-bold">£{INITIAL_DATA.metrics.cac}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-blue-800 dark:text-blue-200 text-sm">LTV (Lifetime Value)</Text>
                <Text className="text-blue-900 dark:text-blue-100 font-bold">£{INITIAL_DATA.metrics.ltv}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-blue-800 dark:text-blue-200 text-sm">LTV:CAC Ratio</Text>
                <Text className="text-blue-900 dark:text-blue-100 font-bold">
                  {(INITIAL_DATA.metrics.ltv / INITIAL_DATA.metrics.cac).toFixed(1)}x
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-blue-800 dark:text-blue-200 text-sm">Gross Margin</Text>
                <Text className="text-blue-900 dark:text-blue-100 font-bold">{INITIAL_DATA.metrics.grossMargin}%</Text>
              </View>
            </View>
          </View>

          {/* Revenue Streams */}
          <View className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 border border-gray-300 dark:border-slate-800 mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-gray-900 dark:text-white font-bold text-base">Revenue Streams</Text>
              <Text className="text-emerald-500 font-bold text-lg">
                £{(INITIAL_DATA.monthlyRevenue / 1000).toFixed(0)}K/mo
              </Text>
            </View>
            <View className="gap-3">
              {INITIAL_DATA.revenueStreams.map((stream, idx) => (
                <View key={idx} className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-gray-900 dark:text-white font-semibold text-sm">{stream.name}</Text>
                    <View className="flex-row items-center mt-1">
                      {stream.growth >= 0 ? (
                        <TrendingUp size={12} color="#10b981" />
                      ) : (
                        <TrendingDown size={12} color="#ef4444" />
                      )}
                      <Text className={`text-xs ml-1 ${stream.growth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {stream.growth >= 0 ? '+' : ''}{stream.growth}% MoM
                      </Text>
                    </View>
                  </View>
                  <Text className="text-gray-900 dark:text-white font-bold">
                    £{(stream.amount / 1000).toFixed(0)}K
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Cost Categories */}
          {renderCostCategory('Team Costs', <Users size={20} color="#3b82f6" />, '#3b82f6', costs.team, 'team', totalTeam)}
          {renderCostCategory('Manufacturing & Suppliers', <Factory size={20} color="#a855f7" />, '#a855f7', costs.manufacturing, 'manufacturing', totalManufacturing)}
          {renderCostCategory('AI Tools & Software', <Cpu size={20} color="#06b6d4" />, '#06b6d4', costs.aiTools, 'aiTools', totalAI)}
          {renderCostCategory('Infrastructure & Cloud', <Zap size={20} color="#f59e0b" />, '#f59e0b', costs.infrastructure, 'infrastructure', totalInfrastructure)}
          {renderCostCategory('Marketing & Sales', <ShoppingCart size={20} color="#ec4899" />, '#ec4899', costs.marketing, 'marketing', totalMarketing)}
          {renderCostCategory('Facilities & Office', <Building size={20} color="#8b5cf6" />, '#8b5cf6', costs.facilities, 'facilities', totalFacilities)}
          {renderCostCategory('Equipment & Hardware', <Laptop size={20} color="#14b8a6" />, '#14b8a6', costs.equipment, 'equipment', totalEquipment)}
          {renderCostCategory('Insurance & Protection', <Shield size={20} color="#f97316" />, '#f97316', costs.insurance, 'insurance', totalInsurance)}
          {renderCostCategory('Professional Services', <FileText size={20} color="#84cc16" />, '#84cc16', costs.professional, 'professional', totalProfessional)}

          {/* Summary */}
          <View className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl p-4 mb-4">
            <View className="flex-row items-center mb-3">
              <AlertCircle size={20} color="#a855f7" />
              <Text className="text-purple-900 dark:text-purple-100 font-bold text-base ml-2">Financial Summary</Text>
            </View>
            <Text className="text-purple-800 dark:text-purple-200 text-sm mb-2">
              • Total Monthly Burn: £{(monthlyBurn / 1000).toFixed(0)}K across {Object.values(costs).flat().filter(i => i.enabled).length} active cost items
            </Text>
            <Text className="text-purple-800 dark:text-purple-200 text-sm mb-2">
              • Current Runway: {runway.toFixed(1)} months at current burn rate
            </Text>
            <Text className="text-purple-800 dark:text-purple-200 text-sm mb-2">
              • Monthly Cash Flow: {netCashFlow >= 0 ? 'Positive' : 'Negative'} £{Math.abs(netCashFlow / 1000).toFixed(0)}K
            </Text>
            <Text className="text-purple-800 dark:text-purple-200 text-sm">
              • Toggle costs on/off to see impact on runway and burn rate
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Edit Cost Modal */}
      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <View className="flex-1 bg-black/70 justify-center items-center px-6">
            <View className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full">
              <Text className="text-gray-900 dark:text-white text-xl font-bold mb-4">
                Edit Cost Amount
              </Text>

              {editingItem && (
                <>
                  <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">
                    {editingItem.item.name}
                  </Text>

                  <View className="bg-gray-100 dark:bg-slate-800 rounded-xl p-4 mb-4">
                    <Text className="text-gray-600 dark:text-slate-400 text-xs mb-2">Monthly Amount (£)</Text>
                    <TextInput
                      value={editAmount}
                      onChangeText={setEditAmount}
                      keyboardType="numeric"
                      className="text-gray-900 dark:text-white text-2xl font-bold"
                      placeholder="0"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>

                  <View className="flex-row gap-3">
                    <Pressable
                      onPress={() => setShowEditModal(false)}
                      className="flex-1 bg-gray-300 dark:bg-slate-700 rounded-xl py-3 items-center active:opacity-80"
                    >
                      <Text className="text-gray-700 dark:text-slate-300 font-bold">Cancel</Text>
                    </Pressable>
                    <Pressable
                      onPress={saveEdit}
                      className="flex-1 bg-blue-500 rounded-xl py-3 items-center active:opacity-80"
                    >
                      <View className="flex-row items-center">
                        <Save size={18} color="#fff" />
                        <Text className="text-white font-bold ml-2">Save</Text>
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
