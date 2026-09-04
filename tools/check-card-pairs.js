// Одна и та же ПАРА в двух регионах одного круга.
//
// Зачем отдельно от check-card-dupes.js: тот ловит совпадение НИКА, а ник —
// слабая улика, в базе 137 тёзок по-настоящему. Страна и орг тоже не улика:
// они лежат в картах по нику без региона, поэтому у тёзки читаются те же
// самые. А вот чтобы ОБА ника пары нашли себе тёзок и сели вместе — почти не
// бывает: такая строка значит, что это те же самые люди.
//
// Что с находкой делать — решает он. Внутри одного набора это всегда сбой
// леджера (в одном мейджоре человек играет один регион), между наборами —
// законная смена региона, и убирать её надо только по его слову. Убирается
// списком CARD_WRONG_REGION в index.html.
//
//   node tools/check-card-pairs.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set the CHROME environment variable');

const BOOT = [
'<pre id="__o" style="display:none"></pre>',
'<script>',
'(function(){',
'  var CIRCUITS = {"FNCS 2026": ["m1","m2"], "FNCS 2025": ["t1","t2","t3"],',
'                  "Reload": ["r1","r2","r3","r4"]};',
'  var out = {circuits: {}, err: null};',
'  try {',
'    Object.keys(CIRCUITS).forEach(function(name){',
'      var seen = {};',
'      CIRCUITS[name].forEach(function(set){',
'        var reg = {}, rat = {};',
'        cardRosterPlayers(set).forEach(function(p){',
'          (reg[p.handle] = reg[p.handle] || []).push(p.region);',
'          rat[p.handle + "|" + p.region] = p.rating;',
'        });',
'        (CARD_DUOS_BY_SET[set] || []).forEach(function(d){',
'          var hs = d.handles || d;',
'          if (!hs.map) return;',
'          var key = hs.map(function(h){ return _gcNorm(h); }).sort().join("+");',
'          // Регион пары — тот, где карточка есть у ВСЕХ её игроков.',
'          var hit = {};',
'          hs.forEach(function(h){ (reg[h] || []).forEach(function(r){ hit[r] = (hit[r]||0) + 1; }); });',
'          Object.keys(hit).filter(function(r){ return hit[r] === hs.length; }).forEach(function(r){',
'            var id = key + "|" + set + "|" + r;',
'            if (seen[id]) return;',
'            seen[id] = {key: key, set: set, reg: r,',
'                        who: hs.map(function(h){ return h + " " + (rat[h + "|" + r] || "?"); }).join(" & ")};',
'          });',
'        });',
'      });',
'      var by = {};',
'      Object.keys(seen).forEach(function(id){ var s = seen[id]; (by[s.key] = by[s.key] || []).push(s); });',
'      var rows = [];',
'      Object.keys(by).forEach(function(k){',
'        var regs = {};',
'        by[k].forEach(function(s){ regs[s.reg] = 1; });',
'        if (Object.keys(regs).length > 1) rows.push(by[k]);',
'      });',
'      out.circuits[name] = rows;',
'    });',
'  } catch (e) { out.err = String(e && e.stack || e); }',
'  document.getElementById("__o").textContent = "PBEGIN" + encodeURIComponent(JSON.stringify(out)) + "PEND";',
'})();',
'</script>'
].join('\n');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pairs-'));
process.on('exit', () => { try { fs.rmSync(dir, {recursive: true, force: true}); } catch (e) {} });
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
fs.writeFileSync(path.join(dir, 'p.html'), src.replace('</body>', BOOT + '</body>'));
['maps.js','zone-sim.js','zone-replay.js','mp.js'].forEach(f => {
  try { fs.copyFileSync(path.join(ROOT, f), path.join(dir, f)); } catch (e) {}
});
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=180000','--dump-dom',
  'file:///' + path.join(dir, 'p.html').split(path.sep).join('/')],
  {maxBuffer: 512*1024*1024, encoding: 'utf8', stdio: ['ignore','pipe','ignore']});
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }

let total = 0;
Object.keys(out.circuits).forEach(name => {
  const rows = out.circuits[name];
  total += rows.length;
  console.log('== ' + name + ' — пар в двух и более регионах: ' + rows.length);
  rows.forEach(g => {
    console.log('  ' + g[0].key);
    g.forEach(s => console.log('      ' + s.set + ' ' + s.reg + '   ' + s.who));
  });
});
console.log('');
console.log('всего: ' + total);
