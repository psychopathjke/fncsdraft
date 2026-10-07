# Fortnite Manager «как в FIFA» — часть 1 (выбор клуба + хаб как в карьере) — план

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Экран выбора клуба (настоящий или свой, с бюджетами из данных) и хаб менеджера, который выглядит и устроен как хаб карьеры за игрока.

**Architecture:** Всё в одном файле `index.html` (так устроен проект: ~155 тыс. строк, менеджер — функции `mgr*` около строки 154835). Экран `screen-manager` получает разметку `screen-career-hub` со своими id (`mgWho/mgOvr/mgPurseNow/mgPurse/mgTabs/mgBody`); отрисовка — новая `mgrRenderHub(tab)` по образцу `careerRenderHub`. Логика менеджера (переговоры, совет, вечер) не меняется — меняются только экраны и бюджеты.

**Tech Stack:** ванильный JS в `index.html`, CSS там же; проверки — node-скрипты, гоняющие страницу в headless Chrome (`--dump-dom`), как все `tools/check-*.js`.

**Spec:** `docs/specs/2026-10-07-fortnite-manager-fc-design.md`

## Global Constraints

- Подписи — в словари менеджера ru и en (`mgrT*`); прочие языки берут английский.
- Классы и разметка — как у хаба карьеры (`ch-*`, `.ch-tile`, `.ch-subtabs/.ch-subtab`, `.ch-play`); `mg-*` только поверх.
- Работает на iPhone 15 Pro Max (430 px, Safari): без горизонтальной прокрутки, кнопки целиком.
- Правки `index.html` — через Edit; не через `node -e` с регулярками (Bash съедает обратные слэши); в заменах через скрипт — `s.replace(a, ()=>b)`.
- Коммит: смотреть `git diff --cached --stat` (CRLF раздувает диф); подпись `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Менеджер на проде скрыт `mgrAllowed()`; в этой части НЕ открывать — только debug. Открытие на прод — отдельным словом владельца.
- Бюджет клуба — из `CC_ORG_EARN` (призовые за всё время), оборот = `MGR_TURNOVER_K` × призовые, пол для клубов вне списка.

## Review Focus

1. Старый сейв менеджера (без `club.transfer`/`club.wageCap`) — хаб открывается, бюджеты досчитываются (`mgrBudgetMigrate`), ничего не падает.
2. Год/регион, где у клуба нет строки в `CC_ORG_EARN` (маленькие клубы 2019, ME/OCE) — пол бюджета, а не 0 и не NaN.
3. Свой клуб, когда свободных агентов меньше, чем нужно на команду формата (трио 2021, ME) — клуб создаётся с тем, что есть, остальное ищется на рынке, без исключения.
4. Ник/название клуба с кавычкой или `<` — экран не ломается (esc + чистка как у био).
5. Перерисовка той же вкладки после действия (подписал, переставил) — прокрутка не прыгает наверх, ошибка одной вкладки не убивает хаб.

---

## File Structure

- Modify: `index.html` — разметка `#screen-manager` (~стр. 7220), CSS менеджера (рядом с `.mg-*`), функции `mgr*` (~154835–156500): новые `mgrClubBudget`, `mgrBudgetMigrate`, `mgrClubStars`, `mgrExpect`, `mgrCrestSVG`, `mgrCreateOwn`, `mgrOpenNew` (переписать), `mgrRenderHub`, `mgrHdrHTML`, `mgrCentreHTML`, `mgrSquadHTML`, `mgrSheetOpen`, `mgrTransfersHTML`, `mgrShortToggle`, словарь `mgrT9()`; `mgrOpenHub` зовёт `mgrRenderHub`.
- Create: `tools/check-mgr-hub.js` — сторож части 1.

---

### Task 1: Сторож-каркас `tools/check-mgr-hub.js`

**Files:**
- Create: `tools/check-mgr-hub.js`

**Interfaces:**
- Produces: `node tools/check-mgr-hub.js [section]` — гоняет страницу в headless Chrome, печатает `OK …` или `FAIL` и строки; секции дописываются следующими задачами в массив `SECTIONS`.

- [ ] **Step 1: Написать каркас** — по образцу `tools/check-mp-season-turn.js`: временная копия `index.html` с `<base href>` и BOOT-скриптом в конце; BOOT ловит `error`, выставляет `LANG` по очереди `ru`/`en`, вызывает секции и пишет JSON между `BEGIN`/`END`.

```js
// Хаб менеджера «как в карьере» и выбор клуба (спека 2026-10-07-fortnite-manager-fc-design).
//   node tools/check-mgr-hub.js
const fs=require('fs'), os=require('os'), path=require('path');
const {execFileSync}=require('child_process');
const ROOT=path.resolve(__dirname,'..').split(String.fromCharCode(92)).join('/');
const CHROME=['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Google/Chrome/Application/chrome.exe']
  .find(p=>fs.existsSync(p));
const BOOT=`
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={fails:[], notes:{}, errs:[]};
  window.addEventListener('error', e=>{ out.errs.push(String(e.message)+' @'+e.lineno); });
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  const bad=html=>/undefined|NaN|\\[object/.test(html);
  try{
    localStorage.removeItem('fncsdraft_manager');
    for(const lang of ['ru','en']){
      LANG=lang;
      // SECTIONS
    }
  }catch(e){ out.fails.push('исключение: '+(e.stack||e)); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mgrhub-')), tmp=path.join(dir,'index.html');
fs.writeFileSync(tmp,'<base href="file:///'+ROOT+'/">'+fs.readFileSync(path.join(ROOT,'index.html'),'utf8')+BOOT);
const dom=execFileSync(CHROME,['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files',
  '--virtual-time-budget=600000','--dump-dom','file:///'+tmp.split(String.fromCharCode(92)).join('/')],
  {maxBuffer:1<<30,encoding:'utf8',stdio:['ignore','pipe','ignore'],timeout:900000});
fs.rmSync(dir,{recursive:true,force:true});
const m=dom.match(/BEGIN([\s\S]*?)END/); if(!m){ console.log('FAIL нет вывода'); process.exit(2); }
const out=JSON.parse(decodeURIComponent(m[1]));
if(out.errs.length) out.fails.push('JS: '+out.errs.slice(0,3).join(' | '));
if(out.fails.length){ console.log(['FAIL'].concat(out.fails).join(String.fromCharCode(10))); process.exit(1); }
console.log('OK хаб менеджера', JSON.stringify(out.notes));
```

- [ ] **Step 2: Прогнать** `node tools/check-mgr-hub.js` → `OK хаб менеджера {}` (секций ещё нет; доказывает, что страница грузится без ошибок).
- [ ] **Step 3: Commit** `git add tools/check-mgr-hub.js` — «Сторож хаба менеджера: каркас».

---

### Task 2: Бюджеты клуба из данных

**Files:**
- Modify: `index.html` — рядом с `mgrSalary` (~155009) новые функции; `mgrTake` (~154946), `mgrSwitchClub` (~155949, строка `MGR.club={…cash:…}`), `mgrOpenHub` (вызов миграции), `mgrSignFinal` и продление (`mgrRenewAsk`) — проверка потолка зарплат.
- Test: `tools/check-mgr-hub.js` секция «бюджет».

**Interfaces:**
- Consumes: `ccOrgEarn(name)` (~127855, $ за всё время или 0), `CC_ORG_EARN_FLOOR`, `mgrWage(h)`, `mgrAll()`.
- Produces: `const MGR_TURNOVER_K=0.15, MGR_TURNOVER_FLOOR=60000;` `mgrClubBudget(name, wageNow) → {turnover, transfer, wageCap}` (целые $; `wageCap` — в месяц); `mgrBudgetMigrate()` — досчитывает `MGR.club.transfer/wageCap` старому сейву; `mgrWageRoom() → $` свободно под потолком; в `MGR.club` поля `transfer`, `wageCap`.

- [ ] **Step 1: Тест** — в `SECTIONS` секция:

```js
{ const big=mgrClubBudget('Cooler Esport', 20000), none=mgrClubBudget('Нет Такого Клуба', 3000);
  check('бюджет: большой клуб больше пустого', big.turnover>none.turnover, big.turnover+' vs '+none.turnover);
  check('бюджет: пол у клуба вне списка', none.turnover>=MGR_TURNOVER_FLOOR, String(none.turnover));
  check('бюджет: трансферный 40%', big.transfer===Math.round(big.turnover*0.4));
  check('бюджет: потолок зарплат вмещает состав с запасом 15%', big.wageCap>=Math.round(20000/0.85)-1, String(big.wageCap));
  check('бюджет: числа целые', [big.turnover,big.transfer,big.wageCap,none.wageCap].every(Number.isInteger)); }
```

- [ ] **Step 2: Прогон** → FAIL `mgrClubBudget is not defined`.
- [ ] **Step 3: Реализация** (после `function mgrSalary`):

```js
/* Бюджет клуба — из его призовых в Fortnite за всё время (CC_ORG_EARN, esportsearnings; по годам
   чисел нет). Оборот = K × призовые с полом; доля 0.15 — оценка режима: Cooler (3.3 млн) → ~$500к
   в год, клуб вне списка — пол. Трансферный бюджет — 40% оборота; потолок зарплат в месяц — не ниже
   нынешней ведомости с запасом 15% и не ниже половины оборота на 12 месяцев. */
const MGR_TURNOVER_K=0.15, MGR_TURNOVER_FLOOR=60000;
function mgrClubBudget(name, wageNow){
  const earn=(typeof ccOrgEarn==='function' ? ccOrgEarn(name) : 0)||0;
  const turnover=Math.max(MGR_TURNOVER_FLOOR, Math.round(earn*MGR_TURNOVER_K/1000)*1000);
  const transfer=Math.round(turnover*0.4);
  const wageCap=Math.max(Math.round((wageNow||0)/0.85), Math.round(turnover*0.5/12/100)*100);
  return {turnover, transfer, wageCap};
}
function mgrWageBill(){ return mgrAll().reduce((s,h)=>s+mgrWage(h), 0)+((MGR.academy||[]).reduce((s,h)=>s+mgrWage(h), 0)); }
function mgrWageRoom(){ return (MGR.club.wageCap||0)-mgrWageBill(); }
function mgrBudgetMigrate(){
  const c=MGR && MGR.club; if(!c || c.wageCap!=null) return;
  const b=mgrClubBudget(c.own ? '' : c.name, mgrWageBill());
  c.transfer=b.transfer; c.wageCap=b.wageCap; c.turnover=b.turnover;
}
```

В `mgrTake` после `mgrBuildTeams(c.players); MGR.contracts={}; mgrAll().forEach(h=>mgrContract(h));` дописать:

```js
  { const b=mgrClubBudget(c.name, mgrWageBill()); Object.assign(MGR.club, {turnover:b.turnover, transfer:b.transfer, wageCap:b.wageCap, cash:Math.max(MGR.club.cash, b.transfer)}); }
```

В `mgrOpenHub` после `if(!MGR.board) mgrBoardInit();` — `mgrBudgetMigrate();`. В `mgrSignFinal` перед подписанием и в продлении (там, где считается новая зарплата `sal`): 

```js
  if(sal-(MGR.contracts[hKey(h)]||{}).salary>mgrWageRoom()){ mgrToast(mgrT9().overCap(mgrMoney(MGR.club.wageCap))); return; }
```

(`mgrToast` — тот же способ уведомления, что в `mgrSign` для `T2.noMoney`; взять оттуда фактическое имя функции.) Отступные в `mgrSignFinal` списывают и `MGR.club.transfer=Math.max(0, MGR.club.transfer-clause)`.

Словарь `mgrT9()` (новый, рядом с `mgrT8`): `overCap:s=>'Совет против: потолок зарплат '+s+' в месяц' / 'The board says no: wage budget '+s+' a month'`, `transfer:'Трансферный бюджет'/'Transfer budget'`, `wageCap:'Бюджет зарплат'/'Wage budget'`.

- [ ] **Step 4: Прогон** → OK.
- [ ] **Step 5: Commit** — «Менеджер: бюджеты клуба из призовых (трансферный и зарплатный)».

---

### Task 3: Экран выбора — настоящий клуб

**Files:**
- Modify: `index.html` — `mgrOpenNew` (~154921) переписать; `mgrClubsFor` дополнить полями; CSS.
- Test: секция «выбор».

**Interfaces:**
- Consumes: `mgrClubsFor(year, region) → [{name, players, n, avg}]`, `mgrClubBudget`, `mgrNewOptsHTML()`, `mgrTake(i)`.
- Produces: `mgrClubStars(avg) → 0.5…5` (шаг 0.5); `mgrExpect(rank, n) → 'title'|'final'|'survive'`; `MGR_NEW_SIDE='real'|'own'`; элементы на экране: `.mgn-club[data-i]` плитки, `.mgn-side` переключатель.

- [ ] **Step 1: Тест**

```js
for(const y of [2019, 2022, 2024, 2026]){ mgrOpenNew(y);
  const html=document.getElementById('mgBody').innerHTML, tiles=document.querySelectorAll('#mgBody .mgn-club');
  check('выбор '+y+' '+lang+': плитки есть', tiles.length>=3, String(tiles.length));
  check('выбор '+y+' '+lang+': без undefined/NaN', !bad(html));
  check('выбор '+y+': у плиток бюджеты', [...tiles].every(t=>/\\$/.test(t.textContent))); }
check('звёзды', mgrClubStars(95)===5 && mgrClubStars(60)===0.5 && mgrClubStars(80)%0.5===0, [mgrClubStars(95),mgrClubStars(60),mgrClubStars(80)].join());
```

- [ ] **Step 2: Прогон** → FAIL.
- [ ] **Step 3: Реализация.** `mgrClubsFor` возвращает ещё `budget:mgrClubBudget(name, ps.slice(0,6).reduce((s,c)=>s+mgrSalary(c),0))`, `star:ps[0]&&ps[0].handle`. Новые:

```js
// Уровень клуба звёздами, как в FC: 60 → 0.5, 95 → 5, шаг 0.5 (оценка режима).
function mgrClubStars(avg){ return Math.max(0.5, Math.min(5, Math.round(((avg-60)/35*4.5+0.5)*2)/2)); }
// Ожидание совета — по месту клуба по силе в своём регионе.
function mgrExpect(rank, n){ return rank<Math.max(1, Math.round(n*0.15)) ? 'title' : rank<Math.round(n*0.5) ? 'final' : 'survive'; }
function mgrStarsHTML(s){ let h=''; for(let i=1;i<=5;i++) h+='<i class="mgn-st'+(s>=i?' on':s>=i-0.5?' half':'')+'">★</i>'; return '<span class="mgn-stars">'+h+'</span>'; }
let MGR_NEW_SIDE='real';
```

`mgrOpenNew` строит экран в обёртке хаба: `<div class="ch-stage">` уже есть у `#screen-manager`; тело — заголовок `.ch-tile`, ряд годов `.ch-subtabs` (кнопки `.ch-subtab`), выбор региона, переключатель `.mgn-side` (`.ch-subtab` «Настоящий клуб / Создать свой»), `mgrNewOptsHTML()`, сетка `.mgn-grid` плиток:

```js
const tile=(c,i)=>'<div class="ch-tile mgn-club" data-i="'+i+'" onclick="mgrTake('+i+')">'+
  '<div class="mgn-head"><span class="mg-logo">'+(typeof clubLogoHTML==='function'?clubLogoHTML(c.name):'')+'</span>'+
  '<span><b>'+esc(c.name)+'</b>'+mgrStarsHTML(mgrClubStars(c.avg))+'</span><b class="mgn-ovr">'+c.avg+'</b></div>'+
  '<div class="mgn-row"><em>'+T9.transfer+'</em><b>'+mgrMoney(c.budget.transfer)+'</b></div>'+
  '<div class="mgn-row"><em>'+T9.wageCap+'</em><b>'+mgrMoney(c.budget.wageCap)+' '+T.month+'</b></div>'+
  '<div class="mgn-row"><em>'+T9.star+'</em><b>'+esc(c.star||'—')+'</b></div>'+
  '<div class="mgn-exp">'+esc(T9.expect[mgrExpect(i, list.length)])+'</div></div>';
```

Сортировка: кнопки «По звёздам / По бюджету» (`MGR_NEW_SORT`), список `MGR_NEW_LIST` сортируется до отрисовки, индекс плитки = индекс в `MGR_NEW_LIST`. Словарь `mgrT9`: `real, own, star:'Звезда состава'/'Star player', expect:{title:'Совет ждёт титул', final:'Совет ждёт финал', survive:'Совет ждёт удержаться'} / {title:'Board expects a title', final:'Board expects a final', survive:'Board expects to survive'}, byStars, byBudget`. CSS: `.mgn-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px}` `.mgn-club{cursor:pointer}` `.mgn-head{display:flex;gap:8px;align-items:center}` `.mgn-ovr{margin-left:auto;font-size:26px}` `.mgn-row{display:flex;justify-content:space-between;font-size:12px}` `.mgn-st{color:#555;font-style:normal}.mgn-st.on,.mgn-st.half{color:#ffd400}.mgn-st.half{opacity:.55}` и `@media(max-width:480px){.mgn-grid{grid-template-columns:1fr}}`.

- [ ] **Step 4: Прогон** → OK.
- [ ] **Step 5: Commit** — «Менеджер: выбор настоящего клуба как в FC — звёзды, бюджеты, ожидания».

---

### Task 4: Создать свой клуб

**Files:**
- Modify: `index.html` — `mgrOpenNew` (сторона `own`), новые `mgrCrestSVG`, `mgrCreateOwn`; `clubLogoHTML` у своего клуба — через `mgrCrestSVG`.
- Test: секция «свой клуб».

**Interfaces:**
- Consumes: `mgrShadow`, `mgrEnter`, `ccSceneRoster(region)`, `mgrOrgOf(c)`, `mgrBuildTeams(handles)`, `mgrContract`, `mgrBoardInit`, `mgrRivalsInit`, `mgrFncsDays`.
- Produces: `const MGR_OWN_TIERS={rookie:{lo:65,hi:72,cash:40000}, mid:{lo:72,hi:78,cash:90000}, amb:{lo:78,hi:84,cash:180000}};` `mgrCrestSVG({color, shape, ini}, size) → '<svg…>'`; `mgrCreateOwn({name, color, shape, region, tier}) → true|string(ошибка)`; `MGR.club.own=true`, `MGR.club.crest={color,shape,ini}`; `mgrLogo(name, big)` — герб своего клуба или `clubLogoHTML`.

- [ ] **Step 1: Тест**

```js
for(const [y,reg] of [[2024,'EU'],[2021,'ME'],[2019,'OCE']]){ MGR_NEW_YEAR=y; MGR_NEW_REGION=reg;
  const r=mgrCreateOwn({name:'Тест <"Клуб">', color:'#ffd400', shape:'shield', region:reg, tier:'rookie'});
  check('свой '+y+reg+': создан', r===true, String(r));
  check('свой '+y+reg+': название чистое', MGR.club.name.indexOf('<')<0 && MGR.club.own===true);
  check('свой '+y+reg+': бюджеты числа', Number.isInteger(MGR.club.wageCap) && MGR.club.wageCap>0);
  check('свой '+y+reg+': люди без клуба', mgrAll().every(h=>!mgrOrgOf(mgrCard(h))||mgrOrgOf(mgrCard(h))===MGR.club.name));
  mgrOpenHub(); check('свой '+y+reg+': хаб открылся', !bad(document.getElementById('mgBody').innerHTML));
  localStorage.removeItem('fncsdraft_manager'); MGR=null; mgrLeave(); }
check('герб svg', /^<svg[\\s\\S]*<\\/svg>$/.test(mgrCrestSVG({color:'#f00',shape:'round',ini:'TK'}, 40)));
```

- [ ] **Step 2: Прогон** → FAIL.
- [ ] **Step 3: Реализация.**

```js
const MGR_OWN_TIERS={rookie:{lo:65, hi:72, cash:40000}, mid:{lo:72, hi:78, cash:90000}, amb:{lo:78, hi:84, cash:180000}};
const MGR_CREST_SHAPES={shield:'M20 2 L36 8 V20 C36 30 28 36 20 39 C12 36 4 30 4 20 V8 Z', round:'M20 2 A18 18 0 1 1 19.9 2 Z', hex:'M20 2 L36 11 V29 L20 38 L4 29 V11 Z'};
function mgrCrestSVG(cr, size){
  const s=size||40, col=/^#[0-9a-f]{6}$/i.test(cr.color||'') ? cr.color : '#ffd400';
  const d=MGR_CREST_SHAPES[cr.shape]||MGR_CREST_SHAPES.shield, ini=esc(String(cr.ini||'').slice(0,3).toUpperCase());
  return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 40 40"><path d="'+d+'" fill="'+col+'" stroke="#0008" stroke-width="1.5"/>'+
    '<text x="20" y="25" text-anchor="middle" font-family="Oswald,sans-serif" font-weight="700" font-size="12" fill="#111">'+ini+'</text></svg>';
}
function mgrLogo(name, big){ return (MGR && MGR.club && MGR.club.own && MGR.club.name===name) ? mgrCrestSVG(MGR.club.crest, big?44:26) : (typeof clubLogoHTML==='function' ? clubLogoHTML(name, big) : ''); }
function mgrCleanName(s){ return String(s||'').replace(/[\u0000-\u001f<>"'`]/g, '').trim().slice(0, 24); }
function mgrCreateOwn(o){
  const name=mgrCleanName(o.name); if(!name) return 'name';
  const tier=MGR_OWN_TIERS[o.tier]||MGR_OWN_TIERS.rookie, region=o.region||MGR_NEW_REGION;
  const sh=mgrShadow(MGR_NEW_YEAR, region);
  MGR={v:1, year:MGR_NEW_YEAR, region, shadow:sh, club:{name, own:true, crest:{color:o.color, shape:o.shape, ini:name.split(/\s+/).map(w=>w[0]).join('').slice(0,3)},
       avg:0, cash:tier.cash, earned:0, paidMonth:sh.career.day.slice(0, 7), rep:30}, teams:[], bench:[], log:[], skipped:[]};
  mgrEnter();
  MGR.season0=sh.career.day;
  const size=Math.max(2, careerSquadSize());
  let free=[]; try{ free=(ccSceneRoster(region)||[]).filter(c=>c && !mgrOrgOf(c)); }catch(e){ free=[]; }
  const inBand=free.filter(c=>{ const v=ccCardOvr(c)||0; return v>=tier.lo && v<=tier.hi; });
  const pick=(inBand.length>=size ? inBand : free).slice().sort((a,b)=>(ccCardOvr(b)||0)-(ccCardOvr(a)||0)).slice(0, size*2);
  mgrBuildTeams(pick.map(c=>c.handle));
  MGR.club.avg=pick.length ? Math.round(pick.reduce((s,c)=>s+(ccCardOvr(c)||0),0)/pick.length) : tier.lo;
  MGR.contracts={}; mgrAll().forEach(h=>mgrContract(h));
  { const b=mgrClubBudget('', mgrWageBill()); const k=tier.cash/MGR_OWN_TIERS.rookie.cash;
    Object.assign(MGR.club, {turnover:Math.round(b.turnover*k), transfer:Math.round(b.transfer*k), wageCap:Math.max(b.wageCap, Math.round(b.wageCap*k))}); }
  MGR.fncsCal=mgrFncsDays().map(x=>x.day);
  MGR.inbox=[]; MGR.morale={}; mgrBoardInit(); mgrRivalsInit();
  if(MGR_NEW_START) mgrApplyStart(MGR_NEW_START);
  mgrSave();
  return true;
}
```

Сторона `own` в `mgrOpenNew`: `.ch-tile` с полем `<input id="mgnName" maxlength="24">`, палитра 6 цветов (`#ffd400 #ff5a5a #7aa2ff #8be9fd #b07dff #6bdc8a`, кнопки `.mgn-col`), три формы (`.mgn-shape` с `mgrCrestSVG` превью), три уровня (`.ch-subtab` «Новичок/Средний/Амбициозный» — `MGR_OWN_PICK.tier`), кнопка `.ch-play` «Основать клуб» → `mgrOwnGo()`:

```js
let MGR_OWN_PICK={color:'#ffd400', shape:'shield', tier:'rookie'};
function mgrOwnGo(){ const n=(document.getElementById('mgnName')||{}).value||'';
  const r=mgrCreateOwn(Object.assign({name:n, region:MGR_NEW_REGION}, MGR_OWN_PICK));
  if(r!==true){ const e=document.getElementById('mgnName'); if(e) e.classList.add('err'); return; }
  mgrOpenHub(); }
```

Все места, где хаб рисует герб (`clubLogoHTML(c.name, …)` в `mgrOpenHub`), — через `mgrLogo`. Словарь `mgrT9`: `own:'Создать свой'`, `ownName:'Название клуба'`, `ownGo:'Основать клуб'`, `tiers:{rookie:'Новичок', mid:'Средний', amb:'Амбициозный'}`, `tierHint:{rookie:'малый бюджет, свободные агенты 65–72', mid:'средний бюджет, 72–78', amb:'большой бюджет, 78–84, совет строже'}` + en.

- [ ] **Step 4: Прогон** → OK.
- [ ] **Step 5: Commit** — «Менеджер: свой клуб — название, герб, уровень старта, состав из свободных».

---

### Task 5: Каркас хаба как в карьере + шапка

**Files:**
- Modify: `index.html` — разметка `#screen-manager` (~7220), `mgrOpenHub` (~155105) → тонкая обёртка, новые `mgrRenderHub`, `mgrHdrHTML`, CSS `.mgh-*`.
- Test: секция «каркас».

**Interfaces:**
- Consumes: `mgrConf()`, `mgrMorale(h)`, `mgrCard(h)`, `ccCardOvr`, `mgrSponsor()`, `mgrStaffWage()`, `mgrWageBill()`.
- Produces: `let MGR_TAB='centre';` (ключи: `centre|squad|transfers|inbox|club|tables`), `let MGR_SUB={transfers:'market', club:'train', tables:'stats'};` `mgrRenderHub(tab)` — рисует шапку и тело, ловит ошибку тела (плашка `.cc-ffo-err` + `.ch-play` «на Центр»), хранит прокрутку; `mgrTabBody(tab) → html` (диспетчер, задачи 6–9 добавляют ветки); `mgrGrade(conf) → 'A'…'F'`; `mgrTeamAvg() → число`.

- [ ] **Step 1: Тест**

```js
MGR_NEW_YEAR=2024; MGR_NEW_REGION='EU'; mgrOpenNew(2024); mgrTake(0);
for(const t of ['centre','squad','transfers','inbox','club','tables']){ mgrRenderHub(t);
  const all=document.getElementById('screen-manager').innerHTML;
  check('вкладка '+t+' '+lang+': без плашки ошибки', !document.querySelector('#mgBody .cc-ffo-err'), (document.querySelector('#mgBody .cc-ffo-err')||{}).textContent);
  check('вкладка '+t+' '+lang+': без undefined/NaN', !bad(all));
  check('вкладка '+t+': активная вкладка подсвечена', !!document.querySelector('#mgTabs .ch-tab.on[data-tab="'+t+'"]')); }
check('шапка: полоски совета и морали', document.querySelectorAll('#mgPurseNow .ch-en').length===2);
check('оценка совета', mgrGrade(90)==='A' && mgrGrade(10)==='F');
const saved=mgrTabBody; mgrTabBody=()=>{ throw new Error('проба'); }; mgrRenderHub('centre');
check('ошибка вкладки → плашка, а не мёртвый экран', !!document.querySelector('#mgBody .cc-ffo-err')); mgrTabBody=saved;
```

- [ ] **Step 2: Прогон** → FAIL.
- [ ] **Step 3: Реализация.** Разметка:

```html
<div class="screen" id="screen-manager"><div class="ch-stage">
  <div class="ch-facets"><i class="cc-f1"></i><i class="cc-f2"></i><i class="cc-f3"></i><i class="cc-f4"></i></div>
  <div class="ch-top" id="mgTop"><div class="ch-who" id="mgWho"></div><div class="ch-ovr" id="mgOvr"></div>
    <div class="ch-purse ch-purse-now" id="mgPurseNow"></div><div class="ch-spacer"></div><div class="ch-purse" id="mgPurse"></div></div>
  <div class="ch-tabs" id="mgTabs"></div>
  <div class="ch-body" id="mgBody"></div>
  <div class="ch-foot" id="mgFoot"></div>
</div></div>
```

`mgrOpenNew` прячет `#mgTop/#mgTabs` (`hidden=true`) и рисует подвал «На главную»; хаб их показывает.

```js
function mgrGrade(c){ return c>=85?'A':c>=70?'B':c>=55?'C':c>=40?'D':c>=25?'E':'F'; }
function mgrTeamAvg(){ const t=(MGR.teams[0]||{cards:[]}).cards; return t.length ? Math.round(t.reduce((s,h)=>s+(ccCardOvr(mgrCard(h))||0),0)/t.length) : 0; }
function mgrBar(label, mark, v, low){ return '<div class="ch-en"><em>'+esc(label)+'</em><div class="ch-en-row"><span class="ch-en-mark">'+mark+'</span>'+
  '<span class="ch-en-bar'+(v<low?' low':'')+'"><i style="width:'+Math.max(0,Math.min(100,Math.round(v)))+'%"></i></span><b>'+Math.round(v)+'</b></div></div>'; }
function mgrHdrHTML(){
  const T=mgrT(), T9=mgrT9(), c=MGR.club, cr=CAREER.career;
  const mor=mgrAll().length ? (mgrAll().reduce((s,h)=>s+mgrMorale(h),0)/mgrAll().length+2)/4*100 : 50;
  const net=mgrSponsor()-mgrWageBill()-(mgrStaffWage()||0);
  document.getElementById('mgWho').innerHTML='<span class="ch-face mgh-crest">'+mgrLogo(c.name, true)+'</span><div><div class="ch-name">'+esc(c.name)+'</div>'+
    '<div class="ch-sub">'+[MGR.year, esc(MGR.region), T.rep+' '+(c.rep!=null?c.rep:50), T9.board+' '+mgrGrade(mgrConf()), esc(ccDayLabel(cr.day))].join(' · ')+'</div></div>';
  document.getElementById('mgOvr').innerHTML=mgrTeamAvg()+'<span class="ch-ovr-side"><small>'+esc(T9.teamOvr)+'</small></span>';
  document.getElementById('mgPurseNow').innerHTML=mgrBar(T9.conf, '🏛', mgrConf(), 35)+mgrBar(T9.morale, '🤝', mor, 35);
  document.getElementById('mgPurse').innerHTML='<div class="mgh-money"><em>'+T.cash+'</em><b>'+mgrMoney(c.cash)+'</b>'+
    '<small class="'+(net<0?'down':'up')+'">'+(net<0?'':'+')+mgrMoney(net)+' '+T.month+'</small></div>';
}
const MGR_TABS=['centre','squad','transfers','inbox','club','tables'];
function mgrTabBody(tab){ return '<div class="ch-empty">'+esc(tab)+'</div>'; }   // ветки — задачи 6–9
let MGR_DREW=null;
function mgrRenderHub(tab){
  if(!MGR || !MGR.club){ mgrOpenNew(); return; }
  mgrEnter(); mgrBudgetMigrate();
  MGR_TAB=MGR_TABS.indexOf(tab)>=0 ? tab : (MGR_TABS.indexOf(MGR_TAB)>=0 ? MGR_TAB : 'centre');
  const body=document.getElementById('mgBody'), keep=(MGR_DREW===MGR_TAB) ? [body.scrollTop, window.scrollY] : null;
  document.getElementById('mgTop').hidden=false; document.getElementById('mgTabs').hidden=false;
  const T9=mgrT9(), unread=(MGR.inbox||[]).filter(m=>!m.done).length;
  document.getElementById('mgTabs').innerHTML=MGR_TABS.map(k=>'<button class="ch-tab'+(MGR_TAB===k?' on':'')+'" data-tab="'+k+'" onclick="mgrRenderHub(\''+k+'\')">'+
    esc(T9.tabs[k])+(k==='inbox' && unread ? '<i class="ch-dot on"></i>' : '')+'</button>').join('');
  try{ mgrHdrHTML(); body.innerHTML=mgrTabBody(MGR_TAB); }
  catch(e){ console.error('mgrRenderHub '+MGR_TAB, e);
    body.innerHTML='<div class="cc-ffo-err"><b>'+esc(L().ccHubBroke)+'</b><span>'+esc(String((e&&e.message)||e))+'</span></div>'+
      '<button class="ch-play" onclick="mgrRenderHub(\'centre\')">'+esc(L().ccHubBackCentre)+'</button>'; }
  document.getElementById('mgFoot').innerHTML='<button class="cc-back" onclick="mgrHome()">'+esc(mgrT().home)+'</button>'+
    '<button class="cc-back" onclick="mgrNewClubAsk()">'+esc(mgrT().newClub)+'</button>';
  MGR_DREW=MGR_TAB;
  if(keep){ body.scrollTop=keep[0]; window.scrollTo(0, keep[1]); }
  show('screen-manager');
}
function mgrOpenHub(){
  if(!MGR || !MGR.club){ mgrOpenNew(); return; }
  mgrEnter();
  if(!MGR.contracts){ MGR.contracts={}; mgrAll().forEach(h=>mgrContract(h)); }
  if(!MGR.board) mgrBoardInit();
  MGR.inbox=MGR.inbox||[]; MGR.morale=MGR.morale||{};
  const legacy={club:'centre', market:'transfers', train:'club', stats:'tables'};
  mgrRenderHub(legacy[MGR_TAB]||MGR_TAB);
}
```

Все вызовы `MGR_TAB='…';mgrOpenHub()` в старых `*HTML` продолжают работать через `legacy`. `mgrT9`: `tabs:{centre:'Центр', squad:'Состав', transfers:'Трансферы', inbox:'Входящие', club:'Клуб', tables:'Таблицы'}`, `conf:'Доверие совета'`, `morale:'Мораль состава'`, `board:'Совет'`, `teamOvr:'Первая команда'` + en. CSS: `.mgh-crest svg,.mgh-crest img{width:100%;height:100%;object-fit:contain}` `.mgh-money{display:flex;flex-direction:column;align-items:flex-end}.mgh-money b{font-size:20px}.mgh-money .down{color:#ff6b6b}.mgh-money .up{color:#6bdc8a}`. Старые классы `.mg-tabs/.mg-top/.mg-wrap` больше не выводятся.

- [ ] **Step 4: Прогон** → OK (тела вкладок пока заглушки — тест проверяет каркас).
- [ ] **Step 5: Commit** — «Менеджер: хаб в разметке карьеры — шапка, вкладки, плашка ошибки».

---

### Task 6: Центр

**Files:**
- Modify: `index.html` — новая `mgrCentreHTML()`, ветка `centre` в `mgrTabBody`.
- Test: секция «центр».

**Interfaces:**
- Consumes: `mgrEvents()` (`[{day,name,kind,mode}]`), `mgrPlay()`, `mgrSkip()`, `mgrSeasonReview()`, `MGR.board`, `mgrChallengeHTML()`, `mgrConfHTML()`, `MGR.inbox`, `MGR.moves`, `MGR.dev`, `MGR.fatigue`, `MGR.log`.
- Produces: `mgrCentreHTML() → html` с `.ch-play` (onclick `mgrPlay()` или `mgrSeasonReview()`), плитками `.mgc-next`, `.mgc-news`, `.hg-tile` (цели совета), `.hd-tile` (развитие).

- [ ] **Step 1: Тест**

```js
mgrRenderHub('centre');
const play=document.querySelector('#mgBody .ch-play');
check('центр '+lang+': главная кнопка', !!play && /mgrPlay|mgrSeasonReview/.test(play.getAttribute('onclick')||''));
check('центр '+lang+': цели совета', !!document.querySelector('#mgBody .hg-tile'));
check('центр '+lang+': развитие', !!document.querySelector('#mgBody .hd-tile'));
check('центр '+lang+': новости', !!document.querySelector('#mgBody .mgc-news'));
```

- [ ] **Step 2: Прогон** → FAIL.
- [ ] **Step 3: Реализация** — сетка как центр карьеры (`.ch-grid`): слева `.ch-tile mgc-next` (`T.next`, название, `ccDayLabel(day)`, формат, какие команды едут — `MGR.teams` нужного размера, кнопки `.ch-play` «Матчевый день» → `mgrPlay()` и `.cc-back` «Пропустить» → `mgrSkip()`; без турниров — `.ch-play` «Итоги сезона» → `mgrSeasonReview()`); календарь 6 следующих (`mgrEvents().slice(1,7)`) и результаты (`MGR.log` kind night, 6) — списками `.mg-list`, перенести из `mgrClubHTML`. Справа `.ch-tile mgc-news` — 5 последних: письма `MGR.inbox` (тема/текст как в `mgrInboxHTML`) и `MGR.moves` (`h → to`), клик по письму → `mgrRenderHub('inbox')`. Плитка `.ch-tile hg-tile` «Цели совета»: строки `hg-row` — заработок (`T2.goalEarn`, прогресс `earnedNow/b.earn`), лучшее место (`T2.goalPlace`, сейчас `#best`), испытание (`mgrChallengeHTML()` внутрь), доверие (`mgrConfHTML()`). Плитка `.ch-tile hd-tile` «Развитие»: `mgrTeamAvg()` крупно, топ-3 по `MGR.dev` вверх и вниз (`+n`/`−n`), усталость `MGR.fatigue` полоской `hg-bar`, кнопка `hg-go` → `mgrRenderHub('club')`. Ниже — `mgrDealHTML()` если спонсор не выбран (как сейчас в клубе).
- [ ] **Step 4: Прогон** → OK. **Дополнительно** — «Играть» проводит вечер: в тесте `MGR_SPEED=4`, клик по `.ch-play`, ждать до 10 минут виртуального времени появления `.stage-card button[onclick*="careerBackToHub"]`, клик, затем `check('после вечера — снова центр', MGR_TAB==='centre' && document.querySelector('#screen-manager.active'))`. Если `mgrAfterNight` рисует итог отдельно — дописать в нём возврат через `mgrRenderHub('centre')`.
- [ ] **Step 5: Commit** — «Менеджер: Центр как в карьере — следующий турнир, новости, цели совета, развитие».

---

### Task 7: Состав — карточки FUT и лист игрока

**Files:**
- Modify: `index.html` — новые `mgrSquadHTML`, `mgrSheetOpen(h)`, `mgrSheetClose()`; ветка `squad`; CSS `.mgs-*`.
- Test: секция «состав».

**Interfaces:**
- Consumes: `futCardHTML(card, opts)`, `mgrCard(h)`, `mgrChem(cards)`, `mgrPotText(h)`, `mgrUntil(h)`, `mgrWage(h)`, `mgrMorale(h)`, `mgrTalk(h)`, `mgrMove(h, to)`, `mgrRelease(h)`, `mgrPromote(h)`, `mgrToAcad`, `mgrPromisesHTML()`, `mgrNewTeam()`, `mgrTeamUp(i)`.
- Produces: `mgrSquadHTML()`; карточки `.mgs-card[data-h]` с `onclick="mgrSheetOpen(this.dataset.h)"`; модалка `#mgSheet` (`.mgs-sheet`) с кнопками действий; `mgrSheetClose()`.

- [ ] **Step 1: Тест**

```js
mgrRenderHub('squad');
const cards=document.querySelectorAll('#mgBody .mgs-card');
check('состав '+lang+': карточки всех игроков', cards.length===mgrAll().length+(MGR.academy||[]).length, cards.length+'/'+mgrAll().length);
cards[0].click();
const sh=document.getElementById('mgSheet');
check('лист игрока открылся', sh && !sh.hidden && /mgrTalk/.test(sh.innerHTML) && /mgrRelease/.test(sh.innerHTML));
check('лист без undefined', !bad(sh.innerHTML)); mgrSheetClose();
check('лист закрылся', document.getElementById('mgSheet').hidden);
```

- [ ] **Step 2: Прогон** → FAIL.
- [ ] **Step 3: Реализация.** Для каждой команды `.ch-tile mgs-team`: заголовок «Команда N · формат · химия X/10» (+ `↑` `mgrTeamUp`), ряд `.mgs-row` карточек:

```js
const card=h=>{ const cd=mgrCard(h); if(!cd) return '<div class="mgs-card mgs-miss">'+esc(h)+'</div>';
  const hq=esc(String(h)); const mor=mgrMorale(h);
  return '<div class="mgs-card" data-h="'+hq+'" onclick="mgrSheetOpen(this.dataset.h)">'+futCardHTML(cd, {})+
    (mor ? '<i class="mgs-mor '+(mor>0?'up':'dn')+'">'+(mor>0?'+':'')+mor+'</i>' : '')+'</div>'; };
```

Запас и академия — так же, отдельными плитками; под запасом `mgrNewTeam` если можно; ниже `mgrPromisesHTML()`. CSS: `.mgs-row{display:flex;flex-wrap:wrap;gap:8px}` `.mgs-card{position:relative;width:118px;cursor:pointer}` `.mgs-card .fut-card{transform-origin:top left}` (масштабировать под 118 px тем же способом, что мини-карточки драфта — взять класс из `futCardHTML` при реализации) `@media(max-width:480px){.mgs-card{width:calc(33% - 6px)}}`.

Лист игрока — модалка (один элемент `<div id="mgSheet" class="mgs-sheet" hidden>` в разметке `#screen-manager`):

```js
function mgrSheetOpen(h){
  const T=mgrT(), T2=mgrT2(), T4=mgrT4(), T9=mgrT9(), cd=mgrCard(h); if(!cd) return;
  const a=attrsFor(cd)||{}, hq=esc(String(h).replace(/'/g,'')), inAcad=(MGR.academy||[]).indexOf(h)>=0;
  const team=MGR.teams.findIndex(t=>t.cards.indexOf(h)>=0);
  const row=(k,v)=>'<div class="mgn-row"><em>'+esc(k)+'</em><b>'+v+'</b></div>';
  const el=document.getElementById('mgSheet');
  el.innerHTML='<div class="ch-tile mgs-in"><button class="mgs-x" onclick="mgrSheetClose()">✕</button>'+
    '<div class="mgs-top">'+futCardHTML(cd, {wide:true})+'<div>'+
      row(T9.role, esc(L()[a.roleKey]||'—'))+row(T4.pot, esc(mgrPotText(h)))+row(T2.wage, mgrMoney(mgrWage(h))+' '+T.month)+
      row(T9.until, esc(ccDayLabel(mgrUntil(h))))+row(T2.morale, String(mgrMorale(h)))+
      row(T9.where, esc(inAcad ? T.acad : team>=0 ? T2.teamWord+' '+(team+1) : T2.benchWord))+'</div></div>'+
    '<div class="mgs-act"><button class="cc-back" onclick="mgrSheetClose();mgrTalk(\''+hq+'\')">'+esc(mgrT5().talk)+'</button>'+
      (inAcad ? '<button class="cc-back" onclick="mgrSheetClose();mgrPromote(\''+hq+'\')">'+esc(T.promote)+'</button>'
              : '<select class="mg-move" onchange="mgrSheetClose();mgrMove(\''+hq+'\', this.value)"><option value="">'+esc(T2.to)+'</option>'+
                MGR.teams.map((t,i)=>'<option value="'+i+'">'+esc(T2.teamWord)+' '+(i+1)+'</option>').join('')+'<option value="-1">'+esc(T2.benchWord)+'</option></select>')+
      '<button class="cc-back mgs-bad" onclick="mgrSheetClose();mgrRelease(\''+hq+'\')">'+esc(T2.release)+'</button></div></div>';
  el.hidden=false;
}
function mgrSheetClose(){ const el=document.getElementById('mgSheet'); if(el){ el.hidden=true; el.innerHTML=''; } }
```

После `mgrMove/mgrRelease/mgrPromote/mgrTalk` они зовут `mgrOpenHub()` — это перерисует `squad` через `legacy`/`MGR_TAB`. CSS: `.mgs-sheet{position:fixed;inset:0;z-index:60;background:#000a;display:flex;align-items:center;justify-content:center;padding:16px}.mgs-sheet[hidden]{display:none}.mgs-in{max-width:520px;width:100%;max-height:90vh;overflow:auto;position:relative}.mgs-top{display:flex;gap:12px;flex-wrap:wrap}.mgs-act{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.mgs-x{position:absolute;top:8px;right:8px}`. `mgrT9`: `role, until:'Контракт до', where:'Где'` + en.

- [ ] **Step 4: Прогон** → OK.
- [ ] **Step 5: Commit** — «Менеджер: Состав карточками FUT и лист игрока».

---

### Task 8: Трансферы — рынок, шортлист, переговоры

**Files:**
- Modify: `index.html` — новые `mgrTransfersHTML`, `mgrShortToggle(h)`, `mgrShortHTML`, `mgrDealsHTML`; `mgrMarketHTML` — звёздочка шортлиста в строке; ветка `transfers`.
- Test: секция «трансферы».

**Interfaces:**
- Consumes: `mgrMarketHTML()`, `mgrMarketList()`, `MGR_NEG` (идущие переговоры), письма `MGR.inbox` kind `offer`.
- Produces: `MGR.short` (массив ников), `mgrShortToggle(h)`, `MGR_SUB.transfers ∈ market|short|deals`.

- [ ] **Step 1: Тест**

```js
MGR_SUB.transfers='market'; mgrRenderHub('transfers');
check('трансферы '+lang+': подвкладки', document.querySelectorAll('#mgBody .ch-subtab').length===3);
const first=mgrMarketList()[0]; mgrShortToggle(first.handle);
MGR_SUB.transfers='short'; mgrRenderHub('transfers');
check('шортлист: игрок там', document.getElementById('mgBody').textContent.indexOf(first.handle)>=0);
mgrShortToggle(first.handle); check('шортлист: снят', (MGR.short||[]).indexOf(first.handle)<0);
MGR_SUB.transfers='deals'; mgrRenderHub('transfers'); check('переговоры без undefined', !bad(document.getElementById('mgBody').innerHTML));
```

- [ ] **Step 2: Прогон** → FAIL.
- [ ] **Step 3: Реализация.**

```js
function mgrSubTabsHTML(group, list){ return '<div class="ch-subtabs">'+list.map(([k,t])=>'<button class="ch-subtab'+(MGR_SUB[group]===k?' on':'')+'" onclick="MGR_SUB.'+group+'=\''+k+'\';mgrRenderHub()">'+esc(t)+'</button>').join('')+'</div>'; }
function mgrShortToggle(h){ MGR.short=MGR.short||[]; const i=MGR.short.indexOf(h); if(i<0) MGR.short.push(h); else MGR.short.splice(i,1); mgrSave(); }
function mgrShortHTML(){ const T9=mgrT9(), list=(MGR.short||[]).map(h=>mgrCardBase(h)).filter(Boolean);
  if(!list.length) return '<div class="ch-empty">'+esc(T9.shortEmpty)+'</div>';
  return '<div class="mg-clubs">'+list.map(c=>{ const hq=esc(String(c.handle).replace(/'/g,''));
    return '<div class="mg-club"><span class="mg-cname"><b>'+(c.nat?flagImg(c.nat,13)+' ':'')+esc(c.handle)+' <small>'+Math.round(ccCardOvr(c)||0)+'</small></b>'+
      '<small>'+esc(mgrOrgOf(c)||mgrT2().free)+' · '+mgrT4().pot+' '+esc(mgrPotText(c.handle))+' · '+mgrMoney(mgrSalary(c))+'</small></span>'+
      '<button class="cc-back" onclick="mgrShortToggle(\''+hq+'\');mgrRenderHub()">★</button>'+
      '<button class="ch-play mg-take" onclick="mgrSign(\''+hq+'\')">'+esc(mgrT2().sign)+'</button></div>'; }).join('')+'</div>'; }
function mgrDealsHTML(){ const T9=mgrT9();
  const offers=(MGR.inbox||[]).filter(m=>!m.done && (m.kind==='offer'||m.kind==='leave'));
  const neg=MGR_NEG ? '<div class="ch-tile">'+esc(T9.negNow(MGR_NEG.h||''))+' <button class="cc-back" onclick="mgrNegDraw()">'+esc(T9.open)+'</button></div>' : '';
  return neg+(offers.length ? '<div class="ch-tile"><h4>'+esc(T9.offersIn)+'</h4>'+offers.map(m=>'<div class="mgn-row" onclick="mgrRenderHub(\'inbox\')">'+esc(m.title||m.text||'')+'</div>').join('')+'</div>'
                            : (neg ? '' : '<div class="ch-empty">'+esc(T9.dealsEmpty)+'</div>'));
}
function mgrTransfersHTML(){ const T9=mgrT9();
  const top=mgrSubTabsHTML('transfers', [['market',T9.market],['short',T9.short+((MGR.short||[]).length?' · '+MGR.short.length:'')],['deals',T9.deals]]);
  const bud='<div class="ch-tile mgt-bud"><div class="mgn-row"><em>'+esc(T9.transfer)+'</em><b>'+mgrMoney(MGR.club.transfer||0)+'</b></div>'+
    '<div class="mgn-row"><em>'+esc(T9.wageCap)+'</em><b>'+mgrMoney(mgrWageBill())+' / '+mgrMoney(MGR.club.wageCap||0)+'</b></div></div>';
  const s=MGR_SUB.transfers;
  return top+bud+(s==='short' ? mgrShortHTML() : s==='deals' ? mgrDealsHTML() : mgrMarketHTML());
}
```

Поля `MGR_NEG` — взять фактические из `mgrNegotiate` (~155534) при реализации и поправить `MGR_NEG.h`. В `mgrMarketHTML` в каждую строку — кнопка `★`/`☆` по `(MGR.short||[]).indexOf(c.handle)` с `onclick="mgrShortToggle(…);mgrRenderHub()"`; их `onchange="…;mgrOpenHub()"` у поиска/галочек остаются. `mgrT9`: `market:'Рынок', short:'Шортлист', deals:'Переговоры', shortEmpty:'Отметь игроков звёздочкой на рынке', dealsEmpty:'Переговоров нет', offersIn:'Предложения за твоих', negNow:h=>'Идут переговоры: '+h, open:'Открыть'` + en.

- [ ] **Step 4: Прогон** → OK.
- [ ] **Step 5: Commit** — «Менеджер: Трансферы — рынок, шортлист, переговоры, бюджеты на виду».

---

### Task 9: Входящие, Клуб, Таблицы

**Files:**
- Modify: `index.html` — ветки `inbox|club|tables` в `mgrTabBody`; `mgrInboxHTML` — список + письмо (`MGR_MAIL` выбранное).
- Test: секция «прочие вкладки».

**Interfaces:**
- Consumes: `mgrInboxHTML()` (кнопки принять/отказать внутри), `mgrTrainHTML()`, `mgrStaffHTML` (если отдельной нет — блок штаба из `mgrTrainHTML`), `mgrFacHTML()`, `mgrDealHTML()`, `mgrEvFreqHTML()`, `mgrStatsHTML()`, `mgrTrophiesHTML()`, `mgrRivalsHTML()`, `mgrPress`.
- Produces: `MGR_SUB.club ∈ train|base|sponsor|press`, `MGR_SUB.tables ∈ stats|trophies|managers`, `let MGR_MAIL=null` (индекс открытого письма).

- [ ] **Step 1: Тест**

```js
for(const [tab, group, keys] of [['club','club',['train','base','sponsor','press']],['tables','tables',['stats','trophies','managers']]])
  for(const k of keys){ MGR_SUB[group]=k; mgrRenderHub(tab);
    check(tab+'/'+k+' '+lang+': рисуется', !document.querySelector('#mgBody .cc-ffo-err') && !bad(document.getElementById('mgBody').innerHTML)); }
MGR.inbox.unshift({kind:'scout', title:'Тест', text:'Письмо', day:CAREER.career.day}); mgrRenderHub('inbox');
check('входящие: письмо в списке', document.getElementById('mgBody').textContent.indexOf('Тест')>=0);
check('входящие: точка на вкладке', !!document.querySelector('#mgTabs [data-tab="inbox"] .ch-dot'));
```

- [ ] **Step 2: Прогон** → FAIL.
- [ ] **Step 3: Реализация.**

```js
function mgrTabBody(tab){
  const T9=mgrT9();
  if(tab==='centre') return mgrCentreHTML();
  if(tab==='squad') return mgrSquadHTML();
  if(tab==='transfers') return mgrTransfersHTML();
  if(tab==='inbox') return '<div class="ch-tile mgi">'+mgrInboxHTML()+'</div>';
  if(tab==='club'){ const s=MGR_SUB.club;
    return mgrSubTabsHTML('club', [['train',T9.train],['base',T9.base],['sponsor',T9.sponsor],['press',T9.press]])+
      (s==='base' ? mgrFacHTML() : s==='sponsor' ? mgrDealHTML() : s==='press' ? mgrEvFreqHTML() : mgrTrainHTML()); }
  if(tab==='tables'){ const s=MGR_SUB.tables;
    return mgrSubTabsHTML('tables', [['stats',T9.stats],['trophies',T9.trophies],['managers',T9.managers]])+
      (s==='trophies' ? mgrTrophiesHTML() : s==='managers' ? mgrRivalsHTML() : mgrStatsHTML()); }
  return mgrCentreHTML();
}
```

(Задачи 6–8 уже добавили свои ветки — эта функция их сводит; заглушку из задачи 5 заменить.) Если `mgrDealHTML()` возвращает пусто после выбора спонсора — в подвкладке «Спонсор» показать выбранного: `MGR.deal` (имя из `MGR_SP_NAMES`, множитель). Пресс-конференция — кнопки `mgrPress` из старого экрана вечера, если их нет вне вечера — подвкладка «Пресса» показывает только `mgrEvFreqHTML()` (частоту событий). Входящие: `mgrInboxHTML` уже выдаёт список с действиями; обернуть в `.ch-tile`, письма — строки как в личках (`.mgi .mg-mail` → стиль `cc-dm-row` карьеры). `mgrT9`: `train:'Тренировки', base:'База', sponsor:'Спонсор', press:'Пресса', stats:'Статистика', trophies:'Трофеи', managers:'Менеджеры'` + en.

- [ ] **Step 4: Прогон** → OK.
- [ ] **Step 5: Commit** — «Менеджер: Входящие, Клуб и Таблицы подвкладками».

---

### Task 10: Сезон целиком, телефон, debug

**Files:**
- Modify: `tools/check-mgr-hub.js` — секция «сезон»; правки по найденному.
- Test: сам сторож + снимки.

- [ ] **Step 1: Секция «сезон»** (только для `lang==='ru'`): клуб 2024 EU, затем цикл `while(mgrEvents().length && guard++<80) mgrSkip();` и `mgrSeasonReview()`; `check('сезон: дошёл до итогов', guard<80)`; `mgrRenderHub('centre')` без плашки; затем то же для своего клуба 2021 ME (трио, мало свободных).
- [ ] **Step 2: Прогон** → OK; если нет — чинить и повторять.
- [ ] **Step 3: Снимки** — headless Chrome `--window-size=430,932` и `1366,768` по вкладкам (`--screenshot`, страница с BOOT, который открывает нужную вкладку по `location.hash`): ни горизонтальной прокрутки (`document.documentElement.scrollWidth<=innerWidth` проверкой в сторожe при 430), ни обрезанной `.ch-play`. Смотреть снимки глазами (Read png).
- [ ] **Step 4: Соседние сторожа** — `check-mgr-*`, `check-career-newseason`, `check-career-train-fc`, `check-mp-same`: красных не больше, чем на бейзлайне (сравнить `git stash` — НЕ во время фоновых прогонов).
- [ ] **Step 5: Commit + debug** — `node tools/stamp-build.js`, коммит штампа, `node tools/build-deploy.js "<…деплои/fncsdraft-debug-07.10mgr>"`, `node tools/check-deploy-folder.js <папка>` отдельной командой, затем из домашней папки `npx wrangler pages deploy <папка> --project-name=fncsdraft --branch=debug --commit-dirty=true`; проверить `https://debug.fncsdraft.pages.dev` отдаёт новый `app.js?v=`. Прод не трогать.
