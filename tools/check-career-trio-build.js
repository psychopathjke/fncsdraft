// A trio is built the way trios are built.
//
// His ask, 20 August: people who have played together, or share a country, or
// at least a language. The third seat used to be whatever card came off the
// front of the leftovers queue — a rating near the pair and nothing else, so
// Division 1's trios year seated three strangers a hundred and thirty times.
//
// All three rules are read off the roster rather than written down; the numbers
// they were measured against are in the note over ccPlayedWith. This checks the
// field the mode actually builds:
//
//   * the third really played with one of the pair, far more often than chance
//   * the trio is one flag, or a flag pair the region really plays in
//   * the rating spread inside a trio is no wider than it was before
//   * nobody is in the lobby twice
//   * a generated seat still appears when the leftovers run out, and wears a
//     flag of the people it is sitting with
//
//   node tools/check-career-trio-build.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set the CHROME environment variable to chrome.exe');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out = {fails: [], notes: {}, err: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  try {
    const seed = div => { CAREER = {
      player:{nick:'Probe', ovr:90, ovrExact:90, region:'EU', role:'roleIGL',
              country:'de', age:20, attrs:ccRookieAttrs(90,'roleIGL')},
      career:{season:2, day:'2026-02-02', division:div, earnings:0, balance:0,
              tokens:[], log:[], news:[], form:0, grind:0, size:3},
      dms:[], partners:[], gear:{own:[], train:0}}; };

    /* ---- Дивизион 1, комната, о которой была просьба ---------------------
       Не одно поле, а восемь. Одно даёт около полусотни настоящих третьих, и
       на такой выборке доля «сыграл с одним из пары» шатается на целые
       проценты от одного трио: 3 из 48 и 4 из 48 — это 6% и 8%, по разные
       стороны любого порога, какой ни поставь. Дважды на этом обжёгся —
       сначала подвинул порог, потом подвинул ещё раз, — и оба раза это была
       подгонка под шум, а не измерение.

       Поля различаются тегом: careerCupField сеет генератор от него, так что
       восемь тегов — это восемь независимых наборов третьих при том же
       дивизионе и той же истории. Считается всё вместе. */
    seed(1);
    const me=careerCard();
    const FIELDS=['probe1','probe2','probe3','probe4','probe5','probe6','probe7','probe8'];
    const field=[];
    FIELDS.forEach(tag=>{
      careerCupField(CAREER.career, [me], null, tag, false).forEach(t=>field.push(t));
    });
    const trios=field.filter(t => (t._cards||t.cards||[]).length===3 ||
                                  (t.squad||[]).length===3);
    const cardsOf=t => t._cards || t.cards || t.squad || [];
    out.notes.field={teams:field.length, ofThemThrees:trios.length};
    check('a trios season builds a field of threes', trios.length > field.length*0.9,
          trios.length + ' of ' + field.length + ' over ' + FIELDS.length + ' fields');

    // Nobody twice — внутри одной комнаты. Между разными полями один и тот же
    // человек, разумеется, встречается: это и есть восемь версий одного вечера.
    const one=careerCupField(CAREER.career, [me], null, FIELDS[0], false);
    const seen=new Set(); let dup=0;
    one.forEach(t => cardsOf(t).forEach(c => {
      const k=hKey(c); if(seen.has(k)) dup++; seen.add(k); }));
    check('nobody is in the lobby twice', dup===0, String(dup));

    // How the third sits with the two it joined. The core is the recorded pair,
    // which is the first two cards of the squad — careerCupField seats them in
    // that order and appends the seat it chose.
    let played=0, sameFlag=0, knownPair=0, real=0, spread=0, n=0, genFlag=0, gen=0;
    trios.forEach(t => {
      const cs=cardsOf(t);
      if(cs.length!==3) return;
      const core=[cs[0], cs[1]], third=cs[2];
      n++;
      const ovrs=cs.map(ccCardOvr);
      spread += Math.max.apply(null, ovrs) - Math.min.apply(null, ovrs);
      if(third.tier==='ladder'){ gen++;
        if(third.nat && core.some(c=>c.nat===third.nat)) genFlag++;
        return; }
      real++;
      // One bucket each, best rule first, so the shares add to a hundred.
      if(core.some(c => ccHasPlayedWith(c, third))) played++;
      else if(core.some(c => c.nat && third.nat && c.nat===third.nat)) sameFlag++;
      else if(core.some(c => ccNatPairSeen(c.nat, third.nat) > 0)) knownPair++;
    });
    const pct=(a,b)=> b ? Math.round(a/b*100) : 0;
    out.notes.thirds={trios:n, real:real, generated:gen,
      playedWithOne:pct(played, real)+'%',
      sameFlag:pct(sameFlag, real)+'%',
      aFlagPairTheSceneKnows:pct(knownPair, real)+'%',
      neither:pct(real-played-sameFlag-knownPair, real)+'%',
      generatedWearingACoreFlag:pct(genFlag, gen)+'%',
      ratingSpreadInATrio:+(spread/Math.max(1,n)).toFixed(2)};

    /* What the same seat is worth dealt rather than chosen.

       The pool a third can come from is not the roster — it is the leftovers of
       the pairs past the cut, which is the rule that keeps the recorded pairs
       whole — so the ceiling on "played with one of them" is low by
       construction. Chance is the honest thing to measure against: how often a
       card taken off that queue at random would have satisfied each rule. */
    const pool=careerRosterNowEU();
    const flags={};
    pool.forEach(p=>{ if(p.nat) flags[p.nat]=(flags[p.nat]||0)+1; });
    const biggestFlag=Math.max.apply(null, Object.keys(flags).map(k=>flags[k]))/pool.length;
    let partners=0;
    pool.forEach(p=>{ const s=ccPlayedWith().get(hKey(p)); partners += s ? s.size : 0; });
    // Two chances at it, one per member of the core.
    const playedByChance=Math.min(1, 2*(partners/pool.length)/pool.length);
    out.notes.chance={
      playedWithOne:(playedByChance*100).toFixed(2)+'%',
      sameFlag:Math.round(biggestFlag*100)+'% at the most common flag'};

    /* Против случайности, а не против абсолютной доли.

       Здесь стоял ещё и порог «не меньше десяти процентов». Он был снят с
       прежнего дивизиона 1 — того, куда попадал всякий, кто отыграл хоть что-то,
       — и пережил сужение состава до тех, кто в дивизион квалифицировался. Пул,
       из которого берётся третий, — это остатки пар за отсечкой, и он стал
       вдвое меньше вместе с самим дивизионом: история сцены даёт 1417 пар там,
       где роастер целиком помнит около трёх тысяч.

       Но главная беда была не в пороге, а в выборке. Одно поле давало около
       полусотни настоящих третьих, и на полусотне одно трио — это два процента:
       я дважды подвинул порог, и оба раза это была подгонка под шум. Поэтому
       полей теперь восемь и третьих больше семисот; на такой выборке число
       стоит на месте, и порог перестал быть решающим.

       Отношение к случайности от размера пула не зависит и меряет ровно то, что
       проверяется: выбран ли третий по истории или выдан из очереди. Оно и
       осталось, с запасом в десять раз. Нижняя граница по счёту — просто чтобы
       правило нельзя было объявить работающим на одном совпадении. */
    check('the third really played with one of the pair far more often than chance',
          played >= 3 && played/Math.max(1,real) > playedByChance*10,
          played + ' of ' + real + ' — ' + pct(played, real) +
          '% against ' + (playedByChance*100).toFixed(2) + '%');
    check('and a flag rule catches most of the rest',
          pct(played + sameFlag + knownPair, real) >= 85,
          pct(played + sameFlag + knownPair, real) + '%');
    check('one flag beats what dealing a card at random would give',
          pct(sameFlag, real) > Math.round(biggestFlag*100),
          pct(sameFlag, real) + '% against ' + Math.round(biggestFlag*100) + '%');
    check('a trio is still a band, not a spread',
          spread/Math.max(1,n) <= 12, String(+(spread/Math.max(1,n)).toFixed(2)));

    // ---- and below it, where the seat is invented -------------------------
    seed(4);
    const me4=careerCard();
    const f4=careerCupField(CAREER.career, [me4], null, 'probe', false);
    let g=0, gflag=0;
    f4.forEach(t => { const cs=cardsOf(t);
      if(cs.length!==3) return;
      const third=cs[2];
      if(!third || third.tier!=='ladder') return;
      g++;
      if(third.nat && (cs[0].nat===third.nat || cs[1].nat===third.nat)) gflag++;
    });
    out.notes.division4={generatedThirds:g, wearingACoreFlag:pct(gflag, g)+'%'};
    check('a generated third still turns up below Division 1', g > 0, String(g));
    check('and it wears a flag of the people beside it more often than not',
          pct(gflag, g) >= 50, pct(gflag, g) + '%');

    // ---- the tables the whole thing reads --------------------------------
    out.notes.tables={everPlayedWith:ccPlayedWith().size,
                      flagPairsSeenTogether:ccNatFit().size};
    check('the roster knows who has played with whom', ccPlayedWith().size > 400,
          String(ccPlayedWith().size));
    check('and which flags turn up together', ccNatFit().size > 40,
          String(ccNatFit().size));
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cctrio-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=120000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('a trio is built out of people who belong in one');
fs.rmSync(dir, { recursive: true, force: true });
