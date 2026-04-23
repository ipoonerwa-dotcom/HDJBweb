# Butterfly Jiebei — Landing Site

Official landing page for **Butterfly Jiebei (蝴蝶借呗)**, the next-generation, audit-hardened upgrade of Butterfly Baitiao.

Pure static site — plain HTML + CSS + JS, no build step. Drop it on any static host.

## File Layout

```
butterfly-jiebei-site/
├── index.html    Single-page markup (nav · hero · mechanism · tokenomics · upgrade · security · roadmap · cta · footer)
├── styles.css    Red / chrome / gold + holographic palette, circuit grid, scanlines, animations
├── script.js     i18n (zh/en), scroll-reveal, 3D logo tilt, counter, WalletConnect v2 + injected wallet
├── logo.png      Token logo (used for nav, hero, footer, favicon, wallet metadata)
└── README.md
```

## Features

- **Bilingual** — zh/en toggle with `localStorage` persistence
- **Wallet connect** — injected wallet (MetaMask / OKX / TP) with WalletConnect v2 fallback, BSC chain auto-switch, sticky reconnect
- **Deployed Factory pill** — click to copy, direct BscScan verified link
- **Animations** — scroll reveal, holographic halo, 3D mouse tilt, number count-up, progress bar shimmer, keeper-style particles
- **Accessibility** — respects `prefers-reduced-motion`, semantic landmarks
- **Responsive** — fluid layout down to 540px

## Deployed Contract

| Network       | Factory V2 Address                                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| BSC mainnet   | [`0x30AcfA75fcbDF797eA0893fE449CA2A578B28913`](https://bscscan.com/address/0x30AcfA75fcbDF797eA0893fE449CA2A578B28913#code)           |

The hero area renders a copy-to-clipboard pill for the factory address with a direct BscScan link.

## Local Preview

Open any static server from the project root:

```bash
# Python
python -m http.server 8080

# Node
npx serve .
```

Or simply double-click `index.html` — the site runs fine from `file://`, though WalletConnect's QR modal is served over HTTPS so please host it for wallet testing.

## Wallet Integration

- **Project ID** (WalletConnect / Reown): `60a3c0371938c4ab07c61622fdc14e0e`
- Connection flow:
  1. If a browser-injected wallet is present, request accounts directly.
  2. Otherwise open the WalletConnect v2 QR modal (lazy-loaded via `esm.sh`).
  3. Auto-switch to BNB Chain (chainId `56`); add the chain if the wallet doesn't know it yet.
- Session is persisted across reloads via `localStorage` (`wallet-kind`).
- Clicking the connected address opens a menu: copy address · view on BscScan · disconnect.

## Pre-Deploy Checklist

- [x] Logo placed at `logo.png` (optimised, well under 1 MB)
- [x] Factory address wired to BscScan verified source
- [ ] Replace `#` placeholders in footer (audit report, GitHub, socials)
- [ ] Swap the "Buy Token" button URL to the concrete pool URL once the token graduates
- [ ] Hook the "Enter App" buttons up once the DApp ships (currently rendered with a `SOON` badge)

## Deployment

### GitHub Pages (zero-config)

`Settings → Pages → Deploy from a branch → main / root` — live in a minute at `https://<user>.github.io/<repo>/`.

### Vercel / Netlify

Import the repo as a static project — auto-detected, no config needed. Optional: add a custom domain and enable HTTPS.

## Stack Notes

- No bundler, no framework. One HTML file, one CSS file, one JS file.
- WalletConnect provider is dynamically imported only when the user clicks *Connect Wallet*, keeping the first paint small.
- Fonts are loaded from Google Fonts: `Space Grotesk` · `Inter` · `Noto Sans SC` · `JetBrains Mono` · `Ma Shan Zheng` (brush-stroke for the "蝴蝶借呗" title).

## License

MIT. Butterfly motif, token ticker, and branding belong to the project team.
