// У чужих команд есть свои точки, и сильные их держат.
//
// Его вопрос через игрока, 24 августа: «у ботов тоже лока залочена и они на одну
// летят или каждый турнир у них разные локации?». Замер ответил честно: разные —
// пять турниров одним полем, и ни одна из 49 команд не села в ту же коробку все
// пять раз. Его решение: «своя коробка у каждой команды, пока сильнее не
// выбьет».
//
// Дом считается от самой команды и от острова (ccBotHome), поэтому переживает
// турниры; занятый дом берётся, если сидящие слабее, — тогда это стычка на своей
// точке, а не бегство с неё.
//
// Проверяется три вещи, и третья — самая важная: раздача дропа откалибрована
// (доля делящих коробку и то, что стычки случаются на жирных POI), и дома не
// имеют права её сдвинуть. Контроль — тот же прогон с выключенными домами.
//
//   node tools/check-bot-homes.js
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
(function(){
  const out={steps:[], fails:[], notes:{}, errs:null, fail:null};
  const check=(n, ok, d)=>{ out.steps.push((ok?'  ok  ':' FAIL ')+n+(d?': '+d:''));
                            if(!ok) out.fails.push(n+(d?': '+d:'')); };
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Homes', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    const cr=CAREER.career, me=careerCard();
    drafted=[me]; CARD_MODE=true; squadSize=2; useLandingSet(careerBrSet());

    // ---- 1. дом команды не зависит от вечера ------------------------------
    const field0=careerCupField(cr, [me], ccTeams(50), null, false, 0);
    const first=field0.map(t=>ALL_LANDING_ZONES.indexOf(ccBotHome(t)));
    const again=field0.map(t=>ALL_LANDING_ZONES.indexOf(ccBotHome(t)));
    check('дом один и тот же при повторном вопросе', first.join(',')===again.join(','));
    check('и он вообще есть у каждой команды', first.every(i=>i>=0));

    // ---- 2. сильные держат его чаще слабых -------------------------------
    const orig=ccBotHome;
    const runRoom=(useHomes)=>{
      ccBotHome = useHomes ? orig : function(){ return null; };
      const spots=new Map(), pw=new Map();
      let shared=0, total=0, cPts=0, cN=0;
      for(let ev=0; ev<6; ev++){
        const field=careerCupField(cr, [me], ccTeams(50), null, false, 0);
        const g=buildBotLandingAssignment(field).zoneGroups;
        field.forEach(t=>{
          const k=t.name, i=ALL_LANDING_ZONES.indexOf(t.landingZone);
          if(!spots.has(k)){ spots.set(k, []); pw.set(k, t.pow||0); }
          spots.get(k).push(i);
        });
        g.forEach((list,z)=>{ total+=list.length;
          if(list.length>1){ shared+=list.length; cPts+=(z.points||0); cN++; } });
      }
      const ranked=[...pw.entries()].sort((a,b)=>b[1]-a[1]);
      const top=new Set(ranked.slice(0, 12).map(e=>e[0]));
      const bottom=new Set(ranked.slice(-12).map(e=>e[0]));
      let stable=0, stTop=0, stBot=0, seen=0;
      spots.forEach((list,name)=>{
        if(list.length<6) return;
        seen++;
        if(!list.every(x=>x===list[0])) return;
        stable++;
        if(top.has(name)) stTop++;
        if(bottom.has(name)) stBot++;
      });
      return {seen:seen, stable:stable, stTop:stTop, stBot:stBot,
              contest:Math.round(shared/total*100),
              cPts:Math.round(cPts/Math.max(1,cN)*100)/100};
    };
    const after=runRoom(true), before=runRoom(false);
    ccBotHome=orig;
    out.notes.before=before; out.notes.after=after;
    check('с домами команды держат свою коробку', after.stable>0,
          after.stable+' из '+after.seen);
    check('контроль: без домов не держит никто', before.stable===0,
          String(before.stable));
    check('сильные держат чаще слабых', after.stTop>after.stBot,
          'топ-12: '+after.stTop+', низ-12: '+after.stBot);

    // ---- 3. раздача не сдвинулась ---------------------------------------
    check('доля делящих коробку та же', Math.abs(after.contest-before.contest)<=5,
          before.contest+'% → '+after.contest+'%');
    check('стычки по-прежнему на жирных коробках', after.cPts>=before.cPts-0.2,
          before.cPts+' → '+after.cPts);
  }catch(e){ out.fail=String(e && e.stack || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cchome-'));
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
out.steps.forEach(s => console.log(s));
console.log('  ' + JSON.stringify(out.notes));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
if ((out.errs || []).length) console.error('page errors: ' + out.errs.join(' | '));
if (out.fails.length) process.exit(1);
console.log('у чужих команд есть дом, и сильные его держат');
