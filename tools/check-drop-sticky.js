// Финал играется одним лобби — и садится оно каждую игру туда же.
//
// Его слово, 26 августа: «when playing the set lobby finals that teams dont
// keep switching drops every single time». Дом у бота постоянный (ccBotHome),
// но кому дом не достался, тот выбирал по landingScore, а последним слагаемым
// там стоял свежий Math.random на игру — и комната переезжала между играми
// финала, чего в финале не бывает.
//
// Меряется ровно это: одно поле, одна раздача за игрой, сколько команд сменило
// коробку. С жетоном этапа (CC_DROP_STAGE, его ставит simulateGamesLive) — ни
// одна. Контроль без жетона тут же, в том же прогоне: если и он показывает
// ноль, значит проверка меряет не то, что думает.
//
//   node tools/check-drop-sticky.js

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
    // Поле финала: пятьдесят дуо, силы вокруг сотни — та самая комната, про
    // которую он писал. Состав важен только тем, что даёт команде её ключ.
    const field = [];
    for (let i = 0; i < 50; i++) {
      const h = 'bot' + i;
      field.push({
        name: 'Team ' + i, pow: 92 + (i % 17), closeEdge: 0,
        squad: [{handle: h + 'a', rating: 60}, {handle: h + 'b', rating: 60}],
        qualOrder: i
      });
    }
    const GAMES = 12;
    const where = t => { const z = t.landingZone; return z ? z.x + ',' + z.y : '?'; };
    const layout = () => {
      buildBotLandingAssignment(field);
      return field.map(where);
    };
    const moves = rows => {
      let n = 0;
      for (let g = 1; g < rows.length; g++)
        for (let i = 0; i < field.length; i++) if (rows[g][i] !== rows[g - 1][i]) n++;
      return n;
    };

    // Как было: без жетона этапа.
    CC_DROP_STAGE = null;
    const loose = [];
    for (let g = 0; g < GAMES; g++) loose.push(layout());
    const looseMoves = moves(loose);
    out.steps.push('без жетона: ' + looseMoves + ' переездов за ' + (GAMES - 1) + ' игр');

    // Как стало: этап держит бросок.
    CC_DROP_STAGE = 's1|total';
    const stuck = [];
    for (let g = 0; g < GAMES; g++) stuck.push(layout());
    const stuckMoves = moves(stuck);
    out.steps.push('внутри этапа: ' + stuckMoves + ' переездов за ' + (GAMES - 1) + ' игр');

    if (stuckMoves !== 0) fail('лобби переезжает внутри этапа: ' + stuckMoves + ' переездов');
    if (looseMoves === 0) fail('контроль пуст — без жетона комната тоже не двигалась, проверка меряет не то');

    // Следующий этап — своя раздача, иначе хиты и финал стояли бы одинаково.
    CC_DROP_STAGE = 's2|total';
    const next = layout();
    const same = next.filter((z, i) => z === stuck[0][i]).length;
    if (same === field.length) fail('второй этап лёг ровно как первый — жетон не участвует в броске');
    out.steps.push('следующий этап: ' + (field.length - same) + ' команд из ' + field.length + ' сели иначе');

    // Дома при этом остаются домами: постоянство коробки не должно означать,
    // что вся комната переехала в одну кучу.
    const boxes = new Set(stuck[0]);
    if (boxes.size < 10) fail('вся комната стоит в ' + boxes.size + ' коробках');
    out.steps.push('комната занимает ' + boxes.size + ' коробок');
  } catch(e){ if(!out.fail) out.fail = String(e && e.stack || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dropsticky-'));
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
console.log('лобби финала держит свои коробки все игры этапа');
fs.rmSync(dir, { recursive: true, force: true });
