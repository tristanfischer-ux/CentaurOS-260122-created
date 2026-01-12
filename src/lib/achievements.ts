import AsyncStorage from '@react-native-async-storage/async-storage';
import { addActivity } from './engagement-tracking';

const ACHIEVEMENTS_KEY = '@user_achievements';
const STATS_KEY = '@user_stats';
const GOALS_KEY = '@user_goals';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  category: 'tasks' | 'streak' | 'speed' | 'quality' | 'team' | 'milestone';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary';
  unlockedAt?: string;
  progress?: number;
  target?: number;
}

export interface UserStats {
  totalTasksCompleted: number;
  tasksCompletedToday: number;
  tasksCompletedThisWeek: number;
  tasksCompletedThisMonth: number;
  urgentTasksCompleted: number;
  highPriorityTasksCompleted: number;
  reviewsApproved: number;
  perfectDays: number; // Days where all tasks were completed
  fastCompletions: number; // Tasks completed in under 1 hour
  weekendWarrior: number; // Weekend completions
  earlyBird: number; // Completions before 9 AM
  nightOwl: number; // Completions after 10 PM
  lastUpdated: string;
}

export interface GoalTracking {
  dailyGoal: number;
  weeklyGoal: number;
  monthlyGoal: number;
  currentDailyProgress: number;
  currentWeeklyProgress: number;
  currentMonthlyProgress: number;
  lastResetDate: string;
}

const DEFAULT_STATS: UserStats = {
  totalTasksCompleted: 0,
  tasksCompletedToday: 0,
  tasksCompletedThisWeek: 0,
  tasksCompletedThisMonth: 0,
  urgentTasksCompleted: 0,
  highPriorityTasksCompleted: 0,
  reviewsApproved: 0,
  perfectDays: 0,
  fastCompletions: 0,
  weekendWarrior: 0,
  earlyBird: 0,
  nightOwl: 0,
  lastUpdated: new Date().toISOString(),
};

const DEFAULT_GOALS: GoalTracking = {
  dailyGoal: 5,
  weeklyGoal: 25,
  monthlyGoal: 100,
  currentDailyProgress: 0,
  currentWeeklyProgress: 0,
  currentMonthlyProgress: 0,
  lastResetDate: new Date().toISOString(),
};

// All possible achievements
const ALL_ACHIEVEMENTS: Achievement[] = [
  // Task Completion Milestones
  { id: 'first_task', title: 'Getting Started', description: 'Complete your first task', emoji: '🎯', category: 'tasks', tier: 'bronze' },
  { id: 'tasks_10', title: 'Momentum Builder', description: 'Complete 10 tasks', emoji: '🚀', category: 'tasks', tier: 'bronze', target: 10 },
  { id: 'tasks_50', title: 'Productive Pro', description: 'Complete 50 tasks', emoji: '⚡', category: 'tasks', tier: 'silver', target: 50 },
  { id: 'tasks_100', title: 'Century Club', description: 'Complete 100 tasks', emoji: '💯', category: 'tasks', tier: 'gold', target: 100 },
  { id: 'tasks_500', title: 'Execution Machine', description: 'Complete 500 tasks', emoji: '🔥', category: 'tasks', tier: 'platinum', target: 500 },
  { id: 'tasks_1000', title: 'Legendary Achiever', description: 'Complete 1,000 tasks', emoji: '👑', category: 'tasks', tier: 'legendary', target: 1000 },

  // Streak Achievements
  { id: 'streak_3', title: 'Three Days Strong', description: 'Maintain a 3-day streak', emoji: '🔥', category: 'streak', tier: 'bronze', target: 3 },
  { id: 'streak_7', title: 'Week Warrior', description: 'Maintain a 7-day streak', emoji: '📅', category: 'streak', tier: 'silver', target: 7 },
  { id: 'streak_30', title: 'Monthly Master', description: 'Maintain a 30-day streak', emoji: '🌟', category: 'streak', tier: 'gold', target: 30 },
  { id: 'streak_100', title: 'Unstoppable Force', description: 'Maintain a 100-day streak', emoji: '⚡', category: 'streak', tier: 'platinum', target: 100 },
  { id: 'streak_365', title: 'Year of Excellence', description: 'Maintain a 365-day streak', emoji: '🏆', category: 'streak', tier: 'legendary', target: 365 },

  // Speed Achievements
  { id: 'fast_10', title: 'Speed Demon', description: 'Complete 10 tasks in under an hour', emoji: '⚡', category: 'speed', tier: 'silver', target: 10 },
  { id: 'early_bird', title: 'Early Bird', description: 'Complete 5 tasks before 9 AM', emoji: '🌅', category: 'speed', tier: 'bronze', target: 5 },
  { id: 'night_owl', title: 'Night Owl', description: 'Complete 5 tasks after 10 PM', emoji: '🦉', category: 'speed', tier: 'bronze', target: 5 },
  { id: 'weekend_warrior', title: 'Weekend Warrior', description: 'Complete 10 tasks on weekends', emoji: '💪', category: 'speed', tier: 'silver', target: 10 },

  // Quality Achievements
  { id: 'urgent_master', title: 'Urgent Response Master', description: 'Complete 25 urgent tasks', emoji: '🚨', category: 'quality', tier: 'gold', target: 25 },
  { id: 'high_priority_pro', title: 'High Priority Pro', description: 'Complete 50 high-priority tasks', emoji: '⭐', category: 'quality', tier: 'silver', target: 50 },
  { id: 'perfect_day', title: 'Perfect Day', description: 'Complete all daily tasks in a single day', emoji: '💎', category: 'quality', tier: 'gold' },
  { id: 'perfect_week', title: 'Perfect Week', description: 'Achieve 5 perfect days', emoji: '🌟', category: 'quality', tier: 'platinum', target: 5 },

  // Team Achievements
  { id: 'team_player', title: 'Team Player', description: 'Get 10 reviews approved', emoji: '🤝', category: 'team', tier: 'bronze', target: 10 },
  { id: 'collaboration_king', title: 'Collaboration King', description: 'Get 50 reviews approved', emoji: '👑', category: 'team', tier: 'gold', target: 50 },

  // Daily Goal Achievements
  { id: 'daily_goal_10', title: 'Goal Getter', description: 'Hit your daily goal 10 times', emoji: '🎯', category: 'milestone', tier: 'silver', target: 10 },
  { id: 'weekly_goal_5', title: 'Weekly Winner', description: 'Hit your weekly goal 5 times', emoji: '📊', category: 'milestone', tier: 'gold', target: 5 },
  { id: 'overachiever', title: 'Overachiever', description: 'Exceed your weekly goal by 50%', emoji: '🚀', category: 'milestone', tier: 'platinum' },
];

/**
 * Get user statistics
 */
export async function getUserStats(): Promise<UserStats> {
  try {
    const statsJson = await AsyncStorage.getItem(STATS_KEY);
    if (!statsJson) {
      await AsyncStorage.setItem(STATS_KEY, JSON.stringify(DEFAULT_STATS));
      return DEFAULT_STATS;
    }

    const stats: UserStats = JSON.parse(statsJson);

    // Reset daily/weekly/monthly counters if needed
    const lastUpdate = new Date(stats.lastUpdated);
    const now = new Date();

    const needsDailyReset = lastUpdate.toDateString() !== now.toDateString();
    const needsWeeklyReset = getWeekNumber(lastUpdate) !== getWeekNumber(now);
    const needsMonthlyReset = lastUpdate.getMonth() !== now.getMonth() || lastUpdate.getFullYear() !== now.getFullYear();

    if (needsDailyReset || needsWeeklyReset || needsMonthlyReset) {
      const updatedStats = {
        ...stats,
        tasksCompletedToday: needsDailyReset ? 0 : stats.tasksCompletedToday,
        tasksCompletedThisWeek: needsWeeklyReset ? 0 : stats.tasksCompletedThisWeek,
        tasksCompletedThisMonth: needsMonthlyReset ? 0 : stats.tasksCompletedThisMonth,
        lastUpdated: now.toISOString(),
      };
      await AsyncStorage.setItem(STATS_KEY, JSON.stringify(updatedStats));
      return updatedStats;
    }

    return stats;
  } catch (error) {
    console.error('Error getting user stats:', error);
    return DEFAULT_STATS;
  }
}

/**
 * Get goal tracking data
 */
export async function getGoalTracking(): Promise<GoalTracking> {
  try {
    const goalsJson = await AsyncStorage.getItem(GOALS_KEY);
    if (!goalsJson) {
      await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(DEFAULT_GOALS));
      return DEFAULT_GOALS;
    }
    return JSON.parse(goalsJson);
  } catch (error) {
    console.error('Error getting goal tracking:', error);
    return DEFAULT_GOALS;
  }
}

/**
 * Update goal tracking
 */
export async function updateGoals(updates: Partial<GoalTracking>): Promise<void> {
  try {
    const current = await getGoalTracking();
    const updated = { ...current, ...updates };
    await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error updating goals:', error);
  }
}

/**
 * Record a task completion and update stats
 */
export async function recordTaskCompletion(
  priority: 'urgent' | 'high' | 'medium' | 'low',
  userId: string,
  userName: string
): Promise<{ newAchievements: Achievement[]; stats: UserStats; leveledUp: boolean }> {
  try {
    const stats = await getUserStats();
    const hour = new Date().getHours();
    const day = new Date().getDay();

    // Update stats
    const updatedStats: UserStats = {
      ...stats,
      totalTasksCompleted: stats.totalTasksCompleted + 1,
      tasksCompletedToday: stats.tasksCompletedToday + 1,
      tasksCompletedThisWeek: stats.tasksCompletedThisWeek + 1,
      tasksCompletedThisMonth: stats.tasksCompletedThisMonth + 1,
      urgentTasksCompleted: priority === 'urgent' ? stats.urgentTasksCompleted + 1 : stats.urgentTasksCompleted,
      highPriorityTasksCompleted: priority === 'high' ? stats.highPriorityTasksCompleted + 1 : stats.highPriorityTasksCompleted,
      earlyBird: hour < 9 ? stats.earlyBird + 1 : stats.earlyBird,
      nightOwl: hour >= 22 ? stats.nightOwl + 1 : stats.nightOwl,
      weekendWarrior: (day === 0 || day === 6) ? stats.weekendWarrior + 1 : stats.weekendWarrior,
      lastUpdated: new Date().toISOString(),
    };

    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(updatedStats));

    // Check for new achievements
    const newAchievements = await checkAchievements(updatedStats, userId, userName);

    // Check if leveled up (every 10 tasks)
    const leveledUp = updatedStats.totalTasksCompleted % 10 === 0;

    return { newAchievements, stats: updatedStats, leveledUp };
  } catch (error) {
    console.error('Error recording task completion:', error);
    return { newAchievements: [], stats: DEFAULT_STATS, leveledUp: false };
  }
}

/**
 * Check for newly unlocked achievements
 */
async function checkAchievements(stats: UserStats, userId: string, userName: string): Promise<Achievement[]> {
  try {
    const achievementsJson = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
    const unlockedAchievements: Achievement[] = achievementsJson ? JSON.parse(achievementsJson) : [];
    const newlyUnlocked: Achievement[] = [];

    for (const achievement of ALL_ACHIEVEMENTS) {
      // Skip if already unlocked
      if (unlockedAchievements.find(a => a.id === achievement.id)) continue;

      let shouldUnlock = false;

      // Check achievement conditions
      switch (achievement.id) {
        case 'first_task':
          shouldUnlock = stats.totalTasksCompleted >= 1;
          break;
        case 'tasks_10':
          shouldUnlock = stats.totalTasksCompleted >= 10;
          break;
        case 'tasks_50':
          shouldUnlock = stats.totalTasksCompleted >= 50;
          break;
        case 'tasks_100':
          shouldUnlock = stats.totalTasksCompleted >= 100;
          break;
        case 'tasks_500':
          shouldUnlock = stats.totalTasksCompleted >= 500;
          break;
        case 'tasks_1000':
          shouldUnlock = stats.totalTasksCompleted >= 1000;
          break;
        case 'urgent_master':
          shouldUnlock = stats.urgentTasksCompleted >= 25;
          break;
        case 'high_priority_pro':
          shouldUnlock = stats.highPriorityTasksCompleted >= 50;
          break;
        case 'fast_10':
          shouldUnlock = stats.fastCompletions >= 10;
          break;
        case 'early_bird':
          shouldUnlock = stats.earlyBird >= 5;
          break;
        case 'night_owl':
          shouldUnlock = stats.nightOwl >= 5;
          break;
        case 'weekend_warrior':
          shouldUnlock = stats.weekendWarrior >= 10;
          break;
        case 'team_player':
          shouldUnlock = stats.reviewsApproved >= 10;
          break;
        case 'collaboration_king':
          shouldUnlock = stats.reviewsApproved >= 50;
          break;
        case 'perfect_week':
          shouldUnlock = stats.perfectDays >= 5;
          break;
      }

      if (shouldUnlock) {
        const unlockedAchievement: Achievement = {
          ...achievement,
          unlockedAt: new Date().toISOString(),
        };
        newlyUnlocked.push(unlockedAchievement);
        unlockedAchievements.push(unlockedAchievement);

        // Add to activity feed
        await addActivity({
          type: 'milestone_achieved',
          title: `🏆 Achievement Unlocked: ${achievement.title}`,
          description: achievement.description,
          userId,
          userName,
        });
      }
    }

    if (newlyUnlocked.length > 0) {
      await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlockedAchievements));
    }

    return newlyUnlocked;
  } catch (error) {
    console.error('Error checking achievements:', error);
    return [];
  }
}

/**
 * Get all unlocked achievements
 */
export async function getUnlockedAchievements(): Promise<Achievement[]> {
  try {
    const achievementsJson = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
    return achievementsJson ? JSON.parse(achievementsJson) : [];
  } catch (error) {
    console.error('Error getting unlocked achievements:', error);
    return [];
  }
}

/**
 * Get progress towards achievements
 */
export async function getAchievementProgress(): Promise<Achievement[]> {
  try {
    const stats = await getUserStats();
    const unlocked = await getUnlockedAchievements();

    return ALL_ACHIEVEMENTS.map(achievement => {
      const isUnlocked = unlocked.find(a => a.id === achievement.id);
      if (isUnlocked) {
        return { ...achievement, progress: achievement.target, unlockedAt: isUnlocked.unlockedAt };
      }

      // Calculate progress
      let progress = 0;
      switch (achievement.id) {
        case 'tasks_10':
        case 'tasks_50':
        case 'tasks_100':
        case 'tasks_500':
        case 'tasks_1000':
          progress = stats.totalTasksCompleted;
          break;
        case 'urgent_master':
          progress = stats.urgentTasksCompleted;
          break;
        case 'high_priority_pro':
          progress = stats.highPriorityTasksCompleted;
          break;
        case 'fast_10':
          progress = stats.fastCompletions;
          break;
        case 'early_bird':
          progress = stats.earlyBird;
          break;
        case 'night_owl':
          progress = stats.nightOwl;
          break;
        case 'weekend_warrior':
          progress = stats.weekendWarrior;
          break;
        case 'team_player':
        case 'collaboration_king':
          progress = stats.reviewsApproved;
          break;
        case 'perfect_week':
          progress = stats.perfectDays;
          break;
      }

      return { ...achievement, progress };
    });
  } catch (error) {
    console.error('Error getting achievement progress:', error);
    return ALL_ACHIEVEMENTS;
  }
}

/**
 * Helper function to get week number
 */
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

/**
 * Calculate current level based on total tasks
 */
export function calculateLevel(totalTasks: number): { level: number; tasksToNextLevel: number; progress: number } {
  const level = Math.floor(totalTasks / 10) + 1;
  const tasksInCurrentLevel = totalTasks % 10;
  const tasksToNextLevel = 10 - tasksInCurrentLevel;
  const progress = (tasksInCurrentLevel / 10) * 100;

  return { level, tasksToNextLevel, progress };
}
