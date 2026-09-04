// Париж — одно лобби, и за десять игр в нём раздаётся десять Виктори.
//
// Отчёт игрока 1 сентября 2026 (твит в ответ keegorka): «ewc lan 10 games but
// way more wins» — в таблице этапа стояло десять матчей, а у пятёрки сверху
// пятнадцать побед. Причина была в поле: групповой этап собирался двадцаткой
// дуо (ccRcField возвращал весь бросок), а лобби раннер просит размером этого
// сезона — ccTeams(20), то есть тринадцать в трио. Двадцать команд на лобби в
// тринадцать движок режет на два лобби, и каждая игра выдаёт две победы.
//
// Проверяется то, что сломалось, и в обоих форматах сезона:
//   * поле каждого этапа Парижа плюс игрок ровно равно лобби этапа;
//   * групповой вечер раздаёт ровно столько побед, сколько сыграно игр.
//
//   node tools/check-career-rc-lobby.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
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
window.addEventListener('unhandledrejection', function(e){ window.__errs.push('rejection: ' + String(e.reason && e.reason.message || e.reason)); });
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {steps: [], errs: null, fail: null};
  const fail = m => { out.fail = m; throw new Error(m); };
  try{
    const start = (size) => {
      localStorage.setItem('fncsdraft_career', JSON.stringify({
        v:1, player:{nick:'Parisien', age:20, source:'rookie', country:'de', countryPing:15,
          closeRangeEdge:6, region:'EU', ovr:96, role:'roleIGL', attrs:null, ageEdge:4},
        career:{season:2, day:'2026-08-19', division:1, size:size, earnings:0,
                balance:1000, reach:0, tokens:[], log:[], news:[]},
        partner:null}));
      careerEntry();
      skipAnimation=true; CC_SKIP_RUN=true;
      if(careerSquadSize()!==size) fail('the season did not start in squads of '+size);
    };

    // ---- поле каждого этапа ровно на одно лобби --------------------------
    [2,3].forEach(function(size){
      start(size);
      const cr=CAREER.career, worldCr=Object.assign({}, cr, {division:1});
      const lobby=ccTeams(20);
      ['group','survival','final'].forEach(function(stage){
        const st=ccRcStage(stage==='group' ? CC_RC_GROUP : stage==='survival' ? CC_RC_SURV : CC_RC_FINAL);
        const bots=ccRcField(cr, worldCr, [careerCard()], stage, st.teams);
        const room=bots.length+1;
        if(room>lobby)
          fail(size+'-man '+stage+': the room is '+room+' against a lobby of '+lobby+
               ' — that splits into '+Math.ceil(room/lobby)+' lobbies and hands out that many wins a game');
        if(room!==lobby)
          fail(size+'-man '+stage+': the room is '+room+', the lobby '+lobby);
      });
      out.steps.push(size+'-man season: every Paris stage is one room of '+lobby);
    });

    // ---- и вечер раздаёт ровно свои победы --------------------------------
    for(const size of [2,3]){
      start(size);
      const cr=CAREER.career, worldCr=Object.assign({}, cr, {division:1});
      const st=ccRcStage(CC_RC_GROUP);
      const you=careerYouTeam([careerCard()]);
      you.name='you'; you.isYou=true;
      const field=[you, ...ccRcField(cr, worldCr, [careerCard()], 'group', st.teams)];
      await simulateGamesLive(field, st.games, rcPoints, CC_RC_KILL, 'stage', 0, null, null,
        {lobbySize:ccTeams(20), stageName:'probe', mapReplay:false, choices:false});
      const wins=field.reduce((s,t)=>s+(t.wins||0), 0);
      const games=Math.max.apply(null, field.map(t=>(t.stageLog||[]).length));
      if(games!==st.games) fail(size+'-man group played '+games+' games, not '+st.games);
      if(wins!==games)
        fail(size+'-man group handed out '+wins+' wins across '+games+' games — one game, one Victory Royale');
      out.steps.push(size+'-man group: '+games+' games, '+wins+' wins, one each');
    }
  } catch(e){ if(!out.fail) out.fail = String(e && e.message || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEG'+'IN' + encodeURIComponent(JSON.stringify(out)) + 'E'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccrc-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=600000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if ((out.errs||[]).length) console.error('page errors: ' + out.errs.join(' | '));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
if ((out.errs||[]).length) process.exit(1);
console.log('Paris is one lobby, and one game is one Victory Royale');
