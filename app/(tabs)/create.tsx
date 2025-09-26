
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../styles/commonStyles';
import { dataService } from '../../services/dataService';
import { User, PRItem } from '../../types';
import Icon from '../../components/Icon';
import { router } from 'expo-router';

interface PRItemForm extends Omit<PRItem, 'id' | 'prId'> {}

export default function CreatePR() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [items, setItems] = useState<PRItemForm[]>([
    {
      productName: '',
      quantity: 1,
      unit: 'pieces',
      estimatedPrice: 0,
      priority: 'Medium',
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const user = dataService.getCurrentUser();
    setCurrentUser(user);
    console.log('Create PR loaded for user:', user?.name);
  }, []);

  const addItem = () => {
    if (items.length < 5) {
      setItems([
        ...items,
        {
          productName: '',
          quantity: 1,
          unit: 'pieces',
          estimatedPrice: 0,
          priority: 'Medium',
        },
      ]);
    } else {
      Alert.alert('Limit Reached', 'Maximum 5 items allowed per PR');
    }
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof PRItemForm, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const getTotalAmount = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.estimatedPrice), 0);
  };

  const validateForm = (): boolean => {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.productName.trim()) {
        Alert.alert('Validation Error', `Product name is required for item ${i + 1}`);
        return false;
      }
      if (item.quantity <= 0) {
        Alert.alert('Validation Error', `Quantity must be greater than 0 for item ${i + 1}`);
        return false;
      }
      if (item.estimatedPrice < 0) {
        Alert.alert('Validation Error', `Price cannot be negative for item ${i + 1}`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      const newPR = dataService.createPR(items);
      if (newPR) {
        Alert.alert(
          'Success',
          `Purchase Request ${newPR.prNumber} has been submitted successfully!`,
          [
            {
              text: 'OK',
              onPress: () => {
                router.push('/(tabs)/prs');
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to create purchase request');
      }
    } catch (error) {
      console.error('Error creating PR:', error);
      Alert.alert('Error', 'An error occurred while creating the purchase request');
    } finally {
      setIsSubmitting(false);
    }
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

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Purchase Request</Text>
            <Text style={styles.subtitle}>Fill in the details below</Text>
          </View>

          {/* Requester Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Requester Information</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name:</Text>
                <Text style={styles.infoValue}>{currentUser.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Position:</Text>
                <Text style={styles.infoValue}>{currentUser.position}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Department:</Text>
                <Text style={styles.infoValue}>{currentUser.department}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{currentUser.email}</Text>
              </View>
            </View>
          </View>

          {/* Items Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Items ({items.length}/5)</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={addItem}
                disabled={items.length >= 5}
              >
                <Icon name="add" size={20} color={colors.background} />
                <Text style={styles.addButtonText}>Add Item</Text>
              </TouchableOpacity>
            </View>

            {items.map((item, index) => (
              <View key={index} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>Item {index + 1}</Text>
                  {items.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeItem(index)}
                    >
                      <Icon name="trash" size={16} color={colors.error} />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Product Name *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={item.productName}
                    onChangeText={(text) => updateItem(index, 'productName', text)}
                    placeholder="Enter product name"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Quantity *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={item.quantity.toString()}
                      onChangeText={(text) => updateItem(index, 'quantity', parseInt(text) || 0)}
                      placeholder="0"
                      keyboardType="numeric"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                    <Text style={styles.inputLabel}>Unit</Text>
                    <TextInput
                      style={styles.textInput}
                      value={item.unit}
                      onChangeText={(text) => updateItem(index, 'unit', text)}
                      placeholder="pieces"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Estimated Price *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={item.estimatedPrice.toString()}
                    onChangeText={(text) => updateItem(index, 'estimatedPrice', parseFloat(text) || 0)}
                    placeholder="0.00"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Priority</Text>
                  <View style={styles.priorityContainer}>
                    {['Low', 'Medium', 'High', 'Urgent'].map((priority) => (
                      <TouchableOpacity
                        key={priority}
                        style={[
                          styles.priorityButton,
                          item.priority === priority && {
                            backgroundColor: getPriorityColor(priority),
                          },
                        ]}
                        onPress={() => updateItem(index, 'priority', priority as any)}
                      >
                        <Text
                          style={[
                            styles.priorityText,
                            item.priority === priority && styles.priorityTextActive,
                          ]}
                        >
                          {priority}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.itemTotal}>
                  <Text style={styles.itemTotalText}>
                    Subtotal: ${(item.quantity * item.estimatedPrice).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Total Section */}
          <View style={styles.totalSection}>
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalAmount}>${getTotalAmount().toFixed(2)}</Text>
            </View>
          </View>

          {/* Submit Button */}
          <View style={styles.submitSection}>
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Submitting...' : 'Submit Purchase Request'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoid: {
    flex: 1,
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
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background,
  },
  itemCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  removeButton: {
    padding: 4,
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
    backgroundColor: colors.background,
  },
  row: {
    flexDirection: 'row',
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  priorityText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  priorityTextActive: {
    color: colors.background,
    fontWeight: '600',
  },
  itemTotal: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  itemTotalText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  totalSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  totalCard: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    color: colors.background,
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.background,
  },
  submitSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  submitButton: {
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.textSecondary,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.background,
  },
});
