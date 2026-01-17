/**
 * Universal Store
 *
 * Manages universal (shared) data that is the same for all users and companies.
 * This includes:
 * - AI Tools catalog
 * - Function templates
 * - Role definitions
 *
 * Data is loaded once at app initialization and cached for the session.
 */

import { create } from 'zustand';

// ============================================================================
// TYPES
// ============================================================================

export interface AITool {
  id: string;
  name: string;
  provider: string; // 'openai', 'anthropic', 'midjourney', 'elevenlabs', etc.
  category: string; // 'text', 'image', 'voice', 'video', etc.
  description: string | null;
  typical_monthly_cost: number | null;
  created_at: string;
}

export interface FunctionTemplate {
  id: string;
  name: string;
  description: string | null;
  typical_cost_per_day: number | null;
  created_at: string;
}

export interface RoleDefinition {
  id: string;
  name: string; // 'Founder', 'FractionalExec', 'Apprentice'
  description: string | null;
  permissions: Record<string, any> | null;
  created_at: string;
}

// ============================================================================
// STORE
// ============================================================================

interface UniversalStore {
  // State
  aiTools: AITool[];
  functionTemplates: FunctionTemplate[];
  roleDefinitions: RoleDefinition[];
  isLoaded: boolean;

  // Actions
  loadUniversalData: () => Promise<void>;

  // Selectors
  getAIToolsByCategory: (category: string) => AITool[];
  getFunctionTemplateByName: (name: string) => FunctionTemplate | undefined;
  getRoleDefinitionByName: (name: string) => RoleDefinition | undefined;
}

export const useUniversalStore = create<UniversalStore>((set, get) => ({
  // Initial state
  aiTools: [],
  functionTemplates: [],
  roleDefinitions: [],
  isLoaded: false,

  // Actions
  loadUniversalData: async () => {
    const { supabase } = await import('../supabase');

    try {
      // Load all universal data in parallel
      const [aiToolsRes, functionTemplatesRes, roleDefinitionsRes] = await Promise.all([
        supabase.from('ai_tools').select('*'),
        supabase.from('function_templates').select('*'),
        supabase.from('role_definitions').select('*'),
      ]);

      if (aiToolsRes.error) throw aiToolsRes.error;
      if (functionTemplatesRes.error) throw functionTemplatesRes.error;
      if (roleDefinitionsRes.error) throw roleDefinitionsRes.error;

      set({
        aiTools: aiToolsRes.data || [],
        functionTemplates: functionTemplatesRes.data || [],
        roleDefinitions: roleDefinitionsRes.data || [],
        isLoaded: true,
      });
    } catch (error) {
      console.error('Failed to load universal data:', error);
      // Set defaults on error
      set({
        aiTools: [],
        functionTemplates: [],
        roleDefinitions: [],
        isLoaded: true, // Mark as loaded even on error to prevent infinite loading
      });
    }
  },

  // Selectors
  getAIToolsByCategory: (category: string) => {
    return get().aiTools.filter((tool) => tool.category === category);
  },

  getFunctionTemplateByName: (name: string) => {
    return get().functionTemplates.find((template) => template.name === name);
  },

  getRoleDefinitionByName: (name: string) => {
    return get().roleDefinitions.find((role) => role.name === name);
  },
}));
