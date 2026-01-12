import { View, Text, ScrollView, Pressable, Modal, TextInput, Alert } from 'react-native';
import { useState } from 'react';
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
} from 'lucide-react-native';
import { router } from 'expo-router';
import { fractionalExecutives, apprentices, type Candidate } from '@/lib/candidates-seed';
import { TabDescription } from '@/components/TabDescription';
import { useCurrentMembership } from '@/lib/state/app-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type CommunityTab = 'executives' | 'apprentices' | 'suppliers' | 'apply';

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

// Demo suppliers
const DEMO_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1',
    name: 'TechFab Manufacturing',
    type: 'contract-manufacturer',
    location: 'Shenzhen, China',
    specialization: ['PCB Assembly', 'Enclosure Manufacturing', 'Quality Testing'],
    minOrderQuantity: '500 units',
    leadTime: '4-6 weeks',
    certifications: ['ISO 9001', 'RoHS', 'CE'],
  },
  {
    id: 'sup-2',
    name: 'UK Electronics Supply',
    type: 'component-supplier',
    location: 'Manchester, UK',
    specialization: ['ICs', 'Resistors', 'Capacitors', 'Connectors'],
    minOrderQuantity: '100 units',
    leadTime: '1-2 weeks',
    certifications: ['ISO 9001', 'RoHS'],
  },
  {
    id: 'sup-3',
    name: 'GlobalShip Fulfillment',
    type: 'fulfillment',
    location: 'London, UK',
    specialization: ['Warehousing', 'Pick & Pack', 'Last-Mile Delivery'],
    minOrderQuantity: 'N/A',
    leadTime: '1-3 days',
    certifications: ['ISO 9001'],
  },
];

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const currentMembership = useCurrentMembership();

  const [activeTab, setActiveTab] = useState<CommunityTab>('executives');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFunction, setSelectedFunction] = useState<string>('all');
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

    return matchesSearch;
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

    Alert.alert(
      'Application Submitted',
      `Your ${applicationType} application has been submitted successfully. You'll be contacted if there's a match.`,
      [{ text: 'OK' }]
    );

    // Reset form
    setApplicationName('');
    setApplicationEmail('');
    setApplicationPhone('');
    setApplicationSpecialization('');
    setApplicationExperience('');
    setShowApplicationModal(false);
  };

  const tabs: { value: CommunityTab; label: string; icon: any }[] = [
    { value: 'executives', label: 'Executives', icon: Briefcase },
    { value: 'apprentices', label: 'Apprentices', icon: Award },
    { value: 'suppliers', label: 'Suppliers', icon: Factory },
    { value: 'apply', label: 'Apply/Join', icon: Upload },
  ];

  return (
    <View className="flex-1 bg-white dark:bg-slate-950" style={{ paddingTop: insets.top }}>
      <TabDescription description="Search and connect with fractional executives, apprentices, suppliers, and manufacturers. Apply to join the marketplace." />

      {/* Tab Selector */}
      <View className="px-6 pt-4 pb-2">
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
      {(activeTab === 'executives' || activeTab === 'apprentices' || activeTab === 'suppliers') && (
        <View className="px-6 pb-3">
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
            <Text className="text-gray-900 dark:text-white text-sm mb-3">
              {filteredExecutives.length} fractional executives available
            </Text>
            {filteredExecutives.map((exec) => (
              <Pressable
                key={exec.id}
                onPress={() => setSelectedCandidate(exec)}
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
            <Text className="text-gray-900 dark:text-white text-sm mb-3">
              {filteredApprentices.length} apprentices available
            </Text>
            {filteredApprentices.map((apprentice) => (
              <Pressable
                key={apprentice.id}
                onPress={() => setSelectedCandidate(apprentice)}
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
            <Text className="text-gray-900 dark:text-white text-sm mb-3">
              {filteredSuppliers.length} suppliers and manufacturers
            </Text>
            {filteredSuppliers.map((supplier) => (
              <Pressable
                key={supplier.id}
                onPress={() => setSelectedSupplier(supplier)}
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

      {/* Allocation Request Modal */}
      <Modal visible={showRequestModal} transparent animationType="slide" onRequestClose={() => setShowRequestModal(false)}>
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-gray-100 dark:bg-slate-900 rounded-t-3xl" style={{ maxHeight: '70%' }}>
            <View className="px-6 pt-6 pb-4 border-b border-gray-300 dark:border-slate-800">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-900 dark:text-white text-xl font-bold">Request Allocation</Text>
                <Pressable onPress={() => setShowRequestModal(false)}>
                  <X size={24} color="#94a3b8" />
                </Pressable>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={true} className="px-6 py-4">
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
      </Modal>

      {/* Application Modal */}
      <Modal visible={showApplicationModal} transparent animationType="slide" onRequestClose={() => setShowApplicationModal(false)}>
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-gray-100 dark:bg-slate-900 rounded-t-3xl" style={{ maxHeight: '85%' }}>
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

            <ScrollView showsVerticalScrollIndicator={true} className="px-6 py-4">
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

              <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                <View className="flex-row items-center mb-1">
                  <Upload size={16} color="#3b82f6" />
                  <Text className="text-blue-700 dark:text-blue-300 text-xs font-semibold ml-2">
                    CV/Resume Upload (Coming Soon)
                  </Text>
                </View>
                <Text className="text-blue-600 dark:text-blue-400 text-xs">
                  For now, please include your LinkedIn profile or relevant links in your experience summary.
                </Text>
              </View>

              <Pressable
                onPress={handleSubmitApplication}
                className="bg-blue-500 py-4 rounded-xl active:opacity-70 mb-4"
              >
                <Text className="text-white text-center font-bold">Submit Application</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
