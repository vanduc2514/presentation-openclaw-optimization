# Group B: Memory & State Persistence

> Keeps important knowledge durable across sessions, compactions, and restarts.

---

## B.1 Pre-Compaction Memory Flush

The most important compaction knob. Runs a **silent agent turn** to write durable state to disk *before* context is summarized. Prevents critical context from being lost.

```json5
{
  agents: {
    defaults: {
      compaction: {
        reserveTokensFloor: 40000,
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b",               // Free local model — this is a write-only task
          softThresholdTokens: 4000,
          systemPrompt: "Session nearing compaction. Store durable state now.",
          prompt: "Write lasting notes to memory/YYYY-MM-DD.md. Reply NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

> Requires v2026.2.23+ for compaction bug fixes.

---

## B.2 Memory Search Quality

OpenClaw's built-in SQLite memory engine supports hybrid search (FTS5 keyword + vector embeddings). Hybrid mode produces significantly better recall than keyword-only.

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",   // Auto-detected if API key present
        // For fully local setup:
        // provider: "local",
        // local: { modelPath: "~/.node-llama-cpp/models/nomic-embed-text-v1.5.Q4_K_M.gguf" }
      },
    },
  },
}
```

| Provider | Auto-detected | Notes |
|---|---|---|
| `openai` | Yes | Default: `text-embedding-3-small` |
| `gemini` | Yes | Supports multimodal (image + audio) |
| `ollama` | No | Local, set explicitly |
| `local` | Yes (first) | Requires optional `node-llama-cpp` runtime |

Memory files indexed: `MEMORY.md` and all `memory/*.md`.
Chunking: ~400 tokens per chunk with 80-token overlap.
Index: `~/.openclaw/memory/<agentId>.sqlite`

---

## B.3 Context Engine Plugin (Lossless Recall)

The default `legacy` engine handles compaction and context assembly. Swap it for a plugin engine when you need lossless cross-session recall.

```json5
{
  plugins: {
    slots: {
      contextEngine: "lossless-claw",
    },
    entries: {
      "lossless-claw": {
        enabled: true,
      },
    },
  },
}
```

Install: `openclaw plugins install @martian-engineering/lossless-claw`

The engine participates at four lifecycle points: **Ingest** → **Assemble** → **Compact** → **After turn**.
