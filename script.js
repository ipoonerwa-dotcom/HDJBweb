/* ═══════════════════════════════════════════════════════════════════
   蝴蝶借呗 · Butterfly Jiebei — Landing interactions
   ─ i18n (zh/en) · scroll reveal · 3D logo tilt · counter · parallax
   ═══════════════════════════════════════════════════════════════════ */

/* ───────────────── i18n dictionary ───────────────── */
const dict = {
  zh: {
    "brand.cn": "蝴蝶借呗",
    "nav.mechanism": "机制",
    "nav.tokenomics": "代币",
    "nav.upgrade": "升级",
    "nav.security": "安全",
    "nav.roadmap": "路线图",
    "nav.launch": "进入 App · 毕业后开放",

    "hero.tag": "蝴蝶白条的下一代 · 双层预言机 · 审计加固",
    "hero.title": "蝴蝶借呗",
    "hero.sub1": "借一次 · 涨一次",
    "hero.sub2": "违约即焚",
    "hero.sub3": "零稀释 · 单向通缩",
    "hero.desc": "在借呗金库抵押代币，秒级借出 BNB —— 300 秒履约窗口内买回即完成循环，每一次借贷都是真实买压，每一次违约都让抵押代币永远进入黑洞。基于蝴蝶白条成熟机制迭代：双层价格防御、最小借款门槛、Guardian 紧急护盾。",
    "hero.cta1": "阅读机制 →",
    "hero.cta2": "看代币经济",
    "hero.t1.l": "买入税",
    "hero.t2.l": "卖出税",
    "hero.t3.l": "进入金库",
    "hero.t4.l": "履约窗口",
    "hero.contract": "FACTORY",
    "hero.verified": "✓ 已验证",

    "mech.tag": "// MECHANISM",
    "mech.title": "四步闪电借贷",
    "mech.sub": "小额成本撬动多头火力，每次借贷都是真实买盘。即使违约，抵押也永久焚毁 —— 流通只会减少，不会增加。",
    "mech.s1.t": "买入 & 抵押",
    "mech.s1.d": "在 DEX 买入蝴蝶借呗代币，3% 买入税自动进入金库；把持仓抵押进合约作为借款保证。",
    "mech.s2.t": "一键借出 BNB",
    "mech.s2.d": "合约用 Portal + TWAP 双层预言机定价，示例：抵押 1 BNB 市值代币可借约 0.1 BNB，300 秒倒计时启动。",
    "mech.s3.t": "履约 or 焚毁",
    "mech.s3.d": "300 秒内用借来的 BNB 买回代币并确认；超时未履约 → 抵押 100% 进入黑洞地址，永久减少流通。",
    "mech.s4.t": "还款 & 解锁",
    "mech.s4.d": "履约成功后随时还款（0 利息），抵押 100% 取回钱包；可立即复借，无冷却，无限加仓。",
    "mech.ex.tag": "LIVE EXAMPLE · 撸贷示例",
    "mech.ex.k1": "买入持仓",
    "mech.ex.k2": "合约评估",
    "mech.ex.k3": "300 秒内买回",
    "mech.ex.k4": "履约 ✓",
    "mech.ex.v4": "随时还款赎回抵押",
    "mech.ex.k5": "超过 300 秒",
    "mech.ex.v5": "未履约",
    "mech.ex.v6": "抵押 100% 焚毁 · 流通永久减少",

    "tok.tag": "// TOKENOMICS",
    "tok.title": "代币经济",
    "tok.sub": "3% 买入 / 5% 卖出 —— 每笔交易都为通缩飞轮加油。",
    "tok.buy": "买入税",
    "tok.sell": "卖出税",
    "tok.burn": "销毁 Burn",
    "tok.reflow": "流动性回流 LP",
    "tok.vault": "借呗金库 Vault",
    "tok.wheel": "FLYWHEEL · 通缩飞轮",
    "tok.w1": "交易税自动注入金库",
    "tok.w2": "金库 BNB 供用户借贷",
    "tok.w3": "借款 BNB 强制买回代币",
    "tok.w4": "币价上涨 + 违约焚毁 = 双向通缩",

    "up.tag": "// UPGRADE",
    "up.title": "借呗 vs 白条",
    "up.sub": "基于蝴蝶白条验证过的机制全面升级。同样的理念，更狠的执行。",
    "up.h.k": "指标",
    "up.h.a": "蝴蝶白条",
    "up.h.b": "蝴蝶借呗",
    "up.r1.k": "价格预言机",
    "up.r1.v": "Portal + TWAP 双层防御",
    "up.r2.k": "抗闪电贷",
    "up.r2.v": "✅ 彻底移除 spot 降级",
    "up.r3.k": "抗灌水攻击",
    "up.r3.v": "MIN_BORROW 门槛 + 队列有界 + Keeper 奖励",
    "up.r4.k": "紧急权限",
    "up.r4.v": "Guardian 多签护盾 · Creator 无金库权",
    "up.r5.k": "履约窗口",
    "up.r5.v": "默认 300s · 可调 60–3600",
    "up.r6.k": "审计状态",
    "up.r6.v": "Flap 平台审计 · 全部发现已修复",

    "sec.tag": "// SECURITY",
    "sec.title": "安全设计",
    "sec.sub": "借呗的安全不是口号，是代码、审计和治理结构三位一体。",
    "sec.c1.t": "双层价格预言机",
    "sec.c1.d": "FLAP Portal Oracle 为主，LP TWAP 为辅。彻底移除可被单笔闪电贷操纵的现货价降级路径。",
    "sec.c2.t": "Guardian 紧急权",
    "sec.c2.d": "emergencyWithdraw 仅 FLAP 官方多签可调用。Creator 无权提走金库 BNB，从源头堵 rug。",
    "sec.c3.t": "硬地板保护",
    "sec.c3.d": "hardFloorBnb + totalOutstanding 双追踪，金库余额永远不会被借款掏空到 0。",
    "sec.c4.t": "抗灌水队列",
    "sec.c4.d": "MAX_PENDING=50 + 最小借款门槛 + 滑动游标清扫 + 1% keeper 奖励，令占位攻击成本远高于收益。",
    "sec.c5.t": "MEV 同块防护",
    "sec.c5.d": "S_total 跨块快照，同块操纵借贷的三明治攻击自动失效。",
    "sec.c6.t": "链上透明",
    "sec.c6.d": "合约开源、参数可审计、事件完整。零后门、零管理员提款。",

    "road.tag": "// ROADMAP",
    "road.title": "发展路线",
    "road.p1.tag": "PHASE 01 · 已完成",
    "road.p1.t": "合约审计 + 修复",
    "road.p1.d": "Flap 平台全量审计，全部发现已修复；双层预言机落地；MIN_BORROW 防灌水生效。",
    "road.p2.tag": "PHASE 02 · 进行中",
    "road.p2.t": "内盘发射 + 底池毕业",
    "road.p2.d": "FLAP 平台内盘启动 → 累计 15.99 BNB 自动毕业 → PancakeSwap 建池。",
    "road.p3.tag": "PHASE 03 · 即将",
    "road.p3.t": "借贷激活 + DApp 上线",
    "road.p3.d": "毕业即激活借贷面板；内嵌 Swap 免跳转；TWAP 预热后全量开放。",
    "road.p4.tag": "PHASE 04 · 远期",
    "road.p4.t": "Butterfly 生态 · 多链部署",
    "road.p4.d": "将借呗模式复制到更多代币；跨链金库；社区治理与分润。",

    "cta.title": "合约已就绪 · 等你上桌",
    "cta.desc": "审计通过、Factory 已部署并验证。代币内盘发射 → 15.99 BNB 毕业 → DApp 上线撸贷。先买入一手筹码，抢占先机。",
    "cta.b1": "买入代币 🪙",
    "cta.b2": "DApp · 毕业后开放",
    "cta.meta1": "BNB Chain",
    "cta.meta2": "合约开源",
    "cta.meta3": "审计通过",

    "foot.tag": "借一次 · 涨一次 · 违约即焚",
    "foot.h1": "协议",
    "foot.h2": "资源",
    "foot.h3": "社区",
    "foot.l1": "机制",
    "foot.l2": "代币",
    "foot.l3": "安全",
    "foot.l4": "合约地址",
    "foot.l5": "审计报告",
    "foot.l6": "GitHub",
    "foot.disclaim": "DYOR · 纯链上算法治理 · 无中心化托管",

    "wallet.connect":    "连接钱包",
    "wallet.connecting": "连接中...",
    "wallet.copy":       "复制地址",
    "wallet.copied":     "已复制 ✓",
    "wallet.bscscan":    "在 BscScan 查看 ↗",
    "wallet.switch":     "切换到 BNB Chain",
    "wallet.disconnect": "断开连接",
    "wallet.wrongNet":   "⚠️ 非 BSC 网络",
    "wallet.failed":     "连接失败",
  },
  en: {
    "brand.cn": "Butterfly Jiebei",
    "nav.mechanism": "Mechanism",
    "nav.tokenomics": "Tokenomics",
    "nav.upgrade": "Upgrade",
    "nav.security": "Security",
    "nav.roadmap": "Roadmap",
    "nav.launch": "App · Post-Graduation",

    "hero.tag": "Next-Gen of Butterfly Baitiao · Two-Layer Oracle · Audit-Hardened",
    "hero.title": "Butterfly Jiebei",
    "hero.sub1": "Every loan pumps price",
    "hero.sub2": "Every default burns",
    "hero.sub3": "Zero Dilution · Pure Deflation",
    "hero.desc": "Stake tokens to borrow BNB instantly — buy back within 300 seconds or your collateral is incinerated. Every loan is real buy pressure; every default deflates supply. Built on Butterfly Baitiao's proven mechanics with a two-layer oracle, min-borrow anti-grief, and Guardian emergency shield.",
    "hero.cta1": "Read Mechanism →",
    "hero.cta2": "Tokenomics",
    "hero.t1.l": "Buy Tax",
    "hero.t2.l": "Sell Tax",
    "hero.t3.l": "To Vault",
    "hero.t4.l": "Window",
    "hero.contract": "FACTORY",
    "hero.verified": "✓ Verified",

    "mech.tag": "// MECHANISM",
    "mech.title": "Flash Loan in 4 Steps",
    "mech.sub": "Pay a small cost to unlock long exposure. Every loan is a real buy. Even defaults deflate supply via burn.",
    "mech.s1.t": "Buy & Stake",
    "mech.s1.d": "Buy tokens on the DEX (3% buy tax auto-routes to the vault), then stake your position as collateral.",
    "mech.s2.t": "Borrow BNB",
    "mech.s2.d": "Two-layer Portal+TWAP oracle prices your stake. Example: stake 1 BNB worth, borrow ~0.1 BNB. 300-second timer starts.",
    "mech.s3.t": "Fulfill or Burn",
    "mech.s3.d": "Buy back tokens within 300 seconds and confirm; miss the window → 100% of collateral goes to the dead address.",
    "mech.s4.t": "Repay & Unlock",
    "mech.s4.d": "Repay anytime after confirmation (zero interest). Collateral returns in full. Re-borrow instantly — no cooldown.",
    "mech.ex.tag": "LIVE EXAMPLE",
    "mech.ex.k1": "Buy Position",
    "mech.ex.k2": "Vault Evaluates",
    "mech.ex.k3": "Buy Back < 300s",
    "mech.ex.k4": "Fulfilled ✓",
    "mech.ex.v4": "Repay anytime to unlock",
    "mech.ex.k5": ">300s",
    "mech.ex.v5": "No buy-back",
    "mech.ex.v6": "Collateral 100% burned · supply reduced forever",

    "tok.tag": "// TOKENOMICS",
    "tok.title": "Tokenomics",
    "tok.sub": "3% buy / 5% sell — every trade fuels the deflationary flywheel.",
    "tok.buy": "Buy Tax",
    "tok.sell": "Sell Tax",
    "tok.burn": "Burn",
    "tok.reflow": "LP Reflow",
    "tok.vault": "Vault",
    "tok.wheel": "FLYWHEEL · Deflation Loop",
    "tok.w1": "Trade tax auto-flows into vault",
    "tok.w2": "Vault BNB backs user loans",
    "tok.w3": "Borrowed BNB must buy back tokens",
    "tok.w4": "Price pump + default burn = two-way deflation",

    "up.tag": "// UPGRADE",
    "up.title": "Jiebei vs Baitiao",
    "up.sub": "Upgrade across the board from Butterfly Baitiao's proven mechanics. Same vision, harder execution.",
    "up.h.k": "Metric",
    "up.h.a": "Baitiao",
    "up.h.b": "Jiebei",
    "up.r1.k": "Price Oracle",
    "up.r1.v": "Portal + TWAP two-layer defense",
    "up.r2.k": "Flash-Loan Resistance",
    "up.r2.v": "✅ Spot fallback removed entirely",
    "up.r3.k": "Anti-Grief",
    "up.r3.v": "MIN_BORROW floor + bounded queue + keeper reward",
    "up.r4.k": "Emergency Authority",
    "up.r4.v": "Guardian multisig · Creator has NO vault access",
    "up.r5.k": "Verification Window",
    "up.r5.v": "Default 300s · tunable 60–3600",
    "up.r6.k": "Audit Status",
    "up.r6.v": "Audited by Flap · all findings fixed",

    "sec.tag": "// SECURITY",
    "sec.title": "Security by Design",
    "sec.sub": "Not a slogan — code, audit, and governance structure in lockstep.",
    "sec.c1.t": "Two-Layer Price Oracle",
    "sec.c1.d": "Portal Oracle primary, LP TWAP fallback. Spot price fallback — the flash-loan attack surface — removed entirely.",
    "sec.c2.t": "Guardian Emergency",
    "sec.c2.d": "emergencyWithdraw callable only by FLAP's multisig. Creator cannot touch vault BNB. Rug surface = 0.",
    "sec.c3.t": "Hard-Floor Reserve",
    "sec.c3.d": "hardFloorBnb + totalOutstanding dual-track ensures the vault can never be borrowed down to zero.",
    "sec.c4.t": "Queue Anti-Grief",
    "sec.c4.d": "MAX_PENDING=50 + MIN_BORROW floor + sliding cursor sweep + 1% keeper reward. Grief cost ≫ grief payoff.",
    "sec.c5.t": "Cross-Block MEV Guard",
    "sec.c5.d": "S_total cross-block snapshot neutralizes same-block sandwich attacks on the lending math.",
    "sec.c6.t": "On-Chain Transparency",
    "sec.c6.d": "Open source. Parameters auditable. Full event coverage. Zero backdoors, zero admin withdrawal.",

    "road.tag": "// ROADMAP",
    "road.title": "Roadmap",
    "road.p1.tag": "PHASE 01 · DONE",
    "road.p1.t": "Audit + Fixes",
    "road.p1.d": "Full Flap-platform audit; all findings addressed; two-layer oracle live; MIN_BORROW anti-grief shipped.",
    "road.p2.tag": "PHASE 02 · LIVE",
    "road.p2.t": "Bonding Curve + Graduation",
    "road.p2.d": "FLAP bonding-curve launch → accumulate 15.99 BNB → auto-graduate to PancakeSwap.",
    "road.p3.tag": "PHASE 03 · SOON",
    "road.p3.t": "Lending + DApp",
    "road.p3.d": "Activate lending on graduation; in-dapp swap without redirect; full rollout after TWAP warmup.",
    "road.p4.tag": "PHASE 04 · FUTURE",
    "road.p4.t": "Butterfly Ecosystem · Multi-chain",
    "road.p4.d": "Replicate the Jiebei model across more tokens; cross-chain vaults; community governance and revenue share.",

    "cta.title": "Contracts ready · Claim your seat",
    "cta.desc": "Audit passed. Factory deployed & verified. Token bonding-curve launch → 15.99 BNB graduation → DApp goes live. Grab your bag before the first loop.",
    "cta.b1": "Buy Token 🪙",
    "cta.b2": "DApp · Post-Graduation",
    "cta.meta1": "BNB Chain",
    "cta.meta2": "Open Source",
    "cta.meta3": "Audit Passed",

    "foot.tag": "Loan · Pump · Burn",
    "foot.h1": "Protocol",
    "foot.h2": "Resources",
    "foot.h3": "Community",
    "foot.l1": "Mechanism",
    "foot.l2": "Tokenomics",
    "foot.l3": "Security",
    "foot.l4": "Contract",
    "foot.l5": "Audit Report",
    "foot.l6": "GitHub",
    "foot.disclaim": "DYOR · Pure on-chain algorithmic governance · Non-custodial",

    "wallet.connect":    "Connect Wallet",
    "wallet.connecting": "Connecting...",
    "wallet.copy":       "Copy Address",
    "wallet.copied":     "Copied ✓",
    "wallet.bscscan":    "View on BscScan ↗",
    "wallet.switch":     "Switch to BNB Chain",
    "wallet.disconnect": "Disconnect",
    "wallet.wrongNet":   "⚠️ Wrong Network",
    "wallet.failed":     "Connection failed",
  }
};

/* ───────────────── Apply i18n to DOM ───────────────── */
function applyLang(lang) {
  document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  const bag = dict[lang] || dict.zh;
  document.querySelectorAll("[data-i]").forEach(el => {
    const key = el.getAttribute("data-i");
    if (bag[key] !== undefined) el.textContent = bag[key];
  });
  const btn = document.getElementById("langSwitch");
  if (btn) btn.textContent = lang === "zh" ? "EN" : "中";
  localStorage.setItem("lang", lang);
}

(function initLang() {
  const saved = localStorage.getItem("lang");
  const lang = (saved === "en" || saved === "zh") ? saved : "zh";
  applyLang(lang);
  const btn = document.getElementById("langSwitch");
  btn && btn.addEventListener("click", () => {
    const cur = localStorage.getItem("lang") || "zh";
    applyLang(cur === "zh" ? "en" : "zh");
  });
})();

/* ───────────────── Scroll reveal (IntersectionObserver) ───────────────── */
(function initReveal() {
  const selectors = [
    ".flow-step", ".tok-card", ".cmp-row", ".sec-card", ".road-item",
    ".example-box", ".cta-box", ".sec-head"
  ];
  const els = document.querySelectorAll(selectors.join(","));
  els.forEach((el, i) => {
    el.classList.add("reveal");
    el.style.transitionDelay = Math.min(i * 40, 400) + "ms";
  });

  if (!("IntersectionObserver" in window)) {
    els.forEach(el => el.classList.add("visible"));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

  els.forEach(el => io.observe(el));
})();

/* ───────────────── Number count-up in hero tiles ───────────────── */
(function initCounters() {
  const nums = document.querySelectorAll(".tile-val .num");
  if (!nums.length) return;

  const animate = (el) => {
    const target = parseFloat(el.textContent);
    if (!isFinite(target)) return;
    const dur = 900;
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min((t - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(target * eased);
      el.textContent = val;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target;
    };
    requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animate(e.target);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  nums.forEach(n => io.observe(n));
})();

/* ───────────────── Hero logo: 3D parallax tilt ───────────────── */
(function initLogoTilt() {
  const wrap = document.querySelector(".hero-logo-wrap");
  const logo = document.querySelector(".hero-logo");
  if (!wrap || !logo) return;

  let raf = 0;
  let tx = 0, ty = 0;

  wrap.addEventListener("mousemove", (e) => {
    const r = wrap.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width  - 0.5;
    const y = (e.clientY - r.top)  / r.height - 0.5;
    tx = x * 14;   // max ~14deg on Y axis
    ty = -y * 14;  // max ~14deg on X axis
    if (!raf) raf = requestAnimationFrame(update);
  });
  wrap.addEventListener("mouseleave", () => {
    tx = 0; ty = 0;
    if (!raf) raf = requestAnimationFrame(update);
  });

  function update() {
    raf = 0;
    logo.style.transform = `perspective(900px) rotateY(${tx}deg) rotateX(${ty}deg)`;
  }
})();

/* ───────────────── Hero parallax on scroll ───────────────── */
(function initParallax() {
  const logo = document.querySelector(".hero-logo-wrap");
  const grid = document.querySelector(".bg-grid");
  if (!logo) return;

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (y < 900) {
        logo.style.translate = `0 ${y * 0.18}px`;
        logo.style.opacity = Math.max(0, 1 - y / 700);
      }
      if (grid) grid.style.backgroundPosition = `${y * 0.15}px ${y * 0.15}px`;
      ticking = false;
    });
  });
})();

/* ───────────────── Animated progress bars on tok-breakdown ───────────────── */
(function initBars() {
  const bars = document.querySelectorAll(".tok-bar-fill");
  if (!bars.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const fill = e.target;
        const final = fill.style.width;
        fill.style.width = "0%";
        requestAnimationFrame(() => {
          fill.style.transition = "width 1.1s cubic-bezier(.2,.8,.3,1)";
          fill.style.width = final;
        });
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.4 });
  bars.forEach(b => io.observe(b));
})();

/* ───────────────── Ambient floating butterflies (subtle) ───────────────── */
(function spawnButterflies() {
  const root = document.createElement("div");
  root.setAttribute("aria-hidden", "true");
  Object.assign(root.style, {
    position: "fixed", inset: "0", pointerEvents: "none",
    zIndex: "0", overflow: "hidden"
  });
  document.body.appendChild(root);

  const COUNT = 6;
  for (let i = 0; i < COUNT; i++) {
    const b = document.createElement("div");
    b.textContent = "🦋";
    const size = 16 + Math.random() * 22;
    const dur = 18 + Math.random() * 18;
    const delay = -Math.random() * dur;
    const startX = Math.random() * 100;
    const drift = (Math.random() - 0.5) * 40;
    Object.assign(b.style, {
      position: "absolute",
      bottom: "-40px",
      left: startX + "%",
      fontSize: size + "px",
      opacity: "0.12",
      filter: "drop-shadow(0 0 12px rgba(255,140,60,0.3)) hue-rotate(-10deg)",
      animation: `flyUp ${dur}s linear ${delay}s infinite`,
      transform: `translateX(${drift}px)`
    });
    root.appendChild(b);
  }

  // inject keyframes once
  if (!document.getElementById("flyUpKF")) {
    const st = document.createElement("style");
    st.id = "flyUpKF";
    st.textContent = `
      @keyframes flyUp {
        0%   { transform: translate(0, 0) rotate(-5deg); opacity: 0; }
        10%  { opacity: 0.14; }
        50%  { transform: translate(30px, -50vh) rotate(8deg); opacity: 0.18; }
        90%  { opacity: 0.14; }
        100% { transform: translate(-30px, -110vh) rotate(-8deg); opacity: 0; }
      }`;
    document.head.appendChild(st);
  }
})();

/* ───────────────── Marquee-style ASCII banner typewriter (hero only) ───────────────── */
(function typewriter() {
  const el = document.querySelector(".ascii-banner");
  if (!el) return;
  const full = el.innerHTML;
  // only run first time for dramatic effect
  if (sessionStorage.getItem("banner-typed")) return;
  el.innerHTML = "";
  let i = 0;
  // strip HTML for typing, then restore
  const text = full.replace(/<[^>]+>/g, "");
  const id = setInterval(() => {
    el.textContent = text.slice(0, ++i);
    if (i >= text.length) {
      clearInterval(id);
      el.innerHTML = full;
      sessionStorage.setItem("banner-typed", "1");
    }
  }, 8);
})();

/* ───────────────── Prevent clicks on .btn-soon (DApp placeholder) ───────────────── */
(function initSoonGuards() {
  document.querySelectorAll(".btn-soon").forEach(el => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      el.animate(
        [{ transform: "translateX(0)" }, { transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "translateX(0)" }],
        { duration: 260, iterations: 1 }
      );
    });
  });
})();

/* ───────────────── Copy contract address to clipboard ───────────────── */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch {}
    document.body.removeChild(ta);
    return ok;
  }
}

(function initCopy() {
  document.querySelectorAll("[data-copy]").forEach(el => {
    el.addEventListener("click", async () => {
      await copyToClipboard(el.getAttribute("data-copy"));
      el.classList.add("copied");
      setTimeout(() => el.classList.remove("copied"), 1400);
    });
  });
})();

/* ═══════════════════════════════════════════════════════════════════
   WalletConnect v2 + Injected (MetaMask/OKX/TP) with auto-reconnect
   - Lazy-loads @walletconnect/ethereum-provider on first click
   - Prefers injected wallet; falls back to QR modal
   - Auto-switches to BSC (chain 56); adds if missing
   ═══════════════════════════════════════════════════════════════════ */

const WC_PROJECT_ID = "60a3c0371938c4ab07c61622fdc14e0e";
const BSC_CHAIN_ID_HEX = "0x38"; // 56
const BSC_CHAIN_ID_NUM = 56;

const walletState = {
  address: null,
  chainId: null,
  kind: null,        // "injected" | "walletconnect"
  wcProvider: null,
  activeProvider: null
};

function t(key) {
  const lang = localStorage.getItem("lang") || "zh";
  return (dict[lang] && dict[lang][key]) || dict.zh[key] || key;
}

function shortAddr(a) {
  return a ? a.slice(0, 6) + "…" + a.slice(-4) : "";
}

function getWalletBtn() { return document.getElementById("walletBtn"); }
function getWalletLabel() { return document.querySelector("#walletBtn .wallet-label"); }

function renderWallet() {
  const btn = getWalletBtn();
  const label = getWalletLabel();
  if (!btn || !label) return;

  if (walletState.address) {
    btn.classList.add("connected");
    btn.classList.remove("loading");
    label.textContent = shortAddr(walletState.address);
    btn.setAttribute("data-i", "");
  } else {
    btn.classList.remove("connected", "loading");
    label.textContent = t("wallet.connect");
    btn.setAttribute("data-i", "wallet.connect");
  }
}

async function ensureBSC(provider) {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BSC_CHAIN_ID_HEX }]
    });
  } catch (e) {
    if (e && (e.code === 4902 || (e.data && e.data.originalError && e.data.originalError.code === 4902))) {
      try {
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: BSC_CHAIN_ID_HEX,
            chainName: "BNB Smart Chain",
            nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
            rpcUrls: ["https://bsc-dataseed.binance.org/"],
            blockExplorerUrls: ["https://bscscan.com"]
          }]
        });
      } catch (err) { console.warn("add chain failed:", err); }
    }
  }
}

function bindProviderEvents(provider) {
  if (!provider || !provider.on) return;
  provider.on("accountsChanged", (accs) => {
    if (!accs || !accs[0]) { disconnectWallet(); return; }
    walletState.address = accs[0];
    renderWallet();
    closeWalletMenu();
  });
  provider.on("chainChanged", (cid) => {
    walletState.chainId = typeof cid === "string" ? parseInt(cid, 16) : Number(cid);
    renderWallet();
  });
  provider.on("disconnect", () => disconnectWallet());
}

async function connectInjected() {
  if (!window.ethereum || !window.ethereum.request) throw new Error("no injected");
  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  if (!accounts || !accounts[0]) throw new Error("no account");
  await ensureBSC(window.ethereum);
  walletState.address = accounts[0];
  walletState.kind = "injected";
  walletState.activeProvider = window.ethereum;
  try {
    const cid = await window.ethereum.request({ method: "eth_chainId" });
    walletState.chainId = parseInt(cid, 16);
  } catch {}
  bindProviderEvents(window.ethereum);
  localStorage.setItem("wallet-kind", "injected");
}

async function getWCProvider() {
  if (walletState.wcProvider) return walletState.wcProvider;
  const mod = await import("https://esm.sh/@walletconnect/ethereum-provider@2.17.2?bundle");
  const EthereumProvider = mod.EthereumProvider || mod.default;
  const p = await EthereumProvider.init({
    projectId: WC_PROJECT_ID,
    chains: [BSC_CHAIN_ID_NUM],
    optionalChains: [BSC_CHAIN_ID_NUM],
    showQrModal: true,
    metadata: {
      name: "蝴蝶借呗 Butterfly Jiebei",
      description: "Next-gen of Butterfly Baitiao · Audited",
      url: location.origin,
      icons: [location.origin + "/logo.png"]
    },
    qrModalOptions: {
      themeMode: "dark",
      themeVariables: {
        "--wcm-accent-color":     "#E5B83A",
        "--wcm-accent-fill-color":"#1a0406",
        "--wcm-background-color": "#1A0406"
      }
    }
  });
  walletState.wcProvider = p;
  bindProviderEvents(p);
  return p;
}

async function connectWalletConnect() {
  const p = await getWCProvider();
  if (!p.session) await p.connect();
  if (!p.accounts || !p.accounts[0]) throw new Error("no account");
  walletState.address = p.accounts[0];
  walletState.kind = "walletconnect";
  walletState.activeProvider = p;
  walletState.chainId = p.chainId;
  localStorage.setItem("wallet-kind", "walletconnect");
}

async function disconnectWallet() {
  try {
    if (walletState.wcProvider && walletState.wcProvider.session) {
      await walletState.wcProvider.disconnect();
    }
  } catch {}
  walletState.address = null;
  walletState.chainId = null;
  walletState.kind = null;
  walletState.activeProvider = null;
  localStorage.removeItem("wallet-kind");
  renderWallet();
  closeWalletMenu();
}

/* ─── Wallet menu (dropdown under the button) ─── */
function buildWalletMenu() {
  const btn = getWalletBtn();
  if (!btn) return null;
  let menu = btn.querySelector(".wallet-menu");
  if (menu) return menu;
  menu = document.createElement("div");
  menu.className = "wallet-menu";
  menu.addEventListener("click", e => e.stopPropagation());
  btn.appendChild(menu);
  return menu;
}

function closeWalletMenu() {
  const m = document.querySelector(".wallet-menu");
  if (m) m.classList.remove("open");
}

function openWalletMenu() {
  const menu = buildWalletMenu();
  if (!menu) return;
  const addr = walletState.address;
  const wrongNet = walletState.chainId && walletState.chainId !== BSC_CHAIN_ID_NUM;
  menu.innerHTML = `
    <div class="wallet-menu-full"><b>${addr}</b></div>
    ${wrongNet ? `<button class="wallet-menu-item" data-act="switch">🔄 ${t("wallet.switch")}</button>` : ""}
    <button class="wallet-menu-item" data-act="copy">📋 ${t("wallet.copy")}</button>
    <a class="wallet-menu-item" href="https://bscscan.com/address/${addr}" target="_blank" rel="noopener">🔍 ${t("wallet.bscscan")}</a>
    <button class="wallet-menu-item danger" data-act="disconnect">⏻ ${t("wallet.disconnect")}</button>
  `;
  menu.classList.add("open");

  menu.querySelectorAll("[data-act]").forEach(el => {
    el.addEventListener("click", async (e) => {
      e.stopPropagation();
      const act = el.getAttribute("data-act");
      if (act === "copy") {
        await copyToClipboard(addr);
        el.textContent = "✓ " + t("wallet.copied");
        setTimeout(() => el.textContent = "📋 " + t("wallet.copy"), 1200);
      } else if (act === "switch") {
        if (walletState.activeProvider) await ensureBSC(walletState.activeProvider);
      } else if (act === "disconnect") {
        await disconnectWallet();
      }
    });
  });
}

/* ─── Wallet button click handler ─── */
(function initWalletButton() {
  const btn = getWalletBtn();
  if (!btn) return;

  btn.addEventListener("click", async (e) => {
    e.stopPropagation();
    if (walletState.address) {
      const menu = btn.querySelector(".wallet-menu");
      if (menu && menu.classList.contains("open")) closeWalletMenu();
      else openWalletMenu();
      return;
    }

    btn.classList.add("loading");
    btn.disabled = true;
    const label = getWalletLabel();
    if (label) label.textContent = t("wallet.connecting");

    try {
      if (window.ethereum && window.ethereum.request) {
        try {
          await connectInjected();
        } catch (err) {
          if (err && err.code === 4001) { throw err; }        // user rejected
          await connectWalletConnect();                       // fallback
        }
      } else {
        await connectWalletConnect();
      }
      renderWallet();
    } catch (err) {
      console.error("[wallet] connect failed:", err);
      if (err && err.code !== 4001) {
        alert(t("wallet.failed") + ": " + (err.message || err));
      }
      renderWallet();
    } finally {
      btn.disabled = false;
      btn.classList.remove("loading");
    }
  });

  // Close menu when clicking outside
  document.addEventListener("click", closeWalletMenu);

  // Listen for injected account changes even before we connect
  if (window.ethereum && window.ethereum.on) {
    window.ethereum.on("accountsChanged", (accs) => {
      if (walletState.kind !== "injected") return;
      if (!accs || !accs[0]) disconnectWallet();
      else { walletState.address = accs[0]; renderWallet(); closeWalletMenu(); }
    });
    window.ethereum.on("chainChanged", (cid) => {
      if (walletState.kind !== "injected") return;
      walletState.chainId = parseInt(cid, 16);
      renderWallet();
    });
  }
})();

/* ─── Auto-reconnect on page load if previously connected ─── */
(async function autoReconnect() {
  const kind = localStorage.getItem("wallet-kind");
  if (!kind) return;
  try {
    if (kind === "injected" && window.ethereum && window.ethereum.request) {
      const accs = await window.ethereum.request({ method: "eth_accounts" });
      if (accs && accs[0]) {
        walletState.address = accs[0];
        walletState.kind = "injected";
        walletState.activeProvider = window.ethereum;
        try {
          const cid = await window.ethereum.request({ method: "eth_chainId" });
          walletState.chainId = parseInt(cid, 16);
        } catch {}
        bindProviderEvents(window.ethereum);
        renderWallet();
      } else {
        localStorage.removeItem("wallet-kind");
      }
    } else if (kind === "walletconnect") {
      const p = await getWCProvider();
      if (p.session && p.accounts && p.accounts[0]) {
        walletState.address = p.accounts[0];
        walletState.kind = "walletconnect";
        walletState.activeProvider = p;
        walletState.chainId = p.chainId;
        renderWallet();
      } else {
        localStorage.removeItem("wallet-kind");
      }
    }
  } catch (e) {
    console.warn("[wallet] auto-reconnect failed:", e);
    localStorage.removeItem("wallet-kind");
  }
})();
