import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Search, FileText, CalendarDays, UserRound } from 'lucide-react'
import { api, fmtDate } from '../api.js'
import { useAuth } from '../App.jsx'
import { Empty, Loading, PageHeader } from '../components/ui.jsx'

export default function Policies() {
  const { user } = useAuth()
  const [policies, setPolicies] = useState(null)
  const [categories, setCategories] = useState(['全部'])
  const [category, setCategory] = useState('全部')
  const [q, setQ] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    api('/policies').then((d) => setPolicies(d.policies)).catch((e) => setErr(e.message))
    api('/policies/meta').then((d) => setCategories(['全部', ...d.categories])).catch(() => {})
  }, [])

  const filtered = (policies || []).filter((p) => {
    if (category !== '全部' && p.category !== category) return false
    if (q && !(`${p.title}${p.code}${p.summary}`.toLowerCase().includes(q.toLowerCase()))) return false
    return true
  })

  return (
    <div>
      <PageHeader
        title="制度库"
        desc="只展示现行有效版本；已失效的历史版本仅行政专员可见（留档对照）"
        action={
          user.role === 'admin' ? (
            <Link to="/admin/policies" className="btn-ghost">维护制度</Link>
          ) : null
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input !pl-8" placeholder="搜索制度名称 / 编号 / 摘要" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-3 py-1.5 text-xs transition ${
                category === c ? 'bg-qinghe-600 font-medium text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-qinghe-300'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</div>}
      {!policies && !err && <Loading />}
      {policies && filtered.length === 0 && <Empty icon={BookOpen} title="没有匹配的制度" desc="换个关键词试试，或到「智能问答」直接提问" />}

      <div className="space-y-3">
        {filtered.map((p) => (
          <Link key={p.id} to={`/policies/${p.id}`} className="card block p-5 transition hover:border-qinghe-200 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[15px] font-semibold text-slate-900">{p.title}</span>
                  <span className="chip bg-qinghe-100 text-qinghe-700">{p.version}</span>
                  <span className="chip bg-slate-100 text-slate-500">{p.category}</span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500">{p.summary}</p>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1"><FileText size={12} />{p.code}</span>
                  <span className="flex items-center gap-1"><CalendarDays size={12} />生效 {fmtDate(p.effectiveDate)}</span>
                  <span className="flex items-center gap-1"><UserRound size={12} />维护人 {p.maintainer}</span>
                  <span>{p.clauses.length} 条条款</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
