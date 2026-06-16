export type UserRole = 'engineer' | 'proofreader' | 'reviewer' | 'admin'

export interface User {
  id: string
  name: string
  role: UserRole
  avatar: string
  phone: string
}

export type ManuscriptStatus = 'uploading' | 'ocr_processing' | 'pending_supplement' | 'proofreading' | 'reviewing' | 'completed'

export interface Manuscript {
  id: string
  title: string
  author: string
  dynasty: string
  totalPages: number
  status: ManuscriptStatus
  createdAt: string
  updatedAt: string
  coverImage: string
}

export type PageStatus = 'pending_ocr' | 'ocr_done' | 'supplementing' | 'supplemented'

export interface ManuscriptPage {
  id: string
  manuscriptId: string
  pageNumber: number
  imageUrl: string
  ocrText: string
  ocrConfidence: number
  needsSupplement: boolean
  supplementedText: string
  status: PageStatus
}

export interface ProofreadRecord {
  id: string
  manuscriptId: string
  expertId: string
  expertName: string
  pageNumber: number
  originalText: string
  correctedText: string
  differenceType: 'wrong_char' | 'missing_char' | 'extra_char' | 'derivative'
  note: string
  createdAt: string
}

export type SubmissionStatus = 'pending_review' | 'approved' | 'rejected'

export interface ProofreadSubmission {
  id: string
  manuscriptId: string
  expertId: string
  expertName: string
  totalPages: number
  status: SubmissionStatus
  reviewNote: string
  reviewerId: string
  reviewerName: string
  reviewedAt: string
  createdAt: string
  version: number
  records: ProofreadRecord[]
  pageReviews?: PageReview[]
}

export interface PageReview {
  pageNumber: number
  passed: boolean
  comment: string
}

export interface VersionDiffReport {
  id: string
  submissionId: string
  manuscriptId: string
  diffs: DiffItem[]
  generatedAt: string
}

export interface DiffItem {
  pageNumber: number
  originalText: string
  correctedText: string
  diffType: string
  changeType?: 'new' | 'modified' | 'carried'
}

export interface ElectronicBook {
  id: string
  manuscriptId: string
  bookNumber: string
  title: string
  lockedAt: string
  lockedBy: string
  version: number
  downloadCount: number
  lastDownloadedAt: string
}

export interface DownloadRecord {
  id: string
  bookId: string
  manuscriptId: string
  format: 'pdf' | 'epub'
  downloadedBy: string
  downloadedById: string
  downloadedAt: string
}

export interface FlowRecord {
  id: string
  manuscriptId: string
  type: 'upload' | 'ocr_done' | 'supplement' | 'proofread_submit' | 'review_approve' | 'review_reject' | 'lock'
  status: string
  operatorId: string
  operatorName: string
  operatorRole: UserRole
  timestamp: string
  description: string
  relatedMessageId?: string
  relatedSubmissionId?: string
}

export interface QualityStandard {
  manuscriptId: string
  manuscriptTitle: string
  maxErrorRate: number
  minOcrConfidence: number
}

export interface ProofreadCycle {
  manuscriptId: string
  manuscriptTitle: string
  startDate: string
  endDate: string
  plannedDays: number
  currentProgress: number
  isOverdue: boolean
  overduePercentage: number
}

export interface PerformanceRecord {
  expertId: string
  expertName: string
  date: string
  completedPages: number
  passRate: number
  avgProcessingTime: number
}

export type MessageType = 'upload' | 'proofread_submit' | 'review_approved' | 'review_rejected' | 'alert' | 'download'

export interface Message {
  id: string
  type: MessageType
  title: string
  content: string
  targetUserId: string
  relatedManuscriptId: string
  relatedTaskId: string
  isRead: boolean
  hasVoucher: boolean
  voucherUrl: string
  createdAt: string
}

export interface TaskProgress {
  manuscriptId: string
  manuscriptTitle: string
  currentAssignee: string
  currentRole: UserRole
  status: string
  plannedDuration: number
  elapsedDuration: number
  progressPercentage: number
  isAlerted: boolean
}

export interface TrackingReport {
  id: string
  manuscriptId: string
  manuscriptTitle: string
  version: number
  generatedAt: string
  generatedBy: string
  generatedById: string
  flowNodeCount: number
  submissionCount: number
  downloadCount: number
  summary: string
}

export interface TrackingReportDetail {
  reportId: string
  manuscriptId: string
  basicInfo: {
    title: string
    author: string
    dynasty: string
    totalPages: number
    status: string
    createdAt: string
    currentAssignee: string
    currentRole: string
  }
  flowRecords: FlowRecord[]
  submissions: Array<{
    id: string
    version: number
    status: string
    expertName: string
    reviewerName: string
    reviewNote: string
    createdAt: string
    reviewedAt: string
    recordCount: number
    rejectedPages: number
    pageReviews?: PageReview[]
  }>
  downloadRecords: DownloadRecord[]
  totalDownloads: number
  pdfDownloads: number
  epubDownloads: number
  lastDownload?: {
    by: string
    format: string
    at: string
  }
}
