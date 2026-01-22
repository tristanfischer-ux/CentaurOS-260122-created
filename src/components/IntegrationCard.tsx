/**
 * Integration Card Component
 * Display integration with connect/disconnect actions
 */

import { View, Text } from 'react-native';
import { useState } from 'react';
import { Check, ExternalLink, Settings2 } from 'lucide-react-native';
import { HapticPressable } from './HapticPressable';
import { showToast } from './ToastContainer';
import { useIntegrationsStore } from '@/lib/state/integrations-store';
import type { Integration } from '@/lib/integrations';

// Default workspaceId for demo company
const DEFAULT_WORKSPACE_ID = 'workspace-demo-company';

interface IntegrationCardProps {
  integration: Integration;
  onPress: () => void;
}

export function IntegrationCard({ integration, onPress }: IntegrationCardProps) {
  const { isIntegrationConnected } = useIntegrationsStore();
  const isConnected = isIntegrationConnected(DEFAULT_WORKSPACE_ID, integration.id);

  const getStatusBadge = () => {
    if (isConnected) {
      return (
        <View className="flex-row items-center bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded">
          <Check size={14} color="#10b981" />
          <Text className="text-emerald-700 dark:text-emerald-400 text-xs font-semibold ml-1">
            Connected
          </Text>
        </View>
      );
    }

    if (integration.status === 'coming-soon') {
      return (
        <View className="bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded">
          <Text className="text-gray-600 dark:text-slate-400 text-xs font-semibold">
            Coming Soon
          </Text>
        </View>
      );
    }

    return null;
  };

  const getPricingBadge = () => {
    const colors = {
      free: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      paid: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
      freemium: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
    };

    return (
      <View className={`${colors[integration.pricing]} px-2 py-1 rounded`}>
        <Text className={`${colors[integration.pricing].split(' ')[2]} text-xs font-semibold capitalize`}>
          {integration.pricing}
        </Text>
      </View>
    );
  };

  return (
    <HapticPressable
      onPress={onPress}
      disabled={integration.status === 'coming-soon'}
      className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-300 dark:border-slate-800 mb-3 ${
        integration.status === 'coming-soon' ? 'opacity-60' : 'active:opacity-70'
      }`}
    >
      {/* Header */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-row items-center flex-1">
          <View
            className="w-12 h-12 rounded-xl items-center justify-center mr-3"
            style={{ backgroundColor: integration.color + '20' }}
          >
            <Text className="text-2xl">{integration.icon}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-gray-900 dark:text-white text-lg font-bold mb-1">
              {integration.name}
            </Text>
            <Text className="text-gray-600 dark:text-slate-400 text-xs">
              {integration.category}
            </Text>
          </View>
        </View>
        <View className="flex-col items-end gap-2">
          {getStatusBadge()}
          {getPricingBadge()}
        </View>
      </View>

      {/* Description */}
      <Text className="text-gray-700 dark:text-slate-300 text-sm leading-6 mb-4">
        {integration.description}
      </Text>

      {/* Features */}
      <View className="mb-4">
        <Text className="text-gray-900 dark:text-white text-sm font-semibold mb-2">
          Features:
        </Text>
        <View className="gap-1">
          {integration.features.slice(0, 3).map((feature, idx) => (
            <View key={idx} className="flex-row items-start">
              <Text className="text-emerald-500 text-xs mr-2">✓</Text>
              <Text className="text-gray-600 dark:text-slate-400 text-xs flex-1">
                {feature}
              </Text>
            </View>
          ))}
          {integration.features.length > 3 && (
            <Text className="text-gray-500 dark:text-slate-500 text-xs mt-1">
              +{integration.features.length - 3} more features
            </Text>
          )}
        </View>
      </View>

      {/* Action Button */}
      {integration.status === 'available' && (
        <View className="flex-row items-center justify-between pt-3 border-t border-gray-200 dark:border-slate-800">
          <HapticPressable
            onPress={(e) => {
              e.stopPropagation();
              // Open website
              showToast.info('Opening ' + integration.name);
            }}
            className="flex-row items-center"
          >
            <ExternalLink size={14} color="#64748b" />
            <Text className="text-gray-600 dark:text-slate-400 text-xs ml-1">Learn More</Text>
          </HapticPressable>

          {isConnected && (
            <HapticPressable
              onPress={(e) => {
                e.stopPropagation();
                onPress();
              }}
              className="flex-row items-center"
            >
              <Settings2 size={14} color="#3b82f6" />
              <Text className="text-blue-500 text-xs font-semibold ml-1">Configure</Text>
            </HapticPressable>
          )}
        </View>
      )}
    </HapticPressable>
  );
}
