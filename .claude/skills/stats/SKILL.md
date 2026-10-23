---
name: stats
description: Статистика fncsdraft.com из Cloudflare — сколько людей (без ботов) по дням, страницы, страны, откуда пришли, ошибки воркеров, выкладки рядом с днями. Когда он спрашивает «сколько людей», «как трафик», «почему упало/выросло», «что с аналитикой».
---

# Статистика

Только чтение. Ничего в Cloudflare не менять.

1. Есть токен (C:/Users/FoxOS_User/fd-cf/token.txt или CF_API_TOKEN) → `node tools/cf-stats.js` (неделя подробно) или `--short` (одна строка).
2. Нет токена → MCP `mcp__cloudflare__execute`: взять запрос из `node tools/cf-stats.js --query` и отправить
   `cloudflare.request({method:"POST", path:"/graphql", body:{query, variables}})`, `a` = accountId. Выкладки — GET `/accounts/{id}/pages/projects/fncsdraft/deployments?env=production`.
3. Бюджет GraphQL маленький: всё одним запросом. «Rate limiter budget depleted» → ждать 5 минут (фоновый `sleep 330`), не долбить.
4. Людей мерить ТОЛЬКО по Web Analytics (rumPageload…). Доменный счётчик (httpRequests) — с ботами, его не показывать как людей.
5. Скачок/провал → сверить с выкладками того дня, страной и источником (reddit, youtube, google), прежде чем объяснять.
6. Ошибки воркера fncsdraft-mp → дальше журнал поломок (скил errlog).
7. Ответ: таблица дней, 2–3 вывода с числами, без догадок. Ориентир: сентябрь–октябрь ~300 людей в день.
