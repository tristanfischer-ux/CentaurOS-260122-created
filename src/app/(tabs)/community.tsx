import { View, Text, ScrollView, Pressable, Modal, TextInput, Linking } from 'react-native';
import { useState } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  X,
  Plus,
  Heart,
  Award,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Star,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { fractionalExecutives, apprentices, type Candidate } from '@/lib/candidates-seed';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { TabDescription } from '@/components/TabDescription';

type CommunityTab = 'executives' | 'apprentices' | 'events';

// Demo Events Data (from old events tab)
const DEMO_EVENTS = [
  {
    id: '1',
    title: 'Hardware Startup Meetup',
    date: '2024-02-15',
    time: '18:00',
    location: 'TechHub London',
    address: '20 Ropemaker Street, London EC2Y 9AR',
    attendees: 24,
    maxAttendees: 30,
    rsvped: false,
    type: 'Networking',
    description: 'Monthly meetup for hardware startup founders and teams. Share challenges, solutions, and connect with peers.',
    latitude: 51.5194,
    longitude: -0.0897,
  },
  {
    id: '2',
    title: 'Fractional Executive Mixer',
    date: '2024-02-22',
    time: '17:30',
    location: 'The Shard',
    address: '32 London Bridge Street, London SE1 9SG',
    attendees: 18,
    maxAttendees: 25,
    rsvped: true,
    type: 'Professional',
    description: 'Connect with experienced fractional executives across finance, sales, marketing, and operations.',
    latitude: 51.5045,
    longitude: -0.0865,
  },
  {
    id: '3',
    title: 'Supply Chain Workshop',
    date: '2024-03-01',
    time: '14:00',
    location: 'Cambridge Innovation Centre',
    address: '1 Station Road, Cambridge CB1 2JB',
    attendees: 12,
    maxAttendees: 20,
    rsvped: false,
    type: 'Workshop',
    description: 'Learn best practices for managing UK and international suppliers. Guest speakers from successful hardware startups.',
    latitude: 52.1951,
    longitude: 0.1313,
  },
];

export default function CommunityScreen() {
  const [activeTab, setActiveTab] = useState<CommunityTab>('executives');
  const [selectedEvent, setSelectedEvent] = useState<typeof DEMO_EVENTS[0] | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFunction, setSelectedFunction] = useState<string>('all');

  const tabs: { value: CommunityTab; label: string; icon: any }[] = [
    { value: 'executives', label: 'Executives', icon: Briefcase },
    { value: 'apprentices', label: 'Apprentices', icon: Award },
    { value: 'events', label: 'Events', icon: Calendar },
  ];

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
      <TabDescription description="Attend startup events and discover talented fractional executives and apprentices to join your team." />

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
                  size={18}
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

      <ScrollView className="flex-1">
        {/* Events Tab */}
        {activeTab === 'events' && (
          <View className="px-6 pb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-gray-900 dark:text-white text-lg font-semibold">
                Upcoming Events ({DEMO_EVENTS.length})
              </Text>
              <Pressable
                onPress={() => setShowMap(true)}
                className="bg-blue-500 px-4 py-2 rounded-xl active:opacity-70"
              >
                <Text className="text-white text-sm font-semibold">Map View</Text>
              </Pressable>
            </View>

            {DEMO_EVENTS.map((event) => (
              <Pressable
                key={event.id}
                onPress={() => setSelectedEvent(event)}
                className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 border border-gray-300 dark:border-slate-800 mb-3 active:opacity-70"
              >
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1">
                    <Text className="text-gray-900 dark:text-white font-bold text-base mb-1">
                      {event.title}
                    </Text>
                    <View className="bg-blue-500/20 self-start px-2 py-0.5 rounded mb-2">
                      <Text className="text-blue-400 text-xs font-semibold">{event.type}</Text>
                    </View>
                  </View>
                  {event.rsvped && (
                    <View className="bg-emerald-500/20 px-2 py-1 rounded">
                      <Text className="text-emerald-400 text-xs font-semibold">RSVP'd</Text>
                    </View>
                  )}
                </View>

                <View className="flex-row items-center mb-2">
                  <Calendar size={14} color="#64748b" />
                  <Text className="text-gray-600 dark:text-slate-400 text-sm ml-2">
                    {new Date(event.date).toLocaleDateString('en-GB', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short'
                    })} at {event.time}
                  </Text>
                </View>

                <View className="flex-row items-center mb-2">
                  <MapPin size={14} color="#64748b" />
                  <Text className="text-gray-600 dark:text-slate-400 text-sm ml-2 flex-1">
                    {event.location}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Users size={14} color="#64748b" />
                    <Text className="text-gray-600 dark:text-slate-400 text-sm ml-2">
                      {event.attendees}/{event.maxAttendees} attending
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Executives Tab */}
        {activeTab === 'executives' && (
          <View className="px-6 pb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-gray-900 dark:text-white text-lg font-semibold">
                Fractional Executives ({fractionalExecutives.length})
              </Text>
              <Pressable
                onPress={() => router.push('/swipe')}
                className="bg-purple-500 px-4 py-2 rounded-xl active:opacity-70"
              >
                <Text className="text-white text-sm font-semibold">Swipe Mode</Text>
              </Pressable>
            </View>

            {/* Search Bar */}
            <View className="mb-4">
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by name or skills..."
                placeholderTextColor="#94a3b8"
                className="bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
              />
            </View>

            {fractionalExecutives.map((exec) => (
              <Pressable
                key={exec.id}
                onPress={() => setSelectedCandidate(exec)}
                className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 border border-gray-300 dark:border-slate-800 mb-3 active:opacity-70"
              >
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1">
                    <Text className="text-gray-900 dark:text-white font-bold text-base mb-1">
                      {exec.name}
                    </Text>
                    <View className="bg-purple-500/20 self-start px-2 py-0.5 rounded mb-2">
                      <Text className="text-purple-400 text-xs font-semibold">{exec.specialization.join(', ')}</Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <View className="flex-row items-center mb-1">
                      <Star size={12} color="#f59e0b" fill="#f59e0b" />
                      <Text className="text-gray-700 dark:text-slate-300 text-xs ml-1">{exec.rating}</Text>
                    </View>
                    <Text className="text-emerald-400 text-sm font-bold">
                      £{exec.costPerDay}/day
                    </Text>
                  </View>
                </View>

                <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2" numberOfLines={2}>
                  {exec.bio}
                </Text>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Briefcase size={12} color="#64748b" />
                    <Text className="text-gray-600 dark:text-slate-400 text-xs ml-1">
                      {exec.experience} years
                    </Text>
                  </View>
                  <Text className="text-gray-600 dark:text-slate-400 text-xs">
                    {exec.availability}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Apprentices Tab */}
        {activeTab === 'apprentices' && (
          <View className="px-6 pb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-gray-900 dark:text-white text-lg font-semibold">
                Apprentices ({apprentices.length})
              </Text>
              <Pressable
                onPress={() => router.push('/swipe')}
                className="bg-emerald-500 px-4 py-2 rounded-xl active:opacity-70"
              >
                <Text className="text-white text-sm font-semibold">Swipe Mode</Text>
              </Pressable>
            </View>

            {/* Search Bar */}
            <View className="mb-4">
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by name or skills..."
                placeholderTextColor="#94a3b8"
                className="bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
              />
            </View>

            {apprentices.map((apprentice) => (
              <Pressable
                key={apprentice.id}
                onPress={() => setSelectedCandidate(apprentice)}
                className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 border border-gray-300 dark:border-slate-800 mb-3 active:opacity-70"
              >
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1">
                    <Text className="text-gray-900 dark:text-white font-bold text-base mb-1">
                      {apprentice.name}
                    </Text>
                    <View className="bg-emerald-500/20 self-start px-2 py-0.5 rounded mb-2">
                      <Text className="text-emerald-400 text-xs font-semibold">{apprentice.specialization.join(', ')}</Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <View className="flex-row items-center mb-1">
                      <Star size={12} color="#f59e0b" fill="#f59e0b" />
                      <Text className="text-gray-700 dark:text-slate-300 text-xs ml-1">{apprentice.rating}</Text>
                    </View>
                    <Text className="text-emerald-400 text-sm font-bold">
                      £{apprentice.costPerDay}/day
                    </Text>
                  </View>
                </View>

                <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2" numberOfLines={2}>
                  {apprentice.bio}
                </Text>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Briefcase size={12} color="#64748b" />
                    <Text className="text-gray-600 dark:text-slate-400 text-xs ml-1">
                      {apprentice.experience} year{apprentice.experience !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Text className="text-gray-600 dark:text-slate-400 text-xs">
                    {apprentice.availability}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Event Detail Modal */}
      <Modal visible={selectedEvent !== null} transparent animationType="slide" onRequestClose={() => setSelectedEvent(null)}>
        <View className="flex-1 bg-black/70 justify-end">
          {selectedEvent && (
            <View className="bg-gray-100 dark:bg-slate-900 rounded-t-3xl" style={{ maxHeight: '90%', minHeight: '60%' }}>
              <View className="px-6 pt-6 pb-4 border-b border-gray-300 dark:border-slate-800">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-gray-900 dark:text-white text-xl font-bold flex-1">
                    {selectedEvent.title}
                  </Text>
                  <Pressable onPress={() => setSelectedEvent(null)}>
                    <X size={24} color="#94a3b8" />
                  </Pressable>
                </View>
                <View className="bg-blue-500/20 self-start px-2 py-1 rounded">
                  <Text className="text-blue-400 text-xs font-semibold">{selectedEvent.type}</Text>
                </View>
              </View>

              <ScrollView showsVerticalScrollIndicator={true} bounces={false} className="flex-1">
                <View className="px-6 py-4">
                  <View className="mb-4">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm mb-1">Description</Text>
                    <Text className="text-gray-900 dark:text-white">{selectedEvent.description}</Text>
                  </View>

                  <View className="mb-4">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">Date & Time</Text>
                    <View className="flex-row items-center">
                      <Calendar size={16} color="#3b82f6" />
                      <Text className="text-gray-900 dark:text-white ml-2">
                        {new Date(selectedEvent.date).toLocaleDateString('en-GB', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </Text>
                    </View>
                    <Text className="text-gray-900 dark:text-white ml-6">{selectedEvent.time}</Text>
                  </View>

                  <View className="mb-4">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">Location</Text>
                    <View className="flex-row items-start">
                      <MapPin size={16} color="#3b82f6" />
                      <View className="ml-2 flex-1">
                        <Text className="text-gray-900 dark:text-white font-semibold">{selectedEvent.location}</Text>
                        <Text className="text-gray-600 dark:text-slate-400 text-sm">{selectedEvent.address}</Text>
                      </View>
                    </View>
                  </View>

                  <View className="mb-4">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">Attendees</Text>
                    <View className="flex-row items-center">
                      <Users size={16} color="#3b82f6" />
                      <Text className="text-gray-900 dark:text-white ml-2">
                        {selectedEvent.attendees} / {selectedEvent.maxAttendees} people
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={() => {
                      setSelectedEvent(null);
                      // Handle RSVP logic here
                    }}
                    className={`py-4 rounded-xl ${selectedEvent.rsvped ? 'bg-gray-200 dark:bg-slate-800' : 'bg-blue-500'} active:opacity-70`}
                  >
                    <Text className={`text-center font-bold ${selectedEvent.rsvped ? 'text-gray-600 dark:text-slate-400' : 'text-white'}`}>
                      {selectedEvent.rsvped ? 'Cancel RSVP' : 'RSVP to Event'}
                    </Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>

      {/* Candidate Detail Modal */}
      <Modal visible={selectedCandidate !== null} transparent animationType="slide" onRequestClose={() => setSelectedCandidate(null)}>
        <View className="flex-1 bg-black/70 justify-end">
          {selectedCandidate && (
            <View className="bg-gray-100 dark:bg-slate-900 rounded-t-3xl" style={{ maxHeight: '90%', minHeight: '60%' }}>
              <View className="px-6 pt-6 pb-4 border-b border-gray-300 dark:border-slate-800">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-1">
                    <Text className="text-gray-900 dark:text-white text-xl font-bold">
                      {selectedCandidate.name}
                    </Text>
                    <Text className="text-gray-600 dark:text-slate-400">{selectedCandidate.specialization.join(', ')}</Text>
                  </View>
                  <Pressable onPress={() => setSelectedCandidate(null)}>
                    <X size={24} color="#94a3b8" />
                  </Pressable>
                </View>
              </View>

              <ScrollView showsVerticalScrollIndicator={true} bounces={false} className="flex-1">
                <View className="px-6 py-4">
                  <View className="bg-gray-200 dark:bg-slate-800 rounded-xl p-4 mb-4">
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-gray-600 dark:text-slate-400">Daily Rate:</Text>
                      <Text className="text-emerald-400 text-xl font-bold">
                        £{selectedCandidate.costPerDay}
                      </Text>
                    </View>
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-gray-600 dark:text-slate-400">Experience:</Text>
                      <Text className="text-gray-900 dark:text-white font-semibold">
                        {selectedCandidate.experience} year{selectedCandidate.experience !== 1 ? 's' : ''}
                      </Text>
                    </View>
                    <View className="flex-row justify-between items-center">
                      <Text className="text-gray-600 dark:text-slate-400">Rating:</Text>
                      <View className="flex-row items-center">
                        <Star size={16} color="#f59e0b" fill="#f59e0b" />
                        <Text className="text-gray-900 dark:text-white font-semibold ml-1">
                          {selectedCandidate.rating}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View className="mb-4">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm mb-1">Bio</Text>
                    <Text className="text-gray-900 dark:text-white">{selectedCandidate.bio}</Text>
                  </View>

                  <View className="mb-4">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">Skills</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {selectedCandidate.skills.map((skill, idx) => (
                        <View key={idx} className="bg-blue-500/20 px-3 py-1.5 rounded-lg">
                          <Text className="text-blue-400 text-sm">{skill}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View className="mb-4">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm mb-1">Availability</Text>
                    <Text className="text-gray-900 dark:text-white">{selectedCandidate.availability}</Text>
                  </View>

                  <View className="mb-4">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">Contact</Text>
                    <Pressable
                      onPress={() => Linking.openURL(`mailto:${selectedCandidate.email}`)}
                      className="flex-row items-center mb-2 active:opacity-70"
                    >
                      <Mail size={16} color="#3b82f6" />
                      <Text className="text-blue-400 ml-2">{selectedCandidate.email}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => Linking.openURL(`tel:${selectedCandidate.phone}`)}
                      className="flex-row items-center active:opacity-70"
                    >
                      <Phone size={16} color="#3b82f6" />
                      <Text className="text-blue-400 ml-2">{selectedCandidate.phone}</Text>
                    </Pressable>
                  </View>

                  <Pressable
                    onPress={() => {
                      setSelectedCandidate(null);
                      // Handle hiring interest logic here
                    }}
                    className="bg-blue-500 py-4 rounded-xl active:opacity-70"
                  >
                    <Text className="text-white text-center font-bold">Express Interest</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>

      {/* Map Modal */}
      <Modal visible={showMap} transparent animationType="slide" onRequestClose={() => setShowMap(false)}>
        <View className="flex-1 bg-white dark:bg-slate-950">
          <View className="px-6 pt-12 pb-4 bg-white dark:bg-slate-950 border-b border-gray-300 dark:border-slate-800">
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-900 dark:text-white text-xl font-bold">Event Locations</Text>
              <Pressable onPress={() => setShowMap(false)}>
                <X size={24} color="#64748b" />
              </Pressable>
            </View>
          </View>

          <MapView
            provider={PROVIDER_DEFAULT}
            style={{ flex: 1 }}
            initialRegion={{
              latitude: 51.5074,
              longitude: -0.1278,
              latitudeDelta: 0.5,
              longitudeDelta: 0.5,
            }}
          >
            {DEMO_EVENTS.map((event) => (
              <Marker
                key={event.id}
                coordinate={{
                  latitude: event.latitude,
                  longitude: event.longitude,
                }}
                title={event.title}
                description={event.location}
              />
            ))}
          </MapView>
        </View>
      </Modal>
    </View>
  );
}
