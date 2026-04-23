/* ═══════════════════════════════════════════════════════════════════
   蝴蝶借呗 · Deployed Contracts Config
   ═══════════════════════════════════════════════════════════════════ */

window.JIEBEI_CONFIG = {
  CHAIN_ID: 56,
  CHAIN_ID_HEX: "0x38",
  RPC: "https://bsc-dataseed.binance.org/",

  FACTORY_ADDRESS: "0x30AcfA75fcbDF797eA0893fE449CA2A578B28913",
  TOKEN_ADDRESS:   "0x1471139ddc39d6779a42b77ce765eb924dd67777",
  VAULT_ADDRESS:   "0x98f67e88750cEA078747cEd9805A434888c8CF35",

  BSCSCAN: "https://bscscan.com",
  PANCAKE_SWAP: "https://pancakeswap.finance/swap",
  DEXSCREENER: "https://dexscreener.com/bsc",
  PANCAKE_ROUTER: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
  WBNB: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",

  WC_PROJECT_ID: "60a3c0371938c4ab07c61622fdc14e0e"
};

/* ───────── ABIs (minimal subset, ethers v6 fragment strings) ───────── */
window.JIEBEI_ABI = {
  VAULT: [
    // Reads (user state)
    "function S_user(address) view returns (uint256)",
    "function borrowed(address) view returns (uint256)",
    "function borrowTime(address) view returns (uint256)",
    "function remainingTime(address) view returns (uint256)",
    "function requiredFlap(address) view returns (uint256)",
    "function snapshotBnb(address) view returns (uint256)",
    "function snapshotFlap(address) view returns (uint256)",
    // Reads (global)
    "function S_total() view returns (uint256)",
    "function totalOutstanding() view returns (uint256)",
    "function verificationWindow() view returns (uint256)",
    "function hardFloorBnb() view returns (uint256)",
    "function serviceFeeBps() view returns (uint256)",
    "function getBMax(address) view returns (uint256)",
    "function getR() view returns (uint256)",
    "function getTAvailable() view returns (uint256)",
    "function isLendingActive() view returns (bool)",
    "function getPoolState() view returns (uint8)",
    "function getCurrentPool() view returns (address)",
    "function getOraclePrice() view returns (uint256)",
    "function getTwapPrice() view returns (uint256)",
    "function getSafePrice() view returns (uint256)",
    "function getPendingCount() view returns (uint256)",
    "function canTriggerDefault(address) view returns (bool)",
    "function flap() view returns (address)",
    // Writes
    "function stakeAndBorrow(uint256 stakeAmount) external",
    "function confirmBuy() external",
    "function repayAndUnstake() external payable",
    "function triggerDefault(address user) external"
  ],
  ERC20: [
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function totalSupply() view returns (uint256)"
  ],
  PAIR: [
    "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
    "function token0() view returns (address)",
    "function token1() view returns (address)"
  ],
  ROUTER: [
    "function swapExactETHForTokensSupportingFeeOnTransferTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline) external payable"
  ]
};
