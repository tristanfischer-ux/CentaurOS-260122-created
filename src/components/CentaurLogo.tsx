import React from 'react';
import Svg, { Path, Circle, Rect, Line, Defs, LinearGradient, Stop } from 'react-native-svg';

interface CentaurLogoProps {
  size?: number;
}

export function CentaurLogo({ size = 120 }: CentaurLogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200" fill="none">
      <Defs>
        {/* Gradient for male centaur */}
        <LinearGradient id="maleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#3b82f6" stopOpacity="1" />
          <Stop offset="100%" stopColor="#2563eb" stopOpacity="1" />
        </LinearGradient>

        {/* Gradient for female centaur */}
        <LinearGradient id="femaleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#ec4899" stopOpacity="1" />
          <Stop offset="100%" stopColor="#db2777" stopOpacity="1" />
        </LinearGradient>

        {/* Gradient for digital horse body */}
        <LinearGradient id="digitalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#8b5cf6" stopOpacity="1" />
          <Stop offset="100%" stopColor="#6366f1" stopOpacity="1" />
        </LinearGradient>
      </Defs>

      {/* Male Centaur - Left Side */}
      {/* Human upper body - male */}
      <Circle cx="70" cy="60" r="12" fill="url(#maleGradient)" />
      <Rect x="64" y="72" width="12" height="20" rx="2" fill="url(#maleGradient)" />

      {/* Arms - male */}
      <Rect x="54" y="75" width="8" height="3" rx="1.5" fill="url(#maleGradient)" />
      <Rect x="78" y="75" width="8" height="3" rx="1.5" fill="url(#maleGradient)" />

      {/* Digital horse body - left */}
      <Path
        d="M 64 92 Q 60 100, 58 110 L 54 130 L 50 145 M 76 92 Q 80 100, 82 110 L 86 130 L 90 145"
        stroke="url(#digitalGradient)"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Tech circuit pattern on horse body - left */}
      <Line x1="62" y1="95" x2="62" y2="105" stroke="#60a5fa" strokeWidth="1" />
      <Line x1="58" y1="100" x2="66" y2="100" stroke="#60a5fa" strokeWidth="1" />
      <Circle cx="62" cy="100" r="2" fill="#60a5fa" />
      <Line x1="72" y1="98" x2="72" y2="108" stroke="#60a5fa" strokeWidth="1" />
      <Line x1="68" y1="103" x2="76" y2="103" stroke="#60a5fa" strokeWidth="1" />
      <Circle cx="72" cy="103" r="2" fill="#60a5fa" />

      {/* Hooves - digital style - left */}
      <Rect x="48" y="145" width="4" height="6" rx="1" fill="#3b82f6" />
      <Rect x="88" y="145" width="4" height="6" rx="1" fill="#3b82f6" />

      {/* Female Centaur - Right Side */}
      {/* Human upper body - female */}
      <Circle cx="130" cy="60" r="12" fill="url(#femaleGradient)" />
      <Rect x="124" y="72" width="12" height="20" rx="2" fill="url(#femaleGradient)" />

      {/* Arms - female */}
      <Rect x="114" y="75" width="8" height="3" rx="1.5" fill="url(#femaleGradient)" />
      <Rect x="138" y="75" width="8" height="3" rx="1.5" fill="url(#femaleGradient)" />

      {/* Digital horse body - right */}
      <Path
        d="M 124 92 Q 120 100, 118 110 L 114 130 L 110 145 M 136 92 Q 140 100, 142 110 L 146 130 L 150 145"
        stroke="url(#digitalGradient)"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Tech circuit pattern on horse body - right */}
      <Line x1="122" y1="95" x2="122" y2="105" stroke="#f472b6" strokeWidth="1" />
      <Line x1="118" y1="100" x2="126" y2="100" stroke="#f472b6" strokeWidth="1" />
      <Circle cx="122" cy="100" r="2" fill="#f472b6" />
      <Line x1="132" y1="98" x2="132" y2="108" stroke="#f472b6" strokeWidth="1" />
      <Line x1="128" y1="103" x2="136" y2="103" stroke="#f472b6" strokeWidth="1" />
      <Circle cx="132" cy="103" r="2" fill="#f472b6" />

      {/* Hooves - digital style - right */}
      <Rect x="108" y="145" width="4" height="6" rx="1" fill="#ec4899" />
      <Rect x="148" y="145" width="4" height="6" rx="1" fill="#ec4899" />

      {/* Center connection - representing partnership */}
      <Line x1="76" y1="80" x2="124" y2="80" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="4 2" />
      <Circle cx="100" cy="80" r="4" fill="#8b5cf6" />

      {/* Digital/Tech elements around the logo */}
      <Circle cx="40" cy="50" r="2" fill="#60a5fa" opacity="0.6" />
      <Circle cx="160" cy="50" r="2" fill="#f472b6" opacity="0.6" />
      <Circle cx="30" cy="90" r="2" fill="#60a5fa" opacity="0.4" />
      <Circle cx="170" cy="90" r="2" fill="#f472b6" opacity="0.4" />
      <Circle cx="45" cy="120" r="2" fill="#8b5cf6" opacity="0.5" />
      <Circle cx="155" cy="120" r="2" fill="#8b5cf6" opacity="0.5" />

      {/* Binary code pattern in background */}
      <Path
        d="M 20 30 L 25 30 M 27 30 L 30 30"
        stroke="#3b82f6"
        strokeWidth="1"
        opacity="0.3"
      />
      <Path
        d="M 170 30 L 175 30 M 177 30 L 180 30"
        stroke="#ec4899"
        strokeWidth="1"
        opacity="0.3"
      />
    </Svg>
  );
}
