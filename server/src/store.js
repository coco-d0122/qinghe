import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'data')
const DB_FILE = path.join(DATA_DIR, 'db.json')

let db = null

/** 启动时载入数据；文件不存在时用种子函数初始化 */
export function loadDb(seedFn) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  if (fs.existsSync(DB_FILE)) {
    db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))
  } else {
    db = seedFn()
    persist()
  }
  return db
}

export function getDb() {
  return db
}

/** 原子写入，避免进程中断写坏文件 */
export function persist() {
  const tmp = DB_FILE + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2))
  fs.renameSync(tmp, DB_FILE)
}

export function nextId(prefix) {
  db.seq += 1
  return `${prefix}-${String(db.seq).padStart(4, '0')}`
}

export function nextClaimNo() {
  db.claimSeq += 1
  return `R-${String(db.claimSeq).padStart(4, '0')}`
}
