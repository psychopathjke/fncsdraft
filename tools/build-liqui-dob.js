// Сопоставление дат рождения Liquipedia (tools/measured/liqui-dob-raw.json) с игроками данных и впайка
// в index.html как CC_BORN_LQ. Правило то же, что у CC_BORN: дата ставится, только если страна
// страницы Liquipedia совпадает со страной карточки (ник — не человек: Chap из США ≠ наш Chap из Швейцарии).
// Ник без страны на карточке — по совпадению ника, если он единственный в данных.
//   node tools/build-liqui-dob.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(String.fromCharCode(92)).join('/');
const CH = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => fs.existsSync(p));
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'measured', 'liqui-dob-raw.json'), 'utf8'));
const BOOT = `<pre id="__out" style="display:none"></pre><script>window.addEventListener('load',()=>setTimeout(()=>{
const RAW=${JSON.stringify(raw)};
const en={}; Object.keys(CC_NAMES.en||{}).forEach(code=>{ en[String(CC_NAMES.en[code]).toLowerCase()]=code; });
const dn=new Intl.DisplayNames(['en'], {type:'region'}); Object.keys(CC_NAT_BY_CODE).forEach(code=>{ try{ const n=dn.of(String(code).toUpperCase()); if(n && !en[n.toLowerCase()]) en[n.toLowerCase()]=code; }catch(e){} });
const alias={'united states':'us','usa':'us','united kingdom':'gb','england':'gb-eng','scotland':'gb-sct','wales':'gb-wls','south korea':'kr','russia':'ru','czech republic':'cz','czechia':'cz','turkey':'tr','türkiye':'tr'};
const byKey=new Map(); PLAYERS.forEach(p=>{ if(!p||!p.handle) return; const k=hKey(p); const l=byKey.get(k)||[]; if(!l.some(x=>x.region===p.region && x.nat===p.nat)) l.push({region:p.region, nat:p.nat}); byKey.set(k, l); });
const out={}, stat={raw:RAW.length, matched:0, natMismatch:0, noHandle:0, noNat:0};
RAW.forEach(r=>{
  const c=String(r.country||'').toLowerCase().replace(/\\{\\{.*?\\}\\}/g,'').trim();
  const code=alias[c]||en[c]||null; const ru=code ? (CC_NAT_BY_CODE[code]||CC_NAT_BY_CODE[ccCountryOf(code)]||null) : null;
  const keys=[r.id, r.title].concat(String(r.ids||'').split(',')).map(x=>String(x||'').trim().toLowerCase()).filter(Boolean);
  let hit=false;
  [...new Set(keys)].forEach(k=>{ const l=byKey.get(k); if(!l) return;
    const ok=l.filter(x=>x.nat ? (ru && x.nat===ru) : l.length===1);
    if(!ok.length){ if(l.some(x=>x.nat)){ stat.natMismatch++; const pk=c+' → '+(ru||'?')+' ≠ '+l.map(x=>x.nat).join('/'); stat.mm=stat.mm||{}; stat.mm[pk]=(stat.mm[pk]||0)+1; } return; }
    hit=true;
    if(l.length===1 || ok.length===l.length) out[k]=r.born; else ok.forEach(x=>{ out[x.region+'|'+k]=r.born; });
  });
  if(hit) stat.matched++; else if(!keys.some(k=>byKey.has(k))) stat.noHandle++;
});
document.getElementById('__out').textContent='@@B@@'+encodeURIComponent(JSON.stringify({out, stat}))+'@@E@@'; }, 500));<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ldob-')), tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CH, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--virtual-time-budget=120000', '--dump-dom', 'file:///' + tmp.split(String.fromCharCode(92)).join('/')], { maxBuffer: 1 << 30, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const { out, stat } = JSON.parse(decodeURIComponent(dom.match(/@@B@@([^@]*)@@E@@/)[1]));
fs.writeFileSync(path.join(__dirname, 'measured', 'liqui-dob.json'), JSON.stringify(out));
console.log(JSON.stringify(stat), 'keys', Object.keys(out).length);
// Впайка: одна строка const CC_BORN_LQ={...}; сразу после CC_BORN (заменяет прежнюю, если была).
const f = path.join(ROOT, 'index.html');
let s = fs.readFileSync(f, 'utf8');
const line = 'const CC_BORN_LQ=' + JSON.stringify(out) + ';   // даты рождения с Liquipedia (tools/build-liqui-dob.js), страна страницы = страна карточки';
if (/\nconst CC_BORN_LQ=.*\n/.test(s)) s = s.replace(/\nconst CC_BORN_LQ=.*\n/, () => '\n' + line + '\n');
else { const at = s.indexOf('\nfunction ccBornOf('); if (at < 0) throw new Error('ccBornOf not found'); s = s.slice(0, at) + '\n' + line + s.slice(at); }
fs.writeFileSync(f, s);
console.log('patched index.html');
