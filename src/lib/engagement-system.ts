/**
 * Engagement System - Supply Chain Orchestration
 *
 * "Make" = Orchestrate outsourced work, NOT manufacturing ownership.
 * We track: Quote → PO → Production → QC → Shipment → Delivery → ACCEPTANCE
 *
 * CRITICAL: "Done" = Accepted (with evidence), NOT shipped.
 * Goods may ship to other suppliers or customers (multi-hop).
 */

import type { Function as BusinessFunction } from '@/types';

// ============================================
// ENGAGEMENT (Work Order / PO / Job)
// ============================================

export type EngagementCategory =
  | 'PCB'
  | 'Plastics'
  | 'Machining'
  | 'Assembly'
  | 'Packaging'
  | 'Logistics'
  | 'Other';

export type EngagementStatus =
  | 'Planning'
  | 'In Progress'
  | 'Delivered'
  | 'At Risk'
  | 'Blocked'
  | 'Disputed'
  | 'Cancelled';

export type AcceptanceStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Partial';

export type AcceptedBy = 'Customer' | 'Downstream Supplier' | 'Third-Party Inspector' | 'Internal';

export interface EngagementItem {
  id: string;
  partNumber: string;
  description: string;
  qty: number;
  unitCost: number;
  links: string[]; // Links to drawings/specs/BOM
}

export interface EngagementFinancials {
  contractedValue: number; // £ total contract value
  paidToDate: number; // £ paid so far
  outstanding: number; // £ remaining to pay
  paymentTerms: string; // e.g., "Net 30", "50% upfront, 50% on delivery"
}

export interface Engagement {
  id: string;
  workspaceId: string;
  title: string;
  description: string;

  // Supplier info
  supplierId: string; // Primary supplier
  supplierName: string;
  subSuppliers?: { id: string; name: string; role: string }[];

  // Category
  category: EngagementCategory;
  function: BusinessFunction; // Which business function owns this

  // Items
  items: EngagementItem[];

  // Financials
  financials: EngagementFinancials;

  // Shipping (CRITICAL: may not be us)
  shipFrom: string; // e.g., "Supplier A, Shenzhen"
  shipTo: string; // e.g., "Customer", "Supplier B", "Warehouse"
  incoterms?: string; // e.g., "FOB", "DDP"

  // Dates
  startDate: string;
  promisedShipDate: string;
  promisedDeliveryDate: string;
  actualShipDate?: string;
  actualDeliveryDate?: string;

  // Status
  status: EngagementStatus;
  acceptanceStatus: AcceptanceStatus;

  // Progress (milestone-based)
  progressPct: number; // 0-100, calculated from milestones
  milestones?: EngagementMilestone[]; // Milestones for this engagement

  // Acceptance gate
  acceptedBy: AcceptedBy;
  acceptedEvidenceRequired: string[]; // e.g., ["POD", "Photos", "Inspection Report"]
  acceptedEvidenceFiles: string[]; // URLs to uploaded evidence

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// ============================================
// MILESTONES
// ============================================

export interface MilestoneTemplate {
  id: string;
  name: string;
  weight: number; // Contributes to progress %
  evidenceRequired?: string[];
}

export interface EngagementMilestone extends MilestoneTemplate {
  engagementId: string;
  completed: boolean;
  completedDate?: string;
  completedBy?: string;
  evidence: string[]; // URLs to files
  notes?: string;
}

// Default milestone templates (weights add to 100)
export const DEFAULT_MILESTONES: MilestoneTemplate[] = [
  { id: 'rfq-sent', name: 'RFQ Sent', weight: 5 },
  { id: 'quote-accepted', name: 'Quote Accepted / PO Issued', weight: 10, evidenceRequired: ['PO'] },
  { id: 'schedule-confirmed', name: 'Schedule Confirmed', weight: 10 },
  { id: 'materials-procured', name: 'Materials Procured', weight: 10 },
  { id: 'production-started', name: 'Production Started', weight: 15 },
  { id: 'production-complete', name: 'Production Complete', weight: 20, evidenceRequired: ['Photos'] },
  { id: 'qc-passed', name: 'QC/Inspection Passed', weight: 15, evidenceRequired: ['Inspection Report'] },
  { id: 'shipped', name: 'Shipped (Tracking)', weight: 10, evidenceRequired: ['Tracking ID'] },
  { id: 'delivered', name: 'Delivered (POD)', weight: 3, evidenceRequired: ['POD'] },
  { id: 'accepted', name: 'Accepted', weight: 2, evidenceRequired: ['Acceptance Signature'] },
];

export function calculateProgress(milestones: EngagementMilestone[]): number {
  const totalWeight = milestones.reduce((sum, m) => sum + m.weight, 0);
  const completedWeight = milestones.filter(m => m.completed).reduce((sum, m) => sum + m.weight, 0);
  return totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
}

// ============================================
// SHIPMENT LEGS (Multi-hop shipments)
// ============================================

export type ShipmentLegStatus = 'Scheduled' | 'In Transit' | 'Delivered' | 'Delayed' | 'Lost';

export interface ShipmentLeg {
  id: string;
  engagementId: string;
  legNumber: number; // 1, 2, 3... for multi-hop
  from: string; // Location/supplier
  to: string; // Location/supplier/customer
  carrier: string;
  trackingId?: string;
  scheduledShipDate: string;
  actualShipDate?: string;
  scheduledDeliveryDate: string;
  actualDeliveryDate?: string;
  podLink?: string; // Proof of Delivery
  status: ShipmentLegStatus;
  notes?: string;
}

// ============================================
// ACCEPTANCE RECORD
// ============================================

export interface AcceptanceRecord {
  id: string;
  engagementId: string;
  status: AcceptanceStatus;
  acceptedBy: AcceptedBy;
  acceptedDate?: string;
  acceptedByPerson?: string;
  evidenceFiles: string[]; // URLs
  qtyAccepted?: number;
  qtyRejected?: number;
  defects?: string[];
  notes?: string;
}

// ============================================
// AI AGENTS FOR ENGAGEMENTS
// ============================================

export type EngagementAIAgent =
  | 'RFQ Bot'
  | 'Quote Normaliser'
  | 'Expeditor'
  | 'QC Gatekeeper'
  | 'Invoice Matcher';

export interface EngagementAIActivity {
  agentType: EngagementAIAgent;
  active: boolean;
  tuSavedEstimate: number; // TUs saved by this agent
  alertsRaised: number;
  lastActivity?: string;
  logs: {
    timestamp: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
  }[];
}

// ============================================
// SUPPLIER SCORECARD
// ============================================

export interface SupplierScorecard {
  supplierId: string;
  supplierName: string;

  // Performance metrics
  qualityPct: number; // % defect-free
  onTimePct: number; // % on-time deliveries
  responseTimeHours: number; // Avg response time
  overallRating: number; // 0-5 stars

  // New metrics
  acceptancePassRate: number; // % accepted first time
  disputeRate: number; // % disputed engagements

  // Risk assessment
  riskLevel: 'Low' | 'Medium' | 'High';
  riskFactors: string[];

  // History
  totalEngagements: number;
  activeEngagements: number;
  totalValueDelivered: number;
}

// ============================================
// MAKE TAB KPIS
// ============================================

export interface MakeKPIs {
  // Outcomes (not "Made")
  valueDeliveredThisMonth: number; // £ accepted
  valueInFlight: number; // £ issued but not accepted
  cashAtRisk: number; // £ late/disputed/at-risk

  // Performance
  onTimePct: number; // % on-time (weighted by value)
  qualityPct: number; // Acceptance pass rate
  avgCycleTimeDays: number; // PO → Accepted

  // Financial
  totalContracted: number;
  totalPaid: number;
  totalOutstanding: number;

  // Breakdown
  valueByStatus: {
    planning: number;
    inProgress: number;
    delivered: number;
    atRisk: number;
    blocked: number;
    disputed: number;
  };

  // AI impact
  aiAgentsActive: number;
  tuSavedByAI: number;
  aiCostPerMonth: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function calculateEngagementRisk(engagement: Engagement): 'Low' | 'Medium' | 'High' {
  let riskScore = 0;

  // Late delivery
  const now = new Date();
  const promised = new Date(engagement.promisedDeliveryDate);
  if (now > promised && engagement.acceptanceStatus !== 'Accepted') {
    riskScore += 3;
  }

  // Disputed
  if (engagement.status === 'Disputed') {
    riskScore += 5;
  }

  // Blocked
  if (engagement.status === 'Blocked') {
    riskScore += 3;
  }

  // At Risk
  if (engagement.status === 'At Risk') {
    riskScore += 2;
  }

  // High value
  if (engagement.financials.contractedValue > 50000) {
    riskScore += 1;
  }

  // Outstanding payment
  if (engagement.financials.outstanding > engagement.financials.contractedValue * 0.7) {
    riskScore += 2;
  }

  if (riskScore >= 7) return 'High';
  if (riskScore >= 4) return 'Medium';
  return 'Low';
}

export function isEngagementLate(engagement: Engagement): boolean {
  if (engagement.acceptanceStatus === 'Accepted') return false;

  const now = new Date();
  const promised = new Date(engagement.promisedDeliveryDate);
  return now > promised;
}

export function getEngagementStatusColor(status: EngagementStatus): string {
  switch (status) {
    case 'Planning':
      return '#94a3b8'; // slate
    case 'In Progress':
      return '#3b82f6'; // blue
    case 'Delivered':
      return '#10b981'; // emerald
    case 'At Risk':
      return '#f59e0b'; // amber
    case 'Blocked':
      return '#ef4444'; // red
    case 'Disputed':
      return '#dc2626'; // red-600
    case 'Cancelled':
      return '#6b7280'; // gray
    default:
      return '#6b7280';
  }
}

export function getAcceptanceStatusColor(status: AcceptanceStatus): string {
  switch (status) {
    case 'Pending':
      return '#f59e0b'; // amber
    case 'Accepted':
      return '#10b981'; // emerald
    case 'Rejected':
      return '#ef4444'; // red
    case 'Partial':
      return '#f97316'; // orange
    default:
      return '#6b7280';
  }
}

// Calculate KPIs from engagements
export function calculateMakeKPIs(
  engagements: Engagement[],
  aiActivities: EngagementAIActivity[]
): MakeKPIs {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Value delivered this month (accepted)
  const valueDeliveredThisMonth = engagements
    .filter(e => {
      if (e.acceptanceStatus !== 'Accepted') return false;
      const acceptedDate = e.milestones?.find((m: EngagementMilestone) => m.id === 'accepted')?.completedDate;
      if (!acceptedDate) return false;
      return new Date(acceptedDate) >= thisMonthStart;
    })
    .reduce((sum, e) => sum + e.financials.contractedValue, 0);

  // Value in flight (not accepted yet)
  const valueInFlight = engagements
    .filter(e => e.acceptanceStatus === 'Pending' && e.status !== 'Cancelled')
    .reduce((sum, e) => sum + e.financials.contractedValue, 0);

  // Cash at risk (late, disputed, blocked, at-risk)
  const cashAtRisk = engagements
    .filter(e =>
      (e.status === 'At Risk' || e.status === 'Blocked' || e.status === 'Disputed' ||
       isEngagementLate(e)) &&
      e.acceptanceStatus !== 'Accepted'
    )
    .reduce((sum, e) => sum + e.financials.outstanding, 0);

  // On-time % (weighted by value)
  const completedEngagements = engagements.filter(e => e.acceptanceStatus === 'Accepted');
  let totalValueCompleted = 0;
  let onTimeValue = 0;

  completedEngagements.forEach(e => {
    const value = e.financials.contractedValue;
    totalValueCompleted += value;

    const deliveredDate = e.actualDeliveryDate ? new Date(e.actualDeliveryDate) : now;
    const promisedDate = new Date(e.promisedDeliveryDate);
    if (deliveredDate <= promisedDate) {
      onTimeValue += value;
    }
  });

  const onTimePct = totalValueCompleted > 0 ? Math.round((onTimeValue / totalValueCompleted) * 100) : 100;

  // Quality % (acceptance pass rate)
  const totalAcceptanceAttempts = engagements.filter(e =>
    e.acceptanceStatus === 'Accepted' || e.acceptanceStatus === 'Rejected' || e.acceptanceStatus === 'Partial'
  ).length;
  const acceptedCount = engagements.filter(e => e.acceptanceStatus === 'Accepted').length;
  const qualityPct = totalAcceptanceAttempts > 0 ? Math.round((acceptedCount / totalAcceptanceAttempts) * 100) : 100;

  // Avg cycle time (PO → Accepted)
  let totalCycleDays = 0;
  let cycleCount = 0;
  completedEngagements.forEach(e => {
    const poDate = e.startDate ? new Date(e.startDate) : null;
    const acceptedDate = e.milestones?.find((m: EngagementMilestone) => m.id === 'accepted')?.completedDate;
    if (poDate && acceptedDate) {
      const days = Math.round((new Date(acceptedDate).getTime() - poDate.getTime()) / (1000 * 60 * 60 * 24));
      totalCycleDays += days;
      cycleCount++;
    }
  });
  const avgCycleTimeDays = cycleCount > 0 ? Math.round(totalCycleDays / cycleCount) : 0;

  // Financial totals
  const totalContracted = engagements.reduce((sum, e) => sum + e.financials.contractedValue, 0);
  const totalPaid = engagements.reduce((sum, e) => sum + e.financials.paidToDate, 0);
  const totalOutstanding = engagements.reduce((sum, e) => sum + e.financials.outstanding, 0);

  // Value by status
  const valueByStatus = {
    planning: 0,
    inProgress: 0,
    delivered: 0,
    atRisk: 0,
    blocked: 0,
    disputed: 0,
  };

  engagements.forEach(e => {
    switch (e.status) {
      case 'Planning':
        valueByStatus.planning += e.financials.contractedValue;
        break;
      case 'In Progress':
        valueByStatus.inProgress += e.financials.contractedValue;
        break;
      case 'Delivered':
        valueByStatus.delivered += e.financials.contractedValue;
        break;
      case 'At Risk':
        valueByStatus.atRisk += e.financials.contractedValue;
        break;
      case 'Blocked':
        valueByStatus.blocked += e.financials.contractedValue;
        break;
      case 'Disputed':
        valueByStatus.disputed += e.financials.contractedValue;
        break;
    }
  });

  // AI impact
  const aiAgentsActive = aiActivities.filter(a => a.active).length;
  const tuSavedByAI = aiActivities.reduce((sum, a) => sum + a.tuSavedEstimate, 0);
  // Assume each agent costs ~£50/month (average of marketplace tools in Ops slot)
  const aiCostPerMonth = aiAgentsActive * 50;

  return {
    valueDeliveredThisMonth,
    valueInFlight,
    cashAtRisk,
    onTimePct,
    qualityPct,
    avgCycleTimeDays,
    totalContracted,
    totalPaid,
    totalOutstanding,
    valueByStatus,
    aiAgentsActive,
    tuSavedByAI,
    aiCostPerMonth,
  };
}
