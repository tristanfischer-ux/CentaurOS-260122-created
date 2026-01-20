/**
 * Task Calculations Utility
 *
 * Handles all calculations related to task effort, velocity, coordination costs,
 * and timeline estimates according to the Task Display Standardization Plan.
 */

/**
 * Coordination penalty percentages based on team size
 * Reflects Brooks' Law: communication overhead increases with team size
 */
const COORDINATION_PENALTIES: Record<number, number> = {
  1: 0,    // No penalty for solo work
  2: 0.05, // 5% penalty for 2 people
  3: 0.10, // 10% penalty for 3 people
  4: 0.15, // 15% penalty for 4 people
};

const DEFAULT_COORDINATION_PENALTY = 0.20; // 20% penalty for 5+ people

/**
 * Get coordination penalty percentage for a given team size
 */
export function getCoordinationPenalty(teamSize: number): number {
  if (teamSize <= 0) return 0;
  return COORDINATION_PENALTIES[teamSize] ?? DEFAULT_COORDINATION_PENALTY;
}

/**
 * Calculate net velocity after applying coordination penalty
 *
 * @param teamSize - Number of people on the task
 * @param rawVelocity - Combined TU/week from all team members
 * @returns Net velocity after coordination overhead
 */
export function calculateNetVelocity(teamSize: number, rawVelocity: number): number {
  if (teamSize <= 0 || rawVelocity <= 0) return 0;

  const penalty = getCoordinationPenalty(teamSize);
  const coordinationCost = rawVelocity * penalty;
  const netVelocity = rawVelocity - coordinationCost;

  return Math.max(0, netVelocity); // Never go negative
}

/**
 * Calculate coordination cost in TU/week
 */
export function calculateCoordinationCost(teamSize: number, rawVelocity: number): number {
  const penalty = getCoordinationPenalty(teamSize);
  return rawVelocity * penalty;
}

/**
 * Calculate estimated weeks to complete remaining work
 *
 * @param remainingTU - Time units remaining
 * @param netVelocity - Net velocity per week (after coordination penalty)
 * @returns Estimated weeks (can be fractional)
 */
export function calculateEstimatedWeeks(remainingTU: number, netVelocity: number): number {
  if (remainingTU <= 0) return 0;
  if (netVelocity <= 0) return Infinity;

  return remainingTU / netVelocity;
}

/**
 * Calculate estimated completion date
 *
 * @param startDate - Start date (or current date if not started)
 * @param estimatedWeeks - Estimated weeks to completion
 * @returns Date object for estimated completion
 */
export function calculateEstimatedDate(startDate: Date, estimatedWeeks: number): Date {
  if (!isFinite(estimatedWeeks)) {
    // If infinite, return far future date
    const farFuture = new Date(startDate);
    farFuture.setFullYear(farFuture.getFullYear() + 10);
    return farFuture;
  }

  const estimatedDate = new Date(startDate);
  estimatedDate.setDate(estimatedDate.getDate() + Math.ceil(estimatedWeeks * 7));
  return estimatedDate;
}

/**
 * Format estimated weeks for display
 *
 * @param weeks - Number of weeks (can be fractional)
 * @returns Formatted string like "~2w" or "~1.5w"
 */
export function formatEstimatedWeeks(weeks: number): string {
  if (!isFinite(weeks)) return '∞';
  if (weeks === 0) return '0w';

  // Round to 1 decimal place if needed
  const rounded = weeks < 10 ? Math.round(weeks * 10) / 10 : Math.round(weeks);

  return `~${rounded}w`;
}

/**
 * Format date for display in task cards
 *
 * @param date - Date to format
 * @returns Formatted string like "Mon 16 Feb"
 */
export function formatTaskDate(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const dayName = days[date.getDay()];
  const day = date.getDate();
  const monthName = months[date.getMonth()];

  return `${dayName} ${day} ${monthName}`;
}

/**
 * Calculate effort timeline string for compact display
 * Format: "16 TU @ 8/wk = ~2w"
 *
 * @param totalTU - Total time units required
 * @param velocityPerWeek - Net velocity per week
 * @param estimatedWeeks - Estimated weeks to completion
 * @returns Formatted effort timeline string
 */
export function formatEffortTimeline(
  totalTU: number,
  velocityPerWeek: number,
  estimatedWeeks: number
): string {
  const weeksFormatted = formatEstimatedWeeks(estimatedWeeks);
  return `${totalTU} TU @ ${Math.round(velocityPerWeek)}/wk = ${weeksFormatted}`;
}

/**
 * Calculate member capacity information
 *
 * @param memberAllocatedTU - TU already allocated to member across all tasks
 * @param memberTotalCapacity - Total TU capacity per week for member
 * @returns Capacity info with availability and status
 */
export interface MemberCapacity {
  allocated: number;
  total: number;
  available: number;
  utilizationPercent: number;
  status: 'available' | 'warning' | 'overallocated';
}

export function calculateMemberCapacity(
  memberAllocatedTU: number,
  memberTotalCapacity: number
): MemberCapacity {
  const available = Math.max(0, memberTotalCapacity - memberAllocatedTU);
  const utilizationPercent = memberTotalCapacity > 0
    ? Math.round((memberAllocatedTU / memberTotalCapacity) * 100)
    : 0;

  let status: 'available' | 'warning' | 'overallocated';
  if (memberAllocatedTU > memberTotalCapacity) {
    status = 'overallocated';
  } else if (available < memberTotalCapacity * 0.5) {
    status = 'warning'; // Less than 50% capacity available
  } else {
    status = 'available';
  }

  return {
    allocated: memberAllocatedTU,
    total: memberTotalCapacity,
    available,
    utilizationPercent,
    status,
  };
}

/**
 * Get capacity status icon
 */
export function getCapacityIcon(status: 'available' | 'warning' | 'overallocated'): string {
  switch (status) {
    case 'available':
      return '✅';
    case 'warning':
      return '⚠️';
    case 'overallocated':
      return '🚫';
  }
}

/**
 * Format capacity display string
 */
export function formatCapacity(capacity: MemberCapacity): string {
  const { available, total, status } = capacity;

  if (status === 'overallocated') {
    const overBy = capacity.allocated - total;
    return `${available}/${total} TU available (overallocated by ${overBy} TU!)`;
  }

  return `${available}/${total} TU available`;
}
