import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, MessageCircle, ReceiptText, ArrowRight, ShieldCheck, Coins, Sparkles } from 'lucide-react'
import { useAuth } from '../App.jsx'

const HOT = [
  '出差住宿一晚上限多少钱',
  '报销需要交哪些材料',
  '加班打车怎么报',
  '报销时限是多久',
  '伙食补贴标准',
]

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isEmployee = user.role === 'employee'

  return (
    <div className="space-y-6">
      <section className="card relative overflow-hidden bg-gradient-to-br from-qinghe-600 to-qinghe-500 p-8 text-white">
        <div className="absolute -right-8 -top-10 text-white/10"><Sparkles size={160} /></div>
        <div className="text-sm text-white/75">{user.name}，你好</div>
        <h1 className="mt-1.5 text-2xl font-bold">报销不猜口径，进度不用问人</h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/85">
          先自助查<b>现行有效</b>的制度口径；提交报销后，经授权可查<b>本人</b>单据走到哪一步。制度由行政专员乔姐维护，业务事实由财务专员周敏核对。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={() => navigate('/assistant')} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-qinghe-700 transition hover:bg-white/90">
            <MessageCircle size={15} /> 一句话提问
          </button>
          <button onClick={() => navigate('/policies')} className="inline-flex items-center gap-1.5 rounded-lg border border-white/40 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
            <BookOpen size={15} /> 查制度库
          </button>
          {isEmployee && (
            <button onClick={() => navigate('/claims')} className="inline-flex items-center gap-1.5 rounded-lg border border-white/40 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
              <ReceiptText size={15} /> 查我的单据
            </button>
          )}
        </div>
      </section>

      {/* 热门问题 */}
      <section className="card p-6">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <MessageCircle size={15} className="text-qinghe-600" /> 大家最近在问
        </div>
        <div className="flex flex-wrap gap-2">
          {HOT.map((q) => (
            <button
              key={q}
              onClick={() => navigate(`/assistant?q=${encodeURIComponent(q)}`)}
              className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs text-slate-600 transition hover:border-qinghe-400 hover:bg-qinghe-50 hover:text-qinghe-700"
            >
              {q}
            </button>
          ))}
        </div>
      </section>

      {/* 责任边界 */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="card p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <ShieldCheck size={15} className="text-qinghe-600" /> 制度口径 · 行政专员乔姐
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            制度的增改、发布新版、设定生效日期由乔姐负责。改版走「发布新版」，新版生效后旧版自动转已失效留档，员工永远只会查到现行口径。
          </p>
          <Link to="/policies" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-qinghe-600 hover:text-qinghe-700">
            去制度库 <ArrowRight size={12} />
          </Link>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Coins size={15} className="text-qinghe-600" /> 业务事实 · 财务专员周敏
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            单据的金额、事由、凭证由周敏核对认定，核对通过才打款。单据进度只对你本人可见，未核对前金额仅供参考。
          </p>
          {isEmployee && (
            <Link to="/claims" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-qinghe-600 hover:text-qinghe-700">
              查我的单据 <ArrowRight size={12} />
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}
