/*@@PART js/career/cloud-hub.js@@*/
/* ОБЛАЧНЫЕ СОХРАНЕНИЯ (16.10, «что ещё глобального» → «1»). Карьера жила только в localStorage: почистил браузер или
   сменил телефон — её нет. Теперь по коду-ключу (16 знаков, без путаных букв) сейвы карьер и менеджера уходят на сервер
   (mp.fncsdraft.com/vault, server/src/vault.js) сжатыми gzip и забираются на любом устройстве тем же кодом.
   Сервер о игре не знает ничего: ключ localStorage → строка. Отправка — через 45 с после сохранения и при уходе со
   вкладки, только изменившиеся слоты (подпись длина+хеш); удалённый тут слот удаляется и там. */
const CC_CLOUD_LS='fd_cloud_code', CC_CLOUD_SENT='fd_cloud_sent', CC_CLOUD_ALPH='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
// + fncsdraft_profile (30.10): ник и аватар вкладки «Профиль» едут в облако вместе с карьерами.
const CC_CLOUD_KEY=/^(fncsdraft_(career|manager)(_s\d{1,2})?|fncsdraft_profile)$/;
let CC_CLOUD_T=null, CC_CLOUD_AGAIN=false, CC_CLOUD_BUSY=false, CC_CLOUD_MSG='', CC_CLOUD_LIST=null, CC_CLOUD_ENTER=false, CC_CLOUD_ARM=false;
function ccCloudBase(){
  const h=(typeof MP!=='undefined' && MP.host) || '';
  if(!h && location.protocol==='file:') return null;
  return String(h||'wss://mp.fncsdraft.com').replace(/^wss:/, 'https:').replace(/^ws:/, 'http:')+'/vault';
}
function ccCloudCode(){ try{ return localStorage.getItem(CC_CLOUD_LS)||''; }catch(e){ return ''; } }
function ccCloudFmt(c){ return String(c||'').replace(/(.{4})(?=.)/g, '$1-'); }
function ccCloudNewCode(){
  const a=new Uint32Array(16); crypto.getRandomValues(a);
  return Array.from(a, x=>CC_CLOUD_ALPH[x%32]).join('');
}
function ccCloudKeys(){
  const out=[];
  try{ for(let i=0; i<localStorage.length; i++){ const k=localStorage.key(i); if(CC_CLOUD_KEY.test(k)) out.push(k); } }catch(e){}
  return out.sort();
}
async function ccCloudPack(str){
  if(typeof CompressionStream==='undefined') return 'p:'+str;
  const cs=new Blob([str]).stream().pipeThrough(new CompressionStream('gzip'));
  const buf=new Uint8Array(await new Response(cs).arrayBuffer());
  let bin=''; for(let i=0; i<buf.length; i+=0x8000) bin+=String.fromCharCode.apply(null, buf.subarray(i, i+0x8000));
  return 'g:'+btoa(bin);
}
async function ccCloudUnpack(d){
  d=String(d||'');
  if(d.slice(0,2)==='p:') return d.slice(2);
  const bin=atob(d.slice(2)), u=new Uint8Array(bin.length);
  for(let i=0; i<bin.length; i++) u[i]=bin.charCodeAt(i);
  const ds=new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'));
  return await new Response(ds).text();
}
function ccCloudInfo(key, raw){
  try{
    if(key==='fncsdraft_profile'){ const p=JSON.parse(raw||'{}')||{}; return {kind:'profile', name:p.nick||''}; }
    const s=ccSaveParse(raw); if(!s) return {};
    if(/manager/.test(key)) return {kind:'mgr', name:(s.club||{}).name||'', day:((s.shadow||{}).career||{}).day||''};
    return {kind:'career', name:(s.player||{}).nick||'', day:(s.career||{}).day||'', earn:Math.round((s.career||{}).earnings||0)};
  }catch(e){ return {}; }
}
async function ccCloudPost(o){
  const b=ccCloudBase(); if(!b) throw new Error('offline');
  const r=await fetch(b, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(o)});
  const j=await r.json().catch(()=>({err:'json'}));
  if(!r.ok || j.err) throw new Error(j.err||('http '+r.status));
  return j;
}
function ccCloudSent(){ try{ return JSON.parse(localStorage.getItem(CC_CLOUD_SENT)||'{}')||{}; }catch(e){ return {}; } }
async function ccCloudPush(){
  const code=ccCloudCode(); if(!code || CC_CLOUD_BUSY) return;
  try{ ccLzFlush(); }catch(e){}
  CC_CLOUD_BUSY=true;
  const sent=ccCloudSent();
  try{
    const keys=ccCloudKeys();
    for(const k of keys){
      const raw=localStorage.getItem(k)||'';
      const sig=raw.length+':'+ccHashStr(raw);
      if(sent[k]===sig) continue;
      // Профиль — без права уронить отправку карьер: сервер до 30.10 этот ключ не знает и отвечает «key».
      if(k==='fncsdraft_profile'){
        try{ await ccCloudPost({code, op:'put', key:k, data:await ccCloudPack(raw), info:ccCloudInfo(k, raw), at:Date.now()}); sent[k]=sig; }catch(e){}
        continue;
      }
      await ccCloudPost({code, op:'put', key:k, data:await ccCloudPack(raw), info:ccCloudInfo(k, raw), at:Date.now()});
      sent[k]=sig;
    }
    // Слот удалён здесь — удаляется и в облаке, иначе на другом устройстве он вернулся бы.
    for(const k of Object.keys(sent)){
      if(k==='_at' || keys.indexOf(k)>=0) continue;
      await ccCloudPost({code, op:'del', key:k}); delete sent[k];
    }
    sent._at=Date.now();
    try{ localStorage.setItem(CC_CLOUD_SENT, JSON.stringify(sent)); }catch(e){}
    CC_CLOUD_MSG=''; CC_CLOUD_AGAIN=false;
  }catch(e){
    /* iPhone обрывает запрос свёрнутой вкладки («Load failed», Notion 23.10): это не отказ облака. Ошибку не
       показываем, а при возврате на вкладку отправляем снова (CC_CLOUD_AGAIN), как и обещает надпись. */
    CC_CLOUD_AGAIN=true;
    if(!(typeof document!=='undefined' && document.visibilityState==='hidden')) CC_CLOUD_MSG=String(e && e.message || e);
  }
  finally{ CC_CLOUD_BUSY=false; ccCloudDraw(); }
}
function ccCloudSoon(){
  if(!ccCloudCode()) return;
  clearTimeout(CC_CLOUD_T);
  CC_CLOUD_T=setTimeout(()=>{ ccCloudPush(); }, 45000);
}
try{ document.addEventListener('visibilitychange', ()=>{
  if(document.visibilityState==='hidden' && CC_CLOUD_T){ clearTimeout(CC_CLOUD_T); CC_CLOUD_T=null; ccCloudPush(); }
  else if(document.visibilityState==='visible' && CC_CLOUD_AGAIN){ CC_CLOUD_AGAIN=false; ccCloudPush(); }
}); }catch(e){}
// Панель на экране выбора карьеры.
function ccCloudDraw(){
  const box=document.getElementById('ccCloud'); if(!box) return;
  const T=L(), code=ccCloudCode();
  if(!ccCloudBase()){ box.hidden=true; return; }
  box.hidden=false;
  let h='<div class="cl-head"><b>☁ '+esc(T.clTitle)+'</b>';
  if(code){
    const sent=ccCloudSent();
    const when=sent._at ? new Date(sent._at).toLocaleString(LANG==='ru' ? 'ru-RU' : LANG, {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'}) : '-';
    /* Код закрыт точками (28.10, его «скрой цифры облака, вдруг на стриме кто-то покажет»): показать — на 10 секунд,
       скопировать — не показывая. */
    h+='<span>'+esc(T.clOn)+'</span></div><div class="cl-code'+(CC_CLOUD_SHOW ? '' : ' cl-hid')+'">'+esc(CC_CLOUD_SHOW ? ccCloudFmt(code) : ccCloudFmt(code.replace(/./g, '•')))+'</div>'+
       '<div class="cl-row"><button class="cc-car-open" onclick="ccCloudShow()">'+esc(CC_CLOUD_SHOW ? T.clHide : T.clShow)+'</button>'+
       '<button class="cc-car-open" onclick="ccCloudCopy()">'+esc(CC_CLOUD_COPIED ? T.clCopied : T.clCopy)+'</button></div>'+
       '<p class="cl-sub">'+esc(T.clKeep)+'</p><p class="cl-sub">'+esc(T.clSent(when))+(CC_CLOUD_BUSY ? ' · '+esc(T.clBusy) : '')+'</p>'+
       '<div class="cl-row"><button class="cc-car-open" onclick="ccCloudPush()">'+esc(T.clPushNow)+'</button>'+
       '<button class="cc-car-open" onclick="ccCloudEnter()">'+esc(T.clOther)+'</button>'+
       '<button class="cc-car-open" onclick="ccCloudOff()">'+esc(T.clOff)+'</button></div>';
  } else {
    h+='<span>'+esc(T.clOffNow)+'</span></div><p class="cl-sub">'+esc(T.clWhy)+'</p>'+
       '<div class="cl-row"><button class="ch-play" onclick="ccCloudOn()">'+esc(T.clEnable)+'</button>'+
       '<button class="cc-car-open" onclick="ccCloudEnter()">'+esc(T.clHave)+'</button></div>';
  }
  if(CC_CLOUD_ENTER){
    h+='<div class="cl-enter"><input id="ccCloudIn" type="password" maxlength="24" placeholder="XXXX-XXXX-XXXX-XXXX" autocapitalize="characters" autocomplete="off" spellcheck="false">'+
       '<button class="ch-play" onclick="ccCloudOpen()">'+esc(T.clOpen)+'</button></div>';
  }
  if(CC_CLOUD_LIST){
    const rows=CC_CLOUD_LIST.saves.map(sv=>{ let i={}; try{ i=JSON.parse(sv.info||'{}'); }catch(e){}
      return '<li><b>'+esc(i.name||sv.key)+'</b><span>'+esc((i.kind==='mgr' ? T.clMgr : i.kind==='profile' ? ccMeT().title : T.clCareer)+(i.day ? ' · '+i.day : '')+(i.earn ? ' · $'+ccNum(i.earn) : ''))+'</span></li>'; }).join('');
    h+='<div class="cl-list"><p class="cl-sub">'+esc(T.clFound(CC_CLOUD_LIST.saves.length))+'</p><ul>'+rows+'</ul>'+
       (CC_CLOUD_LIST.saves.length ? '<button class="ch-play" onclick="ccCloudRestore()">'+esc(CC_CLOUD_ARM ? T.clSure : T.clTake)+'</button>' : '')+'</div>';
  }
  if(CC_CLOUD_MSG) h+='<p class="cl-err">'+esc(T.clErr(CC_CLOUD_MSG))+'</p>';
  box.innerHTML=h;
}
let CC_CLOUD_SHOW=false, CC_CLOUD_COPIED=false, CC_CLOUD_SHOW_T=null;
function ccCloudShow(){
  CC_CLOUD_SHOW=!CC_CLOUD_SHOW; clearTimeout(CC_CLOUD_SHOW_T);
  if(CC_CLOUD_SHOW) CC_CLOUD_SHOW_T=setTimeout(function(){ CC_CLOUD_SHOW=false; ccCloudDraw(); }, 10000);
  ccCloudDraw();
}
function ccCloudCopy(){
  const t=ccCloudFmt(ccCloudCode()); if(!t) return;
  const done=function(){ CC_CLOUD_COPIED=true; ccCloudDraw(); setTimeout(function(){ CC_CLOUD_COPIED=false; ccCloudDraw(); }, 2000); };
  try{ navigator.clipboard.writeText(t).then(done, function(){}); }catch(e){}
}
function ccCloudOn(){
  try{ localStorage.setItem(CC_CLOUD_LS, ccCloudNewCode()); localStorage.removeItem(CC_CLOUD_SENT); }catch(e){}
  CC_CLOUD_MSG=''; ccCloudDraw(); ccCloudPush();
}
function ccCloudOff(){
  try{ localStorage.removeItem(CC_CLOUD_LS); localStorage.removeItem(CC_CLOUD_SENT); }catch(e){}
  CC_CLOUD_LIST=null; CC_CLOUD_ENTER=false; ccCloudDraw();
}
function ccCloudEnter(){ CC_CLOUD_ENTER=!CC_CLOUD_ENTER; CC_CLOUD_LIST=null; CC_CLOUD_ARM=false; ccCloudDraw(); try{ document.getElementById('ccCloudIn').focus(); }catch(e){} }
async function ccCloudOpen(){
  const el=document.getElementById('ccCloudIn');
  const code=String(el ? el.value : '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if(!/^[A-HJ-NP-Z2-9]{16}$/.test(code)){ CC_CLOUD_MSG=L().clBad; ccCloudDraw(); return; }
  try{ const j=await ccCloudPost({code, op:'list'}); CC_CLOUD_LIST={code, saves:j.saves||[]}; CC_CLOUD_MSG=''; CC_CLOUD_ARM=false; }
  catch(e){ CC_CLOUD_MSG=String(e && e.message || e); }
  ccCloudDraw();
}
// Забрать всё из облака: два нажатия — сейвы этого браузера с теми же ключами заменяются.
async function ccCloudRestore(){
  if(!CC_CLOUD_LIST) return;
  if(!CC_CLOUD_ARM){ CC_CLOUD_ARM=true; ccCloudDraw(); return; }
  const {code, saves}=CC_CLOUD_LIST, sent={};
  try{
    for(const sv of saves){
      const j=await ccCloudPost({code, op:'get', key:sv.key});
      const raw=await ccCloudUnpack(j.data);
      localStorage.setItem(sv.key, raw);
      sent[sv.key]=raw.length+':'+ccHashStr(raw);
    }
    sent._at=Date.now();
    localStorage.setItem(CC_CLOUD_LS, code);
    localStorage.setItem(CC_CLOUD_SENT, JSON.stringify(sent));
    CC_CLOUD_LIST=null; CC_CLOUD_ENTER=false; CC_CLOUD_ARM=false; CC_CLOUD_MSG='';
    CAREER=null;
    try{ careerRenderSlots(); }catch(e){}
    try{ homeRender(); }catch(e){}
  }catch(e){ CC_CLOUD_MSG=String(e && e.message || e); }
  ccCloudDraw();
}
/* ВКЛАДКА СО СТАРОЙ КАРЬЕРОЙ НЕ ПИШЕТ ПОВЕРХ НОВОЙ (Notion 22.10, игрок: «вышел и зашёл — карьеру отбросило к началу
   сезона»). Две вкладки одного слота (или проснувшаяся из кэша страница телефона) держат каждая свой CAREER, и
   любое сохранение старой стирало прогресс новой. Каждая запись ставит рядом с сейвом отметку <слот>_w (вкладка и
   счётчик); вкладка помнит свою. Отметка в хранилище чужая — слот переписан другой вкладкой: эта не пишет, а
   перечитывает сейв (перезагрузка), как только не идёт вечер. */
// var без значений: careerLoad может прийти раньше этой строки, а let/const там бросили бы (TDZ) и отметка не встала бы.
var CC_TAB_ID, CC_SAVE_MARK, CC_SAVE_N, CC_TAB_STALE;
function ccSaveMarkKey(){ return LS_SLOT(ccSlotMine())+'_w'; }
function ccSaveMarkAdopt(){ try{ CC_SAVE_MARK=localStorage.getItem(ccSaveMarkKey()); }catch(e){ CC_SAVE_MARK=null; } CC_TAB_STALE=false; }
function ccSaveStale(){
  if(CC_TAB_STALE) return true;
  let now=null; try{ now=localStorage.getItem(ccSaveMarkKey()); }catch(e){ return false; }
  if(now && CC_SAVE_MARK!==undefined && now!==CC_SAVE_MARK) CC_TAB_STALE=true;
  return CC_TAB_STALE;
}
function ccSaveStaleReload(){
  if(!CAREER || CAREER._mgr || !ccSaveStale()) return;
  if(typeof CAREER_RUN!=='undefined' && CAREER_RUN) return;
  location.reload();
}
try{
  document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='visible') ccSaveStaleReload(); });
  window.addEventListener('pageshow', ()=>{ ccSaveStaleReload(); });
}catch(e){}
/* МЕСТО ПОД СЕЙВ — СНАЧАЛА БЕЗ ПОТЕРЬ (Notion 26.10, игрок: «3 дня не играли… в карьере 1 сентября закончили, сейчас
   17 августа»; журнал поломок 22.10 — QuotaExceededError, командная 2019, день 08-18). Сжатие своего сейва не спасало:
   квоту съели ДРУГИЕ слоты — карьеры и менеджеры, лежащие обычным JSON, — и снимки отмены каждого слота. Уровень 1:
   чужие слоты пересжимаются (без потерь, с проверкой распаковкой) и убираются чужие снимки отмены; уровень 2 — свой
   снимок отмены. Резать своё (CC_SAVE_TRIM) — только после этого. Сторож tools/check-career-save-room.js. */
function ccSaveMakeRoom(own, level){
  if(typeof LZString==='undefined') return false;
  let freed=false;
  const keys=[];
  try{ for(let i=0;i<localStorage.length;i++) keys.push(localStorage.key(i)); }catch(e){ return false; }
  keys.forEach(k=>{
    if(!k || k===own) return;
    try{
      if(/_undo$/.test(k)){
        if(level>=2 || k!==own+'_undo'){ localStorage.removeItem(k); freed=true; }
        return;
      }
      if(!/^fncsdraft_(career|manager)/.test(k) || /_(w|unread|undo)$/.test(k)) return;
      const raw=localStorage.getItem(k);
      if(!raw || raw.length<60000 || raw.slice(0, 3)===CC_SAVE_LZ) return;
      const z=LZString.compressToUTF16(raw);
      if(z.length+3>=raw.length || LZString.decompressFromUTF16(z)!==raw) return;
      localStorage.setItem(k, CC_SAVE_LZ+z); freed=true;
    }catch(e){}
  });
  return freed;
}
/* СЖАТИЕ В ФОНЕ (Notion 9.11, игрок на ПК: «если тренируюсь, жду 2–4 секунды… в новой карьере лагов нет»). Большой сейв
   не влезает обычным JSON и каждое сохранение сжималось lz-string прямо на клике (замер: 9 мс → 100–180 мс, на слабом ПК
   в разы дольше), а перед этим ещё раз пробовалась заведомо не влезающая запись. Теперь слот, раз ушедший в сжатие, сразу
   идёт в сжатие, а сжимает воркер: на клике остаётся только JSON.stringify. Очередь по ключу хранит последнее состояние,
   старые задачи не досчитываются. Уход со страницы и чтение слота дописывают очередь синхронно. */
var CC_LZ_ON={}, CC_LZ_SYNC=false, CC_LZ_Q={}, CC_LZ_W, CC_LZ_BUSY=null, CC_LZ_N=0;
function ccLzWorker(){
  if(CC_LZ_W!==undefined) return CC_LZ_W;
  CC_LZ_W=null;
  try{
    if(typeof Worker==='undefined' || typeof Blob==='undefined' || typeof URL==='undefined') return null;
    let src=null;
    for(const s of document.scripts){ const t=s.textContent||''; if(t.length<20000 && t.indexOf('var LZString=function')>=0){ src=t; break; } }
    if(!src) return null;
    const url=URL.createObjectURL(new Blob([src+'\n;onmessage=function(e){postMessage({key:e.data.key,n:e.data.n,z:LZString.compressToUTF16(e.data.json)});};'], {type:'text/javascript'}));
    const w=new Worker(url);
    w.onmessage=e=>ccLzDone(e.data);
    w.onerror=()=>{ CC_LZ_W=null; CC_LZ_BUSY=null; ccLzFlush(); };
    CC_LZ_W=w;
  }catch(e){ CC_LZ_W=null; }
  return CC_LZ_W;
}
function ccLzPut(key, json, write){
  CC_LZ_Q[key]={n:++CC_LZ_N, json:json, write:write};
  if(!ccLzWorker()) return ccLzFlush(key);
  ccLzKick();
}
function ccLzKick(){
  if(CC_LZ_BUSY || !CC_LZ_W) return;
  const key=Object.keys(CC_LZ_Q)[0]; if(!key) return;
  const j=CC_LZ_Q[key]; CC_LZ_BUSY={key:key, n:j.n};
  try{ CC_LZ_W.postMessage({key:key, n:j.n, json:j.json}); }catch(e){ CC_LZ_BUSY=null; ccLzFlush(); }
}
function ccLzDone(d){
  CC_LZ_BUSY=null;
  const j=d && CC_LZ_Q[d.key];
  if(j && j.n===d.n){ delete CC_LZ_Q[d.key]; try{ j.write(d.z); }catch(e){} }
  ccLzKick();
}
// key не задан — вся очередь. Синхронно: перед уходом со страницы и перед чтением слота.
function ccLzFlush(key){
  Object.keys(CC_LZ_Q).forEach(k=>{
    if(key && k!==key) return;
    const j=CC_LZ_Q[k]; delete CC_LZ_Q[k];
    try{ j.write(LZString.compressToUTF16(j.json)); }catch(e){}
  });
}
function ccLzDrop(key){ delete CC_LZ_Q[key]; }
try{
  const out=()=>{ if(CC_TAB_STALE) CC_LZ_Q={}; else ccLzFlush(); };
  window.addEventListener('pagehide', out);
  window.addEventListener('beforeunload', out);
  document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='hidden') out(); });
}catch(e){}
const CC_FF_SAVE_DAYS=7;
function careerSave(){
  if(!CAREER) return;
  if(CAREER._mgr){ if(typeof mgrSave==='function') mgrSave(); return; }   // теневая карьера Fortnite Manager
  if(ccSaveStale()){ if(typeof console!=='undefined') console.warn('career save skipped: the slot was written by another tab'); ccSaveStaleReload(); return; }
  try{ if(typeof ccLockerCheck==='function') ccLockerCheck(); }catch(e){}
  try{ if(typeof ccBpCheck==='function') ccBpCheck(); }catch(e){}
  try{ if(typeof ccPirateCheck==='function') ccPirateCheck(); }catch(e){}
  // Экран карьер читает сейв не загружая его — пусть знает, есть ли у карьеры дивизионы сейчас.
  try{ if(CAREER.career) CAREER.career.noDiv=!!ccNoDivisions(); }catch(e){}
  try{ ccNightStamp(); }catch(e){}
  /* В командной карьере командная половина живёт на сервере, а не здесь.
     Пишется всё равно всё: localStorage — это кэш на случай обрыва, и карьера
     должна открыться, даже когда лобби недоступно. Наверх уходит только
     командная часть, и делает это mp.js по своему поводу. */
  // CC_MP_ADVANCE здесь значит «мы сейчас применяем ЧУЖОЕ состояние»: его
  // отправка обратно закольцевала бы двоих на одном и том же снимке.
  /* Посреди вечера командное состояние НЕ отправляется.

     Пока идёт вечер, оба считают его сами, шаг в шаг, под одним сидом; итог
     сводит сервер в конце (ccMpClose). Присланное в середине состояние
     применяется у напарника немедленно — а ccApplyTeamState выбрасывает кэши
     мира (ccWorldReset). То есть один игрок сохранился, а у второго посреди
     игры пересобралась сцена: дальше это уже разные вечера.

     Признак «идёт вечер» — подменённый генератор: он ставится на старте и
     снимается на закрытии (CC_MP_RAND). */
  if(!CC_MP_RAND && typeof ccMXCanStamp==='function') ccMXCanStamp();
  if(ccMpOn() && !CC_MP_ADVANCE && !CC_MP_RAND && !CC_MP_HOLD && typeof MP!=='undefined' && MP.push)
    MP.push(ccTeamState());
  try{ ccBoardSoon(); }catch(e){}
  /* Перемотка календаря (22.11, его «не ждать по несколько минут»): за 90 дней было ~600 записей сейва под мегабайт,
     на iPhone это заметно. Проверки выше идут каждый раз (оценка вечера в журнал, шкафчик, пасс), а сама запись -
     раз в CC_FF_SAVE_DAYS игровых дней и в конце перемотки (её finally зовёт careerSave при CC_FF=null).
     В команде и гонке - как было: там сейв часть синхронизации. */
  if(typeof CC_FF!=='undefined' && CC_FF && !ccMpOn() && !(typeof ccRaceFfOn==='function' && ccRaceFfOn())){
    const d=careerToday();
    if(CC_FF.savedOn && ccDaysBetween(CC_FF.savedOn, d)<CC_FF_SAVE_DAYS) return;
    CC_FF.savedOn=d;
  }
  const key=LS_SLOT(ccSlotMine());   // в свой слот, а не в тот, куда указывает другая вкладка
  /* НЕ ВЛЕЗЛО — СЖАТЬ, А НЕ РЕЗАТЬ (его скрин 1.10, iPhone: «This career is not being saved
     (QuotaExceededError)»). Safari даёт сайту около 5 МБ, строки там по два байта, а полгода карьеры —
     миллион символов (журнал игроков, PR, деньги, Мейджор), и слотов несколько. Сжатый сейв (lz-string)
     в ~7 раз меньше; пишется только когда обычный не влез, чтобы пробы и инструменты читали JSON как
     раньше. Обрезка (CC_SAVE_TRIM) — уже после сжатия. */
  let lz=false, room=0;
  for(let step=0; step<=CC_SAVE_TRIM.length; step++){
    try{
      const json=JSON.stringify(CAREER);
      if(!lz && CC_LZ_ON[key] && typeof LZString!=='undefined') lz=true;   // этот слот уже не влезал — сразу в сжатие
      if(!lz){ try{ localStorage.setItem(key, json); ccLzDrop(key); }
               catch(e1){ if(!/quota|exceed/i.test(String(e1&&e1.name||e1)) || typeof LZString==='undefined') throw e1; lz=true; } }
      if(lz){
        // В фон — только слот, уже писавшийся сжатым; первый раз, после чистки места и обрезки (room, step) — синхронно,
        // чтобы нехватку места увидел этот цикл.
        if(CC_LZ_ON[key] && step===0 && !room && !CC_LZ_SYNC)
          ccLzPut(key, json, z=>{ try{ localStorage.setItem(key, CC_SAVE_LZ+z); }
                                  catch(e2){ CC_LZ_SYNC=true; if(CAREER && !CAREER._mgr && LS_SLOT(ccSlotMine())===key) careerSave(); } });
        else { ccLzDrop(key); localStorage.setItem(key, CC_SAVE_LZ+LZString.compressToUTF16(json)); CC_LZ_ON[key]=1; }
      }
      try{ if(!CC_TAB_ID) CC_TAB_ID=Math.random().toString(36).slice(2, 10); CC_SAVE_N=(CC_SAVE_N||0)+1;
           const mk=CC_TAB_ID+':'+CC_SAVE_N; localStorage.setItem(ccSaveMarkKey(), mk); CC_SAVE_MARK=mk; }catch(e){}
      CC_SAVE_FAIL=null;
      careerSaveWarn();
      try{ ccCloudSoon(); }catch(e){}
      return;
    }catch(e){
      CC_SAVE_FAIL=String(e&&e.name||e);
      // Out of room rather than broken: give something up and write it again.
      // Anything else is not a size problem and trimming will not fix it.
      if(!/quota|exceed/i.test(CC_SAVE_FAIL)) break;
      // Сначала место за счёт чужого, без потерь (ccSaveMakeRoom) — тот же шаг ещё раз.
      let made=false;
      while(room<2 && !made){ room++; made=ccSaveMakeRoom(key, room); }
      if(made){ step--; continue; }
      if(step===CC_SAVE_TRIM.length) break;
      if(!CC_SAVE_TRIM[step](CAREER.career)) continue;
    }
  }
  if(typeof console!=='undefined') console.warn('career save failed: '+CC_SAVE_FAIL);
  careerSaveWarn();
}
/* And it says so on the screen, not only in the console.

   A console warning is a warning nobody reads. The player's report, 17 August:
   "the saves do not work" — and everything after that point was a career being
   played on a save that was never being written, which reads from the inside as
   the day resetting itself every time the page is opened. */
function careerSaveWarn(){
  const old=document.getElementById('ccSaveFail');
  if(!CC_SAVE_FAIL){ if(old) old.remove(); return; }
  try{ ccErrLog('save', CC_SAVE_FAIL); }catch(e){}
  const box=old || document.createElement('div');
  box.id='ccSaveFail'; box.className='cc-save-fail';
  box.textContent=L().ccSaveFail(CC_SAVE_FAIL);
  if(!old) document.body.appendChild(box);
}
function careerExists(){
  try{ return !!localStorage.getItem(LS_SLOT(ccSlotMine())); }catch(e){ return false; }
}

// The season, week by week. Division 1 is the only division with a weekly
// Performance Evaluation and the only one whose cup has a Weekly Final, so the
// same week reads differently depending on where you are standing.
//
// CAREER_WEEKS moved down to the clock and became the measured year's own
// forty-three. This still walks weeks because the ladder is weekly — a cup runs
// Monday and Tuesday and those are two windows of one tournament, not two.
function careerSchedule(){
  const div=CAREER && CAREER.career ? CAREER.career.division : 5;
  const out=[];
  for(let w=1;w<=CAREER_WEEKS;w++){
    if(w===5)  { out.push({w, type:'major', title:L().chEvMajor1, sub:L().chEvMajor1Sub}); continue; }
    if(w===10) { out.push({w, type:'major', title:L().chEvMajor2, sub:L().chEvMajor2Sub}); continue; }
    if(w===11) { out.push({w, type:'gc',    title:L().chEvGC,     sub:L().chEvGCSub});     continue; }
    out.push({w, type:'cup',
      title:L().chEvCup.replace('{N}', div),
      sub: div===1 ? L().chEvCupSubD1 : L().chEvCupSub});
  }
  return out;
}
// What the button below leads to: the first thing this week actually holds,
// read off the calendar rather than asked of a schedule. A week with nothing in
// it says so, and the button offers to move past it instead of pretending.
/* What today is.

   It used to answer for the week — the first thing the week held, whichever day
   it fell on — which was right while the clock jumped a week at a time and
   wrong the moment it started walking. On a Wednesday it kept showing Monday's
   cup, so a free day never arrived and the day never got to ask its question.

   Today, then, and nothing else. A day with nothing on it is 'free', which is
   what puts the day's own panel where the match card goes. */
// What a day is about when it holds more than one thing. 13 June is both a
// Victory Cup and a Division 1 Weekly Final; taking whichever the calendar
// happened to push first hid the final the player had spent a week earning.
//
// A Victory Cup outranks a Reload day but not the ladder: the ladder is what the
// career is for, and a day holding both is a ladder day.
/* Про-Ам — выше кубков: 12.07 и 6.09 — воскресенья, и в тот же день стоит Victory Cup; без ранга
   Про-Ам шёл последним, careerNext брал Victory Cup, и принятое приглашение было не сыграть
   (сторож check-career-proam-zb 9.09: «Duos Victory Cup» вместо Сан-Паулу). Играется он только по
   принятому письму (careerProAmCan), иначе день остаётся за Victory Cup. */
const CC_KIND_RANK=['globals','gc','summit','major','proam','nations','cup','final','eval','victory','reload'];
/* What the tile on the hub is actually looking at.

   His question, 17 August: why does it say 11 games when it plays 12. Because it
   said eleven whatever was next - the panel printed CAREER_CUP_GAMES and
   "careerCupCut of careerCupSize" no matter which event it was announcing, and
   those are the divisional cup's numbers. The cup was the only event that
   existed when the panel was written and nothing revisited it as the circuit
   grew, so a Reload final - eight games, twenty duos, three seats - announced
   itself as eleven games and fifty out of a hundred and fifty.

   Read off the same tables the runners read, so a number here can only be wrong
   if it is wrong where it is played. An Opens says the real open's numbers, the
   same ones its card and its standings say: see ccOpenScale. */
function ccNextShape(next){
  const cr=CAREER && CAREER.career;
  const div=cr ? cr.division : 5;
  const cup={games:CAREER_CUP_GAMES, cut:careerCupCut(div), of:careerCupSize(div)};
  const k=next && next.type;
  // In this season's teams, the way the runners read the same tables. Without
  // it the card over a trio night promised a room of fifty and a cut of
  // twenty-five and the night played thirty-three and seventeen.
  const stage=(tbl, ev)=>{ const st=ev && ccScaleStage(tbl[ev.stage]);
    return st ? {games:st.games, cut:st.cut, of:st.field} : cup; };
  if(k==='reload'){
    const ev=careerReloadOn(careerToday());
    const st=ev && ccScaleStage(CC_RELOAD_STAGE[ev.stage]);
    if(!st) return cup;
    return ev.stage==='open'
      ? {games:st.games, cut:ccOpenAdvanceNow(), of:ccOpenTrue()}
      : {games:st.games, cut:st.cut, of:st.field};
  }
  if(k==='major')   return stage(CC_MAJOR_STAGE, careerMajorOn(careerToday()));
  if(k==='summit')  return stage(CC_SUMMIT_STAGE, careerSummitOn(careerToday()));
  // The Weekly Final pays its top ten, which is the line the card draws.
  if(k==='final')   return {games:CC_WF_GAMES, cut:10, of:ccTeams(CAREER_CUP_CUT)};
  if(k==='eval')    return {games:ccEvalR1Games(), cut:ccTeams(CC_EVAL_CUT), of:ccTeams(CAREER_CUP_FIELD)};
  if(k==='victory'){
    // A Victory Cup runs solo or duo depending on the day, and the two are
    // different rooms - twice the entrants and twice the cut in solo.
    const ev=(careerYearDays().get(careerToday())||[]).find(e=>e.kind==='victory');
    const solo=!!(ev && ev.mode==='solo');
    const vc=ev ? ccCupScore(ev, 1) : null;
    return {games:(vc && vc.cap>0 && vc.cap<=15) ? vc.cap : CC_VICTORY_R1_GAMES, cut:careerVictoryCut(solo),
            of:careerVictoryField(solo)};
  }
  if(k==='globals') return {games:CC_GLOB_GAMES, cut:0, of:ccGlobField()};
  /* Кубок наций своей ветки не имел и падал в дивизионный кубок: финал в Катовице показывал «матч 1 из 11»
     и «50 проходят из 190» (Notion «19.10», скрин 16). Числа — те же, что читает runCareerNations:
     отбор — соло до ста человек, проходит один; квалификация — своя комната зоны и её квота; финал — 12 игр. */
  if(k==='nations'){
    try{
      const ev=careerNationsOn(careerToday()), st=ccNatStage(ev), S=CC_NATIONS[st], mine=ccNationsMine();
      if(st==='final') return {games:S.games, cut:0, of:CC_NATIONS_FIELD};
      if(st==='trial') return {games:S.games, cut:1, of:1+Math.min(99, Math.max(0, ((mine && mine.others)||[]).length-(CC_NATIONS_SQUAD-1)))};
      const lobbies=ccNatQualLobbies(mine.zone, mine);
      let at=0; lobbies.forEach((l,i)=>{ if(l.length<lobbies[at].length) at=i; });
      return {games:S.games, cut:ccNatSlotsOf(mine.zone, lobbies, at), of:lobbies[at].length+1};
    }catch(e){ return cup; }
  }
  /* Solo Series своей ветки не имела и падала в дивизионный кубок: скриншот
     30 августа, страница «playin» — «33 проходят из 113, матч 1 из 11» над
     квалом, который играет 4900 человек, десять игр и топ-100. Вопрос:
     «почему 33 из 113, разве так у Epic Solo Series работает?». Цифры — те
     же, что читает раннер (runCareerSoloSeries). */
  if(k==='solo'){
    const ev=careerSoloSeriesOn(careerToday());
    // FNCS Solos носит свои числа на самой стадии — та же таблица, что читает
    // раннер, чтобы плитка дня и вечер не расходились.
    if(ev && ev.spec) return {games:ev.spec.games, cut:ccSolosCut(ev.spec),
                              of:ev.spec.open ? careerVictoryField(true) : ev.spec.field};
    const st=ev ? ev.stage : 'qual';
    if(st==='heats') return {games:CC_SOLO_HEAT_GAMES, cut:soloSeriesHeatCut(), of:CC_SOLO_FIELD};
    if(st==='final') return {games:CC_SOLO_FINAL_GAMES, cut:0, of:CC_SOLO_FIELD};
    return {games:CC_SOLO_QUAL_GAMES, cut:soloSeriesQualCut(), of:careerVictoryField(true)};
  }
  if(k==='gc'){
    /* Two different tournaments share this kind — the Last Chance and the
       Championship in Paris — and this branch answered for neither.

       careerRcOn returns {stage, label}, and the three tests below compared it
       against a string, so none of them ever matched and both events fell
       through to the divisional cup at the bottom: Paris announced itself as
       eleven games and two hundred teams with a top fifty, against the ten
       games, forty duos and top seven it actually is. It had always done that;
       nothing read the shape until the next-up card asked it to. */
    const lc=careerGclcOn(careerToday());
    if(lc) return lc.final
      ? {games:CC_GCLC_FINAL.games, cut:0, of:ccTeams(CC_GCLC_FINAL.teams)}
      : {games:(CC_GCLC_ROUND[lc.round]||{}).games,
         cut:ccTeams((CC_GCLC_ROUND[lc.round]||{}).cut), of:ccTeams(CAREER_CUP_FIELD)};
    const g=careerRcOn(careerToday());
    const st=g && g.stage;
    // Two pools of twenty is a field of forty, which is what a player is in.
    if(st==='group')    return {games:CC_RC_GROUP.games, cut:ccTeams(CC_RC_GROUP.direct), of:ccTeams(CC_RC_GROUP.teams*2)};
    if(st==='survival') return {games:CC_RC_SURV.games,  cut:ccTeams(CC_RC_SURV.cut),     of:ccTeams(CC_RC_SURV.teams)};
    if(st==='final')    return {games:CC_RC_FINAL.games, cut:0,                           of:ccTeams(CC_RC_FINAL.teams)};
  }
  return cup;
}
function careerNext(){
  const days=careerEvents(), today=careerToday();
  for(let d=0; d<1; d++){
    let on=days.get(today)||[];
    if(on.length>1){
      /* ЛАН в тот же день, что кубок или Performance Evaluation, — значительнее их (правило 30.08 «оставить, где больше
         призов или значительный»; проба всех капов 9.10: Games of the Future 18.12.2025 уступал оценке недели). Ранг — как
         у Про-Ама; без приглашения день, как и раньше, отходит следующему играбельному вечеру. */
      const lanToday=(()=>{ try{ const v=careerVictoryOn(today); return !!(v && v.lan); }catch(e){ return false; } })();
      const rank=e=>{ const i=CC_KIND_RANK.indexOf(e.kind==='victory' && lanToday ? 'proam' : e.kind); return i<0 ? 99 : i; };
      const sorted=on.slice().sort((a,b)=>rank(a)-rank(b));
      // Something enterable beats something merely important: a day that offers a
      // Major nobody can play and a final they can should offer the final.
      /* В КОМАНДЕ — всегда СТАРШИЙ турнир дня, без оглядки на «могу ли я».
         «Могу» у двоих разное: напарник, отыгравший свою соло-сессию, получал
         от того же дня Reload, второй — соло-квал, оба жали «Играть», и
         вечер вставал на два разных турнира («field …m2.58.n4900h59+59 vs
         …r1.15.n900h68», его страница «баги», 30 августа, 2fbbde90; жалобы
         игроков — «разные капы играют»). Отзыв: «в один день запретить
         2 капа, оставить где больше призов или значительный». Старший — по
         CC_KIND_RANK; кто в него не может, видит причину на кнопке, а день
         уходит перемоткой по двум подтверждениям. Одиночная — как была. */
      /* И В ОДИНОЧНОЙ — тоже старший (23.10, его «пусть играется всегда турнир, который важнее, если в один день»; игрок:
         «пишет квал Мейджора 1, а играется соло-VCC» — финал Мейджора 1 4.03.2023 и Solo Cash Cup 9 в один день, не
         прошедшему в финал давался кап). Не прошёл — причина на кнопке, день уходит перемоткой. */
      /* Кроме явного выбора: в одиночной кап дня (ЗБ-сквады по субботам рядом с Weekly Final), выбранный кнопкой,
         играется вместо старшего. В команде и гонке выбора нет (ccVictoryLocked). */
      const vp=!ccVictoryLocked() && CAREER && CAREER.career && CAREER.career.vpick && CAREER.career.vpick[today];
      const chosen=vp ? on.find(e=>e.kind==='victory' && e.id===vp) : null;
      // Ноябрь 2026-го: этап Solo Reload, куда игрок прошёл, старше Trios Cash Cup того же дня. Не прошёл, значит кап.
      const soloNow=(!chosen && ccS43Trios(today)) ? on.find(e=>e.kind==='solo' && careerCanPlayKindOn(today, 'solo')) : null;
      /* Без выбора играется главное событие дня, а не кап рядом с ним: 'solo' нет в CC_KIND_RANK (ранг 99), и консольные
         капы и Mobile Series, которые с 14–15.11 стоят в дни Solo Series и Reload, забирали день, хотя горела кнопка главного,
         а её нажатие ничего не меняло. ЛАН и ноябрьский Trios Cash Cup (ccS43Trios) по-прежнему решают сами. */
      on=[chosen || soloNow || (lanToday || ccS43Trios(today) ? null : sorted.find(e=>e.kind!=='victory' && e.kind!=='gala')) || sorted[0]];
    }
    if(on.length && on[0].kind==='victory'){
      const v=careerVictoryOn(today), hit=v && (days.get(today)||[]).find(e=>e.kind==='victory' && e.id===v.id);
      if(hit) on=[hit];
    }
    if(on.length){
      const div=CAREER && CAREER.career ? CAREER.career.division : 5;
      // The tournament's own name, not the name of the window it opens in.
      // "Round 1" is which evening this is; the panel's headline is what the
      // player is entering, and the round is already said above it.
      const title = on[0].kind==='cup' ? L().chEvCup.replace('{N}', div) : on[0].label;
      /* id события едет вместе с видом. Вид врёт там, где под одним словом
         лежат разные турниры: 'solo' носят и январская Solo Series, и FNCS
         Solos, а обложка у них разная. Клетка календаря знала id всегда, а
         карточка карьеры — нет, и брала запасную. См. ccEventArt. */
      return {type:on[0].kind, id:on[0].id, title:title, label:on[0].label,
              sub:(L().ccYearSub && L().ccYearSub[on[0].kind])||'',
              day:today};
    }
  }
  return {type:'free', title:L().chDayFree, sub:L().chDayFreeSub, day:today};
}

/* Календарный год сезона N этой карьеры — для подписи на карточке. Карьера 2026-го:
   2026, 2027…; 2025-го: 2025, потом 2026…; 2024-го: 2024, 2025, потом 2026… */
function ccSeasonYearOf(s){
  const cr=CAREER && CAREER.career; const y0=(cr && cr.year0) || 2026; s=s||1;
  if(y0===2025) return s<=1 ? 2025 : 2026+(s-2);
  if(y0===2024) return s<=1 ? 2024 : s===2 ? 2025 : 2026+(s-3);
  if(y0===2020) return s<=1 ? 2020 : s===2 ? 2021 : s===3 ? 2022 : s===4 ? 2023 : s===5 ? 2024 : s===6 ? 2025 : 2026+(s-7);
  if(y0===2019) return s<=1 ? 2019 : s===2 ? 2020 : s===3 ? 2021 : s===4 ? 2022 : s===5 ? 2023 : s===6 ? 2024 : s===7 ? 2025 : 2026+(s-8);
  if(y0===2021) return s<=1 ? 2021 : s===2 ? 2022 : s===3 ? 2023 : s===4 ? 2024 : s===5 ? 2025 : 2026+(s-6);
  if(y0===2022) return s<=1 ? 2022 : s===2 ? 2023 : s===3 ? 2024 : s===4 ? 2025 : 2026+(s-5);
  if(y0===2023) return s<=1 ? 2023 : s===2 ? 2024 : s===3 ? 2025 : 2026+(s-4);
  return 2026+(s-1);
}
/* ЛУЧШИЙ ВЕЧЕР КАРЬЕРЫ — строкой события на карточке.

   Игрок (Notion, пункт 3): карточка карьеры звала себя «FNCS Division 1», что бы
   ни было сыграно — финал Мейджора, Саммит, Глобалы. У настоящей карточки строка события —
   тот турнир, откуда её число; у карьеры это её лучший вечер: по рангу турнира (Глобалы >
   Саммит > финал Мейджора > Париж > Ласт Ченс > финал Reload > финал недели > соло/Про-Ам/
   Victory/оценка > кубок), внутри ранга — по месту. Возвращает {event, placement} или null,
   когда играть было нечего. */
const CC_CARD_EV_RANK={globals:9, summit:8, major:7, rc:6, gclc:5, reload:4, final:3, solo:3, proam:2, victory:2, eval:2, cup:1};
function ccCareerBestRun(){
  const cr=CAREER && CAREER.career; if(!cr) return null;
  let best=null, bs=-1;
  (cr.log||[]).forEach(e=>{
    if(!e || !e.kind) return;
    let s=(CC_CARD_EV_RANK[e.kind]||0)*10;
    // Стадия до финала — ниже своего же финала, но выше кубка.
    if((e.kind==='major' || e.kind==='reload' || e.kind==='summit' || e.kind==='rc' || e.kind==='gclc') && e.stage && e.stage!=='final') s-=25;
    s+= e.place===1 ? 3 : e.place<=3 ? 2 : e.place<=10 ? 1 : 0;
    if(s>bs){ bs=s; best=e; }
  });
  return best;
}
function ccCareerCardEvent(){
  const best=ccCareerBestRun(); if(!best) return null;
  const name=String((typeof ccLogName==='function' ? ccLogName(best) : '')||'').replace(/<[^>]*>/g,'').trim();
  if(!name) return null;
  return {event:'FNCS '+ccSeasonYearOf(best.season)+' · '+name, placement:best.place||null, big:(CC_CARD_EV_RANK[best.kind]||0)>=7 && (!best.stage || best.stage==='final')};
}
// The player as a card. A taken card is looked up in the roster rather than
// copied into the save, so it always reads whatever the roster says today; the
// connection is layered on top without touching the roster object.
function careerCard(raw){
  if(!CAREER || !CAREER.player) return null;
  const pl=CAREER.player;
  let base;
  if(pl.handle){
    // The card as it stands in 2026 first — PLAYERS holds every era and its
    // find returned whichever the file listed first, so a career played as Sky
    // was reading a card from another season.
    const now=careerRosterNowEU().find(x=>hKey(x)===hKey(pl.handle));
    const found=now || PLAYERS.find(x=>x.handle===pl.handle && x.region===(pl.cardRegion||x.region) && (ccNowYear()>=2026 || ccCardYear(x)<=ccNowYear()));
    base = found ? {...found} : null;
    // The attributes are recomputed for this copy rather than inherited: the
    // roster object caches its own, already floored to the roster's rating, and
    // a cached set ignores the _targetOvr set below — which is how the hub and
    // the card printed 92 for a 96 career, and stayed at 92 while it grew.
    if(base){ delete base._attrs; delete base._ovr; }
    // Unless the career has trained: once a real card has six numbers of its
    // own they are the card, because they are what the player has been working
    // on. Before that it reads the roster, which is where a taken card starts.
    if(base && pl.attrs) base._attrs={...pl.attrs, _floored:false};
  }
  if(!base){
    base={ handle:pl.nick, nat:ccNatOf(pl.country)||pl.nat||null,
           region:pl.region||'EU', org:null, tier:'ranked',
           event:L().ccDivEvent.replace('{N}', CAREER.career.division), placement:null,
           rating:pl.ovr, _targetOvr:pl.ovr,
           // A copy with the floor flag cleared: attrsFor stamps _floored onto
           // the object it is handed, and the save holds that same object — so
           // once stamped, a rookie's six numbers stopped following the rating
           // until the next cup rebuilt them.
           _attrs:pl.attrs ? {...pl.attrs, _floored:false} : null,
           // Карьера за контент-мейкера носит его редкость — см. shownRarity.
           creator:!!pl.creator,
           /* Креатор без своего фото — с аватаркой своего канала (CC_PROAM_AVA). 30.10, его «я выбрал контент
              мейкера а у него нет аватарки» (At0m): сейв хранил только загруженное фото, и карточка падала на скин. */
           _photo:pl.photo || (pl.creator ? ccProAmAvatar(pl.nick) : null) || null };
  } else if(pl.photo){ base._photo=pl.photo; }
  /* Строка события — лучший вечер карьеры (см. ccCareerCardEvent): у построенного всегда,
     у взятой настоящей карточки — только когда карьера взяла больше, чем её собственная
     строка (финал Мейджора и выше): «Play-In 2026» на карточке, выигравшей Глобалы, — враньё. */
  try{
    const be=ccCareerCardEvent();
    if(be && (!pl.handle || be.big)){ base.event=be.event; base.placement=be.placement; }
  }catch(e){}
  // A career rating moves with results, so the card is lifted to whatever the
  // career says today rather than to whatever the roster froze. attrsFor reads
  // _targetOvr as the floor and scales the six numbers onto it; a rookie is
  // already built at its rating, so this only matters for a taken card.
  if(pl.handle) base._targetOvr=pl.ovr;
  /* Роль, которую карьера выбрала себе сама, едет на карточке: attrsFor
     читает её первой, поэтому она бьёт и настоящую роль настоящего игрока, и
     ту, что выводится из шести чисел. Пусто — значит роль никто не менял. */
  if(pl.role) base._roleKey=pl.role;
  // The card renderer draws a crest whenever a card carries an org, so signing
  // for a club puts its badge on your card with nothing else to write.
  base.org = CAREER.org ? CAREER.org.name : null;
  /* The country and the birthday are worth points to a player who was built,
     and to nobody else — including a career played as somebody real.

     Taking Sky is playing Sky: he is a 96 because of what he did, and a career
     that puts him on a Serbian connection at sixteen has not made him better,
     it has only chosen a flag and a number for a person who already has both.
     A made player is different — the country and the age are the two things
     that were actually decided about them, so they are the two that count.

     Always through the functions, never off the save: an old career carries
     whatever the edges were worth when it started, and reading those back would
     keep paying a bonus this rule no longer gives it. */
  const built = pl.source!=='card' && !pl.handle;
  /* Where they are sitting, not where they are from. A career that has moved
     plays on the connection it moved to — that is the whole of what a move buys
     — and the flag above is untouched, because a lease is not a passport. */
  /* И у взятой карточки связь стоит ровно столько, на сколько она переехала.

     Раньше — ноль и только ноль: Sky это 96 за то, что он сделал, и посадить
     его на сербский пинг не значит сделать его лучше. Это верно ровно до того
     дня, когда карьера снимает квартиру в другой стране. Правило: прибавлять только за переезд.

     Поэтому здесь не сам пинг, а разница. Дома она нулевая — карточка стоит
     столько же, сколько стоила, — а после переезда это то, что переезд купил
     или отнял: из Москвы во Франкфурт плюс, из Франкфурта в Баку минус. Потолок
     общий, 99, его держит сама карточка (см. shownOvr). */
  const homePing = pl.countryPing!=null ? pl.countryPing
                 : (pl.country!=null ? ccPingOf(pl.country, pl.homeRegion||pl.region||'EU') : null);
  const moved = !built && !!pl.livesIn && homePing!=null;
  base._pingEdge = ccEdgeOff(pl) ? 0 : built ? ccPingEdge(ccPingNow())
                 : moved ? Math.round((ccPingEdge(ccPingNow())-ccPingEdge(homePing))*10)/10
                         : 0;
  // Через ccPlayerAge, а не через счётчик: у игрока с введённой датой возраст
  // меняется в его собственный день, а не на границе сезона. Для всех
  // остальных это то же самое число, что и было. См. ccPlayerAge.
  base._ageEdge  = (built && !ccEdgeOff(pl)) ? ccAgeEdge(ccPlayerAge()) : 0;
  base._age      = ccPlayerAge();
  base._pingMs   = ccPingNow();
  /* The desk, on the card. Each owned device pays its point or two into the
     attribute it serves — see CC_SHOP — visible on the card's six numbers and
     read by the engine with them. Applied to this copy only, never written
     back: `raw` is how ccOwnAttrs samples the player without the desk, so a
     career's first training day does not bake the gear in and then double it
     on every read after. The rating is untouched — a mouse buys aim, not a
     number at the top of the card. */
  const gs=!raw && CAREER.gear && CAREER.gear.skill;
  if(gs && Object.keys(gs).length){
    const a=attrsFor(base);
    const bumped={...(base._attrs||a)};
    ATTR_KEYS.forEach(k=>{
      if(gs[k]) bumped[k]=clamp(Math.round((bumped[k]!=null?bumped[k]:a[k])+gs[k]), 35, 99);
    });
    bumped._floored=false;
    base._attrs=bumped;
  }
  return base;
}

function openCareerHub(){
  CH_MONTH=null;   // календарь закрыт вместе с прошлым визитом; см. careerTab
  if(!careerLoad()){
    // Нечитаемый сейв — не повод создавать карьеру поверх него (см. CC_LOAD_BAD).
    if(CC_LOAD_BAD){ openCareerSlots(); try{ ccTell(L().ccSaveUnread || 'This career save could not be read. It is kept aside; start the new career in another slot.'); }catch(e){} return; }
    openCareerCreate(); return; }
  // A career whose seat is empty finds the offers already in the inbox rather
  // than tomorrow — including a brand new one, which is the whole point.
  careerSeatTopUp();
  show('screen-career-hub');
  careerRenderHub('centre');
}

// Clicking the career tile picks up where you left off, or starts a new one.
/* direct=true — слот уже выбран, спрашивать нечего: так входит «Продолжить»
   с плитки. Без этого выбор карьеры замыкался на себя: нажатие звало
   careerEntry, тот видел две карьеры и снова рисовал выбор. Отчёт: «подключился по коду, но зайти не могу, continue жму». */
function careerEntry(direct){
  mgrLeaveIfActive();
  // Вход одиночной дверью — значит, вдвоём здесь ничего не заводится. См. ccMpNewCancel.
  CC_MP_NEW=null;
  CC_DRAFT_RUN=false;   // карьера — командный код снова в силе (см. ccMpOn)
  /* Карточка режима открывает ТЕКУЩУЮ карьеру, сколько бы их ни было.

     Утром 29 августа она при двух карьерах открывала выбор слота («а соло
     карьеру можно запустить?»), и к вечеру он же сказал: «захожу в карьеру и
     меня выкидывает, ещё раз нужно жать». Дорога к другим слотам и к новой
     карьере есть из хаба — кнопка «Карьеры» (openCareerSlots) — и с дверей
     «вдвоём» на карточке; с главного экрана — сразу в игру. */
  // A save from before the clock became a date is brought forward on the way in,
  // so nothing downstream has to know two shapes.
  /* Командная карьера подключается к своему лобби на входе — и БЕЗ await:
     карьера обязана открыться и без сети. localStorage держит последнее
     известное состояние команды, а 'state' от сервера приедет и перепишет его
     через ccApplyTeamState. См. ccMpBoot. */
  if(careerExists()){ careerLoad(); careerMigrateClock(); careerMigrateMoney(); careerMigrateOrg(); careerMigrateOwnClub(); ccMpBoot(); openCareerHub(); return; }
  // The slot the tile opens is empty, but another one may not be — that is what
  // switching careers looks like from here, so ask rather than start a third.
  let any=false;
  for(let n=1; n<=CC_SLOTS && !any; n++) any=!!ccSlotCard(n);
  if(any) openCareerSlots();
  else openCareerCreate();
}

// Ending a career deletes the only save there is, so it asks first — the same
// shape the app already uses for discarding a run. Focus lands on Cancel so a
// stray Enter keeps the career rather than burning it.
/* Разрыв дуо — аварийная дверь, а не фича.

   «День ждёт обоих» означает, что исчезнувший напарник запирает карьеру
   навсегда. Дверь превращает команду обратно в одиночную карьеру: история и
   деньги остаются, место напарника занимает бот с его последней карточкой —
   той самой ночной, которая и так обменивалась перед каждым вечером.
   Сторож — tools/check-mp-break.js. */
function careerPart(){
  if(!ccMpOn()) return;
  if(typeof MP!=='undefined' && MP.part) MP.part();
  // И связь больше не нужна: без drop сокет продолжал бы переподключаться к
  // лобби, из которого мы только что вышли.
  if(typeof MP!=='undefined' && MP.drop) MP.drop();
  var peer=(typeof MP!=='undefined' && MP.peer) || null;
  if(peer){
    CAREER.partners=CAREER.partners||[];
    /* Записью с вложенной карточкой, а не голым ником: ccMateCardOf ищет ник в
       ростере, а живого человека там нет — его карточку надо принести с
       собой, иначе место напарника осталось бы пустым. */
    /* КАРТОЧКА ЦЕЛИКОМ, а не выборка полей. Скриншот, хаб после
       разрыва дуо: «Cannot read properties of undefined (reading 'replace')»
       — вкладка «Я» рисует бывшего напарника через futCardHTML, а собранная
       здесь вручную карточка не везла `event`. Та же ловушка, что 26 августа
       в MP.card: список полей, составленный руками, отстаёт от кода, который
       карточку читает. По проводу и так приезжает вся карточка (см. MP.card)
       — её и кладём, поправив только регион, чтобы ростер её находил. */
    if(!CAREER.partners.some(function(p){ return p && p.handle===peer.handle; })){
      var kept=null; try{ kept=JSON.parse(JSON.stringify(peer)); }catch(e){ kept=Object.assign({}, peer); }
      if(!kept.region) kept.region=(CAREER.player&&CAREER.player.region)||'EU';
      if(kept.rating==null) kept.rating=peer.ovr||0;
      CAREER.partners.push({handle:peer.handle, role:peer.role||null, card:kept});
    }
  }
  delete CAREER.career.mp;
  careerSave();
  careerRenderHub('centre');
}
function careerPartAsk(){
  // Подпись ccAsk — (text, go, opts): подписи кнопок едут в opts.
  ccAsk(L().ccPartAsk, careerPart, {yes:L().ccPartYes, no:L().ccPartNo});
}
function careerEndAsk(){
  document.getElementById('careerEndModal').style.display='flex';
  const no=document.getElementById('careerEndNo'); if(no) no.focus();
  document.addEventListener('keydown', careerEndKey);
}
function careerEndClose(){
  document.getElementById('careerEndModal').style.display='none';
  document.removeEventListener('keydown', careerEndKey);
}
function careerEndKey(e){ if(e.key==='Escape') careerEndClose(); }
function careerEnd(){
  careerEndClose();
  if(typeof careerNewsRotStop==='function') careerNewsRotStop();   // лента хаба не должна тикать в пустую карьеру
  // Слот ЭТОЙ вкладки, а не общий указатель: вторая вкладка могла переставить его на другую карьеру (как 22.09 у записи).
  ccSlotWipe(ccSlotMine());
  CAREER=null;
  show('screen-mode');
}

/* The picker. Three cards, each the whole of what a slot holds — who, where on
   the ladder, how far into the year, what it has won. An empty one starts a
   career; a full one is opened or deleted, and deleting asks, because a season
   is hours of somebody's evening. */
function openCareerSlots(){
  mgrLeaveIfActive();
  careerRenderSlots();
  show('screen-career-slots');
}
function careerRenderSlots(){
  const grid=document.getElementById('ccSlotGrid');
  if(!grid) return;
  const here=ccSlot();
  /* Где в сезоне карьера остановилась — долей года, а не датой. Год у карьеры
     один и тот же (CC_YEAR_FROM…CC_YEAR_TO), поэтому позиция настоящая. */
  const railOf=(day)=>{
    const a=new Date(ccYearFrom()+'T00:00:00Z'), b=new Date(ccYearTo()+'T00:00:00Z');
    const d=new Date((day||CC_YEAR_FROM)+'T00:00:00Z');
    return Math.max(2, Math.min(100, Math.round((d-a)/(b-a)*100)));
  };
  const cells=[]; let free=0, firstFree=0;
  for(let n=1; n<=CC_SLOTS; n++){
    const c=ccSlotCard(n);
    if(!c){ free++; if(!firstFree) firstFree=n; continue; }
    const state = c.retired ? L().ccSlotRetired
                : c.over    ? L().ccSlotSeasonOver
                            : ccDayLabel(c.day);
    /* Одна строка под ником вместо пяти строк таблицы: возраст, страна, сезон,
       где встал, напарник — всё, что отвечает «что это за карьера». */
    const meta=[
      c.age ? String(c.age) : '',
      c.country ? '<img class="cc-car-flag" src="flags/w20/'+
        esc(ccCountryOf(String(c.country).toLowerCase()))+'.png" alt="">' : '',
      (function(){ const t=ccSeasonTag(c.day); return String(c.day||'').slice(0,4)+(t.full ? ' · '+esc(t.full) : ''); })(),
      esc(state),
      c.mate ? esc(c.mate)+(c.mates>1 ? ' +'+(c.mates-1) : '') : '',
      c.org ? esc(c.org) : '',
      c.earnings ? '$'+ccNum(c.earnings) : ''
    ].filter(Boolean).join('<span style="opacity:.4">·</span>');
    cells.push('<div class="cc-car'+(n===here?' on':'')+'">'+
      (c.face ? '<img class="cc-car-face" src="'+esc(c.face)+'" alt="" loading="lazy" onerror="this.remove()">'
              : '<span class="cc-car-face"></span>')+
      '<div class="cc-car-id"><b>'+esc(c.nick)+
        (c.team ? ' <span class="cc-car-duo">'+L().ccSlotDuoLive+'</span>' : '')+'</b>'+
        '<em>'+meta+'</em></div>'+
      '<div class="cc-car-ovr"><small>'+L().ccRoOvr+'</small>'+c.ovr+'</div>'+
      (c.noDiv
        ? '<div class="cc-car-div cc-car-se"><small>'+L().ccSlotSeason+'</small>'+esc(ccSeasonTag(c.day).short||'-')+'</div>'
        : '<div class="cc-car-div"><small>'+L().ccDivision+'</small>'+c.div+'</div>')+
      '<div class="cc-car-go">'+
        '<button class="'+(n===here?'ch-play':'cc-car-open')+'" onclick="careerSlotOpen('+n+')">'+
          L().ccSlotOpen+'</button>'+
        '<button class="cc-car-del'+(CC_SLOT_ARMED===n?' armed':'')+
          '" title="'+esc(L().ccSlotDelete)+'" onclick="careerSlotDrop('+n+')">'+
          (CC_SLOT_ARMED===n ? esc(L().ccSlotDropSure) : '&times;')+'</button>'+
      '</div>'+
      '<span class="cc-car-rail"><i style="width:'+railOf(c.day)+'%"></i></span></div>');
  }
  /* Свободные слоты — одной строкой, а не половиной экрана пустых коробок.
     Их число тут и есть вся нужная информация. */
  if(free) cells.push('<button class="cc-car cc-car-new" onclick="careerSlotNew('+firstFree+')">'+
    '<span><b>'+(L().ccSlotsNew||L().ccSlotStart)+'</b><em>'+
      (L().ccSlotsFree ? L().ccSlotsFree(free) : free+'/'+CC_SLOTS)+'</em></span>'+
    '<span class="cc-car-free">+</span></button>');
  grid.innerHTML=cells.join('');
  // Зал славы под сеткой: все карьеры на одном экране. См. careerHallHTML.
  const hall=document.getElementById('ccHall');
  if(hall) hall.innerHTML=careerHallHTML();
  try{ ccCloudDraw(); }catch(e){}
}
/* Дверь с главного экрана: сперва выбор, потом карьера.

   Правка: «когда игрок нажимает начать карьеру, ему дают на
   выбор сразу его карьеры, которые создал или свободные». До неё кнопка вела в
   последнюю карьеру мимо выбора — и это была правка
   («захожу в карьеру и меня выкидывает, ещё раз нужно жать»); мешал тогда сам
   экран выбора, а не лишнее нажатие. Экран переделан в ростер, дверь снова
   ведёт в него.

   Почему ОТДЕЛЬНОЙ функцией, а не внутри careerEntry: через careerEntry в
   карьеру заходят не только кнопки, но и все сторожа — их там четыре десятка, и
   каждый ждёт хаб, а не выбор. Первая попытка положить выбор внутрь careerEntry
   покрасила четырнадцать проверок из сорока четырёх. Выбор — решение кнопки,
   загрузка — дело careerEntry. */
function homeGuideOpen(){
  const m=document.getElementById('homeGuide'); if(!m) return;
  // Подробности на языке игрока: та же схема адресов, что у ссылки на Competitive.
  const lg=LANG, a=document.getElementById('homeGuideMore');
  if(a) a.setAttribute('href', (/\/(ru|fr|it|pt|de|es)\/(index\.html)?$/.test(location.pathname) ? '../' : '')+(lg==='en' ? '' : lg+'/')+'about');
  m.classList.add('on');
  const go=m.querySelector('.hero-btn-go'); if(go) go.focus();
}
function homeGuideClose(){ const m=document.getElementById('homeGuide'); if(m) m.classList.remove('on'); }
document.addEventListener('keydown', e=>{ if(e.key==='Escape') homeGuideClose(); });
function careerStart(){
  mgrLeaveIfActive();
  CC_MP_NEW=null;
  let has=false;
  for(let n=1; n<=CC_SLOTS && !has; n++) has=!!ccSlotCard(n);
  if(has){ openCareerSlots(); return; }
  careerEntry();
}
function careerSlotOpen(n){
  mgrLeaveIfActive();
  ccSlotUse(n);
  careerEntry(true);   // выбор уже сделан этой самой кнопкой
}
function careerSlotNew(n){
  mgrLeaveIfActive();
  ccSlotUse(n);
  CAREER=null;
  openCareerCreate();
}
// Two presses, not a browser dialog: the first arms the button and says what it
// is about to throw away, the second does it. A modal here would be the only one
// in the mode, and a career is not something to lose to a stray Enter.
let CC_SLOT_ARMED=null;
function careerSlotDrop(n){
  if(CC_SLOT_ARMED!==n){
    CC_SLOT_ARMED=n;
    careerRenderSlots();
    return;
  }
  CC_SLOT_ARMED=null;
  ccSlotWipe(n);
  if(n===ccSlotMine()) CAREER=null;
  careerRenderSlots();
}

let CH_TAB='centre';
/* Группы вкладок (22.11): шесть главных в полосе, остальные подвкладками сверху тела (ccSubTabsHTML). Первая в списке -
   главная, её кнопка стоит в полосе. Ключи вкладок не менялись: сейвы и переходы careerTab('shop') и т.д. работают. */
const CC_TAB_GROUPS={calendar:['calendar', 'table'], items:['items', 'shop', 'bp', 'locker'], me:['me', 'log', 'hist']};
const CC_SUB_KEY={calendar:'chTabCalendar', table:'chTabBoards', items:'chTabItems', shop:'chTabShop', bp:'chTabBp', locker:'chTabLocker', me:'chTabMe', log:'chTabLog', hist:'chTabHist'};
function ccTabGroupOf(t){ for(const g in CC_TAB_GROUPS) if(CC_TAB_GROUPS[g].indexOf(t)>=0) return g; return t; }
// Не ccSubTabsHTML: так зовутся подвкладки «Таблиц» (PR/статистика/игроки) ниже.
function ccGrpTabsHTML(t){
  const g=CC_TAB_GROUPS[ccTabGroupOf(t)]; if(!g) return '';
  const T=L(), cur=({stats:'table', world:'table'}[t]||t);
  return '<div class="ch-grp-tabs" role="tablist">'+g.map(k=>'<button type="button" role="tab" class="ch-grp-tab'+(k===cur ? ' on' : '')+'" aria-selected="'+(k===cur)+'" onclick="careerTab(\''+k+'\')">'+
    esc(k==='shop' ? T.chSubGear : T[CC_SUB_KEY[k]]||k)+(k==='shop' && careerShopNew().length ? '<i class="ch-dot" style="display:inline-block"></i>' : '')+'</button>').join('')+'</div>';
}
// Полоса подвкладок группы - первой строкой тела, после каждой отрисовки (в ccTabsSide).
function ccGrpTabsPut(){
  const b=document.getElementById('chBody'); if(!b) return;
  const old=b.querySelector(':scope > .ch-grp-tabs'); if(old) old.remove();
  const h=ccGrpTabsHTML(CH_TAB); if(h) b.insertAdjacentHTML('afterbegin', h);
}
function careerTab(t){
  /* Ушёл с календаря — он забывает, куда ты его листал. Отзыв:
     «когда закрываешь календарь, пусть всегда перемещает на то место, где ты
     сейчас». Пролистанный на июль календарь так и открывался июлём, и «Сейчас»
     приходилось жать руками каждый раз. CH_MONTH=null означает «текущий
     месяц» — см. careerCalendarHTML. */
  if(CH_TAB==='calendar' && t!=='calendar') CH_MONTH=null;   // календарь закрыт
  CH_TAB=t;
  // The shop opens where the career is living, every time. Whatever was being
  // looked at last visit was a look, not a decision. See CH_FLAT_PLACE.
  if(t==='shop') CH_FLAT_PLACE=null;
  careerRenderHub(t);
  // Opening the shop is what clears its mark: the render above still drew the
  // new rows, and the next visit will not call them new again.
  // Only when the mark moves: a full save (~1 MB JSON) on every tap was a fifth of the tab's cost on a phone.
  const cr=CAREER && CAREER.career;
  if(t==='shop' && cr && (cr.shopSeen||0)<(cr.balance||0)) careerShopSeen();
  // And opening the socials is what clears the feed's. Messages keep their own
  // unread flag — a thread is read when it is opened, not when the tab is.
  if(t==='social' && cr && cr.newsSeen!==(cr.newsN||0)) careerNotesSeen();
}

/* Перерисовка той же вкладки сохраняет прокрутку. Хаб перерисовывается целиком через innerHTML,
   и страница уезжала наверх, а в командной карьере перерисовку дёргает каждое действие напарника.
   Сравниваем с CH_DREW (последняя нарисованная вкладка), а не с CH_TAB: careerTab меняет CH_TAB
   до вызова. При смене вкладки прокрутку не трогаем.
   Сохраняем все три скроллера (страница, #chBody, обёртка): в разных раскладках крутится разное. */
let CH_DREW=null;
function ccHubScroll(){
  const b=document.getElementById('chBody');
  return {w:(window.scrollY||document.documentElement.scrollTop||0),
          b:(b?b.scrollTop:0),
          p:((b&&b.parentElement)?b.parentElement.scrollTop:0)};
}
// Последняя упавшая отрисовка хаба — текст ошибки, как у дня (CC_DAY_ERR).
let CC_HUB_ERR=null, CC_HUB_ERR_FULL=null;
/* Ошибку нужно уметь ПРИСЛАТЬ, а не только увидеть.
 *
 * Плашка ниже показывает игроку, что именно сломалось, но чинить по скриншоту
 * телефона нечего: там видна одна строка сообщения без стека и без метки
 * сборки. Кнопка кладёт в буфер всё сразу — сборку, вкладку и стек, — и это
 * ровно тот текст, которого не хватает, чтобы найти упавшую плитку.
 *
 * Два пути нарочно: navigator.clipboard живёт только на https и требует
 * разрешения, а у него игроки сидят и с превью-адресов, и с телефона. Если
 * первый не сработал, старое поле с execCommand работает везде. */
function ccHubErrCopy(btn){
  const text=CC_HUB_ERR_FULL||CC_HUB_ERR||'';
  const done=()=>{ try{ if(btn) btn.textContent=L().ccHubCopied; }catch(e){} };
  try{
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(done, ()=>ccHubErrCopyOld(text, done));
      return;
    }
  }catch(e){}
  ccHubErrCopyOld(text, done);
}
function ccHubErrCopyOld(text, done){
  try{
    const ta=document.createElement('textarea');
    ta.value=text;
    ta.style.position='fixed'; ta.style.top='-1000px'; ta.style.opacity='0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    done();
  }catch(e){ console.error('скопировать ошибку не вышло:', e); }
}
/* КЭШ НА ОДНУ ПЕРЕРИСОВКУ ХАБА (игрок 9.10: «the game lag every clicks»). Замер на телефоне (Playwright, CPU ×6): вкладка
   «Медиа» 250–430 мс на КАЖДОЕ нажатие, из них ~90% — careerDmPool → careerDuoBeatsYou → ccDuoForm, который на каждого
   кандидата заново строил всю таблицу сезона. Внутри одной отрисовки таблица не меняется — считается один раз. */
let CC_RENDER_MEMO=null;
/* Классический вид (см. html.ui-classic в стилях): выбор живёт в браузере, не в сейве — это вид, а не карьера. */
function ccUiClassic(){ try{ return document.documentElement.classList.contains('ui-classic'); }catch(e){ return false; } }
function uiClassicToggle(){
  const on=!ccUiClassic();
  document.documentElement.classList.toggle('ui-classic', on);
  try{ if(on) localStorage.setItem('fd_ui_classic', '1'); else localStorage.removeItem('fd_ui_classic'); }catch(e){}
  try{ if(CAREER) careerRenderHub(); }catch(e){}
  try{ homeSceneDraw(); }catch(e){}
}
/* НАПАРНИК УШЁЛ — ОКНО (29.10). Ушёл в другое дуо, вырос выше или разошлись по итогам сезона: строка в новостях
   терялась среди остальных, а без напарника командный турнир не сыграть. После перерисовки хаба (не во время вечера и
   перемотки) — одно окно «найди нового» с поиском дуо; закрыл — больше не спрашивает. Уже нашёл замену — окна нет. */
const CC_MATE_GONE_KEYS=/^(ccNewsMateLeftFor|ccNewsDuoOutgrown|ccNewsDuoSplit|ccNewsDuoBehind)t?$/;
function ccMateGoneMaybe(){
  const cr=CAREER && CAREER.career; if(!cr || !cr.mateGone) return;
  if((typeof CAREER_RUN!=='undefined' && CAREER_RUN) || (typeof CC_FF!=='undefined' && CC_FF)) return;
  const hub=document.getElementById('screen-career-hub'); if(!hub || !hub.classList.contains('active')) return;
  const ask=document.getElementById('ccAskModal'); if(ask && ask.style.display==='flex') return;
  const g=cr.mateGone; cr.mateGone=null; careerSave();
  if(!(typeof careerMatesShort==='function' && careerMatesShort()>0)) return;
  const T=L();
  ccAsk(T.ccMateGoneAsk(g.who), ()=>ccDuoFindOpen(null), {yes:T.ccMateGoneFind, no:T.ccMateGoneLater});
}
function careerRenderHub(tab){
  setTimeout(()=>{ try{ ccMateGoneMaybe(); }catch(e){} }, 0);
  const outer=!CC_RENDER_MEMO;
  if(outer) CC_RENDER_MEMO=new Map();
  // Дефолты шкафчика и награды за новые вечера (кирка чемпиона FNCS) — до рисования, чтобы хаб и матч их видели.
  if(outer) try{ ccFnDefaults(); ccLockerCheck(); }catch(e){}
  try{ return careerRenderHubRaw(tab); }
  finally{ if(outer) CC_RENDER_MEMO=null; try{ ccHubTheme(); }catch(e){} try{ ccHubEraBg(); }catch(e){} try{ ccTabsSide(); }catch(e){} try{ ccTourMaybe(); }catch(e){} }
}
/* ОБУЧЕНИЕ ДЛЯ НОВИЧКА (Notion 27.10, игрок: «слишком много всего сразу, показал сайт брату, он потерялся»; его слово:
   «обучение для новых игроков сделать, чтоб всё понятно»). На первом экране карьеры 47 кнопок, 12 вкладок и десять
   чисел, и главная — «к турниру» — среди них теряется. Тур из семи шагов подсвечивает по одному месту и говорит одной
   фразой, что это. Сам открывается один раз, в свежей карьере (сезон 1, ни одного вечера), на Центре; кнопка «Как
   играть» внизу хаба открывает его снова. Шаг, чьего места на экране нет (другая раскладка, напарник уже есть), пропускается.
   Затемнение ловит клики: тур не должен нажать за игрока то, что под ним (см. интервью, тот же день). */
const CC_TOUR_KEY='fncsdraft_tour1';
const CC_TOUR_STEPS=[
  {sel:'#chOvr', k:'ccTourOvr'},
  {sel:'#screen-career-hub .ch-en', k:'ccTourEnergy'},
  {sel:'#screen-career-hub .cc-lb-playcol', k:'ccTourDay'},
  {sel:'#screen-career-hub .cc-lb-next, #screen-career-hub .ch-next', k:'ccTourSeason'},
  {sel:'#screen-career-hub .ch-skipto, #screen-career-hub .ch-col-play .ch-play', k:'ccTourGo'},
  {sel:'#screen-career-hub .ch-tile-ros', k:'ccTourMate', need:()=>!(careerMates()||[]).filter(Boolean).length},
  {sel:'#screen-career-hub .ch-tabs', k:'ccTourTabs'}
];
let CC_TOUR=null, CC_TOUR_SOON=false;
function ccTourSeen(){ try{ return localStorage.getItem(CC_TOUR_KEY)==='1'; }catch(e){ return true; } }
function ccTourMaybe(){
  if(CC_TOUR || CC_TOUR_SOON || ccTourSeen()) return;
  const cr=CAREER && CAREER.career; if(!cr) return;
  if(typeof CH_TAB!=='undefined' && CH_TAB!=='centre') return;
  if((cr.season||1)!==1 || (cr.log||[]).length || cr.seasonOver) return;
  if(typeof CC_FF!=='undefined' && CC_FF) return;
  CC_TOUR_SOON=true;
  setTimeout(()=>{ CC_TOUR_SOON=false;
    const hub=document.getElementById('screen-career-hub');
    if(!hub || !hub.classList.contains('active') || ccTourSeen() || CC_TOUR) return;
    ccTourStart(); }, 700);
}
function ccTourVisible(el){
  if(!el) return false;
  // Полоса вкладок на телефоне — position:fixed, у неё offsetParent пустой при видимой полосе.
  if(!el.offsetParent && getComputedStyle(el).position!=='fixed') return false;
  const cs=getComputedStyle(el); if(cs.display==='none' || cs.visibility==='hidden') return false;
  const r=el.getBoundingClientRect(); return r.width>8 && r.height>8;
}
function ccTourTarget(st){
  if(st.need && !st.need()) return null;
  return [...document.querySelectorAll(st.sel)].find(ccTourVisible)||null;
}
function ccTourStart(){
  ccTourEnd(true);
  const steps=CC_TOUR_STEPS.filter(st=>ccTourTarget(st));
  if(!steps.length) return;
  const wrap=document.createElement('div');
  wrap.className='cc-tour'; wrap.setAttribute('role','dialog'); wrap.setAttribute('aria-modal','true');
  wrap.innerHTML='<div class="cc-tour-dim"></div><div class="cc-tour-hole"></div><div class="cc-tour-tip"><em class="cc-tour-n"></em>'+
    '<p class="cc-tour-t"></p><div class="cc-tour-acts"><button class="cc-tour-skip" type="button"></button>'+
    '<button class="cc-tour-next" type="button"></button></div></div>';
  document.body.appendChild(wrap);
  CC_TOUR={wrap, steps, i:0};
  wrap.querySelector('.cc-tour-dim').onclick=()=>ccTourNext();
  wrap.querySelector('.cc-tour-skip').onclick=()=>ccTourEnd();
  wrap.querySelector('.cc-tour-next').onclick=()=>ccTourNext();
  window.addEventListener('resize', ccTourPlace); window.addEventListener('scroll', ccTourPlace, true);
  document.addEventListener('keydown', ccTourKey);
  ccTourShow();
}
function ccTourKey(e){ if(!CC_TOUR) return; if(e.key==='Escape') ccTourEnd(); else if(e.key==='Enter' || e.key==='ArrowRight'){ e.preventDefault(); ccTourNext(); } }
function ccTourShow(){
  const T=CC_TOUR; if(!T) return;
  const st=T.steps[T.i], el=ccTourTarget(st);
  if(!el){ return ccTourNext(); }
  try{ el.scrollIntoView({block:'center', inline:'nearest'}); }catch(e){}
  T.wrap.querySelector('.cc-tour-n').textContent=(T.i+1)+' / '+T.steps.length;
  T.wrap.querySelector('.cc-tour-t').textContent=L()[st.k]||'';
  T.wrap.querySelector('.cc-tour-skip').textContent=L().ccTourSkip;
  T.wrap.querySelector('.cc-tour-skip').style.visibility=T.i===T.steps.length-1 ? 'hidden' : '';
  T.wrap.querySelector('.cc-tour-next').textContent=T.i===T.steps.length-1 ? L().ccTourDone : L().ccTourNext;
  ccTourPlace();
  try{ T.wrap.querySelector('.cc-tour-next').focus({preventScroll:true}); }catch(e){}
}
function ccTourPlace(){
  const T=CC_TOUR; if(!T) return;
  const el=ccTourTarget(T.steps[T.i]); if(!el) return;
  const r=el.getBoundingClientRect(), pad=6, vw=window.innerWidth, vh=window.innerHeight;
  const hole=T.wrap.querySelector('.cc-tour-hole'), tip=T.wrap.querySelector('.cc-tour-tip');
  const top=Math.max(4, r.top-pad), left=Math.max(4, r.left-pad);
  const h=Math.min(vh-8, r.bottom+pad)-top, w=Math.min(vw-8, r.right+pad)-left;
  Object.assign(hole.style, {top:top+'px', left:left+'px', width:Math.max(0, w)+'px', height:Math.max(0, h)+'px'});
  const tw=Math.min(340, vw-32);
  tip.style.width=tw+'px';
  const th=tip.offsetHeight||140;
  // Под местом, если влезает; иначе над ним; иначе — внизу экрана поверх (высокая колонка дня на телефоне).
  let y=top+h+10;
  if(y+th>vh-12) y=top-th-10;
  if(y<12) y=Math.max(12, vh-th-16);
  const x=Math.min(Math.max(16, left+w/2-tw/2), vw-tw-16);
  tip.style.top=y+'px'; tip.style.left=x+'px';
}
function ccTourNext(){
  const T=CC_TOUR; if(!T) return;
  if(T.i>=T.steps.length-1) return ccTourEnd();
  T.i++; ccTourShow();
}
function ccTourEnd(quiet){
  const T=CC_TOUR; if(!T) return;
  CC_TOUR=null;
  try{ T.wrap.remove(); }catch(e){}
  window.removeEventListener('resize', ccTourPlace); window.removeEventListener('scroll', ccTourPlace, true);
  document.removeEventListener('keydown', ccTourKey);
  if(!quiet){ try{ localStorage.setItem(CC_TOUR_KEY, '1'); }catch(e){} }
  try{ window.scrollTo(0, 0); }catch(e){}
}
// Фон хаба по эпохе магазина (CSS #screen-career-hub[data-fs=…]); в менеджере свой экран, его не трогаем.
function ccHubEraBg(){
  const el=document.getElementById('screen-career-hub');
  if(!el || typeof CAREER==='undefined' || !CAREER || !CAREER.career) return;
  const v=ccFnShopEra(careerToday()).v;
  if(el.dataset.fs!==v) el.dataset.fs=v;
}
// Справа в полосе вкладок хаба — значки (лички, лента, …) и кошелёк, как было в полосе меню; одинаково на всех вкладках.
function ccTabsSide(){
  const t=document.querySelector('#screen-career-hub .ch-tabs');
  if(!t || typeof CAREER==='undefined' || !CAREER || !CAREER.career) return;
  let s=t.querySelector('.ch-tabs-side');
  if(!s){ s=document.createElement('div'); s.className='ch-tabs-side'; t.appendChild(s); }
  // Справа - кнопки медиа (Notion «20.11»: «вместо красного твич ютуб дискорд»); папки входящих - во вкладке соцсети.
  let note=''; try{ note=ccMediaQuickHTML(); }catch(e){}
  // Кошелёк здесь снят (Notion «20.10»: «одна и та же информация» — баланс и V-Bucks уже в верхней панели, там же выплаты).
  s.innerHTML=(note ? '<div class="cc-lb-note">'+note+'</div>' : '');
  try{ ccGrpTabsPut(); }catch(e){}
}
/* ЦВЕТ ХАБА — ПО СЕЗОНУ (19.10, его «мб дизайн хаба под каждый сезон под их цвета»). Оттенок берётся из картинки
   лобби сезона (ccLobbyBg): средний цвет по насыщенным пикселям, вектором по кругу оттенков. Из него — фон панели,
   стекло плашек, тёмные полосы и полоса вкладок меню; яркость и насыщенность свои, чтобы текст читался на любом
   сезоне. Картинка без цвета (серый бункер s12) оставляет привычный синий. Один расчёт на картинку (CC_HUB_THEME). */
const CC_HUB_THEME={};
function ccHubThemeApply(h, k){
  const el=document.getElementById('screen-career-hub'); if(!el) return;
  const props=['--fn-panel','--fn-deep','--fn-line','--lb-panel','--lb-deep','--th-a','--th-b','--th-c','--th-top','--th-hi','--th-soft','--th-tint'];
  const root=document.documentElement;
  if(h==null){ el.classList.remove('ch-themed'); props.forEach(p=>el.style.removeProperty(p)); ['--cc-th-a','--cc-th-b','--cc-th-c'].forEach(p=>root.style.removeProperty(p)); return; }
  const hsl=(s, l, a)=>'hsla('+Math.round(h)+','+Math.round(s*(k==null ? 1 : k))+'%,'+l+'%,'+(a==null ? 1 : a)+')';
  el.style.setProperty('--fn-panel', hsl(55, 66, .22)); el.style.setProperty('--fn-deep', hsl(65, 12, .72));
  el.style.setProperty('--fn-line', hsl(80, 85, .2));
  el.style.setProperty('--lb-panel', hsl(58, 38, .8)); el.style.setProperty('--lb-deep', hsl(68, 16, .84));
  el.style.setProperty('--th-a', hsl(62, 33)); el.style.setProperty('--th-b', hsl(66, 22)); el.style.setProperty('--th-c', hsl(70, 13));
  el.style.setProperty('--th-top', hsl(62, 30));
  // Яркий акцент (шапка сезона, вкладки), полупрозрачный верх правой панели и светлая подложка плиток в ней.
  el.style.setProperty('--th-hi', hsl(68, 50)); el.style.setProperty('--th-soft', hsl(62, 30, .72)); el.style.setProperty('--th-tint', hsl(60, 70, .2));
  /* Окна выбора штаба и переезда лежат вне хаба (#coachPickModal и т.д. на body) и цвета сезона не видели — синие
     в любой карьере (его слово 20.10: «дизайн стафа не меняется на разных карьерах»). Те же три оттенка — на html. */
  root.style.setProperty('--cc-th-a', hsl(62, 33)); root.style.setProperty('--cc-th-b', hsl(66, 22)); root.style.setProperty('--cc-th-c', hsl(70, 13));
  el.classList.add('ch-themed');
}
/* Оттенок хаба — от эпохи магазина, той же, что фон (ccHubEraBg). Отдельно взятый с картинки сезона, он красил шапку
   и плашки в коричневый поверх синего фона эпохи (Notion 22.10: «почему разные дизайны» — шапка одна, вкладки другие). */
const CC_ERA_HUE={a:[300, .22], b:[212, 1], c:[220, 1], d:[212, 1], e:[220, 1], og:[228, .7], f:[210, 1], g:[210, 1]};   // [оттенок, доля насыщенности]
function ccHubTheme(){
  if(typeof CAREER==='undefined' || !CAREER || !CAREER.career) return;
  try{ const v=ccFnShopEra(careerToday()).v; if(v in CC_ERA_HUE){ ccHubThemeApply(CC_ERA_HUE[v][0], CC_ERA_HUE[v][1]); return; } }catch(e){}
  const src=ccLobbyBg(careerToday());
  if(src in CC_HUB_THEME){ ccHubThemeApply(CC_HUB_THEME[src]); return; }
  const img=new Image();
  img.onload=()=>{
    let hue=null;
    try{
      const c=document.createElement('canvas'); c.width=64; c.height=36;
      const g=c.getContext('2d'); g.drawImage(img, 0, 0, 64, 36);
      const d=g.getImageData(0, 0, 64, 36).data;
      // Самый частый оттенок (24 корзины по 15°, вес — насыщенность×яркость), а не средний: у осеннего леса под
      // синим небом средний гасился в ноль.
      const bins=new Array(24).fill(0), bx=new Array(24).fill(0), by=new Array(24).fill(0);
      let wsum=0;
      for(let i=0; i<d.length; i+=4){
        const r=d[i]/255, gg=d[i+1]/255, b=d[i+2]/255, mx=Math.max(r, gg, b), mn=Math.min(r, gg, b), dl=mx-mn;
        if(dl<0.08 || mx<0.12) continue;
        let hh=mx===r ? ((gg-b)/dl)%6 : mx===gg ? (b-r)/dl+2 : (r-gg)/dl+4; hh=(hh*60+360)%360;
        const w=dl*mx, k=Math.floor(hh/15)%24;
        bins[k]+=w; bx[k]+=Math.cos(hh*Math.PI/180)*w; by[k]+=Math.sin(hh*Math.PI/180)*w; wsum+=w;
      }
      let best=0; for(let k=1; k<24; k++) if(bins[k]+bins[(k+1)%24]+bins[(k+23)%24]>bins[best]+bins[(best+1)%24]+bins[(best+23)%24]) best=k;
      const ks=[(best+23)%24, best, (best+1)%24], X=ks.reduce((s, k)=>s+bx[k], 0), Y=ks.reduce((s, k)=>s+by[k], 0), W=ks.reduce((s, k)=>s+bins[k], 0);
      // Мало цвета — остаётся синий по умолчанию.
      if(wsum>40 && W/wsum>0.2) hue=(Math.atan2(Y, X)*180/Math.PI+360)%360;
    }catch(e){ hue=null; }
    CC_HUB_THEME[src]=hue;
    if(ccLobbyBg(careerToday())===src) ccHubThemeApply(hue);
  };
  img.onerror=()=>{ CC_HUB_THEME[src]=null; };
  img.src=src;
}
function careerRenderHubRaw(tab){
  // 2019–2020: состав по этапу года (старый сейв со сквадом с апреля тоже сходит на дуо).
  try{ if(typeof ccSyncPhaseRoster==='function') ccSyncPhaseRoster(); }catch(e){}
  /* ОТРИСОВКА НЕ ТРАТИТ БРОСКИ ВЕЧЕРА. Пока идёт сеяный вечер (CC_MP_RAND), хаб всё равно
     перерисовывают сетевые события — строка гонки соседа, 'ready', переподключение, — и
     каждый Math.random внутри отрисовки уходил из общего генератора в СЛУЧАЙНЫЙ момент
     расчёта, свой у каждого клиента. Годовая проба на шестерых 8.09: у одного +4 броска на
     второй игре play-in, дальше другой набор вопросов и вечер стоит. Здесь генератор на время
     отрисовки подменяется настоящим (ccRaceUnseeded), как у вопроса и у сборки команд. */
  if(typeof CC_MP_RAND!=='undefined' && CC_MP_RAND && Math.random!==CC_MP_RAND && typeof ccRaceUnseeded==='function')
    return ccRaceUnseeded(function(){ return careerRenderHub(tab); });
  const next=tab||CH_TAB;
  const same=(CH_DREW===next);
  const at=same ? ccHubScroll() : null;
  /* Падение отрисовки не должно вешать экран. Шаг дня уже защищён (careerNextDay, CC_DAY_ERR),
     а упавшая после него плитка оставляла вчерашний экран с мёртвыми кнопками до F5.
     Теперь тело хаба заменяется красной плашкой с ошибкой и кнопкой на центр, стек уходит в консоль.
     Сам шаг дешёвый (tools/next-day-cost-probe.js: 12 мс на 1-м сезоне, 39 на 3-м, худший 541),
     так что «зависание» это именно оборванная отрисовка. */
  try{
    careerRenderHubBody(tab);
    CC_HUB_ERR=null;
  }catch(e){
    CC_HUB_ERR=String((e && e.message) || e);
    // Полный текст — для кнопки «скопировать»: сборка, вкладка и стек. Именно
    // его не хватало, чтобы найти упавшую плитку по отзыву игрока.
    CC_HUB_ERR_FULL='FNCS Draft '+(typeof CC_BUILD!=='undefined' ? CC_BUILD : '?')+
      ' · '+(tab||CH_TAB)+'\n'+String((e && e.stack) || e);
    console.error('careerRenderHub сломался на вкладке '+(tab||CH_TAB)+':', e);
    try{
      const b=document.getElementById('chBody');
      if(b) b.innerHTML='<div class="cc-ffo-err"><b>'+esc(L().ccHubBroke)+'</b>'+
        '<span>'+esc(CC_HUB_ERR)+'</span>'+
        '<span class="cc-ffo-build">'+
        esc('FNCS Draft '+(typeof CC_BUILD!=='undefined' ? CC_BUILD : '?')+' · '+(tab||CH_TAB))+
        '</span></div>'+
        '<button class="ch-play" onclick="careerRenderHub(\'centre\')">'+
        esc(L().ccHubBackCentre)+'</button>'+
        '<button class="cc-back cc-err-copy" onclick="ccHubErrCopy(this)">'+
        esc(L().ccHubCopy)+'</button>';
    }catch(e2){ console.error('и плашку показать не вышло:', e2); }
  }
  CH_DREW=CH_TAB;
  if(typeof ccNatNudge==='function') ccNatNudge();
  if(typeof ccFmtYearNudge==='function') ccFmtYearNudge();
  if(at) try{
    const b=document.getElementById('chBody');
    if(b && at.b) b.scrollTop=at.b;
    if(b && b.parentElement && at.p) b.parentElement.scrollTop=at.p;
    if(at.w) window.scrollTo(0, at.w);
  }catch(e){}
  /* Переписка — к последнему сообщению (его слово 7.10: «когда отправляю сообщение не сразу перекидывает на
     сообщение, нужно листать»). Окно .dm-msgs со своей прокруткой собирается заново и вставало в начало. */
  try{ document.querySelectorAll('#chBody .dm-msgs').forEach(m=>{ m.scrollTop=m.scrollHeight; }); }catch(e){}
  // На телефоне панель вкладок листается: открытая — посередине видимой части (его «не удобно с телефона кликать»).
  try{ const on=document.querySelector('#screen-career-hub .ch-tabs .ch-tab.on'), bar=on && on.parentElement;
    if(bar && bar.scrollWidth>bar.clientWidth) bar.scrollLeft=Math.max(0, on.offsetLeft-(bar.clientWidth-on.offsetWidth)/2); }catch(e){}
}
/* Число с карточки — одно на все экраны. Карточка и шапка хаба печатают
   рейтинг плюс пинг и возраст (см. shownOvr), а профиль соцсети и лист
   «Профиль» печатали голый pl.ovr: 78 на карточке против «Rating 68» строкой
   ниже. Игрок: «пофикси баг где якобы у тебя рейтинг на
   10 больше, хотя это не так». Потолок тот же, что у карточки. */
function ccMyShownOvr(){
  const card=careerCard(), a=card ? attrsFor(card) : null;
  return a ? Math.min(CAREER_SCALE_TOP, Math.round(a.ovr + (card._pingEdge||0) + (card._ageEdge||0)))
           : (CAREER && CAREER.player ? CAREER.player.ovr : 0);
}
/* Шапка: ближайший играбельный турнир (сегодня или впереди, до 120 дней) — старший
   по CC_KIND_RANK, если в день их несколько. */
function ccHdrNext(){
  const days=careerEvents(), today=careerToday(), rank=e=>{ const i=CC_KIND_RANK.indexOf(e.kind); return i<0 ? 99 : i; };
  for(let n=0, d=today; n<=120; n++, d=ccAddDays(d, 1)){
    if(d>CC_YEAR_TO) break;
    const on=(days.get(d)||[]).filter(e=>CC_PLAYABLE.indexOf(e.kind)>=0 && (n || careerCanPlayKind(e.kind)));
    if(on.length) return {ev:on.slice().sort((a,b)=>rank(a)-rank(b))[0], day:d, n:n};
  }
  return null;
}
function ccHdrDate(iso){ const m=(L().calMonthsShort||[])[Number(String(iso).slice(5,7))-1];
  return m ? Number(String(iso).slice(8,10))+' '+m : ccFmtDay(iso); }
// Сдвиг рейтинга за сезон: от первого вечера сезона до сейчас.
function ccHdrSeasonDelta(){
  const cr=CAREER.career, first=(cr.log||[]).find(r=>r.season===cr.season && r.ovr!=null);
  return first ? Math.round((CAREER.player.ovr||0)-first.ovr) : 0;
}
/* ===== Игроки сайта: общая таблица карьер =====================================

   Его выбор 2.10 из списка «чего не хватает»: таблица, где своя карьера стоит
   среди чужих. Строку карьеры игра шлёт сама (ccBoardSend) на воркер mp.fncsdraft.com
   (/board, см. server/src/board.js): не чаще раза в 10 минут и только когда что-то
   поменялось. id карьеры — случайный и наружу не уходит: по нему строка
   обновляется и прячется. С file:// (пробы, сторожа) не шлётся ничего, если хост
   не задан явно (MP.host), — иначе каждая проверка писала бы в живую таблицу.

   Проверить строку сервер не может — карьера считается в браузере, — и вкладка
   так и пишет. Пустая таблица и упавший сервер — не ошибка игры: вкладка говорит
   «не отвечает», карьера идёт дальше. */
const CC_BOARD_EVERY=10*60000;
let CC_BOARD_T=null, CC_BOARD_REGION=null, CC_BOARD_DATA=null, CC_BOARD_SORT=null, CC_BOARD_PAGE=0;
function ccBoardBase(){
  const h=(typeof MP!=='undefined' && MP.host) || '';
  if(!h && location.protocol==='file:') return null;
  return String(h||'wss://mp.fncsdraft.com').replace(/^wss:/, 'https:').replace(/^ws:/, 'http:')+'/board';
}
function ccBoardOn(){
  const cr=CAREER && CAREER.career;
  return !!(cr && !CAREER._mgr && !(cr.board && cr.board.off) && ccBoardBase());
}
function ccBoardId(){
  const cr=CAREER.career;
  cr.board=cr.board||{};
  if(!cr.board.id){
    let id='';
    try{ id=crypto.randomUUID(); }catch(e){ id=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2); }
    cr.board.id=String(id).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);
    // Сразу в сейв: иначе после перезагрузки до следующего сохранения карьера получала новый id и вторую строку.
    try{ careerSave(); }catch(e){}
  }
  return cr.board.id;
}
/* Не турнирные деньги внутри cr.earnings: бонус за подпись (ccPayIn в careerOrgSign) и призы своих турниров
   (игрок сам кладёт фонд и сам его выигрывает). Игрок 2.11: «пусть в таблице пишет призы только с турниров».
   Старые сейвы: бонусы — из ленты событий (tlSignBonus), свои капы — по дням cr.ownCups в журнале. */
function ccEarnSignOf(cr){
  if(cr.earnSign!=null) return cr.earnSign||0;
  let n=0; (cr.events||[]).forEach(e=>{ if(e && e.k && String(e.k).indexOf('tlSignBonus')===0) n+=Number(String((e.a||[])[1]||'').replace(/[^0-9]/g, ''))||0; });
  return n;
}
function ccEarnOwnOf(cr){
  const days=new Set(); (cr.ownCups||[]).forEach(c=>{ if(c && !c.off && c.day){ days.add(c.day); days.add(ccAddDays(c.day, 1)); } });
  let n=0; (cr.log||[]).forEach(r=>{ if(r && !r.who && r.prize>0 && (r.own || (r.kind==='victory' && days.has(r.day)))) n+=r.prize; });
  return n;
}
function ccEarnCups(cr){ return Math.max(0, Math.round((cr.earnings||0)-ccEarnSignOf(cr)-ccEarnOwnOf(cr))); }
// Строка карьеры: то, что о ней видно всем.
function ccBoardRow(){
  const pl=CAREER.player, cr=CAREER.career, log=cr.log||[];
  let best=null;
  log.forEach(r=>{ if(!(r && r.place>0 && r.of>0)) return;
    if(!best || r.place<best.place || (r.place===best.place && r.of>best.of)) best=r; });
  return {id:ccBoardId(), nick:String(pl.nick||pl.handle||'').slice(0, 24), region:ccCareerRegion(),
          country:String(pl.country||'').toLowerCase().slice(0, 2), seasons:Math.max(1, cr.season||1),
          earn:ccEarnCups(cr), earnAll:ccEarnCups(cr)+Math.round(ccEarnSignOf(cr)), ovr:Math.round(ccMyShownOvr()||pl.ovr||1),
          div:Math.min(5, Math.max(1, cr.division||5)), titles:log.filter(r=>r && r.place===1).length,
          year:(typeof ccCalYear==='function' ? ccCalYear() : 2026),
          best: best ? best.place+'/'+best.of : '', bestEv: best ? String(best.kind||'cup') : '',
          spent:ccSpentBig(), income:ccIncomeAll(cr)};
}
// Весь доход карьеры: призы (со своими турнирами и бонусами за подпись), зарплата, подработка и кастомки — строки статистики.
function ccIncomeAll(cr){ return Math.max(0, Math.round((cr.earnings||0)+Math.max(0, cr.wages||0)+(cr.side||0))); }
// После сохранения — отложенно, чтобы десять сохранений вечера дали одну отправку.
function ccBoardSoon(){
  if(!ccBoardOn()) return;
  clearTimeout(CC_BOARD_T);
  CC_BOARD_T=setTimeout(()=>{ try{ ccBoardSend(false); }catch(e){} }, 3000);
}
/* Notion 13.10, 0:41: «таблица не обновляется, с разных акков смотрю, уже как день». Было три дыры:
   ключ строки записывался ДО ответа сервера — упал запрос или сервер ответил «рано» (skip:'gap'), и
   строка считалась отправленной до следующих денег; отправка внутри 10 минут просто пропадала, без
   повтора; а сама таблица читалась один раз за жизнь вкладки (CC_BOARD_DATA). Теперь ключ — только
   после принятой строки, отложенная отправка дожидается окна, таблица перечитывается при открытии. */
function ccBoardLater(ms){
  clearTimeout(CC_BOARD_T);
  CC_BOARD_T=setTimeout(()=>{ try{ ccBoardSend(false); }catch(e){} }, Math.max(3000, ms));
}
function ccBoardSend(force){
  if(!ccBoardOn()) return Promise.resolve(false);
  const cr=CAREER.career, row=ccBoardRow();
  const key=[row.nick, row.region, row.earn, row.earnAll, row.div, row.titles, row.best, row.seasons, row.spent, row.income].join('|');
  const b=cr.board;
  if(!force && b.key===key) return Promise.resolve(false);
  if(!force && b.sent && Date.now()-b.sent < CC_BOARD_EVERY){ ccBoardLater(CC_BOARD_EVERY-(Date.now()-b.sent)); return Promise.resolve(false); }
  b.sent=Date.now();
  return fetch(ccBoardBase(), {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(row)})
    .then(r=>r.ok ? r.json().catch(()=>({ok:true})) : null)
    .then(j=>{
      if(j && j.ok && !j.skip){ b.key=key; return true; }
      if(j && j.skip) ccBoardLater(61000);   // сервер берёт строку раз в минуту — повторить после неё
      return false;
    }).catch(()=>false);
}
function ccBoardToggle(){
  const cr=CAREER.career; cr.board=cr.board||{};
  const id=ccBoardId();
  cr.board.off=!cr.board.off;
  careerSave();
  const base=ccBoardBase();
  const done=()=>{ CC_BOARD_DATA=null; careerTab('world'); };
  if(!base){ done(); return; }
  (cr.board.off ? fetch(base, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id:id, del:true})})
                : ccBoardSend(true)).catch(()=>{}).then(done, done);
}
function ccBoardRegion(r){ CC_BOARD_REGION=r||null; CC_BOARD_PAGE=0; CC_BOARD_DATA=null; careerTab('world'); }
// Страницы по сто строк (его «и они листаются»).
function ccBoardPage(d){ CC_BOARD_PAGE=Math.max(0, CC_BOARD_PAGE+d); CC_BOARD_DATA=null; careerTab('world'); }
// По призовым или по тратам (15.10: роскошь и «Потрачено»).
function ccBoardSort(k){ CC_BOARD_SORT=k||null; CC_BOARD_PAGE=0; CC_BOARD_DATA=null; careerTab('world'); }
function ccBoardLoad(){
  const base=ccBoardBase();
  if(!base) return Promise.resolve({err:true});
  const cr=CAREER.career;
  const q='?'+(CC_BOARD_REGION ? 'region='+encodeURIComponent(CC_BOARD_REGION)+'&' : '')+
          (CC_BOARD_SORT ? 'sort='+CC_BOARD_SORT+'&' : '')+(CC_BOARD_PAGE ? 'page='+CC_BOARD_PAGE+'&' : '')+'me='+encodeURIComponent((cr.board && cr.board.id) || '');
  return fetch(base+q).then(r=>r.ok ? r.json() : {err:true}).catch(()=>({err:true}));
}
function careerWorldHTML(){
  const T=L(), cr=CAREER.career, off=!!(cr.board && cr.board.off);
  const regs=[[null, T.lbAll]].concat(['EU','NAC','NAW','BR','ASIA','ME','OCE'].map(r=>[r, ccRegShort(r)]));
  const head='<div class="lb-top"><div class="lb-regs">'+regs.map(([k,t])=>
      '<button class="ch-subtab'+(CC_BOARD_REGION===k?' on':'')+'" onclick="ccBoardRegion('+(k?'\''+k+'\'':'null')+')">'+esc(t)+'</button>').join('')+
    '</div><button class="ch-swap" onclick="ccBoardToggle()">'+esc(off ? T.lbShow : T.lbHide)+'</button></div>'+
    '<div class="lb-regs">'+[[null, T.lbByEarn], ['all', T.lbByAll], ['inc', T.lbByInc], ['spent', T.lbBySpent]].map(([k,t])=>
      '<button class="ch-subtab'+(CC_BOARD_SORT===k?' on':'')+'" onclick="ccBoardSort('+(k?'\''+k+'\'':'null')+')">'+esc(t)+'</button>').join('')+'</div>'+
    '<div class="ch-hint">'+esc(T.lbNote)+' '+esc(CC_BOARD_SORT==='all' ? T.lbAllNote : CC_BOARD_SORT==='inc' ? T.lbIncNote : CC_BOARD_SORT==='spent' ? '' : T.lbCupNote)+'</div>';
  /* Прочитанная таблица живёт минуту и только для своей карьеры: старше — перечитывается при открытии
     (старая видна, пока идёт новая), другая карьера в слоте — читает свою. */
  const bid=(cr.board && cr.board.id) || '';
  let d=CC_BOARD_DATA;
  if(d && d._for!==bid) d=CC_BOARD_DATA=null;
  if(!d || (!d._busy && Date.now()-(d._at||0) > 60000)){
    if(d) d._busy=true;
    // Сначала своя строка (чтобы таблица увидела сегодняшние деньги), потом чтение.
    ccBoardSend(false).then(()=>ccBoardLoad()).then(x=>{
      CC_BOARD_DATA=Object.assign(x||{err:true}, {_at:Date.now(), _for:bid});
      if(CH_TAB==='world') careerTab('world'); });
    if(!d) return head+'<div class="ch-hint">'+esc(T.lbLoad)+'</div>';
  }
  if(d.err) return head+'<div class="ch-hint">'+esc(T.lbErr)+'</div>';
  /* Одна и та же карьера двумя строками (Notion 13.10: «FLC sharko» дважды, все числа одни) — строка ушла
     с новым id до сохранения сейва. Одинаковые строки показываются один раз. */
  const seenRow=new Set(), rows=(d.rows||[]).filter(r=>{ if(r.you) return true;
    const k=[r.nick, r.region, r.country, r.seasons, r.earn, r.titles].join('|');
    if(seenRow.has(k)) return false; seenRow.add(k); return true; });
  /* Скрытая карьера — заметно и с кнопкой рядом (Notion 13.10: «меня с таблицы убрали… не обновляется
     таблица» — у него была нажата «Не показывать меня», а подпись об этом терялась серой строкой). */
  const me=d.you ? '<div class="lb-you">'+esc(T.lbYou(d.you.rank, d.total))+'</div>'
                 : (off ? '<div class="lb-you">'+esc(T.lbHidden)+' <button class="ch-swap" onclick="ccBoardToggle()">'+esc(T.lbShow)+'</button></div>' : '');
  if(!rows.length) return head+me+'<div class="ch-hint">'+esc(T.lbEmpty)+'</div>';
  const c=T.lbCols.slice(); if(CC_BOARD_SORT==='spent') c[3]=T.lbSpentCol; else if(CC_BOARD_SORT==='all') c[3]=T.lbAllCol; else if(CC_BOARD_SORT==='inc') c[3]=T.lbIncCol;
  const base0=(d.page||0)*(d.per||100);
  const flag=cc=>cc ? '<img class="ch-bio-flag" src="flags/w20/'+esc(ccCountryOf(cc))+'.png" alt="" onerror="this.remove()"> ' : '';
  const evw=k=>{ try{ return ccFfKindWord(k)||''; }catch(e){ return ''; } };
  const tr=(r,i,abs)=>'<tr class="'+(r.you?'lb-me':'')+'"><td>'+(abs ? i+1 : base0+i+1)+'</td><td>'+flag(r.country)+esc(r.nick)+
    '<small> · '+esc(T.lbSeasons(r.seasons))+'</small></td><td>'+esc(r.region)+'</td><td>$'+ccNum(CC_BOARD_SORT==='spent' ? (r.spent||0) : CC_BOARD_SORT==='inc' ? (r.income||0) : CC_BOARD_SORT==='all' ? (r.earnAll!=null ? r.earnAll : r.earn) : r.earn)+
    '</td><td>'+r.ovr+'</td><td>'+r.div+'</td><td>'+r.titles+'</td><td>'+(r.best ? esc(r.best)+(r.bestEv ? ' <small>'+esc(evw(r.bestEv))+'</small>' : '') : '-')+'</td></tr>';
  let body=rows.map((r,i)=>tr(r,i)).join('');
  if(d.you && !rows.some(r=>r.you)) body+='<tr class="lb-gap"><td colspan="8">…</td></tr>'+tr(Object.assign({you:true}, d.you.row), d.you.rank-1, true);
  const per=d.per||100, pages=Math.max(1, Math.ceil((d.total||0)/per)), pg=d.page||0;
  const nav=pages>1 ? '<div class="lb-regs lb-pages"><button class="ch-subtab"'+(pg>0?'':' disabled')+' onclick="ccBoardPage(-1)">‹</button>'+
    '<span class="ch-hint">'+esc(T.lbPage(pg*per+1, Math.min(d.total||0, (pg+1)*per), d.total||0))+'</span>'+
    '<button class="ch-subtab"'+(pg<pages-1?'':' disabled')+' onclick="ccBoardPage(1)">›</button></div>' : '';
  return head+me+'<div class="lb-wrap"><table class="lb-table"><thead><tr>'+c.map(x=>'<th>'+esc(x)+'</th>').join('')+
    '</tr></thead><tbody>'+body+'</tbody></table></div>'+nav;
}
// Подвкладки объединённых вкладок: «Медиа» = соцсети + стримы, «Таблицы» = PR/призовые + моя статистика + игроки сайта.
function ccSubTabsHTML(group){
  // Discord — своей вкладкой рядом с соцсетями (его скрин 19.11: стрелка из меню ленты на ряд вкладок).
  const list=group==='media' ? [['social', L().chTabSocial], ['streams', L().chTabStreams], ['youtube', L().chTabYt], ['tiktok', 'TikTok'], ['discord', 'Discord']]
                             : [['table', L().lfSubPrMoney], ['stats', L().chTabStats], ['world', L().lbTab]];
  return '<div class="ch-subtabs">'+list.map(([k,t])=>'<button class="ch-subtab ch-subtab-'+k+(CH_TAB===k?' on':'')+'" onclick="careerTab(\''+k+'\')">'+esc(t)+'</button>').join('')+'</div>';
}
// Ряд Social/Twitch/YouTube/Discord внутри вкладки - только на телефоне: шире 700px те же кнопки стоят в полосе вкладок (ccTabsSide).
function ccMediaPhHTML(){ return '<div class="ch-media-ph">'+ccSubTabsHTML('media')+'</div>'; }
function careerRenderHubBody(tab){
  CH_TAB=tab||CH_TAB;
  try{ ccPirateNews(); }catch(e){}
  try{ ccYearThemeApply(); }catch(e){}
  // На «Центре» вкладки хаба живут в шапке лобби (Notion «19.10»: две полосы вкладок одна над другой) — своя прячется.
  try{ document.getElementById('screen-career-hub').classList.toggle('ch-lobby-on', CH_TAB==='centre'); }catch(e){}
  const pl=CAREER.player, cr=CAREER.career;
  const card=careerCard(), a=card?attrsFor(card):null;
  // The same number the card prints: base plus connection plus age. The header
  // was leaving age out, so the hub said 63 while the card next to it said 67.
  // Capped at the top of the scale, the same way the card is: see shownOvr.
  const shown=ccMyShownOvr();

  const face=card ? (photoURL(card)||'') : '';
  document.getElementById('chWho').innerHTML=
    (face ? `<img class="ch-face" src="${face}" alt="" onerror="this.remove()">`
          : `<span class="ch-face"></span>`)+
    `<div><div class="ch-name">${CAREER.org?careerCrestImg(CAREER.org.name,17,'ch-crest'):''}${esc(pl.nick||'')}</div>`+
    /* The strip under the name, which he pointed at on 18 August: a bio rather
       than a stat line.

       It cannot be the whole bio — that is five clauses long by the second
       season and this is one line beside the rating, the energy and the money.
       So it takes the half a profile actually leads with: how old you are, the
       flag, who you play for, where you stand, and the one thing you have won
       that is worth saying first. The rest of it — every trophy, the earnings,
       the manager — is in the profile tile on the centre, which is the place
       built to hold it. */
    `<div class="ch-sub">${[
      // Age and flag are one thing, the way "17 🇩🇰" is one thing: a separator
      // between them would be a dot standing on its own.
      [ccPlayerAge() ? String(ccPlayerAge()) : '',
       pl.country ? `<img class="ch-bio-flag" src="flags/w20/${
         esc(ccCountryOf(String(pl.country).toLowerCase()))}.png" alt="" title="${
         esc(ccCountryName(pl.country)||'')}">` : ''].filter(Boolean).join(' '),
      CAREER.org ? esc(CAREER.org.name) : '',
      ccNoDivisions() ? '' : L().ccDivision+' '+cr.division,
      L()[a?a.roleKey:pl.role]||'',
      ccInputIcon(ccInputOf(pl)),
      careerTopHonour()
    ].filter(Boolean).join(' · ')}</div></div>`+
    '';   // колокольчик снят 29.09 («хаб такой же как был») — входящие строкой в «Центре»
  const dOvr=ccHdrSeasonDelta();
  document.getElementById('chOvr').innerHTML=`${shown}<span class="ch-ovr-side"><small>${L().ccRoOvr}</small>`+
    (dOvr ? `<i class="ch-ovr-d ${dOvr>0?'up':'down'}" title="${esc(L().lfHdrSeason)}">${dOvr>0?'▲ +'+dOvr:'▼ '+dOvr}</i>` : '')+`</span>`;
  const chOvrEl=document.getElementById('chOvr');
  chOvrEl.onclick=()=>careerTab('log'); chOvrEl.classList.add('ch-go');
  // Energy is the only number up here that belongs to today rather than to the
  // career, and it was only ever drawn inside the day panel — which is the one
  // thing that is not on screen on a day with a tournament on it. It leads the
  // row so the two money numbers stay together at the end of it.
  // A bar rather than a number, the way a health bar reads: how much of the day
  // is left is a length you can see without reading it.
  const energyLeft=careerEnergy();
  document.getElementById('chPurseNow').innerHTML=
    `<div class="ch-en"><em>${L().ccRingEnergy}</em>`+
      `<div class="ch-en-row"><span class="ch-en-mark">${L().ccEnergyMark}</span>`+
      `<span class="ch-en-bar${energyLeft?'':' out'}">`+
      `<i style="width:${Math.round(energyLeft/careerEnergyMax()*100)}%"></i></span>`+
      `<b class="${energyLeft?'':'ch-spent'}">${energyLeft}</b></div></div>`+
    // Настрой напарника — рядом с энергией, только когда напарник есть.
    ((careerMateRec() || (typeof ccMpTeam==='function' && ccMpTeam())) ? (()=>{ const m=Math.round(careerPatience());
      return `<div class="ch-en ch-mood"><em>${L().ccRingMood}</em>`+
        `<div class="ch-en-row"><span class="ch-en-mark">🤝</span>`+
        `<span class="ch-en-bar${m<35?' low':''}"><i style="width:${Math.max(0,Math.min(100,m))}%"></i></span>`+
        `<b>${m}</b></div></div>`; })() : '')+
    // The balance rather than the lifetime prize money: this strip is read
    // before spending — a coach, a month at the bootcamp, a rig — and the
    // number that answers "can I" is what is left, not what was ever won. The
    // career's total keeps its place in the ladder tile and the history.
    `<div class="ch-go" onclick="careerTab('shop')"><em>${L().ccBalance}</em><b class="ch-cash">${ccMoney(cr.balance||0)}</b>${
      ccPayPending()>0 ? ccPayPendHTML() : ''}</div>`+
      // V-Bucks рядом с балансом (Notion «18.10»): тап — магазин предметов.
      `<div class="ch-go" onclick="ccFnShopOpen()"><em>V-Bucks</em><b class="ch-cash ch-vb"><i class="cc-vb-ic"></i>${ccNum(CAREER.vb||0)}</b></div>`+
    (ccTechToday() ? `<div><em>${esc(L().ccTechLbl||'Connection')}</em><b class="cc-pen bad">📶 −${CC_TECH_PEN}</b></div>` : '')+
    /* Form, reputation and burnout, which used to live in the ladder tile.

       They belong up here rather than in a tile you scroll to: all three are the
       state a career is in today, they change what the next tournament does, and
       burnout in particular is a penalty — the one number this file refuses to
       let move silently. Each is drawn only when it is not zero, so a career
       with nothing wrong with it does not carry three empty labels. */
    /* Форма и репутация — всегда, с пределом и подсказкой (его слово 21.10: «не понятно, как работает, мб когда
       наводишься — говорит», «не понятно, сколько максимум, минимум»). Наведение на ПК, нажатие на телефоне. */
    /* Форма и репутация шкалой от минуса до плюса и стрелкой «за сегодня» (22.11, его «reputation и form мб измениться
       как-то»): слова «off it -0.6» и «0 nobody knows yet of ±25» не читались. Снимок начала дня - cr.fr0 (ccFrDay). */
    (()=>{ const f=careerForm(), T=L(), v=Math.round(f*10)/10, d0=ccFrDay();
      return `<div class="ch-tipw ch-meter-w" tabindex="0" onclick="ccTipToggle(this, event)"><em>${T.ccForm} ⓘ</em><b class="${f>0?'ch-goal-met':f<0?'cc-pen bad':''}">${(v>0?'+':'')+v}${
        f ? ' <span class="ch-rep-w">'+esc(T[f>0?'ccFormHot':'ccFormCold'])+'</span>' : ''}${ccFrDelta(f-d0.f, 1)}</b>${ccFrMeterHTML(f, CC_FORM_MAX)}${
        '<div class="ch-tip">'+esc(T.ccFormTip(CC_FORM_MAX))+'</div>'}</div>`; })()+
    // The garage, said where the form is said — confidence is the floor under
    // it, and a number nobody can see is a number that does not exist. His
    // report, 20 August: confidence нигде не пишется.
    (()=>{ const c=(CAREER.gear && CAREER.gear.conf)||0; if(!c) return '';
      return `<div><em>${L().ccShopConf}</em><b class="ch-goal-met">+${c} · ${
        L().ccConfFloor(Math.round((CC_FORM_MAX-c)*10)/10)}</b></div>`; })()+
    (()=>{ const r=careerRep(), T=L(), d0=ccFrDay();
      return `<div class="ch-tipw ch-meter-w" tabindex="0" onclick="ccTipToggle(this, event)"><em>${T.ccRep} ⓘ</em><b class="${r>0?'ch-goal-met':r<0?'cc-pen bad':''}">${
        r>0?'+':''}${r} <span class="ch-rep-w">${esc(T[careerRepKey()])}</span>${ccFrDelta(r-d0.r, 0)}</b>${ccFrMeterHTML(r, CC_REP_MAX)}${
        '<div class="ch-tip">'+esc(T.ccRepTip(CC_REP_MAX, CC_REP_PER_OVR, T)+' '+T.ccRepMore(CC_REP_MAX, CC_REP_WIN, CC_REP_POD))+'</div>'}</div>`; })()+
    (()=>{ const b=careerBurnout(); if(!b) return '';
      return `<div><em>${L().ccBurnout}</em><b class="cc-pen bad">${
        L().ccBurnoutDays(cr.grind||0)} · -${b}</b></div>`; })();
  document.getElementById('chPurse').innerHTML=
    `<div><em>${L().chSeason}</em><b>${cr.season}</b></div>`+
    `<div class="ch-go" onclick="careerTab('calendar')"><em>${L().chWeek} ${careerWeek()}/${ccYearWeeks()}</em><b>${
      esc(ccHdrDate(careerToday()))}</b></div>`+
    `<div class="ch-go" onclick="careerTab('social')"><em>${L().xFollowers}</em><b>${ccFollowers(careerReach())}</b></div>`+
    // Твич — своя аудитория, врозь с твиттером.
    `<div class="ch-go" onclick="careerTab('streams')"><em>Twitch</em><b>${ccFollowers(CAREER.career.twitch||0)}</b></div>`;
  // Полоса «Далее»: ближайший турнир и сколько до него дней.
  let nx=document.getElementById('chNext');
  if(!nx){ nx=document.createElement('div'); nx.id='chNext'; nx.className='ch-hnext';
    const top=document.querySelector('#screen-career-hub .ch-top'); if(top) top.appendChild(nx); }
  const nxt=cr.seasonOver ? null : ccHdrNext();
  nx.style.display=nxt ? '' : 'none';
  if(nxt){
    const art=(typeof ccEventArt==='function') ? ccEventArt(nxt.ev) : '';
    nx.onclick=()=>careerTab(nxt.n ? 'calendar' : 'centre');
    nx.innerHTML=(art ? `<img src="${esc(art)}" alt="" onerror="this.remove()">` : '')+
      `<em>${esc(nxt.n ? L().lfHdrNext : L().lfHdrToday)}</em>`+
      `<b>${esc(nxt.ev.label||'')}</b>`+
      `<span>${esc(nxt.n ? L().lfHdrIn(nxt.n)+' · '+ccHdrDate(nxt.day) : L().lfHdrPlay)}</span>`;
  }

  // Подсвечена главная вкладка группы открытой вкладки (CC_TAB_GROUPS).
  const onTab=ccTabGroupOf(({stats:'table', world:'table'}[CH_TAB]||CH_TAB));
  document.querySelectorAll('#screen-career-hub .ch-tab').forEach(b=>{ b.classList.toggle('on', b.dataset.tab===onTab); });
  const stdot=document.getElementById('chStoreDot');
  if(stdot) stdot.style.display = careerShopNew().length ? 'inline-block' : 'none';
  // The unread dot is the lobby's own notification mark — it is the only thing
  // on this screen that asks to be clicked.
  // The dot counts both halves of that screen now: a message waiting, and a feed
  // that has moved since it was last read. The tab is one button, so it cannot
  // promise only one of the two things behind it.
  const dot=document.getElementById('chDmDot');
  if(dot) dot.style.display = careerNotesN() ? 'inline-block' : 'none';
  // The same mark on the shop: something is affordable that was not the last
  // time it was opened. A desk of twelve rows does not announce itself, and
  // the money arrives on a payday the player was not looking at.
  const sdot=document.getElementById('chShopDot');
  if(sdot) sdot.style.display = careerShopNew().length ? 'inline-block' : 'none';

  const body=document.getElementById('chBody');
  // A finished career has no next week. Every other tab still opens — the
  // history, the table, the feed and the card are what is left of it.
  // Забаненному закрыт и календарь — правка: «когда банят,
  // календарь не должен работать». Ушедшему на пенсию он остаётся: пенсия —
  // это решение смотреть на сцену со стороны, бан — дверь, закрытая Epic.
  if(careerRetired() && (CH_TAB==='centre' || CH_TAB==='shop' ||
     (CH_TAB==='calendar' && careerBanned()))){
    body.innerHTML=careerRetiredHTML(); return;
  }
  if(CH_TAB==='calendar'){ body.innerHTML=careerCalendarHTML()+ccOwnCupPanelHTML(); return; }
  // 'log' — вкладка Профиль (ключ остался прежним ради сохранений),
  // 'hist' — История: сезоны и лента карьеры.
  if(CH_TAB==='log'){ body.innerHTML=careerProfileHTML(); return; }
  if(CH_TAB==='hist'){ body.innerHTML=careerHistoryHTML(); return; }
  if(CH_TAB==='stats'){ body.innerHTML=ccSubTabsHTML('boards')+careerStatsHTML(); return; }
  if(CH_TAB==='world'){ body.innerHTML=ccSubTabsHTML('boards')+careerWorldHTML(); return; }
  if(CH_TAB==='streams'){ body.innerHTML=ccMediaPhHTML()+'<div class="cc-media cc-media-tw">'+careerStreamsHTML()+'</div>'; return; }
  // Two standings on one tab: the division's season table, which only Division 1
  // has, and the money, which everybody is in.
  if(CH_TAB==='table'){
    // Сезонной таблицы Д1 больше нет — отзыв: «убери эту
    // таблицу, power ranking оставь». Вкладка — деньги и ПР.
    body.innerHTML=ccSubTabsHTML('boards')+'<div class="ch-grid ch-standings">'+careerMoneyHTML()+
                   careerPrHTML()+careerMobileHTML()+'</div>';
    return;
  }
  if(CH_TAB==='shop'){ body.innerHTML=careerShopHTML(); ccPaintMoveMap(); return; }
  // Медиа в цветах своих сетей (28.10, его «соцсети в цвете X, стримы в цвете твич, youtube в цветах ютуб»).
  // Папки входящих (клубы, игроки, зрители, хейтеры, лента) - наверху соцсети: из полосы вкладок их сменили кнопки медиа.
  if(CH_TAB==='social'){ let nb=''; try{ nb=careerNoteBarHTML(); }catch(e){}
    body.innerHTML=ccMediaPhHTML()+(nb ? '<div class="cc-lb-note cc-social-note">'+nb+'</div>' : '')+ccRumorTileHTML()+'<div class="cc-media cc-media-x">'+careerSocialHTML()+'</div>'; return; }
  if(CH_TAB==='tiktok'){ body.innerHTML=ccMediaPhHTML()+'<div class="cc-media cc-media-tt">'+careerTtHTML()+'</div>'; return; }
  if(CH_TAB==='youtube'){ body.innerHTML=ccMediaPhHTML()+'<div class="cc-media cc-media-yt">'+careerYtHTML()+'</div>'; return; }
  if(CH_TAB==='discord'){ body.innerHTML=ccMediaPhHTML()+'<div class="cc-media cc-media-dc">'+ccDiscordHTML()+'</div>'; try{ ccDcLayout(body); }catch(e){ console.error(e); } return; }
  /* The career itself, on its own screen.

     The centre was doing two jobs — what to do today, and who you have deals
     with — and the second one is read once a month while taking most of the
     room. His call, 18 August, after four passes at rearranging it: the centre
     is today, and everything that describes the career rather than the day gets
     its own tab. The two cards, who you are, the seat beside you, and the four
     people who pay you or take a cut. */
  // Шкафчик — и во вкладке «Я» (17.10, его «где шкафчик»: на телефоне правая колонка соцсети уезжает под ленту).
  // Шкафчик из карьеры убран целиком (19.10: «в карьере убери шкафчик», «и в медиа тоже не нужна»).
  if(CH_TAB==='me'){ body.innerHTML=careerMeHTML(); return; }
  // Шкафчик: образ (выбор скина открыт сразу) и награды.
  // Item Shop — своя вкладка рядом со шкафчиком (18.10, его «сделай item shop отдельный рядом с шкафчиком»).
  if(CH_TAB==='items'){ body.innerHTML='<div class="ch-grid" style="grid-template-columns:minmax(0,1fr);">'+ccFnShopHTML()+'</div>'; return; }
  // 19.10 вечером шкафчик вернулся своей вкладкой (его «шкафчик верни, он должен быть отдельным»), не внутри Медиа/Профиля.
  // Батл пасс сезона — рядом со шкафчиком.
  if(CH_TAB==='bp'){ body.innerHTML='<div class="ch-grid cc-bp" style="grid-template-columns:minmax(0,1fr);">'+ccBpHTML()+'</div>'; return; }
  if(CH_TAB==='locker'){ if(!CC_FN_PICK) CC_FN_PICK='o'; body.innerHTML='<div class="ch-grid" style="grid-template-columns:minmax(0,1fr);">'+ccLockerHTML()+'</div>'; return; }
  /* Задачи клуба и месяца (ccGoalsTileHTML) - во вкладке «Клуб», а не в «Тренировке» (22.11, Notion «20.11»: «это лишнее
     в тренинг»). Выбор задачи месяца живёт там же. */
  if(CH_TAB==='club'){ const goals=ccGoalsTileHTML(true);
    body.innerHTML=(goals ? '<div class="ch-grid ch-grid-me ch-train-goals">'+goals+'</div>' : '')+careerClubTabHTML(); return; }
  // Цели и развитие — сверху «Тренировки»: с «Центра» они ушли, когда он вернулся к виду прода (29.09).
  /* Тренировка без повторов (27.10, его «тренировки чет облегчить, слишком много информации»): шесть параметров стояли
     трижды (Развитие, Фокус/Цель, панель дня), усталость дважды, пустая плитка задач без клуба. Здесь — задачи, только
     если они есть (без своей цели и фокуса: они в плане недели); параметры — один раз, в панели дня. Плитки «Развитие»
     нет: рейтинг и его ход за сезон уже стоят в шапке (#chOvr). */
  if(CH_TAB==='train'){ body.innerHTML=careerTrainTabHTML(); return; }
  // The card tab is gone — the centre already wears the card, and a whole tab
  // that repeated it sat between the calendar and the socials for no reason.
  body.innerHTML=careerCentreHTML(card, a);
}

/* Лобби как в Fortnite (его «главное меню как в фортнайте сейчас, чтоб было видно скин и кнопка реди»): посередине
   свой надетый скин в полный рост, по бокам напарники (у них своего образа нет — стандартные скины Fortnite, у
   каждого свой по нику), над головами ник и рейтинг; справа внизу — ближайшее событие и большая жёлтая кнопка.
   Кнопка — та же, что в панели ниже (первая .ch-play из btn): её действие, подпись и запрет, ничего своего. */
const CC_LB_DEFAULTS=['cid_005_athena_commando_m_default','cid_001_athena_commando_f_default','cid_006_athena_commando_m_default',
  'cid_002_athena_commando_f_default','cid_007_athena_commando_m_default','cid_003_athena_commando_f_default',
  'cid_008_athena_commando_m_default','cid_004_athena_commando_f_default'];
/* Популярные у про-игроков скины (его «просто добавь рандомные популярные скины»: реальных «чей скин у кого» нет —
   они только в реплеях, см. Osirion) — [id, первый день в магазине по fn-shop.js]: в 2019-м никто не стоит в скине 2024-го. */
const CC_LB_POPULAR=[['cid_044_athena_commando_f_scipop','2019-01-02'],['cid_170_athena_commando_f_luchador','2019-01-02'],
  ['cid_160_athena_commando_m_speedyred','2019-01-03'],['cid_102_athena_commando_m_raven','2019-01-05'],['cid_334_athena_commando_m_scrapyard','2019-02-10'],
  ['cid_061_athena_commando_f_skigirl','2019-02-20'],['cid_397_athena_commando_f_treasurehunterfashion','2019-05-08'],
  ['cid_452_athena_commando_f_cyberfu','2019-07-12'],['cid_472_athena_commando_f_cyberkarate','2019-07-21'],
  ['cid_493_athena_commando_f_jurassicarchaeology','2019-08-04'],['cid_029_athena_commando_f_halloween','2019-10-31'],
  ['cid_748_athena_commando_f_hitman','2020-04-18'],['cid_726_athena_commando_m_targetpractice','2020-05-15'],
  ['cid_784_athena_commando_f_renegaderaiderfire','2020-06-28'],['cid_795_athena_commando_m_dummeez','2020-08-05'],
  ['cid_a_158_athena_commando_f_buffet_yc20h','2021-08-05'],['cid_a_359_athena_commando_f_bunnypurple','2022-03-11'],
  ['cid_a_377_athena_commando_f_littleegg_omnb5','2022-05-08'],['cid_028_athena_commando_f','2024-12-20']];
// Icon-скины самих игроков: на своём хозяине — с даты выхода.
const CC_LB_ICON={ninja:['cid_605_athena_commando_m_tourbus','2020-01-17'], lachlan:['cid_891_athena_commando_m_lunchbox','2020-11-13'],
  loserfruit:['cid_764_athena_commando_f_loofah','2020-06-22'], thegrefg:['cid_990_athena_commando_m_grilledcheese_snx4k','2021-01-17'],
  bugha:['cid_a_140_athena_commando_m_bluecheese','2021-07-21'], 'ali-a':['cid_a_415_athena_commando_m_alfredo','2022-05-20'],
  clix:['character_twilightspotspell','2025-03-23'], mongraal:['character_vigorknackdill','2026-06-28']};
/* ГЛАВНОЕ МЕНЮ ТОГО СЕЗОНА (его «посмотри главное меню каждого сезона и сделай так же», «модельки расположены как в
   фортнайте», «внизу не должно быть информации, всё в главном меню»). Три семейства по истории лобби Fortnite Wiki
   (Template:LobbyHistory, скриншоты по версиям):
     A — Глава 1: узкая полоса вкладок сверху, слева «SEASON N», уровень с полоской XP, золотой тир, «DAILY CHALLENGES»,
         справа внизу плашка режима и широкая жёлтая PLAY, снизу полоса кнопок;
     B — Главы 2–4 (v11.00): открытые белые вкладки, слева «CHAPTER N / SEASON M», уровень, синяя VIEW QUESTS, ресурсы
         сезона; справа карточка новости, режим, синяя CHANGE, жёлтая PLAY!, синяя FILL;
     C — с v26.30 (октябрь 2023): вкладки-пилюли с сеткой и поиском, слева новость и тёмная карточка режима с серой
         плашкой и скруглённой PLAY, справа внизу кольцо LVL, снизу ряд плиток.
   Общее у всех: четыре подиума — свой впереди посередине и светится, три сзади (один слева, два справа), на пустых «+»,
   над головой корона хозяина, ник и Ready / Not Ready. Фон — настоящий фон лобби сезона (ccLobbyBg).
   Всё, что было на «Центре» ниже, лежит в листе «Подробнее» (ccLbSheet) внутри меню: ничего под ним. */
let CC_LB_SHEET=false;
function ccLbSheet(on){
  CC_LB_SHEET=(on==null) ? !CC_LB_SHEET : !!on;
  const s=document.getElementById('ccLbSheet'); if(s) s.hidden=!CC_LB_SHEET;
  if(CC_LB_SHEET && s) try{ s.scrollIntoView({block:'start'}); }catch(e){}
}
// Подиумы как в лобби Fortnite: [x центра в % ширины, низ ног в % высоты, высота фигуры в % высоты].
const CC_LB_SLOTS=[[50, 9, 70], [37, 21, 55], [61, 21, 55], [72, 22, 53]];
/* Кто стоит в лобби рядом с тобой — состав того вечера, что идёт сегодня (Notion «19.10»: «когда кап
   на четверых — все четверо в лобби, и так же с трио»): сквад-кап в дуо-год — сквад-составом
   (CAREER.rosters[4]), трио-кап — трио, сборная — её состав, соло — один. В другие дни — состав сезона. */
function ccLobbySquadFor(next){
  const base=careerMates()||[];
  if(!next || !next.day) return base;
  try{
    if(next.type==='solo') return [];
    if(next.type==='nations'){
      const ev=careerNationsOn(next.day), mine=ccNationsMine();
      if(ev && mine){
        if(ccNatStage(ev)==='trial') return [];
        const me=hKey(careerCard());
        return (mine.full||[]).filter(c=>c && hKey(c)!==me);
      }
    }
    if(next.type==='victory' && !(typeof ccMpOn==='function' && ccMpOn())){
      const f=ccVictoryFormat(careerVictoryOn(next.day));
      if(f===1) return [];
      if(f && f!==careerSquadSize())
        return ccFmtRoster(f).map(ccMateCardOf).filter(c=>c && c.handle).slice(0, f-1);
    }
  }catch(e){}
  return base;
}
function ccLobbyHTML(card, btn, next, when, strip, ex){
  ex=ex||{};
  const T=L(), pl=CAREER.player, cr=CAREER.career, eq=CAREER.fnEq||{}, own=CAREER.fnOwn||{};
  const era=ccFnShopEra(careerToday()), fam=era.k==='c1' ? 'A' : (era.k==='c2' || era.k==='c3') ? 'B' : 'C';
  const today=careerToday(), used=new Set();
  const myOvr=Math.round((card && (card._ovr||card.rating)) || pl.ovr || 0);
  const myIcon=CC_LB_ICON[hKey(pl.handle||pl.nick||'')];
  const mySkin=eq.o && own[eq.o] ? eq.o : (myIcon && myIcon[1]<=today ? myIcon[0] : CC_LB_DEFAULTS[0]);
  used.add(mySkin);
  // Скин напарника: своя icon-скин, если уже вышла; иначе популярный у про-игроков, вышедший к этому дню; без повторов.
  const skinOf=c=>{
    // Живой напарник онлайн — в том, что надел сам (mp.js MP.card, fnSkin).
    if(c && c.fnSkin && !used.has(c.fnSkin)){ used.add(c.fnSkin); return c.fnSkin; }
    const icon=CC_LB_ICON[hKey(c)];
    if(icon && icon[1]<=today && !used.has(icon[0])){ used.add(icon[0]); return icon[0]; }
    const pool=CC_LB_POPULAR.filter(p=>p[1]<=today && !used.has(p[0]));
    if(pool.length){ const id=pool[ccHashStr(hKey(c))%pool.length][0]; used.add(id); return id; }
    const id=CC_LB_DEFAULTS.find(x=>!used.has(x)) || CC_LB_DEFAULTS[1]; used.add(id); return id;
  };
  // Готов ли вечер: сегодня есть что играть и кнопка не заперта — тогда Ready, иначе Not Ready (как в лобби).
  let ready=false; try{ ready=!!(next && next.day===today && careerCanPlay(next) && !cr.seasonOver); }catch(e){}
  const party=[{id:mySkin, name:pl.nick||pl.handle||'', ovr:myOvr, me:true, input:ccInputOf(pl)}]
    .concat(ccLobbySquadFor(next).filter(Boolean).slice(0, 3).map(c=>({id:skinOf(c), name:c.handle, ovr:Math.round(c._ovr||c.rating||0), input:ccProInput(c)})));
  // Места — классами cc-lb-s0…s3 (CSS: на ПК как в лобби, на телефоне шире), числа CC_LB_SLOTS — для ПК.
  const slot=(i)=>{
    const p=party[i], s=' cc-lb-s'+i;
    const ped='<span class="cc-lb-ped'+(i===0 ? ' me' : '')+s+'"></span>';
    // Пустых мест - сколько мест у состава этого формата: в соло-сезоне «+» не нужен вовсе (22.11).
    let seats=3; try{ seats=careerMateSeats(); }catch(e){}
    if(!p && i>seats) return ped;
    if(!p) return ped+'<button class="cc-lb-plus'+s+'" onclick="careerTab(\'me\')" title="'+esc(T.lfRosters)+'">+</button>';
    return ped+'<div class="cc-lb-fig'+(p.me ? ' me' : '')+s+'"'+(p.me ? ' onclick="ccFnLockerOpen(\'o\')"' : '')+'>'+
      '<img class="full" src="'+ccFnFull(p.id)+'" data-id="'+esc(p.id)+'" alt="" loading="lazy" crossorigin="anonymous" onload="ccLbFigCut(this)" onerror="ccFnHeroErr(this)">'+
      '<div class="cc-lb-plate">'+(p.me ? '<i class="cc-lb-crown">♛</i>' : '')+'<span class="cc-lb-hex">'+p.ovr+'</span><b>'+esc(p.name)+' <u>'+p.ovr+'</u></b>'+
      '<span class="cc-lb-in">'+ccInputIcon(p.input)+'</span>'+
      /* В свободный день метки нет вовсе: красное «Not Ready» без турнира читалось как ошибка (аудит ПК 22.10).
         Not Ready — только в день турнира, когда играть правда нельзя (нет напарника, кресло пустое). */
      ((next && next.day===today && next.type!=='free') ? '<em class="'+(ready ? 'ok' : '')+'">'+(ready ? 'Ready' : 'Not Ready')+'</em>' : '')+'</div></div>';
  };
  const stage='<div class="cc-lb-stage">'+[1,2,3,0].map(slot).join('')+'</div>';
  // Кнопка — та же, что в панели (первая .ch-play из btn): действие, подпись, запрет.
  const m=/<button class="ch-play([^"]*)"([^>]*)>([\s\S]*?)<\/button>/.exec(btn||'');
  const play=m ? '<button class="cc-lb-play'+m[1].replace(/\bch-/g, ' cc-lb-')+'"'+m[2]+'>'+m[3]+'</button>' : '';
  let evFmt=0; try{ if(next && next.type==='victory') evFmt=ccVictoryFormat(careerVictoryOn(next.day)); }catch(e){}
  const fmtWord=((next && next.type==='solo') || evFmt===1) ? 'Solo' : ({2:'Duos', 3:'Trios', 4:'Squads'})[evFmt||careerSquadSize()] || 'Duos';
  const evName=next ? (next.label||next.title||'') : '';
  const sn=ccLobbySeasonName(today);
  const lvlFrac=Math.max(0, Math.min(1, ((pl.ovrExact!=null ? pl.ovrExact : pl.ovr)||0)%1));
  let todayEv=null; try{ todayEv=(careerEvents().get(today)||[])[0]||null; }catch(e){}
  /* Фон — всегда фон сезона, как в ранкеде (его поправка 19.10: «во время капов тоже задний фон как в ранкеде, только кап
     меняется слева»): от капа меняются карточка новостей и карточка вечера слева. */
  const evBg='';
  // Карточка новостей — ближайший турнир (в свободный день — следующий по календарю), с его обложкой.
  let newsEv=null, newsDay='';
  try{ const ev=careerEvents(); for(let d=0; d<21 && !newsEv; d++){ const iso=ccAddDays(today, d), on=ev.get(iso)||[]; if(on.length){ newsEv=on[0]; newsDay=iso; } } }catch(e){}
  const nextArt=(newsEv && ccEventArt(newsEv)) || ccLobbyBg(today);
  const newsWhen=newsDay ? L().calDows[(new Date(newsDay+'T00:00:00Z').getUTCDay()+6)%7]+' '+Number(newsDay.slice(8))+' '+L().calMonthsShort[Number(newsDay.slice(5,7))-1] : (when||'');
  const sched=strip ? '<div class="cc-lb-sched"><div class="ch-weeks ch-days">'+strip+'</div></div>' : '';
  // Карточка вечера с «Центра» (ex.play): LIVE, матч N из M, сколько проходит, где высадка, кто играет, PLAY, эфир,
  // пропуск, перемотка. Без неё (старые вызовы) — простой блок режима.
  const playBox=ex.play ? '<div class="cc-lb-playbox">'+ex.play+'</div>' : '<div class="cc-lb-go">'+play+'</div>';
  // Внизу у всех глав: полоса сезона (недели) и расписание недели плитками — как на прошлом «Центре».
  const bottomBar=(ex.bar||'')+sched;
  let left='', right='';
  if(fam==='A'){
    left='<div class="cc-lb-season">'+esc(sn.a)+'</div>'+
      '<div class="cc-lb-lvl"><span class="cc-lb-banner">'+esc(String(cr.division||1))+'</span><div><b>LEVEL '+myOvr+'</b>'+
        '<u class="cc-lb-xp"><s style="width:'+Math.round(lvlFrac*100)+'%"></s></u></div></div>'+
      '<div class="cc-lb-tier" onclick="careerTab(\'table\')"><b>'+esc(T.ccDivision||'Division')+' '+(cr.division||1)+'</b><em>'+esc(ccLobbyWeek())+'</em></div>'+
      ccLobbyQuestsHTML('DAILY CHALLENGES')+(ex.side||'');
    // С карточкой вечера (ex.play) плашка режима не нужна: формат, название и день уже на ней (Notion «19.10», скрин 31).
    right='<div class="cc-lb-region">'+esc(regionName(ccCareerRegion()))+'</div>'+
      (ex.play ? '' : '<div class="cc-lb-modebox"><b>'+esc(fmtWord)+'</b><em>'+esc(evName)+(when ? ' · '+esc(when) : '')+'</em></div>')+playBox;
  } else if(fam==='B'){
    left='<div class="cc-lb-chap">'+esc(sn.c)+'</div><div class="cc-lb-sea">'+esc(sn.s)+'</div>'+
      '<div class="cc-lb-lvl2"><b>LEVEL '+myOvr+'</b><u class="cc-lb-xp"><s style="width:'+Math.round(lvlFrac*100)+'%"></s><i>'+esc(ccLobbyWeek())+'</i></u></div>'+
      '<button class="cc-lb-quests" onclick="this.nextElementSibling.hidden=!this.nextElementSibling.hidden">VIEW QUESTS</button>'+
      '<div hidden>'+ccLobbyQuestsHTML('')+'</div>'+
      (ex.side||'');
    // Плашки «день · вечер» и «DUOS» над карточкой вечера повторяли её же (Notion «19.10», скрин 31) — с ex.play их нет.
    right=(ex.play ? '' : '<div class="cc-lb-news" onclick="careerTab(\'calendar\')"><em>'+esc(when||'')+'</em><b>'+esc(evName)+'</b></div>'+
      '<div class="cc-lb-modebox"><b>'+esc(fmtWord)+'</b></div>')+playBox;
  } else {
    /* Лобби как в Fortnite (27.10): справа составы; кнопки Media / Item Shop / Locker повторяли вкладки — сняты, кольцо
       LVL осталось. Карточка новостей слева сверху — ВОЗВРАЩЕНА (27.10, его «новости в карьере на главной вернуть
       дизайн, который был, он точно лишним не был»): снимал её как повтор турнира, а она — лента новостей карьеры. */
    left=(ccLobbyNewsCardHTML() || '<div class="cc-lb-news cc-lb-card" onclick="careerTab(\'calendar\')"'+(nextArt ? ' style="--card-art:url('+nextArt+')"' : '')+'>'+
        '<em>'+esc(newsWhen)+'</em><b>'+esc(newsEv ? (newsEv.label||evName) : (evName||sn.s))+'</b></div>')+playBox;
    right='<div class="cc-lb-stack">'+(ex.side||'')+'</div>'+
      '<div class="cc-lb-ringrow">'+
      '<div class="cc-lb-ring" onclick="careerTab(\'train\')" style="--p:'+Math.round(lvlFrac*100)+'"><em>LVL</em><b>'+myOvr+'</b></div></div>';
  }
  if(ex.play){ setTimeout(ccLobbyFit, 0); setTimeout(ccLobbyFit, 800); }
  return '<div class="cc-lobby cc-lb-'+era.k+' cc-lb-fam'+fam+(ex.play ? ' cc-lb-full' : '')+(evBg ? ' cc-lb-evbg' : '')+'" style="--lb-bg:url('+(evBg||ccLobbyBg(today))+')">'+
    ccLobbyTopHTML(fam, ex.note)+stage+'<div class="cc-lb-left">'+left+'</div><div class="cc-lb-right">'+right+'</div>'+
    '<div class="cc-lb-bottom">'+bottomBar+'</div></div>';
}
// Подпись сезона дня: Глава 1 — «SEASON 9 / SEASON X»; дальше — «CHAPTER N» и «SEASON M» (или имя: OG, Remix…).
/* Новости слева сверху, как карусель новостей в лобби Fortnite: пять свежих из ленты карьеры, листаются сами,
   точки снизу; нажатие открывает ленту. */
let CC_LB_NEWS_T=null;
/* НОВОСТЬ КРУПНО (28.10, его «когда нажимаешь на новости, побольше приближает, больше подробностей, и закрыть
   крестиком»). Клик по карточке новостей открывает окно с той новостью, что сейчас на слайде: большая картинка,
   рубрика и полная дата, текст целиком (на карточке он обрезан до трёх строк), автор с аватаром, таблица мест, если
   она приложена к посту, стрелки по пяти свежим новостям и миниатюры. «Вся лента» — туда же, куда вела карточка.
   Закрывается крестиком, Esc и кликом мимо окна. */
let CC_NZ_I=0;
function ccNewsZoomFromCard(){
  const box=document.querySelector('.cc-lb-newsc');
  const i=box ? [...box.querySelectorAll('.cc-lb-slide')].findIndex(x=>x.classList.contains('on')) : 0;
  ccNewsZoom(Math.max(0, i));
}
function ccNewsZoom(i){
  const list=((CAREER.career && CAREER.career.news)||[]).slice(0, 5);
  if(!list.length) return;
  CC_NZ_I=(i+list.length)%list.length;
  const n=list[CC_NZ_I], T=L();
  let art=null; try{ art=ccNewsArtOf(n); }catch(e){}
  let txt=''; try{ txt=ccText(n); }catch(e){}
  let cat=''; try{ cat=T['ccNewsCat'+ccNewsCat(n)]||''; }catch(e){}
  let who=null; try{ who=ccPostAuthor(n); }catch(e){}
  let day=''; try{ day=n.day ? ccDayFull(n.day) : ccStamp(n); }catch(e){ day=ccStamp(n); }
  let shot=''; try{ shot=n.tbl ? ccShotHTML(n.tbl) : ''; }catch(e){}
  let av=''; try{ av=who ? ccAvatar(who) : ''; }catch(e){}
  const thumbs=list.map((m, k)=>{ let a=null; try{ a=ccNewsArtOf(m); }catch(e){}
    return '<button type="button" class="cc-nz-th'+(k===CC_NZ_I ? ' on' : '')+'" onclick="ccNewsZoom('+k+')"'+(a ? ' style="--card-art:url('+a.src+')"' : '')+' aria-label="'+(k+1)+'"></button>'; }).join('');
  let el=document.getElementById('ccNz');
  if(!el){ el=document.createElement('div'); el.id='ccNz'; el.className='cc-nz'; document.body.appendChild(el);
    el.addEventListener('click', e=>{ if(e.target===el) ccNewsZoomClose(); });
    document.addEventListener('keydown', ccNewsZoomKey); }
  el.innerHTML='<div class="cc-nz-box" role="dialog" aria-modal="true">'+
    '<button type="button" class="cc-nz-x" onclick="ccNewsZoomClose()" aria-label="Close">×</button>'+
    '<div class="cc-nz-art'+(art && art.kind!=='art' ? ' face' : '')+'"'+(art ? ' style="--card-art:url('+art.src+')"' : '')+'>'+
      (list.length>1 ? '<button type="button" class="cc-nz-nav prev" onclick="ccNewsZoom('+(CC_NZ_I-1)+')" aria-label="Prev">‹</button>'+
                       '<button type="button" class="cc-nz-nav next" onclick="ccNewsZoom('+(CC_NZ_I+1)+')" aria-label="Next">›</button>' : '')+
      '<em>'+esc(cat || '')+'</em></div>'+
    '<div class="cc-nz-body"><div class="cc-nz-meta">'+(av ? '<span class="cc-nz-av">'+av+'</span>' : '')+
      '<span><b>'+esc((who && (who.name || who.handle)) || '')+'</b><i>'+esc(day)+'</i></span></div>'+
      '<p class="cc-nz-t">'+esc(txt)+'</p>'+shot+
      (list.length>1 ? '<div class="cc-nz-ths">'+thumbs+'</div>' : '')+
      '<button type="button" class="cc-nz-feed" onclick="ccNewsZoomClose();careerOpenFeed()">'+esc(T.ccNewsHub||'Feed')+' ›</button></div></div>';
  el.style.display='flex';
}
function ccNewsZoomKey(e){
  const el=document.getElementById('ccNz'); if(!el || el.style.display==='none') return;
  if(e.key==='Escape') ccNewsZoomClose();
  else if(e.key==='ArrowRight') ccNewsZoom(CC_NZ_I+1);
  else if(e.key==='ArrowLeft') ccNewsZoom(CC_NZ_I-1);
}
function ccNewsZoomClose(){ const el=document.getElementById('ccNz'); if(el) el.style.display='none'; }
function ccLobbyNewsCardHTML(){
  const list=((CAREER.career && CAREER.career.news)||[]).slice(0, 5);
  if(!list.length) return '';
  const T=L();
  const slides=list.map((n, i)=>{
    let art=null; try{ art=ccNewsArtOf(n); }catch(e){}
    let txt=''; try{ txt=ccText(n); }catch(e){}
    let cat=''; try{ cat=T['ccNewsCat'+ccNewsCat(n)]||''; }catch(e){}
    return '<div class="cc-lb-slide'+(i===0 ? ' on' : '')+'"'+(art ? ' style="--card-art:url('+art.src+')"' : '')+'>'+
      '<em>'+esc(cat)+(cat ? ' · ' : '')+ccStamp(n)+'</em><b>'+esc(txt)+'</b></div>';
  }).join('');
  clearInterval(CC_LB_NEWS_T);
  if(list.length>1) CC_LB_NEWS_T=setInterval(()=>{
    const box=document.querySelector('.cc-lb-newsc');
    if(!box){ clearInterval(CC_LB_NEWS_T); return; }
    const sl=[...box.querySelectorAll('.cc-lb-slide')], dots=[...box.querySelectorAll('.cc-lb-dots s')];
    const k=sl.findIndex(x=>x.classList.contains('on')), nx=(k+1)%sl.length;
    sl.forEach((x, i)=>x.classList.toggle('on', i===nx)); dots.forEach((x, i)=>x.classList.toggle('on', i===nx));
  }, 6000);
  return '<div class="cc-lb-news cc-lb-card cc-lb-newsc" onclick="ccNewsZoomFromCard()" title="'+esc(T.ccNewsHub||'')+'">'+slides+
    '<i class="cc-lb-dots">'+list.map((n, i)=>'<s'+(i===0 ? ' class="on"' : '')+'></s>').join('')+'</i></div>';
}
/* Колонка с капом не листается (его «листается кап всё равно»): если карточке вечера мало места (высадка, отборы,
   эфир), меню само становится выше ровно на нехватку. На телефоне колонки и так идут столбиком. */
/* НАРИСОВАННЫЕ ПОДИУМЫ (Notion «19.10», скрин 25: «видно, где игроки должны стоять, тут даже нарисованы»).
   На трёх фонах (s11, s27, s33) четыре подиума уже есть в картинке, и свои CSS-подиумы стояли мимо них. Для этих фонов
   фигуры ставятся по координатам подиумов в картинке (центр диска и его ширина, в пикселях кадра 1280 по ширине),
   пересчитанным под то, как фон лёг в меню (cover, по центру, низом к низу), а свои подиумы прячутся.
   Порядок мест — как у cc-lb-s0…s3: свой впереди, слева, справа, дальний справа. */
const CC_LB_PADS={
  s11:{h:677, p:[[640,656,255],[476,602,210],[790,597,190],[927,575,180]]},
  s27:{h:720, p:[[640,636,250],[475,580,200],[783,573,195],[927,553,180]]},
  s33:{h:720, p:[[640,636,255],[475,578,200],[785,573,197],[925,553,180]]}
};
function ccLobbyPads(lb){
  const m=/s(\d\d)\.webp/.exec(lb.style.getPropertyValue('--lb-bg')||getComputedStyle(lb).getPropertyValue('--lb-bg')||''); const pad=m && CC_LB_PADS['s'+m[1]];
  const stage=lb.querySelector('.cc-lb-stage'); if(!stage) return;
  const els=[...stage.children];
  lb.classList.toggle('cc-lb-painted', !!pad);
  if(!pad || innerWidth<=700){ els.forEach(e=>{ e.style.left=''; e.style.bottom=''; e.style.height=''; e.style.top=''; }); ccLobbyPlusClip(lb); return; }
  const W=lb.clientWidth, H=lb.clientHeight, k=Math.max(W/1280, H/pad.h), offX=(W-1280*k)/2, offY=H-pad.h*k;
  const sr=stage.getBoundingClientRect(), lr=lb.getBoundingClientRect(), sTop=sr.top-lr.top, sH=sr.height;
  // Низ полосы недель в координатах сцены: на широком окне фон крупнее, фигура по диску растёт и вместе с ником
  // уходила под полосу (скрин 34 «ник не видно», s33). Фигура с ником (+6% сверху и строка ника) не выше полосы.
  const bar=lb.querySelector('.cc-lb-bottom'), barY=bar ? bar.getBoundingClientRect().bottom-sr.top : -1e9;
  pad.p.forEach(([x, y, w], i)=>{
    const cx=offX+x*k, cy=offY+y*k-sTop, dw=w*k;
    stage.querySelectorAll('.cc-lb-s'+i).forEach(e=>{
      e.style.left=cx+'px';
      if(e.classList.contains('cc-lb-fig')){
        const foot=cy+dw*0.07, h=Math.max(120, Math.min(dw*(i===0 ? 1.55 : 1.6), (foot-barY-30)/1.06));
        e.style.height=h+'px'; e.style.bottom=(sH-foot)+'px';
      }
      else if(e.classList.contains('cc-lb-plus')){ e.style.bottom=(sH-cy+dw*0.55)+'px'; }
    });
  });
  ccLobbyPlusClip(lb);
}
// «+» дальнего места на узком ПК заезжал на колонку других регионов справа (22.11): такой прячем.
function ccLobbyPlusClip(lb){
  const right=lb.querySelector('.cc-lb-right'), rr=right && right.getBoundingClientRect();
  lb.querySelectorAll('.cc-lb-stage .cc-lb-plus').forEach(e=>{ e.style.visibility='';
    if(!rr || !rr.width) return; const r=e.getBoundingClientRect();
    if(r.right>rr.left && r.left<rr.right && r.bottom>rr.top && r.top<rr.bottom) e.style.visibility='hidden'; });
}
/* Notion 21.10 («когда кликаешь что-либо и потом возвращаешься вот такое»): фигуры стояли мимо дисков. Диски
   считались по высоте меню ДО того, как меню вытягивалось под колонку, а фон растягивается по новой высоте — диски
   уезжали, фигуры оставались. Теперь сначала высота, потом диски; и колонка, доросшая позже (аватарки, перерисовка),
   пересчитывает всё заново (ResizeObserver, один на меню). */
function ccLobbyFit(){
  const lb=document.querySelector('.cc-lobby.cc-lb-full');
  /* Скрины 8–9 той же страницы: вопрос «Asked after the match» встаёт в правую колонку над карточкой вечера уже после
     подгонки — меню оставалось 920 px, низ колонки («Play live») срезан, фигуры висят над дисками. Следим и за
     размером того, что в колонках, и за новыми узлами в них. */
  if(lb && !lb.__fitRO && typeof ResizeObserver!=='undefined'){
    const again=()=>{ clearTimeout(window.__ccLbFitT); window.__ccLbFitT=setTimeout(ccLobbyFit, 120); };
    lb.__fitRO=new ResizeObserver(again);
    if(typeof MutationObserver!=='undefined'){ lb.__fitMO=new MutationObserver(again);
      lb.querySelectorAll('.cc-lb-left, .cc-lb-right').forEach(c=>lb.__fitMO.observe(c, {childList:true, subtree:true})); }
  }
  if(lb && lb.__fitRO) lb.querySelectorAll('.cc-lb-left, .cc-lb-right').forEach(c=>{ [...c.children].forEach(k=>lb.__fitRO.observe(k)); });
  // Скрытое меню (другой экран сайта) меряется нулями — не трогаем; покажется — сработает наблюдатель.
  if(lb && !lb.getClientRects().length) return;
  try{ ccLobbyFitHeight(lb); }catch(e){}
  if(lb) try{ ccLobbyPads(lb); }catch(e){}
  if(lb && innerWidth>700) try{ ccLobbyPlatesClear(lb); }catch(e){}
}
function ccLobbyFitHeight(lb){
  /* Витрина магазина под составами — только если влезает целиком: обрезанная по краю колонки она читалась
     поломкой, а составы важнее (его слово 19.10: «чтоб все составы вмещались»). */
  if(lb) lb.querySelectorAll('.cc-lb-stack, .cc-lb-famA .cc-lb-left, .cc-lb-famB .cc-lb-left').forEach(col=>{
    const pk=col.querySelector('.cc-peek'); if(!pk) return;
    pk.style.display='';
    if(col.scrollHeight>col.clientHeight+2) pk.style.display='none';
  });
  if(!lb || innerWidth<=700) return;
  lb.style.height='';
  // Колонка с карточкой вечера: в нынешнем меню слева, в меню Глав 1–4 справа.
  const c=lb.querySelector(lb.classList.contains('cc-lb-famC') ? '.cc-lb-left' : '.cc-lb-right');
  /* Растёт под колонку только до высоты окна: дальше колонка листается сама, а меню со скинами целиком на экране. */
  if(c){ c.classList.remove('cc-lb-colscroll'); const extra=c.scrollHeight-c.clientHeight;
    if(extra>0){ const cap=Math.max(640, innerHeight-12), want=lb.offsetHeight+extra+6;
      lb.style.height=Math.min(want, Math.max(cap, lb.offsetHeight))+'px';
      if(want>cap) c.classList.add('cc-lb-colscroll'); } }
}
/* Notion «19.10», скрин 34 («ник не видно»): в невысоком окне ник над передней фигурой уходил под полосу недель
   сверху (она лежит поверх сцены). Подпись, что залезает под полосу, опускается ниже неё, на голову фигуры. */
function ccLobbyPlatesClear(lb){
  const bar=lb.querySelector('.cc-lb-bottom'); if(!bar) return;
  const plates=[...lb.querySelectorAll('.cc-lb-plate')];
  plates.forEach(p=>{ p.style.top=''; });
  const limit=bar.getBoundingClientRect().bottom+6;
  plates.forEach(p=>{
    const over=limit-p.getBoundingClientRect().top;
    if(over>0) p.style.top=(p.offsetTop+over)+'px';
  });
}
window.addEventListener('resize', ()=>{ clearTimeout(window.__ccLbFitT); window.__ccLbFitT=setTimeout(ccLobbyFit, 200); });
function ccLobbySeasonName(day){
  let n=0, ch=null; try{ n=ccSeasonNumOn(day)||0; ch=ccChapterOf(n); }catch(e){}
  if(!ch) return {a:'SEASON', c:'', s:'SEASON'};
  if(ch.c===1) return {a:'SEASON '+(ch.s===10 ? 'X' : ch.s), c:'CHAPTER 1', s:'SEASON '+(ch.s===10 ? 'X' : ch.s)};
  const s=ch.name ? String(ch.name).toUpperCase() : 'SEASON '+ch.s;
  return {a:'CHAPTER '+ch.c+' · '+s, c:'CHAPTER '+(ch.c||''), s:s};
}
function ccLobbyWeek(){
  try{ return L().chWeek+' '+careerWeek()+'/'+ccYearWeeks(); }catch(e){ return ''; }
}
// Задания (цель клуба, месяца, своя) — как «Daily Challenges» / «Quests» той главы.
function ccLobbyQuestsHTML(h){
  const T=L(), q=[];
  try{
    const org=CAREER.org;
    if(org && !org.own && org.goal) q.push([careerOrgGoalText(org.goal), careerOrgGoalMet()]);
    const mg=careerMonthGoal(); if(mg) q.push([careerMonthGoalText(mg), careerMonthGoalMet()]);
    const g=ccLife().goal; if(g && !g.done) q.push([ccAttrFull(g.k)+' → '+g.to, false]);
  }catch(e){}
  return '<div class="cc-lb-panel cc-lb-qs" onclick="careerTab(\'train\')">'+(h ? '<h5>'+esc(h)+'</h5>' : '<h5>'+esc(T.hgTitle)+'</h5>')+
    (q.length ? q.slice(0, 3).map(([t, ok])=>'<div class="cc-lb-q'+(ok ? ' ok' : '')+'"><i>'+(ok ? '✓' : '')+'</i>'+esc(t)+'</div>').join('')
      : '<div class="cc-lb-sub">'+esc(T.hgSet)+'</div>')+'</div>';
}
/* Фон лобби — настоящий фон главного меню того сезона (Fortnite Wiki, «Lobby Background», 1280 px, art/lobby/sNN.webp):
   Season 7 … Глава 7 Сезон 3, по номеру сезона дня (ccSeasonNumOn). Раньше 7-го — 7-й, позже 41-го — 41-й. */
function ccLobbyBg(day){
  let n=0; try{ n=ccSeasonNumOn(day)||0; }catch(e){}
  n=Math.max(7, Math.min(41, n||41));
  return 'art/lobby/s'+String(n).padStart(2, '0')+'.webp';
}
function ccLobbyTopHTML(fam, note){
  // Вкладки — те же, что у хаба (#screen-career-hub .ch-tabs): все, со своими метками; скрытые хабом не показываются.
  const hub=[...document.querySelectorAll('#screen-career-hub .ch-tabs .ch-tab')].filter(b=>b.dataset.tab && !b.hidden && b.style.display!=='none');
  const tabs=hub.length ? hub.map(b=>[b.dataset.tab, b.innerHTML]) : [['centre', esc(L().chTabCentre)]];
  const party='<span class="cc-lb-partyc" onclick="careerTab(\'me\')">👥 '+(1+((careerMates()||[]).filter(Boolean).length))+'</span>';
  const icons=fam==='C' ? '<button class="cc-lb-ico" onclick="careerTab(\'hist\')">▦</button><button class="cc-lb-ico" onclick="careerTab(\'table\')">⌕</button>' : '';
  return '<div class="cc-lb-top">'+(fam!=='C' ? party : '')+'<nav class="cc-lb-nav">'+icons+tabs.map(([k, html])=>
      '<button class="'+(k==='centre' ? 'on' : '')+'" onclick="careerTab(\''+k+'\')">'+html+'</button>').join('')+'</nav>'+(note ? '<div class="cc-lb-note">'+note+'</div>' : '')+
    '<div class="cc-lb-wallet"><span onclick="ccFnShopOpen()"><i class="cc-vb-ic"></i>'+ccNum(CAREER.vb||0)+'</span>'+
    '<span onclick="careerTab(\'shop\')">'+ccMoney(CAREER.career.balance||0)+'</span></div></div>';
}
function careerCentreHTML(card, a){
  const cr=CAREER.career, pl=CAREER.player;
  const next=careerNext();
  // The week the player is in, a day to a cell, Monday on the left.
  //
  // The proportions are the reference's: the day of the month is the big number
  // and everything else is small around it. That is the right way round for a
  // strip whose job is "which day is this happening on" — the old cells put the
  // kind of event in 19px and the date in 9px, which answered the question the
  // panel below already answers and buried the one only this row can.
  //
  // The days come from the same map the calendar draws from, so a cell says
  // whatever that date actually carries and no schedule is written twice.
  const dayEvents=careerEvents();
  const KIND_WORD={cup:L().chWkCup, final:L().calWeeklyFinal, eval:L().calPerfEval,
                   victory:ccWkVictoryWord(),
                   major:ccWkMajorWord(), gc:L().chWkGC, reload:L().chWkReload};
  // The pip under the number, standing in for the reference's icon per fixture.
  // A colour is enough to tell a cup night from a Reload night at a glance, and
  // the word beside it says which for anyone who is not going by colour — the
  // pip is never the only thing carrying it.
  //
  // The colour is a class rather than an inline style so the highlighted cell
  // can take it back: that cell is already the accent, and a teal pip on a teal
  // background is a pip nobody can see.
  // The teal used to mark the week you are standing in. Every cell is now that
  // week, so it marks the next thing you will actually play instead — which is
  // the day the button below leads to.
  const monday=careerMonday(careerToday());
  const firstBusy=[0,1,2,3,4,5,6].find(d=>(dayEvents.get(ccAddDays(monday,d))||[]).length);
  const strip=[0,1,2,3,4,5,6].map(d=>{
    const iso=ccAddDays(monday, d);
    const when=new Date(iso+'T00:00:00Z');
    const on=dayEvents.get(iso)||[];
    /* The day you are standing in, said on the strip itself.

       The ring already on this strip marks the next thing you will play, which
       is a different question — and the only place that said what today IS was
       the small date in the corner. A player wrote it up, 20 August: "почти не
       понятно какой сегодня день... надо всматриваться слева в маленький
       текст". So today's cell carries the word, and the styling below makes it
       the loudest thing on the row. */
    const today=iso===careerToday();
    const head=today ? `<em><span class="ch-dow">${L().calDows[d]} · </span>${L().chToday}</em><b>${when.getUTCDate()}</b>`
                     : `<em>${L().calDows[d]}</em><b>${when.getUTCDate()}</b>`;
    const cls=(today?' ch-today':'');
    // A free day says it once. The line under it is where what you decided to
    // do with the day will go, and until there is something to decide it stays
    // empty rather than repeating the headline in smaller type.
    if(!on.length)
      return `<div class="ch-week ch-day ch-day-free${cls}">${head}`+
             `<span class="ch-day-what">${L().chDayFree}</span></div>`;
    // A day can carry more than one thing — a divisional cup window and a
    // Reload session land on the same evening more than once in a season — so
    // the first is named and the rest are counted rather than dropped.
    const more=on.length>1 ? ` +${on.length-1}` : '';
    /* Строка под словом говорит то, чего в самом слове нет.

       Его снимок, 26 августа: пятница читается «Reload / Reload — кап 2,
       отборы», а суббота — «Финал недели / Финал недели». У финала недели имя
       события и есть его вид, и клетка повторяла себя вслух. Правило тут уже
       было записано выше, для пустого дня: заголовок не переписывается мелким
       шрифтом. Счётчик остальных событий дня при этом остаётся — он несёт своё. */
    // World Cup 2019 (недели Online Open и финал в Нью-Йорке) — не FNCS (его скрин 29.09: «это же не фнкс»).
    const word=(on[0].kind==='major' && /^Major[12]_2019_/.test(String(on[0].id||''))) ? 'World Cup'
             : (KIND_WORD[on[0].kind]||L().chWkCup);
    const sub=String(on[0].label||'')===word ? '' : on[0].label;
    /* День турнира несёт арт своего события (CAREER_EV_ART по виду) фоном
       клетки, а ближайший к игре — лаймовую пилюлю «Next up», как первая
       карточка Compete в лобби. Его «давай» на 3-й пункт, 30 августа. */
    const dayArt=(typeof ccEventArt==='function' ? ccEventArt(on[0]) : '') || '';
    const artAttr=dayArt ? ` style="--day-art:url(${dayArt})"` : '';
    const nextAttr=d===firstBusy ? ` data-next="${esc(L().chNext)}"` : '';
    return `<div class="ch-week ch-day${dayArt?' ch-day-art':''}${d===firstBusy?' now':''}${cls}"${artAttr}${nextAttr}>${head}`+
           `<span class="ch-day-what"><i class="ch-pip ch-pip-${on[0].kind||'cup'}">${ccKindIconSVG(on[0].kind)}</i>`+
           `${word}</span>`+
           `<span class="ch-day-sub">${sub}${more}</span></div>`;
  }).join('');
  // The month the week sits in, the way the reference puts it at the right of
  // the bar. A week that straddles two of them says both rather than picking
  // the one its Monday happens to fall in.
  const wkFrom=new Date(monday+'T00:00:00Z'), wkTo=new Date(ccAddDays(monday,6)+'T00:00:00Z');
  const months=L().calMonths[wkFrom.getUTCMonth()] +
    (wkTo.getUTCMonth()!==wkFrom.getUTCMonth() ? ' — '+L().calMonths[wkTo.getUTCMonth()] : '');
  const stripWhen=`${months} ${ccShowYear(wkTo.getUTCFullYear())} · ${L().chWeek} ${careerWeek()}`;

  // The season above the week: one square a week, the whole thing at a glance.
  //
  // The day row says what this week holds and nothing about where the week
  // sits, so a player could read the hub all season and never see the shape of
  // it — which weeks are cups, where the Majors fall, how much is left. That is
  // the one question a row of days structurally cannot answer.
  //
  // A square takes the colour of what that week is about *for this career*,
  // which is not the same as which event is the biggest in the world. The
  // divisional cup outranks a Reload session here: the cup is what the player
  // enters every week, and Reload is a circuit running past them until they are
  // good enough to be in it.
  //
  // Ranked the other way round the season came out almost entirely orange —
  // Reload's opens, play-ins and heats touch most of the early weeks — and the
  // ladder, the one thing the row exists to show running, disappeared under it.
  //
  // Weeks already played are dimmed rather than removed: how far in you are is
  // the other half of what this row is for.
  const KIND_RANK=CC_KIND_RANK;
  const here=careerWeek();
  const seasonBar=[];
  const dows=L().calDows;
  let peekRuns=null;
  let barSsn=null;
  for(let w=1; w<=ccYearWeeks(); w++){
    // Смена фортнайтовского сезона — подпись перед квадратиком его первой
    // недели. См. CSS у .ch-ssn.
    const ssn=careerFncsSeason(careerWeekStart(w));
    if(ssn && ssn.id!==barSsn){
      barSsn=ssn.id;
      seasonBar.push(`<span class="ch-ssn" title="${esc(ssn.id+' — '+ccDayLabel(ssn.from))}">${esc(ssn.id)}</span>`);
    }
    const kinds=new Set();
    for(let d=0; d<7; d++)
      (dayEvents.get(ccAddDays(careerWeekStart(w), d))||[]).forEach(x=>kinds.add(x.kind));
    const top=KIND_RANK.find(k=>kinds.has(k));
    const state=w<here ? ' done' : (w===here ? ' now' : '');
    /* Все капы недели на её квадратике — его пункт 2 со страницы «ы»,
       22 августа. Подпись говорила только главное («Неделя N — Мейджор»), и
       мейджорская неделя молчала про кубок, который в ней тоже играется.
       Теперь строка на событие: дни и название; сессии одного турнира,
       идущие подряд, складываются в диапазон («Пн–Вт — Кубок»). Наведение
       обводит квадратик, клик открывает превью недели под полосой —
       careerWeekPeek. */
    const runs=[];
    let run=null;
    for(let d=0; d<7; d++){
      (dayEvents.get(ccAddDays(careerWeekStart(w), d))||[]).forEach(x=>{
        // Кубку — имя кубка: его дни подписаны «Session 1/2», и без замены
        // строки не склеиваются и не говорят, что это за турнир.
        const lbl = x.kind==='cup'
          ? L().chEvCup.replace('{N}', String(cr.division)) : x.label;
        if(run && run.label===lbl && run.to===d-1){ run.to=d; return; }
        if(run) runs.push(run);
        run={label:lbl, from:d, to:d, kind:x.kind};
      });
    }
    if(run) runs.push(run);
    if(w===CH_WEEK_PEEK) peekRuns=runs;
    const tip=runs.length
      ? runs.map(r=>(r.from===r.to ? dows[r.from] : dows[r.from]+'–'+dows[r.to])+' — '+r.label).join('\n')
      : L().chDayFree;
    seasonBar.push(`<i class="ch-sq${top?' ch-pip-'+top:' ch-sq-empty'}${state}`+
                   `${w===CH_WEEK_PEEK?' peeked':''}"`+
                   ` onclick="careerWeekPeek(${w})"`+
                   ` title="${esc(L().chWeek+' '+w+'\n'+tip)}">${w}</i>`);   // кнопка недели: номер, цвет вида — полоской сверху
  }
  const weekPeek = (CH_WEEK_PEEK && peekRuns) ? `<div class="ch-week-peek">
    <h5>${esc(L().chWeek)} ${CH_WEEK_PEEK}<button onclick="careerWeekPeek(null)" aria-label="close">&times;</button></h5>
    ${peekRuns.length ? peekRuns.map(r=>`<div class="wp-row">`+
        `<i class="wp-pip${r.kind?' ch-pip-'+r.kind:''}">${ccKindIconSVG(r.kind||'cup')}</i>`+
        `<span class="wp-days">${r.from===r.to ? dows[r.from] : dows[r.from]+'–'+dows[r.to]}</span>`+
        `<span>${esc(r.label)}</span></div>`).join('')
      : `<div class="wp-row">${esc(L().chDayFree)}</div>`}
  </div>` : '';

  // Same covers the calendar uses, from the same table — a cup carries the
  // season's FNCS key art because that is the picture Epic puts on it.
  const art = ccEventArt(next) || CAREER_EV_ART.cup;
  // A cup can be played; a Major cannot yet. The button says which, and a week
  // that cannot be played can still be passed, or the season stops at week five.
  // A Reload day is only yours if you came through the stage before it, so the
  // kind alone does not decide this one.
  const playable = careerCanPlay(next) && !cr.seasonOver;
  // Is the thing the button leads to happening today, or later this week? The
  // reference — Desktopкарьераы.jpg — leads with exactly that, because it is
  // what a player opening the screen asks before anything else.
  const onToday = next.day===careerToday();
  const nextWhen = next.day
    ? L().calDows[(new Date(next.day+'T00:00:00Z').getUTCDay()+6)%7]+' '+
      Number(next.day.slice(8))+' '+L().calMonthsShort[Number(next.day.slice(5,7))-1]
    : '';
  // At the boundary a career that has stopped growing can stop. The button sits
  // beside the one that starts another year rather than instead of it: going on
  // is always allowed, it is just no longer free.
  const retireBtn = (cr.seasonOver && careerMayRetire())
    ? `<button class="ch-play ch-retire" onclick="careerRetire(false)"
         title="${esc(L().ccRetireHint(careerRetireAge()))}">${L().ccRetire}</button>` : '';
  /* Церемония закрытия — кнопкой, а не сама собой (см. ccGalaOpen о том,
     почему). Стоит ПОСЛЕ «Нового сезона» в разметке намеренно: половина
     проверок жмёт первую .ch-play на экране, и вставать перед ней значило бы
     менять им дорогу. */
  const galaBtn = cr.seasonOver
    ? `<button class="ch-play ch-gala" onclick="ccGalaOpen()">${L().ccGalaWatch}</button>` : '';
  const btn = cr.seasonOver
    ? `<button class="ch-play" onclick="if(CAREER.career.seasonOver) careerNewSeason()" title="${esc(L().ccSeasonOverSub)}">${L().ccNewSeason}</button>`+galaBtn+retireBtn+
      `<button class="ch-play ch-skipev" onclick="ccWrapOpen()">${esc(L().wrBtn)}</button>`
    /* Командный вечер, который нельзя начать, не предлагает «Пропустить». По одиночному правилу непроходимый вечер
       (разные режимы) превращал «Играть» в «Пропустить», и следующее нажатие скипало турнир. Сам режим «только
       смотрю» матч показывает (tools/sim-shows-probe.js).
       В команде день двигает только сервер (careerAdvanceTo), пропуск бессмыслен, поэтому кнопка гаснет и называет
       причину. Чинится кнопками режима, плиткой команды или разрывом дуо. */
    /* И в гонке: разные режимы — «Играть» гаснет с причиной, а не превращается в
       «Пропустить». Скриншот: у одного вечер убежал сам. См. ccRaceModeWhy. */
    : (!playable && ccRaceModeWhy())
      ? `<button class="ch-play" disabled title="${esc(ccRaceModeWhy())}">${L().chPlay}${ccMpReadyTag()}</button>`+
        `<div class="ch-hint" style="margin:6px 0 0;color:#ff9b9b;">${esc(ccRaceModeWhy())}</div>`
    : (ccMpOn() && !playable)
      ? `<button class="ch-play" disabled title="${esc(ccMpBlockWhy()||L().chSoonHint)}">${
            L().chPlay}${ccMpReadyTag()}</button>`+
         (ccMpBlockWhy()
           ? `<div class="ch-hint" style="margin:6px 0 0;color:#ff9b9b;">${
                esc(ccMpBlockWhy())}</div>` : '')
    /* Тот же вечер, но в эфир — вторая кнопка рядом с «Играть», и только в
       день турнира. Гаснет со своей причиной: командная карьера, закрытый
       день, нет энергии. См. careerPlayLive. */
    : playable
      ? `<button class="ch-play" onclick="careerPlay()">${L().chPlay}${ccMpReadyTag()}</button>`+
        /* Вторые кнопки (в эфир, не играть) - одной строкой под «Играть», мельче (22.11: колонка была из пяти кнопок подряд). */
        '<div class="ch-play-row">'+
        (onToday && !ccMpOn() ? (()=>{ const why=ccStreamCupWhy();
           return `<button class="ch-play ch-live-go"${why?' disabled':''} onclick="careerPlayLive()"
             title="${esc(why||L().ccStreamCupHint(CC_STREAM_CUP.energy, CC_STREAM_POW))}">${
             L().ccStreamCupGo}</button>`+
             /* Цена эфира — строкой под кнопкой, а не только во всплывающей
                подсказке: отзыв «и это должно быть написано». */
             ''; })() : '')+
        /* Стиль игры у «Играть» снят (его скрин в Notion 8.10: «убрать стиль игры перед капом, он же есть в самом капе»):
           внутри вечера он спрашивается перед каждой игрой на любом турнире (ccStyleAskGame), второй переключатель дублировал. */
        /* «Не играть» — в день турнира (Notion 12.10: «добавите возможность не участвовать в этом турнире? Играть во
           всех — это так утомительно»). Раньше играемый вечер давал только «Играть»: пропустить его было нечем. В
           команде и в гонке день двигают вместе — там кнопки нет. */
        (onToday && !ccMpOn() && !(typeof ccRaceLock==='function' && ccRaceLock())
          ? `<button class="ch-play ch-skipev" onclick="careerSkipEventAsk()">${L().chSkipEv}</button>` : '')+
        '</div>'+
        (onToday && !ccMpOn() ? `<div class="ch-hint ch-live-hint">${esc(ccStreamCupWhy()||L().ccStreamCupHint(CC_STREAM_CUP.energy, CC_STREAM_POW))}</div>` : '')+
        /* Наём на турнир (ccHireOpen): нанятый — строкой с отменой, иначе кнопка. */
        /* Соло-вечер (Solo Series, FNCS Solos, соло-кап) напарника не берёт — и нанимать некого (его Notion 29.10 «на соло можно нанять»). */
        (onToday && typeof ccHireAllowed==='function' && ccHireAllowed() && careerNeedsMate(next.type)
          ? (ccHireActive()
              ? `<div class="ch-hint ch-hire-on">${esc(L().ccHireOn(ccHireList().map(x=>x.handle).join(' & '), ccMoney(ccHireList().reduce((s,x)=>s+(x.fee||0), 0))))} <button class="ch-sign" onclick="careerHireCancel()">${L().ccHireCancel}</button>${ccHireList().length<careerMateSeats() ? ` <button class="cc-back" onclick="ccHireOpen()">${L().ccHireBtn}</button>` : ''}</div>`
              : `<button class="ch-play ch-skipev" onclick="ccHireOpen()">${L().ccHireBtn}</button>`)
          : '')
      : `<button class="ch-play" onclick="careerSkipAsk()" title="${esc(
            ccRaceModeWhy() ? ccRaceModeWhy()
          /* Арена, ранг, травма, бан (ccLifeWhy) закрывают вечер в careerCanPlayKindOn, а сюда
             не доходили: кэшкап 2019–2022 без Champion League печатал «Majors are not wired
             into a career yet» (скрин: «cant play any cashcups in chapter 1/2»). */
          : ccLifeWhy(careerToday(), next.type) ? L()[ccLifeWhy(careerToday(), next.type)]
          : careerNoMate(next.type) ? (careerMatesOver()>0 ? L().ccMateOver : L().ccNoMateN(careerMatesShort()))
          : next.type==='victory'? (ccConsoleOk(careerVictoryOn(careerToday())) ? L().ccVicNoInvite : ccConsoleWhy(careerVictoryOn(careerToday())))
          : next.type==='reload' ? L().ccRelLocked
          : next.type==='final'  ? L().ccWfLocked
          : next.type==='major'  ? ccMajWhyLocked()
          : next.type==='summit' ? L().ccSumLocked
          : next.type==='globals'? L().ccGlobLocked(ccLanCity('globals'))
          : next.type==='gc'     ? (careerGclcOn(careerToday()) ? L().ccGcLocked : L().ccRcLocked)
          : next.type==='solo'   ? ccSoloWhyLocked()
          : next.type==='proam'  ? ccProAmWhyLocked()
          : next.type==='nations'? ccNatWhyLocked()
                                 : L().chSoonHint)}">${L().chSkip}</button>`+
        // И сразу до турнира, одной кнопкой — см. careerSkipToBtnHTML.
        careerSkipToBtnHTML();
  const mate = careerPartnerCard();
  const evalRow = cr.division===1
    ? `<div class="ch-row"><em>${L().chPerfEval}</em><b>$400</b></div>`
    : `<div class="ch-row"><em>${L().chPerfEval}</em><b>${L().chD1Only}</b></div>`;

  /* Всё, что было на «Центре», — в самом главном меню (Notion «19.10»: «вот эта информация должна быть расположена на
     экране»): карточка вечера с кнопками — на месте блока режима, ростер и новости — справа, полоса сезона — над
     расписанием недели. Листа «Подробнее» больше нет. */
  const lbBar=`<div class="ch-next cc-lb-next">
    <div class="ch-next-head"><h3>${L().chNext}</h3><span>${
      // Which year this is, beside when it is. A season that alternates has to
      // say which one it is on the screen a player opens first, or the extra
      // chair in the squad tile is the only clue that anything changed.
      ccSeasonWord(careerSquadSize())} · ${stripWhen}</span>${
      /* Перемотка - в строке заголовка, своим местом (Notion 20.11: стояла абсолютом по центру поверх подписи сезона). */
      careerFfButtonsHTML()}${
      // The Paris seat, which the ladder tile used to carry: a thing won in
      // February that is not played until August belongs beside the calendar
      // rather than in a list of standings.
      // Места этого сезона: в прошлом году выигранное на этот Championship не
      // везёт — см. ccRelMySeats.
      ccRelMySeats(cr).length ? `<em class="ch-next-seat">${esc(L().ccEwcSeat)} · ${
        esc(L().ccEwcSeatOn(ccDayLabel(CC_RC_DAY), ccRelMySeats(cr).length))}</em>` : ''}</div>
    ${/* Полосы из 35 недель в лобби нет (27.10, «лобби как в Fortnite»): неделя — плитками дней ниже, год — во вкладке
         «Календарь». */ ''}
    ${weekPeek}
  </div>`;
  let awayIn=false;   // выезд уже нарисован внутри карточки вечера
  const lbPlay=`<div class="ch-col-play cc-lb-playcol">
      ${typeof ccRosterSoonHTML==='function' ? ccRosterSoonHTML() : ''}
      ${typeof ccMapPickHTML==='function' ? ccMapPickHTML() : ''}
      ${careerMpTileHTML()}
      ${careerRaceTileHTML()}
      ${ccAwayLateHTML()}
      ${/* Закрытый старший вечер (не прошёл в Weekly Final) — кап того же дня кнопкой здесь, иначе день уходит перемоткой. */
        !cr.seasonOver && !playable && next.day===careerToday() ? ccVictoryAltsHTML() : ''}
      ${/* Командный вечер, заблокированный командной причиной, остаётся карточкой матча, а не панелью дня.
           Иначе пропадали кнопки режима, которыми и чинится расхождение режимов, а показывалась
           чужая причина из цепочки про мейджоры и релоад.
           Командные запреты (связь, дивизион, одинаковые игроки, разные режимы) глушат кнопку на карточке
           с причиной. Свободный день, незаквалившийся релоад, невыстроенный мейджор как раньше. */
        /* И в гонке то же самое: «Нажал just watching и меня просто перебросило на некст скрин»
           (скриншот) — разные режимы в комнате гонки держат карточку матча, а не день. */
        (!cr.seasonOver && (next.type==='free' || (!playable && !ccMpBlockWhy() && !ccRaceModeWhy())))
        /* Свободный день — панель дня с прокачкой прямо в главном меню (его «в каждом сезоне во время фри дня должна
           быть прокачка в главном меню»); меню само вытягивается под неё (ccLobbyFit). */
        /* День церемонии (вид 'gala') — не закрытый вечер, а свободный день; кнопка церемонии — под панелью (первая
           .ch-play на экране остаётся «К турниру»). Раньше он шёл замком с заглушкой «Majors are not wired…» (Notion «19.10», скрин 20). */
        ? careerDayPanelHTML((next.type==='free' || next.type==='gala') ? null : {label:next.label||next.title, why:
            ccRaceModeWhy() ? ccRaceModeWhy()
          : (next.type==='victory' || next.type==='eval' || next.type==='cup') && ccAwayHomeBusy(careerToday()) ? L().awBusy
          /* Арена, ранг, травма, бан (ccLifeWhy) закрывают вечер в careerCanPlayKindOn, а сюда
             не доходили: кэшкап 2019–2022 без Champion League печатал «Majors are not wired
             into a career yet» (скрин: «cant play any cashcups in chapter 1/2»). */
          : ccLifeWhy(careerToday(), next.type) ? L()[ccLifeWhy(careerToday(), next.type)]
          : careerNoMate(next.type) ? (careerMatesOver()>0 ? L().ccMateOver : L().ccNoMateN(careerMatesShort()))
          : next.type==='victory'? (ccConsoleOk(careerVictoryOn(careerToday())) ? L().ccVicNoInvite : ccConsoleWhy(careerVictoryOn(careerToday())))
          : next.type==='reload' ? L().ccRelLocked
          : next.type==='final'  ? L().ccWfLocked
          : next.type==='major'  ? ccMajWhyLocked()
          // The Summit and the Globals were in the Skip button's chain above and
          // not in this one, so the panel fell through to a placeholder from
          // before the Majors were built and told a player standing on Summit
          // day that Majors are not wired into a career yet. His report,
          // 17 August. The two chains say the same thing now.
          : next.type==='summit' ? L().ccSumLocked
          : next.type==='globals'? L().ccGlobLocked(ccLanCity('globals'))
          : next.type==='gc'     ? (careerGclcOn(careerToday()) ? L().ccGcLocked : L().ccRcLocked)
          : next.type==='solo'   ? ccSoloWhyLocked()
          : next.type==='proam'  ? ccProAmWhyLocked()
          : next.type==='nations'? ccNatWhyLocked()
                                 : L().chSoonHint})+(next.type==='gala' ? '<button class="ch-play ch-gala" onclick="ccGalaOpen()">'+L().ccGalaWatch+'</button>' : '')
        : `<div class="ch-art" style="background-image:url(${art});">
          <div class="ch-livebar">
            ${onToday ? `<b>${L().chLiveTag}</b><span>${L().chLiveNow}</span>`
                      : `<b class="ch-live-soon">${L().chLiveSoonTag}</b><span>${nextWhen}</span>`}
          </div>
          <div class="ch-art-in">
            ${playable ? `<div class="ch-matchof">${L().chMatchOf(ccNextShape(next).games)}</div>` : ''}
            <h3>${cr.seasonOver ? L().ccSeasonOver : next.title}</h3>
            ${!cr.seasonOver && (next.type==='victory' || next.day===careerToday()) ? ccVictoryAltsHTML()+ccMobPrepHTML(next) : ''}
            ${cr.seasonOver ? `<p>${L().ccSeasonOverSub}</p>`
              : playable
              ? (()=>{ const sh=ccNextShape(next);
                  // A final that cuts to nobody has nothing to advance to: it is
                  // the last room, and what it says is how many are in it.
                  return sh.cut
                    ? `<div class="ch-big"><b>${sh.cut}</b><span>${L().ccAdvanceOf(sh.of)}</span></div>`
                    : `<div class="ch-big"><b>${sh.of}</b><span>${ccSquadWordCap()}</span></div>`; })()
              : `<p>${next.sub}</p>`}
            <div class="ch-mode"><span>${[careerNightSolo(next) ? L().ccSpotSoloTab : ccSquadWordCap(),
                (ccNoDivisions() || next.type==='nations') ? '' : L().ccDivision+' '+cr.division].filter(Boolean).join(' · ')}</span></div>
            ${/* Выезд — сразу под плашкой «формат · дивизион», полосой вбок: виден без прокрутки (Notion 20.11, его «не хочу скролить вниз»). */
              (()=>{ awayIn=true; return cr.seasonOver ? '' : ccAwayHTML(true); })()}
            <!-- Про-Ам играется НЕ с напарником, а с контент-мейкером, и это
                 надо знать до нажатия: с кем сидишь и сколько его смотрят.
                 См. ccProAmMate и CC_PROAM_TWITCH. -->
            ${next.type==='proam' && typeof ccProAmMate==='function' ? (()=>{
                const c=ccProAmMate();
                return `<div class="ch-mode ch-mode-proam"><span>${
                  esc(L().ccProAmMateLine(c.handle, ccNum(c.followers||0)))}</span></div>`; })() : ''}
            <!-- И как он проходит — отзыв: «pro am ещё распиши
                 как работает». Все числа читаются из констант турнира. -->
            ${next.type==='proam' && typeof ccProAmHowHTML==='function' ? ccProAmHowHTML() : ''}
            <!-- Куда уже квалифицировались. Строка появляется, только когда
                 место действительно держится, — см. careerQualHTML. -->
            ${careerQualHTML()}
            ${playable ? careerNightSpotHTML(next) : ''}
            ${/* В команде строка режима нужна ИМЕННО когда играть нельзя:
                 расхождение режимов чинится ею же. Спрятать её вместе с
                 кнопкой значило бы запереть игрока без выхода. */
              (playable || ccMpOn() || ccRaceModeWhy()) ? careerSimRowHTML() : ''}
            ${btn}
            ${/* День турнира до вечера: занятия и разминка во вкладке «Тренировка» (ccPreEvent). */
              playable && ccPreEvent() ? '<button type="button" class="cc-pretrain" onclick="careerTab(\'train\')">'+esc(L().ccPreBtn)+'</button>' : ''}
          </div>
        </div>`}
      ${/* Интервью — ПОД днём, не над ним (Notion 27.10, игрок: «на тренировке спрашивает, тащил ли я команду, и мышку
           уносит вниз, и запускаются скримы»). Плитка над панелью дня появлялась после вечера и пропадала по ответу, и
           занятия прыгали на её высоту: следующий клик садился в занятие под курсором. Снизу она ничего не двигает. */
        cr.seasonOver ? '' : careerInterviewHTML()}
      ${/* Без карточки вечера (панель дня) выезд остаётся отдельным блоком под ней. */ awayIn || cr.seasonOver ? '' : ccAwayHTML()}
      ${(typeof ccNatSquadHTML==='function') ? ccNatSquadHTML() : ''}
      <!-- At the boundary the shop is shut and the year is the thing worth
           reading: where this career finished at its Grand Finals and its LANs.
           His report, 20 August. See careerSeasonBoardHTML. -->
      ${cr.seasonOver ? careerSeasonAwardHTML()+careerSeasonCatsHTML()+careerSeasonBoardHTML() : ''}
  </div>`;
  const lbSide=`
      <!-- The ladder tile stood here and is gone, his call, 18 August: division,
           rating, awards, the evaluation and the prize money all say themselves
           somewhere else now — the strip at the top, the bio, the money screen.
           What only it carried has moved rather than been deleted: form,
           reputation and burnout to the strip beside the energy, because they
           are today's condition; the promotion cut into the day panel; the
           Paris seat into the week bar. Deleting them outright would have put
           back exactly the thing this file spent a night removing — a number
           that moves for a reason nothing on screen names. -->
      <!-- The two deals a career is on, side by side: the man who does the
           talking on the left, the club he talked to on the right. His layout,
           17 August. Below them the two people a career plays with. -->
      <!-- The tournament first, the contracts under it: what a career does this
           week outranks what it signed last month. See careerNextCardHTML. -->
      <!-- The profile leads the centre and the tournament card sits with the
           career, his call, 18 August: the two swapped places. -->
      <!-- Как на проде: профиль, под ним новости. Цели и развитие — во вкладке «Тренировка». -->
      ${/* Выезды на широком экране - справа, над составами (Notion «20.11», его «нет кнопок, надо скроллить, игрок может
           не понять»): слева они сдвигали карточку вечера, и «Играть» уходила за край. На узком экране этот блок скрыт,
           а выезд стоит в карточке вечера, как он просил раньше («не хочу скролить вниз»). */
        '<div class="cc-aw-sidebox">'+ccAwayLateHTML()+(cr.seasonOver ? '' : ccAwayHTML())+'</div>'}
      ${(typeof ccPressHTML==='function') ? ccPressHTML() : ''}
      ${/* Справа — только составы (27.10, «лобби как в Fortnite»): витрина магазина снята, магазин — своей вкладкой;
           сборная — за три недели до своего этапа (ccRostersStripHTML(true)). Пресс-конференция остаётся: это вопрос. */
        careerProfileTileHTML(true)}`;
  return ccLobbyHTML(card, btn, next, nextWhen, strip, {bar:lbBar, play:lbPlay, side:lbSide, note:ccMediaQuickHTML()});
}

/* The coach is the player's own, not the duo's — he works with you, and your
   partner has one of his own somewhere. So he stands in his own tile beside the
   duo rather than inside it. All three are on screen at once rather than behind
   a picker, because the choice is the point: what this career is trying to
   become. The hired one is marked, the rest carry their fee, and one that
   cannot be afforded says so by being unpressable rather than by hiding. */
function careerCoachColHTML(){
  const cr=CAREER.career, working=ccCoach();
  const paid=ccOrgPaysCoach();
  /* A shelf rather than three buttons, his call of 18 August: the same rows the
     shop is built from, because hiring a coach is the same gesture as buying a
     desk — a face, what he is for, what he costs, and one press.

     All of them rather than a shortlist of three. The three-up strip was a
     picker when there were three archetypes; with twelve named people the point
     is that you choose, and a choice you cannot see is not one. The one you have
     hired reads as owned, the same way a rig on the desk does. */
  /* The tile is the man you hired, and the twelve live behind a press.

     His call, 18 August: a window to choose in, and afterwards one face — the
     one you picked. Twelve rows standing open is a catalogue, and a catalogue is
     the right shape for the moment you are choosing and the wrong one for the
     rest of the season, when the only thing you want to know is who is working
     with you and until when. */
  if(working){
    const what=working.keys.length>=ATTR_KEYS.length ? L().ccCoachAll
             : working.keys.map(k=>L()[ATTR_LABEL[k]]).join(' · ');
    return `<div class="ch-tile ch-tile-coach">
      <h4>${L().ccCoachTitle}</h4>
      <div class="ch-orghead">${working.photo
        ? `<img class="ch-coach-av" src="${PHOTO_DIR}${esc(working.photo)}" alt="" onerror="this.remove()">` : ''}
        <b>${esc(working.name)}</b>${working.at?`<em class="ch-agent-at">@${esc(working.at)}</em>`:''}</div>
      <div class="ch-row"><em>${L().ccCoachFor}</em><b>${what}</b></div>
      <div class="ch-row"><em>${L().ccShopTrain}</em><b class="ch-goal-met">+${
        Math.round(working.train*100)}%</b></div>
      <div class="ch-row"><em>${L().ccWage}</em><b>$${
        ccNum(working.cost)}${L().ccPerSeason}</b></div>
      ${working.chem ? `<div class="ch-row"><em>${L().ccChem}</em><b class="ch-goal-met">+${
        working.chem}</b></div>` : ''}
      <div class="ch-row"><em>${L().ccCoachUntil}</em><b>${ccDayLabel(CAREER.coach.until)}</b></div>
      <button class="ch-swap" onclick="ccCoachPickOpen()">${L().ccCoachChange}</button>
    </div>`;
  }
  return `<div class="ch-tile ch-tile-coach">
    <h4>${L().ccCoachTitle}</h4>
    <div class="ch-hint">${L().ccCoachHint}</div>
    <div class="ch-empty">${L().ccCoachNone}</div>
    <button class="ch-swap" onclick="ccCoachPickOpen()">${L().ccCoachPick}</button>
  </div>`;
}
/* The window itself: every coach, and one press hires. Built on the same modal
   the card peek uses, so it closes on the backdrop and on Escape like the rest
   of them. */
function ccCoachPickOpen(){
  const cr=CAREER.career, working=ccCoach(), paid=ccOrgPaysCoach();
  // His order too, 20 August — the same list the other three windows read, so
  // the coaches stop being the one window whose order is the file's. The
  // grouping the table keeps, heads before specialists, is still the table's.
  const rows=ccByHand(CC_COACHES).map(c=>{
    const on=!!working && working.id===c.id;
    const can=!on && (paid || (cr.balance||0)>=c.cost);
    const what=c.keys.length>=ATTR_KEYS.length ? L().ccCoachAll
             : c.keys.map(k=>L()[ATTR_LABEL[k]]).join(' · ');
    return `<div class="cc-buy${on?' own':''}">
      ${c.photo ? `<img class="cc-buy-img cc-buy-face" src="${PHOTO_DIR}${esc(c.photo)}" alt="" loading="lazy" onerror="this.remove()">` : ''}
      <!-- The shop's own three lines: the name, a grey line saying what the
           thing is, and a green line saying what it does to a career, in the
           words the shop already uses for it. A coach is a purchase like the
           desk is, so it reads like one. -->
      <div class="cc-buy-in"><b><span class="cc-buy-nm">${esc(c.name)}</span> ${ccStaffBadge(c.rating||ccCoachRatingOf(c)).replace('cc-staff-rt', 'cc-staff-rt mgf-rt')}</b>
        <i class="cc-buy-who">${CC_COACH_X[c.at] ? '👥 '+ccFollowers(CC_COACH_X[c.at])+' · ' : ''}${c.at?'@'+esc(c.at):''}</i>
        <span class="cc-buy-chips"><em class="up">${L().ccShopTrain} +${Math.round(c.train*100)}%</em>${
          c.chem ? '<em class="up">'+L().ccCoachChem(c.chem)+'</em>' : ''}<em>${what}</em></span></div>
      ${on ? `<span class="cc-owned">${L().ccShopUntil(ccDayLabel(CAREER.coach.until))}</span>`
           : ccHireBtns(can, paid ? 0 : c.cost, "ccCoachPickTake('"+c.id+"')", "ccCoachPickTake('"+c.id+"',12)", paid ? L().ccOrgPays(esc(CAREER.org.name)) : null)}
    </div>`;
  }).join('');
  document.getElementById('coachPickBody').innerHTML=
    `<h4 class="cc-pick-h">${L().ccCoachTitle}</h4>
     <div class="ch-hint">${L().ccCoachHint} · ${L().ccShopMonth}</div>
     <div class="cc-buys">${rows}</div>`;
  document.getElementById('coachPickModal').style.display='flex';
  document.addEventListener('keydown', ccCoachPickKey);
}
function ccCoachPickClose(){
  const m=document.getElementById('coachPickModal');
  if(m) m.style.display='none';
  document.removeEventListener('keydown', ccCoachPickKey);
}
// Escape closes it, the way every other window here does.
function ccCoachPickKey(e){ if(e.key==='Escape') ccCoachPickClose(); }
// Hire from inside the window: the deal is done, the window is finished with.
function ccCoachPickTake(id, months){
  if(careerHireCoach(id, months)) ccCoachPickClose();
  else ccCoachPickOpen();
}

/* The sponsor tile: what the audience is worth, and what it would take to be
   worth more. It says the next tier's number when there is nothing on the
   table, because a follower count with no scale beside it is not information —
   the whole point of a stream day is knowing what it is buying. */
function careerMktTileHTML(){
  const on=ccMkt(), have=ccSponsor(), offer=ccSponsorOffer();
  const reach=careerReach();
  const next=CC_SPONSORS.find(s=>reach<s.need);
  const head=on
    ? `<div class="ch-orghead">${on.photo
        ? `<img class="ch-coach-av" src="${PHOTO_DIR}${esc(on.photo)}" alt="" onerror="this.remove()">` : ''}
        <b>${esc(on.name)}</b>${on.at?`<em class="ch-agent-at">@${esc(on.at)}</em>`:''}</div>
       <div class="ch-row"><em>${L().ccMktRate}</em><b class="ch-goal-met">+${
         Math.round(((on.rate||1)-1)*100)}%</b></div>
       <div class="ch-row"><em>${L().ccCoachUntil}</em><b>${ccDayLabel(on.until)}</b></div>`
    : `<div class="ch-hint">${L().ccMktHint}</div>
       <div class="ch-empty">${L().ccMktNone}</div>`;
  return `<div class="ch-tile">
    <h4>${L().ccMkt}</h4>
    <div class="ch-row"><em>${L().xFollowers}</em><b>${ccFollowers(reach)}</b></div>
    ${head}
    ${have ? `<div class="ch-row"><em>${L().ccSponsorDeal}</em><b>${ccBrandLogo(have.id)}${L()['ccSponsor'+have.id]}</b></div>`+
             `<div class="ch-row"><em>${L().ccWage}</em><b>$${
               ccNum(have.pay)}${L().ccPerStream}</b></div>`+
             `<div class="ch-row"><em>${L().ccPaid}</em><b>$${
               ccNum((CAREER.sponsor.paid||0))}</b></div>`
          : on ? `<div class="ch-empty">${L().ccSponsorNone}</div>` : ''}
    ${offer ? `<div class="ch-offer">
        <div class="ch-offer-terms"><span>${ccMoney(offer.pay)}${L().ccPerStream}</span>
          <span>${ccBrandLogo(offer.id)}${L()['ccSponsor'+offer.id]}</span></div>
        <button class="ch-sign" onclick="careerSignSponsor(\'${offer.id}\')">${L().ccSign}</button>
      </div>`
      : on && next ? `<div class="ch-hint" style="margin:6px 0 0;">${
          L().ccSponsorNext(ccFollowers(next.need), ccBrandLogo(next.id, 13)+L()['ccSponsor'+next.id])}</div>` : ''}
    <button class="ch-swap" onclick="${on ? 'careerEndMkt()' : 'ccMktPickOpen()'}">${
      on ? L().ccAgentEnd : L().ccMktSee}</button>
  </div>`;
}
/* СПОНСОРЫ В КАРЬЕРЕ — НАСТОЯЩИЕ, С ЛОГОТИПАМИ (его слово 8.10: «и тогда в карьеру игрока добавь настоящих спонсоров»).
   После «Штаба» текущий спонсор и предложения пропали с экрана — они жили в старой плитке маркетинга. Теперь отдельный
   блок на «Клубе»: текущий спонсор (логотип, за эфир, выплачено) и вся линейка брендов: с какого числа подписчиков
   открывается, сколько платил бы сейчас, подписан / подписать / закрыт. Предложение по-прежнему приносит маркетолог. */
function careerSponsorsHTML(){
  const T=L(), all=ccSponsorsAll(), offer=ccSponsorOffer(), reach=careerReach(), mkt=ccMkt(), slots=ccSpSlots(), next=ccSpNextSlotAt();
  const logo=id=>'<span class="cc-spb-logo"><img src="'+PHOTO_DIR+'sp_'+(CC_SPONSOR_LOGO[id]||'x')+'.png" alt="" loading="lazy" onerror="this.remove()"></span>';
  const free=all.length<slots;
  const cur=all.map(x=>'<div class="cc-spb-cur">'+logo(x.id)+'<span class="cc-spb-in"><b>'+esc(T['ccSponsor'+x.id]||x.id)+'</b><small>'+ccMoney(x.pay)+T.ccPerStream+' · '+esc(T.ccPaid)+' '+ccMoney(x.paid||0)+'</small></span>'+
      (ccSpPostWait(x) ? '<small class="cc-spb-note">'+esc(T.ccSpPostWaitT(ccSpPostWait(x)))+'</small>' : '<button class="ch-sign cc-sp-post" onclick="careerSponsorPost(\''+x.id+'\')">'+esc(T.ccSpPostBtn(ccMoney(ccSpPostPay(x))))+'</button>')+
      '<button class="cc-staff-end" onclick="careerDropSponsor(\''+x.id+'\')">'+esc(T.ccSpbDrop)+'</button></div>').join('')+
    (free ? '<div class="cc-spb-free">＋ '+esc(T.ccSpbFree(slots-all.length))+'</div>' : '')+
    (next ? '<div class="cc-spb-free lock">🔒 '+esc(T.ccSpbNextSlot(ccFollowers(next)))+'</div>' : '');
  const left=CC_SPONSORS.filter(b=>!all.some(x=>x.id===b.id));
  const rows=left.filter(b=>reach>=b.need).reverse().concat(left.filter(b=>reach<b.need)).map(b=>{
    const open=reach>=b.need, pay=open ? ccSponsorPayNow(b) : Math.round(ccSponsorRate(b, b.need)*(mkt ? (mkt.rate||1) : CC_SP_NOMKT));
    const canSign=open && (free || (offer && offer.id===b.id && offer.replaces));
    return '<div class="cc-spb-row'+(open ? '' : ' lock')+'">'+logo(b.id)+'<span class="cc-spb-in"><b>'+esc(T['ccSponsor'+b.id]||b.id)+'</b><small>'+
      esc(T.ccSpbFrom(ccFollowers(b.need)))+' · ≈'+ccMoney(pay)+T.ccPerStream+'</small></span>'+
      (canSign ? '<button class="ch-sign" onclick="careerSignSponsor(\''+b.id+'\')">'+esc(free ? T.ccSign : T.ccSpbSwap)+'</button>'
        : open ? '<small class="cc-spb-note">'+esc(T.ccSpbFull)+'</small>'
        : '<small class="cc-spb-note lock">🔒</small>')+'</div>';
  }).join('');
  return '<section class="cc-staff-wrap cc-sp-modal" id="ccSpBlock"><h3 class="cc-sect-h">'+esc(T.ccSpbTitle||T.ccSponsorTitle)+' · '+all.length+'/'+slots+' · '+ccFollowers(reach)+'</h3>'+
    '<div class="ch-tile cc-spb"><div class="cc-spb-mine">'+cur+'</div>'+
    '<div class="cc-spb-hint">'+esc(mkt ? T.ccSpbMktOn(String((mkt.rate||1).toFixed(2))) : T.ccSpbMktOff)+'</div>'+
    '<div class="cc-spb-list">'+rows+'</div></div></section>';
}
function careerSponsorTileHTML(){
  const have=ccSponsor(), offer=ccSponsorOffer();
  const reach=careerReach();
  const next=CC_SPONSORS.find(s=>reach<s.need);
  return `<div class="ch-tile">
    <h4>${L().ccSponsorTitle}</h4>
    <div class="ch-hint">${L().ccSponsorHint}</div>
    <div class="ch-row"><em>${L().xFollowers}</em><b>${ccFollowers(reach)}</b></div>
    ${have ? `<div class="ch-row"><em>${L().ccSponsorDeal}</em><b>${ccBrandLogo(have.id)}${L()['ccSponsor'+have.id]}</b></div>`+
             `<div class="ch-row"><em>${L().ccWage}</em><b>${ccMoney(have.pay)}${L().ccPerStream}</b></div>`+
             `<div class="ch-row"><em>${L().ccPaid}</em><b>${ccMoney(CAREER.sponsor.paid||0)}</b></div>`
          : `<div class="ch-empty">${L().ccSponsorNone}</div>`}
    ${offer ? `<div class="ch-offer">
        <div class="ch-offer-terms"><span>${ccMoney(offer.pay)}${L().ccPerStream}</span>
          <span>${ccBrandLogo(offer.id)}${L()['ccSponsor'+offer.id]}</span></div>
        <button class="ch-sign" onclick="careerSignSponsor(\'${offer.id}\')">${L().ccSign}</button>
      </div>`
      : next ? `<div class="ch-hint" style="margin:6px 0 0;">${L().ccSponsorNext(ccFollowers(next.need), L()['ccSponsor'+next.id])}</div>` : ''}
  </div>`;
}

/* The club tile has three states and they are the three states of a career:
   nobody wants you yet, somebody does, or somebody already has you. The offer
   state is the only place in this mode with a decision on it, so it gets the
   crest, the wage and what they want for it, all on one row you can say yes to. */
/* Leaving a contract on your own. Costs half of what the club would still pay you this year:
   enough to be a decision, affordable once prize money comes in. Can't pay, can't leave.
   Scene reputation drops by 2, same as a partner walking out on you. */
const CC_BUYOUT_SHARE=0.5;
function careerBuyoutCost(){
  const org=CAREER.org;
  if(!org || !org.salary) return 0;
  const pays=careerWagePaydays();
  const left=pays.filter(d=>d>careerToday()).length;
  const each=Math.round(org.salary/Math.max(1, pays.length));
  // Контракт на два сезона (29.10, его «контракты: срок, отступные»): целые сезоны после этого — тоже в отступных.
  const more=ccOrgSeasonsLeft(org)*org.salary;
  return Math.max(50, Math.round((each*left+more)*CC_BUYOUT_SHARE/50)*50);
}
/* СРОК КОНТРАКТА (29.10, его «8 надо»: срок, отступные, выкуп другим клубом). org.to — последний сезон контракта
   (номер cr.season); старые контракты без срока — годовые, как и жили. Сколько ЦЕЛЫХ сезонов осталось после текущего. */
function ccOrgSeasonsLeft(org){
  const cr=CAREER && CAREER.career;
  if(!org || org.own || !cr || org.to==null) return 0;
  return Math.max(0, org.to-(cr.season||1));
}
// Срок в оффере: академия — год; основной состав — иногда два, у топ-клубов чаще (держат вложенное).
function ccOrgTermRoll(tier, academy, rnd){
  if(academy) return 1;
  return rnd() < (tier>=88 ? 0.5 : 0.3) ? 2 : 1;
}
// Контракт идёт и после этого сезона: уйти можно только выкупом, и выкупить могут клубы заметно выше нынешнего.
const CC_ORG_POACH_STEP=3;
// Слухи о трансфере: не чаще раза в три недели и не в каждое окно (careerOrgOffers).
const CC_RUMOR_GAP=21, CC_RUMOR_ODDS=0.35;
function careerLeaveOrg(){
  const cr=CAREER.career, org=CAREER.org;
  if(!org) return false;
  const cost=careerBuyoutCost();
  if((cr.balance||0)<cost) return false;
  cr.balance-=cost;
  cr.bought=(cr.bought||0)+cost;
  CAREER.org=null;
  CAREER.offers=null;
  careerRepAdd(-2);
  careerNews('bad', 'ccNewsBoughtOut', [org.name, ccNum(cost)]);
  careerEvent('tlBoughtOut', [org.name, ccNum(cost)]);
  careerSave();
  careerRenderHub();
  return true;
}
/* The man who does the talking, in his own tile beside the club's.

   He has lived in the inbox since he was built, which is where he is signed and
   where he is let go — and nowhere on the screen did a career see what he was
   costing or buying once the thread scrolled away. His call, 17 August: manager
   on the left, club on the right, the two deals a career is on side by side.

   Signed, it prints the deal it is actually on rather than the table's — see
   careerAgentTerms, which is what an older save keeps. Unsigned, it says the
   same thing the empty club tile says: whether that is the player or the month.
   Nobody is represented below CC_AGENT_FROM, so the number is on the tile. */
/* The player's own account, at the top of the feed column.

   Written off the three profiles he sent on 17 August — Vanyak3k, Panzer,
   Malibuca — which are the same bio three times: age and flag, what you are and
   who you play for, what you have won, what you have earned, and who represents
   you. Everything in it is already in the save; nothing is invented, and the
   two things those bios carry that a career cannot know — an email and a Twitch
   channel — are left out rather than made up.

   The club reads as a tag where its handle is known and as plain text where it
   is not, the same rule the agents follow. Three are known because he sent them
   himself, written by the clubs and players on their own profiles. Deriving the
   rest from the club's name would be inventing a real organisation's handle. */
const CC_ORG_AT={'Gentle Mates':'GentleMates', 'Geekay Esports':'geekay_esports',
                 'BIG':'BIGCLANgg', 'BIG Clan':'BIGCLANgg', 'Loyalty Gamer':'TeamLG__', 'Kraven Esport':'kravenesport'};
function ccOrgAt(name){ return CC_ORG_AT[String(name||'')] || null; }
/* The one line a career leads with, for the strip under the name.

   Ordered the way a profile is read rather than the way the log is stored: a
   Major beats a stack of cups, a cup beats a place at the Globals, and Player
   of the Season is the thing you say when you have not won a tournament yet.
   Nothing here is new — it is careerBioHTML's own arithmetic, asked for one
   answer instead of all of them. */
function careerTopHonour(){
  const log=CAREER.career.log||[];
  const maj=log.filter(r=>!r.who && ccFncsTitle(r)).length;
  if(maj) return L().ccBioMajor(maj);
  /* Отзыв: «я выиграл EWC, и в bio сошиал не пишет 1x EWC
     Reload». Выигранный ЛАН — титул не ниже Мейджора; считается тем же
     журналом, что и плитка трофеев (careerTrophies). */
  const t=careerTrophies();
  if(t.paris) return L().ccBioRc(t.paris);
  if(t.summit) return L().ccBioSummit(t.summit);
  const cups=log.filter(r=>r.kind==null && r.place===1).length;
  if(cups) return L().ccBioCups(cups);
  const best=log.filter(r=>r.kind==='globals').map(r=>r.place).sort((a,b)=>a-b)[0];
  if(best) return L().ccBioGlobals(best);
  const s=careerAwardsWon('season'); if(s) return L().ccAwardSeason+' ×'+s;
  const m=careerAwardsWon('month');  if(m) return L().ccAwardMonth+' ×'+m;
  return '';
}
/* СВОЁ БИО (5.10, Notion «05», испанский игрок: «edición de biografía»). Авто-строка ниже
   остаётся по умолчанию; написанное игроком встаёт на её место в профиле (ccBioLine) и
   отдельной строкой в шапке соцсети. Текст — только текст: чистится от управляющих символов,
   режется по CC_BIO_MAX и выводится через esc (память: поверхность self-XSS — свои поля). */
const CC_BIO_MAX=160;
function ccBioClean(v){
  return String(v==null ? '' : v).replace(/[\u0000-\u001f\u007f\u2028\u2029]/g, ' ')
    .replace(/\s+/g, ' ').trim().slice(0, CC_BIO_MAX);
}
function ccMyBio(){ const cr=CAREER && CAREER.career; return cr ? ccBioClean(cr.bio) : ''; }
function careerBioSet(v){
  const cr=CAREER && CAREER.career; if(!cr) return '';
  const t=ccBioClean(v);
  cr.bio=t || null;
  try{ careerSave(); }catch(e){}
  return t;
}
function ccBioOwnHTML(){
  const b=ccMyBio();
  return (b ? `<span class="x-bio-txt">${esc(b)}</span>` : '')+
    `<button class="x-bio-edit" type="button" onclick="careerBioEdit()">✎ ${esc(L().ccBioEdit)}</button>`;
}
function careerBioEdit(){
  const box=document.getElementById('xBioOwn'); if(!box) return false;
  const T=L();
  box.innerHTML=`<textarea id="xBioIn" class="x-bio-in" maxlength="${CC_BIO_MAX}" rows="2"
      placeholder="${esc(T.ccBioPh(CC_BIO_MAX))}">${esc(ccMyBio())}</textarea>
    <div class="x-bio-btns"><button class="ch-sign" type="button" onclick="careerBioCommit(false)">${esc(T.ccBioSave)}</button>
      <button type="button" onclick="careerBioCommit(true)">${esc(T.ccBioAuto)}</button>
      <button type="button" onclick="careerBioCancel()">${esc(T.ccBioCancel)}</button></div>`;
  const inp=document.getElementById('xBioIn'); if(inp) inp.focus();
  return true;
}
function careerBioCommit(reset){
  const inp=document.getElementById('xBioIn');
  careerBioSet(reset ? '' : (inp ? inp.value : ''));
  careerBioCancel();
}
function careerBioCancel(){ const box=document.getElementById('xBioOwn'); if(box) box.innerHTML=ccBioOwnHTML(); }
function careerBioHTML(){
  // Своё био, если написано, — вместо собранного.
  if(ccMyBio()) return esc(ccMyBio());
  const pl=CAREER.player, cr=CAREER.career, org=CAREER.org, on=careerAgent();
  const bits=[];
  const age=ccPlayerAge();
  // Age and the flag, the way all three of those bios open.
  bits.push([age ? String(age) : '',
             pl.country ? `<img class="ch-bio-flag" src="flags/w20/${
               esc(ccCountryOf(String(pl.country).toLowerCase()))}.png" alt="" title="${
               esc(ccCountryName(pl.country)||'')}">` : ''].filter(Boolean).join(' '));
  bits.push(L().ccBioPro+(org ? ' '+(ccOrgAt(org.name)
      ? '<span class="x-at">@'+esc(ccOrgAt(org.name))+'</span>'
      : '<b>'+esc(org.name)+'</b>') : ''));
  // What it has won, counted off the log the history screen reads.
  const log=cr.log||[];
  const cupWins=log.filter(r=>r.kind==null && r.place===1).length;
  const majWins=log.filter(r=>!r.who && ccFncsTitle(r)).length;
  const best=log.filter(r=>r.kind==='globals').map(r=>r.place).sort((a,b)=>a-b)[0];
  if(majWins) bits.push(L().ccBioMajor(majWins));
  const lan=careerTrophies();
  if(lan.paris) bits.push(L().ccBioRc(lan.paris));
  if(lan.summit) bits.push(L().ccBioSummit(lan.summit));
  if(cupWins) bits.push(L().ccBioCups(cupWins));
  if(best) bits.push(L().ccBioGlobals(best));
  const mAw=careerAwardsWon('month'), sAw=careerAwardsWon('season');
  if(sAw) bits.push(L().ccAwardSeason+' ×'+sAw);
  else if(mAw) bits.push(L().ccAwardMonth+' ×'+mAw);
  if(cr.earnings) bits.push(ccMoney(cr.earnings)+'+');
  // Malibuca's profile does not tag a manager and prints a business line
  // instead; a career without one says the same kind of thing rather than
  // leaving the slot empty.
  bits.push(on ? L().ccBioManager+' '+((ccAgentFace(on).at)
      ? '<span class="x-at">@'+esc(ccAgentFace(on).at)+'</span>' : '<b>'+esc(on.name)+'</b>')
    : L().ccBioNoManager);
  const smm=ccSmm();
  if(smm) bits.push(L().ccSmmBio('<b>'+esc(smm.name)+'</b>'));
  return bits.filter(Boolean).join(' · ');
}
/* Next-event card: what the tournament is before you play it. Length, room size, what knocks you out, what 1st
   is worth to you (not to the pair). Unpaid stages say so (Reload Opens and Play-In pay nothing).
   Only uses what the file holds: ccNextShape for the shape, the same prize functions the runners pay from. A row
   with no number isn't drawn. */
function ccNextTopPrize(next){
  const k=next && next.type, cr=CAREER.career;
  const half=cash=>ccShareOf(cash, {squad:[1,2]});
  try{
    if(k==='final')  return half(wfPrize(1));
    if(k==='eval')   return half(ccEvalWinCash());
    if(k==='major'){ const ev=careerMajorOn(careerToday());
      return ev && ev.stage==='final' ? half(majorPrize(1)) : 0; }
    if(k==='reload'){ const ev=careerReloadOn(careerToday());
      return ev ? half(relStagePrize(ev.stage, 1)) : 0; }
    if(k==='gc'){ return careerGclcOn(careerToday()) ? half(gclcPrize(1)) : half(rcPrize(1)); }
    if(k==='cup')    return cr.division===1 ? 0 : 0;
  }catch(e){}
  return 0;
}
function careerNextCardHTML(next, playable){
  if(!next || CAREER.career.seasonOver) return '';
  const shape=ccNextShape(next)||{};
  const money=ccNextTopPrize(next);
  const when = next.day===careerToday() ? L().chLiveNow
    : L().calDows[(new Date(next.day+'T00:00:00Z').getUTCDay()+6)%7]+' '+
      Number(next.day.slice(8))+' '+L().calMonthsShort[Number(next.day.slice(5,7))-1];
  const row=(k,v)=>`<div class="ch-row"><em>${k}</em><b>${v}</b></div>`;
  return `<div class="ch-tile ch-tile-next">
    <h4>${L().chNext}</h4>
    <div class="ch-nextcard-head"><b>${esc(next.label||next.title||'')}</b>
      <em class="${next.day===careerToday()?'ch-next-now':''}">${esc(when)}</em></div>
    ${shape.games ? row(L().ccNextGames, shape.games+' '+L().ccNextGamesUnit) : ''}
    ${shape.of ? row(L().ccNextField, shape.of) : ''}
    ${shape.cut ? row(L().ccNextCut, L().ccNextTop(shape.cut)) : ''}
    ${money ? row(L().ccNextPays, ccMoney(money))
            : `<div class="ch-row"><em>${L().ccNextPays}</em><b class="cc-pen">${L().ccNextNoPay}</b></div>`}
    ${playable ? '' : `<div class="ch-hint">${L().ccNextLocked}</div>`}
  </div>`;
}
/* The duo panel, lifted out of the centre's markup so the career tab can hold
   it. Nothing about it changed — the card is up with the player's own, and what
   is left is what the duo actually is: who, how old, what mood, how long you
   have been a pair and what that is worth to your own growth. */
/* One block per person, because a trio year has two of them.

   A duo draws exactly what it drew before — who, their role, their age, their
   mood — and a trio draws that twice, with an empty chair saying so rather than
   being left out. Chemistry and what the seat is worth to your own growth are
   said once at the bottom, because both are properties of the squad rather than
   of a person: see careerChemDays, which reads the newest of them, and
   careerMateFactor, which reads the strongest. */
function ccMateBlockHTML(mate, rec){
  if(!mate) return `<div class="ch-row ch-row-empty"><em>${L().ccResPartner}</em><b>${L().ccSeatEmpty}</b></div>`;
  const pat = rec && rec.patience!=null ? rec.patience : CAREER_PATIENCE_START;
  return `<div class="ch-row"><em>${L().ccResPartner}</em><b>${flagFor(mate)}${esc(mate.handle)} (${attrsFor(mate).ovr})</b></div>`+
    `<div class="ch-row"><em>${L().ccRole}</em><b>${L()[attrsFor(mate).roleKey]||''}</b></div>`+
    (()=>{ const a=ccAgeShown(mate.handle);
      return a ? `<div class="ch-row"><em>${L().ccAge}</em><b>${L().ccYearsOld(a)}</b></div>` : ''; })()+
    `<div class="ch-row"><em>${L().ccMood}</em><b>${L()[careerMoodKey(pat)]}</b></div>`;
}
function careerDuoTileHTML(){
  const mates=careerMates(), recs=careerMateRecords(), seats=careerMateSeats();
  const mate=mates[0];
  const blocks=[];
  for(let i=0; i<seats; i++) blocks.push(ccMateBlockHTML(mates[i], recs[i]));
  return `<div class="ch-tile">
    <h4>${seats>1 ? L().ccSquadTrio : L().chSquad}</h4>
    <div class="ch-hint">${seats>1 ? L().chSquadHintTrio : L().chSquadHint}</div>
    <div class="ch-duo"><div class="ch-duo-rows">
    ${mates.length ? blocks.join('')+
             `<div class="ch-row"><em>${L().ccChem}</em><b class="${careerChem()>0?'ch-goal-met':''}">+${
                careerChem()} · ${L().ccChemDays(careerChemDays())}</b></div>`+
             (()=>{ const f=careerMateFactor(CAREER.player.ovrExact!=null?CAREER.player.ovrExact:CAREER.player.ovr);
               const pct=Math.round((f-1)*100);
               return `<div class="ch-row"><em>${L().ccMateLearn}</em><b class="${pct>0?'ch-goal-met':pct<0?'cc-pen bad':''}">${pct>0?'+':''}${pct}%</b></div>`; })()
           : `<div class="ch-empty">${L().chNoPartner}</div>`}
    <!-- The one button that used to sit here asked for somebody without saying
         which chair it meant, so in a trio there was no way to say "this one,
         not that one" — it took whoever was rated lowest. It now sits under each
         card instead, one per chair. His report, 20 August. See careerMeHTML. -->
    </div></div>
  </div>`;
}
/* The career tab: who this player is and who they are tied to.

   Left, the person — both cards, the profile with the bio and the counts, and
   the seat beside them. Right, everyone with a claim on the money: the man who
   negotiates, the club that pays, the brand that rents the audience, the coach
   who is hired by the month. The rival closes it, because he is the only one
   here who does not want anything from you except to finish above you. */
function careerMeHTML(){
  return careerMeHTML0()+ccVacTileHTML()+ccWrapBtnHTML()+ccInvTileHTML();
}
function careerMeHTML0(){
  const card=careerCard(), mates=careerMates(), seats=careerMateSeats();
  /* One card per chair, and an empty chair drawn as an empty chair.

     His report, 19 August, off a trio season: the tile said three people and the
     row underneath it showed two cards, so there was nothing on the screen that
     said a seat was still open — you had to read the rows to find out. */
  /* Роль стоит под собственной карточкой и меняется оттуда же.
     Кнопка под чужой карточкой меняет напарника; под своей — меняет то
     единственное в себе, что выбирают, а не зарабатывают. Ролей две, поэтому
     на кнопке написана та, в которую переходят. */
  const roleNow=ccRoleNow(), roleCan=ccRoleSwapCan();
  const cardTiles=[`<div class="ch-tile ch-tile-card">
      <h4>${esc(CAREER.player.nick||'')}</h4>
      <div class="ch-cardwrap">${card?futCardHTML(card,{wide:true, noEvent:true, peek:true}):''}</div>
      ${ccMeEditHTML()}
      ${(CAREER.career.sp||0) ? `<div class="ch-sp">
        <!-- Очки в карьере больше не начисляются (правка: раздача
             один раз на экране создания). Плитка живёт только ради сейвов, в
             которых очки успели скопиться, — потратил и её больше нет. -->
        <em>${L().ccSpTitle}: <b>${CAREER.career.sp}</b></em>
        <div class="ch-sp-btns">${ATTR_KEYS.map(k=>
          `<button onclick="careerSpSpend(\'${k}\')" title="+0.5">+ ${
            L()['attr'+k.charAt(0).toUpperCase()+k.slice(1)]}</button>`).join('')}</div>
      </div>` : ''}
      ${roleNow ? `<div class="ch-row"><em>${L().ccRole}</em><b>${L()[roleNow]||''}</b></div>
      <button class="ch-swap" onclick="careerRoleSwap()"${roleCan.ok?'':' disabled'}>${
        L().ccRoleSwapTo(L()[ccRoleOther(roleNow)])}</button>`+
      // Погасшая кнопка обязана сказать, почему: команда уже собрана, и
      // пересесть значит оставить её с двумя ИГЛами или без единого.
      (roleCan.ok ? '' : `<div class="ch-hint">${
        roleCan.why==='cool' ? L().ccRoleCool(roleCan.days) : roleCan.why==='two' ? L().ccRoleLockedTwo : L().ccRoleLockedNone}</div>`) : ''}
      ${(()=>{ const r=ccSquadRoles(); return (r.length>=careerSquadSize() && r.indexOf('roleIGL')<0) ? `<div class="ch-hint">${esc(L().ccRoleNoIgl||'')}</div>` : ''; })()}
    </div>`];
  /* One button per chair, under the card sitting in it.

     Asking from under a card is asking for that card to be replaced, and the
     seat travels with the request: through the search, into the conversation,
     and out the other side on the day they say yes. An empty chair asks to be
     filled instead, which is the same button with the other word on it.

     His report, 20 August: with one button above all of them there was no way
     to say which of two partners he wanted gone. See careerMateSeat. */
  /* Too many for the season: the year turned from trios to duos with both
     partners still held. Every one of them is drawn, and the button under each
     says the only thing there is to decide — who stays. Nothing else on these
     tiles works until it is decided, because there is no squad to work on. */
  if(careerMatesOver()>0){
    const all=(CAREER.partners||[]).filter(Boolean);
    all.forEach((pr, i)=>{
      const m=ccMateCardOf(pr);
      cardTiles.push(`<div class="ch-tile ch-tile-card">
        <h4>${L().ccResPartner}</h4>
        <div class="ch-cardwrap">${m?futCardHTML(m,{wide:true, noEvent:true, peek:true}):''}</div>
        <button class="ch-sign" onclick="careerMateChoose(${i})">${L().ccMateKeep}</button>
      </div>`);
    });
    return `<div class="ch-grid ch-grid-me">
      <div class="ch-col">
        <div class="ch-tile"><h4>${L().chSquad}</h4>
          <div class="ch-hint">${L().ccMateOver}</div></div>
        <div class="ch-pair ch-pair-cards ch-pair-trio">${cardTiles.join('')}</div>
      </div>
      <div class="ch-col">
        ${careerOrgTileHTML()}
        ${careerStaffPanelHTML()}
      </div>
    </div>`;
  }
  for(let i=0;i<seats;i++){
    const m=mates[i];
    /* Крестик — только когда в кресле кто-то есть, и только рядом с чужой
       карточкой. Распустить состав можно и не подобрав замену: в трио это
       ровно то, что делают. Подтверждение на careerMateKickAsk. */
    cardTiles.push(`<div class="ch-tile ch-tile-card">
      <h4>${L().ccResPartner}${m && !(i===0 && ccMpOn() && typeof MP!=='undefined' && MP.peer)?`<button class="ch-kick" title="${
        esc(L().ccMateKick)}" aria-label="${esc(L().ccMateKick)}"
        onclick="careerMateKickAsk(${i})">×</button>`:''}</h4>
      <div class="ch-cardwrap">${m?futCardHTML(m,{wide:true, noEvent:true, peek:true})
        :`<div class="ch-empty ch-empty-seat">${(i===0 && !mates.length)?L().chNoPartner:L().ccSeatEmpty}</div>`}</div>
      <button class="ch-swap" onclick="ccDuoFindOpen(${i})">${
        m ? ccSay('ccMateReplace') : ccSay('ccFindDuo')}</button>
    </div>`);
  }
  /* «Карьера» — только игра: состав слева, справа своя точка, составы по размерам и коуч.
     Клуб, менеджер, маркетинг и SMM переехали во вкладку «Клуб» (careerClubTabHTML). */
  /* 22.11 (его «career я бы переработал, чтоб игрок сразу видел свой состав и всё понятно было, как он сменить может»):
     сверху во всю ширину - состав карточками с кнопками под каждой и коротко, как его поменять; под ним составы по
     форматам (дуо, трио, сквад). Пара, своя точка, сравнение и химия - ниже. */
  const T=L(), fmtName={1:'Solo', 2:T.lfRosterDuo, 3:T.lfRosterTrio, 4:T.lfRosterSquad}[careerSquadSize()]||'';
  const mp=(typeof ccMpOn==='function' && ccMpOn());
  const how=mp ? '<p class="ch-sq-howp">'+esc(T.sqHowMp)+'</p>'
    : '<ol class="ch-sq-steps"><li>'+esc(T.sqStepFind)+'</li><li>'+esc(T.sqStepDm)+'</li><li>'+esc(T.sqStepKick)+'</li><li>'+esc(T.sqStepFmt)+'</li></ol>';
  return `<div class="ch-squad-hero">
      <div class="ch-squad-h"><h3>${esc(T.sqTitle(fmtName))}</h3></div>
      <div class="ch-pair ch-pair-cards ch-squad-cards${seats>1?' ch-pair-trio':''}">${cardTiles.join('')}</div>
      <details class="ch-squad-how"${(CAREER.career.log||[]).length<3 ? ' open' : ''}><summary>${esc(T.sqHow)}</summary>${how}</details>
    </div>
    ${ccRostersTileHTML()}
    <div class="ch-grid ch-grid-me">
    <div class="ch-col">
      ${careerDuoTileHTML()}
      ${careerNextCardHTML(careerNext(), careerCanPlay(careerNext()) && !CAREER.career.seasonOver)}
    </div>
    <div class="ch-col">
      ${careerSpotTileHTML()}
      ${ccMateCompareHTML()}
      ${ccChemTileHTML()}
    </div>
  </div>`;
}
// Составы по размерам — дуо, трио, сквад: кто в каком, какой играет сейчас.
function ccRostersTileHTML(){
  if(!CAREER) return '';
  const now=CAREER.rosterSize||careerSquadSize();
  const all=Object.assign({}, CAREER.rosters||{});
  all[now]=(CAREER.partners||[]).slice();
  const names={2:L().lfRosterDuo, 3:L().lfRosterTrio, 4:L().lfRosterSquad};
  /* Всегда три строки — дуо, трио, сквад (его слово 29.09: «в карьере нет трио-состава, непонятно, с кем
     играешь»): кто в составе, сколько из скольких, и у неполного — «Позвать» (поиск с личкой, ccDuoFindOpen(fmt)). */
  const me=CAREER.player.nick||CAREER.player.handle||'';
  const mpNow=(typeof ccMpOn==='function' && ccMpOn());
  const rows=[2,3,4].map(s=>{
    // Онлайн трио/сквад — те же двое живых (+ филл на вечер), а не пустой одиночный состав формата (скрин 22.10: «трио · 1/3»).
    const picks=(mpNow && s!==now) ? (((CAREER.career||{}).fmtPick||{})[s]||[]).map(h=>({handle:h})) : [];
    const src=(mpNow && s!==now) ? careerMates().filter(c=>c && c.handle).slice(0, 1).map(c=>({handle:c.handle})).concat(picks) : (all[s]||[]);
    const who=src.filter(Boolean).map(r=>{ const c=ccMateCardOf(r); return c && c.handle; }).filter(Boolean).slice(0, s-1);
    const full=who.length>=s-1;
    // Сбор не текущего формата — за неделю до его первого вечера (его слово 8.10: «во вкладке карьера можно уже трио и
    // сквад собрать, хотя турниры ещё не скоро»), как и метка на карте (ccFmtOpenFrom). Нет вечеров формата — нет кнопки.
    const from=(s!==now) ? ccFmtOpenFrom(s) : null, plays=s===now || (typeof ccFormatNext==='function' && !!ccFormatNext(s));
    /* ОНЛАЙН — не «Позвать» (Telegram 22.10: «в трио чела позвать невозможно»): в командной карьере поиск по личкам
       закрыт (ccDuoFindOpen), третий и четвёртый садятся на вечер филлом у обоих (ccMpFmtBegin). Кнопка была мёртвой —
       жмёшь, ничего. Теперь та же подпись, что в Центре (ccRostersStripHTML). */
    const mpFill=(typeof ccMpOn==='function' && ccMpOn() && s!==now && s>2 && plays);
    const btn=mpFill ? (CC_MP_FMT_ON ? ` <button class="cc-rost-ask" onclick="ccDuoFindOpen(null, ${s})">${esc(full ? (L().roMpSwap||L().lfRosterAsk) : L().lfRosterAsk)}</button>` +
        (!full && L().roMpFill ? ` <small class="cc-rost-from">${esc(L().roMpFill(s-1-who.length))}</small>` : '') : '')
      : (full || s===now || !plays) ? ''
      : from ? ` <small class="cc-rost-from">${esc(L().roSpotFrom(ccDayLabel(from)))}</small>`
      : ` <button class="cc-rost-ask" onclick="ccDuoFindOpen(null, ${s})">${esc(L().lfRosterAsk)}</button>`;
    return `<div class="ch-row"><em>${names[s]}${s===now?' · '+L().lfRosterNow:''} · ${who.length+1}/${s}</em><b>${esc([me].concat(who).join(', '))}${btn}</b></div>`;
  });
  return `<div class="ch-tile"><h4>${L().lfRosters}</h4><div class="ch-hint">${L().lfRostersHint}</div>${rows.join('')}</div>`;
}
// Доходы карьеры по статьям.
function ccIncomeTileHTML(){
  const cr=CAREER.career, rows=[];
  const add=(k,v,always)=>{ if(v || always) rows.push(`<div class="ch-row"><em>${L()[k]}</em><b>${ccMoney(v||0)}</b></div>`); };
  add('lfPrize', cr.earnings, true); add('lfWages', cr.wages, true); add('lfSponsor', cr.sponsored, true); add('lfSide', cr.side); add('lfOrgCut', cr.orgCut);
  rows.push(`<div class="ch-row"><em>${L().lfBalance}</em><b>${ccMoney(cr.balance||0)}</b></div>`);
  return `<div class="ch-tile"><h4>${L().lfIncome}</h4>${rows.join('')}</div>`;
}
// Вкладка «Клуб»: организация, контракт и цель, менеджер, маркетинг, SMM, доходы.
/* ШТАБ — весь персонал карьеры одной панелью (его «делай» 8.10 на «дизайн и панельки понятней, чтоб не аишно и
   всё понятно»). Было шесть плиток в двух вкладках: коуч на «Карьере», остальные пятеро на «Клубе» длинным столбцом,
   у каждого абзац пояснений и по две кнопки во всю ширину. Теперь — карточки как в FC: аватар, роль, рейтинг в цвете
   (золото от 85, серебро от 75, бронза ниже), одна строка того, что он даёт, и срок. Пустая карточка — «＋ Нанять».
   Нажатие открывает то же окно выбора, что и раньше; «разорвать» — маленькой ссылкой, где расторжение есть. */
/* СРОК И АВТОПРОДЛЕНИЕ ШТАБА (его слова 8.10: «может автоматически продлеваются коуч смм и тд», «или сразу на год
   возможность дать»). Месяц — 30 дней, год — 12 месяцев со скидкой 10% (оценка режима). Найм помнит срок и месячную
   цену; когда срок выходит, контракт продлевается на тот же срок, если включено автопродление (по умолчанию да) и хватает
   денег; коуча, которого оплачивает клуб, — бесплатно. Не хватило — человек уходит, новость об этом одна. Менеджера это
   не касается: у него нет срока, он берёт долю. */
const CC_STAFF_YEAR=12, CC_STAFF_YEAR_DISC=0.10;
function ccStaffTermCost(month, months){
  return months>=CC_STAFF_YEAR ? Math.round(month*CC_STAFF_YEAR*(1-CC_STAFF_YEAR_DISC)/50)*50 : month;
}
function ccStaffTermDays(months){ return 30*(months>=CC_STAFF_YEAR ? CC_STAFF_YEAR : 1); }
function ccAutoRenewOn(){ return !CAREER || CAREER.autoRenew!==false; }
function careerAutoRenewToggle(){ CAREER.autoRenew=!ccAutoRenewOn(); careerSave(); careerRenderHub(); }
// Все пять «сроковых» ролей: где лежит найм, его месячная цена, кто платит.
function ccStaffTermRecs(){
  const S=L().ccStaffRole, out=[];
  if(CAREER.coach){ const c=CC_COACHES.find(x=>x.id===CAREER.coach.id);
    if(c) out.push({key:'coach', rec:CAREER.coach, role:S.coach, name:c.name, month:CAREER.coach.cost||c.cost, free:()=>ccOrgPaysCoach()}); }
  if(CAREER.smm) out.push({key:'smm', rec:CAREER.smm, role:S.smm, name:CAREER.smm.name, month:CAREER.smm.cost||CC_SMM_FROM});
  if(CAREER.mkt) out.push({key:'mkt', rec:CAREER.mkt, role:S.mkt, name:CAREER.mkt.name, month:CAREER.mkt.cost||0});
  for(const k of ['analyst','psych','physio']) if(CAREER[k]) out.push({key:k, rec:CAREER[k], role:S[k]||L().ccPhysio, name:CAREER[k].name, month:CAREER[k].cost||0, free:()=>ccOrgPays(k)});
  return out;
}
function ccStaffAutoRenew(toISO){
  const cr=CAREER.career;
  ccStaffTermRecs().forEach(t=>{
    const r=t.rec; if(!r || !r.until || r.gone) return;
    let guard=0;
    while(r.until<toISO && guard++<40){
      if(!ccAutoRenewOn()){ return; }
      const months=r.months||1, free=t.free && t.free(), cost=free ? 0 : ccStaffTermCost(t.month, months);
      if((cr.balance||0)<cost){ r.gone=true; careerNews('bad', 'ccNewsStaffGone', [t.role, t.name]); return; }
      cr.balance-=cost;
      r.until=ccAddDays(r.until, ccStaffTermDays(months));
      // В ленту продление не пишется (16.10, его слово): это бухгалтерия, а не новость; деньги видны в балансе.
    }
  });
}
// Кнопки найма в окнах выбора: месяц и год рядом.
function ccHireBtns(can, month, onMonth, onYear, label){
  const y=ccStaffTermCost(month, CC_STAFF_YEAR);
  return `<span class="cc-buy-btns"><button class="ch-sign"${can?'':' disabled'} onclick="${onMonth}">${label||ccMoney(month)}</button>`+
    `<button class="ch-sign cc-year"${can && (CAREER.career.balance||0)>=y ?'':' disabled'} onclick="${onYear}">${L().ccStaffYear} · ${ccMoney(y)}</button></span>`;
}
function ccStaffBadge(r){
  const cls=r>=85 ? 'gold' : r>=75 ? 'silver' : 'bronze';
  return `<span class="cc-staff-rt ${cls}">${r}</span>`;
}
function ccStaffCards(){
  const T=L(), S=Object.assign({physio:T.ccPhysio}, T.ccStaffRole), out=[];
  // Коуч
  { const w=ccCoach(), row=w ? (CC_COACHES.find(c=>c.id===w.id)||w) : null;
    out.push(w ? {role:S.coach, name:w.name, at:w.at, photo:w.photo, r:row.rating||ccCoachRatingOf(row),
                  fx:T.ccShopTrain+' +'+Math.round((w.train||row.train||0)*100)+'%', until:CAREER.coach && CAREER.coach.until, year:(CAREER.coach.months||1)>=12, open:'ccCoachPickOpen()'}
               : {role:S.coach, open:'ccCoachPickOpen()'}); }
  // Менеджер
  { const a=careerAgent();
    if(a){ const row=CC_AGENTS.find(x=>x.name===a.name)||{at:a.at, x:0}, t=careerAgentTerms();
      out.push({role:S.agent, name:a.name, at:a.at, photo:(ccAgentFace({name:a.name, photo:a.photo, at:a.at})||{}).photo||a.photo, r:ccStaffRating(row),
                fx:T.ccAgentReachRow+' +'+t.reach+' · '+Math.round(t.cut*100)+'%', open:'ccAgentPickOpen()', end:'careerEndAgent()'}); }
    else out.push({role:S.agent, open:'ccAgentPickOpen()'}); }
  // SMM
  { const m=ccSmm();
    out.push(m ? {role:S.smm, name:m.name, at:m.at, photo:m.photo, r:ccStaffRating(ccSmmOf(m.id)||m),
                  fx:T.ccSmmGain+' +'+Math.round(ccSmmBoost()*100)+'%', until:m.until, year:(m.months||1)>=12, open:'ccSmmPickOpen()', end:'careerEndSmm()'}
               : {role:S.smm, open:'ccSmmPickOpen()'}); }
  // Маркетинг
  { const m=ccMkt(), row=m ? (ccMktOf(m.id)||m) : null;
    out.push(m ? {role:S.mkt, name:row.name||m.name, at:row.at, photo:row.photo, r:ccStaffRating(row),
                  fx:T.ccStaffMktFx((m.rate!=null ? m.rate : ccMktTermsOf(row).rate).toFixed(2)), until:m.until, year:(m.months||1)>=12, open:'ccMktPickOpen()', end:'careerEndMkt()'}
               : {role:S.mkt, open:'ccMktPickOpen()'}); }
  // Аналитик и психолог
  for(const kind of ['analyst','psych','physio']){
    const m=ccStaff2(kind);
    out.push(m ? {role:S[kind], name:m.name, at:m.at, photo:m.photo, r:m.rating, fx:ccStaff2Effect(kind, m.rating),
                  until:m.until, year:(m.months||1)>=12, open:"ccStaff2PickOpen('"+kind+"')", end:"careerEndStaff2('"+kind+"')"}
               : {role:S[kind], open:"ccStaff2PickOpen('"+kind+"')"});
  }
  // Коуч, аналитик, психолог — можно попросить свой клуб оплатить (careerOrgPayAsk).
  const orgOn=CAREER.org && !CAREER.org.own;
  out.forEach((c,i)=>{ const kind=['coach',null,null,null,'analyst','psych'][i]; if(!kind || !orgOn) return;
    if(ccOrgPays(kind)) c.pay='<small class="cc-staff-paid">'+esc(L().ccOrgPays(CAREER.org.name))+'</small>';
    else { const no=ccOrgPayAskUntil(kind);
      c.pay=no ? '<small class="cc-staff-until">'+esc(L().ccOrgPayNoUntil(ccDayLabel(no)))+'</small>'
               : '<button class="cc-staff-ask" onclick="event.stopPropagation();careerOrgPayAsk(\''+kind+'\')">'+esc(L().ccOrgPayAskBtn)+'</button>'; } });
  return out;
}
function careerStaffPanelHTML(){
  const T=L();
  const card=c=>c.name
    ? `<div class="cc-staff-card" onclick="${c.open}">
        ${ccStaffBadge(c.r)}
        <span class="cc-staff-av">${c.photo ? `<img src="${PHOTO_DIR}${esc(c.photo)}" alt="" onerror="this.remove()">` : ''}<i>${esc(String(c.name).slice(0,2).toUpperCase())}</i></span>
        <em class="cc-staff-role">${esc(c.role)}</em>
        <b class="cc-staff-name">${esc(c.name)}</b>
        <span class="cc-staff-fx">${esc(c.fx)}</span>
        ${c.until ? `<small class="cc-staff-until">${T.ccCoachUntil} ${ccDayLabel(c.until)}${c.year ? ' · '+T.ccStaffYear : ''}${ccAutoRenewOn() ? ' · ↻' : ''}</small>` : ''}
        ${c.pay ? c.pay : ''}
        ${c.end ? `<button class="cc-staff-end" onclick="event.stopPropagation();${c.end}">${T.ccAgentEnd}</button>` : ''}
      </div>`
    : `<div class="cc-staff-card cc-staff-empty" onclick="${c.open}">
        <span class="cc-staff-plus">＋</span>
        <em class="cc-staff-role">${esc(c.role)}</em>
        <span class="cc-staff-hire">${T.ccStaffHire}</span>
        ${c.pay ? c.pay : ''}
      </div>`;
  return `<section class="cc-staff-wrap">
    <div class="cc-sect-row"><h3 class="cc-sect-h">${T.ccStaffTitle}</h3>
      <button class="cc-auto${ccAutoRenewOn()?' on':''}" onclick="careerAutoRenewToggle()">${T.ccStaffAuto}: ${ccAutoRenewOn() ? T.ccStaffOn : T.ccStaffOff}</button></div>
    <div class="cc-staff">${ccStaffCards().map(card).join('')}</div>
  </section>`;
}
/* «Контракт» отдельной плиткой убран (его слово 8.10: «контракт нужно убрать — вкладка «Организация» будто это и есть
   организация»): зарплата, доля, цель, выкуп и выплаты — строками внутри «Организации». На его месте — «Спонсоры»
   коротко (его слово 8.10: «в клубе где-то должны быть спонсоры у игрока»): кто подписан, слоты, ссылка на список. */
// В «Организации» уже есть зарплата, доля, выплачено, задача и выкуп — добавляем только то, чего там нет: с какого сезона.
function ccContractRowsHTML(){
  return '';   // «в клубе с сезона» — в «Подробнее» плитки клуба (8.10)
  const org=CAREER && CAREER.org; if(!org || !org.since) return '';
  return `<div class="ch-row"><em>${L().lfSince}</em><b>${org.since}</b></div>`;
}
function ccSponsorMiniHTML(){
  const T=L(), all=ccSponsorsAll(), slots=ccSpSlots(), offer=ccSponsorOffer();
  const per=all.reduce((x,y)=>x+(y.pay||0), 0);
  const logos=all.map(x=>'<span class="cc-spb-logo" onclick="ccSpPickOpen()" title="'+esc(T['ccSponsor'+x.id]||x.id)+'"><img src="'+PHOTO_DIR+'sp_'+(CC_SPONSOR_LOGO[x.id]||'x')+'.png" alt="" onerror="this.remove()"></span>').join('')+
    Array.from({length:Math.max(0, slots-all.length)}, ()=>'<span class="cc-spb-logo cc-spm-free" onclick="ccSpPickOpen()">＋</span>').join('');
  return '<div class="ch-tile cc-spm"><h4>'+esc(T.ccSpbTitle||T.ccSponsorTitle)+'</h4><div class="cc-spm-logos">'+logos+'</div>'+
    '<div class="ch-row"><em>'+esc(T.ccSpbTitle||T.ccSponsorTitle)+'</em><b>'+all.length+'/'+slots+'</b></div>'+
    (per ? '<div class="ch-row"><em>'+esc(T.ccSpbPer)+'</em><b>'+ccMoney(per)+T.ccPerStream+'</b></div>' : '')+
    (all.length && ccSpPostsReady() ? '<div class="ch-row cc-spm-post" onclick="ccSpPickOpen()"><em>📣 '+esc(T.ccSpPostReady)+'</em><b>'+ccSpPostsReady()+'</b></div>' : '')+
    (offer ? '<div class="ch-row"><em>'+esc(T.ccSpbOfferNow)+'</em><b>'+esc(T['ccSponsor'+offer.id]||offer.id)+' · '+ccMoney(offer.pay)+'</b></div>' : '')+
    '<button class="cc-back cc-spm-go" onclick="ccSpScroll()">'+esc(T.ccSpbAll)+'</button></div>';
}
/* Бренды — окном поверх, как выбор коуча/аналитика (его слово 8.10: «пусть спонсоры будут поверх, как с выбором коуча,
   а не в самом низу»). Плитка «Спонсоры» в верхнем ряду открывает его: ＋ в слоте, логотип, кнопка. */
function ccSpPickOpen(){
  const b=document.getElementById('spPickBody'), m=document.getElementById('spPickModal'); if(!b || !m) return;
  b.innerHTML=careerSponsorsHTML();
  m.style.display='flex';
  document.addEventListener('keydown', ccSpPickKey);
}
function ccSpPickClose(){ const m=document.getElementById('spPickModal'); if(m) m.style.display='none'; document.removeEventListener('keydown', ccSpPickKey); }
function ccSpPickKey(e){ if(e.key==='Escape') ccSpPickClose(); }
function ccSpPickRefresh(){ const m=document.getElementById('spPickModal'); if(m && m.style.display==='flex') ccSpPickOpen(); }
function ccSpScroll(){ ccSpPickOpen(); }
function careerClubTabHTML(){
  // Клуб строкой сверху (организация с контрактом, спонсоры, доходы), под ним штаб и полный список брендов.
  const org=careerOrgTileHTML(), i=org.lastIndexOf('</div>');
  const btn=org.indexOf('<button'), at=btn>0 ? btn : i;
  const orgFull=at>0 ? org.slice(0,at)+ccContractRowsHTML()+org.slice(at) : org+ccContractRowsHTML();
  // Штаб первым (его слово 23.10: «хочу стафф видеть сразу на вкладке»), клуб строкой под ним.
  return `${careerStaffPanelHTML()}
    <div class="cc-club-top">
      ${orgFull}
      ${ccSponsorMiniHTML()}
      ${ccIncomeTileHTML()}
    </div>`;
}
/* Смена ника и аватарки внутри карьеры.
   Безопасно, потому что от ника ничего не хранится: @-адрес считает ccHandle(nick) при отрисовке, автора постов
   ccPostAuthor берёт из CAREER.player при показе. Старые посты переименовываются сами, миграция не нужна.
   Имя настоящего игрока менять нельзя: pl.handle держит человека из ростера, по нему careerCard ищет карточку,
   и карьера потеряет результаты. Там меняется только фото.
   careerNickSet и careerPhotoSet чистые (их зовёт тест), careerNickAsk и careerPhotoPick висят на кнопках. */
const CC_NICK_MAX=20;
function careerNickSet(next){
  const pl=CAREER && CAREER.player; if(!pl) return false;
  if(pl.handle) return false;                       // чужое имя не наше дело
  const nick=String(next==null?'':next).trim().slice(0, CC_NICK_MAX);
  /* Ник должен содержать хоть одну букву или цифру — в любом алфавите.

     Сначала тут стояло «ccHandle(nick) не пустой», и это не работало: ccHandle
     при пустом результате возвращает исходную строку, чтобы кириллица и
     иероглифы всё-таки получили @-адрес, — поэтому «!!!» проходило проверку и
     становилось ником. Замерено пробой, а не придумано.

     \p{L} и \p{N} с флагом u, а не [a-z0-9]: Кирилл и ゆうま — нормальные ники,
     и отсекать их заодно с «!!!» нельзя. */
  if(!nick || !/[\p{L}\p{N}]/u.test(nick)) return false;
  if(nick===pl.nick) return true;
  pl.nick=nick;
  careerSave();
  careerRenderHub();
  return true;
}
function careerNickAsk(){
  const pl=CAREER && CAREER.player; if(!pl) return;
  if(pl.handle){ if(typeof alert==='function') alert(L().ccNickLocked); return; }
  const next=(typeof prompt==='function') ? prompt(L().ccNickAsk, pl.nick||'') : null;
  if(next==null) return;                            // отменил — ничего не было
  if(!careerNickSet(next) && typeof alert==='function') alert(L().ccNickBad);
}
function careerPhotoSet(url){
  const pl=CAREER && CAREER.player; if(!pl) return false;
  pl.photo=url||null;
  careerSave();
  careerRenderHub();
  return true;
}
function careerPhotoChosen(input){
  const f=input && input.files && input.files[0]; if(!f) return;
  const r=new FileReader();
  // Тот же путь, что и при создании карьеры: картинка ужимается до CC_PHOTO_MAX,
  // иначе один снимок с телефона не влезет в localStorage вместе с сейвом.
  r.onload=()=>{ ccPhotoShrink(String(r.result||''), function(url){ careerPhotoSet(url); }); };
  r.readAsDataURL(f);
  input.value='';
}
function careerPhotoPick(){
  const el=document.getElementById('chPhotoInput');
  if(el) el.click();
}
/* СОСТАВЫ ПО ФОРМАТАМ ГОДА — в шапке профиля (его скрин 30.09 с тремя рамками: «тут будут составы
   смотря какие режимы есть в году; вот дуо сейчас — пишет дуо, а если трио есть в этом сезоне — будет
   написано: турнир тогда-то первый трио, и за неделю можно собрать состав»). По блоку на каждый
   командный формат, который в году ещё играется: текущий — с составом, будущий — с датой первого
   турнира; за CC_ROSTER_WEEK дней до него — кнопка «Собрать состав» (личка того формата, ccDuoFindOpen). */
const CC_ROSTER_WEEK=7;
// Размер состава года на день: 2019/2020 — по этапам (ccPhaseRoster), остальные годы — как сейчас.
function ccSizeOnDay(d){
  if(typeof ccIs2019==='function' && ccIs2019()) return d<'2019-08-01' ? 2 : d<'2019-10-13' ? 3 : 4;
  if(typeof ccIs2020==='function' && ccIs2020()) return d<'2020-08-27' ? 2 : 3;
  if(ccS43Trios(d)) return 3;
  const n=CAREER && CAREER.career && CAREER.career.size;
  return n===1 ? 1 : n===3 ? 3 : n===4 ? 4 : 2;
}
// Первый день >= сегодня, когда играется формат f: этап года или кап этого формата.
function ccFormatNext(f){
  const today=careerToday(), to=ccYearTo();
  let best=null;
  const cand=d=>{ if(d>=today && d<=to && (!best || d<best)) best=d; };
  if(ccSizeOnDay(today)===f) cand(today);
  [['2019-08-01',3],['2019-10-13',4],['2020-08-27',3]].forEach(([d,n])=>{ if(n===f && ccSizeOnDay(d)===f) cand(d); });
  const MODE={2:'duo', 3:'trio', 4:'squad'};
  // С 2026 кап без своего формата играется составом года (ccVictoryFormat 0): он не зовёт собирать другой состав.
  (typeof ccVictoryList==='function' ? ccVictoryList() : []).forEach(v=>{ if(v.mode===MODE[f] && !v.invite && ccVictoryFormat(v)===f) cand(v.day); });
  return best;
}
function ccRostersStripHTML(lobby){
  if(!CAREER || !CAREER.career || careerRetired()) return '';
  const T=L(), today=careerToday(), cur=careerSquadSize();
  const NAME={2:T.lfRosterDuo, 3:T.lfRosterTrio, 4:T.lfRosterSquad};
  const cardsOf=f=>{
    if(f===cur) return careerMates().filter(c=>c && c.handle);
    // Онлайн состав другого формата — тот же живой напарник (+ филлы на вечер), а не одиночный список.
    if(ccMpOn()) return careerMates().filter(c=>c && c.handle).slice(0, 1).concat((((CAREER.career||{}).fmtPick||{})[f]||[]).map(h=>ccMateCardOf({handle:h})).filter(c=>c && c.handle));
    return (((CAREER.rosters||{})[f])||[]).map(r=>ccMateCardOf(r)).filter(c=>c && c.handle);
  };
  /* Тиммейт — не одним ником (его слово 30.09: «мало информации о тимейте»): фото, флаг, ник,
     рейтинг, роль и клуб. */
  const orgName=(CAREER.org && CAREER.org.name && !(typeof careerClub==='function' && careerClub())) ? CAREER.org.name : null;
  const mateHTML=(c, f)=>{
    const a=(typeof attrsFor==='function' ? attrsFor(c) : null)||{};
    const noUntil=orgName ? ccClubAskNoUntil(c.handle, orgName) : null;
    const asking=orgName ? ccClubAskPending(c.handle, orgName) : null;
    const bring=(orgName && f && c.org!==orgName && !(typeof ccMpOn==='function' && ccMpOn()) && asking)
      ? '<small class="ch-ro-clubno ch-ro-asking">'+esc(T.roClubWait(ccDayLabel(asking.due)))+'</small>'
      : (orgName && f && c.org!==orgName && !(typeof ccMpOn==='function' && ccMpOn()) && noUntil)
      ? '<small class="ch-ro-clubno">'+esc(T.roClubNoUntil(ccDayLabel(noUntil)))+'</small>'
      : (orgName && f && c.org!==orgName && !(typeof ccMpOn==='function' && ccMpOn()))
      ? '<button class="ch-ro-club" onclick="event.stopPropagation();ccOrgBringMate(\''+esc(String(c.handle).replace(/'/g, ''))+'\', '+f+')">'+esc(T.roClubAsk)+'</button>' : '';
    const ovr=Math.round(ccCardOvr(c)||a.ovr||c.rating||0);
    const u=photoURL(c);
    const meta=[ovr||'', T[a.roleKey]||'', c.org||''].filter(Boolean).map(x=>esc(String(x))).join(' · ');
    return '<span class="ch-ro-m"><span class="ch-ro-av">'+esc(String(c.handle||'?').slice(0,2).toUpperCase())+
      (u ? '<img src="'+u+'" alt="" loading="lazy" onerror="this.remove()">' : '')+'</span>'+
      '<span class="ch-ro-t"><b>'+(c.nat ? flagImg(c.nat, 13)+' ' : '')+esc(c.handle)+'</b><small>'+meta+'</small>'+bring+'</span></span>';
  };
  /* И спот (его слово 30.09: «spot может ещё там»): метка высадки на острове, где этот формат
     играет первым — сезонный остров или остров вечера (Reload и т.п., careerNightSpotKey). Клик —
     карта этого острова во вкладке, где живёт плитка спота. */
  let lastSpot=null;
  const spotOf=(f, day)=>{
    lastSpot=null;
    let key=null;
    try{
      const v=(day && typeof careerVictoryOn==='function') ? careerVictoryOn(day) : null;
      key=(f!==cur) ? ccFmtSpotKey(f, careerBrSet()) : careerSpotKey(careerBrSet());
      if(v && f!==cur && ((v.mode==='trio'?3:v.mode==='squad'?4:v.mode==='duo'?2:0)===f)) key=careerNightSpotKey({type:'victory', day:day});
    }catch(e){ key=null; }
    if(!key || key==='solo') return '';
    // Формат ещё не открыт — метку не поставить, пока не откроется сбор состава.
    { const from=(f!==cur) ? ccFmtOpenFrom(f) : null;
      if(from && !careerSpotList(key)[0]) return '<span class="ch-ro-spot ch-ro-spot-lock"><em>'+esc(T.roSpot)+'</em><i>'+esc(T.roSpotFrom(ccDayLabel(from)))+'</i></span>'; }
    const sp=careerSpotList(key)[0];
    const myth=sp ? (CC_MYTHIC_POI[careerSpotGrid(key)]||{})[sp.i] : null;
    const txt=sp ? esc(L().landingZoneSuffix(sp.i+1))+(myth ? ' · ⚡ '+esc(myth) : '') : '<i>'+esc(T.roSpotNone)+'</i>';
    const go='careerTab(\'me\');careerSpotOpenFor(\''+esc(key)+'\')';
    /* Картинкой справа (его скрин в Notion 8.10: «мб тут спот картинку где-то красиво написать» — справа в карточке
       было пусто). Кусок острова той же careerSpotShotHTML, что и в плитке «Своя точка», подпись поверх: зона крупно,
       под ней сила точки и мифическое место. Без метки — прежняя строка «поставить». */
    if(sp){
      const shot=careerSpotShotHTML(sp.i, key, 'ch-ro-shot', 16/7);
      // И аура (его слово 8.10: «может ауру и ещё что-то добавить туда») — та же полоса, что в «Своей точке»; плюс
      // сундуки на точке, где счёт настоящий (ccZoneChestsOf — fortnite.gg / вики / Kinch).
      const chests=ccZoneChestsOf(careerSpotGrid(key), sp.i);
      lastSpot={sp, key, chests, myth};
      if(shot) return '<div class="ch-ro-spotcard" onclick="'+go+'">'+shot+
        '<span class="ch-ro-spotcap"><em>'+esc(T.roSpot)+'</em><b>'+esc(L().landingZoneSuffix(sp.i+1))+'</b>'+
        (myth ? '<small>⚡ '+esc(myth)+'</small>' : '')+'</span></div>';
    }
    return '<span class="ch-ro-spot" onclick="'+go+'"><em>'+esc(T.roSpot)+'</em>'+txt+'</span>';
  };
  /* Далёкие пустые составы - одной строкой (22.11: в соло-сезоне три блока «пусто» подряд). Блоком остаётся текущий
     формат, формат с напарником и тот, сбор которого уже открыт (CC_ROSTER_WEEK). */
  const later=[];
  const blocks=[2,3,4].map(f=>{
    const next=ccFormatNext(f);
    if(f!==cur && !next) return '';
    const mates=cardsOf(f), need=f-1, full=mates.length>=need;
    const days=next ? ccDaysBetween(today, next) : 0;
    const soon=f!==cur && next && days<=CC_ROSTER_WEEK;
    if(f!==cur && !mates.length && !soon){ later.push(esc(NAME[f])+' <b>'+esc(ccDayLabel(next))+'</b>'); return ''; }
    const who=mates.length ? '<span class="ch-ro-ms">'+mates.map(c=>mateHTML(c, f)).join('')+'</span>' : '<b><i>'+esc(T.lfRosterEmpty)+'</i></b>';
    const when=f===cur ? esc(T.lfRosterNow) : esc(T.roFirst(ccDayLabel(next)));
    const act=(f===cur && !full) ? '<button onclick="ccDuoFindOpen(null)">'+esc(T.roFind)+'</button>'
            : (f!==cur && f>2 && ccMpOn()) ? (CC_MP_FMT_ON ? '<button onclick="ccDuoFindOpen(null, '+f+')">'+esc(full ? (T.roMpSwap||T.lfRosterAsk) : T.lfRosterAsk)+'</button>'+(!full && T.roMpFill ? '<small>'+esc(T.roMpFill(f-1-mates.length))+'</small>' : '') : '')   // онлайн: филлы на вечер (ccMpFmtBegin)
            : (soon && !full) ? '<button onclick="ccDuoFindOpen(null, '+f+')">'+esc(T.roGather)+'</button>'
            : (f!==cur && !full) ? '<small>'+esc(T.roWeek)+'</small>' : '';
    const spot=spotOf(f, next), card=spot.indexOf('ch-ro-spotcard')>=0;
    /* Цифры точки и пары — строками под напарником (его скрин в Notion 8.10: «мб добавить туда сундуки, ауру и тд» —
       под тиммейтом было пусто, а цифры лежали поверх картинки). Сундуки — настоящий счёт (ccZoneChestsOf), аура
       и сила точки — те же, что в «Своей точке», сыгранность — для формата, который играет сейчас. */
    let stats='';
    if(card && lastSpot){
      const ls=lastSpot, row=(k, v)=>'<span><em>'+esc(k)+'</em>'+v+'</span>';
      const parts=[];
      if(ls.chests!=null) parts.push(row(T.roChests, '<b>'+ls.chests+'</b>'));
      parts.push(row(T.roSpotPow, '<b>'+esc(careerSpotPointsOf(ls.sp.i, ls.key))+'</b>'));
      parts.push(row(T.ccSpotAuraRow, careerSpotAuraBarHTML(ls.sp.aura||0)));
      if(f===cur && mates.length && careerPartnerCard()){ const d=careerChemDays(), pct=Math.min(100, Math.round(d/CC_CHEM_DAYS*100));
        parts.push(row(T.ccChem, '<b>'+pct+'% · +'+careerChem()+'</b>')); }
      stats='<div class="ch-ro-stats">'+parts.join('')+'</div>';
      /* В колонке меню — миниатюрой справа от цифр (его слово 20.10: «может расширить красиво как-то ростеры, чтоб
         не листать»): полоса карты на всю ширину под каждым составом и уводила сборную за край. Большая карта
         остаётся на «Профиле», где широко; здесь та же точка тем же кликом, только маленькая. */
      stats='<div class="ch-ro-sx">'+stats+spot.replace('class="ch-ro-spotcard"', 'class="ch-ro-spotcard ch-ro-spotmini"')+'</div>';
    }
    return card
      ? '<div class="ch-ro has-spot'+(f===cur ? ' on' : '')+(soon ? ' soon' : '')+'"><div class="ch-ro-main"><em>'+esc(NAME[f])+' · '+when+'</em>'+who+stats+act+'</div>'+spot+'</div>'
      : '<div class="ch-ro'+(f===cur ? ' on' : '')+(soon ? ' soon' : '')+'"><em>'+esc(NAME[f])+' · '+when+'</em>'+who+spot+act+'</div>';
  }).filter(Boolean);
  // Соперник сезона - первой строкой составов (ccRivalHTML).
  { const rvh=ccRivalHTML(); if(rvh) blocks.unshift(rvh); }
  if(later.length) blocks.push('<div class="ch-ro ch-ro-later"><em>'+esc(T.roLater)+'</em><span>'+later.join('<i>·</i>')+'</span></div>');
  /* И сборная — Кубок наций (его слово 30.09: «и nation кап тоже там пусть будет, сборка состава»).
     Страна, ближайший этап, состав (пустые места капитана — «пусто»), у капитана за неделю до
     квалификации — «Собрать состав» (то же окно выбора, ccNatModalOpen). */
  try{
    const mine=(typeof ccNationsMine==='function') ? ccNationsMine() : null;
    const N=mine ? ccNatState() : null;
    const nd=mine ? ccNatNextDay() : null;
    // В лобби сборная — за три недели до своего этапа, не с первого дня сезона (27.10, «лобби как в Fortnite»).
    if(mine && nd && !N.finalDone && !(lobby && ccDaysBetween(today, nd)>CC_ROSTER_WEEK*3)){
      const days=ccNatDays(), qd=days.qual, dq=qd ? ccDaysBetween(today, qd) : 99;
      const others=(mine.squad||[]).filter((p,i)=>i>0);
      const chips=others.map(p=>p ? mateHTML(p) : '<span class="ch-ro-m"><span class="ch-ro-av">?</span><span class="ch-ro-t"><b><i>'+esc(T.lfRosterEmpty)+'</i></b></span></span>').join('');
      const needPick=typeof ccNatPickNeeded==='function' && ccNatPickNeeded();
      const act=(mine.captain && needPick && dq<=CC_ROSTER_WEEK) ? '<button onclick="ccNatModalOpen()">'+esc(T.roGather)+'</button>'
              : (mine.captain && needPick) ? '<small>'+esc(T.roWeek)+'</small>'
              : (!mine.inSquad && mine.seat==='trial' && !mine.trialDone) ? '<small>'+esc(T.roNatTrial)+'</small>' : '';
      const soon=mine.captain && needPick && dq<=CC_ROSTER_WEEK;
      blocks.push('<div class="ch-ro ch-ro-nat'+(soon ? ' soon' : '')+'"><em>'+flagImg(mine.nat, 12)+' '+esc(T.roNat)+(mine.captain ? ' · '+esc(T.roCaptain) : '')+' · '+esc(T.roFirst(ccDayLabel(nd)))+'</em>'+
        (chips ? '<span class="ch-ro-ms">'+chips+'</span>' : '')+act+'</div>');
    }
  }catch(e){}
  return blocks.length ? '<div class="ch-ros">'+blocks.join('')+'</div>' : '';
}
function careerProfileTileHTML(lobby){
  /* Только составы (его слово 30.09: «убери там вообще информацию о игроке, за которого играешь,
     она есть точь-в-точь такая же сверху»). Ник, фото, возраст, флаг, клуб и подписчики — в шапке
     карьеры; смена ника и фото — во вкладке «Профиль», под своей карточкой (ccMeEditHTML). */
  const ros=ccRostersStripHTML(lobby);
  return ros ? '<div class="ch-tile ch-tile-ros"><h4>'+esc(L().lfRosters)+'</h4>'+ros+'</div>' : '';
}
// Смена ника и фото — под своей карточкой во вкладке «Профиль».
function ccMeEditHTML(){
  const pl=CAREER.player;
  return `<div class="ch-me-edit ch-me-edit-card">
      ${pl.handle ? '' : `<button type="button" onclick="careerNickAsk()">${L().ccNickAsk}</button>`}
      <button type="button" onclick="careerPhotoPick()">${L().ccPhotoPick}</button>
      ${pl.photo ? `<button type="button" onclick="careerPhotoSet(null)">${L().ccPhotoClear}</button>` : ''}
      <input type="file" id="chPhotoInput" accept="image/*" style="display:none" onchange="careerPhotoChosen(this)">
    </div>`;
}
/* Плитка своей точки: где стоит метка, сколько на ней ауры и чем стоит переезд.

   Карта раскрывается прямо в плитке — той же сеткой и тем же артом, что и
   пикер в прогоне, чтобы «моя точка» на хабе и «моя точка» на высадке были
   одним и тем же прямоугольником, а не двумя разными представлениями. Сетка
   строится под дуо (squadSize сезона), потому что метка живёт в наборе, а не
   в дроблёной соло-сетке — см. careerSpotIndexOf. */
/* Кусок острова одной коробки. Отдельного арта у точек нет и рисовать его не
   из чего, поэтому это сама карта: background-size растягивает её так, чтобы
   коробка заняла окно, а background-position ставит её центр в центр окна.
   Проценты позиции считаются от «свободного хода» фона (100-w), иначе край
   острова уезжает — на крайних коробках это видно сразу. */
/* Отношение сторон кадра с куском острова и то, какую его долю занимает
   коробка. Живут здесь и в CSS одним числом: по ним считается зум, поэтому
   вёрстка и арифметика обязаны совпадать.

   Его образец, 23 августа (кроп вокруг Lifty Lodge, присланный в Notion):
   почти квадратный кадр, место занимает почти всё, название POI читается.
   Широкий 16/9 с коробкой в половину кадра давал не это — на нём POI терялся
   среди соседей. */
const CC_SPOT_SHOT_RATIO=4/3, CC_SPOT_SHOT_FILL=78;
function careerSpotShotHTML(i, set, cls, ratio){
  /* ratio — отношение сторон КАДРА, в котором картинка будет показана.
     Брать его из константы вслепую нельзя: кнопка выбора рисует широкий кадр
     (16/7), а зум, посчитанный под 4/3, оставлял сверху полосу пустоты —
     кадр вылезал за край карты. */
  const RATIO=ratio||CC_SPOT_SHOT_RATIO;
  // Ключ хранения может быть островом ('r12'), а сетка и картинка — у круга.
  const key=careerSpotGrid(set||careerBrSet());
  const z=(ZONE_SETS[key]||[])[i];
  if(!z) return '';
  const art=MAP_ART[key]||MAP_ART.m2;
  /* Насколько приближать — считается по обеим осям, иначе рамка не влезает.

     Две прошлые версии промахнулись каждая по-своему: первая тянула коробку
     во весь кадр (зум до шести) и остров превращался в мыло — карта всего
     около тысячи пикселей по ширине; вторая считала зум только по ширине, и
     на низком широком кадре рамка вылезала сверху и снизу, оставляя на
     картинке две вертикальные полосы вместо квадратика.

     Кадр теперь с фиксированным отношением сторон (CC_SPOT_SHOT_RATIO), и
     зум берётся такой, чтобы коробка заняла CC_SPOT_SHOT_FILL процентов кадра
     по той стороне, которая упирается первой — то есть почти весь кадр, как
     на его образце: место крупно, с названием POI, а не точка среди острова. */
  const ar=String(MAP_ASPECT[key]||'1100/970').split('/');
  const hOverW=(Number(ar[1])||970)/(Number(ar[0])||1100);
  const byW=CC_SPOT_SHOT_FILL/Math.max(z.w, 3);
  const byH=CC_SPOT_SHOT_FILL/(Math.max(z.h, 3)*hOverW*RATIO);
  const zoom=Math.max(1.2, Math.min(9, Math.min(byW, byH)));
  /* И на куске нарисован тот самый квадратик, который выбираешь, — правка. Ради него кадр устроен не фоном, а вложенным слоем:
     фон (background-position) умеет только двигать картинку, и посчитать в
     процентах кадра, где на нём оказалась коробка, нельзя — высота фона
     зависит от ширины плитки, которая в вёрстке неизвестна.

     Слой же — это сама карта целиком, растянутая в zoom раз, с собственным
     aspect-ratio острова. Внутри него координаты те же, что в ZONE_SETS, то
     есть рамка ставится ровно по z.x/z.y/z.w/z.h, а translate(-cx%,-cy%)
     подводит центр коробки к центру кадра: проценты в translate считаются от
     размера самого слоя, поэтому это работает при любой ширине плитки. */
  /* Куда смотрит кадр. Центр коробки — но не ближе к краю карты, чем половина
     видимого окна, иначе у береговых точек в кадр заезжает пустота: зона 18
     стоит у самого левого края, и первая версия рисовала слева чёрную
     полосу. Прижатый кадр показывает ту же коробку, просто не по центру —
     ровно так же ведёт себя любая карта, доехавшая до своего края. */
  const halfW=Math.min(50, 50/zoom);
  const halfH=Math.min(50, 50/(zoom*hOverW*RATIO));
  const cx=clamp(z.x+z.w/2, halfW, 100-halfW);
  const cy=clamp(z.y+z.h/2, halfH, 100-halfH);
  const asp=MAP_ASPECT[key]||'1100/970';
  return `<div class="cc-spot-shot${cls?' '+cls:''}">
    <div class="cc-spot-shot-map" style="width:${(zoom*100).toFixed(0)}%;aspect-ratio:${asp};
      background-image:url('${art}');
      transform:translate(${(-cx).toFixed(2)}%, ${(-cy).toFixed(2)}%);">
      <i class="cc-spot-shot-box" style="left:${z.x}%;top:${z.y}%;width:${z.w}%;height:${z.h}%;"></i>
    </div></div>`;
}
/* Аура полосой, как энергия — правка: «ауру сделай полосочку
   тип энергии». Устройство то же, что у полосы дня в шапке (.ch-en-bar):
   дорожка, заливка по доле и число справа, — только цвет свой, бирюзовый:
   жёлтый в этом интерфейсе уже занят энергией, и две жёлтые полосы читались бы
   как одна и та же величина. */
function careerSpotAuraBarHTML(a){
  const pct=Math.round(clamp(a/CC_SPOT_AURA_MAX, 0, 1)*100);
  return `<span class="cc-aura-row"><span class="cc-aura-bar${a?'':' out'}">`+
    `<i style="width:${pct}%"></i></span>`+
    `<b class="${a?'':'cc-aura-none'}">${a}</b></span>`;
}
// Остров целиком, миниатюрой: тем же кадром, что и вырезка точки, только
// карта не приближена — видно, куда именно откроется выбор.
function careerIslandThumbHTML(set, cls, mark){
  // Ключ хранения может быть островом ('r12'), а сетка и картинка — у круга.
  const key=careerSpotGrid(set||careerBrSet());
  const art=MAP_ART[key]||MAP_ART.m2;
  // mark — номер коробки в сетке острова: на миниатюре ставится её рамка, так
  // видно, где твоя точка на всём острове (заголовок вопроса о высадке).
  const z=mark!=null ? (ZONE_SETS[key]||[])[mark] : null;
  const box=z ? `<i class="cc-spot-shot-box" style="left:${z.x}%;top:${z.y}%;width:${z.w}%;height:${z.h}%;"></i>` : '';
  return `<div class="cc-spot-shot${cls?' '+cls:''}">
    <div class="cc-spot-shot-map" style="width:100%;aspect-ratio:${MAP_ASPECT[key]||'1100/970'};
      background-image:url('${art}'); transform:translate(-50%, -50%);">${box}</div></div>`;
}
// Место живой коробки в сетке острова (ZONE_SETS): сетка вечера бывает урезана
// под лобби, и своего номера у коробки нет — ищется по координатам.
function ccZoneGridIndex(zone, set){
  if(!zone) return -1;
  const key=careerSpotGrid(set||careerBrSet());
  return (ZONE_SETS[key]||[]).findIndex(z=>Math.abs(z.x-zone.x)<0.01 && Math.abs(z.y-zone.y)<0.01);
}
// Картинки заголовка вопроса о высадке: слева своя точка, справа остров с её
// рамкой. Без дома — ничего: показывать нечего.
function ccDropSideHTML(home, set){
  const at=ccZoneGridIndex(home, set);
  if(at<0) return null;
  return {left:careerSpotShotHTML(at, set, '', 1), right:careerIslandThumbHTML(set, '', at)};
}
// Чего стоит лут коробки — теми же очками, что видит пикер на высадке.
function careerSpotPointsOf(i, set){
  const p=careerSpotPowOf(i, set);
  return p==null ? '-' : L().landingPoints(p);
}
/* Сила, которую точка даёт команде на вечер (applyLandingPow: очки точки идут в силу
   один к одному). null — точки нет на загруженном острове. */
function careerSpotPowOf(i, set){
  // Ключ хранения может быть островом ('r12'), а сетка и картинка — у круга.
  const key=careerSpotGrid(set||careerBrSet());
  if(!(ZONE_SETS[key]||[])[i]) return null;
  /* Считается по САМОМУ острову, а не по загруженному в игру: выбор спота открывает и
     острова других сезонов, и там подпись силы была только у мифических точек (скрин
     Notion «29», Chapter 5 S1 — у обычных коробок голый номер). */
  return zonePointsOfSet(key)[i];
}
/* Сила каждой коробки острова — то же правило, что в useLandingSet: место в рейтинге
   своего острова даёт 1..LANDING_POINTS_MAX, мифическая точка — максимум плюс CC_MYTHIC_POW. */
const ZONE_POINTS_CACHE={};
function zonePointsOfSet(set){
  if(ZONE_POINTS_CACHE[set]) return ZONE_POINTS_CACHE[set];
  const stats=ZONE_STATS[set]||[];
  const rs=(ZONE_SETS[set]||[]).map((z,i)=>{ const r=(stats[i]||{}).r; return r!=null ? r : z.r; });
  const rated=rs.filter(v=>v!=null).sort((a,b)=>a-b);
  const myth=CC_MYTHIC_POI[set]||{};
  return ZONE_POINTS_CACHE[set]=rs.map((r,i)=>{
    if(myth[i]) return LANDING_POINTS_MAX+CC_MYTHIC_POW;
    if(r==null || !rated.length) return 1;
    const pct=rated.filter(v=>v<r).length/rated.length;
    return Math.max(1, Math.min(LANDING_POINTS_MAX, 1+Math.floor(pct*LANDING_POINTS_MAX)));
  });
}
/* Острова, на которых у карьеры может быть дом.

   Не один: год играется не только на карте сезона. Релоад — свой круг со
   своими островами, и метка там нужна ровно так же — правка:
   «ещё для релоад карты нужно добавить». Их четыре, потому что четыре сетки:
   арт у кубков 1-2 и 3-4 общий (map-reload-a и -b), но ZONE_SETS у каждого
   свой — от двенадцати боксов до пятнадцати, — и метка привязана к сетке, а
   не к картинке.

   Карта сезона идёт первой и подписана сезоном, а не ключом: игрок знает
   «этот год», а не «m2». */
/* Карт под дом ровно три, и это те три, что он назвал 24 августа: «1 сезон —
   выбрать локацию; 2 — выбрать локацию на релоад 1-2, там одна карта, Слюрпи;
   3-4 — локация на карте Стронгхолд».

   Кругов Релоада четыре, а островов у них два: первый и второй играются на
   одном, третий и четвёртый на другом. Раньше плитка предлагала пять карт на
   три спота — то есть предлагала выбрать между первым и вторым кругом, хотя
   это одна и та же карта, и дом на ней один. Теперь острова и есть строки:
   три карты, три дома, выбирать не из чего — и это ровно то, что он описал.

   key — ключ хранения (остров), grid — сетка, по которой рисуется карта:
   у круга своя опубликованная дроп-карта, и показывать надо какую-то одну. */
// Какие ключи Reload-меток нужны году: по вечерам его календаря (careerNightSpotKey). Кэш на год.
let _CC_RELOAD_SPOT_KEYS={};
function ccYearReloadSpotKeys(){
  const y=ccCalYear();
  if(_CC_RELOAD_SPOT_KEYS[y]) return _CC_RELOAD_SPOT_KEYS[y];
  const out={};
  if(y>=2026){ out.r12=true; out.r34=true; }
  try{
    careerYearDays().forEach((list, d)=>list.forEach(e=>{
      const k=careerNightSpotKey({type:e.kind, day:d, id:e.id, title:e.title});
      if(k==='r12' || k==='r34') out[k]=true;
    }));
  }catch(e){ return out; }
  return (_CC_RELOAD_SPOT_KEYS[y]=out);
}
// Ключ спота формата на острове: 'f3@m1'. См. careerSpotSets.
/* Метка формата открывается вместе со сбором состава (его слово 8.10: «метку на карте можно поставить тогда, когда
   тиммейта искать можно будет — трио, например, в начале сезона можно поставить, хотя турниров ещё долго не будет»):
   за CC_ROSTER_WEEK дней до первого вечера формата, как кнопка «Собрать состав». Текущий формат открыт всегда. */
function ccFmtOpenFrom(f){
  if(f===careerSquadSize()) return null;
  const next=(typeof ccFormatNext==='function') ? ccFormatNext(f) : null; if(!next) return null;
  const from=ccAddDays(next, -CC_ROSTER_WEEK);
  return careerToday()>=from ? null : from;
}
function ccFmtSpotKey(f, isl){ return 'f'+f+'@'+(isl||careerBrSet()); }
function ccIsFmtSpotKey(k){ return /^f[234]@/.test(String(k||'')); }
function careerSpotSets(){
  const out=[{key:careerBrSet(), grid:careerBrSet(), label:L().ccSpotSeasonTab}];
  /* Карты Reload под метку — в тот год, где у карьеры есть вечера на них. Стояло «только
     2026-й»: тогда в 2024/2025 Reload-вечеров не было, а с архивом капов они пришли
     (S31 Reload Cash Cup, S37 Reload Quick Cup, Cracked Cup) — и окно «поставь метку»
     открывало карту, которой нет в списке. Отзыв 30.09: «доходишь до турниров в релоуде —
     не можешь поставить метку на карте». */
  const rk=ccYearReloadSpotKeys();
  if(ZONE_SETS.r1 && rk.r12) out.push({key:'r12', grid:'r1', label:L().ccSpotReloadA});
  if(ZONE_SETS.r3 && rk.r34) out.push({key:'r34', grid:'r3', label:L().ccSpotReloadB});
  /* Четвёртая карта — СОЛО. Отзыв: «карты почему-то 3, до сих
     пор нет 4 для соло». Solo Series не командный турнир: точка на нём у
     каждого своя, хранится лично (cr.soloSpots, не ключ команды) и в три
     командных слота не считается. Остров — сезонный.

     ДО 2 СЕНТЯБРЯ ЭТА КАРТА БЫЛА ТОЛЬКО В КОМАНДЕ, и это была дыра: в
     одиночной карьере соло-вечер садился на общий сезонный дом — тот же, что
     дуо-турниры, — и выбрать под соло отдельную метку было негде. Правка:
     «чтоб можно было выбрать метку на карте в соло и дуо карьере». Личное
     хранение при этом ни при чём: в одиночной карьере личное и командное — это
     один человек, а вот ТУРНИР другой, и точка на нём своя. */
  // Остров — сезонный в дуо-год, ближайшего соло-вечера в трио-год: см. careerSoloSet.
  out.push({key:'solo', grid:careerSoloSet(), label:L().ccSpotSoloTab});
  /* Споты форматов (его слово 30.09: «споты пишет, в career сквада и трио нет почему-то»): трио- и
     сквад-капы в дуо-год (и дуо-капы в трио-год) садились на сезонный дом. Свой ключ на формат и
     остров — 'f3@m1': командный склад (cr.spots, общий в игре вдвоём), слотов не занимает. */
  try{
    const isl=careerBrSet(), cur=careerSquadSize(), NAME={2:L().lfRosterDuo, 3:L().lfRosterTrio, 4:L().lfRosterSquad};
    // И сегодняшний турнир по приглашению (Notion 27.10, скрин 16: сквад-LAN «Lost Legends» в дуо-год — ccFormatNext
    // приглашения пропускает, вкладки не было, и окно метки звало на карту «» без выхода).
    const vt=typeof careerVictoryOn==='function' ? careerVictoryOn(careerToday()) : null, MODE={2:'duo', 3:'trio', 4:'squad'};
    [2,3,4].forEach(f=>{ if(f!==cur && ((typeof ccFormatNext==='function' && ccFormatNext(f) && !ccFmtOpenFrom(f)) || (vt && vt.mode===MODE[f]))) out.push({key:ccFmtSpotKey(f, isl), grid:isl, label:NAME[f]}); });
  }catch(e){}
  /* Метка сборной на Кубок наций — своя (cr.natSpots), на сезонном острове, в командные слоты не
     считается; карта рисуется под сквады (ccSquadKeep). Появляется, пока висит карточка сборной.
     Отзыв: «где команда сборной, должен быть выбор локации». */
  if(typeof ccNatCardOn==='function' && ccNatCardOn()) out.push({key:'nations', grid:careerBrSet(), squad:true, label:L().ccSpotNationsTab});
  return out;
}
function careerSpotStore(key){
  const cr=CAREER && CAREER.career;
  if(!cr) return {};
  if(key==='solo'){
    /* Соло-метка — на каждом острове своя, как командные (cr.spots по набору):
       остров под соло-вкладкой меняется вместе с сезоном (m1 → m2 → s42, см.
       careerSoloSet), а одна запись на все острова читалась бы по координатам
       на чужой сетке — не той коробкой или никакой. Склад: cr.soloSpots[остров]
       = {solo:[…]}. Старый формат cr.soloSpots.solo (до 16.09) переезжает на
       текущий остров — на каком его ставили, сейв не помнит. */
    if(!cr.soloSpots) cr.soloSpots={};
    const isl=careerSoloSet();
    if(cr.soloSpots.solo){
      if(!cr.soloSpots[isl]) cr.soloSpots[isl]={solo:cr.soloSpots.solo};
      delete cr.soloSpots.solo;
    }
    if(!cr.soloSpots[isl]) cr.soloSpots[isl]={};
    return cr.soloSpots[isl];
  }
  if(key==='nations'){
    if(!cr.natSpots) cr.natSpots={};
    const isl=careerBrSet();
    if(!cr.natSpots[isl]) cr.natSpots[isl]={};
    return cr.natSpots[isl];
  }
  return careerSpots();
}
// Сетка, по которой рисуется остров под этим ключом хранения.
function careerSpotGrid(key){
  if(ccIsFmtSpotKey(key)) return String(key).split('@')[1];
  const s=careerSpotSets().find(x=>x.key===careerSpotKey(key));
  return (s && s.grid) || careerSpotKey(key);
}
let CC_SPOT_OPEN=false, CC_SPOT_PEEK=null, CC_SPOT_SET=null;
// Какой остров сейчас показывает плитка. По умолчанию — тот, на котором
// играется сезон; если сохранённый ключ устарел (год сменил карту), молча
// возвращаемся к сезонному.
function careerSpotShown(){
  const sets=careerSpotSets();
  return (CC_SPOT_SET && sets.some(s=>s.key===CC_SPOT_SET)) ? CC_SPOT_SET : sets[0].key;
}
// Открыть карту нужного острова прямо с его прямоугольника — и вернуться в
// плитку, как только лока выбрана (careerSpotChoose закрывает карту сам).
function careerSpotOpenFor(key){
  CC_SPOT_SET=key; CC_SPOT_PEEK=null; CC_SPOT_OPEN=true;
  careerRenderHub(CH_TAB);
}
function careerSpotToggle(){ CC_SPOT_OPEN=!CC_SPOT_OPEN; CC_SPOT_PEEK=null; careerRenderHub(CH_TAB); }
// Клик по коробке сперва показывает её, а переезжает вторая кнопка: переезд
// жжёт ауру, и делать это одним промахом по карте нельзя.
function careerSpotPeek(i){ CC_SPOT_PEEK=(CC_SPOT_PEEK===i?null:i); careerRenderHub(CH_TAB); }
function careerSpotTileHTML(){
  if(!CAREER || !CAREER.career || careerRetired()) return '';
  const set=careerSpotShown();
  // Показанный остров и сетка, по которой он рисуется, — разные ключи: у
  // Релоада один остров на два круга, а дроп-карта у каждого своя.
  const gridKey=careerSpotGrid(set);
  const grid=ZONE_SETS[gridKey]||[];
  const stats=ZONE_STATS[gridKey]||[];
  const s=careerSpotOn(set);
  const aura=careerSpotAura(set);
  /* Вкладок-чипов над плиткой больше нет — правка (скрин с
     обведёнными RELOAD 1/2/4): «пусть тут название карт над прямоугольниками,
     нажимаешь на прямоугольник — можешь сменить локу». Название карты стоит
     над своим прямоугольником, и он же кнопка: клик открывает карту этого
     острова, выбор возвращает обратно в плитку. */
  const head=`<h4>${L().ccSpotTitle}</h4>`;
  if(!CC_SPOT_OPEN){
    /* Три спота — три карточки, и каждая на своей карте: карта, коробка,
       квадратик и своя аура. Пустые показываются тоже, чтобы было видно,
       сколько домов ещё можно поставить и что карт в году больше, чем
       спотов, — выбирать приходится. */
    /* Карт три и спотов три, поэтому строка плитки — это просто список карт:
       занятая показывает дом, свободная — свободный слот. И то и другое
       нажимается и открывает СВОЮ карту.

       Правка: «пусть игрок сам нажмёт на квадратик, где
       написано, что слот свободен, и он выберет просто локацию». До неё
       пустой квадрат был картинкой, а звала на карту отдельная строка кнопок
       под рядом — то есть нажимать надо было не туда, куда смотришь. Строку
       убрал: она называла ровно те же карты, что пустые квадраты, и теперь
       дублировала бы их. */
    const cards=careerSpotSets().map(t=>{
      const sp=careerSpotList(t.key)[0];
      if(!sp)
        return `<div class="cc-spot-card cc-spot-card-empty"
          onclick="careerSpotOpenFor(\'${t.key}\')" title="${esc(L().ccSpotPickHere)}">
          <b class="cc-spot-card-map">${t.label}</b>
          <span>+</span><em>${L().ccSpotSlotFree}</em></div>`;
      const a=sp.aura||0;
      return `<div class="cc-spot-card" onclick="careerSpotOpenFor(\'${t.key}\')"
        title="${esc(L().ccSpotChange)}">
        <b class="cc-spot-card-map">${t.label}</b>
        ${careerSpotShotHTML(sp.i, t.key)}
        <div class="cc-spot-card-in">
          <span class="cc-spot-card-zone">${L().landingZoneSuffix(sp.i+1)}${
            (CC_MYTHIC_POI[careerSpotGrid(t.key)]||{})[sp.i] ? ' · ⚡ '+esc(CC_MYTHIC_POI[careerSpotGrid(t.key)][sp.i]) : ''}</span>
          ${careerSpotAuraBarHTML(a)}
        </div></div>`;
    });
    const used=careerSpotUsed();
    return `<div class="ch-tile">${head}
      <div class="cc-spot-cards">${cards.join('')}</div>
      <div class="ch-row"><em>${L().ccSpotSlotsRow}</em><b>${used}/${CC_SPOT_SLOTS}</b></div>
      <div class="ch-hint">${aura ? L().ccSpotAuraOn(aura) : L().ccSpotAuraNone}</div>
      <!-- Имя видно там же, где аура: иначе прибавка за гранд-финал и слот на
           LAN работала бы молча, а игрок читал бы «пока никто не знает, чьё это
           место» ровно в тот вечер, когда его дом обходят. -->
      ${careerRenown() ? `<div class="ch-hint">${L().ccSpotRenown(careerRenown())}</div>` : ''}
      <div class="ch-hint">${L().ccSpotHow}</div></div>`;
  }
  const art=MAP_ART[gridKey]||MAP_ART.m2;
  const asp=MAP_ASPECT[gridKey]||'1100/970';
  /* Картинка выбранной коробки — просьба: «пусть будет
     картинка когда выбираешь локу в карьере». Отдельного арта у точек нет и
     взять негде, поэтому это сама карта, увеличенная и сдвинутая так, чтобы в
     окне стоял именно этот прямоугольник: background-size в процентах от
     размера окна и background-position по центру коробки. Настоящий кусок
     острова, а не иконка — видно, куда садишься. */
  const list=careerSpotList(set);
  const slotOf=i=>list.findIndex(x=>x.i===i);
  const peek=CC_SPOT_PEEK!=null ? grid[CC_SPOT_PEEK] : null;
  /* Что предлагает превью. На своей коробке — снять дом. На чужой: если на
     этой карте дом уже стоит, это переезд внутри карты и он жжёт её ауру;
     если карта пустая, нужен свободный спот, а когда все три заняты —
     предлагаем освободить одну из других карт, называя её и её ауру. */
  const peekBtns=(()=>{
    if(CC_SPOT_PEEK==null) return '';
    const at=slotOf(CC_SPOT_PEEK);
    if(at>=0) return `<button class="ch-decline" onclick="careerSpotDrop()">${
      L().ccSpotDrop}</button>`;
    if(list.length || careerSpotRoom(set))
      return `<button class="ch-sign" onclick="careerSpotChoose(${CC_SPOT_PEEK})">${
        list.length ? L().ccSpotMove : L().ccSpotTake}</button>`;
    return `<div class="ch-hint">${L().ccSpotNoRoom}</div>`+
      careerSpotSets().filter(t=>careerSpotList(t.key).length)
        .map(t=>{ const sp=careerSpotList(t.key)[0];
          return `<button class="ch-sign cc-spot-swap"
            onclick="careerSpotFree('${t.key}', ${CC_SPOT_PEEK})">${
            L().ccSpotFreeUp(t.label, sp.aura||0)}</button>`; }).join('');
  })();
  const peekHTML=peek
    ? `<div class="cc-spot-peek">${careerSpotShotHTML(CC_SPOT_PEEK, set)}
        <div class="cc-spot-peek-in">
          <b>${L().landingZoneSuffix(CC_SPOT_PEEK+1)}</b>
          <div class="ch-row"><em>${L().ccSpotLoot}</em><b>${
            careerSpotPointsOf(CC_SPOT_PEEK, set)}</b></div>
          ${(CC_MYTHIC_POI[gridKey]||{})[CC_SPOT_PEEK] ? `<div class="ch-row cc-spot-mythic-row"><em>⚡ ${
            L().ccRaritymythic}</em><b>${esc(CC_MYTHIC_POI[gridKey][CC_SPOT_PEEK])}</b></div>
            <div class="cc-spot-drops">${ccMythicDrops(gridKey, CC_MYTHIC_POI[gridKey][CC_SPOT_PEEK]).map(d=>
              `<span><img class="zp-ic${d.med?' zp-med':''}" src="${d.src}" alt="" decoding="async">${esc(d.n)}</span>`).join('')}</div>` : ''}
          ${peekBtns}
        </div></div>`
    : `<div class="ch-hint">${L().ccSpotTap}</div>`;
  /* Мифические POI (CC_MYTHIC_POI) подписаны и здесь: отзыв 29.09 «когда выбираешь
     спот не показывает» — на карте вечера молния с боссом была, а в выборе дома
     стоял голый номер коробки. И сквадный набор их не теряет (ccKeepMythic). */
  const myth=CC_MYTHIC_POI[gridKey]||{};
  const keepSq=(careerSpotSets().find(t=>t.key===set)||{}).squad
    ? new Set([...ccSquadKeep(gridKey), ...Object.keys(myth).map(Number)]) : null;
  const boxes=grid.map((z,i)=>{
    if(keepSq && !keepSq.has(i)) return '';
    const at=slotOf(i);
    const mine=at>=0;
    // На коробке только молния: имя в узкой подписи режется в «11 · …», полностью оно в превью.
    const boss=myth[i] ? (ccMythicIconsHTML(gridKey, myth[i]) || ' ⚡') : '';
    // Сколько силы даёт коробка — числом рядом с номером («11 · +7»), слово «сила» в превью.
    const pw=careerSpotPowOf(i, set);
    const powTag=pw!=null ? ' · '+L().landingPoints(pw) : '';   // «4 · +3 силы» — видно, что это сила
    return `<div class="land-zone${mine?' cc-spot-mine':''}${CC_SPOT_PEEK===i?' cc-spot-peeked':''}${myth[i]?' cc-spot-mythic':''}"
      title="${L().landingZoneSuffix(i+1)}"
      onclick="careerSpotPeek(${i})"
      style="left:${z.x}%;top:${z.y}%;width:${z.w}%;height:${z.h}%;${
        mine?'border-color:var(--accent);box-shadow:inset 0 0 0 1px rgba(0,0,0,.55),0 0 0 2px rgba(0,208,168,.35);'
            :'border-color:rgba(10,10,10,.75);background:transparent;'}"><div
      class="land-zone-label"${mine?' style="color:var(--accent);font-weight:900;"':''}>${
      (mine ? L().ccSpotTag(list[at].aura||0) : (i+1))+powTag+boss}</div>${ccChestBadgeHTMLAt(gridKey, i)}</div>`;
  }).join('');
  // Открытая карта называет себя: сюда попадают кликом по прямоугольнику, и
  // без подписи не видно, чей это остров.
  const mapName=(careerSpotSets().find(t=>t.key===set)||{}).label||'';
  return `<div class="ch-tile">${head}
    <div class="cc-spot-open-head"><b>${mapName}</b>
      <span>${L().ccSpotHint}</span></div>
    <div class="map-frame cc-spot-map" style="position:relative;width:100%;aspect-ratio:${asp};border-radius:8px;
         background:#000;border:1px solid var(--line);overflow:hidden;margin-top:8px;">
      <img src="${art}" alt="" decoding="async"
           style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;">
      <div style="position:absolute;inset:0;">${boxes}</div>
      ${ccChestToggleHTML()}
    </div>
    ${peekHTML}
    <button class="ch-decline" onclick="careerSpotToggle()">${L().ccSpotBack}</button></div>`;
}
/* Клик по коробке. Переезд жжёт ауру, поэтому он спрашивает — и спрашивает
   только тогда, когда есть что терять: первая метка и возврат на своё же
   место ставятся молча. */
/* Поставить дом на этой карте. Пустая карта при свободном споте берётся
   молча; переезд внутри карты спрашивает и называет ауру, которая сгорит. */
function careerSpotChoose(i){
  const set=careerSpotShown();
  const old=careerSpotList(set)[0];
  if(old && old.i===i) return;
  // Выбрал — и сразу назад в карьеру, к прямоугольникам: отзыв, «когда
  // меняешь локу сразу возвращает в карьеру и можешь с другими то же самое».
  const done=()=>{ careerSpotSet(i, set); CC_SPOT_PEEK=null; CC_SPOT_OPEN=false;
                   careerRenderHub(CH_TAB); };
  if(old && (old.aura||0)>0) ccAsk(L().ccSpotMoveAsk(old.aura), done);
  else done();
}
// Снять дом с этой карты — спот возвращается в общий запас.
function careerSpotDrop(){
  const set=careerSpotShown();
  const sp=careerSpotList(set)[0];
  if(!sp) return;
  const done=()=>{ careerSpotClear(set); CC_SPOT_PEEK=null; CC_SPOT_OPEN=false;
                   careerRenderHub(CH_TAB); };
  if((sp.aura||0)>0) ccAsk(L().ccSpotDropAsk(sp.aura), done);
  else done();
}
/* Освободить спот на ДРУГОЙ карте и тут же занять коробку на этой. Нужен,
   когда все три заняты: иначе игрок должен был бы сам догадаться сходить на
   ту карту и снять дом там. */
function careerSpotFree(from, i){
  const to=careerSpotShown();
  const sp=careerSpotList(from)[0];
  const done=()=>{ careerSpotClear(from); careerSpotSet(i, to);
                   CC_SPOT_PEEK=null; CC_SPOT_OPEN=false; careerRenderHub(CH_TAB); };
  if(sp && (sp.aura||0)>0) ccAsk(L().ccSpotDropAsk(sp.aura), done);
  else done();
}
function careerAgentTileHTML(){
  const on=careerAgent();
  if(on){
    const t=careerAgentTerms();
    // The face off the roster, the terms off the contract. See ccAgentFace.
    const f=ccAgentFace(on);
    return `<div class="ch-tile ch-tile-agent">
      <h4>${L().ccAgentTag}</h4>
      <div class="ch-orghead"><span class="ch-agent-av">${
        f.photo ? `<img src="${PHOTO_DIR}${esc(f.photo)}" alt="" onerror="this.remove()">` : ''}${
        esc(String(on.name||'').slice(0,2).toUpperCase())}</span><b>${esc(on.name)}</b>${
        f.at ? `<em class="ch-agent-at">@${esc(f.at)}</em>` : ''}</div>
      <div class="ch-row"><em>${L().ccAgentCutRow}</em><b>${Math.round(t.cut*100)}%</b></div>
      <div class="ch-row"><em>${L().ccAgentReachRow}</em><b class="ch-goal-met">+${t.reach}</b></div>
      <div class="ch-row"><em>${L().ccAgentWageRow}</em><b class="ch-goal-met">+${
        Math.round((t.wage-1)*100)}%</b></div>
      <div class="ch-row"><em>${L().ccAgentPaid}</em><b>$${
        ccNum((CAREER.career.agentPaid||0))}</b></div>
      <!-- Просьба найти клуб — с плитки, а не только из переписки. Правка: «пусть у менеджера будет кнопка, чтоб игрок запросил офер
           у орги, и это сообщение автоматически пишется в лс менеджеру». Пока
           просьба в работе — вместо кнопки строка о том, до какого числа он
           ходит; так же, как в самом диалоге. -->
      ${careerPitchOn()
        ? `<div class="ch-row"><em>${esc(careerPitchClub()||'')}</em><b>${
            L().ccPitchOn(ccDayLabel(careerPitchDue()))}</b></div>`
        : (careerPitchClubs().length
            ? `<button class="ch-swap" title="${esc(L().ccPitchWhat)}"
                onclick="careerPitchAsk()">${L().ccPitchBtn}</button>`
            : '')}
      <button class="ch-decline" onclick="careerEndAgent()">${L().ccAgentEnd}</button>
    </div>`;
  }
  const ovr=CAREER.player.ovrExact!=null ? CAREER.player.ovrExact : CAREER.player.ovr;
  const waiting=careerDms().find(t=>t.who && t.who.agent);
  return `<div class="ch-tile ch-tile-agent">
    <h4>${L().ccAgentTag}</h4>
    <div class="ch-empty">${waiting ? L().ccAgentWrote
      : ovr<CC_AGENT_FROM ? L().ccAgentFrom(CC_AGENT_FROM) : L().ccAgentNone}</div>
    <button class="ch-swap" onclick="ccAgentPickOpen()">${L().ccAgentSee}</button>
  </div>`;
}
/* Плитка команды: кто в лобби и как оттуда выйти.

   Показывается только то, что напарнику и так видно по спеке: ник, флаг,
   овер, роль. Деньги, контракт и инбокс — личное, и в плитку не попадают.
   Код лобби здесь же, потому что он и есть приглашение: аккаунтов в режиме
   нет, код пересылается как угодно. Сторож — tools/check-mp-tile.js. */
function careerMpTileHTML(){
  if(!ccMpOn()){
    // Команду завести не вышло — плитка всё равно стоит и говорит почему. См. ccMpEnter.
    if(!CC_MP_FAIL) return '';
    return `<div class="ch-tile ch-tile-org">
      <h4>${L().ccMpTitle}</h4>
      <div class="ch-row"><em>${L().ccMpLink}</em><b>${L().ccMpFailLink}</b></div>
      <div class="ch-empty">${esc(CC_MP_FAIL.role==='b'
        ? L().ccMpFailJoin(CC_MP_FAIL.code) : L().ccMpFailNew)}</div>
      <button class="ch-sign" onclick="ccMpRetry()">${L().ccMpRetry}</button>
      <button class="ch-decline" onclick="ccMpFailOff()">${L().ccMpFailOff}</button>
    </div>`;
  }
  const peer=(typeof MP!=='undefined' && MP.peer) || null;
  const code=CAREER.career.mp.code;
  // Связь — первой строкой: пока её нет, всё остальное на плитке не значит
  // ничего, потому что вечер не начнётся. См. ccMpWhy.
  const why=ccMpWhy();
  return `<div class="ch-tile ch-tile-org">
    <h4>${L().ccMpTitle}</h4>
    <div class="ch-row"><em>${L().ccMpLink}</em><b class="${why?'':'ch-goal-met'}">${
      why || L().ccMpLive}</b></div>
    <div class="ch-row"><em>${L().ccMpCode}</em><b>${esc(code)}</b></div>
    ${ccMpInviteHTML(code)}
    ${peer
      ? `<div class="ch-orghead">${flagImg(peer.nat,15)}<b>${esc(peer.handle||'')}</b></div>
         <div class="ch-row"><em>${L().ccResPartner}</em><b>${peer.ovr||0}</b></div>
         <div class="ch-row"><em>${L().ccRole}</em><b>${esc(L()[peer.role]||peer.role||'')}</b></div>`
      : `<div class="ch-empty">${L().ccMpAlone}</div>`}
    <!-- Кого можно брать в это кресло. В дуо — никого, кресло напарника; в
         трио открыто одно кресло для взятого, и он общий. Правила его. См. careerSeatDm и ccMpBotSeats. -->
    <div class="ch-hint" style="margin:0;">${
      ccMpBotSeats()>0 ? L().ccMpThirdOk : L().ccMpOnlyMate}</div>
    <button class="ch-decline" onclick="careerPartAsk()">${L().ccMpPart}</button>
  </div>`;
}
function careerOrgTileHTML(){
  const org=CAREER.org, offers=CAREER.offers||[];
  /* СВОЯ ОРГАНИЗАЦИЯ — ЭТО НЕ КОНТРАКТ. Зарплата, доля, бонус, задача сезона и отступные
     существуют между игроком и клубом, который его нанял; со своим клубом их нет ни
     одной, и строки с нулями и прочерками врали бы про него. Плитка говорит то, что
     правда: чей герб, сколько людей и сколько в кассе, — а управление там же, где его
     построили, в магазине (careerClubHTML). */
  if(org && org.own){
    const club=careerClub();
    const T=L();
    return `<div class="ch-tile ch-tile-org">
      <h4>${T.ccOrg}</h4>
      <div class="ch-orghead">${careerCrestImg(org.name,30)}<b>${esc(org.name)}</b></div>
      <div class="ch-row"><em>${T.ccClubTitle}</em><b>${T.ccClubOwn}</b></div>
      ${club ? `<div class="ch-row"><em>${T.ccClubSeats(careerClubSeats(), CC_CLUB_SEATS)}</em><b></b></div>
      <div class="ch-row"><em>${T.ccClubCash}</em><b>$${ccNum(Math.round(club.cash||0))}</b></div>` : ''}
      <div class="ch-hint">${T.ccClubWhere}</div>
    </div>`;
  }
  /* КОМПАКТНАЯ ПЛИТКА КЛУБА (его Notion 8.10: «уменьшить организацию, чтоб стафф выглядел выше, и улучши дизайн орги»):
     было 13 строк и две кнопки во всю ширину — штаб уезжал за экран. Теперь шапка (герб, название, состав, подписчики),
     четыре ячейки главного (зарплата, доля клуба, задача, цель месяца), остальное — в «Подробнее», кнопки — в строку. */
  if(org){
    const T=L(), met=careerOrgGoalMet(), f=ccOrgFollowers(org.name, org.tier);
    const cell=(k, v, ok)=>'<span class="cc-orgc-cell'+(ok ? ' ok' : '')+'"><small>'+k+'</small><b>'+v+'</b></span>';
    const g=careerMonthGoal(), gOk=g && (g.paid||careerMonthGoalMet());
    const cost=careerBuyoutCost(), can=(CAREER.career.balance||0)>=cost;
    const row=(k, v)=>'<div class="ch-row"><em>'+k+'</em><b>'+v+'</b></div>';
    return `<div class="ch-tile ch-tile-org cc-orgc">
      <h4>${T.ccOrg}</h4>
      <div class="cc-orgc-head"><span class="cc-orgc-crest">${careerCrestImg(org.name, 52)}</span>
        <span class="cc-orgc-id"><b>${esc(org.name)}</b><small>${org.academy ? T.ccAcademy : T.ccMainRoster} · 👥 <span title="${f.est ? esc(T.ccOrgFansEst) : ''}">${ccOrgFolText(f)}</span></small></span>
        ${org.perk ? `<em class="ch-perk">${T['ccPerk'+org.perk]}</em>` : ''}</div>
      <div class="cc-orgc-cells">
        ${cell(T.ccWage, ccMoney(org.salary)+T.ccPerSeason)}
        ${cell(T.ccOrgCutRow, careerOrgCut() ? Math.round(careerOrgCut()*100)+'%' : '-')}
        ${cell(T.ccGoal, careerOrgGoalText(org.goal)+(met ? ' ✓' : ''), met)}
        ${g ? cell(T.ccMgTitle, careerMonthGoalText(g)+(g.bonus ? ' · '+ccMoney(g.bonus) : '')+(gOk ? ' ✓' : ''), gOk) : ''}
      </div>
      ${ccOrgGoalPickHTML()}
      ${ccMgPickHTML()}
      <details class="cc-orgc-more"><summary>${esc(T.ccOrgMore)}</summary>
        ${row(T.ccOrgMedia, esc(T.ccOrgMediaRow(ccNum(ccOrgMediaMonth(org.name, org.tier, org.academy)))))}
        ${row(T.ccOrgBonusRow, ccMoney(careerOrgBonus(org)))}
        ${(CAREER.career.orgCut||0) ? row(T.ccOrgCutPaid, '$'+ccNum(CAREER.career.orgCut||0)) : ''}
        ${row(T.ccPaid, ccMoney(org.paid||0))}
        ${org.since ? row(T.lfSince, org.since) : ''}
        ${!org.own ? row(T.ccOrgTermRow, esc(T.ccOrgTermLeft(ccOrgSeasonsLeft(org)))) : ''}
      </details>
      <div class="cc-orgc-btns">
        <button class="ch-decline"${can ? '' : ' disabled'} onclick="careerLeaveOrg()" title="${esc(T.ccBuyoutWhat)}">${T.ccBuyout(ccNum(cost))}</button>
        <button class="ch-swap" onclick="careerScoutToggle()">${CAREER.scoutOff ? T.ccScoutOn : T.ccScoutOff}</button>
      </div>
    </div>`;
  }
  if(offers.length){
    return `<div class="ch-tile ch-tile-org">
      <h4>${L().ccOffers}</h4>
      <div class="ch-hint">${careerWindowNow() ? L().ccOffersHint
        : L().ccWindowShut(ccDayLabel(careerWindowNext()||CC_YEAR_TO))}</div>
      ${offers.map((o,i)=>`<div class="ch-offer">
        <div class="ch-orghead">${careerCrestImg(o.name,26)}<b>${esc(o.name)}</b></div>
        <div class="ch-offer-terms"><span>${ccMoney(o.salary)}${L().ccPerSeason}</span>
          ${(f=>`<span title="${f.est ? esc(L().ccOrgFansEst) : ''}">👥 ${ccOrgFolText(f)} · ${esc(L().ccOrgSignRow(ccFollowers(ccOrgMediaSign(o.name, o.tier, o.academy))))} · ${esc(L().ccOrgMediaRow(ccNum(ccOrgMediaMonth(o.name, o.tier, o.academy))))}</span>`)(ccOrgFollowers(o.name, o.tier))}
          <span>${L().ccOrgBonusRow}: ${ccMoney(careerOrgBonusFor(o.salary))}</span>
          ${o.perk ? `<span class="ch-perk">${L()['ccPerk'+o.perk]}</span>` : ''}
          <span>${careerOrgGoalText(o.goal)}</span></div>
        <button class="ch-sign" onclick="careerSign(${i})">${L().ccSign}</button>
      </div>`).join('')}
      <button class="ch-decline" onclick="careerDeclineOffers()">${L().ccDecline}</button>
    </div>`;
  }
  /* Пустая плитка обязана сказать, почему она пустая, — и сказать правду.

     Причин три: окно закрыто, рейтинг ниже того, с которого вообще подписывают,
     или тебя просто ещё никто не позвал. Плитка знала первую и валила остальные
     две в одну строку «клубы смотрят с Дивизиона 3». Игроку с карточкой 99 в
     первом дивизионе она читалась как отказ: он этот порог прошёл давно, а
     мод объяснял ему, что он до него не дорос. Его сообщение, 21 августа: «в
     моменте дропнула орга и больше не могу искать, мол я не в д3».

     Клубы подписывают с третьего дивизиона и выше, то есть номер должен быть
     не больше трёх: первый старше третьего, и сравнение здесь именно такое. */
  const shut=!careerWindowNow();
  const pl=CAREER.player;
  const band=ccWageDiv(pl.ovrExact!=null ? pl.ovrExact : pl.ovr);
  const tooLow=!band || band>CC_CLUBS_FROM;
  /* Четвёртая причина пустой плитки — и до 26 августа она была немой:
     поиск выключен самим игроком.

     Переключатель стоял только в ветке с подписанным клубом. Его случай:
     нажал «не искать клуб», потом разорвал контракт — и включить обратно
     негде, а плитка при этом говорила «клубы тебя видят». Ни одного письма,
     и ни одной причины на экране. Теперь переключатель есть в обеих ветках,
     а строка говорит правду. */
  const off=ccScoutOff();
  return `<div class="ch-tile ch-tile-org">
    <h4>${L().ccOrg}</h4>
    <div class="ch-empty">${L().ccFreeAgent}</div>
    <div class="ch-hint" style="margin:0;">${off
      ? L().ccScoutOffHint
      : shut ? L().ccWindowShut(ccDayLabel(careerWindowNext()||CC_YEAR_TO))
      : tooLow ? L().ccFreeAgentHint
      : L().ccFreeAgentOpen}</div>
    <button class="ch-swap" onclick="careerScoutToggle()">${
      off ? L().ccScoutOn : L().ccScoutOff}</button>
  </div>`;
}

// Epic's own quotas, kept for the record. They are not what the hub prints any
// more: the cup this mode actually plays is 150 duos cutting to 50, and a tile
// promising "top 200" over a lobby where fifty advance is a tile that lies. The
// derivation from these numbers to that one is in the design doc.
const CAREER_CUT={1:'-', 2:'top 50', 3:'top 100', 4:'top 200', 5:'top 400'};

/* Calendar: the season on real months, one square per day, tournaments inside.
   Dates are this career's schedule, but weekdays follow Epic: FNCS divisional cups run Round 1 Monday and Round 2
   Tuesday at 19:00, Division 1 adds a Weekly Final on Saturday, Division 5 has no third round
   (S41_FNCSDivisionalCup_Division1/_Division5, Feb 2026). Major and Global Championship weekends are shaped here.
   The season opens on the first Monday of January and runs eleven weeks. */
/* The clock: cr.day (ISO date) is the only clock in the save. Week numbers are derived where needed so the two can't disagree.
   Career year is Mon 1 Dec 2025 to Sun 27 Sep 2026, 301 days = 43 weeks: from S39's first Performance Evaluation night to the Global Championship in Antwerp.
   The weeks between Paris (23 Aug) and Antwerp hold only training days and the 1 September wage. */
// 47, не 43: хвост года дотянут до Перфоманса 9 (22 октября, S42) — его
// Tracker-сейвы, 23 августа.
// 48, не 47: последний вечер года — финал FNCS Solos 27 октября (правила Epic
// от 1 сентября 2026), и неделя у него своя. См. CC_YEAR_TO.
// 50, не 48: за Solos — три субботы Кубка наций и церемония 15 ноября (отзыв
// «в конец года»). Выдумка режима, см. ccNationsBook.
// 52, не 50: FNCS Solo Reload 3–22 ноября, Кубок наций за ним, год до 29 ноября.
const CAREER_WEEKS=52;
// Недель в ГОДЕ карьеры: 2026-й — все 48, 2025-й короче (11 декабря — 7 сентября).
function ccYearWeeks(){ return (ccIs2025() || ccIs2024() || ccIs2023() || ccIs2022() || ccIs2021() || ccIs2020() || ccIs2019()) ? careerWeekIndex(ccYearTo()) : CAREER_WEEKS; }

function careerToday(){
  return (CAREER && CAREER.career && CAREER.career.day) || ccYearFrom();
}
function careerMonday(iso){
  const t=new Date(iso+'T00:00:00Z');
  // getUTCDay is 0 on Sunday, so Sunday steps back six days rather than none.
  t.setUTCDate(t.getUTCDate()-((t.getUTCDay()+6)%7));
  return dateKey(t);
}
function careerWeekIndex(iso){
  const from=new Date(careerMonday(ccYearFrom())+'T00:00:00Z');
  const here=new Date(careerMonday(iso)+'T00:00:00Z');
  return Math.floor((here-from)/(7*86400000))+1;
}
// The date a career week starts on, for the screens that still think in weeks.
function careerWeekStart(week){
  return ccAddDays(careerMonday(ccYearFrom()), (week-1)*7);
}
// What the screens mean when they say "the week": where the clock is standing.
function careerWeek(){ return careerWeekIndex(careerToday()); }
// Which kinds a career can actually enter today. The divisional cup is the only
// one wired up; the Reload Opens belong here the moment they are — they are open
// qualifiers and take every division, which is the whole point of an open.
/* ---- The day itself -------------------------------------------------------

   Energy is three points and refills every morning. Unspent energy is lost: it
   shapes the day rather than carrying into the next one, so a week is seven
   small decisions instead of one long saving-up.

   A day with a tournament on it spends its energy there. A day without one asks
   the player what they are doing with it, and does not move on until they
   answer — a day nobody decided may as well not be in the calendar.

   Every option says what it gives, on its own face. The gains are small on
   purpose: a day is a day, and a career year is two hundred of them.
*/
// A hundred, because the bar in the header reads like a health bar and a health
// bar is out of a hundred. Nothing about the day changed with it: one press is
// still the whole day, so every option below costs the lot and the bar is full
// until the day is decided and empty afterwards.
const CC_ENERGY_DAY=100;
// A cup takes the day. Eleven games is the whole evening, and whatever the
// player might have squeezed in around it is not a thing that happens.
// A cup takes an evening out of the same store a training day comes from —
// eleven games is the heaviest thing in a week. Nothing reads this yet; the
// cup spends it where it is played, in runCareerCup.
const CC_TOURNEY_ENERGY=35;

/* What a day can be spent on.

   gain names the card numbers it moves and by how much. reach is followers,
   which nothing reads yet — the social spec owns that number — and it is written
   down here so the day that earns it does not have to be invented twice.

   Streaming is the one option that improves nothing. That is the trade the mode
   is about: reach pays, and the hours it takes are hours not spent getting
   better. It costs focus as well, which the next tournament feels. */
/* A day should be worth seeing. At a sixth of a point an attribute the rating
   did not move at all — a press cost a day and showed nothing, which is the one
   thing a daily choice cannot do.

   And a cup is the best improvement there is, because it is the only real game
   in the week. Training moves one or two numbers; playing moves the player. That
   ordering is what careerDevelopBase carries, and it sits above anything here. */
/* A day is one decision, and it costs the day.

   Three energy and cheap options meant a day held three or four of these, and a
   career sat at its ceiling before its first season was out — four hundred and
   eighty trainings a year will do that at any per-press number worth showing.

   So the arithmetic runs from the other end. Division 5 to Division 1 is about
   twenty-one points of rating; a season is roughly a hundred and eighty free
   days; that is a tenth of a point a day, which at aim's weight of 0.22 is half
   a point of an attribute. Half a point is exactly what a press should show, so
   a press is a day.

   Energy stays, and it says the thing it was always for: a cup takes the whole
   day, so an evening with a tournament in it is not also an evening of practice. */
// Every one of them costs the day, so they cost CC_ENERGY_DAY rather than a
// number of their own — the day's worth is written down once.
/* A training day is worth 0.5 rating. At the old 0.07 a day, D5 to D1 took three seasons; at 0.5 it takes two.
   Each row spreads that half point in the activity's usual proportions; gains weighted by ATTR_W sum to 0.500 (aim
   day all into aim, scrim day split four ways).
   Still shaped by the taper near the ceiling (careerDoAct), desk, coach and the ceiling, so daily training hits
   its limit in the first season and results take over. */
/* What each day costs out of the store, and what a rest day puts back.

   Measured against the year rather than picked: a career year holds about 170
   free days. Training at 30 with a night worth 12 runs a store of a hundred
   down in five days, and a rest day at +45 buys three more — so a season comes
   out at roughly 125 days of work and 45 of rest, and the week reads three on,
   one off. Scrims cost more because they are somebody else's evening too, and
   a stream is the cheap day that trains nothing. */
const CC_ENERGY_NIGHT=12, CC_ENERGY_REST=45;
/* Six sessions, one per attribute, +0.5 each. The old five trainings moved 2-3 attributes by 0.71..2.40 and
   nothing trained endurance at all.
   Named after what players actually do: KovaaK's for aim, Noble's endgames, ranked for survival, replays for
   experience, 1v1s for clutch; consistency keeps gym/routine.
   Gear and coach multiply it, the taper slows the last stretch so a career can't max out in one season. Rating
   value is the attribute's weight (0.11 aim, 0.05 experience), the ladder is climbed by results, see
   careerApplyGrowth. */
/* Half a point of rating, into whichever one you chose.

   His number is 0.5 and the file's number was already 0.5 - the two are not the
   same 0.5, and the difference is worth writing down. A day here has been worth
   half a point of RATING since it was calibrated: the old aim day moved aim by
   2.27, and aim is weighted 0.22, so 2.27 x 0.22 = 0.5. Half a point of the
   ATTRIBUTE instead would be 0.11 of a rating on aim and 0.05 on experience,
   five to ten times slower, and the year does not have the days for it - the
   trainable band is four points wide and it would take ninety sessions to cross.

   So the structure is his and the value is the measured one: pick a stat, and
   the session is worth half a point of rating in it, which is 2.27 of aim or 5
   of experience. tools/check-career-day-value.js holds that invariant. */
/* +0.5 to the trained ATTRIBUTE, not to rating. In rating that's the stat's weight: 0.11 aim, 0.10 endgame and
   survival, 0.08 consistency, 0.06 clutch, 0.05 experience.
   Reading it as rating only made sense with the division ceiling, which is gone; the scale just runs to 99 now.
   Invariant: tools/check-career-day-value.js. */
const CC_TRAIN_DAY=0.5;
const ccStep=k=>CC_TRAIN_DAY;
/* ---- A scrim is against somebody, and it has a score -----------------------

   Who: the strongest person in this week's own inbox list, because that is who a
   player could actually get hold of, and the list is the week's rather than a
   fresh draw — so who is available to scrim is a consequence of who has been
   writing to you.

   What it is worth: playing somebody better teaches more. Half again against
   somebody five points over you, two thirds against somebody five under, and
   the clamp is what those two sentences mean.

   The score is a real count off the two ratings rather than a decoration:
   twelve rounds, each decided by the gap. Seeded on the day, so the evening
   does not re-roll itself when the screen redraws. */
const CC_SCRIM_ROUNDS=12, CC_SCRIM_FORM=0.25;
function ccScrimFoe(){
  let best=null;
  (careerDmPool()||[]).forEach(w=>{ if(!best || w.ovr>best.ovr) best=w; });
  return best;
}
function ccScrimSet(foe, mineOvr){
  if(!foe) return null;
  const rnd=careerRng(ccHashStr('scrim|'+careerToday()+'|'+String(foe.handle||'')));
  const gap=(foe.ovr||0)-mineOvr;
  let mine=0;
  for(let i=0;i<CC_SCRIM_ROUNDS;i++){
    if(rnd() < clamp(0.5-gap*0.03, 0.1, 0.9)) mine++;
  }
  return {who:foe.handle, ovr:foe.ovr, mine:mine, theirs:CC_SCRIM_ROUNDS-mine,
          won:mine*2>CC_SCRIM_ROUNDS, mult:clamp(1+gap*0.1, 0.66, 1.5)};
}
const CC_DAY_ACTS=[
  {id:'trAim', energy:30, gain:{aim:ccStep('aim')}},
  {id:'trSur', energy:30, gain:{sur:ccStep('sur')}},
  {id:'trCon', energy:30, gain:{con:ccStep('con')}},
  {id:'trClu', energy:30, gain:{clu:ccStep('clu')}},
  {id:'trExp', energy:22, gain:{exp:ccStep('exp')}},
  {id:'trEnd', energy:26, gain:{end:ccStep('end')}},
  /* Карты Creative, на которых тренируются настоящие: Clix Box Fights (сделал Pandvil),
     Desert Zone Wars, эдит-курс. Каждая качает два атрибута по половине шага — за ту же
     энергию, что и занятие на один атрибут, то есть скорость роста не меняется. */
  {id:'trBox',  energy:30, gain:{clu:ccStep('clu')/2, aim:ccStep('aim')/2}},
  {id:'trZw',   energy:30, gain:{end:ccStep('end')/2, sur:ccStep('sur')/2}},
  {id:'trEdit', energy:30, gain:{clu:ccStep('clu')/2, con:ccStep('con')/2}},
  // The Pit: свалка всех со всеми, стрельба и стройка под огнём.
  {id:'trPit',  energy:30, gain:{aim:ccStep('aim')/2, con:ccStep('con')/2}},
  // «Своя карта» (trMap) снята из занятий его словом 29.09 («own map убрать»); вышедшая раньше карта платит по-прежнему (ccMapPay).
  // Разбор меты нового сезона: показывается три недели после смены сезона,
  // три дня — и форма, вместо штрафа за незнание острова. См. ccMetaOpen.
  {id:'trMeta', energy:24, gain:{}, meta:true},
  /* Scrims, back where they were.

     They were a day in the store — thirty-eight energy, a quarter step into four
     attributes and six points of the partner's morale — and the rewrite that
     turned them into a set with a score dropped the row itself. The comments
     inside careerDoAct went on describing who a scrim is against, ccGiveMood
     went on being the label for a day that raises morale, and careerDoAct went
     on reading act.morale, and nothing in the mode fed any of it: the only
     `morale:` left in the file was the −4 on the scrimup event. So a partner's
     mood could fall and could not be raised by anything a player did.

     His tester, 20 August, found the hole from the inside: stuck on one rung,
     morale falling, nothing to do about it. */
  // Его слово 21.10: «вместо скримов сделай креатив», энергия 40 у креатива, Noble и стрима (было 38/32/30).
  {id:'scrim',   energy:40, morale:6, versus:true,
   gain:{aim:ccStep('aim')/4, sur:ccStep('sur')/4, clu:ccStep('clu')/4, con:ccStep('con')/4}},
  // Сессия Noble Pro Scrims (сервер — по уровню, см. ccNobleServer): игра на сотню, таблица недели.
  {id:'noble',   energy:40, noble:true,
   gain:{end:ccStep('end')/3, sur:ccStep('sur')/3, clu:ccStep('clu')/3}},
  /* Поговорить — второй способ держать настрой, и он не про тренировку.
   *
   * Правка: «сделаю реалистичней диалог между дуо или трио и чтоб мораль
   * можно было поддерживать, чтоб диалоги влияли на это не только совместные
   * скримсы». До этого дня скрим был единственным, что поднимает настрой соседа
   * — тридцать восемь энергии за вечер, — и карьера, у которой напарник кисло
   * относится к результатам, могла только играть дальше и надеяться.
   *
   * Дешёвый по энергии и без прибавки к статам: это разговор, а не занятие.
   * Сколько он стоит, решается на месте (careerTalkMove), потому что постоянное
   * число здесь было бы краном: жми каждый день, и настрой всегда сто. */
  /* 20 энергии и +7 настроя — его пункт 15 со страницы «ы», 22 августа:
     «поговорить не дает настрой». База была 5/3/1 по терпению, и с довольным
     соседом разговор читался как пустая кнопка. Число теперь его; краном не
     становится — повторный разговор в CC_TALK_GAP всё так же режется вдвое и
     вчетверо. */
  {id:'talk',    energy:20, gain:{}, talk:true, morale:1},
  {id:'stream',  energy:40, gain:{}, reach:1, focus:-1},
  // Тренировка на телефоне (его слово 15.11: «мобильный рейтинг отдельно надо качать»): только мобильный рейтинг, нужен
  // телефон или планшет (ccMobileTrain).
  {id:'mobile',  energy:30, gain:{}, mobile:true},
  /* Мобильные скримы (идея игрока с мобильной сцены, 19.11: «add scrims, people do host like takeovers»): катки против
     мобильных игроков на 16, как в серии. Дороже тренировки, качают меньше, зато и выше её потолка: до 90. Решение, не замер. */
  {id:'mobScrim', energy:40, gain:{}, mobile:true, mobScrim:true},
  // «Смотреть про» (ccWatchTileHTML): занятие одного стата, выбранного по про, которого смотришь. Кнопок дня у них нет.
  {id:'trWaim', energy:15, watch:true, gain:{aim:ccStep('aim')/2}},
  {id:'trWsur', energy:15, watch:true, gain:{sur:ccStep('sur')/2}},
  {id:'trWcon', energy:15, watch:true, gain:{con:ccStep('con')/2}},
  {id:'trWclu', energy:15, watch:true, gain:{clu:ccStep('clu')/2}},
  {id:'trWend', energy:15, watch:true, gain:{end:ccStep('end')/2}},
  // Коучинг за деньги и занятие с учеником (22.11): свои плитки во вкладке «Тренировка», кнопок дня нет (side).
  {id:'lesson', energy:20, gain:{}, side:true, lesson:true},
  {id:'mentor', energy:20, gain:{}, side:true, mentor:true},
  {id:'patch', energy:20, gain:{}, side:true, patch:true},
  // Разминка перед турниром: только в день турнира, форма на вечер (ccPreEvent, CC_WARM_FORM).
  {id:'warm',   energy:15, gain:{}, warm:true},
  /* Discord-тусовка (его «да» на план 21.11, ccCrewHTML): не кнопки дня, а действия из Discord, поэтому в панели дня
     и в перемотке их нет (crew/voice). «Поиграть вместе» - скрим против позванного (CC_CREW_WITH, ccScrimSet): тот же
     шаг, что у скрима, на два стата; войс - дешёвый вечер, настрой напарнику. Числа - решение, не замер. */
  // Что именно играть вместе - на выбор (его «пусть на выбор будет ранкед и тд»): скримы - понемногу во все четыре,
  // бокс-файты - прицел и клатч, зон-варс - эндгейм и выживание; ранкед вдвоём идёт обычной сессией trSur.
  {id:'crew',    energy:30, crew:true, versus:true, gain:{aim:ccStep('aim')/4, clu:ccStep('clu')/4, sur:ccStep('sur')/4, end:ccStep('end')/4}},
  {id:'crewBox', energy:30, crew:true, versus:true, gain:{clu:ccStep('clu')/2, aim:ccStep('aim')/2}},
  {id:'crewZw',  energy:30, crew:true, versus:true, gain:{end:ccStep('end')/2, sur:ccStep('sur')/2}},
  {id:'voice',   energy:10, gain:{}, voice:true, morale:2},
  {id:'rest',    energy:0,  gain:{}, rest:CC_ENERGY_REST}
];
/* Цена разговора. Довольному почти ничего не даёт (иначе его можно держать на ста), недовольному больше всего.
   Повтор в течение трёх дней стоит вдвое меньше, дальше ещё вдвое. Границы настроя те же, что в careerMoodKey. */
const CC_TALK_GAP=3;
// День берётся аргументом, а не только из карьеры: иначе правило нельзя
// проверить, не подняв сначала целый сезон, — и первая же проверка это поймала.
function careerTalkMove(rec, iso){
  const today=iso || careerToday();
  const pat=(rec && rec.patience!=null) ? rec.patience : CAREER_PATIENCE_START;
  // Плоские +7 — его число (пункт 15). Ступени по терпению убраны: за 20
  // энергии разговор обязан быть слышен и довольному соседу.
  const base = 7;
  const last=rec && rec.talked;
  if(!last || !today) return base;
  const since=ccDaysBetween(last, today);
  if(since>=CC_TALK_GAP*2) return base;
  if(since>=CC_TALK_GAP) return Math.max(1, Math.round(base/2));
  return Math.max(0, Math.round(base/4));
}
function ccActById(id){ return CC_DAY_ACTS.find(a=>a.id===id) || null; }

/* ---- What happens to you --------------------------------------------------
   Rare day events: a stronger duo short a player, a paid showmatch, a sponsor
   video, a night the line dies. Two answers each, both spend the day.
   Rolled with real Math.random the day it arrives and stored in cr.luck, so a
   reload doesn't re-roll. Not seeded off the date: that made the same calendar
   of events for every playthrough. See ccDayRoll. */
const CC_DAY_EVENT_CHANCE=1/6;
const CC_DAY_EVENTS=[
  // A better duo needs a stand-in tonight: an evening with people above you.
  {id:'scrimup', take:{energy:34, form:0.5, morale:-4}, pass:{energy:0}},
  // A showmatch: money and an audience for an evening that trains nothing.
  {id:'show',    take:{energy:30, cash:400, reach:2}, pass:{energy:0}},
  // The sponsor wants a video. Saying no costs nothing today and a little of
  // what they think of you, which is what reach is.
  {id:'promo',   take:{energy:30, cash:250, reach:1}, pass:{reach:-1}},
  // The line goes down. There is no good answer, only which loss.
  {id:'offline', take:{energy:0, restore:20}, pass:{energy:30, form:-0.5}},
  /* Кастомка организатора — с порогом по PR.

     Это самая обычная вещь на сцене и её у нас не было. Живой пример,
     2 сентября 2026: «$100 PER WIN SOLO VICTORY CUP — 1 Pro Lobby + 1 Lobby
     for Top 2.5k PR 2026, среда 19:00 CEST, регистрация в дискорде», и
     @ScrollSZN отвечает «ty for invite». То есть турнир вне календаря Epic, в
     который пускают по числу, которое игрок и так себе набивает.

     Здесь так же: приглашают, только если PR дорос (CC_CUSTOM_PR), платят за
     победы в играх, и это не квалификация никуда — деньги и вечер. Выплата
     считается в ccCustomPlay, потому что она зависит от того, как сыграл, а
     не от того, что согласился. */
  /* Форма — в таблице, деньги — в самом вечере: за кастомками ходят не за
     сотней, а за лобби, где все играют всерьёз. Тот же смысл, что у скримов,
     только с призом за победу. */
  {id:'custom',  take:{energy:30, form:0.4}, pass:{energy:0}},
  /* События-развилки, 3 сентября 2026 — его пункт 2 из разбора «чего не
     хватает». У каждого два-три ответа (opts) вместо «да/нет», условие when,
     и след в репутации, форме, настрое или охвате. Все с живой сцены:
     напарник хочет другую точку, клуб задержал зарплату, слив в ленте,
     контент-хаус на неделю, тренер-волонтёр, вчерашний провал. Школа и
     уход клуба приходят не жребием, а по делу — см. careerForcedEvent. */
  {id:'mateSpot', when:()=>!!careerMateRec() && !!careerSpotOn(), opts:[
    {id:'move',  eff:{spotClear:true, morale:6}},
    {id:'keep',  eff:{morale:-5}},
    {id:'trial', eff:{energy:20, morale:2, form:0.2}}]},
  // Только чужой клуб: свой (own) зарплату не задерживает и сливать нечего.
  {id:'orgLate', when:()=>!!CAREER.org && !CAREER.org.own, opts:[
    {id:'wait',   eff:{rep:1}},
    {id:'public', eff:{reach:2, rep:-2}},
    {id:'leave',  eff:{orgLeave:true, reach:1}}]},
  {id:'leak', when:()=>!!CAREER.org && !CAREER.org.own, opts:[
    {id:'deny',    eff:{reach:1}},
    {id:'confirm', eff:{reach:3, rep:-2}},
    {id:'silent',  eff:{}}]},
  {id:'house', when:()=>careerReach()>=20000, opts:[
    {id:'go', eff:{energy:40, reach:4, form:-0.3}},
    {id:'no', eff:{}}]},
  {id:'coachFree', when:()=>!ccCoach(), opts:[
    {id:'take', eff:{energy:30, form:0.3, stat:0.5}},
    {id:'pass', eff:{}}]},
  {id:'tilt', when:()=>!!careerMateRec() && ccBadNightYesterday(), opts:[
    {id:'blame', eff:{rep:-3, morale:-6, form:0.2}},
    {id:'own',   eff:{rep:1, morale:4}},
    {id:'talk',  eff:{energy:20, morale:7}}]},
  {id:'orgQuit', forced:true, opts:[
    {id:'fa',    eff:{orgGone:true, lft:true}},
    {id:'quiet', eff:{orgGone:true}}]}
];
/* Порог приглашения. У них он «топ-2500 PR сезона», у нас — число той же
   шкалы: столько за год набирает игрок, который регулярно доходит до финалов
   недели, но ещё не живёт в Дивизионе 1. Ниже — на кастомки не зовут. */
const CC_CUSTOM_PR=12000;
const CC_CUSTOM_GAMES=5;
const CC_CUSTOM_PER_WIN=100;
function ccCustomPr(){
  const pl=CAREER && CAREER.player;
  const pr=pl ? ccPrCardOf(pl.handle||pl.nick) : null;
  return pr ? pr.pr : 0;
}
function ccCustomInvited(){
  // Позвали по числу — или позвали лично, потому что попросился. См. careerCustomAsk.
  return ccCustomPr()>=CC_CUSTOM_PR ||
         (CAREER.career.customInvite && CAREER.career.customInvite>=careerToday());
}
/* Почти дотянул: с шестидесяти процентов порога уже можно попроситься.

   Так это и делают: под постом организатора пишут «Yo would love an invite
   boss» (@MrSavage, 28 августа), и иногда зовут. Его пункт 6, 3 сентября. */
function ccCustomNear(){
  const pr=ccCustomPr();
  return pr>=CC_CUSTOM_PR*0.6 && pr<CC_CUSTOM_PR;
}
function careerCustomAsk(id){
  const cr=CAREER.career;
  const n=(cr.news||[]).find(x=>x.id===id);
  if(!n || n.asked) return;
  n.asked=1;
  const rnd=careerRng(ccHashStr('ask|'+(cr.season||1)+'|'+careerToday()));
  const yes=rnd()<0.5;
  if(yes){
    // Приглашение действует до завтрашнего дня: вечер играется, пока оно живо.
    cr.customInvite=ccAddDays(careerToday(), 1);
    careerNews('good', 'ccPostAskYes', []);
  } else careerNews('flat', 'ccPostAskNo', []);
  careerSave();
  careerRenderHub('social');
}
/* Пост организатора: набор в кастомку. Приходит раз в неделю тем, кто рядом с
   порогом, — тем, кому есть смысл проситься. */
function careerCustomsPostTick(){
  const cr=CAREER.career;
  if(!ccCustomNear()) return;
  const key='cu|'+(cr.season||1)+'|'+careerWeek();
  cr.told=cr.told||{};
  if(cr.told[key]) return;
  cr.told[key]=1;
  careerNews('flat', 'ccPostCustomsOpen', [ccNum(CC_CUSTOM_PR), CC_CUSTOM_PER_WIN],
             {by:{name:L().ccCustomsHost, handle:'poyocustoms', verified:true}});
}
/* Вечер кастомки. Лобби про, пять игр, сто долларов за победу.

   Считается посеянным броском, как 1v1: это не турнир карьеры — журнал,
   квалификации и PR он не трогает, — а вечер за деньги, и живая симуляция
   ради него не поднимается. Сила игрока против лобби, где все примерно
   уровня Дивизиона 1. */
function ccCustomPlay(){
  const cr=CAREER.career, pl=CAREER.player;
  const rnd=careerRng(ccHashStr('custom|'+(cr.season||1)+'|'+careerToday()));
  const mine=pl.ovrExact!=null?pl.ovrExact:pl.ovr;
  /* Победа в лобби из полусотни — редкость даже у сильного, но не небылица:
     у топа выходит одна-две из пяти, у того, кого позвали впритык, — одна на
     вечер-другой. Шанс идёт от разницы с уровнем Дивизиона 1. */
  const p=clamp(0.05+(mine-ccBand(1))*0.012, 0.02, 0.45);
  let wins=0;
  for(let g=0; g<CC_CUSTOM_GAMES; g++) if(rnd()<p) wins++;
  const cash=wins*CC_CUSTOM_PER_WIN;
  if(cash){ cr.balance=(cr.balance||0)+cash; cr.side=(cr.side||0)+cash; }
  careerReachAdd(wins ? 2 : 1);
  return {wins:wins, cash:cash};
}
