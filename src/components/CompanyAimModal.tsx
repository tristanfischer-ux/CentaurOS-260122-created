/**
 * Company Aim Modal
 *
 * Allows founders to define the high-level macro aim of their company.
 * This is the ultimate purpose that gives meaning to all activities.
 */

import { View, Text, Modal, Pressable, ScrollView, TextInput, Alert } from 'react-native';
import { X, Target, Lightbulb, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useCompanyAimStore } from '@/lib/state/company-aim-store';

interface CompanyAimModalProps {
  visible: boolean;
  onClose: () => void;
  workspaceId: string;
}

export function CompanyAimModal({ visible, onClose, workspaceId }: CompanyAimModalProps) {
  const getAimByWorkspace = useCompanyAimStore((s) => s.getAimByWorkspace);
  const setAim = useCompanyAimStore((s) => s.setAim);

  const existingAim = getAimByWorkspace(workspaceId);

  const [aim, setAimText] = useState<string>(existingAim?.aim || '');
  const [why, setWhy] = useState<string>(existingAim?.why || '');
  const [notAbout, setNotAbout] = useState<string>(existingAim?.notAbout || '');

  useEffect(() => {
    if (visible && existingAim) {
      setAimText(existingAim.aim);
      setWhy(existingAim.why);
      setNotAbout(existingAim.notAbout);
    }
  }, [visible, existingAim]);

  const handleSave = () => {
    if (!aim.trim()) {
      Alert.alert('Required', 'Please define your company aim.');
      return;
    }

    if (!why.trim()) {
      Alert.alert('Required', 'Please explain why this aim matters.');
      return;
    }

    setAim(workspaceId, aim.trim(), why.trim(), notAbout.trim());
    onClose();
  };

  const handleClose = () => {
    // Reset to existing values or clear
    if (existingAim) {
      setAimText(existingAim.aim);
      setWhy(existingAim.why);
      setNotAbout(existingAim.notAbout);
    } else {
      setAimText('');
      setWhy('');
      setNotAbout('');
    }
    onClose();
  };

  const canSave = aim.trim().length > 0 && why.trim().length > 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View className="flex-1 bg-black/50">
        <View className="flex-1 bg-white dark:bg-slate-950 mt-16 rounded-t-3xl">
          {/* Header */}
          <LinearGradient
            colors={['#8b5cf6', '#6366f1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
          >
            <View className="p-5">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-white/70 text-xs font-medium">COMPANY PURPOSE</Text>
                  <Text className="text-white text-xl font-bold">
                    {existingAim ? 'Edit Your Aim' : 'Define Your Aim'}
                  </Text>
                </View>
                <Pressable
                  onPress={handleClose}
                  className="w-9 h-9 bg-white/20 rounded-full items-center justify-center active:opacity-70"
                >
                  <X size={20} color="#ffffff" />
                </Pressable>
              </View>
            </View>
          </LinearGradient>

          {/* Content */}
          <ScrollView className="flex-1 px-5 py-6" showsVerticalScrollIndicator={false}>
            {/* Introduction */}
            <View className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-5 mb-6">
              <View className="flex-row items-start mb-3">
                <View className="w-10 h-10 bg-purple-500 rounded-lg items-center justify-center">
                  <Target size={20} color="#fff" />
                </View>
                <Text className="text-purple-900 dark:text-purple-100 font-bold text-base ml-3 flex-1">
                  What is Your Company's Ultimate Aim?
                </Text>
              </View>
              <Text className="text-purple-900 dark:text-purple-100 text-sm leading-relaxed mb-3">
                This is your high-level macro purpose — the fundamental reason your company exists. It's not about valuation or metrics; it's about the meaningful change you want to create.
              </Text>
              <Text className="text-purple-700 dark:text-purple-300 text-xs italic">
                Example: "Make sustainable living accessible to every household" or "Eliminate preventable blindness in developing countries"
              </Text>
            </View>

            {/* Question 1: The Aim */}
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <Target size={20} color="#8b5cf6" />
                <Text className="text-gray-900 dark:text-white font-bold text-base ml-2">
                  1. What is your company's ultimate aim?
                </Text>
              </View>
              <TextInput
                className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-4 text-gray-900 dark:text-white text-base min-h-[100px]"
                placeholder="e.g., Make renewable energy affordable for every home"
                placeholderTextColor="#9ca3af"
                value={aim}
                onChangeText={setAimText}
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* Question 2: Why It Matters */}
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <Lightbulb size={20} color="#8b5cf6" />
                <Text className="text-gray-900 dark:text-white font-bold text-base ml-2">
                  2. Why does this aim matter?
                </Text>
              </View>
              <TextInput
                className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-4 text-gray-900 dark:text-white text-base min-h-[100px]"
                placeholder="e.g., Climate change demands urgent action, but cost is the #1 barrier for families"
                placeholderTextColor="#9ca3af"
                value={why}
                onChangeText={setWhy}
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* Question 3: What It's NOT About */}
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <AlertCircle size={20} color="#8b5cf6" />
                <Text className="text-gray-900 dark:text-white font-bold text-base ml-2">
                  3. What is your company NOT about? (Optional)
                </Text>
              </View>
              <TextInput
                className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-4 text-gray-900 dark:text-white text-base min-h-[100px]"
                placeholder="e.g., We're not just building to increase valuation — we're building to solve a real problem that matters"
                placeholderTextColor="#9ca3af"
                value={notAbout}
                onChangeText={setNotAbout}
                multiline
                textAlignVertical="top"
              />
              <Text className="text-gray-500 dark:text-slate-400 text-xs mt-2">
                This helps clarify what you're NOT optimizing for, keeping you focused on what truly matters.
              </Text>
            </View>

            {/* Alignment Reminder */}
            <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
              <View className="flex-row items-start">
                <CheckCircle2 size={16} color="#3b82f6" style={{ marginTop: 2 }} />
                <Text className="text-blue-900 dark:text-blue-100 text-xs ml-2 flex-1">
                  <Text className="font-bold">Alignment Check: </Text>
                  Once you define your aim, ask yourself: "Do the things I'm doing actually move forward to this goal?" If an activity doesn't serve this aim, question whether it's worth your time.
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View className="p-5 border-t border-gray-200 dark:border-slate-800">
            <View className="flex-row gap-3">
              <Pressable
                onPress={handleClose}
                className="bg-gray-100 dark:bg-slate-900 rounded-xl px-5 py-4 active:opacity-70 flex-row items-center justify-center"
                style={{ flex: 1 }}
              >
                <Text className="text-gray-700 dark:text-slate-300 font-semibold text-base">
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSave}
                disabled={!canSave}
                className={`rounded-xl px-5 py-4 active:opacity-70 flex-row items-center justify-center ${
                  canSave ? 'bg-purple-600' : 'bg-gray-200 dark:bg-slate-800'
                }`}
                style={{ flex: 2 }}
              >
                <Sparkles size={18} color={canSave ? '#fff' : '#9ca3af'} />
                <Text
                  className={`font-semibold text-base ml-2 ${
                    canSave ? 'text-white' : 'text-gray-400 dark:text-slate-600'
                  }`}
                >
                  Save Aim
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
