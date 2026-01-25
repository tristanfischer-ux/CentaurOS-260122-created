/**
 * Hard Tech Advisor Browser Component
 * Browse and filter VCs, lawyers, accountants, and advisors in the hard tech space
 */

import { View, Text, ScrollView, Pressable, TextInput, Linking } from 'react-native';
import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ExternalLink,
  Building2,
  Scale,
  Calculator,
  Users,
  Lightbulb,
  X,
  ChevronDown,
  ChevronUp,
  MapPin,
  Target,
  TrendingUp,
} from 'lucide-react-native';
import {
  ALL_HARD_TECH_ADVISORS,
  type HardTechAdvisor,
  type AdvisorCategory,
  type HardTechFocus,
  type Stage,
  type Geography,
} from '@/lib/hard-tech-advisors';

const CATEGORY_ICONS = {
  'VC': Building2,
  'Law Firm': Scale,
  'Accounting Firm': Calculator,
  'Strategic Advisor': Lightbulb,
  'Technical Advisor': Users,
};

const CATEGORY_COLORS = {
  'VC': '#3b82f6',
  'Law Firm': '#8b5cf6',
  'Accounting Firm': '#10b981',
  'Strategic Advisor': '#f59e0b',
  'Technical Advisor': '#ef4444',
};

interface AdvisorCardProps {
  advisor: HardTechAdvisor;
  onPress: () => void;
  isExpanded: boolean;
}

function AdvisorCard({ advisor, onPress, isExpanded }: AdvisorCardProps) {
  const Icon = CATEGORY_ICONS[advisor.category];
  const color = CATEGORY_COLORS[advisor.category];

  const handleWebsitePress = () => {
    Linking.openURL(advisor.website);
  };

  return (
    <Pressable
      onPress={onPress}
      className="bg-white dark:bg-slate-900 rounded-xl mb-3 overflow-hidden"
    >
      {/* Header */}
      <View className="p-4">
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1">
            <View className="flex-row items-center gap-2 mb-1">
              <Icon size={16} color={color} />
              <View
                className="px-2 py-0.5 rounded"
                style={{ backgroundColor: color + '20' }}
              >
                <Text style={{ color }} className="text-xs font-bold">
                  {advisor.category}
                </Text>
              </View>
            </View>
            <Text className="text-slate-900 dark:text-white font-bold text-base">
              {advisor.name}
            </Text>
          </View>
          {isExpanded ? (
            <ChevronUp size={20} color="#64748b" />
          ) : (
            <ChevronDown size={20} color="#64748b" />
          )}
        </View>

        {/* Focus Areas */}
        <View className="flex-row flex-wrap gap-1 mb-2">
          {advisor.focus.slice(0, 3).map((focus, index) => (
            <View key={index} className="bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded">
              <Text className="text-blue-600 dark:text-blue-400 text-xs">
                {focus}
              </Text>
            </View>
          ))}
          {advisor.focus.length > 3 && (
            <View className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
              <Text className="text-slate-600 dark:text-slate-300 text-xs">
                +{advisor.focus.length - 3}
              </Text>
            </View>
          )}
        </View>

        {/* Description */}
        <Text
          className="text-slate-600 dark:text-slate-400 text-sm"
          numberOfLines={isExpanded ? undefined : 2}
        >
          {advisor.description}
        </Text>

        {/* Expanded Content */}
        {isExpanded && (
          <View className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            {/* Geography & Stages */}
            <View className="flex-row gap-4 mb-3">
              <View className="flex-1">
                <View className="flex-row items-center gap-1 mb-1">
                  <MapPin size={12} color="#64748b" />
                  <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                    Geography
                  </Text>
                </View>
                <Text className="text-slate-700 dark:text-slate-300 text-sm">
                  {advisor.geography.join(', ')}
                </Text>
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-1 mb-1">
                  <TrendingUp size={12} color="#64748b" />
                  <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                    Stages
                  </Text>
                </View>
                <Text className="text-slate-700 dark:text-slate-300 text-sm">
                  {advisor.stages.join(', ')}
                </Text>
              </View>
            </View>

            {/* Check Size (for VCs) */}
            {advisor.checkSize && (
              <View className="mb-3">
                <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
                  Check Size
                </Text>
                <Text className="text-slate-700 dark:text-slate-300 text-sm">
                  {advisor.checkSize}
                </Text>
              </View>
            )}

            {/* Notable Investments (for VCs) */}
            {advisor.notableInvestments && advisor.notableInvestments.length > 0 && (
              <View className="mb-3">
                <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
                  Notable Investments
                </Text>
                <View className="flex-row flex-wrap gap-1">
                  {advisor.notableInvestments.map((investment, index) => (
                    <View key={index} className="bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded">
                      <Text className="text-purple-600 dark:text-purple-400 text-xs">
                        {investment}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Specialties (for Law/Accounting/Advisors) */}
            {advisor.specialties && advisor.specialties.length > 0 && (
              <View className="mb-3">
                <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
                  Specialties
                </Text>
                <View className="gap-1">
                  {advisor.specialties.map((specialty, index) => (
                    <View key={index} className="flex-row items-center gap-1">
                      <View className="w-1 h-1 rounded-full bg-slate-400" />
                      <Text className="text-slate-700 dark:text-slate-300 text-sm">
                        {specialty}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Key People */}
            {advisor.keyPeople && advisor.keyPeople.length > 0 && (
              <View className="mb-3">
                <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
                  Key People
                </Text>
                <Text className="text-slate-700 dark:text-slate-300 text-sm">
                  {advisor.keyPeople.join(', ')}
                </Text>
              </View>
            )}

            {/* Website Button */}
            <Pressable
              onPress={handleWebsitePress}
              className="bg-blue-500 py-3 rounded-xl flex-row items-center justify-center gap-2 active:opacity-80"
            >
              <ExternalLink size={16} color="white" />
              <Text className="text-white font-semibold">Visit Website</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Pressable>
  );
}

interface HardTechAdvisorBrowserProps {
  initialCategory?: AdvisorCategory;
}

export function HardTechAdvisorBrowser({ initialCategory }: HardTechAdvisorBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AdvisorCategory | 'all'>(
    initialCategory || 'all'
  );
  const [selectedFocus, setSelectedFocus] = useState<HardTechFocus | 'all'>('all');
  const [selectedGeography, setSelectedGeography] = useState<Geography | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filteredAdvisors = useMemo(() => {
    let filtered = ALL_HARD_TECH_ADVISORS;

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(a => a.category === selectedCategory);
    }

    // Focus filter
    if (selectedFocus !== 'all') {
      filtered = filtered.filter(a => a.focus.includes(selectedFocus));
    }

    // Geography filter
    if (selectedGeography !== 'all') {
      filtered = filtered.filter(a =>
        a.geography.includes(selectedGeography) || a.geography.includes('Global')
      );
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.name.toLowerCase().includes(query) ||
        a.description.toLowerCase().includes(query) ||
        a.tags.some(tag => tag.toLowerCase().includes(query)) ||
        a.focus.some(focus => focus.toLowerCase().includes(query)) ||
        a.specialties?.some(s => s.toLowerCase().includes(query)) ||
        a.notableInvestments?.some(inv => inv.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [selectedCategory, selectedFocus, selectedGeography, searchQuery]);

  const categories: Array<AdvisorCategory | 'all'> = [
    'all',
    'VC',
    'Law Firm',
    'Accounting Firm',
    'Strategic Advisor',
  ];

  return (
    <View className="flex-1">
      {/* Search */}
      <View className="px-4 pt-4 pb-3">
        <View className="flex-row items-center bg-slate-100 dark:bg-slate-900 rounded-xl px-4 py-3">
          <Search size={20} color="#64748b" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search advisors..."
            placeholderTextColor="#94a3b8"
            className="flex-1 ml-2 text-slate-900 dark:text-white"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <X size={20} color="#64748b" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Category Pills */}
      <View className="px-4 pb-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {categories.map((category) => {
              const isSelected = selectedCategory === category;
              const Icon = category !== 'all' ? CATEGORY_ICONS[category as AdvisorCategory] : Filter;
              const color = category !== 'all' ? CATEGORY_COLORS[category as AdvisorCategory] : '#64748b';

              return (
                <Pressable
                  key={category}
                  onPress={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full flex-row items-center gap-2 ${
                    isSelected ? '' : 'bg-white dark:bg-slate-900'
                  }`}
                  style={isSelected ? { backgroundColor: color } : {}}
                >
                  <Icon size={14} color={isSelected ? 'white' : color} />
                  <Text
                    className={`font-medium text-sm ${
                      isSelected ? 'text-white' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {category === 'all' ? 'All' : category}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Results Count */}
      <View className="px-4 pb-3">
        <Text className="text-slate-600 dark:text-slate-400 text-sm">
          {filteredAdvisors.length} {filteredAdvisors.length === 1 ? 'advisor' : 'advisors'} found
        </Text>
      </View>

      {/* Results */}
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 20 }}>
        {filteredAdvisors.map((advisor) => (
          <AdvisorCard
            key={advisor.id}
            advisor={advisor}
            isExpanded={expandedId === advisor.id}
            onPress={() => setExpandedId(expandedId === advisor.id ? null : advisor.id)}
          />
        ))}

        {filteredAdvisors.length === 0 && (
          <View className="items-center py-12">
            <Search size={48} color="#94a3b8" />
            <Text className="text-slate-500 dark:text-slate-400 text-center mt-4">
              No advisors found matching your criteria
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
