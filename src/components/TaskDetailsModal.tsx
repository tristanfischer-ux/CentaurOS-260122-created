import { View, Text, Modal, Pressable, ScrollView } from 'react-native';
import { X, Clock, DollarSign, Users, CheckCircle2, AlertTriangle, Calendar, FileText } from 'lucide-react-native';
import { type WorkPlan } from '@/lib/state/work-plan-store';
import { type OrganizationMember } from '@/lib/organization-seed';
import { useOrganizationStore } from '@/lib/state/organization-store';
import type { Function as BusinessFunction } from '@/types';

interface TaskDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  task: WorkPlan | null;
}

const FUNCTION_COLORS: Record<BusinessFunction, string> = {
  Marketing: '#ec4899',
  Sales: '#8b5cf6',
  Engineering: '#f59e0b',
  Ops: '#3b82f6',
  Finance: '#10b981',
  Admin: '#6366f1',
};

export function TaskDetailsModal({ visible, onClose, task }: TaskDetailsModalProps) {
  const members = useOrganizationStore(s => s.members);

  if (!task) return null;

  const functionColor = FUNCTION_COLORS[task.function as BusinessFunction] || '#6366f1';
  const isCompleted = task.status === 'completed';
  const isAbandoned = task.status === 'abandoned';

  // Get assigned members
  const assignedMembers = task.allocations
    .map(alloc => members.find(m => m.id === alloc.memberId))
    .filter((m): m is OrganizationMember => m !== undefined);

  // Calculate costs
  const totalCost = task.auditRecord?.totalCost ||
    task.allocations.reduce((sum, a) => sum + (a.squaresPerWeek * a.costPerSquare), 0);

  const aiCost = task.appliedAITools.reduce((sum, ai) =>
    sum + (ai.costPerSquare * task.estimatedTimeUnits), 0
  );

  const formattedDate = task.auditRecord?.completedAt || task.auditRecord?.abandonedAt
    ? new Date(task.auditRecord.completedAt || task.auditRecord.abandonedAt || '').toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : task.lastSubmittedAt
    ? new Date(task.lastSubmittedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    : 'N/A';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/70"
        onPress={onClose}
      >
        <View className="flex-1" />
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 rounded-t-3xl"
          style={{ maxHeight: '95%' }}
        >
          {/* Header */}
          <View
            className="px-5 pt-5 pb-4 rounded-t-3xl"
            style={{ backgroundColor: functionColor + '20' }}
          >
            <View className="flex-row items-start justify-between mb-3">
              <View className="flex-1 mr-3">
                <View className="flex-row items-center mb-2">
                  <View
                    className="px-2 py-1 rounded-lg mr-2"
                    style={{ backgroundColor: functionColor + '40' }}
                  >
                    <Text className="text-xs font-bold" style={{ color: functionColor }}>
                      {task.function}
                    </Text>
                  </View>
                  {isCompleted && (
                    <View className="flex-row items-center bg-emerald-500/20 px-2 py-1 rounded-lg">
                      <CheckCircle2 size={12} color="#10b981" />
                      <Text className="text-emerald-700 dark:text-emerald-300 text-xs font-bold ml-1">
                        COMPLETED
                      </Text>
                    </View>
                  )}
                  {isAbandoned && (
                    <View className="flex-row items-center bg-red-500/20 px-2 py-1 rounded-lg">
                      <AlertTriangle size={12} color="#ef4444" />
                      <Text className="text-red-700 dark:text-red-300 text-xs font-bold ml-1">
                        ABANDONED
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="text-gray-900 dark:text-white text-xl font-bold">
                  {task.title}
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                className="w-10 h-10 bg-white dark:bg-slate-900 rounded-full items-center justify-center active:opacity-70"
              >
                <X size={20} color="#6b7280" />
              </Pressable>
            </View>

            <View className="flex-row items-center">
              <Calendar size={14} color={functionColor} />
              <Text className="text-gray-700 dark:text-slate-300 text-sm ml-2">
                {isCompleted ? 'Completed' : isAbandoned ? 'Abandoned' : 'Last updated'}: {formattedDate}
              </Text>
            </View>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            {/* Description */}
            <View className="px-5 py-4 border-b border-gray-200 dark:border-slate-700">
              <View className="flex-row items-center mb-2">
                <FileText size={16} color="#6b7280" />
                <Text className="text-gray-900 dark:text-white font-semibold ml-2">
                  Description
                </Text>
              </View>
              <Text className="text-gray-600 dark:text-slate-400 text-sm leading-relaxed">
                {task.description}
              </Text>
            </View>

            {/* Function/Category */}
            <View className="px-5 py-4 border-b border-gray-200 dark:border-slate-700">
              <Text className="text-gray-500 dark:text-slate-400 text-xs mb-1">
                CATEGORY
              </Text>
              <Text className="text-gray-900 dark:text-white font-semibold">
                {task.function}
              </Text>
            </View>

            {/* Effort & Cost Summary */}
            <View className="px-5 py-4 bg-gray-50 dark:bg-slate-900/50">
              <Text className="text-gray-900 dark:text-white font-semibold mb-3">
                Effort & Cost Summary
              </Text>
              <View className="gap-3">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Clock size={16} color="#6b7280" />
                    <Text className="text-gray-600 dark:text-slate-400 text-sm ml-2">
                      Total TUs Required
                    </Text>
                  </View>
                  <Text className="text-gray-900 dark:text-white font-bold">
                    {task.estimatedTimeUnits}□ ({task.estimatedTimeUnits * 4}h)
                  </Text>
                </View>

                {task.tusExpended > 0 && (
                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm ml-6">
                      TUs Expended
                    </Text>
                    <Text className={`font-bold ${
                      isCompleted ? 'text-emerald-600' : 'text-amber-600'
                    }`}>
                      {task.tusExpended}□
                    </Text>
                  </View>
                )}

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <DollarSign size={16} color="#6b7280" />
                    <Text className="text-gray-600 dark:text-slate-400 text-sm ml-2">
                      Total Cost
                    </Text>
                  </View>
                  <Text className="text-gray-900 dark:text-white font-bold">
                    £{totalCost.toLocaleString()}
                  </Text>
                </View>

                {aiCost > 0 && (
                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm ml-6">
                      AI Cost
                    </Text>
                    <Text className="text-purple-600 dark:text-purple-400 font-bold">
                      £{aiCost.toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Team Members */}
            {assignedMembers.length > 0 && (
              <View className="px-5 py-4 border-b border-gray-200 dark:border-slate-700">
                <View className="flex-row items-center mb-3">
                  <Users size={16} color="#6b7280" />
                  <Text className="text-gray-900 dark:text-white font-semibold ml-2">
                    Team Members ({assignedMembers.length})
                  </Text>
                </View>
                <View className="gap-2">
                  {assignedMembers.map((member, idx) => {
                    const allocation = task.allocations.find(a => a.memberId === member.id);
                    return (
                      <View
                        key={member.id}
                        className="flex-row items-center justify-between bg-white dark:bg-slate-900 rounded-lg p-3"
                      >
                        <View className="flex-row items-center flex-1">
                          <View
                            className="w-8 h-8 rounded-full items-center justify-center mr-3"
                            style={{
                              backgroundColor: member.role === 'Founder' ? '#8b5cf620' :
                                              member.role === 'FractionalExec' ? '#3b82f620' : '#10b98120'
                            }}
                          >
                            <Text
                              className="text-xs font-bold"
                              style={{
                                color: member.role === 'Founder' ? '#8b5cf6' :
                                       member.role === 'FractionalExec' ? '#3b82f6' : '#10b981'
                              }}
                            >
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </Text>
                          </View>
                          <View className="flex-1">
                            <Text className="text-gray-900 dark:text-white font-semibold text-sm">
                              {member.name}
                            </Text>
                            <Text className="text-gray-500 dark:text-slate-400 text-xs">
                              {member.role === 'FractionalExec' ? 'Exec' : member.role}
                            </Text>
                          </View>
                        </View>
                        <View className="items-end">
                          <Text className="text-gray-900 dark:text-white font-bold">
                            {allocation?.squaresPerWeek || 0}□/wk
                          </Text>
                          <Text className="text-gray-500 dark:text-slate-400 text-xs">
                            £{allocation?.costPerSquare || 0}/□
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* AI Tools */}
            {task.appliedAITools.length > 0 && (
              <View className="px-5 py-4 border-b border-gray-200 dark:border-slate-700">
                <Text className="text-gray-900 dark:text-white font-semibold mb-3">
                  AI Productivity Tools
                </Text>
                {task.appliedAITools.map((ai) => (
                  <View
                    key={ai.toolId}
                    className="bg-purple-50 dark:bg-purple-900/10 rounded-lg p-3 mb-2"
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="text-purple-700 dark:text-purple-300 font-semibold">
                        {ai.toolName}
                      </Text>
                      <Text className="text-purple-600 dark:text-purple-400 font-bold">
                        {ai.multiplier}x multiplier
                      </Text>
                    </View>
                    <Text className="text-purple-600 dark:text-purple-400 text-xs mt-1">
                      £{ai.costPerSquare}/□
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Abandonment Reason */}
            {isAbandoned && task.auditRecord?.reason && (
              <View className="px-5 py-4 bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500">
                <View className="flex-row items-start">
                  <AlertTriangle size={16} color="#ef4444" />
                  <View className="ml-2 flex-1">
                    <Text className="text-red-900 dark:text-red-100 font-semibold mb-1">
                      Abandonment Reason
                    </Text>
                    <Text className="text-red-700 dark:text-red-300 text-sm">
                      {task.auditRecord.reason}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Feedback */}
            {task.feedback && (
              <View className="px-5 py-4 bg-blue-50 dark:bg-blue-900/10">
                <Text className="text-blue-900 dark:text-blue-100 font-semibold mb-2">
                  Feedback
                </Text>
                <Text className="text-blue-700 dark:text-blue-300 text-sm">
                  {task.feedback}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Close Button */}
          <View className="px-5 py-3 border-t border-gray-200 dark:border-slate-700">
            <Pressable
              onPress={onClose}
              className="bg-gray-900 dark:bg-white py-2.5 rounded-xl active:opacity-70"
            >
              <Text className="text-white dark:text-gray-900 text-center font-semibold">
                Close
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
