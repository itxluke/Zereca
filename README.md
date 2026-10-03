# Zereca — The Institution

Zereca's cinematic website. The entrance offers Cinema and Basic experiences, with the approved obsidian chamber and metallic Zereca emblem.

Built with React, Vinext, GSAP, Lenis and React Three Fiber. Fonts and production artwork are served locally.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm build
```

The public domain remains a separate deployment step. This repository contains the website source and production assets; private design studies are omitted.

## Cloudflare deployment

For the existing `zereca-cinema` Worker, connect `itxluke/Zereca`, use `main` as the production branch, and build from the repository root.

Build command:

```sh
pnpm run build
```

Deploy command:

```sh
pnpm exec wrangler deploy --config dist/server/wrangler.json --name zereca-cinema
```

Confirm that the build's commit matches the current `main` revision. After deployment, `/release.json` must report `selection-entrance-2026-10-03`; this identifies the release containing the obsidian chamber selection page.
