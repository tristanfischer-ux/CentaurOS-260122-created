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
    await armoryStore.addAITool(founderSarah.id, 'ai-admin-1'); // ChatGPT Enterprise
    await armoryStore.addAITool(founderSarah.id, 'ai-ops-3'); // Harvey AI (legal/risk)
    await armoryStore.addAITool(founderSarah.id, 'ai-ops-1'); // Hebbia AI
    await armoryStore.addAITool(founderSarah.id, 'ai-admin-3'); // Otter.ai
  }

  const founderMarcus = ORGANIZATION_MEMBERS.find((m) => m.name === 'Marcus Thompson');
  if (founderMarcus) {
    // Product/Engineering focus
    await armoryStore.addAITool(founderMarcus.id, 'ai-design-1'); // Autodesk Fusion AI
    await armoryStore.addAITool(founderMarcus.id, 'ai-design-2'); // Monolith AI
    await armoryStore.addAITool(founderMarcus.id, 'ai-design-4'); // Manufacturing GPT
    await armoryStore.addAITool(founderMarcus.id, 'ai-admin-2'); // Notion AI
  }

  // ========== EQUIP EXECUTIVES ==========
  // Finance Exec
  const execJordan = ORGANIZATION_MEMBERS.find((m) => m.name === 'Jordan Martinez');
  if (execJordan) {
    await armoryStore.addAITool(execJordan.id, 'ai-finance-2'); // Digits AI
    await armoryStore.addAITool(execJordan.id, 'ai-finance-1'); // Vic AI
    await armoryStore.addAITool(execJordan.id, 'ai-finance-3'); // Gemini Pro
  }

  // Sales Exec
  const execEmma = ORGANIZATION_MEMBERS.find((m) => m.name === 'Emma Richardson');
  if (execEmma) {
    await armoryStore.addAITool(execEmma.id, 'ai-sales-1'); // 11x Alice
    await armoryStore.addAITool(execEmma.id, 'ai-sales-2'); // Gong AI
    await armoryStore.addAITool(execEmma.id, 'ai-sales-3'); // Clay AI
  }

  // Engineering Exec
  const execDavid = ORGANIZATION_MEMBERS.find((m) => m.name === 'David Park');
  if (execDavid) {
    await armoryStore.addAITool(execDavid.id, 'ai-eng-2'); // Cursor AI
    await armoryStore.addAITool(execDavid.id, 'ai-eng-4'); // Tabnine
    await armoryStore.addAITool(execDavid.id, 'ai-design-3'); // Diagram AI
  }

  // Marketing Exec
  const execSophie = ORGANIZATION_MEMBERS.find((m) => m.name === 'Sophie Adams');
  if (execSophie) {
    await armoryStore.addAITool(execSophie.id, 'ai-marketing-1'); // Jasper AI
    await armoryStore.addAITool(execSophie.id, 'ai-marketing-5'); // Perplexity Pro
    await armoryStore.addAITool(execSophie.id, 'ai-marketing-3'); // Midjourney
  }

  // ========== EQUIP APPRENTICES ==========
  // Finance Apprentices
  const apprenticeAlex = ORGANIZATION_MEMBERS.find((m) => m.name === 'Alex Rivera');
  if (apprenticeAlex) {
    await armoryStore.addAITool(apprenticeAlex.id, 'ai-finance-3'); // Gemini Pro
    await armoryStore.addAITool(apprenticeAlex.id, 'ai-admin-2'); // Notion AI
  }

  const apprenticePriya = ORGANIZATION_MEMBERS.find((m) => m.name === 'Priya Sharma');
  if (apprenticePriya) {
    await armoryStore.addAITool(apprenticePriya.id, 'ai-finance-1'); // Vic AI
    await armoryStore.addAITool(apprenticePriya.id, 'ai-ops-2'); // Zapier AI
  }

  // Sales Apprentices
  const apprenticeJames = ORGANIZATION_MEMBERS.find((m) => m.name === 'James Wilson');
  if (apprenticeJames) {
    await armoryStore.addAITool(apprenticeJames.id, 'ai-sales-3'); // Clay AI
    await armoryStore.addAITool(apprenticeJames.id, 'ai-admin-1'); // ChatGPT
  }

  const apprenticeLily = ORGANIZATION_MEMBERS.find((m) => m.name === 'Lily Chen');
  if (apprenticeLily) {
    await armoryStore.addAITool(apprenticeLily.id, 'ai-sales-3'); // Clay AI
    await armoryStore.addAITool(apprenticeLily.id, 'ai-sales-4'); // ElevenLabs
  }

  // Engineering Apprentices
  const apprenticeOmar = ORGANIZATION_MEMBERS.find((m) => m.name === 'Omar Hassan');
  if (apprenticeOmar) {
    await armoryStore.addAITool(apprenticeOmar.id, 'ai-eng-1'); // GitHub Copilot
    await armoryStore.addAITool(apprenticeOmar.id, 'ai-eng-3'); // Replit Ghostwriter
  }

  const apprenticeMaya = ORGANIZATION_MEMBERS.find((m) => m.name === 'Maya Patel');
  if (apprenticeMaya) {
    await armoryStore.addAITool(apprenticeMaya.id, 'ai-design-3'); // Diagram AI
    await armoryStore.addAITool(apprenticeMaya.id, 'ai-eng-1'); // GitHub Copilot
  }

  // Marketing Apprentice
  const apprenticeLucas = ORGANIZATION_MEMBERS.find((m) => m.name === 'Lucas Silva');
  if (apprenticeLucas) {
    await armoryStore.addAITool(apprenticeLucas.id, 'ai-marketing-2'); // Copy.ai
    await armoryStore.addAITool(apprenticeLucas.id, 'ai-marketing-4'); // DALL-E 3
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
