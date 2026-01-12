import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import {
  Target,
  Users,
  Briefcase,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Bot,
  Factory,
  ArrowRight,
  BarChart3,
  Zap,
  Award,
  Sparkles,
  Building2,
} from 'lucide-react-native';
import { useCurrentWorkspace, useCurrentMembership, useCurrentUser } from '@/lib/state/app-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import type { Function as BusinessFunction } from '@/types';

// Demo data for the dashboard
const FOUNDER_DATA = {
  okrs: {
    total: 8,
    onTrack: 6,
    atRisk: 2,
    offTrack: 0,
  },
  workPlans: {
    total: 12,
    inProgress: 8,
    completed: 3,
    blocked: 1,
  },
  team: {
    executives: 5,
    apprentices: 8,
    suppliers: 3,
  },
  financials: {
    runway: 14.2,
    burnRate: 85000,
    revenue: 312000,
  },
  pendingApprovals: 3,
};

const EXECUTIVE_DATA = {
  myWorkPlans: {
    total: 3,
    inProgress: 2,
    completed: 1,
  },
  apprentices: [
    { name: 'Emily Carter', workPlans: 2, progress: 75 },
    { name: 'David Kim', workPlans: 1, progress: 40 },
  ],
  pendingReviews: 2,
  myFunction: 'Marketing' as BusinessFunction,
  linkedOKRs: 2,
  aiUsage: {
    thisWeek: 12,
    tools: ['ChatGPT', 'Midjourney', 'Claude'],
  },
  suppliers: [
    { name: 'TechFab Manufacturing', status: 'active' },
  ],
};

const APPRENTICE_DATA = {
  myWorkPlans: {
    active: 3,
    completed: 5,
  },
  assignedBy: {
    executive: 'Priya Sharma',
    founder: 'Sarah Johnson',
  },
  linkedOKR: {
    title: 'Build Brand Awareness & Generate Leads',
    function: 'Marketing' as BusinessFunction,
    progress: 65,
  },
  recentWork: [
    { title: 'Social Media Content Calendar', progress: 80, dueDate: '2026-01-20' },
    { title: 'Competitor Research', progress: 45, dueDate: '2026-01-25' },
    { title: 'Email Campaign Design', progress: 100, dueDate: '2026-01-15' },
  ],
  aiTools: ['ChatGPT', 'Canva AI', 'Grammarly'],
  teamMembers: [
    { name: 'Priya Sharma', role: 'Executive', function: 'Marketing' },
    { name: 'Sarah Johnson', role: 'Founder' },
  ],
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const currentWorkspace = useCurrentWorkspace();
  const currentMembership = useCurrentMembership();
  const currentUser = useCurrentUser();

  const [isLoading] = useState(false);

  if (isLoading) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!currentMembership || !currentWorkspace) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-950 items-center justify-center p-6">
        <Text className="text-gray-600 dark:text-slate-400 text-center">
          No workspace selected
        </Text>
      </View>
    );
  }

  const role = currentMembership.role;
  const isFounder = role === 'Founder';
  const isExecutive = role === 'FractionalExec';
  const isApprentice = role === 'Apprentice';

  console.log('Home Tab - User Role Check:', {
    userName: currentUser?.name,
    userEmail: currentUser?.email,
    membershipRole: currentMembership.role,
    isFounder,
    isExecutive,
    isApprentice,
  });

  const getRoleColor = () => {
    if (isFounder) return '#8b5cf6';
    if (isExecutive) return '#3b82f6';
    return '#10b981';
  };

  const getRoleGradient = (): [string, string] => {
    if (isFounder) return ['#8b5cf6', '#6366f1'];
    if (isExecutive) return ['#3b82f6', '#2563eb'];
    return ['#10b981', '#059669'];
  };

  const getFunctionColor = (func: BusinessFunction) => {
    switch (func) {
      case 'Marketing':
        return '#f59e0b';
      case 'Sales':
        return '#ec4899';
      case 'Engineering':
        return '#3b82f6';
      case 'Ops':
        return '#8b5cf6';
      case 'Finance':
        return '#10b981';
      case 'Admin':
        return '#64748b';
      default:
        return '#64748b';
    }
  };

  // Founder View
  if (isFounder) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-950" style={{ paddingTop: insets.top }}>
        {/* Role Header */}
        <LinearGradient
          colors={getRoleGradient()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ paddingHorizontal: 24, paddingVertical: 20 }}
        >
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-1">
              <Text className="text-white/80 text-sm font-medium">FOUNDER COMMAND CENTER</Text>
              <Text className="text-white text-2xl font-bold mt-1">
                {currentWorkspace.name}
              </Text>
            </View>
            <View className="bg-white/20 px-3 py-1.5 rounded-full">
              <Text className="text-white text-xs font-bold">FOUNDER</Text>
            </View>
          </View>
          <Text className="text-white/90 text-sm">
            Overall company oversight • Strategy • Approvals
          </Text>
        </LinearGradient>

        <ScrollView className="flex-1">
          <View className="px-6 py-4">
            {/* Quick Stats */}
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1 bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 border border-purple-200 dark:border-purple-800">
                <Text className="text-purple-700 dark:text-purple-300 text-xs font-semibold mb-1">
                  RUNWAY
                </Text>
                <Text className="text-purple-900 dark:text-purple-100 text-2xl font-bold">
                  {FOUNDER_DATA.financials.runway}
                </Text>
                <Text className="text-purple-600 dark:text-purple-400 text-xs">months</Text>
              </View>
              <View className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800">
                <Text className="text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-1">
                  OKRs ON TRACK
                </Text>
                <Text className="text-emerald-900 dark:text-emerald-100 text-2xl font-bold">
                  {FOUNDER_DATA.okrs.onTrack}/{FOUNDER_DATA.okrs.total}
                </Text>
                <Text className="text-emerald-600 dark:text-emerald-400 text-xs">75% healthy</Text>
              </View>
            </View>

            {/* Pending Approvals */}
            {FOUNDER_DATA.pendingApprovals > 0 && (
              <Pressable
                onPress={() => router.push('/(tabs)/decide')}
                className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700 rounded-2xl p-4 mb-4 active:opacity-70"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 bg-amber-500 rounded-full items-center justify-center">
                      <AlertCircle size={24} color="#fff" />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-amber-900 dark:text-amber-100 font-bold text-base">
                        {FOUNDER_DATA.pendingApprovals} Pending Approvals
                      </Text>
                      <Text className="text-amber-700 dark:text-amber-300 text-sm">
                        Resource allocation requests need review
                      </Text>
                    </View>
                  </View>
                  <ArrowRight size={20} color="#f59e0b" />
                </View>
              </Pressable>
            )}

            {/* OKRs by Function */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-gray-900 dark:text-white text-lg font-bold">
                  OKRs by Function
                </Text>
                <Pressable onPress={() => router.push('/(tabs)/decide')}>
                  <Text className="text-blue-500 text-sm font-semibold">View All</Text>
                </Pressable>
              </View>

              <View className="gap-2">
                {[
                  { function: 'Marketing', okrs: 1, status: 'on-track', progress: 65 },
                  { function: 'Sales', okrs: 1, status: 'on-track', progress: 67 },
                  { function: 'Engineering', okrs: 2, status: 'at-risk', progress: 58 },
                  { function: 'Ops', okrs: 1, status: 'on-track', progress: 72 },
                  { function: 'Finance', okrs: 2, status: 'on-track', progress: 80 },
                  { function: 'Admin', okrs: 1, status: 'on-track', progress: 75 },
                ].map((item, idx) => {
                  const functionColor = getFunctionColor(item.function as BusinessFunction);
                  return (
                    <Pressable
                      key={idx}
                      onPress={() => router.push({
                        pathname: '/(tabs)/decide',
                        params: { function: item.function }
                      })}
                      className="bg-gray-100 dark:bg-slate-900 rounded-xl p-3 active:opacity-70"
                    >
                      <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row items-center flex-1">
                          <View
                            className="w-8 h-8 rounded-lg items-center justify-center"
                            style={{ backgroundColor: functionColor + '20' }}
                          >
                            <Target size={16} color={functionColor} />
                          </View>
                          <View className="ml-3 flex-1">
                            <Text className="text-gray-900 dark:text-white font-semibold text-sm">
                              {item.function}
                            </Text>
                            <Text className="text-gray-600 dark:text-slate-400 text-xs">
                              {item.okrs} OKR{item.okrs !== 1 ? 's' : ''} • {item.status.replace('-', ' ')}
                            </Text>
                          </View>
                        </View>
                        <Text className="text-gray-900 dark:text-white font-bold text-base">
                          {item.progress}%
                        </Text>
                      </View>
                      <View className="bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <View
                          className="h-full bg-emerald-500"
                          style={{ width: `${item.progress}%` }}
                        />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Work Plans Overview */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <View>
                  <Text className="text-gray-900 dark:text-white text-lg font-bold">
                    Work Plans
                  </Text>
                  <Text className="text-gray-600 dark:text-slate-400 text-xs mt-0.5">
                    Structured tasks assigned to apprentices
                  </Text>
                </View>
                <Pressable onPress={() => router.push('/(tabs)/do')}>
                  <Text className="text-blue-500 text-sm font-semibold">View All</Text>
                </Pressable>
              </View>

              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => router.push('/(tabs)/do')}
                  className="flex-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 active:opacity-70"
                >
                  <Briefcase size={24} color="#3b82f6" />
                  <Text className="text-blue-900 dark:text-blue-100 text-2xl font-bold mt-2">
                    {FOUNDER_DATA.workPlans.inProgress}
                  </Text>
                  <Text className="text-blue-600 dark:text-blue-400 text-xs">Active Now</Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push('/(tabs)/evaluate')}
                  className="flex-1 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 active:opacity-70"
                >
                  <Clock size={24} color="#a855f7" />
                  <Text className="text-purple-900 dark:text-purple-100 text-2xl font-bold mt-2">
                    {FOUNDER_DATA.workPlans.total}
                  </Text>
                  <Text className="text-purple-600 dark:text-purple-400 text-xs">Total Active</Text>
                </Pressable>
              </View>
            </View>

            {/* Team Overview */}
            <View className="mb-4">
              <Text className="text-gray-900 dark:text-white text-lg font-bold mb-3">
                Team
              </Text>

              <View className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 border border-gray-300 dark:border-slate-800">
                <Pressable
                  onPress={() => router.push('/org-diagram')}
                  className="flex-row items-center justify-between mb-3 active:opacity-70"
                >
                  <View className="flex-row items-center">
                    <Users size={20} color="#3b82f6" />
                    <Text className="text-gray-900 dark:text-white font-semibold ml-2">
                      {FOUNDER_DATA.team.executives} Executives
                    </Text>
                  </View>
                  <ArrowRight size={20} color="#3b82f6" />
                </Pressable>

                <Pressable
                  onPress={() => router.push('/org-diagram')}
                  className="flex-row items-center justify-between mb-3 active:opacity-70"
                >
                  <View className="flex-row items-center">
                    <Award size={20} color="#10b981" />
                    <Text className="text-gray-900 dark:text-white font-semibold ml-2">
                      {FOUNDER_DATA.team.apprentices} Apprentices
                    </Text>
                  </View>
                  <ArrowRight size={20} color="#10b981" />
                </Pressable>

                <Pressable
                  onPress={() => router.push('/(tabs)/make')}
                  className="flex-row items-center justify-between active:opacity-70"
                >
                  <View className="flex-row items-center">
                    <Factory size={20} color="#f59e0b" />
                    <Text className="text-gray-900 dark:text-white font-semibold ml-2">
                      {FOUNDER_DATA.team.suppliers} Suppliers
                    </Text>
                  </View>
                  <ArrowRight size={20} color="#f59e0b" />
                </Pressable>
              </View>

              {/* View Org Chart Button */}
              <Pressable
                onPress={() => router.push('/org-diagram')}
                className="bg-blue-500 rounded-xl py-3 mt-3 items-center active:opacity-80"
              >
                <View className="flex-row items-center">
                  <Building2 size={18} color="#fff" />
                  <Text className="text-white font-bold ml-2">View Organization Chart</Text>
                </View>
              </Pressable>
            </View>

            {/* Financial Overview */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-gray-900 dark:text-white text-lg font-bold">
                  Financial Overview
                </Text>
                <Pressable onPress={() => router.push('/financial-dashboard')}>
                  <Text className="text-blue-500 text-sm font-semibold">Full Dashboard</Text>
                </Pressable>
              </View>

              <Pressable
                onPress={() => router.push('/financial-dashboard')}
                className="active:opacity-80"
              >
                <LinearGradient
                  colors={['#10b981', '#14b8a6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 16, padding: 16, marginBottom: 12 }}
                >
                  <View className="flex-row items-center justify-between mb-4">
                    <View>
                      <Text className="text-emerald-100 text-xs font-semibold mb-1">RUNWAY</Text>
                      <Text className="text-white text-3xl font-bold">
                        {FOUNDER_DATA.financials.runway} months
                      </Text>
                    </View>
                    <BarChart3 size={32} color="#fff" />
                  </View>

                  <View className="h-px bg-white/20 mb-3" />

                  <View className="flex-row gap-4 mb-2">
                    <View className="flex-1">
                      <Text className="text-emerald-100 text-xs mb-1">Monthly Revenue</Text>
                      <Text className="text-white text-lg font-bold">
                        £{(FOUNDER_DATA.financials.revenue / 1000).toFixed(0)}K
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-emerald-100 text-xs mb-1">Monthly Burn</Text>
                      <Text className="text-white text-lg font-bold">
                        £{(FOUNDER_DATA.financials.burnRate / 1000).toFixed(0)}K
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row gap-4 mb-2">
                    <View className="flex-1">
                      <Text className="text-emerald-100 text-xs mb-1">Net Cash Flow</Text>
                      <Text className="text-white text-lg font-bold">
                        {FOUNDER_DATA.financials.revenue - FOUNDER_DATA.financials.burnRate >= 0 ? '+' : '-'}£{Math.abs(FOUNDER_DATA.financials.revenue - FOUNDER_DATA.financials.burnRate / 1000).toFixed(0)}K
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-emerald-100 text-xs mb-1">Cash Position</Text>
                      <Text className="text-white text-lg font-bold">
                        £{((FOUNDER_DATA.financials.runway * FOUNDER_DATA.financials.burnRate) / 1000).toFixed(0)}K
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-center mt-2">
                    <Text className="text-white text-sm font-semibold">Tap for detailed breakdown</Text>
                    <ArrowRight size={16} color="#fff" className="ml-1" />
                  </View>
                </LinearGradient>
              </Pressable>

              {/* Cost Breakdown */}
              <Pressable
                onPress={() => router.push('/financial-dashboard')}
                className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 border border-gray-300 dark:border-slate-800 active:opacity-70"
              >
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-gray-900 dark:text-white font-bold text-sm">
                    Monthly Cost Breakdown
                  </Text>
                  <ArrowRight size={20} color="#64748b" />
                </View>

                <View className="gap-3">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                      <Text className="text-gray-700 dark:text-slate-300 text-sm">Team (5 Execs + 8 Apprentices)</Text>
                    </View>
                    <Text className="text-gray-900 dark:text-white font-bold text-sm">£52K</Text>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="w-2 h-2 rounded-full bg-purple-500 mr-2" />
                      <Text className="text-gray-700 dark:text-slate-300 text-sm">Manufacturing & Suppliers</Text>
                    </View>
                    <Text className="text-gray-900 dark:text-white font-bold text-sm">£18K</Text>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="w-2 h-2 rounded-full bg-cyan-500 mr-2" />
                      <Text className="text-gray-700 dark:text-slate-300 text-sm">AI Tools & Software</Text>
                    </View>
                    <Text className="text-gray-900 dark:text-white font-bold text-sm">£3K</Text>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="w-2 h-2 rounded-full bg-amber-500 mr-2" />
                      <Text className="text-gray-700 dark:text-slate-300 text-sm">Infrastructure & Ops</Text>
                    </View>
                    <Text className="text-gray-900 dark:text-white font-bold text-sm">£7K</Text>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="w-2 h-2 rounded-full bg-pink-500 mr-2" />
                      <Text className="text-gray-700 dark:text-slate-300 text-sm">Marketing & Sales</Text>
                    </View>
                    <Text className="text-gray-900 dark:text-white font-bold text-sm">£5K</Text>
                  </View>

                  <View className="h-px bg-gray-300 dark:bg-slate-700 my-1" />

                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-900 dark:text-white font-bold text-sm">Total Monthly Burn</Text>
                    <Text className="text-gray-900 dark:text-white font-bold text-base">£85K</Text>
                  </View>
                </View>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Executive View
  if (isExecutive) {
    const functionColor = getFunctionColor(EXECUTIVE_DATA.myFunction);

    return (
      <View className="flex-1 bg-white dark:bg-slate-950" style={{ paddingTop: insets.top }}>
        {/* Role Header */}
        <LinearGradient
          colors={getRoleGradient()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ paddingHorizontal: 24, paddingVertical: 20 }}
        >
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-1">
              <Text className="text-white/80 text-sm font-medium">EXECUTIVE DASHBOARD</Text>
              <Text className="text-white text-2xl font-bold mt-1">
                {EXECUTIVE_DATA.myFunction}
              </Text>
            </View>
            <View className="bg-white/20 px-3 py-1.5 rounded-full">
              <Text className="text-white text-xs font-bold">EXECUTIVE</Text>
            </View>
          </View>
          <Text className="text-white/90 text-sm">
            Evaluate • Create work plans • Review apprentice work
          </Text>
        </LinearGradient>

        <ScrollView className="flex-1">
          <View className="px-6 py-4">
            {/* Pending Reviews Alert */}
            {EXECUTIVE_DATA.pendingReviews > 0 && (
              <Pressable
                onPress={() => router.push('/(tabs)/evaluate')}
                className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-2xl p-4 mb-4 active:opacity-70"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 bg-purple-500 rounded-full items-center justify-center">
                      <AlertCircle size={24} color="#fff" />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-purple-900 dark:text-purple-100 font-bold text-base">
                        {EXECUTIVE_DATA.pendingReviews} Work Submissions to Review
                      </Text>
                      <Text className="text-purple-700 dark:text-purple-300 text-sm">
                        Apprentices waiting for your feedback
                      </Text>
                    </View>
                  </View>
                  <ArrowRight size={20} color="#a855f7" />
                </View>
              </Pressable>
            )}

            {/* My Work Plans */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-gray-900 dark:text-white text-lg font-bold">
                  My Work Plans
                </Text>
                <Pressable onPress={() => router.push('/(tabs)/evaluate')}>
                  <Text className="text-blue-500 text-sm font-semibold">Manage</Text>
                </Pressable>
              </View>

              <View className="flex-row gap-3 mb-3">
                <View className="flex-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                  <Text className="text-blue-700 dark:text-blue-300 text-xs font-semibold mb-1">
                    IN PROGRESS
                  </Text>
                  <Text className="text-blue-900 dark:text-blue-100 text-2xl font-bold">
                    {EXECUTIVE_DATA.myWorkPlans.inProgress}
                  </Text>
                </View>
                <View className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3">
                  <Text className="text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-1">
                    COMPLETED
                  </Text>
                  <Text className="text-emerald-900 dark:text-emerald-100 text-2xl font-bold">
                    {EXECUTIVE_DATA.myWorkPlans.completed}
                  </Text>
                </View>
              </View>
            </View>

            {/* My OKRs */}
            <View className="mb-4">
              <Text className="text-gray-900 dark:text-white text-lg font-bold mb-3">
                My Function OKRs
              </Text>

              <Pressable
                onPress={() => router.push({
                  pathname: '/(tabs)/decide',
                  params: { function: EXECUTIVE_DATA.myFunction }
                })}
                className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 border border-gray-300 dark:border-slate-800 active:opacity-70"
              >
                <View className="flex-row items-center mb-2">
                  <View
                    className="w-10 h-10 rounded-lg items-center justify-center"
                    style={{ backgroundColor: functionColor + '20' }}
                  >
                    <Target size={20} color={functionColor} />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-gray-900 dark:text-white font-bold text-base">
                      {EXECUTIVE_DATA.myFunction}
                    </Text>
                    <Text className="text-gray-600 dark:text-slate-400 text-sm">
                      {EXECUTIVE_DATA.linkedOKRs} linked OKRs
                    </Text>
                  </View>
                  <ArrowRight size={20} color="#64748b" />
                </View>
              </Pressable>
            </View>

            {/* My Apprentices */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-gray-900 dark:text-white text-lg font-bold">
                  My Apprentices
                </Text>
                <Pressable onPress={() => router.push('/(tabs)/do')}>
                  <Text className="text-blue-500 text-sm font-semibold">View Work</Text>
                </Pressable>
              </View>

              <View className="gap-2">
                {EXECUTIVE_DATA.apprentices.map((apprentice, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => router.push('/(tabs)/do')}
                    className="bg-gray-100 dark:bg-slate-900 rounded-xl p-3 active:opacity-70"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center flex-1">
                        <View className="w-8 h-8 bg-emerald-500 rounded-full items-center justify-center">
                          <Text className="text-white text-xs font-bold">
                            {apprentice.name.split(' ').map(n => n[0]).join('')}
                          </Text>
                        </View>
                        <View className="ml-3 flex-1">
                          <Text className="text-gray-900 dark:text-white font-semibold text-sm">
                            {apprentice.name}
                          </Text>
                          <Text className="text-gray-600 dark:text-slate-400 text-xs">
                            {apprentice.workPlans} work plan{apprentice.workPlans !== 1 ? 's' : ''}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-gray-900 dark:text-white font-bold text-sm">
                        {apprentice.progress}%
                      </Text>
                    </View>
                    <View className="bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <View
                        className="h-full bg-emerald-500"
                        style={{ width: `${apprentice.progress}%` }}
                      />
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Resources in Use */}
            <View className="mb-4">
              <Text className="text-gray-900 dark:text-white text-lg font-bold mb-3">
                Resources in Use
              </Text>

              <View className="bg-gray-100 dark:bg-slate-900 rounded-xl border border-gray-300 dark:border-slate-800 overflow-hidden">
                <Pressable
                  onPress={() => router.push('/(tabs)/make')}
                  className="p-4 active:opacity-70"
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                      <Bot size={20} color="#8b5cf6" />
                      <Text className="text-gray-900 dark:text-white font-semibold ml-2">
                        AI Tools This Week
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Text className="text-gray-900 dark:text-white font-bold mr-2">
                        {EXECUTIVE_DATA.aiUsage.thisWeek}
                      </Text>
                      <ArrowRight size={16} color="#64748b" />
                    </View>
                  </View>
                  <View className="flex-row flex-wrap gap-2">
                    {EXECUTIVE_DATA.aiUsage.tools.map((tool, idx) => (
                      <View key={idx} className="bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded">
                        <Text className="text-purple-700 dark:text-purple-300 text-xs">{tool}</Text>
                      </View>
                    ))}
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => router.push('/(tabs)/make')}
                  className="p-4 border-t border-gray-300 dark:border-slate-700 active:opacity-70"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Factory size={20} color="#f59e0b" />
                      <Text className="text-gray-900 dark:text-white font-semibold ml-2">
                        Suppliers
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Text className="text-gray-900 dark:text-white font-bold mr-2">
                        {EXECUTIVE_DATA.suppliers.length}
                      </Text>
                      <ArrowRight size={16} color="#64748b" />
                    </View>
                  </View>
                </Pressable>
              </View>
            </View>

            {/* Quick Actions */}
            <View className="flex-row gap-3 mb-4">
              <Pressable
                onPress={() => router.push('/(tabs)/evaluate')}
                className="flex-1 bg-blue-500 rounded-xl p-4 active:opacity-70"
              >
                <Briefcase size={24} color="#fff" />
                <Text className="text-white font-bold text-sm mt-2">Create Work Plan</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/(tabs)/make')}
                className="flex-1 bg-purple-500 rounded-xl p-4 active:opacity-70"
              >
                <Sparkles size={24} color="#fff" />
                <Text className="text-white font-bold text-sm mt-2">AI Tools</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Apprentice View
  if (isApprentice) {
    const functionColor = getFunctionColor(APPRENTICE_DATA.linkedOKR.function);

    return (
      <View className="flex-1 bg-white dark:bg-slate-950" style={{ paddingTop: insets.top }}>
        {/* Role Header */}
        <LinearGradient
          colors={getRoleGradient()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ paddingHorizontal: 24, paddingVertical: 20 }}
        >
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-1">
              <Text className="text-white/80 text-sm font-medium">APPRENTICE WORKSPACE</Text>
              <Text className="text-white text-2xl font-bold mt-1">
                My Work
              </Text>
            </View>
            <View className="bg-white/20 px-3 py-1.5 rounded-full">
              <Text className="text-white text-xs font-bold">APPRENTICE</Text>
            </View>
          </View>
          <Text className="text-white/90 text-sm">
            Execute • Learn • Deliver results
          </Text>
        </LinearGradient>

        <ScrollView className="flex-1">
          <View className="px-6 py-4">
            {/* My Active Work */}
            <View className="mb-4">
              <Text className="text-gray-900 dark:text-white text-lg font-bold mb-3">
                My Active Work
              </Text>

              <View className="flex-row gap-3 mb-3">
                <View className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3">
                  <Text className="text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-1">
                    ACTIVE
                  </Text>
                  <Text className="text-emerald-900 dark:text-emerald-100 text-2xl font-bold">
                    {APPRENTICE_DATA.myWorkPlans.active}
                  </Text>
                </View>
                <View className="flex-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                  <Text className="text-blue-700 dark:text-blue-300 text-xs font-semibold mb-1">
                    COMPLETED
                  </Text>
                  <Text className="text-blue-900 dark:text-blue-100 text-2xl font-bold">
                    {APPRENTICE_DATA.myWorkPlans.completed}
                  </Text>
                </View>
              </View>
            </View>

            {/* Linked OKR */}
            <View className="mb-4">
              <Text className="text-gray-900 dark:text-white text-lg font-bold mb-3">
                My Objective
              </Text>

              <Pressable
                onPress={() => router.push('/(tabs)/decide')}
                className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 active:opacity-70"
              >
                <View className="flex-row items-center mb-3">
                  <View
                    className="w-10 h-10 rounded-lg items-center justify-center"
                    style={{ backgroundColor: functionColor + '20' }}
                  >
                    <Target size={20} color={functionColor} />
                  </View>
                  <View className="ml-3 flex-1">
                    <View className="flex-row items-center mb-1">
                      <Text
                        className="text-xs font-bold px-2 py-0.5 rounded"
                        style={{ backgroundColor: functionColor + '20', color: functionColor }}
                      >
                        {APPRENTICE_DATA.linkedOKR.function}
                      </Text>
                    </View>
                    <Text className="text-gray-900 dark:text-white font-bold text-sm">
                      {APPRENTICE_DATA.linkedOKR.title}
                    </Text>
                  </View>
                </View>
                <View className="bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden mb-1">
                  <View
                    className="h-full bg-emerald-500"
                    style={{ width: `${APPRENTICE_DATA.linkedOKR.progress}%` }}
                  />
                </View>
                <Text className="text-gray-600 dark:text-slate-400 text-xs">
                  {APPRENTICE_DATA.linkedOKR.progress}% progress • Your work contributes to this
                </Text>
              </Pressable>
            </View>

            {/* Recent Work */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-gray-900 dark:text-white text-lg font-bold">
                  Recent Work
                </Text>
                <Pressable onPress={() => router.push('/(tabs)/do')}>
                  <Text className="text-blue-500 text-sm font-semibold">View All</Text>
                </Pressable>
              </View>

              <View className="gap-2">
                {APPRENTICE_DATA.recentWork.map((work, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => router.push('/(tabs)/do')}
                    className="bg-gray-100 dark:bg-slate-900 rounded-xl p-3 active:opacity-70"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-1">
                        <Text className="text-gray-900 dark:text-white font-semibold text-sm mb-1">
                          {work.title}
                        </Text>
                        <View className="flex-row items-center">
                          <Clock size={12} color="#64748b" />
                          <Text className="text-gray-600 dark:text-slate-400 text-xs ml-1">
                            Due {work.dueDate}
                          </Text>
                        </View>
                      </View>
                      <View className="items-end">
                        {work.progress === 100 ? (
                          <CheckCircle2 size={20} color="#10b981" />
                        ) : (
                          <Text className="text-gray-900 dark:text-white font-bold text-sm">
                            {work.progress}%
                          </Text>
                        )}
                      </View>
                    </View>
                    {work.progress < 100 && (
                      <View className="bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <View
                          className="h-full bg-blue-500"
                          style={{ width: `${work.progress}%` }}
                        />
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* My Team */}
            <View className="mb-4">
              <Text className="text-gray-900 dark:text-white text-lg font-bold mb-3">
                Working With
              </Text>

              <Pressable
                onPress={() => router.push('/(tabs)/community')}
                className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 border border-gray-300 dark:border-slate-800 active:opacity-70"
              >
                {APPRENTICE_DATA.teamMembers.map((member, idx) => (
                  <View key={idx} className={`flex-row items-center justify-between ${idx > 0 ? 'pt-3 mt-3 border-t border-gray-300 dark:border-slate-700' : ''}`}>
                    <View className="flex-row items-center flex-1">
                      <View className={`w-10 h-10 rounded-full items-center justify-center ${
                        member.role === 'Executive' ? 'bg-blue-500' : 'bg-purple-500'
                      }`}>
                        <Text className="text-white text-xs font-bold">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </Text>
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-gray-900 dark:text-white font-semibold text-sm">
                          {member.name}
                        </Text>
                        <Text className="text-gray-600 dark:text-slate-400 text-xs">
                          {member.role}{member.function ? ` • ${member.function}` : ''}
                        </Text>
                      </View>
                    </View>
                    {idx === APPRENTICE_DATA.teamMembers.length - 1 && (
                      <ArrowRight size={16} color="#64748b" />
                    )}
                  </View>
                ))}
              </Pressable>
            </View>

            {/* AI Tools */}
            <View className="mb-4">
              <Text className="text-gray-900 dark:text-white text-lg font-bold mb-3">
                My AI Tools
              </Text>

              <Pressable
                onPress={() => router.push('/(tabs)/make')}
                className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl active:opacity-70"
              >
                <LinearGradient
                  colors={['#8b5cf6', '#6366f1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 12, padding: 16 }}
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                      <Bot size={24} color="#fff" />
                      <Text className="text-white font-bold text-base ml-2">
                        AI Tools Available
                      </Text>
                    </View>
                    <ArrowRight size={20} color="#fff" />
                  </View>
                  <View className="flex-row flex-wrap gap-2">
                    {APPRENTICE_DATA.aiTools.map((tool, idx) => (
                      <View key={idx} className="bg-white/20 px-3 py-1 rounded-full">
                        <Text className="text-white text-xs font-semibold">{tool}</Text>
                      </View>
                    ))}
                  </View>
                </LinearGradient>
              </Pressable>
            </View>

            {/* Quick Actions */}
            <View className="flex-row gap-3 mb-4">
              <Pressable
                onPress={() => router.push('/(tabs)/do')}
                className="flex-1 bg-emerald-500 rounded-xl p-4 active:opacity-70"
              >
                <Zap size={24} color="#fff" />
                <Text className="text-white font-bold text-sm mt-2">Report Progress</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/(tabs)/do')}
                className="flex-1 bg-blue-500 rounded-xl p-4 active:opacity-70"
              >
                <CheckCircle2 size={24} color="#fff" />
                <Text className="text-white font-bold text-sm mt-2">Submit Work</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return null;
}
