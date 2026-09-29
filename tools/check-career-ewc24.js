// EWC 2024 путём настоящих путёвок: DreamHack Dallas 2024 (топ-6), онлайн-отбор региона (EU — 2),
// Эр-Рияд только по путёвке; поле Эр-Рияда — из путёвок карьеры, 16 разных команд, своя статистика и MVP.
//
//   node tools/check-career-ewc24.js
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
  const seed=(day, extra, who)=>{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Yearman', age:20, source:'rookie', country:(who&&who.c)||'de', countryPing:15, closeRangeEdge:6,
        region:(who&&who.r)||'EU', ovr:96, role:'roleIGL', attrs:null, ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
      career:Object.assign({season:1, size:4, year:+day.slice(0,4), year0:+day.slice(0,4), day:day, division:1, earnings:0, balance:0, reach:0,
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
    const st=()=>JSON.parse(localStorage.getItem('fncsdraft_career')).career.ewc24||{};
    const inv=d=>{ CC_VICTORY_LIST=null; const v=careerVictoryOn(d); return v ? {id:v.id, inv:ccVictoryInvited(v)} : null; };
    seed('2024-06-01', null, {c:'de'});
    check('Dallas стоит и зовёт', (inv('2024-06-01')||{}).inv===true, JSON.stringify(inv('2024-06-01')));
    check('EWC без путёвки не зовёт', (inv('2024-08-08')||{}).inv===false, JSON.stringify(inv('2024-08-08')));
    { const am=document.getElementById('ccAskModal'); if(am) am.style.display='none'; const ok=careerSpotGate(careerNext()); check('метка на Dallas не нужна', ok===true && !(am && am.style.display==='flex'), String(ok)); }
    const h1=await playThrough('Dallas');
    const s1=st(), l1=lastLog();
    out.steps.push('Dallas: '+h1+' · #'+(l1&&l1.place)+' $'+(l1&&l1.prize)+' · top6 '+JSON.stringify(s1.dallas));
    check('Dallas записан', l1 && l1.kind==='victory' && l1.of===37, JSON.stringify(l1));
    check('шесть путёвок Dallas', s1.dallas && s1.dallas.length===6 && new Set(s1.dallas).size===6, JSON.stringify(s1.dallas));
    check('в карточках Dallas есть свои K/D', document.getElementById('majorStages').textContent.indexOf('K/D')>=0);
    // Отбор: без путёвки Dallas — играется; путёвку снимаем, чтобы пройти и эту ветку.
    const carry=Object.assign({}, s1, {you:null});
    seed('2024-07-05', {ewc24:carry}, {c:'de'});
    check('отбор зовёт без путёвки', (inv('2024-07-05')||{}).inv===true, JSON.stringify(inv('2024-07-05')));
    const h2=await playThrough('Qualifier');
    const s2=st(), l2=lastLog();
    out.steps.push('Qual: '+h2+' · #'+(l2&&l2.place)+' · EU '+JSON.stringify(s2.quals&&s2.quals.EU)+' you '+JSON.stringify(s2.you));
    check('отбор EU дал две путёвки', s2.quals && s2.quals.EU && s2.quals.EU.length===2, JSON.stringify(s2.quals));
    check('в отборе нет держателей Dallas', !(s2.quals.EU||[]).some(n=>n!=='YOU' && (s2.dallas||[]).indexOf(n)>=0), JSON.stringify(s2));
    // Эр-Рияд: путёвка своя (если отбор не дал — через Dallas-слот 3).
    const tk=s2.you ? s2 : Object.assign({}, s2, {you:{via:'dallas', place:3}, dallas:(s2.dallas||[]).map((n,i)=>i===2 ? 'YOU' : (n==='YOU' ? 'Karmine Corp' : n))});
    seed('2024-08-08', {ewc24:tk}, {c:'de'});
    check('EWC зовёт по путёвке', (inv('2024-08-08')||{}).inv===true, JSON.stringify(inv('2024-08-08')));
    check('отбор с путёвкой не зовёт', (()=>{ seed('2024-07-05', {ewc24:tk}, {c:'de'}); return (inv('2024-07-05')||{}).inv===false; })());
    seed('2024-08-08', {ewc24:tk}, {c:'de'});
    const bal0=JSON.parse(localStorage.getItem('fncsdraft_career')).career.earnings||0;
    const h3=await playThrough('EWC');
    const l3=lastLog();
    const txt=document.getElementById('majorStages').textContent;
    out.steps.push('EWC: '+h3+' · #'+(l3&&l3.place)+' $'+(l3&&l3.prize)+' · '+txt.slice(txt.lastIndexOf('MVP'), txt.lastIndexOf('MVP')+60));
    check('EWC записан', l3 && l3.kind==='victory' && l3.of===16 && l3.place>=1 && l3.place<=16, JSON.stringify(l3));
    check('MVP турнира назван', /MVP/.test(txt));
    const names=[...document.querySelectorAll('#majorStages .ewc-card')].slice(-1)[0].querySelectorAll('.ewc-table b');
    const list=[...names].map(b=>b.textContent);
    check('в итоговой таблице 16 разных команд', list.length===16 && new Set(list).size===16, list.join(', '));
    const mvpLine=(document.querySelector('#majorStages .ewc-mvp-line')||{}).textContent||'';
    check('MVP турнира — из чемпиона', mvpLine.indexOf('('+list[0]+')')>=0, mvpLine+' vs '+list[0]);
    check('путёвка — в поле один раз', list.filter(n=>n===L().ewc24You || n===((CAREER.org||{}).name)).length===1, list.join(', '));
    // Вживую, без «Пропустить»: своя карта со схемой режима, вопрос тактики, запись вечера.
    seed('2024-08-08', {ewc24:tk}, {c:'de'});
    const seen={live:0, ask:0, img:{}, modes:{}};
    const mo=new MutationObserver(()=>{
      const lv=document.querySelector('.ewc-live .ewc-live-map');
      if(lv){ seen.live++; const m=(lv.getAttribute('style')||'').split('art/ewc/')[1]; if(m) seen.img[m.split(')')[0]]=1;
        const t=(document.querySelector('.ewc-live-top span')||{}).textContent||''; ['Capture the Flag','Hardpoint','Keeper'].forEach(k=>{ if(t.indexOf(k)>=0) seen.modes[k]=1; }); }
      if(document.querySelector('.ewc-ask')) seen.ask++;
    });
    mo.observe(document.body, {childList:true, subtree:true});
    const skipT=setInterval(()=>{}, 1000);
    const n0=(JSON.parse(localStorage.getItem('fncsdraft_career')).career.log||[]).length;
    await runCareerEwc2024(careerVictoryOn('2024-08-08'));
    clearInterval(skipT); mo.disconnect();
    const n1=(JSON.parse(localStorage.getItem('fncsdraft_career')).career.log||[]).length;
    out.steps.push('live: '+JSON.stringify(seen).slice(0, 200));
    check('живая карта показана', seen.live>20, JSON.stringify(seen));
    check('вопрос тактики был', seen.ask>0, JSON.stringify(seen));
    check('все три режима вживую', Object.keys(seen.modes).length===3, JSON.stringify(seen.modes));
    check('живой вечер записан', n1===n0+1, n0+' -> '+n1);
    check('после вечера вопросов не осталось', !document.querySelector('.ewc-ask') && !document.querySelector('.ewc-live'));
    check('без ошибок JS', out.errs.length===0, out.errs.slice(0,3).join(' | '));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccewc24-'));
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
console.log('OK check-career-ewc24');
