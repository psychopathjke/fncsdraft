// Harvests the Reload Elite Series leaderboards from Epic's own payload.
//
// The saved Tracker pages were the first source, and they are still the check
// this runs against — but they are Tracker's rendered top 100, they stop at the
// third cup, and the fourth cup is not on Tracker at all. eucompetitive.com
// proxies Epic's leaderboard service unchanged, so this reads the same shape
// the FNCS 2025 harvest read: rank, pointsEarned, pointBreakdown, sessionHistory
// and the handles and countries the entry carries.
//
//   node tools/fetch-ewc.js              # every window of every cup
//   node tools/fetch-ewc.js S41          # one season
//
// Writes one JSON per window to ~/Desktop/ewc/api/, which is outside the repo:
// the payload is the source, and what gets committed is the rows built from it.
const fs = require('fs'), path = require('path'), https = require('https');

const HOME = process.env.USERPROFILE || process.env.HOME;
const OUT = path.join(HOME, 'Desktop', 'ewc', 'api');
const HOST = 'eucompetitive.com';
const ONLY = process.argv[2] || null;
// The three seasons the circuit ran across: cups 1 and 2 in S39, cup 3 in S40,
// cup 4 in S41. Read from the calendar rather than assumed, but the seasons
// themselves have to be named to ask for them.
const SEASONS = ['S39', 'S40', 'S41'];
// The circuit ran everywhere, not only in Europe. A window id carries its
// region, so one harvest walks all seven by swapping the suffix.
const REGIONS = ['EU', 'NAC', 'NAW', 'BR', 'OCE', 'ASIA', 'ME'];

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Seven regions times nine windows is enough requests to be told to slow down,
// and being told twice is not a reason to lose a cup. A 429 waits and asks
// again rather than counting as a window that does not exist.
async function getPolitely(pathname, tries){
  for (let i = 0; i < (tries || 4); i++){
    try { return await get(pathname); }
    catch(e){
      if (!/-> 429/.test(e.message) || i === (tries || 4) - 1) throw e;
      await sleep(2000 * (i + 1));
    }
  }
}

function get(pathname){
  return new Promise((resolve, reject) => {
    https.get({host: HOST, path: pathname, headers: {'user-agent': 'fncsdraft-harvest'}}, res => {
      if (res.statusCode !== 200){ res.resume(); return reject(new Error(pathname.split('?')[0] + ' -> ' + res.statusCode)); }
      let b = '';
      res.setEncoding('utf8');
      res.on('data', c => b += c);
      res.on('end', () => { try { resolve(JSON.parse(b)); } catch(e){ reject(new Error('not JSON: ' + pathname.split('?')[0])); } });
    }).on('error', reject);
  });
}

// Every window of the circuit, in the order it was played. The calendar is the
// only place that knows a cup's windows — Tracker does not carry the fourth cup
// and the event ids are not guessable, as ten wrong guesses established.
// The calendar only answers for the season being played — S39 and S40 come back
// empty — so the three older cups are named from the window ids their saved
// Tracker pages carry. Epic's leaderboard service has since dropped most of
// them; the harvest logs which, and those stages keep the Tracker rows.
const OLD = [];
[['S39', 1], ['S39', 2], ['S40', 3]].forEach(([season, cup]) => {
  ['Open1', 'Open2', 'PlayInDay1', 'PlayInDay2', 'Heat1', 'Heat2', 'Heat3', 'Heat4', 'Final']
    .forEach(stage => REGIONS.forEach(reg => OLD.push({
      id: season + '_ReloadEliteSeries' + cup + stage + '_' + reg,
      event: null, date: '—', season: season, region: reg})));
});

async function windows(){
  const all = [];
  for (const season of SEASONS){
    if (ONLY && season !== ONLY) continue;
    const rows = await get('/APISYSTEMV2/calendar.php?season=' + season + '&region=EU');
    const arr = Array.isArray(rows) ? rows : (rows.events || rows.data || []);
    const found = arr.filter(e => /ReloadEliteSeries\d/.test(e.windowId || ''));
    // The calendar only answers for Europe, but every region played the same
    // windows on the same days, so its list is re-pointed at each of them.
    found.forEach(e => REGIONS.forEach(reg => all.push({
      id: (e.windowId || '').replace(/_EU$/, '_' + reg), event: e.eventId, date: e.date,
      begin: e.beginTime, end: e.endTime, season: season, region: reg})));
    if (!found.length) OLD.filter(w => w.season === season).forEach(w => all.push(w));
  }
  return all;
}

// A window can run to several pages; Epic says how many on the first one.
async function leaderboard(id){
  const first = await getPolitely('/APISYSTEMV2/leaderboard.php?eventWindowId=' + id);
  const pages = first.totalPages || 1;
  const entries = (first.entries || []).slice();
  for (let p = 1; p < pages; p++){
    const next = await getPolitely('/APISYSTEMV2/leaderboard.php?eventWindowId=' + id + '&page=' + p);
    entries.push(...(next.entries || []));
  }
  return Object.assign({}, first, {entries: entries, harvestedPages: pages});
}

(async () => {
  fs.mkdirSync(OUT, {recursive: true});
  const list = await windows();
  console.log(list.length + ' windows of the Reload Elite Series\n');
  for (const w of list){
    // A re-run is for filling gaps, not for asking again for what is already on
    // disk with a match log behind it — the service starts refusing when it is
    // asked sixty times in a row.
    const already = path.join(OUT, w.id + '.json');
    if (fs.existsSync(already)){
      try{
        const have = JSON.parse(fs.readFileSync(already, 'utf8'));
        const real = ((have.leaderboard || {}).entries || []).filter(e => (e.sessionHistory || []).length > 0).length;
        if (real){ console.log('  ' + w.id.padEnd(38) + w.date + '  already harvested, ' + real + ' teams'); continue; }
      }catch(e){}
    }
    try{
      await sleep(400);
      const lb = await leaderboard(w.id);
      const file = path.join(OUT, w.id + '.json');
      fs.writeFileSync(file, JSON.stringify({window: w, leaderboard: lb}));
      console.log('  ' + w.id.padEnd(38) + w.date + '  ' + String(lb.entries.length).padStart(5) +
                  ' teams' + (lb.harvestedPages > 1 ? '  ' + lb.harvestedPages + ' pages' : ''));
    }catch(e){
      console.log('  ' + w.id.padEnd(38) + w.date + '  FAILED ' + e.message);
    }
  }
  console.log('\nwritten to ' + OUT);
})();
