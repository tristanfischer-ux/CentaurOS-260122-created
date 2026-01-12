import { View, Text, ScrollView, Pressable, Modal, TextInput, Linking } from 'react-native';
import { useState } from 'react';
import {
  Star,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Plus,
  X,
  CheckCircle2,
  Network,
  GraduationCap,
} from 'lucide-react-native';
import { useCurrentWorkspace, useCurrentMembership } from '@/lib/state/app-store';
import { useCreateTask, useWorkspaceMembers } from '@/lib/hooks/queries';
import type { TaskPriority, Function as TaskFunction } from '@/types';
import { router } from 'expo-router';

// Mock team members data - in a real app this would come from the database
interface TeamMember {
  id: string;
  name: string;
  role: 'Founder' | 'FractionalExec' | 'Apprentice';
  specialization: string[];
  email: string;
  phone: string;
  location: string;
  experience: number;
  rating: number;
  costPerDay?: number;
  availability: string;
  bio: string;
  skills: string[];
  currentTasks: number;
  completedTasks: number;
  avatarColor: string;
  joinedDate: string;
}

const MOCK_TEAM: TeamMember[] = [
  // Founders
  {
    id: 'founder-1',
    name: 'Alex Thompson',
    role: 'Founder',
    specialization: ['Engineering', 'Ops'],
    email: 'alex@startup.com',
    phone: '+44 7700 900123',
    location: 'London, UK',
    experience: 12,
    rating: 5.0,
    availability: 'Full-time',
    bio: 'Technical co-founder with background in hardware engineering. Previously led product development at robotics startup.',
    skills: ['Product Development', 'Hardware Engineering', 'Team Leadership', 'Fundraising'],
    currentTasks: 8,
    completedTasks: 124,
    avatarColor: '#3b82f6',
    joinedDate: '2024-01-15',
  },
  {
    id: 'founder-2',
    name: 'Sarah Chen',
    role: 'Founder',
    specialization: ['Sales', 'Marketing'],
    email: 'sarah@startup.com',
    phone: '+44 7700 900124',
    location: 'Manchester, UK',
    experience: 10,
    rating: 5.0,
    availability: 'Full-time',
    bio: 'Business co-founder focused on go-to-market strategy. Former VP of Sales at B2B SaaS company.',
    skills: ['Business Development', 'Sales Strategy', 'Marketing', 'Partnership Development'],
    currentTasks: 12,
    completedTasks: 156,
    avatarColor: '#ec4899',
    joinedDate: '2024-01-15',
  },

  // Fractional Executives
  {
    id: 'exec-1',
    name: 'James Mitchell',
    role: 'FractionalExec',
    specialization: ['Finance', 'Ops'],
    email: 'james.mitchell@fractional.com',
    phone: '+44 7700 900201',
    location: 'Edinburgh, UK',
    experience: 18,
    rating: 4.9,
    costPerDay: 950,
    availability: '2 days/week',
    bio: 'Ex-CFO with expertise in financial planning and operational efficiency. Helped 10+ startups secure Series A funding.',
    skills: ['Financial Planning', 'Fundraising', 'Unit Economics', 'Board Reporting'],
    currentTasks: 5,
    completedTasks: 42,
    avatarColor: '#10b981',
    joinedDate: '2024-02-01',
  },
  {
    id: 'exec-2',
    name: 'Priya Sharma',
    role: 'FractionalExec',
    specialization: ['Marketing'],
    email: 'priya.sharma@fractional.com',
    phone: '+44 7700 900202',
    location: 'Bristol, UK',
    experience: 12,
    rating: 4.8,
    costPerDay: 750,
    availability: '3 days/week',
    bio: 'Growth marketing specialist with track record in scaling startups. Expert in digital marketing and brand strategy.',
    skills: ['Growth Marketing', 'SEO/SEM', 'Content Strategy', 'Brand Building'],
    currentTasks: 6,
    completedTasks: 38,
    avatarColor: '#f59e0b',
    joinedDate: '2024-02-15',
  },
  {
    id: 'exec-3',
    name: 'Marcus Rodriguez',
    role: 'FractionalExec',
    specialization: ['Engineering'],
    email: 'marcus.rodriguez@fractional.com',
    phone: '+44 7700 900203',
    location: 'Cambridge, UK',
    experience: 20,
    rating: 4.9,
    costPerDay: 1100,
    availability: '2 days/week',
    bio: 'Former CTO with deep technical expertise. Specializes in system architecture and engineering team building.',
    skills: ['System Architecture', 'Technical Leadership', 'DevOps', 'Code Review'],
    currentTasks: 4,
    completedTasks: 31,
    avatarColor: '#8b5cf6',
    joinedDate: '2024-03-01',
  },
  {
    id: 'exec-4',
    name: 'Emma Wilson',
    role: 'FractionalExec',
    specialization: ['Sales'],
    email: 'emma.wilson@fractional.com',
    phone: '+44 7700 900204',
    location: 'Birmingham, UK',
    experience: 15,
    rating: 4.7,
    costPerDay: 850,
    availability: '2 days/week',
    bio: 'Enterprise sales expert with experience closing 7-figure deals. Builds scalable sales processes.',
    skills: ['Enterprise Sales', 'Sales Enablement', 'Deal Strategy', 'Pipeline Management'],
    currentTasks: 7,
    completedTasks: 29,
    avatarColor: '#06b6d4',
    joinedDate: '2024-03-10',
  },

  // Apprentices
  {
    id: 'app-1',
    name: 'Emily Carter',
    role: 'Apprentice',
    specialization: ['Marketing'],
    email: 'emily.carter@startup.com',
    phone: '+44 7700 900301',
    location: 'London, UK',
    experience: 2,
    rating: 4.7,
    costPerDay: 150,
    availability: 'Full-time',
    bio: 'Marketing graduate with social media and content creation skills. Fast learner with creative mindset.',
    skills: ['Social Media', 'Content Writing', 'Canva', 'Basic Analytics'],
    currentTasks: 9,
    completedTasks: 67,
    avatarColor: '#3b82f6',
    joinedDate: '2024-04-01',
  },
  {
    id: 'app-2',
    name: 'Daniel Lee',
    role: 'Apprentice',
    specialization: ['Engineering'],
    email: 'daniel.lee@startup.com',
    phone: '+44 7700 900302',
    location: 'Leeds, UK',
    experience: 1,
    rating: 4.5,
    costPerDay: 120,
    availability: 'Full-time',
    bio: 'Computer science grad eager to learn production engineering. Strong fundamentals and work ethic.',
    skills: ['React', 'Node.js', 'Python', 'Git'],
    currentTasks: 5,
    completedTasks: 41,
    avatarColor: '#8b5cf6',
    joinedDate: '2024-04-15',
  },
  {
    id: 'app-3',
    name: 'Aisha Patel',
    role: 'Apprentice',
    specialization: ['Sales'],
    email: 'aisha.patel@startup.com',
    phone: '+44 7700 900303',
    location: 'Manchester, UK',
    experience: 2,
    rating: 4.8,
    costPerDay: 160,
    availability: 'Full-time',
    bio: 'Natural communicator with sales internship experience. Consistently exceeds outreach targets.',
    skills: ['Cold Calling', 'Email Outreach', 'CRM', 'Lead Qualification'],
    currentTasks: 11,
    completedTasks: 89,
    avatarColor: '#ec4899',
    joinedDate: '2024-05-01',
  },
  {
    id: 'app-4',
    name: 'Oliver Hughes',
    role: 'Apprentice',
    specialization: ['Finance'],
    email: 'oliver.hughes@startup.com',
    phone: '+44 7700 900304',
    location: 'Glasgow, UK',
    experience: 1,
    rating: 4.6,
    costPerDay: 140,
    availability: 'Full-time',
    bio: 'Finance graduate with strong Excel skills. Detail-oriented and eager to learn financial operations.',
    skills: ['Excel', 'Financial Modeling', 'QuickBooks', 'Data Analysis'],
    currentTasks: 6,
    completedTasks: 38,
    avatarColor: '#10b981',
    joinedDate: '2024-05-15',
  },
  {
    id: 'app-5',
    name: 'Lily Wong',
    role: 'Apprentice',
    specialization: ['Marketing', 'Admin'],
    email: 'lily.wong@startup.com',
    phone: '+44 7700 900305',
    location: 'London, UK',
    experience: 2,
    rating: 4.7,
    costPerDay: 155,
    availability: 'Full-time',
    bio: 'Organized multitasker with experience in marketing campaigns and administrative support.',
    skills: ['Email Marketing', 'Event Planning', 'Mailchimp', 'Project Coordination'],
    currentTasks: 8,
    completedTasks: 72,
    avatarColor: '#f59e0b',
    joinedDate: '2024-06-01',
  },
  {
    id: 'app-6',
    name: 'Jake Morrison',
    role: 'Apprentice',
    specialization: ['Engineering'],
    email: 'jake.morrison@startup.com',
    phone: '+44 7700 900306',
    location: 'Newcastle, UK',
    experience: 1,
    rating: 4.4,
    costPerDay: 125,
    availability: 'Full-time',
    bio: 'Self-taught developer passionate about mobile development. Built several personal projects.',
    skills: ['React Native', 'JavaScript', 'Firebase', 'UI/UX'],
    currentTasks: 4,
    completedTasks: 29,
    avatarColor: '#06b6d4',
    joinedDate: '2024-06-15',
  },
  {
    id: 'app-7',
    name: 'Sophia Martin',
    role: 'Apprentice',
    specialization: ['Ops'],
    email: 'sophia.martin@startup.com',
    phone: '+44 7700 900307',
    location: 'Brighton, UK',
    experience: 2,
    rating: 4.6,
    costPerDay: 145,
    availability: 'Full-time',
    bio: 'Process-oriented with project management skills. Excellent at documentation and workflow optimization.',
    skills: ['Notion', 'Asana', 'Process Documentation', 'Data Entry'],
    currentTasks: 7,
    completedTasks: 54,
    avatarColor: '#14b8a6',
    joinedDate: '2024-07-01',
  },
];

export default function TeamScreen() {
  const currentWorkspace = useCurrentWorkspace();
  const currentMembership = useCurrentMembership();
  const createTaskMutation = useCreateTask();
  const { data: memberships = [] } = useWorkspaceMembers(currentWorkspace?.id ?? null);

  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [filterRole, setFilterRole] = useState<'all' | 'Founder' | 'FractionalExec' | 'Apprentice'>('all');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskFunction, setTaskFunction] = useState<TaskFunction>('Ops');

  // Convert memberships to team member format for display
  const teamMembers = memberships.map(membership => ({
    id: membership.userId,
    name: membership.user?.name || 'Unknown',
    role: membership.role,
    email: membership.user?.email || '',
    phone: '', // Not available in current data model
    location: '', // Not available
    specialization: [membership.function],
    experience: 0, // Not available
    rating: 0, // Not available
    costPerDay: undefined,
    availability: 'Active',
    bio: '',
    skills: [membership.function],
    currentTasks: 0,
    completedTasks: 0,
    avatarColor: getColorForRole(membership.role),
    joinedDate: membership.joinedAt || new Date().toISOString(),
  }));

  const filteredTeam = teamMembers.filter(member => {
    if (filterRole === 'all') return true;
    return member.role === filterRole;
  });

  const roleStats = {
    total: teamMembers.length,
    founders: teamMembers.filter(m => m.role === 'Founder').length,
    execs: teamMembers.filter(m => m.role === 'FractionalExec').length,
    apprentices: teamMembers.filter(m => m.role === 'Apprentice').length,
  };

  function getColorForRole(role: string) {
    switch (role) {
      case 'Founder': return '#3b82f6';
      case 'FractionalExec': return '#8b5cf6';
      case 'Apprentice': return '#10b981';
      default: return '#64748b';
    }
  }

  const handleAssignTask = async () => {
    if (!currentWorkspace || !selectedMember || !taskTitle.trim()) return;

    try {
      await createTaskMutation.mutateAsync({
        workspaceId: currentWorkspace.id,
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
        assigneeId: selectedMember.id,
        priority: taskPriority,
        function: taskFunction,
      });

      setTaskTitle('');
      setTaskDescription('');
      setTaskPriority('medium');
      setTaskFunction('Ops');
      setShowTaskModal(false);
      alert(`Task assigned to ${selectedMember.name}`);
    } catch (error) {
      console.error('Failed to assign task:', error);
      alert('Failed to assign task. Please try again.');
    }
  };

  const handleEmailPress = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handlePhonePress = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Founder': return 'bg-blue-500/20 border-blue-500';
      case 'FractionalExec': return 'bg-purple-500/20 border-purple-500';
      case 'Apprentice': return 'bg-emerald-500/20 border-emerald-500';
      default: return 'bg-slate-500/20 border-slate-500';
    }
  };

  const getRoleTextColor = (role: string) => {
    switch (role) {
      case 'Founder': return 'text-blue-400';
      case 'FractionalExec': return 'text-purple-400';
      case 'Apprentice': return 'text-emerald-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <View className="flex-1 bg-slate-950">
      {/* Header Stats */}
      <View className="p-6 pb-4">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-white text-2xl font-bold">Team Directory</Text>

          {/* Action Buttons */}
          <View className="flex-row gap-2">
            {/* Learning Button - Founders/Execs Only */}
            {(currentMembership?.role === 'Founder' || currentMembership?.role === 'FractionalExec') && (
              <Pressable
                onPress={() => router.push('/learning')}
                className="bg-emerald-500 px-4 py-2 rounded-xl flex-row items-center active:opacity-80"
              >
                <GraduationCap size={16} color="white" />
                <Text className="text-white text-sm font-semibold ml-2">Learning</Text>
              </Pressable>
            )}

            {/* Org Chart Button */}
            <Pressable
              onPress={() => router.push('/org-diagram')}
              className="bg-blue-500 px-4 py-2 rounded-xl flex-row items-center active:opacity-80"
            >
              <Network size={16} color="white" />
              <Text className="text-white text-sm font-semibold ml-2">Org Chart</Text>
            </Pressable>
          </View>
        </View>

        {/* Stats Cards */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-slate-900 rounded-xl p-3 border border-slate-800">
            <Text className="text-slate-400 text-xs mb-1">Total</Text>
            <Text className="text-white text-2xl font-bold">{roleStats.total}</Text>
          </View>
          <View className="flex-1 bg-slate-900 rounded-xl p-3 border border-slate-800">
            <Text className="text-slate-400 text-xs mb-1">Founders</Text>
            <Text className="text-blue-400 text-2xl font-bold">{roleStats.founders}</Text>
          </View>
          <View className="flex-1 bg-slate-900 rounded-xl p-3 border border-slate-800">
            <Text className="text-slate-400 text-xs mb-1">Execs</Text>
            <Text className="text-purple-400 text-2xl font-bold">{roleStats.execs}</Text>
          </View>
          <View className="flex-1 bg-slate-900 rounded-xl p-3 border border-slate-800">
            <Text className="text-slate-400 text-xs mb-1">Apprentices</Text>
            <Text className="text-emerald-400 text-2xl font-bold">{roleStats.apprentices}</Text>
          </View>
        </View>

        {/* Role Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
          <View className="flex-row gap-2">
            {[
              { value: 'all', label: 'All Team' },
              { value: 'Founder', label: 'Founders' },
              { value: 'FractionalExec', label: 'Executives' },
              { value: 'Apprentice', label: 'Apprentices' },
            ].map((filter) => (
              <Pressable
                key={filter.value}
                onPress={() => setFilterRole(filter.value as any)}
                className={`px-4 py-2 rounded-xl ${
                  filterRole === filter.value
                    ? 'bg-blue-500'
                    : 'bg-slate-800 border border-slate-700'
                }`}
              >
                <Text className={`text-sm font-medium ${
                  filterRole === filter.value ? 'text-white' : 'text-slate-400'
                }`}>
                  {filter.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Team List */}
      <ScrollView className="flex-1 px-6">
        <View className="gap-3 pb-6">
          {filteredTeam.map((member) => (
            <Pressable
              key={member.id}
              onPress={() => setSelectedMember(member)}
              className="bg-slate-900 rounded-2xl p-4 border border-slate-800 active:opacity-70"
            >
              <View className="flex-row items-start">
                {/* Avatar */}
                <View
                  className="w-14 h-14 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: member.avatarColor + '20' }}
                >
                  <Text
                    className="text-xl font-bold"
                    style={{ color: member.avatarColor }}
                  >
                    {member.name.charAt(0)}
                  </Text>
                </View>

                {/* Info */}
                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-white font-bold text-base">{member.name}</Text>
                    <View className="flex-row items-center">
                      <Star size={12} color="#f59e0b" fill="#f59e0b" />
                      <Text className="text-slate-300 text-xs ml-1">{member.rating}</Text>
                    </View>
                  </View>

                  <View className={`self-start px-2 py-0.5 rounded border mb-2 ${getRoleBadgeColor(member.role)}`}>
                    <Text className={`text-xs font-semibold ${getRoleTextColor(member.role)}`}>
                      {member.role === 'FractionalExec' ? 'Executive' : member.role}
                    </Text>
                  </View>

                  <Text className="text-slate-400 text-xs mb-2">
                    {member.specialization.join(' • ')} • {member.experience}y exp
                  </Text>

                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                      <View className="flex-row items-center">
                        <Briefcase size={12} color="#64748b" />
                        <Text className="text-slate-400 text-xs ml-1">
                          {member.currentTasks} active
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <CheckCircle2 size={12} color="#10b981" />
                        <Text className="text-emerald-400 text-xs ml-1">
                          {member.completedTasks} done
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Member Detail Modal */}
      <Modal visible={selectedMember !== null} transparent animationType="slide">
        <View className="flex-1 bg-black/70">
          {selectedMember && (
            <View className="mt-auto bg-slate-900 rounded-t-3xl" style={{ maxHeight: '90%' }}>
              <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                {/* Header */}
                <View className="p-6 border-b border-slate-800">
                  <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-1">
                      <View
                        className="w-16 h-16 rounded-full items-center justify-center mb-3"
                        style={{ backgroundColor: selectedMember.avatarColor + '20' }}
                      >
                        <Text
                          className="text-2xl font-bold"
                          style={{ color: selectedMember.avatarColor }}
                        >
                          {selectedMember.name.charAt(0)}
                        </Text>
                      </View>
                      <Text className="text-white text-2xl font-bold mb-1">
                        {selectedMember.name}
                      </Text>
                      <View className={`self-start px-3 py-1 rounded-lg border ${getRoleBadgeColor(selectedMember.role)}`}>
                        <Text className={`text-sm font-semibold ${getRoleTextColor(selectedMember.role)}`}>
                          {selectedMember.role === 'FractionalExec' ? 'Fractional Executive' : selectedMember.role}
                        </Text>
                      </View>
                    </View>
                    <Pressable onPress={() => setSelectedMember(null)}>
                      <X size={24} color="#94a3b8" />
                    </Pressable>
                  </View>

                  {/* Stats Row */}
                  <View className="flex-row gap-3 mb-4">
                    <View className="flex-1 bg-slate-800 rounded-xl p-3">
                      <Text className="text-slate-400 text-xs mb-1">Rating</Text>
                      <View className="flex-row items-center">
                        <Star size={14} color="#f59e0b" fill="#f59e0b" />
                        <Text className="text-white font-bold ml-1">{selectedMember.rating}</Text>
                      </View>
                    </View>
                    <View className="flex-1 bg-slate-800 rounded-xl p-3">
                      <Text className="text-slate-400 text-xs mb-1">Experience</Text>
                      <Text className="text-white font-bold">{selectedMember.experience}y</Text>
                    </View>
                    {selectedMember.costPerDay && (
                      <View className="flex-1 bg-slate-800 rounded-xl p-3">
                        <Text className="text-slate-400 text-xs mb-1">Rate</Text>
                        <Text className="text-emerald-400 font-bold text-xs">£{selectedMember.costPerDay}/d</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Contact Info */}
                <View className="p-6 border-b border-slate-800">
                  <Text className="text-white font-semibold mb-3">Contact Information</Text>

                  <Pressable
                    onPress={() => handleEmailPress(selectedMember.email)}
                    className="flex-row items-center mb-3 active:opacity-70"
                  >
                    <View className="w-10 h-10 bg-blue-500/20 rounded-lg items-center justify-center mr-3">
                      <Mail size={18} color="#3b82f6" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-400 text-xs">Email</Text>
                      <Text className="text-white text-sm">{selectedMember.email}</Text>
                    </View>
                  </Pressable>

                  <Pressable
                    onPress={() => handlePhonePress(selectedMember.phone)}
                    className="flex-row items-center mb-3 active:opacity-70"
                  >
                    <View className="w-10 h-10 bg-emerald-500/20 rounded-lg items-center justify-center mr-3">
                      <Phone size={18} color="#10b981" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-400 text-xs">Phone</Text>
                      <Text className="text-white text-sm">{selectedMember.phone}</Text>
                    </View>
                  </Pressable>

                  <View className="flex-row items-center">
                    <View className="w-10 h-10 bg-purple-500/20 rounded-lg items-center justify-center mr-3">
                      <MapPin size={18} color="#8b5cf6" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-400 text-xs">Location</Text>
                      <Text className="text-white text-sm">{selectedMember.location}</Text>
                    </View>
                  </View>
                </View>

                {/* Professional Info */}
                <View className="p-6 border-b border-slate-800">
                  <Text className="text-white font-semibold mb-3">Professional Details</Text>

                  <View className="mb-4">
                    <Text className="text-slate-400 text-xs mb-1">Specializations</Text>
                    <Text className="text-white text-sm">{selectedMember.specialization.join(', ')}</Text>
                  </View>

                  <View className="mb-4">
                    <Text className="text-slate-400 text-xs mb-1">Availability</Text>
                    <Text className="text-white text-sm">{selectedMember.availability}</Text>
                  </View>

                  <View className="mb-4">
                    <Text className="text-slate-400 text-xs mb-1">Joined</Text>
                    <Text className="text-white text-sm">
                      {new Date(selectedMember.joinedDate).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </Text>
                  </View>

                  <View className="mb-4">
                    <Text className="text-slate-400 text-xs mb-1">About</Text>
                    <Text className="text-slate-300 text-sm leading-5">{selectedMember.bio}</Text>
                  </View>

                  <View>
                    <Text className="text-slate-400 text-xs mb-2">Skills</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {selectedMember.skills.map((skill: string, idx: number) => (
                        <View key={idx} className="bg-blue-500/20 px-3 py-1.5 rounded-lg">
                          <Text className="text-blue-400 text-xs font-medium">{skill}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>

                {/* Task Stats */}
                <View className="p-6 border-b border-slate-800">
                  <Text className="text-white font-semibold mb-3">Task Performance</Text>
                  <View className="flex-row gap-3">
                    <View className="flex-1 bg-slate-800 rounded-xl p-4">
                      <Briefcase size={20} color="#3b82f6" />
                      <Text className="text-white text-2xl font-bold mt-2">{selectedMember.currentTasks}</Text>
                      <Text className="text-slate-400 text-xs">Active Tasks</Text>
                    </View>
                    <View className="flex-1 bg-slate-800 rounded-xl p-4">
                      <CheckCircle2 size={20} color="#10b981" />
                      <Text className="text-white text-2xl font-bold mt-2">{selectedMember.completedTasks}</Text>
                      <Text className="text-slate-400 text-xs">Completed</Text>
                    </View>
                  </View>
                </View>

                {/* Actions */}
                <View className="p-6 gap-3">
                  {(currentMembership?.role === 'Founder' || currentMembership?.role === 'FractionalExec') && (
                    <Pressable
                      onPress={() => {
                        setShowTaskModal(true);
                      }}
                      className="bg-blue-500 py-4 rounded-xl flex-row items-center justify-center active:opacity-80"
                    >
                      <Plus size={20} color="white" />
                      <Text className="text-white font-bold text-base ml-2">
                        Assign New Task
                      </Text>
                    </Pressable>
                  )}

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

      {/* Assign Task Modal */}
      <Modal visible={showTaskModal} transparent animationType="fade">
        <View className="flex-1 bg-black/70 justify-center px-6">
          <View className="bg-slate-900 rounded-3xl p-6" style={{ maxHeight: '80%' }}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ flex: 1 }}>
              <Text className="text-white text-2xl font-bold mb-1">Assign Task</Text>
              {selectedMember && (
                <Text className="text-slate-400 text-sm mb-6">
                  Assigning to {selectedMember.name}
                </Text>
              )}

              {/* Title */}
              <View className="mb-4">
                <Text className="text-slate-400 text-sm font-medium mb-2">Task Title *</Text>
                <TextInput
                  value={taskTitle}
                  onChangeText={setTaskTitle}
                  placeholder="Enter task title"
                  placeholderTextColor="#64748b"
                  className="bg-slate-800 text-white px-4 py-3 rounded-xl border border-slate-700"
                />
              </View>

              {/* Description */}
              <View className="mb-4">
                <Text className="text-slate-400 text-sm font-medium mb-2">Description</Text>
                <TextInput
                  value={taskDescription}
                  onChangeText={setTaskDescription}
                  placeholder="Enter task description"
                  placeholderTextColor="#64748b"
                  multiline
                  numberOfLines={3}
                  className="bg-slate-800 text-white px-4 py-3 rounded-xl border border-slate-700"
                  style={{ minHeight: 80, textAlignVertical: 'top' }}
                />
              </View>

              {/* Function */}
              <View className="mb-4">
                <Text className="text-slate-400 text-sm font-medium mb-2">Function</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                  <View className="flex-row gap-2">
                    {(['Finance', 'Sales', 'Marketing', 'Ops', 'Engineering', 'Admin'] as TaskFunction[]).map((func) => (
                      <Pressable
                        key={func}
                        onPress={() => setTaskFunction(func)}
                        className={`px-4 py-2 rounded-xl border ${
                          taskFunction === func
                            ? 'bg-blue-500 border-blue-500'
                            : 'bg-slate-800 border-slate-700'
                        }`}
                      >
                        <Text className={`text-sm font-medium ${
                          taskFunction === func ? 'text-white' : 'text-slate-400'
                        }`}>
                          {func}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Priority */}
              <View className="mb-6">
                <Text className="text-slate-400 text-sm font-medium mb-2">Priority</Text>
                <View className="flex-row gap-2">
                  {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map((priority) => (
                    <Pressable
                      key={priority}
                      onPress={() => setTaskPriority(priority)}
                      className={`flex-1 px-4 py-3 rounded-xl border ${
                        taskPriority === priority
                          ? 'bg-blue-500 border-blue-500'
                          : 'bg-slate-800 border-slate-700'
                      }`}
                    >
                      <Text className={`text-sm font-medium text-center capitalize ${
                        taskPriority === priority ? 'text-white' : 'text-slate-400'
                      }`}>
                        {priority}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Action Buttons */}
              <View className="gap-3">
                <Pressable
                  onPress={handleAssignTask}
                  disabled={!taskTitle.trim() || createTaskMutation.isPending}
                  className={`py-4 rounded-xl ${
                    !taskTitle.trim() || createTaskMutation.isPending
                      ? 'bg-slate-700'
                      : 'bg-blue-500'
                  } active:opacity-80`}
                >
                  <Text className="text-white text-center font-bold text-base">
                    {createTaskMutation.isPending ? 'Assigning...' : 'Assign Task'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setShowTaskModal(false);
                    setTaskTitle('');
                    setTaskDescription('');
                  }}
                  className="bg-slate-800 py-3 rounded-xl active:opacity-80"
                >
                  <Text className="text-slate-400 text-center font-semibold">Cancel</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
