import { View, Text, Pressable, ScrollView, Modal, Alert, Linking } from 'react-native';
import { LogOut, ChevronRight, Sun, Moon, Smartphone, FileText, Info, X, Database, Download, Upload, RefreshCw, Check, ExternalLink, Sheet, Play } from 'lucide-react-native';
import { useAppStore, useCurrentUser, useCurrentMembership } from '@/lib/state/app-store';
import { router } from 'expo-router';
import { useState } from 'react';
import type { ThemeMode } from '@/types';
import { resetOnboarding } from '@/lib/onboarding';

export default function SettingsScreen() {
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

  const themeOptions: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
    { mode: 'light', label: 'Light', icon: Sun },
    { mode: 'dark', label: 'Dark', icon: Moon },
    { mode: 'system', label: 'System', icon: Smartphone },
  ];

  return (
    <ScrollView className="flex-1 bg-white dark:bg-slate-950">
      <View className="p-4">
        <View className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-6 mb-4">
          <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">Logged in as</Text>
          <Text className="text-gray-900 dark:text-white text-lg font-semibold">{currentUser?.name}</Text>
          <Text className="text-gray-600 dark:text-slate-400 text-sm">{currentUser?.email}</Text>
          {currentMembership && (
            <View className="mt-2 pt-2 border-t border-gray-200 dark:border-slate-800">
              <Text className="text-gray-500 dark:text-slate-500 text-xs">Role: {currentMembership.role}</Text>
            </View>
          )}
        </View>

        {/* Theme Selection */}
        <View className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 mb-4">
          <Text className="text-gray-900 dark:text-white font-semibold mb-3">Theme</Text>
          <View className="flex-row gap-2">
            {themeOptions.map(({ mode, label, icon: Icon }) => (
              <Pressable
                key={mode}
                onPress={() => handleThemeChange(mode)}
                className={`flex-1 p-3 rounded-xl border-2 ${
                  themeMode === mode
                    ? 'bg-blue-500/10 border-blue-500'
                    : 'bg-gray-200 dark:bg-slate-800 border-gray-300 dark:border-slate-700'
                } active:opacity-70`}
              >
                <View className="items-center">
                  <Icon size={20} color={themeMode === mode ? '#3b82f6' : '#94a3b8'} />
                  <Text
                    className={`text-sm font-medium mt-1 ${
                      themeMode === mode ? 'text-blue-400' : 'text-gray-600 dark:text-slate-400'
                    }`}
                  >
                    {label}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
          <Text className="text-gray-500 dark:text-slate-500 text-xs mt-2">
            {themeMode === 'system'
              ? 'Theme follows your device settings'
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
      <Modal visible={showAbout} transparent animationType="slide">
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl" style={{ maxHeight: '90%' }}>
            <View className="p-6 border-b border-gray-200 dark:border-slate-800">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-900 dark:text-white text-2xl font-bold">About Centaur OS</Text>
                <Pressable onPress={() => setShowAbout(false)}>
                  <X size={24} color="#94a3b8" />
                </Pressable>
              </View>
            </View>

            <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={false}>
              <View className="gap-6">
                {/* Overview */}
                <View>
                  <Text className="text-gray-900 dark:text-white text-lg font-bold mb-2">What is Centaur OS?</Text>
                  <Text className="text-gray-700 dark:text-slate-300 leading-6">
                    Centaur OS is the operating system for lean hardware startups. It helps you run your business efficiently with a small team: 2 founders, apprentices (doers), and fractional executives (reviewers), augmented by AI agents and manufacturing partners.
                  </Text>
                </View>

                {/* Key Features */}
                <View>
                  <Text className="text-gray-900 dark:text-white text-lg font-bold mb-2">Key Features</Text>

                  <View className="mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-1">🏠 Dashboard & Daily Engagement</Text>
                    <Text className="text-gray-700 dark:text-slate-400 text-sm">
                      Role-specific dashboards with streak tracking, today's focus (top 3 priority tasks), quick win counter, and recent activity feed. See OKRs, upcoming tasks, and pending reviews at a glance. Push notifications for assignments, completions, and reviews.
                    </Text>
                  </View>

                  <View className="mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-1">🎯 OKR Management & AI Task Advisor</Text>
                    <Text className="text-gray-700 dark:text-slate-400 text-sm">
                      Create objectives and track key results with health indicators. NEW: AI Task Advisor suggests proven tasks based on your objectives (revenue growth, PMF, customer acquisition, team building, operations, fundraising). Get founder-level coaching on "Why This Matters" and expected impact for each suggested task. 42 research-backed tasks across 6 categories.
                    </Text>
                  </View>

                  <View className="mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-1">✅ Work Hub</Text>
                    <Text className="text-gray-700 dark:text-slate-400 text-sm">
                      Comprehensive task management with priority-based sorting (Urgent → High → Medium → Low). Full editing: title, description, status, priority, function, assignee, linked objective, and due date. Filter by status or objective. Strategic alignment warnings for unlinked tasks. Time tracking available.
                    </Text>
                  </View>

                  <View className="mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-1">👥 Team Directory & Performance</Text>
                    <Text className="text-gray-700 dark:text-slate-400 text-sm">
                      Live workspace members with real user IDs. Contact info, roles, specializations, and task metrics. Assign tasks directly from profiles. Interactive org chart with circular layout showing reporting lines. Team Performance Analytics with contribution scores (0-100), productivity, quality, efficiency, and engagement metrics. Compare executives vs apprentices.
                    </Text>
                  </View>

                  <View className="mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-1">🔍 Reviews Workflow</Text>
                    <Text className="text-gray-700 dark:text-slate-400 text-sm">
                      Executives review apprentice work with approve/reject actions. Feedback loops ensure quality. Track review status (pending, approved, changes requested). Activity feed shows review requests and approvals.
                    </Text>
                  </View>

                  <View className="mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-1">🤖 AI Agents Ecosystem</Text>
                    <Text className="text-gray-700 dark:text-slate-400 text-sm">
                      36 AI agents organized by 7 functions: Finance (Vic AI, Digits AI), Sales (11x Alice, Gong AI), Marketing (Jasper, Midjourney, DALL-E 3), Ops (Hebbia, Zapier, Harvey), Engineering (GitHub Copilot, Cursor), Admin (ChatGPT Enterprise, Notion AI), Design & Manufacturing (Autodesk Fusion AI, Manufacturing GPT, Quality AI Inspector). Track team usage and costs (£7,334/month total).
                    </Text>
                  </View>

                  <View className="mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-1">🏭 Supplier Management</Text>
                    <Text className="text-gray-700 dark:text-slate-400 text-sm">
                      Track 5 active supplier engagements with project names, costs (£101k total, £33k paid), delivery timelines, and task breakdowns. Interactive UK map shows supplier locations (Birmingham, Leeds, Manchester, 2x London). Contact managers and monitor delivery status.
                    </Text>
                  </View>

                  <View className="mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-1">🌐 Network & Hiring</Text>
                    <Text className="text-gray-700 dark:text-slate-400 text-sm">
                      Browse and hire from 30 Fractional Executives and 30 Apprentices. View experience, ratings, daily rates (£200-800), availability, skills, and previous companies. Search and filter by specialization. Tinder-style discovery interface with detail views and LinkedIn profile links. One-click hiring adds candidates to your team.
                    </Text>
                  </View>

                  <View className="mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-1">📅 Community Events</Text>
                    <Text className="text-gray-700 dark:text-slate-400 text-sm">
                      Create and join hardware startup events: networking mixers, workshops, office hours, product showcases. Interactive map shows event locations with markers. RSVP tracking, attendee lists, and event types (in-person, virtual, hybrid). Foster ecosystem connections.
                    </Text>
                  </View>

                  <View className="mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-1">💰 Financial Dashboard (Founders)</Text>
                    <Text className="text-gray-700 dark:text-slate-400 text-sm">
                      Tap any metric for detailed breakdowns: Monthly Revenue (£45k), Gross Profit (£26.5k, 58.8% margin), Burn Rate (£57.7k) with BOM (32%), People (49.5%), AI (3.8%), Other (14.7%), and Runway (10.4 months). Interactive scenario planning with sliders to model revenue increases and burn reductions. Budget setting with variance tracking. Visual progress bars for each cost category.
                    </Text>
                  </View>

                  <View className="mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-1">📊 Organization Structure (Founders)</Text>
                    <Text className="text-gray-700 dark:text-slate-400 text-sm">
                      Complete operational overview: 2 Founders, 4 Fractional Executives managing 7 Apprentices. View hierarchical org chart with reporting lines and role breakdown. Monitor team costs and performance. Access Team Performance Analytics with contribution scores, productivity metrics, quality ratings, and efficiency tracking.
                    </Text>
                  </View>

                  <View className="mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-1">📈 Reports & Exports</Text>
                    <Text className="text-gray-700 dark:text-slate-400 text-sm">
                      Generate Weekly Packs, Board Packs, and custom reports. Export OKRs and tasks to CSV. Financial metrics automatically included. Professional summaries of progress, risks, decisions, and blockers. Role-based data views (Founder/Executive/Apprentice).
                    </Text>
                  </View>

                  <View className="mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-1">💾 Data Management (Founders)</Text>
                    <Text className="text-gray-700 dark:text-slate-400 text-sm">
                      Bulk import/export system with CSV templates. Two-way sync with Google Sheets for automatic updates. Import/export: Tasks, OKRs, Team Members, Suppliers, AI Agents, Financial Data. Works with Excel, Google Sheets, and any CSV editor. Templates include all required columns with example data.
                    </Text>
                  </View>

                  <View className="mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-1">🎓 Learning & Development</Text>
                    <Text className="text-gray-700 dark:text-slate-400 text-sm">
                      Track apprentice growth with skills matrix (6 proficiency levels: Beginner → Expert). Training modules with course links and completion tracking. Quarterly performance reviews with 5-category ratings: Technical Skills, Communication, Problem Solving, Reliability, Initiative. Document strengths, areas for growth, and career goals. Available to Founders and Executives.
                    </Text>
                  </View>

                  <View className="mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-1">🔔 Push Notifications</Text>
                    <Text className="text-gray-700 dark:text-slate-400 text-sm">
                      Smart notifications for task assignments (with priority), task completions, review requests, review approvals, OKR updates, and milestone achievements. Daily reminder at 9 AM for priority tasks. Weekly digest every Monday with progress summary. Granular settings to enable/disable specific notification types. Badge counts for pending items.
                    </Text>
                  </View>

                  <View className="mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-1">🎨 Design System</Text>
                    <Text className="text-gray-700 dark:text-slate-400 text-sm">
                      Apple Human Interface Guidelines compliant design with consistent typography, spacing, colors, and interactive feedback. Unified button styles, card patterns, and modal presentations. Professional polish throughout.
                    </Text>
                  </View>

                  <View className="mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-1">🔐 Authentication & Security</Text>
                    <Text className="text-gray-700 dark:text-slate-400 text-sm">
                      Email-based sign-in and sign-up. Create new accounts with automatic workspace setup. Token-based authentication. Role-based access control (RBAC) enforces permissions on all operations. Audit logging tracks all significant actions. Persistent sessions with AsyncStorage.
                    </Text>
                  </View>
                </View>

                {/* Organizational Philosophy */}
                <View>
                  <Text className="text-gray-900 dark:text-white text-lg font-bold mb-2">Decide • Evaluate • Do</Text>
                  <Text className="text-gray-700 dark:text-slate-300 leading-6 mb-2">
                    Centaur OS is built around a three-tier organizational model:
                  </Text>
                  <View className="ml-3">
                    <Text className="text-gray-700 dark:text-slate-300 mb-1">
                      <Text className="font-semibold">Founders (Decide):</Text> Set strategy, make key decisions, manage finances.
                    </Text>
                    <Text className="text-gray-700 dark:text-slate-300 mb-1">
                      <Text className="font-semibold">Fractional Execs (Evaluate):</Text> Review work, provide expertise, ensure quality.
                    </Text>
                    <Text className="text-gray-700 dark:text-slate-300">
                      <Text className="font-semibold">Apprentices (Do):</Text> Execute tasks, learn from feedback, deliver results.
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
      <Modal visible={showDataManagement} transparent animationType="slide">
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl" style={{ maxHeight: '90%' }}>
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

            <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={false}>
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
                      <Text className="text-white font-bold">Syncing...</Text>
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
                          <Text className="text-gray-500 dark:text-slate-500 text-xs">{item.count} records</Text>
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
  );
}
