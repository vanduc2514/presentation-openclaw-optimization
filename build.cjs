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
       Dark mode with orange accent — matches the GOATVN design system.   */
    :root {
      --ink: #f4f4f5;       /* body text */
      --ink-dim: #a1a1aa;   /* subtitles, secondary text */
      --muted: #71717a;     /* captions, tertiary */
      --line: #27272a;      /* borders */
      --accent: #f97316;    /* primary highlight — orange */
      --accent2: #f59e0b;   /* secondary highlight — amber */
      --accent-dim: #7c3d12; /* darker orange for borders/underlines */
      --accent-deep: #3d1f08; /* deepest orange tint for slide borders */
      --radius: 20px;       /* slide corner radius */
    }

    /* ── BACKGROUND ────────────────────────────────────────────────────────
       Near-black canvas — single value, no multi-layer gradients.        */
    html, body {
      background: #09090b;
      color: var(--ink);
      font-family: "Space Grotesk", "Inter", "Segoe UI", system-ui, sans-serif;
    }

    /* ── SLIDE CARD (base .step) ────────────────────────────────────────────
       RULES:
       - background MUST be a fully opaque hex — never rgba()
       - box-shadow belongs on .step.active only — not here
       - no pseudo-elements (::before / ::after) on .step              */
    .step {
      width: min(1160px, 84vw);
      min-height: min(680px, 75vh);
      padding: 3.6rem 4.2rem;
      box-sizing: border-box;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: #18181b;
      opacity: 0;
      transition: opacity 200ms ease;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .step.active {
      opacity: 1;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 2px 8px rgba(0, 0, 0, 0.4);
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
      font-size: clamp(2.6rem, 5.2vmin, 5.2rem);
      font-weight: 700;
      max-width: 820px;
    }

    .step h2 {
      font-size: clamp(1.1rem, 2.1vmin, 1.85rem);
      color: var(--ink-dim);
      font-weight: 400;
      letter-spacing: -0.01em;
      line-height: 1.3;
      max-width: 34ch;
    }

    .step h3 {
      font-size: clamp(0.85rem, 1.6vmin, 1.2rem);
      color: var(--accent);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }

    .step p,
    .step li,
    .step td,
    .step th,
    .step blockquote {
      font-size: clamp(1.05rem, 2.0vmin, 1.6rem);
      line-height: 1.55;
      color: var(--ink);
      font-weight: 400;
    }

    .step ul,
    .step ol {
      margin-top: 1.2rem;
      padding-left: 1.1em;
    }

    .step li {
      margin: 0.65rem 0;
      padding-left: 0.3rem;
    }

    .step li::marker {
      color: var(--accent);
      content: "\u25b8  ";
    }

    .step strong {
      color: var(--accent);
      font-weight: 700;
    }

    /* ── CODE ───────────────────────────────────────────────────────────────*/
    .step code {
      display: inline-block;
      padding: 0.1em 0.52em;
      border-radius: 6px;
      background: #2c1a08;
      border: 1px solid var(--accent-dim);
      color: var(--accent);
      font-size: 0.88em;
      font-family: "SF Mono", "Fira Code", monospace;
    }

    .step pre {
      padding: 1.2rem 1.4rem;
      border-radius: 18px;
      border: 1px solid #27272a;
      background: #0c0c10;
    }

    .step pre code {
      display: block;
      padding: 0;
      background: transparent;
      border: 0;
      color: #e4e4e7;
      border-radius: 0;
    }

    /* ── BLOCKQUOTE ─────────────────────────────────────────────────────────*/
    .step blockquote {
      margin: 1.4rem 0 0;
      padding: 1rem 0 1rem 1.4rem;
      border-left: 3px solid var(--accent);
      color: var(--ink-dim);
      background: #1c1208;
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
      background: #1c1c1f;
    }

    .step thead th {
      background: #231508;
      color: var(--accent);
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
      color: var(--accent);
      text-decoration: none;
      border-bottom: 1px solid var(--accent-dim);
      transition: border-color 150ms;
    }

    .step a:hover {
      border-bottom-color: var(--accent);
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
        width: 88vw;
        min-height: 72vh;
        padding: 2rem 1.8rem;
        border-radius: 16px;
        justify-content: flex-start;
      }
    }

    /* ── PER-SLIDE OVERRIDES ────────────────────────────────────────────────
       Use #step-N to override styles for a specific slide (1-indexed).
       Slide 1: dark title card with solid headline color.                */
    #step-1 {
      background: #0f0f13;
      border-color: var(--accent-deep);
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
      -webkit-text-fill-color: var(--ink-dim);
    }

    /* ── SYNTAX HIGHLIGHTING (highlight.js — dark orange theme) ────────────── */
    .hljs { color: #e4e4e7; }
    .hljs-keyword,
    .hljs-selector-tag { color: #fb923c; }
    .hljs-string,
    .hljs-attr { color: #86efac; }
    .hljs-number,
    .hljs-literal { color: #fbbf24; }
    .hljs-property,
    .hljs-built_in { color: #67e8f9; }
    .hljs-comment,
    .hljs-quote { color: #52525b; font-style: italic; }
    .hljs-variable,
    .hljs-title { color: #fdba74; }
    .hljs-punctuation { color: #a1a1aa; }
    .hljs-type { color: #f9e2af; }
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
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 999px;
      padding: 6px 14px;
      font-family: "Space Grotesk", "Inter", system-ui, sans-serif;
      font-size: 0.82rem;
      font-weight: 500;
      color: #f97316;
      text-decoration: none;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      transition: background 150ms, box-shadow 150ms;
    }
    #lang-switcher:hover {
      background: #27272a;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
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
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 999px;
      padding: 6px 14px;
      font-family: "Space Grotesk", "Inter", system-ui, sans-serif;
      font-size: 0.82rem;
      font-weight: 500;
      color: #f97316;
      text-decoration: none;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      transition: background 150ms, box-shadow 150ms;
    }
    #lang-switcher:hover {
      background: #27272a;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
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