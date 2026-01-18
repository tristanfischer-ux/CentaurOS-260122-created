/**
 * Who Tab - People Management
 * Team overview, resource pool, and recruitment
 */

import { View, Text, ScrollView, Pressable, Modal, TextInput, Alert, Dimensions, Linking } from 'react-native';
import { useState, useMemo, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight, useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import {
  Users,
  Crown,
  Briefcase,
  GraduationCap,
  Plus,
  X,
  Search,
  Filter,
  Star,
  Clock,
  DollarSign,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  MapPin,
  TrendingUp,
  Zap,
  Target,
  Award,
  UserPlus,
  Heart,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Calendar,
  UsersRound,
  MessageSquare,
  Scale,
  Sparkles,
  Edit2,
} from 'lucide-react-native';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { useCurrentMembership, useCurrentWorkspace } from '@/lib/state/app-store';
import { useMarketplaceRequestsStore } from '@/lib/state/marketplace-requests-store';
import { useSquadStore } from '@/lib/state/squad-store';
import { fractionalExecutives, apprentices, type Candidate } from '@/lib/candidates-seed';
import type { OrganizationMember } from '@/lib/organization-seed';
import type { Function as BusinessFunction } from '@/types';
import { HelpModal, HelpButton, type HelpContent } from '@/components/HelpModal';
import { PersonDetailsModal } from '@/components/PersonDetailsModal';
import { CompactPersonCard } from '@/components/CompactPersonCard';
import { SettingsGearButton } from '@/components/SettingsGearButton';
import { useCurrentUser } from '@/lib/state/app-store';
import { calculateTaskModifiers, calculateTotalMultiplier, formatMultiplierAsPercentage, getModifierColor } from '@/lib/task-modifiers';
import { EditPersonModal } from '@/components/EditPersonModal';
import { lightImpact } from '@/lib/haptics';

const WHO_HELP: HelpContent = {
  title: 'People Management',
  subtitle: 'Your team & recruitment',
  description: 'The Who tab is your central hub for managing people. View your current team (Founders, Executives, Apprentices), their capacity and allocations, and recruit new talent to grow your team.',
  tips: [
    'Team cards show current capacity and utilization - green is available, red is overallocated',
    'Long-press any team member to see their full details, current tasks, and performance modifiers',
    'Recruitment section lets you browse and hire fractional executives and apprentices',
    'Use filters to find candidates by function, experience, or cost',
    'Performance modifiers (Team Leadership, Collaboration, AI Proficiency) affect task completion speed',
  ],
  quickActions: [
    { label: 'Team Overview', description: 'See all team members organized by role with capacity metrics' },
    { label: 'Resource Pool', description: 'Visual capacity view showing who has availability this week' },
    { label: 'Hire Executives', description: 'Browse fractional executives by function (2-5 days/week)' },
    { label: 'Hire Apprentices', description: 'Find apprentices with 10 TU/week capacity' },
  ],
};

// Talent scoring
interface TalentScore {
  overall: number;
  experienceScore: number;
  availabilityScore: number;
  valueScore: number;
  skillMatch: number;
}

function calculateTalentScore(candidate: Candidate, searchQuery: string, desiredSkills: string[]): TalentScore {
  const experienceScore = Math.min(25, (candidate.experience / 20) * 25);
  const availabilityScore = candidate.availability.toLowerCase().includes('now') ? 25 :
    candidate.availability.toLowerCase().includes('jan') ? 18 : 12;
  const avgCost = candidate.role === 'FractionalExec' ? 850 : 350;
  const valueScore = Math.max(0, 25 - ((candidate.costPerDay - avgCost) / avgCost) * 15);

  let skillMatch = 0;
  if (desiredSkills.length > 0) {
    const matchedSkills = candidate.skills.filter(s =>
      desiredSkills.some(ds => s.toLowerCase().includes(ds.toLowerCase()))
    );
    skillMatch = (matchedSkills.length / Math.max(desiredSkills.length, 1)) * 25;
  } else if (searchQuery) {
    const queryLower = searchQuery.toLowerCase();
    const matchesName = candidate.name.toLowerCase().includes(queryLower);
    const matchesSkills = candidate.skills.some(s => s.toLowerCase().includes(queryLower));
    const matchesSpec = candidate.specialization.some(s => s.toLowerCase().includes(queryLower));
    skillMatch = (matchesName ? 10 : 0) + (matchesSkills ? 10 : 0) + (matchesSpec ? 5 : 0);
  } else {
    skillMatch = 15;
  }

  return {
    overall: Math.round(experienceScore + availabilityScore + valueScore + skillMatch),
    experienceScore: Math.round(experienceScore),
    availabilityScore: Math.round(availabilityScore),
    valueScore: Math.round(valueScore),
    skillMatch: Math.round(skillMatch),
  };
}

const ROLE_COLORS = {
  Founder: '#8b5cf6',
  FractionalExec: '#3b82f6',
  Apprentice: '#10b981',
};

const ROLE_LABELS = {
  Founder: 'Founders',
  FractionalExec: 'Executives',
  Apprentice: 'Apprentices',
};

type WhoTab = 'team' | 'squads' | 'hire' | 'resources';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const screenWidth = Dimensions.get('window').width;

export default function WhoScreen() {
  const insets = useSafeAreaInsets();
  const currentMembership = useCurrentMembership();
  const currentWorkspace = useCurrentWorkspace();
  const currentUser = useCurrentUser();

  // Stores
  const members = useOrganizationStore(s => s.members);
  const addMember = useOrganizationStore(s => s.addMember);
  const updateMember = useOrganizationStore(s => s.updateMember);
  const removeMember = useOrganizationStore(s => s.removeMember);
  const workPlans = useWorkPlanStore(s => s.workPlans);
  const squads = useSquadStore(s => s.squads);
  const createSquad = useSquadStore(s => s.createSquad);
  const deleteSquad = useSquadStore(s => s.deleteSquad);
  const requests = useMarketplaceRequestsStore(s => s.requests);
  const approveRequest = useMarketplaceRequestsStore(s => s.approveRequest);
  const rejectRequest = useMarketplaceRequestsStore(s => s.rejectRequest);

  // Filter pending requests with useMemo to avoid infinite re-renders
  const pendingRequests = useMemo(() =>
    requests.filter(r => r.status === 'pending'),
    [requests]
  );

  // State
  const [activeTab, setActiveTab] = useState<WhoTab>('team');
  const [showHelp, setShowHelp] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFunction, setSelectedFunction] = useState<BusinessFunction | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null);
  const [showMemberDetails, setShowMemberDetails] = useState(false);
  const [showEditMember, setShowEditMember] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<OrganizationMember | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [showHireModal, setShowHireModal] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    Founder: true,
    FractionalExec: true,
    Apprentice: true,
  });
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<'pre-seed' | 'seed' | null>(null);

  // Filter states
  const [minExperience, setMinExperience] = useState(0);
  const [maxCost, setMaxCost] = useState(2000);
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'now' | 'soon'>('all');

  // Shortlist
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set());

  // Comparison feature (up to 3 people)
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const isFounder = currentMembership?.role === 'Founder';

  // Group team members by role
  const teamByRole = useMemo(() => {
    const grouped: Record<string, OrganizationMember[]> = {
      Founder: [],
      FractionalExec: [],
      Apprentice: [],
    };
    members.filter(m => m.status === 'active').forEach(m => {
      if (grouped[m.role]) {
        grouped[m.role].push(m);
      }
    });
    return grouped;
  }, [members]);

  // Calculate member capacity/utilization - MEMOIZED for performance
  const memberUtilizations = useMemo(() => {
    const cache = new Map<string, {
      base: number;
      overtime: number;
      total: number;
      allocated: number;
      available: number;
      utilizationPercent: number;
    }>();

    members.filter(m => m.status === 'active').forEach(member => {
      const baseCapacity = member.role === 'Founder' || member.role === 'Apprentice'
        ? 10
        : (member.daysPerWeek || 2) * 2;
      const overtimeCapacity = member.role === 'Founder' || member.role === 'Apprentice'
        ? 5
        : Math.min((5 - (member.daysPerWeek || 2)) * 2, 10);
      const totalCapacity = baseCapacity + overtimeCapacity;

      const allocated = workPlans
        .filter(wp => wp.status !== 'completed' && wp.status !== 'abandoned')
        .reduce((sum, wp) => {
          const allocation = wp.allocations?.find(a => a.memberId === member.id);
          return sum + (allocation?.squaresPerWeek || 0);
        }, 0);

      cache.set(member.id, {
        base: baseCapacity,
        overtime: overtimeCapacity,
        total: totalCapacity,
        allocated,
        available: Math.max(0, totalCapacity - allocated),
        utilizationPercent: totalCapacity > 0 ? Math.round((allocated / totalCapacity) * 100) : 0,
      });
    });

    return cache;
  }, [members, workPlans]);

  // Helper function to get utilization from cache
  const getMemberUtilization = (member: OrganizationMember) => {
    return memberUtilizations.get(member.id) || {
      base: 0,
      overtime: 0,
      total: 0,
      allocated: 0,
      available: 0,
      utilizationPercent: 0,
    };
  };

  // Resource pool totals
  const resourcePoolTotals = useMemo(() => {
    const activeMembers = members.filter(m => m.status === 'active');
    let total = 0;
    let allocated = 0;

    activeMembers.forEach(member => {
      const util = memberUtilizations.get(member.id);
      if (util) {
        total += util.total;
        allocated += util.allocated;
      }
    });

    return {
      total,
      allocated,
      available: total - allocated,
      utilizationPercent: total > 0 ? Math.round((allocated / total) * 100) : 0,
    };
  }, [members, memberUtilizations]);

  // Filtered and scored executives
  const scoredExecutives = useMemo(() => {
    const desiredSkills = searchQuery.split(',').map(s => s.trim()).filter(Boolean);
    return fractionalExecutives
      .map(exec => ({
        ...exec,
        score: calculateTalentScore(exec, searchQuery, desiredSkills),
      }))
      .filter(exec => {
        const matchesSearch = searchQuery === '' ||
          exec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          exec.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase())) ||
          exec.specialization.some(spec => spec.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesFunction = selectedFunction === 'all' || exec.specialization.includes(selectedFunction);
        const matchesExperience = exec.experience >= minExperience;
        const matchesCost = exec.costPerDay <= maxCost;
        const matchesAvailability = availabilityFilter === 'all' ||
          (availabilityFilter === 'now' && exec.availability.toLowerCase().includes('now')) ||
          (availabilityFilter === 'soon' && !exec.availability.toLowerCase().includes('now'));
        return matchesSearch && matchesFunction && matchesExperience && matchesCost && matchesAvailability;
      })
      .sort((a, b) => b.score.overall - a.score.overall);
  }, [searchQuery, selectedFunction, minExperience, maxCost, availabilityFilter]);

  // Filtered and scored apprentices
  const scoredApprentices = useMemo(() => {
    const desiredSkills = searchQuery.split(',').map(s => s.trim()).filter(Boolean);
    return apprentices
      .map(app => ({
        ...app,
        score: calculateTalentScore(app, searchQuery, desiredSkills),
      }))
      .filter(app => {
        const matchesSearch = searchQuery === '' ||
          app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase())) ||
          app.specialization.some(spec => spec.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesFunction = selectedFunction === 'all' || app.specialization.includes(selectedFunction);
        const matchesAvailability = availabilityFilter === 'all' ||
          (availabilityFilter === 'now' && app.availability.toLowerCase().includes('now')) ||
          (availabilityFilter === 'soon' && !app.availability.toLowerCase().includes('now'));
        return matchesSearch && matchesFunction && matchesAvailability;
      })
      .sort((a, b) => b.score.overall - a.score.overall);
  }, [searchQuery, selectedFunction, availabilityFilter]);

  const toggleShortlist = (id: string) => {
    setShortlistedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleComparison = (id: string) => {
    setSelectedForComparison(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      } else if (prev.length < 3) {
        return [...prev, id];
      } else {
        Alert.alert('Limit Reached', 'You can compare up to 3 candidates at a time. Remove one to add another.');
        return prev;
      }
    });
  };

  // Get all candidates for comparison lookup
  const allCandidates = useMemo(() => {
    return [...fractionalExecutives, ...apprentices];
  }, []);

  const candidatesForComparison = useMemo(() => {
    return selectedForComparison.map(id => allCandidates.find(c => c.id === id)).filter(Boolean) as Candidate[];
  }, [selectedForComparison, allCandidates]);

  const createRequest = useMarketplaceRequestsStore(s => s.createRequest);

  const handleHireCandidate = (candidate: Candidate) => {
    if (isFounder) {
      // Founder can hire directly
      setSelectedCandidate(candidate);
      setShowHireModal(true);
    } else {
      // Non-founder must request approval
      Alert.alert(
        'Request Approval',
        `Send a request to the Founder to hire ${candidate.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Send Request',
            onPress: () => {
              if (currentWorkspace) {
                createRequest({
                  workspaceId: currentWorkspace.id,
                  candidateId: candidate.id,
                  candidateName: candidate.name,
                  candidateRole: candidate.role === 'FractionalExec' ? 'FractionalExec' : 'Apprentice',
                  candidateFunction: candidate.specialization[0] || 'Ops',
                  requestedBy: currentMembership?.id || 'unknown',
                  proposedDaysPerWeek: candidate.role === 'FractionalExec' ? 2 : 5,
                  proposedDayRate: candidate.costPerDay,
                  notes: `Request to hire ${candidate.name} as ${candidate.role === 'FractionalExec' ? 'Fractional Executive' : 'Apprentice'}`,
                });
                Alert.alert('Request Sent', 'Your request has been sent to the Founder for approval.');
              }
            },
          },
        ]
      );
    }
  };

  const toggleSection = (role: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [role]: !prev[role],
    }));
  };

  const handleEditMember = (member: OrganizationMember) => {
    lightImpact();
    setMemberToEdit(member);
    setShowEditMember(true);
  };

  const handleSaveMember = (updates: Partial<OrganizationMember>) => {
    if (memberToEdit) {
      updateMember(memberToEdit.id, updates);
      Alert.alert('Success', 'Team member updated successfully');
    }
  };

  const handleDeleteMember = () => {
    if (memberToEdit) {
      Alert.alert(
        'Delete Member',
        `Are you sure you want to remove ${memberToEdit.name} from your team?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              removeMember(memberToEdit.id);
              setShowEditMember(false);
              setMemberToEdit(null);
              Alert.alert('Success', 'Team member removed');
            },
          },
        ]
      );
    }
  };

  // Handle member change from swipe in modal
  const handleMemberChange = (newMember: OrganizationMember) => {
    setSelectedMember(newMember);
  };

  // Team member card component - now uses CompactPersonCard
  const TeamMemberCard = ({ member }: { member: OrganizationMember }) => {
    return (
      <CompactPersonCard
        member={member}
        workPlans={workPlans}
        onPress={() => {
          lightImpact();
        }}
        onFullDetailPress={() => {
          setSelectedMember(member);
          setShowMemberDetails(true);
        }}
        isSelected={selectedMember?.id === member.id}
      />
    );
  };

  // Candidate card component
  const CandidateCard = ({ candidate, index }: { candidate: Candidate & { score: TalentScore }; index: number }) => {
    const isShortlisted = shortlistedIds.has(candidate.id);
    const isSelectedForCompare = selectedForComparison.includes(candidate.id);
    const roleColor = candidate.role === 'FractionalExec' ? '#3b82f6' : '#10b981';

    return (
      <AnimatedPressable
        entering={FadeInDown.delay(index * 50).springify()}
        onPress={() => {
          setSelectedCandidate(candidate);
          setShowCandidateModal(true);
        }}
        className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-3 active:opacity-80"
        style={isSelectedForCompare ? { borderWidth: 2, borderColor: '#8b5cf6' } : undefined}
      >
        {/* Available to Hire Badge */}
        <View className="absolute -top-2 right-3 bg-emerald-500 px-2.5 py-0.5 rounded-full flex-row items-center gap-1">
          <Sparkles size={10} color="#fff" />
          <Text className="text-white text-[10px] font-bold">AVAILABLE TO HIRE</Text>
        </View>

        <View className="flex-row items-start mt-2">
          {/* Avatar with score badge */}
          <View className="mr-3">
            <View
              className="w-14 h-14 rounded-full items-center justify-center"
              style={{ backgroundColor: roleColor + '20' }}
            >
              <Text style={{ color: roleColor }} className="font-bold text-lg">
                {candidate.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
            {/* Match score badge */}
            <View
              className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: candidate.score.overall >= 75 ? '#10b981' :
                  candidate.score.overall >= 50 ? '#f59e0b' : '#64748b',
              }}
            >
              <Text className="text-white text-xs font-bold">{candidate.score.overall}</Text>
            </View>
          </View>

          {/* Info */}
          <View className="flex-1">
            <View className="flex-row items-center justify-between">
              <Text className="text-slate-900 dark:text-white font-semibold text-base">
                {candidate.name}
              </Text>
              <View className="flex-row items-center gap-2">
                {/* Compare toggle */}
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    toggleComparison(candidate.id);
                  }}
                  className={`p-1.5 rounded-lg ${isSelectedForCompare ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-slate-100 dark:bg-slate-700'}`}
                >
                  <Scale size={16} color={isSelectedForCompare ? '#8b5cf6' : '#94a3b8'} />
                </Pressable>
                {/* Heart/shortlist */}
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    toggleShortlist(candidate.id);
                  }}
                  className="p-1"
                >
                  <Heart
                    size={18}
                    color={isShortlisted ? '#ef4444' : '#94a3b8'}
                    fill={isShortlisted ? '#ef4444' : 'transparent'}
                  />
                </Pressable>
              </View>
            </View>

            <View className="flex-row items-center gap-2 mt-1">
              {candidate.specialization.slice(0, 2).map((spec, idx) => (
                <View key={`spec-${idx}`} className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                  <Text className="text-slate-600 dark:text-slate-300 text-xs">{spec}</Text>
                </View>
              ))}
            </View>

            <View className="flex-row items-center gap-3 mt-2">
              <View className="flex-row items-center gap-1">
                <Star size={12} color="#f59e0b" fill="#f59e0b" />
                <Text className="text-slate-600 dark:text-slate-300 text-xs">{candidate.rating}</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Briefcase size={12} color="#64748b" />
                <Text className="text-slate-600 dark:text-slate-300 text-xs">{candidate.experience}y</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <DollarSign size={12} color="#64748b" />
                <Text className="text-slate-600 dark:text-slate-300 text-xs">£{candidate.costPerDay}/day</Text>
              </View>
            </View>

            <View className="flex-row items-center gap-1 mt-2">
              <Clock size={12} color={candidate.availability.toLowerCase().includes('now') ? '#10b981' : '#f59e0b'} />
              <Text
                className="text-xs"
                style={{ color: candidate.availability.toLowerCase().includes('now') ? '#10b981' : '#f59e0b' }}
              >
                {candidate.availability}
              </Text>
            </View>
          </View>
        </View>

        {/* Contact buttons */}
        <View className="flex-row gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              Linking.openURL(`tel:${candidate.phone}`);
            }}
            className="flex-1 bg-green-500/10 rounded-lg py-2 flex-row items-center justify-center gap-1.5 active:opacity-70"
          >
            <Phone size={14} color="#22c55e" />
            <Text className="text-green-600 dark:text-green-400 text-xs font-medium">Call</Text>
          </Pressable>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              Linking.openURL(`mailto:${candidate.email}`);
            }}
            className="flex-1 bg-blue-500/10 rounded-lg py-2 flex-row items-center justify-center gap-1.5 active:opacity-70"
          >
            <Mail size={14} color="#3b82f6" />
            <Text className="text-blue-600 dark:text-blue-400 text-xs font-medium">Email</Text>
          </Pressable>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              Linking.openURL(`sms:${candidate.phone}`);
            }}
            className="flex-1 bg-purple-500/10 rounded-lg py-2 flex-row items-center justify-center gap-1.5 active:opacity-70"
          >
            <MessageSquare size={14} color="#a855f7" />
            <Text className="text-purple-600 dark:text-purple-400 text-xs font-medium">SMS</Text>
          </Pressable>
        </View>

        {/* Action button - Hire for founders, Request for others */}
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            handleHireCandidate(candidate);
          }}
          className={`mt-3 rounded-lg py-2.5 items-center active:opacity-80 ${
            isFounder ? 'bg-blue-500' : 'bg-amber-500'
          }`}
        >
          <Text className="text-white font-semibold text-sm">
            {isFounder ? `Hire ${candidate.name.split(' ')[0]}` : `Request to Hire`}
          </Text>
        </Pressable>
      </AnimatedPressable>
    );
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Help Modal */}
      <HelpModal
        visible={showHelp}
        onClose={() => setShowHelp(false)}
        content={WHO_HELP}
        gradientColors={['#3b82f6', '#8b5cf6']}
      />

      {/* Person Details Modal */}
      <PersonDetailsModal
        visible={showMemberDetails}
        onClose={() => setShowMemberDetails(false)}
        member={selectedMember}
        allMembers={members.filter(m => m.status === 'active')}
        onMemberChange={handleMemberChange}
      />

      {/* Edit Person Modal */}
      {memberToEdit && (
        <EditPersonModal
          visible={showEditMember}
          member={memberToEdit}
          onClose={() => {
            setShowEditMember(false);
            setMemberToEdit(null);
          }}
          onSave={handleSaveMember}
          onDelete={handleDeleteMember}
        />
      )}

      {/* Hire Confirmation Modal */}
      <Modal
        visible={showHireModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowHireModal(false);
          setSelectedCandidate(null);
        }}
      >
        <Pressable
          className="flex-1 bg-black/70 justify-center items-center p-6"
          onPress={() => {
            setShowHireModal(false);
            setSelectedCandidate(null);
          }}
        >
          <Pressable onPress={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm">
            {selectedCandidate && (
              <View>
                <Text className="text-slate-900 dark:text-white font-bold text-lg mb-2">
                  Hire {selectedCandidate.name}?
                </Text>
                <Text className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                  {selectedCandidate.role === 'FractionalExec' ? 'Fractional Executive' : 'Apprentice'} • £{selectedCandidate.costPerDay}/day
                </Text>
                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => {
                      setShowHireModal(false);
                      setSelectedCandidate(null);
                    }}
                    className="flex-1 bg-slate-200 dark:bg-slate-700 py-3 rounded-xl"
                  >
                    <Text className="text-slate-700 dark:text-slate-300 font-semibold text-center">Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      if (selectedCandidate && currentWorkspace) {
                        const newMember: OrganizationMember = {
                          id: `member-${Date.now()}`,
                          workspaceId: currentWorkspace.id,
                          name: selectedCandidate.name,
                          role: selectedCandidate.role === 'FractionalExec' ? 'FractionalExec' : 'Apprentice',
                          function: selectedCandidate.specialization[0] || 'Ops',
                          status: 'active',
                          daysPerWeek: selectedCandidate.role === 'FractionalExec' ? 2 : 5,
                          email: selectedCandidate.email,
                          startDate: new Date().toISOString(),
                          costPerDay: selectedCandidate.costPerDay,
                        };
                        addMember(newMember);
                        Alert.alert('Success', `${selectedCandidate.name} has been added to your team!`);
                      }
                      setShowHireModal(false);
                      setSelectedCandidate(null);
                    }}
                    className="flex-1 bg-blue-500 py-3 rounded-xl"
                  >
                    <Text className="text-white font-semibold text-center">Confirm</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Candidate Detail Modal */}
      <Modal
        visible={showCandidateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCandidateModal(false)}
      >
        <Pressable className="flex-1 bg-black/70" onPress={() => setShowCandidateModal(false)}>
          <View className="flex-1" />
          <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '90%' }}>
            <View className="bg-white dark:bg-slate-900 rounded-t-3xl">
              {selectedCandidate && (
                <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
                  {/* Header */}
                  <LinearGradient
                    colors={selectedCandidate.role === 'FractionalExec' ? ['#3b82f6', '#1d4ed8'] : ['#10b981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
                  >
                    <View className="flex-row items-center justify-between mb-4">
                      <View className="bg-white/20 px-3 py-1 rounded-full">
                        <Text className="text-white text-sm font-medium">
                          {selectedCandidate.role === 'FractionalExec' ? 'Fractional Executive' : 'Apprentice'}
                        </Text>
                      </View>
                      <Pressable onPress={() => setShowCandidateModal(false)} className="bg-white/20 p-2 rounded-full">
                        <X size={20} color="white" />
                      </Pressable>
                    </View>

                    <View className="flex-row items-center">
                      <View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center mr-4">
                        <Text className="text-white font-bold text-2xl">
                          {selectedCandidate.name.split(' ').map(n => n[0]).join('')}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-white font-bold text-xl">{selectedCandidate.name}</Text>
                        <View className="flex-row items-center gap-2 mt-1">
                          <Star size={14} color="#fbbf24" fill="#fbbf24" />
                          <Text className="text-white/90 text-sm">{selectedCandidate.rating} rating</Text>
                        </View>
                        <Text className="text-white/80 text-sm mt-1">{selectedCandidate.experience} years experience</Text>
                      </View>
                    </View>
                  </LinearGradient>

                  <View className="p-5">
                    {/* Bio */}
                    <Text className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
                      {selectedCandidate.bio}
                    </Text>

                    {/* Contact */}
                    <View className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-4">
                      <Text className="text-slate-900 dark:text-white font-semibold mb-3">Contact</Text>
                      <View className="flex-row items-center gap-2 mb-2">
                        <Mail size={14} color="#64748b" />
                        <Text className="text-slate-600 dark:text-slate-400 text-sm">{selectedCandidate.email}</Text>
                      </View>
                      <View className="flex-row items-center gap-2 mb-2">
                        <Phone size={14} color="#64748b" />
                        <Text className="text-slate-600 dark:text-slate-400 text-sm">{selectedCandidate.phone}</Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <MapPin size={14} color="#64748b" />
                        <Text className="text-slate-600 dark:text-slate-400 text-sm">{selectedCandidate.location}</Text>
                      </View>
                    </View>

                    {/* Skills */}
                    <View className="mb-4">
                      <Text className="text-slate-900 dark:text-white font-semibold mb-2">Skills</Text>
                      <View className="flex-row flex-wrap gap-2">
                        {selectedCandidate.skills.map((skill, idx) => (
                          <View key={`skill-${idx}`} className="bg-blue-100 dark:bg-blue-900/30 px-3 py-1.5 rounded-full">
                            <Text className="text-blue-700 dark:text-blue-300 text-sm">{skill}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Previous Companies */}
                    <View className="mb-4">
                      <Text className="text-slate-900 dark:text-white font-semibold mb-2">Previous Companies</Text>
                      <View className="flex-row flex-wrap gap-2">
                        {selectedCandidate.previousCompanies.map((company, idx) => (
                          <View key={`company-${idx}`} className="bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-full">
                            <Text className="text-slate-700 dark:text-slate-300 text-sm">{company}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Cost & Availability */}
                    <View className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-4">
                      <View className="flex-row justify-between mb-2">
                        <Text className="text-slate-500 dark:text-slate-400 text-sm">Day Rate</Text>
                        <Text className="text-slate-900 dark:text-white font-semibold">£{selectedCandidate.costPerDay}/day</Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-slate-500 dark:text-slate-400 text-sm">Availability</Text>
                        <Text
                          className="font-semibold"
                          style={{ color: selectedCandidate.availability.toLowerCase().includes('now') ? '#10b981' : '#f59e0b' }}
                        >
                          {selectedCandidate.availability}
                        </Text>
                      </View>
                    </View>

                    {/* Hire Button */}
                    {isFounder && (
                      <Pressable
                        onPress={() => {
                          setShowCandidateModal(false);
                          handleHireCandidate(selectedCandidate);
                        }}
                        className="bg-blue-500 rounded-xl py-4 items-center active:opacity-80"
                      >
                        <Text className="text-white font-bold text-base">Hire {selectedCandidate.name.split(' ')[0]}</Text>
                      </Pressable>
                    )}
                  </View>
                </ScrollView>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Header */}
      <LinearGradient
        colors={['#3b82f6', '#1d4ed8', '#1e40af']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 12,
          paddingBottom: 16,
        }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-white/70 text-xs font-medium uppercase tracking-wide">People</Text>
            <Text className="text-white text-2xl font-bold">Who</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <SettingsGearButton style="glass" />
            <HelpButton onPress={() => setShowHelp(true)} />
          </View>
        </View>

        {/* Resource Pool Summary */}
        <View className="bg-white/10 rounded-xl p-3 flex-row justify-between">
          <View className="items-center flex-1">
            <Text className="text-white/70 text-xs">Team</Text>
            <Text className="text-white font-bold text-lg">{members.filter(m => m.status === 'active').length}</Text>
          </View>
          <View className="items-center flex-1 border-l border-r border-white/20">
            <Text className="text-white/70 text-xs">Total TU</Text>
            <Text className="text-white font-bold text-lg">{resourcePoolTotals.total}</Text>
          </View>
          <View className="items-center flex-1">
            <Text className="text-white/70 text-xs">Available</Text>
            <Text className="text-emerald-300 font-bold text-lg">{resourcePoolTotals.available}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tab Switcher */}
      <View className="px-5 pt-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            {[
              { key: 'team', label: 'My Team', icon: Users },
              { key: 'squads', label: 'Squads', icon: UsersRound },
              { key: 'hire', label: 'Hire', icon: UserPlus },
              { key: 'resources', label: 'Resources', icon: Target },
            ].map(tab => (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key as WhoTab)}
                className={`flex-row items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg ${
                  activeTab === tab.key ? 'bg-white dark:bg-slate-700' : ''
                }`}
              >
                <tab.icon
                  size={16}
                  color={activeTab === tab.key ? '#3b82f6' : '#64748b'}
                />
                <Text
                  className={`text-sm font-medium ${
                    activeTab === tab.key ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Search Bar (for recruitment tab) */}
      {activeTab === 'hire' && (
        <View className="px-5 pt-4">
          <View className="flex-row items-center bg-white dark:bg-slate-800 rounded-xl px-4 py-3">
            <Search size={18} color="#64748b" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by name, skill, or function..."
              placeholderTextColor="#94a3b8"
              className="flex-1 ml-3 text-slate-900 dark:text-white text-base"
            />
            <Pressable onPress={() => setShowFilters(!showFilters)} className="p-1">
              <Filter size={18} color={showFilters ? '#3b82f6' : '#64748b'} />
            </Pressable>
          </View>

          {/* Filters */}
          {showFilters && (
            <Animated.View entering={FadeInDown.springify()} className="mt-3 bg-white dark:bg-slate-800 rounded-xl p-4">
              <Text className="text-slate-900 dark:text-white font-semibold mb-3">Filters</Text>

              {/* Function filter */}
              <View className="mb-3">
                <Text className="text-slate-500 dark:text-slate-400 text-sm mb-2">Function</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {['all', 'Marketing', 'Sales', 'Finance', 'Engineering', 'Ops'].map(func => (
                      <Pressable
                        key={func}
                        onPress={() => setSelectedFunction(func as BusinessFunction | 'all')}
                        className={`px-3 py-1.5 rounded-full ${
                          selectedFunction === func ? 'bg-blue-500' : 'bg-slate-100 dark:bg-slate-700'
                        }`}
                      >
                        <Text
                          className={`text-sm ${
                            selectedFunction === func ? 'text-white' : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {func === 'all' ? 'All' : func}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Availability filter */}
              <View>
                <Text className="text-slate-500 dark:text-slate-400 text-sm mb-2">Availability</Text>
                <View className="flex-row gap-2">
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'now', label: 'Available Now' },
                    { key: 'soon', label: 'Coming Soon' },
                  ].map(opt => (
                    <Pressable
                      key={opt.key}
                      onPress={() => setAvailabilityFilter(opt.key as 'all' | 'now' | 'soon')}
                      className={`px-3 py-1.5 rounded-full ${
                        availabilityFilter === opt.key ? 'bg-blue-500' : 'bg-slate-100 dark:bg-slate-700'
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          availabilityFilter === opt.key ? 'text-white' : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </Animated.View>
          )}
        </View>
      )}

      {/* Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 100 }}
      >
        {/* Squads Tab */}
        {activeTab === 'squads' && (
          <View>
            {/* Squads Header */}
            <Text className="text-slate-900 dark:text-white font-bold text-xl mb-3">Squads</Text>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-slate-500 dark:text-slate-400 text-sm">
                {squads.filter(s => s.type === 'manual').length} manual squads • {squads.filter(s => s.type === 'automatic').length} auto
              </Text>
              {isFounder && (
                <Pressable
                  onPress={() => {
                    Alert.alert('Create Squad', 'Use the Armory to create and manage squads');
                  }}
                  className="flex-row items-center gap-1 bg-blue-500 px-3 py-1.5 rounded-lg"
                >
                  <Plus size={14} color="white" />
                  <Text className="text-white text-sm font-medium">New Squad</Text>
                </Pressable>
              )}
            </View>

            {squads.length === 0 ? (
              <View className="items-center py-12">
                <UsersRound size={48} color="#94a3b8" />
                <Text className="text-slate-500 dark:text-slate-400 text-center mt-4">
                  No squads yet
                </Text>
                <Text className="text-slate-400 dark:text-slate-500 text-center mt-1 text-sm">
                  Squads form automatically when 2+ people work on the same task
                </Text>
              </View>
            ) : (
              <View>
                {squads.map((squad, index) => {
                  const squadMembers = members.filter(m => squad.memberIds.includes(m.id));
                  const modifiers = calculateTaskModifiers(squadMembers);
                  const totalMultiplier = calculateTotalMultiplier(modifiers);
                  const hasFounder = squadMembers.some(m => m.role === 'Founder');
                  const hasExec = squadMembers.some(m => m.role === 'FractionalExec');

                  return (
                    <AnimatedPressable
                      key={squad.id}
                      entering={FadeInDown.delay(index * 50).springify()}
                      className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-3"
                      style={{ borderLeftWidth: 4, borderLeftColor: squad.color || '#3b82f6' }}
                    >
                      <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-1">
                          <View className="flex-row items-center gap-2">
                            <Text className="text-slate-900 dark:text-white font-semibold text-base">
                              {squad.name}
                            </Text>
                            <View className={`px-2 py-0.5 rounded-full ${
                              squad.type === 'manual' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-slate-100 dark:bg-slate-700'
                            }`}>
                              <Text className={`text-xs ${
                                squad.type === 'manual' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'
                              }`}>
                                {squad.type === 'manual' ? 'Manual' : 'Auto'}
                              </Text>
                            </View>
                          </View>
                          {squad.function && (
                            <Text className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                              {squad.function}
                            </Text>
                          )}
                        </View>
                        {/* Speed Multiplier Badge */}
                        <View
                          className="px-3 py-1.5 rounded-lg"
                          style={{ backgroundColor: getModifierColor(totalMultiplier) + '20' }}
                        >
                          <Text style={{ color: getModifierColor(totalMultiplier) }} className="font-bold text-sm">
                            {formatMultiplierAsPercentage(totalMultiplier)} Speed
                          </Text>
                        </View>
                      </View>

                      {/* Leadership indicators */}
                      {(hasFounder || hasExec) && (
                        <View className="flex-row gap-2 mb-3">
                          {hasFounder && (
                            <View className="flex-row items-center gap-1 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-lg">
                              <Crown size={12} color="#f59e0b" />
                              <Text className="text-amber-600 dark:text-amber-400 text-xs font-medium">Founder Led</Text>
                            </View>
                          )}
                          {hasExec && !hasFounder && (
                            <View className="flex-row items-center gap-1 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-lg">
                              <Briefcase size={12} color="#a855f7" />
                              <Text className="text-purple-600 dark:text-purple-400 text-xs font-medium">Exec Led</Text>
                            </View>
                          )}
                        </View>
                      )}

                      {/* Squad Members */}
                      <View className="gap-2">
                        {squadMembers.map(member => (
                          <Pressable
                            key={member.id}
                            onPress={() => {
                              setSelectedMember(member);
                              setShowMemberDetails(true);
                            }}
                            className="flex-row items-center gap-2 active:opacity-70"
                          >
                            <View
                              className="w-8 h-8 rounded-full items-center justify-center"
                              style={{ backgroundColor: (ROLE_COLORS[member.role as keyof typeof ROLE_COLORS] || '#64748b') + '20' }}
                            >
                              <Text style={{ color: ROLE_COLORS[member.role as keyof typeof ROLE_COLORS] || '#64748b' }} className="font-bold text-xs">
                                {member.name.split(' ').map(n => n[0]).join('')}
                              </Text>
                            </View>
                            <Text className="text-slate-700 dark:text-slate-300 text-sm flex-1">
                              {member.name}
                            </Text>
                            <Text className="text-slate-500 dark:text-slate-400 text-xs">
                              {member.role === 'FractionalExec' ? `${member.daysPerWeek || 2}d/wk` : member.role}
                            </Text>
                          </Pressable>
                        ))}
                      </View>

                      {/* Active Modifiers */}
                      {modifiers.length > 0 && (
                        <View className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                          <Text className="text-slate-500 dark:text-slate-400 text-xs mb-2">Active Modifiers</Text>
                          <View className="flex-row flex-wrap gap-1">
                            {modifiers.slice(0, 4).map((mod, idx) => (
                              <View
                                key={`${mod.id}-${idx}`}
                                className="px-2 py-1 rounded"
                                style={{ backgroundColor: getModifierColor(mod.multiplier) + '15' }}
                              >
                                <Text
                                  style={{ color: getModifierColor(mod.multiplier) }}
                                  className="text-xs"
                                >
                                  {mod.name} {formatMultiplierAsPercentage(mod.multiplier)}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}

                      {/* Squad Tasks */}
                      {squad.taskIds && squad.taskIds.length > 0 && (
                        <View className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                          <Text className="text-slate-500 dark:text-slate-400 text-xs mb-1">
                            Working on {squad.taskIds.length} task{squad.taskIds.length !== 1 ? 's' : ''}
                          </Text>
                        </View>
                      )}
                    </AnimatedPressable>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Team Tab */}
        {activeTab === 'team' && (
          <View>
            {/* Weekly Resource Pool Preview */}
            <Pressable
              onPress={() => router.push('/utilization' as any)}
              className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-6"
              style={{
                borderLeftWidth: 4,
                borderLeftColor: resourcePoolTotals.utilizationPercent >= 100
                  ? '#ef4444'
                  : resourcePoolTotals.utilizationPercent >= 80
                  ? '#f59e0b'
                  : '#10b981',
              }}
            >
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2">
                  {resourcePoolTotals.utilizationPercent >= 100 ? (
                    <AlertTriangle size={20} color="#ef4444" />
                  ) : resourcePoolTotals.utilizationPercent >= 80 ? (
                    <TrendingUp size={20} color="#f59e0b" />
                  ) : (
                    <CheckCircle2 size={20} color="#10b981" />
                  )}
                  <Text className="text-slate-900 dark:text-white font-bold text-base">
                    Weekly Resource Pool
                  </Text>
                </View>
                <ChevronRight size={18} color="#64748b" />
              </View>

              <View className="flex-row items-center justify-between mb-3">
                <Text
                  className={`text-4xl font-bold ${
                    resourcePoolTotals.utilizationPercent >= 100
                      ? 'text-red-600 dark:text-red-400'
                      : resourcePoolTotals.utilizationPercent >= 80
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {Math.round(resourcePoolTotals.utilizationPercent)}%
                </Text>
                <View className="items-end">
                  <Text className="text-slate-500 dark:text-slate-400 text-xs mb-1">
                    {resourcePoolTotals.utilizationPercent >= 100
                      ? 'Overloaded'
                      : resourcePoolTotals.utilizationPercent >= 80
                      ? 'High Utilization'
                      : 'Capacity Available'}
                  </Text>
                  <Text className="text-slate-900 dark:text-white font-semibold">
                    {resourcePoolTotals.available} TU Remaining
                  </Text>
                </View>
              </View>

              {/* Progress bar */}
              <View className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(resourcePoolTotals.utilizationPercent, 100)}%`,
                    backgroundColor:
                      resourcePoolTotals.utilizationPercent >= 100
                        ? '#ef4444'
                        : resourcePoolTotals.utilizationPercent >= 80
                        ? '#f59e0b'
                        : '#10b981',
                  }}
                />
              </View>

              {/* Stats row */}
              <View className="flex-row justify-between">
                <View>
                  <Text className="text-slate-500 dark:text-slate-400 text-xs">Total Capacity</Text>
                  <Text className="text-slate-900 dark:text-white font-semibold">
                    {resourcePoolTotals.total} TU
                  </Text>
                </View>
                <View>
                  <Text className="text-slate-500 dark:text-slate-400 text-xs">Used</Text>
                  <Text className="text-slate-900 dark:text-white font-semibold">
                    {resourcePoolTotals.allocated} TU
                  </Text>
                </View>
                <View>
                  <Text className="text-slate-500 dark:text-slate-400 text-xs">Available</Text>
                  <Text className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    {resourcePoolTotals.available} TU
                  </Text>
                </View>
              </View>
            </Pressable>

            {/* Pending Requests (if any) */}
            {pendingRequests.length > 0 && isFounder && (
              <View className="mb-6">
                <View className="flex-row items-center gap-2 mb-3">
                  <AlertCircle size={18} color="#f59e0b" />
                  <Text className="text-slate-900 dark:text-white font-semibold">
                    Pending Requests ({pendingRequests.length})
                  </Text>
                </View>
                {pendingRequests.slice(0, 2).map(req => (
                  <View key={req.id} className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 mb-2">
                    <Text className="text-slate-900 dark:text-white font-medium">{req.candidateName}</Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-sm">{req.candidateRole}</Text>
                    <View className="flex-row gap-2 mt-2">
                      <Pressable
                        onPress={() => approveRequest(req.id, currentUser?.id || 'founder')}
                        className="bg-green-500 px-4 py-2 rounded-lg"
                      >
                        <Text className="text-white font-medium text-sm">Approve</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => rejectRequest(req.id, currentUser?.id || 'founder')}
                        className="bg-red-500 px-4 py-2 rounded-lg"
                      >
                        <Text className="text-white font-medium text-sm">Reject</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Team by Role */}
            {(['Founder', 'FractionalExec', 'Apprentice'] as const).map(role => {
              const roleMembers = teamByRole[role] || [];
              if (roleMembers.length === 0) return null;

              const isExpanded = expandedSections[role];
              const roleColor = ROLE_COLORS[role];
              const RoleIcon = role === 'Founder' ? Crown : role === 'FractionalExec' ? Briefcase : GraduationCap;

              return (
                <View key={role} className="mb-4">
                  <Pressable
                    onPress={() => toggleSection(role)}
                    className="flex-row items-center justify-between mb-3"
                  >
                    <View className="flex-row items-center gap-2">
                      <View
                        className="w-8 h-8 rounded-lg items-center justify-center"
                        style={{ backgroundColor: roleColor + '20' }}
                      >
                        <RoleIcon size={18} color={roleColor} />
                      </View>
                      <Text className="text-slate-900 dark:text-white font-semibold text-base">
                        {ROLE_LABELS[role]}
                      </Text>
                      <View className="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                        <Text className="text-slate-600 dark:text-slate-300 text-xs font-medium">
                          {roleMembers.length}
                        </Text>
                      </View>
                    </View>
                    {isExpanded ? (
                      <ChevronUp size={20} color="#64748b" />
                    ) : (
                      <ChevronDown size={20} color="#64748b" />
                    )}
                  </Pressable>

                  {isExpanded && (
                    <Animated.View entering={FadeInDown.springify()}>
                      {roleMembers.map(member => (
                        <TeamMemberCard key={member.id} member={member} />
                      ))}
                    </Animated.View>
                  )}
                </View>
              );
            })}

            {/* Add Team Member Button (Founder only) */}
            {isFounder && (
              <Pressable
                onPress={() => setActiveTab('hire')}
                className="bg-blue-500 rounded-xl py-4 flex-row items-center justify-center gap-2 mt-4"
              >
                <UserPlus size={20} color="white" />
                <Text className="text-white font-semibold text-base">Hire New Team Member</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Resources Tab - Documentation & Help */}
        {activeTab === 'resources' && (
          <View>
            <Text className="text-slate-900 dark:text-white font-bold text-2xl mb-2">Resources & Documentation</Text>
            <Text className="text-slate-500 dark:text-slate-400 mb-6">
              Guides, templates, and tools to help you manage your team effectively
            </Text>

            {/* Team Templates */}
            <View className="mb-6">
              <Text className="text-slate-900 dark:text-white font-semibold text-lg mb-3">Team Templates</Text>
              <View className="gap-3">
                <Pressable
                  onPress={() => {
                    setSelectedTemplate('pre-seed');
                    setShowTemplateModal(true);
                  }}
                  className="bg-white dark:bg-slate-800 rounded-xl p-4 active:opacity-70"
                >
                  <Text className="text-slate-900 dark:text-white font-semibold mb-2">Startup Team (Pre-Seed)</Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-sm mb-3">
                    1 Founder + 2 Fractional Execs (Eng, Marketing) + 3 Apprentices
                  </Text>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-blue-600 dark:text-blue-400 text-sm font-medium">View Template →</Text>
                    <View className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                      <Text className="text-blue-600 dark:text-blue-400 text-xs font-medium">6 members</Text>
                    </View>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setSelectedTemplate('seed');
                    setShowTemplateModal(true);
                  }}
                  className="bg-white dark:bg-slate-800 rounded-xl p-4 active:opacity-70"
                >
                  <Text className="text-slate-900 dark:text-white font-semibold mb-2">Growth Team (Seed)</Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-sm mb-3">
                    2 Founders + 4 Fractional Execs + 6 Apprentices
                  </Text>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-blue-600 dark:text-blue-400 text-sm font-medium">View Template →</Text>
                    <View className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                      <Text className="text-blue-600 dark:text-blue-400 text-xs font-medium">12 members</Text>
                    </View>
                  </View>
                </Pressable>
              </View>
            </View>

            {/* FAQs */}
            <View>
              <Text className="text-slate-900 dark:text-white font-semibold text-lg mb-3">Common Questions</Text>
              <View className="gap-3">
                <View className="bg-white dark:bg-slate-800 rounded-xl p-4">
                  <Text className="text-slate-900 dark:text-white font-semibold mb-2">How do I allocate team members to tasks?</Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-sm">
                    Go to the What tab, select a task, and assign team members from the allocation panel. Executives can request allocations that require founder approval.
                  </Text>
                </View>

                <View className="bg-white dark:bg-slate-800 rounded-xl p-4">
                  <Text className="text-slate-900 dark:text-white font-semibold mb-2">What are squads and how do they form?</Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-sm">
                    Squads are groups of 2+ people working together. They form automatically when multiple people are assigned to the same task, creating performance bonuses.
                  </Text>
                </View>

                <View className="bg-white dark:bg-slate-800 rounded-xl p-4">
                  <Text className="text-slate-900 dark:text-white font-semibold mb-2">How much do fractional executives cost?</Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-sm">
                    Fractional executives typically cost £400-£1000/day depending on experience and function. They work 2-5 days per week, providing senior expertise without full-time commitment.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Hire Tab (combines Executives and Apprentices) */}
        {activeTab === 'hire' && (
          <View className="flex-1">
            {/* Sub-tabs for Executives and Apprentices */}
            <View className="flex-row gap-2 mb-4">
              <Pressable
                onPress={() => setSelectedFunction('all')}
                className={`flex-1 py-2.5 rounded-lg ${selectedFunction === 'all' ? 'bg-blue-500' : 'bg-slate-100 dark:bg-slate-800'}`}
              >
                <Text className={`text-center font-medium ${selectedFunction === 'all' ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                  Executives
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setSelectedFunction('Engineering')}
                className={`flex-1 py-2.5 rounded-lg ${selectedFunction === 'Engineering' ? 'bg-blue-500' : 'bg-slate-100 dark:bg-slate-800'}`}
              >
                <Text className={`text-center font-medium ${selectedFunction === 'Engineering' ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                  Apprentices
                </Text>
              </Pressable>
            </View>

            {/* Show Executives */}
            {selectedFunction === 'all' && (
              <>
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-slate-500 dark:text-slate-400 text-sm">
                    {scoredExecutives.length} executives found
                  </Text>
                  {shortlistedIds.size > 0 && (
                    <View className="flex-row items-center gap-1">
                      <Heart size={14} color="#ef4444" fill="#ef4444" />
                      <Text className="text-red-500 text-sm font-medium">{shortlistedIds.size} shortlisted</Text>
                    </View>
                  )}
                </View>

                {scoredExecutives.length === 0 ? (
                  <View className="items-center py-12">
                    <Briefcase size={48} color="#94a3b8" />
                    <Text className="text-slate-500 dark:text-slate-400 text-center mt-4">
                      No executives match your filters
                    </Text>
                  </View>
                ) : (
                  <FlashList
                    data={scoredExecutives}
                    renderItem={({ item, index }) => (
                      <CandidateCard candidate={item} index={index} />
                    )}
                    estimatedItemSize={280}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                  />
                )}
              </>
            )}

            {/* Show Apprentices */}
            {selectedFunction === 'Engineering' && (
              <>
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-slate-500 dark:text-slate-400 text-sm">
                    {scoredApprentices.length} apprentices found
                  </Text>
                  {shortlistedIds.size > 0 && (
                    <View className="flex-row items-center gap-1">
                      <Heart size={14} color="#ef4444" fill="#ef4444" />
                      <Text className="text-red-500 text-sm font-medium">{shortlistedIds.size} shortlisted</Text>
                    </View>
                  )}
                </View>

                {scoredApprentices.length === 0 ? (
                  <View className="items-center py-12">
                    <GraduationCap size={48} color="#94a3b8" />
                    <Text className="text-slate-500 dark:text-slate-400 text-center mt-4">
                      No apprentices match your filters
                    </Text>
                  </View>
                ) : (
                  <FlashList
                    data={scoredApprentices}
                    renderItem={({ item, index }) => (
                      <CandidateCard candidate={item} index={index} />
                    )}
                    estimatedItemSize={280}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                  />
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* Floating Compare Button */}
      {selectedForComparison.length > 0 && activeTab === 'hire' && (
        <Animated.View
          entering={FadeInDown.springify()}
          className="absolute bottom-24 left-5 right-5"
        >
          <Pressable
            onPress={() => setShowCompareModal(true)}
            className="bg-purple-500 rounded-xl py-4 flex-row items-center justify-center gap-2 active:opacity-80"
            style={{
              shadowColor: '#8b5cf6',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Scale size={20} color="#fff" />
            <Text className="text-white font-bold text-base">
              Compare {selectedForComparison.length} Candidate{selectedForComparison.length !== 1 ? 's' : ''}
            </Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Team Template Modal */}
      <Modal
        visible={showTemplateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTemplateModal(false)}
      >
        <Pressable className="flex-1 bg-black/70" onPress={() => setShowTemplateModal(false)}>
          <View className="flex-1" />
          <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '80%' }}>
            <View className="bg-white dark:bg-slate-900 rounded-t-3xl">
              {/* Header */}
              <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                <Text className="text-slate-900 dark:text-white font-bold text-xl">
                  {selectedTemplate === 'pre-seed' ? 'Startup Team (Pre-Seed)' : 'Growth Team (Seed)'}
                </Text>
                <Pressable onPress={() => setShowTemplateModal(false)} className="p-2">
                  <X size={24} color="#64748b" />
                </Pressable>
              </View>

              {/* Content */}
              <ScrollView className="px-6 py-4" contentContainerStyle={{ paddingBottom: 20 }}>
                <Text className="text-slate-500 dark:text-slate-400 mb-4">
                  {selectedTemplate === 'pre-seed'
                    ? 'Ideal for early-stage startups with limited funding. Lean team focused on product development and initial market validation.'
                    : 'Designed for post-seed companies ready to scale. Balanced team across all key functions with room for growth.'}
                </Text>

                {/* Team Composition */}
                <View className="mb-6">
                  <Text className="text-slate-900 dark:text-white font-semibold mb-3">Team Composition</Text>
                  <View className="gap-2">
                    {selectedTemplate === 'pre-seed' ? (
                      <>
                        <View className="flex-row items-center gap-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                          <Crown size={20} color="#3b82f6" />
                          <Text className="flex-1 text-slate-700 dark:text-slate-300"><Text className="font-semibold">1 Founder</Text> - CEO/Product Lead</Text>
                        </View>
                        <View className="flex-row items-center gap-3 bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                          <Briefcase size={20} color="#8b5cf6" />
                          <Text className="flex-1 text-slate-700 dark:text-slate-300"><Text className="font-semibold">2 Fractional Execs</Text> - Engineering & Marketing (2 days/week each)</Text>
                        </View>
                        <View className="flex-row items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg">
                          <GraduationCap size={20} color="#10b981" />
                          <Text className="flex-1 text-slate-700 dark:text-slate-300"><Text className="font-semibold">3 Apprentices</Text> - Dev, Design, Operations</Text>
                        </View>
                      </>
                    ) : (
                      <>
                        <View className="flex-row items-center gap-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                          <Crown size={20} color="#3b82f6" />
                          <Text className="flex-1 text-slate-700 dark:text-slate-300"><Text className="font-semibold">2 Founders</Text> - CEO & CTO</Text>
                        </View>
                        <View className="flex-row items-center gap-3 bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                          <Briefcase size={20} color="#8b5cf6" />
                          <Text className="flex-1 text-slate-700 dark:text-slate-300"><Text className="font-semibold">4 Fractional Execs</Text> - Sales, Marketing, Finance, Ops</Text>
                        </View>
                        <View className="flex-row items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg">
                          <GraduationCap size={20} color="#10b981" />
                          <Text className="flex-1 text-slate-700 dark:text-slate-300"><Text className="font-semibold">6 Apprentices</Text> - 2 Dev, 2 Design, 1 Sales, 1 Support</Text>
                        </View>
                      </>
                    )}
                  </View>
                </View>

                {/* Benefits */}
                <View className="mb-6">
                  <Text className="text-slate-900 dark:text-white font-semibold mb-3">Why This Template?</Text>
                  <View className="gap-2">
                    <View className="flex-row items-start gap-2">
                      <Text className="text-blue-500 mt-0.5">✓</Text>
                      <Text className="flex-1 text-slate-600 dark:text-slate-400 text-sm">
                        {selectedTemplate === 'pre-seed'
                          ? 'Cost-effective with fractional expertise'
                          : 'Balanced coverage across all key functions'}
                      </Text>
                    </View>
                    <View className="flex-row items-start gap-2">
                      <Text className="text-blue-500 mt-0.5">✓</Text>
                      <Text className="flex-1 text-slate-600 dark:text-slate-400 text-sm">
                        {selectedTemplate === 'pre-seed'
                          ? 'Apprentices provide bandwidth at lower cost'
                          : 'Room for growth as company scales'}
                      </Text>
                    </View>
                    <View className="flex-row items-start gap-2">
                      <Text className="text-blue-500 mt-0.5">✓</Text>
                      <Text className="flex-1 text-slate-600 dark:text-slate-400 text-sm">
                        {selectedTemplate === 'pre-seed'
                          ? 'Agile and lean structure'
                          : 'Professional leadership with execution capacity'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Call to Action */}
                <View className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                  <Text className="text-slate-700 dark:text-slate-300 text-sm mb-3">
                    Ready to build this team? Use the Hire tab to find and add Fractional Executives and Apprentices.
                  </Text>
                  <Pressable
                    onPress={() => {
                      setShowTemplateModal(false);
                      setActiveTab('hire');
                    }}
                    className="bg-blue-500 py-3 rounded-lg items-center"
                  >
                    <Text className="text-white font-semibold">Go to Hire Tab</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Comparison Modal */}
      <Modal
        visible={showCompareModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCompareModal(false)}
      >
        <Pressable className="flex-1 bg-black/70" onPress={() => setShowCompareModal(false)}>
          <View className="flex-1" />
          <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '95%' }}>
            <View className="bg-white dark:bg-slate-900 rounded-t-3xl">
              {/* Handle */}
              <View className="items-center py-3">
                <View className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
              </View>

              <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
                {/* Header */}
                <View className="px-5 pb-4 flex-row items-center justify-between">
                  <View>
                    <Text className="text-slate-900 dark:text-white text-xl font-bold">
                      Compare Candidates
                    </Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-sm">
                      {candidatesForComparison.length} selected
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setSelectedForComparison([])}
                    className="bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg"
                  >
                    <Text className="text-slate-600 dark:text-slate-300 text-sm font-medium">Clear All</Text>
                  </Pressable>
                </View>

                {candidatesForComparison.length > 0 && (
                  <View className="px-5">
                    {/* Candidate avatars row */}
                    <View className="flex-row justify-around mb-4">
                      {candidatesForComparison.map((c) => (
                        <View key={c.id} className="items-center">
                          <View
                            className="w-16 h-16 rounded-full items-center justify-center mb-2"
                            style={{ backgroundColor: c.role === 'FractionalExec' ? '#3b82f620' : '#10b98120' }}
                          >
                            <Text
                              style={{ color: c.role === 'FractionalExec' ? '#3b82f6' : '#10b981' }}
                              className="font-bold text-lg"
                            >
                              {c.name.split(' ').map(n => n[0]).join('')}
                            </Text>
                          </View>
                          <Text className="text-slate-900 dark:text-white font-semibold text-sm text-center">
                            {c.name.split(' ')[0]}
                          </Text>
                          <Pressable
                            onPress={() => toggleComparison(c.id)}
                            className="mt-1 p-1"
                          >
                            <X size={14} color="#ef4444" />
                          </Pressable>
                        </View>
                      ))}
                    </View>

                    {/* Comparison Grid */}
                    <View className="bg-slate-50 dark:bg-slate-800 rounded-xl overflow-hidden">
                      {/* Rating */}
                      <View className="flex-row border-b border-slate-200 dark:border-slate-700">
                        <View className="w-24 p-3 bg-slate-100 dark:bg-slate-700">
                          <Text className="text-slate-600 dark:text-slate-300 text-xs font-medium">Rating</Text>
                        </View>
                        {candidatesForComparison.map((c) => (
                          <View key={c.id} className="flex-1 p-3 items-center">
                            <View className="flex-row items-center gap-1">
                              <Star size={12} color="#f59e0b" fill="#f59e0b" />
                              <Text className="text-slate-900 dark:text-white font-semibold">{c.rating}</Text>
                            </View>
                          </View>
                        ))}
                      </View>

                      {/* Experience */}
                      <View className="flex-row border-b border-slate-200 dark:border-slate-700">
                        <View className="w-24 p-3 bg-slate-100 dark:bg-slate-700">
                          <Text className="text-slate-600 dark:text-slate-300 text-xs font-medium">Experience</Text>
                        </View>
                        {candidatesForComparison.map((c) => (
                          <View key={c.id} className="flex-1 p-3 items-center">
                            <Text className="text-slate-900 dark:text-white font-semibold">{c.experience} yrs</Text>
                          </View>
                        ))}
                      </View>

                      {/* Day Rate */}
                      <View className="flex-row border-b border-slate-200 dark:border-slate-700">
                        <View className="w-24 p-3 bg-slate-100 dark:bg-slate-700">
                          <Text className="text-slate-600 dark:text-slate-300 text-xs font-medium">Day Rate</Text>
                        </View>
                        {candidatesForComparison.map((c) => (
                          <View key={c.id} className="flex-1 p-3 items-center">
                            <Text className="text-slate-900 dark:text-white font-semibold">£{c.costPerDay}</Text>
                          </View>
                        ))}
                      </View>

                      {/* Availability */}
                      <View className="flex-row border-b border-slate-200 dark:border-slate-700">
                        <View className="w-24 p-3 bg-slate-100 dark:bg-slate-700">
                          <Text className="text-slate-600 dark:text-slate-300 text-xs font-medium">Availability</Text>
                        </View>
                        {candidatesForComparison.map((c) => (
                          <View key={c.id} className="flex-1 p-3 items-center">
                            <Text
                              className="text-xs font-medium text-center"
                              style={{ color: c.availability.toLowerCase().includes('now') ? '#10b981' : '#f59e0b' }}
                            >
                              {c.availability}
                            </Text>
                          </View>
                        ))}
                      </View>

                      {/* Skills count */}
                      <View className="flex-row border-b border-slate-200 dark:border-slate-700">
                        <View className="w-24 p-3 bg-slate-100 dark:bg-slate-700">
                          <Text className="text-slate-600 dark:text-slate-300 text-xs font-medium">Skills</Text>
                        </View>
                        {candidatesForComparison.map((c) => (
                          <View key={c.id} className="flex-1 p-3 items-center">
                            <Text className="text-slate-900 dark:text-white font-semibold">{c.skills.length}</Text>
                          </View>
                        ))}
                      </View>

                      {/* Function */}
                      <View className="flex-row">
                        <View className="w-24 p-3 bg-slate-100 dark:bg-slate-700">
                          <Text className="text-slate-600 dark:text-slate-300 text-xs font-medium">Function</Text>
                        </View>
                        {candidatesForComparison.map((c) => (
                          <View key={c.id} className="flex-1 p-3 items-center">
                            <Text className="text-slate-700 dark:text-slate-300 text-xs text-center">
                              {c.specialization.join(', ')}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Contact actions */}
                    <View className="mt-4">
                      <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-3">CONTACT</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View className="flex-row gap-3">
                          {candidatesForComparison.map((c) => (
                            <View key={c.id} className="bg-white dark:bg-slate-800 rounded-xl p-3 w-32 items-center">
                              <Text className="text-slate-900 dark:text-white font-semibold text-sm mb-2">
                                {c.name.split(' ')[0]}
                              </Text>
                              <View className="flex-row gap-2">
                                <Pressable
                                  onPress={() => Linking.openURL(`tel:${c.phone}`)}
                                  className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg"
                                >
                                  <Phone size={16} color="#22c55e" />
                                </Pressable>
                                <Pressable
                                  onPress={() => Linking.openURL(`mailto:${c.email}`)}
                                  className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg"
                                >
                                  <Mail size={16} color="#3b82f6" />
                                </Pressable>
                              </View>
                            </View>
                          ))}
                        </View>
                      </ScrollView>
                    </View>

                    {/* Hire actions */}
                    <View className="mt-4">
                      <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-3">
                        {isFounder ? 'HIRE' : 'REQUEST TO HIRE'}
                      </Text>
                      {candidatesForComparison.map((c) => (
                        <Pressable
                          key={c.id}
                          onPress={() => {
                            setShowCompareModal(false);
                            handleHireCandidate(c);
                          }}
                          className={`mb-2 rounded-xl py-3 flex-row items-center justify-center gap-2 active:opacity-80 ${
                            isFounder ? 'bg-blue-500' : 'bg-amber-500'
                          }`}
                        >
                          <Text className="text-white font-semibold">
                            {isFounder ? `Hire ${c.name}` : `Request ${c.name}`}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
