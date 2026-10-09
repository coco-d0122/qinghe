/**
 * 接口冒烟测试：覆盖有效制度可见性、检索口径、授权查单、
 * 三类角色权限边界、状态机跳步拦截。前提：服务端已在 :3001 启动。
 *
 *   node scripts/smoke.mjs
 */
const BASE = process.env.API_BASE || 'http://localhost:3001'

let passed = 0
let failed = 0

function ok(cond, name) {
  if (cond) {
    passed++
    console.log(`  ✓ ${name}`)
  } else {
    failed++
    console.error(`  ✗ ${name}`)
  }
}

async function api(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  let data = {}
  try {
    data = await res.json()
  } catch {}
  return { status: res.status, data }
}

async function login(email) {
  const { status, data } = await api('/api/auth/login', { method: 'POST', body: { email, password: 'demo1234' } })
  if (status !== 200) throw new Error(`登录失败: ${email}`)
  return data.token
}

console.log('— 登录与身份 —')
const wrong = await api('/api/auth/login', { method: 'POST', body: { email: 'lin@qinghe.com', password: 'wrong' } })
ok(wrong.status === 401, '错误密码被拒绝')
const noAuth = await api('/api/policies')
ok(noAuth.status === 401, '未登录不能访问业务接口')
const lin = await login('lin@qinghe.com')
const qiao = await login('qiao@qinghe.com')
const zhou = await login('zhou@qinghe.com')
ok(!!lin && !!qiao && !!zhou, '三个演示账号均可登录')

console.log('— 制度可见性：只认现行有效 —')
const linPolicies = await api('/api/policies', { token: lin })
ok(linPolicies.status === 200 && linPolicies.data.policies.every((p) => p.status === 'active'), '员工列表只见现行有效制度')
ok(!linPolicies.data.policies.some((p) => p.version === 'v3.1'), '已失效的差旅 v3.1 不出现在员工列表')
const qiaoAll = await api('/api/policies?all=1', { token: qiao })
ok(qiaoAll.data.policies.some((p) => p.version === 'v3.1'), '行政专员可查看含失效的完整留档')
const linAll = await api('/api/policies?all=1', { token: lin })
ok(!linAll.data.policies.some((p) => p.version === 'v3.1'), '员工带 all=1 也看不到失效版本（服务端强制）')

console.log('— 制度问答：口径可回溯 —')
const ask1 = await api('/api/assistant/ask', { method: 'POST', token: lin, body: { question: '出差住宿一晚上限多少钱' } })
ok(ask1.status === 200, '提问接口正常返回')
ok(ask1.data.answer.includes('500') && ask1.data.answer.includes('400'), '住宿问题命中 v3.2 分档标准（500/400/300）')
ok(!ask1.data.answer.includes('统一每晚上限 400') || ask1.data.answer.includes('分档'), '答案不被失效 v3.1 的统一 400 带偏')
ok(ask1.data.citations.length > 0 && ask1.data.citations[0].version === 'v3.2', '引用出处指向 v3.2')
const ask2 = await api('/api/assistant/ask', { method: 'POST', token: lin, body: { question: '公司食堂好不好吃' } })
ok(ask2.data.mode === 'none' && ask2.data.citations.length === 0, '检索不到就明说，不推测')
const askNoAuth = await api('/api/assistant/ask', { method: 'POST', body: { question: '住宿' } })
ok(askNoAuth.status === 401, '未登录不能提问')

console.log('— 单据授权：首次进入需同意 —')
const beforeConsent = await api('/api/claims', { token: lin })
ok(beforeConsent.status === 403 && beforeConsent.data.code === 'CONSENT_REQUIRED', '未授权时查询本人单据被拦截')
const consent = await api('/api/claims/consent', { method: 'POST', token: lin, body: { granted: true } })
ok(consent.status === 200 && consent.data.consent.granted, '可以同意授权')

console.log('— 单据仅本人可见 —')
const myClaims = await api('/api/claims', { token: lin })
ok(myClaims.status === 200 && myClaims.data.claims.every((c) => c.ownerId === 'u-lin'), '员工查到本人全部单据')
const r1 = await api('/api/claims/R-0001', { token: lin })
ok(r1.status === 200 && r1.data.claim.id === 'R-0001', '本人可查自己单据详情')
const r1ByZhou = await api('/api/claims/R-0001', { token: zhou })
ok(r1ByZhou.status === 200, '财务专员因核对需要可读单据')
const newClaim = await api('/api/claims', {
  method: 'POST',
  token: zhou,
  body: { title: 'x', type: '差旅费', items: [{ desc: 'y', amount: 1 }] },
})
// 周敏自己的号建的单据归周敏本人，小林无权查看 → 验证越权拦截
if (newClaim.status === 201) {
  const cross = await api('/api/claims/' + newClaim.data.claim.id, { token: lin })
  ok(cross.status === 403, '拿别人的单据号直接访问被拒绝')
}

console.log('— 角色权限边界 —')
const createByLin = await api('/api/policies', {
  method: 'POST',
  token: lin,
  body: { code: 'QH-TEST', title: 't', category: 'c', version: 'v1.0', effectiveDate: '2026-01-01', clauses: [{ no: '1', title: 't', text: 'x' }] },
})
ok(createByLin.status === 403, '员工不能维护制度')
const reviewByLin = await api('/api/claims/R-0001/review', { method: 'POST', token: lin, body: { action: 'start' } })
ok(reviewByLin.status === 403, '员工不能核对单据')
const createByZhou = await api('/api/policies', {
  method: 'POST',
  token: zhou,
  body: { code: 'QH-TEST', title: 't', category: 'c', version: 'v1.0', effectiveDate: '2026-01-01', clauses: [{ no: '1', title: 't', text: 'x' }] },
})
ok(createByZhou.status === 403, '财务专员也不能维护制度（制度口径只归行政）')

console.log('— 状态机：跳步拦截 —')
const payJump = await api('/api/claims/R-0001/review', { method: 'POST', token: zhou, body: { action: 'pay' } })
ok(payJump.status === 400 && payJump.data.code === 'BAD_TRANSITION', '材料审核中不能直接打款')
const start = await api('/api/claims/R-0001/review', { method: 'POST', token: zhou, body: { action: 'start' } })
ok(start.status === 200 && start.data.claim.status === 'VERIFYING', '开始核对：进入财务核对中')
const approve = await api('/api/claims/R-0001/review', {
  method: 'POST',
  token: zhou,
  body: { action: 'approve', opinion: '各项符合制度标准', checks: ['金额与发票一致', '凭证齐全'] },
})
ok(approve.status === 200 && approve.data.claim.status === 'APPROVED', '核对通过：待打款')
ok(approve.data.claim.verification?.verifier === '周敏', '核对结论记录核对人')
const pay = await api('/api/claims/R-0001/review', { method: 'POST', token: zhou, body: { action: 'pay' } })
ok(pay.status === 200 && pay.data.claim.status === 'PAID', '标记打款：流程完成')

console.log('— 发布新版：旧版自动失效 —')
const detail = await api('/api/policies/pol-002', { token: qiao })
const pub = await api('/api/policies/pol-002/publish-version', {
  method: 'POST',
  token: qiao,
  body: {
    version: 'v2.1',
    effectiveDate: '2026-10-01',
    clauses: [{ no: '2.1', title: '加班交通', text: '工作日加班至 21:00 以后，可凭打车票据实报销交通费，单次上限 100 元。', keywords: ['加班', '打车'] }],
  },
})
ok(pub.status === 201 && pub.data.policy.version === 'v2.1', '发布新版成功')
const afterPub = await api('/api/policies', { token: lin })
const t202 = afterPub.data.policies.find((p) => p.code === 'QH-CW-002')
ok(t202 && t202.version === 'v2.1', '员工列表中新版取代旧版')
const ask3 = await api('/api/assistant/ask', { method: 'POST', token: lin, body: { question: '加班打车单次上限多少' } })
ok(ask3.data.answer.includes('100'), '问答口径切换到新版（80 → 100）')
const revoke = await api('/api/claims/consent', { method: 'POST', token: lin, body: { granted: false } })
const afterRevoke = await api('/api/claims', { token: lin })
ok(revoke.status === 200 && afterRevoke.status === 403, '撤回授权后查单再次被拦截')

console.log(`\n结果：${passed} 通过，${failed} 失败`)
process.exit(failed ? 1 : 0)
