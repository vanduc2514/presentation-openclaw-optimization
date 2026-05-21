# OpenClaw Optimization

**Make Your AI Agent Cheaper, Faster, and Smarter** — using only `openclaw.json`.

A 25-minute talk for developers and product managers who run OpenClaw and want to cut AI agent costs by 60–80% with zero code changes.

## Background

OpenClaw is free and open-source, but the underlying LLM API calls are not. A typical developer running Claude Opus 4.6 can easily spend $200–$325 per month — most of it on hidden overhead: conversation history re-sent on every turn, workspace files reloaded constantly, and background heartbeat checks firing every 30 minutes around the clock.

This talk walks through 8 high-impact configurations across 4 groups:

| Group | Focus | Configs Covered |
|---|---|---|
| A | Context Budget | contextInjection, contextPruning |
| B | Memory & State | memoryFlush, memorySearch |
| C | Model Routing | cacheRetention, model fallbacks |
| D | Heartbeat | heartbeat tuning, HEARTBEAT.md task scheduling |

Every configuration includes a plain-English explanation for non-technical audiences plus a ready-to-use JSON snippet.

## Build

```sh
npm install
npm run build      # → output/index.html
npm run preview    # open in browser
```

Requires Node.js 20. If you use [mise](https://mise.jdx.dev/), run `mise install` first.

## Project Structure

```
slides/
  presentation.md     # slide source — edit this
  images/             # images referenced in slides
build.cjs             # build script — customize theming here
ideas/
  openclaw/           # per-group research and reference configs
  OpenClaw-Optimization-General-Research.md
package.json
mise.toml
.github/
  workflows/
    deploy-pages.yml  # auto-deploy to GitHub Pages on push to main
.agents/
  skills/             # AI agent skills for writing and styling slides
```

## Customizing

### Colors, fonts, and layout

All theming (color palette, fonts, slide positioning, CSS variables) is done in `build.cjs`.

See [`.agents/skills/markpress-styling/SKILL.md`](.agents/skills/markpress-styling/SKILL.md) for the full reference.

## GitHub Pages

The included workflow (`deploy-pages.yml`) builds and deploys on every push to `main`.

Enable GitHub Pages in your repository:
- **Settings** → **Pages** → **Source**: `GitHub Actions`

## Writing Slides

Slides are written in `slides/presentation.md` and separated by `------` (six dashes).

See [`.agents/skills/markpress-content/SKILL.md`](.agents/skills/markpress-content/SKILL.md) for the full guide.
