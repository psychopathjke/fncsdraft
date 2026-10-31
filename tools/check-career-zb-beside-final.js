// ЗБ-сквад-кап в день Weekly Final играется по выбору (Notion 31.10: «почему он не играется», «он в один день с финалами»).
// По правилу 23.10 день играет старший турнир; кап рядом выбирается кнопкой на панели дня, только в одиночной.
// Проверка: по умолчанию финал, кнопки «Weekly Final | ЗБ», выбор ЗБ меняет день, кнопка финала возвращает, вечер ЗБ доигрывается.
//
//   node tools/check-career-zb-beside-final.js
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
    const cb=document.querySelector(".cc-choice-btn:not(.cc-evpick-auto):not(.cc-evpick-play)"); if(cb){ cb.click(); return; }
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
        // Лимит «три письма в день» (ccDmAsksLeft) — не предмет этой проверки: счётчик обнуляется на каждое письмо.
        CAREER.career.dmAsks=null;
        CC_DUO_FMT=fmt; ccDuoFindWrite(w.handle);
        const t=careerDms().find(x=>hKey(x.who && x.who.handle||'')===hKey(w.handle));
        if(t && t.state==='offer'){ careerDmAccept(t.id); got.push(w.handle); }
      }
      return got;
    };
    const DAY='2022-10-01';
    seed(DAY, {size:2}, {c:'de'});
    CAREER.partners=(CAREER.partners||[]).slice(0, 1); CAREER.rosters={}; careerSave(); CC_VICTORY_LIST=null;
    const zb=ccVictoryAlts(DAY).find(v=>v.zb);
    check('в этот день есть ЗБ-кап', !!zb, JSON.stringify(ccVictoryAlts(DAY).map(v=>v.id)));
    check('по умолчанию день играет Weekly Final', careerNext().type==='final', careerNext().type);
    careerRenderHub('centre'); await wait(400);
    const btns=()=>[...document.querySelectorAll('#screen-career-hub .cc-valt')].map(x=>x.textContent+(x.classList.contains('on')?'*':''));
    out.steps.push('кнопки: '+btns().join(' | ')+' · next '+JSON.stringify(careerNext()).slice(0,200)+' · h3 '+[...document.querySelectorAll('#screen-career-hub h3')].map(x=>x.textContent).join('/')+' · alts '+ccVictoryAlts(DAY).length+' locked '+ccVictoryLocked()+' html '+ccVictoryAltsHTML().length);
    check('на панели дня две кнопки: финал и ЗБ', btns().length===2 && /Weekly Final\*/.test(btns()[0]), btns().join(' | '));
    ccVictoryPick(zb.id);
    check('выбор ЗБ меняет день', careerNext().type==='victory' && careerNext().id===zb.id, careerNext().type+' '+careerNext().id);
    out.steps.push('после выбора: '+btns().join(' | '));
    ccVictoryPick('__day');
    check('кнопка финала возвращает финал', careerNext().type==='final', careerNext().type);
    ccVictoryPick(zb.id);
    const got=await sign(4, 3);
    out.steps.push('сквад подписан: '+JSON.stringify(got));
    const pk=ccEventRosterPick(careerVictoryOn(DAY), 4); await wait(30);
    const go=document.querySelector('.cc-evpick [data-k="go"]'); if(go) go.click(); await pk;
    careerRenderHub('centre');
    const h=await playThrough('ZB squads');
    const l=lastLog();
    out.steps.push('вечер: '+h+' · '+JSON.stringify(l).slice(0,200));
    check('сыгран ЗБ-кап, а не финал', l && /Zero Build/i.test(h), JSON.stringify(l).slice(0,200));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cczbfinal-'));
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
console.log('OK check-career-zb-beside-final');
