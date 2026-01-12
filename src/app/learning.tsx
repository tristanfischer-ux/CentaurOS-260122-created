import { View, Text, ScrollView, Pressable, Modal, TextInput } from 'react-native';
import { useState } from 'react';
import { X, GraduationCap, Award, TrendingUp, Target, BookOpen, CheckCircle, Star, ChevronRight, Plus, Edit2 } from 'lucide-react-native';
import { router } from 'expo-router';
import { useCurrentMembership } from '@/lib/state/app-store';
import { ORGANIZATION_MEMBERS } from '@/lib/organization-seed';

interface Skill {
  id: string;
  name: string;
  category: 'technical' | 'soft' | 'domain';
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  progress: number; // 0-100
}

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  completed: boolean;
  completedDate?: string;
  link?: string;
}

interface PerformanceReview {
  id: string;
  reviewerId: string;
  reviewerName: string;
  date: string;
  quarter: string;
  ratings: {
    quality: number;
    speed: number;
    communication: number;
    initiative: number;
    learning: number;
  };
  strengths: string[];
  areasForGrowth: string[];
  goals: string[];
  notes: string;
}

interface ApprenticeProgress {
  apprenticeId: string;
  skills: Skill[];
  trainings: TrainingModule[];
  reviews: PerformanceReview[];
  tasksCompleted: number;
  averageRating: number;
  joinDate: string;
}

// Mock data - in real app would come from database
const APPRENTICE_DATA: Record<string, ApprenticeProgress> = {
  'apprentice-1': {
    apprenticeId: 'apprentice-1',
    joinDate: '2024-01-15',
    tasksCompleted: 47,
    averageRating: 4.2,
    skills: [
      { id: 's1', name: 'Autodesk Fusion 360', category: 'technical', level: 'intermediate', progress: 65 },
      { id: 's2', name: 'Python', category: 'technical', level: 'beginner', progress: 30 },
      { id: 's3', name: 'Project Management', category: 'soft', level: 'intermediate', progress: 55 },
      { id: 's4', name: 'Hardware Design', category: 'domain', level: 'intermediate', progress: 60 },
      { id: 's5', name: 'Communication', category: 'soft', level: 'advanced', progress: 80 },
    ],
    trainings: [
      {
        id: 't1',
        title: 'CAD Fundamentals',
        description: 'Introduction to CAD design principles',
        category: 'Design',
        duration: '4 hours',
        completed: true,
        completedDate: '2024-02-10',
        link: 'https://learn.autodesk.com',
      },
      {
        id: 't2',
        title: 'Python for Engineers',
        description: 'Learn Python programming basics',
        category: 'Engineering',
        duration: '8 hours',
        completed: false,
        link: 'https://python.org/tutorial',
      },
      {
        id: 't3',
        title: 'Agile Project Management',
        description: 'Agile methodologies for hardware teams',
        category: 'Management',
        duration: '3 hours',
        completed: true,
        completedDate: '2024-03-05',
      },
    ],
    reviews: [
      {
        id: 'r1',
        reviewerId: 'exec-3',
        reviewerName: 'Tom Wilson',
        date: '2024-03-31',
        quarter: 'Q1 2024',
        ratings: {
          quality: 4,
          speed: 4,
          communication: 5,
          initiative: 4,
          learning: 5,
        },
        strengths: [
          'Excellent communication skills',
          'Quick learner - picks up new tools fast',
          'Takes initiative on tasks',
        ],
        areasForGrowth: [
          'Could improve Python coding skills',
          'Needs more practice with complex CAD assemblies',
        ],
        goals: [
          'Complete Python for Engineers course',
          'Lead one small CAD project end-to-end',
          'Mentor new apprentice in June',
        ],
        notes: 'Alex has shown tremendous growth this quarter. Very promising talent.',
      },
    ],
  },
  // Add more apprentices...
};

const SKILL_CATEGORIES = [
  { id: 'all', label: 'All Skills', color: '#64748b' },
  { id: 'technical', label: 'Technical', color: '#3b82f6' },
  { id: 'soft', label: 'Soft Skills', color: '#10b981' },
  { id: 'domain', label: 'Domain Knowledge', color: '#8b5cf6' },
];

const LEVEL_COLORS = {
  beginner: '#f59e0b',
  intermediate: '#3b82f6',
  advanced: '#8b5cf6',
  expert: '#10b981',
};

export default function LearningScreen() {
  const currentMembership = useCurrentMembership();
  const [selectedApprentice, setSelectedApprentice] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'skills' | 'training' | 'reviews'>('skills');
  const [selectedSkillCategory, setSelectedSkillCategory] = useState('all');
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);

  // Only Founders and Execs can access
  if (!currentMembership || !['Founder', 'FractionalExec'].includes(currentMembership.role)) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center p-6">
        <GraduationCap size={48} color="#64748b" />
        <Text className="text-slate-400 text-center mt-4">
          This feature is only available to Founders and Executives
        </Text>
      </View>
    );
  }

  const apprentices = ORGANIZATION_MEMBERS.filter(m => m.role === 'Apprentice');
  const selectedData = selectedApprentice ? APPRENTICE_DATA[selectedApprentice] : null;

  const filteredSkills = selectedData?.skills.filter(skill =>
    selectedSkillCategory === 'all' || skill.category === selectedSkillCategory
  );

  return (
    <View className="flex-1 bg-slate-950">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="p-6 border-b border-slate-800">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-3">
              <View className="w-12 h-12 bg-blue-500/20 rounded-xl items-center justify-center">
                <GraduationCap size={24} color="#3b82f6" />
              </View>
              <View>
                <Text className="text-white text-xl font-bold">Learning & Development</Text>
                <Text className="text-slate-400 text-xs">Track apprentice growth and skills</Text>
              </View>
            </View>
            <Pressable onPress={() => router.back()}>
              <X size={24} color="#94a3b8" />
            </Pressable>
          </View>
        </View>

        {/* Apprentice Selection */}
        <View className="p-6">
          <Text className="text-white font-semibold mb-3">Select Apprentice</Text>
          <View className="gap-2">
            {apprentices.map((apprentice) => {
              const data = APPRENTICE_DATA[apprentice.id];
              const isSelected = selectedApprentice === apprentice.id;

              return (
                <Pressable
                  key={apprentice.id}
                  onPress={() => setSelectedApprentice(apprentice.id)}
                  className={`rounded-xl p-4 border-2 ${
                    isSelected
                      ? 'bg-blue-500/20 border-blue-500'
                      : 'bg-slate-900 border-slate-800'
                  } active:opacity-70`}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="w-12 h-12 rounded-full bg-emerald-500/20 items-center justify-center mr-3">
                        <Text className="text-emerald-400 font-bold text-lg">
                          {apprentice.name.charAt(0)}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-white font-semibold">{apprentice.name}</Text>
                        <Text className="text-slate-400 text-xs">{apprentice.function}</Text>
                        {data && (
                          <View className="flex-row items-center gap-3 mt-1">
                            <View className="flex-row items-center gap-1">
                              <CheckCircle size={12} color="#10b981" />
                              <Text className="text-slate-500 text-xs">{data.tasksCompleted} tasks</Text>
                            </View>
                            <View className="flex-row items-center gap-1">
                              <Star size={12} color="#f59e0b" />
                              <Text className="text-slate-500 text-xs">{data.averageRating.toFixed(1)} avg</Text>
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                    <ChevronRight size={20} color={isSelected ? '#3b82f6' : '#64748b'} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Apprentice Details */}
        {selectedData && (
          <View className="px-6 pb-6">
            {/* View Tabs */}
            <View className="flex-row gap-2 mb-4">
              {[
                { id: 'skills', label: 'Skills Matrix', icon: Target },
                { id: 'training', label: 'Training', icon: BookOpen },
                { id: 'reviews', label: 'Reviews', icon: Star },
              ].map((tab) => (
                <Pressable
                  key={tab.id}
                  onPress={() => setSelectedView(tab.id as any)}
                  className={`flex-1 py-3 rounded-xl flex-row items-center justify-center gap-2 ${
                    selectedView === tab.id ? 'bg-blue-500' : 'bg-slate-900'
                  }`}
                >
                  <tab.icon size={16} color={selectedView === tab.id ? '#ffffff' : '#64748b'} />
                  <Text
                    className={`text-sm font-semibold ${
                      selectedView === tab.id ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Skills Matrix View */}
            {selectedView === 'skills' && (
              <View>
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-white font-semibold">Skills Matrix</Text>
                  <Pressable
                    onPress={() => setShowAddSkillModal(true)}
                    className="bg-blue-500 px-3 py-2 rounded-lg flex-row items-center gap-2 active:opacity-70"
                  >
                    <Plus size={16} color="#ffffff" />
                    <Text className="text-white text-sm font-semibold">Add Skill</Text>
                  </Pressable>
                </View>

                {/* Category Filter */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                  <View className="flex-row gap-2">
                    {SKILL_CATEGORIES.map((cat) => (
                      <Pressable
                        key={cat.id}
                        onPress={() => setSelectedSkillCategory(cat.id)}
                        className={`px-4 py-2 rounded-lg ${
                          selectedSkillCategory === cat.id ? 'bg-blue-500' : 'bg-slate-800'
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            selectedSkillCategory === cat.id ? 'text-white' : 'text-slate-400'
                          }`}
                        >
                          {cat.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>

                {/* Skills List */}
                <View className="gap-3">
                  {filteredSkills?.map((skill) => (
                    <View key={skill.id} className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                      <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-1">
                          <Text className="text-white font-semibold mb-1">{skill.name}</Text>
                          <View
                            className="px-2 py-1 rounded self-start"
                            style={{ backgroundColor: LEVEL_COLORS[skill.level] + '20' }}
                          >
                            <Text
                              className="text-xs font-medium capitalize"
                              style={{ color: LEVEL_COLORS[skill.level] }}
                            >
                              {skill.level}
                            </Text>
                          </View>
                        </View>
                        <View className="items-end">
                          <Text className="text-blue-400 text-2xl font-bold">{skill.progress}%</Text>
                          <Text className="text-slate-500 text-xs">progress</Text>
                        </View>
                      </View>

                      {/* Progress Bar */}
                      <View className="bg-slate-800 h-2 rounded-full overflow-hidden">
                        <View
                          className="bg-blue-500 h-full rounded-full"
                          style={{ width: `${skill.progress}%` }}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Training Modules View */}
            {selectedView === 'training' && (
              <View>
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-white font-semibold">Training Modules</Text>
                  <View className="bg-blue-500/20 px-3 py-1 rounded-full">
                    <Text className="text-blue-400 text-xs font-medium">
                      {selectedData.trainings.filter(t => t.completed).length} / {selectedData.trainings.length} completed
                    </Text>
                  </View>
                </View>

                <View className="gap-3">
                  {selectedData.trainings.map((training) => (
                    <View
                      key={training.id}
                      className={`rounded-xl p-4 border ${
                        training.completed
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <View className="flex-row items-start justify-between mb-2">
                        <View className="flex-1 mr-3">
                          <Text className="text-white font-semibold mb-1">{training.title}</Text>
                          <Text className="text-slate-400 text-xs mb-2">{training.description}</Text>
                          <View className="flex-row items-center gap-2">
                            <View className="bg-slate-800 px-2 py-1 rounded">
                              <Text className="text-slate-400 text-xs">{training.category}</Text>
                            </View>
                            <View className="bg-slate-800 px-2 py-1 rounded">
                              <Text className="text-slate-400 text-xs">{training.duration}</Text>
                            </View>
                          </View>
                        </View>
                        {training.completed && (
                          <View className="bg-emerald-500 w-8 h-8 rounded-full items-center justify-center">
                            <CheckCircle size={18} color="#ffffff" />
                          </View>
                        )}
                      </View>

                      {training.completed && training.completedDate && (
                        <Text className="text-emerald-400 text-xs mt-2">
                          Completed on {new Date(training.completedDate).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Performance Reviews View */}
            {selectedView === 'reviews' && (
              <View>
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-white font-semibold">Performance Reviews</Text>
                  <Pressable className="bg-blue-500 px-3 py-2 rounded-lg flex-row items-center gap-2 active:opacity-70">
                    <Plus size={16} color="#ffffff" />
                    <Text className="text-white text-sm font-semibold">New Review</Text>
                  </Pressable>
                </View>

                <View className="gap-4">
                  {selectedData.reviews.map((review) => (
                    <View key={review.id} className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                      {/* Header */}
                      <View className="flex-row items-center justify-between mb-3">
                        <View>
                          <Text className="text-white font-bold text-lg">{review.quarter}</Text>
                          <Text className="text-slate-400 text-xs">
                            Reviewed by {review.reviewerName}
                          </Text>
                          <Text className="text-slate-500 text-xs">
                            {new Date(review.date).toLocaleDateString()}
                          </Text>
                        </View>
                        <View className="bg-blue-500/20 px-3 py-2 rounded-lg">
                          <Text className="text-blue-400 font-bold text-lg">
                            {(Object.values(review.ratings).reduce((a, b) => a + b, 0) / 5).toFixed(1)}
                          </Text>
                          <Text className="text-slate-400 text-xs">Overall</Text>
                        </View>
                      </View>

                      {/* Ratings */}
                      <View className="mb-4">
                        <Text className="text-slate-300 font-semibold text-sm mb-2">Ratings</Text>
                        {Object.entries(review.ratings).map(([key, value]) => (
                          <View key={key} className="flex-row items-center justify-between mb-2">
                            <Text className="text-slate-400 text-sm capitalize">{key}</Text>
                            <View className="flex-row items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  size={14}
                                  color={star <= value ? '#f59e0b' : '#334155'}
                                  fill={star <= value ? '#f59e0b' : 'none'}
                                />
                              ))}
                            </View>
                          </View>
                        ))}
                      </View>

                      {/* Strengths */}
                      <View className="mb-3">
                        <Text className="text-emerald-400 font-semibold text-sm mb-2">Strengths</Text>
                        {review.strengths.map((strength, idx) => (
                          <Text key={idx} className="text-slate-300 text-sm mb-1">
                            • {strength}
                          </Text>
                        ))}
                      </View>

                      {/* Areas for Growth */}
                      <View className="mb-3">
                        <Text className="text-orange-400 font-semibold text-sm mb-2">Areas for Growth</Text>
                        {review.areasForGrowth.map((area, idx) => (
                          <Text key={idx} className="text-slate-300 text-sm mb-1">
                            • {area}
                          </Text>
                        ))}
                      </View>

                      {/* Goals */}
                      <View className="mb-3">
                        <Text className="text-blue-400 font-semibold text-sm mb-2">Next Quarter Goals</Text>
                        {review.goals.map((goal, idx) => (
                          <Text key={idx} className="text-slate-300 text-sm mb-1">
                            • {goal}
                          </Text>
                        ))}
                      </View>

                      {/* Notes */}
                      {review.notes && (
                        <View className="bg-slate-800 rounded-lg p-3">
                          <Text className="text-slate-300 text-sm italic">"{review.notes}"</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {!selectedApprentice && (
          <View className="items-center justify-center py-20 px-6">
            <GraduationCap size={48} color="#334155" />
            <Text className="text-slate-400 text-center mt-4">
              Select an apprentice above to view their skills, training, and performance reviews
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
