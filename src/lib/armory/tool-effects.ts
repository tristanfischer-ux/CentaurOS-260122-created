/**
 * AI Tool Effects Mapping
 * Maps AI tools to equipment slots and assigns effect tags
 */

import type { AIToolEffects, EquipmentSlot, EffectTag, GearRarity } from '@/types';

// Tool ID to effects mapping
export const TOOL_EFFECTS_MAP: Record<string, Omit<AIToolEffects, 'aiToolId'>> = {
  // ========== FINANCE ==========
  'ai-finance-1': { // Vic AI
    suggestedSlot: 'armor',
    effectTags: ['+Quality', '+Automation', '+RiskControl'],
    rarity: 'rare',
    category: 'finance',
  },
  'ai-finance-2': { // Digits AI
    suggestedSlot: 'weapon',
    effectTags: ['+Analysis', '+Automation', '+Speed'],
    rarity: 'rare',
    category: 'finance',
  },
  'ai-finance-3': { // Gemini Pro
    suggestedSlot: 'utility',
    effectTags: ['+Speed', '+Automation', '+Analysis'],
    rarity: 'common',
    category: 'finance',
  },

  // ========== SALES ==========
  'ai-sales-1': { // 11x Alice
    suggestedSlot: 'weapon',
    effectTags: ['+Revenue', '+Speed', '+Automation'],
    rarity: 'epic',
    category: 'sales',
  },
  'ai-sales-2': { // Gong AI
    suggestedSlot: 'armor',
    effectTags: ['+Quality', '+Analysis', '+Revenue'],
    rarity: 'rare',
    category: 'sales',
  },
  'ai-sales-3': { // Clay AI
    suggestedSlot: 'utility',
    effectTags: ['+Speed', '+Automation', '+Analysis'],
    rarity: 'rare',
    category: 'sales',
  },
  'ai-sales-4': { // ElevenLabs Voice AI
    suggestedSlot: 'support',
    effectTags: ['+Quality', '+Creative'],
    rarity: 'common',
    category: 'sales',
  },

  // ========== MARKETING ==========
  'ai-marketing-1': { // Jasper AI
    suggestedSlot: 'weapon',
    effectTags: ['+Creative', '+Speed', '+Revenue'],
    rarity: 'rare',
    category: 'marketing',
  },
  'ai-marketing-2': { // Copy.ai
    suggestedSlot: 'weapon',
    effectTags: ['+Creative', '+Speed', '+Automation'],
    rarity: 'rare',
    category: 'marketing',
  },
  'ai-marketing-3': { // Midjourney
    suggestedSlot: 'support',
    effectTags: ['+Creative', '+Quality'],
    rarity: 'epic',
    category: 'marketing',
  },
  'ai-marketing-4': { // DALL-E 3
    suggestedSlot: 'support',
    effectTags: ['+Creative', '+Speed'],
    rarity: 'rare',
    category: 'marketing',
  },
  'ai-marketing-5': { // Perplexity Pro
    suggestedSlot: 'utility',
    effectTags: ['+Analysis', '+Speed'],
    rarity: 'rare',
    category: 'marketing',
  },
  'ai-marketing-6': { // Runway Gen-2
    suggestedSlot: 'support',
    effectTags: ['+Creative', '+Quality'],
    rarity: 'epic',
    category: 'marketing',
  },

  // ========== OPS ==========
  'ai-ops-1': { // Hebbia AI
    suggestedSlot: 'armor',
    effectTags: ['+Quality', '+Analysis', '+RiskControl'],
    rarity: 'epic',
    category: 'operations',
  },
  'ai-ops-2': { // Zapier AI
    suggestedSlot: 'utility',
    effectTags: ['+Automation', '+Speed'],
    rarity: 'rare',
    category: 'operations',
  },
  'ai-ops-3': { // Harvey AI
    suggestedSlot: 'armor',
    effectTags: ['+RiskControl', '+Quality', '+Analysis'],
    rarity: 'epic',
    category: 'operations',
  },

  // ========== ENGINEERING ==========
  'ai-eng-1': { // GitHub Copilot
    suggestedSlot: 'weapon',
    effectTags: ['+Speed', '+Automation'],
    rarity: 'rare',
    category: 'engineering',
  },
  'ai-eng-2': { // Cursor AI
    suggestedSlot: 'weapon',
    effectTags: ['+Speed', '+Quality', '+Automation'],
    rarity: 'epic',
    category: 'engineering',
  },
  'ai-eng-3': { // Replit Ghostwriter
    suggestedSlot: 'weapon',
    effectTags: ['+Speed', '+Automation'],
    rarity: 'common',
    category: 'engineering',
  },
  'ai-eng-4': { // Tabnine
    suggestedSlot: 'armor',
    effectTags: ['+Quality', '+RiskControl'],
    rarity: 'rare',
    category: 'engineering',
  },

  // ========== ADMIN/PRODUCTIVITY ==========
  'ai-admin-1': { // ChatGPT Enterprise
    suggestedSlot: 'weapon',
    effectTags: ['+Speed', '+Quality', '+Analysis'],
    rarity: 'epic',
    category: 'productivity',
  },
  'ai-admin-2': { // Notion AI
    suggestedSlot: 'utility',
    effectTags: ['+Automation', '+Speed'],
    rarity: 'rare',
    category: 'productivity',
  },
  'ai-admin-3': { // Otter.ai
    suggestedSlot: 'support',
    effectTags: ['+Automation', '+Quality'],
    rarity: 'rare',
    category: 'productivity',
  },
  'ai-admin-4': { // Grammarly Business
    suggestedSlot: 'armor',
    effectTags: ['+Quality'],
    rarity: 'common',
    category: 'productivity',
  },

  // ========== DESIGN & MANUFACTURING ==========
  'ai-design-1': { // Autodesk Fusion AI
    suggestedSlot: 'weapon',
    effectTags: ['+Quality', '+Automation', '+Analysis'],
    rarity: 'epic',
    category: 'engineering',
  },
  'ai-design-2': { // Monolith AI
    suggestedSlot: 'armor',
    effectTags: ['+Quality', '+RiskControl', '+Analysis'],
    rarity: 'epic',
    category: 'engineering',
  },
  'ai-design-3': { // Diagram AI
    suggestedSlot: 'weapon',
    effectTags: ['+Speed', '+Automation', '+Quality'],
    rarity: 'rare',
    category: 'engineering',
  },
  'ai-design-4': { // Manufacturing GPT
    suggestedSlot: 'utility',
    effectTags: ['+Analysis', '+Speed', '+RiskControl'],
    rarity: 'rare',
    category: 'operations',
  },
  'ai-design-5': { // Spline AI
    suggestedSlot: 'support',
    effectTags: ['+Creative', '+Quality'],
    rarity: 'rare',
    category: 'design',
  },
  'ai-design-6': { // Quality AI Inspector
    suggestedSlot: 'armor',
    effectTags: ['+Quality', '+RiskControl', '+Automation'],
    rarity: 'epic',
    category: 'operations',
  },
};

// Get effects for a specific tool
export function getToolEffects(aiToolId: string): AIToolEffects | null {
  const effects = TOOL_EFFECTS_MAP[aiToolId];
  if (!effects) return null;

  return {
    aiToolId,
    ...effects,
  };
}

// Get suggested slot for a tool
export function getSuggestedSlot(aiToolId: string): EquipmentSlot | null {
  return TOOL_EFFECTS_MAP[aiToolId]?.suggestedSlot || null;
}

// Get rarity for cost-based rarity calculation
export function calculateRarityFromCost(costPerMonth: number): GearRarity {
  if (costPerMonth >= 400) return 'epic';
  if (costPerMonth >= 200) return 'rare';
  return 'common';
}

// Get all tools by slot
export function getToolsBySlot(slot: EquipmentSlot): string[] {
  return Object.entries(TOOL_EFFECTS_MAP)
    .filter(([_, effects]) => effects.suggestedSlot === slot)
    .map(([toolId]) => toolId);
}

// Get all tools by rarity
export function getToolsByRarity(rarity: GearRarity): string[] {
  return Object.entries(TOOL_EFFECTS_MAP)
    .filter(([_, effects]) => effects.rarity === rarity)
    .map(([toolId]) => toolId);
}
