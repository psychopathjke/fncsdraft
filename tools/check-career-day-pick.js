// Выбор события дня: горит та кнопка, что сыграется. Дни, где кап (консольный, Mobile Series, обычный) стоит рядом
// с главным турниром (Solo Series, Reload, Weekly Final, Perf Eval), с купленными PS5, Xbox и телефоном.
// Без выбора играется главное, ЛАН и ноябрьский Trios Cash Cup решают сами; что горит, то и играется.
//   node tools/check-career-day-pick.js [год=2026] [дивизион=1]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const YEAR = process.argv[2] || '2026', DIV = +(process.argv[3] || 1);
const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={rows:[], bad:0, total:0};
  try{
    localStorage.setItem('fncsdraft_tour1','1');
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Probe', age:17, source:'rookie', country:'de', countryPing:7, closeRangeEdge:6, region:'EU', ovr:80, role:'roleIGL', attrs:null, ageEdge:4},
      career:{year:${YEAR}, season:1, day:'${YEAR}-01-05', division:${DIV}, earnings:0, balance:50000, reach:0, tokens:[], log:[], news:[], life:{rp:500}},
      gear:{own:[]}, partner:null}));
    careerEntry();
    ['ps5','xbox','phone'].forEach(id=>{ try{ careerBuy(id); }catch(e){} });
    const cr=CAREER.career;
    for(let d=ccYearFrom(); d<=ccYearTo(); d=ccAddDays(d,1)){
      cr.day=d; cr.vpick={};
      const evs=careerEvents().get(d)||[];
      const vic=evs.filter(e=>e.kind==='victory'), oth=evs.filter(e=>e.kind!=='victory' && e.kind!=='gala');
      if(!vic.length || !oth.length) continue;
      const n0=careerNext();
      const h=ccVictoryAltsHTML();
      const seniorOn=/cc-valt on"[^>]*onclick="ccVictoryPick\\('__day'\\)/.test(h);
      const lie = seniorOn ? n0.type==='victory' : n0.type!=='victory';
      out.total++; if(lie){ out.bad++; out.rows.push(d+' играется '+n0.type+':'+n0.id); }
    }
  }catch(e){ out.fail=String(e && e.stack || e).slice(0,600); }
  document.getElementById('__out').textContent='BEG'+'IN'+encodeURIComponent(JSON.stringify(out))+'E'+'ND';
})();
<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'daypick-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g, '/') + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom', 'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const m = dom.match(/BEGIN(.*?)END/);
if (!m) { console.log('FAIL проба не отработала'); process.exit(2); }
const o = JSON.parse(decodeURIComponent(m[1]));
if (o.fail) { console.log('FAIL ' + o.fail); process.exit(1); }
if (!o.total) { console.log('FAIL нет дней с капом рядом с главным турниром (' + YEAR + ', дивизион ' + DIV + ')'); process.exit(1); }
if (o.bad) { console.log('FAIL горит не то, что играется: ' + o.bad + ' из ' + o.total); o.rows.slice(0, 10).forEach(r => console.log('  ' + r)); process.exit(1); }
console.log('OK ' + YEAR + ', дивизион ' + DIV + ': ' + o.total + ' дней с капом рядом с главным, горит то, что играется');
