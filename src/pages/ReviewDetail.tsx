import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { ArrowLeft, CheckCircle, XCircle, X, User, BookOpen } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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
  const { proofreadSubmissions, getManuscriptById, getDiffReportBySubmissionId, approveSubmission, rejectSubmission } = useStore()

  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const submission = proofreadSubmissions.find((s) => s.id === id)
  const manuscript = submission ? getManuscriptById(submission.manuscriptId) : undefined
  const diffReport = submission ? getDiffReportBySubmissionId(submission.id) : undefined
  const status = submission ? statusConfig[submission.status] : undefined

  if (!submission || !manuscript) {
    return (
      <div className="page-enter flex items-center justify-center h-full">
        <p className="text-ink-400">提交记录未找到</p>
      </div>
    )
  }

  const handleApprove = () => {
    approveSubmission(submission.id)
    navigate('/review')
  }

  const handleReject = () => {
    if (!rejectReason.trim()) return
    rejectSubmission(submission.id, rejectReason)
    setShowRejectModal(false)
    setRejectReason('')
    navigate('/review')
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

      <div className="flex-1 flex overflow-auto">
        <div className="w-1/2 p-6 border-r border-ink-200/60 overflow-auto">
          <h2 className="section-title mb-4">校勘记录</h2>
          {submission.records.length > 0 ? (
            <div className="space-y-3">
              {submission.records.map((record) => {
                const label = diffLabel[record.differenceType] || { text: '未知', cls: 'badge-red' }
                return (
                  <div key={record.id} className="card-hover p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={label.cls}>{label.text}</span>
                      <span className="text-xs text-ink-400">第{record.pageNumber}页</span>
                      <span className="text-xs text-ink-300 ml-auto">{record.expertName}</span>
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
          ) : (
            <p className="text-ink-400 text-sm">暂无校勘记录</p>
          )}
        </div>

        <div className="w-1/2 p-6 overflow-auto">
          <h2 className="section-title mb-4">版本差异报告</h2>
          {diffReport && diffReport.diffs.length > 0 ? (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-200 bg-ink-50/50">
                    <th className="text-left px-3 py-2 text-ink-600 font-medium">页码</th>
                    <th className="text-left px-3 py-2 text-ink-600 font-medium">差异类型</th>
                    <th className="text-left px-3 py-2 text-ink-600 font-medium">原文</th>
                    <th className="text-left px-3 py-2 text-ink-600 font-medium">修正文</th>
                  </tr>
                </thead>
                <tbody>
                  {diffReport.diffs.map((diff, i) => (
                    <tr key={i} className="border-b border-ink-100 last:border-0">
                      <td className="px-3 py-2 text-ink-700">第{diff.pageNumber}页</td>
                      <td className="px-3 py-2">
                        <span className={diffLabel[diff.diffType]?.cls || 'badge-red'}>
                          {diffLabel[diff.diffType]?.text || diff.diffType}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-ink-500 line-through">{diff.originalText}</td>
                      <td className="px-3 py-2 text-cinnabar-500 font-medium">{diff.correctedText}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card p-8 text-center">
              <p className="text-ink-400 text-sm">暂无差异报告</p>
            </div>
          )}

          {submission.status !== 'pending_review' && submission.reviewNote && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-ink-500 mb-2">审核备注</h3>
              <div className="card p-4">
                <p className="text-sm text-ink-700">{submission.reviewNote}</p>
                {submission.reviewerName && (
                  <p className="text-xs text-ink-400 mt-2">
                    审核人：{submission.reviewerName}
                    {submission.reviewedAt && ` · ${new Date(submission.reviewedAt).toLocaleDateString()}`}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {submission.status === 'pending_review' && (
        <div className="flex items-center justify-end gap-3 px-6 py-3 border-t border-ink-200/60 bg-white/60 backdrop-blur-sm">
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
            通过
          </button>
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
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] bg-white rounded-lg shadow-xl z-50"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-ink-200/60">
                <h3 className="section-title">退回校勘</h3>
                <button className="btn-ghost px-2" onClick={() => setShowRejectModal(false)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6">
                <label className="block text-sm font-medium text-ink-700 mb-2">退回原因</label>
                <textarea
                  className="input-field h-32 resize-none"
                  placeholder="请输入退回原因..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
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
