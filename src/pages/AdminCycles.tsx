import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { Edit3, Check, X } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AdminCycles() {
  const { proofreadCycles, updateProofreadCycle } = useStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ startDate: '', endDate: '' })

  const startEdit = (manuscriptId: string, cycle: typeof proofreadCycles[0]) => {
    setEditingId(manuscriptId)
    setEditForm({ startDate: cycle.startDate.slice(0, 10), endDate: cycle.endDate.slice(0, 10) })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({ startDate: '', endDate: '' })
  }

  const saveEdit = (manuscriptId: string) => {
    const start = new Date(editForm.startDate)
    const end = new Date(editForm.endDate)
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    updateProofreadCycle(manuscriptId, {
      startDate: editForm.startDate,
      endDate: editForm.endDate,
      plannedDays: diff > 0 ? diff : 1,
    })
    setEditingId(null)
  }

  const minDate = proofreadCycles.length > 0 ? Math.min(...proofreadCycles.map((c) => new Date(c.startDate).getTime())) : Date.now()
  const maxDate = proofreadCycles.length > 0 ? Math.max(...proofreadCycles.map((c) => new Date(c.endDate).getTime())) : Date.now()
  const totalSpan = maxDate - minDate || 1

  return (
    <div className="page-enter p-6">
      <h1 className="section-title mb-6">校勘周期管理</h1>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-200 bg-ink-50">
              <th className="text-left p-3 font-semibold text-ink-700">古籍名</th>
              <th className="text-left p-3 font-semibold text-ink-700">计划起止日</th>
              <th className="text-center p-3 font-semibold text-ink-700">计划天数</th>
              <th className="text-left p-3 font-semibold text-ink-700" style={{ minWidth: 180 }}>当前进度</th>
              <th className="text-center p-3 font-semibold text-ink-700">状态</th>
              <th className="text-center p-3 font-semibold text-ink-700">操作</th>
            </tr>
          </thead>
          <tbody>
            {proofreadCycles.map((cycle) => (
              <tr key={cycle.manuscriptId} className="border-b border-ink-100 hover:bg-ink-50/50 transition-colors">
                <td className="p-3 font-serif font-bold text-ink-900">{cycle.manuscriptTitle}</td>
                <td className="p-3">
                  {editingId === cycle.manuscriptId ? (
                    <div className="flex items-center gap-2">
                      <input type="date" value={editForm.startDate} onChange={(e) => setEditForm((p) => ({ ...p, startDate: e.target.value }))} className="input-field text-xs py-1" />
                      <span className="text-ink-400">~</span>
                      <input type="date" value={editForm.endDate} onChange={(e) => setEditForm((p) => ({ ...p, endDate: e.target.value }))} className="input-field text-xs py-1" />
                    </div>
                  ) : (
                    <span className="text-ink-600">
                      {cycle.startDate.slice(0, 10)} ~ {cycle.endDate.slice(0, 10)}
                    </span>
                  )}
                </td>
                <td className="p-3 text-center text-ink-600">{cycle.plannedDays}天</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-ink-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${cycle.isOverdue ? 'bg-cinnabar-500' : 'bg-amber-400'}`}
                        style={{ width: `${Math.min(cycle.currentProgress, 100)}%` }}
                      />
                    </div>
                    <span className={`text-xs font-mono ${cycle.isOverdue ? 'text-cinnabar-600' : 'text-ink-600'}`}>
                      {cycle.currentProgress}%
                    </span>
                  </div>
                </td>
                <td className="p-3 text-center">
                  {cycle.isOverdue ? (
                    <span className="badge-red">超期 {cycle.overduePercentage}%</span>
                  ) : (
                    <span className="badge-green">正常</span>
                  )}
                </td>
                <td className="p-3 text-center">
                  {editingId === cycle.manuscriptId ? (
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => saveEdit(cycle.manuscriptId)} className="btn-ghost p-1 text-green-600 hover:text-green-700"><Check size={16} /></button>
                      <button onClick={cancelEdit} className="btn-ghost p-1 text-ink-400 hover:text-ink-600"><X size={16} /></button>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(cycle.manuscriptId, cycle)} className="btn-ghost text-amber-600 hover:text-amber-700 flex items-center gap-1 mx-auto">
                      <Edit3 size={14} /> 编辑
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card mt-6 p-5">
        <h3 className="text-sm font-semibold text-ink-700 mb-3">甘特时间轴</h3>
        <div className="space-y-2">
          {proofreadCycles.map((cycle) => {
            const start = new Date(cycle.startDate).getTime()
            const end = new Date(cycle.endDate).getTime()
            const left = ((start - minDate) / totalSpan) * 100
            const width = ((end - start) / totalSpan) * 100
            return (
              <motion.div key={cycle.manuscriptId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
                <span className="text-xs text-ink-600 w-24 truncate font-serif">{cycle.manuscriptTitle}</span>
                <div className="flex-1 h-6 bg-ink-100 rounded relative">
                  <div
                    className={`absolute h-full rounded ${cycle.isOverdue ? 'bg-cinnabar-400' : 'bg-amber-400'} opacity-80`}
                    style={{ left: `${left}%`, width: `${Math.max(width, 2)}%` }}
                  />
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
