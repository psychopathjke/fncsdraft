// Попроситься третьим к готовой паре (игрок, Notion «05», 5.10.2026: «for trios, you could go to the
// other two people instead of one person necessarily having to come to you»).
//  1. В поиске трио-года есть вид «Пары»: дуо своей сцены без третьего или с третьим слабее тебя;
//  2. согласие пары сажает обоих в состав, их бывший третий свободен (cr.trios, ccSquadMatesOf);
//  3. отказ ничего не меняет в составе;
//  4. в состав другого формата (CC_DUO_FMT=3 в дуо-год) пара садится через t.fmtPair, состав года не тронут.
//
//   node tools/check-career-trio-join.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');
const SL = String.fromCharCode(92);
const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={fails:[], notes:{}, err:null, errs:[]};
  window.addEventListener('error', e=>{ out.errs.push(String(e.message)+' @'+e.lineno); });
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  try{
    const card=(h, o)=>({handle:h, region:'EU', rating:o, _ovr:o, nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
    const P=c=>({card:c, patience:60, since:'2023-11-01', dev:0});
    const seed=(cr)=>{
      localStorage.setItem('fncsdraft_career', JSON.stringify({
        v:1, player:{nick:'Join', age:20, source:'rookie', country:'ru', countryPing:15, closeRangeEdge:6,
          region:'EU', ovr:85, role:'roleIGL', attrs:null, ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
        career:Object.assign({division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'join'}, cr),
        partner:P(card('M1',85)), partners:[P(card('M1',85))]}));
      const s=JSON.parse(localStorage.getItem('fncsdraft_career')); s.player.attrs=ccRookieAttrs(85,'roleIGL');
      localStorage.setItem('fncsdraft_career', JSON.stringify(s));
      CC_POOLS=null; careerLoad(); careerMigrateSize();
    };
    LANG='ru'; CC_L_CACHE={};
    // Трио-год: карьера 2024-го перешла в 2025-й (настоящие тройки в cr.trios).
    seed({season:1, size:2, year:2024, year0:2024, day:'2024-09-08', seasonOver:true});
    careerNewSeason();
    const cr=CAREER.career;
    check('трио-год', careerSquadSize()===3, String(careerSquadSize()));
    CAREER.player.ovr=99; CAREER.player.ovrExact=99;
    // 1. Вид «Пары» в поиске.
    ccDuoFindOpen(null);
    check('вид «Пары» доступен в трио-год', ccDuoPairsOn());
    const body0=document.getElementById('duoFindBody').innerHTML;
    check('кнопка вида «Пары» в окне', /cc-join-tab/.test(body0));
    ccDuoFindView('pairs');
    const rowsN=document.querySelectorAll('#duoFindBody .cc-join-pair').length;
    const btnN=document.querySelectorAll('#duoFindBody .cc-join-ask').length;
    check('пары показаны с кнопкой «Попроситься третьим»', rowsN>=5 && btnN>=1, rowsN+'/'+btnN);
    ccDuoFindClose();
    const pairs=ccJoinPairs(), me=ccJoinMeOvr();
    const bad=pairs.filter(p=>p.third && !(p.tOvr<me));
    check('в списке только пары без третьего или с третьим слабее тебя', !bad.length, bad.slice(0,3).map(p=>p.key).join(', '));
    const withThird=pairs.filter(p=>p.third);
    out.notes.pairs={n:pairs.length, withThird:withThird.length, me};
    check('пары с третьим есть (настоящие тройки 2025-го)', withThird.length>=3, String(withThird.length));
    // Пара, чьи роли садятся с твоей: в ней нет второго ИГЛа.
    const fits=p=>ccSquadRoleFits([ccRoleNow(), attrsFor(p.a).roleKey, attrsFor(p.b).roleKey], 3);
    let p=withThird.find(fits);
    if(!p){ const x=withThird[0]; ccRoleSwitch(ccRoleNow()==='roleIGL' ? 'roleFRG' : 'roleIGL'); p=fits(x) ? x : null; }
    check('нашлась пара, к которой садится твоя роль', !!p);
    if(p){
      const thirdH=p.third.handle;
      // 3. Отказ (запас отрицательный) — состав прежний.
      const mates0=careerMates().map(m=>hKey(m)).join(',');
      CAREER.dmBoost=-500;
      ccJoinAsk(p.key);
      const tNo=careerDmFind(p.a.handle);
      out.notes.no=tNo && tNo.msgs.map(m=>m.k);
      check('отказ: ветка закрыта ответом', tNo && tNo.state==='declined', tNo && tNo.state);
      check('отказ: состав не тронут', careerMates().map(m=>hKey(m)).join(',')===mates0);
      check('отказ: третий пары на месте', cr.trios[p.key]===p.thirdKey);
      // 2. Согласие — оба садятся, третий свободен.
      CAREER.dmBoost=0;
      tNo.state='open';
      const again=ccJoinPairs().find(x=>x.key===p.key);
      check('пара всё ещё в списке после отказа', !!again);
      ccJoinAsk(p.key);
      const t=careerDmFind(p.a.handle);
      out.notes.yes=t && t.msgs.slice(-2).map(m=>m.k);
      check('согласие: ветка ждёт подтверждения', t && t.state==='offer', t && t.state);
      careerDmAccept(t.id);
      const now=careerMates().map(m=>hKey(m)).sort().join('+');
      out.notes.squad=careerMates().map(m=>m.handle);
      check('согласие: в составе оба из пары', now===p.key, now+' vs '+p.key);
      check('согласие: ветка — напарник', t.state==='partner', t.state);
      check('бывший третий: снят с тройки', !cr.trios[p.key], String(cr.trios[p.key]));
      CC_POOLS=null;
      const m3=ccSquadMatesOf(thirdH);
      check('бывший третий свободен', !m3.length, m3.map(c=>c.handle).join(','));
      check('пары больше нет в списке', !ccJoinPairs().some(x=>x.key===p.key));
      check('новость о тройке', (cr.news||[]).some(n=>n.k==='ccNewsSquadNew' && n.a && n.a[0]==='TRIO'));
    }
    // 4. Состав другого формата: дуо-год, трио-кап.
    seed({season:1, size:2, year:2026, year0:2026, day:'2026-03-01'});
    CAREER.player.ovr=99; CAREER.player.ovrExact=99;
    const year0=careerMates().map(m=>hKey(m)).join(',');
    ccDuoFindOpen(null, 3);
    check('формат трио в дуо-год: вид «Пары» есть', ccDuoPairsOn());
    const fp=ccJoinPairs()[0];
    check('формат трио: пары есть', !!fp);
    if(fp){
      ccJoinAsk(fp.key);
      const ft=careerDmFind(fp.a.handle);
      check('формат трио: согласие и t.fmtPair', ft && ft.state==='offer' && ft.fmt===3 && hKey({handle:ft.fmtPair})===hKey(fp.b), ft && (ft.state+'/'+ft.fmt+'/'+ft.fmtPair));
      careerDmAccept(ft.id);
      const ros=((CAREER.rosters||{})[3]||[]).map(r=>hKey(ccMateCardOf(r)||{handle:''})).sort().join('+');
      check('формат трио: оба в составе формата', ros===fp.key, ros+' vs '+fp.key);
      check('формат трио: состав года не тронут', careerMates().map(m=>hKey(m)).join(',')===year0);
    }
    ccDuoFindClose();
    check('без ошибок JS', out.errs.length===0, out.errs.slice(0,3).join(' | '));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cctriojoin-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(SL).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const html = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.split(SL).join('/')], { maxBuffer: 1 << 28, timeout: 1500000, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
const m = /PBEGIN(.*?)PEND/.exec(html);
if (!m) { console.log('FAIL: no result'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out.notes));
if (out.errs && out.errs.length) out.errs.slice(0, 5).forEach(e => console.log('JSERR ' + e.slice(0, 400)));
if (out.err) { console.log('ERR ' + out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
fs.rmSync(dir, { recursive: true, force: true });
console.log('OK check-career-trio-join');
