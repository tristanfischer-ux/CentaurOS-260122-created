import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_TOKEN_KEY = '@push_notification_token';
const NOTIFICATION_SETTINGS_KEY = '@notification_settings';

export interface NotificationSettings {
  enabled: boolean;
  taskAssignments: boolean;
  taskCompletions: boolean;
  reviewRequests: boolean;
  reviewApprovals: boolean;
  okrUpdates: boolean;
  milestones: boolean;
  dailyReminders: boolean;
  weeklyDigest: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  taskAssignments: true,
  taskCompletions: true,
  reviewRequests: true,
  reviewApprovals: true,
  okrUpdates: true,
  milestones: true,
  dailyReminders: true,
  weeklyDigest: true,
};

// Configure how notifications should be displayed
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions and register for push notifications
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied');
      return null;
    }

    // Get push token
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: 'your-expo-project-id', // Replace with your Expo project ID
    });

    // Store token
    await AsyncStorage.setItem(NOTIFICATION_TOKEN_KEY, token.data);

    // Configure channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3b82f6',
      });
    }

    return token.data;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Get notification settings
 */
export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const settingsJson = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (!settingsJson) {
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    return JSON.parse(settingsJson);
  } catch (error) {
    console.error('Error getting notification settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Update notification settings
 */
export async function updateNotificationSettings(
  settings: Partial<NotificationSettings>
): Promise<void> {
  try {
    const currentSettings = await getNotificationSettings();
    const newSettings = { ...currentSettings, ...settings };
    await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(newSettings));
  } catch (error) {
    console.error('Error updating notification settings:', error);
  }
}

/**
 * Schedule a local notification
 */
export async function scheduleNotification(
  title: string,
  body: string,
  data?: any,
  trigger?: Notifications.NotificationTriggerInput
): Promise<string> {
  const settings = await getNotificationSettings();
  if (!settings.enabled) {
    return '';
  }

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: trigger || null, // null = immediate
    });

    return id;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return '';
  }
}

/**
 * Send task assignment notification
 */
export async function notifyTaskAssigned(
  taskTitle: string,
  assignedBy: string,
  priority: string
): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings.taskAssignments) return;

  const priorityEmoji = priority === 'urgent' ? '🚨' : priority === 'high' ? '⚡' : '📋';

  await scheduleNotification(
    `${priorityEmoji} New Task Assigned`,
    `${assignedBy} assigned you: ${taskTitle}`,
    { type: 'task_assigned', taskTitle }
  );
}

/**
 * Send task completion notification
 */
export async function notifyTaskCompleted(
  taskTitle: string,
  completedBy: string
): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings.taskCompletions) return;

  await scheduleNotification(
    '✅ Task Completed',
    `${completedBy} completed: ${taskTitle}`,
    { type: 'task_completed', taskTitle }
  );
}

/**
 * Send review request notification
 */
export async function notifyReviewRequested(
  taskTitle: string,
  requestedBy: string
): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings.reviewRequests) return;

  await scheduleNotification(
    '👀 Review Requested',
    `${requestedBy} needs your review: ${taskTitle}`,
    { type: 'review_requested', taskTitle }
  );
}

/**
 * Send review approval notification
 */
export async function notifyReviewApproved(
  taskTitle: string,
  approvedBy: string
): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings.reviewApprovals) return;

  await scheduleNotification(
    '🎉 Review Approved',
    `${approvedBy} approved: ${taskTitle}`,
    { type: 'review_approved', taskTitle }
  );
}

/**
 * Send OKR update notification
 */
export async function notifyOKRUpdated(
  objectiveTitle: string,
  updatedBy: string,
  progress: number
): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings.okrUpdates) return;

  await scheduleNotification(
    '🎯 OKR Updated',
    `${updatedBy} updated ${objectiveTitle} to ${progress}%`,
    { type: 'okr_updated', objectiveTitle, progress }
  );
}

/**
 * Send milestone achievement notification
 */
export async function notifyMilestoneAchieved(
  milestoneName: string,
  teamSize: number
): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings.milestones) return;

  await scheduleNotification(
    '🏆 Milestone Achieved!',
    `Your team of ${teamSize} reached: ${milestoneName}`,
    { type: 'milestone_achieved', milestoneName }
  );
}

/**
 * Schedule daily reminder
 */
export async function scheduleDailyReminder(): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings.dailyReminders) return;

  // Cancel existing daily reminders
  const existingNotifications = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of existingNotifications) {
    if (notification.content.data?.type === 'daily_reminder') {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }

  // Schedule new daily reminder for 9 AM
  await scheduleNotification(
    '🌅 Good Morning!',
    "Ready to crush today's goals? Check your priority tasks.",
    { type: 'daily_reminder' },
    {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: 9,
      minute: 0,
      repeats: true,
    }
  );
}

/**
 * Schedule weekly digest
 */
export async function scheduleWeeklyDigest(): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings.weeklyDigest) return;

  // Cancel existing weekly digests
  const existingNotifications = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of existingNotifications) {
    if (notification.content.data?.type === 'weekly_digest') {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }

  // Schedule weekly digest for Monday 9 AM
  await scheduleNotification(
    '📊 Weekly Digest',
    "Your team's progress from last week is ready!",
    { type: 'weekly_digest' },
    {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      weekday: 2, // Monday
      hour: 9,
      minute: 0,
      repeats: true,
    }
  );
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get badge count
 */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

/**
 * Set badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear all badges
 */
export async function clearBadges(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}
