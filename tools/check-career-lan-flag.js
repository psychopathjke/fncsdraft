// Флаг на клетке календаря выглядит как флаг.
//
// Было: linear-gradient(135deg) с полосами 38/30/32 — одна косая лесенка на все
// двадцать две страны. Его правка: «покрась флаг, как официальный типо, а не на
// перекосяк».
//
// Проверяется то, что и значит «официальный»: у каждой страны-хозяина есть своя
// запись, ось совпадает с настоящей (Германия горизонталь, Франция вертикаль),
// доли полос точные (Испания и Канада 1:2:1, Польша пополам), у скандинавов
// крест, косой лесенки нет нигде. Эмблемы приблизительны нарочно — в клетку
// размером с ноготь они не влезают, — и проверяется только то, что поле под
// ними своё.
//
//   node tools/check-career-lan-flag.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {fails: [], notes: {}, err: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  try {
    // ---- у каждой страны, где вообще бывает ЛАН, есть флаг ----------------
    const nats = ccLanNats();
    out.notes.nats = nats.length;
    const missing = nats.filter(n => !CC_FLAGS[n]);
    check('у каждой страны-хозяина есть флаг', missing.length === 0, missing.join(','));
    // И наоборот: лишних записей не держим.
    const extra = Object.keys(CC_FLAGS).filter(n => nats.indexOf(n) < 0);
    check('и лишних флагов нет', extra.length === 0, extra.join(','));

    // ---- ни одной косой лесенки -------------------------------------------
    const styles = {};
    nats.forEach(n => {
      const f = CC_FLAGS[n];
      styles[n] = f.stripes ? 'STRIPES' : ccFlagLayers(f).join(',');
    });
    const skew = nats.filter(n => /\\d+deg/.test(styles[n]));
    check('ни один флаг не рисуется под углом', skew.length === 0, skew.join(','));
    // И каждый действительно что-то рисует.
    const empty = nats.filter(n => !styles[n]);
    check('и каждый непустой', empty.length === 0, empty.join(','));

    // ---- ось: горизонталь и вертикаль там, где надо ------------------------
    const axis = n => CC_FLAGS[n].bands || null;
    out.notes.axis = {de:axis('de'), nl:axis('nl'), fr:axis('fr'), be:axis('be'), it:axis('it')};
    ['de','nl','rs'].forEach(n =>
      check(n + ': полосы горизонтальные', axis(n) === 'h', String(axis(n))));
    ['fr','be','it','mx'].forEach(n =>
      check(n + ': полосы вертикальные', axis(n) === 'v', String(axis(n))));
    // Направление доезжает до самой строки, а не только до таблицы.
    check('горизонтальный флаг льётся вниз',
          styles.de.indexOf('to bottom') >= 0, styles.de.slice(0, 60));
    check('вертикальный — вправо',
          styles.fr.indexOf('to right') >= 0, styles.fr.slice(0, 60));

    // ---- доли полос --------------------------------------------------------
    // Трети — ровные трети, а не 38/30/32.
    check('немецкие полосы равные',
          /0.00% 33.33%.*33.33% 66.67%.*66.67% 100.00%/.test(styles.de), styles.de);
    // Испания и Канада — 1:2:1.
    check('испанские 1:2:1',
          /0.00% 25.00%.*25.00% 75.00%.*75.00% 100.00%/.test(styles.es), styles.es);
    check('канадские тоже 1:2:1',
          /0.00% 25.00%.*25.00% 75.00%.*75.00% 100.00%/.test(styles.ca), styles.ca);
    // Польша — пополам, и полос ровно две.
    check('польский пополам',
          /0.00% 50.00%.*50.00% 100.00%/.test(styles.pl), styles.pl);
    check('и полос в нём две', CC_FLAGS.pl.c.length === 2, String(CC_FLAGS.pl.c.length));

    // ---- крест у скандинавов ----------------------------------------------
    ['dk','se'].forEach(n => {
      check(n + ': это крест, а не полосы', !!CC_FLAGS[n].cross && !CC_FLAGS[n].bands);
      // Вертикаль креста смещена к древку: её середина левее центра клетки.
      const m = styles[n].match(/to right,transparent 0 (\\d+)%,\\S+? (\\d+)% (\\d+)%/);
      out.notes[n + 'Cross'] = m ? m[2] + '-' + m[3] : styles[n].slice(0, 70);
      check(n + ': вертикаль креста смещена к древку',
            !!m && (Number(m[2]) + Number(m[3])) / 2 < 50, out.notes[n + 'Cross']);
    });

    // ---- полумесяц вырезается, а не закрашивается -------------------------
    // Слои читаются сверху вниз: круг цвета поля, который вырезает полумесяц,
    // обязан лежать НАД белым. Стояли наоборот — выходило пятно.
    ['tr','sg'].forEach(n => {
      const d = CC_FLAGS[n].disc || [];
      out.notes[n + 'Disc'] = d.map(x => x[0] + '/' + x[3]).join(' ');
      check(n + ': полумесяц из двух кругов', d.length === 2, String(d.length));
      check(n + ': вырезающий круг меньше белого', d.length === 2 && d[0][3] < d[1][3],
            out.notes[n + 'Disc']);
      check(n + ': и он цвета поля, а не белый',
            d.length === 2 && d[0][0].toLowerCase() !== '#ffffff', out.notes[n + 'Disc']);
    });

    // ---- поле под эмблемой — своё -----------------------------------------
    check('японское поле белое', styles.jp.indexOf('#ffffff') >= 0, styles.jp);
    check('и диск на нём красный', styles.jp.indexOf('#bc002d') >= 0, styles.jp);
    check('саудовское поле зелёное', styles.sa.indexOf('#006c35') >= 0, styles.sa);

    // ---- то, что реально уедет в разметку ---------------------------------
    const st = ccLanFlagStyle('summit', 1);
    out.notes.summitStyle = st.slice(0, 90);
    check('стиль объявляет картинку', st.indexOf('background-image:') === 0, st.slice(0, 40));
    check('и закрыт точкой с запятой', /;$/.test(st), st.slice(-20));
    check('и в нём нет угла', !/\\d+deg/.test(st), st.slice(0, 60));
    // США — единственный, кому нужен размер: полосы повторяются, кантон нет.
    let usStyle = null, usAt = null;
    ['summit','globals','rc'].forEach(kind => {
      for (let s = 1; s < 40 && !usStyle; s++)
        if (ccLanNat(kind, s) === 'us') { usStyle = ccLanFlagStyle(kind, s); usAt = kind + ' s' + s; }
    });
    out.notes.usAt = usAt;
    check('США за сорок сезонов выпадают', !!usStyle, 'ни разу');
    check('у звёздно-полосатого есть размер кантона',
          !!usStyle && usStyle.indexOf('background-size:') >= 0,
          usStyle ? usStyle.slice(0, 80) : '-');
    check('и полосы в нём повторяются',
          !!usStyle && usStyle.indexOf('repeating-linear-gradient') >= 0,
          usStyle ? usStyle.slice(0, 80) : '-');
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsflag-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('a flag on the calendar is drawn the way that flag is drawn');
fs.rmSync(dir, { recursive: true, force: true });
