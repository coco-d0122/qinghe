import React from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Sprout, Home, BookOpen, MessageCircle, ReceiptText, ShieldCheck, Coins, UserRound, LogOut, ChevronRight } from 'lucide-react'
import { useAuth } from '../App.jsx'
import { ROLE_LABEL } from '../api.js'

const NAV = [
  { to: '/', label: '首页', icon: Home, roles: ['employee', 'admin', 'finance'] },
  { to: '/policies', label: '制度库', icon: BookOpen, roles: ['employee', 'admin', 'finance'] },
  { to: '/assistant', label: '智能问答', icon: MessageCircle, roles: ['employee', 'admin', 'finance'] },
  { to: '/claims', label: '我的单据', icon: ReceiptText, roles: ['employee'] },
  { to: '/admin/policies', label: '制度维护', icon: ShieldCheck, roles: ['admin'] },
  { to: '/finance', label: '财务核对', icon: Coins, roles: ['finance'] },
  { to: '/me', label: '我的', icon: UserRound, roles: ['employee', 'admin', 'finance'] },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const items = NAV.filter((n) => n.roles.includes(user.role))

  return (
    <div className="flex min-h-screen bg-qinghe-50">
      {/* 侧边栏 */}
      <aside className="fixed inset-y-0 left-0 z-20 flex w-56 flex-col border-r border-slate-100 bg-white">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-qinghe-600 text-white">
            <Sprout size={20} />
          </div>
          <div>
            <div className="text-[15px] font-bold leading-tight text-slate-900">青禾报销助手</div>
            <div className="text-[11px] text-slate-400">制度可查 · 进度可见</div>
          </div>
        </div>
        <nav className="mt-1 flex-1 space-y-0.5 px-3">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                  isActive ? 'bg-qinghe-50 font-semibold text-qinghe-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Icon size={16} />
              {label}
              <ChevronRight size={13} className="ml-auto opacity-0 transition group-hover:opacity-40" />
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-qinghe-100 text-sm font-semibold text-qinghe-700">
              {user.name?.slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-slate-800">{user.name}</div>
              <div className="truncate text-[11px] text-slate-400">{ROLE_LABEL[user.role]} · {user.employeeNo}</div>
            </div>
            <button onClick={() => { logout(); navigate('/login') }} title="退出登录" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-50 hover:text-red-500">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* 内容区 */}
      <main className="ml-56 flex-1 px-8 py-7">
        <div className="mx-auto max-w-4xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
