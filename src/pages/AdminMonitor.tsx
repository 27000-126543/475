import { useStore } from '@/store/useStore'
import { Clock, User } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AdminMonitor() {
  const { taskProgress } = useStore()

  const getBarColor = (elapsedRatio: number, progressPercentage: number) => {
    if (elapsedRatio > 120) return 'bg-cinnabar-500'
    if (elapsedRatio > 100) return 'bg-amber-500'
    if (progressPercentage > 80) return 'bg-green-500'
    return 'bg-amber-400'
  }

  return (
    <div className="page-enter p-6">
      <h1 className="section-title mb-6">进度监控看板</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {taskProgress.map((task, idx) => {
          const elapsedRatio = task.plannedDuration > 0 ? (task.elapsedDuration / task.plannedDuration) * 100 : 0
          const critical = elapsedRatio > 120
          const overdue = elapsedRatio > 100
          return (
            <motion.div
              key={task.manuscriptId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`card p-5 relative ${critical ? 'animate-pulse-red' : ''}`}
            >
              {critical && (
                <div className="absolute inset-0 rounded-xl border-2 border-cinnabar-500 animate-pulse pointer-events-none" />
              )}

              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-serif font-bold text-ink-900 text-lg">{task.manuscriptTitle}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      task.status === '进行中' ? 'bg-amber-100 text-amber-700' :
                      task.status === '已完成' ? 'bg-green-100 text-green-700' :
                      'bg-ink-100 text-ink-600'
                    }`}>
                      {task.status}
                    </span>
                    {overdue && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        critical ? 'bg-cinnabar-100 text-cinnabar-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        超时 {Math.round(elapsedRatio - 100)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-ink-600 mb-4">
                <User size={14} />
                <span>{task.currentAssignee}</span>
                <span className="text-ink-300">|</span>
                <span className="text-ink-500">{task.currentRole === 'proofreader' ? '校勘员' : task.currentRole === 'reviewer' ? '审核员' : task.currentRole}</span>
              </div>

              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-ink-500">进度</span>
                  <span className={`text-sm font-mono font-bold ${
                    critical ? 'text-cinnabar-600' : overdue ? 'text-amber-600' : 'text-ink-700'
                  }`}>
                    {task.progressPercentage}%
                  </span>
                </div>
                <div className="h-2.5 bg-ink-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getBarColor(elapsedRatio, task.progressPercentage)}`}
                    style={{ width: `${Math.min(task.progressPercentage, 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-ink-500 mt-2">
                <Clock size={12} />
                <span>已用 <strong className="text-ink-700">{task.elapsedDuration}</strong> 天 / 计划 <strong className="text-ink-700">{task.plannedDuration}</strong> 天</span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
