// Что стоит в колонке «Регион» таблицы парижского ЛАНа, когда его играет
// карьера НЕ из Европы.
//
// Отзыв 26 сентября (твит): «when I play the lan ewc it's always full of
// players from my region». На его снимке — трио, призовые круга (150k/90k/60k/
// 45k/35k), и «NA West» во ВСЕХ строках. Проба играет финал круга живьём и
// читает ту самую колонку из DOM.
//
//   node tools/rc-table-region-probe.js
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
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
  const out={rows:[], err:null, errs:[]};
  window.addEventListener('error', function(e){ out.errs.push(String(e.message)+' @'+e.lineno); });
  setInterval(function(){
    const am=document.getElementById('ccAskModal');
    if(am && am.style.display==='flex'){
      const yes=document.getElementById('ccAskYes'), no=document.getElementById('ccAskNo');
      if(yes && yes.textContent===L().ccSpotGateSet){ careerSpotEnsure(); yes.click(); }
      else if(no) no.click();
    }
    document.querySelectorAll('.cc-choice-btn').forEach(b=>b.click());
    const p=document.querySelector('.landing-picker'); if(!p) return;
    const z=p.querySelectorAll('.land-zone'); if(!z.length) return;
    z[0].click();
    const c=p.querySelector('#gameLandingConfirm'); if(c && !c.disabled) c.click();
  }, 30);
  try{
    const row=CAREER_YEAR.find(r=>r[2]==='ReloadChampionshipParis');
    if(!row) throw new Error('Парижа нет в календаре');
    const day0=row[0];
    const MATE={EU:'Sbari', NAW:'Khanada', OCE:'ZDog', ASIA:'Koyota'};
    for(const reg of ['NAW','EU']){
      localStorage.setItem('fncsdraft_career', JSON.stringify({v:1,
        player:{nick:'Probe', age:20, source:'rookie', country:'de', countryPing:15,
          closeRangeEdge:0, region:reg, ovr:93, role:'roleIGL',
          attrs:ccRookieAttrs(93,'roleIGL'), ageEdge:0, photo:null,
          handle:null, cardRegion:reg, nat:null},
        career:{season:1, day:ccAddDays(day0,2), division:1, earnings:0, balance:5000,
          reach:9000, tokens:[], log:[], news:[],
          ewc:[{series:4, place:2, day:'2026-07-01'}],
          rc:{got:'survival', ticket:true}},
        partners:[{handle:MATE[reg]||'Sbari', cardRegion:reg, dev:0, since:'2026-01-12'}]}));
      careerLoad();
      skipAnimation=true; CC_SKIP_RUN=true;
      const ev=careerRcOn(careerToday());
      if(!ev) throw new Error(reg+': не день Парижа');
      const can=(typeof careerRcCan==='function') ? !!careerRcCan(ev) : null;
      let ran=true, runErr=null;
      try{ await runCareerReloadChampionship(); }catch(e){ ran=false; runErr=String(e && e.message || e); }
      const cells=[...document.querySelectorAll('.lobby-table tbody tr')]
        .map(tr=>tr.querySelectorAll('td')[2])
        .filter(Boolean).map(td=>(td.textContent||'').trim()).filter(Boolean);
      const by={};
      cells.forEach(c=>{ by[c]=(by[c]||0)+1; });
      const tables=document.querySelectorAll('.lobby-table').length;
      const screens=[...document.querySelectorAll('[id^=screen-]')].filter(x=>x.style.display!=='none').map(x=>x.id);
      const banked=!!document.querySelector('.cc-banked, #ccBanked');
      out.rows.push({reg:reg, size:careerSquadSize(), rows:cells.length, by:by, can:can, ran:ran, runErr:runErr, stage:ev.stage, tables:tables, screens:screens, banked:banked});
    }
  }catch(e){ out.err=String(e && e.message || e); }
  document.getElementById('__out').textContent='RTB'+JSON.stringify(out)+'RTE';
})();
` + '<' + '/' + 'script>';

const file = path.join(ROOT, '__rctbl.html');
fs.writeFileSync(file, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + file.split(path.sep).join('/')],
  {maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']});
fs.unlinkSync(file);
const m = /RTB(\{[^]*?\})RTE/.exec(dom);
if (!m) { console.error('проба не отчиталась'); process.exit(2); }
const o = JSON.parse(m[1]);
if (o.err) { console.error('ошибка: ' + o.err); process.exit(2); }
let bad = 0;
for (const r of o.rows) {
  const vals = Object.entries(r.by).sort((a, b) => b[1] - a[1]);
  const top = vals[0] || ['—', 0];
  const share = r.rows ? Math.round(top[1] / r.rows * 100) : 0;
  if (share >= 90) bad++;
  console.log('карьера ' + r.reg.padEnd(4) + ' новостей MVP ' + r.mvp + ', про финал ' + r.champ + ' | состав ' + r.size + '  этап ' + r.stage + '  допуск ' + r.can + (r.runErr ? '  ОШИБКА: ' + r.runErr : '') + '  строк ' + String(r.rows).padStart(3) +
              '  колонка: ' + vals.map(([k, v]) => k + ' ' + v).join(', '));
}
console.log(bad ? '\nв колонке один регион на всю таблицу — отчёт подтверждается' :
                  '\nв колонке разные регионы');
process.exit(bad ? 1 : 0);
