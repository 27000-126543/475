import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { ArrowLeft, ChevronLeft, ChevronRight, ZoomIn, Send, FileText, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const diffLabel: Record<string, { text: string; cls: string }> = {
  wrong_char: { text: '错字', cls: 'badge-red' },
  missing_char: { text: '漏字', cls: 'badge-amber' },
  extra_char: { text: '多字', cls: 'badge-blue' },
  derivative: { text: '衍文', cls: 'badge-green' },
}

export default function ProofreadDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentUser, getManuscriptById, getManuscriptPages, proofreadSubmissions, getDiffReportBySubmissionId, submitProofread } = useStore()

  const manuscript = getManuscriptById(id!)
  const pages = getManuscriptPages(id!)
  const [currentPage, setCurrentPage] = useState(0)
  const [showSubmitDrawer, setShowSubmitDrawer] = useState(false)
  const [showDiffModal, setShowDiffModal] = useState(false)
  const [submitNote, setSubmitNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const page = pages[currentPage]
  const submission = proofreadSubmissions.find((s) => s.manuscriptId === id)
  const diffReport = submission ? getDiffReportBySubmissionId(submission.id) : undefined
  const pageRecords = submission?.records.filter((r) => r.pageNumber === page?.pageNumber) || []

  const handleSubmit = () => {
    if (!id || !manuscript) return
    setSubmitting(true)
    const diffTypes: Array<'wrong_char' | 'missing_char' | 'extra_char' | 'derivative'> = ['wrong_char', 'missing_char', 'extra_char', 'derivative']
    const autoRecords = pages.slice(0, Math.min(5, pages.length)).map((p, i) => ({
      id: `auto-${id}-p${p.pageNumber}-${Date.now()}-${i}`,
      manuscriptId: id,
      expertId: currentUser.id,
      expertName: currentUser.name,
      pageNumber: p.pageNumber,
      originalText: p.ocrText?.slice(0, 6) || '天地玄黃',
      correctedText: p.ocrText?.slice(0, 6) || '天地玄黃',
      differenceType: diffTypes[i % 4],
      note: `自动模拟第${p.pageNumber}页校勘差异`,
      createdAt: new Date().toISOString(),
    }))
    submitProofread(id, autoRecords, submitNote || '提交审核')
    setTimeout(() => {
      setSubmitting(false)
      setShowSubmitDrawer(false)
      setSubmitNote('')
      navigate('/proofread')
    }, 500)
  }

  if (!manuscript) {
    return (
      <div className="page-enter flex items-center justify-center h-full">
        <p className="text-ink-400">古籍未找到</p>
      </div>
    )
  }

  return (
    <div className="page-enter flex flex-col h-full -m-6">
      <div className="flex items-center justify-between px-6 py-3 border-b border-ink-200/60 bg-white/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button className="btn-ghost px-2" onClick={() => navigate('/proofread')}>
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="section-title">{manuscript.title}</h1>
          <span className="text-sm text-ink-400">{manuscript.dynasty}·{manuscript.author}</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost px-2" disabled={currentPage === 0} onClick={() => setCurrentPage((p) => p - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-ink-600 min-w-[80px] text-center">
            {currentPage + 1} / {pages.length}
          </span>
          <button className="btn-ghost px-2" disabled={currentPage >= pages.length - 1} onClick={() => setCurrentPage((p) => p + 1)}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/2 p-6 border-r border-ink-200/60 flex flex-col">
          <div className="flex-1 flex items-center justify-center bg-ink-50 rounded-lg overflow-hidden">
            {page?.imageUrl ? (
              <img src={page.imageUrl} alt={`第${page.pageNumber}页`} className="max-w-full max-h-full object-contain" />
            ) : (
              <div className="text-ink-300 text-sm">暂无影像</div>
            )}
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-ink-400">
            <ZoomIn className="w-3 h-3" />
            <span>可使用浏览器缩放查看细节</span>
          </div>
        </div>

        <div className="w-1/2 p-6 flex flex-col overflow-auto">
          <div className="mb-4">
            <h3 className="text-sm font-medium text-ink-500 mb-2">识别文本</h3>
            <div className="bg-white/60 rounded-lg p-4 border border-ink-200/40">
              <p className="text-lg font-serif leading-[1.8] text-ink-900 whitespace-pre-wrap">
                {page?.ocrText || '暂无识别文本'}
              </p>
              {page?.ocrConfidence !== undefined && (
                <div className="mt-3 text-xs text-ink-400">
                  识别置信度：{Math.round(page.ocrConfidence * 100)}%
                </div>
              )}
            </div>
          </div>

          {pageRecords.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-ink-500 mb-2">校勘记录</h3>
              <div className="space-y-3">
                {pageRecords.map((record) => {
                  const label = diffLabel[record.differenceType] || { text: '未知', cls: 'badge-red' }
                  return (
                    <div key={record.id} className="bg-white/60 rounded-lg p-3 border border-ink-200/40">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={label.cls}>{label.text}</span>
                        <span className="text-xs text-ink-400">第{record.pageNumber}页</span>
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
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 px-6 py-3 border-t border-ink-200/60 bg-white/60 backdrop-blur-sm">
        {diffReport && (
          <button className="btn-secondary flex items-center gap-1.5" onClick={() => setShowDiffModal(true)}>
            <FileText className="w-4 h-4" />
            查看差异报告
          </button>
        )}
        <button className="btn-primary flex items-center gap-1.5" onClick={() => setShowSubmitDrawer(true)}>
          <Send className="w-4 h-4" />
          提交校勘
        </button>
      </div>

      <AnimatePresence>
        {showSubmitDrawer && (
          <>
            <div className="fixed inset-0 bg-ink-900/30 z-40" onClick={() => setShowSubmitDrawer(false)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-xl z-50 flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-ink-200/60">
                <h3 className="section-title">提交校勘</h3>
                <button className="btn-ghost px-2" onClick={() => setShowSubmitDrawer(false)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 p-6">
                <label className="block text-sm font-medium text-ink-700 mb-2">校勘备注</label>
                <textarea
                  className="input-field h-40 resize-none"
                  placeholder="请输入校勘备注..."
                  value={submitNote}
                  onChange={(e) => setSubmitNote(e.target.value)}
                />
              </div>
              <div className="px-6 py-4 border-t border-ink-200/60">
                <button
                  className="btn-primary w-full"
                  disabled={submitting}
                  onClick={handleSubmit}
                >
                  {submitting ? '提交中...' : '确认提交'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDiffModal && diffReport && (
          <>
            <div className="fixed inset-0 bg-ink-900/30 z-40" onClick={() => setShowDiffModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-8 z-50 bg-white rounded-lg shadow-xl overflow-auto"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-ink-200/60 sticky top-0 bg-white">
                <h3 className="section-title">版本差异报告</h3>
                <button className="btn-ghost px-2" onClick={() => setShowDiffModal(false)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ink-200">
                      <th className="text-left px-3 py-2 text-ink-600 font-medium">页码</th>
                      <th className="text-left px-3 py-2 text-ink-600 font-medium">差异类型</th>
                      <th className="text-left px-3 py-2 text-ink-600 font-medium">原文</th>
                      <th className="text-left px-3 py-2 text-ink-600 font-medium">修正文</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diffReport.diffs.map((diff, i) => (
                      <tr key={i} className="border-b border-ink-100">
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
