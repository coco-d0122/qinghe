import React, { useEffect, useRef, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { MessageCircle, SendHorizonal, BookMarked, ShieldAlert, Loader2, Trash2 } from 'lucide-react'
import { api, fmtDateTime } from '../api.js'
import { useAuth } from '../App.jsx'
import { Loading, PageHeader } from '../components/ui.jsx'

function CitationCard({ c }) {
  return (
    <Link to={`/policies/${c.policyId}`} className="block rounded-lg border border-qinghe-100 bg-qinghe-50/50 p-3 transition hover:border-qinghe-300 hover:bg-qinghe-50">
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="font-semibold text-qinghe-700">《{c.title}》{c.version}</span>
        <span className="chip bg-white text-qinghe-700">第{c.clauseNo}条 · {c.clauseTitle}</span>
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">{c.excerpt}</p>
      <div className="mt-1.5 text-[10px] text-qinghe-500">来源：制度编号 {c.code} · 点击查看原文</div>
    </Link>
  )
}

export default function Assistant() {
  const { user } = useAuth()
  const [params] = useSearchParams()
  const [messages, setMessages] = useState([]) // {role:'user'|'bot', text, mode, citations}
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [history, setHistory] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    api('/assistant/history').then((d) => setHistory(d.history)).catch(() => setHistory([]))
  }, [])

  useEffect(() => {
    const q = params.get('q')
    if (q) {
      params.delete('q')
      window.history.replaceState(null, '', '/assistant')
      ask(q)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  async function ask(question) {
    if (!question.trim() || busy) return
    setMessages((m) => [...m, { role: 'user', text: question }])
    setInput('')
    setBusy(true)
    try {
      const d = await api('/assistant/ask', { method: 'POST', body: { question } })
      setMessages((m) => [...m, { role: 'bot', text: d.answer, mode: d.mode, citations: d.citations }])
      api('/assistant/history').then((x) => setHistory(x.history)).catch(() => {})
    } catch (e) {
      setMessages((m) => [...m, { role: 'bot', text: `出错了：${e.message}`, mode: 'error', citations: [] }])
    } finally {
      setBusy(false)
    }
  }

  async function clearHistory() {
    if (!confirm('清空本人的全部问答留痕？')) return
    await api('/assistant/history', { method: 'DELETE' }).catch(() => {})
    setHistory([])
  }

  const modeLabel = { llm: '大模型 + 条款引用', excerpt: '制度原文摘录', none: '未命中制度' }

  return (
    <div>
      <PageHeader title="智能问答" desc="只依据现行有效制度作答，答案附条款出处；制度没覆盖的问题会明说，不推测" />

      <div className="grid gap-5 lg:grid-cols-[1fr_240px]">
        {/* 对话区 */}
        <div className="card flex h-[560px] flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-qinghe-100 text-qinghe-600"><MessageCircle size={22} /></div>
                <div className="text-sm font-medium text-slate-500">问问看：报销需要交哪些材料？</div>
                <div className="text-xs text-slate-400">答案只来自现行有效制度的条款原文</div>
              </div>
            )}
            {messages.map((m, i) =>
              m.role === 'user' ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-md bg-qinghe-600 px-4 py-2.5 text-sm leading-relaxed text-white">{m.text}</div>
                </div>
              ) : (
                <div key={i} className="flex justify-start">
                  <div className="max-w-[88%] space-y-2.5">
                    <div className={`rounded-2xl rounded-bl-md border px-4 py-3 text-sm leading-relaxed ${
                      m.mode === 'none' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-slate-100 bg-white text-slate-700'
                    }`}>
                      {m.mode === 'none' && <ShieldAlert size={14} className="mb-1.5 text-amber-500" />}
                      <span className="whitespace-pre-wrap">{m.text}</span>
                    </div>
                    {m.citations?.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                          <BookMarked size={11} /> 条款出处（{modeLabel[m.mode] || ''}）
                        </div>
                        {m.citations.map((c, j) => <CitationCard key={j} c={c} />)}
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
            {busy && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Loader2 size={13} className="animate-spin text-qinghe-500" /> 正在检索现行有效制度…
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <form
            className="flex gap-2 border-t border-slate-100 p-3"
            onSubmit={(e) => {
              e.preventDefault()
              ask(input)
            }}
          >
            <input className="input flex-1" placeholder="输入关于报销制度的问题…" value={input} onChange={(e) => setInput(e.target.value)} disabled={busy} />
            <button className="btn-primary" disabled={busy || !input.trim()}>
              <SendHorizonal size={15} /> 提问
            </button>
          </form>
        </div>

        {/* 问答留痕（仅本人） */}
        <div className="card flex max-h-[560px] flex-col p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">我的提问记录</span>
            {history?.length > 0 && (
              <button onClick={clearHistory} title="清空留痕" className="rounded p-1 text-slate-400 hover:bg-slate-50 hover:text-red-500"><Trash2 size={13} /></button>
            )}
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto">
            {history === null ? (
              <Loading text="" />
            ) : history.length === 0 ? (
              <div className="py-6 text-center text-[11px] text-slate-400">留痕仅保存在你本人名下</div>
            ) : (
              history.map((h, i) => (
                <button
                  key={i}
                  onClick={() => setMessages((m) => [...m, { role: 'user', text: h.q }, { role: 'bot', text: h.a, mode: h.mode, citations: h.citations }])}
                  className="block w-full rounded-lg px-2.5 py-2 text-left transition hover:bg-slate-50"
                >
                  <div className="truncate text-xs text-slate-600">{h.q}</div>
                  <div className="mt-0.5 text-[10px] text-slate-400">{fmtDateTime(h.at)}</div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
