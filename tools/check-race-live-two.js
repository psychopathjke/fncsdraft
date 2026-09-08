// Гонка в одной комнате: два живых клиента через настоящий воркер, у каждого своя
// карьера и свой бот-напарник, дивизион один, вечер один — таблицы обязаны совпасть,
// и в обеих стоят обе команды людей. Собран из check-mp-live-two.js (scratchpad
// make-race-harness.js), отличия помечены «ГОНКА».
//
//   node tools/check-race-live-two.js            (кубок Д1, 2026-02-02)
//   CC_DAY=2026-01-12 node tools/check-race-live-two.js   (Victory Cup)
const fs = require('fs'), os = require('os'), path = require('path'), http = require('http'), crypto = require('crypto');
const { spawn } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const DAY = process.env.CC_DAY || '2026-02-02';
const CODE = ('T' + crypto.randomBytes(3).toString('hex').toUpperCase()).slice(0, 6);   // своё лобби на прогон: ровно шесть знаков, как требует воркер
const SKIP_A = Number(process.env.CC_SKIP_A != null ? process.env.CC_SKIP_A : 2000);
const SKIP_B = Number(process.env.CC_SKIP_B != null ? process.env.CC_SKIP_B : 25000);
const BUDGET_MS = Number(process.env.CC_BUDGET || 12 * 60000);
// CC_JOIN_TEAM=1 — B входит КОМАНДНОЙ дверью (careerMpJoin, как «войти по коду» на
// главной) и обязан сам понять, что попал в гонку (ccMpKindCheck). Его отчёт 8.09.
const JOIN_TEAM = process.env.CC_JOIN_TEAM === '1';
const CONTEST = process.env.CC_CONTEST === '1';   // жать ПОСЛЕДНИЙ вариант (контест, своп лута) вместо первого
const SOLO = process.env.CC_SOLO || '';
const HIDE_A = Number(process.env.CC_HIDE_A || 0), HIDE_B = Number(process.env.CC_HIDE_B || 0);   // через сколько мс вкладка «уходит в фон» (0 — не уходит)
const RELOAD = process.env.CC_RELOAD === '1';
const NIGHTS = Number(process.env.CC_NIGHTS || 1);
const FF = process.env.CC_FF || '';
const RELOAD_A = Number(process.env.CC_RELOAD_A || 0), RELOAD_B = Number(process.env.CC_RELOAD_B || 0);   // через сколько мс вкладка перезагружается посреди вечера                 // перемотка на двоих до этой даты вместо вечера
const CAREER_PATCH = process.env.CC_CAREER ? JSON.parse(process.env.CC_CAREER) : null;   // JSON, вливается в career обоих сейвов (билеты, этапы)   // сколько вечеров подряд сыграть (кубок дивизиона: 2 сессии)    // Reload: предыдущий этап серии уже пройден, чтобы день открылся
const SLASH = String.fromCharCode(92);

const BASE = '<base href="file:///' + ROOT.split(SLASH).join('/') + '/">';
const HEAD = BASE + '<script>\n' +
  'window.__errs=[];\n' +
  "window.addEventListener('error', function(e){ window.__errs.push(String(e.message)+' @'+e.lineno); }); window.addEventListener('unhandledrejection', function(e){ var r=e.reason; window.__errs.push('rejection: '+String(r && (r.stack||r.message) || r).slice(0,300)); });\n" +
  '<' + '/script>';

const boot = (who) => `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={notes:{who:${JSON.stringify(who.nick)}}, errs:null, fail:null};
  const wait=ms=>new Promise(r=>setTimeout(r, ms));
  window.__f1=null; if(typeof ccMpFieldList==='function'){ const f0=ccMpFieldList; ccMpFieldList=function(teams){ if(!window.__f1) window.__f1=teams.slice(); return f0(teams); }; }
  window.__teams=0; if(typeof MP!=='undefined' && MP.say){ const s0=MP.say; MP.say=function(m){ if(m && m.t==='team') window.__teams++; return s0.apply(this, arguments); }; }
  // Пропуск включился у ОБОИХ от голосов (его слово 8.09: «скип не работает» в гонке).
  window.__skipBoth=0; if(typeof ccMpSkipApply==='function'){ const k0=ccMpSkipApply; ccMpSkipApply=function(){ const r=k0.apply(this, arguments); if(typeof ccMpSkipBoth==='function' && ccMpSkipBoth()) window.__skipBoth=1; return r; }; }
  // Первая сверка игры — целиком: по ней видно, ЧТО разошлось (таблица, броски, поле, леджер).
  window.__g1=null; if(typeof ccMpSync==='function'){ const y0=ccMpSync; ccMpSync=function(k,p,q){ if(k==='game' && !window.__g1) window.__g1=String(p); return y0.apply(this, arguments); }; }
  // CC_HOST=ws://127.0.0.1:8787 — гонять против локального wrangler dev, а не прода.
  if(${JSON.stringify(process.env.CC_HOST||"")}) MP.host=${JSON.stringify(process.env.CC_HOST||"")};
  // Харнесс-человек: первая зона, первый выбор, метку не ставить.
  setInterval(function(){
    const am=document.getElementById("ccAskModal");
    if(am && am.style.display==="flex"){ const no=document.getElementById("ccAskNo");
      if(document.getElementById("ccAskYes") && document.getElementById("ccAskYes").textContent===L().ccSpotGateSet){ careerSpotEnsure(); document.getElementById("ccAskModal").style.display="none"; careerPlay(); return; } }
    const cbs=document.querySelectorAll(".cc-choice-btn"); if(cbs.length){ (${CONTEST ? "cbs[cbs.length-1]" : "cbs[0]"}).click(); return; }
    const p=document.querySelector(".landing-picker"); if(!p) return;
    const z=p.querySelectorAll(".land-zone"); if(!z.length) return;
    z[0].click();
    const c=p.querySelector("#gameLandingConfirm"); if(c && !c.disabled) c.click();
  }, 40);
  try{
    // После перезагрузки посреди вечера: сейв уже на месте, лобби в нём, вечер догоняется сам (ccMpResume).
    if(sessionStorage.getItem('cc_reloaded')){
      out.notes.reloaded=true;
      careerEntry();
      const t0=Date.now();
      let card=null;
      while(Date.now()-t0<${BUDGET_MS} && !card){
        await wait(300);
        card=[...document.querySelectorAll('#majorStages .stage-card')].find(c=>c.querySelector('button[onclick*="careerBackToHub"]'));
      }
      if(!card) throw new Error('после перезагрузки результат не пришёл за бюджет · день '+CAREER.career.day+' · rand '+!!CC_MP_RAND+' · replay '+CC_MP_REPLAY);
      out.notes.table=[...document.querySelectorAll('#majorStages .stage-card table.lobby-table tbody tr')]
        .filter(tr=>/^#/.test((tr.children[0]||{}).textContent||''))
        .map(tr=>[...tr.children].map(td=>td.textContent.trim()).join(' '));
      out.notes.head=[...document.querySelectorAll('#majorStages .stage-card h4')].map(h=>h.textContent.replace(/\\s+/g,' ').trim()).join(' | ');
      out.notes.split=[...document.querySelectorAll('.cc-mp-split')].map(e=>e.textContent);
      if(${process.env.CC_TABLES_DIFFER==='1'}){ for(let i=0;i<300 && CAREER.career.day===${JSON.stringify(DAY)};i++) await wait(300); }   // личный вечер: день шагает, когда отыграет и второй
      out.notes.rolls=CC_MP_ROLLS; out.notes.dayAfter=CAREER.career.day; out.notes.dbg={rand:!!CC_MP_RAND, hold:CC_MP_HOLD, alone:CC_MP_ALONE, state:MP.state, teams:window.__teams||0, soloBy:CAREER.career.soloBy, peer:(MP.peer||{}).handle, settle:(typeof ccSoloTeamSettle==='function')?ccSoloTeamSettle():null, dayNow:CAREER.career.day};
      const log=(CAREER.career.log||[]); const last=log[log.length-1]||{};
      out.notes.mine={place:last.place, of:last.of, pts:last.pts, wins:last.wins, elims:last.elims};
      out.notes.g1=window.__g1||null; out.notes.skipBoth=window.__skipBoth||0;
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
      return;
    }
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:${JSON.stringify(who.nick)}, age:${who.age}, source:'rookie', country:${JSON.stringify(who.country)}, countryPing:15,
        closeRangeEdge:${who.close}, region:'EU', ovr:${who.ovr}, role:${JSON.stringify(who.role)}, attrs:null, ageEdge:${who.ageEdge},
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:${JSON.stringify(DAY)}, division:1, earnings:${who.money}, balance:${who.money}, reach:${who.reach},
              tokens:[], log:[], news:[], form:${who.form}, grind:${who.grind},
              soloBy:${JSON.stringify(SOLO ? {livea:{got:SOLO, pass:SOLO}, liveb:{got:SOLO, pass:SOLO}} : undefined)||'undefined'}},
      partners:[]}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career'));
    Object.assign(s.career, ${JSON.stringify(CAREER_PATCH)}||{});
    s.player.attrs=ccRookieAttrs(${who.ovr}, ${JSON.stringify(who.role)});
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerEntry();
    if(${RELOAD}){ for(let k=0;k<8;k++){ const ev=careerReloadOn(ccAddDays(careerToday(), k)); if(ev){ CAREER.career.reload={series:ev.series, got:CC_RELOAD_ORDER[CC_RELOAD_ORDER.indexOf(ev.stage)-1]}; careerSave(); break; } } }
    // ГОНКА: свой бот-напарник — из ростера сцены, у A и B разные (одинаковых брать нельзя).
    { const pool=ccSceneRoster(ccCareerRegion()).filter(c=>hKey(c)!==hKey(careerCard())); const card=pool[${who.mateIdx}];
      if(!card) throw new Error('нет карточки напарника в ростере');
      const ok0=careerMateSeat({handle:card.handle, cardRegion:card.region, patience:CAREER_PATIENCE_START, since:ccAddDays(careerToday(), -CC_CHEM_DAYS)});
      if(!ok0 || careerMates().length<careerMateSeats()) throw new Error('напарник не сел: '+JSON.stringify(careerMates().map(m=>m&&m.handle)));
      out.notes.mate=card.handle; careerSave(); }
    const asTeam=${JOIN_TEAM} && ${JSON.stringify(who.role_mp)}==='b';
    const ok=asTeam ? await careerMpJoin(${JSON.stringify(CODE)})
                    : await careerRaceEnter({code:${JSON.stringify(CODE)}, role:${JSON.stringify(who.role_mp)}, since:careerToday()});
    out.notes.entered=ok; out.notes.link=MP.state;
    if(asTeam){
      // Комната гонки должна сама переключить вошедшего командной дверью.
      for(let i=0;i<300 && !ccRaceOn();i++) await wait(100);
      out.notes.kind=ccRaceOn() ? 'race' : (ccMpTeam() ? 'team' : 'none');
      if(!ccRaceOn()) throw new Error('вошёл командной дверью в гонку и остался командой: mp='+JSON.stringify(CAREER.career.mp||null));
      if(CAREER.career.mp) throw new Error('после переключения в гонку осталась запись команды');
    }
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
    if(!MP.peer) throw new Error('соперник не пришёл');
    for(let i=0;i<600 && !(typeof ccRaceRival==='function' && ccRaceRival());i++) await wait(100);
    if(!ccRaceRival()) throw new Error('строка гонки соперника не пришла');
    out.notes.rival=(ccRaceRival().card||{}).handle; out.notes.rivalMates=(ccRaceRival().mates||[]).map(m=>m.handle); out.notes.apart=ccRaceApartWhy(careerNext());
    // Состояние ПЕРЕД вечером — по нему читается, кем клиент себя считает и кого видит.
    out.notes.pre={race:ccRaceOn(), team:ccMpTeam(), on:ccMpOn(), apart:ccRaceApartWhy(careerNext()),
      peers:Object.keys(CC_RACE_PEERS).map(k=>{ const p=CC_RACE_PEERS[k]; return k+':'+((p.card||{}).handle||'-')+'/d'+p.div+'/'+p.day+'/pow'+p.pow; }),
      mp:CAREER.career.mp||null, seed:CAREER.career.seed, lobbySeed:CAREER.career.lobbySeed||null,
      div:CAREER.career.division, day:CAREER.career.day, mates:careerMates().map(m=>m&&m.handle), peer:(MP.peer||{}).handle||null};
    careerRenderHub('centre');
    // Жмём «играть», пока вечер не начался (сервер ждёт двоих).
    // Возвращает 'play' (вечер начался) или 'next' (день без вечера сдвинут голосом «следующий день»).
    const pressPlay=async function(){
      let pressed=0, voted=0; const day0=CAREER.career.day;
      for(let i=0;i<900;i++){
        if(CC_MP_RAND) return 'play';
        // Личный вечер в команде (соло): сида от сервера нет, но вечер идёт — экран результатов открыт.
        if(pressed && typeof CAREER_RUN!=='undefined' && CAREER_RUN) return 'play';
        if(voted && CAREER.career.day!==day0) return 'next';
        const play=document.querySelector('#screen-career-hub .ch-play');
        const oc=(play && play.getAttribute('onclick'))||'';
        // Свой голос — один раз; «1/2» от напарника не повод молчать.
        if(play && !play.disabled && oc.indexOf('careerPlay')>=0 && pressed===0){ play.click(); pressed++; await wait(1500); continue; }
        if(play && !play.disabled && oc.indexOf('careerNextDay')>=0 && pressed===0 && voted===0){ play.click(); voted++; await wait(1500); continue; }
        // Пустой день: дневное событие — «пропустить», занятие — первое доступное; тогда появится «следующий день».
        if(!play || play.disabled){
          const ev=[...document.querySelectorAll('#screen-career-hub button')].find(b=>(b.getAttribute('onclick')||'').indexOf('careerDayEvent(')>=0 && (b.getAttribute('onclick')||'').indexOf('false')>=0);
          if(ev){ ev.click(); await wait(600); continue; }
          const act=[...document.querySelectorAll('#screen-career-hub button')].find(b=>!b.disabled && (b.getAttribute('onclick')||'').indexOf('careerPickDay(')>=0);
          if(act){ act.click(); await wait(600); continue; }
        }
        await wait(200);
      }
      out.notes.pressed=pressed; out.notes.voted=voted; out.notes.why=(typeof ccMpBlockWhy==='function')?ccMpBlockWhy():null;
      const shown=[...document.querySelectorAll('.screen')].filter(e=>e.offsetParent!==null).map(e=>e.id).join(',');
      const btns=[...document.querySelectorAll('#screen-career-hub button')].filter(b=>b.offsetParent!==null).map(b=>b.textContent.trim().slice(0,30)).join(' | ');
      throw new Error('вечер не начался: '+out.notes.why+' · день '+CAREER.career.day+' · экран '+shown+' · кнопки '+btns);
    };
    if(${JSON.stringify(FF)}){
      // Перемотка на двоих: оба голосуют за дату, ждём, пока календарь дойдёт; сравнивается журнал.
      careerRenderHub('calendar'); await wait(300);
      careerFfToDay(${JSON.stringify(FF)});
      out.notes.ffVoted=true;
      const tf=Date.now();
      while(Date.now()-tf<${BUDGET_MS} && (CAREER.career.day<${JSON.stringify(FF)} || CC_FF)) await wait(500);
      out.notes.table=(CAREER.career.log||[]).map(r=>[r.day, r.kind||'cup', r.stage||'', r.place, r.of, r.pts, r.wins, r.elims].join(' '));
      out.notes.split=[...document.querySelectorAll('.cc-mp-split')].map(e=>e.textContent);
      if(${process.env.CC_TABLES_DIFFER==='1'}){ for(let i=0;i<300 && CAREER.career.day===${JSON.stringify(DAY)};i++) await wait(300); }   // личный вечер: день шагает, когда отыграет и второй
      out.notes.rolls=CC_MP_ROLLS; out.notes.dayAfter=CAREER.career.day; out.notes.dbg={rand:!!CC_MP_RAND, hold:CC_MP_HOLD, alone:CC_MP_ALONE, state:MP.state, teams:window.__teams||0, soloBy:CAREER.career.soloBy, peer:(MP.peer||{}).handle, settle:(typeof ccSoloTeamSettle==='function')?ccSoloTeamSettle():null, dayNow:CAREER.career.day}; out.notes.head='перемотка до '+${JSON.stringify(FF)}+' · строк журнала '+out.notes.table.length;
      out.notes.mine=(CAREER.career.log||[]).slice(-1)[0]||{};
      out.notes.g1=window.__g1||null; out.notes.skipBoth=window.__skipBoth||0;
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
      return;
    }
    const how0=await pressPlay();
    if(how0!=='play') throw new Error('первый день без вечера: '+how0);
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
    // Уход в фон: как Chrome — document.hidden и visibilitychange; rAF при этом headless и так не даёт.
    const reloadAt=${who.reloadAt};
    if(reloadAt>0) setTimeout(function(){ sessionStorage.setItem('cc_reloaded','1'); location.reload(); }, reloadAt);
    const hideAt=${who.hideAt};
    if(hideAt>0) setTimeout(function(){ Object.defineProperty(document, 'hidden', {get:()=>true, configurable:true}); Object.defineProperty(document, 'visibilityState', {get:()=>'hidden', configurable:true}); document.dispatchEvent(new Event('visibilitychange')); out.notes.hidden=true; }, hideAt);
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
      out.notes.trace.push(Math.round((Date.now()-t0)/1000)+'s · '+(t?t.textContent.trim():'-')+' · wait['+CC_MP_WAIT.map(w=>w.t).join('; ')+'] · rolls '+CC_MP_ROLLS+' · link '+MP.state+' · skip '+skipAnimation+' · own '+window.__own+' other '+window.__other+' · split '+CC_MP_SPLIT_AT+' '+[...document.querySelectorAll('.cc-mp-split')].map(e=>e.textContent).join('|')+' · qn '+JSON.stringify(CC_MP_QN)+' · acts['+(MP.peek?[]:[]).length+']'+(function(){ try{ return JSON.stringify((window.__acts||[]).slice(-6)); }catch(e){ return '?'; } })()+' · race '+JSON.stringify(typeof CC_RACE_DBG!=='undefined'?CC_RACE_DBG:null)+' · sent '+sent.join(','));
      if(out.notes.trace.length>40) out.notes.trace.shift();
    }, 10000);
    const t0=Date.now();
    const waitCard=async function(){
      let card=null; const t1=Date.now();
      while(Date.now()-t1<${BUDGET_MS} && !card){
        await wait(300);
        card=[...document.querySelectorAll('#majorStages .stage-card')].find(c=>c.querySelector('button[onclick*="careerBackToHub"]'));
      }
      if(!card) throw new Error('результат не пришёл за бюджет');
      out.notes.table=[...document.querySelectorAll('#majorStages .stage-card table.lobby-table tbody tr')]
        .filter(tr=>/^#/.test((tr.children[0]||{}).textContent||''))
        .map(tr=>[...tr.children].map(td=>td.textContent.trim()).join(' '));
    };
    await waitCard();
    // Следующие вечера подряд: в хаб, «играть», ждать итог. Кубок дивизиона — две сессии.
    out.notes.days=[CAREER.career.day];
    for(let k=1;k<${NIGHTS};k++){
      careerBackToHub(); await wait(800);
      const how=await pressPlay();
      if(how==='play') await waitCard();
      out.notes.days.push(CAREER.career.day+':'+how);
    }
    /* ПР каждого клиента — своими глазами, ПОСЛЕ вечера. Отчёт игрока
       1 сентября: «me and my friend made a duo carreer and we have same pr even
       if there are solo cups». ПР не в CC_TEAM_KEYS, значит у каждого он свой;
       здесь видно, что в нём лежит на самом деле. */
    out.notes.pr=(typeof careerPrRows==='function')
      ? careerPrRows().slice(0,8).map(r=>(r.you?'*':' ')+r.name+' '+r.pr+' ('+r.events+')')
      : null;
    out.notes.head=[...document.querySelectorAll('#majorStages .stage-card h4')].map(h=>h.textContent.replace(/\\s+/g,' ').trim()).join(' | ');
    out.notes.split=[...document.querySelectorAll('.cc-mp-split')].map(e=>e.textContent);
    // Личный вечер (соло в команде): день шагает, когда отыграет и второй, — ждём его.
    if(${process.env.CC_TABLES_DIFFER==='1'}){ for(let i=0;i<300 && CAREER.career.day===${JSON.stringify(DAY)};i++) await wait(300); }
    out.notes.rolls=CC_MP_ROLLS; out.notes.splitAt=CC_MP_SPLIT_AT; out.notes.dayAfter=CAREER.career.day; out.notes.own=window.__own; out.notes.other=window.__other;
    if(window.__f1){ const f=window.__f1; const hk=x=>(x.squad||[]).map(hKey).join('+'); out.notes.f1={n:f.length, you:f.findIndex(x=>x.isYou), rival:f.findIndex(x=>x.isRival), youKey:hk(f[f.findIndex(x=>x.isYou)]||{}), rivalKey:hk(f[f.findIndex(x=>x.isRival)]||{}), lock:(typeof CC_RACE_LOCK!=='undefined')?CC_RACE_LOCK:null, sky:f.map(hk).indexOf('sky'), scroll:f.map(hk).indexOf('scroll'), skyAll:f.map((x,i)=>hk(x)==='sky'?i:-1).filter(i=>i>=0), scrollAll:f.map((x,i)=>hk(x)==='scroll'?i:-1).filter(i=>i>=0)}; }
    out.notes.dbg={rand:!!CC_MP_RAND, hold:CC_MP_HOLD, alone:CC_MP_ALONE, state:MP.state, teams:window.__teams||0, soloBy:CAREER.career.soloBy, peer:(MP.peer||{}).handle, settle:(typeof ccSoloTeamSettle==='function')?ccSoloTeamSettle():null, dayNow:CAREER.career.day, errs:(window.__errs||[]).slice(0,3)};
    const log=(CAREER.career.log||[]); const last=log[log.length-1]||{};
    out.notes.mine={place:last.place, of:last.of, pts:last.pts, wins:last.wins, elims:last.elims};
  }catch(e){ out.fail=String(e && e.message || e); }
  out.errs=(window.__errs||[]).slice(0,3);
  out.notes.g1=window.__g1||null; out.notes.skipBoth=window.__skipBoth||0;
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;

const ccAddDaysNode=(iso, n)=>{ const d=new Date(iso+'T00:00:00Z'); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0,10); };
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const A = {nick:process.env.CC_NICK_A||'LiveA', age:17, ageEdge:4, country:'de', close:6, ovr:90, role:'roleIGL', role_mp:'a', money:48000, reach:20000, form:3, grind:12, skipAt:SKIP_A, hideAt:HIDE_A, reloadAt:RELOAD_A, mateIdx:0};
// CC_OVR_B / CC_MATE_B — слабый B (например 60 и напарник с 400-й строки ростера), чтобы он
// вылетел в первом раунде Victory Cup и досчитывал второй зрителем (его скрины 8.09, «игра 7»).
const B = {nick:process.env.CC_NICK_B||'LiveB', age:24, ageEdge:0, country:'br', close:1, ovr:Number(process.env.CC_OVR_B||86), role:'roleFRG', role_mp:'b', money:0,     reach:0,     form:0, grind:0,  skipAt:SKIP_B, hideAt:HIDE_B, reloadAt:RELOAD_B, mateIdx:Number(process.env.CC_MATE_B||1)};

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
  console.log('лобби '+CODE+' · день '+DAY+' · вечеров '+NIGHTS+' · скип A '+SKIP_A+' мс, B '+SKIP_B+' мс · контест '+CONTEST);
  const P0=9400+Math.floor(Math.random()*400);
  const [a, b]=await Promise.all([runOne('A', A, P0), runOne('B', B, P0+1)]);
  // Своя строка у каждого подписана «я & напарник» — порядок косметический, ники сравниваем как множество.
  // Пара «X & Y» приводится к одному порядку: свой состав каждый пишет себя первым.
  const norm=r=>String(r).replace(/(LiveA & LiveB|LiveB & LiveA)/g, 'LiveA+LiveB').replace(/(Твой состав|Your squad):\s*/g, '').replace(/(\S+) & (\S+)/g, (m,x,y)=>[x,y].sort().join('+'));
  // Своя строка внизу таблицы — у каждого своя (в соло на двоих их две разные): последняя строка,
  // если её место не идёт следом за предыдущей, — это она; своя строка ВНУТРИ верха сравнивается как все.
  const own=r=>/Your squad|Твой состав/.test(String(r));
  const rank=r=>Number((String(r).match(/^#(\d+)/)||[])[1]||0);
  // Своя строка внизу — та, чьё место больше числа строк над ней (верх таблицы + свой хвост).
  // Своя строка внизу — приколотая копия: её место уже есть выше (или дальше числа строк).
  const rowsOf=t=>(t||[]).filter((r,i,all)=>!(i===all.length-1 && i>0 && own(r) &&
    (rank(r)>i || all.slice(0,i).some(x=>rank(x)===rank(r)))));
  const hash=t=>crypto.createHash('sha1').update(rowsOf(t).map(norm).join('\n')).digest('hex').slice(0,12);
  for(const [n, r] of [['A', a], ['B', b]]){
    console.log(n+': '+(r.fail ? 'FAIL '+r.fail : (r.notes.head||'')) + ' · строк '+((r.notes.table||[]).length)+' · хеш '+hash(r.notes.table)+
      ' · своё '+JSON.stringify(r.notes.mine)+' · броски '+r.notes.rolls+' · pow '+r.notes.youPow+' · скип '+!!r.notes.skipPressed+' · фон '+!!r.notes.hidden+' · перезагрузка '+!!r.notes.reloaded+' · own/other '+r.notes.own+'/'+r.notes.other+' · '+JSON.stringify(r.notes.engine)+' · team '+JSON.stringify(r.notes.team)+' · dbg '+JSON.stringify(r.notes.dbg)+' · f1 '+JSON.stringify(r.notes.f1));
    if(r.notes.split && r.notes.split.length) console.log('   красная строка: '+r.notes.split.join(' || '));
    if(r.notes.pre) console.log('   перед вечером: '+JSON.stringify(r.notes.pre));
    if(r.notes.skipPressed && !r.notes.skipBoth) console.log('   ПРОПУСК: нажат, но голоса не сошлись — скип так и не включился');
    if(r.notes.g1) console.log('   сверка игры 1: '+r.notes.g1);
    if(r.notes.days && r.notes.days.length>1) console.log('   дни: '+r.notes.days.join(' → '));
    if(r.notes.marks) console.log('   метки: '+r.notes.marks.slice(0, r.notes.split && r.notes.split.length ? 60 : 14).join(' | '));
    if(r.fail && r.notes.trace) console.log('   след:' + String.fromCharCode(10) + '     ' + r.notes.trace.slice(-12).join(String.fromCharCode(10) + '     '));
    if(r.errs && r.errs.length) console.log('   ошибки страницы: '+r.errs.join(' | '));
    if(r.fail) console.log('   заметки: '+JSON.stringify({entered:r.notes.entered, link:r.notes.link, peer:r.notes.peer, pressed:r.notes.pressed, why:r.notes.why}));
    if(r.notes.pr) console.log('   ПР: '+r.notes.pr.join(' | '));
  }
  let bad=0;
  if(a.fail || b.fail) bad++;
  // CC_TABLES_DIFFER=1 — личные вечера (соло в команде): таблицы и броски у двоих свои, сверяется только день.
  const DIFFER=process.env.CC_TABLES_DIFFER==='1';
  if(!DIFFER && hash(a.notes.table)!==hash(b.notes.table)){ const at=rowsOf(a.notes.table).findIndex((r,i)=>norm(r)!==norm(rowsOf(b.notes.table)[i])); console.log('FAIL таблицы разные, строка '+(at+1)+'\n  A: '+(a.notes.table||[])[at]+'\n  B: '+(b.notes.table||[])[at]); bad++; }
  // ПР сцены считается у каждого своим движком по одной и той же комнате — значит совпадает.
  { const rows=[['A', a], ['B', b]].map(([n,r])=>[n, (r.notes.pr||[]).map(x=>String(x).replace(/^[*]/,' ')).join(' | ')]);
    const bad0=rows.filter(([n,v])=>v!==rows[0][1]);
    if(rows[0][1] && bad0.length){ console.log('FAIL ПР разошёлся: '+bad0.map(x=>x[0]).join(',')); bad++; } }
  if((a.notes.split||[]).length || (b.notes.split||[]).length){ console.log('FAIL есть красная строка'); bad++; }
  const want=FF || ccAddDaysNode(DAY, NIGHTS);
  // ГОНКА: в обеих таблицах должны стоять обе команды людей
  // Таблица показывает верхние строки и свою — соперник ниже среза в ней не обязан быть;
  // обязан быть в поле (f1: you и rival) и в общей сверке хешей.
  // В перемотке «таблица» — это журнал карьеры (у каждого свой), а поле первой игры не снимается;
  // там сверяются день прибытия и броски (общая комната на каждом вечере недели).
  for(const [n, r] of [['A', a], ['B', b]]){ const t=(r.notes.table||[]).join('\n');
    if(!FF && !DIFFER && !/Your squad|Твой состав/.test(t)){ console.log('FAIL '+n+': в таблице нет своей строки'); bad++; }
    if(!FF && (!r.notes.f1 || r.notes.f1.rival<0 || r.notes.f1.you<0)){ console.log('FAIL '+n+': в поле нет обеих команд людей: '+JSON.stringify(r.notes.f1)); bad++; }
    if(FF && !(r.notes.dayAfter>=FF)){ console.log('FAIL '+n+': перемотка не доехала до '+FF+', день '+r.notes.dayAfter); bad++; }
    console.log('   '+n+': напарник '+r.notes.mate+' · соперник '+r.notes.rival+' с '+JSON.stringify(r.notes.rivalMates)+' · врозь: '+r.notes.apart+(FF ? ' · день после '+r.notes.dayAfter+' · вечеров '+((r.notes.table||[]).length) : '')); }
  if(FF && a.notes.rolls!==b.notes.rolls){ console.log('FAIL броски в перемотке разные: '+a.notes.rolls+' / '+b.notes.rolls); bad++; }
  // CC_ROLLS_SAME=1 — таблицы личные (вылетевший досчитывает зрителем), а броски обязаны совпасть.
  if((!DIFFER || process.env.CC_ROLLS_SAME==='1') && !FF && !RELOAD_A && !RELOAD_B && a.notes.rolls!==b.notes.rolls){ console.log('FAIL броски разные: '+a.notes.rolls+' / '+b.notes.rolls); bad++; }
  if(bad) process.exit(1);
  console.log('гонка: два живых клиента сыграли один вечер в одной комнате, друг против друга');
})().catch(e=>{ console.error(e.message||e); process.exit(2); });
