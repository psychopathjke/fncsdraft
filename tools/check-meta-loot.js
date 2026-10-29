// Мета про по сезонам (CC_META_BY_SET): что в руках после сундуков и у ботов (ccLootPack) по островам.
// Сторож: на острове с метой метовый автомат и дробовик — в большинстве паков, сила пака (ccPackPow)
// от меты не падает (вытесненный ствол считается через dropped).
//
//   node tools/check-meta-loot.js
'use strict';

const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'].find(p => p && fs.existsSync(p));

const BOOTSTRAP = `
<pre id="__ml" style="display:none"></pre>
<script>
(function(){
  var out = {sets: []};
  try {
    Object.keys(CC_META_BY_SET).forEach(function(set){
      useLandingSet(set);
      var meta = CC_META_BY_SET[set], N = 300, chestMeta = 0, botMeta = 0, powOn = 0, powOff = 0, held = {};
      for (var i = 0; i < N; i++) {
        var rng = careerRng(ccHashStr('ml|' + set + '|' + i));
        var p = ccChestPack(rng, set, 4);
        var r = p.weapons.find(function(w){ return w.icon === 'rifle'; }), s = p.weapons.find(function(w){ return w.icon === 'shotgun'; });
        if ((r && meta.r.indexOf(r.name) >= 0) && (s && meta.s.indexOf(s.name) >= 0)) chestMeta++;
        p.weapons.forEach(function(w){ held[w.name] = (held[w.name] || 0) + 1; });
        powOn += ccPackPow(p);
        var save = CC_META_BY_SET[set]; CC_META_BY_SET[set] = null;
        powOff += ccPackPow(ccChestPack(careerRng(ccHashStr('ml|' + set + '|' + i)), set, 4));
        CC_META_BY_SET[set] = save;
        var b = ccLootPack(careerRng(ccHashStr('mb|' + set + '|' + i)), set);
        if (b.weapons.some(function(w){ return meta.r.indexOf(w.name) >= 0; }) && b.weapons.some(function(w){ return meta.s.indexOf(w.name) >= 0; })) botMeta++;
      }
      var top = Object.keys(held).sort(function(a, b){ return held[b] - held[a]; }).slice(0, 4).map(function(k){ return k + ' ' + Math.round(held[k] / N * 100) + '%'; });
      out.sets.push({set: set, chestMeta: chestMeta / N, botMeta: botMeta / N, powOn: powOn / N, powOff: powOff / N, top: top});
    });
  } catch (e) { out.error = String(e && e.stack || e); }
  document.getElementById('__ml').textContent = 'BEGINML' + encodeURIComponent(JSON.stringify(out)) + 'ENDML';
})();
<\/script>`;

const tmp = path.join(ROOT, '.probe-meta-loot.html');
fs.writeFileSync(tmp, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOTSTRAP);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
  '--virtual-time-budget=180000', '--dump-dom', 'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
fs.rmSync(tmp, { force: true });
const m = dom.match(/BEGINML([\s\S]*?)ENDML/);
if (!m) { console.error('проба не запустилась'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.error) { console.error(out.error); process.exit(2); }
let bad = 0;
for (const x of out.sets) {
  const ok = x.botMeta >= 0.99 && x.powOn >= x.powOff - 0.05;
  if (!ok) bad++;
  console.log((ok ? 'ok  ' : 'FAIL') + ' ' + x.set.padEnd(3) + ' сундуки: мета-пара ' + Math.round(x.chestMeta * 100) + '%  боты: ' +
    Math.round(x.botMeta * 100) + '%  сила ' + x.powOn.toFixed(2) + ' (без меты ' + x.powOff.toFixed(2) + ')  | ' + x.top.join(', '));
}
console.log(bad ? bad + ' провалов' : 'всё зелёное');
process.exit(bad ? 1 : 0);
