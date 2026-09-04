// Игрок года: церемония в конце сезона.
//
// Идея его игрока 4 сентября: «чтоб в конце главы выбирали лучшего игрока за
// год, типо как в футболе золотой мяч». Награда считалась и раньше
// (careerAwardSeason по очкам PR за год), но приходила одной строкой в ленту.
// Теперь у неё есть пятёрка номинантов и плитка на экране конца сезона.
//
// Проверяется: пятёрка пишется в саму награду, победитель первый, плитка на
// экране конца сезона рисуется и называет всех, а своя строка подсвечена.
//
//   node tools/check-career-goty.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
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
  const out={fails:[], notes:{}, err:null};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({v:1,
      player:{nick:'Goty', age:19, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:0, region:'EU', ovr:90, role:'roleIGL',
              attrs:ccRookieAttrs(90,'roleIGL'), ageEdge:0, photo:null, handle:null,
              cardRegion:null, nat:null},
      career:{season:1, day:'2026-09-20', division:1, earnings:0, balance:0, reach:9000,
              tokens:[], log:[], news:[]},
      partners:[]}));
    careerLoad();
    const cr=CAREER.career;

    /* Доска считается по очкам PR (careerPrTally), а не по журналу: каждая
       строка — [очки, абсолютный день карьеры]. Сеем год так, как его пишут
       вечера: у каждого по два вечера, у победителя больше очков. */
    cr.pr={rows:{
      'Rival':{v:[[400, 50], [380, 130]]},
      'Goty':{you:true, v:[[300, 60], [290, 140]]},
      'Third':{v:[[250, 70], [240, 150]]},
      'Fourth':{v:[[200, 80], [190, 160]]},
      'Fifth':{v:[[150, 90], [140, 170]]},
      'Sixth':{v:[[100, 95], [90, 175]]}
    }};
    careerSave();
    const win=careerAwardSeason();
    out.notes.win=win && {name:win.name, you:!!win.you};
    check('награда сезона выдана', !!win, JSON.stringify(out.notes.win));
    const rec=(careerAwards().won||[]).filter(a=>a.kind==='season')[0];
    out.notes.top=rec && rec.top;
    check('в награде записана пятёрка', !!(rec && rec.top && rec.top.length>1),
          JSON.stringify(out.notes.top));
    check('и её больше пяти не бывает', rec.top.length<=CC_AWARD_TOP, String(rec.top.length));
    check('первый в пятёрке — победитель', rec.top[0].n===rec.name,
          rec.top[0].n+' vs '+rec.name);
    check('очки идут по убыванию',
          rec.top.every((r,i)=>i===0 || rec.top[i-1].p>=r.p), JSON.stringify(rec.top));

    // ---- плитка ------------------------------------------------------------
    const html=careerSeasonAwardHTML();
    out.notes.tile=html.slice(0, 80);
    check('плитка рисуется', html.indexOf('cc-goty')>=0, out.notes.tile);
    check('и называет победителя', html.indexOf(esc(rec.name))>=0);
    check('и остальных из пятёрки',
          rec.top.slice(1).every(r=>html.indexOf(esc(r.n))>=0), JSON.stringify(rec.top));
    check('заголовок из словаря', html.indexOf(L().ccGotyTitle)>=0);

    // Своя строка подсвечена — ради неё церемонию и смотрят.
    rec.top[1]=Object.assign({}, rec.top[1], {you:true});
    check('своя строка помечена', careerSeasonAwardHTML().indexOf('cc-goty-row me')>=0);

    // Награды нет — плитки нет.
    cr.aw={last:ccMonthKey(careerToday()), won:[]};
    check('без награды плитки нет', careerSeasonAwardHTML()==='');
  }catch(e){ out.err=String(e&&e.stack||e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'goty-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=300000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log('  ' + JSON.stringify(out.notes));
if (out.fails.length) { out.fails.forEach(f => console.error('FAILED: ' + f)); process.exit(1); }
console.log('игрок года выбирается и показывается церемонией');
