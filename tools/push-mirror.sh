#!/usr/bin/env bash
# Пересобрать и отправить зеркало на GitHub Pages из папки деплоя.
#
#   bash tools/push-mirror.sh /c/Users/FoxOS_User/Desktop/fncsdraft-prod-05.09c
#
# Зеркало — https://psychopathjke.github.io/fncsdraft/ (ветка gh-pages, Pages →
# Deploy from a branch → gh-pages / root). Оно НЕ обновляется само: каждый выкат
# на fncsdraft.com — это и запуск этого скрипта с ТОЙ ЖЕ папкой, иначе игроки
# из России играют на старой версии.
#
# Как устроено: ветка собирается git plumbing прямо из папки, через отдельный
# индекс — рабочее дерево репозитория не трогается вовсе. .nojekyll обязателен:
# Pages запускает Jekyll, а тот выбрасывает имена с подчёркиванием (_headers).
# Перед сборкой гоняется tools/check-mirror-subpath.js — сайт под подпапкой.
set -euo pipefail
SRC="${1:?папка деплоя (абсолютный путь)}"
[ -f "$SRC/index.html" ] || { echo "в папке нет index.html: $SRC" >&2; exit 2; }
cd "$(dirname "$0")/.."
node tools/check-mirror-subpath.js "$(cygpath -m "$SRC" 2>/dev/null || echo "$SRC")"
touch "$SRC/.nojekyll"
V=$(grep -o 'app.js?v=[a-f0-9]*' "$SRC/index.html" | head -1 | cut -d= -f2)
export GIT_INDEX_FILE="$(pwd)/.git/index-ghpages"
rm -f "$GIT_INDEX_FILE"
git --work-tree="$SRC" add -A 2>/dev/null
T=$(git write-tree)
# Родитель — локальная ветка, а если её нет (свежий клон: на Маке её и не было),
# то origin/gh-pages. Без этого fallback скрипт делал коммит БЕЗ родителя, и push
# отбивало «non-fast-forward»: 23 сентября 2026 зеркало с Мака так и не уехало.
P=$(git rev-parse -q --verify gh-pages 2>/dev/null || git rev-parse -q --verify origin/gh-pages 2>/dev/null || true)
C=$(git commit-tree "$T" ${P:+-p "$P"} -m "Mirror build for GitHub Pages: $(basename "$SRC") (app.js $V)")
git branch -f gh-pages "$C"
unset GIT_INDEX_FILE
git push origin gh-pages
echo "зеркало: $(basename "$SRC"), app.js $V — через минуту на https://psychopathjke.github.io/fncsdraft/"
