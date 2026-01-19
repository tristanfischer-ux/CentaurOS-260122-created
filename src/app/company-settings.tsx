/**
 * Company Settings Screen
 * Manage company profile, internal team vs external suppliers/partners
 * Based on MULTI_TENANCY_ARCHITECTURE.md
 */

import { View, Text, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  Building2,
  ChevronLeft,
  Users,
  Factory,
  Edit2,
  Save,
  X,
  MapPin,
  Mail,
  Phone,
  Globe,
  CheckCircle2,
  AlertCircle,
  Briefcase,
} from 'lucide-react-native';
import { useCurrentWorkspace, useCurrentMembership, useAppStore } from '@/lib/state/app-store';
import { useOrganizationMembers, useSupplierEngagements, useOrganizationStore } from '@/lib/state/organization-store';

export default function CompanySettingsScreen() {
  const insets = useSafeAreaInsets();
  const currentWorkspace = useCurrentWorkspace();
  const currentMembership = useCurrentMembership();
  const updateWorkspace = useAppStore(s => s.updateWorkspace);

  const members = useOrganizationMembers();
  const supplierEngagements = useSupplierEngagements();

  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [companyName, setCompanyName] = useState(currentWorkspace?.name || '');
  const [showSupplierModal, setShowSupplierModal] = useState(false);

  // Filter internal team (your company's employees)
  const internalTeam = members.filter(m =>
    m.workspaceId === currentWorkspace?.id && m.status === 'active'
  );

  // External suppliers/contractors (other companies)
  const externalSuppliers = supplierEngagements.filter(e =>
    e.workspaceId === currentWorkspace?.id && e.status !== 'cancelled'
  );

  const handleSaveCompanyName = async () => {
    if (!currentWorkspace?.id || !companyName.trim()) return;

    try {
      await updateWorkspace(currentWorkspace.id, { name: companyName.trim() });
      setIsEditingCompany(false);
    } catch (error) {
      console.error('Failed to update workspace:', error);
    }
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <LinearGradient
        colors={['#3b82f6', '#2563eb', '#1d4ed8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 12,
          paddingBottom: 16,
        }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center gap-2 active:opacity-70"
          >
            <ChevronLeft size={24} color="white" />
            <Text className="text-white text-lg font-medium">Back</Text>
          </Pressable>
        </View>

        <View className="flex-row items-center gap-3">
          <View className="bg-white/20 p-3 rounded-xl">
            <Building2 size={28} color="white" />
          </View>
          <View className="flex-1">
            <Text className="text-white/70 text-xs font-medium uppercase tracking-wide">
              Company Settings
            </Text>
            <Text className="text-white text-2xl font-bold">
              {currentWorkspace?.name || 'Your Company'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 100 }}
      >
        {/* Company Profile Section */}
        <View className="bg-white dark:bg-slate-800 rounded-xl p-5 mb-5">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-slate-900 dark:text-white font-bold text-lg">
              Company Profile
            </Text>
            {!isEditingCompany && (
              <Pressable
                onPress={() => setIsEditingCompany(true)}
                className="flex-row items-center gap-1 active:opacity-70"
              >
                <Edit2 size={16} color="#3b82f6" />
                <Text className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                  Edit
                </Text>
              </Pressable>
            )}
          </View>

          {isEditingCompany ? (
            <View className="gap-3">
              <View>
                <Text className="text-slate-600 dark:text-slate-400 text-sm mb-2">
                  Company Name
                </Text>
                <TextInput
                  value={companyName}
                  onChangeText={setCompanyName}
                  placeholder="Enter company name"
                  className="bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg px-4 py-3"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View className="flex-row gap-3 mt-2">
                <Pressable
                  onPress={handleSaveCompanyName}
                  className="flex-1 bg-blue-600 py-3 rounded-lg items-center flex-row justify-center gap-2 active:opacity-80"
                >
                  <Save size={18} color="white" />
                  <Text className="text-white font-semibold">Save</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setCompanyName(currentWorkspace?.name || '');
                    setIsEditingCompany(false);
                  }}
                  className="flex-1 bg-slate-200 dark:bg-slate-700 py-3 rounded-lg items-center active:opacity-80"
                >
                  <Text className="text-slate-700 dark:text-slate-300 font-semibold">
                    Cancel
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View className="gap-3">
              <View className="flex-row items-center gap-3">
                <Building2 size={20} color="#64748b" />
                <View className="flex-1">
                  <Text className="text-slate-500 dark:text-slate-400 text-xs">
                    Company Name
                  </Text>
                  <Text className="text-slate-900 dark:text-white font-semibold">
                    {currentWorkspace?.name || 'Not set'}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-3">
                <Users size={20} color="#64748b" />
                <View className="flex-1">
                  <Text className="text-slate-500 dark:text-slate-400 text-xs">
                    Your Role
                  </Text>
                  <Text className="text-slate-900 dark:text-white font-semibold">
                    {currentMembership?.role || 'Member'}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-3">
                <Briefcase size={20} color="#64748b" />
                <View className="flex-1">
                  <Text className="text-slate-500 dark:text-slate-400 text-xs">
                    Function
                  </Text>
                  <Text className="text-slate-900 dark:text-white font-semibold">
                    {currentMembership?.function || 'General'}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Internal Team Section */}
        <View className="bg-white dark:bg-slate-800 rounded-xl p-5 mb-5">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
              <Users size={20} color="#3b82f6" />
              <Text className="text-slate-900 dark:text-white font-bold text-lg">
                Internal Team
              </Text>
            </View>
            <View className="bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full">
              <Text className="text-blue-600 dark:text-blue-400 font-bold text-sm">
                {internalTeam.length} members
              </Text>
            </View>
          </View>

          <Text className="text-slate-500 dark:text-slate-400 text-sm mb-4">
            These are your company's employees (Founders, Executives, Apprentices)
          </Text>

          {internalTeam.length === 0 ? (
            <View className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 items-center">
              <AlertCircle size={24} color="#94a3b8" />
              <Text className="text-slate-500 dark:text-slate-400 text-sm mt-2 text-center">
                No team members yet. Add people from the People tab.
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {internalTeam.map((member) => (
                <View
                  key={member.id}
                  className="flex-row items-center gap-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3"
                >
                  <View className="bg-blue-100 dark:bg-blue-900/30 w-10 h-10 rounded-full items-center justify-center">
                    <Text className="text-blue-600 dark:text-blue-400 font-bold">
                      {member.name.charAt(0)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-900 dark:text-white font-semibold">
                      {member.name}
                    </Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-xs">
                      {member.role} • {member.function}
                    </Text>
                  </View>
                  <View className="bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded">
                    <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                      Internal
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* External Suppliers Section */}
        <View className="bg-white dark:bg-slate-800 rounded-xl p-5 mb-5">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
              <Factory size={20} color="#f59e0b" />
              <Text className="text-slate-900 dark:text-white font-bold text-lg">
                External Suppliers
              </Text>
            </View>
            <View className="bg-amber-100 dark:bg-amber-900/30 px-3 py-1 rounded-full">
              <Text className="text-amber-600 dark:text-amber-400 font-bold text-sm">
                {externalSuppliers.length} active
              </Text>
            </View>
          </View>

          <Text className="text-slate-500 dark:text-slate-400 text-sm mb-4">
            These are external companies you work with (suppliers, contractors, partners)
          </Text>

          {externalSuppliers.length === 0 ? (
            <View className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 items-center">
              <AlertCircle size={24} color="#94a3b8" />
              <Text className="text-slate-500 dark:text-slate-400 text-sm mt-2 text-center">
                No supplier engagements yet. Add suppliers from the Marketplace tab.
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {externalSuppliers.map((engagement) => (
                <Pressable
                  key={engagement.id}
                  onPress={() => setShowSupplierModal(true)}
                  className="flex-row items-center gap-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 active:opacity-80"
                >
                  <View className="bg-amber-100 dark:bg-amber-900/30 w-10 h-10 rounded-full items-center justify-center">
                    <Factory size={20} color="#f59e0b" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-900 dark:text-white font-semibold">
                      {engagement.supplierName}
                    </Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-xs">
                      {engagement.category} • {engagement.status}
                    </Text>
                  </View>
                  <View className="bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded">
                    <Text className="text-purple-600 dark:text-purple-400 text-xs font-medium">
                      External
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Info Box */}
        <View className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
          <View className="flex-row items-start gap-3">
            <CheckCircle2 size={20} color="#3b82f6" />
            <View className="flex-1">
              <Text className="text-blue-900 dark:text-blue-300 font-semibold mb-1">
                Internal vs External
              </Text>
              <Text className="text-blue-800 dark:text-blue-400 text-sm">
                <Text className="font-semibold">Internal team</Text> members are your company's employees.{'\n'}
                <Text className="font-semibold">External suppliers</Text> are other companies you contract with.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Supplier Details Modal (Placeholder) */}
      <Modal
        visible={showSupplierModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSupplierModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/70"
          onPress={() => setShowSupplierModal(false)}
        >
          <View className="flex-1" />
          <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '70%' }}>
            <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-bold text-slate-900 dark:text-white">
                  Supplier Details
                </Text>
                <Pressable onPress={() => setShowSupplierModal(false)} className="p-2">
                  <X size={24} color="#64748b" />
                </Pressable>
              </View>

              <Text className="text-slate-600 dark:text-slate-400 mb-4">
                Detailed supplier information and management will be available here.
              </Text>

              <Pressable
                onPress={() => setShowSupplierModal(false)}
                className="bg-blue-600 py-4 rounded-xl items-center active:opacity-80"
              >
                <Text className="text-white font-bold">Close</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
