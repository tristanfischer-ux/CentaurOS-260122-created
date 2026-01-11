// Seed data for Centaur OS demo workspace

import {
  userApi,
  workspaceApi,
  membershipApi,
  objectiveApi,
  keyResultApi,
} from './index';
import { projectApi, taskApi, templateApi } from './operations';
import type { User, Workspace } from '@/types';

export async function seedDemoData() {
  console.log('🌱 Seeding demo data...');

  try {
    // 1. Create users
    const founder = await userApi.create({
      email: 'founder@fractional.com',
      name: 'Sarah Chen',
      avatarUrl: 'https://i.pravatar.cc/150?img=5',
    });

    const apprentice = await userApi.create({
      email: 'apprentice@fractional.com',
      name: 'Alex Rivera',
      avatarUrl: 'https://i.pravatar.cc/150?img=12',
    });

    const fractionalExec = await userApi.create({
      email: 'exec@fractional.com',
      name: 'Jordan Martinez',
      avatarUrl: 'https://i.pravatar.cc/150?img=33',
    });

    console.log('✅ Created users');

    // 2. Create workspace
    const workspace = await workspaceApi.create({
      name: 'Fractional Foundry',
      ownerId: founder.id,
    });

    console.log('✅ Created workspace');

    // 3. Add memberships (founder membership already created)
    await membershipApi.create({
      workspaceId: workspace.id,
      userId: apprentice.id,
      role: 'Apprentice',
      function: 'Engineering',
    });

    await membershipApi.create({
      workspaceId: workspace.id,
      userId: fractionalExec.id,
      role: 'FractionalExec',
      function: 'Finance',
    });

    console.log('✅ Created memberships');

    // 4. Create objectives
    const objective1 = await objectiveApi.create(
      {
        workspaceId: workspace.id,
        title: 'Launch MVP to 100 Beta Users',
        description: 'Get product-market fit with early adopters',
        ownerId: founder.id,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
      },
      founder.id,
      'Founder'
    );

    const objective2 = await objectiveApi.create(
      {
        workspaceId: workspace.id,
        title: 'Achieve $50K MRR',
        description: 'Generate sustainable revenue',
        ownerId: founder.id,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 180 days
      },
      founder.id,
      'Founder'
    );

    console.log('✅ Created objectives');

    // 5. Create key results
    await keyResultApi.create(
      {
        objectiveId: objective1.id,
        title: 'Signed-up beta users',
        targetValue: 100,
        currentValue: 47,
        unit: 'users',
        ownerId: founder.id,
      },
      founder.id,
      'Founder'
    );

    await keyResultApi.create(
      {
        objectiveId: objective1.id,
        title: 'Weekly active users (WAU)',
        targetValue: 60,
        currentValue: 28,
        unit: 'users',
        ownerId: apprentice.id,
      },
      founder.id,
      'Founder'
    );

    await keyResultApi.create(
      {
        objectiveId: objective2.id,
        title: 'Monthly Recurring Revenue',
        targetValue: 50000,
        currentValue: 12500,
        unit: '$',
        ownerId: fractionalExec.id,
      },
      founder.id,
      'Founder'
    );

    await keyResultApi.create(
      {
        objectiveId: objective2.id,
        title: 'Paying customers',
        targetValue: 25,
        currentValue: 5,
        unit: 'customers',
        ownerId: founder.id,
      },
      founder.id,
      'Founder'
    );

    console.log('✅ Created key results');

    // 6. Create projects
    const project1 = await projectApi.create(
      {
        workspaceId: workspace.id,
        objectiveId: objective1.id,
        title: 'Build MVP Core Features',
        description: 'Essential features for beta launch',
        ownerId: apprentice.id,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      founder.id,
      'Founder'
    );

    const project2 = await projectApi.create(
      {
        workspaceId: workspace.id,
        objectiveId: objective2.id,
        title: 'Sales Outreach Campaign',
        description: 'Target 50 prospects per week',
        ownerId: founder.id,
        dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      },
      founder.id,
      'Founder'
    );

    await projectApi.update(project1.id, { status: 'active' }, founder.id, 'Founder');
    await projectApi.update(project2.id, { status: 'active' }, founder.id, 'Founder');

    console.log('✅ Created projects');

    // 7. Create tasks
    const tasks = [
      // Engineering tasks
      {
        workspaceId: workspace.id,
        projectId: project1.id,
        title: 'Implement user authentication',
        description: 'Magic link login flow',
        assigneeId: apprentice.id,
        status: 'done' as const,
        priority: 'high' as const,
        function: 'Engineering' as const,
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        workspaceId: workspace.id,
        projectId: project1.id,
        title: 'Build dashboard UI components',
        description: 'Home dashboard with KPIs',
        assigneeId: apprentice.id,
        status: 'in_progress' as const,
        priority: 'high' as const,
        function: 'Engineering' as const,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        workspaceId: workspace.id,
        projectId: project1.id,
        title: 'Set up analytics tracking',
        description: 'Track user events',
        assigneeId: apprentice.id,
        status: 'todo' as const,
        priority: 'medium' as const,
        function: 'Engineering' as const,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      // Sales tasks
      {
        workspaceId: workspace.id,
        projectId: project2.id,
        title: 'Create prospecting list (50 leads)',
        description: 'Target SaaS founders in YC network',
        assigneeId: founder.id,
        status: 'done' as const,
        priority: 'high' as const,
        function: 'Sales' as const,
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        workspaceId: workspace.id,
        projectId: project2.id,
        title: 'Send personalized outreach emails',
        description: 'Batch 1 of 50',
        assigneeId: founder.id,
        status: 'in_progress' as const,
        priority: 'urgent' as const,
        function: 'Sales' as const,
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        workspaceId: workspace.id,
        projectId: project2.id,
        title: 'Book 5 demo calls',
        assigneeId: founder.id,
        status: 'todo' as const,
        priority: 'high' as const,
        function: 'Sales' as const,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      // Finance tasks
      {
        workspaceId: workspace.id,
        title: 'Update runway projection',
        description: 'Calculate burn rate and extend forecast',
        assigneeId: fractionalExec.id,
        status: 'in_review' as const,
        priority: 'medium' as const,
        function: 'Finance' as const,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        workspaceId: workspace.id,
        title: 'Review Q1 financial statements',
        assigneeId: fractionalExec.id,
        status: 'todo' as const,
        priority: 'low' as const,
        function: 'Finance' as const,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    for (const taskData of tasks) {
      await taskApi.create(taskData, founder.id, 'Founder');
    }

    console.log('✅ Created tasks');

    // 8. Create system templates
    const templates = [
      {
        title: 'Runway Update',
        description: 'Monthly cash flow and runway analysis',
        function: 'Finance' as const,
        taskTemplate: {
          title: 'Monthly Runway Update',
          description: '1. Update cash balance\n2. Calculate burn rate\n3. Project runway\n4. Flag risks',
          priority: 'high' as const,
          estimatedDays: 2,
        },
        isSystem: true,
      },
      {
        title: 'Invoice Run',
        description: 'Process monthly customer invoices',
        function: 'Finance' as const,
        taskTemplate: {
          title: 'Run Monthly Invoices',
          description: '1. Generate invoices\n2. Send to customers\n3. Update accounting',
          priority: 'urgent' as const,
          estimatedDays: 1,
        },
        isSystem: true,
      },
      {
        title: 'Campaign Brief',
        description: 'Marketing campaign planning template',
        function: 'Marketing' as const,
        taskTemplate: {
          title: 'New Marketing Campaign',
          description: '1. Define goals\n2. Identify audience\n3. Create content\n4. Set budget',
          priority: 'medium' as const,
          estimatedDays: 5,
        },
        isSystem: true,
      },
      {
        title: 'Prospecting Sprint',
        description: 'Weekly sales prospecting routine',
        function: 'Sales' as const,
        taskTemplate: {
          title: 'Weekly Prospecting (50 leads)',
          description: '1. Research 50 leads\n2. Personalize outreach\n3. Send emails\n4. Log in CRM',
          priority: 'high' as const,
          estimatedDays: 3,
        },
        isSystem: true,
      },
      {
        title: 'Quote Request',
        description: 'Vendor or supplier quote request',
        function: 'Ops' as const,
        taskTemplate: {
          title: 'Request Quote from Vendor',
          description: '1. Define requirements\n2. Research vendors\n3. Request quotes\n4. Compare',
          priority: 'medium' as const,
          estimatedDays: 3,
        },
        isSystem: true,
      },
      {
        title: 'QC Checklist',
        description: 'Quality control inspection',
        function: 'Ops' as const,
        taskTemplate: {
          title: 'Quality Control Check',
          description: '1. Review spec\n2. Inspect deliverable\n3. Document issues\n4. Sign off',
          priority: 'high' as const,
          estimatedDays: 1,
        },
        isSystem: true,
      },
      {
        title: 'Prototype Plan',
        description: 'Technical prototype planning',
        function: 'Engineering' as const,
        taskTemplate: {
          title: 'Build Technical Prototype',
          description: '1. Define scope\n2. Research tech stack\n3. Build POC\n4. Demo',
          priority: 'medium' as const,
          estimatedDays: 7,
        },
        isSystem: true,
      },
      {
        title: 'Test Report',
        description: 'QA test execution and reporting',
        function: 'Engineering' as const,
        taskTemplate: {
          title: 'QA Test Report',
          description: '1. Execute test cases\n2. Log bugs\n3. Document results\n4. Report',
          priority: 'high' as const,
          estimatedDays: 2,
        },
        isSystem: true,
      },
    ];

    for (const templateData of templates) {
      await templateApi.create(templateData, founder.id);
    }

    console.log('✅ Created templates');

    console.log('🎉 Demo data seeded successfully!');
    console.log('📧 Founder: founder@fractional.com');
    console.log('📧 Apprentice: apprentice@fractional.com');
    console.log('📧 FractionalExec: exec@fractional.com');

    return {
      users: { founder, apprentice, fractionalExec },
      workspace,
    };
  } catch (error) {
    console.error('❌ Failed to seed demo data:', error);
    throw error;
  }
}
