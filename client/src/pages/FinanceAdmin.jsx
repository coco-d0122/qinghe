import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Coins, BookOpen } from 'lucide-react'
import { api, STATUS_LABEL, STATUS_STYLE, fmtAmount, fmtDate } from '../api.js'
import { Empty, Loading, Modal, PageHeader } from '../components/ui.jsx'

const CHECK_OPTIONS = ['金额与发票一致', '事由属实', '凭证齐全', '符合制度标准']

/** 核对操作弹窗：开始核对 / 通过 / 驳回 */
function ReviewModal({ claim, action, onClose, onDone }) {
  const [opinion, setOpinion] = useState('')
  const [checks, setChecks] = useState([])
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const isReject = action === 'reject'
  const isApprove = action === 'approve'

  async function submit() {
    setBusy(true)
    setErr('')
    try {
      await api(`/claims/${claim.id}/review`, { method: 'POST', body: { action, opinion, checks } })
      onDone()
      onClose()
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={!!claim} onClose={onClose}
      title={action === 'start' ? `开始核对 · ${claim.id}` : isApprove ? `核对通过 · ${claim.id}` : `驳回 · ${claim.id}`}
      footer={
        <>
          <button onClick={onClose} className="btn-ghost">取消</button>
          <button onClick={submit} disabled={busy || (isReject && !opinion.trim())} className={isReject ? 'btn-danger' : 'btn-primary'}>
            {action === 'start' ? '确认开始核对' : isApprove ? '确认通过' : '确认驳回'}
          </button>
        </>
      }
    >
      {action === 'start' ? (
        <p className="text-sm leading-relaxed text-slate-600">
          确认材料齐全后开始核对「{claim.title}」的业务事实？单据状态将变为「财务核对中」。
        </p>
      ) : (
        <>
          {(isApprove || isReject) && (
            <div className="mb-3">
              <label className="label">核对要点（通过时勾选）</label>
              <div className="flex flex-wrap gap-1.5">
                {CHECK_OPTIONS.map((c) => {
                  const on = checks.includes(c)
                  return (
                    <button
                      key={c}
                      onClick={() => setChecks((arr) => (on ? arr.filter((x) => x !== c) : [...arr, c]))}
                      className={`chip border transition ${on ? 'border-qinghe-400 bg-qinghe-50 text-qinghe-700' : 'border-slate-200 bg-white text-slate-500'}`}
                    >
                      {on ? '✓ ' : ''}{c}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          <div>
            <label className="label">核对意见{isReject && <span className="text-red-500"> *必填</span>}</label>
            <textarea
              className="input min-h-[80px]"
              value={opinion}
              onChange={(e) => setOpinion(e.target.value)}
              placeholder={isReject ? '写明驳回原因，如：住宿超出每晚 500 元上限' : '如：各项符合制度标准'}
            />
          </div>
        </>
      )}
      {err && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</div>}
    </Modal>
  )
}

export default function FinanceAdmin() {
  const [claims, setClaims] = useState(null)
  const [err, setErr] = useState('')
  const [modal, setModal] = useState(null) // {claim, action}

  function load() {
    api('/claims').then((d) => setClaims(d.claims)).catch((e) => setErr(e.message))
  }
  useEffect(load, [])

  async function pay(claim) {
    if (!confirm(`确认已给 ${claim.ownerName} 打款 ${fmtAmount(claim.amount)}？`)) return
    try {
      await api(`/claims/${claim.id}/review`, { method: 'POST', body: { action: 'pay' } })
      load()
    } catch (e) {
      alert(e.message)
    }
  }

  const pending = (claims || []).filter((c) => ['SUBMITTED', 'VERIFYING'].includes(c.status))
  const queue = (claims || []).filter((c) => c.status === 'APPROVED')
  const done = (claims || []).filter((c) => ['PAID', 'REJECTED'].includes(c.status))

  const Section = ({ title, list, highlight }) => (
    <section>
      <div className={`mb-2.5 flex items-center gap-2 text-sm font-semibold ${highlight ? 'text-qinghe-700' : 'text-slate-600'}`}>
        <Coins size={14} className={highlight ? 'text-qinghe-600' : 'text-slate-400'} />
        {title} <span className="chip bg-slate-100 text-slate-500">{list.length}</span>
      </div>
      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-400">暂无单据</div>
      ) : (
        <div className="space-y-2.5">
          {list.map((c) => <ClaimRow key={c.id} c={c} />)}
        </div>
      )}
    </section>
  )

  function ClaimRow({ c }) {
    return (
      <div className="card p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link to={`/claims/${c.id}`} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500 hover:text-qinghe-700">{c.id}</Link>
              <Link to={`/claims/${c.id}`} className="truncate text-sm font-semibold text-slate-900 hover:text-qinghe-700">{c.title}</Link>
              <span className={`chip ${STATUS_STYLE[c.status]}`}>{STATUS_LABEL[c.status]}</span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
              <span>{c.ownerName}</span>
              <span>{c.type}</span>
              <span>提交于 {fmtDate(c.createdAt)}</span>
              {c.policyCode && <span className="flex items-center gap-0.5"><BookOpen size={11} />{c.policyCode}</span>}
            </div>
            {c.verification && <p className="mt-1.5 line-clamp-1 text-[11px] text-slate-400">上次意见：{c.verification.opinion}</p>}
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[15px] font-bold text-slate-900">{fmtAmount(c.amount)}</div>
            <div className="mt-2 flex justify-end gap-1.5">
              {c.status === 'SUBMITTED' && <button onClick={() => setModal({ claim: c, action: 'start' })} className="btn-ghost !px-2.5 !py-1 text-xs">开始核对</button>}
              {c.status === 'VERIFYING' && (
                <>
                  <button onClick={() => setModal({ claim: c, action: 'approve' })} className="btn-primary !px-2.5 !py-1 text-xs">通过</button>
                  <button onClick={() => setModal({ claim: c, action: 'reject' })} className="btn-danger !px-2.5 !py-1 text-xs">驳回</button>
                </>
              )}
              {c.status === 'APPROVED' && <button onClick={() => pay(c)} className="btn-primary !px-2.5 !py-1 text-xs">标记已打款</button>}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="财务核对台" desc="财务专员专用：核对单据的金额 / 事由 / 凭证等业务事实；核对页可对照制度条款" />
      {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</div>}
      {!claims && !err && <Loading />}
      {claims && claims.length === 0 && <Empty icon={Coins} title="暂无单据" />}
      {claims && (
        <div className="space-y-7">
          <Section title="待核对" list={pending} highlight />
          <Section title="核对通过 · 待打款" list={queue} highlight />
          <Section title="已完成 / 已驳回" list={done} />
        </div>
      )}
      {modal && <ReviewModal claim={modal.claim} action={modal.action} onClose={() => setModal(null)} onDone={load} />}
    </div>
  )
}
