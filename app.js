/* 石径松轩 · Serlane
   Vanilla JS. PeerJS is loaded only when a transfer room is used. */

(function () {
  'use strict';

  const STORAGE_KEY = 'dukou.state.v1';
  const MAX_SITES = 200;
  const CHUNK_SIZE = 64 * 1024;
  const BUFFER_LIMIT = 4 * 1024 * 1024;
  const MAX_ZIP_BYTES = 1024 * 1024 * 1024;
  const MAX_TEXT_LENGTH = 120000;
  const PEER_PREFIX = 'serlane-';
  const PEER_OPTIONS = {
    debug: 0,
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    }
  };

  const els = {
    launcher: document.getElementById('launcher'),
    urlInput: document.getElementById('url-input'),
    urlClear: document.getElementById('url-clear'),
    urlMessage: document.getElementById('url-message'),
    newtabLink: document.getElementById('newtab-link'),

    addSite: document.getElementById('add-site'),
    emptyAdd: document.getElementById('empty-add'),
    emptyState: document.getElementById('empty-state'),
    siteGrid: document.getElementById('site-grid'),
    siteCount: document.getElementById('site-count'),
    siteCardTemplate: document.getElementById('site-card-template'),
    addCardTemplate: document.getElementById('add-card-template'),

    siteDialog: document.getElementById('site-dialog'),
    siteForm: document.getElementById('site-form'),
    siteDialogTitle: document.getElementById('site-dialog-title'),
    siteName: document.getElementById('site-name'),
    siteUrl: document.getElementById('site-url'),
    siteMessage: document.getElementById('site-message'),
    siteSave: document.getElementById('site-save'),
    siteDelete: document.getElementById('site-delete'),

    frameDialog: document.getElementById('frame-dialog'),
    frameTitle: document.getElementById('frame-title'),
    frameHost: document.getElementById('frame-host'),
    frameNewtab: document.getElementById('frame-newtab'),
    frameRedirect: document.getElementById('frame-redirect'),
    frameClose: document.getElementById('frame-close'),
    pageFrame: document.getElementById('page-frame'),

    transferIntro: document.getElementById('transfer-intro'),
    transferRoom: document.getElementById('transfer-room'),
    createRoom: document.getElementById('create-room'),
    roomStatusDot: document.getElementById('room-status-dot'),
    roomStatusText: document.getElementById('room-status-text'),
    retryRoom: document.getElementById('retry-room'),
    leaveRoom: document.getElementById('leave-room'),
    shareBox: document.getElementById('share-box'),
    shareLink: document.getElementById('share-link'),
    copyShare: document.getElementById('copy-share'),
    roomWorkspace: document.getElementById('room-workspace'),
    roomMessage: document.getElementById('transfer-message'),

    messages: document.getElementById('messages'),
    messageEmpty: document.getElementById('message-empty'),
    textForm: document.getElementById('text-form'),
    textInput: document.getElementById('text-input'),
    sendText: document.getElementById('send-text'),

    dropzone: document.getElementById('file-dropzone'),
    pickFiles: document.getElementById('pick-files'),
    pickFolder: document.getElementById('pick-folder'),
    fileInput: document.getElementById('file-input'),
    folderInput: document.getElementById('folder-input'),
    pendingBox: document.getElementById('pending-box'),
    pendingFiles: document.getElementById('pending-files'),
    pendingSummary: document.getElementById('pending-summary'),
    clearPending: document.getElementById('clear-pending'),
    sendFiles: document.getElementById('send-files'),
    transferProgress: document.getElementById('transfer-progress'),
    fileProgressLabel: document.getElementById('file-progress-label'),
    fileProgressPercent: document.getElementById('file-progress-percent'),
    fileProgressBar: document.getElementById('file-progress-bar'),
    fileActivity: document.getElementById('file-activity'),
    fileEmpty: document.getElementById('file-empty'),
    downloadAll: document.getElementById('download-all'),
    receivedCount: document.getElementById('received-count'),

    codecTabs: document.querySelector('.segmented'),
    encodeTab: document.getElementById('encode-tab'),
    decodeTab: document.getElementById('decode-tab'),
    codecInput: document.getElementById('codec-input'),
    codecInputLabel: document.getElementById('codec-input-label'),
    codecInputCount: document.getElementById('codec-input-count'),
    codecOutput: document.getElementById('codec-output'),
    codecOutputLabel: document.getElementById('codec-output-label'),
    codecOutputCount: document.getElementById('codec-output-count'),
    codecStatus: document.getElementById('codec-status'),
    codecCopy: document.getElementById('codec-copy'),
    codecClear: document.getElementById('codec-clear'),

    toast: document.getElementById('toast'),
    toastText: document.getElementById('toast-text'),
    toastAction: document.getElementById('toast-action')
  };

  let state = loadState();
  let editingId = null;
  let siteDialogOpener = null;
  let currentFrameUrl = '';
  let toastTimer = 0;
  let codecMode = 'encode';
  let codecTimer = 0;

  let peer = null;
  let conn = null;
  let role = null;
  let hostId = '';
  let guestTarget = '';
  let connected = false;
  let transferSession = 0;
  let peerScriptPromise = null;
  let connectionTimer = 0;
  let outgoingActive = false;
  let selectedFiles = [];
  let incomingTransfers = new Map();
  let receivedFiles = [];
  let lastProgressPaint = 0;

  const CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let c = n;
      for (let k = 0; k < 8; k += 1) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[n] = c >>> 0;
    }
    return table;
  })();

  /* -------------------------------------------------------------
     Small helpers
  ------------------------------------------------------------- */

  function icon(name) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'icon');
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#' + name);
    svg.appendChild(use);
    return svg;
  }

  function randomId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 11);
  }

  function makeRoomCode() {
    const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
    let suffix = '';
    if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
      const values = new Uint8Array(7);
      window.crypto.getRandomValues(values);
      for (let index = 0; index < values.length; index += 1) {
        suffix += alphabet[values[index] % alphabet.length];
      }
    } else {
      for (let index = 0; index < 7; index += 1) {
        suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
      }
    }
    return PEER_PREFIX + suffix;
  }

  function formatBytes(size) {
    if (!Number.isFinite(size) || size < 0) return '0 B';
    if (size < 1024) return size + ' B';
    const units = ['KB', 'MB', 'GB', 'TB'];
    let value = size / 1024;
    let index = 0;
    while (value >= 1024 && index < units.length - 1) {
      value /= 1024;
      index += 1;
    }
    return (value >= 10 ? value.toFixed(0) : value.toFixed(1)) + ' ' + units[index];
  }

  function basename(filePath) {
    const parts = String(filePath || '').split('/');
    return parts[parts.length - 1] || '文件';
  }

  function sanitizePath(value) {
    let clean = String(value || '')
      .replace(/\\/g, '/')
      .replace(/[\u0000-\u001f\u007f]/g, '')
      .replace(/^\/+/, '');
    const parts = clean.split('/').filter((part) => part && part !== '.' && part !== '..');
    clean = parts.join('/').slice(0, 800);
    return clean || 'file';
  }

  function sanitizeMime(value) {
    const mime = String(value || '').split(';')[0].trim();
    return /^[A-Za-z0-9.+-]+\/[A-Za-z0-9.+-]+$/.test(mime) ? mime : 'application/octet-stream';
  }

  function sleep(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function selectedBytes() {
    return selectedFiles.reduce((sum, entry) => sum + entry.size, 0);
  }

  function receivedBytes() {
    return receivedFiles.reduce((sum, file) => sum + file.size, 0);
  }

  /* -------------------------------------------------------------
     Bookmarks: local persistence
  ------------------------------------------------------------- */

  function loadState() {
    const empty = { version: 3, sites: [] };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return empty;
      const saved = JSON.parse(raw);
      if (!saved || typeof saved !== 'object') return empty;
      const sites = [];
      if (Array.isArray(saved.sites)) {
        saved.sites.slice(0, MAX_SITES).forEach((candidate) => {
          const site = sanitizeStoredSite(candidate);
          if (site) sites.push(site);
        });
      }
      const ids = new Set();
      sites.forEach((site) => {
        if (ids.has(site.id)) site.id = randomId();
        ids.add(site.id);
      });
      return { version: 3, sites };
    } catch (error) {
      return empty;
    }
  }

  function sanitizeStoredSite(candidate) {
    if (!candidate || typeof candidate !== 'object' || typeof candidate.url !== 'string') {
      return null;
    }
    try {
      const parsed = normalizeUrl(candidate.url);
      return {
        id: typeof candidate.id === 'string' && candidate.id ? candidate.id : randomId(),
        title: cleanTitle(candidate.title) || titleFromUrl(parsed),
        url: parsed.href,
        createdAt: Number.isFinite(candidate.createdAt) ? candidate.createdAt : Date.now()
      };
    } catch (error) {
      return null;
    }
  }

  function persistState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 3, sites: state.sites }));
      return true;
    } catch (error) {
      return false;
    }
  }

  function cleanTitle(value) {
    if (typeof value !== 'string') return '';
    return Array.from(
      value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim()
    ).slice(0, 36).join('');
  }

  /* -------------------------------------------------------------
     URLs
  ------------------------------------------------------------- */

  function normalizeUrl(raw) {
    const value = typeof raw === 'string' ? raw.trim() : '';
    if (!value) throw new Error('请输入一个网址');
    if (/\s/.test(value)) throw new Error('网址中不能包含空格');

    let candidate = value;
    if (candidate.startsWith('//')) {
      candidate = 'https:' + candidate;
    } else if (!/^https?:\/\//i.test(candidate)) {
      const looksLikeScheme = /^[a-z][a-z0-9+.-]*:/i.test(candidate);
      const looksLikeHostPort = /^[^/?#]+:\d+(?:[/?#]|$)/.test(candidate);
      if (/^[a-z][a-z0-9+.-]*:\/\//i.test(candidate) || (looksLikeScheme && !looksLikeHostPort)) {
        throw new Error('仅支持 HTTP 与 HTTPS 网址');
      }
      const loopback = /^(localhost|127(?:\.\d{1,3}){3}|\[::1\])(?::\d+)?(?:[/?#]|$)/i.test(candidate);
      candidate = (loopback ? 'http://' : 'https://') + candidate;
    }

    let parsed;
    try {
      parsed = new URL(candidate);
    } catch (error) {
      throw new Error('网址格式不正确');
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('仅支持 HTTP 与 HTTPS 网址');
    }
    if (!parsed.hostname) throw new Error('网址格式不正确');

    const host = parsed.hostname;
    const isIp = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) || host.startsWith('[');
    if (!isIp && host !== 'localhost' && host.indexOf('.') === -1) {
      throw new Error('请输入完整网址');
    }
    return parsed;
  }

  function hostLabel(parsed) {
    const host = parsed.hostname.replace(/^www\./i, '');
    return parsed.port ? host + ':' + parsed.port : host;
  }

  function titleFromUrl(parsed) {
    return hostLabel(parsed) || '新站点';
  }

  function hostForUrl(url) {
    try {
      return hostLabel(new URL(url));
    } catch (error) {
      return url;
    }
  }

  function monogram(title) {
    const first = Array.from(title || '')[0] || '·';
    return /[a-z]/i.test(first) ? first.toUpperCase() : first;
  }

  /* -------------------------------------------------------------
     Bookmark rendering
  ------------------------------------------------------------- */

  function renderSites() {
    const hasSites = state.sites.length > 0;
    els.siteCount.textContent = state.sites.length + ' 个站点';
    els.emptyState.hidden = hasSites;
    els.siteGrid.hidden = !hasSites;

    if (!hasSites) {
      els.siteGrid.replaceChildren();
      return;
    }

    const fragment = document.createDocumentFragment();
    state.sites.forEach((site, index) => {
      const card = els.siteCardTemplate.content.firstElementChild.cloneNode(true);
      card.dataset.siteId = site.id;
      card.style.setProperty('--delay', Math.min(index, 8) * 30 + 'ms');

      const mark = card.querySelector('.site-mark');
      const name = card.querySelector('.site-name');
      const host = card.querySelector('.site-host');
      const edit = card.querySelector('[data-action="edit"]');
      const tab = card.querySelector('[data-mode="tab"]');
      const frameButton = card.querySelector('[data-mode="frame"]');
      const redirectButton = card.querySelector('[data-mode="redirect"]');

      mark.textContent = monogram(site.title);
      name.textContent = site.title;
      name.title = site.title;
      host.textContent = hostForUrl(site.url);
      host.title = site.url;
      edit.setAttribute('aria-label', '编辑 ' + site.title);
      tab.href = site.url;
      tab.setAttribute('aria-label', '在新标签页打开 ' + site.title);
      frameButton.setAttribute('aria-label', '内嵌浏览 ' + site.title);
      redirectButton.setAttribute('aria-label', '在当前页打开 ' + site.title);
      card.querySelector('.site-actions').setAttribute('aria-label', site.title + ' 的打开方式');

      fragment.appendChild(card);
    });

    const addCard = els.addCardTemplate.content.firstElementChild.cloneNode(true);
    fragment.appendChild(addCard);
    els.siteGrid.replaceChildren(fragment);
  }

  function findSite(id) {
    return state.sites.find((site) => site.id === id);
  }

  els.siteGrid.addEventListener('click', (event) => {
    const add = event.target.closest('[data-action="add"]');
    if (add) {
      openSiteDialog(null, add);
      return;
    }

    const edit = event.target.closest('[data-action="edit"]');
    if (edit) {
      const card = edit.closest('.site-card');
      const site = card ? findSite(card.dataset.siteId) : null;
      if (site) openSiteDialog(site, edit);
      return;
    }

    const modeButton = event.target.closest('button.site-action[data-mode]');
    if (!modeButton) return;
    const card = modeButton.closest('.site-card');
    const site = card ? findSite(card.dataset.siteId) : null;
    if (!site) return;

    if (modeButton.dataset.mode === 'frame') {
      openFrame(site.url, site.title);
    } else if (modeButton.dataset.mode === 'redirect') {
      window.location.assign(site.url);
    }
  });

  /* -------------------------------------------------------------
     Add / edit / delete
  ------------------------------------------------------------- */

  function openSiteDialog(site, opener) {
    editingId = site ? site.id : null;
    siteDialogOpener = opener || document.activeElement;
    els.siteForm.reset();
    hideSiteMessage();
    els.siteName.value = site ? site.title : '';
    els.siteUrl.value = site ? site.url : '';
    els.siteDialogTitle.textContent = site ? '编辑站点' : '添加站点';
    els.siteDelete.hidden = !site;

    if (!els.siteDialog.open) els.siteDialog.showModal();
    requestAnimationFrame(() => {
      if (site) {
        els.siteName.focus();
        els.siteName.select();
      } else {
        els.siteUrl.focus();
      }
    });
  }

  function showSiteMessage(message) {
    els.siteMessage.textContent = message;
    els.siteMessage.hidden = false;
  }

  function hideSiteMessage() {
    els.siteMessage.textContent = '';
    els.siteMessage.hidden = true;
  }

  els.siteForm.addEventListener('submit', (event) => {
    event.preventDefault();
    hideSiteMessage();

    let parsed;
    try {
      parsed = normalizeUrl(els.siteUrl.value);
    } catch (error) {
      showSiteMessage(error.message);
      els.siteUrl.focus();
      return;
    }

    const duplicate = state.sites.some((site) => {
      return site.id !== editingId && site.url === parsed.href;
    });
    if (duplicate) {
      showSiteMessage('这个网址已经收藏过了');
      els.siteUrl.focus();
      els.siteUrl.select();
      return;
    }

    if (!editingId && state.sites.length >= MAX_SITES) {
      showSiteMessage('最多收藏 ' + MAX_SITES + ' 个站点');
      return;
    }

    const title = cleanTitle(els.siteName.value) || titleFromUrl(parsed);
    const previousSites = state.sites;

    if (editingId) {
      const index = state.sites.findIndex((site) => site.id === editingId);
      if (index === -1) {
        showSiteMessage('没有找到这个站点');
        return;
      }
      const updated = state.sites.slice();
      updated[index] = {
        id: state.sites[index].id,
        title,
        url: parsed.href,
        createdAt: state.sites[index].createdAt
      };
      state.sites = updated;
    } else {
      state.sites = [{
        id: randomId(),
        title,
        url: parsed.href,
        createdAt: Date.now()
      }].concat(state.sites);
    }

    if (!persistState()) {
      state.sites = previousSites;
      showSiteMessage('浏览器本地存储不可用');
      return;
    }

    els.siteDialog.close();
    renderSites();
    showToast('已保存');
  });

  els.siteDelete.addEventListener('click', () => {
    if (!editingId) return;
    const id = editingId;
    els.siteDialog.close();
    deleteSite(id);
  });

  document.querySelectorAll('[data-close]').forEach((button) => {
    button.addEventListener('click', () => {
      const dialog = document.getElementById(button.dataset.close);
      if (dialog) dialog.close();
    });
  });

  els.siteDialog.addEventListener('click', (event) => {
    if (event.target === els.siteDialog) els.siteDialog.close();
  });

  els.siteDialog.addEventListener('close', () => {
    editingId = null;
    els.siteForm.reset();
    hideSiteMessage();
    if (siteDialogOpener && siteDialogOpener.isConnected) {
      siteDialogOpener.focus({ preventScroll: true });
    }
    siteDialogOpener = null;
  });

  function deleteSite(id) {
    const index = state.sites.findIndex((site) => site.id === id);
    if (index === -1) return;
    const deleted = state.sites[index];
    const previous = state.sites;
    const next = state.sites.slice();
    next.splice(index, 1);
    state.sites = next;

    if (!persistState()) {
      state.sites = previous;
      showToast('删除失败');
      return;
    }

    renderSites();
    showToast('已删除', {
      label: '撤销',
      callback: () => {
        if (state.sites.some((site) => site.id === deleted.id)) return;
        const before = state.sites;
        const restored = state.sites.slice();
        restored.splice(Math.min(index, restored.length), 0, deleted);
        state.sites = restored;
        if (!persistState()) {
          state.sites = before;
          showToast('恢复失败');
          return;
        }
        renderSites();
        showToast('已恢复');
      }
    });
  }

  [els.addSite, els.emptyAdd].forEach((button) => {
    button.addEventListener('click', () => openSiteDialog(null, button));
  });

  /* -------------------------------------------------------------
     URL launcher
  ------------------------------------------------------------- */

  function updateNewTabLink() {
    const value = els.urlInput.value.trim();
    els.urlClear.hidden = els.urlInput.value.length === 0;
    if (!value) {
      els.newtabLink.href = '#';
      els.newtabLink.setAttribute('aria-disabled', 'true');
      return;
    }
    try {
      const parsed = normalizeUrl(value);
      els.newtabLink.href = parsed.href;
      els.newtabLink.removeAttribute('aria-disabled');
    } catch (error) {
      els.newtabLink.href = '#';
      els.newtabLink.setAttribute('aria-disabled', 'true');
    }
  }

  function showUrlError(message) {
    els.urlMessage.textContent = message;
    els.urlMessage.hidden = false;
    els.launcher.classList.add('is-invalid');
    els.urlInput.setAttribute('aria-invalid', 'true');
    els.urlInput.focus();
  }

  function hideUrlError() {
    els.urlMessage.textContent = '';
    els.urlMessage.hidden = true;
    els.launcher.classList.remove('is-invalid');
    els.urlInput.removeAttribute('aria-invalid');
  }

  function parsedInputOrError() {
    try {
      const parsed = normalizeUrl(els.urlInput.value);
      hideUrlError();
      return parsed;
    } catch (error) {
      showUrlError(error.message);
      return null;
    }
  }

  function submitUrl() {
    updateNewTabLink();
    if (els.newtabLink.getAttribute('aria-disabled') === 'true') {
      try {
        normalizeUrl(els.urlInput.value);
      } catch (error) {
        showUrlError(error.message);
      }
      return;
    }
    hideUrlError();
    els.newtabLink.click();
  }

  els.newtabLink.addEventListener('click', (event) => {
    try {
      const parsed = normalizeUrl(els.urlInput.value);
      els.newtabLink.href = parsed.href;
      hideUrlError();
    } catch (error) {
      event.preventDefault();
      showUrlError(error.message);
    }
  });

  els.launcher.addEventListener('submit', (event) => {
    event.preventDefault();
    submitUrl();
  });

  els.urlInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submitUrl();
    }
  });

  els.urlInput.addEventListener('input', () => {
    updateNewTabLink();
    if (!els.urlMessage.hidden) hideUrlError();
  });

  els.urlClear.addEventListener('click', () => {
    els.urlInput.value = '';
    updateNewTabLink();
    hideUrlError();
    els.urlInput.focus();
  });

  document.querySelectorAll('.mode-button[data-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      const parsed = parsedInputOrError();
      if (!parsed) return;
      if (button.dataset.mode === 'frame') {
        openFrame(parsed.href, titleFromUrl(parsed));
      } else if (button.dataset.mode === 'redirect') {
        window.location.assign(parsed.href);
      }
    });
  });

  /* -------------------------------------------------------------
     Inline browser
  ------------------------------------------------------------- */

  function openFrame(url, title) {
    currentFrameUrl = url;
    els.frameTitle.textContent = title || '内嵌浏览';
    els.frameTitle.title = title || url;
    els.frameHost.textContent = hostForUrl(url);
    els.frameHost.title = url;
    els.frameNewtab.href = url;
    els.frameRedirect.dataset.url = url;
    if (!els.frameDialog.open) els.frameDialog.showModal();
    els.frameClose.focus({ preventScroll: true });
    els.pageFrame.src = url;
  }

  function closeFrame() {
    if (els.frameDialog.open) els.frameDialog.close();
  }

  els.frameDialog.addEventListener('close', () => {
    currentFrameUrl = '';
    els.pageFrame.src = 'about:blank';
    els.frameNewtab.href = 'about:blank';
    els.frameRedirect.removeAttribute('data-url');
  });

  els.frameDialog.addEventListener('click', (event) => {
    if (event.target === els.frameDialog) closeFrame();
  });

  els.frameClose.addEventListener('click', closeFrame);

  els.frameRedirect.addEventListener('click', () => {
    if (!currentFrameUrl) return;
    window.location.assign(currentFrameUrl);
  });

  /* -------------------------------------------------------------
     Base64
  ------------------------------------------------------------- */

  function setCodecMode(mode) {
    codecMode = mode === 'decode' ? 'decode' : 'encode';
    const decode = codecMode === 'decode';
    els.encodeTab.classList.toggle('is-active', !decode);
    els.decodeTab.classList.toggle('is-active', decode);
    els.encodeTab.setAttribute('aria-pressed', !decode ? 'true' : 'false');
    els.decodeTab.setAttribute('aria-pressed', decode ? 'true' : 'false');
    els.codecInputLabel.textContent = decode ? 'Base64' : '原文';
    els.codecOutputLabel.textContent = '结果';
    els.codecInput.placeholder = decode ? '粘贴 Base64 字符串…' : '在这里输入文字…';
    els.codecOutput.placeholder = '结果会出现在这里';
    runCodec();
  }

  function scheduleCodec() {
    window.clearTimeout(codecTimer);
    codecTimer = window.setTimeout(runCodec, 80);
  }

  function runCodec() {
    window.clearTimeout(codecTimer);
    const value = els.codecInput.value;
    els.codecInputCount.textContent = value.length + ' 字符';

    if (!value) {
      els.codecOutput.value = '';
      els.codecOutputCount.textContent = '0 字符';
      els.codecCopy.disabled = true;
      setCodecStatus('');
      return;
    }

    try {
      if (codecMode === 'encode') {
        const bytes = new TextEncoder().encode(value);
        els.codecOutput.value = bytesToBase64(bytes);
      } else {
        els.codecOutput.value = decodeBase64Text(value);
      }
      els.codecOutputCount.textContent = els.codecOutput.value.length + ' 字符';
      els.codecCopy.disabled = false;
      setCodecStatus('');
    } catch (error) {
      els.codecOutput.value = '';
      els.codecOutputCount.textContent = '0 字符';
      els.codecCopy.disabled = true;
      setCodecStatus(error && error.message ? error.message : '转换失败');
    }
  }

  function setCodecStatus(message) {
    els.codecStatus.textContent = message || '';
    els.codecStatus.hidden = !message;
  }

  function bytesToBase64(bytes) {
    let binary = '';
    for (let index = 0; index < bytes.length; index += 0x8000) {
      const chunk = bytes.subarray(index, index + 0x8000);
      binary += String.fromCharCode.apply(null, chunk);
    }
    return btoa(binary);
  }

  function decodeBase64Text(input) {
    const clean = input.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
    if (!clean) return '';
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean)) throw new Error('Base64 格式不正确');
    const unpadded = clean.replace(/=+$/, '');
    if (unpadded.length % 4 === 1) throw new Error('Base64 格式不正确');
    const padded = unpadded + '='.repeat((4 - (unpadded.length % 4)) % 4);

    let binary;
    try {
      binary = atob(padded);
    } catch (error) {
      throw new Error('Base64 格式不正确');
    }

    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch (error) {
      throw new Error('不是有效的 UTF-8 文本');
    }
  }

  els.encodeTab.addEventListener('click', () => setCodecMode('encode'));
  els.decodeTab.addEventListener('click', () => setCodecMode('decode'));
  els.codecInput.addEventListener('input', scheduleCodec);

  els.codecClear.addEventListener('click', () => {
    window.clearTimeout(codecTimer);
    els.codecInput.value = '';
    els.codecOutput.value = '';
    els.codecInputCount.textContent = '0 字符';
    els.codecOutputCount.textContent = '0 字符';
    els.codecCopy.disabled = true;
    setCodecStatus('');
    els.codecInput.focus();
  });

  els.codecCopy.addEventListener('click', () => {
    if (!els.codecOutput.value) {
      showToast('没有可复制的结果');
      return;
    }
    copyToClipboard(els.codecOutput.value)
      .then(() => showToast('已复制'))
      .catch(() => showToast('复制失败，请手动选择'));
  });

  /* -------------------------------------------------------------
     Transfer: PeerJS loading and session state
  ------------------------------------------------------------- */

  function connectionOnline() {
    return Boolean(connected && conn && conn.open);
  }

  function setRoomStatus(kind, text) {
    els.roomStatusDot.className = 'status-dot';
    if (kind === 'waiting') els.roomStatusDot.classList.add('is-waiting');
    if (kind === 'online') els.roomStatusDot.classList.add('is-online');
    if (kind === 'error') els.roomStatusDot.classList.add('is-error');
    els.roomStatusText.textContent = text;
  }

  function showRoomMessage(message) {
    els.roomMessage.textContent = message || '';
    els.roomMessage.hidden = !message;
  }

  function showTransferRoom() {
    els.transferIntro.hidden = true;
    els.transferRoom.hidden = false;
  }

  function updateRoomControls() {
    const online = connectionOnline();
    els.textInput.disabled = !online;
    els.sendText.disabled = !online || !els.textInput.value.trim();
    els.pickFiles.disabled = !online || outgoingActive;
    els.pickFolder.disabled = !online || outgoingActive;
    els.sendFiles.disabled = !online || outgoingActive || selectedFiles.length === 0;
    els.clearPending.disabled = outgoingActive;
    els.roomWorkspace.classList.toggle('is-offline', !online);
    els.dropzone.classList.toggle('is-offline', !online);
    els.dropzone.setAttribute('aria-disabled', online ? 'false' : 'true');
  }

  function loadPeerJS() {
    if (window.Peer) return Promise.resolve(window.Peer);
    if (peerScriptPromise) return peerScriptPromise;
    if (!window.RTCPeerConnection) {
      return Promise.reject(new Error('当前浏览器不支持 WebRTC'));
    }

    peerScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'peerjs.min.js';
      script.async = true;
      script.onload = () => {
        if (window.Peer) {
          resolve(window.Peer);
        } else {
          peerScriptPromise = null;
          reject(new Error('P2P 组件加载失败'));
        }
      };
      script.onerror = () => {
        peerScriptPromise = null;
        reject(new Error('P2P 组件加载失败，请检查网络'));
      };
      document.head.appendChild(script);
    });

    return peerScriptPromise;
  }

  function peerErrorObject(event) {
    const error = new Error(
      (event && event.message) || (event && event.type) || 'P2P 连接失败'
    );
    error.type = event && event.type;
    return error;
  }

  function openPeer(id) {
    return new Promise((resolve, reject) => {
      let candidate;
      try {
        candidate = new window.Peer(id || undefined, PEER_OPTIONS);
      } catch (error) {
        reject(error);
        return;
      }

      let settled = false;
      const timer = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        try { candidate.destroy(); } catch (error) {}
        reject(new Error('连接信令服务超时，请检查网络'));
      }, 16000);

      candidate.on('open', () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        resolve(candidate);
      });

      candidate.on('error', (error) => {
        if (!settled) {
          settled = true;
          window.clearTimeout(timer);
          try { candidate.destroy(); } catch (destroyError) {}
          reject(peerErrorObject(error));
          return;
        }
        handlePeerError(error);
      });
    });
  }

  async function openHostPeer() {
    let lastError = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await openPeer(makeRoomCode());
      } catch (error) {
        lastError = error;
        if (error.type !== 'unavailable-id') throw error;
      }
    }
    throw lastError || new Error('无法创建房间');
  }

  function handlePeerError(event) {
    if (!role) return;
    const type = event && event.type;
    if (type === 'peer-unavailable') {
      if (role === 'guest' && !connected) {
        failRoom('没有找到这个传输房间，链接可能已经失效');
      }
      return;
    }
    if (type === 'browser-incompatible') {
      if (!connected) failRoom('当前浏览器不支持 WebRTC 传输');
      return;
    }
    if (!connected && ['network', 'server-error', 'socket-error', 'socket-closed', 'unavailable-id'].includes(type)) {
      failRoom('信令服务连接失败，请检查网络后重试');
    }
  }

  function failRoom(message) {
    setRoomStatus('error', '连接失败');
    els.retryRoom.hidden = false;
    els.shareBox.hidden = true;
    showRoomMessage(message);
    connected = false;
    updateRoomControls();
  }

  function failConnection(message) {
    const oldConnection = conn;
    conn = null;
    connected = false;
    window.clearTimeout(connectionTimer);
    if (oldConnection) {
      try { oldConnection.close(); } catch (error) {}
    }
    markIncomingAsFailed();
    outgoingActive = false;
    els.transferProgress.hidden = true;
    updateRoomControls();

    if (role === 'host' && peer && !peer.destroyed) {
      setRoomStatus('waiting', '等待另一台设备');
      els.retryRoom.hidden = true;
      els.leaveRoom.disabled = false;
      els.shareBox.hidden = !hostId;
    } else {
      setRoomStatus('error', '连接失败');
      els.retryRoom.hidden = false;
    }
    showRoomMessage(message);
    if (selectedFiles.length) renderPendingFiles();
  }

  function onConnectionOpen(token) {
    if (token !== transferSession) return;
    if (connected) return;
    connected = true;
    window.clearTimeout(connectionTimer);
    setRoomStatus('online', '已连接');
    showRoomMessage('');
    els.retryRoom.hidden = true;
    els.shareBox.hidden = true;
    els.messageEmpty.textContent = '已连接，发一段文字试试。';
    els.messageEmpty.hidden = els.messages.querySelector('.message') !== null;
    updateRoomControls();
    try {
      conn.send({ type: 'hello', version: 1 });
    } catch (error) {}
    showToast('已连接');
  }

  function bindConnection(candidate, token) {
    conn = candidate;
    window.clearTimeout(connectionTimer);
    connectionTimer = window.setTimeout(() => {
      if (conn === candidate && !connected) {
        failConnection('连接超时，请重试');
      }
    }, 22000);

    candidate.on('open', () => {
      if (conn !== candidate) return;
      onConnectionOpen(token);
    });

    candidate.on('data', (data) => {
      if (conn !== candidate) return;
      handlePacket(data);
    });

    candidate.on('close', () => {
      if (conn !== candidate) return;
      onConnectionClosed();
    });

    candidate.on('error', () => {
      if (conn !== candidate) return;
      if (!connected) {
        failConnection('连接失败，请重试');
      }
    });

    if (candidate.open) onConnectionOpen(token);
  }

  function onConnectionClosed() {
    const wasConnected = connected;
    connected = false;
    conn = null;
    window.clearTimeout(connectionTimer);
    markIncomingAsFailed();
    outgoingActive = false;
    els.transferProgress.hidden = true;
    updateRoomControls();

    if (role === 'host' && peer && !peer.destroyed) {
      setRoomStatus('waiting', '等待重新连接');
      els.retryRoom.hidden = true;
      els.shareBox.hidden = !hostId;
    } else {
      setRoomStatus('error', '连接已断开');
      els.retryRoom.hidden = false;
    }
    if (wasConnected) {
      showRoomMessage('连接已断开，可以重新打开分享链接或重新连接。');
      showToast('连接已断开');
    }
    if (selectedFiles.length) renderPendingFiles();
  }

  function handleIncomingConnection(incoming, token) {
    if (role !== 'host' || token !== transferSession) {
      try { incoming.close(); } catch (error) {}
      return;
    }

    if (conn && conn.open) {
      incoming.on('open', () => {
        try { incoming.send({ type: 'notice', message: '房间已有设备连接' }); } catch (error) {}
        window.setTimeout(() => {
          try { incoming.close(); } catch (error) {}
        }, 250);
      });
      return;
    }

    if (conn) {
      const previous = conn;
      conn = null;
      try { previous.close(); } catch (error) {}
    }
    bindConnection(incoming, token);
  }

  async function startHostRoom() {
    const token = ++transferSession;
    role = 'host';
    hostId = '';
    guestTarget = '';
    connected = false;
    closeConnectionOnly();
    showTransferRoom();
    els.shareBox.hidden = true;
    els.retryRoom.hidden = true;
    setRoomStatus('waiting', '正在准备房间…');
    showRoomMessage('');
    updateRoomControls();

    try {
      await loadPeerJS();
      if (token !== transferSession) return;
      const newPeer = await openHostPeer();
      if (token !== transferSession) {
        try { newPeer.destroy(); } catch (error) {}
        return;
      }
      peer = newPeer;
      hostId = newPeer.id;
      els.shareLink.value = buildShareUrl(newPeer.id);
      els.shareBox.hidden = false;
      setRoomStatus('waiting', '等待另一台设备');
      newPeer.on('connection', (incoming) => handleIncomingConnection(incoming, token));
    } catch (error) {
      if (token !== transferSession) return;
      setRoomStatus('error', '房间创建失败');
      showRoomMessage(error && error.message ? error.message : '无法创建传输房间');
      els.retryRoom.hidden = false;
      updateRoomControls();
    }
  }

  async function startGuestRoom(target) {
    const token = ++transferSession;
    role = 'guest';
    guestTarget = target;
    hostId = target;
    connected = false;
    closeConnectionOnly();
    showTransferRoom();
    els.shareBox.hidden = true;
    els.retryRoom.hidden = true;
    setRoomStatus('waiting', '正在寻找房间…');
    showRoomMessage('');
    updateRoomControls();
    window.setTimeout(() => {
      const section = document.getElementById('transfer');
      if (section) section.scrollIntoView({ block: 'start' });
    }, 80);

    try {
      await loadPeerJS();
      if (token !== transferSession) return;
      const guestPeer = await openPeer(null);
      if (token !== transferSession) {
        try { guestPeer.destroy(); } catch (error) {}
        return;
      }
      peer = guestPeer;
      const connection = guestPeer.connect(target, {
        reliable: true,
        serialization: 'binary'
      });
      if (!connection) throw new Error('无法发起连接');
      bindConnection(connection, token);
    } catch (error) {
      if (token !== transferSession) return;
      setRoomStatus('error', '连接失败');
      showRoomMessage(error && error.message ? error.message : '找不到这个传输房间');
      els.retryRoom.hidden = false;
      updateRoomControls();
    }
  }

  function closeConnectionOnly() {
    if (conn) {
      const current = conn;
      conn = null;
      try { current.close(); } catch (error) {}
    }
    window.clearTimeout(connectionTimer);
    connected = false;
  }

  function closePeer() {
    transferSession += 1;
    closeConnectionOnly();
    if (peer) {
      const current = peer;
      peer = null;
      try { current.destroy(); } catch (error) {}
    }
    markIncomingAsFailed();
    outgoingActive = false;
    els.transferProgress.hidden = true;
    updateRoomControls();
  }

  function retryRoom() {
    const target = guestTarget;
    const retryAsGuest = role === 'guest' && Boolean(target);
    closePeer();
    role = null;
    guestTarget = '';
    hostId = '';
    connected = false;
    showRoomMessage('');
    els.retryRoom.hidden = true;
    if (retryAsGuest) {
      startGuestRoom(target);
    } else {
      startHostRoom();
    }
  }

  function leaveRoom() {
    closePeer();
    role = null;
    hostId = '';
    guestTarget = '';
    connected = false;
    resetTransferContent();
    if (location.hash.startsWith('#p2p=')) {
      history.replaceState(null, '', location.pathname + location.search);
    }
  }

  function buildShareUrl(id) {
    const base = location.origin && location.origin !== 'null'
      ? location.origin + location.pathname
      : location.href.split('#')[0];
    return base + location.search + '#p2p=' + encodeURIComponent(id);
  }

  function roomTargetFromHash() {
    const match = location.hash.match(/^#p2p=([A-Za-z0-9_-]{3,80})$/);
    return match ? match[1] : '';
  }

  /* -------------------------------------------------------------
     Transfer: interface state
  ------------------------------------------------------------- */

  function resetTransferContent() {
    const messages = Array.from(els.messages.querySelectorAll('.message'));
    messages.forEach((message) => message.remove());
    els.messageEmpty.hidden = false;
    els.messageEmpty.textContent = '连接后，发一段文字试试。';
    els.textInput.value = '';
    els.textInput.disabled = true;
    els.sendText.disabled = true;

    selectedFiles = [];
    renderPendingFiles();
    els.fileInput.value = '';
    els.folderInput.value = '';
    incomingTransfers.clear();
    receivedFiles = [];
    Array.from(els.fileActivity.querySelectorAll('.file-item')).forEach((row) => row.remove());
    els.fileEmpty.hidden = false;
    els.downloadAll.hidden = true;
    els.receivedCount.hidden = true;
    els.receivedCount.textContent = '';
    els.transferProgress.hidden = true;
    els.fileProgressBar.style.width = '0%';
    els.fileProgressPercent.textContent = '0%';

    els.shareLink.value = '';
    els.shareBox.hidden = true;
    els.retryRoom.hidden = true;
    showRoomMessage('');
    setRoomStatus('', '正在准备…');
    els.transferRoom.hidden = true;
    els.transferIntro.hidden = false;
    updateRoomControls();
  }

  function addMessage(text, direction) {
    const message = document.createElement('div');
    message.className = 'message ' + (direction === 'out' ? 'is-out' : 'is-in');

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = text;
    message.appendChild(bubble);

    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'message-copy';
    const label = document.createElement('span');
    label.textContent = '复制';
    copy.appendChild(icon('i-copy'));
    copy.appendChild(label);
    copy.addEventListener('click', () => {
      copyToClipboard(text)
        .then(() => {
          label.textContent = '已复制';
          window.setTimeout(() => { label.textContent = '复制'; }, 1400);
        })
        .catch(() => showToast('复制失败'));
    });
    message.appendChild(copy);

    els.messageEmpty.hidden = true;
    els.messages.appendChild(message);
    els.messages.scrollTop = els.messages.scrollHeight;
  }

  function updateTextButton() {
    els.sendText.disabled = !connectionOnline() || !els.textInput.value.trim();
  }

  function sendTextMessage() {
    if (!connectionOnline()) {
      showToast('还没有建立连接');
      return;
    }
    const text = els.textInput.value.trim();
    if (!text) return;
    if (text.length > MAX_TEXT_LENGTH) {
      showToast('文字太长了，请分成几段发送');
      return;
    }
    try {
      conn.send({ type: 'text', id: randomId(), text });
      addMessage(text, 'out');
      els.textInput.value = '';
      updateTextButton();
    } catch (error) {
      showRoomMessage('文字发送失败，请重试');
    }
  }

  els.textInput.addEventListener('input', updateTextButton);
  els.textInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      sendTextMessage();
    }
  });
  els.textForm.addEventListener('submit', (event) => {
    event.preventDefault();
    sendTextMessage();
  });

  els.copyShare.addEventListener('click', () => {
    if (!els.shareLink.value) return;
    copyToClipboard(els.shareLink.value)
      .then(() => showToast('链接已复制'))
      .catch(() => showToast('复制失败，请手动选择'));
  });

  els.retryRoom.addEventListener('click', retryRoom);
  els.leaveRoom.addEventListener('click', leaveRoom);
  els.createRoom.addEventListener('click', startHostRoom);

  /* -------------------------------------------------------------
     Transfer: incoming packets
  ------------------------------------------------------------- */

  function handlePacket(packet) {
    if (!packet || typeof packet !== 'object') return;
    switch (packet.type) {
      case 'text':
        if (typeof packet.text === 'string' && packet.text) {
          addMessage(packet.text.slice(0, MAX_TEXT_LENGTH), 'in');
        }
        break;
      case 'file-start':
        receiveFileStart(packet);
        break;
      case 'file-chunk':
        receiveFileChunk(packet);
        break;
      case 'file-end':
        receiveFileEnd(packet);
        break;
      case 'file-cancel':
        receiveFileCancel(packet);
        break;
      case 'notice':
        if (packet.message) showRoomMessage(String(packet.message));
        break;
      default:
        break;
    }
  }

  function receiveFileStart(packet) {
    const id = typeof packet.id === 'string' ? packet.id : '';
    if (!id || incomingTransfers.has(id)) return;
    const path = sanitizePath(packet.path);
    const size = Number(packet.size);
    if (!Number.isFinite(size) || size < 0) return;
    const mime = sanitizeMime(packet.mime);
    const row = createFileRow(id, path, size, 'in');
    const transfer = {
      id,
      path,
      size,
      mime,
      received: 0,
      chunks: [],
      crcState: 0xFFFFFFFF,
      row,
      lastPaint: 0
    };
    incomingTransfers.set(id, transfer);
    setFileRowStatus(row, '正在接收');
    scrollFileActivity();
  }

  function receiveFileChunk(packet) {
    const data = packet && packet.data;
    const transfer = incomingTransfers.get(packet.id);
    if (!transfer || !data) return;

    let bytes;
    if (data instanceof ArrayBuffer) {
      bytes = new Uint8Array(data);
    } else if (ArrayBuffer.isView(data)) {
      bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    } else {
      return;
    }

    if (transfer.received + bytes.length > transfer.size) {
      bytes = bytes.subarray(0, Math.max(0, transfer.size - transfer.received));
    }
    if (!bytes.length) return;

    transfer.chunks.push(bytes);
    transfer.crcState = updateCrc32(transfer.crcState, bytes);
    transfer.received += bytes.length;

    const now = performance.now();
    if (now - transfer.lastPaint > 80 || transfer.received >= transfer.size) {
      transfer.lastPaint = now;
      setFileProgressBytes(transfer.row, transfer.received, transfer.size, '正在接收');
    }
  }

  function receiveFileEnd(packet) {
    const transfer = incomingTransfers.get(packet.id);
    if (!transfer) return;
    incomingTransfers.delete(packet.id);

    const blob = new Blob(transfer.chunks, { type: transfer.mime });
    transfer.chunks.length = 0;
    const file = {
      id: transfer.id,
      path: transfer.path,
      name: basename(transfer.path),
      size: blob.size,
      mime: transfer.mime,
      blob,
      crc: (transfer.crcState ^ 0xFFFFFFFF) >>> 0
    };
    receivedFiles.push(file);
    completeFileRow(transfer.row, '已接收', true);
    updateReceivedMeta();
    scrollFileActivity();
  }

  function receiveFileCancel(packet) {
    const transfer = incomingTransfers.get(packet.id);
    if (!transfer) return;
    incomingTransfers.delete(packet.id);
    transfer.chunks.length = 0;
    markFileRowError(transfer.row, '传输已取消');
  }

  function markIncomingAsFailed() {
    incomingTransfers.forEach((transfer) => {
      transfer.chunks.length = 0;
      markFileRowError(transfer.row, '连接中断');
    });
    incomingTransfers.clear();
  }

  function updateCrc32(crc, bytes) {
    let state = crc;
    for (let index = 0; index < bytes.length; index += 1) {
      state = (state >>> 8) ^ CRC_TABLE[(state ^ bytes[index]) & 0xFF];
    }
    return state >>> 0;
  }

  /* -------------------------------------------------------------
     Transfer: file selection and sending
  ------------------------------------------------------------- */

  function addPendingFiles(fileList) {
    if (!connectionOnline() || outgoingActive) return;
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const seen = new Set();
    const next = [];
    files.forEach((item) => {
      const file = item && item.file ? item.file : item;
      if (!file) return;
      const path = sanitizePath(item && item.path ? item.path : (file.webkitRelativePath || file.name));
      const key = path + '\u0000' + file.size + '\u0000' + file.lastModified;
      if (seen.has(key)) return;
      seen.add(key);
      next.push({ file, path, size: file.size });
    });

    next.sort((a, b) => a.path.localeCompare(b.path, 'zh-Hans-CN'));
    selectedFiles = next;
    renderPendingFiles();
    updateRoomControls();
    els.fileInput.value = '';
    els.folderInput.value = '';
  }

  function renderPendingFiles() {
    els.pendingFiles.replaceChildren();
    if (!selectedFiles.length) {
      els.pendingBox.hidden = true;
      els.pendingSummary.textContent = '';
      return;
    }

    const fragment = document.createDocumentFragment();
    selectedFiles.forEach((entry, index) => {
      const row = document.createElement('li');
      row.className = 'pending-item';

      const name = document.createElement('span');
      name.className = 'pending-name';
      name.textContent = entry.path;
      name.title = entry.path;
      row.appendChild(name);

      const size = document.createElement('span');
      size.className = 'pending-size';
      size.textContent = formatBytes(entry.size);
      row.appendChild(size);

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'pending-remove';
      remove.setAttribute('aria-label', '移除 ' + entry.path);
      remove.dataset.removeIndex = String(index);
      remove.appendChild(icon('i-close'));
      row.appendChild(remove);

      fragment.appendChild(row);
    });

    els.pendingFiles.appendChild(fragment);
    els.pendingBox.hidden = false;
    els.pendingSummary.textContent = selectedFiles.length + ' 个文件 · ' + formatBytes(selectedBytes());
  }

  els.pendingFiles.addEventListener('click', (event) => {
    const remove = event.target.closest('[data-remove-index]');
    if (!remove || outgoingActive) return;
    const index = Number(remove.dataset.removeIndex);
    if (!Number.isInteger(index)) return;
    selectedFiles.splice(index, 1);
    renderPendingFiles();
    updateRoomControls();
  });

  els.clearPending.addEventListener('click', () => {
    if (outgoingActive) return;
    selectedFiles = [];
    renderPendingFiles();
    updateRoomControls();
  });

  els.pickFiles.addEventListener('click', () => {
    if (connectionOnline() && !outgoingActive) els.fileInput.click();
  });
  els.pickFolder.addEventListener('click', () => {
    if (connectionOnline() && !outgoingActive) els.folderInput.click();
  });
  els.fileInput.addEventListener('change', (event) => addPendingFiles(event.target.files));
  els.folderInput.addEventListener('change', (event) => addPendingFiles(event.target.files));

  els.dropzone.addEventListener('click', (event) => {
    if (event.target.closest('button') || !connectionOnline() || outgoingActive) return;
    els.fileInput.click();
  });

  ['dragenter', 'dragover'].forEach((type) => {
    els.dropzone.addEventListener(type, (event) => {
      event.preventDefault();
      if (connectionOnline() && !outgoingActive) els.dropzone.classList.add('is-dragging');
    });
  });

  ['dragleave', 'drop'].forEach((type) => {
    els.dropzone.addEventListener(type, (event) => {
      event.preventDefault();
      els.dropzone.classList.remove('is-dragging');
    });
  });

  els.dropzone.addEventListener('drop', async (event) => {
    if (!connectionOnline() || outgoingActive) return;
    const items = event.dataTransfer && event.dataTransfer.items;
    if (!items || !items.length) {
      addPendingFiles(event.dataTransfer.files);
      return;
    }

    const collected = [];
    const entries = [];
    for (let index = 0; index < items.length; index += 1) {
      if (typeof items[index].webkitGetAsEntry === 'function') {
        const entry = items[index].webkitGetAsEntry();
        if (entry) entries.push(entry);
      }
    }

    if (!entries.length) {
      addPendingFiles(event.dataTransfer.files);
      return;
    }

    for (const entry of entries) {
      const result = await readEntry(entry, '');
      collected.push(...result);
    }
    addPendingFiles(collected);
  });

  function readEntry(entry, basePath) {
    return new Promise((resolve) => {
      if (entry.isFile) {
        entry.file((file) => {
          const filePath = sanitizePath(basePath + file.name);
          resolve([{ file, path: filePath }]);
        }, () => resolve([]));
        return;
      }

      if (!entry.isDirectory) {
        resolve([]);
        return;
      }

      const reader = entry.createReader();
      const prefix = basePath + entry.name + '/';
      const all = [];

      const readBatch = () => {
        reader.readEntries(async (batch) => {
          if (!batch.length) {
            resolve(all);
            return;
          }
          for (const child of batch) {
            const childFiles = await readEntry(child, prefix);
            all.push(...childFiles);
          }
          readBatch();
        }, () => resolve(all));
      };
      readBatch();
    });
  }

  async function waitForChannel() {
    if (!connectionOnline()) throw new Error('连接已断开');
    const channel = conn.dataChannel;
    if (!channel) {
      await sleep(1);
      return;
    }

    let guard = 0;
    while (connectionOnline() && channel.bufferedAmount > BUFFER_LIMIT) {
      await sleep(16);
      guard += 1;
      if (guard > 3000) throw new Error('发送缓冲区超时');
    }
    if (!connectionOnline()) throw new Error('连接已断开');
  }

  async function sendSelectedFiles() {
    if (!connectionOnline() || outgoingActive || !selectedFiles.length) return;

    const batch = selectedFiles.slice();
    const totalBytes = batch.reduce((sum, entry) => sum + entry.size, 0);
    outgoingActive = true;
    els.pendingBox.hidden = true;
    els.transferProgress.hidden = false;
    els.fileProgressBar.style.width = '0%';
    els.fileProgressPercent.textContent = '0%';
    showRoomMessage('');
    updateRoomControls();

    let completedBytes = 0;
    let activeRow = null;
    let activeId = '';
    lastProgressPaint = 0;

    try {
      if (!connectionOnline()) throw new Error('连接已断开');

      for (let index = 0; index < batch.length; index += 1) {
        const entry = batch[index];
        const id = randomId();
        activeId = id;
        activeRow = createFileRow(id, entry.path, entry.size, 'out');
        setFileRowStatus(activeRow, '正在发送');
        scrollFileActivity();

        conn.send({
          type: 'file-start',
          id,
          path: entry.path,
          size: entry.size,
          mime: entry.file.type || 'application/octet-stream'
        });

        let offset = 0;
        while (offset < entry.size) {
          const slice = entry.file.slice(offset, Math.min(offset + CHUNK_SIZE, entry.size));
          const buffer = await slice.arrayBuffer();
          await waitForChannel();
          conn.send({ type: 'file-chunk', id, data: buffer });
          offset += buffer.byteLength;

          const overall = totalBytes > 0
            ? (completedBytes + offset) / totalBytes
            : (index + 1) / batch.length;
          const rowFraction = entry.size > 0 ? offset / entry.size : 1;
          setFileProgressPercent(activeRow, rowFraction * 100, '正在发送');
          updateOverallProgress(index, batch.length, entry.path, overall);
        }

        conn.send({ type: 'file-end', id });
        completeFileRow(activeRow, '已发送', false);
        completedBytes += entry.size;
        updateOverallProgress(index + 1, batch.length, entry.path, totalBytes > 0 ? completedBytes / totalBytes : 1);
      }

      selectedFiles = [];
      renderPendingFiles();
      els.transferProgress.hidden = true;
      showToast('文件已发送');
    } catch (error) {
      if (activeRow) markFileRowError(activeRow, '发送中断');
      if (activeId) {
        try {
          if (connectionOnline()) conn.send({ type: 'file-cancel', id: activeId });
        } catch (sendError) {}
      }
      els.transferProgress.hidden = true;
      showRoomMessage(error && error.message ? error.message : '文件发送失败');
      if (selectedFiles.length) renderPendingFiles();
    } finally {
      outgoingActive = false;
      updateRoomControls();
    }
  }

  function updateOverallProgress(index, total, path, fraction) {
    const now = performance.now();
    const isLast = index >= total;
    if (!isLast && now - lastProgressPaint < 80) return;
    lastProgressPaint = now;
    const percent = Math.max(0, Math.min(100, Math.round(fraction * 100)));
    els.fileProgressLabel.textContent = isLast ? '发送完成' : '发送中 · ' + path;
    els.fileProgressPercent.textContent = percent + '%';
    els.fileProgressBar.style.width = percent + '%';
  }

  els.sendFiles.addEventListener('click', sendSelectedFiles);

  /* -------------------------------------------------------------
     Transfer: file rows, downloads and zip
  ------------------------------------------------------------- */

  function createFileRow(id, path, size, direction) {
    const row = document.createElement('div');
    row.className = 'file-item is-' + direction;
    row.dataset.fileId = id;

    const iconWrap = document.createElement('span');
    iconWrap.className = 'file-item-icon';
    iconWrap.appendChild(icon('i-file'));
    row.appendChild(iconWrap);

    const info = document.createElement('div');
    info.className = 'file-item-info';

    const top = document.createElement('div');
    top.className = 'file-item-top';
    const name = document.createElement('span');
    name.className = 'file-item-name';
    name.textContent = path;
    name.title = path;
    const fileSize = document.createElement('span');
    fileSize.className = 'file-item-size';
    fileSize.textContent = formatBytes(size);
    top.appendChild(name);
    top.appendChild(fileSize);
    info.appendChild(top);

    const status = document.createElement('div');
    status.className = 'file-item-status';
    info.appendChild(status);

    const progress = document.createElement('div');
    progress.className = 'file-item-progress';
    const progressBar = document.createElement('span');
    progress.appendChild(progressBar);
    info.appendChild(progress);

    row.appendChild(info);

    const action = document.createElement('span');
    action.className = 'file-item-action';
    row.appendChild(action);

    els.fileEmpty.hidden = true;
    els.fileActivity.appendChild(row);

    return { row, status, size: fileSize, progress, progressBar, action };
  }

  function setFileRowStatus(row, text) {
    row.status.textContent = text;
  }

  function setFileProgressPercent(row, value, prefix) {
    const percent = Math.max(0, Math.min(100, value));
    row.progressBar.style.width = percent.toFixed(1) + '%';
    row.status.textContent = prefix + ' · ' + Math.floor(percent) + '%';
  }

  function setFileProgressBytes(row, received, total, prefix) {
    const percent = total > 0 ? (received / total) * 100 : 0;
    setFileProgressPercent(row, percent, prefix);
  }

  function completeFileRow(row, label, addDownload) {
    row.row.classList.add('is-complete');
    row.progressBar.style.width = '100%';
    row.status.textContent = label;
    if (addDownload) {
      const fileId = row.row.dataset.fileId;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'file-download';
      button.dataset.downloadId = fileId;
      button.appendChild(icon('i-download'));
      button.appendChild(document.createTextNode('下载'));
      row.action.replaceChildren(button);
    }
  }

  function markFileRowError(row, label) {
    if (!row) return;
    row.row.classList.add('is-error');
    row.progressBar.style.width = '100%';
    row.status.textContent = label;
  }

  function scrollFileActivity() {
    els.fileActivity.scrollTop = els.fileActivity.scrollHeight;
  }

  els.fileActivity.addEventListener('click', (event) => {
    const button = event.target.closest('[data-download-id]');
    if (!button) return;
    const file = receivedFiles.find((entry) => entry.id === button.dataset.downloadId);
    if (file) downloadBlob(file.blob, file.name || 'file');
  });

  function updateReceivedMeta() {
    const total = receivedBytes();
    els.receivedCount.hidden = receivedFiles.length === 0;
    if (!receivedFiles.length) {
      els.receivedCount.textContent = '';
      els.downloadAll.hidden = true;
      return;
    }
    const canZip = total <= MAX_ZIP_BYTES && receivedFiles.every((file) => file.size <= 0xFFFFFFFF);
    els.receivedCount.textContent = '已接收 ' + receivedFiles.length + ' 个文件 · ' + formatBytes(total) +
      (canZip ? '' : ' · 文件较大，请逐个下载');
    els.downloadAll.hidden = !canZip;
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename || 'file';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  els.downloadAll.addEventListener('click', () => {
    if (!receivedFiles.length) return;
    if (receivedBytes() > MAX_ZIP_BYTES) {
      showToast('文件太大，请逐个下载');
      return;
    }
    els.downloadAll.disabled = true;
    try {
      const blob = buildZipBlob(receivedFiles);
      const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      downloadBlob(blob, 'serlane-' + stamp + '.zip');
      showToast('已打包下载');
    } catch (error) {
      showToast('打包失败，请逐个下载');
    } finally {
      els.downloadAll.disabled = false;
    }
  });

  function buildZipBlob(files) {
    const parts = [];
    const centralParts = [];
    const now = new Date();
    const time = ((now.getHours() & 31) << 11) |
      ((now.getMinutes() & 63) << 5) |
      (Math.floor(now.getSeconds() / 2) & 31);
    const day = (((now.getFullYear() - 1980) & 127) << 9) |
      (((now.getMonth() + 1) & 15) << 5) |
      (now.getDate() & 31);
    let offset = 0;

    files.forEach((file) => {
      const nameBytes = new TextEncoder().encode(file.path);
      const crc = file.crc >>> 0;
      const size = file.size;
      if (size > 0xFFFFFFFF) throw new Error('file too large');

      const local = new Uint8Array(30);
      const localView = new DataView(local.buffer);
      localView.setUint32(0, 0x04034B50, true);
      localView.setUint16(4, 20, true);
      localView.setUint16(6, 0x0800, true);
      localView.setUint16(8, 0, true);
      localView.setUint16(10, time, true);
      localView.setUint16(12, day, true);
      localView.setUint32(14, crc, true);
      localView.setUint32(18, size, true);
      localView.setUint32(22, size, true);
      localView.setUint16(26, nameBytes.length, true);
      localView.setUint16(28, 0, true);

      parts.push(local, nameBytes, file.blob);

      const central = new Uint8Array(46);
      const centralView = new DataView(central.buffer);
      centralView.setUint32(0, 0x02014B50, true);
      centralView.setUint16(4, 20, true);
      centralView.setUint16(6, 20, true);
      centralView.setUint16(8, 0x0800, true);
      centralView.setUint16(10, 0, true);
      centralView.setUint16(12, time, true);
      centralView.setUint16(14, day, true);
      centralView.setUint32(16, crc, true);
      centralView.setUint32(20, size, true);
      centralView.setUint32(24, size, true);
      centralView.setUint16(28, nameBytes.length, true);
      centralView.setUint16(30, 0, true);
      centralView.setUint16(32, 0, true);
      centralView.setUint16(34, 0, true);
      centralView.setUint16(36, 0, true);
      centralView.setUint32(38, 0, true);
      centralView.setUint32(42, offset, true);
      centralParts.push(central, nameBytes);

      offset += local.length + nameBytes.length + size;
    });

    const centralOffset = offset;
    const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
    const end = new Uint8Array(22);
    const endView = new DataView(end.buffer);
    endView.setUint32(0, 0x06054B50, true);
    endView.setUint16(4, 0, true);
    endView.setUint16(6, 0, true);
    endView.setUint16(8, files.length & 0xFFFF, true);
    endView.setUint16(10, files.length & 0xFFFF, true);
    endView.setUint32(12, centralSize, true);
    endView.setUint32(16, centralOffset, true);
    endView.setUint16(20, 0, true);

    return new Blob(parts.concat(centralParts, [end]), { type: 'application/zip' });
  }

  /* -------------------------------------------------------------
     Clipboard and toast
  ------------------------------------------------------------- */

  function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    }
    return fallbackCopy(text);
  }

  function fallbackCopy(text) {
    return new Promise((resolve, reject) => {
      const helper = document.createElement('textarea');
      helper.value = text;
      helper.setAttribute('readonly', '');
      helper.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
      document.body.appendChild(helper);
      helper.select();
      helper.setSelectionRange(0, helper.value.length);
      let copied = false;
      try {
        copied = document.execCommand('copy');
      } catch (error) {
        copied = false;
      }
      helper.remove();
      if (copied) resolve();
      else reject(new Error('copy failed'));
    });
  }

  function showToast(message, action) {
    window.clearTimeout(toastTimer);
    els.toastText.textContent = message;
    els.toast.hidden = false;

    if (action) {
      els.toastAction.hidden = false;
      els.toastAction.textContent = action.label || '撤销';
      els.toastAction.onclick = () => {
        hideToast();
        action.callback();
      };
    } else {
      els.toastAction.hidden = true;
      els.toastAction.onclick = null;
    }

    els.toast.style.animation = 'none';
    void els.toast.offsetWidth;
    els.toast.style.animation = '';
    toastTimer = window.setTimeout(hideToast, action ? 6500 : 3000);
  }

  function hideToast() {
    window.clearTimeout(toastTimer);
    els.toast.hidden = true;
    els.toastAction.onclick = null;
  }

  /* -------------------------------------------------------------
     Boot and lifecycle
  ------------------------------------------------------------- */

  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return;
    state = loadState();
    renderSites();
  });

  const roomFromUrl = roomTargetFromHash();
  renderSites();
  updateNewTabLink();
  hideUrlError();
  setCodecMode('encode');
  updateRoomControls();

  if (roomFromUrl) {
    startGuestRoom(roomFromUrl);
  }

  window.addEventListener('beforeunload', () => {
    try { closePeer(); } catch (error) {}
  });
})();
