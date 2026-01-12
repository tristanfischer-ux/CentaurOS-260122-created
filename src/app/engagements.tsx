import { View, Text, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Building2, Clock, DollarSign, Calendar, Users, ExternalLink } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCurrentMembership } from '@/lib/state/app-store';

interface Engagement {
  id: string;
  companyName: string;
  roleTitle: string;
  commitment: string;
  dayRate: number;
  startDate: string;
  status: 'active' | 'paused' | 'ended';
  workspaceId: string;
}

// Demo data
const DEMO_ENGAGEMENTS: Engagement[] = [
  {
    id: 'eng-1',
    companyName: 'Acme Hardware Inc',
    roleTitle: 'VP of Sales',
    commitment: '2 days/week',
    dayRate: 850,
    startDate: 'January 15, 2026',
    status: 'active',
    workspaceId: 'ws-acme',
  },
  {
    id: 'eng-2',
    companyName: 'TechForge Systems',
    roleTitle: 'CFO',
    commitment: '2 days/week',
    dayRate: 950,
    startDate: 'December 1, 2025',
    status: 'active',
    workspaceId: 'ws-techforge',
  },
  {
    id: 'eng-3',
    companyName: 'BuildRight Manufacturing',
    roleTitle: 'Head of Operations',
    commitment: '1 day/week',
    dayRate: 800,
    startDate: 'November 10, 2025',
    status: 'active',
    workspaceId: 'ws-buildright',
  },
];

export default function EngagementsScreen() {
  const insets = useSafeAreaInsets();
  const currentMembership = useCurrentMembership();
  const isExecutiveOrApprentice = currentMembership?.role === 'FractionalExec' || currentMembership?.role === 'Apprentice';

  const engagements = DEMO_ENGAGEMENTS;
  const activeEngagements = engagements.filter(e => e.status === 'active');

  // Calculate total commitment
  const totalDaysPerWeek = activeEngagements.reduce((total, eng) => {
    const match = eng.commitment.match(/(\d+)\s*days?\/week/i);
    return total + (match ? parseInt(match[1]) : 0);
  }, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/20 text-emerald-500';
      case 'paused':
        return 'bg-amber-500/20 text-amber-500';
      case 'ended':
        return 'bg-gray-500/20 text-gray-500';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <View className="flex-1 bg-white dark:bg-slate-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-300 dark:border-slate-800">
        <View className="flex-row items-center mb-2">
          <Pressable
            onPress={() => router.back()}
            className="mr-3 active:opacity-70"
          >
            <ArrowLeft size={24} color="#3b82f6" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-gray-900 dark:text-white text-xl font-bold">
              My Engagements
            </Text>
            <Text className="text-gray-600 dark:text-slate-400 text-sm mt-0.5">
              {activeEngagements.length} active {activeEngagements.length === 1 ? 'company' : 'companies'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 py-4">
        {/* Capacity Overview Card */}
        {isExecutiveOrApprentice && activeEngagements.length > 0 && (
          <View className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 mb-4">
            <Text className="text-blue-900 dark:text-blue-100 font-bold text-lg mb-3">
              Your Capacity
            </Text>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-blue-800 dark:text-blue-200 text-sm">Total Commitment:</Text>
              <Text className="text-blue-900 dark:text-blue-100 font-bold text-base">
                {totalDaysPerWeek} days/week
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-blue-800 dark:text-blue-200 text-sm">Available:</Text>
              <Text className="text-emerald-600 dark:text-emerald-400 font-bold text-base">
                {5 - totalDaysPerWeek} days/week
              </Text>
            </View>

            {/* Capacity Bar */}
            <View className="mt-3 bg-gray-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <View
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-full"
                style={{ width: `${(totalDaysPerWeek / 5) * 100}%` }}
              />
            </View>
            <Text className="text-blue-700 dark:text-blue-300 text-xs mt-1 text-center">
              {Math.round((totalDaysPerWeek / 5) * 100)}% capacity
            </Text>
          </View>
        )}

        {/* Engagements List */}
        {engagements.length === 0 ? (
          <View className="items-center justify-center py-12">
            <Building2 size={48} color="#94a3b8" />
            <Text className="text-gray-500 dark:text-slate-400 text-center mt-4 mb-2">
              No active engagements yet
            </Text>
            <Text className="text-gray-400 dark:text-slate-500 text-center text-sm px-8">
              Accept invitations to start working with companies
            </Text>
            <Pressable
              onPress={() => router.push('/invitations')}
              className="mt-4 bg-blue-500 px-6 py-3 rounded-xl active:opacity-70"
            >
              <Text className="text-white font-semibold">View Invitations</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text className="text-gray-900 dark:text-white text-base font-semibold mb-3">
              Active Engagements ({activeEngagements.length})
            </Text>

            {engagements.map((engagement) => (
              <Pressable
                key={engagement.id}
                onPress={() => {
                  // In real app, this would switch workspace
                  // For now, just show a message
                }}
                className="bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-800 rounded-2xl p-4 mb-3 active:opacity-70"
              >
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <Building2 size={16} color="#3b82f6" />
                      <Text className="text-gray-900 dark:text-white font-bold text-base ml-2">
                        {engagement.companyName}
                      </Text>
                    </View>
                    <Text className="text-gray-600 dark:text-slate-400 text-sm ml-6">
                      {engagement.roleTitle}
                    </Text>
                  </View>
                  <View className={`px-2 py-1 rounded ${getStatusColor(engagement.status)}`}>
                    <Text className="text-xs font-semibold">{getStatusText(engagement.status)}</Text>
                  </View>
                </View>

                {/* Details Grid */}
                <View className="bg-gray-200 dark:bg-slate-800 rounded-xl p-3 mb-3">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center">
                      <Clock size={14} color="#64748b" />
                      <Text className="text-gray-600 dark:text-slate-400 text-xs ml-2">
                        {engagement.commitment}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <DollarSign size={14} color="#10b981" />
                      <Text className="text-emerald-500 text-xs font-semibold ml-1">
                        £{engagement.dayRate}/day
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center">
                    <Calendar size={14} color="#64748b" />
                    <Text className="text-gray-600 dark:text-slate-400 text-xs ml-2">
                      Started {engagement.startDate}
                    </Text>
                  </View>
                </View>

                {/* Action Button */}
                {engagement.status === 'active' && (
                  <View className="flex-row items-center justify-center py-2 border-t border-gray-300 dark:border-slate-700">
                    <ExternalLink size={14} color="#3b82f6" />
                    <Text className="text-blue-500 text-sm font-semibold ml-2">
                      Switch to Workspace
                    </Text>
                  </View>
                )}
              </Pressable>
            ))}

            {/* Inactive/Past Engagements */}
            {engagements.filter(e => e.status !== 'active').length > 0 && (
              <>
                <Text className="text-gray-900 dark:text-white text-base font-semibold mb-3 mt-4">
                  Past Engagements ({engagements.filter(e => e.status !== 'active').length})
                </Text>
                {engagements
                  .filter(e => e.status !== 'active')
                  .map((engagement) => (
                    <View
                      key={engagement.id}
                      className="bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-800 rounded-2xl p-4 mb-3 opacity-60"
                    >
                      <View className="flex-row items-start justify-between mb-2">
                        <View className="flex-1">
                          <Text className="text-gray-900 dark:text-white font-bold text-base mb-1">
                            {engagement.companyName}
                          </Text>
                          <Text className="text-gray-600 dark:text-slate-400 text-sm">
                            {engagement.roleTitle}
                          </Text>
                        </View>
                        <View className={`px-2 py-1 rounded ${getStatusColor(engagement.status)}`}>
                          <Text className="text-xs font-semibold">{getStatusText(engagement.status)}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
              </>
            )}
          </>
        )}

        {/* Info Card */}
        {isExecutiveOrApprentice && activeEngagements.length > 0 && (
          <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mt-4">
            <Text className="text-blue-900 dark:text-blue-100 font-semibold mb-2">
              💡 Managing Multiple Companies
            </Text>
            <Text className="text-blue-800 dark:text-blue-200 text-sm leading-5">
              You can switch between workspaces to see tasks, OKRs, and updates for each company you work with. All your engagements are tracked here.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
