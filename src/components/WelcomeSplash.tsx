import { View, Text, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { CentaurLogo } from './CentaurLogo';

// Curated collection of inspiring business quotes
const BUSINESS_QUOTES = [
  {
    quote: "The only way to do great work is to love what you do.",
    author: "Steve Jobs"
  },
  {
    quote: "Innovation distinguishes between a leader and a follower.",
    author: "Steve Jobs"
  },
  {
    quote: "The secret of getting ahead is getting started.",
    author: "Mark Twain"
  },
  {
    quote: "Ideas are easy. Implementation is hard.",
    author: "Guy Kawasaki"
  },
  {
    quote: "Don't worry about failure. Worry about the chances you miss.",
    author: "Jack Canfield"
  },
  {
    quote: "Move fast and break things.",
    author: "Mark Zuckerberg"
  },
  {
    quote: "Stay hungry. Stay foolish.",
    author: "Steve Jobs"
  },
  {
    quote: "The best time to plant a tree was 20 years ago. The second best time is now.",
    author: "Chinese Proverb"
  },
  {
    quote: "Done is better than perfect.",
    author: "Sheryl Sandberg"
  },
  {
    quote: "Your work is going to fill a large part of your life, and the only way to be truly satisfied is to do what you believe is great work.",
    author: "Steve Jobs"
  },
  {
    quote: "The biggest risk is not taking any risk.",
    author: "Mark Zuckerberg"
  },
  {
    quote: "Build something people want.",
    author: "Paul Graham"
  },
  {
    quote: "Make every detail perfect and limit the number of details to perfect.",
    author: "Jack Dorsey"
  },
  {
    quote: "Execution is everything.",
    author: "Jeff Bezos"
  },
  {
    quote: "The way to get started is to quit talking and begin doing.",
    author: "Walt Disney"
  },
  {
    quote: "Focus on signal over noise.",
    author: "Naval Ravikant"
  },
  {
    quote: "Simplicity is the ultimate sophistication.",
    author: "Leonardo da Vinci"
  },
  {
    quote: "Think big, start small, move fast.",
    author: "Anonymous"
  },
  {
    quote: "The hard thing about hard things is that there are no easy answers.",
    author: "Ben Horowitz"
  },
  {
    quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill"
  }
];

interface WelcomeSplashProps {
  onComplete: () => void;
}

export function WelcomeSplash({ onComplete }: WelcomeSplashProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  // Get random quote
  const randomQuote = BUSINESS_QUOTES[Math.floor(Math.random() * BUSINESS_QUOTES.length)];

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss after 3 seconds
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        onComplete();
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [fadeAnim, logoScale, onComplete]);

  return (
    <View className="absolute inset-0 z-50">
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#334155']}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 32,
            opacity: fadeAnim,
          }}
        >
          {/* Logo */}
          <Animated.View
            style={{
              transform: [{ scale: logoScale }],
              marginBottom: 32,
            }}
          >
            <CentaurLogo size={140} />
          </Animated.View>

          {/* Welcome Text */}
          <Text className="text-gray-900 dark:text-white text-3xl font-bold mb-2 text-center">
            Welcome to Centaur OS
          </Text>
          <Text className="text-slate-300 text-base mb-12 text-center">
            Your Operating System for Hardware Startups
          </Text>

          {/* Quote Section */}
          <View className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <View className="mb-4">
              <Text className="text-slate-100 text-lg font-medium text-center leading-7 italic">
                "{randomQuote.quote}"
              </Text>
            </View>
            <Text className="text-slate-400 text-sm text-center">
              — {randomQuote.author}
            </Text>
          </View>

          {/* Subtle Loading Indicator */}
          <View className="mt-12 flex-row gap-2">
            <Animated.View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#3b82f6',
                opacity: fadeAnim,
              }}
            />
            <Animated.View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#60a5fa',
                opacity: fadeAnim,
              }}
            />
            <Animated.View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#93c5fd',
                opacity: fadeAnim,
              }}
            />
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}
