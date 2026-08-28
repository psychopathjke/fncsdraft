// Кубок играется в перетасованных лобби — но коробки за вечер не меняются.
//
// Его слово, 27 августа: «почему боты меняют локацию во время капа, сделай
// такую возможность только игроку».
//
// check-drop-sticky.js этого не ловил: там поле стоит мёртвым, у команд нет
// очков этапа, и очередь выбора (byQualOrder) все двенадцать игр одна и та же.
// На живом вечере очки набегают каждую игру — очередь пересортировывается,
// дом достаётся другому, и комната переезжает, хотя жетон этапа на месте.
//
// Меряется ровно это: одна и та же комната, между играми набегают очки, и
// считается, сколько команд сменило коробку. Контроль — тот же прогон без
// набегающих очков: если и он двигается, проверка меряет не то.
//
//   node tools/check-cup-drop-sticky.js

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
    const GAMES = 10;
    const make = () => {
      const field = [];
      for (let i = 0; i < 50; i++) {
        const h = 'bot' + i;
        field.push({
          name: 'Team ' + i, pow: 92 + (i % 17), closeEdge: 0, stagePts: 0,
          squad: [{handle: h + 'a', rating: 60}, {handle: h + 'b', rating: 60}]
        });
      }
      return field;
    };
    const where = t => { const z = t.landingZone; return z ? z.x + ',' + z.y : '?'; };
    // Очки игры — детерминированные, но у каждой команды свои: ровно то, что
    // делает живой вечер с таблицей.
    const play = (field, g) => field.forEach((t, i) => {
      t.stagePts += (i * 7 + g * 13) % 20;
    });
    const run = (scoring) => {
      const field = make();
      const rows = [];
      for (let g = 0; g < GAMES; g++) {
        if (scoring && g) play(field, g);
        buildBotLandingAssignment(field);
        rows.push(field.map(where));
      }
      let n = 0;
      for (let g = 1; g < rows.length; g++)
        for (let i = 0; i < field.length; i++) if (rows[g][i] !== rows[g - 1][i]) n++;
      return {moves: n, rows: rows};
    };

    CC_DROP_STAGE = 's1|total';
    const still = run(false);
    out.steps.push('таблица стоит: ' + still.moves + ' переездов за ' + (GAMES - 1) + ' игр');

    CC_DROP_STAGE = 's2|total';
    const live = run(true);
    out.steps.push('очки набегают: ' + live.moves + ' переездов за ' + (GAMES - 1) + ' игр');

    if (still.moves !== 0) fail('контроль сломан: комната переезжает даже без очков (' + still.moves + ')');
    if (live.moves !== 0) fail('боты меняют локацию внутри вечера: ' + live.moves + ' переездов');

    const boxes = new Set(live.rows[0]);
    if (boxes.size < 10) fail('вся комната стоит в ' + boxes.size + ' коробках');
    out.steps.push('комната занимает ' + boxes.size + ' коробок');

    // Игрока это не касается: комната садится без него (careerLandingPick зовёт
    // buildBotLandingAssignment по field без you), а метку он ставит сам —
    // и каждую игру новую, если хочет.
    CC_DROP_STAGE = 's3|total';
    const field = make();
    const you = field[0]; you.isYou = true; you.name = 'you';
    const bots = field.filter(t => t !== you);
    const seat = g => {
      const groups = buildBotLandingAssignment(bots).zoneGroups;
      // Игрок выбирает разное каждую игру — это и есть та возможность.
      const z = ALL_LANDING_ZONES[(g * 5) % ALL_LANDING_ZONES.length];
      you.landingZone = z;
      if (!groups.has(z)) groups.set(z, []);
      groups.get(z).push(you);
      return {room: bots.map(where), mine: where(you)};
    };
    const g0 = seat(0), g1 = seat(1), g2 = seat(2);
    const roomMoved = g0.room.filter((z, i) => z !== g1.room[i]).length
                    + g1.room.filter((z, i) => z !== g2.room[i]).length;
    if (roomMoved) fail('комната переехала вокруг игрока: ' + roomMoved);
    if (g0.mine === g1.mine || g1.mine === g2.mine) fail('игрок не смог сменить коробку');
    out.steps.push('игрок сменил коробку трижды, комната — ни разу');
    if (CC_DROP_SEATS && CC_DROP_SEATS.has(ccDropKey(you)))
      fail('игрок попал в память комнаты — его тоже начнёт держать');
    out.steps.push('места в памяти только у ботов');

    /* И память обязана пережить ПЕРЕСБОРКУ сетки.

       careerLandingPick зовёт useLandingSet перед каждым вопросом, а тот делает
       новые объекты зон. Память, хранящая сам прямоугольник, во второй игре
       возвращала зону из старой сетки — и остров в пикере оказывался пустым
       (его снимок Мирового чемпионата, 27 августа). Здесь это ловится: между
       играми сетка пересобирается, и комната обязана остаться той же И лежать
       в коробках ТЕКУЩЕЙ сетки. */
    CC_DROP_STAGE = 's4|total';
    const rb = make();
    buildBotLandingAssignment(rb);
    const before = rb.map(where);
    useLandingSet(ACTIVE_LANDING_SET);          // как это делает careerLandingPick
    const groups = buildBotLandingAssignment(rb).zoneGroups;
    const after = rb.map(where);
    const moved2 = before.filter((z, i) => z !== after[i]).length;
    if (moved2) fail('после пересборки сетки комната переехала: ' + moved2);
    const onGrid = new Set(ALL_LANDING_ZONES);
    const stale = [...groups.keys()].filter(z => !onGrid.has(z));
    if (stale.length) fail('комната разложена по коробкам СТАРОЙ сетки: ' + stale.length +
                           ' — пикер покажет пустой остров');
    const seatedNow = ALL_LANDING_ZONES.reduce((n, z) => n + ((groups.get(z) || []).length), 0);
    if (seatedNow !== rb.length) fail('на текущей сетке нашлось ' + seatedNow +
                                      ' команд из ' + rb.length);
    out.steps.push('после пересборки сетки: все ' + seatedNow + ' команд на своих коробках');

    /* Круг Reload чередует острова игра через игру — и каждый обязан помнить
       СВОЁ. Его игрок, 27 августа: «и в релоуде в хитах и финале боты каждую
       игру локу меняют». Память была одна на команду, игра на втором острове
       затирала место первого, и следующая игра первого садилась заново. */
    CC_DROP_STAGE = 's5|total';
    const alt = make();
    const islands = ['r1', 'r3'].filter(k => ZONE_SETS[k]);
    if (islands.length === 2) {
      const seen = {};
      for (let g = 0; g < 6; g++) {
        const set = islands[g % 2];
        /* Очки набегают и здесь — иначе проверка слепая. Когда память
           промахивается, раздача считается заново, а без очков этот расчёт
           детерминирован и выдаёт ту же раскладку: промах не видно. На живом
           вечере таблица растёт, очередь выбора (byQualOrder) едет за ней, и
           промах памяти сразу превращается в переезд. */
        if (g) play(alt, g);
        useLandingSet(set);
        buildBotLandingAssignment(alt);
        const row = alt.map(where);
        if (!seen[set]) seen[set] = row;
        else {
          const moved3 = seen[set].filter((z, i) => z !== row[i]).length;
          if (moved3) fail('на острове ' + set + ' комната переехала между своими играми: ' +
                           moved3 + ' (память путает острова)');
        }
      }
      // Контроль: острова НЕ одинаковые, иначе проверка ничего не различает.
      if (seen[islands[0]].join('|') === seen[islands[1]].join('|'))
        fail('оба острова легли одинаково — проверка не различает их');
      out.steps.push('чередование островов: каждый держит свою раздачу');
      useLandingSet('m2');
    } else {
      out.steps.push('островов круга нет в сборке — чередование не проверено');
    }
  } catch(e){ if(!out.fail) out.fail = String(e && e.stack || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BE'+'GIN' + encodeURIComponent(JSON.stringify(out)) + 'E'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cupdrop-'));
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
console.log('комната кубка держит свои коробки весь вечер, игрок — нет');
fs.rmSync(dir, { recursive: true, force: true });
