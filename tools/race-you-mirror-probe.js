// ЗЕРКАЛО ГОНКИ В ОДНОЙ ВКЛАДКЕ: одна и та же игра, сыгранная дважды, и вся
// разница между прогонами — КТО из двух людей «ты», а кто соперник.
//
// В гонке оба клиента считают одно лобби, но у каждого свой признак isYou.
// Годовая проба и его скрин 10.09 показывают расхождение при РАВНОМ числе
// бросков (z2=3665/108524 vs z2=3665/437179): значит движку дали одинаковые
// случайные числа и разные входные данные. Здесь это ловится в одном процессе:
// два прогона по одному сиду, книга бросков (ccMpMark) с отпечатком состояния,
// и на первой разошедшейся отметке — поля отрядов, которые не совпали.
//
//   node tools/race-you-mirror-probe.js
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
(async function(){
  const out = {fails: [], notes: {}, err: null};
  try {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'Alpha', age:19, source:'rookie', country:'de', countryPing:15, closeRangeEdge:0,
              region:'EU', ovr:92, role:'roleIGL', attrs:ccRookieAttrs(92,'roleIGL'), ageEdge:0,
              photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-07-24', division:1, earnings:0, balance:0, reach:9000,
              tokens:[], log:[], news:[], size:2},
      gear:{own:[], conf:0}, partners:[]
    }));
    careerLoad();
    CARD_MODE = true; squadSize = 2; skipAnimation = true; PLAY_SELF = true;
    const people = [...ccPeopleOf(ccSnapshotNow().playIn).values()].filter(c => c && c.handle);
    const pairs = [];
    for(let i=0; i+1<people.length && pairs.length<24; i+=2) pairs.push([people[i], people[i+1]]);
    out.notes.teams = pairs.length;

    const zones = ALL_LANDING_ZONES;
    const build = which => {
      const teams = pairs.map((p, i) => {
        const t = careerTeam(p.slice(), true);
        t._uid = i; t.name = 'T' + i;
        t.landingZone = zones[i % zones.length];
        return t;
      });
      teams[0].mpTag = ':aa'; teams[1].mpTag = ':bb';
      teams[which].isYou = true; teams[1 - which].isRival = true;
      return teams;
    };
    // Снимок отрядов на каждой отметке книги — по нему видно, ЧЕМ разошлось.
    const snapOf = g => (g && g.squads ? g.squads : []).map(s => ({
      a: s.alive ? 1 : 0, x: s.x, y: s.y, hp: s.hp, sh: s.shield, e: s.elims,
      d: s.dealt, tk: s.taken, sk: s.skill, se: s.seek, pw: s.power,
      lv: s.leaveAt, sp: s.speedMul, zr: s.zoneReached, dr: s.droppedOut ? 1 : 0,
      tg: s.target ? Math.round(s.target.x * 1000) + ':' + Math.round(s.target.y * 1000) : null
    }));
    const runs = [];
    for(const which of [0, 1]){
      ccMpSeedOn('mirror-seed-1');
      ccMpLedgerReset();
      const teams = build(which);
      const snaps = [];
      const real = window.ccMpMark;
      window.ccMpMark = function(name, tt){
        real(name, tt);
        snaps.push({name: name, at: CC_MP_LEDGER.length,
                    sq: (CC_MP_SIM && CC_MP_SIM.teams === tt) ? snapOf(CC_MP_SIM.game) : null});
      };
      let err = null;
      try {
        await playGameWithChoices(teams, {lobbySquads: teams.length, lobbyPlayers: teams.length * 2},
                                  {note: function(){}, show: null, map: null});
      } catch(e){ err = String(e && e.stack || e).slice(0, 300); }
      window.ccMpMark = real;
      runs.push({ledger: CC_MP_LEDGER.slice(), rolls: CC_MP_ROLLS, snaps: snaps, err: err});
      ccMpSeedOff();
    }
    out.notes.err = [runs[0].err, runs[1].err];
    out.notes.rolls = [runs[0].rolls, runs[1].rolls];
    out.notes.marks = [runs[0].ledger.length, runs[1].ledger.length];
    let at = -1;
    for(let i = 0; i < Math.max(runs[0].ledger.length, runs[1].ledger.length); i++){
      if(runs[0].ledger[i] !== runs[1].ledger[i]){ at = i; break; }
    }
    out.notes.first = at < 0 ? null : {i: at + 1, a: runs[0].ledger[at], b: runs[1].ledger[at],
                                       before: runs[0].ledger.slice(Math.max(0, at - 3), at)};
    const diffOf = (A, B) => {
      const list = [];
      if(A && B && A.sq && B.sq){
        for(let i = 0; i < A.sq.length; i++){
          const a = A.sq[i], b = B.sq[i]; if(!a || !b) continue;
          const bad = Object.keys(a).filter(k => String(a[k]) !== String(b[k]));
          if(bad.length) list.push({i: i, keys: bad.join(','),
            a: bad.slice(0,4).map(k => k + '=' + a[k]).join(' '),
            b: bad.slice(0,4).map(k => k + '=' + b[k]).join(' ')});
        }
      }
      return list;
    };
    if(at >= 0){
      const diffs = diffOf(runs[0].snaps.find(s => s.at === at + 1), runs[1].snaps.find(s => s.at === at + 1));
      out.notes.diffs = diffs.slice(0, 8); out.notes.diffN = diffs.length;
      const pa = runs[0].snaps.find(s => s.at === at), pb = runs[1].snaps.find(s => s.at === at);
      const pdiff = diffOf(pa, pb);
      out.notes.prevMark = pa ? pa.name : null;
      out.notes.prevDiffs = pdiff.slice(0, 8); out.notes.prevDiffN = pdiff.length;
      out.fails.push('вечера разошлись на отметке #' + (at + 1));
    } else {
      // Книга сошлась — но состояние могло разъехаться в том, чего в отпечатке нет.
      let deep = null;
      for(let k = 0; k < runs[0].snaps.length && !deep; k++){
        const d = diffOf(runs[0].snaps[k], runs[1].snaps[k]);
        if(d.length) deep = {mark: runs[0].snaps[k].name, at: runs[0].snaps[k].at, n: d.length, diffs: d.slice(0, 6)};
      }
      out.notes.deep = deep;
      if(deep) out.fails.push('отпечаток сошёлся, а состояние — нет, на отметке ' + deep.mark);
    }
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccmirror-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(String.fromCharCode(92)).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=180000', '--dump-dom',
  'file:///' + tmp.split(String.fromCharCode(92)).join('/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out.notes, null, 1));
if (out.err) { console.error('ERR: ' + out.err); process.exit(1); }
out.fails.forEach(f => console.log(' FAIL ' + f));
if (out.fails.length) process.exit(1);
console.log('игра одинакова у обоих: кто из двоих «ты» — движку всё равно');
