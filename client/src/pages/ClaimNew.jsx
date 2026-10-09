import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { api, fmtAmount } from '../api.js'
import { PageHeader } from '../components/ui.jsx'

const TYPES = ['差旅费', '市内交通', '业务招待', '办公用品', '其他']

export default function ClaimNew() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [type, setType] = useState('差旅费')
  const [policies, setPolicies] = useState([])
  const [policyCode, setPolicyCode] = useState('')
  const [items, setItems] = useState([{ desc: '', date: new Date().toISOString().slice(0, 10), amount: '' }])
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api('/policies').then((d) => setPolicies(d.policies)).catch(() => {})
  }, [])

  const total = items.reduce((s, it) => s + (Number(it.amount) || 0), 0)

  function setItem(i, patch) {
    setItems((arr) => arr.map((it, j) => (j === i ? { ...it, ...patch } : it)))
  }

  async function submit() {
    setErr('')
    setBusy(true)
    try {
      const d = await api('/claims', {
        method: 'POST',
        body: { title, type, policyCode, items: items.map((it) => ({ desc: it.desc, date: it.date, amount: Number(it.amount) })) },
      })
      navigate(`/claims/${d.claim.id}`)
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <button onClick={() => navigate('/claims')} className="mb-4 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-qinghe-600">
        <ArrowLeft size={13} /> 返回我的单据
      </button>
      <PageHeader title="提交报销单" desc="金额由明细自动汇总；提交后进入材料审核，由财务专员周敏核对业务事实" />

      <div className="card space-y-5 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">报销标题</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="如：差旅报销 · 上海客户拜访" />
          </div>
          <div>
            <label className="label">费用类型</label>
            <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">关联制度（可选，便于核对时对照口径）</label>
          <select className="input" value={policyCode} onChange={(e) => setPolicyCode(e.target.value)}>
            <option value="">不关联</option>
            {policies.map((p) => <option key={p.id} value={p.code}>{p.code} 《{p.title}》{p.version}</option>)}
          </select>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="label !mb-0">费用明细</label>
            <button onClick={() => setItems((a) => [...a, { desc: '', date: new Date().toISOString().slice(0, 10), amount: '' }])} className="btn-ghost !px-2.5 !py-1 text-xs">
              <Plus size={12} /> 加一条
            </button>
          </div>
          <div className="space-y-2">
            {items.map((it, i) => (
              <div key={i} className="grid grid-cols-[1fr_130px_120px_32px] items-center gap-2">
                <input className="input" placeholder="费用事由，如：高铁 往返二等座" value={it.desc} onChange={(e) => setItem(i, { desc: e.target.value })} />
                <input className="input" type="date" value={it.date} onChange={(e) => setItem(i, { date: e.target.value })} />
                <input className="input" type="number" min="0" step="0.01" placeholder="金额" value={it.amount} onChange={(e) => setItem(i, { amount: e.target.value })} />
                <button
                  onClick={() => setItems((a) => (a.length > 1 ? a.filter((_, j) => j !== i) : a))}
                  disabled={items.length <= 1}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
                  title="删除明细"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-end gap-3 text-sm">
            <span className="text-slate-400">合计（自动汇总）</span>
            <span className="text-lg font-bold text-slate-900">{fmtAmount(total)}</span>
          </div>
        </div>

        {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</div>}

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button onClick={() => navigate('/claims')} className="btn-ghost">取消</button>
          <button onClick={submit} disabled={busy || !title.trim() || total <= 0 || items.some((it) => !it.desc.trim())} className="btn-primary">
            提交报销单
          </button>
        </div>
      </div>
    </div>
  )
}
