import { View, Text, Modal, Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import { Trophy, Star, Zap, Target } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import type { Achievement } from '@/lib/achievements';

interface CelebrationModalProps {
  visible: boolean;
  onClose: () => void;
  achievement?: Achievement;
  message?: string;
  type?: 'achievement' | 'level_up' | 'goal_met' | 'streak';
}

export function CelebrationModal({
  visible,
  onClose,
  achievement,
  message,
  type = 'achievement',
}: CelebrationModalProps) {
  const scale = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Entrance animation
      scale.value = withSpring(1, {
        damping: 10,
        stiffness: 100,
      });
      opacity.value = withTiming(1, { duration: 300 });
      rotate.value = withSequence(
        withTiming(-10, { duration: 100 }),
        withTiming(10, { duration: 100 }),
        withTiming(-10, { duration: 100 }),
        withTiming(0, { duration: 100 })
      );
    } else {
      scale.value = 0;
      opacity.value = 0;
      rotate.value = 0;
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
    opacity: opacity.value,
  }));

  const getTierColor = (tier?: string): [string, string] => {
    switch (tier) {
      case 'bronze':
        return ['#CD7F32', '#8B4513'];
      case 'silver':
        return ['#C0C0C0', '#808080'];
      case 'gold':
        return ['#FFD700', '#DAA520'];
      case 'platinum':
        return ['#E5E4E2', '#8E8E8E'];
      case 'legendary':
        return ['#FF6B6B', '#8B0000'];
      default:
        return ['#3b82f6', '#2563eb'];
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'achievement':
        return <Trophy size={40} color="#fff" />;
      case 'level_up':
        return <Star size={40} color="#fff" />;
      case 'goal_met':
        return <Target size={40} color="#fff" />;
      case 'streak':
        return <Zap size={40} color="#fff" />;
      default:
        return <Trophy size={40} color="#fff" />;
    }
  };

  const getTitle = () => {
    if (achievement) return achievement.title;
    switch (type) {
      case 'level_up':
        return 'Level Up!';
      case 'goal_met':
        return 'Goal Achieved!';
      case 'streak':
        return 'Streak Milestone!';
      default:
        return 'Achievement Unlocked!';
    }
  };

  const getEmoji = () => {
    if (achievement) return achievement.emoji;
    switch (type) {
      case 'level_up':
        return '⭐';
      case 'goal_met':
        return '🎯';
      case 'streak':
        return '🔥';
      default:
        return '🏆';
    }
  };

  const colors: [string, string] = achievement ? getTierColor(achievement.tier) : ['#3b82f6', '#2563eb'];

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/80 items-center justify-center p-6">
        {/* Confetti Background Effect */}
        <ConfettiAnimation visible={visible} />

        {/* Achievement Card */}
        <Animated.View style={[animatedStyle, { width: '100%', maxWidth: 400 }]}>
          <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 24,
              padding: 32,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            {/* Icon */}
            <View className="mb-4">
              {getTypeIcon()}
            </View>

            {/* Emoji */}
            <Text className="text-6xl mb-4">{getEmoji()}</Text>

            {/* Title */}
            <Text className="text-white text-2xl font-bold text-center mb-2">
              {getTitle()}
            </Text>

            {/* Description */}
            {achievement && (
              <Text className="text-white/90 text-center mb-4">
                {achievement.description}
              </Text>
            )}

            {message && (
              <Text className="text-white/90 text-center mb-4">
                {message}
              </Text>
            )}

            {/* Tier Badge */}
            {achievement && (
              <View className="bg-white/20 px-4 py-2 rounded-full mb-6">
                <Text className="text-white font-bold uppercase tracking-wider text-xs">
                  {achievement.tier} Tier
                </Text>
              </View>
            )}

            {/* Close Button */}
            <Pressable
              onPress={onClose}
              className="bg-white/20 px-8 py-3 rounded-xl active:opacity-70"
            >
              <Text className="text-white font-bold text-lg">Awesome!</Text>
            </Pressable>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

// Confetti Animation Component
function ConfettiAnimation({ visible }: { visible: boolean }) {
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; color: string; delay: number }>>([]);

  useEffect(() => {
    if (visible) {
      // Generate confetti pieces
      const pieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][Math.floor(Math.random() * 5)],
        delay: Math.random() * 200,
      }));
      setConfetti(pieces);
    } else {
      setConfetti([]);
    }
  }, [visible]);

  return (
    <View className="absolute inset-0 pointer-events-none">
      {confetti.map((piece) => (
        <ConfettiPiece
          key={piece.id}
          x={piece.x}
          color={piece.color}
          delay={piece.delay}
        />
      ))}
    </View>
  );
}

// Individual Confetti Piece
function ConfettiPiece({ x, color, delay }: { x: number; color: string; delay: number }) {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    setTimeout(() => {
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withTiming(600, { duration: 2000, easing: Easing.cubic });
      translateX.value = withRepeat(
        withSequence(
          withTiming(20, { duration: 500 }),
          withTiming(-20, { duration: 500 })
        ),
        -1,
        true
      );
      rotate.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1
      );
    }, delay);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          position: 'absolute',
          left: `${x}%`,
          width: 10,
          height: 10,
          backgroundColor: color,
          borderRadius: 2,
        },
      ]}
    />
  );
}
