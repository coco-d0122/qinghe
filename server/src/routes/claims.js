import { Router } from 'express'
import { getDb, persist, nextClaimNo } from '../store.js'
import { authRequired, requireRoles } from '../auth.js'

const r = Router()
r.use(authRequired)

/** 单据状态机：只能按顺序推进，跳步直接 400 */
const TRANSITIONS = {
  SUBMITTED: ['VERIFYING', 'REJECTED'],
  VERIFYING: ['APPROVED', 'REJECTED'],
  APPROVED: ['PAID'],
  PAID: [],
  REJECTED: [],
}

export const STATUS_LABEL = {
  SUBMITTED: '材料审核中',
  VERIFYING: '财务核对中',
  APPROVED: '核对通过 · 待打款',
  PAID: '已打款',
  REJECTED: '已驳回',
}

/** 员工查单据须先授权；财务/行政因核对需要不受此限制 */
function requireConsent(req, res, next) {
  if (req.user.role !== 'employee') return next()
  const consent = getDb().consents[req.user.uid]
  if (!consent || !consent.granted) {
    return res.status(403).json({ code: 'CONSENT_REQUIRED', message: '查询单据前需先授权：仅读取你本人的单据进度，不会用于其他用途' })
  }
  next()
}

/** 授权状态查询 / 同意 / 撤回 */
r.get('/consent', (req, res) => {
  const c = getDb().consents[req.user.uid]
  res.json({ consent: c || { granted: false } })
})

r.post('/consent', (req, res) => {
  const db = getDb()
  const granted = !!(req.body || {}).granted
  db.consents[req.user.uid] = { granted, at: new Date().toISOString() }
  persist()
  res.json({ consent: db.consents[req.user.uid] })
})

/** 单据列表：员工硬编码只查本人；财务/行政可看全部 */
r.get('/', requireConsent, (req, res) => {
  const db = getDb()
  const { status } = req.query
  let list = db.claims.slice()
  if (req.user.role === 'employee') {
    list = list.filter((c) => c.ownerId === req.user.uid)
  }
  if (status && status !== '全部') list = list.filter((c) => c.status === status)
  list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  res.json({ claims: list })
})

r.get('/:id', (req, res) => {
  const db = getDb()
  const claim = db.claims.find((c) => c.id === req.params.id)
  if (!claim) return res.status(404).json({ code: 'NOT_FOUND', message: '单据不存在' })
  // 单据仅本人可见；财务/行政因核对需要可读全部
  if (claim.ownerId !== req.user.uid && !['finance', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ code: 'FORBIDDEN', message: '只能查看本人单据' })
  }
  const policy = db.policies.find((p) => p.code === claim.policyCode && p.status === 'active')
  res.json({ claim, policy: policy ? { id: policy.id, code: policy.code, title: policy.title, version: policy.version, clauses: policy.clauses } : null })
})

/** 员工提交报销单：单号自动生成，金额由明细汇总、不接受手写总额 */
r.post('/', requireConsent, (req, res) => {
  const db = getDb()
  const { title, type, policyCode, items } = req.body || {}
  if (!title || !type || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ code: 'BAD_REQUEST', message: '请填写标题、类型与至少一条明细' })
  }
  if (items.some((it) => !it.desc || !(Number(it.amount) > 0))) {
    return res.status(400).json({ code: 'BAD_REQUEST', message: '明细需要事由与大于 0 的金额' })
  }
  const claim = {
    id: nextClaimNo(),
    ownerId: req.user.uid,
    ownerName: req.user.name,
    title,
    type,
    status: 'SUBMITTED',
    items: items.map((it) => ({ desc: it.desc, date: it.date || new Date().toISOString().slice(0, 10), amount: Number(it.amount) })),
    amount: items.reduce((s, it) => s + Number(it.amount), 0),
    policyCode: policyCode || '',
    createdAt: new Date().toISOString(),
    verification: null,
    timeline: [{ at: new Date().toISOString(), actor: req.user.name, action: '提交报销单，等待材料审核' }],
  }
  db.claims.push(claim)
  persist()
  res.status(201).json({ claim })
})

/** 财务核对台动作：开始核对 / 核对结论 / 打款，全部仅财务专员 */
r.post('/:id/review', requireRoles('finance'), (req, res) => {
  const db = getDb()
  const claim = db.claims.find((c) => c.id === req.params.id)
  if (!claim) return res.status(404).json({ code: 'NOT_FOUND', message: '单据不存在' })
  const { action, opinion, checks } = req.body || {}

  const apply = (from, to, eventText) => {
    if (!TRANSITIONS[from]?.includes(to)) {
      return res.status(400).json({ code: 'BAD_TRANSITION', message: `状态只能按「材料审核 → 财务核对 → 待打款 → 已打款」推进，当前为 ${STATUS_LABEL[from]}，不能直接变为 ${STATUS_LABEL[to]}` })
    }
    claim.status = to
    claim.timeline.push({ at: new Date().toISOString(), actor: req.user.name, action: eventText })
  }

  if (action === 'start') {
    if (claim.status !== 'SUBMITTED') return res.status(400).json({ code: 'BAD_TRANSITION', message: '只有材料审核中的单据可以开始核对' })
    apply('SUBMITTED', 'VERIFYING', '材料齐全，开始核对业务事实')
  } else if (action === 'approve') {
    if (claim.status !== 'VERIFYING') return res.status(400).json({ code: 'BAD_TRANSITION', message: '请先「开始核对」再给出核对结论' })
    apply('VERIFYING', 'APPROVED', `业务事实核对通过，待打款${opinion ? '：' + opinion : ''}`)
    claim.verification = { verifiedAt: new Date().toISOString(), verifier: req.user.name, opinion: opinion || '', checks: checks || [] }
  } else if (action === 'reject') {
    if (!['SUBMITTED', 'VERIFYING'].includes(claim.status)) return res.status(400).json({ code: 'BAD_TRANSITION', message: '该单据当前状态不能驳回' })
    if (!opinion) return res.status(400).json({ code: 'BAD_REQUEST', message: '驳回必须填写核对意见' })
    apply(claim.status, 'REJECTED', `核对未通过，单据驳回：${opinion}`)
    claim.verification = { verifiedAt: new Date().toISOString(), verifier: req.user.name, opinion, checks: checks || [] }
  } else if (action === 'pay') {
    if (claim.status !== 'APPROVED') return res.status(400).json({ code: 'BAD_TRANSITION', message: '只有核对通过的单据可以标记打款' })
    apply('APPROVED', 'PAID', '已打款，报销完成')
  } else {
    return res.status(400).json({ code: 'BAD_REQUEST', message: '未知的核对动作' })
  }
  persist()
  res.json({ claim })
})

export default r
