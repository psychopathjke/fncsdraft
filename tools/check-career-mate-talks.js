// Переговоры с будущим тиммейтом (его слово 7.10: «а переговоры с потенциальным тимейтом как», без раздела призовых).
// Правила: аргументы после отказа — только правдивые («играли вместе» есть только при общем вечере в журнале,
// «земляки» — только при одной стране, «свой клуб» — только в основе клуба, «буткемп» — только при $1000 и
// списывает их); когда не хватило немного — условие вместо отказа (одна роль → «пересядь», иначе — пробный кап);
// пробный кап по первому вечеру вместе: хорошо — остаётся, плохо — уходит.
//   node tools/check-career-mate-talks.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(String.fromCharCode(92)).join('/');
const CH = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => fs.existsSync(p));
const BOOT = `<pre id="__out" style="display:none"></pre><script>window.addEventListener('load',()=>setTimeout(()=>{ const out={fails:[], notes:{}};
const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d!=null ? ': '+d : '')); };
try{
  const seed=(ovr, country, extra)=>{
    localStorage.setItem('fncsdraft_career', JSON.stringify({v:1,
      player:{nick:'Talk', age:18, source:'rookie', country:country||'de', countryPing:15, closeRangeEdge:0, region:'EU', ovr:ovr, role:'roleIGL',
              attrs:ccRookieAttrs(ovr,'roleIGL'), ageEdge:0, photo:null, handle:null, cardRegion:null, nat:null},
      career:Object.assign({season:1, day:'2026-02-10', division:1, earnings:0, balance:0, reach:500, tokens:[], log:[], news:[]}, extra||{}), partner:null, partners:[]}));
    careerLoad(); };
  seed(84);
  const pool=careerDuoSearchPool(true).filter(w=>w && w.handle && !(careerDmMateOf(w) && careerDuoBeatsYou(w)));
  out.notes.pool=pool.length;
  const marg=w=>{ CAREER.dmBoost=0; return careerDmMargin(w); };
  const near=pool.filter(w=>{ const m=marg(w); return m<0 && m>=-CC_DM_COND; });
  const far=pool.filter(w=>marg(w)<-CC_DM_COND-1 && marg(w)>-50);
  const roleOf=w=>((w.card ? attrsFor(w.card) : attrsFor(w))||{}).roleKey;
  const nearOther=near.find(w=>roleOf(w)!==ccRoleNow()), nearSame=near.find(w=>roleOf(w)===ccRoleNow());
  out.notes.near=near.length; out.notes.far=far.length;
  check('в поиске есть те, кому не хватило немного', near.length>0);

  // ---- условие «пробный кап» и сам пробный кап
  if(nearOther){
    careerDmWrite(nearOther.handle);
    let t=careerDmFind(nearOther.handle);
    check('немного не хватило — условие, а не отказ', t && t.state==='cond' && t.cond==='trial', t && (t.state+'/'+t.cond));
    careerDmCond(t.id, true);
    check('согласился на пробу — можно брать', t.state==='offer' && t.trial===true, t.state);
    careerDmAccept(t.id);
    const inSquad=()=>careerMates().some(m=>m && hKey(m)===hKey(nearOther.handle));
    check('взял на пробу — он в составе', inSquad());
    const d0=CAREER.career.day; careerDmDays(d0, ccAddDays(d0,1));   // отметка дня начала пробы
    CAREER.career.day=ccAddDays(d0, 2);
    CAREER.career.log.push({season:1, day:CAREER.career.day, kind:'cup', place:640, of:700, passed:false, mate:nearOther.handle});
    careerDmDays(CAREER.career.day, ccAddDays(CAREER.career.day, 1));
    out.notes.trialBad={state:t.state, last:(t.msgs[t.msgs.length-1]||{}).k, inSquad:inSquad()};
    check('плохой пробный кап — ушёл', !inSquad() && t.msgs.some(m=>m.k==='dmTrialGo'), JSON.stringify(out.notes.trialBad));
  } else out.fails.push('нет кандидата с другой ролью рядом с порогом');

  // ---- условие «пересядь»
  seed(84);
  if(nearSame){
    careerDmWrite(nearSame.handle);
    const t=careerDmFind(nearSame.handle);
    check('та же роль — условие «пересядь»', t && t.state==='cond' && t.cond==='role', t && (t.state+'/'+t.cond));
    const was=ccRoleNow(); careerDmCond(t.id, true);
    check('пересел — роль сменилась и он согласен', ccRoleNow()!==was && t.state==='offer', ccRoleNow()+' / '+t.state);
  } else out.notes.noSameRole=true;

  // ---- аргументы: только правдивые
  seed(70);
  const far70=careerDuoSearchPool(true).filter(w=>w && w.handle && !(careerDmMateOf(w) && careerDuoBeatsYou(w)) && marg(w)<-CC_DM_COND-1 && marg(w)>-50);
  out.notes.far70=far70.length;
  const target=far70[0];
  if(target){
    seed(70, 'zz', {balance:0});
    careerDmWrite(target.handle);
    let t=careerDmFind(target.handle);
    const a0=careerDmArgs(t);
    out.notes.argsBare=a0;
    check('без общих вечеров, страны, клуба и денег — этих аргументов нет', !a0.some(a=>['history','nat','club','camp'].indexOf(a)>=0), a0.join(','));
    const code=ccDuoNatCode(target);
    seed(70, code||'de', {balance:5000, log:[{season:1, day:'2026-01-20', kind:'cup', place:5, of:700, passed:true, mate:target.handle}]});
    CAREER.org={name:'Probe Club', salary:3000, academy:false, tier:80, since:1};
    careerDmWrite(target.handle);
    t=careerDmFind(target.handle);
    const a1=careerDmArgs(t);
    out.notes.argsFull=a1;
    check('общий вечер — «играли вместе»', a1.indexOf('history')>=0, a1.join(','));
    if(code) check('одна страна — «земляки»', a1.indexOf('nat')>=0, a1.join(','));
    check('в основе клуба — «зову в свой клуб»', a1.indexOf('club')>=0, a1.join(','));
    check('есть $1000 — «буткемп»', a1.indexOf('camp')>=0, a1.join(','));
    const b0=CAREER.career.balance; careerDmArgue(t.id, 'camp');
    check('буткемп списывает $1000', CAREER.career.balance===b0-CC_ARG_CAMP, b0+' -> '+CAREER.career.balance);
  } else out.fails.push('нет кандидата далеко от порога');
  // ---- без спама (его слово 7.10: «просто так можно бесконечно спамить и роли»)
  seed(70);
  const r0=ccRoleNow(); careerRoleSwap(); const r1=ccRoleNow(); careerRoleSwap(); const r2=ccRoleNow();
  out.notes.roleSpam={r0, r1, r2, cool:ccRoleCooldown()};
  check('роль сменилась один раз, вторая смена подряд — нет', r1!==r0 && r2===r1 && ccRoleCooldown()>0, JSON.stringify(out.notes.roleSpam));
  const names=careerDuoSearchPool(true).filter(w=>w && w.handle).slice(0, 6).map(w=>w.handle);
  names.forEach(h=>careerDmWrite(h));
  const asked=names.filter(h=>{ const t=careerDmFind(h); return t && t.msgs.some(m=>m.from==='you'); }).length;
  out.notes.asked=asked;
  check('в день — не больше '+CC_DM_ASKS_DAY+' предложений в дуо', asked===CC_DM_ASKS_DAY, String(asked));
  CAREER.career.day=ccAddDays(CAREER.career.day, 1);
  check('назавтра снова можно', ccDmAsksLeft()===CC_DM_ASKS_DAY, String(ccDmAsksLeft()));
  // ---- разговор с тиммейтом: тема раз в день, настрой — от первого разговора (Notion 7.10: «одинаковые сообщения и можно спамить»)
  {
    const card={handle:'TalkMate', region:'EU', rating:80, _ovr:80, nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null};
    localStorage.setItem('fncsdraft_career', JSON.stringify({v:1,
      player:{nick:'Talk', age:18, source:'rookie', country:'de', countryPing:15, closeRangeEdge:0, region:'EU', ovr:80, role:'roleIGL', attrs:ccRookieAttrs(80,'roleIGL'), ageEdge:0, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-10', division:1, earnings:0, balance:0, reach:500, tokens:[], log:[], news:[]},
      partner:{card:card, patience:40, since:'2026-01-01', dev:0}, partners:[{card:card, patience:40, since:'2026-01-01', dev:0}]}));
    careerLoad();
    const pat=()=>(careerMateRec()||{}).patience;
    const p0=pat(), ok1=careerMateTalk('life'), p1=pat(), ok2=careerMateTalk('life'), p2=pat(), ok3=careerMateTalk('night'), p3=pat();
    out.notes.talk={p0, p1, p2, p3, ok1, ok2, ok3, topics:careerMateTopics()};
    check('первая «как сам?» — настрой вырос', ok1 && p1>p0, JSON.stringify(out.notes.talk));
    check('вторая за день — не проходит', ok2===false && p2===p1);
    check('другая тема в тот же день — можно, но без настроя', ok3===true && p3===p2);
    check('о чём уже говорили — кнопки нет', careerMateTopics().indexOf('life')<0 && careerMateTopics().indexOf('night')<0, careerMateTopics().join(','));
    check('темы «про роли» больше нет', careerMateTopics().indexOf('role')<0 && CC_MATE_TOPICS.indexOf('role')<0);
    check('без PR соперников не называет', !ccMateRival() && careerMateTopics().indexOf('rival')<0);
    const ad=ccAbsDay(CAREER.career.season, careerToday());
    CAREER.career.pr={rows:{TalkMate:{v:[[9000,ad]],n:2}, Peterbot:{v:[[7000,ad]],n:2}, Talk:{v:[[500,ad]],n:2,you:true}}};
    const rv=ccMateRival(); out.notes.rival=rv;
    if(rv){ CAREER.career.day=ccAddDays(CAREER.career.day, 1);
      check('про соперников — есть, когда есть PR', careerMateTopics().indexOf('rival')>=0, careerMateTopics().join(','));
      careerMateTalk('rival'); const lm=careerMateThread().msgs.slice(-1)[0];
      check('напарник называет соперника и место', lm && lm.k==='dmMateTalkrival' && lm.a && lm.a[0]===rv.name && lm.a[1]===rv.place, JSON.stringify(lm));
      check('соперник — не ты и не он', !/^(Talk|TalkMate)$/.test(rv.name)); }
    else out.notes.noPr=true;
    CAREER.career.day=ccAddDays(CAREER.career.day, 1);
    check('назавтра тема снова есть', careerMateTopics().indexOf('life')>=0, careerMateTopics().join(','));

    // ---- тон разбора после плохого вечера
    const pr=()=>careerMateRec();
    CAREER.career.log.push({season:1, day:CAREER.career.day, kind:'cup', place:600, of:700, passed:false, mate:'TalkMate'});
    check('после плохого вечера — тема разбора', careerMateTopics().indexOf('review')>=0, careerMateTopics().join(','));
    careerMateTalk('review');
    check('разбор спрашивает тон', careerMateThread().revAsk===true);
    const v=ccVoiceOf('TalkMate'), b0=pr().patience;
    careerMateReview('blame');
    const dBlame=pr().patience-b0;
    out.notes.review={voice:v, blame:dBlame, want:CC_REV_TONE.blame[v]};
    check('наезд — минус к настрою по характеру', dBlame===CC_REV_TONE.blame[v], JSON.stringify(out.notes.review));
    check('разбор этого вечера — один раз', careerMateTopics().indexOf('review')<0);

    // ---- план на вечер
    let cupDay=null; careerEvents().forEach((l, d)=>{ if(!cupDay && d>CAREER.career.day && (l||[]).some(e=>e && e.kind && e.kind!=='nations')) cupDay=d; });
    if(cupDay){
      CAREER.career.day=cupDay;
      check('в день турнира — тема плана', careerMateTopics().indexOf('plan')>=0, careerMateTopics().join(','));
      careerMatePlanSet('aggr'); CAREER.career.playStyle='key';
      const p1=pr().patience; careerMatePlanAfter();
      check('сыграли как договорились — плюс', pr().patience===p1+CC_PLAN_KEPT && careerMateThread().msgs.some(m=>m.k==='dmPlanKept'), p1+' -> '+pr().patience);
      check('план на день — один раз', careerMateTopics().indexOf('plan')<0);
      CAREER.career.day=ccAddDays(cupDay, 7);
      let d2=null; careerEvents().forEach((l, d)=>{ if(!d2 && d>=CAREER.career.day && (l||[]).some(e=>e && e.kind && e.kind!=='nations')) d2=d; });
      if(d2){ CAREER.career.day=d2; careerMatePlanSet('zone'); CAREER.career.playStyle='key'; const p2=pr().patience; careerMatePlanAfter();
        check('договорились от зоны, а сыграли агрессивно — минус', pr().patience===Math.max(0, p2+CC_PLAN_BROKEN), p2+' -> '+pr().patience); }
    } else out.fails.push('нет дня с турниром для плана');

    // ---- честно о переманивании
    let hu=null;
    for(let i=0; i<400 && !hu; i++){
      pr().patience=CC_POACH_SAFE-5; pr().headsUp=null;
      CAREER.career.day=ccAddDays('2026-03-01', i);
      const th=careerMatePoach(1, 50, true);
      if(th && th.state==='headsup') hu=th;
    }
    check('чуть не хватило настроя — сначала честно говорит', !!hu);
    if(hu){
      const p3=pr().patience; careerMateHeadsUp(true);
      out.notes.headsup={before:p3, after:pr().patience, still:!!careerPartnerCard()};
      check('«останься» — остаётся и настрой выше', !!careerPartnerCard() && pr().patience===Math.min(100, p3+CC_HEADSUP_KEEP), JSON.stringify(out.notes.headsup));
      check('раз в сезон', careerMatePoach(1, 50, true)===null || careerMateThread().state!=='headsup');
    }
  }
}catch(e){ out.fails.push(String(e.stack||e)); }
document.getElementById('__out').textContent='@@B@@'+encodeURIComponent(JSON.stringify(out))+'@@E@@'; }, 500));<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mtalk-')), tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CH, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--virtual-time-budget=300000', '--dump-dom', 'file:///' + tmp.split(String.fromCharCode(92)).join('/')], { maxBuffer: 1 << 30, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const out = JSON.parse(decodeURIComponent(dom.match(/@@B@@([^@<]*)@@E@@/)[1]));
if (out.fails.length) { console.log(['FAIL ' + JSON.stringify(out.notes)].concat(out.fails).join(String.fromCharCode(10))); process.exit(1); }
console.log('OK переговоры с тиммейтом ' + JSON.stringify(out.notes));
