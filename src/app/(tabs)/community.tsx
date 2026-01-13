import { View, Text, ScrollView, Pressable, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import {
  Users,
  Briefcase,
  Award,
  Factory,
  X,
  Plus,
  Upload,
  CheckCircle2,
  Mail,
  Phone,
  Building2,
  Star,
  Filter,
  Send,
  Bot,
  Calendar,
  BookOpen,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { fractionalExecutives, apprentices, type Candidate } from '@/lib/candidates-seed';
import { UK_SUPPLIERS } from '@/lib/suppliers-seed';
import { THIRD_PARTY_AI_TOOLS, getAIToolsByFunction, getTotalAIToolsCount, getCategoryColor, type ThirdPartyAITool, type BusinessFunction } from '@/lib/third-party-ai-tools';
import { TabDescription } from '@/components/TabDescription';
import { useCurrentMembership } from '@/lib/state/app-store';
import { useSupplierStore } from '@/lib/state/supplier-store';
import type { Supplier } from '@/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type CommunityTab = 'executives' | 'apprentices' | 'suppliers' | 'ai-agents' | 'apply';

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const currentMembership = useCurrentMembership();
  const suppliers = useSupplierStore((s) => s.suppliers);
  const selectSupplier = useSupplierStore((s) => s.selectSupplier);
  const selectedSupplierFromStore = useSupplierStore((s) => s.selectedSupplier);
  const searchSuppliers = useSupplierStore((s) => s.searchSuppliers);

  const [activeTab, setActiveTab] = useState<CommunityTab>('executives');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [selectedAIAgent, setSelectedAIAgent] = useState<ThirdPartyAITool | null>(null);
  const [selectedAIFunction, setSelectedAIFunction] = useState<BusinessFunction | 'all'>('all');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFunction, setSelectedFunction] = useState<string>('all');
  const [selectedSupplierType, setSelectedSupplierType] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestType, setRequestType] = useState<'executive' | 'apprentice' | 'supplier' | null>(null);
  const [requestNotes, setRequestNotes] = useState('');

  // Application state
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applicationType, setApplicationType] = useState<'executive' | 'apprentice' | 'supplier'>('executive');
  const [applicationName, setApplicationName] = useState('');
  const [applicationEmail, setApplicationEmail] = useState('');
  const [applicationPhone, setApplicationPhone] = useState('');
  const [applicationSpecialization, setApplicationSpecialization] = useState('');
  const [applicationExperience, setApplicationExperience] = useState('');
  const [applicationCV, setApplicationCV] = useState<{ name: string; uri: string; size: number } | null>(null);

  const isFounder = currentMembership?.role === 'Founder';

  // Filter executives
  const filteredExecutives = fractionalExecutives.filter((exec) => {
    const matchesSearch = searchQuery === '' ||
      exec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exec.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase())) ||
      exec.specialization.some(spec => spec.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFunction = selectedFunction === 'all' || exec.specialization.includes(selectedFunction as any);

    return matchesSearch && matchesFunction;
  });

  // Filter apprentices
  const filteredApprentices = apprentices.filter((apprentice) => {
    const matchesSearch = searchQuery === '' ||
      apprentice.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apprentice.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase())) ||
      apprentice.specialization.some(spec => spec.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFunction = selectedFunction === 'all' || apprentice.specialization.includes(selectedFunction as any);

    return matchesSearch && matchesFunction;
  });

  // Filter suppliers
  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch = searchQuery === '' ||
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.capabilities.some(spec => spec.toLowerCase().includes(searchQuery.toLowerCase())) ||
      `${supplier.location.city}, ${supplier.location.country}`.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedSupplierType === 'all' || true; // All suppliers for now

    return matchesSearch && matchesType;
  });

  const handleRequestAllocation = (type: 'executive' | 'apprentice' | 'supplier', item: any) => {
    setRequestType(type);
    setRequestNotes('');

    if (type === 'executive' || type === 'apprentice') {
      setSelectedCandidate(item);
    } else {
      selectSupplier(item);
    }

    setShowRequestModal(true);
  };

  const handleSubmitRequest = () => {
    if (!requestType) return;

    const resourceName = requestType === 'supplier'
      ? selectedSupplierFromStore?.name
      : selectedCandidate?.name;

    Alert.alert(
      'Request Submitted',
      `Your request to add ${resourceName} has been sent to the founder for approval in the Decide tab.`,
      [{ text: 'OK' }]
    );

    setShowRequestModal(false);
    setRequestType(null);
    setRequestNotes('');
    setSelectedCandidate(null);
    selectSupplier(null);
  };

  const handleSubmitApplication = () => {
    if (!applicationName || !applicationEmail) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    const cvInfo = applicationCV
      ? `\n\nCV/Resume: ${applicationCV.name} (${(applicationCV.size / 1024).toFixed(1)} KB)`
      : '';

    Alert.alert(
      'Application Submitted',
      `Your ${applicationType} application has been submitted successfully${cvInfo ? ' with your CV/resume' : ''}. You'll be contacted if there's a match.`,
      [{ text: 'OK' }]
    );

    // Reset form
    setApplicationName('');
    setApplicationEmail('');
    setApplicationPhone('');
    setApplicationSpecialization('');
    setApplicationExperience('');
    setApplicationCV(null);
    setShowApplicationModal(false);
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setApplicationCV({
          name: file.name,
          uri: file.uri,
          size: file.size || 0,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  const tabs: { value: CommunityTab; label: string; icon: any }[] = [
    { value: 'executives', label: 'Executives', icon: Briefcase },
    { value: 'apprentices', label: 'Apprentices', icon: Award },
    { value: 'suppliers', label: 'Suppliers', icon: Factory },
    { value: 'ai-agents', label: 'AI Agents', icon: Bot },
    { value: 'apply', label: 'Apply/Join', icon: Upload },
  ];

  return (
    <View className="flex-1 bg-white dark:bg-slate-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-300 dark:border-slate-800">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1">
            <Text className="text-gray-900 dark:text-white text-2xl font-bold">Community</Text>
            <Text className="text-gray-600 dark:text-slate-400 text-sm mt-0.5">
              People, AI agents, suppliers, guilds, and events
            </Text>
          </View>
        </View>

        {/* Quick Action Buttons */}
        <View className="flex-row gap-3 mb-3">
          <Pressable
            onPress={() => router.push('/guilds')}
            className="flex-1 bg-purple-500 rounded-xl py-3 items-center active:opacity-80"
          >
            <View className="flex-row items-center">
              <BookOpen size={18} color="#fff" />
              <Text className="text-white font-bold ml-2">Guilds</Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => router.push('/events')}
            className="flex-1 bg-emerald-500 rounded-xl py-3 items-center active:opacity-80"
          >
            <View className="flex-row items-center">
              <Calendar size={18} color="#fff" />
              <Text className="text-white font-bold ml-2">Events</Text>
            </View>
          </Pressable>
        </View>

        {/* Summary Stats */}
        <View className="flex-row gap-2 mb-3">
          <View className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800">
            <Text className="text-emerald-700 dark:text-emerald-300 text-xs mb-1">Executives</Text>
            <Text className="text-emerald-600 dark:text-emerald-400 text-xl font-bold">{filteredExecutives.length}</Text>
          </View>
          <View className="flex-1 bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 border border-purple-200 dark:border-purple-800">
            <Text className="text-purple-700 dark:text-purple-300 text-xs mb-1">Apprentices</Text>
            <Text className="text-purple-600 dark:text-purple-400 text-xl font-bold">{filteredApprentices.length}</Text>
          </View>
          <View className="flex-1 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl p-3 border border-cyan-200 dark:border-cyan-800">
            <Text className="text-cyan-700 dark:text-cyan-300 text-xs mb-1">AI Agents</Text>
            <Text className="text-cyan-600 dark:text-cyan-400 text-xl font-bold">{getTotalAIToolsCount()}</Text>
          </View>
          <View className="flex-1 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-200 dark:border-amber-800">
            <Text className="text-amber-700 dark:text-amber-300 text-xs mb-1">Suppliers</Text>
            <Text className="text-amber-600 dark:text-amber-400 text-xl font-bold">{filteredSuppliers.length}</Text>
          </View>
        </View>

        {/* Tab Selector */}
        <View className="flex-row bg-gray-100 dark:bg-slate-900 rounded-xl p-1 border border-gray-300 dark:border-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;
            return (
              <Pressable
                key={tab.value}
                onPress={() => setActiveTab(tab.value)}
                className={`flex-1 py-2 rounded-lg items-center active:opacity-70 ${
                  isActive ? 'bg-blue-500' : ''
                }`}
              >
                <Icon
                  size={16}
                  color={isActive ? '#ffffff' : '#64748b'}
                  strokeWidth={2}
                />
                <Text
                  className={`text-xs mt-1 font-medium ${
                    isActive ? 'text-white' : 'text-gray-600 dark:text-slate-400'
                  }`}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Search & Filter */}
      {(activeTab === 'executives' || activeTab === 'apprentices' || activeTab === 'suppliers' || activeTab === 'ai-agents') && (
        <View className="px-6 py-3 border-b border-gray-300 dark:border-slate-800">
          <TextInput
            className="bg-gray-100 dark:bg-slate-900 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-base border border-gray-300 dark:border-slate-800"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={`Search ${activeTab}...`}
            placeholderTextColor="#64748b"
          />
        </View>
      )}

      <ScrollView className="flex-1">
        {/* Executives Tab */}
        {activeTab === 'executives' && (
          <View className="px-6 pb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-gray-900 dark:text-white text-sm">
                {filteredExecutives.length} fractional executives available
              </Text>
            </View>

            {/* Function Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
              contentContainerStyle={{ gap: 8 }}
            >
              <Pressable
                onPress={() => setSelectedFunction('all')}
                className={`px-4 py-2 rounded-full ${
                  selectedFunction === 'all'
                    ? 'bg-blue-500'
                    : 'bg-gray-200 dark:bg-slate-800'
                } active:opacity-70`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    selectedFunction === 'all'
                      ? 'text-white'
                      : 'text-gray-700 dark:text-slate-300'
                  }`}
                >
                  All
                </Text>
              </Pressable>
              {['Sales', 'Marketing', 'Finance', 'Ops', 'Engineering'].map((func) => (
                <Pressable
                  key={func}
                  onPress={() => setSelectedFunction(func)}
                  className={`px-4 py-2 rounded-full ${
                    selectedFunction === func
                      ? 'bg-blue-500'
                      : 'bg-gray-200 dark:bg-slate-800'
                  } active:opacity-70`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      selectedFunction === func
                        ? 'text-white'
                        : 'text-gray-700 dark:text-slate-300'
                    }`}
                  >
                    {func}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {filteredExecutives.map((exec) => (
              <Pressable
                key={exec.id}
                onPress={() => {
                  setSelectedCandidate(exec);
                  setShowProfileModal(true);
                }}
                className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 mb-3 border border-gray-300 dark:border-slate-800 active:opacity-70"
              >
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1">
                    <Text className="text-gray-900 dark:text-white font-bold text-base mb-1">
                      {exec.name}
                    </Text>
                    <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">
                      {exec.specialization.join(', ')}
                    </Text>
                  </View>
                  <View className="bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded">
                    <Text className="text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                      {exec.availability}
                    </Text>
                  </View>
                </View>

                <View className="flex-row flex-wrap gap-1 mb-2">
                  {exec.skills.slice(0, 4).map((skill, idx) => (
                    <View key={idx} className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                      <Text className="text-blue-700 dark:text-blue-300 text-xs">{skill}</Text>
                    </View>
                  ))}
                </View>

                <View className="flex-row items-center justify-between pt-2 border-t border-gray-300 dark:border-slate-700">
                  <Text className="text-gray-600 dark:text-slate-400 text-xs">
                    {exec.experience}
                  </Text>
                  <Pressable
                    onPress={() => handleRequestAllocation('executive', exec)}
                    className="bg-blue-500 px-3 py-1 rounded-lg active:opacity-70"
                  >
                    <Text className="text-white text-xs font-semibold">Request</Text>
                  </Pressable>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Apprentices Tab */}
        {activeTab === 'apprentices' && (
          <View className="px-6 pb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-gray-900 dark:text-white text-sm">
                {filteredApprentices.length} apprentices available
              </Text>
            </View>

            {/* Skill Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
              contentContainerStyle={{ gap: 8 }}
            >
              <Pressable
                onPress={() => setSelectedFunction('all')}
                className={`px-4 py-2 rounded-full ${
                  selectedFunction === 'all'
                    ? 'bg-purple-500'
                    : 'bg-gray-200 dark:bg-slate-800'
                } active:opacity-70`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    selectedFunction === 'all'
                      ? 'text-white'
                      : 'text-gray-700 dark:text-slate-300'
                  }`}
                >
                  All
                </Text>
              </Pressable>
              {['Sales', 'Marketing', 'Finance', 'Ops', 'Engineering'].map((func) => (
                <Pressable
                  key={func}
                  onPress={() => setSelectedFunction(func)}
                  className={`px-4 py-2 rounded-full ${
                    selectedFunction === func
                      ? 'bg-purple-500'
                      : 'bg-gray-200 dark:bg-slate-800'
                  } active:opacity-70`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      selectedFunction === func
                        ? 'text-white'
                        : 'text-gray-700 dark:text-slate-300'
                    }`}
                  >
                    {func}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {filteredApprentices.map((apprentice) => (
              <Pressable
                key={apprentice.id}
                onPress={() => {
                  setSelectedCandidate(apprentice);
                  setShowProfileModal(true);
                }}
                className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 mb-3 border border-gray-300 dark:border-slate-800 active:opacity-70"
              >
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1">
                    <Text className="text-gray-900 dark:text-white font-bold text-base mb-1">
                      {apprentice.name}
                    </Text>
                    <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">
                      {apprentice.specialization.join(', ')}
                    </Text>
                  </View>
                  <View className="bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded">
                    <Text className="text-purple-700 dark:text-purple-300 text-xs font-semibold">
                      {apprentice.availability}
                    </Text>
                  </View>
                </View>

                <View className="flex-row flex-wrap gap-1 mb-2">
                  {apprentice.skills.slice(0, 4).map((skill, idx) => (
                    <View key={idx} className="bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded">
                      <Text className="text-purple-700 dark:text-purple-300 text-xs">{skill}</Text>
                    </View>
                  ))}
                </View>

                <View className="flex-row items-center justify-between pt-2 border-t border-gray-300 dark:border-slate-700">
                  <Text className="text-gray-600 dark:text-slate-400 text-xs">
                    {apprentice.experience}
                  </Text>
                  <Pressable
                    onPress={() => handleRequestAllocation('apprentice', apprentice)}
                    className="bg-purple-500 px-3 py-1 rounded-lg active:opacity-70"
                  >
                    <Text className="text-white text-xs font-semibold">Request</Text>
                  </Pressable>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Suppliers Tab */}
        {activeTab === 'suppliers' && (
          <View className="px-6 pb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-gray-900 dark:text-white text-sm">
                {filteredSuppliers.length} suppliers and manufacturers
              </Text>
            </View>

            {/* Type Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
              contentContainerStyle={{ gap: 8 }}
            >
              <Pressable
                onPress={() => setSelectedSupplierType('all')}
                className={`px-4 py-2 rounded-full ${
                  selectedSupplierType === 'all'
                    ? 'bg-amber-500'
                    : 'bg-gray-200 dark:bg-slate-800'
                } active:opacity-70`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    selectedSupplierType === 'all'
                      ? 'text-white'
                      : 'text-gray-700 dark:text-slate-300'
                  }`}
                >
                  All
                </Text>
              </Pressable>
              {[
                { value: 'contract-manufacturer', label: 'Manufacturers' },
                { value: 'component-supplier', label: 'Component Suppliers' },
                { value: 'fulfillment', label: 'Fulfillment' }
              ].map((type) => (
                <Pressable
                  key={type.value}
                  onPress={() => setSelectedSupplierType(type.value)}
                  className={`px-4 py-2 rounded-full ${
                    selectedSupplierType === type.value
                      ? 'bg-amber-500'
                      : 'bg-gray-200 dark:bg-slate-800'
                  } active:opacity-70`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      selectedSupplierType === type.value
                        ? 'text-white'
                        : 'text-gray-700 dark:text-slate-300'
                    }`}
                  >
                    {type.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {filteredSuppliers.map((supplier) => (
              <Pressable
                key={supplier.id}
                onPress={() => {
                  selectSupplier(supplier);
                  setShowProfileModal(true);
                }}
                className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 mb-3 border border-gray-300 dark:border-slate-800 active:opacity-70"
              >
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1">
                    <Text className="text-gray-900 dark:text-white font-bold text-base mb-1">
                      {supplier.name}
                    </Text>
                    <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">
                      {supplier.description}
                    </Text>
                  </View>
                </View>

                <View className="flex-row flex-wrap gap-1 mb-2">
                  {supplier.capabilities.slice(0, 3).map((spec, idx) => (
                    <View key={idx} className="bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded">
                      <Text className="text-amber-700 dark:text-amber-300 text-xs">{spec}</Text>
                    </View>
                  ))}
                  {supplier.capabilities.length > 3 && (
                    <View className="bg-gray-200 dark:bg-slate-800 px-2 py-1 rounded">
                      <Text className="text-gray-600 dark:text-slate-400 text-xs">+{supplier.capabilities.length - 3} more</Text>
                    </View>
                  )}
                </View>

                <View className="bg-gray-200 dark:bg-slate-800 rounded-lg p-2 mb-2">
                  <Text className="text-gray-700 dark:text-slate-300 text-xs">
                    MOQ: {supplier.minimumOrderQuantity} units • Lead time: {supplier.leadTimeWeeks} weeks
                  </Text>
                </View>

                <View className="flex-row items-center justify-between pt-2 border-t border-gray-300 dark:border-slate-700">
                  <Text className="text-gray-600 dark:text-slate-400 text-xs">
                    {supplier.certifications.join(', ')}
                  </Text>
                  <Pressable
                    onPress={() => handleRequestAllocation('supplier', supplier)}
                    className="bg-amber-500 px-3 py-1 rounded-lg active:opacity-70"
                  >
                    <Text className="text-white text-xs font-semibold">Request</Text>
                  </Pressable>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* AI Agents Tab */}
        {activeTab === 'ai-agents' && (
          <View className="px-6 pb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-gray-900 dark:text-white text-sm">
                {getAIToolsByFunction(selectedAIFunction).length} AI tools available
              </Text>
            </View>

            {/* Function Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
              contentContainerStyle={{ gap: 8 }}
            >
              <Pressable
                onPress={() => setSelectedAIFunction('all')}
                className={`px-4 py-2 rounded-full ${
                  selectedAIFunction === 'all'
                    ? 'bg-cyan-500'
                    : 'bg-gray-200 dark:bg-slate-800'
                } active:opacity-70`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    selectedAIFunction === 'all'
                      ? 'text-white'
                      : 'text-gray-700 dark:text-slate-300'
                  }`}
                >
                  All
                </Text>
              </Pressable>
              {(['Sales', 'Marketing', 'Finance', 'Ops', 'Engineering', 'Admin'] as BusinessFunction[]).map((func) => (
                <Pressable
                  key={func}
                  onPress={() => setSelectedAIFunction(func)}
                  className={`px-4 py-2 rounded-full ${
                    selectedAIFunction === func
                      ? 'bg-cyan-500'
                      : 'bg-gray-200 dark:bg-slate-800'
                  } active:opacity-70`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      selectedAIFunction === func
                        ? 'text-white'
                        : 'text-gray-700 dark:text-slate-300'
                    }`}
                  >
                    {func}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {getAIToolsByFunction(selectedAIFunction).map((tool) => {
              const colorScheme = getCategoryColor(tool.category);
              return (
                <Pressable
                  key={tool.id}
                  onPress={() => {
                    setSelectedAIAgent(tool);
                  }}
                  className={`${colorScheme.bg} border ${colorScheme.border} rounded-2xl p-4 mb-3 active:opacity-70`}
                >
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1">
                      <Text className={`${colorScheme.text} font-bold text-base mb-1`}>
                        {tool.name}
                      </Text>
                      <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">
                        {tool.purpose}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row flex-wrap gap-1 mb-2">
                    {tool.capabilities.slice(0, 3).map((capability, idx) => (
                      <View key={idx} className="bg-gray-200 dark:bg-slate-800 px-2 py-1 rounded">
                        <Text className="text-gray-700 dark:text-slate-300 text-xs">{capability}</Text>
                      </View>
                    ))}
                    {tool.capabilities.length > 3 && (
                      <View className="bg-gray-200 dark:bg-slate-800 px-2 py-1 rounded">
                        <Text className="text-gray-600 dark:text-slate-400 text-xs">+{tool.capabilities.length - 3} more</Text>
                      </View>
                    )}
                  </View>

                  <View className="flex-row items-center justify-between pt-2 border-t border-gray-300 dark:border-slate-700">
                    <Text className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      £{tool.costPerMonth}/mo
                    </Text>
                    <Text className="text-gray-500 dark:text-slate-500 text-xs">
                      {tool.provider}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Apply/Join Tab */}
        {activeTab === 'apply' && (
          <View className="px-6 pb-6">
            <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
              <Text className="text-blue-900 dark:text-blue-100 font-bold text-lg mb-2">
                Join the Marketplace
              </Text>
              <Text className="text-blue-800 dark:text-blue-200 text-sm">
                Are you a fractional executive, apprentice looking to learn, or a supplier/manufacturer? Join our marketplace to connect with hardware startups.
              </Text>
            </View>

            {/* Application Types */}
            <Pressable
              onPress={() => {
                setApplicationType('executive');
                setShowApplicationModal(true);
              }}
              className="bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 mb-3 active:opacity-70"
            >
              <View className="flex-row items-center mb-2">
                <Briefcase size={24} color="#10b981" />
                <Text className="text-emerald-900 dark:text-emerald-100 font-bold text-base ml-3">
                  Apply as Fractional Executive
                </Text>
              </View>
              <Text className="text-emerald-800 dark:text-emerald-200 text-sm">
                Join as an experienced executive offering 1-3 days/week of your expertise to hardware startups
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setApplicationType('apprentice');
                setShowApplicationModal(true);
              }}
              className="bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-xl p-4 mb-3 active:opacity-70"
            >
              <View className="flex-row items-center mb-2">
                <Award size={24} color="#a855f7" />
                <Text className="text-purple-900 dark:text-purple-100 font-bold text-base ml-3">
                  Apply as Apprentice
                </Text>
              </View>
              <Text className="text-purple-800 dark:text-purple-200 text-sm">
                Learn from experienced executives while contributing to real hardware startup projects
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setApplicationType('supplier');
                setShowApplicationModal(true);
              }}
              className="bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 active:opacity-70"
            >
              <View className="flex-row items-center mb-2">
                <Factory size={24} color="#f59e0b" />
                <Text className="text-amber-900 dark:text-amber-100 font-bold text-base ml-3">
                  Register as Supplier/Manufacturer
                </Text>
              </View>
              <Text className="text-amber-800 dark:text-amber-200 text-sm">
                Connect with hardware startups looking for reliable manufacturing and component suppliers
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Profile Detail Modal */}
      <Modal visible={showProfileModal} transparent animationType="slide" onRequestClose={() => setShowProfileModal(false)}>
        <View className="flex-1 bg-black/70">
          <View className="flex-1 bg-white dark:bg-slate-950 mt-16 rounded-t-3xl">
            {/* Header */}
            <View className="px-6 pt-6 pb-4 border-b border-gray-300 dark:border-slate-800">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-900 dark:text-white text-2xl font-bold">
                  {selectedCandidate ? 'Profile Details' : 'Supplier Details'}
                </Text>
                <Pressable
                  onPress={() => {
                    setShowProfileModal(false);
                    setSelectedCandidate(null);
                    selectSupplier(null);
                  }}
                  className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-900 active:opacity-70"
                >
                  <X size={24} color="#64748b" />
                </Pressable>
              </View>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              {selectedCandidate && (
                <View className="px-6 py-6">
                  {/* Name and Role */}
                  <View className="mb-6">
                    <View className="flex-row items-center mb-3">
                      <View className={`w-16 h-16 rounded-full items-center justify-center ${
                        selectedCandidate.role === 'FractionalExec' ? 'bg-emerald-500' : 'bg-purple-500'
                      }`}>
                        <Text className="text-white text-xl font-bold">
                          {selectedCandidate.name.split(' ').map(n => n[0]).join('')}
                        </Text>
                      </View>
                      <View className="ml-4 flex-1">
                        <Text className="text-gray-900 dark:text-white text-2xl font-bold">
                          {selectedCandidate.name}
                        </Text>
                        <Text className="text-gray-600 dark:text-slate-400 text-base">
                          {selectedCandidate.role === 'FractionalExec' ? 'Fractional Executive' : 'Apprentice'}
                        </Text>
                      </View>
                    </View>
                    <View className={`self-start px-3 py-1.5 rounded-full ${
                      selectedCandidate.availability === 'Available now'
                        ? 'bg-emerald-100 dark:bg-emerald-900/30'
                        : 'bg-amber-100 dark:bg-amber-900/30'
                    }`}>
                      <Text className={`text-sm font-semibold ${
                        selectedCandidate.availability === 'Available now'
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-amber-700 dark:text-amber-300'
                      }`}>
                        {selectedCandidate.availability}
                      </Text>
                    </View>
                  </View>

                  {/* Specialization */}
                  <View className="mb-6">
                    <Text className="text-gray-900 dark:text-white font-bold text-lg mb-3">
                      Specialization
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {selectedCandidate.specialization.map((spec, idx) => (
                        <View key={idx} className="bg-blue-100 dark:bg-blue-900/30 px-3 py-2 rounded-lg">
                          <Text className="text-blue-700 dark:text-blue-300 font-semibold">{spec}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Experience */}
                  <View className="mb-6">
                    <Text className="text-gray-900 dark:text-white font-bold text-lg mb-2">
                      Experience
                    </Text>
                    <Text className="text-gray-700 dark:text-slate-300 text-base">
                      {selectedCandidate.experience}
                    </Text>
                  </View>

                  {/* Skills */}
                  <View className="mb-6">
                    <Text className="text-gray-900 dark:text-white font-bold text-lg mb-3">
                      Skills & Expertise
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {selectedCandidate.skills.map((skill, idx) => (
                        <View key={idx} className="bg-gray-200 dark:bg-slate-800 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700">
                          <Text className="text-gray-800 dark:text-slate-200 text-sm">{skill}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Previous Companies */}
                  {selectedCandidate.previousCompanies && selectedCandidate.previousCompanies.length > 0 && (
                    <View className="mb-6">
                      <Text className="text-gray-900 dark:text-white font-bold text-lg mb-3">
                        Previous Experience
                      </Text>
                      <View className="gap-3">
                        {selectedCandidate.previousCompanies.map((company, idx) => (
                          <View key={idx} className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 border border-gray-300 dark:border-slate-800">
                            <View className="flex-row items-center mb-2">
                              <Building2 size={18} color="#3b82f6" />
                              <Text className="text-gray-900 dark:text-white font-semibold ml-2">{company}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Hourly Rate */}
                  {selectedCandidate.costPerDay && (
                    <View className="mb-6">
                      <Text className="text-gray-900 dark:text-white font-bold text-lg mb-2">
                        Rate
                      </Text>
                      <View className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                        <Text className="text-emerald-700 dark:text-emerald-300 text-2xl font-bold">
                          £{selectedCandidate.costPerDay}/day
                        </Text>
                        <Text className="text-emerald-600 dark:text-emerald-400 text-sm mt-1">
                          {selectedCandidate.role === 'FractionalExec' ? 'Fractional engagement' : 'Apprentice rate'}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Bio / Additional Info */}
                  <View className="mb-6">
                    <Text className="text-gray-900 dark:text-white font-bold text-lg mb-2">
                      About
                    </Text>
                    <Text className="text-gray-700 dark:text-slate-300 text-base leading-6">
                      {selectedCandidate.role === 'FractionalExec'
                        ? `${selectedCandidate.name} is an experienced ${selectedCandidate.specialization.join(' and ')} professional with ${selectedCandidate.experience} years of experience. They bring deep expertise in ${selectedCandidate.skills.slice(0, 3).join(', ')}, and have worked with leading companies in the hardware and technology sectors.`
                        : `${selectedCandidate.name} is an apprentice specializing in ${selectedCandidate.specialization.join(' and ')}. With ${selectedCandidate.experience} years of experience, they are eager to learn and contribute to innovative hardware projects while developing their skills under experienced executives.`
                      }
                    </Text>
                  </View>
                </View>
              )}

              {selectedSupplierFromStore && (
                <View className="px-6 py-6">
                  {/* Name and Header */}
                  <View className="mb-6">
                    <View className="flex-row items-center mb-3">
                      <View className="w-16 h-16 bg-amber-500 rounded-full items-center justify-center">
                        <Factory size={32} color="#fff" />
                      </View>
                      <View className="ml-4 flex-1">
                        <Text className="text-gray-900 dark:text-white text-2xl font-bold">
                          {selectedSupplierFromStore.name}
                        </Text>
                        <Text className="text-gray-600 dark:text-slate-400 text-base">
                          {selectedSupplierFromStore.region} Region
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center">
                      <Building2 size={16} color="#64748b" />
                      <Text className="text-gray-600 dark:text-slate-400 text-sm ml-2">
                        {selectedSupplierFromStore.location.city}, {selectedSupplierFromStore.location.country}
                      </Text>
                    </View>
                  </View>

                  {/* Rating and Lead Time */}
                  {selectedSupplierFromStore.customerReviews && (
                    <View className="flex-row gap-3 mb-4">
                      <View className="flex-1 bg-gray-200 dark:bg-slate-800 rounded-xl p-4">
                        <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">Customer Rating</Text>
                        <View className="flex-row items-center">
                          <Text className="text-amber-500 dark:text-amber-400 text-2xl font-bold">
                            {selectedSupplierFromStore.customerReviews.rating}
                          </Text>
                          <Text className="text-gray-500 dark:text-slate-500 text-sm ml-1">/5</Text>
                        </View>
                        <Text className="text-gray-500 dark:text-slate-500 text-xs">
                          {selectedSupplierFromStore.customerReviews.totalReviews} reviews
                        </Text>
                      </View>
                      <View className="flex-1 bg-gray-200 dark:bg-slate-800 rounded-xl p-4">
                        <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">Lead Time</Text>
                        <Text className="text-emerald-600 dark:text-emerald-400 text-2xl font-bold">
                          {selectedSupplierFromStore.leadTimeWeeks}
                        </Text>
                        <Text className="text-gray-500 dark:text-slate-500 text-xs">weeks</Text>
                      </View>
                    </View>
                  )}

                  {/* Description */}
                  {selectedSupplierFromStore.detailedDescription && (
                    <View className="mb-4">
                      <Text className="text-gray-900 dark:text-white font-semibold mb-2">About</Text>
                      <Text className="text-gray-700 dark:text-slate-300 text-base leading-6">
                        {selectedSupplierFromStore.detailedDescription}
                      </Text>
                    </View>
                  )}

                  {/* Capabilities */}
                  <View className="mb-4">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-2">Capabilities</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {selectedSupplierFromStore.capabilities.map((cap, idx) => (
                        <View key={idx} className="bg-amber-100 dark:bg-amber-900/30 px-3 py-2 rounded-lg">
                          <Text className="text-amber-700 dark:text-amber-300 font-semibold">{cap}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Specialties */}
                  {selectedSupplierFromStore.specialties && selectedSupplierFromStore.specialties.length > 0 && (
                    <View className="mb-4">
                      <Text className="text-gray-900 dark:text-white font-semibold mb-2">Specialties</Text>
                      <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                        {selectedSupplierFromStore.specialties.map((specialty, idx) => (
                          <View key={idx} className="flex-row items-start mb-2">
                            <Text className="text-blue-600 dark:text-blue-400 mr-2">✓</Text>
                            <Text className="text-gray-900 dark:text-white flex-1 font-medium">{specialty}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Materials */}
                  {selectedSupplierFromStore.materials && selectedSupplierFromStore.materials.length > 0 && (
                    <View className="mb-4">
                      <Text className="text-gray-900 dark:text-white font-semibold mb-2">Materials</Text>
                      <View className="flex-row flex-wrap gap-2">
                        {selectedSupplierFromStore.materials.map((material, idx) => (
                          <View key={idx} className="bg-gray-200 dark:bg-slate-800 px-3 py-2 rounded-lg">
                            <Text className="text-gray-700 dark:text-slate-300">{material}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Industries Served */}
                  {selectedSupplierFromStore.industries && selectedSupplierFromStore.industries.length > 0 && (
                    <View className="mb-4">
                      <Text className="text-gray-900 dark:text-white font-semibold mb-2">Industries Served</Text>
                      <View className="flex-row flex-wrap gap-2">
                        {selectedSupplierFromStore.industries.map((industry, idx) => (
                          <View key={idx} className="bg-purple-100 dark:bg-purple-900/30 px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-800">
                            <Text className="text-purple-700 dark:text-purple-300 font-semibold">{industry}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Case Studies */}
                  {selectedSupplierFromStore.caseStudies && selectedSupplierFromStore.caseStudies.length > 0 && (
                    <View className="mb-4">
                      <Text className="text-gray-900 dark:text-white font-semibold mb-2">Case Studies</Text>
                      {selectedSupplierFromStore.caseStudies.map((caseStudy, idx) => (
                        <View key={idx} className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 mb-3">
                          <Text className="text-emerald-900 dark:text-emerald-100 font-bold text-base mb-1">{caseStudy.title}</Text>
                          <Text className="text-emerald-700 dark:text-emerald-300 text-sm mb-2">{caseStudy.client}</Text>

                          <Text className="text-gray-700 dark:text-slate-300 text-sm font-semibold mt-2">Challenge:</Text>
                          <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">{caseStudy.challenge}</Text>

                          <Text className="text-gray-700 dark:text-slate-300 text-sm font-semibold">Solution:</Text>
                          <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">{caseStudy.solution}</Text>

                          <Text className="text-gray-700 dark:text-slate-300 text-sm font-semibold">Results:</Text>
                          {caseStudy.results.map((result, ridx) => (
                            <Text key={ridx} className="text-gray-600 dark:text-slate-400 text-sm">• {result}</Text>
                          ))}
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Equipment & Technology */}
                  {selectedSupplierFromStore.equipment && (
                    <View className="mb-4">
                      <Text className="text-gray-900 dark:text-white font-semibold mb-2">Equipment & Technology</Text>
                      <View className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-xl p-4">
                        <View className="mb-3">
                          <Text className="text-cyan-700 dark:text-cyan-300 font-semibold mb-1">Capacity</Text>
                          <Text className="text-gray-700 dark:text-slate-300 text-sm">{selectedSupplierFromStore.equipment.capacity}</Text>
                        </View>
                        <View className="mb-3">
                          <Text className="text-cyan-700 dark:text-cyan-300 font-semibold mb-1">Machines</Text>
                          {selectedSupplierFromStore.equipment.machines.map((machine, idx) => (
                            <Text key={idx} className="text-gray-700 dark:text-slate-300 text-sm">• {machine}</Text>
                          ))}
                        </View>
                        <View>
                          <Text className="text-cyan-700 dark:text-cyan-300 font-semibold mb-1">Technology</Text>
                          <View className="flex-row flex-wrap gap-2 mt-1">
                            {selectedSupplierFromStore.equipment.technology.map((tech, idx) => (
                              <View key={idx} className="bg-cyan-100 dark:bg-cyan-900/40 px-2 py-1 rounded">
                                <Text className="text-cyan-800 dark:text-cyan-200 text-xs">{tech}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Quality Control */}
                  {selectedSupplierFromStore.qualityControl && (
                    <View className="mb-4">
                      <Text className="text-gray-900 dark:text-white font-semibold mb-2">Quality Control</Text>
                      <View className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                        {selectedSupplierFromStore.qualityControl.defectRate && (
                          <View className="mb-3">
                            <Text className="text-emerald-700 dark:text-emerald-300 font-semibold">Defect Rate</Text>
                            <Text className="text-emerald-600 dark:text-emerald-400 text-lg font-bold">{selectedSupplierFromStore.qualityControl.defectRate}</Text>
                          </View>
                        )}
                        <View className="mb-3">
                          <Text className="text-emerald-700 dark:text-emerald-300 font-semibold mb-1">Processes</Text>
                          {selectedSupplierFromStore.qualityControl.processes.map((process, idx) => (
                            <Text key={idx} className="text-gray-700 dark:text-slate-300 text-sm">• {process}</Text>
                          ))}
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Pricing */}
                  {selectedSupplierFromStore.pricing && (
                    <View className="mb-4">
                      <Text className="text-gray-900 dark:text-white font-semibold mb-2">Pricing</Text>
                      <View className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                        {selectedSupplierFromStore.pricing.setup && (
                          <View className="mb-2">
                            <Text className="text-purple-700 dark:text-purple-300 font-semibold">Setup Fee</Text>
                            <Text className="text-gray-700 dark:text-slate-300">{selectedSupplierFromStore.pricing.setup}</Text>
                          </View>
                        )}
                        {selectedSupplierFromStore.pricing.perUnit && (
                          <View className="mb-2">
                            <Text className="text-purple-700 dark:text-purple-300 font-semibold">Per Unit Cost</Text>
                            <Text className="text-gray-700 dark:text-slate-300">{selectedSupplierFromStore.pricing.perUnit}</Text>
                          </View>
                        )}
                        {selectedSupplierFromStore.pricing.minimumProject && (
                          <View className="mb-2">
                            <Text className="text-purple-700 dark:text-purple-300 font-semibold">Minimum Project</Text>
                            <Text className="text-gray-700 dark:text-slate-300">{selectedSupplierFromStore.pricing.minimumProject}</Text>
                          </View>
                        )}
                        {selectedSupplierFromStore.pricing.notes && (
                          <Text className="text-gray-600 dark:text-slate-400 text-sm mt-2 italic">
                            {selectedSupplierFromStore.pricing.notes}
                          </Text>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Order Information */}
                  <View className="mb-4">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-2">Order Information</Text>
                    <View className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 border border-gray-300 dark:border-slate-800">
                      <View className="flex-row justify-between mb-3">
                        <Text className="text-gray-600 dark:text-slate-400">Min. Order Quantity</Text>
                        <Text className="text-gray-900 dark:text-white font-semibold">{selectedSupplierFromStore.minimumOrderQuantity} units</Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-gray-600 dark:text-slate-400">Lead Time</Text>
                        <Text className="text-gray-900 dark:text-white font-semibold">{selectedSupplierFromStore.leadTimeWeeks} weeks</Text>
                      </View>
                    </View>
                  </View>

                  {/* Support Services */}
                  {selectedSupplierFromStore.support && (
                    <View className="mb-4">
                      <Text className="text-gray-900 dark:text-white font-semibold mb-2">Support Services</Text>
                      <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                        <View className="flex-row justify-between mb-2">
                          <Text className="text-gray-700 dark:text-slate-300">Design Assistance</Text>
                          <Text className="text-blue-700 dark:text-blue-300 font-semibold">
                            {selectedSupplierFromStore.support.designAssistance ? '✓ Yes' : '✗ No'}
                          </Text>
                        </View>
                        <View className="flex-row justify-between mb-2">
                          <Text className="text-gray-700 dark:text-slate-300">Prototyping</Text>
                          <Text className="text-blue-700 dark:text-blue-300 font-semibold">
                            {selectedSupplierFromStore.support.prototyping ? '✓ Yes' : '✗ No'}
                          </Text>
                        </View>
                        <View className="flex-row justify-between mb-2">
                          <Text className="text-gray-700 dark:text-slate-300">Engineering Support</Text>
                          <Text className="text-blue-700 dark:text-blue-300 font-semibold">
                            {selectedSupplierFromStore.support.engineering ? '✓ Yes' : '✗ No'}
                          </Text>
                        </View>
                        <View className="flex-row justify-between">
                          <Text className="text-gray-700 dark:text-slate-300">Logistics</Text>
                          <Text className="text-blue-700 dark:text-blue-300 font-semibold">
                            {selectedSupplierFromStore.support.logistics ? '✓ Yes' : '✗ No'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Certifications */}
                  <View className="mb-4">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-2">Certifications</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {selectedSupplierFromStore.certifications.map((cert, idx) => (
                        <View key={idx} className="bg-emerald-100 dark:bg-emerald-900/30 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
                          <View className="flex-row items-center">
                            <CheckCircle2 size={14} color="#10b981" />
                            <Text className="text-emerald-700 dark:text-emerald-300 font-semibold ml-1">{cert}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Customer Reviews */}
                  {selectedSupplierFromStore.customerReviews && (selectedSupplierFromStore.customerReviews.pros || selectedSupplierFromStore.customerReviews.cons) && (
                    <View className="mb-4">
                      <Text className="text-gray-900 dark:text-white font-semibold mb-2">Customer Feedback</Text>
                      <View className="bg-gray-100 dark:bg-slate-800 rounded-xl p-4">
                        {selectedSupplierFromStore.customerReviews.pros && selectedSupplierFromStore.customerReviews.pros.length > 0 && (
                          <View className="mb-3">
                            <Text className="text-emerald-700 dark:text-emerald-300 font-semibold mb-2">👍 Pros</Text>
                            {selectedSupplierFromStore.customerReviews.pros.map((pro, idx) => (
                              <Text key={idx} className="text-gray-700 dark:text-slate-300 text-sm mb-1">• {pro}</Text>
                            ))}
                          </View>
                        )}
                        {selectedSupplierFromStore.customerReviews.cons && selectedSupplierFromStore.customerReviews.cons.length > 0 && (
                          <View>
                            <Text className="text-red-700 dark:text-red-300 font-semibold mb-2">👎 Cons</Text>
                            {selectedSupplierFromStore.customerReviews.cons.map((con, idx) => (
                              <Text key={idx} className="text-gray-700 dark:text-slate-300 text-sm mb-1">• {con}</Text>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Testimonials */}
                  {selectedSupplierFromStore.customerReviews?.testimonials && selectedSupplierFromStore.customerReviews.testimonials.length > 0 && (
                    <View className="mb-4">
                      <Text className="text-gray-900 dark:text-white font-semibold mb-2">Testimonials</Text>
                      {selectedSupplierFromStore.customerReviews.testimonials.map((testimonial, idx) => (
                        <View key={idx} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-3">
                          <Text className="text-gray-700 dark:text-slate-300 text-sm italic mb-3">"{testimonial.quote}"</Text>
                          <View>
                            <Text className="text-blue-900 dark:text-blue-100 font-semibold text-sm">{testimonial.author}</Text>
                            <Text className="text-blue-700 dark:text-blue-300 text-xs">{testimonial.role}, {testimonial.company}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Website */}
                  <View className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                    <Text className="text-amber-700 dark:text-amber-300 text-sm font-semibold mb-2">🌐 Website</Text>
                    <Text className="text-amber-600 dark:text-amber-400 text-sm">
                      {selectedSupplierFromStore.contact.website || 'Not provided'}
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Action Buttons */}
            <View className="px-6 py-4 border-t border-gray-300 dark:border-slate-800 bg-white dark:bg-slate-950">
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => {
                    setShowProfileModal(false);
                    setTimeout(() => {
                      if (selectedSupplierFromStore) {
                        handleRequestAllocation('supplier', selectedSupplierFromStore);
                      } else if (selectedCandidate) {
                        handleRequestAllocation(
                          selectedCandidate.role === 'FractionalExec' ? 'executive' : 'apprentice',
                          selectedCandidate
                        );
                      }
                    }, 300);
                  }}
                  className="flex-1 bg-blue-500 rounded-xl py-4 items-center active:opacity-70"
                >
                  <Text className="text-white font-bold text-base">Request to Onboard</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setShowProfileModal(false);
                    setSelectedCandidate(null);
                    selectSupplier(null);
                  }}
                  className="px-6 py-4 bg-gray-200 dark:bg-slate-800 rounded-xl items-center justify-center active:opacity-70"
                >
                  <Text className="text-gray-700 dark:text-slate-300 font-semibold">Close</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Allocation Request Modal */}
      <Modal visible={showRequestModal} transparent animationType="fade" onRequestClose={() => setShowRequestModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-1 bg-black/70 justify-center items-center px-6">
            <View className="bg-gray-100 dark:bg-slate-900 rounded-3xl w-full" style={{ maxHeight: '70%' }}>
              <View className="px-6 pt-6 pb-4 border-b border-gray-300 dark:border-slate-800">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-900 dark:text-white text-xl font-bold">Request Allocation</Text>
                  <Pressable onPress={() => setShowRequestModal(false)}>
                    <X size={24} color="#94a3b8" />
                  </Pressable>
                </View>
              </View>

              <ScrollView showsVerticalScrollIndicator={true} className="px-6 py-4" keyboardShouldPersistTaps="handled">
              <View className="mb-4">
                <Text className="text-gray-900 dark:text-white font-bold text-base mb-1">
                  {requestType === 'supplier' ? selectedSupplierFromStore?.name : selectedCandidate?.name}
                </Text>
                <Text className="text-gray-600 dark:text-slate-400 text-sm">
                  This request will be sent to the founder for approval in the Decide tab.
                </Text>
              </View>

              <View className="mb-4">
                <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">
                  Request Notes (Optional)
                </Text>
                <TextInput
                  className="bg-gray-200 dark:bg-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-base min-h-[100px]"
                  value={requestNotes}
                  onChangeText={setRequestNotes}
                  placeholder="Explain why this resource would benefit the project..."
                  placeholderTextColor="#475569"
                  multiline
                  textAlignVertical="top"
                />
              </View>

              <Pressable
                onPress={handleSubmitRequest}
                className="bg-blue-500 py-4 rounded-xl active:opacity-70"
              >
                <View className="flex-row items-center justify-center">
                  <Send size={20} color="#fff" />
                  <Text className="text-white text-center font-bold ml-2">Submit Request</Text>
                </View>
              </Pressable>
            </ScrollView>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Application Modal */}
      <Modal visible={showApplicationModal} transparent animationType="fade" onRequestClose={() => setShowApplicationModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-1 bg-black/70 justify-center items-center px-6">
            <View className="bg-gray-100 dark:bg-slate-900 rounded-3xl w-full" style={{ maxHeight: '85%' }}>
              <View className="px-6 pt-6 pb-4 border-b border-gray-300 dark:border-slate-800">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-900 dark:text-white text-xl font-bold">
                    Apply as {applicationType === 'executive' ? 'Executive' : applicationType === 'apprentice' ? 'Apprentice' : 'Supplier'}
                  </Text>
                  <Pressable onPress={() => setShowApplicationModal(false)}>
                    <X size={24} color="#94a3b8" />
                  </Pressable>
                </View>
              </View>

              <ScrollView showsVerticalScrollIndicator={true} className="px-6 py-4" keyboardShouldPersistTaps="handled">
              <Text className="text-blue-700 dark:text-blue-300 text-sm mb-4">
                Submit your application to join the marketplace. Our team will review and contact you if there's a match.
              </Text>

              <View className="mb-3">
                <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">Full Name *</Text>
                <TextInput
                  className="bg-gray-200 dark:bg-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-base"
                  value={applicationName}
                  onChangeText={setApplicationName}
                  placeholder="Your name"
                  placeholderTextColor="#475569"
                />
              </View>

              <View className="mb-3">
                <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">Email *</Text>
                <TextInput
                  className="bg-gray-200 dark:bg-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-base"
                  value={applicationEmail}
                  onChangeText={setApplicationEmail}
                  placeholder="your.email@example.com"
                  placeholderTextColor="#475569"
                  keyboardType="email-address"
                />
              </View>

              <View className="mb-3">
                <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">Phone</Text>
                <TextInput
                  className="bg-gray-200 dark:bg-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-base"
                  value={applicationPhone}
                  onChangeText={setApplicationPhone}
                  placeholder="+44 7XXX XXXXXX"
                  placeholderTextColor="#475569"
                  keyboardType="phone-pad"
                />
              </View>

              <View className="mb-3">
                <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">
                  {applicationType === 'supplier' ? 'Specialization/Services' : 'Area of Expertise'}
                </Text>
                <TextInput
                  className="bg-gray-200 dark:bg-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-base"
                  value={applicationSpecialization}
                  onChangeText={setApplicationSpecialization}
                  placeholder={applicationType === 'supplier' ? 'e.g., PCB Assembly, Enclosures' : 'e.g., Marketing, Sales, Engineering'}
                  placeholderTextColor="#475569"
                />
              </View>

              <View className="mb-4">
                <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">
                  {applicationType === 'supplier' ? 'Company Description' : 'Experience Summary'}
                </Text>
                <TextInput
                  className="bg-gray-200 dark:bg-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-base min-h-[100px]"
                  value={applicationExperience}
                  onChangeText={setApplicationExperience}
                  placeholder="Tell us about your background..."
                  placeholderTextColor="#475569"
                  multiline
                  textAlignVertical="top"
                />
              </View>

              {/* CV/Resume Upload - Now functional */}
              {applicationType !== 'supplier' && (
                <View className="mb-4">
                  <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">
                    CV/Resume {applicationType === 'apprentice' ? '*' : '(Optional)'}
                  </Text>
                  {!applicationCV ? (
                    <Pressable
                      onPress={handlePickDocument}
                      className="bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl p-4 active:opacity-70"
                    >
                      <View className="flex-row items-center justify-center">
                        <Upload size={20} color="#3b82f6" />
                        <Text className="text-blue-600 dark:text-blue-400 text-sm font-semibold ml-2">
                          Upload PDF or Word Document
                        </Text>
                      </View>
                      <Text className="text-blue-500 dark:text-blue-500 text-xs text-center mt-2">
                        Tap to select your CV/Resume
                      </Text>
                    </Pressable>
                  ) : (
                    <View className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          <View className="flex-row items-center mb-1">
                            <CheckCircle2 size={16} color="#10b981" />
                            <Text className="text-emerald-700 dark:text-emerald-300 font-semibold ml-2">
                              Document Uploaded
                            </Text>
                          </View>
                          <Text className="text-emerald-600 dark:text-emerald-400 text-sm" numberOfLines={1}>
                            {applicationCV.name}
                          </Text>
                          <Text className="text-emerald-500 dark:text-emerald-500 text-xs mt-1">
                            {(applicationCV.size / 1024).toFixed(1)} KB
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => setApplicationCV(null)}
                          className="ml-3 w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full items-center justify-center active:opacity-70"
                        >
                          <X size={18} color="#ef4444" />
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {applicationType === 'supplier' && (
                <View className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
                  <Text className="text-amber-700 dark:text-amber-300 text-xs">
                    💡 For suppliers, please include company brochures or capability statements in your description above.
                  </Text>
                </View>
              )}

              <Pressable
                onPress={handleSubmitApplication}
                className="bg-blue-500 py-4 rounded-xl active:opacity-70 mb-4"
              >
                <Text className="text-white text-center font-bold">Submit Application</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* AI Agent Detail Modal */}
      <Modal visible={selectedAIAgent !== null} transparent animationType="fade" onRequestClose={() => setSelectedAIAgent(null)}>
        <View className="flex-1 bg-black/70 justify-center items-center px-4">
          {selectedAIAgent && (
            <View className="bg-gray-100 dark:bg-slate-900 rounded-3xl w-full" style={{ maxHeight: '95%', height: '95%' }}>
              {/* Header */}
              <View className="px-6 pt-6 pb-4 border-b border-gray-300 dark:border-slate-800">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-gray-900 dark:text-white text-2xl font-bold flex-1" numberOfLines={2}>{selectedAIAgent.name}</Text>
                  <Pressable onPress={() => setSelectedAIAgent(null)} className="ml-2">
                    <X size={28} color="#94a3b8" />
                  </Pressable>
                </View>
                <View className="flex-row items-center gap-2 mb-3">
                  <View className="bg-blue-100 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg">
                    <Text className="text-blue-700 dark:text-blue-300 text-sm font-semibold capitalize">
                      {selectedAIAgent.category.replace('-', ' ')}
                    </Text>
                  </View>
                  <View className="bg-purple-100 dark:bg-purple-900/30 px-3 py-1.5 rounded-lg">
                    <Text className="text-purple-700 dark:text-purple-300 text-sm font-semibold">
                      {selectedAIAgent.provider}
                    </Text>
                  </View>
                </View>
                <View className="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2">
                  <Text className="text-blue-600 dark:text-blue-400 text-xs text-center font-semibold">
                    ⬇️ Scroll down - 10+ sections of detailed info below
                  </Text>
                </View>
              </View>

              {/* Scrollable Content */}
              <ScrollView
                showsVerticalScrollIndicator={true}
                bounces={true}
                className="flex-1"
                persistentScrollbar={true}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                <View className="px-6 py-4">
                  {/* Cost and Rating Section */}
                  <View className="flex-row gap-3 mb-4">
                    <View className="flex-1 bg-gray-200 dark:bg-slate-800 rounded-xl p-4">
                      <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">Monthly Cost</Text>
                      <Text className="text-emerald-600 dark:text-emerald-400 text-2xl font-bold">
                        £{selectedAIAgent.costPerMonth}
                      </Text>
                      <Text className="text-gray-500 dark:text-slate-500 text-xs">/month</Text>
                    </View>
                    {selectedAIAgent.reviews && (
                      <View className="flex-1 bg-gray-200 dark:bg-slate-800 rounded-xl p-4">
                        <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">User Rating</Text>
                        <View className="flex-row items-center">
                          <Text className="text-amber-500 dark:text-amber-400 text-2xl font-bold">
                            {selectedAIAgent.reviews.rating}
                          </Text>
                          <Text className="text-gray-500 dark:text-slate-500 text-sm ml-1">/5</Text>
                        </View>
                        <Text className="text-gray-500 dark:text-slate-500 text-xs">
                          {selectedAIAgent.reviews.totalReviews} reviews
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Description */}
                  {selectedAIAgent.description && (
                    <View className="mb-6">
                      <Text className="text-gray-900 dark:text-white text-lg font-bold mb-3">📝 Description</Text>
                      <Text className="text-gray-900 dark:text-white text-base leading-6">
                        {selectedAIAgent.description}
                      </Text>
                    </View>
                  )}

                  {/* Purpose (if no description) */}
                  {!selectedAIAgent.description && (
                    <View className="mb-6">
                      <Text className="text-gray-900 dark:text-white text-lg font-bold mb-3">📝 Purpose</Text>
                      <Text className="text-gray-900 dark:text-white text-base leading-6">
                        {selectedAIAgent.purpose}
                      </Text>
                    </View>
                  )}

                  {/* Business Functions */}
                  <View className="mb-6">
                    <Text className="text-gray-900 dark:text-white text-lg font-bold mb-3">🎯 Business Functions</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {selectedAIAgent.functions.map((func, idx) => (
                        <View key={idx} className="bg-blue-100 dark:bg-blue-900/30 px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800">
                          <Text className="text-blue-700 dark:text-blue-300 font-semibold">{func}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Key Features */}
                  {selectedAIAgent.keyFeatures && selectedAIAgent.keyFeatures.length > 0 && (
                    <View className="mb-6">
                      <Text className="text-gray-900 dark:text-white text-lg font-bold mb-3">✨ Key Features</Text>
                      <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                        {selectedAIAgent.keyFeatures.map((feature, idx) => (
                          <View key={idx} className="flex-row items-start mb-2">
                            <Text className="text-blue-600 dark:text-blue-400 mr-2">✓</Text>
                            <Text className="text-gray-900 dark:text-white flex-1 font-medium">{feature}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Use Cases */}
                  {selectedAIAgent.useCases && selectedAIAgent.useCases.length > 0 && (
                    <View className="mb-6">
                      <Text className="text-gray-900 dark:text-white text-lg font-bold mb-3">💡 Use Cases</Text>
                      <View className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                        {selectedAIAgent.useCases.map((useCase, idx) => (
                          <View key={idx} className="flex-row items-start mb-2">
                            <Text className="text-emerald-600 dark:text-emerald-400 mr-2">→</Text>
                            <Text className="text-gray-900 dark:text-white flex-1">{useCase}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Capabilities */}
                  <View className="mb-6">
                    <Text className="text-gray-900 dark:text-white text-lg font-bold mb-3">⚡ Capabilities</Text>
                    <View className="bg-gray-200 dark:bg-slate-800 rounded-xl p-4">
                      {selectedAIAgent.capabilities.map((capability, idx) => (
                        <View key={idx} className="flex-row items-start mb-2">
                          <Text className="text-gray-600 dark:text-slate-400 mr-2">•</Text>
                          <Text className="text-gray-700 dark:text-slate-300 flex-1">{capability}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Integrations */}
                  <View className="mb-6">
                    <Text className="text-gray-900 dark:text-white text-lg font-bold mb-3">🔗 Integrations</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {selectedAIAgent.integrations.map((integration, idx) => (
                        <View key={idx} className="bg-gray-200 dark:bg-slate-800 px-3 py-2 rounded-lg">
                          <Text className="text-gray-700 dark:text-slate-300">{integration}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Pricing Details */}
                  {selectedAIAgent.pricing && (
                    <View className="mb-6">
                      <Text className="text-gray-900 dark:text-white text-lg font-bold mb-3">💰 Pricing Plans</Text>
                      <View className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                        {selectedAIAgent.pricing.starter && (
                          <View className="mb-2">
                            <Text className="text-purple-700 dark:text-purple-300 font-semibold">Starter</Text>
                            <Text className="text-gray-700 dark:text-slate-300">{selectedAIAgent.pricing.starter}</Text>
                          </View>
                        )}
                        {selectedAIAgent.pricing.professional && (
                          <View className="mb-2">
                            <Text className="text-purple-700 dark:text-purple-300 font-semibold">Professional</Text>
                            <Text className="text-gray-700 dark:text-slate-300">{selectedAIAgent.pricing.professional}</Text>
                          </View>
                        )}
                        {selectedAIAgent.pricing.enterprise && (
                          <View className="mb-2">
                            <Text className="text-purple-700 dark:text-purple-300 font-semibold">Enterprise</Text>
                            <Text className="text-gray-700 dark:text-slate-300">{selectedAIAgent.pricing.enterprise}</Text>
                          </View>
                        )}
                        {selectedAIAgent.pricing.notes && (
                          <Text className="text-gray-600 dark:text-slate-400 text-sm mt-2 italic">
                            {selectedAIAgent.pricing.notes}
                          </Text>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Setup Information */}
                  {selectedAIAgent.setup && (
                    <View className="mb-6">
                      <Text className="text-gray-900 dark:text-white text-lg font-bold mb-3">⚙️ Setup & Requirements</Text>
                      <View className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                        {selectedAIAgent.setup.difficulty && (
                          <View className="mb-2">
                            <Text className="text-amber-700 dark:text-amber-300 font-semibold">Difficulty</Text>
                            <Text className="text-gray-700 dark:text-slate-300">{selectedAIAgent.setup.difficulty}</Text>
                          </View>
                        )}
                        {selectedAIAgent.setup.timeToValue && (
                          <View className="mb-2">
                            <Text className="text-amber-700 dark:text-amber-300 font-semibold">Time to Value</Text>
                            <Text className="text-gray-700 dark:text-slate-300">{selectedAIAgent.setup.timeToValue}</Text>
                          </View>
                        )}
                        {selectedAIAgent.setup.requirements && selectedAIAgent.setup.requirements.length > 0 && (
                          <View>
                            <Text className="text-amber-700 dark:text-amber-300 font-semibold mb-1">Requirements</Text>
                            {selectedAIAgent.setup.requirements.map((req, idx) => (
                              <Text key={idx} className="text-gray-700 dark:text-slate-300 text-sm">• {req}</Text>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Support */}
                  {selectedAIAgent.support && (
                    <View className="mb-6">
                      <Text className="text-gray-900 dark:text-white text-lg font-bold mb-3">📞 Support</Text>
                      <View className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-xl p-4">
                        <View className="flex-row justify-between mb-2">
                          <Text className="text-gray-700 dark:text-slate-300">Email Support</Text>
                          <Text className="text-cyan-700 dark:text-cyan-300 font-semibold">
                            {selectedAIAgent.support.email ? '✓ Yes' : '✗ No'}
                          </Text>
                        </View>
                        <View className="flex-row justify-between mb-2">
                          <Text className="text-gray-700 dark:text-slate-300">Phone Support</Text>
                          <Text className="text-cyan-700 dark:text-cyan-300 font-semibold">
                            {selectedAIAgent.support.phone ? '✓ Yes' : '✗ No'}
                          </Text>
                        </View>
                        {selectedAIAgent.support.documentation && (
                          <View className="mb-2">
                            <Text className="text-cyan-700 dark:text-cyan-300 font-semibold">Documentation</Text>
                            <Text className="text-gray-700 dark:text-slate-300 text-sm">{selectedAIAgent.support.documentation}</Text>
                          </View>
                        )}
                        {selectedAIAgent.support.community && (
                          <View>
                            <Text className="text-cyan-700 dark:text-cyan-300 font-semibold">Community</Text>
                            <Text className="text-gray-700 dark:text-slate-300 text-sm">{selectedAIAgent.support.community}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                  {/* User Reviews */}
                  {selectedAIAgent.reviews && (selectedAIAgent.reviews.pros || selectedAIAgent.reviews.cons) && (
                    <View className="mb-6">
                      <Text className="text-gray-900 dark:text-white text-lg font-bold mb-3">⭐ User Feedback</Text>
                      <View className="bg-gray-100 dark:bg-slate-800 rounded-xl p-4">
                        {selectedAIAgent.reviews.pros && selectedAIAgent.reviews.pros.length > 0 && (
                          <View className="mb-3">
                            <Text className="text-emerald-700 dark:text-emerald-300 font-semibold mb-2">👍 Pros</Text>
                            {selectedAIAgent.reviews.pros.map((pro, idx) => (
                              <Text key={idx} className="text-gray-700 dark:text-slate-300 text-sm mb-1">• {pro}</Text>
                            ))}
                          </View>
                        )}
                        {selectedAIAgent.reviews.cons && selectedAIAgent.reviews.cons.length > 0 && (
                          <View>
                            <Text className="text-red-700 dark:text-red-300 font-semibold mb-2">👎 Cons</Text>
                            {selectedAIAgent.reviews.cons.map((con, idx) => (
                              <Text key={idx} className="text-gray-700 dark:text-slate-300 text-sm mb-1">• {con}</Text>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Website Link */}
                  <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
                    <Text className="text-blue-700 dark:text-blue-300 text-sm font-semibold mb-2">🌐 Website</Text>
                    <Text className="text-blue-600 dark:text-blue-400 text-sm">
                      {selectedAIAgent.website}
                    </Text>
                  </View>

                  {/* Getting Started */}
                  <View className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                    <Text className="text-emerald-700 dark:text-emerald-300 text-sm font-semibold mb-2">💡 Get Started</Text>
                    <Text className="text-emerald-600 dark:text-emerald-400 text-sm">
                      Visit the website to sign up for this tool. Most tools offer free trials to get started. Add your API key in the Settings tab to integrate with Centaur OS.
                    </Text>
                  </View>
                </View>
              </ScrollView>

              {/* Action Button */}
              <View className="px-6 py-4 border-t border-gray-300 dark:border-slate-800">
                <Pressable
                  onPress={() => {
                    setSelectedAIAgent(null);
                    Alert.alert(
                      'Opening Website',
                      `Visit ${selectedAIAgent?.website} to learn more and sign up for ${selectedAIAgent?.name}.`,
                      [{ text: 'OK' }]
                    );
                  }}
                  className="bg-blue-500 rounded-xl py-4 items-center active:opacity-70"
                >
                  <Text className="text-white font-bold text-base">Learn More</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}
