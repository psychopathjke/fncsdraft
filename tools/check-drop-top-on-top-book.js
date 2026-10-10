// Сильные не делят точку весь сезон и с книгой высадок (тестер, Notion «10.10»: «все самые сильные друг другу руинят FNCS,
// из-за того что падают друг на друга»). Книга помнит первую точку команды, и двое топов, севших вместе в первый вечер,
// делили её весь сезон: обмен не трогал хозяев, а с книгой хозяин — почти каждый. Было ~2 коробки с парой топ-10 на лобби
// и 8–13 пар вместе 6+ турниров из 12 на остров; без книги — ноль.
// Поле 50 дуо, 8 сезонов по 12 турниров на четырёх островах: пар топ-10 в коробке не больше 0,4 на турнир,
// пар, просидевших вместе полсезона, не больше двух на остров.
//   node tools/check-drop-top-on-top-book.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(String.fromCharCode(92)).join('/');
const CH = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => fs.existsSync(p));
const BOOT = `<pre id="__out" style="display:none"></pre><script>window.addEventListener('load',()=>setTimeout(()=>{ const out={fails:[], sets:{}};
try{
  ['f1','f2','m2','t3'].forEach(set=>{
    try{ useLandingSet(set); }catch(e){ return; } if(!ALL_LANDING_ZONES.length) return;
    let ev=0, tt=0, stuck=0;
    for(let seed=0; seed<8; seed++){
      useLandingSet(set);
      const rnd=careerRng(ccHashStr('btt|'+set+'|'+seed));
      const days=[]; for(let e=0;e<12;e++) days.push('2024-0'+(1+(e%9))+'-1'+(e%10));
      CAREER={career:{season:1, day:days[0]}};
      const field=[]; for(let i=0;i<50;i++) field.push({name:'T'+seed+'_'+i, pow:60+rnd()*60, closeEdge:0, stagePts:0, squad:[{handle:'s'+seed+'a'+i, rating:80},{handle:'s'+seed+'b'+i, rating:80}]});
      const base=new Map(field.map(t=>[t, t.pow])), top=new Set(field.slice().sort((a,b)=>base.get(b)-base.get(a)).slice(0,10)), seen={};
      for(let e=0;e<12;e++){
        CAREER.career.day=days[e]; field.forEach(t=>{ t.pow=base.get(t); t.stagePts=rnd()*100; });
        CC_DROP_STAGE=days[e]+'|1|s1|total';
        buildBotLandingAssignment(field).zoneGroups.forEach(list=>{ const ts=list.filter(t=>top.has(t));
          if(ts.length>=2){ tt++; const k=ts.map(t=>t.name).sort().join('+'); seen[k]=(seen[k]||0)+1; } });
        ev++;
      }
      stuck+=Object.values(seen).filter(n=>n>=6).length;
    }
    out.sets[set]={perEvent:+(tt/ev).toFixed(3), stuck};
    if(tt/ev>0.4) out.fails.push(set+': пар топ-10 в коробке '+(tt/ev).toFixed(2)+' на турнир');
    if(stuck>2) out.fails.push(set+': пар топ-10 вместе 6+ турниров из 12 — '+stuck);
  });
  if(!Object.keys(out.sets).length) out.fails.push('ни одного острова');
}catch(e){ out.fails.push(String(e.stack||e)); }
document.getElementById('__out').textContent='@@B@@'+encodeURIComponent(JSON.stringify(out))+'@@E@@'; }, 500));<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ttb-')), tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CH, ['--headless=new', '--user-data-dir=' + path.join(dir, 'u'), '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom', 'file:///' + tmp.split(String.fromCharCode(92)).join('/')], { maxBuffer: 1 << 30, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const m = dom.match(/@@B@@([^@<]*)@@E@@/);
if (!m) { console.log('FAIL нет ответа'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.fails.length) { console.log(['FAIL ' + JSON.stringify(out.sets)].concat(out.fails).join(String.fromCharCode(10))); process.exit(1); }
console.log('OK сильные не делят точку и с книгой ' + JSON.stringify(out.sets));
