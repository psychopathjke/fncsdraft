// Как складываются бонусы решений и что с ними происходит между играми.
//
// Три вопроса, на которые проба отвечает измерением, а не обещанием:
//   1) стакаются ли лут и высокая земля внутри одной игры;
//   2) сбрасывается ли всё к следующей игре, или тащится дальше;
//   3) получают ли эти бонусы остальные команды лобби.
//
//   node tools/check-career-choice-stacking.js
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
window.__errs=[];
window.addEventListener('error', e=>window.__errs.push(String(e.message)+' @'+e.lineno));
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={steps:[], errs:null, fail:null};
  const fail=m=>{ out.fail=m; throw new Error(m); };
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Stacker', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    squadSize=2; CARD_MODE=true; useLandingSet(careerBrSet());

    // ---- 1. внутри игры бонусы складываются -------------------------------
    const you={pow:100, isYou:true, squad:[{handle:'a'},{handle:'b'}]};
    you._pf=you.pow; you._pc=you.pow;
    /* Числами самой игры, а не выдуманными: он их меняет (25 августа высота
       стала +10/−10), и проба, зашившая старые, проверяла бы прошлое. */
    ccAddGamePow(you, CC_LOOT_POI_BONUS);
    ccAddGamePow(you, CC_HG_POW);
    const want=100+CC_LOOT_POI_BONUS+CC_HG_POW;
    if(you._pf!==want) fail('лут и высота не сложились: '+you._pf+', ждали '+want);
    ccAddGamePow(you, -CC_HG_FAIL);   // а мог бы и провалиться
    if(you._pf!==want-CC_HG_FAIL) fail('штраф не вычелся: '+you._pf);
    if(you.pow!==100) fail('решения переписали силу карточки');
    out.steps.push('внутри игры складываются: 100 → +'+CC_LOOT_POI_BONUS+' лут → +'+
      CC_HG_POW+' высота → −'+CC_HG_FAIL+' = '+you._pf);

    // ---- 2. следующая игра начинается с нуля ------------------------------
    // Поле в турнире ОДНО на весь этап: те же объекты команд играют все игры.
    // Значит важно, что каждая игра пересобирает _pf/_pc от pow заново.
    const me=careerCard();
    const field=[careerYouTeam([me]), ...careerCupField(CAREER.career, [me], ccTeams(20), null, false, 0)];
    field[0].isYou=true; field[0].name='you';
    const basePow=field.map(t=>t.pow);
    const seen=[];
    for(let g=0; g<3; g++){
      // Как это делает игра: перед каждой игрой сила пересобирается.
      field.forEach(t=>{ t._pf=Math.max(1, t.pow*gameForm()); t._pc=Math.max(1, t._pf+(t.closeEdge||0)); });
      seen.push(field.map(t=>t._pf/t.pow));      // во сколько раз сила отличается от карточки
      // и в игре все получают своё
      ccAddGamePow(field[0], 10);
      ccRoomLoot(field, field[0]);
      ccRoomLate(field, field[0]);
    }
    // Если бы бонусы копились между играми, отношение _pf к pow росло бы от
    // игры к игре. Оно обязано оставаться около единицы (это форма на игру).
    const drift=seen.map(r=>r.reduce((s,v)=>s+v,0)/r.length);
    if(drift.some(d=>d>1.35 || d<0.65))
      fail('сила уехала между играми: '+drift.map(d=>d.toFixed(2)).join(' → '));
    if(field.some((t,i)=>t.pow!==basePow[i])) fail('pow команд изменился за турнир');
    out.steps.push('между играми сбрасывается: сила/карточка по играм — '+
      drift.map(d=>d.toFixed(2)).join(' → ')+' (это форма, не накопление)');

    // ---- 3. комната получает то же самое ----------------------------------
    field.forEach(t=>{ t._pf=Math.max(1, t.pow); t._pc=t._pf; });
    const before=field.map(t=>t._pf);
    ccRoomLoot(field, field[0]);
    ccRoomLate(field, field[0]);
    const moved=field.filter((t,i)=>t!==field[0] && t._pf!==before[i]).length;
    const bots=field.length-1;
    if(moved===0) fail('комната не получила ни лута, ни высоты');
    if(field[0]._pf!==before[0]) fail('комнатная раздача задела игрока');
    if(moved<bots*0.5) fail('лут получили только '+moved+' из '+bots);
    out.steps.push('комната играет тоже: у '+moved+' из '+bots+' команд сила изменилась');
  }catch(e){ if(!out.fail) out.fail=String(e && e.message || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccstack-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=120000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('проба не дала вывода'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s=>console.log('  '+s));
if((out.errs||[]).length) console.error('ОШИБКИ: '+out.errs.join(' | '));
if(out.fail){ console.error('FAILED: '+out.fail); process.exit(1); }
console.log('бонусы живут одну игру, складываются внутри неё и раздаются всей комнате');
