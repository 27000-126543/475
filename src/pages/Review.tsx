import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { ClipboardCheck, Eye } from 'lucide-react'

const statusConfig: Record<string, { text: string; cls: string }> = {
  pending_review: { text: '待审核', cls: 'badge-amber' },
  approved: { text: '已通过', cls: 'badge-green' },
  rejected: { text: '已退回', cls: 'badge-red' },
}

type FilterKey = 'all' | 'pending_review' | 'approved' | 'rejected'

export default function Review() {
  const navigate = useNavigate()
  const { proofreadSubmissions, manuscripts } = useStore()
  const [filter, setFilter] = useState<FilterKey>('all')

  const filtered = filter === 'all'
    ? proofreadSubmissions
    : proofreadSubmissions.filter((s) => s.status === filter)

  const counts = {
    all: proofreadSubmissions.length,
    pending_review: proofreadSubmissions.filter((s) => s.status === 'pending_review').length,
    approved: proofreadSubmissions.filter((s) => s.status === 'approved').length,
    rejected: proofreadSubmissions.filter((s) => s.status === 'rejected').length,
  }

  const filterTabs: { key: FilterKey; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'pending_review', label: '待审核' },
    { key: 'approved', label: '已通过' },
    { key: 'rejected', label: '已退回' },
  ]

  return (
    <div className="page-enter space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="w-6 h-6 text-cinnabar-500" />
          <h1 className="section-title text-2xl">审校复核</h1>
        </div>
      </div>

      <div className="ornament-line" />

      <div className="flex gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              filter === tab.key
                ? 'bg-cinnabar-500 text-white shadow-sm'
                : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
            }`}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
            <span className={`ml-1.5 text-xs ${filter === tab.key ? 'text-cinnabar-100' : 'text-ink-400'}`}>
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-200/60 bg-ink-50/50">
                <th className="text-left px-4 py-3 font-medium text-ink-600">古籍名称</th>
                <th className="text-left px-4 py-3 font-medium text-ink-600">提交专家</th>
                <th className="text-left px-4 py-3 font-medium text-ink-600">提交时间</th>
                <th className="text-center px-4 py-3 font-medium text-ink-600">页数</th>
                <th className="text-center px-4 py-3 font-medium text-ink-600">状态</th>
                <th className="text-center px-4 py-3 font-medium text-ink-600">审核操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sub) => {
                const manuscript = manuscripts.find((m) => m.id === sub.manuscriptId)
                const status = statusConfig[sub.status] || { text: '未知', cls: 'badge-red' }
                return (
                  <tr key={sub.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink-900">{manuscript?.title || '未知古籍'}</div>
                      <div className="text-xs text-ink-400 mt-0.5">{manuscript?.dynasty}·{manuscript?.author}</div>
                    </td>
                    <td className="px-4 py-3 text-ink-700">{sub.expertName}</td>
                    <td className="px-4 py-3 text-ink-600">{new Date(sub.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-center text-ink-700">{sub.totalPages}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={status.cls}>{status.text}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        className="btn-primary text-xs flex items-center gap-1 mx-auto"
                        onClick={() => navigate(`/review/${sub.id}`)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        查看详情
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <ClipboardCheck className="w-12 h-12 text-ink-300 mx-auto mb-4" />
          <p className="text-ink-400">暂无{filter === 'all' ? '' : filterTabs.find((t) => t.key === filter)?.label}审核记录</p>
        </div>
      )}
    </div>
  )
}
