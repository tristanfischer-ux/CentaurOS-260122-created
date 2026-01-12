import { View, Text, ScrollView, Pressable, Modal, Dimensions } from 'react-native';
import React, { useState } from 'react';
import { X, Mail, Phone, Bot, ChevronRight } from 'lucide-react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { ORGANIZATION_MEMBERS, AI_AGENTS, type OrganizationMember } from '@/lib/organization-seed';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Hierarchical layout: Founders → Executives → AI Agents → Apprentices
const NODE_WIDTH = 140;
const NODE_HEIGHT = 80;
const VERTICAL_SPACING = 120;
const HORIZONTAL_SPACING = 20;

export default function OrgDiagramScreen() {
  const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null);

  // Separate members by role
  const founders = ORGANIZATION_MEMBERS.filter(m => m.role === 'Founder');
  const execs = ORGANIZATION_MEMBERS.filter(m => m.role === 'FractionalExec');
  const apprentices = ORGANIZATION_MEMBERS.filter(m => m.role === 'Apprentice');

  // Calculate diagram dimensions
  const maxRowWidth = Math.max(
    founders.length * (NODE_WIDTH + HORIZONTAL_SPACING),
    execs.length * (NODE_WIDTH + HORIZONTAL_SPACING),
    AI_AGENTS.length * (NODE_WIDTH + HORIZONTAL_SPACING),
    apprentices.length * (NODE_WIDTH + HORIZONTAL_SPACING)
  );
  const DIAGRAM_WIDTH = Math.max(maxRowWidth + 100, SCREEN_WIDTH);
  const DIAGRAM_HEIGHT = VERTICAL_SPACING * 5 + 100; // 4 rows + padding

  // Calculate positions for hierarchical layout
  const getHierarchicalPosition = (member: OrganizationMember, index: number, total: number, rowIndex: number) => {
    const rowWidth = total * NODE_WIDTH + (total - 1) * HORIZONTAL_SPACING;
    const startX = (DIAGRAM_WIDTH - rowWidth) / 2;

    return {
      x: startX + index * (NODE_WIDTH + HORIZONTAL_SPACING) + NODE_WIDTH / 2,
      y: 60 + rowIndex * VERTICAL_SPACING,
    };
  };

  const getAIAgentPosition = (agentIndex: number, total: number) => {
    const rowWidth = total * NODE_WIDTH + (total - 1) * HORIZONTAL_SPACING;
    const startX = (DIAGRAM_WIDTH - rowWidth) / 2;

    return {
      x: startX + agentIndex * (NODE_WIDTH + HORIZONTAL_SPACING) + NODE_WIDTH / 2,
      y: 60 + 2 * VERTICAL_SPACING, // Row 3 (0-indexed row 2)
    };
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Founder': return '#3b82f6';
      case 'FractionalExec': return '#8b5cf6';
      case 'Apprentice': return '#10b981';
      default: return '#64748b';
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
      <ScrollView className="flex-1">
        {/* Info Banner */}
        <View className="p-4 bg-blue-500/10 border-b border-blue-500/20">
          <Text className="text-blue-400 text-sm font-medium mb-1">
            Organization Hierarchy
          </Text>
          <Text className="text-gray-600 dark:text-slate-400 text-xs">
            Standard org chart: Founders → Executives → AI Agents → Apprentices. Tap any member to see details.
          </Text>
        </View>

        {/* Legend */}
        <View className="p-4 border-b border-slate-800">
          <Text className="text-white font-semibold mb-3">Legend</Text>
          <View className="flex-row flex-wrap gap-4">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-lg bg-blue-500/20 border-2 border-blue-500 items-center justify-center mr-2">
                <Text className="text-blue-400 text-xs font-bold">F</Text>
              </View>
              <Text className="text-slate-300 text-sm">Founder</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-lg bg-purple-500/20 border-2 border-purple-500 items-center justify-center mr-2">
                <Text className="text-purple-400 text-xs font-bold">E</Text>
              </View>
              <Text className="text-slate-300 text-sm">Executive</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-lg bg-slate-600/20 border-2 border-slate-500 items-center justify-center mr-2">
                <Bot size={14} color="#64748b" />
              </View>
              <Text className="text-slate-300 text-sm">AI Agent</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-lg bg-emerald-500/20 border-2 border-emerald-500 items-center justify-center mr-2">
                <Text className="text-emerald-400 text-xs font-bold">A</Text>
              </View>
              <Text className="text-slate-300 text-sm">Apprentice</Text>
            </View>
          </View>
        </View>

        {/* Hierarchical Org Diagram */}
        <View className="p-4">
          <View className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 border border-slate-800">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={true}
              contentContainerStyle={{ paddingVertical: 20 }}
            >
              <View style={{ width: DIAGRAM_WIDTH, height: DIAGRAM_HEIGHT, position: 'relative' }}>
                <Svg width={DIAGRAM_WIDTH} height={DIAGRAM_HEIGHT}>
                  {/* Draw lines from Founders to Executives */}
                  {founders.map((founder, founderIdx) => {
                    const founderPos = getHierarchicalPosition(founder, founderIdx, founders.length, 0);
                    return execs.map((exec, execIdx) => {
                      const execPos = getHierarchicalPosition(exec, execIdx, execs.length, 1);
                      return (
                        <Line
                          key={`founder-exec-${founder.id}-${exec.id}`}
                          x1={founderPos.x}
                          y1={founderPos.y + 25}
                          x2={execPos.x}
                          y2={execPos.y - 25}
                          stroke="#334155"
                          strokeWidth="2"
                        />
                      );
                    });
                  })}

                  {/* Draw lines from Executives to AI Agents */}
                  {execs.map((exec, execIdx) => {
                    const execPos = getHierarchicalPosition(exec, execIdx, execs.length, 1);
                    return AI_AGENTS.map((agent, agentIdx) => {
                      if (agent.usedBy.includes(exec.id) || agent.usedBy.includes('All team members')) {
                        const agentPos = getAIAgentPosition(agentIdx, AI_AGENTS.length);
                        return (
                          <Line
                            key={`exec-ai-${exec.id}-${agent.id}`}
                            x1={execPos.x}
                            y1={execPos.y + 25}
                            x2={agentPos.x}
                            y2={agentPos.y - 25}
                            stroke="#475569"
                            strokeWidth="1.5"
                            strokeDasharray="4,4"
                          />
                        );
                      }
                      return null;
                    });
                  })}

                  {/* Draw lines from Executives to their Apprentices */}
                  {execs.map((exec, execIdx) => {
                    const execPos = getHierarchicalPosition(exec, execIdx, execs.length, 1);
                    const managedApprentices = apprentices.filter(a => a.reportsTo === exec.id);
                    return managedApprentices.map(apprentice => {
                      const apprenticeIdx = apprentices.indexOf(apprentice);
                      const apprenticePos = getHierarchicalPosition(apprentice, apprenticeIdx, apprentices.length, 3);
                      return (
                        <Line
                          key={`exec-apprentice-${exec.id}-${apprentice.id}`}
                          x1={execPos.x}
                          y1={execPos.y + 25}
                          x2={apprenticePos.x}
                          y2={apprenticePos.y - 25}
                          stroke="#334155"
                          strokeWidth="2"
                        />
                      );
                    });
                  })}

                  {/* ROW 1: Founders */}
                  {founders.map((founder, index) => {
                    const position = getHierarchicalPosition(founder, index, founders.length, 0);
                    return (
                      <React.Fragment key={founder.id}>
                        <Circle
                          cx={position.x}
                          cy={position.y}
                          r="32"
                          fill="#3b82f620"
                          stroke="#3b82f6"
                          strokeWidth="3"
                        />
                        <SvgText
                          x={position.x}
                          y={position.y + 6}
                          fontSize="18"
                          fontWeight="bold"
                          fill="#3b82f6"
                          textAnchor="middle"
                        >
                          {founder.name.split(' ').map(n => n[0]).join('')}
                        </SvgText>
                        <SvgText
                          x={position.x}
                          y={position.y + 50}
                          fontSize="11"
                          fill="#e2e8f0"
                          textAnchor="middle"
                          fontWeight="600"
                        >
                          {founder.name.split(' ')[0]}
                        </SvgText>
                        <SvgText
                          x={position.x}
                          y={position.y + 64}
                          fontSize="9"
                          fill="#94a3b8"
                          textAnchor="middle"
                        >
                          {founder.function}
                        </SvgText>
                      </React.Fragment>
                    );
                  })}

                  {/* ROW 2: Executives */}
                  {execs.map((exec, index) => {
                    const position = getHierarchicalPosition(exec, index, execs.length, 1);
                    return (
                      <React.Fragment key={exec.id}>
                        <Circle
                          cx={position.x}
                          cy={position.y}
                          r="28"
                          fill="#8b5cf620"
                          stroke="#8b5cf6"
                          strokeWidth="3"
                        />
                        <SvgText
                          x={position.x}
                          y={position.y + 5}
                          fontSize="16"
                          fontWeight="bold"
                          fill="#8b5cf6"
                          textAnchor="middle"
                        >
                          {exec.name.split(' ').map(n => n[0]).join('')}
                        </SvgText>
                        <SvgText
                          x={position.x}
                          y={position.y + 46}
                          fontSize="11"
                          fill="#e2e8f0"
                          textAnchor="middle"
                          fontWeight="600"
                        >
                          {exec.name.split(' ')[0]}
                        </SvgText>
                        <SvgText
                          x={position.x}
                          y={position.y + 60}
                          fontSize="9"
                          fill="#94a3b8"
                          textAnchor="middle"
                        >
                          {exec.function}
                        </SvgText>
                      </React.Fragment>
                    );
                  })}

                  {/* ROW 3: AI Agents */}
                  {AI_AGENTS.map((agent, index) => {
                    const position = getAIAgentPosition(index, AI_AGENTS.length);
                    return (
                      <React.Fragment key={agent.id}>
                        <Circle
                          cx={position.x}
                          cy={position.y}
                          r="24"
                          fill="#64748b20"
                          stroke="#64748b"
                          strokeWidth="2"
                        />
                        <SvgText
                          x={position.x}
                          y={position.y + 5}
                          fontSize="14"
                          fontWeight="bold"
                          fill="#64748b"
                          textAnchor="middle"
                        >
                          AI
                        </SvgText>
                        <SvgText
                          x={position.x}
                          y={position.y + 42}
                          fontSize="10"
                          fill="#94a3b8"
                          textAnchor="middle"
                          fontWeight="600"
                        >
                          {agent.name.split(' ').slice(0, 2).join(' ')}
                        </SvgText>
                        <SvgText
                          x={position.x}
                          y={position.y + 56}
                          fontSize="8"
                          fill="#64748b"
                          textAnchor="middle"
                        >
                          {agent.provider}
                        </SvgText>
                      </React.Fragment>
                    );
                  })}

                  {/* ROW 4: Apprentices */}
                  {apprentices.map((apprentice, index) => {
                    const position = getHierarchicalPosition(apprentice, index, apprentices.length, 3);
                    return (
                      <React.Fragment key={apprentice.id}>
                        <Circle
                          cx={position.x}
                          cy={position.y}
                          r="28"
                          fill="#10b98120"
                          stroke="#10b981"
                          strokeWidth="3"
                        />
                        <SvgText
                          x={position.x}
                          y={position.y + 5}
                          fontSize="16"
                          fontWeight="bold"
                          fill="#10b981"
                          textAnchor="middle"
                        >
                          {apprentice.name.split(' ').map(n => n[0]).join('')}
                        </SvgText>
                        <SvgText
                          x={position.x}
                          y={position.y + 46}
                          fontSize="11"
                          fill="#e2e8f0"
                          textAnchor="middle"
                          fontWeight="600"
                        >
                          {apprentice.name.split(' ')[0]}
                        </SvgText>
                        <SvgText
                          x={position.x}
                          y={position.y + 60}
                          fontSize="9"
                          fill="#94a3b8"
                          textAnchor="middle"
                        >
                          {apprentice.function}
                        </SvgText>
                      </React.Fragment>
                    );
                  })}
                </Svg>

                {/* Transparent touch targets for team members */}
                {ORGANIZATION_MEMBERS.map((member) => {
                  let position;
                  if (member.role === 'Founder') {
                    const index = founders.indexOf(member);
                    position = getHierarchicalPosition(member, index, founders.length, 0);
                  } else if (member.role === 'FractionalExec') {
                    const index = execs.indexOf(member);
                    position = getHierarchicalPosition(member, index, execs.length, 1);
                  } else {
                    const index = apprentices.indexOf(member);
                    position = getHierarchicalPosition(member, index, apprentices.length, 3);
                  }

                  const touchRadius = 40;

                  return (
                    <Pressable
                      key={`touch-${member.id}`}
                      onPress={() => setSelectedMember(member)}
                      style={{
                        position: 'absolute',
                        left: position.x - touchRadius,
                        top: position.y - touchRadius,
                        width: touchRadius * 2,
                        height: touchRadius * 2,
                        borderRadius: touchRadius,
                      }}
                    />
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* Decide • Evaluate • Do Framework */}
          <View className="mt-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-2xl p-4 border border-blue-500/20">
            <Text className="text-white font-bold text-lg mb-3">Decide • Evaluate • Do</Text>

            <View className="gap-3">
              <View className="flex-row items-start">
                <View className="w-8 h-8 rounded-full bg-blue-500 items-center justify-center mr-3">
                  <Text className="text-white font-bold text-sm">D</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-blue-400 font-semibold mb-1">Decide</Text>
                  <Text className="text-slate-300 text-sm">
                    Founders set strategic direction and make key decisions
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start">
                <View className="w-8 h-8 rounded-full bg-purple-500 items-center justify-center mr-3">
                  <Text className="text-white font-bold text-sm">E</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-purple-400 font-semibold mb-1">Evaluate</Text>
                  <Text className="text-slate-300 text-sm">
                    Executives evaluate options, provide expertise, and guide execution
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start">
                <View className="w-8 h-8 rounded-full bg-emerald-500 items-center justify-center mr-3">
                  <Text className="text-white font-bold text-sm">D</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-emerald-400 font-semibold mb-1">Do</Text>
                  <Text className="text-slate-300 text-sm">
                    Apprentices execute tasks and deliver on operational work
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Team List */}
        <View className="p-4">
          <Text className="text-white font-bold text-lg mb-4">Team Members</Text>

          {/* Founders */}
          <View className="mb-4">
            <Text className="text-blue-400 font-semibold mb-2">Founders ({founders.length})</Text>
            <View className="gap-2">
              {founders.map(member => {
                const aiAgentCount = AI_AGENTS.filter(agent =>
                  agent.usedBy.includes(member.id) || agent.usedBy.includes('All team members')
                ).length;

                return (
                  <Pressable
                    key={member.id}
                    onPress={() => setSelectedMember(member)}
                    className="bg-gray-100 dark:bg-slate-900 rounded-xl p-3 border border-slate-800 flex-row items-center justify-between active:opacity-70"
                  >
                    <View className="flex-row items-center flex-1">
                      <View className="w-10 h-10 rounded-full bg-blue-500/20 border-2 border-blue-500 items-center justify-center mr-3">
                        <Text className="text-blue-400 font-bold">
                          {member.name.charAt(0)}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2 mb-1">
                          <Text className="text-white font-semibold">{member.name}</Text>
                          {aiAgentCount > 0 && (
                            <View className="bg-blue-500 rounded-full w-5 h-5 items-center justify-center">
                              <Text className="text-gray-900 dark:text-white text-[10px] font-bold">{aiAgentCount}</Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-gray-600 dark:text-slate-400 text-xs">{member.function}</Text>
                      </View>
                    </View>
                    <ChevronRight size={20} color="#64748b" />
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Executives */}
          <View className="mb-4">
            <Text className="text-purple-400 font-semibold mb-2">Executives ({execs.length})</Text>
            <View className="gap-2">
              {execs.map(member => {
                const aiAgentCount = AI_AGENTS.filter(agent =>
                  agent.usedBy.includes(member.id) || agent.usedBy.includes('All team members')
                ).length;

                return (
                  <Pressable
                    key={member.id}
                    onPress={() => setSelectedMember(member)}
                    className="bg-gray-100 dark:bg-slate-900 rounded-xl p-3 border border-slate-800 flex-row items-center justify-between active:opacity-70"
                  >
                    <View className="flex-row items-center flex-1">
                      <View className="w-10 h-10 rounded-full bg-purple-500/20 border-2 border-purple-500 items-center justify-center mr-3">
                        <Text className="text-purple-400 font-bold">
                          {member.name.charAt(0)}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2 mb-1">
                          <Text className="text-white font-semibold">{member.name}</Text>
                          {aiAgentCount > 0 && (
                            <View className="bg-blue-500 rounded-full w-5 h-5 items-center justify-center">
                              <Text className="text-gray-900 dark:text-white text-[10px] font-bold">{aiAgentCount}</Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-gray-600 dark:text-slate-400 text-xs">
                          {member.function} • {member.manages?.length || 0} reports
                        </Text>
                      </View>
                    </View>
                    <ChevronRight size={20} color="#64748b" />
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Apprentices */}
          <View className="mb-4">
            <Text className="text-emerald-400 font-semibold mb-2">Apprentices ({apprentices.length})</Text>
            <View className="gap-2">
              {apprentices.map(member => {
                const manager = ORGANIZATION_MEMBERS.find(m => m.id === member.reportsTo);
                const aiAgentCount = AI_AGENTS.filter(agent =>
                  agent.usedBy.includes(member.id) || agent.usedBy.includes('All team members')
                ).length;

                return (
                  <Pressable
                    key={member.id}
                    onPress={() => setSelectedMember(member)}
                    className="bg-gray-100 dark:bg-slate-900 rounded-xl p-3 border border-slate-800 flex-row items-center justify-between active:opacity-70"
                  >
                    <View className="flex-row items-center flex-1">
                      <View className="w-10 h-10 rounded-full bg-emerald-500/20 border-2 border-emerald-500 items-center justify-center mr-3">
                        <Text className="text-emerald-400 font-bold">
                          {member.name.charAt(0)}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2 mb-1">
                          <Text className="text-white font-semibold">{member.name}</Text>
                          {aiAgentCount > 0 && (
                            <View className="bg-blue-500 rounded-full w-5 h-5 items-center justify-center">
                              <Text className="text-gray-900 dark:text-white text-[10px] font-bold">{aiAgentCount}</Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-gray-600 dark:text-slate-400 text-xs">
                          {member.function} • Reports to {manager?.name.split(' ')[0]}
                        </Text>
                      </View>
                    </View>
                    <ChevronRight size={20} color="#64748b" />
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Member Detail Modal */}
      <Modal visible={selectedMember !== null} transparent animationType="slide" onRequestClose={() => setSelectedMember(null)}>
        <Pressable
          className="flex-1 bg-black/70 justify-end"
          onPress={() => setSelectedMember(null)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            {selectedMember && (
              <View className="bg-gray-100 dark:bg-slate-900 rounded-t-3xl" style={{ maxHeight: '80%' }}>
                <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                  {/* Header */}
                  <View className="p-6 border-b border-slate-800">
                    <View className="flex-row justify-between items-start mb-4">
                      <View className="flex-1">
                        <View
                          className="w-16 h-16 rounded-full items-center justify-center mb-3 border-4"
                          style={{
                            backgroundColor: getRoleColor(selectedMember.role) + '20',
                            borderColor: getRoleColor(selectedMember.role),
                          }}
                        >
                          <Text
                            className="text-2xl font-bold"
                            style={{ color: getRoleColor(selectedMember.role) }}
                          >
                            {selectedMember.name.charAt(0)}
                          </Text>
                        </View>
                        <Text className="text-gray-900 dark:text-white text-2xl font-bold mb-1">
                          {selectedMember.name}
                        </Text>
                        <View className="flex-row items-center gap-2">
                          <View
                            className="px-3 py-1 rounded-lg border-2"
                            style={{
                              backgroundColor: getRoleColor(selectedMember.role) + '20',
                              borderColor: getRoleColor(selectedMember.role),
                            }}
                          >
                            <Text
                              className="text-sm font-semibold"
                              style={{ color: getRoleColor(selectedMember.role) }}
                            >
                              {selectedMember.role === 'FractionalExec' ? 'Executive' : selectedMember.role}
                            </Text>
                          </View>
                          <View className="bg-slate-800 px-3 py-1 rounded-lg">
                            <Text className="text-slate-300 text-sm">{selectedMember.function}</Text>
                          </View>
                        </View>
                      </View>
                      <Pressable onPress={() => setSelectedMember(null)}>
                        <X size={24} color="#94a3b8" />
                      </Pressable>
                    </View>

                    {/* Reporting Structure */}
                    {(selectedMember.reportsTo || selectedMember.manages) && (
                      <View className="bg-slate-800 rounded-xl p-4">
                        {selectedMember.reportsTo && (
                          <View className="mb-3">
                            <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">Reports To</Text>
                            <Text className="text-white font-medium">
                              {ORGANIZATION_MEMBERS.find(m => m.id === selectedMember.reportsTo)?.name}
                            </Text>
                          </View>
                        )}
                        {selectedMember.manages && selectedMember.manages.length > 0 && (
                          <View>
                            <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">Manages</Text>
                            <View className="flex-row flex-wrap gap-2">
                              {selectedMember.manages.map(id => {
                                const report = ORGANIZATION_MEMBERS.find(m => m.id === id);
                                return (
                                  <View key={id} className="bg-slate-700 px-3 py-1 rounded-lg">
                                    <Text className="text-slate-200 text-sm">{report?.name}</Text>
                                  </View>
                                );
                              })}
                            </View>
                          </View>
                        )}
                      </View>
                    )}
                  </View>

                  {/* Contact Info */}
                  <View className="p-6 border-b border-slate-800">
                    <Text className="text-white font-semibold mb-3">Contact Information</Text>

                    <View className="flex-row items-center mb-3">
                      <View className="w-10 h-10 bg-blue-500/20 rounded-lg items-center justify-center mr-3">
                        <Mail size={18} color="#3b82f6" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-600 dark:text-slate-400 text-xs">Email</Text>
                        <Text className="text-gray-900 dark:text-white text-sm">{selectedMember.email}</Text>
                      </View>
                    </View>

                    <View className="flex-row items-center">
                      <View className="w-10 h-10 bg-emerald-500/20 rounded-lg items-center justify-center mr-3">
                        <Phone size={18} color="#10b981" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-600 dark:text-slate-400 text-xs">Phone</Text>
                        <Text className="text-gray-900 dark:text-white text-sm">{selectedMember.phone}</Text>
                      </View>
                    </View>
                  </View>

                  {/* AI Agents Used */}
                  {(() => {
                    const memberAIAgents = AI_AGENTS.filter(agent =>
                      agent.usedBy.includes(selectedMember.id) ||
                      agent.usedBy.includes('All team members')
                    );

                    if (memberAIAgents.length > 0) {
                      return (
                        <View className="p-6 border-b border-slate-800">
                          <View className="flex-row items-center justify-between mb-3">
                            <View className="flex-row items-center gap-2">
                              <Bot size={20} color="#3b82f6" />
                              <Text className="text-white font-semibold">AI Agents Used</Text>
                            </View>
                            <View className="bg-blue-500/20 px-2 py-1 rounded-full">
                              <Text className="text-blue-400 text-xs font-medium">
                                {memberAIAgents.length}
                              </Text>
                            </View>
                          </View>

                          <View className="gap-2">
                            {memberAIAgents.map(agent => (
                              <View
                                key={agent.id}
                                className="bg-slate-800 rounded-xl p-3 border border-slate-700"
                              >
                                <View className="flex-row items-start justify-between mb-1">
                                  <View className="flex-1">
                                    <Text className="text-white font-medium text-sm mb-1">
                                      {agent.name}
                                    </Text>
                                    <Text className="text-gray-600 dark:text-slate-400 text-xs mb-2">
                                      {agent.purpose}
                                    </Text>
                                    <View className="flex-row items-center gap-2">
                                      <View className="bg-purple-500/20 px-2 py-1 rounded">
                                        <Text className="text-purple-400 text-[10px] font-medium">
                                          {agent.provider}
                                        </Text>
                                      </View>
                                      {agent.functions.slice(0, 2).map((func, idx) => (
                                        <View key={idx} className="bg-slate-700 px-2 py-1 rounded">
                                          <Text className="text-slate-300 text-[10px]">{func}</Text>
                                        </View>
                                      ))}
                                    </View>
                                  </View>
                                  <View className="ml-2">
                                    <Text className="text-blue-400 text-xs font-bold">
                                      £{agent.costPerMonth}/mo
                                    </Text>
                                  </View>
                                </View>
                              </View>
                            ))}
                          </View>

                          <View className="mt-3 bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
                            <View className="flex-row items-center justify-between">
                              <Text className="text-slate-300 text-sm">Total AI Cost:</Text>
                              <Text className="text-blue-400 font-bold text-lg">
                                £{memberAIAgents.reduce((sum, agent) => sum + agent.costPerMonth, 0)}/mo
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    }
                    return null;
                  })()}

                  {/* Cost Info */}
                  {selectedMember.costPerDay && (
                    <View className="p-6 border-b border-slate-800">
                      <Text className="text-white font-semibold mb-3">Cost Information</Text>
                      <View className="bg-slate-800 rounded-xl p-4">
                        <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">Daily Rate</Text>
                        <Text className="text-emerald-400 text-2xl font-bold">
                          £{selectedMember.costPerDay.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Actions */}
                  <View className="p-6">
                    <Pressable
                      onPress={() => setSelectedMember(null)}
                      className="bg-slate-800 py-3 rounded-xl active:opacity-80"
                    >
                      <Text className="text-gray-600 dark:text-slate-400 text-center font-semibold">Close</Text>
                    </Pressable>
                  </View>
                </ScrollView>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
