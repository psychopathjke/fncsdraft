// Клубы игроков 2019–2020 — из уже сохранённой разметки Liquipedia (tools/measured/liqui-2019,
// liqui-2020), без новых запросов. В слоте призовых игроки идут позиционно, за каждым —
// его клуб на дату турнира: «|Andilex |flag1p1=fr |team1p1=team mces |nayte … |team1p2=…».
// Клуб там — ключ шаблона Liquipedia в нижнем регистре; имя для карточки берётся из клубов,
// уже известных базе (orgs-by-year.json, LIQUI_CLUB), где ключ сходится без регистра и знаков,
// иначе — ключ с заглавных букв.
// Ключи этапов — как у build-year-orgs.js: 2019 — major1 World Cup Solo, major2 World Cup Duos,
// major3 FNCS Season X, major4 C2S1; 2020 — major1..3 = C2S2..C2S4 (финалы), major<n>q — хиты,
// недели и квалификаторы того же сезона.
//   node tools/build-old-orgs.js && node tools/splice-orgs-by-year.js
'use strict';
const fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, 'measured', 'orgs-by-year.json');
const data = JSON.parse(fs.readFileSync(OUT, 'utf8'));
const REG = { 'Europe': 'EU', 'North America East': 'NAC', 'North America West': 'NAW', 'Brazil': 'BR', 'Asia': 'ASIA', 'Middle East': 'ME', 'Oceania': 'OCE' };
const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
// Известные имена клубов.
const known = new Map();
Object.values(data).forEach(y => Object.values(y).forEach(k => Object.values(k).forEach(e => { if (e && e.club && !known.has(norm(e.club))) known.set(norm(e.club), e.club); })));
{ const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const i = html.indexOf('const LIQUI_CLUB={'), j = html.indexOf('};', i);
  if (i > 0) for (const m of html.slice(i, j).matchAll(/:"([^"]+)"/g)) if (!known.has(norm(m[1]))) known.set(norm(m[1]), m[1]); }
// Короткие ключи шаблонов, которые без словаря не узнать.
const ALIAS = { faze: 'FaZe Clan', liquid: 'Team Liquid', '100t': '100 Thieves', clg: 'Counter Logic Gaming', tsm: 'TSM',
  nrg: 'NRG', ghost: 'Ghost Gaming', c9: 'Cloud9', g2: 'G2 Esports', vp: 'Virtus.pro', fnatic: 'Fnatic', mouz: 'MOUZ',
  sen: 'Sentinels', eg: 'Evil Geniuses', optic: 'OpTic Gaming', xset: 'XSET', lg: 'Luminosity Gaming', sk: 'SK Gaming' };
const nice = key => {
  const k = String(key || '').trim(); if (!k) return null;
  if (ALIAS[k.toLowerCase()]) return ALIAS[k.toLowerCase()];
  const hit = known.get(norm(k)) || known.get(norm(k.replace(/\b(esports?|gaming|team)\b/gi, '')));
  if (hit) return hit;
  return k.replace(/(^|[\s.-])([a-z])/g, (m, a, b) => a + b.toUpperCase());
};
// Файл → [год, ключ, регион].
function classify(dir, f) {
  const base = f.replace(/\.txt$/, '').split('__');
  const reg = REG[base[base.length - 1]] || null;
  const t = base.join('/');
  if (/World Cup\/2019\/Finals\/Solo/.test(t)) return [2019, 'major1', null];
  if (/World Cup\/2019\/Finals\/Duos/.test(t)) return [2019, 'major2', null];
  if (/Season X\/Grand Finals/.test(t)) return [2019, 'major3', reg];
  if (/Chapter 2\/Season 1\/Grand Finals/.test(t)) return [2019, 'major4', reg];
  const m = /Chapter 2\/Season ([234])\/(.+?)\//.exec(t);
  if (m) return [2020, 'major' + (+m[1] - 1) + (/Grand Finals/.test(m[2]) ? '' : 'q'), reg];
  return null;
}
const add = {};
for (const dir of ['liqui-2019', 'liqui-2020']) {
  const d = path.join(__dirname, 'measured', dir);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d)) {
    const c = classify(dir, f); if (!c) continue;
    const [y, key, reg] = c;
    const text = fs.readFileSync(path.join(d, f), 'utf8');
    for (const m of text.matchAll(/\{\{prize pool slot[^}]*\}\}/gi)) {
      const parts = m[0].replace(/^\{\{|\}\}$/g, '').split('|').map(x => x.trim());
      let idx = 0; const names = [];
      parts.slice(1).forEach(p => {
        if (!p) return;
        if (!/=/.test(p)) { names.push(p); idx = names.length; return; }
        const t = /^team(\d*)p?(\d*)\s*=\s*(.*)$/i.exec(p);
        if (!t) return;
        const j = +(t[2] || t[1] || idx) || idx;
        const who = names[j - 1] || names[names.length - 1];
        const club = nice(t[3]);
        if (!who || !club) return;
        add[y] = add[y] || {}; add[y][key] = add[y][key] || {};
        if (!add[y][key][who]) add[y][key][who] = { club, reg };
      });
    }
  }
}
Object.keys(add).forEach(y => { data[y] = Object.assign(data[y] || {}, add[y]); });
fs.writeFileSync(OUT, JSON.stringify(data, null, 1));
console.log(Object.keys(add).map(y => y + ': ' + Object.keys(add[y]).sort().map(k => k + '=' + Object.keys(add[y][k]).length).join(' ')).join(' | '));
const clubs = {}; Object.values(add).forEach(y => Object.values(y).forEach(k => Object.values(k).forEach(e => clubs[e.club] = (clubs[e.club] || 0) + 1)));
console.log(Object.entries(clubs).sort((a, b) => b[1] - a[1]).slice(0, 40).map(x => x[0] + ' ' + x[1]).join(', '));
