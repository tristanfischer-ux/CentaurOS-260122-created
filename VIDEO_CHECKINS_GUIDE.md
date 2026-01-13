# Video Check-ins Architecture
## Phase 3 - CentaurOS

**Date**: 2026-01-13
**Status**: Architecture & Implementation Guide
**Platform**: React Native with Expo Camera & Video

---

## Overview

Video Check-ins enable asynchronous video updates where team members record short video standups, reviews, or updates that can be viewed by others at their convenience. This replaces synchronous meetings with flexible, recorded updates.

---

## Core Features

### 1. Record Video Updates
- Quick 30-second to 5-minute video recordings
- Front-facing camera for personal updates
- Screen recording for demos/walkthroughs
- Auto-upload to cloud storage
- Prompt templates for different check-in types

### 2. Check-in Types
- **Daily Standup**: What did you do? What will you do? Any blockers?
- **Weekly Review**: Achievements, challenges, goals for next week
- **Feature Demo**: Show completed work or prototypes
- **Async Feedback**: Video responses to work or proposals
- **Team Updates**: Announcements or strategic updates

### 3. View & Respond
- Feed of recent check-ins from team
- Filter by person, function, or check-in type
- Watch at 1.5x or 2x speed
- Video responses and comments
- Transcriptions with timestamps

### 4. Analytics
- Team engagement metrics
- Average check-in frequency
- Most viewed updates
- Response rates

---

## Technical Architecture

### Storage & CDN

```typescript
// Cloud storage options:
// 1. AWS S3 + CloudFront
// 2. Google Cloud Storage + Cloud CDN
// 3. Azure Blob Storage + Azure CDN
// 4. Cloudflare R2 + CDN (cost-effective)

// Example S3 configuration
const s3Config = {
  bucket: process.env.S3_BUCKET_NAME,
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};

// Upload function
export async function uploadVideo(
  uri: string,
  userId: string,
  checkinType: string
): Promise<string> {
  const filename = `checkins/${userId}/${Date.now()}_${checkinType}.mp4`;

  const response = await fetch(uri);
  const blob = await response.blob();

  const uploadResult = await s3.upload({
    Bucket: s3Config.bucket,
    Key: filename,
    Body: blob,
    ContentType: 'video/mp4',
    ACL: 'public-read',
  }).promise();

  return uploadResult.Location; // CDN URL
}
```

### Database Schema

```sql
-- Video check-ins table
CREATE TABLE video_checkins (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'standup', 'review', 'demo', 'feedback', 'update'
  title VARCHAR(200) NOT NULL,
  description TEXT,
  video_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  duration_seconds INTEGER NOT NULL,
  transcription TEXT,
  transcription_timestamps JSONB, -- [{ start: 0, end: 5, text: "Hello team..." }]
  views_count INTEGER DEFAULT 0,
  function VARCHAR(50), -- 'Engineering', 'Marketing', etc.
  related_okr_id UUID,
  related_work_plan_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Video responses (video replies to check-ins)
CREATE TABLE video_responses (
  id UUID PRIMARY KEY,
  checkin_id UUID NOT NULL REFERENCES video_checkins(id),
  user_id UUID NOT NULL,
  video_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  duration_seconds INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Video views tracking
CREATE TABLE video_views (
  id UUID PRIMARY KEY,
  checkin_id UUID NOT NULL REFERENCES video_checkins(id),
  user_id UUID NOT NULL,
  watch_percentage INTEGER DEFAULT 0, -- 0-100
  last_position_seconds INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(checkin_id, user_id)
);

-- Reactions to check-ins
CREATE TABLE video_reactions (
  id UUID PRIMARY KEY,
  checkin_id UUID NOT NULL REFERENCES video_checkins(id),
  user_id UUID NOT NULL,
  reaction VARCHAR(20) NOT NULL, -- 'like', 'love', 'celebrate', 'question'
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(checkin_id, user_id, reaction)
);
```

---

## Frontend Implementation

### 1. Video Recording Component

```typescript
// src/components/VideoRecorder.tsx
import { View, Text } from 'react-native';
import { useState, useRef } from 'react';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Video } from 'expo-av';
import { Circle, Square } from 'lucide-react-native';
import { HapticPressable } from './HapticPressable';

interface VideoRecorderProps {
  onRecordingComplete: (uri: string, duration: number) => void;
  maxDuration?: number; // seconds
  checkinType: string;
}

export function VideoRecorder({
  onRecordingComplete,
  maxDuration = 300,
  checkinType,
}: VideoRecorderProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-100 dark:bg-slate-900 p-6">
        <Text className="text-gray-900 dark:text-white text-center mb-4">
          Camera access is required to record video check-ins
        </Text>
        <HapticPressable
          onPress={requestPermission}
          className="bg-blue-500 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-bold">Grant Permission</Text>
        </HapticPressable>
      </View>
    );
  }

  const startRecording = async () => {
    if (cameraRef.current) {
      setIsRecording(true);
      setRecordingDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          const newDuration = prev + 1;
          if (newDuration >= maxDuration) {
            stopRecording();
          }
          return newDuration;
        });
      }, 1000);

      const video = await cameraRef.current.recordAsync({
        maxDuration,
      });

      setPreviewUri(video.uri);
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const handleConfirm = () => {
    if (previewUri) {
      onRecordingComplete(previewUri, recordingDuration);
    }
  };

  const handleRetake = () => {
    setPreviewUri(null);
    setRecordingDuration(0);
  };

  if (previewUri) {
    return (
      <View className="flex-1 bg-black">
        <Video
          source={{ uri: previewUri }}
          style={{ flex: 1 }}
          useNativeControls
          resizeMode="contain"
        />
        <View className="absolute bottom-0 left-0 right-0 p-6 flex-row gap-3">
          <HapticPressable
            onPress={handleRetake}
            className="flex-1 bg-gray-800 py-4 rounded-xl items-center"
          >
            <Text className="text-white font-bold">Retake</Text>
          </HapticPressable>
          <HapticPressable
            onPress={handleConfirm}
            className="flex-1 bg-blue-500 py-4 rounded-xl items-center"
          >
            <Text className="text-white font-bold">Use Video</Text>
          </HapticPressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing="front"
        mode="video"
      >
        {/* Recording indicator */}
        {isRecording && (
          <View className="absolute top-16 left-6 bg-red-500 px-3 py-2 rounded-full flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-white mr-2" />
            <Text className="text-white font-bold">
              {Math.floor(recordingDuration / 60)}:
              {(recordingDuration % 60).toString().padStart(2, '0')}
            </Text>
          </View>
        )}

        {/* Duration limit */}
        <View className="absolute top-16 right-6 bg-black/50 px-3 py-2 rounded-full">
          <Text className="text-white text-sm">Max {maxDuration / 60} min</Text>
        </View>

        {/* Record button */}
        <View className="absolute bottom-0 left-0 right-0 p-6 items-center">
          <HapticPressable
            onPress={isRecording ? stopRecording : startRecording}
            hapticType="medium"
            className="w-20 h-20 rounded-full bg-white/20 items-center justify-center border-4 border-white"
          >
            {isRecording ? (
              <Square size={32} color="#ffffff" fill="#ffffff" />
            ) : (
              <Circle size={40} color="#ef4444" fill="#ef4444" />
            )}
          </HapticPressable>
        </View>
      </CameraView>
    </View>
  );
}
```

### 2. Check-in Card Component

```typescript
// src/components/CheckinCard.tsx
import { View, Text, Image } from 'react-native';
import { Play, MessageSquare, Heart, Users } from 'lucide-react-native';
import { HapticPressable } from './HapticPressable';
import { formatDistanceToNow } from 'date-fns';
import type { VideoCheckin } from '@/lib/types';

interface CheckinCardProps {
  checkin: VideoCheckin;
  onPress: () => void;
  onReact: (reaction: string) => void;
}

export function CheckinCard({ checkin, onPress, onReact }: CheckinCardProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      standup: '#3b82f6',
      review: '#8b5cf6',
      demo: '#10b981',
      feedback: '#f59e0b',
      update: '#ec4899',
    };
    return colors[type] || '#64748b';
  };

  return (
    <HapticPressable
      onPress={onPress}
      className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden mb-4 border border-gray-300 dark:border-slate-800"
    >
      {/* Thumbnail */}
      <View className="relative">
        <Image
          source={{ uri: checkin.thumbnail_url }}
          className="w-full h-48"
          resizeMode="cover"
        />
        <View className="absolute inset-0 bg-black/20 items-center justify-center">
          <View className="w-16 h-16 rounded-full bg-white/90 items-center justify-center">
            <Play size={28} color="#000000" fill="#000000" />
          </View>
        </View>
        <View className="absolute top-3 left-3 bg-black/70 px-2 py-1 rounded">
          <Text className="text-white text-xs font-bold">
            {formatDuration(checkin.duration_seconds)}
          </Text>
        </View>
        <View
          className="absolute top-3 right-3 px-2 py-1 rounded"
          style={{ backgroundColor: getTypeColor(checkin.type) }}
        >
          <Text className="text-white text-xs font-bold uppercase">{checkin.type}</Text>
        </View>
      </View>

      {/* Content */}
      <View className="p-4">
        <View className="flex-row items-center mb-2">
          <View className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center mr-3">
            <Text className="text-white font-bold">{checkin.user_name.charAt(0)}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-gray-900 dark:text-white font-bold">{checkin.title}</Text>
            <Text className="text-gray-600 dark:text-slate-400 text-sm">
              {checkin.user_name} • {formatDistanceToNow(new Date(checkin.created_at), { addSuffix: true })}
            </Text>
          </View>
        </View>

        {checkin.description && (
          <Text className="text-gray-700 dark:text-slate-300 text-sm mb-3">
            {checkin.description}
          </Text>
        )}

        {/* Stats */}
        <View className="flex-row items-center gap-4 pt-3 border-t border-gray-200 dark:border-slate-800">
          <View className="flex-row items-center">
            <Users size={16} color="#64748b" />
            <Text className="text-gray-600 dark:text-slate-400 text-sm ml-1">
              {checkin.views_count} views
            </Text>
          </View>
          <HapticPressable
            onPress={() => onReact('like')}
            className="flex-row items-center"
          >
            <Heart size={16} color="#64748b" />
            <Text className="text-gray-600 dark:text-slate-400 text-sm ml-1">
              {checkin.reactions_count}
            </Text>
          </HapticPressable>
          <View className="flex-row items-center">
            <MessageSquare size={16} color="#64748b" />
            <Text className="text-gray-600 dark:text-slate-400 text-sm ml-1">
              {checkin.responses_count}
            </Text>
          </View>
        </View>
      </View>
    </HapticPressable>
  );
}
```

### 3. Video Player with Transcription

```typescript
// src/components/VideoPlayerWithTranscript.tsx
import { View, Text, ScrollView } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { Video, AVPlaybackStatus } from 'expo-av';
import { HapticPressable } from './HapticPressable';

interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

interface VideoPlayerWithTranscriptProps {
  videoUrl: string;
  transcript: TranscriptSegment[];
}

export function VideoPlayerWithTranscript({
  videoUrl,
  transcript,
}: VideoPlayerWithTranscriptProps) {
  const videoRef = useRef<Video>(null);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded && status.positionMillis) {
      const positionSeconds = status.positionMillis / 1000;
      setPlaybackPosition(positionSeconds);

      // Find active transcript segment
      const activeIndex = transcript.findIndex(
        (seg) => positionSeconds >= seg.start && positionSeconds <= seg.end
      );
      if (activeIndex !== -1) {
        setActiveSegmentIndex(activeIndex);
      }
    }
  };

  const seekToSegment = async (segment: TranscriptSegment) => {
    if (videoRef.current) {
      await videoRef.current.setPositionAsync(segment.start * 1000);
    }
  };

  return (
    <View className="flex-1">
      {/* Video Player */}
      <Video
        ref={videoRef}
        source={{ uri: videoUrl }}
        style={{ width: '100%', aspectRatio: 16 / 9 }}
        useNativeControls
        resizeMode="contain"
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
      />

      {/* Transcript */}
      <View className="flex-1 bg-gray-100 dark:bg-slate-900 p-4">
        <Text className="text-gray-900 dark:text-white font-bold text-lg mb-3">
          Transcript
        </Text>
        <ScrollView>
          {transcript.map((segment, idx) => (
            <HapticPressable
              key={idx}
              onPress={() => seekToSegment(segment)}
              className={`p-3 rounded-xl mb-2 ${
                idx === activeSegmentIndex
                  ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-500'
                  : 'bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800'
              }`}
            >
              <Text
                className={`text-xs mb-1 ${
                  idx === activeSegmentIndex
                    ? 'text-blue-700 dark:text-blue-400'
                    : 'text-gray-500 dark:text-slate-500'
                }`}
              >
                {Math.floor(segment.start / 60)}:
                {(Math.floor(segment.start) % 60).toString().padStart(2, '0')}
              </Text>
              <Text
                className={`text-sm ${
                  idx === activeSegmentIndex
                    ? 'text-gray-900 dark:text-white font-semibold'
                    : 'text-gray-700 dark:text-slate-300'
                }`}
              >
                {segment.text}
              </Text>
            </HapticPressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}
```

---

## Implementation Steps

### Phase 1: MVP Recording (Week 1-2)
1. Set up Expo Camera permissions
2. Build VideoRecorder component with front camera
3. Implement local video recording and preview
4. Add timer and duration limits
5. Set up cloud storage (S3/GCS/Azure)
6. Build upload functionality with progress

### Phase 2: Backend & Storage (Week 3-4)
7. Create database tables for check-ins
8. Build REST API endpoints for CRUD
9. Implement video transcoding (optional)
10. Generate thumbnails from first frame
11. Set up CDN for video delivery
12. Add video compression before upload

### Phase 3: Feed & Playback (Week 5-6)
13. Build check-ins feed screen
14. Implement CheckinCard component
15. Create video player screen
16. Add playback speed controls
17. Implement view tracking
18. Build reactions system

### Phase 4: Advanced Features (Week 7-8)
19. Add video transcription (AWS Transcribe/Google Speech-to-Text)
20. Build transcript view with seek
21. Implement video responses
22. Add filter and search
23. Create analytics dashboard
24. Optimize video quality and size

---

## Cost Optimization

### Video Storage
- Use aggressive compression (H.264, bitrate optimization)
- Delete old check-ins after 90 days (configurable)
- Use lifecycle policies to move to cheaper storage (Glacier/Archive)
- Implement video quality tiers (360p, 480p, 720p)

### Transcoding
- Only transcode if uploaded quality is too high
- Use serverless functions (Lambda) for on-demand transcoding
- Cache transcoded versions

### CDN
- Set appropriate cache headers
- Use edge locations close to users
- Implement lazy loading for video list

---

## Best Practices

### UX
- Show upload progress prominently
- Allow background upload continuation
- Provide templates/prompts for each check-in type
- Enable playback speed (1.5x, 2x) for efficiency
- Auto-pause when user switches apps

### Performance
- Compress videos client-side before upload
- Use progressive upload (chunks)
- Preload thumbnails in feed
- Lazy load video player
- Implement video streaming (HLS/DASH) for large files

### Privacy & Security
- Implement access controls (team-only, public, private)
- Add video expiration dates
- Encrypt videos at rest and in transit
- Allow users to delete their check-ins
- Provide download options for important updates

---

## Monitoring

Track these metrics:
- Upload success rate
- Average upload time
- Video watch completion rate
- Most active check-in types
- Engagement (views, reactions, responses)
- Storage costs per user

---

**Next Steps**: Decide on cloud storage provider and set up initial infrastructure for video handling.
