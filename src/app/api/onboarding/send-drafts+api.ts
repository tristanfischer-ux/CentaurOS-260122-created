/**
 * Onboarding API - Send Drafts to WHAT
 * Creates task drafts and objectives from onboarding outputs
 */

import type { SendDraftsToWhatRequest, OnboardingTaskDraft } from '@/lib/onboarding/types';

export async function POST(request: Request): Promise<Response> {
  try {
    const body: SendDraftsToWhatRequest = await request.json();
    const { company_id, step_state_id, objectives, task_drafts, user_id } = body;

    if (!company_id || !step_state_id || !user_id) {
      return Response.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const createdObjectives: string[] = [];
    const createdTaskDrafts: string[] = [];
    const now = new Date().toISOString();

    // Create objectives (in a real implementation, this would insert to Supabase)
    for (const obj of objectives || []) {
      const objectiveId = `objective-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      createdObjectives.push(objectiveId);

      console.log('[Onboarding] Created objective:', {
        id: objectiveId,
        title: obj.title,
        category: obj.category,
        company_id,
        step_state_id,
      });
    }

    // Create task drafts (pending confirmation)
    for (const draft of task_drafts || []) {
      const draftId = `draft-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      const taskDraft: Partial<OnboardingTaskDraft> = {
        id: draftId,
        company_id,
        title: draft.title,
        notes: draft.notes,
        units: draft.units || 1,
        assignee_hint: draft.assignee_hint || 'founder',
        source_type: 'onboarding',
        status: 'pending',
        confidence_score: 80,
        created_at: now,
        created_by: user_id,
      };

      // Calculate due date if offset provided
      if (draft.due_offset_days) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + draft.due_offset_days);
        taskDraft.due_iso = dueDate.toISOString().split('T')[0];
      }

      createdTaskDrafts.push(draftId);

      console.log('[Onboarding] Created task draft:', {
        id: draftId,
        title: draft.title,
        units: draft.units,
        assignee_hint: draft.assignee_hint,
        due_iso: taskDraft.due_iso,
        company_id,
        step_state_id,
      });
    }

    return Response.json({
      success: true,
      data: {
        objectives_created: createdObjectives.length,
        objective_ids: createdObjectives,
        task_drafts_created: createdTaskDrafts.length,
        task_draft_ids: createdTaskDrafts,
        message: `Created ${createdObjectives.length} objectives and ${createdTaskDrafts.length} task drafts. Review them in WHAT tab.`,
      },
    });
  } catch (error) {
    console.error('[Onboarding Send Drafts] Error:', error);
    return Response.json(
      { success: false, error: 'Failed to send drafts' },
      { status: 500 }
    );
  }
}
