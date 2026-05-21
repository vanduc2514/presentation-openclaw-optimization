# Group E: Workspace Instruction Files

> The actual content of files injected into every session shapes agent quality more than almost any config value.

---

## E.1 Workspace File Loading Order

```
~/.openclaw/workspace/
├── SOUL.md        # Persona + tone — loaded first, every turn
├── AGENTS.md      # Operating rules + standing orders
├── USER.md        # Who the user is
├── IDENTITY.md    # Agent identity (optional)
├── TOOLS.md       # Which tools the agent may use
├── HEARTBEAT.md   # Proactive check schedule + task list
├── BOOTSTRAP.md   # First-run orientation
├── MEMORY.md      # Long-term durable facts (also memory/*.md)
└── skills/        # Installed skills
```

Keep each file small. Workspace token spend = sum of all file sizes × turns per session.

---

## E.2 SOUL.md — Persona and Output Format

The SOUL.md content is injected on every turn. Even one line changes output quality dramatically.

```markdown
<!-- SOUL.md — minimal -->
Terse. Plain prose. No lists unless asked. No padding.
```

Or structured for richer control:

```markdown
<!-- SOUL.md — structured -->
---
description: "Senior engineer persona, direct and technical"
---

Voice: Direct, technical, no filler.
Format: Prose first. Code blocks for code. Bullet lists only for 3+ items.
Default response length: 1–3 sentences unless complexity demands more.
Never say "Certainly!", "Great question!", or similar affirmations.
```

---

## E.3 AGENTS.md — Operating Rules + Standing Orders

Standing orders give the agent **permanent authority** for recurring programs without re-prompting each time. Include them directly in `AGENTS.md`.

```markdown
<!-- AGENTS.md -->

## Core Rules
- Never write outside the workspace without explicit user approval.
- When unsure, ask before acting. Never guess on irreversible actions.
- Before any /compact: write session notes to memory/YYYY-MM-DD.md.

## Program: Daily Digest
**Authority:** Read emails, calendar, and news feeds. Generate summary.
**Trigger:** Every day at 08:00 via cron
**Approval gate:** None for standard digest. Escalate if action items exceed 5.
**Escalation:** Message user if any email flagged urgent.

### Steps
1. Check inbox for unread messages.
2. Pull calendar events for today.
3. Write digest to memory/digest-YYYY-MM-DD.md.
4. Send summary to the configured channel.

### Constraints
- Do not reply to emails without explicit instruction.
- Do not create calendar events.
```
