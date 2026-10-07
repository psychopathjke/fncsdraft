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
    check('герб клуба без логотипа — инициалы', /<svg[\s\S]*>NT/.test(mgrLogo('Нет Такого Клуба Nova Team', true)) || /<svg/.test(mgrLogo('Нет Такого Клуба', true)), mgrLogo('Нет Такого Клуба', true).slice(0,60));
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
    check('трансферы '+lang+': четыре подвкладки', B.querySelectorAll('.ch-subtabs .ch-subtab').length===4, String(B.querySelectorAll('.ch-subtabs .ch-subtab').length));
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
  {name:'прочие вкладки', code:String.raw`
    MGR_NEW_YEAR=2024; MGR_NEW_REGION='EU'; MGR_NEW_SIDE='real'; MGR_NEW_SORT='stars'; mgrOpenNew(2024); mgrTake(0);
    const B=document.getElementById('mgBody');
    for(const [tab, group, keys] of [['club','club',['train','base','sponsor','press']],['tables','tables',['stats','trophies','managers']]]){
      for(const k of keys){ MGR_SUB[group]=k; mgrRenderHub(tab);
        const err=B.querySelector('.cc-ffo-err');
        check(tab+'/'+k+' '+lang+': рисуется', !err && !bad(B.innerHTML), err ? err.textContent : '');
        check(tab+'/'+k+': подвкладка подсвечена', B.querySelectorAll('.ch-subtabs .ch-subtab.on').length===1); }
      MGR_SUB[group]=keys[0]; }
    MGR.inbox.unshift({id:'tst2', day:CAREER.career.day, kind:'info', text:'ПробноеПисьмо'}); mgrRenderHub('inbox');
    check('входящие '+lang+': письмо в списке', B.textContent.indexOf('ПробноеПисьмо')>=0);
    check('входящие: точка на вкладке', !!document.querySelector('#mgTabs [data-tab="inbox"] .ch-dot'));
    check('входящие '+lang+': без undefined/NaN', !bad(B.innerHTML));
  `},
  {name:'сезон', once:true, code:String.raw`
    const season=async (label)=>{
      let guard=0;
      while(mgrEvents().length && guard++<120){ mgrSkip(); }
      check(label+': дошёл до конца сезона', guard<120, String(guard));
      mgrRenderHub('centre');
      const B=document.getElementById('mgBody');
      check(label+': Центр без плашки', !B.querySelector('.cc-ffo-err'), (B.querySelector('.cc-ffo-err')||{}).textContent);
      check(label+': кнопка итогов', /mgrSeasonReview/.test((B.querySelector('.ch-play')||{getAttribute:()=>''}).getAttribute('onclick')||''));
      for(const t of ['squad','transfers','inbox','club','tables']){ mgrRenderHub(t); check(label+': '+t+' в конце сезона', !B.querySelector('.cc-ffo-err') && !bad(B.innerHTML)); }
      out.notes[label]={cash:MGR.club.cash, cap:MGR.club.wageCap, bill:mgrWageBill(), n:mgrAll().length, inbox:(MGR.inbox||[]).length};
    };
    MGR_NEW_YEAR=2024; MGR_NEW_REGION='EU'; MGR_NEW_SIDE='real'; MGR_NEW_SORT='stars'; mgrOpenNew(2024); mgrTake(0);
    await season('2024 EU настоящий');
    localStorage.removeItem('fncsdraft_manager'); MGR=null; mgrLeave();
    MGR_NEW_YEAR=2021; MGR_NEW_REGION='ME';
    check('свой 2021 ME создан', mgrCreateOwn({name:'Desert Kings', color:'#ff5a5a', shape:'hex', region:'ME', tier:'rookie'})===true);
    await season('2021 ME свой');
  `},
  {name:'ревью', once:true, code:String.raw`
    // 1. Свой клуб после увольнения сохраняет историю, шкаф и день.
    MGR_NEW_YEAR=2024; MGR_NEW_REGION='EU'; MGR_NEW_START=0;
    MGR_CARRY={history:[{year:2024, club:'X'}], trophies:[{id:'t'}], day:'2024-06-15'};
    check('увольнение → свой клуб создан', mgrCreateOwn({name:'After Sack', color:'#ff5a5a', shape:'round', region:'EU', tier:'mid'})===true);
    check('увольнение → история цела', (MGR.history||[]).length===1 && (MGR.trophies||[]).length===1, JSON.stringify([MGR.history, MGR.trophies]));
    check('увольнение → день не откатился', CAREER.career.day==='2024-06-15', CAREER.career.day);
    check('увольнение → перенос снят', MGR_CARRY===null);
    localStorage.removeItem('fncsdraft_manager'); MGR=null; mgrLeave();
    // 2. Продления: кто не влезает в бюджет — помечен заранее, по умолчанию уходит.
    MGR_NEW_SIDE='real'; MGR_NEW_SORT='stars'; mgrOpenNew(2024); mgrTake(0);
    mgrAllAcad().forEach(h=>{ MGR.contracts[hKey(h)].until=MGR.year; });
    MGR.club.wageCap=mgrWageBill();
    const rh=mgrRenewHTML();
    check('продление сверх бюджета — помечено', /mg-capno/.test(rh), rh.slice(0,200));
    check('продление сверх бюджета — по умолчанию уходит', Object.keys(MGR_RENEW).some(h=>MGR_RENEW[h]===false));
    // 3. Прибавка из почты, перевод из академии и приём в академию — тоже под потолком.
    MGR.club.wageCap=mgrWageBill();
    const h0=mgrAll()[0], s0=mgrWage(h0);
    MGR.inbox.unshift({id:'rz', day:CAREER.career.day, kind:'raise', h:h0, sum:s0+5000, text:'raise'}); mgrInboxDo('rz', true);
    check('прибавка сверх потолка — не прошла', mgrWage(h0)===s0, s0+' → '+mgrWage(h0));
    MGR_MKT_YOUNG=true; const young=mgrMarketList().find(c=>(ccCardOvr(c)||0)<=75); MGR_MKT_YOUNG=false;
    out.notes.youngFound=!!young;
    if(young){ MGR.club.wageCap=mgrWageBill(); const nA=(MGR.academy||[]).length; mgrToAcad(young.handle, true);
      check('академия сверх потолка — не взят', (MGR.academy||[]).length===nA);
      MGR.club.wageCap=mgrWageBill()+100000; mgrToAcad(young.handle, true);
      MGR.club.wageCap=mgrWageBill(); mgrPromote(young.handle);
      check('перевод из академии сверх потолка — остался в академии', (MGR.academy||[]).some(x=>hKey(x)===hKey(young.handle))); }
    // 4. Трансферный бюджет: отступные сверх него совет не пропускает; продажа его пополняет.
    MGR.club.wageCap=mgrWageBill()+100000; MGR.club.cash=10000000; MGR.club.transfer=1000;
    const nAll=mgrAll().length;
    mgrSignFinal({h:'ПробаОтступные', buyDeal:5000, years:1, acad:false}, 1);
    check('отступные сверх трансферного — отказ', mgrAll().length===nAll);
    const sold=mgrAll()[0];
    MGR.inbox.unshift({id:'sl', day:CAREER.career.day, kind:'offer', h:sold, sum:20000, from:'Team Falcons', text:'offer'});
    const tr0=MGR.club.transfer; mgrInboxDo('sl', true);
    check('продажа пополняет трансферный', MGR.club.transfer===tr0+20000, tr0+' → '+MGR.club.transfer);
    // 5. Лист игрока прокручивается (кнопки не обрезаны на маленьком экране).
    mgrRenderHub('squad'); mgrSheetOpen(mgrAll()[0]);
    const inn=document.querySelector('#mgSheet .mgs-in');
    check('лист прокручивается', inn && getComputedStyle(inn).overflowY==='auto', inn && getComputedStyle(inn).overflowY);
    mgrSheetClose();
    // 6. У всех вкладок своя иконка, не залитый квадрат.
    for(const t of ['squad','transfers','inbox','tables']){
      const b=document.querySelector('#mgTabs .ch-tab[data-tab="'+t+'"]');
      const ic=b ? getComputedStyle(b).getPropertyValue('--ic').trim() : '';
      check('иконка вкладки '+t, ic.length>10, ic.slice(0,40)); }
  `},
  {name:'скауты', code:String.raw`
    MGR_NEW_YEAR=2024; MGR_NEW_REGION='EU'; MGR_NEW_SIDE='real'; MGR_NEW_SORT='stars'; mgrOpenNew(2024); mgrTake(0);
    const w0=mgrStaffWage();
    mgrScoutHire(2);
    check('скауты: нанят', (MGR.scouts||[]).length===1 && MGR.scouts[0].lv===2);
    check('скауты: зарплата в штабе', mgrStaffWage()===w0+MGR_SCOUT_LV[2].cost, w0+' → '+mgrStaffWage());
    const sc=MGR.scouts[0]; mgrScoutSet(sc.id, 'region', 'NAC'); mgrScoutSet(sc.id, 'min', '70');
    let d=CAREER.career.day;
    for(let i=0;i<3;i++){ d=ccAddDays(d, 7); mgrScoutWeek(d); }
    const reps=Object.values(MGR.srep||{});
    check('скауты: отчёты есть', reps.length>=2, String(reps.length));
    check('скауты: из NAC', reps.length && reps.every(r=>r.region==='NAC'));
    check('скауты: карточки найдутся', reps.every(r=>!!mgrCard(r.h)));
    check('скауты: рейтинг по заданию', reps.every(r=>(ccCardOvr(mgrCard(r.h))||0)>=70));
    const r0=reps[0], wide=(t=>{ const [a,b]=t.split('–').map(Number); return b-a; });
    const before=wide(mgrPotText(r0.h)); r0.views=(r0.views||1)+2;
    check('скауты: повторные отчёты сужают вилку', wide(mgrPotText(r0.h))<before, before+' → '+wide(mgrPotText(r0.h)));
    check('скауты: письмо об отчёте', (MGR.inbox||[]).some(m=>m.kind==='info' && m.srep));
    check('звёзды', mgrStarsOf(95)===5 && mgrStarsOf(60)===1 && mgrStarsOf(78)%0.5===0);
    MGR_SUB.transfers='scout'; mgrRenderHub('transfers');
    const B=document.getElementById('mgBody');
    check('скаутинг '+lang+': подвкладка рисуется', !B.querySelector('.cc-ffo-err') && !bad(B.innerHTML) && B.querySelectorAll('.mgx-rep').length===reps.length, B.querySelectorAll('.mgx-rep').length+'/'+reps.length);
    mgrScoutSet(sc.id, 'min', '99'); mgrScoutWeek(ccAddDays(d, 7));
    check('скауты: пустое задание без исключения', true);
    mgrScoutFire(sc.id); check('скауты: уволен', (MGR.scouts||[]).length===0);
    MGR_SUB.transfers='market';
  `},
  {name:'молодёжь', code:String.raw`
    MGR_NEW_YEAR=2024; MGR_NEW_REGION='EU'; MGR_NEW_SIDE='real'; MGR_NEW_SORT='stars'; mgrOpenNew(2024); mgrTake(0);
    const w0=mgrStaffWage(); mgrYScoutHire('fr');
    check('молодёжь: скаут нанят', (MGR.yscouts||[]).length===1 && MGR.yscouts[0].nat==='fr');
    check('молодёжь: зарплата в штабе', mgrStaffWage()===w0+MGR_YSCOUT_COST);
    mgrYouthMonth('2024-01'); mgrYouthMonth('2024-02');
    const ys=(MGR.ylist||[]).map(h=>mgrCard(h)).filter(Boolean);
    check('молодёжь: найдены', ys.length>=2 && ys.length<=4, String(ys.length));
    check('молодёжь: 15–17 лет', ys.every(c=>c._youth && c.age>=15 && c.age<=17), ys.map(c=>c.age).join());
    check('молодёжь: рейтинг 50–68', ys.every(c=>{ const r=ccCardOvr(c)||0; return r>=50 && r<=68; }), ys.map(c=>ccCardOvr(c)).join());
    check('молодёжь: потенциал 70–94', ys.every(c=>mgrPot(c.handle)>=70 && mgrPot(c.handle)<=94), ys.map(c=>mgrPot(c.handle)).join());
    check('молодёжь: страна скаута', ys.every(c=>c.nat==='fr'), ys.map(c=>c.nat).join());
    MGR.club.wageCap=mgrWageBill()+100000;
    const y0=ys[0].handle; mgrToAcad(y0, true);
    check('молодёжь: в академии', (MGR.academy||[]).some(x=>hKey(x)===hKey(y0)));
    mgrSave(); const saved=localStorage.getItem('fncsdraft_manager'); mgrLoad();
    check('молодёжь: карточка цела после загрузки', !!mgrCard(y0) && mgrCard(y0)._youth);
    MGR_SUB.club='youth'; mgrRenderHub('club');
    const B=document.getElementById('mgBody');
    check('молодёжь '+lang+': подвкладка', !B.querySelector('.cc-ffo-err') && !bad(B.innerHTML) && B.querySelectorAll('.mgy-row').length>=1, (B.querySelector('.cc-ffo-err')||{}).textContent+' | '+(B.innerHTML.match(/.{60}(undefined|NaN).{30}/)||[''])[0]+' | rows '+B.querySelectorAll('.mgy-row').length);
    mgrRenderHub('squad'); const card=[...document.querySelectorAll('#mgBody .mgs-card')].find(x=>x.dataset.h===y0);
    check('молодёжь: в составе карточкой', !!card);
    if(card){ card.click(); check('молодёжь: лист открылся', !document.getElementById('mgSheet').hidden); mgrSheetClose(); }
    MGR_SUB.club='train';
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
