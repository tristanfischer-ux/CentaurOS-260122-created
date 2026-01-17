// App initialization and data loading hook

import { useEffect, useState } from 'react';
import { useAppStore } from '../state/app-store';
import { useSupplierStore } from '../state/supplier-store';
import { useOrganizationStore } from '../state/organization-store';
import { useOKRPlannerStore } from '../state/okr-planner-store';
import { useSquadStore } from '../state/squad-store';
import { db } from '../storage';
import { seedDemoData } from '../api/seed';
import { seedArmoryDemo } from '../armory/seed-demo';
// Migration disabled - Zustand stores auto-persist to MMKV already
// import { runMigrationIfNeeded } from '../storage/migrate-to-mmkv';

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

  useEffect(() => {
    async function initApp() {
      try {
        // MIGRATION DISABLED: Zustand stores auto-persist to MMKV already.
        // The old migration tried to copy ALL AsyncStorage to MMKV, which is wrong
        // because AsyncStorage should continue holding DB entities.
        // await runMigrationIfNeeded();

        // Initialize auth state
        await initialize();

        // DISABLED: No longer auto-seeding demo data for new users
        // initializeSuppliers();
        // initializeOrganization();
        // await initializePlans();
        // await initializeSquads();

        // Load all data from storage
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

        // DISABLED: No longer auto-seeding demo data
        // Check if we need to seed demo data
        // const hasUsers = Object.keys(users).length > 0;
        //
        // if (!hasUsers) {
        //   console.log('No existing data found, seeding demo workspace...');
        //   await seedDemoData();
        //   ... reload logic
        // }

        // Just load the data directly (no seeding)
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

        // DISABLED: No longer seeding armory demo
        // Initialize Armory with demo loadouts and squads
        // try {
        //   await seedArmoryDemo();
        // } catch (armoryError) {
        //   console.error('Failed to seed armory demo:', armoryError);
        // }

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsInitialized(true); // Set anyway to avoid infinite loading
      }
    }

    initApp();
  }, []);

  return { isInitialized, isSeeded };
}
