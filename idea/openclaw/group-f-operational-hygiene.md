# Group F: Operational Hygiene

> System-level cleanliness: what skills load, how old sessions are trimmed, and what lifecycle hooks fire.

---

## F.1 Skills Allowlist

Each loaded skill adds tokens to every request. Per-agent allowlists replace (not merge with) the defaults, so you can zero-out a skill list entirely.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],  // Shared baseline
    },
    list: [
      { id: "coder",   skills: ["github", "shell"] },  // Replace defaults entirely
      { id: "writer",  skills: ["web-search"] },
      { id: "monitor", skills: [] },                    // No skills — bare agent
    ],
  },
}
```

---

## F.2 Session Maintenance (Disk Hygiene)

Prevents unbounded growth of `sessions.json` and transcript `.jsonl` files, which slow down tail reads and context rebuilds over time.

```json5
{
  session: {
    maintenance: {
      mode: "trim",         // Automatically prune old sessions
      maxTranscripts: 50,   // Keep at most 50 transcript files per agent
      maxAge: "90d",        // Delete sessions older than 90 days
    },
  },
}
```

---

## F.3 Lifecycle Hooks

Hooks are scripts that fire on Gateway lifecycle events — useful for side effects that shouldn't live inside the agent prompt.

| Event | Primary Use Case |
|---|---|
| `session:compact:before` | Write critical state to disk before compaction |
| `agent:bootstrap` | Validate or patch workspace files before injection |
| `command:new` / `command:reset` | Clear stale memory on session restart |
| `message:preprocessed` | Filter or reshape inbound content before the agent sees it |

```json5
// Enable a built-in hook via CLI (not openclaw.json)
// openclaw hooks enable session-memory
// openclaw hooks list
```

```bash
# Enable a built-in hook
openclaw hooks enable session-memory

# List all available hooks
openclaw hooks list
```
