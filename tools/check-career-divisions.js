// Every rung, read the same way, twice over.
//
// Most of what has gone wrong in this mode went wrong on one rung and looked
// fine on the others: real names in Division 5, a generated 99 in a Division 5
// inbox, T1 offering $100 to a Division 3 career carrying a 96 card. All three
// are the same shape - a number read off the rung when it should have been read
// off the rating, or the other way about - and none of them shows up if you only
// ever look at the division you happen to be playing.
//
// So this walks 5 to 1 and prints the room: the cup, the inbox, the duo, the
// club and the wage. Twice: once for a career sitting at its own band, and once
// for a taken 96 card walking that rung, which is the case that breaks things.
//
//   node tools/check-career-divisions.js
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
  const out = {fails: [], rows: [], err: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  try {
    CARD_MODE = true; squadSize = 2;
    const rosterNames = new Set();
    careerRosterEU().forEach(p => rosterNames.add(String(p.handle||'').toLowerCase()));

    const seed = (div, ovr, taken) => {
      CAREER = {
        player: {nick:'Probe', age:17, source: taken?'card':'rookie', country:'de', countryPing:15,
                 region:'EU', ovr: ovr, ovrExact: ovr, role:'roleIGL',
                 attrs: ccRookieAttrs(ovr,'roleIGL'), photo:null,
                 handle: taken || null, cardRegion: taken?'EU':null, nat:null},
        career:{season:1, day:'2026-01-15', division:div, earnings:0, balance:0, reach:0,
                tokens:[], log:[], news:[], newsN:0, newsSeen:0},
        partner:null, gear:{own:[], train:0}, dms:[]};
      CH_DM = null; CH_SOCIAL = null;
    };
    const ovrOf = p => attrsFor(p).ovr;

    for (const div of [5,4,3,2,1]) {
      for (const mode of ['atBand', 'carrying96']) {
        const ovr = mode === 'atBand' ? CC_DIV_RATING[div] : 96;
        seed(div, ovr, null);
        const row = {div, mode, ovr, ceil: ccDivCeil(div)};

        // ---- the cup ------------------------------------------------------
        // Соперника больше нет — его слово, 23 августа. Поле меряется как
        // есть, без первой посадки.
        const me = careerCard(), mate = {...me, handle:'PROBE_MATE'};
        const field = careerCupField(CAREER.career, [me, mate], careerCupSize(div));
        const men = [];
        field.forEach(t => (t.squad||[]).forEach(p => men.push(p)));
        const gen = men.filter(p => p.tier === 'ladder');
        const real = men.filter(p => p.tier !== 'ladder');
        row.field = field.length;
        row.cut = careerCupCut(div);
        row.cupGenTop = gen.length ? Math.max.apply(null, gen.map(ovrOf)) : 0;
        row.cupReal = real.length;
        check('D' + div + '/' + mode + ': nothing generated in the cup goes over ' + CC_GEN_TOP,
              row.cupGenTop <= CC_GEN_TOP, String(row.cupGenTop));
        check('D' + div + '/' + mode + ': real cards only in Division 1',
              div === 1 ? real.length > 0 : real.length === 0, String(real.length));
        // And Division 1 is entirely real, rival and rival's partner included -
        // one generated card in that room is the whole complaint.
        if (div === 1)
          check('D1/' + mode + ': nothing generated in Division 1 at all',
                gen.length === 0, gen.slice(0,2).map(p => p.handle + ' ' + ovrOf(p)).join(','));
        const wearing = gen.filter(p => rosterNames.has(String(p.handle).toLowerCase()));
        check('D' + div + '/' + mode + ': no generated player wears a real name',
              wearing.length === 0, wearing.slice(0,2).map(p => p.handle).join(','));

        // ---- the inbox ----------------------------------------------------
        const pool = careerDmPool();
        row.pool = pool.length;
        row.poolTop = pool.length ? Math.max.apply(null, pool.map(w => w.ovr)) : 0;
        row.poolLow = pool.length ? Math.min.apply(null, pool.map(w => w.ovr)) : 0;
        row.poolReal = pool.filter(w => w.roster).length;
        check('D' + div + '/' + mode + ': the inbox offers a full list', pool.length === CAREER_DM_POOL,
              String(pool.length));
        check('D' + div + '/' + mode + ': the inbox is real only in Division 1',
              div === 1 ? row.poolReal === pool.length : row.poolReal === 0,
              row.poolReal + '/' + pool.length);
        if (div > 1)
          check('D' + div + '/' + mode + ': nobody in the inbox is over what the rung holds',
                row.poolTop <= ccDivCeil(div), row.poolTop + ' vs ' + ccDivCeil(div));
        // Somebody has to be able to say no, or the inbox is a vending machine.
        // Except where the career has outgrown the room, when nobody is above it.
        const refusers = pool.filter(w => !careerDmWouldAccept(w)).length;
        row.refusers = refusers;
        if (mode === 'atBand')
          check('D' + div + '/' + mode + ': somebody in the list would refuse you',
                refusers > 0, String(refusers));
        // Accepting has to leave a playable partner whichever kind they are.
        const t = careerDmThread(pool[0]);
        careerDmPush(t, 'them', 'dmNoPartner', [pool[0].ovr]);
        careerDmAccept(t.id);
        const got = careerPartnerCard();
        check('D' + div + '/' + mode + ': the duo taken out of the inbox exists', !!got,
              JSON.stringify(pool[0]).slice(0, 80));
        if (got) row.duo = ovrOf(got);

        // ---- the duo the mode hands you ------------------------------------
        CAREER.partner = null;
        (()=>{ if(careerPartnerCard()) return; careerSeatTopUp(); const s=careerDms().find(x=>x.state==='offer'&&!x.who.org&&!x.who.brand); if(s) careerDmAccept(s.id); })();
        const auto = careerPartnerCard();
        check('D' + div + '/' + mode + ': a partner is assigned', !!auto);
        if (auto) {
          row.autoDuo = ovrOf(auto);
          const autoReal = rosterNames.has(String(auto.handle).toLowerCase());
          check('D' + div + '/' + mode + ': the assigned partner is real only in Division 1',
                div === 1 ? autoReal : !autoReal, auto.handle + ' ' + row.autoDuo);
          if (div > 1)
            check('D' + div + '/' + mode + ': the assigned partner fits the rung',
                  row.autoDuo <= ccDivCeil(div), row.autoDuo + ' vs ' + ccDivCeil(div));
        }

        // ---- the club ------------------------------------------------------
        // Seeded inside a signing window, or nothing would arrive at all.
        const offers = careerOrgOffers();
        row.offers = offers.length;
        row.wage = offers.length ? Math.max.apply(null, offers.map(o => o.salary)) : 0;
        row.wageBand = ccWageDiv(ovr);
        // A wage is worth what the player is: a 96 is paid a 96's wage on any rung.
        if (mode === 'carrying96') {
          check('D' + div + '/carrying96: a 96 is offered a 96 wage',
                row.wage >= 5000, String(row.wage));
          check('D' + div + '/carrying96: and is offered anything at all',
                offers.length > 0, String(offers.length));
        }
        if (mode === 'atBand' && div >= 4)
          check('D' + div + '/atBand: nobody at a Division ' + div + ' standard is signed',
                offers.length === 0, String(offers.length));
        if (mode === 'atBand' && div <= 3)
          check('D' + div + '/atBand: a wage at the band is worth having',
                row.wage > 0, String(row.wage));
        // And the month is not a gate. His call, 17 August: leave it open, clubs
        // write all year, in Fortnite that is normal - and it is, this scene has
        // no registration deadline. A career used to sit four months unable to
        // move for a reason borrowed from football.
        if (mode === 'carrying96') {
          CAREER.career.day = '2026-03-10';
          CAREER.offers = [];
          const march = careerOrgOffers();
          check('D' + div + ': clubs sign in March too', march.length > 0, String(march.length));
          check('D' + div + ': and the window is never shut', careerWindowNow(),
                CAREER.career.day);
          CAREER.career.day = '2026-01-15';
        }
        out.rows.push(row);
      }
    }
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsdivs-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=300000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
const pad = (v, n) => String(v).padStart(n);
console.log('div  who          ovr  ceil   field/cut   cup: real  genTop   inbox: real top low no   duo  auto   offers  wage');
out.rows.forEach(r => {
  console.log(' ' + r.div + '   ' + String(r.mode).padEnd(12) + pad(r.ovr, 3) + pad(r.ceil, 6) +
    pad(r.field + '/' + r.cut, 12) + pad(r.cupReal, 11) + pad(r.cupGenTop, 8) +
    pad(r.poolReal, 12) + pad(r.poolTop, 4) + pad(r.poolLow, 4) + pad(r.refusers, 3) +
    pad(r.duo, 6) + pad(r.autoDuo, 6) + pad(r.offers, 9) + pad('$' + r.wage, 7));
});
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('every rung holds a room it could actually hold');
fs.rmSync(dir, { recursive: true, force: true });
