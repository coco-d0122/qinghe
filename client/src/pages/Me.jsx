import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserRound, ShieldCheck, Coins, LogOut, Eye, EyeOff } from 'lucide-react'
import { api, ROLE_LABEL } from '../api.js'
import { useAuth } from '../App.jsx'
import { Loading, PageHeader } from '../components/ui.jsx'

export default function Me() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [consent, setConsent] = useState(null)

  useEffect(() => {
    api('/claims/consent').then((d) => setConsent(d.consent)).catch(() => setConsent({ granted: false }))
  }, [])

  async function toggleConsent(grant) {
    if (!grant && !confirm('撤回授权后将无法查询单据进度，确定撤回？')) return
    const d = await api('/claims/consent', { method: 'POST', body: { granted: grant } })
    setConsent(d.consent)
  }

  const roleCard = {
    employee: { icon: UserRound, title: '员工', desc: '查现行有效制度、一句话提问、经授权查本人单据' },
    admin: { icon: ShieldCheck, title: '行政专员', desc: '维护制度口径：新增、发布新版、设定生效日期、废止' },
    finance: { icon: Coins, title: '财务专员', desc: '核对单据业务事实（金额/事由/凭证）、驳回、标记打款' },
  }[user.role]
  const Icon = roleCard.icon

  return (
    <div>
      <PageHeader title="我的" />
      <div className="space-y-4">
        <div className="card flex items-center gap-4 p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-qinghe-100 text-xl font-bold text-qinghe-700">{user.name?.slice(0, 1)}</div>
          <div className="flex-1">
            <div className="text-lg font-bold text-slate-900">{user.name}</div>
            <div className="mt-0.5 text-xs text-slate-400">{user.email} · {user.employeeNo} · {user.dept}</div>
          </div>
          <span className="chip bg-qinghe-100 text-qinghe-700">{ROLE_LABEL[user.role]}</span>
        </div>

        <div className="card flex items-start gap-3 p-5">
          <Icon size={18} className="mt-0.5 text-qinghe-600" />
          <div>
            <div className="text-sm font-semibold text-slate-700">角色权限 · {roleCard.title}</div>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{roleCard.desc}</p>
            <p className="mt-1.5 text-[11px] text-slate-400">权限在服务端接口层强制执行，前端菜单只是展示。</p>
          </div>
        </div>

        {user.role === 'employee' && (
          consent && (
            <div className="card flex items-start justify-between gap-3 p-5">
              <div className="flex items-start gap-3">
                {consent.granted ? <Eye size={18} className="mt-0.5 text-qinghe-600" /> : <EyeOff size={18} className="mt-0.5 text-slate-400" />}
                <div>
                  <div className="text-sm font-semibold text-slate-700">单据查询授权</div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    {consent.granted
                      ? `已于 ${new Date(consent.at).toLocaleString('zh-CN')} 同意授权，助手仅读取你本人的单据进度。`
                      : '尚未授权。授权后可查本人单据进度；助手不会读取他人单据，也不会代替审批或打款。'}
                  </p>
                </div>
              </div>
              <button onClick={() => toggleConsent(!consent.granted)} className={consent.granted ? 'btn-danger !px-3 !py-1.5 text-xs' : 'btn-primary !px-3 !py-1.5 text-xs'}>
                {consent.granted ? '撤回授权' : '去授权'}
              </button>
            </div>
          )
        )}

        {!consent && <Loading text="" />}

        <button
          onClick={() => { logout(); navigate('/login') }}
          className="card flex w-full items-center gap-2 p-4 text-sm text-slate-600 transition hover:border-red-100 hover:text-red-600"
        >
          <LogOut size={15} /> 退出登录
        </button>
      </div>
    </div>
  )
}
