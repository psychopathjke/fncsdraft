---
name: deploy-debug
description: Выложить текущий main fncsdraft на debug-адрес Cloudflare Pages (не прод). Использовать, когда просят «на debug», «выложи на дебаг», или перед продом для проверки.
---

# Выкладка на debug

Debug можно выкладывать без отдельного разрешения. Прод — нельзя (см. deploy-prod).

Шаги (из C:\Users\FoxOS_User\Desktop\fncsdraftmajor):

1. Рабочее дерево чистое или закоммичено: `git status --short`. Незакоммиченное — сначала коммит (хук pre-commit проверит LF, дифф и FIFA).
2. Штамп: `node tools/stamp-scripts.js && node tools/stamp-build.js`, затем коммит «stamp dbgNN» (номер — следующий после последнего `git log --oneline | grep -m1 "stamp dbg"`).
3. Сборка: `node tools/build-deploy.js "C:/Users/FoxOS_User/Desktop/Рабочий стол до 07.09/деплои/fncsdraft-debug-<ДД.ММ><буква>"`.
4. Проверка папки: `node tools/check-deploy-folder.js "<та же папка>"` — должна быть зелёной (ноль 404, ноль ошибок).
5. Выкладка: из папки сборки `npx wrangler pages deploy . --project-name=fncsdraft --branch=debug --commit-dirty=true`.
6. Проверка живьём с обходом кэша: `curl -s "https://debug.fncsdraft.pages.dev/?cb=$RANDOM" | grep -o "CC_BUILD='[0-9a-f]*'"` и app.js ?v= — совпадают со сборкой.
7. Ответ владельцу по-русски: что уехало (коммиты), CC_BUILD, ссылка отдельной строкой без точки после неё. Запись в память fncsdraft-deploy-folder.md одной строкой.

Ловушки: сразу после деплоя корень может отдавать старое из кэша — проверять с ?cb=; не путать debug и main ветку wrangler.
