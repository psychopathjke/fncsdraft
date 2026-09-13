// Лобби по очкам — как в турнирах Фортнайта.
//
// Его переписка с игроком, страница «bags 13.09»: «I died every time off spawn
// in solo series… by the 3rd or 4th game I was supposed to get a win with 10 or
// 20 kills to get back on track» — «there's no variation in points like in
// Fortnite; I'll think about this mechanic to fix it». Раньше лобби каждой игры
// были чистым жребием: слил три игры — четвёртую играешь в той же комнате с
// лидерами. Epic сажает вместе тех, у кого похожий счёт (первая игра — жребий).
//
// Проверяется на поле в 150 дуо по лобби в 50 (три комнаты, шесть игр):
//   * первая игра — жребий: средние очки комнат не расходятся (все по нулям);
//   * со второй игры комнаты выстроены по счёту: средние очки лобби идут по
//     убыванию, и разрыв между верхним и нижним лобби заметный;
//   * лобби не режется строго по таблице: между соседними комнатами есть
//     перехлёст (CC_LOBBY_MIX), а не ровный срез;
//   * поле в одно лобби (50 из 50) ничем не трогается: одна комната каждую игру.
//
//   node tools/check-lobby-by-points.js
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

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={steps:[], fail:null};
  const fail=m=>{ out.fail=m; throw new Error(m); };
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Lobby', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:80, role:'roleIGL', attrs:null, ageEdge:4},
      career:{season:1, day:'2026-02-05', division:2, earnings:0, balance:500, reach:0,
              tokens:[], log:[], news:[], sim:true}, partner:null}));
    careerEntry(); CARD_MODE=true; squadSize=2; useLandingSet('m2');
    careerSimSet(true); skipAnimation=true; CAREER_RUN=true; CC_SKIP_RUN=true;
    // Запись жеребьёвки: очки каждой команды в каждом лобби каждой игры.
    const rec=[]; const orig=splitIntoLobbies;
    splitIntoLobbies=function(t, m){ const r=orig(t, m); rec.push(r.map(l=>l.map(x=>x.stagePts||0))); return r; };
    const me=careerCard();
    const play=async (n, lobby)=>{
      rec.length=0;
      const you=careerYouTeam([me]); you.isYou=true; you.name='you';
      const field=[you, ...careerCupField(CAREER.career, [me], n, 'lbp', false, 1).slice(0, n-1)];
      await simulateGamesLive(field, 6, pointsForPlace, 4, 'stage', 0, null, null,
        {lobbySize:lobby, stageName:'probe', mapReplay:false, choices:false});
      return rec.slice();
    };
    const games=await play(150, 50);
    if(games.length!==6) fail('жеребьёвок '+games.length+' вместо 6');
    const mean=a=>a.reduce((s,x)=>s+x,0)/Math.max(1,a.length);
    // Игра 1 — жребий.
    { const g=games[0]; if(g.length!==3) fail('в первой игре лобби '+g.length);
      if(g.some(l=>l.some(p=>p!==0))) fail('в первой игре у кого-то уже есть очки'); }
    // Игры 2–6 — по счёту.
    let overlap=0, gaps=[];
    for(let i=1;i<games.length;i++){
      const g=games[i]; if(g.length!==3) fail('в игре '+(i+1)+' лобби '+g.length);
      const ms=g.map(mean);
      if(!(ms[0]>ms[1] && ms[1]>ms[2])) fail('игра '+(i+1)+': средние очки лобби не по убыванию: '+ms.map(x=>x.toFixed(1)).join(' > '));
      gaps.push(ms[0]-ms[2]);
      // Перехлёст: минимум верхнего лобби ниже максимума следующего.
      if(Math.min(...g[0])<Math.max(...g[1]) || Math.min(...g[1])<Math.max(...g[2])) overlap++;
    }
    const gap=mean(gaps);
    /* Мерка — сигма очков по полю: при жребии средние комнат расходятся на ~0.2σ
       (σ/√50 на комнату), при рассадке по счёту верх и низ расходятся на полторы
       сигмы и больше. Порог 0.8σ — между тем и другим, а не на краю замера. */
    const all6=games[5].flat(), mu=mean(all6);
    const sigma=Math.sqrt(mean(all6.map(x=>(x-mu)*(x-mu))));
    const spread=Math.max(...all6)-Math.min(...all6);
    if(!(gap>sigma*0.8)) fail('разрыв верхнего и нижнего лобби '+gap.toFixed(1)+' при сигме '+sigma.toFixed(1)+' — как при жребии');
    if(!overlap) fail('соседние лобби ни разу не перехлестнулись — срез строго по таблице, а не очередь');
    out.steps.push('150 дуо по 50: первая игра жребием, дальше комнаты по счёту — разрыв верх/низ в среднем '+gap.toFixed(1)+' очка ('+(gap/sigma).toFixed(2)+'σ, разброс '+spread+'), перехлёст соседних в '+overlap+' из 5 игр');
    out.steps.push('игра 6, средние очки комнат: '+games[5].map(l=>mean(l).toFixed(1)).join(' / '));
    // Одно лобби на всё поле — не трогается.
    const one=await play(50, 50);
    if(one.some(g=>g.length!==1)) fail('поле в одно лобби разбилось: '+one.map(g=>g.length).join(','));
    out.steps.push('поле в одно лобби: одна комната каждую игру');
  }catch(e){ if(!out.fail) out.fail=String(e && e.stack || e); }
  document.getElementById('__out').textContent='BEG'+'IN'+encodeURIComponent(JSON.stringify(out))+'E'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cclbp-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--host-resolver-rules=MAP * ~NOTFOUND',
  '--window-size=1400,900','--virtual-time-budget=600000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('проба не дала вывода'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
console.log('лобби по очкам: первая игра жребием, дальше — по счёту, как в турнирах');
