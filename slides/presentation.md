<!--markpress-opt
{
  "autoSplit": false,
  "sanitize": false,
  "title": "OpenClaw Optimization"
}
markpress-opt-->

<!--slide-attr x=0 y=0 scale=1.2 -->

# OpenClaw Optimization
## Make Your AI Agent Cheaper, Faster, and Smarter

Using only `openclaw.json`

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

> By turn 20, you are paying for turns 1 through 19 all over again.

<!-- SPEAKER NOTES
This is the root cause of almost every surprise bill.

The agent does not just process your latest message — it re-processes the entire conversation history each time. On top of that, a background heartbeat fires every 30 minutes, even at 3am when no one is using it.

Ask the audience: "Has anyone been surprised by their API bill this month?" Usually a few hands.

This is not a bug — it is how LLMs work. But OpenClaw gives you knobs to control it.
-->

------

<!--slide-attr x=4000 y=150 rotate=2 scale=1.0 -->

# What This Actually Costs

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

# `openclaw.json` — Your Control Panel

One file at `~/.openclaw/openclaw.json`

```json
{
  "agents": {
    "defaults": {
      "..."
    }
  }
}
```

Change a few settings here. **Cut costs 60–80%.** No code changes needed.

> All configs shown today live inside this single file.

<!-- SPEAKER NOTES
This is the key message: everything we are about to discuss lives in one JSON file on your machine.

No code changes, no redeployment, no complicated infrastructure. You edit one file and restart OpenClaw.

We will cover 8 configurations across 4 groups. At the end I will show you the complete combined config you can copy-paste directly.
-->

------

<!--slide-attr x=6000 y=1800 rotate=3 scale=1.0 -->

# Context Budget

> What goes into the AI's memory each turn?

Every character in your workspace files = tokens = money.

These settings control the **size of that payload**.

<!-- SPEAKER NOTES
Think of each AI turn as sending a package. This group controls what goes inside that package.

By default, OpenClaw stuffs in all your workspace files every single time. We can change that.

Two key settings here: skip re-injection on follow-up turns, and prune old tool results after a timeout.
-->

------

<!--slide-attr x=4000 y=1650 rotate=-2 scale=1.0 -->

# Skip Re-Injection

> Like reading your company handbook before every Slack reply. Once is enough.

```json
{
  "contextInjection": "continuation-skip",
  "bootstrapMaxChars": 12000,
  "bootstrapTotalMaxChars": 60000
}
```

On a 20-turn session: eliminates re-injection cost on ~18 of those turns.

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

# Prune Old Results

> Shred documents after you have read and filed them, do not let them pile up on your desk.

```json
{
  "contextPruning": {
    "mode": "cache-ttl",
    "ttl": "1h"
  }
}
```

Keeps the context lean during long, multi-hour sessions.

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

# Memory & State

> What does the agent remember between sessions?

Without good memory: the agent rediscovers the same facts every time.

With good memory: it picks up exactly where it left off.

<!-- SPEAKER NOTES
This group is about making sure what matters gets preserved.

Two critical scenarios: what happens when the context window fills up and gets summarized (compaction), and how the agent finds things it has stored in memory.
-->

------

<!--slide-attr x=0 y=3600 rotate=2 scale=1.0 -->

# Save Before You Forget

> Taking notes before the meeting ends, before someone erases the whiteboard.

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

Uses a **free local model**, costs $0.

[compaction.memoryFlush](https://docs.openclaw.ai/gateway/configuration)

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

Enables **hybrid search**: keyword matching + vector similarity.

Auto-detects your OpenAI API key. Indexes all `memory/*.md` files.

[agents.defaults.memorySearch](https://docs.openclaw.ai/gateway/config-agents#agents-defaults-memorysearch)

<!-- SPEAKER NOTES
OpenClaw has a built-in SQLite memory engine. By default it uses FTS5 keyword search — fast but literal.

With a provider configured, you get hybrid search: FTS5 for exact matches plus vector embeddings for semantic similarity.

Practical example: you stored a note about "API rate limits" three months ago. You later ask about "why requests are being throttled". Keyword search misses it. Hybrid search finds it.

The embedding model used is text-embedding-3-small by default — very cheap, about $0.00002 per 1,000 tokens.

This setting auto-detects your API key. If you already have OpenAI configured, it just works.
-->

------

<!--slide-attr x=4000 y=3750 rotate=3 scale=1.0 -->

# Model Routing

> Which AI model runs for which task?

Not every task needs the most expensive model.

Smart routing uses the right tool for the job, and the right price.

<!-- SPEAKER NOTES
The key insight: you are probably using one expensive flagship model for everything, including simple background checks that a cheap or free model could handle perfectly well.

Two settings here: prompt caching to avoid re-processing, and a fallback chain that automatically uses cheaper models when the primary is overloaded.
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

**Up to 90% discount** on cached tokens with Anthropic.

Works per-model and per-agent. Three levels: `none`, `short`, `long`.

[agents.defaults.params.cacheRetention](https://docs.openclaw.ai/gateway/config-agents#agents-defaults-params-cacheretention)

<!-- SPEAKER NOTES
Prompt caching is a provider-level feature that OpenClaw exposes as a first-class config key.

When you set cacheRetention to "long", OpenClaw tells the provider to keep your system prompt in a cache. Subsequent turns that share the same prefix pay a fraction of the normal input token price.

Anthropic offers up to 90% discount on cached tokens. On a 10,000-token system prompt that gets re-sent 50 times a day, this is significant savings.

You can override this per-model or per-agent. For example, disable it for agents where the system prompt varies on every run — like a dynamic alert agent.

The config merge order is: defaults → per-model overrides → per-agent overrides.
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

[agents.defaults.model.fallbacks](https://docs.openclaw.ai/gateway/config-agents#agents-defaults-model-fallbacks)

<!-- SPEAKER NOTES
This serves two purposes: reliability and cost.

For reliability: when a flagship model is overloaded — which happens at peak hours — OpenClaw falls back to the next model in the chain automatically. No error, no interruption, no manual intervention.

For cost: put cheaper models at the bottom of the fallback chain. Off-peak background tasks that end up on a fallback model cost significantly less than the primary.

Important nuance: this applies to configured defaults. If the user explicitly chooses a model with /model command, no fallback is applied — that preserves user intent.

Auto fallback is tracked with modelOverrideSource "auto" so you can see in the logs which model actually ran.
-->

------

<!--slide-attr x=4000 y=5250 rotate=-3 scale=1.0 -->

# Heartbeat Scheduling

> What does the agent do when no one is talking to it?

By default: wakes up every 30 minutes and runs expensive checks, even at 3am, even when there is nothing to do.

<!-- SPEAKER NOTES
This is the single biggest hidden cost driver in most OpenClaw setups.

Every heartbeat loads all workspace files and the full conversation history. On a flagship model, that heartbeat alone can cost $30 to $100 per month.

Two settings here: tune the heartbeat to be much lighter, and add a task list so the agent can skip the LLM call entirely when there is nothing to do.
-->

------

<!--slide-attr x=2000 y=5550 rotate=2 scale=1.0 -->

# Wake Up Smarter

> Set an alarm only on workdays, not every 30 minutes around the clock.

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

`isolatedSession: true` alone: **~100K tokens → ~2–5K per run.**

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

> A checklist that tells the agent "nothing to do today, go back to sleep."

```yaml
<!-- HEARTBEAT.md -->
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

[HEARTBEAT.md task scheduling](https://docs.openclaw.ai/gateway/configuration)

<!-- SPEAKER NOTES
This is the sharpest cost lever in the entire heartbeat system.

When you add a tasks: block to HEARTBEAT.md, OpenClaw evaluates the task schedule before making any LLM call. If no tasks are due, it logs reason=no-tasks-due and skips entirely.

Think about what that means: a heartbeat that fires every 55 minutes but has no tasks due for the next several hours costs zero tokens. Nothing. You are not charged at all.

The tasks: block lets you schedule exactly when each check should run — hourly, every 12 hours, weekly. Only the tasks that are actually due trigger an LLM call.

Combined with D.1, you go from heartbeat costing $30-$100/month to a few dollars or even less.
-->

------

<!--slide-attr x=0 y=7200 rotate=3 scale=0.9 -->

# The Complete `openclaw.json`

```json
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
Here it is — all 8 configurations combined into one file.

This is not aspirational. This is a production-tested config that covers context budget, memory, model routing, and heartbeat in a single place.

You can copy this right now and adapt it to your setup. The only things you might want to change:
- Swap the primary model to whatever you are currently using
- Adjust activeHours to match your timezone and work schedule
- Remove the Ollama references if you are not running local models

Coming up: how to apply this in about 10 seconds.
-->

------

<!--slide-attr x=2000 y=7050 rotate=-2 scale=1.0 -->

# How to Apply This Right Now

1. Open a chat with your agent
2. Paste the config above
3. Say: `"Update my openclaw.json with this configuration"`

The agent applies the changes and restarts automatically.

> No terminal, no file editing, no restart needed.

<!-- SPEAKER NOTES
This is the point of the whole talk. You do not need to find the file, edit JSON by hand, or restart anything manually.

Just have a conversation. Paste the config. Ask the agent to apply it.

This works because OpenClaw agents can modify their own configuration files — and they know exactly where openclaw.json lives.

If you want to be cautious, ask the agent to show you the diff first before applying. That is a safe way to review what will change.

For production teams: you can version-control your openclaw.json in a private repository and have the agent pull and apply updates on demand.
-->

------

<!--slide-attr x=4000 y=7350 rotate=2 scale=1.0 -->

# Keep Getting Better

```
Observe → Record → Improve → Repeat
```

- **Observe:** Check your monthly API cost breakdown
- **Record:** Note which operations drive the most spend
- **Improve:** Tune one setting at a time, measure the change
- **Repeat:** Production optimization is a habit, not a one-time setup

> The configs shown today are a strong starting point, not a final answer.

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

Do you have any Questions ?

Or just want to hang out ?

Feel free to reach me out at

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
