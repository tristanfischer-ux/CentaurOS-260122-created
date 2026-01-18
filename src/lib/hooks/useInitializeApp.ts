// App initialization and data loading hook

import { useEffect, useState } from 'react';
import { useAppStore } from '../state/app-store';
import { useSupplierStore } from '../state/supplier-store';
import { useOrganizationStore } from '../state/organization-store';
import { useOKRPlannerStore } from '../state/okr-planner-store';
import { useSquadStore } from '../state/squad-store';
import { useUniversalStore } from '../state/universal-store';
import { useFinanceStore } from '../state/finance-store';
import { db } from '../storage';
import { supabase } from '../supabase';

export function useInitializeApp() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSeeded, setIsSeeded] = useState(false);
  const initialize = useAppStore((s) => s.initialize);
  const initializeSuppliers = useSupplierStore((s) => s.initializeSuppliers);
  const initializeOrganization = useOrganizationStore((s) => s.initializeOrganization);
  const initializePlans = useOKRPlannerStore((s) => s.initializePlans);
  const initializeSquads = useSquadStore((s) => s.initializeSquads);
  const setWorkspaces = useAppStore((s) => s.setWorkspaces);
  const setMemberships = useAppStore((s) => s.setMemberships);
  const setUsers = useAppStore((s) => s.setUsers);
  const setObjectives = useAppStore((s) => s.setObjectives);
  const setKeyResults = useAppStore((s) => s.setKeyResults);
  const setProjects = useAppStore((s) => s.setProjects);
  const setTasks = useAppStore((s) => s.setTasks);
  const setTaskComments = useAppStore((s) => s.setTaskComments);
  const setTimeEntries = useAppStore((s) => s.setTimeEntries);
  const setReviews = useAppStore((s) => s.setReviews);
  const setWeeklyPacks = useAppStore((s) => s.setWeeklyPacks);
  const setTemplates = useAppStore((s) => s.setTemplates);
  const setAuditLogs = useAppStore((s) => s.setAuditLogs);
  const setMetricEvents = useAppStore((s) => s.setMetricEvents);

  // NEW: Supabase data loading
  const loadUniversalData = useUniversalStore((s) => s.loadUniversalData);
  const loadFinancialData = useFinanceStore((s) => s.loadFinancialData);

  useEffect(() => {
    async function initApp() {
      try {
        console.log('[Init] Starting app initialization...');

        // Initialize auth state
        await initialize();

        // Check if user is authenticated
        let session = null;
        try {
          const result = await supabase.auth.getSession();
          session = result.data?.session || null;
        } catch (error) {
          console.warn('[Init] Failed to get session from Supabase:', error);
          // Continue without session
        }

        // NEW: Load universal data from Supabase (AI tools, templates, etc.)
        // This is loaded once at app start for all users
        console.log('[Init] Loading universal data from Supabase...');
        try {
          await loadUniversalData();
        } catch (error) {
          console.warn('[Init] Failed to load universal data from Supabase, continuing without it:', error);
          // Continue initialization even if Supabase data fails
        }

        // If user is authenticated, load their financial data
        if (session?.user) {
          console.log('[Init] User authenticated, loading user-specific data...');

          // Load financial data if workspace is available
          // Note: This will be updated to use actual workspace ID after workspace selection
          const currentWorkspaceId = useAppStore.getState().currentWorkspaceId;
          if (currentWorkspaceId) {
            console.log('[Init] Loading financial data for workspace:', currentWorkspaceId);
            try {
              await loadFinancialData(currentWorkspaceId);
            } catch (error) {
              console.warn('[Init] Failed to load financial data from Supabase, continuing without it:', error);
              // Continue initialization even if financial data fails
            }
          }
        }

        // Initialize local stores (will be empty until workspace is selected)
        initializeSuppliers();
        initializeOrganization();
        await initializePlans();
        await initializeSquads();

        // Load all data from AsyncStorage (legacy data)
        const [
          workspaces,
          memberships,
          users,
          objectives,
          keyResults,
          metricEvents,
          projects,
          tasks,
          taskComments,
          timeEntries,
          reviews,
          weeklyPacks,
          templates,
          auditLogs,
        ] = await Promise.all([
          db.getWorkspaces(),
          db.getMemberships(),
          db.getUsers(),
          db.getObjectives(),
          db.getKeyResults(),
          db.getMetricEvents(),
          db.getProjects(),
          db.getTasks(),
          db.getTaskComments(),
          db.getTimeEntries(),
          db.getReviews(),
          db.getWeeklyPacks(),
          db.getTemplates(),
          db.getAuditLogs(),
        ]);

        // Load into app store
        setWorkspaces(workspaces);
        setMemberships(memberships);
        setUsers(users);
        setObjectives(objectives);
        setKeyResults(keyResults);
        setMetricEvents(metricEvents);
        setProjects(projects);
        setTasks(tasks);
        setTaskComments(taskComments);
        setTimeEntries(timeEntries);
        setReviews(reviews);
        setWeeklyPacks(weeklyPacks);
        setTemplates(templates);
        setAuditLogs(auditLogs);

        console.log('[Init] App initialization complete!');
        setIsInitialized(true);
      } catch (error) {
        console.error('[Init] Failed to initialize app:', error);
        setIsInitialized(true); // Set anyway to avoid infinite loading
      }
    }

    initApp();
  }, []);

  return { isInitialized, isSeeded };
}
