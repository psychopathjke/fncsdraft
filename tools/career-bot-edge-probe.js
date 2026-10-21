// Форма, химия и аналитик у ботов (ccBotEdge, 21.10): что это меняет для игрока.
//
// Вопрос игрока: «почему в игре у меня сила больше всех или почти всех, хотя слабая локация и у моего игрока
// и тиммейтов не самый высокий рейтинг». Своей команде careerYouTeam прибавляет форму, химию и аналитика, ботам
// до 21.10 — ничего. Проба ставит одну и ту же пару игрока (с его типичными +2 формы, +5 химии, +2 аналитика) в
// кубок дивизиона дважды: с ccBotEdge и без него, — и печатает, какая она по силе в лобби и какое место берёт.
//
// Run: node tools/career-bot-edge-probe.js [runs] [a/b]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const RUNS = parseInt(process.argv[2] || '30', 10);
const PAIR = (process.argv[3] || '84/82').split('/').map(Number);
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
    CARD_MODE = true; squadSize = 2;
    const mk = (ovr, nick, role) => ({handle: nick, nat: null, region: 'EU', org: null,
      tier: 'ranked', event: 'edge', placement: null,
      rating: ovr, _targetOvr: ovr, _attrs: ccRookieAttrs(ovr, role || 'roleIGL')});
    const EDGE = ccBotEdge, YOU_EXTRA = 2 + 5 + 2;
    for (const div of [1, 2, 3, 4]) for (const on of [false, true]) {
      ccBotEdge = on ? EDGE : function(){};
      const row = {div, edge: on ? 'on' : 'off', powRank: [], places: [], won: 0, top3: 0, missed: 0, edges: []};
      for (let r = 0; r < ${RUNS}; r++) {
        const me = mk(${PAIR[0]}, 'EDGE_YOU', 'roleIGL'), mate = mk(${PAIR[1]}, 'EDGE_MATE', 'roleFRG');
        const day = ccAddDays('2026-03-02', 7 * (r % 20));
        CAREER = {player: {}, career: {season: 1, week: (r % 4) + 1, division: div, day}, partner: null};
        const you = careerTeam([me, mate], true);
        you.pow += YOU_EXTRA; you.isYou = true; you.name = 'you';
        const field = [you].concat(careerCupField(CAREER.career, [me, mate], careerCupSize(div)));
        field.forEach(t => { if (t.botEdge) row.edges.push(t.botEdge.form + t.botEdge.chem + t.botEdge.an); });
        row.powRank.push(field.filter(t => t !== you && t.pow > you.pow).length + 1);
        if (!row.fieldSize) { row.fieldSize = field.length; row.youPow = you.pow;
          const ps = field.filter(t => t !== you).map(t => t.pow).sort((a, b) => b - a);
          row.top5pow = ps.slice(0, 5).join(','); row.medPow = ps[Math.floor(ps.length / 2)]; }
        await simulateGamesRandomLobbies(field, CAREER_CUP_GAMES, 50, pointsForPlace, 4);
        const ranked = field.slice().sort((x, y) => y.stagePts - x.stagePts || y.stageElims - x.stageElims);
        const place = ranked.indexOf(you) + 1;
        row.places.push(place);
        if (place === 1) row.won++;
        if (place <= 3) row.top3++;
        if (place > careerCupCut(div)) row.missed++;
      }
      const mean = a => a.length ? Math.round(a.reduce((t, v) => t + v, 0) / a.length * 10) / 10 : 0;
      const med = a => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
      row.powRankMed = med(row.powRank); row.placeMean = mean(row.places); row.placeMed = med(row.places);
      row.edgeMean = mean(row.edges); row.edgeMax = row.edges.length ? Math.max.apply(null, row.edges) : 0;
      delete row.powRank; delete row.places; delete row.edges;
      out.rows.push(row);
    }
  } catch(e){ out.error = String(e && e.stack || e); }
  document.getElementById('__out').textContent = 'BE' + 'GIN' + encodeURIComponent(JSON.stringify(out)) + 'E' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsedge-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=1800000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/BEGIN([\w%\-.!~*'()]*)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.error) { console.error(out.error); process.exit(1); }
console.log('pair ' + PAIR.join('/') + ' (+9 form/chem/analyst), ' + out.runs + ' cups per row');
console.log('div edge  field youPow  top5 bots        medBot  bots+  powRank  place(mean/med)  won  top3  missed');
out.rows.forEach(r => {
  const pct = n => (100 * n / out.runs).toFixed(0) + '%';
  console.log(String(r.div).padEnd(4) + r.edge.padEnd(6) + String(r.fieldSize).padStart(5) + String(r.youPow).padStart(7) + '  ' +
    String(r.top5pow).padEnd(17) + String(r.medPow).padStart(6) + String(r.edgeMean).padStart(7) + String(r.powRankMed).padStart(9) +
    (r.placeMean + '/' + r.placeMed).padStart(17) + pct(r.won).padStart(5) + pct(r.top3).padStart(6) + pct(r.missed).padStart(8));
});
fs.rmSync(dir, { recursive: true, force: true });
