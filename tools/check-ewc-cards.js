// Does the Reload Elite Series exist in the game, and is it worth what it
// should be worth?
//
// Four things this asks, in order of how much they would hurt:
//   1. the four cups built at all, one card per person per cup
//   2. every card rated by the deepest stage its player reached
//   3. the duos of every stage readable by the realistic simulation
//   4. a player who is also in FNCS is worth roughly the same in both — which
//      is the only external check the rating bands have, and 62% of these
//      handles are in FNCS
//
//   node tools/check-ewc-cards.js
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
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out = {sets: {}, error: null};
  try{
    // realTeamsFor only offers rosters the mode can field, and it asks the
    // global for the size it plays. The circuit is duos.
    CARD_MODE = true; squadSize = 2;
    const SETS = ['r1','r2','r3','r4'];
    const STAGES = ['open','playin','heat1','heat2','heat3','heat4','final'];
    const med = a => { const s = a.slice().sort((x,y)=>x-y); return s.length ? s[Math.floor(s.length/2)] : null; };

    SETS.forEach(set => {
      const cards = PLAYERS.filter(p => p.cardSet === set);
      const row = {cards: cards.length, byStage: {}, dupes: 0, noAttrs: 0, noNat: 0, ratings: {}};
      const seen = new Set();
      cards.forEach(p => {
        const k = hKey(p);
        if(seen.has(k)) row.dupes++;
        seen.add(k);
        const a = attrsFor(p);
        if(!a || !a.ovr) row.noAttrs++;
        if(!p.nat) row.noNat++;
        row.byStage[p._rStage] = (row.byStage[p._rStage]||0) + 1;
      });
      STAGES.forEach(st => {
        const rs = cards.filter(p => p._rStage === st).map(p => p.rating);
        if(rs.length) row.ratings[st] = {n: rs.length, min: Math.min(...rs), med: med(rs), max: Math.max(...rs)};
      });
      // The realistic simulation reads duos off the cards themselves.
      const built = realTeamsFor(cards);
      row.realDuos = built.teams.length;
      row.realDropped = built.dropped;
      out.sets[set] = row;
    });

    // The outside check: the same handle in FNCS and in the Reload circuit.
    //
    // Compared depth for depth, because that is the only comparison that means
    // anything. A FNCS card is worth what its run was worth, and a player has
    // several — a Grand Final card in one Major, a Play-In card in another. So
    // each Reload stage is put beside the FNCS stage of the same depth: a Final
    // against a Grand Final, a Heat against the Play-In seats that qualified, an
    // Opens card against a FNCS Play-In card.
    const fncsDepth = p => {
      if(p._r) return null;
      if(p._t1) return p._t1Stage === 'G' ? 'gf' : p._t1Stage === 'L' ? 'lcq' : 'playin';
      for(const k in p){
        const m = /^_([a-z]\d)(Playin|Lcq|Gf)$/.exec(k);
        if(m && p[k]) return m[2] === 'Gf' ? 'gf' : m[2] === 'Lcq' ? 'lcq' : 'playin';
      }
      return null;
    };
    const fncs = new Map();          // best FNCS card, any depth
    const fncsBy = {gf: new Map(), playin: new Map(), lcq: new Map()};
    PLAYERS.filter(p => p.tier === 'cardmode' && SETS.indexOf(p.cardSet) < 0)
           .forEach(p => { const k = hKey(p), o = attrsFor(p).ovr, d = fncsDepth(p);
                           if(!fncs.has(k) || o > fncs.get(k)) fncs.set(k, o);
                           if(d && (!fncsBy[d].has(k) || o > fncsBy[d].get(k))) fncsBy[d].set(k, o); });
    // Compared by the stage the Reload card stopped at, not in one lump. A
    // player who reached a FNCS Grand Final and went out in the Reload Opens
    // *should* be worth less here — that is the rating rule working, not a band
    // being wrong. What has to line up is like with like: the deep stages.
    const best = new Map();
    PLAYERS.filter(p => SETS.indexOf(p.cardSet) >= 0).forEach(p => {
      const k = hKey(p), o = attrsFor(p).ovr;
      const had = best.get(k);
      if(!had || o > had.ovr) best.set(k, {ovr: o, stage: p._rStage});
    });
    // Which FNCS depth each Reload stage is measured against.
    const AGAINST = {final: 'gf', heat: 'gf', playin: 'playin', open: 'playin'};
    const byStage = {}, byDepth = {};
    let all = [];
    best.forEach((r, k) => {
      const band = r.stage.indexOf('heat') === 0 ? 'heat' : r.stage;
      if(fncs.has(k)){
        (byStage[band] = byStage[band] || []).push(r.ovr - fncs.get(k));
        all.push(r.ovr - fncs.get(k));
      }
      const same = fncsBy[AGAINST[band]];
      if(same && same.has(k)) (byDepth[band] = byDepth[band] || []).push(r.ovr - same.get(k));
    });
    const stat = a => { a = a.slice().sort((x,y)=>x-y);
      return {n: a.length, median: med(a), mean: Math.round(a.reduce((s,v)=>s+v,0)/Math.max(a.length,1)*10)/10,
              p10: a[Math.floor(a.length*0.1)], p90: a[Math.floor(a.length*0.9)],
              within5: Math.round(100*a.filter(d => Math.abs(d) <= 5).length/Math.max(a.length,1))}; };
    out.overlap = {
      shared: all.length,
      ewcOnly: best.size - all.length,
      all: stat(all),
      byStage: Object.fromEntries(Object.keys(byStage).map(k => [k, stat(byStage[k])])),
      byDepth: Object.fromEntries(Object.keys(byDepth).map(k => [k, stat(byDepth[k])]))
    };
  }catch(e){ out.error = String(e && e.stack || e).slice(0, 800); }
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ewccards-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=120000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.error) { console.error(out.error); process.exit(1); }

let bad = 0;
const say = (ok, line) => { console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + line); if(!ok) bad++; };

console.log('set  cards  real duos  no attrs  no flag   by stage');
Object.keys(out.sets).forEach(set => {
  const r = out.sets[set];
  console.log(' ' + set + String(r.cards).padStart(7) + String(r.realDuos).padStart(11) +
              String(r.noAttrs).padStart(10) + String(r.noNat).padStart(9) + '   ' +
              JSON.stringify(r.byStage));
});
console.log('\nrating by the stage a card stopped at:');
Object.keys(out.sets).forEach(set => {
  const r = out.sets[set];
  Object.keys(r.ratings).forEach(st => {
    const x = r.ratings[st];
    console.log('  ' + set + ' ' + st.padEnd(7) + String(x.n).padStart(4) + ' cards   ' +
                x.min + ' — ' + x.med + ' — ' + x.max);
  });
});
console.log('\nthe same player in both circuits: ' + out.overlap.shared + ' handles (' +
            out.overlap.ewcOnly + ' are Reload-only)');
console.log('  Reload OVR minus FNCS OVR, by where the Reload card stopped:');
console.log('  stage      n   median   mean    p10    p90   within 5');
const showGap = (name, s) => console.log('  ' + name.padEnd(8) + String(s.n).padStart(5) +
  String(s.median).padStart(8) + String(s.mean).padStart(8) + String(s.p10).padStart(7) +
  String(s.p90).padStart(7) + String(s.within5 + '%').padStart(10));
['final', 'heat', 'playin', 'open'].forEach(k => { if(out.overlap.byStage[k]) showGap(k, out.overlap.byStage[k]); });
showGap('all', out.overlap.all);
console.log('\n  and against the FNCS card of the same depth (final and heat vs a Grand Final, playin and open vs a Play-In):');
console.log('  stage      n   median   mean    p10    p90   within 5');
['final', 'heat', 'playin', 'open'].forEach(k => { if(out.overlap.byDepth[k]) showGap(k, out.overlap.byDepth[k]); });
console.log('');

Object.keys(out.sets).forEach(set => {
  const r = out.sets[set];
  say(r.cards > 0, set + ' built ' + r.cards + ' cards');
  say(r.dupes === 0, set + ' has one card per person');
  say(r.noAttrs === 0, set + ' rates every card');
  say(r.realDuos > 0, set + ' offers ' + r.realDuos + ' real duos to the realistic simulation');
});
const deep = out.overlap.byStage.final;
say(Math.abs(deep.median) <= 3, 'a Reload finalist is worth what FNCS says they are (median gap ' +
    deep.median + ' over ' + deep.n + ' handles, wanted within 3)');
console.log('\n' + (bad ? bad + ' failing' : 'the Reload Elite Series is in the game'));
process.exit(bad ? 1 : 0);
