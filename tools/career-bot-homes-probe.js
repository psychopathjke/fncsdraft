// «Сильные команды падают на самые лучшие локации, а у меня в карьерах всегда
// на рандомные сплиты падают». Тестер, 16 сентября 2026.
//
// Комната Дивизиона 1: сила ботов, и куда ложится дом (ccBotHome) у десятки
// сильнейших против остальных — ранг коробки по очкам и по сундукам среди
// коробок острова. Плюс та же картина после реальной раздачи
// (buildBotLandingAssignment), где дом можно и не удержать.
//
//   node tools/career-bot-homes-probe.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set CHROME to chrome.exe');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out = {fail:null};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'ProbeH', age:19, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:88, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:'probeh', cardRegion:'EU', nat:null},
      career:{season:1, size:2, day:'2026-02-10', division:1, earnings:0, balance:0,
              reach:0, tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    CARD_MODE=true; squadSize=2;
    const cr=CAREER.career; const me=careerCard();
    const CP=+(new URLSearchParams(location.search).get('cp')||'1');
    CC_HOME_CHEST_POW=CP; out.cp=CP;
    const fieldAll=careerCupField(cr, [me], careerCupSize(1), null, false, 0);
    // Шесть лобби по полсотни из одного дивизиона.
    const agg={top:[], rest:[], mates:0, boxes:0}; let sorted=null, bots=null;
    const avg=(r,k)=>r.length ? Math.round(r.reduce((s,x)=>s+x[k],0)/r.length*10)/10 : null;
    for(let L=0; L<6; L++){
    const field=fieldAll.slice(L*49, L*49+49);
    bots=field.filter(t=>!t.isYou);
    const zones=ALL_LANDING_ZONES;
    const byPts=zones.slice().sort((a,b)=>(b.points||0)-(a.points||0));
    const byCh=zones.slice().sort((a,b)=>(b.chests||b.loot||0)-(a.chests||a.loot||0));
    out.set=ACTIVE_LANDING_SET; out.zones=zones.length;
    out.pts=zones.map(z=>z.points||0).sort((a,b)=>b-a).slice(0,8);
    out.chests=zones.map(z=>z.chests!=null?z.chests:null).filter(v=>v!=null).sort((a,b)=>b-a).slice(0,8);
    const pows=bots.map(t=>t.pow||0).sort((a,b)=>b-a);
    out.pow={top:pows[0], p10:pows[9], med:pows[Math.floor(pows.length/2)], low:pows[pows.length-1]};
    const rankOf=(list, z)=>list.indexOf(z)+1;
    sorted=bots.slice().sort((a,b)=>(b.pow||0)-(a.pow||0));
    const rows=grp=>grp.map(t=>{ const h=ccBotHome(t); return h ? {pts:rankOf(byPts,h), ch:rankOf(byCh,h)} : null; }).filter(Boolean);
    const avg=(r,k)=>r.length ? Math.round(r.reduce((s,x)=>s+x[k],0)/r.length*10)/10 : null;
    const top=rows(sorted.slice(0,10)), rest=rows(sorted.slice(10));
    out.home={top10:{pts:avg(top,'pts'), ch:avg(top,'ch'), inTop5pts:top.filter(x=>x.pts<=5).length, inTop5ch:top.filter(x=>x.ch<=5).length},
              rest:{pts:avg(rest,'pts'), ch:avg(rest,'ch'), n:rest.length, inTop5pts:rest.filter(x=>x.pts<=5).length}};
    // Настоящая раздача этапа.
    buildBotLandingAssignment(bots, {});
    const rows2=grp=>grp.map(t=>t.landingZone ? {pts:rankOf(byPts,t.landingZone), ch:rankOf(byCh,t.landingZone)} : null).filter(Boolean);
    const t2=rows2(sorted.slice(0,10)), r2=rows2(sorted.slice(10));
    out.seat={top10:{pts:avg(t2,'pts'), ch:avg(t2,'ch'), inTop5pts:t2.filter(x=>x.pts<=5).length, inTop5ch:t2.filter(x=>x.ch<=5).length},
              rest:{pts:avg(r2,'pts'), ch:avg(r2,'ch'), inTop5pts:r2.filter(x=>x.pts<=5).length}};
    agg.top.push(...t2); agg.rest.push(...r2);
    }
    out.agg={top10:{ch:avg(agg.top,'ch'), pts:avg(agg.top,'pts'), inTop5ch:agg.top.filter(x=>x.ch<=5).length+'/'+agg.top.length},
             rest:{ch:avg(agg.rest,'ch'), inTop5ch:agg.rest.filter(x=>x.ch<=5).length+'/'+agg.rest.length}};
    out.detail=sorted.slice(0,10).map(t=>{ const h=ccBotHome(t); return {pow:t.pow, homes:ccBotHomes(t).map(z=>rankOf(byCh,z)).join('>'), home:rankOf(byCh,h), seat:rankOf(byCh,t.landingZone), same:h===t.landingZone, mates:(bots.filter(o=>o.landingZone===t.landingZone).length-1)}; });
    out.k=sorted.slice(0,3).map(t=>({pow:t.pow, k:Math.max(0.6, Math.min(3.2, ((t.pow||90)-80)/12))}));
  } catch(e){ out.fail=String(e && e.stack || e); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cchome-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(String.fromCharCode(92)).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=120000','--dump-dom',
  'file:///' + tmp.split(String.fromCharCode(92)).join('/') + '?cp=' + (process.argv[2]||'1')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.fail) { console.error(out.fail); process.exit(1); }
console.log(JSON.stringify(out, null, 1));
