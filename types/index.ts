
export interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  role: 'Admin' | 'C Level' | 'Supervisor' | 'Employee';
  status: 'Active' | 'Inactive';
  createdAt: Date;
}

export interface PRItem {
  id: string;
  prId: string;
  productName: string;
  quantity: number;
  unit: string;
  estimatedPrice: number;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  image?: string;
}

export interface Approval {
  id: string;
  prId: string;
  step: number;
  approverId: string;
  approverName: string;
  decision: 'Approved' | 'Rejected';
  comment?: string;
  decidedAt: Date;
}

export interface AuditLog {
  id: string;
  prId: string;
  action: string;
  userId: string;
  userName: string;
  timestamp: Date;
  details?: string;
}

export interface PurchaseRequest {
  id: string;
  prNumber: string;
  requesterId: string;
  requesterName: string;
  requesterPosition: string;
  requesterDepartment: string;
  requesterEmail: string;
  status: 'Draft' | 'Pending' | 'Approved' | 'Rejected';
  currentStep: number;
  totalSteps: number;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  items: PRItem[];
  approvals: Approval[];
  auditLog: AuditLog[];
}

export interface NotificationData {
  id: string;
  userId: string;
  type: 'PR_SUBMITTED' | 'PR_APPROVED' | 'PR_REJECTED' | 'PR_PENDING_APPROVAL';
  title: string;
  message: string;
  prId: string;
  prNumber: string;
  read: boolean;
  createdAt: Date;
}

export interface DashboardMetrics {
  totalPRs: number;
  pendingApprovals: number;
  approvedPRs: number;
  rejectedPRs: number;
  totalValue: number;
  myPRs: number;
}
