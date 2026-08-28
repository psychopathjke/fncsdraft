// Moving: the one upgrade in the shop that is not a thing on a desk.
//
// A career decides its country once, on the creation screen, and then sits on
// that ping for twenty years. This checks the way out of it: the map, the rent,
// the rating the shorter distance is actually worth, the month it stops being
// affordable — and the two things a move must never touch, the flag and the
// nationality.
//
//   node tools/check-career-move.js
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
  const out = {fails: [], notes: {}, err: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  try {
    // A built player, from Georgia, which is the case this whole feature is for:
    // 82ms to Frankfurt and nothing about it that practice can fix.
    const fresh = (money, country, taken) => {
      const ping = ccPingOf(country);
      CAREER = {player: {nick:'Probe', ovr:82, region:'EU', country, countryPing:ping,
                         age:16, role:'roleIGL', attrs:ccRookieAttrs(82,'roleIGL'),
                         source: taken ? 'card' : 'rookie', handle: taken || null},
        career: {season:1, day:'2026-02-10', division:1, balance:money, earnings:money,
                 log:[], news:[]}, partners:[], gear:{own:[], train:0}};
      CH_MOVE = false; CH_MOVE_PICK = null;
    };

    // Every country the map can be clicked on has a rent, or the panel under it
    // would price a move at nothing.
    fresh(0, 'ge');
    const noRent = CC_COUNTRIES.filter(e => !(ccRentOf(e.c) > 0)).map(e => e.c);
    check('every country on the map has a rent', noRent.length === 0, noRent.join(','));
    out.notes.countries = CC_COUNTRIES.length;
    out.notes.rentRange = Math.min.apply(null, CC_COUNTRIES.map(e => ccRentOf(e.c))) + '-' +
                          Math.max.apply(null, CC_COUNTRIES.map(e => ccRentOf(e.c)));

    // At home nobody pays anything, and the ping is the country's own.
    check('home pays no rent', ccRentNow() === 0, String(ccRentNow()));
    check('home is where the ping is read', ccPingNow() === ccPingOf('ge'), String(ccPingNow()));

    // What the move is worth, in the points the card prints.
    fresh(50000, 'ge');
    const before = careerCard()._pingEdge;
    const gain = ccMoveGain('de');
    check('Georgia to Germany is worth the whole edge', Math.abs(gain - (CC_PING_EDGE - before)) < 0.05,
          String(gain) + ' vs ' + String(CC_PING_EDGE - before));
    const balBefore = CAREER.career.balance;
    check('the move goes through', careerMoveTo('de') === true);
    out.notes.moved = {from:'ge', to:'de', gain, edge:careerCard()._pingEdge};
    // Read off the table rather than written down: the milliseconds are measured
    // now and a hand-typed 1 was Germany before anybody had measured it.
    check('the connection is the one moved to', ccPingNow() === ccPingOf('de'),
          ccPingNow() + ' vs ' + ccPingOf('de'));
    check('and the card reads it', Math.abs(careerCard()._pingEdge - CC_PING_EDGE) < 0.05,
          String(careerCard()._pingEdge));
    check('the first month is paid on the way in',
          balBefore - CAREER.career.balance === ccRentOf('de'),
          String(balBefore - CAREER.career.balance));

    // The two things a move must never touch.
    check('the passport does not move', CAREER.player.country === 'ge', String(CAREER.player.country));
    check('and neither does the flag on the card',
          careerCard().nat === CC_NAT_BY_CODE['ge'], String(careerCard().nat));

    // Going home is free, always allowed, and puts the ping back.
    check('going home goes through', careerMoveTo('ge') === true);
    check('and costs nothing', CAREER.career.balance === balBefore - ccRentOf('de'),
          String(CAREER.career.balance));
    check('home clears the lease', CAREER.player.livesIn == null, String(CAREER.player.livesIn));
    check('and the ping is back', ccPingNow() === ccPingOf('ge'), String(ccPingNow()));

    // A career that cannot cover the first month cannot move.
    fresh(100, 'ge');
    check('a thin balance cannot sign a lease', careerMoveTo('de') === false);
    check('and stays where it was', CAREER.player.livesIn == null);

    // The payday charges the rent, on the same day the wages land.
    fresh(50000, 'ge');
    careerMoveTo('de');
    const afterMove = CAREER.career.balance;
    careerPayWages('2026-02-10', '2026-03-05');   // crosses one 1st
    out.notes.payday = afterMove - CAREER.career.balance;
    check('a payday charges one month of rent',
          afterMove - CAREER.career.balance === ccRentOf('de'),
          String(afterMove - CAREER.career.balance));
    check('and the total is kept', CAREER.career.rent === ccRentOf('de') * 2,
          String(CAREER.career.rent));

    // A month that cannot be covered ends the lease rather than running a debt.
    CAREER.career.balance = 10;
    careerPayWages('2026-03-05', '2026-04-05');
    check('an unpayable month sends the player home', CAREER.player.livesIn == null,
          String(CAREER.player.livesIn));
    check('and no debt is left behind', CAREER.career.balance === 10,
          String(CAREER.career.balance));
    check('and the feed says so',
          (CAREER.career.news || []).some(n => n.k === 'ccNewsRentGone'));

    // The screen. The tile is only for the career the edge exists for.
    fresh(50000, 'ge');
    const tile = careerMoveHTML();
    check('the tile is drawn for a built player', /cc-move/.test(tile));
    check('and it says what the connection is worth',
          tile.indexOf(ccPingOf('ge') + ' ms') >= 0, ccPingOf('ge') + ' ms');
    CH_MOVE = true;
    const withMap = careerMoveHTML();
    const shapes = (withMap.match(/class="cc-mp"/g) || []).length;
    out.notes.mapShapes = shapes;
    check('the map opens with every country on it', shapes >= CC_COUNTRIES.length - 2,
          shapes + ' of ' + CC_COUNTRIES.length);
    check('and it is the move handler on it, not the creation screen\\'s',
          /ccMoveMapClick/.test(withMap) && !/ccMapClick/.test(withMap));
    CH_MOVE_PICK = 'rs';
    const picked = careerMoveHTML();
    check('picking a country prices it', picked.indexOf('$' + ccRentOf('rs').toLocaleString('en-US')) >= 0);
    check('and says what it is worth', /cc-move-pick/.test(picked));

    // A click repaints and does not rebuild. The map is 45 flags fetched over
    // the network: re-rendering the tab under it blanked the map and put the
    // panel below nine hundred pixels of it, which read as a dead map.
    CH_MOVE_PICK = null;
    show('screen-career-hub');
    CH_MOVE = true;
    careerRenderHub('shop');
    const body = document.getElementById('chBody');
    const svgBefore = body.querySelector('.cc-map');
    const de = body.querySelector('[data-code="de"]');
    check('the map is in the document', !!svgBefore && !!de);
    if (de) {
      de.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      check('the click lands', CH_MOVE_PICK === 'de', String(CH_MOVE_PICK));
      check('the same map is still standing', body.querySelector('.cc-map') === svgBefore);
      check('the country clicked is outlined', de.classList.contains('on'));
      check('and where the career lives still is',
            body.querySelector('[data-code="ge"]').classList.contains('cc-here'));
      const panel = document.getElementById('ccMovePanel');
      check('the panel answered', !!panel && /cc-move-pick/.test(panel.innerHTML));
      check('and it answered about the country clicked',
            panel.innerHTML.indexOf(ccCountryName('de')) >= 0);
      // Sticky is what keeps that answer on screen, and a clipping ancestor is
      // what would quietly kill it.
      check('the panel is sticky', getComputedStyle(panel).position === 'sticky',
            getComputedStyle(panel).position);
      const tile = panel.closest('.cc-move');
      check('and nothing clips it', getComputedStyle(tile).overflow === 'visible',
            getComputedStyle(tile).overflow);
      out.notes.mapHeight = Math.round(svgBefore.getBoundingClientRect().height);
    }

    // ---- and the other continents -----------------------------------------
    // A region move is the only thing in this mode that takes something away,
    // so what it takes has to actually go.
    fresh(50000, 'ge');
    CAREER.partners = [{card:{handle:'GONE', region:'EU', rating:60, _targetOvr:60}, patience:60}];
    CAREER.org = {name:'Probe Esports', salary:100, goal:{type:'cut'}, tier:70, paid:0};
    CAREER.career.rival = {season:1, div:1, card:{handle:'RIV'}, mate:{handle:'RIV2'}};
    const euRoster = careerRosterNowEU().length;
    const balBefore2 = CAREER.career.balance;
    check('moving to another region goes through', careerMoveRegion('NAC') === true);
    out.notes.region = {roster:{eu:euRoster, nac:careerRosterNowEU().length},
                        rent:ccRentNow(), ping:ccPingNow()};
    check('the career competes in the new region', CAREER.player.region === 'NAC',
          String(CAREER.player.region));
    check('and the roster it plays is that region\\'s',
          careerRosterNowEU().length > 100 && careerRosterNowEU().length !== euRoster,
          euRoster + ' -> ' + careerRosterNowEU().length);
    check('nobody from the old region is in it',
          !careerRosterNowEU().some(p => (p.region||'') !== 'NAC'), 'mixed roster');
    check('the duo does not come', careerMateRec() == null);
    check('the club does not come', CAREER.org == null);
    check('the rival does not come', CAREER.career.rival == null);
    check('the first month is paid', balBefore2 - CAREER.career.balance === 1500,
          String(balBefore2 - CAREER.career.balance));
    check('and the rent is the region\\'s from now on', ccRentNow() === 1500, String(ccRentNow()));
    check('living where you play is a local connection', ccPingNow() === CC_PING_HOME,
          String(ccPingNow()));
    check('the clubs are that region\\'s too', careerOrgPool().length > 0,
          String(careerOrgPool().length));
    // And it is not the cheap way to buy a connection: Germany is $1,000 for the
    // same edge and keeps the roster you know.
    check('a region is never cheaper than moving inside Europe',
          Math.min.apply(null, Object.keys(CC_REGION_RENT).map(r => CC_REGION_RENT[r])) >= 400,
          'region rents');
    // Going back is going home, and free.
    check('going back to Europe goes through', careerMoveRegion('EU') === true);
    check('and the roster is Europe again', careerRosterNowEU().length === euRoster,
          careerRosterNowEU().length + ' vs ' + euRoster);

    /* Starting there is not moving there.

       A player's report, 19 August: start a career on a region other than Europe
       and it drags you back, on two saves and two regions, around the end of
       January. That is the rent. ccRentNow charged CC_REGION_RENT to anybody
       whose region was not Europe, which is right for somebody who flew out and
       is paying to live there, and wrong for somebody who was always there:
       nobody in NA Central is renting a flat abroad by being in NA Central. A new
       career has no money on 5 January, the first wage day is 1 February, and it
       was evicted on that morning — losing its duo, its club and its rival with
       the region. */
    fresh(0, 'us');
    CAREER.player.region = 'NAC';
    CAREER.player.homeRegion = 'NAC';
    CAREER.career.day = careerStartDay();
    check('living where you are from costs nothing', ccRentNow() === 0,
          String(ccRentNow()));
    for (var d = careerToday(); d <= '2026-02-05'; d = ccAddDays(d, 1)) careerAdvanceTo(d);
    check('and a broke career that started abroad is not sent home',
          CAREER.player.region === 'NAC', String(CAREER.player.region));

    // Moving away from home still costs, and still evicts when it cannot be paid.
    fresh(50000, 'us');
    CAREER.player.region = 'NAC';
    CAREER.player.homeRegion = 'NAC';
    check('moving on from home goes through', careerMoveRegion('OCE') === true);
    check('and that one is rented', ccRentNow() === CC_REGION_RENT.OCE, String(ccRentNow()));
    CAREER.career.balance = 0;
    careerMoveEvict();
    check('an eviction goes home, not to Europe by default',
          CAREER.player.region === 'NAC', String(CAREER.player.region));

    /* A taken card may move now too.

       It used to be told why it could not: careerCard gave it no ping edge, so
       there was no flight worth selling — and the result read as a hole, since
       the same card could cross to Oceania but not go from France to Germany.
       His rule, 21 August: give it the possibility, and pay it for the move
       rather than for where it happens to have been born. So the whole tile is
       on offer, the country map with it, and the edge on the card is the
       difference the move made — nothing at all while it stays home. */
    fresh(50000, 'ge', 'Sky');
    var takenTile = careerMoveHTML();
    check('a taken card is offered the move', takenTile !== '');
    check('and the way into the country map with it',
          takenTile.indexOf('careerMoveOpen') >= 0);
    check('at home its card is paid nothing for living there',
          (careerCard()._pingEdge || 0) === 0, String(careerCard()._pingEdge));
    check('and it can move inside its own region', careerMoveTo('de') === true);
    var movedEdge = careerCard()._pingEdge;
    check('and the move is what the card is paid for', movedEdge > 0, String(movedEdge));
    check('and it is the difference, not the whole connection',
          Math.abs(movedEdge - (ccPingEdge(ccPingOf('de')) - ccPingEdge(ccPingOf('ge')))) < 0.15,
          String(movedEdge));
    // Nothing about the ocean changed with it: the regions are still on offer
    // under the same button, and the crossing still goes through.
    CH_MOVE = true;
    check('and is offered the regions',
          careerMoveHTML().indexOf('careerMoveShowRegion') >= 0);
    CH_MOVE_REG = 'OCE';
    /* Кнопка зовётся careerMoveAsk, а не careerMoveRegion.
       Переезд БЕЗ команды сжигает место на ЛАНе, и с 26 августа он сначала
       спрашивает об этом (см. ccSlotAsk и check-career-slot-warn.js). Сам
       переезд по-прежнему делает careerMoveRegion — просто уже после «да».
       Отъезд ВМЕСТЕ место сохраняет и потому спрашивает по-прежнему ничего. */
    check('and picking one gives it the button that goes',
          careerMoveHTML().indexOf('careerMoveAsk') >= 0 ||
          careerMoveHTML().indexOf('careerMoveRegion') >= 0);
    CH_MOVE_REG = null; CH_MOVE = false;
    const wasRegion = ccCareerRegion();
    check('and it can actually cross', careerMoveRegion('NAC') === true);
    check('and the region really changed', ccCareerRegion() === 'NAC',
          wasRegion + ' -> ' + ccCareerRegion());
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
// Inside the project: the page loads maps.js by a relative path now.
// Во временную папку системы и с уборкой на любом выходе — см. разбор в
// check-career-edges.js.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'probe-move-'));
process.on('exit', () => { try{ fs.rmSync(dir, {recursive:true, force:true}); }catch(e){} });
const tmp = path.join(dir, 'index.html');
// The maps load on demand on the site; a probe wants them present from the
// first line, so it asks for them up front and says they have arrived.
const MAPSJS = '<script src="maps.js"></' + 'script><script>CC_MAPS_STATE="ready";</' + 'script>';
fs.writeFileSync(tmp, src + MAPSJS + BOOT);
// The page fetches maps.js beside itself, so the probe needs its own copy.
fs.copyFileSync(path.join(ROOT, 'maps.js'), path.join(dir, 'maps.js'));
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=60000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('the flight is for sale, the passport is not');
fs.rmSync(dir, { recursive: true, force: true });
