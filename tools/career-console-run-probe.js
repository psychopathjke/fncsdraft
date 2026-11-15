// Прогон консольных и мобильных капов карьерой настоящего игрока: покупает PS5 Pro, Xbox Series X и iPhone, играет капы
// Epic 2026 по датам (careerPlay, как кнопка «Играть») и печатает каждый вечер: платформа, сила, лобби, место, приз.
//   node tools/career-console-run-probe.js [ник] [напарник] [сколько вечеров]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const ME = process.argv[2] || 'Malibuca', MATE = process.argv[3] || 'vic0', N = +(process.argv[4] || 10);
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'].find(p => p && fs.existsSync(p));

const HEAD = `<script>window.__errs=[];window.addEventListener('error',e=>window.__errs.push(String(e.message)+' @'+e.lineno));
window.addEventListener('unhandledrejection',e=>window.__errs.push('rejection: '+String(e.reason&&e.reason.message||e.reason)));<\/script>`;
const BOOT = `<pre id="__out" style="display:none"></pre><script>
(async function(){
  const out={start:null, nights:[], errs:null, err:null};
  try{
    const card=h=>PLAYERS.filter(p=>p && hKey(p.handle)===hKey(h)).sort((a,b)=>(attrsFor(b).ovr||0)-(attrsFor(a).ovr||0))[0];
    const me=card(${JSON.stringify(ME)}), mate=card(${JSON.stringify(MATE)});
    if(!me || !mate) throw new Error('no card');
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:me.handle, age:20, source:'card', country:me.nat||'dk', countryPing:12, closeRangeEdge:0,
              region:me.region||'EU', ovr:Math.round(attrsFor(me).ovr), role:'roleIGL', attrs:null, ageEdge:0,
              photo:null, handle:me.handle, cardRegion:me.region||'EU', nat:me.nat||null},
      career:{season:1, day:'2026-01-05', division:1, earnings:0, balance:20000, reach:0, tokens:[], log:[], news:[], size:2, energy:100},
      partners:[{handle:mate.handle, cardRegion:mate.region||'EU', dev:0, since:'2025-06-01'}]}));
    careerEntry();
    const cr=CAREER.career;
    ['ps4','ps5','ps5pro','xboxone','xboxs','xbox','phone'].forEach(id=>careerBuy(id));
    out.start={me:me.handle+' '+Math.round(attrsFor(me).ovr), mate:mate.handle, own:CAREER.gear.own.join(','), balance:cr.balance,
               bonus:{ps:ccConsoleDevBonus('ps'), xbox:ccConsoleDevBonus('xbox'), any:ccConsoleDevBonus('any'), mob:ccMobileDevBonus()}, mob:ccMobileOvr()};
    // По одному вечеру каждой платформы по очереди, только открытые этапы (без хитов/капа Mobile Series).
    const pool=CC_CONSOLE_2026.filter(v=>(!v.series || v.series==='round') && v.day>='2026-01-05').sort((a,b)=>a.day<b.day?-1:1);
    const by={ps:[], xbox:[], any:[], mobile:[]}; pool.forEach(v=>{ const n=ccConsoleNeed(v); if(by[n]) by[n].push(v); });
    const pick=[]; let k=0; const used=new Set();
    while(pick.length<${N} && k<200){ const plat=['ps','mobile','any','xbox'][k%4]; const v=(by[plat]||[]).find(x=>!used.has(x.day) && (!pick.length || x.day>pick[pick.length-1].day)); if(v){ pick.push(v); used.add(v.day); } k++; }
    const iv=setInterval(()=>{ const am=document.getElementById('ccAskModal'); if(am && am.style.display==='flex'){ const n=document.getElementById('ccAskNo'); if(n) n.click(); }
      const b=document.getElementById('majorSkipBtn'); if(b && !b.disabled) b.click(); const c0=document.querySelector('.cc-choice-btn'); if(c0) c0.click();
      const go=document.querySelector('.cc-loot [data-a="go"]'); if(go) go.click(); }, 25);
    for(const v of pick){
      const e0=window.__errs.length, logN=(cr.log||[]).length;
      cr.day=v.day; cr.energy=100; CC_VICTORY_LIST=null; CC_YEAR_DAYS=null;
      const plat=ccConsoleNeed(v), ok=ccConsoleOk(v);
      const alt=ccVictoryAlts(v.day).find(x=>x.id===v.id);
      if(alt) ccVictoryPick(v.id);
      const today=careerVictoryOn(v.day);
      let yPow=null, base=null, field=0, usedMob=false;
      const cyt=careerYouTeam; careerYouTeam=function(){ const t=cyt.apply(this, arguments); base=t.pow; return t; };
      const sgl=simulateGamesLive; simulateGamesLive=function(f){ if(yPow==null){ const y=f.find(t=>t.isYou); yPow=y && y.pow; field=f.length; } return sgl.apply(this, arguments); };
      const sg=simulateGames; simulateGames=function(f){ if(yPow==null){ const y=f.find(t=>t.isYou); yPow=y && y.pow; field=f.length; } return sg.apply(this, arguments); };
      const mf=ccMobileField; ccMobileField=function(){ usedMob=true; return mf.apply(this, arguments); };
      const t0=Date.now(); let threw=null;
      try{ document.getElementById('majorStages').innerHTML=''; try{ careerSpotEnsure(); }catch(e){} await careerPlay(); }catch(e){ threw=String(e && e.message || e); }
      careerYouTeam=cyt; simulateGamesLive=sgl; simulateGames=sg; ccMobileField=mf;
      const row=(cr.log||[]).slice(logN).find(r=>r.kind==='victory') || (cr.log||[]).slice(logN)[0];
      out.nights.push({day:v.day, id:v.id, plat, open:ok, listed:!!alt, today:today && today.id, played:!!row,
        pow:yPow, base, devBonus:plat==='mobile' ? ccMobileDevBonus() : ccConsoleDevBonus(plat), mobField:usedMob, field,
        place:row && row.place, of:row && row.of, prize:row && row.prize || 0, mobOvr:plat==='mobile' ? ccMobileOvr() : undefined,
        sec:Math.round((Date.now()-t0)/1000), threw, errs:window.__errs.slice(e0).slice(0,3)});
    }
    clearInterval(iv);
    out.end={pcOvr:CAREER.player.ovr, mob:ccMobileOvr(), mobN:cr.mobN||0, earnings:cr.earnings, mobSer:cr.mobSer||null};
  }catch(e){ out.err=String(e && e.stack || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEG'+'IN'+encodeURIComponent(JSON.stringify(out))+'E'+'ND';
})();<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccrun-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g, '/') + '/">' + HEAD + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
  '--user-data-dir=' + path.join(dir, 'prof'), '--virtual-time-budget=3000000', '--dump-dom', 'file:///' + tmp.replace(/\\/g, '/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 1500000 });
const m = dom.match(/BEGIN([\w%\-.!~*'()]*)END/);
if (!m) { console.error('no output'); process.exit(2); }
const o = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(o.start));
o.nights.forEach(n => console.log(JSON.stringify(n)));
console.log('end', JSON.stringify(o.end));
if (o.err) console.error('ERR', o.err);
if ((o.errs || []).length) console.error('page errors:', o.errs.slice(0, 8).join(' | '));
