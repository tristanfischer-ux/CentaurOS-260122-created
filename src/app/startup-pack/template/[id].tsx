import { View, Text, ScrollView, Pressable, TextInput, Modal, Alert } from 'react-native';
import { useState, useMemo } from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft,
  Copy,
  Download,
  Edit3,
  X,
  Check,
  AlertTriangle,
  FileText,
  Variable,
} from 'lucide-react-native';
import { useStartupPackStore } from '@/lib/startup-pack';
import { useCurrentWorkspace } from '@/lib/state/app-store';
import { useTheme } from '@/lib/ThemeContext';
// @ts-ignore - markdown renderer
import Markdown from 'react-native-markdown-display';

export default function TemplateViewerScreen() {
  const { id: templateId } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';
  const workspace = useCurrentWorkspace();
  const workspaceId = workspace?.id ?? '';

  // Store
  const getTemplateById = useStartupPackStore(s => s.getTemplateById);
  const getFilledVariables = useStartupPackStore(s => s.getFilledVariables);
  const setFilledVariable = useStartupPackStore(s => s.setFilledVariable);
  const fillTemplate = useStartupPackStore(s => s.fillTemplate);

  // Data
  const template = getTemplateById(templateId ?? '');
  const savedVariables = getFilledVariables(workspaceId);

  // Local state
  const [showVariablesModal, setShowVariablesModal] = useState(false);
  const [localVariables, setLocalVariables] = useState<Record<string, string>>({});

  // Initialize local variables from saved
  useMemo(() => {
    if (template) {
      const initial: Record<string, string> = {};
      template.variables.forEach(v => {
        initial[v.key] = savedVariables[v.key] ?? v.default ?? '';
      });
      setLocalVariables(initial);
    }
  }, [template, savedVariables]);

  // Theme colors
  const bgPrimary = isDark ? 'bg-slate-950' : isOffWhite ? 'bg-orange-50' : 'bg-gray-50';
  const bgCard = isDark ? 'bg-slate-900' : isOffWhite ? 'bg-white' : 'bg-white';
  const borderColor = isDark ? 'border-slate-800' : isOffWhite ? 'border-orange-200' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-orange-700' : 'text-gray-600';
  const textMuted = isDark ? 'text-slate-500' : isOffWhite ? 'text-orange-600' : 'text-gray-500';
  const inputBg = isDark ? 'bg-slate-800' : isOffWhite ? 'bg-orange-100' : 'bg-gray-100';

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
    strong: {
      fontWeight: 'bold' as const,
    },
    link: {
      color: '#3b82f6',
    },
  }), [isDark]);

  // Fill template with current variables (must be before early return)
  const filledContent = useMemo(() => {
    if (!template) return '';
    let content = template.contentMarkdown;
    template.variables.forEach(v => {
      const value = localVariables[v.key] ?? v.default ?? `{{${v.key}}}`;
      const regex = new RegExp(`\\{\\{${v.key}\\}\\}`, 'g');
      content = content.replace(regex, value);
    });
    return content;
  }, [template, localVariables]);

  if (!template) {
    return (
      <View className={`flex-1 ${bgPrimary} items-center justify-center`}>
        <Text className={textPrimary}>Template not found</Text>
      </View>
    );
  }

  const handleCopyToClipboard = async () => {
    await Clipboard.setStringAsync(filledContent);
    Alert.alert('Copied!', 'Template copied to clipboard.');
  };

  const handleExportMarkdown = () => {
    // In a real app, this would trigger a file download or share
    Alert.alert(
      'Export Template',
      'Copy to clipboard to export as Markdown. You can paste into any text editor or document.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Copy', onPress: handleCopyToClipboard },
      ]
    );
  };

  const handleSaveVariables = () => {
    // Save all local variables to store
    Object.entries(localVariables).forEach(([key, value]) => {
      setFilledVariable(workspaceId, key, value);
    });
    setShowVariablesModal(false);
    Alert.alert('Saved', 'Variables saved for use across all templates.');
  };

  const renderVariablesModal = () => (
    <Modal
      visible={showVariablesModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowVariablesModal(false)}
    >
      <View className="flex-1 bg-black/60 justify-end">
        <View
          className={`${bgCard} rounded-t-3xl`}
          style={{ maxHeight: '85%', paddingBottom: insets.bottom + 20 }}
        >
          {/* Header */}
          <View className={`flex-row items-center justify-between p-5 border-b ${borderColor}`}>
            <View className="flex-row items-center">
              <Variable size={20} color="#3b82f6" />
              <Text className={`${textPrimary} font-bold text-lg ml-2`}>Fill Variables</Text>
            </View>
            <Pressable
              onPress={() => setShowVariablesModal(false)}
              className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-700 items-center justify-center"
            >
              <X size={18} color="#64748b" />
            </Pressable>
          </View>

          {/* Variables Form */}
          <ScrollView className="px-5 pt-4">
            <Text className={`${textSecondary} text-sm mb-4`}>
              Fill in these values to personalize the template. Values are saved for reuse.
            </Text>

            {template.variables.map((variable, index) => (
              <Animated.View
                key={variable.key}
                entering={FadeInDown.delay(index * 30).duration(200)}
                className="mb-4"
              >
                <Text className={`${textPrimary} font-semibold mb-1`}>
                  {variable.label}
                  {variable.required && <Text className="text-red-500"> *</Text>}
                </Text>
                {variable.placeholder && (
                  <Text className={`${textMuted} text-xs mb-2`}>{variable.placeholder}</Text>
                )}
                <TextInput
                  value={localVariables[variable.key] ?? ''}
                  onChangeText={(text) => setLocalVariables(prev => ({ ...prev, [variable.key]: text }))}
                  placeholder={variable.default ?? `Enter ${variable.label.toLowerCase()}`}
                  placeholderTextColor={isDark ? '#64748b' : '#9ca3af'}
                  className={`${inputBg} ${textPrimary} rounded-xl px-4 py-3`}
                />
              </Animated.View>
            ))}
          </ScrollView>

          {/* Save Button */}
          <View className="px-5 pt-4">
            <Pressable
              onPress={handleSaveVariables}
              className="bg-blue-500 rounded-xl py-4 items-center active:opacity-70"
            >
              <View className="flex-row items-center">
                <Check size={20} color="#fff" />
                <Text className="text-white font-bold ml-2">Save & Apply</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View className={`flex-1 ${bgPrimary}`}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View
        className={`${bgCard} border-b ${borderColor}`}
        style={{ paddingTop: insets.top + 12, paddingBottom: 16, paddingHorizontal: 20 }}
      >
        <View className="flex-row items-center mb-3">
          <Pressable onPress={() => router.back()} className="mr-3">
            <ArrowLeft size={24} color={isDark ? '#fff' : '#1f2937'} />
          </Pressable>
          <View className="flex-1">
            <Text className="text-blue-500 text-xs font-medium">TEMPLATE</Text>
            <Text className={`${textPrimary} text-lg font-bold`} numberOfLines={1}>
              {template.title}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => setShowVariablesModal(true)}
            className="flex-1 bg-purple-500/10 border border-purple-500/30 rounded-xl py-2.5 items-center flex-row justify-center active:opacity-70"
          >
            <Edit3 size={16} color="#a855f7" />
            <Text className="text-purple-500 font-semibold ml-2">Fill Variables</Text>
          </Pressable>
          <Pressable
            onPress={handleCopyToClipboard}
            className="flex-1 bg-blue-500/10 border border-blue-500/30 rounded-xl py-2.5 items-center flex-row justify-center active:opacity-70"
          >
            <Copy size={16} color="#3b82f6" />
            <Text className="text-blue-500 font-semibold ml-2">Copy</Text>
          </Pressable>
          <Pressable
            onPress={handleExportMarkdown}
            className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl py-2.5 px-4 items-center flex-row justify-center active:opacity-70"
          >
            <Download size={16} color="#10b981" />
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Description */}
        <Text className={`${textSecondary} mb-4`}>{template.description}</Text>

        {/* Disclaimers */}
        {template.disclaimers && template.disclaimers.length > 0 && (
          <View className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4">
            <View className="flex-row items-start mb-2">
              <AlertTriangle size={16} color="#f59e0b" style={{ marginTop: 2 }} />
              <Text className="text-amber-600 dark:text-amber-400 font-bold ml-2">Important</Text>
            </View>
            {template.disclaimers.map((disclaimer, index) => (
              <Text key={index} className="text-amber-600 dark:text-amber-400 text-sm mb-1">
                • {disclaimer}
              </Text>
            ))}
          </View>
        )}

        {/* Tags */}
        <View className="flex-row flex-wrap gap-2 mb-4">
          {template.tags.map((tag, index) => (
            <View key={index} className="bg-gray-200 dark:bg-slate-700 px-2 py-1 rounded">
              <Text className={`${textMuted} text-xs`}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* Template Content */}
        <View className={`${bgCard} border ${borderColor} rounded-xl p-4`}>
          <View className="flex-row items-center mb-3">
            <FileText size={18} color="#3b82f6" />
            <Text className={`${textPrimary} font-bold ml-2`}>Template Preview</Text>
          </View>
          <Markdown style={markdownStyles}>
            {filledContent}
          </Markdown>
        </View>

        {/* Notes */}
        <View className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <Text className="text-blue-400 text-sm">
            <Text className="font-bold">Tip: </Text>
            Click "Fill Variables" to personalize this template with your company details.
            Variables are saved and will be used across all templates.
          </Text>
        </View>
      </ScrollView>

      {/* Variables Modal */}
      {renderVariablesModal()}
    </View>
  );
}
