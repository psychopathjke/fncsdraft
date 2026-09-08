// Гонка на ШЕСТЕРЫХ на целый год: шесть живых клиентов в одной комнате воркера,
// шесть карьер с разными бот-напарниками, общий голос за перемотку до конца
// сезона. Все турнирные вечера идут локстепом (careerFastForward → careerPlay),
// пустые дни каждый шагает сам. Сверяется: все дошли до даты, красных строк
// «вечера разошлись» нет, перемотка не встала (CC_FF.err), ошибок страницы нет.
// Журналы у каждого свои (дивизионы за год расходятся), поэтому таблицы не
// сравниваются — печатаются. Собран из check-race-live-three.js.
//
//   CC_BUDGET=21600000 node tools/check-race-live-six.js      (часы — только nohup + Monitor)
//   CC_N=4 CC_DAY=2026-02-02 CC_FF=2026-03-01 …                (короче: четверо, месяц)
const fs = require('fs'), os = require('os'), path = require('path'), http = require('http'), crypto = require('crypto');
const { spawn } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const N = Math.min(6, Math.max(2, Number(process.env.CC_N || 6)));
const DAY = process.env.CC_DAY || '2025-12-01';
const FF = process.env.CC_FF || '2026-10-27';
const CODE = ('Y' + crypto.randomBytes(3).toString('hex').toUpperCase()).slice(0, 6);
const BUDGET_MS = Number(process.env.CC_BUDGET || 6 * 3600000);
const SLASH = String.fromCharCode(92);

const BASE = '<base href="file:///' + ROOT.split(SLASH).join('/') + '/">';
const HEAD = BASE + '<script>\n' +
  'window.__errs=[];\n' +
  "window.addEventListener('error', function(e){ window.__errs.push(String(e.message)+' @'+e.lineno); }); window.addEventListener('unhandledrejection', function(e){ var r=e.reason; window.__errs.push('rejection: '+String(r && (r.stack||r.message) || r).slice(0,300)); });\n" +
  '<' + '/script>';

const boot = (who) => `
<pre id="__out" style="display:none"></pre><pre id="__prog" style="display:none"></pre>
<script>
(async function(){
  const out={notes:{who:${JSON.stringify(who.nick)}}, errs:null, fail:null};
  const wait=ms=>new Promise(r=>setTimeout(r, ms));
  if(${JSON.stringify(process.env.CC_HOST||"")}) MP.host=${JSON.stringify(process.env.CC_HOST||"")};
  // Харнесс-человек: первая зона, первый выбор, метку не ставить.
  setInterval(function(){
    const am=document.getElementById("ccAskModal");
    if(am && am.style.display==="flex"){ const no=document.getElementById("ccAskNo");
      if(document.getElementById("ccAskYes") && document.getElementById("ccAskYes").textContent===L().ccSpotGateSet){ careerSpotEnsure(); document.getElementById("ccAskModal").style.display="none"; careerPlay(); return; } }
    const cbs=document.querySelectorAll(".cc-choice-btn"); if(cbs.length){ cbs[0].click(); return; }
    const p=document.querySelector(".landing-picker"); if(!p) return;
    const z=p.querySelectorAll(".land-zone"); if(!z.length) return;
    z[0].click();
    const c=p.querySelector("#gameLandingConfirm"); if(c && !c.disabled) c.click();
  }, 40);
  const t0=Date.now();
  out.notes.marks=[]; out.notes.ffErr=null; out.notes.splits=[];
  // Пульс для журнала пробы: день, журнал, броски, связь, перемотка.
  setInterval(function(){
    try{
      const cr=CAREER && CAREER.career; if(!cr) return;
      if(CC_FF && CC_FF.err && !out.notes.ffErr) out.notes.ffErr=CC_FF.err;
      out.notes.nights=out.notes.nights||[]; while(out.notes.nights.length<(cr.log||[]).length){ const r=cr.log[out.notes.nights.length]; out.notes.nights.push([r.day, r.kind||'cup', 'r'+CC_MP_ROLLS, 'lock'+(CC_RACE_LOCK?1:0), 'seed'+(CC_MP_SEED?1:0), 'alone'+(CC_MP_ALONE?1:0), 'field'+(CC_RACE_DBG?CC_RACE_DBG.n+'/'+CC_RACE_DBG.humans.length:'-'), 'link '+MP.state].join(' ')); }
      [...document.querySelectorAll('.cc-mp-split')].map(e=>e.textContent).forEach(s=>{ if(out.notes.splits.indexOf(s)<0) out.notes.splits.push(cr.day+' '+s); });
      document.getElementById('__prog').textContent=[cr.day, 'див '+cr.division, 'журнал '+(cr.log||[]).length, 'броски '+CC_MP_ROLLS,
        'связь '+MP.state, 'ff '+(CC_FF?'идёт':'-'), 'split '+(typeof CC_MP_SPLIT_AT!=='undefined'?CC_MP_SPLIT_AT:'-'), 'гонка '+JSON.stringify(typeof CC_RACE_DBG!=='undefined'?CC_RACE_DBG:null),
        'соперники '+(typeof ccRaceRivals==='function'?ccRaceRivals().length:'-'), 'комната '+(typeof ccRaceRoom==='function'?ccRaceRoom().length:'-'), 'wait['+((typeof CC_MP_WAIT!=='undefined'&&CC_MP_WAIT)?CC_MP_WAIT.map(w=>w.t).join(';'):'')+']', 'acts '+JSON.stringify((out.notes.marks||[]).slice(-3)), 'hold '+(typeof CC_MP_HOLD!=='undefined'?CC_MP_HOLD:'-'), 'peers '+JSON.stringify(Object.keys(CC_RACE_PEERS).map(k=>(CC_RACE_PEERS[k].card||{}).handle+':'+CC_RACE_PEERS[k].day)), 'врозь '+(typeof ccRaceApartWhy==='function'?ccRaceApartWhy(careerNext()):'-')].join(' · ');
    }catch(e){}
  }, 5000);
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:${JSON.stringify(who.nick)}, age:${who.age}, source:'rookie', country:${JSON.stringify(who.country)}, countryPing:15,
        closeRangeEdge:${who.close}, region:'EU', ovr:${who.ovr}, role:${JSON.stringify(who.role)}, attrs:null, ageEdge:${who.ageEdge},
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:${JSON.stringify(DAY)}, division:1, earnings:${who.money}, balance:${who.money}, reach:${who.reach},
              tokens:[], log:[], news:[], form:${who.form}, grind:${who.grind}},
      partners:[]}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs=ccRookieAttrs(${who.ovr}, ${JSON.stringify(who.role)});
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerEntry();
    // Свой бот-напарник из ростера сцены, у всех шестерых разные.
    { const pool=ccSceneRoster(ccCareerRegion()).filter(c=>hKey(c)!==hKey(careerCard())); const card=pool[${who.mateIdx}];
      if(!card) throw new Error('нет карточки напарника в ростере');
      const ok0=careerMateSeat({handle:card.handle, cardRegion:card.region, patience:CAREER_PATIENCE_START, since:ccAddDays(careerToday(), -CC_CHEM_DAYS)});
      if(!ok0 || careerMates().length<careerMateSeats()) throw new Error('напарник не сел: '+JSON.stringify(careerMates().map(m=>m&&m.handle)));
      out.notes.mate=card.handle; careerSave(); }
    const ok=await careerRaceEnter({code:${JSON.stringify(CODE)}, role:${JSON.stringify(who.role_mp)}, since:careerToday()});
    out.notes.entered=ok; out.notes.link=MP.state;
    if(!ok){
      let why='';
      try{ await MP.connect(${JSON.stringify(CODE)}, ccMpId()); why='повторное подключение прошло'; }
      catch(e){ why='connect: '+String(e && (e.message||e.type||e)); }
      throw new Error('лобби не открылось: '+MP.state+' · '+why+' · errs '+JSON.stringify((window.__errs||[]).slice(0,2)));
    }
    for(let i=0;i<1200 && !(typeof ccRaceRivals==='function' && ccRaceRivals().length>=${N-1});i++) await wait(100);
    if(ccRaceRivals().length<${N-1}) throw new Error('строки гонки соперников не пришли: '+ccRaceRivals().length+' из '+${N-1});
    out.notes.rival=ccRaceRivals().map(p=>p.card.handle).join('+'); out.notes.apart=ccRaceApartWhy(careerNext());
    careerRenderHub('centre');
    out.notes.skipped=[]; const cp0=careerCanPlay; careerCanPlay=function(next){ const ok=cp0.apply(this, arguments); if(!ok && next && next.type && next.type!=='free' && CC_PLAYABLE.indexOf(next.type)>=0 && out.notes.skipped.length<60) out.notes.skipped.push([CAREER.career.day, next.type, 'live'+(ccMpLive()?1:0), 'link '+MP.state, 'noMate'+(careerNoMate(next.type)?1:0), 'mates'+careerMates().length, 'mode '+(ccRaceModeWhy()||'-'), 'div'+CAREER.career.division].join(' ')); return ok; };
    // Метки хода: каждый посланный акт, кроме пульса.
    const act0=MP.act; MP.act=function(k,p){ if(k!=='hb' && out.notes.marks.length<400) out.notes.marks.push(k+(p&&p.q!=null?'#'+p.q:'')+' d'+CAREER.career.day.slice(5)+' r'+CC_MP_ROLLS+' t'+Math.round((Date.now()-t0)/1000)); return act0.apply(MP, arguments); };
    const slow0=ccMpSlowSeen; ccMpSlowSeen=function(){ out.notes.marks.push('SLOW d'+CAREER.career.day.slice(5)+' r'+CC_MP_ROLLS+' t'+Math.round((Date.now()-t0)/1000)); return slow0.apply(this, arguments); };
    // Голос за перемотку до конца сезона; пойдёт, когда проголосуют все.
    careerRenderHub('calendar'); await wait(300);
    careerFfToDay(${JSON.stringify(FF)});
    out.notes.ffVoted=true;
    const tf=Date.now();
    while(Date.now()-tf<${BUDGET_MS} && (CAREER.career.day<${JSON.stringify(FF)} || CC_FF) && !CAREER.career.seasonOver){
      await wait(1000);
      if(out.notes.ffErr) { await wait(3000); break; }
    }
    const cr=CAREER.career;
    out.notes.table=(cr.log||[]).map(r=>[r.day, r.kind||'cup', r.stage||'', 'div'+r.div, '#'+r.place+'/'+r.of, r.pts+'pts', (r.wins||0)+'w', (r.elims||0)+'e'].join(' '));
    out.notes.kinds=(cr.log||[]).reduce((a,r)=>{ const k=r.kind||'cup'; a[k]=(a[k]||0)+1; return a; }, {});
    out.notes.rolls=CC_MP_ROLLS; out.notes.dayAfter=cr.day; out.notes.div=cr.division; out.notes.seasonOver=!!cr.seasonOver;
    out.notes.money=cr.earnings; out.notes.ovr=CAREER.player.ovr; out.notes.titles=(cr.ewc||[]).length;
    out.notes.mates=careerMates().map(m=>m&&m.handle); out.notes.noMate=(typeof careerNoMate==='function')?careerNoMate('eval'):null; out.notes.form=cr.form; out.notes.energy=cr.energy;
    out.notes.dbg={rand:!!CC_MP_RAND, state:MP.state, split:(typeof CC_MP_SPLIT_AT!=='undefined')?CC_MP_SPLIT_AT:null, race:(typeof CC_RACE_DBG!=='undefined')?CC_RACE_DBG:null, rivals:ccRaceRivals().map(p=>p.card.handle+':'+p.div+':'+p.day), ff:!!CC_FF};
    out.notes.secs=Math.round((Date.now()-t0)/1000);
    out.notes.wait=(typeof CC_MP_WAIT!=='undefined'&&CC_MP_WAIT)?CC_MP_WAIT.map(w=>w.t):null; out.notes.room=(typeof ccRaceRoom==='function')?ccRaceRoom().length:null; out.notes.peersDays=Object.keys(CC_RACE_PEERS).map(k=>(CC_RACE_PEERS[k].card||{}).handle+':'+CC_RACE_PEERS[k].day);
  }catch(e){ out.fail=String(e && e.message || e); }
  out.errs=(window.__errs||[]).slice(0,5);
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const WHO = [
  {nick:'Live1', age:17, ageEdge:4, country:'de', close:6, ovr:90, role:'roleIGL', role_mp:'a', money:48000, reach:20000, form:3, grind:12, mateIdx:0},
  {nick:'Live2', age:24, ageEdge:0, country:'br', close:1, ovr:86, role:'roleFRG', role_mp:'b', money:0,     reach:0,     form:0, grind:0,  mateIdx:1},
  {nick:'Live3', age:20, ageEdge:2, country:'fr', close:3, ovr:88, role:'roleFRG', role_mp:'b', money:5000,  reach:100,   form:1, grind:3,  mateIdx:2},
  {nick:'Live4', age:18, ageEdge:3, country:'gb', close:5, ovr:84, role:'roleIGL', role_mp:'b', money:1000,  reach:800,   form:2, grind:6,  mateIdx:3},
  {nick:'Live5', age:22, ageEdge:1, country:'it', close:2, ovr:92, role:'roleFRG', role_mp:'b', money:12000, reach:3000,  form:4, grind:9,  mateIdx:4},
  {nick:'Live6', age:19, ageEdge:3, country:'pl', close:4, ovr:82, role:'roleIGL', role_mp:'b', money:300,   reach:50,    form:1, grind:1,  mateIdx:5},
].slice(0, N);

function cdp(port){
  return new Promise((res, rej)=>{
    const tryGet=(n)=>{
      const req=http.get({host:'127.0.0.1', port, path:'/json'}, r=>{
        let b=''; r.on('data', d=>b+=d); r.on('end', ()=>{
          try{ const list=JSON.parse(b); const pg=list.find(x=>x.type==='page'); if(!pg) throw new Error('no page'); res(pg.webSocketDebuggerUrl); }
          catch(e){ if(n>40) rej(new Error('CDP не поднялся на '+port)); else setTimeout(()=>tryGet(n+1), 250); }
        });
      });
      req.on('error', ()=>{ if(n>40) rej(new Error('CDP не поднялся на '+port)); else setTimeout(()=>tryGet(n+1), 250); });
    };
    tryGet(0);
  });
}
function client(wsUrl){
  const ws=new WebSocket(wsUrl); let id=0; const pend=new Map();
  ws.onmessage=ev=>{ const m=JSON.parse(ev.data); if(m.id && pend.has(m.id)){ pend.get(m.id)(m); pend.delete(m.id); } };
  const send=(method, params)=>new Promise(r=>{ const i=++id; pend.set(i, r); ws.send(JSON.stringify({id:i, method, params:params||{}})); });
  return new Promise(r=>{ ws.onopen=()=>r({send, close:()=>ws.close()}); });
}
const started=Date.now();
const stamp=()=>Math.round((Date.now()-started)/1000)+'s';
async function runOne(tag, who, port){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(), 'mpsix-'+tag+'-'));
  const page=path.join(dir, 'index.html');
  fs.writeFileSync(page, HEAD + src + boot(who));
  const chrome=spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
    '--remote-debugging-port='+port, '--remote-allow-origins=*', '--user-data-dir='+path.join(dir, 'profile'),
    'about:blank'], {stdio:'ignore'});
  const ws=await cdp(port);
  const c=await client(ws);
  await c.send('Page.navigate', {url:'file:///' + page.split(SLASH).join('/')});
  const t0=Date.now(); let out=null, lastProg='', lastAt=0;
  while(Date.now()-t0 < BUDGET_MS + 120000){
    await new Promise(r=>setTimeout(r, 1000));
    const r=await c.send('Runtime.evaluate', {expression:"JSON.stringify([(document.getElementById('__out')||{}).textContent||'', (document.getElementById('__prog')||{}).textContent||''])", returnByValue:true});
    let txt='', prog='';
    try{ [txt, prog]=JSON.parse((r.result && r.result.result && r.result.result.value) || '["",""]'); }catch(e){}
    // Пульс в журнал: раз в минуту, если что-то поменялось.
    if(prog && prog!==lastProg && Date.now()-lastAt>60000){ console.log('  ['+stamp()+'] '+tag+' · '+prog); lastProg=prog; lastAt=Date.now(); }
    const m=txt.match(/PBEGIN([\s\S]*?)PEND/);
    if(m){ out=JSON.parse(decodeURIComponent(m[1])); break; }
  }
  c.close();
  try{ require('child_process').execSync('taskkill /PID '+chrome.pid+' /T /F', {stdio:'ignore'}); }catch(e){ chrome.kill(); }
  try{ fs.rmSync(dir, {recursive:true, force:true}); }catch(e){}
  if(!out) throw new Error(tag+': страница не ответила');
  return out;
}
(async ()=>{
  console.log('лобби '+CODE+' · игроков '+N+' · с '+DAY+' до '+FF+' · бюджет '+Math.round(BUDGET_MS/60000)+' мин');
  const P0=9400+Math.floor(Math.random()*400);
  const outs=await Promise.all(WHO.map((w,i)=>runOne(w.nick, w, P0+i)));
  let bad=0;
  outs.forEach((r,i)=>{
    const n=WHO[i].nick;
    console.log(n+': '+(r.fail ? 'FAIL '+r.fail : 'дошёл до '+r.notes.dayAfter)+' · див '+r.notes.div+' · сезон закрыт '+r.notes.seasonOver+
      ' · журнал '+((r.notes.table||[]).length)+' '+JSON.stringify(r.notes.kinds||{})+' · броски '+r.notes.rolls+' · $'+r.notes.money+' · ovr '+r.notes.ovr+' · титулов '+r.notes.titles+
      ' · напарники '+JSON.stringify(r.notes.mates)+' noMate '+r.notes.noMate+' · форма '+r.notes.form+' энергия '+r.notes.energy+' · '+Math.round((r.notes.secs||0)/60)+' мин · dbg '+JSON.stringify(r.notes.dbg));
    console.log('   напарник '+r.notes.mate+' · соперники '+r.notes.rival+' · врозь на старте: '+r.notes.apart);
    console.log('   вечера: '+(r.notes.nights||[]).join(' | '));
    if(r.notes.skipped && r.notes.skipped.length) console.log('   не сыграно: '+[...new Set(r.notes.skipped)].join(' | '));
    if(r.fail || (r.notes.dayAfter<FF && !r.notes.seasonOver)) console.log('   застрял: wait '+JSON.stringify(r.notes.wait)+' · комната '+r.notes.room+' · соперники '+JSON.stringify(r.notes.peersDays)+' · метки '+JSON.stringify((r.notes.marks||[]).slice(-12)));
    if(r.notes.ffErr){ console.log('   FAIL перемотка встала: '+JSON.stringify(r.notes.ffErr)); bad++; }
    if(r.notes.splits && r.notes.splits.length){ console.log('   FAIL красные строки: '+r.notes.splits.join(' || ')); bad++; }
    if(r.errs && r.errs.length){ console.log('   FAIL ошибки страницы: '+r.errs.join(' | ')); bad++; }
    if(r.fail) bad++;
    if(!r.fail && r.notes.dayAfter<FF && !r.notes.seasonOver){ console.log('   FAIL не дошёл до '+FF); bad++; }
    const slow=(r.notes.marks||[]).filter(m=>/^SLOW/.test(m));
    if(slow.length) console.log('   медленные барьеры: '+slow.join(' | '));
    if(process.env.CC_VERBOSE==='1'){ console.log('   журнал: '+(r.notes.table||[]).join(' ; ')); console.log('   метки: '+(r.notes.marks||[]).slice(-40).join(' | ')); }
  });
  // Общий вечер у всех, кто в одном дивизионе: журналы сравниваются по дням турниров.
  const days=outs.map(r=>new Set((r.notes.table||[]).map(t=>t.split(' ')[0])));
  const all=[...new Set(outs.flatMap(r=>(r.notes.table||[]).map(t=>t.split(' ')[0])))].sort();
  console.log('турнирных дней у всех вместе: '+all.length+' · у каждого: '+days.map(d=>d.size).join('/'));
  if(bad){ console.log('FAIL: '+bad); process.exit(1); }
  console.log('гонка на '+N+': все дошли до '+FF+' без красных строк и без встававшей перемотки');
})().catch(e=>{ console.error(e.message||e); process.exit(2); });
