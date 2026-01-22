import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '@/lib/storage/mmkv-storage';

export type NotificationType = 'approval' | 'deadline' | 'capacity' | 'budget' | 'assignment' | 'message' | 'achievement';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  actionLabel?: string;
  actionRoute?: string;
  actionData?: any;
  timestamp: string;
  read: boolean;
  workspaceId: string;
}

interface NotificationStore {
  notifications: Notification[];
  preferences: {
    approvals: boolean;
    deadlines: boolean;
    capacity: boolean;
    budget: boolean;
    assignments: boolean;
    messages: boolean;
    achievements: boolean;
    emailPromptAfterAssignment: boolean; // Prompt to send email after assigning tasks
  };
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'timestamp'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: (workspaceId: string) => void;
  deleteNotification: (id: string) => void;
  clearAll: (workspaceId: string) => void;
  getUnreadCount: (workspaceId: string) => number;
  getNotificationsByWorkspace: (workspaceId: string) => Notification[];
  updatePreferences: (preferences: Partial<NotificationStore['preferences']>) => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      preferences: {
        approvals: true,
        deadlines: true,
        capacity: true,
        budget: true,
        assignments: true,
        messages: true,
        achievements: true,
        emailPromptAfterAssignment: true, // Default to prompting for email
      },

      addNotification: (notification: Omit<Notification, 'id' | 'read' | 'timestamp'>) => {
        // Check if this type is enabled
        const typeKey = notification.type === 'approval' ? 'approvals' :
                       notification.type === 'deadline' ? 'deadlines' :
                       notification.type === 'capacity' ? 'capacity' :
                       notification.type === 'budget' ? 'budget' :
                       notification.type === 'assignment' ? 'assignments' :
                       notification.type === 'message' ? 'messages' : 'achievements';

        if (!get().preferences[typeKey]) return;

        const newNotification: Notification = {
          ...notification,
          id: `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          timestamp: new Date().toISOString(),
          read: false,
        };

        set((state: NotificationStore) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 100), // Keep last 100
        }));
      },

      markAsRead: (id: string) => {
        set((state: NotificationStore) => ({
          notifications: state.notifications.map((n: Notification) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },

      markAllAsRead: (workspaceId: string) => {
        set((state: NotificationStore) => ({
          notifications: state.notifications.map((n: Notification) =>
            n.workspaceId === workspaceId ? { ...n, read: true } : n
          ),
        }));
      },

      deleteNotification: (id: string) => {
        set((state: NotificationStore) => ({
          notifications: state.notifications.filter((n: Notification) => n.id !== id),
        }));
      },

      clearAll: (workspaceId: string) => {
        set((state: NotificationStore) => ({
          notifications: state.notifications.filter((n: Notification) => n.workspaceId !== workspaceId),
        }));
      },

      getUnreadCount: (workspaceId: string) => {
        return get().notifications.filter((n: Notification) => n.workspaceId === workspaceId && !n.read).length;
      },

      getNotificationsByWorkspace: (workspaceId: string) => {
        return get().notifications.filter((n: Notification) => n.workspaceId === workspaceId);
      },

      updatePreferences: (preferences: Partial<NotificationStore['preferences']>) => {
        set((state: NotificationStore) => ({
          preferences: { ...state.preferences, ...preferences },
        }));
      },
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

// Helper functions to create common notifications
export const notificationHelpers = {
  approvalRequest: (workspaceId: string, requesterName: string, itemType: string) => ({
    type: 'approval' as NotificationType,
    workspaceId,
    title: 'Approval Request',
    message: `${requesterName} requested approval for ${itemType}`,
    actionLabel: 'Review',
    actionRoute: '/approvals',
  }),

  deadlineApproaching: (workspaceId: string, taskTitle: string, hoursLeft: number) => ({
    type: 'deadline' as NotificationType,
    workspaceId,
    title: 'Deadline Approaching',
    message: `"${taskTitle}" is due in ${hoursLeft} hours`,
    actionLabel: 'View Task',
  }),

  capacityWarning: (workspaceId: string, memberName: string, utilizationPercent: number) => ({
    type: 'capacity' as NotificationType,
    workspaceId,
    title: 'Capacity Alert',
    message: `${memberName} is at ${utilizationPercent}% capacity (overtime)`,
    actionLabel: 'View Team',
    actionRoute: '/who',
  }),

  budgetAlert: (workspaceId: string, runwayWeeks: number) => ({
    type: 'budget' as NotificationType,
    workspaceId,
    title: 'Budget Alert',
    message: `Runway is down to ${runwayWeeks} weeks at current burn rate`,
    actionLabel: 'View Finances',
    actionRoute: '/performance',
  }),

  newAssignment: (workspaceId: string, taskTitle: string) => ({
    type: 'assignment' as NotificationType,
    workspaceId,
    title: 'New Assignment',
    message: `You've been assigned to "${taskTitle}"`,
    actionLabel: 'View Task',
  }),

  achievementUnlocked: (workspaceId: string, achievementName: string) => ({
    type: 'achievement' as NotificationType,
    workspaceId,
    title: 'Achievement Unlocked!',
    message: `You earned "${achievementName}"`,
    actionLabel: 'View All',
  }),
};
