import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { config } from './config.js'

export const ROLES = {
  EMPLOYEE: 'employee',   // 员工：查制度、提问、经授权查本人单据
  ADMIN: 'admin',         // 行政专员（乔姐）：维护制度口径
  FINANCE: 'finance',     // 财务专员（周敏）：核对单据业务事实
}

export const ROLE_LABEL = { employee: '员工', admin: '行政专员', finance: '财务专员' }

export function hashPassword(plain) {
  return bcrypt.hashSync(plain, 10)
}

export function verifyPassword(plain, hash) {
  return bcrypt.compareSync(plain, hash)
}

export function signToken(user) {
  return jwt.sign(
    { uid: user.id, name: user.name, role: user.role, email: user.email },
    config.jwtSecret,
    { expiresIn: '7d' }
  )
}

/** 登录态中间件：解析 Bearer token */
export function authRequired(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ code: 'UNAUTHORIZED', message: '请先登录' })
  try {
    req.user = jwt.verify(token, config.jwtSecret)
    next()
  } catch {
    return res.status(401).json({ code: 'UNAUTHORIZED', message: '登录已过期，请重新登录' })
  }
}

/** 角色门禁：真正的约束在接口层，前端藏按钮只是体验问题 */
export function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ code: 'UNAUTHORIZED', message: '请先登录' })
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ code: 'FORBIDDEN', message: '当前角色无权执行此操作' })
    }
    next()
  }
}
