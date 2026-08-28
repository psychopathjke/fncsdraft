# Мультиплеерная карьера: план работ

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** двое играют одну карьеру одной командой — живой человек на месте бота-напарника.

**Architecture:** локстеп. Сервер — арбитр порядка, а не движок: он хранит состояние команды, нумерует решения и рассылает их обоим в одном порядке, а вечер каждый браузер считает сам. Это возможно потому, что измерено: два процесса Chrome с разной личной жизнью дают таблицу байт в байт (`tools/probe-lockstep.js`). Клиент — новый файл `mp.js` рядом с `zone-sim.js`; в `index.html` только точки врезки.

**Tech Stack:** ванильный JS без сборки; Cloudflare Worker + Durable Object (wrangler, уже авторизован на keegorka@gmail.com); проверки — headless Chrome через `tools/check-*.js`, ровно как весь остальной репозиторий.

**Spec:** `docs/superpowers/specs/2026-08-25-multiplayer-career-design.md`

## Global Constraints

- **Идиома проверок одна на весь репозиторий.** Скрипт в `tools/`, поднимает страницу в headless Chrome, печатает заметки, `process.exit(0|1)`. Никаких новых раннеров тестов. Серверные проверки — такие же скрипты на node, без Chrome.
- **`index.html` не растёт.** В нём 72 тысячи строк. Весь код мультиплеера — в `mp.js`; в `index.html` добавляются только вызовы и константы, каждая точка врезки названа в спеке.
- **Кэш скриптов.** У каждого `<script src>` стоит `?v=<sha1 первые 8>`. Поменял `mp.js` — обнови тег, иначе браузер возьмёт старый файл (это уже валило прод: `game.roster is not a function`). Хеш: `node -e "const c=require('crypto'),f=require('fs');console.log(c.createHash('sha1').update(f.readFileSync('mp.js')).digest('hex').slice(0,8))"`.
- **Коммиты — с оглядкой на концы строк.** `core.autocrlf=true`, но `index.html` лежит в репозитории как CRLF, а `*.js` как LF. Перед `git add`: `index.html` → `git -c core.autocrlf=false add index.html`; `.js` → привести к LF и так же. Проверять `git diff --cached --stat`: если тысячи строк на правку в десяток — концы строк не те. **Никогда** не проверять концы через `git show HEAD:file` — он применяет конверсию и врёт.
- **Личное не влияет на расчёт.** Всё, что не в `CC_TEAM_KEYS`, обязано не двигать таблицу. Это не пожелание, а условие локстепа, и оно проверяется сторожем на каждой сборке.
- **Сервер не считает игру.** Ни одной строки симуляции в `server/`. Если понадобилась — значит модель сломалась, надо остановиться и пересмотреть.
- **Первая версия — только дуо.** Ни трио, ни чата, ни списка друзей, ни переноса одиночной карьеры, ни турниров между командами. Спека перечисляет это явно.

---

## Структура файлов

| Файл | За что отвечает |
|---|---|
| `mp.js` (создать) | Транспорт и склейка: вебсокет, лента событий, состояние команды, карточка напарника. Единственное место, знающее про сервер. |
| `index.html` (править) | Семь точек врезки из спеки + `CC_TEAM_KEYS`, `ccTeamState`, `ccApplyTeamState`, `ccWorldReset`, `CC_BUILD`. |
| `server/src/lobby.js` (создать) | Чистая машина состояний лобби: кто вошёл, кто готов, номера событий, разрешение расхождения. Ни одного вызова Workers API — поэтому проверяется без сети. |
| `server/src/worker.js` (создать) | Тонкий переходник: `fetch` → Durable Object → `lobby.js`. |
| `server/wrangler.toml` (создать) | Имя проекта, биндинг DO, миграция. |
| `tools/check-lockstep.js` (создать из пробы) | Сторож сходимости на расчётном пути. |
| `tools/check-lockstep-live.js` (создать из пробы) | То же на живом пути, включая другой темп показа. |
| `tools/check-mp-world-reset.js` (создать) | Кэши мира сбрасываются при приходе чужого состояния. |
| `tools/check-mp-split.js` (создать) | Командное и личное разделены правильно и ничего не потеряно. |
| `tools/check-mp-build.js` (создать) | `CC_BUILD` не отстал от `index.html`. |
| `tools/stamp-build.js` (создать) | Переставляет `CC_BUILD` после правки `index.html`. |
| `tools/check-mp-card.js` (создать) | Из двух обменянных карточек обе стороны собирают одну команду. |
| `tools/check-mp-gate.js` (создать) | Раннеры не стартуют, пока напарник не готов. |
| `tools/check-mp-relay.js` (создать) | Решение одного приезжает второму и применяется без вопроса. |
| `tools/check-mp-break.js` (создать) | После разрыва карьера открывается одиночной. |
| `server/tools/check-lobby.js` (создать) | Машина состояний лобби: вход, готовность, порядок событий, догон по номерам, расхождение. |
| `server/tools/check-worker.js` (создать) | Живой `wrangler dev`: два вебсокета проходят вечер целиком. |

Порядок задач выбран так, что сторожа сходимости встают **первыми**: всё, что идёт после, ими и защищено.

---

## Task 1: Сторожа локстепа

Две пробы уже написаны и уже выходят с нужным кодом. Задача — сделать их частью сборки, чтобы правка симуляции не сломала сходимость молча.

**Files:**
- Create: `tools/check-lockstep.js` (копия `tools/probe-lockstep.js`)
- Create: `tools/check-lockstep-live.js` (копия `tools/probe-lockstep-live.js`)
- Delete: `tools/probe-lockstep.js`, `tools/probe-lockstep-live.js`

**Interfaces:**
- Consumes: ничего.
- Produces: два скрипта, выходящие `0` при сходимости и `1` при расхождении. Дальше на них опирается каждая задача.

- [x] **Step 1: Убедиться, что пробы сейчас зелёные**

```bash
node tools/probe-lockstep.js
node tools/probe-lockstep-live.js
```

Ожидание: обе печатают «СОШЛОСЬ» и строку про сработавший контроль, код выхода 0. Если хоть одна красная — **остановиться и разобраться**: весь план стоит на их «сошлось».

- [x] **Step 2: Переименовать**

```bash
git mv tools/probe-lockstep.js tools/check-lockstep.js
git mv tools/probe-lockstep-live.js tools/check-lockstep-live.js
```

- [x] **Step 3: Поправить строку запуска в шапке каждого файла**

В `tools/check-lockstep.js` заменить `//   node tools/probe-lockstep.js` на `//   node tools/check-lockstep.js`. То же во втором файле. Дописать в шапку каждого:

```
// Это СТОРОЖ, а не проба: он гоняется на каждой сборке. Локстеп — единственное
// допущение, на котором стоит командная карьера, и ломается он молча: таблицы
// разъезжаются, а на экране у обоих всё выглядит нормально до конца вечера.
```

- [x] **Step 4: Прогнать под новыми именами**

```bash
node tools/check-lockstep.js && node tools/check-lockstep-live.js && echo OBA-ZELENYE
```

Ожидание: `OBA-ZELENYE`.

- [ ] **Step 5: Коммит**

```bash
printf '%s\n' tools/check-lockstep.js tools/check-lockstep-live.js | xargs -I{} sh -c "node -e \"const f=require('fs');f.writeFileSync('{}',f.readFileSync('{}','utf8').replace(/\r\n/g,'\n'))\""
git -c core.autocrlf=false add tools/check-lockstep.js tools/check-lockstep-live.js
git rm --cached tools/probe-lockstep.js tools/probe-lockstep-live.js 2>/dev/null || true
git diff --cached --stat
git commit -m "test: promote the two lockstep probes to build guards"
```

Ожидание: `--stat` показывает сотни строк, не десятки тысяч.

---

## Task 2: Сброс кэшей мира

Кэши пула и сцены строятся на первое обращение и живут до конца страницы. Состояние команды приезжает от сервера **после** загрузки — не сбросишь, клиент посчитает вечер по вчерашней сцене и разойдётся молча. Ловушка найдена при измерении локстепа и стоит одну функцию.

**Files:**
- Modify: `index.html` — рядом с `let CC_YEAR_DAYS=null;` (строка ~54549)
- Create: `tools/check-mp-world-reset.js`

**Interfaces:**
- Consumes: ничего.
- Produces: `ccWorldReset()` — без аргументов, ничего не возвращает. Задачи 3 и 6 обязаны звать её после каждого прихода командного состояния.

- [x] **Step 1: Написать падающую проверку**

Создать `tools/check-mp-world-reset.js` по образцу любого `tools/check-career-*.js` (шапка с поиском Chrome, `BOOT`, разбор `PBEGIN…PEND`). Тело:

```js
    // Мир строится один раз и живёт до конца страницы. Командная карьера
    // получает чужой мир ПОСЛЕ загрузки — значит построенное надо выбросить.
    seed('EU', 2);
    careerPools(); ccSceneRoster('EU'); careerOrgPool(); careerYearDays();
    out.notes.before = {
      pools: !!CC_POOLS, now: Object.keys(CC_NOW_CARDS).length,
      eu: Object.keys(CC_EU_ALL).length, nat: Object.keys(CC_NAT_POOL).length,
      orgs: Object.keys(CC_ORG_POOL).length, year: !!CC_YEAR_DAYS,
      arc: Object.keys(CC_ARC_PAIRS).length, tbl: Object.keys(CH_ARC_TBL).length
    };
    check('мир построен, иначе проверять нечего',
          !!CC_POOLS && !!CC_YEAR_DAYS, JSON.stringify(out.notes.before));

    ccWorldReset();

    out.notes.after = {
      pools: CC_POOLS, now: Object.keys(CC_NOW_CARDS).length,
      eu: Object.keys(CC_EU_ALL).length, nat: Object.keys(CC_NAT_POOL).length,
      orgs: Object.keys(CC_ORG_POOL).length, year: CC_YEAR_DAYS,
      arc: Object.keys(CC_ARC_PAIRS).length, tbl: Object.keys(CH_ARC_TBL).length
    };
    check('пул сброшен', CC_POOLS === null, String(CC_POOLS));
    check('снимок сцены сброшен', Object.keys(CC_NOW_CARDS).length === 0);
    check('и его метка тоже', CC_NOW_TAG === null, String(CC_NOW_TAG));
    check('европейский список сброшен', Object.keys(CC_EU_ALL).length === 0);
    check('флаги лестницы сброшены', Object.keys(CC_NAT_POOL).length === 0);
    check('клубы сброшены', Object.keys(CC_ORG_POOL).length === 0);
    check('подписи года сброшены', CC_YEAR_DAYS === null);
    check('пары архива сброшены', Object.keys(CC_ARC_PAIRS).length === 0);
    check('таблицы архива сброшены', Object.keys(CH_ARC_TBL).length === 0);

    // И мир строится заново, а не остаётся пустым.
    const again = careerPools();
    check('после сброса мир строится заново', !!again && !!CC_POOLS);
```

- [x] **Step 2: Прогнать — должно упасть**

```bash
node tools/check-mp-world-reset.js
```

Ожидание: `ReferenceError: ccWorldReset is not defined`, код выхода 1.

- [x] **Step 3: Написать функцию**

В `index.html` сразу после `let CC_YEAR_DAYS=null;`:

```js
/* Мир, построенный этой страницей, — выбросить.

   Пул, снимок сцены, европейский список, флаги лестницы, клубы, подписи года,
   пары и таблицы архива строятся на ПЕРВОЕ обращение и живут до конца страницы.
   Одиночной карьере это правильно: мир у неё один. Командная получает мир от
   сервера ПОСЛЕ загрузки — и если построенное не выбросить, клиент считает
   вечер по вчерашней сцене и расходится с напарником МОЛЧА: на экране у обоих
   всё выглядит нормально до самой таблицы.

   Найдено при измерении локстепа, до единой строки мультиплеера. */
function ccWorldReset(){
  CC_POOLS=null;
  CC_NOW_CARDS={}; CC_NOW_TAG=null; CC_ARC_PAIRS={};
  CC_EU_ALL={};
  CC_NAT_POOL={};
  CC_ORG_POOL={};
  CC_YEAR_DAYS=null;
  CH_ARC_TBL={};
}
```

Объявления `CC_NOW_CARDS`, `CC_EU_ALL`, `CC_NAT_POOL`, `CC_ORG_POOL`, `CH_ARC_TBL` стоят ниже по файлу (строки ~55369, ~56114, ~55194, ~58044, ~72293) — это `let`, они поднимаются на верх области видимости, но **инициализируются позже**. Функция зовётся только в рантайме, после загрузки скрипта, поэтому обращение законно. Если проверка упадёт на `Cannot access before initialization` — значит её позвали во время разбора файла, и звать надо позже.

- [x] **Step 4: Прогнать — должно пройти**

```bash
node tools/check-mp-world-reset.js
```

Ожидание: `PASS`, код 0, в заметках `after` все нули и `null`.

- [x] **Step 5: Убедиться, что ничего не сломано**

```bash
node tools/check-page-errors.js && node tools/check-career-sim.js && node tools/check-career-year-cache.js
```

- [ ] **Step 6: Коммит**

```bash
node -e "const f=require('fs');f.writeFileSync('tools/check-mp-world-reset.js',f.readFileSync('tools/check-mp-world-reset.js','utf8').replace(/\r\n/g,'\n'))"
git -c core.autocrlf=false add index.html tools/check-mp-world-reset.js
git diff --cached --stat
git commit -m "feat: ccWorldReset drops the caches a foreign world would poison"
```

---

## Task 3: Разделение командного и личного

Сейчас `careerSave` пишет весь `CAREER` в localStorage, вызовов 114. Разделение делается **внутри функции**, а не по местам вызова.

**Files:**
- Modify: `index.html` — `careerSave` (~строка 66700), `careerLoad` (~строка 50735)
- Create: `tools/check-mp-split.js`

**Interfaces:**
- Consumes: `ccWorldReset()` из задачи 2.
- Produces:
  - `const CC_TEAM_KEYS` — массив строк, поля `CAREER.career`, принадлежащие команде.
  - `ccTeamState()` → `{seed, day, season, division, tokens, seasonOver, sizes, dev, trios, log, majorSeed, mp}` — плоский объект, только командные поля, без ссылок на `CAREER`.
  - `ccApplyTeamState(t)` → `void`; пишет поля в `CAREER.career` и зовёт `ccWorldReset()`.
  - `ccMpOn()` → `boolean`; `true`, если у карьеры есть `career.mp.code`.

- [x] **Step 1: Написать падающую проверку**

Создать `tools/check-mp-split.js`. Тело:

```js
    seed('EU', 2);
    const cr = CAREER.career;
    cr.balance = 48000; cr.earnings = 12000; cr.form = 3; cr.grind = 2;
    cr.log = [{season:1, day:'2026-02-02', place:4, kind:'cup'}];
    cr.dev = {scroll:6}; cr.trios = {'a+b':'c'};
    cr.majorSeed = {n:1, season:1, size:2, rows:['you']};
    cr.tokens = ['t1']; cr.sizes = {1:2};

    const t = ccTeamState();
    out.notes.team = Object.keys(t).sort();
    // Командное — только то, что названо, и ничего сверх.
    check('состав командных полей ровно такой, как в спеке',
          out.notes.team.join(',') ===
          ['day','dev','division','log','majorSeed','mp','season','seasonOver','seed','sizes','tokens','trios'].join(','),
          out.notes.team.join(','));
    check('журнал команды уехал', Array.isArray(t.log) && t.log.length === 1);
    check('книга роста уехала', t.dev && t.dev.scroll === 6);
    check('память третьих уехала', t.trios && t.trios['a+b'] === 'c');
    // Личное — не уехало.
    ['balance','earnings','form','grind'].forEach(k =>
      check('личное поле ' + k + ' не в командном состоянии', t[k] === undefined, String(t[k])));

    // Снимок не связан с живым сейвом: правка снимка не двигает карьеру.
    t.day = '2099-01-01';
    check('снимок отвязан от карьеры', CAREER.career.day !== '2099-01-01', CAREER.career.day);

    // Приход чужого состояния переписывает командное и НЕ трогает личное.
    ccApplyTeamState({day:'2026-05-05', season:2, division:3, tokens:[], seasonOver:false,
                      sizes:{1:2,2:3}, dev:{}, trios:{}, log:[], majorSeed:null,
                      seed:'team-XYZ', mp:{code:'ABC123', role:'b'}});
    check('день пришёл от сервера', CAREER.career.day === '2026-05-05', CAREER.career.day);
    check('дивизион тоже', CAREER.career.division === 3, String(CAREER.career.division));
    check('деньги остались свои', CAREER.career.balance === 48000, String(CAREER.career.balance));
    check('форма осталась своя', CAREER.career.form === 3, String(CAREER.career.form));
    check('мир сброшен приходом состояния', CC_POOLS === null && CC_YEAR_DAYS === null);
    check('карьера стала командной', ccMpOn() === true, String(ccMpOn()));

    // Одиночная карьера ничего не заметила: сейв как был.
    delete CAREER.career.mp;
    careerSave(); careerLoad();
    check('одиночный сейв пишется и читается целиком',
          CAREER.career.balance === 48000 && CAREER.career.day === '2026-05-05',
          CAREER.career.balance + ' / ' + CAREER.career.day);
    check('и она снова одиночная', ccMpOn() === false);
```

- [x] **Step 2: Прогнать — должно упасть**

```bash
node tools/check-mp-split.js
```

Ожидание: `ReferenceError: ccTeamState is not defined`.

- [x] **Step 3: Написать разделение**

В `index.html` рядом с `careerSave`:

```js
/* Что принадлежит команде, а что человеку.

   Список закрытый и перечислен в спеке. Всё, чего в нём нет, — личное: энергия,
   форма, деньги, контракт, квартира, спонсоры, девайсы, инбокс, охват. Оно
   лежит в localStorage у каждого своё и на расчёт вечера не влияет — это не
   удобство, а условие локстепа, и его стережёт check-lockstep.js.

   `mp` держит код лобби и роль; он командный, потому что разрыв дуо обязан
   доехать до обоих. */
const CC_TEAM_KEYS=['seed','day','season','division','tokens','seasonOver',
                    'sizes','dev','trios','log','majorSeed','mp'];
function ccMpOn(){
  return !!(CAREER && CAREER.career && CAREER.career.mp && CAREER.career.mp.code);
}
// Снимок командного состояния. Копия, а не ссылки: то, что уходит на сервер,
// не должно меняться под руками, пока летит.
function ccTeamState(){
  const cr=(CAREER && CAREER.career) || {};
  const out={};
  CC_TEAM_KEYS.forEach(k=>{ out[k] = (cr[k]===undefined) ? undefined
                                   : JSON.parse(JSON.stringify(cr[k])); });
  return out;
}
/* Состояние команды, пришедшее от сервера.

   Пишутся ТОЛЬКО командные поля — личное остаётся тем, что лежит в этом
   браузере. И сразу за этим выбрасывается мир: он построен по прошлому
   состоянию, а сцена только что могла стать другой. См. ccWorldReset. */
function ccApplyTeamState(t){
  if(!t || !CAREER || !CAREER.career) return;
  CC_TEAM_KEYS.forEach(k=>{ if(t[k]!==undefined) CAREER.career[k]=t[k]; });
  ccWorldReset();
}
```

В `careerSave`, сразу после `if(!CAREER) return;`:

```js
  // В командной карьере командная половина живёт на сервере, а не здесь.
  // Пишется всё равно всё: localStorage — это кэш на случай обрыва, и
  // карьера должна открыться, даже когда лобби недоступно. Наверх уходит
  // только командная часть, и делает это mp.js по своему поводу.
  if(ccMpOn() && typeof MP!=='undefined' && MP.push) MP.push(ccTeamState());
```

- [x] **Step 4: Прогнать — должно пройти**

```bash
node tools/check-mp-split.js
```

- [x] **Step 5: Убедиться, что одиночный режим цел**

```bash
node tools/check-career-save-size.js && node tools/check-career-sim.js && node tools/check-career-newseason.js && node tools/check-page-errors.js
```

- [ ] **Step 6: Коммит**

```bash
node -e "const f=require('fs');f.writeFileSync('tools/check-mp-split.js',f.readFileSync('tools/check-mp-split.js','utf8').replace(/\r\n/g,'\n'))"
git -c core.autocrlf=false add index.html tools/check-mp-split.js
git diff --cached --stat
git commit -m "feat: split career state into team-owned and personal halves"
```

---

## Task 4: Метка сборки

Локстеп ломается, если в одном лобби сошлись две версии кода. Спека: разные версии не пускаются, а просят обновить страницу. Значит нужна метка, которая **не отстаёт** от файла.

**Files:**
- Modify: `index.html` — константа рядом с `CC_TEAM_KEYS`
- Create: `tools/stamp-build.js`, `tools/check-mp-build.js`

**Interfaces:**
- Consumes: ничего.
- Produces: `const CC_BUILD='<8 hex>'` — читается `mp.js` в задаче 6 и сервером в задаче 5.

- [x] **Step 1: Написать штамповщик**

`tools/stamp-build.js`:

```js
// Переставляет CC_BUILD в index.html на sha1 самого файла.
//
// Хеш считается по файлу, из которого ВЫРЕЗАНА строка с самой меткой — иначе
// он зависел бы от себя и не сходился никогда. Тот же приём, что у ?v= на
// скриптах, только источник здесь — сам документ.
//
//   node tools/stamp-build.js
const fs=require('fs'), path=require('path'), crypto=require('crypto');
const FILE=path.resolve(__dirname,'..','index.html');
const RE=/^const CC_BUILD='[0-9a-f]{8}';$/m;
const src=fs.readFileSync(FILE,'utf8');
if(!RE.test(src)){ console.error('строки CC_BUILD в index.html нет'); process.exit(2); }
const bare=src.replace(RE, "const CC_BUILD='';");
const hash=crypto.createHash('sha1').update(bare).digest('hex').slice(0,8);
const out=src.replace(RE, "const CC_BUILD='"+hash+"';");
if(out===src){ console.log('CC_BUILD уже '+hash); process.exit(0); }
fs.writeFileSync(FILE, out);
console.log('CC_BUILD -> '+hash);
```

- [x] **Step 2: Написать сторожа**

`tools/check-mp-build.js`:

```js
// CC_BUILD не отстал от index.html.
//
// Отставшая метка страшнее отсутствующей: два клиента с разным кодом решат,
// что они одной версии, и разойдутся в середине вечера — ровно то, что
// проверка версий и должна была предотвратить.
//
//   node tools/check-mp-build.js
const fs=require('fs'), path=require('path'), crypto=require('crypto');
const FILE=path.resolve(__dirname,'..','index.html');
const RE=/^const CC_BUILD='([0-9a-f]{8})';$/m;
const src=fs.readFileSync(FILE,'utf8');
const m=src.match(RE);
if(!m){ console.error('FAIL в index.html нет строки CC_BUILD'); process.exit(1); }
const bare=src.replace(RE, "const CC_BUILD='';");
const want=crypto.createHash('sha1').update(bare).digest('hex').slice(0,8);
if(m[1]!==want){
  console.error('FAIL метка сборки отстала: в файле '+m[1]+', посчиталось '+want);
  console.error('     починка: node tools/stamp-build.js');
  process.exit(1);
}
console.log('метка сборки совпадает с файлом: '+want);
```

- [x] **Step 3: Прогнать сторожа — должен упасть**

```bash
node tools/check-mp-build.js
```

Ожидание: `FAIL в index.html нет строки CC_BUILD`.

- [x] **Step 4: Поставить константу и заштамповать**

В `index.html` перед `const CC_TEAM_KEYS`:

```js
/* Метка этой сборки. Ставится tools/stamp-build.js, сверяется
   tools/check-mp-build.js. Лобби не пускает клиента с чужой меткой: локстеп
   держится на том, что обе стороны считают ОДНИМ И ТЕМ ЖЕ кодом. */
const CC_BUILD='00000000';
```

Затем:

```bash
node tools/stamp-build.js
node tools/check-mp-build.js
```

Ожидание: `CC_BUILD -> <hex>`, потом `метка сборки совпадает с файлом`.

- [x] **Step 5: Проверить отрицательно**

```bash
node -e "const f=require('fs');f.writeFileSync('index.html',f.readFileSync('index.html','utf8').replace('<title>','<title> '))"
node tools/check-mp-build.js; echo "код выхода: $?"
node -e "const f=require('fs');f.writeFileSync('index.html',f.readFileSync('index.html','utf8').replace('<title> ','<title>'))"
node tools/check-mp-build.js
```

Ожидание: посередине `FAIL метка сборки отстала` и код 1; в конце снова зелёный. **Это обязательный шаг:** сторож, который не умеет падать, ничего не стережёт.

- [ ] **Step 6: Коммит**

```bash
node -e "['tools/stamp-build.js','tools/check-mp-build.js'].forEach(p=>{const f=require('fs');f.writeFileSync(p,f.readFileSync(p,'utf8').replace(/\r\n/g,'\n'))})"
git -c core.autocrlf=false add index.html tools/stamp-build.js tools/check-mp-build.js
git diff --cached --stat
git commit -m "feat: stamp and verify a build mark for the lobby version gate"
```

---

## Task 5: Машина состояний лобби

Чистая логика, без Workers API и без сети, — поэтому проверяется обычным node за секунду.

**Files:**
- Create: `server/src/lobby.js`, `server/tools/check-lobby.js`

**Interfaces:**
- Consumes: ничего.
- Produces: `createLobby(opts)` → объект с методами. Каждый метод возвращает **массив отправок**: `[{to:'all'|'self'|'peer', msg:{...}}]`. Сервер их только рассылает.
  - `lobby.join(id, {build, card})` → отправки; при чужом `build` — `[{to:'self', msg:{t:'bye', reason:'build'}}]`
  - `lobby.card(id, card)` → отправки
  - `lobby.ready(id, day)` → отправки; когда готовы оба и день турнирный, среди них `{t:'start', seed, n}`
  - `lobby.act(id, kind, payload)` → `[{to:'all', msg:{t:'act', n, kind, payload, by:id}}]`
  - `lobby.digest(id, hash, team)` → отправки; при совпадении `{t:'close', team}`
  - `lobby.since(id, n)` → массив событий с номером больше `n` (догон после обрыва)
  - `lobby.part(id)` → отправки, разрыв дуо
  - `lobby.state` → `{team, cards, ready, evening}` для хранения в DO

- [x] **Step 1: Написать падающую проверку**

`server/tools/check-lobby.js`:

```js
// Машина состояний лобби: вход, готовность, порядок решений, догон, расхождение.
//
// Сервер — арбитр порядка, а не движок. Здесь проверяется ровно это: он
// нумерует и рассылает, ничего не считая. Ни Chrome, ни сети.
//
//   node server/tools/check-lobby.js
const { createLobby } = require('../src/lobby.js');
const fails=[];
const check=(n,ok,d)=>{ if(!ok) fails.push(n+(d?': '+d:'')); };
const CARD={handle:'a', nat:'ru', age:20, ovr:93, role:'roleIGL', attrs:{}, org:null,
            form:0, tired:0, sick:false, camp:null, gear:[]};

// ---- вход и проверка версии ----------------------------------------------
let L=createLobby({build:'aaaa1111', seed:'team-1', team:{day:'2026-02-02'}});
let o=L.join('A',{build:'aaaa1111', card:CARD});
check('первый вошёл и получил состояние', o.some(x=>x.msg.t==='state'), JSON.stringify(o));
o=L.join('B',{build:'BADBUILD', card:CARD});
check('чужая сборка не пускается', o.length===1 && o[0].msg.t==='bye' && o[0].msg.reason==='build',
      JSON.stringify(o));
o=L.join('B',{build:'aaaa1111', card:Object.assign({},CARD,{handle:'b'})});
check('второй вошёл', o.some(x=>x.msg.t==='state'));
check('и обоим разослали карточку напарника', o.some(x=>x.to==='all'||x.to==='peer'));

// ---- вечер не начинается, пока не готовы оба ------------------------------
o=L.ready('A','2026-02-02');
check('один готов — старта нет', !o.some(x=>x.msg.t==='start'), JSON.stringify(o));
o=L.ready('B','2026-02-02');
const start=o.find(x=>x.msg.t==='start');
check('оба готовы — старт есть', !!start);
check('и у старта есть сид', start && typeof start.msg.seed==='string' && start.msg.seed.length>0);
check('старт ушёл обоим', start && start.to==='all');

// ---- решения нумеруются и рассылаются в одном порядке ---------------------
const n1=L.act('A','drop',{zone:7})[0].msg.n;
const n2=L.act('B','choice',{i:2})[0].msg.n;
const n3=L.act('A','drop',{zone:9})[0].msg.n;
check('номера растут', n1<n2 && n2<n3, [n1,n2,n3].join(','));
check('каждое решение уходит обоим', L.act('B','choice',{i:1})[0].to==='all');

// ---- догон по номерам после обрыва ---------------------------------------
const tail=L.since('B', n1);
check('догон отдаёт всё после названного номера', tail.length===3, String(tail.length));
check('и в том же порядке', tail.map(e=>e.n).join(',')===[n2,n3,n3+1].join(','),
      tail.map(e=>e.n).join(','));
check('догон с нуля отдаёт весь вечер', L.since('B',0).length===4, String(L.since('B',0).length));

// ---- расхождение: истина — та, что пришла первой --------------------------
o=L.digest('A','hash-AAA',{day:'2026-02-03'});
check('одного хеша мало', !o.some(x=>x.msg.t==='close'), JSON.stringify(o));
o=L.digest('B','hash-BBB',{day:'2026-02-99'});
const close=o.find(x=>x.msg.t==='close');
check('второй хеш закрывает вечер', !!close);
check('истиной стала первая версия', close && close.msg.team.day==='2026-02-03',
      close && JSON.stringify(close.msg.team));
check('и закрытие ушло обоим', close && close.to==='all');
check('расхождение названо', !!o.find(x=>x.msg.t==='close' && x.msg.split===true));

// Совпавшие хеши — тот же close, но без пометки расхождения.
L=createLobby({build:'aaaa1111', seed:'team-2', team:{day:'2026-02-02'}});
L.join('A',{build:'aaaa1111',card:CARD}); L.join('B',{build:'aaaa1111',card:CARD});
L.ready('A','2026-02-02'); L.ready('B','2026-02-02');
L.digest('A','same',{day:'2026-02-03'});
const ok=L.digest('B','same',{day:'2026-02-03'}).find(x=>x.msg.t==='close');
check('совпавшие хеши закрывают вечер без пометки', ok && !ok.msg.split);

// ---- разрыв дуо ------------------------------------------------------------
o=L.part('A');
check('разрыв объявляется обоим', o.some(x=>x.to==='all' && x.msg.t==='bye' && x.msg.reason==='part'),
      JSON.stringify(o));
check('после разрыва вход закрыт',
      L.join('B',{build:'aaaa1111',card:CARD})[0].msg.t==='bye');

if(fails.length){ fails.forEach(f=>console.error('FAIL '+f)); process.exit(1); }
console.log('лобби нумерует и рассылает, ничего не считая');
```

- [x] **Step 2: Прогнать — должно упасть**

```bash
node server/tools/check-lobby.js
```

Ожидание: `Cannot find module '../src/lobby.js'`.

- [x] **Step 3: Написать машину**

`server/src/lobby.js`:

```js
/* Лобби командной карьеры: арбитр порядка.
 *
 * Здесь НЕТ ни одной строки симуляции и быть не должно. Сервер решает только
 * два вопроса: кто уже готов и в каком порядке пришли решения. Вечер считает
 * каждый браузер сам — это измерено (tools/check-lockstep.js), и на этом
 * стоит весь режим.
 *
 * Ни Workers API, ни fetch: поэтому машина проверяется обычным node за
 * секунду, а worker.js остаётся тонким переходником.
 */
'use strict';

function createLobby(opts){
  const o=opts||{};
  const st={
    build:o.build||null,
    seed:o.seed||('team-'+Math.random().toString(36).slice(2,10)),
    team:o.team||{},
    cards:{},            // id -> ночная карточка
    ready:{},            // id -> день, на который заявлена готовность
    feed:[],             // нумерованная лента решений текущего вечера
    n:0,                 // последний выданный номер
    evening:null,        // {seed, n} пока вечер идёт
    digests:{},          // id -> {hash, team}
    over:false           // дуо разорвано
  };
  const ids=()=>Object.keys(st.cards);
  const peerOf=id=>ids().find(x=>x!==id)||null;
  const stateMsg=id=>({t:'state', team:st.team, seed:st.seed,
                       peer:st.cards[peerOf(id)]||null});

  return {
    get state(){ return st; },

    join(id, msg){
      if(st.over) return [{to:'self', msg:{t:'bye', reason:'over'}}];
      // Версия сверяется ДО всего остального: пустить клиента с чужим кодом
      // значит согласиться на молчаливое расхождение в середине вечера.
      if(st.build && msg && msg.build!==st.build)
        return [{to:'self', msg:{t:'bye', reason:'build'}}];
      if(ids().length>=2 && !st.cards[id])
        return [{to:'self', msg:{t:'bye', reason:'full'}}];
      st.cards[id]=(msg&&msg.card)||null;
      const out=[{to:'self', msg:stateMsg(id)}];
      const p=peerOf(id);
      if(p) out.push({to:'peer', msg:{t:'card', card:st.cards[id], by:id}});
      return out;
    },

    card(id, card){
      st.cards[id]=card;
      return [{to:'peer', msg:{t:'card', card:card, by:id}}];
    },

    ready(id, day){
      st.ready[id]=day;
      const all=ids();
      const both=all.length===2 && all.every(x=>st.ready[x]===day);
      if(!both) return [{to:'all', msg:{t:'ready', by:id, day:day}}];
      st.ready={};
      st.feed=[]; st.digests={};
      st.evening={seed:st.seed+'|'+day, n:++st.n};
      return [{to:'all', msg:{t:'start', seed:st.evening.seed, n:st.evening.n, day:day}}];
    },

    act(id, kind, payload){
      const e={t:'act', n:++st.n, kind:kind, payload:payload, by:id};
      st.feed.push(e);
      return [{to:'all', msg:e}];
    },

    // Догон после обрыва: всё, что случилось после названного номера.
    since(id, n){ return st.feed.filter(e=>e.n>n); },

    digest(id, hash, team){
      st.digests[id]={hash:hash, team:team};
      const all=ids();
      if(!all.every(x=>st.digests[x])) return [{to:'peer', msg:{t:'digest', by:id}}];
      /* Расхождение решается порядком прихода, а не спором.
         У игрока на экране всё равно должно оказаться то же, что у напарника,
         и любой другой ответ означал бы, что один из двоих доигрывает вечер,
         которого не было. */
      const first=st.feed.length ? all.slice().sort((a,b)=>
        (st.digests[a].at||0)-(st.digests[b].at||0)) : all;
      const win=st.digests[all[0]].at<=st.digests[all[1]].at ? all[0] : all[1];
      const same=st.digests[all[0]].hash===st.digests[all[1]].hash;
      st.team=st.digests[win].team||st.team;
      st.evening=null; st.feed=[]; st.digests={};
      const msg={t:'close', team:st.team};
      if(!same) msg.split=true;
      return [{to:'all', msg:msg}];
    },

    part(id){
      st.over=true;
      return [{to:'all', msg:{t:'bye', reason:'part', by:id||null}}];
    }
  };
}

module.exports={ createLobby };
```

- [x] **Step 4: Прогнать — разобрать, что упало**

```bash
node server/tools/check-lobby.js
```

Ожидание: упадёт на выборе «первой пришедшей версии» — в `digest` нет отметки времени, а `Date.now()` в машине заводить нельзя, иначе она станет непроверяемой. **Починка:** порядок прихода — это порядок вызовов, а не часы. Заменить тело `digest` на:

```js
    digest(id, hash, team){
      if(!st.digests[id]) st.digests[id]={hash:hash, team:team, seq:++st.n};
      const all=ids();
      if(!all.every(x=>st.digests[x])) return [{to:'peer', msg:{t:'digest', by:id}}];
      const win=st.digests[all[0]].seq<=st.digests[all[1]].seq ? all[0] : all[1];
      const same=st.digests[all[0]].hash===st.digests[all[1]].hash;
      st.team=st.digests[win].team||st.team;
      st.evening=null; st.feed=[]; st.digests={};
      const msg={t:'close', team:st.team};
      if(!same) msg.split=true;
      return [{to:'all', msg:msg}];
    },
```

и убрать неиспользуемую переменную `first`.

- [x] **Step 5: Прогнать — должно пройти**

```bash
node server/tools/check-lobby.js
```

Ожидание: `лобби нумерует и рассылает, ничего не считая`.

- [x] **Step 6: Убедиться, что симуляции в сервере нет**

```bash
grep -nE "simulate|playGame|buildTeam|careerCupField|Math.random" server/src/lobby.js
```

Ожидание: единственное совпадение — `Math.random` в запасном сиде. Если найдётся что-то из симуляции, модель сломана: остановиться.

- [ ] **Step 7: Коммит**

```bash
git add server/src/lobby.js server/tools/check-lobby.js
git diff --cached --stat
git commit -m "feat(server): lobby state machine, order arbiter with no engine"
```

---

## Task 6: Worker и Durable Object

**Files:**
- Create: `server/src/worker.js`, `server/wrangler.toml`, `server/tools/check-worker.js`

**Interfaces:**
- Consumes: `createLobby` из задачи 5.
- Produces: адрес `wss://<worker>/lobby/<CODE>?id=<clientId>&build=<CC_BUILD>`; сообщения — JSON, как в задаче 5.

- [x] **Step 1: Написать конфиг**

`server/wrangler.toml`:

```toml
name = "fncsdraft-mp"
main = "src/worker.js"
compatibility_date = "2026-08-26"

[[durable_objects.bindings]]
name = "LOBBY"
class_name = "Lobby"

[[migrations]]
tag = "v1"
new_sqlite_classes = ["Lobby"]
```

- [x] **Step 2: Написать переходник**

`server/src/worker.js`:

```js
/* Переходник: вебсокет -> Durable Object -> lobby.js.
 *
 * Здесь не принимается ни одного решения. Всё, что этот файл делает, —
 * достаёт лобби по коду, отдаёт сообщение машине и рассылает то, что она
 * вернула. Логика живёт в lobby.js и проверяется без сети.
 */
import { createLobby } from './lobby.js';

export class Lobby {
  constructor(state, env){
    this.state=state; this.env=env;
    this.socks=new Map();               // clientId -> WebSocket
    this.lobby=null;
  }
  async boot(){
    if(this.lobby) return;
    const saved=await this.state.storage.get('lobby');
    this.lobby=createLobby(saved||{});
    if(saved && saved.st) Object.assign(this.lobby.state, saved.st);
  }
  async keep(){
    // Лобби переживает выгрузку DO: состояние команды нельзя терять.
    await this.state.storage.put('lobby', {build:this.lobby.state.build,
      seed:this.lobby.state.seed, team:this.lobby.state.team, st:this.lobby.state});
  }
  fanout(id, sends){
    for(const s of sends){
      const raw=JSON.stringify(s.msg);
      if(s.to==='self'){ this.socks.get(id)?.send(raw); continue; }
      for(const [cid, sock] of this.socks){
        if(s.to==='peer' && cid===id) continue;
        try{ sock.send(raw); }catch(e){}
      }
    }
  }
  async fetch(req){
    await this.boot();
    const url=new URL(req.url);
    const id=url.searchParams.get('id')||'';
    const build=url.searchParams.get('build')||'';
    if(!this.lobby.state.build) this.lobby.state.build=build;
    const pair=new WebSocketPair();
    const [client, server]=Object.values(pair);
    server.accept();
    this.socks.set(id, server);
    server.addEventListener('message', async ev=>{
      let m=null; try{ m=JSON.parse(ev.data); }catch(e){ return; }
      let sends=[];
      if(m.t==='hello')       sends=this.lobby.join(id, m);
      else if(m.t==='card')   sends=this.lobby.card(id, m.card);
      else if(m.t==='ready')  sends=this.lobby.ready(id, m.day);
      else if(m.t==='act')    sends=this.lobby.act(id, m.kind, m.payload);
      else if(m.t==='digest') sends=this.lobby.digest(id, m.hash, m.team);
      else if(m.t==='since')  { for(const e of this.lobby.since(id, m.n)) server.send(JSON.stringify(e)); }
      else if(m.t==='part')   sends=this.lobby.part(id);
      this.fanout(id, sends);
      await this.keep();
    });
    server.addEventListener('close', ()=>{ this.socks.delete(id); });
    return new Response(null, {status:101, webSocket:client});
  }
}

export default {
  async fetch(req, env){
    const url=new URL(req.url);
    const m=url.pathname.match(/^\/lobby\/([A-Z0-9]{6})$/);
    if(!m) return new Response('no', {status:404});
    if(req.headers.get('Upgrade')!=='websocket')
      return new Response('websocket only', {status:426});
    const stub=env.LOBBY.get(env.LOBBY.idFromName(m[1]));
    return stub.fetch(req);
  }
};
```

- [x] **Step 3: Написать живую проверку**

`server/tools/check-worker.js`:

```js
// Два вебсокета проходят вечер целиком через живой wrangler dev.
//
// Машина состояний проверена без сети (check-lobby.js). Здесь проверяется
// именно переходник: что сообщения доезжают, что рассылка попадает кому надо
// и что лобби переживает переподключение.
//
//   node server/tools/check-worker.js
const { spawn } = require('child_process');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const PORT = 8799;
const fails=[]; const check=(n,ok,d)=>{ if(!ok) fails.push(n+(d?': '+d:'')); };
const wait=ms=>new Promise(r=>setTimeout(r,ms));

const dev = spawn('npx', ['wrangler','dev','--port',String(PORT),'--local'],
  {cwd:ROOT, shell:true, stdio:['ignore','pipe','pipe']});
let devLog='';
dev.stdout.on('data',d=>{ devLog+=d; }); dev.stderr.on('data',d=>{ devLog+=d; });

const open = (id) => new Promise((res, rej) => {
  const ws = new WebSocket('ws://127.0.0.1:'+PORT+'/lobby/ABC123?id='+id+'&build=aaaa1111');
  ws.inbox=[];
  ws.addEventListener('message', e=>ws.inbox.push(JSON.parse(e.data)));
  ws.addEventListener('open', ()=>res(ws));
  ws.addEventListener('error', rej);
});
const send=(ws,m)=>ws.send(JSON.stringify(m));
const got=(ws,t)=>ws.inbox.find(m=>m.t===t);

(async () => {
  for(let i=0;i<60 && !/Ready on/i.test(devLog);i++) await wait(500);
  check('wrangler dev поднялся', /Ready on/i.test(devLog), devLog.slice(-300));
  if(fails.length) throw new Error('сервер не поднялся');

  const A=await open('A'), B=await open('B');
  send(A,{t:'hello', build:'aaaa1111', card:{handle:'a'}});
  send(B,{t:'hello', build:'aaaa1111', card:{handle:'b'}});
  await wait(400);
  check('первому пришло состояние', !!got(A,'state'), JSON.stringify(A.inbox));
  check('второму тоже', !!got(B,'state'));
  check('карточка напарника доехала', !!got(A,'card') || (got(A,'state')||{}).peer);

  send(A,{t:'ready', day:'2026-02-02'});
  await wait(200);
  check('одного мало', !got(A,'start') && !got(B,'start'));
  send(B,{t:'ready', day:'2026-02-02'});
  await wait(300);
  check('оба готовы — старт обоим', !!got(A,'start') && !!got(B,'start'));
  check('сид у обоих один', got(A,'start').seed===got(B,'start').seed,
        got(A,'start').seed+' / '+got(B,'start').seed);

  send(A,{t:'act', kind:'drop', payload:{zone:7}});
  await wait(200);
  const at=B.inbox.filter(m=>m.t==='act');
  check('решение доехало напарнику', at.length===1, JSON.stringify(at));
  check('и у него есть номер', at[0] && typeof at[0].n==='number');

  // Обрыв и догон.
  B.close(); await wait(200);
  send(A,{t:'act', kind:'choice', payload:{i:2}});
  await wait(200);
  const B2=await open('B');
  send(B2,{t:'hello', build:'aaaa1111', card:{handle:'b'}});
  send(B2,{t:'since', n:at[0].n});
  await wait(400);
  check('вернувшийся догнал пропущенное',
        B2.inbox.some(m=>m.t==='act' && m.kind==='choice'), JSON.stringify(B2.inbox));

  send(A,{t:'digest', hash:'h', team:{day:'2026-02-03'}});
  send(B2,{t:'digest', hash:'h', team:{day:'2026-02-03'}});
  await wait(400);
  check('вечер закрыт обоим', !!got(A,'close') && !!got(B2,'close'));
  check('и новое состояние приехало', (got(A,'close')||{}).team.day==='2026-02-03');

  A.close(); B2.close();
})().then(()=>{
  dev.kill();
  if(fails.length){ fails.forEach(f=>console.error('FAIL '+f)); process.exit(1); }
  console.log('переходник доносит сообщения и переживает переподключение');
}).catch(e=>{ dev.kill(); console.error(String(e&&e.stack||e)); process.exit(1); });
```

- [x] **Step 4: Прогнать**

```bash
node server/tools/check-worker.js
```

Ожидание: `переходник доносит сообщения и переживает переподключение`. Если `wrangler dev` не поднимается — прочитать хвост его лога, он печатается в заметке. Node 24 имеет глобальный `WebSocket`, отдельная библиотека не нужна.

- [ ] **Step 5: Коммит**

```bash
git add server/src/worker.js server/wrangler.toml server/tools/check-worker.js
git diff --cached --stat
git commit -m "feat(server): worker and durable object over the lobby machine"
```

---

## Task 7: Транспорт на клиенте

**Files:**
- Create: `mp.js`
- Modify: `index.html` — тег скрипта рядом с `zone-replay.js` (строка ~3379)
- Create: `tools/check-mp-card.js`

**Interfaces:**
- Consumes: `CC_BUILD`, `ccTeamState`, `ccApplyTeamState`, `ccMpOn`.
- Produces глобальный `MP`:
  - `MP.connect(code, id)` → `Promise<void>`
  - `MP.push(team)` → `void` (зовётся из `careerSave`)
  - `MP.ready(day)`, `MP.act(kind, payload)`, `MP.digest(hash, team)`, `MP.part()`
  - `MP.peer` → карточка напарника или `null`
  - `MP.on(t, fn)` — подписка на тип сообщения
  - `MP.card()` → ночная карточка ЭТОГО игрока
  - `MP.teamOf(mine, peer)` → массив из двух карточек в устойчивом порядке

- [x] **Step 1: Написать падающую проверку**

`tools/check-mp-card.js`. Тело:

```js
    // Ночная карточка — не украшение, а условие сходимости: если мой браузер
    // считает нашу команду сильнее, чем его, вечер разъедется.
    seed('EU', 2);
    const mine = MP.card();
    out.notes.keys = Object.keys(mine).sort();
    ['handle','nat','age','ovr','role','attrs','org','form','tired','sick','camp','gear']
      .forEach(k => check('в карточке есть ' + k, mine[k] !== undefined, JSON.stringify(mine)));
    check('шесть статов', mine.attrs && Object.keys(mine.attrs).length >= 6,
          JSON.stringify(mine.attrs));
    // Личного в ней нет: деньги напарника на мой расчёт не влияют и ему не видны.
    ['balance','earnings','log','dms','flat'].forEach(k =>
      check('личное поле ' + k + ' не уехало', mine[k] === undefined, String(mine[k])));

    // Обе стороны собирают ОДИН И ТОТ ЖЕ состав из двух карточек, в одном порядке.
    const a = Object.assign({}, mine, {handle:'aaa'});
    const b = Object.assign({}, mine, {handle:'bbb'});
    const t1 = MP.teamOf(a, b).map(c => c.handle).join('+');
    const t2 = MP.teamOf(b, a).map(c => c.handle).join('+');
    out.notes.order = [t1, t2];
    check('порядок состава не зависит от того, кто спрашивает', t1 === t2, t1 + ' / ' + t2);
```

- [x] **Step 2: Прогнать — должно упасть**

```bash
node tools/check-mp-card.js
```

Ожидание: `MP is not defined`.

- [x] **Step 3: Написать mp.js**

```js
/* Командная карьера: транспорт и склейка.
 *
 * Единственный файл, знающий про сервер. index.html о вебсокете не знает
 * ничего — у него только семь точек врезки, названных в спеке.
 *
 * Правило про кэш скриптов действует и здесь: поменял этот файл — обнови
 * ?v= в теге, иначе браузер возьмёт старую версию и разойдётся с напарником.
 */
(function(){
'use strict';
var SOCK=null, CODE=null, ID=null, SEEN=0, HANDLERS={}, PEER=null;

function emit(m){ (HANDLERS[m.t]||[]).forEach(function(fn){ try{ fn(m); }catch(e){} }); }

var MP={
  get peer(){ return PEER; },
  get code(){ return CODE; },

  on:function(t, fn){ (HANDLERS[t]=HANDLERS[t]||[]).push(fn); },

  /* Ночная карточка: всё, что сегодня двигает мою силу, и ничего сверх.
     Список закрытый и стоит в спеке. Деньги, журнал и инбокс сюда не входят —
     они на расчёт не влияют, и это измерено check-lockstep.js. */
  card:function(){
    var pl=(typeof CAREER!=='undefined' && CAREER && CAREER.player)||{};
    var cr=(typeof CAREER!=='undefined' && CAREER && CAREER.career)||{};
    var org=(typeof CAREER!=='undefined' && CAREER && CAREER.org)||null;
    return {
      handle: pl.nick||null, nat: pl.country||null, age: pl.age||0,
      ovr: (pl.ovrExact!=null?pl.ovrExact:pl.ovr)||0,
      role: pl.role||null,
      attrs: pl.attrs ? JSON.parse(JSON.stringify(pl.attrs)) : {},
      org: org ? org.name : null,
      form: cr.form||0, tired: cr.tired||0, sick: !!cr.sickUntil,
      camp: cr.camp||null,
      gear: (CAREER && CAREER.gear && CAREER.gear.own) ? CAREER.gear.own.slice() : []
    };
  },

  /* Состав из двух карточек, в устойчивом порядке.
     Порядок обязан не зависеть от того, кто спрашивает: иначе синергия и
     роли считаются по-разному и вечер разъезжается. Сортировка по нику —
     самый дешёвый устойчивый ключ, который есть у обеих сторон. */
  teamOf:function(mine, peer){
    return [mine, peer].filter(Boolean).sort(function(a,b){
      return String(a.handle).toLowerCase() < String(b.handle).toLowerCase() ? -1 : 1;
    });
  },

  connect:function(code, id){
    CODE=code; ID=id;
    return new Promise(function(res, rej){
      var url=(MP.host||'wss://fncsdraft-mp.keegorka.workers.dev')+
              '/lobby/'+code+'?id='+encodeURIComponent(id)+'&build='+CC_BUILD;
      SOCK=new WebSocket(url);
      SOCK.onopen=function(){
        SOCK.send(JSON.stringify({t:'hello', build:CC_BUILD, card:MP.card()}));
        res();
      };
      SOCK.onerror=rej;
      SOCK.onmessage=function(ev){
        var m=null; try{ m=JSON.parse(ev.data); }catch(e){ return; }
        if(m.n) SEEN=m.n;
        if(m.t==='state'){ PEER=m.peer||PEER; ccApplyTeamState(m.team); }
        if(m.t==='card')  PEER=m.card;
        if(m.t==='close') ccApplyTeamState(m.team);
        emit(m);
      };
      SOCK.onclose=function(){
        // Вернулся — догнал по номерам, ничего не переспрашивая.
        setTimeout(function(){ if(CODE) MP.connect(CODE, ID).then(function(){
          SOCK.send(JSON.stringify({t:'since', n:SEEN}));
        }); }, 1500);
      };
    });
  },

  send:function(m){ if(SOCK && SOCK.readyState===1) SOCK.send(JSON.stringify(m)); },
  push:function(team){ MP.send({t:'team', team:team}); },
  ready:function(day){ MP.send({t:'ready', day:day}); },
  act:function(kind, payload){ MP.send({t:'act', kind:kind, payload:payload}); },
  digest:function(hash, team){ MP.send({t:'digest', hash:hash, team:team}); },
  part:function(){ MP.send({t:'part'}); }
};
window.MP=MP;
})();
```

- [x] **Step 3b: Врезать напарника в состав (врезка №4 из спеки)**

Карточка приехала — но пока `careerMates()` берёт напарника из сейва, живой человек в команду не попадает вовсе. Это и есть врезка №4.

Дописать в проверку `tools/check-mp-card.js`:

```js
    // В командной карьере напарник — из лобби, а не из сейва.
    CAREER.career.mp = {code:'ABC123', role:'a'};
    CAREER.partners = [{handle:'bot-from-save', nat:'de', region:'EU'}];
    MP.peer = {handle:'howly', nat:'ru', age:20, ovr:91, role:'roleFRG', attrs:{}, org:null,
               form:0, tired:0, sick:false, camp:null, gear:[]};
    const mates = careerMates();
    check('в составе один напарник', mates.length === 1, String(mates.length));
    check('и это человек из лобби', mates[0] && mates[0].handle === 'howly',
          mates[0] && mates[0].handle);
    check('бот из сейва не подставился', !mates.some(m => m && m.handle === 'bot-from-save'));
    // Одиночная — как была.
    delete CAREER.career.mp;
    check('без лобби напарник снова из сейва',
          (careerMates()[0] || {}).handle === 'bot-from-save',
          JSON.stringify(careerMates()[0]));
```

Затем в `index.html`, первой строкой `careerMates`:

```js
  /* В командной карьере напарник — живой человек из лобби.

     Его карточка приезжает перед каждым вечером (см. MP.card) и содержит ровно
     то, что двигает силу. Брать вместо неё запись из сейва нельзя: там лежит
     бот, оставшийся с одиночных времён, и команда собралась бы не та, которую
     видит напарник, — а это расхождение на первой же игре. */
  if(ccMpOn() && typeof MP!=='undefined' && MP.peer) return [MP.peer];
```

и то же самое первой строкой `careerPartnerCard`:

```js
  if(ccMpOn() && typeof MP!=='undefined' && MP.peer) return MP.peer;
```

- [x] **Step 4: Подключить файл**

В `index.html` после строки с `zone-replay.js`:

```html
<script src="mp.js?v=00000000"></script>
```

и сразу проставить настоящий хеш:

```bash
node -e "const c=require('crypto'),f=require('fs');const h=c.createHash('sha1').update(f.readFileSync('mp.js')).digest('hex').slice(0,8);f.writeFileSync('index.html',f.readFileSync('index.html','utf8').replace(/mp\.js\?v=[0-9a-f]{8}/,'mp.js?v='+h));console.log(h)"
node tools/stamp-build.js
```

- [x] **Step 5: Прогнать — должно пройти**

```bash
node tools/check-mp-card.js && node tools/check-mp-build.js && node tools/check-page-errors.js
```

- [x] **Step 6: Убедиться, что сборка увидит новый файл**

```bash
node tools/check-deploy-folder.js "C:/Users/FoxOS_User/Desktop/fncsdraft-deploy-26.08"
```

Ожидание: **упадёт** — `mp.js` в папке нет. Это правильный сигнал. Дописать `mp.js` в список корневых файлов сборки (см. память `fncsdraft-deploy-folder`) и пересобрать папку перед следующей выкладкой.

- [ ] **Step 7: Коммит**

```bash
node -e "['mp.js','tools/check-mp-card.js'].forEach(p=>{const f=require('fs');f.writeFileSync(p,f.readFileSync(p,'utf8').replace(/\r\n/g,'\n'))})"
git -c core.autocrlf=false add index.html
git add mp.js tools/check-mp-card.js
git diff --cached --stat
git commit -m "feat: mp.js transport and the night card both sides agree on"
```

---

## Task 8: Гейт «оба готовы» на раннерах

Одиннадцать раннеров написаны из предпосылки «нажал — играю». В командной карьере вечер начинается по `start` от сервера.

**Files:**
- Modify: `index.html` — одиннадцать раннеров: `runCareerCup`, `runCareerMajor`, `runCareerSummit`, `runCareerGlobals`, `runCareerGclc`, `runCareerReload`, `runCareerReloadChampionship`, `runCareerWeeklyFinal`, `runCareerEval`, `runCareerVictory`, `runCareerSoloSeries`
- Create: `tools/check-mp-gate.js`

**Interfaces:**
- Consumes: `MP.ready`, `MP.on`, `ccMpOn`.
- Produces: `ccMpGate()` → `Promise<{seed}>`; в одиночной карьере отдаёт `null` немедленно.

- [x] **Step 1: Написать падающую проверку**

`tools/check-mp-gate.js`. Тело:

```js
    // Одиночная карьера гейта не замечает вовсе.
    seed('EU', 2);
    const solo = await ccMpGate();
    check('в одиночной карьере гейт пропускает сразу', solo === null, JSON.stringify(solo));

    // Командная — ждёт, пока сервер не скажет «оба».
    CAREER.career.mp = {code:'ABC123', role:'a'};
    let sent = null;
    MP.ready = function(d){ sent = d; };
    let fired = null;
    MP.on = function(t, fn){ if(t === 'start') fired = fn; };
    const p = ccMpGate();
    let done = false; p.then(() => { done = true; });
    await new Promise(r => setTimeout(r, 60));
    check('готовность заявлена', sent === careerToday(), String(sent));
    check('и вечер НЕ начался', done === false);
    fired({t:'start', seed:'team-1|2026-02-02', n:7});
    const got = await p;
    check('старт от сервера открывает гейт', got && got.seed === 'team-1|2026-02-02',
          JSON.stringify(got));

    // Каждый раннер спрашивает гейт. Читается по исходнику, а не по вере.
    const src = document.documentElement.outerHTML;
    ['runCareerCup','runCareerMajor','runCareerSummit','runCareerGlobals','runCareerGclc',
     'runCareerReload','runCareerReloadChampionship','runCareerWeeklyFinal','runCareerEval',
     'runCareerVictory','runCareerSoloSeries'].forEach(fn => {
      const at = src.indexOf('async function ' + fn + '(');
      const body = at < 0 ? '' : src.slice(at, at + 1800);
      check(fn + ' спрашивает гейт', body.indexOf('ccMpGate()') >= 0, at < 0 ? 'функции нет' : 'нет вызова');
    });
```

- [x] **Step 2: Прогнать — должно упасть**

```bash
node tools/check-mp-gate.js
```

Ожидание: `ccMpGate is not defined`.

- [x] **Step 3: Написать гейт**

В `index.html` рядом с `ccMpOn`:

```js
/* Вечер начинается, когда готовы оба.

   Это решение заказчика и следствие локстепа сразу: играть без напарника
   нельзя, потому что вечер считают ОБА браузера, и результат принадлежит
   команде. Одиночная карьера гейта не замечает — он отдаёт null сразу же.

   Аварийная дверь — разрыв дуо (см. careerPartAsk): без неё исчезнувший
   напарник запирал бы карьеру навсегда. */
function ccMpGate(){
  if(!ccMpOn() || typeof MP==='undefined') return Promise.resolve(null);
  return new Promise(function(res){
    MP.on('start', function(m){ res({seed:m.seed, n:m.n}); });
    MP.ready(careerToday());
  });
}
```

- [x] **Step 4: Врезать в одиннадцать раннеров**

В каждом — сразу после строки, где раннер убедился, что событие его (`if(!ev || !careerXxxCan(ev)) return;`), и **до** любой отрисовки:

```js
  // Командный вечер ждёт напарника. См. ccMpGate.
  const mpStart=await ccMpGate();
```

Раннеры уже `async`, `await` в них законен. Переменная понадобится в задаче 9 — пока она не используется, и это нормально.

- [x] **Step 5: Прогнать**

```bash
node tools/check-mp-gate.js && node tools/check-career-major.js && node tools/check-career-cup.js && node tools/check-career-paris.js
```

Ожидание: все зелёные. Одиночные прогоны обязаны не замечать правки.

- [ ] **Step 6: Коммит**

```bash
node -e "const f=require('fs');f.writeFileSync('tools/check-mp-gate.js',f.readFileSync('tools/check-mp-gate.js','utf8').replace(/\r\n/g,'\n'))"
node tools/stamp-build.js
git -c core.autocrlf=false add index.html
git add tools/check-mp-gate.js
git commit -m "feat: an evening waits for both players"
```

---

## Task 9: Ретрансляция решений

Решение принимает тот, чей это выбор; второму оно приезжает событием и применяется без вопроса.

**Files:**
- Modify: `index.html` — `careerLandingPick` (~строка 69022), `ccAsk`
- Create: `tools/check-mp-relay.js`

**Interfaces:**
- Consumes: `MP.act`, `MP.on`, `ccMpOn`, `mpStart` из задачи 8.
- Produces: `ccMpDecide(kind, mineFn)` → `Promise<any>`. Если выбор мой — зовёт `mineFn()`, отправляет результат и возвращает его. Если чужой — ждёт события и возвращает пришедшее.
- Чей выбор: `ccMpMine(kind)` → `boolean`. Дроп и выборы в игре принадлежат **владельцу лобби** (`role==='a'`), потому что команда одна и решение одно на двоих.

- [x] **Step 1: Написать падающую проверку**

`tools/check-mp-relay.js`. Тело:

```js
    seed('EU', 2);
    check('в одиночной карьере решение своё',
          (await ccMpDecide('drop', () => 42)) === 42);

    CAREER.career.mp = {code:'ABC123', role:'a'};
    let out1 = null;
    MP.act = function(kind, payload){ out1 = {kind:kind, payload:payload}; };
    MP.on = function(){};
    const mine = await ccMpDecide('drop', () => ({zone:7}));
    check('владелец решает сам', mine && mine.zone === 7, JSON.stringify(mine));
    check('и решение уходит напарнику', out1 && out1.kind === 'drop' && out1.payload.zone === 7,
          JSON.stringify(out1));

    CAREER.career.mp = {code:'ABC123', role:'b'};
    let handler = null;
    MP.on = function(t, fn){ if(t === 'act') handler = fn; };
    MP.act = function(){ check('второй НЕ отправляет чужое решение', false); };
    let asked = false;
    const p = ccMpDecide('drop', () => { asked = true; return {zone:1}; });
    await new Promise(r => setTimeout(r, 40));
    check('второго не спрашивают', asked === false);
    handler({t:'act', kind:'drop', payload:{zone:9}, n:3});
    const theirs = await p;
    check('к нему приезжает решение владельца', theirs && theirs.zone === 9,
          JSON.stringify(theirs));
```

- [x] **Step 2: Прогнать — должно упасть**

```bash
node tools/check-mp-relay.js
```

- [x] **Step 3: Написать ретранслятор**

```js
/* Чей это выбор.

   Команда одна, значит и решение одно: куда падаем, что берём, кого коним.
   Принимает его владелец лобби, напарнику оно приезжает событием и
   применяется молча. Спрашивать обоих нельзя — тогда решений станет два, и
   вечер разъедется на первом же несогласии. */
function ccMpMine(kind){
  if(!ccMpOn()) return true;
  return (CAREER.career.mp.role||'a')==='a';
}
function ccMpDecide(kind, mineFn){
  if(!ccMpOn() || typeof MP==='undefined') return Promise.resolve(mineFn());
  if(ccMpMine(kind)){
    var v=mineFn();
    return Promise.resolve(v).then(function(r){ MP.act(kind, r); return r; });
  }
  return new Promise(function(res){
    MP.on('act', function(m){ if(m.kind===kind) res(m.payload); });
  });
}
```

- [x] **Step 4: Обернуть вопрос о высадке — РЕШЕНИЕ, а не результат**

Это главная тонкость задачи. `careerLandingPick` возвращает `zoneGroups` — `Map` из зон в массивы **объектов команд**. По проводу такое не отправишь и отправлять не надо: у второго клиента те же самые объекты уже есть, потому что комната у обоих одна (`pre` считается из одного сида). Передавать надо **что человек выбрал**, а разложить комнату второй клиент обязан сам — тем же кодом.

Хвост `careerLandingPick` сейчас такой (строки ~69261-69271):

```js
  const pick=await ccChoiceBox(L().ccDropTitle, L().ccDropHint,
    [ home ? {id:'home', title:L().ccDropHome, note:L().ccDropHomeNote(aura, rivals)}
           : {id:'quiet', title:L().ccDropQuiet, note:L().ccDropQuietNote},
      {id:'contest', title:L().ccDropContest, note:L().ccDropContestNote}], onMap);
  if(pick.id!=='contest') return await careerDropQuick(field, you, pick.id, home, pre);
  const zones=await showFinalsLandingPicker(field, you, title, seat, pre);
  return zones;
```

Заменить на:

```js
  /* Решение принимает один, комнату раскладывают оба.

     По проводу уходит ответ человека — «домой», «тихо» или «на такую-то
     коробку», — а не разложенная комната: комната у обоих уже одна и та же,
     она посчитана из одного сида (pre выше). Отправь мы Map команд, второй
     клиент получил бы чужие объекты вместо своих и разошёлся бы на первой же
     ссылке. */
  const said=await ccMpDecide('drop', async function(){
    const p=await ccChoiceBox(L().ccDropTitle, L().ccDropHint,
      [ home ? {id:'home', title:L().ccDropHome, note:L().ccDropHomeNote(aura, rivals)}
             : {id:'quiet', title:L().ccDropQuiet, note:L().ccDropQuietNote},
        {id:'contest', title:L().ccDropContest, note:L().ccDropContestNote}], onMap);
    if(p.id!=='contest') return {id:p.id};
    await showFinalsLandingPicker(field, you, title, seat, pre);
    // Пикер уже поставил метку на you — её номер и есть решение.
    return {id:'contest', n:(you.landingZone && you.landingZone.n) || null};
  });
  if(said.id!=='contest') return await careerDropQuick(field, you, said.id, home, pre);
  if(ccMpMine('drop')) return pre;
  /* Второму клиенту пикер не показывали: он ставит ту же метку по номеру и
     раскладывает комнату сам. */
  const z=ALL_LANDING_ZONES.find(function(x){ return x.n===said.n; });
  if(z){ you.landingZone=z; you.landingResult=null; you.landingRival=null;
         applyLandingPow(you, z.points);
         if(!pre.has(z)) pre.set(z, []);
         pre.get(z).push(you); }
  return pre;
```

Одиночный путь остаётся прежним: `ccMpDecide` в одиночной карьере зовёт функцию и отдаёт её результат, `ccMpMine` возвращает `true`, и код доходит до `return pre` ровно там же, где раньше возвращались `zones`.

- [x] **Step 4b: Проверить, что метка зоны действительно несёт номер**

```bash
grep -n "landingZone=" index.html | head -5
grep -n "\.n===\|n:\s*i+1\|zone.n" index.html | head -5
```

Ожидание: у объекта зоны есть поле `n`. Если его нет — взять то поле, по которому зона находится в `ALL_LANDING_ZONES` однозначно, и поправить обе строки выше. **Не гадать:** прочитать, чем зона опознаётся, и передавать это.

- [x] **Step 5: Прогнать**

```bash
node tools/check-mp-relay.js && node tools/check-career-landing.js && node tools/check-career-drop-each-game.js && node tools/check-career-major.js
```

- [x] **Step 6: Прогнать сторожей сходимости**

```bash
node tools/check-lockstep.js && node tools/check-lockstep-live.js
```

Это главный момент задачи: если ретрансляция что-то сдвинула, разъедется именно здесь.

- [ ] **Step 7: Коммит**

```bash
node -e "const f=require('fs');f.writeFileSync('tools/check-mp-relay.js',f.readFileSync('tools/check-mp-relay.js','utf8').replace(/\r\n/g,'\n'))"
node tools/stamp-build.js
git -c core.autocrlf=false add index.html
git add tools/check-mp-relay.js
git commit -m "feat: one decision per team, relayed to the partner"
```

---

## Task 10: Закрытие вечера и расхождение

**Files:**
- Modify: `index.html` — `careerAdvanceTo` (~строка 53512), одиннадцать раннеров (хвост)
- Create: `tools/check-mp-close.js`

**Interfaces:**
- Consumes: `MP.digest`, `ccTeamState`, `ccApplyTeamState`.
- Produces: `ccMpClose(ranked)` → `Promise<void>`; считает хеш таблицы, шлёт `digest`, ждёт `close`.
- `ccTableHash(ranked)` → строка; хеш по местам, очкам, победам и элимам.

- [x] **Step 1: Написать падающую проверку**

`tools/check-mp-close.js`. Тело:

```js
    seed('EU', 2);
    const t1 = [{name:'a', stagePts:100, wins:1, stageElims:10},
                {name:'b', stagePts:90,  wins:0, stageElims:8}];
    const t2 = JSON.parse(JSON.stringify(t1));
    check('одинаковые таблицы дают один хеш', ccTableHash(t1) === ccTableHash(t2));
    t2[1].stagePts = 91;
    check('разные — разный', ccTableHash(t1) !== ccTableHash(t2));
    check('хеш не зависит от имён игроков',
          ccTableHash([{name:'zzz', stagePts:100, wins:1, stageElims:10},
                       {name:'yyy', stagePts:90, wins:0, stageElims:8}]) === ccTableHash(t1));

    check('в одиночной карьере закрытие ничего не ждёт',
          (await ccMpClose(t1)) === undefined);

    CAREER.career.mp = {code:'ABC123', role:'a'};
    let sentHash = null, sentTeam = null, closeFn = null;
    MP.digest = function(h, t){ sentHash = h; sentTeam = t; };
    MP.on = function(k, fn){ if(k === 'close') closeFn = fn; };
    const p = ccMpClose(t1);
    await new Promise(r => setTimeout(r, 40));
    check('хеш отправлен', sentHash === ccTableHash(t1), String(sentHash));
    check('и состояние команды вместе с ним', sentTeam && sentTeam.day === CAREER.career.day);
    closeFn({t:'close', team:{day:'2026-02-09'}});
    await p;
    check('день пришёл от сервера', CAREER.career.day === '2026-02-09', CAREER.career.day);
```

- [x] **Step 2: Прогнать — должно упасть**

```bash
node tools/check-mp-close.js
```

- [x] **Step 3: Написать закрытие**

```js
/* Хеш таблицы — то, чем два клиента сверяют вечер.

   Считается по числам, а не по именам: имена у обоих одни и те же, но
   сравнивать надо результат, а не подписи. Порядок строк уже задан сортировкой
   таблицы, поэтому дополнительной сортировки здесь нет — если порядок
   разъехался, это и есть расхождение, и хеш обязан его показать. */
function ccTableHash(ranked){
  var s=(ranked||[]).map(function(t,i){
    return i+':'+(t.stagePts||0)+':'+(t.wins||0)+':'+(t.stageElims||0);
  }).join('|');
  return String(ccHashStr(s));
}
/* Вечер сыгран — оба сверяются и ждут закрытия от сервера.
   Расхождение решает сервер: истиной становится версия, пришедшая первой.
   Спорить бессмысленно — у игрока на экране всё равно должно оказаться то же,
   что у напарника. */
function ccMpClose(ranked){
  if(!ccMpOn() || typeof MP==='undefined') return Promise.resolve();
  return new Promise(function(res){
    MP.on('close', function(m){ ccApplyTeamState(m.team); res(); });
    MP.digest(ccTableHash(ranked), ccTeamState());
  });
}
```

- [x] **Step 4: Врезать в раннеры и в часы**

В каждом раннере, **после** записи строки в `cr.log` и **до** `careerAdvanceTo`:

```js
  // Командный вечер закрывает сервер: он же двигает день. См. ccMpClose.
  await ccMpClose(ranked);
```

В `careerAdvanceTo` первой строкой:

```js
  // В командной карьере день двигает close от сервера, а не нажатие.
  if(ccMpOn() && !CC_MP_ADVANCE) return;
```

и рядом `let CC_MP_ADVANCE=false;`, который `ccApplyTeamState` ставит в `true` на время своей работы:

```js
function ccApplyTeamState(t){
  if(!t || !CAREER || !CAREER.career) return;
  CC_MP_ADVANCE=true;
  try{ CC_TEAM_KEYS.forEach(function(k){ if(t[k]!==undefined) CAREER.career[k]=t[k]; }); }
  finally{ CC_MP_ADVANCE=false; }
  ccWorldReset();
}
```

- [x] **Step 5: Прогнать всё, что двигает день**

```bash
node tools/check-mp-close.js && node tools/check-mp-split.js && node tools/check-career-year.js && node tools/check-career-cup.js && node tools/check-career-d1-week.js && node tools/check-career-post-day.js
```

- [ ] **Step 6: Коммит**

```bash
node -e "const f=require('fs');f.writeFileSync('tools/check-mp-close.js',f.readFileSync('tools/check-mp-close.js','utf8').replace(/\r\n/g,'\n'))"
node tools/stamp-build.js
git -c core.autocrlf=false add index.html
git add tools/check-mp-close.js
git commit -m "feat: both sides digest the evening, the server closes the day"
```

---

## Task 11: Разрыв дуо

Из «день ждёт обоих» следует аварийная дверь: иначе исчезнувший напарник запирает карьеру навсегда.

**Files:**
- Modify: `index.html` — рядом с `careerEndAsk` (~строка 51122)
- Create: `tools/check-mp-break.js`

**Interfaces:**
- Consumes: `MP.part`, `ccMpOn`.
- Produces: `careerPartAsk()` — открывает подтверждение; `careerPart()` — рвёт.

- [x] **Step 1: Написать падающую проверку**

`tools/check-mp-break.js`. Тело:

```js
    seed('EU', 2);
    CAREER.career.mp = {code:'ABC123', role:'a'};
    CAREER.career.balance = 48000;
    CAREER.career.log = [{season:1, day:'2026-02-02', place:4, kind:'cup'}];
    CAREER.partners = [{handle:'howly', nat:'ru'}];
    let told = false;
    MP.part = function(){ told = true; };

    careerPart();
    check('серверу сказали', told === true);
    check('карьера снова одиночная', ccMpOn() === false);
    check('деньги на месте', CAREER.career.balance === 48000, String(CAREER.career.balance));
    check('история на месте', (CAREER.career.log || []).length === 1);
    check('место напарника занято ботом с его карточкой',
          careerPartnerCard() && careerPartnerCard().handle === 'howly',
          JSON.stringify(careerPartnerCard()));
    // И день снова двигается сам.
    const was = careerToday();
    careerAdvanceTo(ccAddDays(was, 1));
    check('день пошёл', careerToday() !== was, careerToday());
```

- [x] **Step 2: Прогнать — должно упасть**

```bash
node tools/check-mp-break.js
```

- [x] **Step 3: Написать разрыв**

```js
/* Разрыв дуо — аварийная дверь, а не фича.

   «День ждёт обоих» означает, что исчезнувший напарник запирает карьеру
   навсегда. Дверь превращает команду обратно в одиночную карьеру: история и
   деньги остаются, место напарника занимает бот с его последней карточкой —
   той самой ночной, которая и так обменивалась перед каждым вечером. */
function careerPart(){
  if(!ccMpOn()) return;
  if(typeof MP!=='undefined' && MP.part) MP.part();
  var peer=(typeof MP!=='undefined' && MP.peer) || null;
  if(peer){
    CAREER.partners=CAREER.partners||[];
    if(!CAREER.partners.some(function(p){ return p && p.handle===peer.handle; }))
      CAREER.partners.push(peer);
  }
  delete CAREER.career.mp;
  careerSave();
  careerRenderHub('centre');
}
function careerPartAsk(){
  // Подпись ccAsk — (text, go, opts), а не (text, yes, no, fn): подписи кнопок
  // едут в opts. Проверено по index.html, строка ~66022.
  ccAsk(L().ccPartAsk, careerPart, {yes:L().ccPartYes, no:L().ccPartNo});
}
```

Строки `ccPartAsk`, `ccPartYes`, `ccPartNo` добавить во **все пять** локалей — иначе `check-i18n.js` покажет красное. Русский: `ccPartAsk:'Разорвать дуо? Напарник станет ботом, история и деньги останутся.'`, `ccPartYes:'Разорвать'`, `ccPartNo:'Отмена'`.

- [x] **Step 4: Прогнать**

```bash
node tools/check-mp-break.js && node tools/check-i18n.js
```

- [ ] **Step 5: Коммит**

```bash
node -e "const f=require('fs');f.writeFileSync('tools/check-mp-break.js',f.readFileSync('tools/check-mp-break.js','utf8').replace(/\r\n/g,'\n'))"
node tools/stamp-build.js
git -c core.autocrlf=false add index.html
git add tools/check-mp-break.js
git commit -m "feat: the emergency door out of a duo"
```

---

## Task 12: Плитка команды на хабе

**Files:**
- Modify: `index.html` — рядом с `careerOrgTileHTML` (~строка 52622), вызов в `careerRenderHub`
- Create: `tools/check-mp-tile.js`

**Interfaces:**
- Consumes: `ccMpOn`, `MP.peer`, `careerPartAsk`.
- Produces: `careerMpTileHTML()` → строка HTML; пустая строка в одиночной карьере.

- [x] **Step 1: Написать падающую проверку**

`tools/check-mp-tile.js`. Тело:

```js
    seed('EU', 2);
    check('в одиночной карьере плитки нет', careerMpTileHTML() === '',
          careerMpTileHTML().slice(0, 80));

    CAREER.career.mp = {code:'ABC123', role:'a'};
    MP.peer = null;
    const alone = careerMpTileHTML();
    check('код лобби виден', alone.indexOf('ABC123') >= 0, alone.slice(0, 200));
    check('и сказано, что напарника нет', alone.indexOf(L().ccMpAlone) >= 0);
    check('кнопка разрыва на месте', alone.indexOf('careerPartAsk()') >= 0);

    MP.peer = {handle:'howly', nat:'ru', ovr:91, role:'roleFRG'};
    const two = careerMpTileHTML();
    check('ник напарника виден', two.indexOf('howly') >= 0, two.slice(0, 240));
    check('и его овер', two.indexOf('91') >= 0);
    check('чужое в плитку не течёт', two.indexOf('balance') < 0 && two.indexOf('48000') < 0);
```

- [x] **Step 2: Прогнать — должно упасть**

```bash
node tools/check-mp-tile.js
```

- [x] **Step 3: Написать плитку**

```js
/* Плитка команды: кто в лобби и как оттуда выйти.

   Показывается только то, что напарнику и так видно по спеке: ник, флаг,
   овер, роль. Деньги, контракт и инбокс — личное, и в плитку не попадают. */
function careerMpTileHTML(){
  if(!ccMpOn()) return '';
  var peer=(typeof MP!=='undefined' && MP.peer) || null;
  var code=CAREER.career.mp.code;
  return '<div class="ch-tile ch-tile-org">'+
    '<h4>'+L().ccMpTitle+'</h4>'+
    '<div class="ch-row"><em>'+L().ccMpCode+'</em><b>'+esc(code)+'</b></div>'+
    (peer
      ? '<div class="ch-orghead">'+flagImg(peer.nat,15)+'<b>'+esc(peer.handle)+'</b></div>'+
        '<div class="ch-row"><em>'+L().ccOvr+'</em><b>'+(peer.ovr||0)+'</b></div>'+
        '<div class="ch-row"><em>'+L().ccRole+'</em><b>'+esc(L()[peer.role]||peer.role||'')+'</b></div>'
      : '<div class="ch-empty">'+L().ccMpAlone+'</div>')+
    '<button class="ch-decline" onclick="careerPartAsk()">'+L().ccMpPart+'</button>'+
  '</div>';
}
```

Строки `ccMpTitle`, `ccMpCode`, `ccMpAlone`, `ccMpPart` — во все пять локалей. Русский: `ccMpTitle:'Команда'`, `ccMpCode:'Код лобби'`, `ccMpAlone:'Напарник не в сети'`, `ccMpPart:'Разорвать дуо'`.

Вызов — в `careerRenderHub`, во вкладке «Центр», перед плиткой клуба.

- [x] **Step 4: Прогнать**

```bash
node tools/check-mp-tile.js && node tools/check-i18n.js && node tools/check-page-errors.js
```

- [x] **Step 5: Прогнать весь набор**

```bash
for t in tools/check-lockstep.js tools/check-lockstep-live.js tools/check-mp-*.js server/tools/check-lobby.js; do
  printf "%-40s " "$t"; node "$t" >/dev/null 2>&1 && echo OK || echo FAIL
done
```

Ожидание: все `OK`.

- [ ] **Step 6: Коммит**

```bash
node -e "const f=require('fs');f.writeFileSync('tools/check-mp-tile.js',f.readFileSync('tools/check-mp-tile.js','utf8').replace(/\r\n/g,'\n'))"
node tools/stamp-build.js
git -c core.autocrlf=false add index.html
git add tools/check-mp-tile.js
git commit -m "feat: the team tile — who is in the lobby and the way out"
```

---

## Task 13: Вход в лобби

Это врезка №1 из спеки — `careerLoad` / вход в режим. Без неё в командную карьеру попасть нечем: `MP.connect` написан в задаче 7, но его никто не зовёт. Задачи 8-12 проверяются харнессами, которые подменяют `MP`, поэтому порядок исполнения такой и допустим — но **режим не работает, пока эта задача не сделана**.

**Files:**
- Modify: `index.html` — `careerEntry` (~строка 51109), экран создания карьеры (~строка 50600)
- Create: `tools/check-mp-join.js`

**Interfaces:**
- Consumes: `MP.connect`, `ccMpOn`, `ccApplyTeamState`.
- Produces:
  - `ccMpCode()` → строка из шести знаков `[A-Z0-9]`; код и есть приглашение, аккаунтов нет.
  - `careerMpCreate()` → заводит командную карьеру, кладёт `career.mp={code, role:'a'}`, подключается.
  - `careerMpJoin(code)` → входит вторым, `role:'b'`.
  - `ccMpBoot()` → `Promise<void>`; зовётся из `careerEntry`, подключает уже командную карьеру.

- [x] **Step 1: Написать падающую проверку**

`tools/check-mp-join.js`. Тело:

```js
    // Код — он же приглашение: шесть знаков, без почты и паролей.
    const codes = [];
    for (let i = 0; i < 200; i++) codes.push(ccMpCode());
    check('код из шести знаков', codes.every(c => /^[A-Z0-9]{6}$/.test(c)), codes[0]);
    check('коды разные', new Set(codes).size > 190, String(new Set(codes).size));

    // Создание: роль владельца, код записан, подключение состоялось.
    seed('EU', 2);
    let asked = null;
    MP.connect = function(code, id){ asked = {code:code, id:id}; return Promise.resolve(); };
    await careerMpCreate();
    check('карьера стала командной', ccMpOn() === true);
    check('роль владельца', CAREER.career.mp.role === 'a', CAREER.career.mp.role);
    check('подключились по своему коду', asked && asked.code === CAREER.career.mp.code,
          JSON.stringify(asked));
    check('и у клиента есть свой идентификатор', asked && !!asked.id);

    // Вход вторым.
    seed('EU', 2);
    asked = null;
    await careerMpJoin('ABC123');
    check('вошли по чужому коду', CAREER.career.mp.code === 'ABC123');
    check('роль второго', CAREER.career.mp.role === 'b', CAREER.career.mp.role);
    check('подключились', asked && asked.code === 'ABC123');

    // Вход в режим на уже командной карьере подключается сам.
    asked = null;
    await ccMpBoot();
    check('открытие командной карьеры подключается', asked && asked.code === 'ABC123');

    // А одиночная не трогает сеть вовсе.
    delete CAREER.career.mp;
    asked = null;
    await ccMpBoot();
    check('одиночная карьера в сеть не ходит', asked === null, JSON.stringify(asked));
```

- [x] **Step 2: Прогнать — должно упасть**

```bash
node tools/check-mp-join.js
```

Ожидание: `ccMpCode is not defined`.

- [x] **Step 3: Написать вход**

```js
/* Код лобби — он же приглашение.

   Ни аккаунтов, ни почты, ни паролей: шесть знаков, которые один пересылает
   другому в телегу. Буквы и цифры без похожих пар (нет O и 0, нет I и 1):
   код диктуют голосом, и «ноль или о» — это потерянный вечер. */
const CC_MP_ABC='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function ccMpCode(){
  var s='';
  for(var i=0;i<6;i++) s+=CC_MP_ABC[Math.floor(Math.random()*CC_MP_ABC.length)];
  return s;
}
// Кто я в этом лобби. Живёт рядом с сейвом и переживает перезагрузку: без него
// после обрыва сервер посчитал бы вернувшегося третьим.
function ccMpId(){
  var k='fncsdraft_mp_id';
  var v=null; try{ v=localStorage.getItem(k); }catch(e){}
  if(!v){ v=Math.random().toString(36).slice(2,10); try{ localStorage.setItem(k,v); }catch(e){} }
  return v;
}
function ccMpBoot(){
  if(!ccMpOn() || typeof MP==='undefined') return Promise.resolve();
  return MP.connect(CAREER.career.mp.code, ccMpId());
}
function careerMpCreate(){
  CAREER.career.mp={code:ccMpCode(), role:'a'};
  careerSave();
  return ccMpBoot();
}
function careerMpJoin(code){
  CAREER.career.mp={code:String(code).toUpperCase(), role:'b'};
  careerSave();
  return ccMpBoot();
}
```

В `careerEntry`, в ветке `if(careerExists())`, после `careerLoad()` и миграций, перед `openCareerHub()`:

```js
    ccMpBoot();
```

Без `await`: карьера обязана открыться и без сети — localStorage держит последнее известное состояние команды, а `state` от сервера приедет и перепишет его через `ccApplyTeamState`.

- [x] **Step 4: Кнопки на экране создания**

Рядом с кнопкой «начать карьеру» добавить две:

```html
<button class="ch-sign" onclick="careerMpCreate()" data-i18n="ccMpMake"></button>
<button class="ch-swap" onclick="careerMpJoinAsk()" data-i18n="ccMpEnter"></button>
```

и

```js
function careerMpJoinAsk(){
  var c=prompt(L().ccMpAskCode);
  if(c && /^[A-Za-z0-9]{6}$/.test(c.trim())) careerMpJoin(c.trim());
}
```

Строки `ccMpMake`, `ccMpEnter`, `ccMpAskCode` — во все пять локалей. Русский: `ccMpMake:'Играть вдвоём'`, `ccMpEnter:'Войти по коду'`, `ccMpAskCode:'Код лобби — шесть знаков'`.

`prompt` здесь допустим: это единственное место, где нужен ввод шести знаков, и заводить ради него модалку — работа не по цене. Если позже понадобится — она станет такой же, как `clubPickModal`.

- [x] **Step 5: Прогнать**

```bash
node tools/check-mp-join.js && node tools/check-i18n.js && node tools/check-page-errors.js && node tools/check-career-sim.js
```

- [ ] **Step 6: Коммит**

```bash
node -e "const f=require('fs');f.writeFileSync('tools/check-mp-join.js',f.readFileSync('tools/check-mp-join.js','utf8').replace(/\r\n/g,'\n'))"
node tools/stamp-build.js
git -c core.autocrlf=false add index.html
git add tools/check-mp-join.js
git commit -m "feat: create and join a lobby by a six-character code"
```

---

## Task 14: Уборка брошенных лобби

Спека: лобби, в которое никто не заходил 30 дней, удаляется. Сезон карьеры длиннее, но месяц молчания — это брошенная команда, а не пауза.

**Files:**
- Modify: `server/src/worker.js` — класс `Lobby`
- Modify: `server/tools/check-lobby.js` — добавить проверку срока
- Modify: `server/src/lobby.js` — метка последнего касания

**Interfaces:**
- Consumes: `createLobby`.
- Produces: `lobby.touch(atMs)` → `void`; `lobby.stale(atMs, ttlMs)` → `boolean`.

- [x] **Step 1: Дописать падающую проверку**

В конец `server/tools/check-lobby.js`, перед итоговым `if(fails.length)`:

```js
// ---- уборка ---------------------------------------------------------------
// Часы приходят снаружи: машина обязана оставаться проверяемой, а Date.now()
// внутри неё сделал бы срок непроверяемым.
const DAY=86400000;
let K=createLobby({build:'aaaa1111', seed:'team-3', team:{}});
K.join('A',{build:'aaaa1111',card:CARD});
K.touch(1000);
check('свежее лобби не протухло', K.stale(1000+29*DAY, 30*DAY)===false);
check('через тридцать дней протухло', K.stale(1000+31*DAY, 30*DAY)===true);
K.touch(1000+31*DAY);
check('касание продлевает жизнь', K.stale(1000+31*DAY+DAY, 30*DAY)===false);
```

- [x] **Step 2: Прогнать — должно упасть**

```bash
node server/tools/check-lobby.js
```

Ожидание: `K.touch is not a function`.

- [x] **Step 3: Написать метку**

В `server/src/lobby.js` в `st` добавить `seen:0`, и два метода:

```js
    // Часы приходят снаружи, а не берутся из Date.now(): иначе срок жизни
    // лобби нельзя было бы проверить, не подкручивая системное время.
    touch(atMs){ st.seen=atMs||0; },
    stale(atMs, ttlMs){ return (atMs-st.seen) >= ttlMs; },
```

- [x] **Step 4: Прогнать**

```bash
node server/tools/check-lobby.js
```

- [x] **Step 5: Завести будильник в Durable Object**

В `server/src/worker.js`, в классе `Lobby`:

```js
  static TTL = 30*86400000;
  async touch(){
    this.lobby.touch(Date.now());
    await this.state.storage.setAlarm(Date.now()+Lobby.TTL);
    await this.keep();
  }
  async alarm(){
    await this.boot();
    if(this.lobby.stale(Date.now(), Lobby.TTL)){
      // Брошенная команда, а не пауза: месяц никто не заходил.
      await this.state.storage.deleteAll();
      return;
    }
    await this.state.storage.setAlarm(Date.now()+Lobby.TTL);
  }
```

и звать `await this.touch();` в обработчике `message` рядом с `await this.keep();`.

- [x] **Step 6: Прогнать живую проверку**

```bash
node server/tools/check-worker.js
```

Ожидание: зелёная, как раньше. Срок в 30 дней в ней не проверяется — это проверено в `check-lobby.js` подставными часами; здесь важно, что будильник не сломал обычный ход.

- [ ] **Step 7: Коммит**

```bash
git add server/src/lobby.js server/src/worker.js server/tools/check-lobby.js
git commit -m "feat(server): drop a lobby nobody opened for thirty days"
```

---

## Что остаётся открытым после плана

Записано в спеке и **не** закрывается этими задачами:

- **Рейтинг PR** считается по журналу, а журнал теперь общий. Проверить, что двое не получают его дважды: `careerPrAdd` зовётся из каждого раннера, а раннеров теперь исполняют оба браузера.
- **Перенос начатой одиночной карьеры в командную** — вне первой версии. Спросить заказчика, не станет ли это первым, чего он захочет.
- **Отдельный баг одиночного режима, найденный при измерении локстепа:** книга роста сцены (`CAREER.dev`) меняет рейтинг на карточке, а сила команды в лобби не меняется — `pow` вышел 103 в обоих случаях. Разбирать не здесь, но и не забывать: мир растёт на бумаге, а играет по-старому.
