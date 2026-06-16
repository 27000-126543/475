import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Search, X } from 'lucide-react'
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

export default function Manuscripts() {
  const navigate = useNavigate()
  const manuscripts = useStore((s) => s.manuscripts)
  const createManuscript = useStore((s) => s.createManuscript)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', author: '', dynasty: '', totalPages: 6 })
  const [submitting, setSubmitting] = useState(false)

  const filtered = manuscripts.filter(
    (m) =>
      m.title.includes(search) ||
      m.author.includes(search) ||
      m.dynasty.includes(search)
  )

  const handleUpload = () => {
    if (!form.title.trim() || !form.author.trim() || !form.dynasty.trim() || form.totalPages < 1) return
    setSubmitting(true)
    createManuscript({
      title: form.title.trim(),
      author: form.author.trim(),
      dynasty: form.dynasty.trim(),
      totalPages: Math.max(1, Math.min(200, form.totalPages)),
    })
    setTimeout(() => {
      setSubmitting(false)
      setShowModal(false)
      setForm({ title: '', author: '', dynasty: '', totalPages: 6 })
    }, 300)
  }

  return (
    <div className="page-enter space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="section-title">古籍影像管理</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              className="input-field pl-10 w-64"
              placeholder="搜索古籍名称、作者、朝代..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn-primary flex items-center gap-2" onClick={() => setShowModal(true)}>
            <Upload className="w-4 h-4" />
            上传古籍
          </button>
        </div>
      </div>

      <div className="ornament-line" />

      <div className="grid grid-cols-3 gap-6">
        {filtered.map((m) => {
          const st = STATUS_MAP[m.status]
          return (
            <motion.div
              key={m.id}
              className="card-hover cursor-pointer overflow-hidden"
              whileHover={{ y: -4 }}
              onClick={() => navigate(`/manuscripts/${m.id}`)}
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={m.coverImage}
                  alt={m.title}
                  className="w-full h-full object-cover"
                />
                <span className={`absolute top-3 right-3 ${st.badge}`}>{st.label}</span>
              </div>
              <div className="p-4">
                <h3 className="font-serif text-lg text-ink-900 mb-1">{m.title}</h3>
                <p className="text-ink-500 text-sm mb-3">{m.dynasty}·{m.author}</p>
                <div className="flex items-center justify-between text-xs text-ink-400">
                  <span>{m.totalPages}页</span>
                  <span>{new Date(m.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <motion.div
            className="card w-full max-w-lg p-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-serif text-ink-900">上传古籍扫描影像</h2>
              <button className="btn-ghost p-1" onClick={() => setShowModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <input
                className="input-field w-full"
                placeholder="书名 *"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <input
                className="input-field w-full"
                placeholder="作者 *"
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
              />
              <input
                className="input-field w-full"
                placeholder="朝代 *"
                value={form.dynasty}
                onChange={(e) => setForm({ ...form, dynasty: e.target.value })}
              />
              <div>
                <label className="block text-sm text-ink-600 mb-1">页数</label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  className="input-field w-full"
                  value={form.totalPages}
                  onChange={(e) => setForm({ ...form, totalPages: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="border-2 border-dashed border-ink-200 rounded-lg p-8 flex flex-col items-center justify-center gap-2 text-ink-400 hover:border-cinnabar-500 transition-colors cursor-pointer bg-ink-50">
                <Upload className="w-8 h-8" />
                <span>模拟影像上传（点击上方确认即可）</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>取消</button>
              <button
                className="btn-primary"
                onClick={handleUpload}
                disabled={submitting || !form.title || !form.author || !form.dynasty}
              >
                {submitting ? '处理中...' : '确认上传'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
