/**
 * Seed Directory Screen
 *
 * Main interface for seeding the People Marketplace
 * - Network seed upload
 * - Event seed upload
 * - Stubs list with invite actions
 * - Stats dashboard
 * - Partner orgs
 */

import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import React, { useState, useCallback, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import {
  Users,
  Upload,
  Calendar,
  Building2,
  BarChart3,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserPlus,
  Filter,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  Mail,
  Linkedin,
  RefreshCw,
  FileText,
  GraduationCap,
  Briefcase,
  Star,
  Copy,
  ExternalLink,
} from 'lucide-react-native';
import { useTheme } from '@/lib/ThemeContext';
import { HapticPressable } from '@/components/HapticPressable';
import { lightImpact, mediumImpact } from '@/lib/haptics';
import { useCurrentWorkspace, useCurrentUser } from '@/lib/state/app-store';
import * as Clipboard from 'expo-clipboard';
import type {
  SeedUploadResult,
  SeedingStats,
  UniversalPerson,
  StaleInvite,
  PartnerOrg,
} from '@/lib/people/types';

type TabId = 'upload' | 'stubs' | 'invites' | 'partners' | 'stats';

// Helper to get tab icon with color
function getTabIcon(tabId: TabId, isActive: boolean, isDark: boolean) {
  const color = isActive ? 'white' : isDark ? '#94a3b8' : '#6b7280';
  switch (tabId) {
    case 'upload':
      return <Upload size={18} color={color} />;
    case 'stubs':
      return <Users size={18} color={color} />;
    case 'invites':
      return <Send size={18} color={color} />;
    case 'partners':
      return <Building2 size={18} color={color} />;
    case 'stats':
      return <BarChart3 size={18} color={color} />;
  }
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'upload', label: 'Upload' },
  { id: 'stubs', label: 'Stubs' },
  { id: 'invites', label: 'Invites' },
  { id: 'partners', label: 'Partners' },
  { id: 'stats', label: 'Stats' },
];

export default function SeedDirectoryScreen() {
  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';
  const insets = useSafeAreaInsets();
  const workspace = useCurrentWorkspace();
  const user = useCurrentUser();

  const [activeTab, setActiveTab] = useState<TabId>('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Theme colors
  const bgColor = isDark ? 'bg-slate-900' : isOffWhite ? 'bg-stone-50' : 'bg-white';
  const cardBg = isDark ? 'bg-slate-800' : isOffWhite ? 'bg-stone-100' : 'bg-gray-50';
  const textPrimary = isDark ? 'text-white' : isOffWhite ? 'text-stone-900' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-stone-500' : 'text-gray-500';
  const borderColor = isDark ? 'border-slate-700' : isOffWhite ? 'border-stone-200' : 'border-gray-200';

  const handleTabChange = (tab: TabId) => {
    lightImpact();
    setActiveTab(tab);
    setError(null);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Seed Directory',
          headerShown: true,
          headerStyle: { backgroundColor: isDark ? '#0f172a' : isOffWhite ? '#fafaf9' : '#ffffff' },
          headerTintColor: isDark ? '#ffffff' : '#000000',
        }}
      />

      <View className={`flex-1 ${bgColor}`}>
        {/* Tab Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className={`border-b ${borderColor}`}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          style={{ flexGrow: 0, maxHeight: 50 }}
        >
          {TABS.map((tab) => (
            <Pressable
              key={tab.id}
              onPress={() => handleTabChange(tab.id)}
              className={`flex-row items-center px-4 py-3 rounded-t-lg ${
                activeTab === tab.id
                  ? 'bg-blue-600'
                  : isDark
                  ? 'bg-slate-800'
                  : isOffWhite
                  ? 'bg-stone-200'
                  : 'bg-gray-100'
              }`}
            >
              {getTabIcon(tab.id, activeTab === tab.id, isDark)}
              <Text
                className={`ml-2 font-medium ${
                  activeTab === tab.id
                    ? 'text-white'
                    : isDark
                    ? 'text-slate-300'
                    : isOffWhite
                    ? 'text-stone-600'
                    : 'text-gray-600'
                }`}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Error Banner */}
        {error && (
          <View className="flex-row items-center bg-red-100 dark:bg-red-900/30 px-5 py-3">
            <AlertCircle size={18} color="#ef4444" />
            <Text className="text-red-600 dark:text-red-400 ml-2 flex-1">{error}</Text>
            <Pressable onPress={() => setError(null)}>
              <Text className="text-red-600 dark:text-red-400 font-medium">Dismiss</Text>
            </Pressable>
          </View>
        )}

        {/* Tab Content */}
        {activeTab === 'upload' && (
          <UploadTab
            workspaceId={workspace?.id || ''}
            userId={user?.id || ''}
            isDark={isDark}
            isOffWhite={isOffWhite}
            onError={setError}
          />
        )}
        {activeTab === 'stubs' && (
          <StubsTab
            workspaceId={workspace?.id || ''}
            userId={user?.id || ''}
            isDark={isDark}
            isOffWhite={isOffWhite}
            onError={setError}
          />
        )}
        {activeTab === 'invites' && (
          <InvitesTab
            workspaceId={workspace?.id || ''}
            userId={user?.id || ''}
            isDark={isDark}
            isOffWhite={isOffWhite}
            onError={setError}
          />
        )}
        {activeTab === 'partners' && (
          <PartnersTab
            workspaceId={workspace?.id || ''}
            userId={user?.id || ''}
            isDark={isDark}
            isOffWhite={isOffWhite}
            onError={setError}
          />
        )}
        {activeTab === 'stats' && (
          <StatsTab
            workspaceId={workspace?.id || ''}
            isDark={isDark}
            isOffWhite={isOffWhite}
            onError={setError}
          />
        )}
      </View>
    </>
  );
}

// ============================================================================
// UPLOAD TAB
// ============================================================================

function UploadTab({
  workspaceId,
  userId,
  isDark,
  isOffWhite,
  onError,
}: {
  workspaceId: string;
  userId: string;
  isDark: boolean;
  isOffWhite: boolean;
  onError: (err: string) => void;
}) {
  const [csvData, setCsvData] = useState('');
  const [sourceType, setSourceType] = useState<'network' | 'event'>('network');
  const [eventName, setEventName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<SeedUploadResult | null>(null);

  const cardBg = isDark ? 'bg-slate-800' : isOffWhite ? 'bg-stone-100' : 'bg-gray-50';
  const textPrimary = isDark ? 'text-white' : isOffWhite ? 'text-stone-900' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-stone-500' : 'text-gray-500';
  const inputBg = isDark ? 'bg-slate-700' : isOffWhite ? 'bg-stone-200' : 'bg-gray-100';

  const handleUpload = async () => {
    if (!csvData.trim()) {
      onError('Please paste CSV data');
      return;
    }

    setIsUploading(true);
    setResult(null);
    mediumImpact();

    try {
      const res = await fetch('/api/people/seed/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          user_id: userId,
          source_type: sourceType,
          source_name: sourceType === 'event' ? eventName : undefined,
          data: csvData,
          data_format: 'csv',
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      setResult(data.data);
      setCsvData('');
      setEventName('');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ScrollView className="flex-1 px-5 py-4">
      {/* Source Type Toggle */}
      <View className="flex-row gap-2 mb-4">
        {(['network', 'event'] as const).map((type) => (
          <Pressable
            key={type}
            onPress={() => {
              setSourceType(type);
              lightImpact();
            }}
            className={`flex-1 py-3 rounded-xl items-center ${
              sourceType === type
                ? 'bg-blue-600'
                : isDark
                ? 'bg-slate-800'
                : isOffWhite
                ? 'bg-stone-200'
                : 'bg-gray-100'
            }`}
          >
            {type === 'network' ? (
              <Users size={20} color={sourceType === type ? 'white' : '#6b7280'} />
            ) : (
              <Calendar size={20} color={sourceType === type ? 'white' : '#6b7280'} />
            )}
            <Text
              className={`mt-1 font-medium ${
                sourceType === type ? 'text-white' : textSecondary
              }`}
            >
              {type === 'network' ? 'Network Seed' : 'Event Seed'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Event Name (if event source) */}
      {sourceType === 'event' && (
        <View className="mb-4">
          <Text className={`${textSecondary} text-sm mb-1`}>Event Name</Text>
          <TextInput
            value={eventName}
            onChangeText={setEventName}
            placeholder="e.g., TechCrunch Disrupt 2026"
            placeholderTextColor={isDark ? '#64748b' : '#9ca3af'}
            className={`${inputBg} ${textPrimary} px-4 py-3 rounded-xl`}
          />
        </View>
      )}

      {/* CSV Input */}
      <View className={`${cardBg} rounded-2xl p-4 mb-4`}>
        <Text className={`${textPrimary} font-semibold mb-2`}>Paste CSV Data</Text>
        <Text className={`${textSecondary} text-sm mb-3`}>
          Format: name,linkedin_url,role_archetype,sector_tags,notes,email
        </Text>

        <TextInput
          value={csvData}
          onChangeText={setCsvData}
          placeholder={`name,linkedin_url,role_archetype,sector_tags,notes,email\nJohn Smith,https://linkedin.com/in/jsmith,fractional_cfo,fintech;saas,Met at conference,`}
          placeholderTextColor={isDark ? '#64748b' : '#9ca3af'}
          multiline
          numberOfLines={8}
          textAlignVertical="top"
          className={`${inputBg} ${textPrimary} px-4 py-3 rounded-xl min-h-[160px] font-mono text-sm`}
        />
      </View>

      {/* Upload Button */}
      <HapticPressable
        onPress={handleUpload}
        disabled={isUploading || !csvData.trim()}
        className={`flex-row items-center justify-center py-4 rounded-xl ${
          !csvData.trim() ? 'bg-gray-400' : 'bg-blue-600'
        }`}
      >
        {isUploading ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <>
            <Upload size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Upload Stubs</Text>
          </>
        )}
      </HapticPressable>

      {/* Result */}
      {result && (
        <Animated.View entering={FadeInDown} className={`${cardBg} rounded-2xl p-4 mt-4`}>
          <Text className={`${textPrimary} font-semibold text-lg mb-3`}>Upload Complete</Text>

          <View className="flex-row gap-4 mb-3">
            <View className="items-center">
              <Text className="text-green-500 text-2xl font-bold">{result.created}</Text>
              <Text className={textSecondary}>Created</Text>
            </View>
            <View className="items-center">
              <Text className="text-yellow-500 text-2xl font-bold">{result.duplicates}</Text>
              <Text className={textSecondary}>Duplicates</Text>
            </View>
            <View className="items-center">
              <Text className="text-red-500 text-2xl font-bold">{result.errors}</Text>
              <Text className={textSecondary}>Errors</Text>
            </View>
          </View>

          {result.duplicate_matches.length > 0 && (
            <View className="mt-2">
              <Text className={`${textSecondary} text-sm mb-1`}>Duplicates found:</Text>
              {result.duplicate_matches.slice(0, 5).map((dup, idx) => (
                <Text key={idx} className={`${textSecondary} text-xs`}>
                  • {dup.input_name} → matches "{dup.match_name}" ({dup.match_type})
                </Text>
              ))}
            </View>
          )}
        </Animated.View>
      )}

      {/* Help Text */}
      <View className={`${cardBg} rounded-2xl p-4 mt-4`}>
        <Text className={`${textPrimary} font-semibold mb-2`}>Role Archetype Reference</Text>
        <Text className={`${textSecondary} text-xs`}>
          fractional_ceo, fractional_coo, fractional_cfo, fractional_cto, fractional_cmo{'\n'}
          advisor_board, advisor_strategic, advisor_technical{'\n'}
          apprentice_finance, apprentice_ops, apprentice_engineering
        </Text>
      </View>
    </ScrollView>
  );
}

// ============================================================================
// STUBS TAB
// ============================================================================

function StubsTab({
  workspaceId,
  userId,
  isDark,
  isOffWhite,
  onError,
}: {
  workspaceId: string;
  userId: string;
  isDark: boolean;
  isOffWhite: boolean;
  onError: (err: string) => void;
}) {
  const [stubs, setStubs] = useState<UniversalPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isInviting, setIsInviting] = useState(false);

  const cardBg = isDark ? 'bg-slate-800' : isOffWhite ? 'bg-stone-100' : 'bg-gray-50';
  const textPrimary = isDark ? 'text-white' : isOffWhite ? 'text-stone-900' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-stone-500' : 'text-gray-500';

  const fetchStubs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/people/search?verification_status=stub&limit=100`);
      const data = await res.json();

      if (data.success) {
        setStubs(data.data || []);
      }
    } catch (err) {
      onError('Failed to load stubs');
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    fetchStubs();
  }, [fetchStubs]);

  const toggleSelect = (id: string) => {
    lightImpact();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBulkInvite = async () => {
    if (selectedIds.size === 0) return;

    setIsInviting(true);
    mediumImpact();

    try {
      const res = await fetch('/api/people/seed/bulk-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          user_id: userId,
          person_ids: Array.from(selectedIds),
          channel: 'linkedin',
          template_type: 'warm',
          create_tasks: true,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Bulk invite failed');
      }

      // Remove invited from list
      setStubs((prev) => prev.filter((s) => !selectedIds.has(s.id)));
      setSelectedIds(new Set());
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Bulk invite failed');
    } finally {
      setIsInviting(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <View className={`flex-row items-center justify-between px-5 py-3 ${cardBg}`}>
          <Text className={textPrimary}>{selectedIds.size} selected</Text>
          <HapticPressable
            onPress={handleBulkInvite}
            disabled={isInviting}
            className="flex-row items-center px-4 py-2 bg-blue-600 rounded-lg"
          >
            {isInviting ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Send size={16} color="white" />
                <Text className="text-white font-medium ml-1">Bulk Invite</Text>
              </>
            )}
          </HapticPressable>
        </View>
      )}

      <ScrollView className="flex-1 px-5 py-4">
        {stubs.length === 0 ? (
          <View className={`${cardBg} rounded-2xl p-8 items-center`}>
            <Users size={40} color={isDark ? '#64748b' : '#9ca3af'} />
            <Text className={`${textPrimary} font-semibold mt-3`}>No stubs yet</Text>
            <Text className={`${textSecondary} text-center mt-1`}>
              Upload CSV data to create stubs
            </Text>
          </View>
        ) : (
          <View className="gap-2">
            {stubs.map((stub, idx) => (
              <Animated.View key={stub.id} entering={FadeInRight.delay(idx * 30)}>
                <Pressable
                  onPress={() => toggleSelect(stub.id)}
                  className={`flex-row items-center p-3 rounded-xl ${
                    selectedIds.has(stub.id) ? 'bg-blue-600/20 border border-blue-600' : cardBg
                  }`}
                >
                  <View
                    className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                      selectedIds.has(stub.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-400'
                    }`}
                  >
                    {selectedIds.has(stub.id) && <CheckCircle2 size={14} color="white" />}
                  </View>

                  <View className="flex-1 ml-3">
                    <Text className={textPrimary}>{stub.display_name}</Text>
                    <View className="flex-row items-center mt-0.5">
                      {stub.role_archetypes?.[0] && (
                        <Text className={`${textSecondary} text-xs`}>
                          {stub.role_archetypes[0].replace(/_/g, ' ')}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View
                    className={`px-2 py-0.5 rounded-full ${
                      isDark ? 'bg-slate-700' : 'bg-gray-200'
                    }`}
                  >
                    <Text className={`${textSecondary} text-xs`}>stub</Text>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ============================================================================
// INVITES TAB
// ============================================================================

function InvitesTab({
  workspaceId,
  userId,
  isDark,
  isOffWhite,
  onError,
}: {
  workspaceId: string;
  userId: string;
  isDark: boolean;
  isOffWhite: boolean;
  onError: (err: string) => void;
}) {
  const [staleInvites, setStaleInvites] = useState<StaleInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const cardBg = isDark ? 'bg-slate-800' : isOffWhite ? 'bg-stone-100' : 'bg-gray-50';
  const textPrimary = isDark ? 'text-white' : isOffWhite ? 'text-stone-900' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-stone-500' : 'text-gray-500';

  useEffect(() => {
    const fetchStale = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/people/seed/bulk-invite?workspace_id=${workspaceId}&days_stale=7`
        );
        const data = await res.json();

        if (data.success) {
          setStaleInvites(data.data || []);
        }
      } catch (err) {
        onError('Failed to load stale invites');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStale();
  }, [workspaceId, onError]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 px-5 py-4">
      <Text className={`${textPrimary} font-semibold text-lg mb-3`}>
        Stale Invites (7+ days, no response)
      </Text>

      {staleInvites.length === 0 ? (
        <View className={`${cardBg} rounded-2xl p-8 items-center`}>
          <CheckCircle2 size={40} color="#10b981" />
          <Text className={`${textPrimary} font-semibold mt-3`}>All caught up!</Text>
          <Text className={`${textSecondary} text-center mt-1`}>
            No stale invites needing follow-up
          </Text>
        </View>
      ) : (
        <View className="gap-2">
          {staleInvites.map((invite, idx) => (
            <Animated.View
              key={invite.invite_id}
              entering={FadeInDown.delay(idx * 30)}
              className={`${cardBg} rounded-xl p-3`}
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <Text className={textPrimary}>{invite.person_name}</Text>
                  <Text className={`${textSecondary} text-sm`}>{invite.email}</Text>
                </View>
                <View className="items-end">
                  <View className="flex-row items-center">
                    <Clock size={14} color="#f59e0b" />
                    <Text className="text-yellow-500 text-sm ml-1">
                      {invite.days_since_invite}d ago
                    </Text>
                  </View>
                  <Text className={`${textSecondary} text-xs`}>
                    {invite.followup_count} follow-ups
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-2 mt-2">
                <HapticPressable
                  className={`flex-1 py-2 rounded-lg items-center ${
                    isDark ? 'bg-slate-700' : 'bg-gray-200'
                  }`}
                  onPress={() => {
                    // Create follow-up task
                    lightImpact();
                  }}
                >
                  <Text className={textSecondary}>Follow Up</Text>
                </HapticPressable>
              </View>
            </Animated.View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// ============================================================================
// PARTNERS TAB
// ============================================================================

function PartnersTab({
  workspaceId,
  userId,
  isDark,
  isOffWhite,
  onError,
}: {
  workspaceId: string;
  userId: string;
  isDark: boolean;
  isOffWhite: boolean;
  onError: (err: string) => void;
}) {
  const [partners, setPartners] = useState<PartnerOrg[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPartnerName, setNewPartnerName] = useState('');
  const [newPartnerType, setNewPartnerType] = useState<'university' | 'bootcamp' | 'provider'>('university');

  const cardBg = isDark ? 'bg-slate-800' : isOffWhite ? 'bg-stone-100' : 'bg-gray-50';
  const textPrimary = isDark ? 'text-white' : isOffWhite ? 'text-stone-900' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-stone-500' : 'text-gray-500';
  const inputBg = isDark ? 'bg-slate-700' : isOffWhite ? 'bg-stone-200' : 'bg-gray-100';

  const fetchPartners = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/people/partners?workspace_id=${workspaceId}`);
      const data = await res.json();

      if (data.success) {
        setPartners(data.data || []);
      }
    } catch (err) {
      onError('Failed to load partners');
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, onError]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const handleAddPartner = async () => {
    if (!newPartnerName.trim()) return;

    try {
      const res = await fetch('/api/people/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          user_id: userId,
          partner: {
            name: newPartnerName,
            org_type: newPartnerType,
          },
          create_outreach_tasks: true,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setPartners((prev) => [...data.data.partners, ...prev]);
        setNewPartnerName('');
        setShowAddForm(false);
      }
    } catch (err) {
      onError('Failed to add partner');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10b981';
      case 'contacted':
      case 'in_conversation':
        return '#3b82f6';
      case 'paused':
      case 'declined':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 px-5 py-4">
      {/* Add Partner */}
      {showAddForm ? (
        <View className={`${cardBg} rounded-2xl p-4 mb-4`}>
          <TextInput
            value={newPartnerName}
            onChangeText={setNewPartnerName}
            placeholder="Partner organization name"
            placeholderTextColor={isDark ? '#64748b' : '#9ca3af'}
            className={`${inputBg} ${textPrimary} px-4 py-3 rounded-xl mb-3`}
          />

          <View className="flex-row gap-2 mb-3">
            {(['university', 'bootcamp', 'provider'] as const).map((type) => (
              <Pressable
                key={type}
                onPress={() => {
                  setNewPartnerType(type);
                  lightImpact();
                }}
                className={`px-3 py-2 rounded-lg ${
                  newPartnerType === type
                    ? 'bg-blue-600'
                    : isDark
                    ? 'bg-slate-700'
                    : 'bg-gray-200'
                }`}
              >
                <Text className={newPartnerType === type ? 'text-white' : textSecondary}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setShowAddForm(false)}
              className={`flex-1 py-3 rounded-xl items-center ${
                isDark ? 'bg-slate-700' : 'bg-gray-200'
              }`}
            >
              <Text className={textSecondary}>Cancel</Text>
            </Pressable>
            <HapticPressable
              onPress={handleAddPartner}
              className="flex-1 py-3 rounded-xl items-center bg-blue-600"
            >
              <Text className="text-white font-medium">Add Partner</Text>
            </HapticPressable>
          </View>
        </View>
      ) : (
        <HapticPressable
          onPress={() => setShowAddForm(true)}
          className={`flex-row items-center justify-center py-3 rounded-xl mb-4 ${cardBg}`}
        >
          <Building2 size={20} color={isDark ? '#94a3b8' : '#6b7280'} />
          <Text className={`${textSecondary} font-medium ml-2`}>Add Partner Organization</Text>
        </HapticPressable>
      )}

      {/* Partners List */}
      {partners.length === 0 ? (
        <View className={`${cardBg} rounded-2xl p-8 items-center`}>
          <Building2 size={40} color={isDark ? '#64748b' : '#9ca3af'} />
          <Text className={`${textPrimary} font-semibold mt-3`}>No partners yet</Text>
          <Text className={`${textSecondary} text-center mt-1`}>
            Add universities, bootcamps, or providers
          </Text>
        </View>
      ) : (
        <View className="gap-2">
          {partners.map((partner, idx) => (
            <Animated.View
              key={partner.id}
              entering={FadeInDown.delay(idx * 30)}
              className={`${cardBg} rounded-xl p-3`}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className={textPrimary}>{partner.name}</Text>
                  <Text className={`${textSecondary} text-sm capitalize`}>
                    {partner.org_type} • {partner.region}
                  </Text>
                </View>
                <View
                  className="px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${getStatusColor(partner.status)}20` }}
                >
                  <Text
                    className="text-xs capitalize"
                    style={{ color: getStatusColor(partner.status) }}
                  >
                    {partner.status.replace('_', ' ')}
                  </Text>
                </View>
              </View>
            </Animated.View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// ============================================================================
// STATS TAB
// ============================================================================

function StatsTab({
  workspaceId,
  isDark,
  isOffWhite,
  onError,
}: {
  workspaceId: string;
  isDark: boolean;
  isOffWhite: boolean;
  onError: (err: string) => void;
}) {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const cardBg = isDark ? 'bg-slate-800' : isOffWhite ? 'bg-stone-100' : 'bg-gray-50';
  const textPrimary = isDark ? 'text-white' : isOffWhite ? 'text-stone-900' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-stone-500' : 'text-gray-500';

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/people/seed/stats?workspace_id=${workspaceId}`);
        const data = await res.json();

        if (data.success) {
          setStats(data.data);
        }
      } catch (err) {
        onError('Failed to load stats');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [workspaceId, onError]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!stats) {
    return (
      <View className={`flex-1 items-center justify-center ${cardBg} m-5 rounded-2xl`}>
        <Text className={textSecondary}>No stats available</Text>
      </View>
    );
  }

  const verificationTotal =
    (stats.verification_status?.stub || 0) +
    (stats.verification_status?.invited || 0) +
    (stats.verification_status?.opted_in || 0) +
    (stats.verification_status?.verified || 0);

  return (
    <ScrollView className="flex-1 px-5 py-4">
      {/* Verification Funnel */}
      <View className={`${cardBg} rounded-2xl p-4 mb-4`}>
        <Text className={`${textPrimary} font-semibold text-lg mb-3`}>Verification Funnel</Text>
        <View className="flex-row justify-between">
          {[
            { label: 'Stubs', value: stats.verification_status?.stub || 0, color: '#6b7280' },
            { label: 'Invited', value: stats.verification_status?.invited || 0, color: '#f59e0b' },
            { label: 'Opted In', value: stats.verification_status?.opted_in || 0, color: '#3b82f6' },
            { label: 'Verified', value: stats.verification_status?.verified || 0, color: '#10b981' },
          ].map((item) => (
            <View key={item.label} className="items-center">
              <Text className="text-2xl font-bold" style={{ color: item.color }}>
                {item.value}
              </Text>
              <Text className={textSecondary}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Conversion Rates */}
      <View className={`${cardBg} rounded-2xl p-4 mb-4`}>
        <Text className={`${textPrimary} font-semibold text-lg mb-3`}>Conversion Rates</Text>
        <View className="gap-2">
          {[
            { label: 'Stub → Invited', value: stats.conversion?.stub_to_invited || 0 },
            { label: 'Invited → Opted In', value: stats.conversion?.invited_to_optin || 0 },
            { label: 'Opted In → Verified', value: stats.conversion?.optin_to_verified || 0 },
            { label: 'Invite Response Rate', value: stats.conversion?.invite_response_rate || 0 },
          ].map((item) => (
            <View key={item.label} className="flex-row items-center justify-between">
              <Text className={textSecondary}>{item.label}</Text>
              <Text className={textPrimary}>{item.value}%</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Person Types */}
      <View className={`${cardBg} rounded-2xl p-4 mb-4`}>
        <Text className={`${textPrimary} font-semibold text-lg mb-3`}>By Person Type</Text>
        <View className="gap-2">
          {[
            {
              label: 'Fractional Execs',
              value: stats.person_type?.fractional_exec || 0,
              icon: <Briefcase size={16} color="#8b5cf6" />,
            },
            {
              label: 'Apprentices',
              value: stats.person_type?.apprentice || 0,
              icon: <GraduationCap size={16} color="#10b981" />,
            },
            {
              label: 'Advisors',
              value: stats.person_type?.advisor || 0,
              icon: <Star size={16} color="#f59e0b" />,
            },
          ].map((item) => (
            <View key={item.label} className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                {item.icon}
                <Text className={`${textSecondary} ml-2`}>{item.label}</Text>
              </View>
              <Text className={textPrimary}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Stale Alerts */}
      <View className={`${cardBg} rounded-2xl p-4 mb-4`}>
        <Text className={`${textPrimary} font-semibold text-lg mb-3`}>Attention Needed</Text>
        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Clock size={16} color="#f59e0b" />
              <Text className={`${textSecondary} ml-2`}>Stale invites (7+ days)</Text>
            </View>
            <Text className="text-yellow-500 font-medium">{stats.stale_invites_7d || 0}</Text>
          </View>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <AlertCircle size={16} color="#ef4444" />
              <Text className={`${textSecondary} ml-2`}>Stale invites (14+ days)</Text>
            </View>
            <Text className="text-red-500 font-medium">{stats.stale_invites_14d || 0}</Text>
          </View>
        </View>
      </View>

      {/* Top Sectors */}
      {stats.top_sectors && stats.top_sectors.length > 0 && (
        <View className={`${cardBg} rounded-2xl p-4 mb-4`}>
          <Text className={`${textPrimary} font-semibold text-lg mb-3`}>Top Sectors</Text>
          <View className="gap-1">
            {stats.top_sectors.slice(0, 5).map((sector: { sector: string; count: number }) => (
              <View key={sector.sector} className="flex-row items-center justify-between">
                <Text className={`${textSecondary} capitalize`}>
                  {sector.sector.replace(/_/g, ' ')}
                </Text>
                <Text className={textPrimary}>{sector.count}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}
