import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Code2,
  Package,
  Megaphone,
  Palette,
  Kanban,
  Building2,
  TestTube2,
  X,
  Check,
  AlertCircle,
  Clock,
  DollarSign,
  Zap,
} from 'lucide-react-native';
import { AI_AGENTS, AGENT_CATEGORIES, getAgentsByCategory, getCategoryColor, AIAgent, AgentCategory } from '@/lib/ai-agents-data';

const CATEGORY_ICONS = {
  Code2,
  Package,
  Megaphone,
  Palette,
  Kanban,
  Building2,
  TestTube2,
};

const AGENT_ICONS = {
  Code2, Database: Code2, Smartphone: Code2, Brain: Code2, GitBranch: Code2, Zap,
  TrendingUp: Code2, MessageSquare: Code2, ListOrdered: Code2,
  Video: Code2, Image: Palette, Twitter: Code2, Users: Code2, Store: Code2, FileText: Code2, Rocket: Zap,
  Palette, Search: Code2, Shield: Code2, Sparkles: Zap, Wand2: Zap,
  FlaskConical: TestTube2, Ship: Code2, Clapperboard: Code2,
  Headphones: Code2, BarChart3: Code2, Server: Code2, Scale: Code2, PiggyBank: DollarSign,
  Wrench: Code2, Plug: Code2, GitMerge: Code2, Gauge: Code2, ClipboardCheck: Check,
};

export default function AIAgentsScreen() {
  const [selectedCategory, setSelectedCategory] = useState<AgentCategory | 'all'>('all');
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [deployModalVisible, setDeployModalVisible] = useState(false);
  const [deployConfig, setDeployConfig] = useState({ goal: '', constraints: '', apiKeys: '' });

  const displayedAgents = selectedCategory === 'all'
    ? AI_AGENTS
    : getAgentsByCategory(selectedCategory);

  const handleDeployAgent = (agent: AIAgent) => {
    setSelectedAgent(agent);
    setDeployModalVisible(true);
  };

  const confirmDeployment = () => {
    // TODO: Integrate with backend to actually deploy agent
    console.log('Deploying agent:', selectedAgent?.name, deployConfig);
    setDeployModalVisible(false);
    setDeployConfig({ goal: '', constraints: '', apiKeys: '' });
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={['top']}>
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-200 dark:border-slate-800">
        <Text className="text-gray-900 dark:text-white text-2xl font-bold mb-1">AI Agents</Text>
        <Text className="text-gray-600 dark:text-slate-400 text-sm">
          Deploy specialized agents to automate business functions
        </Text>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-6 py-4 border-b border-gray-200 dark:border-slate-800"
        style={{ flexGrow: 0 }}
      >
        <Pressable
          onPress={() => setSelectedCategory('all')}
          className={`mr-3 px-4 py-2 rounded-xl ${
            selectedCategory === 'all'
              ? 'bg-blue-500'
              : 'bg-gray-100 dark:bg-slate-800'
          }`}
        >
          <Text className={selectedCategory === 'all' ? 'text-white font-semibold' : 'text-gray-700 dark:text-slate-300'}>
            All ({AI_AGENTS.length})
          </Text>
        </Pressable>

        {AGENT_CATEGORIES.map((category) => {
          const CategoryIcon = CATEGORY_ICONS[category.icon as keyof typeof CATEGORY_ICONS];
          const agentCount = getAgentsByCategory(category.id as AgentCategory).length;
          const isSelected = selectedCategory === category.id;
          const colors = getCategoryColor(category.id as AgentCategory);

          return (
            <Pressable
              key={category.id}
              onPress={() => setSelectedCategory(category.id as AgentCategory)}
              className={`mr-3 px-4 py-2 rounded-xl flex-row items-center gap-2 ${
                isSelected ? colors.bg + ' border ' + colors.border : 'bg-gray-100 dark:bg-slate-800'
              }`}
            >
              <CategoryIcon size={16} color={isSelected ? colors.hex : '#94a3b8'} />
              <Text className={isSelected ? colors.text + ' font-semibold' : 'text-gray-700 dark:text-slate-300'}>
                {category.name} ({agentCount})
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Agents Grid */}
      <ScrollView className="flex-1 px-6 py-4">
        <View className="gap-4 pb-6">
          {displayedAgents.map((agent) => {
            const colors = getCategoryColor(agent.category);
            const AgentIcon = AGENT_ICONS[agent.icon as keyof typeof AGENT_ICONS] || Code2;

            return (
              <Pressable
                key={agent.id}
                onPress={() => setSelectedAgent(agent)}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 active:opacity-70"
              >
                {/* Header */}
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-row items-center gap-3 flex-1">
                    <View className={`${colors.bg} rounded-xl p-3`}>
                      <AgentIcon size={24} color={colors.hex} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 dark:text-white font-bold text-lg mb-1">
                        {agent.name}
                      </Text>
                      <Text className={`${colors.text} text-xs font-semibold uppercase`}>
                        {agent.category.replace('-', ' ')}
                      </Text>
                    </View>
                  </View>
                  {agent.approvalRequired && (
                    <View className="bg-amber-500/20 rounded-lg px-2 py-1">
                      <Text className="text-amber-400 text-xs font-semibold">Approval Required</Text>
                    </View>
                  )}
                </View>

                {/* Description */}
                <Text className="text-gray-600 dark:text-slate-400 text-sm mb-4 leading-5">
                  {agent.description}
                </Text>

                {/* Expertise Tags */}
                <View className="flex-row flex-wrap gap-2 mb-4">
                  {agent.expertise.slice(0, 3).map((skill, idx) => (
                    <View key={idx} className="bg-gray-100 dark:bg-slate-800 rounded-lg px-3 py-1">
                      <Text className="text-gray-700 dark:text-slate-300 text-xs">{skill}</Text>
                    </View>
                  ))}
                  {agent.expertise.length > 3 && (
                    <View className="bg-gray-100 dark:bg-slate-800 rounded-lg px-3 py-1">
                      <Text className="text-gray-700 dark:text-slate-300 text-xs">
                        +{agent.expertise.length - 3} more
                      </Text>
                    </View>
                  )}
                </View>

                {/* Footer */}
                <View className="flex-row items-center justify-between pt-3 border-t border-gray-200 dark:border-slate-800">
                  <View className="flex-row items-center gap-2">
                    <DollarSign size={14} color="#94a3b8" />
                    <Text className="text-gray-600 dark:text-slate-400 text-xs">
                      {agent.estimatedCostPerTask}
                    </Text>
                  </View>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeployAgent(agent);
                    }}
                    className={`${colors.bg} rounded-lg px-4 py-2 border ${colors.border}`}
                  >
                    <Text className={`${colors.text} font-semibold text-sm`}>Deploy</Text>
                  </Pressable>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Agent Detail Modal */}
      <Modal
        visible={selectedAgent !== null && !deployModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedAgent(null)}
      >
        {selectedAgent && (
          <View className="flex-1 bg-black/50">
            <View className="flex-1 mt-20 bg-white dark:bg-slate-900 rounded-t-3xl">
              <View className="p-6 border-b border-gray-200 dark:border-slate-800">
                <View className="flex-row items-start justify-between mb-4">
                  <View className="flex-1">
                    <Text className="text-gray-900 dark:text-white text-2xl font-bold mb-2">
                      {selectedAgent.name}
                    </Text>
                    <View className="flex-row items-center gap-2">
                      <View className={`${getCategoryColor(selectedAgent.category).bg} rounded-lg px-3 py-1`}>
                        <Text className={`${getCategoryColor(selectedAgent.category).text} text-xs font-semibold uppercase`}>
                          {selectedAgent.category.replace('-', ' ')}
                        </Text>
                      </View>
                      {selectedAgent.approvalRequired && (
                        <View className="bg-amber-500/20 rounded-lg px-3 py-1">
                          <Text className="text-amber-400 text-xs font-semibold">Approval Required</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Pressable onPress={() => setSelectedAgent(null)} className="p-2">
                    <X size={24} color="#94a3b8" />
                  </Pressable>
                </View>
                <Text className="text-gray-600 dark:text-slate-400 leading-6">
                  {selectedAgent.description}
                </Text>
              </View>

              <ScrollView className="flex-1 p-6">
                {/* Expertise */}
                <View className="mb-6">
                  <Text className="text-gray-900 dark:text-white font-bold text-lg mb-3">Expertise</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {selectedAgent.expertise.map((skill, idx) => (
                      <View key={idx} className="bg-gray-100 dark:bg-slate-800 rounded-xl px-4 py-2">
                        <Text className="text-gray-700 dark:text-slate-300 text-sm">{skill}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Tools */}
                <View className="mb-6">
                  <Text className="text-gray-900 dark:text-white font-bold text-lg mb-3">Tools Available</Text>
                  {selectedAgent.tools.map((tool, idx) => (
                    <View key={idx} className="flex-row items-center gap-2 mb-2">
                      <View className="bg-blue-500/20 rounded-lg p-2">
                        <Check size={14} color="#60a5fa" />
                      </View>
                      <Text className="text-gray-700 dark:text-slate-300 text-sm">{tool}</Text>
                    </View>
                  ))}
                </View>

                {/* Output Format */}
                <View className="mb-6">
                  <Text className="text-gray-900 dark:text-white font-bold text-lg mb-3">Output Format</Text>
                  <View className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                    <Text className="text-gray-700 dark:text-slate-300">{selectedAgent.outputFormat}</Text>
                  </View>
                </View>

                {/* Cost */}
                <View className="mb-6">
                  <Text className="text-gray-900 dark:text-white font-bold text-lg mb-3">Estimated Cost</Text>
                  <View className="flex-row items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                    <DollarSign size={20} color="#4ade80" />
                    <Text className="text-gray-700 dark:text-slate-300 font-semibold">
                      {selectedAgent.estimatedCostPerTask} per task
                    </Text>
                  </View>
                </View>

                {/* Approval Info */}
                {selectedAgent.approvalRequired && (
                  <View className="mb-6">
                    <View className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex-row items-start gap-3">
                      <AlertCircle size={20} color="#f59e0b" />
                      <View className="flex-1">
                        <Text className="text-amber-400 font-semibold mb-1">Human Approval Required</Text>
                        <Text className="text-gray-600 dark:text-slate-400 text-sm">
                          This agent requires human review before executing tasks to ensure quality and safety.
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Deploy Button */}
              <View className="p-6 border-t border-gray-200 dark:border-slate-800">
                <Pressable
                  onPress={() => handleDeployAgent(selectedAgent)}
                  className="bg-blue-500 rounded-xl p-4 flex-row items-center justify-center active:opacity-70"
                >
                  <Zap size={20} color="white" />
                  <Text className="text-white font-bold text-lg ml-2">Deploy Agent</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </Modal>

      {/* Deploy Configuration Modal */}
      <Modal
        visible={deployModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDeployModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-6" style={{ maxHeight: '80%' }}>
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-gray-900 dark:text-white text-xl font-bold">
                Deploy {selectedAgent?.name}
              </Text>
              <Pressable onPress={() => setDeployModalVisible(false)}>
                <X size={24} color="#94a3b8" />
              </Pressable>
            </View>

            <ScrollView className="mb-6">
              {/* Goal */}
              <View className="mb-4">
                <Text className="text-gray-900 dark:text-white font-semibold mb-2">Goal (Optional)</Text>
                <TextInput
                  className="bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl p-4"
                  placeholder="What should this agent focus on?"
                  placeholderTextColor="#94a3b8"
                  value={deployConfig.goal}
                  onChangeText={(text) => setDeployConfig({ ...deployConfig, goal: text })}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Constraints */}
              <View className="mb-4">
                <Text className="text-gray-900 dark:text-white font-semibold mb-2">Constraints (Optional)</Text>
                <TextInput
                  className="bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl p-4"
                  placeholder="Any limitations or guidelines?"
                  placeholderTextColor="#94a3b8"
                  value={deployConfig.constraints}
                  onChangeText={(text) => setDeployConfig({ ...deployConfig, constraints: text })}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* API Keys Notice */}
              {selectedAgent?.tools.some(t => t.toLowerCase().includes('api')) && (
                <View className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
                  <View className="flex-row items-start gap-3">
                    <AlertCircle size={20} color="#60a5fa" />
                    <View className="flex-1">
                      <Text className="text-blue-400 font-semibold mb-1">API Configuration</Text>
                      <Text className="text-gray-600 dark:text-slate-400 text-sm">
                        This agent requires API access. You can configure API keys in the API tab.
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Cost Estimate */}
              <View className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-700 dark:text-slate-300 font-semibold">Estimated Cost</Text>
                  <Text className="text-green-400 font-bold">{selectedAgent?.estimatedCostPerTask}</Text>
                </View>
              </View>
            </ScrollView>

            {/* Deploy Button */}
            <Pressable
              onPress={confirmDeployment}
              className="bg-blue-500 rounded-xl p-4 flex-row items-center justify-center active:opacity-70"
            >
              <Check size={20} color="white" />
              <Text className="text-white font-bold text-lg ml-2">Confirm Deployment</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
