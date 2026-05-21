# Group A: Context Budget Control

> Controls what goes into the model context on each turn and how aggressively old content is removed.

---

## A.1 Context Injection Control

Controls **when** workspace bootstrap files (SOUL.md, AGENTS.md, etc.) are injected into the system prompt. The default is `"always"` — which means every continuation turn pays the full bootstrap token cost.

```json5
// openclaw.json
{
  agents: {
    defaults: {
      contextInjection: "continuation-skip",  // Skip re-injection on safe continuation turns
      bootstrapMaxChars: 12000,               // Per-file char cap (prevents one bloated file from exploding context)
      bootstrapTotalMaxChars: 60000,          // Total chars across all bootstrap files
    },
  },
}
```

| Value | Behavior |
|---|---|
| `"always"` (default) | Re-inject workspace files on every turn |
| `"continuation-skip"` | Skip re-injection on safe continuation turns; still rebuilds on heartbeat and post-compaction |
| `"never"` | Disable workspace bootstrap entirely |

**Impact:** On a 20-turn session with a 10,000-token workspace, `continuation-skip` eliminates re-injection cost for ~18 of those turns.

---

## A.2 Context Pruning (`contextPruning`)

Long sessions accumulate tool outputs (file reads, shell results, web pages) that inflate the context window but have already been processed. Pruning removes them in-memory before each LLM call without touching the on-disk transcript.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl",   // After cache TTL expires, soft-trim old tool results
        ttl: "1h",
      },
    },
  },
}
```

**How pruning works:**
1. Wait for TTL to expire
2. **Soft-trim** oversized results — keep head and tail, insert `...`
3. **Hard-clear** the rest — replace with a placeholder
4. Reset TTL so follow-up requests reuse the fresh cache

> Auto-enabled for Anthropic profiles. For other providers, must be set explicitly.

---

## A.3 Compaction Controls

Compaction is auto-triggered when context nears the model's window limit. These knobs control *when* and *how* it runs.

```json5
{
  agents: {
    defaults: {
      compaction: {
        model: "openrouter/anthropic/claude-sonnet-4-6",  // Cheaper model for summarization
        reserveTokensFloor: 40000,    // Minimum headroom before compaction fires
        keepRecentTokens: 8000,       // Tail kept intact on manual /compact

        // Proactive compaction before transcript grows too large:
        maxActiveTranscriptBytes: "20mb",
        truncateAfterCompaction: true,  // New successor JSONL instead of rewriting in-place

        // Mid-turn precheck — after tool results, before next model call:
        midTurnPrecheck: {
          enabled: true,
        },
      },
    },
  },
}
```

- `truncateAfterCompaction: true` creates a clean successor transcript; the old full transcript is archived, not deleted
- `maxActiveTranscriptBytes` guards against local transcript bloat (only active when `truncateAfterCompaction` is also enabled)
- `midTurnPrecheck` catches context overflow mid-tool-loop before it forces an emergency compaction
