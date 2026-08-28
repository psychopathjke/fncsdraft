// Как часто соперник по ссоре падает именно на твой дом.
//
// Его игрок, 26 августа: «я куда бы ни ставил свою локу, меня всегда
// контестят связи и пикси. Уже три локи сменил, они всё на меня падают».
//
// CC_BEEF_PULL снимает шесть с цены коробки, а весь разброс раздачи —
// LANDING_NOISE, то есть 1.15. Проба считает долю игр, в которых команда с
// бифом оказалась в доме игрока, и сравнивает с командой без бифа.
//
//   node tools/career-beef-pull-probe.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const GAMES = Number(process.env.GAMES || 200);

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out = {err:null};
  try {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'Probe', age:20, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:0, region:'EU', ovr:92, role:'roleIGL',
              attrs:ccRookieAttrs(92,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-03-02', division:1, earnings:0, balance:0,
              reach:9000, tokens:[], log:[], news:[]},
      partners:[]
    }));
    careerLoad();
    const cr = CAREER.career;
    const me = careerCard();
    useLandingSet(ACTIVE_LANDING_SET);
    const field = [careerYouTeam([me])].concat(
      careerCupField(cr, [me], careerCupSize(1), null));
    const you = field[0]; you.isYou = true;
    // Дом игрока — три точки, как их держит карьера: индекс в сетке набора.
    // Индексы подбираются, а не назначаются: соседние клетки сетки сходятся в
    // одну зону острова, и «три дома» вышли бы одним.
    const grid = ZONE_SETS[ACTIVE_LANDING_SET] || [];
    const picked = [], seenZ = new Set();
    for (let i = 0; i < grid.length && picked.length < 3; i++) {
      const z = careerSpotZoneOf(i, ACTIVE_LANDING_SET);
      if (z && !seenZ.has(z)) { seenZ.add(z); picked.push(i); }
    }
    careerSpots()[careerSpotKey(ACTIVE_LANDING_SET)] =
      picked.map(i => ({i:i, aura:0, won:0, day:cr.day}));
    // Соперник по ссоре — вторая команда комнаты; контроль — третья.
    const rival = field[1], plain = field[2];
    // Ссора живёт в cr.beefs и «горяча», пока последняя встреча свежая.
    cr.beefs = (rival.squad||[]).map(p => ({h:p.handle, w:2, l:1, met:9,
                                            since:cr.day, last:cr.day, hot:true}));

    const homeSet = new Set(careerSpotZones(ACTIVE_LANDING_SET).map(x => x.zone));
    out.homes = homeSet.size;
    out.beefSeen = careerBeefHot().length;

    // Игрок стоит на ОДНОМ из своих домов — на первом. Считается два числа:
    // сколько игр соперник провёл на этом самом доме (то есть встретился), и
    // сколько — на любом из домов вообще (то есть пришёл охотиться).
    const mine = careerSpotZones(ACTIVE_LANDING_SET)[0].zone;
    let met = 0, hunted = 0, plainIn = 0;
    for (let g = 0; g < ${GAMES}; g++) {
      careerSpotFearOn(you);
      const groups = buildBotLandingAssignment(field.filter(t => t !== you)).zoneGroups;
      careerSpotFearOff();
      let m = false, h = false, p = false;
      groups.forEach((teams, z) => {
        if (!homeSet.has(z)) return;
        if (teams.indexOf(rival) >= 0) { h = true; if (z === mine) m = true; }
        if (teams.indexOf(plain) >= 0 && z === mine) p = true;
      });
      if (m) met++;
      if (h) hunted++;
      if (p) plainIn++;
    }
    out.games = ${GAMES};
    out.metOnMyZonePct = Math.round(met / ${GAMES} * 100);
    out.huntedAnyHomePct = Math.round(hunted / ${GAMES} * 100);
    out.plainPct = Math.round(plainIn / ${GAMES} * 100);
    out.pull = CC_BEEF_PULL;
    out.noise = LANDING_NOISE;
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsbeef-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=900000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out, null, 1));
fs.rmSync(dir, { recursive: true, force: true });
