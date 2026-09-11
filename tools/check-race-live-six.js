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
const SEASONS = Number(process.env.CC_SEASONS || 1);   // 2 — после дуо-года закрыть сезон и сыграть трио-год тем же составом комнаты
/* ТЕЛЕФОН В ГОНКЕ. Его слово 11.09: «сделай прогон race 1 с компьютера другой с телефона».
   Шесть вкладок одной машины считают устройство одинаково, поэтому годовая проба не ловила
   разъезд по ширине окна — а его скрин 10.09 был именно про него (комната 900 против 2100).
   CC_MOBILE перечисляет клиентов (с единицы), которые идут как телефон: узкое окно, iPhone в
   user-agent, тач и reduced motion — у него в Chrome он всегда включён. */
const MOBILE = new Set(String(process.env.CC_MOBILE || '').split(',').map(x => Number(String(x).trim())).filter(n => n >= 1));
const PHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
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
      // Приглашение на Про-Ам принимается само (в живой игре — кнопкой в ЛС): иначе 12.07 в пробе не играется.
      try{ const inv=(typeof careerProAmInv==='function') ? careerProAmInv() : null; if(inv && inv.state==='sent'){ const t=careerDms().find(x=>x.proam); if(t){ careerProAmYes(t.id); out.notes.proamYes=cr.day; } } }catch(e){}
      if(typeof CC_MP_ROLLS!=='undefined'){ if(out.notes._lr!==CC_MP_ROLLS){ out.notes._lr=CC_MP_ROLLS; out.notes._lt=Date.now(); }
        else if(CC_MP_RAND && !out.notes.stall && Date.now()-(out.notes._lt||Date.now())>120000){
          out.notes.stall={day:cr.day, game:CC_MP_GAME, rolls:CC_MP_ROLLS, wait:(CC_MP_WAIT||[]).map(w=>w.t), qn:JSON.stringify(CC_MP_QN), marks:(out.notes.marks||[]).slice(-90), inbox:(window.__acts||[]).slice(-40)}; } }
      out.notes.nights=out.notes.nights||[]; while(out.notes.nights.length<(cr.log||[]).length){ const r=cr.log[out.notes.nights.length]; out.notes.nights.push([r.day, r.kind||'cup', 'r'+CC_MP_ROLLS, 'lock'+(CC_RACE_LOCK?1:0), 'seed'+(CC_MP_SEED?1:0), 'alone'+(CC_MP_ALONE?1:0), 'field'+(CC_RACE_DBG?CC_RACE_DBG.n+'/'+CC_RACE_DBG.humans.length:'-'), 'link '+MP.state].join(' ')); }
      [...document.querySelectorAll('.cc-mp-split')].map(e=>e.textContent).forEach(s=>{ if(out.notes.splits.indexOf(s)<0) out.notes.splits.push(cr.day+' '+s); });
      document.getElementById('__prog').textContent=[cr.day, 'див '+cr.division, 'журнал '+(cr.log||[]).length, 'броски '+CC_MP_ROLLS,
        'связь '+MP.state, 'ff '+(CC_FF?'идёт':'-'), 'split '+(typeof CC_MP_SPLIT_AT!=='undefined'?CC_MP_SPLIT_AT:'-'), 'гонка '+JSON.stringify(typeof CC_RACE_DBG!=='undefined'?CC_RACE_DBG:null),
        'соперники '+(typeof ccRaceRivals==='function'?ccRaceRivals().length:'-'), 'комната '+(typeof ccRaceRoom==='function'?ccRaceRoom().length:'-'), 'wait['+((typeof CC_MP_WAIT!=='undefined'&&CC_MP_WAIT)?CC_MP_WAIT.map(w=>w.t).join(';'):'')+']', 'acts '+JSON.stringify((out.notes.marks||[]).slice(-3)), 'hold '+(typeof CC_MP_HOLD!=='undefined'?CC_MP_HOLD:'-'), 'game '+(typeof CC_MP_GAME!=='undefined'?CC_MP_GAME:'-'), 'qn '+JSON.stringify(typeof CC_MP_QN!=='undefined'?CC_MP_QN:null), 'title '+((document.getElementById('finalsLiveTitle')||{}).textContent||'').trim().slice(0,60), 'run '+(typeof CAREER_RUN!=='undefined' && CAREER_RUN ? 1 : 0), 'ask '+(function(){ const am=document.getElementById('ccAskModal'); if(!am || am.style.display!=='flex') return '-'; return String(am.textContent||'').replace(/\s+/g,' ').trim().slice(0,90); })(), 'ffuntil '+(CC_FF ? (CC_FF.until+(CC_FF.err?' ERR':'')+(CC_FF.stop?' STOP':'')) : '-'), 'peers '+JSON.stringify(Object.keys(CC_RACE_PEERS).map(k=>(CC_RACE_PEERS[k].card||{}).handle+':'+CC_RACE_PEERS[k].day)), 'врозь '+(typeof ccRaceApartWhy==='function'?ccRaceApartWhy(careerNext()):'-')].join(' · ');
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
    window.__acts=[]; if(typeof MP!=='undefined' && MP.on){ MP.on('act', function(m){ if(!m || m.kind==='hb') return; if(window.__acts.length>=60) window.__acts.shift(); window.__acts.push((m.by||'?').slice(-5)+':'+m.kind+(m.payload&&m.payload.q!=null?'#'+m.payload.q:'')+(m.payload&&m.payload.g!=null?' g'+m.payload.g:'')); }); }
    out.notes.renderRolls=[]; const rh0=careerRenderHub; careerRenderHub=function(tab){ const seeded=(typeof CC_MP_RAND!=='undefined' && CC_MP_RAND); const r0=CC_MP_ROLLS; const res=rh0.apply(this, arguments); if(seeded && CC_MP_ROLLS!==r0 && out.notes.renderRolls.length<40) out.notes.renderRolls.push(CAREER.career.day+' +'+(CC_MP_ROLLS-r0)); return res; };
    const mark=(t)=>{ if(out.notes.marks.length>=160) out.notes.marks.shift(); out.notes.marks.push(t+' d'+CAREER.career.day.slice(5)+' g'+CC_MP_GAME+' t'+Math.round((Date.now()-t0)/1000)); };
    const dq0=careerDropQuick; careerDropQuick=async function(field, you, how, home, pre){ const r0=CC_MP_ROLLS; const q=await dq0.apply(this, arguments); mark('DQ '+(you.mpTag||'?')+' '+how+' home'+(home?ALL_LANDING_ZONES.indexOf(home):'-')+' ->'+ALL_LANDING_ZONES.indexOf(you.landingZone)+' pow'+you.pow+' ce'+(you.closeEdge||0)+' r'+r0+'>'+CC_MP_ROLLS); return q; };
    const bl0=buildBotLandingAssignment; buildBotLandingAssignment=function(list, o){ const r0=CC_MP_ROLLS; const res=bl0.apply(this, arguments); mark('BOTS n'+(list||[]).length+' r'+r0+'>'+CC_MP_ROLLS); return res; };
    const ce0=console.error; console.error=function(){ try{ const parts=[...arguments].map(x=>(x && x.stack) ? String(x.stack).slice(0,600) : String(x)); out.notes.lastErr=parts.join(' ').slice(0,900); out.notes.cerr=(out.notes.cerr||[]).slice(-5).concat([out.notes.lastErr]); }catch(e){} return ce0.apply(console, arguments); };
    out.notes.fields=[]; const cf0=careerCupField; careerCupField=function(cr, mine, size, salt, open, sharp){
      const res=cf0.apply(this, arguments);
      try{ const h=x=>{ let v=0; for(const ch of String(x)){ v=(v*31+ch.charCodeAt(0))>>>0; } return v.toString(16); };
        const pool=careerPools(); const keys=(pool.duos||[]).map(d=>(d.cards||[]).map(c=>c&&(c._k||hKey(c))).join('+'));
        const ovrs=(pool.duos||[]).map(d=>Math.round(ccDuoOvr(d)*10)).join(',');
        out.notes.fields.push([CAREER.career.day, 'n'+size, 'salt '+salt, 'open'+(open?1:0), 'sharp'+sharp, 'seed '+careerSeed(cr, salt), 'crseed '+ccCareerSeed(),
          'taken'+(mine||[]).length+':'+h((mine||[]).map(c=>c&&hKey(c)).sort().join('|')), 'pool'+keys.length+':'+h(keys.join('|'))+':'+h(ovrs), 'tag '+(pool.tag||'-'),
          'out'+res.length+':'+h(res.map(t=>(t.squad||t.cards||[]).map(c=>c&&hKey(c)).join('+')).join('|')), 'lock'+(ccRaceLock()?1:0)].join(' '));
        if(out.notes.fields.length>8) out.notes.fields.shift(); }catch(e){ out.notes.fields.push('err '+e.message); }
      return res; };
    out.notes.skipped=[]; const cp0=careerCanPlay; careerCanPlay=function(next){ let ok=cp0.apply(this, arguments);
      /* НЕКЕМ ИГРАТЬ — САЖАЕМ НАПАРНИКА ЗДЕСЬ ЖЕ.
         Живой игрок это и делает: увидел «нужен напарник» и позвал кого-то. На перемотке
         некому, и карьера пропускает все парные вечера до конца года (прогон 11.09: 59
         турниров против 130). Вопрос задаётся ПЕРЕД вечером, значит здесь и место: состав
         не меняется посреди игры, и соперник видит его через ccRaceFieldSync как обычно.
         Чужого напарника не берём — ccRaceTakenKeys, его правило 7.09. */
      /* Не CAREER_RUN: на перемотке экран остаётся на результатах, и флаг висит поднятым
         весь год — прогон 11.09 не посадил никого ни разу. Мешает посадке только идущий
         вечер под замком, его и спрашиваем. */
      if(!ok && next && next.type && !(typeof ccRaceLock==='function' && ccRaceLock()) &&
         CC_PLAYABLE.indexOf(next.type)>=0 && careerNoMate(next.type) && careerMatesShort()>0){
        try{
          const taken=(typeof ccRaceTakenKeys==='function') ? ccRaceTakenKeys() : new Set();
          const pick=(careerDuoSearchPool(true)||[]).find(p=>p && p.handle && !taken.has(hKey(p.handle)));
          if(pick && careerMateSeat({handle:pick.handle, cardRegion:(pick.card&&pick.card.region)||'EU',
                                     dev:0, since:CAREER.career.day}, 0)){
            out.notes.mateTakes=(out.notes.mateTakes||[]).concat(CAREER.career.day+' '+pick.handle);
            ok=cp0.apply(this, arguments);
          }
        }catch(e){ out.notes.mateErr=String(e && e.message || e); }
      } if(!ok && next && next.type && next.type!=='free' && CC_PLAYABLE.indexOf(next.type)>=0 && out.notes.skipped.length<60) out.notes.skipped.push([CAREER.career.day, next.type, 'live'+(ccMpLive()?1:0), 'link '+MP.state, 'noMate'+(careerNoMate(next.type)?1:0), 'mates'+careerMates().length, 'mode '+(ccRaceModeWhy()||'-'), 'div'+CAREER.career.division].join(' ')); return ok; };
    /* СЛЕД ДОСКИ ПО ВЕЧЕРАМ. Доски расходятся при одинаковом списке вечеров, значит один и
       тот же ключ кладёт двоим разное. Чтобы не гадать, какой именно, после каждой отметки
       ключа снимается сумма ЧУЖИХ строк доски: свои у каждого свои по определению. Node
       потом найдёт первый ключ, на котором две последовательности разошлись. */
    { const sm0=ccEvSeenMark;
      ccEvSeenMark=function(key){
        const r=sm0.apply(this, arguments);
        if(r) try{
          const rows=(careerMoney()||{}).rows||{};
          /* Людей ГОНКИ в сумму не берём: у себя гонщик стоит своей строкой (её сравнивать
             нельзя), а у соседа — чужой. Иначе след врёт на разницу их заработков. */
          const race=(typeof ccRaceTakenKeys==='function') ? ccRaceTakenKeys() : new Set();
          try{ const me=careerCard(); if(me) race.add(hKey(me)); (careerMates()||[]).forEach(m=>m&&race.add(hKey(m))); }catch(e){}
          let sum=0, n=0;
          Object.keys(rows).forEach(h=>{ const x=rows[h]; if(x && !x.you && !race.has(hKey(h))){ sum+=Math.round(x.usd||0); n++; } });
          (out.notes.ledger=out.notes.ledger||[]).push(key+' n'+n+' $'+sum);
        }catch(e){}
        return r;
      }; }
    /* ПОЛЕ ПОСЛЕ ПОСАДКИ СОПЕРНИКА.
       Сырое поле (careerCupField) у двоих совпадает до хеша — это видно по строкам «поле:».
       А доски расходятся с 9 января ровно на одно дуо (Pixovsky & SereN, $800 каждому), и
       разница дальше стоит константой. Значит расходится то, что делает с полем гонка:
       ccRaceFieldSync садит соперника и выкидывает бота, чтобы размер не поехал. Снимаем
       список ПОСЛЕ неё — и сравниваем у двоих по дню. */
    { const fs0=ccRaceFieldSync;
      ccRaceFieldSync=async function(teams, opts){
        const r=await fs0.apply(this, arguments);
        try{
          const h=x=>{ let v=0; for(const ch of String(x)){ v=(v*31+ch.charCodeAt(0))>>>0; } return v.toString(16); };
          const list=(teams||[]).map(t=>(t.squad||t.cards||[]).map(c=>c&&hKey(c)).join('+'));
          (out.notes.post=out.notes.post||[]).push(CAREER.career.day+' g'+CC_MP_GAME+' n'+list.length+' '+h(list.slice().sort().join('|')));
          if(out.notes.post.length>90) out.notes.post.shift();
          // И сам список в день, ради которого всё это: сравнить можно только именами.
          if(CAREER.career.day===${JSON.stringify(process.env.CC_DAY_DUMP || '')}) out.notes.postList=list.slice().sort();
        }catch(e){}
        return r;
      }; }
    /* Копилки: сколько послано и сколько принято. Хвосты вечера (|t) не доезжали до
       соседа в годовом прогоне 11.09 — надо знать, не послали или не приняли. */
    { const ra0=ccEvResApply;
      ccEvResApply=function(d){
        const r=ra0.apply(this, arguments);
        try{ (out.notes.res=out.notes.res||[]).push((r?'+':'-')+((d&&d.key)||'?')); if(out.notes.res.length>120) out.notes.res.shift(); }catch(e){}
        return r;
      };
      const ds0=ccEvDeltaSend;
      ccEvDeltaSend=function(){
        try{ const d=CC_EV_DELTA; if(d && d.key) (out.notes.sent=out.notes.sent||[]).push(d.key+' m'+Object.keys(d.money||{}).length+' p'+Object.keys(d.pr||{}).length); if(out.notes.sent && out.notes.sent.length>120) out.notes.sent.shift(); }catch(e){}
        return ds0.apply(this, arguments);
      }; }
    /* ХИТ МЕЙДЖОРА. Красная строка 21 апреля: поля разошлись на 48 командах из 50 при
       одинаковых людях (h104+109) — значит двое играли РАЗНЫЕ хиты одного турнира.
       ccRaceHeatTogether выбирает хит по якорю (наименьший ник комнаты); записываем,
       кто якорь, нашёлся ли он в моём посеве и какой хит в итоге выбран. */
    { const sh0=seedHeats;
      seedHeats=function(teams, n){
        const r=sh0.apply(this, arguments);
        try{
          const h=x=>{ let v=0; for(const ch of String(x)){ v=(v*31+ch.charCodeAt(0))>>>0; } return v.toString(16); };
          window.__heatIn=(teams||[]).map(t=>(t.squad||t.cards||[]).map(c=>c&&hKey(c)).join('+'));
          window.__heatSig=h(window.__heatIn.join('|'))+' n'+window.__heatIn.length+' k'+((r||[]).length);
        }catch(e){}
        return r;
      };
      const ht0=ccRaceHeatTogether;
      ccRaceHeatTogether=function(heats, you){
        const at=ht0.apply(this, arguments);
        try{
          const me=careerCard();
          const room=(typeof ccRaceNightRoom==='function') ? ccRaceNightRoom() : [];
          const keys=[hKey(me)].concat(room.map(p=>hKey(p.card))).sort();
          const anchor=keys[0];
          const seen=(window.__heatIn||[]).some(x=>String(x).split('+').indexOf(anchor)>=0);
          /* И сама таблица Плей-Ина: её отпечаток (он же msh в строке гонки) и место слова
             'you' — если таблицы одинаковы, а места разные, значит один сеется таблицей,
             а другой броском (ccMajorSeedRows вернул null). */
          const ms=CAREER.career.majorSeed;
          const msh=ms ? String(ccHashStr(JSON.stringify(ms))) : '—';
          const you0=(ms && ms.rows) ? ms.rows.indexOf('you') : -1;
          const peers=(typeof ccRaceRoom==='function' ? ccRaceRoom() : []).map(p=>String(p.msh||'—')).join(',');
          (out.notes.heats=out.notes.heats||[]).push(CAREER.career.day+' '+(CC_MP_NIGHT||'-')+
            ' якорь '+anchor+(seen?' есть':' НЕТ')+' хит '+at+' из '+((heats||[]).length)+' · '+(window.__heatSig||'-')+
            ' · таблица '+msh+' you@'+you0+' строк '+((ms&&ms.rows)?ms.rows.length:0)+' · у соседей '+peers);
          if(out.notes.heats.length>20) out.notes.heats.shift();
        }catch(e){}
        return at;
      }; }
    // Метки хода: каждый посланный акт, кроме пульса.
    const act0=MP.act; MP.act=function(k,p){ if(k==='fferr' && p && !out.notes.ffErr) out.notes.ffErr={day:p.day, kind:'', text:String(p.text||''), stack:out.notes.lastErr||null}; if(k!=='hb'){ if(out.notes.marks.length>=160) out.notes.marks.shift(); out.notes.marks.push(k+(p&&p.q!=null?'#'+p.q:'')+' d'+CAREER.career.day.slice(5)+' g'+CC_MP_GAME+' r'+CC_MP_ROLLS+' t'+Math.round((Date.now()-t0)/1000)); } return act0.apply(MP, arguments); };
    // След барьера и все служебные сообщения сервера (start/close/card/ready/state) — в метки; строка гонки посреди вечера — с откуда.
    window.CC_MP_TRACE=function(t){ mark('TR '+t); };
    window.__link=MP.state; setInterval(function(){ try{ if(MP.state!==window.__link){ mark('LINK '+window.__link+'>'+MP.state+' pend'+(MP.pending?MP.pending():'-')); window.__link=MP.state; } }catch(e){} }, 200);
    const say0=MP.say; MP.say=function(m){ try{ if(m && m.t!=='act') mark('MSG '+m.t+(m.resume?' resume':'')+(m.fresh?' fresh':'')+(m.by?' by'+String(m.by).slice(-5):'')+(m.day?' '+m.day.slice(5):'')+(m.split?' split':'')); }catch(e){} return say0.apply(this, arguments); };
    const rs0=careerRaceSend; careerRaceSend=function(){ if(typeof CC_MP_RAND!=='undefined' && CC_MP_RAND){ try{ const st=String(new Error().stack||'').split('\\n').slice(2,6).map(l=>l.trim().replace(/^at /,'').replace(/ \\(.*$/,'').replace(/^async /,'')).join('<'); mark('RS '+st); }catch(e){} } return rs0.apply(this, arguments); };
    const slow0=ccMpSlowSeen; ccMpSlowSeen=function(){ out.notes.marks.push('SLOW d'+CAREER.career.day.slice(5)+' r'+CC_MP_ROLLS+' t'+Math.round((Date.now()-t0)/1000)); return slow0.apply(this, arguments); };
    // Голос за перемотку до конца сезона; пойдёт, когда проголосуют все.
    careerRenderHub('calendar'); await wait(300);
    careerFfToDay(${JSON.stringify(FF)});
    out.notes.ffVoted=true;
    const runFf=async function(){
    while(Date.now()-t0<${BUDGET_MS} && (CAREER.career.day<${JSON.stringify(FF)} || CC_FF) && !CAREER.career.seasonOver){
      await wait(1000);
      if(out.notes.ffErr) { await wait(3000); break; }
      // Перемотка остановилась, вечера нет, цель не достигнута — ждать нечего (год 9.09: 5 часов стоя на 13.06).
      if(!CC_FF && !(typeof CAREER_RUN!=='undefined' && CAREER_RUN) && CAREER.career.day<${JSON.stringify(FF)}){ out.notes.ffIdle=(out.notes.ffIdle||0)+1; if(out.notes.ffIdle>90){ out.notes.ffErr=out.notes.ffErr||{day:CAREER.career.day, kind:'', text:'перемотка остановилась без ошибки'}; break; } } else out.notes.ffIdle=0;
    }
    };
    await runFf();
    /* ЖДЁМ ОСТАЛЬНЫХ ПЕРЕД СНИМКОМ.
       Четырёхмесячный прогон 11.09: доски разошлись на 121 строке из 216, а список вечеров
       отличался ровно одним ключом — 2026-03-31|S40_FNCSDivisionalCup|d1 был у первого и
       ещё не был у второго. То есть мерилось не расхождение досок, а разное время снимка:
       кто дошёл до цели раньше, тот снял доску до того, как последний вечер соседа доехал
       дельтой (ccEvDeltaSend). Ждём, пока все встанут на целевой день, и ещё немного —
       дельте нужен оборот. */
    { let w=0;
      while(w++<240){
        const days=Object.keys(CC_RACE_PEERS).map(k=>CC_RACE_PEERS[k].day).filter(Boolean);
        if(days.length && days.every(d=>d>=${JSON.stringify(FF)})) break;
        await wait(500);
      }
      out.notes.settle={waited:w, peers:Object.keys(CC_RACE_PEERS).map(k=>CC_RACE_PEERS[k].day)};
      await wait(6000); }
    if(${SEASONS}>=2 && !out.notes.ffErr && CAREER.career.day>=${JSON.stringify(FF)}){
      const cr1=CAREER.career;
      // Конец сезона: голос за следующий день у всех — день за CC_YEAR_TO закрывает год.
      // Голос за последний день — пока сезон не закрылся или не кончился бюджет: отстающие догоняют долго (у кого нет напарника, тот проходит год за час, у кого есть — за полтора).
      for(let i=0;Date.now()-t0<${BUDGET_MS} && !cr1.seasonOver;i++){ if(i%20===0){ try{ careerNextDay(); }catch(e){} } await wait(250); }
      out.notes.s1={day:cr1.day, over:!!cr1.seasonOver, log:(cr1.log||[]).length, div:cr1.division, money:cr1.earnings, ovr:CAREER.player.ovr, mates:careerMates().map(m=>m&&m.handle)};
      if(!cr1.seasonOver) throw new Error('сезон 1 не закрылся: день '+cr1.day+' · голосов '+ccRaceVotes()+'/'+ccRaceOf());
      careerNewSeason();
      const cr2=CAREER.career;
      out.notes.s2start={season:cr2.season, day:cr2.day, size:careerSquadSize(), mates:careerMates().map(m=>m&&m.handle)};
      // Трио: досадить напарников до полного состава — индексы свои у каждого клиента (mateIdx+6k), чтобы боты не совпали.
      { const pool=ccSceneRoster(ccCareerRegion()).filter(c=>hKey(c)!==hKey(careerCard())); let k=1, guard=0;
        while(careerMates().length<careerMateSeats() && guard++<12){ const card=pool[${who.mateIdx}+6*k]; k++; if(!card) break;
          if(careerMates().some(m=>m&&hKey(m)===hKey(card))) continue;
          careerMateSeat({handle:card.handle, cardRegion:card.region, patience:CAREER_PATIENCE_START, since:ccAddDays(careerToday(), -CC_CHEM_DAYS)}); } }
      out.notes.s2mates=careerMates().map(m=>m&&m.handle);
      careerSave(); careerRaceSend(); careerRenderHub('calendar'); await wait(2000);
      out.notes.ffIdle=0; careerFfToDay(${JSON.stringify(FF)}); out.notes.ffVoted2=true;
      await runFf();
    }
    const cr=CAREER.career;
    out.notes.table=(cr.log||[]).map(r=>[r.day, r.kind||'cup', r.stage||'', 'div'+r.div, '#'+r.place+'/'+r.of, r.pts+'pts', (r.wins||0)+'w', (r.elims||0)+'e'].join(' '));
    out.notes.kinds=(cr.log||[]).reduce((a,r)=>{ const k=r.kind||'cup'; a[k]=(a[k]||0)+1; return a; }, {});
    out.notes.bySeason=(cr.log||[]).reduce((a,r)=>{ const s=r.season||1; a[s]=(a[s]||0)+1; return a; }, {});
    out.notes.season=cr.season; out.notes.size=careerSquadSize();
    out.notes.rolls=CC_MP_ROLLS; out.notes.dayAfter=cr.day; out.notes.div=cr.division; out.notes.seasonOver=!!cr.seasonOver;
    /* ДОСКИ — СВЕРКОЙ, А НЕ ГЛАЗОМ. Его скрины 11.09: две вкладки, доска призовых
       расходится на сотни долларов и один-два вечера. Здесь каждый клиент кладёт свою
       доску без СВОИХ строк (они у каждого свои по определению), а Node их сравнивает. */
    out.notes.board=(function(){ try{
      return careerMoneyRows('year').filter(r=>!r.you).map(r=>r.name+':'+r.events+':'+r.usd);
    }catch(e){ return null; } })();
    /* Какие вечера попали в ДОСКИ этой карьеры (cr.evSeen). Расхождение досок на $100
       при одинаковом числе вечеров означает, что где-то один и тот же вечер посчитан
       по-разному, а не пропущен: два списка ключей отвечают, что именно из двух. */
    out.notes.evSeen=Object.keys((cr.evSeen)||{});
    out.notes.card=(typeof careerCard==='function' && careerCard()) ? hKey(careerCard()) : null;
    out.notes.money=cr.earnings; out.notes.ovr=CAREER.player.ovr; out.notes.titles=(cr.ewc||[]).length;
    out.notes.mates=careerMates().map(m=>m&&m.handle); out.notes.noMate=(typeof careerNoMate==='function')?careerNoMate('eval'):null; out.notes.form=cr.form; out.notes.energy=cr.energy;
    out.notes.dbg={rand:!!CC_MP_RAND, state:MP.state, split:(typeof CC_MP_SPLIT_AT!=='undefined')?CC_MP_SPLIT_AT:null, race:(typeof CC_RACE_DBG!=='undefined')?CC_RACE_DBG:null, rivals:ccRaceRivals().map(p=>p.card.handle+':'+p.div+':'+p.day), ff:!!CC_FF};
    /* Каждый клиент сам говорит, за какое устройство себя держит и какую комнату из этого
       собирает: в команде и в гонке она обязана быть одна у всех (см. ccOpenRoom). */
    out.notes.dev=(function(){ try{ return {
      small:ccSmallDevice(), open:ccOpenRoom(), w:window.innerWidth, touch:navigator.maxTouchPoints||0,
      rm:!!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches),
      ua:/Mobile|iPhone|Android/i.test(navigator.userAgent||'') ? 'phone' : 'desktop'
    }; }catch(e){ return null; } })();
    out.notes.secs=Math.round((Date.now()-t0)/1000);
    out.notes.wait=(typeof CC_MP_WAIT!=='undefined'&&CC_MP_WAIT)?CC_MP_WAIT.map(w=>w.t):null; out.notes.game=CC_MP_GAME; out.notes.qn=CC_MP_QN; out.notes.title=((document.getElementById('finalsLiveTitle')||{}).textContent||'').trim().slice(0,80); out.notes.queue=(typeof MP!=='undefined' && MP.find) ? (function(){ try{ const q=[]; for(const k of ['game@']){} return (window.__acts||[]).slice(-30); }catch(e){ return null; } })() : null; out.notes.room=(typeof ccRaceRoom==='function')?ccRaceRoom().length:null; out.notes.peersDays=Object.keys(CC_RACE_PEERS).map(k=>(CC_RACE_PEERS[k].card||{}).handle+':'+CC_RACE_PEERS[k].day);
  }catch(e){ out.fail=String(e && e.message || e); }
  out.errs=(window.__errs||[]).slice(0,5);
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const WHO = [
  {nick:'Live1', age:17, ageEdge:4, country:'de', close:6, ovr:90, role:'roleIGL', role_mp:'a', money:48000, reach:30000, form:3, grind:12, mateIdx:0},
  {nick:'Live2', age:24, ageEdge:0, country:'br', close:1, ovr:86, role:'roleFRG', role_mp:'b', money:0,     reach:0,     form:0, grind:0,  mateIdx:1},
  {nick:'Live3', age:20, ageEdge:2, country:'fr', close:3, ovr:88, role:'roleFRG', role_mp:'b', money:5000,  reach:100,   form:1, grind:3,  mateIdx:2},
  {nick:'Live4', age:18, ageEdge:3, country:'gb', close:5, ovr:84, role:'roleIGL', role_mp:'b', money:1000,  reach:800,   form:2, grind:6,  mateIdx:3},
  {nick:'Live5', age:22, ageEdge:1, country:'it', close:2, ovr:92, role:'roleFRG', role_mp:'b', money:12000, reach:30000,  form:4, grind:9,  mateIdx:4},
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
async function runOne(tag, who, port, phone){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(), 'mpsix-'+tag+'-'));
  const page=path.join(dir, 'index.html');
  fs.writeFileSync(page, HEAD + src + boot(who));
  const args=['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
    '--remote-debugging-port='+port, '--remote-allow-origins=*', '--user-data-dir='+path.join(dir, 'profile')];
  /* Окно headless по умолчанию 764 px — это уже «малое устройство» по ccSmallDevice, то есть
     без этой строки компьютер в пробе был бы вторым телефоном и сверять было бы нечего. */
  args.push(phone ? '--window-size=390,844' : '--window-size=1440,900');
  if(phone) args.push('--user-agent='+PHONE_UA, '--force-prefers-reduced-motion');
  const chrome=spawn(CHROME, args.concat(['about:blank']), {stdio:'ignore'});
  const ws=await cdp(port);
  const c=await client(ws);
  /* Подмена ставится ДО загрузки: ccSmallDevice меряется один раз и запоминается,
     так что узнать про телефон после старта страница уже не сможет. */
  if(phone){
    await c.send('Emulation.setDeviceMetricsOverride', {width:390, height:844, deviceScaleFactor:3, mobile:true});
    await c.send('Emulation.setTouchEmulationEnabled', {enabled:true, maxTouchPoints:5});
    await c.send('Emulation.setUserAgentOverride', {userAgent:PHONE_UA, platform:'iPhone'});
  } else if(MOBILE.size){
    await c.send('Emulation.setDeviceMetricsOverride', {width:1440, height:900, deviceScaleFactor:1, mobile:false});
  }
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
  console.log('лобби '+CODE+' · игроков '+N+' · с '+DAY+' до '+FF+' · бюджет '+Math.round(BUDGET_MS/60000)+' мин'+
    (MOBILE.size ? ' · телефоны: '+[...MOBILE].join(',') : ''));
  const P0=9400+Math.floor(Math.random()*400);
  const outs=await Promise.all(WHO.map((w,i)=>runOne(w.nick, w, P0+i, MOBILE.has(i+1))));
  let bad=0;
  outs.forEach((r,i)=>{
    const n=WHO[i].nick;
    console.log(n+': '+(r.fail ? 'FAIL '+r.fail : 'дошёл до '+r.notes.dayAfter)+' · див '+r.notes.div+' · сезон закрыт '+r.notes.seasonOver+
      ' · журнал '+((r.notes.table||[]).length)+' '+JSON.stringify(r.notes.kinds||{})+' · броски '+r.notes.rolls+' · $'+r.notes.money+' · ovr '+r.notes.ovr+' · титулов '+r.notes.titles+
      ' · ждал соседей '+JSON.stringify(r.notes.settle)+
      ' · напарники '+JSON.stringify(r.notes.mates)+' noMate '+r.notes.noMate+' · форма '+r.notes.form+' энергия '+r.notes.energy+' · '+Math.round((r.notes.secs||0)/60)+' мин · dbg '+JSON.stringify(r.notes.dbg));
    console.log('   напарник '+r.notes.mate+' · соперники '+r.notes.rival+' · врозь на старте: '+r.notes.apart+
      ((r.notes.mateTakes||[]).length ? ' · брал нового: '+r.notes.mateTakes.join(', ') : '')+
      (r.notes.mateErr ? ' · напарник не сел: '+r.notes.mateErr : ''));
    if(r.notes.s1) console.log('   сезон 1: '+JSON.stringify(r.notes.s1)+' → сезон '+r.notes.season+' (состав '+r.notes.size+'): старт '+JSON.stringify(r.notes.s2start)+' · напарники '+JSON.stringify(r.notes.s2mates)+' · вечеров по сезонам '+JSON.stringify(r.notes.bySeason));
    console.log('   вечера: '+(r.notes.nights||[]).join(' | '));
    if(r.notes.renderRolls && r.notes.renderRolls.length) console.log('   FAIL броски в отрисовке: '+r.notes.renderRolls.join(' | '));
    (r.notes.fields||[]).forEach(f=>console.log('   поле: '+f));
    if(r.notes.skipped && r.notes.skipped.length) console.log('   не сыграно: '+[...new Set(r.notes.skipped)].join(' | '));
    if(r.fail || (r.notes.dayAfter<FF && !r.notes.seasonOver)) console.log('   застрял: wait '+JSON.stringify(r.notes.wait)+' · игра '+r.notes.game+' · qn '+JSON.stringify(r.notes.qn)+' · эфир '+r.notes.title+' · комната '+r.notes.room+' · соперники '+JSON.stringify(r.notes.peersDays)+'\n   метки: '+(r.notes.marks||[]).slice(-70).join(' | ')+'\n   входящие: '+JSON.stringify(r.notes.queue));
    if(r.notes.stall) console.log('   СТОП '+r.notes.stall.day+' игра '+r.notes.stall.game+' r'+r.notes.stall.rolls+' wait '+JSON.stringify(r.notes.stall.wait)+'\n   qn '+r.notes.stall.qn+'\n   метки-стоп: '+r.notes.stall.marks.join(' | ')+'\n   входящие-стоп: '+JSON.stringify(r.notes.stall.inbox));
    if(r.notes.cerr && r.notes.cerr.length) console.log('   console.error: '+r.notes.cerr.join(' || '));
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
  /* УСТРОЙСТВО. Телефон и компьютер обязаны собрать ОДНУ комнату: в гонке ccOpenRoom берёт
     малую у всех. Разъедутся — вечер у них разный с первой игры, и это красная строка. */
  const devs=outs.map((r,i)=>({n:WHO[i].nick, d:r.notes.dev, phone:MOBILE.has(i+1)}));
  if(devs.some(x=>x.d)){
    console.log('устройства: '+devs.map(x=>x.n+' '+(x.phone?'телефон':'компьютер')+' ['+(x.d ? x.d.ua+' '+x.d.w+'px touch'+x.d.touch+(x.d.rm?' rm':'')+(x.d.small?' малое':' большое')+' комната '+x.d.open : '?')+']').join(' · '));
    const rooms=[...new Set(devs.map(x=>x.d && x.d.open).filter(v=>v!=null))];
    if(rooms.length>1){ console.log('   FAIL комнаты разные: '+rooms.join(' vs ')); bad++; }
    if(MOBILE.size && !devs.some(x=>x.phone && x.d && x.d.ua==='phone')){ console.log('   FAIL телефон не притворился телефоном'); bad++; }
  }
  // Доски призовых: у всех одна, кроме своих строк.
  const boards=outs.map(r=>new Map((r.notes.board||[]).map(x=>{ const i=x.indexOf(':'); return [x.slice(0,i), x.slice(i+1)]; })));
  if(boards.length>1 && boards[0].size){
    const mine=outs.map(r=>new Set([].concat(r.notes.mates||[], (r.notes.dbg&&r.notes.dbg.rivals)||[]).filter(Boolean)));
    let diff=[], nDiff=0;   // строк печатаем шесть, а считаем все: счёт по длине списка трижды соврал 11.09
    boards[0].forEach((v, k)=>{
      for(let i=1;i<boards.length;i++){
        const w=boards[i].get(k);
        if(w===undefined || w===v) continue;              // нет строки — он её просто не видел
        nDiff++;
        if(diff.length<6) diff.push(k+' '+v+' vs '+w+' (#'+(i+1)+')');
      }
    });
    console.log('доски призовых: строк '+boards[0].size+', расходится '+nDiff+(diff.length?': '+diff.join(' | ')+(nDiff>diff.length?' …':''):''));
    if(nDiff){ console.log('   FAIL доски призовых разошлись'); bad++; }
    // И чем отличаются САМИ вечера: ключ вида день|тип|дивизион (+своя метка, если врозь).
    const seen=outs.map(r=>new Set(r.notes.evSeen||[]));
    if(seen.length>1 && seen[0].size){
      const only=(a,b)=>[...a].filter(k=>!b.has(k));
      const l=only(seen[0], seen[1]), r=only(seen[1], seen[0]);
      console.log('свой ник в ключе вечера: '+outs.map(r=>JSON.stringify(r.notes.card)).join(' / '));
      outs.forEach((r,i)=>(r.notes.heats||[]).forEach(x=>console.log('   хит #'+(i+1)+': '+x)));
      outs.forEach((r,i)=>{
        const sent=(r.notes.sent||[]).filter(x=>x.indexOf('|t')>=0);
        const res=(r.notes.res||[]).filter(x=>x.indexOf('|t')>=0);
        console.log('   копилки #'+(i+1)+': послано хвостов '+sent.length+' ['+sent.slice(-4).join(' ; ')+'] · принято '+res.length+' ['+res.slice(-4).join(' ; ')+']');
      });
      /* Поле после посадки соперника: где оно разъехалось, там и разъехались доски. */
      { const pm=outs.map(r=>new Map((r.notes.post||[]).map(x=>{ const i=x.indexOf(' '); return [x.slice(0,i)+x.slice(i, x.indexOf(' n')), x.slice(x.indexOf(' n')+1)]; })));
        if(pm.length>1 && pm[0].size){
          const bad=[];
          pm[0].forEach((v,k)=>{ const w=pm[1].get(k); if(w!==undefined && w!==v && bad.length<8) bad.push(k+': '+v+' vs '+w); });
          console.log('поле после посадки: снимков '+pm.map(x=>x.size).join('/')+
            (bad.length ? ' · разошлось: '+bad.join(' | ') : ' · везде одинаково'));
        } }
      /* Первый ключ, на котором две доски разъехались, — это и есть вечер, который двое
         посчитали по-разному. Сравниваем по ключу, а не по порядку: порядок у них свой. */
      { const led=outs.map(r=>new Map((r.notes.ledger||[]).map(x=>{ const i=x.indexOf(' '); return [x.slice(0,i), x.slice(i+1)]; })));
        if(led.length>1 && led[0].size){
          const bad=[];
          led[0].forEach((v,k)=>{ const w=led[1].get(k); if(w!==undefined && w!==v && bad.length<5) bad.push(k+': '+v+' vs '+w); });
          console.log('след доски: вечеров '+led.map(x=>x.size).join('/')+
            (bad.length ? ' · первые разошедшиеся: '+bad.join(' | ') : ' · все совпали'));
          // Вся последовательность целиком: расхождение читается по шагу, а не по итогу.
          if(bad.length){
            const keys=[...new Set([...led[0].keys(), ...led[1].keys()])].sort();
            keys.forEach(k=>console.log('   '+(led[0].get(k)===led[1].get(k)?' ':'!')+' '+k+' :: '+(led[0].get(k)||'—')+' :: '+(led[1].get(k)||'—')));
          }
        } }
      console.log('вечера в досках: '+seen.map(x=>x.size).join('/')+
        (l.length?' · только у первого: '+l.slice(0,8).join(' | '):'')+
        (r.length?' · только у второго: '+r.slice(0,8).join(' | '):'')+
        (!l.length && !r.length ? ' · списки одинаковы' : ''));
    }
  }
  if(process.env.CC_DAY_DUMP && outs.some(r=>r.notes.postList)){
    const a=new Set(outs[0].notes.postList||[]), b=new Set(outs[1].notes.postList||[]);
    console.log('поле '+process.env.CC_DAY_DUMP+': '+[...a].length+'/'+[...b].length+
      ' · только у первого: '+[...a].filter(x=>!b.has(x)).join(', ')+
      ' · только у второго: '+[...b].filter(x=>!a.has(x)).join(', '));
  }
  if(bad){ console.log('FAIL: '+bad); process.exit(1); }
  console.log('гонка на '+N+': все дошли до '+FF+' без красных строк и без встававшей перемотки');
})().catch(e=>{ console.error(e.message||e); process.exit(2); });
