/* 石径松轩 · Serlane
   Vanilla JS. PeerJS is loaded only for transfer; DeepSeek is called from the browser. */

(function () {
  'use strict';

  const STORAGE_KEY = 'dukou.state.v1';
  const CHAT_SESSION_KEY = 'serlane.chat.session.v1';
  const CHAT_HISTORY_KEY = 'serlane.chat.history.v1';
  const CHAT_VAULT_KEY = 'serlane.chat.vault.v1';
  const CHAT_PREFS_KEY = 'serlane.chat.prefs.v1';
  const MAX_SITES = 200;
  const CHUNK_SIZE = 64 * 1024;
  const BUFFER_LIMIT = 4 * 1024 * 1024;
  const MAX_ZIP_BYTES = 1024 * 1024 * 1024;
  const PEER_PREFIX = 'serlane-';
  const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/chat/completions';
  const ROUTES = ['home', 'shi', 'jing', 'song', 'xuan'];
  const PAGE_TITLES = {
    home: '石径松轩 · Serlane',
    shi: '识 · 石径松轩',
    jing: '静 · 石径松轩',
    song: '颂 · 石径松轩',
    xuan: '翾 · 石径松轩'
  };

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
    views: document.querySelectorAll('[data-view]'),
    pageLinks: document.querySelectorAll('[data-page-link]'),
    launchers: document.querySelectorAll('[data-launcher]'),

    addSite: document.getElementById('add-site'),
    emptyAdd: document.getElementById('empty-add'),
    emptyState: document.getElementById('empty-state'),
    siteGrid: document.getElementById('site-grid'),
    siteCount: document.getElementById('site-count'),
    xuanSiteGrid: document.getElementById('xuan-site-grid'),
    xuanSiteCount: document.getElementById('xuan-site-count'),
    xuanAddSite: document.getElementById('xuan-add-site'),
    xuanEmptyAdd: document.getElementById('xuan-empty-add'),
    xuanEmptyState: document.getElementById('xuan-empty-state'),
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
    joinForm: document.getElementById('join-form'),
    joinCode: document.getElementById('join-code'),
    joinMessage: document.getElementById('join-message'),
    roomStatusDot: document.getElementById('room-status-dot'),
    roomStatusText: document.getElementById('room-status-text'),
    retryRoom: document.getElementById('retry-room'),
    leaveRoom: document.getElementById('leave-room'),
    inviteBox: document.getElementById('invite-box'),
    inviteCode: document.getElementById('invite-code'),
    copyInvite: document.getElementById('copy-invite'),
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

    loginPanel: document.getElementById('login-panel'),
    loginForm: document.getElementById('login-form'),
    loginUser: document.getElementById('login-user'),
    loginPass: document.getElementById('login-pass'),
    loginMessage: document.getElementById('login-message'),
    loginSubmit: document.getElementById('login-submit'),
    authModeAccount: document.getElementById('auth-mode-account'),
    authModeKey: document.getElementById('auth-mode-key'),
    authAccountPanel: document.getElementById('auth-account-panel'),
    authKeyPanel: document.getElementById('auth-key-panel'),
    keyForm: document.getElementById('key-form'),
    keyUser: document.getElementById('key-user'),
    keyPass: document.getElementById('key-pass'),
    keyInput: document.getElementById('key-input'),
    keyPrompt: document.getElementById('key-prompt'),
    keyMessage: document.getElementById('key-message'),
    keySubmit: document.getElementById('key-submit'),
    manageAuth: document.getElementById('manage-auth'),
    vaultList: document.getElementById('vault-list'),
    vaultClear: document.getElementById('vault-clear'),
    vaultLogout: document.getElementById('vault-logout'),
    chatApp: document.getElementById('chat-app'),
    chatTitle: document.getElementById('chat-title'),
    chatModel: document.getElementById('chat-model'),
    chatMenu: document.getElementById('chat-menu'),
    chatSearch: document.getElementById('chat-search'),
    chatThink: document.getElementById('chat-think'),
    chatNew: document.getElementById('chat-new'),
    chatDrawer: document.getElementById('chat-drawer'),
    chatDrawerBackdrop: document.getElementById('chat-drawer-backdrop'),
    drawerClose: document.getElementById('drawer-close'),
    drawerTabHistory: document.getElementById('drawer-tab-history'),
    drawerTabAccount: document.getElementById('drawer-tab-account'),
    drawerHistoryPanel: document.getElementById('drawer-history-panel'),
    drawerAccountPanel: document.getElementById('drawer-account-panel'),
    drawerNewChat: document.getElementById('drawer-new-chat'),
    drawerAccountName: document.getElementById('drawer-account-name'),
    drawerAccountModel: document.getElementById('drawer-account-model'),
    drawerLogin: document.getElementById('drawer-login'),
    conversationList: document.getElementById('conversation-list'),
    historyEmpty: document.getElementById('history-empty'),
    historyClear: document.getElementById('history-clear'),
    chatMessages: document.getElementById('chat-messages'),
    chatWelcome: document.getElementById('chat-welcome'),
    chatStatus: document.getElementById('chat-status'),
    chatForm: document.getElementById('chat-form'),
    chatInput: document.getElementById('chat-input'),
    chatSend: document.getElementById('chat-send'),
    chatStop: document.getElementById('chat-stop'),

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

  let chatSession = loadChatSession();
  let chatHistory = [];
  let chatBusy = false;
  let activeConversationId = '';
  let chatStore = { version: 1, conversations: [] };
  let chatController = null;
  let searchEnabled = true;
  let thinkingEnabled = false;
  let vaultClearArmed = false;
  let vaultClearTimer = 0;

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
     Generic helpers
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
      const values = new Uint8Array(8);
      window.crypto.getRandomValues(values);
      for (let index = 0; index < values.length; index += 1) {
        suffix += alphabet[values[index] % alphabet.length];
      }
    } else {
      for (let index = 0; index < 8; index += 1) {
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

  function isSafeLink(value) {
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (error) {
      return false;
    }
  }

  function prettyHost(value) {
    try {
      return new URL(value).hostname.replace(/^www\./i, '');
    } catch (error) {
      return '来源';
    }
  }

  /* -------------------------------------------------------------
     Bookmarks
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

  function bookmarkTargets() {
    return [
      { grid: els.siteGrid, empty: els.emptyState, count: els.siteCount },
      { grid: els.xuanSiteGrid, empty: els.xuanEmptyState, count: els.xuanSiteCount }
    ];
  }

  function renderSites() {
    const hasSites = state.sites.length > 0;
    bookmarkTargets().forEach((target) => {
      target.count.textContent = state.sites.length + ' 个站点';
      target.empty.hidden = hasSites;
      target.grid.hidden = !hasSites;

      if (!hasSites) {
        target.grid.replaceChildren();
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
      target.grid.replaceChildren(fragment);
    });
  }

  function findSite(id) {
    return state.sites.find((site) => site.id === id);
  }

  function handleSiteGridClick(event) {
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

    if (modeButton.dataset.mode === 'frame') openFrame(site.url, site.title);
    if (modeButton.dataset.mode === 'redirect') window.location.assign(site.url);
  }

  els.siteGrid.addEventListener('click', handleSiteGridClick);
  els.xuanSiteGrid.addEventListener('click', handleSiteGridClick);

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

    const duplicate = state.sites.some((site) => site.id !== editingId && site.url === parsed.href);
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

  [els.addSite, els.emptyAdd, els.xuanAddSite, els.xuanEmptyAdd].forEach((button) => {
    button.addEventListener('click', () => openSiteDialog(null, button));
  });

  /* -------------------------------------------------------------
     URL launchers (home and 翾)
  ------------------------------------------------------------- */

  function setupLauncher(form) {
    const input = form.querySelector('.url-input');
    const clear = form.querySelector('.url-clear');
    const message = form.querySelector('.form-message');
    const link = form.querySelector('.newtab-link');
    const modeButtons = form.querySelectorAll('button[data-mode]');

    function setMessage(text, error) {
      message.textContent = text || '';
      message.hidden = !text;
      message.classList.toggle('is-error', Boolean(error));
      form.classList.toggle('is-invalid', Boolean(error));
      if (error) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    }

    function update() {
      clear.hidden = input.value.length === 0;
      if (!input.value.trim()) {
        link.href = '#';
        link.setAttribute('aria-disabled', 'true');
        return;
      }
      try {
        const parsed = normalizeUrl(input.value);
        link.href = parsed.href;
        link.removeAttribute('aria-disabled');
      } catch (error) {
        link.href = '#';
        link.setAttribute('aria-disabled', 'true');
      }
    }

    function parseOrMessage() {
      try {
        const parsed = normalizeUrl(input.value);
        setMessage('');
        return parsed;
      } catch (error) {
        setMessage(error.message, true);
        input.focus();
        return null;
      }
    }

    function submit() {
      update();
      const parsed = parseOrMessage();
      if (!parsed) return;
      link.href = parsed.href;
      link.click();
    }

    input.addEventListener('input', () => {
      update();
      if (!message.hidden) setMessage('');
    });

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        submit();
      }
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submit();
    });

    link.addEventListener('click', (event) => {
      const parsed = parseOrMessage();
      if (!parsed) {
        event.preventDefault();
        return;
      }
      link.href = parsed.href;
    });

    modeButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const parsed = parseOrMessage();
        if (!parsed) return;
        if (button.dataset.mode === 'frame') openFrame(parsed.href, titleFromUrl(parsed));
        if (button.dataset.mode === 'redirect') window.location.assign(parsed.href);
      });
    });

    clear.addEventListener('click', () => {
      input.value = '';
      update();
      setMessage('');
      input.focus();
    });

    update();
  }

  els.launchers.forEach(setupLauncher);

  /* -------------------------------------------------------------
     Router
  ------------------------------------------------------------- */

  function routeFromHash() {
    const name = window.location.hash.replace(/^#/, '');
    return ROUTES.includes(name) ? name : 'home';
  }

  function applyRoute() {
    const route = routeFromHash();
    document.body.dataset.route = route;
    if (route !== 'song') closeChatDrawer(true);
    els.views.forEach((view) => {
      const active = view.dataset.view === route;
      view.hidden = !active;
      view.classList.toggle('is-active', active);
    });
    els.pageLinks.forEach((link) => {
      if (link.dataset.pageLink === route) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    document.title = PAGE_TITLES[route] || PAGE_TITLES.home;
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  window.addEventListener('hashchange', applyRoute);

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
    if (currentFrameUrl) window.location.assign(currentFrameUrl);
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
        els.codecOutput.value = bytesToBase64(new TextEncoder().encode(value));
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
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
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
     Transfer: shared helpers
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

  function showJoinMessage(message) {
    els.joinMessage.textContent = message || '';
    els.joinMessage.hidden = !message;
    els.joinMessage.classList.toggle('is-error', Boolean(message));
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
    if (!window.RTCPeerConnection) return Promise.reject(new Error('当前浏览器不支持 WebRTC'));

    peerScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'peerjs.min.js';
      script.async = true;
      script.onload = () => {
        if (window.Peer) resolve(window.Peer);
        else {
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
    const error = new Error((event && event.message) || (event && event.type) || 'P2P 连接失败');
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
      if (role === 'guest' && !connected) failRoom('没有找到这个房间，邀请码可能已经失效');
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
    els.inviteBox.hidden = true;
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
      els.inviteBox.hidden = false;
      els.leaveRoom.disabled = false;
    } else {
      setRoomStatus('error', '连接失败');
      els.retryRoom.hidden = false;
    }
    showRoomMessage(message);
    if (selectedFiles.length) renderPendingFiles();
  }

  function onConnectionOpen(token) {
    if (token !== transferSession || connected) return;
    connected = true;
    window.clearTimeout(connectionTimer);
    setRoomStatus('online', '已连接');
    showRoomMessage('');
    els.retryRoom.hidden = true;
    els.inviteBox.hidden = true;
    els.messageEmpty.textContent = '已连接，发一段文字试试。';
    els.messageEmpty.hidden = els.messages.querySelector('.message') !== null;
    updateRoomControls();
    try { conn.send({ type: 'hello', version: 1 }); } catch (error) {}
    showToast('已连接');
  }

  function bindConnection(candidate, token) {
    conn = candidate;
    window.clearTimeout(connectionTimer);
    connectionTimer = window.setTimeout(() => {
      if (conn === candidate && !connected) failConnection('连接超时，请重试');
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
      if (!connected) failConnection('连接失败，请重试');
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
      els.inviteBox.hidden = false;
    } else {
      setRoomStatus('error', '连接已断开');
      els.retryRoom.hidden = false;
    }
    if (wasConnected) {
      showRoomMessage('连接已断开，可以重新输入邀请码或重新连接。');
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

  function inviteFromPeerId(id) {
    return String(id || '').replace(PEER_PREFIX, '').toUpperCase();
  }

  function normalizeInviteCode(value) {
    let code = String(value || '').trim().toLowerCase().replace(/\s+/g, '');
    if (code.startsWith(PEER_PREFIX)) code = code.slice(PEER_PREFIX.length);
    if (!/^[a-z0-9]{4,32}$/.test(code)) return '';
    return PEER_PREFIX + code;
  }

  async function startHostRoom() {
    const token = ++transferSession;
    role = 'host';
    hostId = '';
    guestTarget = '';
    connected = false;
    closeConnectionOnly();
    showJoinMessage('');
    showRoomMessage('');
    showTransferRoom();
    els.inviteBox.hidden = true;
    els.retryRoom.hidden = true;
    setRoomStatus('waiting', '正在准备房间…');
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
      els.inviteCode.textContent = inviteFromPeerId(newPeer.id);
      els.inviteBox.hidden = false;
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
    showJoinMessage('');
    showRoomMessage('');
    showTransferRoom();
    els.inviteBox.hidden = true;
    els.retryRoom.hidden = true;
    setRoomStatus('waiting', '正在寻找房间…');
    updateRoomControls();

    try {
      await loadPeerJS();
      if (token !== transferSession) return;
      const guestPeer = await openPeer(null);
      if (token !== transferSession) {
        try { guestPeer.destroy(); } catch (error) {}
        return;
      }
      peer = guestPeer;
      const connection = guestPeer.connect(target, { reliable: true, serialization: 'binary' });
      if (!connection) throw new Error('无法发起连接');
      bindConnection(connection, token);
    } catch (error) {
      if (token !== transferSession) return;
      setRoomStatus('error', '连接失败');
      showRoomMessage(error && error.message ? error.message : '找不到这个房间');
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
    if (retryAsGuest) startGuestRoom(target);
    else startHostRoom();
  }

  function leaveRoom() {
    closePeer();
    role = null;
    hostId = '';
    guestTarget = '';
    connected = false;
    resetTransferContent();
  }

  function resetTransferContent() {
    Array.from(els.messages.querySelectorAll('.message')).forEach((message) => message.remove());
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

    els.inviteCode.textContent = '—';
    els.inviteBox.hidden = true;
    els.retryRoom.hidden = true;
    els.joinCode.value = '';
    showJoinMessage('');
    showRoomMessage('');
    setRoomStatus('', '正在准备…');
    els.transferRoom.hidden = true;
    els.transferIntro.hidden = false;
    updateRoomControls();
  }

  /* -------------------------------------------------------------
     Transfer: text
  ------------------------------------------------------------- */

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

  els.copyInvite.addEventListener('click', () => {
    const code = els.inviteCode.textContent.trim();
    if (!code || code === '—') return;
    copyToClipboard(code)
      .then(() => showToast('邀请码已复制'))
      .catch(() => showToast('复制失败，请手动选择'));
  });

  els.retryRoom.addEventListener('click', retryRoom);
  els.leaveRoom.addEventListener('click', leaveRoom);
  els.createRoom.addEventListener('click', startHostRoom);

  els.joinForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const target = normalizeInviteCode(els.joinCode.value);
    if (!target) {
      showJoinMessage('请输入有效的邀请码');
      els.joinCode.focus();
      return;
    }
    showJoinMessage('');
    startGuestRoom(target);
  });

  /* -------------------------------------------------------------
     Transfer: incoming packets
  ------------------------------------------------------------- */

  function handlePacket(packet) {
    if (!packet || typeof packet !== 'object') return;
    switch (packet.type) {
      case 'text':
        if (typeof packet.text === 'string' && packet.text) {
          addMessage(packet.text, 'in');
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
    incomingTransfers.set(id, {
      id,
      path,
      size,
      mime,
      received: 0,
      chunks: [],
      crcState: 0xFFFFFFFF,
      row,
      lastPaint: 0
    });
    setFileRowStatus(row, '正在接收');
    scrollFileActivity();
  }

  function receiveFileChunk(packet) {
    const data = packet && packet.data;
    const transfer = incomingTransfers.get(packet.id);
    if (!transfer || !data) return;
    let bytes;
    if (data instanceof ArrayBuffer) bytes = new Uint8Array(data);
    else if (ArrayBuffer.isView(data)) bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    else return;

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
    receivedFiles.push({
      id: transfer.id,
      path: transfer.path,
      name: basename(transfer.path),
      size: blob.size,
      mime: transfer.mime,
      blob,
      crc: (transfer.crcState ^ 0xFFFFFFFF) >>> 0
    });
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
    const collected = [];
    for (const entry of entries) collected.push(...await readEntry(entry, ''));
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
          setFileProgressPercent(activeRow, entry.size > 0 ? (offset / entry.size) * 100 : 100, '正在发送');
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
        try { if (connectionOnline()) conn.send({ type: 'file-cancel', id: activeId }); } catch (sendError) {}
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
    setFileProgressPercent(row, total > 0 ? (received / total) * 100 : 0, prefix);
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
     Chat: session and preferences
  ------------------------------------------------------------- */

  function getAccounts() {
    return Array.isArray(window.SERLANE_ACCOUNTS)
      ? window.SERLANE_ACCOUNTS.filter((account) => (
        account &&
        typeof account.username === 'string' &&
        typeof account.password === 'string' &&
        typeof account.apiKey === 'string'
      ))
      : [];
  }

  function defaultChatPrompt() {
    return '你可以使用 Markdown 和 LaTeX 来组织回答。';
  }

  function hashString(value) {
    let hash = 5381;
    for (let index = 0; index < value.length; index += 1) {
      hash = ((hash << 5) + hash + value.charCodeAt(index)) | 0;
    }
    return (hash >>> 0).toString(36);
  }

  function maskKey(key) {
    const value = String(key || '');
    if (value.length <= 12) return value;
    return value.slice(0, 7) + '…' + value.slice(-4);
  }

  function cleanSystemPrompt(value) {
    const text = typeof value === 'string' ? value.trim() : '';
    if (!text) return defaultChatPrompt();
    if (text.includes('石径松轩中的 AI 助手') || text.includes('石径松轩的 AI 助手')) {
      return defaultChatPrompt();
    }
    return text;
  }

  function normalizeChatSession(raw) {
    if (!raw || typeof raw !== 'object' || typeof raw.apiKey !== 'string' || !raw.apiKey) return null;
    const kind = raw.kind === 'key' ? 'key' : 'account';
    return {
      kind,
      entryId: typeof raw.entryId === 'string' ? raw.entryId : '',
      lastConversationId: typeof raw.lastConversationId === 'string' ? raw.lastConversationId : '',
      username: typeof raw.username === 'string' ? raw.username : '',
      displayName: typeof raw.displayName === 'string' && raw.displayName
        ? raw.displayName
        : (kind === 'key' ? '手动 API Key' : raw.username || '已登录'),
      apiKey: raw.apiKey,
      model: typeof raw.model === 'string' && raw.model ? raw.model : 'deepseek-flash',
      systemPrompt: cleanSystemPrompt(raw.systemPrompt)
    };
  }

  function loadChatSession() {
    try {
      const raw = localStorage.getItem(CHAT_SESSION_KEY);
      if (!raw) return null;
      return normalizeChatSession(JSON.parse(raw));
    } catch (error) {
      return null;
    }
  }

  function saveChatSession(session) {
    try {
      localStorage.setItem(CHAT_SESSION_KEY, JSON.stringify(session));
      return true;
    } catch (error) {
      return false;
    }
  }

  function clearChatSession() {
    try { localStorage.removeItem(CHAT_SESSION_KEY); } catch (error) {}
  }

  function normalizeVaultEntry(raw) {
    if (!raw || typeof raw !== 'object' || typeof raw.apiKey !== 'string' || !raw.apiKey) return null;
    const kind = raw.kind === 'key' ? 'key' : 'account';
    return {
      id: typeof raw.id === 'string' && raw.id ? raw.id : randomId(),
      kind,
      source: kind === 'key' ? 'key' : (raw.source === 'local' ? 'local' : 'config'),
      username: typeof raw.username === 'string' ? raw.username : '',
      password: typeof raw.password === 'string' ? raw.password : '',
      displayName: typeof raw.displayName === 'string' ? raw.displayName : '',
      apiKey: raw.apiKey,
      model: typeof raw.model === 'string' && raw.model ? raw.model : 'deepseek-flash',
      systemPrompt: cleanSystemPrompt(raw.systemPrompt),
      updatedAt: Number.isFinite(raw.updatedAt) ? raw.updatedAt : Date.now()
    };
  }

  function loadVault() {
    try {
      const raw = JSON.parse(localStorage.getItem(CHAT_VAULT_KEY) || '[]');
      if (!Array.isArray(raw)) return [];
      return raw.map(normalizeVaultEntry).filter(Boolean).slice(0, 12);
    } catch (error) {
      return [];
    }
  }

  function saveVault(entries) {
    try {
      localStorage.setItem(CHAT_VAULT_KEY, JSON.stringify(entries.slice(0, 12)));
      return true;
    } catch (error) {
      return false;
    }
  }

  function upsertVault(entry) {
    const normalized = normalizeVaultEntry(entry);
    if (!normalized) return null;
    const vault = loadVault();
    const index = vault.findIndex((item) => item.id === normalized.id);
    if (index >= 0) {
      vault[index] = { ...vault[index], ...normalized, updatedAt: Date.now() };
    } else {
      vault.unshift({ ...normalized, updatedAt: Date.now() });
    }
    saveVault(vault);
    return normalized;
  }

  function removeVault(id) {
    const vault = loadVault().filter((entry) => entry.id !== id);
    saveVault(vault);
  }

  function sessionFromEntry(entry) {
    return {
      kind: entry.kind,
      source: entry.source || (entry.kind === 'account' ? 'config' : 'key'),
      entryId: entry.id,
      lastConversationId: '',
      username: entry.username || '',
      displayName: entry.displayName || (entry.kind === 'account' ? entry.username : '旧版 API Key'),
      apiKey: entry.apiKey,
      model: entry.model || 'deepseek-flash',
      systemPrompt: cleanSystemPrompt(entry.systemPrompt)
    };
  }

  function ensureSessionInVault() {
    if (!chatSession) return;
    const vault = loadVault();
    const existing = vault.find((entry) => {
      if (chatSession.entryId && entry.id === chatSession.entryId) return true;
      return entry.kind === chatSession.kind &&
        (entry.kind === 'account' ? entry.username === chatSession.username : entry.apiKey === chatSession.apiKey);
    });
    if (existing) {
      chatSession.entryId = existing.id;
      saveChatSession(chatSession);
      return;
    }
    const entry = {
      id: chatSession.entryId || (chatSession.kind === 'account'
        ? 'account:' + chatSession.username
        : 'key:' + hashString(chatSession.apiKey)),
      kind: chatSession.kind,
      source: chatSession.source || (chatSession.kind === 'account' ? 'config' : 'key'),
      username: chatSession.username,
      password: '',
      displayName: chatSession.displayName,
      apiKey: chatSession.apiKey,
      model: chatSession.model,
      systemPrompt: chatSession.systemPrompt
    };
    upsertVault(entry);
    chatSession.entryId = entry.id;
    saveChatSession(chatSession);
  }

  function isActiveVaultEntry(entry) {
    if (!chatSession) return false;
    if (chatSession.entryId && entry.id === chatSession.entryId) return true;
    return entry.kind === chatSession.kind &&
      (entry.kind === 'account' ? entry.username === chatSession.username : entry.apiKey === chatSession.apiKey);
  }

  function loadChatPrefs() {
    try {
      const prefs = JSON.parse(localStorage.getItem(CHAT_PREFS_KEY) || 'null');
      if (prefs && typeof prefs.search === 'boolean') searchEnabled = prefs.search;
      if (prefs && typeof prefs.thinking === 'boolean') thinkingEnabled = prefs.thinking;
    } catch (error) {}
  }

  function saveChatPrefs() {
    try {
      localStorage.setItem(CHAT_PREFS_KEY, JSON.stringify({ search: searchEnabled, thinking: thinkingEnabled }));
    } catch (error) {}
  }

  function updateChatToggleButtons() {
    els.chatSearch.classList.toggle('is-on', searchEnabled);
    els.chatSearch.setAttribute('aria-pressed', searchEnabled ? 'true' : 'false');
    els.chatThink.classList.toggle('is-on', thinkingEnabled);
    els.chatThink.setAttribute('aria-pressed', thinkingEnabled ? 'true' : 'false');
  }

  function updateChatControls() {
    const ready = Boolean(chatSession) && !chatBusy;
    els.chatInput.disabled = !ready;
    els.chatSend.disabled = !ready || !els.chatInput.value.trim();
    els.chatStop.hidden = !chatBusy;
    els.chatSearch.disabled = !ready;
    els.chatThink.disabled = !ready;
    els.chatNew.disabled = !ready;
    els.chatMenu.disabled = chatBusy;
  }

  function showLogin() {
    els.loginPanel.hidden = false;
    els.chatApp.hidden = true;
    els.chatInput.disabled = true;
    els.chatSend.disabled = true;
    els.chatStop.hidden = true;
    els.drawerAccountName.textContent = '未登录';
    els.drawerAccountModel.textContent = '登录后管理本机账号';
    updateChatControls();
  }

  function showChat() {
    els.loginPanel.hidden = true;
    els.chatApp.hidden = false;
    els.chatTitle.textContent = '新对话';
    els.chatModel.textContent = (chatSession.model || 'deepseek-flash') + ' · API 直连';
    els.drawerAccountName.textContent = chatSession.displayName || chatSession.username || '已登录';
    els.drawerAccountModel.textContent = (chatSession.model || 'deepseek-flash') + ' · 已登录';
    restoreConversationForSession();
    renderVault();
    updateChatControls();
  }

  function resetChatMessages() {
    chatHistory = [];
    Array.from(els.chatMessages.querySelectorAll('.chat-message')).forEach((message) => message.remove());
    els.chatWelcome.hidden = false;
    setChatStatus('');
    if (chatSession) updateChatControls();
  }

  function setChatStatus(message) {
    els.chatStatus.textContent = message || '';
    els.chatStatus.hidden = !message;
  }

  function setChatBusy(busy) {
    chatBusy = busy;
    if (busy) {
      els.chatStop.hidden = false;
      els.chatInput.disabled = true;
      els.chatSend.disabled = true;
      els.chatSearch.disabled = true;
      els.chatThink.disabled = true;
      els.chatNew.disabled = true;
      els.chatMenu.disabled = true;
    } else {
      els.chatStop.hidden = true;
      updateChatControls();
      updateChatToggleButtons();
    }
  }

  function setAuthMode(mode) {
    const keyMode = mode === 'key';
    els.authModeAccount.classList.toggle('is-active', !keyMode);
    els.authModeKey.classList.toggle('is-active', keyMode);
    els.authModeAccount.setAttribute('aria-pressed', !keyMode ? 'true' : 'false');
    els.authModeKey.setAttribute('aria-pressed', keyMode ? 'true' : 'false');
    els.authAccountPanel.hidden = keyMode;
    els.authKeyPanel.hidden = !keyMode;
    showLoginMessage('');
    showKeyMessage('');
  }

  function showLoginMessage(message) {
    els.loginMessage.textContent = message || '';
    els.loginMessage.hidden = !message;
  }

  function showKeyMessage(message) {
    els.keyMessage.textContent = message || '';
    els.keyMessage.hidden = !message;
  }

  function activateSession(session) {
    chatSession = session;
    chatSession.systemPrompt = cleanSystemPrompt(chatSession.systemPrompt);
    saveChatSession(chatSession);
    ensureSessionInVault();
    activeConversationId = '';
    resetChatMessages();
    showChat();
  }

  function login() {
    const username = els.loginUser.value.trim();
    const password = els.loginPass.value;
    const accounts = getAccounts();
    const account = accounts.find((entry) => entry.username === username);

    if (!account) {
      const saved = loadVault().find((entry) => (
        entry.kind === 'account' &&
        entry.username === username &&
        entry.password === password
      ));
      if (!saved) {
        showLoginMessage(accounts.length || loadVault().length
          ? '账号或密码不正确'
          : '还没有配置账号，请先在 API Key 页建立本地账号');
        return;
      }
      showLoginMessage('');
      els.loginForm.reset();
      activateSession(sessionFromEntry(saved));
      showToast('已登录');
      return;
    }

    if (account.password !== password) {
      showLoginMessage('账号或密码不正确');
      return;
    }
    if (!account.apiKey || /^sk-x+$/i.test(account.apiKey) || account.apiKey.includes('REPLACE')) {
      showLoginMessage('请先在 chat-accounts.js 中填写有效的 API Key');
      return;
    }

    const entry = {
      id: 'account:' + account.username,
      kind: 'account',
      source: 'config',
      username: account.username,
      password: account.password,
      displayName: account.displayName || account.username,
      apiKey: account.apiKey,
      model: account.model || 'deepseek-flash',
      systemPrompt: cleanSystemPrompt(account.systemPrompt)
    };
    upsertVault(entry);
    showLoginMessage('');
    els.loginForm.reset();
    activateSession(sessionFromEntry(entry));
    showToast('已登录');
  }

  function loginWithKey() {
    const username = els.keyUser.value.trim();
    const password = els.keyPass.value;
    const apiKey = els.keyInput.value.trim();
    const customPrompt = els.keyPrompt.value.trim();
    if (!username) {
      showKeyMessage('请填写本地账号名称');
      els.keyUser.focus();
      return;
    }
    if (username.length > 32) {
      showKeyMessage('账号名称最多 32 个字符');
      els.keyUser.focus();
      return;
    }
    if (!password) {
      showKeyMessage('请填写本地账号密码');
      els.keyPass.focus();
      return;
    }
    if (!/^sk-[A-Za-z0-9_-]{10,}$/.test(apiKey)) {
      showKeyMessage('请输入有效的 DeepSeek API Key');
      els.keyInput.focus();
      return;
    }

    const id = 'local:' + username;
    const existing = loadVault().find((entry) => entry.id === id);
    if (existing && existing.password !== password) {
      showKeyMessage('这个本地账号已存在，密码不正确');
      els.keyPass.focus();
      return;
    }

    const entry = {
      id,
      kind: 'account',
      source: 'local',
      username,
      password,
      displayName: username,
      apiKey,
      model: 'deepseek-flash',
      systemPrompt: customPrompt || defaultChatPrompt()
    };
    upsertVault(entry);
    showKeyMessage('');
    els.keyUser.value = '';
    els.keyPass.value = '';
    els.keyInput.value = '';
    els.keyPrompt.value = '';
    activateSession(sessionFromEntry(entry));
    showToast('本地账号已保存');
  }

  function logout(options) {
    if (chatBusy && chatController) {
      try { chatController.abort(); } catch (error) {}
    }
    clearChatSession();
    chatSession = null;
    chatBusy = false;
    chatHistory = [];
    activeConversationId = '';
    setChatStatus('');
    Array.from(els.chatMessages.querySelectorAll('.chat-message')).forEach((message) => message.remove());
    els.chatWelcome.hidden = false;
    showLoginMessage('');
    showKeyMessage('');
    els.loginPass.value = '';
    els.keyUser.value = '';
    els.keyPass.value = '';
    els.keyInput.value = '';
    els.keyPrompt.value = '';
    closeChatDrawer(true);
    showLogin();
    renderVault();
  }

  function renderVault() {
    const vault = loadVault();
    els.vaultList.replaceChildren();
    if (!vault.length) {
      const empty = document.createElement('p');
      empty.className = 'vault-empty';
      empty.textContent = '本机还没有保存的账号或 API Key。';
      els.vaultList.appendChild(empty);
    } else {
      vault.forEach((entry) => {
        const active = isActiveVaultEntry(entry);
        const item = document.createElement('div');
        item.className = 'vault-item' + (active ? ' is-active' : '');

        const info = document.createElement('div');
        info.className = 'vault-info';
        const head = document.createElement('div');
        head.className = 'vault-item-head';
        const kind = document.createElement('span');
        kind.className = 'vault-kind';
        kind.textContent = entry.kind === 'account' ? '账号' : 'API Key';
        const name = document.createElement('strong');
        name.textContent = entry.kind === 'account'
          ? (entry.username || '未命名账号')
          : (entry.displayName || '旧版 API Key');
        head.appendChild(kind);
        head.appendChild(name);
        if (active) {
          const badge = document.createElement('span');
          badge.className = 'vault-active';
          badge.textContent = '使用中';
          head.appendChild(badge);
        }
        info.appendChild(head);

        const masked = document.createElement('p');
        masked.className = 'vault-masked';
        masked.textContent = maskKey(entry.apiKey);
        info.appendChild(masked);

        const meta = document.createElement('p');
        meta.className = 'vault-meta';
        meta.textContent = (entry.model || 'deepseek-flash') + (
          entry.kind === 'account'
            ? (entry.source === 'local' ? ' · 本地账号 · 密码已保存' : ' · 配置账号 · 密码已保存')
            : ' · 旧版导入 Key'
        );
        info.appendChild(meta);
        item.appendChild(info);

        const actions = document.createElement('div');
        actions.className = 'vault-actions';
        if (!active) {
          const use = document.createElement('button');
          use.type = 'button';
          use.className = 'btn btn-quiet btn-small';
          use.dataset.vaultUse = entry.id;
          use.textContent = '使用';
          actions.appendChild(use);
        }
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'btn btn-danger btn-quiet btn-small';
        remove.dataset.vaultDelete = entry.id;
        remove.textContent = '删除';
        actions.appendChild(remove);
        item.appendChild(actions);
        els.vaultList.appendChild(item);
      });
    }

    els.vaultLogout.hidden = !chatSession;
    els.vaultClear.disabled = !chatSession && vault.length === 0;
    els.drawerLogin.hidden = Boolean(chatSession);
  }

  function useVaultEntry(id) {
    const entry = loadVault().find((item) => item.id === id);
    if (!entry) return;
    activateSession(sessionFromEntry(entry));
    closeChatDrawer();
    showToast('已切换账号');
  }

  function deleteVaultEntry(id) {
    const active = isActiveVaultEntry(loadVault().find((entry) => entry.id === id) || {});
    removeVault(id);
    if (active) {
      logout({ keepVault: true });
      showToast('已删除当前账号');
    } else {
      renderVault();
      showToast('已删除');
    }
  }

  function clearAllAccountData() {
    if (chatBusy && chatController) {
      try { chatController.abort(); } catch (error) {}
    }
    clearChatSession();
    chatSession = null;
    chatBusy = false;
    chatHistory = [];
    activeConversationId = '';
    setChatStatus('');
    try { localStorage.removeItem(CHAT_VAULT_KEY); } catch (error) {}
    Array.from(els.chatMessages.querySelectorAll('.chat-message')).forEach((message) => message.remove());
    els.chatWelcome.hidden = false;
    showLoginMessage('');
    showKeyMessage('');
    els.loginPass.value = '';
    els.keyUser.value = '';
    els.keyPass.value = '';
    els.keyInput.value = '';
    els.keyPrompt.value = '';
    closeChatDrawer(true);
    showLogin();
    renderVault();
    showToast('本机账号数据已清除');
  }

  /* -------------------------------------------------------------
     Chat history, drawer and math rendering
  ------------------------------------------------------------- */

  let katexPromise = null;
  let historyClearArmed = false;
  let historyClearTimer = 0;
  let drawerCloseTimer = 0;

  function hasMath(text) {
    return /\$\$|\$[^$\n]+\$|\\\(|\\\[/.test(String(text || ''));
  }

  function ensureKatex() {
    if (window.renderMathInElement) return Promise.resolve();
    if (katexPromise) return katexPromise;
    katexPromise = new Promise((resolve) => {
      const loadAutoRender = () => {
        if (window.renderMathInElement) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = 'vendor/katex/auto-render.min.js';
        script.onload = () => resolve();
        script.onerror = () => resolve();
        document.head.appendChild(script);
      };
      if (window.katex) {
        loadAutoRender();
        return;
      }
      const script = document.createElement('script');
      script.src = 'vendor/katex/katex.min.js';
      script.onload = loadAutoRender;
      script.onerror = () => resolve();
      document.head.appendChild(script);
    });
    return katexPromise;
  }

  function renderMathIn(container) {
    if (!window.renderMathInElement || !container.isConnected) return;
    try {
      window.renderMathInElement(container, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\[', right: '\\]', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false }
        ],
        throwOnError: false,
        strict: false
      });
    } catch (error) {}
  }

  function renderRichText(container, text) {
    renderChatMarkdown(container, text);
    if (hasMath(text)) {
      ensureKatex().then(() => renderMathIn(container));
    }
  }

  function normalizeStoredCitation(value) {
    if (!value || typeof value !== 'object') return null;
    if (!isSafeLink(value.url)) return null;
    return {
      url: value.url,
      title: typeof value.title === 'string' ? value.title : ''
    };
  }

  function normalizeStoredMessage(value) {
    if (!value || typeof value !== 'object') return null;
    const role = value.role === 'assistant' ? 'assistant' : (value.role === 'user' ? 'user' : '');
    if (!role || typeof value.content !== 'string') return null;
    return {
      role,
      content: value.content,
      reasoning: typeof value.reasoning === 'string' ? value.reasoning : '',
      citations: Array.isArray(value.citations) ? value.citations.map(normalizeStoredCitation).filter(Boolean) : [],
      at: Number.isFinite(value.at) ? value.at : Date.now()
    };
  }

  function normalizeConversation(value) {
    if (!value || typeof value !== 'object') return null;
    if (typeof value.ownerId !== 'string' || !value.ownerId) return null;
    const messages = Array.isArray(value.messages) ? value.messages.map(normalizeStoredMessage).filter(Boolean) : [];
    return {
      id: typeof value.id === 'string' && value.id ? value.id : randomId(),
      ownerId: value.ownerId,
      title: typeof value.title === 'string' && value.title ? value.title : '新对话',
      messages: messages.slice(-120),
      createdAt: Number.isFinite(value.createdAt) ? value.createdAt : Date.now(),
      updatedAt: Number.isFinite(value.updatedAt) ? value.updatedAt : Date.now()
    };
  }

  function loadChatStore() {
    try {
      const raw = JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY) || 'null');
      const conversations = raw && Array.isArray(raw.conversations)
        ? raw.conversations.map(normalizeConversation).filter(Boolean)
        : [];
      return { version: 1, conversations: conversations.slice(0, 80) };
    } catch (error) {
      return { version: 1, conversations: [] };
    }
  }

  function saveChatStore() {
    const ordered = chatStore.conversations
      .slice()
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 80);
    chatStore = { version: 1, conversations: ordered };
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chatStore));
        return true;
      } catch (error) {
        if (chatStore.conversations.length <= 1) break;
        chatStore.conversations = chatStore.conversations.slice(0, Math.max(1, chatStore.conversations.length - 6));
      }
    }
    showToast('历史记录保存失败');
    return false;
  }

  function currentOwnerId() {
    return chatSession && chatSession.entryId ? chatSession.entryId : '';
  }

  function conversationsForOwner() {
    const owner = currentOwnerId();
    if (!owner) return [];
    return chatStore.conversations
      .filter((conversation) => conversation.ownerId === owner)
      .slice()
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  function findConversation(id) {
    return chatStore.conversations.find((conversation) => (
      conversation.id === id && conversation.ownerId === currentOwnerId()
    )) || null;
  }

  function conversationTitle(text) {
    const line = String(text || '').replace(/\s+/g, ' ').trim();
    if (!line) return '新对话';
    return line.length > 28 ? line.slice(0, 28) + '…' : line;
  }

  function updateChatHeaderTitle() {
    const conversation = activeConversationId ? findConversation(activeConversationId) : null;
    els.chatTitle.textContent = conversation ? conversation.title : '新对话';
    els.chatTitle.title = conversation ? conversation.title : '新对话';
  }

  function formatHistoryDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
  }

  function renderConversationList() {
    const conversations = conversationsForOwner();
    els.conversationList.replaceChildren();
    els.historyEmpty.hidden = conversations.length > 0;
    els.historyEmpty.textContent = chatSession ? '还没有历史对话。' : '登录后显示历史对话。';
    els.historyClear.hidden = conversations.length === 0;
    els.drawerNewChat.disabled = !chatSession;

    conversations.forEach((conversation) => {
      const item = document.createElement('div');
      item.className = 'conversation-item' + (conversation.id === activeConversationId ? ' is-active' : '');

      const open = document.createElement('button');
      open.type = 'button';
      open.className = 'conversation-open';
      open.dataset.conversationId = conversation.id;

      const title = document.createElement('span');
      title.className = 'conversation-title';
      title.textContent = conversation.title;
      open.appendChild(title);

      const meta = document.createElement('span');
      meta.className = 'conversation-meta';
      meta.textContent = formatHistoryDate(conversation.updatedAt) + ' · ' + Math.ceil(conversation.messages.length / 2) + ' 轮';
      open.appendChild(meta);
      item.appendChild(open);

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'conversation-delete';
      remove.dataset.deleteConversation = conversation.id;
      remove.setAttribute('aria-label', '删除对话：' + conversation.title);
      remove.appendChild(icon('i-trash'));
      item.appendChild(remove);

      els.conversationList.appendChild(item);
    });
  }

  function ensureActiveConversation() {
    if (!chatSession) return null;
    if (activeConversationId) {
      const existing = findConversation(activeConversationId);
      if (existing) return existing;
    }
    const now = Date.now();
    const conversation = {
      id: randomId(),
      ownerId: currentOwnerId(),
      title: '新对话',
      messages: [],
      createdAt: now,
      updatedAt: now
    };
    chatStore.conversations.unshift(conversation);
    activeConversationId = conversation.id;
    if (chatSession) {
      chatSession.lastConversationId = conversation.id;
      saveChatSession(chatSession);
    }
    return conversation;
  }

  function persistConversation(conversation) {
    conversation.updatedAt = Date.now();
    const index = chatStore.conversations.findIndex((item) => item.id === conversation.id);
    if (index >= 0) chatStore.conversations.splice(index, 1, conversation);
    else chatStore.conversations.unshift(conversation);
    if (chatSession) {
      chatSession.lastConversationId = conversation.id;
      saveChatSession(chatSession);
    }
    saveChatStore();
    updateChatHeaderTitle();
    renderConversationList();
  }

  function addUserMessageToHistory(content) {
    const conversation = ensureActiveConversation();
    if (!conversation) return;
    if (!conversation.messages.length) conversation.title = conversationTitle(content);
    conversation.messages.push({ role: 'user', content, at: Date.now() });
    chatHistory = conversation.messages.map((message) => ({ role: message.role, content: message.content }));
    persistConversation(conversation);
  }

  function addAssistantMessageToHistory(content, reasoning, citations) {
    const conversation = ensureActiveConversation();
    if (!conversation) return;
    const message = {
      role: 'assistant',
      content,
      reasoning: reasoning || '',
      citations: citations || [],
      at: Date.now()
    };
    conversation.messages.push(message);
    chatHistory = conversation.messages.map((item) => ({ role: item.role, content: item.content }));
    persistConversation(conversation);
  }

  function createReasoningBlock(ref) {
    const block = document.createElement('blockquote');
    block.className = 'chat-reasoning';
    const header = document.createElement('div');
    header.className = 'chat-reasoning-head';
    header.appendChild(icon('i-sparkle'));
    header.appendChild(document.createTextNode('思考过程'));
    const body = document.createElement('div');
    body.className = 'chat-reasoning-body';
    block.appendChild(header);
    block.appendChild(body);
    ref.row.insertBefore(block, ref.bubble);
    return { block, body };
  }

  function renderReasoningBlock(ref, reasoning) {
    if (!reasoning || !reasoning.trim()) return null;
    const view = createReasoningBlock(ref);
    renderRichText(view.body, reasoning);
    return view;
  }

  function renderAssistantRecord(message) {
    const ref = appendChatMessage('assistant', '');
    if (message.reasoning) renderReasoningBlock(ref, message.reasoning);
    ref.copyText = message.content;
    renderRichText(ref.bubble, message.content);
    const citations = dedupeCitations(message.citations || []);
    addChatSources(ref, citations);
    addChatCopy(ref);
    return ref;
  }

  function renderConversation(conversation) {
    activeConversationId = conversation.id;
    if (chatSession) {
      chatSession.lastConversationId = conversation.id;
      saveChatSession(chatSession);
    }
    Array.from(els.chatMessages.querySelectorAll('.chat-message')).forEach((message) => message.remove());
    els.chatWelcome.hidden = conversation.messages.length > 0;
    chatHistory = [];
    conversation.messages.forEach((message) => {
      if (message.role === 'user') {
        appendChatMessage('user', message.content);
      } else {
        renderAssistantRecord(message);
      }
      chatHistory.push({ role: message.role, content: message.content });
    });
    updateChatHeaderTitle();
    renderConversationList();
    window.setTimeout(() => {
      els.chatMessages.scrollTop = els.chatMessages.scrollHeight;
    }, 30);
  }

  function openConversation(id, options) {
    if (chatBusy) return;
    const conversation = findConversation(id);
    if (!conversation) return;
    renderConversation(conversation);
    if (!options || !options.silent) {
      closeChatDrawer();
      els.chatInput.focus();
    }
  }

  function restoreConversationForSession() {
    if (!chatSession) return;
    const conversations = conversationsForOwner();
    if (!conversations.length) {
      activeConversationId = '';
      chatHistory = [];
      resetChatMessages();
      updateChatHeaderTitle();
      renderConversationList();
      return;
    }
    const lastId = chatSession.lastConversationId;
    const target = lastId ? findConversation(lastId) : null;
    const conversation = target || conversations[0];
    renderConversation(conversation);
  }

  function startNewChat() {
    if (chatBusy) return;
    activeConversationId = '';
    chatHistory = [];
    if (chatSession) {
      chatSession.lastConversationId = '';
      saveChatSession(chatSession);
    }
    resetChatMessages();
    els.chatInput.value = '';
    updateChatHeaderTitle();
    renderConversationList();
    closeChatDrawer();
    els.chatInput.focus();
  }

  function deleteConversation(id) {
    chatStore.conversations = chatStore.conversations.filter((conversation) => conversation.id !== id);
    saveChatStore();
    if (activeConversationId === id) {
      activeConversationId = '';
      chatHistory = [];
      if (chatSession) {
        chatSession.lastConversationId = '';
        saveChatSession(chatSession);
      }
      resetChatMessages();
      updateChatHeaderTitle();
    }
    renderConversationList();
    showToast('对话已删除');
  }

  function clearHistoryForOwner() {
    const owner = currentOwnerId();
    if (!owner) return;
    chatStore.conversations = chatStore.conversations.filter((conversation) => conversation.ownerId !== owner);
    saveChatStore();
    activeConversationId = '';
    chatHistory = [];
    if (chatSession) {
      chatSession.lastConversationId = '';
      saveChatSession(chatSession);
    }
    resetChatMessages();
    updateChatHeaderTitle();
    renderConversationList();
    showToast('历史对话已清空');
  }

  function setDrawerTab(tab) {
    const account = tab === 'account';
    els.drawerTabHistory.classList.toggle('is-active', !account);
    els.drawerTabAccount.classList.toggle('is-active', account);
    els.drawerTabHistory.setAttribute('aria-pressed', !account ? 'true' : 'false');
    els.drawerTabAccount.setAttribute('aria-pressed', account ? 'true' : 'false');
    els.drawerHistoryPanel.hidden = account;
    els.drawerAccountPanel.hidden = !account;
    if (account) renderVault();
    else renderConversationList();
  }

  function openChatDrawer(tab) {
    vaultClearArmed = false;
    window.clearTimeout(vaultClearTimer);
    els.vaultClear.textContent = '清除全部';
    historyClearArmed = false;
    window.clearTimeout(historyClearTimer);
    els.historyClear.textContent = '清空';
    renderConversationList();
    renderVault();
    setDrawerTab(tab || 'history');
    window.clearTimeout(drawerCloseTimer);
    els.chatDrawer.hidden = false;
    els.chatDrawerBackdrop.hidden = false;
    document.body.classList.add('drawer-open');
    window.requestAnimationFrame(() => {
      els.chatDrawer.classList.add('is-open');
      els.chatDrawerBackdrop.classList.add('is-open');
    });
  }

  function closeChatDrawer(immediate) {
    historyClearArmed = false;
    window.clearTimeout(historyClearTimer);
    if (els.historyClear) els.historyClear.textContent = '清空';
    vaultClearArmed = false;
    window.clearTimeout(vaultClearTimer);
    if (els.vaultClear) els.vaultClear.textContent = '清除全部';
    if (!els.chatDrawer || els.chatDrawer.hidden) return;
    els.chatDrawer.classList.remove('is-open');
    els.chatDrawerBackdrop.classList.remove('is-open');
    document.body.classList.remove('drawer-open');
    window.clearTimeout(drawerCloseTimer);
    const hide = () => {
      els.chatDrawer.hidden = true;
      els.chatDrawerBackdrop.hidden = true;
    };
    if (immediate) hide();
    else drawerCloseTimer = window.setTimeout(hide, 190);
  }

  function appendChatMessage(role, content) {
    if (els.chatWelcome) els.chatWelcome.hidden = true;
    const row = document.createElement('div');
    row.className = 'chat-message ' + (role === 'user' ? 'is-user' : 'is-assistant');

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.textContent = content || '';
    row.appendChild(bubble);

    const meta = document.createElement('div');
    meta.className = 'chat-message-meta';
    row.appendChild(meta);

    els.chatMessages.appendChild(row);
    scrollChat();
    return { row, bubble, meta };
  }

  function appendChatInline(parent, text) {
    const tokens = String(text).split(/(`[^`\n]+`|\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\\\([\s\S]+?\\\)|\\\[[\s\S]+?\\\]|\*\*[^*\n]+\*\*|__[^_\n]+__|~~[^~\n]+~~|\[[^\]\n]+\]\(https?:\/\/[^\s)]+\)|\*[^*\n]+\*|_[^_\n]+_)/g);
    tokens.forEach((token) => {
      if (!token) return;
      if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
        const code = document.createElement('code');
        code.textContent = token.slice(1, -1);
        parent.appendChild(code);
        return;
      }
      if (
        (token.startsWith('$') && token.endsWith('$') && token.length > 2) ||
        (token.startsWith('\\(') && token.endsWith('\\)')) ||
        (token.startsWith('\\[') && token.endsWith('\\]'))
      ) {
        const math = document.createElement('span');
        math.className = 'math-source';
        math.textContent = token;
        parent.appendChild(math);
        return;
      }
      if ((token.startsWith('**') && token.endsWith('**') && token.length > 4) ||
          (token.startsWith('__') && token.endsWith('__') && token.length > 4)) {
        const strong = document.createElement('strong');
        strong.textContent = token.slice(2, -2);
        parent.appendChild(strong);
        return;
      }
      if (token.startsWith('~~') && token.endsWith('~~') && token.length > 4) {
        const del = document.createElement('del');
        del.textContent = token.slice(2, -2);
        parent.appendChild(del);
        return;
      }
      if ((token.startsWith('*') && token.endsWith('*') && token.length > 2) ||
          (token.startsWith('_') && token.endsWith('_') && token.length > 2)) {
        const em = document.createElement('em');
        em.textContent = token.slice(1, -1);
        parent.appendChild(em);
        return;
      }
      const linkMatch = token.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
      if (linkMatch && isSafeLink(linkMatch[2])) {
        const link = document.createElement('a');
        link.href = linkMatch[2];
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = linkMatch[1];
        parent.appendChild(link);
        return;
      }
      parent.appendChild(document.createTextNode(token));
    });
  }

  function splitTableRow(line) {
    return String(line).trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
  }

  function isTableSeparator(line) {
    return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(line);
  }

  function renderChatMarkdown(container, markdown) {
    container.replaceChildren();
    const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
    let index = 0;

    while (index < lines.length) {
      const line = lines[index];
      if (!line.trim()) {
        index += 1;
        continue;
      }

      if (/^```/.test(line)) {
        index += 1;
        const codeLines = [];
        while (index < lines.length && !/^```/.test(lines[index])) {
          codeLines.push(lines[index]);
          index += 1;
        }
        if (index < lines.length) index += 1;
        const pre = document.createElement('pre');
        const code = document.createElement('code');
        code.textContent = codeLines.join('\n');
        pre.appendChild(code);
        container.appendChild(pre);
        continue;
      }

      const mathOpen = line.match(/^\s*(\$\$|\\\[)\s*$/);
      if (mathOpen) {
        const closePattern = mathOpen[1] === '$$' ? /^\s*\$\$\s*$/ : /^\s*\\\]\s*$/;
        const closeDelimiter = mathOpen[1] === '$$' ? '$$' : '\\]';
        const mathLines = [];
        index += 1;
        while (index < lines.length && !closePattern.test(lines[index])) {
          mathLines.push(lines[index]);
          index += 1;
        }
        if (index < lines.length) index += 1;
        const math = document.createElement('div');
        math.className = 'math-display math-source';
        math.textContent = mathOpen[1] + '\n' + mathLines.join('\n') + '\n' + closeDelimiter;
        container.appendChild(math);
        continue;
      }

      const heading = line.match(/^(#{1,4})\s+(.+)$/);
      if (heading) {
        const level = Math.min(4, heading[1].length + 2);
        const element = document.createElement('h' + level);
        appendChatInline(element, heading[2]);
        container.appendChild(element);
        index += 1;
        continue;
      }

      if (/^\s*>\s?/.test(line)) {
        const blockquote = document.createElement('blockquote');
        const quoteLines = [];
        while (index < lines.length && /^\s*>\s?/.test(lines[index])) {
          quoteLines.push(lines[index].replace(/^\s*>\s?/, ''));
          index += 1;
        }
        quoteLines.forEach((quoteLine, lineIndex) => {
          if (lineIndex) blockquote.appendChild(document.createElement('br'));
          appendChatInline(blockquote, quoteLine);
        });
        container.appendChild(blockquote);
        continue;
      }

      if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
        container.appendChild(document.createElement('hr'));
        index += 1;
        continue;
      }

      if (line.includes('|') && index + 1 < lines.length && isTableSeparator(lines[index + 1])) {
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const headRow = document.createElement('tr');
        splitTableRow(line).forEach((cell) => {
          const th = document.createElement('th');
          appendChatInline(th, cell);
          headRow.appendChild(th);
        });
        thead.appendChild(headRow);
        table.appendChild(thead);
        index += 2;
        const tbody = document.createElement('tbody');
        while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
          const row = document.createElement('tr');
          splitTableRow(lines[index]).forEach((cell) => {
            const td = document.createElement('td');
            appendChatInline(td, cell);
            row.appendChild(td);
          });
          tbody.appendChild(row);
          index += 1;
        }
        table.appendChild(tbody);
        container.appendChild(table);
        continue;
      }

      if (/^\s*[-*]\s+/.test(line)) {
        const list = document.createElement('ul');
        while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) {
          const item = document.createElement('li');
          appendChatInline(item, lines[index].replace(/^\s*[-*]\s+/, ''));
          list.appendChild(item);
          index += 1;
        }
        container.appendChild(list);
        continue;
      }

      if (/^\s*\d+\.\s+/.test(line)) {
        const list = document.createElement('ol');
        while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
          const item = document.createElement('li');
          appendChatInline(item, lines[index].replace(/^\s*\d+\.\s+/, ''));
          list.appendChild(item);
          index += 1;
        }
        container.appendChild(list);
        continue;
      }

      const paragraph = document.createElement('p');
      appendChatInline(paragraph, line);
      index += 1;
      while (index < lines.length && lines[index].trim() &&
             !/^```/.test(lines[index]) &&
             !/^#{1,4}\s+/.test(lines[index]) &&
             !/^\s*>\s?/.test(lines[index]) &&
             !/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(lines[index]) &&
             !/^\s*\$\$\s*$/.test(lines[index]) &&
             !/^\s*\\\[\s*$/.test(lines[index]) &&
             !/^\s*[-*]\s+/.test(lines[index]) &&
             !/^\s*\d+\.\s+/.test(lines[index]) &&
             !(lines[index].includes('|') && index + 1 < lines.length && isTableSeparator(lines[index + 1]))) {
        paragraph.appendChild(document.createElement('br'));
        appendChatInline(paragraph, lines[index]);
        index += 1;
      }
      container.appendChild(paragraph);
    }
  }

  function addChatCopy(ref) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chat-copy';
    button.appendChild(icon('i-copy'));
    button.appendChild(document.createTextNode('复制'));
    button.addEventListener('click', () => {
      copyToClipboard(ref.copyText || ref.bubble.textContent)
        .then(() => {
          button.lastChild.textContent = '已复制';
          window.setTimeout(() => { button.lastChild.textContent = '复制'; }, 1400);
        })
        .catch(() => showToast('复制失败'));
    });
    ref.meta.appendChild(button);
  }

  function sendToXuan(url) {
    if (!isSafeLink(url)) return;
    closeChatDrawer(true);
    if (window.location.hash !== '#xuan') window.location.hash = 'xuan';
    showToast('已带到翾，选择打开方式');
    window.setTimeout(() => {
      const input = document.querySelector('#view-xuan .url-input');
      const launcher = document.querySelector('#view-xuan .launcher');
      if (input) {
        input.value = url;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (launcher) {
        launcher.scrollIntoView({ behavior: 'smooth', block: 'center' });
        launcher.classList.remove('is-handoff');
        void launcher.offsetWidth;
        launcher.classList.add('is-handoff');
        window.setTimeout(() => launcher.classList.remove('is-handoff'), 1600);
      }
    }, 90);
  }

  function addChatSources(ref, citations) {
    if (!citations.length) return;
    const wrap = document.createElement('div');
    wrap.className = 'chat-sources';
    const head = document.createElement('div');
    head.className = 'chat-sources-head';
    const label = document.createElement('span');
    label.textContent = '联网来源';
    head.appendChild(label);
    const hint = document.createElement('span');
    hint.textContent = '选择网页，在翾中打开';
    head.appendChild(hint);
    wrap.appendChild(head);

    citations.slice(0, 10).forEach((citation) => {
      if (!citation.url || !isSafeLink(citation.url)) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'chat-source';
      button.title = '在翾中打开：' + (citation.title || citation.url);
      button.appendChild(icon('i-link'));
      const title = document.createElement('span');
      title.className = 'chat-source-title';
      title.textContent = citation.title || prettyHost(citation.url);
      button.appendChild(title);
      const host = document.createElement('span');
      host.className = 'chat-source-host';
      host.textContent = prettyHost(citation.url);
      button.appendChild(host);
      button.addEventListener('click', () => sendToXuan(citation.url));
      wrap.appendChild(button);
    });
    if (wrap.childElementCount > 1) ref.row.insertBefore(wrap, ref.meta);
  }

  function scrollChat() {
    const nearBottom = els.chatMessages.scrollHeight - els.chatMessages.scrollTop - els.chatMessages.clientHeight < 140;
    if (nearBottom) els.chatMessages.scrollTop = els.chatMessages.scrollHeight;
  }

  function collectCitation(target, annotation) {
    if (!annotation || typeof annotation !== 'object') return;
    if (annotation.type === 'url_citation' && annotation.url_citation) {
      target.push({
        url: annotation.url_citation.url,
        title: annotation.url_citation.title || ''
      });
    } else if (annotation.url) {
      target.push({ url: annotation.url, title: annotation.title || '' });
    }
  }

  function dedupeCitations(citations) {
    const seen = new Set();
    return citations.filter((citation) => {
      if (!citation || !citation.url || seen.has(citation.url)) return false;
      seen.add(citation.url);
      return true;
    });
  }

  async function sendChat() {
    if (!chatSession || chatBusy) return;
    const text = els.chatInput.value.trim();
    if (!text) return;

    appendChatMessage('user', text);
    addUserMessageToHistory(text);
    els.chatInput.value = '';
    updateChatControls();

    const assistantRef = appendChatMessage('assistant', thinkingEnabled ? '正在思考…' : '正在回答…');
    assistantRef.bubble.classList.add('is-thinking');
    const reasoningRef = thinkingEnabled ? createReasoningBlock(assistantRef) : null;
    if (reasoningRef) reasoningRef.body.textContent = '正在思考…';
    setChatBusy(true);
    setChatStatus(searchEnabled ? '正在准备联网…' : '正在思考…');

    const controller = new AbortController();
    chatController = controller;
    let fullContent = '';
    let thinkingText = '';
    let citations = [];
    let lastPaint = 0;
    let queuedPaint = 0;

    const paint = (force) => {
      const now = performance.now();
      if (!force && now - lastPaint < 60) {
        if (!queuedPaint) {
          queuedPaint = window.setTimeout(() => {
            queuedPaint = 0;
            paint(true);
          }, 64);
        }
        return;
      }
      lastPaint = now;
      assistantRef.bubble.classList.remove('is-thinking');
      assistantRef.bubble.textContent = fullContent;
      scrollChat();
    };

    try {
      const requestBody = {
        model: chatSession.model || 'deepseek-flash',
        messages: [
          {
            role: 'system',
            content: chatSession.systemPrompt || defaultChatPrompt()
          },
          ...chatHistory.slice(-30)
        ],
        stream: true,
        thinking: { type: thinkingEnabled ? 'enabled' : 'disabled' },
        max_tokens: 4096
      };
      if (searchEnabled) {
        requestBody.tools = [
          { type: 'deepseek_web_search' },
          { type: 'deepseek_read_url' }
        ];
      }

      const response = await fetch(DEEPSEEK_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + chatSession.apiKey
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      if (!response.ok) {
        let message = '请求失败（' + response.status + '）';
        try {
          const errorBody = await response.json();
          if (errorBody && errorBody.error && errorBody.error.message) message = errorBody.error.message;
        } catch (error) {}
        throw new Error(message);
      }

      if (!response.body) throw new Error('浏览器没有收到流式响应');
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/event-stream')) {
        const data = await response.json();
        if (data && data.error) throw new Error(data.error.message || 'DeepSeek 返回错误');
        const content = data && data.choices && data.choices[0] && data.choices[0].message
          ? data.choices[0].message.content
          : '';
        if (content) {
          fullContent = content;
          thinkingText = data.choices[0].message.reasoning_content || '';
          paint(true);
          const annotations = (data.choices[0].message && data.choices[0].message.annotations) || [];
          annotations.forEach((annotation) => collectCitation(citations, annotation));
        } else {
          throw new Error('没有收到回答内容');
        }
      } else {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let streamDone = false;

        while (!streamDone) {
          const result = await reader.read();
          if (result.done) break;
          buffer += decoder.decode(result.value, { stream: true });
          let newline = buffer.indexOf('\n');
          while (newline >= 0) {
            const line = buffer.slice(0, newline).trim();
            buffer = buffer.slice(newline + 1);
            newline = buffer.indexOf('\n');
            if (!line || line.startsWith(':') || !line.startsWith('data:')) continue;
            const data = line.slice(5).trim();
            if (data === '[DONE]') {
              streamDone = true;
              break;
            }
            let event;
            try {
              event = JSON.parse(data);
            } catch (error) {
              continue;
            }
            if (event.error) {
              throw new Error(event.error.message || 'DeepSeek 返回错误');
            }
            const choice = event.choices && event.choices[0];
            if (!choice) continue;
            const delta = choice.delta || {};

            if (choice.server_tool_event) {
              const toolEvent = choice.server_tool_event;
              if (toolEvent.type === 'call_started' && toolEvent.call) {
                const kind = toolEvent.call.kind || '';
                if (kind.includes('search')) setChatStatus('正在联网搜索…');
                else if (kind.includes('read') || kind.includes('open_page')) setChatStatus('正在阅读网页…');
                else setChatStatus('正在思考…');
              } else if (toolEvent.type === 'call_completed') {
                setChatStatus('正在整理答案…');
                if (toolEvent.call && Array.isArray(toolEvent.call.sources)) {
                  toolEvent.call.sources.forEach((source) => collectCitation(citations, source));
                }
                if (toolEvent.call && toolEvent.call.page) collectCitation(citations, toolEvent.call.page);
              }
            }

            if (typeof delta.reasoning_content === 'string' && delta.reasoning_content) {
              thinkingText += delta.reasoning_content;
              if (reasoningRef) {
                reasoningRef.body.textContent = thinkingText;
                reasoningRef.body.classList.add('is-streaming');
                reasoningRef.block.hidden = false;
              }
              if (!fullContent) setChatStatus('正在思考…');
              scrollChat();
            }
            if (typeof delta.content === 'string' && delta.content) {
              const wasEmpty = !fullContent;
              fullContent += delta.content;
              if (wasEmpty) setChatStatus('正在回答…');
              paint();
            }

            const annotations = delta.annotations ||
              choice.annotations ||
              (choice.message && choice.message.annotations) ||
              [];
            if (Array.isArray(annotations)) annotations.forEach((annotation) => collectCitation(citations, annotation));
            if (delta.server_tool_calls) {
              delta.server_tool_calls.forEach((step) => {
                (step.calls || []).forEach((call) => {
                  if (Array.isArray(call.sources)) call.sources.forEach((source) => collectCitation(citations, source));
                  if (call.page) collectCitation(citations, call.page);
                });
              });
            }
          }
        }
      }

      if (queuedPaint) {
        window.clearTimeout(queuedPaint);
        queuedPaint = 0;
      }
      paint(true);
      if (!fullContent.trim()) throw new Error('没有收到回答内容');
      assistantRef.bubble.classList.remove('is-thinking');
      if (reasoningRef) {
        if (thinkingText.trim()) {
          reasoningRef.body.classList.remove('is-streaming');
          renderRichText(reasoningRef.body, thinkingText);
        } else {
          reasoningRef.block.remove();
        }
      }
      assistantRef.copyText = fullContent;
      renderRichText(assistantRef.bubble, fullContent);
      citations = dedupeCitations(citations);
      addChatSources(assistantRef, citations);
      addChatCopy(assistantRef);
      addAssistantMessageToHistory(fullContent, thinkingText, citations);
      setChatStatus('');
      scrollChat();
    } catch (error) {
      if (queuedPaint) {
        window.clearTimeout(queuedPaint);
        queuedPaint = 0;
      }
      if (error && error.name === 'AbortError') {
        if (fullContent.trim()) {
          if (reasoningRef) {
            if (thinkingText.trim()) {
              reasoningRef.body.classList.remove('is-streaming');
              renderRichText(reasoningRef.body, thinkingText);
            } else {
              reasoningRef.block.remove();
            }
          }
          assistantRef.copyText = fullContent;
          renderRichText(assistantRef.bubble, fullContent);
          assistantRef.bubble.classList.remove('is-thinking');
          citations = dedupeCitations(citations);
          addChatSources(assistantRef, citations);
          addChatCopy(assistantRef);
          addAssistantMessageToHistory(fullContent, thinkingText, citations);
          scrollChat();
        } else {
          assistantRef.row.remove();
        }
        setChatStatus('已停止');
      } else {
        if (reasoningRef && thinkingText.trim()) {
          reasoningRef.body.classList.remove('is-streaming');
          renderRichText(reasoningRef.body, thinkingText);
        } else if (reasoningRef) {
          reasoningRef.block.remove();
        }
        assistantRef.row.classList.add('is-error');
        assistantRef.bubble.classList.remove('is-thinking');
        assistantRef.bubble.textContent = error && error.message ? error.message : '请求失败';
        setChatStatus('');
      }
    } finally {
      chatController = null;
      setChatBusy(false);
    }
  }

  els.loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    login();
  });

  els.keyForm.addEventListener('submit', (event) => {
    event.preventDefault();
    loginWithKey();
  });

  els.authModeAccount.addEventListener('click', () => setAuthMode('account'));
  els.authModeKey.addEventListener('click', () => setAuthMode('key'));

  els.loginUser.addEventListener('input', () => {
    if (!els.loginMessage.hidden) showLoginMessage('');
  });
  els.loginPass.addEventListener('input', () => {
    if (!els.loginMessage.hidden) showLoginMessage('');
  });
  [els.keyUser, els.keyPass, els.keyInput, els.keyPrompt].forEach((field) => {
    field.addEventListener('input', () => {
      if (!els.keyMessage.hidden) showKeyMessage('');
    });
  });

  els.manageAuth.addEventListener('click', () => openChatDrawer('account'));
  els.chatMenu.addEventListener('click', () => openChatDrawer('history'));
  els.drawerClose.addEventListener('click', () => closeChatDrawer());
  els.chatDrawerBackdrop.addEventListener('click', () => closeChatDrawer());
  els.drawerTabHistory.addEventListener('click', () => setDrawerTab('history'));
  els.drawerTabAccount.addEventListener('click', () => setDrawerTab('account'));
  els.drawerNewChat.addEventListener('click', startNewChat);
  els.drawerLogin.addEventListener('click', () => {
    closeChatDrawer(true);
    showLogin();
    els.loginUser.focus();
  });
  els.conversationList.addEventListener('click', (event) => {
    const open = event.target.closest('[data-conversation-id]');
    if (open) {
      openConversation(open.dataset.conversationId);
      return;
    }
    const remove = event.target.closest('[data-delete-conversation]');
    if (remove) deleteConversation(remove.dataset.deleteConversation);
  });
  els.historyClear.addEventListener('click', () => {
    if (!historyClearArmed) {
      historyClearArmed = true;
      els.historyClear.textContent = '再点一次';
      window.clearTimeout(historyClearTimer);
      historyClearTimer = window.setTimeout(() => {
        historyClearArmed = false;
        els.historyClear.textContent = '清空';
      }, 3200);
      return;
    }
    historyClearArmed = false;
    window.clearTimeout(historyClearTimer);
    els.historyClear.textContent = '清空';
    clearHistoryForOwner();
  });

  els.vaultList.addEventListener('click', (event) => {
    const use = event.target.closest('[data-vault-use]');
    if (use) {
      useVaultEntry(use.dataset.vaultUse);
      return;
    }
    const remove = event.target.closest('[data-vault-delete]');
    if (remove) {
      deleteVaultEntry(remove.dataset.vaultDelete);
    }
  });

  els.vaultLogout.addEventListener('click', () => {
    logout();
    showToast('已退出登录');
  });

  els.vaultClear.addEventListener('click', () => {
    if (els.vaultClear.disabled) return;
    if (!vaultClearArmed) {
      vaultClearArmed = true;
      els.vaultClear.textContent = '再点一次确认';
      window.clearTimeout(vaultClearTimer);
      vaultClearTimer = window.setTimeout(() => {
        vaultClearArmed = false;
        els.vaultClear.textContent = '清除全部';
      }, 3200);
      return;
    }
    vaultClearArmed = false;
    window.clearTimeout(vaultClearTimer);
    els.vaultClear.textContent = '清除全部';
    clearAllAccountData();
  });

  els.chatDrawer.addEventListener('transitionend', () => {});
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !els.chatDrawer.hidden) closeChatDrawer();
  });

  els.chatForm.addEventListener('submit', (event) => {
    event.preventDefault();
    sendChat();
  });
  els.chatInput.addEventListener('input', updateChatControls);
  els.chatInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      sendChat();
    }
  });

  els.chatStop.addEventListener('click', () => {
    if (chatController) {
      try { chatController.abort(); } catch (error) {}
    }
  });
  els.chatNew.addEventListener('click', startNewChat);
  els.chatSearch.addEventListener('click', () => {
    if (chatBusy) return;
    searchEnabled = !searchEnabled;
    updateChatToggleButtons();
    saveChatPrefs();
  });
  els.chatThink.addEventListener('click', () => {
    if (chatBusy) return;
    thinkingEnabled = !thinkingEnabled;
    updateChatToggleButtons();
    saveChatPrefs();
  });

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
     Boot
  ------------------------------------------------------------- */

  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return;
    state = loadState();
    renderSites();
  });

  renderSites();
  applyRoute();
  setCodecMode('encode');
  hideSiteMessage();
  chatStore = loadChatStore();
  loadChatPrefs();
  updateChatToggleButtons();
  setAuthMode('account');
  if (chatSession) {
    ensureSessionInVault();
    showChat();
  } else {
    showLogin();
  }
  updateChatControls();
  updateRoomControls();

  window.addEventListener('beforeunload', () => {
    try { closePeer(); } catch (error) {}
    if (chatController) {
      try { chatController.abort(); } catch (error) {}
    }
  });
})();
