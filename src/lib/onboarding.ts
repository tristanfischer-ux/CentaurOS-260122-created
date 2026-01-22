// Onboarding system for Centaur OS
// Role-specific walkthroughs for Founders, Executives, and Apprentices
// Updated to reflect the new Executive Command Center home screen

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
      id: 'command-center',
      title: 'Your Executive Command Center',
      description: 'The home screen is designed for busy founders. See everything at a glance - urgent decisions, business objectives, team activity, and key metrics. Pull down anytime to refresh.',
      route: '/(tabs)',
      illustration: 'home',
      features: [
        { icon: 'alert-triangle', label: 'Urgent Decisions', color: '#ef4444' },
        { icon: 'target', label: 'Objectives', color: '#8b5cf6' },
        { icon: 'activity', label: 'Activities', color: '#3b82f6' },
        { icon: 'users', label: 'Team Capacity', color: '#10b981' },
      ],
      gradient: ['#6366f1', '#8b5cf6'],
    },
    {
      id: 'urgent-decisions',
      title: 'Never Miss a Decision',
      description: 'Critical decisions appear at the very top with color-coded urgency. Red means critical (act now), orange is high priority, yellow is normal. Tap to see context and make your choice.',
      illustration: 'alert-triangle',
      features: [
        { icon: 'clock', label: 'Deadlines', color: '#f59e0b' },
        { icon: 'check-circle', label: 'Options', color: '#10b981' },
        { icon: 'info', label: 'Context', color: '#3b82f6' },
      ],
      gradient: ['#ef4444', '#f97316'],
    },
    {
      id: 'objectives',
      title: 'Track Business Objectives',
      description: 'Your Q1 strategic goals displayed as scrollable cards. Each shows progress %, key metrics, and status (On Track, At Risk, Behind). Tap any objective to see milestones and linked tasks.',
      illustration: 'target',
      features: [
        { icon: 'trending-up', label: 'Progress', color: '#10b981' },
        { icon: 'bar-chart', label: 'Metrics', color: '#3b82f6' },
        { icon: 'flag', label: 'Milestones', color: '#8b5cf6' },
      ],
      gradient: ['#8b5cf6', '#a855f7'],
    },
    {
      id: 'activities',
      title: 'See What\'s Happening',
      description: 'Current Activities shows in-progress tasks and what\'s coming in the next 1-2 weeks. Bottleneck alerts warn you when tasks are blocked or team members are overloaded.',
      illustration: 'activity',
      features: [
        { icon: 'play', label: 'In Progress', color: '#3b82f6' },
        { icon: 'calendar', label: 'Upcoming', color: '#8b5cf6' },
        { icon: 'alert-circle', label: 'Bottlenecks', color: '#f59e0b' },
      ],
      gradient: ['#3b82f6', '#0ea5e9'],
    },
    {
      id: 'team-capacity',
      title: 'Team Capacity at a Glance',
      description: 'A visual gauge shows overall team utilization (green = healthy, yellow = busy, red = overloaded). See who has spare capacity and get recommendations for assigning new work.',
      illustration: 'users',
      features: [
        { icon: 'pie-chart', label: 'Utilization', color: '#10b981' },
        { icon: 'user', label: 'Per Person', color: '#3b82f6' },
        { icon: 'zap', label: 'Spare Capacity', color: '#f59e0b' },
      ],
      gradient: ['#10b981', '#14b8a6'],
    },
    {
      id: 'performance-kpis',
      title: 'Performance Dashboard',
      description: 'Six KPI cards give you instant health checks: Project Health, Team Productivity, Resource Efficiency, Supplier Performance, Objective Progress, and Cash Flow. Each is tappable for details.',
      illustration: 'bar-chart',
      features: [
        { icon: 'activity', label: 'Health', color: '#3b82f6' },
        { icon: 'trending-up', label: 'Trends', color: '#10b981' },
        { icon: 'dollar-sign', label: 'Finances', color: '#f59e0b' },
      ],
      gradient: ['#6366f1', '#4f46e5'],
    },
    {
      id: 'supplier-spend',
      title: 'Financial Visibility',
      description: 'The Supplier & Spend dashboard shows where your money goes. Pie chart by category, budget progress, 3-month trends, and active engagement summary. Stay on top of burn rate.',
      illustration: 'dollar-sign',
      features: [
        { icon: 'pie-chart', label: 'Distribution', color: '#8b5cf6' },
        { icon: 'trending-up', label: 'Trends', color: '#3b82f6' },
        { icon: 'alert-triangle', label: 'Budget Alerts', color: '#ef4444' },
      ],
      gradient: ['#8b5cf6', '#7c3aed'],
    },
    {
      id: 'tabs-overview',
      title: 'Navigate with Purpose',
      description: 'Six tabs organize your workflow: Home (command center), Why (strategy), What (tasks), Who (team), Decide (allocation), and Evaluate (review). Each serves a specific purpose in running your business.',
      illustration: 'layout',
      features: [
        { icon: 'home', label: 'Home', color: '#7c3aed' },
        { icon: 'target', label: 'Strategy', color: '#3b82f6' },
        { icon: 'clipboard', label: 'Execution', color: '#10b981' },
      ],
      gradient: ['#4f46e5', '#6366f1'],
    },
    {
      id: 'complete',
      title: 'You\'re Ready to Lead',
      description: 'Your executive command center is ready. Start each day by checking urgent decisions, review objectives weekly, and use the KPIs to spot issues before they become problems. Let\'s build something great.',
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
      title: 'Your Multi-Company Dashboard',
      description: 'See all your active engagements at a glance. Track hours, deliverables, and apprentice progress across multiple companies from one unified view.',
      route: '/(tabs)',
      illustration: 'briefcase',
      features: [
        { icon: 'building', label: 'Engagements', color: '#0ea5e9' },
        { icon: 'clock', label: 'Hours', color: '#10b981' },
        { icon: 'users', label: 'Mentees', color: '#f59e0b' },
      ],
      gradient: ['#06b6d4', '#14b8a6'],
    },
    {
      id: 'function-focus',
      title: 'Domain Expertise',
      description: 'Focus on your function (Marketing, Finance, Engineering, etc.). See domain-specific OKRs, tasks, and team members. Your expertise shapes strategy.',
      illustration: 'target',
      features: [
        { icon: 'target', label: 'Function OKRs', color: '#8b5cf6' },
        { icon: 'clipboard', label: 'Work Plans', color: '#3b82f6' },
        { icon: 'check-circle', label: 'Reviews', color: '#10b981' },
      ],
      gradient: ['#8b5cf6', '#a855f7'],
    },
    {
      id: 'mentorship',
      title: 'Apprentice Mentorship',
      description: 'Your apprentices appear in a dedicated queue. Review their submissions, provide structured feedback, and help them grow. Your mentorship builds the next generation.',
      illustration: 'users',
      features: [
        { icon: 'message-circle', label: 'Feedback', color: '#3b82f6' },
        { icon: 'star', label: 'Ratings', color: '#f59e0b' },
        { icon: 'trending-up', label: 'Growth', color: '#10b981' },
      ],
      gradient: ['#f59e0b', '#f97316'],
    },
    {
      id: 'time-tracking',
      title: 'Track Your Time',
      description: 'Log hours across engagements. See utilization, billable hours, and capacity. Ensure you\'re maximizing impact across all your companies.',
      illustration: 'clock',
      features: [
        { icon: 'calendar', label: 'Schedule', color: '#0ea5e9' },
        { icon: 'bar-chart', label: 'Utilization', color: '#10b981' },
        { icon: 'dollar-sign', label: 'Billable', color: '#f59e0b' },
      ],
      gradient: ['#10b981', '#059669'],
    },
    {
      id: 'complete',
      title: 'Ready to Lead',
      description: 'Your workspace is ready. Create work plans, mentor apprentices, and drive results across your engagements. Excellence through expertise.',
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
      description: "You're an Apprentice - the doer who executes and learns. Your dashboard is designed to help you focus, deliver, and grow your career.",
      illustration: 'zap',
      gradient: ['#f59e0b', '#f97316'],
    },
    {
      id: 'focus-dashboard',
      title: 'Your Focus Dashboard',
      description: 'See what to work on RIGHT NOW. Your most important task is highlighted at the top. No distractions - just clear priorities and deadlines.',
      route: '/(tabs)',
      illustration: 'target',
      features: [
        { icon: 'play', label: 'Focus Now', color: '#ef4444' },
        { icon: 'list', label: 'Up Next', color: '#f59e0b' },
        { icon: 'check-circle', label: 'Completed', color: '#10b981' },
      ],
      gradient: ['#ef4444', '#f97316'],
    },
    {
      id: 'task-queue',
      title: 'Your Task Queue',
      description: 'All your assigned tasks in one place, sorted by priority. See deadlines, expected time, and what your mentor expects. Update progress as you work.',
      illustration: 'clipboard',
      features: [
        { icon: 'clock', label: 'Deadlines', color: '#ef4444' },
        { icon: 'file-text', label: 'Briefs', color: '#3b82f6' },
        { icon: 'message-circle', label: 'Instructions', color: '#10b981' },
      ],
      gradient: ['#f97316', '#f59e0b'],
    },
    {
      id: 'submit-work',
      title: 'Submit & Get Feedback',
      description: 'When you complete a task, submit it for review. Your mentor will approve or request changes. Quick turnaround on feedback means faster learning.',
      illustration: 'check-circle',
      features: [
        { icon: 'upload', label: 'Submit', color: '#3b82f6' },
        { icon: 'message-circle', label: 'Feedback', color: '#f59e0b' },
        { icon: 'refresh-cw', label: 'Revise', color: '#10b981' },
      ],
      gradient: ['#10b981', '#059669'],
    },
    {
      id: 'mentor-access',
      title: 'Connect with Your Mentor',
      description: 'Quick access to message your mentor, ask questions, and get guidance. Building a strong relationship with your mentor accelerates your growth.',
      illustration: 'users',
      features: [
        { icon: 'message-circle', label: 'Chat', color: '#3b82f6' },
        { icon: 'help-circle', label: 'Ask', color: '#8b5cf6' },
        { icon: 'book', label: 'Learn', color: '#10b981' },
      ],
      gradient: ['#3b82f6', '#6366f1'],
    },
    {
      id: 'achievements',
      title: 'Track Your Progress',
      description: 'See your completion rate, streaks, and achievements. Every task completed builds your reputation. Consistency leads to opportunities.',
      illustration: 'trending-up',
      features: [
        { icon: 'flame', label: 'Streaks', color: '#f97316' },
        { icon: 'star', label: 'Ratings', color: '#f59e0b' },
        { icon: 'award', label: 'Badges', color: '#8b5cf6' },
      ],
      gradient: ['#8b5cf6', '#a855f7'],
    },
    {
      id: 'complete',
      title: 'Time to Execute',
      description: 'Focus on one task at a time. Submit quality work. Learn from feedback. Build your streak. Your journey to mastery starts now.',
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
