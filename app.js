/* ═══════════════════════════════════════════════════════════════════
   蝴蝶借呗 DApp — on-chain reads + writes via ethers v6
   ═══════════════════════════════════════════════════════════════════ */

import { BrowserProvider, Contract, formatEther, parseEther, formatUnits, parseUnits, ZeroAddress } from "ethers";

const CFG = window.JIEBEI_CONFIG;
const ABI = window.JIEBEI_ABI;

/* ─────────── Helpers ─────────── */

const $ = (id) => document.getElementById(id);

function fmt(value, decimals = 18, maxDp = 4) {
  if (value == null) return "—";
  try {
    const s = formatUnits(value, decimals);
    const n = Number(s);
    if (!isFinite(n)) return s;
    if (n === 0) return "0";
    if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
    if (n >= 1) return n.toFixed(Math.min(maxDp, 4));
    if (n >= 0.0001) return n.toFixed(6);
    return n.toExponential(2);
  } catch { return String(value); }
}

function shortAddr(a) {
  if (!a) return "";
  return a.slice(0, 6) + "…" + a.slice(-4);
}

function fmtSeconds(s) {
  s = Number(s);
  if (!isFinite(s) || s <= 0) return "00:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return String(m).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
}

/* ─────────── Toast ─────────── */

function toast(msg, kind = "loading", ttl = 4500) {
  const root = $("toastRoot");
  if (!root) return { close() {}, update() {} };
  const el = document.createElement("div");
  el.className = "toast " + kind;
  el.textContent = msg;
  root.appendChild(el);
  let closed = false;
  const close = () => {
    if (closed) return; closed = true;
    el.classList.add("out");
    setTimeout(() => el.remove(), 260);
  };
  if (ttl > 0) setTimeout(close, ttl);
  return {
    close,
    update(newMsg, newKind) {
      el.textContent = newMsg;
      if (newKind) { el.className = "toast " + newKind; }
    }
  };
}

function translateError(e) {
  const msg = (e && (e.shortMessage || e.reason || e.message)) || String(e);
  if (!msg) return "交易失败";
  if (/user rejected|user denied|rejected the request|ACTION_REJECTED/i.test(msg)) return "你取消了交易";
  if (/insufficient funds/i.test(msg)) return "BNB 余额不足，无法支付 gas 或还款";
  if (/chain not|wrong chain|wrong network/i.test(msg)) return "请切换到 BNB Chain";
  if (/active loan exists|未结束借贷/i.test(msg)) return "你已有一笔借贷，请先还款再开新的";
  if (/pending verification|待履约/i.test(msg)) return "你有未确认的借贷，请先履约或等超时";
  if (/FLAP not enough|代币买入不足/i.test(msg)) return "买回的代币数量不够，请去 DEX 多买一点再确认";
  if (/verification timeout|履约已超时/i.test(msg)) return "300 秒履约窗口已过期";
  if (/hard floor|硬地板/i.test(msg)) return "金库 BNB 不足，无法借出当前金额";
  if (/no borrowable|lending not active|借贷未激活/i.test(msg)) return "借贷暂未激活（代币可能还在内盘阶段）";
  if (/below minimum borrow|最小借款/i.test(msg)) return "借款额低于最小门槛，请增加抵押";
  if (/wrong repay amount|还款金额错误/i.test(msg)) return "还款金额必须等于借款原值";
  if (/must confirmBuy first|确认履约/i.test(msg)) return "请先点确认履约";
  return msg.length > 180 ? msg.slice(0, 180) + "…" : msg;
}

/* ─────────── Contract plumbing ─────────── */

let ethersProvider = null;
let readonlyProvider = null;
let vaultRO, tokenRO;   // read-only contracts (via public RPC; works without wallet)
let vaultRW, tokenRW;   // with signer (for writes)
let userAddress = null;
let chainOk = false;
let refreshTimer = null;
let decimals = 18;

// Cached state snapshot
const state = {
  sUser: 0n, borrowed: 0n, borrowTime: 0n, remainingTime: 0n, requiredFlap: 0n,
  sTotal: 0n, bmax: 0n, lendingActive: false, poolAddr: ZeroAddress,
  vaultBnb: 0n, price: 0n, priceSrc: "—", poolState: 255,
  balance: 0n, allowance: 0n, symbol: "蝴蝶借呗", serviceFeeBps: 300n, verificationWindow: 300n
};

function ensureReadonly() {
  if (!readonlyProvider) {
    // ethers v6 JsonRpcProvider
    const { JsonRpcProvider } = globalThis.ethers || {};
    if (JsonRpcProvider) {
      readonlyProvider = new JsonRpcProvider(CFG.RPC, { chainId: CFG.CHAIN_ID, name: "bsc" }, { staticNetwork: true });
    }
  }
  if (!readonlyProvider) {
    // fallback: dynamic import
    return import("ethers").then(({ JsonRpcProvider }) => {
      readonlyProvider = new JsonRpcProvider(CFG.RPC, { chainId: CFG.CHAIN_ID, name: "bsc" }, { staticNetwork: true });
      vaultRO = new Contract(CFG.VAULT_ADDRESS, ABI.VAULT, readonlyProvider);
      tokenRO = new Contract(CFG.TOKEN_ADDRESS, ABI.ERC20, readonlyProvider);
    });
  }
  if (!vaultRO) {
    vaultRO = new Contract(CFG.VAULT_ADDRESS, ABI.VAULT, readonlyProvider);
    tokenRO = new Contract(CFG.TOKEN_ADDRESS, ABI.ERC20, readonlyProvider);
  }
  return null;
}

async function initReadonly() {
  const { JsonRpcProvider } = await import("ethers");
  readonlyProvider = new JsonRpcProvider(CFG.RPC, { chainId: CFG.CHAIN_ID, name: "bsc" }, { staticNetwork: true });
  vaultRO = new Contract(CFG.VAULT_ADDRESS, ABI.VAULT, readonlyProvider);
  tokenRO = new Contract(CFG.TOKEN_ADDRESS, ABI.ERC20, readonlyProvider);
  try { decimals = Number(await tokenRO.decimals()); } catch { decimals = 18; }
  try { state.symbol = await tokenRO.symbol(); } catch {}
}

function setupWriteContracts() {
  const w = window.JiebeiWallet;
  if (!w || !w.activeProvider || !w.address) { vaultRW = tokenRW = null; ethersProvider = null; return; }
  ethersProvider = new BrowserProvider(w.activeProvider, CFG.CHAIN_ID);
  ethersProvider.getSigner().then(signer => {
    vaultRW = new Contract(CFG.VAULT_ADDRESS, ABI.VAULT, signer);
    tokenRW = new Contract(CFG.TOKEN_ADDRESS, ABI.ERC20, signer);
  }).catch(() => { vaultRW = tokenRW = null; });
}

/* ─────────── Refresh loop ─────────── */

async function refresh() {
  if (!vaultRO || !tokenRO) return;
  const addr = userAddress || ZeroAddress;
  try {
    const [
      sUser, borrowed, borrowTime, remainingTime, requiredFlap,
      bmax, sTotal, lendingActive, poolAddr, price, poolState,
      balance, allowance, vaultBnb, serviceFeeBps, verificationWindow
    ] = await Promise.all([
      vaultRO.S_user(addr),
      vaultRO.borrowed(addr),
      vaultRO.borrowTime(addr),
      vaultRO.remainingTime(addr),
      vaultRO.requiredFlap(addr),
      vaultRO.getBMax(addr),
      vaultRO.S_total(),
      vaultRO.isLendingActive(),
      vaultRO.getCurrentPool(),
      vaultRO.getSafePrice(),
      vaultRO.getPoolState(),
      addr !== ZeroAddress ? tokenRO.balanceOf(addr) : Promise.resolve(0n),
      addr !== ZeroAddress ? tokenRO.allowance(addr, CFG.VAULT_ADDRESS) : Promise.resolve(0n),
      readonlyProvider.getBalance(CFG.VAULT_ADDRESS),
      vaultRO.serviceFeeBps(),
      vaultRO.verificationWindow()
    ]);
    Object.assign(state, {
      sUser, borrowed, borrowTime, remainingTime, requiredFlap,
      bmax, sTotal, lendingActive, poolAddr, price, poolState: Number(poolState),
      balance, allowance, vaultBnb, serviceFeeBps, verificationWindow
    });

    // Determine price source
    try {
      const [oracle, twap] = await Promise.all([vaultRO.getOraclePrice(), vaultRO.getTwapPrice()]);
      state.priceSrc = oracle > 0n ? "Portal" : (twap > 0n ? "TWAP" : "—");
    } catch {}
  } catch (e) {
    console.warn("[refresh] failed:", e);
  }
  render();
}

function startRefresh() {
  if (refreshTimer) return;
  refresh();
  refreshTimer = setInterval(refresh, 7000);
}

/* ─────────── Render ─────────── */

function poolStateText(s) {
  // FLAP token states (rough): 0=bonding, 1=migrating, 2=antifarmer, 3=live, 255=unknown
  const map = { 0: "内盘中 Bonding", 1: "迁移中", 2: "抗机器人", 3: "已毕业 Live" };
  return map[s] || "—";
}

function render() {
  // Live stats strip
  $("stVaultBnb").textContent = fmt(state.vaultBnb);
  $("stVaultBnbSub").textContent = state.lendingActive ? "借贷已激活" : "借贷未激活";
  $("stSTotal").textContent = fmt(state.sTotal, decimals);
  $("stPrice").textContent = state.price > 0n ? fmt(state.price, 18, 6) : "—";
  $("stPriceSrc").textContent = state.priceSrc;
  $("stPool").textContent = poolStateText(state.poolState);
  $("stPoolSub").textContent = state.poolAddr && state.poolAddr !== ZeroAddress ? shortAddr(state.poolAddr) : "—";

  // Position
  $("pcStake").textContent = fmt(state.sUser, decimals);
  $("pcBorrow").textContent = fmt(state.borrowed);
  $("pcReq").textContent = fmt(state.requiredFlap, decimals);
  const remain = Number(state.remainingTime);
  $("pcTime").textContent = state.borrowTime > 0n ? fmtSeconds(remain) : "—";
  $("pcTimeSub").textContent = state.borrowTime > 0n ? "分:秒" : "秒";

  // Token balance preview for step1
  $("tokenBal").textContent = fmt(state.balance, decimals) + " " + state.symbol;
  // requiredDisplay
  const reqStr = fmt(state.requiredFlap, decimals);
  if ($("requireDisplay")) $("requireDisplay").textContent = reqStr;
  if ($("requireDisplay2")) $("requireDisplay2").textContent = reqStr;
  // repay amount
  $("repayAmount").textContent = fmt(state.borrowed);

  // Update address links
  const vaultLink = $("vaultAddr");
  if (vaultLink) {
    vaultLink.textContent = shortAddr(CFG.VAULT_ADDRESS);
    vaultLink.href = `${CFG.BSCSCAN}/address/${CFG.VAULT_ADDRESS}`;
  }
  const tokenLink = $("tokenAddr");
  if (tokenLink) {
    tokenLink.textContent = shortAddr(CFG.TOKEN_ADDRESS);
    tokenLink.href = `${CFG.BSCSCAN}/token/${CFG.TOKEN_ADDRESS}`;
  }

  renderStateMachine();
  renderCountdown();
}

/* ─────────── State machine ─────────── */

function renderStateMachine() {
  const banner = $("stateBanner");
  const sbIcon = $("sbIcon");
  const sbTitle = $("sbTitle");
  const sbDesc = $("sbDesc");
  const sbAction = $("sbAction");

  const showBanner = (kind, icon, title, desc, actionLabel, actionHandler) => {
    banner.hidden = false;
    banner.className = "state-banner " + (kind || "");
    sbIcon.textContent = icon;
    sbTitle.textContent = title;
    sbDesc.textContent = desc;
    if (actionLabel) {
      sbAction.hidden = false;
      sbAction.textContent = actionLabel;
      sbAction.onclick = actionHandler;
    } else {
      sbAction.hidden = true;
      sbAction.onclick = null;
    }
  };
  const hideBanner = () => { banner.hidden = true; };

  const wallet = window.JiebeiWallet || {};
  const connected = !!wallet.address;
  const wrongChain = connected && wallet.chainId && wallet.chainId !== CFG.CHAIN_ID;

  // Phase: no-wallet
  if (!connected) {
    showBanner("info", "🔗", "请先连接钱包",
      "连接钱包后即可查看你的借贷仓位并操作抵押、履约、还款",
      "连接钱包", () => $("walletBtn").click());
    setStep(null);
    disableAll();
    return;
  }
  if (wrongChain) {
    showBanner("err", "⚠️", "请切换到 BNB Chain",
      "蝴蝶借呗部署在 BNB Chain（chainId 56）",
      "一键切换", async () => {
        try {
          await wallet.activeProvider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: CFG.CHAIN_ID_HEX }]
          });
        } catch {}
      });
    setStep(null);
    disableAll();
    return;
  }
  if (!state.lendingActive) {
    showBanner("err", "🚧", "借贷暂未激活",
      "代币可能还在内盘 / 迁移阶段，待池子毕业 + TWAP 预热完成后借贷自动开放",
      null);
    setStep(null);
    disableAll();
    return;
  }

  hideBanner();

  // Phase determination
  const hasActive = state.borrowed > 0n;
  const inWindow = state.borrowTime > 0n;
  const timedOut = inWindow && state.remainingTime === 0n;

  if (!hasActive) {
    setStep(1);
    updateStep1Controls();
  } else if (inWindow && !timedOut) {
    setStep(2);
    updateStep2Controls();
  } else if (inWindow && timedOut) {
    showBanner("err", "🔥", "履约已超时，抵押即将被焚毁",
      "任何人都可以调用 triggerDefault 触发违约。当前仍可尝试 confirmBuy，但多半会失败。",
      null);
    setStep(2);
  } else {
    // borrowed > 0 but borrowTime == 0 → confirmed, awaiting repay
    setStep(4);
    updateStep4Controls();
  }
}

function setStep(n) {
  for (let i = 1; i <= 4; i++) {
    const card = document.querySelector(`[data-step="${i}"]`);
    if (!card) continue;
    card.classList.remove("active", "inactive", "complete");
    if (n === null) {
      card.classList.add("inactive");
      continue;
    }
    if (i === n) card.classList.add("active");
    else if (i < n) card.classList.add("complete");
    else card.classList.add("inactive");
  }
  // Special: step 3 shares card with step 2 in active state if in window
  if (n === 2) {
    const step3 = document.querySelector('[data-step="3"]');
    if (step3) { step3.classList.remove("inactive"); step3.classList.add("active"); }
  }
}

function disableAll() {
  ["approveBtn", "stakeBtn", "confirmBtn", "repayBtn"].forEach(id => {
    const el = $(id); if (el) el.disabled = true;
  });
}

/* Step 1 — stake & borrow */
function updateStep1Controls() {
  const input = $("stakeInput");
  const val = parseFloat(input.value || "0");
  const wei = val > 0 ? parseUnits(input.value || "0", decimals) : 0n;
  const approveBtn = $("approveBtn");
  const stakeBtn = $("stakeBtn");
  const hasBalance = state.balance > 0n;
  const enough = wei > 0n && wei <= state.balance;
  const allowed = wei <= state.allowance;

  // Bmax preview
  if (val > 0 && hasBalance && enough) {
    const pct = Number(wei) / Number(state.balance || 1n);
    const preview = state.bmax * wei / (state.sUser + wei || 1n);
    $("bmaxPreview").textContent = fmt(state.bmax > 0n ? preview : 0n);
  } else {
    $("bmaxPreview").textContent = hasBalance ? fmt(state.bmax) + " (持仓)" : "—";
  }

  if (wei > 0n && !allowed) {
    approveBtn.hidden = false;
    approveBtn.disabled = false;
    stakeBtn.disabled = true;
  } else {
    approveBtn.hidden = true;
    stakeBtn.disabled = !enough;
  }
}

/* Step 2 — user acts on DEX; update pancake URL */
function updateStep2Controls() {
  const pancake = `${CFG.PANCAKE_SWAP}?outputCurrency=${CFG.TOKEN_ADDRESS}&inputCurrency=BNB`;
  $("pancakeBtn").href = pancake;
  $("gmgnBtn").href = `https://www.gmgn.cc/bsc/token/${CFG.TOKEN_ADDRESS}`;

  // Confirm button enabled if user now has required flap
  const gained = state.balance; // user's current token balance; actual check is vs snapshot (contract-side)
  $("confirmBtn").disabled = false;
}

/* Step 4 — repay */
function updateStep4Controls() {
  $("repayBtn").disabled = state.borrowed === 0n;
}

/* ─────────── Countdown (local tick for smoothness) ─────────── */

let countdownRAF = null;
function renderCountdown() {
  const box = $("countdownBox");
  const val = $("countdownValue");
  const fill = $("cdBarFill");
  if (!box || !val || !fill) return;

  if (state.borrowTime === 0n) {
    box.hidden = true;
    if (countdownRAF) { cancelAnimationFrame(countdownRAF); countdownRAF = null; }
    return;
  }
  box.hidden = false;

  const deadline = Number(state.borrowTime) + Number(state.verificationWindow);
  const total = Number(state.verificationWindow);

  const tick = () => {
    const now = Math.floor(Date.now() / 1000);
    const left = Math.max(0, deadline - now);
    val.textContent = fmtSeconds(left);
    const pct = Math.max(0, Math.min(100, (left / total) * 100));
    fill.style.width = pct + "%";
    val.classList.toggle("warn", left > 0 && left < 60);

    // progress bar on position card
    const pcProg = $("pcProgress");
    const pcFill = $("pcProgressFill");
    if (pcProg && pcFill) { pcProg.hidden = false; pcFill.style.width = pct + "%"; }

    if (left > 0) {
      countdownRAF = requestAnimationFrame(() => setTimeout(tick, 500));
    } else {
      countdownRAF = null;
    }
  };
  if (countdownRAF) { cancelAnimationFrame(countdownRAF); countdownRAF = null; }
  tick();

  // PC status pill
  const pcStatus = $("pcStatus");
  if (pcStatus) {
    const left = Math.max(0, deadline - Math.floor(Date.now() / 1000));
    if (left > 0) { pcStatus.textContent = "履约中"; pcStatus.className = "pc-status active"; }
    else { pcStatus.textContent = "已超时"; pcStatus.className = "pc-status warn"; }
  }
}

/* ─────────── Write actions ─────────── */

async function ensureWritable() {
  const w = window.JiebeiWallet;
  if (!w || !w.address) { toast("请先连接钱包", "err"); return false; }
  if (w.chainId !== CFG.CHAIN_ID) {
    try {
      await w.activeProvider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CFG.CHAIN_ID_HEX }] });
    } catch { toast("请先切换到 BNB Chain", "err"); return false; }
  }
  if (!vaultRW || !tokenRW) {
    setupWriteContracts();
    await new Promise(r => setTimeout(r, 120));
  }
  return !!(vaultRW && tokenRW);
}

async function doApprove() {
  if (!(await ensureWritable())) return;
  const wei = parseUnits($("stakeInput").value || "0", decimals);
  if (wei === 0n) { toast("请输入抵押数量", "err"); return;}
  const t = toast("授权代币中，请在钱包确认…", "loading", 0);
  try {
    // Approve max to skip future approvals
    const MAX = (1n << 256n) - 1n;
    const tx = await tokenRW.approve(CFG.VAULT_ADDRESS, MAX);
    t.update("交易已提交，等待上链…", "loading");
    await tx.wait();
    t.update("授权成功 ✓", "ok");
    setTimeout(() => t.close(), 2000);
    await refresh();
  } catch (e) {
    t.update(translateError(e), "err");
    setTimeout(() => t.close(), 4500);
  }
}

async function doStakeAndBorrow() {
  if (!(await ensureWritable())) return;
  const val = $("stakeInput").value || "0";
  const wei = parseUnits(val, decimals);
  if (wei === 0n) { toast("请输入抵押数量", "err"); return; }
  if (wei > state.balance) { toast("代币余额不足", "err"); return; }
  if (wei > state.allowance) { toast("请先点授权", "err"); return; }

  const t = toast("提交抵押 & 借款，请在钱包确认…", "loading", 0);
  try {
    const tx = await vaultRW.stakeAndBorrow(wei);
    t.update("交易已提交，等待上链…", "loading");
    await tx.wait();
    t.update("抵押成功，BNB 已到账 ✓ 300 秒内完成买回", "ok", 6000);
    $("stakeInput").value = "";
    await refresh();
  } catch (e) {
    t.update(translateError(e), "err");
    setTimeout(() => t.close(), 5000);
  }
}

async function doConfirmBuy() {
  if (!(await ensureWritable())) return;
  const t = toast("确认履约中，请在钱包确认…", "loading", 0);
  try {
    const tx = await vaultRW.confirmBuy();
    t.update("交易已提交，等待上链…", "loading");
    await tx.wait();
    t.update("履约成功 ✓ 可随时还款解锁抵押", "ok", 5000);
    await refresh();
  } catch (e) {
    t.update(translateError(e), "err");
    setTimeout(() => t.close(), 5000);
  }
}

async function doRepay() {
  if (!(await ensureWritable())) return;
  const amount = state.borrowed;
  if (amount === 0n) { toast("无借款", "err"); return; }
  const t = toast(`还款 ${fmt(amount)} BNB 中，请在钱包确认…`, "loading", 0);
  try {
    const tx = await vaultRW.repayAndUnstake({ value: amount });
    t.update("交易已提交，等待上链…", "loading");
    await tx.wait();
    t.update("还款成功 ✓ 抵押已返回钱包", "ok", 5000);
    await refresh();
  } catch (e) {
    t.update(translateError(e), "err");
    setTimeout(() => t.close(), 5000);
  }
}

/* ─────────── Event wiring ─────────── */

function wireEvents() {
  $("approveBtn")?.addEventListener("click", doApprove);
  $("stakeBtn")?.addEventListener("click", doStakeAndBorrow);
  $("confirmBtn")?.addEventListener("click", doConfirmBuy);
  $("repayBtn")?.addEventListener("click", doRepay);

  $("stakeInput")?.addEventListener("input", updateStep1Controls);
  $("maxBtn")?.addEventListener("click", () => {
    if (state.balance === 0n) return;
    $("stakeInput").value = formatUnits(state.balance, decimals);
    updateStep1Controls();
  });

  window.addEventListener("wallet-change", (e) => {
    userAddress = (e.detail && e.detail.address) || null;
    chainOk = userAddress && (!e.detail.chainId || Number(e.detail.chainId) === CFG.CHAIN_ID);
    setupWriteContracts();
    refresh();
  });
}

/* ─────────── Boot ─────────── */

(async function boot() {
  wireEvents();
  await initReadonly();

  // Pick up any existing wallet state
  const w = window.JiebeiWallet;
  if (w && w.address) {
    userAddress = w.address;
    setupWriteContracts();
  }
  startRefresh();
})();
