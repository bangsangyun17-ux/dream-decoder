/**
 * High-Resolution Oracle Card Composer (1080 x 1560 PNG)
 * Combines the surreal dream artwork, deadpan-mystical reading, and daily fortune
 * into 3 distinct downloadable card layouts.
 */

const TEMPLATE_THEMES = {
  tarot: {
    bg: '#0c0918',
    bgAlt: '#151029',
    frame: '#dfb76c',
    frameSoft: 'rgba(223, 183, 108, 0.32)',
    text: '#f5efe2',
    muted: '#b8aec9',
    accent: '#e8c474',
    pillBg: 'rgba(223, 183, 108, 0.12)',
  },
  museum: {
    bg: '#f5f0e4',
    bgAlt: '#ebe3d0',
    frame: '#231d2b',
    frameSoft: 'rgba(35, 29, 43, 0.22)',
    text: '#1c1824',
    muted: '#5e5568',
    accent: '#8a5a1e',
    pillBg: 'rgba(138, 90, 30, 0.10)',
  },
  gazette: {
    bg: '#ecdfc6',
    bgAlt: '#e2d2b4',
    frame: '#241b14',
    frameSoft: 'rgba(36, 27, 20, 0.28)',
    text: '#1e1610',
    muted: '#5c4b3c',
    accent: '#8c2f23',
    pillBg: 'rgba(140, 47, 35, 0.09)',
  },
};

const SERIF_FONT = '"Noto Serif TC", "PMingLiU", "Georgia", serif';
const SANS_FONT = '"Noto Sans TC", "Microsoft JhengHei", sans-serif';

/**
 * Wrap mixed CJK and Latin text cleanly within maxWidth.
 * Guarantees an ellipsis if text overflows maxLines.
 */
function wrapText(ctx, text, maxWidth, maxLines = 10) {
  const tokens = text.match(/[A-Za-z0-9._-]+|\s+|./gu) || [];
  const lines = [];
  let current = '';
  let truncated = false;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === '\n') {
      lines.push(current.trimEnd());
      current = '';
      if (lines.length >= maxLines) {
        truncated = i < tokens.length - 1;
        break;
      }
      continue;
    }
    const next = current + token;
    if (ctx.measureText(next).width > maxWidth && current.length > 0) {
      lines.push(current.trimEnd());
      if (lines.length >= maxLines) {
        truncated = true;
        current = '';
        break;
      }
      current = token.trimStart();
    } else {
      current = next;
    }
  }

  if (current.trim().length > 0 && lines.length < maxLines) {
    lines.push(current.trimEnd());
  }

  if (truncated && lines.length > 0) {
    let last = lines[lines.length - 1].replace(/[，、；：。,.!?\s]+$/u, '');
    while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) {
      last = last.slice(0, -1);
    }
    lines[lines.length - 1] = `${last}…`;
  }
  return lines;
}

function drawCoverImage(ctx, imgSource, x, y, w, h) {
  const sw = imgSource.naturalWidth || imgSource.width;
  const sh = imgSource.naturalHeight || imgSource.height;
  if (!sw || !sh) return;

  const targetRatio = w / h;
  const srcRatio = sw / sh;
  let sx = 0;
  let sy = 0;
  let cropW = sw;
  let cropH = sh;

  if (srcRatio > targetRatio) {
    cropW = sh * targetRatio;
    sx = (sw - cropW) / 2;
  } else {
    cropH = sw / targetRatio;
    sy = (sh - cropH) / 2;
  }

  ctx.drawImage(imgSource, sx, sy, cropW, cropH, x, y, w, h);
}

function renderStarsString(score) {
  const clamped = Math.max(1, Math.min(5, Number(score) || 3));
  return '★'.repeat(clamped) + '☆'.repeat(5 - clamped);
}

function formatTodayDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

function drawCornerOrnament(ctx, x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size, 0);
  ctx.lineTo(0, size);
  ctx.lineTo(-size, 0);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Render the complete 1080 x 1660 Oracle Card onto target canvas.
 */
export function composeOracleCard(canvas, {
  reading,
  dream,
  artSource,
  template = 'tarot',
  showDreamSnippet = true,
}) {
  const W = 1080;
  const H = 1660;
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }

  const ctx = canvas.getContext('2d');
  const theme = TEMPLATE_THEMES[template] || TEMPLATE_THEMES.tarot;
  const dateStr = formatTodayDate();

  // Base background
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, W, H);

  if (template === 'tarot') {
    const grad = ctx.createRadialGradient(W * 0.5, H * 0.35, 80, W * 0.5, H * 0.45, W * 0.85);
    grad.addColorStop(0, '#1d1438');
    grad.addColorStop(1, '#080611');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  // Outer & inner borders
  ctx.strokeStyle = theme.frame;
  ctx.lineWidth = template === 'gazette' ? 5 : 3;
  ctx.strokeRect(36, 36, W - 72, H - 72);

  ctx.strokeStyle = theme.frameSoft;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(52, 52, W - 104, H - 104);

  if (template === 'tarot') {
    drawCornerOrnament(ctx, 52, 52, 10, theme.frame);
    drawCornerOrnament(ctx, W - 52, 52, 10, theme.frame);
    drawCornerOrnament(ctx, 52, H - 52, 10, theme.frame);
    drawCornerOrnament(ctx, W - 52, H - 52, 10, theme.frame);
  }

  // Header Section
  let cursorY = 98;
  ctx.textAlign = 'center';

  if (template === 'gazette') {
    ctx.fillStyle = theme.text;
    ctx.font = `900 42px ${SERIF_FONT}`;
    ctx.fillText('THE ONEIRIC GAZETTE · 夢境觀測日報', W / 2, cursorY + 10);
    cursorY += 32;
    ctx.strokeStyle = theme.frame;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, cursorY);
    ctx.lineTo(W - 80, cursorY);
    ctx.stroke();
    cursorY += 28;
    ctx.font = `600 20px ${SANS_FONT}`;
    ctx.fillStyle = theme.muted;
    ctx.fillText(`${reading.arcanaCode}  |  發行日期：${dateStr}  |  特約大占卜師：阿爾卡納·莫測`, W / 2, cursorY);
    cursorY += 22;
    ctx.beginPath();
    ctx.moveTo(80, cursorY);
    ctx.lineTo(W - 80, cursorY);
    ctx.stroke();
    cursorY += 24;
  } else {
    ctx.fillStyle = theme.accent;
    ctx.font = `700 22px ${SANS_FONT}`;
    ctx.fillText(`✦  ${reading.arcanaCode}  ·  ${dateStr}  ·  月影解夢所  ✦`, W / 2, cursorY);
    cursorY += 28;
  }

  // Artwork Frame
  const artX = 90;
  const artW = W - 180;
  const artH = template === 'gazette' ? 440 : template === 'museum' ? 500 : 480;
  const artY = cursorY;

  ctx.save();
  ctx.fillStyle = theme.bgAlt;
  ctx.fillRect(artX - 8, artY - 8, artW + 16, artH + 16);
  ctx.strokeStyle = theme.frame;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(artX - 8, artY - 8, artW + 16, artH + 16);

  if (artSource) {
    drawCoverImage(ctx, artSource, artX, artY, artW, artH);
  }
  ctx.restore();

  cursorY = artY + artH + 54;

  // Title & Subtitle
  ctx.textAlign = 'center';
  ctx.fillStyle = theme.text;
  ctx.font = `800 46px ${SERIF_FONT}`;
  ctx.fillText(reading.title || '午夜星海神諭', W / 2, cursorY);
  cursorY += 38;

  ctx.fillStyle = theme.accent;
  ctx.font = `600 24px ${SANS_FONT}`;
  ctx.fillText(`— ${reading.subtitle || '潛意識顯影報告'} —`, W / 2, cursorY);
  cursorY += 26;

  if (showDreamSnippet && dream) {
    const snippetText = `「夢境原聲：${dream.replace(/\s+/g, ' ').trim()}」`;
    ctx.fillStyle = theme.muted;
    ctx.font = `italic 21px ${SANS_FONT}`;
    const snippetLines = wrapText(ctx, snippetText, W - 200, 2);
    for (const line of snippetLines) {
      cursorY += 28;
      ctx.fillText(line, W / 2, cursorY);
    }
    cursorY += 16;
  }

  // Divider
  ctx.strokeStyle = theme.frameSoft;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(110, cursorY + 8);
  ctx.lineTo(W - 110, cursorY + 8);
  ctx.stroke();
  cursorY += 44;

  // Interpretation Body
  ctx.textAlign = 'left';
  ctx.fillStyle = theme.text;
  ctx.font = `400 24px ${SERIF_FONT}`;
  const fullInterp = Array.isArray(reading.interpretation)
    ? reading.interpretation.join(' ')
    : String(reading.interpretation || '');
  const interpLines = wrapText(ctx, fullInterp, W - 184, 5);
  for (const line of interpLines) {
    ctx.fillText(line, 92, cursorY);
    cursorY += 35;
  }

  cursorY += 14;

  // Symbol Pills Row
  const symbols = (reading.symbols || []).slice(0, 3);
  if (symbols.length > 0) {
    const pillGap = 16;
    const pillW = (W - 180 - pillGap * (symbols.length - 1)) / symbols.length;
    symbols.forEach((sym, idx) => {
      const px = 90 + idx * (pillW + pillGap);
      ctx.fillStyle = theme.pillBg;
      ctx.strokeStyle = theme.frameSoft;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(px, cursorY, pillW, 56, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = theme.accent;
      ctx.font = `700 22px ${SANS_FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(`${sym.icon || '✦'} ${sym.name}`, px + pillW / 2, cursorY + 36);
    });
    cursorY += 80;
  }

  // Daily Fortune Box
  const boxX = 90;
  const boxW = W - 180;
  const boxH = H - cursorY - 84;
  ctx.fillStyle = theme.bgAlt;
  ctx.strokeStyle = theme.frame;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(boxX, cursorY, boxW, boxH, 14);
  ctx.fill();
  ctx.stroke();

  const f = reading.fortune || {};
  let fy = cursorY + 40;

  // 4 Fortune Meters
  const metrics = [
    ['財運', f.wealth],
    ['桃花', f.love],
    ['事業', f.career],
    ['理智', f.sanity],
  ];
  const colW = boxW / 4;
  metrics.forEach(([label, val], idx) => {
    const cx = boxX + colW * idx + colW / 2;
    ctx.textAlign = 'center';
    ctx.fillStyle = theme.muted;
    ctx.font = `600 20px ${SANS_FONT}`;
    ctx.fillText(label, cx, fy);
    ctx.fillStyle = theme.accent;
    ctx.font = `700 22px ${SANS_FONT}`;
    ctx.fillText(renderStarsString(val), cx, fy + 28);
  });

  fy += 60;
  ctx.strokeStyle = theme.frameSoft;
  ctx.beginPath();
  ctx.moveTo(boxX + 26, fy);
  ctx.lineTo(boxX + boxW - 26, fy);
  ctx.stroke();

  fy += 34;
  ctx.textAlign = 'left';
  ctx.font = `600 22px ${SANS_FONT}`;
  ctx.fillStyle = theme.text;
  const doLines = wrapText(ctx, `▸ 今日宜：${f.doThing || '善待自己'}`, boxW - 64, 2);
  for (const line of doLines) {
    ctx.fillText(line, boxX + 32, fy);
    fy += 30;
  }

  fy += 6;
  ctx.fillStyle = theme.muted;
  const dontLines = wrapText(ctx, `▸ 今日忌：${f.dontThing || '過度內耗'}`, boxW - 64, 2);
  for (const line of dontLines) {
    ctx.fillText(line, boxX + 32, fy);
    fy += 30;
  }

  // Lucky footer inside box (positioned strictly below do/dont with safe spacing)
  const footerStart = Math.max(fy + 16, cursorY + boxH - 76);
  ctx.strokeStyle = theme.frameSoft;
  ctx.beginPath();
  ctx.moveTo(boxX + 26, footerStart - 16);
  ctx.lineTo(boxX + boxW - 26, footerStart - 16);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = theme.accent;
  ctx.font = `700 20px ${SANS_FONT}`;
  const luckyText = `開運小物：${f.luckyItem || '神秘茶'}  ·  開運色：${f.luckyColor || '星辰金'}  ·  幸運數：${f.luckyNumber || '42'}`;
  const luckyLines = wrapText(ctx, luckyText, boxW - 48, 1);
  ctx.fillText(luckyLines[0] || luckyText, W / 2, footerStart + 12);

  ctx.fillStyle = theme.text;
  ctx.font = `600 21px ${SERIF_FONT}`;
  const mantraText = `「${f.mantra || '凡事發生，皆是宇宙幫我加的濾鏡。'}」`;
  const mantraLines = wrapText(ctx, mantraText, boxW - 48, 1);
  ctx.fillText(mantraLines[0] || mantraText, W / 2, footerStart + 46);

  // Bottom signature
  ctx.textAlign = 'center';
  ctx.fillStyle = theme.muted;
  ctx.font = `500 18px ${SANS_FONT}`;
  ctx.fillText('ONEIRIC ORACLE · 月影解夢所生成圖卡', W / 2, H - 56);
}
