// Играется ли этап ОДНИМ лобби — то есть всё, что не карьера.
//
// Баг игрока, 24 августа (страница «bags» в Notion, скрин из тг):
//   ReferenceError: landingWins is not defined
//     at fncsdraft.com:38099:30 → simulateGamesLive → runMajorTournament
//   «cant play more than 1 game in everything except career»
//
// Счёт стычек на высадке переехал 23 августа в creditLandingFights (чтобы его
// звали обе ветки — см. комментарий там), и локальная `const landingWins`
// уехала вместе с ним. Строка журнала ниже осталась ссылаться на неё: первая
// же игра этапа падала на записи результата. Карьеру это обошло стороной —
// её вечера идут веткой opts.lobbySize, у которой своя запись строки, — и
// потому «всё, кроме карьеры».
//
// Проба играет этап БЕЗ lobbySize (ветка одного лобби: хиты и финалы Мейджора,
// Саммит, Глобалы, обычный турнир) на три игры и требует три строки журнала у
// каждого — то есть чтобы вторая игра вообще состоялась.
//
//   node tools/check-draft-live-stage.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const GAMES = 3;
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const HEAD = `<script>
window.__errs = [];
window.addEventListener('error', function(e){ window.__errs.push(String(e.message) + ' @' + e.lineno); });
window.addEventListener('unhandledrejection', function(e){
  var r = e && e.reason; window.__errs.push('reject: ' + String((r && (r.stack || r.message)) || r)); });
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {games:${GAMES}, teams:0, logs:null, won:0, lost:0, errs:null, fail:null};
  try{
    // Поле строится карьерным набором — он под рукой и даёт полсотни настоящих
    // дуо, — но играется НЕ карьерной веткой: opts.lobbySize не передаётся,
    // и потому это ровно тот путь, которым идут хиты Мейджора.
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Prober', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    skipAnimation=true; CC_SKIP_RUN=true;
    const cr=CAREER.career;
    const me=careerCard();
    drafted=[me]; CARD_MODE=true; squadSize=2;
    useLandingSet(careerBrSet());
    const you=careerYouTeam([me]); you.isYou=true; you.name='you';
    const field=[you, ...careerCupField(cr, [me], 49, null, false, 0)];
    const {zoneGroups}=buildBotLandingAssignment(field.filter(t=>t!==you));
    you.landingZone=careerSpotZone(careerBrSet());
    if(!zoneGroups.has(you.landingZone)) zoneGroups.set(you.landingZone, []);
    zoneGroups.get(you.landingZone).push(you);
    // Ни lobbySize, ни карты: этап одним лобби, как в драфте.
    await simulateGamesLive(field, ${GAMES}, majorPoints, 1, 'stage', 0, null, zoneGroups,
      {stageName:'probe', mapReplay:false, stopOnYourDeath:false});
    out.teams=field.length;
    const lens=new Set(field.map(t=>(t.stageLog||[]).length));
    out.logs=[...lens];
    field.forEach(t=>(t.stageLog||[]).forEach(g=>{
      if(g.landingOutcome==='won') out.won++;
      if(g.landingOutcome==='lost') out.lost++;
    }));
  } catch(e){ out.fail=String(e && e.stack || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'draftlive-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=600000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('проба ничего не вернула'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));

let bad = 0;
const say = (ok, s) => { console.log((ok ? '  ok  ' : ' FAIL ') + s); if(!ok) bad++; };
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
say(!(out.errs||[]).length, 'страница без ошибок' +
    ((out.errs||[]).length ? ': ' + out.errs.join(' | ') : ''));
say(out.teams >= 40, 'поле ' + out.teams + ' команд');
say(out.logs && out.logs.length === 1 && out.logs[0] === out.games,
    'у каждой команды ' + out.games + ' строк журнала (получено ' + JSON.stringify(out.logs) + ')');
// Стычки читаются с карты — на полсотни дуо их всегда несколько; ноль означал
// бы, что landingOutcome снова никто не пишет.
say(out.won > 0 && out.lost > 0,
    'высадки записаны: выиграно ' + out.won + ', проиграно ' + out.lost);
process.exit(bad ? 1 : 0);
