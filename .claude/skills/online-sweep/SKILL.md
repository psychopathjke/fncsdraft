---
name: online-sweep
description: Проверить онлайн fncsdraft (команда вдвоём и гонка) — быстрые сторожа за минуты или полный свип по годам 2019–2026 за часы. Использовать перед выкладкой и когда просят «прогон», «проверь онлайн», «чтоб красных не было».
---

# Онлайн-прогоны

Нужен локальный воркер: `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8787/` → 404 = живой. Нет — запустить в фоне:
`cd server && npx wrangler dev --port 8787 --local` (run_in_background).

## Быстрые (≈15 минут, перед любой выкладкой)
`bash tools/run-guards.sh` (код 0 = все зелёные). Состав:
check-career-trio, -trio-room, -trio-carry, -trio-build, -scene-stable, -chapter-squads, -race, check-mp-field-same, -room-same, -same, -seed, -no-randoms, -season-turn, -enter-wires, -card, -solo-shared, -mx-shared, -stat-board, -undo, -ff, check-career-mate-role, -dm-role, -squad-roles, -globals.
Все должны выйти с кодом 0.

## Полный свип (часы; не больше 3 прогонов одновременно)
- Команда: `CC_HOST=ws://127.0.0.1:8787 CC_MODE=card CC_YEAR=<год> CC_SEASONS=1 node tools/check-mp-team-season.js` (стенд покороче: CC_UNTIL=<дата>).
- Гонка: `CC_HOST=ws://127.0.0.1:8787 CC_N=2 CC_YEAR=<год|пусто для 2026> CC_DAY=<старт> CC_FF=<конец> node tools/check-race-live-six.js`.
- Окна: 2019 02-25..12-29, 2020 01-13..11-29, 2021 2020-12-07..2021-12-05, 2022 01-10..12-11, 2023 2022-12-12..2023-11-30, 2024 2023-12-04..2024-11-30, 2025 2024-12-02..2025-11-29, 2026 2025-12-15..2026-11-29.
- Или отдать агенту online-runner, если он доступен.

## Как читать
- Команда зелёная: «команда вдвоём: сезоны прошли, журналы и доски у обоих одинаковы».
- Гонка зелёная: «доски призовых … расходится 0» и «без красных строк». «след доски» на |slive/|tlive и «ключ …|wfin|…» при равных досках — не баг.
- Красное: первая строка «FAIL красные строки: <день> split@N …» — день и игра расхождения; «первое разное» — какая таблица. Дальше короткий стенд CC_UNTIL на день после и дамп (scratchpad t-team2.js с CC_DAY_DUMP).
- Не повторилось на втором прогоне — «плавающее», записать в память fncsdraft-online-divergence-0222.md.

Не убивать весь Chrome — только свои PID проб.
