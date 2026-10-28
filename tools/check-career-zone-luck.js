// Удача зон, спор «кто лучше», серия страны (28.10): вечер оценки 2024 пишет отметку зоны в строки вечера,
// посты аналитика/свой/серии/спора создаются и читаются на пяти встроенных языках без «—».
//   node tools/check-career-zone-luck.js
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
  setInterval(function(){
    const am=document.getElementById("ccAskModal");
    if(am && am.style.display==="flex"){ const no=document.getElementById("ccAskNo"), yes=document.getElementById("ccAskYes");
      if(no && no.textContent===L().ccSpotGatePlay){ no.click(); return; }
      if(yes && yes.textContent===L().ccSpotGateSet){ careerSpotEnsure(); am.style.display="none"; careerPlay(); return; } }
    const cb=document.querySelector(".cc-choice-btn"); if(cb){ cb.click(); return; }
    const p=document.querySelector(".landing-picker"); if(!p) return;
    const z=p.querySelectorAll(".land-zone"); if(!z.length) return;
    z[0].click();
    const c=p.querySelector("#gameLandingConfirm"); if(c && !c.disabled) c.click();
  }, 20);
  const out={steps:[], fails:[], notes:{}, err:null, errs:[]};
  window.addEventListener('error', e=>{ out.errs.push(String(e.message)+' @'+e.lineno); });
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  const wait=ms=>new Promise(r=>setTimeout(r, ms));
  const card=(h, o)=>({handle:h, region:'EU', rating:o, _ovr:o, nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
  const seed=(div, day, extra)=>{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Cashman', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6,
        region:'EU', ovr:96, role:'roleIGL', attrs:null, ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
      career:Object.assign({season:1, size:2, year:2024, year0:2024, day:day, division:div, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[], seed:'y25c'}, extra||{}),
      partner:{card:card('M1',94), patience:60, since:'2023-11-01', dev:0}, partners:[{card:card('M1',94), patience:60, since:'2023-11-01', dev:0}]}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs=ccRookieAttrs(96, 'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerEntry();
  };
  const playThrough=async what=>{
    const play=document.querySelector('#screen-career-hub .ch-play');
    if(!play) throw new Error(what+': no button at all');
    if((play.getAttribute('onclick')||'').indexOf('careerPlay')<0) throw new Error(what+': the button skips instead of playing: '+play.outerHTML.slice(0,200));
    const sk=setInterval(()=>{ const b=document.getElementById('majorSkipBtn'); if(b && !b.disabled) b.click(); }, 20);
    play.click();
    let c=null;
    for(let i=0;i<20000 && !c;i++){ await wait(25); c=[...document.querySelectorAll('#majorStages .stage-card')].find(x=>x.querySelector('button[onclick*="careerBackToHub"]')); }
    clearInterval(sk);
    if(!c) throw new Error(what+': no result card came back');
    const head=c.querySelector('h4').textContent.replace(/\\s+/g,' ').trim();
    c.querySelector('button[onclick*="careerBackToHub"]').click();
    return head;
  };
  const save=()=>JSON.parse(localStorage.getItem('fncsdraft_career')).career;
  try{
    // 1) Вечер оценки 2024: строки вечера несут zp, у команд лобби копятся zpG/zpN.
    seed(1, '2023-12-05');
    let G=0, N=0; const am=accumulateMatchStats;
    window.accumulateMatchStats=function(t){ if(t && t._zonePull!=null){ G++; if(t._zonePull) N++; } return am.apply(this, arguments); };
    const head=await playThrough('eval');
    out.steps.push('вечер: '+head);
    const rows=(CC_EVENING&&CC_EVENING.rows)||[];
    out.notes.rows=rows.map(r=>r.g+':#'+r.place+':zp'+r.zp);
    check('строки вечера есть', rows.length>=4, rows.length);
    // Отметка — у всех, кто дожил до седьмого круга (значит, видел шестой), и хоть у кого-то вообще.
    out.notes.rows=rows.map(r=>r.g+':#'+r.place+':z'+r.dz+':zp'+r.zp);
    check('у доживших до эндгейма есть отметка', rows.some(r=>r.zp!=null) && rows.filter(r=>r.dz>=7).every(r=>r.zp!=null), JSON.stringify(out.notes.rows));
    // Доля по всем командам, кому движок сыграл игры: зона шестого круга — четверть площади пятого.
    out.notes.allTeams=N+'/'+G+' = '+(G?Math.round(N/G*100):0)+'%';
    // Знаменатель — эндгеймы (дожившие до шестого круга); шестой круг вдвое уже пятого, то есть четверть его площади.
    check('доля пришедших зон в эндгеймах 12..50%', G>=40 && N/G>=0.12 && N/G<=0.5, out.notes.allTeams);
    out.notes.evNews=(CAREER.career.news||[]).slice(0,10).map(n=>n.k);
    // 2) Пост аналитика по синтетическому топу.
    const fake=[];
    for(let i=0;i<12;i++) fake.push({name:'T'+i, squad:[{handle:'Alpha'+i},{handle:'Beta'+i}], mstats:{zpG:6, zpN:i%4}});
    ccZoneLuckPost(fake, 'Test Final');
    const zl=CAREER.career.news.find(n=>n.k==='ccNewsZoneLuck');
    check('пост удачи зон', !!zl);
    ccZoneLuckPost(fake, 'Test Final 2');
    check('не чаще раза в 5 дней', CAREER.career.news.filter(n=>n.k==='ccNewsZoneLuck').length===1);
    // 3) Твой пост: 0 из 6 эндгеймов.
    CC_EVENING={day:careerToday(), rows:[1,2,3,4,5,6].map(g=>({g, place:g+3, elims:1, zp:0})), posted:{}};
    ccEveningPosts(CC_EVENING.rows);
    const my=CAREER.career.news.find(n=>n.k==='ccPostZoneLuck');
    check('свой пост 0/6', !!my && my.a[0]===0 && my.a[1]===6, my && JSON.stringify(my.a));
    // 4) Серия страны: три крупных финала подряд с датчанином.
    const dk={squad:[{handle:'Dan1', nat:'Дания'},{handle:'Swe1', nat:'Швеция'}]};
    ccNatStreakNote(dk, null, 'Major 1');
    ccNatStreakNote({squad:[{handle:'Dan2', nat:'Дания'}]}, null, 'Major 2');
    check('после двух поста нет', !CAREER.career.news.some(n=>n.k==='ccNewsNatStreak'));
    ccNatStreakNote({squad:[{handle:'Dan3', nat:'Дания'},{handle:'Fr1', nat:'Франция'}]}, null, 'Major 3');
    const ns=CAREER.career.news.find(n=>n.k==='ccNewsNatStreak');
    check('серия из трёх', !!ns && ns.a[0]==='Дания' && ns.a[1]===3, ns && JSON.stringify(ns.a));
    // 5) Спор: часы заводятся первым днём, пост во второй раз.
    const cr=CAREER.career;
    let prRows=careerPrRows(); out.notes.prRows=prRows.length;
    if(prRows.length<6){ const real=careerPrRows; window.careerPrRows=()=>['Peterbot','Pollo','Malibuca','Shxrk','Tjino','Vanyak3kk','Pixie','Demus'].map((n,i)=>({name:n, pr:9000-i*700, events:20, you:false})); }
    cr.debateNext=null; careerDebateTick();
    check('часы спора заведены', !!cr.debateNext);
    cr.debateNext='2000-01-01'; careerDebateTick();
    const db=cr.news.find(n=>n.k==='ccPostDebate');
    check('пост спора с опросом', !!db && db.poll && db.poll.o.length===2, db && JSON.stringify(db.a));
    // 6) Тексты на пяти встроенных языках: строка, без «—», без undefined/NaN.
    const keys=['ccNewsZoneLuck','ccPostZoneLuck','ccNewsNatStreak','ccPostDebate'];
    const was=LANG;
    ['en','ru','fr','it','pt'].forEach(lg=>{
      LANG=lg;
      keys.forEach(k=>{ const n=cr.news.find(x=>x.k===k); if(!n) return; let t=''; try{ t=ccText(n); }catch(e){ t='THROW '+e; }
        out.notes[lg+':'+k]=String(t).slice(0,230);
        check(lg+' '+k+' читается', typeof t==='string' && t.length>10 && !/undefined|NaN|THROW/.test(t), t);
        check(lg+' '+k+' без длинного тире', String(t).indexOf('—')<0, t); });
    });
    LANG=was;
    out.notes.authors=keys.map(k=>{ const n=cr.news.find(x=>x.k===k); try{ const a=ccPostAuthor(n); return k+'='+(a && (a.name||a.handle||a)); }catch(e){ return k+'=ERR '+e; } });
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cczl-'));
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
console.log('OK check-career-zone-luck');
