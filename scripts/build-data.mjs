#!/usr/bin/env node
// Builds the app's text data from two openly licensed sources:
//
//   German  – Richard Wilhelm, "I Ging. Das Buch der Wandlungen" (Diederichs, Jena 1924).
//             Public domain (Wilhelm died 1930). Digitised text taken from
//             https://github.com/johannes-kaindl/yijing  (data/hexagrams.json, declared public domain).
//             Only Wilhelm's original wording is used – no edited variants, no added material.
//   English – Fresh English translation of Wilhelm's 1924 German edition, dedicated to the
//             public domain under CC0 1.0 by its authors:
//             https://github.com/jesshewitt/i-ching  (translation/hexagrams-wilhelm.json)
//
// Usage:
//   git clone --depth 1 https://github.com/johannes-kaindl/yijing /tmp/src-de
//   git clone --depth 1 https://github.com/jesshewitt/i-ching   /tmp/src-en
//   node scripts/build-data.mjs /tmp/src-de/data/hexagrams.json /tmp/src-en/translation/hexagrams-wilhelm.json
//
// Output: app/data/common.js, app/data/de.js, app/data/en.js

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const core = require('../app/js/core.js');

const [deFile, enFile] = process.argv.slice(2);
if (!deFile || !enFile) {
  console.error('usage: node scripts/build-data.mjs <de hexagrams.json> <en hexagrams-wilhelm.json>');
  process.exit(1);
}
const de = JSON.parse(fs.readFileSync(deFile, 'utf8'));
const en = JSON.parse(fs.readFileSync(enFile, 'utf8'));
if (de.length !== 64 || en.length !== 64) throw new Error('expected 64 hexagrams in each source');

// Wilhelm's hexagram names, cleanly cased (the source has OCR slips such as "WIEDERKEHRT").
const NAMES_DE = [
  'Das Schöpferische', 'Das Empfangende', 'Die Anfangsschwierigkeit', 'Die Jugendtorheit',
  'Das Warten (Die Ernährung)', 'Der Streit', 'Das Heer', 'Das Zusammenhalten',
  'Des Kleinen Zähmungskraft', 'Das Auftreten', 'Der Friede', 'Die Stockung',
  'Gemeinschaft mit Menschen', 'Der Besitz von Großem', 'Die Bescheidenheit', 'Die Begeisterung',
  'Die Nachfolge', 'Die Arbeit am Verdorbenen', 'Die Annäherung', 'Die Betrachtung (Der Anblick)',
  'Das Durchbeißen', 'Die Anmut', 'Die Zersplitterung', 'Die Wiederkehr (Die Wendezeit)',
  'Die Unschuld (Das Unerwartete)', 'Des Großen Zähmungskraft', 'Die Mundwinkel (Die Ernährung)', 'Des Großen Übergewicht',
  'Das Abgründige, das Wasser', 'Das Haftende, das Feuer', 'Die Einwirkung (Die Werbung)', 'Die Dauer',
  'Der Rückzug', 'Des Großen Macht', 'Der Fortschritt', 'Die Verfinsterung des Lichts',
  'Die Sippe', 'Der Gegensatz', 'Das Hemmnis', 'Die Befreiung',
  'Die Minderung', 'Die Mehrung', 'Der Durchbruch (Die Entschlossenheit)', 'Das Entgegenkommen',
  'Die Sammlung', 'Das Empordringen', 'Die Bedrängnis (Die Erschöpfung)', 'Der Brunnen',
  'Die Umwälzung (Die Mauserung)', 'Der Tiegel', 'Das Erregende (Das Erschütternde, der Donner)', 'Das Stillehalten, der Berg',
  'Die Entwicklung (Allmählicher Fortschritt)', 'Das heiratende Mädchen', 'Die Fülle', 'Der Wanderer',
  'Das Sanfte (Das Eindringliche, der Wind)', 'Das Heitere, der See', 'Die Auflösung', 'Die Beschränkung',
  'Innere Wahrheit', 'Des Kleinen Übergewicht', 'Nach der Vollendung', 'Vor der Vollendung',
];

// Standard characters and pinyin (the source's pinyin has tone-mark slips, e.g. "taì").
const ZH = '乾 坤 屯 蒙 需 訟 師 比 小畜 履 泰 否 同人 大有 謙 豫 隨 蠱 臨 觀 噬嗑 賁 剝 復 無妄 大畜 頤 大過 坎 離 咸 恆 遯 大壯 晉 明夷 家人 睽 蹇 解 損 益 夬 姤 萃 升 困 井 革 鼎 震 艮 漸 歸妹 豐 旅 巽 兌 渙 節 中孚 小過 既濟 未濟'.split(' ');
const PINYIN = ('qián|kūn|zhūn|méng|xū|sòng|shī|bǐ|xiǎo xù|lǚ|tài|pǐ|tóng rén|dà yǒu|qiān|yù|suí|gǔ|lín|guān|' +
  'shì hé|bì|bō|fù|wú wàng|dà xù|yí|dà guò|kǎn|lí|xián|héng|dùn|dà zhuàng|jìn|míng yí|jiā rén|kuí|jiǎn|xiè|' +
  'sǔn|yì|guài|gòu|cuì|shēng|kùn|jǐng|gé|dǐng|zhèn|gèn|jiàn|guī mèi|fēng|lǚ|xùn|duì|huàn|jié|zhōng fú|' +
  'xiǎo guò|jì jì|wèi jì').split('|');

const clean = (s) => (s || '')
  .replace(/\r/g, '')
  .replace(/[ \t]+\n/g, '\n')
  .replace(/\n{3,}/g, '\n\n')
  .replace(/ +([.,;:!?])(?=\s|$)/g, '$1')
  .replace(/ {2,}/g, ' ')
  .trim();

function splitVerse(s) {
  const t = clean(s);
  const i = t.indexOf('\n\n');
  return i < 0 ? { text: t, comment: '' } : { text: t.slice(0, i).trim(), comment: t.slice(i + 2).trim() };
}

const common = [];
const outDe = [];
const outEn = [];
const problems = [];

for (let i = 0; i < 64; i++) {
  const n = i + 1;
  const d = de[i];
  const e = en[i];
  if (d.number !== n || e.id !== n) throw new Error(`order mismatch at ${n}`);
  const bin = core.hexagram(n).bin;

  // Cross-check structure against both sources.
  const enBin = [...e.value].reverse().map((c) => (c === '7' ? '1' : '0')).join('');
  if (enBin !== bin) throw new Error(`EN source line pattern disagrees with King Wen table at ${n}`);
  if (d.binary !== bin) problems.push(`DE source line pattern for ${n} was ${d.binary}, corrected to ${bin}`);
  if (d.lines.length !== (n <= 2 ? 7 : 6) || e.lines.length !== (n <= 2 ? 7 : 6)) throw new Error(`line count at ${n}`);

  if (d.name_chinese !== ZH[i]) throw new Error(`Chinese name disagrees at ${n}`);
  common.push({ n, zh: ZH[i], pinyin: PINYIN[i], latin: n === 36 ? 'Ming I' : d.name_latin });

  const deLines = d.lines.map((l) => ({ text: clean(l.text), comment: clean(l.interpretation) }));
  outDe.push({
    n,
    name: NAMES_DE[i],
    meaning: clean(d.meaning),
    judgment: splitVerse(d.judgment),
    image: splitVerse(d.image),
    lines: deLines.slice(0, 6),
    all: n <= 2 ? deLines[6] : null,
    notes: (d.notes || []).map((x) => ({ anchor: x.anchor, text: clean(x.text) })),
  });

  const enLines = e.lines.map((raw, k) => {
    const t = clean(raw);
    const j = t.indexOf('\n');
    return { text: j < 0 ? t : t.slice(j + 1).trim(), comment: clean(e.linesCommentary[k]) };
  });
  outEn.push({
    n,
    name: e.ename,
    wade: e.cename,
    meaning: clean(e.commentary),
    judgment: { text: clean(e.judgment), comment: clean(e.judgmentCommentary) },
    image: { text: clean(e.image), comment: clean(e.imageCommentary) },
    lines: enLines.slice(0, 6),
    all: n <= 2 ? enLines[6] : null,
    notes: [],
  });
}

const banner = (what) => `/* ${what}\n * Generated by scripts/build-data.mjs – do not edit by hand. */\n`;
const outDir = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'app', 'data');
fs.mkdirSync(outDir, { recursive: true });

const write = (file, key, data, what) => {
  const body = `${banner(what)}(function (root) {\n  root.ICHING_DATA = root.ICHING_DATA || {};\n  root.ICHING_DATA[${JSON.stringify(key)}] = ${JSON.stringify(data)};\n})(typeof window !== 'undefined' ? window : globalThis);\n`;
  fs.writeFileSync(path.join(outDir, file), body);
  console.log(`wrote app/data/${file} (${(body.length / 1024).toFixed(0)} KB)`);
};

write('common.js', 'common', common, 'Chinese names and pinyin of the 64 hexagrams.');
write('de.js', 'de', {
  lang: 'de',
  source: 'Richard Wilhelm: I Ging. Das Buch der Wandlungen. Eugen Diederichs, Jena 1924. Gemeinfrei.',
  hexagrams: outDe,
}, 'Richard Wilhelm, I Ging – Das Buch der Wandlungen (1924). Public domain.');
write('en.js', 'en', {
  lang: 'en',
  source: "English translation of Richard Wilhelm's 1924 German edition, CC0 1.0 (github.com/jesshewitt/i-ching).",
  hexagrams: outEn,
}, "English translation of Richard Wilhelm's 1924 German text. CC0 1.0 Universal.");

if (problems.length) console.log('Corrections:\n  ' + problems.join('\n  '));
