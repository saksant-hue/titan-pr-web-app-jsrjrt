
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, commonStyles } from '../../styles/commonStyles';
import { dataService } from '../../services/dataService';
import { User, DashboardMetrics, PurchaseRequest } from '../../types';
import Icon from '../../components/Icon';
import { router } from 'expo-router';

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentPRs, setRecentPRs] = useState<PurchaseRequest[]>([]);
  const [showUserSwitcher, setShowUserSwitcher] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    const user = dataService.getCurrentUser();
    const dashboardMetrics = dataService.getDashboardMetrics();
    const userPRs = dataService.getPRsForUser();
    
    setCurrentUser(user);
    setMetrics(dashboardMetrics);
    setRecentPRs(userPRs.slice(0, 5)); // Show only recent 5 PRs
    
    console.log('Dashboard loaded for user:', user?.name, user?.role);
  };

  const handleUserSwitch = (userId: string) => {
    dataService.setCurrentUser(userId);
    setShowUserSwitcher(false);
    loadDashboardData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return colors.success;
      case 'Rejected':
        return colors.error;
      case 'Pending':
        return colors.warning;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    return {
      backgroundColor: getStatusColor(status),
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    };
  };

  if (!currentUser || !metrics) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>TITAN CAPITAL GROUP</Text>
            <Text style={styles.subtitle}>Purchase Request System</Text>
          </View>
          <TouchableOpacity
            style={styles.userSwitcher}
            onPress={() => setShowUserSwitcher(!showUserSwitcher)}
          >
            <Icon name="person-circle" size={32} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* User Switcher (Demo) */}
        {showUserSwitcher && (
          <View style={styles.userSwitcherPanel}>
            <Text style={styles.userSwitcherTitle}>Switch User (Demo)</Text>
            {dataService.getAllUsers().map((user) => (
              <TouchableOpacity
                key={user.id}
                style={[
                  styles.userOption,
                  currentUser.id === user.id && styles.activeUserOption,
                ]}
                onPress={() => handleUserSwitch(user.id)}
              >
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userRole}>{user.role} - {user.department}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome back, {currentUser.name}</Text>
          <Text style={styles.roleText}>{currentUser.position} • {currentUser.role}</Text>
        </View>

        {/* Metrics Cards */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <Icon name="document-text" size={24} color={colors.primary} />
            <Text style={styles.metricNumber}>{metrics.myPRs}</Text>
            <Text style={styles.metricLabel}>My PRs</Text>
          </View>
          
          <View style={styles.metricCard}>
            <Icon name="time" size={24} color={colors.warning} />
            <Text style={styles.metricNumber}>{metrics.pendingApprovals}</Text>
            <Text style={styles.metricLabel}>Pending</Text>
          </View>
          
          <View style={styles.metricCard}>
            <Icon name="checkmark-circle" size={24} color={colors.success} />
            <Text style={styles.metricNumber}>{metrics.approvedPRs}</Text>
            <Text style={styles.metricLabel}>Approved</Text>
          </View>
          
          <View style={styles.metricCard}>
            <Icon name="cash" size={24} color={colors.accent} />
            <Text style={styles.metricNumber}>${metrics.totalValue.toLocaleString()}</Text>
            <Text style={styles.metricLabel}>Total Value</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/create')}
            >
              <Icon name="add-circle" size={24} color={colors.background} />
              <Text style={styles.actionButtonText}>Create PR</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => router.push('/(tabs)/prs')}
            >
              <Icon name="list" size={24} color={colors.primary} />
              <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>View All PRs</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent PRs */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Purchase Requests</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/prs')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {recentPRs.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="document-text-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyStateText}>No purchase requests yet</Text>
              <Text style={styles.emptyStateSubtext}>Create your first PR to get started</Text>
            </View>
          ) : (
            recentPRs.map((pr) => (
              <TouchableOpacity
                key={pr.id}
                style={styles.prCard}
                onPress={() => router.push(`/pr/${pr.id}`)}
              >
                <View style={styles.prCardHeader}>
                  <Text style={styles.prNumber}>{pr.prNumber}</Text>
                  <View style={getStatusBadgeStyle(pr.status)}>
                    <Text style={styles.statusText}>{pr.status}</Text>
                  </View>
                </View>
                <Text style={styles.prAmount}>${pr.totalAmount.toFixed(2)}</Text>
                <Text style={styles.prDate}>
                  {pr.createdAt.toLocaleDateString()} • {pr.items.length} items
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  userSwitcher: {
    padding: 8,
  },
  userSwitcherPanel: {
    backgroundColor: colors.backgroundAlt,
    margin: 20,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userSwitcherTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  userOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  activeUserOption: {
    backgroundColor: colors.primary,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  userRole: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  roleText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  metricsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  metricNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  quickActions: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  secondaryButtonText: {
    color: colors.primary,
  },
  recentSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  prCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  prCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  prNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.background,
  },
  prAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  prDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
