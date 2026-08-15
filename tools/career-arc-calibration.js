// Career arc calibration: plays whole careers through the app's own cup, growth
// and promotion code and reports what a life in the mode actually looks like.
//
// The development numbers in careerDevelopBase are a tuning choice rather than a
// measurement, and they are aimed at one stated target: a teenager who starts in
// Division 5 and plays every cup reaches Division 1 in about four seasons. This
// is what checks whether that is true — and what it costs an older player, who
// should stall and then decline.
//
// Run: node tools/career-arc-calibration.js [careers] [seasons] [startAge]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CAREERS = parseInt(process.argv[2] || '12', 10);
const SEASONS = parseInt(process.argv[3] || '8', 10);
const AGES = (process.argv[4] || '15,22,29').split(',').map(Number);
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set the CHROME environment variable to chrome.exe');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {careers: ${CAREERS}, seasons: ${SEASONS}, ages: ${JSON.stringify(AGES)}, rows: [], cupsPerSeason: 0, error: null};
  try{
    CARD_MODE = true; squadSize = 2;
    // The weeks of the career year that hold a divisional cup, read off the
    // measured calendar rather than listed. A cup runs Monday and Tuesday and
    // those are two windows of one tournament, so this counts weeks: a career
    // plays one cup a week, the way it always has.
    const cupWeeks = [];
    for (let w = 1; w <= CAREER_WEEKS; w++) {
      let has = false;
      for (let d = 0; d < 7 && !has; d++)
        has = (careerYearDays().get(ccAddDays(careerWeekStart(w), d)) || [])
                .some(e => e.kind === 'cup');
      if (has) cupWeeks.push(w);
    }
    out.cupsPerSeason = cupWeeks.length * 2;   // two sessions a cup week

    for (const startAge of out.ages) {
      for (let c = 0; c < ${CAREERS}; c++) {
        CAREER = {
          player: {nick: 'ARC' + c, age: startAge, source: 'rookie', country: 'de',
                   countryPing: 15, closeRangeEdge: ccPingEdge(15), region: 'EU',
                   ovr: CC_DIV_RATING[5], role: 'roleIGL',
                   attrs: ccRookieAttrs(CC_DIV_RATING[5], 'roleIGL'),
                   ageEdge: ccAgeEdge(startAge), photo: null, handle: null},
          career: {season: 1, day: careerStartDay(), division: 5, earnings: 0, tokens: [], log: []},
          partner: null
        };
        const arc = {startAge: startAge, reachedD1: null, quits: 0, seasons: []};
        for (let s = 1; s <= ${SEASONS}; s++) {
          // The year, walked a day at a time, the way a career walks it. Cup
          // days play the cup; every other day is spent on the best training the
          // energy allows. That second half is why this loop exists: the arc was
          // being measured with no training at all, so every number tuned
          // against it was tuned against a career that never practised.
          CAREER.career.day = careerStartDay();
          CAREER.career.seasonOver = false;
          let dayGuard = 0;
          while (!CAREER.career.seasonOver && dayGuard++ < 400) {
            const today = CAREER.career.day;
            const onToday = careerEvents().get(today) || [];
            if (!onToday.some(e => e.kind === 'cup')) {
              // A day off, spent. Best rating per point of energy, which is what
              // a player optimising would do — the top of the range rather than
              // the middle of it, so the number that comes out is the fastest a
              // career can be rather than the average one.
              let spins = 0;
              while (careerEnergy() >= 1 && spins++ < 4) {
                const afford = CC_DAY_ACTS
                  .filter(a => a.energy <= careerEnergy() && Object.keys(a.gain || {}).length)
                  .map(a => ({a: a, per: ATTR_KEYS.reduce((t, k) => t + (a.gain[k] || 0) * ATTR_W[k], 0) / a.energy}))
                  .sort((x, y) => y.per - x.per);
                if (!afford.length || !careerDoAct(afford[0].a.id)) break;
              }
              careerAdvanceTo(ccAddDays(today, 1));
              continue;
            }
            // The partner persists and can walk out, exactly as in the hub:
            // careerEnsurePartner only assigns when there is nobody there, and
            // careerApplyMorale is what empties the seat.
            careerEnsurePartner();
            const me = careerCard(), mate = careerPartnerCard();
            const you = careerTeam([me, mate]);
            you.isYou = true; you.name = 'you';
            const field = [you].concat(careerCupField(CAREER.career, [me, mate]));
            await simulateGamesRandomLobbies(field, CAREER_CUP_GAMES, 50, pointsForPlace, 4);
            const ranked = field.slice().sort((a, b) => b.stagePts - a.stagePts || b.stageElims - a.stageElims);
            const place = ranked.indexOf(you) + 1;
            careerApplyGrowth(place, field.length, you, field);
            const mood = careerApplyMorale(place, field.length, place <= CAREER_CUP_CUT);
            if (mood && mood.left) arc.quits = (arc.quits || 0) + 1;
            if (place <= CAREER_CUP_CUT && CAREER.career.division > 1) CAREER.career.division--;
            if (CAREER.career.division === 1 && arc.reachedD1 === null) arc.reachedD1 = s;
            careerAdvanceTo(ccAddDays(today, 1));
          }
          arc.seasons.push({s: s, div: CAREER.career.division,
                            ovr: Math.round((CAREER.player.ovrExact || CAREER.player.ovr) * 10) / 10,
                            age: CAREER.player.age});
          CAREER.career.season++;
          CAREER.player.age++;
          CAREER.player.ageEdge = ccAgeEdge(CAREER.player.age);
        }
        arc.potential = CAREER.player.potential;
        arc.finalOvr = Math.round(CAREER.player.ovrExact || CAREER.player.ovr);
        out.rows.push(arc);
      }
    }
  } catch(e){ out.error = String(e && e.stack || e); }
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsarc-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, src + BOOT);

const dom = execFileSync(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
  '--virtual-time-budget=3600000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')
], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.error) { console.error(out.error); process.exit(1); }

const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
console.log(out.careers + ' careers per starting age, ' + out.seasons + ' seasons each, all starting in Division 5 at ' + 54);
AGES.forEach(age => {
  const rows = out.rows.filter(r => r.startAge === age);
  const got = rows.filter(r => r.reachedD1 != null);
  console.log('\nstart age ' + age + ':  reached Division 1: ' + got.length + '/' + rows.length +
    (got.length ? ', median season ' + got.map(r => r.reachedD1).sort((a, b) => a - b)[Math.floor(got.length / 2)] : ''));
  // The spread, not just the middle of it. "A player can reach Division 1 in a
  // season" is a claim about the fastest careers; "every player does" is a
  // different game, and a median cannot tell the two apart.
  const when = got.map(r => r.reachedD1).sort((a, b) => a - b);
  if (when.length) {
    const bucket = {};
    when.forEach(v => { bucket[v] = (bucket[v] || 0) + 1; });
    console.log('  arrived in season: ' +
      Object.keys(bucket).map(k => 's' + k + '×' + bucket[k]).join('  ') +
      '   (fastest s' + when[0] + ', slowest s' + when[when.length-1] + ')');
  }
  console.log('  season   age   mean OVR   mean division');
  for (let s = 1; s <= out.seasons; s++) {
    const at = rows.map(r => r.seasons[s - 1]).filter(Boolean);
    if (!at.length) continue;
    console.log('    ' + String(s).padStart(2) + '     ' + String(at[0].age).padStart(3) +
      String(mean(at.map(x => x.ovr)).toFixed(1)).padStart(11) +
      String(mean(at.map(x => x.div)).toFixed(2)).padStart(16));
  }
  // Per career-season, because that is the unit anybody thinks in: "how often
  // does my duo break up". The old line divided by a hard-coded eight cups a
  // season and printed a denominator that stopped being true the day the career
  // started running the measured year.
  const quits = rows.reduce((s, r) => s + r.quits, 0);
  const careerSeasons = rows.length * out.seasons;
  console.log('  partners walked out: ' + quits + ' across ' + careerSeasons +
    ' career-seasons (' + (quits / careerSeasons).toFixed(2) + ' a season) and ' +
    (careerSeasons * out.cupsPerSeason) + ' cup sessions');
  console.log('  ceilings drawn: ' + rows.map(r => r.potential).sort((a, b) => a - b).join(' '));
  console.log('  ended at:       ' + rows.map(r => r.finalOvr).sort((a, b) => a - b).join(' '));
});
fs.rmSync(dir, { recursive: true, force: true });
