import { View, Text, ScrollView, Pressable, Modal, TextInput, Switch, Alert } from 'react-native';
import { useState, useMemo, useCallback } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeInUp, SlideInRight } from 'react-native-reanimated';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Bell,
  X,
  Check,
  Repeat,
  Tag,
  Smartphone,
  Import,
  List,
  Grid3X3,
  CalendarDays,
  Target,
  Truck,
  Video,
  CheckSquare,
  Milestone,
  PartyPopper,
  User,
} from 'lucide-react-native';
import { useCalendarStore, CalendarEvent, CalendarEventType } from '@/lib/state/calendar-store';
import { useTheme } from '@/lib/ThemeContext';
import { cn } from '@/lib/cn';
import DateTimePicker from '@react-native-community/datetimepicker';

// Default workspaceId for demo company
const DEFAULT_WORKSPACE_ID = 'workspace-demo-company';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const EVENT_TYPES: { type: CalendarEventType; label: string; icon: any; color: string }[] = [
  { type: 'meeting', label: 'Meeting', icon: Video, color: '#3b82f6' },
  { type: 'task_deadline', label: 'Task Deadline', icon: CheckSquare, color: '#ef4444' },
  { type: 'review', label: 'Review', icon: Target, color: '#8b5cf6' },
  { type: 'milestone', label: 'Milestone', icon: Milestone, color: '#10b981' },
  { type: 'supplier_delivery', label: 'Delivery', icon: Truck, color: '#f59e0b' },
  { type: 'team_event', label: 'Team Event', icon: PartyPopper, color: '#ec4899' },
  { type: 'personal', label: 'Personal', icon: User, color: '#64748b' },
];

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';

  const {
    events,
    selectedDate,
    viewMode,
    setSelectedDate,
    setViewMode,
    addEvent,
    updateEvent,
    deleteEvent,
    getEventsForDate,
    deviceCalendars,
    hasCalendarPermission,
    requestCalendarPermission,
    loadDeviceCalendars,
    syncToDeviceCalendar,
  } = useCalendarStore();

  const [showEventModal, setShowEventModal] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState<CalendarEvent | null>(null);
  const [showDeviceCalendars, setShowDeviceCalendars] = useState(false);

  // New event form state
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventType, setNewEventType] = useState<CalendarEventType>('meeting');
  const [newEventStartDate, setNewEventStartDate] = useState(new Date());
  const [newEventEndDate, setNewEventEndDate] = useState(new Date(Date.now() + 60 * 60 * 1000));
  const [newEventAllDay, setNewEventAllDay] = useState(false);
  const [newEventLocation, setNewEventLocation] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Theme classes
  const bgPrimary = isDark ? 'bg-slate-950' : isOffWhite ? 'bg-orange-50' : 'bg-gray-50';
  const bgCard = isDark ? 'bg-slate-900' : isOffWhite ? 'bg-white' : 'bg-white';
  const bgCardAlt = isDark ? 'bg-slate-800' : isOffWhite ? 'bg-orange-100' : 'bg-gray-100';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-orange-700' : 'text-gray-600';
  const textMuted = isDark ? 'text-slate-500' : isOffWhite ? 'text-orange-500' : 'text-gray-400';
  const borderColor = isDark ? 'border-slate-800' : isOffWhite ? 'border-orange-200' : 'border-gray-200';

  // Calendar calculations
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();

  const daysInMonth = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startPadding = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days: (Date | null)[] = [];

    // Add padding for days before month starts
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }

    // Add actual days
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(currentYear, currentMonth, i));
    }

    return days;
  }, [currentMonth, currentYear]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const selectedDateEvents = useMemo(() => {
    return getEventsForDate(DEFAULT_WORKSPACE_ID, selectedDate);
  }, [selectedDate, events]);

  const getEventsCountForDate = useCallback((date: Date | null) => {
    if (!date) return 0;
    return events.filter(e => new Date(e.startDate).toDateString() === date.toDateString()).length;
  }, [events]);

  const handleCreateEvent = () => {
    if (!newEventTitle.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }

    addEvent({
      workspaceId: DEFAULT_WORKSPACE_ID,
      title: newEventTitle,
      description: newEventDescription || undefined,
      startDate: newEventStartDate,
      endDate: newEventEndDate,
      allDay: newEventAllDay,
      type: newEventType,
      color: EVENT_TYPES.find(t => t.type === newEventType)?.color || '#3b82f6',
      location: newEventLocation || undefined,
      reminders: [30],
      recurrence: 'none',
      createdBy: 'user-1',
    });

    // Reset form
    setNewEventTitle('');
    setNewEventDescription('');
    setNewEventType('meeting');
    setNewEventStartDate(new Date());
    setNewEventEndDate(new Date(Date.now() + 60 * 60 * 1000));
    setNewEventAllDay(false);
    setNewEventLocation('');
    setShowEventModal(false);
  };

  const handleDeleteEvent = (eventId: string) => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteEvent(eventId);
            setShowEventDetails(null);
          },
        },
      ]
    );
  };

  const handleSyncToDevice = async (eventId: string) => {
    try {
      if (!hasCalendarPermission) {
        const granted = await requestCalendarPermission();
        if (!granted) {
          Alert.alert('Permission Required', 'Calendar access is needed to sync events to your device calendar.');
          return;
        }
        // Load calendars after getting permission
        await loadDeviceCalendars();
      }
      await syncToDeviceCalendar(eventId);
      Alert.alert('Synced', 'Event added to your device calendar');
    } catch (error) {
      console.error('Sync error:', error);
      Alert.alert('Sync Failed', 'Could not sync to device calendar. Please check calendar permissions in Settings.');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === new Date().toDateString();
  };

  const isSelected = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  return (
    <View className={cn("flex-1", bgPrimary)}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={{ paddingTop: insets.top }}>
        <LinearGradient
          colors={isDark ? ['#1e293b', '#0f172a'] : ['#8b5cf6', '#7c3aed']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingBottom: 20, paddingHorizontal: 20 }}
        >
          <View className="flex-row items-center justify-between mb-4 pt-2">
            <View className="flex-row items-center">
              <Pressable
                onPress={() => router.back()}
                className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center mr-3"
              >
                <ArrowLeft size={20} color="#fff" />
              </Pressable>
              <CalendarIcon size={24} color="#fff" />
              <Text className="text-white text-xl font-bold ml-2">Calendar</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={() => setShowDeviceCalendars(true)}
                className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center"
              >
                <Smartphone size={20} color="#fff" />
              </Pressable>
              <Pressable
                onPress={() => {
                  setNewEventStartDate(selectedDate);
                  setNewEventEndDate(new Date(selectedDate.getTime() + 60 * 60 * 1000));
                  setShowEventModal(true);
                }}
                className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center"
              >
                <Plus size={20} color="#fff" />
              </Pressable>
            </View>
          </View>

          {/* Month Navigation */}
          <View className="flex-row items-center justify-between">
            <Pressable onPress={() => navigateMonth('prev')} className="p-2">
              <ChevronLeft size={24} color="#fff" />
            </Pressable>
            <Pressable onPress={goToToday}>
              <Text className="text-white text-lg font-bold">
                {MONTHS[currentMonth]} {currentYear}
              </Text>
            </Pressable>
            <Pressable onPress={() => navigateMonth('next')} className="p-2">
              <ChevronRight size={24} color="#fff" />
            </Pressable>
          </View>

          {/* View Mode Toggle */}
          <View className="flex-row justify-center mt-3 gap-2">
            {(['month', 'week', 'agenda'] as const).map((mode) => (
              <Pressable
                key={mode}
                onPress={() => setViewMode(mode)}
                className={cn(
                  'px-4 py-1.5 rounded-full',
                  viewMode === mode ? 'bg-white' : 'bg-white/20'
                )}
              >
                <Text className={viewMode === mode ? 'text-purple-600 font-semibold' : 'text-white'}>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </LinearGradient>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Calendar Grid */}
        {viewMode === 'month' && (
          <Animated.View entering={FadeIn} className="px-4 py-4">
            {/* Day Headers */}
            <View className="flex-row mb-2">
              {DAYS.map((day) => (
                <View key={day} className="flex-1 items-center">
                  <Text className={cn("text-xs font-semibold", textMuted)}>{day}</Text>
                </View>
              ))}
            </View>

            {/* Calendar Days */}
            <View className="flex-row flex-wrap">
              {daysInMonth.map((date, index) => {
                const eventCount = getEventsCountForDate(date);
                return (
                  <Pressable
                    key={index}
                    onPress={() => date && setSelectedDate(date)}
                    className="w-[14.28%] aspect-square p-1"
                  >
                    <View
                      className={cn(
                        'flex-1 rounded-xl items-center justify-center',
                        isSelected(date) && 'bg-purple-500',
                        isToday(date) && !isSelected(date) && 'bg-purple-500/20',
                        !date && 'opacity-0'
                      )}
                    >
                      <Text
                        className={cn(
                          'text-sm font-medium',
                          isSelected(date) ? 'text-white' : textPrimary,
                          isToday(date) && !isSelected(date) && 'text-purple-500 font-bold'
                        )}
                      >
                        {date?.getDate()}
                      </Text>
                      {eventCount > 0 && (
                        <View className="flex-row gap-0.5 mt-0.5">
                          {[...Array(Math.min(eventCount, 3))].map((_, i) => (
                            <View
                              key={i}
                              className={cn(
                                'w-1.5 h-1.5 rounded-full',
                                isSelected(date) ? 'bg-white' : 'bg-purple-500'
                              )}
                            />
                          ))}
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Selected Day Events */}
        <View className="px-4 pb-8">
          <View className="flex-row items-center justify-between mb-3">
            <Text className={cn("text-lg font-bold", textPrimary)}>
              {selectedDate.toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
            <Text className={textSecondary}>
              {selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {selectedDateEvents.length === 0 ? (
            <View className={cn("p-6 rounded-2xl items-center", bgCard)}>
              <CalendarIcon size={40} color={isDark ? '#475569' : '#9ca3af'} />
              <Text className={cn("mt-3 font-medium", textSecondary)}>No events scheduled</Text>
              <Pressable
                onPress={() => {
                  setNewEventStartDate(selectedDate);
                  setNewEventEndDate(new Date(selectedDate.getTime() + 60 * 60 * 1000));
                  setShowEventModal(true);
                }}
                className="mt-3 bg-purple-500 px-4 py-2 rounded-xl"
              >
                <Text className="text-white font-semibold">Add Event</Text>
              </Pressable>
            </View>
          ) : (
            <View className="gap-3">
              {selectedDateEvents.map((event, index) => {
                const EventIcon = EVENT_TYPES.find(t => t.type === event.type)?.icon || CalendarIcon;
                return (
                  <Animated.View key={event.id} entering={FadeInDown.delay(index * 50)}>
                    <Pressable
                      onPress={() => setShowEventDetails(event)}
                      className={cn("p-4 rounded-2xl border", bgCard, borderColor)}
                    >
                      <View className="flex-row items-start">
                        <View
                          className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                          style={{ backgroundColor: `${event.color}20` }}
                        >
                          <EventIcon size={20} color={event.color} />
                        </View>
                        <View className="flex-1">
                          <Text className={cn("font-semibold", textPrimary)}>{event.title}</Text>
                          {!event.allDay && (
                            <View className="flex-row items-center mt-1">
                              <Clock size={12} color={isDark ? '#64748b' : '#9ca3af'} />
                              <Text className={cn("text-sm ml-1", textSecondary)}>
                                {formatTime(new Date(event.startDate))} - {formatTime(new Date(event.endDate))}
                              </Text>
                            </View>
                          )}
                          {event.allDay && (
                            <Text className={cn("text-sm", textSecondary)}>All day</Text>
                          )}
                          {event.location && (
                            <View className="flex-row items-center mt-1">
                              <MapPin size={12} color={isDark ? '#64748b' : '#9ca3af'} />
                              <Text className={cn("text-sm ml-1", textSecondary)}>{event.location}</Text>
                            </View>
                          )}
                        </View>
                        <View
                          className="w-1 h-full rounded-full absolute right-0 top-0 bottom-0"
                          style={{ backgroundColor: event.color }}
                        />
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </View>

        {/* Upcoming Events (Agenda View) */}
        {viewMode === 'agenda' && (
          <Animated.View entering={FadeIn} className="px-4 pb-8">
            <Text className={cn("text-lg font-bold mb-3", textPrimary)}>Upcoming Events</Text>
            <View className="gap-3">
              {events
                .filter((e) => new Date(e.startDate) >= new Date())
                .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                .slice(0, 10)
                .map((event, index) => {
                  const EventIcon = EVENT_TYPES.find(t => t.type === event.type)?.icon || CalendarIcon;
                  const eventDate = new Date(event.startDate);
                  return (
                    <Animated.View key={event.id} entering={FadeInDown.delay(index * 50)}>
                      <Pressable
                        onPress={() => setShowEventDetails(event)}
                        className={cn("p-4 rounded-2xl border", bgCard, borderColor)}
                      >
                        <View className="flex-row items-center mb-2">
                          <View
                            className="px-2 py-1 rounded-lg mr-2"
                            style={{ backgroundColor: `${event.color}20` }}
                          >
                            <Text style={{ color: event.color }} className="text-xs font-bold">
                              {eventDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </Text>
                          </View>
                          {!event.allDay && (
                            <Text className={textSecondary}>{formatTime(eventDate)}</Text>
                          )}
                        </View>
                        <View className="flex-row items-center">
                          <EventIcon size={18} color={event.color} />
                          <Text className={cn("font-semibold ml-2", textPrimary)}>{event.title}</Text>
                        </View>
                      </Pressable>
                    </Animated.View>
                  );
                })}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Create Event Modal */}
      <Modal visible={showEventModal} animationType="slide" transparent>
        <View className="flex-1 justify-end">
          <Pressable
            className="flex-1 bg-black/50"
            onPress={() => setShowEventModal(false)}
          />
          <View className={cn("rounded-t-3xl p-6", isDark ? 'bg-slate-900' : 'bg-white')} style={{ paddingBottom: insets.bottom + 20 }}>
            <View className="flex-row items-center justify-between mb-6">
              <Text className={cn("text-xl font-bold", textPrimary)}>New Event</Text>
              <Pressable onPress={() => setShowEventModal(false)}>
                <X size={24} color={isDark ? '#fff' : '#000'} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
              {/* Title */}
              <Text className={cn("text-sm font-medium mb-2", textSecondary)}>Title</Text>
              <TextInput
                value={newEventTitle}
                onChangeText={setNewEventTitle}
                placeholder="Event title"
                placeholderTextColor={isDark ? '#64748b' : '#9ca3af'}
                className={cn("px-4 py-3 rounded-xl mb-4", bgCardAlt, textPrimary)}
              />

              {/* Event Type */}
              <Text className={cn("text-sm font-medium mb-2", textSecondary)}>Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} className="mb-4">
                <View className="flex-row gap-2">
                  {EVENT_TYPES.map((type) => (
                    <Pressable
                      key={type.type}
                      onPress={() => setNewEventType(type.type)}
                      className={cn(
                        "px-3 py-2 rounded-xl flex-row items-center",
                        newEventType === type.type ? 'bg-purple-500' : bgCardAlt
                      )}
                    >
                      <type.icon
                        size={16}
                        color={newEventType === type.type ? '#fff' : type.color}
                      />
                      <Text
                        className={cn(
                          "ml-2 font-medium",
                          newEventType === type.type ? 'text-white' : textPrimary
                        )}
                      >
                        {type.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              {/* All Day Toggle */}
              <View className="flex-row items-center justify-between mb-4">
                <Text className={cn("font-medium", textPrimary)}>All Day</Text>
                <Switch
                  value={newEventAllDay}
                  onValueChange={setNewEventAllDay}
                  trackColor={{ false: isDark ? '#475569' : '#e5e7eb', true: '#8b5cf6' }}
                />
              </View>

              {/* Date/Time */}
              <View className="flex-row gap-3 mb-4">
                <Pressable
                  onPress={() => setShowStartPicker(true)}
                  className={cn("flex-1 px-4 py-3 rounded-xl", bgCardAlt)}
                >
                  <Text className={textSecondary}>Start</Text>
                  <Text className={cn("font-medium", textPrimary)}>
                    {newEventStartDate.toLocaleDateString()}
                    {!newEventAllDay && ` ${formatTime(newEventStartDate)}`}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setShowEndPicker(true)}
                  className={cn("flex-1 px-4 py-3 rounded-xl", bgCardAlt)}
                >
                  <Text className={textSecondary}>End</Text>
                  <Text className={cn("font-medium", textPrimary)}>
                    {newEventEndDate.toLocaleDateString()}
                    {!newEventAllDay && ` ${formatTime(newEventEndDate)}`}
                  </Text>
                </Pressable>
              </View>

              {showStartPicker && (
                <DateTimePicker
                  value={newEventStartDate}
                  mode={newEventAllDay ? 'date' : 'datetime'}
                  onChange={(event, date) => {
                    setShowStartPicker(false);
                    if (date) setNewEventStartDate(date);
                  }}
                />
              )}

              {showEndPicker && (
                <DateTimePicker
                  value={newEventEndDate}
                  mode={newEventAllDay ? 'date' : 'datetime'}
                  onChange={(event, date) => {
                    setShowEndPicker(false);
                    if (date) setNewEventEndDate(date);
                  }}
                />
              )}

              {/* Location */}
              <Text className={cn("text-sm font-medium mb-2", textSecondary)}>Location (optional)</Text>
              <TextInput
                value={newEventLocation}
                onChangeText={setNewEventLocation}
                placeholder="Add location"
                placeholderTextColor={isDark ? '#64748b' : '#9ca3af'}
                className={cn("px-4 py-3 rounded-xl mb-4", bgCardAlt, textPrimary)}
              />

              {/* Description */}
              <Text className={cn("text-sm font-medium mb-2", textSecondary)}>Description (optional)</Text>
              <TextInput
                value={newEventDescription}
                onChangeText={setNewEventDescription}
                placeholder="Add description"
                placeholderTextColor={isDark ? '#64748b' : '#9ca3af'}
                multiline
                numberOfLines={3}
                className={cn("px-4 py-3 rounded-xl mb-6", bgCardAlt, textPrimary)}
                style={{ textAlignVertical: 'top', minHeight: 80 }}
              />

              {/* Create Button */}
              <Pressable
                onPress={handleCreateEvent}
                className="bg-purple-500 py-4 rounded-xl items-center"
              >
                <Text className="text-white font-bold text-lg">Create Event</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Event Details Modal */}
      <Modal visible={showEventDetails !== null} animationType="slide" transparent>
        <View className="flex-1 justify-end">
          <Pressable
            className="flex-1 bg-black/50"
            onPress={() => setShowEventDetails(null)}
          />
          {showEventDetails && (
            <View className={cn("rounded-t-3xl p-6", isDark ? 'bg-slate-900' : 'bg-white')} style={{ paddingBottom: insets.bottom + 20 }}>
              <View className="flex-row items-start justify-between mb-4">
                <View className="flex-1">
                  <View
                    className="w-12 h-12 rounded-xl items-center justify-center mb-3"
                    style={{ backgroundColor: `${showEventDetails.color}20` }}
                  >
                    {(() => {
                      const EventIcon = EVENT_TYPES.find(t => t.type === showEventDetails.type)?.icon || CalendarIcon;
                      return <EventIcon size={24} color={showEventDetails.color} />;
                    })()}
                  </View>
                  <Text className={cn("text-xl font-bold", textPrimary)}>{showEventDetails.title}</Text>
                  <Text className={cn("text-sm mt-1", textSecondary)}>
                    {EVENT_TYPES.find(t => t.type === showEventDetails.type)?.label}
                  </Text>
                </View>
                <Pressable onPress={() => setShowEventDetails(null)}>
                  <X size={24} color={isDark ? '#fff' : '#000'} />
                </Pressable>
              </View>

              {/* Date & Time */}
              <View className={cn("p-4 rounded-xl mb-4", bgCardAlt)}>
                <View className="flex-row items-center mb-2">
                  <CalendarIcon size={18} color={isDark ? '#94a3b8' : '#6b7280'} />
                  <Text className={cn("ml-2", textPrimary)}>
                    {new Date(showEventDetails.startDate).toLocaleDateString(undefined, {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
                {!showEventDetails.allDay && (
                  <View className="flex-row items-center">
                    <Clock size={18} color={isDark ? '#94a3b8' : '#6b7280'} />
                    <Text className={cn("ml-2", textPrimary)}>
                      {formatTime(new Date(showEventDetails.startDate))} - {formatTime(new Date(showEventDetails.endDate))}
                    </Text>
                  </View>
                )}
                {showEventDetails.allDay && (
                  <View className="flex-row items-center">
                    <Clock size={18} color={isDark ? '#94a3b8' : '#6b7280'} />
                    <Text className={cn("ml-2", textPrimary)}>All day</Text>
                  </View>
                )}
              </View>

              {/* Location */}
              {showEventDetails.location && (
                <View className={cn("p-4 rounded-xl mb-4 flex-row items-center", bgCardAlt)}>
                  <MapPin size={18} color={isDark ? '#94a3b8' : '#6b7280'} />
                  <Text className={cn("ml-2", textPrimary)}>{showEventDetails.location}</Text>
                </View>
              )}

              {/* Description */}
              {showEventDetails.description && (
                <View className={cn("p-4 rounded-xl mb-4", bgCardAlt)}>
                  <Text className={textPrimary}>{showEventDetails.description}</Text>
                </View>
              )}

              {/* Actions */}
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => handleSyncToDevice(showEventDetails.id)}
                  className={cn("flex-1 py-3 rounded-xl flex-row items-center justify-center", bgCardAlt)}
                >
                  <Smartphone size={18} color={isDark ? '#94a3b8' : '#6b7280'} />
                  <Text className={cn("ml-2 font-medium", textPrimary)}>Sync to Device</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleDeleteEvent(showEventDetails.id)}
                  className="flex-1 py-3 rounded-xl flex-row items-center justify-center bg-red-500/10"
                >
                  <X size={18} color="#ef4444" />
                  <Text className="ml-2 font-medium text-red-500">Delete</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Device Calendars Modal */}
      <Modal visible={showDeviceCalendars} animationType="slide" transparent>
        <View className="flex-1 justify-end">
          <Pressable
            className="flex-1 bg-black/50"
            onPress={() => setShowDeviceCalendars(false)}
          />
          <View className={cn("rounded-t-3xl p-6", isDark ? 'bg-slate-900' : 'bg-white')} style={{ paddingBottom: insets.bottom + 20 }}>
            <View className="flex-row items-center justify-between mb-6">
              <Text className={cn("text-xl font-bold", textPrimary)}>Device Calendars</Text>
              <Pressable onPress={() => setShowDeviceCalendars(false)}>
                <X size={24} color={isDark ? '#fff' : '#000'} />
              </Pressable>
            </View>

            {!hasCalendarPermission ? (
              <View className="items-center py-8">
                <Smartphone size={48} color={isDark ? '#475569' : '#9ca3af'} />
                <Text className={cn("mt-4 text-center", textSecondary)}>
                  Grant calendar access to sync events with your device
                </Text>
                <Pressable
                  onPress={async () => {
                    const granted = await requestCalendarPermission();
                    if (granted) {
                      await loadDeviceCalendars();
                    }
                  }}
                  className="mt-4 bg-purple-500 px-6 py-3 rounded-xl"
                >
                  <Text className="text-white font-semibold">Grant Access</Text>
                </Pressable>
              </View>
            ) : deviceCalendars.length === 0 ? (
              <View className="items-center py-8">
                <Pressable
                  onPress={loadDeviceCalendars}
                  className="bg-purple-500 px-6 py-3 rounded-xl"
                >
                  <Text className="text-white font-semibold">Load Calendars</Text>
                </Pressable>
              </View>
            ) : (
              <View className="gap-3">
                {deviceCalendars.map((cal) => (
                  <View
                    key={cal.id}
                    className={cn("p-4 rounded-xl flex-row items-center", bgCardAlt)}
                  >
                    <View
                      className="w-4 h-4 rounded-full mr-3"
                      style={{ backgroundColor: cal.color }}
                    />
                    <View className="flex-1">
                      <Text className={cn("font-medium", textPrimary)}>{cal.title}</Text>
                      <Text className={cn("text-sm", textSecondary)}>{cal.source}</Text>
                    </View>
                    {cal.allowsModifications && (
                      <View className="bg-green-500/20 px-2 py-1 rounded">
                        <Text className="text-green-500 text-xs font-medium">Writable</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
