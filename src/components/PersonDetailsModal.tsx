import { View, Text, Modal, Pressable, ScrollView, Linking } from 'react-native';
import { X, Mail, Phone, Linkedin, Calendar, DollarSign, Briefcase, Users, Clock, TrendingUp, Zap, UsersRound } from 'lucide-react-native';
import { type OrganizationMember } from '@/lib/organization-seed';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useSquadStore } from '@/lib/state/squad-store';
import { useMemo } from 'react';

interface PersonDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  member: OrganizationMember | null;
}

const ROLE_COLORS: Record<string, string> = {
  Founder: '#8b5cf6',
  FractionalExec: '#3b82f6',
  Apprentice: '#10b981',
};

const ROLE_LABELS: Record<string, string> = {
  Founder: 'Founder',
  FractionalExec: 'Fractional Executive',
  Apprentice: 'Apprentice',
};

export function PersonDetailsModal({ visible, onClose, member }: PersonDetailsModalProps) {
  const workPlans = useWorkPlanStore(s => s.workPlans);
  const allMembers = useOrganizationStore(s => s.members);
  const squads = useSquadStore(s => s.squads);

  // Calculate member's current workload and tasks
  const memberWorkload = useMemo(() => {
    if (!member) return { tasks: [], totalAllocated: 0, totalCapacity: 0 };

    const tasks = workPlans.filter(wp =>
      wp.status !== 'completed' &&
      wp.status !== 'abandoned' &&
      wp.assignedMemberIds?.includes(member.id)
    );

    const totalAllocated = workPlans
      .filter(wp => wp.status !== 'completed' && wp.status !== 'abandoned')
      .reduce((sum, wp) => {
        const allocation = wp.allocations.find(a => a.memberId === member.id);
        return sum + (allocation?.squaresPerWeek || 0);
      }, 0);

    const totalCapacity = member.role === 'Founder' || member.role === 'Apprentice'
      ? 10
      : (member.daysPerWeek || 2) * 2;

    return { tasks, totalAllocated, totalCapacity };
  }, [member, workPlans]);

  // Get reporting relationships
  const reportsToMember = useMemo(() => {
    if (!member?.reportsTo) return null;
    return allMembers.find(m => m.id === member.reportsTo);
  }, [member, allMembers]);

  const directReports = useMemo(() => {
    if (!member?.manages || member.manages.length === 0) return [];
    return allMembers.filter(m => member.manages?.includes(m.id));
  }, [member, allMembers]);

  // Get squads this member belongs to
  const memberSquads = useMemo(() => {
    if (!member) return [];
    return squads.filter(squad => squad.memberIds.includes(member.id));
  }, [member, squads]);

  if (!member) return null;

  const roleColor = ROLE_COLORS[member.role];
  const utilizationPercent = memberWorkload.totalCapacity > 0
    ? Math.round((memberWorkload.totalAllocated / memberWorkload.totalCapacity) * 100)
    : 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/70 justify-center items-center p-4" onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md"
          style={{ maxHeight: '90%' }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View
              className="p-6 rounded-t-2xl"
              style={{ backgroundColor: roleColor + '15' }}
            >
              <Pressable
                onPress={onClose}
                className="absolute top-4 right-4 z-10 bg-white dark:bg-slate-800 rounded-full p-2"
              >
                <X size={20} color="#64748b" />
              </Pressable>

              {/* Avatar */}
              <View className="items-center mb-4">
                <View
                  className="w-20 h-20 rounded-full items-center justify-center mb-3"
                  style={{ backgroundColor: roleColor }}
                >
                  <Text className="text-white font-bold text-2xl">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
                <Text className="text-gray-900 dark:text-white text-xl font-bold text-center">
                  {member.name}
                </Text>
                <View
                  className="px-3 py-1 rounded-full mt-2"
                  style={{ backgroundColor: roleColor + '30' }}
                >
                  <Text className="font-semibold text-sm" style={{ color: roleColor }}>
                    {ROLE_LABELS[member.role]}
                  </Text>
                </View>
              </View>

              {/* Function & Capacity */}
              <View className="flex-row justify-center gap-4 mt-2">
                <View className="items-center">
                  <Text className="text-gray-500 dark:text-slate-400 text-xs">Function</Text>
                  <Text className="text-gray-900 dark:text-white font-semibold">
                    {member.function}
                  </Text>
                </View>
                <View className="items-center">
                  <Text className="text-gray-500 dark:text-slate-400 text-xs">Capacity</Text>
                  <Text className="text-gray-900 dark:text-white font-semibold">
                    {memberWorkload.totalAllocated}/{memberWorkload.totalCapacity} TU/wk
                  </Text>
                </View>
                <View className="items-center">
                  <Text className="text-gray-500 dark:text-slate-400 text-xs">Utilization</Text>
                  <Text className={`font-semibold ${utilizationPercent >= 100 ? 'text-red-600' : utilizationPercent >= 80 ? 'text-orange-600' : 'text-emerald-600'}`}>
                    {utilizationPercent}%
                  </Text>
                </View>
              </View>
            </View>

            {/* Bio */}
            {member.bio && (
              <View className="px-6 py-4 border-b border-gray-200 dark:border-slate-800">
                <Text className="text-gray-700 dark:text-slate-300 text-sm leading-5">
                  {member.bio}
                </Text>
              </View>
            )}

            {/* Contact Info */}
            <View className="px-6 py-4 border-b border-gray-200 dark:border-slate-800">
              <Text className="text-gray-900 dark:text-white font-bold text-sm mb-3">
                Contact Information
              </Text>

              <Pressable
                onPress={() => Linking.openURL(`mailto:${member.email}`)}
                className="flex-row items-center mb-2 active:opacity-70"
              >
                <Mail size={16} color={roleColor} />
                <Text className="text-gray-700 dark:text-slate-300 text-sm ml-2">
                  {member.email}
                </Text>
              </Pressable>

              {member.phone && (
                <Pressable
                  onPress={() => Linking.openURL(`tel:${member.phone}`)}
                  className="flex-row items-center mb-2 active:opacity-70"
                >
                  <Phone size={16} color={roleColor} />
                  <Text className="text-gray-700 dark:text-slate-300 text-sm ml-2">
                    {member.phone}
                  </Text>
                </Pressable>
              )}

              {member.linkedIn && (
                <Pressable
                  onPress={() => Linking.openURL(member.linkedIn!)}
                  className="flex-row items-center active:opacity-70"
                >
                  <Linkedin size={16} color={roleColor} />
                  <Text className="text-blue-600 dark:text-blue-400 text-sm ml-2">
                    LinkedIn Profile
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Company Details */}
            <View className="px-6 py-4 border-b border-gray-200 dark:border-slate-800">
              <Text className="text-gray-900 dark:text-white font-bold text-sm mb-3">
                Company Details
              </Text>

              <View className="flex-row items-center mb-2">
                <Calendar size={16} color="#64748b" />
                <Text className="text-gray-700 dark:text-slate-300 text-sm ml-2">
                  Started: {new Date(member.startDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Text>
              </View>

              {member.costPerDay && (
                <View className="flex-row items-center mb-2">
                  <DollarSign size={16} color="#64748b" />
                  <Text className="text-gray-700 dark:text-slate-300 text-sm ml-2">
                    Day Rate: £{member.costPerDay}
                  </Text>
                </View>
              )}

              {member.daysPerWeek && (
                <View className="flex-row items-center mb-2">
                  <Clock size={16} color="#64748b" />
                  <Text className="text-gray-700 dark:text-slate-300 text-sm ml-2">
                    Works {member.daysPerWeek} days/week
                  </Text>
                </View>
              )}

              {reportsToMember && (
                <View className="flex-row items-center mb-2">
                  <Briefcase size={16} color="#64748b" />
                  <Text className="text-gray-700 dark:text-slate-300 text-sm ml-2">
                    Reports to: {reportsToMember.name}
                  </Text>
                </View>
              )}

              {directReports.length > 0 && (
                <View className="flex-row items-start">
                  <Users size={16} color="#64748b" style={{ marginTop: 2 }} />
                  <View className="flex-1 ml-2">
                    <Text className="text-gray-700 dark:text-slate-300 text-sm">
                      Manages: {directReports.map(m => m.name).join(', ')}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Performance Modifiers */}
            {(member.teamLeadershipMultiplier || member.collaborationMultiplier || member.aiProficiencyMultiplier) && (
              <View className="px-6 py-4 border-b border-gray-200 dark:border-slate-800">
                <Text className="text-gray-900 dark:text-white font-bold text-sm mb-3">
                  Performance Modifiers
                </Text>
                <Text className="text-gray-500 dark:text-slate-400 text-xs mb-3">
                  These multipliers affect task completion speed when working with teams and AI tools
                </Text>

                {member.teamLeadershipMultiplier && (
                  <View className="flex-row items-center justify-between mb-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                    <View className="flex-row items-center flex-1">
                      <View className="w-8 h-8 bg-purple-100 dark:bg-purple-900/40 rounded-full items-center justify-center mr-3">
                        <UsersRound size={16} color="#8b5cf6" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-900 dark:text-white font-semibold text-sm">
                          Team Leadership
                        </Text>
                        <Text className="text-gray-500 dark:text-slate-400 text-xs">
                          How well they lead teams
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className={`font-bold text-lg ${member.teamLeadershipMultiplier >= 1.0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}>
                        {member.teamLeadershipMultiplier.toFixed(2)}x
                      </Text>
                      <Text className={`text-xs font-semibold ${member.teamLeadershipMultiplier >= 1.0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}>
                        {member.teamLeadershipMultiplier >= 1.0 ? '+' : ''}{((member.teamLeadershipMultiplier - 1) * 100).toFixed(0)}%
                      </Text>
                    </View>
                  </View>
                )}

                {member.collaborationMultiplier && (
                  <View className="flex-row items-center justify-between mb-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <View className="flex-row items-center flex-1">
                      <View className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full items-center justify-center mr-3">
                        <TrendingUp size={16} color="#3b82f6" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-900 dark:text-white font-semibold text-sm">
                          Collaboration
                        </Text>
                        <Text className="text-gray-500 dark:text-slate-400 text-xs">
                          How well they work with others
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className={`font-bold text-lg ${member.collaborationMultiplier >= 1.0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}>
                        {member.collaborationMultiplier.toFixed(2)}x
                      </Text>
                      <Text className={`text-xs font-semibold ${member.collaborationMultiplier >= 1.0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}>
                        {member.collaborationMultiplier >= 1.0 ? '+' : ''}{((member.collaborationMultiplier - 1) * 100).toFixed(0)}%
                      </Text>
                    </View>
                  </View>
                )}

                {member.aiProficiencyMultiplier && (
                  <View className="flex-row items-center justify-between bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                    <View className="flex-row items-center flex-1">
                      <View className="w-8 h-8 bg-amber-100 dark:bg-amber-900/40 rounded-full items-center justify-center mr-3">
                        <Zap size={16} color="#f59e0b" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-900 dark:text-white font-semibold text-sm">
                          AI Proficiency
                        </Text>
                        <Text className="text-gray-500 dark:text-slate-400 text-xs">
                          How effectively they use AI tools
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className={`font-bold text-lg ${member.aiProficiencyMultiplier >= 1.0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}>
                        {member.aiProficiencyMultiplier.toFixed(2)}x
                      </Text>
                      <Text className={`text-xs font-semibold ${member.aiProficiencyMultiplier >= 1.0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}>
                        {member.aiProficiencyMultiplier >= 1.0 ? '+' : ''}{((member.aiProficiencyMultiplier - 1) * 100).toFixed(0)}%
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Squads Section */}
            {memberSquads.length > 0 && (
              <View className="px-6 py-4 border-b border-gray-200 dark:border-slate-800">
                <Text className="text-gray-900 dark:text-white font-bold text-sm mb-3">
                  Squads ({memberSquads.length})
                </Text>
                <Text className="text-gray-500 dark:text-slate-400 text-xs mb-3">
                  Team groupings this person belongs to
                </Text>

                <View className="gap-3">
                  {memberSquads.map((squad) => {
                    const squadMembers = allMembers.filter(m => squad.memberIds.includes(m.id) && m.id !== member.id);

                    return (
                      <View
                        key={squad.id}
                        className="rounded-lg p-3"
                        style={{
                          backgroundColor: (squad.color || '#3b82f6') + '15',
                          borderLeftWidth: 4,
                          borderLeftColor: squad.color || '#3b82f6',
                        }}
                      >
                        <View className="flex-row items-center justify-between mb-2">
                          <Text className="text-gray-900 dark:text-white font-semibold text-sm flex-1">
                            {squad.name}
                          </Text>
                          <View className={`px-2 py-0.5 rounded-full ${
                            squad.type === 'manual' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-slate-200 dark:bg-slate-700'
                          }`}>
                            <Text className={`text-[10px] font-medium ${
                              squad.type === 'manual' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'
                            }`}>
                              {squad.type === 'manual' ? 'MANUAL' : 'AUTO'}
                            </Text>
                          </View>
                        </View>

                        {squad.function && (
                          <Text className="text-gray-500 dark:text-slate-400 text-xs mb-2">
                            {squad.function}
                          </Text>
                        )}

                        {/* Other squad members */}
                        {squadMembers.length > 0 && (
                          <View className="flex-row flex-wrap gap-1.5 mt-2">
                            {squadMembers.map(squadMember => (
                              <View
                                key={squadMember.id}
                                className="bg-white dark:bg-slate-800 px-2 py-1 rounded-full flex-row items-center gap-1"
                              >
                                <View
                                  className="w-4 h-4 rounded-full items-center justify-center"
                                  style={{ backgroundColor: (ROLE_COLORS[squadMember.role] || '#64748b') + '30' }}
                                >
                                  <Text
                                    className="text-[8px] font-bold"
                                    style={{ color: ROLE_COLORS[squadMember.role] || '#64748b' }}
                                  >
                                    {squadMember.name.split(' ')[0][0]}
                                  </Text>
                                </View>
                                <Text className="text-gray-700 dark:text-slate-300 text-xs">
                                  {squadMember.name.split(' ')[0]}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}

                        {/* Task count if any */}
                        {squad.taskIds && squad.taskIds.length > 0 && (
                          <Text className="text-gray-500 dark:text-slate-400 text-xs mt-2">
                            Working on {squad.taskIds.length} task{squad.taskIds.length !== 1 ? 's' : ''}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Current Tasks */}
            {memberWorkload.tasks.length > 0 && (
              <View className="px-6 py-4">
                <Text className="text-gray-900 dark:text-white font-bold text-sm mb-3">
                  Current Tasks ({memberWorkload.tasks.length})
                </Text>
                <View className="gap-2">
                  {memberWorkload.tasks.map((task) => {
                    const allocation = task.allocations.find(a => a.memberId === member.id);
                    return (
                      <View
                        key={task.id}
                        className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3"
                      >
                        <Text className="text-gray-900 dark:text-white font-semibold text-sm mb-1">
                          {task.title}
                        </Text>
                        <View className="flex-row items-center justify-between">
                          <Text className="text-gray-500 dark:text-slate-400 text-xs">
                            {task.function}
                          </Text>
                          <Text className="text-gray-600 dark:text-slate-400 text-xs font-semibold">
                            {allocation?.squaresPerWeek}□/wk
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
