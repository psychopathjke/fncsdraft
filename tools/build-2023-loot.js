// Пулы лута 2023-го (Chapter 4) со страниц вики «Chapter 4: Season N/Loot Pool», Standard Loot.
// У сезонов 1 и 4 у каждой строки есть даты добавления и волта — берётся состояние на выходные
// финала (Мейджор 1 — 4 марта, Копенгаген — 13 октября); у сезонов 2 и 3 страница — сетка без
// дат, берётся сезон целиком (как у 2024-го). Мифики, экзотики, лут фракций/точек — не лут точки.
// Выход — вставка в index.html между маркерами «FNCS 2023 loot» (после пулов 2024-го) и
// строки в T_WEAPON_POOLS / T_CONSUMABLE_POOLS / T_SEASON_NAME / CC_LOOT_BY_SET.
//   node tools/build-2023-loot.js
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const UA = 'FNCSDraft-DataCheck/1.0 (keegorka@gmail.com)';
const SEASONS = { e1: { n: 1, at: '2023-03-04' }, e2: { n: 2 }, e3: { n: 3 }, e4: { n: 4, at: '2023-10-13' } };
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

function fetchPage(n) {
  const url = 'https://fortnite.fandom.com/api.php?format=json&action=parse&prop=wikitext&page=' + encodeURIComponent('Chapter 4: Season ' + n + '/Loot Pool');
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
  const body = t.slice(t.indexOf('===Standard Loot==='));
  const out = { weapons: [], items: [] };
  body.split(/\n!\s*colspan="\d+"[^|]*\|/).slice(1).forEach(sec => {
    const head = sec.split('\n')[0].replace(/\[\[[^\]]*\]\]/g, '').trim();
    const cat = /Assault/i.test(head) ? 'rifle' : catOf(head), cons = /Utility|Consumable|Healing|Other/i.test(head);
    if (!cat && !cons) return;
    sec.split(/\n\|(?!-|\})/).slice(1).forEach(cell => {
      if (/Mythic|Exotic/.test(cell)) return;
      const name = linkName(cell.split('<br>')[0] || cell); if (!name) return;
      const rr = rarRange(cell.split('<br>').slice(1).join(' ')) || ['common', 'legendary'];
      if (cat) out.weapons.push([name, cat, rr[0], rr[1]]); else out.items.push({ name, rarity: COLOR[rr[1]] || 'green', icon: iconOf(name) });
    });
  });
  return out;
}
// Раздел «Other» на вики общий: рыба, еда, топливо и моды машин — не расходники инвентаря.
const NOT_ITEM = /Fries|Flopper|Fish|Jellyfish|Rusty Can|Cabbage|Corn|Banana|Coconut|Apple|Mushroom|Berry|Meat|Firefly|Gas Can|Vehicle Mod|Fishing Rod|Falcon Scout|Pepper|Potato/i;
// Мифики сезона 3, стоящие в сетке без пометки.
const NOT_WEAPON = /Dragon.s Breath/i;
const dedupe = (arr, key) => { const s = new Set(); return arr.filter(x => { const k = key(x); if (s.has(k)) return false; s.add(k); return true; }); };
const js = [];
for (const [set, cfg] of Object.entries(SEASONS)) {
  const t = fetchPage(cfg.n);
  const p = t.indexOf('|Standard Loot') >= 0 ? parseDated(t, cfg.at) : parseGrid(t);
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
const A = '// ==== FNCS 2023 loot (tools/build-2023-loot.js) ====', B = '// ==== /FNCS 2023 loot ====';
const block = A + nl + '/* Chapter 4 (2023): пулы Standard Loot вики по сезонам — e1 на 4 марта, e4 на 13 октября (даты' + nl +
  '   добавления и волта на странице есть), e2/e3 — сезон целиком. См. tools/build-2023-loot.js. */' + nl + js.join(nl).split('\n').join(nl) + nl + B;
const i = s.indexOf(A), j = s.indexOf(B);
if (i >= 0 && j > i) s = s.slice(0, i) + block + s.slice(j + B.length);
else {
  const at = s.indexOf('const T_WEAPON_POOLS={');
  if (at < 0) throw new Error('T_WEAPON_POOLS not found');
  s = s.slice(0, at) + block + nl + s.slice(at);
}
const rep = (a, b) => { if (s.indexOf(b) >= 0) return; if (s.split(a).length !== 2) throw new Error('not found: ' + a.slice(0, 60)); s = s.replace(a, () => b); };
rep('f4:F4_WEAPON_POOL};', 'f4:F4_WEAPON_POOL, e1:E1_WEAPON_POOL, e2:E2_WEAPON_POOL, e3:E3_WEAPON_POOL, e4:E4_WEAPON_POOL};');
rep('f4:F4_CONSUMABLE_POOL};', 'f4:F4_CONSUMABLE_POOL, e1:E1_CONSUMABLE_POOL, e2:E2_CONSUMABLE_POOL, e3:E3_CONSUMABLE_POOL, e4:E4_CONSUMABLE_POOL};');
rep("const T_SEASON_NAME={f1:['Глава 5, сезон 1','Chapter 5, Season 1'],",
    "const T_SEASON_NAME={e1:['Глава 4, сезон 1','Chapter 4, Season 1'], e2:['Глава 4, сезон 2','Chapter 4, Season 2']," + nl +
    "                     e3:['Глава 4, сезон 3','Chapter 4, Season 3'], e4:['Глава 4, сезон 4','Chapter 4, Season 4']," + nl +
    "                     f1:['Глава 5, сезон 1','Chapter 5, Season 1'],");
rep('  f4:{weapons:F4_WEAPON_POOL, heals:F4_CONSUMABLE_POOL},',
    '  f4:{weapons:F4_WEAPON_POOL, heals:F4_CONSUMABLE_POOL},' + nl +
    '  e1:{weapons:E1_WEAPON_POOL, heals:E1_CONSUMABLE_POOL},' + nl + '  e2:{weapons:E2_WEAPON_POOL, heals:E2_CONSUMABLE_POOL},' + nl +
    '  e3:{weapons:E3_WEAPON_POOL, heals:E3_CONSUMABLE_POOL},' + nl + '  e4:{weapons:E4_WEAPON_POOL, heals:E4_CONSUMABLE_POOL},');
fs.writeFileSync(file, s);
console.log('spliced');
