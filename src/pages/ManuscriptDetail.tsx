import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ZoomIn, Clock, User, MessageSquare, FileText, ChevronRight } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { motion } from 'framer-motion'

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

  const [currentIndex, setCurrentIndex] = useState(0)
  const [supplementText, setSupplementText] = useState('')
  const [showTimeline, setShowTimeline] = useState(true)

  if (!manuscript) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center text-ink-400">
        未找到该古籍信息
      </div>
    )
  }

  const hasPages = pages.length > 0
  const page = hasPages ? pages[currentIndex] : null
  const st = STATUS_MAP[manuscript.status]

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
            <span className={st.badge}>{st.label}</span>
            <span className="text-sm text-ink-500">{manuscript.dynasty}·{manuscript.author}</span>
          </div>
          <button
            className="btn-secondary flex items-center gap-2 text-sm"
            onClick={() => setShowTimeline(!showTimeline)}
          >
            <Clock className="w-4 h-4" />
            流转记录 {showTimeline ? '收起' : '展开'}
          </button>
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
    </div>
  )
}
