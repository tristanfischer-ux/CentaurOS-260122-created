import { View, Text, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { useState, useMemo, useEffect } from 'react';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft,
  Search,
  Building2,
  PieChart,
  BadgeCheck,
  FileText,
  ScrollText,
  Rocket,
  Shield,
  Landmark,
  Users,
  Settings,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target,
  Sparkles,
  X,
  Calendar,
  UserPlus,
} from 'lucide-react-native';
import { useStartupPackStore } from '@/lib/startup-pack';
import { useCurrentWorkspace, useCurrentMembership } from '@/lib/state/app-store';
import { useTheme } from '@/lib/ThemeContext';
import type { StartupPackSection } from '@/types';

// Icon mapping for sections
const SECTION_ICONS: Record<string, typeof Building2> = {
  incorporation: Building2,
  'share-structure': PieChart,
  'seis-eis': BadgeCheck,
  'shareholders-agreement': FileText,
  articles: ScrollText,
  fundraising: Rocket,
  'ip-trademarks': Shield,
  'banking-tax': Landmark,
  employment: Users,
  operations: Settings,
};

export default function StartupPackScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';
  const workspace = useCurrentWorkspace();
  const membership = useCurrentMembership();
  const workspaceId = workspace?.id ?? '';
  const userRole = membership?.role ?? 'Founder';

  // Store
  const getSections = useStartupPackStore(s => s.getSections);
  const getProgress = useStartupPackStore(s => s.getProgress);
  const getSectionProgress = useStartupPackStore(s => s.getSectionProgress);
  const searchAll = useStartupPackStore(s => s.searchAll);
  const canCreatePlan = useStartupPackStore(s => s.canCreatePlan);
  const initializeStartupPack = useStartupPackStore(s => s.initializeStartupPack);

  // Initialize store
  useEffect(() => {
    initializeStartupPack();
  }, [initializeStartupPack]);

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Data
  const sections = getSections();
  const progress = getProgress(workspaceId);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return searchAll(searchQuery);
  }, [searchQuery, searchAll]);

  // Theme colors
  const bgPrimary = isDark ? 'bg-slate-950' : isOffWhite ? 'bg-orange-50' : 'bg-gray-50';
  const bgCard = isDark ? 'bg-slate-900' : isOffWhite ? 'bg-white' : 'bg-white';
  const borderColor = isDark ? 'border-slate-800' : isOffWhite ? 'border-orange-200' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-orange-700' : 'text-gray-600';
  const textMuted = isDark ? 'text-slate-500' : isOffWhite ? 'text-orange-600' : 'text-gray-500';

  const handleSectionPress = (sectionId: string) => {
    router.push(`/startup-pack/${sectionId}`);
  };

  const handleMyPlanPress = () => {
    router.push('/startup-pack/plan');
  };

  const renderSectionCard = (section: StartupPackSection, index: number) => {
    const Icon = SECTION_ICONS[section.id] ?? FileText;
    const sectionProgress = getSectionProgress(workspaceId, section.id);
    const progressPercent = sectionProgress.percent;

    return (
      <Animated.View
        key={section.id}
        entering={FadeInDown.delay(index * 50).duration(300)}
      >
        <Pressable
          onPress={() => handleSectionPress(section.id)}
          className={`${bgCard} border ${borderColor} rounded-2xl p-4 mb-3 active:opacity-70`}
        >
          <View className="flex-row items-start">
            <View
              className="w-12 h-12 rounded-xl items-center justify-center mr-4"
              style={{ backgroundColor: (section.color ?? '#3b82f6') + '20' }}
            >
              <Icon size={24} color={section.color ?? '#3b82f6'} />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center justify-between mb-1">
                <Text className={`${textPrimary} font-bold text-base flex-1`} numberOfLines={1}>
                  {section.title}
                </Text>
                <ChevronRight size={18} color={isDark ? '#64748b' : '#9ca3af'} />
              </View>
              <Text className={`${textSecondary} text-sm mb-2`} numberOfLines={2}>
                {section.description}
              </Text>
              {/* Progress bar */}
              <View className="flex-row items-center">
                <View className="flex-1 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden mr-2">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${progressPercent}%`,
                      backgroundColor: section.color ?? '#3b82f6',
                    }}
                  />
                </View>
                <Text className={`${textMuted} text-xs`}>
                  {sectionProgress.completed}/{sectionProgress.total}
                </Text>
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  const renderSearchResults = () => {
    if (!searchResults) return null;

    const hasResults =
      searchResults.sections.length > 0 ||
      searchResults.articles.length > 0 ||
      searchResults.checklistItems.length > 0 ||
      searchResults.templates.length > 0;

    if (!hasResults) {
      return (
        <View className="items-center py-12">
          <Text className={`${textSecondary} text-center`}>
            No results found for "{searchQuery}"
          </Text>
        </View>
      );
    }

    return (
      <View>
        {searchResults.sections.length > 0 && (
          <View className="mb-4">
            <Text className={`${textPrimary} font-bold mb-2`}>Sections</Text>
            {searchResults.sections.map(section => (
              <Pressable
                key={section.id}
                onPress={() => handleSectionPress(section.id)}
                className={`${bgCard} border ${borderColor} rounded-xl p-3 mb-2 active:opacity-70`}
              >
                <Text className={`${textPrimary} font-semibold`}>{section.title}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {searchResults.articles.length > 0 && (
          <View className="mb-4">
            <Text className={`${textPrimary} font-bold mb-2`}>Articles</Text>
            {searchResults.articles.slice(0, 5).map(article => (
              <Pressable
                key={article.id}
                onPress={() => handleSectionPress(article.sectionId)}
                className={`${bgCard} border ${borderColor} rounded-xl p-3 mb-2 active:opacity-70`}
              >
                <Text className={`${textPrimary} font-semibold`}>{article.title}</Text>
                <Text className={`${textSecondary} text-sm`} numberOfLines={1}>
                  {article.summary}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {searchResults.checklistItems.length > 0 && (
          <View className="mb-4">
            <Text className={`${textPrimary} font-bold mb-2`}>Checklist Items</Text>
            {searchResults.checklistItems.slice(0, 5).map(item => (
              <Pressable
                key={item.id}
                onPress={() => handleSectionPress(item.sectionId)}
                className={`${bgCard} border ${borderColor} rounded-xl p-3 mb-2 active:opacity-70`}
              >
                <Text className={`${textPrimary} font-semibold`}>{item.title}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {searchResults.templates.length > 0 && (
          <View className="mb-4">
            <Text className={`${textPrimary} font-bold mb-2`}>Templates</Text>
            {searchResults.templates.slice(0, 5).map(template => (
              <Pressable
                key={template.id}
                onPress={() => router.push(`/startup-pack/template/${template.id}`)}
                className={`${bgCard} border ${borderColor} rounded-xl p-3 mb-2 active:opacity-70`}
              >
                <Text className={`${textPrimary} font-semibold`}>{template.title}</Text>
                <Text className={`${textSecondary} text-sm`} numberOfLines={1}>
                  {template.description}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View className={`flex-1 ${bgPrimary}`}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <LinearGradient
        colors={isDark ? ['#1e40af', '#3730a3'] : ['#3b82f6', '#6366f1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingHorizontal: 20, paddingTop: insets.top + 12, paddingBottom: 20 }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <Pressable onPress={() => router.back()} className="mr-3">
            <ArrowLeft size={24} color="#fff" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-white/70 text-xs font-medium">EDUCATIONAL RESOURCE</Text>
            <Text className="text-white text-2xl font-bold">Startup Pack</Text>
          </View>
          <Pressable
            onPress={() => setShowSearch(!showSearch)}
            className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
          >
            {showSearch ? (
              <X size={20} color="#fff" />
            ) : (
              <Search size={20} color="#fff" />
            )}
          </Pressable>
        </View>

        {/* Search Bar */}
        {showSearch && (
          <View className="bg-white/20 rounded-xl px-4 py-2 flex-row items-center">
            <Search size={18} color="#fff" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search guides, checklists, templates..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              className="flex-1 text-white ml-3"
              autoFocus
            />
          </View>
        )}

        {/* Disclaimer Banner */}
        {!showSearch && (
          <View className="bg-amber-500/30 rounded-xl p-3 flex-row items-start">
            <AlertTriangle size={16} color="#fbbf24" style={{ marginTop: 2 }} />
            <Text className="text-white/90 text-xs ml-2 flex-1">
              Educational information only. Not legal or tax advice. Consult a solicitor/accountant for specific guidance.
            </Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Show search results or main content */}
        {showSearch && searchQuery ? (
          renderSearchResults()
        ) : (
          <>
            {/* Progress Overview */}
            <Animated.View entering={FadeInDown.duration(300)}>
              <View className={`${bgCard} border ${borderColor} rounded-2xl p-4 mb-4`}>
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <Target size={20} color="#3b82f6" />
                    <Text className={`${textPrimary} font-bold ml-2`}>Your Progress</Text>
                  </View>
                  <View className="bg-blue-500/20 px-3 py-1 rounded-full">
                    <Text className="text-blue-500 font-bold">{progress.percentComplete}%</Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
                  <View
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${progress.percentComplete}%` }}
                  />
                </View>

                {/* Stats Row */}
                <View className="flex-row justify-between">
                  <View className="items-center">
                    <Text className={`${textPrimary} font-bold text-lg`}>{progress.completedItems}</Text>
                    <Text className={`${textMuted} text-xs`}>Completed</Text>
                  </View>
                  <View className="items-center">
                    <Text className={`${textPrimary} font-bold text-lg`}>{progress.inProgressItems}</Text>
                    <Text className={`${textMuted} text-xs`}>In Progress</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-amber-500 font-bold text-lg">{progress.criticalRemaining}</Text>
                    <Text className={`${textMuted} text-xs`}>Critical Left</Text>
                  </View>
                  <View className="items-center">
                    <Text className={`${textPrimary} font-bold text-lg`}>{progress.totalItems}</Text>
                    <Text className={`${textMuted} text-xs`}>Total</Text>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Quick Actions - 3x2 Grid */}
            {canCreatePlan(userRole) && (
              <Animated.View entering={FadeInDown.delay(100).duration(300)}>
                <View className="mb-4">
                  {/* First Row - Events & Guild */}
                  <View className="flex-row gap-3 mb-3">
                    <Pressable
                      onPress={() => {
                        // Navigate to events/community features
                        router.push('/(tabs)/community');
                      }}
                      className="flex-1 bg-amber-500 rounded-xl p-4 active:opacity-70"
                    >
                      <Calendar size={24} color="#fff" />
                      <Text className="text-white font-bold mt-2">Events</Text>
                      <Text className="text-white/70 text-xs">Networking & workshops</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        // Navigate to guild/community
                        router.push('/(tabs)/community');
                      }}
                      className="flex-1 bg-emerald-500 rounded-xl p-4 active:opacity-70"
                    >
                      <UserPlus size={24} color="#fff" />
                      <Text className="text-white font-bold mt-2">Guild</Text>
                      <Text className="text-white/70 text-xs">Connect with founders</Text>
                    </Pressable>
                  </View>

                  {/* Second Row - Setup Plan & Wizard */}
                  <View className="flex-row gap-3">
                    <Pressable
                      onPress={handleMyPlanPress}
                      className="flex-1 bg-blue-500 rounded-xl p-4 active:opacity-70"
                    >
                      <Sparkles size={24} color="#fff" />
                      <Text className="text-white font-bold mt-2">My Setup Plan</Text>
                      <Text className="text-white/70 text-xs">View personalized checklist</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => router.push('/startup-pack/wizard')}
                      className="flex-1 bg-purple-500 rounded-xl p-4 active:opacity-70"
                    >
                      <Rocket size={24} color="#fff" />
                      <Text className="text-white font-bold mt-2">Setup Wizard</Text>
                      <Text className="text-white/70 text-xs">Generate your plan</Text>
                    </Pressable>
                  </View>
                </View>
              </Animated.View>
            )}

            {/* Next Actions */}
            {progress.nextActions.length > 0 && (
              <Animated.View entering={FadeInDown.delay(150).duration(300)}>
                <View className={`${bgCard} border ${borderColor} rounded-2xl p-4 mb-4`}>
                  <View className="flex-row items-center mb-3">
                    <Clock size={18} color="#f59e0b" />
                    <Text className={`${textPrimary} font-bold ml-2`}>Next Actions</Text>
                  </View>
                  {progress.nextActions.slice(0, 3).map((item, index) => (
                    <Pressable
                      key={item.id}
                      onPress={() => handleSectionPress(item.sectionId)}
                      className={`flex-row items-center py-2 ${index < 2 ? 'border-b border-gray-200 dark:border-slate-700' : ''} active:opacity-70`}
                    >
                      <View
                        className="w-2 h-2 rounded-full mr-3"
                        style={{
                          backgroundColor:
                            item.priority === 'critical'
                              ? '#ef4444'
                              : item.priority === 'high'
                                ? '#f97316'
                                : '#3b82f6',
                        }}
                      />
                      <Text className={`${textPrimary} flex-1`} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <ChevronRight size={16} color="#9ca3af" />
                    </Pressable>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* Sections */}
            <Animated.View entering={FadeInDown.delay(200).duration(300)}>
              <Text className={`${textPrimary} font-bold text-lg mb-3`}>
                All Sections
              </Text>
            </Animated.View>

            {sections.map((section, index) => renderSectionCard(section, index))}

            {/* Footer Note */}
            <View className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mt-4">
              <Text className="text-blue-400 text-sm text-center">
                All content is UK-focused. For international operations, consult local advisors.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
