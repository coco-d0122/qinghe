import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, FileText, CalendarDays, UserRound, History, ChevronDown } from 'lucide-react'
import { api, fmtDate } from '../api.js'
import { Loading, PageHeader } from '../components/ui.jsx'

function Clause({ c, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-xl border border-slate-100">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition hover:bg-slate-50">
        <span className="rounded-md bg-qinghe-50 px-1.5 py-0.5 text-xs font-semibold text-qinghe-700">第{c.no}条</span>
        <span className="text-sm font-medium text-slate-800">{c.title}</span>
        <ChevronDown size={15} className={`ml-auto text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="border-t border-slate-100 px-4 py-3.5 text-[13px] leading-relaxed text-slate-600">{c.text}</p>}
    </div>
  )
}

export default function PolicyDetail() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    api(`/policies/${id}`).then(setData).catch((e) => setErr(e.message))
  }, [id])

  if (err) return <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</div>
  if (!data) return <Loading />

  const { policy: p, history } = data

  return (
    <div>
      <Link to="/policies" className="mb-4 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-qinghe-600">
        <ArrowLeft size={13} /> 返回制度库
      </Link>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            {p.title}
            <span className="chip bg-qinghe-100 text-qinghe-700">{p.version}</span>
            {p.status !== 'active' && <span className="chip bg-red-50 text-red-600">已失效 · 仅留档</span>}
          </span>
        }
        desc={p.summary}
      />

      <div className="card mb-5 grid grid-cols-2 gap-4 p-5 text-sm md:grid-cols-4">
        <div><div className="label !mb-0.5 flex items-center gap-1"><FileText size={11} />制度编号</div><div className="font-medium text-slate-700">{p.code}</div></div>
        <div><div className="label !mb-0.5 flex items-center gap-1"><CalendarDays size={11} />生效日期</div><div className="font-medium text-slate-700">{fmtDate(p.effectiveDate)}</div></div>
        <div><div className="label !mb-0.5 flex items-center gap-1"><CalendarDays size={11} />失效日期</div><div className="font-medium text-slate-700">{p.expireDate ? fmtDate(p.expireDate) : '—（现行有效）'}</div></div>
        <div><div className="label !mb-0.5 flex items-center gap-1"><UserRound size={11} />维护人</div><div className="font-medium text-slate-700">{p.maintainer} · 行政专员</div></div>
      </div>

      <div className="card p-5">
        <div className="mb-3 text-sm font-semibold text-slate-700">条款正文</div>
        <div className="space-y-2">
          {p.clauses.map((c, i) => <Clause key={c.no} c={c} defaultOpen={i === 0} />)}
        </div>
      </div>

      {p.revisionNote && (
        <div className="card mt-4 border-amber-100 bg-amber-50/60 p-4">
          <div className="text-xs font-semibold text-amber-700">修订说明</div>
          <p className="mt-1 text-xs leading-relaxed text-amber-800/80">{p.revisionNote}</p>
        </div>
      )}

      {history?.length > 0 && (
        <div className="card mt-4 p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700"><History size={14} className="text-slate-400" />版本沿革</div>
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.id} className="flex items-center gap-3 text-xs">
                <span className="chip bg-slate-100 text-slate-600">{h.version}</span>
                <span className="text-slate-400">{fmtDate(h.effectiveDate)} ~ {h.expireDate ? fmtDate(h.expireDate) : '至今'}</span>
                <span className={`chip ${h.status === 'active' ? 'bg-qinghe-100 text-qinghe-700' : 'bg-slate-50 text-slate-400'}`}>
                  {h.status === 'active' ? '现行有效' : '已失效'}
                </span>
                <Link to={`/policies/${h.id}`} className="text-qinghe-600 hover:underline">查看</Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
