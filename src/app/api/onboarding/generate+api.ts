/**
 * Onboarding API - Generate Outputs
 * LLM-powered or template-based objective/task generation
 */

import type {
  GenerateOutputsRequest,
  GenerateOutputsResponse,
  GeneratedOutputs,
  GeneratedObjective,
  GeneratedTaskDraft,
  OnboardingStep,
} from '@/lib/onboarding/types';
import { STEPS_BY_MODULE, getStepByKey } from '@/lib/onboarding/program-data';

export async function POST(request: Request): Promise<Response> {
  try {
    const body: GenerateOutputsRequest = await request.json();
    const { company_id, step_id, inputs, use_llm } = body;

    if (!company_id || !step_id || !inputs) {
      return Response.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find the step definition
    let stepDef: any = null;
    for (const [moduleKey, steps] of Object.entries(STEPS_BY_MODULE)) {
      const found = steps.find((s) => s.step_key === step_id || step_id.includes(s.step_key));
      if (found) {
        stepDef = found;
        break;
      }
    }

    if (!stepDef) {
      return Response.json(
        { success: false, error: 'Step not found' },
        { status: 404 }
      );
    }

    // Get the transcript/text input
    const transcript = inputs.transcript?.value as string || '';

    let outputs: GeneratedOutputs;

    if (use_llm && process.env.OPENAI_API_KEY) {
      // Use LLM to generate outputs
      outputs = await generateWithLLM(stepDef, transcript);
    } else {
      // Use template-based generation
      outputs = generateFromTemplates(stepDef, transcript, inputs);
    }

    return Response.json({
      success: true,
      data: outputs,
    });
  } catch (error) {
    console.error('[Onboarding Generate] Error:', error);
    return Response.json(
      { success: false, error: 'Failed to generate outputs' },
      { status: 500 }
    );
  }
}

/**
 * Generate outputs using LLM
 */
async function generateWithLLM(
  stepDef: any,
  transcript: string
): Promise<GeneratedOutputs> {
  const prompt = stepDef.llm_prompt_template?.replace('{{transcript}}', transcript) ||
    `Extract from the following transcript:
- Key objectives (goals to achieve)
- Specific tasks to complete

Transcript: ${transcript}

Return JSON with:
- objectives: [{ title, description, category }]
- task_drafts: [{ title, units, assignee_hint, due_offset_days }]
- missing_info: [any unclear items]
- suggested_evidence: [what evidence to provide]`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a startup advisor helping founders structure their work. Extract actionable objectives and tasks from their input. Always return valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in response');
    }

    const parsed = JSON.parse(content);

    return {
      objectives: (parsed.objectives || []).map((obj: any, i: number) => ({
        id: `obj-${Date.now()}-${i}`,
        title: obj.title || 'Untitled Objective',
        description: obj.description,
        category: obj.category || 'operations',
        is_editable: true,
      })),
      task_drafts: (parsed.task_drafts || []).map((task: any, i: number) => ({
        id: `task-${Date.now()}-${i}`,
        title: task.title || 'Untitled Task',
        notes: task.notes,
        units: task.units || 1,
        assignee_hint: task.assignee_hint || 'founder',
        due_offset_days: task.due_offset_days,
        is_editable: true,
      })),
      missing_info: parsed.missing_info || [],
      suggested_evidence: parsed.suggested_evidence || [],
    };
  } catch (error) {
    console.error('[LLM Generation] Error:', error);
    // Fallback to templates
    return generateFromTemplates(stepDef, transcript, {});
  }
}

/**
 * Generate outputs from templates (fallback)
 */
function generateFromTemplates(
  stepDef: any,
  transcript: string,
  inputs: Record<string, any>
): GeneratedOutputs {
  const outputs: GeneratedOutputs = {
    objectives: [],
    task_drafts: [],
    missing_info: [],
    suggested_evidence: [],
  };

  const templates = stepDef.outputs_templates || {};

  // Generate objectives from templates
  if (templates.objectives) {
    outputs.objectives = templates.objectives.map((tmpl: any, i: number) => ({
      id: `obj-${Date.now()}-${i}`,
      title: interpolateTemplate(tmpl.title_template, inputs, transcript),
      description: tmpl.description_template
        ? interpolateTemplate(tmpl.description_template, inputs, transcript)
        : undefined,
      category: tmpl.category || 'operations',
      period: tmpl.period,
      is_editable: true,
    }));
  }

  // Generate task drafts from templates
  if (templates.task_drafts) {
    outputs.task_drafts = templates.task_drafts.map((tmpl: any, i: number) => ({
      id: `task-${Date.now()}-${i}`,
      title: interpolateTemplate(tmpl.title_template, inputs, transcript),
      notes: tmpl.notes_template
        ? interpolateTemplate(tmpl.notes_template, inputs, transcript)
        : undefined,
      units: tmpl.units || 1,
      assignee_hint: tmpl.assignee_hint || 'founder',
      due_offset_days: tmpl.due_offset_days,
      is_editable: true,
    }));
  }

  // Suggest missing info based on evidence requirements
  const evidenceReqs = stepDef.evidence_requirements || [];
  for (const req of evidenceReqs) {
    if (!transcript.toLowerCase().includes(req.key.replace(/_/g, ' '))) {
      outputs.suggested_evidence?.push(req.label);
    }
  }

  return outputs;
}

/**
 * Interpolate template with values
 */
function interpolateTemplate(
  template: string,
  inputs: Record<string, any>,
  transcript: string
): string {
  let result = template;

  // Replace {{key}} placeholders
  for (const [key, val] of Object.entries(inputs)) {
    const value = typeof val === 'object' && val.value ? val.value : val;
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
  }

  // Extract key phrases from transcript for remaining placeholders
  const placeholders = result.match(/\{\{(\w+)\}\}/g);
  if (placeholders) {
    for (const placeholder of placeholders) {
      const key = placeholder.replace(/\{\{|\}\}/g, '');
      // Try to find a relevant phrase in transcript
      const extracted = extractFromTranscript(transcript, key);
      result = result.replace(placeholder, extracted || `[${key}]`);
    }
  }

  return result;
}

/**
 * Extract relevant text from transcript based on key
 */
function extractFromTranscript(transcript: string, key: string): string | null {
  // Simple extraction - look for sentences containing the key
  const keyWords = key.replace(/_/g, ' ').toLowerCase();
  const sentences = transcript.split(/[.!?]+/);

  for (const sentence of sentences) {
    if (sentence.toLowerCase().includes(keyWords)) {
      return sentence.trim();
    }
  }

  // If key is like "target_1", extract numbered items
  const match = key.match(/(\w+)_(\d+)/);
  if (match) {
    const itemType = match[1];
    const itemNum = parseInt(match[2]);
    const lines = transcript.split('\n');

    let count = 0;
    for (const line of lines) {
      if (line.trim().match(/^\d+[\.\)]/)) {
        count++;
        if (count === itemNum) {
          return line.replace(/^\d+[\.\)]\s*/, '').trim();
        }
      }
    }
  }

  return null;
}
