import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react-native';
import type { Function, Availability, SkillLevel } from '@/types';

const FUNCTIONS: Function[] = ['Finance', 'Sales', 'Marketing', 'Ops', 'Engineering', 'Admin'];
const AVAILABILITIES: Availability[] = ['full-time', 'part-time'];
const SKILL_LEVELS: SkillLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];

export default function ApprenticeOnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);

  // Form state
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [functionInterest, setFunctionInterest] = useState<Function | null>(null);
  const [education, setEducation] = useState<string>('');
  const [institution, setInstitution] = useState<string>('');
  const [technicalSkill, setTechnicalSkill] = useState<string>('');
  const [technicalSkillLevel, setTechnicalSkillLevel] = useState<SkillLevel>('beginner');
  const [technicalSkills, setTechnicalSkills] = useState<{ name: string; level: SkillLevel }[]>([]);
  const [learningGoals, setLearningGoals] = useState<string>('');
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [dayRate, setDayRate] = useState<string>('');

  const totalSteps = 6;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    // TODO: Save apprentice profile to state/backend
    // For now, just navigate to the main app
    router.replace('/(tabs)' as any);
  };

  const addSkill = () => {
    if (technicalSkill.trim().length > 0) {
      setTechnicalSkills([...technicalSkills, { name: technicalSkill.trim(), level: technicalSkillLevel }]);
      setTechnicalSkill('');
      setTechnicalSkillLevel('beginner');
    }
  };

  const removeSkill = (index: number) => {
    setTechnicalSkills(technicalSkills.filter((_, i) => i !== index));
  };

  const canProceed = () => {
    switch (step) {
      case 1: return name.trim().length > 0 && email.trim().length > 0;
      case 2: return functionInterest !== null;
      case 3: return true; // Education is optional
      case 4: return technicalSkills.length > 0;
      case 5: return learningGoals.trim().length > 0;
      case 6: return availability !== null && dayRate.trim().length > 0 && Number(dayRate) > 0;
      default: return false;
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#334155']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Pressable onPress={handleBack} className="p-2 active:opacity-60">
              <ArrowLeft size={24} color="#94a3b8" />
            </Pressable>
            <Text className="text-gray-600 dark:text-slate-400 text-sm font-semibold">
              Step {step} of {totalSteps}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Progress Bar */}
          <View className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <View
              className="h-full bg-emerald-500"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="px-6">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <View>
                <Text className="text-gray-900 dark:text-white text-3xl font-bold mb-2">
                  Welcome, Apprentice!
                </Text>
                <Text className="text-gray-600 dark:text-slate-400 text-base leading-6 mb-8">
                  Let's start with your basic information
                </Text>

                <Text className="text-gray-900 dark:text-white text-sm font-semibold mb-2">Full Name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Sarah Johnson"
                  placeholderTextColor="#64748b"
                  className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-gray-900 dark:text-white text-base mb-4"
                />

                <Text className="text-gray-900 dark:text-white text-sm font-semibold mb-2">Email Address</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="sarah@example.com"
                  placeholderTextColor="#64748b"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-gray-900 dark:text-white text-base"
                />
              </View>
            )}

            {/* Step 2: Function Interest */}
            {step === 2 && (
              <View>
                <Text className="text-gray-900 dark:text-white text-3xl font-bold mb-2">
                  Your Interest
                </Text>
                <Text className="text-gray-600 dark:text-slate-400 text-base leading-6 mb-8">
                  Which function would you like to focus on?
                </Text>

                <View className="gap-3">
                  {FUNCTIONS.map((func) => (
                    <Pressable
                      key={func}
                      onPress={() => setFunctionInterest(func)}
                      className="active:opacity-80"
                    >
                      <View
                        className={`rounded-xl p-4 border-2 flex-row items-center justify-between ${
                          functionInterest === func
                            ? 'bg-emerald-500/20 border-emerald-500'
                            : 'bg-slate-900 border-slate-700'
                        }`}
                      >
                        <Text
                          className={`text-base font-semibold ${
                            functionInterest === func ? 'text-emerald-400' : 'text-white'
                          }`}
                        >
                          {func}
                        </Text>
                        {functionInterest === func && <Check size={20} color="#10b981" />}
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Step 3: Education (Optional) */}
            {step === 3 && (
              <View>
                <Text className="text-gray-900 dark:text-white text-3xl font-bold mb-2">
                  Education
                </Text>
                <Text className="text-gray-600 dark:text-slate-400 text-base leading-6 mb-8">
                  Share your educational background (optional)
                </Text>

                <Text className="text-gray-900 dark:text-white text-sm font-semibold mb-2">
                  Degree / Qualification
                </Text>
                <TextInput
                  value={education}
                  onChangeText={setEducation}
                  placeholder="Bachelor's in Computer Science"
                  placeholderTextColor="#64748b"
                  className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-gray-900 dark:text-white text-base mb-4"
                />

                <Text className="text-gray-900 dark:text-white text-sm font-semibold mb-2">
                  Institution
                </Text>
                <TextInput
                  value={institution}
                  onChangeText={setInstitution}
                  placeholder="University of London"
                  placeholderTextColor="#64748b"
                  className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-gray-900 dark:text-white text-base"
                />
              </View>
            )}

            {/* Step 4: Technical Skills */}
            {step === 4 && (
              <View>
                <Text className="text-gray-900 dark:text-white text-3xl font-bold mb-2">
                  Your Skills
                </Text>
                <Text className="text-gray-600 dark:text-slate-400 text-base leading-6 mb-8">
                  What technical skills do you have?
                </Text>

                {/* Added Skills */}
                {technicalSkills.length > 0 && (
                  <View className="mb-6 gap-2">
                    {technicalSkills.map((skill, index) => (
                      <View
                        key={index}
                        className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 flex-row items-center justify-between"
                      >
                        <View className="flex-1">
                          <Text className="text-gray-900 dark:text-white text-base font-semibold">{skill.name}</Text>
                          <Text className="text-gray-600 dark:text-slate-400 text-sm capitalize">{skill.level}</Text>
                        </View>
                        <Pressable onPress={() => removeSkill(index)} className="p-2 active:opacity-60">
                          <X size={20} color="#ef4444" />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}

                {/* Add New Skill */}
                <Text className="text-gray-900 dark:text-white text-sm font-semibold mb-2">Skill Name</Text>
                <TextInput
                  value={technicalSkill}
                  onChangeText={setTechnicalSkill}
                  placeholder="Excel, Python, Salesforce, etc."
                  placeholderTextColor="#64748b"
                  className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-gray-900 dark:text-white text-base mb-4"
                />

                <Text className="text-gray-900 dark:text-white text-sm font-semibold mb-2">Skill Level</Text>
                <View className="flex-row gap-2 mb-4">
                  {SKILL_LEVELS.map((level) => (
                    <Pressable
                      key={level}
                      onPress={() => setTechnicalSkillLevel(level)}
                      className="active:opacity-80"
                    >
                      <View
                        className={`rounded-xl px-4 py-2 border-2 ${
                          technicalSkillLevel === level
                            ? 'bg-emerald-500/20 border-emerald-500'
                            : 'bg-slate-900 border-slate-700'
                        }`}
                      >
                        <Text
                          className={`text-sm font-semibold capitalize ${
                            technicalSkillLevel === level ? 'text-emerald-400' : 'text-white'
                          }`}
                        >
                          {level}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>

                <Pressable
                  onPress={addSkill}
                  disabled={technicalSkill.trim().length === 0}
                  className={`rounded-xl py-3 ${
                    technicalSkill.trim().length > 0
                      ? 'bg-emerald-500 active:opacity-80'
                      : 'bg-slate-800'
                  }`}
                >
                  <Text
                    className={`text-center text-base font-semibold ${
                      technicalSkill.trim().length > 0 ? 'text-white' : 'text-slate-600'
                    }`}
                  >
                    Add Skill
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Step 5: Learning Goals */}
            {step === 5 && (
              <View>
                <Text className="text-gray-900 dark:text-white text-3xl font-bold mb-2">
                  Learning Goals
                </Text>
                <Text className="text-gray-600 dark:text-slate-400 text-base leading-6 mb-8">
                  What do you want to learn and achieve?
                </Text>

                <Text className="text-gray-900 dark:text-white text-sm font-semibold mb-2">Your Goals</Text>
                <TextInput
                  value={learningGoals}
                  onChangeText={setLearningGoals}
                  placeholder="I want to master financial modeling, learn how startups raise capital, and eventually become a CFO..."
                  placeholderTextColor="#64748b"
                  multiline
                  numberOfLines={6}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-gray-900 dark:text-white text-base"
                  style={{ textAlignVertical: 'top' }}
                />
              </View>
            )}

            {/* Step 6: Availability & Rate */}
            {step === 6 && (
              <View>
                <Text className="text-gray-900 dark:text-white text-3xl font-bold mb-2">
                  Availability & Rate
                </Text>
                <Text className="text-gray-600 dark:text-slate-400 text-base leading-6 mb-8">
                  Final step - let's set your availability and day rate
                </Text>

                <Text className="text-gray-900 dark:text-white text-sm font-semibold mb-2">Availability</Text>
                <View className="gap-3 mb-6">
                  {AVAILABILITIES.map((avail) => (
                    <Pressable
                      key={avail}
                      onPress={() => setAvailability(avail)}
                      className="active:opacity-80"
                    >
                      <View
                        className={`rounded-xl p-4 border-2 flex-row items-center justify-between ${
                          availability === avail
                            ? 'bg-emerald-500/20 border-emerald-500'
                            : 'bg-slate-900 border-slate-700'
                        }`}
                      >
                        <Text
                          className={`text-base font-semibold capitalize ${
                            availability === avail ? 'text-emerald-400' : 'text-white'
                          }`}
                        >
                          {avail.replace('-', ' ')}
                        </Text>
                        {availability === avail && <Check size={20} color="#10b981" />}
                      </View>
                    </Pressable>
                  ))}
                </View>

                <Text className="text-gray-900 dark:text-white text-sm font-semibold mb-2">Day Rate (£)</Text>
                <View className="flex-row items-center">
                  <Text className="text-gray-900 dark:text-white text-2xl mr-2">£</Text>
                  <TextInput
                    value={dayRate}
                    onChangeText={setDayRate}
                    placeholder="150"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-gray-900 dark:text-white text-base"
                  />
                </View>
                <Text className="text-slate-500 text-sm mt-2">
                  Your standard daily rate. You can negotiate per engagement.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Footer Button */}
        <View className="px-6 pb-6">
          <Pressable
            onPress={handleNext}
            disabled={!canProceed()}
            className={`rounded-2xl py-5 flex-row items-center justify-center ${
              canProceed() ? 'bg-emerald-500 active:opacity-80' : 'bg-slate-800'
            }`}
          >
            <Text
              className={`text-lg font-bold mr-2 ${
                canProceed() ? 'text-white' : 'text-slate-600'
              }`}
            >
              {step === totalSteps ? 'Complete' : 'Continue'}
            </Text>
            <ArrowRight size={20} color={canProceed() ? '#ffffff' : '#475569'} />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
