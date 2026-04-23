# 蝴蝶借呗 官网 · Butterfly Jiebei Landing Site

纯静态站点（HTML + CSS + JS），无构建步骤，直接浏览器打开即可预览。

## 文件结构

```
site/
├── index.html   主页面（nav / hero / 机制 / 代币 / 升级对比 / 安全 / 路线图 / CTA / 页脚）
├── styles.css   视觉系统（深红 + 铬银 + 金色毛笔字 + 全息色 · 电路栅格 + 扫描线）
├── script.js    交互（i18n 中英切换 / 滚动揭示 / 数字滚动 / 3D 视差 logo / 蝴蝶粒子）
├── logo.png     ⚠️ 需手动放入（即代币 logo 图）
└── README.md
```

## 上线前必做

1. ✅ Logo 已放入 `logo.png`（当前 8.3MB，**强烈建议压缩到 ≤ 500KB**）：
   - 在线压缩：[tinypng.com](https://tinypng.com) 或 [squoosh.app](https://squoosh.app)
   - 建议导出 1024×1024 的 WebP / 压缩 PNG
2. 链接状态：
   - ✅ Factory 合约地址 → 已填入 BSC mainnet 实际部署地址
   - ✅ BscScan verify 链接 → 已可用
   - 🟡 买入代币 → 默认 PancakeSwap 首页，发币后替换为具体 pair URL
   - 🟡 进入 App / 审计报告 / GitHub / TG / X 等仍是 `#` 占位

## 已部署合约

| 网络 | Factory V2 地址 |
|---|---|
| BSC mainnet | [`0x30AcfA75fcbDF797eA0893fE449CA2A578B28913`](https://bscscan.com/address/0x30AcfA75fcbDF797eA0893fE449CA2A578B28913#code) |

Hero 区已嵌入"FACTORY 地址 pill"，点击即可复制地址到剪贴板，旁边 BscScan 链接可点跳转。

## 本地预览

任何静态 HTTP server 即可，例如：

```bash
# Python
python -m http.server 8080 -d site

# Node
npx serve site
```

或者双击 `site/index.html` 直接在浏览器打开。

## 视觉差异化设计（vs 蝴蝶白条）

| 维度 | 白条 V1 | 借呗 V2（本站）|
|---|---|---|
| 色系 | 紫 / 粉 / 蓝 霓虹 | **深红 + 铬银 + 金** + 全息点缀 |
| 氛围 | 毛玻璃 · 柔光 · 圆角 | **直角 · 蓝图栅格 · 扫描线** |
| 字体 | Space Grotesk + Inter | + **Ma Shan Zheng 毛笔字**（蝴蝶借呗标题）+ JetBrains Mono |
| 动效 | 脉冲 · hover 放大 | **全息光环旋转 · 3D 鼠标视差 · 数字滚动 · 蝴蝶粒子 · 金色扫光** |

## 动效清单

- Logo 全息 conic-gradient 光环旋转
- Hero logo 鼠标跟随 3D 倾斜 + 滚动视差淡出
- Hero 元素分层 fadeUp 入场
- 数字 tile 进入视口 count-up 滚动
- Tokenomics 进度条进入视口流畅填充 + shimmer 流光
- 金色主按钮间歇 shine 扫光
- 每个 step card / sec card / road item 进入视口时 reveal
- 路线图"进行中"节点脉冲呼吸
- 违约示例 burnPulse 红光扩散
- 背景电路栅格缓慢漂移 + CRT 扫描线 + 全息色团浮动
- 环境蝴蝶粒子缓升（极淡）
- ASCII banner 首次访问打字机效果

## 响应式

断点 900px / 540px，移动端自动折叠为 2 列或 1 列，对比表变纵向卡片，nav 链接隐藏。
