/**
 * AI Tools System - Per-Person Upgrades
 *
 * AI tools are equipped PER PERSON (like Homeworld ship upgrades) and affect:
 * - Speed: how fast they complete tasks (TU multiplier)
 * - Quality: reduction in rework/defects
 * - Flow: reduction in blocked time
 *
 * NON-NEGOTIABLE: AI tools don't create time, they increase effective output per TU.
 */

// ============================================
// AI READINESS
// ============================================

export type AIReadinessLabel = 'AI Ready' | 'AI Assisted' | 'AI Cautious' | 'AI Avoidant';

export interface AIReadiness {
  score: number; // 0-100
  label: AIReadinessLabel;
  constraints: string[]; // e.g., "no client data in external tools"
  assessmentDate?: string;
  assessmentAnswers?: Record<string, string>; // Question ID -> Answer
}

export interface AIReadinessAssessment {
  questions: {
    id: string;
    text: string;
    options: { value: string; label: string; score: number }[];
  }[];
}

// Assessment questions (6 quick questions, 2 minutes)
export const AI_READINESS_ASSESSMENT: AIReadinessAssessment = {
  questions: [
    {
      id: 'experience',
      text: 'How often do you use AI tools in your work?',
      options: [
        { value: 'daily', label: 'Daily - AI is part of my workflow', score: 25 },
        { value: 'weekly', label: 'Weekly - I use AI regularly', score: 18 },
        { value: 'monthly', label: 'Monthly - I try AI occasionally', score: 10 },
        { value: 'never', label: 'Never - I haven\'t used AI tools', score: 0 },
      ],
    },
    {
      id: 'comfort',
      text: 'How comfortable are you with AI assisting your work?',
      options: [
        { value: 'very', label: 'Very comfortable - I trust AI outputs', score: 20 },
        { value: 'comfortable', label: 'Comfortable - with verification', score: 15 },
        { value: 'cautious', label: 'Cautious - I need to check everything', score: 8 },
        { value: 'uncomfortable', label: 'Uncomfortable - prefer manual work', score: 0 },
      ],
    },
    {
      id: 'data-sensitivity',
      text: 'Do you work with sensitive or regulated data?',
      options: [
        { value: 'no', label: 'No - public/internal data only', score: 20 },
        { value: 'some', label: 'Some - need to be selective', score: 12 },
        { value: 'yes-regulated', label: 'Yes - heavily regulated (GDPR/HIPAA)', score: 5 },
        { value: 'yes-confidential', label: 'Yes - highly confidential', score: 0 },
      ],
    },
    {
      id: 'learn',
      text: 'How quickly do you adopt new software tools?',
      options: [
        { value: 'early', label: 'Early adopter - I love trying new tools', score: 15 },
        { value: 'quick', label: 'Quick learner - I adapt fast', score: 12 },
        { value: 'gradual', label: 'Gradual - I need time to adjust', score: 6 },
        { value: 'slow', label: 'Slow - I prefer familiar tools', score: 0 },
      ],
    },
    {
      id: 'verification',
      text: 'How do you verify AI-generated outputs?',
      options: [
        { value: 'systematic', label: 'I have a systematic process', score: 10 },
        { value: 'spot-check', label: 'I spot-check key points', score: 8 },
        { value: 'trust', label: 'I mostly trust the output', score: 4 },
        { value: 'unsure', label: 'I\'m unsure how to verify', score: 0 },
      ],
    },
    {
      id: 'collaboration',
      text: 'Do you collaborate with AI-assisted colleagues?',
      options: [
        { value: 'yes-actively', label: 'Yes - we share best practices', score: 10 },
        { value: 'yes-sometimes', label: 'Yes - occasionally', score: 7 },
        { value: 'no-alone', label: 'No - I work independently', score: 3 },
        { value: 'no-none', label: 'No - no one uses AI here', score: 0 },
      ],
    },
  ],
};

export function calculateAIReadiness(answers: Record<string, string>): AIReadiness {
  let totalScore = 0;
  const constraints: string[] = [];

  AI_READINESS_ASSESSMENT.questions.forEach((q) => {
    const answer = answers[q.id];
    const option = q.options.find((o) => o.value === answer);
    if (option) {
      totalScore += option.score;
    }
  });

  // Add constraints based on answers
  if (answers['data-sensitivity'] === 'yes-regulated') {
    constraints.push('No client data in external tools');
    constraints.push('GDPR/HIPAA compliant tools only');
  } else if (answers['data-sensitivity'] === 'yes-confidential') {
    constraints.push('No confidential data in external tools');
    constraints.push('Approved tools list only');
  } else if (answers['data-sensitivity'] === 'some') {
    constraints.push('Review data sharing policies per tool');
  }

  if (answers['verification'] === 'unsure') {
    constraints.push('Requires verification training');
  }

  // Determine label
  let label: AIReadinessLabel;
  if (totalScore >= 75) {
    label = 'AI Ready';
  } else if (totalScore >= 50) {
    label = 'AI Assisted';
  } else if (totalScore >= 25) {
    label = 'AI Cautious';
  } else {
    label = 'AI Avoidant';
  }

  return {
    score: totalScore,
    label,
    constraints,
    assessmentDate: new Date().toISOString(),
    assessmentAnswers: answers,
  };
}

// ============================================
// AI TOOLS
// ============================================

export type LoadoutSlot = 'Think' | 'Create' | 'Verify' | 'Execute' | 'Ops';
export type TaskType = 'research' | 'design' | 'writing' | 'coding' | 'qa' | 'project-management' | 'data-analysis' | 'communication';
export type RiskTier = 'green' | 'amber' | 'red';

export interface ToolEffect {
  taskType: TaskType;
  speedMult: number; // e.g., 1.5 = 50% faster (completes in 67% of time)
  qualityMult: number; // e.g., 0.9 = 10% less rework, 1.1 = 10% more rework
  flowMultDelta: number; // e.g., -0.1 = 10% less blocked time
}

export interface AITool {
  id: string;
  name: string;
  description: string;
  vendor: string;
  slot: LoadoutSlot;
  pricePerSeatPerMonth: number; // £ per person per month
  setupTU: number; // One-time onboarding cost in TUs
  riskTier: RiskTier;
  minReadinessScore: number; // Minimum AI readiness score to use effectively
  effects: ToolEffect[];
  tags: string[];
  icon?: string;
}

export interface ToolAssignment {
  personId: string;
  toolId: string;
  active: boolean;
  startDate: string;
  setupComplete: boolean;
  setupTUSpent?: number;
}

export interface PersonLoadout {
  personId: string;
  slots: Record<LoadoutSlot, string | null>; // slot -> toolId or null
  assignments: ToolAssignment[];
}

// ============================================
// PRODUCTIVITY MODEL
// ============================================

/**
 * Calculate effective TU output for a person on a task type
 *
 * Formula: EffectiveTU = TU_allocated × speedMult × qualityMult × flowMult
 *
 * - speedMult: How fast they work (from AI tools)
 * - qualityMult: Rework reduction (or penalty)
 * - flowMult: Blocked time reduction
 */
export function calculateEffectiveTU(
  tuAllocated: number,
  taskType: TaskType,
  loadout: PersonLoadout,
  allTools: AITool[]
): {
  effectiveTU: number;
  speedMult: number;
  qualityMult: number;
  flowMult: number;
  breakdown: string[];
} {
  let speedMult = 1.0;
  let qualityMult = 1.0;
  let flowMult = 1.0;
  const breakdown: string[] = [];

  // Apply effects from all active tools in loadout
  loadout.assignments.filter(a => a.active && a.setupComplete).forEach(assignment => {
    const tool = allTools.find(t => t.id === assignment.toolId);
    if (!tool) return;

    tool.effects.filter(e => e.taskType === taskType).forEach(effect => {
      speedMult *= effect.speedMult;
      qualityMult *= effect.qualityMult;
      flowMult += effect.flowMultDelta;

      breakdown.push(
        `${tool.name}: ${(effect.speedMult * 100).toFixed(0)}% speed, ` +
        `${(effect.qualityMult * 100).toFixed(0)}% quality`
      );
    });
  });

  // Cap flow mult at reasonable bounds
  flowMult = Math.max(0.5, Math.min(1.5, flowMult));

  const effectiveTU = tuAllocated * speedMult * qualityMult * flowMult;

  return {
    effectiveTU: Math.round(effectiveTU * 10) / 10,
    speedMult,
    qualityMult,
    flowMult,
    breakdown,
  };
}

/**
 * Calculate adjusted required TU for a task with AI boost
 */
export function calculateAdjustedRequiredTU(
  baseRequiredTU: number,
  taskType: TaskType,
  assignedPeople: PersonLoadout[],
  allTools: AITool[]
): {
  adjustedTU: number;
  aiDeltaTU: number;
  avgEfficiency: number;
} {
  if (assignedPeople.length === 0) {
    return { adjustedTU: baseRequiredTU, aiDeltaTU: 0, avgEfficiency: 1.0 };
  }

  // Calculate average efficiency across assigned people
  let totalEfficiency = 0;
  assignedPeople.forEach(loadout => {
    const { speedMult } = calculateEffectiveTU(1, taskType, loadout, allTools);
    totalEfficiency += speedMult;
  });

  const avgEfficiency = totalEfficiency / assignedPeople.length;
  const adjustedTU = baseRequiredTU / avgEfficiency;
  const aiDeltaTU = baseRequiredTU - adjustedTU;

  return {
    adjustedTU: Math.round(adjustedTU * 10) / 10,
    aiDeltaTU: Math.round(aiDeltaTU * 10) / 10,
    avgEfficiency: Math.round(avgEfficiency * 100) / 100,
  };
}

// ============================================
// RECOMMENDED LOADOUTS
// ============================================

export function recommendStarterLoadout(readiness: AIReadiness, allTools: AITool[]): string[] {
  const toolIds: string[] = [];

  // Filter tools by readiness score and risk tolerance
  const suitableTools = allTools.filter(tool => {
    if (tool.minReadinessScore > readiness.score) return false;
    if (readiness.label === 'AI Avoidant' && tool.riskTier !== 'green') return false;
    if (readiness.label === 'AI Cautious' && tool.riskTier === 'red') return false;
    return true;
  });

  // Pick best tool for each slot (lowest cost, highest effect)
  const slots: LoadoutSlot[] = ['Think', 'Create', 'Verify', 'Execute', 'Ops'];

  slots.forEach(slot => {
    const slotTools = suitableTools.filter(t => t.slot === slot);
    if (slotTools.length === 0) return;

    // Sort by: setupTU (prefer low setup), then price, then total effect strength
    const best = slotTools.sort((a, b) => {
      const scoreA = a.setupTU * 10 + a.pricePerSeatPerMonth;
      const scoreB = b.setupTU * 10 + b.pricePerSeatPerMonth;
      return scoreA - scoreB;
    })[0];

    toolIds.push(best.id);
  });

  return toolIds;
}

// ============================================
// SEED DATA - AI TOOLS
// ============================================

export const AI_TOOLS_CATALOG: AITool[] = [
  // THINK SLOT (Research)
  {
    id: 'perplexity-pro',
    name: 'Perplexity Pro',
    description: 'AI-powered research assistant with real-time sources',
    vendor: 'Perplexity AI',
    slot: 'Think',
    pricePerSeatPerMonth: 20,
    setupTU: 0.5,
    riskTier: 'green',
    minReadinessScore: 40,
    effects: [
      { taskType: 'research', speedMult: 1.8, qualityMult: 1.0, flowMultDelta: -0.1 },
      { taskType: 'data-analysis', speedMult: 1.4, qualityMult: 1.0, flowMultDelta: 0 },
    ],
    tags: ['research', 'sources', 'web'],
  },
  {
    id: 'claude-sonnet',
    name: 'Claude Sonnet',
    description: 'Deep analysis and reasoning with 200K context',
    vendor: 'Anthropic',
    slot: 'Think',
    pricePerSeatPerMonth: 20,
    setupTU: 1.0,
    riskTier: 'amber',
    minReadinessScore: 50,
    effects: [
      { taskType: 'research', speedMult: 1.6, qualityMult: 1.1, flowMultDelta: -0.05 },
      { taskType: 'writing', speedMult: 1.5, qualityMult: 1.05, flowMultDelta: 0 },
      { taskType: 'data-analysis', speedMult: 1.5, qualityMult: 1.1, flowMultDelta: 0 },
    ],
    tags: ['reasoning', 'analysis', 'writing'],
  },

  // CREATE SLOT (Draft/Design)
  {
    id: 'cursor-pro',
    name: 'Cursor Pro',
    description: 'AI-first code editor with autocomplete and chat',
    vendor: 'Cursor',
    slot: 'Create',
    pricePerSeatPerMonth: 20,
    setupTU: 2.0,
    riskTier: 'green',
    minReadinessScore: 60,
    effects: [
      { taskType: 'coding', speedMult: 2.2, qualityMult: 0.95, flowMultDelta: -0.15 },
      { taskType: 'design', speedMult: 1.3, qualityMult: 1.0, flowMultDelta: 0 },
    ],
    tags: ['coding', 'autocomplete', 'refactor'],
  },
  {
    id: 'midjourney',
    name: 'Midjourney',
    description: 'AI image generation for concepts and mockups',
    vendor: 'Midjourney',
    slot: 'Create',
    pricePerSeatPerMonth: 30,
    setupTU: 1.5,
    riskTier: 'green',
    minReadinessScore: 30,
    effects: [
      { taskType: 'design', speedMult: 3.0, qualityMult: 0.9, flowMultDelta: -0.2 },
    ],
    tags: ['images', 'mockups', 'concepts'],
  },
  {
    id: 'notion-ai',
    name: 'Notion AI',
    description: 'Integrated writing assistant in Notion workspace',
    vendor: 'Notion',
    slot: 'Create',
    pricePerSeatPerMonth: 10,
    setupTU: 0.25,
    riskTier: 'green',
    minReadinessScore: 20,
    effects: [
      { taskType: 'writing', speedMult: 1.6, qualityMult: 0.95, flowMultDelta: -0.05 },
      { taskType: 'project-management', speedMult: 1.2, qualityMult: 1.0, flowMultDelta: 0 },
    ],
    tags: ['writing', 'docs', 'notes'],
  },

  // VERIFY SLOT (QA)
  {
    id: 'grammarly-pro',
    name: 'Grammarly Pro',
    description: 'Writing QA with tone, clarity, and correctness',
    vendor: 'Grammarly',
    slot: 'Verify',
    pricePerSeatPerMonth: 12,
    setupTU: 0.25,
    riskTier: 'green',
    minReadinessScore: 10,
    effects: [
      { taskType: 'writing', speedMult: 1.1, qualityMult: 1.15, flowMultDelta: 0 },
      { taskType: 'communication', speedMult: 1.05, qualityMult: 1.1, flowMultDelta: 0 },
    ],
    tags: ['grammar', 'qa', 'clarity'],
  },
  {
    id: 'sonarqube',
    name: 'SonarQube Cloud',
    description: 'Code quality and security scanner',
    vendor: 'SonarSource',
    slot: 'Verify',
    pricePerSeatPerMonth: 10,
    setupTU: 2.0,
    riskTier: 'green',
    minReadinessScore: 50,
    effects: [
      { taskType: 'coding', speedMult: 1.0, qualityMult: 1.25, flowMultDelta: 0 },
      { taskType: 'qa', speedMult: 1.4, qualityMult: 1.15, flowMultDelta: -0.1 },
    ],
    tags: ['code-quality', 'security', 'bugs'],
  },

  // EXECUTE SLOT (Code/Automation)
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    description: 'AI pair programmer with inline suggestions',
    vendor: 'GitHub',
    slot: 'Execute',
    pricePerSeatPerMonth: 10,
    setupTU: 1.0,
    riskTier: 'green',
    minReadinessScore: 40,
    effects: [
      { taskType: 'coding', speedMult: 1.8, qualityMult: 0.95, flowMultDelta: -0.1 },
    ],
    tags: ['coding', 'autocomplete', 'github'],
  },
  {
    id: 'zapier-ai',
    name: 'Zapier AI',
    description: 'Workflow automation with natural language',
    vendor: 'Zapier',
    slot: 'Execute',
    pricePerSeatPerMonth: 20,
    setupTU: 1.5,
    riskTier: 'amber',
    minReadinessScore: 40,
    effects: [
      { taskType: 'project-management', speedMult: 1.5, qualityMult: 1.0, flowMultDelta: -0.15 },
      { taskType: 'data-analysis', speedMult: 1.3, qualityMult: 1.0, flowMultDelta: 0 },
    ],
    tags: ['automation', 'integration', 'workflows'],
  },

  // OPS SLOT (Workflow/PM)
  {
    id: 'linear-ai',
    name: 'Linear AI',
    description: 'Project management with AI-powered triage and updates',
    vendor: 'Linear',
    slot: 'Ops',
    pricePerSeatPerMonth: 8,
    setupTU: 1.0,
    riskTier: 'green',
    minReadinessScore: 30,
    effects: [
      { taskType: 'project-management', speedMult: 1.5, qualityMult: 1.05, flowMultDelta: -0.1 },
      { taskType: 'communication', speedMult: 1.2, qualityMult: 1.0, flowMultDelta: 0 },
    ],
    tags: ['project-management', 'issues', 'roadmap'],
  },
  {
    id: 'mem-ai',
    name: 'Mem AI',
    description: 'Self-organizing notes with automatic connections',
    vendor: 'Mem',
    slot: 'Ops',
    pricePerSeatPerMonth: 15,
    setupTU: 0.5,
    riskTier: 'green',
    minReadinessScore: 40,
    effects: [
      { taskType: 'research', speedMult: 1.3, qualityMult: 1.0, flowMultDelta: -0.05 },
      { taskType: 'project-management', speedMult: 1.25, qualityMult: 1.0, flowMultDelta: 0 },
    ],
    tags: ['notes', 'knowledge', 'search'],
  },
  {
    id: 'reclaim-ai',
    name: 'Reclaim AI',
    description: 'Smart calendar that defends focus time and schedules tasks',
    vendor: 'Reclaim',
    slot: 'Ops',
    pricePerSeatPerMonth: 10,
    setupTU: 0.5,
    riskTier: 'green',
    minReadinessScore: 20,
    effects: [
      { taskType: 'project-management', speedMult: 1.2, qualityMult: 1.0, flowMultDelta: -0.15 },
      { taskType: 'communication', speedMult: 1.1, qualityMult: 1.0, flowMultDelta: -0.1 },
    ],
    tags: ['calendar', 'focus', 'scheduling'],
  },
];

// Helper to get tool by ID
export function getToolById(toolId: string): AITool | undefined {
  return AI_TOOLS_CATALOG.find(t => t.id === toolId);
}

// Helper to get tools for a slot
export function getToolsForSlot(slot: LoadoutSlot): AITool[] {
  return AI_TOOLS_CATALOG.filter(t => t.slot === slot);
}

// Calculate monthly cost for a loadout
export function calculateLoadoutCost(loadout: PersonLoadout): number {
  let totalCost = 0;
  loadout.assignments.filter(a => a.active).forEach(assignment => {
    const tool = getToolById(assignment.toolId);
    if (tool) {
      totalCost += tool.pricePerSeatPerMonth;
    }
  });
  return totalCost;
}
