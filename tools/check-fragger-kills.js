// Фраггер в паре выбивает больше напарника (тестер, Notion «fncsdraft» 7.10: «чтобы у фрагера больше киллов было»).
// AIM в четвёртой степени перебивал роль: ИГЛ с AIM 99 брал 70 % элимов у фраггера с AIM 76.
// Правило: в паре с ОДНИМ фраггером его доля и в раскладке элимов (ccKillWeights), и в боевых статах
// (playerRoleShares с CC_KILL_ROLE_W) больше половины. Два фраггера (или ни одного) решает AIM, как было.
//   node tools/check-fragger-kills.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(String.fromCharCode(92)).join('/');
const CH = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => fs.existsSync(p));
const BOOT = `<pre id="__out" style="display:none"></pre><script>window.addEventListener('load',()=>setTimeout(()=>{ const out={fails:[], n:0, low:0, p50:null, twoFrg:null};
try{
  const ro=careerRosterNowEU(), byKey=new Map(ro.map(c=>[hKey(c),c])), seen=new Set(), sh=[], twin=[];
  TEAMMATE_GROUPS.forEach(g=>{ if(g.length!==2) return;
    const a=byKey.get(hKey({handle:g[0]})), b=byKey.get(hKey({handle:g[1]})); if(!a||!b) return;
    const k=[hKey(a),hKey(b)].sort().join('|'); if(seen.has(k)) return; seen.add(k);
    const r=[a,b].map(c=>attrsFor(c).roleKey), nf=r.filter(x=>x==='roleFRG').length;
    const w=ccKillWeights([a,b]);
    if(nf===2){ twin.push(Math.max(w[0],w[1])/(w[0]+w[1])); return; }
    if(nf!==1) return;
    const fi=r[0]==='roleFRG'?0:1, s=w[fi]/(w[0]+w[1]); sh.push(s);
    const ps=playerRoleShares({squad:[a,b]}, CC_KILL_ROLE_W)[fi];
    if(s<=0.5 || ps<=0.5){ out.low++; if(out.low<=6) out.fails.push(a.handle+' & '+b.handle+': у фраггера '+Math.round(s*100)+'% элимов, '+Math.round(ps*100)+'% боевых статов'); }
  });
  sh.sort((x,y)=>x-y); twin.sort((x,y)=>x-y);
  out.n=sh.length; out.p50=sh[Math.floor(sh.length/2)]; out.twoFrg=twin[Math.floor(twin.length/2)];
  if(out.n<100) out.fails.push('пар с одним фраггером всего '+out.n);
  if(out.p50>0.9) out.fails.push('медианная доля фраггера '+Math.round(out.p50*100)+'% — напарник почти без элимов');
}catch(e){ out.fails.push(String(e.stack||e)); }
document.getElementById('__out').textContent='@@B@@'+encodeURIComponent(JSON.stringify(out))+'@@E@@'; }, 500));<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'frg-')), tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CH, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--virtual-time-budget=60000', '--dump-dom', 'file:///' + tmp.split(String.fromCharCode(92)).join('/')], { maxBuffer: 1 << 30, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const out = JSON.parse(decodeURIComponent(dom.match(/@@B@@([^@<]*)@@E@@/)[1]));
const note = 'пар ' + out.n + ', ниже половины ' + out.low + ', медиана ' + Math.round((out.p50 || 0) * 100) + '%, два фраггера — ' + Math.round((out.twoFrg || 0) * 100) + '%';
if (out.fails.length) { console.log(['FAIL ' + note].concat(out.fails).join(String.fromCharCode(10))); process.exit(1); }
console.log('OK фраггер выбивает больше: ' + note);
