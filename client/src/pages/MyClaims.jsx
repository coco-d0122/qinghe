import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ReceiptText, Plus, Eye, EyeOff } from 'lucide-react'
import { api, STATUS_LABEL, STATUS_STYLE, fmtAmount, fmtDate } from '../api.js'
import { Empty, Loading, Modal, PageHeader, StatusBadge } from '../components/ui.jsx'

const FILTERS = ['全部', '材料审核中', '财务核对中', '核对通过 · 待打款', '已打款', '已驳回']

export default function MyClaims() {
  const navigate = useNavigate()
  const [claims, setClaims] = useState(null)
  const [filter, setFilter] = useState('全部')
  const [consent, setConsent] = useState(null)
  const [needConsent, setNeedConsent] = useState(false)
  const [err, setErr] = useState('')

  async function load() {
    try {
      const d = await api('/claims')
      setClaims(d.claims)
    } catch (e) {
      if (e.code === 'CONSENT_REQUIRED') setNeedConsent(true)
      else setErr(e.message)
    }
  }

  useEffect(() => {
    api('/claims/consent').then((d) => setConsent(d.consent)).catch(() => {})
    load()
  }, [])

  async function grant() {
    const d = await api('/claims/consent', { method: 'POST', body: { granted: true } })
    setConsent(d.consent)
    setNeedConsent(false)
    load()
  }

  async function revoke() {
    if (!confirm('撤回授权后将无法查询单据进度，确定撤回？')) return
    const d = await api('/claims/consent', { method: 'POST', body: { granted: false } })
    setConsent(d.consent)
    navigate('/')
  }

  const list = (claims || []).filter((c) => filter === '全部' || STATUS_LABEL[c.status] === filter)

  return (
    <div>
      <PageHeader
        title="我的单据"
        desc="仅你本人可见；未核对通过前金额仅供参考，以财务核对结论为准"
        action={
          consent?.granted && (
            <div className="flex gap-2">
              <button onClick={revoke} className="btn-ghost"><EyeOff size={14} /> 撤回授权</button>
              <button onClick={() => navigate('/claims/new')} className="btn-primary"><Plus size={14} /> 提交报销单</button>
            </div>
          )
        }
      />

      {/* 首次进入的授权说明 */}
      <Modal
        open={needConsent}
        title="查询本人单据 · 需要你的授权"
        footer={
          <>
            <button onClick={() => navigate('/')} className="btn-ghost">暂不查询</button>
            <button onClick={grant} className="btn-primary">同意并继续</button>
          </>
        }
      >
        <ul className="space-y-2.5 text-sm leading-relaxed text-slate-600">
          <li className="flex gap-2"><Eye size={15} className="mt-0.5 shrink-0 text-qinghe-600" /> 会读取：你本人提交的报销单状态与流转记录</li>
          <li className="flex gap-2"><EyeOff size={15} className="mt-0.5 shrink-0 text-slate-400" /> 不会做：读取他人单据、代替财务审批、自动打款</li>
        </ul>
        <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-500">
          授权仅用于进度查询，可随时在「我的」或本页撤回。业务事实的认定始终由财务专员周敏核对。
        </p>
      </Modal>

      {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</div>}

      {consent?.granted && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 text-xs transition ${
                filter === f ? 'bg-qinghe-600 font-medium text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-qinghe-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {!claims && consent?.granted && !err && <Loading />}
      {claims && list.length === 0 && <Empty icon={ReceiptText} title="暂无单据" desc="提交报销单后可在这里跟踪进度" />}

      <div className="space-y-3">
        {list.map((c) => (
          <Link key={c.id} to={`/claims/${c.id}`} className="card block p-5 transition hover:border-qinghe-200 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-slate-500">{c.id}</span>
                  <span className="text-[15px] font-semibold text-slate-900">{c.title}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                  <span>{c.type}</span>
                  <span>{c.items.length} 条明细</span>
                  <span>提交于 {fmtDate(c.createdAt)}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-base font-bold text-slate-900">{fmtAmount(c.amount)}</div>
                <div className="mt-1.5"><StatusBadge status={c.status} map={STATUS_LABEL} style={STATUS_STYLE} /></div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
