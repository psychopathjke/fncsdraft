// Сколько стоит «следующий день» — по дням года, в миллисекундах.
//
// Его игрок, 4 сентября: «sometimes when u click on "next day" the site freezes
// and u have to refresh it». «Иногда» — значит дело в КОНКРЕТНЫХ днях, а не в
// кнопке: проба гоняет год по одному дню (careerSkipWeek — то же, что жмёт
// игрок) и печатает самые дорогие дни с их событиями.
//
//   node tools/next-day-cost-probe.js [сезонов]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const SEASONS = Number(process.argv[2] || 1);
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
  const out={days:[], worst:[], total:0, err:null, seasons:${SEASONS}};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({v:1,
      player:{nick:'DayCost', age:17, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:6, region:'EU', ovr:88, role:'roleIGL', attrs:null,
              ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-01-05', division:1, earnings:0, balance:5000, reach:20000,
              tokens:[], log:[], news:[]},
      partner:null}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs=ccRookieAttrs(88,'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerEntry();
    // Напарник, как у живого игрока.
    const dm=careerDms().find(x=>x.state==='offer' && !x.who.org && !x.who.brand);
    if(dm){ careerDmAccept(dm.id); }
    const cr=CAREER.career;
    let guard=0;
    for(let k=0;k<${SEASONS};k++){
      while(guard++ < 400*${SEASONS}){
        if(cr.seasonOver){ const t0=performance.now(); careerNewSeason();
          out.days.push({d:'НОВЫЙ СЕЗОН '+cr.season, ms:Math.round(performance.now()-t0)});
          break; }
        const day=careerToday();
        const t0=performance.now();
        careerSkipWeek();                     // ровно то, что жмёт кнопка
        const ms=performance.now()-t0;
        out.total+=ms;
        out.days.push({d:day, ms:Math.round(ms)});
        if(careerToday()===day) break;        // день не пошёл — стоп
      }
    }
    out.worst=out.days.slice().sort((a,b)=>b.ms-a.ms).slice(0,15);
    out.n=out.days.length;
    out.avg=Math.round(out.total/Math.max(1,out.days.length));
  }catch(e){ out.err=String(e&&e.stack||e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'daycost-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const t0 = Date.now();
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=900000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('проба не отработала (сама зависла?), ' + (Date.now() - t0) + ' мс'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log('дней пройдено: ' + out.n + ', средний день ' + out.avg + ' мс, всего ' +
            Math.round(out.total) + ' мс');
console.log('самые дорогие дни:');
out.worst.forEach(w => console.log('  ' + w.d + '  ' + w.ms + ' мс'));
