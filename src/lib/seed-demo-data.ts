/**
 * Demo Data Seeder for Mission Control
 * Creates realistic Tech Tree progress, work plans, and engagements
 */

import { useTechTreeStore } from '@/lib/state/tech-tree-store';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { TECH_TREE_NODES } from '@/lib/data/tech-tree-nodes';

export function seedDemoData() {
  const techTreeStore = useTechTreeStore.getState();
  const workPlanStore = useWorkPlanStore.getState();
  const orgStore = useOrganizationStore.getState();

  // Initialize Tech Tree
  techTreeStore.initialize();

  // Start the first node (Launch Foundations)
  const firstNode = TECH_TREE_NODES.find((n) => n.id === 'act1-node1-foundations');
  if (firstNode) {
    techTreeStore.startResearch(firstNode.id);
    techTreeStore.startTaskPack(firstNode.id);

    // Complete 2 out of 4 tasks
    techTreeStore.completeTask(firstNode.id, 'f1'); // Vision
    techTreeStore.completeTask(firstNode.id, 'f2'); // First team member
  }

  // Seed work plans for the in-progress node
  const members = orgStore.members;
  const founder = members.find((m) => m.role === 'Founder');

  if (founder && firstNode) {
    // Create work plans for the remaining tasks
    const task3 = firstNode.taskPack.tasks[2]; // Create First OKR
    const task4 = firstNode.taskPack.tasks[3]; // Set Weekly TU

    // Task 3: In progress with allocation
    workPlanStore.addWorkPlan({
      id: 'wp-demo-1',
      workspaceId: 'demo-workspace',
      title: task3.title,
      description: task3.description,
      function: 'Engineering',
      linkedOKRTitle: `${firstNode.title} - ${task3.id}`,
      startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'in-progress',
      progress: 0.4,
      assignedBy: founder.id,
      needsSubmission: false,
      estimatedTimeUnits: task3.tuEstimate,
      allocations: [
        {
          memberId: founder.id,
          memberName: founder.name,
          squaresPerWeek: 2,
          costPerSquare: founder.costPerDay ? founder.costPerDay / 2 : 960,
        },
      ],
      appliedAITools: [],
      tusExpended: 1.2,
    });

    // Task 4: Not started but queued
    workPlanStore.addWorkPlan({
      id: 'wp-demo-2',
      workspaceId: 'demo-workspace',
      title: task4.title,
      description: task4.description,
      function: 'Ops',
      linkedOKRTitle: `${firstNode.title} - ${task4.id}`,
      startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'not-started',
      progress: 0,
      assignedBy: founder.id,
      needsSubmission: false,
      estimatedTimeUnits: task4.tuEstimate,
      allocations: [],
      appliedAITools: [],
      tusExpended: 0,
    });

    // Create a few additional work plans for the TU allocation summary
    workPlanStore.addWorkPlan({
      id: 'wp-demo-3',
      workspaceId: 'demo-workspace',
      title: 'Market Research: Target Segments',
      description: 'Identify and validate top 3 customer segments',
      function: 'Marketing',
      linkedOKRTitle: 'Q1 Strategic Initiative',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'in-progress',
      progress: 0.6,
      assignedBy: founder.id,
      needsSubmission: false,
      estimatedTimeUnits: 6,
      allocations: [
        {
          memberId: founder.id,
          memberName: founder.name,
          squaresPerWeek: 3,
          costPerSquare: founder.costPerDay ? founder.costPerDay / 2 : 960,
        },
      ],
      appliedAITools: [],
      tusExpended: 3.6,
    });

    workPlanStore.addWorkPlan({
      id: 'wp-demo-4',
      workspaceId: 'demo-workspace',
      title: 'Design Product Mockups v1',
      description: 'Create initial product design mockups for user testing',
      function: 'Engineering',
      linkedOKRTitle: 'Product Development Sprint 1',
      startDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'in-progress',
      progress: 0.25,
      assignedBy: founder.id,
      needsSubmission: false,
      estimatedTimeUnits: 8,
      allocations: [
        {
          memberId: founder.id,
          memberName: founder.name,
          squaresPerWeek: 2,
          costPerSquare: founder.costPerDay ? founder.costPerDay / 2 : 960,
        },
      ],
      appliedAITools: [],
      tusExpended: 2,
    });

    // Create one blocked task to show in Critical section
    workPlanStore.addWorkPlan({
      id: 'wp-demo-blocked',
      workspaceId: 'demo-workspace',
      title: 'Supplier Agreement Review',
      description: 'Blocked: Waiting on legal review of supplier contract terms',
      function: 'Ops',
      linkedOKRTitle: 'Supply Chain Setup',
      startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'blocked',
      progress: 0,
      assignedBy: founder.id,
      needsSubmission: false,
      estimatedTimeUnits: 4,
      allocations: [
        {
          memberId: founder.id,
          memberName: founder.name,
          squaresPerWeek: 4,
          costPerSquare: founder.costPerDay ? founder.costPerDay / 2 : 960,
        },
      ],
      appliedAITools: [],
      tusExpended: 0,
    });
  }

  console.log('✅ Demo data seeded successfully');
}

// Auto-seed on first load (check if already seeded)
export function autoSeedDemoDataIfNeeded() {
  const workPlanStore = useWorkPlanStore.getState();
  const existingPlans = workPlanStore.workPlans.filter((wp) =>
    wp.id.startsWith('wp-demo')
  );

  // Only seed if no demo plans exist
  if (existingPlans.length === 0) {
    console.log('🌱 Seeding demo data...');
    seedDemoData();
  }
}
