// The snapshot ladder: Division 1 is one Major's Play-In, whole, and nothing
// real stands anywhere else.
//
// careerPools seats the current Major's Play-In set — 300 Europeans in exactly
// 150 real pairs — and that is the only rung with real names in it: the Last
// Chance and Reload sets were tried below it and taken out, because the people
// in them are the same competitive circle Division 1 is drawn from. This checks
// the seat counts, that the snapshot turns over with the Major, and that drawn
// fields hold no duplicate people and no real names below Division 1.
//
//   node tools/check-career-pools.js
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
  const fails = [], out = {fails: fails, snaps: {}};
  const check = (name, ok, detail) => { if(!ok) fails.push(name + (detail ? ': ' + detail : '')); };
  try {
  // Both snapshots, by forcing the career day to either side of Major 2's
  // Play-In weekend. CAREER is the page's own top-level binding, not a window
  // property, so it is assigned directly.
  CAREER = {player: {nick: 'ProbeMan', ovr: 68, region: 'EU'},
            career: {season: 1, day: '2026-01-15', division: 3}};
  ['2026-01-15', '2026-08-01'].forEach(day => {
    CAREER.career.day = day;
    CC_POOLS = null;
    const pools = careerPools();
    const tag = pools.tag;

    /* Every pair the year recorded at Division 1's band, nobody twice.

       His words, 17 August: Division 1 is all the name players we have. It was
       the Major Play-In's own field and nothing else - 152 duos - while the year
       holds 728 recorded European pairs across the other Major, the Reload
       circuit and the qualifiers. Those are names and they were outside the one
       division made of names.

       Still recorded pairs and not invented ones: a Division 1 duo is two people
       who actually played together, which anybody following this can check by
       looking. That is what caps the room rather than a number. */
    const keys = new Set(); let repeats = 0;
    pools.players.forEach(p => { if(keys.has(p._k)) repeats++; keys.add(p._k); });
    check(tag + ' nobody seated twice', repeats === 0, repeats + ' repeats');
    /* Дивизион — это те, кто в него квалифицировался, а не все, у кого
       рейтинг дорос. Его правило, 21 августа: Плей-Ин, Ласт Ченс и финалы
       недели самого дивизиона; пары, записанные где-то ещё за год, сюда больше
       не заходят. Комната от этого меньше и честнее. */
    check(tag + ' Division 1 is who qualified into it',
          pools.duos.length > 150, pools.duos.length);
    /* Контракт изменился 22 августа («расширь»): players — это пары плюс весь
       остальной ростер свободными агентами, чтобы третьим к реальной паре в
       трио-сезоне садился настоящий человек, а не выдуманный. Пары в players
       по-прежнему целиком, повторов по-прежнему ноль — это выше; здесь
       проверяется, что обе половины контракта на месте. */
    const inPlayers = new Set(pools.players.map(p => p._k));
    const halves = pools.duos.every(d => d.cards.every(c => inPlayers.has(c._k)));
    check(tag + ' every duo half is in players', halves, 'a duo half is missing');
    check(tag + ' plus the roster as free agents',
          pools.players.length > pools.duos.length * 2, pools.players.length);
    // The Play-In's own field is in it, because that is this month's Division 1.
    const playIn = new Set(ccPeopleOf(ccSnapshotNow().playIn).keys());
    let seatedPlayIn = 0;
    pools.players.forEach(p => { if (playIn.has(p._k)) seatedPlayIn++; });
    check(tag + ' seats the Play-In field itself', seatedPlayIn >= 290,
          seatedPlayIn + ' of ' + playIn.size);
    const avg = Math.round(pools.duos.reduce((s,d)=>s+d.avg, 0) / pools.duos.length * 10) / 10;
    out.snaps[tag] = {duos: pools.duos.length, avg: avg};
    check(tag + ' reads as Division 1', avg >= 76 && avg <= 82, avg);
  });

  // The two snapshots differ — the season turned over. Считается по парам
  // дивизиона, не по players: с 22 августа players держит весь ростер
  // свободными агентами, и он в обоих снимках один — а меняется именно
  // дивизион, то есть кто в записанных парах.
  const duoKeys = () => new Set(careerPools().duos.flatMap(d => d.cards.map(c => c._k)));
  CAREER.career.day = '2026-01-15'; CC_POOLS = null;
  const a = duoKeys();
  CAREER.career.day = '2026-08-01'; CC_POOLS = null;
  const b = duoKeys();
  let gone = 0; a.forEach(k => { if(!b.has(k)) gone++; });
  out.turnover = {m1: a.size, m2: b.size, gone: gone};
  // Fewer leave than when the room was one event, because most of the year's
  // pairs are in both snapshots - what turns over is the Play-In half of it.
  check('the snapshot turns over with the Major', gone > 20, gone + ' left Division 1');

  /* ---- and the half you did not take still plays ------------------------ */
  // His question, 17 August: if I take Malibuca as my duo, who does vic0 play
  // with? Nobody, and worse - measured, vic0 was not in Division 1 at all.
  // Seating happens by pair, his pair had a member taken, so the pair was
  // dropped and the room filled from the other two hundred and five. A 96
  // disappeared out of the division for a season because somebody took his
  // partner.
  CAREER = {player:{region:'EU'}, career:{season:1, day:'2026-02-10', division:1},
            partner:null};
  CC_POOLS = null;
  const mali = careerPools().players.find(p => /malibuca/i.test(p.handle));
  const vico = careerPools().players.find(p => /^vic0$/i.test(p.handle));
  if (!mali || !vico) fail('the pool has no Malibuca and vic0 to test with');
  const taken = new Set([mali._k]);
  const drawn = careerRealDuos(taken, careerRng(7), 1);
  const seatedVico = drawn.slice(0, 199).find(d => d.cards.some(c => c._k === vico._k));
  check('the half you did not take is still in the division', !!seatedVico,
        'vic0 vanished');
  if (seatedVico) {
    const other = seatedVico.cards.find(c => c._k !== vico._k);
    check('and their new partner is a real player', !!other && other.tier !== 'ladder',
          other && other.tier);
    check('and it is not the one who was taken', other._k !== mali._k, 'took them anyway');
    out.orphan = {vico: vico.handle, now: other && other.handle};
  }
  // Nobody is in two duos after the re-pairing either.
  const twice = {};
  let dupes = 0;
  drawn.forEach(d => d.cards.forEach(c => { if (twice[c._k]) dupes++; twice[c._k] = 1; }));
  check('and nobody ended up in two duos', dupes === 0, dupes + ' repeats');

  // A drawn field: Division 1 is all real and full, the divisions below hold
  // not one real name, and nobody is anywhere twice.
  const me = {handle: '__me', region: 'EU', nick: '__me'};
  [1, 2, 3, 4, 5].forEach(d => {
    CAREER.career.division = d;
    const teams = careerCupField(CAREER.career, [me], CAREER_CUP_FIELD, '', false);
    const seen = new Set(); let dup = 0, real = 0;
    teams.forEach(t => (t.squad || []).forEach(c => {
      const k = hKey(c); if(seen.has(k)) dup++; seen.add(k);
      // A pool card carries _k; a generated ladder player does not.
      if(c._k) real++;
    }));
    check('field D' + d + ' repeats nobody', dup === 0, dup + ' repeats');
    check('field D' + d + ' is full', teams.length === CAREER_CUP_FIELD - 1, teams.length);
    if(d === 1) check('field D1 is all real', real === (CAREER_CUP_FIELD - 1) * 2, real + ' real');
    else check('field D' + d + ' is all ladder', real === 0, real + ' real');
  });
  const openTeams = careerCupField(CAREER.career, [me], CAREER_CUP_FIELD, 'op', true);
  const okeys = new Set(); let odup = 0, oreal = 0;
  openTeams.forEach(t => (t.squad || []).forEach(c => {
    const k = hKey(c); if(okeys.has(k)) odup++; okeys.add(k);
    if(c._k) oreal++;
  }));
  check('open field repeats nobody', odup === 0, odup + ' repeats');
  // 149 teams besides your own, so 149 of the snapshot's 150 duos fit.
  check('an open seats the snapshot', oreal === (CAREER_CUP_FIELD - 1) * 2, oreal + ' real');
  } catch(e) { fails.push('threw: ' + (e && e.stack || e)); }

  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncspools-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=60000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
Object.keys(out.snaps).forEach(tag => {
  console.log(tag + ': ' + out.snaps[tag].duos + ' duos, avg ' + out.snaps[tag].avg);
});
console.log('turnover: ' + JSON.stringify(out.turnover));
if (out.fails.length) {
  console.error('FAIL');
  out.fails.forEach(f => console.error('  ' + f));
  process.exit(1);
}
console.log('OK');
fs.rmSync(dir, { recursive: true, force: true });
