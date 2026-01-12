import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react-native';
import type { Function, Availability, ExecutiveProfile } from '@/types';

const FUNCTIONS: Function[] = ['Finance', 'Sales', 'Marketing', 'Ops', 'Engineering', 'Admin'];
const AVAILABILITIES: Availability[] = ['1-day', '2-day', '3-day', 'full-time'];

export default function ExecutiveOnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);

  // Form state
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [primaryFunction, setPrimaryFunction] = useState<Function | null>(null);
  const [yearsOfExperience, setYearsOfExperience] = useState<string>('');
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [dayRate, setDayRate] = useState<string>('');
  const [skills, setSkills] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [linkedInUrl, setLinkedInUrl] = useState<string>('');

  const totalSteps = 7;

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
    // TODO: Save executive profile to state/backend
    // For now, just navigate to the main app
    router.replace('/(tabs)' as any);
  };

  const canProceed = () => {
    switch (step) {
      case 1: return name.trim().length > 0 && email.trim().length > 0;
      case 2: return primaryFunction !== null;
      case 3: return yearsOfExperience.trim().length > 0 && Number(yearsOfExperience) >= 0;
      case 4: return availability !== null;
      case 5: return dayRate.trim().length > 0 && Number(dayRate) > 0;
      case 6: return skills.trim().length > 0;
      case 7: return bio.trim().length > 0;
      default: return false;
    }
  };

  return (
    <View className="flex-1 bg-slate-950">
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
            <Text className="text-slate-400 text-sm font-semibold">
              Step {step} of {totalSteps}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Progress Bar */}
          <View className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <View
              className="h-full bg-violet-500"
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
                <Text className="text-white text-3xl font-bold mb-2">
                  Welcome, Executive!
                </Text>
                <Text className="text-slate-400 text-base leading-6 mb-8">
                  Let's start with your basic information
                </Text>

                <Text className="text-white text-sm font-semibold mb-2">Full Name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="John Smith"
                  placeholderTextColor="#64748b"
                  className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-white text-base mb-4"
                />

                <Text className="text-white text-sm font-semibold mb-2">Email Address</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="john@example.com"
                  placeholderTextColor="#64748b"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-white text-base"
                />
              </View>
            )}

            {/* Step 2: Primary Function */}
            {step === 2 && (
              <View>
                <Text className="text-white text-3xl font-bold mb-2">
                  Your Expertise
                </Text>
                <Text className="text-slate-400 text-base leading-6 mb-8">
                  What's your primary functional area?
                </Text>

                <View className="gap-3">
                  {FUNCTIONS.map((func) => (
                    <Pressable
                      key={func}
                      onPress={() => setPrimaryFunction(func)}
                      className="active:opacity-80"
                    >
                      <View
                        className={`rounded-xl p-4 border-2 flex-row items-center justify-between ${
                          primaryFunction === func
                            ? 'bg-violet-500/20 border-violet-500'
                            : 'bg-slate-900 border-slate-700'
                        }`}
                      >
                        <Text
                          className={`text-base font-semibold ${
                            primaryFunction === func ? 'text-violet-400' : 'text-white'
                          }`}
                        >
                          {func}
                        </Text>
                        {primaryFunction === func && <Check size={20} color="#8b5cf6" />}
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Step 3: Experience */}
            {step === 3 && (
              <View>
                <Text className="text-white text-3xl font-bold mb-2">
                  Your Experience
                </Text>
                <Text className="text-slate-400 text-base leading-6 mb-8">
                  How many years of experience do you have in {primaryFunction}?
                </Text>

                <Text className="text-white text-sm font-semibold mb-2">Years of Experience</Text>
                <TextInput
                  value={yearsOfExperience}
                  onChangeText={setYearsOfExperience}
                  placeholder="5"
                  placeholderTextColor="#64748b"
                  keyboardType="numeric"
                  className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-white text-base"
                />
              </View>
            )}

            {/* Step 4: Availability */}
            {step === 4 && (
              <View>
                <Text className="text-white text-3xl font-bold mb-2">
                  Availability
                </Text>
                <Text className="text-slate-400 text-base leading-6 mb-8">
                  How much time can you commit to client engagements?
                </Text>

                <View className="gap-3">
                  {AVAILABILITIES.map((avail) => (
                    <Pressable
                      key={avail}
                      onPress={() => setAvailability(avail)}
                      className="active:opacity-80"
                    >
                      <View
                        className={`rounded-xl p-4 border-2 flex-row items-center justify-between ${
                          availability === avail
                            ? 'bg-violet-500/20 border-violet-500'
                            : 'bg-slate-900 border-slate-700'
                        }`}
                      >
                        <Text
                          className={`text-base font-semibold ${
                            availability === avail ? 'text-violet-400' : 'text-white'
                          }`}
                        >
                          {avail === 'full-time' ? 'Full-time' : `${avail.split('-')[0]} per week`}
                        </Text>
                        {availability === avail && <Check size={20} color="#8b5cf6" />}
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Step 5: Day Rate */}
            {step === 5 && (
              <View>
                <Text className="text-white text-3xl font-bold mb-2">
                  Your Day Rate
                </Text>
                <Text className="text-slate-400 text-base leading-6 mb-8">
                  What's your preferred daily rate in GBP?
                </Text>

                <Text className="text-white text-sm font-semibold mb-2">Day Rate (£)</Text>
                <View className="flex-row items-center">
                  <Text className="text-white text-2xl mr-2">£</Text>
                  <TextInput
                    value={dayRate}
                    onChangeText={setDayRate}
                    placeholder="500"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-white text-base"
                  />
                </View>
                <Text className="text-slate-500 text-sm mt-2">
                  This is your standard daily rate. You can negotiate per engagement.
                </Text>
              </View>
            )}

            {/* Step 6: Skills */}
            {step === 6 && (
              <View>
                <Text className="text-white text-3xl font-bold mb-2">
                  Your Skills
                </Text>
                <Text className="text-slate-400 text-base leading-6 mb-8">
                  List your key skills (comma-separated)
                </Text>

                <Text className="text-white text-sm font-semibold mb-2">Skills</Text>
                <TextInput
                  value={skills}
                  onChangeText={setSkills}
                  placeholder="Financial Modeling, Excel, Fundraising, Unit Economics"
                  placeholderTextColor="#64748b"
                  multiline
                  numberOfLines={4}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-white text-base"
                  style={{ textAlignVertical: 'top' }}
                />
                <Text className="text-slate-500 text-sm mt-2">
                  Separate each skill with a comma
                </Text>
              </View>
            )}

            {/* Step 7: Bio */}
            {step === 7 && (
              <View>
                <Text className="text-white text-3xl font-bold mb-2">
                  About You
                </Text>
                <Text className="text-slate-400 text-base leading-6 mb-8">
                  Tell founders why they should work with you
                </Text>

                <Text className="text-white text-sm font-semibold mb-2">Professional Bio</Text>
                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  placeholder="I'm a seasoned finance executive with 10 years of experience helping startups scale from seed to Series B..."
                  placeholderTextColor="#64748b"
                  multiline
                  numberOfLines={6}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-white text-base mb-4"
                  style={{ textAlignVertical: 'top' }}
                />

                <Text className="text-white text-sm font-semibold mb-2">
                  LinkedIn URL (Optional)
                </Text>
                <TextInput
                  value={linkedInUrl}
                  onChangeText={setLinkedInUrl}
                  placeholder="https://linkedin.com/in/yourprofile"
                  placeholderTextColor="#64748b"
                  autoCapitalize="none"
                  className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-white text-base"
                />
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
              canProceed() ? 'bg-violet-500 active:opacity-80' : 'bg-slate-800'
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
