// Ценность ходов по ситуации (ccSitValue): у каждой остановки есть лучший ход, ни один не лучший всегда.
//   node tools/check-career-sit-values.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');
const BOOT = `<pre id="__out" style="display:none"></pre><script>
window.addEventListener("load", function(){ setTimeout(async function(){
  const out={fails:[], errs:[], notes:{}}; window.addEventListener('error', e=>out.errs.push(String(e.message)));
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  const tick=()=>new Promise(r=>setTimeout(r, 30));
  try{
    CAREER_RUN=CAREER_RUN||{};
    const best=(kind, sit)=>{ const ids=kind==='rot'?CC_SIT_ROT_IDS:kind==='end'?CC_SIT_END_IDS:CC_SIT_STANCE_IDS;
      return ids.filter(id=>ccSitAvail(kind, id, sit)).map(id=>({id, v:ccSitValue(kind, id, sit)})).sort((x,y)=>y.v-x.v); };
    const V=(k,id,s)=>ccSitValue(k,id,s);
    // Ротация.
    const far={dist:60, rNext:12, inside:false, away:true, mats:900, move:false};
    check('далеко: сразу лучше последних на 8+', V('rot','early',far)-V('rot','late',far)>=8, V('rot','early',far)+' '+V('rot','late',far));
    // По замеру движка поздний выход плох всегда, кроме случая без ресов.
    const near={dist:8, rNext:12, inside:true, away:false, mats:1500};
    check('в круге с ресами: со штормом', best('rot', near)[0].id==='with', JSON.stringify(best('rot', near)));
    const poorNear={dist:8, rNext:12, inside:true, away:false, mats:200, low:true};
    check('в круге без ресов: последними', best('rot', poorNear)[0].id==='late', JSON.stringify(best('rot', poorNear)));
    const gap=V('rot','late',poorNear)-V('rot','early',poorNear);
    check('отрыв от «сразу» 8..15', gap>=8 && gap<=15, String(gap));
    const moveFar=Object.assign({}, far, {move:true});
    check('далеко с мувментом: мувмент', best('rot', moveFar)[0].id==='move', JSON.stringify(best('rot', moveFar)));
    const nearMove=Object.assign({}, near, {move:true});
    check('рядом мувмент бесполезен', ccSitUseless('rot','move',nearMove)===true);
    check('без мувмента хода нет', ccSitAvail('rot','move',far)===false);
    // Концовка.
    const rich={mats:1500, ar:4, nearBy:2};
    check('богатый: высота', best('end', rich)[0].id==='hg', JSON.stringify(best('end', rich)));
    const poor={mats:200, low:true, heals:0};
    check('бедный: рефреш', best('end', poor)[0].id==='refresh', JSON.stringify(best('end', poor)));
    check('богатому рефреш бесполезен', ccSitUseless('end','refresh',rich)===true);
    check('третьить только при паре', ccSitAvail('end','third',rich)===false && ccSitAvail('end','third',Object.assign({pair:true}, rich))===true);
    // Стойка.
    const top={place:3}, bigPack={place:20, ar:5, mats:1500};
    check('высокое место: держать на 8+', V('stance','hold',top)-V('stance','push',top)>=8, V('stance','hold',top)+' '+V('stance','push',top));
    check('большой пак и низкое место: давить', V('stance','push',bigPack)>V('stance','hold',bigPack));
    // Zero Build.
    const zb0=CC_ZB; CC_ZB=true;
    check('ZB: рефреша нет', ccSitAvail('end','refresh',poor)===false);
    check('ZB: ценности конечны', CC_SIT_END_IDS.concat(CC_SIT_ROT_IDS).every(id=>isFinite(V(CC_SIT_END_IDS.indexOf(id)>=0?'end':'rot', id, poor))));
    CC_ZB=zb0;
    // Без доминанты: 500 случайных ситуаций.
    let seed=7; const rnd=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
    ['rot','end','stance'].forEach(k=>{ const cnt={}; for(let i=0;i<500;i++){
      const rN=5+rnd()*25, d=rnd()*60, m=Math.round(rnd()*1600);
      const sit={dist:d, rNext:rN, inside:d<rN, away:rnd()<0.5, edge:rnd()<0.3, mats:m, low:m<CC_MATS_LOW, heals:Math.floor(rnd()*4),
                 move:rnd()<0.4, ar:1+Math.floor(rnd()*5), nearBy:Math.floor(rnd()*20), pair:rnd()<0.3, place:1+Math.floor(rnd()*24), alive:25};   // места и теснота как в настоящих играх (career-sit-probe: место 6–20, рядом 3–24)
      const b=best(k, sit)[0].id; cnt[b]=(cnt[b]||0)+1; }
      out.notes[k]=cnt;
      Object.keys(cnt).forEach(id=>check(k+': '+id+' лучший не чаще 60%', cnt[id]<=300, JSON.stringify(cnt))); });
    // Факты на всех языках.
    const sit0={dist:30, rNext:12, inside:false, away:true, edge:true, mats:900, heals:2, move:true, ar:3, nearBy:3, pair:true, place:8};
    ['ru','en','fr','it','pt'].forEach(lg=>{ const T=Object.assign({}, I18N.en, I18N[lg]);
      [['rot',CC_SIT_ROT_IDS],['end',CC_SIT_END_IDS],['stance',CC_SIT_STANCE_IDS]].forEach(([k,ids])=>ids.forEach(id=>{
        const f=ccSitFacts(T, k, id, sit0); check(lg+' '+k+'.'+id+' факты', typeof f==='string' && f.length>3 && f.indexOf('—')<0, String(f)); }));
      check(lg+' sitUseless', typeof I18N[lg].sitUseless==='string'); });
  }catch(e){ out.fails.push('ERR '+(e && e.stack || e)); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
}, 800); });<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'csit-')), tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(path.sep).join('/') + '/">' + fs.readFileSync(process.env.INDEX || path.join(ROOT, 'index.html'), 'utf8').replace('</body>', BOOT + '</body>'));
let dom;
try {
  dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--user-data-dir=' + path.join(dir, 'prof'),
    '--virtual-time-budget=60000', '--dump-dom', 'file:///' + tmp.split(path.sep).join('/')], { maxBuffer: 1 << 30, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
} finally { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {} }
const m = dom.match(/BEGIN([\w%\-.!~*'()]*)END/);
if (!m) { console.error('no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out.notes));
if (out.errs.length) out.fails.push('ошибки страницы: ' + out.errs.join(' | '));
if (out.fails.length) { out.fails.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
console.log('OK ценность ходов по ситуации');
