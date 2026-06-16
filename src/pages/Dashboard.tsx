import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  PenTool, FileUp, ScanLine, FileEdit, CheckCircle, AlertTriangle,
  BookOpen, Loader2, ClipboardCheck, RotateCcw, Eye, ThumbsUp,
  XCircle, Bell, Upload, ChevronRight,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import type { UserRole } from '@/types'

const roleLabels: Record<UserRole, string> = {
  engineer: '数字化工程师',
  proofreader: '校勘专家',
  reviewer: '审校员',
  admin: '管理员',
}

const statsConfig: Record<UserRole, { icon: React.ElementType; label: string; color: string; filter: (m: any[], s: any[], t?: any[]) => number }[]> = {
  engineer: [
    { icon: FileUp, label: '待上传', color: 'bg-indigo-500/20 text-indigo-400', filter: (m) => m.filter((x: any) => x.status === 'uploading').length },
    { icon: ScanLine, label: 'OCR处理中', color: 'bg-amber-500/20 text-amber-400', filter: (m) => m.filter((x: any) => x.status === 'ocr_processing').length },
    { icon: FileEdit, label: '待补录', color: 'bg-cinnabar-500/20 text-cinnabar-400', filter: (m) => m.filter((x: any) => x.status === 'pending_supplement').length },
    { icon: CheckCircle, label: '已完成', color: 'bg-green-500/20 text-green-400', filter: (m) => m.filter((x: any) => x.status === 'completed').length },
  ],
  proofreader: [
    { icon: ClipboardCheck, label: '待校勘', color: 'bg-indigo-500/20 text-indigo-400', filter: (m) => m.filter((x: any) => x.status === 'proofreading').length },
    { icon: Loader2, label: '校勘中', color: 'bg-amber-500/20 text-amber-400', filter: (_m, s) => s.filter((x: any) => x.status === 'pending_review').length },
    { icon: CheckCircle, label: '已提交', color: 'bg-green-500/20 text-green-400', filter: (_m, s) => s.filter((x: any) => x.status === 'approved').length },
    { icon: RotateCcw, label: '退回待修', color: 'bg-cinnabar-500/20 text-cinnabar-400', filter: (_m, s) => s.filter((x: any) => x.status === 'rejected').length },
  ],
  reviewer: [
    { icon: Eye, label: '待审核', color: 'bg-indigo-500/20 text-indigo-400', filter: (_m, s) => s.filter((x: any) => x.status === 'pending_review').length },
    { icon: ThumbsUp, label: '已通过', color: 'bg-green-500/20 text-green-400', filter: (_m, s) => s.filter((x: any) => x.status === 'approved').length },
    { icon: XCircle, label: '已退回', color: 'bg-cinnabar-500/20 text-cinnabar-400', filter: (_m, s) => s.filter((x: any) => x.status === 'rejected').length },
    { icon: AlertTriangle, label: '需关注', color: 'bg-amber-500/20 text-amber-400', filter: (m) => m.filter((x: any) => x.status === 'pending_supplement').length },
  ],
  admin: [
    { icon: BookOpen, label: '总古籍数', color: 'bg-indigo-500/20 text-indigo-400', filter: (m) => m.length },
    { icon: Loader2, label: '进行中', color: 'bg-amber-500/20 text-amber-400', filter: (m) => m.filter((x: any) => !['completed'].includes(x.status)).length },
    { icon: CheckCircle, label: '已完成', color: 'bg-green-500/20 text-green-400', filter: (m) => m.filter((x: any) => x.status === 'completed').length },
    { icon: AlertTriangle, label: '预警数', color: 'bg-cinnabar-500/20 text-cinnabar-400', filter: (_m, _s, t) => t!.filter((x: any) => x.isAlerted).length },
  ],
}

function CountUp({ value }: { value: number }) {
  return (
    <motion.span
      className="text-3xl font-bold text-ink-50"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      key={value}
      transition={{ duration: 0.5 }}
    >
      {value}
    </motion.span>
  )
}

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  return `${days}天前`
}

const msgIcon: Record<string, React.ElementType> = {
  upload: Upload,
  proofread_submit: ClipboardCheck,
  review_approved: ThumbsUp,
  review_rejected: XCircle,
  alert: AlertTriangle,
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }

export default function Dashboard() {
  const navigate = useNavigate()
  const { currentUser, manuscripts, proofreadSubmissions, taskProgress, getUnreadMessages, getMessagesByType } = useStore()
  const role = currentUser.role
  const unread = getUnreadMessages()

  const stats = useMemo(
    () => statsConfig[role].map((c) => ({ ...c, value: c.filter(manuscripts, proofreadSubmissions, taskProgress) })),
    [role, manuscripts, proofreadSubmissions, taskProgress]
  )

  const todos = useMemo(() => {
    if (role === 'engineer') {
      return manuscripts
        .filter((m) => ['uploading', 'ocr_processing', 'pending_supplement'].includes(m.status))
        .map((m) => ({ id: m.id, title: m.title, desc: m.status === 'uploading' ? '待上传影像' : m.status === 'ocr_processing' ? 'OCR识别中' : '待补录文字', urgent: m.status === 'pending_supplement', path: `/manuscripts/${m.id}` }))
    }
    if (role === 'proofreader') {
      return [
        ...manuscripts.filter((m) => m.status === 'proofreading').map((m) => ({ id: m.id, title: m.title, desc: '待校勘', urgent: true, path: `/proofread/${m.id}` })),
        ...proofreadSubmissions.filter((s) => s.status === 'rejected').map((s) => ({ id: s.id, title: `${s.expertName}的提交`, desc: '已退回待修', urgent: false, path: `/proofread/${s.manuscriptId}` })),
      ]
    }
    if (role === 'reviewer') {
      return proofreadSubmissions
        .filter((s) => s.status === 'pending_review')
        .map((s) => ({ id: s.id, title: s.expertName + '的校勘提交', desc: '待审核', urgent: true, path: `/review/${s.id}` }))
    }
    return manuscripts
      .filter((m) => m.status !== 'completed')
      .map((m) => ({ id: m.id, title: m.title, desc: m.status, urgent: taskProgress.some((t) => t.manuscriptId === m.id && t.isAlerted), path: `/manuscripts/${m.id}` }))
  }, [role, manuscripts, proofreadSubmissions, taskProgress])

  const userMessages = useMemo(
    () => getMessagesByType('all').slice(0, 5),
    [getMessagesByType]
  )

  const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

  return (
    <div className="page-enter p-6 space-y-6">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={item} className="card bg-gradient-to-r from-ink-900 to-ink-800 p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold text-ink-50">你好，{currentUser.name}</h1>
            <p className="text-ink-300 mt-1">{today} · {roleLabels[role]}</p>
          </div>
          <PenTool className="w-10 h-10 text-ink-500/40" />
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="card p-4 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.color}`}>
                <s.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-ink-400 text-sm">{s.label}</p>
                <CountUp value={s.value} />
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div variants={item} className="flex gap-6">
          <div className="card flex-[2] p-5">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="section-title !mb-0">待办事项</h2>
              <span className="badge-red text-xs">{todos.length}</span>
            </div>
            <div className="space-y-2">
              {todos.slice(0, 6).map((t) => (
                <div
                  key={t.id}
                  onClick={() => navigate(t.path)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-ink-50/50 cursor-pointer transition-colors"
                >
                  <div className={`w-1 h-8 rounded-full ${t.urgent ? 'bg-cinnabar-500' : 'bg-indigo-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-ink-900 font-medium truncate">{t.title}</p>
                    <p className="text-ink-400 text-xs">{t.desc}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${t.urgent ? 'bg-cinnabar-100 text-cinnabar-600' : 'bg-indigo-100 text-indigo-600'}`}>
                    {t.urgent ? '紧急' : '普通'}
                  </span>
                </div>
              ))}
              {todos.length === 0 && <p className="text-ink-400 text-sm py-4 text-center">暂无待办事项</p>}
            </div>
          </div>

          <div className="card flex-1 p-5">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="section-title !mb-0">最新消息</h2>
              {unread.length > 0 && <span className="badge-red text-xs">{unread.length}</span>}
            </div>
            <div className="space-y-3">
              {userMessages.map((msg) => {
                const Icon = msgIcon[msg.type] || Bell
                return (
                  <div key={msg.id} className="flex items-start gap-2">
                    <Icon className="w-4 h-4 mt-0.5 text-ink-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink-900 truncate">{msg.title}</p>
                      <p className="text-xs text-ink-400">{relativeTime(msg.createdAt)}</p>
                    </div>
                    {!msg.isRead && <div className="w-2 h-2 rounded-full bg-cinnabar-500 mt-1.5 shrink-0" />}
                  </div>
                )
              })}
              {userMessages.length === 0 && <p className="text-ink-400 text-sm py-4 text-center">暂无消息</p>}
            </div>
            <button onClick={() => navigate('/messages')} className="flex items-center gap-1 text-sm text-cinnabar-500 hover:text-cinnabar-600 mt-4">
              查看全部 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {role === 'admin' && (
          <motion.div variants={item} className="card p-5">
            <h2 className="section-title mb-4">任务进度概览</h2>
            <div className="space-y-3">
              {taskProgress.map((t) => (
                <div key={t.manuscriptId} className="flex items-center gap-4">
                  <div className="w-32 shrink-0">
                    <p className="text-sm font-medium text-ink-900 truncate">{t.manuscriptTitle}</p>
                    <p className="text-xs text-ink-400">{t.currentAssignee}</p>
                  </div>
                  <div className="flex-1 h-3 bg-ink-100 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${t.isAlerted || t.elapsedDuration > t.plannedDuration ? 'bg-cinnabar-500' : 'bg-amber-400'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${t.progressPercentage}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                    />
                  </div>
                  <span className={`text-sm font-medium w-12 text-right ${t.isAlerted || t.elapsedDuration > t.plannedDuration ? 'text-cinnabar-500' : 'text-ink-600'}`}>
                    {t.progressPercentage}%
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
