import { View, Text, ScrollView, Pressable, ActivityIndicator, Modal, TextInput } from 'react-native';
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
  Users,
  Star,
  X,
  DollarSign,
  CalendarCheck,
  Award,
} from 'lucide-react-native';
import { useCurrentWorkspace, useCurrentMembership, useCurrentUser } from '@/lib/state/app-store';
import { useDashboardStats } from '@/lib/hooks/queries';
import { router } from 'expo-router';
import { useState } from 'react';
import { fractionalExecutives, apprentices, type Candidate } from '@/lib/candidates-seed';

export default function HomeScreen() {
  const currentWorkspace = useCurrentWorkspace();
  const currentMembership = useCurrentMembership();
  const currentUser = useCurrentUser();

  const { data: stats, isLoading } = useDashboardStats(currentWorkspace?.id ?? null);

  const [showHiringModal, setShowHiringModal] = useState(false);
  const [hiringType, setHiringType] = useState<'exec' | 'apprentice'>('exec');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSpecialization, setFilterSpecialization] = useState<string>('all');

  const candidates = hiringType === 'exec' ? fractionalExecutives : apprentices;

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         candidate.bio.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialization = filterSpecialization === 'all' ||
                                  candidate.specialization.includes(filterSpecialization as any);
    return matchesSearch && matchesSpecialization;
  });

  const handleHireCandidate = (candidate: Candidate) => {
    // In a real app, this would call an API to add the candidate to the team
    alert(`${candidate.name} has been added to your team! They will appear in your workspace shortly.`);
    setSelectedCandidate(null);
  };

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
            <Pressable onPress={() => router.push('/work')} className="active:opacity-70">
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
                  onPress={() => router.push('/work')}
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

      {/* Hiring Section (Founder Only) */}
      {role === 'Founder' && (
        <View className="px-6 pb-4">
          <Text className="text-white text-lg font-semibold mb-3">Build Your Team</Text>
          <View className="gap-3">
            <Pressable
              onPress={() => {
                setHiringType('exec');
                setShowHiringModal(true);
              }}
              className="bg-slate-900 rounded-2xl p-4 border border-slate-800 active:opacity-70"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="w-12 h-12 bg-blue-500/20 rounded-xl items-center justify-center mr-3">
                    <Users size={24} color="#3b82f6" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-semibold mb-1">Hire Fractional Executives</Text>
                    <Text className="text-slate-400 text-xs">20 experienced leaders available</Text>
                  </View>
                </View>
                <ArrowRight size={20} color="#64748b" />
              </View>
            </Pressable>

            <Pressable
              onPress={() => {
                setHiringType('apprentice');
                setShowHiringModal(true);
              }}
              className="bg-slate-900 rounded-2xl p-4 border border-slate-800 active:opacity-70"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="w-12 h-12 bg-emerald-500/20 rounded-xl items-center justify-center mr-3">
                    <Award size={24} color="#10b981" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-semibold mb-1">Hire Apprentices</Text>
                    <Text className="text-slate-400 text-xs">20 talented juniors ready to learn</Text>
                  </View>
                </View>
                <ArrowRight size={20} color="#64748b" />
              </View>
            </Pressable>
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
            onPress={() => router.push('/work')}
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

      {/* Hiring Modal */}
      <Modal visible={showHiringModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50">
          <View className="mt-auto bg-slate-900 rounded-t-3xl max-h-[90%]">
            {/* Modal Header */}
            <View className="p-6 border-b border-slate-800">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-white text-2xl font-bold">
                  {hiringType === 'exec' ? 'Hire Fractional Executive' : 'Hire Apprentice'}
                </Text>
                <Pressable onPress={() => setShowHiringModal(false)}>
                  <X size={24} color="#94a3b8" />
                </Pressable>
              </View>

              {/* Type Toggle */}
              <View className="flex-row gap-2 mb-4">
                <Pressable
                  onPress={() => setHiringType('exec')}
                  className={`flex-1 py-3 rounded-xl ${
                    hiringType === 'exec' ? 'bg-blue-500' : 'bg-slate-800'
                  }`}
                >
                  <Text className={`text-center font-semibold ${
                    hiringType === 'exec' ? 'text-white' : 'text-slate-400'
                  }`}>
                    Executives
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setHiringType('apprentice')}
                  className={`flex-1 py-3 rounded-xl ${
                    hiringType === 'apprentice' ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                >
                  <Text className={`text-center font-semibold ${
                    hiringType === 'apprentice' ? 'text-white' : 'text-slate-400'
                  }`}>
                    Apprentices
                  </Text>
                </Pressable>
              </View>

              {/* Search */}
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by name or skills..."
                placeholderTextColor="#64748b"
                className="bg-slate-800 text-white px-4 py-3 rounded-xl border border-slate-700 mb-3"
              />

              {/* Specialization Filter */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                <View className="flex-row gap-2">
                  {['all', 'Sales', 'Marketing', 'Finance', 'Engineering', 'Ops', 'Admin'].map((spec) => (
                    <Pressable
                      key={spec}
                      onPress={() => setFilterSpecialization(spec)}
                      className={`px-4 py-2 rounded-xl ${
                        filterSpecialization === spec
                          ? 'bg-blue-500'
                          : 'bg-slate-800 border border-slate-700'
                      }`}
                    >
                      <Text className={`text-sm font-medium ${
                        filterSpecialization === spec ? 'text-white' : 'text-slate-400'
                      }`}>
                        {spec === 'all' ? 'All' : spec}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Candidates List */}
            <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
              <View className="gap-3 pb-6">
                {filteredCandidates.map((candidate) => (
                  <Pressable
                    key={candidate.id}
                    onPress={() => setSelectedCandidate(candidate)}
                    className="bg-slate-800 rounded-2xl p-4 border border-slate-700 active:opacity-70"
                  >
                    <View className="flex-row items-start">
                      {/* Avatar */}
                      <View
                        className="w-14 h-14 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: candidate.avatarColor + '20' }}
                      >
                        <Text
                          className="text-xl font-bold"
                          style={{ color: candidate.avatarColor }}
                        >
                          {candidate.name.charAt(0)}
                        </Text>
                      </View>

                      {/* Info */}
                      <View className="flex-1">
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-white font-bold text-base">{candidate.name}</Text>
                          <View className="flex-row items-center">
                            <Star size={14} color="#f59e0b" fill="#f59e0b" />
                            <Text className="text-slate-300 text-sm ml-1">{candidate.rating}</Text>
                          </View>
                        </View>

                        <Text className="text-slate-400 text-xs mb-2">
                          {candidate.specialization.join(' • ')} • {candidate.experience}y exp
                        </Text>

                        <Text className="text-slate-300 text-sm mb-3" numberOfLines={2}>
                          {candidate.bio}
                        </Text>

                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center gap-3">
                            <View className="flex-row items-center">
                              <DollarSign size={14} color="#10b981" />
                              <Text className="text-emerald-400 text-sm font-semibold">
                                £{candidate.costPerDay}/day
                              </Text>
                            </View>
                            <View className="flex-row items-center">
                              <CalendarCheck size={14} color="#3b82f6" />
                              <Text className="text-blue-400 text-xs ml-1">
                                {candidate.availability}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                ))}

                {filteredCandidates.length === 0 && (
                  <View className="items-center justify-center py-12">
                    <Users size={48} color="#475569" />
                    <Text className="text-slate-400 text-center mt-4">
                      No candidates match your filters
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Candidate Detail Modal */}
      <Modal visible={selectedCandidate !== null} transparent animationType="fade">
        <View className="flex-1 bg-black/70 justify-center px-6">
          {selectedCandidate && (
            <View className="bg-slate-900 rounded-3xl p-6 max-h-[80%]">
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View className="items-center mb-6">
                  <View
                    className="w-20 h-20 rounded-full items-center justify-center mb-3"
                    style={{ backgroundColor: selectedCandidate.avatarColor + '20' }}
                  >
                    <Text
                      className="text-3xl font-bold"
                      style={{ color: selectedCandidate.avatarColor }}
                    >
                      {selectedCandidate.name.charAt(0)}
                    </Text>
                  </View>
                  <Text className="text-white text-2xl font-bold mb-1">
                    {selectedCandidate.name}
                  </Text>
                  <Text className="text-slate-400 text-sm mb-2">
                    {selectedCandidate.specialization.join(' • ')}
                  </Text>
                  <View className="flex-row items-center">
                    <Star size={16} color="#f59e0b" fill="#f59e0b" />
                    <Text className="text-slate-300 text-base ml-1 font-semibold">
                      {selectedCandidate.rating} rating
                    </Text>
                  </View>
                </View>

                {/* Stats */}
                <View className="flex-row gap-3 mb-6">
                  <View className="flex-1 bg-slate-800 rounded-xl p-3">
                    <Text className="text-slate-400 text-xs mb-1">Experience</Text>
                    <Text className="text-white font-bold">{selectedCandidate.experience} years</Text>
                  </View>
                  <View className="flex-1 bg-slate-800 rounded-xl p-3">
                    <Text className="text-slate-400 text-xs mb-1">Daily Rate</Text>
                    <Text className="text-emerald-400 font-bold">£{selectedCandidate.costPerDay}</Text>
                  </View>
                  <View className="flex-1 bg-slate-800 rounded-xl p-3">
                    <Text className="text-slate-400 text-xs mb-1">Available</Text>
                    <Text className="text-blue-400 font-bold text-xs">
                      {selectedCandidate.availability.replace('Available ', '')}
                    </Text>
                  </View>
                </View>

                {/* Bio */}
                <View className="mb-6">
                  <Text className="text-white font-semibold mb-2">About</Text>
                  <Text className="text-slate-300 text-sm leading-5">
                    {selectedCandidate.bio}
                  </Text>
                </View>

                {/* Skills */}
                <View className="mb-6">
                  <Text className="text-white font-semibold mb-2">Key Skills</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {selectedCandidate.skills.map((skill, idx) => (
                      <View key={idx} className="bg-blue-500/20 px-3 py-1.5 rounded-lg">
                        <Text className="text-blue-400 text-xs font-medium">{skill}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Previous Companies */}
                <View className="mb-6">
                  <Text className="text-white font-semibold mb-2">Previous Experience</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {selectedCandidate.previousCompanies.map((company, idx) => (
                      <View key={idx} className="bg-slate-800 px-3 py-1.5 rounded-lg">
                        <Text className="text-slate-300 text-xs font-medium">{company}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Action Buttons */}
                <View className="gap-3">
                  <Pressable
                    onPress={() => handleHireCandidate(selectedCandidate)}
                    className="bg-blue-500 py-4 rounded-xl active:opacity-80"
                  >
                    <Text className="text-white text-center font-bold text-base">
                      Add to Team
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setSelectedCandidate(null)}
                    className="bg-slate-800 py-3 rounded-xl active:opacity-80"
                  >
                    <Text className="text-slate-400 text-center font-semibold">Cancel</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}
