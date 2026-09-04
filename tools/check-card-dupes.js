// Один человек — один регион внутри круга.
//
// Жалоба игрока через него, 31 августа: «veno есть и на европе и на америке, но
// у него различается рейтинг и тиммейт, но один и тот же человек это». Карточки
// собираются из леджеров каждого этапа отдельно, и один ник, попавший в поле
// двух регионов, становится двумя разными людьми с разной силой и разными
// напарниками — в драфте по всем регионам они встречаются в одном лобби.
//
// Ник нормализуется так же, как это делает игра (_gcNorm): «venoǃ» с
// полноширинным восклицанием и «veno» иначе читались бы как двое.
//
// ОСТОРОЖНО: совпадение ника — ещё не один человек. В базе 137 ников заняты
// дважды по-настоящему (см. память про тёзок), поэтому проба ничего не чинит,
// а печатает список с рейтингами, странами и напарниками — решает он.
//
//   node tools/check-card-dupes.js            все круги
//   node tools/check-card-dupes.js m1 m2      только эти наборы
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

const ONLY = JSON.stringify(process.argv.slice(2));

const BOOT = [
'<pre id="__o" style="display:none"></pre>',
'<script>',
'(function(){',
'  var only = ' + ONLY + ';',
'  var out = {circuits: {}, err: null};',
'  // Круг — это набор карточек, которые играются одним составом подряд.',
'  var CIRCUITS = {"FNCS 2026": ["m1","m2"], "FNCS 2025": ["t1","t2","t3"],',
'                  "Reload": ["r1","r2","r3","r4"]};',
'  try {',
'    Object.keys(CIRCUITS).forEach(function(name){',
'      var sets = CIRCUITS[name].filter(function(s){ return !only.length || only.indexOf(s) >= 0; });',
'      if (!sets.length) return;',
'      var by = {};',
'      sets.forEach(function(set){',
'        cardRosterPlayers(set).forEach(function(p){',
'          var k = _gcNorm(p.handle);',
'          (by[k] = by[k] || []).push({set: set, handle: p.handle, region: p.region,',
'                                      rating: p.rating, nat: p.nat || null});',
'        });',
'      });',
'      var rows = [];',
'      Object.keys(by).forEach(function(k){',
'        var seen = {}, regions = [];',
'        by[k].forEach(function(c){ if (!seen[c.region]) { seen[c.region] = 1; regions.push(c.region); } });',
'        if (regions.length < 2) return;',
'        // Напарники по каждому набору — по ним видно, один это человек или тёзки.',
'        var mates = [];',
'        sets.forEach(function(set){',
'          (CARD_DUOS_BY_SET[set] || []).forEach(function(d){',
'            var hs = d.handles || d;',
'            if (!hs.some) return;',
'            if (!hs.some(function(h){ return _gcNorm(h) === k; })) return;',
'            var line = set + ": " + hs.join(" & ");',
'            if (mates.indexOf(line) < 0) mates.push(line);',
'          });',
'        });',
'        rows.push({key: k, regions: regions, cards: by[k], mates: mates});',
'      });',
'      out.circuits[name] = rows;',
'    });',
'  } catch (e) { out.err = String(e && e.stack || e); }',
'  document.getElementById("__o").textContent = "PBEGIN" + encodeURIComponent(JSON.stringify(out)) + "PEND";',
'})();',
'</script>'
].join('\n');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dupes-'));
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
  console.log('== ' + name + ' — ников в двух и более регионах: ' + rows.length);
  rows.forEach(r => {
    console.log('  ' + r.key + '  [' + r.regions.join(', ') + ']');
    r.cards.forEach(c => console.log('      ' + c.set + ' ' + c.region + ' ' + c.rating +
      '  «' + c.handle + '»' + (c.nat ? ' · ' + c.nat : '')));
    r.mates.forEach(x => console.log('      ' + x));
  });
});
console.log('');
console.log('всего: ' + total);
