/**
 * 条款检索引擎
 * ------------------------------------------------------------------
 * 只索引「现行有效」的条款：status === 'active' 且今天落在生效区间内。
 * 已失效 / 未生效的版本根本进不了索引，从源头保证口径不被旧版带偏。
 * 中文用二元组切词，打分用简化 BM25，这个量级（几十~几百条）够用，
 * 也省掉向量库依赖。条款自带的 keywords 命中再加权。
 * ------------------------------------------------------------------
 */

const K1 = 1.5
const B = 0.75
// 低于该分的命中视为噪声（如只蹭到「公司」两个字的弱匹配），宁可不答也不给错口径
const MIN_SCORE = 2.5

function isEffectiveToday(policy, today = new Date()) {
  const now = new Date(today.toDateString())
  if (policy.status !== 'active') return false
  if (new Date(policy.effectiveDate) > now) return false
  if (policy.expireDate && new Date(policy.expireDate) < now) return false
  return true
}

/** 混合切词：CJK 二元组 + 英文/数字单词 + 关键词精确命中 */
function tokenize(text) {
  const t = String(text || '').toLowerCase()
  const tokens = []
  // 英文与数字
  for (const w of t.match(/[a-z0-9]+/g) || []) tokens.push(w)
  // CJK 二元组
  const cjk = (t.match(/[\u4e00-\u9fff]+/g) || []).join('')
  for (let i = 0; i < cjk.length - 1; i++) tokens.push(cjk.slice(i, i + 2))
  return tokens
}

export function buildIndex(policies) {
  const docs = []
  for (const p of policies) {
    if (!isEffectiveToday(p)) continue
    for (const c of p.clauses) {
      docs.push({
        policy: p,
        clause: c,
        tokens: tokenize(`${p.title} ${p.category} ${c.title} ${c.text}`),
        keywords: (c.keywords || []).map((k) => k.toLowerCase()),
      })
    }
  }
  // df 统计
  const df = new Map()
  for (const d of docs) {
    for (const t of new Set(d.tokens)) df.set(t, (df.get(t) || 0) + 1)
  }
  const avgLen = docs.length ? docs.reduce((s, d) => s + d.tokens.length, 0) / docs.length : 1
  return { docs, df, avgLen, N: docs.length }
}

export function search(index, query, topK = 3) {
  const qTokens = new Set(tokenize(query))
  const qLower = String(query || '').toLowerCase()
  const scored = []
  for (const d of index.docs) {
    let score = 0
    const len = d.tokens.length || 1
    for (const t of qTokens) {
      const tf = d.tokens.filter((x) => x === t).length
      if (!tf) continue
      const idf = Math.log(1 + (index.N - (index.df.get(t) || 0) + 0.5) / ((index.df.get(t) || 0) + 0.5))
      score += idf * ((tf * (K1 + 1)) / (tf + K1 * (1 - B + B * (len / index.avgLen))))
    }
    // 关键词精确命中加权（覆盖「一晚」这类 query 切不出的搭配）
    for (const k of d.keywords) {
      if (qLower.includes(k)) score += 2
    }
    if (score >= MIN_SCORE) scored.push({ doc: d, score })
  }
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, topK)
}

export { isEffectiveToday }
