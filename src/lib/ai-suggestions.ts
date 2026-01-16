// AI-powered suggestions and smart defaults

import type { OrganizationMember } from '@/lib/organization-seed';
import type { WorkPlan } from '@/lib/state/work-plan-store';

export interface AllocationSuggestion {
  memberId: string;
  memberName: string;
  reason: string;
  score: number; // 0-100
  suggestedTU: number;
}

// Suggest best people for a task based on skills, availability, and function match
export function suggestAllocation(
  task: WorkPlan,
  availableMembers: OrganizationMember[],
  currentAllocations: Record<string, number> // memberId -> current TU allocated
): AllocationSuggestion[] {
  const suggestions: AllocationSuggestion[] = [];

  availableMembers.forEach((member) => {
    let score = 0;
    const reasons: string[] = [];

    // Function match (40 points)
    if (member.function === task.function) {
      score += 40;
      reasons.push('Function match');
    }

    // Skill match (30 points)
    const hasRelevantSkills = member.skills && member.skills.some((skill) =>
      task.title.toLowerCase().includes(skill.name.toLowerCase())
    );
    if (hasRelevantSkills) {
      score += 30;
      reasons.push('Relevant skills');
    }

    // Availability (20 points)
    const currentLoad = currentAllocations[member.id] || 0;
    const baseCapacity = 10; // Default base capacity
    const utilizationPercent = (currentLoad / baseCapacity) * 100;

    if (utilizationPercent < 70) {
      score += 20;
      reasons.push('Available capacity');
    } else if (utilizationPercent < 90) {
      score += 10;
      reasons.push('Some capacity available');
    }

    // Experience (10 points)
    if (member.role === 'FractionalExec') {
      score += 10;
      reasons.push('Senior experience');
    } else if (member.role === 'Founder') {
      score += 8;
    }

    // AI proficiency bonus
    if (member.aiProficiencyMultiplier && member.aiProficiencyMultiplier > 1.2) {
      score += 5;
      reasons.push('AI proficient');
    }

    // Calculate suggested TU (start with 25% of task effort)
    const suggestedTU = Math.max(2, Math.round(task.estimatedTimeUnits * 0.25));

    suggestions.push({
      memberId: member.id,
      memberName: member.name,
      reason: reasons.join(', '),
      score,
      suggestedTU,
    });
  });

  // Sort by score descending
  return suggestions.sort((a, b) => b.score - a.score).slice(0, 5);
}

// Detect overloaded team members
export function detectOverload(
  members: OrganizationMember[],
  allocations: Record<string, number>
): {
  memberId: string;
  memberName: string;
  currentTU: number;
  capacity: number;
  utilizationPercent: number;
  suggestedAction: string;
}[] {
  const overloaded: any[] = [];

  members.forEach((member) => {
    const currentTU = allocations[member.id] || 0;
    const baseCapacity = 10; // Default base capacity
    const utilizationPercent = (currentTU / baseCapacity) * 100;

    if (utilizationPercent > 100) {
      overloaded.push({
        memberId: member.id,
        memberName: member.name,
        currentTU,
        capacity: baseCapacity,
        utilizationPercent: Math.round(utilizationPercent),
        suggestedAction:
          utilizationPercent > 150
            ? 'Critical: Immediately reassign tasks'
            : 'Reassign lower priority tasks',
      });
    }
  });

  return overloaded.sort((a, b) => b.utilizationPercent - a.utilizationPercent);
}

// Suggest squad formations based on skill complementarity
export function suggestSquads(
  members: OrganizationMember[],
  minSize: number = 2,
  maxSize: number = 4
): {
  members: OrganizationMember[];
  reason: string;
  score: number;
}[] {
  const suggestions: any[] = [];

  // Simple algorithm: group by function, then by complementary roles
  const byFunction = members.reduce((acc, member) => {
    if (!acc[member.function]) acc[member.function] = [];
    acc[member.function].push(member);
    return acc;
  }, {} as Record<string, OrganizationMember[]>);

  Object.entries(byFunction).forEach(([func, funcMembers]) => {
    if (funcMembers.length >= minSize) {
      // Find good combinations
      const execs = funcMembers.filter((m) => m.role === 'FractionalExec');
      const apprentices = funcMembers.filter((m) => m.role === 'Apprentice');

      if (execs.length > 0 && apprentices.length > 0) {
        // Suggest exec + apprentices squad
        const squad = [execs[0], ...apprentices.slice(0, maxSize - 1)];
        suggestions.push({
          members: squad,
          reason: `Senior leadership (${execs[0].name}) + execution team in ${func}`,
          score: 90,
        });
      }
    }
  });

  return suggestions.sort((a, b) => b.score - a.score).slice(0, 3);
}

// Smart scheduling: find best time to start a task
export function suggestStartDate(
  task: WorkPlan,
  currentDate: Date,
  upcomingTasks: WorkPlan[],
  teamCapacity: Record<string, { available: number; total: number }>
): {
  suggestedDate: Date;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
} {
  // Simple heuristic: find first week with sufficient capacity
  let checkDate = new Date(currentDate);
  checkDate.setDate(checkDate.getDate() + 1); // Start tomorrow

  for (let week = 0; week < 12; week++) {
    // Check 12 weeks ahead
    const tasksThisWeek = upcomingTasks.filter((t) => {
      const taskStart = new Date(t.startDate || Date.now());
      const taskEnd = new Date(t.dueDate || Date.now());
      return taskStart <= checkDate && taskEnd >= checkDate;
    });

    const totalDemand = tasksThisWeek.reduce((sum, t) => sum + t.estimatedTimeUnits, 0);
    const totalCapacity = Object.values(teamCapacity).reduce((sum, c) => sum + c.available, 0);

    if (totalCapacity - totalDemand >= task.estimatedTimeUnits) {
      return {
        suggestedDate: checkDate,
        reason: `Team has ${Math.round(totalCapacity - totalDemand)} TU available this week`,
        confidence: totalCapacity - totalDemand > task.estimatedTimeUnits * 1.5 ? 'high' : 'medium',
      };
    }

    checkDate.setDate(checkDate.getDate() + 7);
  }

  // No good slot found
  return {
    suggestedDate: new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000),
    reason: 'Team at capacity, may require overtime or hiring',
    confidence: 'low',
  };
}
