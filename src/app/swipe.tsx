import { View, Text, Pressable, Dimensions, Alert } from 'react-native';
import { useState, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  useAnimatedGestureHandler,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import {
  X,
  Heart,
  ChevronLeft,
  Users,
  Bot,
  Package,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Briefcase,
  Target,
  Check,
  Sparkles,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { ORGANIZATION_MEMBERS, AI_AGENTS, SUPPLIER_ENGAGEMENTS } from '@/lib/organization-seed';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

type CardType = 'people' | 'ai' | 'suppliers';

interface PersonCard {
  type: 'people';
  id: string;
  name: string;
  role: string;
  function: string;
  email: string;
  phone?: string;
  costPerDay?: number;
  startDate: string;
  experience?: string;
  skills?: string[];
}

interface AICard {
  type: 'ai';
  id: string;
  name: string;
  provider: string;
  model: string;
  purpose: string;
  costPerMonth: number;
  capabilities: string[];
  functions: string[];
}

interface SupplierCard {
  type: 'suppliers';
  id: string;
  name: string;
  projectName: string;
  description: string;
  totalCost: number;
  status: string;
  location: {
    city: string;
    address: string;
  };
  startDate: string;
}

type CardData = PersonCard | AICard | SupplierCard;

export default function SwipeScreen() {
  const [activeTab, setActiveTab] = useState<CardType>('people');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shortlist, setShortlist] = useState<CardData[]>([]);
  const [showShortlist, setShowShortlist] = useState(false);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Prepare data based on active tab
  const getCards = (): CardData[] => {
    switch (activeTab) {
      case 'people':
        return ORGANIZATION_MEMBERS.filter(m => m.status === 'active').map(m => ({
          type: 'people' as const,
          id: m.id,
          name: m.name,
          role: m.role,
          function: m.function,
          email: m.email,
          phone: m.phone,
          costPerDay: m.costPerDay,
          startDate: m.startDate,
          experience: `Started ${new Date(m.startDate).toLocaleDateString()}`,
          skills: [m.function],
        }));
      case 'ai':
        return AI_AGENTS.map(a => ({
          type: 'ai' as const,
          id: a.id,
          name: a.name,
          provider: a.provider,
          model: a.model,
          purpose: a.purpose,
          costPerMonth: a.costPerMonth,
          capabilities: a.capabilities,
          functions: a.functions,
        }));
      case 'suppliers':
        return SUPPLIER_ENGAGEMENTS.map(s => ({
          type: 'suppliers' as const,
          id: s.id,
          name: s.supplierName,
          projectName: s.projectName,
          description: s.description,
          totalCost: s.totalCost,
          status: s.status,
          location: s.location,
          startDate: s.startDate,
        }));
      default:
        return [];
    }
  };

  const cards = getCards();
  const currentCard = cards[currentIndex];

  const handleSwipeRight = () => {
    if (currentCard && !shortlist.find(item => item.id === currentCard.id)) {
      setShortlist([...shortlist, currentCard]);
    }
    moveToNextCard();
  };

  const handleSwipeLeft = () => {
    moveToNextCard();
  };

  const moveToNextCard = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // All cards viewed
      Alert.alert(
        'All Done!',
        `You've viewed all ${activeTab}. Check your shortlist or switch categories.`,
        [{ text: 'OK' }]
      );
    }
  };

  const resetPosition = () => {
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
  };

  const gestureHandler = useAnimatedGestureHandler({
    onActive: (event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    },
    onEnd: (event) => {
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        const direction = event.translationX > 0 ? 1 : -1;
        translateX.value = withSpring(direction * SCREEN_WIDTH * 1.5);

        if (direction > 0) {
          runOnJS(handleSwipeRight)();
        } else {
          runOnJS(handleSwipeLeft)();
        }

        // Reset for next card
        setTimeout(() => {
          translateX.value = 0;
          translateY.value = 0;
        }, 300);
      } else {
        runOnJS(resetPosition)();
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-30, 0, 30],
      Extrapolate.CLAMP
    );

    const opacity = interpolate(
      Math.abs(translateX.value),
      [0, SWIPE_THRESHOLD],
      [1, 0.8],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
      opacity,
    };
  });

  const likeOpacityStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolate.CLAMP
    ),
  }));

  const nopeOpacityStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolate.CLAMP
    ),
  }));

  const handleTabChange = (tab: CardType) => {
    setActiveTab(tab);
    setCurrentIndex(0);
    translateX.value = 0;
    translateY.value = 0;
  };

  const removeFromShortlist = (id: string) => {
    setShortlist(shortlist.filter(item => item.id !== id));
  };

  const handleReachOut = () => {
    if (shortlist.length === 0) {
      Alert.alert('No Selection', 'Add items to your shortlist first by swiping right.');
      return;
    }

    const emails = shortlist
      .filter(item => item.type === 'people')
      .map(item => (item as PersonCard).email)
      .join(',');

    if (emails) {
      Alert.alert(
        'Reach Out',
        `Contact ${shortlist.length} shortlisted items?\n\n${shortlist.map(s => s.name).join('\n')}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Send Email',
            onPress: () => {
              // Here you would integrate with email
              Alert.alert('Success', 'Email draft created!');
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Shortlist',
        `Your shortlist:\n\n${shortlist.map(s => `• ${s.name}`).join('\n')}`
      );
    }
  };

  if (showShortlist) {
    return (
      <View className="flex-1 bg-slate-950">
        {/* Shortlist Header */}
        <View className="px-6 pt-14 pb-4 border-b border-slate-800">
          <View className="flex-row items-center justify-between mb-2">
            <Pressable
              onPress={() => setShowShortlist(false)}
              className="active:opacity-70"
            >
              <ChevronLeft size={28} color="#fff" />
            </Pressable>
            <Text className="text-white text-xl font-bold">Shortlist</Text>
            <View style={{ width: 28 }} />
          </View>
          <Text className="text-slate-400 text-sm text-center">
            {shortlist.length} {shortlist.length === 1 ? 'item' : 'items'} selected
          </Text>
        </View>

        {/* Shortlist Content */}
        <Animated.ScrollView className="flex-1 px-6 pt-4">
          {shortlist.length === 0 ? (
            <View className="items-center justify-center py-20">
              <Heart size={64} color="#334155" />
              <Text className="text-slate-400 text-center mt-4">
                No items in your shortlist yet.{'\n'}Swipe right to add items.
              </Text>
            </View>
          ) : (
            <View className="gap-3 pb-6">
              {shortlist.map((item) => (
                <View
                  key={item.id}
                  className="bg-slate-900 rounded-2xl p-4 border border-slate-800"
                >
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 mb-1">
                        {item.type === 'people' && <Users size={16} color="#3b82f6" />}
                        {item.type === 'ai' && <Bot size={16} color="#10b981" />}
                        {item.type === 'suppliers' && <Package size={16} color="#f59e0b" />}
                        <Text className="text-white font-semibold">{item.name}</Text>
                      </View>
                      {item.type === 'people' && (
                        <Text className="text-slate-400 text-sm">
                          {(item as PersonCard).function}
                        </Text>
                      )}
                      {item.type === 'ai' && (
                        <Text className="text-slate-400 text-sm">
                          {(item as AICard).provider} • {(item as AICard).model}
                        </Text>
                      )}
                      {item.type === 'suppliers' && (
                        <Text className="text-slate-400 text-sm">
                          {(item as SupplierCard).projectName}
                        </Text>
                      )}
                    </View>
                    <Pressable
                      onPress={() => removeFromShortlist(item.id)}
                      className="active:opacity-70"
                    >
                      <X size={20} color="#ef4444" />
                    </Pressable>
                  </View>

                  {item.type === 'people' && (item as PersonCard).costPerDay && (
                    <View className="flex-row items-center gap-1">
                      <DollarSign size={14} color="#64748b" />
                      <Text className="text-slate-400 text-xs">
                        £{(item as PersonCard).costPerDay}/day
                      </Text>
                    </View>
                  )}
                  {item.type === 'ai' && (
                    <View className="flex-row items-center gap-1">
                      <DollarSign size={14} color="#64748b" />
                      <Text className="text-slate-400 text-xs">
                        £{(item as AICard).costPerMonth}/mo
                      </Text>
                    </View>
                  )}
                  {item.type === 'suppliers' && (
                    <View className="flex-row items-center gap-1">
                      <DollarSign size={14} color="#64748b" />
                      <Text className="text-slate-400 text-xs">
                        Total: £{((item as SupplierCard).totalCost / 1000).toFixed(1)}k
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </Animated.ScrollView>

        {/* Reach Out Button */}
        {shortlist.length > 0 && (
          <View className="px-6 pb-8 pt-4 bg-slate-950 border-t border-slate-800">
            <Pressable
              onPress={handleReachOut}
              className="active:opacity-80"
            >
              <LinearGradient
                colors={['#3b82f6', '#2563eb']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 16,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Mail size={20} color="#fff" />
                <Text className="text-white font-bold text-base">
                  Reach Out to Shortlist
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        )}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="px-6 pt-14 pb-4 border-b border-slate-800">
        <View className="flex-row items-center justify-between mb-4">
          <Pressable
            onPress={() => router.back()}
            className="active:opacity-70"
          >
            <ChevronLeft size={28} color="#fff" />
          </Pressable>
          <Text className="text-white text-xl font-bold">Discover</Text>
          <Pressable
            onPress={() => setShowShortlist(true)}
            className="active:opacity-70"
          >
            <View className="relative">
              <Heart
                size={28}
                color={shortlist.length > 0 ? '#ef4444' : '#64748b'}
                fill={shortlist.length > 0 ? '#ef4444' : 'none'}
              />
              {shortlist.length > 0 && (
                <View className="absolute -top-1 -right-1 bg-blue-500 rounded-full w-5 h-5 items-center justify-center">
                  <Text className="text-white text-xs font-bold">
                    {shortlist.length}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
        </View>

        {/* Tabs */}
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => handleTabChange('people')}
            className={`flex-1 py-3 rounded-xl ${activeTab === 'people' ? 'bg-blue-500' : 'bg-slate-800'} active:opacity-70`}
          >
            <View className="flex-row items-center justify-center gap-2">
              <Users size={18} color="#fff" />
              <Text className="text-white font-semibold">People</Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => handleTabChange('ai')}
            className={`flex-1 py-3 rounded-xl ${activeTab === 'ai' ? 'bg-emerald-500' : 'bg-slate-800'} active:opacity-70`}
          >
            <View className="flex-row items-center justify-center gap-2">
              <Bot size={18} color="#fff" />
              <Text className="text-white font-semibold">AI</Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => handleTabChange('suppliers')}
            className={`flex-1 py-3 rounded-xl ${activeTab === 'suppliers' ? 'bg-amber-500' : 'bg-slate-800'} active:opacity-70`}
          >
            <View className="flex-row items-center justify-center gap-2">
              <Package size={18} color="#fff" />
              <Text className="text-white font-semibold">Suppliers</Text>
            </View>
          </Pressable>
        </View>
      </View>

      {/* Card Stack */}
      <View className="flex-1 items-center justify-center px-6">
        {cards.length === 0 ? (
          <View className="items-center">
            <Text className="text-slate-400 text-center">
              No {activeTab} available
            </Text>
          </View>
        ) : currentIndex >= cards.length ? (
          <View className="items-center">
            <Check size={64} color="#10b981" />
            <Text className="text-white text-xl font-bold mt-4 mb-2">
              All Done!
            </Text>
            <Text className="text-slate-400 text-center mb-6">
              You've viewed all {activeTab}.{'\n'}
              {shortlist.length > 0 && `${shortlist.length} items in your shortlist.`}
            </Text>
            <Pressable
              onPress={() => setCurrentIndex(0)}
              className="bg-blue-500 px-6 py-3 rounded-xl active:opacity-70"
            >
              <Text className="text-white font-semibold">Start Over</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <PanGestureHandler onGestureEvent={gestureHandler}>
              <Animated.View
                style={[
                  {
                    width: SCREEN_WIDTH - 48,
                    height: SCREEN_HEIGHT * 0.65,
                  },
                  animatedStyle,
                ]}
              >
                {/* NOPE Overlay */}
                <Animated.View
                  style={[nopeOpacityStyle]}
                  className="absolute top-8 right-8 z-10"
                >
                  <View className="bg-red-500 px-6 py-3 rounded-2xl border-4 border-red-400 rotate-[-15deg]">
                    <Text className="text-white font-bold text-2xl">PASS</Text>
                  </View>
                </Animated.View>

                {/* LIKE Overlay */}
                <Animated.View
                  style={[likeOpacityStyle]}
                  className="absolute top-8 left-8 z-10"
                >
                  <View className="bg-emerald-500 px-6 py-3 rounded-2xl border-4 border-emerald-400 rotate-[15deg]">
                    <Text className="text-white font-bold text-2xl">LIKE</Text>
                  </View>
                </Animated.View>

                {/* Card Content */}
                <LinearGradient
                  colors={
                    activeTab === 'people'
                      ? ['#1e40af', '#1e3a8a']
                      : activeTab === 'ai'
                        ? ['#047857', '#065f46']
                        : ['#d97706', '#b45309']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={{
                    flex: 1,
                    borderRadius: 24,
                    padding: 24,
                    justifyContent: 'space-between',
                  }}
                >
                  {/* Header */}
                  <View>
                    <View className="flex-row items-start justify-between mb-4">
                      <View className="flex-1">
                        <Text className="text-white text-3xl font-bold mb-2">
                          {currentCard.name}
                        </Text>
                        {currentCard.type === 'people' && (
                          <View className="bg-white/20 self-start px-3 py-1 rounded-full mb-2">
                            <Text className="text-white text-sm font-semibold">
                              {(currentCard as PersonCard).role}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View className="bg-white/20 rounded-full p-3">
                        {activeTab === 'people' && <Users size={24} color="#fff" />}
                        {activeTab === 'ai' && <Bot size={24} color="#fff" />}
                        {activeTab === 'suppliers' && <Package size={24} color="#fff" />}
                      </View>
                    </View>

                    {/* Details */}
                    {currentCard.type === 'people' && (
                      <View className="gap-3">
                        <View className="flex-row items-center gap-2">
                          <Briefcase size={18} color="#fff" />
                          <Text className="text-white text-base">
                            {(currentCard as PersonCard).function}
                          </Text>
                        </View>
                        {(currentCard as PersonCard).phone && (
                          <View className="flex-row items-center gap-2">
                            <Phone size={18} color="#fff" />
                            <Text className="text-white text-base">
                              {(currentCard as PersonCard).phone}
                            </Text>
                          </View>
                        )}
                        <View className="flex-row items-center gap-2">
                          <Mail size={18} color="#fff" />
                          <Text className="text-white text-base">
                            {(currentCard as PersonCard).email}
                          </Text>
                        </View>
                        {(currentCard as PersonCard).experience && (
                          <View className="flex-row items-center gap-2">
                            <Calendar size={18} color="#fff" />
                            <Text className="text-white text-base">
                              {(currentCard as PersonCard).experience}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {currentCard.type === 'ai' && (
                      <View className="gap-3">
                        <View className="flex-row items-center gap-2">
                          <Sparkles size={18} color="#fff" />
                          <Text className="text-white text-base">
                            {(currentCard as AICard).provider}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                          <Target size={18} color="#fff" />
                          <Text className="text-white text-base">
                            {(currentCard as AICard).model}
                          </Text>
                        </View>
                        <View className="bg-white/20 rounded-xl p-3 mt-2">
                          <Text className="text-white text-sm">
                            {(currentCard as AICard).purpose}
                          </Text>
                        </View>
                        {(currentCard as AICard).functions.length > 0 && (
                          <View className="flex-row flex-wrap gap-2">
                            {(currentCard as AICard).functions.slice(0, 3).map((func, idx) => (
                              <View key={idx} className="bg-white/20 px-2 py-1 rounded-lg">
                                <Text className="text-white text-xs">{func}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    )}

                    {currentCard.type === 'suppliers' && (
                      <View className="gap-3">
                        <View className="flex-row items-center gap-2">
                          <Target size={18} color="#fff" />
                          <Text className="text-white text-base font-semibold">
                            {(currentCard as SupplierCard).projectName}
                          </Text>
                        </View>
                        <View className="bg-white/20 rounded-xl p-3">
                          <Text className="text-white text-sm">
                            {(currentCard as SupplierCard).description}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                          <MapPin size={18} color="#fff" />
                          <Text className="text-white text-base">
                            {(currentCard as SupplierCard).location.city}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                          <Calendar size={18} color="#fff" />
                          <Text className="text-white text-base">
                            Started {new Date((currentCard as SupplierCard).startDate).toLocaleDateString()}
                          </Text>
                        </View>
                        <View className="bg-white/20 px-3 py-1 rounded-full self-start">
                          <Text className="text-white text-xs font-semibold">
                            {(currentCard as SupplierCard).status.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Footer */}
                  <View>
                    {currentCard.type === 'people' && (currentCard as PersonCard).costPerDay && (
                      <View className="bg-white/20 rounded-xl p-4">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-white/80 text-sm">Cost per day</Text>
                          <Text className="text-white text-2xl font-bold">
                            £{(currentCard as PersonCard).costPerDay}
                          </Text>
                        </View>
                      </View>
                    )}
                    {currentCard.type === 'ai' && (
                      <View className="bg-white/20 rounded-xl p-4">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-white/80 text-sm">Monthly cost</Text>
                          <Text className="text-white text-2xl font-bold">
                            £{(currentCard as AICard).costPerMonth}
                          </Text>
                        </View>
                      </View>
                    )}
                    {currentCard.type === 'suppliers' && (
                      <View className="bg-white/20 rounded-xl p-4">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-white/80 text-sm">Total project cost</Text>
                          <Text className="text-white text-2xl font-bold">
                            £{((currentCard as SupplierCard).totalCost / 1000).toFixed(1)}k
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </Animated.View>
            </PanGestureHandler>

            {/* Progress */}
            <View className="mt-6 mb-4">
              <Text className="text-slate-400 text-center text-sm">
                {currentIndex + 1} / {cards.length}
              </Text>
            </View>

            {/* Action Buttons */}
            <View className="flex-row items-center justify-center gap-8">
              <Pressable
                onPress={handleSwipeLeft}
                className="bg-slate-800 w-16 h-16 rounded-full items-center justify-center border-2 border-slate-700 active:opacity-70"
              >
                <X size={32} color="#ef4444" />
              </Pressable>
              <Pressable
                onPress={handleSwipeRight}
                className="bg-blue-500 w-20 h-20 rounded-full items-center justify-center border-4 border-blue-400 active:opacity-70"
              >
                <Heart size={36} color="#fff" />
              </Pressable>
            </View>

            {/* Instructions */}
            <Text className="text-slate-500 text-center text-xs mt-4">
              Swipe right to add to shortlist, left to pass
            </Text>
          </>
        )}
      </View>
    </View>
  );
}
