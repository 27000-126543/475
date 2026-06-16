import { useState, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { motion } from 'framer-motion'

const EXPERT_COLORS = ['#c0392b', '#d4a574', '#2c3e50', '#829ab1', '#a87848']

export default function Performance() {
  const { performanceRecords } = useStore()
  const [range, setRange] = useState<'7' | '30'>('7')

  const filtered = useMemo(() => {
    const now = Date.now()
    const cutoff = now - (range === '7' ? 7 : 30) * 86400000
    return performanceRecords.filter((r) => new Date(r.date).getTime() >= cutoff)
  }, [performanceRecords, range])

  const experts = useMemo(() => [...new Set(filtered.map((r) => r.expertName))], [filtered])

  const summary = useMemo(() =>
    experts.map((name) => {
      const recs = filtered.filter((r) => r.expertName === name)
      return {
        expertName: name,
        completedPages: recs.reduce((s, r) => s + r.completedPages, 0),
        passRate: recs.length ? +(recs.reduce((s, r) => s + r.passRate, 0) / recs.length).toFixed(1) : 0,
        avgProcessingTime: recs.length ? +(recs.reduce((s, r) => s + r.avgProcessingTime, 0) / recs.length).toFixed(1) : 0,
      }
    })
  , [experts, filtered])

  const barData = useMemo(() => {
    const dates = [...new Set(filtered.map((r) => r.date.slice(0, 10)))].sort()
    return dates.map((d) => {
      const entry: Record<string, string | number> = { date: d.slice(5) }
      experts.forEach((name) => {
        const rec = filtered.find((r) => r.expertName === name && r.date.slice(0, 10) === d)
        entry[name] = rec?.completedPages ?? 0
      })
      return entry
    })
  }, [filtered, experts])

  const radarData = useMemo(() => {
    if (!summary.length) return []
    const maxPages = Math.max(...summary.map((s) => s.completedPages), 1)
    const maxTime = Math.max(...summary.map((s) => s.avgProcessingTime), 1)
    const dimensions = ['completedPages', 'passRate', 'speed', 'overall']
    return dimensions.map((dim) => {
      const entry: Record<string, string | number> = { dimension: dim === 'completedPages' ? '完成页数' : dim === 'passRate' ? '通过率' : dim === 'speed' ? '处理速度' : '综合评分' }
      summary.forEach((s) => {
        let val = 0
        if (dim === 'completedPages') val = (s.completedPages / maxPages) * 100
        else if (dim === 'passRate') val = s.passRate
        else if (dim === 'speed') val = ((1 - s.avgProcessingTime / maxTime)) * 100
        else val = ((s.completedPages / maxPages) * 25 + s.passRate * 0.25 + (1 - s.avgProcessingTime / maxTime) * 25 + 25)
        entry[s.expertName] = +val.toFixed(1)
      })
      return entry
    })
  }, [summary])

  return (
    <div className="page-enter p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title">绩效统计</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setRange('7')} className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${range === '7' ? 'bg-ink-900 text-ink-50' : 'bg-ink-100 text-ink-600'}`}>近7天</button>
          <button onClick={() => setRange('30')} className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${range === '30' ? 'bg-ink-900 text-ink-50' : 'bg-ink-100 text-ink-600'}`}>近30天</button>
        </div>
      </div>

      <div className="card overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-200 bg-ink-50">
              <th className="text-left p-3 font-semibold text-ink-700">专家名</th>
              <th className="text-center p-3 font-semibold text-ink-700">完成页数</th>
              <th className="text-center p-3 font-semibold text-ink-700">通过率</th>
              <th className="text-center p-3 font-semibold text-ink-700">平均处理时长(min)</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((s) => (
              <tr key={s.expertName} className="border-b border-ink-100 hover:bg-ink-50/50 transition-colors">
                <td className="p-3 font-semibold text-ink-900">{s.expertName}</td>
                <td className="p-3 text-center text-ink-700">{s.completedPages}</td>
                <td className="p-3 text-center"><span className={`font-mono ${s.passRate >= 90 ? 'text-green-600' : 'text-amber-600'}`}>{s.passRate}%</span></td>
                <td className="p-3 text-center text-ink-700">{s.avgProcessingTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
          <h3 className="text-sm font-semibold text-ink-700 mb-4">每日完成页数</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData}>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#8a7550" />
              <YAxis tick={{ fontSize: 12 }} stroke="#8a7550" />
              <Tooltip contentStyle={{ background: '#f5f0e8', border: '1px solid #d4c9b0', borderRadius: 8 }} />
              <Legend />
              {experts.map((name, i) => (
                <Bar key={name} dataKey={name} fill={EXPERT_COLORS[i % EXPERT_COLORS.length]} radius={[2, 2, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-5">
          <h3 className="text-sm font-semibold text-ink-700 mb-4">综合能力雷达</h3>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#d4c9b0" />
              <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12 }} stroke="#8a7550" />
              <PolarRadiusAxis tick={{ fontSize: 10 }} stroke="#8a7550" />
              {experts.map((name, i) => (
                <Radar key={name} name={name} dataKey={name} stroke={EXPERT_COLORS[i % EXPERT_COLORS.length]} fill={EXPERT_COLORS[i % EXPERT_COLORS.length]} fillOpacity={0.15} />
              ))}
              <Legend />
              <Tooltip contentStyle={{ background: '#f5f0e8', border: '1px solid #d4c9b0', borderRadius: 8 }} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  )
}
