import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { Upload, FileCheck, CheckCircle, XCircle, AlertTriangle, CheckCheck, Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const TABS = [
  { key: 'all', label: '全部' },
  { key: 'upload', label: '上传通知' },
  { key: 'proofread_submit', label: '校勘提交' },
  { key: 'review_approved', label: '审核通过' },
  { key: 'review_rejected', label: '审核退回' },
  { key: 'download', label: '下载记录' },
  { key: 'alert', label: '预警' },
] as const

const TYPE_ICON: Record<string, typeof Upload> = {
  upload: Upload,
  proofread_submit: FileCheck,
  review_approved: CheckCircle,
  review_rejected: XCircle,
  download: Download,
  alert: AlertTriangle,
}

const TYPE_COLOR: Record<string, string> = {
  upload: 'text-indigo-500',
  proofread_submit: 'text-amber-500',
  review_approved: 'text-green-500',
  review_rejected: 'text-cinnabar-500',
  download: 'text-emerald-500',
  alert: 'text-cinnabar-500',
}

export default function Messages() {
  const { markMessageRead, markAllMessagesRead, getMessagesByType } = useStore()
  const [activeTab, setActiveTab] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = getMessagesByType(activeTab)

  const handleClick = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
    } else {
      setExpandedId(id)
      const msg = filtered.find((m) => m.id === id)
      if (msg && !msg.isRead) markMessageRead(id)
    }
  }

  return (
    <div className="page-enter p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title">消息中心</h1>
        <button onClick={markAllMessagesRead} className="btn-ghost flex items-center gap-1.5 text-ink-500 hover:text-ink-700">
          <CheckCheck size={16} /> 全部标记已读
        </button>
      </div>

      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${
              activeTab === tab.key ? 'bg-ink-900 text-ink-50' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {filtered.map((msg, idx) => {
            const Icon = TYPE_ICON[msg.type] ?? AlertTriangle
            const color = TYPE_COLOR[msg.type] ?? 'text-ink-500'
            const isExpanded = expandedId === msg.id

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`card p-4 cursor-pointer transition-all ${!msg.isRead ? 'border-l-4 border-l-cinnabar-500' : ''}`}
                onClick={() => handleClick(msg.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 shrink-0 ${color}`}><Icon size={20} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-ink-900 truncate">{msg.title}</h3>
                      {!msg.isRead && <span className="w-2 h-2 rounded-full bg-cinnabar-500 shrink-0" />}
                    </div>
                    <p className={`text-sm text-ink-600 mt-0.5 ${isExpanded ? '' : 'line-clamp-1'}`}>{msg.content}</p>
                    {isExpanded && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3">
                        <p className="text-sm text-ink-700 whitespace-pre-wrap">{msg.content}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <span className="text-xs text-ink-400">{new Date(msg.createdAt).toLocaleString('zh-CN')}</span>
                          {msg.hasVoucher && msg.voucherUrl && (
                            <a
                              href={msg.voucherUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="btn-secondary text-xs flex items-center gap-1"
                            >
                              <Download size={12} /> 下载凭证
                            </a>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                  <span className="text-xs text-ink-400 whitespace-nowrap shrink-0">
                    {new Date(msg.createdAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="card p-12 text-center">
            <p className="text-ink-400">暂无消息</p>
          </div>
        )}
      </div>
    </div>
  )
}
