// Every final in the archive opens into the table it was decided by.
//
// His ask, 21 August: the tile named a champion and stopped at the name. So
// each line of it now opens a full Grand Finals — the whole field, points,
// Victory Royales, eliminations and the cheque per place — built out of the
// region's own roster and played by the engine the career plays with.
//
// What this checks is what could quietly go wrong in that:
//
//   - the room is the event's own size, in the squad the season was played in
//   - nobody sits in two seats, which is the bug that turns a scene into a
//     dynasty (see ccArcTeam's note) and would here turn a lobby into a hall
//     of mirrors
//   - the table is sorted, and the champion named on the line is on top of it
//   - it is the SAME table twice, because it is seeded and stored nowhere
//   - the player's own row is the log's, at the log's place, not a redraw
//   - a region is paid its own purse, which majorPrize cannot answer for
//   - a LAN is every region and a regional Major is one
//
//   node tools/check-career-final-table.js
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
    const seed = (now, log, sizes, size) => { CAREER = {
      player:{nick:'Gbzin', ovr:93, ovrExact:93, region:'EU', role:'roleIGL',
              country:'de', age:20, attrs:ccRookieAttrs(93,'roleIGL')},
      career:{season:now, day:'2026-02-02', division:1, earnings:0, balance:0,
              tokens:[], log:log||[], news:[], form:0, grind:0,
              size:(size||2), sizes:sizes, seasonOver:true},
      dms:[], partners:[], gear:{own:[], train:0}}; };
    const fresh = () => { CH_ARC_TBL = {}; };

    // ---- a duos season, Europe's Major 1 ---------------------------------
    seed(2, [], {1:2}, 2);
    const t0 = performance.now();
    const eu = careerArchiveFinal(1, 'm|1|EU');
    const ms = Math.round(performance.now() - t0);
    out.notes.euMajor1 = {rows: eu && eu.rows.length, cap: eu && eu.cap, sub: eu && eu.sub,
                          ms: ms, top: eu && eu.rows.slice(0,3).map(r => r.p+' '+r.name+' '+r.pts)};
    check('a duo Major final seats fifty', eu && eu.rows.length === 50,
          eu ? String(eu.rows.length) : 'no table');
    check('and it is built in under four seconds', ms < 4000, ms + 'ms');

    // Sorted, and by the event's own scoring rather than by anything else.
    const sorted = eu.rows.every((r,i) => i === 0 || eu.rows[i-1].pts >= r.pts);
    check('the table is in finishing order', sorted);
    check('the places run 1..N', eu.rows.every((r,i) => r.p === i+1));

    // Nobody twice. The names are handles joined by ' & '.
    const seen = new Set(); let dup = null;
    eu.rows.forEach(r => r.name.split(' & ').forEach(h => {
      const k = h.trim().toLowerCase();
      if(seen.has(k)) dup = h; else seen.add(k);
    }));
    check('nobody sits in two seats', !dup, dup || '');
    out.notes.people = seen.size;
    check('fifty duos is a hundred people', seen.size === 100, String(seen.size));

    // The line above the table and the row on top of it are the same team.
    const a1 = careerArchiveSeason(1);
    const champ = a1.regional.find(e => e.n === 1).perReg.EU.name;
    out.notes.champion = {tile: champ, table: eu.rows[0].name};
    check('the champion named on the line is the champion in the table',
          champ === eu.rows[0].name, champ + ' vs ' + eu.rows[0].name);

    // Seeded: the same click twice is the same table.
    fresh();
    const eu2 = careerArchiveFinal(1, 'm|1|EU');
    check('the same final opens the same twice',
          JSON.stringify(eu2.rows) === JSON.stringify(eu.rows));

    // The purse is Europe's, place by place.
    check('first place is paid the region\\'s own top prize',
          eu.rows[0].prize === PRIZE_TABLES.EU['1'], String(eu.rows[0].prize));
    check('and fiftieth is paid its tail', eu.rows[49].prize === PRIZE_TABLES.EU['50'],
          String(eu.rows[49].prize));

    // ---- another region is another purse and another roster --------------
    fresh();
    const asia = careerArchiveFinal(1, 'm|1|ASIA');
    out.notes.asia = {rows: asia && asia.rows.length, first: asia && asia.rows[0].name,
                      pay: asia && asia.rows[0].prize};
    check('Asia is paid Asia\\'s table, not Europe\\'s',
          asia && asia.rows[0].prize === PRIZE_TABLES.ASIA['1'],
          asia ? String(asia.rows[0].prize) : 'no table');
    check('and it is a different room', asia && asia.rows[0].name !== eu.rows[0].name);
    check('a regional final is one region', !eu.lan);

    // ---- a LAN is every region -------------------------------------------
    fresh();
    const gc = careerArchiveFinal(1, 'g|gc');
    const regs = new Set(gc.rows.map(r => r.reg));
    out.notes.gc = {rows: gc.rows.length, regions: [...regs], pay: gc.rows[0].prize};
    check('Antwerp seats fifty', gc.rows.length === 50, String(gc.rows.length));
    check('and it is not one scene', regs.size >= 5, [...regs].join(','));
    check('the Global Championship pays its own purse',
          gc.rows[0].prize === GC2026_PRIZES['1'], String(gc.rows[0].prize));
    check('a LAN table carries the region column', gc.lan === true);

    fresh();
    const rc = careerArchiveFinal(1, 'g|rc');
    out.notes.rc = {rows: rc.rows.length, pay: rc.rows[0].prize};
    check('Paris is twenty', rc.rows.length === 20, String(rc.rows.length));
    check('and pays the Reload Championship', rc.rows[0].prize === rcPrize(1), String(rc.rows[0].prize));

    // ---- the player's own row is the log's --------------------------------
    // Fourth at Major 1, which the archive's own line never mentions.
    const mine = {season:1, day:'2026-04-25', div:1, place:4, of:50, pts:377, passed:true,
      ovr:93, games:12, wins:2, elims:41, avg:9, mate:'Cr1nge', mates:['Cr1nge'],
      prize:50000, kind:'major', stage:'final'};
    seed(2, [mine], {1:2}, 2);
    fresh();
    const with4 = careerArchiveFinal(1, 'm|1|EU');
    const row = with4.rows.find(r => r.you);
    out.notes.mine = row;
    check('the player is in the table at all', !!row);
    check('at the place the log recorded', row && row.p === 4, row ? String(row.p) : '-');
    check('with the points the log recorded', row && row.pts === 377, row ? String(row.pts) : '-');
    check('and the eliminations too', row && row.elims === 41, row ? String(row.elims) : '-');
    check('the room did not grow to fit them', with4.rows.length === 50,
          String(with4.rows.length));
    // Your partner is beside you, and nowhere else in the room.
    const mates = with4.rows.filter(r => !r.you)
      .filter(r => r.name.split(' & ').some(h => h.trim() === 'Cr1nge'));
    check('the player\\'s partner is not also playing for somebody else',
          mates.length === 0, mates.map(r => r.p+' '+r.name).join(', '));
    // The one thing a real row can break: a table that stops descending.
    const drop = with4.rows.findIndex((r,i) => i > 0 && with4.rows[i-1].pts < r.pts);
    out.notes.mineNeighbours = with4.rows.slice(2,7).map(r => r.p+' '+r.name+' '+r.pts);
    check('the table still descends around the row that really happened',
          drop < 0, drop < 0 ? '' : 'row ' + (drop+1) + ' is above the row over it');
    check('the champion is still the champion', with4.rows[0].name === eu.rows[0].name,
          with4.rows[0].name);
    /* Everybody the draw had at fourth and below moved down a place.

       Read against the same career finishing last rather than against the
       table with no player in it: excluding the player's own seat from the
       room changes who is drawn into it, so those two are different lobbies
       and always were. These two are the same lobby, entered at two places. */
    const lastRow = Object.assign({}, mine, {place:50, pts:96});
    seed(2, [lastRow], {1:2}, 2);
    fresh();
    const bottom = careerArchiveFinal(1, 'm|1|EU');
    const names = t => t.rows.filter(r => !r.you).map(r => r.name).join('|');
    check('the same lobby entered at two places is the same lobby',
          names(with4) === names(bottom));
    check('and the field below the player moved down one',
          with4.rows[4].name === bottom.rows[3].name,
          with4.rows[4].name + ' vs ' + bottom.rows[3].name);
    out.notes.last = {p: bottom.rows[49].p, you: bottom.rows[49].you,
                      above: bottom.rows[48].pts, mine: bottom.rows[49].pts};
    check('a career that came last is last', bottom.rows[49].you === true);
    check('and the forty-nine above it are above it',
          bottom.rows.every((r,i) => i === 0 || bottom.rows[i-1].pts >= r.pts));
    seed(2, [mine], {1:2}, 2);

    // A win is the same read: the line says the player, so does the table.
    const won = Object.assign({}, mine, {place:1, pts:441});
    seed(2, [won], {1:2}, 2);
    fresh();
    const winTable = careerArchiveFinal(1, 'm|1|EU');
    const a1w = careerArchiveSeason(1);
    out.notes.won = {tile: a1w.regional.find(e=>e.n===1).perReg.EU.name,
                     table: winTable.rows[0].name, you: winTable.rows[0].you};
    check('a Major the player won is theirs on the line and in the table',
          winTable.rows[0].you && winTable.rows[0].name === 'Gbzin & Cr1nge',
          winTable.rows[0].name);
    check('and the scene\\'s champion is second now',
          winTable.rows[1].name === eu.rows[0].name, winTable.rows[1].name);
    check('a table won by the player still descends',
          winTable.rows.every((r,i) => i === 0 || winTable.rows[i-1].pts >= r.pts));
    // Last place is the other end of the same fit: it must not walk past zero.
    check('and nothing at the bottom of it went negative',
          winTable.rows.every(r => r.pts >= 0));


    // ---- a trios season is a third fewer teams ---------------------------
    seed(3, [], {1:3}, 2);
    fresh();
    const tri = careerArchiveFinal(1, 'm|1|EU');
    const triPeople = new Set();
    tri.rows.forEach(r => r.name.split(' & ').forEach(h => triPeople.add(h.trim().toLowerCase())));
    out.notes.trios = {rows: tri.rows.length, people: triPeople.size, sub: tri.sub,
                       first: tri.rows[0].name};
    check('a trios Major final is thirty-three teams', tri.rows.length === 33,
          String(tri.rows.length));
    check('of three people each', tri.rows.every(r => r.name.split(' & ').length === 3));
    check('and still nobody twice', triPeople.size === 99, String(triPeople.size));
    check('the caption counts trios, not duos',
          tri.sub.indexOf(L().ccWordTrios) >= 0, tri.sub);

    /* ---- and a trios year opens the same LANs it plays --------------------

       Здесь стояло «в трио-сезоне открыт только Global Championship» — правда
       про настоящий 2025 год, где трио играли без Саммита и без круга Reload,
       и неправда про этот режим: календарь карьеры один на все сезоны, Саммит
       стоит 29-31 мая и в трио-год тоже, карьера его играет и выигрывает.
       Его игрок, 25 августа: «выиграли саммит, а в истории результатов
       турнира нас вообще нет». Турнир, который сыгран, в истории есть. */
    const a1t = careerArchiveSeason(1);
    out.notes.triosGlobals = a1t.global.map(g => g.slot);
    check('a trios year opens every LAN its calendar plays',
          ['summit','rc','gc'].every(s => a1t.global.some(g => g.slot === s)),
          a1t.global.map(g=>g.slot).join(','));
    const triSum = careerArchiveFinal(1, 'g|summit');
    check('and its Summit table is a trios table',
          triSum && triSum.rows.length === ccArcCount(3, CC_SUMMIT_STAGE.final.field) &&
          triSum.rows.every(r => r.name.split(' & ').length === 3),
          triSum ? String(triSum.rows.length) : 'no table');

    /* ---- and the row is a row you can press ------------------------------

       Everything above calls the builder. This presses what a player presses:
       the tile is rendered, the line for Major 1 is clicked, and the table has
       to be under it — and gone again on the second press. */
    seed(2, [], {1:2}, 2);
    fresh();
    CH_ARC_OPEN = null; CH_ARC_S = 1; CH_ARC_R = 'EU';
    const host = document.createElement('div');
    document.body.appendChild(host);
    const draw = () => { host.innerHTML = careerArchiveHTML(); };
    // careerArcOpen re-renders the hub, which is not on screen in this probe.
    const realRender = careerRenderHub;
    careerRenderHub = () => draw();
    draw();
    const rows = [...host.querySelectorAll('.arc-row')];
    out.notes.rows = rows.length;
    check('every line of the tile is pressable', rows.length === 5,
          String(rows.length) + ' rows');
    check('and none of them is open yet', !host.querySelector('.arc-t'));
    const major1 = rows[rows.length - 2];   // Major 1, after the three LANs
    major1.click();
    const table = host.querySelector('.arc-t');
    out.notes.clicked = {rows: table ? table.querySelectorAll('tbody tr').length : 0,
                         cap: host.querySelector('.arc-cap') &&
                              host.querySelector('.arc-cap').textContent.trim()};
    check('pressing one opens its table', !!table);
    check('with the whole field in it',
          table && table.querySelectorAll('tbody tr').length === 50,
          table ? String(table.querySelectorAll('tbody tr').length) : '-');
    check('the open line is marked open',
          !!host.querySelector('.arc-row.arc-on'));
    [...host.querySelectorAll('.arc-row')][rows.length - 2].click();
    check('and pressing it again closes it', !host.querySelector('.arc-t'));
    // Two open at once is a screen nobody can climb back out of.
    [...host.querySelectorAll('.arc-row')][0].click();
    [...host.querySelectorAll('.arc-row')][rows.length - 1].click();
    check('only one table is open at a time',
          host.querySelectorAll('.arc-t').length === 1,
          String(host.querySelectorAll('.arc-t').length));
    careerRenderHub = realRender;
    host.remove();

    // ---- and the page is left as it was found ----------------------------
    check('Math.random is the page\\'s own again', Math.random !== undefined &&
          String(Math.random).indexOf('native code') > 0, String(Math.random).slice(0,60));
    check('CARD_MODE was put back', CARD_MODE === false, String(CARD_MODE));
    check('the kill cap was put back', CC_KILL_CAP === 0, String(CC_KILL_CAP));
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccfin-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=120000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out.notes, null, 1));
if (out.err) { console.error(out.err); console.error('copy at ' + tmp); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f));
  console.error('copy at ' + tmp); process.exit(1); }
console.log('every final in the archive opens into its own table');
fs.rmSync(dir, { recursive: true, force: true });
