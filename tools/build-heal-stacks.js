// Стаки и сила хилок — со страниц предметов вики, а не на глаз.
//
// Его слово 8 сентября 2026: «с хилом надо решить, пусть сам юзается, если нужно,
// обычно так делают игроки и тратят хилл, ещё можно стакать хилы 3 биги 6 миников и т.д.»
// Значит паку нужно ЧИСЛО каждой хилки и то, сколько она даёт. И то и другое лежит в
// инфобоксе предмета на вики: `stack_size`, `health`/`shield`/`effect`.
//
// Печатает готовую строку CC_HEAL_KIT для index.html и список того, чего на вики нет.
//
//   node tools/build-heal-stacks.js
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const UA = 'FNCSDraft-DataCheck/1.0 (keegorka@gmail.com)';

// Имена расходников из всех сезонных пулов index.html — спрашиваем ровно про них.
function poolNames() {
  const s = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const out = new Set();
  ['M1_CONSUMABLE_POOL','M2_CONSUMABLE_POOL','S42_CONSUMABLE_POOL',
   'T1_CONSUMABLE_POOL','T2_CONSUMABLE_POOL','T3_CONSUMABLE_POOL'].forEach(v => {
    const i = s.indexOf('const ' + v + '=');
    if (i < 0) return;
    const blk = s.slice(i, s.indexOf('\n];', i));
    (blk.match(/name:"[^"]+"|name:'[^']+'/g) || []).forEach(m => out.add(m.slice(6, -1)));
  });
  return [...out].sort();
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function wikitext(title) {
  const url = 'https://fortnite.fandom.com/api.php?format=json&action=parse&prop=wikitext&page=' +
              encodeURIComponent(title);
  const res = await fetch(url, {headers: {'User-Agent': UA}});
  if (!res.ok) return null;
  const j = await res.json();
  return (j.parse && j.parse.wikitext && j.parse.wikitext['*']) || null;
}

const num = (t, re) => { const m = t.match(re); return m ? +m[1] : null; };
/* Поля инфобокса, как они на самом деле называются (проверено на страницах Shield Potion,
   Med Kit, Small Shield Potion): стак — max_stack; сколько даёт — heals={{Shield|50}} или
   heals={{Health|100}}, у части предметов те же числа лежат в shield=/health=; сколько
   занимает — time_of_use, «2s» или «1s (delay)<br>4s (healing)» (берём сумму секунд). */
function readItem(t){
  const stack = num(t, /\|\s*max_stack\s*=\s*(\d+)/i);
  const grab = re => { const m = t.match(re); return m ? +m[1] : null; };
  const shield = grab(/\|\s*(?:heals|shield)\s*=\s*(?:<small>)?\{\{\s*Shield\s*\|\s*\+?(\d+)/i);
  const hp = grab(/\|\s*(?:heals|health)\s*=\s*(?:<small>)?\{\{\s*Health\s*\|\s*\+?(\d+)/i);
  /* «Эффективное здоровье» — форма вики для того, что льётся и в жизнь, и в щит
     (рыба, сплэши): {{Effective Health|40}}. Плюс совсем простая запись «15 Health».
     Для симуляции важно ровно одно число — сколько всего оно вернуло. */
  const eff = grab(/\|\s*heals\s*=\s*(?:<small>)?\{\{\s*Effective Health\s*\|\s*\+?(\d+)/i)
           || grab(/\|\s*heals\s*=\s*(\d+)\s*Health/i);
  // «{{Health|2}} (Per Second)<br>{{Health|100}} (Total)» — берём итог, а не тик.
  const total = grab(/\{\{\s*Health\s*\|\s*(\d+)\s*\}\}\s*\(Total\)/i);
  let secs = null;
  const tm = t.match(/\|\s*time_of_use\s*=\s*([^\n]+)/i);
  if (tm) {
    const all = (tm[1].match(/([\d.]+)\s*s/gi) || []).map(parseFloat);
    if (all.length) secs = all.reduce((a, b) => a + b, 0);
  }
  return {stack, hp:(total||hp), shield, eff, secs};
}

(async () => {
  const names = poolNames();
  const rows = [], missing = [];
  for (const n of names) {
    let t = await wikitext(n);
    if (!t) t = await wikitext(n + ' (Item)');
    await sleep(120);
    if (!t) { missing.push(n + ' — страницы нет'); continue; }
    const it=readItem(t);
    if(it.stack==null && it.hp==null && it.shield==null && it.eff==null){ missing.push(n + ' — в инфобоксе нет ни стака, ни эффекта'); continue; }
    rows.push({name:n, stack:it.stack, hp:it.hp, shield:it.shield, eff:it.eff, secs:it.secs});
  }
  console.log('// Считано с вики ' + new Date().toISOString().slice(0, 10) + ', tools/build-heal-stacks.js');
  console.log('const CC_HEAL_KIT={');
  rows.forEach(r => console.log('  ' + JSON.stringify(r.name) + ':{stack:' + (r.stack==null?1:r.stack) +
    ', heal:' + ((r.eff||0) + (r.hp||0) + (r.shield||0)) + ', secs:' + (r.secs==null?0:r.secs) + '},'));
  console.log('};');
  console.error('\nнайдено: ' + rows.length + ' из ' + names.length);
  if (missing.length) console.error('не нашлось:\n  ' + missing.join('\n  '));
})();
