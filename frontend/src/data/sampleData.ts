import { fetchUsers } from "../services/AdminApi";

export type DocumentStatus =
  | 'draft'
  | 'pending_review'
  | 'pending_approval'
  | 'revision_requested'
  | 'approved'
  | 'rejected';

export type StepStatus = 'pending' | 'current' | 'completed' | 'rejected' | 'revision_requested';
export type StepType = 'reviewer' | 'approver';
export type FileType = 'pdf' | 'docx' | 'xlsx' | 'pptx';

export interface ApprovalStep {
  id: number;
  stepNumber: number;
  type: StepType;
  assignedUser: string;
  assignedUserInitials: string;
  assignedUserDept: string;
  status: StepStatus;
  comments?: string;
  actionDate?: string;
}

export interface Document {
  id: string;
  title: string;
  description: string;
  fileName: string;
  fileSize: string;
  fileType: FileType;
  submittedBy: string;
  submittedByInitials: string;
  submittedDate: string;
  status: DocumentStatus;
  currentHolder: string;
  currentStep: number;
  totalSteps: number;
  approvalChain: ApprovalStep[];
  lastUpdated: string;
  department: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'administrator' | 'user';
  department: string;
  status: 'active' | 'inactive';
  lastLogin: string;
  initials: string;
}

export interface Notification {
  id: string;
  type: 'action_required' | 'approved' | 'rejected' | 'revision' | 'submitted';
  documentId: string;
  documentTitle: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface AuditEntry {
  id: string;
  documentId: string;
  documentTitle: string;
  date: string;
  time: string;
  user: string;
  approvalType: string;
  action: string;
  comments: string;
}

export const CURRENT_USER = {
  name: 'Ahmed Al-Rashid',
  initials: 'AA',
  email: 'ahmed.alrashid@corp.com',
  role: 'administrator' as const,
  department: 'Finance',
};

export const USERS: User[] = [];

// export async function loadUsers() {
//   try {
//     const users = await fetchUsers();
//     return users;
//   } catch (error) {
//     console.error(error);
//     throw error;
//   }
// }

export const DOCUMENTS: Document[] = [
  {
    id: 'DOC-2025-0124',
    title: 'Annual Budget Proposal FY2025',
    description: 'Comprehensive budget proposal for financial year 2025 including departmental allocations, capital expenditure plans, and headcount projections for all business units.',
    fileName: 'Budget_Proposal_FY2025.xlsx',
    fileSize: '2.4 MB',
    fileType: 'xlsx',
    submittedBy: 'Ahmed Al-Rashid',
    submittedByInitials: 'AA',
    submittedDate: '2025-01-20',
    status: 'pending_approval',
    currentHolder: 'Ali Hassan',
    currentStep: 3,
    totalSteps: 4,
    department: 'Finance',
    lastUpdated: '2025-01-22 14:30',
    approvalChain: [
      { id: 1, stepNumber: 1, type: 'reviewer', assignedUser: 'Jennifer Park', assignedUserInitials: 'JP', assignedUserDept: 'HR', status: 'completed', comments: 'Reviewed and cleared. Headcount figures align with HR records.', actionDate: '2025-01-21' },
      { id: 2, stepNumber: 2, type: 'approver', assignedUser: 'Sarah Mitchell', assignedUserInitials: 'SM', assignedUserDept: 'IT', status: 'completed', comments: 'Approved. IT budget allocation aligns with strategic objectives.', actionDate: '2025-01-22' },
      { id: 3, stepNumber: 3, type: 'approver', assignedUser: 'Ali Hassan', assignedUserInitials: 'AH', assignedUserDept: 'Finance', status: 'current' },
      { id: 4, stepNumber: 4, type: 'approver', assignedUser: 'Michael Torres (CEO)', assignedUserInitials: 'MT', assignedUserDept: 'Executive', status: 'pending' },
    ],
  },
  {
    id: 'DOC-2025-0118',
    title: 'Employee Handbook Revision Q1 2025',
    description: 'Updated employee handbook incorporating revised leave policies, remote work guidelines, and updated compliance requirements per Labor Law Amendment 2024.',
    fileName: 'Employee_Handbook_Q1_2025.docx',
    fileSize: '1.8 MB',
    fileType: 'docx',
    submittedBy: 'Jennifer Park',
    submittedByInitials: 'JP',
    submittedDate: '2025-01-18',
    status: 'revision_requested',
    currentHolder: 'Jennifer Park',
    currentStep: 2,
    totalSteps: 3,
    department: 'HR',
    lastUpdated: '2025-01-23 10:15',
    approvalChain: [
      { id: 1, stepNumber: 1, type: 'reviewer', assignedUser: 'Ahmed Al-Rashid', assignedUserInitials: 'AA', assignedUserDept: 'Finance', status: 'completed', comments: 'Financial compensation terms verified against payroll records.', actionDate: '2025-01-20' },
      { id: 2, stepNumber: 2, type: 'approver', assignedUser: 'Marcus Thompson', assignedUserInitials: 'MT', assignedUserDept: 'Legal', status: 'revision_requested', comments: 'Please update Section 4.2 regarding overtime compensation to align with updated labor regulations effective March 2025.', actionDate: '2025-01-23' },
      { id: 3, stepNumber: 3, type: 'approver', assignedUser: 'Michael Torres (CEO)', assignedUserInitials: 'MT', assignedUserDept: 'Executive', status: 'pending' },
    ],
  },
  {
    id: 'DOC-2025-0115',
    title: 'Vendor Contract — Tech Solutions Ltd.',
    description: 'Three-year master service agreement with Tech Solutions Ltd. covering enterprise software licensing, SLA commitments, and technical support provisions.',
    fileName: 'Vendor_Contract_TechSolutions.pdf',
    fileSize: '3.1 MB',
    fileType: 'pdf',
    submittedBy: 'Robert Chen',
    submittedByInitials: 'RC',
    submittedDate: '2025-01-15',
    status: 'approved',
    currentHolder: 'Michael Torres (CEO)',
    currentStep: 3,
    totalSteps: 3,
    department: 'Procurement',
    lastUpdated: '2025-01-24 09:00',
    approvalChain: [
      { id: 1, stepNumber: 1, type: 'reviewer', assignedUser: 'Marcus Thompson', assignedUserInitials: 'MT', assignedUserDept: 'Legal', status: 'completed', comments: 'All legal terms reviewed and compliant with corporate standards.', actionDate: '2025-01-17' },
      { id: 2, stepNumber: 2, type: 'approver', assignedUser: 'Priya Sharma', assignedUserInitials: 'PS', assignedUserDept: 'Operations', status: 'completed', comments: 'Operational requirements confirmed and within budget.', actionDate: '2025-01-20' },
      { id: 3, stepNumber: 3, type: 'approver', assignedUser: 'Michael Torres (CEO)', assignedUserInitials: 'MT', assignedUserDept: 'Executive', status: 'completed', comments: 'Approved. Proceed with contract execution.', actionDate: '2025-01-24' },
    ],
  },
  {
    id: 'DOC-2025-0110',
    title: 'IT Security Policy Update 2025',
    description: 'Annual review and update of information security policies including data classification, access control matrices, incident response procedures, and vendor security assessment criteria.',
    fileName: 'IT_Security_Policy_2025.docx',
    fileSize: '987 KB',
    fileType: 'docx',
    submittedBy: 'Sarah Mitchell',
    submittedByInitials: 'SM',
    submittedDate: '2025-01-10',
    status: 'rejected',
    currentHolder: 'Sarah Mitchell',
    currentStep: 2,
    totalSteps: 3,
    department: 'IT',
    lastUpdated: '2025-01-14 16:45',
    approvalChain: [
      { id: 1, stepNumber: 1, type: 'reviewer', assignedUser: 'Marcus Thompson', assignedUserInitials: 'MT', assignedUserDept: 'Legal', status: 'completed', comments: 'Policy is compliant with data protection regulations.', actionDate: '2025-01-12' },
      { id: 2, stepNumber: 2, type: 'approver', assignedUser: 'Priya Sharma', assignedUserInitials: 'PS', assignedUserDept: 'Operations', status: 'rejected', comments: 'The policy as written conflicts with current shift-based access control procedures in Plant B. Please coordinate with Operations before resubmission.', actionDate: '2025-01-14' },
      { id: 3, stepNumber: 3, type: 'approver', assignedUser: 'Michael Torres (CEO)', assignedUserInitials: 'MT', assignedUserDept: 'Executive', status: 'pending' },
    ],
  },
  {
    id: 'DOC-2025-0122',
    title: 'Q4 2025 Marketing Campaign Proposal',
    description: 'Integrated digital and traditional marketing campaign proposal for Q4 2025 including creative briefs, channel strategy, budget breakdowns, and projected ROI metrics.',
    fileName: 'Marketing_Campaign_Q4_2025.pptx',
    fileSize: '15.2 MB',
    fileType: 'pptx',
    submittedBy: 'Lisa Wang',
    submittedByInitials: 'LW',
    submittedDate: '2025-01-22',
    status: 'pending_review',
    currentHolder: 'Ahmed Al-Rashid',
    currentStep: 1,
    totalSteps: 3,
    department: 'Marketing',
    lastUpdated: '2025-01-22 11:30',
    approvalChain: [
      { id: 1, stepNumber: 1, type: 'reviewer', assignedUser: 'Ahmed Al-Rashid', assignedUserInitials: 'AA', assignedUserDept: 'Finance', status: 'current' },
      { id: 2, stepNumber: 2, type: 'approver', assignedUser: 'Priya Sharma', assignedUserInitials: 'PS', assignedUserDept: 'Operations', status: 'pending' },
      { id: 3, stepNumber: 3, type: 'approver', assignedUser: 'Michael Torres (CEO)', assignedUserInitials: 'MT', assignedUserDept: 'Executive', status: 'pending' },
    ],
  },
  {
    id: 'DOC-2025-0108',
    title: 'Procurement Policy Amendment No. 7',
    description: 'Amendment covering emergency purchase procedures, revised vendor qualification criteria, and updated approval thresholds for capital vs. operational expenditures.',
    fileName: 'Procurement_Policy_Amendment_7.pdf',
    fileSize: '540 KB',
    fileType: 'pdf',
    submittedBy: 'Robert Chen',
    submittedByInitials: 'RC',
    submittedDate: '2025-01-08',
    status: 'approved',
    currentHolder: 'Michael Torres (CEO)',
    currentStep: 4,
    totalSteps: 4,
    department: 'Procurement',
    lastUpdated: '2025-01-18 15:20',
    approvalChain: [
      { id: 1, stepNumber: 1, type: 'reviewer', assignedUser: 'Jennifer Park', assignedUserInitials: 'JP', assignedUserDept: 'HR', status: 'completed', comments: 'HR implications reviewed.', actionDate: '2025-01-10' },
      { id: 2, stepNumber: 2, type: 'reviewer', assignedUser: 'Marcus Thompson', assignedUserInitials: 'MT', assignedUserDept: 'Legal', status: 'completed', comments: 'Legally sound. No changes required.', actionDate: '2025-01-12' },
      { id: 3, stepNumber: 3, type: 'approver', assignedUser: 'Ahmed Al-Rashid', assignedUserInitials: 'AA', assignedUserDept: 'Finance', status: 'completed', comments: 'Approved. Thresholds align with financial controls framework.', actionDate: '2025-01-15' },
      { id: 4, stepNumber: 4, type: 'approver', assignedUser: 'Michael Torres (CEO)', assignedUserInitials: 'MT', assignedUserDept: 'Executive', status: 'completed', comments: 'Final approval granted. Effective immediately.', actionDate: '2025-01-18' },
    ],
  },
  {
    id: 'DOC-2025-0124B',
    title: 'Cloud Infrastructure Upgrade Plan',
    description: 'Technical roadmap for migrating on-premise data center infrastructure to hybrid cloud architecture using Azure and on-premise retention for sensitive data.',
    fileName: 'Cloud_Infrastructure_Plan_2025.pdf',
    fileSize: '4.7 MB',
    fileType: 'pdf',
    submittedBy: 'Ahmed Al-Rashid',
    submittedByInitials: 'AA',
    submittedDate: '2025-01-24',
    status: 'draft',
    currentHolder: 'Ahmed Al-Rashid',
    currentStep: 0,
    totalSteps: 3,
    department: 'IT',
    lastUpdated: '2025-01-24 13:00',
    approvalChain: [
      { id: 1, stepNumber: 1, type: 'reviewer', assignedUser: 'Priya Sharma', assignedUserInitials: 'PS', assignedUserDept: 'Operations', status: 'pending' },
      { id: 2, stepNumber: 2, type: 'approver', assignedUser: 'Robert Chen', assignedUserInitials: 'RC', assignedUserDept: 'Procurement', status: 'pending' },
      { id: 3, stepNumber: 3, type: 'approver', assignedUser: 'Michael Torres (CEO)', assignedUserInitials: 'MT', assignedUserDept: 'Executive', status: 'pending' },
    ],
  },
];

export const NOTIFICATIONS: Notification[] = [
  { id: 'n1', type: 'action_required', documentId: 'DOC-2025-0122', documentTitle: 'Q4 2025 Marketing Campaign Proposal', message: 'Document DOC-2025-0122 has been assigned to you for review.', timestamp: '2025-01-22 11:35', read: false },
  { id: 'n2', type: 'approved', documentId: 'DOC-2025-0115', documentTitle: 'Vendor Contract — Tech Solutions Ltd.', message: 'Vendor Contract — Tech Solutions Ltd. has been fully approved by all parties.', timestamp: '2025-01-24 09:01', read: false },
  { id: 'n3', type: 'revision', documentId: 'DOC-2025-0118', documentTitle: 'Employee Handbook Revision Q1 2025', message: 'Revision requested for Employee Handbook Q1 2025 by Marcus Thompson.', timestamp: '2025-01-23 10:16', read: false },
  { id: 'n4', type: 'approved', documentId: 'DOC-2025-0108', documentTitle: 'Procurement Policy Amendment No. 7', message: 'Procurement Policy Amendment No. 7 has been approved by all approvers.', timestamp: '2025-01-18 15:21', read: true },
  { id: 'n5', type: 'rejected', documentId: 'DOC-2025-0110', documentTitle: 'IT Security Policy Update 2025', message: 'IT Security Policy Update 2025 was rejected by Priya Sharma.', timestamp: '2025-01-14 16:46', read: true },
  { id: 'n6', type: 'submitted', documentId: 'DOC-2025-0124', documentTitle: 'Annual Budget Proposal FY2025', message: 'Annual Budget Proposal FY2025 has been submitted and is in the approval queue.', timestamp: '2025-01-20 09:16', read: true },
];

export const AUDIT_ENTRIES: AuditEntry[] = [
  { id: 'a1', documentId: 'DOC-2025-0124', documentTitle: 'Annual Budget Proposal FY2025', date: '2025-01-20', time: '09:15:42', user: 'Ahmed Al-Rashid', approvalType: 'Submitter', action: 'Document Submitted', comments: '' },
  { id: 'a2', documentId: 'DOC-2025-0124', documentTitle: 'Annual Budget Proposal FY2025', date: '2025-01-21', time: '11:32:10', user: 'Jennifer Park', approvalType: 'Reviewer', action: 'Reviewed & Cleared', comments: 'Headcount figures align with HR records.' },
  { id: 'a3', documentId: 'DOC-2025-0124', documentTitle: 'Annual Budget Proposal FY2025', date: '2025-01-22', time: '14:28:55', user: 'Sarah Mitchell', approvalType: 'Approver', action: 'Approved', comments: 'Aligns with strategic objectives.' },
  { id: 'a4', documentId: 'DOC-2025-0118', documentTitle: 'Employee Handbook Revision Q1 2025', date: '2025-01-18', time: '13:45:00', user: 'Jennifer Park', approvalType: 'Submitter', action: 'Document Submitted', comments: '' },
  { id: 'a5', documentId: 'DOC-2025-0118', documentTitle: 'Employee Handbook Revision Q1 2025', date: '2025-01-20', time: '10:12:33', user: 'Ahmed Al-Rashid', approvalType: 'Reviewer', action: 'Reviewed & Cleared', comments: 'Financial compensation terms verified.' },
  { id: 'a6', documentId: 'DOC-2025-0118', documentTitle: 'Employee Handbook Revision Q1 2025', date: '2025-01-23', time: '10:14:22', user: 'Marcus Thompson', approvalType: 'Approver', action: 'Revision Requested', comments: 'Update Section 4.2 re: overtime compensation.' },
  { id: 'a7', documentId: 'DOC-2025-0115', documentTitle: 'Vendor Contract — Tech Solutions Ltd.', date: '2025-01-15', time: '14:00:00', user: 'Robert Chen', approvalType: 'Submitter', action: 'Document Submitted', comments: '' },
  { id: 'a8', documentId: 'DOC-2025-0115', documentTitle: 'Vendor Contract — Tech Solutions Ltd.', date: '2025-01-17', time: '09:45:11', user: 'Marcus Thompson', approvalType: 'Reviewer', action: 'Reviewed & Cleared', comments: 'Legal terms compliant.' },
  { id: 'a9', documentId: 'DOC-2025-0115', documentTitle: 'Vendor Contract — Tech Solutions Ltd.', date: '2025-01-20', time: '16:20:44', user: 'Priya Sharma', approvalType: 'Approver', action: 'Approved', comments: 'Operational requirements confirmed.' },
  { id: 'a10', documentId: 'DOC-2025-0115', documentTitle: 'Vendor Contract — Tech Solutions Ltd.', date: '2025-01-24', time: '09:00:05', user: 'Michael Torres (CEO)', approvalType: 'Approver', action: 'Approved', comments: 'Proceed with contract execution.' },
  { id: 'a11', documentId: 'DOC-2025-0110', documentTitle: 'IT Security Policy Update 2025', date: '2025-01-10', time: '08:30:00', user: 'Sarah Mitchell', approvalType: 'Submitter', action: 'Document Submitted', comments: '' },
  { id: 'a12', documentId: 'DOC-2025-0110', documentTitle: 'IT Security Policy Update 2025', date: '2025-01-12', time: '11:00:00', user: 'Marcus Thompson', approvalType: 'Reviewer', action: 'Reviewed & Cleared', comments: 'Compliant with regulations.' },
  { id: 'a13', documentId: 'DOC-2025-0110', documentTitle: 'IT Security Policy Update 2025', date: '2025-01-14', time: '16:45:00', user: 'Priya Sharma', approvalType: 'Approver', action: 'Rejected', comments: 'Conflicts with operational procedures in Plant B.' },
  { id: 'a14', documentId: 'DOC-2025-0122', documentTitle: 'Q4 2025 Marketing Campaign Proposal', date: '2025-01-22', time: '11:30:00', user: 'Lisa Wang', approvalType: 'Submitter', action: 'Document Submitted', comments: '' },
  { id: 'a15', documentId: 'DOC-2025-0108', documentTitle: 'Procurement Policy Amendment No. 7', date: '2025-01-08', time: '09:00:00', user: 'Robert Chen', approvalType: 'Submitter', action: 'Document Submitted', comments: '' },
  { id: 'a16', documentId: 'DOC-2025-0108', documentTitle: 'Procurement Policy Amendment No. 7', date: '2025-01-15', time: '14:30:00', user: 'Ahmed Al-Rashid', approvalType: 'Approver', action: 'Approved', comments: 'Thresholds align with financial controls framework.' },
  { id: 'a17', documentId: 'DOC-2025-0108', documentTitle: 'Procurement Policy Amendment No. 7', date: '2025-01-18', time: '15:20:00', user: 'Michael Torres (CEO)', approvalType: 'Approver', action: 'Approved', comments: 'Final approval granted.' },
];

export const MONTHLY_TREND = [
  { month: 'Aug', submitted: 18, approved: 14, rejected: 2 },
  { month: 'Sep', submitted: 22, approved: 18, rejected: 3 },
  { month: 'Oct', submitted: 19, approved: 15, rejected: 2 },
  { month: 'Nov', submitted: 28, approved: 22, rejected: 4 },
  { month: 'Dec', submitted: 15, approved: 12, rejected: 1 },
  { month: 'Jan', submitted: 24, approved: 17, rejected: 3 },
];

export const STATUS_DISTRIBUTION = [
  { name: 'Approved', value: 42, color: '#059669' },
  { name: 'Pending Review', value: 11, color: '#0f6cbd' },
  { name: 'Pending Approval', value: 7, color: '#d97706' },
  { name: 'Revision Req.', value: 8, color: '#7c3aed' },
  { name: 'Rejected', value: 6, color: '#dc2626' },
  { name: 'Draft', value: 4, color: '#6b7280' },
];

export const DEPT_DISTRIBUTION = [
  { dept: 'Finance', count: 18 },
  { dept: 'IT', count: 15 },
  { dept: 'HR', count: 12 },
  { dept: 'Procurement', count: 11 },
  { dept: 'Legal', count: 8 },
  { dept: 'Marketing', count: 7 },
  { dept: 'Operations', count: 7 },
];

export const AVG_APPROVAL_TIME = [
  { category: 'Finance', days: 3.2 },
  { category: 'Legal', days: 5.1 },
  { category: 'HR', days: 2.8 },
  { category: 'IT', days: 4.0 },
  { category: 'Procurement', days: 6.3 },
  { category: 'Marketing', days: 2.1 },
];
