import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeDreamLocally, extractDreamMotifs } from '../public/js/oracle-engine.js';
import { createAppServer } from '../server.mjs';

test('extractDreamMotifs detects specific dream symbols', () => {
  const motifs = extractDreamMotifs('夢到金魚在7-11買關東煮，店員是一隻橘貓');
  const keys = motifs.map((m) => m.key);
  assert.ok(keys.includes('fish'));
  assert.ok(keys.includes('chalice'));
  assert.ok(keys.includes('cat'));
});

test('decodeDreamLocally produces complete structured reading and fortune', () => {
  const reading = decodeDreamLocally({
    dream: '夢到牙齒掉光變成珍珠項鍊，被烏鴉搶走飛去台北101',
    mood: '荒誕爆笑',
    variation: 0,
  });

  assert.match(reading.arcanaCode, /^ARCANA NO\. \d{3}$/);
  assert.ok(reading.title.length > 0);
  assert.equal(reading.interpretation.length, 2);
  assert.equal(reading.symbols.length, 3);
  assert.ok(reading.fortune.wealth >= 1 && reading.fortune.wealth <= 5);
  assert.ok(reading.fortune.love >= 1 && reading.fortune.love <= 5);
  assert.ok(reading.fortune.career >= 1 && reading.fortune.career <= 5);
  assert.ok(reading.fortune.sanity >= 1 && reading.fortune.sanity <= 5);
  assert.ok(reading.visualMotifs.length >= 1);
});

test('HTTP server serves static files and handles API endpoints', async () => {
  const server = createAppServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address();
  const baseUrl = `http://127.0.0.1:${addr.port}`;

  try {
    const healthResp = await fetch(`${baseUrl}/api/health`);
    assert.equal(healthResp.status, 200);
    const health = await healthResp.json();
    assert.equal(health.ok, true);

    const indexResp = await fetch(`${baseUrl}/`);
    assert.equal(indexResp.status, 200);
    const html = await indexResp.text();
    assert.ok(html.includes('月影解夢所'));

    const emptyDecodeResp = await fetch(`${baseUrl}/api/decode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dream: '   ' }),
    });
    assert.equal(emptyDecodeResp.status, 400);

    const noKeyResp = await fetch(`${baseUrl}/api/decode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dream: '夢到一隻會寫程式的貓' }),
    });
    // Unless GEMINI_API_KEY is set in host env, returns 400 NO_API_KEY
    if (!health.hasEnvKey) {
      assert.equal(noKeyResp.status, 400);
      const errBody = await noKeyResp.json();
      assert.equal(errBody.error, 'NO_API_KEY');
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
