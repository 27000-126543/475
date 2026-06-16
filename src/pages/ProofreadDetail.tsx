import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { ArrowLeft, ChevronLeft, ChevronRight, ZoomIn, Send, FileText, X, AlertTriangle, History, CheckCircle, XCircle, MessageSquare, Plus, Edit2, Trash2, Save } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ProofreadRecord } from '@/types'

const diffLabel: Record<string, { text: string; cls: string }> = {
  wrong_char: { text: '错字', cls: 'badge-red' },
  missing_char: { text: '漏字', cls: 'badge-amber' },
  extra_char: { text: '多字', cls: 'badge-blue' },
  derivative: { text: '衍文', cls: 'badge-green' },
}

const diffTypes: Array<'wrong_char' | 'missing_char' | 'extra_char' | 'derivative'> = ['wrong_char', 'missing_char', 'extra_char', 'derivative']

export default function ProofreadDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    currentUser,
    getManuscriptById,
    getManuscriptPages,
    getDiffReportBySubmissionId,
    submitProofread,
    resubmitProofreadWithCarry,
    getSubmissionsByManuscriptId,
  } = useStore()

  const manuscript = getManuscriptById(id!)
  const pages = getManuscriptPages(id!)
  const allSubmissions = useMemo(() => getSubmissionsByManuscriptId(id || ''), [id, getSubmissionsByManuscriptId])
  const lastSubmission = allSubmissions.length > 0 ? allSubmissions[0] : undefined
  const isResubmit = lastSubmission?.status === 'rejected'

  const [currentPage, setCurrentPage] = useState(0)
  const [showSubmitDrawer, setShowSubmitDrawer] = useState(false)
  const [showDiffModal, setShowDiffModal] = useState(false)
  const [showHistoryPanel, setShowHistoryPanel] = useState(false)
  const [submitNote, setSubmitNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editingRecords, setEditingRecords] = useState<ProofreadRecord[]>([])
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null)

  const sortedPages = useMemo(() => [...pages].sort((a, b) => a.pageNumber - b.pageNumber), [pages])
  const page = sortedPages[currentPage]

  const diffReport = lastSubmission ? getDiffReportBySubmissionId(lastSubmission.id) : undefined
  const pageRecords = useMemo(() => {
    if (isResubmit && editingRecords.length > 0) {
      return editingRecords.filter((r) => r.pageNumber === page?.pageNumber)
    }
    return lastSubmission?.records.filter((r) => r.pageNumber === page?.pageNumber) || []
  }, [editingRecords, lastSubmission, page?.pageNumber, isResubmit])

  const pageReview = lastSubmission?.pageReviews?.find((r) => r.pageNumber === page?.pageNumber)
  const isPageRejected = pageReview && !pageReview.passed

  useEffect(() => {
    if (isResubmit && lastSubmission && editingRecords.length === 0) {
      setEditingRecords(lastSubmission.records.map((r) => ({ ...r })))
    }
  }, [isResubmit, lastSubmission, editingRecords.length])

  const handleAddRecord = () => {
    if (!page || !manuscript) return
    const newRecord: ProofreadRecord = {
      id: `new-${Date.now()}-${Math.random()}`,
      manuscriptId: id!,
      expertId: currentUser.id,
      expertName: currentUser.name,
      pageNumber: page.pageNumber,
      originalText: page.ocrText?.slice(0, 6) || '天地玄黃',
      correctedText: page.ocrText?.slice(0, 6) || '天地玄黃',
      differenceType: 'wrong_char',
      note: '',
      createdAt: new Date().toISOString(),
    }
    setEditingRecords([...editingRecords, newRecord])
    setEditingRecordId(newRecord.id)
  }

  const handleUpdateRecord = (recordId: string, updates: Partial<ProofreadRecord>) => {
    setEditingRecords(editingRecords.map((r) => (r.id === recordId ? { ...r, ...updates } : r)))
  }

  const handleDeleteRecord = (recordId: string) => {
    setEditingRecords(editingRecords.filter((r) => r.id !== recordId))
    if (editingRecordId === recordId) {
      setEditingRecordId(null)
    }
  }

  const handleSubmit = () => {
    if (!id || !manuscript) return
    setSubmitting(true)

    if (isResubmit && lastSubmission) {
      const finalRecords = editingRecords.length > 0 ? editingRecords : lastSubmission.records.map((r) => ({ ...r }))
      resubmitProofreadWithCarry(lastSubmission.id, finalRecords, submitNote || '重新提交审核')
    } else {
      const autoRecords = sortedPages.slice(0, Math.min(5, sortedPages.length)).map((p, i) => ({
        id: `auto-${id}-p${p.pageNumber}-${Date.now()}-${i}`,
        manuscriptId: id,
        expertId: currentUser.id,
        expertName: currentUser.name,
        pageNumber: p.pageNumber,
        originalText: p.ocrText?.slice(0, 6) || '天地玄黃',
        correctedText: p.ocrText?.slice(0, 6) || '天地玄黃',
        differenceType: diffTypes[i % 4],
        note: `第1版校勘 - 第${p.pageNumber}页`,
        createdAt: new Date().toISOString(),
      }))
      submitProofread(id, autoRecords, submitNote || '提交审核')
    }

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
          {lastSubmission && (
            <span className="badge-indigo">
              {isResubmit ? `重新提交 v${lastSubmission.version + 1}` : `当前 v${lastSubmission.version}`}
            </span>
          )}
          {isResubmit && (
            <span className="badge-amber text-xs">
              编辑模式 · 共 {editingRecords.length} 条记录
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {allSubmissions.length > 0 && (
            <button
              className="btn-ghost text-sm flex items-center gap-1.5"
              onClick={() => setShowHistoryPanel(!showHistoryPanel)}
            >
              <History className="w-4 h-4" />
              版本历史
            </button>
          )}
          <button className="btn-ghost px-2" disabled={currentPage === 0} onClick={() => setCurrentPage((p) => p - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-ink-600 min-w-[80px] text-center">
            {currentPage + 1} / {sortedPages.length}
          </span>
          <button className="btn-ghost px-2" disabled={currentPage >= sortedPages.length - 1} onClick={() => setCurrentPage((p) => p + 1)}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isResubmit && lastSubmission && (
        <div className="px-6 py-3 bg-red-50 border-b border-red-200/60">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-red-800">上次审核被退回</span>
                <span className="text-xs text-red-600">v{lastSubmission.version}</span>
                <span className="text-xs text-red-500">
                  {lastSubmission.reviewedAt && new Date(lastSubmission.reviewedAt).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-red-700">
                <span className="font-medium">退回原因：</span>
                {lastSubmission.reviewNote}
              </p>
              {lastSubmission.pageReviews && lastSubmission.pageReviews.filter((r) => !r.passed).length > 0 && (
                <p className="text-xs text-red-600 mt-1">
                  共 {lastSubmission.pageReviews.filter((r) => !r.passed).length} 页需重点修改
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/2 p-6 border-r border-ink-200/60 flex flex-col">
          <div className="flex-1 flex items-center justify-center bg-ink-50 rounded-lg overflow-hidden relative">
            {page?.imageUrl ? (
              <img src={page.imageUrl} alt={`第${page.pageNumber}页`} className="max-w-full max-h-full object-contain" />
            ) : (
              <div className="text-ink-300 text-sm">暂无影像</div>
            )}
            {pageReview && !pageReview.passed && (
              <div className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" />
                需修改
              </div>
            )}
            {pageReview && pageReview.passed && lastSubmission?.status === 'approved' && (
              <div className="absolute top-3 right-3 bg-green-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                已通过
              </div>
            )}
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-ink-400">
            <ZoomIn className="w-3 h-3" />
            <span>可使用浏览器缩放查看细节</span>
          </div>
        </div>

        <div className="w-1/2 p-6 flex flex-col overflow-auto">
          {pageReview && (pageReview.comment || !pageReview.passed) && (
            <div className={`mb-4 p-3 border rounded-lg ${isPageRejected ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className={`w-4 h-4 ${isPageRejected ? 'text-red-600' : 'text-amber-600'}`} />
                <span className={`text-sm font-medium ${isPageRejected ? 'text-red-800' : 'text-amber-800'}`}>
                  审校员意见
                </span>
                {!pageReview.passed && <span className="text-xs text-red-600">（本页需修改）</span>}
              </div>
              <p className={`text-sm ${isPageRejected ? 'text-red-900' : 'text-amber-900'}`}>
                {pageReview.comment || '审校员标记本页需要修改，但未填写具体意见'}
              </p>
            </div>
          )}

          <div className="mb-4">
            <h3 className="text-sm font-medium text-ink-500 mb-2">识别文本</h3>
            <div className="bg-white/60 rounded-lg p-4 border border-ink-200/40">
              <p className="text-lg font-serif leading-[1.8] text-ink-900 whitespace-pre-wrap">
                {page?.ocrText || '暂无识别文本'}
              </p>
              {page?.ocrConfidence !== undefined && page.ocrConfidence > 0 && (
                <div className="mt-3 text-xs text-ink-400">
                  识别置信度：{Math.round(page.ocrConfidence * 100)}%
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-ink-500">
                校勘记录 <span className="text-cinnabar-500">（{pageRecords.length}条）</span>
              </h3>
              {isResubmit && (
                <button
                  className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  onClick={handleAddRecord}
                >
                  <Plus className="w-3.5 h-3.5" />
                  新增记录
                </button>
              )}
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {pageRecords.length === 0 ? (
                <div className="text-center py-8 text-ink-400 text-sm">
                  {isResubmit ? '本页暂无数勘记录，点击上方新增' : '本页暂无数勘记录'}
                </div>
              ) : (
                pageRecords.map((record) => {
                  const label = diffLabel[record.differenceType] || { text: '未知', cls: 'badge-red' }
                  const isEditing = editingRecordId === record.id
                  return (
                    <div
                      key={record.id}
                      className={`rounded-lg p-3 border transition-colors ${
                        isEditing
                          ? 'bg-indigo-50 border-indigo-300'
                          : 'bg-white/60 border-ink-200/40 hover:border-ink-300'
                      }`}
                    >
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <select
                              className="text-xs border border-ink-200 rounded px-2 py-1 bg-white"
                              value={record.differenceType}
                              onChange={(e) =>
                                handleUpdateRecord(record.id, {
                                  differenceType: e.target.value as ProofreadRecord['differenceType'],
                                })
                              }
                            >
                              {diffTypes.map((t) => (
                                <option key={t} value={t}>
                                  {diffLabel[t]?.text || t}
                                </option>
                              ))}
                            </select>
                            <span className="text-xs text-ink-400">第{record.pageNumber}页</span>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <label className="text-xs text-ink-500 block mb-1">原文</label>
                              <input
                                type="text"
                                className="input-field text-sm py-1.5"
                                value={record.originalText}
                                onChange={(e) => handleUpdateRecord(record.id, { originalText: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-ink-500 block mb-1">修正文</label>
                              <input
                                type="text"
                                className="input-field text-sm py-1.5 text-cinnabar-600 font-medium"
                                value={record.correctedText}
                                onChange={(e) => handleUpdateRecord(record.id, { correctedText: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-ink-500 block mb-1">备注</label>
                              <textarea
                                className="input-field text-sm py-1.5 resize-none h-16"
                                value={record.note}
                                onChange={(e) => handleUpdateRecord(record.id, { note: e.target.value })}
                                placeholder="添加校勘备注..."
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                              onClick={() => handleDeleteRecord(record.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              删除
                            </button>
                            <button
                              className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                              onClick={() => setEditingRecordId(null)}
                            >
                              <Save className="w-3.5 h-3.5" />
                              完成
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={label.cls}>{label.text}</span>
                              <span className="text-xs text-ink-400">第{record.pageNumber}页</span>
                            </div>
                            {isResubmit && (
                              <button
                                className="text-xs text-ink-400 hover:text-indigo-600 flex items-center gap-1"
                                onClick={() => setEditingRecordId(record.id)}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                编辑
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-ink-500 line-through">{record.originalText}</span>
                            <span className="text-ink-300">→</span>
                            <span className="text-cinnabar-500 font-medium">{record.correctedText}</span>
                          </div>
                          {record.note && (
                            <p className="text-xs text-ink-500 mt-1.5">{record.note}</p>
                          )}
                        </>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showHistoryPanel && (
            <>
              <div className="fixed inset-0 bg-ink-900/20 z-30" onClick={() => setShowHistoryPanel(false)} />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                className="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-xl z-40 flex flex-col"
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-ink-200/60">
                  <h3 className="section-title">版本历史</h3>
                  <button className="btn-ghost px-2" onClick={() => setShowHistoryPanel(false)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {allSubmissions.map((sub, idx) => (
                    <div
                      key={sub.id}
                      className={`p-4 rounded-lg border ${
                        idx === 0 ? 'border-indigo-300 bg-indigo-50/50' : 'border-ink-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-ink-900">v{sub.version}</span>
                        <span
                          className={
                            sub.status === 'approved'
                              ? 'badge-green text-xs'
                              : sub.status === 'rejected'
                              ? 'badge-red text-xs'
                              : 'badge-amber text-xs'
                          }
                        >
                          {sub.status === 'approved' ? '已通过' : sub.status === 'rejected' ? '已退回' : '待审核'}
                        </span>
                      </div>
                      <div className="text-xs text-ink-500 space-y-1">
                        <p>提交人：{sub.expertName}</p>
                        <p>提交时间：{new Date(sub.createdAt).toLocaleString()}</p>
                        <p>校勘记录：{sub.records.length}条</p>
                        {sub.reviewedAt && (
                          <p>审核时间：{new Date(sub.reviewedAt).toLocaleString()}</p>
                        )}
                        {sub.reviewNote && (
                          <div className="mt-2 p-2 bg-ink-50 rounded text-ink-600">
                            <p className="font-medium mb-0.5">审核备注：</p>
                            <p className="text-xs">{sub.reviewNote}</p>
                          </div>
                        )}
                      </div>
                      {idx === 0 && <div className="mt-2 text-xs text-indigo-600 font-medium">当前版本</div>}
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-end gap-3 px-6 py-3 border-t border-ink-200/60 bg-white/60 backdrop-blur-sm">
        {diffReport && (
          <button className="btn-secondary flex items-center gap-1.5" onClick={() => setShowDiffModal(true)}>
            <FileText className="w-4 h-4" />
            {isResubmit ? '查看上次差异报告' : '查看差异报告'}
          </button>
        )}
        <button className="btn-primary flex items-center gap-1.5" onClick={() => setShowSubmitDrawer(true)}>
          <Send className="w-4 h-4" />
          {isResubmit ? '重新提交校勘' : '提交校勘'}
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
                <h3 className="section-title">
                  {isResubmit ? `重新提交 (v${(lastSubmission?.version || 0) + 1})` : '提交校勘'}
                </h3>
                <button className="btn-ghost px-2" onClick={() => setShowSubmitDrawer(false)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 p-6 overflow-auto">
                {isResubmit && lastSubmission && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm font-medium text-amber-800 mb-1">上一版本信息</p>
                    <p className="text-xs text-amber-700">
                      v{lastSubmission.version} · {lastSubmission.records.length}条校勘记录
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      重新提交将生成新版本，原版本记录保留
                    </p>
                    {editingRecords.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-amber-200/50 text-xs text-amber-700">
                        当前编辑中：{editingRecords.length} 条记录
                      </div>
                    )}
                  </div>
                )}
                <label className="block text-sm font-medium text-ink-700 mb-2">校勘备注</label>
                <textarea
                  className="input-field h-40 resize-none"
                  placeholder={isResubmit ? '请说明本次修改的主要内容...' : '请输入校勘备注...'}
                  value={submitNote}
                  onChange={(e) => setSubmitNote(e.target.value)}
                />
                <div className="mt-4 text-xs text-ink-400 space-y-1">
                  <p>• 提交后将发送至审校员进行审核</p>
                  <p>• 系统将自动生成版本差异报告</p>
                  {isResubmit && <p>• 新版本号：v{(lastSubmission?.version || 0) + 1}</p>}
                </div>
              </div>
              <div className="px-6 py-4 border-t border-ink-200/60">
                <button
                  className="btn-primary w-full"
                  disabled={submitting}
                  onClick={handleSubmit}
                >
                  {submitting ? '提交中...' : isResubmit ? '确认重新提交' : '确认提交'}
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
                <h3 className="section-title">
                  版本差异报告 {lastSubmission && <span className="text-sm text-ink-400 ml-2">v{lastSubmission.version}</span>}
                </h3>
                <button className="btn-ghost px-2" onClick={() => setShowDiffModal(false)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6">
                {diffReport.diffs.some(d => d.changeType) && (
                  <div className="grid grid-cols-4 gap-3 mb-6">
                    <div className="bg-ink-50 rounded-lg p-3 border border-ink-200 text-center">
                      <p className="text-xs text-ink-500 mb-1">总计</p>
                      <p className="text-xl font-bold text-ink-900">{diffReport.diffs.length}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200 text-center">
                      <p className="text-xs text-green-600 mb-1">沿用</p>
                      <p className="text-xl font-bold text-green-700">
                        {diffReport.diffs.filter(d => d.changeType === 'carried').length}
                      </p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-200 text-center">
                      <p className="text-xs text-amber-600 mb-1">修改</p>
                      <p className="text-xl font-bold text-amber-700">
                        {diffReport.diffs.filter(d => d.changeType === 'modified').length}
                      </p>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200 text-center">
                      <p className="text-xs text-indigo-600 mb-1">新增</p>
                      <p className="text-xl font-bold text-indigo-700">
                        {diffReport.diffs.filter(d => d.changeType === 'new').length}
                      </p>
                    </div>
                  </div>
                )}
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ink-200">
                      <th className="text-left px-3 py-2 text-ink-600 font-medium">页码</th>
                      <th className="text-left px-3 py-2 text-ink-600 font-medium">变化类型</th>
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
                          {diff.changeType === 'carried' && (
                            <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">沿用</span>
                          )}
                          {diff.changeType === 'modified' && (
                            <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700">修改</span>
                          )}
                          {diff.changeType === 'new' && (
                            <span className="text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">新增</span>
                          )}
                          {!diff.changeType && (
                            <span className="text-xs px-2 py-0.5 rounded bg-ink-100 text-ink-600">差异</span>
                          )}
                        </td>
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
