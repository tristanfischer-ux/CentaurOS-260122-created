import AsyncStorage from '@react-native-async-storage/async-storage';

const STREAK_KEY = '@engagement_streak';
const LAST_ACTIVE_KEY = '@last_active_date';
const DAILY_COMPLETIONS_KEY = '@daily_completions';
const ACTIVITY_FEED_KEY = '@activity_feed';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  todayCompletions: number;
  totalCompletions: number;
}

export interface ActivityItem {
  id: string;
  type: 'task_completed' | 'task_assigned' | 'review_approved' | 'review_requested' | 'okr_updated' | 'milestone_achieved';
  title: string;
  description: string;
  timestamp: string;
  userId: string;
  userName: string;
  icon?: string;
  priority?: 'urgent' | 'high' | 'medium' | 'low';
}

/**
 * Get current streak data
 */
export async function getStreakData(): Promise<StreakData> {
  try {
    const streakJson = await AsyncStorage.getItem(STREAK_KEY);
    const lastActiveJson = await AsyncStorage.getItem(LAST_ACTIVE_KEY);
    const completionsJson = await AsyncStorage.getItem(DAILY_COMPLETIONS_KEY);

    const today = new Date().toISOString().split('T')[0];

    if (!streakJson || !lastActiveJson) {
      // Initialize new streak
      const initialData: StreakData = {
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: today,
        todayCompletions: 0,
        totalCompletions: 0,
      };
      await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(initialData));
      await AsyncStorage.setItem(LAST_ACTIVE_KEY, today);
      return initialData;
    }

    const streakData: StreakData = JSON.parse(streakJson);
    const lastActive = lastActiveJson;

    // Check if we need to update streak
    const lastActiveDate = new Date(lastActive);
    const todayDate = new Date(today);
    const daysDiff = Math.floor((todayDate.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
      // Same day - return current data
      return streakData;
    } else if (daysDiff === 1) {
      // Consecutive day - maintain streak but reset today's completions
      return {
        ...streakData,
        lastActiveDate: today,
        todayCompletions: 0,
      };
    } else {
      // Streak broken - reset
      const resetData: StreakData = {
        currentStreak: 0,
        longestStreak: streakData.longestStreak,
        lastActiveDate: today,
        todayCompletions: 0,
        totalCompletions: streakData.totalCompletions,
      };
      await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(resetData));
      await AsyncStorage.setItem(LAST_ACTIVE_KEY, today);
      return resetData;
    }
  } catch (error) {
    console.error('Error getting streak data:', error);
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: new Date().toISOString().split('T')[0],
      todayCompletions: 0,
      totalCompletions: 0,
    };
  }
}

/**
 * Record a completion (task completed, review submitted, etc.)
 */
export async function recordCompletion(): Promise<StreakData> {
  try {
    const currentData = await getStreakData();
    const today = new Date().toISOString().split('T')[0];

    // Increment completions
    const newTodayCompletions = currentData.todayCompletions + 1;
    const newTotalCompletions = currentData.totalCompletions + 1;

    // If first completion of the day, increment streak
    let newCurrentStreak = currentData.currentStreak;
    if (currentData.todayCompletions === 0) {
      newCurrentStreak = currentData.currentStreak + 1;
    }

    const newLongestStreak = Math.max(newCurrentStreak, currentData.longestStreak);

    const updatedData: StreakData = {
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastActiveDate: today,
      todayCompletions: newTodayCompletions,
      totalCompletions: newTotalCompletions,
    };

    await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(updatedData));
    await AsyncStorage.setItem(LAST_ACTIVE_KEY, today);

    return updatedData;
  } catch (error) {
    console.error('Error recording completion:', error);
    return await getStreakData();
  }
}

/**
 * Get recent activity feed
 */
export async function getActivityFeed(limit: number = 10): Promise<ActivityItem[]> {
  try {
    const feedJson = await AsyncStorage.getItem(ACTIVITY_FEED_KEY);
    if (!feedJson) return [];

    const feed: ActivityItem[] = JSON.parse(feedJson);

    // Filter to only today and yesterday
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return feed
      .filter(item => {
        const itemDate = new Date(item.timestamp);
        return itemDate >= yesterday;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting activity feed:', error);
    return [];
  }
}

/**
 * Add activity to feed
 */
export async function addActivity(activity: Omit<ActivityItem, 'id' | 'timestamp'>): Promise<void> {
  try {
    const feedJson = await AsyncStorage.getItem(ACTIVITY_FEED_KEY);
    const feed: ActivityItem[] = feedJson ? JSON.parse(feedJson) : [];

    const newActivity: ActivityItem = {
      ...activity,
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    // Add to beginning of feed
    feed.unshift(newActivity);

    // Keep only last 50 items to avoid storage bloat
    const trimmedFeed = feed.slice(0, 50);

    await AsyncStorage.setItem(ACTIVITY_FEED_KEY, JSON.stringify(trimmedFeed));
  } catch (error) {
    console.error('Error adding activity:', error);
  }
}

/**
 * Clear old activity (older than 7 days)
 */
export async function clearOldActivity(): Promise<void> {
  try {
    const feedJson = await AsyncStorage.getItem(ACTIVITY_FEED_KEY);
    if (!feedJson) return;

    const feed: ActivityItem[] = JSON.parse(feedJson);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const recentFeed = feed.filter(item => {
      const itemDate = new Date(item.timestamp);
      return itemDate >= sevenDaysAgo;
    });

    await AsyncStorage.setItem(ACTIVITY_FEED_KEY, JSON.stringify(recentFeed));
  } catch (error) {
    console.error('Error clearing old activity:', error);
  }
}
