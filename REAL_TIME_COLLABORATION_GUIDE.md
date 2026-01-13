# Real-Time Collaboration Architecture
## Phase 3 - CentaurOS

**Date**: 2026-01-13
**Status**: Architecture & Implementation Guide
**Backend Required**: WebSocket server, Database with real-time capabilities

---

## Overview

Real-time collaboration enables multiple team members to work simultaneously on work plans, OKRs, and documents with live updates, presence indicators, and commenting systems.

---

## Core Features

### 1. Live Editing (Collaborative Documents)
- Multiple users can edit the same work plan simultaneously
- Changes sync in real-time across all connected clients
- Conflict resolution with operational transformation (OT) or CRDT
- Visual indicators showing who is editing what

### 2. Presence System
- See who is currently viewing/editing a document
- User avatars with online status
- "Currently typing..." indicators
- Last seen timestamps

### 3. Comments & Mentions
- Inline comments on specific tasks or sections
- @mention team members for notifications
- Thread-based discussions
- Resolve/unresolve comment threads

### 4. Activity Feed
- Real-time updates on document changes
- "John updated Task 3" notifications
- Live toast notifications for relevant changes
- Activity history log

---

## Technical Architecture

### Backend Requirements

#### WebSocket Server
```typescript
// Example with Socket.IO
import { Server } from 'socket.io';

const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS,
    credentials: true,
  },
});

// Room-based architecture
io.on('connection', (socket) => {
  socket.on('join-document', ({ documentId, userId }) => {
    socket.join(`doc:${documentId}`);
    // Broadcast presence
    socket.to(`doc:${documentId}`).emit('user-joined', { userId });
  });

  socket.on('document-change', ({ documentId, changes, userId }) => {
    // Broadcast changes to all users in the room except sender
    socket.to(`doc:${documentId}`).emit('remote-changes', { changes, userId });
  });

  socket.on('cursor-move', ({ documentId, position, userId }) => {
    socket.to(`doc:${documentId}`).emit('remote-cursor', { position, userId });
  });

  socket.on('typing-start', ({ documentId, userId }) => {
    socket.to(`doc:${documentId}`).emit('user-typing', { userId, isTyping: true });
  });
});
```

#### Database Schema
```sql
-- Comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY,
  document_id UUID NOT NULL,
  document_type VARCHAR(50) NOT NULL, -- 'work_plan', 'okr', 'report'
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  target_field VARCHAR(100), -- e.g., 'task_3_description'
  parent_comment_id UUID, -- for threaded replies
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Presence table (for tracking active users)
CREATE TABLE presence (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  document_id UUID NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'viewing', -- 'viewing', 'editing'
  last_seen TIMESTAMP DEFAULT NOW(),
  cursor_position JSONB, -- { field: 'task_3', position: 42 }
  UNIQUE(user_id, document_id)
);

-- Activity log
CREATE TABLE activity_log (
  id UUID PRIMARY KEY,
  document_id UUID NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  user_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted', 'commented'
  field_changed VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Frontend Implementation

### 1. WebSocket Client Setup

```typescript
// src/lib/websocket.ts
import io, { Socket } from 'socket.io-client';
import { create } from 'zustand';

interface CollaborationState {
  socket: Socket | null;
  connectedUsers: Map<string, { id: string; name: string; avatar?: string }>;
  activeEditors: Set<string>; // user IDs currently editing
  remoteCursors: Map<string, { field: string; position: number }>;
  comments: Comment[];

  connect: (userId: string, token: string) => void;
  disconnect: () => void;
  joinDocument: (documentId: string, documentType: string) => void;
  leaveDocument: (documentId: string) => void;
  sendChanges: (documentId: string, changes: any) => void;
  addComment: (documentId: string, comment: Partial<Comment>) => void;
}

export const useCollaboration = create<CollaborationState>((set, get) => ({
  socket: null,
  connectedUsers: new Map(),
  activeEditors: new Set(),
  remoteCursors: new Map(),
  comments: [],

  connect: (userId: string, token: string) => {
    const socket = io(process.env.EXPO_PUBLIC_WS_URL!, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    socket.on('user-joined', ({ userId: joinedUserId, userData }) => {
      set((state) => {
        const newUsers = new Map(state.connectedUsers);
        newUsers.set(joinedUserId, userData);
        return { connectedUsers: newUsers };
      });
    });

    socket.on('user-left', ({ userId: leftUserId }) => {
      set((state) => {
        const newUsers = new Map(state.connectedUsers);
        newUsers.delete(leftUserId);
        return { connectedUsers: newUsers };
      });
    });

    socket.on('remote-changes', ({ changes, userId: editorId }) => {
      // Apply remote changes to local state
      // This is where OT/CRDT logic would be applied
    });

    socket.on('user-typing', ({ userId: typingUserId, isTyping }) => {
      set((state) => {
        const newEditors = new Set(state.activeEditors);
        if (isTyping) {
          newEditors.add(typingUserId);
        } else {
          newEditors.delete(typingUserId);
        }
        return { activeEditors: newEditors };
      });
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, connectedUsers: new Map(), activeEditors: new Set() });
    }
  },

  joinDocument: (documentId: string, documentType: string) => {
    const { socket } = get();
    if (socket) {
      socket.emit('join-document', { documentId, documentType });
    }
  },

  leaveDocument: (documentId: string) => {
    const { socket } = get();
    if (socket) {
      socket.emit('leave-document', { documentId });
    }
  },

  sendChanges: (documentId: string, changes: any) => {
    const { socket } = get();
    if (socket) {
      socket.emit('document-change', { documentId, changes });
    }
  },

  addComment: (documentId: string, comment: Partial<Comment>) => {
    const { socket } = get();
    if (socket) {
      socket.emit('add-comment', { documentId, comment });
    }
  },
}));
```

### 2. Presence Indicators Component

```typescript
// src/components/PresenceIndicators.tsx
import { View, Text } from 'react-native';
import { useCollaboration } from '@/lib/websocket';

export function PresenceIndicators() {
  const { connectedUsers, activeEditors } = useCollaboration();

  if (connectedUsers.size === 0) return null;

  return (
    <View className="flex-row items-center gap-2">
      {Array.from(connectedUsers.values()).map((user, idx) => {
        const isEditing = activeEditors.has(user.id);
        const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];
        const bgColor = colors[idx % colors.length];

        return (
          <View key={user.id} className="relative">
            <View
              className="w-8 h-8 rounded-full items-center justify-center border-2 border-white dark:border-slate-950"
              style={{ backgroundColor: bgColor }}
            >
              <Text className="text-white text-xs font-bold">
                {user.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            {isEditing && (
              <View className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border border-white dark:border-slate-950" />
            )}
          </View>
        );
      })}
      {connectedUsers.size > 3 && (
        <View className="w-8 h-8 rounded-full items-center justify-center bg-gray-300 dark:bg-slate-700">
          <Text className="text-gray-700 dark:text-slate-300 text-xs font-bold">
            +{connectedUsers.size - 3}
          </Text>
        </View>
      )}
    </View>
  );
}
```

### 3. Comments System Component

```typescript
// src/components/CommentsPanel.tsx
import { View, Text, TextInput, ScrollView } from 'react-native';
import { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react-native';
import { HapticPressable } from './HapticPressable';
import { useCollaboration } from '@/lib/websocket';
import { format } from 'date-fns';

interface CommentsPanelProps {
  documentId: string;
  targetField?: string;
}

export function CommentsPanel({ documentId, targetField }: CommentsPanelProps) {
  const { comments, addComment } = useCollaboration();
  const [newComment, setNewComment] = useState('');

  const filteredComments = targetField
    ? comments.filter((c) => c.target_field === targetField)
    : comments;

  const handleSendComment = () => {
    if (newComment.trim()) {
      addComment(documentId, {
        content: newComment,
        target_field: targetField,
      });
      setNewComment('');
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
      <View className="p-4 border-b border-gray-300 dark:border-slate-800">
        <View className="flex-row items-center gap-2">
          <MessageSquare size={20} color="#3b82f6" />
          <Text className="text-gray-900 dark:text-white text-lg font-bold">Comments</Text>
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        {filteredComments.length === 0 ? (
          <Text className="text-gray-500 dark:text-slate-500 text-center mt-8">
            No comments yet. Be the first to comment!
          </Text>
        ) : (
          filteredComments.map((comment) => (
            <View
              key={comment.id}
              className="bg-gray-100 dark:bg-slate-900 rounded-xl p-3 mb-3 border border-gray-300 dark:border-slate-800"
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-gray-900 dark:text-white font-bold text-sm">
                  {comment.userName}
                </Text>
                <Text className="text-gray-500 dark:text-slate-500 text-xs">
                  {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                </Text>
              </View>
              <Text className="text-gray-700 dark:text-slate-300 text-sm leading-6">
                {comment.content}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      <View className="p-4 border-t border-gray-300 dark:border-slate-800">
        <View className="flex-row items-center gap-2">
          <TextInput
            value={newComment}
            onChangeText={setNewComment}
            placeholder="Add a comment..."
            placeholderTextColor="#94a3b8"
            multiline
            className="flex-1 bg-gray-100 dark:bg-slate-900 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
          />
          <HapticPressable
            onPress={handleSendComment}
            disabled={!newComment.trim()}
            className={`w-12 h-12 rounded-xl items-center justify-center ${
              newComment.trim() ? 'bg-blue-500' : 'bg-gray-300 dark:bg-slate-800'
            }`}
          >
            <Send size={20} color={newComment.trim() ? '#ffffff' : '#94a3b8'} />
          </HapticPressable>
        </View>
      </View>
    </View>
  );
}
```

### 4. Activity Feed Component

```typescript
// src/components/ActivityFeed.tsx
import { View, Text, ScrollView } from 'react-native';
import { useCollaboration } from '@/lib/websocket';
import { formatDistanceToNow } from 'date-fns';
import { FileEdit, MessageSquare, UserPlus, Trash2 } from 'lucide-react-native';

export function ActivityFeed({ documentId }: { documentId: string }) {
  const { activityLog } = useCollaboration();

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'updated':
        return FileEdit;
      case 'commented':
        return MessageSquare;
      case 'created':
        return UserPlus;
      case 'deleted':
        return Trash2;
      default:
        return FileEdit;
    }
  };

  return (
    <View className="bg-white dark:bg-slate-950 rounded-2xl border border-gray-300 dark:border-slate-800 p-4">
      <Text className="text-gray-900 dark:text-white font-bold text-lg mb-3">
        Recent Activity
      </Text>
      <ScrollView className="max-h-64">
        {activityLog.map((activity) => {
          const Icon = getActionIcon(activity.action);
          return (
            <View key={activity.id} className="flex-row items-start gap-3 mb-3">
              <View className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center">
                <Icon size={14} color="#3b82f6" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 dark:text-white text-sm">
                  <Text className="font-bold">{activity.userName}</Text> {activity.action}{' '}
                  {activity.field_changed}
                </Text>
                <Text className="text-gray-500 dark:text-slate-500 text-xs">
                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
```

---

## Implementation Steps

### Phase 1: Backend Setup (Week 1-2)
1. Set up WebSocket server with Socket.IO
2. Implement authentication and room management
3. Create database tables for comments, presence, activity
4. Build REST API endpoints for comments CRUD
5. Implement presence tracking logic
6. Set up activity logging

### Phase 2: Frontend Integration (Week 3-4)
7. Create WebSocket client wrapper
8. Build Zustand store for collaboration state
9. Implement PresenceIndicators component
10. Build CommentsPanel component
11. Create ActivityFeed component
12. Add real-time toast notifications

### Phase 3: Live Editing (Week 5-6)
13. Implement operational transformation or CRDT
14. Add conflict resolution logic
15. Build cursor tracking system
16. Implement "typing..." indicators
17. Add document locking for critical sections

### Phase 4: Polish & Testing (Week 7-8)
18. Optimize WebSocket message efficiency
19. Add offline support with queue
20. Implement reconnection logic
21. Load testing for concurrent users
22. Add analytics for collaboration metrics

---

## Best Practices

### Performance
- Debounce text input changes (300ms) before sending
- Batch multiple small changes into single message
- Use binary protocols for large documents
- Implement message compression

### UX
- Show presence immediately on connection
- Fade out inactive users after 5 minutes
- Highlight sections being edited by others
- Use color-coding for different users
- Toast notifications for important changes only

### Security
- Validate all WebSocket messages server-side
- Rate limit messages per connection
- Authenticate WebSocket connections with JWT
- Implement permission checks for document access
- Sanitize all user-generated content

---

## Testing Strategy

```typescript
// Example test for WebSocket connection
describe('Collaboration System', () => {
  it('should connect multiple users to same document', async () => {
    const user1 = await connectUser('user1', 'token1');
    const user2 = await connectUser('user2', 'token2');

    await user1.joinDocument('doc123');
    await user2.joinDocument('doc123');

    expect(user1.connectedUsers.size).toBe(2);
    expect(user2.connectedUsers.size).toBe(2);
  });

  it('should sync changes between users', async () => {
    const user1 = await connectUser('user1', 'token1');
    const user2 = await connectUser('user2', 'token2');

    await user1.joinDocument('doc123');
    await user2.joinDocument('doc123');

    user1.sendChanges('doc123', { field: 'title', value: 'New Title' });

    // Wait for WebSocket propagation
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(user2.getDocumentState('doc123').title).toBe('New Title');
  });
});
```

---

## Monitoring & Analytics

Track these metrics:
- Concurrent active users per document
- Average message latency
- WebSocket connection uptime
- Comments per document
- Edit conflicts encountered
- User engagement with collaboration features

---

**Next Steps**: Review backend requirements and decide on WebSocket infrastructure (self-hosted vs. managed service like Pusher/Ably).
