import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { BookOpen, Clock, Send, RotateCcw, AlertCircle } from 'lucide-react'

export default function Proofread() {
  const navigate = useNavigate()
  const { manuscripts, proofreadSubmissions, getManuscriptPages, getLastSubmissionByManuscriptId } = useStore()

  const proofreadingManuscripts = manuscripts.filter((m) => m.status === 'proofreading')
  const pendingSubmissions = proofreadSubmissions.filter((s) => s.status === 'pending_review')
  const rejectedSubmissions = proofreadSubmissions.filter((s) => s.status === 'rejected')

  const stats = {
    pending: manuscripts.filter((m) => m.status === 'pending_supplement').length,
    inProgress: proofreadingManuscripts.length,
    submitted: pendingSubmissions.length,
    rejected: rejectedSubmissions.length,
  }

  return (
    <div className="page-enter space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="section-title text-2xl">校勘工作台</h1>
        <div className="flex gap-4">
          <div className="card px-4 py-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-ink-600">待校勘</span>
            <span className="text-lg font-semibold text-ink-900">{stats.pending}</span>
          </div>
          <div className="card px-4 py-2 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            <span className="text-sm text-ink-600">进行中</span>
            <span className="text-lg font-semibold text-ink-900">{stats.inProgress}</span>
          </div>
          <div className="card px-4 py-2 flex items-center gap-2">
            <Send className="w-4 h-4 text-cinnabar-500" />
            <span className="text-sm text-ink-600">已提交</span>
            <span className="text-lg font-semibold text-ink-900">{stats.submitted}</span>
          </div>
          <div className="card px-4 py-2 flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-red-500" />
            <span className="text-sm text-ink-600">已退回</span>
            <span className="text-lg font-semibold text-ink-900">{stats.rejected}</span>
          </div>
        </div>
      </div>

      <div className="ornament-line" />

      {rejectedSubmissions.length > 0 && (
        <div>
          <h2 className="section-title mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            待修改（已退回）
          </h2>
          <div className="grid gap-4">
            {rejectedSubmissions.map((sub) => {
              const manuscript = manuscripts.find((m) => m.id === sub.manuscriptId)
              const failedPages = sub.pageReviews?.filter((r) => !r.passed).length || 0
              return (
                <div
                  key={sub.id}
                  className="card-hover p-4 flex items-center justify-between border-l-4 border-red-400"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-14 rounded bg-ink-100 flex items-center justify-center overflow-hidden">
                      {manuscript?.coverImage ? (
                        <img src={manuscript.coverImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <BookOpen className="w-5 h-5 text-ink-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-ink-900 flex items-center gap-2">
                        {manuscript?.title || '未知古籍'}
                        <span className="badge-red">已退回</span>
                        <span className="badge-indigo">v{sub.version}</span>
                      </div>
                      <div className="text-xs text-ink-500 mt-1">
                        提交人：{sub.expertName} · {sub.totalPages}页 · {sub.records.length}条校勘记录
                      </div>
                      {sub.reviewNote && (
                        <div className="text-xs text-red-600 mt-1.5 bg-red-50 px-2 py-1 rounded inline-block">
                          退回原因：{sub.reviewNote}
                        </div>
                      )}
                      {failedPages > 0 && (
                        <div className="text-xs text-amber-600 mt-1">
                          {failedPages} 页需重点修改
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      className="btn-primary text-xs"
                      onClick={() => navigate(`/proofread/${sub.manuscriptId}`)}
                    >
                      重新校勘
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {proofreadingManuscripts.length > 0 && (
        <div>
          <h2 className="section-title mb-4">校勘中</h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-200/60 bg-ink-50/50">
                  <th className="text-left px-4 py-3 font-medium text-ink-600">古籍名称</th>
                  <th className="text-left px-4 py-3 font-medium text-ink-600">朝代·作者</th>
                  <th className="text-center px-4 py-3 font-medium text-ink-600">总页数</th>
                  <th className="text-center px-4 py-3 font-medium text-ink-600">校勘进度</th>
                  <th className="text-center px-4 py-3 font-medium text-ink-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {proofreadingManuscripts.map((m) => {
                  const pages = getManuscriptPages(m.id)
                  const supplemented = pages.filter((p) => p.status === 'supplemented').length
                  const progress = pages.length > 0 ? Math.round((supplemented / pages.length) * 100) : 0
                  const lastSub = getLastSubmissionByManuscriptId(m.id)
                  return (
                    <tr key={m.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-ink-900">
                        {m.title}
                        {lastSub && <span className="ml-2 badge-indigo text-xs">v{lastSub.version}</span>}
                      </td>
                      <td className="px-4 py-3 text-ink-600">{m.dynasty}·{m.author}</td>
                      <td className="px-4 py-3 text-center text-ink-700">{m.totalPages}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-24 h-1.5 bg-ink-100 rounded-full overflow-hidden">
                            <div className="h-full bg-cinnabar-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                          </div>
                          <span className="text-xs text-ink-500">{progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button className="btn-primary text-xs" onClick={() => navigate(`/proofread/${m.id}`)}>
                          开始校勘
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pendingSubmissions.length > 0 && (
        <div>
          <h2 className="section-title mb-4">待审核提交</h2>
          <div className="grid gap-4">
            {pendingSubmissions.map((sub) => {
              const manuscript = manuscripts.find((m) => m.id === sub.manuscriptId)
              return (
                <div key={sub.id} className="card-hover p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-14 rounded bg-ink-100 flex items-center justify-center overflow-hidden">
                      {manuscript?.coverImage ? (
                        <img src={manuscript.coverImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <BookOpen className="w-5 h-5 text-ink-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-ink-900">
                        {manuscript?.title || '未知古籍'}
                        <span className="ml-2 badge-indigo text-xs">v{sub.version}</span>
                      </div>
                      <div className="text-xs text-ink-500 mt-1">
                        提交人：{sub.expertName} · {sub.totalPages}页 · {new Date(sub.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="badge-amber">待审核</span>
                    <span className="text-xs text-ink-400">{sub.records.length}条校勘记录</span>
                    <button className="btn-ghost text-xs" onClick={() => navigate(`/proofread/${sub.manuscriptId}`)}>
                      查看
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {proofreadingManuscripts.length === 0 && pendingSubmissions.length === 0 && rejectedSubmissions.length === 0 && (
        <div className="card p-12 text-center">
          <BookOpen className="w-12 h-12 text-ink-300 mx-auto mb-4" />
          <p className="text-ink-400">暂无校勘任务</p>
        </div>
      )}
    </div>
  )
}
