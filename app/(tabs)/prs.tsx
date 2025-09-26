
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../styles/commonStyles';
import { dataService } from '../../services/dataService';
import { User, PurchaseRequest } from '../../types';
import Icon from '../../components/Icon';
import { router } from 'expo-router';

export default function PRList() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [prs, setPRs] = useState<PurchaseRequest[]>([]);
  const [filteredPRs, setFilteredPRs] = useState<PurchaseRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  useEffect(() => {
    loadPRs();
  }, []);

  useEffect(() => {
    filterPRs();
  }, [prs, searchQuery, statusFilter]);

  const loadPRs = () => {
    const user = dataService.getCurrentUser();
    const userPRs = dataService.getPRsForUser();
    
    setCurrentUser(user);
    setPRs(userPRs);
    
    console.log('PRs loaded for user:', user?.name, 'Count:', userPRs.length);
  };

  const filterPRs = () => {
    let filtered = [...prs];

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(pr =>
        pr.prNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pr.requesterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pr.requesterDepartment.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'All') {
      filtered = filtered.filter(pr => pr.status === statusFilter);
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    setFilteredPRs(filtered);
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return colors.error;
      case 'High':
        return colors.warning;
      case 'Medium':
        return colors.primary;
      case 'Low':
        return colors.textSecondary;
      default:
        return colors.primary;
    }
  };

  const getHighestPriority = (pr: PurchaseRequest) => {
    const priorities = ['Low', 'Medium', 'High', 'Urgent'];
    const highestPriority = pr.items.reduce((highest, item) => {
      const currentIndex = priorities.indexOf(item.priority);
      const highestIndex = priorities.indexOf(highest);
      return currentIndex > highestIndex ? item.priority : highest;
    }, 'Low');
    return highestPriority;
  };

  const canApprove = (pr: PurchaseRequest): boolean => {
    if (!currentUser || pr.status !== 'Pending') return false;
    
    switch (currentUser.role) {
      case 'Supervisor':
        return pr.currentStep === 1 && pr.requesterDepartment === currentUser.department;
      case 'C Level':
        return pr.currentStep === 2;
      case 'Admin':
        return true;
      default:
        return false;
    }
  };

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
        <Text style={styles.title}>Purchase Requests</Text>
        <Text style={styles.subtitle}>
          {currentUser.role === 'Employee' ? 'My PRs' : 
           currentUser.role === 'Admin' ? 'All PRs' : 'Department PRs'}
        </Text>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by PR number, requester, or department"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                statusFilter === status && styles.filterButtonActive,
              ]}
              onPress={() => setStatusFilter(status)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  statusFilter === status && styles.filterButtonTextActive,
                ]}
              >
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* PR List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {filteredPRs.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="document-text-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>
              {searchQuery || statusFilter !== 'All' ? 'No PRs match your filters' : 'No purchase requests found'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {currentUser.role === 'Employee' && !searchQuery && statusFilter === 'All'
                ? 'Create your first PR to get started'
                : 'Try adjusting your search or filters'}
            </Text>
          </View>
        ) : (
          filteredPRs.map((pr) => (
            <TouchableOpacity
              key={pr.id}
              style={styles.prCard}
              onPress={() => router.push(`/pr/${pr.id}`)}
            >
              <View style={styles.prCardHeader}>
                <View style={styles.prCardLeft}>
                  <Text style={styles.prNumber}>{pr.prNumber}</Text>
                  <Text style={styles.prRequester}>
                    {currentUser.role !== 'Employee' ? pr.requesterName : 'You'} • {pr.requesterDepartment}
                  </Text>
                </View>
                <View style={styles.prCardRight}>
                  <View style={getStatusBadgeStyle(pr.status)}>
                    <Text style={styles.statusText}>{pr.status}</Text>
                  </View>
                  {canApprove(pr) && (
                    <View style={styles.approvalBadge}>
                      <Text style={styles.approvalBadgeText}>Action Required</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.prCardBody}>
                <Text style={styles.prAmount}>${pr.totalAmount.toFixed(2)}</Text>
                <Text style={styles.prItems}>{pr.items.length} items</Text>
              </View>

              <View style={styles.prCardFooter}>
                <View style={styles.prCardFooterLeft}>
                  <Text style={styles.prDate}>
                    {pr.createdAt.toLocaleDateString()}
                  </Text>
                  <View style={styles.priorityIndicator}>
                    <View
                      style={[
                        styles.priorityDot,
                        { backgroundColor: getPriorityColor(getHighestPriority(pr)) },
                      ]}
                    />
                    <Text style={styles.priorityText}>{getHighestPriority(pr)} Priority</Text>
                  </View>
                </View>
                
                {pr.status === 'Pending' && (
                  <View style={styles.stepIndicator}>
                    <Text style={styles.stepText}>
                      Step {pr.currentStep} of {pr.totalSteps}
                    </Text>
                  </View>
                )}
              </View>
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
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  filterButtonTextActive: {
    color: colors.background,
    fontWeight: '600',
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  prCardLeft: {
    flex: 1,
  },
  prCardRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  prNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  prRequester: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.background,
  },
  approvalBadge: {
    backgroundColor: colors.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  approvalBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.background,
  },
  prCardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  prAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  prItems: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  prCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prCardFooterLeft: {
    flex: 1,
  },
  prDate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  priorityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  priorityText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  stepIndicator: {
    backgroundColor: colors.backgroundAlt,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
  },
});
