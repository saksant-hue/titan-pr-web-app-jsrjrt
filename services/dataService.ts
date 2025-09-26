
import { User, PurchaseRequest, PRItem, Approval, AuditLog, NotificationData, DashboardMetrics } from '../types';

class DataService {
  private users: User[] = [];
  private purchaseRequests: PurchaseRequest[] = [];
  private notifications: NotificationData[] = [];
  private currentUser: User | null = null;
  private prSequence: { [key: string]: number } = {};

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Initialize demo users
    this.users = [
      {
        id: '1',
        name: 'John Admin',
        email: 'admin@titancapital.com',
        department: 'IT',
        position: 'System Administrator',
        role: 'Admin',
        status: 'Active',
        createdAt: new Date(),
      },
      {
        id: '2',
        name: 'Sarah CEO',
        email: 'ceo@titancapital.com',
        department: 'Executive',
        position: 'Chief Executive Officer',
        role: 'C Level',
        status: 'Active',
        createdAt: new Date(),
      },
      {
        id: '3',
        name: 'Mike Supervisor',
        email: 'supervisor@titancapital.com',
        department: 'Operations',
        position: 'Operations Manager',
        role: 'Supervisor',
        status: 'Active',
        createdAt: new Date(),
      },
      {
        id: '4',
        name: 'Jane Employee',
        email: 'employee@titancapital.com',
        department: 'Operations',
        position: 'Operations Specialist',
        role: 'Employee',
        status: 'Active',
        createdAt: new Date(),
      },
    ];

    // Set default current user
    this.currentUser = this.users[3]; // Employee by default

    // Initialize some demo PRs
    this.initializeDemoPRs();
  }

  private initializeDemoPRs() {
    const demoPR: PurchaseRequest = {
      id: '1',
      prNumber: this.generatePRNumber(),
      requesterId: '4',
      requesterName: 'Jane Employee',
      requesterPosition: 'Operations Specialist',
      requesterDepartment: 'Operations',
      requesterEmail: 'employee@titancapital.com',
      status: 'Pending',
      currentStep: 1,
      totalSteps: 2,
      totalAmount: 2500,
      createdAt: new Date(Date.now() - 86400000), // Yesterday
      updatedAt: new Date(Date.now() - 86400000),
      items: [
        {
          id: '1',
          prId: '1',
          productName: 'Office Chairs',
          quantity: 5,
          unit: 'pieces',
          estimatedPrice: 300,
          priority: 'Medium',
        },
        {
          id: '2',
          prId: '1',
          productName: 'Standing Desks',
          quantity: 2,
          unit: 'pieces',
          estimatedPrice: 1000,
          priority: 'High',
        },
      ],
      approvals: [],
      auditLog: [
        {
          id: '1',
          prId: '1',
          action: 'PR Created',
          userId: '4',
          userName: 'Jane Employee',
          timestamp: new Date(Date.now() - 86400000),
          details: 'Purchase request submitted for approval',
        },
      ],
    };

    this.purchaseRequests.push(demoPR);
  }

  // User Management
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  setCurrentUser(userId: string): User | null {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      this.currentUser = user;
      console.log('Current user set to:', user.name, user.role);
    }
    return user || null;
  }

  getAllUsers(): User[] {
    return this.users;
  }

  createUser(userData: Omit<User, 'id' | 'createdAt'>): User {
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    this.users.push(newUser);
    return newUser;
  }

  updateUser(userId: string, userData: Partial<User>): User | null {
    const userIndex = this.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      this.users[userIndex] = { ...this.users[userIndex], ...userData };
      return this.users[userIndex];
    }
    return null;
  }

  // PR Management
  generatePRNumber(): string {
    const today = new Date();
    const dateKey = today.toISOString().split('T')[0].replace(/-/g, '');
    
    if (!this.prSequence[dateKey]) {
      this.prSequence[dateKey] = 0;
    }
    
    this.prSequence[dateKey]++;
    const sequence = this.prSequence[dateKey].toString().padStart(2, '0');
    
    return `PR-${dateKey}${sequence}`;
  }

  createPR(items: Omit<PRItem, 'id' | 'prId'>[]): PurchaseRequest | null {
    if (!this.currentUser) return null;

    const prId = Date.now().toString();
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.estimatedPrice), 0);

    const newPR: PurchaseRequest = {
      id: prId,
      prNumber: this.generatePRNumber(),
      requesterId: this.currentUser.id,
      requesterName: this.currentUser.name,
      requesterPosition: this.currentUser.position,
      requesterDepartment: this.currentUser.department,
      requesterEmail: this.currentUser.email,
      status: 'Pending',
      currentStep: 1,
      totalSteps: 2,
      totalAmount,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: items.map((item, index) => ({
        ...item,
        id: `${prId}-${index}`,
        prId,
      })),
      approvals: [],
      auditLog: [
        {
          id: `${prId}-audit-1`,
          prId,
          action: 'PR Created',
          userId: this.currentUser.id,
          userName: this.currentUser.name,
          timestamp: new Date(),
          details: 'Purchase request submitted for approval',
        },
      ],
    };

    this.purchaseRequests.push(newPR);
    this.createNotification(newPR, 'PR_SUBMITTED');
    return newPR;
  }

  getPRsForUser(userId?: string): PurchaseRequest[] {
    const user = userId ? this.users.find(u => u.id === userId) : this.currentUser;
    if (!user) return [];

    switch (user.role) {
      case 'Admin':
        return this.purchaseRequests;
      case 'Employee':
        return this.purchaseRequests.filter(pr => pr.requesterId === user.id);
      case 'Supervisor':
        return this.purchaseRequests.filter(pr => 
          pr.requesterDepartment === user.department || 
          (pr.status === 'Pending' && pr.currentStep === 1)
        );
      case 'C Level':
        return this.purchaseRequests.filter(pr => 
          pr.status === 'Pending' && pr.currentStep === 2
        );
      default:
        return [];
    }
  }

  getPRById(prId: string): PurchaseRequest | null {
    return this.purchaseRequests.find(pr => pr.id === prId) || null;
  }

  approvePR(prId: string, comment?: string): boolean {
    const pr = this.getPRById(prId);
    if (!pr || !this.currentUser) return false;

    const approval: Approval = {
      id: `${prId}-approval-${pr.currentStep}`,
      prId,
      step: pr.currentStep,
      approverId: this.currentUser.id,
      approverName: this.currentUser.name,
      decision: 'Approved',
      comment,
      decidedAt: new Date(),
    };

    pr.approvals.push(approval);

    const auditEntry: AuditLog = {
      id: `${prId}-audit-${Date.now()}`,
      prId,
      action: `Step ${pr.currentStep} Approved`,
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      timestamp: new Date(),
      details: comment || 'No comment provided',
    };

    pr.auditLog.push(auditEntry);

    if (pr.currentStep >= pr.totalSteps) {
      pr.status = 'Approved';
      this.createNotification(pr, 'PR_APPROVED');
    } else {
      pr.currentStep++;
      this.createNotification(pr, 'PR_PENDING_APPROVAL');
    }

    pr.updatedAt = new Date();
    return true;
  }

  rejectPR(prId: string, comment?: string): boolean {
    const pr = this.getPRById(prId);
    if (!pr || !this.currentUser) return false;

    const approval: Approval = {
      id: `${prId}-approval-${pr.currentStep}`,
      prId,
      step: pr.currentStep,
      approverId: this.currentUser.id,
      approverName: this.currentUser.name,
      decision: 'Rejected',
      comment,
      decidedAt: new Date(),
    };

    pr.approvals.push(approval);

    const auditEntry: AuditLog = {
      id: `${prId}-audit-${Date.now()}`,
      prId,
      action: `PR Rejected at Step ${pr.currentStep}`,
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      timestamp: new Date(),
      details: comment || 'No comment provided',
    };

    pr.auditLog.push(auditEntry);
    pr.status = 'Rejected';
    pr.updatedAt = new Date();

    this.createNotification(pr, 'PR_REJECTED');
    return true;
  }

  // Notifications
  private createNotification(pr: PurchaseRequest, type: NotificationData['type']) {
    const notification: NotificationData = {
      id: Date.now().toString(),
      userId: pr.requesterId,
      type,
      title: this.getNotificationTitle(type, pr.prNumber),
      message: this.getNotificationMessage(type, pr),
      prId: pr.id,
      prNumber: pr.prNumber,
      read: false,
      createdAt: new Date(),
    };

    this.notifications.push(notification);

    // Also notify admin
    const admin = this.users.find(u => u.role === 'Admin');
    if (admin && admin.id !== pr.requesterId) {
      const adminNotification: NotificationData = {
        ...notification,
        id: (Date.now() + 1).toString(),
        userId: admin.id,
      };
      this.notifications.push(adminNotification);
    }
  }

  private getNotificationTitle(type: NotificationData['type'], prNumber: string): string {
    switch (type) {
      case 'PR_SUBMITTED':
        return `${prNumber} Submitted`;
      case 'PR_APPROVED':
        return `${prNumber} Approved`;
      case 'PR_REJECTED':
        return `${prNumber} Rejected`;
      case 'PR_PENDING_APPROVAL':
        return `${prNumber} Pending Approval`;
      default:
        return `${prNumber} Update`;
    }
  }

  private getNotificationMessage(type: NotificationData['type'], pr: PurchaseRequest): string {
    switch (type) {
      case 'PR_SUBMITTED':
        return `Purchase request submitted by ${pr.requesterName} for $${pr.totalAmount.toFixed(2)}`;
      case 'PR_APPROVED':
        return `Purchase request has been fully approved`;
      case 'PR_REJECTED':
        return `Purchase request has been rejected`;
      case 'PR_PENDING_APPROVAL':
        return `Purchase request is pending approval at step ${pr.currentStep}`;
      default:
        return 'Purchase request updated';
    }
  }

  getNotificationsForUser(userId?: string): NotificationData[] {
    const user = userId ? this.users.find(u => u.id === userId) : this.currentUser;
    if (!user) return [];

    return this.notifications
      .filter(n => n.userId === user.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  markNotificationAsRead(notificationId: string): boolean {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      return true;
    }
    return false;
  }

  // Dashboard Metrics
  getDashboardMetrics(): DashboardMetrics {
    if (!this.currentUser) {
      return {
        totalPRs: 0,
        pendingApprovals: 0,
        approvedPRs: 0,
        rejectedPRs: 0,
        totalValue: 0,
        myPRs: 0,
      };
    }

    const userPRs = this.getPRsForUser();
    const allPRs = this.purchaseRequests;

    return {
      totalPRs: allPRs.length,
      pendingApprovals: userPRs.filter(pr => pr.status === 'Pending').length,
      approvedPRs: allPRs.filter(pr => pr.status === 'Approved').length,
      rejectedPRs: allPRs.filter(pr => pr.status === 'Rejected').length,
      totalValue: allPRs.reduce((sum, pr) => sum + pr.totalAmount, 0),
      myPRs: this.currentUser.role === 'Employee' ? userPRs.length : userPRs.length,
    };
  }
}

export const dataService = new DataService();
