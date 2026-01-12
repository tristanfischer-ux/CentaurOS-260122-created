import { View, Text, Pressable, Dimensions, Alert, ScrollView, Modal, Linking } from 'react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolate,
  useAnimatedReaction,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
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
  Award,
  TrendingUp,
  Zap,
  Star,
  Building,
  Cpu,
  Factory,
  Linkedin,
  ExternalLink,
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
  reportsTo?: string;
  manages?: string[];
  linkedIn?: string;
  bio?: string;
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
  website?: string;
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
  capability?: string;
  leadTime?: string;
}

type CardData = PersonCard | AICard | SupplierCard;

export default function SwipeScreen() {
  const [activeTab, setActiveTab] = useState<CardType>('people');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shortlist, setShortlist] = useState<CardData[]>([]);
  const [showShortlist, setShowShortlist] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<PersonCard | null>(null);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isGestureActive = useSharedValue(false);

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
          reportsTo: m.reportsTo,
          manages: m.manages,
          linkedIn: m.linkedIn,
          bio: m.bio,
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
          website: a.website,
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
          capability: s.description,
          leadTime: '4-6 weeks',
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
      translateX.value = 0;
      translateY.value = 0;
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
    'worklet';
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
  };

  // New gesture handler for Reanimated v3
  const panGesture = Gesture.Pan()
    .onStart(() => {
      isGestureActive.value = true;
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      isGestureActive.value = false;

      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        const direction = event.translationX > 0 ? 1 : -1;
        translateX.value = withSpring(direction * SCREEN_WIDTH * 1.5, {}, () => {
          // Reset position after animation
          translateX.value = 0;
          translateY.value = 0;
        });

        if (direction > 0) {
          runOnJS(handleSwipeRight)();
        } else {
          runOnJS(handleSwipeLeft)();
        }
      } else {
        resetPosition();
      }
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

  const passOpacityStyle = useAnimatedStyle(() => ({
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

    const people = shortlist.filter(item => item.type === 'people') as PersonCard[];
    const emails = people.map(p => p.email).join(',');

    if (emails) {
      Alert.alert(
        'Reach Out',
        `Contact ${shortlist.length} shortlisted items?\n\n${shortlist.map(s => s.name).join('\n')}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Send Email',
            onPress: () => {
              Alert.alert('Success', 'Email draft created!');
            },
          },
        ]
      );
    }
  };

  if (showShortlist) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-950">
        {/* Shortlist Header */}
        <View className="px-6 pt-12 pb-4 border-b border-slate-800">
          <Pressable onPress={() => setShowShortlist(false)} className="mb-4 active:opacity-70">
            <View className="flex-row items-center gap-2">
              <ChevronLeft size={24} color="#3b82f6" />
              <Text className="text-blue-400 text-lg font-semibold">Back to Cards</Text>
            </View>
          </Pressable>
          <Text className="text-gray-900 dark:text-white text-2xl font-bold">Your Shortlist</Text>
          <Text className="text-gray-600 dark:text-slate-400 mt-1">{shortlist.length} items selected</Text>
        </View>

        <ScrollView className="flex-1 px-6 py-4">
          {shortlist.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Heart size={48} color="#475569" />
              <Text className="text-gray-600 dark:text-slate-400 text-center mt-4">
                Your shortlist is empty.{'\n'}Swipe right on cards to add them!
              </Text>
            </View>
          ) : (
            shortlist.map((item) => (
              <View key={item.id} className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 mb-3 border border-slate-800">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="text-gray-900 dark:text-white font-bold text-lg mb-1">{item.name}</Text>
                    {item.type === 'people' && (
                      <Text className="text-gray-600 dark:text-slate-400 text-sm">{(item as PersonCard).role} • {(item as PersonCard).function}</Text>
                    )}
                    {item.type === 'ai' && (
                      <Text className="text-gray-600 dark:text-slate-400 text-sm">{(item as AICard).provider} • {(item as AICard).model}</Text>
                    )}
                    {item.type === 'suppliers' && (
                      <Text className="text-gray-600 dark:text-slate-400 text-sm">{(item as SupplierCard).projectName}</Text>
                    )}
                  </View>
                  <Pressable onPress={() => removeFromShortlist(item.id)} className="active:opacity-70">
                    <X size={20} color="#ef4444" />
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {shortlist.length > 0 && (
          <View className="px-6 py-4 border-t border-slate-800">
            <Pressable onPress={handleReachOut} className="active:opacity-70">
              <LinearGradient
                colors={['#3b82f6', '#2563eb']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 12,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Mail size={20} color="#fff" />
                <Text className="text-gray-900 dark:text-white font-bold text-lg">Reach Out</Text>
              </LinearGradient>
            </Pressable>
          </View>
        )}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
      {/* Header */}
      <View className="px-6 pt-12 pb-4">
        <View className="flex-row items-center justify-between mb-4">
          <Pressable onPress={() => router.back()} className="active:opacity-70">
            <View className="flex-row items-center gap-2">
              <ChevronLeft size={24} color="#3b82f6" />
              <Text className="text-blue-400 text-lg font-semibold">Back</Text>
            </View>
          </Pressable>

          <Pressable onPress={() => setShowShortlist(true)} className="active:opacity-70">
            <View className="flex-row items-center gap-2 bg-pink-500/20 px-4 py-2 rounded-full">
              <Heart size={18} color="#ec4899" fill={shortlist.length > 0 ? '#ec4899' : 'transparent'} />
              <Text className="text-pink-400 font-semibold">{shortlist.length}</Text>
            </View>
          </Pressable>
        </View>

        <Text className="text-gray-900 dark:text-white text-2xl font-bold mb-2">Discover Resources</Text>
        <Text className="text-gray-600 dark:text-slate-400">Swipe right to add to shortlist, left to pass</Text>
      </View>

      {/* Tab Selector */}
      <View className="flex-row px-6 gap-2 mb-4">
        <Pressable
          onPress={() => handleTabChange('people')}
          className={`flex-1 py-3 rounded-xl ${activeTab === 'people' ? 'bg-blue-500' : 'bg-slate-900'} active:opacity-70`}
        >
          <View className="flex-row items-center justify-center gap-2">
            <Users size={18} color={activeTab === 'people' ? '#fff' : '#94a3b8'} />
            <Text className={`font-semibold ${activeTab === 'people' ? 'text-white' : 'text-gray-600 dark:text-slate-400'}`}>
              People
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => handleTabChange('ai')}
          className={`flex-1 py-3 rounded-xl ${activeTab === 'ai' ? 'bg-emerald-500' : 'bg-slate-900'} active:opacity-70`}
        >
          <View className="flex-row items-center justify-center gap-2">
            <Bot size={18} color={activeTab === 'ai' ? '#fff' : '#94a3b8'} />
            <Text className={`font-semibold ${activeTab === 'ai' ? 'text-white' : 'text-gray-600 dark:text-slate-400'}`}>
              AI Agents
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => handleTabChange('suppliers')}
          className={`flex-1 py-3 rounded-xl ${activeTab === 'suppliers' ? 'bg-amber-500' : 'bg-slate-900'} active:opacity-70`}
        >
          <View className="flex-row items-center justify-center gap-2">
            <Package size={18} color={activeTab === 'suppliers' ? '#fff' : '#94a3b8'} />
            <Text className={`font-semibold ${activeTab === 'suppliers' ? 'text-white' : 'text-gray-600 dark:text-slate-400'}`}>
              Suppliers
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Progress Indicator */}
      <View className="px-6 mb-4">
        <Text className="text-slate-500 text-center text-sm">
          {currentIndex + 1} / {cards.length}
        </Text>
      </View>

      {/* Card Stack Area */}
      <View className="flex-1 items-center justify-center px-6">
        {currentCard ? (
          <GestureDetector gesture={panGesture}>
            <Animated.View style={[animatedStyle, { width: '100%', height: '75%' }]}>
              {/* PASS Overlay */}
              <Animated.View
                style={[
                  passOpacityStyle,
                  {
                    position: 'absolute',
                    top: 40,
                    right: 40,
                    zIndex: 10,
                    transform: [{ rotate: '30deg' }],
                  },
                ]}
              >
                <View className="bg-red-500/90 px-6 py-3 rounded-xl border-4 border-red-500">
                  <Text className="text-gray-900 dark:text-white font-bold text-2xl">PASS</Text>
                </View>
              </Animated.View>

              {/* LIKE Overlay */}
              <Animated.View
                style={[
                  likeOpacityStyle,
                  {
                    position: 'absolute',
                    top: 40,
                    left: 40,
                    zIndex: 10,
                    transform: [{ rotate: '-30deg' }],
                  },
                ]}
              >
                <View className="bg-emerald-500/90 px-6 py-3 rounded-xl border-4 border-emerald-500">
                  <Text className="text-gray-900 dark:text-white font-bold text-2xl">LIKE</Text>
                </View>
              </Animated.View>

              {/* Top Trumps Style Card */}
              {currentCard.type === 'people' && (
                <PersonTopTrumpsCard card={currentCard as PersonCard} onTap={setSelectedPerson} />
              )}
              {currentCard.type === 'ai' && (
                <AITopTrumpsCard card={currentCard as AICard} />
              )}
              {currentCard.type === 'suppliers' && (
                <SupplierTopTrumpsCard card={currentCard as SupplierCard} />
              )}
            </Animated.View>
          </GestureDetector>
        ) : (
          <View className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-8 items-center justify-center border border-slate-800">
            <Check size={48} color="#10b981" />
            <Text className="text-gray-900 dark:text-white text-xl font-bold mt-4">All Done!</Text>
            <Text className="text-gray-600 dark:text-slate-400 text-center mt-2">
              You've viewed all {activeTab}
            </Text>
            <Pressable
              onPress={() => setCurrentIndex(0)}
              className="mt-4 bg-blue-500 px-6 py-3 rounded-xl active:opacity-70"
            >
              <Text className="text-gray-900 dark:text-white font-semibold">Start Over</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      {currentCard && (
        <View className="px-6 py-6 flex-row justify-center gap-6">
          <Pressable
            onPress={handleSwipeLeft}
            className="w-16 h-16 bg-red-500/20 rounded-full items-center justify-center border-2 border-red-500 active:opacity-70"
          >
            <X size={32} color="#ef4444" />
          </Pressable>

          <Pressable
            onPress={handleSwipeRight}
            className="w-16 h-16 bg-emerald-500/20 rounded-full items-center justify-center border-2 border-emerald-500 active:opacity-70"
          >
            <Heart size={32} color="#10b981" />
          </Pressable>
        </View>
      )}

      {/* Person Detail Modal */}
      <Modal visible={selectedPerson !== null} transparent animationType="slide" onRequestClose={() => setSelectedPerson(null)}>
        <View className="flex-1 bg-black/80">
          {selectedPerson && (
            <View className="mt-auto bg-gray-100 dark:bg-slate-900 rounded-t-3xl" style={{ maxHeight: '85%' }}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <LinearGradient
                  colors={['#3b82f6', '#2563eb']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ padding: 24, paddingTop: 32 }}
                >
                  <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-1">
                      <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center mb-3">
                        <Users size={32} color="#fff" />
                      </View>
                      <Text className="text-gray-900 dark:text-white text-3xl font-bold mb-1">{selectedPerson.name}</Text>
                      <Text className="text-blue-100 text-lg mb-2">{selectedPerson.role}</Text>
                      <View className="bg-white/20 px-3 py-1 rounded-lg self-start">
                        <Text className="text-gray-900 dark:text-white text-sm font-semibold">{selectedPerson.function}</Text>
                      </View>
                    </View>
                    <Pressable onPress={() => setSelectedPerson(null)} className="bg-white/20 p-2 rounded-full">
                      <X size={24} color="#fff" />
                    </Pressable>
                  </View>
                </LinearGradient>

                {/* Bio */}
                {selectedPerson.bio && (
                  <View className="p-6 border-b border-slate-800">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm font-semibold mb-2">About</Text>
                    <Text className="text-slate-300 text-base leading-6">{selectedPerson.bio}</Text>
                  </View>
                )}

                {/* Stats */}
                <View className="p-6 border-b border-slate-800">
                  <Text className="text-gray-600 dark:text-slate-400 text-sm font-semibold mb-3">Details</Text>
                  <View className="gap-3">
                    {selectedPerson.costPerDay && (
                      <View className="flex-row justify-between">
                        <Text className="text-gray-600 dark:text-slate-400">Daily Rate:</Text>
                        <Text className="text-gray-900 dark:text-white font-semibold">£{selectedPerson.costPerDay}</Text>
                      </View>
                    )}
                    <View className="flex-row justify-between">
                      <Text className="text-gray-600 dark:text-slate-400">Started:</Text>
                      <Text className="text-gray-900 dark:text-white font-semibold">
                        {new Date(selectedPerson.startDate).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Contact */}
                <View className="p-6 border-b border-slate-800">
                  <Text className="text-gray-600 dark:text-slate-400 text-sm font-semibold mb-3">Contact</Text>
                  <View className="gap-3">
                    <Pressable
                      onPress={() => Linking.openURL(`mailto:${selectedPerson.email}`)}
                      className="bg-slate-800 p-4 rounded-xl flex-row items-center active:opacity-70"
                    >
                      <View className="w-10 h-10 bg-blue-500/20 rounded-full items-center justify-center mr-3">
                        <Mail size={20} color="#3b82f6" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-600 dark:text-slate-400 text-xs">Email</Text>
                        <Text className="text-gray-900 dark:text-white">{selectedPerson.email}</Text>
                      </View>
                    </Pressable>

                    {selectedPerson.phone && (
                      <Pressable
                        onPress={() => Linking.openURL(`tel:${selectedPerson.phone}`)}
                        className="bg-slate-800 p-4 rounded-xl flex-row items-center active:opacity-70"
                      >
                        <View className="w-10 h-10 bg-emerald-500/20 rounded-full items-center justify-center mr-3">
                          <Phone size={20} color="#10b981" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-gray-600 dark:text-slate-400 text-xs">Phone</Text>
                          <Text className="text-gray-900 dark:text-white">{selectedPerson.phone}</Text>
                        </View>
                      </Pressable>
                    )}
                  </View>
                </View>

                {/* LinkedIn Profile */}
                {selectedPerson.linkedIn && (
                  <View className="p-6">
                    <Pressable
                      onPress={() => Linking.openURL(selectedPerson.linkedIn!)}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 rounded-2xl flex-row items-center justify-between active:opacity-80"
                    >
                      <LinearGradient
                        colors={['#0077b5', '#005582']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          top: 0,
                          bottom: 0,
                          borderRadius: 16,
                        }}
                      />
                      <View className="flex-row items-center flex-1">
                        <View className="w-12 h-12 bg-white rounded-lg items-center justify-center mr-4">
                          <Linkedin size={28} color="#0077b5" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-gray-900 dark:text-white font-bold text-lg mb-1">View LinkedIn Profile</Text>
                          <Text className="text-blue-100 text-sm">See full professional background</Text>
                        </View>
                      </View>
                      <ExternalLink size={24} color="#fff" />
                    </Pressable>
                  </View>
                )}

                {/* Close Button */}
                <View className="p-6 pt-0">
                  <Pressable
                    onPress={() => setSelectedPerson(null)}
                    className="bg-slate-800 py-4 rounded-xl active:opacity-80"
                  >
                    <Text className="text-gray-600 dark:text-slate-400 text-center font-semibold text-base">Close</Text>
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

// TOP TRUMPS STYLE CARD COMPONENTS

function PersonTopTrumpsCard({ card, onTap }: { card: PersonCard; onTap: (person: PersonCard) => void }) {
  const experienceMonths = Math.floor(
    (new Date().getTime() - new Date(card.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  return (
    <LinearGradient
      colors={['#1e40af', '#1e3a8a']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{
        flex: 1,
        borderRadius: 20,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
      }}
    >
      <View className="flex-1 bg-gray-100 dark:bg-slate-900 rounded-2xl overflow-hidden">
        {/* Header */}
        <Pressable onPress={() => onTap(card)}>
          <LinearGradient
            colors={['#3b82f6', '#2563eb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ padding: 20 }}
          >
            <View className="flex-row items-center gap-3 mb-2">
              <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center">
                <Users size={24} color="#fff" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 dark:text-white text-2xl font-bold">{card.name}</Text>
                <Text className="text-blue-100 text-sm">{card.role}</Text>
              </View>
              <ExternalLink size={20} color="rgba(255,255,255,0.7)" />
            </View>
          </LinearGradient>
        </Pressable>

        <ScrollView className="flex-1 p-5">
          {/* Stats Grid - Top Trumps Style */}
          <View className="gap-3">
            {/* Experience */}
            <StatRow
              icon={<Award size={20} color="#eab308" />}
              label="Experience"
              value={`${experienceMonths} months`}
              rating={Math.min(10, Math.floor(experienceMonths / 3))}
              color="yellow"
            />

            {/* Cost */}
            <StatRow
              icon={<DollarSign size={20} color="#10b981" />}
              label="Daily Rate"
              value={card.costPerDay ? `£${card.costPerDay}` : 'N/A'}
              rating={card.costPerDay ? Math.min(10, Math.floor(card.costPerDay / 100)) : 0}
              color="emerald"
            />

            {/* Function */}
            <StatRow
              icon={<Briefcase size={20} color="#3b82f6" />}
              label="Function"
              value={card.function}
              rating={8}
              color="blue"
            />

            {/* Team Size */}
            <StatRow
              icon={<Users size={20} color="#8b5cf6" />}
              label="Manages"
              value={card.manages ? `${card.manages.length} people` : 'None'}
              rating={card.manages ? Math.min(10, card.manages.length * 2) : 0}
              color="purple"
            />

            {/* Skills */}
            <StatRow
              icon={<Sparkles size={20} color="#f59e0b" />}
              label="Skills"
              value={card.skills ? `${card.skills.length} skills` : 'N/A'}
              rating={card.skills ? Math.min(10, card.skills.length * 2) : 0}
              color="orange"
            />
          </View>

          {/* Contact Info */}
          <View className="mt-6 pt-4 border-t border-slate-800">
            <Text className="text-gray-600 dark:text-slate-400 text-xs uppercase tracking-wider mb-3">Contact</Text>
            <View className="gap-2">
              <View className="flex-row items-center gap-2">
                <Mail size={16} color="#64748b" />
                <Text className="text-slate-300 text-sm">{card.email}</Text>
              </View>
              {card.phone && (
                <View className="flex-row items-center gap-2">
                  <Phone size={16} color="#64748b" />
                  <Text className="text-slate-300 text-sm">{card.phone}</Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Footer Badge */}
        <View className="px-5 py-3 bg-slate-950 border-t border-slate-800">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Star size={16} color="#eab308" fill="#eab308" />
              <Text className="text-yellow-400 font-bold">TOP TRUMPS</Text>
            </View>
            <Text className="text-slate-500 text-xs">PEOPLE CARD</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

function AITopTrumpsCard({ card }: { card: AICard }) {
  const capabilityScore = Math.min(10, card.capabilities.length);
  const costScore = Math.min(10, Math.floor(card.costPerMonth / 100));
  const functionScore = Math.min(10, card.functions.length);

  return (
    <LinearGradient
      colors={['#059669', '#047857']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{
        flex: 1,
        borderRadius: 20,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
      }}
    >
      <View className="flex-1 bg-gray-100 dark:bg-slate-900 rounded-2xl overflow-hidden">
        {/* Header */}
        <LinearGradient
          colors={['#10b981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ padding: 20 }}
        >
          <View className="flex-row items-center gap-3 mb-2">
            <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center">
              <Cpu size={24} color="#fff" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 dark:text-white text-2xl font-bold">{card.name}</Text>
              <Text className="text-emerald-100 text-sm">{card.provider}</Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView className="flex-1 p-5">
          {/* Stats Grid - Top Trumps Style */}
          <View className="gap-3">
            {/* Intelligence */}
            <StatRow
              icon={<Zap size={20} color="#eab308" />}
              label="Model"
              value={card.model}
              rating={9}
              color="yellow"
            />

            {/* Capabilities */}
            <StatRow
              icon={<Sparkles size={20} color="#3b82f6" />}
              label="Capabilities"
              value={`${card.capabilities.length} features`}
              rating={capabilityScore}
              color="blue"
            />

            {/* Functions */}
            <StatRow
              icon={<Target size={20} color="#8b5cf6" />}
              label="Functions"
              value={`${card.functions.length} uses`}
              rating={functionScore}
              color="purple"
            />

            {/* Cost */}
            <StatRow
              icon={<DollarSign size={20} color="#10b981" />}
              label="Monthly Cost"
              value={`£${card.costPerMonth}`}
              rating={costScore}
              color="emerald"
            />

            {/* Performance */}
            <StatRow
              icon={<TrendingUp size={20} color="#f59e0b" />}
              label="Performance"
              value="High"
              rating={8}
              color="orange"
            />
          </View>

          {/* Purpose */}
          <View className="mt-6 pt-4 border-t border-slate-800">
            <Text className="text-gray-600 dark:text-slate-400 text-xs uppercase tracking-wider mb-2">Purpose</Text>
            <Text className="text-slate-300 text-sm leading-relaxed">{card.purpose}</Text>
          </View>

          {/* Capabilities List */}
          <View className="mt-4">
            <Text className="text-gray-600 dark:text-slate-400 text-xs uppercase tracking-wider mb-2">Key Capabilities</Text>
            <View className="flex-row flex-wrap gap-2">
              {card.capabilities.slice(0, 4).map((cap, i) => (
                <View key={i} className="bg-emerald-500/20 px-3 py-1 rounded-full">
                  <Text className="text-emerald-400 text-xs">{cap}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Footer Badge */}
        <View className="px-5 py-3 bg-slate-950 border-t border-slate-800">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Star size={16} color="#eab308" fill="#eab308" />
              <Text className="text-yellow-400 font-bold">TOP TRUMPS</Text>
            </View>
            <Text className="text-slate-500 text-xs">AI AGENT CARD</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

function SupplierTopTrumpsCard({ card }: { card: SupplierCard }) {
  const costScore = Math.min(10, Math.floor(card.totalCost / 10000));
  const reliabilityScore = card.status === 'delivered' ? 10 : card.status === 'in-progress' ? 7 : 5;

  return (
    <LinearGradient
      colors={['#d97706', '#b45309']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{
        flex: 1,
        borderRadius: 20,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
      }}
    >
      <View className="flex-1 bg-gray-100 dark:bg-slate-900 rounded-2xl overflow-hidden">
        {/* Header */}
        <LinearGradient
          colors={['#f59e0b', '#d97706']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ padding: 20 }}
        >
          <View className="flex-row items-center gap-3 mb-2">
            <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center">
              <Factory size={24} color="#fff" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 dark:text-white text-2xl font-bold">{card.name}</Text>
              <Text className="text-amber-100 text-sm">{card.projectName}</Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView className="flex-1 p-5">
          {/* Stats Grid - Top Trumps Style */}
          <View className="gap-3">
            {/* Project Value */}
            <StatRow
              icon={<DollarSign size={20} color="#10b981" />}
              label="Project Value"
              value={`£${(card.totalCost / 1000).toFixed(0)}k`}
              rating={costScore}
              color="emerald"
            />

            {/* Status */}
            <StatRow
              icon={<TrendingUp size={20} color="#3b82f6" />}
              label="Status"
              value={card.status.charAt(0).toUpperCase() + card.status.slice(1)}
              rating={reliabilityScore}
              color="blue"
            />

            {/* Lead Time */}
            <StatRow
              icon={<Calendar size={20} color="#8b5cf6" />}
              label="Lead Time"
              value={card.leadTime || '4-6 weeks'}
              rating={6}
              color="purple"
            />

            {/* Reliability */}
            <StatRow
              icon={<Award size={20} color="#eab308" />}
              label="Reliability"
              value="Verified"
              rating={9}
              color="yellow"
            />

            {/* Capacity */}
            <StatRow
              icon={<Building size={20} color="#f59e0b" />}
              label="Capacity"
              value="High Volume"
              rating={8}
              color="orange"
            />
          </View>

          {/* Description */}
          <View className="mt-6 pt-4 border-t border-slate-800">
            <Text className="text-gray-600 dark:text-slate-400 text-xs uppercase tracking-wider mb-2">Description</Text>
            <Text className="text-slate-300 text-sm leading-relaxed">{card.description}</Text>
          </View>

          {/* Location */}
          <View className="mt-4">
            <Text className="text-gray-600 dark:text-slate-400 text-xs uppercase tracking-wider mb-2">Location</Text>
            <View className="flex-row items-center gap-2">
              <MapPin size={16} color="#64748b" />
              <Text className="text-slate-300 text-sm">{card.location.city}</Text>
            </View>
            <Text className="text-slate-500 text-xs mt-1">{card.location.address}</Text>
          </View>
        </ScrollView>

        {/* Footer Badge */}
        <View className="px-5 py-3 bg-slate-950 border-t border-slate-800">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Star size={16} color="#eab308" fill="#eab308" />
              <Text className="text-yellow-400 font-bold">TOP TRUMPS</Text>
            </View>
            <Text className="text-slate-500 text-xs">SUPPLIER CARD</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

// Reusable Stat Row Component
function StatRow({
  icon,
  label,
  value,
  rating,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  rating: number;
  color: 'yellow' | 'emerald' | 'blue' | 'purple' | 'orange';
}) {
  const colorClasses = {
    yellow: 'bg-yellow-500',
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
  };

  return (
    <View className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          {icon}
          <Text className="text-slate-300 font-semibold">{label}</Text>
        </View>
        <Text className="text-gray-900 dark:text-white font-bold">{value}</Text>
      </View>

      {/* Rating Bar */}
      <View className="flex-row items-center gap-1">
        {[...Array(10)].map((_, i) => (
          <View
            key={i}
            className={`flex-1 h-1.5 rounded-full ${
              i < rating ? colorClasses[color] : 'bg-slate-700'
            }`}
          />
        ))}
      </View>
    </View>
  );
}
