#!/bin/sh
# Быстрые сторожа онлайна и ролей (~15 мин). Нужен локальный воркер на 8787 (server: npx wrangler dev --port 8787 --local).
#   bash tools/run-guards.sh            — все; итог: строка на сторожа, код выхода 1, если хоть один красный
cd "$(dirname "$0")/.." || exit 2
bad=0
for t in check-career-trio check-career-trio-room check-career-trio-carry check-career-trio-build check-career-scene-stable check-career-chapter-squads check-career-race check-mp-field-same check-mp-room-same check-mp-same check-mp-seed check-mp-no-randoms check-mp-season-turn check-mp-enter-wires check-mp-card check-mp-solo-shared check-mp-mx-shared check-mp-stat-board check-mp-undo check-mp-ff check-career-mate-role check-career-dm-role check-career-squad-roles check-career-globals check-ui-dash; do
  out=$(CC_HOST=${CC_HOST:-ws://127.0.0.1:8787} timeout 900 node tools/$t.js 2>&1); c=$?
  [ $c -ne 0 ] && bad=1
  echo "$t: exit $c $(echo "$out" | grep -v '^\[' | tail -1 | cut -c1-110)"
done
# Телефон (WebKit) — если Playwright с WebKit стоит (см. шапку tools/check-iphone.js).
if [ -d "${FD_PW:-/c/Users/FoxOS_User/fd-webkit/node_modules/playwright}" ]; then
  out=$(timeout 600 node tools/check-iphone.js 2>&1); c=$?; [ $c -ne 0 ] && bad=1
  echo "check-iphone: exit $c $(echo "$out" | tail -1 | cut -c1-110)"
fi
exit $bad
