# truanayangi

Vietnamese lunch case-opening parody. 36 meals, budget and vegetarian filters, original CS:GO sound assets, Google Maps search for the chosen meal. No payments or backend records.

## Timing reference

The archived CS:GO Panorama client exposes a 2.3 s case-model lead-in plus 0.1 s scroll preparation, a 6 s scroll, cubic-bezier(0.075, 0.82, 0.165, 1), 38 decorative tiles, 42 fixed tick timestamps, and integer landing offsets from 10–90% of the winning tile. The web implementation uses a compositor-driven rightward animation. It rebases the strip while preserving the exact visible cards and their positions, without a case overlay.

References:
- https://github.com/Desynci/CSGO_Panorama_Code.pbin/blob/main/panorama/scripts/popups/popup_capability_decodable.js
- https://github.com/Desynci/CSGO_Panorama_Code.pbin/blob/main/panorama/styles/popups/popup_capability_decodable.css
- https://www.csgo.com.cn/news/gamebroad/20170911/206155.html

The 625:125:25:5:2 rarity weights reproduce the published standard weapon-case tier ratio. Items within a tier have equal probability. Filters remove unavailable tiers and renormalize the remaining weights. The winner is selected before animation; decorative cards never determine the result. Decorative neighbors avoid immediate repeats to reduce high-speed visual aliasing.

Rarity follows approximate VND price/person: blue ≤40k, purple ≤65k, pink ≤100k, red ≤130k, gold >130k.

This is a browser adaptation, not Valve's engine or backend. The case overlay is intentionally omitted. Food art, filtered pools and meal outcomes are intentionally different. Reduced-motion mode keeps timing but suppresses reel motion.

## Assets

Food sheets and warehouse background: generated for this project.
CS:GO SFX: Valve assets mirrored at https://github.com/sourcesounds/csgo/tree/master/sound/ui
Case image: Steam economy image referenced by https://github.com/ByMykel/CSGO-API

## Development

```bash
npm install
npm run dev
npm run build
npm run preview
```

The default Vite config targets Cloudflare Workers. The existing GitHub Pages-style build remains available with:

```bash
npm run dev:pages
npm run build:pages
npm run preview:pages
```

## Deploy to Cloudflare Workers

The app is configured as a React SPA using the Cloudflare Vite plugin and Workers Static Assets.

Authenticate Wrangler once, then build and deploy:

```bash
npx wrangler login
npm run deploy
```

`npm run build` produces the Cloudflare deployment output in `dist/`, including the generated Wrangler configuration. `npm run deploy` builds first and then deploys that output to the `truanayangi` Worker.

The frontend continues to use the counter endpoint from `counter/public-config.json`. To override it for a deployment, set `NEXT_PUBLIC_COUNTER_API_URL` at build time.
