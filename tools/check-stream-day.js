// Обычный эфир в свободный день идёт НА ЭКРАНЕ, а не превращается в статистику.
//
// Его отчёт 8 сентября 2026: «когда жмёшь стрим в свободный день, не турнир, после
// нажатия показывается статистика». Так и было: день списывался молча, вкладка
// перерисовывалась, и человек оставался смотреть на список каналов и числа.
//
// Проверяется:
//   * нажатие вида эфира поднимает рамку трансляции (ccTvFrame, body.cc-onair);
//   * строка эфира называет вид и часы, а не «ждём первую игру»;
//   * эфир кончается сам: рамка снимается, встаёт сводка;
//   * числа сводки — ТЕ ЖЕ, что посчитал день (streamLast): ничего не начисляется
//     дважды, энергия списана один раз;
//   * под пропуском и в симуляции рамки нет вовсе;
//   * в плеере идёт ролик с YouTube (его слово 8.09), молча и по кругу, а под ним
//     лежит нарисованный бой на билдах — если ролик не доехал, кадр не пустеет.
//
//   node tools/check-stream-day.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
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
(async function(){
  const out={steps:[], fail:null};
  const fail=m=>{ out.fail=m; throw new Error(m); };
  const wait=ms=>new Promise(r=>setTimeout(r, ms));
  const save=()=>localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Streamer', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:88, role:'roleIGL', attrs:null, ageEdge:4},
      career:{season:1, day:'2026-02-05', division:3, earnings:0, balance:500, reach:5000,
              tokens:[], log:[], news:[]}, partner:null}));
  try{
    save(); careerEntry();
    careerTab('streams'); await wait(400);
    const kind='grind', k=ccStreamKind(kind);
    const energy0=careerEnergy();
    const go=[...document.querySelectorAll('.tv-go')]
      .find(b=>(b.getAttribute('onclick')||'').indexOf("careerStreamGo('"+kind+"')")>=0);
    if(!go) fail('на плеере нет кнопки обычного эфира');
    if(go.disabled) fail('кнопка обычного эфира выключена в свободный день');
    go.click();
    await wait(700);
    const box=document.getElementById('ccTvFrame');
    if(!box) fail('после нажатия эфира рамки нет — вкладка просто перерисовалась');
    if(!document.body.classList.contains('cc-onair')) fail('страница не помечена как «в эфире»');
    const run=(document.getElementById('ccTvRun')||{textContent:''}).textContent;
    if(run.indexOf(L()['ccStream_'+kind])<0) fail('строка эфира не называет вид: '+run);
    if(!/\\d/.test(run)) fail('строка эфира без часов: '+run);
    if(run.indexOf(L().ccTvWait)>=0) fail('обычный эфир ждёт первую игру, которой не будет');
    if(document.getElementById('ccTvSum')) fail('сводка встала, не дав эфиру пройти');
    out.steps.push('эфир идёт: рамка на месте, строка «'+run.replace(/\\s+/g,' ').trim().slice(0,60)+'»');
    // Картинка в плеере — фрибилд, а не скрин, и она видна даже без анимации.
    const fb=document.querySelector('.tv-player.live .tv-fb');
    if(!fb) fail('в плеере нет сцены фрибилда — остался скрин');
    const walls=[...document.querySelectorAll('.tv-fb-w')];
    if(walls.length<4) fail('в сцене '+walls.length+' стен');
    const wide=walls.filter(w=>{ const r=w.getBoundingClientRect(); return r.width>4 && r.height>4; });
    if(wide.length!==walls.length) fail('стены нулевого размера: '+(walls.length-wide.length));
    // База — «видно»: если анимация не идёт, кадр не должен быть пустым.
    const off=walls.filter(w=>{ const a2=w.getAnimations()[0]; if(a2) a2.cancel(); return +getComputedStyle(w).opacity===0; });
    if(off.length) fail('без анимации сцена пустеет: невидимых стен '+off.length);
    out.steps.push('в плеере фрибилд: '+walls.length+' построек, видны и без анимации');
    // Поверх сцены — живой ролик (его слово 8.09: «с рандомного видоса на ютубе»).
    const slot=document.querySelector('.tv-player.live .tv-clip-slot');
    if(!slot) fail('в кадре нет места под ролик — остался только рисунок');
    // Сцена лежит ПОД роликом: без ролика кадр не пустеет.
    if(!(fb.compareDocumentPosition(slot) & Node.DOCUMENT_POSITION_FOLLOWING))
      fail('место под ролик в разметке раньше сцены — сцена накроет его');
    const cut=ccTvClipOf(), src=ccTvClipSrc(cut);
    if(src.indexOf('https://www.youtube-nocookie.com/embed/')!==0) fail('чужой адрес ролика: '+src);
    ['autoplay=1','mute=1','controls=0'].forEach(q=>{
      if(src.indexOf(q)<0) fail('в адресе ролика нет '+q+': '+src); });
    // Кусок задан адресом: от start до end. loop гонял бы всё видео — его быть не должно.
    if(src.indexOf('&start='+cut.at)<0) fail('в адресе нет начала куска: '+src);
    if(src.indexOf('&end='+cut.to)<0) fail('в адресе нет конца куска: '+src);
    if(/[?&]loop=1/.test(src)) fail('в адресе loop — плеер погонит всё видео, а не кусок');
    out.steps.push('в кадре место под ролик: кусок '+cut.at+'–'+cut.to+' с, молчит');
    /* Нарезка: одиннадцать знаков ютуба, без повторов, у каждого автор и длина, и
       каждый кусок целиком помещается в своё видео. */
    { const seen={};
      CC_TV_CLIPS.forEach(c=>{
        if(!/^[A-Za-z0-9_-]{11}$/.test(c.id)) fail('не похоже на ролик YouTube: '+c.id);
        if(seen[c.id]) fail('ролик в списке дважды: '+c.id);
        seen[c.id]=1;
        if(!c.who) fail('у ролика '+c.id+' не указан автор');
        if(!(c.len>0)) fail('у ролика '+c.id+' не записана длина');
        if(!c.cuts || c.cuts.length<3) fail('у ролика '+c.id+' меньше трёх кусков');
        c.cuts.forEach(a=>{
          if(!(a>=0)) fail('кусок с отрицательного места: '+c.id+' '+a);
          if(a+CC_TV_CUT>c.len) fail('кусок вылезает за конец ролика: '+c.id+' '+a+'+'+CC_TV_CUT+'>'+c.len);
        });
        for(let i=1;i<c.cuts.length;i++)
          if(c.cuts[i]-c.cuts[i-1]<CC_TV_CUT) fail('куски налезают друг на друга: '+c.id); });
      if(CC_TV_CLIPS.length<2) fail('роликов в списке всего '+CC_TV_CLIPS.length);
      out.steps.push('нарезка: '+CC_TV_CLIPS.map(c=>c.who+' '+c.cuts.length+'×'+CC_TV_CUT+' с').join(', ')); }
    // Выбор посеян ДНЁМ: тот же вечер — тот же кусок, а за месяц берутся разные.
    { const cr=CAREER.career, day0=cr.day, pick={};
      const key=p=>p.c.id+'@'+p.at;
      if(key(ccTvClipOf())!==key(ccTvClipOf())) fail('кусок меняется от перерисовки');
      for(let i=0;i<30;i++){ cr.day=ccAddDays(day0, i); pick[key(ccTvClipOf())]=1; }
      cr.day=day0;
      const n=Object.keys(pick).length;
      if(n<5) fail('за тридцать дней всего '+n+' разных кусков');
      const all=CC_TV_CLIPS.reduce((s,c)=>s+c.cuts.length, 0);
      out.steps.push('кусок от дня: за месяц '+n+' разных из '+all); }
    // Рамка вешается, но невидимо: пока плеер не сказал «играю», её не видно.
    await wait(600);
    const clip=slot.querySelector('.tv-clip');
    if(!clip) fail('в кадре нет рамки ролика');
    if(clip.tagName!=='IFRAME') fail('ролик не рамкой: '+clip.tagName);
    if((clip.getAttribute('src')||'').indexOf('youtube-nocookie.com/embed/')<0)
      fail('в кадре чужая рамка: '+clip.getAttribute('src'));
    if((clip.getAttribute('src')||'').indexOf('enablejsapi=1')<0)
      fail('плеер не сможет ответить: нет enablejsapi');
    // Ролик — фон, а не проигрыватель: кликом на YouTube не уводит.
    if(getComputedStyle(clip).pointerEvents!=='none') fail('ролик перехватывает клики');
    if(!slot.querySelector('.tv-clip-by')) fail('под роликом нет подписи автора');
    /* Сеть в пробе отрезана, значит ролик не идёт — и его не должно быть видно.
       Проверяется именно так, а не таймером: на тонком канале ролик едет долго. */
    if(slot.dataset.on) fail('ролик объявлен играющим при отрезанной сети');
    if(+getComputedStyle(slot).opacity!==0) fail('неиграющий ролик закрывает кадр');
    if(!document.querySelector('.tv-player.live .tv-fb')) fail('под роликом нет рисунка');
    out.steps.push('ролик не идёт — рамка прозрачна, в кадре рисунок');
    // А сказал «играю» — виден. (Само сообщение подделать нельзя: origin ставит браузер.)
    { ccTvClipPlaying();
      slot.style.transition='none';
      if(+getComputedStyle(slot).opacity!==1) fail('заигравший ролик не проявился');
      out.steps.push('плеер сказал «играю» — ролик виден, подпись автора на месте'); }
    /* Кусок доиграл — плеер отматывает к началу куска, а не встаёт на последнем кадре
       и не едет дальше по ролику. Настоящая рамка на время убирается: с ней говорить
       нельзя, она чужого домена, — а подставная записывает, что ей сказали. */
    { if(typeof ccTvClipLoop!=='function') fail('нечем отмотать кусок назад');
      clip.remove();
      const el=document.createElement('iframe');
      el.className='tv-clip'; el.dataset.at='123';
      const sent=[];
      Object.defineProperty(el, 'contentWindow', {value:{postMessage:m=>sent.push(m)}, configurable:true});
      document.body.appendChild(el);
      ccTvClipLoop();
      el.remove();
      const j=sent.map(s=>{ try{ return JSON.parse(s); }catch(e){ return {}; } });
      if(!j.some(x=>x.func==='seekTo' && x.args && x.args[0]===123))
        fail('отмотка не к началу куска: '+sent.join(' '));
      if(!j.some(x=>x.func==='playVideo')) fail('после отмотки плеер не запускается');
      out.steps.push('кусок кончился — плеер отматывает к его началу'); }
    // Уведомления эфира: карточка над плеером, не больше двух разом.
    ccTvAlert('sub', 'Проба', 'кто-то');
    ccTvAlert('dono', 'Проба 2', 'кто-то');
    ccTvAlert('fol', 'Проба 3', 'кто-то');
    const host=document.getElementById('tvAlert');
    if(!host) fail('над плеером нет места под уведомления');
    if(host.children.length>CC_TV_AL_MAX) fail('уведомлений на экране '+host.children.length+', потолок '+CC_TV_AL_MAX);
    if(!host.querySelector('.cc-tv-al b')) fail('уведомление без заголовка');
    out.steps.push('уведомления приходят на экран: на виду не больше '+CC_TV_AL_MAX);
    // Энергия списана ровно один раз — рамка не платит второй.
    const spent=energy0-careerEnergy();
    if(spent!==k.energy) fail('списано '+spent+' энергии вместо '+k.energy);
    out.steps.push('день оплачен один раз: '+spent+' энергии');
    // Эфир кончается сам.
    for(let i=0;i<80 && document.getElementById('ccTvFrame');i++) await wait(400);
    if(document.getElementById('ccTvFrame')) fail('эфир не кончился сам');
    const sum=document.getElementById('ccTvSum');
    if(!sum) fail('после эфира нет сводки');
    if(document.body.classList.contains('cc-onair')) fail('страница осталась «в эфире» после конца');
    const cr=CAREER.career, last=cr.streamLast;
    if(!last || !last.sum) fail('сводка не записана в сейв');
    if(last.sum.fol!==(last.a&&last.a[2])) fail('фолловеры в сводке ('+last.sum.fol+') не те, что посчитал день ('+(last.a&&last.a[2])+')');
    if(last.sum.cash!==last.m) fail('деньги в сводке ('+last.sum.cash+') не те, что посчитал день ('+last.m+')');
    if(last.sum.hours!==(k.hours||4)) fail('часы в сводке '+last.sum.hours+', у вида '+(k.hours||4));
    if(!(last.sum.avg>0) || !(last.sum.peak>=last.sum.avg)) fail('онлайн в сводке: '+JSON.stringify(last.sum));
    out.steps.push('сводка после эфира: онлайн '+last.sum.avg+', пик '+last.sum.peak+', +'+last.sum.fol+' фолловеров, $'+last.sum.cash+', '+last.sum.hours+' ч');
    // События эфира: рейд, клип, про в чате, хейт-рейд (его «стримится стрим просто»).
    if(!Array.isArray(last.sum.hap)) fail('в сводке нет списка событий');
    { const seen={}, day0=cr.day; let empty=0;
      // Бросок посеян ДНЁМ, поэтому разброс смотрится по разным дням, а не по повторам.
      for(let i=0;i<60;i++){
        cr.day=ccAddDays(day0, i);
        const set=ccStreamHappenings({id:'grind', hours:4}, 16);
        if(set.length>2) fail('за эфир назначено больше двух событий: '+set.length);
        if(!set.length) empty++;
        set.forEach(h=>{ seen[h.id]=1; if(h.at<2 || h.at>16) fail('событие вне эфира: '+JSON.stringify(h)); });
      }
      cr.day=day0;
      if(Object.keys(seen).length<3) fail('за шестьдесят дней случилось меньше трёх видов событий: '+Object.keys(seen).join(','));
      if(!empty) fail('событие есть каждый эфир — это уже не событие');
      if(empty>45) fail('события почти не случаются: пустых эфиров '+empty+' из 60');
      out.steps.push('события за 60 дней: виды '+Object.keys(seen).sort().join(', ')+', пустых эфиров '+empty+', не больше двух за раз');
    }
    // Один и тот же день даёт один и тот же набор — бросок посеян днём.
    { const a1=JSON.stringify(ccStreamHappenings({id:'grind', hours:4}, 16));
      const a2=JSON.stringify(ccStreamHappenings({id:'grind', hours:4}, 16));
      if(a1!==a2) fail('события пересобираются от перерисовки: '+a1+' vs '+a2); }
    // Строки событий есть на обоих языках.
    ['ru','en'].forEach(l=>{ const prev=LANG; LANG=l; CC_L_CACHE={}; const T=L(); LANG=prev; CC_L_CACHE={};
      if(typeof T.ccTvHapRaidSum!=='function' || typeof T.ccTvHapClipSum!=='function' ||
         typeof T.ccTvHapProSum!=='function' || typeof T.ccTvHapHateSum!=='string' ||
         typeof T.ccTvClipBy!=='function')
        fail(l+': нет строк событий эфира'); });
    out.steps.push('строки событий на обоих языках');
    ccTvSummaryClose();

    // Под пропуском рамки нет: перемотка не должна упираться в эфир.
    localStorage.removeItem('fncsdraft_career'); save(); careerEntry();
    skipAnimation=true;
    const ok=careerStreamGo('grind');
    if(!ok) fail('под пропуском эфир не состоялся вовсе');
    if(document.getElementById('ccTvFrame')) fail('под пропуском поднялась рамка');
    skipAnimation=false;
    out.steps.push('под пропуском эфир считается без рамки');
  }catch(e){ if(!out.fail) out.fail=String(e && e.stack || e); }
  document.getElementById('__out').textContent='BEG'+'IN'+encodeURIComponent(JSON.stringify(out))+'E'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccstr-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
// Сеть отрезана: ролик в плеере не должен ни тормозить пробу, ни ходить наружу.
// Заодно это и есть тот самый случай, ради которого под роликом лежит рисунок.
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--host-resolver-rules=MAP * ~NOTFOUND',
  '--virtual-time-budget=180000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('проба не дала вывода'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
console.log('обычный эфир идёт на экране и кончается сводкой');
