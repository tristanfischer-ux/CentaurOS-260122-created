/**
 * Integrations Marketplace Screen
 * Browse and manage third-party integrations
 */

import { View, Text, TextInput, Modal, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, Search, Plug, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HapticPressable } from '@/components/HapticPressable';
import { IntegrationCard } from '@/components/IntegrationCard';
import { EmptyState } from '@/components/EmptyState';
import { showToast } from '@/components/ToastContainer';
import { useIntegrationsStore } from '@/lib/state/integrations-store';
import {
  INTEGRATIONS,
  getAllCategories,
  getIntegrationById,
  type Integration,
  type IntegrationCategory,
} from '@/lib/integrations';
import { successNotification } from '@/lib/haptics';

// Default workspaceId for demo company
const DEFAULT_WORKSPACE_ID = 'workspace-demo-company';

export default function IntegrationsScreen() {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<IntegrationCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});

  const {
    connectedIntegrations,
    isConnecting,
    connectIntegration,
    disconnectIntegration,
    isIntegrationConnected,
  } = useIntegrationsStore();

  const categories: Array<IntegrationCategory | 'All'> = ['All', ...getAllCategories()];

  const filteredIntegrations = INTEGRATIONS.filter((integration) => {
    const matchesCategory = selectedCategory === 'All' || integration.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleIntegrationPress = (integration: Integration) => {
    if (integration.status === 'coming-soon') {
      showToast.info('Coming Soon', `${integration.name} integration is not yet available`);
      return;
    }

    if (isIntegrationConnected(DEFAULT_WORKSPACE_ID, integration.id)) {
      // Show disconnect option
      Alert.alert(
        integration.name,
        'This integration is connected. Would you like to disconnect it?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disconnect',
            style: 'destructive',
            onPress: async () => {
              try {
                await disconnectIntegration(DEFAULT_WORKSPACE_ID, integration.id);
                await successNotification();
                showToast.success('Disconnected', `${integration.name} has been disconnected`);
              } catch (error) {
                showToast.error('Error', 'Failed to disconnect integration');
              }
            },
          },
        ]
      );
    } else {
      // Show connect modal
      setSelectedIntegration(integration);
      setConfigValues({});
      setShowConnectModal(true);
    }
  };

  const handleConnect = async () => {
    if (!selectedIntegration) return;

    // Validate required fields
    const missingFields = selectedIntegration.requiredFields?.filter(
      (field) => field.required && !configValues[field.name]
    );

    if (missingFields && missingFields.length > 0) {
      showToast.error('Missing Fields', 'Please fill in all required fields');
      return;
    }

    try {
      await connectIntegration(DEFAULT_WORKSPACE_ID, selectedIntegration, configValues);
      await successNotification();
      showToast.success('Connected!', `${selectedIntegration.name} is now connected`);
      setShowConnectModal(false);
      setSelectedIntegration(null);
      setConfigValues({});
    } catch (error) {
      showToast.error('Error', 'Failed to connect integration');
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-slate-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-300 dark:border-slate-700">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <HapticPressable
              onPress={() => router.back()}
              className="mr-4 w-10 h-10 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-900 active:opacity-70"
            >
              <ArrowLeft size={20} color="#64748b" />
            </HapticPressable>
            <View className="flex-row items-center gap-2">
              <Plug size={24} color="#3b82f6" />
              <Text className="text-gray-900 dark:text-white text-2xl font-bold">
                Integrations
              </Text>
            </View>
          </View>
          {connectedIntegrations.length > 0 && (
            <View className="bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full">
              <Text className="text-blue-700 dark:text-blue-400 text-sm font-bold">
                {connectedIntegrations.length} connected
              </Text>
            </View>
          )}
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-gray-100 dark:bg-slate-900 rounded-xl px-4 py-3 mb-3">
          <Search size={20} color="#94a3b8" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search integrations..."
            placeholderTextColor="#94a3b8"
            className="flex-1 ml-3 text-gray-900 dark:text-white"
          />
        </View>

        {/* Category Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
          {categories.map((category) => (
            <HapticPressable
              key={category}
              onPress={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg mr-2 ${
                selectedCategory === category
                  ? 'bg-blue-500'
                  : 'bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700'
              }`}
            >
              <Text
                className={`font-semibold text-sm ${
                  selectedCategory === category
                    ? 'text-white'
                    : 'text-gray-700 dark:text-slate-300'
                }`}
              >
                {category}
              </Text>
            </HapticPressable>
          ))}
        </ScrollView>
      </View>

      {/* Integrations List */}
      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
        {filteredIntegrations.length === 0 ? (
          <EmptyState
            icon={Plug}
            title="No integrations found"
            description="Try adjusting your search or category filter"
            iconColor="#64748b"
          />
        ) : (
          filteredIntegrations.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              onPress={() => handleIntegrationPress(integration)}
            />
          ))
        )}
        <View className="h-8" />
      </ScrollView>

      {/* Connect Modal */}
      {showConnectModal && selectedIntegration && (
        <Modal
          visible={showConnectModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowConnectModal(false)}
        >
          <View className="flex-1 bg-black/50">
            <View className="flex-1" />
            <View
              className="bg-white dark:bg-slate-950 rounded-t-3xl p-6"
              style={{ paddingBottom: insets.bottom + 24 }}
            >
              {/* Modal Header */}
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-gray-900 dark:text-white text-2xl font-bold">
                  Connect {selectedIntegration.name}
                </Text>
                <HapticPressable
                  onPress={() => setShowConnectModal(false)}
                  className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-900"
                >
                  <X size={20} color="#64748b" />
                </HapticPressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} className="max-h-96">
                {/* Setup Instructions */}
                {selectedIntegration.setupInstructions && (
                  <View className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-4 border border-blue-200 dark:border-blue-800">
                    <Text className="text-blue-700 dark:text-blue-400 text-sm leading-6">
                      {selectedIntegration.setupInstructions}
                    </Text>
                  </View>
                )}

                {/* Configuration Fields */}
                {selectedIntegration.requiredFields?.map((field) => (
                  <View key={field.name} className="mb-4">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-2">
                      {field.name.replace('_', ' ').toUpperCase()}
                      {field.required && <Text className="text-red-500"> *</Text>}
                    </Text>
                    <TextInput
                      value={configValues[field.name] || ''}
                      onChangeText={(value) =>
                        setConfigValues({ ...configValues, [field.name]: value })
                      }
                      placeholder={field.placeholder}
                      placeholderTextColor="#94a3b8"
                      secureTextEntry={field.type === 'password'}
                      autoCapitalize="none"
                      className="bg-gray-100 dark:bg-slate-900 rounded-xl px-4 py-3 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-700"
                    />
                  </View>
                ))}
              </ScrollView>

              {/* Connect Button */}
              <HapticPressable
                onPress={handleConnect}
                disabled={isConnecting}
                hapticType="medium"
                className={`bg-blue-500 rounded-xl py-4 items-center mt-6 ${
                  isConnecting ? 'opacity-50' : 'active:opacity-80'
                }`}
              >
                <Text className="text-white font-bold text-lg">
                  {isConnecting ? 'Connecting...' : 'Connect Integration'}
                </Text>
              </HapticPressable>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
