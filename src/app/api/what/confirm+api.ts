/**
 * WHAT Flow - Confirm Drafts API
 * POST /api/what/confirm
 *
 * Confirms drafts → creates tasks → schedules allocations
 * Idempotent: won't create duplicate tasks for same draft
 */

import { supabase } from '@/lib/supabase';
import {
  scheduleConfirmedTasks,
  validateTask,
  type TaskToSchedule,
  type UserCapacityRecord,
  type TaskAllocation,
} from '@/lib/scheduling/scheduler';
import { whatWhyConfig } from '@/lib/what-why-config';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { draftIds, workspaceId, userId } = body;

    if (!draftIds || !Array.isArray(draftIds) || !workspaceId || !userId) {
      return Response.json(
        { error: 'Missing or invalid draftIds, workspaceId, or userId' },
        { status: 400 }
      );
    }

    // Fetch drafts
    const { data: drafts, error: draftsError } = await supabase
      .from('task_drafts')
      .select('*')
      .in('id', draftIds)
      .eq('workspace_id', workspaceId)
      .eq('status', 'pending_confirmation');

    if (draftsError) throw draftsError;

    if (!drafts || drafts.length === 0) {
      return Response.json(
        { error: 'No pending drafts found with provided IDs' },
        { status: 404 }
      );
    }

    const createdTasks = [];
    const tasksToSchedule: TaskToSchedule[] = [];
    const errors = [];

    // Create tasks from drafts (idempotent check)
    for (const draft of drafts) {
      // Check if task already exists for this draft
      const { data: existingTask } = await supabase
        .from('tasks')
        .select('id')
        .eq('draft_id', draft.id)
        .single();

      if (existingTask) {
        console.log(`Task already exists for draft ${draft.id}, skipping`);
        createdTasks.push(existingTask);
        continue;
      }

      // Validate before creating
      const taskToValidate: TaskToSchedule = {
        id: draft.id,
        assignee_user_id: draft.assignee_user_id || draft.created_by_user_id,
        units: draft.units,
        start_iso: draft.start_iso,
        due_iso: draft.due_iso,
      };

      const validation = validateTask(taskToValidate);
      if (!validation.valid) {
        errors.push({ draftId: draft.id, errors: validation.errors });
        continue;
      }

      // Create task
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .insert({
          workspace_id: workspaceId,
          created_by_user_id: userId,
          assignee_user_id: draft.assignee_user_id || userId,
          title: draft.title,
          notes: draft.notes,
          start_iso: draft.start_iso,
          due_iso: draft.due_iso,
          units: draft.units,
          source: draft.source,
          status: 'active',
          draft_id: draft.id,
          session_id: draft.session_id,
        })
        .select()
        .single();

      if (taskError) {
        errors.push({ draftId: draft.id, error: taskError.message });
        continue;
      }

      createdTasks.push(task);
      tasksToSchedule.push({
        id: task.id,
        assignee_user_id: task.assignee_user_id,
        units: task.units,
        start_iso: task.start_iso,
        due_iso: task.due_iso,
      });

      // Mark draft as confirmed
      await supabase
        .from('task_drafts')
        .update({ status: 'confirmed' })
        .eq('id', draft.id);

      // Log event
      await supabase.from('task_events').insert({
        workspace_id: workspaceId,
        task_id: task.id,
        draft_id: draft.id,
        event_type: 'draft_confirmed',
        payload_json: {},
        created_by_user_id: userId,
      });
    }

    // Schedule tasks (capacity-aware allocation)
    let scheduleResult: { allocations: TaskAllocation[]; risks: { task_id: string; reason: string }[] } = {
      allocations: [],
      risks: []
    };

    if (tasksToSchedule.length > 0) {
      // Fetch existing capacity records
      const { data: capacityRecords } = await supabase
        .from('user_capacity')
        .select('*')
        .eq('workspace_id', workspaceId);

      // Fetch existing allocations
      const { data: existingAllocations } = await supabase
        .from('task_allocations')
        .select('*')
        .eq('workspace_id', workspaceId);

      // Run scheduler
      scheduleResult = scheduleConfirmedTasks(
        tasksToSchedule,
        (capacityRecords as UserCapacityRecord[]) || [],
        (existingAllocations as TaskAllocation[]) || [],
        whatWhyConfig.timezone
      );

      // Save allocations to DB
      for (const allocation of scheduleResult.allocations) {
        await supabase.from('task_allocations').insert({
          workspace_id: workspaceId,
          task_id: allocation.task_id,
          user_id: allocation.user_id,
          week_start_iso: allocation.week_start_iso,
          units: allocation.units,
        });
      }

      // Set risk flags on tasks
      for (const risk of scheduleResult.risks) {
        await supabase
          .from('tasks')
          .update({ risk_flag: true })
          .eq('id', risk.task_id);
      }
    }

    return Response.json({
      success: true,
      tasks: createdTasks,
      allocations: scheduleResult.allocations,
      risks: scheduleResult.risks,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('[confirm-drafts] Error:', error);
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
