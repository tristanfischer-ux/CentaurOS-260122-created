import { View, Text, Animated, Dimensions } from 'react-native';
import { useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap } from 'lucide-react-native';
import { useTheme } from '@/lib/ThemeContext';

const { width, height } = Dimensions.get('window');

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
    quote: "Move fast and break things.",
    author: "Mark Zuckerberg"
  },
  {
    quote: "Stay hungry. Stay foolish.",
    author: "Steve Jobs"
  },
  {
    quote: "Done is better than perfect.",
    author: "Sheryl Sandberg"
  },
  {
    quote: "Build something people want.",
    author: "Paul Graham"
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
    quote: "Simplicity is the ultimate sophistication.",
    author: "Leonardo da Vinci"
  },
  {
    quote: "Think big, start small, move fast.",
    author: "Anonymous"
  },
];

interface WelcomeSplashProps {
  onComplete: () => void;
}

export function WelcomeSplash({ onComplete }: WelcomeSplashProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(40)).current;
  const quoteOpacity = useRef(new Animated.Value(0)).current;
  const ringScale1 = useRef(new Animated.Value(0.8)).current;
  const ringScale2 = useRef(new Animated.Value(0.6)).current;
  const ringScale3 = useRef(new Animated.Value(0.4)).current;

  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';

  // Theme-aware colors
  const gradientColors = isDark
    ? ['#0a0a0a', '#0f172a', '#020617'] as const
    : isOffWhite
    ? ['#fafaf9', '#f5f5f4', '#fafaf9'] as const
    : ['#ffffff', '#f8fafc', '#ffffff'] as const;

  const ringColor1 = isDark ? 'rgba(139, 92, 246, 0.15)' : isOffWhite ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.12)';
  const ringColor2 = isDark ? 'rgba(99, 102, 241, 0.2)' : isOffWhite ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.15)';
  const ringColor3 = isDark ? 'rgba(59, 130, 246, 0.25)' : isOffWhite ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.2)';

  const logoBackdropBg = isDark ? 'rgba(139, 92, 246, 0.15)' : isOffWhite ? 'rgba(139, 92, 246, 0.12)' : 'rgba(139, 92, 246, 0.1)';
  const logoContainerBg = isDark ? '#1e1b4b' : isOffWhite ? '#ede9fe' : '#f3e8ff';
  const logoBorderColor = isDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.4)';

  const textPrimary = isDark ? '#ffffff' : isOffWhite ? '#1c1917' : '#111827';
  const textSecondary = isDark ? '#64748b' : isOffWhite ? '#78716c' : '#6b7280';
  const textTertiary = isDark ? '#475569' : isOffWhite ? '#a8a29e' : '#9ca3af';
  const accentColor = '#8b5cf6';
  const accentColorLight = isDark ? '#a78bfa' : '#7c3aed';

  const loadingBarBg = isDark ? '#1e293b' : isOffWhite ? '#e7e5e4' : '#e5e7eb';
  const dividerColor = isDark ? '#334155' : isOffWhite ? '#d6d3d1' : '#d1d5db';

  // Get random quote
  const randomQuote = BUSINESS_QUOTES[Math.floor(Math.random() * BUSINESS_QUOTES.length)];

  useEffect(() => {
    // Animate in - staggered sequence
    Animated.sequence([
      // First: fade in background and rings
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(ringScale1, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      // Then: logo appears
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.spring(ringScale2, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      // Then: text slides in
      Animated.parallel([
        Animated.spring(textSlide, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(ringScale3, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      // Finally: quote fades in
      Animated.timing(quoteOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss after 3.5 seconds
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        onComplete();
      });
    }, 3500);

    return () => clearTimeout(timer);
  }, [fadeAnim, logoScale, logoRotate, textSlide, quoteOpacity, ringScale1, ringScale2, ringScale3, onComplete]);

  const spin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View className="absolute inset-0 z-50">
      <LinearGradient
        colors={gradientColors}
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
          {/* Animated Rings Background */}
          <View className="absolute" style={{ top: height * 0.3 }}>
            <Animated.View
              style={{
                position: 'absolute',
                width: 300,
                height: 300,
                borderRadius: 150,
                borderWidth: 1,
                borderColor: ringColor1,
                transform: [{ scale: ringScale1 }],
                left: -150,
                top: -150,
              }}
            />
            <Animated.View
              style={{
                position: 'absolute',
                width: 220,
                height: 220,
                borderRadius: 110,
                borderWidth: 1,
                borderColor: ringColor2,
                transform: [{ scale: ringScale2 }],
                left: -110,
                top: -110,
              }}
            />
            <Animated.View
              style={{
                position: 'absolute',
                width: 140,
                height: 140,
                borderRadius: 70,
                borderWidth: 1,
                borderColor: ringColor3,
                transform: [{ scale: ringScale3 }],
                left: -70,
                top: -70,
              }}
            />
          </View>

          {/* Floating Orbs */}
          <View className="absolute top-32 left-8 w-2 h-2 rounded-full bg-purple-500/40" />
          <View className="absolute top-48 right-12 w-3 h-3 rounded-full bg-blue-500/30" />
          <View className="absolute bottom-48 left-16 w-2 h-2 rounded-full bg-indigo-500/40" />
          <View className="absolute bottom-64 right-8 w-1.5 h-1.5 rounded-full bg-violet-500/50" />

          {/* Logo Section */}
          <Animated.View
            style={{
              transform: [{ scale: logoScale }],
              marginBottom: 32,
            }}
          >
            {/* Glowing backdrop */}
            <View
              className="absolute rounded-full"
              style={{
                width: 120,
                height: 120,
                backgroundColor: logoBackdropBg,
                left: -10,
                top: -10,
                shadowColor: accentColor,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5,
                shadowRadius: 40,
              }}
            />

            {/* Main Logo Container */}
            <Animated.View
              style={{
                width: 100,
                height: 100,
                borderRadius: 28,
                backgroundColor: logoContainerBg,
                borderWidth: 1,
                borderColor: logoBorderColor,
                justifyContent: 'center',
                alignItems: 'center',
                transform: [{ rotate: spin }],
                shadowColor: accentColor,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
              }}
            >
              {/* Inner gradient effect */}
              <LinearGradient
                colors={['rgba(139, 92, 246, 0.2)', 'rgba(59, 130, 246, 0.1)', 'transparent']}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: 27,
                }}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />

              {/* Logo Icon */}
              <View className="bg-gradient-to-br from-purple-500 to-blue-500">
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <Text style={{ fontSize: 36, fontWeight: '900', color: isDark ? '#ffffff' : accentColor }}>C</Text>
                </Animated.View>
              </View>
            </Animated.View>
          </Animated.View>

          {/* Brand Text */}
          <Animated.View
            style={{
              transform: [{ translateY: textSlide }],
              alignItems: 'center',
              marginBottom: 40,
            }}
          >
            <View className="flex-row items-center mb-3">
              <View style={{ width: 32, height: 1, backgroundColor: `${accentColor}50` }} />
              <Text style={{ color: accentColorLight, fontSize: 10, fontWeight: '600', letterSpacing: 3, marginHorizontal: 12 }}>
                WELCOME TO
              </Text>
              <View style={{ width: 32, height: 1, backgroundColor: `${accentColor}50` }} />
            </View>

            <Text style={{ color: textPrimary, fontSize: 36, fontWeight: '900', letterSpacing: -0.5, marginBottom: 8 }}>
              Centaur<Text style={{ color: accentColor }}>OS</Text>
            </Text>

            <Text style={{ color: textSecondary, fontSize: 14, letterSpacing: 0.5 }}>
              The Operating System for Lean Startups
            </Text>
          </Animated.View>

          {/* Quote Section */}
          <Animated.View
            style={{
              opacity: quoteOpacity,
              width: '100%',
              maxWidth: 320,
            }}
          >
            <View className="relative">
              {/* Quote marks */}
              <Text style={{ position: 'absolute', top: -8, left: -4, color: `${accentColor}33`, fontSize: 48 }}>"</Text>

              <View className="px-4 py-3">
                <Text style={{ color: textSecondary, fontSize: 16, textAlign: 'center', lineHeight: 24, fontWeight: '300' }}>
                  {randomQuote.quote}
                </Text>
                <View className="flex-row items-center justify-center mt-3">
                  <View style={{ width: 16, height: 1, backgroundColor: dividerColor }} />
                  <Text style={{ color: textTertiary, fontSize: 12, fontWeight: '500', marginHorizontal: 8 }}>
                    {randomQuote.author}
                  </Text>
                  <View style={{ width: 16, height: 1, backgroundColor: dividerColor }} />
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Loading Bar */}
          <View className="absolute bottom-16 w-32">
            <View style={{ height: 2, backgroundColor: loadingBarBg, borderRadius: 1, overflow: 'hidden' }}>
              <Animated.View
                style={{
                  height: '100%',
                  backgroundColor: accentColor,
                  width: '100%',
                  opacity: fadeAnim,
                }}
              />
            </View>
            <View className="flex-row items-center justify-center mt-3">
              <Zap size={12} color={accentColor} />
              <Text style={{ color: textTertiary, fontSize: 12, marginLeft: 6 }}>Loading</Text>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}
