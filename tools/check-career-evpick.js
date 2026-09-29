// Кап другого формата: состав выбирает игрок (его слово 29.09 «сквадовый кап играется рандомными
// игроками»). Сквадовый кап в дуо-году: окно, выбор двоих, запись в CAREER.rosters[4], второй раз
// без окна, вечер играется выбранными.
//
//   node tools/check-career-evpick.js
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
    const cb=document.querySelector(".cc-choice-btn:not(.cc-evpick-auto)"); if(cb){ cb.click(); return; }
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
    const sign=async(fmt, n)=>{
      ccDuoFindOpen(null, fmt);
      check('поиск открыт для формата '+fmt, CC_DUO_FMT===fmt && document.getElementById('duoFindModal').style.display==='flex');
      const pool=careerDuoSearchPool().filter(w=>!ccMyPeople().has(hKey(w.handle))).sort((a,b)=>b.ovr-a.ovr);
      ccDuoFindClose();
      const got=[];
      for(const w of pool){
        if(got.length>=n) break;
        CC_DUO_FMT=fmt; ccDuoFindWrite(w.handle);
        const t=careerDms().find(x=>hKey(x.who && x.who.handle||'')===hKey(w.handle));
        if(t && t.state==='offer'){ careerDmAccept(t.id); got.push(w.handle); }
      }
      return got;
    };
    // 1) Окно перед вечером: «Написать игрокам» — вечер не начинается.
    seed('2024-06-02', {size:2}, {c:'de'});
    CAREER.partners=(CAREER.partners||[]).slice(0, 1); CAREER.rosters={}; careerSave(); CC_VICTORY_LIST=null;
    const ev=careerVictoryOn('2024-06-02');
    check('в этот день сквадовый кап', ev && ev.mode==='squad', JSON.stringify(ev && ev.id));
    const p=ccEventRosterPick(ev, 4); await wait(30);
    check('окно спрашивает', !!document.querySelector('.cc-evpick [data-k="find"]'));
    document.querySelector('.cc-evpick [data-k="find"]').click();
    const ans=await p;
    check('ответ «написать»', ans==='find', String(ans));
    // 2) Переписка в формат сквада.
    const got=await sign(4, 2);
    careerRenderHub('centre');
    const r4=(CAREER.rosters[4]||[]).map(r=>(ccMateCardOf(r)||{}).handle);
    out.steps.push('signed '+JSON.stringify(got)+' rosters[4] '+JSON.stringify(r4)+' partners '+JSON.stringify(careerMates().map(m=>m.handle)));
    check('подписанные в сквад-составе, напарник остался', got.length===2 && got.every(h=>r4.indexOf(h)>=0) && r4.indexOf('M1')>=0, JSON.stringify(r4));
    check('состав года не тронут', careerMates().length===1, JSON.stringify(careerMates().map(m=>m.handle)));
    let asked=false; const p2=ccEventRosterPick(ev, 4); await wait(30); asked=!!document.querySelector('.cc-evpick'); await p2;
    check('с полным составом не спрашивает', !asked);
    careerRenderHub('centre');
    const h=await playThrough('Squads cup');
    const l=lastLog();
    out.steps.push('night: '+h+' · mates '+JSON.stringify(l && l.mates));
    check('вечер сыгран подписанными', l && got.every(n=>(l.mates||[]).indexOf(n)>=0), JSON.stringify(l && l.mates));
    // 3) Плашка за неделю до Dallas — ведёт в поиск сквада; EWC-четвёрка — подписанные.
    seed('2024-05-27', {size:2}, {c:'de'});
    CAREER.partners=(CAREER.partners||[]).slice(0, 1); CAREER.rosters={}; careerSave(); CC_VICTORY_LIST=null;
    const soon=ccRosterSoon();
    check('плашка видит Dallas как сквад', soon && soon.ev.ewc24==='dallas' && soon.fmt===4, JSON.stringify(soon && soon.ev.id));
    careerRenderHub('centre');
    const go=document.querySelector('.cc-soon .cc-soon-go');
    check('плашка в Центре', !!go);
    if(go) go.click();
    check('плашка открыла поиск сквада', CC_DUO_FMT===4);
    ccDuoFindClose();
    const got2=await sign(4, 2);
    const team=ewc24MyTeam([]);
    out.steps.push('ewc team: '+team.squad.map(c=>c.handle).join(', '));
    check('четвёрка EWC — подписанные', got2.length===2 && got2.every(n=>team.squad.some(c=>c.handle===n)), team.squad.map(c=>c.handle).join(','));
    check('после подписи плашки нет', !ccRosterSoon());
    // 4) Плитка составов в «Карьере»: три строки.
    careerRenderHub('me');
    check('плитка составов показывает трио и сквад', document.body.innerHTML.indexOf('/3</em>')>=0 && document.body.innerHTML.indexOf('/4</em>')>=0);
    // 5) Стэнд-ины на вечер: неполный состав, ответ «стэнд-ины» — вечер играется, в состав не пишутся.
    seed('2024-06-02', {size:2}, {c:'de'});
    CAREER.partners=(CAREER.partners||[]).slice(0, 1); CAREER.rosters={}; careerSave(); CC_VICTORY_LIST=null;
    document.getElementById('majorStages').innerHTML=''; careerRenderHub('centre');
    const sIv=setInterval(()=>{ const b=document.querySelector('.cc-evpick [data-k="go"]'); if(b) b.click(); }, 30);
    const h2=await playThrough('Squads cup stand-ins');
    clearInterval(sIv);
    const l2=lastLog();
    out.steps.push('stand-ins night: '+h2+' · '+JSON.stringify(l2).slice(0,400));
    check('стэнд-ины сыграли вечер', l2 && (l2.mates||[]).length===3, JSON.stringify(l2 && l2.mates));
    check('стэнд-ины не записаны в состав', !((CAREER.rosters||{})[4]||[]).length);
    check('без ошибок JS', out.errs.length===0, out.errs.slice(0,3).join(' | '));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccevpick-'));
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
console.log('OK check-career-evpick');
