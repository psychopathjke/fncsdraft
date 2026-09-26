// Кого сажает ЛАН круга Reload (тот самый «ewc lan» в словах игрока): весь мир
// или один регион?
//
// Отзыв 26 сентября, твит: «when I play the lan ewc it's always full of players
// from my region there I play with na west but it's the same when I play in oce
// eu na etc». Поле строится через ccAsWorld, значит по замыслу оно мировое —
// проба меряет, так ли это на самом деле, и делает это для трёх регионов.
//
//   node tools/rc-region-probe.js
const fs = require('fs'), os = require('os'), path = require('path');
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
(function(){
  const out={rows:[], err:null};
  try{
    const card=(h,o,reg)=>({handle:h, region:reg, rating:o, _ovr:o, nat:'de', tier:'ladder',
                            event:'ladder', placement:null, rarity:'common', partner:null});
    const seed=(reg,size)=>{
      localStorage.setItem('fncsdraft_career', JSON.stringify({
        v:1, player:{nick:'Probe', age:20, source:'rookie', country:'de', countryPing:15,
          closeRangeEdge:6, region:reg, ovr:96, role:'roleIGL', attrs:null, ageEdge:4,
          photo:null, handle:null, cardRegion:null, nat:null},
        career:{season:1, size:size, year:2026, year0:2026, day:'2026-08-20', division:1,
                earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'rcreg'},
        partner:{card:card('Mate',94,reg), patience:60, since:'2026-01-01', dev:0},
        partners:[{card:card('Mate',94,reg), patience:60, since:'2026-01-01', dev:0}]}));
      const s=JSON.parse(localStorage.getItem('fncsdraft_career'));
      s.player.attrs=ccRookieAttrs(96,'roleIGL');
      localStorage.setItem('fncsdraft_career', JSON.stringify(s));
      careerEntry();
    };
    const cardsOf=t=>(t && (t.squad||t._cards||t.cards)) || [];
    [['EU',2],['NAW',2],['OCE',2],['EU',3],['NAW',3],['OCE',3]].forEach(pair=>{
      const reg=pair[0], size=pair[1];
      seed(reg,size);
      const cr=CAREER.career;
      const worldCr=Object.assign({}, cr, {division:1});
      const drafted=[];
      const field=ccRcField(cr, worldCr, drafted, 'final', ccTeams(20));
      const by={};
      field.forEach(t=>cardsOf(t).forEach(c=>{ const r=(c && c.region)||'?'; by[r]=(by[r]||0)+1; }));
      const cell={};
      field.forEach(t=>{ const r=t.summitRegion || (t.squad&&t.squad[0]||{}).region || '(пусто)'; cell[r]=(cell[r]||0)+1; });
      out.rows.push({reg:reg, size:size, teams:field.length, by:by, cell:cell});
    });
  }catch(e){ out.err=String(e && e.message || e); }
  document.getElementById('__out').textContent='RCB'+JSON.stringify(out)+'RCE';
})();
<\/script>`;

const tmp = path.join(os.tmpdir(), 'rc-region-' + Date.now() + '.html');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
fs.writeFileSync(path.join(ROOT, '__rcregion.html'), html + BOOT.split('<\/script>').join('</' + 'script>'));
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=120000', '--dump-dom',
  'file:///' + path.join(ROOT, '__rcregion.html').split(path.sep).join('/')],
  {maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']});
fs.unlinkSync(path.join(ROOT, '__rcregion.html'));
const m = /RCB(\{[^]*?\})RCE/.exec(dom);
if (!m) { console.error('проба не отчиталась'); process.exit(2); }
const o = JSON.parse(m[1]);
if (o.err) { console.error('ошибка: ' + o.err); process.exit(2); }
let bad = 0;
for (const r of o.rows) {
  const total = Object.values(r.by).reduce((a, b) => a + b, 0);
  const own = r.by[r.reg] || 0;
  const share = total ? Math.round(own / total * 100) : 0;
  if (share >= 80) bad++;
  console.log('карьера ' + r.reg.padEnd(4) + (r.size===3?' трио':' дуо ') + ' команд ' + String(r.teams).padStart(3) +
              '  свой регион ' + String(share).padStart(3) + '%   ' +
              Object.entries(r.by).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + v).join(', '));
  console.log('        колонка «Регион» в таблице: ' + Object.entries(r.cell||{}).sort((a,b)=>b[1]-a[1]).map(([k,v])=>k+' '+v).join(', '));
}
console.log(bad ? '\nЛАН собирается из своего региона — отчёт игрока подтверждается' :
                  '\nЛАН мировой: в поле все регионы');
process.exit(bad ? 1 : 0);
