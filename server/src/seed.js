import { hashPassword } from './auth.js'

function daysAgo(n, hour = 10) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(hour, 15, 0, 0)
  return d.toISOString()
}

function daysLater(n, hour = 9) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

export function buildSeed() {
  const users = [
    {
      id: 'u-lin',
      email: 'lin@qinghe.com',
      passwordHash: hashPassword('demo1234'),
      name: '小林',
      employeeNo: 'QG-1010',
      role: 'employee',
      dept: '市场部',
    },
    {
      id: 'u-qiao',
      email: 'qiao@qinghe.com',
      passwordHash: hashPassword('demo1234'),
      name: '乔姐',
      employeeNo: 'XZ-0001',
      role: 'admin',
      dept: '行政部',
    },
    {
      id: 'u-zhou',
      email: 'zhou@qinghe.com',
      passwordHash: hashPassword('demo1234'),
      name: '周敏',
      employeeNo: 'CW-0001',
      role: 'finance',
      dept: '财务部',
    },
  ]

  /* ================= 制度库（乔姐维护） =================
   * 差旅制度带版本沿革：v3.1 已失效 / v3.2 现行有效。
   * 检索与员工侧列表只认现行有效版本，历史版本仅供留档对照。
   */
  const policies = [
    {
      id: 'pol-001',
      code: 'QH-CW-001',
      title: '差旅费报销制度',
      category: '差旅管理',
      version: 'v3.2',
      status: 'active',
      effectiveDate: '2026-01-01',
      expireDate: '',
      maintainerId: 'u-qiao',
      maintainer: '乔姐',
      summary: '出差交通费、住宿费、伙食补贴标准，报销材料与时限要求。',
      clauses: [
        {
          no: '3.1',
          title: '交通费标准',
          text: '出差交通应选择经济合理的出行方式。市内交通凭票据实报销；长途出行高铁限二等座、动车限二等座、飞机限经济舱。因公务需要超出上述标准的，须事前经部门负责人书面同意，否则差额由个人承担。',
          keywords: ['交通费', '高铁', '二等座', '动车', '飞机', '经济舱', '机票', '火车票'],
        },
        {
          no: '3.2',
          title: '住宿费标准',
          text: '住宿费按出差目的地分档执行，凭发票据实报销，超支部分个人自理：一线城市每晚上限 500 元，二线城市每晚上限 400 元，其他城市每晚上限 300 元。',
          keywords: ['住宿', '住宿费', '酒店', '房费', '上限', '一线城市', '二线城市', '一晚'],
        },
        {
          no: '3.3',
          title: '伙食补贴',
          text: '伙食补贴按实际出差天数计发，标准为 100 元/天，无需提供票据，随差旅费一并报销。出差当天往返的按半天计算。',
          keywords: ['伙食', '伙食补贴', '补贴', '餐补', '出差补贴', '每天', '吃饭'],
        },
        {
          no: '3.4',
          title: '报销材料',
          text: '报销差旅费须提供：增值税发票原件（交通票、住宿费发票）、机票行程单或车票、酒店水单，以及出差审批单。缺少行程单或发票的，财务不予受理。',
          keywords: ['材料', '发票', '行程单', '水单', '审批单', '凭证', '需要交', '要交'],
        },
        {
          no: '3.5',
          title: '报销时限',
          text: '出差结束后应在 15 个工作日内提交报销单据。逾期超过 30 个自然日的，须附部门负责人书面说明方可受理。',
          keywords: ['时限', '多久', '几天', '工作日', '提交', '逾期', '时间', '什么时候'],
        },
      ],
      revisionNote: 'v3.2 起住宿费改为按城市分档（500/400/300），伙食补贴由 80 元/天提高至 100 元/天。',
      updatedAt: daysAgo(42, 9),
    },
    {
      id: 'pol-001-v31',
      code: 'QH-CW-001',
      title: '差旅费报销制度',
      category: '差旅管理',
      version: 'v3.1',
      status: 'expired',
      effectiveDate: '2024-06-01',
      expireDate: '2025-12-31',
      maintainerId: 'u-qiao',
      maintainer: '乔姐',
      summary: '（历史版本）住宿费全国统一上限 400 元，伙食补贴 80 元/天。',
      clauses: [
        {
          no: '3.2',
          title: '住宿费标准',
          text: '住宿费全国统一每晚上限 400 元，凭发票据实报销，超支部分个人自理。',
          keywords: ['住宿', '住宿费', '酒店', '上限'],
        },
        {
          no: '3.3',
          title: '伙食补贴',
          text: '伙食补贴标准为 80 元/天，按实际出差天数计发。',
          keywords: ['伙食', '补贴', '餐补'],
        },
      ],
      revisionNote: 'v3.1 已被 v3.2 取代，仅作留档对照，不作为报销依据。',
      updatedAt: daysAgo(400, 9),
    },
    {
      id: 'pol-002',
      code: 'QH-CW-002',
      title: '市内交通与通勤补贴制度',
      category: '交通补贴',
      version: 'v2.0',
      status: 'active',
      effectiveDate: '2025-07-01',
      expireDate: '',
      maintainerId: 'u-qiao',
      maintainer: '乔姐',
      summary: '加班打车、通勤补贴与因公外出办事的交通费用口径。',
      clauses: [
        {
          no: '2.1',
          title: '加班交通',
          text: '工作日加班至 21:00 以后，可凭打车票据实报销交通费，单次上限 80 元。同一晚多次打车的，仅报销最后一段返程费用。',
          keywords: ['加班', '打车', '出租车', '网约车', '打车费', '21点', '晚上', '返程'],
        },
        {
          no: '2.2',
          title: '通勤补贴',
          text: '通勤补贴标准为每人每月 200 元，随当月工资发放，不再单独提交报销单据，也不接受通勤票据报销。',
          keywords: ['通勤', '通勤补贴', '交通补贴', '每月', '200', '上下班', '月补贴'],
        },
        {
          no: '2.3',
          title: '因公外出办事交通',
          text: '因公外出办事，优先乘坐公共交通；确需打车的，应在单据中写明办事事由与起止地点，否则财务可予退回。',
          keywords: ['外出', '办事', '公共交通', '地铁', '公交', '事由', '起止'],
        },
      ],
      revisionNote: 'v2.0 起通勤补贴改为随工资发放，不再单独报销。',
      updatedAt: daysAgo(180, 9),
    },
    {
      id: 'pol-003',
      code: 'QH-CW-003',
      title: '业务招待费管理制度',
      category: '业务招待',
      version: 'v1.3',
      status: 'active',
      effectiveDate: '2025-09-01',
      expireDate: '',
      maintainerId: 'u-qiao',
      maintainer: '乔姐',
      summary: '业务招待的事前审批、人均标准与陪餐人数要求。',
      clauses: [
        {
          no: '4.1',
          title: '事前审批',
          text: '业务招待须事前填写《业务招待审批单》，经部门负责人批准；单次预计金额超过 2000 元的，须分管副总批准。事后补批一律不予受理。',
          keywords: ['招待', '请客', '审批', '审批单', '事前', '客户', '吃饭', '餐费'],
        },
        {
          no: '4.2',
          title: '招待标准',
          text: '业务招待费按参加人数人均不超过 150 元执行（不含酒水）。陪餐人数不得超过来访人数的三分之一，且最多不超过 3 人。',
          keywords: ['招待', '标准', '人均', '150', '陪餐', '人数', '酒水'],
        },
        {
          no: '4.3',
          title: '报销材料',
          text: '报销业务招待费须提供：审批单、餐饮增值税发票、菜单或消费清单，并在单据中写明招待对象单位与事由。',
          keywords: ['招待', '材料', '发票', '菜单', '清单', '事由'],
        },
      ],
      revisionNote: 'v1.3 将人均标准由 120 元调整为 150 元，并明确陪餐人数上限。',
      updatedAt: daysAgo(90, 9),
    },
    {
      id: 'pol-004',
      code: 'QH-XZ-004',
      title: '办公用品采购报销制度',
      category: '办公采购',
      version: 'v1.0',
      status: 'active',
      effectiveDate: '2025-03-01',
      expireDate: '',
      maintainerId: 'u-qiao',
      maintainer: '乔姐',
      summary: '零星办公用品的采购渠道与报销口径。',
      clauses: [
        {
          no: '2.1',
          title: '采购渠道',
          text: '单笔预算 1000 元以下的零星办公用品可自行采购后报销；1000 元（含）以上应提交行政部统一走集中采购，不再受理个人报销。',
          keywords: ['办公用品', '采购', '1000', '文具', '耗材', '自行采购', '集中采购'],
        },
        {
          no: '2.2',
          title: '报销材料',
          text: '报销办公用品须提供增值税发票（抬头为公司全称）与商品明细清单；网店订单需附订单截图。发票抬头错误的财务退回更换。',
          keywords: ['办公用品', '发票', '抬头', '清单', '订单', '材料'],
        },
      ],
      revisionNote: '首版发布。',
      updatedAt: daysAgo(300, 9),
    },
    {
      id: 'pol-005',
      code: 'QH-CW-005',
      title: '通讯费补贴制度',
      category: '通讯补贴',
      version: 'v1.1',
      status: 'active',
      effectiveDate: '2025-01-01',
      expireDate: '',
      maintainerId: 'u-qiao',
      maintainer: '乔姐',
      summary: '岗位通讯补贴分档标准。',
      clauses: [
        {
          no: '1.1',
          title: '补贴标准',
          text: '通讯补贴按岗位分档：普通员工每人每月 100 元，部门经理及以上每人每月 200 元，随工资发放，凭票报销的方式已取消。',
          keywords: ['通讯', '话费', '手机', '补贴', '100', '200', '每月'],
        },
      ],
      revisionNote: 'v1.1 起取消凭票报销，统一随工资发放。',
      updatedAt: daysAgo(260, 9),
    },
  ]

  /* ================= 演示单据（小林名下） ================= */
  const claims = [
    {
      id: 'R-0001',
      ownerId: 'u-lin',
      ownerName: '小林',
      title: '差旅报销 · 上海客户拜访（3 天 2 晚）',
      type: '差旅费',
      status: 'SUBMITTED',
      items: [
        { desc: '高铁 往返二等座', date: '2026-09-22', amount: 1246 },
        { desc: '酒店 2 晚（一线城市）', date: '2026-09-23', amount: 920 },
        { desc: '伙食补贴 3 天', date: '2026-09-25', amount: 300 },
      ],
      amount: 2466,
      policyCode: 'QH-CW-001',
      createdAt: daysAgo(6, 11),
      verification: null,
      timeline: [
        { at: daysAgo(6, 11), actor: '小林', action: '提交报销单，等待材料审核' },
      ],
    },
    {
      id: 'R-0002',
      ownerId: 'u-lin',
      ownerName: '小林',
      title: '市内交通 · 加班打车（9 月）',
      type: '市内交通',
      status: 'VERIFYING',
      items: [
        { desc: '加班返程打车 3 次', date: '2026-09-18', amount: 214 },
      ],
      amount: 214,
      policyCode: 'QH-CW-002',
      createdAt: daysAgo(12, 16),
      verification: null,
      timeline: [
        { at: daysAgo(12, 16), actor: '小林', action: '提交报销单，等待材料审核' },
        { at: daysAgo(10, 10), actor: '周敏', action: '材料齐全，开始核对业务事实' },
      ],
    },
    {
      id: 'R-0003',
      ownerId: 'u-lin',
      ownerName: '小林',
      title: '办公用品 · 设计部文具耗材',
      type: '办公用品',
      status: 'APPROVED',
      items: [
        { desc: '文具与打印耗材', date: '2026-09-10', amount: 486 },
      ],
      amount: 486,
      policyCode: 'QH-XZ-004',
      createdAt: daysAgo(24, 14),
      verification: {
        verifiedAt: daysAgo(20, 15),
        verifier: '周敏',
        opinion: '发票与清单一致，金额在 1000 元以下符合自行采购口径，核对通过。',
        checks: ['金额与发票一致', '事由属实', '凭证齐全', '符合制度标准'],
      },
      timeline: [
        { at: daysAgo(24, 14), actor: '小林', action: '提交报销单，等待材料审核' },
        { at: daysAgo(22, 10), actor: '周敏', action: '材料齐全，开始核对业务事实' },
        { at: daysAgo(20, 15), actor: '周敏', action: '业务事实核对通过，待打款' },
      ],
    },
    {
      id: 'R-0004',
      ownerId: 'u-lin',
      ownerName: '小林',
      title: '差旅报销 · 北京行业会议（2 天 1 晚）',
      type: '差旅费',
      status: 'PAID',
      items: [
        { desc: '高铁 往返二等座', date: '2026-08-12', amount: 920 },
        { desc: '酒店 1 晚（一线城市）', date: '2026-08-12', amount: 468 },
        { desc: '伙食补贴 2 天', date: '2026-08-13', amount: 200 },
      ],
      amount: 1588,
      policyCode: 'QH-CW-001',
      createdAt: daysAgo(55, 11),
      verification: {
        verifiedAt: daysAgo(50, 14),
        verifier: '周敏',
        opinion: '各项均在制度标准内，核对通过。',
        checks: ['金额与发票一致', '事由属实', '凭证齐全', '符合制度标准'],
      },
      timeline: [
        { at: daysAgo(55, 11), actor: '小林', action: '提交报销单，等待材料审核' },
        { at: daysAgo(53, 9), actor: '周敏', action: '材料齐全，开始核对业务事实' },
        { at: daysAgo(50, 14), actor: '周敏', action: '业务事实核对通过，待打款' },
        { at: daysAgo(45, 9), actor: '周敏', action: '已打款，报销完成' },
      ],
    },
    {
      id: 'R-0005',
      ownerId: 'u-lin',
      ownerName: '小林',
      title: '差旅报销 · 广州客户回访（2 天 1 晚）',
      type: '差旅费',
      status: 'REJECTED',
      items: [
        { desc: '高铁 往返二等座', date: '2026-07-08', amount: 872 },
        { desc: '酒店 1 晚（一线城市）', date: '2026-07-08', amount: 680 },
      ],
      amount: 1552,
      policyCode: 'QH-CW-001',
      createdAt: daysAgo(88, 11),
      verification: {
        verifiedAt: daysAgo(84, 10),
        verifier: '周敏',
        opinion: '住宿 680 元超出一线城市每晚 500 元上限，超出部分 180 元不予报销，驳回请修改后重新提交。',
        checks: ['金额与发票一致', '事由属实', '凭证齐全'],
      },
      timeline: [
        { at: daysAgo(88, 11), actor: '小林', action: '提交报销单，等待材料审核' },
        { at: daysAgo(86, 9), actor: '周敏', action: '材料齐全，开始核对业务事实' },
        { at: daysAgo(84, 10), actor: '周敏', action: '核对未通过，单据驳回：住宿超标准' },
      ],
    },
  ]

  return {
    seq: 100,
    claimSeq: 5,
    users,
    policies,
    claims,
    // 员工查本人单据前须授权；可随时撤回
    consents: {},
    // 问答留痕，仅本人可见 { [userId]: [{q, a, at, citations}] }
    qaHistory: {},
  }
}
