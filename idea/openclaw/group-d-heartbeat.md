# Group D: Heartbeat & Background Scheduling

> Proactive scheduled runs are the single biggest hidden cost driver. Every option here reduces that cost while preserving utility.

---

## D.1 Heartbeat Config

The default heartbeat fires every 30 minutes, sends the **full conversation history**, and loads all workspace files. These flags can be combined freely.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "55m",              // Interval ("0m" disables entirely)
        target: "none",            // "none" = internal state only, no user message
        lightContext: true,        // Only inject HEARTBEAT.md — skip all other workspace files
        isolatedSession: true,     // Fresh session per run (drops ~100K history tokens → ~2–5K)
        skipWhenBusy: true,        // Defer if a subagent or nested lane is already running
        activeHours: {             // Only fire during defined hours (local time)
          start: "08:00",
          end: "22:00",
        },
        model: "ollama/llama3.2:1b",  // Free local model for routine heartbeat checks
      },
    },
  },
}
```

| Flag | Default | Effect |
|---|---|---|
| `lightContext: true` | false | Cuts workspace injection to HEARTBEAT.md only |
| `isolatedSession: true` | false | Fresh session per run — history tokens drop from ~100K to ~2–5K |
| `skipWhenBusy: true` | false | Skips the run if another lane is active |
| `activeHours` | always | Prevents off-hours runs |
| `model` | agent default | Use a cheap/local model for the heartbeat turn |

---

## D.2 HEARTBEAT.md — Structured Task Scheduling

Use the `tasks:` block in `HEARTBEAT.md` to make heartbeats task-conditional. OpenClaw skips the LLM call entirely when no tasks are due (`reason=no-tasks-due` in the log).

```markdown
<!-- HEARTBEAT.md -->
tasks:
  - id: inbox-check
    interval: 1h
    prompt: "Check inbox. Flag urgent items. Reply HEARTBEAT_OK if none."
  - id: memory-consolidate
    interval: 12h
    prompt: "Summarize recent memory/*.md entries into MEMORY.md. Prune duplicates."
  - id: weekly-review
    interval: 7d
    prompt: "Generate weekly review from memory files. Write to memory/weekly-YYYY-MM-DD.md."
```

This is the sharpest cost lever: a heartbeat with no due tasks costs zero tokens.
