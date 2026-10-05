// Карьера, перешедшая в следующий год, играет составами года календаря.
// Отзыв: «когда настоящий сезон 24 заканчивал и переходил в 25,
// чтобы триосы становились как в жизни, и потом когда из 25 года в 26».
// Решение: люди и рейтинги — свои (год, с которого карьера началась), а кто с
// кем играет — из записей года календаря (ccRealTeamDuos). Состав игрока не
// меняется.
//
//   node tools/check-career-real-teams.js
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
  const out={notes:{}, fails:[], err:null, errs:[]};
  window.addEventListener('error', e=>{ out.errs.push(String(e.message)+' @'+e.lineno); });
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  const card=(h, o)=>({handle:h, region:'EU', rating:o, _ovr:o, nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
  const seed=(c)=>{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Yearman', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6,
        region:'EU', ovr:90, role:'roleIGL', attrs:null, ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
      career:Object.assign({division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'realteams'}, c),
      partner:{card:card('M1',88), patience:60, since:'2023-11-01', dev:0}, partners:[{card:card('M1',88), patience:60, since:'2023-11-01', dev:0}]}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs=ccRookieAttrs(90, 'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerEntry();
    CC_POOLS=null; CC_NOW_CARDS={}; CC_EU_ALL={};
  };
  // Все записанные составы года: множество ключей «a|b|c» (отсортированных).
  const bookOf=(year, size)=>{
    const s=new Set();
    PLAYERS.forEach(p=>{
      if((p.region||'')!=='EU' || ccCardYear(p)!==year) return;
      rosterEntriesOf(p).forEach(({entry})=>{
        const hs=(entry.duo||[]).map(h=>hKey(h)).filter(Boolean);
        if(hs.length===size) s.add(hs.slice().sort().join('|'));
        if(hs.length>=2){ for(let i=0;i<hs.length;i++) for(let j=i+1;j<hs.length;j++) s.add('P:'+[hs[i],hs[j]].sort().join('|')); }
      });
    });
    return s;
  };
  try{
    // 1. Карьера 2024-го во втором сезоне: календарь 2025-й, трио.
    seed({season:2, size:3, year:2025, year0:2024, day:'2025-02-20', sizes:{1:2}});
    check('2024→2025: ccContinuity', ccContinuity()===true, String(ccNowYear())+'/'+String(ccCalYear()));
    const p1=careerPools();
    const real1=p1.duos.filter(d=>d._real);
    const b25=bookOf(2025, 3), b24=bookOf(2024, 2);
    const cr=CAREER.career;
    const thirds=Object.keys(cr.trios||{});
    let trioReal=0, trioChecked=0, pairReal=0, pairOld=0;
    real1.forEach(d=>{
      const k=d.cards.map(c=>hKey(c)).sort().join('|');
      if(b25.has('P:'+k)) pairReal++;
      if(b24.has('P:'+k) && !b25.has('P:'+k)) pairOld++;
      const t=cr.trios[d.cards.map(c=>hKey(c)).sort().join('+')];
      if(t){ trioChecked++; if(b25.has([...d.cards.map(c=>hKey(c)), t].sort().join('|'))) trioReal++; }
    });
    const yr24=real1.reduce((n,d)=>n+d.cards.filter(c=>!c._debut && ccCardYear(c)<=2024).length, 0);
    // Дебютанты 2025-го: без карточек до 2024-го включительно, рейтинг — настоящий 2025-го.
    const T25d=ccRealTargets(2025);
    const debs=real1.reduce((a,d)=>a.concat(d.cards.filter(c=>c._debut)), []);
    const debOk=debs.filter(c=>c._debut===2025 && ccCardYear(c)===2025 && T25d.get(c._k||hKey(c))===ccCardOvr(c)).length;
    const deb=ccDebutants();
    out.notes.debut={inScene:deb ? deb.size : 0, inPairs:debs.length, ratingOk:debOk, sample:debs.slice(0,4).map(c=>c.handle+' '+ccCardOvr(c))};
    check('дебютанты 2025-го есть в сцене', deb && deb.size>=100, String(deb && deb.size));
    check('дебютанты стоят в настоящих составах', debs.length>=50, String(debs.length));
    check('рейтинг дебютанта — настоящий 2025-го', debOk===debs.length, debOk+'/'+debs.length);
    check('остальные люди — карточки 2024-го', yr24+debs.length===real1.length*2, (yr24+debs.length)+'/'+(real1.length*2));
    out.notes.y25={duos:p1.duos.length, real:real1.length, pairReal, pairOld, thirds:thirds.length, trioChecked, trioReal,
      people2024:yr24+'/'+(real1.length*2), sample:real1.slice(0,4).map(d=>d.cards.map(c=>c.handle).join(' + ')+(cr.trios[d.cards.map(c=>hKey(c)).sort().join('+')]?' + '+cr.trios[d.cards.map(c=>hKey(c)).sort().join('+')]:''))};
    check('2024→2025: пары сцены — настоящие составы 2025-го', real1.length>=40, String(real1.length));
    check('2024→2025: каждая пара записана в 2025-м вместе', pairReal===real1.length, pairReal+'/'+real1.length);
    check('2024→2025: третьи посеяны из 2025-го', trioChecked>=20 && trioReal===trioChecked, trioReal+'/'+trioChecked);
    check('2024→2025: рынок трио не открывается', ccTrioMarket(cr, true)===0);
    // 1б. Потенциал из жизни: рейтинг идёт к рейтингу года календаря, постепенно.
    const pot=(day)=>{
      seed({season:2, size:3, year:2025, year0:2024, day:day, sizes:{1:2}});
      const T=ccRealTargets(2025), P=careerPools();
      const base=new Map(); ccEuCards().forEach(c=>{ const cur=base.get(c._k); if(ccCardYear(c)===2024 && (cur==null || c._ovr>cur)) base.set(c._k, c._ovr); });
      let n=0, toward=0, gap0=0, gap1=0, up=0, down=0; const ex=[];
      P.duos.forEach(d=>d.cards.forEach(c=>{
        const k=c._k||hKey(c), t=T.get(k), b=base.get(k);
        if(t==null || b==null || Math.abs(t-b)<3) return;
        n++; gap0+=Math.abs(t-b); gap1+=Math.abs(t-c._ovr);
        if(Math.abs(t-c._ovr)<Math.abs(t-b)) toward++;
        if(t>b) up++; else down++;
        if(ex.length<4) ex.push(c.handle+' '+b+'→'+c._ovr+' (жизнь '+t+')');
      }));
      return {frac:+ccRealPullFrac().toFixed(2), n, toward, up, down, gapStart:+(gap0/Math.max(1,n)).toFixed(1), gapNow:+(gap1/Math.max(1,n)).toFixed(1), ex};
    };
    const first=pot(CC_YEAR_2025_FROM), early=pot('2025-03-15'), late=pot('2025-09-20');
    out.notes.potential={first:{frac:first.frac, gapNow:first.gapNow}, early, late};
    // 5.10 (тестер, «05»: «рейтинг не меняется, когда новый сезон начинается»): стык сам закрывает CC_REAL_PULL_OPEN разницы.
    check('потенциал: в первый день сезона закрыта доля CC_REAL_PULL_OPEN', Math.abs(first.frac-CC_REAL_PULL_OPEN)<0.01 && first.toward>=first.n*0.8
      && first.gapNow<first.gapStart && first.gapNow>=first.gapStart*(1-CC_REAL_PULL_OPEN)-0.6, JSON.stringify(first));
    check('потенциал: есть люди с целью', early.n>=30, String(early.n));
    check('потенциал: к первому Мейджору — больше, чем в день стыка', early.frac>first.frac+0.15 && early.frac<0.85 && early.toward>=early.n*0.8, early.frac+', '+early.toward+'/'+early.n);
    check('потенциал: к концу сезона почти всё', late.frac>=0.8 && late.gapNow<=late.gapStart*0.25, late.frac+', '+early.gapNow+' → '+late.gapNow);
    // 1в. Цепочка: 2026-й карьеры 2024-го начинается с того, чем кончился 2025-й (S1neD: 80, а не 76).
    seed({season:3, size:2, year:2026, year0:2024, day:CC_YEAR_FROM, sizes:{1:2, 2:3}});
    {
      const T25=ccRealTargets(2025), T26=ccRealTargets(2026), P=careerPools(), fe=ccRealYearEndFrac(2025), f0=ccRealPullFrac();
      const base=new Map(); ccEuCards().forEach(c=>{ const cur=base.get(c._k); if(ccCardYear(c)===2024 && (cur==null || c._ovr>cur)) base.set(c._k, c._ovr); });
      let n=0, ok=0; const bad=[];
      // Только настоящие составы: у добора из ростера база — самая свежая карточка, а не сильнейшая.
      P.duos.filter(d=>d._real).forEach(d=>d.cards.forEach(c=>{
        const k=c._k||hKey(c), t=T25.get(k), b=base.get(k);
        if(t==null || b==null || Math.abs(t-b)<3) return;
        // Конец 2025-го, и сверху — доля стыка к 2026-му (CC_REAL_PULL_OPEN), если у него есть карточка 2026-го.
        const s=b+(t-b)*fe, t6=T26.get(k);
        n++; const want=Math.round(t6!=null ? s+(t6-s)*f0 : s);
        if(Math.abs(c._ovr-want)<=1) ok++; else if(bad.length<3) bad.push(c.handle+' '+c._ovr+' ждали '+want);
      }));
      out.notes.chain={n, ok, bad};
      check('цепочка: 2026-й начинается с конца 2025-го', n>=20 && ok===n, ok+'/'+n+' '+bad.join('; '));
    }
    // 2. Карьера 2025-го во втором сезоне: календарь 2026-й, дуо.
    seed({season:2, size:2, year:2026, year0:2025, day:'2026-02-20', sizes:{1:3}});
    check('2025→2026: ccContinuity', ccContinuity()===true, String(ccNowYear())+'/'+String(ccCalYear()));
    const p2=careerPools();
    const real2=p2.duos.filter(d=>d._real);
    const b26=bookOf(2026, 2);
    let pr2=0; real2.forEach(d=>{ if(b26.has('P:'+d.cards.map(c=>hKey(c)).sort().join('|'))) pr2++; });
    out.notes.y26={duos:p2.duos.length, real:real2.length, pairReal:pr2, sample:real2.slice(0,4).map(d=>d.cards.map(c=>c.handle).join(' + '))};
    check('2025→2026: пары сцены — настоящие дуо 2026-го', real2.length>=40, String(real2.length));
    check('2025→2026: каждая пара записана в 2026-м вместе', pr2===real2.length, pr2+'/'+real2.length);
    // 3. Свежая карьера 2024-го — без изменений: настоящих составов чужого года нет.
    seed({season:1, size:2, year:2024, year0:2024, day:'2024-02-20'});
    const p3=careerPools();
    out.notes.y24={duos:p3.duos.length, real:p3.duos.filter(d=>d._real).length};
    check('свежий 2024-й: ccContinuity выключен', ccContinuity()===false);
    check('свежий 2024-й: потенциала нет', ccRealPullStep()===0);
    check('свежий 2024-й: пары — свои, без _real', p3.duos.filter(d=>d._real).length===0);
    // 4. Свежие 2025-й и 2026-й — только замер (сколько пар даёт сцена дивизиона 1).
    seed({season:1, size:2, year:2026, year0:2026, day:'2026-02-20'});
    out.notes.y26fresh={duos:careerPools().duos.length};
    seed({season:1, size:3, year:2025, year0:2025, day:'2025-02-20'});
    out.notes.y25fresh={duos:careerPools().duos.length, thirds:Object.keys(CAREER.career.trios||{}).length};
    check('без ошибок JS', out.errs.length===0, out.errs.slice(0,3).join(' | '));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccreal-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(SL).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const html = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=120000', '--dump-dom',
  'file:///' + tmp.split(SL).join('/')], { maxBuffer: 1 << 28, timeout: 600000 }).toString();
fs.rmSync(dir, { recursive: true, force: true });
const m = /PBEGIN(.*?)PEND/.exec(html);
if (!m) { console.log('FAIL: no result'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out.notes, null, 1));
if (out.errs && out.errs.length) out.errs.slice(0, 5).forEach(e => console.log('JSERR ' + e.slice(0, 400)));
if (out.err) { console.log('ERR ' + out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
console.log('OK check-career-real-teams');
