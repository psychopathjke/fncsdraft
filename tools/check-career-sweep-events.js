// Турниры сверки с Liquipedia 29.09: ESL Katowice Royale Polish Edition 2019 (только поляки), World Cup
// Warmup 2019 (онлайн-кап по регионам), Australian Open Summer Smash 2020/2022/2023 (OCE),
// Ascension 2024 (французы), Amar x Rohat Cup 2024; 2025–26: Cracked Cup, Games of the Future,
// Lost Legends European Showdown (ZB-сквады), Virtuocity Qatar 2026 (ME). Стоят ли в календаре и кого зовут; два вечера играются.
//
//   node tools/check-career-sweep-events.js
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
    const at=(day, who)=>{ seed(day, null, who); CC_VICTORY_LIST=null; const v=careerVictoryOn(day); return {id:v&&v.id, inv:v?ccVictoryInvited(v):null, y:ccCalYear()}; };
    const C=[
      ['2019-02-23', {c:'pl'}, 'LAN_ESL_Katowice_Royale_Polish_Edition_Duos', true],
      ['2019-02-23', {c:'de'}, 'LAN_ESL_Katowice_Royale_Polish_Edition_Duos', false],
      ['2019-02-24', {c:'pl'}, 'LAN_ESL_Katowice_Royale_Polish_Edition_Solos', true],
      ['2019-04-07', {c:'de'}, 'ONL_Fortnite_World_Cup_2019_Warmup', true],
      ['2020-02-02', {c:'au', r:'OCE'}, 'LAN_Australian_Open_Summer_Smash_2020', true],
      ['2020-02-02', {c:'de'}, 'LAN_Australian_Open_Summer_Smash_2020', false],
      ['2022-01-30', {c:'au', r:'OCE'}, 'LAN_Australian_Open_Summer_Smash_2022', true],
      ['2023-01-29', {c:'au', r:'OCE'}, 'LAN_Australian_Open_Summer_Smash_2023', true],
      ['2025-05-31', {c:'de'}, 'LAN_Twitch_Rivals_Cracked_Cup_TwitchCon_Europe_Reload', true],
      ['2026-03-21', {c:'de'}, 'LAN_Amar_Lost_Legends_European_Showdown', true],
      ['2026-09-17', {c:'sa', r:'ME'}, 'LAN_Virtuocity_Battleground_Qatar_2026', true],
      ['2026-09-17', {c:'de'}, 'LAN_Virtuocity_Battleground_Qatar_2026', false],
    ];
    for(const [d, who, id, inv] of C){
      const r=at(d, who);
      out.steps.push(d+' '+who.c+': '+JSON.stringify(r));
      check(d+' '+who.c+' стоит '+id, r.id===id, JSON.stringify(r));
      check(d+' '+who.c+' приглашение '+inv, !!r.inv===inv, JSON.stringify(r));
    }
    // Осень 2024: какой год карьеры их видит (2024-й кончается 29.09).
    out.notes.asc=at('2024-10-26', {c:'fr'}); out.notes.amar=at('2024-11-09', {c:'de'}); seed('2025-12-18', {year:2026, year0:2026}, {c:'de'}); CC_VICTORY_LIST=null; { const v=careerVictoryOn('2025-12-18'); out.notes.gotf={id:v&&v.id, inv:v?ccVictoryInvited(v):null, y:ccCalYear()}; check('Games of the Future в 2026-м', v && v.id==='LAN_Games_of_the_Future_2025_Reload', JSON.stringify(out.notes.gotf)); }
    seed('2019-02-24', null, {c:'pl'});
    const h1=await playThrough('Katowice PL solo');
    const l1=lastLog();
    out.steps.push('Katowice: '+h1+' · #'+(l1&&l1.place)+' $'+(l1&&l1.prize));
    check('Katowice записан', l1 && l1.kind==='victory', JSON.stringify(l1));
    seed('2019-04-07', null, {c:'de'});
    const h2=await playThrough('Warmup');
    const l2=lastLog();
    out.steps.push('Warmup: '+h2+' · #'+(l2&&l2.place)+' $'+(l2&&l2.prize));
    seed('2026-03-21', null, {c:'de'});
    const h3=await playThrough('Lost Legends');
    const l3=lastLog();
    out.steps.push('Lost Legends: '+h3+' · #'+(l3&&l3.place)+' $'+(l3&&l3.prize)+' size '+(l3&&l3.size));
    check('Lost Legends записан', l3 && l3.kind==='victory', JSON.stringify(l3));
    check('Warmup записан', l2 && l2.kind==='victory', JSON.stringify(l2));
    check('без ошибок JS', out.errs.length===0, out.errs.slice(0,3).join(' | '));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccsweep-'));
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
console.log('OK check-career-sweep-events');
