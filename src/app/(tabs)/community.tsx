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
import { AI_AGENTS, getAgentsByCategory, type AIAgent, type AgentCategory } from '@/lib/ai-agents-data';
import { TabDescription } from '@/components/TabDescription';
import { useCurrentMembership } from '@/lib/state/app-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type CommunityTab = 'executives' | 'apprentices' | 'suppliers' | 'ai-agents' | 'apply';

interface Supplier {
  id: string;
  name: string;
  type: 'contract-manufacturer' | 'component-supplier' | 'fulfillment';
  location: string;
  specialization: string[];
  minOrderQuantity: string;
  leadTime: string;
  certifications: string[];
}

// Convert UK_SUPPLIERS to community tab format
const DEMO_SUPPLIERS: Supplier[] = UK_SUPPLIERS.map((supplier, index) => ({
  id: `sup-${index + 1}`,
  name: supplier.name,
  type: 'contract-manufacturer' as const,
  location: `${supplier.location.city}, ${supplier.location.country}`,
  specialization: supplier.capabilities,
  minOrderQuantity: `${supplier.minimumOrderQuantity} units`,
  leadTime: `${supplier.leadTimeWeeks} weeks`,
  certifications: supplier.certifications,
}));

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const currentMembership = useCurrentMembership();

  const [activeTab, setActiveTab] = useState<CommunityTab>('executives');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedAIAgent, setSelectedAIAgent] = useState<AIAgent | null>(null);
  const [selectedAICategory, setSelectedAICategory] = useState<AgentCategory | null>(null);
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
  const filteredSuppliers = DEMO_SUPPLIERS.filter((supplier) => {
    const matchesSearch = searchQuery === '' ||
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.specialization.some(spec => spec.toLowerCase().includes(searchQuery.toLowerCase())) ||
      supplier.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedSupplierType === 'all' || supplier.type === selectedSupplierType;

    return matchesSearch && matchesType;
  });

  const handleRequestAllocation = (type: 'executive' | 'apprentice' | 'supplier', item: any) => {
    setRequestType(type);
    setRequestNotes('');

    if (type === 'executive' || type === 'apprentice') {
      setSelectedCandidate(item);
    } else {
      setSelectedSupplier(item);
    }

    setShowRequestModal(true);
  };

  const handleSubmitRequest = () => {
    if (!requestType) return;

    const resourceName = requestType === 'supplier'
      ? selectedSupplier?.name
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
    setSelectedSupplier(null);
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
        <View className="flex-row gap-3 mb-3">
          <View className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800">
            <Text className="text-emerald-700 dark:text-emerald-300 text-xs mb-1">Executives</Text>
            <Text className="text-emerald-600 dark:text-emerald-400 text-2xl font-bold">{filteredExecutives.length}</Text>
          </View>
          <View className="flex-1 bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 border border-purple-200 dark:border-purple-800">
            <Text className="text-purple-700 dark:text-purple-300 text-xs mb-1">Apprentices</Text>
            <Text className="text-purple-600 dark:text-purple-400 text-2xl font-bold">{filteredApprentices.length}</Text>
          </View>
          <View className="flex-1 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-200 dark:border-amber-800">
            <Text className="text-amber-700 dark:text-amber-300 text-xs mb-1">Suppliers</Text>
            <Text className="text-amber-600 dark:text-amber-400 text-2xl font-bold">{filteredSuppliers.length}</Text>
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
                  setSelectedSupplier(supplier);
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
                      {supplier.type.replace('-', ' ')} • {supplier.location}
                    </Text>
                  </View>
                </View>

                <View className="flex-row flex-wrap gap-1 mb-2">
                  {supplier.specialization.map((spec, idx) => (
                    <View key={idx} className="bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded">
                      <Text className="text-amber-700 dark:text-amber-300 text-xs">{spec}</Text>
                    </View>
                  ))}
                </View>

                <View className="bg-gray-200 dark:bg-slate-800 rounded-lg p-2 mb-2">
                  <Text className="text-gray-700 dark:text-slate-300 text-xs">
                    MOQ: {supplier.minOrderQuantity} • Lead time: {supplier.leadTime}
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
            <View className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-xl p-4 mb-4">
              <Text className="text-cyan-900 dark:text-cyan-100 font-bold text-lg mb-2">
                AI Agents Marketplace
              </Text>
              <Text className="text-cyan-800 dark:text-cyan-200 text-sm">
                Discover AI agents to automate tasks, enhance productivity, and scale your operations. Browse by category to see detailed agent capabilities.
              </Text>
            </View>

            {/* AI Agent Categories - Now show details instead of navigating */}
            <Text className="text-gray-900 dark:text-white text-base font-semibold mb-3">
              Browse by Category
            </Text>

            <Pressable
              onPress={() => setSelectedAICategory('engineering')}
              className="bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-3 active:opacity-70"
            >
              <View className="flex-row items-center mb-2">
                <Bot size={24} color="#3b82f6" />
                <Text className="text-blue-900 dark:text-blue-100 font-bold text-base ml-3">
                  Engineering Agents ({getAgentsByCategory('engineering').length})
                </Text>
              </View>
              <Text className="text-blue-800 dark:text-blue-200 text-sm mb-2">
                Frontend Dev, Backend Architect, Mobile Builder, AI Engineer, DevOps, Rapid Prototyper
              </Text>
              <Text className="text-blue-600 dark:text-blue-400 text-xs font-semibold">
                From £0.20 per task • Tap to view agents
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSelectedAICategory('marketing')}
              className="bg-pink-100 dark:bg-pink-900/30 border border-pink-200 dark:border-pink-800 rounded-xl p-4 mb-3 active:opacity-70"
            >
              <View className="flex-row items-center mb-2">
                <Bot size={24} color="#ec4899" />
                <Text className="text-pink-900 dark:text-pink-100 font-bold text-base ml-3">
                  Marketing Agents ({getAgentsByCategory('marketing').length})
                </Text>
              </View>
              <Text className="text-pink-800 dark:text-pink-200 text-sm mb-2">
                TikTok Strategist, Instagram Curator, Twitter Engager, Reddit Builder, ASO, Content Creator, Growth Hacker
              </Text>
              <Text className="text-pink-600 dark:text-pink-400 text-xs font-semibold">
                From £1.50 per task • Tap to view agents
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSelectedAICategory('design')}
              className="bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-xl p-4 mb-3 active:opacity-70"
            >
              <View className="flex-row items-center mb-2">
                <Bot size={24} color="#a855f7" />
                <Text className="text-purple-900 dark:text-purple-100 font-bold text-base ml-3">
                  Design Agents ({getAgentsByCategory('design').length})
                </Text>
              </View>
              <Text className="text-purple-800 dark:text-purple-200 text-sm mb-2">
                UI Designer, UX Researcher, Brand Guardian, Visual Storyteller, Whimsy Injector
              </Text>
              <Text className="text-purple-600 dark:text-purple-400 text-xs font-semibold">
                From £2.00 per task • Tap to view agents
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSelectedAICategory('product')}
              className="bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 mb-3 active:opacity-70"
            >
              <View className="flex-row items-center mb-2">
                <Bot size={24} color="#10b981" />
                <Text className="text-emerald-900 dark:text-emerald-100 font-bold text-base ml-3">
                  Product Agents ({getAgentsByCategory('product').length})
                </Text>
              </View>
              <Text className="text-emerald-800 dark:text-emerald-200 text-sm mb-2">
                Trend Researcher, Feedback Synthesizer, Sprint Prioritizer
              </Text>
              <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                From £1.00 per task • Tap to view agents
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSelectedAICategory('project-management')}
              className="bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-3 active:opacity-70"
            >
              <View className="flex-row items-center mb-2">
                <Bot size={24} color="#22c55e" />
                <Text className="text-green-900 dark:text-green-100 font-bold text-base ml-3">
                  Project Management Agents ({getAgentsByCategory('project-management').length})
                </Text>
              </View>
              <Text className="text-green-800 dark:text-green-200 text-sm mb-2">
                Experiment Tracker, Project Shipper, Studio Producer
              </Text>
              <Text className="text-green-600 dark:text-green-400 text-xs font-semibold">
                From £0.60 per task • Tap to view agents
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSelectedAICategory('studio-operations')}
              className="bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-3 active:opacity-70"
            >
              <View className="flex-row items-center mb-2">
                <Bot size={24} color="#64748b" />
                <Text className="text-slate-900 dark:text-slate-100 font-bold text-base ml-3">
                  Studio Operations Agents ({getAgentsByCategory('studio-operations').length})
                </Text>
              </View>
              <Text className="text-slate-800 dark:text-slate-200 text-sm mb-2">
                Support Responder, Analytics Reporter, Infrastructure Maintainer, Legal Compliance, Finance Tracker
              </Text>
              <Text className="text-slate-600 dark:text-slate-400 text-xs font-semibold">
                From £0.20 per task • Tap to view agents
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSelectedAICategory('testing')}
              className="bg-cyan-100 dark:bg-cyan-900/30 border border-cyan-200 dark:border-cyan-800 rounded-xl p-4 mb-3 active:opacity-70"
            >
              <View className="flex-row items-center mb-2">
                <Bot size={24} color="#06b6d4" />
                <Text className="text-cyan-900 dark:text-cyan-100 font-bold text-base ml-3">
                  Testing Agents ({getAgentsByCategory('testing').length})
                </Text>
              </View>
              <Text className="text-cyan-800 dark:text-cyan-200 text-sm mb-2">
                Tool Evaluator, API Tester, Workflow Optimizer, Performance Benchmarker, Test Results Analyzer
              </Text>
              <Text className="text-cyan-600 dark:text-cyan-400 text-xs font-semibold">
                From £0.50 per task • Tap to view agents
              </Text>
            </Pressable>

            <View className="bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-800 rounded-xl p-4 mt-4">
              <Text className="text-gray-900 dark:text-white font-semibold mb-2">
                💡 How AI Agents Work
              </Text>
              <Text className="text-gray-700 dark:text-slate-300 text-sm leading-5">
                AI agents are specialized tools that automate specific tasks in your workflow. Each agent has defined expertise, tools, and output formats. Some require human approval for quality control. Tap any category above to see detailed agent capabilities and pricing.
              </Text>
            </View>
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
                    setSelectedSupplier(null);
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

              {selectedSupplier && (
                <View className="px-6 py-6">
                  {/* Name and Type */}
                  <View className="mb-6">
                    <View className="flex-row items-center mb-3">
                      <View className="w-16 h-16 bg-amber-500 rounded-full items-center justify-center">
                        <Factory size={32} color="#fff" />
                      </View>
                      <View className="ml-4 flex-1">
                        <Text className="text-gray-900 dark:text-white text-2xl font-bold">
                          {selectedSupplier.name}
                        </Text>
                        <Text className="text-gray-600 dark:text-slate-400 text-base">
                          {selectedSupplier.type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center">
                      <Building2 size={16} color="#64748b" />
                      <Text className="text-gray-600 dark:text-slate-400 text-sm ml-2">
                        {selectedSupplier.location}
                      </Text>
                    </View>
                  </View>

                  {/* Specialization */}
                  <View className="mb-6">
                    <Text className="text-gray-900 dark:text-white font-bold text-lg mb-3">
                      Capabilities
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {selectedSupplier.specialization.map((spec, idx) => (
                        <View key={idx} className="bg-amber-100 dark:bg-amber-900/30 px-3 py-2 rounded-lg">
                          <Text className="text-amber-700 dark:text-amber-300 font-semibold">{spec}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Order Info */}
                  <View className="mb-6">
                    <Text className="text-gray-900 dark:text-white font-bold text-lg mb-3">
                      Order Information
                    </Text>
                    <View className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 border border-gray-300 dark:border-slate-800">
                      <View className="flex-row justify-between mb-3">
                        <Text className="text-gray-600 dark:text-slate-400">Min. Order Quantity</Text>
                        <Text className="text-gray-900 dark:text-white font-semibold">{selectedSupplier.minOrderQuantity}</Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-gray-600 dark:text-slate-400">Lead Time</Text>
                        <Text className="text-gray-900 dark:text-white font-semibold">{selectedSupplier.leadTime}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Certifications */}
                  <View className="mb-6">
                    <Text className="text-gray-900 dark:text-white font-bold text-lg mb-3">
                      Certifications
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {selectedSupplier.certifications.map((cert, idx) => (
                        <View key={idx} className="bg-emerald-100 dark:bg-emerald-900/30 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
                          <View className="flex-row items-center">
                            <CheckCircle2 size={14} color="#10b981" />
                            <Text className="text-emerald-700 dark:text-emerald-300 font-semibold ml-1">{cert}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Additional Info */}
                  <View className="mb-6">
                    <Text className="text-gray-900 dark:text-white font-bold text-lg mb-2">
                      About
                    </Text>
                    <Text className="text-gray-700 dark:text-slate-300 text-base leading-6">
                      {selectedSupplier.name} is a trusted {selectedSupplier.type.split('-').join(' ')} based in {selectedSupplier.location}. They specialize in {selectedSupplier.specialization.join(', ')} and hold certifications including {selectedSupplier.certifications.join(', ')}.
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
                      if (selectedSupplier) {
                        handleRequestAllocation('supplier', selectedSupplier);
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
                    setSelectedSupplier(null);
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
                  {requestType === 'supplier' ? selectedSupplier?.name : selectedCandidate?.name}
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

      {/* AI Category Agents List Modal */}
      <Modal visible={selectedAICategory !== null} transparent animationType="slide" onRequestClose={() => setSelectedAICategory(null)}>
        <View className="flex-1 bg-black/70">
          <View className="flex-1 bg-white dark:bg-slate-950 mt-16 rounded-t-3xl">
            {/* Header */}
            <View className="px-6 pt-6 pb-4 border-b border-gray-300 dark:border-slate-800">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-900 dark:text-white text-2xl font-bold">
                  {selectedAICategory && selectedAICategory.charAt(0).toUpperCase() + selectedAICategory.slice(1).replace('-', ' ')} Agents
                </Text>
                <Pressable
                  onPress={() => setSelectedAICategory(null)}
                  className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-900 active:opacity-70"
                >
                  <X size={24} color="#64748b" />
                </Pressable>
              </View>
              <Text className="text-gray-600 dark:text-slate-400 text-sm mt-1">
                {selectedAICategory && getAgentsByCategory(selectedAICategory).length} agents in this category
              </Text>
            </View>

            <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
              {selectedAICategory && getAgentsByCategory(selectedAICategory).map((agent) => (
                <Pressable
                  key={agent.id}
                  onPress={() => {
                    setSelectedAIAgent(agent);
                  }}
                  className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 mb-3 border border-gray-300 dark:border-slate-800 active:opacity-70"
                >
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1">
                      <Text className="text-gray-900 dark:text-white font-bold text-base mb-1">
                        {agent.name}
                      </Text>
                      <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">
                        {agent.description}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row flex-wrap gap-1 mb-3">
                    {agent.expertise.slice(0, 3).map((exp, idx) => (
                      <View key={idx} className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                        <Text className="text-blue-700 dark:text-blue-300 text-xs">{exp}</Text>
                      </View>
                    ))}
                    {agent.expertise.length > 3 && (
                      <View className="bg-gray-200 dark:bg-slate-800 px-2 py-1 rounded">
                        <Text className="text-gray-600 dark:text-slate-400 text-xs">+{agent.expertise.length - 3} more</Text>
                      </View>
                    )}
                  </View>

                  <View className="flex-row items-center justify-between pt-2 border-t border-gray-300 dark:border-slate-700">
                    <Text className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      {agent.estimatedCostPerTask}
                    </Text>
                    {agent.approvalRequired && (
                      <View className="bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded">
                        <Text className="text-amber-700 dark:text-amber-300 text-xs">Approval Required</Text>
                      </View>
                    )}
                    <Text className="text-blue-600 dark:text-blue-400 text-xs font-semibold">View Details →</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* AI Agent Detail Modal */}
      <Modal visible={selectedAIAgent !== null} transparent animationType="fade" onRequestClose={() => setSelectedAIAgent(null)}>
        <View className="flex-1 bg-black/70 justify-center items-center px-6">
          {selectedAIAgent && (
            <View className="bg-gray-100 dark:bg-slate-900 rounded-3xl w-full" style={{ maxHeight: '85%' }}>
              {/* Header */}
              <View className="px-6 pt-6 pb-4 border-b border-gray-300 dark:border-slate-800">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-gray-900 dark:text-white text-xl font-bold flex-1">{selectedAIAgent.name}</Text>
                  <Pressable onPress={() => setSelectedAIAgent(null)}>
                    <X size={24} color="#94a3b8" />
                  </Pressable>
                </View>
                <View className="flex-row items-center gap-2">
                  <View className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                    <Text className="text-blue-700 dark:text-blue-300 text-xs capitalize">
                      {selectedAIAgent.category.replace('-', ' ')}
                    </Text>
                  </View>
                  {selectedAIAgent.approvalRequired && (
                    <View className="bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded">
                      <Text className="text-amber-700 dark:text-amber-300 text-xs">Approval Required</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Scrollable Content */}
              <ScrollView showsVerticalScrollIndicator={true} bounces={false} className="flex-1">
                <View className="px-6 py-4">
                  <View className="bg-gray-200 dark:bg-slate-800 rounded-xl p-4 mb-4">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-gray-600 dark:text-slate-400">Estimated Cost:</Text>
                      <Text className="text-emerald-600 dark:text-emerald-400 text-lg font-bold">
                        {selectedAIAgent.estimatedCostPerTask}
                      </Text>
                    </View>
                  </View>

                  <View className="mb-4">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm mb-1">Description</Text>
                    <Text className="text-gray-900 dark:text-white text-base leading-6">
                      {selectedAIAgent.description}
                    </Text>
                  </View>

                  <View className="mb-4">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-2">Expertise</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {selectedAIAgent.expertise.map((exp, idx) => (
                        <View key={idx} className="bg-blue-100 dark:bg-blue-900/30 px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800">
                          <Text className="text-blue-700 dark:text-blue-300 font-semibold">{exp}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View className="mb-4">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-2">Tools & Integrations</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {selectedAIAgent.tools.map((tool, idx) => (
                        <View key={idx} className="bg-gray-200 dark:bg-slate-800 px-3 py-2 rounded-lg">
                          <Text className="text-gray-700 dark:text-slate-300">{tool}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View className="mb-4">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-2">Output Format</Text>
                    <View className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                      <Text className="text-emerald-700 dark:text-emerald-300 font-medium">
                        {selectedAIAgent.outputFormat}
                      </Text>
                    </View>
                  </View>

                  {selectedAIAgent.approvalRequired && (
                    <View className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4">
                      <Text className="text-amber-700 dark:text-amber-300 font-semibold mb-1">⚠️ Human Approval Required</Text>
                      <Text className="text-amber-600 dark:text-amber-400 text-sm">
                        This agent requires human review before outputs are deployed to production. This ensures quality control for critical operations.
                      </Text>
                    </View>
                  )}

                  <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                    <Text className="text-blue-700 dark:text-blue-300 text-sm font-semibold mb-2">💡 How to Deploy</Text>
                    <Text className="text-blue-600 dark:text-blue-400 text-sm">
                      To deploy this agent to your workspace, request allocation from the founder. Once approved, the agent will be available in the Make tab for task execution.
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
                      'Request Sent',
                      `Your request to deploy ${selectedAIAgent?.name} has been sent to the founder for approval.`,
                      [{ text: 'OK' }]
                    );
                  }}
                  className="bg-blue-500 rounded-xl py-4 items-center active:opacity-70"
                >
                  <Text className="text-white font-bold text-base">Request to Deploy</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}
