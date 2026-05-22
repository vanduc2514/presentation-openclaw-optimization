/* remote-control.js — Presenter-side remote control (ntfy.sh relay)
 * Injected into output/index.html by build.cjs
 * CDN dep loaded before this script: qrcodejs
 *
 * Uses ntfy.sh as an HTTP/SSE pub-sub relay so the remote works on any
 * network — including mobile 4G — without WebRTC or TURN servers.
 *
 * Two password-derived topics (unguessable SHA-256 hex prefixes):
 *   <base>-s  presenter publishes slide state → mobile subscribes
 *   <base>-r  mobile publishes commands       → presenter subscribes
 */
/* global QRCode, __REMOTE_BASE__ */
(function () {
  'use strict';

  /* ── CONFIG ────────────────────────────────────────────────────────────── */
  var NTFY = 'https://ntfy.sh';
  /* Notes are truncated to stay comfortably within ntfy's 4096-byte message
     limit — 2000 chars leaves room for the JSON envelope and slide metadata. */
  var MAX_NOTES = 2000;

  /* ── BUILD MODAL HTML ─────────────────────────────────────────────────── */
  var overlay = document.createElement('div');
  overlay.id = 'rc-overlay';
  overlay.innerHTML =
    '<div id="rc-modal">' +
      '<button id="rc-close-btn" title="Close">&#x2715;</button>' +
      '<div id="rc-modal-title">Remote Control</div>' +
      '<div id="rc-setup-panel">' +
        '<label for="rc-pw-input">Session Password</label>' +
        '<input id="rc-pw-input" type="password" placeholder="Choose a password\u2026" autocomplete="off">' +
        '<div id="rc-setup-error" style="display:none"></div>' +
        '<button id="rc-start-btn">Start Remote Session</button>' +
      '</div>' +
      '<div id="rc-active-panel" style="display:none">' +
        '<div id="rc-status">Waiting for connection\u2026</div>' +
        '<div id="rc-qr-wrap">' +
          '<div id="rc-qr-canvas"></div>' +
          '<button id="rc-url-btn" title="Click to copy">\u2014</button>' +
        '</div>' +
        '<div id="rc-count">0 device(s) connected</div>' +
        '<button id="rc-stop-btn">Stop Session</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);

  var rcBtn = document.createElement('button');
  rcBtn.id = 'rc-btn';
  rcBtn.title = 'Remote Control';
  rcBtn.textContent = 'Remote';
  document.body.appendChild(rcBtn);

  /* ── STATE ────────────────────────────────────────────────────────────── */
  var slideTopic  = null;   /* presenter publishes here */
  var remoteTopic = null;   /* mobile publishes here */
  var cmdSource   = null;   /* SSE subscription to remoteTopic */
  var notesMap    = {};
  var remoteCount = 0;

  /* ── SPEAKER NOTES FROM DOM COMMENTS ─────────────────────────────────── */
  function buildNotesMap() {
    var result = {};
    document.querySelectorAll('.step').forEach(function (step) {
      var walker = document.createTreeWalker(step, NodeFilter.SHOW_COMMENT);
      var node;
      while ((node = walker.nextNode())) {
        var m = node.textContent.match(/\s*SPEAKER NOTES\s*([\s\S]*)/);
        if (m) { result[step.id] = m[1].trim(); break; }
      }
    });
    return result;
  }

  /* ── CURRENT SLIDE INFO ───────────────────────────────────────────────── */
  function currentSlideInfo() {
    var steps = Array.from(document.querySelectorAll('.step'));
    var active = document.querySelector('.step.active');
    if (!active) return null;
    var titleEl = active.querySelector('h1, h2, h3');
    var notes = notesMap[active.id] || '';
    if (notes.length > MAX_NOTES) notes = notes.slice(0, MAX_NOTES) + '\u2026';
    return {
      type:  'slide',
      id:    active.id,
      index: steps.indexOf(active) + 1,
      total: steps.length,
      title: titleEl ? titleEl.textContent.trim() : '',
      notes: notes
    };
  }

  /* ── DERIVE TOPIC IDS FROM PASSWORD (SHA-256) ─────────────────────────── */
  function toTopicIds(password) {
    var data = new TextEncoder().encode('openclaw-rc-v1:' + password);
    return crypto.subtle.digest('SHA-256', data).then(function (buf) {
      var hex = Array.from(new Uint8Array(buf))
        .map(function (b) { return b.toString(16).padStart(2, '0'); })
        .join('');
      var base = 'ocl-' + hex.slice(0, 32);
      return { slide: base + '-s', remote: base + '-r' };
    });
  }

  /* ── PUBLISH TO NTFY ─────────────────────────────────────────────────── */
  function publish(topic, data) {
    fetch(NTFY + '/' + topic, {
      method:  'POST',
      headers: { 'Content-Type': 'text/plain' },
      body:    JSON.stringify(data)
    }).catch(function () { /* silent — best-effort delivery */ });
  }

  /* ── BROADCAST CURRENT SLIDE STATE ────────────────────────────────────── */
  function broadcastSlide() {
    if (!slideTopic) return;
    var info = currentSlideInfo();
    if (info) publish(slideTopic, info);
  }

  /* ── UI HELPERS ───────────────────────────────────────────────────────── */
  function setCount(n) {
    remoteCount = n;
    var countEl  = document.getElementById('rc-count');
    var statusEl = document.getElementById('rc-status');
    if (countEl)  countEl.textContent = n + ' device(s) connected';
    if (statusEl) {
      if (n > 0) {
        statusEl.textContent = 'Connected \u2014 ' + n + ' device(s)';
        statusEl.className   = 'rc-connected';
      } else {
        statusEl.textContent = 'Waiting for connection\u2026';
        statusEl.className   = '';
      }
    }
    rcBtn.classList.toggle('rc-active', n > 0);
  }

  /* ── START SESSION ────────────────────────────────────────────────────── */
  function startSession(password) {
    var setupPanel  = document.getElementById('rc-setup-panel');
    var activePanel = document.getElementById('rc-active-panel');
    var setupError  = document.getElementById('rc-setup-error');

    setupError.style.display = 'none';
    setupPanel.style.display  = 'none';
    activePanel.style.display = '';
    setCount(0);

    toTopicIds(password).then(function (topics) {
      slideTopic  = topics.slide;
      remoteTopic = topics.remote;

      /* ── Subscribe to commands from mobile via SSE ── */
      cmdSource = new EventSource(NTFY + '/' + remoteTopic + '/sse');

      cmdSource.addEventListener('message', function (e) {
        var envelope, data;
        try { envelope = JSON.parse(e.data); } catch (ex) { return; }
        if (!envelope || envelope.event !== 'message') return;
        try { data = JSON.parse(envelope.message); } catch (ex) { return; }
        if (!data || !data.type) return;

        if (data.type === 'request_slide') {
          /* Mobile connected — send current slide and mark as connected */
          broadcastSlide();
          if (remoteCount === 0) {
            setCount(1);
            overlay.classList.remove('rc-open');
          }
          return;
        }

        /* Navigation commands from mobile */
        if (data.type === 'cmd') {
          var api = window.impress && window.impress();
          if (!api) return;
          if      (data.cmd === 'next')              api.next();
          else if (data.cmd === 'prev')              api.prev();
          else if (data.cmd === 'goto' && data.step) api.goto(data.step);
        }
      });

      /* ── Build remote URL ── */
      var remoteBase = (typeof __REMOTE_BASE__ !== 'undefined' && __REMOTE_BASE__)
        ? __REMOTE_BASE__.replace(/\/$/, '')
        : (window.location.origin + window.location.pathname).replace(/\/[^\/]*$/, '');
      var remoteUrl = remoteBase + '/remote.html?pw=' + encodeURIComponent(password);

      /* QR code */
      var qrEl = document.getElementById('rc-qr-canvas');
      qrEl.innerHTML = '';
      new QRCode(qrEl, {
        text:         remoteUrl,
        width:        160,
        height:       160,
        colorDark:    '#000000',
        colorLight:   '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });

      /* Copyable URL button */
      var urlBtn = document.getElementById('rc-url-btn');
      urlBtn.textContent = remoteUrl;
      urlBtn.onclick = function () {
        navigator.clipboard.writeText(remoteUrl).then(function () {
          urlBtn.textContent = 'Copied!';
          setTimeout(function () { urlBtn.textContent = remoteUrl; }, 1600);
        });
      };

      /* Broadcast slide on every step change */
      document.addEventListener('impress:stepenter', function () {
        broadcastSlide();
      });
    });
  }

  /* ── STOP SESSION ─────────────────────────────────────────────────────── */
  function stopSession() {
    if (cmdSource) { cmdSource.close(); cmdSource = null; }
    slideTopic  = null;
    remoteTopic = null;
    setCount(0);
    rcBtn.classList.remove('rc-active');
    document.getElementById('rc-setup-panel').style.display  = '';
    document.getElementById('rc-active-panel').style.display = 'none';
    document.getElementById('rc-qr-canvas').innerHTML        = '';
    document.getElementById('rc-url-btn').textContent        = '\u2014';
  }

  /* ── EVENT WIRING ─────────────────────────────────────────────────────── */
  rcBtn.addEventListener('click', function () {
    notesMap = buildNotesMap();
    overlay.classList.add('rc-open');
  });

  document.getElementById('rc-close-btn').addEventListener('click', function () {
    overlay.classList.remove('rc-open');
  });

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) overlay.classList.remove('rc-open');
  });

  document.getElementById('rc-start-btn').addEventListener('click', function () {
    var pw = document.getElementById('rc-pw-input').value.trim();
    if (!pw) { document.getElementById('rc-pw-input').focus(); return; }
    startSession(pw);
  });

  document.getElementById('rc-pw-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') document.getElementById('rc-start-btn').click();
  });

  document.getElementById('rc-stop-btn').addEventListener('click', stopSession);

  /* Block all keyboard events inside the modal from reaching impress.js */
  var modal = document.getElementById('rc-modal');
  modal.addEventListener('keydown', function (e) { e.stopPropagation(); });
  modal.addEventListener('keyup',   function (e) { e.stopPropagation(); });
}());
