// Что даёт каждый способ высадки: свой дом, тихое место, контест.
//
// Дом и тихое место — это очки лута точки и спокойный старт; контест — стычка
// на высадке с капом LANDING_ODDS_CAP. Меряется на настоящих играх карты:
// среднее место, победы, топ-10 и доля вылетов в первые сорок секунд.
//
//   node tools/career-drop-value-probe.js [игр]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const GAMES = +(process.argv[2] || 400);
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
(function(){
  const GAMES_N=${GAMES};
  const out={rows:[], errs:[]};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Probe', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    squadSize=2; CARD_MODE=true; useLandingSet(careerBrSet());
    const set=ACTIVE_LANDING_SET;
    careerSpotSet(4, set);
    const me=careerCard();
    const setAura=(a)=>{ const l=careerSpotList(set); if(l[0]) l[0].aura=a; };
    const run=(how)=>{
      let places=0, wins=0, top10=0, early=0, fights=0, fightWins=0, nb=0;
      for(let g=0; g<GAMES_N; g++){
        const you=careerYouTeam([me]); you.isYou=true; you.name='you';
        const field=[you, ...careerCupField(CAREER.career, [me], ccTeams(50), null, false, 0)];
        careerSpotFearOn(you);
        const {zoneGroups}=buildBotLandingAssignment(field.filter(t=>t!==you));
        careerSpotFearOff();
        let zone;
        if(how==='home') zone=careerSpotZone(set);
        else if(how==='quiet'){
          let best=null, busy=Infinity, pts=-Infinity;
          ALL_LANDING_ZONES.forEach(z=>{ const b=(zoneGroups.get(z)||[]).length;
            if(b<busy || (b===busy && z.points>pts)){ busy=b; pts=z.points; best=z; } });
          zone=best;
        } else {
          // контест: самая сильная занятая коробка — верх списка, который
          // видит игрок
          let best=null, pow=-Infinity;
          zoneGroups.forEach((group,z)=>{ const p=group.reduce((m,t)=>Math.max(m,t.pow||0),0);
            if(p>pow){ pow=p; best=z; } });
          zone=best;
        }
        you.landingZone=zone;
        applyLandingPow(you, zone.points);     // как это делает careerLandingPick
        if(!zoneGroups.has(zone)) zoneGroups.set(zone, []);
        const here=zoneGroups.get(zone);
        const rivals=here.length;
        // Не сколько соседей, а какой: в лобби на пятьдесят дуо пустых коробок
        // не остаётся, и аура может отогнать только сильного, а не всех.
        nb+=here.reduce((m,t)=>Math.max(m, t.pow||0), 0);
        zoneGroups.get(zone).push(you);
        if(rivals) fights++;
        field.forEach(t=>{ t._elims=0; t._feed=[]; t._droppedOut=false;
          t._pf=Math.max(1, t.pow*gameForm()); t._pc=Math.max(1, t._pf+(t.closeEdge||0)); });
        const order=simulateGameOnMap(field, {lobbySquads:field.length});
        const at=order.indexOf(you)+1;
        places+=at; if(at===1) wins++; if(at<=10) top10++;
        if(you._droppedOut) early++; else if(rivals) fightWins++;
      }
      return {place:+(places/GAMES_N).toFixed(2), wins:+(wins/GAMES_N*100).toFixed(1),
              top10:+(top10/GAMES_N*100).toFixed(1), early:+(early/GAMES_N*100).toFixed(1),
              nb:+(nb/GAMES_N).toFixed(2),
              held:fights ? +(fightWins/fights*100).toFixed(0) : null};
    };
    setAura(0);  out.rows.push({what:'дом, аура 0',  ...run('home')});
    setAura(5);  out.rows.push({what:'дом, аура 5',  ...run('home')});
    setAura(10); out.rows.push({what:'дом, аура 10', ...run('home')});
    setAura(0);
    out.rows.push({what:'тихое место', ...run('quiet')});
    out.rows.push({what:'контест',     ...run('contest')});
  }catch(e){ out.errs.push(String(e && e.stack || e)); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccdrop-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=900000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('проба не дала вывода'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if(out.errs.length) console.error(out.errs.join('\n'));
console.log('высадка        ср. место   побед %   топ-10 %   вылет на дропе %   сила соседа   выстоял %');
out.rows.forEach(r => console.log(
  r.what.padEnd(14), String(r.place).padStart(9), String(r.wins).padStart(9),
  String(r.top10).padStart(10), String(r.early).padStart(18), String(r.nb).padStart(13),
  String(r.held == null ? '-' : r.held).padStart(11)));
