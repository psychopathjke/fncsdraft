// Division 1's lobby is the real roster in its real pairs.
//
// The field used to be real cards paired by rating — real players, invented
// duos. This holds the mode to the stronger claim: every team in a Division 1
// cup is a duo that actually played a Major together, nobody is in the lobby
// twice, your own duo is not in it, and the divisions below are still the
// generated ladder they are supposed to be — the Last Chance and Reload pairs
// were tried down there and taken out, because those people are the same
// competitive circle Division 1 is drawn from.
//
//   node tools/check-career-field.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
// Division 1's band is 82, and the field it draws has read 82.5 since the cards
// below the Division 2 band were cut out of it. The window is the band either
// side of that: a Division 1 lobby that reads 79 is Division 2 wearing its name.
// Комната дивизиона 1 измеряется, а не задаётся: она собрана из тех, кто был
// в Плей-Ине или прошёл Ласт Ченс, и рейтинг в ней сезонный. Окно снято с неё
// и держит ccBand(1)=78 в середине. См. CC_DIV_RATING.
const CC1_MIN = 76, CC1_MAX = 82;
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
  const out = {weeks: [], error: null};
  try{
    CARD_MODE = true; squadSize = 2;
    // Every real pair the data knows, by the two hKeys it joins — off every
    // card, not one card per person: an entry lives on the card of the event
    // that recorded it, and a player's other cards do not carry it.
    const real = new Set();
    PLAYERS.forEach(p => { if((p.region||'')==='EU') rosterEntriesOf(p).forEach(({entry}) => {
      if(entry.duo.length === 2) real.add(entry.duo.map(h => hKey(h)).sort().join('|'));
    }); });
    out.realPairs = real.size;

    const mkPlayer = (ovr, nick) => ({handle: nick, nat: null, region: 'EU', org: null,
      tier: 'ranked', event: 'field check', placement: null,
      rating: ovr, _targetOvr: ovr, _attrs: ccRookieAttrs(ovr, 'roleIGL')});

    for(const div of [1, 2, 5]){
      for(let week = 1; week <= 4; week++){
        const me = mkPlayer(CC_DIV_RATING[div], 'CHK_YOU');
        const mate = mkPlayer(CC_DIV_RATING[div], 'CHK_MATE');
        mate._attrs = ccRookieAttrs(CC_DIV_RATING[div], 'roleFRG');
        // The day, not the week: careerSeed reads careerWeek(), which reads the
        // clock. A career carrying only a week number stands on 1 December
        // whatever the number says, so four weeks drew one lobby four times.
        CAREER = {player: {}, career: {season: 1, day: careerWeekStart(week),
                                       week: week, division: div}, partner: null};
        const teams = careerCupField(CAREER.career, [me, mate]);
        const row = {div: div, week: week, teams: teams.length, realDuos: 0, ladder: 0,
                     repeats: 0, mine: 0, ovrs: [], standing: 0};
        const seen = new Set();
        teams.forEach(t => {
          const keys = t.squad.map(p => hKey(p)).sort();
          if(real.has(keys.join('|'))) row.realDuos++;
          if(t.squad.some(p => p.tier === 'ladder')) row.ladder++;
          if(t.squad.some(p => p.handle.indexOf('CHK_') === 0)) row.mine++;
          if((t.syn.links || []).some(l => l.type === 'partner')) row.standing++;
          t.squad.forEach(p => {
            const k = hKey(p);
            if(seen.has(k)) row.repeats++;
            seen.add(k);
            row.ovrs.push(attrsFor(p).ovr);
          });
        });
        row.fieldOvr = Math.round(row.ovrs.reduce((s,v)=>s+v, 0) / row.ovrs.length * 10) / 10;
        delete row.ovrs;
        if(div === 1 && week === 1)
          out.sample = teams.slice(0, 8).map(t => t.squad.map(p => p.handle).join(' & '));
        out.weeks.push(row);
      }
    }
    // The same week twice is the same lobby; a different week is a different one.
    const fieldOf = week => {
      CAREER = {player: {}, career: {season: 1, day: careerWeekStart(week),
                                     week: week, division: 1}, partner: null};
      return careerCupField(CAREER.career, []).map(t => t.name).join(',');
    };
    out.stable = fieldOf(1) === fieldOf(1);
    out.varies = fieldOf(1) !== fieldOf(2);

    // One calendar week in the year holds two cup weeks: Divisions 2-5 play
    // 13-14 July and again 18-19 July, because Epic moved the second onto the
    // weekend of the Major Play-In. careerSeed keys on the calendar week, so the
    // second drew the first one's lobby until ccCupWeekSalt separated them —
    // and it has to separate only those two days, or every other lobby in every
    // existing save is redrawn as the price.
    const on = iso => { CAREER = {player: {}, career: {season: 1, day: iso, division: 5},
                                  partner: null}; return CAREER.career; };
    const cupDays = [];
    CC_CUP_WEEKS.forEach(r => { cupDays.push(r[1]); cupDays.push(r[2]); });
    out.salted = cupDays.filter(d => { on(d); return ccCupWeekSalt() !== ''; });
    const dayField = iso => {
      const cr = on(iso);
      return careerCupField(cr, [], null, ccCupWeekSalt()).map(t => t.name).join(',');
    };
    out.julyDiffers = dayField('2026-07-13') !== dayField('2026-07-18');
    out.julySessions = dayField('2026-07-13') === dayField('2026-07-14');
  } catch(e){ out.error = String(e && e.stack || e); }
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsfield-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=120000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.error) { console.error(out.error); process.exit(1); }

console.log('the roster holds ' + out.realPairs + ' real European pairs');
console.log('the top of one Division 1 lobby: ' + out.sample.join(', '));
console.log('div week teams  real duos  ladder teams  standing duos  repeats  you in it  field OVR');
out.weeks.forEach(r => {
  console.log('  ' + r.div + String(r.week).padStart(5) + String(r.teams).padStart(6) +
              String(r.realDuos).padStart(11) + String(r.ladder).padStart(14) +
              String(r.standing).padStart(15) + String(r.repeats).padStart(9) +
              String(r.mine).padStart(11) + String(r.fieldOvr).padStart(11));
});

let bad = 0;
const say = (ok, line) => { console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + line); if(!ok) bad++; };
const d1 = out.weeks.filter(r => r.div === 1);
const below = out.weeks.filter(r => r.div !== 1);
say(d1.every(r => r.teams === 149), 'a cup is 149 teams and your own');
say(d1.every(r => r.realDuos === r.teams), 'every Division 1 team is a duo that really played together');
say(d1.every(r => r.ladder === 0), 'no generated player reaches Division 1');
say(below.every(r => r.realDuos === 0 && r.ladder === r.teams), 'the divisions below are the generated ladder');
say(out.weeks.every(r => r.repeats === 0), 'nobody is in the lobby twice');
say(out.weeks.every(r => r.mine === 0), 'you and your partner are not in the field as well');
say(out.weeks.every(r => r.standing === r.teams), 'every duo in a career cup counts as a standing pair');
say(d1.every(r => r.fieldOvr >= CC1_MIN && r.fieldOvr <= CC1_MAX), 'Division 1 reads as Division 1 (OVR ' +
    d1.map(r => r.fieldOvr).join(', ') + ', wanted ' + CC1_MIN + '-' + CC1_MAX + ')');
say(out.stable, 'the same week is the same lobby');
say(out.varies, 'a different week is a different lobby');
say(out.salted.join() === '2026-07-18,2026-07-19',
    'only 18-19 July is seeded off its own cup week (' + (out.salted.join(', ') || 'nothing') + ')');
say(out.julyDiffers, 'the cup week of 18 July is not the lobby of 13 July');
say(out.julySessions, 'and Monday and Tuesday of one cup week are still one lobby');
console.log('\n' + (bad ? bad + ' failing' : 'Division 1 is the Play-In whole, and the divisions below are the ladder'));
process.exit(bad ? 1 : 0);
