/* Wandlungen – about page. SPDX-License-Identifier: MIT */
(function (root) {
  'use strict';
  const ext = (href, label) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`;

  const de = `
<header class="page-head"><h1 tabindex="-1">Über die App</h1>
<p class="lead">Wandlungen ist eine freie Open-Source-App für das I Ging, das chinesische Buch der Wandlungen. Sie läuft unter macOS, Windows und Linux, auf Android, iPhone und iPad sowie im Browser, braucht kein Konto und arbeitet vollständig offline.</p></header>
<div class="prose">
<h2>So befragst du das Orakel</h2>
<p>Werde ruhig und stelle deine Frage so offen wie möglich. Dann wirfst du sechsmal drei Münzen. Die Schriftseite einer Münze zählt 2, die Rückseite 3. Die Summe eines Wurfs ergibt eine Linie. Das Zeichen baut sich von unten nach oben auf.</p>
<dl class="values">
  <div><dt>6</dt><dd>altes Yin, eine gebrochene Linie, die sich in eine ganze wandelt</dd></div>
  <div><dt>7</dt><dd>junges Yang, eine ganze, ruhende Linie</dd></div>
  <div><dt>8</dt><dd>junges Yin, eine gebrochene, ruhende Linie</dd></div>
  <div><dt>9</dt><dd>altes Yang, eine ganze Linie, die sich in eine gebrochene wandelt</dd></div>
</dl>
<p>Bewegte Linien schlagen in ihr Gegenteil um. So entsteht ein zweites Zeichen, das zeigt, wohin sich die Lage entwickelt. Lies zuerst Urteil und Bild des ersten Zeichens, dann die Texte der bewegten Linien, zuletzt Urteil und Bild des zweiten Zeichens. Bewegt sich keine Linie, gilt nur das erste Zeichen.</p>
<p>In den Einstellungen kannst du statt der Münzen die Schafgarbenmethode wählen. Sie wird hier mit ihren überlieferten Wahrscheinlichkeiten nachgebildet. Wer lieber echte Münzen wirft, trägt die Ergebnisse unter „Eigene Würfe eintragen“ ein.</p>

<h2>Die übrigen Orakel</h2>
<p>Das <strong>Kurzorakel</strong> zieht ein einzelnes Zeichen ohne bewegte Linien. Das <strong>Tagesorakel</strong> wird aus dem Datum berechnet, auf Wunsch zusammen mit einem Namen, und bleibt den ganzen Tag gleich.</p>
<p><strong>Namens-, Geburtstags- und Liebesorakel</strong> rechnen nach der Pflaumenblüten-Methode (Meihua Yishu), die auf den Gelehrten Shao Yong im 11. Jahrhundert zurückgeführt wird. Eine Zahl wird durch 8 geteilt, der Rest bestimmt ein Trigramm in der Ordnung des Früheren Himmels: 1 Himmel, 2 See, 3 Feuer, 4 Donner, 5 Wind, 6 Wasser, 7 Berg, 8 Erde. Eine Zahl, geteilt durch 6, bestimmt die bewegte Linie. Die Übertragung auf lateinische Buchstaben und auf das gregorianische Datum ist eine Vereinfachung dieser App. Unter jedem Ergebnis steht, wie gerechnet wurde.</p>

<h2>Die Texte</h2>
<p><strong>Deutsch:</strong> Richard Wilhelm, <cite>I Ging. Das Buch der Wandlungen</cite>, Eugen Diederichs, Jena 1924. Wilhelm starb 1930, seine Übersetzung ist gemeinfrei. Die digitalisierte Fassung stammt aus dem Projekt ${ext('https://github.com/johannes-kaindl/yijing', 'Yijing Oracle')} von Johannes Kaindl. Für diese App wurden Zeichennamen, Pinyin und die Linienfolge zweier Zeichen geprüft und berichtigt. Verwendet wird ausschließlich Wilhelms Wortlaut.</p>
<p><strong>Englisch:</strong> Eine neue Übersetzung von Wilhelms deutschem Text aus dem Projekt ${ext('https://github.com/jesshewitt/i-ching', 'i-ching')} von Jess Hewitt, gewidmet der Gemeinfreiheit (CC0 1.0).</p>

<h2>Lizenz und Quellcode</h2>
<p>Der Quellcode steht unter der MIT-Lizenz. Du darfst ihn frei verwenden, verändern und weitergeben. Die Schriften Alegreya und Alegreya Sans von Juan Pablo del Peral (Huerta Tipográfica) stehen unter der SIL Open Font License 1.1.</p>

<h2>Datenschutz</h2>
<p>Fragen, Journal und Einstellungen bleiben auf deinem Gerät. Die App lädt nichts nach und sendet nichts ins Internet. Das Journal kannst du jederzeit als Datei exportieren oder in den Einstellungen löschen.</p>

<p class="small">Das I Ging ist ein Weisheitsbuch. Es ersetzt keinen ärztlichen, rechtlichen oder finanziellen Rat. Version {version}.</p>
</div>`;

  const en = `
<header class="page-head"><h1 tabindex="-1">About</h1>
<p class="lead">Wandlungen is a free, open-source app for the I Ching, the Chinese Book of Changes. It runs on macOS, Windows and Linux, on Android, iPhone and iPad and in the browser, needs no account and works entirely offline.</p></header>
<div class="prose">
<h2>How to consult the oracle</h2>
<p>Settle your mind and ask your question as openly as you can. Then toss three coins six times. The inscribed side of a coin counts 2, the reverse 3. The sum of each throw gives one line. The hexagram is built from the bottom up.</p>
<dl class="values">
  <div><dt>6</dt><dd>old yin, a broken line that changes into a solid one</dd></div>
  <div><dt>7</dt><dd>young yang, a solid line at rest</dd></div>
  <div><dt>8</dt><dd>young yin, a broken line at rest</dd></div>
  <div><dt>9</dt><dd>old yang, a solid line that changes into a broken one</dd></div>
</dl>
<p>Moving lines turn into their opposite. This creates a second hexagram that shows where the situation is heading. Read the Judgment and Image of the first hexagram, then the texts of the moving lines, and finally the Judgment and Image of the second. If no line moves, only the first hexagram applies.</p>
<p>In the settings you can switch from coins to the yarrow-stalk method, simulated here with its traditional odds. If you prefer real coins, enter your results under “Enter your own throws”.</p>

<h2>The other oracles</h2>
<p>The <strong>quick oracle</strong> draws a single hexagram without moving lines. The <strong>daily sign</strong> is calculated from the date, optionally together with a name, and stays the same all day.</p>
<p>The <strong>name, birthday and love oracles</strong> follow the Plum Blossom method (Meihua Yishu), traditionally attributed to the 11th-century scholar Shao Yong. A number is divided by 8 and the remainder picks a trigram in the Early Heaven order: 1 heaven, 2 lake, 3 fire, 4 thunder, 5 wind, 6 water, 7 mountain, 8 earth. A number divided by 6 picks the moving line. Applying this to Latin letters and to the Gregorian date is a simplification made by this app. Each result shows how it was calculated.</p>

<h2>The texts</h2>
<p><strong>German:</strong> Richard Wilhelm, <cite>I Ging. Das Buch der Wandlungen</cite>, Eugen Diederichs, Jena 1924. Wilhelm died in 1930 and his translation is in the public domain. The digitised text comes from the ${ext('https://github.com/johannes-kaindl/yijing', 'Yijing Oracle')} project by Johannes Kaindl. For this app, hexagram names, pinyin and the line order of two hexagrams were checked and corrected. Only Wilhelm's own wording is used.</p>
<p><strong>English:</strong> A new translation of Wilhelm's German text from the ${ext('https://github.com/jesshewitt/i-ching', 'i-ching')} project by Jess Hewitt, dedicated to the public domain (CC0 1.0).</p>

<h2>License and source code</h2>
<p>The source code is released under the MIT license. You may use, change and share it freely. The typefaces Alegreya and Alegreya Sans by Juan Pablo del Peral (Huerta Tipográfica) are licensed under the SIL Open Font License 1.1.</p>

<h2>Privacy</h2>
<p>Questions, journal and settings stay on your device. The app loads nothing and sends nothing to the internet. You can export the journal as a file at any time or delete it in the settings.</p>

<p class="small">The I Ching is a book of wisdom. It does not replace medical, legal or financial advice. Version {version}.</p>
</div>`;

  root.WandlungenAbout = { de, en };
})(typeof window !== 'undefined' ? window : globalThis);
