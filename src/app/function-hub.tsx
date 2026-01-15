// Function Hub - Central resource library for all business functions
// Access function-specific people, suppliers, AI tools, templates, guides, and advice

import { View, Text, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Search,
  Users,
  Package,
  Bot,
  FileText,
  BookOpen,
  CheckSquare,
  ChevronRight,
  Lightbulb,
  Target,
  ExternalLink,
  X,
  Globe,
  Zap,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAllFunctionProfiles, type FunctionProfile, type FunctionResource } from '@/lib/function-library';
import { useAppStore } from '@/lib/state/app-store';
import { cn } from '@/lib/cn';
import { useTheme } from '@/lib/ThemeContext';

// Icon mapping for resources
const RESOURCE_ICONS = {
  person: Users,
  supplier: Package,
  ai_tool: Bot,
  template: FileText,
  guide: BookOpen,
  checklist: CheckSquare,
};

export default function FunctionHubScreen() {
  const currentMembership = useAppStore((s) => s.currentMembership);
  const allProfiles = getAllFunctionProfiles();
  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';

  // Theme-aware colors
  const bgPrimary = isDark ? 'bg-slate-950' : isOffWhite ? 'bg-stone-50' : 'bg-white';
  const bgCard = isDark ? 'bg-slate-900' : isOffWhite ? 'bg-stone-100' : 'bg-gray-100';
  const borderColor = isDark ? 'border-slate-800' : isOffWhite ? 'border-stone-200' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : isOffWhite ? 'text-stone-900' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-stone-600' : 'text-gray-600';
  const textMuted = isDark ? 'text-slate-500' : isOffWhite ? 'text-stone-500' : 'text-gray-500';
  const iconColor = isDark ? '#94a3b8' : isOffWhite ? '#78716c' : '#6b7280';
  const backIconColor = isDark ? '#ffffff' : isOffWhite ? '#1c1917' : '#111827';

  const [selectedFunction, setSelectedFunction] = useState<FunctionProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'resources' | 'advice' | 'okrs'>('resources');
  const [selectedResource, setSelectedResource] = useState<FunctionResource | null>(null);
  const [showResourceModal, setShowResourceModal] = useState(false);

  // If user has a function, pre-select it
  const userFunction = currentMembership?.function;
  const initialProfile = selectedFunction || (userFunction ? allProfiles.find((p) => p.function === userFunction) : allProfiles[0]);
  const currentProfile = initialProfile || allProfiles[0];

  const handleBack = () => {
    if (selectedFunction) {
      setSelectedFunction(null);
    } else {
      router.back();
    }
  };

  const handleSelectFunction = (profile: FunctionProfile) => {
    setSelectedFunction(profile);
    setSearchQuery('');
    setActiveTab('resources');
  };

  // Filter resources by search query
  const filterResources = (resources: FunctionResource[]) => {
    if (!searchQuery) return resources;
    const query = searchQuery.toLowerCase();
    return resources.filter(
      (r) =>
        r.title.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query) ||
        r.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  };

  // If no function selected, show function selector
  if (!selectedFunction) {
    return (
      <View className={`flex-1 ${bgPrimary}`}>
        <SafeAreaView edges={['top']} className="flex-1">
          {/* Header */}
          <View className={`px-6 py-4 border-b ${borderColor}`}>
            <View className="flex-row items-center mb-4">
              <Pressable onPress={handleBack} className="mr-4 active:opacity-70">
                <ArrowLeft size={24} color={backIconColor} />
              </Pressable>
              <Text className={`${textPrimary} text-2xl font-bold`}>Function Library</Text>
            </View>
            <Text className={`${textSecondary} text-sm`}>
              Access resources, tools, and advice for your function
            </Text>
          </View>

          {/* Function Grid */}
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="p-6">
              <View className="flex-row flex-wrap gap-4">
                {allProfiles.map((profile) => {
                  // Theme-aware gradient - append appropriate dark color
                  const gradientEndColor = isDark ? '#020617' : isOffWhite ? '#f5f5f4' : '#f8fafc';
                  return (
                    <Pressable
                      key={profile.function}
                      onPress={() => handleSelectFunction(profile)}
                      className="flex-1 min-w-[45%] active:opacity-80"
                    >
                      <LinearGradient
                        colors={[...profile.gradient, gradientEndColor]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ borderRadius: 20, padding: 20, minHeight: 140 }}
                      >
                        <View className="items-center justify-center flex-1">
                          <View className="w-16 h-16 bg-white/10 rounded-full items-center justify-center mb-3 border-2 border-white/20">
                            <Text className="text-3xl">{getIconEmoji(profile.icon)}</Text>
                          </View>
                          <Text className="text-white font-bold text-base text-center mb-1">
                            {profile.title}
                          </Text>
                          <Text className="text-white/70 text-xs text-center" numberOfLines={2}>
                            {profile.description.split('.')[0]}
                          </Text>
                        </View>
                      </LinearGradient>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // Function detail view
  const role = currentMembership?.role || 'Founder';

  // Theme-aware gradient end color for detail view
  const gradientEndColor = isDark ? '#020617' : isOffWhite ? '#f5f5f4' : '#f8fafc';
  const tabBgColor = isDark ? 'bg-slate-900' : isOffWhite ? 'bg-stone-100' : 'bg-gray-100';
  const cardBgSecondary = isDark ? 'bg-slate-800' : isOffWhite ? 'bg-stone-200' : 'bg-gray-200';
  const textContent = isDark ? 'text-slate-300' : isOffWhite ? 'text-stone-700' : 'text-gray-700';

  return (
    <View className={`flex-1 ${bgPrimary}`}>
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header with gradient */}
        <LinearGradient
          colors={[...currentProfile.gradient, gradientEndColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}
        >
          <View className="flex-row items-center mb-4">
            <Pressable onPress={handleBack} className="mr-4 active:opacity-70">
              <ArrowLeft size={24} color="#fff" />
            </Pressable>
            <Text className="text-white text-2xl font-bold flex-1">{currentProfile.title}</Text>
          </View>
          <Text className="text-white/80 text-sm mb-4">{currentProfile.description}</Text>

          {/* Search */}
          <View className="bg-white/10 rounded-xl px-4 py-3 flex-row items-center backdrop-blur">
            <Search size={20} color="#fff" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search resources..."
              placeholderTextColor="#ffffff80"
              className="flex-1 ml-3 text-white"
            />
          </View>
        </LinearGradient>

        {/* Tab Navigation */}
        <View className={`flex-row ${tabBgColor} px-6 py-2 border-b ${borderColor}`}>
          <Pressable
            onPress={() => setActiveTab('resources')}
            className={cn('flex-1 py-3 items-center border-b-2', activeTab === 'resources' ? 'border-blue-500' : 'border-transparent')}
          >
            <Text className={cn('font-semibold', activeTab === 'resources' ? 'text-blue-500' : textSecondary)}>
              Resources
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('advice')}
            className={cn('flex-1 py-3 items-center border-b-2', activeTab === 'advice' ? 'border-blue-500' : 'border-transparent')}
          >
            <Text className={cn('font-semibold', activeTab === 'advice' ? 'text-blue-500' : textSecondary)}>
              Advice
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('okrs')}
            className={cn('flex-1 py-3 items-center border-b-2', activeTab === 'okrs' ? 'border-blue-500' : 'border-transparent')}
          >
            <Text className={cn('font-semibold', activeTab === 'okrs' ? 'text-blue-500' : textSecondary)}>
              OKRs
            </Text>
          </Pressable>
        </View>

        {/* Content */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {activeTab === 'resources' && (
            <View className="p-6">
              {/* People */}
              {filterResources(currentProfile.resources.people).length > 0 && (
                <ResourceSection
                  title="People"
                  icon={Users}
                  resources={filterResources(currentProfile.resources.people)}
                  color={currentProfile.color}
                  isDark={isDark}
                  isOffWhite={isOffWhite}
                  onResourcePress={(resource: FunctionResource) => {
                    setSelectedResource(resource);
                    setShowResourceModal(true);
                  }}
                />
              )}

              {/* Suppliers */}
              {filterResources(currentProfile.resources.suppliers).length > 0 && (
                <ResourceSection
                  title="Suppliers & Tools"
                  icon={Package}
                  resources={filterResources(currentProfile.resources.suppliers)}
                  color={currentProfile.color}
                  isDark={isDark}
                  isOffWhite={isOffWhite}
                  onResourcePress={(resource: FunctionResource) => {
                    setSelectedResource(resource);
                    setShowResourceModal(true);
                  }}
                />
              )}

              {/* AI Tools */}
              {filterResources(currentProfile.resources.aiTools).length > 0 && (
                <ResourceSection
                  title="AI Tools"
                  icon={Bot}
                  resources={filterResources(currentProfile.resources.aiTools)}
                  color={currentProfile.color}
                  isDark={isDark}
                  isOffWhite={isOffWhite}
                  onResourcePress={(resource: FunctionResource) => {
                    setSelectedResource(resource);
                    setShowResourceModal(true);
                  }}
                />
              )}

              {/* Templates */}
              {filterResources(currentProfile.resources.templates).length > 0 && (
                <ResourceSection
                  title="Templates"
                  icon={FileText}
                  resources={filterResources(currentProfile.resources.templates)}
                  color={currentProfile.color}
                  isDark={isDark}
                  isOffWhite={isOffWhite}
                  onResourcePress={(resource: FunctionResource) => {
                    setSelectedResource(resource);
                    setShowResourceModal(true);
                  }}
                />
              )}

              {/* Guides */}
              {filterResources(currentProfile.resources.guides).length > 0 && (
                <ResourceSection
                  title="Guides"
                  icon={BookOpen}
                  resources={filterResources(currentProfile.resources.guides)}
                  color={currentProfile.color}
                  isDark={isDark}
                  isOffWhite={isOffWhite}
                  onResourcePress={(resource: FunctionResource) => {
                    setSelectedResource(resource);
                    setShowResourceModal(true);
                  }}
                />
              )}

              {/* Checklists */}
              {filterResources(currentProfile.resources.checklists).length > 0 && (
                <ResourceSection
                  title="Checklists"
                  icon={CheckSquare}
                  resources={filterResources(currentProfile.resources.checklists)}
                  color={currentProfile.color}
                  isDark={isDark}
                  isOffWhite={isOffWhite}
                  onResourcePress={(resource: FunctionResource) => {
                    setSelectedResource(resource);
                    setShowResourceModal(true);
                  }}
                />
              )}
            </View>
          )}

          {activeTab === 'advice' && (
            <View className="p-6">
              {/* Role-specific advice */}
              <View className={`${bgCard} rounded-2xl p-6 mb-4 border ${borderColor}`}>
                <View className="flex-row items-center mb-4">
                  <Lightbulb size={24} color={currentProfile.color} />
                  <Text className={`${textPrimary} font-bold text-lg ml-3`}>Advice for {role}s</Text>
                </View>
                {getAdviceForRole(currentProfile, role).map((advice, index) => (
                  <View key={index} className="flex-row mb-3">
                    <View className="w-2 h-2 rounded-full bg-blue-500 mt-2 mr-3" />
                    <Text className={`${textContent} flex-1 leading-6`}>{advice}</Text>
                  </View>
                ))}
              </View>

              {/* Key Responsibilities */}
              <View className={`${bgCard} rounded-2xl p-6 mb-4 border ${borderColor}`}>
                <Text className={`${textPrimary} font-bold text-lg mb-4`}>Key Responsibilities</Text>
                {currentProfile.keyResponsibilities.map((resp, index) => (
                  <View key={index} className="flex-row mb-3">
                    <View className="w-2 h-2 rounded-full bg-green-500 mt-2 mr-3" />
                    <Text className={`${textContent} flex-1 leading-6`}>{resp}</Text>
                  </View>
                ))}
              </View>

              {/* Common Challenges */}
              <View className={`${bgCard} rounded-2xl p-6 mb-4 border ${borderColor}`}>
                <Text className={`${textPrimary} font-bold text-lg mb-4`}>Common Challenges</Text>
                {currentProfile.commonChallenges.map((challenge, index) => (
                  <View key={index} className="flex-row mb-3">
                    <View className="w-2 h-2 rounded-full bg-amber-500 mt-2 mr-3" />
                    <Text className={`${textContent} flex-1 leading-6`}>{challenge}</Text>
                  </View>
                ))}
              </View>

              {/* Success Metrics */}
              <View className={`${bgCard} rounded-2xl p-6 mb-4 border ${borderColor}`}>
                <Text className={`${textPrimary} font-bold text-lg mb-4`}>Success Metrics</Text>
                {currentProfile.successMetrics.map((metric, index) => (
                  <View key={index} className="flex-row mb-3">
                    <View className="w-2 h-2 rounded-full bg-purple-500 mt-2 mr-3" />
                    <Text className={`${textContent} flex-1 leading-6`}>{metric}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {activeTab === 'okrs' && (
            <View className="p-6">
              <View className={`${bgCard} rounded-2xl p-6 mb-4 border ${borderColor}`}>
                <View className="flex-row items-center mb-4">
                  <Target size={24} color={currentProfile.color} />
                  <Text className={`${textPrimary} font-bold text-lg ml-3`}>Suggested OKRs</Text>
                </View>
                <Text className={`${textSecondary} mb-2`}>
                  These are example OKRs for the {currentProfile.title} function. Tap any OKR to add it to your OKRs tab.
                </Text>
                <View className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-6">
                  <Text className="text-blue-500 dark:text-blue-400 text-xs">
                    💡 Tip: Once added, you can customize the objective and key results to fit your specific goals.
                  </Text>
                </View>

                {currentProfile.suggestedOKRs.map((okr, index) => (
                  <Pressable
                    key={index}
                    onPress={() => {
                      router.push({
                        pathname: '/(tabs)/decide',
                        params: {
                          addOkr: 'true',
                          objective: okr.objective,
                          rationale: okr.rationale,
                          keyResults: JSON.stringify(okr.keyResults),
                          functionName: currentProfile.title,
                        },
                      });
                    }}
                    className="mb-6 last:mb-0 active:opacity-70"
                  >
                    <View className={`${cardBgSecondary} rounded-xl p-4 mb-0 border-2 border-transparent active:border-blue-500`}>
                      <View className="flex-row items-start justify-between mb-2">
                        <Text className={`${textPrimary} font-bold text-base flex-1`}>{okr.objective}</Text>
                        <View className="ml-2 bg-blue-500/20 px-2 py-1 rounded-lg">
                          <Text className="text-blue-500 dark:text-blue-400 text-xs font-semibold">Tap to Add</Text>
                        </View>
                      </View>
                      <Text className={`${textSecondary} text-sm italic mb-3`}>{okr.rationale}</Text>

                      <Text className={`${textContent} font-semibold text-sm mb-2`}>Key Results:</Text>
                      {okr.keyResults.map((kr, krIndex) => (
                        <View key={krIndex} className="flex-row items-start mb-2">
                          <View className="w-6 h-6 bg-blue-500/20 rounded-full items-center justify-center mr-3 mt-0.5">
                            <Text className="text-blue-500 dark:text-blue-400 text-xs font-bold">{krIndex + 1}</Text>
                          </View>
                          <Text className={`${textContent} flex-1`}>{kr}</Text>
                        </View>
                      ))}
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Resource Details Modal */}
        <Modal
          visible={showResourceModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowResourceModal(false)}
        >
          <Pressable
            className="flex-1 bg-black/70 justify-end"
            onPress={() => setShowResourceModal(false)}
          >
            <Pressable
              onPress={(e) => e.stopPropagation()}
              className={`${bgPrimary} rounded-t-3xl max-h-[90%]`}
            >
              {selectedResource && (
                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Header */}
                  <View className={`px-6 py-6 border-b ${borderColor}`}>
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-1 mr-4">
                        <Text className={`${textPrimary} text-2xl font-bold mb-2`}>
                          {selectedResource.title}
                        </Text>
                        <Text className={`${textSecondary} text-base leading-relaxed`}>
                          {selectedResource.description}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => setShowResourceModal(false)}
                        className={`${bgCard} rounded-full p-2 active:opacity-70`}
                      >
                        <X size={20} color={iconColor} />
                      </Pressable>
                    </View>

                    {/* Tags */}
                    <View className="flex-row flex-wrap gap-2">
                      {selectedResource.tags.map((tag) => (
                        <View key={tag} className={`${bgCard} rounded-full px-3 py-1.5 border ${borderColor}`}>
                          <Text className={`${textSecondary} text-xs font-medium`}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Content */}
                  <View className="px-6 py-6">
                    {/* Category */}
                    <View className="mb-6">
                      <View className="flex-row items-center mb-3">
                        <View className={`${bgCard} rounded-lg px-3 py-1.5 border ${borderColor}`}>
                          <Text className={`${textSecondary} text-sm font-semibold`}>
                            {selectedResource.category}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Description */}
                    <View className="mb-6">
                      <Text className={`${textPrimary} text-lg font-bold mb-3`}>
                        About
                      </Text>
                      <Text className={`${textSecondary} text-base leading-relaxed`}>
                        {selectedResource.description}
                      </Text>
                    </View>

                    {/* Link */}
                    {selectedResource.url && (
                      <Pressable
                        onPress={() => {
                          // In a real app, open the URL
                          console.log('Opening URL:', selectedResource.url);
                        }}
                        className="bg-purple-500 rounded-xl py-4 px-6 flex-row items-center justify-center active:opacity-80"
                      >
                        <Globe size={20} color="#fff" />
                        <Text className="text-white text-base font-bold ml-2">
                          Visit Website
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </ScrollView>
              )}
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

// Helper component for resource sections
function ResourceSection({
  title,
  icon: Icon,
  resources,
  color,
  isDark,
  isOffWhite,
  onResourcePress,
}: {
  title: string;
  icon: any;
  resources: FunctionResource[];
  color: string;
  isDark: boolean;
  isOffWhite: boolean;
  onResourcePress: (resource: FunctionResource) => void;
}) {
  // Theme-aware colors
  const bgCard = isDark ? 'bg-slate-900' : isOffWhite ? 'bg-stone-100' : 'bg-gray-100';
  const borderColor = isDark ? 'border-slate-800' : isOffWhite ? 'border-stone-200' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : isOffWhite ? 'text-stone-900' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-stone-600' : 'text-gray-600';
  const badgeBg = isDark ? 'bg-slate-800' : isOffWhite ? 'bg-stone-200' : 'bg-gray-200';
  const iconColor = isDark ? '#64748b' : isOffWhite ? '#78716c' : '#6b7280';

  return (
    <View className="mb-8">
      <View className="flex-row items-center mb-4">
        <Icon size={20} color={color} />
        <Text className={`${textPrimary} font-bold text-lg ml-2`}>{title}</Text>
        <View className={`ml-2 ${badgeBg} rounded-full px-2 py-0.5`}>
          <Text className={`${textSecondary} text-xs`}>{resources.length}</Text>
        </View>
      </View>

      {resources.map((resource) => (
        <Pressable
          key={resource.id}
          onPress={() => onResourcePress(resource)}
          className={`${bgCard} rounded-xl p-4 mb-3 border ${borderColor} active:opacity-80`}
        >
          <View className="flex-row items-start">
            <View className="flex-1">
              <View className="flex-row items-center mb-1">
                <Text className={`${textPrimary} font-semibold text-base flex-1`}>{resource.title}</Text>
                {resource.url && <ExternalLink size={16} color={iconColor} />}
              </View>
              <Text className={`${textSecondary} text-sm mb-2`}>{resource.description}</Text>
              <View className="flex-row flex-wrap gap-2">
                {resource.tags.slice(0, 3).map((tag) => (
                  <View key={tag} className={`${badgeBg} rounded-full px-2 py-1`}>
                    <Text className={`${textSecondary} text-xs`}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
            <ChevronRight size={20} color={iconColor} className="ml-2" />
          </View>
        </Pressable>
      ))}
    </View>
  );
}

// Helper to get advice based on role
function getAdviceForRole(profile: FunctionProfile, role: string): string[] {
  switch (role) {
    case 'Founder':
      return profile.adviceForFounders;
    case 'FractionalExec':
      return profile.adviceForExecutives;
    case 'Apprentice':
      return profile.adviceForApprentices;
    default:
      return profile.adviceForFounders;
  }
}

// Helper to get emoji for icon name
function getIconEmoji(iconName: string): string {
  const emojiMap: Record<string, string> = {
    'pound-sterling': '💰',
    'shopping-cart': '🛒',
    megaphone: '📢',
    package: '📦',
    cpu: '⚙️',
    briefcase: '💼',
  };
  return emojiMap[iconName] || '📁';
}
