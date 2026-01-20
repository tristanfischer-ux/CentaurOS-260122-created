// Onboarding system for Centaur OS
// Role-specific walkthroughs for Founders, Executives, and Apprentices
// Updated to reflect the current 6-tab structure: Home, People, Tasks, When, Marketplace, Settings

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Role } from '@/types';

const ONBOARDING_KEY = 'onboarding_completed';

export interface OnboardingFeature {
  icon: string;
  label: string;
  color: string;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  illustration?: string; // Icon name
  route?: string; // Which tab to highlight
  action?: string; // Optional CTA text
  features?: OnboardingFeature[]; // Mini feature highlights
  gradient?: [string, string]; // Custom gradient for this step
}

export interface OnboardingFlow {
  role: Role;
  steps: OnboardingStep[];
}

// ============================================================================
// FOUNDER ONBOARDING - Updated for Executive Command Center
// ============================================================================

export const FOUNDER_ONBOARDING: OnboardingFlow = {
  role: 'Founder',
  steps: [
    {
      id: 'welcome',
      title: 'Welcome to Centaur OS',
      description: "Your startup's command center. Everything you need to run your business - decisions, objectives, team capacity, and performance - all in one place.",
      illustration: 'rocket',
      gradient: ['#7c3aed', '#4f46e5'],
    },
    {
      id: 'home-dashboard',
      title: 'Your Home Dashboard',
      description: 'The home screen gives you instant visibility: urgent decisions at the top, business objectives, team capacity gauge, and key performance metrics. Everything you need to lead effectively.',
      route: '/(tabs)',
      illustration: 'home',
      features: [
        { icon: 'target', label: 'Objectives', color: '#8b5cf6' },
        { icon: 'users', label: 'Team Status', color: '#10b981' },
        { icon: 'bar-chart', label: 'KPIs', color: '#3b82f6' },
      ],
      gradient: ['#6366f1', '#8b5cf6'],
    },
    {
      id: 'people-tab',
      title: 'Manage Your Team',
      description: 'The People tab shows your complete team roster with capacity visualization. See who\'s available, who\'s overloaded, and easily assign work. Track time allocations and workload balance.',
      illustration: 'users',
      route: '/(tabs)/people',
      features: [
        { icon: 'pie-chart', label: 'Capacity', color: '#10b981' },
        { icon: 'user', label: 'Members', color: '#3b82f6' },
        { icon: 'zap', label: 'Assignments', color: '#f59e0b' },
      ],
      gradient: ['#10b981', '#14b8a6'],
    },
    {
      id: 'tasks-tab',
      title: 'Create & Track Tasks',
      description: 'The Tasks tab is your command center for work. Create tasks with AI voice extraction, assign to team members, set priorities, and track progress. Tap the green + button anytime to add a task.',
      illustration: 'clipboard',
      route: '/(tabs)/tasks',
      features: [
        { icon: 'check-circle', label: 'Track Work', color: '#10b981' },
        { icon: 'zap', label: 'AI Creation', color: '#8b5cf6' },
        { icon: 'user', label: 'Assign', color: '#3b82f6' },
      ],
      gradient: ['#3b82f6', '#6366f1'],
    },
    {
      id: 'timeline-tab',
      title: 'Visualize the Timeline',
      description: 'The When tab shows your Gantt chart - a visual timeline of all work across weeks. See what\'s happening now, what\'s coming next, and spot scheduling conflicts before they become problems.',
      illustration: 'calendar',
      route: '/(tabs)/when',
      features: [
        { icon: 'calendar', label: 'Gantt View', color: '#8b5cf6' },
        { icon: 'activity', label: 'Progress', color: '#10b981' },
        { icon: 'alert-triangle', label: 'Conflicts', color: '#ef4444' },
      ],
      gradient: ['#8b5cf6', '#a855f7'],
    },
    {
      id: 'marketplace-tab',
      title: 'Discover Resources',
      description: 'The Marketplace tab helps you find people, suppliers, and tools. Browse fractional executives, discover trusted service providers, and explore AI tools to amplify your team.',
      illustration: 'building',
      route: '/(tabs)/marketplace',
      features: [
        { icon: 'users', label: 'People', color: '#3b82f6' },
        { icon: 'briefcase', label: 'Suppliers', color: '#10b981' },
        { icon: 'zap', label: 'AI Tools', color: '#f59e0b' },
      ],
      gradient: ['#f59e0b', '#f97316'],
    },
    {
      id: 'settings-tab',
      title: 'Customize Everything',
      description: 'The Settings tab lets you configure themes (light/dark/off-white), manage workspaces, set up integrations, and control your account. Make Centaur OS work the way you work.',
      illustration: 'settings',
      route: '/(tabs)/settings',
      features: [
        { icon: 'layout', label: 'Themes', color: '#8b5cf6' },
        { icon: 'building', label: 'Workspaces', color: '#3b82f6' },
        { icon: 'zap', label: 'Integrations', color: '#10b981' },
      ],
      gradient: ['#6366f1', '#4f46e5'],
    },
    {
      id: 'complete',
      title: 'You\'re Ready to Lead',
      description: 'Your command center is ready. Use Home for daily overview, People to manage your team, Tasks to track work, When to plan ahead, Marketplace to find resources, and Settings to customize. Let\'s build something great.',
      illustration: 'trophy',
      action: 'Launch Command Center',
      gradient: ['#7c3aed', '#6366f1'],
    },
  ],
};

// ============================================================================
// FRACTIONAL EXECUTIVE ONBOARDING - Updated
// ============================================================================

export const EXECUTIVE_ONBOARDING: OnboardingFlow = {
  role: 'FractionalExec',
  steps: [
    {
      id: 'welcome',
      title: 'Welcome, Executive',
      description: "You're a Fractional Executive - the expert who structures work and reviews output. Your dashboard is optimized for managing multiple engagements.",
      illustration: 'award',
      gradient: ['#0ea5e9', '#06b6d4'],
    },
    {
      id: 'executive-home',
      title: 'Your Dashboard',
      description: 'The Home tab shows your active tasks, objectives, and team status. See all your work across engagements in one unified view. Focus on what matters most.',
      route: '/(tabs)',
      illustration: 'home',
      features: [
        { icon: 'target', label: 'Objectives', color: '#8b5cf6' },
        { icon: 'clipboard', label: 'Tasks', color: '#3b82f6' },
        { icon: 'users', label: 'Team', color: '#10b981' },
      ],
      gradient: ['#06b6d4', '#14b8a6'],
    },
    {
      id: 'people-management',
      title: 'Guide Your Team',
      description: 'The People tab shows team members you mentor. View their capacity, track their progress, and assign work. Your guidance shapes their growth.',
      illustration: 'users',
      route: '/(tabs)/people',
      features: [
        { icon: 'users', label: 'Mentees', color: '#0ea5e9' },
        { icon: 'star', label: 'Feedback', color: '#f59e0b' },
        { icon: 'trending-up', label: 'Growth', color: '#10b981' },
      ],
      gradient: ['#10b981', '#059669'],
    },
    {
      id: 'task-management',
      title: 'Structure the Work',
      description: 'The Tasks tab is where you create and assign work. Break down complex projects, set priorities, and track completion. Your expertise defines what gets done.',
      illustration: 'clipboard',
      route: '/(tabs)/tasks',
      features: [
        { icon: 'check-circle', label: 'Structure', color: '#10b981' },
        { icon: 'user', label: 'Assign', color: '#3b82f6' },
        { icon: 'star', label: 'Review', color: '#f59e0b' },
      ],
      gradient: ['#3b82f6', '#6366f1'],
    },
    {
      id: 'timeline-planning',
      title: 'Plan the Timeline',
      description: 'The When tab shows your Gantt chart. Sequence work, spot bottlenecks, and ensure your team has a clear path forward. Strategic planning in action.',
      illustration: 'calendar',
      route: '/(tabs)/when',
      features: [
        { icon: 'calendar', label: 'Schedule', color: '#8b5cf6' },
        { icon: 'activity', label: 'Progress', color: '#10b981' },
        { icon: 'alert-triangle', label: 'Risks', color: '#ef4444' },
      ],
      gradient: ['#8b5cf6', '#a855f7'],
    },
    {
      id: 'complete',
      title: 'Ready to Lead',
      description: 'Your workspace is ready. Create work plans, mentor your team, and drive results. Excellence through expertise.',
      illustration: 'trophy',
      action: 'Start Leading',
      gradient: ['#0ea5e9', '#06b6d4'],
    },
  ],
};

// ============================================================================
// APPRENTICE ONBOARDING - Updated
// ============================================================================

export const APPRENTICE_ONBOARDING: OnboardingFlow = {
  role: 'Apprentice',
  steps: [
    {
      id: 'welcome',
      title: 'Welcome, Apprentice',
      description: "You're an Apprentice - the doer who executes and learns. Your dashboard is designed to help you focus, deliver quality work, and grow your skills.",
      illustration: 'zap',
      gradient: ['#f59e0b', '#f97316'],
    },
    {
      id: 'focus-dashboard',
      title: 'Your Focus Dashboard',
      description: 'The Home tab shows what to work on RIGHT NOW. Your highest priority tasks appear at the top. Clear priorities, no distractions - just focus on delivering great work.',
      route: '/(tabs)',
      illustration: 'home',
      features: [
        { icon: 'play', label: 'Focus Now', color: '#ef4444' },
        { icon: 'list', label: 'Up Next', color: '#f59e0b' },
        { icon: 'check-circle', label: 'Completed', color: '#10b981' },
      ],
      gradient: ['#ef4444', '#f97316'],
    },
    {
      id: 'task-list',
      title: 'Your Task List',
      description: 'The Tasks tab shows all your assigned work sorted by priority. See deadlines, time estimates, and instructions. Update progress as you work and submit when complete.',
      illustration: 'clipboard',
      route: '/(tabs)/tasks',
      features: [
        { icon: 'clock', label: 'Deadlines', color: '#ef4444' },
        { icon: 'file-text', label: 'Instructions', color: '#3b82f6' },
        { icon: 'check-circle', label: 'Submit', color: '#10b981' },
      ],
      gradient: ['#f97316', '#f59e0b'],
    },
    {
      id: 'team-connection',
      title: 'Connect with Your Team',
      description: 'The People tab shows your team and mentor. See who you\'re working with, their capacity, and how to reach them. Building relationships accelerates learning.',
      illustration: 'users',
      route: '/(tabs)/people',
      features: [
        { icon: 'user', label: 'Mentor', color: '#8b5cf6' },
        { icon: 'users', label: 'Team', color: '#3b82f6' },
        { icon: 'message-circle', label: 'Connect', color: '#10b981' },
      ],
      gradient: ['#3b82f6', '#6366f1'],
    },
    {
      id: 'timeline-view',
      title: 'See the Big Picture',
      description: 'The When tab shows the timeline - what\'s happening now and what\'s coming next. Understanding the bigger picture helps you prioritize and coordinate with your team.',
      illustration: 'calendar',
      route: '/(tabs)/when',
      features: [
        { icon: 'calendar', label: 'Schedule', color: '#8b5cf6' },
        { icon: 'activity', label: 'Progress', color: '#10b981' },
        { icon: 'users', label: 'Team Work', color: '#3b82f6' },
      ],
      gradient: ['#8b5cf6', '#a855f7'],
    },
    {
      id: 'complete',
      title: 'Time to Execute',
      description: 'Focus on one task at a time. Submit quality work. Learn from feedback. Build your reputation through consistent execution. Your journey to mastery starts now.',
      illustration: 'trophy',
      action: 'Start Working',
      gradient: ['#f59e0b', '#f97316'],
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
