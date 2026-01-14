import { View, Text, ScrollView, Pressable, Modal, TextInput, Platform, Linking, KeyboardAvoidingView } from 'react-native';
import { useState, useMemo } from 'react';
import { router } from 'expo-router';
import {
  Calendar, Clock, MapPin, Users, Plus, X, Video, Check, ChevronRight,
  Globe, User, Mail, UserPlus, Phone, ArrowLeft, Flame, Star, Trophy,
  Zap, Sparkles, Bell, Gift, TrendingUp, Heart, Share2, MessageCircle,
  Award, Target, Crown, Ticket, PartyPopper, Mic, BookOpen, Coffee,
  Presentation, Building2, CheckCircle2, AlertCircle, Timer
} from 'lucide-react-native';
import { useCurrentWorkspace, useCurrentMembership, useCurrentUser } from '@/lib/state/app-store';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ORGANIZATION_MEMBERS } from '@/lib/organization-seed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

// ============================================================================
// SENIOR EXECUTIVE CONSULTANT ENGAGEMENT FRAMEWORK
// FOMO-Driven + Social Proof + Achievement Psychology
// ============================================================================

interface EventSpeaker {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar?: string;
}

interface EventAttendee {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  isFromNetwork: boolean;
}

interface Event {
  id: string;
  title: string;
  description: string;
  eventType: 'meetup' | 'workshop' | 'office-hours' | 'demo-day' | 'networking' | 'social' | 'webinar' | 'masterclass';
  hostName: string;
  hostRole: string;
  hostCompany?: string;
  startTime: string;
  endTime: string;
  location: {
    type: 'in-person' | 'virtual' | 'hybrid';
    venue?: string;
    address?: string;
    coordinates?: { latitude: number; longitude: number };
    virtualLink?: string;
  };
  attendeeFor: 'all' | 'founders' | 'executives' | 'apprentices';
  cost: number;
  capacity?: number;
  attendees: EventAttendee[];
  speakers?: EventSpeaker[];
  tags: string[];
  xpReward: number;
  badge?: string;
  isFeatured: boolean;
  isHot: boolean;
  spotsLeft?: number;
  registrationDeadline?: string;
  series?: string;
  recordingAvailable?: boolean;
  networkAttendees: number; // People from your network attending
  createdBy: string;
}

// Event type configurations
const EVENT_TYPE_CONFIG = {
  'meetup': { icon: Users, color: '#3b82f6', gradient: ['#3b82f6', '#6366f1'] as [string, string], label: 'Meetup' },
  'workshop': { icon: BookOpen, color: '#8b5cf6', gradient: ['#8b5cf6', '#a855f7'] as [string, string], label: 'Workshop' },
  'office-hours': { icon: Coffee, color: '#f59e0b', gradient: ['#f59e0b', '#f97316'] as [string, string], label: 'Office Hours' },
  'demo-day': { icon: Presentation, color: '#10b981', gradient: ['#10b981', '#14b8a6'] as [string, string], label: 'Demo Day' },
  'networking': { icon: Users, color: '#ec4899', gradient: ['#ec4899', '#f43f5e'] as [string, string], label: 'Networking' },
  'social': { icon: PartyPopper, color: '#06b6d4', gradient: ['#06b6d4', '#0ea5e9'] as [string, string], label: 'Social' },
  'webinar': { icon: Video, color: '#6366f1', gradient: ['#6366f1', '#8b5cf6'] as [string, string], label: 'Webinar' },
  'masterclass': { icon: Award, color: '#f59e0b', gradient: ['#f59e0b', '#ef4444'] as [string, string], label: 'Masterclass' },
};

// Enhanced mock events with engagement features
const INITIAL_EVENTS: Event[] = [
  {
    id: 'event-1',
    title: 'Hardware Founders Networking Night',
    description: 'Connect with 50+ hardware founders, share war stories, and build relationships that matter. Featured speakers from YC-backed hardware startups.',
    eventType: 'networking',
    hostName: 'Sarah Chen',
    hostRole: 'Founder',
    hostCompany: 'TechHardware Co',
    startTime: '2025-01-22T18:00:00',
    endTime: '2025-01-22T21:00:00',
    location: {
      type: 'in-person',
      venue: 'Hardware Hub London',
      address: '123 Tech Street, Shoreditch, London, E1 6AN',
      coordinates: { latitude: 51.5274, longitude: -0.0721 },
    },
    attendeeFor: 'all',
    cost: 0,
    capacity: 50,
    attendees: [
      { id: 'att-1', name: 'Marcus Rodriguez', role: 'CTO', isFromNetwork: true },
      { id: 'att-2', name: 'Emily Watson', role: 'Founder', isFromNetwork: true },
      { id: 'att-3', name: 'James Liu', role: 'Engineer', isFromNetwork: false },
    ],
    speakers: [
      { id: 'spk-1', name: 'Alex Turner', role: 'CEO', company: 'DroneFlow' },
      { id: 'spk-2', name: 'Lisa Park', role: 'CTO', company: 'SensorTech' },
    ],
    tags: ['Networking', 'Hardware', 'Founders'],
    xpReward: 100,
    badge: 'Networker',
    isFeatured: true,
    isHot: true,
    spotsLeft: 8,
    networkAttendees: 5,
    createdBy: 'founder-1',
  },
  {
    id: 'event-2',
    title: 'Fundraising Masterclass: Series A Secrets',
    description: 'Learn from founders who have raised £10M+ in Series A. Includes pitch deck teardowns, investor Q&A, and networking with active VCs.',
    eventType: 'masterclass',
    hostName: 'Alexandra Foster',
    hostRole: 'Fractional CFO',
    hostCompany: 'Foster Finance',
    startTime: '2025-01-25T14:00:00',
    endTime: '2025-01-25T17:00:00',
    location: {
      type: 'virtual',
      virtualLink: 'https://zoom.us/j/123456789',
    },
    attendeeFor: 'founders',
    cost: 49,
    capacity: 30,
    attendees: [
      { id: 'att-4', name: 'David Park', role: 'Founder', isFromNetwork: true },
    ],
    speakers: [
      { id: 'spk-3', name: 'Alexandra Foster', role: 'CFO', company: 'Foster Finance' },
      { id: 'spk-4', name: 'Michael Chen', role: 'Partner', company: 'Seedcamp' },
    ],
    tags: ['Fundraising', 'Series A', 'Masterclass'],
    xpReward: 200,
    badge: 'Fundraiser',
    isFeatured: true,
    isHot: false,
    spotsLeft: 12,
    registrationDeadline: '2025-01-24T23:59:59',
    series: 'Fundraising Series',
    networkAttendees: 3,
    createdBy: 'exec-1',
  },
  {
    id: 'event-3',
    title: 'Manufacturing Demo Day',
    description: 'Showcase your hardware products to investors, customers, and partners. 5-minute demos followed by Q&A. Previous events led to £2M+ in deals.',
    eventType: 'demo-day',
    hostName: 'Marcus Thompson',
    hostRole: 'Founder',
    hostCompany: 'ManuTech',
    startTime: '2025-02-01T10:00:00',
    endTime: '2025-02-01T16:00:00',
    location: {
      type: 'hybrid',
      venue: 'Innovation Centre Manchester',
      address: '456 Innovation Way, Manchester, M1 5GD',
      coordinates: { latitude: 53.4808, longitude: -2.2426 },
      virtualLink: 'https://teams.microsoft.com/l/meetup-join/...',
    },
    attendeeFor: 'all',
    cost: 0,
    capacity: 100,
    attendees: [
      { id: 'att-5', name: 'Rachel Kim', role: 'Founder', isFromNetwork: true },
      { id: 'att-6', name: 'Tom Wilson', role: 'Investor', isFromNetwork: false },
      { id: 'att-7', name: 'Sarah Chen', role: 'Founder', isFromNetwork: true },
    ],
    tags: ['Demo Day', 'Investors', 'Showcase'],
    xpReward: 150,
    isFeatured: false,
    isHot: true,
    spotsLeft: 23,
    networkAttendees: 8,
    createdBy: 'founder-2',
  },
  {
    id: 'event-4',
    title: 'Weekly Office Hours: Ask a Fractional CFO',
    description: 'Free 1-hour session with Alexandra Foster. Bring your finance questions - fundraising, cash flow, unit economics, board reporting.',
    eventType: 'office-hours',
    hostName: 'Alexandra Foster',
    hostRole: 'Fractional CFO',
    hostCompany: 'Foster Finance',
    startTime: '2025-01-23T11:00:00',
    endTime: '2025-01-23T12:00:00',
    location: {
      type: 'virtual',
      virtualLink: 'https://meet.google.com/abc-defg-hij',
    },
    attendeeFor: 'all',
    cost: 0,
    capacity: 15,
    attendees: [],
    tags: ['Finance', 'Q&A', 'Free'],
    xpReward: 50,
    isFeatured: false,
    isHot: false,
    spotsLeft: 15,
    series: 'Weekly Office Hours',
    recordingAvailable: true,
    networkAttendees: 2,
    createdBy: 'exec-2',
  },
  {
    id: 'event-5',
    title: 'Hardware Happy Hour',
    description: 'Casual drinks and conversation with fellow hardware builders. No agenda, just good vibes and great connections.',
    eventType: 'social',
    hostName: 'Community Team',
    hostRole: 'Organizer',
    startTime: '2025-01-24T18:30:00',
    endTime: '2025-01-24T21:00:00',
    location: {
      type: 'in-person',
      venue: 'The Techie Pub',
      address: '42 Silicon Lane, London, EC2A 4BX',
    },
    attendeeFor: 'all',
    cost: 0,
    capacity: 40,
    attendees: [
      { id: 'att-8', name: 'Multiple', role: 'Various', isFromNetwork: false },
    ],
    tags: ['Social', 'Casual', 'Drinks'],
    xpReward: 75,
    badge: 'Social Butterfly',
    isFeatured: false,
    isHot: false,
    spotsLeft: 18,
    networkAttendees: 4,
    createdBy: 'community-1',
  },
];

type TabView = 'upcoming' | 'my-events' | 'past';

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const currentWorkspace = useCurrentWorkspace();
  const currentMembership = useCurrentMembership();
  const currentUser = useCurrentUser();

  const [events, setEvents] = useState<Event[]>(INITIAL_EVENTS);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabView>('upcoming');
  const [showRSVPSuccess, setShowRSVPSuccess] = useState(false);
  const [rsvpEventName, setRsvpEventName] = useState('');
  const [rsvpXp, setRsvpXp] = useState(0);

  // Create event form state
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventType, setNewEventType] = useState<Event['eventType']>('networking');
  const [newEventLocationType, setNewEventLocationType] = useState<'in-person' | 'virtual' | 'hybrid'>('in-person');
  const [newEventVenue, setNewEventVenue] = useState('');
  const [newEventAddress, setNewEventAddress] = useState('');
  const [newEventVirtualLink, setNewEventVirtualLink] = useState('');
  const [newEventAttendeeFor, setNewEventAttendeeFor] = useState<Event['attendeeFor']>('all');
  const [newEventCost, setNewEventCost] = useState('0');
  const [newEventCapacity, setNewEventCapacity] = useState('');
  const [newEventStartDate, setNewEventStartDate] = useState(new Date());
  const [newEventEndDate, setNewEventEndDate] = useState(new Date(Date.now() + 3 * 60 * 60 * 1000));
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const canCreateEvent = currentMembership?.role === 'Founder' || currentMembership?.role === 'FractionalExec';

  // Filter events based on active tab
  const filteredEvents = useMemo(() => {
    const now = new Date();
    switch (activeTab) {
      case 'upcoming':
        return events.filter(e => new Date(e.startTime) > now).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      case 'my-events':
        return events.filter(e => e.attendees.some(att => att.isFromNetwork));
      case 'past':
        return events.filter(e => new Date(e.startTime) <= now);
      default:
        return events;
    }
  }, [events, activeTab]);

  // Stats for header
  const stats = useMemo(() => {
    const now = new Date();
    const upcoming = events.filter(e => new Date(e.startTime) > now);
    const registered = events.filter(e => e.attendees.some(att => att.isFromNetwork));
    const thisWeek = upcoming.filter(e => {
      const eventDate = new Date(e.startTime);
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return eventDate <= weekFromNow;
    });
    return {
      upcoming: upcoming.length,
      registered: registered.length,
      thisWeek: thisWeek.length,
      totalXpAvailable: upcoming.reduce((acc, e) => acc + e.xpReward, 0),
    };
  }, [events]);

  // Featured event
  const featuredEvent = useMemo(() => {
    return events.find(e => e.isFeatured && new Date(e.startTime) > new Date());
  }, [events]);

  const handleJoinEvent = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event || !currentUser) return;

    const isJoining = !event.attendees.some(att => att.isFromNetwork);

    setEvents(events.map(e => {
      if (e.id === eventId) {
        if (isJoining) {
          return {
            ...e,
            attendees: [...e.attendees, { id: currentUser.id, name: currentUser.name, role: currentMembership?.role || 'Member', isFromNetwork: true }],
            spotsLeft: e.spotsLeft ? e.spotsLeft - 1 : undefined,
          };
        } else {
          return {
            ...e,
            attendees: e.attendees.filter(att => !att.isFromNetwork || att.id !== currentUser.id),
            spotsLeft: e.spotsLeft ? e.spotsLeft + 1 : undefined,
          };
        }
      }
      return e;
    }));

    if (isJoining) {
      setRsvpEventName(event.title);
      setRsvpXp(event.xpReward);
      setShowRSVPSuccess(true);
      setSelectedEvent(null);
      setTimeout(() => setShowRSVPSuccess(false), 3000);
    }
  };

  const isUserJoined = (event: Event) => {
    return event.attendees.some(att => att.isFromNetwork);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeUntil = (dateString: string) => {
    const now = new Date();
    const eventDate = new Date(dateString);
    const diff = eventDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return 'Soon';
  };

  const handleCreateEvent = () => {
    if (!currentUser || !newEventTitle.trim()) return;

    const newEvent: Event = {
      id: `event-${Date.now()}`,
      title: newEventTitle.trim(),
      description: newEventDescription.trim(),
      eventType: newEventType,
      hostName: currentUser.name,
      hostRole: currentMembership?.role === 'Founder' ? 'Founder' : 'Executive',
      startTime: newEventStartDate.toISOString(),
      endTime: newEventEndDate.toISOString(),
      location: {
        type: newEventLocationType,
        venue: newEventVenue.trim() || undefined,
        address: newEventAddress.trim() || undefined,
        virtualLink: newEventVirtualLink.trim() || undefined,
      },
      attendeeFor: newEventAttendeeFor,
      cost: parseFloat(newEventCost) || 0,
      capacity: newEventCapacity ? parseInt(newEventCapacity) : undefined,
      attendees: [],
      tags: [],
      xpReward: 50,
      isFeatured: false,
      isHot: false,
      spotsLeft: newEventCapacity ? parseInt(newEventCapacity) : undefined,
      networkAttendees: 0,
      createdBy: currentUser.id,
    };

    setEvents([newEvent, ...events]);
    setShowCreateModal(false);
    resetForm();
  };

  const resetForm = () => {
    setNewEventTitle('');
    setNewEventDescription('');
    setNewEventType('networking');
    setNewEventLocationType('in-person');
    setNewEventVenue('');
    setNewEventAddress('');
    setNewEventVirtualLink('');
    setNewEventAttendeeFor('all');
    setNewEventCost('0');
    setNewEventCapacity('');
    setNewEventStartDate(new Date());
    setNewEventEndDate(new Date(Date.now() + 3 * 60 * 60 * 1000));
  };

  return (
    <View className="flex-1 bg-slate-950">
      {/* RSVP Success Toast */}
      {showRSVPSuccess && (
        <Animated.View
          entering={FadeInUp}
          className="absolute top-20 left-6 right-6 z-50 bg-emerald-500 rounded-2xl p-4 flex-row items-center"
        >
          <CheckCircle2 size={24} color="#ffffff" />
          <View className="ml-3 flex-1">
            <Text className="text-white font-bold">You're in!</Text>
            <Text className="text-white/80 text-sm">{rsvpEventName}</Text>
          </View>
          <View className="bg-white/20 px-3 py-1 rounded-full">
            <Text className="text-white font-bold">+{rsvpXp} XP</Text>
          </View>
        </Animated.View>
      )}

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 pt-14 pb-4">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <Pressable onPress={() => router.back()} className="mr-3 active:opacity-70">
                <ArrowLeft size={24} color="#3b82f6" />
              </Pressable>
              <View>
                <Text className="text-white text-2xl font-bold">Events</Text>
                <Text className="text-slate-400 text-sm">Connect, learn, grow</Text>
              </View>
            </View>
            {canCreateEvent && (
              <Pressable
                onPress={() => setShowCreateModal(true)}
                className="bg-blue-500 px-4 py-2 rounded-xl flex-row items-center active:opacity-70"
              >
                <Plus size={16} color="white" />
                <Text className="text-white text-sm font-semibold ml-1">Create</Text>
              </Pressable>
            )}
          </View>

          {/* Stats Cards */}
          <Animated.View entering={FadeInDown.delay(100)} className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
              <Calendar size={18} color="#3b82f6" />
              <Text className="text-white text-2xl font-bold mt-2">{stats.thisWeek}</Text>
              <Text className="text-slate-400 text-xs">This Week</Text>
            </View>
            <View className="flex-1 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
              <CheckCircle2 size={18} color="#10b981" />
              <Text className="text-white text-2xl font-bold mt-2">{stats.registered}</Text>
              <Text className="text-slate-400 text-xs">Registered</Text>
            </View>
            <View className="flex-1 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
              <Zap size={18} color="#f59e0b" />
              <Text className="text-white text-2xl font-bold mt-2">{stats.totalXpAvailable}</Text>
              <Text className="text-slate-400 text-xs">XP Available</Text>
            </View>
          </Animated.View>

          {/* Featured Event */}
          {featuredEvent && (
            <Animated.View entering={FadeInDown.delay(200)}>
              <Pressable
                onPress={() => setSelectedEvent(featuredEvent)}
                className="mb-4 active:opacity-70"
              >
                <LinearGradient
                  colors={EVENT_TYPE_CONFIG[featuredEvent.eventType].gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 20, padding: 20 }}
                >
                  <View className="flex-row items-center mb-3">
                    <View className="bg-white/20 px-3 py-1 rounded-full flex-row items-center">
                      <Sparkles size={14} color="#ffffff" />
                      <Text className="text-white font-semibold ml-1 text-sm">Featured</Text>
                    </View>
                    {featuredEvent.isHot && (
                      <View className="bg-red-500 px-3 py-1 rounded-full flex-row items-center ml-2">
                        <Flame size={14} color="#ffffff" />
                        <Text className="text-white font-semibold ml-1 text-sm">Hot</Text>
                      </View>
                    )}
                  </View>

                  <Text className="text-white text-xl font-bold mb-2">{featuredEvent.title}</Text>
                  <Text className="text-white/80 text-sm mb-4" numberOfLines={2}>{featuredEvent.description}</Text>

                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Calendar size={14} color="rgba(255,255,255,0.7)" />
                      <Text className="text-white/70 ml-1 text-sm">{formatDate(featuredEvent.startTime)}</Text>
                      <Text className="text-white/50 mx-2">•</Text>
                      <Clock size={14} color="rgba(255,255,255,0.7)" />
                      <Text className="text-white/70 ml-1 text-sm">{formatTime(featuredEvent.startTime)}</Text>
                    </View>
                    <View className="bg-white/20 px-3 py-1.5 rounded-full">
                      <Text className="text-white font-semibold text-sm">
                        {featuredEvent.spotsLeft} spots left
                      </Text>
                    </View>
                  </View>

                  {/* Social proof */}
                  {featuredEvent.networkAttendees > 0 && (
                    <View className="flex-row items-center mt-4 pt-4 border-t border-white/20">
                      <View className="flex-row -space-x-2">
                        {[1, 2, 3].map((_, i) => (
                          <View
                            key={i}
                            className="w-8 h-8 rounded-full bg-white/30 border-2 border-white/20 items-center justify-center"
                            style={{ marginLeft: i > 0 ? -8 : 0 }}
                          >
                            <User size={14} color="#ffffff" />
                          </View>
                        ))}
                      </View>
                      <Text className="text-white/80 ml-2 text-sm">
                        {featuredEvent.networkAttendees} from your network attending
                      </Text>
                    </View>
                  )}
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}

          {/* Tab Navigation */}
          <View className="flex-row bg-slate-900 rounded-xl p-1">
            {[
              { id: 'upcoming', label: 'Upcoming', count: stats.upcoming },
              { id: 'my-events', label: 'My Events', count: stats.registered },
              { id: 'past', label: 'Past', count: null },
            ].map((tab) => (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id as TabView)}
                className={`flex-1 py-3 rounded-lg ${activeTab === tab.id ? 'bg-blue-500' : ''}`}
              >
                <Text className={`text-center font-semibold ${activeTab === tab.id ? 'text-white' : 'text-slate-400'}`}>
                  {tab.label}
                  {tab.count !== null && (
                    <Text className={activeTab === tab.id ? 'text-white/70' : 'text-slate-500'}> ({tab.count})</Text>
                  )}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Events List */}
        <View className="px-5 pb-8">
          {filteredEvents.map((event, index) => {
            const config = EVENT_TYPE_CONFIG[event.eventType];
            const EventIcon = config.icon;
            const joined = isUserJoined(event);

            return (
              <Animated.View key={event.id} entering={FadeInDown.delay(index * 100)}>
                <Pressable
                  onPress={() => setSelectedEvent(event)}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-4 active:opacity-70"
                >
                  {/* Event Header */}
                  <View className="p-4">
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-row items-center flex-1">
                        <View
                          className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                          style={{ backgroundColor: `${config.color}20` }}
                        >
                          <EventIcon size={24} color={config.color} />
                        </View>
                        <View className="flex-1">
                          <View className="flex-row items-center mb-1">
                            <View
                              className="px-2 py-0.5 rounded-md mr-2"
                              style={{ backgroundColor: `${config.color}20` }}
                            >
                              <Text className="text-xs font-semibold" style={{ color: config.color }}>
                                {config.label}
                              </Text>
                            </View>
                            {event.isHot && (
                              <View className="bg-red-500/20 px-2 py-0.5 rounded-md flex-row items-center">
                                <Flame size={10} color="#ef4444" />
                                <Text className="text-red-400 text-xs font-semibold ml-1">Hot</Text>
                              </View>
                            )}
                          </View>
                          <Text className="text-white font-bold text-base" numberOfLines={1}>{event.title}</Text>
                        </View>
                      </View>
                      {joined && (
                        <View className="bg-emerald-500/20 px-2 py-1 rounded-full flex-row items-center">
                          <Check size={12} color="#10b981" />
                          <Text className="text-emerald-400 text-xs font-semibold ml-1">Going</Text>
                        </View>
                      )}
                    </View>

                    {/* Event Details */}
                    <View className="flex-row items-center mb-3">
                      <View className="flex-row items-center mr-4">
                        <Calendar size={14} color="#64748b" />
                        <Text className="text-slate-400 text-sm ml-1">{formatDate(event.startTime)}</Text>
                      </View>
                      <View className="flex-row items-center mr-4">
                        <Clock size={14} color="#64748b" />
                        <Text className="text-slate-400 text-sm ml-1">{formatTime(event.startTime)}</Text>
                      </View>
                      <View className="flex-row items-center">
                        {event.location.type === 'virtual' ? (
                          <Video size={14} color="#64748b" />
                        ) : (
                          <MapPin size={14} color="#64748b" />
                        )}
                        <Text className="text-slate-400 text-sm ml-1">
                          {event.location.type === 'virtual' ? 'Virtual' : event.location.venue?.split(',')[0]}
                        </Text>
                      </View>
                    </View>

                    {/* Footer with urgency and social proof */}
                    <View className="flex-row items-center justify-between pt-3 border-t border-slate-800">
                      {/* Urgency indicators */}
                      <View className="flex-row items-center">
                        {event.spotsLeft !== undefined && event.spotsLeft <= 10 && (
                          <View className="flex-row items-center mr-3">
                            <AlertCircle size={14} color="#f59e0b" />
                            <Text className="text-amber-400 text-xs font-semibold ml-1">
                              {event.spotsLeft} spots left
                            </Text>
                          </View>
                        )}
                        <View className="flex-row items-center">
                          <Timer size={14} color="#64748b" />
                          <Text className="text-slate-400 text-xs ml-1">
                            In {getTimeUntil(event.startTime)}
                          </Text>
                        </View>
                      </View>

                      {/* XP Reward */}
                      <View className="flex-row items-center bg-amber-500/10 px-2 py-1 rounded-full">
                        <Zap size={12} color="#f59e0b" />
                        <Text className="text-amber-400 text-xs font-semibold ml-1">+{event.xpReward} XP</Text>
                      </View>
                    </View>

                    {/* Network attendees */}
                    {event.networkAttendees > 0 && !joined && (
                      <View className="flex-row items-center mt-3 pt-3 border-t border-slate-800">
                        <View className="flex-row -space-x-2">
                          {[1, 2, 3].slice(0, Math.min(3, event.networkAttendees)).map((_, i) => (
                            <View
                              key={i}
                              className="w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-900 items-center justify-center"
                              style={{ marginLeft: i > 0 ? -6 : 0 }}
                            >
                              <User size={10} color="#94a3b8" />
                            </View>
                          ))}
                        </View>
                        <Text className="text-slate-400 text-xs ml-2">
                          {event.networkAttendees} from your network
                        </Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}

          {filteredEvents.length === 0 && (
            <View className="bg-slate-900 border border-slate-800 rounded-2xl p-8 items-center">
              <Calendar size={48} color="#64748b" />
              <Text className="text-white font-bold text-lg mt-4">No Events Found</Text>
              <Text className="text-slate-400 text-center mt-2">
                {activeTab === 'my-events'
                  ? "You haven't registered for any events yet"
                  : activeTab === 'past'
                  ? "No past events to show"
                  : "Check back soon for new events"}
              </Text>
              {activeTab === 'my-events' && (
                <Pressable
                  onPress={() => setActiveTab('upcoming')}
                  className="bg-blue-500 px-6 py-3 rounded-xl mt-4 active:opacity-70"
                >
                  <Text className="text-white font-semibold">Browse Events</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Event Detail Modal */}
      <Modal visible={selectedEvent !== null} transparent animationType="slide" onRequestClose={() => setSelectedEvent(null)}>
        <View className="flex-1 bg-black/70 justify-end">
          {selectedEvent && (
            <View className="bg-slate-900 rounded-t-3xl" style={{ height: '90%' }}>
              {/* Modal Header */}
              <LinearGradient
                colors={EVENT_TYPE_CONFIG[selectedEvent.eventType].gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingTop: 20, paddingBottom: 24, paddingHorizontal: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
              >
                <View className="flex-row items-center justify-between mb-4">
                  <Pressable onPress={() => setSelectedEvent(null)} className="p-2 bg-white/20 rounded-full">
                    <X size={20} color="#ffffff" />
                  </Pressable>
                  <View className="flex-row items-center">
                    {selectedEvent.badge && (
                      <View className="bg-white/20 px-3 py-1 rounded-full flex-row items-center mr-2">
                        <Award size={14} color="#ffffff" />
                        <Text className="text-white font-semibold ml-1 text-sm">{selectedEvent.badge}</Text>
                      </View>
                    )}
                    <Pressable className="p-2 bg-white/20 rounded-full">
                      <Share2 size={18} color="#ffffff" />
                    </Pressable>
                  </View>
                </View>

                <View className="flex-row items-center mb-2">
                  <View
                    className="px-3 py-1 rounded-full mr-2"
                    style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                  >
                    <Text className="text-white font-semibold text-sm">
                      {EVENT_TYPE_CONFIG[selectedEvent.eventType].label}
                    </Text>
                  </View>
                  {selectedEvent.isHot && (
                    <View className="bg-red-500 px-3 py-1 rounded-full flex-row items-center">
                      <Flame size={12} color="#ffffff" />
                      <Text className="text-white font-semibold ml-1 text-sm">Hot</Text>
                    </View>
                  )}
                </View>

                <Text className="text-white text-2xl font-bold mb-2">{selectedEvent.title}</Text>

                {/* Quick Stats */}
                <View className="flex-row items-center">
                  <View className="flex-row items-center mr-4">
                    <Calendar size={14} color="rgba(255,255,255,0.7)" />
                    <Text className="text-white/70 ml-1">{formatDate(selectedEvent.startTime)}</Text>
                  </View>
                  <View className="flex-row items-center mr-4">
                    <Clock size={14} color="rgba(255,255,255,0.7)" />
                    <Text className="text-white/70 ml-1">{formatTime(selectedEvent.startTime)}</Text>
                  </View>
                  <View className="flex-row items-center bg-white/20 px-2 py-1 rounded-full">
                    <Zap size={12} color="#ffffff" />
                    <Text className="text-white font-semibold ml-1 text-sm">+{selectedEvent.xpReward} XP</Text>
                  </View>
                </View>
              </LinearGradient>

              <ScrollView className="flex-1 px-5 py-4">
                {/* Urgency Banner */}
                {selectedEvent.spotsLeft !== undefined && selectedEvent.spotsLeft <= 15 && (
                  <View className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4 flex-row items-center">
                    <AlertCircle size={20} color="#f59e0b" />
                    <View className="ml-3 flex-1">
                      <Text className="text-amber-400 font-bold">Only {selectedEvent.spotsLeft} spots remaining!</Text>
                      <Text className="text-amber-400/70 text-sm">Register now to secure your place</Text>
                    </View>
                  </View>
                )}

                {/* Host Info */}
                <View className="bg-slate-800 rounded-xl p-4 mb-4">
                  <Text className="text-slate-400 text-xs font-semibold mb-2">HOSTED BY</Text>
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 rounded-full bg-blue-500/20 items-center justify-center mr-3">
                      <User size={24} color="#3b82f6" />
                    </View>
                    <View>
                      <Text className="text-white font-bold">{selectedEvent.hostName}</Text>
                      <Text className="text-slate-400 text-sm">{selectedEvent.hostRole}</Text>
                      {selectedEvent.hostCompany && (
                        <Text className="text-slate-500 text-xs">{selectedEvent.hostCompany}</Text>
                      )}
                    </View>
                  </View>
                </View>

                {/* Description */}
                <View className="mb-4">
                  <Text className="text-slate-400 text-xs font-semibold mb-2">ABOUT</Text>
                  <Text className="text-slate-300 leading-6">{selectedEvent.description}</Text>
                </View>

                {/* Speakers */}
                {selectedEvent.speakers && selectedEvent.speakers.length > 0 && (
                  <View className="mb-4">
                    <Text className="text-slate-400 text-xs font-semibold mb-2">SPEAKERS</Text>
                    <View className="bg-slate-800 rounded-xl p-4">
                      {selectedEvent.speakers.map((speaker) => (
                        <View key={speaker.id} className="flex-row items-center mb-3 last:mb-0">
                          <View className="w-10 h-10 rounded-full bg-purple-500/20 items-center justify-center mr-3">
                            <Mic size={18} color="#a855f7" />
                          </View>
                          <View>
                            <Text className="text-white font-semibold">{speaker.name}</Text>
                            <Text className="text-slate-400 text-sm">{speaker.role}, {speaker.company}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Location */}
                <View className="mb-4">
                  <Text className="text-slate-400 text-xs font-semibold mb-2">LOCATION</Text>
                  <View className="bg-slate-800 rounded-xl p-4">
                    <View className="flex-row items-center">
                      {selectedEvent.location.type === 'virtual' ? (
                        <Video size={20} color="#3b82f6" />
                      ) : (
                        <MapPin size={20} color="#3b82f6" />
                      )}
                      <View className="ml-3">
                        <Text className="text-white font-semibold">
                          {selectedEvent.location.type === 'virtual'
                            ? 'Virtual Event'
                            : selectedEvent.location.type === 'hybrid'
                            ? 'Hybrid Event'
                            : selectedEvent.location.venue}
                        </Text>
                        {selectedEvent.location.address && (
                          <Text className="text-slate-400 text-sm">{selectedEvent.location.address}</Text>
                        )}
                        {selectedEvent.location.type === 'virtual' && (
                          <Text className="text-blue-400 text-sm">Link will be shared upon registration</Text>
                        )}
                      </View>
                    </View>
                  </View>
                </View>

                {/* Cost & Capacity */}
                <View className="flex-row gap-3 mb-4">
                  <View className="flex-1 bg-slate-800 rounded-xl p-4">
                    <Text className="text-slate-400 text-xs mb-1">COST</Text>
                    <Text className="text-white text-xl font-bold">
                      {selectedEvent.cost === 0 ? 'Free' : `£${selectedEvent.cost}`}
                    </Text>
                  </View>
                  {selectedEvent.capacity && (
                    <View className="flex-1 bg-slate-800 rounded-xl p-4">
                      <Text className="text-slate-400 text-xs mb-1">CAPACITY</Text>
                      <Text className="text-white text-xl font-bold">
                        {selectedEvent.attendees.length}/{selectedEvent.capacity}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Attendees Preview */}
                {selectedEvent.attendees.length > 0 && (
                  <View className="mb-4">
                    <Text className="text-slate-400 text-xs font-semibold mb-2">WHO'S ATTENDING</Text>
                    <View className="bg-slate-800 rounded-xl p-4">
                      <View className="flex-row items-center">
                        <View className="flex-row -space-x-2">
                          {selectedEvent.attendees.slice(0, 5).map((att, i) => (
                            <View
                              key={att.id}
                              className={`w-10 h-10 rounded-full items-center justify-center border-2 border-slate-800 ${att.isFromNetwork ? 'bg-blue-500/30' : 'bg-slate-700'}`}
                              style={{ marginLeft: i > 0 ? -10 : 0 }}
                            >
                              <Text className={`text-xs font-bold ${att.isFromNetwork ? 'text-blue-400' : 'text-slate-400'}`}>
                                {att.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </Text>
                            </View>
                          ))}
                        </View>
                        <View className="ml-3">
                          <Text className="text-white font-semibold">{selectedEvent.attendees.length} attending</Text>
                          {selectedEvent.networkAttendees > 0 && (
                            <Text className="text-blue-400 text-sm">{selectedEvent.networkAttendees} from your network</Text>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                {/* Tags */}
                {selectedEvent.tags.length > 0 && (
                  <View className="flex-row flex-wrap gap-2 mb-6">
                    {selectedEvent.tags.map((tag) => (
                      <View key={tag} className="bg-slate-800 px-3 py-1.5 rounded-full">
                        <Text className="text-slate-300 text-sm">{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Register Button */}
                <Pressable
                  onPress={() => handleJoinEvent(selectedEvent.id)}
                  className={`py-4 rounded-xl flex-row items-center justify-center mb-4 ${
                    isUserJoined(selectedEvent) ? 'bg-slate-800 border border-slate-700' : 'bg-blue-500'
                  } active:opacity-70`}
                >
                  {isUserJoined(selectedEvent) ? (
                    <>
                      <Check size={20} color="#10b981" />
                      <Text className="text-emerald-400 font-bold text-lg ml-2">Registered</Text>
                      <Text className="text-slate-400 ml-2">• Tap to cancel</Text>
                    </>
                  ) : (
                    <>
                      <Ticket size={20} color="#ffffff" />
                      <Text className="text-white font-bold text-lg ml-2">
                        {selectedEvent.cost === 0 ? 'Register Free' : `Register • £${selectedEvent.cost}`}
                      </Text>
                      <View className="bg-white/20 px-2 py-1 rounded-full ml-3">
                        <Text className="text-white font-semibold text-sm">+{selectedEvent.xpReward} XP</Text>
                      </View>
                    </>
                  )}
                </Pressable>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>

      {/* Create Event Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <View className="flex-1 bg-black/70 justify-end">
            <View className="bg-slate-900 rounded-t-3xl" style={{ maxHeight: '90%' }}>
              <View className="px-5 pt-5 pb-3 border-b border-slate-800 flex-row items-center justify-between">
                <Text className="text-white text-xl font-bold">Create Event</Text>
                <Pressable onPress={() => setShowCreateModal(false)} className="p-2">
                  <X size={24} color="#64748b" />
                </Pressable>
              </View>

              <ScrollView className="px-5 py-4" keyboardShouldPersistTaps="handled">
                {/* Title */}
                <View className="mb-4">
                  <Text className="text-slate-400 text-sm mb-2">Event Title *</Text>
                  <TextInput
                    value={newEventTitle}
                    onChangeText={setNewEventTitle}
                    placeholder="e.g., Hardware Networking Meetup"
                    placeholderTextColor="#64748b"
                    className="bg-slate-800 text-white px-4 py-3 rounded-xl border border-slate-700"
                  />
                </View>

                {/* Description */}
                <View className="mb-4">
                  <Text className="text-slate-400 text-sm mb-2">Description *</Text>
                  <TextInput
                    value={newEventDescription}
                    onChangeText={setNewEventDescription}
                    placeholder="What's this event about?"
                    placeholderTextColor="#64748b"
                    multiline
                    numberOfLines={4}
                    className="bg-slate-800 text-white px-4 py-3 rounded-xl border border-slate-700"
                    style={{ minHeight: 100, textAlignVertical: 'top' }}
                  />
                </View>

                {/* Event Type */}
                <View className="mb-4">
                  <Text className="text-slate-400 text-sm mb-2">Event Type</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                    <View className="flex-row gap-2">
                      {Object.entries(EVENT_TYPE_CONFIG).map(([type, config]) => (
                        <Pressable
                          key={type}
                          onPress={() => setNewEventType(type as Event['eventType'])}
                          className={`px-4 py-2 rounded-xl border ${
                            newEventType === type
                              ? 'border-blue-500'
                              : 'border-slate-700'
                          }`}
                          style={{ backgroundColor: newEventType === type ? `${config.color}20` : '#1e293b' }}
                        >
                          <Text
                            className="text-sm font-medium"
                            style={{ color: newEventType === type ? config.color : '#94a3b8' }}
                          >
                            {config.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Location Type */}
                <View className="mb-4">
                  <Text className="text-slate-400 text-sm mb-2">Location Type</Text>
                  <View className="flex-row gap-2">
                    {(['in-person', 'virtual', 'hybrid'] as const).map((type) => (
                      <Pressable
                        key={type}
                        onPress={() => setNewEventLocationType(type)}
                        className={`flex-1 px-4 py-3 rounded-xl border ${
                          newEventLocationType === type
                            ? 'bg-blue-500/20 border-blue-500'
                            : 'bg-slate-800 border-slate-700'
                        }`}
                      >
                        <Text className={`text-sm font-medium text-center capitalize ${
                          newEventLocationType === type ? 'text-blue-400' : 'text-slate-400'
                        }`}>
                          {type}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Venue (if in-person or hybrid) */}
                {(newEventLocationType === 'in-person' || newEventLocationType === 'hybrid') && (
                  <>
                    <View className="mb-4">
                      <Text className="text-slate-400 text-sm mb-2">Venue Name</Text>
                      <TextInput
                        value={newEventVenue}
                        onChangeText={setNewEventVenue}
                        placeholder="e.g., Hardware Hub London"
                        placeholderTextColor="#64748b"
                        className="bg-slate-800 text-white px-4 py-3 rounded-xl border border-slate-700"
                      />
                    </View>
                    <View className="mb-4">
                      <Text className="text-slate-400 text-sm mb-2">Address</Text>
                      <TextInput
                        value={newEventAddress}
                        onChangeText={setNewEventAddress}
                        placeholder="Full address"
                        placeholderTextColor="#64748b"
                        className="bg-slate-800 text-white px-4 py-3 rounded-xl border border-slate-700"
                      />
                    </View>
                  </>
                )}

                {/* Virtual Link */}
                {(newEventLocationType === 'virtual' || newEventLocationType === 'hybrid') && (
                  <View className="mb-4">
                    <Text className="text-slate-400 text-sm mb-2">Virtual Link</Text>
                    <TextInput
                      value={newEventVirtualLink}
                      onChangeText={setNewEventVirtualLink}
                      placeholder="Zoom, Teams, or Meet link"
                      placeholderTextColor="#64748b"
                      className="bg-slate-800 text-white px-4 py-3 rounded-xl border border-slate-700"
                    />
                  </View>
                )}

                {/* Date/Time */}
                <View className="flex-row gap-3 mb-4">
                  <View className="flex-1">
                    <Text className="text-slate-400 text-sm mb-2">Start</Text>
                    <Pressable
                      onPress={() => setShowStartDatePicker(true)}
                      className="bg-slate-800 px-4 py-3 rounded-xl border border-slate-700"
                    >
                      <Text className="text-white text-sm">
                        {newEventStartDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </Pressable>
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-400 text-sm mb-2">End</Text>
                    <Pressable
                      onPress={() => setShowEndDatePicker(true)}
                      className="bg-slate-800 px-4 py-3 rounded-xl border border-slate-700"
                    >
                      <Text className="text-white text-sm">
                        {newEventEndDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {showStartDatePicker && (
                  <DateTimePicker
                    value={newEventStartDate}
                    mode="datetime"
                    display="default"
                    onChange={(event, date) => {
                      setShowStartDatePicker(false);
                      if (date) {
                        setNewEventStartDate(date);
                        if (date >= newEventEndDate) {
                          setNewEventEndDate(new Date(date.getTime() + 3 * 60 * 60 * 1000));
                        }
                      }
                    }}
                  />
                )}

                {showEndDatePicker && (
                  <DateTimePicker
                    value={newEventEndDate}
                    mode="datetime"
                    display="default"
                    onChange={(event, date) => {
                      setShowEndDatePicker(false);
                      if (date) setNewEventEndDate(date);
                    }}
                  />
                )}

                {/* Cost & Capacity */}
                <View className="flex-row gap-3 mb-6">
                  <View className="flex-1">
                    <Text className="text-slate-400 text-sm mb-2">Cost (£)</Text>
                    <TextInput
                      value={newEventCost}
                      onChangeText={setNewEventCost}
                      placeholder="0"
                      placeholderTextColor="#64748b"
                      keyboardType="numeric"
                      className="bg-slate-800 text-white px-4 py-3 rounded-xl border border-slate-700"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-400 text-sm mb-2">Capacity</Text>
                    <TextInput
                      value={newEventCapacity}
                      onChangeText={setNewEventCapacity}
                      placeholder="Unlimited"
                      placeholderTextColor="#64748b"
                      keyboardType="numeric"
                      className="bg-slate-800 text-white px-4 py-3 rounded-xl border border-slate-700"
                    />
                  </View>
                </View>

                {/* Create Button */}
                <Pressable
                  onPress={handleCreateEvent}
                  disabled={!newEventTitle.trim() || !newEventDescription.trim()}
                  className={`py-4 rounded-xl mb-4 ${
                    !newEventTitle.trim() || !newEventDescription.trim() ? 'bg-slate-700' : 'bg-blue-500'
                  } active:opacity-70`}
                >
                  <Text className="text-white text-center font-bold text-lg">Create Event</Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
