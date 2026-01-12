import { View, Text, TextInput, ScrollView, Pressable } from 'react-native';
import { useState, useMemo } from 'react';
import { Search, X, Target, Briefcase, Users, Building2, Bot, Package } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAppStore } from '@/lib/state/app-store';
import { ORGANIZATION_MEMBERS, AI_AGENTS, SUPPLIER_ENGAGEMENTS } from '@/lib/organization-seed';

export default function GlobalSearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const objectives = useAppStore((s) => Object.values(s.objectives));
  const tasks = useAppStore((s) => Object.values(s.tasks));

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;

    const query = searchQuery.toLowerCase();

    return {
      tasks: tasks.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query)
      ).slice(0, 5),

      objectives: objectives.filter(o =>
        o.title.toLowerCase().includes(query) ||
        o.description?.toLowerCase().includes(query)
      ).slice(0, 5),

      people: ORGANIZATION_MEMBERS.filter(m =>
        m.name.toLowerCase().includes(query) ||
        m.function.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query)
      ).slice(0, 5),

      suppliers: SUPPLIER_ENGAGEMENTS.filter(s =>
        s.supplierName.toLowerCase().includes(query) ||
        s.projectName.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query)
      ).slice(0, 5),

      aiAgents: AI_AGENTS.filter(a =>
        a.name.toLowerCase().includes(query) ||
        a.purpose.toLowerCase().includes(query) ||
        a.provider.toLowerCase().includes(query)
      ).slice(0, 5),
    };
  }, [searchQuery, tasks, objectives]);

  const totalResults = searchResults
    ? searchResults.tasks.length + searchResults.objectives.length +
      searchResults.people.length + searchResults.suppliers.length +
      searchResults.aiAgents.length
    : 0;

  return (
    <View className="flex-1 bg-slate-950">
      {/* Search Header */}
      <View className="p-4 border-b border-slate-800">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => router.back()}>
            <X size={24} color="#94a3b8" />
          </Pressable>
          <View className="flex-1 bg-slate-900 rounded-xl flex-row items-center px-4 border border-slate-700">
            <Search size={20} color="#64748b" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search everything..."
              placeholderTextColor="#64748b"
              autoFocus
              className="flex-1 text-white py-3 px-3"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <X size={18} color="#64748b" />
              </Pressable>
            )}
          </View>
        </View>

        {searchQuery && (
          <Text className="text-slate-400 text-xs mt-3">
            {totalResults} results found
          </Text>
        )}
      </View>

      <ScrollView className="flex-1 p-4">
        {!searchQuery && (
          <View className="items-center justify-center py-20">
            <Search size={48} color="#334155" />
            <Text className="text-slate-400 text-center mt-4">
              Search across tasks, OKRs, team,{'\n'}suppliers, and AI agents
            </Text>
          </View>
        )}

        {searchQuery && totalResults === 0 && (
          <View className="items-center justify-center py-20">
            <Text className="text-slate-400 text-center">
              No results found for "{searchQuery}"
            </Text>
          </View>
        )}

        {searchResults && (
          <View className="gap-6">
            {/* Tasks */}
            {searchResults.tasks.length > 0 && (
              <View>
                <View className="flex-row items-center gap-2 mb-3">
                  <Briefcase size={18} color="#3b82f6" />
                  <Text className="text-white font-semibold">Tasks ({searchResults.tasks.length})</Text>
                </View>
                {searchResults.tasks.map((task) => (
                  <Pressable
                    key={task.id}
                    onPress={() => router.push('/work')}
                    className="bg-slate-900 rounded-xl p-3 mb-2 border border-slate-800 active:opacity-70"
                  >
                    <Text className="text-white font-medium mb-1">{task.title}</Text>
                    <Text className="text-slate-400 text-xs" numberOfLines={1}>
                      {task.description}
                    </Text>
                    <View className="flex-row items-center gap-2 mt-2">
                      <View className={`px-2 py-1 rounded ${
                        task.status === 'done' ? 'bg-emerald-500/20' :
                        task.status === 'in_progress' ? 'bg-blue-500/20' :
                        task.status === 'in_review' ? 'bg-purple-500/20' : 'bg-slate-700'
                      }`}>
                        <Text className={`text-xs ${
                          task.status === 'done' ? 'text-emerald-400' :
                          task.status === 'in_progress' ? 'text-blue-400' :
                          task.status === 'in_review' ? 'text-purple-400' : 'text-slate-400'
                        }`}>
                          {task.status.replace('_', ' ')}
                        </Text>
                      </View>
                      {task.priority && (
                        <View className="bg-orange-500/20 px-2 py-1 rounded">
                          <Text className="text-orange-400 text-xs">{task.priority}</Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {/* OKRs */}
            {searchResults.objectives.length > 0 && (
              <View>
                <View className="flex-row items-center gap-2 mb-3">
                  <Target size={18} color="#8b5cf6" />
                  <Text className="text-white font-semibold">OKRs ({searchResults.objectives.length})</Text>
                </View>
                {searchResults.objectives.map((okr) => (
                  <Pressable
                    key={okr.id}
                    onPress={() => router.push('/okrs')}
                    className="bg-slate-900 rounded-xl p-3 mb-2 border border-slate-800 active:opacity-70"
                  >
                    <Text className="text-white font-medium mb-1">{okr.title}</Text>
                    <Text className="text-slate-400 text-xs" numberOfLines={2}>
                      {okr.description}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Team Members */}
            {searchResults.people.length > 0 && (
              <View>
                <View className="flex-row items-center gap-2 mb-3">
                  <Users size={18} color="#10b981" />
                  <Text className="text-white font-semibold">Team ({searchResults.people.length})</Text>
                </View>
                {searchResults.people.map((person) => (
                  <Pressable
                    key={person.id}
                    onPress={() => router.push('/team')}
                    className="bg-slate-900 rounded-xl p-3 mb-2 border border-slate-800 flex-row items-center active:opacity-70"
                  >
                    <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                      person.role === 'Founder' ? 'bg-blue-500/20' :
                      person.role === 'FractionalExec' ? 'bg-purple-500/20' : 'bg-emerald-500/20'
                    }`}>
                      <Text className={`font-bold ${
                        person.role === 'Founder' ? 'text-blue-400' :
                        person.role === 'FractionalExec' ? 'text-purple-400' : 'text-emerald-400'
                      }`}>
                        {person.name.charAt(0)}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-medium">{person.name}</Text>
                      <Text className="text-slate-400 text-xs">{person.function}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Suppliers */}
            {searchResults.suppliers.length > 0 && (
              <View>
                <View className="flex-row items-center gap-2 mb-3">
                  <Package size={18} color="#f59e0b" />
                  <Text className="text-white font-semibold">Suppliers ({searchResults.suppliers.length})</Text>
                </View>
                {searchResults.suppliers.map((supplier) => (
                  <Pressable
                    key={supplier.id}
                    onPress={() => router.push('/organization')}
                    className="bg-slate-900 rounded-xl p-3 mb-2 border border-slate-800 active:opacity-70"
                  >
                    <Text className="text-white font-medium mb-1">{supplier.supplierName}</Text>
                    <Text className="text-slate-400 text-xs">
                      {supplier.projectName} • {supplier.status}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* AI Agents */}
            {searchResults.aiAgents.length > 0 && (
              <View>
                <View className="flex-row items-center gap-2 mb-3">
                  <Bot size={18} color="#ec4899" />
                  <Text className="text-white font-semibold">AI Agents ({searchResults.aiAgents.length})</Text>
                </View>
                {searchResults.aiAgents.map((agent) => (
                  <Pressable
                    key={agent.id}
                    onPress={() => router.push('/organization')}
                    className="bg-slate-900 rounded-xl p-3 mb-2 border border-slate-800 active:opacity-70"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-white font-medium mb-1">{agent.name}</Text>
                        <Text className="text-slate-400 text-xs" numberOfLines={1}>
                          {agent.purpose}
                        </Text>
                      </View>
                      <Text className="text-blue-400 text-xs font-bold ml-2">
                        £{agent.costPerMonth}/mo
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
