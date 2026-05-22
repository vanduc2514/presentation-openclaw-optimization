/* remote-control.js — Presenter-side remote control
 * Injected into output/index.html by build.cjs
 * CDN deps loaded before this script: peerjs, qrcodejs
 */
/* global Peer, QRCode */
(function () {
  'use strict';

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

  /* ── ICE / TURN CONFIG ────────────────────────────────────────────────── */
  var PEER_ICE_CONFIG = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      /* Open Relay Project — free public TURN relay */
      {
        urls: [
          'turn:openrelay.metered.ca:80',
          'turn:openrelay.metered.ca:443',
          'turns:openrelay.metered.ca:443'
        ],
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      /* freeturn.net — additional free TURN relay */
      { urls: 'turn:freeturn.net:3478', username: 'free', credential: 'free' },
      { urls: 'turns:freeturn.net:5349', username: 'free', credential: 'free' }
    ]
  };

  /* ── STATE ────────────────────────────────────────────────────────────── */
  var peer = null;
  var connections = [];
  var notesMap = {};

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
    return {
      type:  'slide',
      id:    active.id,
      index: steps.indexOf(active) + 1,
      total: steps.length,
      title: titleEl ? titleEl.textContent.trim() : '',
      notes: notesMap[active.id] || ''
    };
  }

  /* ── BROADCAST TO ALL REMOTES ─────────────────────────────────────────── */
  function broadcast(data) {
    /* Prune stale entries on every broadcast so the count stays accurate */
    connections = connections.filter(function (c) { return c.open; });
    connections.forEach(function (c) { try { c.send(data); } catch (e) {} });
  }

  /* ── UI HELPERS ───────────────────────────────────────────────────────── */
  function updateCount() {
    var n = connections.length;
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

  /* ── PEER ID DERIVED FROM PASSWORD (SHA-256) ──────────────────────────── */
  function toPeerId(password) {
    var data = new TextEncoder().encode('openclaw-rc-v1:' + password);
    return crypto.subtle.digest('SHA-256', data).then(function (buf) {
      var hex = Array.from(new Uint8Array(buf))
        .map(function (b) { return b.toString(16).padStart(2, '0'); })
        .join('');
      return 'ocl-' + hex.slice(0, 20);
    });
  }

  /* ── CHALLENGE-RESPONSE AUTH HELPER ─────────────────────────────────── */
  function computeExpectedResponse(nonce, password) {
    var data = new TextEncoder().encode(nonce + ':openclaw-rc-auth:' + password);
    return crypto.subtle.digest('SHA-256', data).then(function (buf) {
      return Array.from(new Uint8Array(buf))
        .map(function (b) { return b.toString(16).padStart(2, '0'); })
        .join('');
    });
  }

  /* ── REGISTER ONE INCOMING CONNECTION ────────────────────────────────── */
  function registerConn(conn, password) {
    var nonce         = null;
    var authenticated = false;
    var authTimeout   = null;

    conn.on('open', function () {
      /* Generate a random nonce and send it as a challenge */
      nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(function (b) { return b.toString(16).padStart(2, '0'); })
        .join('');
      conn.send({ type: 'challenge', nonce: nonce });

      /* Drop the connection if no valid auth response arrives within 5 s */
      authTimeout = setTimeout(function () {
        if (!authenticated) { try { conn.close(); } catch (e) {} }
      }, 5000);
    });

    conn.on('data', function (data) {
      /* ── PRE-AUTH: only accept the auth response ── */
      if (!authenticated) {
        if (data.type !== 'auth' || !nonce) return;
        computeExpectedResponse(nonce, password).then(function (expected) {
          if (data.response === expected) {
            clearTimeout(authTimeout);
            /* Prune any stale (already-closed) entries first */
            connections = connections.filter(function (c) { return c.open; });
            /* Only one device allowed at a time */
            if (connections.length >= 1) {
              try { conn.send({ type: 'full' }); conn.close(); } catch (e) {}
              return;
            }
            authenticated = true;
            connections.push(conn);
            updateCount();
            /* Auto-close the presenter modal */
            overlay.classList.remove('rc-open');
            var info = currentSlideInfo();
            if (info) conn.send(info);
          } else {
            /* Wrong password — close immediately */
            try { conn.close(); } catch (e) {}
          }
        });
        return;
      }

      /* ── POST-AUTH: handle navigation commands ── */
      var api = window.impress && window.impress();
      if (!api) return;
      if      (data.cmd === 'next')               api.next();
      else if (data.cmd === 'prev')               api.prev();
      else if (data.cmd === 'goto' && data.step)  api.goto(data.step);
    });

    conn.on('close', function () {
      if (authTimeout) clearTimeout(authTimeout);
      connections = connections.filter(function (c) { return c !== conn; });
      updateCount();
    });

    conn.on('error', function () {
      if (authTimeout) clearTimeout(authTimeout);
      connections = connections.filter(function (c) { return c !== conn; });
      updateCount();
    });
  }

  /* ── START SESSION ────────────────────────────────────────────────────── */
  function startSession(password) {
    var setupPanel = document.getElementById('rc-setup-panel');
    var activePanel = document.getElementById('rc-active-panel');
    var setupError  = document.getElementById('rc-setup-error');

    setupError.style.display = 'none';
    setupPanel.style.display  = 'none';
    activePanel.style.display = '';
    updateCount();

    toPeerId(password).then(function (peerId) {
      peer = new Peer(peerId, { debug: 0, config: PEER_ICE_CONFIG });

      peer.on('disconnected', function () {
        /* Lost connection to signalling server — try to restore so mobiles
           can still reach the presenter peer without restarting the session. */
        try { peer.reconnect(); } catch (e) { console.warn('Failed to reconnect to signalling server:', e); }
      });

      peer.on('error', function (err) {
        if (err.type === 'unavailable-id') {
          /* Someone else is holding this peer ID — return to setup so
             the presenter can choose a different password immediately. */
          try { peer.destroy(); } catch (e) {}
          peer = null;
          activePanel.style.display = 'none';
          setupPanel.style.display  = '';
          setupError.textContent    = 'That password is already in use — choose a different one.';
          setupError.style.display  = '';
          document.getElementById('rc-pw-input').focus();
        } else {
          var statusEl = document.getElementById('rc-status');
          if (statusEl) {
            statusEl.textContent = 'Error: ' + (err.message || err.type);
            statusEl.className   = 'rc-error';
          }
        }
      });

      peer.on('open', function () {
        /* Build the remote URL.
           __REMOTE_BASE__ is injected at build time (defaults to the GitHub
           Pages deployment) so mobiles on any network can reach remote.html
           even when the presenter is running locally.                      */
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
        var urlBtn       = document.getElementById('rc-url-btn');
        urlBtn.textContent = remoteUrl;
        urlBtn.onclick     = function () {
          navigator.clipboard.writeText(remoteUrl).then(function () {
            urlBtn.textContent = 'Copied!';
            setTimeout(function () { urlBtn.textContent = remoteUrl; }, 1600);
          });
        };

        updateCount();
      });

      /* Accept incoming phone connections */
      peer.on('connection', function (conn) { registerConn(conn, password); });

      /* Broadcast on every slide change */
      document.addEventListener('impress:stepenter', function () {
        var info = currentSlideInfo();
        if (info) broadcast(info);
      });
    });
  }

  /* ── STOP SESSION ─────────────────────────────────────────────────────── */
  function stopSession() {
    if (peer) { try { peer.destroy(); } catch (e) {} peer = null; }
    connections = [];
    updateCount();
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
