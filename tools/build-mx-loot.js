// Пулы лута 2019–2020 со страниц вики «<сезон>/Loot Pool»: Season 9 (World Cup), Season X, Chapter 2
// сезоны 1–4. На страницах дат нет — сезон целиком. У Chapter 1 страница — таблицы «Assault Rifles /
// Shotguns / …» со строками «ссылка / Rarity Display». Мифики, экзотики, лут фракций — не лут точки.
// Выход — вставка между маркерами «FNCS 2019–2020 loot» и строки в T_WEAPON_POOLS / T_CONSUMABLE_POOLS /
// T_SEASON_NAME / CC_LOOT_BY_SET.
//   node tools/build-mx-loot.js
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const UA = 'FNCSDraft-DataCheck/1.0 (keegorka@gmail.com)';
const SEASONS = { h1: { page: 'Season 9', c1: true }, h3: { page: 'Season X', c1: true }, h4: { page: 'Chapter 2: Season 1' },
  i1: { page: 'Chapter 2: Season 2' }, i2: { page: 'Chapter 2: Season 3' }, i3: { page: 'Chapter 2: Season 4' } };
const MON = { January: 1, February: 2, March: 3, April: 4, May: 5, June: 6, July: 7, August: 8, September: 9, October: 10, November: 11, December: 12 };
const dateOf = t => { const m = /([A-Z][a-z]+)\s+(\d+)(?:st|nd|rd|th)?,?\s+(\d{4})/.exec(t || ''); return m && MON[m[1]] ? m[3] + '-' + String(MON[m[1]]).padStart(2, '0') + '-' + String(m[2]).padStart(2, '0') : null; };
const CAT = [[/Assault|Rifles$/i, 'rifle'], [/Shotgun/i, 'shotgun'], [/Submachine|SMG/i, 'smg'], [/Pistol/i, 'pistol'], [/Sniper|Marksman|Bow/i, 'rifle']];
const catOf = h => { for (const [re, c] of CAT) if (re.test(h)) return c; return null; };
const RAR = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
function rarRange(t) {
  const s = String(t || '');
  if (/All Rarities/i.test(s)) return ['common', 'legendary'];
  const disp = /Rarity Display\|([A-Za-z]+)/.exec(s);
  let words = disp ? disp[1].replace(/to/g, ' ').split(/\s+/) : (s.match(/\{\{(Common|Uncommon|Rare|Epic|Legendary|Mythic|Exotic)\}\}/g) || []).map(x => x.replace(/[{}]/g, ''));
  words = words.map(w => w.toLowerCase()).filter(w => RAR.includes(w));
  if (!words.length) return null;
  return [words[0], words[words.length - 1]];
}
const COLOR = { common: 'grey', uncommon: 'green', rare: 'blue', epic: 'purple', legendary: 'gold' };
const iconOf = n => /Med|Bandage|Heal|Campfire|Apple|Banana/i.test(n) ? 'heal' : /Slurp|Splash|Fizz|Chug|Juice/i.test(n) ? 'drink' : 'shield';
// Написание — как в остальных пулах режима (там «Med Kit», не «Medkit»).
const SAME = { 'Medkit': 'Med Kit', 'Bandages': 'Bandage' };
const clean = n => { const x = n.replace(/#.*$/, '').replace(/\s*\(Battle Royale\)/, '').trim(); return SAME[x] || x; };
const linkName = cell => { const ls = [...cell.matchAll(/\[\[(?!File:)([^\]|]+)(?:\|([^\]]+))?\]\]/g)]; if (!ls.length) return null; const l = ls[ls.length - 1]; return clean(l[2] || l[1]); };

function fetchPage(page) {
  const url = 'https://fortnite.fandom.com/api.php?format=json&action=parse&prop=wikitext&page=' + encodeURIComponent(page + '/Loot Pool');
  const body = execFileSync('curl', ['-s', '-A', UA, url], { maxBuffer: 1 << 26 }).toString();
  return JSON.parse(body).parse.wikitext['*'];
}
// Формат A (с датами): таблица «Standard Loot» с подтаблицами по категориям, строки: ссылка / редкость / добавлено / волт.
function parseDated(t, at) {
  const start = t.indexOf('|Standard Loot'), stop = t.indexOf('Faction/POI Specific Loot');
  const body = t.slice(start, stop > start ? stop : undefined);
  const out = { weapons: [], items: [] };
  const sections = body.split(/text-align: left;?"\s*\|/).slice(1);
  sections.forEach(sec => {
    const head = sec.split('\n')[0].trim();
    const cat = catOf(head), cons = /Consumable|Other|Utility|Healing/i.test(head);
    if (!cat && !cons) return;
    sec.split(/\n\|-\n/).forEach(row => {
      const lines = row.split('\n').filter(l => l.startsWith('|') && !l.startsWith('|}'));
      if (lines.length < 2) return;
      const name = linkName(lines[0]); if (!name) return;
      const rr = rarRange(lines[1]); if (!rr) return;
      const added = dateOf(lines[2]), vaulted = dateOf(lines[3]);
      if (at && added && added > at) return;
      if (at && vaulted && vaulted <= at) return;
      if (cat) out.weapons.push([name, cat, rr[0], rr[1]]); else out.items.push({ name, rarity: COLOR[rr[1]] || 'green', icon: iconOf(name) });
    });
  });
  return out;
}
// Формат B (сетка): после «===Standard Loot===» таблицы «! colspan=N |Заголовок», ячейки «[[Имя]]<br>{{Редкость}}».
function parseGrid(t) {
  // Chapter 2: у C2S5 раздел зовётся «Chest Loot»; заголовки таблиц — «!scope="col" … colspan="N"| Имя».
  const at = t.indexOf('===Standard Loot===') >= 0 ? t.indexOf('===Standard Loot===') : t.indexOf('===Chest Loot===');
  const body = t.slice(Math.max(0, at));
  const out = { weapons: [], items: [] };
  body.split(/\n![^\n|]*colspan="\d+"[^|\n]*\|/).slice(1).forEach(sec => {
    const head = sec.split('\n')[0].replace(/\[\[[^\]]*\]\]/g, '').trim();
    const cat = /Assault/i.test(head) ? 'rifle' : catOf(head), cons = /Utility|Consumable|Healing|Other|Item/i.test(head);
    if (!cat && !cons) return;
    sec.split(/\n\|(?!-|\})/).slice(1).forEach(cell => {
      if (/Mythic|Exotic/.test(cell)) return;
      const parts = cell.split(/<br\s*\/?>/);
      const name = linkName(parts[0] || cell); if (!name) return;
      const rr = rarRange(parts.slice(1).join(' ')) || ['common', 'legendary'];
      if (cat) out.weapons.push([name, cat, rr[0], rr[1]]); else out.items.push({ name, rarity: COLOR[rr[1]] || 'green', icon: iconOf(name) });
    });
  });
  return out;
}
// Раздел «Other» на вики общий: рыба, еда, топливо и моды машин — не расходники инвентаря.
const NOT_ITEM = /Birthday|Glider|Glitched|Upgrade Bench|Zapper Trap|Spicy Taco|Fries|Flopper|Fish|Jellyfish|Rusty Can|Cabbage|Corn|Banana|Coconut|Apple|Mushroom|Berry|Meat|Firefly|Gas Can|Vehicle Mod|Fishing Rod|Falcon Scout|Pepper|Potato/i;
// Мифики сезона 3, стоящие в сетке без пометки.
const NOT_WEAPON = /Dragon.s Breath/i;
// Chapter 1: таблицы «colspan="100%" … |Раздел», строки «|[[File:…]][[Имя]]<hr>…» и «|{{Rarity Display|XtoY}}».
function parseC1(t) {
  const out = { weapons: [], items: [] };
  t.split(/colspan="100%"[^\n]*\|/).slice(1).forEach(sec => {
    const head = sec.split('\n')[0].trim();
    const cat = /Assault/i.test(head) ? 'rifle' : catOf(head), cons = /Utility|Consumable|Healing/i.test(head);
    if (!cat && !cons) return;
    sec.split(/\n\|-\n/).forEach(row => {
      const lines = row.split('\n').filter(l => l.startsWith('|') && !l.startsWith('|}'));
      if (lines.length < 2) return;
      const name = linkName(lines[0].split('<hr>')[0]); if (!name) return;
      const rr = rarRange(lines[1]); if (!rr) return;
      if (cat) out.weapons.push([name, cat, rr[0], rr[1]]); else out.items.push({ name, rarity: COLOR[rr[1]] || 'green', icon: iconOf(name) });
    });
  });
  return out;
}
const dedupe = (arr, key) => { const s = new Set(); return arr.filter(x => { const k = key(x); if (s.has(k)) return false; s.add(k); return true; }); };
const js = [];
for (const [set, cfg] of Object.entries(SEASONS)) {
  const t = fetchPage(cfg.page);
  const p = cfg.c1 ? parseC1(t) : t.indexOf('|Standard Loot') >= 0 ? parseDated(t, cfg.at) : parseGrid(t);
  p.weapons = dedupe(p.weapons.filter(w => !NOT_WEAPON.test(w[0])), w => w[0]); p.items = dedupe(p.items.filter(x => !NOT_ITEM.test(x.name)), x => x.name);
  const U = set.toUpperCase();
  js.push('const ' + U + '_WEAPON_NAMES=[');
  js.push(p.weapons.map(w => '  [' + JSON.stringify(w[0]) + ",'" + w[1] + "','" + w[2] + "','" + w[3] + "']").join(',\n'));
  js.push('];');
  js.push('const ' + U + '_WEAPON_POOL=ladderPool(' + U + '_WEAPON_NAMES);');
  js.push('const ' + U + '_CONSUMABLE_POOL=[');
  js.push(p.items.map(x => '  {name:' + JSON.stringify(x.name) + ', rarity:"' + x.rarity + '", icon:\'' + x.icon + "'}").join(',\n'));
  js.push('].map(w=>({...w, mod:CONSUMABLE_MOD[w.rarity]}));');
  console.log(set, 'weapons', p.weapons.length, p.weapons.map(w => w[0]).join(', '));
  console.log(set, 'items', p.items.length, p.items.map(x => x.name).join(', '));
}
const file = path.join(ROOT, 'index.html');
let s = fs.readFileSync(file, 'utf8');
const nl = s.includes('\r\n') ? '\r\n' : '\n';
const A = '// ==== FNCS 2019–2020 loot (tools/build-mx-loot.js) ====', B = '// ==== /FNCS 2019–2020 loot ====';
const block = A + nl + '/* 2019–2020: пулы вики по сезонам (Season 9, Season X, Chapter 2 сезоны 1–4), сезон целиком.' + nl +
  '   См. tools/build-mx-loot.js. */' + nl + js.join(nl).split('\n').join(nl) + nl + B;
const i = s.indexOf(A), j = s.indexOf(B);
if (i >= 0 && j > i) s = s.slice(0, i) + block + s.slice(j + B.length);
else {
  const at = s.indexOf('const T_WEAPON_POOLS={');
  if (at < 0) throw new Error('T_WEAPON_POOLS not found');
  s = s.slice(0, at) + block + nl + s.slice(at);
}
const rep = (a, b) => { if (s.indexOf(b) >= 0) return; if (s.split(a).length !== 2) throw new Error('not found: ' + a.slice(0, 60)); s = s.replace(a, () => b); };
const K = ['h1', 'h3', 'h4', 'i1', 'i2', 'i3'];
rep('j4:J4_WEAPON_POOL};', 'j4:J4_WEAPON_POOL, ' + K.map(k => k + ':' + k.toUpperCase() + '_WEAPON_POOL').join(', ') + '};');
rep('j4:J4_CONSUMABLE_POOL};', 'j4:J4_CONSUMABLE_POOL, ' + K.map(k => k + ':' + k.toUpperCase() + '_CONSUMABLE_POOL').join(', ') + '};');
rep("const T_SEASON_NAME={j1:['Глава 2, сезон 5','Chapter 2, Season 5'],",
    "const T_SEASON_NAME={h1:['Сезон 9','Season 9'], h3:['Сезон X','Season X'], h4:['Глава 2, сезон 1','Chapter 2, Season 1']," + nl +
    "                     i1:['Глава 2, сезон 2','Chapter 2, Season 2'], i2:['Глава 2, сезон 3','Chapter 2, Season 3'], i3:['Глава 2, сезон 4','Chapter 2, Season 4']," + nl +
    "                     j1:['Глава 2, сезон 5','Chapter 2, Season 5'],");
rep('  j4:{weapons:J4_WEAPON_POOL, heals:J4_CONSUMABLE_POOL},',
    '  j4:{weapons:J4_WEAPON_POOL, heals:J4_CONSUMABLE_POOL},' + nl + K.map(k => '  ' + k + ':{weapons:' + k.toUpperCase() + '_WEAPON_POOL, heals:' + k.toUpperCase() + '_CONSUMABLE_POOL},').join(nl));
fs.writeFileSync(file, s);
console.log('spliced');
