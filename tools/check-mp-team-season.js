// КОМАНДНАЯ КАРЬЕРА ВДВОЁМ НА ЦЕЛЫЕ СЕЗОНЫ — два живых клиента одной командой.
//
// Его слово 20.10: «сделай онлайн карьеру с настоящими игроками когда их два, потом 2 созданных
// с 5 дива до победы на глобалс». check-mp-live-two играет вечер-другой новичками первого
// дивизиона с сейвом, собранным руками; здесь карьера заводится тем же путём, что у игрока
// (ccPickCard / ccStart), команда входит в лобби (ccMpEnter), и оба голосуют за перемотку
// до конца года, закрывают сезон, начинают следующий — пока команда не выиграет Глобалс
// (журнал kind 'globals', place 1) или не кончатся сезоны.
// После каждого сезона у двоих сверяется: журнал вечеров, дивизион, доска призовых и Power
// Ranking года (без своих строк), красных строк «вечера разошлись» нет, перемотка не встала.
//
//   CC_MODE=card node tools/check-mp-team-season.js         (две настоящие карточки: верхняя пара EU)
//   CC_MODE=card CC_CARD_A=Peterbot CC_CARD_B=Pollo …        (свои карточки, регион карточки)
//   CC_MODE=rookie CC_DIV=5 CC_OVR=96 …                       (созданные, с 5-го дивизиона; CC_OVR — подъём рейтинга после создания, 0 — как дала полоса)
//   CC_SEASONS=3  — сколько сезонов максимум;  CC_YEAR=2026 — год карьеры;  CC_BUDGET — мс на всё
//   CC_HOST=ws://127.0.0.1:8787 — локальный воркер (server/: npx wrangler dev --port 8787 --local)
const fs = require('fs'), os = require('os'), path = require('path'), http = require('http'), crypto = require('crypto');
const { spawn } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const MODE = process.env.CC_MODE === 'rookie' ? 'rookie' : 'card';
const DIV = Number(process.env.CC_DIV || 5);
const OVR = Number(process.env.CC_OVR != null ? process.env.CC_OVR : (MODE === 'rookie' ? 96 : 0));
const SEASONS = Number(process.env.CC_SEASONS || (MODE === 'rookie' ? 3 : 1));
const YEAR = Number(process.env.CC_YEAR || 2026);
const BUDGET_MS = Number(process.env.CC_BUDGET || 8 * 3600000);
const STALL_MS = Number(process.env.CC_FF_STALL || 300000);
const CODE = ('T' + crypto.randomBytes(3).toString('hex').toUpperCase()).slice(0, 6);
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
  const out={notes:{who:${JSON.stringify(who.nick)}, seasons:[]}, errs:null, fail:null};
  const wait=ms=>new Promise(r=>setTimeout(r, ms));
  if(${JSON.stringify(process.env.CC_HOST||"")}) MP.host=${JSON.stringify(process.env.CC_HOST||"")};
  // Харнесс-человек: первая зона, первый выбор, метку не ставить, приглашения принимать.
  setInterval(function(){
    const am=document.getElementById("ccAskModal");
    if(am && am.style.display==="flex"){
      const yes=document.getElementById("ccAskYes");
      if(yes && yes.textContent===L().ccSpotGateSet){ careerSpotEnsure(); am.style.display="none"; careerPlay(); return; }
      if(yes && yes.textContent===L().ccMpThirdYes){ yes.click(); return; }
    }
    const cbs=document.querySelectorAll(".cc-choice-btn"); if(cbs.length){ cbs[0].click(); return; }
    const p=document.querySelector(".landing-picker"); if(!p) return;
    const z=p.querySelectorAll(".land-zone"); if(!z.length) return;
    z[0].click();
    const c=p.querySelector("#gameLandingConfirm"); if(c && !c.disabled) c.click();
  }, 40);
  const t0=Date.now();
  out.notes.splits=[]; out.notes.ffErr=null;
  setInterval(function(){
    try{
      const cr=CAREER && CAREER.career; if(!cr) return;
      if(CC_FF && CC_FF.err && !out.notes.ffErr) out.notes.ffErr=CC_FF.err;
      try{ const inv=(typeof careerProAmInv==='function') ? careerProAmInv() : null; if(inv && inv.state==='sent'){ const t=careerDms().find(x=>x.proam); if(t) careerProAmYes(t.id); } }catch(e){}
      [...document.querySelectorAll('.cc-mp-split')].map(e=>e.textContent).forEach(s=>{ const k=cr.day+' '+s; if(out.notes.splits.indexOf(k)<0 && out.notes.splits.length<20) out.notes.splits.push(k); });
      document.getElementById('__prog').textContent=['s'+cr.season, cr.day, 'див '+cr.division, 'журнал '+(cr.log||[]).length, 'ovr '+CAREER.player.ovr, 'связь '+MP.state, 'ff '+(CC_FF?'идёт':'-'), 'run '+(typeof CAREER_RUN!=='undefined'&&CAREER_RUN?1:0), 'peer '+((MP.peer||{}).handle||'-')].join(' · ');
    }catch(e){}
  }, 5000);
  try{
    /* СОЗДАНИЕ — как у игрока. Карточка: ccPickCard (страна, ник, дивизион по рейтингу карточки),
       новичок: свой ник, возраст, роль, дивизион. ccStart пишет сейв в слот и открывает хаб. */
    try{ localStorage.clear(); }catch(e){}
    CC.year=${YEAR}; CC.region='EU';
    let pick=null;
    if(${JSON.stringify(MODE)}==='card'){
      CC.mode='card';
      const want=${JSON.stringify(who.card||'')};
      let handle=want;
      if(!handle){
        // Верхняя записанная пара EU: у обоих клиентов тот же расчёт, A берёт первого, B второго.
        const duos=(careerPools().duos||[]).slice().sort((a,b)=>ccDuoOvr(b)-ccDuoOvr(a) || String(a.cards[0].handle).localeCompare(String(b.cards[0].handle)));
        const d=duos[0]; if(!d) throw new Error('нет пар в пуле');
        handle=d.cards[${who.idx}].handle;
      }
      ccPickCard(handle);
      if(!CC.card) throw new Error('карточка не нашлась: '+handle);
      pick=CC.card.handle;
    } else {
      CC.mode='rookie'; CC.card=null; CC.div=${DIV}; CC.country=${JSON.stringify(who.country)}; CC.role=${JSON.stringify(who.role)};
      document.getElementById('ccNick').value=${JSON.stringify(who.nick)};
    }
    document.getElementById('ccAge').value=String(${who.age});
    ccStart();
    if(!CAREER || !CAREER.career) throw new Error('карьера не создалась');
    if(${OVR}>0 && CAREER.player.source!=='card'){
      CAREER.player.ovr=${OVR}; CAREER.player.attrs=ccRookieAttrs(${OVR}, CAREER.player.role); careerSave();
    }
    out.notes.start={nick:CAREER.player.nick, source:CAREER.player.source, handle:CAREER.player.handle, div:CAREER.career.division, ovr:CAREER.player.ovr, day:CAREER.career.day, year:ccNowYear(), size:careerSquadSize(), org:(CAREER.org||{}).name||null};
    /* ВЕЧЕР ЗА ВЕЧЕРОМ: сколько кому лёг каждый ключ — своим счётом или копилкой напарника.
       Без ключа (мир играет вечер без команды, careerMoneyAdd вне CC_EV_DELTA) — «w|день». */
    window.__km={}; { const ma1=careerMoneyAdd; careerMoneyAdd=function(ranked, prize){
        const m=careerMoney(); const before={}; Object.keys(m.rows).forEach(h=>before[h]=m.rows[h].usd||0);
        const r=ma1.apply(this, arguments);
        try{ const k=(CC_EV_DELTA&&CC_EV_DELTA.key)||('w|'+CAREER.career.day); const o=window.__km[k]||(window.__km[k]={});
          Object.keys(m.rows).forEach(h=>{ const d=(m.rows[h].usd||0)-(before[h]||0); if(d) o[h]=(o[h]||0)+d; }); }catch(e){}
        return r; };
      /* Входы рейтинга вечера: место, поле, размер по календарю, дивизион, вид, этап — по ключу вечера. */
      /* ЛОББИ БЕЗ ЛЮДЕЙ В ОБЩЕМ ВЕЧЕРЕ: по ночи — бросок до/после и хеш входов первых шести, плюс хеши мира и
         глобалов на первом из них. Сверка называет первую ночь, где двое разошлись, и чем. */
      window.__oth={}; { const hh=x=>{ let t; try{ t=JSON.stringify(x, (k,v)=>(v instanceof Map)?[...v.entries()]:(v instanceof Set)?[...v]:v); }catch(e){ t='!'; } t=String(t).slice(0,300000); let v=0; for(let i=0;i<t.length;i++) v=(v*31+t.charCodeAt(i))|0; return (v>>>0).toString(16); };
        const sg1=simulateGame; simulateGame=function(teams){
          const on=(typeof CC_MP_RAND!=='undefined' && CC_MP_RAND) && CC_MP_GAME<=2 && !(teams||[]).some(t=>t && (t.isYou||t.isMate||t.isRival));
          const k=(CC_EV_DELTA&&CC_EV_DELTA.key)||('w|'+CAREER.career.day);
          let rec=null;
          if(on){ const a=window.__oth[k]||(window.__oth[k]={e:[], w:null});
            if(a.e.length<6){ rec={g:CC_MP_GAME, r0:CC_MP_ROLLS, h:hh((teams||[]).map(t=>[(t.squad||[]).map(c=>c&&c.handle).join('+'), t.pow, t.closeEdge||0, t.landingZone?ALL_LANDING_ZONES.indexOf(t.landingZone):-1, t.attrs?[t.attrs.END,t.attrs.SUR,t.attrs.AIM,t.attrs.CLU].join('.'):'-', t.stagePts||0]))}; a.e.push(rec); }
            if(!a.w){ const w={}; ['dev','devL','splits','duoStreak','lft'].forEach(x=>{ w['W.'+x]=hh(CAREER[x]); }); ['duoSplits','trios','chemSince','spots'].forEach(x=>{ w['C.'+x]=hh(CAREER.career[x]); });
              ['CC_SEATS_REMIX','CC_DROP_STAGE','CC_ZB','FORM_SPREAD','CC_EVENT_SIZE','ACTIVE_LANDING_SET','LANDING_TRIM_SIZE','squadSize','CARD_MODE','CC_SPOT_FEAR_MAP','CC_KILL_CAP'].forEach(x=>{ try{ w['L.'+x]=hh(eval(x)); }catch(e){} });
              w.seats=(typeof CC_DROP_SEATS!=='undefined' && CC_DROP_SEATS) ? CC_DROP_SEATS.size : 0; a.w=w; } }
          const r=sg1.apply(this, arguments);
          if(rec) rec.r1=CC_MP_ROLLS;
          return r; }; }
      window.__ke={}; { const ep0=ccEventPR; ccEventPR=function(o, trueOf){ const r=ep0.apply(this, arguments);
        try{ const k=(CC_EV_DELTA&&CC_EV_DELTA.key)||('w|'+CAREER.career.day); const a=window.__ke[k]||(window.__ke[k]=[]);
          if(a.length<400) a.push([o.place,o.of,trueOf,o.div,o.kind,o.stage||''].join(':')+'='+(r==null?'-':Math.round(r*100)/100)); }catch(e){}
        return r; }; }
      window.__kp={}; const pa1=careerPrAdd; careerPrAdd=function(ranked, meta){
        try{ const k0=(CC_EV_DELTA&&CC_EV_DELTA.key)||""; if(/SoloSeries_Final|FNCSSoloReload_Final/.test(k0)){ (window.__rk=window.__rk||{})[k0+"#"+(meta&&meta.stage||"")]=(ranked||[]).map((t,i)=>(i+1)+":"+((t.squad||[]).map(c=>c&&c.handle).join("+")||t.name)+":"+(t.stagePts||0)+":"+(t.wins||0)+":"+(t.stageElims||0)).join(" "); } }catch(e){}
        const t=careerPrTally(); const before={}; Object.keys(t.rows).forEach(h=>before[h]=(t.rows[h].v||[]).length+'/'+(t.rows[h].n||0));
        const r=pa1.apply(this, arguments);
        try{ const k=(CC_EV_DELTA&&CC_EV_DELTA.key)||('w|'+CAREER.career.day); const o=window.__kp[k]||(window.__kp[k]={});
          (ranked||[]).forEach(()=>{}); Object.keys(t.rows).forEach(h=>{ const now=(t.rows[h].v||[]).length+'/'+(t.rows[h].n||0); if(now!==before[h]){ const last=(t.rows[h].v||[]).map(x=>Math.round(x[0]*100)/100).sort((a,b)=>b-a).slice(0,3).join(';'); o[h]=(o[h]||0)+1; } }); }catch(e){}
        return r; };
      const ra1=ccEvResApply; ccEvResApply=function(d){ const ok=ra1.apply(this, arguments);
        try{ if(ok && d && d.key){ const o=window.__kp['R:'+d.key]||(window.__kp['R:'+d.key]={}); Object.keys(d.pr||{}).forEach(h=>{ o[h]=(o[h]||0)+(d.pr[h]||[]).length; }); } }catch(e){}
        try{ if(ok && d && d.key){ const o=window.__km['R:'+d.key]||(window.__km['R:'+d.key]={}); Object.keys(d.money||{}).forEach(h=>{ const v=Math.round(d.money[h]||0); if(v) o[h]=(o[h]||0)+v; }); } }catch(e){}
        return ok; }; }
    const ok=await ccMpEnter({code:${JSON.stringify(CODE)}, role:${JSON.stringify(who.role_mp)}});
    if(!ok) throw new Error('лобби не открылось: '+MP.state);
    for(let i=0;i<900 && !MP.peer;i++) await wait(100);
    if(!MP.peer) throw new Error('напарник не пришёл');
    out.notes.peer=MP.peer.handle;
    careerRenderHub('centre'); await wait(1500);

    const seasonSnap=function(){
      const cr=CAREER.career, s=cr.season;
      const strip=x=>String(x||'').replace(/<[^>]*>/g,'');
      return {season:s, day:cr.day, over:!!cr.seasonOver, div:cr.division, ovr:CAREER.player.ovr,
        table:(cr.log||[]).filter(r=>r && r.season===s && r.kind!=='nations' && r.kind!=='solo').map(r=>[r.day, r.kind||'cup', r.stage||'', r.place, r.of, r.pts, r.wins, r.elims].join(' ')),
        globals:cr.globals||null, won:(cr.log||[]).some(r=>r && r.kind==='globals' && r.place===1),
        money:careerMoneyRows('year').map(r=>(r.you?'~':'')+strip(r.name)+':'+r.events+':'+r.usd),
        pr:(typeof careerPrRows==='function') ? careerPrRows().slice(0,300).map(r=>(r.you?'~':'')+strip(r.name)+':'+r.pr+':'+r.events) : [],
        earnings:cr.earnings, mates:careerMates().map(m=>m&&m.handle),
        oth:(function(){ const o=window.__oth||{}; window.__oth={}; return o; })(),
        rk:(function(){ const o=window.__rk||{}; window.__rk={}; return o; })(),
        ke:(function(){ const o={}; Object.keys(window.__ke||{}).forEach(k=>{ o[k]=window.__ke[k].join(' '); }); window.__ke={}; return o; })(),
        kp:(function(){ const o={}; Object.keys(window.__kp||{}).forEach(k=>{ const v=window.__kp[k]; o[k]=Object.keys(v).sort().map(h=>h+'='+v[h]).join(','); }); window.__kp={}; return o; })(),
        prRaw:(function(){ try{ const t=careerPrTally(); const o={}; Object.keys(t.rows).slice(0,4000).forEach(h=>{ o[h]=(t.rows[h].v||[]).map(x=>Math.round(x[0]*1000)/1000+'@'+x[1]).join(';'); }); return o; }catch(e){ return {}; } })(),
        km:(function(){ const o={}; Object.keys(window.__km||{}).forEach(k=>{ const v=window.__km[k]; o[k]=Object.keys(v).sort().map(h=>h+'='+v[h]).join(','); }); window.__km={}; return o; })()};
    };
    for(let si=0; si<${SEASONS}; si++){
      const target=ccYearTo();
      careerRenderHub('calendar'); await wait(400);
      careerFfToDay(target);
      let lastDay=CAREER.career.day, lastMove=Date.now(), again=0;
      while(Date.now()-t0<${BUDGET_MS} && (CAREER.career.day<target || CC_FF) && !CAREER.career.seasonOver){
        await wait(500);
        if(out.notes.ffErr) break;
        if(!CC_FF && !(typeof CAREER_RUN!=='undefined' && CAREER_RUN) && CAREER.career.day<target){
          try{
            const nx=careerNext();
            // Некем играть (трио этапа, а людей двое) — владелец лобби зовёт третьего из писем, как в check-mp-live-two.
            if(nx && typeof ccFfNoMateWhy==='function' && ccFfNoMateWhy(nx)){
              if((CAREER.career.mp||{}).role==='a' && window.__thirdAsked!==CAREER.career.day){
                careerSeatTopUp();
                const roles=[ccRoleNow()].concat(careerMates().filter(Boolean).map(m=>attrsFor(m).roleKey));
                const t=careerDms().find(x=>x.state==='offer' && x.who && !x.who.org && !x.who.brand && (!x.who.role || ccSquadRoleFits(roles.concat([x.who.role]), careerSquadSize())));
                if(t){ window.__thirdAsked=CAREER.career.day; ccMpThirdAsk(t.id); }
              }
            } else if(Date.now()-again>8000){ again=Date.now(); careerFfToDay(target); }
          }catch(e){}
        }
        if(CAREER.career.day!==lastDay){ lastDay=CAREER.career.day; lastMove=Date.now(); }
        else if(Date.now()-lastMove>${STALL_MS}){
          let nx=null; try{ nx=careerNext(); }catch(e){}
          out.notes.stall={day:CAREER.career.day, ff:!!CC_FF, next:nx&&{type:nx.type, title:nx.title}, can:nx?careerCanPlay(nx):null,
            why:(typeof ccMpWhy==='function')?ccMpWhy():null, block:(typeof ccMpBlockWhy==='function')?ccMpBlockWhy():null, gate:!!MP.gate, alone:CC_MP_ALONE, rand:!!CC_MP_RAND,
            screen:[...document.querySelectorAll('.screen')].filter(e=>e.offsetParent!==null).map(e=>e.id).join(','), mates:careerMates().map(m=>m&&m.handle),
            log:(CAREER.career.log||[]).slice(-3).map(r=>[r.day,r.kind,r.stage||'',r.place,r.who||''].join(' ')), waiting:MP.waiting||null, ffPlayed:(CC_FF&&CC_FF.played||[]).slice(-4), ffUntil:CC_FF&&CC_FF.until, run:(typeof CAREER_RUN!=='undefined'&&CAREER_RUN)?1:0, natTeam:(CAREER.career.nat||{}).team||null};
          break;
        }
      }
      if(out.notes.stall || out.notes.ffErr) { out.notes.seasons.push(seasonSnap()); break; }
      // Конец года: «следующий день» за последним днём закрывает сезон (голос обоих).
      for(let i=0;Date.now()-t0<${BUDGET_MS} && !CAREER.career.seasonOver && i<2400;i++){ if(i%20===0){ try{ careerNextDay(); }catch(e){} } await wait(250); }
      // Дать дельтам последнего вечера доехать до снимка.
      await wait(8000);
      const snap=seasonSnap(); out.notes.seasons.push(snap);
      if(!CAREER.career.seasonOver){ out.notes.notClosed=CAREER.career.day; break; }
      if(snap.won || si===${SEASONS}-1) break;
      careerNewSeason();
      await wait(4000);
      careerSave(); careerRenderHub('calendar'); await wait(2000);
    }
    out.notes.mpState=MP.state;
  }catch(e){ out.fail=String(e && e.message || e); }
  out.notes.secs=Math.round((Date.now()-t0)/1000);
  out.errs=(window.__errs||[]).slice(0,5);
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const A = {nick:'LiveA', idx:0, card:process.env.CC_CARD_A||'', age:18, country:'de', role:'roleIGL', role_mp:'a'};
const B = {nick:'LiveB', idx:1, card:process.env.CC_CARD_B||'', age:20, country:'fr', role:'roleFRG', role_mp:'b'};

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
const stamp=()=>Math.round((Date.now()-started)/60000)+'m';
async function runOne(who, port){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(), 'mpteam-'+who.nick+'-'));
  const page=path.join(dir, 'index.html');
  fs.writeFileSync(page, HEAD + src + boot(who));
  const chrome=spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
    '--remote-debugging-port='+port, '--remote-allow-origins=*', '--user-data-dir='+path.join(dir, 'profile'), '--window-size=1440,900', 'about:blank'], {stdio:'ignore'});
  const c=await client(await cdp(port));
  await c.send('Page.navigate', {url:'file:///' + page.split(SLASH).join('/')});
  const t0=Date.now(); let out=null, lastProg='', lastAt=0;
  while(Date.now()-t0 < BUDGET_MS + 300000){
    await new Promise(r=>setTimeout(r, 2000));
    const r=await c.send('Runtime.evaluate', {expression:"JSON.stringify([(document.getElementById('__out')||{}).textContent||'', (document.getElementById('__prog')||{}).textContent||''])", returnByValue:true});
    let txt='', prog='';
    try{ [txt, prog]=JSON.parse((r.result && r.result.result && r.result.result.value) || '["",""]'); }catch(e){}
    if(prog && prog!==lastProg && Date.now()-lastAt>120000){ console.log('  ['+stamp()+'] '+who.nick+' · '+prog); lastProg=prog; lastAt=Date.now(); }
    const m=txt.match(/PBEGIN([\w%\-.!~*'()]*)PEND/);
    if(m){ out=JSON.parse(decodeURIComponent(m[1])); break; }
  }
  c.close();
  try{ require('child_process').execSync('taskkill /PID '+chrome.pid+' /T /F', {stdio:'ignore'}); }catch(e){ chrome.kill(); }
  try{ fs.rmSync(dir, {recursive:true, force:true}); }catch(e){}
  if(!out) throw new Error(who.nick+': страница не ответила');
  return out;
}
(async ()=>{
  console.log('лобби '+CODE+' · '+MODE+(MODE==='rookie'?' див '+DIV+(OVR?' ovr '+OVR:''):'')+' · год '+YEAR+' · сезонов до '+SEASONS+' · бюджет '+Math.round(BUDGET_MS/60000)+' мин');
  const P0=9800+Math.floor(Math.random()*150);
  const outs=await Promise.all([runOne(A, P0), new Promise(r=>setTimeout(r, 4000)).then(()=>runOne(B, P0+1))]);
  if(process.env.CC_DUMP) try{ fs.writeFileSync(process.env.CC_DUMP, JSON.stringify(outs)); }catch(e){}
  let bad=0;
  outs.forEach((r,i)=>{
    const n=[A,B][i].nick;
    console.log(n+': '+(r.fail ? 'FAIL '+r.fail : 'ок')+' · старт '+JSON.stringify(r.notes.start)+' · напарник '+r.notes.peer+' · '+Math.round((r.notes.secs||0)/60)+' мин');
    (r.notes.seasons||[]).forEach(s=>console.log('   сезон '+s.season+': до '+s.day+(s.over?' (закрыт)':'')+' · див '+s.div+' · ovr '+s.ovr+' · вечеров '+s.table.length+' · $'+s.earnings+' · глобалс '+JSON.stringify(s.globals)+(s.won?' · ПОБЕДА':'')+' · состав '+JSON.stringify(s.mates)));
    if(r.notes.stall){ console.log('   FAIL перемотка встала: '+JSON.stringify(r.notes.stall)); bad++; }
    if(r.notes.ffErr){ console.log('   FAIL перемотка: '+JSON.stringify(r.notes.ffErr)); bad++; }
    if(r.notes.notClosed){ console.log('   FAIL сезон не закрылся: '+r.notes.notClosed); bad++; }
    if(r.notes.splits && r.notes.splits.length){ console.log('   FAIL красные строки: '+r.notes.splits.slice(0,4).join(' || ')); bad++; }
    if(r.errs && r.errs.length){ console.log('   FAIL ошибки страницы: '+r.errs.join(' | ')); bad++; }
    if(r.fail) bad++;
  });
  // Сверка по сезонам: журнал, дивизион, доски без своих строк («~» — своя, у каждого своя).
  const sa=outs[0].notes.seasons||[], sb=outs[1].notes.seasons||[];
  if(sa.length!==sb.length){ console.log('FAIL сезонов разное число: '+sa.length+' vs '+sb.length); bad++; }
  for(let i=0;i<Math.min(sa.length, sb.length);i++){
    const a=sa[i], b=sb[i];
    const diffList=(x, y)=>{ const X=new Set(x), Y=new Set(y); return {onlyA:x.filter(v=>!Y.has(v)), onlyB:y.filter(v=>!X.has(v))}; };
    const t=diffList(a.table, b.table);
    if(t.onlyA.length || t.onlyB.length){ console.log('   FAIL сезон '+a.season+': журналы разные · только у A: '+t.onlyA.slice(0,5).join(' | ')+' · только у B: '+t.onlyB.slice(0,5).join(' | ')); bad++; }
    if(a.div!==b.div){ console.log('   FAIL сезон '+a.season+': дивизион '+a.div+' vs '+b.div); bad++; }
    if(a.won!==b.won){ console.log('   FAIL сезон '+a.season+': победа на Глобалс у одного'); bad++; }
    const rows=x=>x.map(v=>v[0]==='~' ? v.slice(1) : v);   // своя строка у одного — обычная у другого: сравниваются все
    const m=diffList(rows(a.money), rows(b.money));
    console.log('   сезон '+a.season+': доска призовых '+a.money.length+'/'+b.money.length+' строк, разных '+(m.onlyA.length+m.onlyB.length));
    if(m.onlyA.length || m.onlyB.length){ console.log('   FAIL доски призовых: только у A '+m.onlyA.slice(0,6).join(' | ')+' · только у B '+m.onlyB.slice(0,6).join(' | ')); bad++; }
    /* Какие ключи вечеров легли у двоих по-разному. Свой одиночный вечер у одного — «ключ|s<ник>»,
       у другого он же приходит копилкой «R:ключ|s<ник>»: сравниваются как одно. */
    { /* Свой одиночный вечер пишется под голым ключом, к напарнику он уезжает с ником («|s<ник>»):
         варианты одного ключа складываются по игроку, и сравнивается сумма. */
      const norm=km=>{ const o={}; Object.keys(km||{}).forEach(k=>{ const base=k.replace(/^R:/, '').replace(/\|s[^|]*$/, '');
          const m=o[base]||(o[base]={}); String(km[k]||'').split(',').filter(Boolean).forEach(x=>{ const i=x.lastIndexOf('='); const h=x.slice(0,i); m[h]=(m[h]||0)+Number(x.slice(i+1)); }); });
        const out={}; Object.keys(o).forEach(k=>{ out[k]=Object.keys(o[k]).sort().filter(h=>o[k][h]).map(h=>h+'='+o[k][h]).join(','); }); return out; };
      const ka=norm(a.km), kb=norm(b.km); const keys=[...new Set([...Object.keys(ka), ...Object.keys(kb)])].sort();
      let nb=0; keys.forEach(k=>{ if((ka[k]||'')===(kb[k]||'')) return; nb++;   // пустой ключ — что его нет
        if(nb<=12){ const pa=new Map((ka[k]||'').split(',').filter(Boolean).map(x=>x.split('='))), pb=new Map((kb[k]||'').split(',').filter(Boolean).map(x=>x.split('=')));
          const hs=[...new Set([...pa.keys(), ...pb.keys()])].filter(h=>pa.get(h)!==pb.get(h)).slice(0,5);
          console.log('   ключ '+k+' ['+(ka[k]!=null?'A':'-')+(kb[k]!=null?'B':'-')+'] '+hs.map(h=>h+' '+(pa.get(h)||0)+'/'+(pb.get(h)||0)).join(' | ')); } });
      console.log('   сезон '+a.season+': ключей вечеров '+keys.length+', разных '+nb); }
    { const ra=a.prRaw||{}, rb=b.prRaw||{}; const hs=[...new Set([...Object.keys(ra), ...Object.keys(rb)])].filter(h=>ra[h]!==rb[h]);
      console.log('   сезон '+a.season+': строк PR с разными вечерами '+hs.length);
      hs.slice(0,4).forEach(h=>{ const A=(ra[h]||'').split(';'), B=(rb[h]||'').split(';'); const onlyA=A.filter(x=>B.indexOf(x)<0), onlyB=B.filter(x=>A.indexOf(x)<0);
        console.log('     '+h+': только у A '+onlyA.slice(0,4).join(' ')+' · только у B '+onlyB.slice(0,4).join(' ')); }); }
    { const ka=a.ke||{}, kb=b.ke||{}; const ks=[...new Set([...Object.keys(ka), ...Object.keys(kb)])].sort().filter(k=>(ka[k]||'')!==(kb[k]||''));
      console.log('   сезон '+a.season+': ключей с разными входами PR '+ks.length);
      ks.slice(0,6).forEach(k=>{ const A=(ka[k]||'').split(' '), B=(kb[k]||'').split(' '); let i=0; while(i<A.length && i<B.length && A[i]===B[i]) i++;
        console.log('     '+k+' [A '+A.length+' / B '+B.length+'] первое разное #'+i+': '+(A[i]||'—')+'  ⇄  '+(B[i]||'—')); }); }
    { const oa=a.oth||{}, ob=b.oth||{}; const ks=Object.keys(oa).filter(k=>ob[k]).sort();
      const bad=ks.find(k=>JSON.stringify(oa[k].e)!==JSON.stringify(ob[k].e));
      console.log('   сезон '+a.season+': общих вечеров с чужими лобби '+ks.length+(bad ? ', первый разный '+bad : ', все одинаковы'));
      if(bad){ const A=oa[bad], B=ob[bad]; A.e.forEach((x,i)=>{ const y=B.e[i]||{}; if(JSON.stringify(x)!==JSON.stringify(y)) console.log('     #'+i+' '+JSON.stringify(x)+'  ⇄  '+JSON.stringify(y)); });
        const wk=[...new Set([...Object.keys(A.w||{}), ...Object.keys(B.w||{})])].filter(x=>(A.w||{})[x]!==(B.w||{})[x]); console.log('     разные хеши: '+wk.join(' ')); } }
    const p=diffList(rows(a.pr), rows(b.pr));
    if(p.onlyA.length || p.onlyB.length){ console.log('   FAIL Power Ranking: только у A '+p.onlyA.slice(0,6).join(' | ')+' · только у B '+p.onlyB.slice(0,6).join(' | ')); bad++; }
  }
  const won=sa.some(s=>s.won);
  console.log(won ? 'ГЛОБАЛС ВЫИГРАН: '+sa.filter(s=>s.won).map(s=>'сезон '+s.season+' '+JSON.stringify(s.globals)).join(', ') : 'Глобалс не выигран за '+sa.length+' сезон(а)');
  if(bad){ console.log('FAIL: '+bad); process.exit(1); }
  console.log('команда вдвоём: сезоны прошли, журналы и доски у обоих одинаковы');
})().catch(e=>{ console.error(e.message||e); process.exit(2); });
