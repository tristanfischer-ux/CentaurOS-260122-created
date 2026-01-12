import React from 'react';
import Svg, { Path, Circle, Ellipse, Rect, Line, Defs, LinearGradient, Stop } from 'react-native-svg';

interface CentaurLogoProps {
  size?: number;
}

export function CentaurLogo({ size = 120 }: CentaurLogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200" fill="none">
      <Defs>
        {/* Realistic skin tones */}
        <LinearGradient id="maleSkinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#f0d5b8" stopOpacity="1" />
          <Stop offset="100%" stopColor="#e8c4a0" stopOpacity="1" />
        </LinearGradient>
        <LinearGradient id="femaleSkinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#fce5d8" stopOpacity="1" />
          <Stop offset="100%" stopColor="#f5d5c3" stopOpacity="1" />
        </LinearGradient>
        {/* Clothing gradients */}
        <LinearGradient id="maleShirtGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#3b82f6" stopOpacity="1" />
          <Stop offset="100%" stopColor="#2563eb" stopOpacity="1" />
        </LinearGradient>
        <LinearGradient id="femaleShirtGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#ec4899" stopOpacity="1" />
          <Stop offset="100%" stopColor="#db2777" stopOpacity="1" />
        </LinearGradient>
        {/* Digital horse gradient */}
        <LinearGradient id="digitalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#8b5cf6" stopOpacity="1" />
          <Stop offset="100%" stopColor="#6366f1" stopOpacity="1" />
        </LinearGradient>
      </Defs>

      {/* Male Centaur - Left Side */}
      {/* Head with realistic proportions */}
      <Ellipse cx="65" cy="50" rx="14" ry="16" fill="url(#maleSkinGradient)" />
      {/* Hair */}
      <Path d="M 52 45 Q 50 40, 53 36 Q 58 32, 65 31 Q 72 32, 77 36 Q 80 40, 78 45 Z"
        fill="#3d2817" />
      {/* Ear */}
      <Ellipse cx="50" cy="50" rx="3" ry="4" fill="url(#maleSkinGradient)" />
      {/* Eyes */}
      <Circle cx="60" cy="50" r="1.5" fill="#2c1810" />
      <Circle cx="70" cy="50" r="1.5" fill="#2c1810" />
      {/* Eyebrows */}
      <Path d="M 57 46 Q 60 45, 63 46" stroke="#3d2817" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <Path d="M 67 46 Q 70 45, 73 46" stroke="#3d2817" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Nose */}
      <Line x1="65" y1="52" x2="65" y2="56" stroke="#d4a574" strokeWidth="1.2" strokeLinecap="round" />
      <Path d="M 63 56 Q 65 57, 67 56" stroke="#d4a574" strokeWidth="0.8" fill="none" />
      {/* Mouth */}
      <Path d="M 60 59 Q 65 61, 70 59" stroke="#c4956a" strokeWidth="1.2" fill="none" strokeLinecap="round" />

      {/* Neck with shadow */}
      <Path d="M 61 66 L 61 74 L 69 74 L 69 66" fill="url(#maleSkinGradient)" />
      <Line x1="63" y1="66" x2="63" y2="74" stroke="#d4a574" strokeWidth="0.5" opacity="0.3" />

      {/* Torso - Business shirt with collar */}
      <Path d="M 54 74 L 58 74 L 60 84 L 60 98 L 70 98 L 70 84 L 72 74 L 76 74 Q 78 88, 76 98 L 54 98 Q 52 88, 54 74 Z"
        fill="url(#maleShirtGradient)" />
      {/* Shirt collar */}
      <Path d="M 61 74 L 63 78 L 65 76 L 67 78 L 69 74" fill="white" opacity="0.9" />
      {/* Shirt buttons */}
      <Circle cx="65" cy="82" r="1" fill="white" opacity="0.8" />
      <Circle cx="65" cy="88" r="1" fill="white" opacity="0.8" />
      <Circle cx="65" cy="94" r="1" fill="white" opacity="0.8" />

      {/* Realistic arms with shoulders */}
      <Ellipse cx="51" cy="78" rx="4" ry="5" fill="url(#maleShirtGradient)" />
      <Rect x="47" y="80" width="7" height="16" rx="3.5" fill="url(#maleSkinGradient)" />
      <Ellipse cx="79" cy="78" rx="4" ry="5" fill="url(#maleShirtGradient)" />
      <Rect x="76" y="80" width="7" height="16" rx="3.5" fill="url(#maleSkinGradient)" />
      {/* Hands with fingers indication */}
      <Ellipse cx="50.5" cy="96" rx="3.5" ry="3" fill="url(#maleSkinGradient)" />
      <Ellipse cx="79.5" cy="96" rx="3.5" ry="3" fill="url(#maleSkinGradient)" />

      {/* Digital horse body - male with better proportions */}
      <Path d="M 60 98 Q 58 108, 56 122 L 52 142 L 48 160 M 70 98 Q 72 108, 74 122 L 78 142 L 82 160"
        stroke="url(#digitalGradient)" strokeWidth="7" strokeLinecap="round" fill="none" />
      {/* Circuit patterns */}
      <Line x1="63" y1="102" x2="63" y2="118" stroke="#60a5fa" strokeWidth="1.8" opacity="0.7" />
      <Circle cx="63" cy="110" r="3" fill="#60a5fa" opacity="0.8" />
      <Line x1="58" y1="127" x2="68" y2="127" stroke="#60a5fa" strokeWidth="1.8" opacity="0.6" />
      <Circle cx="58" cy="127" r="2" fill="#60a5fa" opacity="0.7" />
      <Circle cx="68" cy="127" r="2" fill="#60a5fa" opacity="0.7" />

      {/* Female Centaur - Right Side */}
      {/* Head with realistic proportions */}
      <Ellipse cx="135" cy="50" rx="13.5" ry="16" fill="url(#femaleSkinGradient)" />
      {/* Hair - longer, more detailed */}
      <Path d="M 122 44 Q 118 38, 122 33 Q 128 28, 135 27 Q 142 28, 148 33 Q 152 38, 148 44 L 146 54 Q 148 52, 151 56 L 148 62 Q 135 60, 122 62 L 119 56 Q 121 52, 124 54 Z"
        fill="#5a3825" />
      {/* Ear */}
      <Ellipse cx="148" cy="50" rx="3" ry="4" fill="url(#femaleSkinGradient)" />
      {/* Eyes */}
      <Circle cx="130" cy="50" r="1.5" fill="#2c1810" />
      <Circle cx="140" cy="50" r="1.5" fill="#2c1810" />
      {/* Eyelashes */}
      <Line x1="129" y1="48" x2="128" y2="46" stroke="#2c1810" strokeWidth="1" strokeLinecap="round" />
      <Line x1="131" y1="48" x2="132" y2="46" stroke="#2c1810" strokeWidth="1" strokeLinecap="round" />
      <Line x1="139" y1="48" x2="138" y2="46" stroke="#2c1810" strokeWidth="1" strokeLinecap="round" />
      <Line x1="141" y1="48" x2="142" y2="46" stroke="#2c1810" strokeWidth="1" strokeLinecap="round" />
      {/* Eyebrows */}
      <Path d="M 127 46 Q 130 45, 133 46" stroke="#5a3825" strokeWidth="1" fill="none" strokeLinecap="round" />
      <Path d="M 137 46 Q 140 45, 143 46" stroke="#5a3825" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* Nose */}
      <Line x1="135" y1="52" x2="135" y2="56" stroke="#e8b89a" strokeWidth="1.2" strokeLinecap="round" />
      <Path d="M 133 56 Q 135 57, 137 56" stroke="#e8b89a" strokeWidth="0.8" fill="none" />
      {/* Smile with lips */}
      <Path d="M 130 59 Q 135 61, 140 59" stroke="#d8a88a" strokeWidth="1.2" fill="none" strokeLinecap="round" />

      {/* Neck with shadow */}
      <Path d="M 131 66 L 131 74 L 139 74 L 139 66" fill="url(#femaleSkinGradient)" />
      <Line x1="133" y1="66" x2="133" y2="74" stroke="#e8b89a" strokeWidth="0.5" opacity="0.3" />

      {/* Torso - Business shirt */}
      <Path d="M 124 74 L 128 74 L 130 84 L 130 98 L 140 98 L 140 84 L 142 74 L 146 74 Q 148 88, 146 98 L 124 98 Q 122 88, 124 74 Z"
        fill="url(#femaleShirtGradient)" />
      {/* Shirt collar */}
      <Path d="M 131 74 L 133 78 L 135 76 L 137 78 L 139 74" fill="white" opacity="0.9" />

      {/* Realistic arms with shoulders */}
      <Ellipse cx="121" cy="78" rx="4" ry="5" fill="url(#femaleShirtGradient)" />
      <Rect x="117" y="80" width="7" height="16" rx="3.5" fill="url(#femaleSkinGradient)" />
      <Ellipse cx="149" cy="78" rx="4" ry="5" fill="url(#femaleShirtGradient)" />
      <Rect x="146" y="80" width="7" height="16" rx="3.5" fill="url(#femaleSkinGradient)" />
      {/* Hands with fingers indication */}
      <Ellipse cx="120.5" cy="96" rx="3.5" ry="3" fill="url(#femaleSkinGradient)" />
      <Ellipse cx="149.5" cy="96" rx="3.5" ry="3" fill="url(#femaleSkinGradient)" />

      {/* Digital horse body - female */}
      <Path d="M 130 98 Q 128 108, 126 122 L 122 142 L 118 160 M 140 98 Q 142 108, 144 122 L 148 142 L 152 160"
        stroke="url(#digitalGradient)" strokeWidth="7" strokeLinecap="round" fill="none" />
      {/* Circuit patterns */}
      <Line x1="133" y1="102" x2="133" y2="118" stroke="#ec4899" strokeWidth="1.8" opacity="0.7" />
      <Circle cx="133" cy="110" r="3" fill="#ec4899" opacity="0.8" />
      <Line x1="128" y1="127" x2="138" y2="127" stroke="#ec4899" strokeWidth="1.8" opacity="0.6" />
      <Circle cx="128" cy="127" r="2" fill="#ec4899" opacity="0.7" />
      <Circle cx="138" cy="127" r="2" fill="#ec4899" opacity="0.7" />

      {/* Partnership connection - digital link between centaurs */}
      <Line x1="82" y1="88" x2="118" y2="88" stroke="#8b5cf6" strokeWidth="2.5" strokeDasharray="5 3" opacity="0.8" />
      <Circle cx="100" cy="88" r="6" fill="#8b5cf6" opacity="0.9" />
      <Circle cx="100" cy="88" r="3.5" fill="#fff" opacity="0.9" />

      {/* Data flow particles */}
      <Circle cx="90" cy="88" r="2.5" fill="#60a5fa" opacity="0.6" />
      <Circle cx="110" cy="88" r="2.5" fill="#ec4899" opacity="0.6" />
      <Circle cx="95" cy="86" r="1.5" fill="#60a5fa" opacity="0.4" />
      <Circle cx="105" cy="86" r="1.5" fill="#ec4899" opacity="0.4" />
    </Svg>
  );
}
