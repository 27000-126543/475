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

  setCurrentUser: (user: User) => void
  switchRole: (role: UserRole) => void
  markMessageRead: (id: string) => void
  markAllMessagesRead: () => void
  approveSubmission: (id: string) => void
  rejectSubmission: (id: string, reason: string) => void
  submitSupplement: (pageId: string, text: string) => void
  updateQualityStandard: (manuscriptId: string, data: Partial<QualityStandard>) => void
  updateProofreadCycle: (manuscriptId: string, data: Partial<ProofreadCycle>) => void
  addMessage: (msg: Message) => void
  createManuscript: (data: { title: string; author: string; dynasty: string; totalPages: number }) => void
  submitProofread: (manuscriptId: string, records: ProofreadRecord[], note: string) => void
  pushAlertToAdmin: (title: string, content: string, manuscriptId?: string) => void

  getManuscriptPages: (manuscriptId: string) => ManuscriptPage[]
  getManuscriptById: (id: string) => Manuscript | undefined
  getSubmissionById: (id: string) => ProofreadSubmission | undefined
  getDiffReportBySubmissionId: (submissionId: string) => VersionDiffReport | undefined
  getUnreadMessages: () => Message[]
  getMessagesByType: (type: string) => Message[]
  getElectronicBookByManuscriptId: (manuscriptId: string) => ElectronicBook | undefined
  getLockedElectronicBooks: () => ElectronicBook[]
  getAdminUser: () => User | undefined
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
      ocrText: needsSupplement && baseConfidence < 0.5 ? '' : generateSampleOcrText(i),
      ocrConfidence: Math.round(baseConfidence * 100) / 100,
      needsSupplement,
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

  approveSubmission: (id) =>
    set((state) => {
      const submission = state.proofreadSubmissions.find((s) => s.id === id)
      if (!submission) return state

      const updatedSubmissions = state.proofreadSubmissions.map((s) =>
        s.id === id
          ? { ...s, status: 'approved' as const, reviewerId: state.currentUser.id, reviewerName: state.currentUser.name, reviewedAt: new Date().toISOString() }
          : s
      )

      const updatedManuscripts = state.manuscripts.map((m) =>
        m.id === submission.manuscriptId ? { ...m, status: 'completed' as const, updatedAt: new Date().toISOString() } : m
      )

      const manuscript = updatedManuscripts.find((m) => m.id === submission.manuscriptId)
      const newBook: ElectronicBook = {
        id: `eb${Date.now()}`,
        manuscriptId: submission.manuscriptId,
        bookNumber: `EBSK-2026-${String(state.electronicBooks.filter(b => b.lockedAt).length + 1).padStart(4, '0')}`,
        title: manuscript?.title || '',
        lockedAt: new Date().toISOString(),
        lockedBy: state.currentUser.name,
        version: 1,
      }

      const approvalMsg: Message = {
        id: `msg${Date.now()}`,
        type: 'review_approved',
        title: '校勘审核通过',
        content: `${state.currentUser.name}已审核通过《${manuscript?.title || ''}》校勘提交，电子古籍已自动生成并锁定。`,
        targetUserId: submission.expertId,
        relatedManuscriptId: submission.manuscriptId,
        relatedTaskId: id,
        isRead: false,
        hasVoucher: true,
        voucherUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese+traditional+seal+stamp+voucher+approval+certificate&image_size=square_hd',
        createdAt: new Date().toISOString(),
      }

      return {
        proofreadSubmissions: updatedSubmissions,
        manuscripts: updatedManuscripts,
        electronicBooks: [...state.electronicBooks, newBook],
        messages: [...state.messages, approvalMsg],
      }
    }),

  rejectSubmission: (id, reason) =>
    set((state) => {
      const submission = state.proofreadSubmissions.find((s) => s.id === id)
      if (!submission) return state
      const manuscript = state.manuscripts.find((m) => m.id === submission.manuscriptId)

      const updatedSubmissions = state.proofreadSubmissions.map((s) =>
        s.id === id
          ? { ...s, status: 'rejected' as const, reviewNote: reason, reviewerId: state.currentUser.id, reviewerName: state.currentUser.name, reviewedAt: new Date().toISOString() }
          : s
      )

      const rejectMsg: Message = {
        id: `msg${Date.now()}`,
        type: 'review_rejected',
        title: '校勘审核退回',
        content: `${state.currentUser.name}退回了《${manuscript?.title || ''}》校勘提交，原因：${reason}`,
        targetUserId: submission.expertId,
        relatedManuscriptId: submission.manuscriptId,
        relatedTaskId: id,
        isRead: false,
        hasVoucher: false,
        voucherUrl: '',
        createdAt: new Date().toISOString(),
      }

      return {
        proofreadSubmissions: updatedSubmissions,
        messages: [...state.messages, rejectMsg],
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

      setTimeout(() => {
        set((innerState) => {
          const anyNeedsSupplement = pages.some((p) => p.needsSupplement)
          const newStatus = anyNeedsSupplement ? 'pending_supplement' : 'proofreading'
          return {
            manuscripts: innerState.manuscripts.map((m) =>
              m.id === id ? { ...m, status: newStatus as 'pending_supplement' | 'proofreading', updatedAt: new Date().toISOString() } : m
            ),
            manuscriptPages: [
              ...innerState.manuscriptPages,
              ...pages.map((p) => ({ ...p, status: (p.needsSupplement ? 'supplementing' : 'ocr_done') as ManuscriptPage['status'] })),
            ],
          }
        })
      }, 2500)

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

      return {
        manuscripts: [newManuscript, ...state.manuscripts],
        messages: [...state.messages, uploadMsg],
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
        records,
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

      const admin = get().getAdminUser()
      const reviewMsg: Message = {
        id: `msg${Date.now()}`,
        type: 'proofread_submit',
        title: '校勘提交待审核',
        content: `${user.name}提交了《${manuscript.title}》的校勘结果，共${manuscript.totalPages}页，含${records.length}条校勘记录，请及时审核。`,
        targetUserId: admin?.id || '',
        relatedManuscriptId: manuscriptId,
        relatedTaskId: submissionId,
        isRead: false,
        hasVoucher: false,
        voucherUrl: '',
        createdAt: now,
      }

      return {
        proofreadSubmissions: [submission, ...state.proofreadSubmissions],
        versionDiffReports: [...state.versionDiffReports, diffReport],
        manuscripts: updatedManuscripts,
        messages: [...state.messages, reviewMsg],
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

  getManuscriptPages: (manuscriptId) =>
    get().manuscriptPages.filter((p) => p.manuscriptId === manuscriptId),

  getManuscriptById: (id) =>
    get().manuscripts.find((m) => m.id === id),

  getSubmissionById: (id) =>
    get().proofreadSubmissions.find((s) => s.id === id),

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
}))
