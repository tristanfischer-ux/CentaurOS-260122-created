import { View, Text, ScrollView, Pressable, Linking, TextInput } from 'react-native';
import { useState } from 'react';
import { Building2, Users, Calendar, ExternalLink, MapPin, Package, ChevronRight, Search, X } from 'lucide-react-native';

type NetworkTab = 'suppliers' | 'companies' | 'events';

// UK Suppliers Data
const UK_SUPPLIERS = [
  {
    id: '1',
    name: 'Proto Labs UK',
    description: 'Rapid prototyping and low-volume production',
    capabilities: ['CNC Machining', 'Injection Molding', '3D Printing'],
    location: 'Telford, England',
    website: 'https://www.protolabs.co.uk',
    verified: true,
  },
  {
    id: '2',
    name: 'Omega Plastics',
    description: 'High-volume injection molding specialist',
    capabilities: ['Injection Molding', 'Tool Making', 'Assembly'],
    location: 'Northamptonshire, England',
    website: 'https://www.omegaplastics.co.uk',
    verified: true,
  },
  {
    id: '3',
    name: 'Laser Master UK',
    description: 'Precision laser cutting and sheet metal fabrication',
    capabilities: ['Laser Cutting', 'CNC Punching', 'Bending'],
    location: 'Birmingham, England',
    website: 'https://www.lasermasteruk.com',
    verified: true,
  },
  {
    id: '4',
    name: 'RPWORLD UK',
    description: 'One-stop manufacturing solution from prototyping to production',
    capabilities: ['Rapid Prototyping', 'CNC Machining', 'Sheet Metal'],
    location: 'London, England',
    website: 'https://www.rpworld.co.uk',
    verified: true,
  },
  {
    id: '5',
    name: 'Newbury Electronics',
    description: 'Electronics manufacturing services and PCB assembly',
    capabilities: ['PCB Assembly', 'Box Build', 'Testing'],
    location: 'Newbury, England',
    website: 'https://www.newburyelectronics.co.uk',
    verified: true,
  },
  {
    id: '6',
    name: 'Formero',
    description: 'Vacuum forming and thermoforming specialist',
    capabilities: ['Vacuum Forming', 'Pressure Forming', 'Tooling'],
    location: 'Yorkshire, England',
    website: 'https://www.formero.co.uk',
    verified: true,
  },
  {
    id: '7',
    name: 'MJN Neuro',
    description: 'EPS and EPP molding for packaging and protective components',
    capabilities: ['EPS Molding', 'EPP Molding', 'Custom Packaging'],
    location: 'Manchester, England',
    website: 'https://www.mjnneuro.co.uk',
    verified: true,
  },
  {
    id: '8',
    name: 'EMS UK',
    description: 'Full-service electronics manufacturing',
    capabilities: ['PCB Design', 'SMT Assembly', 'Cable Assembly'],
    location: 'Cambridge, England',
    website: 'https://www.emsuk.com',
    verified: true,
  },
  {
    id: '9',
    name: 'Brandauer',
    description: 'Precision metal stamping and tooling since 1862',
    capabilities: ['Metal Stamping', 'Tool & Die', 'Progressive Dies'],
    location: 'Birmingham, England',
    website: 'https://www.brandauer.co.uk',
    verified: true,
  },
  {
    id: '10',
    name: 'Tharsus',
    description: 'Robotic assembly and automation solutions',
    capabilities: ['Robotic Assembly', 'Automation', 'Test Systems'],
    location: 'Blyth, England',
    website: 'https://www.tharsus.co.uk',
    verified: true,
  },
];

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
  },
  {
    id: '2',
    name: 'GreenCharge Energy',
    location: 'Bristol, UK',
    stage: 'Series A',
    industry: 'Climate Tech',
    description: 'Integrated solar + battery systems for commercial buildings',
    lookingFor: ['Suppliers', 'Partnerships'],
  },
  {
    id: '3',
    name: 'RoboFarm Systems',
    location: 'Edinburgh, UK',
    stage: 'Pre-seed',
    industry: 'AgTech',
    description: 'Autonomous farming robots for precision agriculture',
    lookingFor: ['Co-founders', 'Suppliers', 'Customers'],
  },
  {
    id: '4',
    name: 'SonicWave Audio',
    location: 'Manchester, UK',
    stage: 'Seed',
    industry: 'Consumer Electronics',
    description: 'Next-generation hearing aids with AI noise cancellation',
    lookingFor: ['Advisors', 'Investors'],
  },
  {
    id: '5',
    name: 'EdgeSense IoT',
    location: 'Birmingham, UK',
    stage: 'Revenue',
    industry: 'Industrial IoT',
    description: 'Edge computing sensors for predictive maintenance',
    lookingFor: ['Customers', 'Partnerships'],
  },
];

// Demo Events Data
const DEMO_EVENTS = [
  {
    id: '1',
    title: 'Hardware Founders Meetup',
    date: '2026-02-15',
    time: '18:00',
    location: 'Level39, Canary Wharf, London',
    type: 'In-person',
    capacity: 30,
    attending: 18,
    description: 'Monthly gathering of hardware startup founders',
  },
  {
    id: '2',
    title: 'DFM Workshop: Injection Molding',
    date: '2026-02-20',
    time: '14:00',
    location: 'Omega Plastics, Northamptonshire',
    type: 'Hybrid',
    capacity: 20,
    attending: 12,
    description: 'Hands-on workshop on designing for manufacturing with injection molding',
  },
  {
    id: '3',
    title: 'Fractional Executive Office Hours',
    date: '2026-02-18',
    time: '10:00',
    location: 'Virtual (Zoom)',
    type: 'Virtual',
    capacity: 12,
    attending: 8,
    description: '1-on-1 mentorship sessions with experienced fractional executives',
  },
  {
    id: '4',
    title: 'Demo Day: Spring 2026 Cohort',
    date: '2026-03-10',
    time: '17:00',
    location: 'Level39, Canary Wharf, London',
    type: 'Hybrid',
    capacity: 100,
    attending: 67,
    description: 'Showcase of hardware startups from the Spring 2026 cohort',
  },
  {
    id: '5',
    title: 'PCB Design Masterclass',
    date: '2026-02-25',
    time: '13:00',
    location: 'Virtual (Zoom)',
    type: 'Virtual',
    capacity: 50,
    attending: 34,
    description: 'Learn best practices for PCB design and layout',
  },
  {
    id: '6',
    title: 'Hardware Startup Social',
    date: '2026-03-01',
    time: '19:00',
    location: 'The Anchor Pub, Birmingham',
    type: 'In-person',
    capacity: 40,
    attending: 23,
    description: 'Casual networking over drinks with fellow hardware founders',
  },
];

export default function NetworkScreen() {
  const [activeTab, setActiveTab] = useState<NetworkTab>('suppliers');

  const tabs = [
    { id: 'suppliers' as NetworkTab, label: 'Suppliers', icon: Building2 },
    { id: 'companies' as NetworkTab, label: 'Companies', icon: Users },
    { id: 'events' as NetworkTab, label: 'Events', icon: Calendar },
  ];

  return (
    <View className="flex-1 bg-slate-950">
      {/* Tab Selector */}
      <View className="flex-row border-b border-slate-800 bg-slate-950">
        {tabs.map((tab) => {
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
        {activeTab === 'companies' && <CompaniesTab />}
        {activeTab === 'events' && <EventsTab />}
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
    new Set(UK_SUPPLIERS.flatMap((s) => s.capabilities))
  ).sort();

  // Filter suppliers based on search and capability
  const filteredSuppliers = UK_SUPPLIERS.filter((supplier) => {
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
          {UK_SUPPLIERS.length} verified manufacturing suppliers across the UK
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
  return (
    <View className="p-6">
      <View className="mb-6">
        <Text className="text-white text-2xl font-bold mb-2">Company Directory</Text>
        <Text className="text-slate-400 text-sm">
          Connect with {DEMO_COMPANIES.length} hardware startups using Centaur OS
        </Text>
      </View>

      <View className="gap-4">
        {DEMO_COMPANIES.map((company) => (
          <View
            key={company.id}
            className="bg-slate-900 rounded-2xl p-4 border border-slate-800"
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

            <Pressable className="flex-row items-center justify-center bg-slate-800 rounded-xl py-2.5 border border-slate-700 active:opacity-80">
              <Text className="text-white font-semibold text-sm">Connect</Text>
              <ChevronRight size={16} color="white" className="ml-1" />
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

// Events Tab - Community Events
function EventsTab() {
  return (
    <View className="p-6">
      <View className="mb-6">
        <Text className="text-white text-2xl font-bold mb-2">Community Events</Text>
        <Text className="text-slate-400 text-sm">
          {DEMO_EVENTS.length} upcoming meetups, workshops, and networking events
        </Text>
      </View>

      <View className="gap-4">
        {DEMO_EVENTS.map((event) => (
          <View
            key={event.id}
            className="bg-slate-900 rounded-2xl p-4 border border-slate-800"
          >
            <View className="flex-row items-start justify-between mb-3">
              <View className="flex-1 mr-3">
                <View className="flex-row items-center gap-2 mb-1">
                  <Text className="text-white text-lg font-semibold">{event.title}</Text>
                </View>
                <Text className="text-slate-400 text-sm mb-3">{event.description}</Text>

                <View className="gap-2">
                  <View className="flex-row items-center gap-1">
                    <Calendar size={14} color="#64748b" />
                    <Text className="text-slate-300 text-xs">
                      {new Date(event.date).toLocaleDateString('en-GB', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })} at {event.time}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <MapPin size={14} color="#64748b" />
                    <Text className="text-slate-300 text-xs">{event.location}</Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Users size={14} color="#64748b" />
                    <Text className="text-slate-300 text-xs">
                      {event.attending} / {event.capacity} attending
                    </Text>
                  </View>
                </View>
              </View>
              <View className="bg-blue-950 px-3 py-1.5 rounded-full">
                <Text className="text-blue-400 text-[10px] font-bold">{event.type.toUpperCase()}</Text>
              </View>
            </View>

            <View className="bg-slate-800 rounded-full h-2 mb-3 overflow-hidden">
              <View
                className="bg-blue-500 h-full"
                style={{ width: `${(event.attending / event.capacity) * 100}%` }}
              />
            </View>

            <Pressable className="flex-row items-center justify-center bg-blue-500 rounded-xl py-2.5 active:opacity-80">
              <Calendar size={16} color="white" />
              <Text className="text-white font-semibold ml-2 text-sm">RSVP</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}
