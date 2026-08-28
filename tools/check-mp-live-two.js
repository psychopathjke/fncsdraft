// ДВА НАСТОЯЩИХ КЛИЕНТА в одном лобби через живой воркер.
//
// Все командные сторожа до 28 августа играли с ПОДСТАВНЫМ лобби: напарник
// отвечал мгновенно и одинаково, сети не было, времени не было. Здесь —
// два headless Chrome, у каждого своя карьера (игл и фраггер, разная личная
// жизнь), один код лобби, настоящий сервер (wss://fncsdraft-mp…), настоящее
// время. Первый жмёт «пропустить» рано, второй — поздно («по-плохому»).
// Сравниваются итоговые таблицы, и красных строк быть не должно.
//
// Управление браузерами — по CDP без puppeteer: у Node есть WebSocket.
//
//   node tools/check-mp-live-two.js            (Victory Cup, 2026-01-12)
//   CC_DAY=2026-02-02 node tools/check-mp-live-two.js   (кубок Д1: дроп каждую игру)
//   CC_SKIP_A=2000 CC_SKIP_B=25000  — когда жать пропуск (мс; 0 — не жать)
const fs = require('fs'), os = require('os'), path = require('path'), http = require('http'), crypto = require('crypto');
const { spawn } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const DAY = process.env.CC_DAY || '2026-01-12';
const CODE = ('T' + crypto.randomBytes(3).toString('hex').toUpperCase()).slice(0, 6);   // своё лобби на прогон: ровно шесть знаков, как требует воркер
const SKIP_A = Number(process.env.CC_SKIP_A != null ? process.env.CC_SKIP_A : 2000);
const SKIP_B = Number(process.env.CC_SKIP_B != null ? process.env.CC_SKIP_B : 25000);
const BUDGET_MS = Number(process.env.CC_BUDGET || 12 * 60000);
const CONTEST = process.env.CC_CONTEST === '1';   // жать ПОСЛЕДНИЙ вариант (контест, своп лута) вместо первого
const SLASH = String.fromCharCode(92);

const BASE = '<base href="file:///' + ROOT.split(SLASH).join('/') + '/">';
const HEAD = BASE + '<script>\n' +
  'window.__errs=[];\n' +
  "window.addEventListener('error', function(e){ window.__errs.push(String(e.message)+' @'+e.lineno); });\n" +
  '<' + '/script>';

const boot = (who) => `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={notes:{who:${JSON.stringify(who.nick)}}, errs:null, fail:null};
  const wait=ms=>new Promise(r=>setTimeout(r, ms));
  // Харнесс-человек: первая зона, первый выбор, метку не ставить.
  setInterval(function(){
    const am=document.getElementById("ccAskModal");
    if(am && am.style.display==="flex"){ const no=document.getElementById("ccAskNo");
      if(no && no.textContent===L().ccSpotGatePlay){ no.click(); return; } }
    const cbs=document.querySelectorAll(".cc-choice-btn"); if(cbs.length){ (${CONTEST ? "cbs[cbs.length-1]" : "cbs[0]"}).click(); return; }
    const p=document.querySelector(".landing-picker"); if(!p) return;
    const z=p.querySelectorAll(".land-zone"); if(!z.length) return;
    z[0].click();
    const c=p.querySelector("#gameLandingConfirm"); if(c && !c.disabled) c.click();
  }, 40);
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
    const ok=await ccMpEnter({code:${JSON.stringify(CODE)}, role:${JSON.stringify(who.role_mp)}});
    out.notes.entered=ok; out.notes.link=MP.state;
    if(!ok){
      // Диагностика: чем именно отказал транспорт.
      let why='';
      try{ await MP.connect(${JSON.stringify(CODE)}, ccMpId()); why='повторное подключение прошло'; }
      catch(e){ why='connect: '+String(e && (e.message||e.type||e)); }
      throw new Error('лобби не открылось: '+MP.state+' · '+why+' · errs '+JSON.stringify((window.__errs||[]).slice(0,2)));
    }
    // Ждём напарника: карточка приезжает по проводу.
    for(let i=0;i<600 && !MP.peer;i++) await wait(100);
    out.notes.peer=(MP.peer||{}).handle||null;
    if(!MP.peer) throw new Error('напарник не пришёл');
    careerRenderHub('centre');
    // Жмём «играть», пока вечер не начался (сервер ждёт двоих).
    let pressed=0;
    for(let i=0;i<900 && !CC_MP_RAND;i++){
      const play=document.querySelector('#screen-career-hub .ch-play');
      // Свой голос — один раз; «1/2» от напарника не повод молчать.
      if(play && !play.disabled && (play.getAttribute('onclick')||'').indexOf('careerPlay')>=0 && pressed===0){ play.click(); pressed++; await wait(1500); continue; }
      await wait(200);
    }
    out.notes.pressed=pressed; out.notes.started=!!CC_MP_RAND; out.notes.why=(typeof ccMpBlockWhy==='function')?ccMpBlockWhy():null;
    if(!CC_MP_RAND) throw new Error('вечер не начался: '+out.notes.why);
    out.notes.build=CC_BUILD;
    out.notes.team={seed:CAREER.career.seed, day:CAREER.career.day, div:CAREER.career.division, region:CAREER.career.region, spots:JSON.stringify(CAREER.career.spots||null), devKeys:Object.keys(CAREER.dev||{}).length, chemSince:CAREER.career.chemSince};
    out.notes.engine={zoneSim:typeof ZoneSim, zoneReplay:typeof ZoneReplay, squadSize:squadSize, zones:ALL_LANDING_ZONES.length, set:ACTIVE_LANDING_SET, sim:careerSimOn(), diff:JSON.stringify(CAREER.career.diff||null)};
    // Сколько раз своё лобби шло через карту, а сколько — одним куском.
    window.__own=0; window.__other=0;
    const pg0=playGameWithChoices; playGameWithChoices=function(){ window.__own++; return pg0.apply(this, arguments); };
    const sg0=simulateGame; simulateGame=function(){ window.__other++; return sg0.apply(this, arguments); };
    out.notes.youPow=(function(){ try{ return careerYouTeam([careerCard()].concat(careerMates())).pow; }catch(e){ return 'err '+e.message; } })();
    // Пропуск — в своё время.
    const skipAt=${who.skipAt};
    if(skipAt>0) setTimeout(function(){ const b=document.getElementById('majorSkipBtn'); if(b && !b.disabled){ b.click(); out.notes.skipPressed=true; } }, skipAt);
    // След хода вечера: где стоим, чего ждём, что последнее послали.
    out.notes.trace=[]; const sent=[];
    window.__acts=[]; const say0=MP.say; MP.say=function(m){ if(m && m.t==='act' && m.kind!=='hb') window.__acts.push((m.by||'?')+':'+m.kind+(m.payload&&m.payload.q!=null?'#'+m.payload.q:'')); return say0.apply(MP, arguments); };
    out.notes.marks=[];
    const slow0=ccMpSlowSeen; ccMpSlowSeen=function(){ out.notes.marks.push('SLOW r'+CC_MP_ROLLS+' t'+Math.round((Date.now()-t0)/1000)+' waits['+CC_MP_WAIT.map(w=>w.t).join(';')+']'); return slow0.apply(this, arguments); };
    const act0=MP.act; MP.act=function(k,p){ sent.push(k+(p&&p.q!=null?'#'+p.q:'')); if(sent.length>8) sent.shift();
      if(k!=='hb') out.notes.marks.push(k+(p&&p.q!=null?'#'+p.q:'')+' r'+CC_MP_ROLLS+' own'+window.__own+' oth'+window.__other+' skip'+(skipAnimation?1:0)+' t'+Math.round((Date.now()-t0)/1000));
      return act0.apply(MP, arguments); };
    // Сторож реплея (45 с) ставит локальный скип — это надо видеть.
    const prg0=playReplayGuarded; playReplayGuarded=function(){ const a=Date.now(); return prg0.apply(this, arguments).then(v=>{ out.notes.marks.push('replay '+Math.round((Date.now()-a)/1000)+'s cut'+(v?1:0)+' skip'+(skipAnimation?1:0)+' r'+CC_MP_ROLLS); return v; }); };
    setInterval(function(){
      const t=document.getElementById('finalsLiveTitle');
      out.notes.trace.push(Math.round((Date.now()-t0)/1000)+'s · '+(t?t.textContent.trim():'-')+' · wait['+CC_MP_WAIT.map(w=>w.t).join('; ')+'] · rolls '+CC_MP_ROLLS+' · link '+MP.state+' · skip '+skipAnimation+' · own '+window.__own+' other '+window.__other+' · split '+CC_MP_SPLIT_AT+' '+[...document.querySelectorAll('.cc-mp-split')].map(e=>e.textContent).join('|')+' · qn '+JSON.stringify(CC_MP_QN)+' · acts['+(MP.peek?[]:[]).length+']'+(function(){ try{ return JSON.stringify((window.__acts||[]).slice(-6)); }catch(e){ return '?'; } })()+' · sent '+sent.join(','));
      if(out.notes.trace.length>40) out.notes.trace.shift();
    }, 10000);
    let card=null;
    const t0=Date.now();
    while(Date.now()-t0<${BUDGET_MS} && !card){
      await wait(300);
      card=[...document.querySelectorAll('#majorStages .stage-card')].find(c=>c.querySelector('button[onclick*="careerBackToHub"]'));
    }
    if(!card) throw new Error('результат не пришёл за бюджет');
    out.notes.table=[...document.querySelectorAll('#majorStages .stage-card table.lobby-table tbody tr')]
      .filter(tr=>/^#/.test((tr.children[0]||{}).textContent||''))
      .map(tr=>[...tr.children].map(td=>td.textContent.trim()).join(' '));
    out.notes.head=[...document.querySelectorAll('#majorStages .stage-card h4')].map(h=>h.textContent.replace(/\\s+/g,' ').trim()).join(' | ');
    out.notes.split=[...document.querySelectorAll('.cc-mp-split')].map(e=>e.textContent);
    out.notes.rolls=CC_MP_ROLLS; out.notes.splitAt=CC_MP_SPLIT_AT; out.notes.dayAfter=CAREER.career.day; out.notes.own=window.__own; out.notes.other=window.__other;
    const log=(CAREER.career.log||[]); const last=log[log.length-1]||{};
    out.notes.mine={place:last.place, of:last.of, pts:last.pts, wins:last.wins, elims:last.elims};
  }catch(e){ out.fail=String(e && e.message || e); }
  out.errs=(window.__errs||[]).slice(0,3);
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;

const ccAddDaysNode=(iso, n)=>{ const d=new Date(iso+'T00:00:00Z'); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0,10); };
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const A = {nick:'LiveA', age:17, ageEdge:4, country:'de', close:6, ovr:90, role:'roleIGL', role_mp:'a', money:48000, reach:20000, form:3, grind:12, skipAt:SKIP_A};
const B = {nick:'LiveB', age:24, ageEdge:0, country:'br', close:1, ovr:86, role:'roleFRG', role_mp:'b', money:0,     reach:0,     form:0, grind:0,  skipAt:SKIP_B};

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
async function runOne(tag, who, port){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(), 'mplive-'+tag+'-'));
  const page=path.join(dir, 'index.html');
  fs.writeFileSync(page, HEAD + src + boot(who));
  const chrome=spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
    '--remote-debugging-port='+port, '--remote-allow-origins=*', '--user-data-dir='+path.join(dir, 'profile'),
    'about:blank'], {stdio:'ignore'});
  const ws=await cdp(port);
  const c=await client(ws);
  await c.send('Page.navigate', {url:'file:///' + page.split(SLASH).join('/')});
  const t0=Date.now(); let out=null;
  while(Date.now()-t0 < BUDGET_MS + 60000){
    await new Promise(r=>setTimeout(r, 1000));
    const r=await c.send('Runtime.evaluate', {expression:"(document.getElementById('__out')||{}).textContent||''", returnByValue:true});
    const txt=(r.result && r.result.result && r.result.result.value) || '';
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
  console.log('лобби '+CODE+' · день '+DAY+' · скип A '+SKIP_A+' мс, B '+SKIP_B+' мс · контест '+CONTEST);
  const P0=9400+Math.floor(Math.random()*400);
  const [a, b]=await Promise.all([runOne('A', A, P0), runOne('B', B, P0+1)]);
  // Своя строка у каждого подписана «я & напарник» — порядок косметический, ники сравниваем как множество.
  const norm=r=>String(r).replace(/(LiveA & LiveB|LiveB & LiveA)/g, 'LiveA+LiveB');
  const hash=t=>crypto.createHash('sha1').update((t||[]).map(norm).join('\n')).digest('hex').slice(0,12);
  for(const [n, r] of [['A', a], ['B', b]]){
    console.log(n+': '+(r.fail ? 'FAIL '+r.fail : (r.notes.head||'')) + ' · строк '+((r.notes.table||[]).length)+' · хеш '+hash(r.notes.table)+
      ' · своё '+JSON.stringify(r.notes.mine)+' · броски '+r.notes.rolls+' · pow '+r.notes.youPow+' · скип '+!!r.notes.skipPressed+' · own/other '+r.notes.own+'/'+r.notes.other+' · '+JSON.stringify(r.notes.engine)+' · team '+JSON.stringify(r.notes.team));
    if(r.notes.split && r.notes.split.length) console.log('   красная строка: '+r.notes.split.join(' || '));
    if(r.notes.marks) console.log('   метки: '+r.notes.marks.slice(0,14).join(' | '));
    if(r.fail && r.notes.trace) console.log('   след:' + String.fromCharCode(10) + '     ' + r.notes.trace.slice(-12).join(String.fromCharCode(10) + '     '));
    if(r.errs && r.errs.length) console.log('   ошибки страницы: '+r.errs.join(' | '));
    if(r.fail) console.log('   заметки: '+JSON.stringify({entered:r.notes.entered, link:r.notes.link, peer:r.notes.peer, pressed:r.notes.pressed, why:r.notes.why}));
  }
  let bad=0;
  if(a.fail || b.fail) bad++;
  if(hash(a.notes.table)!==hash(b.notes.table)){ const at=(a.notes.table||[]).findIndex((r,i)=>norm(r)!==norm((b.notes.table||[])[i])); console.log('FAIL таблицы разные, строка '+(at+1)+'\n  A: '+(a.notes.table||[])[at]+'\n  B: '+(b.notes.table||[])[at]); bad++; }
  if((a.notes.split||[]).length || (b.notes.split||[]).length){ console.log('FAIL есть красная строка'); bad++; }
  const want=ccAddDaysNode(DAY, 1);
  for(const [n, r] of [['A', a], ['B', b]]) if(r.notes.dayAfter!==want){ console.log('FAIL '+n+': день после вечера '+r.notes.dayAfter+', ждали '+want); bad++; }
  if(a.notes.rolls!==b.notes.rolls){ console.log('FAIL броски разные: '+a.notes.rolls+' / '+b.notes.rolls); bad++; }
  if(bad) process.exit(1);
  console.log('два живых клиента через настоящий воркер сыграли один и тот же вечер');
})().catch(e=>{ console.error(e.message||e); process.exit(2); });
