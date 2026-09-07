// Число сёрджа НА ЭКРАНЕ ИГРОКА: чистый урон своей команды (dealt − taken), линия
// отсечки и «над порогом» по зонам — против того же у комнаты и против реплеев.
//
// Его слово 7 сентября: «чет урон сюрджа нереалистичный … в зависимости сколько
// игрок получил и дал урона». Правило Epic (X @FNCompetitive, 23.10.2025):
// Net Damage = Damage Dealt − Damage Taken, только урон между игроками, режут
// команды с наименьшим чистым уроном при живых больше порога фазы. Реплей финала
// Solo Series (1ed7bc5b): чистый урон на седьмой зоне — медиана 100, максимум 797.
//
//   node tools/career-surge-you-probe.js [игр]      — дуо, кубок дивизиона 1
//   SOLO=1 node tools/career-surge-you-probe.js [игр] — соло, финал Solo Series
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const GAMES = +(process.argv[2] || 40);
const SOLO = process.env.SOLO === '1';
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
  const GAMES_N=${GAMES}, SOLO=${JSON.stringify(SOLO)};
  const out={zones:{}, errs:[], n:0, alive:0};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Probe', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-01-24', division:1, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[], sim:true},
      partner:null}));
    careerEntry();
    careerSimSet(true); skipAnimation=true;
    const me=careerCard();
    CARD_MODE=true; squadSize=SOLO?1:2;
    useLandingSet(SOLO?'s42':careerBrSet());
    if(typeof ccZoneTuneFor==='function') ccZoneTuneFor(SOLO ? {type:'solo', stage:'final', day:careerToday()} : {type:'cup', day:careerToday()});
    if(CC_ZONE_PROFILE && ZoneSim.profile) ZoneSim.profile(CC_ZONE_PROFILE);
    const Z=out.zones; const push=(z,k,v)=>{ (Z[z]=Z[z]||{}); (Z[z][k]=Z[z][k]||[]).push(v); };
    for(let g=0; g<GAMES_N; g++){
      const you=SOLO ? careerTeam([me], true) : careerYouTeam([me]); you.isYou=true; you.name='you';
      const field=SOLO
        ? [you, ...careerSoloField(CAREER.career, [me], 100, false, 'final').slice(0, 99)]
        : [you, ...careerCupField(CAREER.career, [me], ccTeams(50), null, false, g%8)];
      buildBotLandingAssignment(field.filter(t=>!t.isYou));
      you.landingZone=ALL_LANDING_ZONES[g%ALL_LANDING_ZONES.length];
      await playGameWithChoices(field, null, null);
      const fr=(you._game && you._game.frames) ? you._game.frames() : [];
      const meIdx=field.indexOf(you);
      // Последний кадр каждой зоны: свой n, линия, разрыв; медиана и максимум n по живым.
      const last={};
      fr.forEach(f=>{ if(f.zone>=1 && f.zone<=11) last[f.zone]=f; });
      for(let z=1; z<=11; z++){
        const f=last[z]; if(!f) continue;
        const d=(f.dots||[])[meIdx]; if(!d) continue;
        const alive=(f.dots||[]).filter(x=>x && x.alive).map(x=>Number(x.n)||0).sort((a,b)=>a-b);
        push(z,'you', Number(d.n)||0);
        push(z,'youAlive', d.alive?1:0);
        if(f.surgeLine!=null){ push(z,'line', f.surgeLine); push(z,'gap', (Number(d.n)||0)-f.surgeLine); }
        push(z,'med', alive.length?alive[Math.floor(alive.length/2)]:0);
        push(z,'p90', alive.length?alive[Math.min(alive.length-1, Math.floor(alive.length*0.9))]:0);
        push(z,'max', alive.length?alive[alive.length-1]:0);
        push(z,'min', alive.length?alive[0]:0);
      }
      const sq=you._sq||{};
      push(12,'dealt', Math.round(sq.dealt||0)); push(12,'taken', Math.round(sq.taken||0));
      out.n++;
    }
  }catch(e){ out.errs.push(String(e && e.stack || e)); }
  document.getElementById('__out').textContent='BEG'+'IN'+encodeURIComponent(JSON.stringify(out))+'E'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccsurgeyou-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=1800000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('проба не дала вывода'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if(out.errs.length) console.error(out.errs.join('\n'));
const med = a => { if(!a || !a.length) return null; const s=a.slice().sort((x,y)=>x-y); return s[Math.floor(s.length/2)]; };
const avg = a => (a && a.length) ? a.reduce((x,y)=>x+y,0)/a.length : null;
const f = v => v==null ? '—' : String(Math.round(v));
console.log((SOLO ? 'СОЛО, финал Solo Series' : 'ДУО, кубок дивизиона 1') + ' — ' + out.n + ' игр. Чистый урон (dealt − taken) на конце зоны:');
console.log('зона   свой медиана   свой макс   линия сёрджа   над порогом (медиана)   комната: мин / медиана / p90 / макс   свой жив %');
for(let z=1; z<=11; z++){
  const Z=out.zones[z]; if(!Z) continue;
  console.log(String(z).padEnd(6), f(med(Z.you)).padStart(13), f(Math.max(...Z.you)).padStart(11), f(med(Z.line)).padStart(14),
    f(med(Z.gap)).padStart(22), (f(med(Z.min))+' / '+f(med(Z.med))+' / '+f(med(Z.p90))+' / '+f(med(Z.max))).padStart(36), f(avg(Z.youAlive)*100).padStart(9));
}
console.log('реплеи финала Solo Series (4 игры, живые игроки, чистый урон): зона 4 — медиана 20–35, p90 180–320, макс 650–1250; зона 7 — медиана 72–123, p90 354–454, макс 700–1270; зона 11 — медиана 280–305, p90 460–713, макс 486–1413; нанесено за игру: медиана ~280, p90 ~800, макс 1400–2000.');
const D=out.zones[12]||{};
console.log('конец игры, своя команда: нанесено медиана ' + f(med(D.dealt)) + ' (макс ' + f(Math.max(...(D.dealt||[0]))) + '), получено медиана ' + f(med(D.taken)));
console.log('реплей финала Solo Series, седьмая зона: медиана чистого 100, максимум 797; реальный игрок за игру наносит обычно 300–1500.');
