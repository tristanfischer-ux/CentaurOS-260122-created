import { View, Text, ScrollView, Pressable, TextInput, Switch } from 'react-native';
import { useState } from 'react';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInRight, FadeInLeft } from 'react-native-reanimated';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Users,
  Briefcase,
  Rocket,
  Shield,
  Check,
  ChevronRight,
} from 'lucide-react-native';
import { useStartupPackStore } from '@/lib/startup-pack';
import { useCurrentWorkspace } from '@/lib/state/app-store';
import { useTheme } from '@/lib/ThemeContext';
import type { StartupCompanyProfile, StartupPackSelections } from '@/types';

type WizardStep = 'company' | 'founders' | 'fundraising' | 'compliance' | 'review';

const STEPS: { id: WizardStep; title: string; icon: typeof Building2 }[] = [
  { id: 'company', title: 'Company', icon: Building2 },
  { id: 'founders', title: 'Founders', icon: Users },
  { id: 'fundraising', title: 'Fundraising', icon: Rocket },
  { id: 'compliance', title: 'Compliance', icon: Shield },
  { id: 'review', title: 'Review', icon: Check },
];

const INDUSTRIES = [
  'Technology / SaaS',
  'Hardware / IoT',
  'Fintech',
  'Healthcare / Medtech',
  'E-commerce / Retail',
  'Marketplace',
  'AI / Machine Learning',
  'Climate / Cleantech',
  'Consumer App',
  'B2B Services',
  'Other',
];

const ROUND_TYPES = [
  { id: 'pre-seed', label: 'Pre-Seed', amount: '< £500K' },
  { id: 'seed', label: 'Seed', amount: '£500K - £2M' },
  { id: 'series-a', label: 'Series A', amount: '> £2M' },
  { id: 'other', label: 'Not Raising Yet', amount: 'Bootstrapping' },
];

export default function SetupWizardScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';
  const workspace = useCurrentWorkspace();
  const workspaceId = workspace?.id ?? '';

  const createOrUpdatePlan = useStartupPackStore(s => s.createOrUpdatePlan);

  // Form state
  const [currentStep, setCurrentStep] = useState<WizardStep>('company');
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [hasIncorporated, setHasIncorporated] = useState(false);
  const [founders, setFounders] = useState<string[]>(['']);
  const [hasCofounder, setHasCofounder] = useState(false);
  const [fundraisingIntent, setFundraisingIntent] = useState(false);
  const [raisingRoundType, setRaisingRoundType] = useState<'pre-seed' | 'seed' | 'series-a' | 'other'>('pre-seed');
  const [wantsSEIS, setWantsSEIS] = useState(false);
  const [wantsEIS, setWantsEIS] = useState(false);
  const [needsTrademark, setNeedsTrademark] = useState(false);
  const [hasDomain, setHasDomain] = useState(false);
  const [hasDataRoom, setHasDataRoom] = useState(false);

  // Theme colors
  const bgPrimary = isDark ? 'bg-slate-950' : isOffWhite ? 'bg-orange-50' : 'bg-gray-50';
  const bgCard = isDark ? 'bg-slate-900' : isOffWhite ? 'bg-white' : 'bg-white';
  const borderColor = isDark ? 'border-slate-800' : isOffWhite ? 'border-orange-200' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-orange-700' : 'text-gray-600';
  const inputBg = isDark ? 'bg-slate-800' : isOffWhite ? 'bg-orange-100' : 'bg-gray-100';

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].id);
    }
  };

  const goBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id);
    } else {
      router.back();
    }
  };

  const handleComplete = () => {
    const profile: StartupCompanyProfile = {
      companyName,
      jurisdiction: 'UK',
      founders: founders.filter(f => f.trim()),
      industry,
      fundraisingIntent,
    };

    const selections: StartupPackSelections = {
      wantsSEIS,
      wantsEIS,
      needsTrademark,
      raisingRoundType: fundraisingIntent ? raisingRoundType : 'other',
      hasCofounder,
      hasDomain,
      hasIncorporated,
      hasDataRoom,
    };

    createOrUpdatePlan(workspaceId, profile, selections);
    router.replace('/startup-pack/plan');
  };

  const addFounder = () => {
    setFounders([...founders, '']);
  };

  const updateFounder = (index: number, value: string) => {
    const newFounders = [...founders];
    newFounders[index] = value;
    setFounders(newFounders);
    setHasCofounder(newFounders.filter(f => f.trim()).length > 1);
  };

  const removeFounder = (index: number) => {
    if (founders.length > 1) {
      const newFounders = founders.filter((_, i) => i !== index);
      setFounders(newFounders);
      setHasCofounder(newFounders.filter(f => f.trim()).length > 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'company':
        return companyName.trim().length > 0 && industry.length > 0;
      case 'founders':
        return founders.some(f => f.trim().length > 0);
      case 'fundraising':
        return true;
      case 'compliance':
        return true;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const renderProgressBar = () => (
    <View className="flex-row items-center justify-between px-5 py-3">
      {STEPS.map((step, index) => {
        const isActive = index === currentStepIndex;
        const isComplete = index < currentStepIndex;
        const Icon = step.icon;

        return (
          <View key={step.id} className="flex-1 items-center">
            <View className="flex-row items-center w-full">
              <View
                className={`w-8 h-8 rounded-full items-center justify-center ${
                  isComplete ? 'bg-emerald-500' : isActive ? 'bg-blue-500' : isDark ? 'bg-slate-700' : 'bg-gray-200'
                }`}
              >
                {isComplete ? (
                  <Check size={16} color="#fff" />
                ) : (
                  <Icon size={14} color={isActive ? '#fff' : '#64748b'} />
                )}
              </View>
              {index < STEPS.length - 1 && (
                <View
                  className={`flex-1 h-0.5 mx-1 ${
                    isComplete ? 'bg-emerald-500' : isDark ? 'bg-slate-700' : 'bg-gray-200'
                  }`}
                />
              )}
            </View>
            <Text className={`text-xs mt-1 ${isActive ? 'text-blue-500 font-semibold' : textSecondary}`}>
              {step.title}
            </Text>
          </View>
        );
      })}
    </View>
  );

  const renderCompanyStep = () => (
    <Animated.View entering={FadeInRight.duration(300)} className="px-5">
      <Text className={`${textPrimary} text-xl font-bold mb-2`}>Company Details</Text>
      <Text className={`${textSecondary} mb-6`}>
        Tell us about your company so we can personalize your setup plan.
      </Text>

      {/* Company Name */}
      <View className="mb-4">
        <Text className={`${textPrimary} font-semibold mb-2`}>Company Name *</Text>
        <TextInput
          value={companyName}
          onChangeText={setCompanyName}
          placeholder="e.g., Acme Ltd"
          placeholderTextColor="#64748b"
          className={`${inputBg} ${textPrimary} rounded-xl px-4 py-3`}
        />
      </View>

      {/* Industry */}
      <View className="mb-4">
        <Text className={`${textPrimary} font-semibold mb-2`}>Industry *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
          <View className="flex-row gap-2 pb-2">
            {INDUSTRIES.map(ind => (
              <Pressable
                key={ind}
                onPress={() => setIndustry(ind)}
                className={`px-4 py-2 rounded-full border ${
                  industry === ind
                    ? 'bg-blue-500 border-blue-500'
                    : `${bgCard} ${borderColor}`
                }`}
              >
                <Text className={industry === ind ? 'text-white font-semibold' : textSecondary}>
                  {ind}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Incorporated */}
      <View className={`${bgCard} border ${borderColor} rounded-xl p-4 flex-row items-center justify-between`}>
        <View className="flex-1 mr-4">
          <Text className={`${textPrimary} font-semibold`}>Already Incorporated?</Text>
          <Text className={`${textSecondary} text-sm`}>
            Have you registered with Companies House?
          </Text>
        </View>
        <Switch
          value={hasIncorporated}
          onValueChange={setHasIncorporated}
          trackColor={{ false: '#64748b', true: '#3b82f6' }}
        />
      </View>
    </Animated.View>
  );

  const renderFoundersStep = () => (
    <Animated.View entering={FadeInRight.duration(300)} className="px-5">
      <Text className={`${textPrimary} text-xl font-bold mb-2`}>Founders</Text>
      <Text className={`${textSecondary} mb-6`}>
        Who are the founding team members? This affects vesting and shareholder agreements.
      </Text>

      {founders.map((founder, index) => (
        <View key={index} className="mb-3 flex-row items-center">
          <TextInput
            value={founder}
            onChangeText={(val) => updateFounder(index, val)}
            placeholder={`Founder ${index + 1} name`}
            placeholderTextColor="#64748b"
            className={`flex-1 ${inputBg} ${textPrimary} rounded-xl px-4 py-3`}
          />
          {founders.length > 1 && (
            <Pressable
              onPress={() => removeFounder(index)}
              className="ml-2 p-2 rounded-lg bg-red-500/20"
            >
              <Text className="text-red-500 font-semibold">Remove</Text>
            </Pressable>
          )}
        </View>
      ))}

      <Pressable
        onPress={addFounder}
        className={`${bgCard} border ${borderColor} border-dashed rounded-xl p-4 items-center`}
      >
        <Text className="text-blue-500 font-semibold">+ Add Another Founder</Text>
      </Pressable>
    </Animated.View>
  );

  const renderFundraisingStep = () => (
    <Animated.View entering={FadeInRight.duration(300)} className="px-5">
      <Text className={`${textPrimary} text-xl font-bold mb-2`}>Fundraising Plans</Text>
      <Text className={`${textSecondary} mb-6`}>
        Are you planning to raise investment? This affects SEIS/EIS, data room, and investor materials.
      </Text>

      {/* Fundraising Intent */}
      <View className={`${bgCard} border ${borderColor} rounded-xl p-4 mb-4 flex-row items-center justify-between`}>
        <View className="flex-1 mr-4">
          <Text className={`${textPrimary} font-semibold`}>Planning to Raise?</Text>
          <Text className={`${textSecondary} text-sm`}>
            Are you seeking external investment?
          </Text>
        </View>
        <Switch
          value={fundraisingIntent}
          onValueChange={setFundraisingIntent}
          trackColor={{ false: '#64748b', true: '#3b82f6' }}
        />
      </View>

      {fundraisingIntent && (
        <>
          <Text className={`${textPrimary} font-semibold mb-3`}>Round Size</Text>
          <View className="gap-2 mb-4">
            {ROUND_TYPES.filter(r => r.id !== 'other').map(round => (
              <Pressable
                key={round.id}
                onPress={() => setRaisingRoundType(round.id as typeof raisingRoundType)}
                className={`${bgCard} border rounded-xl p-4 flex-row items-center justify-between ${
                  raisingRoundType === round.id ? 'border-blue-500 bg-blue-500/10' : borderColor
                }`}
              >
                <View>
                  <Text className={`${textPrimary} font-semibold`}>{round.label}</Text>
                  <Text className={textSecondary}>{round.amount}</Text>
                </View>
                {raisingRoundType === round.id && (
                  <Check size={20} color="#3b82f6" />
                )}
              </Pressable>
            ))}
          </View>

          {/* SEIS/EIS */}
          <View className={`${bgCard} border ${borderColor} rounded-xl p-4 mb-3 flex-row items-center justify-between`}>
            <View className="flex-1 mr-4">
              <Text className={`${textPrimary} font-semibold`}>Want SEIS Eligibility?</Text>
              <Text className={`${textSecondary} text-sm`}>50% income tax relief for investors</Text>
            </View>
            <Switch
              value={wantsSEIS}
              onValueChange={setWantsSEIS}
              trackColor={{ false: '#64748b', true: '#3b82f6' }}
            />
          </View>

          <View className={`${bgCard} border ${borderColor} rounded-xl p-4 mb-3 flex-row items-center justify-between`}>
            <View className="flex-1 mr-4">
              <Text className={`${textPrimary} font-semibold`}>Want EIS Eligibility?</Text>
              <Text className={`${textSecondary} text-sm`}>30% income tax relief for investors</Text>
            </View>
            <Switch
              value={wantsEIS}
              onValueChange={setWantsEIS}
              trackColor={{ false: '#64748b', true: '#3b82f6' }}
            />
          </View>

          <View className={`${bgCard} border ${borderColor} rounded-xl p-4 flex-row items-center justify-between`}>
            <View className="flex-1 mr-4">
              <Text className={`${textPrimary} font-semibold`}>Have Data Room?</Text>
              <Text className={`${textSecondary} text-sm`}>Organized documents for due diligence</Text>
            </View>
            <Switch
              value={hasDataRoom}
              onValueChange={setHasDataRoom}
              trackColor={{ false: '#64748b', true: '#3b82f6' }}
            />
          </View>
        </>
      )}
    </Animated.View>
  );

  const renderComplianceStep = () => (
    <Animated.View entering={FadeInRight.duration(300)} className="px-5">
      <Text className={`${textPrimary} text-xl font-bold mb-2`}>IP & Brand</Text>
      <Text className={`${textSecondary} mb-6`}>
        Protect your intellectual property and brand identity.
      </Text>

      <View className={`${bgCard} border ${borderColor} rounded-xl p-4 mb-3 flex-row items-center justify-between`}>
        <View className="flex-1 mr-4">
          <Text className={`${textPrimary} font-semibold`}>Need Trademark?</Text>
          <Text className={`${textSecondary} text-sm`}>Register your brand with UK IPO</Text>
        </View>
        <Switch
          value={needsTrademark}
          onValueChange={setNeedsTrademark}
          trackColor={{ false: '#64748b', true: '#3b82f6' }}
        />
      </View>

      <View className={`${bgCard} border ${borderColor} rounded-xl p-4 flex-row items-center justify-between`}>
        <View className="flex-1 mr-4">
          <Text className={`${textPrimary} font-semibold`}>Have Domain?</Text>
          <Text className={`${textSecondary} text-sm`}>Secured your company domain name</Text>
        </View>
        <Switch
          value={hasDomain}
          onValueChange={setHasDomain}
          trackColor={{ false: '#64748b', true: '#3b82f6' }}
        />
      </View>
    </Animated.View>
  );

  const renderReviewStep = () => (
    <Animated.View entering={FadeInRight.duration(300)} className="px-5">
      <Text className={`${textPrimary} text-xl font-bold mb-2`}>Review Your Plan</Text>
      <Text className={`${textSecondary} mb-6`}>
        We'll create a personalized setup checklist based on your answers.
      </Text>

      <View className={`${bgCard} border ${borderColor} rounded-xl p-4 mb-4`}>
        <Text className={`${textPrimary} font-bold mb-3`}>Summary</Text>

        <View className="gap-3">
          <View className="flex-row justify-between">
            <Text className={textSecondary}>Company</Text>
            <Text className={`${textPrimary} font-semibold`}>{companyName || 'Not set'}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className={textSecondary}>Industry</Text>
            <Text className={`${textPrimary} font-semibold`}>{industry || 'Not set'}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className={textSecondary}>Founders</Text>
            <Text className={`${textPrimary} font-semibold`}>{founders.filter(f => f.trim()).length}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className={textSecondary}>Incorporated</Text>
            <Text className={`${textPrimary} font-semibold`}>{hasIncorporated ? 'Yes' : 'No'}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className={textSecondary}>Raising Investment</Text>
            <Text className={`${textPrimary} font-semibold`}>{fundraisingIntent ? 'Yes' : 'No'}</Text>
          </View>
          {fundraisingIntent && (
            <>
              <View className="flex-row justify-between">
                <Text className={textSecondary}>Round Type</Text>
                <Text className={`${textPrimary} font-semibold`}>
                  {ROUND_TYPES.find(r => r.id === raisingRoundType)?.label}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className={textSecondary}>SEIS Eligible</Text>
                <Text className={`${textPrimary} font-semibold`}>{wantsSEIS ? 'Yes' : 'No'}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className={textSecondary}>EIS Eligible</Text>
                <Text className={`${textPrimary} font-semibold`}>{wantsEIS ? 'Yes' : 'No'}</Text>
              </View>
            </>
          )}
          <View className="flex-row justify-between">
            <Text className={textSecondary}>Need Trademark</Text>
            <Text className={`${textPrimary} font-semibold`}>{needsTrademark ? 'Yes' : 'No'}</Text>
          </View>
        </View>
      </View>

      <View className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <Text className="text-blue-500 text-sm">
          Based on your answers, we'll prioritize the checklist items most relevant to your situation.
        </Text>
      </View>
    </Animated.View>
  );

  return (
    <View className={`flex-1 ${bgPrimary}`}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <LinearGradient
        colors={isDark ? ['#7c3aed', '#4f46e5'] : ['#8b5cf6', '#6366f1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingHorizontal: 20, paddingTop: insets.top + 12, paddingBottom: 16 }}
      >
        <View className="flex-row items-center">
          <Pressable onPress={goBack} className="mr-3">
            <ArrowLeft size={24} color="#fff" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-white/70 text-xs font-medium">STARTUP PACK</Text>
            <Text className="text-white text-xl font-bold">Setup Wizard</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Progress */}
      {renderProgressBar()}

      {/* Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {currentStep === 'company' && renderCompanyStep()}
        {currentStep === 'founders' && renderFoundersStep()}
        {currentStep === 'fundraising' && renderFundraisingStep()}
        {currentStep === 'compliance' && renderComplianceStep()}
        {currentStep === 'review' && renderReviewStep()}
      </ScrollView>

      {/* Bottom Navigation */}
      <View
        className={`${bgCard} border-t ${borderColor} px-5 py-4`}
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        {currentStep === 'review' ? (
          <Pressable
            onPress={handleComplete}
            className="bg-emerald-500 rounded-xl py-4 flex-row items-center justify-center active:opacity-70"
          >
            <Check size={20} color="#fff" />
            <Text className="text-white font-bold text-lg ml-2">Create My Plan</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={goNext}
            disabled={!canProceed()}
            className={`rounded-xl py-4 flex-row items-center justify-center active:opacity-70 ${
              canProceed() ? 'bg-blue-500' : isDark ? 'bg-slate-700' : 'bg-gray-300'
            }`}
          >
            <Text className={`font-bold text-lg ${canProceed() ? 'text-white' : 'text-gray-500'}`}>
              Continue
            </Text>
            <ArrowRight size={20} color={canProceed() ? '#fff' : '#64748b'} className="ml-2" />
          </Pressable>
        )}
      </View>
    </View>
  );
}
