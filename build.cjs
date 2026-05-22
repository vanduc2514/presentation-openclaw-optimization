'use strict';

const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────────────────────
// SYNTAX HIGHLIGHTING GUARD
// Must run before requiring markpress — Node's require() cache ensures the same
// Highlights instance is used by marky-markdown internally.
// marky-markdown only ships grammars for a small set of obscure languages.
// For everything else (json, yaml, markdown…) highlightSync() receives a
// NullGrammar whose .initialRule is null, causing a hard crash.
// We wrap it in try/catch so marky-markdown falls back to plain code output,
// and then highlight.js applies real, coloured syntax highlighting below.
// ─────────────────────────────────────────────────────────────────────────────
const Highlights = require('highlights');
const _origHighlightSync = Highlights.prototype.highlightSync;
Highlights.prototype.highlightSync = function (opts) {
  try {
    return _origHighlightSync.call(this, opts);
  } catch (e) {
    return null;
  }
};

const hljs = require('highlight.js');
const markpress = require('markpress');

const INPUT_EN = path.resolve(__dirname, 'slides/presentation.en.md');
const INPUT_VI = path.resolve(__dirname, 'slides/presentation.vi.md');
const OUTPUT_DIR = path.resolve(__dirname, 'output');
const OUTPUT_VI = path.resolve(OUTPUT_DIR, 'index.html');
const OUTPUT_EN = path.resolve(OUTPUT_DIR, 'index.en.html');

// ─────────────────────────────────────────────────────────────────────────────
// REMOTE CONTROL ASSETS
// Source files read at build time and injected / copied into output/.
// ─────────────────────────────────────────────────────────────────────────────
const SRC = path.resolve(__dirname, 'src');
const REMOTE_CTRL_CSS = fs.readFileSync(path.join(SRC, 'remote-control.css'), 'utf8');
const REMOTE_CTRL_JS  = fs.readFileSync(path.join(SRC, 'remote-control.js'),  'utf8');
const REMOTE_HTML     = fs.readFileSync(path.join(SRC, 'remote.html'),        'utf8');

// ─────────────────────────────────────────────────────────────────────────────
// REMOTE BASE URL
// Public URL used in the QR code so mobiles on ANY network can load remote.html
// without needing access to the presenter's local machine.
// Defaults to this repo's GitHub Pages deployment. If you fork the repo or
// host it elsewhere, set REMOTE_BASE_URL as an environment variable at build
// time (e.g. REMOTE_BASE_URL=https://example.com/my-talk npm run build).
// ─────────────────────────────────────────────────────────────────────────────
const REMOTE_BASE_URL = process.env.REMOTE_BASE_URL ||
  'https://vanduc2514.github.io/presentation-openclaw-optimization';

// ─────────────────────────────────────────────────────────────────────────────
// FONTS
// Replace with any Google Fonts link. Update font-family in customCss below.
// ─────────────────────────────────────────────────────────────────────────────
const googleFonts = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,200..700;1,14..32,200..700&family=Space+Grotesk:wght@300..700&display=swap" rel="stylesheet">
`;

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM CSS
// Injected into <head> after markpress output. Overrides the default theme.
// Organized into sections — customize only the parts you need.
// ─────────────────────────────────────────────────────────────────────────────
const customCss = `
  <style>
    /* ── COLOR PALETTE ─────────────────────────────────────────────────────
       Light mode with per-group accent colors.
       Each group gets a --group-accent assigned via #step-N overrides.   */
    :root {
      --ink: #18181b;       /* body text */
      --ink-dim: #52525b;   /* subtitles, secondary text */
      --muted: #a1a1aa;     /* captions, tertiary */
      --line: #e4e4e7;      /* borders */
      --accent: #f97316;    /* default accent — orange */
      --group-accent: #f97316; /* per-group color, overridden per slide group */
      --border-accent-width: 5px; /* shared top accent thickness */
      --radius: 20px;       /* slide corner radius */
    }

    /* ── BACKGROUND ────────────────────────────────────────────────────────
       Light gray canvas so white slide cards pop.                        */
    html, body {
      background: #f1f5f9;
      color: var(--ink);
      font-family: "Space Grotesk", "Inter", "Segoe UI", system-ui, sans-serif;
    }

    /* ── SLIDE CARD (base .step) ────────────────────────────────────────────
       RULES:
       - background MUST be a fully opaque hex — never rgba()
       - box-shadow belongs on .step.active only — not here
       - no pseudo-elements (::before / ::after) on .step
       - border-top is the primary dynamic accent — set per group          */
    .step {
      width: min(1160px, 84vw);
      min-height: min(680px, 75vh);
      padding: 2.8rem 3.2rem;
      box-sizing: border-box;
      border: 1px solid var(--line);
      border-top: var(--border-accent-width) solid var(--group-accent);
      border-radius: var(--radius);
      background: #ffffff;
      opacity: 0;
      transition: opacity 200ms ease;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 0.2rem;
      overflow-x: hidden;
      overflow-y: auto;
    }

    .step.active {
      opacity: 1;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.10), 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .step > *:first-child {
      margin-top: 0;
    }

    /* ── TYPOGRAPHY ─────────────────────────────────────────────────────────
       Font sizes use clamp() so they scale with the viewport.             */
    .step h1,
    .step h2,
    .step h3 {
      font-family: "Space Grotesk", "Inter", system-ui, sans-serif;
      letter-spacing: -0.03em;
      line-height: 1.0;
      color: var(--ink);
      margin-bottom: 0.65rem;
      border-bottom: 0;
    }

    .step h1 {
      font-size: clamp(2.35rem, 4.9vmin, 4.8rem);
      font-weight: 700;
      max-width: 820px;
    }

    .step h2 {
      font-size: clamp(1.05rem, 2.0vmin, 1.6rem);
      color: var(--ink-dim);
      font-weight: 400;
      letter-spacing: -0.01em;
      line-height: 1.3;
      max-width: 34ch;
    }

    .step h3 {
      font-size: clamp(0.85rem, 1.6vmin, 1.2rem);
      color: var(--group-accent);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }

    .step p,
    .step li,
    .step td,
    .step th,
    .step blockquote {
      font-size: clamp(1rem, 1.65vmin, 1.3rem);
      line-height: 1.45;
      color: var(--ink);
      font-weight: 400;
    }

    .step ul,
    .step ol {
      margin-top: 1.2rem;
      padding-left: 1.1em;
    }

    .step li {
      margin: 0.45rem 0;
      padding-left: 0.3rem;
    }

    .step li::marker {
      color: var(--group-accent);
      content: "\u25b8  ";
    }

    .step strong {
      color: var(--group-accent);
      font-weight: 700;
    }

    /* ── CODE ───────────────────────────────────────────────────────────────*/
    .step code {
      display: inline-block;
      padding: 0.1em 0.52em;
      border-radius: 6px;
      background: #fafafa;
      border: 1px solid #e4e4e7;
      color: #0f172a;
      font-size: 0.88em;
      font-family: "SF Mono", "Fira Code", monospace;
    }

    .step pre {
      padding: 0.95rem 1.1rem;
      border-radius: 18px;
      border: 1px solid #e4e4e7;
      background: #f8fafc;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      max-width: 100%;
      min-width: 0;
      box-sizing: border-box;
    }

    .step pre code {
      display: block;
      padding: 0;
      background: transparent;
      border: 0;
      color: #18181b;
      border-radius: 0;
    }

    /* ── BLOCKQUOTE ─────────────────────────────────────────────────────────*/
    .step blockquote {
      margin: 1.4rem 0 0;
      padding: 1rem 0 1rem 1.4rem;
      border-left: 4px solid var(--group-accent);
      color: var(--ink-dim);
      background: #f8fafc;
      border-radius: 0 12px 12px 0;
    }

    /* ── TABLE ──────────────────────────────────────────────────────────────*/
    .step table {
      width: 100%;
      margin-top: 1.6rem;
      border-collapse: separate;
      border-spacing: 0;
      border: 1px solid var(--line);
      border-radius: 20px;
      background: #ffffff;
    }

    .step thead th {
      background: #f4f4f5;
      color: var(--group-accent);
      font-size: clamp(0.8rem, 1.45vmin, 1.05rem);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .step th,
    .step td {
      padding: 0.9rem 1.1rem;
      border: 0;
      border-bottom: 1px solid var(--line);
      vertical-align: top;
    }

    .step tr:last-child td {
      border-bottom: 0;
    }

    /* ── LINKS ──────────────────────────────────────────────────────────────*/
    .step a {
      color: var(--group-accent);
      text-decoration: none;
      border-bottom: 1px solid #e4e4e7;
      transition: border-color 150ms;
    }

    .step a:hover {
      border-bottom-color: var(--group-accent);
    }

    /* ── IMAGES ─────────────────────────────────────────────────────────────*/
    .step img {
      max-width: 100%;
      height: auto;
      border-radius: 12px;
      border: 1px solid var(--line);
      cursor: pointer;
    }

    /* ── RESPONSIVE ─────────────────────────────────────────────────────────*/
    @media (max-width: 900px) {
      .step {
        width: 90vw;
        min-height: 72vh;
        padding: 2rem 1.8rem;
        border-radius: 16px;
        justify-content: flex-start;
        overflow-y: auto;
      }

      .step h1 {
        font-size: clamp(1.8rem, 4.6vmin, 2.6rem);
        line-height: 1.12;
      }

      .step h2 {
        font-size: clamp(0.9rem, 2.25vmin, 1.15rem);
      }

      .step p,
      .step li,
      .step td,
      .step th,
      .step blockquote {
        font-size: clamp(0.9rem, 2.1vmin, 1.08rem);
        line-height: 1.38;
      }

      .step pre {
        padding: 0.62rem 0.8rem;
        border-radius: 12px;
        max-width: 100%;
        min-width: 0;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }

      .step pre code {
        font-size: clamp(0.7rem, 1.9vmin, 0.95rem);
        white-space: pre;
        word-break: normal;
      }
    }

    /* ── PER-GROUP ACCENT COLORS ────────────────────────────────────────────
       Groups are assigned a --group-accent color via #step-N.
       The top border, h3, strong, bullets, and blockquote all pick it up.

       Slide 1      — Title               — Orange    #f97316
       Slides 2–4   — Problem / Cost      — Red       #ef4444
       Slides 5–7   — Group A (Context)   — Green     #22c55e
       Slides 8–10  — Group B (Memory)    — Blue      #3b82f6
       Slides 11–13 — Group C (Routing)   — Purple    #a855f7
       Slides 14–16 — Group D (Heartbeat) — Amber     #f59e0b
       Slides 17–20 — Closing             — Teal      #14b8a6   */

    /* Title */
    #step-1 {
      --group-accent: #f97316;
      background: #fff7ed;
      /* Slightly stronger hero treatment on the title slide. */
      border-top-width: calc(var(--border-accent-width) + 1px);
    }
    #step-1 h1 {
      font-size: clamp(3.2rem, 6.4vmin, 6.4rem);
      font-weight: 700;
      letter-spacing: -0.04em;
      line-height: 1.08;
    }
    #step-1 h2 {
      margin-top: 0.7rem;
      font-weight: 400;
      color: var(--ink-dim);
    }

    /* Problem / Cost */
    #step-2, #step-3, #step-4 { --group-accent: #ef4444; }

    /* Group A — Context Budget */
    #step-5, #step-6, #step-7 { --group-accent: #22c55e; }

    /* Group B — Memory & State */
    #step-8, #step-9, #step-10 { --group-accent: #3b82f6; }

    /* Group C — Model Routing */
    #step-11, #step-12, #step-13 { --group-accent: #a855f7; }

    /* Group D — Heartbeat */
    #step-14, #step-15, #step-16 { --group-accent: #f59e0b; }

    /* Closing */
    #step-17, #step-18, #step-19, #step-20 { --group-accent: #14b8a6; }
    #step-19, #step-20 { justify-content: center; }
    #step-19 table, #step-20 table {
      width: min(100%, 1080px);
      margin: 1rem auto 0;
      border: 0;
      background: transparent;
      table-layout: fixed;
      border-spacing: 26px 8px;
    }
    #step-19 thead th, #step-20 thead th {
      background: transparent;
      color: var(--ink-dim);
      text-transform: none;
      letter-spacing: 0;
      font-weight: 600;
      font-size: clamp(0.8rem, 1.45vmin, 1rem);
      text-align: center;
      border: 0;
      padding-bottom: 0.2rem;
    }
    #step-19 td, #step-20 td {
      border: 0;
      text-align: center;
      width: 33.33%;
      padding: 0.2rem 0.25rem;
      background: transparent;
    }
    #step-19 tbody tr:nth-child(1) img,
    #step-20 tbody tr:nth-child(1) img {
      width: 180px;
      height: 180px;
      object-fit: contain;
      margin: 0 auto;
    }
    #step-19 tbody tr:nth-child(2) img,
    #step-20 tbody tr:nth-child(2) img {
      width: 36px;
      height: 36px;
      object-fit: contain;
      margin: 6px auto 0;
      border: 0;
    }

    /* ── SYNTAX HIGHLIGHTING (highlight.js — light theme) ──────────────────── */
    .hljs { color: #24292e; background: transparent; }
    .hljs-keyword,
    .hljs-selector-tag { color: #d73a49; font-weight: 600; }
    .hljs-string,
    .hljs-attr { color: #032f62; }
    .hljs-number,
    .hljs-literal { color: #005cc5; }
    .hljs-property,
    .hljs-built_in { color: #6f42c1; }
    .hljs-comment,
    .hljs-quote { color: #6a737d; font-style: italic; }
    .hljs-variable,
    .hljs-title { color: #e36209; }
    .hljs-punctuation { color: #586069; }
    .hljs-type { color: #005cc5; }
  </style>`;

// ─────────────────────────────────────────────────────────────────────────────
// POST-PROCESSING: SYNTAX HIGHLIGHTING
// marky-markdown wraps code blocks as:
//   <div class="highlight LANG"><pre><code class="highlight LANG">…</code></pre></div>
// We decode the HTML-escaped content and run it through highlight.js.
// ─────────────────────────────────────────────────────────────────────────────
function applyHighlighting(html) {
  return html.replace(
    /<div class="highlight ([^"\s]+)"><pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre><\/div>/g,
    (match, lang, escapedCode) => {
      if (!lang) return match;
      const code = escapedCode
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      try {
        const result = hljs.highlight(code.trim(), { language: lang, ignoreIllegals: true });
        return `<pre><code class="hljs language-${lang}">${result.value}</code></pre>`;
      } catch (e) {
        return `<pre><code class="hljs">${escapedCode}</code></pre>`;
      }
    }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LANGUAGE SWITCHER
// Injected into each output so viewers can switch between EN and VI.
// ─────────────────────────────────────────────────────────────────────────────
const langSwitcherEn = `
  <a id="lang-switcher" href="./index.html" title="Switch to Tiếng Việt">🇻🇳 Tiếng Việt</a>
  <style>
    #lang-switcher {
      position: fixed;
      top: 14px;
      right: 18px;
      z-index: 9999;
      background: #ffffff;
      border: 1px solid #e4e4e7;
      border-radius: 999px;
      padding: 6px 14px;
      font-family: "Space Grotesk", "Inter", system-ui, sans-serif;
      font-size: 0.82rem;
      font-weight: 500;
      color: #f97316;
      text-decoration: none;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transition: background 150ms, box-shadow 150ms;
    }
    #lang-switcher:hover {
      background: #f8fafc;
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
    }
  </style>`;

const langSwitcherVi = `
  <a id="lang-switcher" href="./index.en.html" title="Switch to English">🇬🇧 English</a>
  <style>
    #lang-switcher {
      position: fixed;
      top: 14px;
      right: 18px;
      z-index: 9999;
      background: #ffffff;
      border: 1px solid #e4e4e7;
      border-radius: 999px;
      padding: 6px 14px;
      font-family: "Space Grotesk", "Inter", system-ui, sans-serif;
      font-size: 0.82rem;
      font-weight: 500;
      color: #f97316;
      text-decoration: none;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transition: background 150ms, box-shadow 150ms;
    }
    #lang-switcher:hover {
      background: #f8fafc;
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
    }
  </style>`;

// ─────────────────────────────────────────────────────────────────────────────
// BUILD FUNCTION
// Builds one markdown source into one HTML output. langSwitcher HTML is
// injected before </body>. Add post-processing transforms inside this function.
// ─────────────────────────────────────────────────────────────────────────────
function buildPresentation(input, output, langSwitcher) {
  return markpress(input, { theme: false }).then(({ html }) => {
    // Strip markpress default theme styles
    let stripped = html
      .replace(/<link[^>]+markpress[^>]*>/gi, '')
      .replace(/<link[^>]+theme[^>]*>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, (match) => {
        if (/font-family|line-height|blockquote|pre\s*\{/.test(match)) return '';
        return match;
      });

    // Smooth camera transition
    stripped = stripped.replace(
      /(<div[^>]*id=["']impress["'][^>]*)(>)/,
      '$1 data-transition-duration="200"$2'
    );

    // ── Transform: add here ────────────────────────────────────────────────
    stripped = applyHighlighting(stripped);
    // ──────────────────────────────────────────────────────────────────────

    // Remote control scripts injected before </body>
    const remoteScripts =
      '<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>\n' +
      `<script>\nvar __REMOTE_BASE__ = ${JSON.stringify(REMOTE_BASE_URL)};\n${REMOTE_CTRL_JS}\n</script>`;

    const finalHtml = stripped
      .replace('<head>', `<head>\n${googleFonts}`)
      .replace('</head>', `${customCss}\n<style id="rc-styles">\n${REMOTE_CTRL_CSS}\n</style>\n</head>`)
      .replace('</body>', `${langSwitcher}\n${remoteScripts}\n</body>`);

    fs.writeFileSync(output, finalHtml, 'utf8');
    console.log(`Built: ${output}`);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// RUN
// ─────────────────────────────────────────────────────────────────────────────
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUTPUT_DIR, 'remote.html'), REMOTE_HTML, 'utf8');
console.log(`Built: ${path.join(OUTPUT_DIR, 'remote.html')}`);

Promise.all([
  buildPresentation(INPUT_EN, OUTPUT_EN, langSwitcherEn),
  buildPresentation(INPUT_VI, OUTPUT_VI, langSwitcherVi),
]).catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});