/**
 * ApprovalHistoryModal Component
 *
 * Shows approval history and owner details for suppliers and AI tools
 */

import { View, Text, Modal, Pressable, ScrollView } from 'react-native';
import { X, CheckCircle, User, Calendar } from 'lucide-react-native';
import { useResourceOwnershipStore, type ResourceOwnership } from '@/lib/state/resource-ownership-store';

interface ApprovalHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  ownership: ResourceOwnership | null;
}

export function ApprovalHistoryModal({ visible, onClose, ownership }: ApprovalHistoryModalProps) {
  const getApprovalHistory = useResourceOwnershipStore(s => s.getApprovalHistory);

  if (!ownership) return null;

  const approvalHistory = getApprovalHistory(ownership.id);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Founder':
        return 'bg-purple-500';
      case 'FractionalExec':
        return 'bg-blue-500';
      case 'Apprentice':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'FractionalExec':
        return 'Fractional Executive';
      default:
        return role;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white dark:bg-slate-950 rounded-t-3xl max-h-[85%]">
          {/* Header */}
          <View className="flex-row items-center justify-between p-5 border-b border-gray-200 dark:border-slate-800">
            <View className="flex-1">
              <Text className="text-gray-900 dark:text-white font-bold text-xl">
                Resource Details
              </Text>
              <Text className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">
                {ownership.resourceName}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              className="w-9 h-9 bg-gray-100 dark:bg-slate-800 rounded-full items-center justify-center active:opacity-70"
            >
              <X size={20} color="#64748b" />
            </Pressable>
          </View>

          {/* Content */}
          <ScrollView className="px-5 py-4" showsVerticalScrollIndicator={false}>
            {/* Resource Info */}
            <View className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-gray-500 dark:text-slate-400 text-xs font-bold tracking-wide">
                  RESOURCE TYPE
                </Text>
                <View
                  className={`px-3 py-1 rounded-full ${
                    ownership.resourceType === 'ai_tool' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-orange-100 dark:bg-orange-900/30'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      ownership.resourceType === 'ai_tool' ? 'text-blue-700 dark:text-blue-300' : 'text-orange-700 dark:text-orange-300'
                    }`}
                  >
                    {ownership.resourceType === 'ai_tool' ? 'AI Tool' : 'Supplier'}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between">
                <Text className="text-gray-500 dark:text-slate-400 text-xs font-bold tracking-wide">
                  STATUS
                </Text>
                <View
                  className={`px-3 py-1 rounded-full ${
                    ownership.isActive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      ownership.isActive ? 'text-green-700 dark:text-green-300' : 'text-gray-500 dark:text-slate-400'
                    }`}
                  >
                    {ownership.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Owner Info */}
            <View className="mb-4">
              <Text className="text-gray-500 dark:text-slate-400 text-xs font-bold tracking-wide mb-3">
                RESPONSIBLE PERSON
              </Text>
              <View className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4">
                <View className="flex-row items-center">
                  <View className={`w-12 h-12 ${getRoleColor(ownership.ownerRole)} rounded-full items-center justify-center`}>
                    <User size={24} color="#fff" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-gray-900 dark:text-white font-semibold text-base">
                      {ownership.ownerName}
                    </Text>
                    <Text className="text-gray-500 dark:text-slate-400 text-sm">
                      {getRoleLabel(ownership.ownerRole)}
                    </Text>
                  </View>
                </View>

                <View className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-800">
                  <View className="flex-row items-center">
                    <Calendar size={14} color="#9ca3af" />
                    <Text className="text-gray-500 dark:text-slate-400 text-xs ml-2">
                      Assigned on {formatDate(ownership.assignedAt)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Approval History */}
            <View className="mb-6">
              <Text className="text-gray-500 dark:text-slate-400 text-xs font-bold tracking-wide mb-3">
                APPROVAL HISTORY
              </Text>

              {approvalHistory.length === 0 ? (
                <View className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4">
                  <Text className="text-gray-500 dark:text-slate-400 text-sm text-center">
                    No approval history yet
                  </Text>
                </View>
              ) : (
                <View className="gap-3">
                  {approvalHistory.map((approval, index) => (
                    <View
                      key={index}
                      className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4"
                    >
                      <View className="flex-row items-start">
                        <View className="w-10 h-10 bg-green-500 rounded-full items-center justify-center">
                          <CheckCircle size={20} color="#fff" />
                        </View>
                        <View className="ml-3 flex-1">
                          <View className="flex-row items-center justify-between mb-1">
                            <Text className="text-gray-900 dark:text-white font-semibold text-sm">
                              {approval.approvedByName}
                            </Text>
                            <Text className="text-gray-500 dark:text-slate-400 text-xs">
                              {formatDate(approval.approvedAt)}
                            </Text>
                          </View>
                          <Text className="text-gray-500 dark:text-slate-400 text-xs mb-2">
                            {getRoleLabel(approval.approvedByRole)}
                          </Text>
                          {approval.notes && (
                            <View className="bg-white dark:bg-slate-950 rounded-lg p-2 mt-1">
                              <Text className="text-gray-700 dark:text-slate-300 text-xs">
                                {approval.notes}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
