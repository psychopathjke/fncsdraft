// Проигранная высадка — это дно таблицы, а не «топ-21».
//
// Жалоба его игрока, 27 августа: «я контестил команду в последней игре и
// выиграл кон, но они почему-то в этой игре были топ 21». Его ответ тем же
// днём: «команда должна была умереть, мб сменила локацию, но мало вероятно».
//
// Локацию боты больше не меняют (см. tools/check-cup-drop-sticky.js), но само
// правило стоило проверить, а не пересказать: движок помечает отряд
// droppedOut, если тот умер в первые DROP_SEC, и кладёт его в очередь вылета
// ПЕРВЫМ. Значит проигравшие высадку обязаны занимать ровно последние места
// лобби — все и подряд, без единого исключения.
//
// Меряется на настоящих играх карты: двадцать дуо по двое в коробке, значит
// стычка в каждой, и в каждой игре сверяется, что множество погибших на
// высадке — это в точности хвост таблицы.
//
//   node tools/check-drop-death-place.js [игр]

const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const GAMES = +(process.argv[2] || 200);
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set the CHROME environment variable to chrome.exe');

const BASE = '<base href="file:///' + ROOT + '/">';
const HEAD = `<script>
window.__errs = [];
window.addEventListener('error', function(e){ window.__errs.push(String(e.message) + ' @' + e.lineno); });
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {steps: [], errs: null, fail: null};
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const fail = m => { out.fail = m; throw new Error(m); };
  try{
    squadSize = 2;
    useLandingSet('m2');
    await wait(50);

    const N = 20;
    const make = () => {
      const field = [];
      for (let i = 0; i < N; i++) {
        const h = 'bot' + i;
        field.push({
          name: 'Team ' + i, pow: 92 + (i % 17), closeEdge: 0,
          squad: [{handle: h + 'a', rating: 60, pow: 92}, {handle: h + 'b', rating: 60, pow: 92}],
          _uid: i
        });
      }
      return field;
    };
    // По двое в коробке — стычка в каждой, иначе мерить нечего.
    const seat = field => field.forEach((t, i) => {
      t.landingZone = ALL_LANDING_ZONES[Math.floor(i / 2) % ALL_LANDING_ZONES.length];
    });

    let games = 0, deaths = 0, bad = 0, worstPlace = 0, noDeath = 0;
    for (let g = 0; g < ${GAMES}; g++) {
      const field = make();
      seat(field);
      const order = simulateGameOnMap(field, null);
      if (!order || order.length !== N) fail('игра вернула ' + (order && order.length) + ' мест');
      games++;
      const place = new Map(order.map((t, i) => [t, i + 1]));
      const dead = field.filter(t => t._droppedOut);
      if (!dead.length) { noDeath++; continue; }
      deaths += dead.length;
      // Хвост таблицы ровно такой длины, как число погибших на высадке.
      const tail = new Set(order.slice(N - dead.length));
      const off = dead.filter(t => !tail.has(t));
      if (off.length) {
        bad += off.length;
        off.forEach(t => { const p = place.get(t); if (p > worstPlace || !worstPlace) worstPlace = p; });
      }
    }

    out.steps.push('игр: ' + games + ', смертей на высадке: ' + deaths +
                   ', игр без единой стычки: ' + noDeath);
    if (!deaths) fail('ни одной стычки на высадке — проверка меряет не то');
    if (noDeath === games) fail('стычек нет вовсе');
    if (bad) fail('погибших на высадке НЕ в хвосте таблицы: ' + bad +
                  ', лучшее из таких мест — ' + worstPlace + ' из ' + N);
    out.steps.push('все погибшие на высадке — в хвосте таблицы своего лобби');

    // Контроль: без стычек хвост занимает кто угодно, значит проверка
    // действительно смотрит на droppedOut, а не на «последние места вообще».
    const field = make();
    field.forEach((t, i) => { t.landingZone = ALL_LANDING_ZONES[i % ALL_LANDING_ZONES.length]; });
    const order = simulateGameOnMap(field, null);
    const solo = field.filter(t => t._droppedOut).length;
    out.steps.push('врозь по коробкам: смертей на высадке ' + solo);
    if (solo >= deaths / games) fail('врозь гибнет столько же — коробки не разводят');
  } catch(e){ if(!out.fail) out.fail = String(e && e.stack || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dropdeath-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, BASE + HEAD + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);

const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--window-size=1440,1400',
  '--virtual-time-budget=300000', '--dump-dom', 'file:///' + tmp.replace(/\\/g, '/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if (out.errs && out.errs.length) { console.error('page errors: ' + out.errs.slice(0, 4).join(' | ')); process.exit(1); }
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
console.log('проигранная высадка кладёт отряд на дно, а не в топ');
fs.rmSync(dir, { recursive: true, force: true });
