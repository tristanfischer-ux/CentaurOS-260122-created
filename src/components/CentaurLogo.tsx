import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop, G, Circle, Rect } from 'react-native-svg';

interface CentaurLogoProps {
  size?: number;
  variant?: 'full' | 'minimal';
}

export function CentaurLogo({ size = 80, variant = 'minimal' }: CentaurLogoProps) {
  // Modern centaur: Human upper body + digital horse lower body (NO horse head)
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Defs>
        <LinearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#fbbf24" />
          <Stop offset="100%" stopColor="#f97316" />
        </LinearGradient>
        <LinearGradient id="techGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#3b82f6" />
          <Stop offset="50%" stopColor="#6366f1" />
          <Stop offset="100%" stopColor="#8b5cf6" />
        </LinearGradient>
      </Defs>

      <G>
        {/* Digital horse body (geometric, no head) */}
        <Path
          d="M 30 50
             L 40 48
             L 55 48
             L 70 50
             L 75 58
             L 75 70
             L 25 70
             L 25 58
             Z"
          fill="url(#techGradient)"
          opacity="0.9"
        />

        {/* Tech pattern lines on body */}
        <Path d="M 30 52 L 70 52" stroke="#60a5fa" strokeWidth="0.5" opacity="0.6" />
        <Path d="M 28 58 L 72 58" stroke="#60a5fa" strokeWidth="0.5" opacity="0.6" />
        <Path d="M 27 64 L 73 64" stroke="#60a5fa" strokeWidth="0.5" opacity="0.6" />

        {/* Digital circuit nodes */}
        <Circle cx="35" cy="55" r="1.5" fill="#60a5fa" opacity="0.8" />
        <Circle cx="50" cy="52" r="1.5" fill="#60a5fa" opacity="0.8" />
        <Circle cx="65" cy="55" r="1.5" fill="#60a5fa" opacity="0.8" />

        {/* Front legs - geometric/digital style */}
        <Rect x="32" y="70" width="4" height="18" rx="1" fill="url(#techGradient)" />
        <Rect x="40" y="70" width="4" height="18" rx="1" fill="url(#techGradient)" />

        {/* Back legs - geometric/digital style */}
        <Rect x="56" y="70" width="4" height="18" rx="1" fill="url(#techGradient)" />
        <Rect x="64" y="70" width="4" height="18" rx="1" fill="url(#techGradient)" />

        {/* Digital tail - geometric */}
        <Path
          d="M 75 60 L 80 58 L 84 60 L 82 64 L 78 65 Z"
          fill="url(#techGradient)"
          opacity="0.8"
        />

        {/* Human upper body - warm orange gradient */}
        <Path
          d="M 40 48
             L 42 35
             L 44 28
             L 46 24
             L 46 18
             Q 46 14, 50 14
             Q 54 14, 54 18
             L 54 24
             L 56 28
             L 58 35
             L 60 48
             L 55 46
             L 50 46
             L 45 46
             Z"
          fill="url(#bodyGradient)"
        />

        {/* Head - simple circle */}
        <Circle cx="50" cy="14" r="6" fill="url(#bodyGradient)" />

        {/* Arms - extended forward */}
        <Path
          d="M 44 30 L 35 28 L 33 30 L 42 32 Z"
          fill="url(#bodyGradient)"
        />
        <Path
          d="M 56 30 L 65 28 L 67 30 L 58 32 Z"
          fill="url(#bodyGradient)"
        />

        {/* Tech accent - glowing point at connection */}
        <Circle cx="50" cy="46" r="3" fill="#fbbf24" opacity="0.9" />
        <Circle cx="50" cy="46" r="1.5" fill="white" opacity="0.8" />
      </G>
    </Svg>
  );
}
