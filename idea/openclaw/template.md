# Consolidated Template & Quick Reference

**Source:** Official OpenClaw Documentation (docs.openclaw.ai) | **Date:** May 2026

> Copy this template as a starting point, then remove sections you don't need.

---

## Consolidated `openclaw.json` Template

```json5
// ~/.openclaw/openclaw.json — Optimized production config
{
  agents: {
    defaults: {
      // --- Group A: Context Budget ---
      contextInjection: "continuation-skip",
      bootstrapMaxChars: 12000,
      bootstrapTotalMaxChars: 60000,
      contextPruning: { mode: "cache-ttl", ttl: "1h" },

      // --- Group C: Model Chain ---
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["openai/gpt-oss-120b", "google/gemini-2.5-flash"],
      },
      params: { cacheRetention: "long" },

      // --- Group D: Heartbeat ---
      heartbeat: {
        every: "55m",
        target: "none",
        lightContext: true,
        isolatedSession: true,
        skipWhenBusy: true,
        activeHours: { start: "08:00", end: "22:00" },
        model: "google/gemini-2.5-flash",
      },

      // --- Group A + B: Compaction ---
      compaction: {
        model: "anthropic/claude-sonnet-4-6",
        reserveTokensFloor: 40000,
        keepRecentTokens: 8000,
        maxActiveTranscriptBytes: "20mb",
        truncateAfterCompaction: true,
        midTurnPrecheck: { enabled: true },
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b",
          softThresholdTokens: 4000,
          systemPrompt: "Session nearing compaction. Persist durable state now.",
          prompt: "Write lasting notes to memory/YYYY-MM-DD.md. Reply NO_REPLY if nothing to store.",
        },
      },

      // --- Group B: Memory Search ---
      memorySearch: { provider: "openai" },

      // --- Group F: Skills ---
      skills: ["github", "weather"],
    },
  },

  // --- Group F: Session Disk ---
  session: {
    maintenance: { mode: "trim", maxTranscripts: 50, maxAge: "90d" },
  },
}
```

---

## Quick Reference Table

| Config Key | Group | Reduces Cost | Improves Quality | Doc Page |
|---|---|---|---|---|
| `contextInjection: "continuation-skip"` | A | Yes | — | config-agents |
| `bootstrapMaxChars` + `bootstrapTotalMaxChars` | A | Yes | — | config-agents |
| `contextPruning.mode: "cache-ttl"` | A | Yes | — | session-pruning |
| `compaction.reserveTokensFloor` | A | Yes | — | compaction |
| `compaction.maxActiveTranscriptBytes` | A | Yes | — | compaction |
| `compaction.midTurnPrecheck` | A | — | Yes | compaction |
| `compaction.memoryFlush` | B | — | Yes | session-management-compaction |
| `memorySearch.provider` (hybrid) | B | — | Yes | memory-builtin |
| Context engine plugin (`lossless-claw`) | B | — | Yes | context-engine |
| `params.cacheRetention: "long"` | C | Yes | Yes | prompt-caching |
| `model.fallbacks` chain | C | — | Yes | model-failover |
| `thinkingDefault` / `reasoningDefault` | C | — | Yes | config-agents |
| Multi-agent routing | C | Yes | Yes | multi-agent |
| `heartbeat.lightContext: true` | D | Yes | — | heartbeat |
| `heartbeat.isolatedSession: true` | D | Yes | — | heartbeat |
| `heartbeat.model` (cheap model) | D | Yes | — | heartbeat |
| HEARTBEAT.md `tasks:` block | D | Yes | — | heartbeat |
| SOUL.md persona + format rules | E | — | Yes | soul-format |
| AGENTS.md standing orders | E | — | Yes | standing-orders |
| `agents.list[].skills` allowlist | F | Yes | Yes | config-agents |
| `session.maintenance` | F | Yes | — | session-management-compaction |
| Hooks (`session:compact:before`) | F | — | Yes | hooks |
