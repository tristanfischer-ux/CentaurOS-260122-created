import { View, Text, ScrollView, Pressable, Modal, Dimensions } from 'react-native';
import { useState } from 'react';
import { X, Mail, Phone, Users, ChevronRight } from 'lucide-react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { ORGANIZATION_MEMBERS, type OrganizationMember } from '@/lib/organization-seed';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DIAGRAM_WIDTH = SCREEN_WIDTH - 32;
const DIAGRAM_HEIGHT = 600;
const CENTER_X = DIAGRAM_WIDTH / 2;
const CENTER_Y = DIAGRAM_HEIGHT / 2;

// Layout configuration for circular org diagram
const FOUNDER_RADIUS = 60;
const EXEC_DISTANCE = 180;
const APPRENTICE_DISTANCE = 280;

export default function OrgDiagramScreen() {
  const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null);

  // Separate members by role
  const founders = ORGANIZATION_MEMBERS.filter(m => m.role === 'Founder');
  const execs = ORGANIZATION_MEMBERS.filter(m => m.role === 'FractionalExec');
  const apprentices = ORGANIZATION_MEMBERS.filter(m => m.role === 'Apprentice');

  // Calculate positions for each member
  const getPosition = (member: OrganizationMember, index: number, total: number) => {
    if (member.role === 'Founder') {
      // Founders in the center (side by side)
      const spacing = 70;
      return {
        x: CENTER_X - (founders.length - 1) * spacing / 2 + index * spacing,
        y: CENTER_Y,
      };
    }

    if (member.role === 'FractionalExec') {
      // Executives in a circle around founders
      const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
      return {
        x: CENTER_X + EXEC_DISTANCE * Math.cos(angle),
        y: CENTER_Y + EXEC_DISTANCE * Math.sin(angle),
      };
    }

    // Apprentices in outer circle, positioned near their manager
    const manager = execs.find(e => e.manages?.includes(member.id));
    if (manager) {
      const execIndex = execs.indexOf(manager);
      const execAngle = (execIndex / execs.length) * 2 * Math.PI - Math.PI / 2;

      // Find this apprentice's position among manager's apprentices
      const siblingApprentices = apprentices.filter(a =>
        execs.find(e => e.manages?.includes(a.id))?.id === manager.id
      );
      const apprenticeIndex = siblingApprentices.indexOf(member);
      const apprenticeCount = siblingApprentices.length;

      // Spread apprentices in an arc around their manager
      const arcSpread = Math.PI / 6;
      const apprenticeAngle = execAngle + (apprenticeIndex - (apprenticeCount - 1) / 2) * arcSpread / Math.max(apprenticeCount - 1, 1);

      return {
        x: CENTER_X + APPRENTICE_DISTANCE * Math.cos(apprenticeAngle),
        y: CENTER_Y + APPRENTICE_DISTANCE * Math.sin(apprenticeAngle),
      };
    }

    // Fallback position
    return { x: CENTER_X, y: CENTER_Y + APPRENTICE_DISTANCE };
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Founder': return '#3b82f6';
      case 'FractionalExec': return '#8b5cf6';
      case 'Apprentice': return '#10b981';
      default: return '#64748b';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'Founder': return 'F';
      case 'FractionalExec': return 'E';
      case 'Apprentice': return 'A';
      default: return '?';
    }
  };

  return (
    <View className="flex-1 bg-slate-950">
      <ScrollView className="flex-1">
        {/* Info Banner */}
        <View className="p-4 bg-blue-500/10 border-b border-blue-500/20">
          <Text className="text-blue-400 text-sm font-medium mb-1">
            Interactive Organization Diagram
          </Text>
          <Text className="text-slate-400 text-xs">
            Tap any member to see details. Lines show reporting relationships.
          </Text>
        </View>

        {/* Legend */}
        <View className="p-4 border-b border-slate-800">
          <Text className="text-white font-semibold mb-3">Legend</Text>
          <View className="flex-row flex-wrap gap-4">
            <View className="flex-row items-center">
              <View className="w-6 h-6 rounded-full bg-blue-500/20 border-2 border-blue-500 items-center justify-center mr-2">
                <Text className="text-blue-400 text-xs font-bold">F</Text>
              </View>
              <Text className="text-slate-300 text-sm">Founder</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-6 h-6 rounded-full bg-purple-500/20 border-2 border-purple-500 items-center justify-center mr-2">
                <Text className="text-purple-400 text-xs font-bold">E</Text>
              </View>
              <Text className="text-slate-300 text-sm">Executive</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-6 h-6 rounded-full bg-emerald-500/20 border-2 border-emerald-500 items-center justify-center mr-2">
                <Text className="text-emerald-400 text-xs font-bold">A</Text>
              </View>
              <Text className="text-slate-300 text-sm">Apprentice</Text>
            </View>
          </View>
        </View>

        {/* Org Diagram */}
        <View className="p-4">
          <View className="bg-slate-900 rounded-2xl p-4 border border-slate-800 overflow-hidden">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Svg width={DIAGRAM_WIDTH} height={DIAGRAM_HEIGHT}>
                {/* Draw reporting lines */}
                {ORGANIZATION_MEMBERS.map((member) => {
                  if (member.reportsTo) {
                    const manager = ORGANIZATION_MEMBERS.find(m => m.id === member.reportsTo);
                    if (manager) {
                      const memberPos = getPosition(
                        member,
                        ORGANIZATION_MEMBERS.indexOf(member),
                        ORGANIZATION_MEMBERS.filter(m => m.role === member.role).length
                      );
                      const managerPos = getPosition(
                        manager,
                        ORGANIZATION_MEMBERS.indexOf(manager),
                        ORGANIZATION_MEMBERS.filter(m => m.role === manager.role).length
                      );

                      return (
                        <Line
                          key={`line-${member.id}`}
                          x1={managerPos.x}
                          y1={managerPos.y}
                          x2={memberPos.x}
                          y2={memberPos.y}
                          stroke="#334155"
                          strokeWidth="2"
                          strokeDasharray="4,4"
                        />
                      );
                    }
                  }
                  return null;
                })}

                {/* Draw member nodes */}
                {ORGANIZATION_MEMBERS.map((member, idx) => {
                  const position = getPosition(
                    member,
                    ORGANIZATION_MEMBERS.filter(m => m.role === member.role).indexOf(member),
                    ORGANIZATION_MEMBERS.filter(m => m.role === member.role).length
                  );
                  const color = getRoleColor(member.role);
                  const nodeRadius = member.role === 'Founder' ? 35 : 28;

                  return (
                    <Pressable
                      key={member.id}
                      onPress={() => setSelectedMember(member)}
                    >
                      {/* Node circle */}
                      <Circle
                        cx={position.x}
                        cy={position.y}
                        r={nodeRadius}
                        fill={color + '20'}
                        stroke={color}
                        strokeWidth="3"
                      />

                      {/* Role label */}
                      <SvgText
                        x={position.x}
                        y={position.y + 6}
                        fontSize="18"
                        fontWeight="bold"
                        fill={color}
                        textAnchor="middle"
                      >
                        {getRoleLabel(member.role)}
                      </SvgText>

                      {/* Name label below */}
                      <SvgText
                        x={position.x}
                        y={position.y + nodeRadius + 18}
                        fontSize="11"
                        fill="#e2e8f0"
                        textAnchor="middle"
                        fontWeight="600"
                      >
                        {member.name.split(' ')[0]}
                      </SvgText>
                      <SvgText
                        x={position.x}
                        y={position.y + nodeRadius + 32}
                        fontSize="9"
                        fill="#94a3b8"
                        textAnchor="middle"
                      >
                        {member.function}
                      </SvgText>
                    </Pressable>
                  );
                })}
              </Svg>
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
              {founders.map(member => (
                <Pressable
                  key={member.id}
                  onPress={() => setSelectedMember(member)}
                  className="bg-slate-900 rounded-xl p-3 border border-slate-800 flex-row items-center justify-between active:opacity-70"
                >
                  <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 rounded-full bg-blue-500/20 border-2 border-blue-500 items-center justify-center mr-3">
                      <Text className="text-blue-400 font-bold">
                        {member.name.charAt(0)}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-semibold">{member.name}</Text>
                      <Text className="text-slate-400 text-xs">{member.function}</Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color="#64748b" />
                </Pressable>
              ))}
            </View>
          </View>

          {/* Executives */}
          <View className="mb-4">
            <Text className="text-purple-400 font-semibold mb-2">Executives ({execs.length})</Text>
            <View className="gap-2">
              {execs.map(member => (
                <Pressable
                  key={member.id}
                  onPress={() => setSelectedMember(member)}
                  className="bg-slate-900 rounded-xl p-3 border border-slate-800 flex-row items-center justify-between active:opacity-70"
                >
                  <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 rounded-full bg-purple-500/20 border-2 border-purple-500 items-center justify-center mr-3">
                      <Text className="text-purple-400 font-bold">
                        {member.name.charAt(0)}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-semibold">{member.name}</Text>
                      <Text className="text-slate-400 text-xs">
                        {member.function} • {member.manages?.length || 0} reports
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color="#64748b" />
                </Pressable>
              ))}
            </View>
          </View>

          {/* Apprentices */}
          <View className="mb-4">
            <Text className="text-emerald-400 font-semibold mb-2">Apprentices ({apprentices.length})</Text>
            <View className="gap-2">
              {apprentices.map(member => {
                const manager = ORGANIZATION_MEMBERS.find(m => m.id === member.reportsTo);
                return (
                  <Pressable
                    key={member.id}
                    onPress={() => setSelectedMember(member)}
                    className="bg-slate-900 rounded-xl p-3 border border-slate-800 flex-row items-center justify-between active:opacity-70"
                  >
                    <View className="flex-row items-center flex-1">
                      <View className="w-10 h-10 rounded-full bg-emerald-500/20 border-2 border-emerald-500 items-center justify-center mr-3">
                        <Text className="text-emerald-400 font-bold">
                          {member.name.charAt(0)}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-white font-semibold">{member.name}</Text>
                        <Text className="text-slate-400 text-xs">
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
      <Modal visible={selectedMember !== null} transparent animationType="slide">
        <View className="flex-1 bg-black/70">
          {selectedMember && (
            <View className="mt-auto bg-slate-900 rounded-t-3xl" style={{ maxHeight: '80%' }}>
              <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
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
                      <Text className="text-white text-2xl font-bold mb-1">
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
                          <Text className="text-slate-400 text-xs mb-1">Reports To</Text>
                          <Text className="text-white font-medium">
                            {ORGANIZATION_MEMBERS.find(m => m.id === selectedMember.reportsTo)?.name}
                          </Text>
                        </View>
                      )}
                      {selectedMember.manages && selectedMember.manages.length > 0 && (
                        <View>
                          <Text className="text-slate-400 text-xs mb-1">Manages</Text>
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
                      <Text className="text-slate-400 text-xs">Email</Text>
                      <Text className="text-white text-sm">{selectedMember.email}</Text>
                    </View>
                  </View>

                  <View className="flex-row items-center">
                    <View className="w-10 h-10 bg-emerald-500/20 rounded-lg items-center justify-center mr-3">
                      <Phone size={18} color="#10b981" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-400 text-xs">Phone</Text>
                      <Text className="text-white text-sm">{selectedMember.phone}</Text>
                    </View>
                  </View>
                </View>

                {/* Cost Info */}
                {selectedMember.costPerDay && (
                  <View className="p-6 border-b border-slate-800">
                    <Text className="text-white font-semibold mb-3">Cost Information</Text>
                    <View className="bg-slate-800 rounded-xl p-4">
                      <Text className="text-slate-400 text-xs mb-1">Daily Rate</Text>
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
                    <Text className="text-slate-400 text-center font-semibold">Close</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}
