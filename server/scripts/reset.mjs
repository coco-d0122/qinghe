/**
 * 数据重置：删除本地 JSON 数据文件，下次启动服务时自动重新灌入种子数据
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data')
for (const f of ['db.json', 'db.json.tmp']) {
  const p = path.join(dataDir, f)
  if (fs.existsSync(p)) fs.rmSync(p)
}
console.log('演示数据已重置，重启服务端即可恢复初始状态。')
