import { Router } from 'express'
import { getDb } from '../store.js'
import { signToken, verifyPassword, authRequired } from '../auth.js'

const r = Router()

r.post('/login', (req, res) => {
  const { email, password } = req.body || {}
  const db = getDb()
  const user = db.users.find((u) => u.email === String(email || '').trim().toLowerCase())
  if (!user || !verifyPassword(password || '', user.passwordHash)) {
    return res.status(401).json({ code: 'BAD_CREDENTIALS', message: '邮箱或密码不正确' })
  }
  const { passwordHash, ...safe } = user
  res.json({ token: signToken(user), user: safe })
})

r.get('/me', authRequired, (req, res) => {
  const db = getDb()
  const user = db.users.find((u) => u.id === req.user.uid)
  if (!user) return res.status(401).json({ code: 'UNAUTHORIZED', message: '账号不存在' })
  const { passwordHash, ...safe } = user
  res.json({ user: safe })
})

export default r
