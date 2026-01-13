import { View, Text, ScrollView, Pressable, Modal } from 'react-native';
import React, { useState } from 'react';
import { X, Mail, Phone, Bot, Briefcase, Award, Building2, DollarSign, Clock, Star } from 'lucide-react-native';
import { ORGANIZATION_MEMBERS, AI_AGENTS, type OrganizationMember } from '@/lib/organization-seed';
import { fractionalExecutives, apprentices, type Candidate } from '@/lib/candidates-seed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import type { Function as BusinessFunction } from '@/types';

const BUSINESS_FUNCTIONS: BusinessFunction[] = ['Marketing', 'Sales', 'Engineering', 'Ops', 'Finance', 'Admin'];

export default function OrgDiagramScreen() {
  const insets = useSafeAreaInsets();
  const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showAISection, setShowAISection] = useState(false);

  // Group members by function
  const getMembersByFunction = (func: BusinessFunction) => {
    const execs = ORGANIZATION_MEMBERS.filter(m => m.role === 'FractionalExec' && m.function === func);
    const apps = ORGANIZATION_MEMBERS.filter(m => m.role === 'Apprentice' && m.function === func);
    return { execs, apprentices: apps };
  };

  const getFunctionColor = (func: BusinessFunction) => {
    switch (func) {
      case 'Marketing': return '#f59e0b';
      case 'Sales': return '#ec4899';
      case 'Engineering': return '#3b82f6';
      case 'Ops': return '#8b5cf6';
      case 'Finance': return '#10b981';
      case 'Admin': return '#64748b';
      default: return '#64748b';
    }
  };

  const handleMemberClick = (member: OrganizationMember) => {
    setSelectedMember(member);
    setShowMemberModal(true);
  };

  // Get marketplace data for the member
  const getMarketplaceData = (member: OrganizationMember) => {
    if (member.role === 'FractionalExec') {
      return fractionalExecutives.find(e => e.name === member.name);
    } else if (member.role === 'Apprentice') {
      return apprentices.find(a => a.name === member.name);
    }
    return null;
  };

  const founders = ORGANIZATION_MEMBERS.filter(m => m.role === 'Founder');

  return (
    <View className="flex-1 bg-white dark:bg-slate-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-300 dark:border-slate-800">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-1">
            <Text className="text-gray-900 dark:text-white text-2xl font-bold">Organization</Text>
            <Text className="text-gray-600 dark:text-slate-400 text-sm mt-0.5">
              Team structure by business function
            </Text>
          </View>
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-900 active:opacity-70"
          >
            <X size={24} color="#64748b" />
          </Pressable>
        </View>

        {/* Summary Stats */}
        <View className="flex-row gap-3 mt-3">
          <View className="flex-1 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-200 dark:border-blue-800">
            <Text className="text-blue-700 dark:text-blue-300 text-xs mb-1">Executives</Text>
            <Text className="text-blue-900 dark:text-blue-100 text-2xl font-bold">
              {ORGANIZATION_MEMBERS.filter(m => m.role === 'FractionalExec').length}
            </Text>
          </View>
          <View className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800">
            <Text className="text-emerald-700 dark:text-emerald-300 text-xs mb-1">Apprentices</Text>
            <Text className="text-emerald-900 dark:text-emerald-100 text-2xl font-bold">
              {ORGANIZATION_MEMBERS.filter(m => m.role === 'Apprentice').length}
            </Text>
          </View>
          <View className="flex-1 bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 border border-purple-200 dark:border-purple-800">
            <Text className="text-purple-700 dark:text-purple-300 text-xs mb-1">AI Agents</Text>
            <Text className="text-purple-900 dark:text-purple-100 text-2xl font-bold">
              {AI_AGENTS.length}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-4">
          {/* Founders Section */}
          <View className="mb-6">
            <Text className="text-gray-900 dark:text-white text-lg font-bold mb-3">Founders</Text>
            <View className="gap-3">
              {founders.map(founder => (
                <Pressable
                  key={founder.id}
                  onPress={() => handleMemberClick(founder)}
                  className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 rounded-xl p-4 active:opacity-70"
                >
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 rounded-full bg-blue-500 items-center justify-center">
                      <Text className="text-white text-lg font-bold">
                        {founder.name.split(' ').map(n => n[0]).join('')}
                      </Text>
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-blue-900 dark:text-blue-100 font-bold text-base">
                        {founder.name}
                      </Text>
                      <Text className="text-blue-700 dark:text-blue-300 text-sm">
                        Founder • {founder.function}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Business Functions */}
          <Text className="text-gray-900 dark:text-white text-lg font-bold mb-3">By Business Function</Text>

          {BUSINESS_FUNCTIONS.map(func => {
            const { execs, apprentices: apps } = getMembersByFunction(func);
            const color = getFunctionColor(func);
            const totalCount = execs.length + apps.length;

            if (totalCount === 0) return null;

            return (
              <View key={func} className="mb-4">
                <View
                  className="rounded-xl p-4 border-2 mb-3"
                  style={{
                    backgroundColor: `${color}10`,
                    borderColor: `${color}40`,
                  }}
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <View>
                      <Text className="text-gray-900 dark:text-white text-base font-bold">
                        {func}
                      </Text>
                      <Text className="text-gray-600 dark:text-slate-400 text-xs mt-0.5">
                        {execs.length} Executive{execs.length !== 1 ? 's' : ''} • {apps.length} Apprentice{apps.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center"
                      style={{ backgroundColor: `${color}30` }}
                    >
                      <Text className="font-bold" style={{ color }}>
                        {totalCount}
                      </Text>
                    </View>
                  </View>

                  {/* Executives in this function */}
                  {execs.length > 0 && (
                    <View className="mb-3">
                      <Text className="text-gray-700 dark:text-slate-300 text-xs font-semibold mb-2">
                        EXECUTIVES
                      </Text>
                      <View className="gap-2">
                        {execs.map(exec => (
                          <Pressable
                            key={exec.id}
                            onPress={() => handleMemberClick(exec)}
                            className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-gray-300 dark:border-slate-800 active:opacity-70"
                          >
                            <View className="flex-row items-center justify-between">
                              <View className="flex-row items-center flex-1">
                                <View className="w-8 h-8 rounded-full bg-purple-500 items-center justify-center">
                                  <Text className="text-white text-xs font-bold">
                                    {exec.name.split(' ').map(n => n[0]).join('')}
                                  </Text>
                                </View>
                                <Text className="text-gray-900 dark:text-white font-semibold text-sm ml-2">
                                  {exec.name}
                                </Text>
                              </View>
                              <View className="flex-row items-center">
                                <Text className="text-gray-600 dark:text-slate-400 text-xs mr-2">
                                  £{((exec.costPerDay || 0) * 22 / 1000).toFixed(1)}K/mo
                                </Text>
                                <Briefcase size={14} color="#8b5cf6" />
                              </View>
                            </View>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Apprentices in this function */}
                  {apps.length > 0 && (
                    <View>
                      <Text className="text-gray-700 dark:text-slate-300 text-xs font-semibold mb-2">
                        APPRENTICES
                      </Text>
                      <View className="gap-2">
                        {apps.map(app => (
                          <Pressable
                            key={app.id}
                            onPress={() => handleMemberClick(app)}
                            className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-gray-300 dark:border-slate-800 active:opacity-70"
                          >
                            <View className="flex-row items-center justify-between">
                              <View className="flex-row items-center flex-1">
                                <View className="w-8 h-8 rounded-full bg-emerald-500 items-center justify-center">
                                  <Text className="text-white text-xs font-bold">
                                    {app.name.split(' ').map(n => n[0]).join('')}
                                  </Text>
                                </View>
                                <Text className="text-gray-900 dark:text-white font-semibold text-sm ml-2">
                                  {app.name}
                                </Text>
                              </View>
                              <View className="flex-row items-center">
                                <Text className="text-gray-600 dark:text-slate-400 text-xs mr-2">
                                  £{((app.costPerDay || 0) * 22 / 1000).toFixed(1)}K/mo
                                </Text>
                                <Award size={14} color="#10b981" />
                              </View>
                            </View>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              </View>
            );
          })}

          {/* AI Agents Section */}
          <View className="mb-6">
            <Pressable
              onPress={() => setShowAISection(!showAISection)}
              className="flex-row items-center justify-between mb-3 active:opacity-70"
            >
              <Text className="text-gray-900 dark:text-white text-lg font-bold">
                AI Agents ({AI_AGENTS.length})
              </Text>
              <Text className="text-blue-500 text-sm font-semibold">
                {showAISection ? 'Hide' : 'Show'} Details
              </Text>
            </Pressable>

            {showAISection && (
              <View className="gap-3">
                {AI_AGENTS.map(agent => (
                  <View
                    key={agent.id}
                    className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 border border-gray-300 dark:border-slate-800"
                  >
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1">
                        <View className="flex-row items-center mb-1">
                          <Bot size={18} color="#8b5cf6" />
                          <Text className="text-gray-900 dark:text-white font-bold text-base ml-2">
                            {agent.name}
                          </Text>
                        </View>
                        <Text className="text-gray-600 dark:text-slate-400 text-xs">
                          {agent.purpose}
                        </Text>
                      </View>
                      <View className="bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded">
                        <Text className="text-purple-700 dark:text-purple-300 text-xs font-semibold">
                          £{agent.costPerMonth}/mo
                        </Text>
                      </View>
                    </View>

                    <Text className="text-gray-700 dark:text-slate-300 text-sm mb-3">
                      {agent.capabilities.join(' • ')}
                    </Text>

                    <View className="border-t border-gray-300 dark:border-slate-700 pt-3">
                      <Text className="text-gray-600 dark:text-slate-400 text-xs font-semibold mb-2">
                        USED BY
                      </Text>
                      <View className="flex-row flex-wrap gap-2">
                        {agent.usedBy.includes('All team members') ? (
                          <View className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                            <Text className="text-blue-700 dark:text-blue-300 text-xs">
                              All team members
                            </Text>
                          </View>
                        ) : (
                          agent.usedBy.map(userId => {
                            const user = ORGANIZATION_MEMBERS.find(m => m.id === userId);
                            if (!user) return null;
                            return (
                              <View
                                key={userId}
                                className="bg-gray-200 dark:bg-slate-800 px-2 py-1 rounded"
                              >
                                <Text className="text-gray-700 dark:text-slate-300 text-xs">
                                  {user.name}
                                </Text>
                              </View>
                            );
                          })
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Member Detail Modal */}
      <Modal visible={showMemberModal} transparent animationType="fade" onRequestClose={() => setShowMemberModal(false)}>
        <View className="flex-1 bg-black/70 justify-center items-center px-6">
          <View className="bg-white dark:bg-slate-950 rounded-3xl w-full" style={{ maxHeight: '85%' }}>
            {/* Header */}
            <View className="px-6 py-4 border-b border-gray-300 dark:border-slate-800 flex-row items-center justify-between">
              <Text className="text-gray-900 dark:text-white text-xl font-bold">Team Member</Text>
              <Pressable
                onPress={() => setShowMemberModal(false)}
                className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-900 active:opacity-70"
              >
                <X size={24} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView className="flex-1 px-6 py-6">
              {selectedMember && (() => {
                const marketplaceData = getMarketplaceData(selectedMember);
                const roleColor = selectedMember.role === 'Founder' ? '#3b82f6' :
                                  selectedMember.role === 'FractionalExec' ? '#8b5cf6' : '#10b981';

                return (
                  <View>
                    {/* Avatar and Name */}
                    <View className="items-center mb-6">
                      <View
                        className="w-20 h-20 rounded-full items-center justify-center mb-3"
                        style={{ backgroundColor: roleColor }}
                      >
                        <Text className="text-white text-2xl font-bold">
                          {selectedMember.name.split(' ').map(n => n[0]).join('')}
                        </Text>
                      </View>
                      <Text className="text-gray-900 dark:text-white text-2xl font-bold mb-1">
                        {selectedMember.name}
                      </Text>
                      <Text className="text-gray-600 dark:text-slate-400 text-base">
                        {selectedMember.role === 'FractionalExec' ? 'Fractional Executive' : selectedMember.role} • {selectedMember.function}
                      </Text>
                    </View>

                    {/* Contact Info */}
                    <View className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 mb-4">
                      <Text className="text-gray-900 dark:text-white font-semibold mb-3">Contact</Text>
                      <View className="gap-3">
                        <View className="flex-row items-center">
                          <Mail size={18} color="#64748b" />
                          <Text className="text-gray-700 dark:text-slate-300 text-sm ml-3">
                            {selectedMember.email}
                          </Text>
                        </View>
                        {selectedMember.phone && (
                          <View className="flex-row items-center">
                            <Phone size={18} color="#64748b" />
                            <Text className="text-gray-700 dark:text-slate-300 text-sm ml-3">
                              {selectedMember.phone}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Cost Info */}
                    <View className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 mb-4">
                      <Text className="text-gray-900 dark:text-white font-semibold mb-3">Cost</Text>
                      <View className="flex-row items-center justify-between">
                        <Text className="text-gray-600 dark:text-slate-400 text-sm">Daily Rate</Text>
                        <Text className="text-gray-900 dark:text-white font-bold text-lg">
                          £{selectedMember.costPerDay || 0}
                        </Text>
                      </View>
                      <View className="flex-row items-center justify-between mt-2">
                        <Text className="text-gray-600 dark:text-slate-400 text-sm">Monthly (22 days)</Text>
                        <Text className="text-gray-900 dark:text-white font-bold text-lg">
                          £{((selectedMember.costPerDay || 0) * 22 / 1000).toFixed(1)}K
                        </Text>
                      </View>
                    </View>

                    {/* Marketplace Data if available */}
                    {marketplaceData && (
                      <>
                        {/* Specialization */}
                        <View className="mb-4">
                          <Text className="text-gray-900 dark:text-white font-semibold mb-2">Specialization</Text>
                          <View className="flex-row flex-wrap gap-2">
                            {marketplaceData.specialization.map((spec, idx) => (
                              <View key={idx} className="bg-blue-100 dark:bg-blue-900/30 px-3 py-2 rounded-lg">
                                <Text className="text-blue-700 dark:text-blue-300 font-semibold text-sm">
                                  {spec}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>

                        {/* Skills */}
                        <View className="mb-4">
                          <Text className="text-gray-900 dark:text-white font-semibold mb-2">Skills</Text>
                          <View className="flex-row flex-wrap gap-2">
                            {marketplaceData.skills.map((skill, idx) => (
                              <View key={idx} className="bg-gray-200 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                                <Text className="text-gray-700 dark:text-slate-300 text-xs">
                                  {skill}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>

                        {/* Experience */}
                        <View className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 mb-4">
                          <Text className="text-gray-900 dark:text-white font-semibold mb-2">Experience</Text>
                          <Text className="text-gray-700 dark:text-slate-300 text-sm mb-3">
                            {marketplaceData.experience} years of experience
                          </Text>

                          {marketplaceData.previousCompanies && marketplaceData.previousCompanies.length > 0 && (
                            <>
                              <Text className="text-gray-600 dark:text-slate-400 text-xs font-semibold mb-2">
                                PREVIOUS COMPANIES
                              </Text>
                              <View className="gap-2">
                                {marketplaceData.previousCompanies.map((company, idx) => (
                                  <View key={idx} className="flex-row items-center">
                                    <Building2 size={14} color="#64748b" />
                                    <Text className="text-gray-700 dark:text-slate-300 text-sm ml-2">
                                      {company}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            </>
                          )}
                        </View>

                        {/* Availability */}
                        {marketplaceData.availability && (
                          <View className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 mb-4">
                            <View className="flex-row items-center">
                              <Clock size={18} color="#10b981" />
                              <View className="ml-3">
                                <Text className="text-emerald-900 dark:text-emerald-100 font-semibold">
                                  Availability
                                </Text>
                                <Text className="text-emerald-700 dark:text-emerald-300 text-sm">
                                  {marketplaceData.availability}
                                </Text>
                              </View>
                            </View>
                          </View>
                        )}
                      </>
                    )}
                  </View>
                );
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
