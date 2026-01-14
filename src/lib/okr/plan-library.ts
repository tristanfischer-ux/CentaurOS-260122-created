/**
 * Plan Library - 8 Strategic Archetypes
 * Pre-built resource allocation patterns for common scenarios
 */

import type { PlanPreset } from './planner-types';

export const PLAN_ARCHETYPES: PlanPreset[] = [
  {
    id: 'speed-run',
    name: 'Speed Run',
    description: 'All hands on deck - maximum parallelization to ship fast',
    archetype: 'Speed Run',
    defaultAllocations: {
      apprenticeCount: 3,
      execCount: 2,
      founderInvolved: true,
      allocationPct: 100,
    },
    defaultToolTags: [
      {
        role: 'Apprentice',
        tags: ['weapon', 'automation'],
      },
    ],
    intendedFor: {
      functions: ['Marketing', 'Sales', 'Engineering'],
      urgencyRange: [5000, 999999],
    },
    notes: 'Maximum speed but highest coordination overhead. Use when cost of delay is extreme.',
    risks: ['Coordination overhead >40%', 'Rework risk increases with team size'],
    mitigationTips: ['Add verification tools', 'Daily standups', 'Clear work streams'],
  },
  {
    id: 'lean-baseline',
    name: 'Lean Baseline',
    description: 'Single apprentice, minimal coordination, lowest cost',
    archetype: 'Lean Baseline',
    defaultAllocations: {
      apprenticeCount: 1,
      execCount: 0,
      founderInvolved: false,
      allocationPct: 100,
    },
    defaultToolTags: [
      {
        role: 'Apprentice',
        tags: ['weapon'],
      },
    ],
    intendedFor: {
      functions: ['Marketing', 'Sales', 'Admin', 'Ops'],
      urgencyRange: [0, 3000],
    },
    notes: 'Slowest but cheapest. Good for low-urgency work or tight budgets.',
    risks: ['Long delivery time', 'Single point of failure'],
    mitigationTips: ['Equip automation tools', 'Clear documentation', 'Regular check-ins'],
  },
  {
    id: 'expert-burst',
    name: 'Expert Burst',
    description: 'Fractional executive + apprentice factory - quality at speed',
    archetype: 'Expert Burst',
    defaultAllocations: {
      apprenticeCount: 3,
      execCount: 1,
      founderInvolved: false,
      allocationPct: 75,
    },
    defaultToolTags: [
      {
        role: 'FractionalExec',
        tags: ['verification', 'quality'],
      },
    ],
    intendedFor: {
      functions: ['Engineering', 'Finance', 'Ops'],
      urgencyRange: [3000, 10000],
    },
    notes: 'Exec reviews apprentice output. Balances speed and quality.',
    risks: ['Exec becomes bottleneck', 'Review queue backup'],
    mitigationTips: ['Add verification tools', 'Async reviews', 'Clear approval criteria'],
  },
  {
    id: 'two-track',
    name: 'Two-Track',
    description: 'Discovery + Delivery in parallel - de-risk while building',
    archetype: 'Two-Track',
    defaultAllocations: {
      apprenticeCount: 2,
      execCount: 1,
      founderInvolved: true,
      allocationPct: 50,
    },
    defaultToolTags: [
      {
        role: 'Founder',
        tags: ['analysis', 'reporting'],
      },
    ],
    intendedFor: {
      functions: ['Engineering', 'Ops', 'Finance'],
      urgencyRange: [2000, 8000],
    },
    notes: 'Founder/exec explores options while apprentices execute. Reduces rework.',
    risks: ['Split attention', 'Communication gaps'],
    mitigationTips: ['Weekly sync', 'Shared decision log', 'Clear handoffs'],
  },
  {
    id: 'manufacturing-loop',
    name: 'Manufacturing Loop Accelerator',
    description: 'Tight iteration cycles with supplier coordination',
    archetype: 'Manufacturing Loop',
    defaultAllocations: {
      apprenticeCount: 2,
      execCount: 1,
      founderInvolved: false,
      allocationPct: 100,
    },
    defaultToolTags: [
      {
        role: 'Apprentice',
        tags: ['automation', 'reporting'],
      },
    ],
    intendedFor: {
      functions: ['Ops', 'Engineering'],
      urgencyRange: [3000, 12000],
    },
    notes: 'Optimized for supplier-heavy work. Exec manages supplier relationships.',
    risks: ['Supplier delays cascade', 'Lead time dominates'],
    mitigationTips: ['Buffer time for delays', 'Backup suppliers', 'Clear specs upfront'],
  },
  {
    id: 'quality-shield',
    name: 'Quality Shield',
    description: 'Verification-first approach - zero rework tolerance',
    archetype: 'Quality Shield',
    defaultAllocations: {
      apprenticeCount: 2,
      execCount: 2,
      founderInvolved: false,
      allocationPct: 100,
    },
    defaultToolTags: [
      {
        role: 'FractionalExec',
        tags: ['verification', 'quality', 'testing'],
      },
    ],
    intendedFor: {
      functions: ['Engineering', 'Finance'],
      urgencyRange: [2000, 8000],
    },
    notes: 'Two execs review all work. Highest quality, slowest speed.',
    risks: ['Very high cost', 'Review bottlenecks'],
    mitigationTips: ['Automate quality checks', 'Parallel reviews', 'Clear quality criteria'],
  },
  {
    id: 'revenue-strike',
    name: 'Revenue Strike Team',
    description: 'Sales blitz - founder + exec + apprentices all selling',
    archetype: 'Revenue Strike',
    defaultAllocations: {
      apprenticeCount: 2,
      execCount: 1,
      founderInvolved: true,
      allocationPct: 100,
    },
    defaultToolTags: [
      {
        role: 'Founder',
        tags: ['sales', 'outreach'],
      },
    ],
    intendedFor: {
      functions: ['Sales', 'Marketing'],
      urgencyRange: [5000, 999999],
    },
    notes: 'Everyone sells. Maximum customer engagement. Use for fundraising or launch.',
    risks: ['Founder bandwidth', 'Inconsistent messaging'],
    mitigationTips: ['Sales playbook', 'Daily huddles', 'CRM discipline'],
  },
  {
    id: 'overhead-reset',
    name: 'Overhead Reset',
    description: 'Reduce coordination chaos - split into focused streams',
    archetype: 'Overhead Reset',
    defaultAllocations: {
      apprenticeCount: 2,
      execCount: 1,
      founderInvolved: false,
      allocationPct: 100,
    },
    defaultToolTags: [
      {
        role: 'FractionalExec',
        tags: ['reporting', 'summarizer'],
      },
    ],
    intendedFor: {
      functions: ['Marketing', 'Ops', 'Admin'],
      urgencyRange: [1000, 5000],
    },
    notes: 'When overhead is killing you. Smaller teams, clearer ownership.',
    risks: ['Slower than Speed Run', 'Requires clear work split'],
    mitigationTips: ['Define clear boundaries', 'Weekly syncs only', 'Minimize dependencies'],
  },
];

/**
 * Get presets filtered by criteria
 */
export function getPresetsForCriteria(
  func: string,
  costOfDelay: number,
  runway?: number
): PlanPreset[] {
  return PLAN_ARCHETYPES.filter(preset => {
    // Function match
    if (!preset.intendedFor.functions.includes(func as any)) return false;

    // Urgency range
    const [minCoD, maxCoD] = preset.intendedFor.urgencyRange;
    if (costOfDelay < minCoD || costOfDelay > maxCoD) return false;

    // Runway range (optional)
    if (runway && preset.intendedFor.runwayRange) {
      const [minRunway, maxRunway] = preset.intendedFor.runwayRange;
      if (runway < minRunway || runway > maxRunway) return false;
    }

    return true;
  });
}

/**
 * Get preset by ID
 */
export function getPresetById(id: string): PlanPreset | undefined {
  return PLAN_ARCHETYPES.find(p => p.id === id);
}
