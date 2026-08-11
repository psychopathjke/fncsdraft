// A heal pack deals consumables, and a weapon pack deals weapons.
//
// It did not: the three 2025 season pools had that season's mythic guns written
// into the consumable list — Enhanced Spire Rifle and Kor's Deadeye DMR in Major
// 3, seven of them in Major 2, five in Major 1 — so the pack that says "pick a
// consumable" was dealing rifles. A player reported it.
//
// The weapon pools are generated, every gun across all six rarities, so the
// mythics were already there; the consumable copies were duplicates in the wrong
// list rather than data that had nowhere else to live.
//
//   node tools/check-loot-packs.js
'use strict';

const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOTSTRAP = `
<pre id="__lp2" style="display:none"></pre>
<script>
(function(){
  var out = {checks: [], sets: []};
  var check = function(name, pass, detail){ out.checks.push({name: name, pass: !!pass, detail: detail}); };
  var GUN = ['rifle','shotgun','smg','pistol'];
  try {
    ['t1','t2','t3','m1','m2'].forEach(function(set){
      CARD_MODE = true; CARD_SET = set; squadSize = set[0]==='t' ? 3 : 2;
      useLandingSet(set);
      var N = 300, gunsInHeals = 0, dupHeal = 0, dupWeapon = 0, healNames = {}, weaponNames = {};
      var offenders = {};
      for (var i = 0; i < N; i++) {
        var h = generateHealPack(), w = generateWeaponPack();
        var hn = h.map(function(x){ return x.name; }), wn = w.map(function(x){ return x.name; });
        if (new Set(hn).size !== hn.length) dupHeal++;
        if (new Set(wn).size !== wn.length) dupWeapon++;
        h.forEach(function(x){
          healNames[x.name] = 1;
          if (GUN.indexOf(x.icon) >= 0) { gunsInHeals++; offenders[x.name] = 1; }
        });
        w.forEach(function(x){ weaponNames[x.name] = 1; });
      }
      out.sets.push({set: set, heals: Object.keys(healNames).length,
        weapons: Object.keys(weaponNames).length, guns: gunsInHeals});

      check(set + ': the heal pack deals no weapons',
        gunsInHeals === 0, 'dealt ' + gunsInHeals + ' — ' + Object.keys(offenders).join(', '));
      // A pack of four identical cards is not a choice. samplePack dedupes by
      // name and only repeats when a pool holds fewer than four distinct ones.
      check(set + ': no pack repeats an item',
        dupHeal === 0 && dupWeapon === 0,
        dupHeal + ' heal packs and ' + dupWeapon + ' weapon packs had a repeat');
      check(set + ': both pools are deep enough to offer a choice',
        Object.keys(healNames).length >= 8 && Object.keys(weaponNames).length >= 6,
        Object.keys(healNames).length + ' heals, ' + Object.keys(weaponNames).length + ' weapons');
    });
  } catch (e) { out.error = String(e && e.stack || e); }
  document.getElementById('__lp2').textContent =
    'BEGINLP2' + encodeURIComponent(JSON.stringify(out)) + 'ENDLP2';
})();
<\/script>`;

const tmp = path.join(ROOT, '.probe-loot-packs.html');
fs.writeFileSync(tmp, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOTSTRAP);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=180000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
fs.rmSync(tmp, { force: true });
const m = dom.match(/BEGINLP2([\s\S]*?)ENDLP2/);
if (!m) { console.error('probe did not run'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.error) { console.error(out.error); process.exit(2); }

out.sets.forEach(s => console.log(s.set + ': ' + s.heals + ' distinct heals, ' + s.weapons +
  ' distinct weapons, ' + s.guns + ' weapons dealt into heal packs'));
let bad = 0;
console.log('');
out.checks.forEach(c => {
  if (!c.pass) bad++;
  console.log((c.pass ? '  ok   ' : '  FAIL ') + c.name);
  if (!c.pass) console.log('         ' + c.detail);
});
console.log('\n' + out.checks.length + ' checks, ' + bad + ' failing');
process.exit(bad ? 1 : 0);
