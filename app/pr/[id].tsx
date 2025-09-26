
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { colors } from '../../styles/commonStyles';
import { dataService } from '../../services/dataService';
import { User, PurchaseRequest, PRItem, Approval, AuditLog } from '../../types';
import Icon from '../../components/Icon';

export default function PRDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pr, setPR] = useState<PurchaseRequest | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [approvalComment, setApprovalComment] = useState('');

  useEffect(() => {
    loadPRDetail();
  }, [id]);

  const loadPRDetail = () => {
    const user = dataService.getCurrentUser();
    const purchaseRequest = dataService.getPRById(id);
    
    setCurrentUser(user);
    setPR(purchaseRequest);
    
    console.log('PR Detail loaded:', purchaseRequest?.prNumber);
  };

  const canApprove = (): boolean => {
    if (!currentUser || !pr || pr.status !== 'Pending') return false;
    
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

  const handleApprovalAction = (action: 'approve' | 'reject') => {
    setApprovalAction(action);
    setApprovalComment('');
    setShowApprovalModal(true);
  };

  const submitApproval = () => {
    if (!pr) return;

    const success = approvalAction === 'approve' 
      ? dataService.approvePR(pr.id, approvalComment)
      : dataService.rejectPR(pr.id, approvalComment);

    if (success) {
      setShowApprovalModal(false);
      loadPRDetail(); // Reload to get updated data
      
      Alert.alert(
        'Success',
        `Purchase Request ${pr.prNumber} has been ${approvalAction}d successfully!`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Optionally navigate back to PR list
            },
          },
        ]
      );
    } else {
      Alert.alert('Error', `Failed to ${approvalAction} the purchase request`);
    }
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
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!currentUser || !pr) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Purchase Request</Text>
        </View>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{pr.prNumber}</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Status and Basic Info */}
        <View style={styles.section}>
          <View style={styles.statusHeader}>
            <View style={getStatusBadgeStyle(pr.status)}>
              <Text style={styles.statusText}>{pr.status}</Text>
            </View>
            {pr.status === 'Pending' && (
              <Text style={styles.stepText}>Step {pr.currentStep} of {pr.totalSteps}</Text>
            )}
          </View>
          
          <Text style={styles.totalAmount}>${pr.totalAmount.toFixed(2)}</Text>
          <Text style={styles.createdDate}>Created on {formatDate(pr.createdAt)}</Text>
        </View>

        {/* Requester Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requester Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{pr.requesterName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Position:</Text>
              <Text style={styles.infoValue}>{pr.requesterPosition}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Department:</Text>
              <Text style={styles.infoValue}>{pr.requesterDepartment}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{pr.requesterEmail}</Text>
            </View>
          </View>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items ({pr.items.length})</Text>
          {pr.items.map((item, index) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.productName}</Text>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
                  <Text style={styles.priorityBadgeText}>{item.priority}</Text>
                </View>
              </View>
              <View style={styles.itemDetails}>
                <Text style={styles.itemDetail}>
                  Quantity: {item.quantity} {item.unit}
                </Text>
                <Text style={styles.itemDetail}>
                  Unit Price: ${item.estimatedPrice.toFixed(2)}
                </Text>
                <Text style={styles.itemTotal}>
                  Subtotal: ${(item.quantity * item.estimatedPrice).toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Approval Actions */}
        {canApprove() && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Approval Actions</Text>
            <View style={styles.approvalActions}>
              <TouchableOpacity
                style={styles.approveButton}
                onPress={() => handleApprovalAction('approve')}
              >
                <Icon name="checkmark-circle" size={20} color={colors.background} />
                <Text style={styles.approveButtonText}>Approve</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={() => handleApprovalAction('reject')}
              >
                <Icon name="close-circle" size={20} color={colors.background} />
                <Text style={styles.rejectButtonText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Approvals History */}
        {pr.approvals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Approval History</Text>
            {pr.approvals.map((approval) => (
              <View key={approval.id} style={styles.approvalCard}>
                <View style={styles.approvalHeader}>
                  <Text style={styles.approvalStep}>Step {approval.step}</Text>
                  <View style={[
                    styles.approvalDecision,
                    { backgroundColor: approval.decision === 'Approved' ? colors.success : colors.error }
                  ]}>
                    <Text style={styles.approvalDecisionText}>{approval.decision}</Text>
                  </View>
                </View>
                <Text style={styles.approvalApprover}>
                  {approval.approverName} • {formatDate(approval.decidedAt)}
                </Text>
                {approval.comment && (
                  <Text style={styles.approvalComment}>"{approval.comment}"</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Audit Log */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audit Trail</Text>
          {pr.auditLog.map((log) => (
            <View key={log.id} style={styles.auditCard}>
              <View style={styles.auditHeader}>
                <Text style={styles.auditAction}>{log.action}</Text>
                <Text style={styles.auditDate}>{formatDate(log.timestamp)}</Text>
              </View>
              <Text style={styles.auditUser}>{log.userName}</Text>
              {log.details && (
                <Text style={styles.auditDetails}>{log.details}</Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Approval Modal */}
      <Modal
        visible={showApprovalModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowApprovalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {approvalAction === 'approve' ? 'Approve' : 'Reject'} Purchase Request
            </Text>
            <Text style={styles.modalSubtitle}>
              {pr.prNumber} • ${pr.totalAmount.toFixed(2)}
            </Text>
            
            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>
                Comment {approvalAction === 'reject' ? '(Required)' : '(Optional)'}
              </Text>
              <TextInput
                style={styles.modalTextInput}
                value={approvalComment}
                onChangeText={setApprovalComment}
                placeholder={`Add a comment for your ${approvalAction}al...`}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowApprovalModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalConfirmButton,
                  { backgroundColor: approvalAction === 'approve' ? colors.success : colors.error }
                ]}
                onPress={submitApproval}
                disabled={approvalAction === 'reject' && !approvalComment.trim()}
              >
                <Text style={styles.modalConfirmButtonText}>
                  {approvalAction === 'approve' ? 'Approve' : 'Reject'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 50,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background,
  },
  stepText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  createdDate: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  itemCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.background,
  },
  itemDetails: {
    gap: 4,
  },
  itemDetail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 4,
  },
  approvalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  approveButton: {
    flex: 1,
    backgroundColor: colors.success,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  approveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: colors.error,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  approvalCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  approvalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  approvalStep: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  approvalDecision: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  approvalDecisionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.background,
  },
  approvalApprover: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  approvalComment: {
    fontSize: 14,
    color: colors.text,
    fontStyle: 'italic',
  },
  auditCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  auditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  auditAction: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  auditDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  auditUser: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  auditDetails: {
    fontSize: 12,
    color: colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  modalInputGroup: {
    marginBottom: 24,
  },
  modalInputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  modalTextInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.backgroundAlt,
    minHeight: 100,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  modalConfirmButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
});
