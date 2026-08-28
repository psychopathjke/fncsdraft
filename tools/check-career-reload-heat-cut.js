// Финал Reload — это те, кто вышел из хитов, а не хиты заново.
//
// Жалоба его игрока, 27 августа: «часто вижу команды, которые в хитах не
// квальнули финалы релоада, но в финале почему-то играют».
//
// Так и было. Хит — лобби на 20 дуо с отсечкой ПЯТЬ, а финал — снова 20. В
// ccRelRoom из прошлого этапа приезжают только прошедшие (relSeed.through),
// то есть четверо плюс игрок, а остальные пятнадцать мест добираются свежим
// careerCupField — из того же ростера, тем же careerSeed (он сеется
// КАЛЕНДАРНОЙ НЕДЕЛЕЙ, а хит и финал одного капа лежат в одной). Значит в
// финал садились ровно те, кого игрок только что выбил.
//
// Та же болезнь и то же лекарство, что у Парижа (см. ccRcField): кто выбыл,
// тот в добор не попадает — его карточки уходят в список занятых.
//
// Здесь считается пересечение: сколько команд финала играли хит игрока и НЕ
// прошли. Контроль — размер комнаты и то, что прошедшие на месте: пустой
// финал тоже дал бы ноль пересечений.
//
//   node tools/check-career-reload-heat-cut.js

const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
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
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'RelProbe', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    skipAnimation = true; CC_SKIP_RUN = true;
    await wait(50);

    const cr = CAREER.career;
    const me = careerCard();
    const mates = careerMates();
    if (!me || mates.some(m => !m)) fail('карьера не собрала состав');
    const drafted = [me].concat(mates);
    CARD_MODE = true; squadSize = careerSquadSize();
    window.drafted = drafted;
    useLandingSet('r1');

    // Ровно то, что делает runCareerReload: этап, комната, полоса.
    const room = (stage) => {
      const ev = {series:1, set:'r1', stage:stage, id:'ReloadEliteSeries1', label:stage};
      const st = ccScaleStage(CC_RELOAD_STAGE[stage]);
      const deep = st.field <= 20;
      const open = !deep;
      const lobbyCr = deep ? Object.assign({}, cr, {division:1}) : cr;
      const sharp = !deep ? 0
        : (stage === 'final' ? CC_FIELD_SHARP.final : CC_FIELD_SHARP.heats);
      const you = careerYouTeam(drafted);
      you.name = 'you'; you.isYou = true;
      return {ev, st, you, field: ccRelRoom(you, drafted, lobbyCr, ev, st, open, sharp)};
    };

    // 1. Хит: комната, очки, отсечка.
    const H = room('heat');
    if (H.field.length !== H.st.field)
      fail('хит собрал ' + H.field.length + ' команд вместо ' + H.st.field);
    // Очки — детерминированные и разные, чтобы отсечка была настоящей.
    H.field.forEach((t, i) => { t.stagePts = (i * 37) % 101; t.wins = 0; t.stageElims = 0; });
    const ranked = H.field.slice().sort((a,b) => b.stagePts - a.stagePts
      || (b.wins||0) - (a.wins||0) || b.stageElims - a.stageElims);
    const q = heatQualifiers(H.field, H.st.cut, false);
    const lost = ranked.filter(t => !q.has(t) && t !== H.you);
    out.steps.push('хит: ' + H.field.length + ' команд, прошли ' + q.size +
                   ', выбыли ' + lost.length);
    if (!lost.length) fail('в хите никто не выбыл — проверять нечего');

    // 2. Что вечер оставляет после себя — той же строкой, что и раннер.
    const NEXT = {playin:'heat', heat:'final'};
    const outNames = (H.field.length <= CC_REL_OUT_MAX)
      ? lost.reduce((a,t) => a.concat((t.squad||[]).map(c => c && c.handle).filter(Boolean)), [])
      : null;
    cr.relSeed = {season:cr.season, size:careerSquadSize(), set:'r1', next:NEXT.heat,
                  through: ranked.filter(t => q.has(t))
                                 .map(t => t === H.you ? 'you' : ccStageSeatRow(t)),
                  out: outNames};
    if (!outNames || !outNames.length) fail('список выбывших не записался');

    // 3. Финал.
    const F = room('final');
    if (F.field.length !== F.st.field)
      fail('финал собрал ' + F.field.length + ' команд вместо ' + F.st.field);

    const lostKeys = new Set(lost.map(ccSeatKey));
    const ghosts = F.field.filter(t => lostKeys.has(ccSeatKey(t)));
    out.steps.push('финал: ' + F.field.length + ' команд, из них выбывших в хите — ' +
                   ghosts.length);

    // Контроль: прошедшие действительно доехали, иначе ноль призраков ничего
    // не значит — пустая комната тоже даёт ноль.
    const throughKeys = new Set(ranked.filter(t => q.has(t) && t !== H.you).map(ccSeatKey));
    const kept = F.field.filter(t => throughKeys.has(ccSeatKey(t))).length;
    out.steps.push('прошедшие в финале: ' + kept + ' из ' + throughKeys.size);
    if (kept !== throughKeys.size) fail('квалифицировавшихся в финале ' + kept +
                                        ' из ' + throughKeys.size);
    if (!F.field.some(t => t.isYou)) fail('игрока нет в финале');

    if (ghosts.length) fail('в финале играют выбывшие из хита: ' + ghosts.length +
                            ' из ' + F.field.length);

    /* И посев самих хитов: из отбора выходит вчетверо больше, чем садится в
       один хит, значит сильные обязаны разъехаться змейкой. Его игрок,
       27 августа: «опять всех сильных ко мне в один хит». */
    const PO = ccScaleStage(CC_RELOAD_STAGE.playin);
    const pf = room('playin').field.slice(0, PO.cut * 4);
    pf.forEach((t, i) => { t.stagePts = 1000 - i; t.wins = 0; t.stageElims = 0; });
    const pRanked = pf.slice().sort((a, b) => b.stagePts - a.stagePts);
    const through = pRanked.slice(0, PO.cut);
    const H2 = room('heat');
    cr.relSeed = {season: cr.season, size: careerSquadSize(), set: 'r1', next: 'heat',
                  through: through.map(t => t === H2.you ? 'you' : ccStageSeatRow(t)),
                  out: null};
    // Игрок садится вторым по таблице отбора — змейка обязана увести часть
    // верхушки в другие хиты.
    const seededYou = through[1];
    cr.relSeed.through[1] = 'you';
    const R = room('heat');
    const heatKeys = new Set(R.field.map(ccSeatKey));
    const top = through.slice(0, R.st.field);          // верхние двадцать отбора
    const withMe = top.filter(t => heatKeys.has(ccSeatKey(t))).length;
    out.steps.push('верхних ' + top.length + ' из отбора, в моём хите их ' + withMe +
                   ' (комната ' + R.field.length + ')');
    if (R.field.length !== R.st.field)
      fail('хит собрал ' + R.field.length + ' вместо ' + R.st.field);
    if (withMe > Math.ceil(top.length / 2))
      fail('верхушка отбора сидит в одном хите: ' + withMe + ' из ' + top.length);
  } catch(e){ if(!out.fail) out.fail = String(e && e.stack || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'relheat-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, BASE + HEAD + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);

const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--window-size=1440,1400',
  '--virtual-time-budget=180000', '--dump-dom', 'file:///' + tmp.replace(/\\/g, '/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if (out.errs && out.errs.length) { console.error('page errors: ' + out.errs.slice(0, 4).join(' | ')); process.exit(1); }
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
console.log('в финале Reload только те, кто вышел из хитов');
fs.rmSync(dir, { recursive: true, force: true });
