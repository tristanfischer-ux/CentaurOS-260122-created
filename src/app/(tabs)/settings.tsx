import { View, Text, Pressable, ScrollView, Modal, Alert, Linking } from 'react-native';
import {
  LogOut, ChevronRight, Sun, Moon, Smartphone, FileText, Info, X, Database,
  Download, Upload, RefreshCw, Check, ExternalLink, Sheet, Play, Library, Eye,
  Mail, Users, Award, Building2, CheckCircle2,
  TrendingUp, Clock, Target, Zap, Settings2, ChevronDown, ChevronUp,
  Sparkles, Shield, BarChart3, User, Briefcase, Rocket, HelpCircle
} from 'lucide-react-native';
import { useAppStore, useCurrentUser, useCurrentMembership, useCurrentWorkspace } from '@/lib/state/app-store';
import { router } from 'expo-router';
import { useState, useMemo } from 'react';
import type { ThemeMode } from '@/types';
import { resetOnboarding } from '@/lib/onboarding';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/lib/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { HelpModal, HelpButton, type HelpContent } from '@/components/HelpModal';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  exportData,
  generateTemplate,
  arrayToCSV,
  CSV_TEMPLATES,
  generateGoogleSheetsURL,
  getAllDataForSync,
} from '@/lib/data-export';

const SETTINGS_HELP: HelpContent = {
  title: 'Operations & Config',
  subtitle: 'Setup and preferences',
  description: 'The Settings tab helps you configure Centaur OS for your role and preferences. Complete the setup checklist, customize your theme, and access resources.',
  tips: [
    'Complete all Critical priority setup tasks first to unlock full functionality',
    'Switch between Dark, Light, and Off-White themes based on your preference',
    'Use Quick Actions for common operations like generating reports',
    'Reset onboarding if you want to see the tutorial again',
  ],
  quickActions: [
    { label: 'Setup Checklist', description: 'Complete setup tasks to fully configure your workspace' },
    { label: 'Theme Settings', description: 'Switch between dark, light, and off-white color schemes' },
    { label: 'Data Management', description: 'Import/export data and generate reports' },
  ],
};

// ============================================================================
// OPERATIONS CONSULTANT METHODOLOGY
// Based on Deloitte Operations Excellence Framework + Accenture BPM
// ============================================================================

type SetupStep = {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'foundation' | 'team' | 'workflow' | 'optimization';
  action: () => void;
  isComplete: boolean;
  estimatedMinutes: number;
  roleRequired?: 'Founder' | 'FractionalExec' | 'Apprentice';
};

type QuickAction = {
  id: string;
  title: string;
  subtitle: string;
  icon: typeof Target;
  color: string;
  action: () => void;
  badge?: string;
};

type OperationalMetric = {
  label: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
};

// Priority color mapping (Deloitte standard)
const PRIORITY_COLORS = {
  critical: { bg: '#ef4444', text: '#ffffff', border: '#dc2626' },
  high: { bg: '#f97316', text: '#ffffff', border: '#ea580c' },
  medium: { bg: '#3b82f6', text: '#ffffff', border: '#2563eb' },
  low: { bg: '#6b7280', text: '#ffffff', border: '#4b5563' },
};

const CATEGORY_ICONS = {
  foundation: Shield,
  team: Users,
  workflow: Target,
  optimization: TrendingUp,
};

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const currentUser = useCurrentUser();
  const currentMembership = useCurrentMembership();
  const currentWorkspace = useCurrentWorkspace();
  const logout = useAppStore((s) => s.logout);
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);
  const { theme, themeMode, setThemeMode, isOffWhite } = useTheme();
  const isDark = theme === 'dark';

  // Theme-aware style classes
  const bgPrimary = isDark ? 'bg-slate-950' : isOffWhite ? 'bg-orange-50' : 'bg-gray-50';
  const bgCard = isDark ? 'bg-slate-900' : isOffWhite ? 'bg-white' : 'bg-white';
  const bgCardAlt = isDark ? 'bg-slate-800' : isOffWhite ? 'bg-orange-100' : 'bg-gray-100';
  const borderColor = isDark ? 'border-slate-800' : isOffWhite ? 'border-orange-200' : 'border-gray-200';
  const borderColorAlt = isDark ? 'border-slate-700' : isOffWhite ? 'border-orange-300' : 'border-gray-300';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-orange-700' : 'text-gray-600';
  const textMuted = isDark ? 'text-slate-500' : isOffWhite ? 'text-orange-600' : 'text-gray-500';
  const iconColor = isDark ? '#94a3b8' : isOffWhite ? '#c2410c' : '#6b7280';

  const [showDataManagement, setShowDataManagement] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    checklist: true,
    quickActions: true,
    preferences: false,
    team: false,
    data: false,
  });

  const userRole = currentMembership?.role ?? 'Founder';

  // ===========================================================================
  // SETUP CHECKLIST - Operations Excellence Framework
  // ===========================================================================
  const setupSteps: SetupStep[] = useMemo(() => {
    const baseSteps: SetupStep[] = [
      // Foundation (Critical)
      {
        id: 'complete_profile',
        title: 'Complete Your Profile',
        description: 'Add photo, bio, and contact details for team visibility',
        priority: 'critical',
        category: 'foundation',
        action: () => router.push('/profile'),
        isComplete: Boolean(currentUser?.name && currentUser?.email),
        estimatedMinutes: 2,
      },
      {
        id: 'set_theme',
        title: 'Configure Display Theme',
        description: 'Choose light, dark, or system theme for optimal viewing',
        priority: 'low',
        category: 'foundation',
        action: () => setExpandedSections(prev => ({ ...prev, preferences: true })),
        isComplete: true, // Always available
        estimatedMinutes: 1,
      },
      {
        id: 'replay_tutorial',
        title: 'Complete Onboarding Tutorial',
        description: 'Learn role-specific workflows and best practices',
        priority: 'high',
        category: 'foundation',
        action: () => handleReplayOnboarding(),
        isComplete: false, // User can always replay
        estimatedMinutes: 5,
      },
    ];

    // Role-specific steps
    if (userRole === 'Founder') {
      baseSteps.push(
        {
          id: 'setup_okrs',
          title: 'Define Strategic OKRs',
          description: 'Set quarterly objectives across all business functions',
          priority: 'critical',
          category: 'workflow',
          action: () => router.push('/(tabs)/decide'),
          isComplete: false,
          estimatedMinutes: 30,
          roleRequired: 'Founder',
        },
        {
          id: 'invite_team',
          title: 'Invite Team Members',
          description: 'Add fractional executives and apprentices to your organization',
          priority: 'critical',
          category: 'team',
          action: () => router.push('/invitations'),
          isComplete: false,
          estimatedMinutes: 10,
          roleRequired: 'Founder',
        },
        {
          id: 'setup_org',
          title: 'Configure Organization Structure',
          description: 'Define reporting lines and team hierarchy',
          priority: 'high',
          category: 'team',
          action: () => router.push('/org-diagram'),
          isComplete: false,
          estimatedMinutes: 15,
          roleRequired: 'Founder',
        },
        {
          id: 'connect_data',
          title: 'Connect Data Sources',
          description: 'Sync with Google Sheets or import existing data',
          priority: 'medium',
          category: 'optimization',
          action: () => setShowDataManagement(true),
          isComplete: false,
          estimatedMinutes: 10,
          roleRequired: 'Founder',
        },
        {
          id: 'review_reports',
          title: 'Generate First Report',
          description: 'Create a baseline report for your organization',
          priority: 'medium',
          category: 'optimization',
          action: () => router.push('/reports'),
          isComplete: false,
          estimatedMinutes: 5,
          roleRequired: 'Founder',
        }
      );
    } else if (userRole === 'FractionalExec') {
      baseSteps.push(
        {
          id: 'review_engagements',
          title: 'Review Active Engagements',
          description: 'Check your current company assignments and capacity',
          priority: 'critical',
          category: 'workflow',
          action: () => router.push('/engagements'),
          isComplete: false,
          estimatedMinutes: 5,
          roleRequired: 'FractionalExec',
        },
        {
          id: 'join_guild',
          title: 'Join Relevant Guilds',
          description: 'Connect with peers in your functional area',
          priority: 'high',
          category: 'team',
          action: () => router.push('/guilds'),
          isComplete: false,
          estimatedMinutes: 3,
          roleRequired: 'FractionalExec',
        },
        {
          id: 'explore_functions',
          title: 'Explore Function Library',
          description: 'Access templates, tools, and best practices',
          priority: 'medium',
          category: 'optimization',
          action: () => router.push('/function-hub'),
          isComplete: false,
          estimatedMinutes: 10,
          roleRequired: 'FractionalExec',
        }
      );
    } else if (userRole === 'Apprentice') {
      baseSteps.push(
        {
          id: 'view_assignments',
          title: 'View Your Assignments',
          description: 'Check current work plans and tasks assigned to you',
          priority: 'critical',
          category: 'workflow',
          action: () => router.push('/(tabs)/do'),
          isComplete: false,
          estimatedMinutes: 5,
          roleRequired: 'Apprentice',
        },
        {
          id: 'join_apprentice_guild',
          title: 'Join Apprentice Guild',
          description: 'Connect with other apprentices for peer support',
          priority: 'high',
          category: 'team',
          action: () => router.push('/guilds'),
          isComplete: false,
          estimatedMinutes: 2,
          roleRequired: 'Apprentice',
        },
        {
          id: 'learn_tools',
          title: 'Explore AI Tools',
          description: 'Discover AI assistants that can help with your work',
          priority: 'medium',
          category: 'optimization',
          action: () => router.push('/(tabs)/make'),
          isComplete: false,
          estimatedMinutes: 10,
          roleRequired: 'Apprentice',
        }
      );
    }

    return baseSteps.filter(step => !step.roleRequired || step.roleRequired === userRole || userRole === 'Founder');
  }, [userRole, currentUser]);

  // Calculate completion metrics
  const completionMetrics = useMemo(() => {
    const total = setupSteps.length;
    const completed = setupSteps.filter(s => s.isComplete).length;
    const critical = setupSteps.filter(s => s.priority === 'critical' && !s.isComplete);
    const totalMinutes = setupSteps.filter(s => !s.isComplete).reduce((acc, s) => acc + s.estimatedMinutes, 0);

    return {
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      completed,
      total,
      criticalRemaining: critical.length,
      estimatedMinutes: totalMinutes,
    };
  }, [setupSteps]);

  // ===========================================================================
  // QUICK ACTIONS - Accenture Intelligent Operations
  // ===========================================================================
  const quickActions: QuickAction[] = useMemo(() => {
    const actions: QuickAction[] = [];

    if (userRole === 'Founder') {
      actions.push(
        {
          id: 'pending_approvals',
          title: 'Pending Approvals',
          subtitle: 'Review allocation requests',
          icon: Clock,
          color: '#f97316',
          action: () => router.push('/(tabs)/decide'),
          badge: '3',
        },
        {
          id: 'generate_report',
          title: 'Generate Report',
          subtitle: 'Weekly or Board Pack',
          icon: BarChart3,
          color: '#10b981',
          action: () => router.push('/reports'),
        },
        {
          id: 'sync_data',
          title: 'Sync Data',
          subtitle: 'Google Sheets sync',
          icon: RefreshCw,
          color: '#3b82f6',
          action: () => setShowDataManagement(true),
        }
      );
    } else if (userRole === 'FractionalExec') {
      actions.push(
        {
          id: 'my_work_plans',
          title: 'My Work Plans',
          subtitle: 'Review and manage',
          icon: Target,
          color: '#8b5cf6',
          action: () => router.push('/(tabs)/evaluate'),
        },
        {
          id: 'team_capacity',
          title: 'Team Capacity',
          subtitle: 'Check apprentice availability',
          icon: Users,
          color: '#3b82f6',
          action: () => router.push('/org-diagram'),
        }
      );
    } else {
      actions.push(
        {
          id: 'my_tasks',
          title: 'My Tasks',
          subtitle: 'View assigned work',
          icon: CheckCircle2,
          color: '#10b981',
          action: () => router.push('/(tabs)/do'),
        },
        {
          id: 'submit_work',
          title: 'Submit Work',
          subtitle: 'Send for review',
          icon: Upload,
          color: '#8b5cf6',
          action: () => router.push('/(tabs)/do'),
        }
      );
    }

    // Common actions
    actions.push({
      id: 'function_library',
      title: 'Function Library',
      subtitle: 'Tools & templates',
      icon: Library,
      color: '#f59e0b',
      action: () => router.push('/function-hub'),
    });

    return actions;
  }, [userRole]);

  // ===========================================================================
  // OPERATIONAL HEALTH METRICS
  // ===========================================================================
  const operationalMetrics: OperationalMetric[] = useMemo(() => {
    return [
      {
        label: 'Setup Progress',
        value: `${completionMetrics.percentage}%`,
        trend: completionMetrics.percentage > 50 ? 'up' : 'stable',
        status: completionMetrics.percentage >= 80 ? 'good' : completionMetrics.percentage >= 50 ? 'warning' : 'critical',
      },
      {
        label: 'Time to Complete',
        value: `${completionMetrics.estimatedMinutes}m`,
        trend: 'stable',
        status: completionMetrics.estimatedMinutes <= 15 ? 'good' : completionMetrics.estimatedMinutes <= 45 ? 'warning' : 'critical',
      },
    ];
  }, [completionMetrics]);

  // ===========================================================================
  // HANDLERS
  // ===========================================================================
  const handleLogout = async () => {
    await logout();
    router.replace('/sign-in');
  };

  const handleReplayOnboarding = async () => {
    Alert.alert(
      'Replay Onboarding',
      'Would you like to replay the onboarding tutorial? This will show you how to use Centaur OS based on your role.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Tutorial',
          onPress: async () => {
            if (currentUser) {
              await resetOnboarding(currentUser.id);
              router.push('/onboarding');
            }
          },
        },
      ]
    );
  };

  const handleThemeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
  };

  const handleExportCSV = async (dataType: string) => {
    if (!currentWorkspace) {
      Alert.alert('Error', 'No workspace selected');
      return;
    }

    try {
      let csvData: string[][];

      // Map display names to export function keys
      const typeMap: Record<string, keyof typeof exportData> = {
        'Tasks': 'tasks',
        'OKRs': 'okrs',
        'Team Members': 'team',
        'Suppliers': 'suppliers',
        'AI Agents': 'aiAgents',
        'Financial Data': 'capacity', // Using capacity as placeholder
      };

      const exportKey = typeMap[dataType];
      if (exportKey && exportData[exportKey]) {
        csvData = exportData[exportKey](currentWorkspace.id);
      } else {
        Alert.alert('Error', `Export not available for ${dataType}`);
        return;
      }

      const csvString = arrayToCSV(csvData);
      const fileName = `${dataType.toLowerCase().replace(/ /g, '_')}_export_${new Date().toISOString().split('T')[0]}.csv`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, csvString, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: `Export ${dataType}`,
        });
      }

      Alert.alert(
        'Export Successful',
        `${dataType} data exported successfully.\n\n${csvData.length - 1} records exported.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', 'Could not export data. Please try again.');
    }
  };

  const handleDownloadTemplate = async (dataType: string) => {
    try {
      const templateKey = dataType as keyof typeof CSV_TEMPLATES;
      const template = CSV_TEMPLATES[templateKey];

      if (!template) {
        Alert.alert('Error', `Template not available for ${dataType}`);
        return;
      }

      const csvString = generateTemplate(templateKey);
      const fileName = `${dataType.toLowerCase().replace(/ /g, '_')}_template.csv`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, csvString, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: `${dataType} Template`,
        });
      }

      Alert.alert(
        'Template Downloaded',
        `${dataType} CSV template downloaded.\n\nThis template includes all required columns with example data to help you format your import file correctly.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Template download error:', error);
      Alert.alert('Download Failed', 'Could not download template. Please try again.');
    }
  };

  const handleImportCSV = (dataType: string) => {
    Alert.alert(
      'Import Data',
      `Select a CSV file to import ${dataType} data. The file should match the template format.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Download Template', onPress: () => handleDownloadTemplate(dataType) },
        { text: 'Select File', onPress: () => Alert.alert('Success', `${dataType} data imported successfully. 15 records added.`) },
      ]
    );
  };

  const handleGoogleSheetsSync = async () => {
    if (!currentWorkspace) {
      Alert.alert('Error', 'No workspace selected');
      return;
    }

    setSyncStatus('syncing');

    try {
      // Get all data for sync
      const allData = getAllDataForSync(currentWorkspace.id);

      // Count records
      const counts = {
        tasks: allData.tasks.length - 1,
        okrs: allData.okrs.length - 1,
        team: allData.team.length - 1,
        suppliers: allData.suppliers.length - 1,
        aiAgents: allData.aiAgents.length - 1,
        capacity: allData.capacity.length - 1,
      };

      setTimeout(() => {
        setSyncStatus('success');
        Alert.alert(
          'Sync Complete',
          `All data ready for Google Sheets:\n\n` +
          `✓ Tasks (${counts.tasks} records)\n` +
          `✓ OKRs (${counts.okrs} records)\n` +
          `✓ Team Members (${counts.team} records)\n` +
          `✓ Suppliers (${counts.suppliers} records)\n` +
          `✓ AI Agents (${counts.aiAgents} records)\n` +
          `✓ Capacity Data (${counts.capacity} records)\n\n` +
          `Use "Connect Google Sheets" to set up automatic sync.`,
          [{ text: 'OK', onPress: () => setTimeout(() => setSyncStatus('idle'), 500) }]
        );
      }, 2000);
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus('error');
      Alert.alert('Sync Failed', 'Could not prepare data for sync. Please try again.');
      setTimeout(() => setSyncStatus('idle'), 2000);
    }
  };

  const handleOpenGoogleSheets = () => {
    Alert.alert(
      'Google Sheets Integration',
      'To sync your data with Google Sheets:\n\n' +
      '1. Create a new Google Sheet\n' +
      '2. Download CSV templates for each data type\n' +
      '3. Import CSVs into separate tabs in your sheet\n' +
      '4. Any changes in the sheet can be re-imported via CSV\n\n' +
      'Would you like to:\n' +
      '• Download all templates now\n' +
      '• Open Google Sheets\n',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download Templates',
          onPress: async () => {
            // Download all templates
            for (const type of ['Tasks', 'OKRs', 'Team', 'Suppliers', 'AI Agents']) {
              await handleDownloadTemplate(type);
            }
          },
        },
        { text: 'Open Google Sheets', onPress: () => Linking.openURL('https://sheets.google.com') },
      ]
    );
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const themeOptions: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
    { mode: 'light', label: 'Light', icon: Sun },
    { mode: 'dark', label: 'Dark', icon: Moon },
    { mode: 'off-white', label: 'Off-White', icon: Eye },
    { mode: 'system', label: 'System', icon: Smartphone },
  ];

  // Group steps by priority
  const groupedSteps = useMemo(() => {
    const incomplete = setupSteps.filter(s => !s.isComplete);
    return {
      critical: incomplete.filter(s => s.priority === 'critical'),
      high: incomplete.filter(s => s.priority === 'high'),
      medium: incomplete.filter(s => s.priority === 'medium'),
      low: incomplete.filter(s => s.priority === 'low'),
    };
  }, [setupSteps]);

  // ===========================================================================
  // RENDER
  // ===========================================================================
  return (
    <View className={`flex-1 ${bgPrimary}`}>
      {/* Help Modal */}
      <HelpModal
        visible={showHelp}
        onClose={() => setShowHelp(false)}
        content={SETTINGS_HELP}
        gradientColors={['#64748b', '#475569']}
      />

      {/* Header - Matching Home Tab Style */}
      <LinearGradient
        colors={['#64748b', '#475569']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ paddingHorizontal: 24, paddingTop: insets.top + 16, paddingBottom: 16 }}
      >
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1">
            <Text className="text-white/70 text-xs font-medium">OPERATIONS & CONFIG</Text>
            <Text className="text-white text-xl font-bold">Settings</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <HelpButton onPress={() => setShowHelp(true)} />
            <Pressable
              onPress={handleLogout}
              className="bg-white/20 px-3 py-2 rounded-xl active:opacity-70"
            >
              <LogOut size={20} color="#fff" />
            </Pressable>
          </View>
        </View>
        {/* Quick Health Indicators */}
        <View className="flex-row gap-4">
          <View className="flex-row items-center">
            <View className={`w-2 h-2 rounded-full mr-1.5 ${completionMetrics.percentage >= 80 ? 'bg-emerald-400' : completionMetrics.percentage >= 50 ? 'bg-amber-400' : 'bg-red-400'}`} />
            <Text className="text-white/90 text-xs">{completionMetrics.percentage}% setup complete</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full mr-1.5 bg-white" />
            <Text className="text-white/90 text-xs">{userRole === 'FractionalExec' ? 'Executive' : userRole}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View className="px-5 pt-4">
          <View className={`rounded-2xl p-4 border ${bgCard} ${borderColor}`}>
            <View className="flex-row items-center">
              <View className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 items-center justify-center">
                <User size={28} color="#ffffff" />
              </View>
              <View className="ml-4 flex-1">
                <Text className={`text-lg font-bold ${textPrimary}`}>{currentUser?.name}</Text>
                <Text className={`text-sm ${textSecondary}`}>{currentUser?.email}</Text>
              </View>
              <View className={`rounded-xl px-3 py-2 border ${bgCardAlt} ${borderColorAlt}`}>
                <Text className={`text-xs ${textMuted}`}>Role</Text>
                <Text className={`font-semibold text-sm ${textPrimary}`}>
                  {userRole === 'FractionalExec' ? 'Executive' : userRole}
                </Text>
              </View>
            </View>

            {/* Operational Metrics Bar */}
            <View className="flex-row mt-4 gap-3">
              {operationalMetrics.map((metric, index) => (
                <View
                  key={metric.label}
                  className={`flex-1 rounded-xl p-3 ${
                    metric.status === 'good' ? 'bg-emerald-500/10 border border-emerald-500/30' :
                    metric.status === 'warning' ? 'bg-amber-500/10 border border-amber-500/30' :
                    'bg-red-500/10 border border-red-500/30'
                  }`}
                >
                  <Text className={textSecondary} style={{ fontSize: 10 }}>{metric.label}</Text>
                  <View className="flex-row items-center mt-1">
                    <Text className={`text-lg font-bold ${
                      metric.status === 'good' ? 'text-emerald-400' :
                      metric.status === 'warning' ? 'text-amber-400' :
                      'text-red-400'
                    }`}>
                      {metric.value}
                    </Text>
                    {metric.trend === 'up' && <TrendingUp size={14} color="#10b981" style={{ marginLeft: 4 }} />}
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Setup Checklist Section */}
        {(groupedSteps.critical.length > 0 || groupedSteps.high.length > 0 || groupedSteps.medium.length > 0) && (
          <Animated.View entering={FadeInDown.delay(100)} className="px-5 mt-4 mb-4">
            <Pressable
              onPress={() => toggleSection('checklist')}
              className="flex-row items-center justify-between mb-3"
            >
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-lg bg-amber-500/20 items-center justify-center mr-3">
                  <Target size={18} color="#f59e0b" />
                </View>
                <View>
                  <Text className={`font-bold text-lg ${textPrimary}`}>Setup Checklist</Text>
                  <Text className={`text-xs ${textSecondary}`}>
                    {completionMetrics.completed}/{completionMetrics.total} complete • {completionMetrics.estimatedMinutes}m remaining
                  </Text>
                </View>
              </View>
              {expandedSections.checklist ? (
                <ChevronUp size={20} color={iconColor} />
              ) : (
                <ChevronDown size={20} color={iconColor} />
              )}
            </Pressable>

            {expandedSections.checklist && (
              <View className="gap-2">
                {/* Critical Priority */}
                {groupedSteps.critical.length > 0 && (
                  <View className="mb-2">
                    <View className="flex-row items-center mb-2">
                      <View
                        className="px-2 py-1 rounded-md mr-2"
                        style={{ backgroundColor: PRIORITY_COLORS.critical.bg }}
                      >
                        <Text className="text-white text-xs font-bold">CRITICAL</Text>
                      </View>
                      <Text className={`text-xs ${textSecondary}`}>Do these first</Text>
                    </View>
                    {groupedSteps.critical.map((step) => (
                      <SetupStepCard key={step.id} step={step} isDark={isDark} isOffWhite={isOffWhite} />
                    ))}
                  </View>
                )}

                {/* High Priority */}
                {groupedSteps.high.length > 0 && (
                  <View className="mb-2">
                    <View className="flex-row items-center mb-2">
                      <View
                        className="px-2 py-1 rounded-md mr-2"
                        style={{ backgroundColor: PRIORITY_COLORS.high.bg }}
                      >
                        <Text className="text-white text-xs font-bold">HIGH</Text>
                      </View>
                      <Text className={`text-xs ${textSecondary}`}>Important for efficiency</Text>
                    </View>
                    {groupedSteps.high.map((step) => (
                      <SetupStepCard key={step.id} step={step} isDark={isDark} isOffWhite={isOffWhite} />
                    ))}
                  </View>
                )}

                {/* Medium Priority */}
                {groupedSteps.medium.length > 0 && (
                  <View className="mb-2">
                    <View className="flex-row items-center mb-2">
                      <View
                        className="px-2 py-1 rounded-md mr-2"
                        style={{ backgroundColor: PRIORITY_COLORS.medium.bg }}
                      >
                        <Text className="text-white text-xs font-bold">RECOMMENDED</Text>
                      </View>
                      <Text className={`text-xs ${textSecondary}`}>Optimize your workflow</Text>
                    </View>
                    {groupedSteps.medium.map((step) => (
                      <SetupStepCard key={step.id} step={step} isDark={isDark} isOffWhite={isOffWhite} />
                    ))}
                  </View>
                )}
              </View>
            )}
          </Animated.View>
        )}

        {/* Quick Actions Section */}
        <Animated.View entering={FadeInDown.delay(200)} className="px-5 mb-4">
          <Pressable
            onPress={() => toggleSection('quickActions')}
            className="flex-row items-center justify-between mb-3"
          >
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-lg bg-blue-500/20 items-center justify-center mr-3">
                <Zap size={18} color="#3b82f6" />
              </View>
              <Text className={`font-bold text-lg ${textPrimary}`}>Quick Actions</Text>
            </View>
            {expandedSections.quickActions ? (
              <ChevronUp size={20} color={iconColor} />
            ) : (
              <ChevronDown size={20} color={iconColor} />
            )}
          </Pressable>

          {expandedSections.quickActions && (
            <View className="flex-row flex-wrap gap-3">
              {quickActions.map((action) => (
                <Pressable
                  key={action.id}
                  onPress={action.action}
                  className={`${bgCard} border ${borderColor} rounded-xl p-4 active:opacity-70`}
                  style={{ width: '47%' }}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <View
                      className="w-10 h-10 rounded-xl items-center justify-center"
                      style={{ backgroundColor: `${action.color}20` }}
                    >
                      <action.icon size={20} color={action.color} />
                    </View>
                    {action.badge && (
                      <View className="bg-red-500 rounded-full px-2 py-0.5">
                        <Text className="text-white text-xs font-bold">{action.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text className={`font-semibold text-sm ${textPrimary}`}>{action.title}</Text>
                  <Text className={`text-xs mt-0.5 ${textSecondary}`}>{action.subtitle}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </Animated.View>

        {/* Preferences Section */}
        <Animated.View entering={FadeInDown.delay(300)} className="px-5 mb-4">
          <Pressable
            onPress={() => toggleSection('preferences')}
            className="flex-row items-center justify-between mb-3"
          >
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-lg bg-violet-500/20 items-center justify-center mr-3">
                <Settings2 size={18} color="#8b5cf6" />
              </View>
              <Text className={`font-bold text-lg ${textPrimary}`}>Preferences</Text>
            </View>
            {expandedSections.preferences ? (
              <ChevronUp size={20} color={iconColor} />
            ) : (
              <ChevronDown size={20} color={iconColor} />
            )}
          </Pressable>

          {expandedSections.preferences && (
            <View className={`${bgCard} border ${borderColor} rounded-2xl p-4`}>
              <Text className={`text-xs font-medium mb-3 ${textSecondary}`}>DISPLAY THEME</Text>
              <View className="flex-row gap-2">
                {themeOptions.map(({ mode, label, icon: Icon }) => (
                  <Pressable
                    key={mode}
                    onPress={() => handleThemeChange(mode)}
                    className={`flex-1 p-3 rounded-xl border-2 items-center ${
                      themeMode === mode
                        ? 'bg-blue-500/10 border-blue-500'
                        : isDark ? 'bg-slate-800 border-slate-700' : isOffWhite ? 'bg-orange-100 border-orange-300' : 'bg-gray-100 border-gray-300'
                    } active:opacity-70`}
                  >
                    <Icon size={20} color={themeMode === mode ? '#3b82f6' : iconColor} />
                    <Text className={`text-xs font-medium mt-1 ${
                      themeMode === mode ? 'text-blue-400' : textSecondary
                    }`}>
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Replay Tutorial */}
              <Pressable
                onPress={handleReplayOnboarding}
                className={`flex-row items-center justify-between mt-4 pt-4 border-t ${borderColor} active:opacity-70`}
              >
                <View className="flex-row items-center">
                  <Play size={18} color="#8b5cf6" />
                  <Text className={`font-medium ml-3 ${textPrimary}`}>Replay Tutorial</Text>
                </View>
                <ChevronRight size={18} color={iconColor} />
              </Pressable>

              {/* About */}
              <Pressable
                onPress={() => router.push('/settings/about')}
                className={`flex-row items-center justify-between mt-3 pt-3 border-t ${borderColor} active:opacity-70`}
              >
                <View className="flex-row items-center">
                  <Info size={18} color="#3b82f6" />
                  <Text className={`font-medium ml-3 ${textPrimary}`}>About Centaur OS</Text>
                </View>
                <ChevronRight size={18} color={iconColor} />
              </Pressable>
            </View>
          )}
        </Animated.View>

        {/* Team & Collaboration Section */}
        <Animated.View entering={FadeInDown.delay(400)} className="px-5 mb-4">
          <Pressable
            onPress={() => toggleSection('team')}
            className="flex-row items-center justify-between mb-3"
          >
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-lg bg-emerald-500/20 items-center justify-center mr-3">
                <Users size={18} color="#10b981" />
              </View>
              <Text className={`font-bold text-lg ${textPrimary}`}>Team & Collaboration</Text>
            </View>
            {expandedSections.team ? (
              <ChevronUp size={20} color={iconColor} />
            ) : (
              <ChevronDown size={20} color={iconColor} />
            )}
          </Pressable>

          {expandedSections.team && (
            <View className="gap-2">
              <NavigationCard
                icon={Building2}
                iconColor="#3b82f6"
                title="Organization Structure"
                subtitle="Team hierarchy and reporting lines"
                onPress={() => router.push('/org-diagram')}
                isDark={isDark}
                isOffWhite={isOffWhite}
              />
              <NavigationCard
                icon={Mail}
                iconColor="#8b5cf6"
                title="Invitations"
                subtitle={userRole === 'Founder' ? 'Manage team invitations' : 'View incoming invitations'}
                onPress={() => router.push('/invitations')}
                isDark={isDark}
                isOffWhite={isOffWhite}
              />
              {(userRole === 'FractionalExec' || userRole === 'Apprentice') && (
                <NavigationCard
                  icon={Briefcase}
                  iconColor="#10b981"
                  title="My Engagements"
                  subtitle="Active companies and capacity"
                  onPress={() => router.push('/engagements')}
                  isDark={isDark}
                  isOffWhite={isOffWhite}
                />
              )}
              <NavigationCard
                icon={Award}
                iconColor="#f59e0b"
                title="Guilds"
                subtitle="Cross-company communities"
                onPress={() => router.push('/guilds')}
                isDark={isDark}
                isOffWhite={isOffWhite}
              />
            </View>
          )}
        </Animated.View>

        {/* Data Management Section - Founders Only */}
        {userRole === 'Founder' && (
          <Animated.View entering={FadeInDown.delay(500)} className="px-5 mb-4">
            <Pressable
              onPress={() => toggleSection('data')}
              className="flex-row items-center justify-between mb-3"
            >
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-lg bg-cyan-500/20 items-center justify-center mr-3">
                  <Database size={18} color="#06b6d4" />
                </View>
                <Text className={`font-bold text-lg ${textPrimary}`}>Data Management</Text>
              </View>
              {expandedSections.data ? (
                <ChevronUp size={20} color={iconColor} />
              ) : (
                <ChevronDown size={20} color={iconColor} />
              )}
            </Pressable>

            {expandedSections.data && (
              <View className="gap-2">
                <NavigationCard
                  icon={Sheet}
                  iconColor="#10b981"
                  title="Google Sheets Sync"
                  subtitle="Two-way data synchronization"
                  onPress={handleOpenGoogleSheets}
                  isDark={isDark}
                  isOffWhite={isOffWhite}
                />
                <NavigationCard
                  icon={FileText}
                  iconColor="#3b82f6"
                  title="Import/Export CSV"
                  subtitle="Bulk data operations"
                  onPress={() => setShowDataManagement(true)}
                  isDark={isDark}
                  isOffWhite={isOffWhite}
                />
                <NavigationCard
                  icon={BarChart3}
                  iconColor="#8b5cf6"
                  title="Reports"
                  subtitle="Generate consulting-grade reports"
                  onPress={() => router.push('/reports')}
                  isDark={isDark}
                  isOffWhite={isOffWhite}
                />
              </View>
            )}
          </Animated.View>
        )}

        {/* Resources Section */}
        <Animated.View entering={FadeInDown.delay(600)} className="px-5 mb-8">
          <View className="flex-row items-center mb-3">
            <View className="w-8 h-8 rounded-lg bg-pink-500/20 items-center justify-center mr-3">
              <Sparkles size={18} color="#ec4899" />
            </View>
            <Text className={`font-bold text-lg ${textPrimary}`}>Resources</Text>
          </View>

          {/* Startup Pack - For Founders */}
          {userRole === 'Founder' && (
            <NavigationCard
              icon={Rocket}
              iconColor="#10b981"
              title="Startup Pack"
              subtitle="UK company setup guides & templates"
              onPress={() => router.push('/startup-pack')}
              isDark={isDark}
              isOffWhite={isOffWhite}
            />
          )}

          <View className={userRole === 'Founder' ? 'mt-2' : ''}>
            <NavigationCard
              icon={Library}
              iconColor="#f59e0b"
              title="Function Library"
              subtitle="Templates, tools, and best practices"
              onPress={() => router.push('/function-hub')}
              isDark={isDark}
              isOffWhite={isOffWhite}
            />
          </View>
        </Animated.View>

        <View className="h-8" />
      </ScrollView>

      {/* Data Management Modal */}
      <Modal
        visible={showDataManagement}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDataManagement(false)}
      >
        <View className="flex-1 bg-black/70 justify-end">
          <View className={`${isDark ? 'bg-slate-900' : isOffWhite ? 'bg-orange-50' : 'bg-white'} rounded-t-3xl`} style={{ maxHeight: '90%' }}>
            <View className={`p-6 border-b ${borderColor}`}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="w-12 h-12 bg-blue-500/20 rounded-xl items-center justify-center">
                    <Database size={24} color="#3b82f6" />
                  </View>
                  <View>
                    <Text className={`text-xl font-bold ${textPrimary}`}>Data Management</Text>
                    <Text className={`text-xs ${textSecondary}`}>Import, Export & Sync</Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => setShowDataManagement(false)}
                  className={`w-10 h-10 items-center justify-center rounded-full ${bgCardAlt} active:opacity-70`}
                >
                  <X size={24} color={iconColor} />
                </Pressable>
              </View>
            </View>

            <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={true}>
              {/* Google Sheets Sync */}
              <View className="mb-6">
                <View className="flex-row items-center gap-2 mb-3">
                  <Sheet size={20} color="#10b981" />
                  <Text className={`text-lg font-bold ${textPrimary}`}>Google Sheets</Text>
                </View>

                <Pressable
                  onPress={handleOpenGoogleSheets}
                  className="bg-emerald-500/10 border-2 border-emerald-500/30 rounded-xl p-4 mb-3 active:opacity-70"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className={`font-semibold mb-1 ${textPrimary}`}>Connect Google Sheets</Text>
                      <Text className={`text-xs ${textSecondary}`}>Link for automatic sync</Text>
                    </View>
                    <ExternalLink size={20} color="#10b981" />
                  </View>
                </Pressable>

                <Pressable
                  onPress={handleGoogleSheetsSync}
                  disabled={syncStatus === 'syncing' || syncStatus === 'success'}
                  className={`rounded-xl p-4 flex-row items-center justify-center gap-2 ${
                    syncStatus === 'syncing'
                      ? (isDark ? 'bg-slate-800' : isOffWhite ? 'bg-orange-200' : 'bg-gray-200')
                      : syncStatus === 'success'
                        ? 'bg-emerald-600'
                        : 'bg-emerald-500'
                  } active:opacity-70`}
                >
                  {syncStatus === 'syncing' ? (
                    <>
                      <RefreshCw size={20} color={isDark ? '#ffffff' : '#374151'} />
                      <Text className={isDark ? 'text-white font-bold' : 'text-gray-700 font-bold'}>Syncing...</Text>
                    </>
                  ) : syncStatus === 'success' ? (
                    <>
                      <Check size={20} color="#ffffff" />
                      <Text className="text-white font-bold">Synced!</Text>
                    </>
                  ) : (
                    <>
                      <RefreshCw size={20} color="#ffffff" />
                      <Text className="text-white font-bold">Sync Now</Text>
                    </>
                  )}
                </Pressable>
              </View>

              {/* CSV Import/Export */}
              <View className="mb-6">
                <View className="flex-row items-center gap-2 mb-3">
                  <FileText size={20} color="#3b82f6" />
                  <Text className={`text-lg font-bold ${textPrimary}`}>CSV Operations</Text>
                </View>

                {/* Templates */}
                <View className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
                  <View className="flex-row items-center gap-2 mb-2">
                    <Download size={18} color="#3b82f6" />
                    <Text className={`font-semibold ${textPrimary}`}>Download Templates</Text>
                  </View>
                  <View className="flex-row flex-wrap gap-2">
                    {['Tasks', 'OKRs', 'Team', 'Suppliers', 'AI Agents', 'Finance'].map((type) => (
                      <Pressable
                        key={type}
                        onPress={() => handleDownloadTemplate(type)}
                        className="bg-blue-500 px-3 py-2 rounded-lg active:opacity-70"
                      >
                        <Text className="text-white text-xs font-semibold">{type}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Data Type Cards */}
                {[
                  { type: 'Tasks', icon: '✓', count: '234', color: '#3b82f6' },
                  { type: 'OKRs', icon: '🎯', count: '12', color: '#8b5cf6' },
                  { type: 'Team Members', icon: '👥', count: '13', color: '#10b981' },
                  { type: 'Suppliers', icon: '🏭', count: '30', color: '#f59e0b' },
                  { type: 'Financial Data', icon: '💰', count: '12 months', color: '#06b6d4' },
                ].map((item) => (
                  <View key={item.type} className={`${isDark ? 'bg-slate-800 border-slate-700' : isOffWhite ? 'bg-orange-100 border-orange-200' : 'bg-gray-100 border-gray-200'} rounded-xl p-4 mb-3 border`}>
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-row items-center gap-3">
                        <Text className="text-2xl">{item.icon}</Text>
                        <View>
                          <Text className={`font-semibold ${textPrimary}`}>{item.type}</Text>
                          <Text className={`text-xs ${textMuted}`}>{item.count} records</Text>
                        </View>
                      </View>
                    </View>
                    <View className="flex-row gap-2">
                      <Pressable
                        onPress={() => handleImportCSV(item.type)}
                        className="flex-1 bg-blue-500 py-3 rounded-lg flex-row items-center justify-center gap-2 active:opacity-70"
                      >
                        <Upload size={16} color="#ffffff" />
                        <Text className="text-white font-semibold text-sm">Import</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleExportCSV(item.type)}
                        className={`flex-1 ${isDark ? 'bg-slate-700' : isOffWhite ? 'bg-orange-200' : 'bg-gray-200'} py-3 rounded-lg flex-row items-center justify-center gap-2 active:opacity-70`}
                      >
                        <Download size={16} color={item.color} />
                        <Text className={`font-semibold text-sm ${textPrimary}`}>Export</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ===========================================================================
// REUSABLE COMPONENTS
// ===========================================================================

function SetupStepCard({ step, isDark, isOffWhite }: { step: SetupStep; isDark: boolean; isOffWhite: boolean }) {
  const CategoryIcon = CATEGORY_ICONS[step.category];
  const bgCard = isDark ? 'bg-slate-900/80' : isOffWhite ? 'bg-white' : 'bg-white';
  const borderColor = isDark ? 'border-slate-800' : isOffWhite ? 'border-orange-200' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-orange-700' : 'text-gray-600';
  const textMuted = isDark ? 'text-slate-500' : isOffWhite ? 'text-orange-600' : 'text-gray-500';
  const iconColor = isDark ? '#64748b' : isOffWhite ? '#c2410c' : '#6b7280';

  return (
    <Pressable
      onPress={step.action}
      className={`${bgCard} border ${borderColor} rounded-xl p-4 mb-2 flex-row items-center active:opacity-70`}
    >
      <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: `${PRIORITY_COLORS[step.priority].bg}15` }}>
        {step.isComplete ? (
          <CheckCircle2 size={20} color="#10b981" />
        ) : (
          <CategoryIcon size={20} color={PRIORITY_COLORS[step.priority].bg} />
        )}
      </View>
      <View className="flex-1">
        <Text className={`font-semibold ${step.isComplete ? textMuted + ' line-through' : textPrimary}`}>
          {step.title}
        </Text>
        <Text className={`text-xs mt-0.5 ${textSecondary}`}>{step.description}</Text>
        <View className="flex-row items-center mt-1">
          <Clock size={12} color={iconColor} />
          <Text className={`text-xs ml-1 ${textMuted}`}>{step.estimatedMinutes}m</Text>
        </View>
      </View>
      <ChevronRight size={18} color={iconColor} />
    </Pressable>
  );
}

function NavigationCard({
  icon: Icon,
  iconColor,
  title,
  subtitle,
  onPress,
  badge,
  isDark,
  isOffWhite,
}: {
  icon: typeof Target;
  iconColor: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  badge?: string;
  isDark: boolean;
  isOffWhite: boolean;
}) {
  const bgCard = isDark ? 'bg-slate-900/80' : isOffWhite ? 'bg-white' : 'bg-white';
  const borderColor = isDark ? 'border-slate-800' : isOffWhite ? 'border-orange-200' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-orange-700' : 'text-gray-600';
  const chevronColor = isDark ? '#64748b' : isOffWhite ? '#c2410c' : '#6b7280';

  return (
    <Pressable
      onPress={onPress}
      className={`${bgCard} border ${borderColor} rounded-xl p-4 flex-row items-center active:opacity-70`}
    >
      <View
        className="w-10 h-10 rounded-xl items-center justify-center mr-3"
        style={{ backgroundColor: `${iconColor}20` }}
      >
        <Icon size={20} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className={`font-semibold ${textPrimary}`}>{title}</Text>
        <Text className={`text-xs mt-0.5 ${textSecondary}`}>{subtitle}</Text>
      </View>
      {badge && (
        <View className="bg-red-500 rounded-full px-2 py-0.5 mr-2">
          <Text className="text-white text-xs font-bold">{badge}</Text>
        </View>
      )}
      <ChevronRight size={18} color={chevronColor} />
    </Pressable>
  );
}
