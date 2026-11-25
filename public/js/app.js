import { decodeDreamLocally, extractDreamMotifs } from './oracle-engine.js';
import { renderSurrealDreamArt, STYLE_PALETTES } from './surreal-art.js';
import { composeOracleCard } from './card-composer.js';

const STORAGE_SETTINGS_KEY = 'oneiric_oracle_settings_v1';
const STORAGE_HISTORY_KEY = 'oneiric_oracle_history_v1';

const state = {
  mood: '荒誕爆笑',
  artStyle: 'dali',
  template: 'tarot',
  showDreamSnippet: true,
  variation: 0,
  hasServerKey: false,
  currentDream: '',
  currentReading: null,
  currentMode: 'local',
  currentImageDataUrl: null,
  currentArtElement: null,
  settings: {
    engineMode: 'auto',
    apiKey: '',
    textModel: 'gemini-2.5-flash',
    imageModel: 'gemini-2.5-flash-image',
  },
  history: [],
};

const els = {
  dreamInput: document.getElementById('dreamInput'),
  charCount: document.getElementById('charCount'),
  moodPills: document.getElementById('moodPills'),
  artStylePills: document.getElementById('artStylePills'),
  decodeBtn: document.getElementById('decodeBtn'),
  statusMessage: document.getElementById('statusMessage'),
  resultSection: document.getElementById('resultSection'),

  artCanvas: document.getElementById('artCanvas'),
  artImage: document.getElementById('artImage'),
  artBadge: document.getElementById('artBadge'),
  artNotice: document.getElementById('artNotice'),
  artPanelTitle: document.getElementById('artPanelTitle'),
  regenArtBtn: document.getElementById('regenArtBtn'),
  downloadArtBtn: document.getElementById('downloadArtBtn'),

  arcanaCode: document.getElementById('arcanaCode'),
  readingModeBadge: document.getElementById('readingModeBadge'),
  dreamTitle: document.getElementById('dreamTitle'),
  dreamSubtitle: document.getElementById('dreamSubtitle'),
  interpretationBody: document.getElementById('interpretationBody'),
  symbolsGrid: document.getElementById('symbolsGrid'),
  fortuneMeters: document.getElementById('fortuneMeters'),
  fortuneSummary: document.getElementById('fortuneSummary'),
  doThing: document.getElementById('doThing'),
  dontThing: document.getElementById('dontThing'),
  luckyItem: document.getElementById('luckyItem'),
  luckyColor: document.getElementById('luckyColor'),
  luckyNumber: document.getElementById('luckyNumber'),
  mantraQuote: document.getElementById('mantraQuote'),

  templateTabs: document.getElementById('templateTabs'),
  showDreamToggle: document.getElementById('showDreamToggle'),
  cardCanvas: document.getElementById('cardCanvas'),
  downloadCardBtn: document.getElementById('downloadCardBtn'),

  engineStatusBtn: document.getElementById('engineStatusBtn'),
  engineStatusText: document.getElementById('engineStatusText'),
  settingsModal: document.getElementById('settingsModal'),
  closeSettingsBtn: document.getElementById('closeSettingsBtn'),
  engineModeSelect: document.getElementById('engineModeSelect'),
  apiKeyInput: document.getElementById('apiKeyInput'),
  serverKeyHint: document.getElementById('serverKeyHint'),
  textModelInput: document.getElementById('textModelInput'),
  imageModelInput: document.getElementById('imageModelInput'),
  clearKeyBtn: document.getElementById('clearKeyBtn'),
  saveSettingsBtn: document.getElementById('saveSettingsBtn'),

  historyBtn: document.getElementById('historyBtn'),
  historyCount: document.getElementById('historyCount'),
  historyModal: document.getElementById('historyModal'),
  closeHistoryBtn: document.getElementById('closeHistoryBtn'),
  historyList: document.getElementById('historyList'),
};

function loadPersistentState() {
  try {
    const rawSettings = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (rawSettings) {
      state.settings = { ...state.settings, ...JSON.parse(rawSettings) };
    }
    const rawHistory = localStorage.getItem(STORAGE_HISTORY_KEY);
    if (rawHistory) {
      state.history = JSON.parse(rawHistory);
    }
  } catch {
    // Ignore malformed storage
  }
}

function saveSettings() {
  localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(state.settings));
  updateEngineStatusUI();
}

function saveHistoryEntry(entry) {
  state.history = [entry, ...state.history.filter((h) => h.id !== entry.id)].slice(0, 15);
  try {
    localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(state.history));
  } catch {
    // Trim older image-heavy items if storage quota reached
    state.history = state.history.slice(0, 5).map((item) => ({ ...item, imageDataUrl: null }));
    localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(state.history));
  }
  els.historyCount.textContent = String(state.history.length);
}

function shouldUseGemini() {
  if (state.settings.engineMode === 'local') return false;
  const hasAnyKey = Boolean(state.settings.apiKey.trim() || state.hasServerKey);
  if (state.settings.engineMode === 'gemini') return true;
  return hasAnyKey;
}

function updateEngineStatusUI() {
  const dot = els.engineStatusBtn.querySelector('.status-dot');
  const useGemini = shouldUseGemini();
  const hasAnyKey = Boolean(state.settings.apiKey.trim() || state.hasServerKey);
  if (useGemini && hasAnyKey) {
    dot.classList.add('live');
    els.engineStatusText.textContent = 'Gemini AI 即時神諭模式';
  } else if (useGemini && !hasAnyKey) {
    dot.classList.remove('live');
    els.engineStatusText.textContent = 'Gemini 模式（尚未填金鑰）';
  } else {
    dot.classList.remove('live');
    els.engineStatusText.textContent = '星象演算模式（免金鑰）';
  }
  els.historyCount.textContent = String(state.history.length);
}

async function checkServerHealth() {
  try {
    const resp = await fetch('/api/health');
    if (resp.ok) {
      const data = await resp.json();
      state.hasServerKey = Boolean(data.hasEnvKey);
      els.serverKeyHint.textContent = state.hasServerKey
        ? '偵測到伺服器端已設定 GEMINI_API_KEY（可留空此欄直接使用）。'
        : '目前伺服器 .env 未設定金鑰；若想啟用即時 AI 繪圖與解夢可在此貼上你的金鑰。';
    }
  } catch {
    els.serverKeyHint.textContent = '目前無法連線後端，將以星象演算模式運作。';
  }
  updateEngineStatusUI();
}

function setStatus(message, isError = false) {
  els.statusMessage.textContent = message;
  els.statusMessage.classList.toggle('error', isError);
}

function renderStars(n) {
  const val = Math.max(1, Math.min(5, Number(n) || 3));
  return '★'.repeat(val) + '☆'.repeat(5 - val);
}

function renderReadingUI(reading, modeLabel) {
  els.arcanaCode.textContent = reading.arcanaCode || 'ARCANA NO. 001';
  els.readingModeBadge.textContent = modeLabel;
  els.dreamTitle.textContent = reading.title;
  els.dreamSubtitle.textContent = reading.subtitle;

  els.interpretationBody.innerHTML = '';
  const paragraphs = Array.isArray(reading.interpretation)
    ? reading.interpretation
    : [String(reading.interpretation || '')];
  for (const pText of paragraphs) {
    const p = document.createElement('p');
    p.textContent = pText;
    els.interpretationBody.appendChild(p);
  }

  els.symbolsGrid.innerHTML = '';
  for (const sym of reading.symbols || []) {
    const card = document.createElement('div');
    card.className = 'symbol-card';
    const head = document.createElement('div');
    head.className = 'symbol-head';
    head.textContent = `${sym.icon || '✦'} ${sym.name}`;
    const desc = document.createElement('p');
    desc.textContent = sym.meaning;
    card.append(head, desc);
    els.symbolsGrid.appendChild(card);
  }

  const f = reading.fortune || {};
  const meterDefs = [
    ['今日財運', f.wealth],
    ['桃花磁場', f.love],
    ['事業推進', f.career],
    ['精神理智', f.sanity],
  ];
  els.fortuneMeters.innerHTML = '';
  for (const [label, score] of meterDefs) {
    const box = document.createElement('div');
    box.className = 'meter-box';
    const lbl = document.createElement('span');
    lbl.className = 'meter-label';
    lbl.textContent = label;
    const stars = document.createElement('span');
    stars.className = 'meter-stars';
    stars.textContent = renderStars(score);
    box.append(lbl, stars);
    els.fortuneMeters.appendChild(box);
  }

  els.fortuneSummary.textContent = f.summary || '';
  els.doThing.textContent = f.doThing || '';
  els.dontThing.textContent = f.dontThing || '';
  els.luckyItem.textContent = f.luckyItem || '';
  els.luckyColor.textContent = f.luckyColor || '';
  els.luckyNumber.textContent = f.luckyNumber || '';
  els.mantraQuote.textContent = `「${f.mantra || ''}」`;
}

function renderLocalArt(dream, reading) {
  const motifs = reading.visualMotifs || extractDreamMotifs(dream).map((m) => m.visual);
  const seed = (reading.seed || 777) + state.variation * 97;
  renderSurrealDreamArt(els.artCanvas, {
    style: state.artStyle,
    visualMotifs: motifs,
    seed,
  });
  els.artCanvas.classList.remove('hidden');
  els.artImage.classList.add('hidden');
  state.currentImageDataUrl = null;
  state.currentArtElement = els.artCanvas;
  const styleName = STYLE_PALETTES[state.artStyle]?.name || '超現實';
  els.artPanelTitle.textContent = `超現實顯影 · ${styleName}`;
  els.artBadge.textContent = `星象 Canvas · ${styleName}`;
  refreshOracleCard();
}

function loadImageElement(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load generated image'));
    img.src = dataUrl;
  });
}

async function showAiImage(dataUrl) {
  const imgEl = await loadImageElement(dataUrl);
  els.artImage.src = dataUrl;
  els.artImage.classList.remove('hidden');
  els.artCanvas.classList.add('hidden');
  state.currentImageDataUrl = dataUrl;
  state.currentArtElement = imgEl;
  const styleName = STYLE_PALETTES[state.artStyle]?.name || '超現實';
  els.artPanelTitle.textContent = `AI 超現實顯影 · ${styleName}`;
  els.artBadge.textContent = `Gemini AI · ${styleName}`;
  refreshOracleCard();
}

function refreshOracleCard() {
  if (!state.currentReading || !state.currentArtElement) return;
  composeOracleCard(els.cardCanvas, {
    reading: state.currentReading,
    dream: state.currentDream,
    artSource: state.currentArtElement,
    template: state.template,
    showDreamSnippet: state.showDreamSnippet,
  });
}

async function handleDecode() {
  const dream = els.dreamInput.value.trim();
  if (!dream) {
    setStatus('請先輸入昨晚夢到的內容，星盤才能對焦！', true);
    els.dreamInput.focus();
    return;
  }

  state.currentDream = dream;
  state.variation = 0;
  els.decodeBtn.disabled = true;
  els.artNotice.classList.add('hidden');
  setStatus('正在校準潛意識星盤並沖洗超現實夢境底片…');

  try {
    let usedMode = 'local';
    let reading = null;
    let aiImageUrl = null;
    let noticeText = '';

    if (shouldUseGemini()) {
      const headers = { 'Content-Type': 'application/json' };
      if (state.settings.apiKey.trim()) {
        headers['x-gemini-api-key'] = state.settings.apiKey.trim();
      }
      const resp = await fetch('/api/decode', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          dream,
          mood: state.mood,
          artStyle: state.artStyle,
          textModel: state.settings.textModel,
          imageModel: state.settings.imageModel,
          generateImage: true,
        }),
      });
      const data = await resp.json();
      if (resp.ok && data.reading) {
        usedMode = 'gemini';
        reading = data.reading;
        aiImageUrl = data.imageDataUrl || null;
        if (!aiImageUrl && data.imageError) {
          noticeText = `AI 文字解夢成功，但繪圖模型暫時無法回傳影像（${data.imageError}），已自動切換星象超現實繪圖補位。`;
        }
      } else if (data?.error === 'NO_API_KEY') {
        noticeText = '尚未填入 Gemini API Key，已為你以「星象演算模式」完成解夢與超現實繪圖。';
      } else {
        throw new Error(data?.error || 'Gemini API 連線異常');
      }
    }

    if (!reading) {
      reading = decodeDreamLocally({
        dream,
        mood: state.mood,
        variation: state.variation,
      });
    }

    state.currentReading = reading;
    state.currentMode = usedMode;

    renderReadingUI(reading, usedMode === 'gemini' ? 'Gemini AI 神諭' : '星象演算');
    els.resultSection.classList.remove('hidden');

    if (aiImageUrl) {
      await showAiImage(aiImageUrl);
    } else {
      renderLocalArt(dream, reading);
    }

    if (noticeText) {
      els.artNotice.textContent = noticeText;
      els.artNotice.classList.remove('hidden');
    }

    saveHistoryEntry({
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
      dream,
      mood: state.mood,
      artStyle: state.artStyle,
      mode: usedMode,
      reading,
      imageDataUrl: aiImageUrl,
    });

    setStatus('顯影完成！右側神諭圖卡已可立即預覽與下載。');
    els.resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    // Graceful fallback so user still gets a full experience if Gemini fails
    const fallbackReading = decodeDreamLocally({ dream, mood: state.mood, variation: 0 });
    state.currentReading = fallbackReading;
    state.currentMode = 'local';
    renderReadingUI(fallbackReading, '星象演算（備援）');
    els.resultSection.classList.remove('hidden');
    renderLocalArt(dream, fallbackReading);
    els.artNotice.textContent = `Gemini 連線失敗（${err.message}），已自動使用星象演算模式為你完成解夢。`;
    els.artNotice.classList.remove('hidden');
    setStatus('已切換星象備援模式完成顯影。', false);
  } finally {
    els.decodeBtn.disabled = false;
  }
}

async function handleRegenArt() {
  if (!state.currentReading) return;
  state.variation += 1;
  els.regenArtBtn.disabled = true;
  els.artNotice.classList.add('hidden');

  try {
    if (shouldUseGemini() && state.currentMode === 'gemini') {
      const headers = { 'Content-Type': 'application/json' };
      if (state.settings.apiKey.trim()) {
        headers['x-gemini-api-key'] = state.settings.apiKey.trim();
      }
      const resp = await fetch('/api/reimagine', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          dream: state.currentDream,
          imagePrompt: state.currentReading.imagePrompt,
          artStyle: state.artStyle,
          imageModel: state.settings.imageModel,
        }),
      });
      const data = await resp.json();
      if (resp.ok && data.imageDataUrl) {
        await showAiImage(data.imageDataUrl);
        return;
      }
      els.artNotice.textContent = `AI 重繪失敗（${data?.error || '未知錯誤'}），已生成新版星象超現實插畫。`;
      els.artNotice.classList.remove('hidden');
    }
    renderLocalArt(state.currentDream, state.currentReading);
  } finally {
    els.regenArtBtn.disabled = false;
  }
}

function triggerPngDownload(dataUrl, filename) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function renderHistoryModal() {
  els.historyList.innerHTML = '';
  if (state.history.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'modal-desc';
    empty.textContent = '檔案館目前空無一物。先去輸入一個昨晚的奇異夢境吧！';
    els.historyList.appendChild(empty);
    return;
  }

  for (const item of state.history) {
    const card = document.createElement('div');
    card.className = 'history-item';

    const title = document.createElement('div');
    title.className = 'history-item-title';
    title.textContent = `${item.reading?.arcanaCode || 'ARCANA'} · ${item.reading?.title || '夢境紀錄'}`;

    const dreamText = document.createElement('div');
    dreamText.className = 'history-item-dream';
    dreamText.textContent = item.dream;

    card.append(title, dreamText);
    card.addEventListener('click', async () => {
      state.currentDream = item.dream;
      state.mood = item.mood || '荒誕爆笑';
      state.artStyle = item.artStyle || 'dali';
      state.currentReading = item.reading;
      state.currentMode = item.mode || 'local';
      els.dreamInput.value = item.dream;
      els.charCount.textContent = `${item.dream.length} / 1200`;

      renderReadingUI(item.reading, item.mode === 'gemini' ? 'Gemini AI 神諭' : '星象演算');
      els.resultSection.classList.remove('hidden');
      if (item.imageDataUrl) {
        await showAiImage(item.imageDataUrl);
      } else {
        renderLocalArt(item.dream, item.reading);
      }
      els.historyModal.close();
    });
    els.historyList.appendChild(card);
  }
}

function bindEvents() {
  els.dreamInput.addEventListener('input', () => {
    els.charCount.textContent = `${els.dreamInput.value.length} / 1200`;
  });

  document.querySelectorAll('.sample-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      els.dreamInput.value = btn.dataset.dream || '';
      els.charCount.textContent = `${els.dreamInput.value.length} / 1200`;
      setStatus('已載入靈感夢境，隨時可以開始解夢！');
    });
  });

  els.moodPills.addEventListener('click', (e) => {
    const btn = e.target.closest('.select-chip');
    if (!btn) return;
    els.moodPills.querySelectorAll('.select-chip').forEach((el) => el.classList.remove('active'));
    btn.classList.add('active');
    state.mood = btn.dataset.mood;
  });

  els.artStylePills.addEventListener('click', (e) => {
    const btn = e.target.closest('.select-chip');
    if (!btn) return;
    els.artStylePills.querySelectorAll('.select-chip').forEach((el) => el.classList.remove('active'));
    btn.classList.add('active');
    state.artStyle = btn.dataset.style;
    if (state.currentReading && !state.currentImageDataUrl) {
      renderLocalArt(state.currentDream, state.currentReading);
    }
  });

  els.decodeBtn.addEventListener('click', handleDecode);
  els.regenArtBtn.addEventListener('click', handleRegenArt);

  els.downloadArtBtn.addEventListener('click', () => {
    const safeTitle = (state.currentReading?.title || 'dream-art').replace(/[^\w\u4e00-\u9fff-]+/g, '_');
    const url = state.currentImageDataUrl || els.artCanvas.toDataURL('image/png');
    triggerPngDownload(url, `${safeTitle}-illustration.png`);
  });

  els.downloadCardBtn.addEventListener('click', () => {
    refreshOracleCard();
    const safeTitle = (state.currentReading?.title || 'dream-oracle').replace(/[^\w\u4e00-\u9fff-]+/g, '_');
    const url = els.cardCanvas.toDataURL('image/png');
    triggerPngDownload(url, `${safeTitle}-oracle-card.png`);
  });

  els.templateTabs.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;
    els.templateTabs.querySelectorAll('.tab-btn').forEach((el) => el.classList.remove('active'));
    btn.classList.add('active');
    state.template = btn.dataset.template;
    refreshOracleCard();
  });

  els.showDreamToggle.addEventListener('change', () => {
    state.showDreamSnippet = els.showDreamToggle.checked;
    refreshOracleCard();
  });

  // Settings Modal
  els.engineStatusBtn.addEventListener('click', () => {
    els.engineModeSelect.value = state.settings.engineMode;
    els.apiKeyInput.value = state.settings.apiKey;
    els.textModelInput.value = state.settings.textModel;
    els.imageModelInput.value = state.settings.imageModel;
    els.settingsModal.showModal();
  });

  els.closeSettingsBtn.addEventListener('click', () => els.settingsModal.close());
  els.clearKeyBtn.addEventListener('click', () => {
    els.apiKeyInput.value = '';
    state.settings.apiKey = '';
    saveSettings();
  });
  els.saveSettingsBtn.addEventListener('click', () => {
    state.settings.engineMode = els.engineModeSelect.value;
    state.settings.apiKey = els.apiKeyInput.value.trim();
    state.settings.textModel = els.textModelInput.value.trim() || 'gemini-2.5-flash';
    state.settings.imageModel = els.imageModelInput.value.trim() || 'gemini-2.5-flash-image';
    saveSettings();
    els.settingsModal.close();
  });

  // History Modal
  els.historyBtn.addEventListener('click', () => {
    renderHistoryModal();
    els.historyModal.showModal();
  });
  els.closeHistoryBtn.addEventListener('click', () => els.historyModal.close());
}

function init() {
  loadPersistentState();
  bindEvents();
  updateEngineStatusUI();
  checkServerHealth();
}

init();
