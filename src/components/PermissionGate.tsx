/**
 * PermissionGate Component
 *
 * Conditionally renders children based on the current user's permissions.
 * Use this to hide UI elements that certain roles shouldn't see.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { usePermissions, type RolePermissions } from '@/lib/permissions';
import { Lock } from 'lucide-react-native';

interface PermissionGateProps {
  /**
   * The permission key to check
   */
  permission: keyof RolePermissions;

  /**
   * Children to render if permission is granted
   */
  children: React.ReactNode;

  /**
   * Optional fallback content if permission is denied
   * If not provided, nothing is rendered
   */
  fallback?: React.ReactNode;

  /**
   * If true, shows a "restricted" message instead of hiding completely
   */
  showRestricted?: boolean;
}

export function PermissionGate({
  permission,
  children,
  fallback,
  showRestricted = false,
}: PermissionGateProps) {
  const permissions = usePermissions();

  // Check if the specific permission is granted
  const hasPermission = permissions[permission] === true;

  if (hasPermission) {
    return <>{children}</>;
  }

  // If fallback is provided, render it
  if (fallback !== undefined) {
    return <>{fallback}</>;
  }

  // If showRestricted is true, show a restricted message
  if (showRestricted) {
    return (
      <View className="bg-gray-100 dark:bg-slate-800 rounded-xl p-4 items-center justify-center">
        <Lock size={20} color="#94a3b8" />
        <Text className="text-gray-500 dark:text-slate-400 text-sm mt-2 text-center">
          This section is restricted
        </Text>
      </View>
    );
  }

  // Default: render nothing
  return null;
}

/**
 * Hook to check a specific permission
 */
export function useHasPermission(permission: keyof RolePermissions): boolean {
  const permissions = usePermissions();
  return permissions[permission] === true;
}

/**
 * Component to hide cost information from non-founders
 */
export function CostGate({ children }: { children: React.ReactNode }) {
  return (
    <PermissionGate permission="canViewPersonnelCosts">
      {children}
    </PermissionGate>
  );
}

/**
 * Component to hide financial metrics from non-founders
 */
export function FinancialGate({ children }: { children: React.ReactNode }) {
  return (
    <PermissionGate permission="canViewFinancialMetrics">
      {children}
    </PermissionGate>
  );
}

/**
 * Component to show content only to founders
 */
export function FounderOnly({ children }: { children: React.ReactNode }) {
  const { role } = usePermissions();
  if (role !== 'Founder') return null;
  return <>{children}</>;
}

/**
 * Component to show content only to executives and founders
 */
export function ExecOrHigher({ children }: { children: React.ReactNode }) {
  const { role } = usePermissions();
  if (role !== 'Founder' && role !== 'FractionalExec') return null;
  return <>{children}</>;
}

/**
 * Component to show content only to apprentices
 */
export function ApprenticeOnly({ children }: { children: React.ReactNode }) {
  const { role } = usePermissions();
  if (role !== 'Apprentice') return null;
  return <>{children}</>;
}
