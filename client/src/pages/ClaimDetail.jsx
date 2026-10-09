import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, CircleCheck, CircleDashed, BookOpen } from 'lucide-react'
import { api, STATUS_LABEL, STATUS_STYLE, fmtAmount, fmtDate, fmtDateTime } from '../api.js'
import { Loading } from '../components/ui.jsx'

/** 业务事实核对卡：未核对明确标注「以周敏核对结论为准」 */
function VerifyCard({ verification }) {
  if (!verification) {
    return (
      <div className="card border-dashed p-5">
        <div className="text-sm font-semibold text-slate-600">业务事实核对</div>
        <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-500">
          周敏尚未给出核对结论。此前的金额与状态仅供参考，以财务核对结论为准。
        </p>
      </div>
    )
  }
  return (
    <div className={`card p-5 ${verification.opinion?.includes('超出') || verification.opinion?.includes('驳回') ? 'border-red-100' : 'border-qinghe-100'}`}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-700">业务事实核对</div>
        <span className="chip bg-qinghe-100 text-qinghe-700">已核对</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
        <div>核对人：<span className="font-medium text-slate-700">{verification.verifier} · 财务专员</span></div>
        <div>核对时间：{fmtDateTime(verification.verifiedAt)}</div>
      </div>
      {verification.checks?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {verification.checks.map((c) => (
            <span key={c} className="chip bg-qinghe-50 text-qinghe-700">✓ {c}</span>
          ))}
        </div>
      )}
      <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">{verification.opinion}</p>
    </div>
  )
}

export default function ClaimDetail() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    api(`/claims/${id}`).then(setData).catch((e) => setErr(e.message))
  }, [id])

  if (err) return <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</div>
  if (!data) return <Loading />

  const { claim: c, policy } = data

  return (
    <div>
      <Link to="/claims" className="mb-4 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-qinghe-600">
        <ArrowLeft size={13} /> 返回我的单据
      </Link>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold tracking-wide text-slate-500">{c.id}</span>
          <h1 className="text-xl font-bold text-slate-900">{c.title}</h1>
          <span className={`chip ${STATUS_STYLE[c.status]}`}>{STATUS_LABEL[c.status]}</span>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-slate-400">申请金额{c.verification ? '（已核对）' : '（待核对，仅供参考）'}</div>
          <div className="text-2xl font-bold text-slate-900">{fmtAmount(c.amount)}</div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 左列：明细 + 核对卡 */}
        <div className="space-y-4">
          <div className="card p-5">
            <div className="mb-3 text-sm font-semibold text-slate-700">费用明细（{c.type}）</div>
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="text-[11px] text-slate-400">
                  <th className="pb-2 font-medium">事由</th>
                  <th className="pb-2 font-medium">日期</th>
                  <th className="pb-2 text-right font-medium">金额</th>
                </tr>
              </thead>
              <tbody>
                {c.items.map((it, i) => (
                  <tr key={i} className="border-t border-slate-50">
                    <td className="py-2 text-slate-700">{it.desc}</td>
                    <td className="py-2 text-slate-400">{it.date}</td>
                    <td className="py-2 text-right font-medium text-slate-700">{fmtAmount(it.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <VerifyCard verification={c.verification} />

          {policy && (
            <Link to={`/policies/${policy.id}`} className="card block p-5 transition hover:border-qinghe-200">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <BookOpen size={14} className="text-qinghe-600" /> 适用制度
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                《{policy.title}》{policy.version} · {policy.code} · 生效 {fmtDate(policy.effectiveDate)}
              </p>
              <p className="mt-1 text-[11px] text-qinghe-600">点击查看现行有效原文 →</p>
            </Link>
          )}
        </div>

        {/* 右列：流转时间轴 */}
        <div className="card p-5">
          <div className="mb-4 text-sm font-semibold text-slate-700">流转进度</div>
          <div className="relative space-y-5 pl-1">
            {c.timeline.map((t, i) => {
              const last = i === c.timeline.length - 1
              const done = !['REJECTED'].includes(c.status) || !last
              return (
                <div key={i} className="relative flex gap-3.5">
                  {i < c.timeline.length - 1 && <span className="absolute left-[9px] top-6 h-full w-px bg-slate-100" />}
                  {done ? <CircleCheck size={19} className="shrink-0 text-qinghe-500" /> : <CircleDashed size={19} className="shrink-0 text-slate-300" />}
                  <div className="pb-1">
                    <div className="text-[13px] leading-snug text-slate-700">{t.action}</div>
                    <div className="mt-0.5 text-[11px] text-slate-400">{t.actor} · {fmtDateTime(t.at)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
