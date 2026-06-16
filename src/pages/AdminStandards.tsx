import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { Save } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AdminStandards() {
  const { qualityStandards, manuscripts, updateQualityStandard } = useStore()
  const [edits, setEdits] = useState<Record<string, { maxErrorRate: number; minOcrConfidence: number }>>({})

  const getEdit = (manuscriptId: string) =>
    edits[manuscriptId] ?? {
      maxErrorRate: qualityStandards.find((q) => q.manuscriptId === manuscriptId)?.maxErrorRate ?? 1,
      minOcrConfidence: qualityStandards.find((q) => q.manuscriptId === manuscriptId)?.minOcrConfidence ?? 0.8,
    }

  const handleSave = (manuscriptId: string) => {
    const data = edits[manuscriptId]
    if (data) {
      updateQualityStandard(manuscriptId, data)
      setEdits((prev) => {
        const next = { ...prev }
        delete next[manuscriptId]
        return next
      })
    }
  }

  return (
    <div className="page-enter p-6">
      <h1 className="section-title mb-6">质量标准设置</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {qualityStandards.map((qs) => {
          const ms = manuscripts.find((m) => m.id === qs.manuscriptId)
          const edit = getEdit(qs.manuscriptId)
          return (
            <motion.div
              key={qs.manuscriptId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-5"
            >
              <div className="mb-4">
                <h3 className="text-lg font-serif font-bold text-ink-900">{qs.manuscriptTitle}</h3>
                {ms && <p className="text-sm text-ink-500">{ms.dynasty}·{ms.author}</p>}
              </div>

              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-ink-600">允许识别错误率</label>
                    <span className="text-sm font-mono font-bold text-cinnabar-600">{edit.maxErrorRate.toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={edit.maxErrorRate}
                    onChange={(e) =>
                      setEdits((prev) => ({
                        ...prev,
                        [qs.manuscriptId]: { ...getEdit(qs.manuscriptId), maxErrorRate: parseFloat(e.target.value) },
                      }))
                    }
                    className="w-full h-2 bg-ink-200 rounded-lg appearance-none cursor-pointer accent-cinnabar-500"
                  />
                  <div className="flex justify-between text-xs text-ink-400 mt-1">
                    <span>0%</span><span>5%</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-ink-600">OCR最低置信度</label>
                    <span className="text-sm font-mono font-bold text-amber-600">{edit.minOcrConfidence.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.0"
                    step="0.01"
                    value={edit.minOcrConfidence}
                    onChange={(e) =>
                      setEdits((prev) => ({
                        ...prev,
                        [qs.manuscriptId]: { ...getEdit(qs.manuscriptId), minOcrConfidence: parseFloat(e.target.value) },
                      }))
                    }
                    className="w-full h-2 bg-ink-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-xs text-ink-400 mt-1">
                    <span>0.50</span><span>1.00</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => handleSave(qs.manuscriptId)}
                  disabled={!edits[qs.manuscriptId]}
                  className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Save size={16} />
                  保存
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
