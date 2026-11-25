import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, 'public');

/**
 * Load key=value pairs from a local .env file without external dependencies.
 */
function loadDotEnv(envPath) {
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIndex = line.indexOf('=');
    if (eqIndex <= 0) continue;
    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadDotEnv(path.join(__dirname, '.env'));

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

const ART_STYLE_PROMPTS = {
  dali: 'Salvador Dali surrealist oil painting, melting geometries, vast dreamlike twilight desert horizon, uncanny floating symbols, dramatic chiaroscuro, museum-grade fine art, rich texture, no text, no letters, no watermark',
  magritte: 'Rene Magritte surrealist painting, poetic uncanny juxtaposition, midnight velvet sky with floating clouds and paradoxical objects, crisp painterly realism, mysterious quiet atmosphere, no text, no letters',
  ukiyoe: 'Surreal cosmic Ukiyo-e woodblock print meets dreamlike fantasy, swirling indigo and gold leaf waves, celestial constellations, mythic creatures, intricate linework, archival washi texture, no text, no letters',
  tarot: 'Antique gold-foiled occult tarot etching and gouache illustration, deep obsidian indigo background, sacred geometry halo, mystical surreal dream imagery, fine botanical and celestial borders, no text, no letters',
};

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function readJsonBody(req, maxBytes = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error('Request payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

function sanitizeModelName(model, fallback) {
  if (typeof model !== 'string') return fallback;
  const cleaned = model.trim();
  if (!/^[a-zA-Z0-9._-]{3,80}$/.test(cleaned)) return fallback;
  return cleaned;
}

async function callGeminiText({ apiKey, model, dream, mood, artStyle }) {
  const styleDesc = ART_STYLE_PROMPTS[artStyle] || ART_STYLE_PROMPTS.dali;
  const systemInstruction = `你是「月影解夢所」的首席大占卜師「阿爾卡納·莫測（Master Arcana）」。
你的風格是：用極度莊嚴、神秘、古老星象學與榮格潛意識的口吻，一本正經地講出荒誕又精準好笑的現代社畜/日常洞察。
絕對不要打破人設，也不要說「這只是隨機夢境」。你必須緊緊抓住使用者夢境裡的每一個奇葩細節，把它昇華成宇宙給他的神諭警告或祝福。
請使用自然流暢的繁體中文（台灣用語）輸出嚴格符合 JSON Schema 的 JSON。`;

  const userPrompt = `昨晚的夢境內容：「${dream}」
夢境氛圍標籤：${mood || '荒誕神秘'}
指定畫風：${artStyle || 'dali'}

請回傳以下 JSON 結構（不要加 markdown code fence）：
{
  "arcanaCode": "ARCANA NO. 001~999 隨機三位數",
  "title": "6~12字以內、帶神秘學氣息又微荒誕的夢境牌名，例如：深海關東煮之兆",
  "subtitle": "一句12~22字的星象副標題",
  "interpretation": [
    "第一段解夢（80~130字）：一本正經從宇宙星象切入，精準點出夢裡的具體物件與情節。",
    "第二段解夢（80~130字）：神秘又幽默地剖析這個夢反映出當事人最近的心理狀態或生活荒謬處。"
  ],
  "symbols": [
    { "name": "夢中關鍵物1", "icon": "單一emoji", "meaning": "15~30字一本正經的玄學象徵意義" },
    { "name": "夢中關鍵物2", "icon": "單一emoji", "meaning": "15~30字一本正經的玄學象徵意義" },
    { "name": "夢中關鍵物3", "icon": "單一emoji", "meaning": "15~30字一本正經的玄學象徵意義" }
  ],
  "fortune": {
    "wealth": 1到5的整數,
    "love": 1到5的整數,
    "career": 1到5的整數,
    "sanity": 1到5的整數,
    "summary": "35~65字的今日整體運勢總批，語氣莊重但內容貼近日常又好笑",
    "doThing": "今日宜（10~22字，具體又略帶幽默的生活行動）",
    "dontThing": "今日忌（10~22字，具體又略帶幽默的禁忌）",
    "luckyItem": "今日開運小物（4~12字）",
    "luckyColor": "今日開運色（3~8字）",
    "luckyNumber": "1~99的數字字串",
    "mantra": "一句10~20字的今日神諭咒語"
  },
  "imagePrompt": "A detailed English visual prompt depicting the dream's bizarre central scene and surreal elements in this exact style: ${styleDesc}. Never include any text, words, letters, or watermarks in the artwork."
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.95,
        responseMimeType: 'application/json',
      },
    }),
  });

  const data = await resp.json();
  if (!resp.ok) {
    const message = data?.error?.message || `Gemini text API failed (${resp.status})`;
    throw new Error(message);
  }

  const textPart = data?.candidates?.[0]?.content?.parts?.find((p) => typeof p.text === 'string')?.text;
  if (!textPart) {
    throw new Error('Gemini text API returned no text content');
  }

  const cleaned = textPart.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  return JSON.parse(cleaned);
}

async function callGeminiImage({ apiKey, model, prompt }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    }),
  });

  const data = await resp.json();
  if (!resp.ok) {
    const message = data?.error?.message || `Gemini image API failed (${resp.status})`;
    throw new Error(message);
  }

  const parts = data?.candidates?.[0]?.content?.parts || [];
  const imgPart = parts.find((p) => p.inlineData?.data || p.inline_data?.data);
  if (!imgPart) {
    throw new Error('Gemini image API did not return an image');
  }
  const inline = imgPart.inlineData || imgPart.inline_data;
  const mimeType = inline.mimeType || inline.mime_type || 'image/png';
  return `data:${mimeType};base64,${inline.data}`;
}

export function createAppServer() {
  return http.createServer(async (req, res) => {
    const reqUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

    if (req.method === 'GET' && reqUrl.pathname === '/api/health') {
      return sendJson(res, 200, {
        ok: true,
        hasEnvKey: Boolean(process.env.GEMINI_API_KEY),
      });
    }

    if (req.method === 'POST' && reqUrl.pathname === '/api/decode') {
      try {
        const body = await readJsonBody(req);
        const dream = typeof body.dream === 'string' ? body.dream.trim() : '';
        if (!dream) {
          return sendJson(res, 400, { error: '請先輸入昨晚的夢境內容。' });
        }

        const headerKey = typeof req.headers['x-gemini-api-key'] === 'string'
          ? req.headers['x-gemini-api-key'].trim()
          : '';
        const apiKey = headerKey || process.env.GEMINI_API_KEY || '';
        if (!apiKey) {
          return sendJson(res, 400, { error: 'NO_API_KEY' });
        }

        const textModel = sanitizeModelName(body.textModel, 'gemini-2.5-flash');
        const imageModel = sanitizeModelName(body.imageModel, 'gemini-2.5-flash-image');
        const mood = typeof body.mood === 'string' ? body.mood.trim() : '荒誕神秘';
        const artStyle = typeof body.artStyle === 'string' ? body.artStyle.trim() : 'dali';

        const reading = await callGeminiText({ apiKey, model: textModel, dream, mood, artStyle });

        let imageDataUrl = null;
        let imageError = null;
        if (body.generateImage !== false) {
          try {
            const stylePrompt = ART_STYLE_PROMPTS[artStyle] || ART_STYLE_PROMPTS.dali;
            const finalPrompt = reading.imagePrompt || `Surrealist dream illustration of: ${dream}. ${stylePrompt}`;
            imageDataUrl = await callGeminiImage({
              apiKey,
              model: imageModel,
              prompt: finalPrompt,
            });
          } catch (err) {
            imageError = err instanceof Error ? err.message : 'Image generation failed';
          }
        }

        return sendJson(res, 200, {
          mode: 'gemini',
          reading,
          imageDataUrl,
          imageError,
          models: { textModel, imageModel },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Server error';
        return sendJson(res, 500, { error: message });
      }
    }

    if (req.method === 'POST' && reqUrl.pathname === '/api/reimagine') {
      try {
        const body = await readJsonBody(req);
        const headerKey = typeof req.headers['x-gemini-api-key'] === 'string'
          ? req.headers['x-gemini-api-key'].trim()
          : '';
        const apiKey = headerKey || process.env.GEMINI_API_KEY || '';
        if (!apiKey) {
          return sendJson(res, 400, { error: 'NO_API_KEY' });
        }
        const imageModel = sanitizeModelName(body.imageModel, 'gemini-2.5-flash-image');
        const artStyle = typeof body.artStyle === 'string' ? body.artStyle.trim() : 'dali';
        const stylePrompt = ART_STYLE_PROMPTS[artStyle] || ART_STYLE_PROMPTS.dali;
        const basePrompt = typeof body.imagePrompt === 'string' && body.imagePrompt.trim()
          ? body.imagePrompt.trim()
          : `Surrealist dream illustration: ${String(body.dream || '').slice(0, 300)}`;
        const imageDataUrl = await callGeminiImage({
          apiKey,
          model: imageModel,
          prompt: `${basePrompt}. Artistic style: ${stylePrompt}. No text, no letters, no watermark.`,
        });
        return sendJson(res, 200, { imageDataUrl });
      } catch (err) {
        return sendJson(res, 500, { error: err instanceof Error ? err.message : 'Image error' });
      }
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return sendJson(res, 405, { error: 'Method not allowed' });
    }

    const safeRelPath = reqUrl.pathname === '/' ? 'index.html' : reqUrl.pathname.replace(/^\/+/, '');
    const resolvedPath = path.resolve(PUBLIC_DIR, safeRelPath);
    if (!resolvedPath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }

    fs.readFile(resolvedPath, (err, content) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Not found');
      }
      const ext = path.extname(resolvedPath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      });
      if (req.method === 'HEAD') return res.end();
      return res.end(content);
    });
  });
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isMain) {
  const port = Number(process.env.PORT || 3456);
  const server = createAppServer();
  server.listen(port, () => {
    console.log(`Oneiric Oracle running at http://localhost:${port}`);
  });
}
