import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Sprout, Loader2 } from 'lucide-react'
import { api, setToken } from '../api.js'
import { useAuth } from '../App.jsx'

const DEMO = [
  { email: 'lin@qinghe.com', name: '小林', role: '员工 · 市场部', desc: '查制度、提问、查本人单据' },
  { email: 'qiao@qinghe.com', name: '乔姐', role: '行政专员', desc: '维护制度口径与版本' },
  { email: 'zhou@qinghe.com', name: '周敏', role: '财务专员', desc: '核对单据业务事实' },
]

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  async function doLogin(em, pw) {
    setBusy(true)
    setErr('')
    try {
      const d = await api('/auth/login', { method: 'POST', body: { email: em, password: pw } })
      login(d.token, d.user)
      navigate(location.state?.from?.pathname || '/', { replace: true })
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-qinghe-50 via-white to-qinghe-100 p-4">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-card md:flex">
        {/* 左侧品牌区 */}
        <div className="hidden w-[42%] flex-col justify-between bg-qinghe-600 p-10 text-white md:flex">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
              <Sprout size={22} />
            </div>
            <div className="text-lg font-bold">青禾报销助手</div>
          </div>
          <div>
            <div className="text-[22px] font-bold leading-snug">报销前先查制度，<br />提交后可查进度</div>
            <ul className="mt-5 space-y-2.5 text-sm text-white/85">
              <li>· 只答现行有效制度，口径附原文出处</li>
              <li>· 经授权后可查本人单据进度</li>
              <li>· 制度由行政维护，事实由财务核对</li>
            </ul>
          </div>
          <div className="text-xs text-white/60">助手不做审批、不付款，只帮你查得明白</div>
        </div>

        {/* 右侧表单 */}
        <div className="flex-1 p-8 md:p-10">
          <h2 className="text-lg font-bold text-slate-900">登录</h2>
          <p className="mt-1 text-sm text-slate-400">演示账号密码统一 <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">demo1234</code></p>

          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              doLogin(email, password)
            }}
          >
            <div>
              <label className="label">邮箱</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@qinghe.com" required />
            </div>
            <div>
              <label className="label">密码</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{err}</div>}
            <button className="btn-primary w-full justify-center !py-2.5" disabled={busy}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : null}
              {busy ? '登录中…' : '登 录'}
            </button>
          </form>

          <div className="mt-7 border-t border-slate-100 pt-5">
            <div className="mb-3 text-xs font-medium text-slate-400">演示账号 · 一键体验三种角色</div>
            <div className="space-y-2">
              {DEMO.map((d) => (
                <button
                  key={d.email}
                  onClick={() => doLogin(d.email, 'demo1234')}
                  disabled={busy}
                  className="group flex w-full items-center gap-3 rounded-xl border border-slate-100 px-3.5 py-2.5 text-left transition hover:border-qinghe-300 hover:bg-qinghe-50/60"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-qinghe-100 text-sm font-semibold text-qinghe-700">{d.name.slice(0, 1)}</span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium text-slate-700">{d.name} <span className="ml-1 text-xs font-normal text-slate-400">{d.role}</span></span>
                    <span className="block text-xs text-slate-400">{d.desc}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
