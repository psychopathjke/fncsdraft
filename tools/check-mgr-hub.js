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
    // Всё из части 2 включено: скаут в чужом регионе, молодёжный скаут, план, аренда.
    mgrScoutHire(3); mgrScoutSet(MGR.scouts[0].id, 'region', 'BR'); mgrYScoutHire('de');
    mgrPlanSet(mgrAll()[0], 'focus', true); mgrPlanSet(mgrAll()[0], 'role', 'roleFRG');
    if((MGR.bench||[]).length) mgrLoan(MGR.bench[0]);
    await season('2024 EU настоящий');
    check('сезон: отчёты скаута', Object.keys(MGR.srep||{}).length>=5, String(Object.keys(MGR.srep||{}).length));
    check('сезон: молодёжь найдена', (MGR.ylist||[]).length>=5, String((MGR.ylist||[]).length));
    check('сезон: аренда вернулась', !(MGR.loanOut||[]).length);

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
    MGR.club.avg=95; mgrScoutHire(1); check('скауты: стартовый «рейтинг от» по уровню клуба', MGR.scouts[0].min===88, String(MGR.scouts[0].min)); mgrScoutFire(MGR.scouts[0].id);
    mgrYScoutHire('br'); MGR_SUB.club='youth'; mgrRenderHub('club');
    const opt=document.querySelector('#mgBody .mgx-scout select option:checked');
    check('молодёжный скаут: его страна выбрана в списке', opt && opt.value===ccNatOf('br'), opt && opt.value); MGR_SUB.club='train';
    MGR_SUB.transfers='market';
  `},
  {name:'молодёжь', code:String.raw`
    MGR_NEW_YEAR=2024; MGR_NEW_REGION='EU'; MGR_NEW_SIDE='real'; MGR_NEW_SORT='stars'; mgrOpenNew(2024); mgrTake(0);
    const w0=mgrStaffWage(); mgrYScoutHire('fr');
    check('молодёжь: скаут нанят', (MGR.yscouts||[]).length===1 && MGR.yscouts[0].nat===ccNatOf('fr'));
    check('молодёжь: зарплата в штабе', mgrStaffWage()===w0+MGR_YSCOUT_COST);
    mgrYouthMonth('2024-01'); mgrYouthMonth('2024-02');
    const ys=(MGR.ylist||[]).map(h=>mgrCard(h)).filter(Boolean);
    check('молодёжь: найдены', ys.length>=2 && ys.length<=4, String(ys.length));
    check('молодёжь: 15–17 лет', ys.every(c=>c._youth && c.age>=15 && c.age<=17), ys.map(c=>c.age).join());
    check('молодёжь: рейтинг 50–68', ys.every(c=>{ const r=ccCardOvr(c)||0; return r>=50 && r<=68; }), ys.map(c=>ccCardOvr(c)).join());
    check('молодёжь: потенциал 70–94', ys.every(c=>mgrPot(c.handle)>=70 && mgrPot(c.handle)<=94), ys.map(c=>mgrPot(c.handle)).join());
    check('молодёжь: страна скаута', ys.every(c=>c.nat===ccNatOf('fr')), ys.map(c=>c.nat).join());
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
  {name:'план', code:String.raw`
    MGR_NEW_YEAR=2024; MGR_NEW_REGION='EU'; MGR_NEW_SIDE='real'; MGR_NEW_SORT='stars'; mgrOpenNew(2024); mgrTake(0);
    const h=mgrAll()[0], was=attrsFor(mgrCard(h)).roleKey, want=was==='roleIGL' ? 'roleFRG' : 'roleIGL';
    mgrPlanSet(h, 'role', want);
    check('план: записан', MGR.plan && MGR.plan[hKey(h)] && MGR.plan[hKey(h)].role===want);
    check('план: роль ещё прежняя', attrsFor(mgrCard(h)).roleKey===was);
    let d=CAREER.career.day; for(let i=0;i<7;i++){ d=ccAddDays(d, 7); mgrPlanWeek(d); }
    check('план: за 7 недель ещё не сменилась', attrsFor(mgrCard(h)).roleKey===was);
    d=ccAddDays(d, 7); mgrPlanWeek(d);
    check('план: через 8 недель роль сменилась', attrsFor(mgrCard(h)).roleKey===want, attrsFor(mgrCard(h)).roleKey);
    check('план: письмо', (MGR.inbox||[]).some(m=>m.plan));
    // Упор в рост ускоряет развитие (замер на 300 месяцах на молодом игроке).
    const g=mgrAll().map(x=>({x, r:ccCardOvr(mgrCard(x))||99})).sort((a,b)=>a.r-b.r)[0].x;
    const grow=(focus)=>{ MGR.dev={}; mgrPlanSet(g, 'focus', focus); let n=0; for(let m=0;m<300;m++){ const before=(MGR.dev[hKey(g)]||0); MGR.dev[hKey(g)]=0; mgrDevelop('t'+m+'-'+(focus?1:0)); n+=(MGR.dev[hKey(g)]||0); MGR.dev[hKey(g)]=before; } return n; };
    const slow=grow(false), fast=grow(true);
    check('план: упор ускоряет рост', fast>slow*1.2, slow+' → '+fast);
    mgrRenderHub('squad'); mgrSheetOpen(h);
    const sh=document.getElementById('mgSheet');
    check('план '+lang+': в листе', /mgrPlanSet/.test(sh.innerHTML) && !bad(sh.innerHTML)); mgrSheetClose();
  `},
  {name:'аренда', code:String.raw`
    MGR_NEW_YEAR=2024; MGR_NEW_REGION='EU'; MGR_NEW_SIDE='real'; MGR_NEW_SORT='stars'; mgrOpenNew(2024); mgrTake(0);
    const h=(MGR.bench||[])[0] || mgrAll()[mgrAll().length-1];
    if(MGR.bench.indexOf(h)<0) mgrMove(h, '-1');
    const w=mgrWage(h);
    check('аренда: из команды нельзя', mgrLoan(MGR.teams[0].cards[0])===false);
    check('аренда: отдан', mgrLoan(h)===true);
    check('аренда: нет в составе', mgrAll().every(x=>hKey(x)!==hKey(h)) && !(MGR.academy||[]).some(x=>hKey(x)===hKey(h)));
    check('аренда: платим половину', mgrWage(h)===Math.round(w*0.5), w+' → '+mgrWage(h));
    check('аренда: в ведомости', mgrWageBill()>=Math.round(w*0.5));
    mgrRenderHub('squad');
    check('аренда '+lang+': плитка «В аренде»', !!document.querySelector('#mgBody .mgs-loan') && document.getElementById('mgBody').textContent.indexOf(h)>=0);
    let d=CAREER.career.day; mgrLoanWeek(ccAddDays(d, 21));
    check('аренда: 21 день — ещё в аренде', (MGR.loanOut||[]).some(x=>hKey(x)===hKey(h)));
    mgrLoanWeek(ccAddDays(d, 28));
    check('аренда: 28 дней — вернулся в запас', (MGR.bench||[]).some(x=>hKey(x)===hKey(h)) && !(MGR.loanOut||[]).length);
    check('аренда: полная зарплата снова', mgrWage(h)===w);
    check('аренда: письмо о возвращении', (MGR.inbox||[]).some(m=>m.loan));
  `},
  {name:'награды', once:true, code:String.raw`
    MGR_NEW_YEAR=2024; MGR_NEW_REGION='EU'; MGR_NEW_SIDE='real'; MGR_NEW_SORT='stars'; mgrOpenNew(2024); mgrTake(0);
    const [a, b]=mgrAll(), day=CAREER.career.day, mk=day.slice(0, 7);
    MGR.log.unshift({day, kind:'night', name:'N1', teams:[{place:3, prize:0, kills:{[a]:9, [b]:2}}]});
    MGR.log.unshift({day, kind:'night', name:'N2', teams:[{place:5, prize:0, kills:{[a]:4, [b]:3}}]});
    mgrAwardsMonth(mk);
    const pom=(MGR.awards||[]).filter(x=>x.kind==='pom');
    check('награды: игрок месяца', pom.length===1 && pom[0].h===a && pom[0].kills===13, JSON.stringify(pom));
    mgrAwardsMonth(mk); check('награды: месяц не дублируется', (MGR.awards||[]).filter(x=>x.kind==='pom').length===1);
    check('награды: письмо', (MGR.inbox||[]).some(m=>m.award));
    let err=null; try{ mgrSeasonReview(); }catch(e){ err=e; }
    check('итоги сезона открываются', !err, err && String(err));
    document.querySelectorAll('.mg-modal, [data-mg]').forEach(x=>{ const m=x.closest('.mg-modal-wrap,.mg-modal'); if(m) m.remove(); });
    const yr=(MGR.awards||[]).filter(x=>x.kind==='poy');
    check('награды: игрок года', yr.length===1 && yr[0].h===a, JSON.stringify(yr));
    try{ mgrSeasonReview(); }catch(e){}
    check('награды: год не дублируется', (MGR.awards||[]).filter(x=>x.kind==='poy').length===1);
    check('награды: в шкафу трофеев', (MGR.trophies||[]).some(t=>String(t.name).indexOf(a)>=0));
    document.querySelectorAll('.mg-modal').forEach(m=>m.remove());
    MGR_SUB.tables='trophies'; mgrRenderHub('tables');
    check('награды: видны в «Трофеях»', document.getElementById('mgBody').textContent.indexOf(a)>=0);
    MGR_SUB.tables='stats';
    // Итоги → следующий сезон: кнопка в окне ведёт в новый год, хаб открывается.
    MGR.board.earn=0; MGR.board.best=1; MGR.board.place=10;   // цели выполнены — не увольняют
    const y0=MGR.year, n0=mgrAll().length; let e2=null;
    try{ mgrSeasonReview(); }catch(e){ e2=e; }
    const go=document.querySelector('.mg-modal [data-mg="go"]'); if(go) go.click();
    await wait(300);
    check('следующий сезон: без ошибки', !e2 && !out.errs.length, (e2 && String(e2))||out.errs.join(' | '));
    check('следующий сезон: год +1', MGR && MGR.year===y0+1, MGR && MGR.year);
    check('следующий сезон: состав на месте', MGR && mgrAll().length>=1, MGR && mgrAll().length+' из '+n0);
    if(MGR){ mgrRenderHub('centre'); check('следующий сезон: хаб', !document.querySelector('#mgBody .cc-ffo-err')); }
    document.querySelectorAll('.mg-modal').forEach(m=>m.remove());
  `},
  {name:'ревью2', once:true, code:String.raw`
    MGR_NEW_YEAR=2024; MGR_NEW_REGION='EU'; MGR_NEW_SIDE='real'; MGR_NEW_SORT='stars'; mgrOpenNew(2024); mgrTake(0);
    // 1. Игрок в аренде — свой: не на рынке, второй раз не берётся.
    MGR_MKT_YOUNG=true; const yc=mgrMarketList().find(c=>(ccCardOvr(c)||0)<=75); MGR_MKT_YOUNG=false;
    MGR.club.wageCap=mgrWageBill()+100000; MGR.club.transfer=1e7; MGR.club.cash=1e7;
    if(yc){ mgrToAcad(yc.handle, true); mgrLoan(yc.handle);
      check('аренда: не на рынке', !mgrMarketList().some(c=>hKey(c)===hKey(yc)) && !(MGR_MKT_YOUNG=true, mgrMarketList()).some(c=>hKey(c)===hKey(yc))); MGR_MKT_YOUNG=false;
      mgrToAcad(yc.handle, true);
      check('аренда: второй раз в академию не берётся', !(MGR.academy||[]).some(x=>hKey(x)===hKey(yc))); }
    // 2. Снимок скаута маленький.
    mgrScoutHire(3); mgrScoutSet(MGR.scouts[0].id, 'region', 'NAC'); mgrScoutSet(MGR.scouts[0].id, 'min', '0');
    mgrScoutWeek(ccAddDays(CAREER.career.day, 7));
    const ks=Object.keys(MGR.ext||{});
    check('скаут: снимки есть', ks.length>=1);
    check('скаут: снимок маленький', ks.every(k=>JSON.stringify(MGR.ext[k]).length<2500), ks.map(k=>JSON.stringify(MGR.ext[k]).length).join());
    check('скаут: снимок играет', ks.every(k=>(ccCardOvr(mgrCard(MGR.ext[k].handle))||0)>0));
    mgrScoutHire(3); mgrScoutHire(3); MGR.scouts.forEach(s=>{ s.region='BR'; s.min=0; });
    for(let i=0;i<40;i++) mgrScoutWeek(ccAddDays(CAREER.career.day, 7*(i+2)));
    check('скаут: отчётов не больше 60', Object.keys(MGR.srep).length<=60, String(Object.keys(MGR.srep).length));
    check('скаут: снимков не больше отчётов', Object.keys(MGR.ext).filter(k=>!MGR.ext[k]._youth).length<=60, String(Object.keys(MGR.ext).length));
    check('скаут: сейв меньше 400 КБ', JSON.stringify(MGR).length<400000, String(JSON.stringify(MGR).length));
    MGR.scouts=[];
    // 3. Молодой при росте сохраняет роль и профиль.
    MGR.yscouts=[]; mgrYScoutHire('fr'); mgrYouthMonth('2024-03');
    const y=MGR.ylist[MGR.ylist.length-1], yc0=mgrCard(y), role=attrsFor(yc0).roleKey, r0=ccCardOvr(yc0);
    MGR.dev=MGR.dev||{}; MGR.dev[hKey(y)]=3;
    const yc1=mgrCard(y);
    check('молодой: роль при росте', attrsFor(yc1).roleKey===role, role+' → '+attrsFor(yc1).roleKey);
    check('молодой: рейтинг вырос на 3', Math.round(ccCardOvr(yc1))===Math.round(r0)+3, r0+' → '+ccCardOvr(yc1));
    // 4. Аренда — ровно 28 дней, даже если дни идут не неделями.
    const bh=(MGR.bench||[])[0];
    if(bh){ const d0=CAREER.career.day; mgrLoan(bh); for(let s=5; s<=30; s+=5) mgrAdvanceTo(ccAddDays(d0, s));
      check('аренда: вернулся к 30-му дню', !mgrOnLoan(bh));
      const m=(MGR.inbox||[]).find(x=>x.loan && x.text.indexOf(bh)>=0);
      check('аренда: письмо датой возвращения', m && m.day===ccAddDays(d0, 28), m && m.day); }
    // 5. Тёзка из чужого региона не подменяет своего.
    const eu=mgrAll()[0], real=ccCardOvr(mgrCardBase(eu));
    MGR.ext[hKey(eu)]={handle:eu, region:'BR', rating:41, _targetOvr:41, _attrs:ccRookieAttrs(41, 'roleIGL')};
    check('тёзка: свой игрок не подменён', ccCardOvr(mgrCardBase(eu))===real, real+' → '+ccCardOvr(mgrCardBase(eu)));
    delete MGR.ext[hKey(eu)];
    // 6. Невыполненные письма не вытесняются отчётами.
    MGR.inbox.unshift({id:'keep', day:CAREER.career.day, kind:'offer', h:eu, sum:1, text:'ВажноеПредложение'});
    for(let i=0;i<40;i++) MGR.inbox.unshift({id:'i'+i, day:CAREER.career.day, kind:'info', done:'info', text:'шум '+i});
    mgrWeekly(CAREER.career.day, ccAddDays(CAREER.career.day, 7));
    check('почта: невыполненное письмо цело', (MGR.inbox||[]).some(m=>m.id==='keep'));
  `},
  {name:'мелочи', once:true, code:String.raw`
    MGR_NEW_YEAR=2024; MGR_NEW_REGION='EU'; MGR_NEW_SIDE='real'; MGR_NEW_SORT='stars'; mgrOpenNew(2024); mgrTake(0);
    MGR.club.wageCap=mgrWageBill()+100000; MGR.club.transfer=1e7; MGR.club.cash=1e7;
    // 1. Молодые стареют с сезонами.
    mgrYScoutHire('fr'); mgrYouthMonth('2024-04');
    const y=MGR.ylist[MGR.ylist.length-1], a0=mgrAgeNow(y);
    MGR.year+=1; check('молодые стареют', mgrAgeNow(y)===a0+1, a0+' → '+mgrAgeNow(y)); MGR.year-=1;
    // 2. Контракт игрока в аренде попадает в продления.
    const bh=(MGR.bench||[])[0];
    if(bh){ mgrLoan(bh); MGR.contracts[hKey(bh)].until=MGR.year;
      mgrRenewHTML(); check('аренда: контракт в продлениях', Object.keys(MGR_RENEW).some(h=>hKey(h)===hKey(bh))); }
    // 3. Клуб аренды слабее своего.
    if(bh){ const l=MGR.loans[hKey(bh)]; const avgOf=o=>{ const ps=(ccSceneRoster(MGR.region)||[]).filter(c=>mgrOrgOf(c)===o).map(c=>ccCardOvr(c)||0).sort((a,b)=>b-a).slice(0,6); return ps.length ? ps.reduce((s,v)=>s+v,0)/ps.length : 0; };
      check('аренда: клуб слабее', avgOf(l.to)<(MGR.club.avg||0), l.to+' '+Math.round(avgOf(l.to))+' vs '+MGR.club.avg); }
    // 4. Id скаутов не совпадают при найме подряд.
    MGR.scouts=[]; mgrScoutHire(1); mgrScoutHire(1); mgrScoutFire(MGR.scouts[0].id); mgrScoutHire(1);
    check('id скаутов уникальны', new Set(MGR.scouts.map(s=>s.id)).size===MGR.scouts.length, MGR.scouts.map(s=>s.id).join());
    MGR.scouts=[];
    // 5. Последний месяц сезона получает игрока месяца на итогах.
    const a=mgrAll()[0], mk=CAREER.career.day.slice(0,7);
    MGR.log.unshift({day:CAREER.career.day, kind:'night', name:'Last', teams:[{place:2, prize:0, kills:{[a]:7}}]});
    MGR.board.earn=0; MGR.board.best=1; MGR.board.place=10;
    try{ mgrSeasonReview(); }catch(e){}
    document.querySelectorAll('.mg-modal').forEach(m=>m.remove());
    check('последний месяц: игрок месяца', (MGR.awards||[]).some(x=>x.kind==='pom' && x.month===mk));
    // 6. Подписанный из чужого региона в новом году получает карточку нового года.
    const ext=Object.values(MGR.ext||{}).find(c=>!c._youth);
    MGR.scouts=[]; mgrScoutHire(3); mgrScoutSet(MGR.scouts[0].id, 'region', 'NAC'); mgrScoutSet(MGR.scouts[0].id, 'min', '80');
    mgrScoutWeek(ccAddDays(CAREER.career.day, 7));
    const f=Object.values(MGR.srep).find(r=>r.region==='NAC');
    if(f){ MGR.bench.push(f.h); mgrContract(f.h);
      const y0=mgrCard(f.h).date; MGR.year=2025; MGR.shadow=mgrShadow(2025, MGR.region); MGR_ACTIVE=false; mgrEnter();
      mgrExtRefresh();
      const y1=mgrCard(f.h).date;
      check('иностранец: карточка нового года', String(y1)!==String(y0) || ccCardYear(mgrCard(f.h))===2025, y0+' → '+y1); }
  `},
  {name:'календарь', code:String.raw`
    MGR_NEW_YEAR=2024; MGR_NEW_REGION='EU'; MGR_NEW_SIDE='real'; MGR_NEW_SORT='stars'; mgrOpenNew(2024); mgrTake(0);
    MGR_MONTH=null; mgrRenderHub('calendar');
    const B=document.getElementById('mgBody');
    check('календарь '+lang+': вкладка есть', !!document.querySelector('#mgTabs .ch-tab[data-tab="calendar"]'));
    check('календарь '+lang+': сетка месяца', B.querySelectorAll('.cal-day:not(.cal-void)').length>=28, String(B.querySelectorAll('.cal-day').length));
    check('календарь '+lang+': без undefined/NaN', !bad(B.innerHTML) && !B.querySelector('.cc-ffo-err'));
    const nx=mgrEvents()[0];
    // Листаем до месяца ближайшего турнира — он там подписан.
    for(let i=0;i<12 && B.innerHTML.indexOf(esc(nx.name))<0;i++){ mgrMonthShift(1); }
    check('календарь: ближайший турнир в сетке', B.innerHTML.indexOf(esc(nx.name))>=0, nx.name);
    // Сыгранный вечер — с местом.
    MGR.log.unshift({day:CAREER.career.day, kind:'night', name:'ПробныйВечер', teams:[{place:4, prize:0}]});
    MGR_MONTH=null; mgrRenderHub('calendar');
    check('календарь: прошедший вечер с местом', /#4/.test(B.textContent) && B.textContent.indexOf('ПробныйВечер')>=0);
    check('центр: список ближайших турниров', (mgrRenderHub('centre'), !!document.querySelector('#mgBody .mgc-cal')));
  `},
  {name:'штаб', code:String.raw`
    MGR_NEW_YEAR=2024; MGR_NEW_REGION='EU'; MGR_NEW_SIDE='real'; MGR_NEW_SORT='stars'; mgrOpenNew(2024); mgrTake(0);
    MGR_SUB.club='train'; mgrRenderHub('club');
    const B=document.getElementById('mgBody');
    check('штаб '+lang+': настоящие коучи на выбор', CC_COACHES.every(c=>B.innerHTML.indexOf(esc(c.name))>=0));
    check('штаб '+lang+': настоящие SMM на выбор', CC_SMM.every(m=>B.innerHTML.indexOf(esc(m.name))>=0));
    check('штаб: фото', B.querySelectorAll('.mgf-person img').length>=CC_COACHES.length+CC_SMM.length);
    const w0=mgrStaffWage();
    mgrHirePerson('coach', 'bloodx'); mgrHirePerson('smm', 'sweety');
    check('штаб: коуч нанят', (MGR.staffWho||{}).coach==='bloodx' && mgrStaff('coach')>=1 && mgrStaff('coach')<=3, JSON.stringify(MGR.staffWho)+' '+mgrStaff('coach'));
    check('штаб: SMM нанят', (MGR.staffWho||{}).smm==='sweety' && mgrStaff('smm')>=1);
    const cc=CC_COACHES.find(c=>c.id==='bloodx'), sm=ccSmmTermsOf(CC_SMM.find(m=>m.id==='sweety'));
    check('штаб: ставка — его условия', mgrStaffWage()===w0+cc.cost+sm.cost, w0+' → '+mgrStaffWage()+' (ждали +'+(cc.cost+sm.cost)+')');
    check('штаб: лучший коуч выше уровнем слабого', mgrPersonTier('coach', CC_COACHES[0])>=mgrPersonTier('coach', CC_COACHES[CC_COACHES.length-1]));
    mgrRenderHub('club'); check('штаб: нанятый подсвечен', !!B.querySelector('.mgf-person.on'));
    mgrHirePerson('coach', null); check('штаб: уволен', !mgrStaff('coach') && !(MGR.staffWho||{}).coach);
    check('штаб '+lang+': без undefined', !bad(B.innerHTML));
  `},
  {name:'после 2026', once:true, code:String.raw`
    MGR_NEW_YEAR=2026; MGR_NEW_REGION='EU'; MGR_NEW_SIDE='real'; MGR_NEW_SORT='stars'; mgrOpenNew(2026); mgrTake(0);
    MGR.board.earn=0; MGR.board.best=1; MGR.board.place=10;
    let e=null; try{ mgrSeasonReview(); }catch(x){ e=x; }
    const go=document.querySelector('.mg-modal [data-mg="go"]'); if(go) go.click();
    await wait(300);
    check('2026 → 2027: без ошибки', !e && !out.errs.length, (e&&String(e))||out.errs.join(' | '));
    check('2026 → 2027: тот же клуб, год 2027', MGR && MGR.year===2027, MGR && MGR.year);
    if(MGR){
      check('2027: турниры есть', mgrEvents().length>=5, String(mgrEvents().length));
      check('2027: состав на месте', mgrAll().length>=2);
      mgrRenderHub('centre'); check('2027: хаб', !document.querySelector('#mgBody .cc-ffo-err') && document.getElementById('mgWho').textContent.indexOf('2027')>=0, document.getElementById('mgWho').textContent);
      check('2027: данные года — 2026', mgrDataYear()===2026);
      // Старение: 33-летний за год заметно падает, 20-летний — нет.
      const old=mgrAll()[0];
      MGR.ageFix={[hKey(old)]:34}; MGR.dev={};
      for(let m=1;m<=12;m++) mgrAgeMonth('2027-'+String(m).padStart(2,'0'));
      check('старение: 34-летний упал', (MGR.dev[hKey(old)]||0)<=-2, String(MGR.dev[hKey(old)]));
      // Уход из профи на стыке: 36-летний почти всегда.
      let gone=0; for(let i=0;i<20;i++){ if(mgrRetireRoll('x'+i, 36)) gone++; }
      check('уход: 36 лет — чаще половины', gone>=10, String(gone));
      let young=0; for(let i=0;i<20;i++){ if(mgrRetireRoll('y'+i, 22)) young++; }
      check('уход: 22 года — никогда', young===0);
    }
    document.querySelectorAll('.mg-modal').forEach(m=>m.remove());
  `},
  {name:'криэйторы', code:String.raw`
    MGR_NEW_YEAR=2024; MGR_NEW_REGION='EU'; MGR_NEW_SIDE='real'; MGR_NEW_SORT='stars'; mgrOpenNew(2024); mgrTake(0);
    const list=mgrCreatorList();
    check('криэйторы: настоящие из Про-Ама региона', list.length>=10 && list.every(c=>CC_PROAM_TWITCH[c.name]), String(list.length));
    const small=list.slice().sort((a,b)=>a.followers-b.followers)[0], big=list.slice().sort((a,b)=>b.followers-a.followers)[0];
    check('криэйторы: крупный дороже', mgrCreatorFee(big)>mgrCreatorFee(small));
    MGR.club.rep=10;
    check('криэйторы: звезда не идёт в клуб без репутации', mgrCreatorSign(big.name)===false);
    MGR.club.rep=60;
    check('криэйторы: небольшой подписан', mgrCreatorSign(small.name)===true && (MGR.creators||[]).length===1);
    const cash0=MGR.club.cash, rep0=MGR.club.rep, net=mgrCreatorNet();
    mgrCreatorsMonth('2024-01');
    check('криэйторы: месяц — деньги', MGR.club.cash===cash0+net, cash0+' → '+MGR.club.cash+' (net '+net+')');
    check('криэйторы: месяц — репутация +1', MGR.club.rep===rep0+1);
    MGR_SUB.club='creators'; mgrRenderHub('club');
    const B=document.getElementById('mgBody');
    check('криэйторы '+lang+': подвкладка', !B.querySelector('.cc-ffo-err') && !bad(B.innerHTML) && B.querySelectorAll('.mgf-person').length>=10 && !!B.querySelector('.mgf-person.on'));
    mgrCreatorDrop(small.name); check('криэйторы: расторгнут', !(MGR.creators||[]).length);
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
