// Кубок наций — сборные стран в карьере.
//
// Его слово 21 сентября 2026: «пусть в Европе будут квалификации с Европы, в скваде 4 лучших
// игрока страны». Проверяется: книга сборных из карточек (страна = 4 лучших из всех регионов,
// зона — где большинство; квоты 25 = 10+5+3+3+2+2); три дня в календаре каждого мира; игрок
// 96 из Дании — в четвёрке, отбор не нужен, квалификация играется, финал — 25 сборных по 4;
// игрок 70 из Германии — не в четвёрке, отбор играется (соло среди людей страны), проигрыш
// закрывает дверь, мир играет без него и пишет в ленту; год скипом без ошибок.
//
//   node tools/check-career-nations.js
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
  const out={fails:[], notes:{}, err:null, errs:[]};
  window.addEventListener('error', e=>{ out.errs.push(String(e.message)+' @'+e.lineno); });
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  const wait=ms=>new Promise(r=>setTimeout(r, ms));
  const card=(h, o)=>({handle:h, region:'EU', rating:o, _ovr:o, nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
  const seed=(ovr, country, day, extra)=>{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Natman', age:20, source:'rookie', country:country, countryPing:15, closeRangeEdge:6,
        region:'EU', ovr:ovr, role:'roleIGL', attrs:null, ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
      career:Object.assign({season:1, size:2, day:day, division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'nat'+ovr}, extra||{}),
      partners:[{card:card('M1',88), patience:60, since:'2026-01-01', dev:0}]}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career')); s.player.attrs=ccRookieAttrs(ovr, 'roleIGL'); localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerEntry();
  };
  const playThrough=async what=>{
    careerRenderHub('centre');
    const play=document.querySelector('#screen-career-hub .ch-play');
    if(!play) throw new Error(what+': no button');
    if((play.getAttribute('onclick')||'').indexOf('careerPlay')<0) throw new Error(what+': button skips: '+play.textContent.trim());
    const sk=setInterval(()=>{ const b=document.getElementById('majorSkipBtn'); if(b && !b.disabled) b.click(); }, 20);
    play.click();
    let c=null;
    for(let i=0;i<16000 && !c;i++){ await wait(25); c=[...document.querySelectorAll('#majorStages .stage-card')].find(x=>x.querySelector('button[onclick*="careerBackToHub"]')); }
    clearInterval(sk);
    if(!c) throw new Error(what+': no result card');
    const head=c.querySelector('h4').textContent.replace(/\\s+/g,' ').trim();
    c.querySelector('button[onclick*="careerBackToHub"]').click();
    return head;
  };
  try{
    // ---- книга сборных ------------------------------------------------------
    seed(96, 'dk', '2026-10-28');
    const book=ccNationsBook();
    out.notes.countries=book.list.length;
    check('стран с четвёркой не меньше 50', book.list.length>=50, String(book.list.length));
    check('у каждой сборной четыре карточки по убыванию силы', book.list.every(r=>r.top.length===4 && ccCardOvr(r.top[0])>=ccCardOvr(r.top[3])));
    check('США — зона Северной Америки, Дания — Европа', book.byNat['США'] && book.byNat['США'].zone==='NA' && book.byNat['Дания'] && book.byNat['Дания'].zone==='EU', JSON.stringify([book.byNat['США']&&book.byNat['США'].zone, book.byNat['Дания']&&book.byNat['Дания'].zone]));
    // Его отчёт 22.09: «Китай играет на Америке» — зона по географии (ближайший сервер), не по ростерам.
    // И «Испания в Мидл Исте» (его отчёт 22.09) — тот же корень: зона по ростерам, не по карте.
    check('Испания — Европа по пингу', book.byNat['Испания'] && book.byNat['Испания'].zone==='EU', JSON.stringify(book.byNat['Испания']&&book.byNat['Испания'].zone));
    check('Китай — Азия, Казахстан — Ближний Восток, даже если их люди сидят в чужих ростерах', (!book.byNat['Китай'] || book.byNat['Китай'].zone==='ASIA') && (!book.byNat['Казахстан'] || book.byNat['Казахстан'].zone==='ME'), JSON.stringify([book.byNat['Китай']&&book.byNat['Китай'].zone, book.byNat['Казахстан']&&book.byNat['Казахстан'].zone]));
    check('квоты — 25 мест', Object.values(CC_NATIONS_SLOTS).reduce((a,b)=>a+b,0)===25);
    const days=['2026-10-31','2026-11-07','2026-11-14'].map(d=>(careerEvents().get(d)||[]).find(e=>e.kind==='nations'));
    check('три дня Кубка наций в календаре 2026-го', days.every(Boolean), JSON.stringify(days.map(e=>e&&e.id)));
    check('и названы словарём, финал — с городом', days[2] && days[2].label===L().ccYearNames.NationsFinal.replace('{CITY}', ccLanCity('nations',1)), days[2]&&days[2].label);
    // ---- 96 из Дании: в четвёрке, отбор не нужен -----------------------------
    const mine=ccNationsMine();
    check('датчанин 96 — в четвёрке страны', mine && mine.seat==='auto' && mine.inSquad && mine.squad.length===4, JSON.stringify(mine && {seat:mine.seat, n:mine.squad.length}));
    careerAdvanceTo('2026-10-31');
    check('в день отбора играть нечего — ты уже в составе (или капитан)', careerCanPlayKind('nations')===false && (ccNatWhyLocked()===L().ccNatLockedIn || ccNatWhyLocked()===L().ccNatLockedCap), ccNatWhyLocked());
    careerAdvanceTo('2026-11-07');
    check('квалификация открыта', careerCanPlayKind('nations')===true); out.notes.dbg={can:careerCanPlayKind('nations'), next:careerNext(), canNext:careerCanPlay(careerNext()), ev:careerNationsOn(careerToday()), mine:(function(){ const m=ccNationsMine(); return m && {seat:m.seat, inSquad:m.inSquad, zone:m.zone}; })(), N:CAREER.career.nations};
    const h1=await playThrough('qual');
    out.notes.qual=h1;
    const N=CAREER.career.nations;
    check('квалификация Европы записана: 10 сборных', N && N.qualDone.EU && (N.qualified.EU||[]).length===10, JSON.stringify(N && N.qualified.EU));
    const lq=(CAREER.career.log||[]).find(r=>r.kind==='nations' && r.stage==='qual');
    // Его вопрос 22.09: «почему 14 команд вместо 25 в квалах» — в Европе 28 стран, две комнаты по 14.
    // Теперь одна комната: 25 сильнейших сборных зоны, остальные за бортом.
    check('в журнале — квалификация сборной Дании на 25 сборных', lq && lq.nat==='Дания' && lq.of===25, JSON.stringify(lq));
    out.notes.qualPlace=lq && lq.place;
    // Финал: если Дания прошла — играем; нет — мир играет сам, но остальные зоны всё равно сыграны.
    careerAdvanceTo('2026-11-14');
    const through=(N.qualified.EU||[]).indexOf('Дания')>=0;
    out.notes.dbg2=(function(){ try{ const ev=careerNationsOn(careerToday()); const m=ccNationsMine(); return {ev, can:careerNationsCan(ev), inSquad:m&&m.inSquad, zone:m&&m.zone, q:N.qualified[m&&m.zone], fd:N.finalDone, today:careerToday(), playable:CC_PLAYABLE.indexOf('nations'), live:ccMpLive(), nomate:careerNoMate('nations')}; }catch(e){ return String(e.stack||e); } })();
    check('финал открыт ровно тогда, когда Дания прошла', careerCanPlayKind('nations')===through, String(through)+' vs '+careerCanPlayKind('nations'));
    if(through){
      const h2=await playThrough('final');
      out.notes.final=h2;
      const lf=(CAREER.career.log||[]).find(r=>r.kind==='nations' && r.stage==='final');
      check('финал — 25 сборных', lf && lf.of===25, JSON.stringify(lf && {of:lf.of, place:lf.place}));
      check('в финале записаны все качественные из шести зон', Object.keys(N.qualified).length===6, JSON.stringify(Object.keys(N.qualified)));
      // Его фонд: $3 000 000 на 25 мест, тебе четверть командного; финал — ЛАН в Европе.
      check('фонд финала — $3 000 000 на 25 мест', Object.values(CC_NATIONS_PRIZES).reduce((x,y)=>x+y,0)===3000000 && Object.keys(CC_NATIONS_PRIZES).length===25);
      check('за место в финале заплатили четверть командного', lf && lf.prize===Math.round(nationsPrize(lf.place)/4) && CAREER.career.earnings>0, JSON.stringify({prize:lf&&lf.prize, place:lf&&lf.place, earn:CAREER.career.earnings}));
      const host=ccLanHostKey('nations', 1), hn=ccLanNat('nations', 1);
      out.notes.host=host+'/'+hn;
      check('хозяин финала — европейский зал, не там, где Саммит и Глобалы', CC_NAT_EU_HOSTS.indexOf(host)>=0 && hn!==ccLanNat('summit',1) && hn!==ccLanNat('globals',1), out.notes.host);
      check('день финала носит город', days[2] && days[2].label.indexOf(ccLanCity('nations',1))>0 && !!days[2].lan, JSON.stringify(days[2]));
      check('перелёт записан', !!(CAREER.career.lan && CAREER.career.lan['nations|1']), JSON.stringify(CAREER.career.lan));
    } else {
      careerSkipWeek();
      check('мир сыграл финал сам', N.finalDone===true && Object.keys(N.qualified).length===6, JSON.stringify(N));
    }
    check('без ошибок JS', out.errs.length===0, out.errs.slice(0,3).join(' | '));
    // ---- 70 из Германии: отбор, проигрыш, мир без него ----------------------
    seed(70, 'de', '2026-10-28');
    const m2=ccNationsMine();
    check('немец 70 — не в четвёрке, нужен отбор', m2 && m2.seat==='trial' && !m2.inSquad, JSON.stringify(m2 && {seat:m2.seat}));
    careerAdvanceTo('2026-10-31');
    check('отбор открыт', careerCanPlayKind('nations')===true);
    const h3=await playThrough('trial');
    out.notes.trial=h3;
    const N2=CAREER.career.nations;
    const lt=(CAREER.career.log||[]).find(r=>r.kind==='nations' && r.stage==='trial');
    check('отбор записан соло среди людей страны', lt && lt.of>=20 && (lt.mates||[]).length===0, JSON.stringify(lt && {of:lt.of, place:lt.place}));
    check('исход отбора записан', N2.trial==='won' || N2.trial==='lost', String(N2.trial));
    if(N2.trial==='lost'){
      careerAdvanceTo('2026-11-07');
      check('без места в составе квалификация закрыта', careerCanPlayKind('nations')===false && ccNatWhyLocked()===L().ccNatTrialLost, ccNatWhyLocked());
      let g=0; while(CAREER.career.day<'2026-11-15' && g++<30) careerSkipWeek();
      check('мир сыграл квалификации и финал без него', N2.finalDone===true && Object.keys(N2.qualified).length===6, JSON.stringify({done:N2.finalDone, q:Object.keys(N2.qualified)}));
      check('и написал в ленту про сборную', (CAREER.career.news||[]).some(n=>/Германи/.test(String(n.text||n.t||JSON.stringify(n)))), '');
    }
    check('без ошибок JS', out.errs.length===0, out.errs.slice(0,3).join(' | '));
    // ---- 99 из Германии: капитан, сам выбирает двоих, четвёртое место — отбор без него ----
    // Его слово 22.09: «если у игрока самый большой рейтинг, он сам может себе выбрать 2 игроков,
    // и 3[-е место] квалу играет; и в карьере должна быть эта сборная где-то перед началом турнира».
    seed(99, 'de', '2026-10-20');
    const m3=ccNationsMine();
    check('немец 99 — капитан сборной', m3 && m3.captain===true && m3.inSquad && m3.seat==='auto', JSON.stringify(m3 && {cap:m3.captain, seat:m3.seat}));
    check('пока никого не выбрал — в составе два пустых места', m3 && m3.picks.length===0 && m3.squad.length===4 && m3.squad.filter(Boolean).length===2, JSON.stringify(m3 && m3.squad.map(c=>c&&c.handle)));
    careerRenderHub('centre');
    let hub=document.getElementById('screen-career-hub').innerHTML;
    check('карточка сборной стоит в хабе до турнира: страна и кнопки выбора', hub.indexOf(L().ccNatSquadTitle)>=0 && /ccNatPick\\(/.test(hub) && hub.indexOf(L().ccNatPickHint)>=0, '');
    const k5=hKey(m3.others[5]), k7=hKey(m3.others[7]), k9=hKey(m3.others[9]);
    ccNatPick(k5); ccNatPick(k7); ccNatPick(k9);
    const m4=ccNationsMine();
    check('взял двоих, третьего не дало', m4.picks.length===2 && m4.picks.map(hKey).join()===[k5,k7].join(), JSON.stringify(m4.picks.map(c=>c.handle)));
    check('состав: я, двое моих, четвёртый — сильнейший из остальных (место отбора)', m4.squad.length===4 && hKey(m4.squad[0])===hKey(careerCard()) && hKey(m4.squad[1])===k5 && hKey(m4.squad[2])===k7 && hKey(m4.squad[3])===hKey(m4.others[0]), JSON.stringify(m4.squad.map(c=>c&&c.handle)));
    ccNatPick(k5);
    check('повторное нажатие убирает из состава', ccNationsMine().picks.length===1, '');
    ccNatPick(k5);
    hub=(careerRenderHub('centre'), document.getElementById('screen-career-hub').innerHTML);
    check('карточка сборной показывает четверых с пометкой капитана', hub.indexOf(L().ccNatCaptain)>=0 && hub.indexOf(m4.others[5].handle)>=0 && hub.indexOf(m4.others[0].handle)>=0, '');
    // Метка сборной: своя карта под сквады, своя кладовая, командные слоты не занимает.
    // Его слова 22.09: «прямоугольники для всех карт должны быть под сквады», «где команда
    // сборной, должен быть выбор локации».
    check('в списке карт появилась карта сборной', careerSpotSets().some(t=>t.key==='nations' && t.squad), JSON.stringify(careerSpotSets().map(t=>t.key)));
    check('карточка сборной зовёт выбрать локацию', hub.indexOf("careerSpotOpenFor('nations')")>=0, '');
    const sqKeep=ccSquadKeep(careerBrSet());
    check('сетка под сквады короче дуо-сетки на всех островах', sqKeep.length<ZONE_SETS[careerBrSet()].length && ['t1','t2','t3','f1','m1'].every(k=>ccSquadKeep(k).length<ZONE_SETS[k].length && ccSquadKeep(k).length>=16), JSON.stringify(['t1','f1','m1'].map(k=>ccSquadKeep(k).length)));
    const prevSet=ACTIVE_LANDING_SET, prevSq=squadSize; squadSize=4; useLandingSet('t1');
    check('в сквадном вечере остров 2025-го тоже прорежен', ALL_LANDING_ZONES.length===ccSquadKeep('t1').length && ALL_LANDING_ZONES.length<ZONE_SETS.t1.length, ALL_LANDING_ZONES.length+'/'+ZONE_SETS.t1.length);
    squadSize=prevSq; useLandingSet(prevSet);
    careerTab('me'); careerSpotOpenFor('nations');
    const tileEl=(document.querySelector('#screen-career-hub .cc-spot-open-head')||{}).closest ? document.querySelector('#screen-career-hub .cc-spot-open-head').closest('.ch-tile') : null;
    const drawn=tileEl ? tileEl.querySelectorAll('.land-zone').length : -1;
    check('карта сборной рисует только сквадные прямоугольники', drawn===sqKeep.length && sqKeep.length<ZONE_SETS[careerBrSet()].length, drawn+' vs '+sqKeep.length+' of '+ZONE_SETS[careerBrSet()].length);
    const used0=careerSpotUsed();
    careerSpotSet(sqKeep[0], 'nations');
    check('метка сборной лежит отдельно и слоты команды не ест', careerSpotList('nations').length===1 && !!CAREER.career.natSpots && careerSpotUsed()===used0 && careerSpotList(careerBrSet()).length===0, JSON.stringify({used:careerSpotUsed(), nat:CAREER.career.natSpots}));
    careerTab('centre');
    check('вечер сборной читает её метку', careerNightSpotKey({type:'nations', day:'2026-11-07'})==='nations');
    hub=(careerRenderHub('centre'), document.getElementById('screen-career-hub').innerHTML);
    check('карточка сборной показывает выбранную локацию', hub.indexOf(L().landingZoneSuffix(sqKeep[0]+1))>=0, '');
    careerAdvanceTo('2026-10-31');
    check('в день отбора капитан не играет — отбор за четвёртое место без него', careerCanPlayKind('nations')===false && ccNatWhyLocked()===L().ccNatLockedCap, ccNatWhyLocked());
    careerAdvanceTo('2026-11-07');
    check('квалификация капитану открыта', careerCanPlayKind('nations')===true);
    const h4=await playThrough('qual-cap'); out.notes.qualCap=h4;
    const lq2=(CAREER.career.log||[]).filter(r=>r.kind==='nations' && r.stage==='qual').pop();
    check('в журнале квалификации — мои двое и четвёртый', lq2 && (lq2.mates||[]).length===3 && JSON.stringify(lq2.mates).indexOf(m4.others[5].handle)>=0 && JSON.stringify(lq2.mates).indexOf(m4.others[7].handle)>=0, JSON.stringify(lq2 && lq2.mates));
    check('после квалификации состав заперт', (ccNatPick(k9), ccNationsMine().picks.map(hKey).sort().join()===[k5,k7].sort().join()), '');
    check('без ошибок JS (капитан)', out.errs.length===0, out.errs.slice(0,3).join(' | '));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccnat-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(SL).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const html = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=1200000', '--dump-dom',
  'file:///' + tmp.split(SL).join('/')], { maxBuffer: 1 << 28, timeout: 1500000 }).toString();
const m = /PBEGIN(.*?)PEND/.exec(html);
if (!m) { console.log('FAIL: no result'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out.notes));
if (out.errs && out.errs.length) out.errs.slice(0, 5).forEach(e => console.log('JSERR ' + e.slice(0, 300)));
if (out.err) { out.fails.forEach(f => console.log('FAIL ' + f)); console.log('ERR ' + out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
console.log('OK check-career-nations');
