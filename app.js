/* ═══════════════════════════════════════════════════════════════════
   蝴蝶借呗 DApp — on-chain reads + writes via ethers v6
   ═══════════════════════════════════════════════════════════════════ */

import { BrowserProvider, Contract, Interface, formatEther, parseEther, formatUnits, parseUnits, ZeroAddress } from "ethers";

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
  if (/below minimum borrow|最小借款/i.test(msg)) return "借款额低于 0.01 BNB 门槛，请增加抵押数量";
  if (/missing revert data/i.test(msg)) return "交易被合约拒绝（常见原因：抵押太少导致借款低于 0.01 BNB 门槛；或金库余额不足）";
  if (/could not coalesce|COALESCE/i.test(msg)) return "钱包返回的错误无法解析。请刷新页面重试或换钱包";
  if (/intrinsic gas too low|gas required exceeds/i.test(msg)) return "Gas 不够，请重试一次";
  if (/exceeds block gas limit/i.test(msg)) return "钱包 RPC 拒绝（gas 超出节点单笔上限）。请换 RPC 节点或刷新重试";
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
  balance: 0n, allowance: 0n, symbol: "蝴蝶借呗", serviceFeeBps: 300n, verificationWindow: 300n,
  reserves: null, token0: null,
  hardFloor: 0n, safetyReserveBps: 2000n, kBps: 8000n, singleCapBps: 1000n, collateralCapBps: 3000n
};

// Mirror of contract MIN_BORROW_BNB (0.01 BNB) + BPS
const MIN_BORROW_WEI = 10_000_000_000_000_000n; // 0.01 ether
const BPS = 10000n;

let routerRW = null;

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
  if (!w || !w.activeProvider || !w.address) { vaultRW = tokenRW = routerRW = null; ethersProvider = null; return; }
  ethersProvider = new BrowserProvider(w.activeProvider, CFG.CHAIN_ID);
  ethersProvider.getSigner().then(signer => {
    vaultRW = new Contract(CFG.VAULT_ADDRESS, ABI.VAULT, signer);
    tokenRW = new Contract(CFG.TOKEN_ADDRESS, ABI.ERC20, signer);
    routerRW = new Contract(CFG.PANCAKE_ROUTER, ABI.ROUTER, signer);
  }).catch(() => { vaultRW = tokenRW = routerRW = null; });
}

/* ─────────── Refresh loop ─────────── */

async function refresh() {
  if (!vaultRO || !tokenRO) return;
  const addr = userAddress || ZeroAddress;
  try {
    const [
      sUser, borrowed, borrowTime, remainingTime, requiredFlap,
      bmax, sTotal, lendingActive, poolAddr, price, poolState,
      balance, allowance, vaultBnb, serviceFeeBps, verificationWindow,
      hardFloor, safetyReserveBps, kBps, singleCapBps, collateralCapBps
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
      vaultRO.verificationWindow(),
      vaultRO.hardFloorBnb(),
      vaultRO.safetyReserveBps(),
      vaultRO.kBps(),
      vaultRO.singleCapBps(),
      vaultRO.collateralCapBps()
    ]);
    Object.assign(state, {
      sUser, borrowed, borrowTime, remainingTime, requiredFlap,
      bmax, sTotal, lendingActive, poolAddr, price, poolState: Number(poolState),
      balance, allowance, vaultBnb, serviceFeeBps, verificationWindow,
      hardFloor, safetyReserveBps, kBps, singleCapBps, collateralCapBps
    });

    // Determine price source
    try {
      const [oracle, twap] = await Promise.all([vaultRO.getOraclePrice(), vaultRO.getTwapPrice()]);
      state.priceSrc = oracle > 0n ? "Portal" : (twap > 0n ? "TWAP" : "—");
    } catch {}

    // Read pair reserves for local swap amount-out calc
    if (poolAddr && poolAddr !== ZeroAddress) {
      try {
        const pairRO = new Contract(poolAddr, ABI.PAIR, readonlyProvider);
        const [r, t0] = await Promise.all([pairRO.getReserves(), pairRO.token0()]);
        state.reserves = [r[0], r[1]];
        state.token0 = t0;
      } catch { state.reserves = null; }
    } else {
      state.reserves = null;
    }
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
  renderCards();
}

/* ─────────── Step/Position card visibility (state-driven) ─────────── */

function renderCards() {
  const wallet = window.JiebeiWallet || {};
  const connected = !!wallet.address;
  const cid = wallet.chainId != null ? Number(wallet.chainId) : null;
  const wrongChain = connected && cid != null && cid !== CFG.CHAIN_ID;
  const lendingOff = !state.lendingActive;

  const hasLoan = state.borrowed > 0n;
  const inWindow = state.borrowTime > 0n;
  const timedOut = inWindow && state.remainingTime === 0n;

  const show = (sel, ok) => {
    const el = typeof sel === "string" ? document.querySelector(sel) : sel;
    if (el) el.hidden = !ok;
  };

  // Hide everything if blocker is active
  const blocked = !connected || wrongChain || lendingOff;

  show("#positionCard", connected && !wrongChain && (hasLoan || inWindow));
  show('[data-step="1"]', !blocked && !hasLoan);
  show('[data-step="2"]', !blocked && inWindow);
  show('[data-step="3"]', !blocked && inWindow);
  show('[data-step="4"]', !blocked && hasLoan && !inWindow);
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
  const cid = wallet.chainId != null ? Number(wallet.chainId) : null;
  const wrongChain = connected && cid != null && cid !== CFG.CHAIN_ID;

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
  // Visibility is handled by renderCards() via [hidden]; here we just
  // stamp an `active` class on the relevant card(s) for the gold scan line.
  for (let i = 1; i <= 4; i++) {
    const card = document.querySelector(`[data-step="${i}"]`);
    if (!card) continue;
    card.classList.remove("active", "inactive", "complete");
    if (n === i || (n === 2 && i === 3)) card.classList.add("active");
  }
}

function disableAll() {
  ["approveBtn", "stakeBtn", "confirmBtn", "repayBtn"].forEach(id => {
    const el = $(id); if (el) el.disabled = true;
  });
}

/* ─────────── Projected B_max (local mirror of _computeBMax) ─────────── */

function projectBMax(extraStakeWei) {
  if (state.vaultBnb <= state.hardFloor) return 0n;
  const effectiveVault = state.vaultBnb - state.hardFloor;
  const sUserNew = state.sUser + extraStakeWei;
  if (sUserNew === 0n) return 0n;
  const sTotalNew = state.sTotal + extraStakeWei;
  if (sTotalNew === 0n) return 0n;

  const tAvail = (effectiveVault * (BPS - state.safetyReserveBps)) / BPS;
  const relCap = (tAvail * sUserNew * state.kBps) / (sTotalNew * BPS);
  const absCap = (effectiveVault * state.singleCapBps) / BPS;
  if (state.price === 0n) return 0n;
  const collateralValue = (sUserNew * state.price) / 1_000_000_000_000_000_000n;
  const collateralCap = (collateralValue * state.collateralCapBps) / BPS;

  let m = relCap < absCap ? relCap : absCap;
  if (collateralCap < m) m = collateralCap;
  return m;
}

// Reverse-solve the minimum stake needed so that bmax >= MIN_BORROW_WEI.
// The three caps are independent lower bounds — so we need stake that
// satisfies ALL three. Typically collateralCap is the binding constraint
// (since the token is cheap). Returns stake in wei (18 decimals).
function minStakeForMinBorrow() {
  if (state.price === 0n) return 0n;
  // collateralCap >= MIN_BORROW → sUser * price * collateralCapBps / (1e18 * BPS) >= MIN_BORROW
  //   → sUser >= MIN_BORROW * 1e18 * BPS / (price * collateralCapBps)
  const ONE = 1_000_000_000_000_000_000n;
  const byCollateral = (MIN_BORROW_WEI * ONE * BPS + state.price * state.collateralCapBps - 1n) / (state.price * state.collateralCapBps);
  // Add a small safety margin (+2%)
  return (byCollateral * 102n) / 100n - state.sUser > 0n ? (byCollateral * 102n) / 100n - state.sUser : 0n;
}

/* Step 1 — stake & borrow */
function updateStep1Controls() {
  const input = $("stakeInput");
  const approveBtn = $("approveBtn");
  const stakeBtn = $("stakeBtn");
  const preview = $("bmaxPreview");
  let wei = 0n;
  try { wei = parseUnits(input.value || "0", decimals); } catch { wei = 0n; }

  const hasBalance = state.balance > 0n;
  const enoughBal = wei > 0n && wei <= state.balance;
  const allowed = wei <= state.allowance;

  // Projected borrow if this stake goes through
  const projected = wei > 0n ? projectBMax(wei) : (state.sUser > 0n ? state.bmax : 0n);

  // Under min-borrow floor?
  const underMin = wei > 0n && projected < MIN_BORROW_WEI;

  // Display preview text
  if (wei > 0n && enoughBal) {
    preview.textContent = fmt(projected) + " BNB";
    preview.classList.toggle("warn", underMin);
    if (underMin) {
      const needExtra = minStakeForMinBorrow();
      const hintEl = document.querySelector(".input-meta .min-hint") || (() => {
        const s = document.createElement("span");
        s.className = "min-hint";
        s.style.cssText = "display:block;color:var(--danger);font-size:11px;margin-top:4px;";
        document.querySelector(".input-meta").appendChild(s);
        return s;
      })();
      if (needExtra > 0n) {
        hintEl.textContent = `⚠ 借款额小于 0.01 BNB 门槛，至少再抵押约 ${fmt(needExtra, decimals, 0)} ${state.symbol}`;
      } else {
        hintEl.textContent = `⚠ 借款额小于 0.01 BNB 门槛`;
      }
    } else {
      const h = document.querySelector(".input-meta .min-hint");
      if (h) h.remove();
    }
  } else {
    preview.textContent = state.sUser > 0n ? fmt(state.bmax) + " BNB（当前仓位）" : "—";
    preview.classList.remove("warn");
    const h = document.querySelector(".input-meta .min-hint");
    if (h) h.remove();
  }

  // Button states
  if (wei > 0n && !allowed && enoughBal && !underMin) {
    approveBtn.hidden = false;
    approveBtn.disabled = false;
    stakeBtn.disabled = true;
  } else {
    approveBtn.hidden = true;
    stakeBtn.disabled = !(enoughBal && allowed && !underMin);
  }
}

/* Step 2 — inline quick swap + external DEX links */
function updateStep2Controls() {
  const pancake = `${CFG.PANCAKE_SWAP}?outputCurrency=${CFG.TOKEN_ADDRESS}&inputCurrency=BNB`;
  if ($("pancakeBtn")) $("pancakeBtn").href = pancake;
  if ($("gmgnBtn"))    $("gmgnBtn").href = `https://www.gmgn.cc/bsc/token/${CFG.TOKEN_ADDRESS}`;
  if ($("aveBtn"))     $("aveBtn").href = `https://ave.ai/token/${CFG.TOKEN_ADDRESS}-bsc`;
  if ($("okxBtn"))     $("okxBtn").href = `https://www.okx.com/web3/dex-swap#inputChain=56&inputCurrency=BNB&outputCurrency=${CFG.TOKEN_ADDRESS}`;

  prefillSwapBnb();
  updateSwapPreview();

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

/* ─────────── UX helpers ─────────── */

const IS_MOBILE_VP = () => matchMedia("(max-width: 760px)").matches;

function scrollToActiveStep() {
  requestAnimationFrame(() => {
    const first = document.querySelector('.step-card:not([hidden])');
    if (first) {
      const y = first.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    }
  });
}

function scrollToElement(id, offset = 80) {
  const el = $(id);
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
}

/* ─────────── Quick-swap math (PancakeSwap V2 + 3% buy-tax on token) ─────────── */

// amountOut = (amountIn * 9975 * reserveOut) / (reserveIn * 10000 + amountIn * 9975)
function getAmountOut(amountIn, reserveIn, reserveOut) {
  if (!amountIn || !reserveIn || !reserveOut) return 0n;
  const amountInWithFee = amountIn * 9975n;
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn * 10000n + amountInWithFee;
  return denominator === 0n ? 0n : numerator / denominator;
}

function estimateFlapOut(bnbWei) {
  if (!state.reserves || !state.token0 || bnbWei <= 0n) return null;
  const flapIsToken0 = state.token0.toLowerCase() === CFG.TOKEN_ADDRESS.toLowerCase();
  const reserveBnb  = flapIsToken0 ? state.reserves[1] : state.reserves[0];
  const reserveFlap = flapIsToken0 ? state.reserves[0] : state.reserves[1];
  if (reserveBnb === 0n || reserveFlap === 0n) return null;
  const gross = getAmountOut(bnbWei, reserveBnb, reserveFlap);
  // Token has 3% buy-tax on DEX swaps; user receives 97%
  return (gross * 97n) / 100n;
}

function updateSwapPreview() {
  const input = $("swapBnb");
  const out = $("expectedFlap");
  const req = $("swapRequired");
  const check = $("swapCheck");
  const reqLabel = $("requireDisplay3");
  if (!input || !out || !req || !check) return;

  const val = parseFloat(input.value || "0");
  let net = null;
  try { if (val > 0) net = estimateFlapOut(parseUnits(input.value || "0", 18)); } catch {}

  out.textContent = net ? fmt(net, decimals) : "—";
  if (reqLabel) reqLabel.textContent = fmt(state.requiredFlap, decimals);

  req.classList.remove("ok", "short");
  if (!net || state.requiredFlap === 0n) {
    check.textContent = "—";
  } else if (net >= state.requiredFlap) {
    check.textContent = "✓ 充足";
    req.classList.add("ok");
  } else {
    check.textContent = "✗ 不足，请增加 BNB";
    req.classList.add("short");
  }
}

function prefillSwapBnb() {
  const input = $("swapBnb");
  if (!input) return;
  if (input.value && parseFloat(input.value) > 0) return;
  // Recommend borrow × 1.5 (ample buffer to pass requiredFlap)
  if (state.borrowed > 0n) {
    const recommended = (state.borrowed * 150n) / 100n;
    input.value = formatUnits(recommended, 18);
    updateSwapPreview();
  }
}

/* ─────────── Write actions ─────────── */

async function getLiveChainId() {
  const w = window.JiebeiWallet;
  if (!w || !w.activeProvider) return null;
  try {
    const raw = await w.activeProvider.request({ method: "eth_chainId" });
    const n = window.JiebeiNormalizeChainId ? window.JiebeiNormalizeChainId(raw) : Number(raw);
    if (Number.isFinite(n)) { w.chainId = n; return n; }
  } catch {}
  return w.chainId != null ? Number(w.chainId) : null;
}

/* ─────────── Raw eth_sendTransaction helper ───────────
   Completely bypasses the ethers Contract wrapper's tx flow.
   Fixes the recurring 'could not coalesce error' on TP wallet, where
   ethers v6's populate/send pipeline can't parse TP's error envelope.
   We only use ethers for ABI-encoding (pure local computation). */

let _routerIface = null;
function routerIface() {
  if (!_routerIface) _routerIface = new Interface(ABI.ROUTER);
  return _routerIface;
}

async function sendTx({ to, data, value = 0n, gasLimit }) {
  const w = window.JiebeiWallet;
  if (!w || !w.activeProvider || !w.address) throw new Error("请先连接钱包");

  const params = {
    from: w.address,
    to,
    data,
    gas: "0x" + BigInt(gasLimit).toString(16)
  };
  if (value > 0n) params.value = "0x" + BigInt(value).toString(16);

  const hash = await w.activeProvider.request({
    method: "eth_sendTransaction",
    params: [params]
  });

  return {
    hash,
    async wait() {
      // Poll public RPC for receipt (read-only, not the wallet provider)
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 2000));
        try {
          const receipt = await readonlyProvider.getTransactionReceipt(hash);
          if (receipt) {
            const ok = receipt.status === 1 || receipt.status === 1n || String(receipt.status) === "1";
            if (ok) return receipt;
            throw new Error("交易上链失败（合约 revert）");
          }
        } catch (e) {
          if (e && e.message && e.message.includes("交易上链失败")) throw e;
          // transient RPC error, keep polling
        }
      }
      throw new Error("交易长时间未上链，请到 BscScan 查看: " + hash);
    }
  };
}

async function ensureWritable() {
  const w = window.JiebeiWallet;
  if (!w || !w.address) { toast("请先连接钱包", "err"); return false; }

  // Live-fetch chainId — never trust the cached value for the switch decision.
  // Fixes phantom "wrong chain" on wallets that return numeric chainId.
  const live = await getLiveChainId();
  if (live !== CFG.CHAIN_ID) {
    const t = toast("正在切换到 BNB Chain…", "loading", 0);
    try {
      await w.activeProvider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: CFG.CHAIN_ID_HEX }]
      });
      // Verify it actually switched
      const after = await getLiveChainId();
      if (after !== CFG.CHAIN_ID) {
        t.update("请在钱包里手动切到 BNB Chain 再重试", "err", 4000);
        return false;
      }
      t.update("已切到 BNB Chain ✓", "ok", 1500);
    } catch (e) {
      t.update("切换被取消或失败", "err", 3500);
      return false;
    }
  }

  if (!vaultRW || !tokenRW) {
    setupWriteContracts();
    await new Promise(r => setTimeout(r, 150));
  }
  return !!(vaultRW && tokenRW);
}

async function doApprove() {
  if (!(await ensureWritable())) return;
  const wei = parseUnits($("stakeInput").value || "0", decimals);
  if (wei === 0n) { toast("请输入抵押数量", "err"); return;}
  const t = toast("授权代币中，请在钱包确认…", "loading", 0);
  try {
    const MAX = (1n << 256n) - 1n;
    const data = tokenRO.interface.encodeFunctionData("approve", [CFG.VAULT_ADDRESS, MAX]);
    const tx = await sendTx({ to: CFG.TOKEN_ADDRESS, data, gasLimit: 200_000n });
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
    const data = vaultRO.interface.encodeFunctionData("stakeAndBorrow", [wei]);
    // 50M = the magic ceiling: BSC public RPCs cap single-tx gas around here
    // and the historical actual usage was 49,955,376 (99.91% of 50M). Setting
    // 60M tripped the node's 'exceeds block gas limit' guard.
    const tx = await sendTx({ to: CFG.VAULT_ADDRESS, data, gasLimit: 50_000_000n });
    t.update("交易已提交，等待上链…", "loading");
    await tx.wait();
    t.update("抵押成功，BNB 已到账 ✓ 300 秒内完成买回", "ok", 6000);
    $("stakeInput").value = "";
    await refresh();
    if (IS_MOBILE_VP()) scrollToActiveStep();
  } catch (e) {
    t.update(translateError(e), "err");
    setTimeout(() => t.close(), 5000);
  }
}

async function doConfirmBuy() {
  if (!(await ensureWritable())) return;
  const t = toast("确认履约中，请在钱包确认…", "loading", 0);
  try {
    const data = vaultRO.interface.encodeFunctionData("confirmBuy", []);
    const tx = await sendTx({ to: CFG.VAULT_ADDRESS, data, gasLimit: 1_500_000n });
    t.update("交易已提交，等待上链…", "loading");
    await tx.wait();
    t.update("履约成功 ✓ 可随时还款解锁抵押", "ok", 5000);
    await refresh();
    if (IS_MOBILE_VP()) scrollToActiveStep();
  } catch (e) {
    t.update(translateError(e), "err");
    setTimeout(() => t.close(), 5000);
  }
}

async function doQuickSwap() {
  if (!(await ensureWritable())) return;
  const input = $("swapBnb");
  const errBox = $("swapErr");
  errBox.hidden = true; errBox.textContent = "";
  const raw = input.value || "0";
  let valWei;
  try { valWei = parseUnits(raw, 18); } catch { toast("请输入有效 BNB 数量", "err"); return; }
  if (valWei <= 0n) { toast("请输入 BNB 数量", "err"); return; }

  const t = toast("提交 swap 中，请在钱包确认…", "loading", 0);
  try {
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);
    const path = [CFG.WBNB, CFG.TOKEN_ADDRESS];
    // amountOutMin: 0 (we already pre-fill with 1.5× buffer; router's FOT variant tolerates slippage)
    const data = routerIface().encodeFunctionData(
      "swapExactETHForTokensSupportingFeeOnTransferTokens",
      [0n, path, window.JiebeiWallet.address, deadline]
    );
    const tx = await sendTx({ to: CFG.PANCAKE_ROUTER, data, value: valWei, gasLimit: 1_200_000n });
    t.update("交易已提交，等待上链…", "loading");
    await tx.wait();
    t.update("代币到账 ✓ 滚动到下方确认履约", "ok", 4500);
    await refresh();
    // Auto-scroll to Step 3 confirm button — this is the whole point of the feature
    setTimeout(() => scrollToElement("step3", 70), 300);
  } catch (e) {
    const msg = translateError(e);
    errBox.textContent = msg;
    errBox.hidden = false;
    t.update(msg, "err");
    setTimeout(() => t.close(), 5000);
  }
}

async function doRepay() {
  if (!(await ensureWritable())) return;
  const amount = state.borrowed;
  if (amount === 0n) { toast("无借款", "err"); return; }
  const t = toast(`还款 ${fmt(amount)} BNB 中，请在钱包确认…`, "loading", 0);
  try {
    const data = vaultRO.interface.encodeFunctionData("repayAndUnstake", []);
    const tx = await sendTx({ to: CFG.VAULT_ADDRESS, data, value: amount, gasLimit: 1_500_000n });
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
  $("quickSwapBtn")?.addEventListener("click", doQuickSwap);

  $("stakeInput")?.addEventListener("input", updateStep1Controls);
  $("maxBtn")?.addEventListener("click", () => {
    if (state.balance === 0n) return;
    $("stakeInput").value = formatUnits(state.balance, decimals);
    updateStep1Controls();
  });

  $("swapBnb")?.addEventListener("input", updateSwapPreview);

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
