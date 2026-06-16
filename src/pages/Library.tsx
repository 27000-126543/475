import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { Download, ChevronDown, FileText, BookOpen, Clock } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Library() {
  const { getLockedElectronicBooks, recordDownload } = useStore()
  const electronicBooks = getLockedElectronicBooks()
  const navigate = useNavigate()
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const handleDownload = (bookId: string, format: 'pdf' | 'epub') => {
    recordDownload(bookId, format)
    setOpenMenu(null)
  }

  return (
    <div className="page-enter p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title">电子古籍库</h1>
        <div className="text-sm text-ink-500">
          共 {electronicBooks.length} 部已锁定电子古籍
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {electronicBooks.map((book, idx) => (
          <motion.div
            key={book.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
            className="card-hover cursor-pointer group"
            onClick={() => navigate(`/library/${book.id}`)}
          >
            <div className="aspect-[16/10] bg-ink-200 rounded-t-xl overflow-hidden relative">
              <img
                src={`https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese+ancient+manuscript+book+cover+calligraphy+traditional+binding+vintage+paper+texture&image_size=landscape_16_9`}
                alt={book.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-2 left-2 bg-ink-900/70 text-ink-50 text-xs px-2 py-0.5 rounded">
                {book.bookNumber}
              </div>
              <div className="absolute top-2 right-2 bg-indigo-600/90 text-white text-xs px-2 py-0.5 rounded">
                v{book.version}
              </div>
              {book.downloadCount > 0 && (
                <div className="absolute bottom-2 right-2 bg-white/80 text-ink-600 text-xs px-2 py-0.5 rounded flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  {book.downloadCount}次
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-serif font-bold text-ink-900 text-lg mb-1">{book.title}</h3>
              <p className="text-sm text-ink-500 mb-3">{book.bookNumber}</p>
              <div className="flex items-center justify-between text-xs text-ink-400 mb-3">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>锁定于 {new Date(book.lockedAt).toLocaleDateString('zh-CN')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>v{book.version}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-ink-400">
                  {book.lastDownloadedAt
                    ? `最近下载：${new Date(book.lastDownloadedAt).toLocaleDateString('zh-CN')}`
                    : '暂无人下载'}
                </div>
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setOpenMenu(openMenu === book.id ? null : book.id)}
                    className="btn-primary text-sm flex items-center gap-1"
                  >
                    <Download size={14} /> 下载 <ChevronDown size={12} />
                  </button>
                  {openMenu === book.id && (
                    <div className="absolute right-0 bottom-full mb-1 bg-white border border-ink-200 rounded-lg shadow-lg overflow-hidden z-10 min-w-[120px]">
                      <button
                        onClick={() => handleDownload(book.id, 'pdf')}
                        className="block w-full px-4 py-2 text-sm text-ink-700 hover:bg-indigo-50 text-left flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4 text-red-500" />
                        PDF 格式
                      </button>
                      <button
                        onClick={() => handleDownload(book.id, 'epub')}
                        className="block w-full px-4 py-2 text-sm text-ink-700 hover:bg-indigo-50 text-left flex items-center gap-2"
                      >
                        <BookOpen className="w-4 h-4 text-green-600" />
                        EPUB 格式
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
