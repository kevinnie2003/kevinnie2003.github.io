/* ============================================================
   I18N.JS
   Chinese version of the home page. English stays in index.html and
   main.js; this file only holds the Chinese text.

   Which language: the choice saved by the switch in the sidebar, else
   Chinese when the system language is Chinese, else English. The head
   script in index.html decides it before first paint (window.KN_LANG).

   - Static text: elements marked data-i18n="key" get ZH_TEXT[key].
   - Data (experience, projects, …): ZH_DATA overrides fields by id;
     main.js reads it through loc().
   - Each writing page has a Chinese version at writing/<slug>.zh.html.
   ============================================================ */

const KN_ZH = window.KN_LANG === 'zh';

/* Short UI words used inside main.js. */
const ZH_UI = {
  'Period': '时间',
  'Team': '团队',
  'Location': '地点',
  'Light Mode': '浅色模式',
  'Dark Mode': '深色模式',
  'Switch to light mode': '切换到浅色模式',
  'Switch to dark mode': '切换到深色模式',
};

function T(en) {
  return KN_ZH && ZH_UI[en] ? ZH_UI[en] : en;
}

const ZH_TEXT = {
  hi: '你好，我是',
  role: '软件工程师',
  meta: 'UCSD 计算机硕士',
  open: '2027 年春季可入职',

  nav_about: '关于',
  nav_experience: '经历',
  nav_playground: '试玩',
  nav_projects: '项目',
  nav_writing: '文章',
  nav_skills: '技能',
  nav_education: '教育',
  nav_contact: '联系',

  greeting: '你好，我是',
  heroName: '聂明轩 <span class="name-paren">(Kevin Nie)</span>',
  tagline: '让大模型的输出，稳到能上线。',
  bio: `<p>我在<strong>加州大学圣地亚哥分校</strong>读计算机硕士，做 <strong>LLM Agent</strong>，常用的是多 Agent 协作、工具调用和 MCP。模型说得再像样，也可能是错的。我花功夫最多的地方，是给它准确的资料，检查它写出来的东西，错了让它改，直到结果真能用。</p>
    <p>最近一段实习在<a href="#experience" class="inline-link" data-exp-index="0">米哈游</a>，我做了一个 Agent，QA 写一条测试用例，它就生成能在真机上跑的脚本。再往前，我在 <a href="#experience" class="inline-link" data-exp-index="1">Vicino AI</a> 做多 Agent 图像生成和分镜，在<a href="#experience" class="inline-link" data-exp-index="2">字节跳动</a>做了一个 LLM Oncall 助手，一千多位工程师在用，在<a href="#experience" class="inline-link" data-exp-index="3">阿里巴巴</a>给 Lazada 做 Android 网络诊断。</p>`,
  viewWork: '看看我做过什么',

  title_experience: '工作经历',
  title_playground: '试玩',
  title_projects: '项目',
  title_writing: '文章',
  title_skills: '技能',
  title_education: '教育背景',

  playground: `<p><strong>RogueForge</strong> 是一款肉鸽卡牌游戏，每局里的卡牌、敌人、事件和角色都是 LLM 当场做出来的。模型碰不到游戏逻辑，只能拿白名单里的效果来拼。右边这个校验器负责在玩家看到之前判断一张卡公不公平，代码是从 Python 后端一行行搬过来的，和游戏里用的是同一套。</p>
    <p>一张卡有多强，按它各个效果加权算一个分。每个稀有度和费用的组合，都有一个合理的分数范围，这个范围是拿<strong>《杀戮尖塔》铁甲战士的真实卡牌</strong>算出来的，所以平不平衡看数据，不看手感。分数在范围内，直接通过；超一点，就一点点往下调，再把卡面文字改过来；超太多或者结构不对，就退回去，告诉模型错在哪。</p>
    <p>可以试试做一张 1 费打 40 的卡、给攻击牌加中毒，或者一张只加 2 点格挡的稀有卡。</p>
    <div class="playground-stats">
      <div><b>2,658</b><span>张记录在案的候选卡：86% 直接通过，9% 调过之后通过，5% 被退回</span></div>
      <div><b>87%</b><span>的铁甲战士原版卡，分数落在自己那一档的范围里</span></div>
    </div>
    <div class="playground-links">
      <a href="writing/vibes-with-extra-steps.zh.html" class="btn btn-ghost">怎么做出来的</a>
      <a href="https://github.com/kevinnie2003/rogueforge" class="btn btn-ghost" target="_blank" rel="noopener noreferrer">源码</a>
    </div>`,

  writing: `<a class="writing-item" href="writing/two-weeks-seventy-releases.zh.html">
      <span class="date">2026.10</span>
      <div>
        <h3>两周，七十个版本</h3>
        <p>和 AI 一起做了一个 3.6 万行的游戏 Mod。谁测谁写，没有源码怎么摸清一个游戏，存档系统为什么靠重放，哪些功能干脆不做，AI 为什么得先查资料再开口，还有上线后海外玩家给我上的几课。</p>
      </div>
    </a>
    <a class="writing-item" href="writing/knowing-what-the-button-is-called.zh.html">
      <span class="date">2026.9</span>
      <div>
        <h3>知道那个按钮叫什么</h3>
        <p>把 QA 的测试用例变成真机上能跑的脚本。难的从来不是写代码，挖游戏源码比在手机上扫一遍管用得多，还有「假通过」到底是怎么回事。</p>
      </div>
    </a>
    <a class="writing-item" href="writing/vibes-with-extra-steps.zh.html">
      <span class="date">2026.6</span>
      <div>
        <h3>这卡超模了吗</h3>
        <p>AI 做的卡强不强，拿《杀戮尖塔》的真卡来比一比就知道了。顺便讲讲藏在这个数字后面的三个 bug。</p>
      </div>
    </a>
    <a class="writing-item" href="writing/four-views-one-object.zh.html">
      <span class="date">2026.4</span>
      <div>
        <h3>一个物体的四个视图</h3>
        <p>给一张参考图，生成同一个物体的四个角度。评判为什么要交给另一个 Agent，什么时候只重画一张、什么时候四张全重画，以及什么时候该收手。</p>
      </div>
    </a>`,

  next: '然后呢？',
  touch: '联系我',
  contactBody: '我在找 2027 年春季开始的全职软件工程师工作。AI Agent、LLM 基础设施和评测是我最拿手的，不过岗位叫什么我不太在意，能做出好用的东西就行。如果你们在做这方面的事，欢迎聊聊。',
  hello: '发邮件给我',
  footer: `<p>由 <span class="accent-text">聂明轩（Kevin Nie）</span>设计和开发</p>
        <p class="footer-sub">kevinnie2003.github.io · 2026 年 10 月更新 · <a href="feed.xml">RSS</a></p>`,
};

/* Data overrides, keyed by the id fields in main.js. */
const ZH_DATA = {
  experience: {
    mihoyo: {
      company: '米哈游',
      role: '游戏测试开发工程师',
      team: '星布谷地 · 工具组',
      period: '2026.6 – 2026.9',
      location: '中国上海',
      bullets: [
        '负责<strong>对话式自动化用例生成系统</strong>：QA 用一句话描述测试，系统写出能直接运行的 <strong>Airtest + Poco</strong> 脚本。生成时参考的知识库是从游戏源码里挖出来的，有 <strong>10 万多个 Unity Prefab 节点</strong>，还有 GM 指令、协议和配置数据。',
        '把生成、规则改写、静态检查、<strong>假通过审计</strong>、真机运行和知识回填串成一个闭环。同一批回归测试点里，能生成可运行、且审计没问题的脚本的比例，从大约 <strong>30% 提到 80%</strong>。<a href="writing/knowing-what-the-button-is-called.zh.html" class="inline-link">详细写在这篇文章里</a>。',
        '开发内部<strong>自动化测试平台</strong>的前后端（React + TypeScript / Flask + Socket.IO + MySQL），几十位 QA 在用。另外写了一批 <strong>GM 指令</strong>，<strong>30 多个游戏场景</strong>可以一键直达，不用再靠很容易失效的 UI 点击。',
      ],
    },
    vicino: {
      role: 'Agent 算法工程师',
      team: '机器学习团队',
      period: '2025.11 – 2026.4',
      location: '美国远程',
      bullets: [
        '搭了一个<strong>多 Agent 四视图生成系统</strong>，给一张参考图，生成正、背、左、右四个视图。<strong>8 个分工不同的 Agent</strong> 跑在 <strong>ReAct</strong> 循环里，通过 MCP 调工具；另有一个 Agent 专门打分，看每张图和四张之间是否一致，哪张不行就只重画哪张。<strong>九成以上</strong>的请求<strong>两轮以内</strong>就能出合格的结果。<a href="writing/four-views-one-object.zh.html" class="inline-link">详细写在这篇文章里</a>。',
        '做了<strong>分镜</strong>生成、提示词转工作流，还有一个视频剪辑 Agent：用户聊几句，它就能改出一张可执行的节点图，支持 <strong>10 多种</strong>剪辑操作。',
      ],
    },
    tiktok: {
      company: '字节跳动',
      role: '客户端开发工程师',
      team: 'TikTok User Experience 团队',
      period: '2025.6 – 2025.9',
      location: '中国上海',
      bullets: [
        '一个人从头做了 <strong>AI Oncall 助手</strong>（Python / React / SQLite）：每来一个问题，LLM 先看懂它要什么，再分到对应的处理流程。<strong>一千多位工程师</strong>在用，分类准确率比人工高了 <strong>80%</strong>。',
        '实时消息走 <strong>WebSocket</strong> 长连接，LLM 分类异步进行，后面有容错队列、响应缓存和持久化，压力大的时候也不丢消息。另外先用文档自动回答一部分问题，需要人工处理的 oncall 少了 <strong>20%</strong>。',
        '还做了一个 React 看板，实时显示请求量、工单状态和变化趋势；以及一个能复用的 <strong>iOS Item Picker</strong> 组件，sheet 和 panel 两种布局都能自适应。',
      ],
    },
    alibaba: {
      company: '阿里巴巴',
      role: '客户端开发工程师',
      team: '阿里国际 · Lazada',
      period: '2024.6 – 2024.9',
      location: '中国广州',
      bullets: [
        '负责 Lazada 在东南亚的 <strong>Android 网络诊断</strong>。那边网络差、变化多，用户反馈里最多的就是网络问题，应用层又没有现成的方案。我自己设计了一套检测方法，目标是让网络相关的反馈少三成左右。',
        '用 Kotlin 和 Java 写了检测和诊断用的 <strong>SDK</strong> 和界面，覆盖三种情况：App 被禁止联网、信号太弱、开了代理。每种情况都告诉用户怎么解决，网络差的地方也能自己排查。',
      ],
    },
  },

  projects: {
    coffee: {
      name: '咖啡伴侣 ·《活侠传》AI Mod',
      period: '2026.10 – 至今',
      bullets: [
        '给 Unity 武侠 RPG《活侠传》做的 Mod，C# 写了 <strong>3.6 万行</strong>，用 <strong>BepInEx / Harmony</strong> 打了 <strong>230 多个运行时补丁</strong>。功能包括路线图和剧情流程图（从 <strong>2,200 多个反编译的 Lua 剧本</strong>里解析出来）、靠 Lua 记录和重放实现的随时存档、数值修改等。<strong>两周发了 65 个以上的版本</strong>，GitHub <strong>100 多个 star</strong>，下载<strong>超过 2 万次</strong>，现在还在更新。',
        '最核心的是游戏里的 <strong>Tool-Calling Agent</strong>。它有 <strong>15 个工具</strong>，能查剧本里的分岔条件、<strong>上千个剧情旗标</strong>在哪设置和判定、每条路线的好感和数值合计，也能看实时存档和屏幕上的选项。它会先查几轮资料，再根据查到的东西回答，不靠记忆瞎编。',
        '<strong>11 个角色</strong>各用各的口吻聊天，只知道玩家已经读过的剧情，剧透分 <strong>3 档</strong>。想改存档，它会先弹一张卡片，玩家点确认才改。',
        '用一套 <strong>20 道题的评测</strong>加每轮的调试记录，一点点修检索排序、补工具、调提示词（普通模式 <strong>15/20</strong>，深度模式 <strong>18/20</strong>）。提示词前缀保持不变，思考内容原样传回，<strong>缓存命中率一直在 80% 到 86%</strong>。<a href="writing/two-weeks-seventy-releases.zh.html" class="inline-link">怎么做出来的</a>。',
      ],
    },
    rogueforge: {
      name: 'RogueForge · AI 肉鸽卡牌游戏',
      period: '2026.5 – 2026.6',
      bullets: [
        '一款 <strong>AI 原生的肉鸽卡牌游戏</strong>，卡牌、敌人、事件、房间规则和角色这 <strong>5 类内容</strong>都由 LLM 在对局里现做，每一类都走同一条流程：<strong>生成、校验、修正、重来</strong>。',
        '模型只能拼白名单里的效果，战斗逻辑在后端按规则执行。每张卡要过三关：结构、机制白名单、数值预算。差一点的自动往回调，差太多的连同原因一起退回去重做。',
        '数值预算是拿《杀戮尖塔》的真实卡牌校准的，平不平衡有数可查，不用靠猜。<strong>2,658</strong> 个候选里，大约 <strong>95%</strong> 能直接用。可以去<a href="#playground" class="inline-link">试玩</a>里玩玩这个校验器，或者看看<a href="writing/vibes-with-extra-steps.zh.html" class="inline-link">怎么做出来的</a>。',
      ],
    },
    moderation: {
      name: '自适应内容审核 Agent',
      period: '2026.1 – 2026.3',
      bullets: [
        '内容审核不只是贴个标签，而是决定怎么处理。先抽出 <strong>8 个以上的风险信号</strong>（恶意程度、把握有多大、上下文），再让 <strong>ReAct Agent</strong> 挑一个轻重合适的做法：不管、降权、加一道门槛，或者限流。',
        '在 Jigsaw 恶意评论数据集上做了评测。关键在分寸：严重的限流，擦边的加门槛，越拿不准的处理得越小心。',
      ],
    },
    unet: {
      name: 'U-Net 卫星图船只分割',
      period: '2024.6 – 2024.12',
      bullets: [
        '在 Airbus 船只数据集（5 万多张卫星图）上改进 <strong>U-Net</strong>，加了深度可分离卷积和空洞卷积，<strong>Dice 0.63</strong>，<strong>精确率 0.67</strong>。船在图里只占很小一块，所以主要功夫花在损失函数（BCE、Dice、Focal）和跳跃连接上，主干网络没怎么动。',
        '以<strong>第一作者</strong>身份发表在 <em>Applied and Computational Engineering</em>（CONF-SPML 2025）。',
      ],
    },
    successorator: {
      period: '2024.1 – 2024.3',
      bullets: [
        '带头开发一款定目标、排任务优先级的 <strong>Android 效率 App</strong>（Java、Android Studio）。',
        '界面会根据任务类型变化：不同任务、周期性目标、情境标签，各有对应的创建窗口。',
        '模块设计用了<strong>策略、观察者、抽象工厂、建造者</strong>几种模式；团队按敏捷方式开发，我负责把单元测试做扎实。',
      ],
    },
    mtg: {
      name: '用深度学习给《万智牌》分类',
      period: '2024.1 – 2024.3',
      bullets: [
        '带头训练 <strong>CNN 和 Vision Transformer</strong>，按生物类型给《万智牌》卡牌分 <strong>15 类</strong>，ViT 加上监督对比学习（SupCon）最好做到 <strong>60% 准确率</strong>。',
        '用 <strong>DCGAN</strong> 生成新的卡图，扩充训练数据。',
        '通过预处理和数据增强，缓解类别不均衡和同类差异大的问题。',
      ],
    },
    robot: {
      name: '循迹机器人',
      period: '2022.11 – 2022.12',
      bullets: [
        '4 人一组，从零做一台循迹机器人，传感器、电机、编程和控制都要用上。',
        '<strong>3D 打印</strong>底盘，自己做电路、焊板子，一遍遍测试修改。',
        '最后拿它和其他组比赛。',
      ],
    },
  },

  skills: {
    'Languages': '编程语言',
    'AI / Agents': 'AI / Agent',
    'Development': '开发',
    'Testing / Tools': '测试和工具',
  },

  education: {
    MS: { degree: '计算机科学硕士', school: '加州大学圣地亚哥分校', period: '2025.9 – 2027.3（预计）' },
    BS: { degree: '计算机工程学士', school: '加州大学圣地亚哥分校', period: '2021.9 – 2025.6' },
  },
};

/* The Chinese version of one data entry (or the entry itself in English). */
function loc(item, group, key) {
  if (!KN_ZH) return item;
  const over = ZH_DATA[group] && ZH_DATA[group][key];
  return over ? Object.assign({}, item, over) : item;
}

/* Static text, page title and the language switch. Runs before main.js renders. */
(function applyLanguage() {
  if (KN_ZH) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const html = ZH_TEXT[el.dataset.i18n];
      if (html !== undefined) el.innerHTML = html;
    });
    document.title = '聂明轩（Kevin Nie）— 软件工程师';
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', 'UCSD 计算机硕士在读。做 LLM Agent 系统，以及让它们可靠的 grounding、校验与修复循环。曾在米哈游、Vicino AI、字节跳动和阿里巴巴实习。');
  }

  const btn = document.getElementById('langToggle');
  if (!btn) return;
  const label = btn.querySelector('.theme-label');
  if (label) label.textContent = KN_ZH ? 'EN' : '中文';
  btn.setAttribute('aria-label', KN_ZH ? 'Switch to English' : '切换到中文');
  btn.addEventListener('click', () => {
    try { localStorage.setItem('kn-lang', KN_ZH ? 'en' : 'zh'); } catch (e) {}
    location.reload();
  });
})();
