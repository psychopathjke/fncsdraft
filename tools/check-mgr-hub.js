// Хаб менеджера «как в карьере» и выбор клуба (спека docs/specs/2026-10-07-fortnite-manager-fc-design.md).
//   node tools/check-mgr-hub.js            — все секции
//   node tools/check-mgr-hub.js бюджет     — только секции, в имени которых есть слово
// Каждая секция — тело async-функции внутри страницы: есть check(name, ok, detail), bad(html),
// lang ('ru'|'en'), wait(ms), out.notes. Секция с once:true идёт только на ru.
const fs=require('fs'), os=require('os'), path=require('path');
const {execFileSync}=require('child_process');
const ROOT=path.resolve(__dirname,'..').split(String.fromCharCode(92)).join('/');
const CHROME=[process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p=>p && fs.existsSync(p));
if(!CHROME) throw new Error('Chrome not found');

const SECTIONS=[
  {name:'бюджет', once:true, code:String.raw`
    const big=mgrClubBudget('Cooler Esport', 20000, 88), none=mgrClubBudget('Нет Такого Клуба', 3000, 70);
    // Клубы без призовых в списке различаются силой состава, а призовые поднимают бюджет при равной силе.
    const strong=mgrClubBudget('Нет Такого Клуба', 3000, 95), kc=mgrClubBudget('Karmine Corp', 3000, 95);
    check('бюджет: сильный клуб без призовых богаче слабого', strong.turnover>none.turnover, strong.turnover+' vs '+none.turnover);
    check('бюджет: призовые поднимают при равной силе', kc.turnover>strong.turnover, kc.turnover+' vs '+strong.turnover);
    { mgrOpenNew(2024); const t=MGR_NEW_LIST.map(c=>c.budget.transfer); const uniq=new Set(t).size;
      check('бюджет: у клубов 2024 EU разные бюджеты', uniq>=Math.min(8, t.length-2), uniq+' из '+t.length); }
    check('бюджет: большой клуб больше пустого', big.turnover>none.turnover, big.turnover+' vs '+none.turnover);
    check('бюджет: пол у клуба вне списка', none.turnover>=MGR_TURNOVER_FLOOR, String(none.turnover));
    check('бюджет: трансферный 40%', big.transfer===Math.round(big.turnover*0.4));
    check('бюджет: потолок зарплат вмещает состав с запасом 15%', big.wageCap>=Math.round(20000/0.85)-1, String(big.wageCap));
    check('бюджет: числа целые', [big.turnover,big.transfer,big.wageCap,none.wageCap].every(Number.isInteger));
    out.notes.budgetCooler=big; out.notes.budgetNone=none;
    // Старый сейв без бюджетов: хаб досчитывает.
    MGR_NEW_YEAR=2024; MGR_NEW_REGION='EU'; mgrOpenNew(2024); mgrTake(0);
    check('бюджет: у взятого клуба есть', Number.isInteger(MGR.club.wageCap) && Number.isInteger(MGR.club.transfer), JSON.stringify(MGR.club));
    check('бюджет: состав помещается', mgrWageRoom()>=0, String(mgrWageRoom()));
    delete MGR.club.wageCap; delete MGR.club.transfer; mgrOpenHub();
    check('бюджет: старый сейв досчитан', Number.isInteger(MGR.club.wageCap) && MGR.club.wageCap>0);
    // Подписание сверх потолка зарплат совет не пропускает, в пределах — пропускает и тратит трансферный.
    const n0=mgrAll().length, tr0=MGR.club.transfer;
    mgrSignFinal({h:'ПробаДорогой', buyDeal:0, years:1, acad:false}, mgrWageRoom()+1000);
    check('бюджет: сверх потолка — отказ', mgrAll().length===n0, String(mgrAll().length-n0));
    MGR.club.cash+=5000; mgrSignFinal({h:'ПробаДешёвый', buyDeal:5000, years:1, acad:false}, 1);
    check('бюджет: в пределах — подписан', mgrAll().length===n0+1);
    check('бюджет: отступные из трансферного', MGR.club.transfer===Math.max(0, tr0-5000), tr0+' → '+MGR.club.transfer);
  `},
  {name:'выбор', code:String.raw`
    MGR_NEW_SIDE='real'; MGR_NEW_REGION='EU';
    for(const y of [2019, 2022, 2024, 2026]){ mgrOpenNew(y);
      const html=document.getElementById('mgBody').innerHTML, tiles=document.querySelectorAll('#mgBody .mgn-club');
      check('выбор '+y+' '+lang+': плитки есть', tiles.length>=3, String(tiles.length));
      check('выбор '+y+' '+lang+': без undefined/NaN', !bad(html));
      check('выбор '+y+': у плиток бюджеты', tiles.length && [...tiles].every(t=>/\$/.test(t.textContent)));
      check('выбор '+y+': звёзды', document.querySelectorAll('#mgBody .mgn-stars').length===tiles.length);
      check('выбор '+y+': ожидание совета', [...tiles].every(t=>t.querySelector('.mgn-exp') && t.querySelector('.mgn-exp').textContent.trim().length>3)); }
    check('звёзды', mgrClubStars(95)===5 && mgrClubStars(60)===0.5 && mgrClubStars(80)%0.5===0, [mgrClubStars(95),mgrClubStars(60),mgrClubStars(80)].join());
    MGR_NEW_SORT='budget'; mgrOpenNew(2024);
    const bs=MGR_NEW_LIST.map(c=>c.budget.transfer);
    check('сортировка по бюджету', bs.every((v,i)=>!i || bs[i-1]>=v), bs.slice(0,5).join());
    MGR_NEW_SORT='stars'; mgrOpenNew(2024);
    document.querySelector('#mgBody .mgn-club').click();
    check('клик по плитке берёт клуб', MGR && MGR.club && MGR.club.name===MGR_NEW_LIST[0].name, MGR && MGR.club && MGR.club.name);
  `},
  {name:'свой клуб', code:String.raw`
    MGR_NEW_SIDE='own'; mgrOpenNew(2024);
    check('свой '+lang+': форма', !!document.getElementById('mgnName') && !bad(document.getElementById('mgBody').innerHTML));
    for(const [y,reg,tier] of [[2024,'EU','rookie'],[2021,'ME','amb'],[2019,'OCE','mid']]){
      MGR_NEW_YEAR=y; MGR_NEW_REGION=reg;
      const r=mgrCreateOwn({name:'Тест <"Клуб">', color:'#ffd400', shape:'shield', region:reg, tier});
      check('свой '+y+reg+': создан', r===true, String(r));
      if(r!==true) continue;
      check('свой '+y+reg+': название чистое', MGR.club.name.indexOf('<')<0 && MGR.club.name.indexOf('"')<0 && MGR.club.own===true, MGR.club.name);
      check('свой '+y+reg+': бюджеты числа', Number.isInteger(MGR.club.wageCap) && MGR.club.wageCap>0 && Number.isInteger(MGR.club.transfer));
      check('свой '+y+reg+': есть игроки', mgrAll().length>=2, String(mgrAll().length));
      check('свой '+y+reg+': игроки без чужого клуба', mgrAll().every(h=>{ const o=mgrOrgOf(mgrCard(h)); return !o || o===MGR.club.name; }));
      check('свой '+y+reg+': герб в хабе', /<svg/.test(mgrLogo(MGR.club.name, true)));
      mgrOpenHub(); check('свой '+y+reg+': хаб открылся', !bad(document.getElementById('mgBody').innerHTML));
      out.notes['own'+y+reg]={n:mgrAll().length, avg:MGR.club.avg, cash:MGR.club.cash, cap:MGR.club.wageCap};
      localStorage.removeItem('fncsdraft_manager'); MGR=null; mgrLeave(); }
    check('свой: пустое имя — отказ', mgrCreateOwn({name:'  <>  ', color:'#fff000', shape:'round', region:'EU', tier:'rookie'})!==true);
    check('герб svg', /^<svg[\s\S]*<\/svg>$/.test(mgrCrestSVG({color:'#f00000',shape:'round',ini:'TK'}, 40)));
    MGR_NEW_SIDE='real';
  `},
  {name:'каркас', code:String.raw`
    MGR_NEW_YEAR=2024; MGR_NEW_REGION='EU'; MGR_NEW_SIDE='real'; MGR_NEW_SORT='stars'; mgrOpenNew(2024);
    check('выбор: шапка хаба спрятана', document.getElementById('mgTop') && document.getElementById('mgTop').hidden);
    mgrTake(0);
    for(const t of ['centre','squad','transfers','inbox','club','tables']){ mgrRenderHub(t);
      const all=document.getElementById('screen-manager').innerHTML, err=document.querySelector('#mgBody .cc-ffo-err');
      check('вкладка '+t+' '+lang+': без плашки ошибки', !err, err && err.textContent);
      check('вкладка '+t+' '+lang+': без undefined/NaN', !bad(all));
      check('вкладка '+t+': активная подсвечена', !!document.querySelector('#mgTabs .ch-tab.on[data-tab="'+t+'"]')); }
    check('шапка: две полоски', document.querySelectorAll('#mgPurseNow .ch-en').length===2);
    check('шапка: рейтинг команды', /\d/.test(document.getElementById('mgOvr').textContent));
    check('шапка: касса', document.getElementById('mgPurse').textContent.indexOf('$')>=0);
    check('оценка совета', mgrGrade(90)==='A' && mgrGrade(60)==='C' && mgrGrade(10)==='F');
    const saved=mgrTabBody; mgrTabBody=()=>{ throw new Error('проба'); }; mgrRenderHub('centre');
    check('ошибка вкладки → плашка', !!document.querySelector('#mgBody .cc-ffo-err')); mgrTabBody=saved;
    MGR_TAB='market'; mgrOpenHub(); check('старый ключ market → трансферы', MGR_TAB==='transfers');
  `},
  {name:'центр', code:String.raw`
    MGR_NEW_YEAR=2024; MGR_NEW_REGION='EU'; MGR_NEW_SIDE='real'; MGR_NEW_SORT='stars'; mgrOpenNew(2024); mgrTake(0);
    mgrRenderHub('centre');
    const B=document.getElementById('mgBody'), play=B.querySelector('.ch-play');
    check('центр '+lang+': главная кнопка', !!play && /mgrPlay|mgrSeasonReview/.test(play.getAttribute('onclick')||''), play && play.outerHTML.slice(0,120));
    check('центр '+lang+': плитка турнира', !!B.querySelector('.mgc-next'));
    check('центр '+lang+': цели совета', !!B.querySelector('.hg-tile'));
    check('центр '+lang+': развитие', !!B.querySelector('.hd-tile'));
    check('центр '+lang+': новости', !!B.querySelector('.mgc-news'));
    check('центр '+lang+': полоса недели', B.querySelectorAll('.ch-day').length===7, String(B.querySelectorAll('.ch-day').length));
    check('центр '+lang+': без undefined/NaN', !bad(B.innerHTML));
    // Стили хаба карьеры доходят до менеджера: текст на белой плитке не белый, кнопка «Пропустить» видна.
    const col=el=>el ? getComputedStyle(el).color : '';
    const bgc=el=>el ? getComputedStyle(el).backgroundColor : '';
    check('центр: плитка тёмная, как в карьере (белый текст читается)', bgc(B.querySelector('.hg-tile'))!=='rgb(251, 252, 252)', bgc(B.querySelector('.hg-tile'))+' / '+col(B.querySelector('.hg-top b')));
    check('центр: правила карьеры размножены', [...document.styleSheets].some(s=>{ try{ return [...s.cssRules].some(r=>/#screen-manager \.ch-tile/.test(r.cssText||'')); }catch(e){ return false; } }));
    // Новость клуба видна на Центре.
    MGR.inbox.unshift({id:'tst', day:CAREER.career.day, kind:'info', done:'info', text:'ПробнаяНовость'}); mgrRenderHub('centre');
    check('центр: письмо в новостях', B.querySelector('.mgc-news').textContent.indexOf('ПробнаяНовость')>=0);
    // Пропуск турнира остаётся на Центре.
    const d0=CAREER.career.day; mgrSkip();
    check('пропуск: день сдвинулся', CAREER.career.day>=d0);
    check('пропуск: снова Центр', MGR_TAB==='centre' && !!document.querySelector('#mgTabs .ch-tab.on[data-tab="centre"]'));
  `},
  {name:'состав', code:String.raw`
    MGR_NEW_YEAR=2024; MGR_NEW_REGION='EU'; MGR_NEW_SIDE='real'; MGR_NEW_SORT='stars'; mgrOpenNew(2024); mgrTake(0);
    mgrRenderHub('squad');
    const B=document.getElementById('mgBody');
    const cards=B.querySelectorAll('.mgs-card');
    check('состав '+lang+': карточки всех игроков', cards.length===mgrAll().length+(MGR.academy||[]).length, cards.length+'/'+mgrAll().length);
    check('состав '+lang+': карточки FUT', B.querySelectorAll('.mgs-card .fut-card').length===cards.length);
    check('состав '+lang+': без undefined/NaN', !bad(B.innerHTML));
    cards[0].click();
    const sh=document.getElementById('mgSheet');
    check('лист '+lang+': открылся', sh && !sh.hidden && /mgrTalk/.test(sh.innerHTML) && /mgrRelease/.test(sh.innerHTML));
    check('лист '+lang+': без undefined', !bad(sh.innerHTML));
    check('лист: про того игрока', sh.textContent.indexOf(cards[0].dataset.h)>=0, cards[0].dataset.h);
    mgrSheetClose();
    check('лист: закрылся', document.getElementById('mgSheet').hidden);
    // Перестановка из листа: игрок первой команды уходит в запас и состав перерисован.
    const h=MGR.teams[0].cards[0]; mgrSheetOpen(h); mgrSheetClose(); mgrMove(h, '-1');
    check('лист: перестановка в запас', (MGR.bench||[]).indexOf(h)>=0 && MGR_TAB==='squad');
  `},
  {name:'трансферы', code:String.raw`
    MGR_NEW_YEAR=2024; MGR_NEW_REGION='EU'; MGR_NEW_SIDE='real'; MGR_NEW_SORT='stars'; mgrOpenNew(2024); mgrTake(0);
    MGR_SUB.transfers='market'; mgrRenderHub('transfers');
    const B=document.getElementById('mgBody');
    check('трансферы '+lang+': три подвкладки', B.querySelectorAll('.ch-subtabs .ch-subtab').length===3, String(B.querySelectorAll('.ch-subtabs .ch-subtab').length));
    check('трансферы '+lang+': бюджеты на виду', B.querySelector('.mgt-bud') && (B.querySelector('.mgt-bud').textContent.match(/\$/g)||[]).length>=3);
    check('трансферы: звёздочка шортлиста в рынке', !!B.querySelector('.mgt-star'));
    const first=mgrMarketList()[0]; mgrShortToggle(first.handle);
    MGR_SUB.transfers='short'; mgrRenderHub('transfers');
    check('шортлист: игрок там', B.textContent.indexOf(first.handle)>=0, first.handle);
    check('шортлист: число на подвкладке', /·\s*1/.test(B.querySelector('.ch-subtabs').textContent));
    mgrShortToggle(first.handle); check('шортлист: снят', (MGR.short||[]).indexOf(first.handle)<0);
    MGR_SUB.transfers='deals'; mgrRenderHub('transfers');
    check('переговоры '+lang+': без undefined/NaN', !bad(B.innerHTML));
    MGR.inbox.unshift({id:'of1', day:CAREER.career.day, kind:'offer', text:'ПробноеПредложение'}); mgrRenderHub('transfers');
    check('переговоры: предложение за своего видно', B.textContent.indexOf('ПробноеПредложение')>=0);
    MGR_SUB.transfers='market';
  `},
  {name:'вечер', once:true, code:String.raw`
    MGR_NEW_YEAR=2024; MGR_NEW_REGION='EU'; MGR_NEW_SIDE='real'; MGR_NEW_SORT='stars'; mgrOpenNew(2024); mgrTake(0);
    mgrRenderHub('centre');
    const n0=(MGR.log||[]).filter(r=>r.kind==='night').length;
    const tick=setInterval(()=>{
      const go=document.querySelector('[data-mg="go"]'); if(go) go.click();
      const sk=document.getElementById('majorSkipBtn'); if(sk && !sk.disabled) sk.click();
    }, 30);
    document.querySelector('#mgBody .ch-play').click();
    let back=null;
    for(let i=0; i<20000 && !back; i++){ await wait(30); back=[...document.querySelectorAll('button')].find(b=>/careerBackToHub|mgrAfterNight/.test(b.getAttribute('onclick')||'') && b.offsetParent); }
    clearInterval(tick);
    check('вечер: дошёл до итога', !!back);
    if(back){ back.click(); await wait(50);
      check('вечер: записан', (MGR.log||[]).filter(r=>r.kind==='night').length===n0+1);
      check('вечер: вернулся на Центр', MGR_TAB==='centre' && !!document.querySelector('#mgTabs .ch-tab.on[data-tab="centre"]') && document.getElementById('screen-manager').classList.contains('active'));
      check('вечер: результат в новостях', /#\d/.test(document.querySelector('#mgBody .mgc-news').textContent)); }
  `},
];

const only=process.argv[2]||'';
const run=SECTIONS.filter(s=>!only || s.name.indexOf(only)>=0);
const body=run.map(s=>`
      if(${s.once?'lang===\'ru\'':'true'}){ try{ await (async()=>{ ${s.code} })(); }
        catch(e){ out.fails.push('${s.name} ['+lang+']: исключение '+(e && e.stack || e)); }
        try{ localStorage.removeItem('fncsdraft_manager'); MGR=null; if(typeof mgrLeave==='function') mgrLeave(); }catch(e){} }`).join('');
const BOOT=`
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={fails:[], notes:{}, errs:[]};
  window.addEventListener('error', e=>{ out.errs.push(String(e.message)+' @'+e.lineno); });
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d!=null&&d!==''?': '+d:'')); };
  const bad=html=>/undefined|NaN|\\[object /.test(String(html));
  const wait=ms=>new Promise(r=>setTimeout(r, ms));
  try{
    localStorage.removeItem('fncsdraft_manager');
    for(const lang of ['ru','en']){
      LANG=lang;
      ${body}
    }
  }catch(e){ out.fails.push('исключение: '+(e && e.stack || e)); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mgrhub-')), tmp=path.join(dir,'index.html');
fs.writeFileSync(tmp,'<base href="file:///'+ROOT+'/">'+fs.readFileSync(path.join(ROOT,'index.html'),'utf8')+BOOT);
const dom=execFileSync(CHROME,['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files',
  '--virtual-time-budget=900000','--dump-dom','file:///'+tmp.split(String.fromCharCode(92)).join('/')],
  {maxBuffer:1<<30, encoding:'utf8', stdio:['ignore','pipe','ignore'], timeout:1500000});
fs.rmSync(dir,{recursive:true, force:true});
const m=dom.match(/BEGIN([\s\S]*?)END/);
if(!m){ console.log('FAIL нет вывода'); process.exit(2); }
const out=JSON.parse(decodeURIComponent(m[1]));
if(out.errs.length) out.fails.push('JS: '+out.errs.slice(0,3).join(' | '));
if(out.fails.length){ console.log(['FAIL'].concat(out.fails).join(String.fromCharCode(10))); process.exit(1); }
console.log('OK хаб менеджера ('+run.length+' секций)', JSON.stringify(out.notes));
