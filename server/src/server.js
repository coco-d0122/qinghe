import express from 'express'
import cors from 'cors'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { config } from './config.js'
import { loadDb } from './store.js'
import { buildSeed } from './seed.js'
import authRoutes from './routes/auth.js'
import policyRoutes from './routes/policies.js'
import assistantRoutes from './routes/assistant.js'
import claimRoutes from './routes/claims.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

loadDb(buildSeed)

app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (req, res) => res.json({ ok: true, name: '青禾报销助手' }))
app.use('/api/auth', authRoutes)
app.use('/api/policies', policyRoutes)
app.use('/api/assistant', assistantRoutes)
app.use('/api/claims', claimRoutes)

// 生产模式：直接托管前端构建产物，单进程即可部署
const distDir = path.join(__dirname, '..', '..', 'client', 'dist')
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))
  app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(distDir, 'index.html')))
}

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ code: 'INTERNAL', message: '服务内部错误' })
})

app.listen(config.port, () => {
  console.log(`青禾报销助手服务端已启动：http://localhost:${config.port}`)
})
