// Квалификации составов клуба в менеджере (жалоба игрока 20.10): «ласт ченс сломан», «в финалах дивизиона играет игрок,
// который не прошёл», «прошёл, играет, а в таблице не как наш», «подписал игрока после квалы на Reload — ЛАН он не сыграл».
// Сезон 2026, EU, первый клуб списка, перемоткой до финала Мейджора 1:
//   - финал недели играют ровно те составы, что прошли кубок вторника (билет cr.wf свой у каждого состава);
//   - в живом поле вечера клуба нет игрока клуба в чужой строке и нет ника дважды;
//   - финал Мейджора состав играет один раз; в финал идут ровно составы с билетом;
//   - Ласт Ченс: состав с билетом в поле не сидит; прошедший отсечку открытого этапа играет лобби; билет — только из лобби;
//     смена камеры при отсечке (ведущий за чертой, другой состав над ней);
//   - подписанный после квалификации на финал Reload игрок: его состав играет финал, старой пары в поле нет;
//     место на Reload Championship (relSeats) переходит его составу (календарь).
//   node tools/check-mgr-quals.js          (MGR_PROBE_HTML=путь — прогнать на другой сборке, например на старой)
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(String.fromCharCode(92)).join('/');
const HTML = process.env.MGR_PROBE_HTML || path.join(ROOT, 'index.html');
const CH = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => fs.existsSync(p));
const BOOT = `<pre id="__out" style="display:none"></pre><script>window.addEventListener('load',()=>setTimeout(async ()=>{ const out={fails:[], notes:{}, errs:[]};
const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d!=null ? ': '+d : '')); };
const ce=console.error; console.error=(...a)=>{ out.errs.push(a.map(x=>String(x && x.stack || x)).join(' ').slice(0,300)); ce.apply(console, a); };
try{
  ['fncsdraft_manager','fncsdraft_manager_active'].forEach(k=>localStorage.removeItem(k));
  LANG='ru';
  MGR_NEW_YEAR=2026; MGR_NEW_REGION='EU'; MGR_NEW_SIDE='real'; mgrOpenNew(2026);
  mgrTake(0); MGR.view='result'; out.notes.club=MGR.club.name;
  const H=x=>hKey((x && x.handle) || x);
  const keyOf=sq=>(sq||[]).map(H).sort().join('|');
  const clubSet=()=>new Set(MGR.teams.flatMap(t=>t.cards).concat(MGR.bench||[]).map(H));
  const leaks=[], dups=[], nights=[], sims=[];
  let cur=null, depth=0;
  // Живое поле каждого вечера клуба: чужие строки с людьми клуба и ники дважды.
  const sim0=simulateGamesLive;
  simulateGamesLive=async function(teams){
    const o=arguments[8]||{};
    if(cur){ try{
      const cs=clubSet(), seen=new Map();
      (teams||[]).forEach(t=>{ (t.squad||[]).forEach(c=>{ const k=H(c); seen.set(k, (seen.get(k)||0)+1); });
        if(!t.isYou && !t.isClub){ const hs=(t.squad||[]).map(H).filter(k=>cs.has(k)); if(hs.length) leaks.push(cur.tag+' | '+(o.stageName||'')+' | '+hs.join(',')+' в '+(t.squad||[]).map(c=>c.handle).join('&')); } });
      seen.forEach((n,k)=>{ if(n>1) dups.push(cur.tag+' | '+(o.stageName||'')+' | '+k+'×'+n); });
    }catch(e){ console.error('probe', e); } }
    const res=await sim0.apply(this, arguments);
    if(cur){ try{ const sorted=(teams||[]).slice().sort(mgrRankCmp);
      sims.push({tag:cur.tag, stage:o.stageName||'', n:(teams||[]).length, club:(teams||[]).filter(t=>t.isYou||t.isClub).map(t=>({key:keyOf(t.squad), place:sorted.indexOf(t)+1, wins:t.wins||0}))}); }catch(e){} }
    return res;
  };
  const night0=mgrCarNight;
  mgrCarNight=async function(ev, teams, you){
    const top=!depth; depth++;
    if(top){ cur={tag:ev.day+' '+ev.ck+' '+ev.name}; cur.before={}; MGR.teams.forEach(t=>{ const st=(MGR.tcar||{})[t.id]||{}; cur.before[t.id]=JSON.parse(JSON.stringify({wf:st.wf||null, major:st.major||null, reload:st.reload||null})); }); }
    try{ const parts=await night0.apply(this, arguments);
      if(top){ nights.push({tag:cur.tag, ev, before:cur.before, teams:parts.filter(p=>p.res && (p.res.rows||[]).length).map(p=>p.tm.mgrId), keys:Object.fromEntries(parts.map(p=>[p.tm.mgrId, keyOf(p.tm.squad)]))}); }
      return parts;
    } finally { depth--; if(top) cur=null; }
  };
  const ff=async d=>{ await mgrFastForwardLive(d, true); };

  /* ---------- 1. финал недели и Reload: до хитов кубка 1 ---------- */
  await ff('2026-02-02');
  // Подписанный после квалификации: прошедшая в финал Reload пара мира (не клуб) — её игрока в последний состав клуба.
  const rs=CAREER.career.relSeed, club0=clubSet();
  const wrow=rs && rs.next==='final' && (rs.through||[]).find(r=>r!=='you' && Array.isArray(r) && r.every(c=>!club0.has(H(c.h))) && mgrCard(r[0].h));
  check('после хитов Reload 1 есть прошедшая пара мира', !!wrow, rs && JSON.stringify({next:rs.next, n:(rs.through||[]).length}));
  let signed=null, signedTeam=null;
  if(wrow){
    signed=wrow[0].h;
    // Состав, который сам до финала Reload 1 не дошёл: иначе проверка ничего не докажет.
    const own=t=>{ const r=(MGR.tcar[t.id]||{}).reload; return !!(r && r.series===1 && (r.got==='heat' || r.got==='final')); };
    const tm=MGR.teams.filter(t=>t.cards.length>=2 && !own(t)).slice(-1)[0] || MGR.teams.filter(t=>t.cards.length>=2).slice(-1)[0];
    out.notes.signOwn=own(tm);
    signedTeam=tm.id; const gone=tm.cards[1];
    tm.cards=[tm.cards[0], signed]; MGR.bench=(MGR.bench||[]).concat([gone]);
    MGR_CAR_CACHE=null;
    out.notes.signed=signed+' → '+tm.id+' ('+tm.cards.join('&')+'), была пара '+wrow.map(c=>c.h).join('&');
    const fin=mgrEvents().find(e=>e.kind==='car' && e.ck==='reload' && /финал/.test(e.name));
    out.notes.relFinal=fin && (fin.day+' ['+fin.teams.join(',')+']');
    check('состав подписанного — в календаре финала Reload', !!fin && fin.teams.indexOf(tm.id)>=0, fin && fin.teams.join(','));
  }
  await ff('2026-02-09');
  if(signed){
    const rn=nights.find(n=>n.ev.ck==='reload' && /финал/.test(n.ev.name));
    out.notes.relFinalPlayed=rn && rn.teams.join(',');
    check('состав подписанного сыграл финал Reload', !!rn && rn.teams.indexOf(signedTeam)>=0, rn && rn.teams.join(','));
  }
  // Место на Reload Championship у игрока мира → подписан → его состав в календаре Парижа.
  {
    const cr=CAREER.career, cs=clubSet();
    const seat=(cr.relSeats||[]).find(r=>r && (r.s||1)===(cr.season||1) && (r.h||[]).length && r.h.every(h=>!cs.has(H(h))) && mgrCard(r.h[0]));
    out.notes.seat=seat && seat.h.join('&');
    if(seat){
      const tm=MGR.teams.filter(t=>t.cards.length>=2 && t.id!==signedTeam).slice(-1)[0];
      const rc0=mgrEvents().filter(e=>e.kind==='car' && e.cid==='ReloadChampionshipParis').map(e=>e.teams.join(','));
      const gone=tm.cards[1]; tm.cards=[tm.cards[0], seat.h[0]]; MGR.bench=(MGR.bench||[]).concat([gone]); MGR_CAR_CACHE=null;
      const rc=mgrEvents().filter(e=>e.kind==='car' && e.cid==='ReloadChampionshipParis' && e.teams.indexOf(tm.id)>=0);
      out.notes.rc=rc.map(e=>e.day+' '+e.name+' ['+e.teams.join(',')+']').slice(0,2); out.notes.rc0=rc0.slice(0,2);
      check('место на Reload Championship перешло составу подписанного', rc.length>0, JSON.stringify(rc0));
    } else out.notes.seatNote='мест мира в relSeats нет (финал Reload клубом не играли) — пропуск';
  }
  // Финалы недели: ровно прошедшие кубок вторника.
  const wfs=nights.filter(n=>n.ev.ck==='final');
  check('финалы недели сыграны', wfs.length>0);
  wfs.forEach(n=>{
    const mon=careerMonday(n.ev.day);
    const seated=Object.keys(n.before).filter(id=>n.before[id].wf && n.before[id].wf.monday===mon).sort();
    const cup=(MGR.log||[]).filter(r=>r.car==='cup' && careerMonday(r.day)===mon && r.day!==mon);   // вторник
    const passed=cup.length ? cup[0].teams.filter(t=>t.passed===true).map(t=>t.id).sort() : null;
    const played=n.teams.slice().sort();
    check('финал недели '+n.ev.day+' — только с билетом', played.every(id=>seated.indexOf(id)>=0), 'играли '+played+', билет '+seated);
    if(passed) check('финал недели '+n.ev.day+' — все прошедшие кубок', JSON.stringify(played)===JSON.stringify(passed), 'играли '+played+', прошли '+passed);
  });
  out.notes.wf=wfs.map(n=>n.ev.day+' ['+n.teams.join(',')+']');

  /* ---------- 2. Мейджор 1: Плей-Ин, хиты, Ласт Ченс, финал ---------- */
  await ff('2026-04-19');
  const lcqEv=mgrEvents().find(e=>e.kind==='car' && e.ck==='major' && (careerMajorOn(e.day)||{}).stage==='lcq');
  check('Ласт Ченс Мейджора 1 в календаре', !!lcqEv);
  // Два состава без билета (если сами не прошли — так и есть; иначе снимаем билет и строку из записи прошедших).
  const two=MGR.teams.filter(t=>t.cards.length>=2).slice(0, 2);
  const ms=CAREER.career.majorSeed;
  two.forEach((t, i)=>{ const st=(MGR.tcar[t.id]=MGR.tcar[t.id]||{log:[], tokens:[], division:1});
    st.major={n:1, got:'heats', pass:'playin', ticket:false};
    const k=keyOf(mgrTeamPeople(t)); if(ms && Array.isArray(ms.through)) ms.through=ms.through.filter(r=>r==='you' || (Array.isArray(r) ? r : [r]).map(c=>hKey((c && c.h) || c)).sort().join('|')!==k);
    // второй — сильный (наверняка над отсечкой), первый — ведущий как есть
    if(i===1){ MGR.nightMod=MGR.nightMod||{}; t.cards.forEach(h=>{ MGR.nightMod[hKey(h)]=40; }); } });
  MGR_CAR_CACHE=null;
  const ticketed=MGR.teams.filter(t=>((MGR.tcar[t.id]||{}).major||{}).ticket).map(t=>t.id);
  out.notes.lcqTeams=(mgrEvents().find(e=>e.kind==='car' && e.ck==='major' && (careerMajorOn(e.day)||{}).stage==='lcq')||{}).teams;
  await ff('2026-04-21');
  const ln=nights.find(n=>n.ev.ck==='major' && (careerMajorOn(n.ev.day)||{}).stage==='lcq');
  check('Ласт Ченс сыгран', !!ln);
  if(ln){
    check('составы с билетом в Ласт Ченс не идут', !ln.teams.some(id=>ticketed.indexOf(id)>=0), ln.teams+' / '+ticketed);
    two.forEach(t=>check('состав '+t.id+' без билета сыграл Ласт Ченс', ln.teams.indexOf(t.id)>=0, ln.teams.join(',')));
    const ss=sims.filter(s=>s.tag===ln.tag);
    const open=ss.find(s=>s.stage!==L().ccMajLobby), lobby=ss.find(s=>s.stage===L().ccMajLobby);
    const cut=ccScaleStage(ccMajorStageSpec('lcq', 1)).cut;
    out.notes.lcq=ss.map(s=>s.stage+' n='+s.n+' '+s.club.map(c=>c.key+'#'+c.place+(c.wins ? ' w'+c.wins : '')).join(' ; '));
    ln.teams.forEach(id=>{
      const k=ln.keys[id], o=open && open.club.find(c=>c.key===k), l=lobby && lobby.club.find(c=>c.key===k);
      const st=(MGR.tcar[id]||{}).major||{};
      if(o && o.place<=cut) check('состав '+id+' прошёл отсечку Ласт Ченса ('+o.place+') — играл лобби', !!l, JSON.stringify(out.notes.lcq));
      if(st.ticket) check('билет '+id+' — только из лобби', !!l, JSON.stringify(st));
      if(l && !ccLcByPoints({n:1})) check('билет '+id+' = победа в лобби', !!st.ticket===(l.wins>0), JSON.stringify(st)+' w'+l.wins);
    });
  }
  // Смена камеры по отсечке: ведущий за чертой (60-й), состав клуба над ней (10-й).
  {
    const mk=(i, you)=>({isYou:!!you, isClub:!you, stagePts:1000-i, wins:0, stageElims:0, squad:[{handle:'p'+i}], name:'t'+i});
    const field=[]; for(let i=1; i<=100; i++) field.push(mk(i, i===60));
    const b=field[9]; b.mgrId='tB';
    MGR_CAR_JOIN={teams:[], obj:{tB:b}, rec:{_you:{place:60}, tB:{place:10}}, injected:{}, leadId:'tA', cut:50};
    mgrCarMaybeSwap(field);
    check('ведущий за отсечкой, состав клуба над ней — камера к прошедшему', MGR_CAR_JOIN.swap && MGR_CAR_JOIN.swap.to==='tB', JSON.stringify(MGR_CAR_JOIN.swap||null));
    MGR_CAR_JOIN=null;
  }
  const tick=MGR.teams.filter(t=>((MGR.tcar[t.id]||{}).major||{}).ticket).map(t=>t.id).sort();
  await ff('2026-04-28');
  const fins=nights.filter(n=>n.ev.ck==='major' && (careerMajorOn(n.ev.day)||{}).stage==='final');
  const playedF=fins.flatMap(n=>n.teams);
  out.notes.final=fins.map(n=>n.ev.day+' ['+n.teams.join(',')+']'); out.notes.tickets=tick;
  check('финал Мейджора 1 сыгран', fins.length>0);
  check('финал Мейджора — каждый состав один раз', new Set(playedF).size===playedF.length, playedF.join(','));
  check('в финале ровно составы с билетом', JSON.stringify(playedF.slice().sort())===JSON.stringify(tick), playedF.slice().sort()+' / '+tick);

  out.notes.nLeaks=leaks.length; out.notes.leaks=leaks.slice(0, 8); out.notes.nDups=dups.length; out.notes.dups=dups.slice(0, 8);
  check('нет игроков клуба в чужих строках поля', !leaks.length, leaks.slice(0, 5).join(' || '));
  check('нет ника дважды в поле', !dups.length, dups.slice(0, 5).join(' || '));
  check('теневая карьера чистая', !MGR.tswap);
  check('без ошибок', !out.errs.length, out.errs.slice(0,3).join(' | '));
}catch(e){ out.fails.push(String(e.stack||e)); }
document.getElementById('__out').textContent='@@B@@'+encodeURIComponent(JSON.stringify(out))+'@@E@@'; }, 500));<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mquals-')), tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + fs.readFileSync(HTML, 'utf8') + BOOT);
const dom = execFileSync(CH, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--virtual-time-budget=3000000', '--dump-dom', 'file:///' + tmp.split(String.fromCharCode(92)).join('/')], { maxBuffer: 1 << 30, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 1700000 });
fs.rmSync(dir, { recursive: true, force: true });
const m = dom.match(/@@B@@([^@<]*)@@E@@/);
if (!m) { console.log('FAIL нет ответа (зависло?)'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.fails.length) { console.log(['FAIL ' + JSON.stringify(out.notes)].concat(out.fails).join(String.fromCharCode(10))); process.exit(1); }
console.log('OK квалификации составов клуба ' + JSON.stringify(out.notes));
