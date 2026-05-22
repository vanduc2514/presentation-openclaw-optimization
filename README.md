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
npm run build      # → output/index.html (Vietnamese, default) and output/index.en.html (English)
npm run preview    # open in browser
```
