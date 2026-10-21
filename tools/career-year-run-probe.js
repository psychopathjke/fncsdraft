// Год карьеры за настоящую пару — что сыграли они и что выиграл мир без них.
//
// Его просьба 21.10: «за Скай Скролла сделай прогон в 26 года и покажи их результаты и результаты мира». Карьера
// карточкой (source 'card') за первого, напарник — второй, год перематывается целиком (careerFastForward, как
// career-year-drift-probe). Печатает свои вечера (день, турнир, место, призовые, кто выиграл), доску призовых года и
// финалы мира, сыгранные без них (лента ccNewsWorldWon).
//
//   node tools/career-year-run-probe.js [ник] [напарник] [дней]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const ME = process.argv[2] || 'Sky', MATE = process.argv[3] || 'Scroll', DAYS = +(process.argv[4] || 366);
const CHROME = [process.env.CHROME,
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
  const out={errs:null, err:null};
  try{
    const days=careerYearDays();
    let day=null;
    for(let d=CC_YEAR_FROM; d<=CC_YEAR_TO; d=ccAddDays(d,1))
      if((days.get(d)||[]).length){ day=d; break; }
    const card=h=>PLAYERS.filter(p=>p && hKey(p.handle)===hKey(h)).sort((a,b)=>(attrsFor(b).ovr||0)-(attrsFor(a).ovr||0))[0];
    const me=card(${JSON.stringify(ME)}), mate=card(${JSON.stringify(MATE)});
    if(!me || !mate) throw new Error('нет карточки: '+(!me?${JSON.stringify(ME)}:${JSON.stringify(MATE)}));
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:me.handle, age:20, source:'card', country:me.nat||'dk', countryPing:12, closeRangeEdge:0,
              region:me.region||'EU', ovr:Math.round(attrsFor(me).ovr), role:'roleIGL', attrs:null, ageEdge:0,
              photo:null, handle:me.handle, cardRegion:me.region||'EU', nat:me.nat||null},
      career:{season:1, day:day, division:1, earnings:0, balance:1000, reach:0, tokens:[], log:[], news:[], size:2},
      partners:[{handle:mate.handle, cardRegion:mate.region||'EU', dev:0, since:'2025-06-01'}]}));
    careerEntry();
    out.start={day, me:me.handle+' '+Math.round(attrsFor(me).ovr), mate:mate.handle+' '+Math.round(attrsFor(mate).ovr),
               partner:(careerPartnerCard()||{}).handle||null};
    const realNews=careerNews; const WORLD=[];
    careerNews=function(kind, key, args, opt){ if(key==='ccNewsWorldWon') WORLD.push({d:careerToday(), a:(args||[]).map(x=>String(x).replace(/<[^>]+>/g,''))}); return realNews.apply(this, arguments); };
    const realMoney=careerMoneyAdd; const PAID=[];
    careerMoneyAdd=function(ranked, prize){ try{ const w=ranked && ranked[0]; const top=w ? (prize(1, w)||0) : 0;
      if(top>=5000) PAID.push({d:(typeof CC_PRIZE_DAY!=='undefined' && CC_PRIZE_DAY)||careerToday(), w:String(ccBoardName(w.name)||'').slice(0,60), you:!!w.isYou, n:ranked.length, top}); }catch(e){}
      return realMoney.apply(this, arguments); };
    const realGF=careerGlobalsField; const GF=[];
    careerGlobalsField=function(you){ const f=realGF.apply(this, arguments); try{ const bots=f.filter(t=>!t.isYou && t!==you).sort((a,b)=>b.pow-a.pow);
      GF.push({you:you&&you.pow, yparts:(typeof CC_MP_YOU_PARTS!=='undefined'?CC_MP_YOU_PARTS:''), top:bots.slice(0,6).map(t=>String(ccBoardName(t.name)).slice(0,22)+':'+t.pow+(t.botEdge?'('+t.botEdge.form+'/'+t.botEdge.chem+'/'+t.botEdge.an+')':''))}); }catch(e){} return f; };
    const realDigest=careerFfDigest; let caught=null;
    careerFfDigest=function(ff){ caught=ff; };
    const t0=Date.now();
    await careerFastForward(${DAYS});
    careerFfDigest=realDigest;
    out.ms=Date.now()-t0;
    out.to=careerToday();
    out.err=(caught && caught.err)||null;
    const cr=CAREER.career;
    const label=(d, kind)=>{ const e=(days.get(d)||[]).find(x=>x.kind===kind) || (days.get(d)||[])[0]; return e ? (e.label||e.kind) : (kind||'?'); };
    const who=w=>!w ? '' : typeof w==='string' ? w : Array.isArray(w) ? w.map(x=>x && (x.h||x.handle||x)).join(' & ') : (w.name||w.h||JSON.stringify(w)).toString();
    out.log=(cr.log||[]).map(r=>({d:r.day, ev:label(r.day, r.kind), kind:r.kind, st:r.stage||'', pl:r.place, of:r.of,
      prize:r.prize||0, mate:r.mate||'', won:String(who(r.won)).replace(/<[^>]+>/g,'').slice(0,60)}));
    const rows=careerMoney().rows||{};
    const list=Object.keys(rows).map(h=>({h, usd:rows[h].usd||0})).sort((a,b)=>b.usd-a.usd);
    out.board=list.slice(0, 15).map((r,i)=>({i:i+1, h:r.h, usd:r.usd}));
    out.boardMe=list.findIndex(r=>hKey(r.h)===hKey(me.handle))+1;
    out.boardMate=list.findIndex(r=>hKey(r.h)===hKey(mate.handle))+1;
    out.gf=GF; careerGlobalsField=realGF; out.world=WORLD; careerNews=realNews; careerMoneyAdd=realMoney;
    out.paid=PAID.map(x=>Object.assign(x, {ev:label(x.d, null)}));
    out.earn=cr.earnings||0; out.div=cr.division; out.ovr=CAREER.player.ovr;
    out.mateOvr=careerPartnerCard() ? Math.round(attrsFor(careerPartnerCard()).ovr) : null;
    out.partnerNow=(careerPartnerCard()||{}).handle||null;
  }catch(e){ out.err={text:String((e&&(e.stack||e.message))||e)}; }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'yearrun-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=6000000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')],
  {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/BEGIN([\w%\-.!~*'()]*)END/);
if (!m) { console.error('проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
fs.writeFileSync(path.join(os.tmpdir(), 'year-run.json'), JSON.stringify(out, null, 1));
if (out.errs && out.errs.length) console.error('ошибки страницы: ' + out.errs.slice(0,3).join(' | '));
if (out.err) console.error('встала: ' + JSON.stringify(out.err).slice(0, 400));
console.log(JSON.stringify(out.start) + ' -> ' + out.to + ' за ' + Math.round((out.ms||0)/1000) + ' с');
console.log('свои вечера: ' + (out.log||[]).length + ', призовые $' + out.earn + ', дивизион ' + out.div + ', рейтинг ' + out.ovr + ', напарник ' + out.partnerNow + ' ' + out.mateOvr);
(out.log||[]).forEach(r => console.log('  ' + r.d + '  ' + (r.ev + (r.st ? ' [' + r.st + ']' : '')).slice(0, 44).padEnd(44) + String(r.pl + '/' + r.of).padStart(9) +
  ('$' + r.prize).padStart(10) + '  ' + (r.mate || '').padEnd(10) + ' won: ' + r.won));
console.log('доска призовых (' + ME + ' #' + out.boardMe + ', напарник #' + out.boardMate + '):');
(out.board||[]).forEach(r => console.log('  ' + String(r.i).padStart(2) + '. ' + r.h.padEnd(18) + ' $' + r.usd));
console.log('все выплаты с первым призом от $5000: ' + (out.paid||[]).length);
(out.paid||[]).forEach(x => console.log('  ' + x.d + '  ' + String(x.ev).slice(0, 44).padEnd(44) + String(x.n).padStart(6) + ('$' + x.top).padStart(10) + '  ' + (x.you ? '** ' : '') + x.w));
(out.gf||[]).forEach(g=>console.log('GLOBALS you '+g.you+' '+g.yparts+' | '+g.top.join('  ')));
console.log('финалы мира без них: ' + (out.world||[]).length);
(out.world||[]).forEach(w => console.log('  ' + w.d + '  ' + w.a.join(' — ')));
