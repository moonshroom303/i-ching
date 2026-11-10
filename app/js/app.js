/* Wandlungen – user interface. SPDX-License-Identifier: MIT */
(function () {
  'use strict';

  const APP_VERSION = '1.0.0';
  const I = window.IChing;
  const DATA = window.ICHING_DATA;
  const L = window.WandlungenI18n;
  const ABOUT = window.WandlungenAbout;

  // ------------------------------------------------------------------ utils
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const paras = (text) => esc(text).split(/\n{2,}/).filter(Boolean).map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
  const verse = (text) => `<p class="verse">${esc(text).replace(/\n/g, '<br>')}</p>`;
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
  const reduceMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, reduceMotion() ? 0 : ms));

  // ---------------------------------------------------------------- storage
  const memory = {};
  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        if (raw != null) return JSON.parse(raw);
      } catch (e) { /* storage unavailable */ }
      return key in memory ? memory[key] : fallback;
    },
    set(key, value) {
      memory[key] = value;
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* keep in memory */ }
    },
    remove(key) {
      delete memory[key];
      try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
    },
  };

  const BACKGROUNDS = [['seladon', '#a9c4b0'], ['reis', '#d9c9a2'], ['nebel', '#a7bbd0'], ['kirsche', '#dcaab2'], ['lavendel', '#b8afd8'], ['weiss', '#ffffff']];
  const SETTINGS_KEY = 'wandlungen.settings.v1';
  const JOURNAL_KEY = 'wandlungen.journal.v1';
  const DEFAULTS = { lang: 'auto', theme: 'system', bg: 'seladon', method: 'coins', castMode: 'single', commentary: 'closed', textSize: 'm', dailyName: '' };
  let settings = Object.assign({}, DEFAULTS, store.get(SETTINGS_KEY, {}));

  const journal = {
    all() {
      const list = store.get(JOURNAL_KEY, []);
      return Array.isArray(list) ? list : [];
    },
    write(list) { store.set(JOURNAL_KEY, list); },
    add(entry) { const list = journal.all(); list.unshift(entry); journal.write(list); return entry; },
    get(id) { return journal.all().find((e) => e.id === id) || null; },
    update(id, patch) { journal.write(journal.all().map((e) => (e.id === id ? Object.assign({}, e, patch) : e))); },
    remove(id) { journal.write(journal.all().filter((e) => e.id !== id)); },
  };

  // ------------------------------------------------------------------- i18n
  function lang() {
    if (settings.lang === 'de' || settings.lang === 'en') return settings.lang;
    const nav = (navigator.languages && navigator.languages[0]) || navigator.language || 'de';
    return /^en\b/i.test(nav) ? 'en' : 'de';
  }
  function t(key, vars) {
    const dict = L[lang()];
    let s = key in dict ? dict[key] : (key in L.de ? L.de[key] : key);
    if (vars && typeof s === 'string') s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] == null ? '' : vars[k]));
    return s;
  }
  const locale = () => (lang() === 'de' ? 'de-DE' : 'en-GB');
  function fmtDate(iso, withTime = true) {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    const opts = withTime ? { dateStyle: 'long', timeStyle: 'short' } : { dateStyle: 'full' };
    return new Intl.DateTimeFormat(locale(), opts).format(d);
  }
  const text = (n) => DATA[lang()].hexagrams[n - 1];
  const common = (n) => DATA.common[n - 1];
  const hexName = (n) => text(n).name;
  function trig(key) {
    const tr = I.TRIGRAMS[key];
    return Object.assign({ key, symbol: tr.symbol, latin: lang() === 'de' ? tr.latin : tr.wade, zh: tr.zh, pinyin: tr.pinyin, bin: tr.bin }, tr[lang()]);
  }
  const lowerArticle = (s) => s.replace(/^(Das|Die|Der|The) /, (m) => m.toLowerCase());
  const trigramPhrase = (key) => { const x = trig(key); return `${x.symbol} ${x.latin}, ${lowerArticle(x.name)} (${x.image})`; };

  // ------------------------------------------------------------------ svg
  function hexSVG(bin, opts = {}) {
    const { moving = [], drawn = 6, size = 'm', label = '', animateFrom = 6 } = opts;
    const W = 120, H = 13, G = 9, M = 24;
    const total = 6 * H + 5 * G;
    let out = '';
    for (let i = 0; i < 6; i++) {
      const y = (5 - i) * (H + G);
      if (i >= drawn) {
        out += `<rect class="ln-slot" x="0" y="${y}" width="${W}" height="${H}" rx="2"/>`;
        continue;
      }
      const cls = i >= animateFrom ? 'ln ln-new' : 'ln';
      const style = i >= animateFrom ? ` style="animation-delay:${(i - animateFrom) * 110}ms"` : '';
      if (bin[i] === '1') out += `<g class="${cls}"${style}><rect x="0" y="${y}" width="${W}" height="${H}" rx="2"/></g>`;
      else out += `<g class="${cls}"${style}><rect x="0" y="${y}" width="${W * 0.43}" height="${H}" rx="2"/><rect x="${W * 0.57}" y="${y}" width="${W * 0.43}" height="${H}" rx="2"/></g>`;
      if (moving.includes(i)) {
        const cx = W + M / 2 + 2, cy = y + H / 2;
        out += bin[i] === '1'
          ? `<circle class="mv" cx="${cx}" cy="${cy}" r="5.5"/>`
          : `<path class="mv" d="M${cx - 5} ${cy - 5}L${cx + 5} ${cy + 5}M${cx + 5} ${cy - 5}L${cx - 5} ${cy + 5}"/>`;
      }
    }
    const pad = M + 4;
    const aria = label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true"';
    return `<svg class="hex hex-${size}" viewBox="${-pad} -2 ${W + pad * 2} ${total + 4}" ${aria}>${out}</svg>`;
  }
  const hexLabel = (n) => `${t('sign', { n })}: ${hexName(n)}`;
  const hexFor = (n, opts = {}) => hexSVG(I.hexagram(n).bin, Object.assign({ label: hexLabel(n) }, opts));

  function trigramSVG(bin) {
    let out = '';
    for (let i = 0; i < 3; i++) {
      const y = (2 - i) * 20;
      out += bin[i] === '1'
        ? `<rect x="0" y="${y}" width="60" height="11" rx="1.5"/>`
        : `<rect x="0" y="${y}" width="26" height="11" rx="1.5"/><rect x="34" y="${y}" width="26" height="11" rx="1.5"/>`;
    }
    return `<svg class="tri" viewBox="0 0 60 51" aria-hidden="true">${out}</svg>`;
  }

  function coinSVG(side) {
    const marks = side === 2
      ? '<path class="coin-mark" d="M27 14h10M32 9v10M28 19h8M27 46h10M27 52h10M32 46v6M11 28h8v8h-8zM45 29h8M45 35h8M49 27v10"/>'
      : '';
    return `<svg class="coin ${side === 2 ? 'coin-yin' : 'coin-yang'}" viewBox="0 0 64 64" aria-hidden="true">` +
      '<circle class="coin-body" cx="32" cy="32" r="30"/><circle class="coin-rim" cx="32" cy="32" r="25.5"/>' +
      `<rect class="coin-hole" x="25" y="25" width="14" height="14" rx="1"/>${marks}</svg>`;
  }

  function stalksSVG() {
    let out = '';
    for (let i = 0; i < 9; i++) {
      const x = 8 + i * 9 + (i % 3) * 2;
      out += `<line x1="${x}" y1="${6 + (i % 4) * 3}" x2="${x + (i % 2 ? 3 : -3)}" y2="${70 - (i % 3) * 4}"/>`;
    }
    return `<svg class="stalk-svg" viewBox="0 0 96 76">${out}</svg>`;
  }

  // Two-step confirmation inside the page (native dialogs are blocked in some viewers).
  function confirmButton(btn, question, action) {
    let armed = false;
    let timer = null;
    const label = btn.textContent;
    btn.addEventListener('click', () => {
      if (!armed) {
        armed = true;
        btn.textContent = question;
        btn.classList.add('armed');
        timer = setTimeout(() => { armed = false; btn.textContent = label; btn.classList.remove('armed'); }, 5000);
        return;
      }
      clearTimeout(timer);
      action();
    });
  }

  // ------------------------------------------------------------------ toast
  let toastTimer = null;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  async function copyText(str) {
    try {
      await navigator.clipboard.writeText(str);
      return true;
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = str;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      ta.remove();
      return ok;
    }
  }

  // Inside a hosted artifact viewer, files go through the host's save dialog.
  let hostDownloads = null;
  if (window.claude && typeof window.claude.use === 'function') {
    Promise.resolve(window.claude.use('downloads')).then((d) => { hostDownloads = d; }).catch(() => {});
  }

  const isNativeApp = () => !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform());

  async function download(filename, content, type = 'application/json') {
    if (hostDownloads) {
      hostDownloads.save({ filename, data: content }).catch(() => {});
      return;
    }
    if (isNativeApp()) {
      // Phone and tablet apps: hand the file to the share sheet, or fall back to the clipboard.
      try {
        const file = new File([content], filename, { type });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: filename });
          return;
        }
      } catch (e) {
        if (e && e.name === 'AbortError') return;
      }
      toast((await copyText(content)) ? t('exportCopied') : t('copyFailed'));
      return;
    }
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
  }

  // ------------------------------------------------------ reading rendering
  function commentary(textBody, notes) {
    if (!textBody && !(notes && notes.length)) return '';
    const open = settings.commentary === 'open' ? ' open' : '';
    const noteHtml = (notes || []).map((n) => `<aside class="note"><span class="note-label">${t('note')}</span>${paras(n.text)}</aside>`).join('');
    return `<details class="comment"${open}><summary>${t('commentary')}</summary><div class="comment-body">${paras(textBody)}${noteHtml}</div></details>`;
  }
  const notesFor = (n, anchor) => (text(n).notes || []).filter((x) => x.anchor === anchor);

  function lineGlyph(yang, moving) {
    const bars = yang ? '<rect x="0" y="0" width="28" height="6" rx="1"/>' : '<rect x="0" y="0" width="12" height="6" rx="1"/><rect x="16" y="0" width="12" height="6" rx="1"/>';
    const mark = moving ? (yang ? '<circle class="mv" cx="36" cy="3" r="3"/>' : '<path class="mv" d="M33 0L39 6M39 0L33 6"/>') : '';
    return `<svg class="lglyph" viewBox="-1 -1 42 8" aria-hidden="true">${bars}${mark}</svg>`;
  }

  function lineBlock(n, i, opts = {}) {
    const h = text(n);
    const yang = I.hexagram(n).bin[i] === '1';
    const line = h.lines[i];
    const body = opts.full ? `<div class="comment-body open">${paras(line.comment)}${notesFor(n, 'line:' + (i + 1)).map((x) => `<aside class="note"><span class="note-label">${t('note')}</span>${paras(x.text)}</aside>`).join('')}</div>`
      : commentary(line.comment, notesFor(n, 'line:' + (i + 1)));
    return `<div class="line-item${opts.moving ? ' is-moving' : ''}"><h4>${lineGlyph(yang, opts.moving)}<span>${esc(L.lineLabel(lang(), i, yang))}</span></h4>${verse(line.text)}${body}</div>`;
  }

  function signTitle(n, tag = 'h2', prefix = '') {
    return `<${tag} class="sign-title">${prefix ? `<span class="sign-prefix">${esc(prefix)}</span>` : ''}<span class="num">${n}</span> ${esc(hexName(n))}</${tag}>`;
  }
  function signSub(n) {
    const c = common(n);
    const hx = I.hexagram(n);
    const sub = lang() === 'de' ? t('wilhelmName', { latin: c.latin }) : t('wilhelmName', { latin: text(n).wade });
    return `<p class="sign-sub"><span class="zh" lang="zh-Hant">${esc(c.zh)}</span> <span class="py">${esc(c.pinyin)}</span><span class="sub-sep">,</span> ${esc(sub)}</p>
      <p class="sign-trigrams">${t('upper')}: ${esc(trigramPhrase(hx.upper))}<br>${t('lower')}: ${esc(trigramPhrase(hx.lower))}</p>`;
  }

  function metaLine(meta) {
    const bits = [];
    if (meta.name && meta.kind !== 'name') bits.push(t('forName', { name: meta.name }));
    if (meta.kind === 'daily') bits.push(t('dailyFor', { date: fmtDate(meta.date, false) }));
    else if (meta.date) {
      let s = t('castOn', { date: fmtDate(meta.date) });
      if (meta.kind === 'oracle') s += ' ' + t(meta.method === 'yarrow' ? 'methodYarrow' : meta.method === 'manual' ? 'methodManual' : 'methodCoins');
      bits.push(s);
    }
    return bits.length ? `<p class="meta">${bits.map((b) => esc(b) + '.').join(' ')}</p>` : '';
  }

  function restText(num, m) {
    const r = ((num % m) + m) % m;
    return r === 0 ? t('calcRestZero', { as: m }) : String(r);
  }
  function calcLines(calc, rd) {
    if (!calc) return [];
    const hx = I.hexagram(rd.primary);
    const out = [];
    if (calc.type === 'name') out.push(t('calcNameValues', { upper: calc.upper, lower: calc.lower }));
    if (calc.type === 'love') out.push(t('calcLove', { a: calc.a, b: calc.b }));
    if (calc.type === 'birthday') {
      out.push(t('calcYear', { year: calc.year, branch: calc.yearBranch, animal: t('animals')[calc.yearBranch - 1], month: calc.month, day: calc.day, sum: calc.upper }));
      out.push(t('calcHour', { branch: calc.hourBranch, noon: calc.noon ? t('calcNoon') : '', sum: calc.lower }));
    }
    out.push(t('calcUpper', { num: calc.upper, rest: restText(calc.upper, 8), trigram: trigramPhrase(hx.upper) }));
    out.push(t('calcLower', { num: calc.lower, rest: restText(calc.lower, 8), trigram: trigramPhrase(hx.lower) }));
    out.push(t('calcLine', { num: calc.move, rest: restText(calc.move, 6), line: rd.moving[0] + 1 }));
    return out;
  }

  /**
   * Renders a reading.
   * opts.head: show the question as page heading; opts.brief: verses only (quick oracle).
   */
  function readingHTML(rd, meta, opts = {}) {
    const { primary, changed, moving } = rd;
    const parts = [];
    if (opts.head) {
      parts.push(`<header class="page-head reading-head">${meta.question
        ? `<p class="q-label">${t('yourQuestion')}</p><h1 class="question" tabindex="-1">${esc(meta.question)}</h1>`
        : `<h1 tabindex="-1">${esc(meta.kind === 'oracle' ? t('oracleTitle') : t('kinds')[meta.kind])}${meta.kind === 'name' || meta.kind === 'love' ? ': ' + esc(meta.name) : ''}</h1>`}
        ${metaLine(meta)}</header>`);
    } else {
      parts.push(metaLine(meta));
    }

    const primaryFig = `<figure class="pair-item"><a href="#/hexagram/${primary}" class="pair-link">${hexFor(primary, { moving, size: 'l' })}</a>
      ${changed ? `<figcaption><span class="num">${primary}</span> ${esc(hexName(primary))}</figcaption>` : ''}</figure>`;
    if (changed) {
      parts.push(`<div class="pair">${primaryFig}<p class="pair-turn">${t('changesTo')}</p>
        <figure class="pair-item"><a href="#/hexagram/${changed}" class="pair-link">${hexFor(changed, { size: 'l' })}</a>
        <figcaption><span class="num">${changed}</span> ${esc(hexName(changed))}</figcaption></figure></div>`);
    } else {
      parts.push(`<div class="pair single">${primaryFig}</div>`);
      if (!opts.brief) parts.push(`<p class="nochange">${t('noChange')}</p>`);
    }

    const calc = calcLines(meta.calc, rd);
    if (calc.length) parts.push(`<details class="calc"><summary>${t('howCalculated')}</summary><ul>${calc.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></details>`);

    const h = text(primary);
    let art = `<article class="sign">${signTitle(primary)}${signSub(primary)}
      <section class="sec"><h3>${t('judgment')}</h3>${verse(h.judgment.text)}${opts.brief ? '' : commentary(h.judgment.comment, notesFor(primary, 'judgment'))}</section>
      <section class="sec"><h3>${t('image')}</h3>${verse(h.image.text)}${opts.brief ? '' : commentary(h.image.comment, notesFor(primary, 'image'))}</section>`;
    if (moving.length && !opts.brief) {
      art += `<section class="sec"><h3>${t('movingLines')}</h3><p class="sec-intro">${t('movingLinesIntro')}</p>${moving.map((i) => lineBlock(primary, i, { moving: true })).join('')}`;
      if (h.all && moving.length === 6) {
        art += `<div class="line-item is-moving"><h4><span>${esc(L.allLabel(lang(), primary))}</span></h4>${verse(h.all.text)}${commentary(h.all.comment)}</div>`;
      }
      art += '</section>';
    }
    art += '</article>';
    parts.push(art);

    if (changed && !opts.brief) {
      const c = text(changed);
      parts.push(`<article class="sign sign-changed">${signTitle(changed, 'h2', t('transformation'))}${signSub(changed)}
        <p class="sec-intro">${t('transformationIntro')}</p>
        <section class="sec"><h3>${t('judgment')}</h3>${verse(c.judgment.text)}${commentary(c.judgment.comment, notesFor(changed, 'judgment'))}</section>
        <section class="sec"><h3>${t('image')}</h3>${verse(c.image.text)}${commentary(c.image.comment, notesFor(changed, 'image'))}</section></article>`);
    }

    const acts = [];
    if (opts.save !== false) acts.push(`<button class="btn primary" type="button" data-act="save"${meta.savedId ? ' disabled' : ''}>${meta.savedId ? t('saved') : t('save')}</button>`);
    acts.push(`<button class="btn" type="button" data-act="copy">${t('copy')}</button>`);
    acts.push(`<a class="btn" href="#/hexagram/${primary}">${t('readFull')}</a>`);
    if (opts.again) acts.push(`<button class="btn quiet" type="button" data-act="again">${esc(opts.again)}</button>`);
    parts.push(`<div class="actions reading-actions">${acts.join('')}</div>`);
    return `<div class="reading">${parts.join('')}</div>`;
  }

  function readingAsText(rd, meta) {
    const out = [];
    const hdr = meta.question ? meta.question : t('kinds')[meta.kind];
    out.push(`# ${hdr}`);
    const metaTxt = metaLine(meta).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    if (metaTxt) out.push(metaTxt);
    const title = (n) => `${n} ${hexName(n)}`;
    out.push('', `## ${title(rd.primary)}${rd.changed ? ` (${t('changesTo')} ${title(rd.changed)})` : ''}`);
    const h = text(rd.primary);
    out.push('', `### ${t('judgment')}`, h.judgment.text, '', `### ${t('image')}`, h.image.text);
    if (rd.moving.length && meta.kind !== 'quick') {
      out.push('', `### ${t('movingLines')}`);
      rd.moving.forEach((i) => out.push('', `**${L.lineLabel(lang(), i, I.hexagram(rd.primary).bin[i] === '1')}**`, h.lines[i].text));
      if (h.all && rd.moving.length === 6) out.push('', `**${L.allLabel(lang(), rd.primary)}**`, h.all.text);
    }
    if (rd.changed && meta.kind !== 'quick') {
      const c = text(rd.changed);
      out.push('', `## ${t('transformation')}: ${title(rd.changed)}`, '', `### ${t('judgment')}`, c.judgment.text, '', `### ${t('image')}`, c.image.text);
    }
    out.push('', '—', lang() === 'de' ? 'Text: Richard Wilhelm, I Ging. Das Buch der Wandlungen (1924)' : "Text after Richard Wilhelm's I Ging (1924)");
    return out.join('\n');
  }

  function entryFrom(rd, meta) {
    return {
      id: uid(),
      kind: meta.kind,
      date: meta.date || new Date().toISOString(),
      question: meta.question || '',
      name: meta.name || '',
      method: meta.method || null,
      values: rd.values,
      calc: meta.calc || null,
      note: '',
    };
  }

  function bindReading(container, rd, meta, handlers = {}) {
    container.addEventListener('click', async (ev) => {
      const btn = ev.target.closest('[data-act]');
      if (!btn || !container.contains(btn)) return;
      const act = btn.dataset.act;
      if (act === 'save' && !meta.savedId) {
        const entry = journal.add(entryFrom(rd, meta));
        meta.savedId = entry.id;
        btn.textContent = t('saved');
        btn.disabled = true;
        toast(t('saved'));
      } else if (act === 'copy') {
        const ok = await copyText(readingAsText(rd, meta));
        toast(ok ? t('copied') : t('copyFailed'));
      } else if (act === 'again' && handlers.again) {
        handlers.again();
      }
    });
  }

  // ------------------------------------------------------------------- views
  function pageHead(title, lead) {
    return `<header class="page-head"><h1 tabindex="-1">${esc(title)}</h1>${lead ? `<p class="lead">${esc(lead)}</p>` : ''}</header>`;
  }

  // Oracle: ask → cast → result
  function oracleView(root) {
    const st = { step: 'ask', question: '', name: '', values: [], method: settings.method, busy: false, date: null };

    function drawAsk() {
      root.innerHTML = `${pageHead(t('oracleTitle'), t('oracleIntro'))}
        <form class="form ask" novalidate>
          <label class="field"><span class="field-label">${t('question')}</span>
            <textarea name="q" rows="3" placeholder="${esc(t('questionPlaceholder'))}">${esc(st.question)}</textarea></label>
          <label class="field"><span class="field-label">${t('nameOptional')}</span>
            <input name="name" type="text" autocomplete="given-name" value="${esc(st.name)}"></label>
          <div class="actions"><button class="btn primary" type="submit">${t('toCasting')}</button></div>
        </form>`;
      $('form', root).addEventListener('submit', (ev) => {
        ev.preventDefault();
        const f = ev.target;
        st.question = f.q.value.trim();
        st.name = f.name.value.trim();
        st.values = [];
        st.method = settings.method;
        st.step = 'cast';
        drawCast();
        $('[data-act="cast"]', root).focus();
      });
    }

    function stageHex(animateFrom) {
      const bin = st.values.map((v) => (v % 2 ? '1' : '0')).join('').padEnd(6, '0');
      const moving = st.values.map((v, i) => (I.isMoving(v) ? i : -1)).filter((i) => i >= 0);
      return hexSVG(bin, { moving, drawn: st.values.length, size: 'xl', animateFrom });
    }

    function drawCast() {
      const yarrow = st.method === 'yarrow';
      const manualRows = [1, 2, 3, 4, 5, 6].map((i) => `<label class="field inline"><span class="field-label">${t('manualLine', { i })}${i === 1 ? ` (${t('manualBottom')})` : i === 6 ? ` (${t('manualTop')})` : ''}</span>
          <select name="l${i}" required><option value="">…</option>${[6, 7, 8, 9].map((v) => `<option value="${v}">${esc(t('value' + v))}</option>`).join('')}</select></label>`).join('');
      root.innerHTML = `<header class="page-head">${st.question ? `<p class="q-label">${t('yourQuestion')}</p><h1 class="question" tabindex="-1">${esc(st.question)}</h1>` : `<h1 tabindex="-1">${t('oracleTitle')}</h1>`}</header>
        <section class="stage">
          <div class="stage-hex">${stageHex(6)}</div>
          ${yarrow ? `<div class="coins stalks" aria-hidden="true">${stalksSVG()}</div>` : `<div class="coins" aria-hidden="true">${coinSVG(3)}${coinSVG(2)}${coinSVG(3)}</div>`}
          <p class="stage-status" aria-live="polite">${t('castHint')}</p>
          <div class="actions center">
            <button class="btn primary big" type="button" data-act="cast">${yarrow ? t('castYarrow') : t('castCoins')}</button>
          </div>
          <p class="stage-progress">${t('lineOf', { i: 1 })}</p>
          <p class="stage-alt"><button class="btn link" type="button" data-act="cast-all">${t('castAll')}</button></p>
        </section>
        <details class="manual"><summary>${t('manualEntry')}</summary>
          <form class="form manual-form"><p class="small">${t('manualIntro')}</p><div class="manual-grid">${manualRows}</div>
          <div class="actions"><button class="btn" type="submit">${t('showReading')}</button></div></form>
        </details>`;

      root.querySelector('.stage').addEventListener('click', (ev) => {
        const b = ev.target.closest('[data-act]');
        if (!b || st.busy) return;
        if (b.dataset.act === 'cast') castOne();
        else if (b.dataset.act === 'cast-all') castRest();
        else if (b.dataset.act === 'show') finish();
      });
      $('.manual-form', root).addEventListener('submit', (ev) => {
        ev.preventDefault();
        const f = ev.target;
        const vals = [1, 2, 3, 4, 5, 6].map((i) => Number(f['l' + i].value));
        if (vals.some((v) => !v)) {
          const firstEmpty = [1, 2, 3, 4, 5, 6].find((i) => !f['l' + i].value);
          f['l' + firstEmpty].focus();
          return;
        }
        st.values = vals;
        st.method = 'manual';
        finish();
      });
      if (settings.castMode === 'all') {
        $('.stage-alt', root).hidden = true;
        $('[data-act="cast"]', root).dataset.act = 'cast-all';
      }
    }

    function updateStage(animateFrom, statusHtml) {
      $('.stage-hex', root).innerHTML = stageHex(animateFrom);
      $('.stage-status', root).innerHTML = statusHtml;
      const done = st.values.length === 6;
      $('.stage-progress', root).textContent = done ? t('castDone') : t('lineOf', { i: st.values.length + 1 });
      const btn = $('.stage .btn.primary', root);
      if (done) {
        btn.dataset.act = 'show';
        btn.textContent = t('showReading');
        $('.stage-alt', root).hidden = true;
        btn.focus();
      }
    }

    async function toss() {
      const coins = $('.coins', root);
      coins.classList.remove('tossing');
      void coins.offsetWidth; // restart animation
      coins.classList.add('tossing');
      await wait(720);
      coins.classList.remove('tossing');
    }

    async function castOne() {
      if (st.values.length >= 6) return;
      st.busy = true;
      $('.stage .btn.primary', root).disabled = true;
      const res = I.castLine(st.method);
      await toss();
      if (res.coins) $('.coins', root).innerHTML = res.coins.map(coinSVG).join('');
      st.values.push(res.value);
      const status = res.coins ? `${res.coins.join(' + ')} = ${esc(t('value' + res.value))}` : esc(t('value' + res.value));
      updateStage(st.values.length - 1, status);
      $('.stage .btn.primary', root).disabled = false;
      st.busy = false;
    }

    async function castRest() {
      if (st.values.length >= 6) return;
      st.busy = true;
      $('.stage .btn.primary', root).disabled = true;
      const start = st.values.length;
      let last = null;
      while (st.values.length < 6) {
        last = I.castLine(st.method);
        st.values.push(last.value);
      }
      await toss();
      if (last.coins) $('.coins', root).innerHTML = last.coins.map(coinSVG).join('');
      updateStage(start, esc(st.values.join(', ')));
      $('.stage .btn.primary', root).disabled = false;
      st.busy = false;
    }

    function finish() {
      st.step = 'result';
      st.date = new Date().toISOString();
      const rd = I.reading(st.values);
      const meta = { kind: 'oracle', question: st.question, name: st.name, method: st.method, date: st.date };
      root.innerHTML = readingHTML(rd, meta, { head: true, again: t('newReading') });
      bindReading(root.firstElementChild, rd, meta, {
        again() { st.step = 'ask'; st.question = ''; st.values = []; drawAsk(); focusHeading(); },
      });
      window.scrollTo(0, 0);
      focusHeading();
    }

    drawAsk();
  }

  function quickView(root) {
    root.innerHTML = `${pageHead(t('quickTitle'), t('quickIntro'))}
      <form class="form" novalidate>
        <label class="field"><span class="field-label">${t('questionOptional')}</span><input name="q" type="text"></label>
        <div class="actions"><button class="btn primary" type="submit">${t('drawSign')}</button></div>
      </form><div class="result" aria-live="polite"></div>`;
    const out = $('.result', root);
    const draw = (question) => {
      const n = I.quickNumber();
      const rd = I.reading(I.valuesFor(n));
      const meta = { kind: 'quick', question, date: new Date().toISOString() };
      out.innerHTML = readingHTML(rd, meta, { brief: true, again: t('drawAgain') });
      const fresh = out.firstElementChild;
      bindReading(fresh, rd, meta, { again: () => draw(question) });
      fresh.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
    };
    $('form', root).addEventListener('submit', (ev) => { ev.preventDefault(); draw(ev.target.q.value.trim()); });
  }

  function dailyView(root) {
    const draw = () => {
      const now = new Date();
      const key = I.dateKey(now);
      const rd = I.reading(I.dailyValues(key, settings.dailyName));
      const meta = { kind: 'daily', name: settings.dailyName, date: now.toISOString(), dateKey: key };
      root.innerHTML = `${pageHead(t('dailyTitle'), t('dailyIntro'))}
        <form class="form row" novalidate>
          <label class="field"><span class="field-label">${t('personalFor')}</span><input name="who" type="text" value="${esc(settings.dailyName)}"></label>
          <button class="btn" type="submit">${t('apply')}</button>
        </form>
        <div class="result">${readingHTML(rd, meta)}</div>`;
      bindReading($('.result', root), rd, meta);
      $('form', root).addEventListener('submit', (ev) => {
        ev.preventDefault();
        settings.dailyName = ev.target.who.value.trim();
        store.set(SETTINGS_KEY, settings);
        draw();
      });
    };
    draw();
  }

  function formResultView(root, cfg) {
    root.innerHTML = `${pageHead(cfg.title, cfg.intro)}<form class="form" novalidate>${cfg.fields}
      <p class="form-error" role="alert" hidden></p>
      <div class="actions"><button class="btn primary" type="submit">${t('calculate')}</button></div></form>
      <div class="result" aria-live="polite"></div>`;
    const form = $('form', root);
    const err = $('.form-error', root);
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      err.hidden = true;
      let res;
      try { res = cfg.compute(form); } catch (e) { err.textContent = e.userMessage || t('errorNoLetters'); err.hidden = false; return; }
      const rd = I.reading(res.values);
      const meta = Object.assign({ date: new Date().toISOString() }, res.meta);
      const out = $('.result', root);
      out.innerHTML = readingHTML(rd, meta);
      bindReading(out.firstElementChild, rd, meta);
      out.firstElementChild.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
    });
  }
  const userError = (msg) => Object.assign(new Error(msg), { userMessage: msg });

  function nameView(root) {
    formResultView(root, {
      title: t('nameTitle'),
      intro: t('nameIntro'),
      fields: `<label class="field"><span class="field-label">${t('fullName')}</span><input name="who" type="text" autocomplete="name" required></label>`,
      compute(f) {
        const who = f.who.value.trim();
        let r;
        try { r = I.nameOracle(who); } catch (e) { throw userError(t('errorNoLetters')); }
        return { values: r.values, meta: { kind: 'name', name: who, calc: { type: 'name', upper: r.numbers.upper, lower: r.numbers.lower, move: r.numbers.total } } };
      },
    });
  }

  function birthdayView(root) {
    formResultView(root, {
      title: t('birthdayTitle'),
      intro: t('birthdayIntro'),
      fields: `<div class="row-fields"><label class="field"><span class="field-label">${t('birthDate')}</span><input name="d" type="date" required min="1800-01-01" max="2200-12-31"></label>
        <label class="field"><span class="field-label">${t('birthTime')}</span><input name="tm" type="time"></label></div>
        <label class="field"><span class="field-label">${t('nameOptional')}</span><input name="who" type="text" autocomplete="name"></label>`,
      compute(f) {
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(f.d.value);
        if (!m) throw userError(t('errorDate'));
        const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
        const hour = f.tm.value ? Number(f.tm.value.split(':')[0]) : null;
        let r;
        try { r = I.birthdayOracle({ year, month, day, hour }); } catch (e) { throw userError(t('errorDate')); }
        const nb = r.numbers;
        return {
          values: r.values,
          meta: { kind: 'birthday', name: f.who.value.trim(), calc: { type: 'birthday', year, month, day, yearBranch: nb.yearBranch, hourBranch: nb.hourBranch, noon: hour === null, upper: nb.upper, lower: nb.lower, move: nb.lower } },
        };
      },
    });
  }

  function loveView(root) {
    formResultView(root, {
      title: t('loveTitle'),
      intro: t('loveIntro'),
      fields: `<div class="row-fields"><label class="field"><span class="field-label">${t('personA')}</span><input name="a" type="text" required></label>
        <label class="field"><span class="field-label">${t('personB')}</span><input name="b" type="text" required></label></div>`,
      compute(f) {
        const a = f.a.value.trim();
        const b = f.b.value.trim();
        let r;
        try { r = I.loveOracle(a, b); } catch (e) { throw userError(t('errorNoLetters')); }
        return { values: r.values, meta: { kind: 'love', name: `${a} & ${b}`, calc: { type: 'love', a: r.numbers.a, b: r.numbers.b, upper: r.numbers.a, lower: r.numbers.b, move: r.numbers.a + r.numbers.b } } };
      },
    });
  }

  function searchKey(n) {
    const c = common(n);
    return [n, text(n).name, c.latin, c.pinyin, c.zh, DATA.de.hexagrams[n - 1].name, DATA.en.hexagrams[n - 1].name]
      .join(' ').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function libraryView(root, params) {
    const table = params[0] === 'table';
    root.innerHTML = `${pageHead(t('libraryTitle'), t('libraryIntro'))}
      <div class="toolbar">
        <nav class="seg" aria-label="${esc(t('libraryTitle'))}">
          <a href="#/library"${table ? '' : ' aria-current="page"'}>${t('byOrder')}</a>
          <a href="#/library/table"${table ? ' aria-current="page"' : ''}>${t('byTrigrams')}</a>
        </nav>
        ${table ? '' : `<label class="search"><span class="sr-only">${t('search')}</span><input type="search" placeholder="${esc(t('searchPlaceholder'))}"></label>`}
      </div><div class="lib-body"></div>`;
    const body = $('.lib-body', root);
    if (table) {
      body.innerHTML = trigramTableHTML();
      return;
    }
    body.innerHTML = `<ol class="grid64">${I.HEXAGRAMS.map((h) => `<li data-s="${esc(searchKey(h.n))}"><a href="#/hexagram/${h.n}">${hexFor(h.n, { size: 's', label: '' })}<span class="num">${h.n}</span><span class="nm">${esc(hexName(h.n))}</span></a></li>`).join('')}</ol>
      <p class="empty" hidden></p>`;
    const input = $('input[type=search]', root);
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      let shown = 0;
      $$('.grid64 li', root).forEach((li) => {
        const hit = !q || (/^\d+$/.test(q) ? li.querySelector('.num').textContent === q : li.dataset.s.includes(q));
        li.hidden = !hit;
        if (hit) shown++;
      });
      const empty = $('.empty', root);
      empty.hidden = shown > 0;
      empty.textContent = t('noMatch', { q: input.value.trim() });
    });
  }

  function trigramTableHTML() {
    const order = I.TRIGRAM_ORDER;
    const head = order.map((k) => { const x = trig(k); return `<th scope="col">${trigramSVG(x.bin)}<span>${esc(x.latin)}</span><small>${esc(x.image)}</small></th>`; }).join('');
    const rows = order.map((lo) => {
      const x = trig(lo);
      const cells = order.map((up) => {
        const n = I.numberFromTrigrams(up, lo);
        return `<td><a href="#/hexagram/${n}" title="${esc(`${n} ${hexName(n)}`)}">${n}</a></td>`;
      }).join('');
      return `<tr><th scope="row">${trigramSVG(x.bin)}<span>${esc(x.latin)}</span><small>${esc(x.image)}</small></th>${cells}</tr>`;
    }).join('');
    return `<div class="table-wrap"><table class="ttable"><caption>${t('tableCaption')}</caption><thead><tr><td></td>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  function hexagramView(root, params) {
    const n = Math.min(64, Math.max(1, parseInt(params[0], 10) || 1));
    const h = text(n);
    const rel = [['nuclear', I.nuclear(n)], ['inverted', I.inverted(n)], ['opposite', I.opposite(n)]];
    const prev = n > 1 ? n - 1 : 64;
    const next = n < 64 ? n + 1 : 1;
    const linesHtml = [0, 1, 2, 3, 4, 5].map((i) => lineBlock(n, i, { full: true })).join('');
    const allHtml = h.all ? `<div class="line-item"><h4><span>${esc(L.allLabel(lang(), n))}</span></h4>${verse(h.all.text)}<div class="comment-body open">${paras(h.all.comment)}</div></div>` : '';
    const noteBlock = (anchor) => notesFor(n, anchor).map((x) => `<aside class="note"><span class="note-label">${t('note')}</span>${paras(x.text)}</aside>`).join('');
    root.innerHTML = `<p class="crumbs"><a href="#/library">${t('libraryTitle')}</a></p>
      <header class="sign-head">
        <div class="sign-head-hex">${hexFor(n, { size: 'xl' })}</div>
        <div class="sign-head-text">
          <h1 class="sign-title" tabindex="-1"><span class="num">${n}</span> ${esc(h.name)}</h1>
          ${signSub(n)}
        </div>
      </header>
      <article class="sign full">
        ${h.meaning ? `<section class="sec"><h2>${t('meaning')}</h2><div class="prose">${paras(h.meaning)}</div></section>` : ''}
        <section class="sec"><h2>${t('judgment')}</h2>${verse(h.judgment.text)}<div class="comment-body open">${paras(h.judgment.comment)}${noteBlock('judgment')}</div></section>
        <section class="sec"><h2>${t('image')}</h2>${verse(h.image.text)}<div class="comment-body open">${paras(h.image.comment)}${noteBlock('image')}</div></section>
        <section class="sec lines-sec"><h2>${t('lines')}</h2>${linesHtml}${allHtml}</section>
      </article>
      <section class="related"><h2>${t('related')}</h2><ul>${rel.map(([k, m]) => `<li><a href="#/hexagram/${m}">${hexFor(m, { size: 's', label: '' })}<span><span class="rel-kind">${t(k)}</span><span class="rel-name"><span class="num">${m}</span> ${esc(hexName(m))}</span><span class="rel-hint">${t(k + 'Hint')}</span></span></a></li>`).join('')}</ul></section>
      <nav class="pager" aria-label="${esc(t('libraryTitle'))}">
        <a href="#/hexagram/${prev}" rel="prev"><span class="pager-dir">${t('prev')}</span><span><span class="num">${prev}</span> ${esc(hexName(prev))}</span></a>
        <a href="#/hexagram/${next}" rel="next"><span class="pager-dir">${t('next')}</span><span><span class="num">${next}</span> ${esc(hexName(next))}</span></a>
      </nav>`;
    document.title = `${n} ${h.name} | ${t('appName')}`;
  }

  function trigramsView(root) {
    const items = I.TRIGRAM_ORDER.map((k) => {
      const x = trig(k);
      return `<li class="tri-item">${trigramSVG(x.bin)}<div>
        <h2>${esc(x.latin)}, ${esc(lowerArticle(x.name))}</h2>
        <p class="sign-sub"><span class="zh" lang="zh-Hant">${esc(x.zh)}</span> <span class="py">${esc(x.pinyin)}</span></p>
        <dl><div><dt>${t('tImage')}</dt><dd>${esc(x.image)}</dd></div><div><dt>${t('tAttr')}</dt><dd>${esc(x.quality)}</dd></div><div><dt>${t('tFamily')}</dt><dd>${esc(x.family)}</dd></div></dl>
      </div></li>`;
    }).join('');
    root.innerHTML = `${pageHead(t('trigramsTitle'), t('trigramsIntro'))}<ul class="tri-list">${items}</ul>
      <section class="sec"><h2>${t('byTrigrams')}</h2>${trigramTableHTML()}</section>`;
  }

  function journalView(root) {
    const list = journal.all();
    const items = list.map((e) => {
      let rd;
      try { rd = I.reading(e.values); } catch (err) { return ''; }
      const title = e.question || (e.kind === 'name' || e.kind === 'love' ? `${t('kinds')[e.kind]}: ${e.name}` : t('kinds')[e.kind] || t('noQuestion'));
      const signs = `<span class="num">${rd.primary}</span> ${esc(hexName(rd.primary))}${rd.changed ? `, ${t('changesTo')} <span class="num">${rd.changed}</span> ${esc(hexName(rd.changed))}` : ''}`;
      return `<li><a href="#/entry/${encodeURIComponent(e.id)}">${hexFor(rd.primary, { size: 's', moving: rd.moving, label: '' })}
        <span class="j-text"><span class="j-title">${esc(title)}</span><span class="j-signs">${signs}</span>
        <span class="j-meta">${esc(t('kinds')[e.kind] || '')}, ${esc(fmtDate(e.date))}${e.note ? ' ✎' : ''}</span></span></a></li>`;
    }).join('');
    root.innerHTML = `${pageHead(t('journalTitle'), t('journalIntro'))}
      <div class="toolbar">
        <button class="btn" type="button" data-act="export"${list.length ? '' : ' disabled'}>${t('exportJournal')}</button>
        <label class="btn file-btn">${t('importJournal')}<input type="file" accept="application/json,.json" class="sr-only"></label>
      </div>
      ${list.length ? `<ul class="journal-list">${items}</ul>` : `<div class="empty-state"><p>${t('journalEmpty')}</p><p><a class="btn primary" href="#/oracle">${t('oracleTitle')}</a></p></div>`}`;

    root.addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-act="export"]');
      if (!b) return;
      const payload = { app: 'wandlungen', version: 1, exported: new Date().toISOString(), entries: journal.all() };
      download(`wandlungen-journal-${I.dateKey()}.json`, JSON.stringify(payload, null, 2));
    });
    $('input[type=file]', root).addEventListener('change', async (ev) => {
      const file = ev.target.files && ev.target.files[0];
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        const incoming = Array.isArray(data) ? data : data && Array.isArray(data.entries) ? data.entries : null;
        if (!incoming) throw new Error('format');
        const valid = incoming.filter((e) => e && typeof e.id === 'string' && Array.isArray(e.values) && (() => { try { I.reading(e.values); return true; } catch (x) { return false; } })());
        if (!valid.length && incoming.length) throw new Error('format');
        const existing = journal.all();
        const ids = new Set(existing.map((e) => e.id));
        const added = valid.filter((e) => !ids.has(e.id)).map((e) => ({
          id: e.id, kind: t('kinds')[e.kind] ? e.kind : 'oracle', date: e.date || new Date().toISOString(),
          question: String(e.question || ''), name: String(e.name || ''), method: e.method || null,
          values: e.values.map(Number), calc: e.calc || null, note: String(e.note || ''),
        }));
        journal.write(added.concat(existing).sort((a, b) => String(b.date).localeCompare(String(a.date))));
        toast(t('imported', { count: added.length }));
        render();
      } catch (e) {
        toast(t('importError'));
      }
      ev.target.value = '';
    });
  }

  function entryView(root, params) {
    const id = params[0];
    const e = journal.get(id);
    if (!e) {
      root.innerHTML = `${pageHead(t('journalTitle'))}<p>${t('entryMissing')}</p><p><a href="#/journal">${t('backToJournal')}</a></p>`;
      return;
    }
    const rd = I.reading(e.values);
    const meta = { kind: e.kind, question: e.question, name: e.name, method: e.method, date: e.date, calc: e.calc, savedId: e.id };
    root.innerHTML = `<p class="crumbs"><a href="#/journal">${t('backToJournal')}</a></p>
      ${readingHTML(rd, meta, { head: true, save: false })}
      <section class="sec notes-sec"><label class="field"><span class="field-label h3">${t('notes')}</span>
        <textarea rows="5" class="note-input" placeholder="${esc(t('notesPlaceholder'))}">${esc(e.note || '')}</textarea></label>
        <p class="small saved-hint" aria-live="polite"></p>
        <div class="actions"><button class="btn danger" type="button" data-act="delete">${t('deleteEntry')}</button></div>
      </section>`;
    bindReading($('.reading', root), rd, meta);
    let timer = null;
    const ta = $('.note-input', root);
    ta.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        journal.update(id, { note: ta.value });
        $('.saved-hint', root).textContent = t('notesSaved');
      }, 400);
    });
    confirmButton($('[data-act="delete"]', root), t('confirmDelete'), () => {
      journal.remove(id);
      location.hash = '#/journal';
    });
  }

  function settingsView(root) {
    const radio = (name, value, label, swatch) => `<label class="choice"><input type="radio" name="${name}" value="${value}"${settings[name] === value ? ' checked' : ''}><span>${swatch ? `<i class="swatch" style="--sw:${swatch}"></i>` : ''}${esc(label)}</span></label>`;
    const group = (name, legend, choices, hint) => `<fieldset class="set"><legend>${esc(legend)}</legend><div class="choices">${choices.map(([v, l, sw]) => radio(name, v, l, sw)).join('')}</div>${hint ? `<p class="small">${esc(hint)}</p>` : ''}</fieldset>`;
    root.innerHTML = `${pageHead(t('settingsTitle'))}
      <form class="form settings">
        ${group('lang', t('language'), [['auto', t('langAuto')], ['de', 'Deutsch'], ['en', 'English']])}
        ${group('theme', t('theme'), [['system', t('themeSystem')], ['light', t('themeLight')], ['dark', t('themeDark')]])}
        ${group('bg', t('background'), BACKGROUNDS.map(([k, sw]) => [k, t('bg_' + k), sw]))}
        ${group('textSize', t('textSize'), [['m', t('sizeM')], ['l', t('sizeL')], ['xl', t('sizeXL')]])}
        ${group('method', t('method'), [['coins', t('methodCoinsLabel')], ['yarrow', t('methodYarrowLabel')]], t('methodHint'))}
        ${group('castMode', t('castMode'), [['single', t('castSingle')], ['all', t('castAllMode')]])}
        ${group('commentary', t('commentaryPref'), [['closed', t('commentaryClosed')], ['open', t('commentaryOpen')]])}
      </form>
      <section class="sec"><h2>${t('dataTitle')}</h2><p>${t('dataHint')}</p>
        <div class="actions"><button class="btn danger" type="button" data-act="wipe">${t('deleteAll')}</button></div></section>`;
    $('form', root).addEventListener('change', (ev) => {
      const el = ev.target;
      if (!el.name) return;
      settings[el.name] = el.value;
      store.set(SETTINGS_KEY, settings);
      applySettings();
      if (el.name === 'lang') { render(); return; }
      toast(t('settingsSaved'));
    });
    confirmButton($('[data-act="wipe"]', root), t('confirmDeleteAll'), () => {
      store.remove(JOURNAL_KEY);
      store.remove(SETTINGS_KEY);
      settings = Object.assign({}, DEFAULTS);
      applySettings();
      render();
      toast(t('deletedAll'));
    });
  }

  function aboutView(root) {
    root.innerHTML = ABOUT[lang()].replace('{version}', APP_VERSION);
  }

  // ------------------------------------------------------------------ shell
  const NAV = [
    { group: 'groupAsk', items: [['oracle', 'navOracle'], ['quick', 'navQuick'], ['daily', 'navDaily'], ['name', 'navName'], ['birthday', 'navBirthday'], ['love', 'navLove']] },
    { group: 'groupRead', items: [['library', 'navLibrary'], ['trigrams', 'navTrigrams'], ['journal', 'navJournal']] },
    { group: null, items: [['settings', 'navSettings'], ['about', 'navAbout']] },
  ];
  const NAV_PARENT = { hexagram: 'library', entry: 'journal' };
  const VIEWS = {
    oracle: oracleView, quick: quickView, daily: dailyView, name: nameView, birthday: birthdayView, love: loveView,
    library: libraryView, hexagram: hexagramView, trigrams: trigramsView, journal: journalView, entry: entryView,
    settings: settingsView, about: aboutView,
  };
  const TITLES = { oracle: 'navOracle', quick: 'navQuick', daily: 'navDaily', name: 'navName', birthday: 'navBirthday', love: 'navLove', library: 'navLibrary', trigrams: 'navTrigrams', journal: 'navJournal', entry: 'navJournal', settings: 'navSettings', about: 'navAbout' };

  function renderShell() {
    $('.brand-name').textContent = t('appName');
    $('.brand-tag').textContent = t('appTagline');
    $('.skip').textContent = t('skip');
    $('.menu-toggle span').textContent = t('menu');
    $('#nav').innerHTML = NAV.map((g) => `<div class="nav-group">${g.group ? `<p class="nav-label">${t(g.group)}</p>` : ''}<ul>${g.items.map(([r, k]) => `<li><a href="#/${r}" data-route="${r}">${t(k)}</a></li>`).join('')}</ul></div>`).join('');
  }

  function applySettings() {
    const root = document.documentElement;
    root.lang = lang();
    root.dataset.theme = settings.theme;
    root.dataset.bg = settings.bg;
    const bar = getComputedStyle(root).getPropertyValue('--paper-2').trim();
    if (bar) $$('meta[name="theme-color"]').forEach((m) => { m.content = bar; });
    root.dataset.size = settings.textSize;
    renderShell();
  }

  function parseRoute() {
    const h = location.hash.replace(/^#\/?/, '');
    const [name, ...rest] = h.split('/');
    return { name: VIEWS[name] ? name : 'oracle', params: rest.map((p) => { try { return decodeURIComponent(p); } catch (e) { return p; } }) };
  }

  function focusHeading() {
    const h = $('#main h1');
    if (h) h.focus({ preventScroll: true });
  }

  function render(fromNav) {
    const r = parseRoute();
    const main = $('#main');
    const fresh = main.cloneNode(false); // drop old listeners
    main.replaceWith(fresh);
    document.title = `${t(TITLES[r.name])} | ${t('appName')}`;
    VIEWS[r.name](fresh, r.params);
    const active = NAV_PARENT[r.name] || r.name;
    $$('#nav a').forEach((a) => (a.dataset.route === active ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
    document.body.classList.remove('menu-open');
    $('.menu-toggle').setAttribute('aria-expanded', 'false');
    if (fromNav) {
      window.scrollTo(0, 0);
      focusHeading();
    }
  }

  function registerServiceWorker() {
    // Offline support for the web version (GitHub Pages etc.). Not used in the desktop and mobile apps.
    if (!('serviceWorker' in navigator) || location.protocol !== 'https:' || window.WANDLUNGEN_SINGLE_FILE || isNativeApp()) return;
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
  }

  function init() {
    registerServiceWorker();
    applySettings();
    $('.menu-toggle').addEventListener('click', () => {
      const open = document.body.classList.toggle('menu-open');
      $('.menu-toggle').setAttribute('aria-expanded', String(open));
    });
    window.addEventListener('hashchange', () => render(true));
    if (window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (mq.addEventListener) mq.addEventListener('change', applySettings);
    }
    render(false);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
