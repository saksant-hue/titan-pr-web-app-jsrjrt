
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../styles/commonStyles';
import { dataService } from '../../services/dataService';
import { User, NotificationData } from '../../types';
import Icon from '../../components/Icon';
import { router } from 'expo-router';

export default function Notifications() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    const user = dataService.getCurrentUser();
    const userNotifications = dataService.getNotificationsForUser();
    
    setCurrentUser(user);
    setNotifications(userNotifications);
    
    console.log('Notifications loaded for user:', user?.name, 'Count:', userNotifications.length);
  };

  const handleNotificationPress = (notification: NotificationData) => {
    // Mark as read
    dataService.markNotificationAsRead(notification.id);
    
    // Navigate to PR detail
    router.push(`/pr/${notification.prId}`);
    
    // Reload notifications to update read status
    loadNotifications();
  };

  const getNotificationIcon = (type: NotificationData['type']) => {
    switch (type) {
      case 'PR_SUBMITTED':
        return 'document-text';
      case 'PR_APPROVED':
        return 'checkmark-circle';
      case 'PR_REJECTED':
        return 'close-circle';
      case 'PR_PENDING_APPROVAL':
        return 'time';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: NotificationData['type']) => {
    switch (type) {
      case 'PR_SUBMITTED':
        return colors.primary;
      case 'PR_APPROVED':
        return colors.success;
      case 'PR_REJECTED':
        return colors.error;
      case 'PR_PENDING_APPROVAL':
        return colors.warning;
      default:
        return colors.textSecondary;
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="notifications-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>No notifications yet</Text>
            <Text style={styles.emptyStateSubtext}>
              You'll receive notifications about your purchase requests here
            </Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                !notification.read && styles.unreadNotification,
              ]}
              onPress={() => handleNotificationPress(notification)}
            >
              <View style={styles.notificationIcon}>
                <Icon
                  name={getNotificationIcon(notification.type)}
                  size={24}
                  color={getNotificationColor(notification.type)}
                />
              </View>
              
              <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                  <Text style={[
                    styles.notificationTitle,
                    !notification.read && styles.unreadText,
                  ]}>
                    {notification.title}
                  </Text>
                  <Text style={styles.notificationTime}>
                    {formatDate(notification.createdAt)}
                  </Text>
                </View>
                
                <Text style={styles.notificationMessage}>
                  {notification.message}
                </Text>
                
                <Text style={styles.notificationPR}>
                  {notification.prNumber}
                </Text>
              </View>
              
              {!notification.read && (
                <View style={styles.unreadDot} />
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: colors.error,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.background,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  notificationCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'flex-start',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  unreadNotification: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.primary,
    borderWidth: 2,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  unreadText: {
    fontWeight: 'bold',
  },
  notificationTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  notificationMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  notificationPR: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 8,
    marginTop: 4,
  },
});
