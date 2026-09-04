// ДРАФТ: один ник в двух регионах — его игрок, 4 сентября: «и cooper с reet есть
// и на NAC и на NAW».
//
// Проба смотрит мировой пул карьеры и печатает ники, которые встречаются больше
// чем в одном регионе: сколько таких всего, кто именно и с какими рейтингами.
// Плюс отдельно — попадают ли они дважды в одну комнату (зал мирового ЛАНа).
//
//   node tools/dup-region-probe.js
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
  const out={dups:[], rooms:[], err:null};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({v:1,
      player:{nick:'Dup', age:19, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:0, region:'EU', ovr:90, role:'roleIGL',
              attrs:ccRookieAttrs(90,'roleIGL'), ageEdge:0, photo:null, handle:null,
              cardRegion:null, nat:null},
      career:{season:1, day:'2026-03-02', division:1, earnings:0, balance:0, reach:9000,
              tokens:[], log:[], news:[]},
      partners:[]}));
    careerLoad();
    const ovr=c=>{ const a=attrsFor(c)||{}; return Math.round(c._ovr!=null?c._ovr:(a.ovr||0)); };
    // Ростер мира так, как его видит карьера.
    const by={};
    (typeof PLAYERS!=="undefined"?PLAYERS:[]).forEach(c=>{
      const k=String(c.handle||'').toLowerCase();
      const r=String(c.region||'?');
      (by[k]=by[k]||{})[r]=ovr(c);
    });
    Object.keys(by).forEach(k=>{
      const regs=Object.keys(by[k]);
      if(regs.length>1) out.dups.push({handle:k, regs:by[k]});
    });
    out.dups.sort((a,b)=>Object.keys(b.regs).length-Object.keys(a.regs).length);
    // И в одной комнате: зал мирового ЛАНа.
    const me=careerCard();
    const you=careerYouTeam([me]); you.isYou=true;
    const field=careerGlobalsField(you, [me], null);
    const seen={};
    field.forEach(t=>(t.squad||[]).forEach(c=>{
      const k=String(c.handle||'').toLowerCase();
      seen[k]=(seen[k]||0)+1;
    }));
    Object.keys(seen).forEach(k=>{ if(seen[k]>1) out.rooms.push(k+' ×'+seen[k]); });
  }catch(e){ out.err=String(e&&e.stack||e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dupreg-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log('ников в двух и более регионах: ' + out.dups.length);
out.dups.slice(0, 40).forEach(d =>
  console.log('  ' + d.handle + '  ' + Object.keys(d.regs).map(r => r + ':' + d.regs[r]).join('  ')));
console.log('дважды в одной комнате (зал ЛАНа): ' + (out.rooms.length ? out.rooms.join(', ') : 'нет'));
