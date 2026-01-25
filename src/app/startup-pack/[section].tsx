import { View, Text, ScrollView, Pressable, Linking, Modal } from 'react-native';
import { useState, useMemo } from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft,
  BookOpen,
  CheckSquare,
  FileText,
  ChevronRight,
  ExternalLink,
  Check,
  Clock,
  AlertTriangle,
  Circle,
  X,
  Play,
  User,
  Users,
} from 'lucide-react-native';
import { useStartupPackStore } from '@/lib/startup-pack';
import { useCurrentWorkspace, useCurrentMembership } from '@/lib/state/app-store';
import { useTheme } from '@/lib/ThemeContext';
import type { StartupChecklistItem, StartupChecklistStatus } from '@/types';
// @ts-ignore - markdown renderer
import Markdown from 'react-native-markdown-display';

type TabType = 'guide' | 'checklist' | 'templates';

const PRIORITY_COLORS = {
  critical: { bg: '#ef4444', text: '#ffffff' },
  high: { bg: '#f97316', text: '#ffffff' },
  medium: { bg: '#3b82f6', text: '#ffffff' },
  low: { bg: '#6b7280', text: '#ffffff' },
};

const STATUS_ICONS = {
  not_started: Circle,
  in_progress: Clock,
  done: Check,
};

export default function SectionDetailScreen() {
  const { section: sectionId } = useLocalSearchParams<{ section: string }>();
  const insets = useSafeAreaInsets();
  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';
  const workspace = useCurrentWorkspace();
  const membership = useCurrentMembership();
  const workspaceId = workspace?.id ?? '';
  const userRole = membership?.role ?? 'Founder';

  // Store
  const getSectionById = useStartupPackStore(s => s.getSectionById);
  const getSectionArticles = useStartupPackStore(s => s.getSectionArticles);
  const getSectionChecklist = useStartupPackStore(s => s.getSectionChecklist);
  const getSectionTemplates = useStartupPackStore(s => s.getSectionTemplates);
  const getChecklistItemState = useStartupPackStore(s => s.getChecklistItemState);
  const updateChecklistItemState = useStartupPackStore(s => s.updateChecklistItemState);
  const canEdit = useStartupPackStore(s => s.canEdit);

  // Data
  const section = getSectionById(sectionId ?? '');
  const articles = getSectionArticles(sectionId ?? '');
  const checklistItems = getSectionChecklist(sectionId ?? '');
  const templates = getSectionTemplates(sectionId ?? '');

  // Local state
  const [activeTab, setActiveTab] = useState<TabType>('guide');
  const [expandedArticle, setExpandedArticle] = useState<string | null>(articles[0]?.id ?? null);
  const [selectedChecklistItem, setSelectedChecklistItem] = useState<StartupChecklistItem | null>(null);

  // Theme colors
  const bgPrimary = isDark ? 'bg-slate-950' : isOffWhite ? 'bg-orange-50' : 'bg-gray-50';
  const bgCard = isDark ? 'bg-slate-900' : isOffWhite ? 'bg-white' : 'bg-white';
  const borderColor = isDark ? 'border-slate-800' : isOffWhite ? 'border-orange-200' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-orange-700' : 'text-gray-600';
  const textMuted = isDark ? 'text-slate-500' : isOffWhite ? 'text-orange-600' : 'text-gray-500';

  // Markdown styles
  const markdownStyles = useMemo(() => ({
    body: {
      color: isDark ? '#e2e8f0' : '#1f2937',
      fontSize: 14,
      lineHeight: 22,
    },
    heading1: {
      color: isDark ? '#ffffff' : '#111827',
      fontSize: 22,
      fontWeight: 'bold' as const,
      marginTop: 16,
      marginBottom: 8,
    },
    heading2: {
      color: isDark ? '#ffffff' : '#111827',
      fontSize: 18,
      fontWeight: 'bold' as const,
      marginTop: 14,
      marginBottom: 6,
    },
    heading3: {
      color: isDark ? '#ffffff' : '#111827',
      fontSize: 16,
      fontWeight: '600' as const,
      marginTop: 12,
      marginBottom: 4,
    },
    paragraph: {
      marginBottom: 12,
    },
    list_item: {
      marginBottom: 4,
    },
    bullet_list: {
      marginBottom: 12,
    },
    code_inline: {
      backgroundColor: isDark ? '#1e293b' : '#f3f4f6',
      color: isDark ? '#93c5fd' : '#1f2937',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      fontSize: 13,
    },
    fence: {
      backgroundColor: isDark ? '#1e293b' : '#f3f4f6',
      padding: 12,
      borderRadius: 8,
      marginVertical: 8,
    },
    table: {
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e5e7eb',
      marginVertical: 8,
    },
    th: {
      backgroundColor: isDark ? '#1e293b' : '#f3f4f6',
      padding: 8,
      fontWeight: 'bold' as const,
    },
    td: {
      padding: 8,
      borderTopWidth: 1,
      borderColor: isDark ? '#334155' : '#e5e7eb',
    },
    blockquote: {
      backgroundColor: isDark ? '#1e293b' : '#fef3c7',
      borderLeftWidth: 4,
      borderLeftColor: isDark ? '#3b82f6' : '#f59e0b',
      paddingLeft: 12,
      paddingVertical: 8,
      marginVertical: 8,
    },
    link: {
      color: '#3b82f6',
    },
    strong: {
      fontWeight: 'bold' as const,
    },
  }), [isDark]);

  if (!section) {
    return (
      <View className={`flex-1 ${bgPrimary} items-center justify-center`}>
        <Text className={textPrimary}>Section not found</Text>
      </View>
    );
  }

  const handleChecklistToggle = (item: StartupChecklistItem) => {
    if (!canEdit(userRole)) return;

    const currentState = getChecklistItemState(workspaceId, item.id);
    const currentStatus = currentState?.status ?? 'not_started';

    // Cycle through statuses
    let newStatus: StartupChecklistStatus;
    if (currentStatus === 'not_started') {
      newStatus = 'in_progress';
    } else if (currentStatus === 'in_progress') {
      newStatus = 'done';
    } else {
      newStatus = 'not_started';
    }

    updateChecklistItemState(workspaceId, item.id, { status: newStatus });
  };

  const renderTabs = () => (
    <View className="flex-row bg-gray-200 dark:bg-slate-900 rounded-xl p-1 mx-5 mb-4">
      {[
        { id: 'guide' as TabType, label: 'Guide', icon: BookOpen },
        { id: 'checklist' as TabType, label: 'Checklist', icon: CheckSquare },
        { id: 'templates' as TabType, label: 'Templates', icon: FileText },
      ].map(tab => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <Pressable
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            className={`flex-1 flex-row items-center justify-center py-2 rounded-lg ${isActive ? 'bg-white dark:bg-slate-700' : ''}`}
          >
            <Icon size={16} color={isActive ? '#3b82f6' : '#64748b'} />
            <Text
              className={`ml-2 font-semibold ${isActive ? 'text-blue-500' : textMuted}`}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  const renderGuideTab = () => (
    <View className="px-5">
      {articles.length === 0 ? (
        <View className={`${bgCard} border ${borderColor} rounded-xl p-6 items-center`}>
          <BookOpen size={32} color="#64748b" />
          <Text className={`${textSecondary} mt-2 text-center`}>
            No guides available for this section yet.
          </Text>
        </View>
      ) : (
        articles.map((article, index) => {
          const isExpanded = expandedArticle === article.id;
          return (
            <Animated.View
              key={article.id}
              entering={FadeInDown.delay(index * 50).duration(300)}
            >
              <View className={`${bgCard} border ${borderColor} rounded-xl mb-3 overflow-hidden`}>
                <Pressable
                  onPress={() => setExpandedArticle(isExpanded ? null : article.id)}
                  className="p-4 flex-row items-center justify-between"
                >
                  <View className="flex-1 mr-3">
                    <Text className={`${textPrimary} font-bold`}>{article.title}</Text>
                    {!isExpanded && (
                      <Text className={`${textSecondary} text-sm mt-1`} numberOfLines={2}>
                        {article.summary}
                      </Text>
                    )}
                  </View>
                  <ChevronRight
                    size={20}
                    color="#64748b"
                    style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
                  />
                </Pressable>
                {isExpanded && (
                  <View className="px-4 pb-4 border-t border-gray-200 dark:border-slate-700 pt-4">
                    <View className="flex-row items-center mb-3">
                      <Clock size={14} color="#64748b" />
                      <Text className={`${textMuted} text-xs ml-2`}>
                        {article.readTimeMinutes ?? 5} min read
                      </Text>
                      <View className="w-1 h-1 bg-gray-400 rounded-full mx-2" />
                      <Text className={`${textMuted} text-xs`}>
                        {article.jurisdiction}
                      </Text>
                    </View>
                    <Markdown style={markdownStyles}>
                      {article.contentMarkdown}
                    </Markdown>
                  </View>
                )}
              </View>
            </Animated.View>
          );
        })
      )}

      {/* Section disclaimer */}
      {(sectionId === 'seis-eis' || sectionId === 'shareholders-agreement' || sectionId === 'articles') && (
        <View className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mt-4">
          <View className="flex-row items-start">
            <AlertTriangle size={16} color="#f59e0b" style={{ marginTop: 2 }} />
            <Text className="text-amber-600 dark:text-amber-400 text-sm ml-2 flex-1">
              This section contains complex legal/tax matters. Always consult a qualified solicitor or accountant before taking action.
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderChecklistTab = () => (
    <View className="px-5">
      {checklistItems.length === 0 ? (
        <View className={`${bgCard} border ${borderColor} rounded-xl p-6 items-center`}>
          <CheckSquare size={32} color="#64748b" />
          <Text className={`${textSecondary} mt-2 text-center`}>
            No checklist items for this section.
          </Text>
        </View>
      ) : (
        checklistItems.map((item, index) => {
          const state = getChecklistItemState(workspaceId, item.id);
          const status = state?.status ?? 'not_started';
          const StatusIcon = STATUS_ICONS[status];
          const priorityColor = PRIORITY_COLORS[item.priority];

          return (
            <Animated.View
              key={item.id}
              entering={FadeInDown.delay(index * 30).duration(300)}
            >
              <Pressable
                onPress={() => setSelectedChecklistItem(item)}
                className={`${bgCard} border ${borderColor} rounded-xl p-4 mb-3 active:opacity-70`}
              >
                <View className="flex-row items-start">
                  {/* Status indicator */}
                  <View
                    className={`w-6 h-6 rounded-full items-center justify-center mr-3 ${status === 'done'
                        ? 'bg-emerald-500'
                        : status === 'in_progress'
                          ? 'bg-amber-500'
                          : 'bg-gray-300 dark:bg-slate-600'
                      }`}
                  >
                    <StatusIcon size={14} color="#fff" />
                  </View>

                  <View className="flex-1">
                    {/* Title and priority */}
                    <View className="flex-row items-center justify-between mb-1">
                      <Text
                        className={`font-semibold flex-1 ${status === 'done'
                            ? 'text-gray-400 line-through'
                            : textPrimary
                          }`}
                      >
                        {item.title}
                      </Text>
                      <View
                        className="px-2 py-0.5 rounded ml-2"
                        style={{ backgroundColor: priorityColor.bg }}
                      >
                        <Text className="text-white text-xs font-bold">
                          {item.priority.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {/* Description */}
                    <Text className={`${textSecondary} text-sm mb-2`}>
                      {item.description}
                    </Text>

                    {/* Meta info */}
                    <View className="flex-row items-center flex-wrap gap-3">
                      {item.estimatedHours && (
                        <View className="flex-row items-center">
                          <Clock size={12} color="#64748b" />
                          <Text className={`${textMuted} text-xs ml-1`}>
                            ~{item.estimatedHours}h
                          </Text>
                        </View>
                      )}
                      {item.ownerRoleHint && (
                        <View className="bg-blue-500/10 px-2 py-0.5 rounded">
                          <Text className="text-blue-500 text-xs">
                            {item.ownerRoleHint}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Links */}
                    {item.links && item.links.length > 0 && (
                      <View className="mt-2 flex-row flex-wrap gap-2">
                        {item.links.map((link, linkIndex) => (
                          <Pressable
                            key={linkIndex}
                            onPress={() => Linking.openURL(link.url)}
                            className="flex-row items-center bg-blue-500/10 px-2 py-1 rounded"
                          >
                            <ExternalLink size={12} color="#3b82f6" />
                            <Text className="text-blue-500 text-xs ml-1">{link.label}</Text>
                          </Pressable>
                        ))}
                      </View>
                    )}

                    {/* Template links */}
                    {item.templateIds && item.templateIds.length > 0 && (
                      <View className="mt-2 flex-row flex-wrap gap-2">
                        {item.templateIds.map((tplId, tplIndex) => (
                          <Pressable
                            key={tplIndex}
                            onPress={() => router.push(`/startup-pack/template/${tplId}`)}
                            className="flex-row items-center bg-purple-500/10 px-2 py-1 rounded"
                          >
                            <FileText size={12} color="#a855f7" />
                            <Text className="text-purple-500 text-xs ml-1">Template</Text>
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          );
        })
      )}
    </View>
  );

  const renderTemplatesTab = () => (
    <View className="px-5">
      {templates.length === 0 ? (
        <View className={`${bgCard} border ${borderColor} rounded-xl p-6 items-center`}>
          <FileText size={32} color="#64748b" />
          <Text className={`${textSecondary} mt-2 text-center`}>
            No templates available for this section.
          </Text>
        </View>
      ) : (
        templates.map((template, index) => (
          <Animated.View
            key={template.id}
            entering={FadeInDown.delay(index * 50).duration(300)}
          >
            <Pressable
              onPress={() => router.push(`/startup-pack/template/${template.id}`)}
              className={`${bgCard} border ${borderColor} rounded-xl p-4 mb-3 active:opacity-70`}
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className={`${textPrimary} font-bold flex-1`}>{template.title}</Text>
                <ChevronRight size={18} color="#64748b" />
              </View>
              <Text className={`${textSecondary} text-sm mb-2`}>
                {template.description}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {template.tags.slice(0, 4).map((tag, tagIndex) => (
                  <View key={tagIndex} className="bg-gray-200 dark:bg-slate-700 px-2 py-0.5 rounded">
                    <Text className={`${textMuted} text-xs`}>{tag}</Text>
                  </View>
                ))}
              </View>
            </Pressable>
          </Animated.View>
        ))
      )}
    </View>
  );

  const renderChecklistModal = () => {
    if (!selectedChecklistItem) return null;

    const state = getChecklistItemState(workspaceId, selectedChecklistItem.id);
    const status = state?.status ?? 'not_started';
    const priorityColor = PRIORITY_COLORS[selectedChecklistItem.priority];

    const setStatus = (newStatus: StartupChecklistStatus) => {
      updateChecklistItemState(workspaceId, selectedChecklistItem.id, { status: newStatus });
    };

    return (
      <Modal
        visible={!!selectedChecklistItem}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedChecklistItem(null)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View
            className={`${isDark ? 'bg-slate-900' : 'bg-white'} rounded-t-3xl`}
            style={{ paddingBottom: insets.bottom + 16, maxHeight: '85%' }}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-slate-700">
              <View className="flex-1 mr-4">
                <View className="flex-row items-center gap-2 mb-1">
                  <View
                    className="px-2 py-0.5 rounded"
                    style={{ backgroundColor: priorityColor.bg }}
                  >
                    <Text className="text-white text-xs font-bold">
                      {selectedChecklistItem.priority.toUpperCase()}
                    </Text>
                  </View>
                  {selectedChecklistItem.estimatedHours && (
                    <View className="flex-row items-center">
                      <Clock size={12} color="#64748b" />
                      <Text className={`${textMuted} text-xs ml-1`}>
                        ~{selectedChecklistItem.estimatedHours}h
                      </Text>
                    </View>
                  )}
                </View>
                <Text className={`${textPrimary} font-bold text-lg`}>
                  {selectedChecklistItem.title}
                </Text>
              </View>
              <Pressable
                onPress={() => setSelectedChecklistItem(null)}
                className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-700 items-center justify-center"
              >
                <X size={18} color={isDark ? '#fff' : '#374151'} />
              </Pressable>
            </View>

            <ScrollView className="px-5 py-4" showsVerticalScrollIndicator={false}>
              {/* Description */}
              <Text className={`${textSecondary} mb-6`}>
                {selectedChecklistItem.description}
              </Text>

              {/* Status Selector */}
              <Text className={`${textPrimary} font-semibold mb-3`}>Status</Text>
              <View className="flex-row gap-2 mb-6">
                <Pressable
                  onPress={() => setStatus('not_started')}
                  disabled={!canEdit(userRole)}
                  className={`flex-1 py-3 rounded-xl items-center border ${
                    status === 'not_started'
                      ? 'bg-gray-500/20 border-gray-500'
                      : `${bgCard} ${borderColor}`
                  }`}
                >
                  <Circle size={18} color={status === 'not_started' ? '#6b7280' : '#64748b'} />
                  <Text className={`mt-1 text-xs font-semibold ${status === 'not_started' ? 'text-gray-500' : textMuted}`}>
                    Not Started
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setStatus('in_progress')}
                  disabled={!canEdit(userRole)}
                  className={`flex-1 py-3 rounded-xl items-center border ${
                    status === 'in_progress'
                      ? 'bg-amber-500/20 border-amber-500'
                      : `${bgCard} ${borderColor}`
                  }`}
                >
                  <Play size={18} color={status === 'in_progress' ? '#f59e0b' : '#64748b'} />
                  <Text className={`mt-1 text-xs font-semibold ${status === 'in_progress' ? 'text-amber-500' : textMuted}`}>
                    In Progress
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setStatus('done')}
                  disabled={!canEdit(userRole)}
                  className={`flex-1 py-3 rounded-xl items-center border ${
                    status === 'done'
                      ? 'bg-emerald-500/20 border-emerald-500'
                      : `${bgCard} ${borderColor}`
                  }`}
                >
                  <Check size={18} color={status === 'done' ? '#10b981' : '#64748b'} />
                  <Text className={`mt-1 text-xs font-semibold ${status === 'done' ? 'text-emerald-500' : textMuted}`}>
                    Complete
                  </Text>
                </Pressable>
              </View>

              {/* Owner Role Hint */}
              {selectedChecklistItem.ownerRoleHint && (
                <View className={`${bgCard} border ${borderColor} rounded-xl p-4 mb-4`}>
                  <View className="flex-row items-center mb-2">
                    <User size={16} color="#3b82f6" />
                    <Text className={`${textPrimary} font-semibold ml-2`}>Suggested Owner</Text>
                  </View>
                  <Text className={textSecondary}>{selectedChecklistItem.ownerRoleHint}</Text>
                </View>
              )}

              {/* External Links */}
              {selectedChecklistItem.links && selectedChecklistItem.links.length > 0 && (
                <View className="mb-4">
                  <Text className={`${textPrimary} font-semibold mb-3`}>Helpful Links</Text>
                  {selectedChecklistItem.links.map((link, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => Linking.openURL(link.url)}
                      className={`${bgCard} border ${borderColor} rounded-xl p-4 mb-2 flex-row items-center active:opacity-70`}
                    >
                      <ExternalLink size={16} color="#3b82f6" />
                      <Text className="text-blue-500 font-semibold ml-3 flex-1">{link.label}</Text>
                      <ChevronRight size={16} color="#64748b" />
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Related Templates */}
              {selectedChecklistItem.templateIds && selectedChecklistItem.templateIds.length > 0 && (
                <View className="mb-4">
                  <Text className={`${textPrimary} font-semibold mb-3`}>Related Templates</Text>
                  {selectedChecklistItem.templateIds.map((tplId, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => {
                        setSelectedChecklistItem(null);
                        router.push(`/startup-pack/template/${tplId}`);
                      }}
                      className={`${bgCard} border ${borderColor} rounded-xl p-4 mb-2 flex-row items-center active:opacity-70`}
                    >
                      <FileText size={16} color="#a855f7" />
                      <Text className="text-purple-500 font-semibold ml-3 flex-1">View Template</Text>
                      <ChevronRight size={16} color="#64748b" />
                    </Pressable>
                  ))}
                </View>
              )}
            </ScrollView>

            {/* Action Buttons */}
            {canEdit(userRole) && status !== 'done' && (
              <View className="px-5 pt-2">
                <Pressable
                  onPress={() => {
                    setStatus('done');
                    setSelectedChecklistItem(null);
                  }}
                  className="bg-emerald-500 rounded-xl py-4 flex-row items-center justify-center active:opacity-70"
                >
                  <Check size={20} color="#fff" />
                  <Text className="text-white font-bold ml-2">Mark as Complete</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View className={`flex-1 ${bgPrimary}`}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <LinearGradient
        colors={[section.color ?? '#3b82f6', isDark ? '#1e293b' : '#f1f5f9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ paddingHorizontal: 20, paddingTop: insets.top + 12, paddingBottom: 20 }}
      >
        <View className="flex-row items-center mb-4">
          <Pressable onPress={() => router.back()} className="mr-3">
            <ArrowLeft size={24} color="#fff" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-white/70 text-xs font-medium">STARTUP PACK</Text>
            <Text className="text-white text-xl font-bold">{section.title}</Text>
          </View>
        </View>
        <Text className="text-white/80 text-sm">{section.description}</Text>
      </LinearGradient>

      {/* Tabs */}
      {renderTabs()}

      {/* Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'guide' && renderGuideTab()}
        {activeTab === 'checklist' && renderChecklistTab()}
        {activeTab === 'templates' && renderTemplatesTab()}
      </ScrollView>

      {/* Checklist Item Detail Modal */}
      {renderChecklistModal()}
    </View>
  );
}
