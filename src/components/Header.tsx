import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import type { UserRole, Message } from '@/types'
import {
  Home,
  ChevronRight,
  Bell,
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react'

const roleLabels: Record<UserRole, string> = {
  engineer: '数字化工程师',
  proofreader: '校勘专家',
  reviewer: '审校员',
  admin: '管理员',
}

const roleBadgeClasses: Record<UserRole, string> = {
  engineer: 'badge-blue',
  proofreader: 'badge-amber',
  reviewer: 'badge-green',
  admin: 'badge-red',
}

const pathLabels: Record<string, string> = {
  dashboard: '工作台',
  manuscripts: '影像管理',
  proofread: '校勘工作台',
  review: '审校复核',
  library: '电子古籍库',
  admin: '系统管理',
  standards: '质量标准',
  cycles: '校勘周期',
  monitor: '进度监控',
  alerts: '预警管理',
  performance: '绩效统计',
  messages: '消息中心',
}

function getMessageIcon(type: Message['type']) {
  switch (type) {
    case 'upload': return Upload
    case 'proofread_submit': return FileText
    case 'review_approved': return CheckCircle
    case 'review_rejected': return XCircle
    case 'alert': return AlertTriangle
  }
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}

function useBreadcrumbs() {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)
  const items: { label: string; path: string }[] = []

  let currentPath = ''
  for (const segment of segments) {
    currentPath += `/${segment}`
    const label = pathLabels[segment] || '详情'
    items.push({ label, path: currentPath })
  }

  return items
}

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser, getUnreadMessages, markAllMessagesRead } = useStore()
  const breadcrumbs = useBreadcrumbs()
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  const unreadMessages = getUnreadMessages()
  const unreadCount = unreadMessages.length
  const recentUnread = unreadMessages.slice(0, 5)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className="h-[60px] bg-white/80 backdrop-blur border-b border-ink-200/60 flex items-center px-6 shrink-0 z-40">
      <div className="flex-1 flex items-center gap-1 text-sm">
        <Link to="/dashboard" className="text-ink-400 hover:text-ink-600 transition-colors">
          <Home className="w-4 h-4" />
        </Link>
        {breadcrumbs.map((item, index) => (
          <span key={item.path} className="flex items-center gap-1">
            <ChevronRight className="w-3 h-3 text-ink-300" />
            {index === breadcrumbs.length - 1 ? (
              <span className="text-ink-800 font-medium">{item.label}</span>
            ) : (
              <Link to={item.path} className="text-ink-400 hover:text-ink-600 transition-colors">
                {item.label}
              </Link>
            )}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <span className={`badge text-xs ${roleBadgeClasses[currentUser.role]}`}>
          {roleLabels[currentUser.role]}
        </span>

        <div ref={notifRef} className="relative">
          <button
            className="relative p-1.5 text-ink-400 hover:text-ink-600 transition-colors"
            onClick={() => setNotifOpen(!notifOpen)}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-cinnabar-500 text-white text-[10px] font-medium px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-[360px] bg-white rounded-lg shadow-lg border border-ink-200/60 overflow-hidden">
              <div className="px-4 py-3 border-b border-ink-100 flex items-center justify-between">
                <span className="text-sm font-medium text-ink-900">消息通知</span>
                {unreadCount > 0 && (
                  <span className="text-xs text-cinnabar-500">{unreadCount}条未读</span>
                )}
              </div>
              <div className="max-h-[320px] overflow-y-auto">
                {recentUnread.length === 0 ? (
                  <div className="py-8 text-center text-sm text-ink-400">暂无未读消息</div>
                ) : (
                  recentUnread.map((msg) => {
                    const Icon = getMessageIcon(msg.type)
                    return (
                      <button
                        key={msg.id}
                        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-ink-50 transition-colors text-left"
                        onClick={() => {
                          setNotifOpen(false)
                          navigate('/messages')
                        }}
                      >
                        <Icon className="w-4 h-4 mt-0.5 text-ink-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-ink-800 truncate">{msg.title}</div>
                          <div className="text-xs text-ink-400 mt-0.5">{formatTime(msg.createdAt)}</div>
                        </div>
                        {!msg.isRead && (
                          <span className="w-2 h-2 rounded-full bg-cinnabar-500 shrink-0 mt-1.5" />
                        )}
                      </button>
                    )
                  })
                )}
              </div>
              <div className="px-4 py-2 border-t border-ink-100 flex items-center justify-between">
                <button
                  className="text-xs text-ink-400 hover:text-cinnabar-500 transition-colors"
                  onClick={() => {
                    markAllMessagesRead()
                  }}
                >
                  全部标记已读
                </button>
                <button
                  className="text-xs text-cinnabar-500 hover:text-cinnabar-600 transition-colors"
                  onClick={() => {
                    setNotifOpen(false)
                    navigate('/messages')
                  }}
                >
                  查看全部
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <img src={currentUser.avatar} alt="" className="w-9 h-9 rounded" />
          <span className="text-sm text-ink-700">{currentUser.name}</span>
        </div>
      </div>
    </header>
  )
}
