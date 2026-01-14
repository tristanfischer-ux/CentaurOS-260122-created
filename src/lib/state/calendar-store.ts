import { create } from 'zustand';
import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

export type CalendarEventType =
  | 'task_deadline'
  | 'meeting'
  | 'review'
  | 'milestone'
  | 'supplier_delivery'
  | 'team_event'
  | 'personal';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  type: CalendarEventType;
  color: string;
  location?: string;
  attendees?: string[];
  reminders?: number[]; // minutes before
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  linkedTaskId?: string;
  linkedMilestoneId?: string;
  linkedSupplierId?: string;
  deviceCalendarId?: string; // ID in device calendar if synced
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceCalendar {
  id: string;
  title: string;
  color: string;
  source: string;
  allowsModifications: boolean;
  isSelected: boolean;
}

interface CalendarState {
  events: CalendarEvent[];
  deviceCalendars: DeviceCalendar[];
  selectedDate: Date;
  viewMode: 'month' | 'week' | 'day' | 'agenda';
  hasCalendarPermission: boolean;
  isLoading: boolean;
  syncEnabled: boolean;

  // Actions
  setSelectedDate: (date: Date) => void;
  setViewMode: (mode: 'month' | 'week' | 'day' | 'agenda') => void;

  // Event management
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => CalendarEvent;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  getEventsForDate: (date: Date) => CalendarEvent[];
  getEventsForDateRange: (start: Date, end: Date) => CalendarEvent[];

  // Device calendar integration
  requestCalendarPermission: () => Promise<boolean>;
  loadDeviceCalendars: () => Promise<void>;
  toggleDeviceCalendar: (calendarId: string) => void;
  syncToDeviceCalendar: (eventId: string) => Promise<void>;
  importFromDeviceCalendar: (calendarId: string, startDate: Date, endDate: Date) => Promise<void>;

  // Utility
  getEventColor: (type: CalendarEventType) => string;
}

const EVENT_COLORS: Record<CalendarEventType, string> = {
  task_deadline: '#ef4444', // red
  meeting: '#3b82f6', // blue
  review: '#8b5cf6', // purple
  milestone: '#10b981', // green
  supplier_delivery: '#f59e0b', // amber
  team_event: '#ec4899', // pink
  personal: '#64748b', // gray
};

// Sample events for demo
const SAMPLE_EVENTS: CalendarEvent[] = [
  {
    id: 'evt-1',
    title: 'Q1 Product Review',
    description: 'Quarterly product milestone review with stakeholders',
    startDate: new Date(new Date().setHours(10, 0, 0, 0)),
    endDate: new Date(new Date().setHours(11, 30, 0, 0)),
    allDay: false,
    type: 'review',
    color: EVENT_COLORS.review,
    attendees: ['Sarah Chen', 'Marcus Webb'],
    reminders: [30, 10],
    recurrence: 'none',
    createdBy: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'evt-2',
    title: 'PCB Assembly Delivery',
    description: 'Expected delivery from TechFlow Manufacturing',
    startDate: new Date(new Date().setDate(new Date().getDate() + 2)),
    endDate: new Date(new Date().setDate(new Date().getDate() + 2)),
    allDay: true,
    type: 'supplier_delivery',
    color: EVENT_COLORS.supplier_delivery,
    linkedSupplierId: 'sup-1',
    reminders: [1440], // 1 day before
    recurrence: 'none',
    createdBy: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'evt-3',
    title: 'Sprint Planning',
    description: 'Weekly sprint planning session',
    startDate: new Date(new Date().setDate(new Date().getDate() + 1)),
    endDate: new Date(new Date().setDate(new Date().getDate() + 1)),
    allDay: false,
    type: 'meeting',
    color: EVENT_COLORS.meeting,
    attendees: ['Team'],
    reminders: [15],
    recurrence: 'weekly',
    createdBy: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'evt-4',
    title: 'MVP Launch Deadline',
    description: 'Target date for MVP completion',
    startDate: new Date(new Date().setDate(new Date().getDate() + 7)),
    endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
    allDay: true,
    type: 'milestone',
    color: EVENT_COLORS.milestone,
    linkedMilestoneId: 'ms-1',
    reminders: [1440, 10080], // 1 day and 1 week before
    recurrence: 'none',
    createdBy: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'evt-5',
    title: 'UI Design Task Due',
    description: 'Complete homepage redesign mockups',
    startDate: new Date(new Date().setDate(new Date().getDate() + 3)),
    endDate: new Date(new Date().setDate(new Date().getDate() + 3)),
    allDay: true,
    type: 'task_deadline',
    color: EVENT_COLORS.task_deadline,
    linkedTaskId: 'task-1',
    reminders: [1440],
    recurrence: 'none',
    createdBy: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: SAMPLE_EVENTS,
  deviceCalendars: [],
  selectedDate: new Date(),
  viewMode: 'month',
  hasCalendarPermission: false,
  isLoading: false,
  syncEnabled: false,

  setSelectedDate: (date) => set({ selectedDate: date }),
  setViewMode: (mode) => set({ viewMode: mode }),

  addEvent: (eventData) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: `evt-${Date.now()}`,
      color: eventData.color || EVENT_COLORS[eventData.type],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({ events: [...state.events, newEvent] }));
    return newEvent;
  },

  updateEvent: (id, updates) => {
    set((state) => ({
      events: state.events.map((event) =>
        event.id === id
          ? { ...event, ...updates, updatedAt: new Date().toISOString() }
          : event
      ),
    }));
  },

  deleteEvent: (id) => {
    set((state) => ({
      events: state.events.filter((event) => event.id !== id),
    }));
  },

  getEventsForDate: (date) => {
    const { events } = get();
    const dateStr = date.toDateString();
    return events.filter((event) => {
      const eventDateStr = new Date(event.startDate).toDateString();
      return eventDateStr === dateStr;
    });
  },

  getEventsForDateRange: (start, end) => {
    const { events } = get();
    return events.filter((event) => {
      const eventStart = new Date(event.startDate);
      return eventStart >= start && eventStart <= end;
    });
  },

  requestCalendarPermission: async () => {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      const granted = status === 'granted';
      set({ hasCalendarPermission: granted });
      return granted;
    } catch (error) {
      console.error('Error requesting calendar permission:', error);
      return false;
    }
  },

  loadDeviceCalendars: async () => {
    const { hasCalendarPermission } = get();
    if (!hasCalendarPermission) {
      const granted = await get().requestCalendarPermission();
      if (!granted) return;
    }

    set({ isLoading: true });
    try {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const deviceCalendars: DeviceCalendar[] = calendars.map((cal) => ({
        id: cal.id,
        title: cal.title,
        color: cal.color || '#3b82f6',
        source: cal.source?.name || 'Unknown',
        allowsModifications: cal.allowsModifications,
        isSelected: false,
      }));
      set({ deviceCalendars, isLoading: false });
    } catch (error) {
      console.error('Error loading calendars:', error);
      set({ isLoading: false });
    }
  },

  toggleDeviceCalendar: (calendarId) => {
    set((state) => ({
      deviceCalendars: state.deviceCalendars.map((cal) =>
        cal.id === calendarId ? { ...cal, isSelected: !cal.isSelected } : cal
      ),
    }));
  },

  syncToDeviceCalendar: async (eventId) => {
    const { events, hasCalendarPermission, deviceCalendars } = get();
    if (!hasCalendarPermission) return;

    const event = events.find((e) => e.id === eventId);
    if (!event) return;

    try {
      // Find a writable calendar
      const writableCalendar = deviceCalendars.find((cal) => cal.allowsModifications);
      if (!writableCalendar) {
        // Create a new calendar for CentaurOS
        const defaultCalendarSource =
          Platform.OS === 'ios'
            ? await Calendar.getDefaultCalendarAsync()
            : { isLocalAccount: true, name: 'CentaurOS' };

        const newCalendarId = await Calendar.createCalendarAsync({
          title: 'CentaurOS',
          color: '#8b5cf6',
          entityType: Calendar.EntityTypes.EVENT,
          sourceId: (defaultCalendarSource as any)?.source?.id,
          source: {
            isLocalAccount: true,
            name: 'CentaurOS',
            type: Platform.OS === 'ios' ? Calendar.SourceType.LOCAL : undefined,
          } as any,
          name: 'CentaurOS',
          ownerAccount: 'CentaurOS',
          accessLevel: Calendar.CalendarAccessLevel.OWNER,
        });

        // Create the event
        const deviceEventId = await Calendar.createEventAsync(newCalendarId, {
          title: event.title,
          notes: event.description,
          startDate: new Date(event.startDate),
          endDate: new Date(event.endDate),
          allDay: event.allDay,
          location: event.location,
        });

        get().updateEvent(eventId, { deviceCalendarId: deviceEventId });
      } else {
        const deviceEventId = await Calendar.createEventAsync(writableCalendar.id, {
          title: event.title,
          notes: event.description,
          startDate: new Date(event.startDate),
          endDate: new Date(event.endDate),
          allDay: event.allDay,
          location: event.location,
        });

        get().updateEvent(eventId, { deviceCalendarId: deviceEventId });
      }
    } catch (error) {
      console.error('Error syncing to device calendar:', error);
    }
  },

  importFromDeviceCalendar: async (calendarId, startDate, endDate) => {
    const { hasCalendarPermission } = get();
    if (!hasCalendarPermission) return;

    try {
      const deviceEvents = await Calendar.getEventsAsync(
        [calendarId],
        startDate,
        endDate
      );

      const importedEvents: CalendarEvent[] = deviceEvents.map((devEvent) => ({
        id: `imported-${devEvent.id}`,
        title: devEvent.title || 'Untitled Event',
        description: devEvent.notes || undefined,
        startDate: new Date(devEvent.startDate),
        endDate: new Date(devEvent.endDate),
        allDay: devEvent.allDay || false,
        type: 'personal' as CalendarEventType,
        color: EVENT_COLORS.personal,
        location: devEvent.location || undefined,
        deviceCalendarId: devEvent.id,
        reminders: [],
        recurrence: 'none',
        createdBy: 'imported',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      set((state) => ({
        events: [
          ...state.events,
          ...importedEvents.filter(
            (imp) => !state.events.some((e) => e.deviceCalendarId === imp.deviceCalendarId)
          ),
        ],
      }));
    } catch (error) {
      console.error('Error importing from device calendar:', error);
    }
  },

  getEventColor: (type) => EVENT_COLORS[type],
}));
