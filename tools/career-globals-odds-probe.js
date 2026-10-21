// Какой шанс выиграть Глобалы в карьере (его вопрос 21.10: «а какой шанс выиграть глобалс?») — и что с ним делает
// форма/химия/аналитик ботов (ccBotEdge).
//
// Карьера 2026 года в Европе стоит на дне Глобалов; зал собирает careerGlobalsField — тот же, что у живого вечера,
// игры и очки те же (CC_GLOB_GAMES, majorPoints, CC_GLOB_KILL). Пара игрока — с его обычными +2 формы, +5 химии,
// +2 аналитика. Печатает долю побед, топ-3, топ-10 и среднее место; и для сравнения — как часто выигрывает самый
// сильный бот зала (то, чем зал живёт без игрока).
//
// Run: node tools/career-globals-odds-probe.js [runs]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const RUNS = parseInt(process.argv[2] || '40', 10);
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {runs: ${RUNS}, rows: [], error: null};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'OddsYou', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:0, region:'EU', ovr:84, role:'roleIGL', attrs:null, ageEdge:0,
        photo:null, handle:'oddsyou', cardRegion:'EU', nat:null},
      career:{season:1, size:2, day:'2026-01-05', division:1, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    const cr = CAREER.career;
    let gday = null;
    careerYearDays().forEach((evs, d) => { if (!gday && evs.some(x => x.kind === 'globals')) gday = d; });
    if (!gday) throw new Error('no globals day');
    cr.day = gday; out.day = gday;
    CARD_MODE = true; squadSize = 2;
    const mk = (ovr, nick, role) => ({handle: nick, nat: null, region: 'EU', org: null,
      tier: 'ranked', event: 'odds', placement: null,
      rating: ovr, _targetOvr: ovr, _attrs: ccRookieAttrs(ovr, role || 'roleIGL')});
    const EDGE = ccBotEdge, YOU_EXTRA = 2 + 5 + 2;
    for (const [a, b] of [[84, 82], [90, 88], [96, 94]]) for (const on of ['off', 'on', 'half', 'noan']) {
      ccBotEdge = on === 'off' ? function(){} : on === 'on' ? EDGE : function(t, c, h){ EDGE(t, c, h); const e = t.botEdge; if (!e) return;
        t.pow -= on === 'half' ? Math.round(e.chem / 2) : e.an; };
      const row = {you: a + '/' + b, edge: on, won: 0, top3: 0, top10: 0, sum: 0, powRank: [], topBotWon: 0};
      for (let r = 0; r < ${RUNS}; r++) {
        const me = mk(a, 'ODDS_YOU', 'roleIGL'), mate = mk(b, 'ODDS_MATE', 'roleFRG');
        drafted = [me, mate];
        const you = careerTeam([me, mate], true);
        you.pow += YOU_EXTRA; you.isYou = true; you.name = 'you';
        const field = careerGlobalsField(you, [me, mate], null);
        if (field.indexOf(you) < 0) field.unshift(you);
        field.forEach(t => { t.stagePts = 0; t.stageElims = 0; t.wins = 0; });
        const bots = field.filter(t => t !== you), topBot = bots.slice().sort((x, y) => y.pow - x.pow)[0];
        if (!row.fieldSize) { row.fieldSize = field.length; row.youPow = you.pow;
          row.top5 = bots.map(t => t.pow).sort((x, y) => y - x).slice(0, 5).join(','); }
        row.powRank.push(bots.filter(t => t.pow > you.pow).length + 1);
        await simulateGamesRandomLobbies(field, CC_GLOB_GAMES, field.length, majorPoints, CC_GLOB_KILL);
        const ranked = field.slice().sort((x, y) => y.stagePts - x.stagePts || (y.wins||0) - (x.wins||0) || y.stageElims - x.stageElims);
        const place = ranked.indexOf(you) + 1;
        row.sum += place;
        if (place === 1) row.won++;
        if (place <= 3) row.top3++;
        if (place <= 10) row.top10++;
        if (ranked[0] === topBot) row.topBotWon++;
      }
      const s = row.powRank.slice().sort((x, y) => x - y);
      row.powRankMed = s[Math.floor(s.length / 2)]; delete row.powRank;
      row.mean = Math.round(row.sum / ${RUNS} * 10) / 10; delete row.sum;
      out.rows.push(row);
    }
  } catch(e){ out.error = String(e && e.stack || e); }
  document.getElementById('__out').textContent = 'BE' + 'GIN' + encodeURIComponent(JSON.stringify(out)) + 'E' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsglob-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=1800000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/BEGIN([\w%\-.!~*'()]*)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.error) { console.error(out.error); process.exit(1); }
console.log('Globals ' + out.day + ', ' + out.runs + ' runs per row (your pair +9 form/chem/analyst)');
console.log('pair    edge  field youPow  top5 bots          powRank   won  top3  top10   mean  strongest bot won');
out.rows.forEach(r => {
  const pct = n => (100 * n / out.runs).toFixed(0) + '%';
  console.log(r.you.padEnd(8) + r.edge.padEnd(6) + String(r.fieldSize).padStart(5) + String(r.youPow).padStart(7) + '  ' +
    String(r.top5).padEnd(19) + String(r.powRankMed).padStart(7) + pct(r.won).padStart(6) + pct(r.top3).padStart(6) +
    pct(r.top10).padStart(7) + String(r.mean).padStart(7) + pct(r.topBotWon).padStart(12));
});
fs.rmSync(dir, { recursive: true, force: true });
