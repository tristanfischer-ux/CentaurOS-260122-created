import { View, Text, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { X, TrendingUp, TrendingDown, DollarSign, Users, Cpu, Factory, Zap, ShoppingCart, BarChart3, AlertCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Detailed financial data
const FINANCIAL_DATA = {
  runway: 14.2,
  cashPosition: 1207000,
  monthlyRevenue: 312000,
  monthlyBurn: 85000,

  // Revenue breakdown
  revenueStreams: [
    { name: 'Product Sales', amount: 185000, growth: 12 },
    { name: 'Subscriptions (MRR)', amount: 87000, growth: 8 },
    { name: 'Professional Services', amount: 28000, growth: -3 },
    { name: 'Licensing', amount: 12000, growth: 5 },
  ],

  // Cost breakdown
  costs: {
    team: {
      total: 52000,
      items: [
        { name: 'Fractional Executives (5)', amount: 35000, rate: '£7K each/month' },
        { name: 'Apprentices (8)', amount: 16000, rate: '£2K each/month' },
        { name: 'Founder Salary', amount: 1000, rate: 'Minimal draw' },
      ],
    },
    manufacturing: {
      total: 18000,
      items: [
        { name: 'TechFab Manufacturing', amount: 12000, status: 'active' },
        { name: 'UK Electronics Supply', amount: 4500, status: 'active' },
        { name: 'GlobalShip Fulfillment', amount: 1500, status: 'active' },
      ],
    },
    aiTools: {
      total: 3000,
      items: [
        { name: 'OpenAI API', amount: 1200, usage: '~40K requests/month' },
        { name: 'Anthropic Claude', amount: 800, usage: '~25K requests/month' },
        { name: 'Midjourney Pro', amount: 600, usage: 'Unlimited generations' },
        { name: 'ElevenLabs', amount: 400, usage: '500K characters/month' },
      ],
    },
    infrastructure: {
      total: 7000,
      items: [
        { name: 'AWS Cloud Hosting', amount: 3200, usage: 'Production + staging' },
        { name: 'Office & Coworking', amount: 2000, usage: '4 hot desks' },
        { name: 'Software Licenses', amount: 1200, usage: 'Figma, Linear, etc.' },
        { name: 'Communication Tools', amount: 600, usage: 'Slack, Zoom' },
      ],
    },
    marketing: {
      total: 5000,
      items: [
        { name: 'Digital Advertising', amount: 2500, roi: 'CAC: £125' },
        { name: 'Content Creation', amount: 1200, roi: '~8 pieces/month' },
        { name: 'Events & Conferences', amount: 800, roi: '2 events/quarter' },
        { name: 'SEO Tools & Services', amount: 500, roi: 'Growing organic' },
      ],
    },
  },

  // Key metrics
  metrics: {
    cac: 125, // Customer Acquisition Cost
    ltv: 3600, // Lifetime Value
    grossMargin: 68, // %
    burnMultiple: 0.27, // Burn multiple (good < 1)
  },
};

export default function FinancialDashboardScreen() {
  const insets = useSafeAreaInsets();

  const netCashFlow = FINANCIAL_DATA.monthlyRevenue - FINANCIAL_DATA.monthlyBurn;
  const grossProfit = FINANCIAL_DATA.monthlyRevenue * (FINANCIAL_DATA.metrics.grossMargin / 100);

  return (
    <View className="flex-1 bg-white dark:bg-slate-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-gray-200 dark:border-slate-800">
        <View>
          <Text className="text-gray-900 dark:text-white text-2xl font-bold">Financial Dashboard</Text>
          <Text className="text-gray-600 dark:text-slate-400 text-sm">Complete financial overview</Text>
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
                  {FINANCIAL_DATA.runway} months
                </Text>
              </View>
              <BarChart3 size={40} color="#fff" />
            </View>

            <View className="h-px bg-white/20 mb-4" />

            <View className="gap-3">
              <View className="flex-row justify-between">
                <Text className="text-emerald-100 text-sm">Cash Position</Text>
                <Text className="text-white text-lg font-bold">
                  £{(FINANCIAL_DATA.cashPosition / 1000).toFixed(0)}K
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-emerald-100 text-sm">Monthly Revenue</Text>
                <Text className="text-white text-lg font-bold">
                  £{(FINANCIAL_DATA.monthlyRevenue / 1000).toFixed(0)}K
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-emerald-100 text-sm">Monthly Burn</Text>
                <Text className="text-white text-lg font-bold">
                  £{(FINANCIAL_DATA.monthlyBurn / 1000).toFixed(0)}K
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

          {/* Unit Economics */}
          <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
            <Text className="text-blue-900 dark:text-blue-100 font-bold text-base mb-3">
              Unit Economics
            </Text>
            <View className="gap-2">
              <View className="flex-row justify-between">
                <Text className="text-blue-800 dark:text-blue-200 text-sm">CAC (Customer Acquisition Cost)</Text>
                <Text className="text-blue-900 dark:text-blue-100 font-bold">£{FINANCIAL_DATA.metrics.cac}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-blue-800 dark:text-blue-200 text-sm">LTV (Lifetime Value)</Text>
                <Text className="text-blue-900 dark:text-blue-100 font-bold">£{FINANCIAL_DATA.metrics.ltv}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-blue-800 dark:text-blue-200 text-sm">LTV:CAC Ratio</Text>
                <Text className="text-blue-900 dark:text-blue-100 font-bold">
                  {(FINANCIAL_DATA.metrics.ltv / FINANCIAL_DATA.metrics.cac).toFixed(1)}x
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-blue-800 dark:text-blue-200 text-sm">Gross Margin</Text>
                <Text className="text-blue-900 dark:text-blue-100 font-bold">{FINANCIAL_DATA.metrics.grossMargin}%</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-blue-800 dark:text-blue-200 text-sm">Burn Multiple</Text>
                <Text className="text-blue-900 dark:text-blue-100 font-bold">{FINANCIAL_DATA.metrics.burnMultiple}</Text>
              </View>
            </View>
          </View>

          {/* Revenue Streams */}
          <View className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 border border-gray-300 dark:border-slate-800 mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-gray-900 dark:text-white font-bold text-base">Revenue Streams</Text>
              <Text className="text-emerald-500 font-bold text-lg">
                £{(FINANCIAL_DATA.monthlyRevenue / 1000).toFixed(0)}K/mo
              </Text>
            </View>
            <View className="gap-3">
              {FINANCIAL_DATA.revenueStreams.map((stream, idx) => (
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

          {/* Team Costs */}
          <View className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 border border-gray-300 dark:border-slate-800 mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Users size={20} color="#3b82f6" />
                <Text className="text-gray-900 dark:text-white font-bold text-base ml-2">Team Costs</Text>
              </View>
              <Text className="text-blue-500 font-bold text-lg">£{(FINANCIAL_DATA.costs.team.total / 1000).toFixed(0)}K/mo</Text>
            </View>
            <View className="gap-3">
              {FINANCIAL_DATA.costs.team.items.map((item, idx) => (
                <View key={idx}>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-900 dark:text-white font-semibold text-sm flex-1">{item.name}</Text>
                    <Text className="text-gray-900 dark:text-white font-bold">£{(item.amount / 1000).toFixed(1)}K</Text>
                  </View>
                  <Text className="text-gray-600 dark:text-slate-400 text-xs mt-0.5">{item.rate}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Manufacturing & Suppliers */}
          <View className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 border border-gray-300 dark:border-slate-800 mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Factory size={20} color="#a855f7" />
                <Text className="text-gray-900 dark:text-white font-bold text-base ml-2">Manufacturing & Suppliers</Text>
              </View>
              <Text className="text-purple-500 font-bold text-lg">£{(FINANCIAL_DATA.costs.manufacturing.total / 1000).toFixed(0)}K/mo</Text>
            </View>
            <View className="gap-3">
              {FINANCIAL_DATA.costs.manufacturing.items.map((item, idx) => (
                <View key={idx} className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-gray-900 dark:text-white font-semibold text-sm">{item.name}</Text>
                    <View className="bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded self-start mt-1">
                      <Text className="text-emerald-700 dark:text-emerald-300 text-xs font-semibold">{item.status}</Text>
                    </View>
                  </View>
                  <Text className="text-gray-900 dark:text-white font-bold">£{(item.amount / 1000).toFixed(1)}K</Text>
                </View>
              ))}
            </View>
          </View>

          {/* AI Tools */}
          <View className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 border border-gray-300 dark:border-slate-800 mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Cpu size={20} color="#06b6d4" />
                <Text className="text-gray-900 dark:text-white font-bold text-base ml-2">AI Tools & Software</Text>
              </View>
              <Text className="text-cyan-500 font-bold text-lg">£{(FINANCIAL_DATA.costs.aiTools.total / 1000).toFixed(1)}K/mo</Text>
            </View>
            <View className="gap-3">
              {FINANCIAL_DATA.costs.aiTools.items.map((item, idx) => (
                <View key={idx}>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-900 dark:text-white font-semibold text-sm flex-1">{item.name}</Text>
                    <Text className="text-gray-900 dark:text-white font-bold">£{item.amount.toFixed(0)}</Text>
                  </View>
                  <Text className="text-gray-600 dark:text-slate-400 text-xs mt-0.5">{item.usage}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Infrastructure & Ops */}
          <View className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 border border-gray-300 dark:border-slate-800 mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Zap size={20} color="#f59e0b" />
                <Text className="text-gray-900 dark:text-white font-bold text-base ml-2">Infrastructure & Ops</Text>
              </View>
              <Text className="text-amber-500 font-bold text-lg">£{(FINANCIAL_DATA.costs.infrastructure.total / 1000).toFixed(0)}K/mo</Text>
            </View>
            <View className="gap-3">
              {FINANCIAL_DATA.costs.infrastructure.items.map((item, idx) => (
                <View key={idx}>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-900 dark:text-white font-semibold text-sm flex-1">{item.name}</Text>
                    <Text className="text-gray-900 dark:text-white font-bold">£{(item.amount / 1000).toFixed(1)}K</Text>
                  </View>
                  <Text className="text-gray-600 dark:text-slate-400 text-xs mt-0.5">{item.usage}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Marketing & Sales */}
          <View className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 border border-gray-300 dark:border-slate-800 mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <ShoppingCart size={20} color="#ec4899" />
                <Text className="text-gray-900 dark:text-white font-bold text-base ml-2">Marketing & Sales</Text>
              </View>
              <Text className="text-pink-500 font-bold text-lg">£{(FINANCIAL_DATA.costs.marketing.total / 1000).toFixed(0)}K/mo</Text>
            </View>
            <View className="gap-3">
              {FINANCIAL_DATA.costs.marketing.items.map((item, idx) => (
                <View key={idx}>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-900 dark:text-white font-semibold text-sm flex-1">{item.name}</Text>
                    <Text className="text-gray-900 dark:text-white font-bold">£{(item.amount / 1000).toFixed(1)}K</Text>
                  </View>
                  <Text className="text-gray-600 dark:text-slate-400 text-xs mt-0.5">{item.roi}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Summary */}
          <View className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl p-4 mb-4">
            <View className="flex-row items-center mb-3">
              <AlertCircle size={20} color="#a855f7" />
              <Text className="text-purple-900 dark:text-purple-100 font-bold text-base ml-2">Financial Health</Text>
            </View>
            <Text className="text-purple-800 dark:text-purple-200 text-sm mb-2">
              • Strong LTV:CAC ratio of {(FINANCIAL_DATA.metrics.ltv / FINANCIAL_DATA.metrics.cac).toFixed(1)}x (target: {'>'} 3x)
            </Text>
            <Text className="text-purple-800 dark:text-purple-200 text-sm mb-2">
              • Excellent burn multiple of {FINANCIAL_DATA.metrics.burnMultiple} (target: {'<'} 1)
            </Text>
            <Text className="text-purple-800 dark:text-purple-200 text-sm mb-2">
              • Healthy gross margin at {FINANCIAL_DATA.metrics.grossMargin}%
            </Text>
            <Text className="text-purple-800 dark:text-purple-200 text-sm">
              • Current runway: {FINANCIAL_DATA.runway} months before next fundraise
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
