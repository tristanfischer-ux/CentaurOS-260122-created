import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop, G } from 'react-native-svg';

interface CentaurLogoProps {
  size?: number;
  variant?: 'full' | 'minimal';
}

export function CentaurLogo({ size = 120, variant = 'full' }: CentaurLogoProps) {
  if (variant === 'minimal') {
    // Single elegant centaur silhouette
    return (
      <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <Defs>
          <LinearGradient id="centaurGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#8b5cf6" />
            <Stop offset="50%" stopColor="#6366f1" />
            <Stop offset="100%" stopColor="#3b82f6" />
          </LinearGradient>
          <LinearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#f59e0b" />
            <Stop offset="100%" stopColor="#f97316" />
          </LinearGradient>
        </Defs>

        {/* Single elegant centaur - stylized silhouette */}
        <G>
          {/* Horse body - sleek curved form */}
          <Path
            d="M 25 70
               Q 20 68, 18 62
               L 15 50
               Q 14 45, 18 42
               L 35 38
               Q 45 36, 55 38
               L 72 42
               Q 76 45, 75 50
               L 72 62
               Q 70 68, 65 70
               Q 55 72, 45 72
               Q 35 72, 25 70 Z"
            fill="url(#centaurGradient)"
          />

          {/* Front legs - dynamic pose */}
          <Path
            d="M 22 62 Q 20 72, 18 82 Q 17 86, 19 88 L 23 88 Q 25 86, 24 82 Q 26 74, 28 65"
            fill="url(#centaurGradient)"
          />
          <Path
            d="M 30 64 Q 32 74, 34 84 Q 35 88, 33 90 L 29 90 Q 27 88, 28 84 Q 26 76, 26 66"
            fill="url(#centaurGradient)"
          />

          {/* Back legs - galloping pose */}
          <Path
            d="M 62 64 Q 60 74, 58 84 Q 57 88, 59 90 L 63 90 Q 65 88, 64 84 Q 66 76, 68 66"
            fill="url(#centaurGradient)"
          />
          <Path
            d="M 70 62 Q 72 70, 76 78 Q 78 82, 80 86 L 84 84 Q 82 80, 78 74 Q 74 66, 72 60"
            fill="url(#centaurGradient)"
          />

          {/* Tail - flowing */}
          <Path
            d="M 74 48 Q 82 44, 88 48 Q 92 52, 88 58 Q 84 54, 78 52 Q 76 50, 74 50"
            fill="url(#centaurGradient)"
          />

          {/* Human torso rising from horse */}
          <Path
            d="M 35 38
               Q 38 30, 42 24
               L 42 20
               Q 40 18, 40 14
               Q 40 8, 46 6
               Q 52 4, 54 10
               Q 56 14, 54 18
               L 54 22
               Q 56 28, 58 36
               Q 52 34, 45 34
               Q 38 34, 35 38 Z"
            fill="url(#centaurGradient)"
          />

          {/* Arms - reaching forward dynamically */}
          <Path
            d="M 38 28 Q 32 24, 26 22 Q 22 20, 20 22 Q 22 24, 26 25 Q 32 28, 36 30"
            fill="url(#centaurGradient)"
          />
          <Path
            d="M 54 26 Q 60 22, 66 20 Q 70 18, 72 20 Q 70 22, 66 24 Q 60 28, 56 30"
            fill="url(#centaurGradient)"
          />

          {/* Spear/lance - tech element */}
          <Path
            d="M 20 22 L 8 10 L 6 12 L 18 24"
            stroke="url(#accentGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M 6 8 L 8 10 L 4 14"
            fill="url(#accentGradient)"
          />
        </G>
      </Svg>
    );
  }

  // Full variant - Two centaurs in partnership (for larger displays)
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200" fill="none">
      <Defs>
        <LinearGradient id="leftCentaurGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#3b82f6" />
          <Stop offset="100%" stopColor="#6366f1" />
        </LinearGradient>
        <LinearGradient id="rightCentaurGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#8b5cf6" />
          <Stop offset="100%" stopColor="#ec4899" />
        </LinearGradient>
        <LinearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#3b82f6" />
          <Stop offset="50%" stopColor="#8b5cf6" />
          <Stop offset="100%" stopColor="#ec4899" />
        </LinearGradient>
        <LinearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#fbbf24" />
          <Stop offset="100%" stopColor="#f59e0b" />
        </LinearGradient>
      </Defs>

      {/* Left Centaur - Blue theme */}
      <G transform="translate(10, 20)">
        {/* Horse body */}
        <Path
          d="M 20 110
             Q 15 108, 12 100
             L 10 85
             Q 8 78, 14 74
             L 35 68
             Q 50 64, 65 68
             L 78 74
             Q 84 78, 82 85
             L 78 100
             Q 76 108, 70 110
             Q 55 114, 45 114
             Q 30 114, 20 110 Z"
          fill="url(#leftCentaurGradient)"
        />

        {/* Front legs */}
        <Path
          d="M 18 100 Q 14 115, 12 130 Q 10 138, 14 140 L 20 140 Q 22 136, 20 128 Q 22 115, 26 102"
          fill="url(#leftCentaurGradient)"
        />
        <Path
          d="M 30 104 Q 32 118, 36 132 Q 38 140, 34 144 L 28 144 Q 24 140, 28 130 Q 26 118, 26 106"
          fill="url(#leftCentaurGradient)"
        />

        {/* Back legs */}
        <Path
          d="M 62 104 Q 58 118, 54 132 Q 52 140, 56 144 L 62 144 Q 66 140, 64 130 Q 68 118, 72 106"
          fill="url(#leftCentaurGradient)"
        />
        <Path
          d="M 74 100 Q 78 112, 84 124 Q 88 132, 92 138 L 98 134 Q 92 126, 86 116 Q 80 106, 76 98"
          fill="url(#leftCentaurGradient)"
        />

        {/* Tail */}
        <Path
          d="M 82 82 Q 94 76, 102 82 Q 108 90, 100 98 Q 92 92, 84 88"
          fill="url(#leftCentaurGradient)"
        />

        {/* Human torso */}
        <Path
          d="M 35 68
             Q 40 54, 46 42
             L 46 34
             Q 42 30, 42 24
             Q 42 14, 52 10
             Q 62 8, 66 18
             Q 68 24, 64 30
             L 64 38
             Q 68 50, 72 66
             Q 60 62, 50 62
             Q 40 62, 35 68 Z"
          fill="url(#leftCentaurGradient)"
        />

        {/* Arms reaching toward center */}
        <Path
          d="M 64 38 Q 74 32, 86 30 Q 94 28, 100 32"
          stroke="url(#leftCentaurGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
      </G>

      {/* Right Centaur - Purple/Pink theme (mirrored) */}
      <G transform="translate(190, 20) scale(-1, 1)">
        {/* Horse body */}
        <Path
          d="M 20 110
             Q 15 108, 12 100
             L 10 85
             Q 8 78, 14 74
             L 35 68
             Q 50 64, 65 68
             L 78 74
             Q 84 78, 82 85
             L 78 100
             Q 76 108, 70 110
             Q 55 114, 45 114
             Q 30 114, 20 110 Z"
          fill="url(#rightCentaurGradient)"
        />

        {/* Front legs */}
        <Path
          d="M 18 100 Q 14 115, 12 130 Q 10 138, 14 140 L 20 140 Q 22 136, 20 128 Q 22 115, 26 102"
          fill="url(#rightCentaurGradient)"
        />
        <Path
          d="M 30 104 Q 32 118, 36 132 Q 38 140, 34 144 L 28 144 Q 24 140, 28 130 Q 26 118, 26 106"
          fill="url(#rightCentaurGradient)"
        />

        {/* Back legs */}
        <Path
          d="M 62 104 Q 58 118, 54 132 Q 52 140, 56 144 L 62 144 Q 66 140, 64 130 Q 68 118, 72 106"
          fill="url(#rightCentaurGradient)"
        />
        <Path
          d="M 74 100 Q 78 112, 84 124 Q 88 132, 92 138 L 98 134 Q 92 126, 86 116 Q 80 106, 76 98"
          fill="url(#rightCentaurGradient)"
        />

        {/* Tail */}
        <Path
          d="M 82 82 Q 94 76, 102 82 Q 108 90, 100 98 Q 92 92, 84 88"
          fill="url(#rightCentaurGradient)"
        />

        {/* Human torso */}
        <Path
          d="M 35 68
             Q 40 54, 46 42
             L 46 34
             Q 42 30, 42 24
             Q 42 14, 52 10
             Q 62 8, 66 18
             Q 68 24, 64 30
             L 64 38
             Q 68 50, 72 66
             Q 60 62, 50 62
             Q 40 62, 35 68 Z"
          fill="url(#rightCentaurGradient)"
        />

        {/* Arms reaching toward center */}
        <Path
          d="M 64 38 Q 74 32, 86 30 Q 94 28, 100 32"
          stroke="url(#rightCentaurGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
      </G>

      {/* Connection element - hands meeting in center */}
      <G>
        {/* Glowing orb in center */}
        <Path
          d="M 90 52 Q 100 44, 110 52 Q 118 60, 110 68 Q 100 76, 90 68 Q 82 60, 90 52 Z"
          fill="url(#glowGradient)"
          opacity="0.9"
        />
        <Path
          d="M 94 56 Q 100 52, 106 56 Q 110 60, 106 64 Q 100 68, 94 64 Q 90 60, 94 56 Z"
          fill="white"
          opacity="0.8"
        />

        {/* Energy lines */}
        <Path
          d="M 85 60 Q 88 58, 90 60"
          stroke="url(#connectionGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />
        <Path
          d="M 110 60 Q 112 58, 115 60"
          stroke="url(#connectionGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />
      </G>
    </Svg>
  );
}
