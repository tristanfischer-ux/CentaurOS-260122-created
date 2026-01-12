import { View, Text, ScrollView, Pressable, Linking, TextInput, Modal, Alert } from 'react-native';
import { useState } from 'react';
import { Building2, Users, Calendar, ExternalLink, MapPin, Package, ChevronRight, Search, X, Star, DollarSign, CalendarCheck, Award, Mail, Phone, Bot, Zap, CheckCircle, Globe, Heart } from 'lucide-react-native';
import { UK_SUPPLIERS } from '@/lib/suppliers-seed';
import { fractionalExecutives, apprentices, type Candidate } from '@/lib/candidates-seed';
import { AI_AGENTS, type AIAgent } from '@/lib/organization-seed';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

type NetworkTab = 'suppliers' | 'companies' | 'hiring' | 'ai-agents';

interface DisplaySupplier {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  location: string;
  website: string;
  verified: boolean;
}

// Transform supplier data for display
const DISPLAY_SUPPLIERS: DisplaySupplier[] = UK_SUPPLIERS.map((supplier, index) => ({
  id: (index + 1).toString(),
  name: supplier.name,
  description: supplier.description,
  capabilities: supplier.capabilities.slice(0, 3), // Show first 3 capabilities
  location: `${supplier.location.city}, ${supplier.location.country}`,
  website: supplier.contact.website || 'https://www.google.com',
  verified: supplier.status === 'verified',
}));

// Demo Companies Data
const DEMO_COMPANIES = [
  {
    id: '1',
    name: 'NeuroPulse Labs',
    location: 'Cambridge, UK',
    stage: 'Seed',
    industry: 'Medical Devices',
    description: 'Brain-computer interfaces for neurological rehabilitation',
    lookingFor: ['Co-founders', 'Advisors', 'Investors'],
    website: 'https://neuropulselabs.com',
    email: 'hello@neuropulselabs.com',
    phone: '+44 1223 123456',
  },
  {
    id: '2',
    name: 'GreenCharge Energy',
    location: 'Bristol, UK',
    stage: 'Series A',
    industry: 'Climate Tech',
    description: 'Integrated solar + battery systems for commercial buildings',
    lookingFor: ['Suppliers', 'Partnerships'],
    website: 'https://greenchargeenergy.co.uk',
    email: 'partnerships@greencharge.co.uk',
    phone: '+44 117 456 7890',
  },
  {
    id: '3',
    name: 'RoboFarm Systems',
    location: 'Edinburgh, UK',
    stage: 'Pre-seed',
    industry: 'AgTech',
    description: 'Autonomous farming robots for precision agriculture',
    lookingFor: ['Co-founders', 'Suppliers', 'Customers'],
    website: 'https://robofarmsystems.com',
    email: 'contact@robofarmsystems.com',
    phone: '+44 131 789 0123',
  },
  {
    id: '4',
    name: 'SonicWave Audio',
    location: 'Manchester, UK',
    stage: 'Seed',
    industry: 'Consumer Electronics',
    description: 'Next-generation hearing aids with AI noise cancellation',
    lookingFor: ['Advisors', 'Investors'],
    website: 'https://sonicwaveaudio.com',
    email: 'info@sonicwaveaudio.com',
    phone: '+44 161 234 5678',
  },
  {
    id: '5',
    name: 'EdgeSense IoT',
    location: 'Birmingham, UK',
    stage: 'Revenue',
    industry: 'Industrial IoT',
    description: 'Edge computing sensors for predictive maintenance',
    lookingFor: ['Customers', 'Partnerships'],
    website: 'https://edgesenseiot.com',
    email: 'sales@edgesenseiot.com',
    phone: '+44 121 567 8901',
  },
];

export default function NetworkScreen() {
  const [activeTab, setActiveTab] = useState<NetworkTab>('suppliers');
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [onboardingAgent, setOnboardingAgent] = useState<AIAgent | null>(null);
  const [monthlyCost, setMonthlyCost] = useState('');

  const tabs = [
    { id: 'suppliers' as NetworkTab, label: 'Suppliers', icon: Building2 },
    { id: 'ai-agents' as NetworkTab, label: 'AI Agents', icon: Bot },
    { id: 'companies' as NetworkTab, label: 'Companies', icon: Users },
    { id: 'hiring' as NetworkTab, label: 'Hiring', icon: Award },
  ];

  return (
    <View className="flex-1 bg-slate-950">
      {/* Discover Button */}
      <View className="px-6 pt-4 pb-2">
        <Pressable
          onPress={() => router.push('/swipe')}
          className="active:opacity-80"
        >
          <LinearGradient
            colors={['#ec4899', '#d946ef']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 16,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Heart size={20} color="#fff" fill="#fff" />
            <Text className="text-white font-bold text-base">
              Discover People, AI & Suppliers
            </Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Tab Selector */}
      <View className="flex-row border-b border-slate-800 bg-slate-950">{tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              className="flex-1 py-4 items-center active:opacity-70"
              style={{
                borderBottomWidth: isActive ? 2 : 0,
                borderBottomColor: isActive ? '#3b82f6' : 'transparent',
              }}
            >
              <Icon
                size={20}
                color={isActive ? '#3b82f6' : '#64748b'}
                strokeWidth={2}
              />
              <Text
                className={`text-xs mt-1 font-medium ${
                  isActive ? 'text-blue-500' : 'text-slate-500'
                }`}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Tab Content */}
      <ScrollView className="flex-1">
        {activeTab === 'suppliers' && <SuppliersTab />}
        {activeTab === 'ai-agents' && <AIAgentsTab selectedAgent={selectedAgent} setSelectedAgent={setSelectedAgent} onboardingAgent={onboardingAgent} setOnboardingAgent={setOnboardingAgent} monthlyCost={monthlyCost} setMonthlyCost={setMonthlyCost} />}
        {activeTab === 'companies' && <CompaniesTab />}
        {activeTab === 'hiring' && <HiringTab />}
      </ScrollView>
    </View>
  );
}

// Suppliers Tab - UK Manufacturing Directory
function SuppliersTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCapability, setSelectedCapability] = useState<string | null>(null);

  const handleVisitWebsite = (url: string) => {
    Linking.openURL(url);
  };

  // Get all unique capabilities for filter chips
  const allCapabilities = Array.from(
    new Set(DISPLAY_SUPPLIERS.flatMap((s) => s.capabilities))
  ).sort();

  // Filter suppliers based on search and capability
  const filteredSuppliers = DISPLAY_SUPPLIERS.filter((supplier) => {
    const matchesSearch =
      searchQuery === '' ||
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.capabilities.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCapability =
      !selectedCapability || supplier.capabilities.includes(selectedCapability);

    return matchesSearch && matchesCapability;
  });

  return (
    <View className="p-6">
      <View className="mb-6">
        <Text className="text-white text-2xl font-bold mb-2">UK Supplier Network</Text>
        <Text className="text-slate-400 text-sm">
          {DISPLAY_SUPPLIERS.length} verified manufacturing suppliers across the UK
        </Text>
      </View>

      {/* Search Bar */}
      <View className="mb-4">
        <View className="bg-slate-900 rounded-xl flex-row items-center px-4 py-3 border border-slate-800">
          <Search size={20} color="#64748b" />
          <TextInput
            className="flex-1 text-white ml-3 text-base"
            placeholder="Search suppliers, capabilities, or location..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} className="ml-2">
              <X size={20} color="#64748b" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Capability Filter Chips */}
      <View className="mb-4">
        <Text className="text-slate-400 text-xs font-semibold mb-2 uppercase">
          Filter by Capability
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setSelectedCapability(null)}
              className={`px-4 py-2 rounded-full border ${
                selectedCapability === null
                  ? 'bg-blue-500 border-blue-500'
                  : 'bg-slate-900 border-slate-700'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  selectedCapability === null ? 'text-white' : 'text-slate-400'
                }`}
              >
                All
              </Text>
            </Pressable>
            {allCapabilities.map((capability) => (
              <Pressable
                key={capability}
                onPress={() => setSelectedCapability(capability)}
                className={`px-4 py-2 rounded-full border ${
                  selectedCapability === capability
                    ? 'bg-blue-500 border-blue-500'
                    : 'bg-slate-900 border-slate-700'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    selectedCapability === capability ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  {capability}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Results Count */}
      <Text className="text-slate-500 text-sm mb-4">
        {filteredSuppliers.length} {filteredSuppliers.length === 1 ? 'supplier' : 'suppliers'} found
      </Text>

      {/* Suppliers List */}
      <View className="gap-4">
        {filteredSuppliers.length === 0 ? (
          <View className="bg-slate-900 rounded-2xl p-8 border border-slate-800 items-center">
            <Search size={48} color="#64748b" />
            <Text className="text-white text-lg font-semibold mt-4 mb-2">
              No suppliers found
            </Text>
            <Text className="text-slate-400 text-center text-sm">
              Try adjusting your search or filters
            </Text>
          </View>
        ) : (
          filteredSuppliers.map((supplier) => (
            <View
              key={supplier.id}
              className="bg-slate-900 rounded-2xl p-4 border border-slate-800"
            >
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1 mr-3">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Text className="text-white text-lg font-semibold">{supplier.name}</Text>
                    {supplier.verified && (
                      <View className="bg-blue-950 px-2 py-0.5 rounded-full">
                        <Text className="text-blue-400 text-[10px] font-semibold">VERIFIED</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-slate-400 text-sm mb-2">{supplier.description}</Text>
                  <View className="flex-row items-center gap-1">
                    <MapPin size={14} color="#64748b" />
                    <Text className="text-slate-500 text-xs">{supplier.location}</Text>
                  </View>
                </View>
                <Building2 size={24} color="#64748b" />
              </View>

              <View className="flex-row flex-wrap gap-2 mb-3">
                {supplier.capabilities.map((capability, idx) => (
                  <View key={idx} className="bg-slate-800 px-3 py-1 rounded-full">
                    <Text className="text-slate-300 text-xs">{capability}</Text>
                  </View>
                ))}
              </View>

              <Pressable
                onPress={() => handleVisitWebsite(supplier.website)}
                className="flex-row items-center justify-center bg-blue-500 rounded-xl py-2.5 active:opacity-80"
              >
                <ExternalLink size={16} color="white" />
                <Text className="text-white font-semibold ml-2 text-sm">Visit Website</Text>
              </Pressable>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

// Companies Tab - Company Discovery & Networking
function CompaniesTab() {
  const [selectedCompany, setSelectedCompany] = useState<typeof DEMO_COMPANIES[0] | null>(null);

  return (
    <>
      <View className="p-6">
        <View className="mb-6">
          <Text className="text-white text-2xl font-bold mb-2">Company Directory</Text>
          <Text className="text-slate-400 text-sm">
            Connect with {DEMO_COMPANIES.length} hardware startups using Centaur OS
          </Text>
        </View>

        <View className="gap-4">
          {DEMO_COMPANIES.map((company) => (
            <Pressable
              key={company.id}
              onPress={() => setSelectedCompany(company)}
              className="bg-slate-900 rounded-2xl p-4 border border-slate-800 active:opacity-70"
            >
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1 mr-3">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Text className="text-white text-lg font-semibold">{company.name}</Text>
                    <View className="bg-emerald-950 px-2 py-0.5 rounded-full">
                      <Text className="text-emerald-400 text-[10px] font-semibold">{company.stage.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text className="text-slate-400 text-sm mb-2">{company.description}</Text>
                  <View className="flex-row items-center gap-3 mb-2">
                    <View className="flex-row items-center gap-1">
                      <MapPin size={14} color="#64748b" />
                      <Text className="text-slate-500 text-xs">{company.location}</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <Package size={14} color="#64748b" />
                      <Text className="text-slate-500 text-xs">{company.industry}</Text>
                    </View>
                  </View>
                </View>
                <Users size={24} color="#64748b" />
              </View>

              <View className="mb-3">
                <Text className="text-slate-500 text-xs mb-2">Looking for:</Text>
                <View className="flex-row flex-wrap gap-2">
                  {company.lookingFor.map((item, idx) => (
                    <View key={idx} className="bg-slate-800 px-3 py-1 rounded-full">
                      <Text className="text-slate-300 text-xs">{item}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View className="flex-row items-center justify-center bg-slate-800 rounded-xl py-2.5 border border-slate-700">
                <Text className="text-white font-semibold text-sm">View Details</Text>
                <ChevronRight size={16} color="white" className="ml-1" />
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Company Detail Modal */}
      <Modal visible={selectedCompany !== null} transparent animationType="fade">
        <View className="flex-1 bg-black/70 justify-center px-6">
          {selectedCompany && (
            <View className="bg-slate-900 rounded-3xl p-6" style={{ maxHeight: '80%' }}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-white text-xl font-bold">{selectedCompany.name}</Text>
                  <Pressable onPress={() => setSelectedCompany(null)}>
                    <X size={24} color="#94a3b8" />
                  </Pressable>
                </View>

                <View className="bg-slate-800 rounded-xl p-4 mb-4">
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-slate-400 text-sm">Industry:</Text>
                    <Text className="text-white font-semibold">{selectedCompany.industry}</Text>
                  </View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-slate-400 text-sm">Stage:</Text>
                    <Text className="text-emerald-400 font-semibold">{selectedCompany.stage}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-slate-400 text-sm">Location:</Text>
                    <Text className="text-white font-semibold">{selectedCompany.location}</Text>
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-slate-400 text-sm mb-2">About</Text>
                  <Text className="text-slate-300">{selectedCompany.description}</Text>
                </View>

                <View className="mb-4">
                  <Text className="text-slate-400 text-sm mb-2">Looking for:</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {selectedCompany.lookingFor.map((item, idx) => (
                      <View key={idx} className="bg-blue-500/20 px-3 py-1.5 rounded-lg">
                        <Text className="text-blue-400 text-xs font-medium">{item}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <Text className="text-white font-semibold mb-3">Contact</Text>

                <View className="gap-3">
                  <Pressable
                    onPress={() => Linking.openURL(selectedCompany.website)}
                    className="bg-blue-500 py-3 rounded-xl flex-row items-center justify-center gap-2 active:opacity-80"
                  >
                    <Globe size={18} color="#fff" />
                    <Text className="text-white font-semibold">Visit Website</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => Linking.openURL(`mailto:${selectedCompany.email}`)}
                    className="bg-slate-800 py-3 rounded-xl flex-row items-center justify-center gap-2 border border-slate-700 active:opacity-80"
                  >
                    <Mail size={18} color="#fff" />
                    <Text className="text-white font-semibold">Send Email</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => Linking.openURL(`tel:${selectedCompany.phone}`)}
                    className="bg-slate-800 py-3 rounded-xl flex-row items-center justify-center gap-2 border border-slate-700 active:opacity-80"
                  >
                    <Phone size={18} color="#fff" />
                    <Text className="text-white font-semibold">Call</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}

// Hiring Tab - Fractional Executives and Apprentices
function HiringTab() {
  const [hiringType, setHiringType] = useState<'exec' | 'apprentice'>('exec');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSpecialization, setFilterSpecialization] = useState<string>('all');

  const candidates = hiringType === 'exec' ? fractionalExecutives : apprentices;

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         candidate.bio.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialization = filterSpecialization === 'all' ||
                                  candidate.specialization.includes(filterSpecialization as any);
    return matchesSearch && matchesSpecialization;
  });

  const handleHireCandidate = (candidate: Candidate) => {
    alert(`${candidate.name} has been added to your team! They will appear in your workspace shortly.`);
    setSelectedCandidate(null);
  };

  const handleEmailPress = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handlePhonePress = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <View className="p-6">
      <View className="mb-6">
        <Text className="text-white text-2xl font-bold mb-2">Hire Talent</Text>
        <Text className="text-slate-400 text-sm">
          Browse {hiringType === 'exec' ? '30 Fractional Executives' : '30 Apprentices'} to build your team
        </Text>
      </View>

      {/* Type Toggle */}
      <View className="flex-row gap-2 mb-4">
        <Pressable
          onPress={() => setHiringType('exec')}
          className={`flex-1 py-3 rounded-xl ${
            hiringType === 'exec' ? 'bg-blue-500' : 'bg-slate-800'
          }`}
        >
          <Text className={`text-center font-semibold ${
            hiringType === 'exec' ? 'text-white' : 'text-slate-400'
          }`}>
            Executives
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setHiringType('apprentice')}
          className={`flex-1 py-3 rounded-xl ${
            hiringType === 'apprentice' ? 'bg-emerald-500' : 'bg-slate-800'
          }`}
        >
          <Text className={`text-center font-semibold ${
            hiringType === 'apprentice' ? 'text-white' : 'text-slate-400'
          }`}>
            Apprentices
          </Text>
        </Pressable>
      </View>

      {/* Search */}
      <View className="mb-4">
        <View className="bg-slate-900 rounded-xl flex-row items-center px-4 py-3 border border-slate-800">
          <Search size={20} color="#64748b" />
          <TextInput
            className="flex-1 text-white ml-3 text-base"
            placeholder="Search by name or skills..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} className="ml-2">
              <X size={20} color="#64748b" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Specialization Filter */}
      <View className="mb-4">
        <Text className="text-slate-400 text-xs font-semibold mb-2 uppercase">
          Filter by Specialization
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
          <View className="flex-row gap-2">
            {['all', 'Sales', 'Marketing', 'Finance', 'Engineering', 'Ops', 'Admin'].map((spec) => (
              <Pressable
                key={spec}
                onPress={() => setFilterSpecialization(spec)}
                className={`px-4 py-2 rounded-full border ${
                  filterSpecialization === spec
                    ? 'bg-blue-500 border-blue-500'
                    : 'bg-slate-900 border-slate-700'
                }`}
              >
                <Text className={`text-xs font-semibold ${
                  filterSpecialization === spec ? 'text-white' : 'text-slate-400'
                }`}>
                  {spec === 'all' ? 'All' : spec}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Results Count */}
      <Text className="text-slate-500 text-sm mb-4">
        {filteredCandidates.length} {filteredCandidates.length === 1 ? 'candidate' : 'candidates'} found
      </Text>

      {/* Candidates List */}
      <View className="gap-3 pb-6">
        {filteredCandidates.map((candidate) => (
          <Pressable
            key={candidate.id}
            onPress={() => setSelectedCandidate(candidate)}
            className="bg-slate-900 rounded-2xl p-4 border border-slate-800 active:opacity-70"
          >
            <View className="flex-row items-start">
              {/* Avatar */}
              <View
                className="w-14 h-14 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: candidate.avatarColor + '20' }}
              >
                <Text
                  className="text-xl font-bold"
                  style={{ color: candidate.avatarColor }}
                >
                  {candidate.name.charAt(0)}
                </Text>
              </View>

              {/* Info */}
              <View className="flex-1">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-white font-bold text-base">{candidate.name}</Text>
                  <View className="flex-row items-center">
                    <Star size={14} color="#f59e0b" fill="#f59e0b" />
                    <Text className="text-slate-300 text-sm ml-1">{candidate.rating}</Text>
                  </View>
                </View>

                <Text className="text-slate-400 text-xs mb-2">
                  {candidate.specialization.join(' • ')} • {candidate.experience}y exp
                </Text>

                <Text className="text-slate-300 text-sm mb-3" numberOfLines={2}>
                  {candidate.bio}
                </Text>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <View className="flex-row items-center">
                      <DollarSign size={14} color="#10b981" />
                      <Text className="text-emerald-400 text-sm font-semibold">
                        £{candidate.costPerDay}/day
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <CalendarCheck size={14} color="#3b82f6" />
                      <Text className="text-blue-400 text-xs ml-1">
                        {candidate.availability}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </Pressable>
        ))}

        {filteredCandidates.length === 0 && (
          <View className="items-center justify-center py-12">
            <Users size={48} color="#475569" />
            <Text className="text-slate-400 text-center mt-4">
              No candidates match your filters
            </Text>
          </View>
        )}
      </View>

      {/* Candidate Detail Modal */}
      <Modal visible={selectedCandidate !== null} transparent animationType="slide">
        <View className="flex-1 bg-black/70 justify-end">
          {selectedCandidate && (
            <View className="bg-slate-900 rounded-t-3xl" style={{ maxHeight: '90%' }}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="p-6">
                  {/* Header */}
                  <View className="flex-row items-start justify-between mb-6">
                    <View className="flex-1">
                      <View
                        className="w-20 h-20 rounded-full items-center justify-center mb-3"
                        style={{ backgroundColor: selectedCandidate.avatarColor + '20' }}
                      >
                        <Text
                          className="text-3xl font-bold"
                          style={{ color: selectedCandidate.avatarColor }}
                        >
                          {selectedCandidate.name.charAt(0)}
                        </Text>
                      </View>
                      <Text className="text-white text-2xl font-bold mb-1">
                        {selectedCandidate.name}
                      </Text>
                      <Text className="text-slate-400 text-sm mb-2">
                        {selectedCandidate.specialization.join(' • ')}
                      </Text>
                      <View className="flex-row items-center">
                        <Star size={16} color="#f59e0b" fill="#f59e0b" />
                        <Text className="text-slate-300 text-base ml-1 font-semibold">
                          {selectedCandidate.rating} rating
                        </Text>
                      </View>
                    </View>
                    <Pressable onPress={() => setSelectedCandidate(null)}>
                      <X size={24} color="#94a3b8" />
                    </Pressable>
                  </View>

                  {/* Stats */}
                  <View className="flex-row gap-3 mb-6">
                    <View className="flex-1 bg-slate-800 rounded-xl p-3">
                      <Text className="text-slate-400 text-xs mb-1">Experience</Text>
                      <Text className="text-white font-bold">{selectedCandidate.experience} years</Text>
                    </View>
                    <View className="flex-1 bg-slate-800 rounded-xl p-3">
                      <Text className="text-slate-400 text-xs mb-1">Daily Rate</Text>
                      <Text className="text-emerald-400 font-bold">£{selectedCandidate.costPerDay}</Text>
                    </View>
                    <View className="flex-1 bg-slate-800 rounded-xl p-3">
                      <Text className="text-slate-400 text-xs mb-1">Available</Text>
                      <Text className="text-blue-400 font-bold text-xs">
                        {selectedCandidate.availability.replace('Available ', '')}
                      </Text>
                    </View>
                  </View>

                  {/* Contact Info */}
                  <View className="mb-6">
                    <Text className="text-white font-semibold mb-3">Contact Information</Text>

                    <Pressable
                      onPress={() => handleEmailPress(selectedCandidate.email)}
                      className="flex-row items-center mb-3 active:opacity-70"
                    >
                      <View className="w-10 h-10 bg-blue-500/20 rounded-lg items-center justify-center mr-3">
                        <Mail size={18} color="#3b82f6" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-slate-400 text-xs">Email</Text>
                        <Text className="text-white text-sm">{selectedCandidate.email}</Text>
                      </View>
                    </Pressable>

                    <Pressable
                      onPress={() => handlePhonePress(selectedCandidate.phone)}
                      className="flex-row items-center mb-3 active:opacity-70"
                    >
                      <View className="w-10 h-10 bg-emerald-500/20 rounded-lg items-center justify-center mr-3">
                        <Phone size={18} color="#10b981" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-slate-400 text-xs">Phone</Text>
                        <Text className="text-white text-sm">{selectedCandidate.phone}</Text>
                      </View>
                    </Pressable>

                    <View className="flex-row items-center">
                      <View className="w-10 h-10 bg-purple-500/20 rounded-lg items-center justify-center mr-3">
                        <MapPin size={18} color="#8b5cf6" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-slate-400 text-xs">Location</Text>
                        <Text className="text-white text-sm">{selectedCandidate.location}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Bio */}
                  <View className="mb-6">
                    <Text className="text-white font-semibold mb-2">About</Text>
                    <Text className="text-slate-300 text-sm leading-5">
                      {selectedCandidate.bio}
                    </Text>
                  </View>

                  {/* Education */}
                  {selectedCandidate.education && (
                    <View className="mb-6">
                      <Text className="text-white font-semibold mb-2">Education</Text>
                      <Text className="text-slate-300 text-sm">{selectedCandidate.education}</Text>
                    </View>
                  )}

                  {/* Certifications */}
                  {selectedCandidate.certifications && selectedCandidate.certifications.length > 0 && (
                    <View className="mb-6">
                      <Text className="text-white font-semibold mb-2">Certifications</Text>
                      <View className="flex-row flex-wrap gap-2">
                        {selectedCandidate.certifications.map((cert, idx) => (
                          <View key={idx} className="bg-purple-500/20 px-3 py-1.5 rounded-lg">
                            <Text className="text-purple-400 text-xs font-medium">{cert}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Skills */}
                  <View className="mb-6">
                    <Text className="text-white font-semibold mb-2">Key Skills</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {selectedCandidate.skills.map((skill, idx) => (
                        <View key={idx} className="bg-blue-500/20 px-3 py-1.5 rounded-lg">
                          <Text className="text-blue-400 text-xs font-medium">{skill}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Achievements */}
                  {selectedCandidate.achievements && selectedCandidate.achievements.length > 0 && (
                    <View className="mb-6">
                      <Text className="text-white font-semibold mb-2">Key Achievements</Text>
                      <View className="gap-2">
                        {selectedCandidate.achievements.map((achievement, idx) => (
                          <View key={idx} className="flex-row items-start">
                            <Text className="text-emerald-400 mr-2">•</Text>
                            <Text className="text-slate-300 text-sm flex-1">{achievement}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Previous Companies */}
                  <View className="mb-6">
                    <Text className="text-white font-semibold mb-2">Previous Experience</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {selectedCandidate.previousCompanies.map((company, idx) => (
                        <View key={idx} className="bg-slate-800 px-3 py-1.5 rounded-lg">
                          <Text className="text-slate-300 text-xs font-medium">{company}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View className="gap-3">
                    <Pressable
                      onPress={() => handleHireCandidate(selectedCandidate)}
                      className="bg-blue-500 py-4 rounded-xl active:opacity-80"
                    >
                      <Text className="text-white text-center font-bold text-base">
                        Add to Team
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setSelectedCandidate(null)}
                      className="bg-slate-800 py-3 rounded-xl active:opacity-80"
                    >
                      <Text className="text-slate-400 text-center font-semibold">Close</Text>
                    </Pressable>
                  </View>
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

// Agent Card Component
function AgentCard({ agent, onPress, getFunctionColor }: {
  agent: AIAgent;
  onPress: () => void;
  getFunctionColor: (func: string) => string;
}) {
  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'OpenAI': return '#10b981';
      case 'Anthropic': return '#f59e0b';
      case 'Google': return '#3b82f6';
      case 'ElevenLabs': return '#8b5cf6';
      case 'Vic.ai': return '#10b981';
      case 'Digits': return '#10b981';
      case '11x': return '#3b82f6';
      case 'Gong': return '#3b82f6';
      case 'Clay': return '#3b82f6';
      case 'Jasper': return '#f59e0b';
      case 'Copy.ai': return '#f59e0b';
      case 'Midjourney': return '#8b5cf6';
      case 'Perplexity': return '#64748b';
      case 'Runway': return '#8b5cf6';
      case 'Hebbia': return '#8b5cf6';
      case 'Zapier': return '#f59e0b';
      case 'Harvey': return '#3b82f6';
      case 'Cursor': return '#06b6d4';
      case 'Replit': return '#06b6d4';
      case 'Tabnine': return '#10b981';
      case 'Notion': return '#64748b';
      case 'Otter.ai': return '#3b82f6';
      case 'Grammarly': return '#10b981';
      default: return '#64748b';
    }
  };

  return (
    <Pressable
      onPress={onPress}
      className="bg-slate-900 rounded-2xl p-4 border border-slate-800 active:opacity-70"
    >
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <Bot size={20} color={getProviderColor(agent.provider)} />
            <Text className="text-white text-lg font-bold">{agent.name}</Text>
          </View>
          <View className="flex-row items-center gap-2 mb-2">
            <View
              className="px-2 py-1 rounded"
              style={{ backgroundColor: getProviderColor(agent.provider) + '20' }}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: getProviderColor(agent.provider) }}
              >
                {agent.provider}
              </Text>
            </View>
            <Text className="text-slate-500 text-xs">•</Text>
            <Text className="text-slate-400 text-xs">{agent.model}</Text>
          </View>
        </View>
        <View className="items-end">
          <Text className="text-emerald-400 text-xl font-bold">£{agent.costPerMonth}</Text>
          <Text className="text-slate-500 text-xs">per month</Text>
        </View>
      </View>

      <Text className="text-slate-300 text-sm mb-3">{agent.purpose}</Text>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Zap size={14} color="#64748b" />
          <Text className="text-slate-400 text-xs">
            {agent.capabilities.length} capabilities
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <ChevronRight size={16} color="#3b82f6" />
          <Text className="text-blue-400 text-xs font-semibold">View Details</Text>
        </View>
      </View>
    </Pressable>
  );
}

// AI Agents Tab - Browse and onboard AI tools organized by function
function AIAgentsTab({ selectedAgent, setSelectedAgent, onboardingAgent, setOnboardingAgent, monthlyCost, setMonthlyCost }: {
  selectedAgent: AIAgent | null;
  setSelectedAgent: (agent: AIAgent | null) => void;
  onboardingAgent: AIAgent | null;
  setOnboardingAgent: (agent: AIAgent | null) => void;
  monthlyCost: string;
  setMonthlyCost: (cost: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);

  const handleOnboard = () => {
    if (!onboardingAgent || !monthlyCost.trim()) {
      Alert.alert('Error', 'Please enter the monthly cost');
      return;
    }

    Alert.alert(
      'Success',
      `${onboardingAgent.name} has been onboarded!\nMonthly cost: £${monthlyCost}`,
      [
        {
          text: 'OK',
          onPress: () => {
            setOnboardingAgent(null);
            setMonthlyCost('');
          }
        }
      ]
    );
  };

  // Get unique functions from AI agents
  const functions = ['Finance', 'Sales', 'Marketing', 'Ops', 'Engineering', 'Admin'];

  const filteredAgents = AI_AGENTS.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.capabilities.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFunction = !selectedFunction ||
                           agent.functions.includes(selectedFunction) ||
                           agent.functions.includes('All') ||
                           agent.functions.includes('Admin');
    return matchesSearch && matchesFunction;
  });

  // Group agents by function for display
  const agentsByFunction = functions.reduce((acc, func) => {
    const funcAgents = filteredAgents.filter(agent =>
      agent.functions.includes(func) || agent.functions.includes('All') || agent.functions.includes('Admin')
    );
    if (funcAgents.length > 0) {
      acc[func] = funcAgents;
    }
    return acc;
  }, {} as Record<string, typeof AI_AGENTS>);

  const getFunctionColor = (func: string) => {
    switch (func) {
      case 'Finance': return '#10b981';
      case 'Sales': return '#3b82f6';
      case 'Marketing': return '#f59e0b';
      case 'Ops': return '#8b5cf6';
      case 'Engineering': return '#06b6d4';
      case 'Admin': return '#64748b';
      default: return '#64748b';
    }
  };

  const getFunctionIcon = (func: string) => {
    switch (func) {
      case 'Finance': return '💰';
      case 'Sales': return '📈';
      case 'Marketing': return '📣';
      case 'Ops': return '⚙️';
      case 'Engineering': return '💻';
      case 'Admin': return '📋';
      default: return '🤖';
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'OpenAI': return '#10b981';
      case 'Anthropic': return '#f59e0b';
      case 'Google': return '#3b82f6';
      case 'ElevenLabs': return '#8b5cf6';
      case 'Vic.ai': return '#10b981';
      case 'Digits': return '#10b981';
      case '11x': return '#3b82f6';
      case 'Gong': return '#3b82f6';
      case 'Clay': return '#3b82f6';
      case 'Jasper': return '#f59e0b';
      case 'Copy.ai': return '#f59e0b';
      case 'Midjourney': return '#8b5cf6';
      case 'Perplexity': return '#64748b';
      case 'Runway': return '#8b5cf6';
      case 'Hebbia': return '#8b5cf6';
      case 'Zapier': return '#f59e0b';
      case 'Harvey': return '#3b82f6';
      case 'Cursor': return '#06b6d4';
      case 'Replit': return '#06b6d4';
      case 'Tabnine': return '#10b981';
      case 'Notion': return '#64748b';
      case 'Otter.ai': return '#3b82f6';
      case 'Grammarly': return '#10b981';
      default: return '#64748b';
    }
  };

  return (
    <View className="flex-1">
      {/* Header */}
      <View className="p-6 border-b border-slate-800">
        <Text className="text-white text-2xl font-bold mb-2">AI Agents Directory</Text>
        <Text className="text-slate-400 text-sm">
          Browse AI agents by function - Finance, Sales, Marketing, Ops, Engineering, Admin
        </Text>
      </View>

      {/* Search */}
      <View className="p-6 pb-4 border-b border-slate-800">
        <View className="flex-row items-center bg-slate-900 rounded-xl px-4 py-3 border border-slate-800">
          <Search size={20} color="#64748b" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search AI agents..."
            placeholderTextColor="#64748b"
            className="flex-1 ml-3 text-white"
          />
        </View>

        {/* Function Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4" style={{ flexGrow: 0 }}>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setSelectedFunction(null)}
              className={`px-4 py-2 rounded-xl border ${
                !selectedFunction ? 'bg-blue-500 border-blue-500' : 'bg-slate-800 border-slate-700'
              }`}
            >
              <Text className={`text-sm font-medium ${!selectedFunction ? 'text-white' : 'text-slate-400'}`}>
                All Functions
              </Text>
            </Pressable>
            {functions.map(func => {
              const count = AI_AGENTS.filter(a =>
                a.functions.includes(func) || a.functions.includes('All') || a.functions.includes('Admin')
              ).length;
              return (
                <Pressable
                  key={func}
                  onPress={() => setSelectedFunction(func)}
                  className={`px-4 py-2 rounded-xl border ${
                    selectedFunction === func ? 'bg-blue-500 border-blue-500' : 'bg-slate-800 border-slate-700'
                  }`}
                >
                  <Text className={`text-sm font-medium ${selectedFunction === func ? 'text-white' : 'text-slate-400'}`}>
                    {getFunctionIcon(func)} {func} ({count})
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* AI Agents List - Organized by Function */}
      <ScrollView className="flex-1">
        {selectedFunction ? (
          /* Show selected function only */
          <View className="p-6">
            <View className="mb-6">
              <View className="flex-row items-center gap-2 mb-4">
                <Text className="text-3xl">{getFunctionIcon(selectedFunction)}</Text>
                <Text className="text-white text-xl font-bold">{selectedFunction}</Text>
                <View className="bg-slate-800 px-3 py-1 rounded-full">
                  <Text className="text-slate-400 text-xs font-semibold">
                    {filteredAgents.length} agent{filteredAgents.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
              <View className="gap-4">
                {filteredAgents.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    onPress={() => setSelectedAgent(agent)}
                    getFunctionColor={getFunctionColor}
                  />
                ))}
              </View>
            </View>
          </View>
        ) : (
          /* Show all functions grouped */
          <View className="p-6">
            {functions.map(func => {
              const funcAgents = agentsByFunction[func];
              if (!funcAgents || funcAgents.length === 0) return null;

              return (
                <View key={func} className="mb-6">
                  <View className="flex-row items-center gap-2 mb-4">
                    <Text className="text-3xl">{getFunctionIcon(func)}</Text>
                    <Text className="text-white text-xl font-bold">{func}</Text>
                    <View className="bg-slate-800 px-3 py-1 rounded-full">
                      <Text className="text-slate-400 text-xs font-semibold">
                        {funcAgents.length} agent{funcAgents.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                  <View className="gap-4">
                    {funcAgents.map((agent) => (
                      <AgentCard
                        key={agent.id}
                        agent={agent}
                        onPress={() => setSelectedAgent(agent)}
                        getFunctionColor={getFunctionColor}
                      />
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Agent Detail Modal */}
      <Modal visible={selectedAgent !== null} transparent animationType="slide">
        <View className="flex-1 bg-black/70 justify-end">
          {selectedAgent && (
            <View className="bg-slate-900 rounded-t-3xl" style={{ maxHeight: '90%' }}>
              <View className="flex-row items-center justify-between p-6 pb-4 border-b border-slate-800">
                <Text className="text-white text-xl font-bold">AI Agent Details</Text>
                <Pressable onPress={() => setSelectedAgent(null)}>
                  <X size={24} color="#94a3b8" />
                </Pressable>
              </View>

              <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={false}>
                <View className="gap-6">
                  {/* Header */}
                  <View className="flex-row items-start gap-3">
                    <View
                      className="w-12 h-12 rounded-xl items-center justify-center"
                      style={{ backgroundColor: getProviderColor(selectedAgent.provider) + '20' }}
                    >
                      <Bot size={24} color={getProviderColor(selectedAgent.provider)} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white text-xl font-bold mb-1">{selectedAgent.name}</Text>
                      <Text className="text-slate-400 text-sm mb-2">{selectedAgent.model}</Text>
                      <View
                        className="self-start px-3 py-1 rounded-lg"
                        style={{ backgroundColor: getProviderColor(selectedAgent.provider) + '20' }}
                      >
                        <Text
                          className="text-sm font-semibold"
                          style={{ color: getProviderColor(selectedAgent.provider) }}
                        >
                          {selectedAgent.provider}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Cost */}
                  <View className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-4">
                    <Text className="text-slate-400 text-sm mb-1">Monthly Cost</Text>
                    <Text className="text-emerald-400 text-3xl font-bold">£{selectedAgent.costPerMonth}</Text>
                  </View>

                  {/* Purpose */}
                  <View>
                    <Text className="text-white font-semibold mb-2">Purpose</Text>
                    <Text className="text-slate-300 text-sm leading-5">{selectedAgent.purpose}</Text>
                  </View>

                  {/* Capabilities */}
                  <View>
                    <Text className="text-white font-semibold mb-3">Capabilities</Text>
                    <View className="gap-2">
                      {selectedAgent.capabilities.map((capability, idx) => (
                        <View key={idx} className="flex-row items-start">
                          <CheckCircle size={16} color="#10b981" style={{ marginTop: 2 }} />
                          <Text className="text-slate-300 text-sm flex-1 ml-2">{capability}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Business Functions */}
                  <View>
                    <Text className="text-white font-semibold mb-2">Business Functions</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {selectedAgent.functions.map((func, idx) => (
                        <View key={idx} className="bg-blue-500/20 px-3 py-1.5 rounded-lg">
                          <Text className="text-blue-400 text-xs font-medium">{func}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Integrations */}
                  <View>
                    <Text className="text-white font-semibold mb-2">Integrations</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {selectedAgent.integrations.map((integration, idx) => (
                        <View key={idx} className="bg-slate-800 px-3 py-1.5 rounded-lg">
                          <Text className="text-slate-300 text-xs font-medium">{integration}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Usage Stats */}
                  {selectedAgent.usageStats && (
                    <View>
                      <Text className="text-white font-semibold mb-3">Usage Statistics</Text>
                      <View className="flex-row gap-3">
                        <View className="flex-1 bg-slate-800 rounded-xl p-3">
                          <Text className="text-slate-400 text-xs mb-1">Requests</Text>
                          <Text className="text-white font-bold">{selectedAgent.usageStats.requestsThisMonth.toLocaleString()}</Text>
                          <Text className="text-slate-500 text-xs">this month</Text>
                        </View>
                        <View className="flex-1 bg-slate-800 rounded-xl p-3">
                          <Text className="text-slate-400 text-xs mb-1">Response Time</Text>
                          <Text className="text-white font-bold">{selectedAgent.usageStats.averageResponseTime}</Text>
                          <Text className="text-slate-500 text-xs">average</Text>
                        </View>
                        <View className="flex-1 bg-slate-800 rounded-xl p-3">
                          <Text className="text-slate-400 text-xs mb-1">Success Rate</Text>
                          <Text className="text-emerald-400 font-bold">{selectedAgent.usageStats.successRate}%</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Action Buttons */}
                  <View className="gap-3 pb-4">
                    <Pressable
                      onPress={() => {
                        setOnboardingAgent(selectedAgent);
                        setSelectedAgent(null);
                      }}
                      className="bg-blue-500 py-4 rounded-xl active:opacity-80"
                    >
                      <Text className="text-white text-center font-bold text-base">
                        Onboard This Agent
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setSelectedAgent(null)}
                      className="bg-slate-800 py-3 rounded-xl active:opacity-80"
                    >
                      <Text className="text-slate-400 text-center font-semibold">Close</Text>
                    </Pressable>
                  </View>
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>

      {/* Onboarding Modal */}
      <Modal visible={onboardingAgent !== null} transparent animationType="fade">
        <View className="flex-1 bg-black/70 justify-center px-6">
          {onboardingAgent && (
            <View className="bg-slate-900 rounded-3xl p-6">
              <Text className="text-white text-2xl font-bold mb-2">Onboard AI Agent</Text>
              <Text className="text-slate-400 text-sm mb-6">
                Set up {onboardingAgent.name} for your team
              </Text>

              <View className="bg-slate-800 rounded-xl p-4 mb-6">
                <View className="flex-row items-center gap-3 mb-2">
                  <Bot size={20} color={getProviderColor(onboardingAgent.provider)} />
                  <Text className="text-white font-semibold text-lg">{onboardingAgent.name}</Text>
                </View>
                <Text className="text-slate-400 text-sm">{onboardingAgent.provider} • {onboardingAgent.model}</Text>
              </View>

              {/* Cost Input */}
              <View className="mb-6">
                <Text className="text-slate-400 text-sm font-medium mb-2">Monthly Cost (£)</Text>
                <View className="flex-row items-center bg-slate-800 rounded-xl px-4 py-3 border border-slate-700">
                  <DollarSign size={20} color="#64748b" />
                  <TextInput
                    value={monthlyCost}
                    onChangeText={setMonthlyCost}
                    placeholder={onboardingAgent.costPerMonth.toString()}
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    className="flex-1 ml-2 text-white text-lg"
                  />
                  <Text className="text-slate-400">/month</Text>
                </View>
                <Text className="text-slate-500 text-xs mt-2">
                  Suggested: £{onboardingAgent.costPerMonth}/month
                </Text>
              </View>

              {/* Action Buttons */}
              <View className="gap-3">
                <Pressable
                  onPress={handleOnboard}
                  disabled={!monthlyCost.trim()}
                  className={`py-4 rounded-xl ${
                    !monthlyCost.trim() ? 'bg-slate-700' : 'bg-blue-500'
                  } active:opacity-80`}
                >
                  <Text className="text-white text-center font-bold text-base">
                    Confirm Onboarding
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setOnboardingAgent(null);
                    setMonthlyCost('');
                  }}
                  className="bg-slate-800 py-3 rounded-xl active:opacity-80"
                >
                  <Text className="text-slate-400 text-center font-semibold">Cancel</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}
