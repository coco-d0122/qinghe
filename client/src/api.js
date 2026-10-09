const TOKEN_KEY = 'qh_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(t) {
  if (t) localStorage.setItem(TOKEN_KEY, t)
  else localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  constructor(message, code, status) {
    super(message)
    this.code = code
    this.status = status
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  const token = getToken()
  const res = await fetch('/api' + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  let data = {}
  try {
    data = await res.json()
  } catch {}
  if (!res.ok) throw new ApiError(data.message || '请求失败', data.code, res.status)
  return data
}

export const ROLE_LABEL = { employee: '员工', admin: '行政专员', finance: '财务专员' }

export const STATUS_LABEL = {
  SUBMITTED: '材料审核中',
  VERIFYING: '财务核对中',
  APPROVED: '核对通过 · 待打款',
  PAID: '已打款',
  REJECTED: '已驳回',
}

export const STATUS_STYLE = {
  SUBMITTED: 'bg-amber-50 text-amber-700',
  VERIFYING: 'bg-blue-50 text-blue-700',
  APPROVED: 'bg-qinghe-100 text-qinghe-700',
  PAID: 'bg-slate-100 text-slate-600',
  REJECTED: 'bg-red-50 text-red-600',
}

export function fmtAmount(n) {
  return '¥ ' + Number(n || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function fmtDateTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${fmtDate(iso)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
