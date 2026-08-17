// Ping and age, and who they belong to.
//
// The player who builds a player gets the advantage; real people on the roster
// do not need one. That distinction needs no gate — only a created card carries
// _ageEdge and _pingEdge, so a roster card reads undefined and adds nothing —
// and this is the check that it stays that way.
//
// The curves are the measured ones, and the sample rows written beside them are
// what this compares against: 13-20 is +4, 25 is +3, 30 is +2, 36 is -1.6, 40
// is -4, 41 is -5.2, 43 is -8.8, 45 is -14.9.
//
//   node tools/check-career-edges.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(path.sep).join('/');
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
  const out = {fails: [], notes: {}, err: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  try {
    // ---- the age curve is the one that was measured ----------------------
    const want = {13:4, 20:4, 25:3, 30:2, 36:-1.6, 40:-4, 41:-5.2, 43:-8.8, 45:-14.9};
    const got = {};
    Object.keys(want).forEach(a => { got[a] = ccAgeEdge(+a); });
    out.notes.age = got;
    Object.keys(want).forEach(a =>
      check('age ' + a + ' is worth ' + want[a], Math.abs(got[a]-want[a]) < 0.11,
            String(got[a])));
    check('and it never falls past the floor', ccAgeEdge(70) >= CC_AGE_FLOOR,
          String(ccAgeEdge(70)));
    check('an age nobody gave reads as nothing', ccAgeEdge(null) === 0 &&
          ccAgeEdge(undefined) === 0);

    // ---- ping ------------------------------------------------------------
    const ping = {0:CC_PING_EDGE, 25:CC_PING_EDGE, 95:0, 200:0};
    out.notes.ping = {at0: ccPingEdge(0), at25: ccPingEdge(25), at26: ccPingEdge(26),
                      at60: ccPingEdge(60), at95: ccPingEdge(95), at200: ccPingEdge(200)};
    Object.keys(ping).forEach(ms =>
      check('ping ' + ms + 'ms is worth ' + ping[ms],
            Math.abs(ccPingEdge(+ms)-ping[ms]) < 0.11, String(ccPingEdge(+ms))));
    check('a worse connection is never worth more than a better one',
          ccPingEdge(30) > ccPingEdge(60) && ccPingEdge(60) > ccPingEdge(90),
          [30,60,90].map(ccPingEdge).join(' > '));
    check('and no ping at all is nothing', ccPingEdge(null) === 0);

    // ---- and it is the player's alone ------------------------------------
    // A roster card has neither field, so a lobby full of them is unmoved.
    const roster = careerRosterNowEU();
    const carry = roster.filter(p => p._pingEdge || p._ageEdge);
    out.notes.rosterCarrying = carry.length;
    check('no real card carries an edge', carry.length === 0,
          carry.slice(0,3).map(p => p.handle).join(', '));
    check('a squad of real cards has no close-range edge',
          closeRangeEdge(roster.slice(0, 2)) === 0);
    check('and no age edge', ageEdgeOf(roster.slice(0, 2)) === 0);

    // The player's own card does carry them, off the save.
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'Probe', age:16, source:'rookie', country:'rs', countryPing:26,
              closeRangeEdge:0, region:'EU', ovr:70, role:'roleIGL',
              attrs:ccRookieAttrs(70,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-10', division:3, earnings:0, balance:0,
              reach:0, tokens:[], log:[], news:[]},
      partner:null
    }));
    careerLoad();
    const me = careerCard();
    out.notes.player = {age: CAREER.player.age, ping: CAREER.player.countryPing,
                        ageEdge: me._ageEdge, pingEdge: me._pingEdge};
    check('the created player carries an age edge', me._ageEdge > 0,
          String(me._ageEdge));
    check('and a ping edge for a good connection', me._pingEdge > 0,
          String(me._pingEdge));
    check('a sixteen-year-old is at the top of the age curve',
          me._ageEdge === ccAgeEdge(16), me._ageEdge + '/' + ccAgeEdge(16));
    check('and Serbia at 26ms is near the top of the ping one',
          me._pingEdge > CC_PING_EDGE*0.9, String(me._pingEdge));

    // The duo averages it: a real partner brings none, so the pair carries half.
    (()=>{ if(careerPartnerCard()) return; careerSeatTopUp(); const s=careerDms().find(x=>x.state==='offer'&&!x.who.org&&!x.who.brand); if(s) careerDmAccept(s.id); })();
    const mate = careerPartnerCard();
    const pair = closeRangeEdge([me, mate]);
    out.notes.duo = {solo: me._pingEdge, pair: pair, mate: mate && mate.handle};
    check('a duo carries the average, so a real partner halves it',
          Math.abs(pair - me._pingEdge/2) < 0.01, pair + ' vs ' + me._pingEdge/2);

    // ---- taking a real person does not give the roster an edge -----------
    // Taking Sky is playing Sky. He is a 96 because of what he did, and a
    // career that puts him on a Serbian connection at sixteen has not made
    // him better — it has chosen a flag and a number for somebody who
    // already has both. The edges belong to a player who was built.
    const sky = roster.find(p => p._ovr >= 90);
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:sky.handle, age:16, source:'card', country:'rs', countryPing:26,
              closeRangeEdge:0, region:'EU', ovr:sky._ovr, role:'roleIGL',
              attrs:null, ageEdge:0, photo:null,
              handle:sky.handle, cardRegion:sky.region, nat:sky.nat},
      career:{season:1, day:'2026-02-10', division:1, earnings:0, balance:0,
              reach:0, tokens:[], log:[], news:[]},
      partner:null
    }));
    careerLoad();
    const taken = careerCard();
    const inLobby = careerRosterNowEU().find(p => hKey(p) === hKey(sky.handle));
    out.notes.taken = {who: sky.handle,
                       asCareer: {age: taken._ageEdge, ping: taken._pingEdge},
                       inLobby: {age: inLobby._ageEdge||0, ping: inLobby._pingEdge||0}};
    check('a career played as a real person carries no edges either',
          !taken._ageEdge && !taken._pingEdge,
          JSON.stringify(out.notes.taken.asCareer));
    check('and the same person in a lobby carries none',
          !inLobby._ageEdge && !inLobby._pingEdge,
          JSON.stringify(out.notes.taken.inLobby));

    // An older player is worth less, which is the whole point of the curve.
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'Probe', age:16, source:'rookie', country:'rs', countryPing:26,
              closeRangeEdge:0, region:'EU', ovr:70, role:'roleIGL',
              attrs:ccRookieAttrs(70,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-10', division:3, earnings:0, balance:0,
              reach:0, tokens:[], log:[], news:[]},
      partner:null
    }));
    careerLoad();
    CAREER.player.age = 33;
    const older = careerCard();
    out.notes.older = older._ageEdge;
    check('thirty-three is worth less than sixteen', older._ageEdge < me._ageEdge,
          older._ageEdge + ' vs ' + me._ageEdge);
    check('and it is the curve, not a flag', older._ageEdge === ccAgeEdge(33),
          older._ageEdge + '/' + ccAgeEdge(33));

    // ---- and the box on the creation screen says their age -----------------
    // Sixteen is right for somebody being made up and wrong for somebody who
    // exists: the screen was offering a career as Th0masHD, born 2002, with a
    // 16 in the box beside his photograph.
    openCareerCreate();
    ccSetMode('card');
    const field = document.getElementById('ccAge');
    const cases = [];
    ['Th0masHD', 'Sky', 'Scroll'].forEach(h => {
      if (!careerRosterNowEU().some(p => p.handle === h)) return;
      ccPickCard(h);
      const born = ccBornOf(h);
      const want = ccAgeOn(born, careerStartDay());
      cases.push({h: h, born: born, shown: field.value, want: want});
      check('the creation screen gives ' + h + ' their real age',
            String(field.value) === String(want), field.value + ' vs ' + want);
    });
    out.notes.created = cases;
    check('a real birthday locks the field, because it is theirs',
          field.disabled === true);
    /* And where nobody knows, the player decides. Eighty-one of nine hundred
       have a published birthday; locking the rest at sixteen would be inventing
       the same fact the table refuses to invent, only silently and always the
       same number. */
    const unknown = careerRosterNowEU().find(p => !ccBornOf(p.handle));
    if (unknown) {
      ccPickCard(unknown.handle);
      check('a card with no birthday starts at sixteen',
            field.value === '16', unknown.handle + ' ' + field.value);
      check('and its box is open, because nobody knows',
            field.disabled === false, unknown.handle);
      // What is typed there is what the career starts on.
      field.value = '22';
      ccSync();
      ccStart(); careerLoad();
      out.notes.chosenAge = {who: unknown.handle, age: CAREER.player.age,
                             reads: ccPlayerAge()};
      check('and the age chosen is the age the career carries',
            CAREER.player.age === 22 && ccPlayerAge() === 22,
            CAREER.player.age + '/' + ccPlayerAge());
      openCareerCreate(); ccSetMode('card');
      ccPickCard('Th0masHD');
      check('while a known one still cannot be typed over',
            field.disabled === true && field.value === '23',
            field.disabled + '/' + field.value);
      /* And a taken card ages across seasons. The measured year is 2026 and a
         second career year is 2026 again, so the clock goes back to January
         every season: reading a birthday against it alone froze Sky at sixteen
         for a decade while a built player beside him turned twenty-one. */
      ccStart(); careerLoad();
      const yr1 = ccPlayerAge();
      CAREER.career.season = 4;
      out.notes.ages = {season1: yr1, season4: ccPlayerAge()};
      check('a taken card gets older as the seasons do',
            ccPlayerAge() === yr1 + 3, yr1 + ' -> ' + ccPlayerAge());
    }
    // ---- the jersey comes with the card ------------------------------------
    // Taking Sky is playing Sky, and Sky is on All Gamers: the roster has
    // carried the club all along and the career started him a free agent.
    const withOrg = careerRosterNowEU().find(p => p.org);
    if (withOrg) {
      ccPickCard(withOrg.handle);
      ccStart();
      careerLoad();
      out.notes.startedOn = CAREER.org && {club: CAREER.org.name, wage: CAREER.org.salary,
                                           academy: CAREER.org.academy};
      check('a card with a club starts on it', CAREER.org && CAREER.org.name === withOrg.org,
            withOrg.handle + ' / ' + withOrg.org + ' -> ' + (CAREER.org && CAREER.org.name));
      check('on the main roster, not the academy', CAREER.org && !CAREER.org.academy);
      check('with a wage the mode would pay', CAREER.org && CAREER.org.salary > 0,
            String(CAREER.org && CAREER.org.salary));
      check('and the club is in the career history',
            (CAREER.career.orgs||[]).indexOf(withOrg.org) >= 0,
            JSON.stringify(CAREER.career.orgs));
      check('and the tile does not say free agent',
            careerOrgTileHTML().indexOf(L().ccFreeAgent) < 0);
      // A card with no club still starts without one.
      openCareerCreate(); ccSetMode('card');
      const noOrg = careerRosterNowEU().find(p => !p.org);
      if (noOrg) {
        ccPickCard(noOrg.handle);
        ccStart(); careerLoad();
        check('and a card with no club starts with none', !CAREER.org,
              noOrg.handle + ' -> ' + (CAREER.org && CAREER.org.name));
      }
      openCareerCreate(); ccSetMode('card');
    }

    // ---- and a card can be taken from any region --------------------------
    // The map is European and a rookie chooses a country, so a built player
    // starts in Europe. A taken card wears the country on the card and carries
    // no ping edge at all, so there is nothing European about starting as one.
    ccSetMode('card');
    check('every region is open to a taken card',
          CC_REGIONS.every(r => ccRegionReady(r)), CC_REGIONS.join(','));
    const euCards = careerRosterNowEU().length;
    ccPickRegion('NAC');
    const naCards = careerRosterNowEU().length;
    out.notes.regions = {eu: euCards, nac: naCards};
    check('and the list is that region\\'s people', naCards > 100 && naCards !== euCards,
          euCards + ' -> ' + naCards);
    check('nobody European is in it',
          !careerRosterNowEU().some(p => (p.region||'') !== 'NAC'), 'mixed');
    check('and the card picked before does not follow', CC.card == null);

    // A rookie still chooses nothing, starts at sixteen, and starts in Europe.
    ccSetMode('rookie');
    check('a rookie starts at sixteen', field.value === '16', field.value);
    check('and a rookie can still type in the box', field.disabled === false);
    check('and a rookie is European, because the map is', CC.region === 'EU', CC.region);
    check('with the other regions closed to them',
          CC_REGIONS.filter(r => r !== 'EU').every(r => !ccRegionReady(r)), 'open');
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsedge-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=300000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('the country and the birthday count, and only for the player who chose them');
fs.rmSync(dir, { recursive: true, force: true });
