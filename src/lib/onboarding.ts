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
      description: 'The Home tab is your daily dashboard. See team activity, track OKR progress, view apprentice engagement, and access financial insights. Check in here every morning to stay on top of everything.',
      route: '/(tabs)',
      illustration: 'home',
    },
    {
      id: 'okrs',
      title: 'Set Strategic Goals (Decide)',
      description: 'The Decide tab shows your function-based OKRs. Set objectives for Marketing, Sales, Engineering, Ops, Finance, and Admin. Track key results with real-time health indicators.',
      route: '/(tabs)/decide',
      illustration: 'target',
    },
    {
      id: 'work',
      title: 'Execute with Do Tab',
      description: 'The Do tab shows all work across your company. View by function, filter by status and priority. Assign work plans to apprentices and track completion rates.',
      route: '/(tabs)/do',
      illustration: 'clipboard',
    },
    {
      id: 'evaluate',
      title: 'Quality Control (Evaluate)',
      description: 'The Evaluate tab is where executives create work plans and apprentices submit completed work. Review submissions, provide feedback, approve or request changes.',
      route: '/(tabs)/evaluate',
      illustration: 'check-circle',
    },
    {
      id: 'make',
      title: 'Manufacturing & AI Tools',
      description: 'The Make tab connects you with 31+ UK manufacturers and 50+ AI agents. Manage suppliers, track BOM costs, and integrate AI across all business functions.',
      route: '/(tabs)/make',
      illustration: 'briefcase',
    },
    {
      id: 'community',
      title: 'Build Your Network',
      description: 'The Community tab lets you discover fractional executives, apprentices, suppliers, and AI tools. Swipe through candidates, request allocations, and build your team.',
      route: '/(tabs)/community',
      illustration: 'users',
    },
    {
      id: 'settings',
      title: 'Settings & Organization',
      description: 'Access your financial dashboard (founder-only!), view org structure, manage team, generate reports, and customize your experience.',
      route: '/(tabs)/settings',
      illustration: 'settings',
    },
    {
      id: 'complete',
      title: 'You\'re Ready to Lead!',
      description: 'Start by setting OKRs in Decide, create work plans in Evaluate, track execution in Do, and monitor progress on your Home dashboard. Your startup\'s operating system is ready.',
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
      title: 'Your Function Dashboard',
      description: 'The Home tab shows your team\'s activity, your function\'s OKR progress, and apprentices you manage. Start each day here to see what needs your attention.',
      route: '/(tabs)',
      illustration: 'home',
    },
    {
      id: 'okrs',
      title: 'Track Strategic Progress (Decide)',
      description: 'The Decide tab shows all function-based OKRs. You can update Key Results for your function and help the Founder keep objectives on track.',
      route: '/(tabs)/decide',
      illustration: 'target',
    },
    {
      id: 'work',
      title: 'View Work Execution (Do)',
      description: 'The Do tab shows work across all functions. You can view work assigned to your apprentices and track their progress in real-time.',
      route: '/(tabs)/do',
      illustration: 'clipboard',
    },
    {
      id: 'evaluate',
      title: 'Your Primary Workspace (Evaluate)',
      description: 'This is where you live! Create structured work plans for your function, assign to apprentices, review their submissions, and provide feedback. You\'re the quality gatekeeper.',
      route: '/(tabs)/evaluate',
      illustration: 'check-circle',
    },
    {
      id: 'make',
      title: 'Access Resources & Tools',
      description: 'The Make tab gives you access to AI agents and manufacturing suppliers that can help your function execute better.',
      route: '/(tabs)/make',
      illustration: 'briefcase',
    },
    {
      id: 'community',
      title: 'Grow Your Network',
      description: 'Browse the Community tab to discover other executives, find apprentices to recruit, and connect with peers in your function.',
      route: '/(tabs)/community',
      illustration: 'users',
    },
    {
      id: 'complete',
      title: 'Ready to Lead!',
      description: 'Your role: Create structured work plans in Evaluate, assign to apprentices, review their submissions, and maintain quality. Let\'s execute excellence!',
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
      description: "You're an Apprentice - the doer who executes work and learns rapidly. Let's show you how to crush your goals and level up your career.",
      illustration: 'zap',
    },
    {
      id: 'dashboard',
      title: 'Your Performance Dashboard',
      description: 'The Home tab shows YOUR assigned work, completion streak, and how you\'re contributing to company OKRs. Start here every morning to know what to focus on.',
      route: '/(tabs)',
      illustration: 'home',
    },
    {
      id: 'okrs',
      title: 'Understand Company Goals (Decide)',
      description: 'The Decide tab shows company OKRs. See what strategic objectives your work contributes to. Understanding the bigger picture makes you more valuable!',
      route: '/(tabs)/decide',
      illustration: 'target',
    },
    {
      id: 'work',
      title: 'Your Task List (Do)',
      description: 'This is where you live! The Do tab shows all work assigned to YOU. View by status, update progress, log time, and mark tasks complete. Build your streak by executing daily!',
      route: '/(tabs)/do',
      illustration: 'clipboard',
    },
    {
      id: 'evaluate',
      title: 'Submit Your Work (Evaluate)',
      description: 'When you complete work, submit it in the Evaluate tab for your executive to review. If they request changes, you\'ll see feedback here. Fix it and resubmit to get approved!',
      route: '/(tabs)/evaluate',
      illustration: 'check-circle',
    },
    {
      id: 'completing-tasks',
      title: 'How to Excel',
      description: 'Tap a work plan → Update status to "In Progress" → Complete the deliverables → Submit for review → Respond to feedback quickly. Consistency and quality get you promoted!',
      illustration: 'check',
    },
    {
      id: 'community',
      title: 'Learn from Others',
      description: 'Browse the Community tab to see other apprentices, discover learning resources, and find events to attend. Your network is your net worth!',
      route: '/(tabs)/community',
      illustration: 'users',
    },
    {
      id: 'complete',
      title: 'Let\'s Execute!',
      description: 'Your mission: Complete assigned work, maintain your streak, submit quality deliverables, and show your executive what you can do. Every completed task builds your reputation. Now go crush it!',
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
