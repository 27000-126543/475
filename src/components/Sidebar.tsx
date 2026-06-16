import { useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import type { UserRole } from '@/types'
import {
  PenTool,
  LayoutDashboard,
  Image,
  BookOpenCheck,
  ClipboardCheck,
  Library,
  Settings,
  CalendarClock,
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
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

interface MenuItem {
  path: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRole[]
}

const menuItems: MenuItem[] = [
  { path: '/dashboard', label: '工作台', icon: LayoutDashboard, roles: ['engineer', 'proofreader', 'reviewer', 'admin'] },
  { path: '/manuscripts', label: '影像管理', icon: Image, roles: ['engineer'] },
  { path: '/proofread', label: '校勘工作台', icon: BookOpenCheck, roles: ['proofreader'] },
  { path: '/review', label: '审校复核', icon: ClipboardCheck, roles: ['reviewer'] },
  { path: '/library', label: '电子古籍库', icon: Library, roles: ['engineer', 'proofreader', 'reviewer', 'admin'] },
  { path: '/admin/standards', label: '质量标准', icon: Settings, roles: ['admin'] },
  { path: '/admin/cycles', label: '校勘周期', icon: CalendarClock, roles: ['admin'] },
  { path: '/admin/monitor', label: '进度监控', icon: Activity, roles: ['admin'] },
  { path: '/admin/alerts', label: '预警管理', icon: AlertTriangle, roles: ['admin'] },
  { path: '/performance', label: '绩效统计', icon: BarChart3, roles: ['admin'] },
  { path: '/messages', label: '消息中心', icon: Bell, roles: ['engineer', 'proofreader', 'reviewer', 'admin'] },
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser, switchRole } = useStore()

  const visibleItems = menuItems.filter((item) => item.roles.includes(currentUser.role))

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-ink-900 flex flex-col z-50">
      <div className="flex items-center gap-2 px-5 py-5">
        <PenTool className="w-6 h-6 text-amber-400" />
        <span className="font-serif text-lg text-amber-400">古籍校勘平台</span>
      </div>

      <div className="flex items-center gap-3 px-5 py-3 border-t border-ink-800">
        <img src={currentUser.avatar} alt="" className="w-8 h-8 rounded" />
        <div className="flex-1 min-w-0">
          <div className="text-sm text-ink-100 truncate">{currentUser.name}</div>
          <span className={`badge text-[10px] ${roleBadgeClasses[currentUser.role]}`}>
            {roleLabels[currentUser.role]}
          </span>
        </div>
      </div>

      <div className="px-5 py-2 border-t border-ink-800">
        <select
          className="w-full px-3 py-1.5 bg-ink-800 border border-ink-700 rounded-md text-xs text-ink-200 focus:outline-none focus:ring-2 focus:ring-cinnabar-500/20 focus:border-cinnabar-400 transition-all duration-200"
          value={currentUser.role}
          onChange={(e) => switchRole(e.target.value as UserRole)}
        >
          <option value="engineer">数字化工程师</option>
          <option value="proofreader">校勘专家</option>
          <option value="reviewer">审校员</option>
          <option value="admin">管理员</option>
        </select>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
          const Icon = item.icon
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors duration-200 ${
                isActive
                  ? 'bg-ink-800 text-ink-50'
                  : 'text-ink-300 hover:bg-ink-800 hover:text-ink-100'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-cinnabar-500" />
              )}
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="px-5 py-3 border-t border-ink-800">
        <span className="text-xs text-ink-500">© 2026 古籍数字化平台</span>
      </div>
    </aside>
  )
}
