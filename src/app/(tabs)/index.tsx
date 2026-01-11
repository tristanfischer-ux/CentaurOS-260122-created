import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Target,
  Briefcase,
  FileText,
  BarChart3,
  PieChart,
  Calendar,
} from 'lucide-react-native';
import { useCurrentWorkspace, useCurrentMembership, useCurrentUser } from '@/lib/state/app-store';
import { useDashboardStats } from '@/lib/hooks/queries';
import { router } from 'expo-router';

export default function HomeScreen() {
  const currentWorkspace = useCurrentWorkspace();
  const currentMembership = useCurrentMembership();
  const currentUser = useCurrentUser();

  const { data: stats, isLoading } = useDashboardStats(currentWorkspace?.id ?? null);

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!stats || !currentMembership) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center p-6">
        <Text className="text-slate-400 text-center">No workspace selected</Text>
      </View>
    );
  }

  const role = currentMembership.role;

  return (
    <ScrollView className="flex-1 bg-slate-950">
      {/* Header Section */}
      <View className="p-6 pb-4">
        <Text className="text-slate-400 text-sm mb-1">Welcome back,</Text>
        <Text className="text-white text-2xl font-bold">{currentUser?.name}</Text>
        <View className="mt-2 bg-blue-500/20 self-start px-3 py-1 rounded-full">
          <Text className="text-blue-400 text-xs font-semibold">{role}</Text>
        </View>
      </View>

      {/* KPI Tiles */}
      <View className="px-6 pb-4">
        <View className="flex-row flex-wrap gap-3">
          {stats.kpiTiles?.map((tile, index) => (
            <View
              key={index}
              className="bg-slate-900 rounded-2xl p-4 border border-slate-800"
              style={{ width: '48%' }}
            >
              <Text className="text-slate-400 text-xs mb-1">{tile.label}</Text>
              <Text className="text-white text-2xl font-bold">{tile.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Reports Section */}
      <View className="px-6 pb-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-white text-lg font-semibold">Reports</Text>
        </View>
        <View className="gap-3">
          {/* Weekly Report Card */}
          <Pressable
            onPress={() => router.push('/reports?period=week')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-4 active:opacity-80"
          >
            <LinearGradient
              colors={['#2563eb', '#1d4ed8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="absolute inset-0 rounded-2xl"
            />
            <View className="flex-row items-center justify-between relative z-10">
              <View className="flex-1">
                <View className="flex-row items-center mb-1">
                  <Calendar size={18} color="#fff" />
                  <Text className="text-white font-semibold ml-2">Weekly Report</Text>
                </View>
                <Text className="text-blue-100 text-xs">Last 7 days performance</Text>
              </View>
              <ArrowRight size={20} color="#fff" />
            </View>
          </Pressable>

          {/* Quick Report Options Grid */}
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => router.push('/reports?period=month')}
              className="flex-1 bg-slate-900 rounded-2xl p-4 border border-slate-800 active:opacity-80"
            >
              <BarChart3 size={24} color="#10b981" />
              <Text className="text-white font-semibold mt-2 mb-1">Monthly</Text>
              <Text className="text-slate-400 text-xs">30 day overview</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/reports?period=quarter')}
              className="flex-1 bg-slate-900 rounded-2xl p-4 border border-slate-800 active:opacity-80"
            >
              <PieChart size={24} color="#f59e0b" />
              <Text className="text-white font-semibold mt-2 mb-1">Quarterly</Text>
              <Text className="text-slate-400 text-xs">90 day summary</Text>
            </Pressable>
          </View>

          {/* Board Pack for Founders */}
          {role === 'Founder' && (
            <Pressable
              onPress={() => router.push('/reports?period=month&export=boardpack')}
              className="bg-slate-900 rounded-2xl p-4 border border-emerald-800 active:opacity-80"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <View className="flex-row items-center mb-1">
                    <FileText size={18} color="#10b981" />
                    <Text className="text-white font-semibold ml-2">Board Pack</Text>
                    <View className="bg-emerald-950 px-2 py-0.5 rounded-full ml-2">
                      <Text className="text-emerald-400 text-[10px] font-semibold">FOUNDER</Text>
                    </View>
                  </View>
                  <Text className="text-slate-400 text-xs">Export board-ready report</Text>
                </View>
                <ArrowRight size={20} color="#10b981" />
              </View>
            </Pressable>
          )}
        </View>
      </View>

      {/* Key Results Progress */}
      {stats.krProgress && stats.krProgress.length > 0 && (
        <View className="px-6 pb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white text-lg font-semibold">Key Results</Text>
            <Pressable onPress={() => router.push('/(tabs)/okrs')} className="active:opacity-70">
              <Text className="text-blue-500 text-sm">View all</Text>
            </Pressable>
          </View>
          <View className="gap-3">
            {stats.krProgress.slice(0, 3).map((kr) => {
              const healthColor =
                kr.healthStatus === 'on_track'
                  ? 'bg-green-500'
                  : kr.healthStatus === 'at_risk'
                    ? 'bg-yellow-500'
                    : 'bg-red-500';
              const percentage = Math.round(kr.progress * 100);

              return (
                <View key={kr.krId} className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
                  <View className="flex-row items-start justify-between mb-2">
                    <Text className="text-white font-medium flex-1 mr-2">{kr.title}</Text>
                    <View className={`w-2 h-2 rounded-full ${healthColor}`} />
                  </View>
                  <View className="bg-slate-800 h-2 rounded-full overflow-hidden">
                    <View
                      className="bg-blue-500 h-full rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </View>
                  <Text className="text-slate-400 text-xs mt-2">{percentage}% complete</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Today's Tasks (Role-specific) */}
      {role === 'Apprentice' && stats.todaysTasks && stats.todaysTasks.length > 0 && (
        <View className="px-6 pb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white text-lg font-semibold">Your Tasks</Text>
            <Pressable onPress={() => router.push('/(tabs)/work')} className="active:opacity-70">
              <Text className="text-blue-500 text-sm">View all</Text>
            </Pressable>
          </View>
          <View className="gap-3">
            {stats.todaysTasks.slice(0, 5).map((task: any) => {
              const priorityColor =
                task.priority === 'urgent'
                  ? 'bg-red-500'
                  : task.priority === 'high'
                    ? 'bg-orange-500'
                    : task.priority === 'medium'
                      ? 'bg-yellow-500'
                      : 'bg-slate-500';

              const statusIcon =
                task.status === 'done' ? (
                  <CheckCircle2 size={16} color="#10b981" />
                ) : task.status === 'in_progress' ? (
                  <Clock size={16} color="#3b82f6" />
                ) : null;

              return (
                <Pressable
                  key={task.id}
                  onPress={() => router.push('/(tabs)/work')}
                  className="bg-slate-900 rounded-2xl p-4 border border-slate-800 active:opacity-70"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 mr-2">
                      <Text className="text-white font-medium mb-1">{task.title}</Text>
                      <View className="flex-row items-center gap-2">
                        <View className={`w-2 h-2 rounded-full ${priorityColor}`} />
                        <Text className="text-slate-400 text-xs capitalize">{task.function}</Text>
                        {task.dueDate && (
                          <Text className="text-slate-500 text-xs">
                            • {new Date(task.dueDate).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                    </View>
                    {statusIcon}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Review Queue (Fractional Exec) */}
      {role === 'FractionalExec' && stats.reviewQueue && stats.reviewQueue.length > 0 && (
        <View className="px-6 pb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white text-lg font-semibold">Review Queue</Text>
            <Pressable onPress={() => router.push('/(tabs)/reviews')} className="active:opacity-70">
              <Text className="text-blue-500 text-sm">View all</Text>
            </Pressable>
          </View>
          <View className="gap-3">
            {stats.reviewQueue.slice(0, 3).map((review: any) => (
              <Pressable
                key={review.id}
                onPress={() => router.push('/(tabs)/reviews')}
                className="bg-slate-900 rounded-2xl p-4 border border-slate-800 active:opacity-70"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-white font-medium mb-1">Task awaiting review</Text>
                    <Text className="text-slate-400 text-xs">
                      Requested {new Date(review.requestedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <ArrowRight size={20} color="#64748b" />
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View className="px-6 pb-6">
        <Text className="text-white text-lg font-semibold mb-3">Quick Actions</Text>
        <View className="gap-3">
          <Pressable
            onPress={() => router.push('/(tabs)/okrs')}
            className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-4 flex-row items-center justify-between active:opacity-80"
          >
            <LinearGradient
              colors={['#2563eb', '#3b82f6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                borderRadius: 16,
              }}
            />
            <View className="flex-row items-center flex-1">
              <Target size={24} color="white" />
              <Text className="text-white font-semibold ml-3">View OKRs</Text>
            </View>
            <ArrowRight size={20} color="white" />
          </Pressable>

          <Pressable
            onPress={() => router.push('/(tabs)/work')}
            className="bg-gradient-to-r from-purple-600 to-purple-500 rounded-2xl p-4 flex-row items-center justify-between active:opacity-80"
          >
            <LinearGradient
              colors={['#7c3aed', '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                borderRadius: 16,
              }}
            />
            <View className="flex-row items-center flex-1">
              <Briefcase size={24} color="white" />
              <Text className="text-white font-semibold ml-3">Work Hub</Text>
            </View>
            <ArrowRight size={20} color="white" />
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
