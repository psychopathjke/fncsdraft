// Круг Reload идёт по двум островам, игра через игру.
//
// Его слово, 27 августа: «1 игра слюрпи, другая стронхолд». На диске островов
// два — капы 1-2 на одном (art/map-reload-a.jpg), капы 3-4 на другом
// (map-reload-b.jpg), — а вечер брал один и держал его все игры: карта
// монтировалась один раз на этап.
//
// Здесь стережётся и правило, и то, что оно доезжает до живого прогона: набор
// острова меняется по номеру игры, второй остров у каждого капа действительно
// ДРУГОЙ, и вечер Reload проходит по обоим.
//
//   node tools/check-career-reload-island.js [папка сборки]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = (process.argv[2] || path.resolve(__dirname, '..')).replace(/\\/g, '/');
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
  const out = {fails: [], notes: {}, err: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  try {
    // ---- правило: чётные игры уходят на второй остров --------------------
    out.notes.чередование={};
    ['r1','r2','r3','r4'].forEach(set=>{
      const игры=[1,2,3,4,5,6].map(g=>ccRelIsland(set, g));
      const арт=игры.map(s=>MAP_ART[s]);
      out.notes.чередование[set]={наборы:игры, острова:арт.map(a=>a.slice(-5))};
      check(set+': нечётная игра — свой остров', игры[0]===set, игры[0]);
      check(set+': чётная игра — ДРУГОЙ остров', арт[1]!==арт[0],
            арт[0]+' и '+арт[1]);
      check(set+': дальше чередуется',
            арт[2]===арт[0] && арт[3]===арт[1] && арт[4]===арт[0],
            арт.join(' '));
      check(set+': у обоих островов есть сетка коробок',
            !!ZONE_SETS[игры[0]] && !!ZONE_SETS[игры[1]],
            игры[0]+'/'+игры[1]);
    });

    /* ---- и это доезжает до живого прогона ------------------------------
       Вечер Reload играется по-настоящему, а useLandingSet записывает, на каком
       острове стояла каждая игра. */
    const посещено=[];
    const было=useLandingSet;
    useLandingSet=function(k){ посещено.push(k); return было.apply(this, arguments); };
    localStorage.setItem('fncsdraft_career', JSON.stringify({v:1,
      player:{nick:'Island', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:0, region:'EU', ovr:93, role:'roleIGL',
        attrs:ccRookieAttrs(93,'roleIGL'), ageEdge:0, photo:null,
        handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-01', division:1, earnings:0, balance:5000,
        reach:9000, tokens:[], log:[], news:[],
        reload:{series:1, got:'playin'}},
      partners:[{handle:'Sbari', cardRegion:'EU', dev:0, since:'2026-01-12'}]}));
    careerLoad();
    skipAnimation=true; CC_SKIP_RUN=true;
    await runCareerReload();
    useLandingSet=было;
    const острова=[...new Set(посещено.filter(k=>/^r\\d$/.test(k)).map(k=>MAP_ART[k]))];
    out.notes.прогон={наборы:посещено.filter(k=>/^r\\d$/.test(k)),
                      разныхОстровов:острова.length};
    check('вечер Reload прошёл по обоим островам', острова.length===2,
          JSON.stringify(out.notes.прогон));
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'island-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=1800000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('вечер Reload идёт по двум островам');
fs.rmSync(dir, { recursive: true, force: true });
