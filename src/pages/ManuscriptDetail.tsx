import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ZoomIn, Clock, FileText, Download, X, ChevronRight, FileSpreadsheet, Calendar, User } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { motion, AnimatePresence } from 'framer-motion'
import type { TrackingReportDetail } from '@/types'

const STATUS_MAP: Record<string, { label: string; badge: string }> = {
  uploading: { label: '上传中', badge: 'badge-blue' },
  ocr_processing: { label: 'OCR处理中', badge: 'badge-amber' },
  pending_supplement: { label: '待人工补录', badge: 'badge-red' },
  proofreading: { label: '校勘中', badge: 'badge-amber' },
  reviewing: { label: '审核中', badge: 'badge-amber' },
  completed: { label: '已完成', badge: 'badge-green' },
}

const FLOW_ICON: Record<string, any> = {
  upload: FileText,
  ocr_done: FileText,
  supplement: FileText,
  proofread_submit: FileText,
  review_approve: FileText,
  review_reject: FileText,
  lock: FileText,
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value > 0.85 ? 'bg-green-500' : value > 0.6 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="w-full bg-ink-800 rounded-full h-2.5">
      <div className={`h-2.5 rounded-full ${color} transition-all`} style={{ width: `${value * 100}%` }} />
    </div>
  )
}

export default function ManuscriptDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const manuscript = useStore((s) => s.getManuscriptById(id!))
  const pages = useStore((s) => s.getManuscriptPages(id!))
  const submitSupplement = useStore((s) => s.submitSupplement)
  const flowRecords = useStore((s) => s.getFlowRecordsByManuscriptId(id!))
  const trackingReports = useStore((s) => s.getTrackingReportsByManuscriptId(id!))
  const generateTrackingReport = useStore((s) => s.generateTrackingReport)
  const getTrackingReportDetail = useStore((s) => s.getTrackingReportDetail)
  const currentUser = useStore((s) => s.currentUser)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [supplementText, setSupplementText] = useState('')
  const [showTimeline, setShowTimeline] = useState(true)
  const [showReportsPanel, setShowReportsPanel] = useState(false)
  const [selectedReport, setSelectedReport] = useState<TrackingReportDetail | null>(null)
  const [generating, setGenerating] = useState(false)

  const hasPages = pages.length > 0
  const page = hasPages ? pages[currentIndex] : null
  const st = manuscript ? STATUS_MAP[manuscript.status] : null

  const taskProgress = useStore((s) => s.taskProgress.find((t) => t.manuscriptId === id))
  const currentAssignee = taskProgress?.currentAssignee || '未分配'
  const currentRoleLabel: Record<string, string> = {
    engineer: '数字化工程师',
    proofreader: '校勘专家',
    reviewer: '审校员',
    admin: '管理员',
  }

  const handleGenerateReport = () => {
    if (!manuscript) return
    setGenerating(true)
    setTimeout(() => {
      const report = generateTrackingReport(manuscript.id)
      if (report) {
        const detail = getTrackingReportDetail(report.id)
        if (detail) {
          setSelectedReport(detail)
        }
      }
      setGenerating(false)
    }, 500)
  }

  const handleViewReport = (reportId: string) => {
    const detail = getTrackingReportDetail(reportId)
    if (detail) {
      setSelectedReport(detail)
    }
  }

  if (!manuscript) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center text-ink-400">
        未找到该古籍信息
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink-950 text-ink-50 page-enter">
      <div className="p-6 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button className="btn-ghost flex items-center gap-2" onClick={() => navigate('/manuscripts')}>
              <ArrowLeft className="w-4 h-4" />
              返回
            </button>
            <h1 className="font-serif text-xl text-ink-50">{manuscript.title}</h1>
            <span className={st?.badge}>{st?.label}</span>
            <span className="text-sm text-ink-500">{manuscript.dynasty}·{manuscript.author}</span>
            {taskProgress && (
              <span className="text-xs text-ink-500 flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                当前负责人：{currentAssignee}（{currentRoleLabel[taskProgress.currentRole] || taskProgress.currentRole}）
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn-secondary flex items-center gap-2 text-sm"
              onClick={() => setShowReportsPanel(true)}
            >
              <FileSpreadsheet className="w-4 h-4" />
              追踪报告
              {trackingReports.length > 0 && (
                <span className="bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {trackingReports.length}
                </span>
              )}
            </button>
            <button
              className="btn-primary flex items-center gap-2 text-sm"
              onClick={handleGenerateReport}
              disabled={generating}
            >
              <Download className="w-4 h-4" />
              {generating ? '生成中...' : '导出追踪报告'}
            </button>
          </div>
        </div>
        <div className="ornament-line mb-4" />
      </div>

      {showTimeline && flowRecords.length > 0 && (
        <div className="px-6 pb-4">
          <div className="card bg-ink-900/50 border-ink-700 p-5">
            <h3 className="text-sm font-medium text-ink-300 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              古籍流转时间线
              <span className="text-xs text-ink-500 ml-auto">{flowRecords.length} 个节点</span>
            </h3>
            <div className="relative">
              <div className="absolute left-4 top-2 bottom-2 w-px bg-ink-700" />
              <div className="space-y-4">
                {flowRecords.map((record, idx) => {
                  const isLast = idx === flowRecords.length - 1
                  const roleLabel: Record<string, string> = {
                    engineer: '数字化工程师',
                    proofreader: '校勘专家',
                    reviewer: '审校员',
                    admin: '管理员',
                  }
                  return (
                    <div key={record.id} className="relative pl-10">
                      <div className={`absolute left-2.5 top-1 w-3 h-3 rounded-full ${
                        isLast ? 'bg-cinnabar-500 animate-pulse' : 'bg-ink-500'
                      } ring-2 ring-ink-900`} />
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-medium text-ink-100">{record.status}</span>
                            <span className="text-xs text-ink-500">
                              {record.operatorName} · {roleLabel[record.operatorRole] || record.operatorRole}
                            </span>
                          </div>
                          <p className="text-sm text-ink-400">{record.description}</p>
                        </div>
                        <span className="text-xs text-ink-600 shrink-0 ml-4">
                          {new Date(record.timestamp).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="px-6 pb-6">
        {!hasPages ? (
          <div className="card bg-ink-900/50 border-ink-700 p-12 text-center">
            <div className="animate-pulse mb-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-ink-800 flex items-center justify-center">
                <FileText className="w-8 h-8 text-ink-600" />
              </div>
            </div>
            <p className="text-ink-400">页面正在初始化中...</p>
            <p className="text-xs text-ink-600 mt-1">OCR 识别完成后即可查看页面内容</p>
          </div>
        ) : (
          <div className="flex gap-6">
            <div className="w-1/4 space-y-2 max-h-[65vh] overflow-y-auto pr-2">
              {pages.map((p, i) => (
                <div
                  key={p.id}
                  className={`relative rounded-lg overflow-hidden cursor-pointer transition-all ${
                    i === currentIndex ? 'ring-2 ring-cinnabar-500' : 'hover:opacity-80'
                  } ${p.needsSupplement ? 'ring-2 ring-red-500' : ''}`}
                  onClick={() => setCurrentIndex(i)}
                >
                  <img src={p.imageUrl} alt={`第${p.pageNumber}页`} className="w-full aspect-[3/4] object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-ink-950/80 text-center text-xs py-1">
                    第{p.pageNumber}页
                  </div>
                  {p.status === 'pending_ocr' && (
                    <div className="absolute inset-0 bg-ink-950/60 flex items-center justify-center">
                      <span className="text-xs text-ink-300">OCR中</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="w-3/4 space-y-4">
              {page && (
                <>
                  <div className="flex gap-6">
                    <div className="flex-1 card overflow-hidden">
                      <div className="relative">
                        <img src={page.imageUrl} alt={`第${page.pageNumber}页`} className="w-full object-contain max-h-80" />
                        <div className="absolute top-2 right-2 bg-ink-950/70 rounded-full p-1.5">
                          <ZoomIn className="w-4 h-4 text-ink-300" />
                        </div>
                        <div className="absolute top-2 left-2 bg-ink-950/70 rounded-full px-2 py-1 text-xs text-ink-300">
                          第 {page.pageNumber} 页
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 card p-4">
                      <h3 className="text-sm text-ink-400 mb-2">OCR识别文本</h3>
                      <div className="font-serif text-ink-100 leading-relaxed whitespace-pre-wrap text-sm max-h-72 overflow-y-auto">
                        {page.ocrText || (
                          <span className="text-ink-600 italic">
                            {page.status === 'pending_ocr' ? 'OCR识别中...' : '暂无识别文本'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {page.ocrConfidence > 0 ? (
                    <div className="card p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-ink-400">OCR置信度</span>
                        <span className={`text-sm font-mono ${
                          page.ocrConfidence > 0.85 ? 'text-green-400' :
                          page.ocrConfidence > 0.6 ? 'text-amber-400' : 'text-red-400'
                        }`}>
                          {(page.ocrConfidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <ConfidenceBar value={page.ocrConfidence} />
                    </div>
                  ) : (
                    <div className="card p-4">
                      <div className="flex items-center gap-2 text-sm text-ink-500">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        OCR置信度计算中...
                      </div>
                    </div>
                  )}

                  {page.needsSupplement && page.status !== 'supplemented' && (
                    <motion.div className="card p-4 border-red-500/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <p className="text-red-400 text-sm mb-3">⚠ 该页OCR置信度较低，需要人工补录</p>
                      <textarea
                        className="input-field w-full h-28 resize-none"
                        placeholder="请输入补录文本..."
                        value={supplementText}
                        onChange={(e) => setSupplementText(e.target.value)}
                      />
                      <button className="btn-primary mt-3" onClick={() => {
                        if (supplementText.trim()) {
                          submitSupplement(page.id, supplementText.trim())
                          setSupplementText('')
                        }
                      }}>
                        保存补录
                      </button>
                    </motion.div>
                  )}

                  {page.status === 'supplemented' && (
                    <div className="card p-4 border-green-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="badge-green">已补录</span>
                      </div>
                      <div className="font-serif text-ink-100 leading-relaxed whitespace-pre-wrap text-sm">
                        {page.supplementedText}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-2 pt-2">
                    {pages.map((_, i) => (
                      <button
                        key={i}
                        className={`w-8 h-8 rounded text-sm transition-all ${
                          i === currentIndex
                            ? 'bg-cinnabar-600 text-white'
                            : 'bg-ink-800 text-ink-400 hover:bg-ink-700'
                        }`}
                        onClick={() => setCurrentIndex(i)}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showReportsPanel && (
          <>
            <div className="fixed inset-0 bg-ink-900/40 z-40" onClick={() => setShowReportsPanel(false)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-ink-900 border-l border-ink-700 shadow-xl z-50 flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-ink-700">
                <h3 className="text-ink-100 font-semibold flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
                  追踪报告历史
                </h3>
                <button className="text-ink-400 hover:text-ink-200" onClick={() => setShowReportsPanel(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {trackingReports.length > 0 ? (
                  trackingReports.map((report) => (
                    <button
                      key={report.id}
                      onClick={() => handleViewReport(report.id)}
                      className="w-full text-left p-3 bg-ink-800/50 rounded-lg border border-ink-700 hover:border-indigo-500/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-medium text-ink-100 text-sm">v{report.version}</span>
                        <span className="text-[10px] text-ink-500 bg-ink-700 px-2 py-0.5 rounded">
                          {report.flowNodeCount}节点
                        </span>
                      </div>
                      <p className="text-xs text-ink-400 mb-2">{report.summary}</p>
                      <div className="flex items-center justify-between text-xs text-ink-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {report.generatedBy}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(report.generatedAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <FileSpreadsheet className="w-10 h-10 text-ink-700 mx-auto mb-3" />
                    <p className="text-sm text-ink-500">暂无追踪报告</p>
                    <p className="text-xs text-ink-600 mt-1">点击右上角「导出追踪报告」生成</p>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-ink-700">
                <button
                  className="btn-primary w-full flex items-center justify-center gap-2"
                  onClick={handleGenerateReport}
                  disabled={generating}
                >
                  <Download className="w-4 h-4" />
                  {generating ? '生成中...' : '生成新报告'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedReport && (
          <>
            <div className="fixed inset-0 bg-ink-900/50 z-50" onClick={() => setSelectedReport(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-12 z-50 bg-ink-900 border border-ink-700 rounded-lg shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-ink-700 bg-ink-800/50">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-semibold text-ink-100">
                    {selectedReport.basicInfo.title} - 追踪报告 v{trackingReports.find(r => r.id === selectedReport.reportId)?.version}
                  </h3>
                </div>
                <button className="text-ink-400 hover:text-ink-200" onClick={() => setSelectedReport(null)}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-ink-300 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    古籍基本信息
                  </h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-ink-800/30 rounded-lg p-3 border border-ink-700">
                      <p className="text-xs text-ink-500 mb-1">书名</p>
                      <p className="text-sm text-ink-100 font-medium">{selectedReport.basicInfo.title}</p>
                    </div>
                    <div className="bg-ink-800/30 rounded-lg p-3 border border-ink-700">
                      <p className="text-xs text-ink-500 mb-1">朝代·作者</p>
                      <p className="text-sm text-ink-100">{selectedReport.basicInfo.dynasty}·{selectedReport.basicInfo.author}</p>
                    </div>
                    <div className="bg-ink-800/30 rounded-lg p-3 border border-ink-700">
                      <p className="text-xs text-ink-500 mb-1">总页数</p>
                      <p className="text-sm text-ink-100">{selectedReport.basicInfo.totalPages}页</p>
                    </div>
                    <div className="bg-ink-800/30 rounded-lg p-3 border border-ink-700">
                      <p className="text-xs text-ink-500 mb-1">当前状态</p>
                      <p className="text-sm text-ink-100">{STATUS_MAP[selectedReport.basicInfo.status]?.label || selectedReport.basicInfo.status}</p>
                    </div>
                    <div className="bg-ink-800/30 rounded-lg p-3 border border-ink-700">
                      <p className="text-xs text-ink-500 mb-1">创建时间</p>
                      <p className="text-sm text-ink-100">{new Date(selectedReport.basicInfo.createdAt).toLocaleDateString('zh-CN')}</p>
                    </div>
                    <div className="bg-ink-800/30 rounded-lg p-3 border border-ink-700 col-span-2">
                      <p className="text-xs text-ink-500 mb-1">当前负责人</p>
                      <p className="text-sm text-ink-100">
                        {selectedReport.basicInfo.currentAssignee}
                        <span className="text-ink-500 text-xs ml-2">
                          （{currentRoleLabel[selectedReport.basicInfo.currentRole] || selectedReport.basicInfo.currentRole}）
                        </span>
                      </p>
                    </div>
                    <div className="bg-ink-800/30 rounded-lg p-3 border border-ink-700">
                      <p className="text-xs text-ink-500 mb-1">流转节点数</p>
                      <p className="text-sm text-ink-100">{selectedReport.flowRecords.length}个</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-ink-300 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    流转节点 ({selectedReport.flowRecords.length})
                  </h4>
                  <div className="bg-ink-800/30 rounded-lg border border-ink-700 p-4 max-h-60 overflow-y-auto">
                    <div className="relative">
                      <div className="absolute left-3.5 top-1 bottom-1 w-px bg-ink-600" />
                      <div className="space-y-3">
                        {selectedReport.flowRecords.map((record, idx) => {
                          const roleLabel: Record<string, string> = {
                            engineer: '数字化工程师',
                            proofreader: '校勘专家',
                            reviewer: '审校员',
                            admin: '管理员',
                          }
                          return (
                            <div key={record.id} className="relative pl-8">
                              <div className="absolute left-2 top-1 w-3 h-3 rounded-full bg-indigo-500 ring-2 ring-ink-800" />
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="text-sm text-ink-200 font-medium">{record.status}</div>
                                  <div className="text-xs text-ink-500 mt-0.5">
                                    {record.operatorName} · {roleLabel[record.operatorRole] || record.operatorRole}
                                  </div>
                                  <p className="text-xs text-ink-400 mt-1">{record.description}</p>
                                </div>
                                <span className="text-xs text-ink-500 shrink-0">
                                  {new Date(record.timestamp).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-ink-300 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    校勘提交记录 ({selectedReport.submissions.length})
                  </h4>
                  {selectedReport.submissions.length > 0 ? (
                    <div className="space-y-3">
                      {selectedReport.submissions.map((sub) => (
                        <div key={sub.id} className="bg-ink-800/30 rounded-lg border border-ink-700 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="badge-indigo">v{sub.version}</span>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                sub.status === 'approved' ? 'bg-green-900/50 text-green-400' :
                                sub.status === 'rejected' ? 'bg-red-900/50 text-red-400' :
                                'bg-amber-900/50 text-amber-400'
                              }`}>
                                {sub.status === 'approved' ? '已通过' : sub.status === 'rejected' ? '已退回' : '待审核'}
                              </span>
                            </div>
                            <span className="text-xs text-ink-500">
                              {sub.recordCount}条记录 · {sub.rejectedPages > 0 && `${sub.rejectedPages}页需修改`}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-xs text-ink-400">
                            <div>提交专家：<span className="text-ink-200">{sub.expertName}</span></div>
                            <div>提交时间：<span className="text-ink-200">{new Date(sub.createdAt).toLocaleString('zh-CN')}</span></div>
                            {sub.reviewerName && (
                              <>
                                <div>审核人：<span className="text-ink-200">{sub.reviewerName}</span></div>
                                <div>审核时间：<span className="text-ink-200">{sub.reviewedAt ? new Date(sub.reviewedAt).toLocaleString('zh-CN') : '-'}</span></div>
                              </>
                            )}
                          </div>
                          {sub.reviewNote && (
                            <div className="mt-2 p-2 bg-ink-900/50 rounded text-xs">
                              <span className="text-ink-500">审核结论：</span>
                              <span className="text-ink-300">{sub.reviewNote}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-ink-500 text-sm">暂无校勘提交记录</div>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-medium text-ink-300 mb-3 flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    下载交付记录 ({selectedReport.downloadRecords.length})
                  </h4>
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="bg-ink-800/30 rounded-lg p-3 border border-ink-700">
                      <p className="text-xs text-ink-500 mb-1">总下载次数</p>
                      <p className="text-lg text-ink-100 font-semibold">{selectedReport.totalDownloads}</p>
                    </div>
                    <div className="bg-ink-800/30 rounded-lg p-3 border border-ink-700">
                      <p className="text-xs text-ink-500 mb-1">PDF下载</p>
                      <p className="text-lg text-red-400 font-semibold">{selectedReport.pdfDownloads}</p>
                    </div>
                    <div className="bg-ink-800/30 rounded-lg p-3 border border-ink-700">
                      <p className="text-xs text-ink-500 mb-1">EPUB下载</p>
                      <p className="text-lg text-green-400 font-semibold">{selectedReport.epubDownloads}</p>
                    </div>
                  </div>
                  {selectedReport.lastDownload && (
                    <div className="bg-indigo-900/20 rounded-lg p-3 border border-indigo-700/30 flex items-center justify-between">
                      <span className="text-xs text-ink-400">最近下载</span>
                      <span className="text-sm text-ink-200">
                        {selectedReport.lastDownload.by} · {selectedReport.lastDownload.format.toUpperCase()} · {new Date(selectedReport.lastDownload.at).toLocaleString('zh-CN')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
