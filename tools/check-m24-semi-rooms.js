// Полуфинал Мейджора 2024 — комнаты по дням (тестер, Notion «fncsdraft» 7.10: «во второй день полуфинала
// всего 35 команд, в третий 25, и они все в финал проходят»).
// Liquipedia, FNCS 2024 Major 1 Europe: Upper Round 1/2/3 — team_number=50 каждый день, Lower Round 3 — 50;
// проходят 5 + 5 (победы) + топ-25 верхней и топ-15 нижней. «Duos that place 26th-50th in Upper Rounds 1 and 2
// will be relegated to Lower Rounds 2 and 3» — освободившиеся места верхней занимают лучшие нижней.
// Правило: верхняя каждый день 50 (±0), в третий день верхней проходят не все, нижняя в третий день 40–60.
//   node tools/check-m24-semi-rooms.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(String.fromCharCode(92)).join('/');
const CH = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => fs.existsSync(p));
const BOOT = `<pre id="__out" style="display:none"></pre><script>window.addEventListener('load',()=>setTimeout(()=>{ const out={fails:[], notes:{}};
try{
  const card=(h,o)=>({handle:h, region:'EU', rating:o, _ovr:o, nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
  const seed=(day)=>{
    localStorage.setItem('fncsdraft_career', JSON.stringify({v:1, player:{nick:'Semis', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6, region:'EU', ovr:90, role:'roleIGL', attrs:null, ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, size:2, year:2024, year0:2024, day:day, division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'m24s'},
      partner:{card:card('M1',88), patience:60, since:'2023-11-01', dev:0}, partners:[{card:card('M1',88), patience:60, since:'2023-11-01', dev:0}]}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career')); s.player.attrs=ccRookieAttrs(90,'roleIGL'); localStorage.setItem('fncsdraft_career', JSON.stringify(s)); careerEntry(); };
  seed('2024-02-20');
  const m=ccM24State(1);
  // Таблица серии на 300 строк из сцены: посев сеток как после двух квалификаторов.
  ccM23World(320, 'm24semis-check').forEach((t,i)=>{ const k=ccSeatKey(t); if(m.series[k]!=null) return; m.series[k]=1000-i; m.seriesRows[k]=ccMajorSeatRow(t); });
  ccM24Brackets(m);
  const sizes={upper:[], lower:[]};
  for(let r=1;r<=3;r++){ ['upper','lower'].forEach(b=>{ sizes[b].push(ccM24Room(m, b, r).length); ccM24Settle(m, b, r); }); }
  out.notes=sizes; out.notes.tickets=(m.upper.tickets||[]).length; out.notes.gf=ccM24GfRows(m).length;
  sizes.upper.forEach((n,i)=>{ if(n!==50) out.fails.push('верхняя, день '+(i+1)+': '+n+' дуо, у Epic 50'); });
  if(sizes.upper[2]<=CC_M24.upper[3].cut) out.fails.push('верхняя, день 3: проходят все ('+sizes.upper[2]+' при топ-'+CC_M24.upper[3].cut+')');
  if(sizes.lower[2]<40 || sizes.lower[2]>60) out.fails.push('нижняя, день 3: '+sizes.lower[2]+' дуо, у Epic 50');
  if(out.notes.gf!==50) out.fails.push('финал: '+out.notes.gf+' дуо');
}catch(e){ out.fails.push(String(e.stack||e)); }
document.getElementById('__out').textContent='@@B@@'+encodeURIComponent(JSON.stringify(out))+'@@E@@'; }, 500));<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'm24s-')), tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CH, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--virtual-time-budget=120000', '--dump-dom', 'file:///' + tmp.split(String.fromCharCode(92)).join('/')], { maxBuffer: 1 << 30, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const out = JSON.parse(decodeURIComponent(dom.match(/@@B@@([^@<]*)@@E@@/)[1]));
if (out.fails.length) { console.log(['FAIL ' + JSON.stringify(out.notes)].concat(out.fails).join(String.fromCharCode(10))); process.exit(1); }
console.log('OK полуфинал 2024 по дням ' + JSON.stringify(out.notes));
