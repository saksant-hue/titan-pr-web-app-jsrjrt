
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
import { colors } from '../../styles/commonStyles';
import { dataService } from '../../services/dataService';
import { User } from '../../types';
import Icon from '../../components/Icon';

export default function Profile() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    department: '',
    position: '',
    role: 'Employee' as User['role'],
    status: 'Active' as User['status'],
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = () => {
    const user = dataService.getCurrentUser();
    const users = dataService.getAllUsers();
    
    setCurrentUser(user);
    setAllUsers(users);
    
    console.log('Profile loaded for user:', user?.name, user?.role);
  };

  const handleCreateUser = () => {
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.department.trim() || !newUser.position.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    try {
      dataService.createUser(newUser);
      setShowCreateUser(false);
      setNewUser({
        name: '',
        email: '',
        department: '',
        position: '',
        role: 'Employee',
        status: 'Active',
      });
      loadUserData();
      Alert.alert('Success', 'User created successfully');
    } catch (error) {
      console.error('Error creating user:', error);
      Alert.alert('Error', 'Failed to create user');
    }
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;

    try {
      dataService.updateUser(editingUser.id, editingUser);
      setEditingUser(null);
      loadUserData();
      Alert.alert('Success', 'User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      Alert.alert('Error', 'Failed to update user');
    }
  };

  const handleDeactivateUser = (user: User) => {
    Alert.alert(
      'Confirm Deactivation',
      `Are you sure you want to deactivate ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: () => {
            dataService.updateUser(user.id, { status: 'Inactive' });
            loadUserData();
          },
        },
      ]
    );
  };

  const getRoleColor = (role: User['role']) => {
    switch (role) {
      case 'Admin':
        return colors.error;
      case 'C Level':
        return colors.primary;
      case 'Supervisor':
        return colors.warning;
      case 'Employee':
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusColor = (status: User['status']) => {
    return status === 'Active' ? colors.success : colors.textSecondary;
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileIcon}>
            <Icon name="person" size={32} color={colors.primary} />
          </View>
          <Text style={styles.userName}>{currentUser.name}</Text>
          <Text style={styles.userRole}>{currentUser.position}</Text>
          <Text style={styles.userDepartment}>{currentUser.department}</Text>
        </View>

        {/* User Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{currentUser.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{currentUser.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Department:</Text>
              <Text style={styles.infoValue}>{currentUser.department}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Position:</Text>
              <Text style={styles.infoValue}>{currentUser.position}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Role:</Text>
              <View style={[styles.roleBadge, { backgroundColor: getRoleColor(currentUser.role) }]}>
                <Text style={styles.roleBadgeText}>{currentUser.role}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentUser.status) }]}>
                <Text style={styles.statusBadgeText}>{currentUser.status}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Admin Functions */}
        {currentUser.role === 'Admin' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin Functions</Text>
            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => setShowUserManagement(true)}
            >
              <Icon name="people" size={20} color={colors.background} />
              <Text style={styles.adminButtonText}>Manage Users</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Icon name="document-text" size={24} color={colors.primary} />
              <Text style={styles.statNumber}>
                {dataService.getPRsForUser().length}
              </Text>
              <Text style={styles.statLabel}>
                {currentUser.role === 'Employee' ? 'My PRs' : 'Total PRs'}
              </Text>
            </View>
            
            <View style={styles.statCard}>
              <Icon name="notifications" size={24} color={colors.warning} />
              <Text style={styles.statNumber}>
                {dataService.getNotificationsForUser().filter(n => !n.read).length}
              </Text>
              <Text style={styles.statLabel}>Unread</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* User Management Modal */}
      <Modal
        visible={showUserManagement}
        animationType="slide"
        onRequestClose={() => setShowUserManagement(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>User Management</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowUserManagement(false)}
            >
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.createUserButton}
              onPress={() => setShowCreateUser(true)}
            >
              <Icon name="person-add" size={20} color={colors.background} />
              <Text style={styles.createUserButtonText}>Create User</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.usersList}>
            {allUsers.map((user) => (
              <View key={user.id} style={styles.userCard}>
                <View style={styles.userCardHeader}>
                  <Text style={styles.userCardName}>{user.name}</Text>
                  <View style={styles.userCardBadges}>
                    <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) }]}>
                      <Text style={styles.roleBadgeText}>{user.role}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(user.status) }]}>
                      <Text style={styles.statusBadgeText}>{user.status}</Text>
                    </View>
                  </View>
                </View>
                
                <Text style={styles.userCardInfo}>
                  {user.position} • {user.department}
                </Text>
                <Text style={styles.userCardEmail}>{user.email}</Text>

                <View style={styles.userCardActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => setEditingUser(user)}
                  >
                    <Icon name="create" size={16} color={colors.primary} />
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  
                  {user.status === 'Active' && user.id !== currentUser.id && (
                    <TouchableOpacity
                      style={styles.deactivateButton}
                      onPress={() => handleDeactivateUser(user)}
                    >
                      <Icon name="person-remove" size={16} color={colors.error} />
                      <Text style={styles.deactivateButtonText}>Deactivate</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Create User Modal */}
      <Modal
        visible={showCreateUser}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateUser(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New User</Text>
            
            <ScrollView style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newUser.name}
                  onChangeText={(text) => setNewUser({ ...newUser, name: text })}
                  placeholder="Enter full name"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newUser.email}
                  onChangeText={(text) => setNewUser({ ...newUser, email: text })}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Department *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newUser.department}
                  onChangeText={(text) => setNewUser({ ...newUser, department: text })}
                  placeholder="Enter department"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Position *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newUser.position}
                  onChangeText={(text) => setNewUser({ ...newUser, position: text })}
                  placeholder="Enter position"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Role</Text>
                <View style={styles.roleSelector}>
                  {(['Admin', 'C Level', 'Supervisor', 'Employee'] as User['role'][]).map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.roleOption,
                        newUser.role === role && { backgroundColor: getRoleColor(role) },
                      ]}
                      onPress={() => setNewUser({ ...newUser, role })}
                    >
                      <Text
                        style={[
                          styles.roleOptionText,
                          newUser.role === role && styles.roleOptionTextActive,
                        ]}
                      >
                        {role}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFormActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowCreateUser(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleCreateUser}
              >
                <Text style={styles.modalConfirmButtonText}>Create User</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        visible={!!editingUser}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingUser(null)}
      >
        {editingUser && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit User</Text>
              
              <ScrollView style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Name *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editingUser.name}
                    onChangeText={(text) => setEditingUser({ ...editingUser, name: text })}
                    placeholder="Enter full name"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editingUser.email}
                    onChangeText={(text) => setEditingUser({ ...editingUser, email: text })}
                    placeholder="Enter email address"
                    keyboardType="email-address"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Department *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editingUser.department}
                    onChangeText={(text) => setEditingUser({ ...editingUser, department: text })}
                    placeholder="Enter department"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Position *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editingUser.position}
                    onChangeText={(text) => setEditingUser({ ...editingUser, position: text })}
                    placeholder="Enter position"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Role</Text>
                  <View style={styles.roleSelector}>
                    {(['Admin', 'C Level', 'Supervisor', 'Employee'] as User['role'][]).map((role) => (
                      <TouchableOpacity
                        key={role}
                        style={[
                          styles.roleOption,
                          editingUser.role === role && { backgroundColor: getRoleColor(role) },
                        ]}
                        onPress={() => setEditingUser({ ...editingUser, role })}
                      >
                        <Text
                          style={[
                            styles.roleOptionText,
                            editingUser.role === role && styles.roleOptionTextActive,
                          ]}
                        >
                          {role}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Status</Text>
                  <View style={styles.roleSelector}>
                    {(['Active', 'Inactive'] as User['status'][]).map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.roleOption,
                          editingUser.status === status && { backgroundColor: getStatusColor(status) },
                        ]}
                        onPress={() => setEditingUser({ ...editingUser, status })}
                      >
                        <Text
                          style={[
                            styles.roleOptionText,
                            editingUser.status === status && styles.roleOptionTextActive,
                          ]}
                        >
                          {status}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalFormActions}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setEditingUser(null)}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.modalConfirmButton}
                  onPress={handleUpdateUser}
                >
                  <Text style={styles.modalConfirmButtonText}>Update User</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>
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
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profileIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  userDepartment: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    alignItems: 'center',
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
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.background,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.background,
  },
  adminButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  adminButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: 8,
  },
  modalActions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  createUserButton: {
    backgroundColor: colors.success,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  createUserButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  usersList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  userCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  userCardBadges: {
    flexDirection: 'row',
    gap: 4,
  },
  userCardInfo: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  userCardEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  userCardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  deactivateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  deactivateButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.error,
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
    maxHeight: '80%',
  },
  formContainer: {
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.backgroundAlt,
  },
  roleSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleOptionText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  roleOptionTextActive: {
    color: colors.background,
    fontWeight: '600',
  },
  modalFormActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
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
    backgroundColor: colors.primary,
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
