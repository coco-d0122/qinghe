import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, History, Ban, FileText } from 'lucide-react'
import { api, fmtDate } from '../api.js'
import { Loading, Modal, PageHeader } from '../components/ui.jsx'

const emptyClause = () => ({ no: '', title: '', text: '', keywords: [] })

/** 新建制度 / 发布新版 的编辑弹窗 */
function PolicyEditor({ open, base, onClose, onSaved }) {
  const isVersion = !!base
  const [form, setForm] = useState({
    code: '', title: '', category: '', version: '', effectiveDate: new Date().toISOString().slice(0, 10),
    summary: '', revisionNote: '', clauses: [emptyClause()],
  })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    if (base) {
      setForm({
        code: base.code, title: base.title, category: base.category, version: '',
        effectiveDate: new Date().toISOString().slice(0, 10),
        summary: base.summary, revisionNote: '',
        clauses: base.clauses.map((c) => ({ ...c, keywords: c.keywords || [] })),
      })
    } else {
      setForm({ code: '', title: '', category: '', version: 'v1.0', effectiveDate: new Date().toISOString().slice(0, 10), summary: '', revisionNote: '', clauses: [emptyClause()] })
    }
    setErr('')
  }, [open, base])

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const setClause = (i, patch) => setForm((f) => ({ ...f, clauses: f.clauses.map((c, j) => (j === i ? { ...c, ...patch } : c)) }))

  async function save() {
    setBusy(true)
    setErr('')
    try {
      const body = {
        code: form.code, title: form.title, category: form.category, version: form.version,
        effectiveDate: form.effectiveDate, summary: form.summary, revisionNote: form.revisionNote,
        clauses: form.clauses.map((c) => ({ no: c.no, title: c.title, text: c.text, keywords: c.keywords })),
      }
      if (isVersion) {
        await api(`/policies/${base.id}/publish-version`, { method: 'POST', body })
      } else {
        await api('/policies', { method: 'POST', body })
      }
      onSaved()
      onClose()
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  const valid = form.code.trim() && form.title.trim() && form.category.trim() && form.version.trim() && form.effectiveDate &&
    form.clauses.length > 0 && form.clauses.every((c) => c.no.trim() && c.title.trim() && c.text.trim())

  return (
    <Modal open={open} onClose={onClose} width="max-w-2xl"
      title={isVersion ? `发布新版 · ${base.title}（当前 ${base.version}）` : '新建制度'}
      footer={
        <>
          <button onClick={onClose} className="btn-ghost">取消</button>
          <button onClick={save} disabled={busy || !valid} className="btn-primary">{isVersion ? '发布新版' : '创建并发布'}</button>
        </>
      }
    >
      {isVersion && (
        <div className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-700">
          新版发布并生效后，同编号旧版将<b>自动转为已失效</b>并留档，员工与问答只会使用新口径。
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        <div><label className="label">制度编号</label>
          <input className="input" value={form.code} onChange={(e) => set({ code: e.target.value })} placeholder="如 QH-CW-006" disabled={isVersion} /></div>
        <div><label className="label">版本号</label>
          <input className="input" value={form.version} onChange={(e) => set({ version: e.target.value })} placeholder="如 v1.0 / v2.1" /></div>
        <div><label className="label">制度名称</label>
          <input className="input" value={form.title} onChange={(e) => set({ title: e.target.value })} /></div>
        <div><label className="label">分类</label>
          <input className="input" value={form.category} onChange={(e) => set({ category: e.target.value })} placeholder="如 差旅管理" /></div>
        <div><label className="label">生效日期</label>
          <input className="input" type="date" value={form.effectiveDate} onChange={(e) => set({ effectiveDate: e.target.value })} /></div>
        <div className="md:col-span-2"><label className="label">摘要</label>
          <input className="input" value={form.summary} onChange={(e) => set({ summary: e.target.value })} /></div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <label className="label !mb-0">条款（编号 / 标题 / 正文，正文将参与问答检索）</label>
          <button onClick={() => set({ clauses: [...form.clauses, emptyClause()] })} className="btn-ghost !px-2.5 !py-1 text-xs"><Plus size={12} /> 加条款</button>
        </div>
        <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {form.clauses.map((c, i) => (
            <div key={i} className="rounded-lg border border-slate-100 p-3">
              <div className="grid grid-cols-[70px_1fr] gap-2">
                <input className="input !px-2" value={c.no} onChange={(e) => setClause(i, { no: e.target.value })} placeholder="3.1" />
                <input className="input" value={c.title} onChange={(e) => setClause(i, { title: e.target.value })} placeholder="条款标题" />
              </div>
              <textarea className="input mt-2 min-h-[60px]" value={c.text} onChange={(e) => setClause(i, { text: e.target.value })} placeholder="条款正文" />
              <button
                onClick={() => set({ clauses: form.clauses.filter((_, j) => j !== i) })}
                disabled={form.clauses.length <= 1}
                className="mt-1.5 text-[11px] text-slate-400 hover:text-red-500 disabled:opacity-30"
              >
                删除该条款
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3"><label className="label">修订说明</label>
        <input className="input" value={form.revisionNote} onChange={(e) => set({ revisionNote: e.target.value })} placeholder={isVersion ? '本版改了什么' : '首版发布'} /></div>

      {err && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</div>}
    </Modal>
  )
}

export default function PolicyAdmin() {
  const [policies, setPolicies] = useState(null)
  const [err, setErr] = useState('')
  const [creating, setCreating] = useState(false)
  const [versioning, setVersioning] = useState(null)

  function load() {
    api('/policies?all=1').then((d) => setPolicies(d.policies)).catch((e) => setErr(e.message))
  }
  useEffect(load, [])

  async function deprecate(p) {
    if (!confirm(`确定废止《${p.title}》${p.version}？废止后员工将查不到该制度。`)) return
    try {
      await api(`/policies/${p.id}/deprecate`, { method: 'POST' })
      load()
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <div>
      <PageHeader
        title="制度维护台"
        desc="行政专员专用：新增制度、发布新版、废止旧版。员工侧与问答只认现行有效版本"
        action={<button onClick={() => setCreating(true)} className="btn-primary"><Plus size={14} /> 新建制度</button>}
      />

      {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</div>}
      {!policies && !err && <Loading />}

      <div className="space-y-3">
        {(policies || []).map((p) => (
          <div key={p.id} className={`card p-5 ${p.status !== 'active' ? 'opacity-55 grayscale' : ''}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link to={`/policies/${p.id}`} className="text-[15px] font-semibold text-slate-900 hover:text-qinghe-700">{p.title}</Link>
                  <span className="chip bg-qinghe-100 text-qinghe-700">{p.version}</span>
                  {p.status === 'active'
                    ? <span className="chip bg-qinghe-600/10 text-qinghe-700">现行有效</span>
                    : <span className="chip bg-red-50 text-red-500">已失效 · 留档</span>}
                  <span className="chip bg-slate-100 text-slate-500">{p.category}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1"><FileText size={12} />{p.code}</span>
                  <span>{fmtDate(p.effectiveDate)} ~ {p.expireDate ? fmtDate(p.expireDate) : '至今'}</span>
                  <span>{p.clauses.length} 条条款</span>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                {p.status === 'active' && (
                  <>
                    <button onClick={() => setVersioning(p)} className="btn-ghost !px-3 !py-1.5 text-xs"><History size={13} /> 发布新版</button>
                    <button onClick={() => deprecate(p)} className="btn-danger !px-3 !py-1.5 text-xs"><Ban size={13} /> 废止</button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <PolicyEditor open={creating} base={null} onClose={() => setCreating(false)} onSaved={load} />
      <PolicyEditor open={!!versioning} base={versioning} onClose={() => setVersioning(null)} onSaved={load} />
    </div>
  )
}
