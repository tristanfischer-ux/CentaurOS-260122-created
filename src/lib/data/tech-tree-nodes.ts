/**
 * Getting Started Checklist
 * Essential onboarding steps to learn the app
 */

import { TechNode } from '@/lib/types/tech-tree-types';

export const TECH_TREE_NODES: TechNode[] = [
  // Step 1: Create your first task
  {
    id: 'step-1-first-task',
    actId: 1,
    type: 'main',
    title: 'Create Your First Task',
    subtitle: 'Start building your backlog',
    description: 'Learn how to create and manage tasks in the Decide tab. Tasks are the core unit of work in your business.',
    position: { x: 0, y: 0 },
    prerequisiteNodeIds: [],
    researchCostTU: 0,
    taskPack: {
      id: 'tp-first-task',
      title: 'First Task',
      description: 'Create a task in the Decide tab',
      totalTUEstimate: 1,
      tasks: [
        {
          id: 'task1',
          title: 'Create a task in Decide tab',
          description: 'Tap the + button in the Decide tab to create your first task',
          tuEstimate: 1,
          completed: false,
        },
      ],
    },
    xpReward: 0,
    unlocks: [],
    isBossGate: false,
    tags: ['onboarding'],
  },

  // Step 2: Add team member
  {
    id: 'step-2-team-member',
    actId: 1,
    type: 'main',
    title: 'Add a Team Member',
    subtitle: 'Build your team',
    description: 'Add your first team member in the Community tab. Team members can be Founders, Executives, or Apprentices.',
    position: { x: 0, y: 1 },
    prerequisiteNodeIds: ['step-1-first-task'],
    researchCostTU: 0,
    taskPack: {
      id: 'tp-team-member',
      title: 'First Team Member',
      description: 'Add a team member',
      totalTUEstimate: 1,
      tasks: [
        {
          id: 'team1',
          title: 'Add a team member in Community tab',
          description: 'Navigate to Community and add your first team member',
          tuEstimate: 1,
          completed: false,
        },
      ],
    },
    xpReward: 0,
    unlocks: [],
    isBossGate: false,
    tags: ['onboarding'],
  },

  // Step 3: Allocate task
  {
    id: 'step-3-allocate-task',
    actId: 1,
    type: 'main',
    title: 'Allocate a Task',
    subtitle: 'Assign work to team members',
    description: 'Allocate your first task to a team member in the Decide tab. This moves it from backlog to active work.',
    position: { x: 0, y: 2 },
    prerequisiteNodeIds: ['step-2-team-member'],
    researchCostTU: 0,
    taskPack: {
      id: 'tp-allocate',
      title: 'Task Allocation',
      description: 'Allocate a task to a team member',
      totalTUEstimate: 1,
      tasks: [
        {
          id: 'alloc1',
          title: 'Allocate a task to someone',
          description: 'In Decide tab, tap a task and allocate it to a team member',
          tuEstimate: 1,
          completed: false,
        },
      ],
    },
    xpReward: 0,
    unlocks: [],
    isBossGate: false,
    tags: ['onboarding'],
  },

  // Step 4: Start working on task
  {
    id: 'step-4-start-task',
    actId: 1,
    type: 'main',
    title: 'Start a Task',
    subtitle: 'Begin execution',
    description: 'Switch to the Do tab and start working on an allocated task. Track your progress in real-time.',
    position: { x: 0, y: 3 },
    prerequisiteNodeIds: ['step-3-allocate-task'],
    researchCostTU: 0,
    taskPack: {
      id: 'tp-start-task',
      title: 'Start Working',
      description: 'Start a task in Do tab',
      totalTUEstimate: 1,
      tasks: [
        {
          id: 'start1',
          title: 'Start working on a task in Do tab',
          description: 'Go to Do tab and begin work on your allocated task',
          tuEstimate: 1,
          completed: false,
        },
      ],
    },
    xpReward: 0,
    unlocks: [],
    isBossGate: false,
    tags: ['onboarding'],
  },

  // Step 5: Submit for evaluation
  {
    id: 'step-5-submit',
    actId: 1,
    type: 'main',
    title: 'Submit Your Work',
    subtitle: 'Request review',
    description: 'When you complete a task, submit it for evaluation. The founder will review and approve your work.',
    position: { x: 0, y: 4 },
    prerequisiteNodeIds: ['step-4-start-task'],
    researchCostTU: 0,
    taskPack: {
      id: 'tp-submit',
      title: 'Submit Work',
      description: 'Submit completed work',
      totalTUEstimate: 1,
      tasks: [
        {
          id: 'submit1',
          title: 'Submit a completed task for review',
          description: 'In Do tab, mark task as done and submit for evaluation',
          tuEstimate: 1,
          completed: false,
        },
      ],
    },
    xpReward: 0,
    unlocks: [],
    isBossGate: false,
    tags: ['onboarding'],
  },

  // Step 6: Evaluate work
  {
    id: 'step-6-evaluate',
    actId: 1,
    type: 'main',
    title: 'Evaluate Submissions',
    subtitle: 'Review team work',
    description: 'As a founder, review submitted work in the Evaluate tab. Approve quality work or request revisions.',
    position: { x: 0, y: 5 },
    prerequisiteNodeIds: ['step-5-submit'],
    researchCostTU: 0,
    taskPack: {
      id: 'tp-evaluate',
      title: 'Review Work',
      description: 'Evaluate a submission',
      totalTUEstimate: 1,
      tasks: [
        {
          id: 'eval1',
          title: 'Review a submission in Evaluate tab',
          description: 'Go to Evaluate and approve or reject submitted work',
          tuEstimate: 1,
          completed: false,
        },
      ],
    },
    xpReward: 0,
    unlocks: [],
    isBossGate: false,
    tags: ['onboarding'],
  },

  // Step 7: Track progress
  {
    id: 'step-7-track-progress',
    actId: 1,
    type: 'main',
    title: 'Monitor Your Progress',
    subtitle: 'Stay on top of metrics',
    description: 'Check your Home screen regularly to see team health, capacity, and upcoming decisions.',
    position: { x: 0, y: 6 },
    prerequisiteNodeIds: ['step-6-evaluate'],
    researchCostTU: 0,
    taskPack: {
      id: 'tp-progress',
      title: 'Track Metrics',
      description: 'Review dashboard',
      totalTUEstimate: 1,
      tasks: [
        {
          id: 'prog1',
          title: 'Check Home screen metrics',
          description: 'Review your mission status and team health on Home',
          tuEstimate: 1,
          completed: false,
        },
      ],
    },
    xpReward: 0,
    unlocks: [],
    isBossGate: false,
    tags: ['onboarding'],
  },

  // Step 8: Complete onboarding
  {
    id: 'step-8-complete',
    actId: 1,
    type: 'main',
    title: 'You\'re All Set!',
    subtitle: 'Ready to build',
    description: 'You\'ve learned the basics! Now continue building your business by creating more tasks, growing your team, and shipping products.',
    position: { x: 0, y: 7 },
    prerequisiteNodeIds: ['step-7-track-progress'],
    researchCostTU: 0,
    taskPack: {
      id: 'tp-complete',
      title: 'Onboarding Complete',
      description: 'Finish getting started',
      totalTUEstimate: 0,
      tasks: [
        {
          id: 'done1',
          title: 'Dismiss this checklist',
          description: 'You can now dismiss this getting started guide',
          tuEstimate: 0,
          completed: false,
        },
      ],
    },
    xpReward: 0,
    unlocks: [],
    isBossGate: false,
    tags: ['onboarding'],
  },
];
