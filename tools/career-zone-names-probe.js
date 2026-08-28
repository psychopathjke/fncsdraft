// Колонка имён в зоне держится вместимости коробки, хвост — одной строкой «+N».
//
// Его скрин, 23 августа: пикер дропа на плей-ине в две сотни команд писал
// каждое имя каждой «выбравшей раньше» пары — четыре сотни подписей поверх
// всей карты, и ни одну не прочитать. Колонка теперь капается тем, что
// коробка вмещает читаемым (cap = zone.h*0.92/1.2, не меньше 4 строк),
// остальное сворачивается в «+N»; своя строка (isYou) переживает срез.
//
//   node tools/career-zone-names-probe.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const HEAD = `<script>
window.__errs = [];
window.addEventListener('error', function(e){ window.__errs.push(String(e.message) + ' @' + e.lineno); });
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {errs:null, fail:null};
  try{
    useLandingSet('m2');
    const duo=(a,b,you)=>({name:a+' & '+b, isYou:!!you, squad:[{handle:a},{handle:b}]});
    const mk=(zone)=>{ const el=document.createElement('div'); el.style.position='relative'; return el; };
    const zone=ALL_LANDING_ZONES.find(z=>z.h>=8) || ALL_LANDING_ZONES[0];

    // Маленькая группа — все имена на месте, хвоста нет.
    const small=mk();
    fillZoneNames(small, [duo('Queasy','Malibuca'), duo('Setty','Kami')], zone);
    const smallTexts=[...small.children].map(e=>e.title);
    out.small={lines:small.children.length, plus:smallTexts.some(t=>/^\\+\\d+$/.test(t))};

    // Плей-ин: двенадцать пар в одну коробку. Раньше — 24 строки, теперь
    // потолок коробки и «+N», и сумма имён с хвостом сходится с полем.
    const teams=[]; for(let i=0;i<12;i++) teams.push(duo('Bot'+i,'Pal'+i, i===9));
    const big=mk();
    fillZoneNames(big, teams, zone);
    const texts=[...big.children].map(e=>e.title);
    const cap=Math.max(4, Math.floor((zone.h*0.92)/1.2));
    const tail=texts[texts.length-1], m=tail.match(/^\\+(\\d+)$/);
    // Срез не рвёт пару: каждый показанный Bot_i идёт со своим Pal_i.
    const names=texts.slice(0, texts.length-1);
    let whole=names.length%2===0;
    for(let i=0;i<names.length;i+=2)
      whole=whole && names[i].replace('Bot','')===names[i+1].replace('Pal','');
    out.big={zoneH:zone.h, cap:cap, lines:texts.length,
             capped:texts.length<=cap,
             tailPlus:!!m,
             sums: m ? (texts.length-1)+Number(m[1])===24 : false,
             wholeTeams:whole,
             youKept:[...big.children].some(e=>e.className.indexOf('zone-name-you')>=0)};
  } catch(e){ out.fail=String(e && e.stack || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cczone-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=60000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out, null, 2));
const ok = !out.fail && (out.errs||[]).length===0 &&
  out.small.lines===4 && out.small.plus===false &&
  out.big.capped===true && out.big.tailPlus===true && out.big.sums===true &&
  out.big.wholeTeams===true && out.big.youKept===true;
console.log(ok ? 'OK' : 'FAIL');
process.exit(ok ? 0 : 1);
