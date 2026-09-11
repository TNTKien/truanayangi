# Trưa Nay Ăn Gì 🍜

[Tiếng Việt](README.md) · **English**

**Official website: [truanayangi.com](https://truanayangi.com/)**

Can't decide what to eat for lunch? Open a case, spin for a dish, and add a little surprise to your day.

This is the community version that runs on your computer, with no login or backend required. Filter dishes, add your own meal lists, and save your preferences in your browser.

## Run locally

You need **Node.js 22.12+** and the **pnpm** version specified in [package.json](package.json).

```sh
git clone https://github.com/truanayangi-com/truanayangi.git
cd truanayangi
pnpm install --frozen-lockfile
pnpm start
```

Open [127.0.0.1:5173](http://127.0.0.1:5173). No `.env` file or external service setup is needed. If the port is busy, run `pnpm start --port 5188`.

Development commands:

```sh
pnpm test       # Run checks
pnpm build      # Create a build
pnpm preview    # Preview at http://127.0.0.1:4173
```

The servers bind to `127.0.0.1` only. Once dependencies are installed, the app loads its assets locally; external links open only when you click them.

## Your data

Preferences, meal lists, and spin counts are saved automatically in cookies in your current browser. Clearing cookies resets this data; it does not sync across devices. The displayed spin count belongs to this browser only.

If cookies are blocked or a meal list is too large, the app will let you know it could not save.

## GitHub Pages and the official website

GitHub Pages only redirects to https://truanayangi.com/. This keeps functionality consistent: visitors always use the same production frontend, API, and same-origin login cookie instead of a second static app that can drift or lose authentication on refresh. Publish only `pages-redirect/` to `gh-pages`; do not deploy the local build there. Shared static UI and reel-motion fixes should be updated in both this repository and the private production frontend.

## Contributing

Everyone is welcome to [report bugs, suggest ideas](https://github.com/truanayangi-com/truanayangi/issues/new), or fork the repo and [submit a PR to `main`](https://github.com/truanayangi-com/truanayangi/compare). Use Vietnamese or English, and feel free to open a draft PR for discussion. No approved issue or organization membership is required.

Describe your change and how you checked it. For code changes, run tests and a build when possible; maintainers can help and will review before merging. Keep secrets out of the repo and credit the sources you use.

## Credits

This repository was transferred from `nagisanzenin/truanayangi`, preserving its Git history and community contributions. See [author and asset attribution](ATTRIBUTION.md).

[GitHub Pages](https://truanayangi-com.github.io/truanayangi/) redirects to the official website. Only `pages-redirect/` is published to `gh-pages`; the application source in this repo is for local use.
