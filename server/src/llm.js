import { config } from './config.js'

/**
 * 生成回答：优先走 OpenAI 兼容的大模型接口，任何失败都降级为
 * 「制度原文摘录」模式——把检索到的条款原样拼出，标注未接模型，
 * 绝不编造内容。两种模式都返回条款引用，口径可回溯。
 */

const SYSTEM_PROMPT = `你是青禾报销助手的制度问答员。规则：
1. 只依据下面提供的制度条款回答，禁止使用任何外部知识或推测。
2. 回答控制在三句话以内，直接给口径；涉及金额标准要给出数字。
3. 回答末尾不需要列出条款编号，系统会自动附上引用卡片。
4. 如果提供的条款不足以回答问题，只回复：现行制度未覆盖这个问题。`

export async function generateAnswer(question, hits) {
  if (!hits.length) {
    return {
      mode: 'none',
      text: '现行有效制度里没有找到能回答这个问题的条款。为避免给你错误口径，这里不做推测——请联系行政专员乔姐（XZ-0001）确认后，她会更新制度库。',
      citations: [],
    }
  }

  const contexts = hits.map(
    (h, i) => `[${i + 1}] 《${h.doc.policy.title}》${h.doc.policy.version} 第${h.doc.clause.no}条 ${h.doc.clause.title}：${h.doc.clause.text}`
  )

  const llm = await tryLlm(question, contexts)
  if (llm) {
    const noAnswer = llm.includes('现行制度未覆盖')
    return {
      mode: 'llm',
      text: noAnswer
        ? '现行有效制度未覆盖这个问题。为避免口径出错，请联系行政专员乔姐（XZ-0001）确认。'
        : llm.trim(),
      citations: buildCitations(hits),
    }
  }

  const text =
    `根据现行有效制度，为你找到以下条款：\n\n` +
    hits.map((h, i) => `${i + 1}. 【${h.doc.policy.title} ${h.doc.policy.version} · 第${h.doc.clause.no}条 ${h.doc.clause.title}】${h.doc.clause.text}`).join('\n\n') +
    `\n\n（当前为制度原文摘录模式，未接入大模型；以上内容来自现行有效制度原文。）`
  return { mode: 'excerpt', text, citations: buildCitations(hits) }
}

function buildCitations(hits) {
  return hits.map((h) => ({
    policyId: h.doc.policy.id,
    code: h.doc.policy.code,
    title: h.doc.policy.title,
    version: h.doc.policy.version,
    clauseNo: h.doc.clause.no,
    clauseTitle: h.doc.clause.title,
    excerpt: h.doc.clause.text.length > 90 ? h.doc.clause.text.slice(0, 90) + '…' : h.doc.clause.text,
  }))
}

async function tryLlm(question, contexts) {
  const { baseUrl, apiKey, model } = config.llm
  if (!baseUrl || !apiKey) return null
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)
  try {
    const res = await fetch(baseUrl.replace(/\/+$/, '') + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `问题：${question}\n\n可用条款：\n${contexts.join('\n')}` },
        ],
        temperature: 0.2,
      }),
      signal: controller.signal,
    })
    if (!res.ok) return null
    const data = await res.json()
    const text = data?.choices?.[0]?.message?.content
    return typeof text === 'string' && text.trim() ? text : null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}
