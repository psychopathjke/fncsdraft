# Выборы внутри игры: три остановки Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** За игру три остановки вместо до девяти, у ходов ценность по ситуации, под ходом факты, а не ответ.

**Architecture:** Чистые функции «ситуация → ценность хода» отдельно от окон. Два новых совмещённых окна (ротация, концовка) поверх ccChoiceBox, остальные остановки становятся тихими авто-ходами. Комната ботов в концовке ходит теми же функциями по навыку. Движок zone-sim не трогаем.

**Tech Stack:** один файл index.html (inline JS), сторожа tools/check-*.js (headless Chrome, `node tools/<name>.js`, печатают OK/FAIL, exit 0/1), пробы tools/*-probe.js через tools/probe-run.js.

**Spec:** docs/superpowers/specs/2026-11-14-in-game-choices-design.md

## Global Constraints

- Остановок за игру: зона 1 (точка + комната лута), зона 4 (окно ротации), зона 8 (окно концовки). Больше ничего не останавливает карту.
- Разница лучшего и худшего хода в ситуации: 8–15 силы (ccAddGamePow).
- Ход по умолчанию (скип, симуляция, перемотка, таймер): нынешний безопасный — ротация `early`, тактика `push`, концовка `lg` (или `refresh` при ccMatsLow), стойка `hold`. Не лучший по ситуации.
- Лучший ход не подсвечивается и не называется. Явно плохой: пометка `T.sitUseless` («бесполезно сейчас»). Коуч и напарник функции ценности не читают.
- Онлайн (ccMpLock): окно ротации только ряд «когда выходим», без карты-тапа и тактики. Порядок кнопок одинаков у обоих клиентов, выбор через ccMpChoose.
- Строки интерфейса в ru, en, fr, it, pt (de/es падают на en). Без длинного тире «—» (сторож check-ui-dash). Тёмная тема, без нативных select.
- Должно работать в Safari на iPhone: координаты тапа через getBoundingClientRect, не getScreenCTM.
- index.html в репозитории с LF. Правки — Edit; регулярки через `node -e` в Bash не писать (схлопывание слэшей).
- Комментарии в коде коротко: что и почему. Без цитат владельца, дат, Notion, скринов.
- Числа функций ценности помечать в комментарии «решение, не замер».
- Выкладка только на debug (`--branch=debug`), перед сборкой `node tools/stamp-build.js`. Прод не трогать.

## Review Focus

- Zero Build (CC_ZB): ходов про ресы нет (бокс, рефреш, тоннель); функции ценности не должны читать ресы как 0 и советовать «бесполезно» всему.
- Reload (ccNoSurge, r1–r4): сёрджа нет, авто-сёрдж молчит; круги другие (phasesFor).
- Игрок выбыл до остановки или жив один отряд: окна не открываются, авто-ходы не бросают.
- Уже внутри следующего круга (ccPathPlan → null): окно ротации без карты, только ряд «когда выходим».
- Онлайн вдвоём: оба клиента видят одинаковые кнопки в одинаковом порядке и одинаково считают авто-ходы (никаких Math.random вне общего броска).

---

### Task 1: Ситуация и ценность ходов

**Files:**
- Modify: `index.html` — новый блок сразу после ccFightLine (~115145)
- Test: `tools/check-career-sit-values.js` (новый, по образцу tools/check-career-tactic.js: BOOT-скрипт в копии index.html)

**Interfaces:**
- Produces:
  - `ccSitOf(you) -> {dist, rNext, inside:bool, away:bool, edge:bool, mats, low:bool, heals, move:bool, ar, alive, nearBy, pair:bool, place}` — dist/rNext из `game.upcoming()` и `you._sq`; away = следующий центр дальше от нас, чем текущий; nearBy = живых отрядов ближе 22; place = ожидаемое место (живых минус сильнее нас).
  - `CC_SIT_ROT_IDS=['early','with','late','move']`, `CC_SIT_END_IDS=['hg','mid','edge','refresh','lg','third']`, `CC_SIT_STANCE_IDS=['hold','push']`
  - `ccSitValue(kind, id, sit) -> number` — kind `'rot'|'end'|'stance'`; сила хода в этой ситуации, со знаком.
  - `ccSitUseless(kind, id, sit) -> bool` — ценность ниже лучшей на 8+ и сама ≤ 0.
  - `ccSitFacts(T, kind, id, sit) -> string` — одна-две причины словами, без вердикта.
  - `ccSitAvail(kind, id, sit) -> bool` — ход доступен (move при мувменте, third при pair, ресовые не в ZB).

- [ ] **Step 1: Сторож check-career-sit-values.js** — синтетические sit-объекты, без движка:
  - `far`: `{dist:60, rNext:12, inside:false, away:true, mats:900, move:false}` → `ccSitValue('rot','early',far) - ccSitValue('rot','late',far) >= 8`
  - `near`: `{dist:8, rNext:12, inside:true, away:false, mats:1500}` → лучший rot = `late`, отрыв от `early` в [8,15]
  - `moveFar`: far + `move:true` → лучший rot = `move`; `nearMove`: near + `move:true` → `ccSitUseless('rot','move',nearMove)===true`
  - `rich`: `{mats:1500, ar:4, nearBy:2}` → лучший end = `hg`; `poor`: `{mats:200, low:true, heals:0}` → лучший end = `refresh`; `rich` → `ccSitUseless('end','refresh',rich)===true`
  - `top`: `{place:3}` → stance hold > push на 8+; `bigPack`: `{place:20, ar:5, mats:1500}` → push > hold
  - ZB (`CC_ZB=true`): `ccSitAvail('end','refresh',x)===false`, у остальных ходов ценность конечна
  - Без доминанты: 500 случайных sit (равномерно по полям), по каждому kind ни один id не лучший больше 60%
  - Для каждого kind/id/locale из ru,en,fr,it,pt `ccSitFacts` даёт непустую строку без «—»
- [ ] **Step 2:** `node tools/check-career-sit-values.js` → FAIL «ccSitOf is not defined»
- [ ] **Step 3:** Реализовать функции выше. Ценности — кусочно-линейные от полей sit, масштаб ±15, комментарий «решение, не замер». Строки фактов — ключи `sitF*` в пяти локалях, плюс `sitUseless`.
- [ ] **Step 4:** `node tools/check-career-sit-values.js` → `OK`; `node tools/check-ui-dash.js` → OK
- [ ] **Step 5:** commit `in-game: situation readers and move values`

### Task 2: Окно ротации (зона 4)

**Files:**
- Modify: `index.html` — ccAskRot (~114830), ccAskPath (~114670), ccChoiceBox (~116040, только поддержка рядa-переключателя `data-chip`)
- Test: `tools/check-career-path.js` (переписать), `tools/check-career-rot-window.js` (новый)

**Interfaces:**
- Consumes: `ccSitOf`, `ccSitValue('rot',…)`, `ccSitFacts`, `ccSitUseless`, `ccTacOf`, `ccFoeTactic`, `ccPathPlan`, `ccPathMapHTML`
- Produces:
  - `async ccAskRotWindow(you, ui) -> {rot, tac, pos}` — одно ccChoiceBox, kind `'rot'`; кнопки = ходы `CC_SIT_ROT_IDS` (доступные), в подсказке карта пути (если план есть и ccLootRoomOn) и ряд тактики чипами `data-chip="push|box|back"` (если ccLootRoomOn). Значение по умолчанию: rot `early`, tac `push`, pos = plan.def.
  - `you._tac` — id тактики на всю игру (сброс `null` в simulateGameOnMap рядом с `_pos`)
  - ccChoiceBox: чипы `[data-chip]` переключают `.on` внутри своего ряда и останавливают таймер (как `[data-hold]`); выбранное читает вызывающий из DOM до resolve.

- [ ] **Step 1: Сторож check-career-rot-window.js** (мок игры как в check-career-path.js, с `upcoming`):
  - одно окно, в нём кнопок = доступных rot-ходов, карта `.rp-svg[data-hold]` и три чипа `[data-chip]`
  - клик чипа `box` + кнопки `late` → `you._rot==='late' && you._tac==='box'`, сила изменилась ровно на `ccSitValue('rot','late',sit)`
  - под пропуском (`skipAnimation=true`) окна нет, `you._rot==='early'`, `you._tac==='push'`
  - онлайн (`ccMpLock=()=>true`): нет `.rp-svg`, нет `[data-chip]`
  - ни одна кнопка не содержит строку «выгодно» и не имеет класса подсветки лучшего; у бесполезного хода есть `T.sitUseless`
- [ ] **Step 2:** запустить → FAIL
- [ ] **Step 3:** Реализовать ccAskRotWindow; CC_GAME_STOPS зона 4 зовёт его; ccAskRot/ccAskPath остаются как внутренние помощники (точка и встреча — из ccAskPath без своего ccChoiceBox: вынести `ccPathResolve(you, ui, pos, tac)`); встреча на пути играется `ccTacOf(you._tac, you, foe)`.
- [ ] **Step 4:** `node tools/check-career-rot-window.js`, `node tools/check-career-path.js`, `node tools/check-career-tactic.js` → OK
- [ ] **Step 5:** commit `in-game: one rotation window (timing, point, tactic)`

### Task 3: Окно концовки (зона 8) и комната

**Files:**
- Modify: `index.html` — ccAskLate (~117300), ccRoomLate (~115237), ccAskMoving/ccAskLast (~117094/117136)
- Test: `tools/check-career-endgame.js` (переписать), `tools/check-career-choices.js` (поправить ожидания)

**Interfaces:**
- Consumes: `ccSitOf`, `ccSitValue('end'|'stance',…)`, `ccThirdPair`, `ccThirdPairApply`, `ccFightApply`, `CC_FIGHT_LATE`
- Produces:
  - `async ccAskEndWindow(you, ui) -> {pos, stance}` — kind `'late'`; кнопки = доступные `CC_SIT_END_IDS`, чипы стойки `hold|push`. Применение: `ccAddGamePow(you, ccSitValue('end', pos, sit))`, `third` через ccThirdPairApply, `you._stance=stance`.
  - `ccAutoMoving(you, ui)`, `ccAutoLast(you, ui)` — без окна: hold → ничего, push → ccFightApply(you, r, nearest, CC_FIGHT_LATE, ccTacOf(you._tac||'push', you, foe)); строка в `ui.note`.
  - `ccRoomLate(field, you)` — бот берёт argmax `ccSitValue('end',…)` с вероятностью `t.skill` (0..1, есть у команд движка), иначе `lg`.

- [ ] **Step 1: Сторожа:**
  - check-career-endgame: на зоне 8 одно окно с ходами и двумя чипами; на move/last зонах окон нет; при `stance='push'` на last зоне был ровно один ccFightApply; при `hold` — ноль
  - check-career-choices: «под скипом вопрос отвечает сам» — ход `lg`/`refresh`, стойка `hold`
  - новая проверка в check-career-endgame: 200 ботов skill=1 → все лучший ход; skill=0 → все `lg`
- [ ] **Step 2:** запустить → FAIL
- [ ] **Step 3:** Реализовать; CC_GAME_STOPS: зона 8 → ccAskEndWindow, move/last → `quiet:()=>true` с авто-ходом (ask зовёт ccAutoMoving/ccAutoLast без ccChoiceBox).
- [ ] **Step 4:** `node tools/check-career-endgame.js`, `node tools/check-career-choices.js` → OK
- [ ] **Step 5:** commit `in-game: one endgame window, room by situation`

### Task 4: Тихие остановки 3, 5, 7 и сёрдж

**Files:**
- Modify: `index.html` — CC_GAME_STOPS (~114440), ccAskFarm, ccAskMid/ccAskMenu, ccLateSurgeOpt
- Test: `tools/check-career-mid-menu.js` (переписать под авто), `tools/check-career-stops.js` (новый)

**Interfaces:**
- Consumes: `you._tac`, `ccThirdPair`, `ccThirdPairApply`, `ccSurgeState`, `CC_SURGE_SAFE`, `ccMatsLow`
- Produces:
  - `ccAutoFarm(you, ui)` — фарм до фула; при ccMatsLow стиль `eco`. Без окна.
  - `ccAutoMid(you, ui)` — ccMatsLow → ход `go` (рефреш с броском); иначе если `you._tac==='push'` и ccThirdPair → ccThirdPairApply; затем авто-сёрдж; затем ccShowHeal. Без окна.
  - `ccAutoSurge(you, ui) -> bool` — если ccSurgeState(you).on и gap < CC_SURGE_SAFE и не ccNoSurge(): применить как ccLateSurgeApply, строка в ленту.

- [ ] **Step 1: Сторож check-career-stops.js** — прогон одной игры в карьере (ccLootRoomOn, комнату лута закрывать кликом `.cc-loot [data-a="go"]`), счётчик открытых `.cc-choice` по kind: ровно `site`, `rot`, `late` (+ `loot` комнаты); ноль `farm`, `mid`, `moving`, `last`, `tactic`, `path`. Отдельно: Reload-остров → ccAutoSurge ни разу не сработал.
- [ ] **Step 2:** запустить → FAIL
- [ ] **Step 3:** Реализовать; stops 3/5/7 вызывают авто-функции; ccMpMark-метки остаются теми же строками, чтобы онлайн-книга не разъехалась.
- [ ] **Step 4:** `node tools/check-career-stops.js`, `node tools/check-career-mid-menu.js`, `node tools/check-career-sim.js` → OK
- [ ] **Step 5:** commit `in-game: quiet stops for farm, mid and surge`

### Task 5: Проба и настройка чисел

**Files:**
- Create: `tools/career-sit-probe.js` (по образцу tools/career-choice-value-probe.js)
- Modify: `index.html` — только коэффициенты ccSitValue

**Interfaces:**
- Consumes: всё выше; стратегии игрока через подмену ccChoiceBox: `best` (argmax ccSitValue), `worst` (argmin), `default`.

- [ ] **Step 1:** Проба: 600 игр на стратегию, кубок Д1, печать среднего места, побед %, топ-10 %; плюс доля «лучший = id» по kind.
- [ ] **Step 2:** Прогон до правок коэффициентов; записать числа.
- [ ] **Step 3:** Подогнать коэффициенты, пока: best − worst ≥ 4 места; ни один id не лучший > 60%; `default` в пределах ±1 места и ±2% побед от замера `git show 366aaa22:index.html` той же пробой.
- [ ] **Step 4:** Таблицу замера — в комментарий над ccSitValue (как у CC_HG_POW).
- [ ] **Step 5:** commit `in-game: tune situation values by probe`

### Task 6: Онлайн, полный прогон, debug

**Files:**
- Modify: сторожа, которые кликают первую кнопку по kind: `tools/check-mp-death.js`, `tools/check-mp-choice-cost.js`, `tools/check-mp-third.js`, `tools/check-lockstep-death.js`
- Test: они же + `bash tools/run-guards.sh` (нужен воркер: `cd server && npx wrangler dev --port 8787 --local`)

- [ ] **Step 1:** Обновить MP-сторожа под три остановки (ожидаемые kind: site, rot, late).
- [ ] **Step 2:** Поднять воркер, `CC_HOST=ws://127.0.0.1:8787 node tools/check-mp-third.js` и остальные → OK (mp-death, mp-choice-cost, lockstep-death красные и до плана — сравнить с `git show 366aaa22` и не ухудшить).
- [ ] **Step 3:** Полный карьерный прогон `ls tools/check-career-*.js | xargs -P 3 …` → не больше красных, чем 288/292 до плана; плавающие newseason/heat-seeding перезапустить поодиночке.
- [ ] **Step 4:** `node tools/stamp-build.js`, commit `stamp`, `node tools/build-deploy.js "<деплои>/fncsdraft-debug-<дата>"`, `node tools/check-deploy-folder.js <папка>` → «ни одного 404, ни одной ошибки», `npx wrangler pages deploy <папка> --project-name=fncsdraft --branch=debug --commit-dirty=true`, curl debug с `?cb=` показывает новый `app.js?v=`.
- [ ] **Step 5:** Записать в память (fncsdraft-deploy-folder.md строку debug, новый файл памяти про три остановки).
