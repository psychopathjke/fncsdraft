// Пара стоит в двух регионах — в каком из них она СЫГРАЛА БОЛЬШЕ.
//
// Его правило 4 сентября: «стоящие на двух регионах выбери тот регион, где
// больше матчей они сыграли». До этого решение принималось на глаз («их сцена
// во всех остальных наборах»), а число матчей лежит в самих карточках:
// real.matches у каждой строки ледборда.
//
// Проба находит пары, стоящие больше чем в одном регионе круга, и печатает по
// каждой: наборы, регионы, сумму матчей и рейтинги. Итог — какой регион
// оставлять и какие ключи писать в CARD_WRONG_REGION.
//
//   node tools/pair-region-matches.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<pre id="__o" style="display:none"></pre>
<script>
(function(){
  var CIRCUITS={'FNCS 2026':['m1','m2'], 'FNCS 2025':['t1','t2','t3'],
                'Reload':['r1','r2','r3','r4']};
  var out={rows:[], err:null};
  try{
    Object.keys(CIRCUITS).forEach(function(circuit){
      var seen={};      // ключ пары|набор|регион → {matches, who}
      CIRCUITS[circuit].forEach(function(set){
        var reg={}, rat={}, mt={};
        cardRosterPlayers(set).forEach(function(p){
          (reg[p.handle]=reg[p.handle]||[]).push(p.region);
          rat[p.handle+'|'+p.region]=p.rating;
          /* Сколько человек сыграл В ЭТОМ РЕГИОНЕ этого набора. Карточка несёт
             одну строку (real), но у игрока их несколько — по строке на этап,
             и все они лежат полями _m1Playin/_m2GF и так далее. Складываем всё,
             что нашли: это и есть «сколько матчей он там отыграл». */
          var sum=0;
          Object.keys(p).forEach(function(k){
            var v=p[k];
            if(v && typeof v==='object' && typeof v.matches==='number') sum+=v.matches;
          });
          if(!sum && p.real && typeof p.real.matches==='number') sum=p.real.matches;
          mt[p.handle+'|'+p.region]=(mt[p.handle+'|'+p.region]||0)+sum;
        });
        (CARD_DUOS_BY_SET[set]||[]).forEach(function(d){
          var hs=d.handles||d;
          if(!hs.map) return;
          var key=hs.map(function(h){ return _gcNorm(h); }).sort().join('+');
          var hit={};
          hs.forEach(function(h){ (reg[h]||[]).forEach(function(r){ hit[r]=(hit[r]||0)+1; }); });
          Object.keys(hit).filter(function(r){ return hit[r]===hs.length; }).forEach(function(r){
            var id=key+'|'+set+'|'+r;
            if(seen[id]) return;
            seen[id]={key:key, set:set, reg:r,
                      matches:hs.reduce(function(s,h){ return s+(mt[h+'|'+r]||0); }, 0),
                      who:hs.map(function(h){ return h+' '+(rat[h+'|'+r]||'?'); }).join(' & ')};
          });
        });
      });
      var by={};
      Object.keys(seen).forEach(function(id){ var s=seen[id]; (by[s.key]=by[s.key]||[]).push(s); });
      Object.keys(by).forEach(function(k){
        var regs={};
        by[k].forEach(function(s){ regs[s.reg]=(regs[s.reg]||0)+s.matches; });
        if(Object.keys(regs).length<2) return;
        out.rows.push({circuit:circuit, key:k, regs:regs,
                       sets:by[k].map(function(s){ return {set:s.set, reg:s.reg, m:s.matches, who:s.who}; })});
      });
    });
  }catch(e){ out.err=String(e&&e.stack||e); }
  document.getElementById('__o').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pairreg-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g, '/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=300000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
if (!out.rows.length) { console.log('пар в двух регионах нет'); process.exit(0); }
out.rows.forEach(r => {
  const best = Object.keys(r.regs).sort((a, b) => r.regs[b] - r.regs[a]);
  console.log('');
  console.log(r.circuit + ' · ' + r.key);
  r.sets.forEach(s => console.log('   ' + s.set + ' ' + s.reg.padEnd(5) +
    String(s.m).padStart(4) + ' матчей   ' + s.who));
  console.log('   → оставлять ' + best[0] + ' (' + r.regs[best[0]] + ' матчей), убирать ' +
    best.slice(1).map(x => x + ' (' + r.regs[x] + ')').join(', '));
  /* ТЁЗКИ, а не смена региона: ключ пары нормализован (полноширинное «ǃ» и
     прочие знаки срезаются), поэтому «Sky & Scroll» из Европы и «skyǃ &
     scrollǃ» из США склеиваются в одну строку. Если написание ников в
     регионах разное — это разные люди, и убирать их нельзя. */
  const spells = [...new Set(r.sets.map(s => s.who.replace(/ [0-9]+/g, '')))];
  if (spells.length > 1)
    console.log('   ВНИМАНИЕ: написание ников разное — похоже на ТЁЗОК, а не на смену региона:');
  if (spells.length > 1) spells.forEach(x => console.log('      ' + x));
});
