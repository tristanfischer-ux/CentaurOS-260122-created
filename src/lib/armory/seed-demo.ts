/**
 * Demo Seed Data for Armory
 * Creates starter loadouts and squads for demo accounts
 */

import { useArmoryStore } from '@/lib/state/armory-store';
import { ORGANIZATION_MEMBERS, AI_AGENTS } from '@/lib/organization-seed';

const DEFAULT_WORKSPACE_ID = 'workspace-demo-company';

/**
 * Seed demo loadouts and squads
 * Call this once during app initialization
 */
export async function seedArmoryDemo() {
  const armoryStore = useArmoryStore.getState();

  // Check if already seeded
  if (armoryStore.personLoadouts.length > 0 || armoryStore.squads.length > 0) {
    console.log('[Armory] Demo data already seeded, skipping');
    return;
  }

  console.log('[Armory] Seeding demo data...');

  // Initialize armory for all members
  await armoryStore.initializeArmory(DEFAULT_WORKSPACE_ID, ORGANIZATION_MEMBERS, AI_AGENTS);

  // ========== EQUIP FOUNDERS ==========
  const founderSarah = ORGANIZATION_MEMBERS.find((m) => m.name === 'Sarah Chen');
  if (founderSarah) {
    // Strategic tools for founder
    await armoryStore.setEquippedTool(founderSarah.id, 'weapon', 'ai-admin-1'); // ChatGPT Enterprise
    await armoryStore.setEquippedTool(founderSarah.id, 'armor', 'ai-ops-3'); // Harvey AI (legal/risk)
    await armoryStore.setEquippedTool(founderSarah.id, 'utility', 'ai-ops-1'); // Hebbia AI
    await armoryStore.setEquippedTool(founderSarah.id, 'support', 'ai-admin-3'); // Otter.ai
  }

  const founderMarcus = ORGANIZATION_MEMBERS.find((m) => m.name === 'Marcus Thompson');
  if (founderMarcus) {
    // Product/Engineering focus
    await armoryStore.setEquippedTool(founderMarcus.id, 'weapon', 'ai-design-1'); // Autodesk Fusion AI
    await armoryStore.setEquippedTool(founderMarcus.id, 'armor', 'ai-design-2'); // Monolith AI
    await armoryStore.setEquippedTool(founderMarcus.id, 'utility', 'ai-design-4'); // Manufacturing GPT
    await armoryStore.setEquippedTool(founderMarcus.id, 'support', 'ai-admin-2'); // Notion AI
  }

  // ========== EQUIP EXECUTIVES ==========
  // Finance Exec
  const execJordan = ORGANIZATION_MEMBERS.find((m) => m.name === 'Jordan Martinez');
  if (execJordan) {
    await armoryStore.setEquippedTool(execJordan.id, 'weapon', 'ai-finance-2'); // Digits AI
    await armoryStore.setEquippedTool(execJordan.id, 'armor', 'ai-finance-1'); // Vic AI
    await armoryStore.setEquippedTool(execJordan.id, 'utility', 'ai-finance-3'); // Gemini Pro
  }

  // Sales Exec
  const execEmma = ORGANIZATION_MEMBERS.find((m) => m.name === 'Emma Richardson');
  if (execEmma) {
    await armoryStore.setEquippedTool(execEmma.id, 'weapon', 'ai-sales-1'); // 11x Alice
    await armoryStore.setEquippedTool(execEmma.id, 'armor', 'ai-sales-2'); // Gong AI
    await armoryStore.setEquippedTool(execEmma.id, 'utility', 'ai-sales-3'); // Clay AI
  }

  // Engineering Exec
  const execDavid = ORGANIZATION_MEMBERS.find((m) => m.name === 'David Park');
  if (execDavid) {
    await armoryStore.setEquippedTool(execDavid.id, 'weapon', 'ai-eng-2'); // Cursor AI
    await armoryStore.setEquippedTool(execDavid.id, 'armor', 'ai-eng-4'); // Tabnine
    await armoryStore.setEquippedTool(execDavid.id, 'utility', 'ai-design-3'); // Diagram AI
  }

  // Marketing Exec
  const execSophie = ORGANIZATION_MEMBERS.find((m) => m.name === 'Sophie Adams');
  if (execSophie) {
    await armoryStore.setEquippedTool(execSophie.id, 'weapon', 'ai-marketing-1'); // Jasper AI
    await armoryStore.setEquippedTool(execSophie.id, 'armor', 'ai-marketing-5'); // Perplexity Pro
    await armoryStore.setEquippedTool(execSophie.id, 'support', 'ai-marketing-3'); // Midjourney
  }

  // ========== EQUIP APPRENTICES ==========
  // Finance Apprentices
  const apprenticeAlex = ORGANIZATION_MEMBERS.find((m) => m.name === 'Alex Rivera');
  if (apprenticeAlex) {
    await armoryStore.setEquippedTool(apprenticeAlex.id, 'weapon', 'ai-finance-3'); // Gemini Pro
    await armoryStore.setEquippedTool(apprenticeAlex.id, 'utility', 'ai-admin-2'); // Notion AI
  }

  const apprenticePriya = ORGANIZATION_MEMBERS.find((m) => m.name === 'Priya Sharma');
  if (apprenticePriya) {
    await armoryStore.setEquippedTool(apprenticePriya.id, 'weapon', 'ai-finance-1'); // Vic AI
    await armoryStore.setEquippedTool(apprenticePriya.id, 'utility', 'ai-ops-2'); // Zapier AI
  }

  // Sales Apprentices
  const apprenticeJames = ORGANIZATION_MEMBERS.find((m) => m.name === 'James Wilson');
  if (apprenticeJames) {
    await armoryStore.setEquippedTool(apprenticeJames.id, 'weapon', 'ai-sales-3'); // Clay AI
    await armoryStore.setEquippedTool(apprenticeJames.id, 'utility', 'ai-admin-1'); // ChatGPT
  }

  const apprenticeLily = ORGANIZATION_MEMBERS.find((m) => m.name === 'Lily Chen');
  if (apprenticeLily) {
    await armoryStore.setEquippedTool(apprenticeLily.id, 'weapon', 'ai-sales-3'); // Clay AI
    await armoryStore.setEquippedTool(apprenticeLily.id, 'support', 'ai-sales-4'); // ElevenLabs
  }

  // Engineering Apprentices
  const apprenticeOmar = ORGANIZATION_MEMBERS.find((m) => m.name === 'Omar Hassan');
  if (apprenticeOmar) {
    await armoryStore.setEquippedTool(apprenticeOmar.id, 'weapon', 'ai-eng-1'); // GitHub Copilot
    await armoryStore.setEquippedTool(apprenticeOmar.id, 'utility', 'ai-eng-3'); // Replit Ghostwriter
  }

  const apprenticeMaya = ORGANIZATION_MEMBERS.find((m) => m.name === 'Maya Patel');
  if (apprenticeMaya) {
    await armoryStore.setEquippedTool(apprenticeMaya.id, 'weapon', 'ai-design-3'); // Diagram AI
    await armoryStore.setEquippedTool(apprenticeMaya.id, 'utility', 'ai-eng-1'); // GitHub Copilot
  }

  // Marketing Apprentice
  const apprenticeLucas = ORGANIZATION_MEMBERS.find((m) => m.name === 'Lucas Silva');
  if (apprenticeLucas) {
    await armoryStore.setEquippedTool(apprenticeLucas.id, 'weapon', 'ai-marketing-2'); // Copy.ai
    await armoryStore.setEquippedTool(apprenticeLucas.id, 'support', 'ai-marketing-4'); // DALL-E 3
  }

  // ========== CREATE DEMO SQUADS ==========

  // Engineering Team Alpha
  if (execDavid && apprenticeOmar && apprenticeMaya) {
    await armoryStore.createSquad({
      workspaceId: DEFAULT_WORKSPACE_ID,
      name: 'Engineering Team Alpha',
      function: 'Engineering',
      leaderMemberId: execDavid.id,
      apprenticeMemberIds: [apprenticeOmar.id, apprenticeMaya.id],
    });
  }

  // Sales Strike Team
  if (execEmma && apprenticeJames && apprenticeLily) {
    await armoryStore.createSquad({
      workspaceId: DEFAULT_WORKSPACE_ID,
      name: 'Sales Strike Team',
      function: 'Sales',
      leaderMemberId: execEmma.id,
      apprenticeMemberIds: [apprenticeJames.id, apprenticeLily.id],
    });
  }

  // Finance Operations Squad
  if (execJordan && apprenticeAlex && apprenticePriya) {
    await armoryStore.createSquad({
      workspaceId: DEFAULT_WORKSPACE_ID,
      name: 'Finance Operations Squad',
      function: 'Finance',
      leaderMemberId: execJordan.id,
      apprenticeMemberIds: [apprenticeAlex.id, apprenticePriya.id],
    });
  }

  console.log('[Armory] Demo data seeded successfully!');
}
