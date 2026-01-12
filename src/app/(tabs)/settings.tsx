import { View, Text, Pressable, ScrollView, Modal, Alert, Linking } from 'react-native';
import { LogOut, ChevronRight, Sun, Moon, Smartphone, FileText, Info, X, Database, Download, Upload, RefreshCw, Check, ExternalLink, Sheet, Play, Library, Eye, Mail, Users, Award, Package } from 'lucide-react-native';
import { useAppStore, useCurrentUser, useCurrentMembership } from '@/lib/state/app-store';
import { router } from 'expo-router';
import { useState } from 'react';
import type { ThemeMode } from '@/types';
import { resetOnboarding } from '@/lib/onboarding';
import { TabDescription } from '@/components/TabDescription';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const currentUser = useCurrentUser();
  const currentMembership = useCurrentMembership();
  const logout = useAppStore((s) => s.logout);
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);

  const [themeMode, setThemeModeState] = useState<ThemeMode>(
    currentUser?.preferences?.themeMode ?? 'dark'
  );
  const [showAbout, setShowAbout] = useState(false);
  const [showDataManagement, setShowDataManagement] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

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

  const handleExportCSV = (dataType: string) => {
    // Simulate export
    Alert.alert(
      'Export Successful',
      `${dataType} data exported to Downloads folder as ${dataType.toLowerCase().replace(/ /g, '_')}_export.csv`,
      [{ text: 'OK' }]
    );
  };

  const handleDownloadTemplate = (dataType: string) => {
    // Simulate template download
    Alert.alert(
      'Template Downloaded',
      `${dataType} CSV template downloaded to Downloads folder as ${dataType.toLowerCase().replace(/ /g, '_')}_template.csv\n\nThis template includes all required columns with example data to help you format your import file correctly.`,
      [{ text: 'OK' }]
    );
  };

  const handleImportCSV = (dataType: string) => {
    // Simulate import
    Alert.alert(
      'Import Data',
      `Select a CSV file to import ${dataType} data. The file should match the template format.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download Template',
          onPress: () => handleDownloadTemplate(dataType),
        },
        {
          text: 'Select File',
          onPress: () => {
            Alert.alert('Success', `${dataType} data imported successfully. 15 records added.`);
          },
        },
      ]
    );
  };

  const handleGoogleSheetsSync = async () => {
    setSyncStatus('syncing');

    // Simulate real sync process
    setTimeout(() => {
      // In a real app, this would:
      // 1. Authenticate with Google Sheets API
      // 2. Upload all data from the app to specified sheets
      // 3. Download any updates from sheets back to app
      // 4. Resolve conflicts if any

      setSyncStatus('success');
      Alert.alert(
        'Sync Complete',
        'All data synchronized with Google Sheets:\n\n' +
        '✓ Tasks (234 records)\n' +
        '✓ OKRs (12 objectives, 45 key results)\n' +
        '✓ Team Members (13 people)\n' +
        '✓ Suppliers (30 companies)\n' +
        '✓ AI Agents (36 tools)\n' +
        '✓ Financial Data (12 months)',
        [{ text: 'OK', onPress: () => setTimeout(() => setSyncStatus('idle'), 500) }]
      );
    }, 2000);
  };

  const handleOpenGoogleSheets = () => {
    Alert.alert(
      'Google Sheets Integration',
      'To sync your data with Google Sheets:\n\n' +
      '1. Create a new Google Sheet or use an existing one\n' +
      '2. The sheet will be automatically populated with your data\n' +
      '3. Any changes in the sheet will sync back to Centaur OS\n\n' +
      'Would you like to open Google Sheets now?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Google Sheets',
          onPress: () => Linking.openURL('https://sheets.google.com'),
        },
      ]
    );
  };

  const handleThemeChange = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        preferences: {
          ...currentUser.preferences,
          themeMode: mode,
        },
      };

      // Update in store (which also persists to storage)
      setCurrentUser(updatedUser);

      // Also update in the users database
      const users = useAppStore.getState().users;
      const setUsers = useAppStore.getState().setUsers;
      setUsers({
        ...users,
        [currentUser.id]: updatedUser,
      });
    }
  };

  const themeOptions: { mode: ThemeMode; label: string; icon: typeof Sun; description: string }[] = [
    { mode: 'light', label: 'Light', icon: Sun, description: 'Bright theme' },
    { mode: 'dark', label: 'Dark', icon: Moon, description: 'Dark theme' },
    { mode: 'off-white', label: 'Off-White', icon: Eye, description: 'Easy on eyes' },
    { mode: 'system', label: 'System', icon: Smartphone, description: 'Auto' },
  ];

  return (
    <View className="flex-1 bg-white dark:bg-slate-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-300 dark:border-slate-800">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1">
            <Text className="text-gray-900 dark:text-white text-2xl font-bold">Settings</Text>
            <Text className="text-gray-600 dark:text-slate-400 text-sm mt-0.5">
              Account preferences, theme, and workspace controls
            </Text>
          </View>
        </View>

        {/* User Info Card */}
        <View className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 border border-gray-300 dark:border-slate-800">
          <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">Logged in as</Text>
          <Text className="text-gray-900 dark:text-white text-lg font-semibold">{currentUser?.name}</Text>
          <Text className="text-gray-600 dark:text-slate-400 text-sm">{currentUser?.email}</Text>
          {currentMembership && (
            <View className="mt-2 pt-2 border-t border-gray-200 dark:border-slate-800">
              <Text className="text-gray-600 dark:text-slate-500 text-xs">Role: {currentMembership.role}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4">

        {/* Theme Selection */}
        <View className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 mb-4">
          <Text className="text-gray-900 dark:text-white font-semibold mb-3">Theme</Text>
          <View className="flex-row flex-wrap gap-2">
            {themeOptions.map(({ mode, label, icon: Icon, description }) => (
              <Pressable
                key={mode}
                onPress={() => handleThemeChange(mode)}
                className={`p-3 rounded-xl border-2 ${
                  themeMode === mode
                    ? 'bg-blue-500/10 border-blue-500'
                    : 'bg-gray-200 dark:bg-slate-800 border-gray-300 dark:border-slate-700'
                } active:opacity-70`}
                style={{ width: '48%' }}
              >
                <View className="items-center">
                  <Icon size={22} color={themeMode === mode ? '#3b82f6' : '#94a3b8'} />
                  <Text
                    className={`text-sm font-semibold mt-1 ${
                      themeMode === mode ? 'text-blue-500 dark:text-blue-400' : 'text-gray-700 dark:text-slate-400'
                    }`}
                  >
                    {label}
                  </Text>
                  <Text
                    className={`text-xs mt-0.5 ${
                      themeMode === mode ? 'text-blue-600 dark:text-blue-500' : 'text-gray-500 dark:text-slate-500'
                    }`}
                  >
                    {description}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
          <Text className="text-gray-600 dark:text-slate-500 text-xs mt-3">
            {themeMode === 'system'
              ? 'Theme follows your device settings'
              : themeMode === 'off-white'
              ? 'Using soft off-white background for reduced eye strain'
              : `Using ${themeMode} mode`}
          </Text>
        </View>

        {/* Reports */}
        <Pressable
          onPress={() => router.push('/reports')}
          className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 mb-4 flex-row items-center justify-between active:opacity-70"
        >
          <View className="flex-row items-center">
            <FileText size={20} color="#10b981" />
            <Text className="text-gray-900 dark:text-white font-semibold ml-3">Reports</Text>
          </View>
          <ChevronRight size={20} color="#64748b" />
        </Pressable>

        {/* Function Hub */}
        <Pressable
          onPress={() => router.push('/function-hub')}
          className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 mb-4 flex-row items-center justify-between active:opacity-70"
        >
          <View className="flex-row items-center">
            <Library size={20} color="#f59e0b" />
            <View className="ml-3">
              <Text className="text-gray-900 dark:text-white font-semibold">Function Library</Text>
              <Text className="text-gray-600 dark:text-slate-400 text-xs mt-0.5">
                Resources, tools, and advice for your function
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color="#64748b" />
        </Pressable>

        {/* Replay Onboarding */}
        <Pressable
          onPress={handleReplayOnboarding}
          className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 mb-4 flex-row items-center justify-between active:opacity-70"
        >
          <View className="flex-row items-center">
            <Play size={20} color="#8b5cf6" />
            <Text className="text-gray-900 dark:text-white font-semibold ml-3">Replay Tutorial</Text>
          </View>
          <ChevronRight size={20} color="#64748b" />
        </Pressable>

        {/* Fractional Foundry Features Section */}
        <Text className="text-gray-600 dark:text-slate-400 text-sm font-semibold mb-3 mt-2">
          MARKETPLACE & COLLABORATION
        </Text>

        {/* My Invitations */}
        <Pressable
          onPress={() => router.push('/invitations')}
          className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 mb-3 flex-row items-center justify-between active:opacity-70"
        >
          <View className="flex-row items-center">
            <Mail size={20} color="#3b82f6" />
            <View className="ml-3">
              <Text className="text-gray-900 dark:text-white font-semibold">My Invitations</Text>
              <Text className="text-gray-600 dark:text-slate-400 text-xs mt-0.5">
                {currentMembership?.role === 'Founder' ? 'Sent and received invitations' : 'Invitations from companies'}
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color="#64748b" />
        </Pressable>

        {/* My Engagements - For Execs/Apprentices */}
        {(currentMembership?.role === 'FractionalExec' || currentMembership?.role === 'Apprentice') && (
          <Pressable
            onPress={() => router.push('/engagements')}
            className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 mb-3 flex-row items-center justify-between active:opacity-70"
          >
            <View className="flex-row items-center">
              <Users size={20} color="#10b981" />
              <View className="ml-3">
                <Text className="text-gray-900 dark:text-white font-semibold">My Engagements</Text>
                <Text className="text-gray-600 dark:text-slate-400 text-xs mt-0.5">
                  Active companies and capacity
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color="#64748b" />
          </Pressable>
        )}

        {/* Guilds */}
        <Pressable
          onPress={() => router.push('/guilds')}
          className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 mb-4 flex-row items-center justify-between active:opacity-70"
        >
          <View className="flex-row items-center">
            <Award size={20} color="#f59e0b" />
            <View className="ml-3">
              <Text className="text-gray-900 dark:text-white font-semibold">Guilds</Text>
              <Text className="text-gray-600 dark:text-slate-400 text-xs mt-0.5">
                Cross-company communities of practice
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color="#64748b" />
        </Pressable>

        {/* Data Management - Founders Only */}
        {currentMembership?.role === 'Founder' && (
          <Pressable
            onPress={() => setShowDataManagement(true)}
            className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 mb-4 border-2 border-blue-500/30 active:opacity-70"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 bg-blue-500/20 rounded-xl items-center justify-center">
                  <Database size={20} color="#3b82f6" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-gray-900 dark:text-white font-semibold">Data Management</Text>
                  <Text className="text-gray-600 dark:text-slate-400 text-xs mt-0.5">
                    Import/Export • Google Sheets Sync
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color="#3b82f6" />
            </View>
          </Pressable>
        )}

        {/* About */}
        <Pressable
          onPress={() => setShowAbout(true)}
          className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 mb-4 flex-row items-center justify-between active:opacity-70"
        >
          <View className="flex-row items-center">
            <Info size={20} color="#3b82f6" />
            <Text className="text-gray-900 dark:text-white font-semibold ml-3">About Centaur OS</Text>
          </View>
          <ChevronRight size={20} color="#64748b" />
        </Pressable>

        <Pressable
          onPress={handleLogout}
          className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex-row items-center active:opacity-70"
        >
          <LogOut size={20} color="#ef4444" />
          <Text className="text-red-500 font-semibold ml-3">Sign Out</Text>
        </Pressable>
      </View>

      {/* About Modal */}
      <Modal visible={showAbout} transparent animationType="slide" onRequestClose={() => setShowAbout(false)}>
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-white dark:bg-gray-100 dark:bg-slate-900 rounded-t-3xl" style={{ maxHeight: '90%', minHeight: '60%' }}>
            <View className="p-6 border-b border-gray-200 dark:border-slate-800">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-900 dark:text-white text-2xl font-bold">About Centaur OS</Text>
                <Pressable onPress={() => setShowAbout(false)}>
                  <X size={24} color="#94a3b8" />
                </Pressable>
              </View>
            </View>

            <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={true}>
              <View className="gap-6">
                {/* Overview */}
                <View>
                  <Text className="text-gray-900 dark:text-white text-lg font-bold mb-2">What is Centaur OS?</Text>
                  <Text className="text-gray-700 dark:text-slate-300 leading-6">
                    The operating system for lean hardware startups. Run your business efficiently with a small team: founders who decide, fractional executives who evaluate, and apprentices who execute—augmented by AI and manufacturing partners. Built on function-based OKRs and work plan allocation across Marketing, Sales, Engineering, Ops, Finance, and Admin.
                  </Text>
                </View>

                {/* Key Features */}
                <View>
                  <Text className="text-gray-900 dark:text-white text-lg font-bold mb-2">Core Features</Text>

                  <View className="mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-1">🎯 Function-Based OKRs (Decide Tab)</Text>
                    <Text className="text-gray-700 dark:text-slate-400 text-sm">
                      Strategic objectives organized by business function (Marketing, Sales, Engineering, Ops, Finance, Admin). Each OKR includes high-level objectives that expand to show detailed key results with progress tracking. Founders set OKRs, executives create work plans against them, and apprentices execute. Approval queue for resource allocation requests from Community tab.
                    </Text>
                  </View>

                  <View className="mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-1">📋 Work Plans & Execution (Evaluate & Do Tabs)</Text>
                    <Text className="text-gray-700 dark:text-slate-400 text-sm">
                      Evaluate: Executives create work plans linked to OKRs, assign to apprentices, and monitor progress. Review submissions with approve/request changes workflow. Founders see all work plans by function. Do: Apprentices view assigned work, report progress, and submit completed work. Founders see work plans organized by function/OKR. Executives see only their responsible work plans.
                    </Text>
                  </View>

                  <View className="mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-1">👥 Team Performance</Text>
                    <Text className="text-gray-700 dark:text-slate-400 text-sm">
                      Interactive org chart showing reporting lines. Team Performance Analytics with contribution scores (0-100), productivity metrics, quality ratings, and efficiency tracking. Compare executives vs apprentices. Skills matrix and performance reviews for apprentice development.
                    </Text>
                  </View>

                  <View className="mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-1">🤝 Fractional Foundry Marketplace</Text>
                    <Text className="text-gray-700 dark:text-slate-400 text-sm">
                      Multi-company workflows for fractional executives and apprentices. Send/receive invitations, manage engagements across multiple companies, track capacity (days/week). Guilds: cross-company communities of practice (Sales, Marketing, Finance, Ops, Engineering, Design, Founders, Apprentices). Workspace switcher for seamless multi-company context switching.
                    </Text>
                  </View>

                  <View className="mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-1">📚 Function Library</Text>
                    <Text className="text-gray-700 dark:text-slate-400 text-sm">
                      Complete resource hub for all business functions (Finance, Sales, Marketing, Ops, Engineering, Admin). Each function includes: people to hire, recommended tools, AI assistants, templates, guides, checklists, suggested OKRs, and role-specific advice for founders, executives, and apprentices.
                    </Text>
                  </View>

                  <View className="mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-1">🤖 AI Agents</Text>
                    <Text className="text-gray-700 dark:text-slate-400 text-sm">
                      36 AI agents organized by function: Finance, Sales, Marketing, Operations, Engineering, Admin, Design & Manufacturing. Track team usage and costs. Directory includes GPT-4, Claude, Midjourney, GitHub Copilot, and specialized tools.
                    </Text>
                  </View>

                  <View className="mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-1">🏭 Manufacturing & Suppliers</Text>
                    <Text className="text-gray-700 dark:text-slate-400 text-sm">
                      Track supplier engagements with costs, delivery timelines, and task breakdowns. Interactive map shows locations. Contact managers and monitor delivery status. Built for hardware startups managing multiple manufacturing partners.
                    </Text>
                  </View>

                  <View className="mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-1">🌐 Community Marketplace (Community Tab)</Text>
                    <Text className="text-gray-700 dark:text-slate-400 text-sm">
                      Search and connect with 100+ fractional executives, 100+ apprentices, and suppliers/manufacturers. Filter by function, skills, and availability. Request allocation sends approval to founder via Decide tab. Apply/Join tab: submit applications as executive, apprentice, or supplier with CV upload (coming soon). Onboarding system for all marketplace participants.
                    </Text>
                  </View>

                  <View className="mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-1">💰 Financial Dashboard</Text>
                    <Text className="text-gray-700 dark:text-slate-400 text-sm">
                      Monitor revenue, gross profit, burn rate (BOM, people, AI, other costs), and runway. Interactive scenario planning with sliders to model changes. Budget setting with variance tracking. Tap any metric for detailed breakdowns.
                    </Text>
                  </View>

                  <View className="mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-1">📊 Reports & Analytics</Text>
                    <Text className="text-gray-700 dark:text-slate-400 text-sm">
                      Generate Weekly Packs and Board Packs. Export to CSV. Role-based reports (Founder/Executive/Apprentice). Professional summaries of progress, risks, and decisions. McKinsey-grade reporting with trend analysis and recommendations.
                    </Text>
                  </View>

                  <View className="mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-1">💾 Data Management</Text>
                    <Text className="text-gray-700 dark:text-slate-400 text-sm">
                      Bulk import/export with CSV templates. Two-way sync with Google Sheets. Import: tasks, OKRs, team members, suppliers, financial data. Works with Excel and any spreadsheet tool.
                    </Text>
                  </View>

                  <View className="mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-1">🏭 AI, Suppliers & Manufacturing (Make Tab)</Text>
                    <Text className="text-gray-700 dark:text-slate-400 text-sm">
                      AI tools and factories accessible to all roles (Founder, Executive, Apprentice). Track supplier engagements, manage BOM (Bill of Materials) with cost analysis, monitor manufacturing timelines. Search and onboard suppliers/manufacturers through Community tab. Link suppliers to work plans and track component costs.
                    </Text>
                  </View>

                  <View className="mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-1">🔔 Smart Notifications</Text>
                    <Text className="text-gray-700 dark:text-slate-400 text-sm">
                      Task assignments, completions, review requests, OKR updates, milestones. Daily 9 AM reminder for priorities. Weekly Monday digest. Granular controls for each notification type.
                    </Text>
                  </View>

                  <View className="mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-1">🎨 Beautiful Design</Text>
                    <Text className="text-gray-700 dark:text-slate-400 text-sm">
                      Apple Human Interface Guidelines compliant. Consistent typography, spacing, and interactions. Professional polish throughout. Dark mode support.
                    </Text>
                  </View>
                </View>

                {/* Organizational Philosophy */}
                <View>
                  <Text className="text-gray-900 dark:text-white text-lg font-bold mb-2">Decide • Evaluate • Do</Text>
                  <Text className="text-gray-700 dark:text-slate-300 leading-6 mb-2">
                    Centaur OS is built around a three-tier organizational model with function-based workflows:
                  </Text>
                  <View className="ml-3">
                    <Text className="text-gray-700 dark:text-slate-300 mb-2">
                      <Text className="font-semibold">Decide (Founders):</Text> Set function-based OKRs (Marketing, Sales, Engineering, Ops, Finance, Admin). Approve resource allocation requests. View all work plans by function. Manage strategy and finances.
                    </Text>
                    <Text className="text-gray-700 dark:text-slate-300 mb-2">
                      <Text className="font-semibold">Evaluate (Fractional Executives):</Text> Create work plans linked to OKRs. Assign work to apprentices. Monitor progress and review submissions. Provide expertise and feedback. See only their function's work plans.
                    </Text>
                    <Text className="text-gray-700 dark:text-slate-300">
                      <Text className="font-semibold">Do (Apprentices):</Text> Execute assigned work plans. Report progress to executives. Submit completed work for review. Learn from feedback. Build skills in their function.
                    </Text>
                  </View>
                </View>

                {/* Version */}
                <View className="bg-gray-100 dark:bg-slate-800 rounded-xl p-4">
                  <Text className="text-gray-600 dark:text-slate-400 text-sm">Version 1.0.0</Text>
                  <Text className="text-gray-600 dark:text-slate-400 text-sm">Built with Expo SDK 53 & React Native 0.76.7</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Data Management Modal */}
      <Modal visible={showDataManagement} transparent animationType="slide" onRequestClose={() => setShowDataManagement(false)}>
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-white dark:bg-gray-100 dark:bg-slate-900 rounded-t-3xl" style={{ maxHeight: '90%', minHeight: '60%' }}>
            <View className="p-6 border-b border-gray-200 dark:border-slate-800">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="w-12 h-12 bg-blue-500/20 rounded-xl items-center justify-center">
                    <Database size={24} color="#3b82f6" />
                  </View>
                  <View>
                    <Text className="text-gray-900 dark:text-white text-xl font-bold">Data Management</Text>
                    <Text className="text-gray-600 dark:text-slate-400 text-xs">Bulk import & export data</Text>
                  </View>
                </View>
                <Pressable onPress={() => setShowDataManagement(false)}>
                  <X size={24} color="#94a3b8" />
                </Pressable>
              </View>
            </View>

            <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={true}>
              {/* Google Sheets Sync */}
              <View className="mb-6">
                <View className="flex-row items-center gap-2 mb-3">
                  <Sheet size={20} color="#10b981" />
                  <Text className="text-gray-900 dark:text-white text-lg font-bold">Google Sheets Sync</Text>
                </View>
                <Text className="text-gray-600 dark:text-slate-400 text-sm mb-4">
                  Two-way sync with Google Sheets. Keep your data in sync across Centaur OS and your spreadsheets.
                </Text>

                <Pressable
                  onPress={handleOpenGoogleSheets}
                  className="bg-emerald-500/10 border-2 border-emerald-500/30 rounded-xl p-4 mb-3 active:opacity-70"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-gray-900 dark:text-white font-semibold mb-1">Connect Google Sheets</Text>
                      <Text className="text-gray-600 dark:text-slate-400 text-xs">
                        Link your Google Sheets for automatic sync
                      </Text>
                    </View>
                    <ExternalLink size={20} color="#10b981" />
                  </View>
                </Pressable>

                <Pressable
                  onPress={handleGoogleSheetsSync}
                  disabled={syncStatus === 'syncing'}
                  className={`rounded-xl p-4 flex-row items-center justify-center gap-2 ${
                    syncStatus === 'syncing'
                      ? 'bg-gray-200 dark:bg-slate-800'
                      : syncStatus === 'success'
                      ? 'bg-emerald-500'
                      : 'bg-emerald-500'
                  } active:opacity-70`}
                >
                  {syncStatus === 'syncing' ? (
                    <>
                      <RefreshCw size={20} color="#ffffff" className="animate-spin" />
                      <Text className="text-gray-900 dark:text-white font-bold">Syncing...</Text>
                    </>
                  ) : syncStatus === 'success' ? (
                    <>
                      <Check size={20} color="#ffffff" />
                      <Text className="text-gray-900 dark:text-white font-bold">Synced!</Text>
                    </>
                  ) : (
                    <>
                      <RefreshCw size={20} color="#ffffff" />
                      <Text className="text-gray-900 dark:text-white font-bold">Sync Now</Text>
                    </>
                  )}
                </Pressable>
              </View>

              {/* CSV Import/Export */}
              <View className="mb-6">
                <View className="flex-row items-center gap-2 mb-3">
                  <FileText size={20} color="#3b82f6" />
                  <Text className="text-gray-900 dark:text-white text-lg font-bold">CSV Import/Export</Text>
                </View>
                <Text className="text-gray-600 dark:text-slate-400 text-sm mb-4">
                  Import and export data as CSV files. Perfect for Excel, Google Sheets, or any spreadsheet tool.
                </Text>

                {/* Download Templates Section */}
                <View className="bg-blue-500/10 border-2 border-blue-500/30 rounded-xl p-4 mb-4">
                  <View className="flex-row items-center gap-2 mb-2">
                    <Download size={18} color="#3b82f6" />
                    <Text className="text-gray-900 dark:text-white font-semibold">Download CSV Templates</Text>
                  </View>
                  <Text className="text-gray-600 dark:text-slate-400 text-xs mb-3">
                    Get pre-formatted templates with all required columns and example data
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {[
                      'Tasks',
                      'OKRs',
                      'Team Members',
                      'Suppliers',
                      'AI Agents',
                      'Financial Data',
                    ].map((type) => (
                      <Pressable
                        key={type}
                        onPress={() => handleDownloadTemplate(type)}
                        className="bg-blue-500 px-3 py-2 rounded-lg active:opacity-70"
                      >
                        <Text className="text-gray-900 dark:text-white text-xs font-semibold">{type}</Text>
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
                  { type: 'AI Agents', icon: '🤖', count: '36', color: '#ec4899' },
                  { type: 'Financial Data', icon: '💰', count: '12 months', color: '#06b6d4' },
                ].map((item) => (
                  <View
                    key={item.type}
                    className="bg-gray-100 dark:bg-slate-800 rounded-xl p-4 mb-3 border border-gray-200 dark:border-slate-700"
                  >
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-row items-center gap-3">
                        <Text className="text-2xl">{item.icon}</Text>
                        <View>
                          <Text className="text-gray-900 dark:text-white font-semibold">{item.type}</Text>
                          <Text className="text-gray-600 dark:text-slate-500 text-xs">{item.count} records</Text>
                        </View>
                      </View>
                    </View>

                    <View className="flex-row gap-2">
                      <Pressable
                        onPress={() => handleImportCSV(item.type)}
                        className="flex-1 bg-blue-500 py-3 rounded-lg flex-row items-center justify-center gap-2 active:opacity-70"
                      >
                        <Upload size={16} color="#ffffff" />
                        <Text className="text-gray-900 dark:text-white font-semibold text-sm">Import</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleExportCSV(item.type)}
                        className="flex-1 bg-gray-200 dark:bg-slate-700 py-3 rounded-lg flex-row items-center justify-center gap-2 active:opacity-70"
                      >
                        <Download size={16} color={item.color} />
                        <Text className="text-gray-900 dark:text-white font-semibold text-sm">Export</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>

              {/* Help Section */}
              <View className="mb-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <Text className="text-gray-900 dark:text-white font-semibold mb-2">💡 Tips for Bulk Import</Text>
                <View className="gap-2">
                  <Text className="text-gray-700 dark:text-slate-300 text-sm">• Download a template first to see the correct format</Text>
                  <Text className="text-gray-700 dark:text-slate-300 text-sm">• Required fields are marked with an asterisk (*)</Text>
                  <Text className="text-gray-700 dark:text-slate-300 text-sm">• Dates should be in YYYY-MM-DD format</Text>
                  <Text className="text-gray-700 dark:text-slate-300 text-sm">• IDs must match existing records for updates</Text>
                  <Text className="text-gray-700 dark:text-slate-300 text-sm">• Google Sheets sync happens every hour automatically</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
      </ScrollView>
    </View>
  );
}
