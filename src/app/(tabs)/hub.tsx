import { View, Text, ScrollView, Pressable, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { useState, useMemo } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import Animated, { FadeInDown, FadeInRight, useAnimatedStyle, withSpring, useSharedValue, withTiming } from 'react-native-reanimated';
import { FlashList } from '@shopify/flash-list';
import {
  Users,
  Briefcase,
  Award,
  Factory,
  X,
  Plus,
  Upload,
  CheckCircle2,
  Mail,
  Phone,
  Building2,
  Star,
  Filter,
  Send,
  Bot,
  Calendar,
  BookOpen,
  Search,
  TrendingUp,
  Clock,
  DollarSign,
  ChevronRight,
  Crown,
  Zap,
  Target,
  Sparkles,
  ArrowUpRight,
  Heart,
  Scale,
  MapPin,
  GraduationCap,
  BadgeCheck,
  Layers,
  SlidersHorizontal,
  HelpCircle,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { fractionalExecutives, apprentices, type Candidate } from '@/lib/candidates-seed';
import { UK_SUPPLIERS } from '@/lib/suppliers-seed';
import { THIRD_PARTY_AI_TOOLS, getAIToolsByFunction, getTotalAIToolsCount, getCategoryColor, type ThirdPartyAITool, type BusinessFunction } from '@/lib/third-party-ai-tools';
import { TabDescription } from '@/components/TabDescription';
import { useCurrentMembership } from '@/lib/state/app-store';
import { useSupplierStore } from '@/lib/state/supplier-store';
import type { Supplier } from '@/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HelpModal, HelpButton, type HelpContent } from '@/components/HelpModal';

const HUB_HELP: HelpContent = {
  title: 'Marketplace & AI Tools',
  subtitle: 'Build your team & AI capabilities',
  description: 'The Hub is your marketplace for talent, suppliers, and AI tools. Hire fractional executives and apprentices, find suppliers for orchestration, and equip your team with AI tools that boost productivity. Each person can equip tools in 5 slots: Think (research), Create (draft/design), Verify (QA), Execute (code/automation), Ops (workflow/PM).',
  tips: [
    'Take the AI Readiness Assessment (6 questions, 2 minutes) to unlock tool recommendations for each person',
    'AI tools are licensed per-seat with monthly costs—budget tool spend in your financials',
    'Each tool has setupTU (one-time onboarding cost) and riskTier (green/amber/red for safety)',
    'Tools boost productivity: speedMult (faster), qualityMult (less rework), flowMultDelta (less blocked time)',
    'Match tools to AI readiness scores—higher-risk tools require higher readiness (75+ for red-tier)',
    'Use shortlist to compare candidates or tools side-by-side before hiring/purchasing',
    'For orchestration: browse UK suppliers by category (PCB, Plastics, Machining, Assembly, etc.)',
  ],
  quickActions: [
    { label: 'AI Readiness Assessment', description: 'Take 6-question quiz to determine AI comfort, constraints, and recommended tools per person' },
    { label: 'AI Tools Marketplace', description: 'Browse 12+ tools across 5 slots. View pricing (£8-30/mo), setupTU, effects, and risk tier' },
    { label: 'Equip Loadout', description: 'Assign AI tools to each person\'s 5 slots. View current loadout and productivity multipliers.' },
    { label: 'Hire Executives', description: 'Browse fractional executives by function (Build/Make/Sell/Serve/Ops). Work 2-5 days/week.' },
    { label: 'Hire Apprentices', description: 'Find talented apprentices with 10 TU/week capacity at £70/TU' },
    { label: 'Find Suppliers', description: 'Discover UK-based suppliers for outsourced work (orchestration, not manufacturing)' },
  ],
};

type HubTab = 'discover' | 'executives' | 'apprentices' | 'suppliers' | 'ai-agents' | 'shortlist' | 'apply';

// Talent scoring algorithm - headhunter-grade matching
interface TalentScore {
  overall: number;
  experienceScore: number;
  availabilityScore: number;
  valueScore: number; // cost vs experience ratio
  skillMatch: number;
}

function calculateTalentScore(candidate: Candidate, searchQuery: string, desiredSkills: string[]): TalentScore {
  // Experience score (0-25 points)
  const experienceScore = Math.min(25, (candidate.experience / 20) * 25);

  // Availability score (0-25 points)
  const availabilityScore = candidate.availability.toLowerCase().includes('now') ? 25 :
    candidate.availability.toLowerCase().includes('jan') ? 18 : 12;

  // Value score - cost efficiency (0-25 points)
  const avgCost = candidate.role === 'FractionalExec' ? 850 : 350;
  const valueScore = Math.max(0, 25 - ((candidate.costPerDay - avgCost) / avgCost) * 15);

  // Skill match (0-25 points)
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
    skillMatch = 15; // Base score when no filter
  }

  return {
    overall: Math.round(experienceScore + availabilityScore + valueScore + skillMatch),
    experienceScore: Math.round(experienceScore),
    availabilityScore: Math.round(availabilityScore),
    valueScore: Math.round(valueScore),
    skillMatch: Math.round(skillMatch),
  };
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const currentMembership = useCurrentMembership();
  const suppliers = useSupplierStore((s) => s.suppliers);
  const selectSupplier = useSupplierStore((s) => s.selectSupplier);
  const selectedSupplierFromStore = useSupplierStore((s) => s.selectedSupplier);
  const searchSuppliers = useSupplierStore((s) => s.searchSuppliers);

  const [activeTab, setActiveTab] = useState<HubTab>('discover');
  const [showHelp, setShowHelp] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [selectedAIAgent, setSelectedAIAgent] = useState<ThirdPartyAITool | null>(null);
  const [selectedAIFunction, setSelectedAIFunction] = useState<BusinessFunction | 'all'>('all');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFunction, setSelectedFunction] = useState<string>('all');
  const [selectedSupplierType, setSelectedSupplierType] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestType, setRequestType] = useState<'executive' | 'apprentice' | 'supplier' | null>(null);
  const [requestNotes, setRequestNotes] = useState('');

  // Advanced filters
  const [minExperience, setMinExperience] = useState(0);
  const [maxCost, setMaxCost] = useState(2000);
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'now' | 'soon'>('all');

  // Shortlist functionality
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set());

  // Compare mode
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Application state
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applicationType, setApplicationType] = useState<'executive' | 'apprentice' | 'supplier'>('executive');
  const [applicationName, setApplicationName] = useState('');
  const [applicationEmail, setApplicationEmail] = useState('');
  const [applicationPhone, setApplicationPhone] = useState('');
  const [applicationSpecialization, setApplicationSpecialization] = useState('');
  const [applicationExperience, setApplicationExperience] = useState('');
  const [applicationCV, setApplicationCV] = useState<{ name: string; uri: string; size: number } | null>(null);

  const isFounder = currentMembership?.role === 'Founder';

  // Memoized talent score cache - calculate once for all candidates
  // This eliminates redundant scoring calculations (50+ candidates × multiple filters)
  const candidateScores = useMemo(() => {
    const cache = new Map<string, TalentScore>();
    const desiredSkills = searchQuery.split(',').map(s => s.trim()).filter(Boolean);

    // Score all executives
    fractionalExecutives.forEach(exec => {
      cache.set(exec.id, calculateTalentScore(exec, searchQuery, desiredSkills));
    });

    // Score all apprentices
    apprentices.forEach(app => {
      cache.set(app.id, calculateTalentScore(app, searchQuery, desiredSkills));
    });

    return cache;
  }, [searchQuery]);

  // Scored and filtered executives
  const scoredExecutives = useMemo(() => {
    return fractionalExecutives
      .map(exec => ({
        ...exec,
        score: candidateScores.get(exec.id)!,
      }))
      .filter(exec => {
        const matchesSearch = searchQuery === '' ||
          exec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          exec.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase())) ||
          exec.specialization.some(spec => spec.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesFunction = selectedFunction === 'all' || exec.specialization.includes(selectedFunction as any);
        const matchesExperience = exec.experience >= minExperience;
        const matchesCost = exec.costPerDay <= maxCost;
        const matchesAvailability = availabilityFilter === 'all' ||
          (availabilityFilter === 'now' && exec.availability.toLowerCase().includes('now')) ||
          (availabilityFilter === 'soon' && !exec.availability.toLowerCase().includes('now'));

        return matchesSearch && matchesFunction && matchesExperience && matchesCost && matchesAvailability;
      })
      .sort((a, b) => b.score.overall - a.score.overall);
  }, [candidateScores, selectedFunction, minExperience, maxCost, availabilityFilter, searchQuery]);

  // Scored and filtered apprentices
  const scoredApprentices = useMemo(() => {
    return apprentices
      .map(app => ({
        ...app,
        score: candidateScores.get(app.id)!,
      }))
      .filter(app => {
        const matchesSearch = searchQuery === '' ||
          app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase())) ||
          app.specialization.some(spec => spec.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesFunction = selectedFunction === 'all' || app.specialization.includes(selectedFunction as any);

        return matchesSearch && matchesFunction;
      })
      .sort((a, b) => b.score.overall - a.score.overall);
  }, [candidateScores, selectedFunction, searchQuery]);

  // Filter suppliers - memoized to prevent re-calculation on every render
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => {
      const matchesSearch = searchQuery === '' ||
        supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.capabilities.some(spec => spec.toLowerCase().includes(searchQuery.toLowerCase())) ||
        `${supplier.location.city}, ${supplier.location.country}`.toLowerCase().includes(searchQuery.toLowerCase());

      // Filter by service type
      const matchesType = selectedSupplierType === 'all' ||
        (selectedSupplierType === 'manufacturing' && (supplier.serviceType === 'manufacturing' || !supplier.serviceType)) ||
        (selectedSupplierType === 'bank' && supplier.serviceType === 'bank') ||
        (selectedSupplierType === 'lawyer' && supplier.serviceType === 'lawyer') ||
        (selectedSupplierType === 'accountant' && supplier.serviceType === 'accountant') ||
        (selectedSupplierType === 'professional-services' && ['bank', 'lawyer', 'accountant'].includes(supplier.serviceType || ''));

      return matchesSearch && matchesType;
    });
  }, [suppliers, searchQuery, selectedSupplierType]);

  // Top picks - best matches across all categories
  const topPicks = useMemo(() => {
    const topExecs = scoredExecutives.slice(0, 3);
    const topApprentices = scoredApprentices.slice(0, 2);
    const topAI = getAIToolsByFunction('all').slice(0, 2);
    const topSuppliers = suppliers.slice(0, 3);
    return { topExecs, topApprentices, topAI, topSuppliers };
  }, [scoredExecutives, scoredApprentices, suppliers]);

  // Shortlisted items
  const shortlistedExecutives = scoredExecutives.filter(e => shortlistedIds.has(e.id));
  const shortlistedApprentices = scoredApprentices.filter(a => shortlistedIds.has(a.id));

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

  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      }
      if (prev.length >= 3) {
        Alert.alert('Compare Limit', 'You can compare up to 3 candidates at a time.');
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleRequestAllocation = (type: 'executive' | 'apprentice' | 'supplier', item: any) => {
    setRequestType(type);
    setRequestNotes('');

    if (type === 'executive' || type === 'apprentice') {
      setSelectedCandidate(item);
    } else {
      selectSupplier(item);
    }

    setShowRequestModal(true);
  };

  const handleQuickOnboard = (type: 'executive' | 'apprentice' | 'supplier', item: any) => {
    const name = type === 'supplier' ? item.name : item.name;
    Alert.alert(
      'Quick Onboard Request',
      `Request ${name} for your team?\n\nThis will be sent to the founder for fast-track approval.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Request',
          onPress: () => {
            Alert.alert('Request Sent', `Your request for ${name} has been sent for approval.`);
          },
        },
      ]
    );
  };

  const handleSubmitRequest = () => {
    if (!requestType) return;

    const resourceName = requestType === 'supplier'
      ? selectedSupplierFromStore?.name
      : selectedCandidate?.name;

    Alert.alert(
      'Request Submitted',
      `Your request to add ${resourceName} has been sent to the founder for approval in the Decide tab.`,
      [{ text: 'OK' }]
    );

    setShowRequestModal(false);
    setRequestType(null);
    setRequestNotes('');
    setSelectedCandidate(null);
    selectSupplier(null);
  };

  const handleSubmitApplication = () => {
    if (!applicationName || !applicationEmail) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    const cvInfo = applicationCV
      ? `\n\nCV/Resume: ${applicationCV.name} (${(applicationCV.size / 1024).toFixed(1)} KB)`
      : '';

    Alert.alert(
      'Application Submitted',
      `Your ${applicationType} application has been submitted successfully${cvInfo ? ' with your CV/resume' : ''}. You'll be contacted if there's a match.`,
      [{ text: 'OK' }]
    );

    // Reset form
    setApplicationName('');
    setApplicationEmail('');
    setApplicationPhone('');
    setApplicationSpecialization('');
    setApplicationExperience('');
    setApplicationCV(null);
    setShowApplicationModal(false);
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setApplicationCV({
          name: file.name,
          uri: file.uri,
          size: file.size || 0,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  // Score badge component
  const ScoreBadge = ({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) => {
    const bgColor = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-blue-500' : score >= 40 ? 'bg-amber-500' : 'bg-gray-500';
    const sizeClass = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-14 h-14' : 'w-10 h-10';
    const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-xl' : 'text-sm';

    return (
      <View className={`${sizeClass} ${bgColor} rounded-full items-center justify-center`}>
        <Text className={`text-white font-bold ${textSize}`}>{score}</Text>
      </View>
    );
  };

  // Talent card component - optimized for quick scanning
  const TalentCard = ({
    candidate,
    type,
    index,
    showScore = true,
    compact = false,
  }: {
    candidate: typeof scoredExecutives[0];
    type: 'executive' | 'apprentice';
    index: number;
    showScore?: boolean;
    compact?: boolean;
  }) => {
    const isShortlisted = shortlistedIds.has(candidate.id);
    const isComparing = compareIds.includes(candidate.id);
    const accentColor = type === 'executive' ? 'emerald' : 'purple';

    return (
      <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
        <Pressable
          onPress={() => {
            setSelectedCandidate(candidate);
            setShowProfileModal(true);
          }}
          className={`bg-white dark:bg-slate-900 rounded-2xl mb-3 border ${
            isComparing ? 'border-blue-500 border-2' : 'border-gray-200 dark:border-slate-800'
          } overflow-hidden active:opacity-90`}
        >
          {/* Top Row - Name, Score, Actions */}
          <View className="p-4">
            <View className="flex-row items-start justify-between mb-2">
              <View className="flex-row items-center flex-1">
                {/* Avatar with initials */}
                <View className={`w-12 h-12 rounded-full bg-${accentColor}-500 items-center justify-center mr-3`}>
                  <Text className="text-white text-lg font-bold">
                    {candidate.name.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <Text className="text-gray-900 dark:text-white font-bold text-base" numberOfLines={1}>
                      {candidate.name}
                    </Text>
                    {candidate.rating >= 4.8 && (
                      <View className="ml-2 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                        <Text className="text-amber-700 dark:text-amber-300 text-[10px] font-bold">TOP RATED</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-gray-500 dark:text-slate-400 text-sm">
                    {candidate.specialization.join(' • ')}
                  </Text>
                </View>
              </View>

              {/* Score badge */}
              {showScore && <ScoreBadge score={candidate.score.overall} />}
            </View>

            {/* Quick Stats Row */}
            <View className="flex-row items-center gap-4 mb-3">
              <View className="flex-row items-center">
                <Clock size={14} color="#64748b" />
                <Text className="text-gray-600 dark:text-slate-400 text-xs ml-1">{candidate.experience}y exp</Text>
              </View>
              <View className="flex-row items-center bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-lg">
                <Text className="text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                  £{Math.round(candidate.costPerDay / 2)}/□
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-gray-500 dark:text-slate-500 text-xs">£{candidate.costPerDay}/day</Text>
              </View>
              <View className={`flex-row items-center px-2 py-0.5 rounded-full ${
                candidate.availability.toLowerCase().includes('now')
                  ? 'bg-emerald-100 dark:bg-emerald-900/30'
                  : 'bg-amber-100 dark:bg-amber-900/30'
              }`}>
                <View className={`w-1.5 h-1.5 rounded-full mr-1 ${
                  candidate.availability.toLowerCase().includes('now') ? 'bg-emerald-500' : 'bg-amber-500'
                }`} />
                <Text className={`text-xs font-medium ${
                  candidate.availability.toLowerCase().includes('now')
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-amber-700 dark:text-amber-300'
                }`}>
                  {candidate.availability.toLowerCase().includes('now') ? 'Available' : 'Soon'}
                </Text>
              </View>
            </View>

            {/* Top Skills */}
            {!compact && (
              <View className="flex-row flex-wrap gap-1 mb-3">
                {candidate.skills.slice(0, 4).map((skill, idx) => (
                  <View key={idx} className="bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded">
                    <Text className="text-gray-700 dark:text-slate-300 text-xs">{skill}</Text>
                  </View>
                ))}
                {candidate.skills.length > 4 && (
                  <View className="bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded">
                    <Text className="text-gray-500 dark:text-slate-500 text-xs">+{candidate.skills.length - 4}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Action Buttons */}
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={() => handleQuickOnboard(type, candidate)}
                className={`flex-1 bg-${accentColor}-500 rounded-xl py-2.5 items-center active:opacity-80`}
              >
                <View className="flex-row items-center">
                  <Zap size={16} color="#fff" />
                  <Text className="text-white font-semibold text-sm ml-1.5">Quick Onboard</Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => toggleShortlist(candidate.id)}
                className={`w-10 h-10 rounded-xl items-center justify-center ${
                  isShortlisted
                    ? 'bg-red-100 dark:bg-red-900/30'
                    : 'bg-gray-100 dark:bg-slate-800'
                } active:opacity-70`}
              >
                <Heart
                  size={20}
                  color={isShortlisted ? '#ef4444' : '#64748b'}
                  fill={isShortlisted ? '#ef4444' : 'none'}
                />
              </Pressable>

              {compareMode && (
                <Pressable
                  onPress={() => toggleCompare(candidate.id)}
                  className={`w-10 h-10 rounded-xl items-center justify-center ${
                    isComparing
                      ? 'bg-blue-100 dark:bg-blue-900/30'
                      : 'bg-gray-100 dark:bg-slate-800'
                  } active:opacity-70`}
                >
                  <Scale size={20} color={isComparing ? '#3b82f6' : '#64748b'} />
                </Pressable>
              )}
            </View>
          </View>

          {/* Score Breakdown (expandable) */}
          {showScore && candidate.score.overall >= 70 && (
            <View className={`px-4 py-2 bg-${accentColor}-50 dark:bg-${accentColor}-900/20 border-t border-gray-100 dark:border-slate-800`}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Target size={14} color="#10b981" />
                  <Text className="text-emerald-700 dark:text-emerald-300 text-xs font-medium ml-1">
                    High Match Score
                  </Text>
                </View>
                <View className="flex-row gap-3">
                  <Text className="text-gray-500 dark:text-slate-500 text-[10px]">
                    Exp: {candidate.score.experienceScore}
                  </Text>
                  <Text className="text-gray-500 dark:text-slate-500 text-[10px]">
                    Value: {candidate.score.valueScore}
                  </Text>
                  <Text className="text-gray-500 dark:text-slate-500 text-[10px]">
                    Avail: {candidate.score.availabilityScore}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-950">
      {/* Help Modal */}
      <HelpModal
        visible={showHelp}
        onClose={() => setShowHelp(false)}
        content={HUB_HELP}
        gradientColors={['#f59e0b', '#d97706']}
      />

      {/* Header - Matching Home Tab Style */}
      <LinearGradient
        colors={['#f59e0b', '#d97706']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ paddingHorizontal: 24, paddingTop: insets.top + 16, paddingBottom: 16 }}
      >
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1">
            <Text className="text-white/70 text-xs font-medium">TALENT MARKETPLACE</Text>
            <Text className="text-white text-xl font-bold">Hub</Text>
          </View>
          <View className="flex-row gap-2">
            <HelpButton onPress={() => setShowHelp(true)} />
            {shortlistedIds.size > 0 && (
              <Pressable
                onPress={() => setActiveTab('shortlist')}
                className="bg-white/20 px-3 py-2 rounded-xl flex-row items-center active:opacity-70"
              >
                <Heart size={16} color="#fff" fill="#fff" />
                <Text className="text-white font-bold ml-1">{shortlistedIds.size}</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => setCompareMode(!compareMode)}
              className={`px-3 py-2 rounded-xl active:opacity-70 ${
                compareMode ? 'bg-white/40' : 'bg-white/20'
              }`}
            >
              <Scale size={16} color="#fff" />
            </Pressable>
          </View>
        </View>
        {/* Quick Health Indicators */}
        <View className="flex-row gap-4">
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full mr-1.5 bg-amber-200" />
            <Text className="text-white/90 text-xs">{scoredExecutives.length} executives</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full mr-1.5 bg-white" />
            <Text className="text-white/90 text-xs">{scoredApprentices.length} apprentices</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full mr-1.5 bg-emerald-300" />
            <Text className="text-white/90 text-xs">{getTotalAIToolsCount()} AI tools</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Quick Nav Pills - Below Header */}
      <View className="px-5 py-3 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: 16 }}
        >
          {[
            { value: 'discover', label: 'Discover', icon: Sparkles },
            { value: 'executives', label: 'Executives', icon: Crown, count: scoredExecutives.length },
            { value: 'apprentices', label: 'Apprentices', icon: GraduationCap, count: scoredApprentices.length },
            { value: 'suppliers', label: 'Suppliers', icon: Factory, count: filteredSuppliers.length },
            { value: 'ai-agents', label: 'AI Agents', icon: Bot, count: getTotalAIToolsCount() },
            { value: 'apply', label: 'Apply', icon: Upload },
          ].map((tab) => (
            <Pressable
              key={tab.value}
              onPress={() => setActiveTab(tab.value as HubTab)}
              className={`flex-row items-center px-4 py-2 rounded-full ${
                activeTab === tab.value
                  ? 'bg-amber-500'
                  : 'bg-gray-100 dark:bg-slate-800'
              } active:opacity-70`}
            >
              <tab.icon size={16} color={activeTab === tab.value ? '#fff' : '#64748b'} />
              <Text className={`ml-2 font-semibold text-sm ${
                activeTab === tab.value ? 'text-white' : 'text-gray-700 dark:text-slate-300'
              }`}>
                {tab.label}
              </Text>
              {tab.count !== undefined && (
                <View className={`ml-1.5 px-1.5 py-0.5 rounded ${
                  activeTab === tab.value ? 'bg-white/20' : 'bg-gray-200 dark:bg-slate-700'
                }`}>
                  <Text className={`text-xs font-bold ${
                    activeTab === tab.value ? 'text-white' : 'text-gray-600 dark:text-slate-400'
                  }`}>
                    {tab.count}
                  </Text>
                </View>
              )}
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Search Bar - Contextual */}
      {(activeTab === 'executives' || activeTab === 'apprentices' || activeTab === 'suppliers' || activeTab === 'ai-agents') && (
        <View className="px-5 py-3 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
          <View className="flex-row items-center gap-2">
            <View className="flex-1 flex-row items-center bg-gray-100 dark:bg-slate-800 rounded-xl px-4 py-2.5">
              <Search size={18} color="#64748b" />
              <TextInput
                className="flex-1 ml-2 text-gray-900 dark:text-white text-base"
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={`Search by name, skills, or expertise...`}
                placeholderTextColor="#64748b"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <X size={18} color="#64748b" />
                </Pressable>
              )}
            </View>
            <Pressable
              onPress={() => setShowFilters(!showFilters)}
              className={`w-11 h-11 rounded-xl items-center justify-center ${
                showFilters ? 'bg-blue-500' : 'bg-gray-100 dark:bg-slate-800'
              } active:opacity-70`}
            >
              <SlidersHorizontal size={20} color={showFilters ? '#fff' : '#64748b'} />
            </Pressable>
          </View>

          {/* Advanced Filters Panel */}
          {showFilters && (activeTab === 'executives' || activeTab === 'apprentices') && (
            <Animated.View
              entering={FadeInDown.duration(200)}
              className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700"
            >
              <View className="flex-row flex-wrap gap-2 mb-3">
                <Text className="text-gray-500 dark:text-slate-400 text-xs w-full mb-1">Function</Text>
                {['all', 'Sales', 'Marketing', 'Finance', 'Ops', 'Engineering'].map((func) => (
                  <Pressable
                    key={func}
                    onPress={() => setSelectedFunction(func)}
                    className={`px-3 py-1.5 rounded-full ${
                      selectedFunction === func
                        ? 'bg-blue-500'
                        : 'bg-gray-200 dark:bg-slate-700'
                    } active:opacity-70`}
                  >
                    <Text className={`text-xs font-semibold ${
                      selectedFunction === func ? 'text-white' : 'text-gray-700 dark:text-slate-300'
                    }`}>
                      {func === 'all' ? 'All' : func}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {activeTab === 'executives' && (
                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <Text className="text-gray-500 dark:text-slate-400 text-xs mb-1">Availability</Text>
                    <View className="flex-row gap-2">
                      {[
                        { value: 'all', label: 'Any' },
                        { value: 'now', label: 'Now' },
                        { value: 'soon', label: 'Soon' },
                      ].map((opt) => (
                        <Pressable
                          key={opt.value}
                          onPress={() => setAvailabilityFilter(opt.value as any)}
                          className={`flex-1 py-1.5 rounded-lg items-center ${
                            availabilityFilter === opt.value
                              ? 'bg-emerald-500'
                              : 'bg-gray-200 dark:bg-slate-700'
                          } active:opacity-70`}
                        >
                          <Text className={`text-xs font-semibold ${
                            availabilityFilter === opt.value ? 'text-white' : 'text-gray-700 dark:text-slate-300'
                          }`}>
                            {opt.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </View>
              )}
            </Animated.View>
          )}
        </View>
      )}

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* DISCOVER TAB - Smart recommendations */}
        {activeTab === 'discover' && (
          <View className="px-5 py-4">
            {/* Quick Stats - Row 1 */}
            <View className="flex-row gap-3 mb-3">
              <Pressable
                onPress={() => setActiveTab('executives')}
                className="flex-1 bg-emerald-500 rounded-2xl p-4 active:opacity-90"
              >
                <Crown size={24} color="#fff" />
                <Text className="text-white/80 text-xs mt-2">Executives</Text>
                <Text className="text-white text-2xl font-bold">{fractionalExecutives.length}</Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveTab('apprentices')}
                className="flex-1 bg-purple-500 rounded-2xl p-4 active:opacity-90"
              >
                <GraduationCap size={24} color="#fff" />
                <Text className="text-white/80 text-xs mt-2">Apprentices</Text>
                <Text className="text-white text-2xl font-bold">{apprentices.length}</Text>
              </Pressable>
            </View>
            {/* Quick Stats - Row 2 */}
            <View className="flex-row gap-3 mb-5">
              <Pressable
                onPress={() => setActiveTab('suppliers')}
                className="flex-1 bg-amber-500 rounded-2xl p-4 active:opacity-90"
              >
                <Factory size={24} color="#fff" />
                <Text className="text-white/80 text-xs mt-2">Suppliers</Text>
                <Text className="text-white text-2xl font-bold">{suppliers.length}</Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveTab('ai-agents')}
                className="flex-1 bg-cyan-500 rounded-2xl p-4 active:opacity-90"
              >
                <Bot size={24} color="#fff" />
                <Text className="text-white/80 text-xs mt-2">AI Agents</Text>
                <Text className="text-white text-2xl font-bold">{getTotalAIToolsCount()}</Text>
              </Pressable>
            </View>

            {/* Resources Card - Full Width */}
            <Pressable
              onPress={() => router.push('/advisors')}
              className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5 mb-5 active:opacity-90"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <View className="flex-row items-center mb-2">
                    <Scale size={24} color="#fff" />
                    <Text className="text-white font-bold text-lg ml-2">Hard Tech Advisors</Text>
                  </View>
                  <Text className="text-white/80 text-sm mb-1">
                    VCs, lawyers, accountants & strategic advisors
                  </Text>
                  <Text className="text-white/60 text-xs">
                    50+ deep tech, climate, biotech, space, robotics specialists
                  </Text>
                </View>
                <ArrowUpRight size={24} color="#fff" />
              </View>
            </Pressable>

            {/* Top Executives Picks */}
            <View className="mb-5">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <Crown size={20} color="#10b981" />
                  <Text className="text-gray-900 dark:text-white font-bold text-lg ml-2">Top Executives</Text>
                </View>
                <Pressable
                  onPress={() => setActiveTab('executives')}
                  className="flex-row items-center active:opacity-70"
                >
                  <Text className="text-blue-500 font-semibold text-sm mr-1">See All</Text>
                  <ChevronRight size={16} color="#3b82f6" />
                </Pressable>
              </View>
              {topPicks.topExecs.map((exec, idx) => (
                <TalentCard key={exec.id} candidate={exec} type="executive" index={idx} />
              ))}
            </View>

            {/* Top Apprentices */}
            <View className="mb-5">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <GraduationCap size={20} color="#a855f7" />
                  <Text className="text-gray-900 dark:text-white font-bold text-lg ml-2">Rising Apprentices</Text>
                </View>
                <Pressable
                  onPress={() => setActiveTab('apprentices')}
                  className="flex-row items-center active:opacity-70"
                >
                  <Text className="text-blue-500 font-semibold text-sm mr-1">See All</Text>
                  <ChevronRight size={16} color="#3b82f6" />
                </Pressable>
              </View>
              {topPicks.topApprentices.map((app, idx) => (
                <TalentCard key={app.id} candidate={app} type="apprentice" index={idx} />
              ))}
            </View>

            {/* AI Agent Recommendations */}
            <View className="mb-5">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <Bot size={20} color="#06b6d4" />
                  <Text className="text-gray-900 dark:text-white font-bold text-lg ml-2">AI Productivity Boosters</Text>
                </View>
                <Pressable
                  onPress={() => setActiveTab('ai-agents')}
                  className="flex-row items-center active:opacity-70"
                >
                  <Text className="text-blue-500 font-semibold text-sm mr-1">See All</Text>
                  <ChevronRight size={16} color="#3b82f6" />
                </Pressable>
              </View>
              {topPicks.topAI.map((tool, idx) => (
                <Animated.View key={tool.id} entering={FadeInDown.delay(idx * 50).duration(300)}>
                  <Pressable
                    onPress={() => {
                      console.log('[Community] AI Tool clicked:', tool.name, tool);
                      setSelectedAIAgent(tool);
                    }}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-4 mb-3 border border-gray-200 dark:border-slate-800 active:opacity-90"
                  >
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1">
                        <Text className="text-gray-900 dark:text-white font-bold text-base">{tool.name}</Text>
                        <Text className="text-gray-500 dark:text-slate-400 text-sm">{tool.purpose}</Text>
                      </View>
                      <View className="bg-cyan-100 dark:bg-cyan-900/30 px-2 py-1 rounded">
                        <Text className="text-cyan-700 dark:text-cyan-300 text-xs font-bold">£{tool.costPerMonth}/mo</Text>
                      </View>
                    </View>
                    <View className="flex-row flex-wrap gap-1">
                      {tool.functions.map((func, i) => (
                        <View key={i} className="bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded">
                          <Text className="text-gray-600 dark:text-slate-400 text-xs">{func}</Text>
                        </View>
                      ))}
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>

            {/* Top Suppliers */}
            <View className="mb-5">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <Factory size={20} color="#f59e0b" />
                  <Text className="text-gray-900 dark:text-white font-bold text-lg ml-2">Supply Chain Partners</Text>
                </View>
                <Pressable
                  onPress={() => setActiveTab('suppliers')}
                  className="flex-row items-center active:opacity-70"
                >
                  <Text className="text-blue-500 font-semibold text-sm mr-1">See All</Text>
                  <ChevronRight size={16} color="#3b82f6" />
                </Pressable>
              </View>
              {topPicks.topSuppliers.map((supplier, idx) => (
                <Animated.View key={supplier.id} entering={FadeInDown.delay(idx * 50).duration(300)}>
                  <Pressable
                    onPress={() => {
                      selectSupplier(supplier);
                      setActiveTab('suppliers');
                    }}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-4 mb-3 border border-gray-200 dark:border-slate-800 active:opacity-90"
                  >
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1">
                        <View className="flex-row items-center">
                          <Text className="text-gray-900 dark:text-white font-bold text-base">{supplier.name}</Text>
                          {(supplier.rating ?? 0) >= 4.5 && (
                            <View className="ml-2 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                              <Text className="text-amber-700 dark:text-amber-300 text-[10px] font-bold">TOP RATED</Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-gray-500 dark:text-slate-400 text-sm">{supplier.location.city}, {supplier.location.country}</Text>
                      </View>
                      {supplier.rating && (
                        <View className="bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded">
                          <Text className="text-amber-700 dark:text-amber-300 text-xs font-bold">{supplier.rating.toFixed(1)} ★</Text>
                        </View>
                      )}
                    </View>
                    <View className="flex-row flex-wrap gap-1 mb-2">
                      {supplier.capabilities.slice(0, 3).map((cap, i) => (
                        <View key={i} className="bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded">
                          <Text className="text-gray-600 dark:text-slate-400 text-xs">{cap}</Text>
                        </View>
                      ))}
                      {supplier.capabilities.length > 3 && (
                        <View className="bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded">
                          <Text className="text-gray-500 dark:text-slate-500 text-xs">+{supplier.capabilities.length - 3}</Text>
                        </View>
                      )}
                    </View>
                    <View className="flex-row items-center gap-3">
                      {supplier.leadTimeWeeks && (
                        <View className="flex-row items-center">
                          <Clock size={12} color="#64748b" />
                          <Text className="text-gray-500 dark:text-slate-400 text-xs ml-1">{supplier.leadTimeWeeks} weeks</Text>
                        </View>
                      )}
                      {supplier.minimumOrderQuantity && (
                        <View className="flex-row items-center">
                          <DollarSign size={12} color="#64748b" />
                          <Text className="text-gray-500 dark:text-slate-400 text-xs ml-1">MOQ: {supplier.minimumOrderQuantity}</Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>

            {/* Quick Actions */}
            <View className="flex-row gap-3 mb-4">
              <Pressable
                onPress={() => router.push('/guilds')}
                className="flex-1 bg-purple-500 rounded-xl py-4 items-center active:opacity-80"
              >
                <BookOpen size={20} color="#fff" />
                <Text className="text-white font-bold mt-1">Guilds</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/events')}
                className="flex-1 bg-emerald-500 rounded-xl py-4 items-center active:opacity-80"
              >
                <Calendar size={20} color="#fff" />
                <Text className="text-white font-bold mt-1">Events</Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveTab('apply')}
                className="flex-1 bg-blue-500 rounded-xl py-4 items-center active:opacity-80"
              >
                <Upload size={20} color="#fff" />
                <Text className="text-white font-bold mt-1">Join Us</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* EXECUTIVES TAB */}
        {activeTab === 'executives' && (
          <View className="px-5 py-4 flex-1">
            {/* Results Header */}
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-gray-600 dark:text-slate-400 text-sm">
                {scoredExecutives.length} executives • Sorted by match score
              </Text>
            </View>

            {scoredExecutives.length === 0 ? (
              <View className="items-center py-12">
                <Users size={48} color="#64748b" />
                <Text className="text-gray-500 dark:text-slate-400 text-base mt-4">No executives match your criteria</Text>
                <Pressable
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedFunction('all');
                    setAvailabilityFilter('all');
                  }}
                  className="mt-4 bg-blue-500 px-6 py-2 rounded-xl active:opacity-80"
                >
                  <Text className="text-white font-semibold">Clear Filters</Text>
                </Pressable>
              </View>
            ) : (
              <FlashList
                data={scoredExecutives}
                renderItem={({ item, index }) => (
                  <TalentCard candidate={item} type="executive" index={index} />
                )}
                estimatedItemSize={280}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
              />
            )}
          </View>
        )}

        {/* APPRENTICES TAB */}
        {activeTab === 'apprentices' && (
          <View className="px-5 py-4 flex-1">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-gray-600 dark:text-slate-400 text-sm">
                {scoredApprentices.length} apprentices • Sorted by match score
              </Text>
            </View>

            {scoredApprentices.length === 0 ? (
              <View className="items-center py-12">
                <GraduationCap size={48} color="#64748b" />
                <Text className="text-gray-500 dark:text-slate-400 text-base mt-4">No apprentices match your criteria</Text>
                <Pressable
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedFunction('all');
                  }}
                  className="mt-4 bg-purple-500 px-6 py-2 rounded-xl active:opacity-80"
                >
                  <Text className="text-white font-semibold">Clear Filters</Text>
                </Pressable>
              </View>
            ) : (
              <FlashList
                data={scoredApprentices}
                renderItem={({ item, index }) => (
                  <TalentCard candidate={item} type="apprentice" index={index} />
                )}
                estimatedItemSize={280}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
              />
            )}
          </View>
        )}

        {/* SUPPLIERS TAB */}
        {activeTab === 'suppliers' && (
          <View className="px-5 py-4">
            {/* Service Type Filter */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
              contentContainerStyle={{ gap: 8 }}
            >
              {[
                { value: 'all', label: 'All' },
                { value: 'manufacturing', label: 'Manufacturing' },
                { value: 'professional-services', label: 'Professional' },
                { value: 'bank', label: 'Banks' },
                { value: 'lawyer', label: 'Lawyers' },
                { value: 'accountant', label: 'Accountants' },
              ].map((type) => (
                <Pressable
                  key={type.value}
                  onPress={() => setSelectedSupplierType(type.value)}
                  className={`px-4 py-2 rounded-full ${
                    selectedSupplierType === type.value
                      ? type.value === 'bank' ? 'bg-blue-500' :
                        type.value === 'lawyer' ? 'bg-purple-500' :
                        type.value === 'accountant' ? 'bg-green-500' :
                        type.value === 'professional-services' ? 'bg-indigo-500' :
                        'bg-amber-500'
                      : 'bg-gray-200 dark:bg-slate-800'
                  } active:opacity-70`}
                >
                  <Text className={`text-sm font-semibold ${
                    selectedSupplierType === type.value
                      ? 'text-white'
                      : 'text-gray-700 dark:text-slate-300'
                  }`}>
                    {type.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {filteredSuppliers.map((supplier, idx) => (
              <Animated.View key={supplier.id} entering={FadeInDown.delay(idx * 50).duration(300)}>
                <Pressable
                  onPress={() => {
                    selectSupplier(supplier);
                    setShowProfileModal(true);
                  }}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-4 mb-3 border border-gray-200 dark:border-slate-800 active:opacity-90"
                >
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 flex-wrap">
                        <Text className="text-gray-900 dark:text-white font-bold text-base">{supplier.name}</Text>
                        {/* Service Type Badge */}
                        {supplier.serviceType === 'bank' && (
                          <View className="bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                            <Text className="text-blue-700 dark:text-blue-300 text-xs font-semibold">Bank</Text>
                          </View>
                        )}
                        {supplier.serviceType === 'lawyer' && (
                          <View className="bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">
                            <Text className="text-purple-700 dark:text-purple-300 text-xs font-semibold">Lawyer</Text>
                          </View>
                        )}
                        {supplier.serviceType === 'accountant' && (
                          <View className="bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                            <Text className="text-green-700 dark:text-green-300 text-xs font-semibold">Accountant</Text>
                          </View>
                        )}
                      </View>
                      <View className="flex-row items-center mt-1">
                        <MapPin size={12} color="#64748b" />
                        <Text className="text-gray-500 dark:text-slate-400 text-sm ml-1">
                          {supplier.location.city}, {supplier.location.country}
                        </Text>
                      </View>
                    </View>
                    {supplier.customerReviews && (
                      <View className="flex-row items-center bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded">
                        <Star size={12} color="#f59e0b" fill="#f59e0b" />
                        <Text className="text-amber-700 dark:text-amber-300 text-xs font-bold ml-1">
                          {supplier.customerReviews.rating}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text className="text-gray-600 dark:text-slate-400 text-sm mb-3" numberOfLines={2}>
                    {supplier.description}
                  </Text>

                  {/* Show specialties for professional services, capabilities for manufacturing */}
                  <View className="flex-row flex-wrap gap-1 mb-3">
                    {supplier.serviceType && ['bank', 'lawyer', 'accountant'].includes(supplier.serviceType) ? (
                      // Professional services - show specialties
                      <>
                        {(supplier.specialties || []).slice(0, 3).map((spec, i) => (
                          <View key={i} className={`px-2 py-1 rounded ${
                            supplier.serviceType === 'bank' ? 'bg-blue-100 dark:bg-blue-900/30' :
                            supplier.serviceType === 'lawyer' ? 'bg-purple-100 dark:bg-purple-900/30' :
                            'bg-green-100 dark:bg-green-900/30'
                          }`}>
                            <Text className={`text-xs ${
                              supplier.serviceType === 'bank' ? 'text-blue-700 dark:text-blue-300' :
                              supplier.serviceType === 'lawyer' ? 'text-purple-700 dark:text-purple-300' :
                              'text-green-700 dark:text-green-300'
                            }`}>{spec}</Text>
                          </View>
                        ))}
                        {(supplier.specialties || []).length > 3 && (
                          <View className="bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded">
                            <Text className="text-gray-500 dark:text-slate-500 text-xs">+{(supplier.specialties || []).length - 3}</Text>
                          </View>
                        )}
                      </>
                    ) : (
                      // Manufacturing - show capabilities
                      <>
                        {supplier.capabilities.slice(0, 3).map((cap, i) => (
                          <View key={i} className="bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded">
                            <Text className="text-amber-700 dark:text-amber-300 text-xs">{cap}</Text>
                          </View>
                        ))}
                        {supplier.capabilities.length > 3 && (
                          <View className="bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded">
                            <Text className="text-gray-500 dark:text-slate-500 text-xs">+{supplier.capabilities.length - 3}</Text>
                          </View>
                        )}
                      </>
                    )}
                  </View>

                  <View className="flex-row items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-800">
                    {/* Show relevant info based on service type */}
                    {supplier.serviceType && ['bank', 'lawyer', 'accountant'].includes(supplier.serviceType) ? (
                      <View className="flex-row gap-4">
                        {supplier.pricing?.perUnit && (
                          <Text className="text-gray-500 dark:text-slate-500 text-xs" numberOfLines={1}>
                            {supplier.pricing.perUnit.slice(0, 30)}{supplier.pricing.perUnit.length > 30 ? '...' : ''}
                          </Text>
                        )}
                      </View>
                    ) : (
                      <View className="flex-row gap-4">
                        <Text className="text-gray-500 dark:text-slate-500 text-xs">
                          MOQ: {supplier.minimumOrderQuantity}
                        </Text>
                        <Text className="text-gray-500 dark:text-slate-500 text-xs">
                          Lead: {supplier.leadTimeWeeks}w
                        </Text>
                      </View>
                    )}
                    <Pressable
                      onPress={() => handleQuickOnboard('supplier', supplier)}
                      className={`px-4 py-2 rounded-lg active:opacity-80 ${
                        supplier.serviceType === 'bank' ? 'bg-blue-500' :
                        supplier.serviceType === 'lawyer' ? 'bg-purple-500' :
                        supplier.serviceType === 'accountant' ? 'bg-green-500' :
                        'bg-amber-500'
                      }`}
                    >
                      <Text className="text-white text-xs font-bold">
                        {supplier.serviceType && ['bank', 'lawyer', 'accountant'].includes(supplier.serviceType) ? 'Contact' : 'Request'}
                      </Text>
                    </Pressable>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        )}

        {/* AI AGENTS TAB */}
        {activeTab === 'ai-agents' && (
          <View className="px-5 py-4">
            {/* Function Filter */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
              contentContainerStyle={{ gap: 8 }}
            >
              <Pressable
                onPress={() => setSelectedAIFunction('all')}
                className={`px-4 py-2 rounded-full ${
                  selectedAIFunction === 'all'
                    ? 'bg-cyan-500'
                    : 'bg-gray-200 dark:bg-slate-800'
                } active:opacity-70`}
              >
                <Text className={`text-sm font-semibold ${
                  selectedAIFunction === 'all'
                    ? 'text-white'
                    : 'text-gray-700 dark:text-slate-300'
                }`}>
                  All
                </Text>
              </Pressable>
              {(['Sales', 'Marketing', 'Finance', 'Ops', 'Engineering', 'Admin'] as BusinessFunction[]).map((func) => (
                <Pressable
                  key={func}
                  onPress={() => setSelectedAIFunction(func)}
                  className={`px-4 py-2 rounded-full ${
                    selectedAIFunction === func
                      ? 'bg-cyan-500'
                      : 'bg-gray-200 dark:bg-slate-800'
                  } active:opacity-70`}
                >
                  <Text className={`text-sm font-semibold ${
                    selectedAIFunction === func
                      ? 'text-white'
                      : 'text-gray-700 dark:text-slate-300'
                  }`}>
                    {func}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {getAIToolsByFunction(selectedAIFunction).map((tool, idx) => {
              const colorScheme = getCategoryColor(tool.category);
              return (
                <Animated.View key={tool.id} entering={FadeInDown.delay(idx * 50).duration(300)}>
                  <Pressable
                    onPress={() => setSelectedAIAgent(tool)}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-4 mb-3 border border-gray-200 dark:border-slate-800 active:opacity-90"
                  >
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-row items-center flex-1">
                        <View className="w-10 h-10 bg-cyan-500 rounded-xl items-center justify-center mr-3">
                          <Bot size={20} color="#fff" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-gray-900 dark:text-white font-bold text-base">{tool.name}</Text>
                          <Text className="text-gray-500 dark:text-slate-400 text-xs">{tool.provider}</Text>
                        </View>
                      </View>
                      {tool.reviews && (
                        <View className="flex-row items-center bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded">
                          <Star size={12} color="#f59e0b" fill="#f59e0b" />
                          <Text className="text-amber-700 dark:text-amber-300 text-xs font-bold ml-1">
                            {tool.reviews.rating}
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text className="text-gray-600 dark:text-slate-400 text-sm mb-3" numberOfLines={2}>
                      {tool.purpose}
                    </Text>

                    <View className="flex-row flex-wrap gap-1 mb-3">
                      {tool.capabilities.slice(0, 3).map((cap, i) => (
                        <View key={i} className="bg-cyan-50 dark:bg-cyan-900/30 px-2 py-1 rounded">
                          <Text className="text-cyan-700 dark:text-cyan-300 text-xs">{cap}</Text>
                        </View>
                      ))}
                    </View>

                    <View className="flex-row items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-800">
                      <View className="flex-row items-center">
                        <Text className="text-emerald-600 dark:text-emerald-400 font-bold">£{tool.costPerMonth}</Text>
                        <Text className="text-gray-500 dark:text-slate-500 text-xs ml-1">/month</Text>
                      </View>
                      <View className="flex-row items-center">
                        <Text className="text-gray-500 dark:text-slate-500 text-xs mr-2">
                          {tool.setup?.timeToValue || 'Quick setup'}
                        </Text>
                        <ChevronRight size={16} color="#64748b" />
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        )}

        {/* SHORTLIST TAB */}
        {activeTab === 'shortlist' && (
          <View className="px-5 py-4">
            {shortlistedIds.size === 0 ? (
              <View className="items-center py-16">
                <Heart size={64} color="#ef4444" />
                <Text className="text-gray-900 dark:text-white text-xl font-bold mt-4">Your Shortlist is Empty</Text>
                <Text className="text-gray-500 dark:text-slate-400 text-center mt-2 px-8">
                  Tap the heart icon on any candidate to add them to your shortlist for quick comparison
                </Text>
                <Pressable
                  onPress={() => setActiveTab('discover')}
                  className="mt-6 bg-blue-500 px-8 py-3 rounded-xl active:opacity-80"
                >
                  <Text className="text-white font-bold">Browse Talent</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Text className="text-gray-900 dark:text-white font-bold text-lg mb-3">
                  {shortlistedIds.size} Saved Candidates
                </Text>

                {shortlistedExecutives.length > 0 && (
                  <View className="mb-4">
                    <Text className="text-gray-500 dark:text-slate-400 text-sm mb-2">Executives</Text>
                    {shortlistedExecutives.map((exec, idx) => (
                      <TalentCard key={exec.id} candidate={exec} type="executive" index={idx} />
                    ))}
                  </View>
                )}

                {shortlistedApprentices.length > 0 && (
                  <View className="mb-4">
                    <Text className="text-gray-500 dark:text-slate-400 text-sm mb-2">Apprentices</Text>
                    {shortlistedApprentices.map((app, idx) => (
                      <TalentCard key={app.id} candidate={app} type="apprentice" index={idx} />
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* APPLY TAB */}
        {activeTab === 'apply' && (
          <View className="px-5 py-4">
            <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
              <Text className="text-blue-900 dark:text-blue-100 font-bold text-lg mb-2">
                Join the Talent Network
              </Text>
              <Text className="text-blue-800 dark:text-blue-200 text-sm">
                Connect with hardware startups looking for fractional talent, eager apprentices, and reliable suppliers.
              </Text>
            </View>

            <Pressable
              onPress={() => {
                setApplicationType('executive');
                setShowApplicationModal(true);
              }}
              className="bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-5 mb-3 active:opacity-80"
            >
              <View className="flex-row items-center mb-2">
                <View className="w-12 h-12 bg-emerald-500 rounded-xl items-center justify-center">
                  <Crown size={24} color="#fff" />
                </View>
                <View className="ml-4 flex-1">
                  <Text className="text-emerald-900 dark:text-emerald-100 font-bold text-base">
                    Fractional Executive
                  </Text>
                  <Text className="text-emerald-700 dark:text-emerald-300 text-sm">
                    1-3 days/week engagements
                  </Text>
                </View>
                <ChevronRight size={20} color="#10b981" />
              </View>
            </Pressable>

            <Pressable
              onPress={() => {
                setApplicationType('apprentice');
                setShowApplicationModal(true);
              }}
              className="bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-xl p-5 mb-3 active:opacity-80"
            >
              <View className="flex-row items-center mb-2">
                <View className="w-12 h-12 bg-purple-500 rounded-xl items-center justify-center">
                  <GraduationCap size={24} color="#fff" />
                </View>
                <View className="ml-4 flex-1">
                  <Text className="text-purple-900 dark:text-purple-100 font-bold text-base">
                    Apprentice
                  </Text>
                  <Text className="text-purple-700 dark:text-purple-300 text-sm">
                    Learn from experienced executives
                  </Text>
                </View>
                <ChevronRight size={20} color="#a855f7" />
              </View>
            </Pressable>

            <Pressable
              onPress={() => {
                setApplicationType('supplier');
                setShowApplicationModal(true);
              }}
              className="bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl p-5 active:opacity-80"
            >
              <View className="flex-row items-center mb-2">
                <View className="w-12 h-12 bg-amber-500 rounded-xl items-center justify-center">
                  <Factory size={24} color="#fff" />
                </View>
                <View className="ml-4 flex-1">
                  <Text className="text-amber-900 dark:text-amber-100 font-bold text-base">
                    Supplier / Manufacturer
                  </Text>
                  <Text className="text-amber-700 dark:text-amber-300 text-sm">
                    Connect with hardware startups
                  </Text>
                </View>
                <ChevronRight size={20} color="#f59e0b" />
              </View>
            </Pressable>
          </View>
        )}

        {/* Bottom padding for tabs */}
        <View className="h-24" />
      </ScrollView>

      {/* Compare Mode Banner */}
      {compareMode && compareIds.length > 0 && (
        <Animated.View
          entering={FadeInDown.duration(200)}
          className="absolute bottom-24 left-5 right-5"
        >
          <View className="bg-blue-500 rounded-2xl p-4 flex-row items-center justify-between shadow-lg">
            <View>
              <Text className="text-white font-bold">{compareIds.length} selected for comparison</Text>
              <Text className="text-white/70 text-xs">Select up to 3 candidates</Text>
            </View>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setCompareIds([])}
                className="bg-white/20 px-4 py-2 rounded-lg active:opacity-70"
              >
                <Text className="text-white font-semibold">Clear</Text>
              </Pressable>
              {compareIds.length >= 2 && (
                <Pressable
                  onPress={() => setShowCompareModal(true)}
                  className="bg-white px-4 py-2 rounded-lg active:opacity-70"
                >
                  <Text className="text-blue-500 font-bold">Compare</Text>
                </Pressable>
              )}
            </View>
          </View>
        </Animated.View>
      )}

      {/* Profile Detail Modal */}
      <Modal
        visible={showProfileModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-white dark:bg-slate-950 rounded-t-3xl flex-1" style={{ maxHeight: '90%', marginTop: 'auto' }}>
            {/* Header */}
            <View className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-slate-800">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-900 dark:text-white text-2xl font-bold">
                  {selectedCandidate ? 'Profile Details' : 'Supplier Details'}
                </Text>
                <Pressable
                  onPress={() => {
                    setShowProfileModal(false);
                    setSelectedCandidate(null);
                    selectSupplier(null);
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-900 active:opacity-70"
                >
                  <X size={24} color="#64748b" />
                </Pressable>
              </View>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              {selectedCandidate && (
                <View className="px-6 py-6">
                  {/* Name and Role */}
                  <View className="mb-6">
                    <View className="flex-row items-center mb-3">
                      <View className={`w-16 h-16 rounded-full items-center justify-center ${
                        selectedCandidate.role === 'FractionalExec' ? 'bg-emerald-500' : 'bg-purple-500'
                      }`}>
                        <Text className="text-white text-xl font-bold">
                          {selectedCandidate.name.split(' ').map(n => n[0]).join('')}
                        </Text>
                      </View>
                      <View className="ml-4 flex-1">
                        <Text className="text-gray-900 dark:text-white text-2xl font-bold">
                          {selectedCandidate.name}
                        </Text>
                        <Text className="text-gray-600 dark:text-slate-400 text-base">
                          {selectedCandidate.role === 'FractionalExec' ? 'Fractional Executive' : 'Apprentice'}
                        </Text>
                      </View>
                    </View>
                    <View className={`self-start px-3 py-1.5 rounded-full ${
                      selectedCandidate.availability === 'Available now' || selectedCandidate.availability.toLowerCase().includes('now')
                        ? 'bg-emerald-100 dark:bg-emerald-900/30'
                        : 'bg-amber-100 dark:bg-amber-900/30'
                    }`}>
                      <Text className={`text-sm font-semibold ${
                        selectedCandidate.availability === 'Available now' || selectedCandidate.availability.toLowerCase().includes('now')
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-amber-700 dark:text-amber-300'
                      }`}>
                        {selectedCandidate.availability}
                      </Text>
                    </View>
                  </View>

                  {/* Match Score Card */}
                  {'score' in selectedCandidate && (
                    <View className="bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-900/20 dark:to-emerald-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
                      <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-row items-center">
                          <Target size={20} color="#3b82f6" />
                          <Text className="text-blue-700 dark:text-blue-300 font-bold text-lg ml-2">Match Score</Text>
                        </View>
                        <View className="w-14 h-14 bg-blue-500 rounded-full items-center justify-center">
                          <Text className="text-white text-xl font-bold">{(selectedCandidate as typeof scoredExecutives[0]).score.overall}</Text>
                        </View>
                      </View>
                      <View className="flex-row gap-2">
                        <View className="flex-1 bg-white/50 dark:bg-slate-800/50 rounded-lg p-2 items-center">
                          <Text className="text-gray-500 dark:text-slate-500 text-[10px]">Experience</Text>
                          <Text className="text-gray-900 dark:text-white font-bold">{(selectedCandidate as typeof scoredExecutives[0]).score.experienceScore}</Text>
                        </View>
                        <View className="flex-1 bg-white/50 dark:bg-slate-800/50 rounded-lg p-2 items-center">
                          <Text className="text-gray-500 dark:text-slate-500 text-[10px]">Availability</Text>
                          <Text className="text-gray-900 dark:text-white font-bold">{(selectedCandidate as typeof scoredExecutives[0]).score.availabilityScore}</Text>
                        </View>
                        <View className="flex-1 bg-white/50 dark:bg-slate-800/50 rounded-lg p-2 items-center">
                          <Text className="text-gray-500 dark:text-slate-500 text-[10px]">Value</Text>
                          <Text className="text-gray-900 dark:text-white font-bold">{(selectedCandidate as typeof scoredExecutives[0]).score.valueScore}</Text>
                        </View>
                        <View className="flex-1 bg-white/50 dark:bg-slate-800/50 rounded-lg p-2 items-center">
                          <Text className="text-gray-500 dark:text-slate-500 text-[10px]">Skill Match</Text>
                          <Text className="text-gray-900 dark:text-white font-bold">{(selectedCandidate as typeof scoredExecutives[0]).score.skillMatch}</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Specialization */}
                  <View className="mb-6">
                    <Text className="text-gray-900 dark:text-white font-bold text-lg mb-3">
                      Specialization
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {selectedCandidate.specialization.map((spec, idx) => (
                        <View key={idx} className="bg-blue-100 dark:bg-blue-900/30 px-3 py-2 rounded-lg">
                          <Text className="text-blue-700 dark:text-blue-300 font-semibold">{spec}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Experience */}
                  <View className="mb-6">
                    <Text className="text-gray-900 dark:text-white font-bold text-lg mb-2">
                      Experience
                    </Text>
                    <Text className="text-gray-700 dark:text-slate-300 text-base">
                      {selectedCandidate.experience} years of experience
                    </Text>
                  </View>

                  {/* Skills */}
                  <View className="mb-6">
                    <Text className="text-gray-900 dark:text-white font-bold text-lg mb-3">
                      Skills & Expertise
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {selectedCandidate.skills.map((skill, idx) => (
                        <View key={idx} className="bg-gray-200 dark:bg-slate-800 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700">
                          <Text className="text-gray-800 dark:text-slate-200 text-sm">{skill}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Previous Companies */}
                  {selectedCandidate.previousCompanies && selectedCandidate.previousCompanies.length > 0 && (
                    <View className="mb-6">
                      <Text className="text-gray-900 dark:text-white font-bold text-lg mb-3">
                        Previous Experience
                      </Text>
                      <View className="gap-3">
                        {selectedCandidate.previousCompanies.map((company, idx) => (
                          <View key={idx} className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 border border-gray-200 dark:border-slate-800">
                            <View className="flex-row items-center">
                              <Building2 size={18} color="#3b82f6" />
                              <Text className="text-gray-900 dark:text-white font-semibold ml-2">{company}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Hourly Rate */}
                  {selectedCandidate.costPerDay && (
                    <View className="mb-6">
                      <Text className="text-gray-900 dark:text-white font-bold text-lg mb-2">
                        Rate
                      </Text>
                      <View className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                        <View className="flex-row items-center justify-between mb-2">
                          <View>
                            <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-medium uppercase tracking-wide">Cost per Square</Text>
                            <Text className="text-emerald-700 dark:text-emerald-300 text-3xl font-bold">
                              £{Math.round(selectedCandidate.costPerDay / 2)}/□
                            </Text>
                          </View>
                          <View className="items-end">
                            <Text className="text-gray-500 dark:text-slate-400 text-xs">Per day (2□)</Text>
                            <Text className="text-gray-700 dark:text-slate-300 text-lg font-semibold">
                              £{selectedCandidate.costPerDay}
                            </Text>
                          </View>
                        </View>
                        <View className="border-t border-emerald-200 dark:border-emerald-800 pt-3 mt-2">
                          <View className="flex-row items-center justify-between">
                            <Text className="text-emerald-600 dark:text-emerald-400 text-sm">
                              {selectedCandidate.role === 'FractionalExec' ? 'Fractional engagement' : 'Apprentice rate'}
                            </Text>
                            <Text className="text-gray-500 dark:text-slate-400 text-xs">
                              1□ = 4 hours
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Bio */}
                  <View className="mb-6">
                    <Text className="text-gray-900 dark:text-white font-bold text-lg mb-2">
                      About
                    </Text>
                    <Text className="text-gray-700 dark:text-slate-300 text-base leading-6">
                      {selectedCandidate.bio || (selectedCandidate.role === 'FractionalExec'
                        ? `${selectedCandidate.name} is an experienced ${selectedCandidate.specialization.join(' and ')} professional with ${selectedCandidate.experience} years of experience. They bring deep expertise in ${selectedCandidate.skills.slice(0, 3).join(', ')}, and have worked with leading companies in the hardware and technology sectors.`
                        : `${selectedCandidate.name} is an apprentice specializing in ${selectedCandidate.specialization.join(' and ')}. With ${selectedCandidate.experience} years of experience, they are eager to learn and contribute to innovative hardware projects while developing their skills under experienced executives.`
                      )}
                    </Text>
                  </View>
                </View>
              )}

              {selectedSupplierFromStore && (
                <View className="px-6 py-6">
                  {/* Supplier Header */}
                  <View className="mb-6">
                    <View className="flex-row items-center mb-3">
                      <View className="w-16 h-16 bg-amber-500 rounded-full items-center justify-center">
                        <Factory size={32} color="#fff" />
                      </View>
                      <View className="ml-4 flex-1">
                        <Text className="text-gray-900 dark:text-white text-2xl font-bold">
                          {selectedSupplierFromStore.name}
                        </Text>
                        <View className="flex-row items-center mt-1">
                          <MapPin size={14} color="#64748b" />
                          <Text className="text-gray-600 dark:text-slate-400 text-sm ml-1">
                            {selectedSupplierFromStore.location.city}, {selectedSupplierFromStore.location.country}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Rating and Lead Time */}
                  {selectedSupplierFromStore.customerReviews && (
                    <View className="flex-row gap-3 mb-6">
                      <View className="flex-1 bg-gray-100 dark:bg-slate-800 rounded-xl p-4">
                        <Text className="text-gray-500 dark:text-slate-400 text-xs mb-1">Rating</Text>
                        <View className="flex-row items-center">
                          <Star size={16} color="#f59e0b" fill="#f59e0b" />
                          <Text className="text-amber-600 dark:text-amber-400 text-xl font-bold ml-1">
                            {selectedSupplierFromStore.customerReviews.rating}
                          </Text>
                        </View>
                        <Text className="text-gray-500 dark:text-slate-500 text-xs">
                          {selectedSupplierFromStore.customerReviews.totalReviews} reviews
                        </Text>
                      </View>
                      <View className="flex-1 bg-gray-100 dark:bg-slate-800 rounded-xl p-4">
                        <Text className="text-gray-500 dark:text-slate-400 text-xs mb-1">Lead Time</Text>
                        <Text className="text-emerald-600 dark:text-emerald-400 text-xl font-bold">
                          {selectedSupplierFromStore.leadTimeWeeks}
                        </Text>
                        <Text className="text-gray-500 dark:text-slate-500 text-xs">weeks</Text>
                      </View>
                      <View className="flex-1 bg-gray-100 dark:bg-slate-800 rounded-xl p-4">
                        <Text className="text-gray-500 dark:text-slate-400 text-xs mb-1">Min Order</Text>
                        <Text className="text-blue-600 dark:text-blue-400 text-xl font-bold">
                          {selectedSupplierFromStore.minimumOrderQuantity}
                        </Text>
                        <Text className="text-gray-500 dark:text-slate-500 text-xs">units</Text>
                      </View>
                    </View>
                  )}

                  {/* Description */}
                  <View className="mb-6">
                    <Text className="text-gray-900 dark:text-white font-bold text-lg mb-2">About</Text>
                    <Text className="text-gray-700 dark:text-slate-300 text-base leading-6">
                      {selectedSupplierFromStore.detailedDescription || selectedSupplierFromStore.description}
                    </Text>
                  </View>

                  {/* Capabilities */}
                  <View className="mb-6">
                    <Text className="text-gray-900 dark:text-white font-bold text-lg mb-3">Capabilities</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {selectedSupplierFromStore.capabilities.map((cap, idx) => (
                        <View key={idx} className="bg-amber-100 dark:bg-amber-900/30 px-3 py-2 rounded-lg">
                          <Text className="text-amber-700 dark:text-amber-300 font-semibold">{cap}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Certifications */}
                  <View className="mb-6">
                    <Text className="text-gray-900 dark:text-white font-bold text-lg mb-3">Certifications</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {selectedSupplierFromStore.certifications.map((cert, idx) => (
                        <View key={idx} className="bg-emerald-100 dark:bg-emerald-900/30 px-3 py-2 rounded-lg flex-row items-center">
                          <BadgeCheck size={14} color="#10b981" />
                          <Text className="text-emerald-700 dark:text-emerald-300 font-semibold ml-1">{cert}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Action Buttons */}
            <View className="px-6 py-4 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950">
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => {
                    setShowProfileModal(false);
                    setTimeout(() => {
                      if (selectedSupplierFromStore) {
                        handleQuickOnboard('supplier', selectedSupplierFromStore);
                      } else if (selectedCandidate) {
                        handleQuickOnboard(
                          selectedCandidate.role === 'FractionalExec' ? 'executive' : 'apprentice',
                          selectedCandidate
                        );
                      }
                    }, 300);
                  }}
                  className="flex-1 bg-blue-500 rounded-xl py-4 items-center active:opacity-70"
                >
                  <View className="flex-row items-center">
                    <Zap size={20} color="#fff" />
                    <Text className="text-white font-bold text-base ml-2">Quick Onboard</Text>
                  </View>
                </Pressable>
                {selectedCandidate && (
                  <Pressable
                    onPress={() => toggleShortlist(selectedCandidate.id)}
                    className={`w-14 h-14 rounded-xl items-center justify-center ${
                      shortlistedIds.has(selectedCandidate.id)
                        ? 'bg-red-100 dark:bg-red-900/30'
                        : 'bg-gray-100 dark:bg-slate-800'
                    } active:opacity-70`}
                  >
                    <Heart
                      size={24}
                      color={shortlistedIds.has(selectedCandidate.id) ? '#ef4444' : '#64748b'}
                      fill={shortlistedIds.has(selectedCandidate.id) ? '#ef4444' : 'none'}
                    />
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Request Modal */}
      <Modal
        visible={showRequestModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRequestModal(false)}
      >
        <View className="flex-1 bg-black/70 justify-end">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end">
            <View className="bg-white dark:bg-slate-900 rounded-t-3xl" style={{ maxHeight: '60%' }}>
              <View className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-slate-800">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-900 dark:text-white text-xl font-bold">Request Allocation</Text>
                  <Pressable
                    onPress={() => setShowRequestModal(false)}
                    className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 active:opacity-70"
                  >
                    <X size={24} color="#64748b" />
                  </Pressable>
                </View>
              </View>

              <ScrollView className="px-6 py-4" keyboardShouldPersistTaps="handled">
                <View className="mb-4">
                  <Text className="text-gray-900 dark:text-white font-bold text-base mb-1">
                    {requestType === 'supplier' ? selectedSupplierFromStore?.name : selectedCandidate?.name}
                  </Text>
                  <Text className="text-gray-500 dark:text-slate-400 text-sm">
                    This request will be sent for founder approval.
                  </Text>
                </View>

                <View className="mb-4">
                  <Text className="text-gray-500 dark:text-slate-400 text-sm mb-2">Notes (Optional)</Text>
                  <TextInput
                    className="bg-gray-100 dark:bg-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-base min-h-[100px]"
                    value={requestNotes}
                    onChangeText={setRequestNotes}
                    placeholder="Why do you need this resource?"
                    placeholderTextColor="#64748b"
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                <Pressable
                  onPress={handleSubmitRequest}
                  className="bg-blue-500 py-4 rounded-xl active:opacity-70 mb-4"
                >
                  <View className="flex-row items-center justify-center">
                    <Send size={20} color="#fff" />
                    <Text className="text-white text-center font-bold ml-2">Submit Request</Text>
                  </View>
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Application Modal */}
      <Modal
        visible={showApplicationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowApplicationModal(false)}
      >
        <View className="flex-1 bg-black/70 justify-end">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end">
            <View className="bg-white dark:bg-slate-900 rounded-t-3xl" style={{ maxHeight: '90%' }}>
              <View className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-slate-800">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-900 dark:text-white text-xl font-bold">
                    Apply as {applicationType === 'executive' ? 'Executive' : applicationType === 'apprentice' ? 'Apprentice' : 'Supplier'}
                  </Text>
                  <Pressable
                    onPress={() => setShowApplicationModal(false)}
                    className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 active:opacity-70"
                  >
                    <X size={24} color="#64748b" />
                  </Pressable>
                </View>
              </View>

              <ScrollView className="px-6 py-4" keyboardShouldPersistTaps="handled">
                <Text className="text-blue-700 dark:text-blue-300 text-sm mb-4">
                  Join our talent network. We'll contact you when there's a match.
                </Text>

                <View className="mb-3">
                  <Text className="text-gray-500 dark:text-slate-400 text-sm mb-2">Full Name *</Text>
                  <TextInput
                    className="bg-gray-100 dark:bg-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-base"
                    value={applicationName}
                    onChangeText={setApplicationName}
                    placeholder="Your name"
                    placeholderTextColor="#64748b"
                  />
                </View>

                <View className="mb-3">
                  <Text className="text-gray-500 dark:text-slate-400 text-sm mb-2">Email *</Text>
                  <TextInput
                    className="bg-gray-100 dark:bg-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-base"
                    value={applicationEmail}
                    onChangeText={setApplicationEmail}
                    placeholder="your.email@example.com"
                    placeholderTextColor="#64748b"
                    keyboardType="email-address"
                  />
                </View>

                <View className="mb-3">
                  <Text className="text-gray-500 dark:text-slate-400 text-sm mb-2">Phone</Text>
                  <TextInput
                    className="bg-gray-100 dark:bg-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-base"
                    value={applicationPhone}
                    onChangeText={setApplicationPhone}
                    placeholder="+44 7XXX XXXXXX"
                    placeholderTextColor="#64748b"
                    keyboardType="phone-pad"
                  />
                </View>

                <View className="mb-3">
                  <Text className="text-gray-500 dark:text-slate-400 text-sm mb-2">
                    {applicationType === 'supplier' ? 'Services' : 'Area of Expertise'}
                  </Text>
                  <TextInput
                    className="bg-gray-100 dark:bg-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-base"
                    value={applicationSpecialization}
                    onChangeText={setApplicationSpecialization}
                    placeholder={applicationType === 'supplier' ? 'e.g., PCB Assembly' : 'e.g., Sales, Marketing'}
                    placeholderTextColor="#64748b"
                  />
                </View>

                <View className="mb-4">
                  <Text className="text-gray-500 dark:text-slate-400 text-sm mb-2">
                    {applicationType === 'supplier' ? 'Company Description' : 'Experience Summary'}
                  </Text>
                  <TextInput
                    className="bg-gray-100 dark:bg-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-base min-h-[100px]"
                    value={applicationExperience}
                    onChangeText={setApplicationExperience}
                    placeholder="Tell us about your background..."
                    placeholderTextColor="#64748b"
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                {applicationType !== 'supplier' && (
                  <View className="mb-4">
                    <Text className="text-gray-500 dark:text-slate-400 text-sm mb-2">CV/Resume</Text>
                    {!applicationCV ? (
                      <Pressable
                        onPress={handlePickDocument}
                        className="bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl p-4 active:opacity-70"
                      >
                        <View className="flex-row items-center justify-center">
                          <Upload size={20} color="#3b82f6" />
                          <Text className="text-blue-600 dark:text-blue-400 font-semibold ml-2">
                            Upload PDF or Word
                          </Text>
                        </View>
                      </Pressable>
                    ) : (
                      <View className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex-row items-center justify-between">
                        <View className="flex-1">
                          <View className="flex-row items-center">
                            <CheckCircle2 size={16} color="#10b981" />
                            <Text className="text-emerald-700 dark:text-emerald-300 font-semibold ml-2">Uploaded</Text>
                          </View>
                          <Text className="text-emerald-600 dark:text-emerald-400 text-sm" numberOfLines={1}>
                            {applicationCV.name}
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => setApplicationCV(null)}
                          className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full items-center justify-center active:opacity-70"
                        >
                          <X size={16} color="#ef4444" />
                        </Pressable>
                      </View>
                    )}
                  </View>
                )}

                <Pressable
                  onPress={handleSubmitApplication}
                  className="bg-blue-500 py-4 rounded-xl active:opacity-70 mb-8"
                >
                  <Text className="text-white text-center font-bold">Submit Application</Text>
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* AI Agent Detail Modal */}
      <Modal
        visible={selectedAIAgent !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedAIAgent(null)}
      >
        <Pressable className="flex-1 bg-black/70" onPress={() => setSelectedAIAgent(null)}>
          <View className="flex-1" />
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-950 rounded-t-3xl"
            style={{ maxHeight: '90%' }}
          >
            {selectedAIAgent && (
              <>
                {/* Header */}
                <View className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-slate-800">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-900 dark:text-white text-2xl font-bold">
                      AI Agent Details
                    </Text>
                    <Pressable
                      onPress={() => setSelectedAIAgent(null)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-900 active:opacity-70"
                    >
                      <X size={24} color="#64748b" />
                    </Pressable>
                  </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
                  <View className="px-6 py-6">
                    {/* Name and Provider */}
                    <View className="mb-6">
                      <View className="flex-row items-center mb-3">
                        <View className="w-16 h-16 bg-cyan-500 rounded-xl items-center justify-center">
                          <Bot size={32} color="#fff" />
                        </View>
                        <View className="ml-4 flex-1">
                          <Text className="text-gray-900 dark:text-white text-2xl font-bold">
                            {selectedAIAgent.name}
                          </Text>
                          <Text className="text-gray-600 dark:text-slate-400 text-base">
                            {selectedAIAgent.provider}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Cost and Rating */}
                    <View className="flex-row gap-3 mb-6">
                      <View className="flex-1 bg-gray-100 dark:bg-slate-800 rounded-xl p-4">
                        <Text className="text-gray-500 dark:text-slate-400 text-xs mb-1">Monthly Cost</Text>
                        <Text className="text-emerald-600 dark:text-emerald-400 text-xl font-bold">
                          £{selectedAIAgent.costPerMonth}
                        </Text>
                      </View>
                      {selectedAIAgent.reviews && (
                        <View className="flex-1 bg-gray-100 dark:bg-slate-800 rounded-xl p-4">
                          <Text className="text-gray-500 dark:text-slate-400 text-xs mb-1">Rating</Text>
                          <View className="flex-row items-center">
                            <Star size={16} color="#f59e0b" fill="#f59e0b" />
                            <Text className="text-amber-600 dark:text-amber-400 text-xl font-bold ml-1">
                              {selectedAIAgent.reviews.rating}
                            </Text>
                          </View>
                          <Text className="text-gray-500 dark:text-slate-500 text-xs">
                            {selectedAIAgent.reviews.totalReviews} reviews
                          </Text>
                        </View>
                      )}
                      {selectedAIAgent.setup?.timeToValue && (
                        <View className="flex-1 bg-gray-100 dark:bg-slate-800 rounded-xl p-4">
                          <Text className="text-gray-500 dark:text-slate-400 text-xs mb-1">Setup Time</Text>
                          <Text className="text-blue-600 dark:text-blue-400 text-xl font-bold">
                            {selectedAIAgent.setup.timeToValue}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Description */}
                    <View className="mb-6">
                      <Text className="text-gray-900 dark:text-white font-bold text-lg mb-2">About</Text>
                      <Text className="text-gray-700 dark:text-slate-300 text-base leading-6">
                        {selectedAIAgent.description || selectedAIAgent.purpose}
                      </Text>
                    </View>

                    {/* Business Functions */}
                    <View className="mb-6">
                      <Text className="text-gray-900 dark:text-white font-bold text-lg mb-3">Functions</Text>
                      <View className="flex-row flex-wrap gap-2">
                        {selectedAIAgent.functions.map((func, idx) => (
                          <View key={idx} className="bg-blue-100 dark:bg-blue-900/30 px-3 py-2 rounded-lg">
                            <Text className="text-blue-700 dark:text-blue-300 font-semibold">{func}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Capabilities */}
                    <View className="mb-6">
                      <Text className="text-gray-900 dark:text-white font-bold text-lg mb-3">Capabilities</Text>
                      <View className="bg-gray-100 dark:bg-slate-800 rounded-xl p-4">
                        {selectedAIAgent.capabilities.map((cap, idx) => (
                          <View key={idx} className="flex-row items-start mb-2">
                            <CheckCircle2 size={16} color="#10b981" />
                            <Text className="text-gray-700 dark:text-slate-300 flex-1 ml-2">{cap}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Integrations */}
                    <View className="mb-6">
                      <Text className="text-gray-900 dark:text-white font-bold text-lg mb-3">Integrations</Text>
                      <View className="flex-row flex-wrap gap-2">
                        {selectedAIAgent.integrations.map((int, idx) => (
                          <View key={idx} className="bg-gray-200 dark:bg-slate-700 px-3 py-2 rounded-lg">
                            <Text className="text-gray-700 dark:text-slate-300">{int}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Setup Info */}
                    {selectedAIAgent.setup && (
                      <View className="mb-6">
                        <Text className="text-gray-900 dark:text-white font-bold text-lg mb-3">Setup</Text>
                        <View className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                          {selectedAIAgent.setup.difficulty && (
                            <View className="flex-row justify-between mb-2">
                              <Text className="text-gray-600 dark:text-slate-400">Difficulty</Text>
                              <Text className="text-amber-700 dark:text-amber-300 font-semibold">{selectedAIAgent.setup.difficulty}</Text>
                            </View>
                          )}
                          {selectedAIAgent.setup.timeToValue && (
                            <View className="flex-row justify-between">
                              <Text className="text-gray-600 dark:text-slate-400">Time to Value</Text>
                              <Text className="text-amber-700 dark:text-amber-300 font-semibold">{selectedAIAgent.setup.timeToValue}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    )}

                    {/* Website Link */}
                    <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
                      <Text className="text-blue-700 dark:text-blue-300 font-semibold mb-1">Website</Text>
                      <Text className="text-blue-600 dark:text-blue-400">{selectedAIAgent.website}</Text>
                    </View>
                  </View>
                </ScrollView>

                {/* Action Button */}
                <View className="px-6 py-4 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                  <Pressable
                    onPress={() => {
                      Alert.alert('Learn More', `Visit ${selectedAIAgent.website} to get started with ${selectedAIAgent.name}.`);
                      setSelectedAIAgent(null);
                    }}
                    className="bg-cyan-500 rounded-xl py-4 items-center active:opacity-70"
                  >
                    <View className="flex-row items-center">
                      <ArrowUpRight size={20} color="#fff" />
                      <Text className="text-white font-bold text-base ml-2">Visit Website</Text>
                    </View>
                  </Pressable>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Candidate Comparison Modal */}
      <Modal
        visible={showCompareModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCompareModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/70"
          onPress={() => setShowCompareModal(false)}
        >
          <View className="flex-1" />
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-950 rounded-t-3xl"
            style={{ maxHeight: '90%' }}
          >
            {/* Header */}
            <View className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-slate-800">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-gray-900 dark:text-white text-2xl font-bold">
                    Compare Candidates
                  </Text>
                  <Text className="text-gray-500 dark:text-slate-400 text-sm mt-1">
                    Side-by-side talent comparison
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowCompareModal(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-900 active:opacity-70"
                >
                  <X size={24} color="#64748b" />
                </Pressable>
              </View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ flexGrow: 1 }}
            >
              {(() => {
                const candidatesToCompare = compareIds.map(id => {
                  const exec = scoredExecutives.find(e => e.id === id);
                  if (exec) return exec;
                  return scoredApprentices.find(a => a.id === id);
                }).filter(Boolean) as (typeof scoredExecutives[0] | typeof scoredApprentices[0])[];

                if (candidatesToCompare.length < 2) {
                  return (
                    <View className="flex-1 items-center justify-center py-20">
                      <Scale size={48} color="#64748b" />
                      <Text className="text-gray-500 dark:text-slate-400 text-center mt-4">
                        Select at least 2 candidates to compare
                      </Text>
                    </View>
                  );
                }

                const getBestValue = (field: 'overall' | 'experience' | 'costPerDay' | 'rating', higherIsBetter = true) => {
                  if (field === 'overall') {
                    const values = candidatesToCompare.map(c => c.score.overall);
                    return higherIsBetter ? Math.max(...values) : Math.min(...values);
                  }
                  const values = candidatesToCompare.map(c => c[field as keyof typeof c] as number);
                  return higherIsBetter ? Math.max(...values) : Math.min(...values);
                };

                const bestOverall = getBestValue('overall', true);
                const bestExperience = getBestValue('experience', true);
                const bestCost = getBestValue('costPerDay', false);
                const bestRating = getBestValue('rating', true);

                return (
                  <View className="px-4 py-6">
                    {/* Candidate Headers */}
                    <View className="flex-row gap-2 mb-6">
                      {candidatesToCompare.map((candidate, idx) => (
                        <View key={candidate.id} className="flex-1">
                          <View className={`rounded-xl p-4 ${
                            candidate.role === 'FractionalExec'
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800'
                          }`}>
                            <View className={`w-12 h-12 rounded-full items-center justify-center mb-2 ${
                              candidate.role === 'FractionalExec' ? 'bg-emerald-500' : 'bg-purple-500'
                            }`}>
                              <Text className="text-white text-lg font-bold">
                                {candidate.name.split(' ').map(n => n[0]).join('')}
                              </Text>
                            </View>
                            <Text className="text-gray-900 dark:text-white font-bold text-sm" numberOfLines={1}>
                              {candidate.name}
                            </Text>
                            <Text className={`text-xs font-medium ${
                              candidate.role === 'FractionalExec'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-purple-600 dark:text-purple-400'
                            }`}>
                              {candidate.role === 'FractionalExec' ? 'Executive' : 'Apprentice'}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>

                    {/* Match Score Comparison */}
                    <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
                      <View className="flex-row items-center mb-3">
                        <Target size={18} color="#3b82f6" />
                        <Text className="text-blue-700 dark:text-blue-300 font-bold ml-2">Match Score</Text>
                      </View>
                      <View className="flex-row gap-2">
                        {candidatesToCompare.map((candidate) => (
                          <View key={candidate.id} className="flex-1 items-center">
                            <View className={`w-16 h-16 rounded-full items-center justify-center ${
                              candidate.score.overall === bestOverall
                                ? 'bg-blue-500'
                                : 'bg-gray-300 dark:bg-slate-600'
                            }`}>
                              <Text className="text-white text-xl font-bold">{candidate.score.overall}</Text>
                            </View>
                            {candidate.score.overall === bestOverall && (
                              <View className="flex-row items-center mt-1">
                                <Crown size={12} color="#f59e0b" />
                                <Text className="text-amber-600 dark:text-amber-400 text-xs font-semibold ml-1">Best</Text>
                              </View>
                            )}
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Experience Comparison */}
                    <View className="bg-gray-100 dark:bg-slate-800 rounded-xl p-4 mb-4">
                      <View className="flex-row items-center mb-3">
                        <Briefcase size={18} color="#64748b" />
                        <Text className="text-gray-700 dark:text-slate-300 font-bold ml-2">Experience</Text>
                      </View>
                      <View className="flex-row gap-2">
                        {candidatesToCompare.map((candidate) => (
                          <View key={candidate.id} className={`flex-1 rounded-lg p-3 ${
                            candidate.experience === bestExperience
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700'
                              : 'bg-white dark:bg-slate-700'
                          }`}>
                            <Text className={`text-2xl font-bold text-center ${
                              candidate.experience === bestExperience
                                ? 'text-emerald-700 dark:text-emerald-300'
                                : 'text-gray-900 dark:text-white'
                            }`}>
                              {candidate.experience}
                            </Text>
                            <Text className="text-gray-500 dark:text-slate-400 text-xs text-center">years</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Cost Comparison */}
                    <View className="bg-gray-100 dark:bg-slate-800 rounded-xl p-4 mb-4">
                      <View className="flex-row items-center mb-3">
                        <DollarSign size={18} color="#64748b" />
                        <Text className="text-gray-700 dark:text-slate-300 font-bold ml-2">Cost per Square (□)</Text>
                      </View>
                      <View className="flex-row gap-2">
                        {candidatesToCompare.map((candidate) => (
                          <View key={candidate.id} className={`flex-1 rounded-lg p-3 ${
                            candidate.costPerDay === bestCost
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700'
                              : 'bg-white dark:bg-slate-700'
                          }`}>
                            <Text className={`text-xl font-bold text-center ${
                              candidate.costPerDay === bestCost
                                ? 'text-emerald-700 dark:text-emerald-300'
                                : 'text-gray-900 dark:text-white'
                            }`}>
                              £{Math.round(candidate.costPerDay / 2)}
                            </Text>
                            <Text className="text-gray-500 dark:text-slate-400 text-xs text-center">per □</Text>
                            <Text className="text-gray-400 dark:text-slate-500 text-[10px] text-center mt-0.5">(£{candidate.costPerDay}/day)</Text>
                            {candidate.costPerDay === bestCost && (
                              <Text className="text-emerald-600 dark:text-emerald-400 text-xs text-center font-semibold mt-1">Best Value</Text>
                            )}
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Rating Comparison */}
                    <View className="bg-gray-100 dark:bg-slate-800 rounded-xl p-4 mb-4">
                      <View className="flex-row items-center mb-3">
                        <Star size={18} color="#f59e0b" fill="#f59e0b" />
                        <Text className="text-gray-700 dark:text-slate-300 font-bold ml-2">Rating</Text>
                      </View>
                      <View className="flex-row gap-2">
                        {candidatesToCompare.map((candidate) => (
                          <View key={candidate.id} className={`flex-1 rounded-lg p-3 ${
                            candidate.rating === bestRating
                              ? 'bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700'
                              : 'bg-white dark:bg-slate-700'
                          }`}>
                            <View className="flex-row items-center justify-center">
                              <Star size={16} color="#f59e0b" fill="#f59e0b" />
                              <Text className={`text-xl font-bold ml-1 ${
                                candidate.rating === bestRating
                                  ? 'text-amber-700 dark:text-amber-300'
                                  : 'text-gray-900 dark:text-white'
                              }`}>
                                {candidate.rating}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Availability Comparison */}
                    <View className="bg-gray-100 dark:bg-slate-800 rounded-xl p-4 mb-4">
                      <View className="flex-row items-center mb-3">
                        <Clock size={18} color="#64748b" />
                        <Text className="text-gray-700 dark:text-slate-300 font-bold ml-2">Availability</Text>
                      </View>
                      <View className="flex-row gap-2">
                        {candidatesToCompare.map((candidate) => {
                          const isAvailableNow = candidate.availability.toLowerCase().includes('now');
                          return (
                            <View key={candidate.id} className={`flex-1 rounded-lg p-3 ${
                              isAvailableNow
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700'
                                : 'bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700'
                            }`}>
                              <Text className={`text-sm font-semibold text-center ${
                                isAvailableNow
                                  ? 'text-emerald-700 dark:text-emerald-300'
                                  : 'text-amber-700 dark:text-amber-300'
                              }`} numberOfLines={2}>
                                {candidate.availability}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>

                    {/* Skills Comparison */}
                    <View className="bg-gray-100 dark:bg-slate-800 rounded-xl p-4 mb-4">
                      <View className="flex-row items-center mb-3">
                        <Layers size={18} color="#64748b" />
                        <Text className="text-gray-700 dark:text-slate-300 font-bold ml-2">Top Skills</Text>
                      </View>
                      <View className="flex-row gap-2">
                        {candidatesToCompare.map((candidate) => (
                          <View key={candidate.id} className="flex-1">
                            {candidate.skills.slice(0, 4).map((skill, idx) => (
                              <View key={idx} className="bg-white dark:bg-slate-700 rounded-lg px-2 py-1.5 mb-1">
                                <Text className="text-gray-700 dark:text-slate-300 text-xs text-center" numberOfLines={1}>
                                  {skill}
                                </Text>
                              </View>
                            ))}
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Specialization Comparison */}
                    <View className="bg-gray-100 dark:bg-slate-800 rounded-xl p-4 mb-4">
                      <View className="flex-row items-center mb-3">
                        <Award size={18} color="#64748b" />
                        <Text className="text-gray-700 dark:text-slate-300 font-bold ml-2">Specialization</Text>
                      </View>
                      <View className="flex-row gap-2">
                        {candidatesToCompare.map((candidate) => (
                          <View key={candidate.id} className="flex-1">
                            {candidate.specialization.map((spec, idx) => (
                              <View key={idx} className="bg-blue-100 dark:bg-blue-900/30 rounded-lg px-2 py-1.5 mb-1">
                                <Text className="text-blue-700 dark:text-blue-300 text-xs text-center font-medium" numberOfLines={1}>
                                  {spec}
                                </Text>
                              </View>
                            ))}
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Location Comparison */}
                    <View className="bg-gray-100 dark:bg-slate-800 rounded-xl p-4 mb-6">
                      <View className="flex-row items-center mb-3">
                        <MapPin size={18} color="#64748b" />
                        <Text className="text-gray-700 dark:text-slate-300 font-bold ml-2">Location</Text>
                      </View>
                      <View className="flex-row gap-2">
                        {candidatesToCompare.map((candidate) => (
                          <View key={candidate.id} className="flex-1 bg-white dark:bg-slate-700 rounded-lg p-3">
                            <Text className="text-gray-700 dark:text-slate-300 text-sm text-center" numberOfLines={2}>
                              {candidate.location}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Summary Card */}
                    <View className="bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-900/20 dark:to-emerald-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
                      <View className="flex-row items-center mb-3">
                        <Sparkles size={18} color="#3b82f6" />
                        <Text className="text-blue-700 dark:text-blue-300 font-bold ml-2">Quick Recommendation</Text>
                      </View>
                      {(() => {
                        const topCandidate = candidatesToCompare.reduce((best, current) =>
                          current.score.overall > best.score.overall ? current : best
                        );
                        return (
                          <View className="flex-row items-center">
                            <View className={`w-10 h-10 rounded-full items-center justify-center ${
                              topCandidate.role === 'FractionalExec' ? 'bg-emerald-500' : 'bg-purple-500'
                            }`}>
                              <Text className="text-white font-bold">
                                {topCandidate.name.split(' ').map(n => n[0]).join('')}
                              </Text>
                            </View>
                            <View className="ml-3 flex-1">
                              <Text className="text-gray-900 dark:text-white font-bold">
                                {topCandidate.name}
                              </Text>
                              <Text className="text-gray-600 dark:text-slate-400 text-sm">
                                Highest match score ({topCandidate.score.overall}/100)
                              </Text>
                            </View>
                            <Crown size={24} color="#f59e0b" />
                          </View>
                        );
                      })()}
                    </View>

                    {/* Action Buttons */}
                    <View className="flex-row gap-3">
                      {candidatesToCompare.map((candidate) => (
                        <Pressable
                          key={candidate.id}
                          onPress={() => {
                            setShowCompareModal(false);
                            setSelectedCandidate(candidate);
                            setShowProfileModal(true);
                          }}
                          className={`flex-1 py-3 rounded-xl items-center active:opacity-70 ${
                            candidate.role === 'FractionalExec'
                              ? 'bg-emerald-500'
                              : 'bg-purple-500'
                          }`}
                        >
                          <Text className="text-white font-bold text-sm" numberOfLines={1}>
                            View {candidate.name.split(' ')[0]}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                );
              })()}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
