import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ZoomIn } from 'lucide-react'
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

  const [currentIndex, setCurrentIndex] = useState(0)
  const [supplementText, setSupplementText] = useState('')

  if (!manuscript || pages.length === 0) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center text-ink-400">
        未找到该古籍信息
      </div>
    )
  }

  const page = pages[currentIndex]
  const st = STATUS_MAP[manuscript.status]
  const confidenceColor = page.ocrConfidence > 0.85
    ? 'text-green-500'
    : page.ocrConfidence > 0.6
      ? 'text-amber-500'
      : 'text-red-500'

  const handleSupplement = () => {
    if (supplementText.trim()) {
      submitSupplement(page.id, supplementText.trim())
      setSupplementText('')
    }
  }

  return (
    <div className="min-h-screen bg-ink-950 text-ink-50 p-8 page-enter">
      <div className="flex items-center gap-4 mb-6">
        <button className="btn-ghost flex items-center gap-2" onClick={() => navigate('/manuscripts')}>
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>
        <h1 className="font-serif text-xl text-ink-50">{manuscript.title}</h1>
        <span className={st.badge}>{st.label}</span>
      </div>

      <div className="ornament-line mb-6" />

      <div className="flex gap-6">
        <div className="w-1/4 space-y-2 max-h-[70vh] overflow-y-auto pr-2">
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
            </div>
          ))}
        </div>

        <div className="w-3/4 space-y-6">
          <div className="flex gap-6">
            <div className="flex-1 card overflow-hidden">
              <div className="relative">
                <img src={page.imageUrl} alt={`第${page.pageNumber}页`} className="w-full object-contain max-h-80" />
                <div className="absolute top-2 right-2 bg-ink-950/70 rounded-full p-1.5">
                  <ZoomIn className="w-4 h-4 text-ink-300" />
                </div>
              </div>
            </div>

            <div className="flex-1 card p-4">
              <h3 className="text-sm text-ink-400 mb-2">OCR识别文本</h3>
              <div className="font-serif text-ink-100 leading-relaxed whitespace-pre-wrap text-sm max-h-72 overflow-y-auto">
                {page.ocrText}
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-ink-400">OCR置信度</span>
              <span className={`text-sm font-mono ${confidenceColor}`}>
                {(page.ocrConfidence * 100).toFixed(1)}%
              </span>
            </div>
            <ConfidenceBar value={page.ocrConfidence} />
          </div>

          {page.needsSupplement && page.status !== 'supplemented' && (
            <motion.div className="card p-4 border-red-500/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="text-red-400 text-sm mb-3">⚠ 该页OCR置信度较低，需要人工补录</p>
              <textarea
                className="input-field w-full h-28 resize-none"
                placeholder="请输入补录文本..."
                value={supplementText}
                onChange={(e) => setSupplementText(e.target.value)}
              />
              <button className="btn-primary mt-3" onClick={handleSupplement}>
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
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mt-6">
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
    </div>
  )
}
