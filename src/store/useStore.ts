import { create } from 'zustand'
import type {
  User,
  Manuscript,
  ManuscriptPage,
  ProofreadSubmission,
  VersionDiffReport,
  ElectronicBook,
  QualityStandard,
  ProofreadCycle,
  PerformanceRecord,
  Message,
  TaskProgress,
  UserRole,
  ProofreadRecord,
  FlowRecord,
  DownloadRecord,
  PageReview,
  TrackingReport,
  TrackingReportDetail,
} from '@/types'
import {
  users as mockUsers,
  manuscripts as mockManuscripts,
  manuscriptPages as mockPages,
  proofreadSubmissions as mockSubmissions,
  versionDiffReports as mockReports,
  electronicBooks as mockBooks,
  qualityStandards as mockStandards,
  proofreadCycles as mockCycles,
  performanceRecords as mockPerformance,
  messages as mockMessages,
  taskProgress as mockTaskProgress,
  flowRecords as mockFlowRecords,
  downloadRecords as mockDownloadRecords,
} from '@/data/mockData'

interface AppState {
  currentUser: User
  users: User[]
  manuscripts: Manuscript[]
  manuscriptPages: ManuscriptPage[]
  proofreadSubmissions: ProofreadSubmission[]
  versionDiffReports: VersionDiffReport[]
  electronicBooks: ElectronicBook[]
  qualityStandards: QualityStandard[]
  proofreadCycles: ProofreadCycle[]
  performanceRecords: PerformanceRecord[]
  messages: Message[]
  taskProgress: TaskProgress[]
  flowRecords: FlowRecord[]
  downloadRecords: DownloadRecord[]
  trackingReports: TrackingReport[]

  setCurrentUser: (user: User) => void
  switchRole: (role: UserRole) => void
  markMessageRead: (id: string) => void
  markAllMessagesRead: () => void
  approveSubmission: (id: string, pageReviews?: PageReview[]) => void
  rejectSubmission: (id: string, reason: string, pageReviews?: PageReview[]) => void
  submitSupplement: (pageId: string, text: string) => void
  updateQualityStandard: (manuscriptId: string, data: Partial<QualityStandard>) => void
  updateProofreadCycle: (manuscriptId: string, data: Partial<ProofreadCycle>) => void
  addMessage: (msg: Message) => void
  createManuscript: (data: { title: string; author: string; dynasty: string; totalPages: number }) => void
  submitProofread: (manuscriptId: string, records: ProofreadRecord[], note: string) => void
  resubmitProofread: (submissionId: string, records: ProofreadRecord[], note: string) => void
  pushAlertToAdmin: (title: string, content: string, manuscriptId?: string) => void
  recordDownload: (bookId: string, format: 'pdf' | 'epub') => void
  generateTrackingReport: (manuscriptId: string) => TrackingReport
  resubmitProofreadWithCarry: (submissionId: string, updatedRecords: ProofreadRecord[], note: string) => void

  getManuscriptPages: (manuscriptId: string) => ManuscriptPage[]
  getManuscriptById: (id: string) => Manuscript | undefined
  getSubmissionById: (id: string) => ProofreadSubmission | undefined
  getSubmissionsByManuscriptId: (manuscriptId: string) => ProofreadSubmission[]
  getDiffReportBySubmissionId: (submissionId: string) => VersionDiffReport | undefined
  getUnreadMessages: () => Message[]
  getMessagesByType: (type: string) => Message[]
  getElectronicBookByManuscriptId: (manuscriptId: string) => ElectronicBook | undefined
  getLockedElectronicBooks: () => ElectronicBook[]
  getAdminUser: () => User | undefined
  getReviewerUser: () => User | undefined
  getFlowRecordsByManuscriptId: (manuscriptId: string) => FlowRecord[]
  getDownloadRecordsByBookId: (bookId: string) => DownloadRecord[]
  getLastSubmissionByManuscriptId: (manuscriptId: string) => ProofreadSubmission | undefined
  getTrackingReportsByManuscriptId: (manuscriptId: string) => TrackingReport[]
  getTrackingReportDetail: (reportId: string) => TrackingReportDetail | undefined
  getLastDownloadByBookId: (bookId: string) => DownloadRecord | undefined
}

const generateSampleOcrText = (pageNumber: number): string => {
  const samples = [
    '天地玄黃，宇宙洪荒。日月盈昃，辰宿列張。寒來暑往，秋收冬藏。',
    '閏餘成歲，律呂調陽。雲騰致雨，露結為霜。金生麗水，玉出崑岡。',
    '劍號巨闕，珠稱夜光。果珍李柰，菜重芥姜。海鹹河淡，鱗潛羽翔。',
    '龍師火帝，鳥官人皇。始制文字，乃服衣裳。推位讓國，有虞陶唐。',
    '弔民伐罪，周發殷湯。坐朝問道，垂拱平章。愛育黎首，臣伏戎羌。',
    '遐邇壹體，率賓歸王。鳴鳳在樹，白駒食場。化被草木，賴及萬方。',
    '蓋此身髮，四大五常。恭惟鞠養，豈敢毀傷。女慕貞絜，男效才良。',
    '知過必改，得能莫忘。罔談彼短，靡恃己長。信使可覆，器欲難量。',
  ]
  return samples[pageNumber % samples.length]
}

const generateCoverImage = (title: string): string => {
  const encoded = encodeURIComponent(`Ancient Chinese book cover of ${title} traditional calligraphy paper texture`)
  return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encoded}&image_size=landscape_4_3`
}

const generatePageImage = (title: string, page: number): string => {
  const encoded = encodeURIComponent(`Ancient Chinese manuscript page vertical text ${title} page ${page} yellowed paper`)
  return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encoded}&image_size=landscape_4_3`
}

const buildPagesForManuscript = (
  manuscriptId: string,
  totalPages: number,
  minOcrConfidence: number
): ManuscriptPage[] => {
  const pages: ManuscriptPage[] = []
  for (let i = 1; i <= totalPages; i++) {
    const baseConfidence = 0.6 + Math.random() * 0.4
    const needsSupplement = baseConfidence < minOcrConfidence
    pages.push({
      id: `${manuscriptId}-p${i}`,
      manuscriptId,
      pageNumber: i,
      imageUrl: generatePageImage(manuscriptId, i),
      ocrText: '',
      ocrConfidence: 0,
      needsSupplement: false,
      supplementedText: '',
      status: 'pending_ocr',
    })
  }
  return pages
}

export const useStore = create<AppState>((set, get) => ({
  currentUser: mockUsers[3],
  users: mockUsers,
  manuscripts: mockManuscripts,
  manuscriptPages: mockPages,
  proofreadSubmissions: mockSubmissions,
  versionDiffReports: mockReports,
  electronicBooks: mockBooks,
  qualityStandards: mockStandards,
  proofreadCycles: mockCycles,
  performanceRecords: mockPerformance,
  messages: mockMessages,
  taskProgress: mockTaskProgress,
  flowRecords: mockFlowRecords,
  downloadRecords: mockDownloadRecords,
  trackingReports: [],

  setCurrentUser: (user) => set({ currentUser: user }),

  switchRole: (role) => {
    const user = mockUsers.find((u) => u.role === role)
    if (user) set({ currentUser: user })
  },

  markMessageRead: (id) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, isRead: true } : m)),
    })),

  markAllMessagesRead: () =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.targetUserId === state.currentUser.id ? { ...m, isRead: true } : m
      ),
    })),

  approveSubmission: (id, pageReviews) =>
    set((state) => {
      const submission = state.proofreadSubmissions.find((s) => s.id === id)
      if (!submission) return state
      const now = new Date().toISOString()

      const updatedSubmissions = state.proofreadSubmissions.map((s) =>
        s.id === id
          ? {
              ...s,
              status: 'approved' as const,
              reviewerId: state.currentUser.id,
              reviewerName: state.currentUser.name,
              reviewedAt: now,
              pageReviews: pageReviews || s.pageReviews,
            }
          : s
      )

      const updatedManuscripts = state.manuscripts.map((m) =>
        m.id === submission.manuscriptId ? { ...m, status: 'completed' as const, updatedAt: now } : m
      )

      const manuscript = updatedManuscripts.find((m) => m.id === submission.manuscriptId)

      const existingBook = state.electronicBooks.find((b) => b.manuscriptId === submission.manuscriptId && b.lockedAt)
      let newBooks = state.electronicBooks
      let bookVersion = 1
      if (existingBook) {
        bookVersion = existingBook.version + 1
        newBooks = state.electronicBooks.map((b) =>
          b.id === existingBook.id
            ? { ...b, version: bookVersion, lockedAt: now, lockedBy: state.currentUser.name }
            : b
        )
      } else {
        const lockedCount = state.electronicBooks.filter((b) => b.lockedAt).length + 1
        const newBook: ElectronicBook = {
          id: `eb${Date.now()}`,
          manuscriptId: submission.manuscriptId,
          bookNumber: `EBSK-2026-${String(lockedCount).padStart(4, '0')}`,
          title: manuscript?.title || '',
          lockedAt: now,
          lockedBy: state.currentUser.name,
          version: 1,
          downloadCount: 0,
          lastDownloadedAt: '',
        }
        newBooks = [...state.electronicBooks, newBook]
      }

      const approvalMsg: Message = {
        id: `msg${Date.now()}`,
        type: 'review_approved',
        title: '校勘审核通过',
        content: `${state.currentUser.name}已审核通过《${manuscript?.title || ''}》校勘提交（第${submission.version}版），电子古籍已自动生成并锁定。`,
        targetUserId: submission.expertId,
        relatedManuscriptId: submission.manuscriptId,
        relatedTaskId: id,
        isRead: false,
        hasVoucher: true,
        voucherUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese+traditional+seal+stamp+voucher+approval+certificate&image_size=square_hd',
        createdAt: now,
      }

      const flowRecord: FlowRecord = {
        id: `fl-${Date.now()}-approve`,
        manuscriptId: submission.manuscriptId,
        type: 'review_approve',
        status: '已完成',
        operatorId: state.currentUser.id,
        operatorName: state.currentUser.name,
        operatorRole: state.currentUser.role,
        timestamp: now,
        description: `审核通过第${submission.version}版校勘提交，${pageReviews ? `${pageReviews.filter(r => r.passed).length}页通过` : ''}`,
        relatedSubmissionId: id,
        relatedMessageId: approvalMsg.id,
      }

      const lockFlow: FlowRecord = {
        id: `fl-${Date.now()}-lock`,
        manuscriptId: submission.manuscriptId,
        type: 'lock',
        status: '已完成',
        operatorId: state.currentUser.id,
        operatorName: state.currentUser.name,
        operatorRole: state.currentUser.role,
        timestamp: now,
        description: `电子古籍已生成并锁定，版本 v${bookVersion}`,
      }

      return {
        proofreadSubmissions: updatedSubmissions,
        manuscripts: updatedManuscripts,
        electronicBooks: newBooks,
        messages: [...state.messages, approvalMsg],
        flowRecords: [...state.flowRecords, flowRecord, lockFlow],
      }
    }),

  rejectSubmission: (id, reason, pageReviews) =>
    set((state) => {
      const submission = state.proofreadSubmissions.find((s) => s.id === id)
      if (!submission) return state
      const now = new Date().toISOString()
      const manuscript = state.manuscripts.find((m) => m.id === submission.manuscriptId)

      const updatedSubmissions = state.proofreadSubmissions.map((s) =>
        s.id === id
          ? {
              ...s,
              status: 'rejected' as const,
              reviewNote: reason,
              reviewerId: state.currentUser.id,
              reviewerName: state.currentUser.name,
              reviewedAt: now,
              pageReviews: pageReviews || s.pageReviews,
            }
          : s
      )

      const updatedManuscripts = state.manuscripts.map((m) =>
        m.id === submission.manuscriptId ? { ...m, status: 'proofreading' as const, updatedAt: now } : m
      )

      const rejectMsg: Message = {
        id: `msg${Date.now()}`,
        type: 'review_rejected',
        title: '校勘审核退回',
        content: `${state.currentUser.name}退回了《${manuscript?.title || ''}》第${submission.version}版校勘提交，原因：${reason}`,
        targetUserId: submission.expertId,
        relatedManuscriptId: submission.manuscriptId,
        relatedTaskId: id,
        isRead: false,
        hasVoucher: false,
        voucherUrl: '',
        createdAt: now,
      }

      const flowRecord: FlowRecord = {
        id: `fl-${Date.now()}-reject`,
        manuscriptId: submission.manuscriptId,
        type: 'review_reject',
        status: '已退回',
        operatorId: state.currentUser.id,
        operatorName: state.currentUser.name,
        operatorRole: state.currentUser.role,
        timestamp: now,
        description: `审核退回第${submission.version}版，${pageReviews ? `${pageReviews.filter(r => !r.passed).length}页需修改` : reason}`,
        relatedSubmissionId: id,
        relatedMessageId: rejectMsg.id,
      }

      return {
        proofreadSubmissions: updatedSubmissions,
        manuscripts: updatedManuscripts,
        messages: [...state.messages, rejectMsg],
        flowRecords: [...state.flowRecords, flowRecord],
      }
    }),

  submitSupplement: (pageId, text) =>
    set((state) => ({
      manuscriptPages: state.manuscriptPages.map((p) =>
        p.id === pageId ? { ...p, supplementedText: text, status: 'supplemented' as const, needsSupplement: false } : p
      ),
    })),

  updateQualityStandard: (manuscriptId, data) =>
    set((state) => ({
      qualityStandards: state.qualityStandards.map((qs) =>
        qs.manuscriptId === manuscriptId ? { ...qs, ...data } : qs
      ),
    })),

  updateProofreadCycle: (manuscriptId, data) =>
    set((state) => ({
      proofreadCycles: state.proofreadCycles.map((pc) =>
        pc.manuscriptId === manuscriptId ? { ...pc, ...data } : pc
      ),
    })),

  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),

  createManuscript: ({ title, author, dynasty, totalPages }) =>
    set((state) => {
      const id = `ms${Date.now()}`
      const now = new Date().toISOString()
      const minConfidence = 0.85

      const newManuscript: Manuscript = {
        id,
        title,
        author,
        dynasty,
        totalPages,
        status: 'ocr_processing',
        createdAt: now,
        updatedAt: now,
        coverImage: generateCoverImage(title),
      }

      const pages = buildPagesForManuscript(id, totalPages, minConfidence)

      const uploadMsg: Message = {
        id: `msg${Date.now()}`,
        type: 'upload',
        title: '新古籍上传通知',
        content: `《${title}》已完成上传，共${totalPages}页影像，OCR识别处理中。`,
        targetUserId: state.currentUser.id,
        relatedManuscriptId: id,
        relatedTaskId: id,
        isRead: false,
        hasVoucher: false,
        voucherUrl: '',
        createdAt: now,
      }

      const uploadFlow: FlowRecord = {
        id: `fl-${Date.now()}-upload`,
        manuscriptId: id,
        type: 'upload',
        status: '已完成',
        operatorId: state.currentUser.id,
        operatorName: state.currentUser.name,
        operatorRole: state.currentUser.role,
        timestamp: now,
        description: `上传《${title}》扫描影像，共${totalPages}页`,
        relatedMessageId: uploadMsg.id,
      }

      const ocrProcessingFlow: FlowRecord = {
        id: `fl-${Date.now()}-ocr-processing`,
        manuscriptId: id,
        type: 'ocr_processing',
        status: '处理中',
        operatorId: 'system',
        operatorName: '系统',
        operatorRole: 'engineer' as const,
        timestamp: now,
        description: `OCR识别中，正在处理${totalPages}页扫描影像...`,
      }

      const newStandard: QualityStandard = {
        manuscriptId: id,
        manuscriptTitle: title,
        maxErrorRate: 0.002,
        minOcrConfidence: 0.85,
      }

      const newCycle: ProofreadCycle = {
        manuscriptId: id,
        manuscriptTitle: title,
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        plannedDays: 30,
        currentProgress: 0,
        isOverdue: false,
        overduePercentage: 0,
      }

      setTimeout(() => {
        set((innerState) => {
          const updatedPages = pages.map((p) => {
            const baseConfidence = 0.6 + Math.random() * 0.4
            const needsSupplement = baseConfidence < minConfidence
            return {
              ...p,
              ocrText: needsSupplement && baseConfidence < 0.5 ? '' : generateSampleOcrText(p.pageNumber),
              ocrConfidence: Math.round(baseConfidence * 100) / 100,
              needsSupplement,
              status: (needsSupplement ? 'supplementing' : 'ocr_done') as ManuscriptPage['status'],
            }
          })

          const anyNeedsSupplement = updatedPages.some((p) => p.needsSupplement)
          const newStatus: Manuscript['status'] = anyNeedsSupplement ? 'pending_supplement' : 'proofreading'

          const ocrMsg: Message = {
            id: `msg-ocr-${Date.now()}`,
            type: 'upload',
            title: 'OCR处理完成',
            content: `《${title}》OCR识别已完成，${anyNeedsSupplement ? '检测到低置信度页面，需要人工补录' : '全部页面识别正常，可进入校勘'}。`,
            targetUserId: state.currentUser.id,
            relatedManuscriptId: id,
            relatedTaskId: id,
            isRead: false,
            hasVoucher: false,
            voucherUrl: '',
            createdAt: new Date().toISOString(),
          }

          const ocrFlow: FlowRecord = {
            id: `fl-ocr-${Date.now()}`,
            manuscriptId: id,
            type: 'ocr_done',
            status: '已完成',
            operatorId: 'system',
            operatorName: '系统',
            operatorRole: 'engineer' as const,
            timestamp: new Date().toISOString(),
            description: `OCR识别完成，${anyNeedsSupplement ? `${updatedPages.filter(p => p.needsSupplement).length}页需人工补录` : '全部识别正常'}`,
            relatedMessageId: ocrMsg.id,
          }

          return {
            manuscripts: innerState.manuscripts.map((m) =>
              m.id === id ? { ...m, status: newStatus, updatedAt: new Date().toISOString() } : m
            ),
            manuscriptPages: innerState.manuscriptPages.map((p) => {
              const updated = updatedPages.find((up) => up.id === p.id)
              return updated || p
            }),
            messages: [...innerState.messages, ocrMsg],
            flowRecords: [...innerState.flowRecords, ocrFlow],
          }
        })
      }, 2500)

      return {
        manuscripts: [newManuscript, ...state.manuscripts],
        manuscriptPages: [...state.manuscriptPages, ...pages],
        messages: [...state.messages, uploadMsg],
        flowRecords: [...state.flowRecords, uploadFlow, ocrProcessingFlow],
        qualityStandards: [...state.qualityStandards, newStandard],
        proofreadCycles: [...state.proofreadCycles, newCycle],
      }
    }),

  submitProofread: (manuscriptId, records, note) =>
    set((state) => {
      const user = state.currentUser
      const manuscript = state.manuscripts.find((m) => m.id === manuscriptId)
      if (!manuscript) return state

      const submissionId = `ps${Date.now()}`
      const now = new Date().toISOString()

      const submission: ProofreadSubmission = {
        id: submissionId,
        manuscriptId,
        expertId: user.id,
        expertName: user.name,
        totalPages: manuscript.totalPages,
        status: 'pending_review',
        reviewNote: note,
        reviewerId: '',
        reviewerName: '',
        reviewedAt: '',
        createdAt: now,
        version: 1,
        records,
        pageReviews: [],
      }

      const diffs = records.map((r) => ({
        pageNumber: r.pageNumber,
        originalText: r.originalText,
        correctedText: r.correctedText,
        diffType: r.differenceType,
      }))

      const diffReport: VersionDiffReport = {
        id: `vdr${Date.now()}`,
        submissionId,
        manuscriptId,
        diffs,
        generatedAt: now,
      }

      const updatedManuscripts = state.manuscripts.map((m) =>
        m.id === manuscriptId ? { ...m, status: 'reviewing' as const, updatedAt: now } : m
      )

      const reviewer = get().getReviewerUser()
      const reviewMsg: Message = {
        id: `msg${Date.now()}`,
        type: 'proofread_submit',
        title: '校勘提交待审核',
        content: `${user.name}提交了《${manuscript.title}》的校勘结果（第1版），共${manuscript.totalPages}页，含${records.length}条校勘记录，请及时审核。`,
        targetUserId: reviewer?.id || '',
        relatedManuscriptId: manuscriptId,
        relatedTaskId: submissionId,
        isRead: false,
        hasVoucher: false,
        voucherUrl: '',
        createdAt: now,
      }

      const flowRecord: FlowRecord = {
        id: `fl-${Date.now()}-submit`,
        manuscriptId,
        type: 'proofread_submit',
        status: '审核中',
        operatorId: user.id,
        operatorName: user.name,
        operatorRole: user.role,
        timestamp: now,
        description: `提交第1版校勘结果，共${records.length}条校勘记录`,
        relatedSubmissionId: submissionId,
        relatedMessageId: reviewMsg.id,
      }

      return {
        proofreadSubmissions: [submission, ...state.proofreadSubmissions],
        versionDiffReports: [...state.versionDiffReports, diffReport],
        manuscripts: updatedManuscripts,
        messages: [...state.messages, reviewMsg],
        flowRecords: [...state.flowRecords, flowRecord],
      }
    }),

  resubmitProofread: (submissionId, records, note) =>
    set((state) => {
      const user = state.currentUser
      const oldSubmission = state.proofreadSubmissions.find((s) => s.id === submissionId)
      if (!oldSubmission) return state
      const manuscript = state.manuscripts.find((m) => m.id === oldSubmission.manuscriptId)
      if (!manuscript) return state

      const newVersion = oldSubmission.version + 1
      const newSubmissionId = `ps${Date.now()}`
      const now = new Date().toISOString()

      const newSubmission: ProofreadSubmission = {
        id: newSubmissionId,
        manuscriptId: oldSubmission.manuscriptId,
        expertId: user.id,
        expertName: user.name,
        totalPages: manuscript.totalPages,
        status: 'pending_review',
        reviewNote: note,
        reviewerId: '',
        reviewerName: '',
        reviewedAt: '',
        createdAt: now,
        version: newVersion,
        records,
        pageReviews: [],
      }

      const diffs = records.map((r) => ({
        pageNumber: r.pageNumber,
        originalText: r.originalText,
        correctedText: r.correctedText,
        diffType: r.differenceType,
      }))

      const diffReport: VersionDiffReport = {
        id: `vdr${Date.now()}`,
        submissionId: newSubmissionId,
        manuscriptId: oldSubmission.manuscriptId,
        diffs,
        generatedAt: now,
      }

      const updatedManuscripts = state.manuscripts.map((m) =>
        m.id === oldSubmission.manuscriptId ? { ...m, status: 'reviewing' as const, updatedAt: now } : m
      )

      const reviewer = get().getReviewerUser()
      const reviewMsg: Message = {
        id: `msg${Date.now()}`,
        type: 'proofread_submit',
        title: '校勘提交待审核',
        content: `${user.name}重新提交了《${manuscript.title}》的校勘结果（第${newVersion}版），含${records.length}条校勘记录，请及时审核。`,
        targetUserId: reviewer?.id || '',
        relatedManuscriptId: oldSubmission.manuscriptId,
        relatedTaskId: newSubmissionId,
        isRead: false,
        hasVoucher: false,
        voucherUrl: '',
        createdAt: now,
      }

      const flowRecord: FlowRecord = {
        id: `fl-${Date.now()}-resubmit`,
        manuscriptId: oldSubmission.manuscriptId,
        type: 'proofread_submit',
        status: '审核中',
        operatorId: user.id,
        operatorName: user.name,
        operatorRole: user.role,
        timestamp: now,
        description: `重新提交第${newVersion}版校勘结果，共${records.length}条校勘记录`,
        relatedSubmissionId: newSubmissionId,
        relatedMessageId: reviewMsg.id,
      }

      return {
        proofreadSubmissions: [newSubmission, ...state.proofreadSubmissions],
        versionDiffReports: [...state.versionDiffReports, diffReport],
        manuscripts: updatedManuscripts,
        messages: [...state.messages, reviewMsg],
        flowRecords: [...state.flowRecords, flowRecord],
      }
    }),

  pushAlertToAdmin: (title, content, manuscriptId) =>
    set((state) => {
      const admin = get().getAdminUser()
      if (!admin) return state
      const msg: Message = {
        id: `msg-alert-${Date.now()}`,
        type: 'alert',
        title,
        content,
        targetUserId: admin.id,
        relatedManuscriptId: manuscriptId || '',
        relatedTaskId: '',
        isRead: false,
        hasVoucher: false,
        voucherUrl: '',
        createdAt: new Date().toISOString(),
      }
      return { messages: [...state.messages, msg] }
    }),

  recordDownload: (bookId, format) =>
    set((state) => {
      const book = state.electronicBooks.find((b) => b.id === bookId)
      const user = state.currentUser
      if (!book || !book.lockedAt) return state
      const now = new Date().toISOString()

      const record: DownloadRecord = {
        id: `dl${Date.now()}`,
        bookId,
        manuscriptId: book.manuscriptId,
        format,
        downloadedBy: user.name,
        downloadedById: user.id,
        downloadedAt: now,
      }

      const updatedBooks = state.electronicBooks.map((b) =>
        b.id === bookId
          ? { ...b, downloadCount: b.downloadCount + 1, lastDownloadedAt: now }
          : b
      )

      const downloadMsg: Message = {
        id: `msg-dl-${Date.now()}`,
        type: 'download',
        title: '电子古籍下载',
        content: `您已下载《${book.title}》${format.toUpperCase()}格式，版本 v${book.version}。`,
        targetUserId: user.id,
        relatedManuscriptId: book.manuscriptId,
        relatedTaskId: bookId,
        isRead: false,
        hasVoucher: false,
        voucherUrl: '',
        createdAt: now,
      }

      return {
        downloadRecords: [...state.downloadRecords, record],
        electronicBooks: updatedBooks,
        messages: [...state.messages, downloadMsg],
      }
    }),

  getManuscriptPages: (manuscriptId) =>
    get().manuscriptPages.filter((p) => p.manuscriptId === manuscriptId),

  getManuscriptById: (id) =>
    get().manuscripts.find((m) => m.id === id),

  getSubmissionById: (id) =>
    get().proofreadSubmissions.find((s) => s.id === id),

  getSubmissionsByManuscriptId: (manuscriptId) =>
    get().proofreadSubmissions.filter((s) => s.manuscriptId === manuscriptId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),

  getDiffReportBySubmissionId: (submissionId) =>
    get().versionDiffReports.find((r) => r.submissionId === submissionId),

  getUnreadMessages: () =>
    get().messages.filter((m) => m.targetUserId === get().currentUser.id && !m.isRead),

  getMessagesByType: (type) =>
    get().messages.filter((m) => m.targetUserId === get().currentUser.id && (type === 'all' ? true : m.type === type)),

  getElectronicBookByManuscriptId: (manuscriptId) =>
    get().electronicBooks.find((b) => b.manuscriptId === manuscriptId),

  getLockedElectronicBooks: () =>
    get().electronicBooks.filter((b) => b.lockedAt && b.version > 0),

  getAdminUser: () =>
    get().users.find((u) => u.role === 'admin'),

  getReviewerUser: () =>
    get().users.find((u) => u.role === 'reviewer'),

  getFlowRecordsByManuscriptId: (manuscriptId) =>
    get().flowRecords
      .filter((r) => r.manuscriptId === manuscriptId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),

  getDownloadRecordsByBookId: (bookId) =>
    get().downloadRecords
      .filter((r) => r.bookId === bookId)
      .sort((a, b) => new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime()),

  getLastSubmissionByManuscriptId: (manuscriptId) => {
    const subs = get().getSubmissionsByManuscriptId(manuscriptId)
    return subs.length > 0 ? subs[0] : undefined
  },

  generateTrackingReport: (manuscriptId) => {
    const state = get()
    const manuscript = state.getManuscriptById(manuscriptId)
    if (!manuscript) return {} as TrackingReport

    const flowRecords = state.getFlowRecordsByManuscriptId(manuscriptId)
    const submissions = state.getSubmissionsByManuscriptId(manuscriptId)
    const book = state.getElectronicBookByManuscriptId(manuscriptId)
    const downloadRecords = book ? state.getDownloadRecordsByBookId(book.id) : []
    const taskProgress = state.taskProgress.find((t) => t.manuscriptId === manuscriptId)

    const reports = state.trackingReports.filter((r) => r.manuscriptId === manuscriptId)
    const newVersion = reports.length + 1
    const now = new Date().toISOString()

    const pdfDownloads = downloadRecords.filter((r) => r.format === 'pdf').length
    const epubDownloads = downloadRecords.filter((r) => r.format === 'epub').length
    const lastDownload = downloadRecords.length > 0 ? downloadRecords[0] : undefined

    const roleLabel: Record<string, string> = {
      engineer: '数字化工程师',
      proofreader: '校勘专家',
      reviewer: '审校员',
      admin: '管理员',
    }

    const detailSnapshot: TrackingReportDetail = {
      reportId: `rpt${Date.now()}`,
      manuscriptId,
      basicInfo: {
        title: manuscript.title,
        author: manuscript.author,
        dynasty: manuscript.dynasty,
        totalPages: manuscript.totalPages,
        status: manuscript.status,
        createdAt: manuscript.createdAt,
        currentAssignee: taskProgress?.currentAssignee || '未分配',
        currentRole: taskProgress?.currentRole || 'engineer',
      },
      flowRecords: [...flowRecords],
      submissions: submissions.map((s) => ({
        id: s.id,
        version: s.version,
        status: s.status,
        expertName: s.expertName,
        reviewerName: s.reviewerName,
        reviewNote: s.reviewNote,
        createdAt: s.createdAt,
        reviewedAt: s.reviewedAt,
        recordCount: s.records.length,
        rejectedPages: s.pageReviews?.filter((r) => !r.passed).length || 0,
        pageReviews: s.pageReviews ? [...s.pageReviews] : undefined,
      })),
      downloadRecords: [...downloadRecords],
      totalDownloads: downloadRecords.length,
      pdfDownloads,
      epubDownloads,
      lastDownload: lastDownload
        ? { by: lastDownload.downloadedBy, format: lastDownload.format, at: lastDownload.downloadedAt }
        : undefined,
    }

    const newReport: TrackingReport = {
      id: detailSnapshot.reportId,
      manuscriptId,
      manuscriptTitle: manuscript.title,
      version: newVersion,
      generatedAt: now,
      generatedBy: state.currentUser.name,
      generatedById: state.currentUser.id,
      flowNodeCount: flowRecords.length,
      submissionCount: submissions.length,
      downloadCount: downloadRecords.length,
      summary: `v${newVersion} 追踪报告：${flowRecords.length}个流转节点，${submissions.length}次提交，${downloadRecords.length}次下载`,
      detailSnapshot,
    }

    set((s) => ({ trackingReports: [...s.trackingReports, newReport] }))
    return newReport
  },

  resubmitProofreadWithCarry: (submissionId, updatedRecords, note) => {
    const state = get()
    const user = state.currentUser
    const oldSubmission = state.proofreadSubmissions.find((s) => s.id === submissionId)
    if (!oldSubmission) return
    const manuscript = state.manuscripts.find((m) => m.id === oldSubmission.manuscriptId)
    if (!manuscript) return

    const oldRecords = oldSubmission.records
    const oldRecordMap = new Map(oldRecords.map((r) => [`${r.pageNumber}-${r.differenceType}-${r.originalText}`, r]))

    const newVersion = oldSubmission.version + 1
    const newSubmissionId = `ps${Date.now()}`
    const now = new Date().toISOString()

    const finalRecords: ProofreadRecord[] = []
    const diffItems: Array<{ pageNumber: number; originalText: string; correctedText: string; diffType: string; changeType: 'new' | 'modified' | 'carried' }> = []

    updatedRecords.forEach((r) => {
      const key = `${r.pageNumber}-${r.differenceType}-${r.originalText}`
      const oldRecord = oldRecordMap.get(key)
      const record: ProofreadRecord = {
        ...r,
        id: `auto-${oldSubmission.manuscriptId}-p${r.pageNumber}-${Date.now()}-${Math.random()}`,
        expertId: user.id,
        expertName: user.name,
        manuscriptId: oldSubmission.manuscriptId,
        createdAt: now,
      }
      finalRecords.push(record)

      if (!oldRecord) {
        diffItems.push({ pageNumber: r.pageNumber, originalText: r.originalText, correctedText: r.correctedText, diffType: r.differenceType, changeType: 'new' })
      } else if (oldRecord.correctedText !== r.correctedText || oldRecord.note !== r.note) {
        diffItems.push({ pageNumber: r.pageNumber, originalText: r.originalText, correctedText: r.correctedText, diffType: r.differenceType, changeType: 'modified' })
      } else {
        diffItems.push({ pageNumber: r.pageNumber, originalText: r.originalText, correctedText: r.correctedText, diffType: r.differenceType, changeType: 'carried' })
      }
      oldRecordMap.delete(key)
    })

    oldRecordMap.forEach((r) => {
      diffItems.push({ pageNumber: r.pageNumber, originalText: r.originalText, correctedText: r.correctedText, diffType: r.differenceType, changeType: 'carried' })
      finalRecords.push({ ...r, id: `carry-${r.id}-${Date.now()}`, createdAt: now })
    })

    const newSubmission: ProofreadSubmission = {
      id: newSubmissionId,
      manuscriptId: oldSubmission.manuscriptId,
      expertId: user.id,
      expertName: user.name,
      totalPages: manuscript.totalPages,
      status: 'pending_review',
      reviewNote: note,
      reviewerId: '',
      reviewerName: '',
      reviewedAt: '',
      createdAt: now,
      version: newVersion,
      records: finalRecords,
      pageReviews: [],
    }

    const diffReport: VersionDiffReport = {
      id: `vdr${Date.now()}`,
      submissionId: newSubmissionId,
      manuscriptId: oldSubmission.manuscriptId,
      diffs: diffItems,
      generatedAt: now,
    }

    const updatedManuscripts = state.manuscripts.map((m) =>
      m.id === oldSubmission.manuscriptId ? { ...m, status: 'reviewing' as const, updatedAt: now } : m
    )

    const reviewer = state.getReviewerUser()
    const reviewMsg: Message = {
      id: `msg${Date.now()}`,
      type: 'proofread_submit',
      title: '校勘提交待审核',
      content: `${user.name}重新提交了《${manuscript.title}》的校勘结果（第${newVersion}版），含${finalRecords.length}条校勘记录（其中${diffItems.filter(d => d.changeType === 'new').length}条新增，${diffItems.filter(d => d.changeType === 'modified').length}条修改，${diffItems.filter(d => d.changeType === 'carried').length}条沿用），请及时审核。`,
      targetUserId: reviewer?.id || '',
      relatedManuscriptId: oldSubmission.manuscriptId,
      relatedTaskId: newSubmissionId,
      isRead: false,
      hasVoucher: false,
      voucherUrl: '',
      createdAt: now,
    }

    const flowRecord: FlowRecord = {
      id: `fl-${Date.now()}-resubmit`,
      manuscriptId: oldSubmission.manuscriptId,
      type: 'proofread_submit',
      status: '审核中',
      operatorId: user.id,
      operatorName: user.name,
      operatorRole: user.role,
      timestamp: now,
      description: `重新提交第${newVersion}版校勘结果，共${finalRecords.length}条记录（新增${diffItems.filter(d => d.changeType === 'new').length}，修改${diffItems.filter(d => d.changeType === 'modified').length}，沿用${diffItems.filter(d => d.changeType === 'carried').length}）`,
      relatedSubmissionId: newSubmissionId,
      relatedMessageId: reviewMsg.id,
    }

    set((s) => ({
      proofreadSubmissions: [newSubmission, ...s.proofreadSubmissions],
      versionDiffReports: [...s.versionDiffReports, diffReport],
      manuscripts: updatedManuscripts,
      messages: [...s.messages, reviewMsg],
      flowRecords: [...s.flowRecords, flowRecord],
    }))
  },

  getTrackingReportsByManuscriptId: (manuscriptId) =>
    get()
      .trackingReports
      .filter((r) => r.manuscriptId === manuscriptId)
      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()),

  getTrackingReportDetail: (reportId) => {
    const state = get()
    const report = state.trackingReports.find((r) => r.id === reportId)
    if (!report) return undefined
    return report.detailSnapshot
  },

  getLastDownloadByBookId: (bookId) => {
    const records = get().getDownloadRecordsByBookId(bookId)
    return records.length > 0 ? records[0] : undefined
  },
}))
