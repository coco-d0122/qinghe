import React from 'react'

/** 通用小组件：状态徽章、弹窗、空态、加载 */
export function StatusBadge({ status, map, style }) {
  return <span className={`chip ${style[status] || 'bg-slate-100 text-slate-600'}`}>{map[status] || status}</span>
}

export function Modal({ open, title, children, footer, width = 'max-w-md' }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" style={{ backdropFilter: 'blur(2px)' }}>
      <div className={`w-full ${width} rounded-2xl bg-white p-6 shadow-xl`}>
        {title && <h3 className="mb-4 text-base font-semibold text-slate-900">{title}</h3>}
        {children}
        {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}

export function Empty({ icon: Icon, title, desc }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-14 text-center">
      {Icon && <Icon size={34} className="text-slate-300" />}
      <div className="text-sm font-medium text-slate-500">{title}</div>
      {desc && <div className="max-w-sm text-xs leading-relaxed text-slate-400">{desc}</div>}
    </div>
  )
}

export function Loading({ text = '加载中…' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-qinghe-200 border-t-qinghe-600" />
      {text}
    </div>
  )
}

export function PageHeader({ title, desc, action }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        {desc && <p className="mt-1 text-sm text-slate-500">{desc}</p>}
      </div>
      {action}
    </div>
  )
}
