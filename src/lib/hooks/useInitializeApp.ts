// App initialization and data loading hook

import { useEffect, useState } from 'react';
import { useAppStore } from '../state/app-store';
import { db } from '../storage';
import { seedDemoData } from '../api/seed';

export function useInitializeApp() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSeeded, setIsSeeded] = useState(false);
  const initialize = useAppStore((s) => s.initialize);
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
        // Initialize auth state
        await initialize();

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

        // Check if we need to seed demo data
        const hasUsers = Object.keys(users).length > 0;

        if (!hasUsers) {
          console.log('No existing data found, seeding demo workspace...');
          await seedDemoData();

          // Reload data after seeding
          const [
            newWorkspaces,
            newMemberships,
            newUsers,
            newObjectives,
            newKeyResults,
            newMetricEvents,
            newProjects,
            newTasks,
            newTaskComments,
            newTimeEntries,
            newReviews,
            newWeeklyPacks,
            newTemplates,
            newAuditLogs,
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

          setWorkspaces(newWorkspaces);
          setMemberships(newMemberships);
          setUsers(newUsers);
          setObjectives(newObjectives);
          setKeyResults(newKeyResults);
          setMetricEvents(newMetricEvents);
          setProjects(newProjects);
          setTasks(newTasks);
          setTaskComments(newTaskComments);
          setTimeEntries(newTimeEntries);
          setReviews(newReviews);
          setWeeklyPacks(newWeeklyPacks);
          setTemplates(newTemplates);
          setAuditLogs(newAuditLogs);
          setIsSeeded(true);
        } else {
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
        }

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
