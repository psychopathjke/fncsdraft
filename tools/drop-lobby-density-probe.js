// Что правка «спрашивать по своему лобби» сделала с высадкой — в числах.
//
// Пикер обещал «на твоей коробке трое», а на острове с тобой играли не все
// трое: раздача считалась по всему полю этапа, а матч — по лобби. Здесь
// сравниваются два способа на одном и том же поле:
//
//   было  — раздача по всему полю, потом случайное деление на лобби;
//   стало — деление на лобби, потом раздача внутри своего.
//
// Печатается то, ради чего правка делалась: сколько соседей обещано и сколько
// из них реально сядет с тобой в матч. Плотность самого лобби смотрится рядом,
// чтобы видеть, не подорожал ли вечер.
//
//   node tools/drop-lobby-density-probe.js [полей]

const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const RUNS = +(process.argv[2] || 40);
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BASE = '<base href="file:///' + ROOT + '/">';
const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {rows: [], fail: null};
  const wait = ms => new Promise(r => setTimeout(r, ms));
  try{
    squadSize = 2; CARD_MODE = true;
    useLandingSet('m2');
    await wait(50);
    CC_DROP_STAGE = null;

    const LOBBY = 50;
    const make = (n) => {
      const a = [];
      for (let i = 0; i < n; i++) {
        const h = 'b' + i;
        a.push({name:'T' + i, pow: 90 + (i % 21), closeEdge: 0,
                squad:[{handle:h+'a', rating:60}, {handle:h+'b', rating:60}]});
      }
      a[0].isYou = true;
      return a;
    };
    const shuffle = a => { const s = a.slice();
      for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1));
        const t = s[i]; s[i] = s[j]; s[j] = t; } return s; };
    const boxOf = t => { const z = t.landingZone; return z ? z.x + ',' + z.y : '?'; };

    [50, 150, 260, 520].forEach(function(FIELD){
      let promisedOld = 0, realOld = 0, promisedNew = 0, realNew = 0;
      let sharedOld = 0, sharedNew = 0, runs = 0;
      for (let r = 0; r < ${RUNS}; r++) {
        // Было: раздача по полю, потом деление.
        const A = make(FIELD);
        buildBotLandingAssignment(A.filter(t => !t.isYou));
        const youA = A[0];
        // Игрок садится туда же, куда сел бы алгоритм за него.
        buildBotLandingAssignment([youA], {into: new Map()});
        const lobA = splitIntoLobbies(shuffle(A), LOBBY).find(l => l.some(t => t.isYou)) || [];
        const myBoxA = boxOf(youA);
        promisedOld += A.filter(t => t !== youA && boxOf(t) === myBoxA).length;
        realOld     += lobA.filter(t => t !== youA && boxOf(t) === myBoxA).length;
        sharedOld   += lobA.filter(t => lobA.filter(o => boxOf(o) === boxOf(t)).length > 1).length;

        // Стало: деление, потом раздача внутри своего лобби.
        const B = make(FIELD);
        const lobB = splitIntoLobbies(shuffle(B), LOBBY).find(l => l.some(t => t.isYou)) || [];
        const youB = lobB.find(t => t.isYou);
        buildBotLandingAssignment(lobB.filter(t => !t.isYou));
        buildBotLandingAssignment([youB], {into: new Map()});
        const myBoxB = boxOf(youB);
        promisedNew += lobB.filter(t => t !== youB && boxOf(t) === myBoxB).length;
        realNew     += lobB.filter(t => t !== youB && boxOf(t) === myBoxB).length;
        sharedNew   += lobB.filter(t => lobB.filter(o => boxOf(o) === boxOf(t)).length > 1).length;
        runs++;
      }
      const f = x => Math.round(x / runs * 100) / 100;
      out.rows.push({поле: FIELD,
        было_обещано: f(promisedOld), было_реально: f(realOld),
        стало_обещано: f(promisedNew), стало_реально: f(realNew),
        делят_коробку_было: f(sharedOld), делят_коробку_стало: f(sharedNew)});
    });
  } catch(e){ out.fail = String(e && e.stack || e); }
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dropdens-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, BASE + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);

const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--window-size=1440,1400',
  '--virtual-time-budget=300000', '--dump-dom', 'file:///' + tmp.replace(/\\/g, '/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.fail) { console.error(out.fail); process.exit(1); }
console.log('поле  обещано→реально (было)   обещано→реально (стало)   делят коробку было/стало');
out.rows.forEach(r => console.log(
  String(r.поле).padStart(4) + '   ' +
  (r.было_обещано + ' → ' + r.было_реально).padEnd(24) +
  (r.стало_обещано + ' → ' + r.стало_реально).padEnd(24) +
  r.делят_коробку_было + ' / ' + r.делят_коробку_стало));
fs.rmSync(dir, { recursive: true, force: true });
