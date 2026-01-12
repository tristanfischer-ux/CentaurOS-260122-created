import { View, Text, ScrollView, Pressable, Modal, TextInput, Platform, Linking } from 'react-native';
import { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  X,
  Video,
  Building,
  Check,
  ChevronRight,
  Globe,
  User,
  Mail,
  UserPlus,
  Phone,
} from 'lucide-react-native';
import { useCurrentWorkspace, useCurrentMembership, useCurrentUser } from '@/lib/state/app-store';
import DateTimePicker from '@react-native-community/datetimepicker';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { ORGANIZATION_MEMBERS } from '@/lib/organization-seed';

interface Event {
  id: string;
  title: string;
  description: string;
  eventType: 'meetup' | 'workshop' | 'office-hours' | 'demo-day' | 'networking' | 'social' | 'webinar';
  hostName: string;
  hostRole: string;
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
  cost: number; // £0 for free events
  capacity?: number;
  attendees: string[]; // User IDs who have joined
  invitedMembers: string[]; // Organization member IDs who are invited
  createdBy: string; // User ID
}

// Mock events data
const INITIAL_EVENTS: Event[] = [
  {
    id: 'event-1',
    title: 'Hardware Startup Networking',
    description: 'Connect with other hardware founders and learn about the latest trends in manufacturing. Bring your prototypes and get feedback from industry experts.',
    eventType: 'networking',
    hostName: 'Sarah Chen',
    hostRole: 'Founder',
    startTime: '2025-01-20T18:00:00',
    endTime: '2025-01-20T21:00:00',
    location: {
      type: 'in-person',
      venue: 'Hardware Hub London',
      address: '123 Tech Street, Shoreditch, London, E1 6AN',
      coordinates: { latitude: 51.5274, longitude: -0.0721 }, // Shoreditch
    },
    attendeeFor: 'all',
    cost: 0,
    capacity: 50,
    attendees: ['user-1', 'user-2'],
    invitedMembers: ['exec-1', 'exec-2', 'apprentice-1', 'apprentice-2'],
    createdBy: 'founder-1',
  },
  {
    id: 'event-2',
    title: 'Fundraising Workshop for Hardware Startups',
    description: 'Learn how to raise your first round of funding. Topics include: pitch deck creation, investor outreach, term sheet negotiation, and more.',
    eventType: 'workshop',
    hostName: 'Jordan Martinez',
    hostRole: 'Fractional Exec',
    startTime: '2025-01-25T14:00:00',
    endTime: '2025-01-25T17:00:00',
    location: {
      type: 'virtual',
      virtualLink: 'https://zoom.us/j/123456789',
    },
    attendeeFor: 'founders',
    cost: 50,
    capacity: 30,
    attendees: ['user-1'],
    invitedMembers: ['founder-1', 'founder-2'],
    createdBy: 'exec-1',
  },
  {
    id: 'event-3',
    title: 'Manufacturing Demo Day',
    description: 'Showcase your latest hardware products to potential customers, investors, and partners. 5-minute demos followed by Q&A.',
    eventType: 'demo-day',
    hostName: 'Marcus Thompson',
    hostRole: 'Founder',
    startTime: '2025-02-01T10:00:00',
    endTime: '2025-02-01T16:00:00',
    location: {
      type: 'hybrid',
      venue: 'Innovation Centre Manchester',
      address: '456 Innovation Way, Manchester, M1 5GD',
      coordinates: { latitude: 53.4808, longitude: -2.2426 }, // Manchester
      virtualLink: 'https://teams.microsoft.com/l/meetup-join/...',
    },
    attendeeFor: 'all',
    cost: 0,
    capacity: 100,
    attendees: ['user-1', 'user-2', 'user-3'],
    invitedMembers: ['exec-1', 'exec-2', 'exec-3', 'exec-4', 'apprentice-1', 'apprentice-3', 'apprentice-5'],
    createdBy: 'founder-2',
  },
];

export default function EventsScreen() {
  const currentWorkspace = useCurrentWorkspace();
  const currentMembership = useCurrentMembership();
  const currentUser = useCurrentUser();
  const [events, setEvents] = useState<Event[]>(INITIAL_EVENTS);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'upcoming' | 'joined'>('all');
  const [selectedMemberFromEvent, setSelectedMemberFromEvent] = useState<typeof ORGANIZATION_MEMBERS[0] | null>(null);

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
  const [newEventEndDate, setNewEventEndDate] = useState(new Date(Date.now() + 3 * 60 * 60 * 1000)); // 3 hours later
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [selectedInvitedMembers, setSelectedInvitedMembers] = useState<string[]>([]);

  const canCreateEvent = currentMembership?.role === 'Founder' || currentMembership?.role === 'FractionalExec';

  const handleCreateEvent = async () => {
    if (!currentUser || !newEventTitle.trim()) return;

    const newEvent: Event = {
      id: `event-${Date.now()}`,
      title: newEventTitle.trim(),
      description: newEventDescription.trim(),
      eventType: newEventType,
      hostName: currentUser.name,
      hostRole: currentMembership?.role === 'Founder' ? 'Founder' : currentMembership?.role === 'FractionalExec' ? 'Fractional Executive' : 'Member',
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
      invitedMembers: selectedInvitedMembers,
      createdBy: currentUser.id,
    };

    setEvents([newEvent, ...events]);
    setShowCreateModal(false);

    // If team members are invited, open email client with pre-filled invitation
    if (selectedInvitedMembers.length > 0) {
      const invitedEmails = selectedInvitedMembers
        .map(memberId => ORGANIZATION_MEMBERS.find(m => m.id === memberId)?.email)
        .filter(email => email) as string[];

      if (invitedEmails.length > 0) {
        // Format the event details for email
        const eventDate = formatDate(newEvent.startTime);
        const eventTime = `${formatTime(newEvent.startTime)} - ${formatTime(newEvent.endTime)}`;

        let locationText = '';
        if (newEvent.location.type === 'virtual') {
          locationText = `Virtual Event${newEvent.location.virtualLink ? `\n${newEvent.location.virtualLink}` : ''}`;
        } else if (newEvent.location.type === 'in-person') {
          locationText = `${newEvent.location.venue || ''}\n${newEvent.location.address || ''}`;
        } else if (newEvent.location.type === 'hybrid') {
          locationText = `In-person: ${newEvent.location.venue || ''}\nAddress: ${newEvent.location.address || ''}\nVirtual: ${newEvent.location.virtualLink || ''}`;
        }

        const subject = encodeURIComponent(`You're Invited: ${newEvent.title}`);
        const body = encodeURIComponent(
          `Hi there,\n\n` +
          `You're invited to ${newEvent.title}!\n\n` +
          `${newEvent.description}\n\n` +
          `EVENT DETAILS:\n` +
          `📅 Date: ${eventDate}\n` +
          `🕐 Time: ${eventTime}\n` +
          `📍 Location: ${locationText}\n` +
          `💰 Cost: ${newEvent.cost === 0 ? 'Free' : `£${newEvent.cost}`}\n` +
          `${newEvent.capacity ? `👥 Capacity: ${newEvent.capacity} people\n` : ''}\n` +
          `Hosted by ${newEvent.hostName}\n\n` +
          `We hope to see you there!\n\n` +
          `Best regards,\n${currentUser.name}`
        );

        const mailto = `mailto:${invitedEmails.join(',')}?subject=${subject}&body=${body}`;

        try {
          await Linking.openURL(mailto);
        } catch (error) {
          console.error('Failed to open email client:', error);
        }
      }
    }

    // Reset form
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
    setSelectedInvitedMembers([]);
  };

  const handleJoinEvent = async (eventId: string) => {
    if (!currentUser) return;

    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const isJoining = !event.attendees.includes(currentUser.id);

    setEvents(events.map(event => {
      if (event.id === eventId) {
        if (event.attendees.includes(currentUser.id)) {
          // Leave event
          return { ...event, attendees: event.attendees.filter(id => id !== currentUser.id) };
        } else {
          // Join event
          return { ...event, attendees: [...event.attendees, currentUser.id] };
        }
      }
      return event;
    }));

    // Update selected event if it's currently open
    if (selectedEvent?.id === eventId) {
      const updatedEvent = events.find(e => e.id === eventId);
      if (updatedEvent) {
        setSelectedEvent({
          ...updatedEvent,
          attendees: updatedEvent.attendees.includes(currentUser.id)
            ? updatedEvent.attendees.filter(id => id !== currentUser.id)
            : [...updatedEvent.attendees, currentUser.id],
        });
      }
    }

    // Send confirmation email when joining an event
    if (isJoining) {
      // Get event host email
      const hostMember = ORGANIZATION_MEMBERS.find(m => m.id === event.createdBy);
      const hostEmail = hostMember?.email;

      if (hostEmail) {
        // Format the event details for email
        const eventDate = formatDate(event.startTime);
        const eventTime = `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`;

        let locationText = '';
        if (event.location.type === 'virtual') {
          locationText = `Virtual Event${event.location.virtualLink ? `\n${event.location.virtualLink}` : ''}`;
        } else if (event.location.type === 'in-person') {
          locationText = `${event.location.venue || ''}\n${event.location.address || ''}`;
        } else if (event.location.type === 'hybrid') {
          locationText = `In-person: ${event.location.venue || ''}\nAddress: ${event.location.address || ''}\nVirtual: ${event.location.virtualLink || ''}`;
        }

        const subject = encodeURIComponent(`Joined: ${event.title}`);
        const body = encodeURIComponent(
          `Hi ${event.hostName},\n\n` +
          `I'm confirming my attendance for ${event.title}!\n\n` +
          `EVENT DETAILS:\n` +
          `📅 Date: ${eventDate}\n` +
          `🕐 Time: ${eventTime}\n` +
          `📍 Location: ${locationText}\n` +
          `💰 Cost: ${event.cost === 0 ? 'Free' : `£${event.cost}`}\n` +
          `${event.capacity ? `👥 Capacity: ${event.capacity} people\n` : ''}\n` +
          `${event.description ? `\n${event.description}\n` : ''}\n` +
          `Looking forward to attending!\n\n` +
          `Best regards,\n${currentUser.name}`
        );

        const mailto = `mailto:${hostEmail}?subject=${subject}&body=${body}`;

        try {
          await Linking.openURL(mailto);
        } catch (error) {
          console.error('Failed to open email client:', error);
        }
      }
    }
  };

  const isUserJoined = (event: Event) => {
    return currentUser ? event.attendees.includes(currentUser.id) : false;
  };

  const filteredEvents = events.filter(event => {
    if (filterType === 'upcoming') {
      return new Date(event.startTime) > new Date();
    }
    if (filterType === 'joined') {
      return isUserJoined(event);
    }
    return true;
  });

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'workshop': return 'bg-purple-500/20 text-purple-400';
      case 'networking': return 'bg-blue-500/20 text-blue-400';
      case 'demo-day': return 'bg-emerald-500/20 text-emerald-400';
      case 'office-hours': return 'bg-amber-500/20 text-amber-400';
      case 'social': return 'bg-pink-500/20 text-pink-400';
      case 'webinar': return 'bg-indigo-500/20 text-indigo-400';
      default: return 'bg-slate-500/20 text-gray-600 dark:text-slate-400';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
      {/* Header */}
      <View className="p-6 pb-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-gray-900 dark:text-white text-2xl font-bold">Events</Text>
          {canCreateEvent && (
            <Pressable
              onPress={() => setShowCreateModal(true)}
              className="bg-blue-500 px-4 py-2 rounded-xl flex-row items-center active:opacity-70"
            >
              <Plus size={16} color="white" />
              <Text className="text-gray-900 dark:text-white text-sm font-semibold ml-2">Create Event</Text>
            </Pressable>
          )}
        </View>

        {/* Stats */}
        <View className="flex-row gap-3 mb-4">
          <Pressable
            onPress={() => setFilterType('all')}
            className="flex-1 bg-gray-100 dark:bg-slate-900 rounded-xl p-3 border border-gray-300 dark:border-slate-800 active:opacity-70"
          >
            <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">Total Events</Text>
            <Text className="text-gray-900 dark:text-white text-2xl font-bold">{events.length}</Text>
          </Pressable>
          <Pressable
            onPress={() => setFilterType('joined')}
            className="flex-1 bg-gray-100 dark:bg-slate-900 rounded-xl p-3 border border-gray-300 dark:border-slate-800 active:opacity-70"
          >
            <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">Joined</Text>
            <Text className="text-blue-400 text-2xl font-bold">
              {events.filter(e => isUserJoined(e)).length}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilterType('upcoming')}
            className="flex-1 bg-gray-100 dark:bg-slate-900 rounded-xl p-3 border border-gray-300 dark:border-slate-800 active:opacity-70"
          >
            <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">Upcoming</Text>
            <Text className="text-emerald-400 text-2xl font-bold">
              {events.filter(e => new Date(e.startTime) > new Date()).length}
            </Text>
          </Pressable>
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
          <View className="flex-row gap-2">
            {[
              { value: 'all', label: 'All Events' },
              { value: 'upcoming', label: 'Upcoming' },
              { value: 'joined', label: 'My Events' },
            ].map((filter) => (
              <Pressable
                key={filter.value}
                onPress={() => setFilterType(filter.value as any)}
                className={`px-4 py-2 rounded-xl ${
                  filterType === filter.value
                    ? 'bg-blue-500'
                    : 'bg-slate-800 border border-slate-700'
                }`}
              >
                <Text className={`text-sm font-medium ${
                  filterType === filter.value ? 'text-white' : 'text-gray-600 dark:text-slate-400'
                }`}>
                  {filter.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Events List */}
      <ScrollView className="flex-1 px-6">
        <View className="gap-3 pb-6">
          {filteredEvents.map((event) => (
            <Pressable
              key={event.id}
              onPress={() => setSelectedEvent(event)}
              className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 border border-gray-300 dark:border-slate-800 active:opacity-70"
            >
              {/* Event Type Badge */}
              <View className="flex-row items-center justify-between mb-3">
                <View className={`px-3 py-1 rounded-lg ${getEventTypeColor(event.eventType)}`}>
                  <Text className="text-xs font-semibold capitalize">
                    {event.eventType.replace('-', ' ')}
                  </Text>
                </View>
                {isUserJoined(event) && (
                  <View className="bg-emerald-500/20 px-2 py-1 rounded flex-row items-center">
                    <Check size={12} color="#10b981" />
                    <Text className="text-emerald-400 text-xs font-semibold ml-1">Joined</Text>
                  </View>
                )}
              </View>

              {/* Event Title */}
              <Text className="text-gray-900 dark:text-white text-lg font-bold mb-2">{event.title}</Text>

              {/* Event Info */}
              <View className="gap-2">
                <View className="flex-row items-center">
                  <User size={14} color="#94a3b8" />
                  <Text className="text-gray-600 dark:text-slate-400 text-sm ml-2">
                    Hosted by {event.hostName} ({event.hostRole})
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <Calendar size={14} color="#94a3b8" />
                  <Text className="text-gray-600 dark:text-slate-400 text-sm ml-2">{formatDate(event.startTime)}</Text>
                </View>

                <View className="flex-row items-center">
                  <Clock size={14} color="#94a3b8" />
                  <Text className="text-gray-600 dark:text-slate-400 text-sm ml-2">
                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                  </Text>
                </View>

                <View className="flex-row items-center">
                  {event.location.type === 'virtual' ? (
                    <Video size={14} color="#94a3b8" />
                  ) : (
                    <MapPin size={14} color="#94a3b8" />
                  )}
                  <Text className="text-gray-600 dark:text-slate-400 text-sm ml-2">
                    {event.location.type === 'virtual'
                      ? 'Virtual Event'
                      : event.location.type === 'hybrid'
                      ? 'Hybrid Event'
                      : event.location.venue}
                  </Text>
                </View>

                {event.cost > 0 && (
                  <View className="flex-row items-center">
                    <Text className="text-blue-400 text-sm font-semibold">£{event.cost}</Text>
                  </View>
                )}

                {event.capacity && (
                  <View className="flex-row items-center">
                    <Users size={14} color="#94a3b8" />
                    <Text className="text-gray-600 dark:text-slate-400 text-sm ml-2">
                      {event.attendees.length} / {event.capacity} attendees
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-row items-center justify-end mt-3">
                <ChevronRight size={20} color="#64748b" />
              </View>
            </Pressable>
          ))}

          {filteredEvents.length === 0 && (
            <View className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-8 border border-gray-300 dark:border-slate-800 items-center">
              <Calendar size={64} color="#475569" />
              <Text className="text-gray-600 dark:text-slate-400 text-center mt-4">
                {filterType === 'joined' ? 'You haven\'t joined any events yet' : 'No events found'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Event Detail Modal */}
      <Modal visible={selectedEvent !== null} transparent animationType="slide">
        <View className="flex-1 bg-black/70 justify-end">
          {selectedEvent && (
            <View className="bg-gray-100 dark:bg-slate-900 rounded-t-3xl" style={{ maxHeight: '90%' }}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View className="p-6 border-b border-gray-300 dark:border-slate-800">
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1 mr-4">
                      <View className={`self-start px-3 py-1 rounded-lg mb-2 ${getEventTypeColor(selectedEvent.eventType)}`}>
                        <Text className="text-xs font-semibold capitalize">
                          {selectedEvent.eventType.replace('-', ' ')}
                        </Text>
                      </View>
                      <Text className="text-gray-900 dark:text-white text-2xl font-bold">{selectedEvent.title}</Text>
                    </View>
                    <Pressable onPress={() => setSelectedEvent(null)}>
                      <X size={24} color="#94a3b8" />
                    </Pressable>
                  </View>

                  {/* Host Info */}
                  <View className="bg-gray-200 dark:bg-slate-800 rounded-xl p-3 flex-row items-center">
                    <View className="w-10 h-10 rounded-full bg-blue-500/20 items-center justify-center mr-3">
                      <User size={20} color="#3b82f6" />
                    </View>
                    <View>
                      <Text className="text-gray-600 dark:text-slate-400 text-xs">Hosted by</Text>
                      <Text className="text-gray-900 dark:text-white font-semibold">{selectedEvent.hostName}</Text>
                      <Text className="text-gray-600 dark:text-slate-400 text-xs">{selectedEvent.hostRole}</Text>
                    </View>
                  </View>
                </View>

                {/* Event Details */}
                <View className="p-6">
                  {/* Description */}
                  <View className="mb-6">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">About</Text>
                    <Text className="text-gray-700 dark:text-slate-300 leading-6">{selectedEvent.description}</Text>
                  </View>

                  {/* Date & Time */}
                  <View className="bg-gray-200 dark:bg-slate-800 rounded-xl p-4 mb-4">
                    <View className="flex-row items-center mb-3">
                      <Calendar size={20} color="#3b82f6" />
                      <Text className="text-gray-900 dark:text-white font-semibold ml-3">Date & Time</Text>
                    </View>
                    <Text className="text-gray-700 dark:text-slate-300">{formatDate(selectedEvent.startTime)}</Text>
                    <Text className="text-gray-700 dark:text-slate-300">
                      {formatTime(selectedEvent.startTime)} - {formatTime(selectedEvent.endTime)}
                    </Text>
                  </View>

                  {/* Location */}
                  <View className="bg-gray-200 dark:bg-slate-800 rounded-xl p-4 mb-4">
                    <View className="flex-row items-center mb-3">
                      {selectedEvent.location.type === 'virtual' ? (
                        <Video size={20} color="#3b82f6" />
                      ) : (
                        <MapPin size={20} color="#3b82f6" />
                      )}
                      <Text className="text-gray-900 dark:text-white font-semibold ml-3">Location</Text>
                    </View>
                    {selectedEvent.location.type === 'virtual' && (
                      <View>
                        <Text className="text-gray-700 dark:text-slate-300 mb-2">Virtual Event</Text>
                        {selectedEvent.location.virtualLink && (
                          <Text className="text-blue-400 text-sm">{selectedEvent.location.virtualLink}</Text>
                        )}
                      </View>
                    )}
                    {selectedEvent.location.type === 'in-person' && (
                      <View>
                        <Text className="text-gray-700 dark:text-slate-300 font-medium mb-1">{selectedEvent.location.venue}</Text>
                        <Text className="text-gray-600 dark:text-slate-400 text-sm mb-3">{selectedEvent.location.address}</Text>
                        {selectedEvent.location.coordinates && (
                          <View className="rounded-xl overflow-hidden border border-gray-400 dark:border-slate-700" style={{ height: 180 }}>
                            <MapView
                              provider={PROVIDER_DEFAULT}
                              style={{ width: '100%', height: '100%' }}
                              initialRegion={{
                                latitude: selectedEvent.location.coordinates.latitude,
                                longitude: selectedEvent.location.coordinates.longitude,
                                latitudeDelta: 0.01,
                                longitudeDelta: 0.01,
                              }}
                              scrollEnabled={false}
                              zoomEnabled={false}
                              pitchEnabled={false}
                              rotateEnabled={false}
                            >
                              <Marker
                                coordinate={{
                                  latitude: selectedEvent.location.coordinates.latitude,
                                  longitude: selectedEvent.location.coordinates.longitude,
                                }}
                                title={selectedEvent.location.venue}
                                description={selectedEvent.location.address}
                              />
                            </MapView>
                          </View>
                        )}
                      </View>
                    )}
                    {selectedEvent.location.type === 'hybrid' && (
                      <View>
                        <Text className="text-gray-700 dark:text-slate-300 font-medium mb-1">In-person & Virtual</Text>
                        <Text className="text-gray-700 dark:text-slate-300">{selectedEvent.location.venue}</Text>
                        <Text className="text-gray-600 dark:text-slate-400 text-sm mb-3">{selectedEvent.location.address}</Text>
                        {selectedEvent.location.coordinates && (
                          <View className="rounded-xl overflow-hidden border border-gray-400 dark:border-slate-700 mb-3" style={{ height: 180 }}>
                            <MapView
                              provider={PROVIDER_DEFAULT}
                              style={{ width: '100%', height: '100%' }}
                              initialRegion={{
                                latitude: selectedEvent.location.coordinates.latitude,
                                longitude: selectedEvent.location.coordinates.longitude,
                                latitudeDelta: 0.01,
                                longitudeDelta: 0.01,
                              }}
                              scrollEnabled={false}
                              zoomEnabled={false}
                              pitchEnabled={false}
                              rotateEnabled={false}
                            >
                              <Marker
                                coordinate={{
                                  latitude: selectedEvent.location.coordinates.latitude,
                                  longitude: selectedEvent.location.coordinates.longitude,
                                }}
                                title={selectedEvent.location.venue}
                                description={selectedEvent.location.address}
                              />
                            </MapView>
                          </View>
                        )}
                        {selectedEvent.location.virtualLink && (
                          <Text className="text-blue-400 text-sm">{selectedEvent.location.virtualLink}</Text>
                        )}
                      </View>
                    )}
                  </View>

                  {/* Cost & Capacity */}
                  <View className="flex-row gap-3 mb-4">
                    <View className="flex-1 bg-gray-200 dark:bg-slate-800 rounded-xl p-4">
                      <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">Cost</Text>
                      <Text className="text-gray-900 dark:text-white text-xl font-bold">
                        {selectedEvent.cost === 0 ? 'Free' : `£${selectedEvent.cost}`}
                      </Text>
                    </View>
                    {selectedEvent.capacity && (
                      <View className="flex-1 bg-gray-200 dark:bg-slate-800 rounded-xl p-4">
                        <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">Capacity</Text>
                        <Text className="text-gray-900 dark:text-white text-xl font-bold">
                          {selectedEvent.attendees.length} / {selectedEvent.capacity}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Who can attend */}
                  <View className="bg-gray-200 dark:bg-slate-800 rounded-xl p-4 mb-4">
                    <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">Who can attend</Text>
                    <Text className="text-gray-900 dark:text-white font-semibold capitalize">
                      {selectedEvent.attendeeFor === 'all' ? 'Everyone' : selectedEvent.attendeeFor}
                    </Text>
                  </View>

                  {/* Invited Team Members */}
                  {selectedEvent.invitedMembers.length > 0 && (
                    <View className="bg-gray-200 dark:bg-slate-800 rounded-xl p-4 mb-6">
                      <View className="flex-row items-center mb-3">
                        <UserPlus size={16} color="#3b82f6" />
                        <Text className="text-gray-900 dark:text-white font-semibold ml-2">Invited Team Members</Text>
                        <View className="ml-auto bg-blue-500/20 px-2 py-1 rounded-full">
                          <Text className="text-blue-400 text-xs font-medium">
                            {selectedEvent.invitedMembers.length}
                          </Text>
                        </View>
                      </View>
                      <View className="gap-2">
                        {selectedEvent.invitedMembers.map((memberId) => {
                          const member = ORGANIZATION_MEMBERS.find(m => m.id === memberId);
                          if (!member) return null;
                          return (
                            <Pressable
                              key={member.id}
                              onPress={() => setSelectedMemberFromEvent(member)}
                              className="flex-row items-center p-2 bg-slate-750 rounded-lg active:opacity-70"
                            >
                              <View className={`w-8 h-8 rounded-full items-center justify-center ${
                                member.role === 'Founder'
                                  ? 'bg-purple-500/20'
                                  : member.role === 'FractionalExec'
                                  ? 'bg-blue-500/20'
                                  : 'bg-emerald-500/20'
                              }`}>
                                <Text className={`text-xs font-bold ${
                                  member.role === 'Founder'
                                    ? 'text-purple-400'
                                    : member.role === 'FractionalExec'
                                    ? 'text-blue-400'
                                    : 'text-emerald-400'
                                }`}>
                                  {member.name.split(' ').map(n => n[0]).join('')}
                                </Text>
                              </View>
                              <View className="flex-1 ml-2">
                                <Text className="text-gray-900 dark:text-white text-sm font-medium">{member.name}</Text>
                                <Text className="text-gray-600 dark:text-slate-400 text-xs">{member.role}</Text>
                              </View>
                              {selectedEvent.attendees.includes(memberId) && (
                                <View className="bg-emerald-500/20 px-2 py-1 rounded-full">
                                  <Text className="text-emerald-400 text-xs font-medium">Joined</Text>
                                </View>
                              )}
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* Join Button */}
                  <Pressable
                    onPress={() => handleJoinEvent(selectedEvent.id)}
                    className={`py-4 rounded-xl flex-row items-center justify-center ${
                      isUserJoined(selectedEvent)
                        ? 'bg-slate-800 border border-slate-700'
                        : 'bg-blue-500'
                    } active:opacity-70`}
                  >
                    {isUserJoined(selectedEvent) ? (
                      <>
                        <Check size={20} color="#10b981" />
                        <Text className="text-emerald-400 font-bold text-base ml-2">
                          Joined • Tap to Leave
                        </Text>
                      </>
                    ) : (
                      <>
                        <Plus size={20} color="white" />
                        <Text className="text-gray-900 dark:text-white font-bold text-base ml-2">Join Event</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>

      {/* Member Detail Modal (from invited list) */}
      <Modal visible={selectedMemberFromEvent !== null} transparent animationType="slide" onRequestClose={() => setSelectedMemberFromEvent(null)}>
        <Pressable
          className="flex-1 bg-black/70 justify-center px-6"
          onPress={() => setSelectedMemberFromEvent(null)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            {selectedMemberFromEvent && (
              <View className="bg-gray-100 dark:bg-slate-900 rounded-3xl p-6" style={{ maxHeight: '90%' }}>
                <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-gray-900 dark:text-white text-xl font-bold">{selectedMemberFromEvent.name}</Text>
                  <Pressable onPress={() => setSelectedMemberFromEvent(null)}>
                    <X size={24} color="#94a3b8" />
                  </Pressable>
                </View>

                <View className="bg-gray-200 dark:bg-slate-800 rounded-xl p-4 mb-4">
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm">Role:</Text>
                    <Text className="text-gray-900 dark:text-white font-semibold">{selectedMemberFromEvent.role}</Text>
                  </View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm">Function:</Text>
                    <Text className="text-gray-900 dark:text-white font-semibold">{selectedMemberFromEvent.function}</Text>
                  </View>
                  {selectedMemberFromEvent.costPerDay && (
                    <View className="flex-row justify-between">
                      <Text className="text-gray-600 dark:text-slate-400 text-sm">Cost:</Text>
                      <Text className="text-emerald-400 font-semibold">
                        £{selectedMemberFromEvent.costPerDay}/day
                      </Text>
                    </View>
                  )}
                </View>

                <View className="gap-3">
                  <Pressable
                    onPress={() => Linking.openURL(`mailto:${selectedMemberFromEvent.email}`)}
                    className="bg-blue-500 py-3 rounded-xl flex-row items-center justify-center gap-2 active:opacity-70"
                  >
                    <Mail size={18} color="#fff" />
                    <Text className="text-gray-900 dark:text-white font-semibold">Email</Text>
                  </Pressable>
                  {selectedMemberFromEvent.phone && (
                    <Pressable
                      onPress={() => Linking.openURL(`tel:${selectedMemberFromEvent.phone}`)}
                      className="bg-emerald-500 py-3 rounded-xl flex-row items-center justify-center gap-2 active:opacity-70"
                    >
                      <Phone size={18} color="#fff" />
                      <Text className="text-gray-900 dark:text-white font-semibold">Call</Text>
                    </Pressable>
                  )}
                </View>
              </ScrollView>
            </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Create Event Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-gray-100 dark:bg-slate-900 rounded-t-3xl" style={{ maxHeight: '90%' }}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View className="p-6">
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-gray-900 dark:text-white text-2xl font-bold">Create Event</Text>
                  <Pressable onPress={() => setShowCreateModal(false)}>
                    <X size={24} color="#94a3b8" />
                  </Pressable>
                </View>

                {/* Title */}
                <View className="mb-4">
                  <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">Event Title *</Text>
                  <TextInput
                    value={newEventTitle}
                    onChangeText={setNewEventTitle}
                    placeholder="e.g., Hardware Networking Meetup"
                    placeholderTextColor="#64748b"
                    className="bg-gray-200 dark:bg-slate-800 text-gray-900 dark:text-white px-4 py-3 rounded-xl border border-gray-400 dark:border-slate-700"
                  />
                </View>

                {/* Description */}
                <View className="mb-4">
                  <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">Description *</Text>
                  <TextInput
                    value={newEventDescription}
                    onChangeText={setNewEventDescription}
                    placeholder="What's this event about?"
                    placeholderTextColor="#64748b"
                    multiline
                    numberOfLines={4}
                    className="bg-gray-200 dark:bg-slate-800 text-gray-900 dark:text-white px-4 py-3 rounded-xl border border-gray-400 dark:border-slate-700"
                    style={{ minHeight: 100, textAlignVertical: 'top' }}
                  />
                </View>

                {/* Event Type */}
                <View className="mb-4">
                  <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">Event Type</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                    <View className="flex-row gap-2">
                      {(['networking', 'workshop', 'demo-day', 'office-hours', 'social', 'webinar'] as const).map((type) => (
                        <Pressable
                          key={type}
                          onPress={() => setNewEventType(type)}
                          className={`px-4 py-2 rounded-xl border ${
                            newEventType === type
                              ? 'bg-blue-500 border-blue-500'
                              : 'bg-slate-800 border-slate-700'
                          }`}
                        >
                          <Text className={`text-sm font-medium capitalize ${
                            newEventType === type ? 'text-white' : 'text-gray-600 dark:text-slate-400'
                          }`}>
                            {type.replace('-', ' ')}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Location Type */}
                <View className="mb-4">
                  <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">Location Type</Text>
                  <View className="flex-row gap-2">
                    {(['in-person', 'virtual', 'hybrid'] as const).map((type) => (
                      <Pressable
                        key={type}
                        onPress={() => setNewEventLocationType(type)}
                        className={`flex-1 px-4 py-3 rounded-xl border ${
                          newEventLocationType === type
                            ? 'bg-blue-500 border-blue-500'
                            : 'bg-slate-800 border-slate-700'
                        }`}
                      >
                        <Text className={`text-sm font-medium text-center capitalize ${
                          newEventLocationType === type ? 'text-white' : 'text-gray-600 dark:text-slate-400'
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
                      <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">Venue Name</Text>
                      <TextInput
                        value={newEventVenue}
                        onChangeText={setNewEventVenue}
                        placeholder="e.g., Hardware Hub London"
                        placeholderTextColor="#64748b"
                        className="bg-gray-200 dark:bg-slate-800 text-gray-900 dark:text-white px-4 py-3 rounded-xl border border-gray-400 dark:border-slate-700"
                      />
                    </View>
                    <View className="mb-4">
                      <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">Address</Text>
                      <TextInput
                        value={newEventAddress}
                        onChangeText={setNewEventAddress}
                        placeholder="Full address"
                        placeholderTextColor="#64748b"
                        className="bg-gray-200 dark:bg-slate-800 text-gray-900 dark:text-white px-4 py-3 rounded-xl border border-gray-400 dark:border-slate-700"
                      />
                    </View>
                  </>
                )}

                {/* Virtual Link (if virtual or hybrid) */}
                {(newEventLocationType === 'virtual' || newEventLocationType === 'hybrid') && (
                  <View className="mb-4">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">Virtual Link</Text>
                    <TextInput
                      value={newEventVirtualLink}
                      onChangeText={setNewEventVirtualLink}
                      placeholder="Zoom, Teams, or Meet link"
                      placeholderTextColor="#64748b"
                      className="bg-gray-200 dark:bg-slate-800 text-gray-900 dark:text-white px-4 py-3 rounded-xl border border-gray-400 dark:border-slate-700"
                    />
                  </View>
                )}

                {/* Start Date/Time */}
                <View className="mb-4">
                  <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">Start Date & Time</Text>
                  <Pressable
                    onPress={() => setShowStartDatePicker(true)}
                    className="bg-gray-200 dark:bg-slate-800 px-4 py-3 rounded-xl border border-gray-400 dark:border-slate-700"
                  >
                    <Text className="text-gray-900 dark:text-white">
                      {newEventStartDate.toLocaleString('en-GB', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </Pressable>
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
                        // Auto-adjust end date if needed
                        if (date >= newEventEndDate) {
                          setNewEventEndDate(new Date(date.getTime() + 3 * 60 * 60 * 1000));
                        }
                      }
                    }}
                  />
                )}

                {/* End Date/Time */}
                <View className="mb-4">
                  <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">End Date & Time</Text>
                  <Pressable
                    onPress={() => setShowEndDatePicker(true)}
                    className="bg-gray-200 dark:bg-slate-800 px-4 py-3 rounded-xl border border-gray-400 dark:border-slate-700"
                  >
                    <Text className="text-gray-900 dark:text-white">
                      {newEventEndDate.toLocaleString('en-GB', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </Pressable>
                </View>

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

                {/* Who can attend */}
                <View className="mb-4">
                  <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">Who can attend?</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {(['all', 'founders', 'executives', 'apprentices'] as const).map((type) => (
                      <Pressable
                        key={type}
                        onPress={() => setNewEventAttendeeFor(type)}
                        className={`px-4 py-2 rounded-xl border ${
                          newEventAttendeeFor === type
                            ? 'bg-blue-500 border-blue-500'
                            : 'bg-slate-800 border-slate-700'
                        }`}
                      >
                        <Text className={`text-sm font-medium capitalize ${
                          newEventAttendeeFor === type ? 'text-white' : 'text-gray-600 dark:text-slate-400'
                        }`}>
                          {type === 'all' ? 'Everyone' : type}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Cost */}
                <View className="mb-4">
                  <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">Cost (£)</Text>
                  <TextInput
                    value={newEventCost}
                    onChangeText={setNewEventCost}
                    placeholder="0 for free events"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    className="bg-gray-200 dark:bg-slate-800 text-gray-900 dark:text-white px-4 py-3 rounded-xl border border-gray-400 dark:border-slate-700"
                  />
                </View>

                {/* Capacity */}
                <View className="mb-4">
                  <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">Capacity (Optional)</Text>
                  <TextInput
                    value={newEventCapacity}
                    onChangeText={setNewEventCapacity}
                    placeholder="Leave empty for unlimited"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    className="bg-gray-200 dark:bg-slate-800 text-gray-900 dark:text-white px-4 py-3 rounded-xl border border-gray-400 dark:border-slate-700"
                  />
                </View>

                {/* Invite Team Members */}
                <View className="mb-6">
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm">Invite Team Members</Text>
                    <Text className="text-blue-400 text-xs font-medium">
                      {selectedInvitedMembers.length} selected
                    </Text>
                  </View>
                  <View className="bg-gray-200 dark:bg-slate-800 rounded-xl border border-gray-400 dark:border-slate-700 p-3">
                    <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                      {ORGANIZATION_MEMBERS.map((member) => {
                        const isSelected = selectedInvitedMembers.includes(member.id);
                        return (
                          <Pressable
                            key={member.id}
                            onPress={() => {
                              if (isSelected) {
                                setSelectedInvitedMembers(selectedInvitedMembers.filter(id => id !== member.id));
                              } else {
                                setSelectedInvitedMembers([...selectedInvitedMembers, member.id]);
                              }
                            }}
                            className={`flex-row items-center p-3 rounded-xl mb-2 ${
                              isSelected ? 'bg-blue-500/20 border border-blue-500/50' : 'bg-slate-750'
                            }`}
                          >
                            <View className={`w-10 h-10 rounded-full items-center justify-center ${
                              member.role === 'Founder'
                                ? 'bg-purple-500/20'
                                : member.role === 'FractionalExec'
                                ? 'bg-blue-500/20'
                                : 'bg-emerald-500/20'
                            }`}>
                              <Text className={`text-sm font-bold ${
                                member.role === 'Founder'
                                  ? 'text-purple-400'
                                  : member.role === 'FractionalExec'
                                  ? 'text-blue-400'
                                  : 'text-emerald-400'
                              }`}>
                                {member.name.split(' ').map(n => n[0]).join('')}
                              </Text>
                            </View>
                            <View className="flex-1 ml-3">
                              <Text className="text-gray-900 dark:text-white font-medium text-sm">{member.name}</Text>
                              <Text className="text-gray-600 dark:text-slate-400 text-xs">{member.role}</Text>
                            </View>
                            {isSelected && (
                              <View className="w-5 h-5 rounded-full bg-blue-500 items-center justify-center">
                                <Check size={14} color="white" />
                              </View>
                            )}
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>
                </View>

                {/* Action Buttons */}
                <View className="gap-3">
                  <Pressable
                    onPress={handleCreateEvent}
                    disabled={!newEventTitle.trim() || !newEventDescription.trim()}
                    className={`py-4 rounded-xl ${
                      !newEventTitle.trim() || !newEventDescription.trim()
                        ? 'bg-slate-700'
                        : 'bg-blue-500'
                    } active:opacity-70`}
                  >
                    <Text className="text-gray-900 dark:text-white text-center font-bold text-base">Create Event</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setShowCreateModal(false)}
                    className="bg-gray-200 dark:bg-slate-800 py-3 rounded-xl active:opacity-70"
                  >
                    <Text className="text-gray-600 dark:text-slate-400 text-center font-semibold">Cancel</Text>
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
