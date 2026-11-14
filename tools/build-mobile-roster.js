// Мобильная сцена для мобильных капов карьеры: настоящие игроки из таблиц Epic 2026 (tools/measured/comp-results.json,
// окна Mobile Series / Mobile Victory Cup / Touch-Only Test Cup), по регионам. На мобиле играют другие люди, не ПК-сцена.
// Рейтинг — по результатам в этих таблицах: сколько раз в топе таблицы (там 15 строк) и лучшее место. Решение, не замер:
//   70 + до 12 за появления (0.8 за каждое) + 6 за лучшее место 1–3, 3 за 4–8; потолок 92.
// Печатает const CC_MOBILE_ROSTER={REG:[[ник, страна|null, рейтинг], ...]}; вставляется в index.html.
//   node tools/build-mobile-roster.js > mobile.txt
const path = require('path');
const res = require(path.join(__dirname, 'measured', 'comp-results.json')).windows;
const by = {};
res.filter(w => /Mobile|Touch/i.test(w.w)).forEach(w => {
  const reg = w.region || 'EU', m = (by[reg] = by[reg] || new Map());
  (w.top || []).forEach(t => (t.n || []).forEach((n, i) => {
    if (!n) return;
    const o = m.get(n) || {n, c: (t.c || [])[i] || null, best: 999, cnt: 0};
    o.best = Math.min(o.best, t.rank); o.cnt++; if (!o.c && (t.c || [])[i]) o.c = t.c[i];
    m.set(n, o);
  }));
});
const out = {};
for (const [reg, m] of Object.entries(by)) {
  out[reg] = [...m.values()].map(o => {
    const r = Math.min(92, Math.round(70 + Math.min(12, o.cnt * 0.8) + (o.best <= 3 ? 6 : o.best <= 8 ? 3 : 0)));
    return [o.n, o.c, r];
  }).sort((a, b) => b[2] - a[2] || (a[0] < b[0] ? -1 : 1));
}
process.stdout.write('const CC_MOBILE_ROSTER=' + JSON.stringify(out) + ';\n');
console.error(Object.entries(out).map(([r, l]) => r + ' ' + l.length).join(', ') + ' · ' + JSON.stringify(out).length + ' bytes');
