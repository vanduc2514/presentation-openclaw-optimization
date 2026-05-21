# Group C: Model Selection & Routing

> Determines which model handles which task — and what happens when the primary is unavailable.

---

## C.1 Prompt Caching (`cacheRetention`)

OpenClaw exposes provider-level prompt caching as a first-class config key. Avoids re-processing the same system prompt on every turn.

```json5
{
  agents: {
    defaults: {
      params: {
        cacheRetention: "long",   // none | short | long
      },
    },
  },
}
```

Override per model or per agent:
```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: {
            cacheRetention: "short",
          },
        },
      },
    },
    list: [
      {
        id: "alerts",
        params: {
          cacheRetention: "none",    // Disable for agents where prompts vary every run
        },
      },
    ],
  },
}
```

**Config merge order:** `agents.defaults.params` → `agents.defaults.models[model].params` → `agents.list[].params`

---

## C.2 Model Failover Chain

Define a primary model with an ordered fallback chain. OpenClaw rotates automatically on rate-limit, overload, or unavailability errors.

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: [
          "anthropic/claude-sonnet-4-6",   // Step down on Opus overload
          "openai/gpt-oss-120b",            // Cheap capable fallback
          "google/gemini-2.5-flash",        // Last resort / free-tier-eligible
        ],
      },
    },
  },
}
```

**Selection source policy:**
- Configured defaults and cron primaries: walk the full fallback chain
- Explicit `/model` commands: strict — no fallback (preserves user intent)
- Auto fallback overrides: persisted with `modelOverrideSource: "auto"`

---

## C.3 Per-Agent Thinking & Reasoning

Control extended thinking and reasoning visibility at the agent level — useful for differentiating a deep-research agent from a fast triage agent.

```json5
{
  agents: {
    list: [
      {
        id: "researcher",
        model: "anthropic/claude-opus-4-6",
        thinkingDefault: "high",      // Extended thinking, high budget
        reasoningDefault: "on",       // Show reasoning trace in output
        fastModeDefault: false,
        params: { cacheRetention: "long" },
      },
      {
        id: "triage",
        model: "google/gemini-2.5-flash",
        thinkingDefault: "off",
        reasoningDefault: "off",
        fastModeDefault: true,
        params: { cacheRetention: "short" },
      },
    ],
  },
}
```

---

## C.4 Multi-Agent Routing

Run multiple specialized agents in one Gateway — each with its own workspace, model, and session store. Route by binding channel accounts to specific agents.

```json5
{
  agents: {
    list: [
      {
        id: "planner",
        model: { primary: "anthropic/claude-opus-4-6" },
        thinkingDefault: "high",
        workspace: "~/.openclaw/workspace-planner",
      },
      {
        id: "coder",
        model: { primary: "anthropic/claude-sonnet-4-6" },
        thinkingDefault: "medium",
        workspace: "~/.openclaw/workspace-coder",
        skills: ["github", "shell"],
      },
      {
        id: "triage",
        model: "google/gemini-2.5-flash",
        thinkingDefault: "off",
        heartbeat: { every: "15m", lightContext: true, isolatedSession: true },
        workspace: "~/.openclaw/workspace-triage",
      },
    ],
  },
}
```

Each agent gets its own workspace files, session store, and auth profiles — no state leaks between agents.
