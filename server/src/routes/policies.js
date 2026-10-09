import { Router } from 'express'
import { getDb, persist, nextId } from '../store.js'
import { authRequired, requireRoles } from '../auth.js'
import { isEffectiveToday } from '../retrieve.js'

const r = Router()
r.use(authRequired)

const publicView = (p) => ({
  id: p.id,
  code: p.code,
  title: p.title,
  category: p.category,
  version: p.version,
  status: p.status,
  effectiveDate: p.effectiveDate,
  expireDate: p.expireDate,
  maintainer: p.maintainer,
  summary: p.summary,
  clauses: p.clauses,
  revisionNote: p.revisionNote,
  updatedAt: p.updatedAt,
})

/** 制度列表：员工只见现行有效；行政专员可带 all=1 看全部（含失效留档） */
r.get('/', (req, res) => {
  const db = getDb()
  const { all, category, q } = req.query
  let list = db.policies.slice()
  if (String(all) !== '1' || req.user.role !== 'admin') {
    list = list.filter((p) => isEffectiveToday(p))
  }
  if (category && category !== '全部') list = list.filter((p) => p.category === category)
  if (q) {
    const kw = String(q).toLowerCase()
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(kw) ||
        p.code.toLowerCase().includes(kw) ||
        p.summary.toLowerCase().includes(kw) ||
        p.clauses.some((c) => c.title.includes(kw) || c.text.includes(kw))
    )
  }
  list.sort((a, b) => (a.code === b.code ? b.effectiveDate.localeCompare(a.effectiveDate) : a.code.localeCompare(b.code)))
  res.json({ policies: list.map(publicView), effectiveOnly: String(all) !== '1' || req.user.role !== 'admin' })
})

r.get('/meta', (req, res) => {
  const db = getDb()
  const cats = [...new Set(db.policies.filter(isEffectiveToday).map((p) => p.category))]
  res.json({ categories: cats })
})

r.get('/:id', (req, res) => {
  const db = getDb()
  const p = db.policies.find((x) => x.id === req.params.id)
  if (!p) return res.status(404).json({ code: 'NOT_FOUND', message: '制度不存在' })
  // 失效版本仅行政专员可查（员工侧从源头只见现行有效）
  if (!isEffectiveToday(p) && req.user.role !== 'admin') {
    return res.status(403).json({ code: 'FORBIDDEN', message: '该版本已失效，仅行政专员可查看留档' })
  }
  const history = db.policies
    .filter((x) => x.code === p.code && x.id !== p.id)
    .map((x) => ({ id: x.id, version: x.version, status: x.status, effectiveDate: x.effectiveDate, expireDate: x.expireDate }))
    .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate))
  res.json({ policy: publicView(p), history })
})

const validClauses = (clauses) =>
  Array.isArray(clauses) &&
  clauses.length > 0 &&
  clauses.every((c) => c && c.no && c.title && c.text)

/** 新建制度（草稿）：仅行政专员 */
r.post('/', requireRoles('admin'), (req, res) => {
  const { code, title, category, version, effectiveDate, summary, clauses, revisionNote } = req.body || {}
  if (!code || !title || !category || !version || !effectiveDate || !validClauses(clauses)) {
    return res.status(400).json({ code: 'BAD_REQUEST', message: '缺少必填字段或条款不完整（编号/标题/正文）' })
  }
  const db = getDb()
  if (db.policies.some((p) => p.code === code && isEffectiveToday(p))) {
    return res.status(409).json({ code: 'CONFLICT', message: `制度编号 ${code} 已有现行有效版本，请改用「发布新版」` })
  }
  const p = {
    id: nextId('pol'),
    code,
    title,
    category,
    version,
    status: 'active',
    effectiveDate,
    expireDate: '',
    maintainerId: req.user.uid,
    maintainer: req.user.name,
    summary: summary || '',
    clauses,
    revisionNote: revisionNote || '首版发布。',
    updatedAt: new Date().toISOString(),
  }
  db.policies.push(p)
  persist()
  res.status(201).json({ policy: publicView(p) })
})

/** 发布新版：新版生效，同编号旧版自动转已失效并留档 */
r.post('/:id/publish-version', requireRoles('admin'), (req, res) => {
  const db = getDb()
  const old = db.policies.find((x) => x.id === req.params.id)
  if (!old) return res.status(404).json({ code: 'NOT_FOUND', message: '原制度不存在' })
  const { version, effectiveDate, summary, clauses, revisionNote, title, category } = req.body || {}
  if (!version || !effectiveDate || !validClauses(clauses)) {
    return res.status(400).json({ code: 'BAD_REQUEST', message: '缺少版本号、生效日期或条款不完整' })
  }
  if (version === old.version) {
    return res.status(400).json({ code: 'BAD_REQUEST', message: '新版版本号不能与当前版本相同' })
  }
  const effective = new Date(effectiveDate)
  if (Number.isNaN(effective.getTime())) {
    return res.status(400).json({ code: 'BAD_REQUEST', message: '生效日期格式不正确' })
  }
  const tomorrow = new Date(effective)
  tomorrow.setDate(tomorrow.getDate() - 1)
  const expireForOld = tomorrow.toISOString().slice(0, 10)

  const created = {
    id: nextId('pol'),
    code: old.code,
    title: title || old.title,
    category: category || old.category,
    version,
    status: 'active',
    effectiveDate,
    expireDate: '',
    maintainerId: req.user.uid,
    maintainer: req.user.name,
    summary: summary || old.summary,
    clauses,
    revisionNote: revisionNote || `${version} 发布，取代 ${old.version}。`,
    updatedAt: new Date().toISOString(),
  }
  db.policies.push(created)

  // 同编号其他现行版本全部转失效
  for (const p of db.policies) {
    if (p.code === old.code && p.id !== created.id && p.status === 'active') {
      p.status = 'expired'
      p.expireDate = expireForOld
      p.updatedAt = new Date().toISOString()
    }
  }
  persist()
  res.status(201).json({ policy: publicView(created) })
})

/** 手动停用（废止）现行制度 */
r.post('/:id/deprecate', requireRoles('admin'), (req, res) => {
  const db = getDb()
  const p = db.policies.find((x) => x.id === req.params.id)
  if (!p) return res.status(404).json({ code: 'NOT_FOUND', message: '制度不存在' })
  if (p.status !== 'active') return res.status(400).json({ code: 'BAD_REQUEST', message: '该版本不是现行有效状态' })
  p.status = 'expired'
  p.expireDate = new Date().toISOString().slice(0, 10)
  p.updatedAt = new Date().toISOString()
  persist()
  res.json({ policy: publicView(p) })
})

export default r
