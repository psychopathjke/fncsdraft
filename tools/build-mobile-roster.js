// Мобильная сцена для мобильных капов карьеры: настоящие игроки из таблиц Epic 2026 (tools/measured/comp-results.json,
// окна Mobile Series / Mobile Victory Cup / Touch-Only Test Cup), по регионам. На мобиле играют другие люди, не ПК-сцена.
// Рейтинг — по результатам в этих таблицах (в каждой топ-15): очки за каждое попадание 16 − место (1-е = 15 … 15-е = 1),
// сумма по всем таблицам региона. Игроки региона раскладываются по процентилю суммы на шкалу 62–92:
//   r = 62 + 30 · p^1.6 (p — доля игроков ниже, 0…1): топ 92, медиана около 72, низ 62.
// Порядок — данные; изгиб шкалы и её края — решение, не замер.
// Печатает const CC_MOBILE_ROSTER={REG:[[ник, страна|null, рейтинг], ...]}; вставляется в index.html.
//   node tools/build-mobile-roster.js > mobile.txt
const path = require('path');
const res = require(path.join(__dirname, 'measured', 'comp-results.json')).windows;
const by = {};
res.filter(w => /Mobile|Touch/i.test(w.w)).forEach(w => {
  const reg = w.region || 'EU', m = (by[reg] = by[reg] || new Map());
  (w.top || []).forEach(t => (t.n || []).forEach((n, i) => {
    if (!n) return;
    const o = m.get(n) || {n, c: (t.c || [])[i] || null, pts: 0};
    o.pts += Math.max(1, 16 - t.rank); if (!o.c && (t.c || [])[i]) o.c = t.c[i];
    m.set(n, o);
  }));
});
const LO = 62, HI = 92, BEND = 1.6;
const out = {};
for (const [reg, m] of Object.entries(by)) {
  const list = [...m.values()].sort((a, b) => a.pts - b.pts);
  const n = list.length;
  // Одинаковые суммы — один процентиль (середина своей группы), чтобы равные не расходились по шкале.
  const pctOf = new Map();
  for (let i = 0; i < n;) { let j = i; while (j < n && list[j].pts === list[i].pts) j++; pctOf.set(list[i].pts, n > 1 ? ((i + j - 1) / 2) / (n - 1) : 1); i = j; }
  out[reg] = list.map(o => [o.n, o.c, Math.round((LO + (HI - LO) * Math.pow(pctOf.get(o.pts), BEND)) * 10) / 10])
    .sort((a, b) => b[2] - a[2] || (a[0] < b[0] ? -1 : 1));
}
process.stdout.write('const CC_MOBILE_ROSTER=' + JSON.stringify(out) + ';\n');
console.error(Object.entries(out).map(([r, l]) => { const v = l.map(x => x[2]).sort((a, b) => a - b); return r + ' ' + l.length + ' (' + v[0] + '/' + v[v.length >> 1] + '/' + v[v.length - 1] + ')'; }).join(', '));
