// Onboarding system for Centaur OS
// Role-specific walkthroughs for Founders, Executives, and Apprentices

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Role } from '@/types';

const ONBOARDING_KEY = 'onboarding_completed';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  illustration?: string; // Can be an icon name or image URL
  route?: string; // Which tab to highlight
  action?: string; // Optional CTA text
}

export interface OnboardingFlow {
  role: Role;
  steps: OnboardingStep[];
}

// ============================================================================
// FOUNDER ONBOARDING
// ============================================================================

export const FOUNDER_ONBOARDING: OnboardingFlow = {
  role: 'Founder',
  steps: [
    {
      id: 'welcome',
      title: 'Welcome to Centaur OS',
      description: "You're the Founder! You have complete visibility and control across your entire lean startup. Let's show you how to run your business like a pro.",
      illustration: 'rocket',
    },
    {
      id: 'dashboard',
      title: 'Your Command Center',
      description: 'The Home tab is your daily dashboard. See team activity, track streaks, and jump to priority tasks. Check in here every morning to stay on top of everything.',
      route: '/(tabs)',
      illustration: 'home',
    },
    {
      id: 'okrs',
      title: 'Set Strategic Goals (OKRs)',
      description: 'Create Objectives and Key Results to align your team. Use the AI Task Advisor to break objectives into actionable tasks. Track progress with real-time health indicators.',
      route: '/(tabs)/okrs',
      illustration: 'target',
      action: 'Create Your First OKR',
    },
    {
      id: 'work',
      title: 'Manage All Work',
      description: 'The Work tab shows every task across your company. Filter by status, priority, or function. Assign tasks to Apprentices and track completion rates.',
      route: '/(tabs)/work',
      illustration: 'clipboard',
    },
    {
      id: 'team',
      title: 'Build & Monitor Your Team',
      description: 'View team performance, track utilization, and identify top performers. See who needs support and who\'s ready for more responsibility.',
      route: '/(tabs)/team',
      illustration: 'users',
    },
    {
      id: 'reviews',
      title: 'Quality Control Workflow',
      description: 'Apprentices submit work for review. Executives approve or request changes. You can oversee the entire review pipeline and step in when needed.',
      route: '/(tabs)/reviews',
      illustration: 'check-circle',
    },
    {
      id: 'network',
      title: 'Discover Talent & Suppliers',
      description: 'Swipe through potential hires (Tinder-style!) and browse suppliers. Build your network for when you need to scale.',
      route: '/(tabs)/network',
      illustration: 'briefcase',
    },
    {
      id: 'organization',
      title: 'Your Org Structure',
      description: 'See your complete organizational chart. Track team growth, manage roles, and understand reporting lines.',
      route: '/(tabs)/organization',
      illustration: 'sitemap',
    },
    {
      id: 'events',
      title: 'Community & Learning',
      description: 'Join startup events, workshops, and networking sessions. Connect with other founders and learn from experts.',
      route: '/(tabs)/events',
      illustration: 'calendar',
    },
    {
      id: 'settings',
      title: 'Settings & Reports',
      description: 'Access financial dashboard (founder-only!), export data, manage notifications, and generate board-ready reports.',
      route: '/(tabs)/settings',
      illustration: 'settings',
      action: 'View Financial Dashboard',
    },
    {
      id: 'complete',
      title: 'You\'re Ready to Lead!',
      description: 'Start by creating your first OKR, then break it into tasks. Assign work to your team and track progress daily. Your startup\'s operating system is ready.',
      illustration: 'trophy',
      action: 'Start Building',
    },
  ],
};

// ============================================================================
// FRACTIONAL EXECUTIVE ONBOARDING
// ============================================================================

export const EXECUTIVE_ONBOARDING: OnboardingFlow = {
  role: 'FractionalExec',
  steps: [
    {
      id: 'welcome',
      title: 'Welcome, Executive!',
      description: "You're a Fractional Executive - the expert who structures work and reviews output. Let's show you how to lead your function effectively.",
      illustration: 'award',
    },
    {
      id: 'dashboard',
      title: 'Your Daily Overview',
      description: 'The Home tab shows your team\'s activity and pending reviews. Start each day here to see what needs your attention.',
      route: '/(tabs)',
      illustration: 'home',
    },
    {
      id: 'okrs',
      title: 'Track Strategic Progress',
      description: 'You can view all OKRs and update Key Results for your function. Help the Founder keep objectives on track.',
      route: '/(tabs)/okrs',
      illustration: 'target',
    },
    {
      id: 'work',
      title: 'Create & Assign Tasks',
      description: 'This is your primary workspace. Create tasks for your function, assign them to Apprentices, and track completion. You\'re the taskmaster!',
      route: '/(tabs)/work',
      illustration: 'clipboard',
      action: 'Create Your First Task',
    },
    {
      id: 'team',
      title: 'Monitor Your Apprentices',
      description: 'See how your Apprentices are performing. Check utilization rates, task completion times, and identify who needs coaching or more work.',
      route: '/(tabs)/team',
      illustration: 'users',
    },
    {
      id: 'reviews',
      title: 'Your Review Queue',
      description: 'This is critical! Apprentices submit work here for your approval. Review submissions, provide feedback, approve or request changes. Quality control is your job.',
      route: '/(tabs)/reviews',
      illustration: 'check-circle',
      action: 'Review Pending Work',
    },
    {
      id: 'reports',
      title: 'Your Performance Dashboard',
      description: 'Generate reports to see your function\'s performance: tasks created, work verified, team productivity. Share these with the Founder.',
      illustration: 'bar-chart',
      action: 'View My Report',
    },
    {
      id: 'events',
      title: 'Professional Development',
      description: 'Join events to stay sharp in your field and network with other executives.',
      route: '/(tabs)/events',
      illustration: 'calendar',
    },
    {
      id: 'complete',
      title: 'Ready to Execute!',
      description: 'Your role: Create structured tasks, assign to Apprentices, review their work, and keep the machine running smoothly. Let\'s build!',
      illustration: 'trophy',
      action: 'Start Leading',
    },
  ],
};

// ============================================================================
// APPRENTICE ONBOARDING
// ============================================================================

export const APPRENTICE_ONBOARDING: OnboardingFlow = {
  role: 'Apprentice',
  steps: [
    {
      id: 'welcome',
      title: 'Welcome, Apprentice!',
      description: "You're an Apprentice - the doer who completes tasks and learns rapidly. Let's show you how to crush your goals and level up.",
      illustration: 'zap',
    },
    {
      id: 'dashboard',
      title: 'Your Personal Dashboard',
      description: 'The Home tab shows YOUR focus tasks for today, your completion streak, and recent activity. Start here every morning to know what to work on.',
      route: '/(tabs)',
      illustration: 'home',
      action: 'See My Tasks',
    },
    {
      id: 'work',
      title: 'Your Task List',
      description: 'This is where you live! See all tasks assigned to YOU, filter by status, and complete them one by one. Tap a task to add time, update status, or mark as done.',
      route: '/(tabs)/work',
      illustration: 'clipboard',
      action: 'View My Tasks',
    },
    {
      id: 'completing-tasks',
      title: 'How to Complete Tasks',
      description: 'Tap a task → Log your time → Update status to "In Progress" → When done, mark as "Done" → Your Executive will review it. Build your streak by completing tasks daily!',
      illustration: 'check',
    },
    {
      id: 'reviews',
      title: 'Submit Work for Review',
      description: 'When you complete a task, it goes to your Executive for approval. If they request changes, you\'ll see feedback here. Fix it and resubmit!',
      route: '/(tabs)/reviews',
      illustration: 'eye',
    },
    {
      id: 'team',
      title: 'See Your Team',
      description: 'View other team members, see their performance (friendly competition!), and understand who does what.',
      route: '/(tabs)/team',
      illustration: 'users',
    },
    {
      id: 'okrs',
      title: 'Understand Company Goals',
      description: 'See what OKRs your tasks contribute to. Understand the bigger picture - your work matters!',
      route: '/(tabs)/okrs',
      illustration: 'target',
    },
    {
      id: 'reports',
      title: 'Track Your Progress',
      description: 'Generate your personal performance report to see: tasks completed, hours logged, achievements unlocked, and areas to improve.',
      illustration: 'trending-up',
      action: 'View My Report',
    },
    {
      id: 'events',
      title: 'Learn & Grow',
      description: 'Attend workshops and events to build new skills. The more you learn, the faster you level up!',
      route: '/(tabs)/events',
      illustration: 'book',
    },
    {
      id: 'complete',
      title: 'Let\'s Get to Work!',
      description: 'Your mission: Complete tasks, maintain your streak, and show your Executive what you can do. Every completed task is a win. Now go crush it!',
      illustration: 'trophy',
      action: 'Start Working',
    },
  ],
};

// ============================================================================
// ONBOARDING STATE MANAGEMENT
// ============================================================================

export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  try {
    const completed = await AsyncStorage.getItem(`${ONBOARDING_KEY}_${userId}`);
    return completed === 'true';
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
}

export async function markOnboardingComplete(userId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(`${ONBOARDING_KEY}_${userId}`, 'true');
  } catch (error) {
    console.error('Error marking onboarding complete:', error);
  }
}

export async function resetOnboarding(userId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${ONBOARDING_KEY}_${userId}`);
  } catch (error) {
    console.error('Error resetting onboarding:', error);
  }
}

export function getOnboardingFlow(role: Role): OnboardingFlow {
  switch (role) {
    case 'Founder':
      return FOUNDER_ONBOARDING;
    case 'FractionalExec':
      return EXECUTIVE_ONBOARDING;
    case 'Apprentice':
      return APPRENTICE_ONBOARDING;
    default:
      return FOUNDER_ONBOARDING;
  }
}
