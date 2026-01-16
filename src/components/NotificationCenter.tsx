import { View, Text, ScrollView, Modal, Pressable } from 'react-native';
import { X, Bell, CheckCheck, Trash2 } from 'lucide-react-native';
import { useNotificationStore, type Notification as NotificationType } from '@/lib/state/notification-store';
import { useCurrentWorkspace } from '@/lib/state/app-store';
import { useTheme } from '@/lib/ThemeContext';
import { useRouter } from 'expo-router';

interface NotificationCenterProps {
  visible: boolean;
  onClose: () => void;
}

export function NotificationCenter({ visible, onClose }: NotificationCenterProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const router = useRouter();
  const currentWorkspace = useCurrentWorkspace();

  const notifications = useNotificationStore((s) =>
    currentWorkspace ? s.getNotificationsByWorkspace(currentWorkspace.id) : []
  );
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const deleteNotification = useNotificationStore((s) => s.deleteNotification);
  const clearAll = useNotificationStore((s) => s.clearAll);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationPress = (notification: NotificationType) => {
    markAsRead(notification.id);
    if (notification.actionRoute) {
      onClose();
      router.push(notification.actionRoute as any);
    }
  };

  const handleMarkAllRead = () => {
    if (currentWorkspace) {
      markAllAsRead(currentWorkspace.id);
    }
  };

  const handleClearAll = () => {
    if (currentWorkspace) {
      clearAll(currentWorkspace.id);
    }
  };

  const getNotificationIcon = (type: string) => {
    const iconColor = isDark ? '#94a3b8' : '#64748b';
    switch (type) {
      case 'approval':
        return '🔔';
      case 'deadline':
        return '⏰';
      case 'capacity':
        return '⚠️';
      case 'budget':
        return '💰';
      case 'assignment':
        return '📋';
      case 'message':
        return '💬';
      case 'achievement':
        return '🏆';
      default:
        return '📬';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/50">
        <View className={`flex-1 mt-16 ${isDark ? 'bg-slate-950' : 'bg-white'} rounded-t-3xl`}>
          {/* Header */}
          <View className={`flex-row items-center justify-between px-5 py-4 border-b ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
            <View className="flex-1">
              <Text className={`${isDark ? 'text-white' : 'text-gray-900'} text-xl font-bold`}>
                Notifications
              </Text>
              {unreadCount > 0 && (
                <Text className={`${isDark ? 'text-slate-400' : 'text-gray-600'} text-sm`}>
                  {unreadCount} unread
                </Text>
              )}
            </View>

            {/* Actions */}
            <View className="flex-row items-center gap-3">
              {unreadCount > 0 && (
                <Pressable
                  onPress={handleMarkAllRead}
                  className={`px-3 py-2 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-gray-100'} active:opacity-70`}
                >
                  <CheckCheck size={18} color={isDark ? '#94a3b8' : '#64748b'} />
                </Pressable>
              )}
              <Pressable
                onPress={onClose}
                className="w-9 h-9 rounded-full items-center justify-center"
                style={{ backgroundColor: isDark ? '#1e293b' : '#f3f4f6' }}
              >
                <X size={20} color={isDark ? '#94a3b8' : '#64748b'} />
              </Pressable>
            </View>
          </View>

          {/* Notifications List */}
          <ScrollView className="flex-1 px-5 py-4">
            {notifications.length === 0 ? (
              <View className="items-center py-16">
                <Bell size={64} color={isDark ? '#475569' : '#cbd5e1'} />
                <Text className={`${isDark ? 'text-white' : 'text-gray-900'} font-bold text-lg mt-4`}>
                  All Caught Up!
                </Text>
                <Text className={`${isDark ? 'text-slate-400' : 'text-gray-600'} text-center mt-2`}>
                  You have no notifications at the moment
                </Text>
              </View>
            ) : (
              <>
                {notifications.map((notification) => (
                  <Pressable
                    key={notification.id}
                    onPress={() => handleNotificationPress(notification)}
                    className={`rounded-xl p-4 mb-3 border ${
                      notification.read
                        ? isDark
                          ? 'bg-slate-900 border-slate-800'
                          : 'bg-gray-50 border-gray-200'
                        : isDark
                        ? 'bg-blue-900/20 border-blue-800'
                        : 'bg-blue-50 border-blue-200'
                    } active:opacity-70`}
                  >
                    <View className="flex-row items-start">
                      {/* Icon */}
                      <Text className="text-2xl mr-3">{getNotificationIcon(notification.type)}</Text>

                      {/* Content */}
                      <View className="flex-1">
                        <View className="flex-row items-start justify-between mb-1">
                          <Text
                            className={`${
                              isDark ? 'text-white' : 'text-gray-900'
                            } font-semibold flex-1`}
                          >
                            {notification.title}
                          </Text>
                          {!notification.read && (
                            <View className="w-2 h-2 rounded-full bg-blue-500 ml-2 mt-1" />
                          )}
                        </View>
                        <Text
                          className={`${
                            isDark ? 'text-slate-400' : 'text-gray-600'
                          } text-sm mb-2`}
                        >
                          {notification.message}
                        </Text>
                        <View className="flex-row items-center justify-between">
                          <Text
                            className={`${
                              isDark ? 'text-slate-500' : 'text-gray-500'
                            } text-xs`}
                          >
                            {new Date(notification.timestamp).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </Text>
                          {notification.actionLabel && (
                            <Text className="text-blue-600 dark:text-blue-400 text-xs font-semibold">
                              {notification.actionLabel} →
                            </Text>
                          )}
                        </View>
                      </View>

                      {/* Delete */}
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="ml-2 p-2 active:opacity-70"
                      >
                        <Trash2 size={16} color={isDark ? '#64748b' : '#9ca3af'} />
                      </Pressable>
                    </View>
                  </Pressable>
                ))}

                {notifications.length > 0 && (
                  <Pressable
                    onPress={handleClearAll}
                    className={`py-3 rounded-xl border ${
                      isDark
                        ? 'border-slate-800 bg-slate-900'
                        : 'border-gray-200 bg-gray-50'
                    } active:opacity-70 mb-8`}
                  >
                    <Text
                      className={`${
                        isDark ? 'text-slate-400' : 'text-gray-600'
                      } text-center font-medium`}
                    >
                      Clear All Notifications
                    </Text>
                  </Pressable>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
