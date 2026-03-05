/* ============================================================
   ADHD ASRS v1.1 – Full Application Logic v3
   Features:
   1. Bug Fix: no pre-selected option (blur after render)
   2. Light/Dark theme toggle (localStorage persist)
   3. One-question-at-a-time quiz with slide animation
   4. Keyboard shortcuts: 1-5 = pick option, ←/→ navigate
   5. Auto-save progress to localStorage + resume banner
   6. Milestone toasts (Q9 halfway, Q18 complete)
   7. Timer: start→end, displayed in results
   8. Radar chart (5 dimensions) using Canvas 2D
   9. ASRS v1.1 scoring + 0–100 severity score
   10. Evidence-based solution cards (per level)
   ============================================================ */

(function () {
  'use strict';

  /* ── Constants ────────────────────────────────────────────── */
  const STORAGE_KEY = 'adhd_progress_v3';
  const THEME_KEY = 'adhd-theme';

  /* ── Questions ────────────────────────────────────────────── */
  const QUESTIONS = [
    { id: 1, part: 'A', tag: '组织管理', text: '当一项工作最有挑战性的部分完成后，您对收尾细节感到困难的频率如何？' },
    { id: 2, part: 'A', tag: '组织管理', text: '当您需要完成一项有组织要求的任务时，难以将其安排得井井有条的频率如何？' },
    { id: 3, part: 'A', tag: '记忆遗忘', text: '您难以记住约会或必须完成的日常事务的频率如何？' },
    { id: 4, part: 'A', tag: '拖延回避', text: '当有一项需要持续思考的任务时，您会回避或拖延开始的频率如何？' },
    { id: 5, part: 'A', tag: '多动冲动', text: '当您需要长时间静坐时，会因坐立不安而摆动手脚或扭动身体的频率如何？' },
    { id: 6, part: 'A', tag: '多动冲动', text: '您感到过度活跃，仿佛被马达驱动、非完成某事不可的频率如何？' },
    { id: 7, part: 'B', tag: '注意力', text: '从事枯燥或重复性工作时，您犯粗心大意错误的频率如何？' },
    { id: 8, part: 'B', tag: '注意力', text: '从事枯燥或重复性工作时，您难以保持注意力集中的频率如何？' },
    { id: 9, part: 'B', tag: '注意力', text: '即使别人直接与您说话，也难以集中注意力倾听的频率如何？' },
    { id: 10, part: 'B', tag: '日常失误', text: '您乱放或遗失物品（如钥匙、手机、文件）的频率如何？' },
    { id: 11, part: 'B', tag: '注意力', text: '您被周围的活动或噪音轻易分心的频率如何？' },
    { id: 12, part: 'B', tag: '多动冲动', text: '在会议或其他需要安坐的场合，您会离开座位的频率如何？' },
    { id: 13, part: 'B', tag: '多动冲动', text: '您感到内心不安宁或坐立不安的频率如何？' },
    { id: 14, part: 'B', tag: '情绪调节', text: '在您有自己的时间可以放松时，难以平静和放松的频率如何？' },
    { id: 15, part: 'B', tag: '冲动言行', text: '在社交场合，您发现自己话太多的频率如何？' },
    { id: 16, part: 'B', tag: '冲动言行', text: '在交谈时，在对方没说完之前就抢先接话的频率如何？' },
    { id: 17, part: 'B', tag: '冲动言行', text: '在需要排队的场合，您难以耐心等待的频率如何？' },
    { id: 18, part: 'B', tag: '冲动言行', text: '当别人忙碌时，您会打断他们的频率如何？' },
  ];

  const OPTIONS = [
    { value: 0, label: '从不', desc: '此情况从未发生' },
    { value: 1, label: '很少', desc: '偶尔发生，不常见' },
    { value: 2, label: '有时', desc: '约 25% 的时候' },
    { value: 3, label: '经常', desc: '约一半以上时候' },
    { value: 4, label: '总是', desc: '几乎每天都发生' },
  ];

  /* ── Evidence-based Solutions ─────────────────────────────── */
  // evidence: { text, url } → rendered as clickable link
  const SOLUTIONS_DB = {
    low: [
      {
        icon: '🧘', category: '正念与专注', title: '正念冥想：培养日常专注习惯',
        evidence: { text: 'Zylowska et al., 2008 — J. Atten. Disord.', url: 'https://pubmed.ncbi.nlm.nih.gov/18025248/' },
        desc: '无论注意力特征处于哪种水平，正念训练都被证实能改善注意力持续时间和情绪调节。这是一种温和、可自主练习的日常习惯，适合所有人。',
        steps: [
          { text: '每天早晨<strong>固定 10 分钟</strong>进行专注呼吸练习（可使用 Headspace 或潮汐 App）' },
          { text: '当思绪游离时，温柔地将注意力拉回呼吸，不要自责——这本身就是练习' },
          { text: '进阶：尝试「身体扫描」冥想，增强对身体感觉的觉察' },
        ]
      },
      {
        icon: '😴', category: '睡眠质量', title: '优化睡眠：大脑专注力的基础',
        evidence: { text: 'Cortese et al., 2006 — Sleep Med. Rev.', url: 'https://pubmed.ncbi.nlm.nih.gov/16256931/' },
        desc: '睡眠不足本身会显著放大注意力困难，很多人的专注问题其实源于睡眠节律紊乱，而非其他原因。改善睡眠是成本最低、效果最快的调整方向之一。',
        steps: [
          { text: '设定<strong>固定就寝 & 起床时间</strong>（包括周末），误差不超过 30 分钟' },
          { text: '睡前 1 小时停用手机屏幕或开启夜间滤蓝光模式' },
          { text: '保持卧室温度在 18–22°C，使用遮光窗帘营造暗环境' },
        ]
      },
    ],
    mild: [
      {
        icon: '📋', category: '行为策略', title: '外部系统：减少对记忆力的依赖',
        evidence: { text: 'Barkley, 2011 — J. Atten. Disord.', url: 'https://pubmed.ncbi.nlm.nih.gov/21199864/' },
        desc: '研究发现，将「需要记忆的事」转移到外部工具中，比依赖大脑记忆更可靠，对所有人都有效——尤其是在任务繁忙的时期。',
        steps: [
          { text: '购买<strong>实体白板或便利贴墙</strong>放在显眼位置，每天早晨写下当日 3 件最重要的事' },
          { text: '使用任务管理工具（Notion、滴答清单），开启提醒通知' },
          { text: '钥匙、钱包等高频物品指定固定位置，用后立即归位' },
        ]
      },
      {
        icon: '⏱️', category: '时间管理', title: '番茄工作法：化整为零、降低开始阻力',
        evidence: { text: 'Cirillo, 1992；Pychyl & Sirois, 2013', url: 'https://pubmed.ncbi.nlm.nih.gov/23771971/' },
        desc: '将工作切分为 25 分钟专注 + 5 分钟休息的「番茄」单元，利用时间边界减少心理阻力——开始一件事往往比持续做更难，番茄法专门解决这个问题。',
        steps: [
          { text: '选一件今天的任务，设定 <strong>25 分钟计时器</strong>（Forest、Be Focused 等 App）' },
          { text: '25 分钟内只做这一件事，手机调静音、关掉不相关标签页' },
          { text: '计时结束后休息 5 分钟（离开座位、喝水），每 4 个番茄休息 15 分钟' },
        ]
      },
      {
        icon: '🏃', category: '日常运动', title: '有氧运动：对大脑专注力的天然助力',
        evidence: { text: 'Pontifex et al., 2013 — J. Pediatr.', url: 'https://pubmed.ncbi.nlm.nih.gov/23084704/' },
        desc: '研究发现有氧运动后约 60 分钟内，大脑专注能力明显提升。这种效果无需任何设备，适合任何人在任何阶段使用。',
        steps: [
          { text: '在需要高度专注的任务<strong>之前</strong>进行 10–20 分钟快步走或跳绳' },
          { text: '每周安排 3 次 30 分钟以上的中等强度有氧运动（心率达到最大心率的 60–70%）' },
          { text: '优先选择有节奏感的运动：跑步、骑行、游泳，比静态运动效果更好' },
        ]
      },
    ],
    moderate: [
      {
        icon: '🧠', category: '认知行为技巧', title: 'CBT 认知行为策略：调整思维与行动模式',
        evidence: { text: 'Safren et al., 2010 — JAMA Psychiatry', url: 'https://pubmed.ncbi.nlm.nih.gov/21059954/' },
        desc: '认知行为技巧帮助你识别并调整容易引发拖延、回避的思维习惯，同时建立更有效的行动策略。这套方法经过随机对照试验验证，对改善执行功能困难有显著效果。',
        steps: [
          { text: '可先尝试自助书籍：《成人 ADHD 的认知行为治疗》（Safren 著）' },
          { text: '练习「五分钟法则」：告诉自己只做 5 分钟，通常开始后就会继续' },
          { text: '如有需要，可寻找有 CBT 经验的心理咨询师，开展 8–12 次有针对性的咨询' },
        ]
      },
      {
        icon: '🏠', category: '环境设计', title: '环境工程：让专注变得更容易',
        evidence: { text: 'Barkley, 2015 — Guilford Press', url: 'https://pubmed.ncbi.nlm.nih.gov/26751945/' },
        desc: '与其靠意志力对抗干扰，不如重新设计你的工作和生活环境，让「保持专注」成为默认状态。这是一种可以持续生效的被动策略。',
        steps: [
          { text: '工作时开启<strong>网站屏蔽工具</strong>（Cold Turkey、Freedom）限制娱乐网站' },
          { text: '清理桌面，只留当前任务相关物品；建立「进入状态」的固定仪式' },
          { text: '使用降噪耳机或白噪声（rain.today），减少声音干扰' },
        ]
      },
      {
        icon: '🤝', category: '社会支持', title: '责任搭档：借助他人的存在提升执行力',
        evidence: { text: 'Sibley et al., 2016 — J. Consult. Clin. Psychol.', url: 'https://pubmed.ncbi.nlm.nih.gov/26280592/' },
        desc: '研究显示，在有他人在场时，任务启动和完成率明显提升。这并非意志力问题，而是大脑的社会激活机制——合理利用这一机制能有效提升效率。',
        steps: [
          { text: '找一位朋友作为<strong>责任搭档</strong>，每周互相分享目标和完成情况' },
          { text: '尝试「虚拟共同工作」：开着视频通话各自工作（Focusmate.com）' },
          { text: '加入相关支持社群，与有类似经历的人交流，减少孤独感' },
        ]
      },
    ],
    notable: [
      {
        icon: '💬', category: '了解专业支持', title: '与心理健康专业人士进行初步沟通',
        evidence: { text: 'Kessler et al., 2005 — Psychol. Med.', url: 'https://pubmed.ncbi.nlm.nih.gov/15841682/' },
        desc: '如果这些困难对您的日常工作或生活造成了明显困扰，与心理健康专业人士初步交流是一个很好的起点。这只是一次了解自己的机会，不意味着必须做任何决定。',
        steps: [
          { text: '可以预约心理咨询机构、心理科或精神科做一次<strong>初步评估</strong>，无需感到压力' },
          { text: '告诉医生您在哪些具体场景下感到困难（如「完成任务收尾很难」），可带上本测试结果作参考' },
          { text: '医生会通过详细问诊了解情况，而非仅凭问卷，请放心如实描述' },
        ]
      },
      {
        icon: '🧘', category: '正念认知练习', title: 'MBCT：结合正念与认知训练的实践方法',
        evidence: { text: 'Mitchell et al., 2013 — J. Affect. Disord.', url: 'https://pubmed.ncbi.nlm.nih.gov/23561590/' },
        desc: '正念认知疗法（MBCT）经过随机对照试验验证，能改善注意力管理、情绪调节和自我效能。它是一个结构化的自我成长项目，适合希望在日常中主动调整的人。',
        steps: [
          { text: '寻找开设 <strong>MBCT 课程</strong>的心理机构（通常为 8 周团体课程）' },
          { text: '每日进行 20–40 分钟正式正念练习（身体扫描、坐禅）' },
          { text: '在日常「锚点时刻」（吃饭、通勤、等待时）练习非正式觉察' },
        ]
      },
      {
        icon: '⏱️', category: '执行规划', title: '每日三件事：结构化优先级管理',
        evidence: { text: 'Solanto et al., 2010 — Am. J. Psychiatry', url: 'https://pubmed.ncbi.nlm.nih.gov/20337524/' },
        desc: '元认知训练帮助改善时间感知、任务规划和自我监控——这些恰恰是许多人在注意力管理上面临的核心困难。',
        steps: [
          { text: '每晚睡前 <strong>10 分钟规划明天</strong>：写下 3 件优先任务（不超过 3 件）' },
          { text: '为每件任务估计时间，并预留 1.5 倍缓冲——低估时间是很多人的共同困难' },
          { text: '每天安排一个「回顾时刻」检查进展，不批判，只调整' },
        ]
      },
      {
        icon: '🏃', category: '运动习惯', title: '高强度间歇训练（HIIT）对专注力的助力',
        evidence: { text: 'Verret et al., 2012 — J. Atten. Disord.', url: 'https://pubmed.ncbi.nlm.nih.gov/21383215/' },
        desc: '较高强度的有氧运动对大脑前额叶功能的改善效果更持久，研究显示在专注困难较多时，运动干预可作为重要的辅助手段。',
        steps: [
          { text: '每周 3 次进行 <strong>20 分钟间歇运动</strong>：30 秒中高强度 + 30 秒慢走，重复 10 轮' },
          { text: '安排在工作前进行，利用运动后的「专注窗口期」（约 1–2 小时）处理最重要的任务' },
          { text: '从自己喜欢的运动形式开始，坚持比强度更重要' },
        ]
      },
    ],
    high: [
      {
        icon: '💬', category: '了解专业支持（推荐优先）', title: '考虑与心理健康专业人士做初步交流',
        evidence: { text: 'Kessler et al., 2005 — Psychol. Med.', url: 'https://pubmed.ncbi.nlm.nih.gov/15841682/' },
        desc: '本量表反映您在相关方面的自评频率较高。如果这些困难已经对工作、学习或人际关系造成了持续困扰，与专业人士初步沟通是一个值得考虑的选项——但做什么决定完全由您自己掌握。',
        steps: [
          { text: '可以预约心理咨询机构、心理科或精神科进行<strong>初步了解性咨询</strong>，这只是一次对话' },
          { text: '如实描述您在哪些具体场景中感到困难，医生会通过详细问诊（而非单一量表）判断情况' },
          { text: '评估结果会包含多种可能的方向，包括生活方式调整、心理咨询等，医生会与您共同讨论' },
        ]
      },
      {
        icon: '🧠', category: '心理咨询技术', title: 'CBT + DBT 综合心理咨询方向',
        evidence: { text: 'Hesslinger et al., 2002 — Eur. Arch. Psychiatry', url: 'https://pubmed.ncbi.nlm.nih.gov/12011843/' },
        desc: '认知行为疗法（CBT）与辩证行为疗法（DBT）在成人注意力和情绪调节困难方面均有研究支持，帮助建立更有效的应对策略。如有需要，可通过心理咨询渠道了解这些方法。',
        steps: [
          { text: '可以寻找有 ADHD 或执行功能经验的心理咨询师进行系统性咨询' },
          { text: 'DBT 技能包括：正念觉察、情绪调节、人际有效性——可先通过自助书籍了解基础' },
          { text: '团体心理支持课程有时比一对一更容易坚持，也可与同伴互相鼓励' },
        ]
      },
      {
        icon: '🏃', category: '生活方式调整', title: '多方面生活习惯的系统调整',
        evidence: { text: 'von Loh et al., 2022 — Nutrients', url: 'https://pubmed.ncbi.nlm.nih.gov/35405262/' },
        desc: '运动、睡眠和营养习惯对大脑专注和情绪调节均有科学支持的影响，是任何干预方向的共同基础。这些调整可以立即开始，无需等待任何评估结果。',
        steps: [
          { text: '<strong>运动</strong>：每周 3–5 次 30 分钟有氧运动，这是目前成本最低的大脑健康投资' },
          { text: '<strong>营养</strong>：减少精制糖和超加工食品，增加 Omega-3 摄入（深海鱼、亚麻籽油）' },
          { text: '<strong>睡眠</strong>：维持固定作息，睡眠问题如果顽固，可向医生说明，通常有较简单的改善方法' },
        ]
      },
      {
        icon: '📘', category: '自我了解', title: '通过可靠信源深入理解自己的注意力特征',
        evidence: { text: 'CHADD — Adults with ADHD (evidence-based resource)', url: 'https://chadd.org/for-adults/overview/' },
        desc: '了解自己的注意力特征是减少焦虑、做出知情决策的重要一步。选择权威、循证的信息来源，有助于您更平静地看待测试结果，并与专业人士进行更有效的沟通。',
        steps: [
          { text: '推荐权威中文科普：<strong>壹心理</strong>、<strong>简单心理</strong>网站有关 ADHD 的专栏文章' },
          { text: '记录让您感到困难的具体场景（如「开会时思绪游离」），有助于后续与专业人士沟通' },
          { text: '请注意：自测结果仅是自我了解的参考，任何正式诊断需要由受过训练的专业医生进行' },
        ]
      },
      {
        icon: '📱', category: '辅助工具', title: '数字工具：减少日常执行负担',
        evidence: { text: 'Tuckman, 2009 — APA Books', url: 'https://www.apa.org/pubs/books/4317187' },
        desc: '外部工具能有效减轻记忆、时间感知和任务启动的认知负荷，是任何干预方向的实用补充，且即刻可用。',
        steps: [
          { text: '<strong>任务管理</strong>：滴答清单 / Todoist，把所有待办事项外包给 App' },
          { text: '<strong>时间感知</strong>：可视化计时器（Time Timer App）让时间变得「看得见」' },
          { text: '<strong>干扰阻断</strong>：工作时手机放另一个房间，安装 Cold Turkey 等屏蔽工具' },
        ]
      },
    ]
  };

  /* ── Level metadata ──────────────────────────────────────── */
  const LEVEL_META = {
    low: {
      label: '频率极低', badge: 'level-none', title: '日常注意力与行为表现良好',
      subtitle: '您的自评结果显示，相关困难的发生频率很低，对日常生活的影响不明显。以下有一些普遍适用的调整建议供参考。'
    },
    mild: {
      label: '偶有出现', badge: 'level-mild', title: '存在一些轻微的注意力相关特征',
      subtitle: '您报告了一些偶发的注意力或精力管理困难，这在成年人中十分常见。通过日常习惯调整通常可以有效改善。'
    },
    moderate: {
      label: '有时出现', badge: 'level-moderate', title: '存在一定频率的注意力困难',
      subtitle: '您的自评反映出一定频率的注意力和组织管理困难。睡眠、压力、情绪等多种因素都可能影响专注力，以下提供一些经过研究支持的调整思路。'
    },
    notable: {
      label: '较为频繁', badge: 'level-notable', title: '注意力困难出现频率较高',
      subtitle: '您报告了较为频繁的注意力相关困难。如果这些情况持续存在并已影响到工作或生活，与心理健康专业人士交流可能会有帮助。'
    },
    high: {
      label: '频率较高', badge: 'level-high', title: '相关困难出现频率很高',
      subtitle: '您的自评显示相关困难出现频率较高。本量表为自助参考工具，如这些情况已对生活造成明显困扰，建议参考下方的支持策略或考虑与专业人士沟通。'
    },
  };

  /* ── Radar Dimensions ────────────────────────────────────────── */
  const RADAR_DIMS = [
    { label: '注意力集中', color: '#8264ff', qIds: [7, 8, 9, 11], max: 16 },
    { label: '组织管理', color: '#4fa8ff', qIds: [1, 2, 3, 4], max: 16 },
    { label: '多动倾向', color: '#22d3a5', qIds: [5, 6, 12, 13], max: 16 },
    { label: '冲动控制', color: '#f5c842', qIds: [15, 16, 17, 18], max: 16 },
    { label: '情绪调节', color: '#ff7e50', qIds: [10, 14], max: 8 },
  ];

  /* ── Dimension Analysis Copy ─────────────────────────────────── */
  // keyed by dim index → array of [threshold_0to1, cssClass, levelLabel, analysisText]
  const DIM_ANALYSIS = [
    [ // 注意力集中
      [0.20, 'dim-level-ok', '正常', '注意力集中能力良好，能有效维持专注，不需要特别干预。'],
      [0.45, 'dim-level-mild', '轻微', '偶尔出现走神或分心，可通过优化工作环境和番茄工作法改善。'],
      [0.70, 'dim-level-moderate', '中度', '注意力保持较困难，建议尝试结构化策略，减少数字干扰源。'],
      [0.85, 'dim-level-notable', '明显', '注意力困难对日常工作有明显影响，建议进行 CBT 评估或咨询。'],
      [1.00, 'dim-level-high', '显著', '注意力症状显著，强烈建议寻求精神科专业评估和成人 ADHD 诊断。'],
    ],
    [ // 组织管理
      [0.20, 'dim-level-ok', '正常', '组织与计划能力表现良好，任务收尾和日程管理较为顺畅。'],
      [0.45, 'dim-level-mild', '轻微', '偶尔在任务排序和收尾上有困难，建立简单的清单习惯即可改善。'],
      [0.70, 'dim-level-moderate', '中度', '组织管理挑战较明显，建议使用外部辅助系统（数字清单、提醒工具）。'],
      [0.85, 'dim-level-notable', '明显', '组织困难影响到工作和日常生活，建议学习元认知技巧或寻求辅导。'],
      [1.00, 'dim-level-high', '显著', '组织管理严重困难，建议结合专业评估和 CBT 策略进行系统改善。'],
    ],
    [ // 多动倾向
      [0.20, 'dim-level-ok', '正常', '身体活动水平正常，坐立不安症状不明显，整体自我调节良好。'],
      [0.45, 'dim-level-mild', '轻微', '偶有坐立不安感，规律的有氧运动（如跑步）可有效释放多余能量。'],
      [0.70, 'dim-level-moderate', '中度', '多动倾向较明显，建议每周至少3次30分钟有氧运动，并在工作中安排活动休息。'],
      [0.85, 'dim-level-notable', '明显', '多动症状对专注和人际关系有影响，建议结合运动干预和行为策略。'],
      [1.00, 'dim-level-high', '显著', '多动症状显著，强烈建议医疗评估以判断是否需要药物或综合干预。'],
    ],
    [ // 冲动控制
      [0.20, 'dim-level-ok', '正常', '冲动控制能力良好，行动前能充分权衡，人际互动中表现稳健。'],
      [0.45, 'dim-level-mild', '轻微', '部分情景下存在冲动反应，练习「暂停3秒再说话」技巧可降低冲动频率。'],
      [0.70, 'dim-level-moderate', '中度', '冲动言行有一定频率，建议练习 DBT 的「冲动耐受」技能，必要时咨询。'],
      [0.85, 'dim-level-notable', '明显', '冲动控制困难可能影响工作和人际关系，建议寻求心理咨询或 DBT 团体治疗。'],
      [1.00, 'dim-level-high', '显著', '冲动控制严重受损，强烈建议精神科评估，了解是否存在共病（如情绪障碍）。'],
    ],
    [ // 情绪调节
      [0.20, 'dim-level-ok', '正常', '情绪调节能力良好，能有效应对压力和不适，放松能力正常。'],
      [0.45, 'dim-level-mild', '轻微', '偶尔难以平静或放松，规律的正念或深呼吸练习可带来改善。'],
      [0.70, 'dim-level-moderate', '中度', '情绪调节有一定挑战，建议尝试 MBCT 正念认知疗法或情绪日志记录。'],
      [0.85, 'dim-level-notable', '明显', '情绪调节困难明显，可能影响生活质量，建议寻求心理咨询了解是否有共病焦虑。'],
      [1.00, 'dim-level-high', '显著', '情绪调节严重受损，强烈建议精神科或心理科综合评估，可能需要系统干预。'],
    ],
  ];

  /* ── State ──────────────────────────────────────────────── */
  let currentQ = 0;
  let answers = {};
  let startTime = null;

  /* ── DOM refs ────────────────────────────────────────────── */
  const heroSection = document.getElementById('hero');
  const aboutSection = document.getElementById('about');
  const quizSection = document.getElementById('quiz-section');
  const resultSection = document.getElementById('result-section');

  /* ═══════════════════════════════════════
     FEATURE 1 · Theme Toggle
  ═══════════════════════════════════════ */
  const themeToggle = document.getElementById('theme-toggle');
  const html = document.documentElement;
  html.setAttribute('data-theme', localStorage.getItem(THEME_KEY) || 'dark');
  themeToggle.addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
  });

  /* ═══════════════════════════════════════
     FEATURE 5 · Progress Save & Resume
  ═══════════════════════════════════════ */
  function saveProgress() {
    const answered = Object.keys(answers).length;
    if (answered === 0) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, currentQ, startTime }));
  }

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function clearProgress() {
    localStorage.removeItem(STORAGE_KEY);
  }

  // On load, check for saved progress
  window.addEventListener('DOMContentLoaded', () => {
    checkResumeBanner();
  });

  function checkResumeBanner() {
    const saved = loadProgress();
    if (!saved || Object.keys(saved.answers).length === 0) return;
    const count = Object.keys(saved.answers).length;
    const banner = document.getElementById('resume-banner');
    const descEl = document.getElementById('resume-desc');
    descEl.textContent = `已完成 ${count} 题，是否继续上次进度？`;
    banner.style.display = 'flex';
  }

  document.getElementById('resume-continue-btn').addEventListener('click', () => {
    const saved = loadProgress();
    if (!saved) return;
    answers = saved.answers || {};
    startTime = saved.startTime || Date.now();
    // Find first unanswered
    const firstUnanswered = QUESTIONS.findIndex(q => answers[q.id] === undefined);
    currentQ = firstUnanswered >= 0 ? firstUnanswered : QUESTIONS.length - 1;
    document.getElementById('resume-banner').style.display = 'none';
    startQuizView();
  });

  document.getElementById('resume-new-btn').addEventListener('click', () => {
    clearProgress();
    document.getElementById('resume-banner').style.display = 'none';
    answers = {};
    currentQ = 0;
  });

  /* ═══════════════════════════════════════
     NAVIGATION HELPERS
  ═══════════════════════════════════════ */
  function showQuiz() {
    clearProgress();
    answers = {};
    currentQ = 0;
    startTime = Date.now();
    startQuizView();
  }

  function startQuizView() {
    heroSection.style.display = 'none';
    aboutSection.style.display = 'none';
    quizSection.style.display = 'flex';
    resultSection.style.display = 'none';
    renderQuestion(currentQ, 'next');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showHero() {
    heroSection.style.display = '';
    aboutSection.style.display = '';
    quizSection.style.display = 'none';
    resultSection.style.display = 'none';
    checkResumeBanner();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showResult() {
    quizSection.style.display = 'none';
    resultSection.style.display = 'block';
    clearProgress();
    renderResult();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Buttons
  document.getElementById('start-btn').addEventListener('click', showQuiz);
  document.getElementById('start-btn-2').addEventListener('click', showQuiz);
  document.getElementById('back-btn').addEventListener('click', showHero);
  document.getElementById('logo-home').addEventListener('click', showHero);

  /* ═══════════════════════════════════════
     QUIZ RENDERING
  ═══════════════════════════════════════ */
  function renderQuestion(idx, dir) {
    const q = QUESTIONS[idx];
    const wrap = document.getElementById('quiz-card-wrap');

    wrap.classList.add(dir === 'next' ? 'animating' : 'animating-back');

    setTimeout(() => {
      document.getElementById('quiz-q-num').textContent = String(q.id).padStart(2, '0');
      document.getElementById('quiz-q-tag').textContent = q.tag;
      document.getElementById('quiz-q-text').textContent = q.text;
      document.getElementById('quiz-part-label').textContent =
        q.part === 'A' ? 'A 部分 · 核心筛查' : 'B 部分 · 辅助评估';
      document.getElementById('quiz-counter').textContent = `${q.id} / ${QUESTIONS.length}`;

      const pct = (idx / QUESTIONS.length) * 100;
      document.getElementById('quiz-progress-bar').style.width = pct + '%';

      renderDots(idx);
      renderOptions(q.id);

      document.getElementById('prev-btn').disabled = idx === 0;
      updateNextBtn(idx);

      wrap.classList.remove('animating', 'animating-back');

      // BUG FIX: blur any auto-focused element so no option looks pre-selected
      setTimeout(() => {
        if (document.activeElement && document.activeElement !== document.body) {
          document.activeElement.blur();
        }
      }, 0);
    }, 180);
  }

  function renderDots(currentIdx) {
    const container = document.getElementById('quiz-progress-dots');
    container.innerHTML = '';
    QUESTIONS.forEach((q, i) => {
      const dot = document.createElement('div');
      dot.className = 'q-dot';
      if (answers[q.id] !== undefined) dot.classList.add('answered');
      if (i === currentIdx) dot.classList.add('current');
      container.appendChild(dot);
    });
  }

  function renderOptions(qId) {
    const container = document.getElementById('quiz-options');
    container.innerHTML = '';
    OPTIONS.forEach(opt => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quiz-opt';
      // Only add `selected` if this exact answer was previously chosen
      if (answers[qId] !== undefined && answers[qId] === opt.value) {
        btn.classList.add('selected');
      }
      // data-value for keyboard shortcut indexing (1-based)
      btn.dataset.value = opt.value;
      btn.tabIndex = 0;
      btn.innerHTML = `
        <span class="opt-radio"></span>
        <span class="opt-freq">
          <span class="opt-label">${opt.label}</span>
          <span class="opt-desc">— ${opt.desc}</span>
        </span>
      `;
      btn.addEventListener('click', () => selectOption(qId, opt.value));
      container.appendChild(btn);
    });
  }

  function selectOption(qId, value) {
    answers[qId] = value;
    saveProgress();

    const container = document.getElementById('quiz-options');
    container.querySelectorAll('.quiz-opt').forEach(b => {
      b.classList.toggle('selected', Number(b.dataset.value) === value);
    });

    updateNextBtn(currentQ);
    renderDots(currentQ);

    // Milestone check
    if (qId === 9) showMilestoneToast('🎉', '已完成一半！坚持就是胜利');

    setTimeout(() => {
      if (currentQ < QUESTIONS.length - 1) {
        goNext();
      } else {
        // Last question answered
        showMilestoneToast('✅', '全部完成！正在生成结果…');
        setTimeout(showResult, 700);
      }
    }, 420);
  }

  function updateNextBtn(idx) {
    const btn = document.getElementById('next-btn');
    const isLast = idx === QUESTIONS.length - 1;
    const hasAnswer = answers[QUESTIONS[idx].id] !== undefined;
    const svgNext = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;

    if (isLast && hasAnswer) {
      btn.innerHTML = `查看结果 ${svgNext}`;
      btn.onclick = showResult;
      btn.disabled = false;
    } else {
      btn.innerHTML = `下一题 ${svgNext}`;
      btn.onclick = goNext;
      btn.disabled = !hasAnswer;
    }
  }

  function goNext() {
    if (currentQ < QUESTIONS.length - 1) {
      currentQ++;
      renderQuestion(currentQ, 'next');
    }
  }

  function goPrev() {
    if (currentQ > 0) {
      currentQ--;
      renderQuestion(currentQ, 'back');
    }
  }

  document.getElementById('prev-btn').addEventListener('click', goPrev);

  /* ═══════════════════════════════════════
     FEATURE 2 · Keyboard Shortcuts
     1-5: pick answer    ←/→ : navigate
  ═══════════════════════════════════════ */
  document.addEventListener('keydown', (e) => {
    if (quizSection.style.display === 'none') return;

    const key = e.key;
    // 1-5 → select option
    if (['1', '2', '3', '4', '5'].includes(key)) {
      e.preventDefault();
      const optIdx = Number(key) - 1; // 0-indexed
      if (optIdx < OPTIONS.length) {
        const qId = QUESTIONS[currentQ].id;
        selectOption(qId, OPTIONS[optIdx].value);
      }
    }

    // Arrow keys
    if (key === 'ArrowRight') {
      e.preventDefault();
      const hasAnswer = answers[QUESTIONS[currentQ].id] !== undefined;
      if (currentQ === QUESTIONS.length - 1 && hasAnswer) showResult();
      else if (hasAnswer) goNext();
    }
    if (key === 'ArrowLeft') {
      e.preventDefault();
      goPrev();
    }
  });

  /* ═══════════════════════════════════════
     FEATURE 6 · Milestone Toasts
  ═══════════════════════════════════════ */
  let toastTimer = null;
  function showMilestoneToast(emoji, text) {
    const toast = document.getElementById('milestone-toast');
    document.getElementById('milestone-emoji').textContent = emoji;
    document.getElementById('milestone-text').textContent = text;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
  }

  /* ═══════════════════════════════════════
     SCORING
  ═══════════════════════════════════════ */
  function calcScores() {
    let partA = 0, partB = 0, positiveA = 0;
    QUESTIONS.forEach(q => {
      const v = answers[q.id] ?? 0;
      if (q.part === 'A') { partA += v; if (v >= 2) positiveA++; }
      else partB += v;
    });
    const total = partA + partB;
    // Frequency index: pure raw score ratio, no artificial bonus
    // Max possible: 18 questions × 4 = 72
    const frequencyIndex = Math.round((total / 72) * 100);
    return { partA, partB, total, positiveA, severityScore: frequencyIndex };
  }

  function getLevel({ severityScore }) {
    // Thresholds based on raw answer distribution:
    // ≥75 → mostly "经常/总是" on most questions
    // ≥52 → avg "有时/经常" on most questions
    // ≥33 → avg "有时" on most questions
    // ≥17 → avg "很少" on most questions
    if (severityScore >= 75) return 'high';
    if (severityScore >= 52) return 'notable';
    if (severityScore >= 33) return 'moderate';
    if (severityScore >= 17) return 'mild';
    return 'low';
  }

  /* ═══════════════════════════════════════
     RESULT RENDERING
  ═══════════════════════════════════════ */
  function renderResult() {
    const scores = calcScores();
    const level = getLevel(scores);
    const meta = LEVEL_META[level];

    // Timer display
    if (startTime) {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const m = Math.floor(elapsed / 60);
      const s = elapsed % 60;
      const timerEl = document.getElementById('timer-stat');
      document.getElementById('timer-text').textContent =
        m > 0 ? `用时 ${m} 分 ${s} 秒` : `用时 ${s} 秒`;
      timerEl.style.display = 'inline-flex';
    }

    // Score ring
    const circumference = 2 * Math.PI * 80;
    const dashOffset = circumference * (1 - scores.severityScore / 100);
    const svg = document.getElementById('result-ring-svg');
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#8264ff"/>
        <stop offset="100%" stop-color="#4fa8ff"/>
      </linearGradient>`;
    // Remove old defs if any
    const oldDefs = svg.querySelector('defs');
    if (oldDefs) svg.removeChild(oldDefs);
    svg.prepend(defs);

    document.getElementById('result-score-num').textContent = scores.severityScore;
    document.getElementById('result-level-badge').textContent = meta.label;
    document.getElementById('result-level-badge').className = 'result-level-badge ' + meta.badge;
    document.getElementById('result-title').textContent = meta.title;
    document.getElementById('result-subtitle').textContent = meta.subtitle;

    setTimeout(() => {
      document.getElementById('ring-fill').style.strokeDashoffset = dashOffset;
    }, 200);

    // Sub scores
    document.getElementById('num-a').textContent = scores.partA;
    document.getElementById('num-b').textContent = scores.partB;
    setTimeout(() => {
      document.getElementById('bar-a').style.width = ((scores.partA / 24) * 100) + '%';
      document.getElementById('bar-b').style.width = ((scores.partB / 48) * 100) + '%';
    }, 300);

    // ASRS Part A reference (neutral, informational — no positive/negative labels)
    const asrsBadge = document.getElementById('asrs-badge');
    const asrsHigh = scores.positiveA >= 4;
    asrsBadge.className = asrsHigh ? 'asrs-badge asrs-positive' : 'asrs-badge asrs-negative';
    asrsBadge.innerHTML = asrsHigh
      ? `📋 <strong>ASRS-v1.1 核心部分（A 部分）参考：</strong>您有 ${scores.positiveA}/6 题报告了较高的发生频率。——此量表（Kessler et al., 2005）用于辅助了解，不能作为诊断依据。`
      : `📋 <strong>ASRS-v1.1 核心部分（A 部分）参考：</strong>您有 ${scores.positiveA}/6 题报告了较高的发生频率，整体频率处于较低水平。`;

    // Severity pointer
    setTimeout(() => {
      document.getElementById('severity-pointer').style.left = Math.min(96, scores.severityScore) + '%';
    }, 300);

    // Radar chart + dimension cards
    setTimeout(() => {
      drawRadar();
      renderDimensionCards();
    }, 400);

    // Solutions
    document.getElementById('solutions-intro').textContent = getSolutionsIntro(level);
    renderSolutions(SOLUTIONS_DB[level] || SOLUTIONS_DB['mild']);
  }

  /* ═══════════════════════════════════════
     FEATURE 8 · Radar Chart (animated Canvas 2D)
  ═══════════════════════════════════════ */

  // Compute per-dimension values (0-1) from current answers
  function getDimValues() {
    return RADAR_DIMS.map(dim => {
      const raw = dim.qIds.reduce((s, id) => s + (answers[id] ?? 0), 0);
      return raw / dim.max;
    });
  }

  // Draw a single frame of the radar chart at a given animation progress (0→1)
  function drawRadarFrame(targetValues, progress, ctx, W, H) {
    const cx = W / 2;
    const cy = H / 2 + 10;
    const R = Math.min(W, H) / 2 - 52;
    const n = RADAR_DIMS.length;
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

    ctx.clearRect(0, 0, W, H);

    const angleOf = i => (Math.PI * 2 * i / n) - Math.PI / 2;
    const pt = (r, i) => ({ x: cx + r * Math.cos(angleOf(i)), y: cy + r * Math.sin(angleOf(i)) });

    // Grid rings
    const gridColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
    for (let g = 1; g <= 4; g++) {
      const r = R * g / 4;
      ctx.beginPath();
      for (let i = 0; i < n; i++) { const p = pt(r, i); i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); }
      ctx.closePath();
      ctx.strokeStyle = gridColor; ctx.lineWidth = 1; ctx.stroke();
    }

    // Axis lines
    const axisColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
    for (let i = 0; i < n; i++) {
      const p = pt(R, i);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = axisColor; ctx.lineWidth = 1; ctx.stroke();
    }

    // 4 level ring labels (25%/50%/75%/100%)
    ctx.font = `500 9px Inter, sans-serif`;
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    [0.25, 0.5, 0.75, 1].forEach(lv => {
      ctx.fillText(Math.round(lv * 100) + '%', cx + 3, cy - R * lv + 1);
    });

    // Values interpolated by progress (eased)
    const ease = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const values = targetValues.map(v => v * ease(progress));

    // Filled polygon
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const p = pt(R * values[i], i);
      i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(130,100,255,0.15)';
    ctx.fill();
    ctx.strokeStyle = '#8264ff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Dots + labels
    RADAR_DIMS.forEach((dim, i) => {
      const dotP = pt(R * values[i], i);

      // Glow
      ctx.shadowColor = dim.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(dotP.x, dotP.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = dim.color;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = isDark ? '#0a0e1a' : '#fff';
      ctx.lineWidth = 2; ctx.stroke();

      // Label (only at full visibility to avoid flicker)
      if (progress > 0.5) {
        const labelP = pt(R + 28, i);
        ctx.font = `600 11px Inter, sans-serif`;
        ctx.fillStyle = isDark ? 'rgba(232,236,244,0.8)' : 'rgba(26,31,51,0.8)';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(dim.label, labelP.x, labelP.y);

        // Score % near the dot (only when close to final)
        if (progress > 0.85) {
          const pctVal = Math.round(targetValues[i] * ease(progress) * 100);
          // offset slightly away from center
          const angle = angleOf(i);
          const offX = Math.cos(angle) * 18;
          const offY = Math.sin(angle) * 14;
          ctx.font = `700 10px Inter, sans-serif`;
          ctx.fillStyle = dim.color;
          ctx.fillText(pctVal + '%', dotP.x + offX, dotP.y + offY);
        }
      }
    });
  }

  function drawRadar() {
    const canvas = document.getElementById('radar-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const target = getDimValues();

    const startTs = performance.now();
    const duration = 1000; // ms

    function frame(now) {
      const progress = Math.min(1, (now - startTs) / duration);
      drawRadarFrame(target, progress, ctx, W, H);
      if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ── Dimension Cards ─────────────────────────────────────────── */
  function renderDimensionCards() {
    const grid = document.getElementById('dim-cards');
    if (!grid) return;
    grid.innerHTML = '';

    const values = getDimValues();

    RADAR_DIMS.forEach((dim, i) => {
      const pct = values[i];
      const pctRnd = Math.round(pct * 100);

      // Determine level
      const levels = DIM_ANALYSIS[i];
      let levelMeta = levels[levels.length - 1];
      for (const l of levels) { if (pct <= l[0]) { levelMeta = l; break; } }
      const [, cssClass, levelLabel, analysisText] = levelMeta;

      const card = document.createElement('div');
      card.className = 'dim-card';
      card.innerHTML = `
        <div class="dim-card-header">
          <span class="dim-card-dot" style="background:${dim.color}"></span>
          <span class="dim-card-name">${dim.label}</span>
          <span class="dim-card-pct" style="color:${dim.color}">${pctRnd}%</span>
        </div>
        <div class="dim-bar-wrap">
          <div class="dim-bar" style="background:${dim.color}" data-target="${pctRnd}"></div>
        </div>
        <div class="dim-level-badge ${cssClass}">${levelLabel}</div>
        <p class="dim-analysis">${analysisText}</p>
      `;
      grid.appendChild(card);
    });

    // Animate bars after paint
    setTimeout(() => {
      grid.querySelectorAll('.dim-bar').forEach(bar => {
        bar.style.width = bar.dataset.target + '%';
      });
    }, 150);
  }

  /* ── Solutions ────────────────────────────────────────────── */
  function getSolutionsIntro(level) {
    return {
      low: '您的症状评分较低，以下是帮助维持和进一步提升专注力的预防性策略，均有科学研究支持。',
      mild: '针对您的轻度症状，以下是可立即落地执行的循证干预策略，无需就医即可开始。',
      moderate: '针对您中等程度的症状，以下是结合行为训练和专业支持的多维干预方案，每项均有临床研究支持。',
      notable: '您的症状较为明显，以下方案按优先级排列，建议先进行专业评估，同时并行实施生活方式干预。',
      high: '您的症状评分显著，以下是优先级排序的综合干预方案。专业医疗评估是第一步，其余方案作为重要补充。',
    }[level] || '';
  }

  function renderSolutions(solutions) {
    const grid = document.getElementById('solutions-grid');
    grid.innerHTML = '';
    solutions.forEach((sol, i) => {
      const card = document.createElement('div');
      card.className = 'solution-card';
      card.innerHTML = `
        <div class="solution-header">
          <span class="solution-icon">${sol.icon}</span>
          <div class="solution-header-text">
            <div class="solution-category">${sol.category}</div>
            <div class="solution-title">${sol.title}</div>
          </div>
          <span class="solution-evidence">${typeof sol.evidence === 'object' ? sol.evidence.text : sol.evidence}</span>
          <svg class="solution-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
        </div>
        <div class="solution-body">
          <div class="solution-content">
            <p class="solution-desc">${sol.desc}</p>
            <div class="solution-steps-title">✅ 可执行步骤</div>
            <div class="solution-steps">
              ${sol.steps.map((s, si) => `
                <div class="solution-step">
                  <span class="step-num">${si + 1}</span>
                  <span class="step-text">${s.text}</span>
                </div>`).join('')}
            </div>
            <div class="solution-ref">📚 参考文献：${typeof sol.evidence === 'object'
          ? `<a href="${sol.evidence.url}" target="_blank" rel="noopener noreferrer" class="evidence-link">${sol.evidence.text} ↗</a>`
          : sol.evidence
        }</div>
          </div>
        </div>`;
      card.querySelector('.solution-header').addEventListener('click', () => {
        const isOpen = card.classList.contains('open');
        grid.querySelectorAll('.solution-card').forEach(c => c.classList.remove('open'));
        if (!isOpen) card.classList.add('open');
      });
      if (i === 0) card.classList.add('open');
      grid.appendChild(card);
    });
  }

  /* ═══════════════════════════════════════
     RETRY & SHARE
  ═══════════════════════════════════════ */
  document.getElementById('retry-btn').addEventListener('click', () => {
    answers = {};
    currentQ = 0;
    resultSection.style.display = 'none';
    clearProgress();
    showQuiz();
  });

  document.getElementById('share-btn').addEventListener('click', () => {
    const scores = calcScores();
    const level = getLevel(scores);
    const meta = LEVEL_META[level];
    const dims = RADAR_DIMS.map(d => {
      const raw = d.qIds.reduce((s, id) => s + (answers[id] ?? 0), 0);
      return `  ${d.label}：${Math.round(raw / d.max * 100)}%`;
    }).join('\n');
    const text = [
      '📊 ADHD ASRS v1.1 自测结果',
      `🔵 综合评分：${scores.severityScore}/100 · ${meta.label}`,
      `📌 ${meta.title}`,
      `A 部分（核心筛查）：${scores.partA}/24  |  B 部分：${scores.partB}/48`,
      `ASRS 筛查：${scores.positiveA >= 4 ? '阳性（建议就医评估）' : '阴性'}`,
      '',
      '📈 维度分析：',
      dims,
      '',
      '⚠️ 本结果由 ADHD 自测工具生成，仅供参考，不构成医疗诊断。',
    ].join('\n');
    navigator.clipboard.writeText(text).then(() => {
      const btn = document.getElementById('share-btn');
      btn.querySelector('span').textContent = '✅ 已复制到剪贴板！';
      setTimeout(() => { btn.querySelector('span').textContent = '📋 复制结果摘要'; }, 2500);
    }).catch(() => alert('复制失败，请手动截图保存结果。'));
  });

  /* ── Initial load ─────────────────────────────────────────── */
  checkResumeBanner();

})();
