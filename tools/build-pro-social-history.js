// Соцсети про ПО ГОДАМ (28.10, его «другим годам всю статистику по соцсетям, но чтоб цифры были именно тех годов»;
// выбран вариант «замер + оценка»). Пишет в index.html блок CC_PRO_SOCIAL_HIST:
//   CC_SOC_HIST  — замеры Wayback (fetch-wayback-socials.js): ник в нижнем регистре → {x:{год:число}, yt:{год:число}};
//   CC_SOC_CURVE — средняя кривая: медиана отношения «число в феврале года Y / число в октябре 2026» по всем, у кого есть
//                  и замер, и нынешнее число (CC_PRO_SOCIAL). Годы без медианы (X после 2022 — Twitter стал страницей на
//                  JS, в снимках чисел нет) — по логарифму между соседними годами и 1,0 в 2026. Twitch по годам не
//                  замерить (в снимках twitch.tv чисел нет), ему берётся кривая X — тоже площадка «фолловеров», того же
//                  роста; это допущение, и оно записано рядом с кодом (ccProSocialAt).
//   node tools/build-pro-social-history.js <wayback.tsv>
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const f = path.join(ROOT, 'index.html');
let html = fs.readFileSync(f, 'utf8');
// Нынешние числа — из уже собранного CC_PRO_SOCIAL ([Twitch, YouTube, X]).
const m = /const CC_PRO_SOCIAL=(\{[^\n]*\});/.exec(html);
if (!m) throw new Error('CC_PRO_SOCIAL');
const NOW = JSON.parse(m[1]);
const hist = {};
fs.readFileSync(process.argv[2], 'utf8').split(/\r?\n/).filter(Boolean).forEach(l => {
  const [h, net, y, v] = l.split('\t');
  if (!(+y >= 2019) || !(+v >= 0)) return;
  const k = h.toLowerCase();
  ((hist[k] = hist[k] || {})[net] = hist[k][net] || {})[y] = +v;
});
// Замер больше нынешнего в полтора раза — не тот аккаунт (ник переехал, старый канал MrSavage на 1,1 млн): не берём.
const IDX = { x: 2, yt: 1 };
Object.keys(hist).forEach(k => ['x', 'yt'].forEach(net => {
  const now = (NOW[k] || [])[IDX[net]] || 0, o = (hist[k] || {})[net];
  if (!o) return;
  Object.keys(o).forEach(y => { if (now && o[y] > now * 1.5) delete o[y]; });
  if (!Object.keys(o).length) delete hist[k][net];
}));
const YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025];
const median = a => { if (!a.length) return null; a = a.slice().sort((p, q) => p - q); return a[Math.floor(a.length / 2)]; };
const curve = {}, sample = {};
['x', 'yt'].forEach(net => {
  const c = {};
  YEARS.forEach(y => {
    const r = [];
    Object.keys(hist).forEach(k => { const now = (NOW[k] || [])[IDX[net]] || 0, v = ((hist[k] || {})[net] || {})[y]; if (now >= 1000 && v != null) r.push(Math.min(1.5, v / now)); });
    sample[net + y] = r.length;
    if (r.length >= 15) c[y] = Math.max(0.005, median(r));
  });
  // пропуски — логарифм между соседями, справа 2026 = 1
  const pts = YEARS.filter(y => c[y] != null).map(y => [y, Math.log(c[y])]).concat([[2026.8, 0]]);
  YEARS.forEach(y => {
    if (c[y] != null) return;
    const b = pts.find(p => p[0] > y), a = pts.slice().reverse().find(p => p[0] < y);
    c[y] = a ? Math.exp(a[1] + (b[1] - a[1]) * (y - a[0]) / (b[0] - a[0])) : Math.exp(b[1]) * Math.pow(0.6, b[0] - y);
  });
  // не растёт назад: раньше — не больше, чем позже, и не больше нынешнего
  for (let i = YEARS.length - 1; i >= 0; i--) c[YEARS[i]] = Math.min(c[YEARS[i]], i + 1 < YEARS.length ? c[YEARS[i + 1]] : 1);
  curve[net] = Object.fromEntries(YEARS.map(y => [y, +c[y].toFixed(4)]));
});
// Twitch без своих замеров X — по кривой YouTube (кривая X у про в архиве к 2021-му почти плоская, Twitch рос позже)
curve.tw = curve.yt;
const keys = Object.keys(hist).sort();
const histJs = '{' + keys.map(k => JSON.stringify(k) + ':' + JSON.stringify(hist[k])).join(',') + '}';
fs.writeFileSync(path.join(__dirname, 'measured', 'pro-social-history.json'), JSON.stringify({ at: '2026-10-28', curve, sample, hist }));
const a = '// ==== CC_PRO_SOCIAL_HIST (tools/build-pro-social-history.js) ====\n', b = '// ==== /CC_PRO_SOCIAL_HIST ====';
const i = html.indexOf(a), j = html.indexOf(b);
if (i < 0 || j < i) throw new Error('markers');
html = html.slice(0, i + a.length) + 'const CC_SOC_CURVE=' + JSON.stringify(curve) + ';\nconst CC_SOC_HIST=' + histJs + ';\n' + html.slice(j);
fs.writeFileSync(f, html);
console.log('history players', keys.length, 'curve', JSON.stringify(curve), 'sample', JSON.stringify(sample));
