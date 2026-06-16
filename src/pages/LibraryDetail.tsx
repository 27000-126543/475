import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'

export default function LibraryDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { electronicBooks, getManuscriptPages, getManuscriptById } = useStore()
  const [currentPage, setCurrentPage] = useState(0)

  const book = useMemo(() => electronicBooks.find((b) => b.id === id), [electronicBooks, id])
  const manuscript = useMemo(() => book ? getManuscriptById(book.manuscriptId) : undefined, [book, getManuscriptById])
  const pages = useMemo(() => book ? getManuscriptPages(book.manuscriptId) : [], [book, getManuscriptPages])

  const sortedPages = useMemo(() => [...pages].sort((a, b) => a.pageNumber - b.pageNumber), [pages])
  const current = sortedPages[currentPage] ?? null
  const displayText = current?.supplementedText || current?.ocrText || ''

  if (!book) {
    return (
      <div className="page-enter p-6 text-center">
        <p className="text-ink-500">古籍未找到</p>
        <button onClick={() => navigate('/library')} className="btn-primary mt-4">返回古籍库</button>
      </div>
    )
  }

  return (
    <div className="page-enter h-screen flex flex-col">
      <div className="flex items-center gap-3 p-4 border-b border-ink-200 bg-ink-50 shrink-0">
        <button onClick={() => navigate('/library')} className="btn-ghost flex items-center gap-1 text-ink-600">
          <ArrowLeft size={18} /> 返回
        </button>
        <div className="ornament-line h-5" />
        <h1 className="font-serif font-bold text-ink-900 text-lg">{book.title}</h1>
        <span className="text-sm text-ink-500">{book.bookNumber}</span>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="w-1/4 border-r border-ink-200 bg-ink-50 overflow-y-auto p-4">
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
                <p className="font-serif text-lg leading-loose text-ink-900 whitespace-pre-wrap">
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
