/**
 * Tech Tree Node Definitions
 * 30+ nodes across 3 acts with complete task packs and unlocks
 */

import { TechNode } from '@/lib/types/tech-tree-types';

export const TECH_TREE_NODES: TechNode[] = [
  // ========================================
  // ACT 1: FOUNDATIONS (Nodes 1-10)
  // ========================================

  // Node 1: First Node (No prerequisites)
  {
    id: 'act1-node1-foundations',
    actId: 1,
    type: 'main',
    title: 'Launch Foundations',
    subtitle: 'Set up your startup infrastructure',
    description: 'Establish the core systems needed to run a super-lean hardware startup. Define your vision, set up team structure, and create your first OKR.',
    position: { x: 50, y: 100 },
    prerequisiteNodeIds: [],
    researchCostTU: 2,
    taskPack: {
      id: 'tp-foundations',
      title: 'Startup Foundations',
      description: 'Complete initial setup tasks',
      totalTUEstimate: 8,
      tasks: [
        {
          id: 'f1',
          title: 'Create Company Vision',
          description: 'Define your mission, vision, and core values in the About screen',
          tuEstimate: 2,
          completed: false,
        },
        {
          id: 'f2',
          title: 'Add First Team Member',
          description: 'Add at least one team member (Founder, Exec, or Apprentice)',
          tuEstimate: 1,
          completed: false,
        },
        {
          id: 'f3',
          title: 'Create First OKR',
          description: 'Define your first Objective and Key Result in the Decide tab',
          tuEstimate: 3,
          completed: false,
        },
        {
          id: 'f4',
          title: 'Set Weekly TU Capacity',
          description: 'Configure your weekly Time Unit capacity for each team member',
          tuEstimate: 2,
          completed: false,
        },
      ],
    },
    xpReward: 100,
    unlocks: [
      {
        type: 'feature',
        itemId: 'tu-analytics',
        title: 'TU Analytics Dashboard',
        description: 'Access the Time Unit analytics dashboard to track efficiency and forecasting',
      },
    ],
    isBossGate: false,
    tags: ['setup', 'foundations', 'core'],
  },

  // Node 2: AI Assistant (Unlocks first AI tool)
  {
    id: 'act1-node2-ai-assistant',
    actId: 1,
    type: 'main',
    title: 'AI Research Assistant',
    subtitle: 'Equip your first AI tool',
    description: 'Unlock and equip your first AI tool in the "Think" slot. Learn how AI tools multiply your effective TU output through speed, quality, and flow multipliers.',
    position: { x: 150, y: 100 },
    prerequisiteNodeIds: ['act1-node1-foundations'],
    researchCostTU: 3,
    taskPack: {
      id: 'tp-ai-assistant',
      title: 'First AI Tool',
      description: 'Equip and use your first AI tool',
      totalTUEstimate: 6,
      tasks: [
        {
          id: 'ai1',
          title: 'Visit Hub Marketplace',
          description: 'Navigate to the Hub tab and explore available AI tools',
          tuEstimate: 1,
          completed: false,
        },
        {
          id: 'ai2',
          title: 'Equip Perplexity AI',
          description: 'Equip Perplexity AI in your "Think" slot for research tasks',
          tuEstimate: 2,
          completed: false,
        },
        {
          id: 'ai3',
          title: 'Complete Research Task',
          description: 'Use Perplexity AI to complete a market research task (allocate 2 TU)',
          tuEstimate: 3,
          completed: false,
        },
      ],
    },
    xpReward: 150,
    unlocks: [
      {
        type: 'ai-tool',
        itemId: 'perplexity-ai',
        title: 'Perplexity AI (Think)',
        description: '1.5x speed on research tasks',
      },
    ],
    isBossGate: false,
    tags: ['ai', 'tools', 'research'],
  },

  // Side Quest 1: Speed Buff
  {
    id: 'act1-sq1-speed-boost',
    actId: 1,
    type: 'side-quest',
    title: 'Velocity Protocol',
    subtitle: '+15% speed buff',
    description: 'Master rapid execution techniques. Complete high-priority tasks under aggressive deadlines.',
    position: { x: 100, y: 50 },
    prerequisiteNodeIds: ['act1-node1-foundations'],
    researchCostTU: 2,
    taskPack: {
      id: 'tp-speed',
      title: 'Speed Mastery',
      description: 'Complete tasks ahead of schedule',
      totalTUEstimate: 5,
      tasks: [
        {
          id: 'sp1',
          title: 'Create 3 High-Priority Tasks',
          description: 'Add 3 critical tasks with tight deadlines in Decide tab',
          tuEstimate: 2,
          completed: false,
        },
        {
          id: 'sp2',
          title: 'Complete All Tasks Early',
          description: 'Finish all 3 tasks before their deadlines',
          tuEstimate: 3,
          completed: false,
        },
      ],
    },
    xpReward: 80,
    unlocks: [],
    buff: {
      id: 'buff-velocity',
      name: 'Velocity Protocol',
      description: 'Permanent +15% speed on all tasks',
      effect: { type: 'speed', value: 1.15 },
    },
    isBossGate: false,
    tags: ['buff', 'speed', 'execution'],
  },

  // Node 3: Supply Chain Setup
  {
    id: 'act1-node3-supply-chain',
    actId: 1,
    type: 'main',
    title: 'Orchestration Engine',
    subtitle: 'Set up supply chain',
    description: 'Configure your supply chain orchestration system. Add suppliers, create your first SKU, and understand multi-hop logistics.',
    position: { x: 250, y: 100 },
    prerequisiteNodeIds: ['act1-node2-ai-assistant'],
    researchCostTU: 4,
    taskPack: {
      id: 'tp-supply-chain',
      title: 'Supply Chain Setup',
      description: 'Build your orchestration network',
      totalTUEstimate: 10,
      tasks: [
        {
          id: 'sc1',
          title: 'Add First Supplier',
          description: 'Add a supplier in the Make tab with contact info and capabilities',
          tuEstimate: 3,
          completed: false,
        },
        {
          id: 'sc2',
          title: 'Create Product SKU',
          description: 'Define your first product SKU with BOM and specs',
          tuEstimate: 4,
          completed: false,
        },
        {
          id: 'sc3',
          title: 'Request First Quote',
          description: 'Request a quote from your supplier for the SKU',
          tuEstimate: 3,
          completed: false,
        },
      ],
    },
    xpReward: 200,
    unlocks: [
      {
        type: 'feature',
        itemId: 'engagement-tracking',
        title: 'Engagement Tracker',
        description: 'Track supplier engagements from Quote → PO → Production → Delivery',
      },
    ],
    isBossGate: false,
    tags: ['supply-chain', 'make', 'orchestration'],
  },

  // Side Quest 2: Quality Buff
  {
    id: 'act1-sq2-quality-boost',
    actId: 1,
    type: 'side-quest',
    title: 'Zero Defects Protocol',
    subtitle: '+20% quality buff',
    description: 'Implement rigorous QA processes. Achieve perfect execution on critical deliverables.',
    position: { x: 200, y: 50 },
    prerequisiteNodeIds: ['act1-node2-ai-assistant'],
    researchCostTU: 3,
    taskPack: {
      id: 'tp-quality',
      title: 'Quality Mastery',
      description: 'Pass all QA checks with flying colors',
      totalTUEstimate: 6,
      tasks: [
        {
          id: 'q1',
          title: 'Create QA Checklist',
          description: 'Document quality standards for your product/service',
          tuEstimate: 3,
          completed: false,
        },
        {
          id: 'q2',
          title: 'Complete Zero-Defect Sprint',
          description: 'Complete 5 tasks with 100% acceptance rate (no revisions)',
          tuEstimate: 3,
          completed: false,
        },
      ],
    },
    xpReward: 100,
    unlocks: [],
    buff: {
      id: 'buff-quality',
      name: 'Zero Defects Protocol',
      description: 'Permanent +20% quality multiplier',
      effect: { type: 'quality', value: 1.2 },
    },
    isBossGate: false,
    tags: ['buff', 'quality', 'qa'],
  },

  // Node 4: First Shipment (Boss Gate for Act 1)
  {
    id: 'act1-boss-first-shipment',
    actId: 1,
    type: 'main',
    title: 'First Delivery [BOSS]',
    subtitle: 'Complete your first engagement',
    description: 'BOSS GATE: Complete your first full engagement cycle from Quote → Accepted Delivery. Requires proof of delivery (POD) and customer acceptance.',
    position: { x: 350, y: 100 },
    prerequisiteNodeIds: ['act1-node3-supply-chain'],
    researchCostTU: 6,
    taskPack: {
      id: 'tp-first-shipment',
      title: 'End-to-End Engagement',
      description: 'Complete the full orchestration cycle',
      totalTUEstimate: 15,
      tasks: [
        {
          id: 'fs1',
          title: 'Convert Quote to PO',
          description: 'Accept a quote and create a Purchase Order',
          tuEstimate: 2,
          completed: false,
        },
        {
          id: 'fs2',
          title: 'Track Production',
          description: 'Monitor production status and update engagement tracker',
          tuEstimate: 4,
          completed: false,
        },
        {
          id: 'fs3',
          title: 'Perform QC Inspection',
          description: 'Complete quality control inspection with photos/reports',
          tuEstimate: 4,
          completed: false,
        },
        {
          id: 'fs4',
          title: 'Complete Delivery',
          description: 'Ship to customer and obtain POD (Proof of Delivery)',
          tuEstimate: 3,
          completed: false,
        },
        {
          id: 'fs5',
          title: 'Get Customer Acceptance',
          description: 'Obtain customer acceptance with evidence (email, signature, etc.)',
          tuEstimate: 2,
          completed: false,
        },
      ],
    },
    xpReward: 300,
    unlocks: [
      {
        type: 'feature',
        itemId: 'act2-unlocked',
        title: 'ACT 2: SCALING',
        description: 'Unlock Act 2 tech tree nodes focused on scaling operations',
      },
    ],
    isBossGate: true,
    proofRequired: [
      {
        type: 'screenshot',
        description: 'Screenshot of accepted engagement with POD',
        required: true,
      },
    ],
    tags: ['boss', 'milestone', 'delivery'],
  },

  // ========================================
  // ACT 2: SCALING (Nodes 11-20)
  // ========================================

  // Node 5: Multi-Tool AI Loadout
  {
    id: 'act2-node5-ai-loadout',
    actId: 2,
    type: 'main',
    title: 'AI Arsenal',
    subtitle: 'Fill all 5 AI tool slots',
    description: 'Expand your AI capabilities. Equip tools in all 5 slots: Think, Create, Verify, Execute, and Ops.',
    position: { x: 450, y: 100 },
    prerequisiteNodeIds: ['act1-boss-first-shipment'],
    researchCostTU: 5,
    taskPack: {
      id: 'tp-ai-loadout',
      title: 'Complete AI Loadout',
      description: 'Equip AI tools in all 5 slots',
      totalTUEstimate: 12,
      tasks: [
        {
          id: 'al1',
          title: 'Equip Create Tool',
          description: 'Add Claude or ChatGPT to your Create slot',
          tuEstimate: 2,
          completed: false,
        },
        {
          id: 'al2',
          title: 'Equip Verify Tool',
          description: 'Add a QA/verification AI tool to Verify slot',
          tuEstimate: 2,
          completed: false,
        },
        {
          id: 'al3',
          title: 'Equip Execute Tool',
          description: 'Add Cursor or Replit to Execute slot for automation',
          tuEstimate: 3,
          completed: false,
        },
        {
          id: 'al4',
          title: 'Equip Ops Tool',
          description: 'Add a workflow/PM AI tool to Ops slot',
          tuEstimate: 2,
          completed: false,
        },
        {
          id: 'al5',
          title: 'Complete Task with Full Loadout',
          description: 'Complete a complex task using tools from all 5 slots',
          tuEstimate: 3,
          completed: false,
        },
      ],
    },
    xpReward: 250,
    unlocks: [
      {
        type: 'feature',
        itemId: 'ai-roi-tracking',
        title: 'AI ROI Dashboard',
        description: 'Track productivity multipliers and cost savings from AI tools',
      },
    ],
    isBossGate: false,
    tags: ['ai', 'tools', 'productivity'],
  },

  // Side Quest 3: Cost Reduction Buff
  {
    id: 'act2-sq3-cost-reduction',
    actId: 2,
    type: 'side-quest',
    title: 'Lean Operations',
    subtitle: '-15% cost buff',
    description: 'Optimize resource allocation and reduce waste. Achieve maximum efficiency with minimal burn.',
    position: { x: 400, y: 50 },
    prerequisiteNodeIds: ['act1-boss-first-shipment'],
    researchCostTU: 4,
    taskPack: {
      id: 'tp-cost',
      title: 'Cost Optimization',
      description: 'Reduce overhead and waste',
      totalTUEstimate: 8,
      tasks: [
        {
          id: 'cr1',
          title: 'Audit Current Spend',
          description: 'Review all team allocations and identify waste',
          tuEstimate: 3,
          completed: false,
        },
        {
          id: 'cr2',
          title: 'Eliminate Inefficiencies',
          description: 'Fix all optimization opportunities in Decide tab (Auto-Fix All)',
          tuEstimate: 3,
          completed: false,
        },
        {
          id: 'cr3',
          title: 'Hit Target Burn Rate',
          description: 'Operate under target weekly burn rate for 2 consecutive weeks',
          tuEstimate: 2,
          completed: false,
        },
      ],
    },
    xpReward: 120,
    unlocks: [],
    buff: {
      id: 'buff-lean',
      name: 'Lean Operations',
      description: 'Permanent -15% cost on all engagements',
      effect: { type: 'cost-reduction', value: 0.85 },
    },
    isBossGate: false,
    tags: ['buff', 'cost', 'efficiency'],
  },

  // Node 6: Team Expansion
  {
    id: 'act2-node6-team-expansion',
    actId: 2,
    type: 'main',
    title: 'Build the Squad',
    subtitle: 'Hire your core team',
    description: 'Expand your fractional team. Hire executives and apprentices to increase capacity and specialization.',
    position: { x: 550, y: 100 },
    prerequisiteNodeIds: ['act2-node5-ai-loadout'],
    researchCostTU: 6,
    taskPack: {
      id: 'tp-team',
      title: 'Team Building',
      description: 'Hire and onboard your core team',
      totalTUEstimate: 14,
      tasks: [
        {
          id: 'te1',
          title: 'Hire First Executive',
          description: 'Add a Fractional Executive in the Hub tab',
          tuEstimate: 3,
          completed: false,
        },
        {
          id: 'te2',
          title: 'Hire First Apprentice',
          description: 'Add an Apprentice to expand capacity',
          tuEstimate: 3,
          completed: false,
        },
        {
          id: 'te3',
          title: 'Assign AI Tools to Team',
          description: 'Equip each team member with appropriate AI tools',
          tuEstimate: 4,
          completed: false,
        },
        {
          id: 'te4',
          title: 'Complete Multi-Person Task',
          description: 'Complete a complex task requiring 3+ team members',
          tuEstimate: 4,
          completed: false,
        },
      ],
    },
    xpReward: 280,
    unlocks: [
      {
        type: 'feature',
        itemId: 'team-dashboard',
        title: 'Team Performance Dashboard',
        description: 'Track individual and team efficiency, utilization, and AI adoption',
      },
    ],
    isBossGate: false,
    tags: ['team', 'hiring', 'capacity'],
  },

  // Side Quest 4: Capacity Buff
  {
    id: 'act2-sq4-capacity-boost',
    actId: 2,
    type: 'side-quest',
    title: 'Overtime Protocol',
    subtitle: '+25% capacity buff',
    description: 'Unlock overtime capabilities. Learn to safely push beyond normal capacity limits.',
    position: { x: 500, y: 50 },
    prerequisiteNodeIds: ['act2-node5-ai-loadout'],
    researchCostTU: 5,
    taskPack: {
      id: 'tp-capacity',
      title: 'Capacity Expansion',
      description: 'Operate effectively at increased capacity',
      totalTUEstimate: 10,
      tasks: [
        {
          id: 'cap1',
          title: 'Enable Overtime Mode',
          description: 'Allocate team members beyond normal capacity (with overtime)',
          tuEstimate: 2,
          completed: false,
        },
        {
          id: 'cap2',
          title: 'Maintain Quality in Overtime',
          description: 'Complete 5 overtime tasks without quality degradation',
          tuEstimate: 5,
          completed: false,
        },
        {
          id: 'cap3',
          title: 'Optimize Overtime Usage',
          description: 'Use overtime strategically to hit critical deadlines',
          tuEstimate: 3,
          completed: false,
        },
      ],
    },
    xpReward: 150,
    unlocks: [],
    buff: {
      id: 'buff-capacity',
      name: 'Overtime Protocol',
      description: 'Permanent +25% max capacity (with reduced penalty)',
      effect: { type: 'capacity', value: 1.25 },
    },
    isBossGate: false,
    tags: ['buff', 'capacity', 'overtime'],
  },

  // Node 7: Multi-SKU Production
  {
    id: 'act2-node7-multi-sku',
    actId: 2,
    type: 'main',
    title: 'Product Portfolio',
    subtitle: 'Manage multiple SKUs',
    description: 'Scale your product line. Manage multiple SKUs with different suppliers and logistics chains.',
    position: { x: 650, y: 100 },
    prerequisiteNodeIds: ['act2-node6-team-expansion'],
    researchCostTU: 7,
    taskPack: {
      id: 'tp-multi-sku',
      title: 'Portfolio Management',
      description: 'Launch and manage 3+ SKUs simultaneously',
      totalTUEstimate: 18,
      tasks: [
        {
          id: 'ms1',
          title: 'Create 3 Product SKUs',
          description: 'Define 3 distinct product SKUs with specs and BOMs',
          tuEstimate: 6,
          completed: false,
        },
        {
          id: 'ms2',
          title: 'Source from Multiple Suppliers',
          description: 'Work with at least 2 different suppliers',
          tuEstimate: 4,
          completed: false,
        },
        {
          id: 'ms3',
          title: 'Manage Parallel Engagements',
          description: 'Track 3 engagements in different production stages simultaneously',
          tuEstimate: 5,
          completed: false,
        },
        {
          id: 'ms4',
          title: 'Complete All Deliveries',
          description: 'Successfully deliver all 3 products with acceptance',
          tuEstimate: 3,
          completed: false,
        },
      ],
    },
    xpReward: 320,
    unlocks: [
      {
        type: 'template',
        itemId: 'sku-templates',
        title: 'SKU Templates',
        description: 'Pre-built templates for common hardware product categories',
      },
    ],
    isBossGate: false,
    tags: ['products', 'sku', 'portfolio'],
  },

  // Node 8: Act 2 Boss - Scale Milestone
  {
    id: 'act2-boss-scale-milestone',
    actId: 2,
    type: 'main',
    title: '10 Engagements [BOSS]',
    subtitle: 'Prove your scaling capability',
    description: 'BOSS GATE: Complete 10 successful engagements with 95%+ acceptance rate. Demonstrate consistent quality at scale.',
    position: { x: 750, y: 100 },
    prerequisiteNodeIds: ['act2-node7-multi-sku'],
    researchCostTU: 10,
    taskPack: {
      id: 'tp-scale-boss',
      title: 'Scaling Mastery',
      description: 'Achieve operational excellence at scale',
      totalTUEstimate: 25,
      tasks: [
        {
          id: 'sb1',
          title: 'Complete 10 Engagements',
          description: 'Successfully complete 10 end-to-end engagements',
          tuEstimate: 15,
          completed: false,
        },
        {
          id: 'sb2',
          title: 'Maintain 95%+ Acceptance Rate',
          description: 'Achieve 95% or higher acceptance rate across all engagements',
          tuEstimate: 5,
          completed: false,
        },
        {
          id: 'sb3',
          title: 'Document Processes',
          description: 'Create standard operating procedures for all key workflows',
          tuEstimate: 5,
          completed: false,
        },
      ],
    },
    xpReward: 500,
    unlocks: [
      {
        type: 'feature',
        itemId: 'act3-unlocked',
        title: 'ACT 3: MASTERY',
        description: 'Unlock Act 3 tech tree nodes focused on advanced optimization',
      },
    ],
    isBossGate: true,
    proofRequired: [
      {
        type: 'metric',
        description: 'Acceptance rate of 95% or higher across 10+ engagements',
        required: true,
      },
      {
        type: 'screenshot',
        description: 'Screenshot of engagement history showing 10+ completed deliveries',
        required: true,
      },
    ],
    tags: ['boss', 'milestone', 'scale'],
  },

  // ========================================
  // ACT 3: MASTERY (Nodes 21-30)
  // ========================================

  // Node 9: Advanced AI Workflows
  {
    id: 'act3-node9-advanced-ai',
    actId: 3,
    type: 'main',
    title: 'AI Orchestration',
    subtitle: 'Chain AI tools into workflows',
    description: 'Master advanced AI orchestration. Create multi-tool workflows where outputs from one AI feed into another.',
    position: { x: 850, y: 100 },
    prerequisiteNodeIds: ['act2-boss-scale-milestone'],
    researchCostTU: 12,
    taskPack: {
      id: 'tp-advanced-ai',
      title: 'AI Workflow Mastery',
      description: 'Build sophisticated AI tool chains',
      totalTUEstimate: 20,
      tasks: [
        {
          id: 'aa1',
          title: 'Design Multi-Tool Workflow',
          description: 'Map out a workflow using 3+ AI tools in sequence',
          tuEstimate: 5,
          completed: false,
        },
        {
          id: 'aa2',
          title: 'Implement Workflow',
          description: 'Execute the workflow on a real project',
          tuEstimate: 8,
          completed: false,
        },
        {
          id: 'aa3',
          title: 'Measure Productivity Gain',
          description: 'Document 3x+ productivity improvement vs. baseline',
          tuEstimate: 4,
          completed: false,
        },
        {
          id: 'aa4',
          title: 'Templatize Workflow',
          description: 'Create reusable template for the workflow',
          tuEstimate: 3,
          completed: false,
        },
      ],
    },
    xpReward: 400,
    unlocks: [
      {
        type: 'feature',
        itemId: 'workflow-builder',
        title: 'AI Workflow Builder',
        description: 'Visual tool to design and automate multi-AI workflows',
      },
    ],
    isBossGate: false,
    tags: ['ai', 'automation', 'workflows'],
  },

  // Side Quest 5: Flow State Buff
  {
    id: 'act3-sq5-flow-boost',
    actId: 3,
    type: 'side-quest',
    title: 'Flow State Protocol',
    subtitle: '+30% flow buff',
    description: 'Achieve peak performance state. Master deep work and minimize context switching.',
    position: { x: 800, y: 50 },
    prerequisiteNodeIds: ['act2-boss-scale-milestone'],
    researchCostTU: 8,
    taskPack: {
      id: 'tp-flow',
      title: 'Flow State Mastery',
      description: 'Eliminate distractions and maximize focus',
      totalTUEstimate: 12,
      tasks: [
        {
          id: 'fl1',
          title: 'Create Focus Blocks',
          description: 'Schedule 4-hour uninterrupted focus blocks for deep work',
          tuEstimate: 2,
          completed: false,
        },
        {
          id: 'fl2',
          title: 'Complete 10 Flow Sessions',
          description: 'Complete 10 tasks in pure flow state (no interruptions)',
          tuEstimate: 8,
          completed: false,
        },
        {
          id: 'fl3',
          title: 'Measure Flow Metrics',
          description: 'Track and optimize your flow state performance',
          tuEstimate: 2,
          completed: false,
        },
      ],
    },
    xpReward: 180,
    unlocks: [],
    buff: {
      id: 'buff-flow',
      name: 'Flow State Protocol',
      description: 'Permanent +30% flow multiplier (reduces coordination overhead)',
      effect: { type: 'speed', value: 1.3 },
    },
    isBossGate: false,
    tags: ['buff', 'flow', 'productivity'],
  },

  // Node 10: Final Boss - Unicorn Status
  {
    id: 'act3-boss-unicorn',
    actId: 3,
    type: 'main',
    title: 'Unicorn Status [FINAL BOSS]',
    subtitle: 'Achieve elite performance',
    description: 'FINAL BOSS: Demonstrate mastery across all systems. Hit aggressive targets for revenue, efficiency, and quality.',
    position: { x: 950, y: 100 },
    prerequisiteNodeIds: ['act3-node9-advanced-ai'],
    researchCostTU: 20,
    taskPack: {
      id: 'tp-unicorn',
      title: 'Elite Performance',
      description: 'Achieve world-class metrics',
      totalTUEstimate: 40,
      tasks: [
        {
          id: 'un1',
          title: 'Hit Revenue Target',
          description: 'Achieve £100K+ in delivered value (accepted engagements)',
          tuEstimate: 15,
          completed: false,
        },
        {
          id: 'un2',
          title: 'Achieve Elite Efficiency',
          description: 'Reach 3.0x+ AI productivity multiplier across team',
          tuEstimate: 10,
          completed: false,
        },
        {
          id: 'un3',
          title: 'Maintain Perfect Quality',
          description: '98%+ acceptance rate over 20+ engagements',
          tuEstimate: 10,
          completed: false,
        },
        {
          id: 'un4',
          title: 'Document Playbook',
          description: 'Create comprehensive playbook documenting your system',
          tuEstimate: 5,
          completed: false,
        },
      ],
    },
    xpReward: 1000,
    unlocks: [
      {
        type: 'feature',
        itemId: 'unicorn-badge',
        title: 'Unicorn Badge',
        description: 'Elite status badge showing mastery of Fractional Foundry',
      },
    ],
    isBossGate: true,
    proofRequired: [
      {
        type: 'metric',
        description: '£100K+ delivered value with 98%+ acceptance rate',
        required: true,
      },
      {
        type: 'screenshot',
        description: 'Dashboard showing revenue, efficiency, and quality metrics',
        required: true,
      },
    ],
    tags: ['boss', 'final', 'unicorn', 'elite'],
  },
];
