import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { ArrowLeft, ChevronLeft, ChevronRight, Download, FileText, BookOpen, Hash, Calendar, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function LibraryDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { electronicBooks, getManuscriptPages, getManuscriptById, getDownloadRecordsByBookId, recordDownload, getLastDownloadByBookId } = useStore()
  const [currentPage, setCurrentPage] = useState(0)
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false)

  const book = useMemo(() => electronicBooks.find((b) => b.id === id), [electronicBooks, id])
  const manuscript = useMemo(() => (book ? getManuscriptById(book.manuscriptId) : undefined), [book, getManuscriptById])
  const pages = useMemo(() => (book ? getManuscriptPages(book.manuscriptId) : []), [book, getManuscriptPages])
  const downloadRecords = useMemo(() => (book ? getDownloadRecordsByBookId(book.id) : []), [book, getDownloadRecordsByBookId])
  const lastDownload = useMemo(() => (book ? getLastDownloadByBookId(book.id) : undefined), [book, getLastDownloadByBookId])
  const pdfCount = useMemo(() => downloadRecords.filter(r => r.format === 'pdf').length, [downloadRecords])
  const epubCount = useMemo(() => downloadRecords.filter(r => r.format === 'epub').length, [downloadRecords])

  const sortedPages = useMemo(() => [...pages].sort((a, b) => a.pageNumber - b.pageNumber), [pages])
  const current = sortedPages[currentPage] ?? null
  const displayText = current?.supplementedText || current?.ocrText || ''

  const handleDownload = (format: 'pdf' | 'epub') => {
    if (book) {
      recordDownload(book.id, format)
    }
    setShowDownloadDropdown(false)
  }

  if (!book) {
    return (
      <div className="page-enter p-6 text-center">
        <p className="text-ink-500">古籍未找到</p>
        <button onClick={() => navigate('/library')} className="btn-primary mt-4">
          返回古籍库
        </button>
      </div>
    )
  }

  return (
    <div className="page-enter h-screen flex flex-col -m-6">
      <div className="flex items-center gap-3 px-6 py-3 border-b border-ink-200 bg-white/60 backdrop-blur-sm shrink-0">
        <button onClick={() => navigate('/library')} className="btn-ghost flex items-center gap-1 text-ink-600">
          <ArrowLeft size={18} /> 返回
        </button>
        <div className="ornament-line h-5" />
        <h1 className="font-serif font-bold text-ink-900 text-lg">{book.title}</h1>
        <span className="text-sm text-ink-500">{book.bookNumber}</span>
        <span className="badge-indigo">v{book.version}</span>
        <div className="ml-auto flex items-center gap-3">
          <div className="relative">
            <button
              className="btn-primary flex items-center gap-2"
              onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
            >
              <Download size={16} />
              下载交付包
            </button>
            <AnimatePresence>
              {showDownloadDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowDownloadDropdown(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute right-0 top-full mt-2 bg-white border border-ink-200 rounded-lg shadow-xl overflow-hidden z-20 min-w-[160px]"
                  >
                    <button
                      onClick={() => handleDownload('pdf')}
                      className="w-full px-4 py-3 text-sm text-ink-700 hover:bg-indigo-50 text-left flex items-center gap-3 border-b border-ink-100"
                    >
                      <FileText className="w-5 h-5 text-red-500" />
                      <div>
                        <div className="font-medium">PDF 格式</div>
                        <div className="text-xs text-ink-400">高清影印版</div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleDownload('epub')}
                      className="w-full px-4 py-3 text-sm text-ink-700 hover:bg-indigo-50 text-left flex items-center gap-3"
                    >
                      <BookOpen className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="font-medium">EPUB 格式</div>
                        <div className="text-xs text-ink-400">流式阅读版</div>
                      </div>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="w-72 border-r border-ink-200 bg-ink-50/50 overflow-y-auto flex flex-col">
          <div className="p-4 border-b border-ink-200/60">
            <h3 className="text-sm font-semibold text-ink-700 mb-3">书籍信息</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2 text-ink-600">
                <Hash className="w-4 h-4 text-ink-400" />
                <span className="text-ink-500">编号：</span>
                <span className="font-mono">{book.bookNumber}</span>
              </div>
              <div className="flex items-center gap-2 text-ink-600">
                <BookOpen className="w-4 h-4 text-ink-400" />
                <span className="text-ink-500">版本：</span>
                <span>v{book.version}</span>
              </div>
              <div className="flex items-center gap-2 text-ink-600">
                <User className="w-4 h-4 text-ink-400" />
                <span className="text-ink-500">锁定人：</span>
                <span>{book.lockedBy}</span>
              </div>
              <div className="flex items-center gap-2 text-ink-600">
                <Calendar className="w-4 h-4 text-ink-400" />
                <span className="text-ink-500">锁定时间：</span>
                <span>{new Date(book.lockedAt).toLocaleDateString('zh-CN')}</span>
              </div>
              {manuscript && (
                <div className="flex items-center gap-2 text-ink-600">
                  <FileText className="w-4 h-4 text-ink-400" />
                  <span className="text-ink-500">总页数：</span>
                  <span>{manuscript.totalPages}页</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-b border-ink-200/60">
            <h3 className="text-sm font-semibold text-ink-700 mb-3">下载统计</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white rounded-lg p-3 border border-ink-200/40 text-center">
                <div className="text-2xl font-bold text-indigo-600">{book.downloadCount}</div>
                <div className="text-xs text-ink-500 mt-1">累计</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-ink-200/40 text-center">
                <div className="text-lg font-bold text-red-500">{pdfCount}</div>
                <div className="text-xs text-ink-500 mt-1">PDF</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-ink-200/40 text-center">
                <div className="text-lg font-bold text-green-600">{epubCount}</div>
                <div className="text-xs text-ink-500 mt-1">EPUB</div>
              </div>
            </div>
            {lastDownload && (
              <div className="mt-3 p-2.5 bg-indigo-50/50 rounded-lg border border-indigo-200/40">
                <div className="text-xs text-ink-500 mb-1">最近下载</div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-ink-700">{lastDownload.downloadedBy}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    lastDownload.format === 'pdf' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                  }`}>
                    {lastDownload.format.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-ink-400 mt-1">
                  {new Date(lastDownload.downloadedAt).toLocaleString('zh-CN')}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 flex-1">
            <h3 className="text-sm font-semibold text-ink-700 mb-3">
              下载记录 <span className="text-ink-400 font-normal">({downloadRecords.length})</span>
            </h3>
            {downloadRecords.length > 0 ? (
              <div className="space-y-2">
                {downloadRecords.slice(0, 10).map((record) => (
                  <div
                    key={record.id}
                    className="bg-white rounded-lg p-2.5 border border-ink-200/40 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-ink-700">{record.downloadedBy}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          record.format === 'pdf'
                            ? 'bg-red-50 text-red-600'
                            : 'bg-green-50 text-green-600'
                        }`}
                      >
                        {record.format.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-ink-400">
                      {new Date(record.downloadedAt).toLocaleString('zh-CN')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Download className="w-8 h-8 text-ink-200 mx-auto mb-2" />
                <p className="text-xs text-ink-400">暂无下载记录</p>
              </div>
            )}
          </div>
        </div>

        <div className="w-48 border-r border-ink-200 bg-ink-50 overflow-y-auto p-4">
          <h3 className="text-sm font-semibold text-ink-700 mb-3">目录</h3>
          <div className="space-y-0.5">
            {sortedPages.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => setCurrentPage(idx)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  idx === currentPage
                    ? 'bg-ink-900 text-ink-50 font-medium'
                    : 'text-ink-600 hover:bg-ink-100'
                }`}
              >
                第 {p.pageNumber} 页
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto bg-ink-50/30">
          {current ? (
            <motion.div
              key={current.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-2xl w-full"
            >
              <div className="card p-8">
                <div className="text-xs text-ink-400 mb-4 text-center">
                  第 {current.pageNumber} 页
                </div>
                <p className="font-serif text-lg leading-loose text-ink-900 whitespace-pre-wrap text-center">
                  {displayText || '（本页暂无文本内容）'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="btn-ghost flex items-center gap-1 disabled:opacity-30"
                >
                  <ChevronLeft size={16} /> 上一页
                </button>
                <span className="text-sm text-ink-500 font-mono">
                  {currentPage + 1} / {sortedPages.length}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(sortedPages.length - 1, currentPage + 1))}
                  disabled={currentPage === sortedPages.length - 1}
                  className="btn-ghost flex items-center gap-1 disabled:opacity-30"
                >
                  下一页 <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          ) : (
            <p className="text-ink-400">暂无页面内容</p>
          )}
        </div>
      </div>
    </div>
  )
}
