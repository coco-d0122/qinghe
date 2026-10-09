import { Router } from 'express'
import { getDb, persist } from '../store.js'
import { authRequired } from '../auth.js'
import { buildIndex, search } from '../retrieve.js'
import { generateAnswer } from '../llm.js'

const r = Router()
r.use(authRequired)

/** 一句话提问：只检索现行有效制度，答案附条款出处 */
r.post('/ask', async (req, res) => {
  const question = String((req.body || {}).question || '').trim()
  if (!question) return res.status(400).json({ code: 'BAD_REQUEST', message: '请输入问题' })
  if (question.length > 200) return res.status(400).json({ code: 'BAD_REQUEST', message: '问题太长了，请精简到 200 字以内' })

  const db = getDb()
  const index = buildIndex(db.policies)
  const hits = search(index, question, 3)
  const { mode, text, citations } = await generateAnswer(question, hits)

  // 问答留痕，仅存在本人名下
  const history = (db.qaHistory[req.user.uid] = db.qaHistory[req.user.uid] || [])
  history.unshift({ q: question, a: text, mode, citations, at: new Date().toISOString() })
  if (history.length > 50) history.length = 50
  persist()

  res.json({ mode, answer: text, citations })
})

r.get('/history', (req, res) => {
  const db = getDb()
  res.json({ history: db.qaHistory[req.user.uid] || [] })
})

r.delete('/history', (req, res) => {
  const db = getDb()
  db.qaHistory[req.user.uid] = []
  persist()
  res.json({ ok: true })
})

export default r
