/*
 * Wandlungen – core logic of the I Ching oracle.
 * Pure functions, no DOM. Works in the browser (window.IChing) and in Node (require).
 * SPDX-License-Identifier: MIT
 *
 * Conventions
 *   - Line patterns ("bin") are written bottom → top, "1" = yang (solid), "0" = yin (broken).
 *   - Line values follow the classic oracle numbers:
 *       6 = old yin (moving), 7 = young yang, 8 = young yin, 9 = old yang (moving).
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.IChing = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  // ---------------------------------------------------------------- trigrams
  // "early" is the Early Heaven (Fu Xi) number used by the Plum Blossom method.
  const TRIGRAMS = {
    qian: { key: 'qian', bin: '111', symbol: '☰', zh: '乾', pinyin: 'qián', latin: 'Kiën', wade: "Ch'ien", early: 1,
      de: { name: 'Das Schöpferische', image: 'Himmel', quality: 'stark', family: 'Vater' },
      en: { name: 'The Creative', image: 'Heaven', quality: 'strong', family: 'father' } },
    dui: { key: 'dui', bin: '110', symbol: '☱', zh: '兌', pinyin: 'duì', latin: 'Dui', wade: 'Tui', early: 2,
      de: { name: 'Das Heitere', image: 'See', quality: 'fröhlich', family: 'jüngste Tochter' },
      en: { name: 'The Joyous', image: 'Lake', quality: 'joyful', family: 'youngest daughter' } },
    li: { key: 'li', bin: '101', symbol: '☲', zh: '離', pinyin: 'lí', latin: 'Li', wade: 'Li', early: 3,
      de: { name: 'Das Haftende', image: 'Feuer', quality: 'haftend, hell', family: 'mittlere Tochter' },
      en: { name: 'The Clinging', image: 'Fire', quality: 'clinging, light-giving', family: 'middle daughter' } },
    zhen: { key: 'zhen', bin: '100', symbol: '☳', zh: '震', pinyin: 'zhèn', latin: 'Dschen', wade: 'Chên', early: 4,
      de: { name: 'Das Erregende', image: 'Donner', quality: 'bewegend', family: 'ältester Sohn' },
      en: { name: 'The Arousing', image: 'Thunder', quality: 'inciting movement', family: 'eldest son' } },
    xun: { key: 'xun', bin: '011', symbol: '☴', zh: '巽', pinyin: 'xùn', latin: 'Sun', wade: 'Sun', early: 5,
      de: { name: 'Das Sanfte', image: 'Wind, Holz', quality: 'eindringend', family: 'älteste Tochter' },
      en: { name: 'The Gentle', image: 'Wind, Wood', quality: 'penetrating', family: 'eldest daughter' } },
    kan: { key: 'kan', bin: '010', symbol: '☵', zh: '坎', pinyin: 'kǎn', latin: 'Kan', wade: "K'an", early: 6,
      de: { name: 'Das Abgründige', image: 'Wasser', quality: 'gefährlich', family: 'mittlerer Sohn' },
      en: { name: 'The Abysmal', image: 'Water', quality: 'dangerous', family: 'middle son' } },
    gen: { key: 'gen', bin: '001', symbol: '☶', zh: '艮', pinyin: 'gèn', latin: 'Gen', wade: 'Kên', early: 7,
      de: { name: 'Das Stillehalten', image: 'Berg', quality: 'ruhend', family: 'jüngster Sohn' },
      en: { name: 'Keeping Still', image: 'Mountain', quality: 'resting', family: 'youngest son' } },
    kun: { key: 'kun', bin: '000', symbol: '☷', zh: '坤', pinyin: 'kūn', latin: 'Kun', wade: "K'un", early: 8,
      de: { name: 'Das Empfangende', image: 'Erde', quality: 'hingebend', family: 'Mutter' },
      en: { name: 'The Receptive', image: 'Earth', quality: 'devoted, yielding', family: 'mother' } },
  };
  // Order used for the 8 × 8 trigram table (Wilhelm's key to the hexagrams).
  const TRIGRAM_ORDER = ['qian', 'zhen', 'kan', 'gen', 'kun', 'xun', 'li', 'dui'];
  const EARLY_HEAVEN = ['kun', 'qian', 'dui', 'li', 'zhen', 'xun', 'kan', 'gen']; // index = number mod 8

  // ------------------------------------------------- King Wen sequence [upper, lower]
  const KING_WEN = [
    ['qian', 'qian'], ['kun', 'kun'], ['kan', 'zhen'], ['gen', 'kan'], ['kan', 'qian'], ['qian', 'kan'],
    ['kun', 'kan'], ['kan', 'kun'], ['xun', 'qian'], ['qian', 'dui'], ['kun', 'qian'], ['qian', 'kun'],
    ['qian', 'li'], ['li', 'qian'], ['kun', 'gen'], ['zhen', 'kun'], ['dui', 'zhen'], ['gen', 'xun'],
    ['kun', 'dui'], ['xun', 'kun'], ['li', 'zhen'], ['gen', 'li'], ['gen', 'kun'], ['kun', 'zhen'],
    ['qian', 'zhen'], ['gen', 'qian'], ['gen', 'zhen'], ['dui', 'xun'], ['kan', 'kan'], ['li', 'li'],
    ['dui', 'gen'], ['zhen', 'xun'], ['qian', 'gen'], ['zhen', 'qian'], ['li', 'kun'], ['kun', 'li'],
    ['xun', 'li'], ['li', 'dui'], ['kan', 'gen'], ['zhen', 'kan'], ['gen', 'dui'], ['xun', 'zhen'],
    ['dui', 'qian'], ['qian', 'xun'], ['dui', 'kun'], ['kun', 'xun'], ['dui', 'kan'], ['kan', 'xun'],
    ['dui', 'li'], ['li', 'xun'], ['zhen', 'zhen'], ['gen', 'gen'], ['xun', 'gen'], ['zhen', 'dui'],
    ['zhen', 'li'], ['li', 'gen'], ['xun', 'xun'], ['dui', 'dui'], ['xun', 'kan'], ['kan', 'dui'],
    ['xun', 'dui'], ['zhen', 'gen'], ['kan', 'li'], ['li', 'kan'],
  ];

  const HEXAGRAMS = KING_WEN.map(([upper, lower], i) => ({
    n: i + 1,
    upper,
    lower,
    bin: TRIGRAMS[lower].bin + TRIGRAMS[upper].bin,
    unicode: String.fromCodePoint(0x4dc0 + i),
  }));
  const BY_BIN = Object.fromEntries(HEXAGRAMS.map((h) => [h.bin, h.n]));
  const TRIGRAM_BY_BIN = Object.fromEntries(Object.values(TRIGRAMS).map((t) => [t.bin, t.key]));

  function hexagram(n) {
    const h = HEXAGRAMS[n - 1];
    if (!h) throw new RangeError('hexagram number must be 1–64');
    return h;
  }
  function numberFromBin(bin) {
    const n = BY_BIN[bin];
    if (!n) throw new RangeError('invalid line pattern: ' + bin);
    return n;
  }
  function numberFromTrigrams(upper, lower) {
    return numberFromBin(TRIGRAMS[lower].bin + TRIGRAMS[upper].bin);
  }

  // ------------------------------------------------------- related hexagrams
  /** Nuclear hexagram (Kernzeichen): lines 2–4 below, 3–5 above. */
  function nuclear(n) {
    const b = hexagram(n).bin;
    return numberFromBin(b.slice(1, 4) + b.slice(2, 5));
  }
  /** Hexagram turned upside down (Umkehrung). */
  function inverted(n) {
    return numberFromBin(hexagram(n).bin.split('').reverse().join(''));
  }
  /** Every line changed into its opposite (Gegenzeichen). */
  function opposite(n) {
    return numberFromBin(hexagram(n).bin.split('').map((c) => (c === '1' ? '0' : '1')).join(''));
  }

  // -------------------------------------------------------------- randomness
  function secureRandom() {
    const c = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
    if (c && typeof c.getRandomValues === 'function') {
      const a = new Uint32Array(1);
      c.getRandomValues(a);
      return a[0] / 4294967296;
    }
    return Math.random();
  }
  /** FNV-1a 32-bit string hash. */
  function hashString(str) {
    let h = 0x811c9dc5;
    for (const ch of String(str)) {
      h ^= ch.codePointAt(0);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h >>> 0;
  }
  /** Small deterministic PRNG (mulberry32) for the daily oracle. */
  function seededRandom(seed) {
    let a = (typeof seed === 'number' ? seed : hashString(seed)) >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------------------------------------------------------------- casting
  /**
   * Three-coin method: each coin counts 3 (yang side) or 2 (yin side).
   * Probabilities: 6 → 1/8, 7 → 3/8, 8 → 3/8, 9 → 1/8.
   */
  function castCoins(rand = secureRandom) {
    const coins = [0, 1, 2].map(() => (rand() < 0.5 ? 2 : 3));
    return { coins, value: coins[0] + coins[1] + coins[2] };
  }
  /**
   * Yarrow-stalk probabilities (the traditional method, simulated):
   * 6 → 1/16, 7 → 5/16, 8 → 7/16, 9 → 3/16.
   */
  function castYarrow(rand = secureRandom) {
    const r = Math.floor(rand() * 16);
    const value = r < 1 ? 6 : r < 6 ? 7 : r < 13 ? 8 : 9;
    return { coins: null, value };
  }
  function castLine(method, rand) {
    return method === 'yarrow' ? castYarrow(rand) : castCoins(rand);
  }
  function castHexagram(method = 'coins', rand = secureRandom) {
    return Array.from({ length: 6 }, () => castLine(method, rand).value);
  }

  const isValue = (v) => v === 6 || v === 7 || v === 8 || v === 9;
  const isMoving = (v) => v === 6 || v === 9;

  /** Turns six line values (bottom → top) into a reading. */
  function reading(values) {
    if (!Array.isArray(values) || values.length !== 6 || !values.every(isValue)) {
      throw new TypeError('a reading needs six line values, each 6, 7, 8 or 9');
    }
    const bin = values.map((v) => (v % 2 ? '1' : '0')).join('');
    const moving = values.map((v, i) => (isMoving(v) ? i : -1)).filter((i) => i >= 0);
    const changedBin = values.map((v) => (v === 9 ? '0' : v === 6 ? '1' : v % 2 ? '1' : '0')).join('');
    return {
      values: values.slice(),
      primary: numberFromBin(bin),
      moving,
      changed: moving.length ? numberFromBin(changedBin) : null,
    };
  }

  /** Line values for a hexagram with (optionally) one moving line, 1-based from the bottom. */
  function valuesFor(n, movingLine) {
    return hexagram(n).bin.split('').map((c, i) => {
      const yang = c === '1';
      if (i + 1 === movingLine) return yang ? 9 : 6;
      return yang ? 7 : 8;
    });
  }

  // ------------------------------------------------- Plum Blossom numerology
  // Meihua Yishu (Shao Yong): number mod 8 → Early Heaven trigram; total mod 6 → moving line.
  const mod = (x, m) => ((x % m) + m) % m;
  const trigramFromNumber = (x) => EARLY_HEAVEN[mod(x, 8)];
  const lineFromNumber = (x) => mod(x - 1, 6) + 1;

  function plumBlossom(upperNumber, lowerNumber, movingNumber) {
    const upper = trigramFromNumber(upperNumber);
    const lower = trigramFromNumber(lowerNumber);
    const n = numberFromTrigrams(upper, lower);
    const movingLine = lineFromNumber(movingNumber);
    return { upper, lower, n, movingLine, values: valuesFor(n, movingLine) };
  }

  /** Letters only, accents removed, umlauts expanded the German way. */
  function normalizeName(name) {
    return String(name || '')
      .toLowerCase()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  const letterSum = (word) => [...word].reduce((s, ch) => s + (ch >= 'a' && ch <= 'z' ? ch.charCodeAt(0) - 96 : 0), 0);

  /**
   * Splits a name into an upper and a lower number.
   * Several words: first word above, the rest below.
   * One word: first half of the letters above, second half below (the upper part gets the
   * smaller half, as with an odd number of characters in the classic method).
   */
  function nameNumbers(name) {
    const norm = normalizeName(name);
    if (!norm) throw new RangeError('name contains no letters');
    const words = norm.split(' ');
    let upper, lower;
    if (words.length > 1) {
      upper = letterSum(words[0]);
      lower = letterSum(words.slice(1).join(''));
    } else {
      const w = words[0];
      const half = Math.floor(w.length / 2);
      upper = letterSum(w.slice(0, half)) || letterSum(w);
      lower = letterSum(w.slice(half));
    }
    return { normalized: norm, upper, lower, total: upper + lower };
  }

  function nameOracle(name) {
    const nn = nameNumbers(name);
    return Object.assign({ numbers: nn }, plumBlossom(nn.upper, nn.lower, nn.total));
  }

  /** Chinese double hour (1 = Zi, 23:00–00:59 … 12 = Hai, 21:00–22:59). */
  function hourBranch(hour) {
    return Math.floor(mod(hour + 1, 24) / 2) + 1;
  }
  /** Earthly branch of the year (1 = rat). Uses the Gregorian year for simplicity. */
  function yearBranch(year) {
    return mod(year - 4, 12) + 1;
  }
  /**
   * Birthday oracle after the Plum Blossom date method:
   *   upper = year branch + month + day; lower = upper + hour branch; moving line = lower.
   * Without a birth time the noon hour (Wu, 7) is used.
   */
  function birthdayOracle({ year, month, day, hour }) {
    if (!(year > 0 && month >= 1 && month <= 12 && day >= 1 && day <= 31)) throw new RangeError('invalid date');
    const yb = yearBranch(year);
    const hb = hour === null || hour === undefined || hour === '' ? 7 : hourBranch(Number(hour));
    const upperNumber = yb + month + day;
    const lowerNumber = upperNumber + hb;
    return Object.assign({ numbers: { yearBranch: yb, hourBranch: hb, upper: upperNumber, lower: lowerNumber } },
      plumBlossom(upperNumber, lowerNumber, lowerNumber));
  }

  /** Love oracle: first person's name above, second person's below, moving line from both. */
  function loveOracle(nameA, nameB) {
    const a = nameNumbers(nameA);
    const b = nameNumbers(nameB);
    return Object.assign({ numbers: { a: a.total, b: b.total } }, plumBlossom(a.total, b.total, a.total + b.total));
  }

  // ------------------------------------------------------------------ daily
  function dateKey(date = new Date()) {
    const p = (x) => String(x).padStart(2, '0');
    return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
  }
  /** Same result for the whole day (and the same person), different from day to day. */
  function dailyValues(key, personalSeed = '') {
    const rand = seededRandom(hashString('wandlungen|' + key + '|' + normalizeName(personalSeed)));
    return castHexagram('coins', rand);
  }

  /** Quick oracle: one hexagram without moving lines. */
  function quickNumber(rand = secureRandom) {
    return Math.floor(rand() * 64) + 1;
  }

  return {
    TRIGRAMS, TRIGRAM_ORDER, EARLY_HEAVEN, KING_WEN, HEXAGRAMS, TRIGRAM_BY_BIN,
    hexagram, numberFromBin, numberFromTrigrams, nuclear, inverted, opposite,
    secureRandom, hashString, seededRandom,
    castCoins, castYarrow, castLine, castHexagram, isMoving, reading, valuesFor,
    plumBlossom, normalizeName, nameNumbers, nameOracle, hourBranch, yearBranch, birthdayOracle, loveOracle,
    dateKey, dailyValues, quickNumber,
  };
});
