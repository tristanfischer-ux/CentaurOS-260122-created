/**
 * Recommendation Store
 *
 * Allows executives and apprentices to recommend talent, AI tools, and suppliers
 * Creates tasks and messages for founders to review and approve
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type RecommendationType = 'executive' | 'apprentice' | 'ai_tool' | 'supplier';

export type RecommendationStatus =
  | 'pending'      // Awaiting founder review
  | 'approved'     // Founder approved
  | 'rejected'     // Founder rejected
  | 'implemented'; // Actually hired/purchased

export interface Recommendation {
  id: string;
  workspaceId: string;

  // What's being recommended
  type: RecommendationType;
  resourceId: string; // ID of the executive/apprentice/AI/supplier
  resourceName: string;
  resourceDetails: any; // Full object data for the recommended item

  // Who recommended it
  recommendedBy: string; // User ID
  recommendedByName: string;
  recommendedByRole: 'FractionalExec' | 'Apprentice';

  // Why they're recommending it
  reason: string;
  expectedBenefit: string;
  urgency: 'low' | 'medium' | 'high';

  // For talent recommendations
  suggestedFunction?: string;
  suggestedRate?: number;

  // For AI/Supplier recommendations
  estimatedCost?: number;
  estimatedROI?: string;

  // Status and review
  status: RecommendationStatus;
  founderNotes?: string;
  reviewedAt?: string;
  reviewedBy?: string; // Founder who reviewed

  // Linked entities
  linkedTaskId?: string; // Task created for founder to review
  linkedMessageId?: string; // Message sent to founder

  // Metadata
  createdAt: string;
  updatedAt: string;
}

interface RecommendationState {
  recommendations: Recommendation[];

  // Actions
  createRecommendation: (recommendation: Omit<Recommendation, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => Recommendation;
  updateRecommendationStatus: (
    recommendationId: string,
    status: RecommendationStatus,
    founderNotes?: string,
    reviewedBy?: string
  ) => void;
  linkTaskToRecommendation: (recommendationId: string, taskId: string) => void;
  linkMessageToRecommendation: (recommendationId: string, messageId: string) => void;
  deleteRecommendation: (recommendationId: string) => void;

  // Queries
  getRecommendationById: (id: string) => Recommendation | undefined;
  getRecommendationsByWorkspace: (workspaceId: string) => Recommendation[];
  getPendingRecommendations: (workspaceId: string) => Recommendation[];
  getRecommendationsByUser: (userId: string) => Recommendation[];
  getRecommendationsByType: (workspaceId: string, type: RecommendationType) => Recommendation[];
  getRecommendationStats: (workspaceId: string) => {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    implemented: number;
    byType: Record<RecommendationType, number>;
  };
}

export const useRecommendationStore = create<RecommendationState>()(
  persist(
    (set, get) => ({
      recommendations: [],

      createRecommendation: (recommendationData) => {
        const now = new Date().toISOString();
        const newRecommendation: Recommendation = {
          ...recommendationData,
          id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          status: 'pending',
          createdAt: now,
          updatedAt: now,
        };

        set(state => ({
          recommendations: [...state.recommendations, newRecommendation],
        }));

        return newRecommendation;
      },

      updateRecommendationStatus: (recommendationId, status, founderNotes, reviewedBy) => {
        const now = new Date().toISOString();

        set(state => ({
          recommendations: state.recommendations.map(rec =>
            rec.id === recommendationId
              ? {
                  ...rec,
                  status,
                  founderNotes: founderNotes || rec.founderNotes,
                  reviewedAt: now,
                  reviewedBy: reviewedBy || rec.reviewedBy,
                  updatedAt: now,
                }
              : rec
          ),
        }));
      },

      linkTaskToRecommendation: (recommendationId, taskId) => {
        set(state => ({
          recommendations: state.recommendations.map(rec =>
            rec.id === recommendationId
              ? { ...rec, linkedTaskId: taskId, updatedAt: new Date().toISOString() }
              : rec
          ),
        }));
      },

      linkMessageToRecommendation: (recommendationId, messageId) => {
        set(state => ({
          recommendations: state.recommendations.map(rec =>
            rec.id === recommendationId
              ? { ...rec, linkedMessageId: messageId, updatedAt: new Date().toISOString() }
              : rec
          ),
        }));
      },

      deleteRecommendation: (recommendationId) => {
        set(state => ({
          recommendations: state.recommendations.filter(rec => rec.id !== recommendationId),
        }));
      },

      getRecommendationById: (id) => {
        return get().recommendations.find(rec => rec.id === id);
      },

      getRecommendationsByWorkspace: (workspaceId) => {
        return get().recommendations.filter(rec => rec.workspaceId === workspaceId);
      },

      getPendingRecommendations: (workspaceId) => {
        return get().recommendations.filter(
          rec => rec.workspaceId === workspaceId && rec.status === 'pending'
        );
      },

      getRecommendationsByUser: (userId) => {
        return get().recommendations.filter(rec => rec.recommendedBy === userId);
      },

      getRecommendationsByType: (workspaceId, type) => {
        return get().recommendations.filter(
          rec => rec.workspaceId === workspaceId && rec.type === type
        );
      },

      getRecommendationStats: (workspaceId) => {
        const recs = get().recommendations.filter(rec => rec.workspaceId === workspaceId);

        const byType: Record<RecommendationType, number> = {
          executive: 0,
          apprentice: 0,
          ai_tool: 0,
          supplier: 0,
        };

        recs.forEach(rec => {
          byType[rec.type]++;
        });

        return {
          total: recs.length,
          pending: recs.filter(r => r.status === 'pending').length,
          approved: recs.filter(r => r.status === 'approved').length,
          rejected: recs.filter(r => r.status === 'rejected').length,
          implemented: recs.filter(r => r.status === 'implemented').length,
          byType,
        };
      },
    }),
    {
      name: 'recommendation-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Helper function to create a founder review task
export function createRecommendationReviewTask(recommendation: Recommendation) {
  const typeLabel = {
    executive: 'Fractional Executive',
    apprentice: 'Apprentice',
    ai_tool: 'AI Tool',
    supplier: 'Supplier',
  }[recommendation.type];

  return {
    title: `Review Recommendation: ${recommendation.resourceName}`,
    description: `${recommendation.recommendedByName} has recommended ${typeLabel} "${recommendation.resourceName}" for consideration.\n\nReason: ${recommendation.reason}\n\nExpected Benefit: ${recommendation.expectedBenefit}`,
    priority: recommendation.urgency === 'high' ? 'urgent' as const :
              recommendation.urgency === 'medium' ? 'high' as const :
              'medium' as const,
    status: 'todo' as const,
    assignedTo: 'founder', // Should be actual founder ID
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    linkedRecommendationId: recommendation.id,
  };
}

// Helper function to create a founder notification message
export function createRecommendationMessage(recommendation: Recommendation) {
  const typeLabel = {
    executive: 'a Fractional Executive',
    apprentice: 'an Apprentice',
    ai_tool: 'an AI Tool',
    supplier: 'a Supplier',
  }[recommendation.type];

  const urgencyEmoji = {
    low: '📋',
    medium: '⚡',
    high: '🔥',
  }[recommendation.urgency];

  return {
    content: `${urgencyEmoji} ${recommendation.recommendedByName} recommends ${typeLabel}: **${recommendation.resourceName}**\n\n💡 ${recommendation.reason}\n\n📊 ${recommendation.expectedBenefit}\n\nPlease review and approve/reject this recommendation.`,
    type: 'recommendation' as const,
    linkedRecommendationId: recommendation.id,
  };
}

// Demo data initialization
export const initializeDemoRecommendations = (workspaceId: string) => {
  const store = useRecommendationStore.getState();

  // Don't reinitialize if we already have data
  if (store.recommendations.length > 0) return;

  // Create a demo recommendation
  store.createRecommendation({
    workspaceId,
    type: 'ai_tool',
    resourceId: 'ai-tool-figma',
    resourceName: 'Figma AI Assistant',
    resourceDetails: {
      description: 'AI-powered design automation tool',
      costPerMonth: 30,
    },
    recommendedBy: 'exec-1',
    recommendedByName: 'Priya Sharma',
    recommendedByRole: 'FractionalExec',
    reason: 'This tool would significantly speed up our design workflow and reduce time spent on repetitive tasks',
    expectedBenefit: 'Estimated 10 hours saved per week across the marketing team',
    urgency: 'medium',
    estimatedCost: 30,
    estimatedROI: '300+ hours saved per year',
  });

  store.createRecommendation({
    workspaceId,
    type: 'apprentice',
    resourceId: 'apprentice-jane',
    resourceName: 'Jane Designer',
    resourceDetails: {
      skills: ['UI/UX', 'Figma', 'Adobe Creative Suite'],
      experience: 3,
      costPerDay: 350,
    },
    recommendedBy: 'exec-1',
    recommendedByName: 'Priya Sharma',
    recommendedByRole: 'FractionalExec',
    reason: 'We need additional design capacity to meet our Q2 product launch deadlines',
    expectedBenefit: 'Will unblock 3 key design tasks currently waiting',
    urgency: 'high',
    suggestedFunction: 'Marketing',
    suggestedRate: 350,
  });
};
