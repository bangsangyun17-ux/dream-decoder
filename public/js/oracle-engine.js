/**
 * Built-in Traditional Chinese Deadpan-Mystical Dream Oracle Engine.
 * Works completely offline / without API keys and shares the same output schema as Gemini mode.
 */

const MOTIF_CATALOG = [
  {
    key: 'fish',
    visual: 'fish',
    keywords: ['魚', '金魚', '鯨', '海豚', '鯉', '章魚', '海鮮', '水族'],
    symbolName: '游離星海之魚',
    icon: '🐟',
    titlePart: '游魚',
    meaning: '象徵潛意識裡尚未結帳的靈感，表面悠哉，其實正在悄悄觀察你的選擇。',
    insight: '水生生物在夢中現身且反客為主，代表你近期正試圖在混沌的人際與日常規則中，找出一條能優雅換氣的縫隙。',
  },
  {
    key: 'cat',
    visual: 'cat',
    keywords: ['貓', '橘貓', '黑貓', '貓咪', '喵'],
    symbolName: '戴冠守夜貓靈',
    icon: '🐈',
    titlePart: '貓靈',
    meaning: '宇宙派來巡視你精神邊界的特派員，牠不聽指揮，但總是對的。',
    insight: '貓科神諭降臨於夢土，顯示你的直覺雷達已開啟最高靈敏度，對他人無意義的客套開始產生天然過敏。',
  },
  {
    key: 'teeth',
    visual: 'teeth',
    keywords: ['牙', '牙齒', '掉牙', '珍珠', '嘴'],
    symbolName: '失重象牙星珠',
    icon: '🦷',
    titlePart: '落齒',
    meaning: '代表近期有話想吐槽卻硬生生吞回去，導致能量在顎骨裡開派對。',
    insight: '齒列鬆動或化作珍寶之象，在古星象學中意味著「舊人設正在脫落」，你正準備用更誠實（也更省力）的姿態面對世界。',
  },
  {
    key: 'stairs',
    visual: 'stairs',
    keywords: ['樓梯', '手扶梯', '電梯', '捷運', '車站', '走廊', '迷宮', '門', '台北', '101', '大樓'],
    symbolName: '無限階梯迴廊',
    icon: '🪜',
    titlePart: '迴廊',
    meaning: '象徵你對「到底還有幾件事要做完」的靈魂提問，宇宙暫時回傳了讀取中。',
    insight: '永無止盡的階梯或交通載具，暗示你這陣子在趕進度時忘了檢查目的地是否真的是自己想去的樓層。',
  },
  {
    key: 'chalice',
    visual: 'chalice',
    keywords: ['販賣機', '超商', '7-11', '全家', '關東煮', '飲料', '咖啡', '吃', '飯', '麵', '蛋糕', '外賣', '食物'],
    symbolName: '深夜補給聖壇',
    icon: '🏮',
    titlePart: '神饌',
    meaning: '你的靈魂正在用碳水與熱湯發出求救訊號，提醒你別只餵養待辦事項。',
    insight: '超商、食肆與自動裝置在夢境顯靈，揭露了你渴望「投幣即得答案」的疲憊心境，但也預告小確幸正從意想不到的角落掉落。',
  },
  {
    key: 'wings',
    visual: 'wings',
    keywords: ['飛', '翅膀', '漂浮', '雲', '天空', '跳', '墜落', '掉下來', '騎'],
    symbolName: '無重力羽翼',
    icon: '🪽',
    titlePart: '浮空',
    meaning: '擺脫地心引力與群組訊息的終極渴望，但降落傘需要自己摺。',
    insight: '騰雲駕霧或失重飛翔的體感，表示你內心深處其實比表面上更想把繁文縟節拋在地球表面。',
  },
  {
    key: 'clock',
    visual: 'clock',
    keywords: ['時鐘', '錶', '時間', '遲到', '考試', '上班', '開會', '老闆', '工作', '報告'],
    symbolName: '融化日晷',
    icon: '⏳',
    titlePart: '時輪',
    meaning: '提醒你：死線是人類發明的幻覺，但你的黑眼圈卻是真實的宇宙刻印。',
    insight: '時間器械與考場／職場幽靈交錯出現，說明你的潛意識還在替你加班，是時候宣布精神下班了。',
  },
  {
    key: 'eye',
    visual: 'eye',
    keywords: ['眼', '看', '盯', '鏡子', '影子', '烏鴉', '鳥', '鬼', '怪', '說話', '講話'],
    symbolName: '全知裂縫之瞳',
    icon: '👁️',
    titlePart: '秘瞳',
    meaning: '你早已察覺某件荒謬事情的真相，只是禮貌地假裝沒看到。',
    insight: '凝視與異界傳訊者的現身，代表你的第三隻眼正在偷偷替你翻白眼，並且準備好迎接某個真相大白的瞬間。',
  },
  {
    key: 'wave',
    visual: 'wave',
    keywords: ['海', '水', '雨', '河', '淹', '泳', '淚', '浪', '船'],
    symbolName: '潮汐記憶井',
    icon: '🌊',
    titlePart: '潮汐',
    meaning: '情緒正像漲潮一樣悄悄漫過理智線，還好你自帶防水塗層。',
    insight: '水象元素在夢境流動，對應內在未被消化完的情緒波動；不要硬抗水流，順勢漂流反而能抵達更有趣的岸邊。',
  },
  {
    key: 'coin',
    visual: 'coin',
    keywords: ['錢', '發票', '樂透', '金', '銀', '買', '賣', '搶', '偷', '丟'],
    symbolName: '星辰硬幣',
    icon: '🪙',
    titlePart: '金幣',
    meaning: '暗示近期能量交換的敏感期：別為不值得的人事物支付情緒零錢。',
    insight: '價值與交換在夢中被戲劇化放大，宇宙想提醒你檢視自己最近把寶貴的注意力投資在了哪裡。',
  },
  {
    key: 'moon',
    visual: 'moon',
    keywords: ['月', '星', '夜', '夢', '宇宙', '光', '紫', '黑', '燈'],
    symbolName: '雙月星盤',
    icon: '🌙',
    titlePart: '雙月',
    meaning: '夜幕為你打開了隱藏版支線任務，直覺比邏輯更適合當今天的導航。',
    insight: '天體與夜色包覆整個夢境舞台，顯示你正處於靈感與轉折交會的微光地帶。',
  },
  {
    key: 'heart',
    visual: 'moon',
    keywords: ['愛', '喜歡', '前任', '告白', '曖昧', '結婚', '手', '朋友', '家人'],
    symbolName: '宿命紅線結',
    icon: '🔮',
    titlePart: '紅線',
    meaning: '人際磁場正在微妙重組，舊劇情不會重播，但會有新彩蛋。',
    insight: '情感記憶在夜間劇場重新剪輯上映，暗示你對某段關係已悄悄釋懷了七成，剩下三成只是好奇結局。',
  },
];

const MOOD_PROFILES = {
  '荒誕爆笑': {
    tonePrefix: '昨晚第七維度的喜劇星官顯然多喝了兩杯星塵濃縮，親自為你編導了這場荒誕神諭。',
    fortuneTone: '今日宇宙對你的態度是「雖然離譜但莫名合理」，越不按牌理出牌反而越容易歪打正著。',
    subtitles: ['荒謬表象下的宇宙冷笑話', '潛意識喜劇節特映神諭', '正經八百的混沌吉兆'],
  },
  '神秘懸疑': {
    tonePrefix: '在子時三刻的星象縫隙裡，古老的守門人悄悄記下了你夢中的這串密碼。',
    fortuneTone: '今日你的第六感準確度高達 97.4%，任何看似巧合的小細節其實都是暗號。',
    subtitles: ['來自迷霧彼岸的密文', '星盤裂縫中的低語', '午夜觀測站機密檔案'],
  },
  '懷舊惆悵': {
    tonePrefix: '時間的沙漏昨晚短暫倒流，把幾粒尚未風乾的記憶塵埃吹進了你的枕邊。',
    fortuneTone: '今日適合溫柔地對待自己，允許事情以稍微慢半拍的節奏發芽。',
    subtitles: ['褪色底片上的微光預言', '遺失時光裡的回聲', '舊日星辰的溫柔來信'],
  },
  '史詩奇幻': {
    tonePrefix: '諸神議會昨夜召開緊急會議，決定把一段濃縮版奇幻史詩直接空投進你的大腦皮層。',
    fortuneTone: '今日你自帶主角光環微弱版，遇到麻煩時記得抬頭挺胸，氣勢先贏一半。',
    subtitles: ['異界遠征前的星象授勳', '神話碎片重組之兆', '平行宇宙英雄召喚書'],
  },
  '日常魔幻': {
    tonePrefix: '根據《現代都巿神秘學年鑑》記載，最普通的日常場景一旦開始不講道理，便是大運啟動的前兆。',
    fortuneTone: '今日平凡的通勤與採買途中藏著微型驚喜，請保持眼睛發亮。',
    subtitles: ['藏在便利商店背後的結界', '都巿魔法顯影報告', '日常秩序的可愛裂縫'],
  },
};

const DO_POOL = [
  '點一杯平常不會選的飲料，向混沌星神致意',
  '把拖延超過三天的雜事挑一件火速解決',
  '對路邊的貓或盆栽點頭致意，累積神秘好感度',
  '把手機調成靜音二十分鐘，進行合法發呆儀式',
  '今天走路改走不同側的人行道，避開水逆碎石',
  '在筆記本角落畫一個只有你懂的神秘符號',
  '比平常早十五分鐘結束手邊內耗',
  '給自己買一樣十元到兩百元之間的微小快樂',
];

const DONT_POOL = [
  '在飢餓狀態下回覆長輩、客戶或前任的訊息',
  '試圖用純邏輯解釋今天發生的離譜巧合',
  '盯著購物車超過十分鐘還不決定結帳或關閉',
  '在電梯或茶水間進行沒有必要的靈魂社交',
  '睡前打開會讓血壓上升的短影音演算法',
  '替別人的粗心大意默默扛下無限責任',
  '空腹喝下第二杯冰美式並宣稱自己還好',
];

const LUCKY_ITEMS = [
  '發光的金屬湯匙',
  '沒折到的統一發票',
  '印著奇怪動物的襪子',
  '微溫的烏龍茶',
  '有缺角的橡皮擦',
  '口袋裡的零錢銅板',
  '藍紫色便條紙',
  '微風中的塑膠袋（遠觀用）',
];

const LUCKY_COLORS = [
  '星塵琥珀金',
  '午夜天鵝絨紫',
  '深海關東煮湯褐',
  '微醺暮光橘',
  '霓虹青瓷綠',
  '月蝕銀灰',
];

const MANTRAS = [
  '凡事發生，皆是宇宙幫我加的奇怪濾鏡。',
  '今日我只負責閃耀，因果交給水星去算帳。',
  '在混亂中保持優雅，就是最高級的魔法。',
  '我的直覺已連線，雜訊請自動退散。',
  '今天也是值得被寫進神話的普通星期幾。',
];

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function makeRng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

/**
 * Extract matching dream motifs from the dream text.
 */
export function extractDreamMotifs(dream) {
  const matched = [];
  for (const motif of MOTIF_CATALOG) {
    if (motif.keywords.some((kw) => dream.includes(kw))) {
      matched.push(motif);
    }
  }
  return matched;
}

/**
 * Extract a short vivid snippet from the user's dream for personalized callbacks.
 */
function extractDreamSnippet(dream) {
  const cleaned = dream.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= 18) return cleaned;
  const parts = cleaned.split(/[，。！？、；\n]/).filter((p) => p.trim().length >= 3);
  if (parts.length > 0) {
    const first = parts[0].trim();
    return first.length > 20 ? `${first.slice(0, 18)}…` : first;
  }
  return `${cleaned.slice(0, 18)}…`;
}

/**
 * Generate a complete deadpan-mystical dream decoding & daily fortune locally.
 */
export function decodeDreamLocally({ dream, mood = '荒誕爆笑', variation = 0 }) {
  const cleanDream = (dream || '').trim();
  const seed = hashString(`${cleanDream}::${mood}::${variation}`);
  const rng = makeRng(seed);

  const matched = extractDreamMotifs(cleanDream);
  const selectedMotifs = [...matched];
  while (selectedMotifs.length < 3) {
    const candidate = MOTIF_CATALOG[Math.floor(rng() * MOTIF_CATALOG.length)];
    if (!selectedMotifs.some((m) => m.key === candidate.key)) {
      selectedMotifs.push(candidate);
    }
  }
  const topThree = selectedMotifs.slice(0, 3);

  const arcanaNum = String(Math.floor(rng() * 899) + 100);
  const profile = MOOD_PROFILES[mood] || MOOD_PROFILES['荒誕爆笑'];
  const snippet = extractDreamSnippet(cleanDream);

  const titleTemplates = [
    `${topThree[0].titlePart}與${topThree[1].titlePart}之兆`,
    `午夜${topThree[0].titlePart}神諭`,
    `${topThree[0].titlePart}降臨的第${Math.floor(rng() * 7) + 3}維度`,
    `星海${topThree[0].titlePart}變奏曲`,
  ];

  const para1 = `${profile.tonePrefix}當你夢見「${snippet}」的瞬間，天頂星盤上的「${topThree[0].symbolName}」與「${topThree[1].symbolName}」恰好完成了罕見的對沖。${topThree[0].insight}`;
  const para2 = `更耐人尋味的是「${topThree[2].symbolName}」在幕後的推波助瀾——${topThree[2].insight}大占卜師提醒你：這絕非單純睡姿壓迫或宵夜消化不良，而是潛意識正在用超現實蒙太奇告訴你，近期別再對荒謬的人事物過度認真。`;

  const score = () => Math.floor(rng() * 3) + 3; // 3..5 with occasional 2
  const wealth = rng() < 0.2 ? 2 : score();
  const love = rng() < 0.2 ? 2 : score();
  const career = score();
  const sanity = rng() < 0.25 ? 2 : score();

  return {
    arcanaCode: `ARCANA NO. ${arcanaNum}`,
    title: pick(titleTemplates, rng),
    subtitle: pick(profile.subtitles, rng),
    interpretation: [para1, para2],
    symbols: topThree.map((m) => ({
      name: m.symbolName,
      icon: m.icon,
      meaning: m.meaning,
    })),
    fortune: {
      wealth,
      love,
      career,
      sanity,
      summary: `${profile.fortuneTone}把握直覺閃現的三秒鐘，你今天會比昨天更像自己。`,
      doThing: pick(DO_POOL, rng),
      dontThing: pick(DONT_POOL, rng),
      luckyItem: pick(LUCKY_ITEMS, rng),
      luckyColor: pick(LUCKY_COLORS, rng),
      luckyNumber: String(Math.floor(rng() * 89) + 11),
      mantra: pick(MANTRAS, rng),
    },
    visualMotifs: Array.from(new Set(selectedMotifs.slice(0, 4).map((m) => m.visual))),
    seed,
  };
}
