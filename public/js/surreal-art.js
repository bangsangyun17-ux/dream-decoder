/**
 * Procedural Surrealist Dream Artwork Generator (HTML5 Canvas)
 * Generates rich Dalí / Magritte / Ukiyo-e / Occult Tarot illustrations
 * directly from dream motifs and mood palettes.
 */

const STYLE_PALETTES = {
  dali: {
    name: '達利融化夢境',
    skyTop: '#161130',
    skyMid: '#4c2c59',
    skyLow: '#d47c45',
    horizon: '#e8b366',
    groundTop: '#7a3f28',
    groundLow: '#1b0f16',
    accent: '#f5d27a',
    secondary: '#6dd5ed',
    ink: '#f9edd3',
  },
  magritte: {
    name: '馬格利特超現實',
    skyTop: '#0b192c',
    skyMid: '#1f446b',
    skyLow: '#6694ba',
    horizon: '#cde0ee',
    groundTop: '#192a3d',
    groundLow: '#09101a',
    accent: '#f0c975',
    secondary: '#84e3c8',
    ink: '#eef6fc',
  },
  ukiyoe: {
    name: '浮世繪星辰',
    skyTop: '#0d1a2d',
    skyMid: '#193b5c',
    skyLow: '#c9a66b',
    horizon: '#f2e0b6',
    groundTop: '#14304a',
    groundLow: '#08121f',
    accent: '#e0533c',
    secondary: '#ecc974',
    ink: '#f6ebd2',
  },
  tarot: {
    name: '銅版畫塔羅',
    skyTop: '#080712',
    skyMid: '#1a1333',
    skyLow: '#382559',
    horizon: '#d8b467',
    groundTop: '#161029',
    groundLow: '#07050f',
    accent: '#e8c474',
    secondary: '#b48bff',
    ink: '#f4e3b8',
  },
};

function makeRng(seed) {
  let s = seed >>> 0 || 42;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawStars(ctx, w, h, rng, color) {
  ctx.save();
  for (let i = 0; i < 110; i++) {
    const x = rng() * w;
    const y = rng() * h * 0.66;
    const r = rng() * 1.7 + 0.3;
    ctx.globalAlpha = rng() * 0.65 + 0.2;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    if (i % 19 === 0) {
      ctx.globalAlpha = 0.75;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      const arm = r * 4.5;
      ctx.beginPath();
      ctx.moveTo(x - arm, y);
      ctx.lineTo(x + arm, y);
      ctx.moveTo(x, y - arm);
      ctx.lineTo(x, y + arm);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawSacredGeometry(ctx, cx, cy, radius, palette, rng) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = palette.accent;
  ctx.globalAlpha = 0.32;
  ctx.lineWidth = 1.4;

  // Outer astrolabe rings
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.setLineDash([6, 8]);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.84, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Radial rays
  const rays = 24;
  ctx.globalAlpha = 0.16;
  for (let i = 0; i < rays; i++) {
    const a = (Math.PI * 2 * i) / rays;
    const inner = radius * (i % 2 === 0 ? 0.55 : 0.7);
    const outer = radius * (i % 2 === 0 ? 1.18 : 1.04);
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
    ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
    ctx.stroke();
  }

  // Orbiting small planets
  ctx.globalAlpha = 0.75;
  for (let i = 0; i < 4; i++) {
    const a = rng() * Math.PI * 2;
    const pr = i % 2 === 0 ? radius : radius * 0.84;
    ctx.fillStyle = i % 2 === 0 ? palette.accent : palette.secondary;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * pr, Math.sin(a) * pr, 4 + rng() * 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawClouds(ctx, w, h, palette, rng, style) {
  ctx.save();
  for (let i = 0; i < 6; i++) {
    const cx = w * (0.12 + rng() * 0.76);
    const cy = h * (0.15 + rng() * 0.36);
    const cw = 85 + rng() * 110;
    const ch = 22 + rng() * 18;
    ctx.globalAlpha = style === 'magritte' ? 0.42 : 0.22;
    ctx.fillStyle = palette.ink;
    ctx.beginPath();
    ctx.ellipse(cx, cy, cw, ch, 0, 0, Math.PI * 2);
    ctx.ellipse(cx - cw * 0.42, cy + 5, cw * 0.55, ch * 0.78, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + cw * 0.4, cy + 4, cw * 0.5, ch * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPerspectiveHorizon(ctx, w, h, palette, style) {
  const hy = h * 0.65;
  const gGrad = ctx.createLinearGradient(0, hy, 0, h);
  gGrad.addColorStop(0, palette.groundTop);
  gGrad.addColorStop(1, palette.groundLow);
  ctx.fillStyle = gGrad;
  ctx.fillRect(0, hy, w, h - hy);

  // Glowing horizon line
  ctx.save();
  const hGlow = ctx.createLinearGradient(0, hy - 14, 0, hy + 20);
  hGlow.addColorStop(0, 'transparent');
  hGlow.addColorStop(0.5, palette.horizon);
  hGlow.addColorStop(1, 'transparent');
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = hGlow;
  ctx.fillRect(0, hy - 14, w, 34);

  if (style === 'dali' || style === 'tarot') {
    // Surreal perspective checkerboard lines
    ctx.strokeStyle = palette.accent;
    ctx.globalAlpha = 0.22;
    ctx.lineWidth = 1;
    const vpX = w * 0.5;
    for (let i = -10; i <= 10; i++) {
      ctx.beginPath();
      ctx.moveTo(vpX + i * 22, hy);
      ctx.lineTo(vpX + i * 110, h);
      ctx.stroke();
    }
    for (let row = 1; row <= 7; row++) {
      const t = (row / 7) ** 1.8;
      const y = hy + t * (h - hy);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  } else if (style === 'ukiyoe') {
    // Stylized layered wave arcs
    ctx.strokeStyle = palette.ink;
    ctx.lineWidth = 2;
    for (let layer = 0; layer < 4; layer++) {
      const baseY = hy + 24 + layer * 54;
      ctx.fillStyle = layer % 2 === 0 ? '#112a45' : '#1b4166';
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 24) {
        const waveY = baseY + Math.sin(x * 0.025 + layer * 1.3) * 18;
        ctx.lineTo(x, waveY);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 0.45;
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawMoonEclipse(ctx, x, y, r, palette) {
  ctx.save();
  const glow = ctx.createRadialGradient(x, y, r * 0.3, x, y, r * 2.4);
  glow.addColorStop(0, palette.accent);
  glow.addColorStop(1, 'transparent');
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, r * 2.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.95;
  ctx.fillStyle = palette.accent;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Crescent shadow cutout
  ctx.fillStyle = palette.skyTop;
  ctx.beginPath();
  ctx.arc(x + r * 0.32, y - r * 0.16, r * 0.84, 0, Math.PI * 2);
  ctx.fill();

  // Tilted planetary ring
  ctx.strokeStyle = palette.ink;
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 1.65, r * 0.34, -0.32, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawThirdEye(ctx, cx, cy, scale, palette) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // Almond eye frame
  ctx.fillStyle = palette.ink;
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-110, 0);
  ctx.quadraticCurveTo(0, -78, 110, 0);
  ctx.quadraticCurveTo(0, 78, -110, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Iris
  const irisGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 42);
  irisGrad.addColorStop(0, palette.skyTop);
  irisGrad.addColorStop(0.55, palette.secondary);
  irisGrad.addColorStop(1, palette.accent);
  ctx.fillStyle = irisGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 40, 0, Math.PI * 2);
  ctx.fill();

  // Vertical star pupil
  ctx.fillStyle = '#090612';
  ctx.beginPath();
  ctx.ellipse(0, 0, 10, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  // Catchlight
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-11, -11, 6, 0, Math.PI * 2);
  ctx.fill();

  // Golden tear
  ctx.fillStyle = palette.accent;
  ctx.beginPath();
  ctx.moveTo(0, 56);
  ctx.quadraticCurveTo(14, 82, 0, 96);
  ctx.quadraticCurveTo(-14, 82, 0, 56);
  ctx.fill();

  ctx.restore();
}

function drawMeltingClock(ctx, cx, cy, scale, palette) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // Draped melting clock body
  const grad = ctx.createLinearGradient(-80, -70, 80, 110);
  grad.addColorStop(0, palette.ink);
  grad.addColorStop(1, palette.accent);

  ctx.fillStyle = grad;
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-78, -42);
  ctx.bezierCurveTo(-70, -96, 70, -96, 82, -32);
  ctx.bezierCurveTo(96, 38, 66, 118, 34, 118);
  ctx.bezierCurveTo(6, 118, 8, 56, -24, 62);
  ctx.bezierCurveTo(-60, 68, -88, 18, -78, -42);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Clock hands warped
  ctx.strokeStyle = palette.skyTop;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-2, -16);
  ctx.quadraticCurveTo(22, -26, 36, -50);
  ctx.moveTo(-2, -16);
  ctx.quadraticCurveTo(18, 22, 32, 72);
  ctx.stroke();

  ctx.fillStyle = palette.skyTop;
  ctx.beginPath();
  ctx.arc(-2, -16, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawCosmicFish(ctx, cx, cy, scale, palette, flip = 1) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale * flip, scale);

  // Flowing tail ribbons
  ctx.fillStyle = palette.secondary;
  ctx.globalAlpha = 0.78;
  ctx.beginPath();
  ctx.moveTo(-55, 0);
  ctx.bezierCurveTo(-110, -56, -148, -22, -135, 6);
  ctx.bezierCurveTo(-115, 2, -92, 16, -130, 48);
  ctx.bezierCurveTo(-102, 54, -74, 24, -55, 10);
  ctx.closePath();
  ctx.fill();

  // Body
  const fishGrad = ctx.createLinearGradient(-50, -35, 70, 35);
  fishGrad.addColorStop(0, palette.accent);
  fishGrad.addColorStop(0.55, '#f47b54');
  fishGrad.addColorStop(1, palette.ink);
  ctx.globalAlpha = 0.96;
  ctx.fillStyle = fishGrad;
  ctx.beginPath();
  ctx.moveTo(76, 0);
  ctx.bezierCurveTo(46, -48, -28, -42, -62, 0);
  ctx.bezierCurveTo(-28, 42, 46, 48, 76, 0);
  ctx.closePath();
  ctx.fill();

  // Crown eye
  ctx.fillStyle = '#090612';
  ctx.beginPath();
  ctx.arc(44, -6, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(46, -8, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Floating bubbles
  ctx.strokeStyle = palette.ink;
  ctx.lineWidth = 1.6;
  for (const [bx, by, br] of [[92, -18, 6], [108, -38, 9], [96, -60, 4]]) {
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawOracleCat(ctx, cx, cy, scale, palette) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // Pedestal orb
  ctx.fillStyle = palette.accent;
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.ellipse(0, 88, 72, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cat silhouette
  ctx.globalAlpha = 0.96;
  ctx.fillStyle = '#0d0919';
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 2.5;

  // Tail
  ctx.beginPath();
  ctx.moveTo(28, 74);
  ctx.bezierCurveTo(92, 74, 102, 8, 68, -6);
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#0d0919';
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.lineWidth = 2.5;

  // Body + head + ears
  ctx.beginPath();
  ctx.moveTo(-36, 80);
  ctx.quadraticCurveTo(-42, 10, -22, -20);
  ctx.lineTo(-34, -56);
  ctx.lineTo(-10, -38);
  ctx.quadraticCurveTo(0, -44, 10, -38);
  ctx.lineTo(34, -56);
  ctx.lineTo(22, -20);
  ctx.quadraticCurveTo(42, 10, 36, 80);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = palette.accent;
  ctx.stroke();

  // Glowing golden spectacles
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.arc(-12, -18, 9, 0, Math.PI * 2);
  ctx.arc(12, -18, 9, 0, Math.PI * 2);
  ctx.moveTo(-3, -18);
  ctx.lineTo(3, -18);
  ctx.stroke();

  // Third eye forehead dot
  ctx.fillStyle = palette.secondary;
  ctx.beginPath();
  ctx.arc(0, -30, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawInfiniteStairs(ctx, cx, cy, scale, palette) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // Glowing portal doorway at top
  const portalGrad = ctx.createLinearGradient(0, -110, 0, -20);
  portalGrad.addColorStop(0, palette.ink);
  portalGrad.addColorStop(1, palette.accent);
  ctx.fillStyle = portalGrad;
  ctx.beginPath();
  ctx.roundRect(-26, -108, 52, 82, [26, 26, 0, 0]);
  ctx.fill();

  // Steps descending in Escher rhythm
  const steps = 9;
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const sw = 44 + i * 16;
    const sh = 14;
    const sx = -sw / 2 + Math.sin(i * 0.45) * 14;
    const sy = -28 + i * 16;
    ctx.fillStyle = i % 2 === 0 ? palette.accent : palette.secondary;
    ctx.globalAlpha = 0.9 - t * 0.25;
    ctx.fillRect(sx, sy, sw, sh);
    ctx.strokeStyle = palette.skyTop;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(sx, sy, sw, sh);
  }
  ctx.restore();
}

function drawPearlTeethOrbit(ctx, cx, cy, scale, palette) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  ctx.strokeStyle = palette.accent;
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, 0, 128, 44, -0.25, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = 0.95;
  const count = 8;
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count;
    const rx = Math.cos(a) * 128;
    const ry = Math.sin(a) * 44;
    const x = rx * Math.cos(-0.25) - ry * Math.sin(-0.25);
    const y = rx * Math.sin(-0.25) + ry * Math.cos(-0.25);
    const pearl = ctx.createRadialGradient(x - 3, y - 3, 2, x, y, 13);
    pearl.addColorStop(0, '#ffffff');
    pearl.addColorStop(1, palette.accent);
    ctx.fillStyle = pearl;
    ctx.beginPath();
    ctx.arc(x, y, 11, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawWings(ctx, cx, cy, scale, palette) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.strokeStyle = palette.accent;
  ctx.fillStyle = palette.ink;
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = 2;

  for (const dir of [-1, 1]) {
    ctx.save();
    ctx.scale(dir, 1);
    for (let f = 0; f < 5; f++) {
      ctx.beginPath();
      ctx.moveTo(26, -10 + f * 9);
      ctx.quadraticCurveTo(105 - f * 10, -56 + f * 18, 138 - f * 16, -12 + f * 20);
      ctx.quadraticCurveTo(82 - f * 8, 8 + f * 12, 26, 2 + f * 9);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}

function drawMysticChalice(ctx, cx, cy, scale, palette) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // Floating monolith / surreal vending shrine
  ctx.fillStyle = '#140f24';
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-52, -88, 104, 152, 12);
  ctx.fill();
  ctx.stroke();

  // Glowing inner window
  const winGrad = ctx.createLinearGradient(0, -68, 0, 12);
  winGrad.addColorStop(0, palette.secondary);
  winGrad.addColorStop(1, palette.accent);
  ctx.fillStyle = winGrad;
  ctx.beginPath();
  ctx.roundRect(-34, -68, 68, 76, 8);
  ctx.fill();

  // Rising surreal steam spirals
  ctx.strokeStyle = palette.ink;
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = 2;
  for (const sx of [-16, 0, 16]) {
    ctx.beginPath();
    ctx.moveTo(sx, -94);
    ctx.bezierCurveTo(sx - 14, -118, sx + 14, -138, sx, -162);
    ctx.stroke();
  }
  ctx.restore();
}

function drawFilmGrain(ctx, w, h, rng) {
  ctx.save();
  ctx.globalAlpha = 0.045;
  for (let i = 0; i < 2200; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#000000';
    ctx.fillRect(rng() * w, rng() * h, 1.5, 1.5);
  }
  ctx.restore();
}

/**
 * Render a surrealist dream illustration onto a target HTMLCanvasElement.
 */
export function renderSurrealDreamArt(canvas, {
  style = 'dali',
  visualMotifs = ['eye', 'moon'],
  seed = 101,
}) {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext('2d');
  const palette = STYLE_PALETTES[style] || STYLE_PALETTES.dali;
  const rng = makeRng(seed);

  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.66);
  skyGrad.addColorStop(0, palette.skyTop);
  skyGrad.addColorStop(0.58, palette.skyMid);
  skyGrad.addColorStop(1, palette.skyLow);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  drawStars(ctx, w, h, rng, palette.ink);
  drawClouds(ctx, w, h, palette, rng, style);
  drawPerspectiveHorizon(ctx, w, h, palette, style);

  // Celestial anchor
  const moonX = w * (0.22 + rng() * 0.56);
  const moonY = h * (0.18 + rng() * 0.14);
  drawMoonEclipse(ctx, moonX, moonY, w * 0.085, palette);

  // Sacred geometry halo behind centerpiece
  drawSacredGeometry(ctx, w * 0.5, h * 0.48, w * 0.27, palette, rng);

  // Draw up to 3 dream-specific motifs
  const motifs = visualMotifs.length ? visualMotifs : ['eye', 'clock'];
  const primary = motifs[0];

  if (motifs.includes('wings')) {
    drawWings(ctx, w * 0.5, h * 0.47, (w / 720) * 1.15, palette);
  }

  // Primary centerpiece
  const centerScale = w / 720;
  switch (primary) {
    case 'fish':
      drawCosmicFish(ctx, w * 0.5, h * 0.45, centerScale * 1.25, palette, 1);
      break;
    case 'cat':
      drawOracleCat(ctx, w * 0.5, h * 0.52, centerScale * 1.25, palette);
      break;
    case 'stairs':
      drawInfiniteStairs(ctx, w * 0.5, h * 0.49, centerScale * 1.25, palette);
      break;
    case 'clock':
      drawMeltingClock(ctx, w * 0.5, h * 0.48, centerScale * 1.25, palette);
      break;
    case 'chalice':
      drawMysticChalice(ctx, w * 0.5, h * 0.51, centerScale * 1.15, palette);
      break;
    case 'teeth':
      drawThirdEye(ctx, w * 0.5, h * 0.47, centerScale * 0.95, palette);
      drawPearlTeethOrbit(ctx, w * 0.5, h * 0.47, centerScale * 1.15, palette);
      break;
    default:
      drawThirdEye(ctx, w * 0.5, h * 0.47, centerScale * 1.18, palette);
      break;
  }

  // Secondary surreal accent motif
  const secondary = motifs[1];
  if (secondary && secondary !== primary) {
    const sx = moonX < w * 0.5 ? w * 0.76 : w * 0.24;
    const sy = h * 0.34;
    if (secondary === 'fish') drawCosmicFish(ctx, sx, sy, centerScale * 0.68, palette, -1);
    else if (secondary === 'clock') drawMeltingClock(ctx, sx, sy + 95, centerScale * 0.65, palette);
    else if (secondary === 'teeth') drawPearlTeethOrbit(ctx, w * 0.5, h * 0.48, centerScale * 1.25, palette);
    else if (secondary === 'eye') drawThirdEye(ctx, sx, sy, centerScale * 0.52, palette);
    else if (secondary === 'cat') drawOracleCat(ctx, w * 0.77, h * 0.63, centerScale * 0.68, palette);
    else if (secondary === 'stairs') drawInfiniteStairs(ctx, sx, sy + 110, centerScale * 0.62, palette);
    else if (secondary === 'chalice') drawMysticChalice(ctx, sx, sy + 110, centerScale * 0.62, palette);
  }

  // Foreground levitating stone/orb shadow
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.77, w * 0.14, h * 0.02, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Soft vignette & archival film grain
  const vig = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.28, w * 0.5, h * 0.5, w * 0.76);
  vig.addColorStop(0, 'transparent');
  vig.addColorStop(1, 'rgba(4, 3, 10, 0.56)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  drawFilmGrain(ctx, w, h, rng);
}

export { STYLE_PALETTES };
