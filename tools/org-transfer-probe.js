// Меняются ли клубы у настоящих игроков от сезона к сезону.
//
// Его слово, 27 августа: «пусть организации меняются у настоящих игроков, не
// часто конечно, но чтоб трансферы были», и следом «пусть большинство
// контрактов будет на год».
//
// Печатается доля сменивших клуб за каждое межсезонье и путь верхушки поимённо.
//
//   node tools/org-transfer-probe.js [папка сборки]

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
(function(){
  const out={err:null, seasons:[], top:{}, move:null};
  try{
    const seed=(season)=>{
      localStorage.setItem('fncsdraft_career', JSON.stringify({
        v:1, player:{nick:'Org', age:20, source:'rookie', country:'de', countryPing:15,
          closeRangeEdge:0, region:'EU', ovr:93, role:'roleIGL',
          attrs:ccRookieAttrs(93,'roleIGL'), ageEdge:0, photo:null,
          handle:null, cardRegion:null, nat:null},
        career:{season:season, day:'2026-02-02', division:1, earnings:0, balance:0,
                reach:9000, tokens:[], log:[], news:[], seed:'fixed-world'},
        partners:[]}));
      careerLoad();
      ccWorldReset();
    };
    out.move=(typeof CC_ORG_MOVE!=='undefined') ? CC_ORG_MOVE : null;

    const watchNames=['Shxrk','t3eny','Scroll','Sky','Malibuca','vic0','Pixie','SwizzY'];
    let prev=null;
    for(let s=1;s<=6;s++){
      seed(s);
      const roster=ccSceneRoster('EU');
      const map=new Map();
      roster.forEach(c=>{ if(c && c.handle) map.set(hKey(c), c.org||null); });
      let moved=0, both=0;
      if(prev){
        map.forEach((org,k)=>{ if(!prev.has(k)) return; both++;
                               if((prev.get(k)||'')!==(org||'')) moved++; });
      }
      out.seasons.push({сезон:s, год:2025+s, вРостере:map.size,
                        сменили: prev ? moved : 0,
                        доля: (prev && both) ? Math.round(moved/both*100)+'%' : '—'});
      watchNames.forEach(n=>{ const o=map.get(hKey({handle:n}));
                              (out.top[n]=out.top[n]||[]).push(o||'—'); });
      prev=map;
    }
  }catch(e){ out.err=String(e&&e.stack||e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'orgxfer-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=600000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')],
  {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log('CC_ORG_MOVE = ' + out.move);
console.log('');
console.log('сезон  год    в ростере   сменили клуб');
out.seasons.forEach(r => console.log('  ' + String(r.сезон).padStart(2) + '   ' + r.год +
  '      ' + String(r.вРостере).padStart(4) + '        ' + String(r.сменили).padStart(3) + '  (' + r.доля + ')'));
console.log('');
Object.keys(out.top).forEach(n => console.log('  ' + n.padEnd(10) + out.top[n].join('  →  ')));
