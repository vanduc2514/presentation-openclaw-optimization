<!--markpress-opt
{
  "autoSplit": false,
  "sanitize": false,
  "title": "OpenClaw Optimization"
}
markpress-opt-->

<!--slide-attr x=0 y=0 scale=1.2 -->

# OpenClaw Optimization
## The Secret to Making Your AI Agent Cheaper, Faster, and Smarter

By changing `openclaw.json`

<!-- SPEAKER NOTES
Welcome everyone. Today we are talking about a practical, hands-on topic: how to optimize an AI agent running on OpenClaw so it costs less, runs faster, and stays reliable.

No theory, no hand-waving. By the end you will have a ready-to-paste openclaw.json config that delivers real savings.

Introduce yourself briefly. Mention your experience running OpenClaw in production.
-->

------

<!--slide-attr x=2000 y=-150 rotate=-2 scale=1.0 -->

# The Agent Has a Spending Problem

- Every message **re-sends all previous messages**
- Background checks fire every **30 minutes by default**
- Workspace files reload on **every single turn**

> OpenClaw defaults are designed to keep things working well under ideal cost conditions.

<!-- SPEAKER NOTES
This is the root cause of almost every surprise bill.

The agent does not just process your latest message — it re-processes the entire conversation history each time. On top of that, a background heartbeat fires every 30 minutes, even at 3am when no one is using it.

Ask the audience: "Has anyone been surprised by their API bill this month?" Usually a few hands.

This is not a bug — it is how LLMs work. But OpenClaw gives you knobs to control it.
-->

------

<!--slide-attr x=4000 y=150 rotate=2 scale=1.0 -->

# What This Actually Costs

> **Cost** = **Token count** x **Model price**

| Model | Estimated Monthly Cost |
|---|---|
| Claude Opus 4.6 | ~$325 / month |
| Claude Sonnet 4.6 | ~$188 / month |
| Gemini 2.5 Flash | ~$24 / month |
| GPT-OSS-120B | ~$2 / month |

**Most of that is overhead, not actual work.**

<!-- SPEAKER NOTES
These numbers come from real usage patterns measured for a typical daily developer workflow.

The heartbeat alone — those background checks — accounts for roughly $30 to $100 per month on flagship models.

The good news: nearly all of this overhead is configurable. You can realistically cut costs by 60 to 80 percent with the settings we will cover today, without sacrificing quality.

Point to the GPT-OSS-120B row — this is what smart routing and optimization can bring you down to.
-->

------

<!--slide-attr x=6000 y=-100 rotate=-1 scale=1.1 -->

# Master `openclaw.json`

> Changing default values in this file can **cut costs by 60-80%**.

```json
{
  "agents": {
    "defaults": {
      "..."
    }
  }
}
```

<!-- SPEAKER NOTES
This is the key message: everything we are about to discuss lives in one JSON file on your machine.

No code changes, no redeployment, no complicated infrastructure. You edit one file and restart OpenClaw.

We will cover 8 configurations across 4 groups. At the end I will show you the complete combined config you can copy-paste directly.
-->

------

<!--slide-attr x=6000 y=1800 rotate=3 scale=1.0 -->

# Context Optimization

> What exactly gets loaded into the AI's memory on each task?

Every character in your context increases token usage.

These settings let you control the **size of that context payload**.

<!-- SPEAKER NOTES
Think of each AI turn as sending a package. This group controls what goes inside that package.

By default, OpenClaw stuffs in all your workspace files every single time. We can change that.

Two key settings here: skip re-injection on follow-up turns, and prune old tool results after a timeout.
-->

------

<!--slide-attr x=4000 y=1650 rotate=-2 scale=1.0 -->

# Reduce Context Repetition

> By default, old context gets repeated on each new task.

```json
{
  "contextInjection": "continuation-skip",
  "bootstrapMaxChars": 12000,
  "bootstrapTotalMaxChars": 60000
}
```

In a 20-turn session: by around turn 18, repeated context no longer gets re-injected.

[agents.defaults.contextInjection](https://docs.openclaw.ai/gateway/config-agents#agents-defaults-contextinjection)

<!-- SPEAKER NOTES
contextInjection controls when workspace bootstrap files — SOUL.md, AGENTS.md, and friends — get injected into the system prompt.

The default value is "always", meaning every single continuation turn pays the full bootstrap token cost.

"continuation-skip" is the setting you want. It skips re-injection on safe follow-up turns and still rebuilds on heartbeats and post-compaction — so nothing important is lost.

The char caps are guardrails: if someone accidentally writes a massive AGENTS.md, it won't blow up your context budget.

Impact is dramatic: on a typical 20-turn conversation with 10,000 tokens of workspace files, you eliminate re-injection on roughly 18 of those 20 turns.
-->

------

<!--slide-attr x=2000 y=1950 rotate=2 scale=1.0 -->

# Clean Up Tool Outputs

> Once a tool run is done, do not keep its output around for too long.

```json
{
  "contextPruning": {
    "mode": "cache-ttl",
    "ttl": "1h"
  }
}
```

Removes prior tool inputs/outputs from context to reduce wasted tokens.

[agents.defaults.contextPruning](https://docs.openclaw.ai/gateway/config-agents#agents-defaults-contextpruning)

<!-- SPEAKER NOTES
When the agent reads a file, browses the web, or runs a shell command, the full output gets stored in the conversation history.

After a while — especially in long sessions — those results are stale. You have already processed them. But they still take up space in every subsequent API call.

contextPruning removes them in-memory before each LLM call. It does not touch your on-disk transcript, so nothing is permanently lost.

The process: wait for TTL to expire, soft-trim oversized results (keep head and tail, insert "..."), then hard-clear the rest with a placeholder.

With a 1h TTL, any tool result older than an hour gets cleaned up automatically.
-->

------

<!--slide-attr x=0 y=1800 rotate=-3 scale=1.0 -->

# Memory Optimization

> What can the agent remember across work sessions?

**Without good memory:**
- The AI forgets what it was taught when work starts.
- The AI must rediscover and retry, increasing token usage and request count.

**With good memory:**
- The AI recalls what it learned before starting work.

<!-- SPEAKER NOTES
This group is about making sure what matters gets preserved.

Two critical scenarios: what happens when the context window fills up and gets summarized (compaction), and how the agent finds things it has stored in memory.
-->

------

<!--slide-attr x=0 y=3600 rotate=2 scale=1.0 -->

# Save Memory Before Context Fills Up

> Save critical information before summarizing the current context.

```json
{
  "compaction": {
    "memoryFlush": {
      "enabled": true,
      "model": "ollama/qwen3:8b",
      "prompt": "Write lasting notes to memory/YYYY-MM-DD.md. Reply NO_REPLY if nothing to store."
    }
  }
}
```

Use a **free local model** here to keep this cost as low as possible.

[compaction.memoryFlush](https://docs.openclaw.ai/concepts/compaction#memory-flush)

<!-- SPEAKER NOTES
Compaction happens automatically when the context window gets close to the limit. OpenClaw summarizes everything into a condensed form and continues.

The problem: critical details can get lost in that summarization. Important decisions, open tasks, current project state — gone.

memoryFlush fires a silent agent turn right before compaction. Its only job is to write durable notes to a file on disk.

The brilliant part: you can point this at a free local model like Qwen 3 8B running on Ollama. This is a pure write task — it does not need to be smart, just reliable. Zero API cost.

Requires OpenClaw v2026.2.23 or later for the compaction bug fixes.
-->

------

<!--slide-attr x=2000 y=3450 rotate=-2 scale=1.0 -->

# Smarter Memory Recall

> The difference between `Ctrl+F` and a librarian who understands context.

```json
{
  "memorySearch": {
    "provider": "openai"
  }
}
```

Enables **hybrid search**: keyword matching + semantic search (vector similarity).

Allows natural-language search so the AI can retrieve information more accurately.

[agents.defaults.memorySearch](https://docs.openclaw.ai/concepts/memory-search)

<!-- SPEAKER NOTES
OpenClaw has a built-in SQLite memory engine. By default it uses FTS5 keyword search — fast but literal.

With a provider configured, you get hybrid search: FTS5 for exact matches plus vector embeddings for semantic similarity.

Practical example: you stored a note about "API rate limits" three months ago. You later ask about "why requests are being throttled". Keyword search misses it. Hybrid search finds it.

The embedding model used is text-embedding-3-small by default — very cheap, about $0.00002 per 1,000 tokens.

This setting auto-detects your API key. If you already have OpenAI configured, it just works.
-->

------

<!--slide-attr x=4000 y=3750 rotate=3 scale=1.0 -->

# Optimize LLM Routing

> Use the AI's "brain" more efficiently.

<!-- SPEAKER NOTES
The key insight: you are probably using one expensive flagship model for everything, including simple background checks that a cheap or free model could handle perfectly well.

Two settings here: fallback for reliability and prompt caching to reduce repeated token cost.
-->

------

<!--slide-attr x=6000 y=5400 rotate=2 scale=1.0 -->

# Always Have a Backup

> If your first-choice restaurant is full, you already have a ranked list of backups.

```json
{
  "model": {
    "primary": "anthropic/claude-opus-4-6",
    "fallbacks": [
      "anthropic/claude-sonnet-4-6",
      "google/gemini-2.5-flash"
    ]
  }
}
```

Auto-rotates on rate-limit, overload, or unavailability errors.

[agents.defaults.model.fallbacks](https://docs.openclaw.ai/concepts/model-failover#model-fallback)

<!-- SPEAKER NOTES
This serves two purposes: reliability and cost.

For reliability: when a flagship model is overloaded — which happens at peak hours — OpenClaw falls back to the next model in the chain automatically. No error, no interruption, no manual intervention.

For cost: put cheaper models at the bottom of the fallback chain. Off-peak background tasks that end up on a fallback model cost significantly less than the primary.

Important nuance: this applies to configured defaults. If the user explicitly chooses a model with /model command, no fallback is applied — that preserves user intent.

Auto fallback is tracked with modelOverrideSource "auto" so you can see in the logs which model actually ran.
-->

------

<!--slide-attr x=6000 y=3600 rotate=-2 scale=1.0 -->

# Cache the System Prompt

> A teacher reads the class rules once, not before every student question.

```json
{
  "params": {
    "cacheRetention": "long"
  }
}
```

- **Faster token generation** because repeated tokens do not need to be recomputed.
- **Up to 90% cost reduction** for cached tokens on Anthropic.

Works per-model and per-agent. Three levels: `none`, `short`, `long` depending on how long you want to retain cached tokens.

[agents.defaults.params.cacheRetention](https://docs.openclaw.ai/gateway/config-agents#agents-defaults-params-cacheretention)

<!-- SPEAKER NOTES
Prompt caching is a provider-level feature that OpenClaw exposes as a first-class config key.

When you set cacheRetention to "long", OpenClaw tells the provider to keep your system prompt in a cache. Subsequent turns that share the same prefix pay a fraction of the normal input token price.

Anthropic offers up to 90% discount on cached tokens. On a 10,000-token system prompt that gets re-sent 50 times a day, this is significant savings.

You can override this per-model or per-agent. For example, disable it for agents where the system prompt varies on every run.
-->

------

<!--slide-attr x=4000 y=5250 rotate=-3 scale=1.0 -->

# Optimize Periodic Tasks

> What does the agent do when no one is talking to it?

By default: every 30 minutes the AI "wakes up" to run tasks in HEARTBEAT.md, even when there is nothing to do.

<!-- SPEAKER NOTES
This is the single biggest hidden cost driver in most OpenClaw setups.

Every heartbeat loads all workspace files and the full conversation history. On a flagship model, that heartbeat alone can cost $30 to $100 per month.

Two settings here: tune the heartbeat to be much lighter, and add a task list so the agent can skip the LLM call entirely when there is nothing to do.
-->

------

<!--slide-attr x=2000 y=5550 rotate=2 scale=1.0 -->

# Optimize Agent Heartbeat

> **Cost** = **Heartbeat frequency** x (**Token count** x **Model price**)

```json
{
  "heartbeat": {
    "every": "55m",
    "lightContext": true,
    "isolatedSession": true,
    "skipWhenBusy": true,
    "activeHours": { "start": "08:00", "end": "22:00" },
    "model": "ollama/llama3.2:1b"
  }
}
```

`isolatedSession: true` alone: **~100K tokens -> ~2-5K tokens per run.**

[agents.defaults.heartbeat](https://docs.openclaw.ai/gateway/config-agents#agents-defaults-heartbeat)

<!-- SPEAKER NOTES
Let me walk through each flag:

every "55m": slightly less frequent than the 30-minute default. Keeps cache warm without burning tokens.

lightContext: true — instead of loading all workspace files, only HEARTBEAT.md is injected. If your workspace is 10,000 tokens, this cuts heartbeat context by 90%.

isolatedSession: true — each heartbeat run starts as a fresh session instead of loading the full conversation history. This is the biggest win: drops from roughly 100,000 history tokens to 2,000 to 5,000 tokens per run.

skipWhenBusy: true — if another agent lane is already running, skip this heartbeat. No doubling up.

activeHours — only fire during these hours. No off-hours charges at all.

model pointing to a free local Ollama model: routine heartbeat checks do not need a frontier model.

Combined, these settings can reduce heartbeat costs by over 95%.
-->

------

<!--slide-attr x=0 y=5400 rotate=-2 scale=1.0 -->

# Pay Only When There Is Work

> A checklist that tells the agent: "Nothing to do today, go back to sleep."

In `HEARTBEAT.md`:

```yaml
tasks:
  - id: inbox-check
    interval: 1h
    prompt: "Check inbox. Reply HEARTBEAT_OK if nothing urgent."
  - id: memory-consolidate
    interval: 12h
    prompt: "Summarize memory files into MEMORY.md."
  - id: weekly-review
    interval: 7d
    prompt: "Write weekly review to memory/weekly-YYYY-MM-DD.md."
```

**Zero token cost** when no tasks are due.

[HEARTBEAT.md tasks blocks](https://docs.openclaw.ai/gateway/heartbeat#tasks-blocks)

<!-- SPEAKER NOTES
This is the sharpest cost lever in the entire heartbeat system.

When you add a tasks: block to HEARTBEAT.md, OpenClaw evaluates the task schedule before making any LLM call. If no tasks are due, it logs reason=no-tasks-due and skips entirely.

Think about what that means: a heartbeat that fires every 55 minutes but has no tasks due for the next several hours costs zero tokens. Nothing. You are not charged at all.

The tasks: block lets you schedule exactly when each check should run — hourly, every 12 hours, weekly. Only the tasks that are actually due trigger an LLM call.

Combined with D.1, you go from heartbeat costing $30-$100/month to a few dollars or even less.
-->

------

<!--slide-attr x=0 y=7200 rotate=3 scale=0.9 -->

# Optimized `openclaw.json`

Command: `"Update my openclaw.json with this configuration"`

```jsonc
{
  "agents": {
    "defaults": {
      "contextInjection": "continuation-skip",
      "bootstrapMaxChars": 12000,
      "bootstrapTotalMaxChars": 60000,
      "contextPruning": { "mode": "cache-ttl", "ttl": "1h" },

      "model": {
        "primary": "anthropic/claude-sonnet-4-6",
        "fallbacks": ["openai/gpt-oss-120b", "google/gemini-2.5-flash"]
      },
      "params": { "cacheRetention": "long" },

      "heartbeat": {
        "every": "55m", "lightContext": true,
        "isolatedSession": true, "skipWhenBusy": true,
        "activeHours": { "start": "08:00", "end": "22:00" },
        "model": "ollama/llama3.2:1b"
      },

      "compaction": {
        "memoryFlush": {
          "enabled": true,
          "model": "ollama/qwen3:8b",
          "prompt": "Write lasting notes to memory/YYYY-MM-DD.md. Reply NO_REPLY if nothing to store."
        }
      },
      "memorySearch": { "provider": "openai" }
    }
  }
}
```

<!-- SPEAKER NOTES
Here is the complete config with context, memory, model routing, and heartbeat in one place.

Paste it directly into your agent chat and ask it to update `openclaw.json` for you.
-->

------

<!--slide-attr x=4000 y=7350 rotate=2 scale=0.92 -->

# Steps To Optimize Effectively

> Do not optimize before the cost pain appears, and prioritize high-impact changes first.

<div style="display:flex; gap:16px; align-items:stretch; margin: 12px 0 4px;">
  <div style="flex:1; text-align:center;">
    <img src="images/optimization-loop.png" alt="Optimization loop: Observe, Evaluate, Improve, Measure" style="height: 220px; width: 100%; object-fit: contain;" />
    <p><strong>Continuous optimization loop</strong></p>
  </div>
  <div style="flex:1; text-align:center;">
    <img src="images/optimization-priority.png" alt="Top-down optimization priorities" style="height: 220px; width: 100%; object-fit: contain;" />
    <p><strong>Implementation priority order</strong></p>
  </div>
</div>

- **Observe:** Check model cost and work quality before optimization.
- **Evaluate:** Evaluate which task is consuming the most budget from logs.
- **Improve:** Change configuration, then repeat observe and evaluate.
- **Measure:** Measure cost reduction and work-quality improvement.

<!-- SPEAKER NOTES
Optimization is not a one-time event. Your usage patterns change, new models come out, your agent takes on new tasks.

The loop is simple: look at what you spent, understand what drove it, change one thing, measure again.

OpenClaw logs include enough detail to trace which heartbeats fired, which models were used, how many tokens each turn consumed. Use those logs.

Start with the heartbeat settings — those have the highest impact and are safe to change without affecting output quality.

Then move to context injection and pruning. Then caching. Then memory.

Each step builds on the last. After two or three iterations you will have a config dialed in for your specific workflow.
-->

------

<!--slide-attr x=6000 y=7200 rotate=-1 scale=1.2 -->

# Thank You

Any questions or just want to connect?

Please reach out at:

[https://github.com/vanduc2514](https://github.com/vanduc2514)

<!-- SPEAKER NOTES
Leave plenty of time for questions — this topic always generates good discussion.

Common questions to be ready for:
1. "Does continuation-skip ever miss something important?" — No, it rebuilds fully on heartbeat and post-compaction turns.
2. "What if I don't have Ollama installed?" — Remove the model overrides for heartbeat and memoryFlush. The defaults will use your primary model.
3. "Is there a way to see cost savings before and after?" — Yes, compare your API provider's token usage dashboard before and after applying the config.
4. "Will this work with OpenRouter?" — Yes, all settings apply regardless of provider. Model names just need to be in OpenRouter format.

End with: "The config is in the repo README if you want to copy it now."
-->
