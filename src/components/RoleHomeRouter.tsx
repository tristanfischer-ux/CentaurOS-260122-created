/**
 * Role-Based Home Screen Router
 * Renders the appropriate home dashboard based on user's active role
 */

import { useEffect } from 'react';
import { useRoleStore, useActiveRole } from '@/lib/state/role-store';

// Role-specific home components
import { ApprenticeHome } from '@/components/ApprenticeHome';
import { ExecutiveHome } from '@/components/ExecutiveHome';

// The Founder home is the original MissionControlHome - we import it dynamically
// to avoid circular dependencies, or we render it inline

interface RoleHomeRouterProps {
  FounderHome: React.ComponentType;
}

export function RoleHomeRouter({ FounderHome }: RoleHomeRouterProps) {
  const activeRole = useActiveRole();
  const initialize = useRoleStore((s) => s.initialize);

  // Initialize role store on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Render appropriate home based on role
  switch (activeRole) {
    case 'Apprentice':
      return <ApprenticeHome />;
    case 'FractionalExec':
      return <ExecutiveHome />;
    case 'Founder':
    default:
      return <FounderHome />;
  }
}
