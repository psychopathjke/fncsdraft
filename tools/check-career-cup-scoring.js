// Очки капов по правилам Epic (ccCupScore / ccDivCupScore, tools/build-cup-scoring.js): покрытие
// капов каждого года, числа известных событий и то, что вечер капа играет их правилом.
//
//   node tools/check-career-cup-scoring.js
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
  const seed=(day, extra)=>{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Yearman', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6,
        region:'EU', ovr:96, role:'roleIGL', attrs:null, ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
      career:Object.assign({season:1, size:4, year:2019, year0:2019, day:day, division:1, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[], seed:'y19y'}, extra||{}),
      partner:{card:card('M1',94), patience:60, since:'2020-11-01', dev:0}, partners:[{card:card('M1',94), patience:60, since:'2020-11-01', dev:0}, {card:card('M2',93), patience:60, since:'2020-11-01', dev:0}, {card:card('M3',92), patience:60, since:'2020-11-01', dev:0}]}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs=ccRookieAttrs(96, 'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerEntry();
    // Состав по этапу года: лишние тиммейты сверх мест этапа отпускаются (как сделал бы игрок).
    careerRenderHub('centre');
    if((CAREER.partners||[]).length>careerMateSeats()){ CAREER.partners=CAREER.partners.slice(0, careerMateSeats()); careerSave(); careerRenderHub('centre'); }
  };
  const playThrough=async what=>{
    const play=document.querySelector('#screen-career-hub .ch-play');
    if(!play) throw new Error(what+': no button at all');
    if((play.getAttribute('onclick')||'').indexOf('careerPlay')<0) throw new Error(what+': the button skips instead of playing: '+play.outerHTML.slice(0,200));
    const sk=setInterval(()=>{ const b=document.getElementById('majorSkipBtn'); if(b && !b.disabled) b.click(); }, 20);
    play.click();
    let c=null;
    for(let i=0;i<16000 && !c;i++){ await wait(25); c=[...document.querySelectorAll('#majorStages .stage-card')].find(x=>x.querySelector('button[onclick*="careerBackToHub"]')); }
    clearInterval(sk);
    if(!c) throw new Error(what+': no result card came back');
    const head=c.querySelector('h4').textContent.replace(/[ ]+/g,' ').trim();
    c.querySelector('button[onclick*="careerBackToHub"]').click();
    return head;
  };
  const lastLog=()=>{ const s=JSON.parse(localStorage.getItem('fncsdraft_career')).career; return (s.log||[]).slice(-1)[0]||null; };
  try{
    const setY=(d,y,extra)=>{ seed(d, extra); const s=JSON.parse(localStorage.getItem('fncsdraft_career')); s.career.year=y; s.career.year0=y; localStorage.setItem('fncsdraft_career', JSON.stringify(s)); careerEntry(); careerRenderHub('centre'); };
    // 1. Числа известных событий — прямо из правил Epic.
    const at=(fam, r, p)=>{ const sc=ccCupScoreOf(fam, r); return sc ? sc.pts(p) : null; };
    const kl=(fam, r)=>{ const sc=ccCupScoreOf(fam, r); return sc ? sc.kill : null; };
    check('S15 Solo Cash Cup: победа 20, элим 1', at('S15_SoloCashCup',1,1)===20 && kl('S15_SoloCashCup',1)===1, at('S15_SoloCashCup',1,1)+'/'+kl('S15_SoloCashCup',1));
    check('S19 Solo Cash Cup: R1 победа 30, R2 элим 2', at('S19_SoloCashCup',1,1)===30 && kl('S19_SoloCashCup',2)===2);
    check('S23: R2 — только победа', at('S23_SoloCashCup',2,1)>0 && at('S23_SoloCashCup',2,2)===0 && kl('S23_SoloCashCup',2)===0);
    check('S41 Victory Cup = прежняя таблица 2026', [1,2,3,4,10,25,50,51].every(p=>at('S41_SoloVictoryCup',1,p)===victoryR1Points(p)) && kl('S41_SoloVictoryCup',1)===CC_VICTORY_R1_KILL,
      [1,2,10,50].map(p=>at('S41_SoloVictoryCup',1,p)+'/'+victoryR1Points(p)).join(' '));
    // 1б. Мейджоры прошлых лет — по правилам своего события (World Cup 2019: 10/7/5/3, элим 1).
    const pm=(id, day)=>{ const sc=ccPastMajorScore({id:id, day:day}); return sc ? [sc.pts(1), sc.pts(5), sc.pts(15), sc.pts(25), sc.kill].join('/') : 'null'; };
    out.notes.past={wcW1:pm('Major1_2019_W1R1','2019-04-13'), wcFin:pm('Major1_2019_Final','2019-07-28'), wcDuoW2:pm('Major2_2019_W2R1','2019-04-20'),
      sx:pm('Major3_2019_W1R1','2019-09-21'), c2s5q:pm('Major1_2021_Q1R1','2021-01-16'), c2s5f:pm('Major1_2021_Final','2021-02-14'), m23:pm('Major1_2023_W1R1','2023-02-05')};
    check('World Cup Solo неделя: 10/7/5/3, элим 1', out.notes.past.wcW1==='10/7/5/3/1', out.notes.past.wcW1);
    check('World Cup финал — правило Epic', out.notes.past.wcFin==='10/7/5/3/1', out.notes.past.wcFin);
    check('прошлые FNCS находят правило', ['sx','c2s5q','c2s5f','m23'].every(k=>out.notes.past[k]!=='null'), JSON.stringify(out.notes.past));
    // 2. Покрытие: капы каждого года (кроме ЛАНов по приглашению) находят своё правило.
    out.notes.cover={};
    for(const y of [2019,2020,2021,2022,2023,2024,2025,2026]){
      setY(y+'-02-01', y);
      const list=ccVictoryList().filter(v=>!v.invite);
      const miss=list.filter(v=>!ccCupScore(v,1)).map(v=>v.id);
      out.notes.cover[y]=(list.length-miss.length)+'/'+list.length+(miss.length ? ' без: '+[...new Set(miss)].slice(0,6).join(',') : '');
      check('капы '+y+' — правило Epic у большинства', list.length===0 || miss.length<=list.length*0.25, out.notes.cover[y]);
    }
    // 3. Кубки дивизионов: март 2026 — сезон S39 (победа 65, элим 3), лето 2026 — S41 (65, элим 2).
    setY('2026-03-08', 2026);
    const d39=ccDivCupScore('2026-03-08', 1), d41=ccDivCupScore('2026-07-05', 1);
    check('кубок дивизиона S39 — правило Epic', !!d39 && d39.fam==='S39_FNCSDivisionalCup_Division1' && d39.pts(1)===65 && d39.kill===3, d39 && (d39.fam+' '+d39.pts(1)+' '+d39.kill));
    check('кубок дивизиона S41 — правило Epic', !!d41 && /^S41_/.test(d41.fam) && d41.pts(1)===65 && d41.kill===2, d41 && (d41.fam+' '+d41.pts(1)+' '+d41.kill));
    // 4. Вечер капа 2021 играет правилом своего события.
    setY('2021-01-01', 2021);
    const ev=ccVictoryList().find(v=>!v.invite && ccCupScore(v,1) && v.day>='2021-01-02');
    check('есть кап 2021 с правилом', !!ev);
    if(ev){
      setY(ev.day, 2021);
      const used=[]; const orig=simulateGamesLive;
      simulateGamesLive=function(t, n, fn, km){ used.push([fn(1), fn(10), typeof km==='function' ? 'fn' : km]); return orig.apply(this, arguments); };
      const want=ccCupScore(ev,1);
      const play=document.querySelector('#screen-career-hub .ch-play');
      const sk=setInterval(()=>{ const b=document.getElementById('majorSkipBtn'); if(b && !b.disabled) b.click(); }, 20);
      if(play) play.click();
      let c=null; for(let i=0;i<16000 && !c;i++){ await wait(25); c=[...document.querySelectorAll('#majorStages .stage-card')].find(x=>x.querySelector('button[onclick*="careerBackToHub"]')); }
      clearInterval(sk); simulateGamesLive=orig;
      out.notes.night={ev:ev.id, day:ev.day, used, want:[want.pts(1), want.pts(10), want.kill]};
      check('вечер сыгран', !!c);
      check('раунд 1 — очки Epic', used.length>0 && used[0][0]===want.pts(1) && used[0][1]===want.pts(10) && used[0][2]===want.kill, JSON.stringify(used[0]));
    }
    check('без ошибок JS', out.errs.length===0, out.errs.slice(0,3).join(' | '));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cccupsc-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(SL).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const html = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=900000', '--dump-dom',
  'file:///' + tmp.split(SL).join('/')], { maxBuffer: 1 << 28, timeout: 1800000 }).toString();
fs.rmSync(dir, { recursive: true, force: true });
const m = /PBEGIN(.*?)PEND/.exec(html);
if (!m) { console.log('FAIL: no result'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
console.log(JSON.stringify(out.notes));
if (out.errs && out.errs.length) out.errs.slice(0, 5).forEach(e => console.log('JSERR ' + e.slice(0, 400)));
if (out.err) { console.log('ERR ' + out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
console.log('OK check-career-cup-scoring');
