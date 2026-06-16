import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { Bell, CheckCircle, Send } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminAlerts() {
  const { taskProgress, proofreadCycles, pushAlertToAdmin, getAdminUser } = useStore()
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const alerts: Array<{ id: string; title: string; desc: string; level: string; percentage: number }> = []

  taskProgress.forEach((t) => {
    const elapsedRatio = t.plannedDuration > 0 ? (t.elapsedDuration / t.plannedDuration) * 100 : 0
    if (elapsedRatio > 120) {
      alerts.push({
        id: `task-${t.manuscriptId}`,
        title: `任务超期预警：${t.manuscriptTitle}`,
        desc: `当前负责人${t.currentAssignee}，已用${t.elapsedDuration}天，计划${t.plannedDuration}天，超时${Math.round(elapsedRatio - 100)}%`,
        level: elapsedRatio > 150 ? '严重' : '警告',
        percentage: elapsedRatio,
      })
    }
  })

  proofreadCycles.forEach((c) => {
    if (c.isOverdue && c.overduePercentage > 20) {
      const existing = alerts.find((a) => a.id === `cycle-${c.manuscriptId}`)
      if (!existing) {
        alerts.push({
          id: `cycle-${c.manuscriptId}`,
          title: `校勘周期超期：${c.manuscriptTitle}`,
          desc: `当前进度${c.currentProgress}%，超期${c.overduePercentage}%`,
          level: c.overduePercentage > 50 ? '严重' : '警告',
          percentage: c.overduePercentage,
        })
      }
    }
  })

  const handlePushAlert = (alert: typeof alerts[0]) => {
    pushAlertToAdmin(alert.title, alert.desc, alert.id.startsWith('task-') ? alert.id.replace('task-', '') : undefined)
  }

  const handleDismiss = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id))
  }

  const levelColor = (level: string) => {
    if (level === '严重') return 'bg-cinnabar-100 text-cinnabar-700'
    if (level === '警告') return 'bg-amber-100 text-amber-700'
    return 'bg-indigo-100 text-indigo-600'
  }

  const admin = getAdminUser()

  return (
    <div className="page-enter p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title">预警管理</h1>
        {admin && (
          <span className="text-xs text-ink-400">预警将推送至管理员：{admin.name}</span>
        )}
      </div>
      {alerts.length === 0 ? (
        <div className="card p-12 text-center">
          <CheckCircle size={48} className="mx-auto text-green-400 mb-3" />
          <p className="text-ink-500">暂无预警信息</p>
          <p className="text-xs text-ink-400 mt-2">当已用时长超过计划时长 120% 时将自动显示</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {alerts.filter((a) => !dismissed.has(a.id)).map((alert, idx) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="card p-4 flex items-stretch gap-4"
              >
                <div className="w-1 rounded-full bg-cinnabar-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Bell size={16} className="text-cinnabar-500 shrink-0" />
                    <h3 className="font-bold text-ink-900 truncate">{alert.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${levelColor(alert.level)}`}>
                      {alert.level}
                    </span>
                  </div>
                  <p className="text-sm text-ink-600">{alert.desc}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => handlePushAlert(alert)} className="btn-primary text-sm flex items-center gap-1">
                    <Send size={14} /> 推送提醒
                  </button>
                  <button onClick={() => handleDismiss(alert.id)} className="btn-secondary text-sm flex items-center gap-1">
                    <CheckCircle size={14} /> 标记已处理
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
