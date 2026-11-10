// Run with: node --test
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const I = require('../app/js/core.js');
require('../app/data/common.js');
require('../app/data/de.js');
require('../app/data/en.js');
const DATA = globalThis.ICHING_DATA;

test('King Wen table: 64 unique hexagrams with correct Unicode glyphs', () => {
  assert.equal(I.HEXAGRAMS.length, 64);
  assert.equal(new Set(I.HEXAGRAMS.map((h) => h.bin)).size, 64);
  assert.equal(I.hexagram(1).bin, '111111');
  assert.equal(I.hexagram(2).bin, '000000');
  assert.equal(I.hexagram(3).bin, '100010'); // thunder below, water above
  assert.equal(I.hexagram(39).bin, '001010'); // mountain below, water above
  assert.equal(I.hexagram(40).bin, '010100'); // water below, thunder above
  assert.equal(I.hexagram(63).bin, '101010');
  assert.equal(I.hexagram(64).bin, '010101');
  assert.equal(I.hexagram(1).unicode, '䷀');
  assert.equal(I.hexagram(64).unicode, '䷿');
});

test('related hexagrams', () => {
  assert.equal(I.opposite(1), 2);
  assert.equal(I.inverted(3), 4);
  assert.equal(I.inverted(63), 64);
  assert.equal(I.nuclear(1), 1);
  assert.equal(I.nuclear(63), 64);
  assert.equal(I.nuclear(64), 63);
});

test('reading: moving lines and resulting hexagram', () => {
  const r = I.reading([9, 9, 9, 9, 9, 9]);
  assert.equal(r.primary, 1);
  assert.equal(r.changed, 2);
  assert.deepEqual(r.moving, [0, 1, 2, 3, 4, 5]);

  const still = I.reading([7, 8, 8, 8, 7, 8]);
  assert.equal(still.primary, 3);
  assert.equal(still.changed, null);
  assert.deepEqual(still.moving, []);

  const one = I.reading([7, 7, 7, 7, 7, 6]); // top line of 43 moves → 1
  assert.equal(one.primary, 43);
  assert.equal(one.changed, 1);

  assert.throws(() => I.reading([7, 7, 7]));
  assert.throws(() => I.reading([7, 7, 7, 7, 7, 5]));
});

test('coin and yarrow probabilities', () => {
  const rand = I.seededRandom(42);
  const count = (fn) => {
    const c = { 6: 0, 7: 0, 8: 0, 9: 0 };
    for (let i = 0; i < 160000; i++) c[fn(rand).value]++;
    return Object.fromEntries(Object.entries(c).map(([k, v]) => [k, v / 160000]));
  };
  const coins = count(I.castCoins);
  assert.ok(Math.abs(coins[6] - 1 / 8) < 0.01 && Math.abs(coins[7] - 3 / 8) < 0.01);
  assert.ok(Math.abs(coins[8] - 3 / 8) < 0.01 && Math.abs(coins[9] - 1 / 8) < 0.01);
  const yarrow = count(I.castYarrow);
  assert.ok(Math.abs(yarrow[6] - 1 / 16) < 0.01 && Math.abs(yarrow[7] - 5 / 16) < 0.01);
  assert.ok(Math.abs(yarrow[8] - 7 / 16) < 0.01 && Math.abs(yarrow[9] - 3 / 16) < 0.01);
});

test('secure random produces valid hexagrams', () => {
  for (let i = 0; i < 200; i++) {
    const r = I.reading(I.castHexagram('coins'));
    assert.ok(r.primary >= 1 && r.primary <= 64);
  }
});

test('plum blossom: numbers to trigrams and moving line', () => {
  // 1 → Qian, 8 → Kun, 16 → Kun, 9 → Qian; moving 6 → line 6, 7 → line 1
  const r = I.plumBlossom(1, 8, 6);
  assert.equal(r.upper, 'qian');
  assert.equal(r.lower, 'kun');
  assert.equal(r.n, 12);
  assert.equal(r.movingLine, 6);
  assert.equal(I.plumBlossom(9, 16, 7).movingLine, 1);
  const rd = I.reading(r.values);
  assert.equal(rd.primary, 12);
  assert.deepEqual(rd.moving, [5]);
  assert.equal(rd.changed, 45); // top line of 12 changes: lake over earth
});

test('name oracle is deterministic and handles umlauts', () => {
  assert.equal(I.normalizeName('  Jürgen  Groß-Müller '), 'juergen gross mueller');
  const a = I.nameOracle('Anna Schmidt');
  const b = I.nameOracle('anna   SCHMIDT');
  assert.deepEqual(a.values, b.values);
  const n = I.nameNumbers('Anna Schmidt');
  assert.equal(n.upper, 1 + 14 + 14 + 1);
  assert.equal(n.lower, [...'schmidt'].reduce((s, c) => s + c.charCodeAt(0) - 96, 0));
  assert.ok(I.nameOracle('Li').n >= 1);
  assert.throws(() => I.nameOracle('1234'));
});

test('birthday oracle', () => {
  assert.equal(I.yearBranch(2020), 1); // year of the rat
  assert.equal(I.yearBranch(1984), 1);
  assert.equal(I.hourBranch(23), 1);
  assert.equal(I.hourBranch(0), 1);
  assert.equal(I.hourBranch(1), 2);
  assert.equal(I.hourBranch(12), 7);
  const r = I.birthdayOracle({ year: 1990, month: 5, day: 17 });
  assert.equal(r.numbers.hourBranch, 7);
  assert.equal(r.numbers.upper, I.yearBranch(1990) + 5 + 17);
  assert.throws(() => I.birthdayOracle({ year: 1990, month: 13, day: 1 }));
});

test('daily oracle is stable within a day and varies across days', () => {
  assert.deepEqual(I.dailyValues('2026-11-09'), I.dailyValues('2026-11-09'));
  const seen = new Set();
  for (let d = 1; d <= 28; d++) seen.add(I.reading(I.dailyValues(`2026-02-${String(d).padStart(2, '0')}`)).primary);
  assert.ok(seen.size > 10);
});

test('text data is complete in both languages', () => {
  for (const lang of ['de', 'en']) {
    const hs = DATA[lang].hexagrams;
    assert.equal(hs.length, 64, lang);
    for (const h of hs) {
      assert.ok(h.name && h.judgment.text && h.image.text, `${lang} ${h.n}`);
      assert.equal(h.lines.length, 6, `${lang} ${h.n}`);
      for (const l of h.lines) assert.ok(l.text && l.comment, `${lang} ${h.n} line`);
      if (h.n <= 2) assert.ok(h.all && h.all.text);
      else assert.equal(h.all, null);
    }
  }
  assert.equal(DATA.common.length, 64);
  assert.equal(DATA.de.hexagrams[0].name, 'Das Schöpferische');
  assert.match(DATA.de.hexagrams[0].judgment.text, /erhabenes Gelingen/);
});
