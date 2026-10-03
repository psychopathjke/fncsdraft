// Книга высадок сезона: бот падает на одну точку весь сезон и меняет её редко.
//
// Игрок, 3.10: «чтобы команды падали на одну локацию весь сезон, либо же меняли,
// но не часто — сейчас каждый раз в разные места»; «начал заново финалы играть,
// и кто-то падать стал в другое место».
//
// Меряется так: двенадцать турниров одним полем в разные дни, у каждого своя
// очередь выбора (очки квалификации перемешаны), память этапа каждый раз новая —
// как перезапуск финала. Контроль — то же без карьеры (книги нет): там команды
// обязаны прыгать, иначе проверка меряет не то.
//
//   node tools/check-career-drop-book.js

const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const CHROME = [
  process.env.CHROME,
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
    useLandingSet('m2');
    await wait(50);
    const EVENTS = 12, N = 50;
    const make = () => {
      const field = [];
      for (let i = 0; i < N; i++) {
        const h = 'bot' + i;
        field.push({
          name: 'Team ' + i, pow: 88 + (i % 17), closeEdge: 0, stagePts: 0,
          squad: [{handle: h + 'a', rating: 60}, {handle: h + 'b', rating: 60}]
        });
      }
      return field;
    };
    const where = t => { const z = t.landingZone; return z ? z.x + ',' + z.y : '?'; };
    const days = [];
    for (let e = 0; e < EVENTS; e++) days.push('2025-0' + (1 + (e % 9)) + '-1' + (e % 10));
    const season = (withCareer) => {
      CAREER = withCareer ? {career: {season: 1, day: days[0]}} : null;
      const field = make();
      const rows = [];
      for (let e = 0; e < EVENTS; e++) {
        if (CAREER) CAREER.career.day = days[e];
        // Другой турнир — другая таблица квалификации, значит другая очередь выбора.
        field.forEach((t, i) => { t.stagePts = (i * 37 + e * 101) % 97; });
        CC_DROP_STAGE = days[e] + '|1|s1|total';
        buildBotLandingAssignment(field);
        rows.push(field.map(where));
      }
      let moves = 0;
      for (let e = 1; e < rows.length; e++)
        for (let i = 0; i < N; i++) if (rows[e][i] !== rows[e - 1][i]) moves++;
      // Сколько команд весь сезон на одной точке.
      const loyal = field.filter((t, i) => rows.every(r => r[i] === rows[0][i])).length;
      return {moves, loyal, rows, book: CAREER && CAREER.career.dropBook};
    };

    const ctrl = season(false);
    out.steps.push('без книги: ' + ctrl.moves + ' переездов за ' + (EVENTS - 1) + ' турниров, весь сезон на месте ' + ctrl.loyal + ' из ' + N);
    if (ctrl.moves < N / 2) fail('контроль сломан: и без книги почти никто не переезжает (' + ctrl.moves + ')');

    const live = season(true);
    out.steps.push('с книгой: ' + live.moves + ' переездов за ' + (EVENTS - 1) + ' турниров, весь сезон на месте ' + live.loyal + ' из ' + N);
    // Шанс переезда 5% на вечер: ожидание ~0.05*11*50 ≈ 27 переездов… но только у тех, кому выпало.
    const cap = Math.ceil(CC_DROP_BOOK_MOVE * (EVENTS - 1) * N * 2.2) + 5;
    if (live.moves > cap) fail('с книгой слишком много переездов: ' + live.moves + ' > ' + cap);
    if (live.loyal < N * 0.4) fail('весь сезон на месте только ' + live.loyal + ' из ' + N);
    if (live.moves === 0) fail('никто не переехал ни разу — «меняли, но не часто» не работает');
    const boxes = new Set(live.rows[0]);
    if (boxes.size < 10) fail('вся комната стоит в ' + boxes.size + ' коробках');
    out.steps.push('комната занимает ' + boxes.size + ' коробок');
    const crowd = Math.max(...[...boxes].map(b => live.rows[0].filter(z => z === b).length));
    const lastRow = live.rows[EVENTS - 1];
    const crowdEnd = Math.max(...[...new Set(lastRow)].map(b => lastRow.filter(z => z === b).length));
    out.steps.push('больше всего на одной коробке: ' + crowd + ' в начале сезона, ' + crowdEnd + ' в конце');
    if (crowdEnd > crowd + 2) fail('к концу сезона переезды сложили ' + crowdEnd + ' команд на одну коробку');

    // Перезапуск финала: тот же день, память этапа сброшена, очередь другая.
    CC_DROP_SEATS = null; CC_DROP_SEATS_STAGE = null;
    const f = make();
    f.forEach((t, i) => { t.stagePts = (i * 53) % 89; });
    CAREER.career.day = days[EVENTS - 1];
    CC_DROP_STAGE = days[EVENTS - 1] + '|1|s9|total';
    buildBotLandingAssignment(f);
    const again = f.map(where);
    const diff = again.filter((z, i) => z !== live.rows[EVENTS - 1][i]).length;
    out.steps.push('перезапуск финала с другой очередью: сменили точку ' + diff + ' из ' + N);
    if (diff > 2) fail('после перезапуска переехали ' + diff + ' команд');

    // Новый сезон — книга с нуля.
    CAREER.career.season = 2;
    CC_DROP_STAGE = 'x|2|s1|total';
    buildBotLandingAssignment(make());
    if (Object.keys(CAREER.career.dropBook.at).length > N) fail('книга не сбросилась на новый сезон');
    out.steps.push('новый сезон: книга на ' + Object.keys(CAREER.career.dropBook.at).length + ' команд, ' +
                   JSON.stringify(CAREER.career.dropBook).length + ' байт');

    // Игрок в книгу не пишется.
    const you = make(); you[0].isYou = true;
    CC_DROP_STAGE = 'y|2|s1|total';
    buildBotLandingAssignment(you);
    if (Object.keys(CAREER.career.dropBook.at).length > N) fail('игрок попал в книгу');
    CAREER = null;
  } catch(e){ if(!out.fail) out.fail = String(e && e.stack || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BE'+'GIN' + encodeURIComponent(JSON.stringify(out)) + 'E'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dropbook-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, BASE + HEAD + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);

const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--window-size=1440,1400',
  '--virtual-time-budget=120000', '--dump-dom', 'file:///' + tmp.replace(/\\/g, '/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if (out.errs && out.errs.length) { console.error('page errors: ' + out.errs.slice(0, 4).join(' | ')); process.exit(1); }
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
console.log('боты держат свои точки весь сезон и меняют их редко');
fs.rmSync(dir, { recursive: true, force: true });
