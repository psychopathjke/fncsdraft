// Пары и лица 2024-го: один человек — одна команда в комнате, и записанные дуо
// года стоят целыми, пока сезон не кончился.
//
// Его слово 22 сентября, страница «bags 22»: «2024 года сезон очень баговАный»,
// «два мерстача», «и все сильные дуо сразу друг друга сплитнули».
//
//   node tools/check-career-2024-pairs.js
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
(function(){
  const out={steps:[], fails:[], notes:{}, err:null, errs:[]};
  window.addEventListener('error', e=>{ out.errs.push(String(e.message)+' @'+e.lineno); });
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  const card=(h, o)=>({handle:h, region:'EU', rating:o, _ovr:o, nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
  const seed=(day, extra)=>{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Pairs', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6,
        region:'EU', ovr:96, role:'roleIGL', attrs:null, ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
      career:Object.assign({season:1, size:2, year:2024, year0:2024, day:day, division:1, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[], seed:'y24p'}, extra||{}),
      partner:{card:card('M1',94), patience:60, since:'2023-11-01', dev:0},
      partners:[{card:card('M1',94), patience:60, since:'2023-11-01', dev:0}]}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs=ccRookieAttrs(96, 'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerEntry();
  };
  /* Кто с кем сидит в комнате — и сколько раз человек в ней вообще встречается.
     Комната строится тем же вызовом, каким её строит раннер открытого раунда
     Мейджора 2024-го (см. runCareerMajor2024, ветка openRound). */
  const roomOf=(n, major)=>{
    const cr=CAREER.career, me=careerCard(), mates=careerMates();
    const drafted=[me].concat(mates.filter(Boolean));
    // major задан — комната строится ровно так, как её строит раннер открытого
    // раунда: на неделе первого квалификатора этого Мейджора (ccM24OpenCr).
    return careerCupField(major ? ccM24OpenCr(cr, major) : cr, drafted, n, null, true, 0);
  };
  const facesIn=(field)=>{
    const seen=new Map();
    (field||[]).forEach((t,i)=>{
      (t.squad||[]).forEach(c=>{
        if(!c) return;
        const k=hKey(c);
        if(!seen.has(k)) seen.set(k, []);
        seen.get(k).push(i);
      });
    });
    return seen;
  };
  const dupesIn=(field)=>{
    const out2=[];
    facesIn(field).forEach((at, k)=>{ if(at.length>1) out2.push(k+' ×'+at.length); });
    return out2;
  };
  try{
    // ---- сезон 1: комната открытого раунда --------------------------------
    seed('2024-01-26');
    const f1=roomOf(400);
    out.notes.room1={teams:f1.length, faces:facesIn(f1).size};
    const d1=dupesIn(f1);
    out.notes.dupes1=d1.slice(0,8);
    check('сезон 1: один человек — одна команда', d1.length===0, d1.slice(0,6).join(', '));
    check('сезон 1: комната набралась', f1.length>300, String(f1.length));

    /* ---- сезон 1: записанные дуо года стоят целыми ----------------------
       Снимок года — настоящие пары 2024-го с карточек (ccRealMatesOf), и
       первый сезон обязан сыграть ими: ccDuoBroken молчит при season<=1, а
       трансферный рынок стоит на стыке года. */
    const pool=careerPools();
    const duos=(pool && pool.duos)||[];
    out.notes.pool1={duos:duos.length, players:(pool&&pool.players||[]).length};
    const broken=duos.filter(d=>ccDuoBroken(d)).length;
    check('сезон 1: ни одна записанная пара не разведена', broken===0, String(broken)+' of '+duos.length);
    // И сильнейшие пары сцены — в комнате именно парами.
    const top=duos.slice().sort((a,b)=>ccDuoOvr(b)-ccDuoOvr(a)).slice(0,10);
    const pairOf=new Map();
    f1.forEach(t=>{ const sq=(t.squad||[]).map(hKey); if(sq.length===2){ pairOf.set(sq[0], sq[1]); pairOf.set(sq[1], sq[0]); } });
    const split=top.filter(d=>{
      const k=(d.cards||[]).map(hKey);
      if(k.length!==2) return false;
      // Пара могла не приехать на этот вечер — это не развод. Развод — когда
      // приехала половинка, а рядом с ней кто-то другой.
      if(!pairOf.has(k[0]) && !pairOf.has(k[1])) return false;
      return pairOf.get(k[0])!==k[1];
    }).map(d=>(d.cards||[]).map(c=>c.handle).join(' & '));
    out.notes.splitTop=split;
    check('сезон 1: сильные пары сидят парами', split.length===0, split.slice(0,4).join(', '));

    /* ---- ДВА КВАЛИФИКАТОРА — ОДНИ И ТЕ ЖЕ ЛЮДИ ---------------------------

       У Мейджора 2024-го два открытых квалификатора, и очки серии копятся за
       оба (m.series по ccSeatKey — ключу СОСТАВА). Если во втором квалификаторе
       человек выходит с другим напарником, он держит в таблице серии ДВЕ
       строки, и сетки полуфинала сажают обе: «два мерстача» в одной комнате. */
    seed('2024-01-26'); const q1=roomOf(400, 1);
    seed('2024-02-02'); const q2=roomOf(400, 1);
    const mateIn=(field)=>{ const m2=new Map();
      field.forEach(t=>{ const sq=(t.squad||[]).map(hKey); if(sq.length===2){ m2.set(sq[0], sq[1]); m2.set(sq[1], sq[0]); } });
      return m2; };
    const m1=mateIn(q1), m2=mateIn(q2);
    let both=0, moved=0; const sample=[];
    m1.forEach((mate, who)=>{ if(!m2.has(who)) return; both++;
      if(m2.get(who)!==mate){ moved++; if(sample.length<6) sample.push(who+': '+mate+' → '+m2.get(who)); } });
    out.notes.quals={inBoth:both, differentMate:moved, sample:sample};
    check('квалификаторы 1 и 2 сажают человека с тем же напарником',
          moved===0, moved+' of '+both+' · '+sample.slice(0,3).join(' | '));

    // ---- стык года: развод есть, но лиц по-прежнему по одному -------------
    seed('2024-01-26', {season:2, year:2025, size:3});
    const f2=roomOf(200);
    const d2=dupesIn(f2);
    out.notes.room2={teams:f2.length, faces:facesIn(f2).size, dupes:d2.slice(0,8)};
    check('сезон 2: один человек — одна команда', d2.length===0, d2.slice(0,6).join(', '));

    check('без ошибок JS', out.errs.length===0, out.errs.slice(0,3).join(' | '));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc24p-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(SL).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const html = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.split(SL).join('/')], { maxBuffer: 1 << 28, timeout: 1500000 }).toString();
const m = /PBEGIN(.*?)PEND/.exec(html);
if (!m) { console.log('FAIL: no result'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
console.log(JSON.stringify(out.notes));
if (out.errs && out.errs.length) out.errs.slice(0, 5).forEach(e => console.log('JSERR ' + e.slice(0, 400)));
if (out.err) { console.log('ERR ' + out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
console.log('OK check-career-2024-pairs');
