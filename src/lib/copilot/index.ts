// AI Copilot service for Centaur OS
// Supports stub mode (deterministic) and API mode (future)

import type { CopilotMessage, ProposedAction, Task, Workspace, DashboardStats } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { taskApi } from '../api/operations';

export type CopilotMode = 'stub' | 'api';

interface CopilotContext {
  workspaceId: string;
  userId: string;
  role: string;
  dashboardStats?: DashboardStats;
}

// Copilot Provider Interface
export interface CopilotProvider {
  generate(prompt: string, context: CopilotContext): Promise<string>;
  proposeActions(intent: string, context: CopilotContext): Promise<ProposedAction[]>;
}

// Stub Provider (deterministic, no API key needed)
class StubCopilotProvider implements CopilotProvider {
  async generate(prompt: string, context: CopilotContext): Promise<string> {
    const lowerPrompt = prompt.toLowerCase();

    // State of business summary
    if (
      lowerPrompt.includes('state') ||
      lowerPrompt.includes('status') ||
      lowerPrompt.includes('summary')
    ) {
      return this.generateBusinessStateSummary(context);
    }

    // Next actions
    if (lowerPrompt.includes('next') || lowerPrompt.includes('action') || lowerPrompt.includes('should')) {
      return this.generateNextActions(context);
    }

    // Weekly pack draft
    if (lowerPrompt.includes('weekly') || lowerPrompt.includes('pack')) {
      return this.generateWeeklyPackNarrative(context);
    }

    // Risk analysis
    if (lowerPrompt.includes('risk') || lowerPrompt.includes('blocker')) {
      return this.generateRiskAnalysis(context);
    }

    // Generic response
    return `I'm Centaur OS Copilot (stub mode). I can help you with:
- Summarizing the state of your business
- Proposing top 5 next actions
- Drafting weekly pack narratives
- Identifying risks and blockers

Try asking: "What's the state of the business?" or "What should I focus on next?"`;
  }

  async proposeActions(intent: string, context: CopilotContext): Promise<ProposedAction[]> {
    const actions: ProposedAction[] = [];

    if (intent === 'next_actions') {
      // Role-specific action proposals
      if (context.role === 'Founder') {
        actions.push(
          {
            id: uuidv4(),
            type: 'create_task',
            description: 'Schedule investor update call',
            payload: {
              title: 'Investor update - Q1 progress',
              priority: 'high',
              function: 'Admin',
            },
            status: 'pending',
          },
          {
            id: uuidv4(),
            type: 'create_task',
            description: 'Review sales pipeline and forecast',
            payload: {
              title: 'Review sales pipeline for Q2',
              priority: 'high',
              function: 'Sales',
            },
            status: 'pending',
          }
        );
      } else if (context.role === 'Apprentice') {
        actions.push(
          {
            id: uuidv4(),
            type: 'create_task',
            description: 'Complete pending code review',
            payload: {
              title: 'Review PR #42 - Authentication refactor',
              priority: 'medium',
              function: 'Engineering',
            },
            status: 'pending',
          }
        );
      } else if (context.role === 'FractionalExec') {
        actions.push(
          {
            id: uuidv4(),
            type: 'create_task',
            description: 'Prepare monthly financial report',
            payload: {
              title: 'Monthly financial report - March',
              priority: 'high',
              function: 'Finance',
            },
            status: 'pending',
          }
        );
      }
    }

    return actions;
  }

  private generateBusinessStateSummary(context: CopilotContext): string {
    return `## Business State Summary

**Overall Health**: 🟡 At Risk

**Key Metrics**:
- Active Objectives: 2
- Key Results on Track: 2/4 (50%)
- Tasks Completed This Week: 3
- Pending Reviews: 1

**Highlights**:
✅ User signup is tracking well (47% of target)
⚠️ MRR growth needs attention (25% of target)
⚠️ Weekly Active Users slightly behind

**What's Working**:
- Core feature development is progressing
- Sales pipeline building momentum

**Areas of Concern**:
- Revenue conversion rate lower than expected
- Need to accelerate customer acquisition

**Recommended Focus**:
1. Prioritize sales calls and demos
2. Analyze user activation funnel
3. Consider pricing adjustments`;
  }

  private generateNextActions(context: CopilotContext): string {
    const roleActions: Record<string, string> = {
      Founder: `## Top 5 Next Actions (Founder)

1. **Close 2 sales deals this week** - You have 5 demo calls scheduled, aim to convert 40%
2. **Review and approve marketing budget** - Finance team needs approval by EOD Friday
3. **Update board on Q1 progress** - Prepare deck with KR status and risks
4. **Resolve pricing strategy** - Current MRR is 25% of target, may need adjustment
5. **1:1 with apprentice** - Check in on MVP progress and remove blockers`,

      Apprentice: `## Top 5 Next Actions (Apprentice)

1. **Complete dashboard UI components** - Due in 3 days, currently in progress
2. **Set up analytics tracking** - Required for measuring user engagement
3. **Address code review feedback** - Authentication PR has 3 comments
4. **Write unit tests for new features** - Test coverage below 80%
5. **Document API endpoints** - Help sales team understand integration options`,

      FractionalExec: `## Top 5 Next Actions (Fractional Exec)

1. **Review pending task approvals** - 1 task awaiting review
2. **Update runway projection** - Current burn rate suggests 12mo runway
3. **Approve vendor invoices** - 3 invoices pending ($4,200 total)
4. **Prepare Q1 board report** - Financial summary and forecast needed
5. **Review pricing model** - MRR target gap suggests pricing issue`,
    };

    return roleActions[context.role] || roleActions['Founder'];
  }

  private generateWeeklyPackNarrative(context: CopilotContext): string {
    return `## Weekly Pack Narrative

**Week of ${new Date().toLocaleDateString()} - ${context.role} View**

### 🎯 Objectives Progress
We're tracking 2 active objectives with mixed progress:
- **Launch MVP to 100 Beta Users**: 47% complete, on track
- **Achieve $50K MRR**: 25% complete, at risk

### ✅ What We Shipped This Week
- Implemented user authentication with magic links
- Completed 3 core tasks across engineering and sales
- Created prospecting list with 50 qualified leads

### 🚧 What's In Progress
- Dashboard UI components (Engineering)
- Sales outreach campaign - Batch 1 of 50 (Sales)
- Financial runway update (Finance)

### ⚠️ Risks & Blockers
- Revenue conversion lower than expected - may need pricing adjustment
- Weekly active users trending behind target
- Need to accelerate demo-to-close rate

### 🎬 Next Week Priorities
1. Close 2 deals from current pipeline
2. Launch MVP to next 20 beta users
3. Complete dashboard components
4. Finalize Q1 financial report

### 💡 Decisions Needed
- Approve marketing budget allocation
- Decide on pricing model adjustments
- Prioritize engineering resources: analytics vs new features`;
  }

  private generateRiskAnalysis(context: CopilotContext): string {
    return `## Risk Analysis

**🔴 High Priority Risks**:
1. **Revenue Conversion Rate** - Only 25% of MRR target achieved
   - Impact: May miss Q1 revenue goals
   - Action: Review pricing, increase demo conversion focus

2. **WAU Trending Behind** - 28/60 weekly active users
   - Impact: May indicate activation/engagement issues
   - Action: Analyze user journey, identify drop-off points

**🟡 Medium Priority Risks**:
3. **Engineering Velocity** - Dashboard components delayed by 2 days
   - Impact: May delay beta launch
   - Action: Remove blockers, consider scope reduction

4. **Pending Review Backlog** - 1 task awaiting fractional exec review
   - Impact: Blocks apprentice progress
   - Action: Schedule daily review time slot

**🟢 Low Priority**:
5. **Documentation Gaps** - API docs incomplete
   - Impact: Minor - only affects future integrations
   - Action: Add to next sprint backlog

**Recommended Actions**:
- Focus leadership attention on revenue conversion
- Schedule emergency pricing strategy session
- Allocate 30min daily for review queue`;
  }
}

// API Provider (placeholder for future implementation)
class APICopilotProvider implements CopilotProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generate(prompt: string, context: CopilotContext): Promise<string> {
    // TODO: Implement actual API call to LLM provider
    // For now, fall back to stub
    console.warn('API mode not yet implemented, using stub mode');
    const stub = new StubCopilotProvider();
    return stub.generate(prompt, context);
  }

  async proposeActions(intent: string, context: CopilotContext): Promise<ProposedAction[]> {
    // TODO: Implement actual API call
    console.warn('API mode not yet implemented, using stub mode');
    const stub = new StubCopilotProvider();
    return stub.proposeActions(intent, context);
  }
}

// Factory function to get the appropriate provider
export function getCopilotProvider(mode: CopilotMode = 'stub', apiKey?: string): CopilotProvider {
  if (mode === 'api' && apiKey) {
    return new APICopilotProvider(apiKey);
  }
  return new StubCopilotProvider();
}

// Main Copilot Service
export class CopilotService {
  private provider: CopilotProvider;
  private context: CopilotContext;
  private conversationHistory: CopilotMessage[] = [];

  constructor(context: CopilotContext, mode: CopilotMode = 'stub') {
    this.context = context;
    this.provider = getCopilotProvider(mode);
  }

  async sendMessage(userMessage: string): Promise<CopilotMessage> {
    // Add user message to history
    const userMsg: CopilotMessage = {
      id: uuidv4(),
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    this.conversationHistory.push(userMsg);

    // Generate response
    const responseContent = await this.provider.generate(userMessage, this.context);

    // Check if we should propose actions
    let proposedActions: ProposedAction[] | undefined;
    if (
      userMessage.toLowerCase().includes('next') ||
      userMessage.toLowerCase().includes('create') ||
      userMessage.toLowerCase().includes('suggest')
    ) {
      proposedActions = await this.provider.proposeActions('next_actions', this.context);
    }

    // Add assistant message to history
    const assistantMsg: CopilotMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: responseContent,
      timestamp: new Date().toISOString(),
      proposedActions,
    };
    this.conversationHistory.push(assistantMsg);

    return assistantMsg;
  }

  async approveAction(
    actionId: string,
    workspaceId: string,
    actorId: string,
    actorRole: any
  ): Promise<Task | null> {
    // Find the action in conversation history
    let action: ProposedAction | null = null;
    for (const msg of this.conversationHistory) {
      if (msg.proposedActions) {
        const found = msg.proposedActions.find((a) => a.id === actionId);
        if (found) {
          action = found;
          break;
        }
      }
    }

    if (!action) return null;

    // Execute the action based on type
    if (action.type === 'create_task') {
      const task = await taskApi.create(
        {
          workspaceId,
          title: action.payload.title,
          priority: action.payload.priority,
          function: action.payload.function,
          assigneeId: actorId,
        },
        actorId,
        actorRole
      );

      // Mark action as approved
      action.status = 'approved';

      return task;
    }

    return null;
  }

  getConversationHistory(): CopilotMessage[] {
    return this.conversationHistory;
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }
}
