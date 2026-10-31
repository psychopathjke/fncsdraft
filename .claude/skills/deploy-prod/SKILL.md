---
name: deploy-prod
description: Выложить fncsdraft на прод (fncsdraft.com). ТОЛЬКО по явному слову владельца в этом разговоре («выкладывай», «деплой», «деплой все на сайт»). Без его слова не запускать.
---

# Выкладка на прод

Без его явного слова в текущем разговоре — стоп, спросить. Разрешение на debug не переносится на прод.

1. Уточнить из его слов, ЧТО едет: весь main или выборочно (тогда ветка prod-ДД.ММ от прошлого прод-тега + cherry-pick). По умолчанию — весь main.
2. `bash tools/run-guards.sh` — код 0 (в нём и check-ui-dash).
3. Штамп: `node tools/stamp-scripts.js && node tools/stamp-build.js`, коммит.
4. Сборка: `node tools/build-deploy.js "C:/Users/FoxOS_User/Desktop/Рабочий стол до 07.09/деплои/fncsdraft-prod-<ДД.ММ><буква>"`.
5. `node tools/check-deploy-folder.js "<папка>"` — зелёная.
6. Из ОСНОВНОЙ папки проекта (там functions/, иначе /api/live пропадает): `npx wrangler pages deploy "<папка сборки>" --project-name=fncsdraft --branch=main --commit-dirty=true`. Проверка: curl /api/live = 400, не 404.
7. Проверка: fncsdraft.com и fncsdraft.pages.dev с `?cb=` отдают новый app.js ?v= и CC_BUILD.
8. `git tag prod-<ДД.ММ><буква>`, `git push origin main --tags`, зеркало: `bash tools/push-mirror.sh "<папка>"`.
9. Если менялся server/ (воркер) — выкладывать его отдельно (`cd server && npx wrangler deploy`) и тоже только по его слову.
10. Ответ: что уехало, CC_BUILD, ссылка отдельной строкой без точки, откат — прошлый прод-тег. Запись в память fncsdraft-deploy-folder.md.

Никогда не убивать весь Chrome. «На сайте старое» после выкладки — сначала Ctrl+F5 / ?cb=, а не перевыкладка.
