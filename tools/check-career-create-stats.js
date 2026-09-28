// Свои статы на создании (ccSpa*): минус возвращает очки по весу стата, плюс их тратит,
// общий рейтинг растёт не больше запаса, сейв носит те же статы, что превью.
//
//   node tools/check-career-create-stats.js
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
    localStorage.removeItem('fncsdraft_career');
    openCareerCreate(); ccSetMode('rookie');
    document.getElementById('ccNick').value='Statman'; ccSync();
    const base=ccMakePlayer().rating;
    check('запас 50', ccSpaLeft()===CC_SP_START, ccSpaLeft());
    for(let i=0;i<5;i++) ccSpaAdd('exp',-1);
    check('минус опыта вернул 5×5', ccSpaLeft()===CC_SP_START+25, ccSpaLeft());
    let guard=0; while(ccSpaLeft()>=ccSpaCost('aim') && guard++<50) ccSpaAdd('aim',1);
    const aimUp=CC.spa.aim;
    check('стрельба поднята на 6', aimUp===6, aimUp+' left '+ccSpaLeft());
    const lim0=CC.spa.aim; ccSpaAdd('aim',1);
    check('без очков плюс не жмётся', CC.spa.aim===lim0);
    for(let i=0;i<40;i++) ccSpaAdd('con',-1);
    check('минус не дальше ±20', CC.spa.con===-CC_SP_SPAN, CC.spa.con);
    const pv=ccMakePlayer(); out.notes.preview={base, rating:pv.rating, spa:CC.spa};
    check('рейтинг не выше базы +1', pv.rating<=base+1, base+' -> '+pv.rating);
    const shape=ATTR_KEYS.map(k=>pv._attrs[k]).join(',');
    ccStart();
    const sv=JSON.parse(localStorage.getItem('fncsdraft_career')||'null');
    const got=sv && sv.player && sv.player.attrs ? ATTR_KEYS.map(k=>sv.player.attrs[k]).join(',') : null;
    out.notes.saved=got;
    check('сейв = превью', got===shape, got+' vs '+shape);
    // Вкладка «Свои статы до 99»: без бюджета, «Все 99» → сейв с 99 во всех шести и 99 общего.
    localStorage.removeItem('fncsdraft_career');
    openCareerCreate(); ccSetMode('free');
    check('вкладка свободных статов подсвечена', document.getElementById('ccTabFree').classList.contains('on') && !document.getElementById('ccTabRookie').classList.contains('on'));
    check('поле статов видно', getComputedStyle(document.getElementById('ccSpField')).display!=='none');
    document.getElementById('ccNick').value='Maxman'; ccSync();
    ccSpaAll(99);
    const pv99=ccMakePlayer();
    check('превью 99', pv99.rating===99, pv99.rating);
    check('99 встаёт в Дивизион 1', CC.div===1, CC.div);
    ccPickDiv(5);
    check('смена дивизиона не двигает статы', ccMakePlayer()._attrs.aim===99, ccMakePlayer()._attrs.aim);
    ccSpaAll(99);
    ccSpaSet('exp', 60);
    check('число в поле ставит стат', ccMakePlayer()._attrs.exp===60, ccMakePlayer()._attrs.exp);
    ccSpaSet('exp', 150);
    check('выше 99 не бывает', ccMakePlayer()._attrs.exp===99);
    ccStart();
    const sv99=JSON.parse(localStorage.getItem('fncsdraft_career')||'null');
    out.notes.free={ovr:sv99&&sv99.player.ovr, attrs:sv99&&sv99.player.attrs&&ATTR_KEYS.map(k=>sv99.player.attrs[k]).join(',')};
    check('сейв: все шесть 99', !!sv99 && ATTR_KEYS.every(k=>sv99.player.attrs[k]===99), JSON.stringify(out.notes.free));
    check('сейв: общий 99', !!sv99 && Math.round(sv99.player.ovr)===99, JSON.stringify(out.notes.free));
    check('сейв: Дивизион 1', !!sv99 && sv99.career.division===1, sv99 && sv99.career.division);
    // Поиск напарника у 99-го — настоящие сильные игроки, а не шестидесятые.
    try{ careerEntry(); }catch(e){}
    const pool=careerDuoSearchPool(true).slice(0, 20).map(w=>w.ovr);
    out.notes.mates=pool;
    check('напарники 99-го — 85+', pool.length>0 && pool[0]>=85, pool.join(','));
    // И обычная вкладка возвращается к бюджету.
    openCareerCreate(); ccSetMode('rookie');
    check('в «Новичке» снова бюджет', !CC.spaFree && ccSpaLeft()===CC_SP_START);
    check('без ошибок JS', out.errs.length===0, out.errs.slice(0,3).join(' | '));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cccrst-'));
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
console.log('OK check-career-create-stats');
