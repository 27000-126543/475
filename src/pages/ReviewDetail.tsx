import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { ArrowLeft, CheckCircle, XCircle, X, User, BookOpen, CheckSquare, Square, MessageSquare, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { PageReview } from '@/types'

const diffLabel: Record<string, { text: string; cls: string }> = {
  wrong_char: { text: '错字', cls: 'badge-red' },
  missing_char: { text: '漏字', cls: 'badge-amber' },
  extra_char: { text: '多字', cls: 'badge-blue' },
  derivative: { text: '衍文', cls: 'badge-green' },
}

const statusConfig: Record<string, { text: string; cls: string }> = {
  pending_review: { text: '待审核', cls: 'badge-amber' },
  approved: { text: '已通过', cls: 'badge-green' },
  rejected: { text: '已退回', cls: 'badge-red' },
}

export default function ReviewDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { proofreadSubmissions, getManuscriptById, getManuscriptPages, getDiffReportBySubmissionId, approveSubmission, rejectSubmission } = useStore()

  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [pageReviews, setPageReviews] = useState<PageReview[]>([])
  const [expandedPages, setExpandedPages] = useState<Set<number>>(new Set())

  const submission = proofreadSubmissions.find((s) => s.id === id)
  const manuscript = submission ? getManuscriptById(submission.manuscriptId) : undefined
  const pages = submission ? getManuscriptPages(submission.manuscriptId) : []
  const diffReport = submission ? getDiffReportBySubmissionId(submission.id) : undefined
  const status = submission ? statusConfig[submission.status] : undefined

  const sortedPages = useMemo(() => [...pages].sort((a, b) => a.pageNumber - b.pageNumber), [pages])
  const currentPageData = sortedPages[currentPage]

  const getPageReview = (pageNumber: number): PageReview | undefined => {
    return pageReviews.find((r) => r.pageNumber === pageNumber)
  }

  const togglePagePass = (pageNumber: number) => {
    setPageReviews((prev) => {
      const existing = prev.find((r) => r.pageNumber === pageNumber)
      if (existing) {
        return prev.map((r) => (r.pageNumber === pageNumber ? { ...r, passed: !r.passed } : r))
      }
      return [...prev, { pageNumber, passed: true, comment: '' }]
    })
  }

  const updatePageComment = (pageNumber: number, comment: string) => {
    setPageReviews((prev) => {
      const existing = prev.find((r) => r.pageNumber === pageNumber)
      if (existing) {
        return prev.map((r) => (r.pageNumber === pageNumber ? { ...r, comment } : r))
      }
      return [...prev, { pageNumber, passed: true, comment }]
    })
  }

  const togglePageExpand = (pageNumber: number) => {
    setExpandedPages((prev) => {
      const next = new Set(prev)
      if (next.has(pageNumber)) {
        next.delete(pageNumber)
      } else {
        next.add(pageNumber)
      }
      return next
    })
  }

  const getPageRecords = (pageNumber: number) => {
    return submission?.records.filter((r) => r.pageNumber === pageNumber) || []
  }

  const passedCount = pageReviews.filter((r) => r.passed).length
  const reviewedCount = pageReviews.length
  const totalPages = sortedPages.length

  const handleApprove = () => {
    if (!submission) return
    const finalReviews = sortedPages.map((p) => {
      const existing = getPageReview(p.pageNumber)
      return existing || { pageNumber: p.pageNumber, passed: true, comment: '' }
    })
    approveSubmission(submission.id, finalReviews)
    navigate('/review')
  }

  const handleReject = () => {
    if (!submission || !rejectReason.trim()) return
    const finalReviews = sortedPages.map((p) => {
      const existing = getPageReview(p.pageNumber)
      return existing || { pageNumber: p.pageNumber, passed: true, comment: '' }
    })
    rejectSubmission(submission.id, rejectReason, finalReviews)
    setShowRejectModal(false)
    setRejectReason('')
    navigate('/review')
  }

  const selectAllPass = () => {
    const allPassed = sortedPages.map((p) => ({
      pageNumber: p.pageNumber,
      passed: true,
      comment: getPageReview(p.pageNumber)?.comment || '',
    }))
    setPageReviews(allPassed)
  }

  if (!submission || !manuscript) {
    return (
      <div className="page-enter flex items-center justify-center h-full">
        <p className="text-ink-400">提交记录未找到</p>
      </div>
    )
  }

  return (
    <div className="page-enter flex flex-col h-full -m-6">
      <div className="flex items-center justify-between px-6 py-3 border-b border-ink-200/60 bg-white/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button className="btn-ghost px-2" onClick={() => navigate('/review')}>
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="section-title">{manuscript.title}</h1>
          <span className="text-sm text-ink-400">{manuscript.dynasty}·{manuscript.author}</span>
          <span className="badge-indigo">v{submission.version}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-ink-600">
            <User className="w-4 h-4 text-ink-400" />
            <span>提交专家：{submission.expertName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-ink-500">
            <BookOpen className="w-4 h-4 text-ink-400" />
            <span>{submission.totalPages}页</span>
          </div>
          {status && <span className={status.cls}>{status.text}</span>}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-72 border-r border-ink-200/60 bg-ink-50/50 flex flex-col">
          <div className="px-4 py-3 border-b border-ink-200/60">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-ink-700">页级审核</h3>
              {submission.status === 'pending_review' && (
                <button
                  className="text-xs text-indigo-600 hover:text-indigo-700"
                  onClick={selectAllPass}
                >
                  全部通过
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-ink-500">
              <span>已审核 {reviewedCount}/{totalPages}</span>
              <span className="text-green-600">通过 {passedCount}</span>
              <span className="text-red-500">未过 {reviewedCount - passedCount}</span>
            </div>
            <div className="mt-2 h-1.5 bg-ink-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full transition-all"
                style={{ width: `${totalPages > 0 ? (reviewedCount / totalPages) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sortedPages.map((page, idx) => {
              const review = getPageReview(page.pageNumber)
              const records = getPageRecords(page.pageNumber)
              const isExpanded = expandedPages.has(page.pageNumber)
              const isCurrent = currentPage === idx

              return (
                <div key={page.id} className="rounded-lg overflow-hidden">
                  <div
                    className={`flex items-center gap-2 px-2 py-2 cursor-pointer transition-colors ${
                      isCurrent ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-white/60'
                    }`}
                    onClick={() => {
                      setCurrentPage(idx)
                    }}
                  >
                    {submission.status === 'pending_review' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          togglePagePass(page.pageNumber)
                        }}
                        className="flex-shrink-0"
                      >
                        {review?.passed !== false ? (
                          <CheckSquare className={`w-4 h-4 ${review ? 'text-green-500' : 'text-ink-300'}`} />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                      </button>
                    ) : (
                      <div className="flex-shrink-0 w-4 h-4">
                        {submission.pageReviews?.find((r) => r.pageNumber === page.pageNumber)?.passed !== false ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    )}
                    <span className="text-sm text-ink-700 flex-1">第{page.pageNumber}页</span>
                    {records.length > 0 && (
                      <span className="text-xs text-cinnabar-500 bg-cinnabar-50 px-1.5 py-0.5 rounded">
                        {records.length}处
                      </span>
                    )}
                    {review?.comment && (
                      <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        togglePageExpand(page.pageNumber)
                      }}
                      className="text-ink-400"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-white/40 border-t border-ink-100 overflow-hidden"
                      >
                        {records.length > 0 ? (
                          <div className="p-2 space-y-1.5">
                            {records.map((record) => {
                              const label = diffLabel[record.differenceType]
                              return (
                                <div key={record.id} className="text-xs p-2 bg-white rounded border border-ink-100">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span className={label?.cls || 'badge-red'} style={{ fontSize: '10px' }}>
                                      {label?.text || record.differenceType}
                                    </span>
                                  </div>
                                  <div className="text-ink-500 line-through">{record.originalText}</div>
                                  <div className="text-cinnabar-600 font-medium">{record.correctedText}</div>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="p-3 text-center">
                            <p className="text-xs text-ink-400">本页无校勘记录</p>
                          </div>
                        )}

                        {(submission.status === 'pending_review' || review?.comment) && (
                          <div className="px-2 pb-2">
                            {submission.status === 'pending_review' ? (
                              <textarea
                                placeholder="页级审核意见..."
                                value={review?.comment || ''}
                                onChange={(e) => updatePageComment(page.pageNumber, e.target.value)}
                                className="w-full text-xs p-2 border border-ink-200 rounded resize-none h-16 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                              />
                            ) : (
                              submission.pageReviews?.find((r) => r.pageNumber === page.pageNumber)?.comment && (
                                <div className="text-xs p-2 bg-amber-50 border border-amber-200 rounded text-amber-800">
                                  <div className="font-medium mb-1">审核意见：</div>
                                  {submission.pageReviews.find((r) => r.pageNumber === page.pageNumber)?.comment}
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex overflow-auto">
            <div className="w-1/2 p-6 border-r border-ink-200/60 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title">原稿影像</h2>
                <div className="flex items-center gap-2">
                  <button
                    className="btn-ghost text-xs px-2"
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  >
                    上一页
                  </button>
                  <span className="text-sm text-ink-500">
                    第{currentPageData?.pageNumber || 0}页 / 共{totalPages}页
                  </span>
                  <button
                    className="btn-ghost text-xs px-2"
                    disabled={currentPage >= sortedPages.length - 1}
                    onClick={() => setCurrentPage((p) => Math.min(sortedPages.length - 1, p + 1))}
                  >
                    下一页
                  </button>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center bg-ink-50 rounded-lg overflow-hidden">
                {currentPageData?.imageUrl ? (
                  <img
                    src={currentPageData.imageUrl}
                    alt={`第${currentPageData.pageNumber}页`}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-ink-300 text-sm">暂无影像</div>
                )}
              </div>
            </div>

            <div className="w-1/2 p-6 flex flex-col overflow-auto">
              <h2 className="section-title mb-4">识别文本与校勘</h2>

              <div className="mb-4">
                <h3 className="text-sm font-medium text-ink-500 mb-2">OCR识别文本</h3>
                <div className="bg-white/60 rounded-lg p-4 border border-ink-200/40">
                  <p className="text-base font-serif leading-[1.8] text-ink-900 whitespace-pre-wrap">
                    {currentPageData?.ocrText || '暂无识别文本'}
                  </p>
                </div>
              </div>

              {getPageRecords(currentPageData?.pageNumber || 0).length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-ink-500 mb-2">
                    本页校勘记录（{getPageRecords(currentPageData?.pageNumber || 0).length}条）
                  </h3>
                  <div className="space-y-2">
                    {getPageRecords(currentPageData?.pageNumber || 0).map((record) => {
                      const label = diffLabel[record.differenceType]
                      return (
                        <div key={record.id} className="bg-white/60 rounded-lg p-3 border border-ink-200/40">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={label?.cls || 'badge-red'}>{label?.text || '未知'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-ink-500 line-through">{record.originalText}</span>
                            <span className="text-ink-300">→</span>
                            <span className="text-cinnabar-500 font-medium">{record.correctedText}</span>
                          </div>
                          {record.note && (
                            <p className="text-xs text-ink-500 mt-1.5">{record.note}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {diffReport && (
                <div className="mt-auto">
                  <h3 className="text-sm font-medium text-ink-500 mb-2">版本差异报告概览</h3>
                  <div className="card p-4 text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-ink-600">差异总数</span>
                      <span className="font-medium text-cinnabar-600">{diffReport.diffs.length}处</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-ink-600">涉及页数</span>
                      <span className="font-medium text-indigo-600">
                        {new Set(diffReport.diffs.map((d) => d.pageNumber)).size}页
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {submission.status === 'pending_review' && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-ink-200/60 bg-white/60 backdrop-blur-sm">
          <div className="flex items-center gap-3 text-sm text-ink-500">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>退回后古籍将返回校勘阶段，校勘专家可查看页级意见并修改后重新提交</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="btn-secondary flex items-center gap-1.5"
              onClick={() => setShowRejectModal(true)}
            >
              <XCircle className="w-4 h-4" />
              退回
            </button>
            <button
              className="btn-primary flex items-center gap-1.5"
              onClick={handleApprove}
            >
              <CheckCircle className="w-4 h-4" />
              通过全部
            </button>
          </div>
        </div>
      )}

      {submission.status !== 'pending_review' && submission.reviewNote && (
        <div className="px-6 py-3 border-t border-ink-200/60 bg-white/60 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-ink-500">审核备注：</span>
            <span className="text-sm text-ink-700">{submission.reviewNote}</span>
            <span className="text-xs text-ink-400 ml-auto">
              审核人：{submission.reviewerName} · {submission.reviewedAt && new Date(submission.reviewedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showRejectModal && (
          <>
            <div className="fixed inset-0 bg-ink-900/30 z-40" onClick={() => setShowRejectModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] bg-white rounded-lg shadow-xl z-50"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-ink-200/60">
                <h3 className="section-title">退回校勘</h3>
                <button className="btn-ghost px-2" onClick={() => setShowRejectModal(false)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium">退回提示</p>
                      <p className="text-xs mt-1 opacity-80">
                        退回后校勘专家将收到通知，可查看页级审核意见并修改后重新提交。
                        重新提交会生成新版本（v{submission.version + 1}），原版本记录保留。
                      </p>
                    </div>
                  </div>
                </div>
                <label className="block text-sm font-medium text-ink-700 mb-2">退回原因</label>
                <textarea
                  className="input-field h-28 resize-none"
                  placeholder="请输入整体退回原因..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
                <div className="mt-3 text-xs text-ink-400">
                  已填写页级意见 {pageReviews.filter((r) => r.comment).length} 条，
                  标记不通过 {pageReviews.filter((r) => !r.passed).length} 页
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-ink-200/60">
                <button className="btn-secondary" onClick={() => setShowRejectModal(false)}>
                  取消
                </button>
                <button
                  className="btn-primary"
                  disabled={!rejectReason.trim()}
                  onClick={handleReject}
                >
                  确认退回
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
