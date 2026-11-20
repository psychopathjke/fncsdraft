/*@@PART js/profile-regen.js@@*/
function ccArcSoloSeats(n, champ){
  const out=[], seen=new Set();
  const champKey=(champ && champ[0]) ? hKey(champ[0]) : null;
  if(champ && champ[0]){ seen.add(champKey); out.push({cards:[champ[0]], reg:champ[0].region||'EU', champ:true}); }
  const total=CC_ARC_LAN_W.reduce((s,w)=>s+w[1], 0);
  CC_ARC_LAN_W.forEach(w=>{
    const want=Math.max(1, Math.round(n*w[1]/total));
    let ro=[]; try{ ro=ccArcRoster(w[0]); }catch(e){ ro=[]; }
    let got=0;
    ro.forEach(p=>{
      if(got>=want || out.length>=n || !p) return;
      const k=hKey(p); if(!k || seen.has(k)) return;
      seen.add(k); out.push({cards:[p], reg:w[0], champ:false}); got++;
    });
  });
  return out.slice(0, n);
}
function ccArcEvent(kind){
  // Кубок наций — сборные по четыре, двенадцать игр; соло — сотня одиночек.
  if(kind==='nations') return {field:CC_NATIONS_FIELD, games:CC_NATIONS.final.games,
                               kill:CC_NATIONS.final.kill, pts:pointsForPlace, cap:0};
  if(kind==='solo')    return {field:CC_SOLOS_STAGES.final.field, games:CC_SOLOS_STAGES.final.games,
                               kill:CC_SOLOS_STAGES.final.kill, pts:pointsForPlace, cap:0};
  if(kind==='rc')     return {field:CC_RC_FINAL.teams, games:CC_RC_FINAL.games,
                              kill:CC_RC_KILL, pts:rcPoints, cap:CC_RELOAD_KILL_CAP};
  if(kind==='summit') return {field:CC_SUMMIT_STAGE.final.field, games:CC_SUMMIT_STAGE.final.games,
                              kill:CC_SUMMIT_STAGE.final.kill, pts:majorPoints, cap:0};
  if(kind==='gc')     return {field:CC_GLOB_FIELD, games:CC_GLOB_GAMES,
                              kill:CC_GLOB_KILL, pts:majorPoints, cap:0};
  return {field:CC_MAJOR_STAGE.final.field, games:CC_MAJOR_STAGE.final.games,
          kill:CC_MAJOR_STAGE.final.kill, pts:majorPoints, cap:0};
}
/* The purse, place by place.

   Every one of these is the table the event itself pays out of, so a row in
   the archive is the cheque that was really written — except that a regional
   Major reads the region of the row rather than the region of the player.
   majorPrize cannot: it answers for the career's own cheque and takes its
   region off the save. Asia's Major pays Asia's table here. */
function ccArcPrize(kind, reg){
  if(kind==='rc') return rcPrize;
  if(kind==='summit'){ const t=(typeof PRIZE_TABLES!=='undefined' && PRIZE_TABLES.SUMMIT)||{};
                       return p=>t[String(p)]||0; }
  if(kind==='gc') return gcPrize;
  const tb=(typeof PRIZE_TABLES!=='undefined' && PRIZE_TABLES) || {};
  const t=tb[reg] || tb.EU || {};
  return p=>t[String(p)]||0;
}
// A count written in duos, read in the squad the season was actually played in.
// ccTeams cannot be used: it answers for the season standing now, and this is
// a season that has already finished. See careerSeasonSize.
function ccArcCount(size, duos){ return size===3 ? Math.round(duos*2/3) : duos; }

/* The room, off the region's own roster.

   The champion is seated first so nobody else can be built out of their cards,
   then the seats go down the ratings: the strongest card left leads, their
   recorded partner sits beside them when the roster holds one and is free, and
   a trio's third seat is chosen for the pair it is joining rather than dealt
   off the front of the queue. Which is careerCupField's own rule — see
   ccPickThird — because a Grand Finals field and a cup field are the same
   question asked twice. */
function ccArcField(reg, size, n, rng, champ, skip, sn){
  const roster=ccArcRoster(reg), src=ccArcPairs(reg, sn!=null ? ccArcCalYear(sn) : null);
  const taken=new Set(), teams=[];
  // The player's own seat, where they were in this one. It is spoken for: the
  // room had a partner of yours in it playing beside somebody else otherwise,
  // three rows under the row the two of you finished on.
  if(skip) skip.forEach(k=>taken.add(k));
  /* Чемпион не садится второй раз, если это и есть команда игрока.

     Его снимок, 26 августа: в таблице «Malibuca & vic0» стоит первой строкой с
     подписью «это ты» и ВТОРОЙ строкой — та же пара ещё раз. Игрок назвался
     ником, который есть в ростере, напарник у него настоящий, и вычисленный
     чемпион сезона сошёлся с его же составом. Список skip держит его ник и его
     напарника — но действовал он только на выдуманные пары, а чемпион садился
     мимо него. Своя строка потом вставляется отдельно, и пара двоилась.

     Теперь чемпион проверяется тем же списком: совпал — место остаётся за
     собственной строкой игрока, она и есть та победа. */
  if(champ && champ.length===size && !(skip && champ.some(c=>skip.has(hKey(c))))){
    champ.forEach(c=>taken.add(hKey(c)));
    teams.push({reg:reg, cards:champ.slice(), champ:true});
  }
  // Записанные пары, сильнейшие первыми — та же очередь, какой садится лобби.
  const free=src.pairs.filter(d=>!d.cards.some(c=>taken.has(hKey(c))));
  const cores=free.slice(0, Math.max(0, n-teams.length));
  /* Третьи — свободные имена сцены, и только когда те кончатся, половинки пар
     за отсечкой. Порядок обратный тому, что в careerCupField, и намеренно:
     свободные — список, один и тот же для региона, а хвост пар зависит от
     размера комнаты и от того, кто в ней уже сидит. Через хвост третий у одной
     и той же пары получался разный в разных таблицах одного сезона (замер: 70%
     совпадений), через свободных — один и тот же. Разбивать пару ради третьего
     всё равно нельзя: в Европе свободных имён 575 на 168 пар. */
  const spare=[];
  if(size>2){
    src.singles.forEach(c=>{ if(!taken.has(hKey(c))) spare.push(c); });
    free.slice(cores.length).forEach(d=>d.cards.forEach(c=>spare.push(c)));
  }
  /* Кого эта карьера уже видела третьим у этой пары — тот и садится, и место
     ему держат ДО того, как комната разберёт свободных. Тот же порядок, что в
     careerCupField, и по той же причине: запомненный третий может стоять в
     паре за отсечкой, и пара, севшая раньше, уводила его молча. Замер до
     резерва: третий у одной пары совпадал в двух таблицах сезона в 70%
     случаев, потому что граница «пара играет / пара разбита» гуляла от
     чемпиона к чемпиону. */
  const memo=(CAREER && CAREER.career && CAREER.career.trios) || null;
  const reserved=new Map();
  if(size>2 && memo){
    cores.forEach(d=>{
      const key=ccArcCoreKey(d.cards), want=memo[key];
      if(!want || d.cards.some(c=>taken.has(hKey(c)))) return;
      const c=spare.find(x=>!taken.has(hKey(x)) && (x._k||hKey(x))===want)
            || roster.find(x=>(x._k||hKey(x))===want && !taken.has(hKey(x)));
      if(!c) return;
      reserved.set(key, c); taken.add(hKey(c));
    });
  }
  /* Пары идут подряд, пока комната не заполнится, а не ровно первые n: пара,
     у которой резерв увёл половинку в третьи, места не занимает, и его берёт
     СЛЕДУЮЩАЯ пара, а не двое случайных из остатка. Отсюда же и устойчивость
     на границе комнаты: чемпион сезона сдвигает очередь на одну строку, и
     раньше на этом месте собиралась выдуманная тройка. */
  free.forEach(d=>{
    if(teams.length>=n) return;
    if(d.cards.some(c=>taken.has(hKey(c)))) return;
    const team=d.cards.slice();
    team.forEach(c=>taken.add(hKey(c)));
    while(team.length<size){
      const key=ccArcCoreKey(team);
      const held=reserved.get(key);
      if(held){ reserved.delete(key); team.push(held); continue; }
      const open=spare.filter(c=>!taken.has(hKey(c)));
      if(!open.length) break;
      const k=ccPickThird(team, open, ccArcCoreRnd(sn, team), reg);
      const pick=spare.splice(spare.indexOf(open[k<0 ? 0 : k]), 1)[0];
      if(!pick) break;
      taken.add(hKey(pick)); team.push(pick);
    }
    if(team.length<size) return;
    teams.push({reg:reg, cards:team, champ:false});
  });
  /* Пары кончились раньше комнаты — дальше идут те, кто остался, по силе.
     Так добирается регион, где записанных пар меньше, чем мест в лобби. */
  let i=0;
  while(teams.length<n){
    const team=[];
    while(team.length<size && i<roster.length){
      const c=roster[i++];
      if(taken.has(hKey(c))) continue;
      taken.add(hKey(c)); team.push(c);
    }
    if(team.length<size) break;
    teams.push({reg:reg, cards:team, champ:false});
  }
  return teams;
}
/* A LAN's room, which is every region's.

   Antwerp and the Summit are not drawn from one roster and cannot be: the
   seats are allocated by region and the allocation is the scene's own weight,
   the same one that decides which region a LAN's winner comes out of. What the
   rounding leaves over is Europe's, which is also true of the real allocation.
   See CC_ARC_LAN_W. */
function ccArcLanField(size, n, rng, champ, champReg, skip, sn){
  const total=CC_ARC_LAN_W.reduce((s,w)=>s+w[1], 0);
  const per={}; let sum=0;
  CC_ARC_LAN_W.forEach(w=>{ per[w[0]]=Math.max(1, Math.round(n*w[1]/total)); sum+=per[w[0]]; });
  per.EU=Math.max(1, per.EU+(n-sum));
  const out=[];
  CC_ARC_LAN_W.forEach(w=>{
    const reg=w[0];
    ccArcField(reg, size, per[reg], rng, reg===champReg ? champ : null, skip, sn).forEach(t=>out.push(t));
  });
  return out.slice(0, n);
}
/* Twelve games of a real lobby, played the way the career plays them.

   The four globals are the same four every career runner sets before a stage
   and puts back after it — CARD_MODE for the power model, squadSize for the
   lobby, the kill cap for the circuit that has one — plus the random source
   itself, which is what makes the same click give the same table. Restored in
   a finally, because a throw inside the engine leaving the page on a seeded
   Math.random would quietly freeze every draw in the app. */
function ccArcPlay(teams, cfg, size, rng){
  const rand=Math.random, mode=CARD_MODE, ss=squadSize, cap=CC_KILL_CAP;
  Math.random=rng; CARD_MODE=true; squadSize=size; CC_KILL_CAP=cfg.cap||0;
  try{ simulateGames(teams, cfg.games, cfg.pts, cfg.kill); }
  finally{ Math.random=rand; CARD_MODE=mode; squadSize=ss; CC_KILL_CAP=cap; }
}
/* Moving a stretch of generated rows clear of one real number.

   The rows are in order already; what they are not is on the right side of the
   line the player's own score draws through the table. The row nearest that
   line is pinned a point clear of it and every row behind it moves by the same
   ratio, so the column keeps its shape — which is the engine's — while being
   anchored to a result, which is the save's. Scaled rather than shifted
   because a shift walks the tail of a fifty-team table past zero. A stretch
   already clear of the line is left exactly as it was played. */
function ccArcFit(rows, pts, dir){
  if(!rows.length) return;
  const near=rows[dir>0 ? rows.length-1 : 0].pts;
  if(!(near>0)) return;
  if(dir>0 ? near>pts : near<pts) return;
  const k=(pts+dir)/near;
  rows.forEach(r=>{ r.pts=Math.max(0, Math.round(r.pts*k)); });
}
/* Built once per row and kept for as long as the page is open — a hub render
   asks for the open table again on every tab, every chip and every day that
   passes, and twelve games of fifty teams is not a thing to do on a redraw.
   The log's own length is in the key: the player's row is read out of it, so a
   result written after the table was built has to rebuild it. */
let CH_ARC_TBL={};
function careerArchiveFinal(sn, key){
  const cr=CAREER.career;
  const ck=sn+'|'+key+'|'+(CAREER.player.nick||'')+'|'+((cr.log||[]).length);
  if(CH_ARC_TBL[ck]) return CH_ARC_TBL[ck];
  const a=careerArchiveSeason(sn), size=a.size, p=String(key).split('|');
  let kind, reg, champ, mine=null, label;
  if(p[0]==='m'){
    const ev=a.regional.find(r=>r.n===+p[1]);
    if(!ev) return null;
    kind='major'; reg=p[2];
    const w=ev.perReg[reg];
    if(!w) return null;
    champ=w.team; label=ev.label+' · '+regionName(reg);
    if(reg===a.home) mine=ev.mine;
  } else {
    const ev=a.global.find(g=>g.slot===p[1]);
    if(!ev) return null;
    kind=ev.slot; reg=ev.win.reg; champ=ev.win.team; mine=ev.mine; label=ev.label;
  }
  let cfg=ccArcEvent(kind);
  /* Финалы прошлых лет — в своём формате, а не в составе сезона: World Cup Solo — сотня
     одиночек, Duos — пятьдесят дуо, FNCS Season X — трио, C2S1 — сквады (CC_MX_SPEC); у
     2021–2023 — лобби и таблица призов своего года (CC_MAJOR_PAY_<год>, по региону строки). */
  const arcY=ccArcCalYear(sn);
  let evSize=size, evPrize=null;
  if(kind==='major'){
    const mn=+p[1], sp=(typeof ccMXSpec==='function') ? ccMXSpec(arcY, mn) : null;
    const tier=tb=>{ const t=tb && (tb[reg] || (reg==='NAW' && tb.NAC) || tb.EU); return t ? (pl=>{ const r=t.find(x=>pl<=x[0]); return r ? r[1] : 0; }) : null; };
    if(sp){
      evSize=sp.size;
      cfg=Object.assign({}, cfg, {field:ccMXLobby(sp.size), games:sp.finalGames||cfg.games});
      evPrize=pl=>ccMXPrize(arcY, mn, pl);
    } else if(arcY>=2021 && arcY<=2023){
      evSize=arcY===2021 ? 3 : 2;
      const tb=({2021:CC_MAJOR_PAY_2021, 2022:CC_MAJOR_PAY_2022, 2023:CC_MAJOR_PAY_2023})[arcY];
      const t=tb && tb[mn];
      cfg=Object.assign({}, cfg, {field:arcY===2021 ? 33 : 50});
      evPrize=tier(t);
    }
  }
  // Настоящий Гранд-финал (см. ccArcRealGf) — доска Epic как есть, без переигровки.
  const realW=kind==='major' && a.regional.find(r=>r.n===+p[1]).perReg[reg].real;
  if(realW){
    const prz=evPrize || ccArcPrize(kind, reg);
    // Ник — как его пишет сцена (тот же, что в строке чемпиона), а не как его набрала доска.
    const rows=realW.rows.map((e,i)=>({p:i+1, name:e.duo.map(h=>ccStageCardFrom({h:h, r:reg}).handle).join(' & '), reg:reg, pts:e.pts||0, wins:e.wins||0,
      elims:Math.round((e.avgElims||0)*(e.matches||0)), prize:prz(i+1)}));
    const ws=realW.rows[0].duo.length;
    const word=ws===1 ? L().lfWordSolo : ws===4 ? L().lfWordSquads : ws===3 ? L().ccWordTrios : L().ccWordDuos;
    const games=Math.max.apply(null, realW.rows.map(e=>e.matches||0)) || cfg.games;
    const out={cap:label, sub:L().arcTable(ccNum(rows.length), word, games), lan:false, rows};
    CH_ARC_TBL[ck]=out;
    return out;
  }
  /* РАЗМЕР СОСТАВА У ЭТИХ ДВУХ — СВОЙ, А НЕ СЕЗОНА.

     Кубок наций играется сборными по четыре, соло — одиночками, и ни то ни
     другое не переводится в дуо/трио года: ccArcCount тут промолчит, иначе
     зал из двадцати пяти стран превратился бы в семнадцать. */
  const seatSize = kind==='nations' ? CC_NATIONS_SQUAD : (kind==='solo' || evSize===1) ? 1 : evSize;
  const n = (kind==='nations' || kind==='solo' || evSize!==size)
    ? Math.max(2, cfg.field)
    : Math.max(2, ccArcCount(size, cfg.field));
  const rng=careerRng(ccHashStr('arcT|'+(CAREER.player.nick||'')+'|'+sn+'|'+key));
  const skip = mine ? new Set([CAREER.player.nick].concat(
      (mine.mates && mine.mates.length) ? mine.mates : (mine.mate?[mine.mate]:[]))
      .filter(Boolean).map(h=>String(h).toLowerCase())) : null;
  /* Зал Кубка наций — книга сборных целиком, и чемпион в ней уже стоит:
     строка назвала страну (см. careerArchiveSeason), таблица сажает её же
     четвёрку. Соло — сотня одиночек по силе. */
  const seats = kind==='nations'
      /* Регион — у самой сборной, а не у чемпиона: он тут один на всю
         таблицу, и датская четвёрка получала флаг Океании. Берётся с её же
         сильнейшей карточки, как берётся и всё остальное в строке. */
      ? ccArcNatRows().map(r=>({cards:r.top,
                                reg:(r.top[0] && r.top[0].region) || reg,
                                champ: !!(champ && champ[0] && r.top[0] && hKey(r.top[0])===hKey(champ[0]))}))
    : (kind==='solo' || evSize===1) ? ccArcSoloSeats(n, champ && champ.slice(0,1))
    : kind==='major' ? ccArcField(reg, evSize, n, rng, champ && champ.slice(0, evSize), skip, sn)
                     : ccArcLanField(size, n, rng, champ, reg, skip, sn);
  if(seats.length<2) return null;
  const bare=s=>String(s==null?'':s).replace(/<[^>]*>/g, '').trim();
  const teams=seats.map(s=>{
    const t=careerTeam(s.cards);
    t.name=teamLabel(s.cards); t._reg=s.reg; t._champ=!!s.champ;
    return t;
  });
  ccArcPlay(teams, cfg, seatSize, rng);
  const ranked=teams.slice().sort((x,y)=>
    y.stagePts-x.stagePts || (y.wins||0)-(x.wins||0) || y.stageElims-x.stageElims);
  // The champion of the season and the winner of the twelve games trade rows.
  const ci=ranked.findIndex(t=>t._champ);
  if(ci>0){
    const A=ranked[0], B=ranked[ci];
    ['name','_reg','_champ'].forEach(k=>{ const v=A[k]; A[k]=B[k]; B[k]=v; });
  }
  const prize=evPrize || ccArcPrize(kind, reg);
  const rows=ranked.map((t,i)=>({p:i+1, name:bare(t.name), reg:t._reg,
    pts:t.stagePts||0, wins:t.wins||0, elims:t.stageElims||0}));
  /* And the row that really happened goes in at the place it really finished.

     Which is the one row in this table that is not a reconstruction, so the
     reconstruction is fitted to it rather than the other way round. Without
     that, a career that finished fourth on 377 read as fourth above two teams
     on 432 and 402 — and a standings table that does not descend is one nobody
     believes the rest of. */
  /* Верхушка таблицы — записанная, а не переигранная.

     Его снимки, 26 августа: пост в ленте про финал Мейджора 1 называет топ-5 с
     очками 667 / 566 / 539 / 531 / 517, а таблица того же турнира в Истории
     открывалась на 529 / 524 / 478 / 476 / 472 и с другими командами на местах
     со второго по пятое. Разошлись они потому, что здесь турнир ИГРАЛСЯ заново
     своим броском: от настоящего вечера в сейве лежала одна строка — своя.

     Теперь вечер оставляет пять верхних строк (ccStageTop, пишется рядом с
     результатом), и они садятся как есть — с именами, очками, победами и
     элимами того вечера. Всё, что ниже, остаётся реконструкцией и прижимается
     под пятую строку, чтобы таблица читалась сверху вниз.

     Сейв без записи — старая карьера — рисуется как прежде. */
  const top=(mine && Array.isArray(mine.top) && mine.top.length)
    ? mine.top : ccArcTopFromNews(mine, rows);
  if(top){
    const key=s=>String(s==null?'':s).toLowerCase().replace(/\s+/g,'');
    const seen=new Set(top.map(r=>key(r.n)));
    const rest=rows.filter(r=>!seen.has(key(r.name)));
    const head=top.map(r=>({p:0, name:String(r.n||''), reg:r.r||a.home,
                            pts:r.p||0, wins:r.w||0, elims:r.e||0,
                            you:r.you?true:undefined}));
    ccArcFit(rest, head[head.length-1].pts, -1);
    rows.length=0;
    rows.push.apply(rows, head.concat(rest));
    if(rows.length>n) rows.length=n;
  }
  // Своя строка вставляется отдельно только если её нет среди записанных.
  if(mine && mine.place>0 && !(top && top.some(r=>r.you))){
    const at=Math.min(Math.max(1, mine.place), rows.length+1)-1;
    ccArcFit(rows.slice(0, at), mine.pts||0, 1);
    ccArcFit(rows.slice(at), mine.pts||0, -1);
    rows.splice(at, 0, {p:0, name:[CAREER.player.nick].concat(
        (mine.mates && mine.mates.length) ? mine.mates : (mine.mate?[mine.mate]:[])).join(' & '),
      reg:a.home, pts:mine.pts||0, wins:mine.wins||0, elims:mine.elims||0, you:true});
    if(rows.length>n) rows.length=n;
  }
  rows.forEach((r,i)=>{ r.p=i+1; r.prize=prize(i+1); });
  const ws=kind==='major' ? evSize : size;
  const word=ws===1 ? L().lfWordSolo : ws===4 ? L().lfWordSquads : ws===3 ? L().ccWordTrios : L().ccWordDuos;
  const out={cap:label, sub:L().arcTable(ccNum(rows.length), word, cfg.games),
             lan:kind!=='major', rows};
  CH_ARC_TBL[ck]=out;
  return out;
}
// Which row is open, if any. One at a time: two fifty-line tables inside one
// tile is a screen nobody can find their way back up.
let CH_ARC_OPEN=null;
function careerArcOpen(key){
  CH_ARC_OPEN = CH_ARC_OPEN===key ? null : key;
  // Архив живёт во вкладке Истории, а не Профиля: перерисовка возвращает
  // туда же, откуда нажали, иначе клик по сезону уносил на другую вкладку.
  careerRenderHub('hist');
}
function careerArcTableHTML(sn, key){
  const t=careerArchiveFinal(sn, key);
  if(!t) return `<div class="arc-wrap"><div class="arc-cap">${L().arcNoTable}</div></div>`;
  // A LAN carries where each team came from, and it carries it under the name
  // rather than in a column of its own: six columns and a region is wider than
  // a phone, and the first thing to fall off the right of it is the prize.
  const head=`<th class="arc-h">#</th><th>${L().teamHeader}</th>`+
    `<th class="ev-num">${L().ptsHeader}</th><th class="ev-num">${L().winsWord}</th>`+
    `<th class="ev-num">${L().killsHeader}</th>`;
  const body=t.rows.map(r=>`<tr class="${r.you?'arc-me':''}">
      <td><span class="ev-place${r.p<=3?' top':(r.you?' cut':'')}">${r.p}</span></td>
      <td class="arc-n">${esc(r.name)}${r.prize?`<span class="st-prize">${ccMoney(r.prize)}</span>`:''}${r.you?` <i>${L().arcYou}</i>`:''}${
        t.lan?`<small>${esc(regionName(r.reg))}</small>`:''}</td>
      <td class="ev-num arc-pts">${ccNum(r.pts)}</td>
      <td class="ev-num">${r.wins||'-'}</td>
      <td class="ev-num">${ccNum(r.elims)}</td>
    </tr>`).join('');
  return `<div class="arc-wrap">
    <div class="arc-cap">${esc(t.cap)}<span>${esc(t.sub)}</span></div>
    <div class="arc-scroll"><table class="arc-t">
      <thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>
  </div>`;
}
// A line of the tile, and the table it opens.
/* Обложка турнира к строке архива — правка: «мб понятные
   турниры сделай с логотипами, чтоб люди понимали, что можно кликать там на
   глобал, мейджор и т. д.». Строка и раньше открывалась по клику, но выглядела
   как строка таблицы, а подсказка про это стояла одна на весь блок. Картинка
   отвечает на оба вопроса разом: и что это за турнир, и что на него смотрят,
   а не читают. Ключ строки уже несёт слот ('g|gc', 'm|1|EU'), другого источника
   не нужно. */
/* Обложка строки — турнира СВОЕГО года: у 2019–2024 постер сезона FNCS (ccFncsPoster), у 2025 —
   постеры Мейджоров, у Глобалов — свой город года; где своего нет — ключевой арт года. */
function ccArcArt(key, sn){
  const k=String(key||'');
  const y=sn!=null && typeof ccArcCalYear==='function' ? ccArcCalYear(sn) : ccCalYear();
  if(y<2026){
    const m=/^m\|(\d)/.exec(k);
    if(m){ const id='Major'+m[1]+'_'+y; return ccFncsPoster(id) || CAREER_EV_ART_ID[id+'_Final'] || (y<=2024 ? 'art/fncs-'+y+'.jpg' : CAREER_EV_ART.cup); }
    if(k.indexOf('g|gc')===0) return y===2022 ? ccFncsPoster('Invitational2022') : (CAREER_EV_ART_ID['GlobalChampionship'+y] || CAREER_EV_ART.gc);
    if(k.indexOf('g|nations')===0) return CAREER_EV_ART_ID.nations || CAREER_EV_ART.gc;
  }
  if(k.indexOf('g|summit')===0) return 'art/fncs-2026-major1.jpg';
  if(k.indexOf('g|rc')===0)     return CAREER_EV_ART.reload;
  if(k.indexOf('g|gc')===0)     return CAREER_EV_ART.gc;
  // Кубок наций — ЛАН, обложка та же, что у Глобалов; у соло своя.
  if(k.indexOf('g|nations')===0) return CAREER_EV_ART.gc;
  if(k.indexOf('g|solo')===0)    return CAREER_EV_ART.solo;
  if(k.indexOf('m|1')===0)      return 'art/fncs-2026-major1.jpg';
  if(k.charAt(0)==='m')         return CAREER_EV_ART.cup;
  return '';
}
function ccArcRow(sn, key, label, valueHTML, you){
  const open=CH_ARC_OPEN===key;
  const art=ccArcArt(key, sn);
  return `<div class="ch-row arc-row${open?' arc-on':''}" onclick="careerArcOpen(\'${key}\')">
      <em>${art?`<img class="arc-logo" src="${art}" alt="" loading="lazy" onerror="this.remove()">`:''}${esc(label)}</em>
      <b class="${you?'ch-goal-met':''}">${valueHTML}<i class="arc-caret">${open?'▾':'▸'}</i></b>
    </div>`+(open ? careerArcTableHTML(sn, key) : '');
}
let CH_ARC_S=null, CH_ARC_R=null;
function careerArcPick(sn){ CH_ARC_S=sn; CH_ARC_OPEN=null; careerRenderHub('hist'); }
function careerArcReg(r){ CH_ARC_R=r; CH_ARC_OPEN=null; careerRenderHub('hist'); }
/* Разыгран ли финал этого слота к сегодняшнему дню сезона. По id в календаре,
   а не по дате из головы: у каждого слота день свой, и после сыгранного вечера
   часы уже стоят за ним. Слот, которого в календаре нет (третий Мейджор
   трио-архива), не разыгран, пока сезон не кончится. */
function ccArcDoneBy(id){
  let day=null;
  // Финал Мейджора в календарях 2025/2024 зовётся Major<n>_2025_Final / Major<n>_2024_Final.
  /* Тестер, 22 сентября: «в истории не то» — в карьере 2024-го КАЖДАЯ строка
     Сезонов стояла «ещё впереди», даже отыгранная. Регулярка ловила букву «d»
     вместо цифры, alt всегда был null, и id календаря 2024/2025
     (Major1_2024_Final) не искался вовсе — а под именем 2026-го
     (Major1_Final) в этих годах нет ни одного дня. */
  const alt=/^Major(\d)_Final$/.exec(String(id||''));
  const ids=alt ? [id].concat([2025,2024,2023,2022,2021,2020,2019].map(y=>'Major'+alt[1]+'_'+y+'_Final')) : [id];
  if(id==='GlobalChampionship') ids.push('GlobalChampionship2025', 'GlobalChampionship2024', 'GlobalChampionship2023', 'Invitational2022');
  careerYearDays().forEach((list, iso)=>{
    if(list.some(e=>ids.indexOf(e.id)>=0) && (!day || iso>day)) day=iso;
  });
  return !!day && careerToday()>day;
}
// Неразыгранный слот — та же строка с той же обложкой, только без победителя:
// турнир этого сезона существует и до него ещё дойдут, а строка без картинки
// рядом со строками с картинками читалась бы как другая порода.
function ccArcSoonRow(label, key, sn){
  const art=ccArcArt(key, sn!=null ? sn : CH_ARC_S);
  return `<div class="ch-row arc-row"><em>${
      art?`<img class="arc-logo" src="${art}" alt="" loading="lazy" onerror="this.remove()">`:''
    }${esc(label)}</em>
    <b style="color:var(--ink-dimmer);">${L().arcSoon}</b></div>`;
}
// Формат сезона: у 2019–2023 — как шёл год (дуо → трио → сквады), у остальных — состав сезона.
function ccArcFormat(sn, size){
  const y=ccArcCalYear(sn), t=y<=2023 && L()['ccYear'+y];
  return t ? t.charAt(0).toUpperCase()+t.slice(1) : ccSeasonWord(size);
}
// Подпись сезона по размеру состава: соло, дуо, трио, сквад.
function ccSeasonWord(n){ const T=L(); return n===1 ? (T.ccSeasonSolo||T.ccSeasonDuos) : n===3 ? T.ccSeasonTrios : n===4 ? (T.ccSeasonSquads||T.ccSeasonDuos) : T.ccSeasonDuos; }
function careerArchiveHTML(){
  const cr=CAREER.career;
  const doneSeasons=[];
  for(let n=1;n<=cr.season;n++) if(n<cr.season || cr.seasonOver) doneSeasons.push(n);
  /* И идущий сезон тоже — игрок, 22 августа: «чтобы можно было в середине
     сезона смотреть, кто выиграл квалы евс и фнкс, не только после завершения
     сезона». Мир сезона посеян от его номера, так что чемпион, показанный в
     июле, в декабре останется тем же; несыгранные слоты стоят «ещё впереди». */
  const live=!cr.seasonOver;
  if(live) doneSeasons.push(cr.season);
  if(!doneSeasons.length)
    return `<div class="ch-tile"><h4>${L().arcTitle}</h4>
      <div class="ch-empty">${L().arcNone}</div></div>`;
  const sn=doneSeasons.indexOf(CH_ARC_S)>=0 ? CH_ARC_S : doneSeasons[doneSeasons.length-1];
  const partial=live && sn===cr.season;
  const reg=CH_ARC_R || ccCareerRegion();
  const a=careerArchiveSeason(sn);
  const chipsS=doneSeasons.map(n=>`<button class="cc-back${n===sn?' cc-on':''}"
    onclick="careerArcPick(${n})">${esc(L().ccMoneySeason(n))}</button>`).join('');
  const chipsR=REGIONS.map(r=>`<button class="cc-back${r.code===reg?' cc-on':''}"
    onclick="careerArcReg(\'${r.code}\')">${esc(regionName(r.code))}</button>`).join('');
  const rowsR=a.regional.map(ev=>{const w=ev.perReg[reg];
    if(partial && !ccArcDoneBy('Major'+ev.n+'_Final')) return ccArcSoonRow(ev.label, 'm|'+ev.n+'|'+reg, sn);
    return ccArcRow(sn, 'm|'+ev.n+'|'+reg, ev.label,
      esc(w.name)+(w.you?' · '+L().arcYou:''), w.you);}).join('');
  const CC_ARC_GID={summit:'Summit_Final', rc:'ReloadChampionshipParis', gc:'GlobalChampionship',
                    nations:'NationsFinal', solo:'SoloSeries_Final'};
  const rowsG=a.global.map(ev=>{
    if(partial && !ccArcDoneBy(CC_ARC_GID[ev.slot]||'')) return ccArcSoonRow(ev.label, 'g|'+ev.slot, sn);
    return ccArcRow(sn, 'g|'+ev.slot, ev.label,
      esc(ev.win.name)+' · '+esc(regionName(ev.win.reg))+(ev.win.you?' · '+L().arcYou:''),
      ev.win.you);}).join('');
  return `<div class="ch-tile"><h4>${L().arcTitle}</h4>
    <div class="ch-hint">${L().arcHint}. ${L().arcTapHint}</div>
    ${partial ? `<div class="ch-hint">${L().arcLive}</div>` : ''}
    <div class="cc-chips cc-chips-seasons">${chipsS}</div>
    <!-- The label is what the row is, not what the hub tab is called: chSquad is
         the word "Duo" on the tab strip, and a trios season read "Duo · a trios
         season". His report, 20 August. -->
    <div class="ch-row"><em>${L().ccSeasonFormat}</em><b>${ccArcFormat(sn, a.size)}</b></div>
    ${(cr.log||[]).some(e=>e.season===sn) ? `<div class="cc-chips"><button class="cc-back" onclick="ccGalaShare(${sn})">${esc(L().ccShareSeason||'Share season')}</button></div>` : ''}
    ${rowsG}
    <div class="cc-chips cc-chips-reg">${chipsR}</div>
    ${rowsR}
  </div>`;
}
/* Колонка «Событие» звала каждую строку кубком дивизиона, чем бы вечер ни был —
   Скриншот: финал релоада читался как «Кубок Див 1». Имя не
   хранится в строке — его знает календарь, и он же держит его на языке экрана,
   поэтому строка спрашивает свой день у календаря. День вне календаря (сейв
   другого года) получает хотя бы слово за тип турнира. */
/* Обложка события в строке профиля — как у Fortnite Tracker в списке турниров игрока (его
   просьба 29.09: «добавь картинки к эвентам, как на фортнайттрекере»). Та же картинка, что
   в календаре и на карточке дня: событие этого дня того же вида → ccEventArt. */
function ccLogArt(e){
  if(!e) return '';
  const ID={rc:'ReloadChampionshipParis', gclc:'GlobalChampionshipLastChance'};
  const kind=e.kind||'cup';
  let ev=null;
  try{ ev=(careerYearDays().get(e.day)||[]).find(x=>ID[kind] ? x.id===ID[kind] : x.kind===(kind==='scq' ? 'summit' : kind)); }catch(x){}
  return (ev && ccEventArt(ev)) || CAREER_EV_ART[kind] || CAREER_EV_ART.cup || '';
}
function ccLogArtHTML(e){
  const a=ccLogArt(e);
  return a ? '<img class="ev-thumb" src="'+esc(a)+'" alt="" loading="lazy" onerror="this.style.visibility=\'hidden\'">'
           : '<span class="ev-thumb"></span>';
}
function ccLogName(e, noLabel){
  if(e.kind && e.kind!=='cup'){
    // Париж и Last Chance делят на календаре один kind 'gc' — различает id.
    const ID={rc:'ReloadChampionshipParis', gclc:'GlobalChampionshipLastChance'};
    const onDay=(careerYearDays().get(e.day)||[])
      .find(x=>ID[e.kind] ? x.id===ID[e.kind] : x.kind===(e.kind==='scq' ? 'summit' : e.kind));
    if(onDay && onDay.label && !noLabel) return esc(onDay.label);
    const W={final:L().calWeeklyFinal, eval:L().calPerfEval, victory:ccWkVictoryWord(),
             major:ccWkMajorWord(), gclc:L().chWkGC, globals:L().chWkGC,
             reload:L().chWkReload, summit:L().brk_lan, rc:L().brk_rc,
             solo:'Solo Series'};
    if(W[e.kind]) return W[e.kind];
  }
  return L().chCupWeek(e.div);
}
/* Две разные вкладки, а не одна длинная.

   Правка шла в два приёма: сначала «вот эту таблицу нужно как
   отдельный столбик в лобби, после центра profile мб» — это лист результатов,
   — а следом «вот это добавь в историю» со скрином сезонов и ленты карьеры.
   То есть Профиль отвечает на «какой я игрок», История — на «что было»: кто
   что выиграл по сезонам и чем кончился каждый вечер. Раньше обе половины
   стояли одной простынёй под одной вкладкой, и вторая начиналась там, где у
   первой кончались строки. */
function careerHistoryHTML(){
  return careerArchiveHTML()+careerTimelineHTML()+ccRetiredHTML();
}
/* ЗАВЕРШИЛИ КАРЬЕРУ (его «да» 20.10 на предложение после «а куда игрок, которого он регенет»): заметные ушедшие со сцены
   (рейтинг 75+, ccRegenYear пишет в cr.regen.past) — год, возраст, рейтинг, регион и реген, что пришёл на смену. */
const CC_REGEN_PAST_MIN=75, CC_REGEN_PAST_MAX=400;
function ccRetiredOf(handle){
  const R=CAREER && CAREER.career && CAREER.career.regen; if(!R || !R.past) return null;
  return R.past.find(p=>hKey(p.h)===hKey(handle)) || null;
}
function ccRetiredHTML(){
  const T=L(), R=CAREER && CAREER.career && CAREER.career.regen;
  const list=((R && R.past)||[]).slice().sort((a,b)=>b.y-a.y || b.ovr-a.ovr);
  if(!list.length) return '';
  const yr=y=>2026+y;
  const rows=list.slice(0, 120).map(p=>'<tr><td>'+(p.nat ? flagImg(p.nat, 12)+' ' : '')+'<a href="#" onclick="ccPeekByHandle(\''+esc(String(p.h)).replace(/'/g, '')+'\');return false;">'+esc(p.h)+'</a></td>'+
    '<td class="ev-num">'+yr(p.y)+'</td><td class="ev-num">'+(p.age!=null ? p.age : '–')+'</td><td class="ev-num">'+p.ovr+'</td><td>'+esc(p.reg||'')+'</td>'+
    '<td>'+(p.by ? '<a href="#" onclick="ccPeekByHandle(\''+esc(String(p.by)).replace(/'/g, '')+'\');return false;">'+esc(p.by)+'</a>' : '–')+'</td></tr>').join('');
  return '<div class="ch-tile cc-retired"><h4>'+esc(T.ccRetiredTitle||'Retired')+'</h4><div class="ch-hint">'+esc(T.ccRetiredHint||'')+'</div>'+
    '<div class="cc-retired-wrap"><table class="cc-retired-t"><tr><th>'+esc(T.ccRetiredWho||'Player')+'</th><th>'+esc(T.ccRetiredYear||'Year')+'</th><th>'+esc(T.ccRetiredAge||'Age')+'</th>'+
    '<th>OVR</th><th>'+esc(T.ccRetiredReg||'Region')+'</th><th>'+esc(T.ccRetiredBy||'Regen')+'</th></tr>'+rows+'</table></div></div>';
}
function careerProfileHTML(){
  const log=(CAREER.career.log||[]).slice().reverse();
  /* Сортировка по призам — его пункт 19 со страницы «ы», 22 августа. Клик по
     шапке «Приз» строит журнал от больших чеков к пустым; клик по «Событию»
     или повторный по «Призу» возвращает хронологию. */
  if(CH_LOG_SORT==='prize') log.sort((a,b)=>(b.prize||0)-(a.prize||0));
  const pl=CAREER.player;
  if(!log.length) return `<div class="ch-grid" style="grid-template-columns:1fr;">`+
    `<div class="ch-tile"><h4>${L().chLogTitle}</h4><div class="ch-empty">${L().chLogEmpty}</div></div></div>`;

  const sum=(k)=>log.reduce((s,e)=>s+(e[k]||0),0);
  const games=sum('games'), wins=sum('wins'), elims=sum('elims');
  const withAvg=log.filter(e=>e.avg!=null);
  const avg=withAvg.length ? (withAvg.reduce((s,e)=>s+e.avg,0)/withAvg.length).toFixed(1) : '-';
  const promos=log.filter(e=>e.passed).length;

  const pr=ccPrTable(CAREER.career.log||[]);
  const rows=log.map(e=>{
    const podium=e.place<=3, cut=e.passed;
    const rating=pr.by.get(e);
    return `<tr>
      <td class="ev-name"><div class="ev-name-in">${ccLogArtHTML(e)}<div><b>${ccLogName(e)}</b>
        <small>${ccStamp(e)}</small></div></div></td>
      <td class="ev-num"><span class="ev-place${podium?' top':(cut?' cut':'')}">#${e.place}</span>
        <small>/${e.of}</small></td>
      <td class="ev-num ev-pts">${e.pts}</td>
      <td class="ev-num ev-rate${e.rating>=8?' hi':e.rating!=null&&e.rating<5?' lo':''}">${e.rating!=null ? e.rating.toFixed(1)+(e.mvpYou?' ★':'') : '-'}</td>
      <td class="ev-num ev-pr${pr.counted.has(e)?' in':''}"
          title="${esc(pr.counted.has(e)?L().evPrIn:L().evPrOut)} · ×${ccPrMult(e)}">${
        rating!=null ? ccNum(rating) : '-'}</td>
      <td class="ev-num ev-cash">${e.prize ? ccMoney(e.prize) : '-'}</td>
      <td class="ev-mate">${e.mate?esc(e.mate):'-'}</td>
      <td class="ev-num">${e.games!=null?e.games:'-'}</td>
      <td class="ev-num">${e.wins!=null?e.wins:'-'}</td>
      <td class="ev-num">${e.elims!=null?e.elims:'-'}</td>
      <td class="ev-num">${e.avg!=null?e.avg:'-'}</td>
      <td class="ev-num ev-ovr">${e.ovr}</td>
    </tr>`;
  }).join('');

  // Сезоны и лента переехали в свою вкладку — см. careerHistoryHTML выше.
  return `<div class="ev-wrap">
    <div class="ev-head">
      <div class="ev-hero">
        <em>${L().ccRoOvr}</em>
        <b>${ccMyShownOvr()}</b>
        ${careerRatingCurve(log)}
      </div>
      <div class="ev-totals">
        <div><em>${L().evPr}</em><b class="ev-pr-total">${ccNum(pr.pr)}</b></div>
        ${(ccMobileOwn() || (CAREER.career.mobN||0)>0) ? `<div><em>${L().ccMobRating} · ${L().ccMobShort}</em><b>${Math.round(ccMobileOvr()*10)/10}</b></div>` : ''}
        <div><em>${L().evEvents}</em><b>${log.length}</b></div>
        <div><em>${L().evPromos}</em><b>${promos}</b></div>
        <div><em>${L().matchesWord}</em><b>${games}</b></div>
        <div><em>${L().winsWord}</em><b>${wins}</b></div>
        <div><em>${L().killsHeader}</em><b>${elims}</b></div>
        <div><em>${L().evAvg}</em><b>${avg}</b></div>
        <div><em>${L().chEarnings}</em><b>${ccMoney(CAREER.career.earnings||0)}</b></div>
        ${ccRateTotalsHTML(log)}
      </div>
    </div>
    ${ccAwardsShelfHTML()}
    <div class="ev-tablewrap">
      <table class="ev-table">
        <thead><tr>
          <th style="cursor:pointer;" onclick="careerLogSort(null)">${L().evEvent}${CH_LOG_SORT?'':' ▾'}</th><th class="ev-num">${L().rankHeader}</th>
          <th class="ev-num">${L().ptsHeader}</th><th class="ev-num">${L().lfRateShort}</th><th class="ev-num">${L().evPr}</th>
          <th class="ev-num" style="cursor:pointer;" onclick="careerLogSort(\'prize\')">${L().prizeHeader}${CH_LOG_SORT==='prize'?' ▾':''}</th>
          <th>${L().ccResPartner}</th><th class="ev-num">${L().matchesWord}</th>
          <th class="ev-num">${L().winsWord}</th><th class="ev-num">${L().killsHeader}</th>
          <th class="ev-num">${L().evAvg}</th><th class="ev-num">${L().ccRoOvr}</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>`;
}

/* Оценки вечеров в итогах профиля: средняя, число MVP и последние двенадцать столбиками
   (зелёный — 8+, красный — ниже 5). Журнал — от новых к старым, график — слева направо. */
function ccRateTotalsHTML(log){
  const r=log.filter(e=>e.rating!=null);
  if(!r.length) return '';
  const avg=r.reduce((a,e)=>a+e.rating,0)/r.length, mvp=r.filter(e=>e.mvpYou).length;
  const last=r.slice(0,12).reverse();
  const bars=last.map(e=>'<i class="ev-rbar'+(e.rating>=8?' hi':e.rating<5?' lo':'')+'" style="height:'+Math.max(8, Math.round(e.rating*10))+'%" title="'+e.rating.toFixed(1)+'"></i>').join('');
  return '<div><em>'+L().lfAvgRateAll+'</em><b>'+avg.toFixed(1)+'</b></div>'+
         '<div><em>'+L().lfMvpAll+'</em><b>'+mvp+'</b></div>'+
         '<div class="ev-rspark"><em>'+L().lfLastNights+'</em><span>'+bars+'</span></div>';
}
/* Полка наград: игрок месяца, игрок года и номинации сезона, которые взял сам игрок
   (careerAwards().won с you) — с месяцами и сезонами, а не одним числом. */
/* ГДЕ Я САЖУСЬ: каждая твоя игра в карьере пишет точку высадки (остров + координаты) и
   место. Карта острова, где высадок больше всего: кружок на точке, размер — сколько раз,
   цвет — среднее место (зелёный — выше середины). Пишется из accumulateMatchStats. */
function ccDropRec(t, place, total){
  if(!t || !t.isYou || !CC_DROP_STAGE || !t.landingZone || !CAREER || !CAREER.career) return;
  const lf=ccLife(), z=t.landingZone, set=ACTIVE_LANDING_SET;
  const d=lf.drops||(lf.drops={}), k=set+'|'+z.x+','+z.y;
  const r=d[k]||(d[k]={n:0, pct:0, w:0});
  r.n++; r.pct+=total>1 ? 1-(place-1)/(total-1) : 1; if(place===1) r.w++;
}
/* ПРОФИЛЬ (30.10, его «карьера/компетитив/профиль, в профиле подробная статистика карьер, драфт дейли, ачивки»).
   Третья вкладка шапки. Всё с этого устройства, без входа: слоты карьер (LS_SLOT 1..CC_SLOTS), драфт дня (fd_daily,
   последние 30 дней), забеги драфта (fncsdraft_history, до 100), достижения (fncsdraft_achievements). */
const CC_ME_TX={
  ru:{nav:'Аккаунт', title:'Аккаунт', device:'Всё с этого устройства', careers:'Карьеры', none:'Пока пусто',
      season:'Сезон', div:'Дивизион', earn:'Призовые', ev:'Турниров', wins:'Побед', firsts:'Первых мест', vr:'Королевских побед', top10:'Топ-10', titles:'Титулы FNCS', potm:'Игрок месяца',
      best:'Лучший результат', daily:'Драфт дня', played:'Сыграно', bestPlace:'Лучшее место', avgPlace:'Среднее место', bestScore:'Лучшие очки',
      streak:'Дней подряд', last:'Последние', draft:'Драфт', runs:'Забегов', bestGrade:'Лучшая оценка', majors:'Чемпион ALL FNCS',
      ach:'Достижения', mgr:'Менеджер', clubs:'Клубов', creator:'Креатор', open:'Открыть'},
  en:{nav:'Account', title:'Account', device:'Everything from this device', careers:'Careers', none:'Nothing yet',
      season:'Season', div:'Division', earn:'Earnings', ev:'Events', wins:'Wins', firsts:'First places', vr:'Victory Royales', top10:'Top 10', titles:'FNCS titles', potm:'Player of the month',
      best:'Best result', daily:'Daily draft', played:'Played', bestPlace:'Best place', avgPlace:'Average place', bestScore:'Best score',
      streak:'Day streak', last:'Recent', draft:'Draft', runs:'Runs', bestGrade:'Best grade', majors:'ALL FNCS champion',
      ach:'Achievements', mgr:'Manager', clubs:'Clubs', creator:'Creator', open:'Open'}
};
function ccMeT(){ return CC_ME_TX[(typeof LANG!=='undefined' && LANG)] || CC_ME_TX.en; }
Object.assign(CC_ME_TX.ru, {edit:'Изменить', save:'Сохранить', cancel:'Отмена', nickPh:'Никнейм', upload:'Загрузить фото', skinPh:'Найти скин Fortnite',
  cloudOn:'Сохраняется в облако', cloudOff:'Включи облако на экране карьеры, чтобы профиль был на всех устройствах', achCareer:'Достижения карьеры', achDaily:'Достижения драфта дня', more:'ещё',
  achDraft:'Достижения драфта', achMgr:'Достижения менеджера', achCareerS:'Ачивки карьеры', achDraftS:'Ачивки драфта', achMgrS:'Ачивки менеджера'});
Object.assign(CC_ME_TX.en, {edit:'Edit', save:'Save', cancel:'Cancel', nickPh:'Nickname', upload:'Upload photo', skinPh:'Find a Fortnite skin',
  cloudOn:'Saved to the cloud', cloudOff:'Turn on the cloud on the career screen to have your profile on every device', achCareer:'Career achievements', achDaily:'Daily draft achievements', more:'more',
  achDraft:'Draft achievements', achMgr:'Manager achievements', achCareerS:'Career', achDraftS:'Draft', achMgrS:'Manager'});
/* Свой профиль (30.10, его «пусть никнейм можно будет выбрать и аватарку и сохранить это все в облако»): ключ
   fncsdraft_profile {nick, ava:{t:'skin', id} | {t:'img', d:dataURL 128px}} — в облаке рядом с карьерами (CC_CLOUD_KEY). */
const CC_ME_LS='fncsdraft_profile';
function ccMeProf(){ try{ return JSON.parse(localStorage.getItem(CC_ME_LS)||'{}')||{}; }catch(e){ return {}; } }
function ccMeProfSave(o){ try{ localStorage.setItem(CC_ME_LS, JSON.stringify(Object.assign(o, {at:Date.now()}))); }catch(e){} try{ ccCloudSoon(); }catch(e){} }
function ccMeAvaURL(p){ const a=p && p.ava; if(!a) return null; return a.t==='img' ? a.d : a.t==='skin' ? ccFnImg(a.id) : null; }
let CC_ME_EDIT=null;   // {nick, ava, q} — открытый редактор
function ccMeEditOpen(){ const p=ccMeProf(); CC_ME_EDIT={nick:p.nick||'', ava:p.ava||null, q:'', banner:p.banner||'lobby', frame:p.frame||'yellow', show:(p.show||[]).slice()}; ccMeRedraw(); }
function ccMeEditClose(){ CC_ME_EDIT=null; ccMeRedraw(); }
function ccMeEditSave(){
  if(!CC_ME_EDIT) return;
  const nick=String(CC_ME_EDIT.nick||'').replace(/[<>]/g, '').trim().slice(0, 24);
  const p=ccMeProf();   // бинды и прочее, что редактор не трогает, остаются
  ccMeProfSave(Object.assign(p, {nick, ava:CC_ME_EDIT.ava, banner:CC_ME_EDIT.banner, frame:CC_ME_EDIT.frame, show:(CC_ME_EDIT.show||[]).slice(0, 3)}));
  CC_ME_EDIT=null; ccMeRedraw();
}
function ccMeRedraw(){ const b=document.getElementById('meBody'); if(!b) return; ccMeCloudHome(); b.innerHTML=ccMeHTML(); ccMeCloudMount(); }
function ccMePhoto(inp){
  const f=inp && inp.files && inp.files[0]; if(!f || !CC_ME_EDIT) return;
  const im=new Image(), url=URL.createObjectURL(f);
  im.onload=()=>{ const c=document.createElement('canvas'); c.width=c.height=128; const g=c.getContext('2d');
    const s=Math.min(im.width, im.height); g.drawImage(im, (im.width-s)/2, (im.height-s)/2, s, s, 0, 0, 128, 128);
    let d=''; try{ d=c.toDataURL('image/webp', .85); }catch(e){}
    if(!/^data:image\/webp/.test(d)) d=c.toDataURL('image/jpeg', .85);   // Safari старых версий не пишет webp
    URL.revokeObjectURL(url); CC_ME_EDIT.ava={t:'img', d}; ccMeRedraw(); };
  im.src=url;
}
function ccMeSkinFind(q){
  if(!CC_ME_EDIT) return; CC_ME_EDIT.q=q;
  const draw=()=>{ const el=document.getElementById('meSkins'); if(el) el.innerHTML=ccMeSkinsHTML(); };
  if(typeof CC_FN_SHOP==='undefined') ccFnShopLoad(draw); else draw();
}
function ccMeSkinsHTML(){
  if(!CC_ME_EDIT || typeof CC_FN_SHOP==='undefined') return '';
  const q=String(CC_ME_EDIT.q||'').trim().toLowerCase(); if(q.length<2) return '';
  return CC_FN_SHOP.items.filter(i=>i[2]==='o' && String(i[1]).toLowerCase().indexOf(q)>=0).slice(0, 30).map(i=>
    '<button type="button" class="me-skin" title="'+esc(i[1])+'" onclick="CC_ME_EDIT.ava={t:\'skin\',id:\''+esc(i[0])+'\'};ccMeRedraw()"><img src="'+esc(ccFnImg(i[0], true))+'" alt="" loading="lazy" onerror="this.remove()"><small>'+esc(i[1])+'</small></button>').join('');
}
/* ДОСТИЖЕНИЯ ПРОФИЛЯ (30.10, «новые ачивки для карьеры и для драфта, которые сейчас подходят для сайта»). Считаются
   из того, что уже лежит на устройстве (все слоты карьер, fd_daily), — ничего не хранят и открываются задним числом. */
const CC_ME_ACH_TX={
  ru:{c_win:['Первая победа','Выиграй любой турнир в карьере'], c_major:['Чемпион Мейджора','Выиграй финал Мейджора FNCS'],
      c_lan:['Король ЛАНа','Выиграй финал на ЛАНе'], c_globals:['Чемпион мира','Выиграй Global Championship'], c_reload:['Reload-чемпион','Выиграй финал Reload'],
      c_potm:['Игрок месяца','Стань игроком месяца'], c_potm5:['Звезда сезона','Стань игроком месяца 5 раз'],
      c_100k:['Шестизначные','Заработай $100 000 призовых в одной карьере'], c_1m:['Миллионер','Заработай $1 000 000 призовых в одной карьере'],
      c_div1:['Дивизион 1','Дойди до первого дивизиона'], c_ev100:['Сотня турниров','Сыграй 100 турниров в одной карьере'],
      c_top50:['Стабильность','50 раз попади в топ-10'], c_s3:['Ветеран сцены','Доиграй до третьего сезона'], c_creator:['Из стримеров в про','Начни карьеру за креатора'],
      c_yt:['Ютубер','Набери 100 000 подписчиков на YouTube'], c_multi:['Многостаночник','Веди три карьеры сразу'],
      d_first:['Ежедневный','Сыграй драфт дня'], d_win:['Лучший за день','Выиграй драфт дня'], d_top3:['Подиум дня','Займи топ-3 в драфте дня'],
      d_streak7:['Неделя без пропусков','Играй драфт дня 7 дней подряд'], d_30:['Месяц драфтов','Сыграй 30 драфтов дня'], d_win3:['Трижды лучший','Выиграй драфт дня 3 раза'],
      m_first:['Главный тренер','Возглавь клуб в режиме менеджера'], m_own:['Владелец','Создай свой клуб'], m_win:['Первый кубок клуба','Игрок твоего клуба выигрывает турнир'],
      m_win10:['Машина побед','Игроки клуба выигрывают 10 турниров'], m_trophy:['Трофей сезона','Получи награду сезона'], m_trophy5:['Полка трофеев','Собери 5 наград сезона'],
      m_1m:['Миллион в кассе','Клуб зарабатывает $1 000 000'], m_s3:['Династия','Проведи с клубами три сезона'], m_clubs2:['Новый вызов','Поработай в двух разных клубах'],
      m_fired:['Ничего личного','Тебя уволили из клуба']},
  en:{c_win:['First win','Win any event in a career'], c_major:['Major champion','Win an FNCS Major final'],
      c_lan:['LAN king','Win a LAN final'], c_globals:['World champion','Win the Global Championship'], c_reload:['Reload champion','Win a Reload final'],
      c_potm:['Player of the month','Be named player of the month'], c_potm5:['Star of the season','Be player of the month 5 times'],
      c_100k:['Six figures','Earn $100,000 in one career'], c_1m:['Millionaire','Earn $1,000,000 in one career'],
      c_div1:['Division 1','Reach the first division'], c_ev100:['A hundred events','Play 100 events in one career'],
      c_top50:['Consistency','Finish top 10 fifty times'], c_s3:['Scene veteran','Reach season three'], c_creator:['Streamer to pro','Start a career as a creator'],
      c_yt:['YouTuber','Reach 100,000 YouTube subscribers'], c_multi:['Juggler','Run three careers at once'],
      d_first:['Daily','Play a daily draft'], d_win:['Best of the day','Win a daily draft'], d_top3:['Daily podium','Finish top 3 in a daily draft'],
      d_streak7:['No days off','Play the daily draft 7 days in a row'], d_30:['A month of drafts','Play 30 daily drafts'], d_win3:['Three-time best','Win the daily draft 3 times'],
      m_first:['Head coach','Take charge of a club in manager mode'], m_own:['Owner','Found your own club'], m_win:['First club cup','A player of your club wins an event'],
      m_win10:['Winning machine','Your club players win 10 events'], m_trophy:['Season trophy','Win a season award'], m_trophy5:['Trophy shelf','Collect 5 season awards'],
      m_1m:['A million in the bank','Your club earns $1,000,000'], m_s3:['Dynasty','Manage clubs for three seasons'], m_clubs2:['New challenge','Work at two different clubs'],
      m_fired:['Nothing personal','Get sacked by a club']}
};
const CC_ME_ACH_ICO={c_win:'🏆', c_major:'👑', c_lan:'🏟️', c_globals:'🌍', c_reload:'🔁', c_potm:'🏅', c_potm5:'🌟', c_100k:'💵', c_1m:'💰',
  c_div1:'🥇', c_ev100:'💯', c_top50:'📈', c_s3:'🧓', c_creator:'🎥', c_yt:'▶️', c_multi:'🗂️',
  d_first:'📅', d_win:'🥇', d_top3:'🥉', d_streak7:'🔥', d_30:'🗓️', d_win3:'👑',
  m_first:'📋', m_own:'🏢', m_win:'🏆', m_win10:'⚙️', m_trophy:'🎖️', m_trophy5:'🗄️', m_1m:'🏦', m_s3:'🏰', m_clubs2:'🔄', m_fired:'📦'};
// Сейвы менеджера — прямо по ключам (mgrSlotRead в куске mgr.js): клуб, трофеи, история сезонов, результаты.
function ccMeMgrSaves(){
  const out=[];
  for(let n=1;n<=10;n++){ try{ const m=ccSaveParse(localStorage.getItem(n===1 ? 'fncsdraft_manager' : 'fncsdraft_manager_s'+n)); if(m && m.club) out.push(m); }catch(e){} }
  return out;
}
function ccMeAch(saves, dr){
  const all=saves.map(s=>(s.career||{}));
  const wins=[].concat(...all.map(c=>(c.log||[]).filter(e=>e && e.place===1)));
  const fin=(re)=>wins.some(e=>re(e));
  const potm=all.reduce((a,c)=>a+((c.aw||{}).won||[]).filter(x=>x && x.you && x.kind==='month').length, 0);
  let maxStreak=0, run=0, prev=null;
  dr.map(r=>r.day).sort().forEach(d=>{ run=(prev && ccAddDays(prev, 1)===d) ? run+1 : 1; prev=d; if(run>maxStreak) maxStreak=run; });
  const has={
    c_win:wins.length>0, c_major:fin(e=>{ try{ return !!ccFncsTitle(e); }catch(x){ return false; } }),
    c_lan:fin(e=>/^(summit|rc)$/.test(e.kind) && e.stage==='final'), c_globals:fin(e=>e.kind==='globals'), c_reload:fin(e=>e.kind==='reload' && e.stage==='final'),
    c_potm:potm>=1, c_potm5:potm>=5, c_100k:all.some(c=>(c.earnings||0)>=100000), c_1m:all.some(c=>(c.earnings||0)>=1000000),
    c_div1:all.some(c=>c.division===1), c_ev100:all.some(c=>(c.log||[]).filter(e=>e && e.place).length>=100),
    c_top50:all.reduce((a,c)=>a+(c.log||[]).filter(e=>e && e.place && e.place<=10).length, 0)>=50, c_s3:all.some(c=>(c.season||1)>=3),
    c_creator:saves.some(s=>(s.player||{}).creator), c_yt:all.some(c=>((c.yt||{}).subs||0)>=100000), c_multi:saves.length>=3,
    d_first:dr.length>0, d_win:dr.some(r=>r.place===1), d_top3:dr.some(r=>r.place<=3), d_streak7:maxStreak>=7, d_30:dr.length>=30,
    d_win3:dr.filter(r=>r.place===1).length>=3
  };
  const ms=ccMeMgrSaves();
  const mWins=ms.reduce((a,m)=>a+(m.results||[]).filter(r=>!/#/.test(String(r.id||'')) && (r.rows||[]).some(x=>x && x.mine && x.place===1)).length, 0);
  const mTro=ms.reduce((a,m)=>a+(m.trophies||[]).length, 0);
  const mHist=[].concat(...ms.map(m=>m.history||[]));
  Object.assign(has, {
    m_first:ms.length>0, m_own:ms.some(m=>m.club && m.club.own), m_win:mWins>=1, m_win10:mWins>=10,
    m_trophy:mTro>=1, m_trophy5:mTro>=5, m_1m:ms.some(m=>(m.club.earned||0)>=1000000) || mHist.some(h=>(h.earned||0)>=1000000),
    m_s3:mHist.length>=3, m_clubs2:new Set(mHist.map(h=>h.club).concat(ms.map(m=>m.club.name))).size>=2, m_fired:mHist.some(h=>h.fired)
  });
  return has;
}
function ccMeAchHTML(has, pre){
  const T=CC_ME_ACH_TX[(typeof LANG!=='undefined' && LANG)] || CC_ME_ACH_TX.en;
  return Object.keys(has).filter(k=>k.indexOf(pre)===0).map(k=>'<div class="achv-card '+(has[k] ? 'unlocked' : 'locked')+'"><div class="achv-icon">'+CC_ME_ACH_ICO[k]+'</div><div><div class="achv-title">'+
    esc(T[k][0])+'</div><div class="achv-desc">'+esc(T[k][1])+'</div></div></div>').join('');
}
Object.keys(I18N).forEach(l=>{ I18N[l].navGrpProfile=(CC_ME_TX[l]||CC_ME_TX.en).nav; });
function ccMeCareer(s){
  const cr=(s && s.career)||{}, pl=(s && s.player)||{};
  const log=(cr.log||[]).filter(e=>e && e.place);
  let titles=0; log.forEach(e=>{ if(e.place===1){ try{ if(ccFncsTitle(e)) titles++; }catch(x){} } });
  const best=log.filter(e=>e.of>1).sort((a,b)=>(a.place/a.of)-(b.place/b.of) || a.place-b.place)[0]||null;
  let bestName=''; if(best){ try{ bestName=ccLockerPlain(ccLogName(best)); }catch(x){ bestName=best.name||''; } }
  // Кубки карьеры — выигранные финалы FNCS (как на полке наград), по порядку.
  const big=e=>{ try{ if(ccFncsTitle(e)) return true; }catch(x){} return e.kind==='globals' || (/^(summit|rc|reload)$/.test(e.kind) && e.stage==='final'); };
  const cups=log.filter(e=>e.place===1 && big(e)).sort((a,b)=>String(a.day)<String(b.day) ? -1 : 1);
  let flag=''; try{ flag=ccFlagImgs(ccFlagEmoji(pl.country||pl.nat||'')); }catch(x){ flag=''; }
  return {nick:pl.nick||pl.handle||'?', creator:!!pl.creator, y0:cr.year0||cr.year, y:cr.year, season:cr.season||1, div:cr.division,
    ovr:Math.round(pl.ovr||0), earn:Math.round(cr.earnings||0), ev:log.length, wins:log.filter(e=>e.place===1).length,
    vr:log.reduce((a,e)=>a+(e.wins||0), 0), top10:log.filter(e=>e.place<=10).length, titles, potm:((cr.aw||{}).won||[]).filter(a=>a && a.you && a.kind==='month').length,
    best:best ? '#'+best.place+' · '+bestName : '', photo:pl.photo||null, cups, flag};
}
Object.assign(CC_ME_TX.ru, {level:'Уровень', xp:'опыт', banner:'Баннер', frame:'Рамка', locked:'с уровня', showcase:'Витрина', showPick:'Выбери до трёх для витрины',
  people:'Люди', mates:'Напарники', nights:'вечеров', avgP:'ср. место', bestMate:'Лучший напарник', rival:'Главный соперник', rivalNote:'чаще всех MVP твоих вечеров',
  cal:'Последние 30 дней', settings:'Настройки', lang:'Язык', binds:'Бинды построек', bindsNote:'Действуют во всех карьерах, на HUD над хотбаром', bindsSaved:'Сохранено'});
Object.assign(CC_ME_TX.en, {level:'Level', xp:'XP', banner:'Banner', frame:'Frame', locked:'from level', showcase:'Showcase', showPick:'Pick up to three for the showcase',
  people:'People', mates:'Teammates', nights:'nights', avgP:'avg place', bestMate:'Best teammate', rival:'Main rival', rivalNote:'most often MVP of your nights',
  cal:'Last 30 days', settings:'Settings', lang:'Language', binds:'Build binds', bindsNote:'Used in every career, shown on the HUD above the hotbar', bindsSaved:'Saved'});
/* Уровень аккаунта: опыт за всё, что лежит на устройстве. Порог уровня n: 150·n·(n−1), то есть 2 = 300, 5 = 3000,
   10 = 13 500, 20 = 57 000. Баннеры (фон шапки) и рамки аватара открываются по уровню. */
function ccMeXp(cars, dr, hist, achOpen){
  let xp=0;
  cars.forEach(([,c])=>{ xp+=c.ev*10+c.wins*60+c.titles*400+c.potm*150; });
  xp+=dr.length*40+dr.filter(r=>r.place===1).length*150;
  xp+=hist.length*15+hist.filter(h=>h.place===1).length*60;
  xp+=achOpen*50;
  let lv=1; while(150*(lv+1)*lv<=xp) lv++;
  const from=150*lv*(lv-1), to=150*(lv+1)*lv;
  return {xp, lv, pct:Math.round((xp-from)/(to-from)*100), next:to};
}
const CC_ME_BANNERS=[[1,'lobby'],[3,'sunset'],[5,'storm'],[8,'tilted'],[12,'gold'],[16,'ice'],[20,'champ']];
const CC_ME_FRAMES=[[1,'yellow'],[4,'silver'],[7,'gold'],[10,'storm'],[15,'rainbow']];
// Витрина: выигранные финалы FNCS из всех карьер и открытые достижения. id: cup:<слот>:<день>:<вид>, a:<id>, p:<ключ>.
function ccMeShowItems(cars, ach, has){
  const out=[];
  cars.forEach(([n, c])=>c.cups.forEach(e=>{ let art=null, nm=''; try{ art=ccLogArt(e); }catch(x){}
    if(e.kind==='globals') nm='Global Championship'; else { try{ nm=ccLockerPlain(ccLogName(e)); }catch(x){} }
    out.push({id:'cup:'+n+':'+e.day+':'+e.kind, art, icon:'🏆', name:nm, sub:String(e.day||'').slice(0,4)}); }));
  const PT=CC_ME_ACH_TX[(typeof LANG!=='undefined' && LANG)] || CC_ME_ACH_TX.en;
  Object.keys(has).filter(k=>has[k]).forEach(k=>out.push({id:'p:'+k, icon:CC_ME_ACH_ICO[k], name:PT[k][0]}));
  // В названиях ачивок бывает флаг тегом <img>; в плитке нужен только текст.
  ACHIEVEMENTS.filter(a=>ach.has(a.id)).forEach(a=>out.push({id:'a:'+a.id, icon:a.icon, name:String(L()['achv_'+a.id+'_title']||a.id).replace(/<[^>]*>/g, '').trim()}));
  return out;
}
function ccMeShowTile(it){
  return '<div class="me-show-t">'+(it.art ? '<img src="'+esc(it.art)+'" alt="" loading="lazy" onerror="this.remove()">' : '<i>'+it.icon+'</i>')+
    '<b>'+esc(it.name)+'</b>'+(it.sub ? '<small>'+esc(it.sub)+'</small>' : '')+'</div>';
}
function ccMeShowToggle(id){
  if(!CC_ME_EDIT) return;
  const s=(CC_ME_EDIT.show=CC_ME_EDIT.show||[]), i=s.indexOf(id);
  if(i>=0) s.splice(i, 1); else if(s.length<3) s.push(id);
  ccMeRedraw();
}
// Люди: напарники из записей вечеров (e.mates) по всем карьерам; соперник — чаще всех MVP твоих вечеров, кроме тебя.
function ccMePeople(saves){
  const by=new Map(), mvp=new Map();
  saves.forEach(s=>{ const me=hKey(String((s.player||{}).nick||''));
    ((s.career||{}).log||[]).forEach(e=>{ if(!e || !e.place) return;
      (e.mates||(e.mate ? [e.mate] : [])).forEach(m=>{ const k=hKey(m); if(!k || k===me) return;
        const b=by.get(k)||{name:m, n:0, sum:0, firsts:0, prize:0}; b.n++; b.sum+=e.place; if(e.place===1) b.firsts++; b.prize+=e.prize||0; by.set(k, b); });
      if(e.mvp && !e.mvpYou && hKey(e.mvp)!==me){ const k=hKey(e.mvp); const r=mvp.get(k)||{name:e.mvp, n:0}; r.n++; mvp.set(k, r); } }); });
  const mates=[...by.values()].sort((a,b)=>b.n-a.n);
  const best=mates.filter(m=>m.n>=5).sort((a,b)=>a.sum/a.n-b.sum/b.n)[0]||null;
  const rival=[...mvp.values()].sort((a,b)=>b.n-a.n)[0]||null;
  return {mates:mates.slice(0, 6), best, rival};
}
// Бинды аккаунта главнее бинд карьеры (ccBindsOf): настоящие клавиши у человека одни на все карьеры.
function ccMeBindSet(el, k, v){
  v=ccBindOk(v); if(!v) return false;
  const p=ccMeProf(), b=(p.binds||CC_BIND_DEFAULT.slice()).slice(0, 4);
  if(b.some((x,i)=>i!==k && x===v)){ el.classList.add('bad'); setTimeout(()=>el.classList.remove('bad'), 700); return false; }
  b[k]=v; p.binds=b; ccMeProfSave(p);
  el.value=v; const m=document.getElementById('meBindsOk'); if(m) m.hidden=false;
  return true;
}
function ccMeBindKey(e, k){
  if(e.key==='Tab' || e.ctrlKey || e.metaKey || e.altKey) return;
  if(!e.key || e.key==='Unidentified' || e.key==='Process') return;   // экранная клавиатура телефона: разберёт ccMeBindInput
  e.preventDefault();
  if(e.key.length===1) ccMeBindSet(e.target, k, e.key);
}
function ccMeBindInput(el, k){
  const ch=String(el.value||'').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-1);
  const p=ccMeProf(), was=(p.binds||CC_BIND_DEFAULT)[k];
  if(!ch || !ccMeBindSet(el, k, ch)) el.value=was;
}
// Панель облака одна (#ccCloud, со своими id полей), поэтому на время аккаунта переезжает в него и возвращается обратно.
let CC_ME_CLOUD_HOME=null;
function ccMeCloudMount(){
  const cl=document.getElementById('ccCloud'), slot=document.getElementById('meCloudSlot'); if(!cl || !slot) return;
  if(!CC_ME_CLOUD_HOME) CC_ME_CLOUD_HOME={parent:cl.parentNode, next:cl.nextSibling};
  slot.appendChild(cl); try{ ccCloudDraw(); }catch(e){}
}
function ccMeCloudHome(){
  const cl=document.getElementById('ccCloud'); if(!cl || !CC_ME_CLOUD_HOME || cl.parentNode===CC_ME_CLOUD_HOME.parent) return;
  CC_ME_CLOUD_HOME.parent.insertBefore(cl, CC_ME_CLOUD_HOME.next);
}
function ccMeHTML(){
  const T=ccMeT(), stat=(v,l)=>'<div class="me-st"><b>'+v+'</b><small>'+esc(l)+'</small></div>';
  // Карьеры по слотам.
  const cars=[], saves=[];
  for(let n=1;n<=CC_SLOTS;n++){ const s=ccSlotRead(n); if(s && s.career){ cars.push([n, ccMeCareer(s)]); saves.push(s); } }
  // Менеджер — прямо по ключам: mgrSlotRead живёт в куске mgr.js и до входа в менеджер на сайте не загружен.
  let mgrN=0; try{ for(let n=1;n<=10;n++) if(localStorage.getItem(n===1 ? 'fncsdraft_manager' : 'fncsdraft_manager_s'+n)) mgrN++; }catch(e){}
  const tot=cars.reduce((a,[,c])=>{ a.earn+=c.earn; a.ev+=c.ev; a.wins+=c.wins; a.vr+=c.vr; a.titles+=c.titles; return a; }, {earn:0, ev:0, wins:0, vr:0, titles:0});
  // Драфт дня.
  const days=(dailyStore().days)||{}, dk=Object.keys(days).sort(), dr=dk.map(k=>Object.assign({day:k}, days[k])).filter(r=>r.place);
  let streak=0; { let d=dailyDay(); if(!days[d]) d=ccAddDays(d, -1); while(days[d] && days[d].place){ streak++; d=ccAddDays(d, -1); } }
  // Драфт и достижения.
  const hist=loadHistory(), ach=loadAchievements();
  const gradeOrder='SABCD', bestGrade=hist.map(h=>h.grade).filter(Boolean).sort((a,b)=>gradeOrder.indexOf(a)-gradeOrder.indexOf(b))[0]||'—';
  const placed=hist.filter(h=>h.place!=null);
  // Ник и аватар: свой профиль (fncsdraft_profile) первым, потом первая карьера и ник драфта дня.
  const prof=ccMeProf(), E=CC_ME_EDIT;
  const nick=(E ? E.nick : prof.nick) || (cars[0] && cars[0][1].nick) || dailyNick() || '—';
  let ph=E ? ccMeAvaURL(E) : ccMeAvaURL(prof);
  if(!ph){ try{ ph=CAREER && careerCard() ? photoURL(careerCard()) : null; }catch(e){ ph=null; } }
  /* Два отдельных набора (30.10, его «отдельные достижения для карьеры и отдельные для драфта»): карьера — c_*;
     драфт — 76 старых ACHIEVEMENTS (забеги) и d_* (драфт дня). */
  const has=ccMeAch(saves, dr);
  const cKeys=Object.keys(has).filter(k=>k[0]==='c'), dKeys=Object.keys(has).filter(k=>k[0]==='d'), mKeys=Object.keys(has).filter(k=>k[0]==='m');
  const cOpen=cKeys.filter(k=>has[k]).length, dOpen=dKeys.filter(k=>has[k]).length, mOpen=mKeys.filter(k=>has[k]).length;
  const cloud=!!(typeof ccCloudCode==='function' && ccCloudCode());
  // Уровень, баннер, рамка, витрина.
  const lv=ccMeXp(cars, dr, hist, ach.size+cOpen+dOpen+mOpen);
  const okB=k=>CC_ME_BANNERS.some(([l,n])=>n===k && l<=lv.lv), okF=k=>CC_ME_FRAMES.some(([l,n])=>n===k && l<=lv.lv);
  const bn=okB(E ? E.banner : prof.banner) ? (E ? E.banner : prof.banner) : 'lobby';
  const fr=okF(E ? E.frame : prof.frame) ? (E ? E.frame : prof.frame) : 'yellow';
  const showAll=ccMeShowItems(cars, ach, has), showIds=(E ? E.show : prof.show)||[];
  const shown=showIds.map(id=>showAll.find(x=>x.id===id)).filter(Boolean);
  const ava='<span class="me-fr me-fr-'+fr+'">'+(ph ? '<img class="me-ava" src="'+esc(ph)+'" alt="" onerror="this.remove()">' : '<span class="me-ava me-ava-0">'+esc(String(nick).slice(0,1).toUpperCase())+'</span>')+'</span>';
  const pick=(list, cur, key)=>list.map(([l,n])=>'<button type="button" class="me-pick me-pick-'+key+' me-'+key+'-'+n+(cur===n ? ' on' : '')+'"'+
    (l>lv.lv ? ' disabled title="'+esc(T.locked+' '+l)+'"' : ' onclick="CC_ME_EDIT.'+(key==='bn' ? 'banner' : 'frame')+'=\''+n+'\';ccMeRedraw()"')+'>'+(l>lv.lv ? '🔒'+l : '')+'</button>').join('');
  const editor=E ? '<div class="me-edit">'+
      '<input class="me-nick-in" maxlength="24" placeholder="'+esc(T.nickPh)+'" value="'+esc(E.nick)+'" oninput="CC_ME_EDIT.nick=this.value">'+
      '<label class="cc-back me-up">'+esc(T.upload)+'<input type="file" accept="image/*" hidden onchange="ccMePhoto(this)"></label>'+
      '<input class="me-skin-in" placeholder="'+esc(T.skinPh)+'" value="'+esc(E.q)+'" oninput="ccMeSkinFind(this.value)">'+
      '<div class="me-skins" id="meSkins">'+ccMeSkinsHTML()+'</div>'+
      '<div class="me-row"><small>'+esc(T.banner)+'</small>'+pick(CC_ME_BANNERS, bn, 'bn')+'</div>'+
      '<div class="me-row"><small>'+esc(T.frame)+'</small>'+pick(CC_ME_FRAMES, fr, 'fr')+'</div>'+
      (showAll.length ? '<div class="me-row me-row-show"><small>'+esc(T.showPick)+' · '+showIds.length+'/3</small><div class="me-show-pick">'+
        showAll.map(it=>'<button type="button" class="me-show-o'+(showIds.indexOf(it.id)>=0 ? ' on' : '')+'" onclick="ccMeShowToggle(\''+esc(it.id)+'\')">'+ccMeShowTile(it)+'</button>').join('')+'</div></div>' : '')+
      '<div class="me-edit-b"><button class="cc-back me-open" onclick="ccMeEditSave()">'+esc(T.save)+'</button><button class="cc-back" onclick="ccMeEditClose()">'+esc(T.cancel)+'</button></div>'+
      '<small>'+esc(cloud ? T.cloudOn : T.cloudOff)+'</small></div>' : '';
  const head='<div class="ch-tile me-head me-bn-'+bn+'">'+ava+
    '<div class="me-id"><h2>'+esc(nick)+'</h2>'+
      '<div class="me-lv"><b>'+esc(T.level)+' '+lv.lv+'</b><span><i style="width:'+lv.pct+'%"></i></span><small>'+ccNum(lv.xp)+' / '+ccNum(lv.next)+' '+esc(T.xp)+'</small></div>'+
      '<small>'+esc(T.device)+(cloud ? ' · ☁ '+esc(T.cloudOn) : '')+'</small>'+
      (E ? '' : '<button class="cc-back me-editbtn" onclick="ccMeEditOpen()">'+esc(T.edit)+'</button>')+'</div>'+
    (shown.length && !E ? '<div class="me-show">'+shown.map(ccMeShowTile).join('')+'</div>' : '')+
    '<div class="me-sts">'+stat(cars.length, T.careers)+stat('$'+ccNum(tot.earn), T.earn)+stat(tot.wins, T.firsts)+stat(tot.vr, T.vr)+stat(tot.titles, T.titles)+
      stat(dr.length, T.daily)+stat(cOpen+'/'+cKeys.length, T.achCareerS)+stat((ach.size+dOpen)+'/'+(ACHIEVEMENTS.length+dKeys.length), T.achDraftS)+
      stat(mOpen+'/'+mKeys.length, T.achMgrS)+'</div>'+editor+'</div>';
  const cupsHTML=c=>{ if(!c.cups.length) return '';
    const shown=c.cups.slice(-6), rest=c.cups.length-shown.length;
    return '<div class="me-cups">'+shown.map(e=>{ let art=null; try{ art=ccLogArt(e); }catch(x){}
      let nm=''; if(e.kind==='globals') nm='Global Championship'; else { try{ nm=ccLockerPlain(ccLogName(e)); }catch(x){ nm=''; } }
      return '<span class="me-cup'+(e.kind==='globals' ? ' g' : '')+'" title="'+esc(nm+' · '+e.day)+'">'+(art ? '<img src="'+esc(art)+'" alt="" loading="lazy" onerror="this.remove()">' : '')+'<b>🏆</b></span>'; }).join('')+
      (rest>0 ? '<span class="me-cup-more">+'+rest+' '+esc(T.more)+'</span>' : '')+'</div>'; };
  const carHTML=cars.length ? cars.map(([n, c])=>'<div class="me-car">'+
      '<div class="me-car-h">'+(c.flag ? '<span class="me-flag">'+c.flag+'</span>' : '')+'<b>'+esc(c.nick)+'</b>'+(c.creator ? '<em>'+esc(T.creator)+'</em>' : '')+'<span>'+esc(String(c.y0||''))+(c.y && c.y!==c.y0 ? '–'+c.y : '')+'</span>'+
        '<i class="me-ovr">'+c.ovr+'</i></div>'+cupsHTML(c)+
      '<div class="me-sts">'+stat(c.season, T.season)+(c.div ? stat(c.div, T.div) : '')+stat('$'+ccNum(c.earn), T.earn)+stat(c.ev, T.ev)+stat(c.wins, T.firsts)+stat(c.vr, T.vr)+
        stat(c.top10, T.top10)+stat(c.titles, T.titles)+stat(c.potm, T.potm)+'</div>'+
      (c.best ? '<div class="me-best"><small>'+esc(T.best)+'</small> '+esc(c.best)+'</div>' : '')+
      '<button class="cc-back me-open" onclick="ccSlotUse('+n+');careerEntry()">'+esc(T.open)+'</button></div>').join('')
    : '<div class="ch-empty">'+esc(T.none)+'</div>';
  // Календарь драфта дня: 30 клеток до сегодня, сыграно / топ-3 / победа.
  const calHTML=(()=>{ let d=dailyDay(), cells=[];
    for(let i=0;i<30;i++){ const r=days[d]; cells.unshift('<i class="'+(r && r.place ? (r.place===1 ? 'w' : r.place<=3 ? 'p' : 'y') : '')+'" title="'+esc(d+(r && r.place ? ' · #'+r.place : ''))+'"></i>'); d=ccAddDays(d, -1); }
    return '<div class="me-cal"><small>'+esc(T.cal)+'</small><div>'+cells.join('')+'</div></div>'; })();
  const dailyHTML=dr.length ? '<div class="me-sts">'+stat(dr.length, T.played)+stat(dr.filter(r=>r.place===1).length, T.wins)+
      stat('#'+Math.min.apply(null, dr.map(r=>r.place)), T.bestPlace)+stat('#'+(dr.reduce((a,r)=>a+r.place,0)/dr.length).toFixed(1), T.avgPlace)+
      stat(ccNum(Math.max.apply(null, dr.map(r=>r.score||0))), T.bestScore)+stat(streak, T.streak)+'</div>'+
      '<div class="me-last"><small>'+esc(T.last)+'</small>'+dr.slice(-10).reverse().map(r=>'<span class="'+(r.place===1 ? 'w' : r.place<=3 ? 'p' : '')+'" title="'+esc(r.day)+'">#'+r.place+'</span>').join('')+'</div>'+
      calHTML
    : '<div class="ch-empty">'+esc(T.none)+'</div>';
  const draftHTML=hist.length ? '<div class="me-sts">'+stat(hist.length, T.runs)+stat(placed.filter(h=>h.place===1).length, T.wins)+
      stat(placed.length ? '#'+Math.min.apply(null, placed.map(h=>h.place)) : '—', T.bestPlace)+stat(bestGrade, T.bestGrade)+
      stat(hist.filter(h=>h.championMajor).length, T.majors)+'</div>' : '<div class="ch-empty">'+esc(T.none)+'</div>';
  const achHTML='<div class="me-ach">'+ACHIEVEMENTS.map(a=>'<div class="achv-card '+(ach.has(a.id) ? 'unlocked' : 'locked')+'"><div class="achv-icon">'+a.icon+'</div><div><div class="achv-title">'+
      (L()['achv_'+a.id+'_title']||a.id)+'</div><div class="achv-desc">'+(L()['achv_'+a.id+'_desc']||'')+'</div></div></div>').join('')+'</div>';
  const sec=(h, body)=>'<div class="ch-tile me-sec"><h4>'+esc(h)+'</h4>'+body+'</div>';
  // Достижения свёрнуты: заголовок со счётом, список по нажатию.
  const secAch=(h, body)=>'<details class="ch-tile me-sec me-det"><summary><h4>'+esc(h)+'</h4></summary>'+body+'</details>';
  // Драфт дня первыми в наборе драфта: они свежие и про то, во что играют каждый день.
  const draftAch='<div class="me-ach">'+ccMeAchHTML(has, 'd_')+achHTML.replace(/^<div class="me-ach">/, '');
  // Три отдельных набора: карьера под карьерами, драфт под драфтом, менеджер в конце.
  // Люди: напарники, лучший напарник (от 5 вечеров), главный соперник.
  const ppl=ccMePeople(saves);
  const pplHTML=ppl.mates.length ? '<div class="me-sts">'+
      (ppl.best ? stat(esc(ppl.best.name)+' · #'+(ppl.best.sum/ppl.best.n).toFixed(1), T.bestMate) : '')+
      (ppl.rival ? stat(esc(ppl.rival.name)+' · '+ppl.rival.n, T.rival+' ('+T.rivalNote+')') : '')+'</div>'+
      '<div class="me-mates"><small>'+esc(T.mates)+'</small>'+ppl.mates.map(m=>'<div class="me-mate"><b>'+esc(m.name)+'</b><span>'+m.n+' '+esc(T.nights)+' · '+esc(T.avgP)+' #'+(m.sum/m.n).toFixed(1)+
        (m.firsts ? ' · 🏆 '+m.firsts : '')+(m.prize ? ' · $'+ccNum(m.prize) : '')+'</span></div>').join('')+'</div>'
    : '<div class="ch-empty">'+esc(T.none)+'</div>';
  // Настройки: облако (панель #ccCloud переезжает сюда), язык, бинды аккаунта.
  const pb=ccMeProf().binds||CC_BIND_DEFAULT, langs=['en','ru','fr','it','pt','de','es'];
  const setHTML='<div class="me-set"><div id="meCloudSlot"></div>'+
    '<div class="me-row"><small>'+esc(T.lang)+'</small>'+langs.map(l=>'<button type="button" class="me-lang'+(LANG===l ? ' on' : '')+'" onclick="setLang(\''+l+'\');ccMeRedraw()">'+l.toUpperCase()+'</button>').join('')+'</div>'+
    '<div class="me-row"><small>'+esc(T.binds)+'</small>'+['Wall','Floor','Stairs','Cone'].map((n,k)=>'<span class="me-bind"><i class="me-bico">'+(CC_KIT_BUILD_ICON[n.toLowerCase()]||'')+'</i><input maxlength="3" value="'+esc(pb[k]||CC_BIND_DEFAULT[k])+'" autocomplete="off" spellcheck="false" onkeydown="ccMeBindKey(event,'+k+')" oninput="ccMeBindInput(this,'+k+')"></span>').join('')+
      '<em id="meBindsOk" hidden>✓ '+esc(T.bindsSaved)+'</em></div><small class="me-note">'+esc(T.bindsNote)+'</small></div>';
  return head+sec(T.careers, '<div class="me-cars">'+carHTML+'</div>')+
    secAch(T.achCareer+' · '+cOpen+'/'+cKeys.length, '<div class="me-ach">'+ccMeAchHTML(has, 'c_')+'</div>')+
    sec(T.people, pplHTML)+
    sec(T.daily, dailyHTML)+sec(T.draft, draftHTML)+
    secAch(T.achDraft+' · '+(ach.size+dOpen)+'/'+(ACHIEVEMENTS.length+dKeys.length), draftAch)+
    sec(T.mgr, mgrN ? '<div class="me-sts">'+stat(mgrN, T.clubs)+'</div>' : '<div class="ch-empty">'+esc(T.none)+'</div>')+
    secAch(T.achMgr+' · '+mOpen+'/'+mKeys.length, '<div class="me-ach">'+ccMeAchHTML(has, 'm_')+'</div>')+
    sec(T.settings, setHTML);
}
function openProfileScreen(){
  ccMeRedraw();
  show('screen-profile');
  try{ if(location.hash!=='#me') history.replaceState(null, '', '#me'); }catch(e){}
  window.scrollTo(0, 0);
}
// /#me открывается, как только код готов: после DOMContentLoaded (язык и главная уже собраны), не дожидаясь картинок.
(function(){
  const go=()=>setTimeout(()=>{ try{ if(location.hash==='#me') openProfileScreen(); }catch(e){} document.documentElement.classList.remove('boot-me'); }, 0);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
// Медальоны боссов Fortnite с вики (items/medallions), по одному на месяц.
const CC_AW_MEDALS=['nisha', 'peter', 'valeria', 'oscar'];
/* У каждого месяца свой медальон: январь → peter, … декабрь → godzilla.
   Нет файла месяца: onerror ставит один из скачанных (CC_AW_MEDALS). Положил картинку в папку, месяц её берёт. */
const CC_AW_MEDAL_MONTH=['peter', 'nisha', 'oscar', 'montague', 'valeria', 'megalodon', 'shogunx', 'nightrose', 'doombot', 'emmafrost', 'mysterio', 'godzilla'];
/* Настоящие кубки ЛАНов, фото с сайтов производителей и Epic: World Cup 2019 (Нью-Йорк), FNCS Invitational 2022
   (Swarovski), Global Championship 2023 и 2024 (Swarovski, один дизайн), Глобалы с 2025-го и Pro-Am (Thomas Lyte).
   Остальные финалы остаются табличкой с артом турнира. */
function ccAwTrophy(e){
  if(!e) return null;
  const y=String(e.day||'').slice(0,4);
  if(e.kind==='major' && (e.day==='2019-07-27' || e.day==='2019-07-28')) return 'wc-2019';
  if(e.kind==='globals') return y==='2022' ? 'inv-2022' : y<'2025' ? 'gc-2023' : y==='2025' ? 'gc-2025' : 'gc-2026';
  if(e.kind==='proam') return 'proam';
  // EWC: диск на кристалле, один на все игры; Reload Championship тоже на EWC.
  if(ccAwEwc(e) || (e.kind==='rc' && e.stage==='final')) return 'ewc';
  return null;
}
function ccAwEwc(e){ return !!(e && e.ewc && /Esports World Cup/.test(e.lan||'')); }
function ccAwardsShelfHTML(){
  if(typeof careerAwards!=='function') return '';
  const won=(careerAwards().won||[]).filter(a=>a.you);
  const month=won.filter(a=>a.kind==='month'), season=won.filter(a=>a.kind==='season'), cat=won.filter(a=>a.kind==='cat');
  /* 30.10, его «награды чет сделать мб кубки фнксы какие-то как в игрок месяца в футболе» (скрин: шесть одинаковых
     звёзд, месяцы вперемешку). Теперь две полки: КУБКИ — выигранные финалы FNCS из лога (Мейджоры, ЛАНы, Глобалы,
     Reload), кубок с названием и датой, финалы недели одной строкой ×N; ИГРОК МЕСЯЦА — карточки как в футболе:
     твоё фото, плашка, месяц и год, очки PR и турниры (у наград до 30.10 их нет — только месяц). Всё по порядку. */
  const item=(ico, name, sub)=>'<div class="aw-item"><i>'+ico+'</i><b>'+esc(name)+'</b><small>'+esc(sub)+'</small></div>';
  const log=((CAREER.career||{}).log||[]).filter(e=>e && e.place===1);
  const big=e=>{ try{ if(ccFncsTitle(e)) return true; }catch(x){}
    return e.kind==='globals' || e.kind==='proam' || ccAwEwc(e) || (/^(summit|rc|reload)$/.test(e.kind) && e.stage==='final'); };
  const cups=log.filter(big).sort((a,b)=>String(a.day)<String(b.day) ? -1 : 1);
  const weekly=log.filter(e=>e.kind==='final' && !big(e)).length;
  // Глобалы полным именем: ccLogName даёт календарное сокращение «ГЧ» (его «что такое ГЧ», 30.10).
  const cupName=e=>{ const t=ccAwTrophy(e);
    if(t==='wc-2019') return 'World Cup '+(e.day==='2019-07-28' ? 'Solo' : 'Duos');
    if(t==='inv-2022') return 'FNCS Invitational';
    if(t==='proam') return 'Pro-Am';
    if(t==='ewc') return e.kind==='rc' ? 'EWC · Reload' : 'Esports World Cup';
    if(e.kind==='globals') return 'Global Championship';
    try{ return ccLockerPlain(ccLogName(e)); }catch(x){ return e.name||''; } };
  const cupDay=e=>{ try{ return ccDayLabel ? ccDayLabel(e.day) : e.day; }catch(x){ return e.day||''; } };
  /* 30.10 (2), его «слопно; кубки пусть лого фнкса, который он выиграл»: кубок — заставка того самого турнира
     (ccLogArt, те же картинки, что на стене истории) в рамке с табличкой: название и год. */
  const cupHTML=e=>{
    const t=ccAwTrophy(e);
    if(t) return '<div class="aw-plq aw-plq-t"><img src="items/trophies/'+t+'.png" alt="" loading="lazy">'+
      '<div class="aw-plq-plate"><b>'+esc(cupName(e))+'</b><small>'+esc(String(cupDay(e)))+' '+esc(String(e.day||'').slice(0,4))+'</small></div></div>';
    let art=null; try{ art=ccLogArt(e); }catch(x){ art=null; }
    return '<div class="aw-plq'+(e.kind==='globals' ? ' aw-plq-g' : '')+'">'+
      (art ? '<img src="'+esc(art)+'" alt="" loading="lazy" onerror="this.remove()">' : '')+
      '<div class="aw-plq-plate"><b>'+esc(cupName(e))+'</b><small>'+esc(String(cupDay(e)))+' '+esc(String(e.day||'').slice(0,4))+'</small></div></div>';
  };
  /* Игрок месяца — медаль на ленте (30.10, «игрок месяца чет другое» после карточек): золотой круг с выбитым месяцем,
     лента цветов FNCS, год и очки под ней. */
  const potm=month.slice().sort((a,b)=>String(a.key)<String(b.key) ? -1 : 1).map((a, ai)=>{
    const mName=typeof ccMonthName==='function' ? ccMonthName(a.key) : a.key;
    /* 30.10, его «чет с фортнайтом связанное… мб медальки из фортнайта»: медальоны боссов Главы 5 (вики Fortnite,
       items/medallions). Свой у каждого месяца (CC_AW_MEDAL_MONTH), недостающие подменяются скачанными. */
    const mi=Math.max(0, Math.min(11, Number(String(a.key).slice(5,7))-1));
    const med=CC_AW_MEDAL_MONTH[mi], alt=CC_AW_MEDALS[mi%CC_AW_MEDALS.length];
    return '<div class="aw-medal"><span class="aw-medal-glow"><img class="aw-medal-i" src="items/medallions/'+med+'.webp" alt="" loading="lazy"'+
      (alt!==med ? ' onerror="this.onerror=null;this.src=\'items/medallions/'+alt+'.webp\'"' : '')+'></span>'+
      '<b class="aw-medal-m">'+esc(mName)+'</b><span class="aw-medal-y">'+esc(String(a.key).slice(0,4))+'</span>'+
      (a.pts ? '<small>'+esc(ccNum(a.pts))+' '+esc(L().lfAwPts)+' · '+a.ev+' '+esc(L().lfAwEv)+'</small>' : '')+'</div>';
  });
  const items=[]
    .concat(season.map(a=>item('🏆', L().lfAwYear, L().ccMoneySeason(a.season))))
    .concat(cat.map(a=>item('🎖️', (typeof ccAwCatLabel==='function' ? ccAwCatLabel(a.cat) : a.cat), L().ccMoneySeason(a.season))));
  const any=cups.length || weekly || potm.length || items.length;
  return '<div class="ch-tile aw-shelf"><h4>'+L().lfAwards+'</h4>'+
    (!any ? '<div class="ch-empty">'+L().lfAwNone+'</div>' :
      ((cups.length || weekly) ? '<div class="aw-sub">'+esc(L().lfAwCups)+'</div><div class="aw-cups">'+cups.map(cupHTML).join('')+
        (weekly ? (()=>{ const we=log.filter(e=>e.kind==='final' && !big(e)).slice(-1)[0]; let art=null; try{ art=ccLogArt(we); }catch(x){}
          return '<div class="aw-plq aw-plq-s">'+(art ? '<img src="'+esc(art)+'" alt="" loading="lazy" onerror="this.remove()">' : '')+
            '<div class="aw-plq-plate"><b>'+esc(L().lfAwWeekly)+'</b><small>×'+weekly+'</small></div></div>'; })() : '')+'</div>' : '')+
      (items.length ? '<div class="aw-grid">'+items.join('')+'</div>' : '')+
      (potm.length ? '<div class="aw-sub">'+esc(L().lfAwMonths)+'</div><div class="aw-potms">'+potm.join('')+'</div>' : ''))+'</div>';
}
// The rating over the career, drawn from the log itself. The reference puts the
// number's own curve behind it, and it is the one chart a career has: eleven
// points a season, and the shape of them is the whole story of the mode.
function careerRatingCurve(log){
  const pts=log.slice().reverse().map(e=>e.ovr).filter(v=>isFinite(v));
  if(pts.length<2) return '';
  // A bare line across an empty box reads as a stray diagonal rather than as a
  // chart, which is why the reference fills under its curve. Same here: the
  // fill is what says "this is the shape of something", and the top and bottom
  // of the range are printed so the slope has a scale.
  const w=100, h=34, pad=2;
  const lo=Math.min(...pts), hi=Math.max(...pts), span=Math.max(1, hi-lo);
  const xy=pts.map((v,i)=>[(i/(pts.length-1))*w, h-pad-((v-lo)/span)*(h-pad*2)]);
  const line=xy.map(p=>p[0].toFixed(2)+','+p[1].toFixed(2)).join(' ');
  const area=`0,${h} ${line} ${w},${h}`;
  return `<div class="ev-chart">
    <svg class="ev-spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="evGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#35e0ff" stop-opacity=".42"/>
        <stop offset="1" stop-color="#35e0ff" stop-opacity="0"/>
      </linearGradient></defs>
      <polygon points="${area}" fill="url(#evGrad)"/>
      <polyline points="${line}" fill="none" stroke="#35e0ff" stroke-width="1.6"
        vector-effect="non-scaling-stroke" stroke-linejoin="round"/>
    </svg>
    <span class="ev-chart-hi">${hi}</span><span class="ev-chart-lo">${lo}</span>
  </div>`;
}

/* =====================================================================
   3 сентября 2026 — девять пунктов из разбора «чего не хватает карьере».
   Выбор: 2 (события-развилки), 3 (статистика), 4 (зал славы по слотам),
   5 (контракт с бонусом и уход клуба), 8 (ЛАН как поездка), 9 (план на игру),
   11 (план недели), 12 (мета сезона).
   Всё, что трогает силу игры (8, 9), меняет только РАЗБРОС своей команды и
   ни разу не среднее — см. tools/career-spread-probe.js.
   ===================================================================== */

/* План на вечер («на место» / «на элимы») и нервы первого ЛАНа: замерены и не выпущены.
   tools/career-spread-probe.js, 600 игр на режим, комната Д1 на 50:
   1. Ширина броска формы (gameForm) ×0.3..×2.0 ничего не сдвигает, дуэли по _pc решают мало.
   2. Агрессия (zone-sim seek × _seekMul, хук оставлен), очки = место + элимы×4 (кап 10):
      рейтинг 86: ×0.5 25.2, ×0.7 26.7, ×1 24.8, ×1.4 23.2, ×2 19.7;
      рейтинг 78: ×0.5 18.2, ×0.7 18.0, ×1 17.5, ×1.4 15.7, ×2 14.5; σ не растёт (27.6 → 26.6 при ×2).
   Агрессия только штраф, у такого выбора один правильный ответ. Не возвращать без нового рычага и замера. */

/* ---- 8. ЛАН как поездка ----

   Перелёт стоит энергии (день дороги), приезд — свой пост из города. Раз за
   ЛАН в сезоне. */
const CC_LAN_TRAVEL=25;
function careerLanArrive(kind, ev){
  const cr=CAREER && CAREER.career; if(!cr) return false;
  cr.lan=cr.lan||{};
  // Про-Ам: своя остановка — свой город и свой прилёт (Даллас в июле, Сан-Паулу в сентябре).
  const pa=(kind==='proam') ? ccProAmEvent(ccProAmKey(ev)) : null;
  const key=kind+'|'+cr.season+(pa ? '|'+ccProAmKey(ev) : '');
  if(cr.lan[key]) return false;
  cr.lan[key]=careerToday();
  const city=pa ? (((L().ccCity||{})[pa.city])||pa.city) : ccLanCity(kind, cr.season);
  careerSpend(CC_LAN_TRAVEL);
  careerNews('good', 'ccPostLanArrive', [city]);
  careerSave();
  return true;
}

/* ---- Уведомления как в X ----

   Скриншот ленты уведомлений X (): «ASP wheat and 11 others liked
   your post», под именем — кусок самого поста, справа его картинка. У нас
   стояло «Твой пост лайкнули: 549» без единого лица. Кто именно — берётся из
   уже записанного, как и комментарии (ccPostComments): напарник, клуб,
   друзья, подписки, люди из таблицы под постом. Никого не выдумываем. */
function ccNoteWho(n, salt){
  const pool=[];
  const add=h=>{ if(h && !pool.some(x=>hKey(x)===hKey(h))) pool.push(String(h)); };
  const mate=careerPartnerCard();
  if(mate) add(mate.handle);
  if(CAREER.org) add(CAREER.org.name);
  (CAREER.career.friends||[]).forEach(add);
  (ccFollows()||[]).forEach(add);
  ((n && n.tbl && n.tbl.rows)||[]).forEach(r=>String(r.n||'')
    .split(/\s*[+&]\s*/).forEach(x=>add(x.trim())));
  const me=CAREER.player && (CAREER.player.handle||CAREER.player.nick);
  const list=pool.filter(h=>!me || hKey(h)!==hKey(me));
  if(!list.length) return '';
  const rnd=careerRng(ccHashStr((salt||'')+'|'+((n&&n.id)||'')+'|'+((n&&n.day)||'')));
  return list[Math.floor(rnd()*list.length)];
}
function careerNoteRowHTML(t){
  const h=jsq(t.who||'');
  const who=t.who ? ccHandle(t.who) : '';
  const rest=Math.max(0, (t.n||0)-1);
  const head = t.kind==='follow' ? L().ccNoteFollow(who)
     : !who ? (t.kind==='like' ? L().ccNoteLike(ccFollowers(t.n||0))
             : t.kind==='repost' ? L().ccNoteRepost(ccFollowers(t.n||0))
             : L().ccNoteReply(ccFollowers(t.n||0)))
     : (t.kind==='like'   ? L().ccNoteLikeBy(who, ccFollowers(rest))
      : t.kind==='repost' ? L().ccNoteRepostBy(who, ccFollowers(rest))
      :                     L().ccNoteReplyBy(who, ccFollowers(rest)));
  // Сам пост под строкой — как в X, куском текста и его же картинкой.
  const post=t.post ? (CAREER.career.news||[]).find(n=>n.id===t.post) : null;
  const card=ccWhoCard(t.who||'');
  const av=t.who ? ccAvatar({name:t.who, handle:who, card:card}) : '';
  const art=post && post.art ? (CAREER_EV_ART[post.art]||'') : '';
  const glyph=t.kind==='like' ? CC_X_LIKE : t.kind==='repost' ? CC_X_REPOST
            : t.kind==='reply' ? CC_X_REPLY : CC_X_USER;
  return `<div class="x-note x-note-${t.kind}">
    <span class="x-note-g">${glyph}</span>
    <span class="x-note-av">${av}</span>
    <div class="x-note-in">
      <b>${esc(head)}</b>
      ${post ? `<span class="x-note-post">${esc(ccText(post))}</span>` : ''}
    </div>
    ${art ? `<span class="x-note-art" style="background-image:url(${art})"></span>` : ''}
    <em>${ccStamp(t)}</em>
    ${t.kind==='follow' ? (ccFollowing(t.who)
        ? `<span class="x-act-done">${L().ccFollowingBtn}</span>`
        : `<button class="x-act" onclick="careerFollow(\'${h}\')">${L().ccFollowBack}</button>`) : ''}
  </div>`;
}

/* ---- Разговор с напарником ----

   Просьба: «можно еще отдельную переписку с тимейтом сделать и
   какое-то общение там». Ветка напарника в инбоксе была и раньше — но только
   как канал, по которому он сам пишет после вечера (careerMateDm). Ответить
   было нечем.

   Здесь ветка есть всегда, пока сидит напарник, и в ней четыре темы, каждая
   из чего-то уже записанного: разбор вчерашнего вечера (журнал), точка
   высадки (careerSpots), кто на кого играет (роли), и просто поговорить.
   Настрой двигается тем же careerTalkMove, что и день «поговорить», и по тем
   же правилам не становится краном: повторный разговор в CC_TALK_GAP дешевле.
   Энергию НЕ тратит — это переписка, а не занятие; день не закрывается. */
/* «Про роли» сняли (его слово 7.10: «про роли лишнее будто, заменить») — ответ был один и тот же на все случаи.
   Вместо неё «Про соперников»: напарник называет самого сильного по Power Ranking, кроме вас двоих, и его место —
   то, что действительно меняется от недели к неделе. Старые ключи dm*role оставлены: они лежат в сохранённых
   переписках. */
const CC_MATE_TOPICS=['night','spot','rival','life'];
function ccMateRival(){
  try{
    const mate=careerPartnerCard(), mk=mate ? hKey(mate.handle) : null;
    const rows=careerPrRows()||[];
    for(let i=0; i<rows.length; i++){
      const r=rows[i]; if(!r || r.you || (mk && hKey(r.name)===mk)) continue;
      return {name:r.name, place:i+1, mine:(typeof careerPrPlace==='function' ? careerPrPlace() : null)||0};
    }
  }catch(e){}
  return null;
}
function careerMateThread(){
  const mate=careerPartnerCard();
  if(!mate || !mate.handle) return null;
  const t=careerDmFind(mate.handle);
  if(t) return t;
  const a=attrsFor(mate)||{};
  return careerDmThread({handle:mate.handle, ovr:(mate._ovr!=null?mate._ovr:a.ovr),
    nat:mate.nat, role:a.roleKey, roster:mate.tier!=='ladder',
    cardRegion:mate.region, club:mate.org||null, pay:ccPlayerPay(mate), mate:true});
}
// О чём можно поговорить сегодня: тема отпадает, когда говорить не о чем.
/* КАЖДАЯ ТЕМА — РАЗ В ДЕНЬ (его скрин в Notion 7.10: «одинаковые сообщения просто с тимейтом и можно спамить»):
   «Как сам?» жалось без конца, ответ повторялся, а каждое нажатие в тот же день добавляло терпения. Теперь тема,
   о которой сегодня уже говорили, пропадает до завтра; настрой — только от первого разговора за день. */
function ccMateTalkedToday(rec){
  const d=rec && rec.talkDay;
  return (d && d.day===careerToday()) ? (d.topics||[]) : [];
}
/* Последний вечер, сыгранный ВМЕСТЕ с этим напарником (строка журнала знает, с кем: r.mate / r.mates). Вечер до него —
   не его вечер: разбирать с ним нечего. */
function ccMateLastWith(mate){
  const last=((CAREER.career||{}).log||[]).slice(-1)[0];
  if(!last || !mate) return null;
  const k=hKey(mate.handle||mate);
  const with_=(last.mate && hKey(last.mate)===k) || (Array.isArray(last.mates) && last.mates.some(h=>hKey(h)===k));
  return with_ ? last : null;
}
function careerMateTopics(){
  const mate=careerPartnerCard(); if(!mate) return [];
  const cr=CAREER.career;
  const last=ccMateLastWith(mate);
  const done=ccMateTalkedToday(careerMateRec());
  const extra=[];
  // Разбор — после плохого вечера, один раз на этот вечер.
  if(last && ccMateBadNight(last) && (careerMateRec()||{}).revDay!==last.day) extra.push('review');
  // План — в день, когда есть что играть, один раз.
  if(ccMateHasNightToday() && !(cr.matePlan && cr.matePlan.day===careerToday())) extra.push('plan');
  return extra.concat(CC_MATE_TOPICS.filter(k=>{
    if(done.indexOf(k)>=0) return false;
    if(k==='night') return !!last;
    if(k==='spot')  return !!careerSpotOn();
    if(k==='rival') return !!ccMateRival();
    return true;
  }));
}
/* ТРИ НОВЫХ РАЗГОВОРА С ТИММЕЙТОМ (его «делай» 7.10 на список «что ещё добавить»). Числа — оценка режима.
   1) РАЗБОР ПЛОХОГО ВЕЧЕРА — каким тоном: поддержать / разобрать ошибки / наехать. Отклик зависит от характера
      («голос» ccVoiceOf: 1 сдержанный, 2 тёплый, 3 дерзкий, 4 сухой): тёплому нужна поддержка, сухому — разбор,
      наезд не любит никто, дерзкий — меньше всех.
   2) ПЛАН НА ВЕЧЕР — «агрессивно» (W-key) или «от зоны» (спокойно). Играешь вечер тем стилем, о котором
      договорились, — плюс к настрою; другим — минус (careerMatePlanAfter после вечера).
   3) ЧЕСТНО О ПЕРЕМАНИВАНИИ — если его зовут, а настроя чуть не хватает, он сначала говорит тебе. «Останься,
      договоримся» поднимает настрой и держит его; «решай сам» — уходит (см. careerMatePoach). */
const CC_REV_TONE={support:{0:5,1:4,2:8,3:2,4:3}, analyze:{0:5,1:6,2:3,3:-2,4:7}, blame:{0:-6,1:-4,2:-8,3:-10,4:-3}};
const CC_PLAN_KEPT=4, CC_PLAN_BROKEN=-4, CC_HEADSUP_BAND=15, CC_HEADSUP_KEEP=12;
function ccMateBadNight(r){ return !!r && !r.passed && r.of>1 && r.place>r.of*0.5; }
function ccMateHasNightToday(){
  try{ return (careerEvents().get(careerToday())||[]).some(e=>e && e.kind && e.kind!=='nations'); }catch(e){ return false; }
}
function careerMateReview(tone){
  const rec=careerMateRec(), t=careerMateThread(), cr=CAREER.career; if(!rec || !t || !CC_REV_TONE[tone]) return;
  const last=ccMateLastWith(careerPartnerCard()); if(!last || rec.revDay===last.day) return;
  rec.revDay=last.day; t.revAsk=false;
  const mate=careerPartnerCard(), v=mate ? ccVoiceOf(mate.handle) : 0;
  const by=CC_REV_TONE[tone][v]!=null ? CC_REV_TONE[tone][v] : CC_REV_TONE[tone][0];
  careerDmPush(t, 'you', 'dmRevYou_'+tone, [last.place, last.of]);
  careerDmPush(t, 'them', by>=5 ? 'dmRevGood' : by>0 ? 'dmRevOk' : 'dmRevBad', [last.place, last.of]);
  careerMateRecords().forEach(pr=>{ pr.patience=clamp((pr.patience||0)+by, 0, 100); });
  careerSave(); careerRenderHub('social');
}
function careerMatePlanSet(style){
  const t=careerMateThread(), cr=CAREER.career; if(!t || (style!=='aggr' && style!=='zone')) return;
  cr.matePlan={day:careerToday(), style, done:false}; t.planAsk=false;
  careerDmPush(t, 'you', 'dmPlanYou_'+style);
  careerDmPush(t, 'them', 'dmPlanOk_'+style);
  careerSave(); careerRenderHub('social');
}
// После вечера: сыграли тем стилем, о котором договорились?
function careerMatePlanAfter(){
  const cr=CAREER.career, p=cr && cr.matePlan; if(!p || p.done || p.day!==careerToday()) return;
  const t=careerMateThread(); if(!t) return;
  p.done=true;
  const st=(typeof ccPlayStyle==='function') ? ccPlayStyle() : 'norm';
  const kept=(p.style==='aggr' && st==='key') || (p.style==='zone' && st==='chill');
  careerMateRecords().forEach(pr=>{ pr.patience=clamp((pr.patience||0)+(kept ? CC_PLAN_KEPT : CC_PLAN_BROKEN), 0, 100); });
  careerDmPush(t, 'them', kept ? 'dmPlanKept' : 'dmPlanBroken');
}
function careerMateHeadsUp(stay){
  const t=careerMateThread(); if(!t || t.state!=='headsup') return;
  const mate=careerPartnerCard(); if(!mate){ t.state='open'; return; }
  if(stay){
    careerDmPush(t, 'you', 'dmHeadsUpStayYou');
    careerMateRecords().forEach(pr=>{ pr.patience=clamp((pr.patience||0)+CC_HEADSUP_KEEP, 0, 100); });
    careerDmPush(t, 'them', 'dmHeadsUpStays');
    t.state='open';
  } else {
    careerDmPush(t, 'you', 'dmHeadsUpGoYou');
    careerDmPush(t, 'them', 'dmMatePoachGo', [t.headsPlace||0]);
    careerMateDrop(mate.handle);
    t.state='declined'; t.left=careerToday();
    careerNews('bad', 'ccNewsMateLeftFor', [mate.handle]);
    careerEvent('tlDuoPoached', [mate.handle]);
  }
  careerSave(); careerRenderHub('social');
}
function careerMateTalk(kind){
  const mate=careerPartnerCard(); if(!mate) return false;
  if(kind==='review' || kind==='plan'){
    const t0=careerMateThread(); if(!t0) return false;
    if(kind==='review') t0.revAsk=true; else t0.planAsk=true;
    careerSave(); careerRenderHub('social'); return true;
  }
  const rec=careerMateRec(); if(!rec) return false;
  const cr=CAREER.career, t=careerMateThread(); if(!t) return false;
  if(ccMateTalkedToday(rec).indexOf(kind)>=0) return false;
  const firstToday=!ccMateTalkedToday(rec).length;
  rec.talkDay={day:careerToday(), topics:ccMateTalkedToday(rec).concat([kind])};
  const last=ccMateLastWith(mate);
  const args={
    night: last ? [last.place, last.of] : [0, 0],
    spot:  [careerSpotOn() ? (careerSpotOn().i+1) : 0, careerSpotOn() ? (careerSpotOn().aura||0) : 0],
    role:  [L()[(attrsFor(mate)||{}).roleKey]||'', L()[(CAREER.player.attrs&&CAREER.player.role)||CAREER.player.role]||''],
    rival: (r=>r ? [r.name, r.place, r.mine] : ['', 0, 0])(kind==='rival' ? ccMateRival() : null),
    life:  []
  }[kind]||[];
  careerDmPush(t, 'you', 'dmMeTalk'+kind, args);
  const alt=ccMateReplyAlt(kind, args, rec);
  if(alt) careerDmPush(t, 'them', 'dmMateSay', alt); else careerDmPush(t, 'them', 'dmMateTalk'+kind, args);
  /* Настрой — тем же правилом, что и день «поговорить»: разговор подряд
     стоит вдвое и вчетверо меньше. Разница в том, что этот не берёт день. */
  const by=firstToday ? careerTalkMove(rec, careerToday()) : 0;
  if(by){
    careerMateRecords().forEach(pr=>{ pr.patience=clamp((pr.patience||0)+by, 0, 100); });
    rec.talked=careerToday();
  }
  t.unread=false;
  careerSave();
  careerRenderHub('social');
  return true;
}
/* Ответ напарника от обстановки, а не одна строка на тему: вечер хороший, средний или плохой, есть ли точка и аура,
   какой у него настрой. Строка выбирается днём, чтобы перерисовка её не меняла. Нет набора в языке: английский. */
const CC_MATE_V={
  ru:{night_none:['Пока разбирать нечего, ещё не играли вместе. Вечером посмотрим','Сначала сыграем, потом разберём. Я готов'],
      night_good:['Вот это вечер. Держим так же, ничего не меняем','Видел? Мы в зону заходили первыми. Повторим','Хороший вечер. Только в конце жадничали, можно было больше'],
      night_mid:['Средне. Две игры отдали на ровном месте','Не плохо, не хорошо. В середине вечера просели, надо держать концентрацию'],
      night_bad:['Плохо, честно. Я тоже накосячил, извини','Пересмотрел. Дропали слишком жадно, давай спокойнее','Забудем. Один вечер ничего не решает, завтра заново'],
      spot_none:['Своей точки у нас нет. Может, возьмём? Без неё каждый вечер лотерея','Каждый раз падаем куда придётся. Давай закрепимся'],
      spot_weak:['Точка норм, но нас там ещё не боятся. Надо постоять','Лут есть, но соседи лезут. Пару вечеров и отстанут'],
      spot_strong:['Наша точка, все знают. Никто не лезет','Там нам спокойно. Лут ровный, выходим полными'],
      role:['Норм. Ты зовёшь ротации, я беру первый контакт','Меня устраивает. Только зови раньше, я не всегда вижу зону','Давай так. Если что, поменяемся, мне не принципиально'],
      life_up:['Отлично. Настрой боевой, жду вечера','Всё хорошо. Потренил утром, руки тёплые','Норм, даже кайфую. Давно так не хотелось играть'],
      life_down:['Честно, так себе. Устал немного','Не очень. Последние вечера выбили, но я соберусь','Средне. Давай сегодня без лишнего давления']},
  en:{night_none:['Nothing to review yet, we have not played together. Tonight we will see','Play first, review after. I am ready'],
      night_good:['What a night. Keep it exactly like this','Saw that? We were first into every zone. Again','Good night. We got greedy at the end though, could have been more'],
      night_mid:['Average. We threw two games for nothing','Not bad, not good. We dipped mid evening, need to stay focused'],
      night_bad:['Bad, honestly. I messed up too, sorry','Rewatched it. We dropped too greedy, let us play calmer','Forget it. One night decides nothing, fresh start tomorrow'],
      spot_none:['We have no spot of our own. Shall we take one? Without it every night is a lottery','We land wherever every time. Let us settle somewhere'],
      spot_weak:['Spot is fine, but nobody fears us there yet. We need to hold it','There is loot, but the neighbours keep coming. A couple of nights and they stop'],
      spot_strong:['Our spot, everyone knows it. Nobody contests','We are calm there. Steady loot, we leave full'],
      role:['Fine. You call rotations, I take first contact','Works for me. Just call earlier, I do not always see the zone','Let us do it. We can swap if needed, I do not mind'],
      life_up:['Great. In the mood, can not wait for tonight','All good. Warmed up this morning, hands are ready','Fine, enjoying it even. Have not wanted to play this much in a while'],
      life_down:['Honestly, meh. A bit tired','Not great. The last nights got to me, but I will pull it together','So so. Let us keep the pressure low today']},
  fr:{night_none:['Rien à analyser, on n’a pas encore joué ensemble. Ce soir on verra','On joue d’abord, on analyse après. Je suis prêt'],
      night_good:['Quelle soirée. On garde exactement ça','T’as vu ? On rentrait premiers dans chaque zone. On remet ça','Bonne soirée. Un peu gourmands à la fin quand même, on pouvait faire plus'],
      night_mid:['Moyen. On a lâché deux games pour rien','Ni bien ni mal. On a baissé en milieu de soirée, faut rester concentrés'],
      night_bad:['Mauvais, honnêtement. J’ai raté aussi, désolé','J’ai revu. On a drop trop gourmand, jouons plus calme','On oublie. Une soirée ne décide rien, demain on repart'],
      spot_none:['On n’a pas de spot à nous. On en prend un ? Sans ça chaque soirée est une loterie','On atterrit n’importe où à chaque fois. Posons nous quelque part'],
      spot_weak:['Le spot est correct, mais personne ne nous craint encore. Faut tenir','Il y a du loot, mais les voisins viennent. Deux soirées et ils arrêtent'],
      spot_strong:['Notre spot, tout le monde le sait. Personne ne conteste','On est tranquilles là bas. Loot stable, on sort full'],
      role:['Ça va. Tu appelles les rotations, je prends le premier contact','Ça me va. Appelle juste plus tôt, je ne vois pas toujours la zone','Faisons comme ça. On peut échanger si besoin, ça m’est égal'],
      life_up:['Top. Motivé, j’attends ce soir','Tout va bien. Échauffé ce matin, les mains sont prêtes','Ça va, je kiffe même. Ça faisait longtemps que je n’avais pas autant envie de jouer'],
      life_down:['Franchement, bof. Un peu fatigué','Pas terrible. Les dernières soirées m’ont touché, mais je vais me reprendre','Moyen. Allons y sans trop de pression aujourd’hui']},
  it:{night_none:['Ancora niente da rivedere, non abbiamo giocato insieme. Stasera vediamo','Prima giochiamo, poi analizziamo. Sono pronto'],
      night_good:['Che serata. Teniamola così','Visto? Entravamo primi in ogni zona. Di nuovo','Bella serata. Un po’ ingordi alla fine però, si poteva fare di più'],
      night_mid:['Nella media. Abbiamo buttato due partite per niente','Né bene né male. Calati a metà serata, serve concentrazione'],
      night_bad:['Male, onestamente. Ho sbagliato anche io, scusa','Rivista. Drop troppo ingordo, giochiamo più calmi','Dimentichiamola. Una serata non decide niente, domani si riparte'],
      spot_none:['Non abbiamo un posto nostro. Ne prendiamo uno? Senza ogni serata è una lotteria','Atterriamo ovunque ogni volta. Fermiamoci da qualche parte'],
      spot_weak:['Il posto va bene, ma lì nessuno ci teme ancora. Bisogna tenerlo','Il loot c’è, ma i vicini arrivano. Un paio di serate e smettono'],
      spot_strong:['È il nostro posto, lo sanno tutti. Nessuno contesta','Lì siamo tranquilli. Loot stabile, usciamo pieni'],
      role:['Va bene. Tu chiami le rotazioni, io prendo il primo contatto','Per me va bene. Chiama solo prima, non sempre vedo la zona','Facciamo così. Se serve ci scambiamo, per me è uguale'],
      life_up:['Benissimo. Carico, aspetto stasera','Tutto bene. Riscaldato stamattina, le mani sono pronte','Bene, anzi mi diverto. Non avevo così voglia di giocare da tempo'],
      life_down:['Sinceramente, così così. Un po’ stanco','Non benissimo. Le ultime serate mi hanno pesato, ma mi riprendo','Insomma. Oggi niente pressione extra']},
  pt:{night_none:['Ainda nada para rever, não jogamos juntos. À noite a gente vê','Primeiro joga, depois analisa. Tô pronto'],
      night_good:['Que noite. Mantém assim','Viu? A gente entrava primeiro em toda zona. De novo','Boa noite. Mas ficamos gananciosos no fim, dava pra mais'],
      night_mid:['Mediano. Entregamos duas partidas à toa','Nem bom nem ruim. Caímos no meio da noite, precisa de foco'],
      night_bad:['Ruim, sinceramente. Eu errei também, foi mal','Revi. Drop ganancioso demais, vamos jogar mais calmos','Esquece. Uma noite não decide nada, amanhã de novo'],
      spot_none:['Não temos um ponto nosso. Vamos pegar um? Sem isso toda noite é loteria','Toda vez caímos em qualquer lugar. Vamos fixar um ponto'],
      spot_weak:['O ponto é bom, mas ninguém tem medo da gente lá ainda. Precisa segurar','Tem loot, mas os vizinhos aparecem. Umas duas noites e eles param'],
      spot_strong:['Nosso ponto, todo mundo sabe. Ninguém disputa','Lá é tranquilo. Loot estável, saímos cheios'],
      role:['Beleza. Você chama as rotações, eu pego o primeiro contato','Por mim tudo bem. Só chama antes, nem sempre vejo a zona','Vamos assim. Se precisar a gente troca, tanto faz'],
      life_up:['Ótimo. No clima, esperando a noite','Tudo certo. Aqueci de manhã, mãos prontas','De boa, curtindo até. Fazia tempo que não tinha tanta vontade de jogar'],
      life_down:['Sinceramente, mais ou menos. Meio cansado','Não muito bem. As últimas noites pesaram, mas vou me recuperar','Mais ou menos. Hoje sem pressão extra']}
};
function ccMateReplyAlt(kind, args, rec){
  const set=CC_MATE_V[(typeof LANG!=='undefined' && LANG) || 'en'] || CC_MATE_V.en;
  let k=null;
  if(kind==='night'){ const p=args[0]||0, of=args[1]||0;
    k=!p ? 'night_none' : (p<=Math.max(5, of*0.1) ? 'night_good' : p<=of*0.5 ? 'night_mid' : 'night_bad'); }
  else if(kind==='spot') k=!args[0] ? 'spot_none' : (args[1]||0)>=50 ? 'spot_strong' : 'spot_weak';
  else if(kind==='role') k='role';
  else if(kind==='life') k=((rec && rec.patience!=null ? rec.patience : 60)>=50 && careerEnergy()>=40) ? 'life_up' : 'life_down';
  const list=k && set[k];
  if(!list || !list.length) return null;
  return [k, Math.abs(ccHashStr('mate|'+kind+'|'+careerToday()))%list.length];
}
function careerMateOpen(){
  const t=careerMateThread(); if(!t) return;
  CH_SOCIAL='dms';
  careerDmOpen(t.id);
}

/* Стримы: вкладка и эфиры. Расчёт прежний (зрители от аудитории, донаты, спонсор, баннер), но у эфира есть вид:
     вид        энергия  охват  деньги  подписчики  цена
     ранкед       30      1.0    1.0     1.0       база
     общение      30      0.6    1.6     0.8       растёшь медленнее
     коллаб       40      1.0    1.0     1.0       + аудитория креатора
     марафон      55      1.8    1.8     1.8       день и перегруз
   Коллаб считается как у Про-Ама (ccProAmReachFrom), так что креаторы Про-Ама работают весь год. Марафон добавляет перегруз (cr.grind). */
/* hours — сколько часов идёт эфир. Нужно партнёрской программе, которая
   считает наработанные часы за месяц; марафон в своём же тексте обещает
   «вдвое дольше», отсюда восемь против четырёх. */
const CC_STREAM_KINDS=[
  {id:'grind', energy:30, reach:1,   cash:1,   subs:1,   grind:0, hours:4},
  {id:'chat',  energy:30, reach:0.6, cash:1.6, subs:0.8, grind:0, hours:4},
  {id:'colab', energy:40, reach:1,   cash:1,   subs:1,   grind:0, mate:true, hours:4},
  {id:'long',  energy:55, reach:1.8, cash:1.8, subs:1.8, grind:2, hours:8},
  // Тренировка в эфире: половина дня тренировки (train — доля прироста trPit), зрителей и денег меньше, чем у ранкеда.
  {id:'train', energy:45, reach:0.6, cash:0.6, subs:0.6, grind:1, hours:4, train:0.5}
];
/* Эфир с турнира: вид вечера, а не дня. Включается на панели дня рядом с «Играть», вечер
   симулируется как обычно, поверх идёт трансляция (careerPlayLive, ccTv*).
   Цена: своя команда слабее на CC_STREAM_POW (10, больше формы ±3 и химии +5 вместе).
   Энергия 20 против 30 у обычного эфира, перегруз выше, охват 0.7 (место уже платит охватом),
   подписчики и донаты ×1.3 / ×1.1, после вечера бонус за результат (ccStreamCupAfter). */
const CC_STREAM_CUP={id:'cup', energy:20, reach:0.7, cash:1.1, subs:1.3, grind:1, hours:4};
/* ШЕСТОЙ ВИД — СТРИМ ЧУЖОГО ФИНАЛА (отзыв: «стрим чужого финала»). День, когда
   финал есть, а тебя в нём нет (не квалился в финал недели, Мейджор, Саммит, Глобалы, Париж):
   вместо «сесть постримить ранкед» — эфир-просмотр с комментарием. Большой день сцены — большой
   охват (1.5), чат и зрители смотрят таблицу финала, которая считается тут же (ccWatchBoard: поле
   первого дивизиона по тем же правилам, что играет кубки, по игре на каждые несколько тиков).
   На экране — канал хозяина эфира (самый смотримый живой канал дня), и на нём работают Follow и
   Subscribe (см. ccTwFollowToggle/ccTwSubToggle). Итог финала в мир не пишется: у сцены свои итоги.
   Силе неоткуда падать — ты не играешь. */
const CC_STREAM_WATCH={id:'watch', energy:30, reach:1.5, cash:1.2, subs:1.2, grind:0, hours:5, watch:true};
const CC_WATCH_KINDS=['final','major','summit','globals','gc','rc','solo','eval'];
const CC_WATCH_GAMES=12, CC_WATCH_TEAMS=50;
function ccStreamWatchEvent(){
  const cr=CAREER && CAREER.career; if(!cr || cr.seasonOver) return null;
  const next=(typeof careerNext==='function') ? careerNext() : null;
  if(!next || next.day!==careerToday() || CC_WATCH_KINDS.indexOf(next.type)<0) return null;
  if(careerCanPlay(next)) return null;   // свой финал играют, а не смотрят
  return next;
}
let CC_STREAM_WATCH_EV=null;
function ccStreamKind(id){
  if(id===CC_STREAM_CUP.id) return CC_STREAM_CUP;
  if(id===CC_STREAM_WATCH.id) return CC_STREAM_WATCH;
  return CC_STREAM_KINDS.find(k=>k.id===id) || CC_STREAM_KINDS[0];
}
/* КНОПКИ FOLLOW И SUBSCRIBE РАБОТАЮТ — на чужих каналах (отзыв). Отслеживание
   бесплатно: канал стоит первым в списке слева, а рейд вероятнее приходит от того, на кого ты
   подписан (ccStreamHappenings). Подписка — CC_TW_SUB_PRICE в месяц (списывается на стыке месяца,
   careerTwSubsTick; денег нет — подписка слетает): стример, которому ты платишь, чаще заглядывает
   в твой чат и дарит сабы («про в чате», там же). Свой канал не отслеживают — на своём эти кнопки
   для зрителей, как и на Twitch. */
const CC_TW_SUB_PRICE=4.99;
function ccTwFollowList(){ const cr=CAREER && CAREER.career; if(!cr) return []; return (cr.twFollow=cr.twFollow||[]); }
function ccTwFollowing(name){ const k=hKey(name); return ccTwFollowList().some(x=>hKey(x)===k); }
function ccTwFollowToggle(name){
  const list=ccTwFollowList(), k=hKey(name);
  const i=list.findIndex(x=>hKey(x)===k);
  if(i>=0) list.splice(i, 1); else list.push(String(name));
  careerSave(); ccTwButtonsRedraw(); return i<0;
}
function ccTwSubs(){ const cr=CAREER && CAREER.career; if(!cr) return {}; return (cr.twSubs=cr.twSubs||{}); }
function ccTwSubbed(name){ return !!ccTwSubs()[hKey(name)]; }
function ccTwSubToggle(name){
  const cr=CAREER && CAREER.career; if(!cr) return false;
  const subs=ccTwSubs(), k=hKey(name);
  if(subs[k]){ delete subs[k]; careerSave(); ccTwButtonsRedraw(); return false; }
  if((cr.balance||0)<CC_TW_SUB_PRICE) return false;
  cr.balance=Math.round(((cr.balance||0)-CC_TW_SUB_PRICE)*100)/100;
  subs[k]={name:String(name), since:careerToday(), price:CC_TW_SUB_PRICE};
  careerNews('flat', 'ccNewsTwSubbed', [String(name), CC_TW_SUB_PRICE]);
  careerSave(); ccTwButtonsRedraw(); return true;
}
function ccTwSubsMonthly(){ const subs=ccTwSubs(); return Math.round(Object.keys(subs).reduce((a,k)=>a+(subs[k].price||CC_TW_SUB_PRICE), 0)*100)/100; }
// Стык месяца: подписки продлеваются, на что денег нет — слетает.
function careerTwSubsTick(){
  const cr=CAREER && CAREER.career; if(!cr) return;
  const now=ccMonthKey(careerToday());
  if(!cr.twSubsMonth){ cr.twSubsMonth=now; return; }
  if(cr.twSubsMonth===now) return;
  cr.twSubsMonth=now;
  const subs=ccTwSubs();
  Object.keys(subs).forEach(k=>{ const p=subs[k].price||CC_TW_SUB_PRICE; if((cr.balance||0)>=p) cr.balance=Math.round(((cr.balance||0)-p)*100)/100; else delete subs[k]; });
}
// Живые каналы дня, на которые подписан / которым платишь — по ним считаются шансы рейда и «про в чате».
function ccTwFollowLive(){ try{ return (careerLiveNow(12)||[]).filter(s=>s && s.v>0 && ccTwFollowing(s.name)); }catch(e){ return []; } }
function ccTwSubLive(){ try{ return (careerLiveNow(12)||[]).filter(s=>s && ccTwSubbed(s.name)); }catch(e){ return []; } }
function ccTwFollowBtnHTML(name, creator, cls){
  const T=L(), fol=ccTwFollowing(name), sub=ccTwSubbed(name);
  const q=String(name).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
  return '<span class="'+(cls||'tv-fb')+'">'+
    '<button type="button" class="tv-fb-f'+(fol?' on':'')+'" title="'+esc(fol ? T.ccTwFollowOn : T.ccTvFollow)+'" onclick="event.stopPropagation();ccTwFollowToggle(\''+esc(q)+'\')">♥</button>'+
    (creator ? '<button type="button" class="tv-fb-s'+(sub?' on':'')+'" title="'+esc(sub ? T.ccTwSubOn : T.ccTwSubPrice(CC_TW_SUB_PRICE))+'" onclick="event.stopPropagation();ccTwSubToggle(\''+esc(q)+'\')">★</button>' : '')+
    '</span>';
}
function ccTwButtonsRedraw(){
  try{ if(document.getElementById('chBody') && CH_TAB==='streams') careerRenderHub('streams'); }catch(e){}
  try{ if(typeof ccTvHostRedraw==='function') ccTvHostRedraw(); }catch(e){}
}
/* КОД ПОДДЕРЖКИ АВТОРА (отзыв: «код поддержки: био, и на стриме»). Настоящая
   механика: с тысячи фолловеров (или партнёрки) у канала есть код, он стоит в био и на эфире
   (#ad), и приносит деньги независимо от эфиров — раз в месяц, по аудитории (CC_SAC.perFol на
   фолловера), плюс за каждый эфир по онлайну (perView на зрителя в час). Числа — наша мерка:
   Epic платит 5 % с покупок, а сколько покупают по коду — никто не публикует. */
const CC_SAC={fol:1000, perFol:0.03, perView:0.02};
function ccSacOn(){ const cr=CAREER && CAREER.career; return !!cr && ((cr.twitch||0)>=CC_SAC.fol || ccTwStatus()==='part'); }
function ccSacCode(){ const n=String((CAREER && CAREER.player && CAREER.player.nick)||'').toUpperCase().replace(/[^A-Z0-9]/g,''); return n.slice(0,16) || 'FNCS'; }
function ccSacStream(avg, hours){ return ccSacOn() ? Math.max(0, Math.round((avg||0)*(hours||4)*CC_SAC.perView)) : 0; }
function careerSacTick(){
  const cr=CAREER && CAREER.career; if(!cr) return 0;
  const now=ccMonthKey(careerToday());
  if(!ccSacOn()){ cr.sacMonth=now; return 0; }
  if(!cr.sacMonth){ cr.sacMonth=now; return 0; }
  if(cr.sacMonth===now) return 0;
  cr.sacMonth=now;
  const pay=Math.round((cr.twitch||0)*CC_SAC.perFol);
  if(pay>0){ cr.balance=(cr.balance||0)+pay; cr.sac=(cr.sac||0)+pay; careerNews('good', 'ccNewsSacPay', [ccSacCode(), ccNum(pay)]); }
  return pay;
}
/* Таблица чужого финала: поле первого дивизиона (careerCupField от лица Д1), по игре на каждые
   несколько тиков, очки — как в финале (pointsForPlace + элимы). Хозяин эфира — самый смотримый
   живой канал дня; из своих отслеживаемых — первым. */
function ccWatchBoard(ev){
  const cr=CAREER.career;
  const size=ccTeams(CC_WATCH_TEAMS);
  let teams=[];
  try{ teams=careerCupField(Object.assign({}, cr, {division:1}), [], size, 'watch|'+careerToday(), false, (typeof CC_FIELD_SHARP!=='undefined' && CC_FIELD_SHARP.lan)||undefined); }catch(e){ teams=[]; }
  teams=(teams||[]).slice(0, size);
  teams.forEach((t,i)=>{ t.stagePts=0; t.stageElims=0; t.stageLog=[]; t.gotVR=false; t.wins=0; t._uid=i; });
  let live=[]; try{ live=careerLiveNow(12).filter(x=>x && x.v>0); }catch(e){ live=[]; }
  live.sort((a,b)=>(ccTwFollowing(b.name)?1:0)-(ccTwFollowing(a.name)?1:0) || b.v-a.v);
  const host=live[0] || null;
  return {ev:ev, teams:teams, games:CC_WATCH_GAMES, n:0, host:host, log:[]};
}
function ccWatchStep(plain){
  const w=plain.watch; if(!w || !w.teams.length || w.n>=w.games) return;
  // На последнем тике доигрывается всё: конец эфира не должен оставить финал без последней игры.
  const due=(plain.at>=plain.ticks) ? w.games : Math.floor(plain.at/Math.max(1, plain.ticks/w.games));
  while(w.n<Math.min(w.games, due)){
    let order=[]; try{ order=simulateGame(w.teams); }catch(e){ order=w.teams.slice(); }
    order.forEach((t,i)=>{ const p=i+1, e=t._elims||0; t.stagePts+=(typeof pointsForPlace==='function' ? pointsForPlace(p) : Math.max(0, 60-p*3))+e*2; t.stageElims+=e; if(p===1){ t.wins++; t.gotVR=true; } });
    w.n++; w.log.push(order[0] ? String(order[0].name||'').replace(/<[^>]*>/g,'') : '');
    // Следующий момент ролика — по счёту игр.
    try{ ccTvClipJump(Math.floor(w.n/Math.max(1, w.games/CC_TV_WATCH_CLIP.moments))); }catch(e){}
    const T=L(), win=w.log[w.log.length-1];
    CC_TV_HYPE+=0.6; CC_TV_BURST=2;
    ccTvSay(T.ccTvChatWatchWin||T.ccTvChatWin); if(win) ccTvSayText(win.slice(0,18)+' W');
    if(w.n===w.games) for(let k=0;k<4;k++) ccTvSay(T.ccTvChatWin);
  }
}
function ccWatchBoardHTML(plain){
  const w=plain.watch; if(!w) return '';
  const bare=x=>String(x||'').replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim();
  const top=careerRankField(w.teams).slice(0, 5);
  return top.map((t,i)=>'<div class="cc-tvm-row"><i>'+(i+1)+'</i><b>'+esc(bare(t.name).slice(0,22))+'</b><em>'+ccNum(t.stagePts||0)+'</em></div>').join('');
}
function ccWatchPipsHTML(plain){
  const w=plain.watch; if(!w) return '';
  return w.log.map(n=>'<i class="w" title="'+esc(n)+'"></i>').join('')+Array(Math.max(0, w.games-w.n)).fill('<i class="n"></i>').join('');
}
// Вид сегодняшнего эфира читает сам расчёт в careerDoAct — см. act.reach.
let CC_STREAM_KIND='grind';
/* С кем сегодня можно стримить вдвоём. Берётся из того же пула креаторов, что
   и Про-Ам, и меняется каждый день: сегодня свободен один, завтра другой —
   так это и работает, коллаб назначают, а не выбирают из всех сразу. */
/* КОЛЛАБ ПО ПРЕДЛОЖЕНИЮ (5.10, Notion «05», испанский игрок: «ampliación en la parte de
   Content creator y cosas como colaboraciones con otros influencers»). Раньше напарника эфира
   назначал день; теперь можно самому предложить креатору из списка. Он соглашается тем охотнее,
   чем твоя аудитория ближе к его (CC_COLAB_ASK, доля охвата к его фолловерам на Twitch), спросить
   можно раз в день. Согласие — договор на CC_COLAB_DAYS дней: кнопка «Коллаб» берёт его, а не
   креатора дня. Каждый следующий коллаб с тем же креатором приносит меньше (CC_COLAB_REPEAT —
   его чат тебя уже видел), а ему уходит своя доля твоей аудитории (CC_COLAB_GIVE, с потолком). */
const CC_COLAB_ASK={base:0.15, per:6, lo:0.05, hi:0.9};
// Доля, что уходит креатору, — зеркало прихода к тебе (CC_PROAM_REACH_SHARE / _CAP): та же
// тысячная аудитории и тот же потолок, только от твоей.
const CC_COLAB_DAYS=7, CC_COLAB_REPEAT=0.5, CC_COLAB_GIVE={share:0.001, cap:8000};
function ccColabDeal(){
  const cr=CAREER && CAREER.career, d=cr && cr.colabWith;
  return (d && d.name && d.until && careerToday()<=d.until) ? d : null;
}
function ccColabTimes(name){ const cr=CAREER && CAREER.career; return (cr && cr.colabN && cr.colabN[hKey(name)]) || 0; }
function ccColabOdds(name){
  const fol=(typeof ccProAmFollowers==='function') ? ccProAmFollowers(name) : 0;
  const ratio=fol>0 ? careerReach()/fol : 1;
  return Math.max(CC_COLAB_ASK.lo, Math.min(CC_COLAB_ASK.hi, CC_COLAB_ASK.base+CC_COLAB_ASK.per*ratio));
}
// Сколько приходит от коллаба с ним сейчас: его доля аудитории, урезанная повторами.
function ccColabFrom(name){
  const base=(typeof ccProAmReachFrom==='function') ? ccProAmReachFrom(name) : 0;
  return Math.round(base/(1+CC_COLAB_REPEAT*ccColabTimes(name)));
}
function ccColabGive(){ return Math.min(CC_COLAB_GIVE.cap, Math.round(careerReach()*CC_COLAB_GIVE.share)); }
function careerColabAsk(name){
  const cr=CAREER && CAREER.career; if(!cr || !name) return false;
  if(cr.colabAskDay===careerToday() || ccColabDeal()) return false;
  if((typeof ccProAmCreators==='function' ? ccProAmCreators() : []).indexOf(name)<0) return false;
  cr.colabAskDay=careerToday();
  const rnd=careerRng(ccHashStr('colabask|'+careerToday()+'|'+name+'|'+(CAREER.player.nick||'')));
  const yes=rnd()<ccColabOdds(name);
  if(yes){ cr.colabWith={name:name, until:ccAddDays(careerToday(), CC_COLAB_DAYS)};
           careerNews('good', 'ccNewsColabYes', [ccHandle(name)]); }
  else careerNews('flat', 'ccNewsColabNo', [ccHandle(name)]);
  try{ careerSave(); }catch(e){}
  try{ careerRenderHub('streams'); }catch(e){}
  return yes;
}
function ccColabPanelHTML(){
  const cr=CAREER && CAREER.career; if(!cr) return '';
  const list=(typeof ccProAmCreators==='function') ? ccProAmCreators().slice(0, 8) : [];
  if(!list.length) return '';
  const T=L(), deal=ccColabDeal(), asked=cr.colabAskDay===careerToday();
  return `<div class="tv-colab"><div class="tw-h">${esc(T.ccColabTitle)}</div>
    <div class="tv-colab-hint">${esc(T.ccColabHint)}</div>${list.map(n=>{
      const ava=(typeof ccProAmAvatar==='function') ? ccProAmAvatar(n) : null, times=ccColabTimes(n);
      const mine=deal && deal.name===n;
      const act = mine ? `<span class="tv-colab-deal">${esc(T.ccColabDeal(ccDayLabel(deal.until)))}</span>`
        : (deal || asked) ? `<button class="tv-colab-go" disabled>${esc(asked && !deal ? T.ccColabAsked : T.ccColabAsk)}</button>`
        : `<button class="tv-colab-go" onclick="careerColabAsk('${jsq(n)}')">${esc(T.ccColabAsk)}</button>`;
      return `<div class="tv-colab-row"><span class="tv-av">${ava?`<img src="${ava}" alt="" loading="lazy" onerror="this.remove()">`:esc(n.slice(0,2).toUpperCase())}</span>
        <div class="tv-colab-in"><b>@${esc(ccHandle(n))}</b><em>${ccFollowers(ccProAmFollowers(n))} Twitch · ${esc(T.ccColabOdds(Math.round(ccColabOdds(n)*100)))}${times?' · '+esc(T.ccColabTimes(times)):''}</em></div>
        ${act}</div>`; }).join('')}</div>`;
}
function ccStreamMate(){
  const cr=CAREER && CAREER.career; if(!cr) return null;
  const deal=ccColabDeal();
  if(deal) return {name:deal.name, tw:(typeof ccProAmTwitch==='function' ? ccProAmTwitch(deal.name) : null), deal:true};
  const list=(typeof ccProAmCreators==='function') ? ccProAmCreators() : [];
  if(!list.length) return null;
  const rnd=careerRng(ccHashStr('colab|'+(cr.season||1)+'|'+careerToday()));
  const name=list[Math.floor(rnd()*list.length)];
  return {name:name, tw:(typeof ccProAmTwitch==='function' ? ccProAmTwitch(name) : null)};
}
function careerStreamGo(id){
  const k=ccStreamKind(id);
  if(careerDayClosed()) return false;
  if(k.watch){ CC_STREAM_WATCH_EV=ccStreamWatchEvent(); if(!CC_STREAM_WATCH_EV) return false; }
  if(careerEnergy()<k.energy) return false;
  // Пропуск, нажатый в прошлом вечере, держится до следующего раннера; эфир свободного дня он не касается.
  if(!CAREER_RUN && CC_SKIP_RUN){ skipAnimation=false; CC_SKIP_RUN=false; }
  CC_STREAM_KIND=k.id;
  const done=careerDoAct('stream');
  CC_STREAM_KIND='grind';
  if(!done) return false;
  // Энергию вида списал сам careerDoAct — доплачивать больше нечего.
  if(k.grind) CAREER.career.grind=(CAREER.career.grind||0)+k.grind;
  careerSave();
  // Сначала эфир, потом вкладка: плеер вкладки читает «идёт ли эфир» (CC_TV_PLAIN),
  // и нарисованный до запуска он остался бы выключенным на все пятнадцать секунд.
  ccStreamRun(k);
  careerRenderHub('streams');
  return true;
}
/* Обычный стрим в свободный день тоже идёт в рамке эфира (зрители, чат, события), как стрим с турнира, а не просто
   списывает день.
   Числа не пересчитываются: день уже посчитал фолловеров и донаты (streamLast), рамка только раздаёт их по ходу.
   Длина CC_TV_PLAIN_SECS_PER_HOUR секунд на игровой час: обычный эфир 10 с, восьмичасовой марафон 20.
   На последнем тике ccStreamRunEnd снимает рамку (ccTvClose, вместе с плеером) и ставит сводку (ccTvSummary). */
const CC_TV_PLAIN_SECS_PER_HOUR=2.5;
/* События за эфир, которые видно по числам:
     рейд       другой стример приводит чат, часть остаётся, фолловеры по числу пришедших
     клип       фолловеры приходят после эфира, отдельной строкой в сводке
     про        кто-то со сцены в чате, дарят сабы
     хейт-рейд  боты, модератор чистит, зрители проседают, деньги не трогает
   Редкие и сеются днём (ccHashStr('hap|день|вид')), чтобы эфир не менялся от перерисовки. Не больше двух за эфир, в сводке отдельными строками. */
const CC_TV_HAP={
  raid: {odds:0.30, grab:0.35, fol:0.05},   // доля чужих зрителей, что останется, и фолловеры с них
  clip: {odds:0.22, fol:0.6},               // фолловеров сверх дневных, долей от них
  pro:  {odds:0.25, subs:3},
  hate: {odds:0.15, dip:0.45}
};
let CC_TV_PLAIN=null;
function ccStreamRun(k){
  if(typeof document==='undefined' || !document.body) return false;
  if(typeof skipAnimation!=='undefined' && skipAnimation) return false;
  if(typeof CC_FF!=='undefined' && CC_FF) return false;
  const cr=CAREER && CAREER.career, last=cr && cr.streamLast;
  if(!last || last.day!==careerToday()) return false;
  // В режиме симуляции рамки нет, а рейд, клип и про в чате всё равно случаются: иначе их не было бы вовсе.
  if(careerSimOn()){ ccStreamQuiet(k, last); return false; }
  // Чужой финал смотрят дольше обычного эфира: моментов ролика на минуту (CC_TV_WATCH_SECS).
  const ticks=k.watch ? Math.max(8, Math.round(CC_TV_WATCH_SECS*1000/CC_TV_TICK))
                      : Math.max(8, Math.round((k.hours||4)*CC_TV_PLAIN_SECS_PER_HOUR*1000/CC_TV_TICK));
  CC_TV_PLAIN={id:k.id, at:0, done:0, hours:k.hours||4, ticks:ticks,
               want:{fol:(last.a && last.a[2])||0, cash:last.m||0},
               hap:ccStreamHappenings(k, ticks), got:[]};
  if(k.watch){
    const ev=CC_STREAM_WATCH_EV; CC_STREAM_WATCH_EV=null;
    CC_TV_PLAIN.watch=ccWatchBoard(ev);
    const lbl=L().ccStreamWatchOf((ev && (ev.label||ev.title))||'');
    if(last) last.label=lbl;
    ccTvOpen({label:lbl, host:CC_TV_PLAIN.watch.host});
    return true;
  }
  ccTvOpen({label:L()['ccStream_'+k.id]});
  return true;
}
/* Что случится за этот эфир и на какой минуте. Бросок посеян днём и видом: один и тот
   же вечер не пересобирается от перерисовки, а завтрашний другой. Не больше двух
   событий за эфир. */
function ccStreamHappenings(k, ticks){
  const cr=CAREER && CAREER.career;
  const rnd=careerRng(ccHashStr('hap|'+(cr?cr.day:'')+'|'+k.id));
  const out=[];
  // Отслеживаемые в эфире — рейд вероятнее; те, кому платишь, — чаще заглядывают в чат.
  const folLive=ccTwFollowLive().length>0, subLive=ccTwSubLive().length>0;
  Object.keys(CC_TV_HAP).forEach(id=>{
    if(out.length>=2) return;
    const mul=(k.hours>=8 ? 1.4 : 1)*(id==='raid' && folLive ? 1.5 : 1)*(id==='pro' && subLive ? 1.6 : 1);
    if(rnd()>=CC_TV_HAP[id].odds*mul) return;
    out.push({id:id, at:2+Math.floor(rnd()*Math.max(1, ticks-3))});
  });
  return out.sort((a,b)=>a.at-b.at);
}
/* Само событие: кто пришёл и что это дало. Все числа считаются здесь и складываются в
   plain.got — оттуда их берёт сводка, поэтому «откуда взялась разница» видно строкой. */
function ccStreamHappen(h){
  const p=CC_TV_PLAIN||CC_TV_CUPX; if(!p) return;
  const T=L(), c=CC_TV_HAP[h.id];
  if(h.id==='raid'){
    let from=null;
    // Рейдит свой (отслеживаемый в эфире), а без своих — кто-то из тройки самых смотримых.
    /* Рейд не падает с неба (28.10, его «рейды просто так пусть не дают»): рейдят свои (отслеживаемые в эфире) или
       стример твоего размера — не больше чем вчетверо крупнее тебя; топ-стример на сто тысяч в канал на десятерых
       не заходит. И чужим каналу нужно быть заметным — от 500 фолловеров. Пришедших — не больше чем втрое к онлайну. */
    const fol0=(CAREER && CAREER.career && CAREER.career.twitch)||0, v0=Math.max(3, CC_TV_VIEW||0);
    try{ const mine=ccTwFollowLive().filter(s=>s && s.v>0 && s.v<=Math.max(200, v0*20));
      if(mine.length) from=mine[Math.floor(Math.random()*mine.length)];
      else if(fol0>=500){ const peers=(careerLiveNow(12)||[]).filter(s=>s && s.v>0 && s.v<=v0*4 && s.v>=v0*0.25);
        if(peers.length) from=peers[Math.floor(Math.random()*peers.length)]; } }catch(e){}
    if(!from) return;
    const came=Math.max(2, Math.min(Math.round(v0*3+10), Math.round(from.v*c.grab*(0.5+Math.random()))));
    CC_TV_BASE=Math.round(CC_TV_BASE+came);
    CC_TV_VIEW+=came; CC_TV_PEAK=Math.max(CC_TV_PEAK, CC_TV_VIEW);
    const fol=Math.max(1, Math.round(came*c.fol));
    p.got.push({id:'raid', who:from.name, n:came, fol:fol});
    ccTvPush({ev:'fol', text:T.ccTvHapRaid(from.name, ccNum(came))});
    ccTvAlert('raid', T.ccTvAlRaid(from.name), T.ccTvAlRaidNote(ccNum(came)));
  } else if(h.id==='clip'){
    const fol=Math.max(3, Math.round((p.want.fol||0)*c.fol));
    p.got.push({id:'clip', fol:fol});
    ccTvPush({ev:'fol', text:T.ccTvHapClip(ccNum(fol))});
    ccTvAlert('fol', T.ccTvAlClip, T.ccTvAlClipNote(ccNum(fol)));
  } else if(h.id==='pro'){
    let who=null;
    // Заглядывает тот, кому платишь подпиской, а без таких — кто-то со сцены.
    try{ const paid=ccTwSubLive(); who=paid.length ? {handle:paid[Math.floor(Math.random()*paid.length)].name} : (careerRosterNowEU()||[])[Math.floor(Math.random()*40)]; }catch(e){}
    const nick=(who && who.handle) || (CC_TV_WHO[0] && CC_TV_WHO[0].who) || 'pro';
    p.got.push({id:'pro', who:nick, subs:c.subs});
    ccTvPush({ev:'sub', text:T.ccTvHapPro(nick, c.subs)});
    ccTvAlert('sub', T.ccTvAlPro(nick), T.ccTvAlProNote(c.subs));
    for(let i=0;i<c.subs;i++) CC_TV_EV.subs++;
    CC_TV_HYPE+=0.5;
  } else if(h.id==='hate'){
    CC_TV_VIEW=Math.max(3, Math.round(CC_TV_VIEW*(1-c.dip)));
    p.got.push({id:'hate'});
    ccTvPush({ev:'dono', text:T.ccTvHapHate});
    ccTvAlert('hate', T.ccTvAlHate, T.ccTvAlHateNote);
  }
}
// Строка события для сводки: что случилось и что это дало.
function ccStreamHapLine(g){
  const T=L();
  if(!g) return '';
  if(g.id==='raid') return T.ccTvHapRaidSum(g.who, ccNum(g.n), g.fol);
  if(g.id==='clip') return T.ccTvHapClipSum(g.fol);
  if(g.id==='pro')  return T.ccTvHapProSum(g.who, g.subs);
  if(g.id==='hate') return T.ccTvHapHateSum;
  if(g.id==='sac')  return T.ccTvHapSacSum(ccNum(g.cash));
  return '';
}
// Эфир без рамки: те же события дня сразу, итог в streamLast.
function ccStreamQuiet(k, last){
  CC_TV_BASE=Math.max(3, ccStreamViewersNow()); CC_TV_VIEW=CC_TV_BASE; CC_TV_PEAK=CC_TV_BASE;
  CC_TV_HYPE=0; CC_TV_MSGS=[]; CC_TV_WHO=[]; CC_TV_EV={fol:0, subs:0, cash:0};
  CC_TV_SUM={n:0, sum:0}; CC_TV_HIST=[]; CC_TV_CHATTERS=new Set();
  CC_TV_PLAIN={id:k.id, at:0, done:0, hours:k.hours||4, ticks:1,
               want:{fol:(last.a && last.a[2])||0, cash:last.m||0}, hap:ccStreamHappenings(k, 4), got:[]};
  while(CC_TV_PLAIN.hap.length) ccStreamHappen(CC_TV_PLAIN.hap.shift());
  ccStreamRunEnd(true);
}
// Конец обычного эфира: рамка снимается, сводка — из чисел этого дня.
function ccStreamRunEnd(quiet){
  const p=CC_TV_PLAIN; CC_TV_PLAIN=null;
  const cr=CAREER && CAREER.career, last=cr && cr.streamLast;
  const avg=(CC_TV_SUM && CC_TV_SUM.n) ? Math.round(CC_TV_SUM.sum/CC_TV_SUM.n) : CC_TV_VIEW;
  /* Что принесли события эфира — СВЕРХ дневных чисел, и начисляется это один раз,
     здесь. Фолловеры от рейда и клипа идут в счётчик канала, сабы за про — в деньги
     по цене саба. Без событий вечер остаётся ровно таким, каким его посчитал день. */
  const got=(p && p.got)||[];
  // Код поддержки — по онлайну за эфир (см. CC_SAC), отдельной строкой в сводке.
  const sacX=ccSacStream(avg, (p && p.hours)||4);
  if(sacX){ got.push({id:'sac', cash:sacX}); if(cr) cr.sac=(cr.sac||0)+sacX; }
  const folX=got.reduce((a,g)=>a+(g.fol||0), 0);
  const subsX=got.reduce((a,g)=>a+(g.subs||0), 0);
  const cashX=Math.round(subsX*CC_TV_SUB_USD)+sacX;
  if(cr && folX) cr.twitch=(cr.twitch||0)+folX;
  if(cr && cashX){ cr.balance=(cr.balance||0)+cashX; cr.streamed=(cr.streamed||0)+cashX; }
  if(last && last.a){ last.a[2]=(last.a[2]||0)+folX; last.m=(last.m||0)+cashX; last.a[3]=ccNum(last.m); }
  const sum={avg:avg, peak:Math.max(CC_TV_PEAK||0, avg),
             fol:((p && p.want.fol)||0)+folX, subs:(CC_TV_EV && CC_TV_EV.subs)||0,
             cash:((p && p.want.cash)||0)+cashX, hours:(p && p.hours)||4,
             chatters:(CC_TV_CHATTERS && CC_TV_CHATTERS.size)||0,
             label:(p && (p.watch ? L().ccStreamWatchOf((p.watch.ev && (p.watch.ev.label||p.watch.ev.title))||'') : L()['ccStream_'+p.id]))||'', hist:ccTvHistPack(CC_TV_HIST||[], 60),
             hap:got.map(g=>ccStreamHapLine(g)).filter(Boolean)};
  if(last && last.day===careerToday()){ last.sum=sum; last.label=sum.label; }
  try{ careerSave(); }catch(e){}
  if(quiet) return;
  ccTvClose();
  // Конец эфира перерисовывает ту вкладку, где игрок сейчас, а не тащит его обратно в «Стримы».
  try{ careerRenderHub(CH_TAB); }catch(e){}
  ccTvSummary(sum);
}
/* ---- Эфир с турнира ---------------------------------------------------------
   Кнопка рядом с «Играть», турнир как обычно, сверху окно трансляции.
   1. Эфир считается до турнира: после вечера день уже завтрашний (careerAdvanceTo
   в конце раннера). careerDoAct('stream') на старте, итог доплачивает ccStreamCupAfter.
   2. Метка спрашивается первой: careerSpotGate уходит на карту и возвращает false,
   и оплаченный эфир остался бы без турнира.
   3. В командной карьере эфира нет: сила команды должна сойтись у двоих (CC_MP_YOU_PARTS).
   Цена -10 силы, больше формы (±3) и химии (+5) вместе. Число одно, подписи читают его. */
const CC_STREAM_POW=10;
let CC_STREAM_LIVE=false;
// Своя команда сегодняшнего вечера — её читает окошко трансляции. Пишется в
// careerYouTeam, то есть одинаково для всех девяти раннеров.
let CC_TV_YOU=null;
function ccStreamPow(){ return CC_STREAM_LIVE ? -CC_STREAM_POW : 0; }
// Почему нельзя — строкой, её же показывает кнопка. null значит «можно».
function ccStreamCupWhy(){
  const T=L();
  if(!CAREER || !CAREER.career) return T.ccTvNoEvent;
  if(ccMpOn()) return T.ccTvMpNo;
  /* И в гонке тоже — отзыв: «race выключи функцию играть в
     live, только стримить общение, ранкед и т. д.». Причина та же, что у
     команды: вечер в общей комнате считают все браузеры, а рамка эфира тикает
     своим таймером и тратит броски только у того, кто стримит. Обычные эфиры
     (ранкед, общение, марафон, коллаб) идут в свободный день и вечера не трогают. */
  if(typeof ccRaceOn==='function' && ccRaceOn()) return T.ccTvRaceNo;
  const next=careerNext();
  if(!next || next.day!==careerToday() || !careerCanPlay(next) || CAREER.career.seasonOver)
    return T.ccTvNoEvent;
  if(careerDayClosed()) return T.ccStreamDayGone;
  /* Причина, а не цена. Скриншот («в трио не работает кнопка»):
     под выключенной кнопкой стояло «20 energy» — та же строка, что и цена на
     включённой, — и кнопка читалась сломанной. Ей не хватало энергии. */
  if(careerEnergy()<CC_STREAM_CUP.energy) return T.ccStreamNeed(CC_STREAM_CUP.energy, careerEnergy());
  return null;
}
async function careerPlayLive(){
  if(CC_STREAM_LIVE || ccStreamCupWhy()) return false;
  const cr=CAREER.career, next=careerNext(), day=careerToday();
  if(typeof ccNatPickGate==='function' && !ccNatPickGate(next)) return false;
  if(!careerSpotGate(next)) return false;
  CC_STREAM_KIND=CC_STREAM_CUP.id;
  const done=careerDoAct('stream');
  CC_STREAM_KIND='grind';
  if(!done) return false;
  if(CC_STREAM_CUP.grind) cr.grind=(cr.grind||0)+CC_STREAM_CUP.grind;
  // Что стримили — заголовком в сводке эфира. См. ccTvSummary.
  if(cr.streamLast && cr.streamLast.day===day) cr.streamLast.label=(next && (next.label||next.title))||'';
  careerSave();
  CC_STREAM_LIVE=true; CC_TV_YOU=null;
  ccTvOpen(next);
  // События и на турнирном эфире: рейды, клип, про в чате — те же, что в свободный день (его
  // слово 9 сентября: «пусть сабки и рейды на экране показывает»). Считаются тиками рамки.
  CC_TV_CUPX={n:0, got:[], want:{fol:Math.round((CC_TV_VIEW||0)*0.25)}, hap:ccStreamHappenings(CC_STREAM_CUP, CC_TV_TICKS_PER_GAME*10)};
  /* Вечер может и не доиграться — игрок ушёл с раннера, вкладка сменилась
     (RUN_ABANDONED). Эфир к этому моменту уже оплачен и посчитан, поэтому
     снимаем рамку и досчитываем результат в finally: если турнир не оставил
     строки в журнале, ccStreamCupAfter просто ничего не найдёт. */
  try{ await careerPlay(); }
  finally{
    CC_STREAM_LIVE=false;
    /* Итог вечера — с табло трансляции, ПЕРЕД тем как рамка снимется и
       обнулит поле: кубок Дивизиона 1 из двух сессий пишет строку журнала не в
       этот вечер, а по строке журнала итог и считался — сводки и доплаты за
       эфир у такого кубка не было вовсе (проверено в его Chrome, 5.09). */
    const board=ccTvBoard();
    const cupx=CC_TV_CUPX; CC_TV_CUPX=null;
    ccTvClose();
    ccStreamCupAfter(day, board, cupx);
  }
  return true;
}
/* Что вечер добавил к эфиру. Турнир смотрят ради результата: место в лобби —
   это и есть тот единственный множитель, которым эфир с турнира отличается от
   эфира с ранкеда. Считается по той же доле поля (beat), по которой карьера
   уже считает форму и охват, чтобы «хорошо отыграл» везде означало одно. */
let CC_TV_CUPX=null;
function ccStreamCupAfter(day, board, cupx){
  const cr=CAREER && CAREER.career; if(!cr) return null;
  const rows=(cr.log||[]).filter(r=>r && r.day===day && r.of>1);
  // Строка журнала, а без неё — табло трансляции на конец вечера (см. careerPlayLive).
  const row=rows[rows.length-1] || (board && board.of>1 ? {place:board.place, of:board.of} : null);
  if(!row) return null;
  const beat=clamp(1-(row.place-1)/(row.of-1), 0, 1);
  const v=CC_TV_VIEW||ccStreamViewersNow();
  /* Что показано — то и получено. Вживую события чата (фолловеры, сабы,
     донаты — CC_TV_EV) идут из того же бюджета, что и эта формула, и итог
     берёт большее из двух: под перемоткой тиков мало и правит формула, а на
     вечере, просмотренном целиком, зритель не увидит в чате больше, чем ему
     потом начислят. */
  const ev=(typeof CC_TV_EV==='object' && CC_TV_EV) || {fol:0, cash:0};
  // Что принесли события эфира и код поддержки — сверх формулы вечера, один раз, здесь.
  const got=(cupx && cupx.got)||[];
  const avg0=(CC_TV_SUM && CC_TV_SUM.n) ? Math.round(CC_TV_SUM.sum/CC_TV_SUM.n) : v;
  const sacX=ccSacStream(avg0, (cr.streamLast && cr.streamLast.day===day && cr.streamLast.a && cr.streamLast.a[5]) || CC_STREAM_CUP.hours);
  if(sacX){ got.push({id:'sac', cash:sacX}); cr.sac=(cr.sac||0)+sacX; }
  const folX=got.reduce((a,g)=>a+(g.fol||0), 0), subsX=got.reduce((a,g)=>a+(g.subs||0), 0);
  // Доля фолловеров с насыщением по размеру канала (CC_TW_SAT) — та же, что в чате эфира.
  const fol=Math.max(1, Math.round(v*0.25*beat*ccTwFolRate(cr.twitch)), ev.fol||0)+folX;
  const cash=Math.max(Math.round(v*0.06*beat), Math.round(ev.cash||0))+Math.round(subsX*CC_TV_SUB_USD)+sacX;
  cr.twitch=(cr.twitch||0)+fol;
  if(cash){
    cr.balance=(cr.balance||0)+cash;
    cr.streamed=(cr.streamed||0)+cash;
  }
  /* Отчёт вечера в панели дня считается ДО турнира — досчитываем его здесь,
     иначе панель показывает подписки без тех, кто пришёл на результат, и
     заработок без того, что принёс сам результат. Деньги берутся из сырого
     числа (streamLast.m), а не разбираются обратно из строки. */
  const last=cr.streamLast;
  if(last && last.day===day && last.a){
    last.a[2]=(Number(last.a[2])||0)+fol;
    last.a[4]=ccNum(cr.twitch);
    if(cash && last.m!=null){ last.m=(last.m||0)+cash; last.a[3]=ccNum(last.m); }
  }
  /* Средний онлайн за 30 дней — на нём стоит партнёрка (ccTwMonth). Турнирный
     вечер смотрят больше обычного, и журнал обязан помнить пиковое число этого
     вечера, а не то, что было до первой игры. */
  const log=cr.streamLog||[];
  for(let i=log.length-1;i>=0;i--){
    if(log[i] && log[i].d===day){ log[i].v=Math.max(log[i].v||0, v); break; }
  }
  careerTwTick();
  careerNews(beat>=0.75 ? 'good' : 'flat', 'ccNewsStreamCup',
             [row.place, row.of, ccNum(fol)]);
  /* Сводка эфира — правка, скрин «Stream Summary» из дашборда
     Twitch: «в конце стрима пусть показывает, сколько заработал и сколько
     средний онлайн». Считается здесь, где известны и итог турнира, и то, что
     набрал чат; лежит в streamLast.sum — её же показывает вкладка стримов.
     Средний онлайн — по замерам тиков; под перемоткой их мало, и тогда он
     равен зрителям начала эфира. Часы — те, что пишет журнал партнёрки. */
  const sum={avg: CC_TV_SUM && CC_TV_SUM.n ? Math.round(CC_TV_SUM.sum/CC_TV_SUM.n) : v,
             peak: Math.max(CC_TV_PEAK||0, v), fol:fol, subs:(ev.subs||0), cash:cash,
             hours:(last && last.a && last.a[5]) || CC_STREAM_CUP.hours,
             chatters:(CC_TV_CHATTERS && CC_TV_CHATTERS.size) || 0,
             place:row.place, of:row.of, label:(last && last.label) || '',
             hist:ccTvHistPack(CC_TV_HIST||[], 60),
             hap:got.map(g=>ccStreamHapLine(g)).filter(Boolean)};
  if(last && last.day===day) last.sum=sum;
  careerSave();
  careerRenderHub('centre');
  ccTvSummary(sum);
  return {fol:fol, cash:cash, sum:sum};
}
// Кривая зрителей — не длиннее n точек, средним по отрезкам; хранится в сейве.
function ccTvHistPack(hist, n){
  if(!hist.length) return [];
  if(hist.length<=n) return hist.map(h=>({v:h.v, g:h.g}));
  const out=[]; const step=hist.length/n;
  for(let i=0;i<n;i++){
    const a=Math.floor(i*step), b=Math.max(a+1, Math.floor((i+1)*step));
    const part=hist.slice(a, b);
    out.push({v:Math.round(part.reduce((s,h)=>s+h.v,0)/part.length), g:part[part.length-1].g});
  }
  return out;
}
// Плитки сводки — одни и те же в карточке после эфира и на вкладке стримов.
function ccTvSumTilesHTML(s){
  const T=L();
  const tile=(k,v,cls)=>'<div class="cc-tvs-tile'+(cls?' '+cls:'')+'"><b>'+v+'</b><span>'+esc(k)+'</span></div>';
  return '<div class="cc-tvs-tiles">'+
    tile(T.ccTvSumAvg, ccNum(s.avg||0), 'main')+
    tile(T.ccTvSumPeak, ccNum(s.peak||0))+
    tile(T.ccTvSumFol, '+'+ccNum(s.fol||0), 'up')+
    tile(T.ccTvSumSubs, ccNum(s.subs||0))+
    tile(T.ccTvSumCash, ccMoney(s.cash||0), 'up')+
    tile(T.ccTvSumTime, esc(T.ccTvSumHours(s.hours||CC_STREAM_CUP.hours)))+
    tile(T.ccTvSumChatters, ccNum(s.chatters||0))+
  '</div>'+
  /* Что случилось за эфир — строками под плитками: рейд, клип, про в чате. Без них
     вечер и правда «просто стрим», и разница в числах ниоткуда. */
  ((s.hap && s.hap.length)
    ? '<div class="cc-tvs-hap">'+s.hap.map(h=>'<div>'+esc(h)+'</div>').join('')+'</div>' : '');
}
/* График зрителей по ходу вечера — линия с заливкой, как в дашборде Twitch,
   подписи по оси — номера игр. Рисуется SVG на показ, из сохранённой кривой. */
function ccTvSumChartHTML(s){
  const T=L(), h=(s && s.hist)||[];
  if(h.length<2) return '';
  const W=560, H=150, PL=34, PB=18, PT=8;
  const max=Math.max(1, ...h.map(p=>p.v));
  const x=i=>PL+(W-PL-6)*i/(h.length-1);
  const y=v=>PT+(H-PT-PB)*(1-v/max);
  const pts=h.map((p,i)=>x(i).toFixed(1)+','+y(p.v).toFixed(1));
  const area='M'+pts[0]+' L'+pts.join(' L')+' L'+x(h.length-1).toFixed(1)+','+(H-PB)+' L'+PL+','+(H-PB)+' Z';
  // Подписи игр — там, где номер игры меняется, но не чаще шести на ось.
  const marks=[]; let lastG=-1;
  h.forEach((p,i)=>{ if(p.g!==lastG && p.g>0){ marks.push({i:i, g:p.g}); lastG=p.g; } });
  const every=Math.max(1, Math.ceil(marks.length/6));
  const labels=marks.filter((m,k)=>k%every===0).map(m=>
    '<text x="'+x(m.i).toFixed(1)+'" y="'+(H-4)+'" text-anchor="middle">'+esc(T.ccTvGame(m.g))+'</text>').join('');
  const grid=[0.5,1].map(f=>'<line x1="'+PL+'" x2="'+(W-6)+'" y1="'+y(max*f).toFixed(1)+'" y2="'+y(max*f).toFixed(1)+'"/>'+
    '<text x="'+(PL-6)+'" y="'+(y(max*f)+3).toFixed(1)+'" text-anchor="end">'+ccNum(Math.round(max*f))+'</text>').join('');
  return '<div class="cc-tvs-chart"><em>'+esc(T.ccTvSumChart)+'</em>'+
    '<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none">'+
      '<g class="cc-tvs-grid">'+grid+'</g>'+
      '<path class="cc-tvs-area" d="'+area+'"/>'+
      '<polyline class="cc-tvs-line" points="'+pts.join(' ')+'"/>'+
      '<g class="cc-tvs-ax">'+labels+'</g>'+
    '</svg></div>';
}
// Карточка после эфира. Своя, не ccAsk: у той один абзац и две кнопки, а здесь
// плитки и график. Под перемоткой и в пробах без document её нет.
function ccTvSummary(s){
  if(typeof document==='undefined' || !document.body || !s) return;
  if(typeof CC_FF!=='undefined' && CC_FF) return;
  ccTvSummaryClose();
  const T=L();
  const box=document.createElement('div');
  box.id='ccTvSum'; box.className='cc-tvs';
  box.onclick=function(e){ if(e.target===box) ccTvSummaryClose(); };
  box.innerHTML='<div class="cc-tvs-box">'+
    '<div class="cc-tvs-h"><span class="cc-tvm-live">'+esc(T.chLiveTag)+'</span><b>'+esc(T.ccTvSumTitle)+'</b>'+
      '<em>'+esc(s.label||'')+(s.of ? (s.label?' · ':'')+esc(T.ccTvSumPlace(s.place, s.of)) : '')+'</em></div>'+
    ccTvSumTilesHTML(s)+ccTvSumChartHTML(s)+
    '<div class="cc-tvs-f"><button class="cc-tvs-ok" onclick="ccTvSummaryClose()">'+esc(T.ccTellOk)+'</button></div>'+
  '</div>';
  document.body.appendChild(box);
}
function ccTvSummaryClose(){
  const box=document.getElementById('ccTvSum');
  if(box && box.parentNode) box.parentNode.removeChild(box);
}
/* Эфир вокруг вечера в рамке как twitch.tv/<канал>. Турнир идёт на своём экране прогона со всеми
   кнопками, по бокам две колонки (слева канал и отслеживаемые, справа LIVE, зрители, табло, чат);
   экран прогона отодвигается полями body.cc-onair, ничего не масштабируется.
   Рамка ничего не считает: читает CC_TV_YOU (careerYouTeam) и CC_TV_RUN (simulateGamesLive) раз в 0.6 с.
   Чат и события канала идут из бюджета ccStreamCupAfter (фолловеры v·0.25·beat, деньги v·0.06·beat)
   по тикам вечера, плюс всплеск после победы. Итог берёт большее из формулы и показанного в чате;
   под перемоткой тиков мало, и решает формула. */
let CC_TV_TOP={};   // донатеры эфира: ник → долларов за вечер (сабы и донаты), см. ccTvLeadHTML
let CC_TV_T=null, CC_TV_VIEW=0, CC_TV_PEAK=0, CC_TV_HYPE=0,
    CC_TV_BASE=0, CC_TV_SEEN=0, CC_TV_WHO=[], CC_TV_MSGS=[], CC_TV_RUN=null, CC_TV_INCUT=null,
    CC_TV_T0=0, CC_TV_EV={fol:0, subs:0, cash:0}, CC_TV_BURST=0,
    // Для сводки после эфира: сумма/число замеров зрителей, кривая по тикам,
    // кто писал в чат. См. ccTvSummary.
    CC_TV_SUM={n:0, sum:0}, CC_TV_HIST=[], CC_TV_CHATTERS=new Set();
const CC_TV_TICK=600;
// Сколько тиков живёт одна игра, когда вечер смотрят вживую, — по этому числу
// раскладывается бюджет событий (см. ccTvEvents).
const CC_TV_TICKS_PER_GAME=45;
// Доля стримера с саба Tier 1 и чеки донатов — как на Twitch.
const CC_TV_SUB_USD=2.5;
const CC_TV_DONO=[2,3,5,5,5,10,10,20,50];
/* Таблица вечера глазами трансляции: где ты стоишь прямо сейчас, кто наверху и
   докуда идёт отсечка. Считается ОДНИМ проходом по полю, без сортировки: поле
   бывает и в шесть тысяч строк, а окно перерисовывается два раза в секунду. */
function ccTvBoard(){
  const run=CC_TV_RUN, you=CC_TV_YOU;
  if(!run || !run.teams || !you) return null;
  const key=run.pts, mine=you[key]||0;
  let above=0;
  const top=[];
  for(let i=0;i<run.teams.length;i++){
    const t=run.teams[i], p=t[key]||0;
    if(t!==you && (p>mine || (p===mine && (t.wins||0)>(you.wins||0)))) above++;
    // Тройка лидеров — вставкой в трёхэлементный список, а не сортировкой поля.
    if(top.length<3 || p>top[top.length-1].p){
      const row={name:t.name||'', p:p, you:t===you};
      let at=top.findIndex(r=>p>r.p);
      if(at<0) at=top.length;
      top.splice(at, 0, row);
      if(top.length>3) top.pop();
    }
  }
  return {place:above+1, of:run.teams.length, top:top,
          cut:run.cut||0, pts:mine, n:run.n||0};
}
function ccTvOpen(next){
  ccTvClose();
  if(typeof document==='undefined' || !document.body) return;
  const T=L(), me=(CAREER && CAREER.player)||{};
  CC_TV_BASE=Math.max(3, ccStreamViewersNow());
  CC_TV_VIEW=CC_TV_BASE; CC_TV_PEAK=CC_TV_BASE;
  CC_TV_HYPE=0; CC_TV_SEEN=0; CC_TV_MSGS=[]; CC_TV_RUN=null; CC_TV_INCUT=null;
  CC_TV_T0=Date.now(); CC_TV_EV={fol:0, subs:0, cash:0}; CC_TV_BURST=0;
  CC_TV_SUM={n:0, sum:0}; CC_TV_HIST=[]; CC_TV_CHATTERS=new Set();
  // Команда вечера придёт из careerYouTeam, когда вечер начнётся. Прошлая —
  // с её одиннадцатью играми — иначе прочитывалась первым же тиком как
  // «только что сыгранное», и чат открывался чужими реакциями.
  CC_TV_YOU=null;
  /* Кто сидит в чате — те же люди, что и на вкладке стримов. Пустым он быть
     не может: у совсем новой карьеры нет ни друзей, ни подписок, и тогда в
     эфире сидит она сама. */
  // Людей в чате — по онлайну (28.10, «чат реалистичнее»): у эфира на пятерых пишут двое-трое, а не тридцать.
  CC_TV_WHO=careerStreamChat(Math.max(2, Math.min(30, Math.round(1+Math.sqrt(CC_TV_BASE)*1.6))));
  if(!CC_TV_WHO.length){
    const nick=me.nick||'viewer';
    CC_TV_WHO=[{who:ccHandle(nick), c:ccChatColor(nick)}];
  }
  const label=(next && (next.label||next.title))||T.ccStreamCupTitle;
  const av=(url, name)=>'<span class="cc-tv-av">'+
    (url ? '<img src="'+esc(url)+'" alt="" onerror="this.remove()">'
         : esc(String(name||'?').slice(0,2).toUpperCase()))+'</span>';
  let mine=null;
  try{ mine=photoURL(me.photo ? {_photo:me.photo} : careerCard()); }catch(e){ mine=null; }
  /* Значки у ников — как на Twitch: у части чата фиолетовый саб, у единиц
     зелёный мод и розовый VIP. Раздаются один раз на эфир, чтобы один и тот же
     человек весь вечер ходил с одним значком. */
  CC_TV_WHO.forEach(w=>{ const r=Math.random(); w.b = r<0.04 ? 'mod' : r<0.09 ? 'vip' : r<0.35 ? 'sub' : ''; });
  CC_TV_TOP={};
  /* Слева — как в сайдбаре Twitch (его референс 7 сентября): отслеживаемые
     каналы с онлайном (шесть в эфире, трое не в сети) и ниже «зрители также
     смотрят» — ещё трое в эфире. */
  let side=[];
  try{ side=careerLiveNow(12); }catch(e){ side=[]; }
  const srow=(s, live)=>'<div class="cc-tv-srow">'+
      av(s.card ? photoURL(s.card) : (s.ava||null), s.name)+
      '<div class="cc-tv-sin"><b>'+esc(s.name)+'</b><em>'+esc(T[s.cat]||'')+'</em></div>'+
      (live ? '<span class="cc-tv-vv"><i></i>'+ccNum(s.v)+'</span>'
            : '<span class="cc-tv-off">'+esc(T.ccStreamOffline)+'</span>')+
      ccTwFollowBtnHTML(s.name, !!s.creator, 'cc-tv-fb')+
    '</div>';
  // Свои (отслеживаемые) — первыми, как в сайдбаре Twitch.
  side=side.slice().sort((a,b)=>(ccTwFollowing(b.name)?1:0)-(ccTwFollowing(a.name)?1:0));
  const rows=side.slice(0, 9).map((s,i)=>srow(s, i<6)).join('');
  const also=side.slice(9, 12).map(s=>srow(s, true)).join('');
  // Хозяин эфира (чужой финал): под плеером его канал, и кнопки на нём работают.
  const host=(next && next.host) || null;
  CC_TV_HOST=host;
  const box=document.createElement('div');
  box.id='ccTvFrame'; box.className='cc-tv';
  box.innerHTML=
    '<aside class="cc-tv-left">'+
      '<div class="cc-tv-chan">'+av(mine, me.nick)+
        '<i class="cc-tv-livetag">'+esc(T.chLiveTag)+'</i>'+
        '<div class="cc-tv-chan-in"><b>'+esc(me.nick||'')+'</b><em>'+esc(label)+'</em>'+
          '<span>'+esc(T.ccStreamCatFn)+'</span></div></div>'+
      '<div class="cc-tv-side-h">'+esc(T.ccStreamFollowed)+'</div>'+rows+
      (also ? '<div class="cc-tv-side-h cc-tv-side-h2">'+esc(T.ccStreamAlsoWatch)+'</div>'+also : '')+
    '</aside>'+
    /* Под плеером — строка канала, как под видео на Twitch: аватар с LIVE,
       ник, название эфира, категория и язык, кнопки Follow / Gift a Sub /
       Subscribe и справа онлайн с аптаймом. Это то место, куда на Twitch
       смотрят за онлайном; в правой колонке он дублируется мелко. */
    '<div class="cc-tv-under" id="ccTvUnder">'+
      '<div class="cc-tv-under-ch">'+(host ? av(host.card ? photoURL(host.card) : (host.ava||null), host.name) : av(mine, me.nick))+'<i class="cc-tv-livetag">'+esc(T.chLiveTag)+'</i></div>'+
      '<div class="cc-tv-under-in"><b>'+esc(host ? host.name : (me.nick||''))+'</b><em>'+esc(label)+'</em>'+
        '<span><u>'+esc(T.ccStreamCatFn)+'</u><u>'+esc(T.ccStreamLang)+'</u>'+
        (!host && ccSacOn() ? '<u class="cc-tv-sac">'+esc(T.ccSacBio(ccSacCode()))+'</u>' : '')+'</span></div>'+
      '<div class="cc-tv-under-btns" id="ccTvHostBtns">'+ccTvHostBtnsHTML(host)+'</div>'+
      '<div class="cc-tv-under-st"><span class="cc-tv-uv"><i></i><b id="ccTvV2">'+ccNum(CC_TV_VIEW)+'</b></span>'+
        '<span class="cc-tv-uup" id="ccTvUp2">0:00:00</span></div>'+
    '</div>'+
    '<aside class="cc-tv-right">'+
      '<div class="cc-tvm-h"><span class="cc-tvm-live">'+esc(T.chLiveTag)+'</span>'+
        '<span class="cc-tvm-v"><i></i><b id="ccTvV">'+ccNum(CC_TV_VIEW)+'</b></span>'+
        '<span class="cc-tv-up" id="ccTvUp">0:00</span>'+
        '<span class="cc-tv-subs" id="ccTvSubs">'+esc(T.ccTvSubsToday(0))+'</span>'+
        '<button class="cc-tvm-x" id="ccTvFold" onclick="ccTvFold()" aria-label="'+
          esc(T.ccTvFold)+'" title="'+esc(T.ccTvFold)+'">–</button></div>'+
      '<div class="cc-tvm-b">'+
        '<div class="cc-tvm-title">'+esc(label)+'</div>'+
        '<div class="cc-tvm-bar"><i id="ccTvBar"></i></div>'+
        '<div class="cc-tvm-run" id="ccTvRun">'+esc(T.ccTvWait)+'</div>'+
        '<div class="cc-tvm-pips" id="ccTvPips"></div>'+
        '<div class="cc-tvm-board" id="ccTvBoard"></div>'+
        '<div class="cc-tv-ev" id="ccTvEv">'+esc(T.ccTvEvSum(0, 0, 0))+'</div>'+
      '</div>'+
      '<div class="cc-tv-chat-h">'+esc(T.ccStreamChat)+'</div>'+
      // Топ донатеров эфира — строка под шапкой чата, как таблица лидеров на Twitch.
      '<div class="cc-tv-lead" id="ccTvLead"></div>'+
      '<div class="cc-tvm-chat" id="ccTvChat"></div>'+
      // Поле ввода — как у зрителя; стример в него не пишет, оно тут ради вида.
      '<div class="cc-tv-say"><span>'+esc(T.ccStreamSay)+'</span><i>☺</i></div>'+
      /* «−10 к силе» — цена ЭФИРА С ТУРНИРА: играешь хуже, потому что говоришь в
         микрофон. У эфира в свободный день турнира нет, силе неоткуда падать, и
         строка была неправдой (его снимок 8 сентября). */
      '<div class="cc-tvm-f"><span id="ccTvPeak"></span><span id="ccTvPow">'+
        (CC_TV_PLAIN ? '' : esc(T.ccTvPow(CC_STREAM_POW)))+'</span></div>'+
    '</aside>';
  // Алерты — поверх картинки, как у стримера: сабы, донаты, рейды. Хост был только у плеера
  // вкладки, и на турнирном эфире алерты уходили в никуда (отзыв).
  const alertHost=document.createElement('div'); alertHost.className='cc-tv-alert'; box.appendChild(alertHost);
  document.body.appendChild(box);
  document.body.classList.add('cc-onair');
  // Чат не начинается с пустоты: люди уже сидят в эфире, когда он включается.
  ccTvSay(T.ccStreamChatLines); ccTvSay(T.ccStreamChatLines); ccTvSay(T.ccStreamChatLines);
  ccTvTick();
  CC_TV_T=setInterval(ccTvTick, CC_TV_TICK);
}
let CC_TV_HOST=null;
// Кнопки под плеером: на чужом канале — живые Follow / Subscribe, на своём — как у зрителя, для вида.
function ccTvHostBtnsHTML(host){
  const T=L();
  if(!host) return '<button type="button" class="cc-tv-btn cc-tv-btn-fol">♥ '+esc(T.ccTvFollow)+'</button>'+
    '<button type="button" class="cc-tv-btn">'+esc(T.ccStreamGift)+'</button>'+
    '<button type="button" class="cc-tv-btn cc-tv-btn-sub">★ '+esc(T.ccStreamSub)+'</button>';
  const q=String(host.name).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
  const fol=ccTwFollowing(host.name), sub=ccTwSubbed(host.name);
  return '<button type="button" class="cc-tv-btn cc-tv-btn-fol'+(fol?' on':'')+'" onclick="ccTwFollowToggle(\''+jsq(host.name)+'\')">♥ '+esc(fol ? T.ccTwFollowOn : T.ccTvFollow)+'</button>'+
    (host.creator ? '<button type="button" class="cc-tv-btn cc-tv-btn-sub'+(sub?' on':'')+'" onclick="ccTwSubToggle(\''+jsq(host.name)+'\')">★ '+esc(sub ? T.ccTwSubOn : T.ccTwSubPrice(CC_TW_SUB_PRICE))+'</button>' : '');
}
function ccTvHostRedraw(){
  const el=document.getElementById('ccTvHostBtns'); if(el) el.innerHTML=ccTvHostBtnsHTML(CC_TV_HOST);
  const box=document.getElementById('ccTvFrame'); if(!box) return;
  box.querySelectorAll('.cc-tv-srow').forEach(row=>{ const b=row.querySelector('.cc-tv-fb'); const name=row.querySelector('.cc-tv-sin b'); if(b && name){ const t=document.createElement('span'); t.innerHTML=ccTwFollowBtnHTML(name.textContent, !!row.querySelector('.tv-fb-s'), 'cc-tv-fb'); b.replaceWith(t.firstChild); } });
}
// Свернуть — колонки уходят, остаётся плашка LIVE со зрителями в углу; вечер
// расправляется на всю ширину. Ещё раз — вернуть.
function ccTvFold(){
  const box=document.getElementById('ccTvFrame'); if(!box) return;
  const fold=box.classList.toggle('fold');
  document.body.classList.toggle('cc-onair-fold', fold);
  const b=document.getElementById('ccTvFold');
  if(b) b.textContent=fold ? '+' : '–';
}
function ccTvClose(){
  CC_TV_RUN=null;
  if(CC_TV_T){ clearInterval(CC_TV_T); CC_TV_T=null; }
  const box=document.getElementById('ccTvFrame');
  if(box && box.parentNode) box.parentNode.removeChild(box);
  if(typeof document!=='undefined' && document.body){
    document.body.classList.remove('cc-onair'); document.body.classList.remove('cc-onair-fold');
  }
}
function ccTvPush(m){
  CC_TV_MSGS.push(m);
  if(CC_TV_MSGS.length>40) CC_TV_MSGS.shift();
}
// Строка в чат: кто (из тех же людей, что и на вкладке стримов) и что.
/* Сколько чат болтает сам по себе — от онлайна: на пятерых строка раз в несколько тиков, на тысячах — каждый тик.
   Ответы на выбор, исход и победу идут всегда (их ждут), спам после победы короче на маленьком канале. */
function ccTvChatRate(){ return Math.min(1, 0.12+Math.sqrt(Math.max(0, CC_TV_VIEW||0))/40); }
function ccTvSay(bank){
  if(!bank || !bank.length || !CC_TV_WHO.length) return;
  const who=CC_TV_WHO[Math.floor(Math.random()*CC_TV_WHO.length)];
  CC_TV_CHATTERS.add(who.who);
  ccTvPush({who:who.who, c:who.c, b:who.b, text:bank[Math.floor(Math.random()*bank.length)]});
}
// Строка своим текстом — от случайного человека в чате.
function ccTvSayText(text){
  if(!text || !CC_TV_WHO.length) return;
  const who=CC_TV_WHO[Math.floor(Math.random()*CC_TV_WHO.length)];
  CC_TV_CHATTERS.add(who.who);
  ccTvPush({who:who.who, c:who.c, b:who.b, text:String(text)});
}
// Таблица донатеров эфира: кто сколько занёс (сабы по CC_TV_SUB_USD и донаты), тройка сверху.
function ccTvLeadHTML(){
  const rows=Object.entries(CC_TV_TOP||{}).sort((a,b)=>b[1]-a[1]).slice(0,3);
  if(!rows.length) return '';
  return '<b>'+esc(L().ccTvTopDonors)+'</b>'+rows.map(([who,m],i)=>
    '<span><i>'+(i+1)+'</i>'+esc(String(who).slice(0, 10))+'<em>$'+Math.round(m)+'</em></span>').join('');
}
// Аптайм как на Twitch — часы:минуты:секунды.
function ccTvUptime(sec){
  const h=Math.floor(sec/3600), m=Math.floor(sec%3600/60), s=sec%60;
  return h+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
}
/* ЧАТ СМОТРИТ ИГРУ — правка: «чат реалистичней сделать: когда
   выбор, то в чате что-то подобное, и после победы www или goat».

   Вопрос по ходу матча (ccChoiceBox) чат видит и начинает советовать: часть
   строк — названия самих вариантов, выкрикнутые как в чате («ХАЙГРАУНД»,
   «Рефреш!!!»), часть — общее «не тупи», «слушай чат». На выбор отвечает
   («траст», «нооооо»), на исход — «W КОЛЛ» или «говорил же». Всё через
   ccTvSay/ccTvSayText, то есть теми же людьми и в тот же чат; вне эфира и без
   рамки молчит. Названия вариантов приходят уже на языке экрана. */
function ccTvLive(){ return CC_STREAM_LIVE && !!document.getElementById('ccTvFrame'); }
function ccTvShout(t){
  const s=String(t||'').trim(); if(!s) return '';
  const r=Math.random();
  return r<0.35 ? s.toUpperCase() : r<0.6 ? s+'!!!' : r<0.8 ? s+' '+s : s.toLowerCase();
}
function ccTvOnChoice(options){
  if(!ccTvLive()) return;
  const T=L();
  const titles=(options||[]).map(o=>o && o.title).filter(Boolean);
  const n=3+Math.floor(Math.random()*3);
  for(let i=0;i<n;i++){
    if(titles.length && Math.random()<0.6) ccTvSayText(ccTvShout(titles[Math.floor(Math.random()*titles.length)]));
    else ccTvSay(T.ccTvChatChoice);
  }
}
function ccTvOnChosen(o){
  if(!ccTvLive()) return;
  const T=L();
  ccTvSay(T.ccTvChatPicked);
  if(o && o.title && Math.random()<0.5) ccTvSayText(ccTvShout(o.title));
  if(Math.random()<0.5) ccTvSay(T.ccTvChatPicked);
}
function ccTvOnResult(ok){
  if(!ccTvLive()) return;
  const T=L();
  const bank=ok===false ? T.ccTvChatCallBad : ok ? T.ccTvChatCallGood : null;
  if(!bank) return;
  ccTvSay(bank); ccTvSay(bank);
  if(ok) CC_TV_HYPE+=0.2;
}
// Событие канала: фолловер, саб, донат. Копится в CC_TV_EV — это и есть то, что
// вечер потом зачтёт (см. ccStreamCupAfter).
function ccTvEvent(kind, amt, say){
  const T=L();
  if(!CC_TV_WHO.length) return;
  const who=CC_TV_WHO[Math.floor(Math.random()*CC_TV_WHO.length)];
  if(kind==='fol'){
    CC_TV_EV.fol++;
    if(say!==false) ccTvPush({ev:'fol', text:T.ccTvEvFollow(who.who)});
    // Алерт не на каждого: у крупного канала фолловеры идут пачками. См. CC_TV_AL_EVERY.
    if((++CC_TV_AL_N)%CC_TV_AL_EVERY===0) ccTvAlert('fol', T.ccTvAlFollow, who.who);
  } else if(kind==='sub'){
    CC_TV_EV.subs++; CC_TV_EV.cash+=CC_TV_SUB_USD;
    CC_TV_TOP[who.who]=(CC_TV_TOP[who.who]||0)+CC_TV_SUB_USD;
    ccTvPush({ev:'sub', text:T.ccTvEvSub(who.who)});
    ccTvAlert('sub', T.ccTvAlSub, who.who);
  } else {
    const m=amt||CC_TV_DONO[Math.floor(Math.random()*CC_TV_DONO.length)];
    CC_TV_EV.cash+=m;
    CC_TV_TOP[who.who]=(CC_TV_TOP[who.who]||0)+m;
    const lines=T.ccTvDonoLines||[];
    const note=lines.length ? lines[Math.floor(Math.random()*lines.length)] : '';
    ccTvPush({ev:'dono', text:T.ccTvEvDono(who.who, m), note:note});
    ccTvAlert('dono', T.ccTvAlDono(who.who, m), note);
  }
}
/* Сколько событий на тик. Бюджет вечера — те же числа, что в ccStreamCupAfter
   (фолловеры v·0.25·beat, деньги v·0.06·beat), делённые на ожидаемое число
   тиков; хайп после хороших игр ускоряет, всплеск после победы (CC_TV_BURST)
   даёт несколько фолловеров подряд — так это и выглядит на настоящем эфире.
   Деньги пополам: сабы по 2.5 и донаты со средним чеком около двенадцати. */
function ccTvEvents(board, games){
  const v=CC_TV_VIEW;
  let beat=0.5;
  if(board && board.of>1) beat=1-(board.place-1)/(board.of-1);
  const ticks=Math.max(60, (games||11)*CC_TV_TICKS_PER_GAME);
  const folBudget=v*0.25*beat*ccTwFolRate(CAREER && CAREER.career ? CAREER.career.twitch : 0), cashBudget=v*0.06*beat;
  let pFol=folBudget/ticks*(1+0.5*CC_TV_HYPE)+(CC_TV_BURST>0 ? 0.5 : 0);
  /* Фолловеры считаются все, а строкой в чат идёт не каждый: у канала на
     десять тысяч зрителей их по пять на тик, и чат состоял бы из одного
     «подписался». Одна строка на тик, и не на каждый — как у настоящего
     чата, где оповещения тонут в сообщениях. */
  let nFol=0;
  while(pFol>0){ if(Math.random()<Math.min(1, pFol)) nFol++; pFol-=1; }
  if(nFol){ CC_TV_EV.fol+=nFol-1; ccTvEvent('fol', null, Math.random()<0.4); }
  const pSub=(cashBudget*0.5/CC_TV_SUB_USD)/ticks*(1+0.5*CC_TV_HYPE);
  if(Math.random()<pSub) ccTvEvent('sub');
  const pDono=(cashBudget*0.5/12)/ticks*(1+CC_TV_HYPE);
  if(Math.random()<pDono) ccTvEvent('dono');
  CC_TV_BURST=Math.max(0, CC_TV_BURST-1);
}
function ccTvTick(){
  const box=document.getElementById('ccTvFrame'); if(!box) return;
  const T=L(), you=CC_TV_YOU;
  const log=(you && you.stageLog) || [];
  /* Обычный эфир: игр нет, таблицы нет — вечер меряется временем (см. ccStreamRun).
     Доля прошедшего эфира правит и зрителями (они набегают и расходятся к концу), и
     тем, как раздаются фолловеры с деньгами этого дня. */
  const plain=CC_TV_PLAIN;
  if(plain) plain.at++;
  const pp=plain ? Math.min(1, plain.at/plain.ticks) : 0;
  // Новая игра в логе — это то, что зрители только что посмотрели.
  while(CC_TV_SEEN<log.length){
    const g=log[CC_TV_SEEN++]||{};
    const p=g.place||0;
    if(p===1){
      CC_TV_HYPE+=1.2; CC_TV_BURST=4;
      // Победа — это спам: полдюжины строк подряд, и среди них обязательно «W».
      for(let k=0;k<Math.max(2, Math.round(6*ccTvChatRate()));k++) ccTvSay(T.ccTvChatWin);
      ccTvSayText('W'.repeat(3+Math.floor(Math.random()*6)));
      ccTvSayText(Math.random()<0.5 ? 'GOAT' : 'W W W W W');
      if(Math.random()<0.6) ccTvEvent('dono');
    }
    else if(p && p<=5){ CC_TV_HYPE+=0.45; ccTvSay(T.ccTvChatGood); }
    else if(p && p>=25){ CC_TV_HYPE=Math.max(0, CC_TV_HYPE-0.25); ccTvSay(T.ccTvChatBad); }
    else ccTvSay(T.ccStreamChatLines);
  }
  if(Math.random()<0.55*ccTvChatRate()) ccTvSay(T.ccStreamChatLines);
  const board=ccTvBoard();
  // Черта отсечки — событие эфира: чат замечает, когда ты в неё входишь и
  // когда из неё вываливаешься, а не только конец игры.
  if(board && board.cut){
    const now=board.place<=board.cut;
    if(CC_TV_INCUT!==null && now!==CC_TV_INCUT) ccTvSay(now ? T.ccTvChatGood : T.ccTvChatBad);
    CC_TV_INCUT=now;
  }
  /* Зрители: вечер сам по себе набирает, хорошая игра набирает быстрее, а
     место в таблице держит их у экрана. Турнир смотрят из-за таблицы — если
     ты в отсечке, эфир растёт, если вывалился, зрители расходятся. */
  let seat=0;
  if(board && board.of>1){
    const beat=1-(board.place-1)/(board.of-1);
    seat=(beat-0.5)*1.2;
    if(board.cut) seat+=(board.place<=board.cut ? 0.35 : -0.2);
  }
  // Обычный эфир набирает к середине и расходится к концу — горб вместо места в таблице.
  if(plain) seat=0.5*Math.sin(Math.PI*pp);
  const want=CC_TV_BASE*Math.max(0.4, 1+0.05*log.length+0.3*CC_TV_HYPE+seat)*(0.95+Math.random()*0.1);
  CC_TV_VIEW=Math.max(3, Math.round(CC_TV_VIEW+(want-CC_TV_VIEW)*0.5));
  CC_TV_PEAK=Math.max(CC_TV_PEAK, CC_TV_VIEW);
  // Замер для сводки: средний онлайн и кривая. Кривая не длиннее 240 точек —
  // при переполнении прореживается вдвое, форма вечера остаётся.
  CC_TV_SUM.n++; CC_TV_SUM.sum+=CC_TV_VIEW;
  CC_TV_HIST.push({v:CC_TV_VIEW, g:log.length});
  if(CC_TV_HIST.length>240) CC_TV_HIST=CC_TV_HIST.filter((x,i)=>i%2===0);
  const games=board && board.n ? board.n : 0;
  /* У обычного эфира события НЕ выдумываются: фолловеры и деньги этого дня уже
     посчитаны (streamLast), и рамка раздаёт ровно их — долю за тик. Поэтому
     общий бюджет ccTvEvents здесь не работает. */
  if(plain){
    // Событие эфира, если оно назначено на этот тик (см. ccStreamHappenings).
    while(plain.hap.length && plain.hap[0].at<=plain.at) ccStreamHappen(plain.hap.shift());
    const share=Math.max(0, pp-plain.done); plain.done=pp;
    let fol=Math.round(plain.want.fol*share);
    plain.folAcc=(plain.folAcc||0)+plain.want.fol*share-fol;
    if(plain.folAcc>=1){ fol++; plain.folAcc--; }
    for(let i=0;i<fol;i++) ccTvEvent('fol', null, i===0 && Math.random()<0.6);
    plain.cashAcc=(plain.cashAcc||0)+plain.want.cash*share;
    while(plain.cashAcc>=CC_TV_SUB_USD){
      if(Math.random()<0.5){ ccTvEvent('sub'); plain.cashAcc-=CC_TV_SUB_USD; }
      else { const m=Math.min(Math.round(plain.cashAcc), 25); if(m<1) break; ccTvEvent('dono', m); plain.cashAcc-=m; }
    }
  } else {
    ccTvEvents(board, games);
    if(CC_TV_CUPX){ CC_TV_CUPX.n++; while(CC_TV_CUPX.hap.length && CC_TV_CUPX.hap[0].at<=CC_TV_CUPX.n) ccStreamHappen(CC_TV_CUPX.hap.shift()); }
  }
  const set=(id,html)=>{ const el=document.getElementById(id); if(el) el.innerHTML=html; };
  set('ccTvV', ccNum(CC_TV_VIEW)); set('ccTvV2', ccNum(CC_TV_VIEW));
  const sec=Math.max(0, Math.floor((Date.now()-CC_TV_T0)/1000));
  set('ccTvUp', Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0'));
  set('ccTvUp2', ccTvUptime(sec));
  set('ccTvSubs', esc(T.ccTvSubsToday(CC_TV_EV.subs)));
  set('ccTvLead', ccTvLeadHTML());
  const lastG=log.length ? log[log.length-1] : null;
  const bar=document.getElementById('ccTvBar');
  if(bar) bar.style.width=(games ? Math.min(100, Math.round(log.length/games*100)) : 0)+'%';
  set('ccTvRun', !log.length ? esc(T.ccTvWait)
    : '<b>'+esc(games ? T.ccTvGameOf(log.length, games) : T.ccTvGame(log.length))+'</b>'+
      (lastG && lastG.place ? '<span>'+esc(T.ccTvLast(lastG.place))+'</span>' : '')+
      '<span>'+esc(T.ccTvPts(you.stagePts||0))+'</span>'+
      '<span>'+esc(T.ccTvKills(you.stageElims||0))+'</span>'+
      ((you.wins||0) ? '<span class="cc-tvm-w">'+esc(T.ccTvWins(you.wins))+'</span>' : ''));
  /* Вечер целиком одной строкой — по квадратику на игру, цветом за место:
     виктория золотая, топ-5 зелёный, топ-15 синий, остальное тусклое. Это то,
     что на трансляции показывают между играми, и то, чего нет ни в таблице,
     ни в счётчике: как шёл ВЕЧЕР, а не чем он кончается. */
  const pips=document.getElementById('ccTvPips');
  if(pips){
    const cls=p=>p===1?'w':p<=5?'a':p<=15?'b':'c';
    pips.innerHTML=log.map(g=>'<i class="'+cls(g.place||99)+'" title="#'+(g.place||'?')+'"></i>').join('')+
      (games>log.length ? Array(games-log.length).fill('<i class="n"></i>').join('') : '');
  }
  /* Табло: тройка лидеров и своя строка — то, что показывает любая
     трансляция. Своя строка стоит всегда, даже если ты не в тройке: смотрят
     ради неё. Отсечка красит её — в квоте или мимо. */
  if(board){
    const inCut=board.cut ? board.place<=board.cut : null;
    // Имя команды в поле несёт разметку (флаги картинками) — табло берёт текст.
    const bare=s=>String(s||'').replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim();
    const rowHTML=(n, name, pts, me)=>
      '<div class="cc-tvm-row'+(me?' me':'')+'"><i>'+n+'</i><b>'+esc(bare(name).slice(0, 22))+
      '</b><em>'+ccNum(pts)+'</em></div>';
    set('ccTvBoard',
      board.top.map((r,i)=>rowHTML(i+1, r.name, r.p, r.you)).join('')+
      (board.top.some(r=>r.you) ? ''
        : rowHTML(board.place, you.name||'', board.pts, true))+
      (board.cut ? '<div class="cc-tvm-cut'+(inCut?' in':' out')+'">'+
         esc(T.ccTvCut(board.cut, board.of))+'</div>' : ''));
  }
  set('ccTvEv', esc(T.ccTvEvSum(CC_TV_EV.fol, CC_TV_EV.subs, Math.round(CC_TV_EV.cash))));
  set('ccTvChat', CC_TV_MSGS.map(m=> m.ev
    ? '<div class="cc-tvm-msg cc-tv-ev-'+m.ev+'">'+esc(m.text)+(m.note ? '<span>'+esc(m.note)+'</span>' : '')+'</div>'
    : '<div class="cc-tvm-msg">'+(m.b ? '<i class="cc-tv-bdg '+m.b+'"></i>' : '')+
      '<b style="color:'+esc(m.c)+'">'+esc(m.who)+'</b>: '+esc(m.text)+'</div>').join(''));
  set('ccTvPeak', esc(T.ccTvPeak(ccNum(CC_TV_PEAK))));
  const chat=document.getElementById('ccTvChat');
  if(chat) chat.scrollTop=chat.scrollHeight;
  /* И то, чем обычный эфир отличается от турнирного: вместо счёта по играм —
     часы, вместо табло — ничего. Ставится последним, поверх «ждём вечера». */
  if(plain){
    const h=Math.min(plain.hours, Math.round(plain.hours*pp*10)/10);
    if(bar) bar.style.width=Math.round(pp*100)+'%';
    if(plain.watch){
      ccWatchStep(plain);
      const w=plain.watch;
      set('ccTvRun', '<b>'+esc((w.ev && (w.ev.label||w.ev.title))||'')+'</b>'+
                     '<span>'+esc(T.ccTvGameOf(w.n, w.games))+'</span>'+
                     '<span>'+esc(T.ccTvHours(h, plain.hours))+'</span>');
      set('ccTvBoard', ccWatchBoardHTML(plain)); set('ccTvPips', ccWatchPipsHTML(plain));
    } else {
    set('ccTvRun', '<b>'+esc(L()['ccStream_'+plain.id]||'')+'</b>'+
                   '<span>'+esc(T.ccTvHours(h, plain.hours))+'</span>'+
                   '<span>'+esc(T.ccTvPeak(ccNum(CC_TV_PEAK)))+'</span>');
    set('ccTvBoard', ''); set('ccTvPips', '');
    }
    if(pp>=1) ccStreamRunEnd();
  }
}
/* ---- Кто в эфире прямо сейчас -----------------------------------------------

   Витрина Twitch — это не список, а комната: живые каналы с числом зрителей и
   категорией. Здесь она собрана из того, что в моде уже есть: люди сцены
   (у них портреты и настоящие ники) и креаторы (у них настоящие аудитории с
   Twitch). Кто именно в эфире — бросок, посеянный ДНЁМ: за день витрина не
   меняется от перерисовки, а завтра она другая. */
const CC_STREAM_CATS=['ccStreamCatFn','ccStreamCatChat','ccStreamCatRanked','ccStreamCatCreative'];
function careerLiveNow(n){
  const cr=CAREER && CAREER.career; if(!cr) return [];
  const rnd=careerRng(ccHashStr('live|'+(cr.season||1)+'|'+careerToday()));
  const out=[];
  /* Зрителей — доля базы, и доля МАЛЕНЬКАЯ. Живой Twitch: у канала с двадцатью
     миллионами подписчиков обычный вечер это десятки тысяч смотрящих, а не
     сотни. Четыре десятых процента с разбросом дают как раз этот порядок. */
  const cre=(typeof ccProAmCreators==='function') ? ccProAmCreators() : [];
  const creRows=[];
  cre.forEach(name=>{
    const f=(typeof ccProAmFollowers==='function') ? ccProAmFollowers(name) : 0;
    if(!f) return;
    if(rnd()>0.55) return;                       // не все в эфире каждый день
    creRows.push({name:name, f:f, creator:true, ava:ccProAmAvatar(name),
              v:Math.max(20, Math.round(f*0.004*(0.5+rnd()))),
              cat:CC_STREAM_CATS[Math.floor(rnd()*CC_STREAM_CATS.length)]});
  });
  // И сцена: те же карточки, что играют вечерами, с их портретами.
  const proRows=[];
  let roster=[];
  try{ roster=careerRosterNowEU().slice(0, 60); }catch(e){ roster=[]; }
  roster.forEach(p=>{
    if(rnd()>0.25) return;
    const ovr=(p._ovr!=null?p._ovr:(attrsFor(p)||{}).ovr)||70;
    proRows.push({name:p.handle, card:p, f:0,
              v:Math.max(8, Math.round((ovr-60)*40*(0.4+rnd()))),
              cat:CC_STREAM_CATS[Math.floor(rnd()*CC_STREAM_CATS.length)]});
  });
  /* Витрина — ПОПОЛАМ. Если просто отсортировать по зрителям, сцену не видно
     вовсе: у любого креатора аудитория на два порядка больше, чем у про.
     А смысл экрана в том, чтобы игрок видел и тех и других: креаторы — с кем
     можно стримить, про — с кем он завтра играет. */
  creRows.sort((a,b)=>b.v-a.v);
  proRows.sort((a,b)=>b.v-a.v);
  const half=Math.ceil((n||12)/2);
  out.push(...creRows.slice(0, half), ...proRows.slice(0, (n||12)-half));
  return out.slice(0, n||12);
}
/* Насыщение канала. Обе формулы — «зрители от фолловеров» (6 %) и «фолловеры от
   зрителей» (18 % за эфир, 25 %·место за турнирный) — были линейными, и вместе
   давали сложный процент: 2–4 % в день эфира, ×50 000 за год. К полутора годам
   карьеры сводка показывала 12 миллионов среднего онлайна и +14 миллионов
   фолловеров за вечер — его «слишком много стримы онлайн, такого не может быть»
   (страница «bags 13.09», Мейджор 1 · финал · место 4 из 50).

   У настоящего Twitch обе доли падают с ростом канала: у канала на тысячу
   фолловеров онлайн 3–6 % от них, у Clix (≈3 млн) — меньше процента; и новых
   фолловеров за день у него доли процента, а не проценты. Корень квадратный от
   размера: онлайн 6 % → 3.5 % при 100k → 0.8 % при 3 млн; фолловеры за эфир —
   18 % зрителей у маленького канала, 3 % у канала размером с Clix. Прирост в
   день эфира: 1 % на тысяче, 0.4 % на ста тысячах, 0.03 % на трёх миллионах —
   канал растёт, но не взрывается. Проба: tools/career-twitch-probe.js. */
const CC_TW_SAT={view:50000, fol:100000};
// ==== CC_PRO_SOCIAL (tools/build-pro-socials.js) ====
const CC_PRO_SOCIAL={"1lusha":[8924,1500,17666],"1lushafn":[8924,1500,17667],"27q8":[5614,1370,1188],"2faulty":[0,0,1418],"2sngnl":[0,0,4557],"3jmy":[0,0,1136],"3mory":[888,345,1092],"4drstorm":[14502,39500,34816],"4zr":[242405,91400,196855],"7eo":[0,0,3843],"7tor":[190262,686,27531],"916gon":[173354,98400,42505],"97default":[0,3840,24233],"a7mdo":[0,0,8],"a7mdrqx":[0,19900,6707],"a9far":[31377,2900,8872],"aaron":[458,2690,2010],"ab":[47900,807,9948],"abdulelah":[7719,0,7782],"abod":[0,0,365],"abodk":[0,0,1117],"abufal7":[84438,58800,17444],"ace1xx":[269,0,0],"acorn":[246375,75000,583135],"acrian":[424,0,1011],"adam":[0,0,843],"adapter":[12768,17700,8636],"adc":[288,0,532],"adity":[174,130,470],"adn":[17524,21400,44545],"adol":[0,614,610],"advise":[97196,98900,0],"adxm":[2769,0,0],"ady":[0,0,723],"agbays":[55,0,11],"aiden":[0,0,1856],"aim":[0,42500,61542],"aimbot.exe":[0,0,522],"aimhero_o":[15888,0,4836],"aircool":[1044690,2840,47837],"ajay":[0,0,4777],"ajerss":[118419,25200,117646],"akai":[15111,0,9142],"akiira":[72591,0,38026],"albaxna":[18022,0,17504],"albedo":[0,42500,66767],"ale":[104,0,827],"alecc":[49540,3210000,28965],"alex":[103408,10100,60128],"alexx":[0,0,732],"alice":[0,57700,57233],"allen":[4174,10800,22682],"alliege":[0,307000,339502],"aloe":[190,1960,3248],"alpha":[30629,1960,46774],"alvinir":[7564,9580,2091],"aminished":[12097,0,9869],"amozz":[11224,368,2306],"amplify":[0,15400,787],"anas":[95824,66400,283586],"anchor":[14417,0,1655],"andilex":[338908,0,261127],"andrew":[0,3330,0],"andyvencha":[0,0,72287],"angas":[0,0,236],"angel":[0,96,794],"animal":[36773,0,0],"ankido":[0,218,4111],"anon":[20645,40400,29739],"antorak":[37665,478,35661],"aoxy":[1206,8,2592],"apar":[0,406,1232],"aqua":[476006,327000,0],"ardit":[0,843,0],"arion":[4427,323,1],"arisakaaa":[611940,758000,756292],"arius":[1069,0,13130],"ark":[33154,9230,22643],"arkhram":[213839,134000,202480],"arrest":[1901,139,892],"arrow":[43200,4510,14853],"art1st":[35692,1030,8198],"arthurbc":[0,0,1593],"artor":[116970,37300,63218],"artskill":[114636,57200,57040],"asa":[68563,7850,20079],"asfit":[101,3010,1835],"asianjeff":[1738386,237000,147587],"aspect":[58266,231,76630],"assault":[299490,251000,88479],"asta":[0,0,2779],"astell":[0,1320,2862],"aster":[0,482,1067],"astrosmz":[72409,7950,39834],"asuka":[0,648,2153],"athiel":[59,1120,0],"auvahalo":[1398,80,2859],"av":[76884,12600,45659],"avery":[141507,13100,5762],"avivv":[9,42800,33455],"axadasz":[36339,4740,20517],"axeforce":[2757,0,13839],"ayarbaffo":[521816,2090,57760],"az2m":[0,17300,4152],"azatgo":[0,840,2361],"aziz":[0,0,1781],"azizis":[6118,0,6022],"azizz":[725,0,1061],"ba7rb":[0,102,429],"baackup":[415,247,325],"bacca":[6340,1660,7491],"backho":[0,554,3868],"backtalk":[742,0,0],"bacon":[16947,1820,8309],"badsniper":[89324,0,143693],"bagu":[0,0,14128],"bahiense":[1507,101,696],"baily":[0,1980,9909],"balor":[0,6030,6278],"bankteller":[36571,2670,21636],"banny":[1325,0,3583],"barella":[36855,3140,12056],"barq":[301,0,1098],"barroso":[145593,51900,79588],"basil":[0,1360,11907],"bataco":[0,0,4110],"bateristam":[0,2970,0],"bathan":[0,0,9185],"batman bugha":[0,117000,484071],"batmanjoe":[0,65,3447],"battal":[0,0,941],"bayon":[0,0,2404],"bd":[0,0,3884],"bdawg":[0,21,2503],"beast":[2292,1370,0],"beastt":[0,0,1227],"beckthd":[1144,0,98],"bedin":[17,0,10601],"belaeu":[0,0,4914],"belusi":[135077,7180,28918],"benado":[0,0,6666],"benjyfishy":[4098434,74000,2247920],"bevvys":[11370,2590,19390],"birk":[0,649,2266],"bizzle":[345822,234000,599163],"blacha":[9389,1450,23429],"blackoutz":[1966330,27500,452925],"blacky":[23527,6970,51278],"blake":[389479,0,235830],"blakeps":[389471,0,235817],"blastr":[21638,9940,79782],"bleed":[3235,1050,2578],"blink":[377,171,867],"blizy":[741,0,1499],"bloomy":[26876,1400,24221],"bluzro":[3420,4620000,5509],"blynks":[0,0,36],"bob":[0,309000,117979],"bobo":[1696,0,2439],"bola":[0,0,4047],"boltz":[2340,260000,426627],"borsuk":[0,0,2600],"bot":[0,28900,44706],"bottodango":[0,0,2288],"boyer":[13828,23100,62971],"bqrbie":[32365,3770,2404],"br1ckzl":[0,560,5702],"brabo":[2801,357,1947],"braden":[132,0,1689],"braydz":[48878,71300,19579],"broken":[5958,1130,1374],"brook":[0,0,11169],"brunao":[117412,0,110179],"brush":[26002,19000,5028],"bruski":[0,121,649],"bryan":[288,310,725],"bryann":[0,0,4331],"brycx":[7420,3160,0],"bubak":[0,13800000,25799],"bucke":[933426,153000,670240],"bugha":[5478266,143000,1967022],"builder":[0,215,1467],"bulldogz":[0,0,4320],"bully":[217073,8650,78354],"bullyslayrr":[15231,2330,1144],"bumboy":[14162,0,5575],"buyuriru":[0,441000,176670],"buzzo":[6943,0,1908],"bykn":[3465,0,48725],"bylah":[49951,2590,12773],"c4rl":[0,18400,0],"cadet":[0,30,0],"cadu":[118314,44200,101655],"cafe":[0,2940,14949],"caleb":[0,0,6937],"cam":[0,2590,54745],"captainy":[1206,670,2896],"carlin":[7137,0,1976],"carrot":[3,1950,8014],"caryion":[52637,6850,13773],"casperinovic":[2984,594,5147],"caspersa":[1109,0,4244],"casqer":[3691,2880,14766],"cat":[2393,7070,5060],"catman":[0,186,1377],"cauzerz":[4418,2410,2564],"cazi":[8940,1050,7173],"cazz":[23568,3280,28542],"ceice":[211210,19900,185254],"ceneto":[1322,1280,4149],"cented":[352642,153000,824280],"centro":[0,0,554],"ceres":[0,0,920],"cesar":[0,1130,2170],"chainz":[0,180,231],"channce":[14170,6260,7069],"chap":[1313030,2150,577477],"chapix":[130632,20600,185228],"charlie":[0,0,4093],"charyy":[20609,13400,25617],"chase":[7417,27200,668],"chashy":[6396,724,3741],"cheapz":[18469,975,6843],"cheatiin":[297,0,9348],"cheetiin":[297,0,9351],"chele":[178,0,925],"chenkinz":[517,0,0],"chicken":[663,5250,1622],"chickenitza":[0,0,43558],"chickenoob":[0,0,1002],"chico":[4652,6610,29736],"chiffon":[0,2150,5181],"chimp":[17756,6700,6759],"chip":[0,2360,27],"chocoluv":[0,33300,35983],"chozay":[11524,2600,0],"chris":[912,0,8975],"chubs":[2125,2320,10239],"chuckxz":[1609,0,1665],"chukky":[4806,0,9366],"cigol":[0,0,1013],"cillic":[2091,785,3544],"cinxz":[0,968,657],"circ":[0,0,4503],"cizlucky":[21151,153,8545],"clapsy":[0,873,2235],"clayrixx":[121,752,1487],"clemens":[0,2920,15542],"clement":[128019,11800,77023],"clipnode":[94660,29600,53410],"clix":[8711847,1070000,2862661],"closr":[4617,584,1615],"clxxer":[0,21600,9624],"co1azo":[470829,95,127036],"coach chad":[0,0,420],"cobolt":[1560,0,1156],"coca":[0,0,7479],"codgenesis":[15320,7060,4077],"cold":[0,93000,506056],"coldy":[0,0,612],"colt":[535,167,1475],"commandment":[149582,0,131240],"compton":[0,0,482],"controller":[0,0,4606],"convic":[1173,1410,3953],"coolpenguin48":[2202,940,1801],"coop":[115088,41900,120186],"coope":[2144,2960,18],"cooper":[386805,150000,454063],"core":[19565,5550,10940],"cosa":[203,0,0],"costa":[85203,0,39740],"coverh":[0,0,1703],"covrezinn":[3292,72,841],"cozyozzie":[1718,0,0],"cr1nge":[7147,0,11127],"crackly":[0,8620,11009],"crank":[1371,0,803],"craqqem":[0,0,111],"creep":[0,1780,3214],"creepwtf":[0,1780,3214],"criizux":[281373,26100,0],"crimz":[27633,201,33258],"cringe":[67242,3820,21833],"criser":[2422,8,1638],"crmzn":[305,0,551],"crow vii":[42584,0,26910],"crps":[0,3450,17168],"crr":[214227,328000,487004],"crue":[17213,2170000,29563],"crumble":[2237,346000,3195],"crunchy":[0,1820,5684],"crusades":[1458,2780,3785],"crusti":[7954,0,12273],"crypty":[374,1130,1455],"cryzstl":[0,0,1867],"ctm":[0,0,366],"cubix":[265,0,600],"curly":[27231,4400,13433],"cursive":[12046,995,1023],"curve":[83471,0,32309],"cxshy":[2538,2160,3931],"cyclops":[2,841,1089],"cynical":[0,439,0],"cyperzz":[0,0,568],"czb":[0,967,5588],"czr":[29670,5,8192],"dabuel":[4626,2740,7059],"daddy":[0,421,0],"daddyfaisal":[4054,0,0],"damage.-13":[29102,0,15253],"danath":[82531,4120,22078],"dandepuzo":[14096,466,6298],"dandir":[10647,0,18404],"danicush":[0,12900,1233],"dantadntryr":[0,0,90],"dark":[73,37,0],"darkorino":[174,1150,1288],"darkos":[7991,719,4101],"darkxz":[0,443,0],"darm":[24572,91,27137],"darts":[0,2510,2559],"daruma":[0,1280000,1146496],"dash":[3,0,3334],"daxor":[8557,5500,6330],"daxthon":[1903,0,1748],"daydus":[0,3660,15001],"dcawesomer":[84904,25700,20362],"deadra":[3674,0,0],"death":[32633,12100,27574],"decay":[0,0,1931],"deckzee":[24558,19800,10875],"decyptos":[63397,6520,97764],"defiable":[7025,15400,8895],"degen":[26752,8070,54773],"dela":[0,0,18247],"demus":[18847,0,27934],"denn1sg0d":[0,0,253],"deroller":[22878,0,18934],"derox":[0,0,8484],"desire":[0,0,1046],"devious":[2352,0,5553],"devour":[484,0,0],"dexefite":[9303,8460,17259],"dexteriity":[5525,728,2345],"deymo":[0,686,3447],"deyy":[642894,0,302812],"diablo":[0,15900,0],"diamond":[157802,191000,140243],"diegogb":[119528,12500,58203],"digai":[0,0,19084],"digital":[9713,179000,1900],"diguera":[199504,0,143612],"dinus":[10203,0,5954],"dio":[0,0,1351],"district":[0,0,559],"ditrxx":[264100,27700,95353],"divine":[0,0,2204],"dks":[0,0,44029],"dog":[4366,1470,6356],"dokko":[5064,5350,3110],"dokn":[0,37600,0],"dolla":[0,406,4930],"dollarc":[179,74,372],"dolzeur":[3766,1070,3589],"domentos":[0,0,32399],"domo":[4768,4300,2096],"doniee":[116381,0,58016],"doom":[0,0,1195],"dopi":[233,0,565],"doxey":[4027,360,1993],"doxy":[0,312,550],"draftell":[0,0,3185],"dragonrg":[71716,4240,36964],"drakonz":[0,0,248484],"dream":[1837,696,7506],"drew":[0,594,370],"drey":[0,0,3695],"drg":[24544,17000,16017],"dubs":[0,8400000,682140],"dukez":[135058,0,0],"dyfs":[66900,0,10229],"dylan":[0,1460,0],"dylangodoy9":[13942,0,4719],"dylannx":[3,301,0],"dynamic":[4948,0,3467],"dyox":[12153,3310,21862],"echo":[0,0,226],"eclipsae":[29763,5100,0],"eclipse":[21153,3290,13187],"eclipsena":[0,0,1332],"edan":[0,419,2301],"edgey":[149689,42600,299667],"edison":[1104,8380,9119],"edroadtoglory":[128052,15200,111683],"edson":[97400,32500,34910],"efexy":[3790,7540,3936],"egrm":[9783,0,20353],"elitxe":[0,0,10691],"elmtd":[18032,0,10087],"elokratz":[17335,0,11418],"eltensy":[4162,522,3795],"elusive":[0,76,645],"emxxrr":[298578,0,0],"encrypted":[9999,153,4748],"endretta":[454844,132000,252673],"enough":[8279,33700,5813],"ente":[0,424,85],"envy":[7167,0,17174],"eomzo":[322218,1350,469229],"epikwhale":[672743,226000,823256],"eraser":[0,2550,3921],"erima":[0,236000,27104],"escaracho":[113405,0,3],"escdark":[4614,396,5086],"eshouu":[2655,303,3828],"eshz":[0,7270,8295],"ess":[0,25700,50155],"esteban":[2694,116,7],"etq":[0,0,11063],"eulogy":[0,15200,3167],"evilmare":[0,90,0],"evolved":[0,112,892],"evyn":[0,0,1650],"exe":[849,420,2707],"exotic":[0,0,215],"exoticz":[0,0,263],"extinct":[0,439,2625],"f1n4ik":[0,0,6992],"f1shyx":[0,378,7458],"f4bled taco":[0,0,504],"fa1zzy":[0,0,7948],"fab":[0,0,2027],"facu":[0,0,16206],"faded":[95589,24000,16026],"faisal":[0,38,0],"faki":[155772,21900,14634],"falcon":[0,0,602],"falconer":[4010,6750,29507],"falconly":[0,4700,17704],"fant":[11095,0,2162],"fares":[5563,10200,4907],"fastroki":[63339,6610,60125],"fatch":[8055,15400,14075],"fatla":[344,118,993],"favs":[12974,15400,44325],"faxfox":[0,17200,40361],"faxuty":[705065,6700,502002],"fazer":[82714,25500,74015],"feared":[1044,181,0],"feezle":[0,155,0],"felipersa":[280224,61500,175359],"felix":[2857,0,4018],"ferrrnando":[26556,26700,10789],"fex":[8902,1770,4381],"fey":[2,0,0],"fffakkz":[2920,1180,9227],"fhd":[42524,13000,28304],"filipe":[294501,179000,130066],"fire":[0,74900,116309],"fire228":[0,0,473],"firen":[1767,0,5679],"fisher":[0,0,95],"fishy":[0,59600,58619],"fito":[0,626,3444],"fjaa":[0,801,1168],"fks":[25725,13900,16615],"flacko":[0,81,389],"flecken":[1233,0,4340],"fleder":[0,11500,34810],"flenny":[0,0,268],"flickzy":[165662,28900,66472],"flikk":[145330,71100,150682],"flinty":[436,158,621],"flk":[72,36,0],"floki":[118624,78800,150813],"flowis":[37519,0,0],"fly":[0,0,399],"fnajen":[16198,1900,15116],"focus":[264,40,0],"foczka":[0,0,1751],"foppe":[675,0,5720],"forbes":[8826,5650,2060],"force":[0,0,12291],"fortik":[0,2330,3830],"forzen":[1430,71,2298],"fram":[0,5160,23474],"franek":[584,0,5175],"frans":[0,0,33679],"frapai":[9629,3220,7727],"frat":[0,434,0],"fray":[130182,13200,0],"fredoxie":[94562,9380,63002],"fredy":[23754,6880,8986],"freeze":[0,6270,16216],"frenzyfishy":[0,26300,4371],"friction":[0,0,29],"froggy":[1000,303,6059],"frosty":[256275,179000,0],"frxstyy":[0,0,2015],"fryst":[21410,8770,24620],"fu-fu panda":[0,17700,0],"funk":[99187,33300,47794],"funkbomb":[99187,33300,47794],"furious":[0,1160,123979],"fury legendary":[0,0,7082],"fuzeac":[33938,739,3196],"fuzettin":[10807,1950,4729],"fuzz":[1065,43,503],"fwexy":[0,8970,0],"g0dku":[468,114,393],"g13ras":[38986,23900,25539],"g5rc":[0,493,0],"gabe":[17982,2810,24976],"gabix":[49652,3510,9758],"gabrielh99":[0,0,28666],"gabzera":[54640,0,17469],"gallaxypk":[0,0,134],"gandhi":[450,85,2373],"gangi":[1008,462,2445],"gary":[5195,5950,3704],"gazer":[12037,0,3554],"gemz_":[0,230,710],"gepard":[0,0,1271],"gheez":[574,20900,7798],"ghonzo":[9712,0,8927],"ghost":[7946,2600,7829],"gille":[0,0,197],"glace":[44793,15400,9643],"glubschi":[4537,1100,10206],"gmoney":[148177,83200,44567],"gntl":[230801,262000,105393],"goatt":[0,0,610],"godrabbit":[0,1750,0],"goeg":[0,0,1256],"goki":[0,0,2133],"goku":[3750,663,3989],"gold":[0,0,6804],"golden":[0,0,3690],"goma":[0,1140,3190],"gonzalo":[0,1850,5744],"gooboz":[0,319000,12912],"goofy":[21317,7830,6931],"goosh":[0,646,556],"gord":[8,327,325],"goromaru":[0,0,901],"grandmateets":[0,1410,6353],"grazca":[7110,1530,0],"griff":[9144,0,3167],"grim":[0,0,584],"gripey":[175253,26900,22800],"grolzz":[31038,2600,12334],"grx":[0,5790,10009],"gu1 prime":[4491,0,1534],"guneves":[3,0,25324],"gustavo":[2254,0,0],"gutinho":[3588,878,1629],"gxt":[21685,2160,16583],"h.man":[2894,1310,2771],"h4wwk":[62141,14700,29822],"habiebsh":[0,25300,0],"hajie":[1,980,291],"hajuu":[0,9520,3588],"hamuppi":[0,221000,126316],"happed":[1595,1480,2381],"hardfind":[0,289000,47745],"harukiyo":[0,124000,91251],"hawk":[411,529,1742],"hazard":[1040,308,744],"hazthagreat":[69102,19400,31878],"hazzense":[0,1300,7341],"hbn":[0,0,187],"hcube":[5299,0,3486],"he-stin":[0,5330,10356],"heatzy":[114053,50200,0],"hedra":[0,2660,18449],"heif":[0,0,8332],"hellfire":[10356,2550,32443],"hellonsteam":[18380,5400,14018],"hen":[216733,62400,254883],"henchman":[0,0,3053],"henth":[0,2460,3892],"hern":[0,31,196],"hero":[40536,21400,19290],"herrions":[12149,0,4512],"hezzaar":[216,248,572],"higgs":[0,117000,484088],"highr":[2574,6570,4810],"highsky":[80161,4190,51253],"hijoe":[59094,15200,30188],"hiro":[0,3910,16204],"histtory":[0,0,88790],"hizixx":[7312,1190,4914],"hlechis":[9877,0,3301],"hmb":[16835,2210,0],"holtay":[0,0,10],"hood.j":[6094,1470,5112],"hookka":[1445,771,0],"hop":[2052,511,584],"horde":[7,0,388],"hottie":[6792,1040,8435],"hov":[1951,928,4292],"howdy":[0,397,1005],"howly":[20945,0,10017],"hris":[6378,4120,16264],"hulks":[0,0,1381],"hunter":[0,101000,181770],"hurtyn":[201,91,273],"huty":[71559,23800,32352],"hxvac":[624,388,1383],"hycr1s":[42581,1930,22580],"hydra":[0,0,1815],"hydro":[0,0,529],"hype":[400,3810,1],"hyper":[0,742,1297],"i4xpro":[0,3710,5647],"ib":[0,623,1245],"ibooohai":[28505,0,19219],"icee":[3446,1070,5438],"iciev":[581,0,1672],"icy":[2202,940,1801],"icyfai":[3229,227,1214],"idrop":[49124,50600,449885],"iexon":[0,0,7296],"ifly":[0,438,0],"ifr0zi":[5379,18,2237],"igna":[18396,1350,0],"ikoedr":[159,4750,846],"illest":[0,76700,0],"immp":[0,0,94],"inact":[0,0,4612],"insano":[0,0,7432],"inyy":[0,0,1914],"ion":[0,0,262],"irezumi":[79237,2020,14741],"issa":[371531,332000,0],"itay":[0,2340,376],"itemm":[2111,0,33020],"itrol":[3824,0,8384],"izo":[0,465,661],"izuki":[0,0,8814],"izzi":[5829,0,10929],"jace":[8816,2730,11370],"jackz":[0,0,12],"jaemon":[0,7770,15504],"jag":[0,0,580],"jagareet":[0,311,1175],"jagveer":[718,39,0],"jahlyn":[15033,61000,12404],"jahq":[80527,25900,61867],"jai":[853,0,112],"jairo":[1655,181,1364],"jakebuca":[4283,12800,7608],"jakei":[980,2790,8158],"jamieegod":[0,252,0],"jammyz":[34919,746,17164],"jamper":[121016,58100,116219],"jannisz":[574419,150000,425850],"japko":[52233,0,40697],"jaqck":[9,923,4842],"jargue":[2080,1320,3144],"jarko":[42161,2830,11007],"jarkos":[53928,0,17712],"jaspaay":[2439,47900,8427],"jaus":[2182,0,1504],"javery":[2467,0,1735],"jawad":[0,0,2027],"jax":[498,0,1169],"jaxenj":[0,0,1840],"jay":[0,11600,40863],"jayrosez":[2817,0,2110],"jays":[0,0,10965],"jayse1x":[6324,0,4212],"jeffers":[0,0,1053],"jelty":[3114608,117000,690452],"jemitty":[0,0,1712],"jerald":[0,0,4318],"jerok":[235,0,544],"jesse":[3139535,6430000,205382],"jetsku":[0,405,2193],"jeulzz":[7576,0,1405],"jhk":[0,422,0],"jiren":[0,887,1641],"jkreet":[2635,374,3547],"job":[0,10600,25786],"joey":[1925,267,1018],"joey jenner":[0,3330,0],"joji":[160119,5550,54513],"jojofishy":[1390,0,1957],"jordan":[3139535,6430000,205382],"joseeh":[0,0,53457],"josh":[39654,38000,31639],"joshbot":[0,36,1233],"joysick":[112,0,0],"joyza":[13007,3520,14137],"jozya":[13007,3520,14137],"jpsk1ng":[13,0,19461],"jules":[3543,0,9684],"juliancom":[173643,69500,18628],"julle":[2823,2410,4828],"jur3ky":[151769,0,110684],"jurdy":[8234,3580,4220],"justice":[10674,8980,14051],"juu":[45483,12800,44548],"jvano":[0,0,3066],"jxsn":[0,36100,3883],"jynx":[277576,73300,53726],"k1ng":[2143129,105000,571477],"k1nzell":[73457,52300,0],"k9":[0,52,816],"kaan":[11329,0,12658],"kaboo":[4006,920,0],"kacpi":[0,0,1512],"kadenox":[0,226000,0],"kagetora":[0,3730,0],"kai":[33981,0,25308],"kaido":[0,0,583],"kakarot":[7728,906,4344],"kalgamer":[3359,2190,5527],"kaliper":[2831,930,1764],"kalki":[0,0,554],"kametin":[0,0,9097],"kami":[420779,142000,269645],"kana":[0,3730,10098],"kappa":[0,3370,2187],"karma":[124729,0,42434],"karmy":[0,877,9705],"kartun":[0,1810,7439],"kaspr":[19093,442,4540],"kauazinwyy":[134,0,558],"kaxie":[13159,1930,4263],"kayez":[163,528,174],"kbr":[0,0,48472],"kchorro":[157618,33100,50719],"kefyy":[8,0,25321],"keicox":[9555,0,4006],"kejser":[0,0,40399],"kenshi":[1056,0,4792],"kentach":[0,6280,22703],"keto":[210,164,0],"kewl":[0,51,3056],"keys":[83378,650000,31048],"keziix":[0,2110,34042],"kezzaa":[0,0,234],"khaloofi":[0,0,447],"khan":[0,0,351],"khanada":[940125,414000,888318],"kickz":[162,143,809],"kiduoo":[0,6100,17443],"kielba":[1463,0,2439],"kiire":[47489,0,14166],"kika":[14234,0,1955],"kikoo":[134942,137000,54852],"killerbxy":[0,0,1018],"kilua":[0,2230,7055],"kimchi":[199,67700,226359],"kimkana":[0,0,15519],"kimmy1":[0,66,331],"king":[644801,173000,238671],"kingaling":[0,0,11324],"kinstaar":[0,910000,401816],"kiox":[1313,458,957],"kiraah":[0,1530,0],"kirb1":[4099,0,5501],"kirillian":[0,68000,14963],"kiritokun":[10062,16500,25376],"kiro":[0,6950,12599],"kiryache32":[214515,0,106685],"kitoz":[0,56000,116616],"kizers":[2138,6,3505],"kjs":[0,98,440],"klass":[0,0,15947],"klinberi":[5492,1080,3624],"klixey":[0,3830,6046],"klopz":[0,740,0],"klose":[0,299,0],"klown":[1831,557,7915],"kloxic":[390,818,0],"klusia":[3975,151000,20143],"kn1pher":[0,0,25882],"knight":[0,2240,50059],"koa":[0,6030,9526],"kodex":[0,0,2065],"kodi":[64377,0,12171],"kogane":[0,29000,22414],"kolorful":[0,1710,0],"komanderk":[129,0,219],"kombek":[0,1050,20997],"kono":[0,2100,33438],"korq":[5702,496,0],"kosov":[0,0,1252],"kosqf":[0,0,667],"kovaaksxd":[14810,3260,16002],"koyota":[0,147000,141846],"kpzet":[1090,342,3185],"kquid":[52844,52400,23175],"kraez":[0,2400,17130],"kreo":[385179,0,0],"krisp":[2199,2710,6198],"krool":[10474,2400,7937],"krreon":[0,0,8979],"kruyor":[2245,1190,1744],"krypas":[7945,278,2147],"kube":[197,0,383],"kubx":[0,0,97311],"kuda":[176,157,1019],"kuki":[7290,13100,23],"kulb":[1904,110,1887],"kuma":[0,270,1630],"kumo":[806,3600,5075],"kurama":[115594,110,30790],"kurara":[0,18400,154989],"kuren":[0,13700,42109],"kurtz":[79083,27100,0],"kurukuru":[0,4040,18131],"kuta":[0,629,820],"kwah":[0,0,11402],"kwanti":[28061,2590,266876],"kwolit":[0,1300,755],"kxvin1x":[0,510,1389],"kxyin":[0,0,1763],"kylie":[36424,6010,63915],"kylix":[62483,136000,106198],"kyry":[41402,1520,14659],"kyto":[7104,0,3673],"kytrex":[19467,13400,4796],"kyzen":[195523,171,59929],"kyzui":[47,21000,9653],"l0wk3y":[4205,722,5497],"l1nk":[52158,0,0],"lacy":[3508915,22600,633320],"lagarto":[0,0,4],"larccoz":[883,0,1039],"lark":[0,0,1211],"larson":[38714,2590,0],"lasers":[326789,3030000,218984],"lawrence":[6184,0,13431],"lazarp":[16369,25400,19357],"lazy":[0,365,2001],"lbworks":[0,7720,16384],"ldamiens":[0,0,348],"leekura":[0,0,222],"lefteye":[9978,2870,12757],"legedien":[4805,148000,0],"lekmaluco":[47973,93,0],"leleo":[694799,734000,398581],"leno":[1204,0,7474],"leo":[0,0,4890],"leobas":[33664,0,0],"leobestie":[0,281,423],"leonyfishy":[214,528,1656],"leonzhett":[0,604,7432],"leq":[11,0,62],"letshe":[1820527,626000,455022],"lettuce":[0,80300,62602],"letw1k3":[247272,0,6],"letz":[18010,3850,6331],"lewa":[36481,75,17157],"lexqss":[0,0,6612],"leyyner":[1803,433,4636],"lezix":[11218,2110,8640],"lgndrybanana":[0,2300,632],"liimaa":[0,0,4040],"lime":[3425,92,531],"link":[1271,3730,8503],"linx":[6356,893,21],"liquid":[0,0,291],"listen":[780,3770,1292],"little":[1840,0,12954],"litzinio":[284,0,1015],"liwshe":[0,0,13714],"lixium":[36994,12800,22191],"lljft":[1182,974,1309],"lmao":[0,0,95],"lnuef":[4,3950,17976],"lodstk":[0,9410,18552],"loki":[4749,1650,2354],"lolb0om":[51215,12400,21469],"lollicker":[0,136,249],"looter":[0,131000,88417],"lorax":[0,0,26923],"lord":[17685,880,11381],"losted":[4020,0,7722],"louis":[74442,44000,38767],"loxxx":[0,0,2197],"lozer":[58,462,2282],"lucas":[2742,0,2572],"lucci":[0,1340,2701],"lucid":[1457,0,606],"lucks":[0,0,349],"lucx":[13599,3280,4019],"lucxss":[0,0,1082],"lukey":[0,0,58],"lupius":[0,42,0],"lush":[299,688,629],"luuuke":[0,3440,0],"lwa":[0,0,265],"lxcas":[208,0,0],"lxdesman":[2012,2420,3145],"m0ne":[0,189,2113],"m0untain":[0,125,2284],"m1":[0,0,2002],"m11z":[32910,0,58825],"maa-san":[0,7450,14216],"macchan":[72,827,429],"mace":[0,0,4944],"macheew":[3708,1050,2280],"maciak":[13374,0,3723],"mack":[5357,8600,10662],"mackwood":[107746,12900,281792],"macyfishy":[0,252000,172771],"maddenv":[672,232,2357],"maesar":[0,0,24021],"mage":[0,5120,1611],"magma":[0,0,2325],"magni":[0,0,10722],"magnolia":[0,0,5122],"maihaze":[574,0,0],"mainly":[0,0,4641],"maken":[0,13600,9656],"malibuca":[585448,185000,641527],"malkawi":[14664,7730,7812],"maloyache":[9091,571,1264],"mana":[1740,248,210],"mannii14":[2868,0,3039],"manocaki":[1035,0,3220],"mansour":[0,5290,13322],"manz":[0,0,1111],"mappi":[0,0,18252],"marco":[54309,16900,13021],"mariuscow":[157103,77100,70886],"markusc":[11461,385,4103],"marzz_ow":[569172,88100,47961],"masaki":[0,0,206],"mase":[110,326,3010],"maseff":[224,0,372],"mason":[6582,1280,11757],"massimo":[0,5,1555],"master":[471126,213000,242423],"matez":[3201,0,1139],"matrx":[822,0,1138],"matsoe":[43852,0,141],"maufin":[51235,458000,384048],"maw":[0,10500,6971],"mawakha":[42873,5570,0],"maxiking":[0,549,8170],"meah":[0,3230,8739],"mechton":[12,5250,23226],"mecyx":[316,56700,0],"medusa":[42551,31900,122148],"megadan":[0,147,867],"megga":[0,289000,570680],"meip":[0,9030,7311],"merc":[57,0,500],"merem":[0,50500,24459],"merijn":[17626,32800,46373],"mero":[476439,260000,441595],"merstach":[203908,161000,533248],"merthy":[0,1490,5271],"mesportt":[13504,441,5542],"metab":[0,0,5774],"mev":[10,0,2720],"mexe":[13692,12700,0],"mezega":[1197,3250,159],"michael":[29369,18400,44804],"michael.":[0,0,19523],"middi":[0,6990,27091],"mikey":[168557,8280,29729],"mikson":[49936,26500,46132],"milad":[631,0,3136],"milan":[118816,36900,114572],"milo":[0,0,1122],"miner":[0,0,88],"minipiyo":[0,73700,54582],"minit":[0,395,3175],"minkin":[0,885,0],"minori":[8788,1900,4855],"minsu":[0,731,6549],"minty":[17648,4970,64788],"minzho":[3757,619,2952],"minzu":[0,2260,0],"miro":[49636,112000,66639],"misha":[0,168,72],"misty aim":[0,0,1875],"mitr0":[940374,681000,916980],"miya":[0,6840,0],"mjeed":[0,0,1043],"mjood":[10841,0,0],"mkh":[0,0,714],"mkmkpapa":[0,25800,34897],"mlody":[0,0,7230],"modisk":[0,26800,26199],"mohanad":[0,0,1065],"mojak":[246088,57000,171255],"momsy":[4940,0,21552],"moneymaker":[610254,0,78476],"mongraal":[7189922,33300,2612553],"monsterz":[748,0,1234],"mony":[23562,1040,0],"moo":[3108,6210,5362],"mooseggs":[1775,4860,0],"morix":[0,22,1275],"motor":[304508,119000,228837],"mrdom":[6321,3230,3137],"mrsavage":[4664723,208000,1884895],"mse":[0,0,425],"msg":[71,565,5258],"mstzera":[0,2720,18727],"muka":[0,161,1444],"mukutaf":[0,0,305],"munk":[0,1020,805],"muz":[430846,155000,578585],"mv":[544,0,1173],"mvxy":[2708,0,898],"mxfia":[0,28,749],"mxnty":[0,0,879],"mxrcio":[0,0,6718],"mxrxk":[0,0,2449],"mxsty":[0,0,2613],"myst":[0,0,3851],"mystick":[76129,0,52243],"mаеstго":[112300,15100,672],"n7r":[2537,123,1558],"nach":[1615,15400,11225],"nachiiri":[29354,5740,11116],"naekoz":[0,8780,33611],"naetor":[0,54400,0],"naevz":[11,1850,2706],"nahue":[0,0,31595],"nahuxwq":[8701,0,2537],"nakoo":[829452,120000,150642],"nalu":[0,7490,10260],"nani":[9706,0,0],"nanolite":[72572,27800,15738],"narwhal":[12434,78800,19557],"nasir":[24484,0,15229],"natanyo":[398,0,278],"nate":[4654,6620,10765],"nate hill":[1636653,8400000,429839],"natee":[0,0,598],"nathes":[2757,686,8419],"nayker":[0,0,13542],"nayte":[217849,0,242670],"ndp":[0,0,16625],"nebby":[2212,292,0],"nebs":[40832,13800000,44108],"neeqo":[17600,2430,8476],"neferux":[0,0,4892],"nefrizi":[33932,1060,14138],"nekko":[1577,570,3230],"nemutaiyo":[0,7830,13157],"nemz":[0,5490,1838],"neo":[1696,0,814],"nephrite":[14397,1010000,336577],"nero":[0,0,738],"netzz":[2722,331,1311],"newbatoon":[52531,15400,17090],"nexy":[29290,53400,8464],"nezar":[0,0,20],"niasen":[0,0,10807],"nic":[0,0,6667],"nicks":[0,472000,256731],"nico":[0,0,1031],"nigel":[234,359,1310],"night":[57891,0,28769],"nikof":[826045,191000,406436],"ningdo":[696,299,890],"ninja":[19229181,0,6681087],"nitrix":[0,663,896],"nittle":[0,780,11217],"njby":[52179,47300,27755],"nm7":[60870,55400,33396],"noa":[0,571,5360],"noahreyli":[795434,346,364152],"noahwplays":[262519,19700,23850],"nociff":[10546,0,9189],"noia":[3170,3740,11505],"noizy":[1294,7230,21487],"nomfu":[1660,0,522],"nomzz":[32049,3000,12707],"nong9":[188,0,0],"northern":[599,505,1355],"nosh":[0,102000,83722],"nosn":[0,1500,3573],"notpandda":[0,4340,8684],"nounzy":[2777,0,2585],"nov1ce":[0,0,16260],"noward":[120284,2710,94014],"noxy":[10727,1570,13112],"nozzey":[0,283,3846],"npen":[242530,71300,62561],"nqru":[0,0,14870],"nuarix":[0,0,6831],"nunker":[298,362,6],"nurface":[1621,692,1584],"nut":[0,0,23987],"nutex":[0,1170,0],"nutifps":[59906,32100,0],"nvtylerh":[0,0,8478],"nxthan":[4173,9250,19599],"nyhrox":[214348,82700,309463],"nyle":[9338,6260,5668],"nyx":[1889,703,3017],"oatley":[754426,1380,416719],"ob":[2662,0,1548],"obito":[756,1460,1837],"okis":[0,71300,122734],"oliverog":[373986,981,93372],"olk":[0,0,1724],"omaar":[218,50,809],"omg me ii":[0,0,4817],"on1":[0,11200,21],"opai":[43644,0,81315],"opezor":[1054,0,2047],"optimal":[2837,305,1098],"oreo":[0,0,6147],"origins":[0,0,28097],"oslo":[218547,54600,151605],"osp":[625,1140,25],"osydd":[3944,1060,7006],"otome":[0,0,2484],"outlaw":[125484,348000,33572],"owl":[202723,260000,35807],"ozean":[0,64,27],"ozirvo":[4581,0,2327],"ozone":[1178,0,7454],"p1ng":[32135,3590,30175],"p5ek":[0,0,5328],"pablowingu":[25659,10200,60775],"paceve":[36409,0,7871],"pachi":[0,0,1008],"packo":[84724,22400,73153],"paengdol":[0,0,1869],"pamstou":[1126,6330,24780],"pancake":[12753,12500,8221],"panzer":[44899,0,39649],"paper":[254449,54500,138474],"papi blast":[446988,443000,30839],"pardal":[66873,0,26971],"parkyn":[0,0,3993],"parm":[0,68400,0],"parz":[7033,0,9709],"pattaty":[119786,0,61546],"paulinyache32":[25381,0,8325],"peace":[345,0,0],"peach":[0,1600,4584],"pearl":[0,3640,2278],"pedrin":[2823,207,751],"peepotron":[0,1620,282],"pega":[0,82700,102259],"pepoclip":[0,69800,139893],"perplexii":[0,2860,2830],"persa":[280224,61500,175362],"peshka":[0,0,2546],"peta":[0,0,6266],"peterbot":[1246705,1030000,813211],"peterpan":[4541,0,31297],"pfzin":[80800,0,72477],"pgod":[892526,32400,312318],"phazgod":[1008,0,2269],"phazma":[0,0,1394],"phenom":[154,0,1989],"phluxzy":[11158,2050,0],"phoenix":[130,290,3345],"phyc0l":[0,0,281],"phzin":[119052,95800,119603],"pika":[6592,0,1927],"pina":[0,3600,0],"pingu":[80219,0,28659],"pinq":[400214,111000,224289],"pirozz":[48062,14200,30624],"pixie":[98706,44700,101764],"pixovsky":[0,12700,20328],"pixx":[14415,2390,27879],"pkr29":[22589,4490,24471],"playerone":[301,0,0],"playify":[46361,0,20763],"plege":[6415,0,9369],"pluey":[6725,132,819],"pnkayy":[3184,729,3244],"po":[0,0,344],"poakz":[89,0,0],"podasai":[230618,1670,111530],"poffiee":[0,803,412],"pogue":[0,317,538],"polar":[292,322,484],"pollo":[203075,188000,185641],"polo":[0,502,542],"poor":[0,0,1316],"poppin":[6236,0,861],"posick":[20499,684,6242],"power":[7,0,1266],"powur":[1176,1000,2901],"pozed":[0,499,2706],"prax":[1087,937,5123],"prbk":[0,4340,24111],"predage":[131619,15800,25871],"predepression":[1081,192,0],"prien":[0,0,701],"priestty":[153,0,0],"primzhy":[4611,1960,3873],"prisi0n3r0":[46891,14400,38010],"prism":[18277,27,10178],"pronextt":[0,0,8333],"protoon":[3546,0,3051],"psalm":[0,0,68636],"psyduck":[0,0,592],"psyper":[0,0,3576],"pudnara":[0,0,360],"pulga":[825953,420000,292976],"puma":[0,833,1579],"pumpkin":[0,79,5894],"punga":[724,0,366],"punisher":[225543,2140,0],"purav":[106,2090,1056],"purchawa":[15873,0,14828],"purebx":[644,1400,1229],"purple":[0,401,152],"putrick":[0,35800,58427],"puzera":[6633,675,5701],"pxlarized":[296450,93800,97427],"pxmp":[0,83200,61522],"pykz":[0,567,1204],"pzuhs":[0,0,668],"qasruh":[483,0,356],"qb":[0,0,5560],"qhvst":[0,0,2067],"qjac":[0,85100,114789],"qkay":[0,0,812],"qndx":[94686,36900,39252],"qoo":[0,2,1372],"quala":[506,0,1166],"quann":[0,0,10],"queasy":[368156,104000,402254],"quick":[0,0,295],"quickss":[0,0,8480],"quinn":[159449,34100,236582],"rabbit":[0,0,3614],"rabid":[6581,2070,13202],"rad3on":[41320,0,19085],"radius":[82289,566000,62043],"raed":[0,18400,7206],"ragis":[0,168000,183480],"rahcks":[861,1140,1745],"rai":[0,0,5652],"raifla":[11706,80700,49050],"raiku":[0,978,4187],"rainy":[0,3110,123882],"raito":[505,0,19924],"raizen":[17289,2160,19898],"rajrooj":[5887,0,935],"rakirye":[0,0,30532],"rakso":[36307,1090,50089],"randu":[0,29000,34363],"ranger":[1316155,234000,99534],"rapid":[83917,18400,390240],"rapit":[45377,33000,27387],"raru":[0,15000,14788],"rasso":[186,0,362],"ratgun":[0,0,1253],"rawden":[0,49,0],"rax":[112076,0,33986],"rayo":[0,0,439],"rays":[0,259,7361],"raze":[4300,14500,3887],"razez":[0,0,1802],"razl":[0,8280,15805],"reaper":[0,0,6654],"redlee":[0,7910,39703],"redrush":[8067,1890,5331],"reducs":[476,0,6315],"reeloads":[0,548,810],"reet":[0,490000,374205],"refsgaard":[0,56600,187424],"regan":[193,139,3627],"reguletor":[0,49,2182],"rehx":[21741,4060,87205],"reign":[44630,1820,7147],"reim":[0,0,3410],"reiner":[0,2050,3869],"rel":[121496,121,27598],"rellvis":[4780,0,13454],"remi":[6046,1340,0],"reminisciin":[0,0,1789],"remsy":[1089,107,389],"ren":[0,0,11547],"reo":[0,0,7850],"repairs":[14482,45800,9410],"repulsegod":[55738,38300,447],"resignz":[10199,28600,12423],"resypical":[12279,0,7033],"retake":[102501,56400,57340],"retro":[3997,0,3182],"reverse2k":[489417,535,162252],"revised":[13942,1500,11763],"rew":[6941,0,6138],"rexzi":[0,6230,1124],"reyed":[1088,1090,938],"rezon ay":[1405703,115000,535120],"rezoy":[0,0,3423],"rhux":[13556,0,10992],"ria":[0,2690,4748],"rialy":[3319,0,68056],"riam":[0,15200,39884],"ricbor":[70321,0,9497],"richhomiequinn":[159449,260000,236583],"rift":[715,526,1841],"rifty":[0,1460,3376],"rimr":[0,59100,116359],"rimuru":[0,4660,22784],"rip":[0,0,3230],"riquelmee":[0,0,52183],"riru":[0,6740,22728],"rise":[105343,18800,129985],"ritual":[62136,13000,417365],"river":[0,8020,2489],"riversan":[63597,0,0],"rivlee":[138,0,0],"rivo":[9886,1200,0],"rizart":[0,477000,336357],"rizza":[0,0,861],"robabz":[67449,18200,75863],"robban":[8670,1370,14208],"robin":[0,1160,5149],"robot":[127788,37500,49801],"rocaine":[8602,15400,22768],"rocca":[0,10800,57995],"rogueshark":[57744,0,33462],"rojo":[11109,0,36983],"romero":[0,0,16277],"ronaldo":[10573,118,6951],"ronin":[7005,18300,1355],"roqz":[0,1000,1758],"rui":[0,0,42496],"runa":[0,99900,129635],"rupa":[0,0,58711],"rura":[0,0,18275],"ruri":[0,168000,237671],"rustyk":[0,133000,182033],"rv":[0,13800,23826],"rvvr":[757,0,2223],"rxtr":[593,0,1213],"ryaic":[1056,420,751],"ryle":[0,4650,0],"rythm":[0,0,856],"s1ned":[14492,0,12961],"saad":[0,1060,3180],"sad":[0,19900,15042],"saevid":[380103,196000,130152],"saf":[107565,41100,352709],"safik":[18785,0,10262],"sails":[2762,1420,1830],"saiu":[0,6340,3554],"sake":[5047,834,1967],"salko":[0,831,7620],"salt":[1954,231,2558],"salva":[7860,0,9854],"salvo":[838,0,1523],"sandman":[52,3930,2780],"sane":[4761,2650,0],"sangild":[4737,0,7052],"sanjog":[6853,0,3158],"sanku":[0,0,73016],"sanyagod":[0,0,570],"satisfy":[91,2,0],"saud":[0,0,10524],"savaje":[663,199,2384],"sayara":[0,1130,0],"sazers":[1091,0,1265],"sbari":[0,0,2657],"scammed":[0,0,5843],"scan":[0,0,1456],"scarebear":[51,2760,6351],"scarlet":[0,423000,0],"scarpa":[0,0,29549],"scaryy":[0,0,11803],"sceptic":[708531,1380000,87337],"scolleh":[0,0,8952],"scoped":[1404037,544000,394105],"scriwy":[1235,929,4417],"scroll":[57037,13900,46562],"scrupools":[3166,0,3730],"scuffys":[8352,1810,1128],"seak":[0,0,3096],"seanvp":[6324,77800,6938],"sebby":[0,12500,16270],"seek":[0,2090,4750],"seeyun":[312432,0,201542],"seljuny":[0,0,327],"senz":[70,0,75],"sepz":[0,0,709],"seren":[1886,877,3995],"serpennt":[3057,206,2388],"setty":[370595,409000,623052],"seven":[0,13,2084],"sexyboy":[0,0,1007],"seyyto":[37548,8230,23947],"sfa7":[0,0,1256],"shadow":[14520,7110,17689],"shady":[8665,2030,0],"shaedess":[0,0,422],"shaker":[32,0,1531],"shamokiy":[32839,3140,0],"sharkman":[3222,0,4333],"shaykoz":[21805,5210,0],"shelom":[0,10500,20703],"shhneider":[0,0,57],"shinck":[0,997000,229933],"shizogod":[21813,0,0],"shmeky":[38943,31000,36718],"shonye":[0,54500,4808],"shore":[0,202,2812],"shrshf":[3920,0,1372],"shu":[0,0,10905],"shunsyan":[0,135000,197508],"shur4":[54807,0,6516],"shxrk":[208870,173000,145103],"siberiajkee":[18649,0,12479],"sigma":[14625,0,3607],"silent":[0,9490,5655],"silxzys":[246,0,2157],"simple":[444,1030,0],"sinlord":[777,1360,0],"sinooh":[12836,3570,13914],"sio":[2559,530,3132],"sirence":[12629,1430,4251],"skailer":[0,0,17546],"skayter":[3818,1330,3817],"ski":[0,0,587],"skillz eve":[0,0,288],"skite":[255365,108000,251841],"skits":[4945,2750,8447],"skqttles":[15676,9440,41679],"skram":[28456,0,63863],"skrill":[1223,1770,3290],"skvii":[1341,1310,9008],"skvts":[20240,2570,3937],"sky":[23256,12600,43294],"skydeun":[116030,177000,38382],"skyjump":[27422,0,19617],"skyla":[8127,0,5767],"skyzou":[2288,520,2634],"slackes":[64716,650000,50298],"slay":[0,0,648],"slaya":[12040,319000,26842],"slayanf":[259,0,487],"slays":[8410,34500,9429],"slender":[56212,32100,23066],"slepzi":[0,1650,3778],"slick":[393298,60600,201161],"slim":[0,0,798],"slix":[0,0,25551],"slovay":[10871,0,16246],"sloxzay":[9314,1780,4139],"slq":[0,1390,0],"slw":[398,0,3037],"smeef":[13699,8210,13820],"smite":[4055,430,9791],"smqcked":[440048,71300,36753],"snacky":[267588,66200,0],"snadr":[0,177,394],"snagged":[77143,49700,29035],"snake":[0,3150,6745],"snap":[35529,71000,276],"snayzy":[193741,55700,144272],"snevy":[0,0,680],"snipe":[260,0,5049],"sniperduderip":[0,0,859],"snirot":[7436,2880,4991],"snow":[4460,57700,6],"snowy":[24,266,3489],"snowyka":[0,0,242],"snozq":[580,119,2394],"soko":[0,0,194],"solution":[0,0,928],"solvey":[1767,1630,1740],"somin":[0,134000,5125],"sorif":[31204,6410,14991],"soul":[0,0,251],"source":[0,865,4019],"souriano":[238171,317000,79438],"sozman":[0,524,0],"sozmann":[0,524,0],"sp1aash":[24474,2400,11141],"sparebow":[19698,2300,19493],"spayde":[8633,126000,30200],"spayed":[0,2460,4070],"spectral":[5857,1990,3381],"speedynd":[0,49400,27343],"speguu":[0,0,2937],"sphinx":[0,4920,36059],"spidermon":[479,32500,3345],"spideyy":[40776,150000,4700],"spiker":[0,0,4457],"spirok":[5896,1960,1191],"spitflow":[144039,41900,126234],"spoctic":[0,0,1174],"spookz":[0,0,5002],"spraz":[2761,3740,0],"sprite":[0,0,846],"spy":[182128,4220000,83428],"squalzk":[0,275,13062],"squeakz":[0,0,18],"squish":[329,226,1145],"squishy":[0,0,1145],"srapt":[4617,144,3841],"stain":[2407,9140,15899],"star":[0,0,1305],"steady":[846,1260,0],"steanzz":[1530,0,343],"steelix":[0,110000,58147],"steg":[31359,5930,5770],"stella":[0,1160,5461],"stenno":[1481,1120,5109],"sticks":[0,55100,40071],"stilson":[0,2090,12010],"stompy":[196720,65700,134536],"stork":[0,19200,43506],"stormyrite":[0,31600,98293],"stranger":[0,256,1679],"strendd":[133893,32100,81020],"stretch":[351127,167000,425061],"strobe":[495,14900,0],"stryker":[5760,488,14078],"styler":[7931,0,25729],"styrsix":[3681,1500,6702],"sudds":[276,0,795],"suetam":[1037582,0,241574],"sultan":[0,0,2122],"sultanfv":[0,0,188],"sunddely":[2502,0,9051],"suns":[52653,5590,15898],"sunz":[0,0,10913],"surprise":[904,116,3256],"susscript":[2402,190,3260],"swag":[28312,12000,14129],"swaggi":[20143,5780,5708],"swapz":[2293,1220,3106],"swarm":[4928,0,1124],"sway":[0,3880000,0],"swillium":[35689,36500,83575],"swizzy":[144615,52900,143077],"swurl":[0,1370,624],"sxhool":[0,0,5970],"syaaz":[0,0,12530],"syamu":[0,3790,0],"symetrical":[43750,0,28786],"symfuhny":[4128087,1010000,869152],"syn":[410,180,1040],"synaf":[844,749,1035],"sync":[78151,334000,29988],"sync cool":[0,4190,4176],"sythic":[0,0,380],"t3eny":[49960,46700,99240],"tabnae":[0,0,10079],"tabzg":[17554,2590,23928],"tade":[20497,10200,14020],"tahi":[181691,30300,55794],"taiya":[0,3590,10875],"taka":[2817,644,1120],"takadani":[0,11200,0],"takamura":[0,168000,237671],"taken":[0,0,145],"takii":[1624,2140,4195],"tako":[0,676,0],"tamakii":[201,1250,266],"tame":[0,0,778],"tanman":[0,0,1309],"tatto":[17799,0,11807],"tautai":[7490,2010,3056],"tavern":[45178,15400,28200],"tayson":[663870,448000,571897],"taytan":[0,3040,5273],"tchub":[0,0,2084],"technoviking":[51056,0,70514],"tecne":[0,0,32664],"teddy":[0,0,5872],"teejay":[6672,3050,0],"teeq":[0,21100,100528],"teitei":[0,0,15518],"tekmarr":[3872,5610,15491],"temple":[0,0,1670],"teqqz":[7370,17300,4026],"teroq":[0,5770,4010],"tetchra":[4369,607,0],"teuzz":[188363,0,24910],"teyo":[0,1690,11125],"tf cole":[85,28,0],"tfue":[11522994,11800000,3949033],"th0mashd":[121386,151000,687390],"thaitanks":[0,75,699],"the uzi":[11516,995,1148],"thetik":[2329,5100,2649],"thevic":[238131,117000,189088],"thiagin":[0,0,5148],"thome":[492864,0,173404],"thomuss":[15293,2310,4100],"thomuss_":[15293,2310,4100],"thor":[7690,363,6583],"thorik":[7690,363,6582],"threats":[0,6960,70567],"tidi":[2622,0,4497],"tigg":[5484,0,4969],"tiggz":[169,4020,1911],"till":[0,14900,5771],"timko":[450,1260,0],"tinka":[6306,1700,6002],"tinkerbel1x":[0,3520,17339],"tinytawn":[0,4010,363],"tired":[0,0,416],"tisco":[39699,5080,13935],"tisora":[18307,0,0],"tjino":[32049,19300,55615],"tjohnso":[102,10,507],"tkay":[133501,211,69383],"tobi":[0,0,6133],"toff":[1152,4060,0],"tohaj":[35976,0,9776],"tomzyv1":[5228,1160,9435],"toose":[839625,342000,90813],"tori":[0,1030,8200],"tormen":[1188,0,559],"tossily":[983,1010,2030],"totot":[113,1960,5454],"tragix":[3,11500,4949],"trapkilled":[10,0,4967],"trapped":[17147,94900,13390],"trashy":[31561,3510,14227],"trentman":[1189,142,0],"trexer":[5333,1170,5677],"trey":[47616,7440,3652],"triggy":[3472,0,1545],"trimmers":[741,528,1166],"trippernn":[22069,7590,81756],"trippn":[454,122,1864],"tristan hipp":[79,520,957],"trix":[0,26000000,883],"trixy":[564,499,620],"trooly":[14288,532,9792],"trulex":[36383,38700,89793],"trusio":[0,0,1428],"tschinken":[43738,4530,113183],"tuckz":[21259,3170,0],"tuexy":[32952,12000,1168],"tuii":[27491,375000,8213],"tuna":[15308,667,13430],"tups":[0,0,607],"turtl3":[8288,0,9508],"turtle":[197,1090,4660],"twainz":[0,0,435],"twayko":[0,0,109732],"twek":[7005,0,5229],"twi":[41158,16200,19614],"twistnator":[0,0,1044],"twix":[7,462,775],"twizz":[25395,0,4663],"twunti":[33210,6410,31488],"twx":[211,0,184],"txrm":[0,0,1381],"txtuba":[0,0,708],"tyraxe":[17514,3980,10798],"tyvan":[0,0,751],"tzuyu":[0,541,2698],"umplify":[143941,60300,63797],"uniq":[0,619,276],"unit":[111595,72500,0],"unknown":[1135122,0,0],"unlocalize":[2394,94,0],"unrealiana":[0,0,4079],"unsightly":[0,507,611],"upl":[7142,1260,12768],"userz":[11931,1020,11683],"vadeal":[1116493,32800,387326],"vadeyy":[8411,0,1610],"vagnar":[0,5690,2],"vague":[440,0,1139],"valaxies":[285,0,803],"vanilla":[390829,66900,477916],"vanillaz":[7887,1900,22215],"vanyak3kk":[23945,19900,78897],"vato":[0,0,116517],"vaxsr":[0,1460,2994],"vazen":[0,0,3938],"ve1ryy":[16719,1580,2961],"ved":[32286,2930,7979],"veer":[13995,12800,8472],"velo":[0,1670,2603],"venihcy":[0,0,1301],"veno":[585183,103000,302475],"vergo":[15,14900,36727],"verny":[0,1270,601],"verox":[174474,12700,115827],"vert":[11932,15400,24210],"vetle":[0,415,6718],"vexi":[6482,755,5563],"vexifire":[17,0,336],"vexy":[6738,759,2865],"vic0":[338019,98900,502141],"vichoo":[70498,9610,7434],"victerv":[59167,23300,23164],"viiroos":[0,0,10033],"vilets":[0,1150,0],"vimcu":[75,0,403],"vinizin":[393,51,893],"vinny":[894,0,951],"vinny1x":[15,142,27272],"virsuh":[2419,2110,4406],"visxals":[0,2230,14732],"vitaminsuu":[0,1110,4534],"vitinho":[873,526,2720],"vivid":[320539,120000,285009],"vix":[0,0,250],"vleccks":[0,0,1246],"voil":[9069,1940,0],"volko":[31916,2580,13384],"voltiax":[0,4950,4999],"voltz":[0,212,357],"volx":[407733,168000,9316],"vortek":[0,476,3003],"vortex":[24832,4860,0],"vortexers":[10985,601,0],"vortexm":[113976,15900,31083],"vorwenn":[366210,0,159760],"vorx":[0,118,668],"vysi":[0,14,3925],"vyx":[0,419,1360],"wagers":[5439,4180,3648],"wakie":[18641,34400,75701],"walay":[86,0,717],"wanlast":[5214,7430,31871],"wave":[0,0,1721],"wavyjacob":[352071,15400,109186],"wcarey":[0,0,3993],"werex":[49225,3580,16355],"westy":[1629,284,1836],"wgoon":[300,0,317],"wh1te":[0,0,53],"wheat":[54385,5910,11096],"wheels":[21421,1370,5233],"white":[8740,907,2822],"whizxiy":[64,45,178],"whofishy":[127831,334,54311],"wicked":[18588,1800,1371],"wickesy":[0,20200,69485],"wicxsy":[0,0,8],"wildhawk":[0,255000,243525],"winther":[1282,0,3225],"wisheydp":[0,1680,0],"wizz":[0,175,992],"wolf":[0,0,5],"wolfie":[11180,0,1248],"wolfiez":[776691,363000,510284],"wolvax":[0,0,7792],"wood":[882,119,1045],"woodsy":[1040,370,1337],"worthy":[200804,5670,10650],"wox":[6621,6510,36240],"wqzzi":[4758,186,3397],"wreckless":[8473,1610,7690],"wrigley":[0,3,7835],"wyzip":[0,0,8543],"xalkerr":[0,489,2308],"xavi":[0,0,1110],"xavier":[65,0,3367],"xayrez":[0,18900,0],"xccept":[966,2490,10251],"xeat":[44314,15400,44932],"xenolith":[438,348,1383],"xenon":[0,0,598],"xeo":[0,111,0],"xjam":[2414,4460,7116],"xkumu":[2064,297,3849],"xmipoli":[0,61700,67741],"xnb":[48305,3690,41163],"xoonies":[75298,15500,14149],"xown":[194768,80000,112214],"xsterioz":[3357,794,8102],"xsweeze":[63780,25100,116754],"xviperzz":[0,0,1023],"xx731":[4411,5690,6622],"xxif":[3910,0,12434],"xzytle":[0,0,3805],"yagsou":[0,2140,20805],"yama":[0,17500,33473],"yasenoppo":[0,0,2084],"yasir":[148318,50700,30905],"yassen":[0,987,4579],"yiyan":[2693,495,3335],"yo7med":[821,0,1432],"yonduh":[205,978,327],"yonx":[9719,16400,10133],"yoosaltyy":[572,756,660],"yucky":[0,0,3577],"yuki":[0,0,284],"yuleys":[7643,1310,4011],"yuma":[27277,26800,38523],"yumi":[2828,1060,17258],"yunseopp":[0,0,12],"yusea":[0,67100,111052],"yute":[0,462,557],"yuz":[6235,1790,8583],"yzan":[0,0,1285],"zagou":[42518,0,130761],"zaire":[0,0,2044],"zak":[0,0,472],"zandaa":[0,565,2311],"zandy":[17451,75800,63379],"zangi":[19177,0,12954],"zanz":[0,662,3141],"zara":[111414,16500,20182],"zarbeh":[11378,0,9319],"zarby":[101198,79200,22027],"zayni":[2157,155,3153],"zayt":[282771,0,510915],"zazi":[0,8150,16545],"zdog":[26272,2590,6795],"zedox":[0,539,3070],"zeeyadx":[254460,1990000,244760],"zehlo":[0,598,687],"zemo":[313,523,1461],"zenn":[209398,83200,27897],"zenox":[0,4630,2365],"zepher":[59754,41600,56518],"zerokun":[0,2180,21630],"zeston":[3245,2170,5151],"zesty":[0,2280,0],"zeus":[0,5010,7881],"zexrow":[0,0,299716],"zeykoo":[8023,2100,0],"zimeo":[0,8250,0],"zlem":[8156,1160,12439],"zleoszn":[10338,0,2619],"znappy":[23241,0,44271],"zno":[540,2660,11588],"zodi":[0,0,403],"zookez":[2879,589,4789],"zoommba":[359,64,211],"zoreh":[5697,5100,11259],"zotax":[0,0,4569],"zq":[84361,17800,89925],"zroqz":[1470,1060,3834],"zuity":[0,1730,1628],"zuko":[0,606,0],"zukoxf":[1511,103,873],"zum":[2137,0,2313],"zuusboy":[0,28900,11563],"zyfa":[134528,25400,91723],"zyft":[513,462,481],"νm7":[60870,55400,33396]};
// ==== /CC_PRO_SOCIAL ====
// ==== CC_PRO_SOCIAL_HIST (tools/build-pro-social-history.js) ====
const CC_SOC_CURVE={"x":{"2019":0.1591,"2020":0.3961,"2021":0.9522,"2022":1,"2023":1,"2024":1,"2025":1},"yt":{"2019":0.134,"2020":0.3191,"2021":0.4772,"2022":0.6229,"2023":0.6229,"2024":0.7854,"2025":0.9904},"tw":{"2019":0.134,"2020":0.3191,"2021":0.4772,"2022":0.6229,"2023":0.6229,"2024":0.7854,"2025":0.9904}};
const CC_SOC_HIST={"3mory":{"yt":{"2020":4}},"4drstorm":{"x":{"2020":34575}},"4zr":{"x":{"2021":176497},"yt":{"2020":10000}},"97default":{"yt":{"2023":3010}},"aaron":{"yt":{"2022":35}},"acorn":{"x":{"2020":3841},"yt":{"2020":712,"2021":27500,"2022":27600}},"adapter":{"yt":{"2020":500}},"adity":{"yt":{"2021":112}},"adn":{"x":{"2020":17325},"yt":{"2020":3480}},"advise":{"yt":{"2020":2350,"2025":100000}},"aim":{"x":{"2020":21824,"2022":54537},"yt":{"2019":3780,"2020":20300}},"aimhero_o":{"x":{"2021":6402}},"aircool":{"x":{"2020":14447}},"ajerss":{"x":{"2020":26475,"2021":55210,"2022":70174},"yt":{"2020":5200}},"akai":{"x":{"2019":88}},"albedo":{"x":{"2021":52986},"yt":{"2021":32200}},"alex":{"yt":{"2020":6190}},"alice":{"yt":{"2020":35400,"2021":56400}},"allen":{"yt":{"2020":1650,"2021":8290}},"alliege":{"yt":{"2020":114000}},"aloe":{"yt":{"2022":64}},"alpha":{"x":{"2020":40335}},"amozz":{"yt":{"2019":183}},"anas":{"yt":{"2020":62900,"2021":69500}},"andilex":{"x":{"2021":210101,"2022":250207}},"andyvencha":{"x":{"2021":72668}},"animal":{"x":{"2019":42278,"2020":68753,"2021":80012}},"antorak":{"x":{"2020":35733},"yt":{"2021":508}},"apar":{"yt":{"2020":98}},"aqua":{"x":{"2019":51723,"2022":709696}},"arion":{"yt":{"2020":327,"2021":406}},"arisakaaa":{"yt":{"2019":72000,"2020":88000,"2021":88100,"2022":383000}},"arkhram":{"x":{"2020":39727},"yt":{"2020":8750,"2021":147000}},"artskill":{"yt":{"2021":246}},"ash alk":{"yt":{"2025":890}},"asianjeff":{"yt":{"2022":48700},"tw":{"2023":760848}},"aspect":{"x":{"2019":16824,"2021":103983}},"assault":{"x":{"2020":64176,"2021":110417},"yt":{"2020":244000}},"astrosmz":{"x":{"2020":14512,"2021":52026},"yt":{"2020":7520,"2021":7740}},"asuka":{"yt":{"2020":20}},"at0m":{"yt":{"2021":597}},"athiel":{"yt":{"2020":39}},"aussieantics":{"x":{"2021":69580,"2022":196876},"yt":{"2024":145000}},"av":{"x":{"2020":18087},"yt":{"2019":426,"2020":4570}},"avery":{},"ayarbaffo":{"x":{"2020":569}},"baackup":{"yt":{"2024":253}},"backho":{"yt":{"2020":110}},"badsniper":{"x":{"2020":66831}},"balor":{"x":{"2021":3042},"yt":{"2021":2000}},"bankteller":{"x":{"2021":13754},"yt":{"2021":1010}},"barella":{"x":{"2021":18060}},"batman bugha":{"yt":{"2022":5690}},"bedin":{"yt":{"2020":738}},"belaeu":{"x":{"2021":6356}},"bell":{"x":{"2019":26837,"2020":64520}},"belusi":{"yt":{"2021":3420}},"benjyfishy":{"x":{"2019":59050},"tw":{"2020":2483707,"2021":3000037,"2022":3808959,"2023":3929885,"2025":4077169}},"bevvys":{"yt":{"2021":211}},"bizzle":{"yt":{"2020":157000,"2021":258000}},"blacha":{"yt":{"2021":140}},"blackoutz":{},"blacky":{"x":{"2020":29955,"2022":61762},"yt":{"2020":3790,"2021":7370}},"blake":{"x":{"2020":61802,"2021":224552,"2022":229293}},"blakeps":{"x":{"2020":61802,"2021":224552,"2022":229293}},"bleed":{"yt":{"2021":206}},"bloomy":{"x":{"2020":1455}},"bob":{"x":{"2020":82982},"yt":{"2019":41061,"2020":170000,"2022":314000}},"bobo":{"x":{"2020":2544}},"bot":{"yt":{"2020":3710}},"boyer":{"yt":{"2025":23500}},"braydz":{"x":{"2021":14}},"brush":{"x":{"2019":1384}},"bucke":{"x":{"2019":20099,"2020":35798,"2022":456579},"yt":{"2020":118000}},"bugha":{"x":{"2019":152225,"2020":642528,"2021":1597711,"2022":1944624},"tw":{"2020":1706734,"2021":4089646,"2022":5001378,"2024":5405410,"2025":5509108}},"bumboy":{"x":{"2019":887}},"buyuriru":{"x":{"2021":39856},"yt":{"2020":1070,"2022":142000}},"bykn":{"x":{"2019":13277,"2020":20609,"2021":29559}},"cadu":{"yt":{"2020":21500}},"cam":{"yt":{"2021":4}},"carola":{"x":{"2021":238643},"yt":{"2021":58100}},"carrera":{"tw":{"2022":2015765,"2023":3441386,"2024":4505219,"2025":4909970}},"carrot":{"yt":{"2020":1610}},"caryion":{"x":{"2020":8457},"yt":{"2020":3890}},"casqer":{"x":{"2021":16071}},"cat":{"yt":{"2020":8330,"2021":7700}},"cazz":{"x":{"2022":22360},"yt":{"2020":740}},"ceice":{"x":{"2019":18290,"2021":209076}},"ceneto":{"yt":{"2020":436}},"cented":{"x":{"2020":86917,"2022":349326},"yt":{"2019":7790,"2020":11300}},"cesar":{"yt":{"2021":92}},"chainz":{"yt":{"2020":83}},"chanzes":{"yt":{"2019":88500,"2020":132000}},"chap":{"yt":{"2025":2170}},"chapix":{"x":{"2020":34922},"yt":{"2020":10900,"2022":21700}},"chiffon":{"yt":{"2020":1450}},"chimp":{"yt":{"2021":33}},"chocoluv":{"yt":{"2020":4070,"2021":15300}},"chozay":{"yt":{"2020":597}},"chubs":{"yt":{"2021":275}},"cillic":{"x":{"2020":2526,"2021":3580},"yt":{"2020":301}},"cizlucky":{"x":{"2020":9726}},"clapsy":{"yt":{"2023":448}},"clement":{"x":{"2020":31},"yt":{"2020":1640,"2021":5330}},"clix":{"x":{"2020":518},"yt":{"2019":391000,"2020":507000,"2021":1490000,"2022":46500,"2025":921000}},"closr":{"yt":{"2020":108}},"clxxer":{"yt":{"2022":8780}},"co1azo":{"x":{"2022":143515}},"coachboop":{"yt":{"2023":7850}},"cold":{"x":{"2022":10825},"yt":{"2020":320}},"commandment":{"x":{"2019":24123,"2020":41493,"2022":155208}},"convic":{"yt":{"2022":557}},"coop":{"yt":{"2020":3490}},"cooper":{"yt":{"2023":12700}},"core":{"yt":{"2020":6040}},"crackly":{"yt":{"2023":2740}},"criizux":{"yt":{"2021":23900,"2022":25900}},"crimz":{"x":{"2019":8607,"2020":31212,"2022":43195}},"crue":{"yt":{"2020":10300}},"crumble":{"yt":{"2020":438}},"crunchy":{"yt":{"2020":1650}},"crypty":{"yt":{"2020":1060}},"curly":{"yt":{"2020":130,"2024":438}},"cynical":{"yt":{"2021":189}},"dark":{"yt":{"2020":30}},"darkorino":{"yt":{"2021":880}},"darkxz":{"yt":{"2023":222}},"daruma":{"x":{"2020":163974},"yt":{"2019":171544,"2020":326000,"2021":336000,"2022":811000}},"daxor":{"yt":{"2020":5330,"2021":5980}},"dcawesomer":{"yt":{"2021":14800}},"deckzee":{"yt":{"2020":160}},"decyptos":{"x":{"2020":34497}},"degen":{"x":{"2020":780},"yt":{"2020":106}},"derox":{"x":{"2019":889}},"derponce":{"yt":{"2021":84300,"2025":83900}},"dexteriity":{"yt":{"2021":660}},"dhalucard":{"x":{"2019":67764,"2020":73562,"2021":94063},"yt":{"2025":96800}},"diablo":{"yt":{"2020":8630}},"diamond":{"yt":{"2020":179000}},"diegogb":{"x":{"2020":27729,"2021":58585},"yt":{"2021":13800}},"diguera":{"tw":{"2022":56599}},"ditrxx":{"yt":{"2021":28400}},"dog":{"yt":{"2020":797}},"dokko":{"x":{"2020":3382},"yt":{"2020":5790}},"dokn":{"yt":{"2020":391}},"dollarc":{},"domentos":{"x":{"2020":44374}},"domo":{"yt":{"2021":5010}},"drakonz":{"x":{"2020":128282}},"drg":{},"dubs":{"x":{"2019":48989,"2021":781048},"yt":{"2019":46761,"2020":306000,"2021":8580000}},"dukez":{"x":{"2021":7097},"yt":{"2020":1820,"2021":12400}},"dusky":{"x":{"2022":5983}},"dylan":{"x":{"2020":5972},"yt":{"2020":1420}},"dylannx":{"yt":{"2021":62}},"eclipse":{"yt":{"2021":1570}},"edgey":{"x":{"2020":174161,"2021":284172},"yt":{"2020":12900}},"edison":{"yt":{"2021":3260}},"eltensy":{"yt":{"2023":248}},"emxxrr":{"x":{"2020":23236}},"encrypted":{"yt":{"2021":89}},"endretta":{"x":{"2020":72755,"2021":230280},"tw":{"2021":432177}},"ente":{"yt":{"2020":410}},"envy":{"x":{"2020":8797}},"eomzo":{"yt":{"2025":1330}},"epikwhale":{"x":{"2019":14856,"2020":104410},"yt":{"2020":61800,"2023":213000}},"erima":{"x":{"2021":13922},"yt":{"2020":3350}},"eshz":{"yt":{"2022":7480}},"ess":{"yt":{"2021":27200}},"etq":{"x":{"2021":14234}},"evelone":{"tw":{"2021":7601}},"ewron":{"tw":{"2020":455314},"x":{"2020":6427}},"exe":{"yt":{"2021":182}},"extinct":{"yt":{"2020":322}},"falconer":{"x":{"2019":422,"2020":20317}},"falconly":{"yt":{"2020":1500}},"fastroki":{"x":{"2021":55724},"yt":{"2020":2110}},"fatch":{"x":{"2019":4820}},"favs":{"x":{"2022":30304},"yt":{"2020":2710,"2022":10900}},"faxuty":{"yt":{"2020":5170,"2025":4550}},"felipersa":{"x":{"2020":56198}},"ferrrnando":{"yt":{"2020":31700,"2021":32600}},"filipe":{"yt":{"2020":129000}},"fire":{"yt":{"2019":7510,"2020":28600}},"fleder":{"yt":{"2020":1460}},"flickzy":{"yt":{"2021":278}},"flikk":{"x":{"2020":48717,"2021":182269}},"flinty":{"yt":{"2021":60}},"floki":{"x":{"2021":103576},"yt":{"2021":47900}},"fnajen":{"yt":{"2021":1330,"2023":1540}},"forbes":{"yt":{"2023":5870},"tw":{"2022":8890}},"fram":{"yt":{"2020":2270,"2021":3330}},"frapai":{"x":{"2020":5524}},"fray":{"x":{"2020":46186,"2021":144968}},"fredoxie":{"x":{"2021":1726}},"freeze":{"yt":{"2025":487}},"frenzyfishy":{"yt":{"2025":26600}},"frttt":{"yt":{"2023":191000}},"fryst":{"x":{"2021":29838},"yt":{"2020":7160}},"funk":{"x":{"2021":59990},"yt":{"2021":36700}},"funkbomb":{"x":{"2021":59990},"yt":{"2021":36700}},"furious":{"x":{"2021":165893}},"fuzeac":{"yt":{"2020":172,"2021":217}},"g5rc":{"yt":{"2020":372}},"gabe":{"x":{"2021":36909}},"gandhi":{"yt":{"2021":12}},"gmoney":{"yt":{"2022":80900}},"gntl":{"x":{"2019":4317},"yt":{"2020":167000}},"godrabbit":{"yt":{"2020":1290}},"goku":{"yt":{"2021":285}},"goma":{"yt":{"2021":308}},"gooboz":{"x":{"2019":4519,"2020":16324},"yt":{"2020":49500}},"goosh":{"yt":{"2020":734}},"grolzz":{"yt":{"2021":432}},"gxt":{"yt":{"2021":98}},"hajie":{"yt":{"2020":583}},"hajuu":{"yt":{"2021":25}},"hamuppi":{"x":{"2020":50836,"2021":115892},"yt":{"2021":252000}},"happed":{"yt":{"2020":1050}},"hardfind":{"x":{"2020":23479},"yt":{"2020":293000}},"harukiyo":{"yt":{"2020":13000,"2021":25500,"2022":54800}},"heatzy":{"yt":{"2020":43400}},"heif":{"x":{"2021":7387}},"hellfire":{"yt":{"2021":170}},"hellonsteam":{"x":{"2022":14444},"yt":{"2020":1000}},"hen":{"x":{"2021":233952},"yt":{"2021":12600}},"herrions":{"x":{"2019":5709}},"higgs":{"yt":{"2022":5690}},"highsky":{"yt":{"2021":3340}},"hijoe":{"yt":{"2020":11}},"hiro":{"yt":{"2021":4180}},"histtory":{"x":{"2020":58656}},"hood.j":{"x":{"2020":5865},"yt":{"2020":1270,"2021":1660}},"hookka":{"yt":{"2021":68}},"hottie":{"yt":{"2021":383}},"hunter":{"x":{"2022":202677},"yt":{"2020":110000,"2021":110000}},"hype":{"yt":{"2021":4270}},"i4xpro":{"x":{"2021":8267},"yt":{"2021":2080}},"ibai":{"tw":{"2020":3862975,"2021":5309103,"2022":9601242,"2023":12878050,"2024":15526867,"2025":17209357},"x":{"2021":3475204,"2022":7399207},"yt":{"2019":200027,"2024":95200,"2025":277000}},"iciev":{"x":{"2020":644}},"idrop":{"x":{"2020":15070}},"ifr0zi":{},"illest":{"yt":{"2020":48700}},"illojuan":{"tw":{"2019":53130,"2022":1854276,"2025":4282834}},"ilyynina":{"yt":{"2021":108}},"irezumi":{"yt":{"2020":311}},"issa":{"x":{"2019":125296},"yt":{"2020":369000,"2022":352000}},"itemm":{"x":{"2020":47261}},"izo":{"yt":{"2021":252}},"jacob4tv":{"yt":{"2021":201000,"2023":253000}},"jaemon":{"yt":{"2020":45}},"jagveer":{"yt":{"2022":2}},"jahlyn":{"x":{"2020":14012},"yt":{"2019":40500,"2021":64600}},"jahq":{"yt":{"2020":6010,"2021":31300}},"jakei":{"yt":{"2020":2450}},"jammyz":{"x":{"2020":715}},"jamper":{"yt":{"2020":6050}},"jannisz":{"x":{"2020":9856,"2022":375283},"yt":{"2020":62500,"2021":61500,"2022":30600}},"jarko":{"yt":{"2023":409}},"jaspaay":{"yt":{"2020":38300}},"javery":{"x":{"2020":1770}},"jay":{"x":{"2020":48406,"2022":52883}},"jelty":{"x":{"2020":56898,"2022":612119},"tw":{"2021":2097156,"2022":2666545}},"jesse":{"x":{"2020":66306},"yt":{"2019":186661,"2020":337000,"2021":436000},"tw":{"2021":2361561,"2022":3031488,"2023":3102508,"2025":3164579}},"jiren":{"yt":{"2020":863}},"job":{"yt":{"2021":8,"2023":349}},"joey jenner":{"yt":{"2020":3950}},"joji":{"yt":{"2025":5660}},"jordan":{"x":{"2020":66306},"yt":{"2019":186661,"2020":337000,"2021":436000},"tw":{"2021":2361561,"2022":3031488,"2023":3102508,"2025":3164579}},"juliancom":{"yt":{"2020":36600}},"julle":{"yt":{"2021":15}},"jur3ky":{"x":{"2021":35174}},"justice":{"yt":{"2020":1280,"2022":9910}},"juu":{"yt":{"2020":2820,"2022":5630}},"jynx":{"x":{"2020":15824},"yt":{"2020":11600,"2021":60100,"2023":74500}},"jynxzi":{"tw":{"2024":5011208,"2025":6977198}},"k1ng":{"yt":{"2025":84800}},"k1nzell":{"yt":{"2020":18100}},"kaboo":{"yt":{"2021":382}},"kagetora":{"yt":{"2020":2040,"2021":2120}},"kami":{"x":{"2020":1563,"2022":157970},"yt":{"2021":1870,"2023":86200}},"kana":{"yt":{"2020":55,"2022":1950}},"karma":{"x":{"2021":21627}},"kartun":{"yt":{"2020":434}},"kaxie":{"x":{"2020":5473}},"kayez":{"yt":{"2020":601}},"kefyy":{"yt":{"2021":717}},"kentach":{"yt":{"2022":5830}},"khanada":{"x":{"2020":97739},"yt":{"2020":79100,"2021":154000}},"kiduoo":{"yt":{"2021":438}},"kikoo":{"x":{"2021":64302},"yt":{"2020":24900,"2021":82800}},"kilua":{"yt":{"2020":1390}},"kimchi":{"yt":{"2024":29100}},"king":{"x":{"2020":155160,"2022":241665},"yt":{"2020":137000}},"kinstaar":{"yt":{"2019":839115,"2020":888000,"2021":449000,"2022":955000}},"kiritokun":{"x":{"2022":29345},"yt":{"2020":3960}},"kiro":{"yt":{"2020":203}},"kiryache32":{"x":{"2020":24647}},"kitoz":{"yt":{"2020":14800}},"klusia":{"x":{"2019":6168},"yt":{"2020":1470}},"knight":{"x":{"2020":7817}},"koa":{"yt":{"2020":31}},"kogane":{"yt":{"2020":9140}},"kolorful":{"yt":{"2020":1730}},"kono":{"yt":{"2020":2120}},"korq":{"yt":{"2020":266}},"kovaaksxd":{"yt":{"2021":733}},"koyota":{"yt":{"2021":74}},"kquid":{"x":{"2022":29444},"yt":{"2020":54600}},"kreo":{"x":{"2019":17601,"2021":266327}},"krisp":{"yt":{"2021":436}},"krool":{"yt":{"2020":100,"2021":139}},"krypas":{"yt":{"2021":281}},"kuki":{"yt":{"2021":990}},"kurara":{"yt":{"2022":14100}},"kuren":{"yt":{"2021":296}},"kurukuru":{"yt":{"2019":2830,"2020":3940}},"kwanti":{"yt":{"2021":275}},"kylie":{"x":{"2022":57407},"yt":{"2020":2360}},"kytrex":{"yt":{"2020":13800}},"kyzui":{"x":{"2019":6976},"yt":{"2020":19500,"2022":20300}},"l0wk3y":{"yt":{"2021":272}},"l1nk":{"x":{"2021":23023}},"lacy":{},"lagarto":{},"larson":{"x":{"2021":1731},"yt":{"2020":72}},"lasers":{"yt":{"2021":3150000}},"lazarbeam":{"x":{"2020":803535,"2021":2086184},"yt":{"2021":2480000,"2022":3260000}},"lazarp":{"yt":{"2025":25700}},"lazy":{"yt":{"2021":114}},"lefteye":{"yt":{"2020":1270}},"legedien":{"yt":{"2020":4770}},"leleo":{"yt":{"2020":52400}},"letiltz":{"tw":{"2021":11503}},"letshe":{"yt":{"2020":159000,"2022":646000}},"lettuce":{"yt":{"2019":126,"2020":65800}},"letw1k3":{},"lexqss":{},"lezix":{"yt":{"2020":1020}},"lgndrybanana":{"yt":{"2022":259}},"link":{"yt":{"2020":2980}},"linx":{"yt":{"2020":412}},"lnuef":{"yt":{"2020":159}},"lodstk":{"yt":{"2021":1380}},"loki":{"yt":{"2021":1750}},"looter":{"yt":{"2020":1420,"2023":81600}},"loserfruit":{"tw":{"2019":1058754,"2020":1560758,"2021":2538829,"2022":2722818,"2023":2857200,"2025":2996660}},"louis":{"yt":{"2021":26700}},"lozer":{"yt":{"2021":454}},"lucci":{"yt":{"2023":64}},"m0ne":{"yt":{"2021":23}},"m0untain":{"yt":{"2020":88}},"macchan":{"yt":{"2020":140}},"macheew":{"yt":{"2021":486}},"mackwood":{"x":{"2020":74665,"2021":294601},"yt":{"2021":6000}},"malibuca":{"x":{"2021":28398},"yt":{"2022":40800}},"malkawi":{"yt":{"2020":188}},"mariuscow":{"yt":{"2021":213}},"marzz_ow":{"x":{"2020":14786},"yt":{"2020":52800}},"mason":{"yt":{"2021":57}},"master":{"yt":{"2020":171000}},"matsoe":{"yt":{"2020":25700}},"maufin":{"x":{"2020":143841},"yt":{"2019":63865,"2021":420000,"2022":442000}},"mawakha":{"yt":{"2021":6430}},"maxiking":{"yt":{"2024":420}},"meah":{"yt":{"2022":52}},"mechton":{"yt":{"2020":7340,"2021":131}},"medusa":{"yt":{"2020":5940,"2021":21700}},"megadan":{"yt":{"2021":64,"2022":89}},"megga":{"x":{"2019":33371,"2021":624669}},"melany":{"x":{"2020":18523},"yt":{"2022":322000}},"merem":{"yt":{"2022":29500}},"mero":{"x":{"2020":2774},"yt":{"2021":37100}},"mesportt":{"yt":{"2021":6}},"mexe":{"yt":{"2020":13800}},"michael":{"yt":{"2020":32,"2021":20100}},"middi":{"yt":{"2020":3180}},"mikey":{"x":{"2021":38627},"yt":{"2022":9030}},"milan":{"x":{"2020":89289},"yt":{"2021":39100}},"minipiyo":{"yt":{"2022":1530,"2024":39800}},"minty":{"yt":{"2020":1230,"2021":1400}},"minzho":{"x":{"2020":1929,"2021":3613}},"mitr0":{"x":{"2020":354184,"2022":1041513},"yt":{"2019":51932,"2020":442000,"2022":730000}},"miya":{"yt":{"2020":2290}},"mkmkpapa":{"yt":{"2020":63,"2021":247}},"mojak":{"yt":{"2021":38800}},"mongraal":{"x":{"2019":224858,"2020":682554,"2021":1710118},"yt":{"2024":22700},"tw":{"2019":1469473,"2020":2501815,"2021":3805245,"2022":5094401,"2023":5897957,"2025":7131370}},"mony":{"yt":{"2020":706,"2021":1170}},"mooseggs":{"yt":{"2020":78}},"motor":{"yt":{"2025":121000}},"mrsavage":{"x":{"2019":157511,"2020":447677,"2022":1303829},"yt":{"2021":83100,"2022":39000,"2023":45500,"2025":206000},"tw":{"2021":2212296,"2022":2610765,"2025":4475583}},"msg":{"x":{"2021":6099}},"mstzera":{"yt":{"2021":3060}},"muka":{"yt":{"2022":90}},"muz":{"x":{"2021":30221},"yt":{"2021":13100}},"mystick":{"x":{"2020":54435}},"mаеstго":{},"nach":{"yt":{"2021":342}},"naekoz":{"yt":{"2020":3690}},"naetor":{"x":{"2021":103816},"yt":{"2020":26000}},"naevz":{"yt":{"2022":1160}},"nani":{"x":{"2021":7909}},"nanoide":{"yt":{"2025":13300}},"nanolite":{"yt":{"2020":23400}},"narwhal":{"yt":{"2021":964}},"nate hill":{"x":{"2019":116439,"2020":443151,"2021":500251,"2022":500888},"yt":{"2020":552000,"2021":673000,"2022":673000}},"nayte":{"x":{"2019":34249,"2020":163434,"2021":261079}},"nebs":{"yt":{"2020":142}},"neeqo":{"yt":{"2020":1240}},"nekko":{"yt":{"2020":155}},"nemutaiyo":{"yt":{"2020":8700,"2021":9360}},"nephrite":{"x":{"2020":136081,"2021":235202,"2022":286909},"yt":{"2024":979000}},"netzz":{"yt":{"2021":336}},"nexy":{"yt":{"2020":9130}},"nicks":{"x":{"2020":153529},"yt":{"2022":526000}},"nikof":{"x":{"2020":211838},"yt":{"2019":12943,"2020":108000}},"ninja":{"x":{"2019":3895101,"2020":5475357,"2022":6773741},"tw":{"2019":14036952,"2020":14679317,"2021":16654832,"2022":17471739,"2023":18458801,"2024":19017143,"2025":19194293}},"njby":{"yt":{"2020":29800,"2022":51700}},"noahreyli":{"yt":{"2025":344}},"noia":{"yt":{"2021":126}},"nosh":{"x":{"2020":57571}},"noward":{"x":{"2020":59651},"yt":{"2020":2380}},"npen":{"yt":{"2020":2260,"2021":36}},"nut":{"x":{"2022":27654}},"nyhrox":{"x":{"2019":27741,"2020":148498,"2021":337470,"2022":333866},"yt":{"2019":28100,"2021":79500}},"nyle":{"yt":{"2020":2990}},"nyx":{"x":{"2020":426},"yt":{"2022":647}},"oatley":{},"obito":{"yt":{"2020":1470}},"okis":{"yt":{"2020":28500}},"oliverog":{"yt":{"2021":1340}},"on1":{"yt":{"2020":1460}},"opai":{"x":{"2020":19740}},"oslo":{"x":{"2020":119899,"2022":156389},"yt":{"2019":5996}},"osydd":{"yt":{"2020":1170}},"outlaw":{"yt":{"2020":307000}},"overstrand":{"yt":{"2020":1310,"2021":6070}},"owl":{"x":{"2020":5486},"yt":{"2020":2210}},"ozirvo":{"yt":{"2020":648}},"pablowingu":{"x":{"2021":29403}},"packo":{"yt":{"2020":4610}},"pamstou":{"x":{"2021":18537},"yt":{"2021":2230}},"pancake":{"x":{"2019":371}},"paper":{"x":{"2021":136409},"yt":{"2020":24200}},"patriota":{"x":{"2019":105161,"2020":120779}},"peach":{"yt":{"2020":1000}},"pearl":{"yt":{"2020":3410}},"pepoclip":{"yt":{"2020":115}},"persa":{"x":{"2020":56198}},"peterbot":{"x":{"2022":42422},"yt":{"2021":13200}},"pgod":{"yt":{"2021":37100,"2022":36000}},"pika":{},"pina":{"yt":{"2022":4680}},"pinq":{"yt":{"2020":25000}},"pixovsky":{"yt":{"2020":16}},"piz":{},"pkr29":{"yt":{"2020":68}},"plege":{"x":{"2021":9156}},"pnkayy":{"yt":{"2020":288,"2021":478}},"podasai":{"yt":{"2019":1390},"tw":{"2024":160985}},"poffiee":{},"pozed":{"yt":{"2021":390}},"prbk":{"yt":{"2020":29}},"predage":{"x":{"2021":2135}},"primzhy":{"yt":{"2020":2150}},"psalm":{"x":{"2019":9226,"2020":48785}},"pulga":{"yt":{"2021":378000}},"punisher":{"x":{"2020":13488},"yt":{"2021":2680}},"pxlarized":{"yt":{"2021":6970}},"pxmp":{"yt":{"2021":3360}},"pykz":{"yt":{"2021":275}},"qb":{"x":{"2021":2256}},"qjac":{"yt":{"2019":19500,"2020":67600,"2021":68400}},"queasy":{"x":{"2021":133245,"2022":200888},"yt":{"2020":2470,"2023":67000}},"quinn":{"yt":{"2020":3920,"2021":1280}},"rabid":{"yt":{"2020":225}},"radius":{"yt":{"2020":94400,"2021":23200}},"raed":{"yt":{"2020":143}},"raifla":{"x":{"2021":30319},"yt":{"2020":8480,"2021":62100}},"raiku":{"x":{"2022":4194}},"rainy":{},"raizen":{"yt":{"2022":1010}},"rakso":{},"ranger":{"x":{"2020":61453},"yt":{"2021":64600}},"rapid":{"yt":{"2021":16}},"raru":{"yt":{"2019":223,"2020":2330}},"raze":{"yt":{"2020":586}},"razl":{"yt":{"2020":340}},"redlee":{"yt":{"2020":1670}},"reeloads":{"x":{"2019":853}},"reet":{"x":{"2022":276991},"yt":{"2020":138000}},"refsgaard":{"x":{"2022":141661},"yt":{"2020":17500}},"rehx":{"x":{"2020":27624}},"reign":{},"reiner":{"yt":{"2020":470}},"rel":{"x":{"2021":21688}},"remi":{"yt":{"2020":597}},"repairs":{"yt":{"2020":49300,"2021":48200}},"repulsegod":{},"retake":{"yt":{"2021":581}},"reverse2k":{"x":{"2020":99543,"2022":202289},"yt":{"2021":102,"2022":573},"tw":{"2021":460652}},"revised":{"yt":{"2021":1590}},"rezon ay":{"yt":{"2023":168000}},"ria":{"yt":{"2021":16}},"riam":{"x":{"2021":10722},"yt":{"2021":75}},"richhomiequinn":{"yt":{"2020":3920,"2021":1280,"2025":175000}},"rifty":{"yt":{"2020":287}},"rimr":{"x":{"2021":86524},"yt":{"2021":26300,"2022":68500}},"river":{"yt":{"2023":171}},"rizart":{"yt":{"2019":214225,"2020":309000,"2021":440000,"2022":462000}},"robabz":{"x":{"2022":86446}},"robban":{"yt":{"2020":70}},"robleis":{"tw":{"2021":2183754,"2022":3732925,"2024":5773237,"2025":5880560},"yt":{"2021":2690000,"2022":1500000,"2023":2060000}},"robot":{"yt":{"2020":34500,"2021":39300}},"rocaine":{"x":{"2022":20800},"yt":{"2020":64}},"rocca":{"yt":{"2020":1300}},"rogueshark":{"x":{"2021":45046}},"rojo":{"x":{"2020":27652},"tw":{"2022":11412}},"ronin":{"yt":{"2025":1880}},"rudex":{"yt":{"2022":97700}},"runa":{"yt":{"2020":792}},"ruri":{"yt":{"2020":139000,"2021":177000,"2022":189000}},"rustyk":{"x":{"2020":34025}},"ryle":{"yt":{"2020":2450,"2021":4370}},"saevid":{"x":{"2020":23351,"2021":141318},"yt":{"2020":66500,"2021":193000}},"saf":{"x":{"2020":289934},"yt":{"2020":11100,"2021":29900}},"saiu":{"yt":{"2019":168,"2021":514}},"salko":{"yt":{"2021":13}},"sandman":{"yt":{"2022":169}},"sane":{"yt":{"2020":2850}},"savaje":{"yt":{"2023":209}},"sayara":{"yt":{"2021":15,"2022":46}},"scarebear":{"yt":{"2021":160}},"scarlet":{"x":{"2019":33772,"2020":10937},"yt":{"2019":58119,"2020":101000,"2021":199000,"2022":62700}},"sceptic":{"x":{"2019":48434,"2022":105254},"tw":{"2024":719017}},"scoped":{"x":{"2022":462567},"yt":{"2020":40400,"2021":297000}},"scriwy":{"yt":{"2020":437}},"scuffys":{"yt":{"2022":1530}},"seanvp":{"yt":{"2020":1450}},"sebby":{"yt":{"2021":11800}},"serpennt":{"yt":{"2020":221}},"setty":{"yt":{"2021":19900,"2022":64700}},"shady":{"yt":{"2022":1950}},"shaker":{"yt":{"2024":884}},"shaykoz":{"x":{"2021":12294}},"shinck":{"yt":{"2020":59000}},"shivfps":{"x":{"2020":11440},"yt":{"2020":72600}},"shmeky":{"yt":{"2021":18400}},"shonye":{"yt":{"2020":24200}},"shunsyan":{"x":{"2021":166224},"yt":{"2020":9680,"2021":103000,"2022":135000}},"sinlord":{"yt":{"2022":1410}},"sinooh":{"x":{"2019":3986,"2020":11049}},"sirence":{"yt":{"2021":154}},"skite":{"x":{"2019":119495}},"skqttles":{"yt":{"2020":659,"2021":7440}},"skram":{"x":{"2022":68801}},"skrill":{"yt":{"2021":68}},"skydeun":{"yt":{"2020":18800}},"skyla":{"x":{"2019":3110}},"slackes":{"x":{"2021":64108},"yt":{"2021":744000}},"slaya":{"x":{"2020":28800},"tw":{"2022":12656}},"slays":{"yt":{"2021":38600}},"slick":{"x":{"2021":103382}},"slix":{"x":{"2020":3749,"2021":30992}},"slq":{"yt":{"2021":908}},"smeef":{"yt":{"2025":8330}},"smqcked":{"x":{"2022":46993}},"snacky":{"x":{"2022":43210}},"snake":{"yt":{"2021":3160}},"snap":{"yt":{"2020":62300,"2021":77400}},"snayzy":{"x":{"2020":48406,"2021":86370}},"snow":{"yt":{"2019":54300,"2020":57800}},"somin":{"yt":{"2020":17300}},"souriano":{"x":{"2019":1170},"yt":{"2020":152000,"2021":306000}},"sparebow":{"yt":{"2022":2170}},"spayde":{"yt":{"2019":27800,"2020":136000}},"spayed":{"yt":{"2021":1970}},"spectral":{"yt":{"2021":384}},"speedynd":{"yt":{"2019":53364}},"sphinx":{"yt":{"2022":472}},"spidermon":{"yt":{"2020":41400}},"spitflow":{"yt":{"2021":37700,"2022":4640}},"spraz":{"x":{"2020":370}},"spy":{"yt":{"2019":40900,"2020":132000,"2021":155000,"2025":3340000}},"stableronaldo":{"tw":{"2021":2292603,"2022":2565730,"2025":3675662},"yt":{"2020":435000,"2022":1070000,"2023":1110000}},"steelix":{"yt":{"2020":60800}},"stenno":{"yt":{"2022":191}},"sticks":{"yt":{"2020":2340}},"stork":{"yt":{"2020":6000,"2022":18800}},"strendd":{"x":{"2021":78312}},"stretch":{"x":{"2019":39},"yt":{"2020":26400}},"strobe":{"yt":{"2020":17100}},"styrsix":{"yt":{"2020":589}},"surprise":{"yt":{"2020":130}},"susscript":{"yt":{"2025":195}},"swag":{"yt":{"2019":327}},"swapz":{"yt":{"2020":987}},"sway":{"yt":{"2019":676130,"2020":2650000,"2021":3910000}},"swizzy":{"yt":{"2019":48,"2020":46,"2022":3080}},"swurl":{"yt":{"2021":1400}},"syamu":{"yt":{"2020":3520}},"symfuhny":{"x":{"2019":460407,"2020":563524},"yt":{"2019":637000,"2020":691000,"2022":1040000},"tw":{"2019":1565464,"2020":1948846,"2021":3058965,"2022":3547396,"2025":4043936}},"sync":{"yt":{"2025":285000}},"t3eny":{"yt":{"2020":350}},"tabzg":{"x":{"2020":15796},"yt":{"2021":503}},"tade":{"yt":{"2020":9680}},"takamura":{"yt":{"2020":139000,"2021":177000,"2022":189000}},"tako":{},"tautai":{"yt":{"2021":917}},"tayson":{"x":{"2020":8200,"2021":355904},"yt":{"2022":406000}},"taytan":{"yt":{"2020":3340}},"teejay":{"yt":{"2021":2240}},"teeq":{"x":{"2020":27555,"2021":97016},"yt":{"2020":924}},"tekmarr":{"yt":{"2020":1480}},"temple":{"x":{"2020":1205}},"teqqz":{"yt":{"2021":30,"2022":1350}},"teroq":{"yt":{"2020":276,"2022":805}},"teyo":{"x":{"2021":13251},"yt":{"2021":769}},"tfue":{"yt":{"2019":8797361,"2020":11500000,"2021":5630000,"2022":5710000},"tw":{"2019":5906064,"2020":8251149,"2021":10210781,"2022":10879860,"2023":11410763,"2024":11403504,"2025":11326015}},"th0mashd":{"x":{"2020":15245},"yt":{"2020":1030,"2022":123000}},"thaitanks":{"yt":{"2020":70}},"thegrefg":{"tw":{"2020":4310850,"2021":6366503,"2022":9576310,"2024":11889559,"2025":12181616},"x":{"2019":2971518,"2020":3329069,"2021":4653451,"2022":5813784},"yt":{"2021":5790000,"2022":6160000,"2023":6200000,"2024":6130000}},"thomuss":{"yt":{"2021":2580}},"thomuss_":{"yt":{"2021":2580}},"threats":{"x":{"2021":37217},"yt":{"2021":242,"2023":5040}},"till":{"yt":{"2020":4}},"tinka":{"yt":{"2023":80}},"tinkerbel1x":{"yt":{"2022":490}},"tisco":{"yt":{"2022":321}},"toose":{"yt":{"2021":174000,"2022":245000}},"tori":{"yt":{"2019":807,"2020":929}},"tragix":{"yt":{"2021":1270}},"trippernn":{"x":{"2020":6200},"yt":{"2021":194}},"trix":{"yt":{"2019":312}},"trulex":{"x":{"2021":40655}},"tschinken":{"x":{"2019":84512},"yt":{"2020":5040}},"tubbo":{"tw":{"2020":1026928,"2021":3002074,"2022":4828573,"2023":5105929,"2024":5268607,"2025":5252409}},"tuckz":{"yt":{"2021":2370}},"tuexy":{"yt":{"2025":12300}},"twayko":{"x":{"2019":17363,"2020":66626}},"twunti":{"yt":{"2020":3810}},"typical gamer":{"x":{"2019":822040,"2020":849373,"2022":1016006}},"tyraxe":{"yt":{"2020":1240}},"tzuyu":{"yt":{"2020":250}},"umplify":{"x":{"2021":82361},"yt":{"2020":44600}},"unit":{"x":{"2021":36461}},"unknown":{"yt":{"2021":3030}},"unsightly":{"yt":{"2020":457}},"userz":{"yt":{"2021":129}},"vadeal":{"yt":{"2020":21700}},"vanilla":{"x":{"2019":52348},"yt":{"2019":75189,"2020":98000,"2021":98300}},"vanillaz":{"yt":{"2021":34}},"veer":{"yt":{"2020":6420}},"veno":{"yt":{"2024":2040}},"verox":{"x":{"2020":75955},"yt":{"2019":3660}},"vetle":{"x":{"2021":8092}},"vic0":{"yt":{"2021":426}},"vicens":{"x":{"2020":267248}},"virsuh":{"yt":{"2020":2010}},"visxals":{"x":{"2021":4982}},"voil":{"x":{"2021":14535},"yt":{"2023":2000}},"voltiax":{"yt":{"2020":187}},"vortexers":{"yt":{"2021":6}},"vortexm":{"yt":{"2020":664}},"vorwenn":{"x":{"2019":44059,"2020":108300}},"vyx":{"yt":{"2020":380}},"wakie":{"x":{"2020":22389,"2021":67395}},"wanlast":{"yt":{"2020":3770}},"wavyjacob":{},"whofishy":{"yt":{"2025":346}},"wickesy":{"yt":{"2022":13700}},"wildhawk":{"x":{"2021":155538},"yt":{"2020":121000,"2021":200000,"2022":257000}},"will":{"x":{"2021":1552}},"winter":{"yt":{"2021":886,"2022":1380}},"wolfiez":{"x":{"2021":596910}},"worthy":{},"wreckless":{"yt":{"2021":201}},"xccept":{"yt":{"2021":650}},"xenolith":{"yt":{"2020":56}},"xjam":{"yt":{"2020":3140,"2021":4720}},"xkumu":{"yt":{"2020":149}},"xmipoli":{"yt":{"2020":4770}},"xoonies":{"yt":{"2020":1460}},"xsweeze":{"x":{"2021":82534},"yt":{"2020":1590,"2021":13000}},"yama":{"x":{"2021":32566},"yt":{"2020":4230}},"yasir":{"yt":{"2020":10300,"2021":44000}},"yiyan":{"yt":{"2020":187}},"yonx":{"yt":{"2020":8980,"2022":17500}},"yuleys":{"yt":{"2023":305}},"yusea":{"yt":{"2022":59100}},"yusef":{},"yuz":{"yt":{"2020":213}},"zandy":{"yt":{"2020":19400,"2022":56200}},"zarby":{"x":{"2019":30485},"yt":{"2020":63900,"2021":84000},"tw":{"2022":101673,"2023":100188}},"zayt":{"x":{"2019":84449,"2022":612436}},"zeeyadx":{"x":{"2022":110919},"yt":{"2022":910000}},"zemie":{"yt":{"2021":7640}},"zepher":{"yt":{"2020":23500}},"zeus":{"yt":{"2020":90}},"znappy":{"x":{"2021":45077}},"zno":{"yt":{"2022":213}},"zormanworld":{"x":{"2019":147937,"2020":149413},"yt":{"2019":376885,"2020":494000,"2021":1950000,"2024":771000}},"zq":{"x":{"2021":85663},"yt":{"2019":95}},"zroqz":{"yt":{"2020":145}},"zyfa":{"x":{"2019":5085,"2020":17518,"2021":91954},"yt":{"2023":27100}}};
// ==== /CC_PRO_SOCIAL_HIST ====
// ==== CC_CREATOR_SOCIAL (tools/build-creator-socials.js) ====
const CC_CREATOR_SOCIAL={"qlnek":[54200,61663],"Arky":[12100,63102],"Ash Alk":[1530,5850],"At0m":[22700,12382],"AussieAntics":[178000,743713],"Babi":[4920000,1058206],"Boter":[115000,42302],"Braeden":[6100,0],"Carola":[1030000,1202492],"Carrera":[1950000,1646382],"Chanzes":[344000,43183],"CoachBoop":[0,129347],"Crackly":[8620,11011],"Derponce":[82000,45],"Dhalucard":[93900,106249],"Ewron":[65300,94796],"FRTTT":[493000,88416],"Fraanticc":[76300,400402],"Ibai":[544000,17012107],"IlloJuan":[847000,0],"Isafaracco":[32100,3253],"Jacob4TV":[339000,0],"Jolavanille":[651000,211100],"Kubx":[193000,97310],"Lacy":[22600,633275],"LazarBeam":[5050000,2481852],"Letiltz":[292,11455],"Loserfruit":[200000,0],"Mantovani":[2120000,0],"Melany":[322000,27946],"Nanoide":[19900,22162],"Nephrite":[1010000,336581],"OLui":[60500,50922],"Overstrand":[129000,45221],"Patriota":[19400,206999],"Piz":[5350,49096],"Rawdogmoon":[0,11205],"Reddysh":[53600,32884],"Robleis":[5300000,3276379],"Rudex":[113000,59101],"ShivFPS":[650000,227467],"Sommerset":[7830,288503],"StableRonaldo":[1450000,1876846],"TheGrefg":[6090000,8153649],"Tubbo":[1100000,3538760],"Typical Gamer":[9390000,1020537],"Vascurado":[1010000,29233],"Vicens":[1910000,429328],"Winter":[200000,11351],"Worthy":[5670,10650],"Yugi":[16500,31295],"Yusef":[5800,0],"Zemie":[38100,41303],"ZormanWorld":[1950000,620241],"a2guapo":[923,36838],"ilyynina":[6580,14339],"mooda":[345000,31688],"primatepaige":[27200,21190]};
// ==== /CC_CREATOR_SOCIAL ====
function ccTwSat(tw, k){ return 1/Math.sqrt(1+Math.max(0, tw||0)/k); }
/* Известность в сцене (reach) приводит зрителей, но не больше, чем канал способен удержать: у пустого канала её
   доля была reach·0.008 без потолка, и про без фолловеров открывал эфир на 90 тысяч (28.10, его «у меня 90к онлайна,
   когда нет фоловеров»). Теперь от сцены — не больше 20 + 3 % фолловеров: новичок со звёздным именем собирает
   десятки, а не десятки тысяч, и онлайн растёт вместе с каналом. */
function ccTwViewersOf(tw, reach){
  const fol=Math.max(0, tw||0);
  return Math.max(3, Math.round(fol*0.06*ccTwSat(fol, CC_TW_SAT.view) + Math.min((reach||0)*0.008, 20+fol*0.03)));
}
function ccTwFolRate(tw){ return ccTwSat(tw, CC_TW_SAT.fol); }
/* Сейв, выросший на старой формуле, несёт сотни миллионов фолловеров; насыщение
   его не лечит — оно только останавливает рост. Потолок один раз при загрузке:
   6 млн — столько у самого крупного канала сцены (Bugha 5.4 млн, Clix ≈3 млн). */
const CC_TW_CEIL=6000000;
/* НАСТОЯЩИЕ TWITCH И YOUTUBE ПРО 2026 ГОДА (28.10, его «можешь игрокам 2026 года подтянуть цифры твич и ютуб»).
   Каналы — из анкет Liquipedia (|twitch=, |youtube=: ссылка со страницы самого игрока), фолловеры Twitch — публичный
   GraphQL Twitch, подписчики YouTube — страница канала; tools/fetch-liqui-socials.js, fetch-pro-twitch-followers.js,
   fetch-pro-youtube-subs.js, сборка tools/build-pro-socials.js. Снимок 28.10.2026, поэтому только карьера 2026 года:
   в 2019-м у Peterbot не было миллиона на Twitch. Ключ — ник в нижнем регистре; [фолловеры Twitch, подписчики YouTube]. */
function ccProSocial(handle){
  const k=String(handle||'').toLowerCase();
  return (typeof CC_PRO_SOCIAL!=='undefined' && CC_PRO_SOCIAL[k]) || [0, 0, 0];
}
function ccProSocialStart(card){
  if(!card || !card.handle) return [0, 0, 0];
  return ccProSocialAt(card.handle, ccPickedYear());
}
/* СОЦСЕТИ ПРО В ПРОШЛЫЕ ГОДЫ (28.10, его «другим годам всю статистику по соцсетям, но чтоб цифры были именно тех годов»;
   выбран вариант «замер + оценка»). [Twitch, YouTube, X] на февраль года — старт сезона карьеры:
   1. замер этого года из снимка Wayback (CC_SOC_HIST, tools/fetch-wayback-socials.js) — как есть;
   2. между замерами и нынешним числом (октябрь 2026) — по логарифму, как растут каналы;
   3. раньше первого замера, или замеров нет вовсе — нынешнее (или первое замеренное) число по средней кривой
      CC_SOC_CURVE: медиана «февраль года / октябрь 2026» у всех замеренных (tools/build-pro-social-history.js).
   Twitch — по снимкам страниц SocialBlade (29.10; у twitch.tv в снимках чисел нет): свои замеры — как X и YouTube выше.
   Замеров Twitch нет, а X есть — ДОПУЩЕНИЕ: Twitch растёт как его X; нет ничего — средняя кривая Twitch.
   2026 и дальше — нынешние числа. */
function ccProSocialAt(handle, year){ return ccSocialAt(handle, ccProSocial(handle), year); }
// То же для креатора (29.10, его пункт 1 «соцсети креаторов по годам»): нынешние [Twitch, YouTube, X] — CC_PROAM_TWITCH и CC_CREATOR_SOCIAL.
function ccCreatorSocialAt(name, year){
  const [yt, x]=ccCreatorSocial(name);
  return ccSocialAt(name, [ccProAmFollowers(name)||0, yt, x], year);
}
function ccSocialAt(handle, now, year){
  if(!(year<2026)) return now;
  const k=String(handle||'').toLowerCase();
  const H=(typeof CC_SOC_HIST!=='undefined' && CC_SOC_HIST[k]) || {}, C=(typeof CC_SOC_CURVE!=='undefined') ? CC_SOC_CURVE : null;
  const one=(net, cur)=>{
    const h=H[net] || {};
    if(h[year]!=null) return h[year];
    const pts=Object.keys(h).map(Number).filter(y=>h[y]>0).sort((a,b)=>a-b).map(y=>[y, h[y]]);
    if(cur>0) pts.push([2026.8, cur]);
    if(!pts.length) return 0;
    const curve=y=>(C && C[net] && C[net][y]) || 1;
    const after=pts.find(p=>p[0]>year), before=pts.slice().reverse().find(p=>p[0]<year);
    if(before && after) return Math.round(Math.exp(Math.log(before[1]) + (Math.log(after[1])-Math.log(before[1]))*(year-before[0])/(after[0]-before[0])));
    if(after) return Math.round(after[1]*curve(year)/(after[0]>=2026 ? 1 : curve(after[0])));
    return Math.round(before[1]);
  };
  const x=one('x', now[2]);
  const tw=(!(H.tw && Object.keys(H.tw).length) && H.x && Object.keys(H.x).length && now[2]>0 && now[0]>0) ? Math.round(now[0]*Math.min(1, x/now[2])) : one('tw', now[0]);
  return [tw, one('yt', now[1]), x];
}
// Канал YouTube на старте: настоящие подписчики; от 1000 — уже в партнёрке, как любой живой канал такого размера.
function ccProSocialYt(card){
  const subs=ccProSocialStart(card)[1];
  if(!subs) return undefined;
  return {subs:subs, views:0, hours:subs>=1000 ? 4000 : 0, usd:0, vids:[], real:subs};
}
// Медийка на карточке выбора готового игрока (28.10, его «при выборе игрока готового медийку ещё писать»): Twitch и YouTube.
function ccProMediaHTML(p){
  const [tw, yt, x]=ccProSocialStart(p);
  return ccMediaChipsHTML(tw, yt, x);
}
/* YouTube и X контент-мейкеров (28.10, его «почему только твич у контент-мейкеров, добавь ютуб и x»). Ссылки — с панели
   соцсетей на их собственном канале Twitch (tools/fetch-creator-socials.js), числа — теми же сборщиками, что у про;
   справочник CC_CREATOR_SOCIAL: имя → [подписчики YouTube, подписчики X]. */
function ccCreatorSocial(name){ return (typeof CC_CREATOR_SOCIAL!=='undefined' && CC_CREATOR_SOCIAL[name]) || [0, 0]; }
function ccCreatorMediaHTML(name){
  const [tw, yt, x]=ccCreatorSocialAt(name, ccPickedYear());
  return ccMediaChipsHTML(tw, yt, x);
}
function ccCreatorYt(name){
  const subs=ccCreatorSocialAt(name, ccPickedYear())[1];
  return subs ? {subs:subs, views:0, hours:subs>=1000 ? 4000 : 0, usd:0, vids:[], real:subs} : undefined;
}
function ccMediaChipsHTML(tw, yt, x){
  if(!tw && !yt && !x) return '';
  return '<span class="cc-card-media">'+(x ? '<i class="cc-m-x">X '+ccFollowers(x)+'</i>' : '')+(tw ? '<i class="cc-m-tw">Twitch '+ccFollowers(tw)+'</i>' : '')+(yt ? '<i class="cc-m-yt">YouTube '+ccFollowers(yt)+'</i>' : '')+'</span>';
}
function ccMigrateProSocial(){
  const cr=CAREER && CAREER.career, p=CAREER && CAREER.player;
  if(!cr || !p || !p.handle) return false;
  const y0=cr.year0||cr.year;
  // Прошлые годы (28.10, ccProSocialAt): сейв прошлого года получает числа своего нынешнего года, один раз (proSocialY).
  if(y0!==2026){
    if(cr.proSocialY) return false;
    cr.proSocialY=1;
    const [tw, yt, x]=ccProSocialAt(p.handle, cr.year||y0);
    if(x>(cr.reach||0)) cr.reach=x;
    if(tw>(cr.twitch||0)) cr.twitch=tw;
    if(yt){ const y=ccYt(); if(yt>(y.subs||0)){ y.subs=yt; y.real=yt; if(yt>=1000) y.hours=Math.max(y.hours||0, 4000); } }
    return true;
  }
  if(cr.proSocial>=2) return false;
  const first=!cr.proSocial;
  cr.proSocial=2;   // 2 — с подписчиками X (28.10, его «тогда пусть и X подписчики пишутся»)
  const [tw, yt, x]=ccProSocial(p.handle);
  if(x>(cr.reach||0)) cr.reach=x;
  if(!first) return true;
  if(tw>(cr.twitch||0)) cr.twitch=tw;
  if(yt){ const y=ccYt(); if(yt>(y.subs||0)){ y.subs=yt; y.real=yt; if(yt>=1000) y.hours=Math.max(y.hours||0, 4000); } }
  return true;
}
/* Twitch про того же порядка, что X: у 1014 про с каналом (CC_PRO_SOCIAL) Twitch/X медиана 0.95–1.5,
   нижняя четверть 0.4–0.76 во всех размерах. Раньше Twitch рос только от своих эфиров, и X 95 тыс. стоял
   против Twitch 443. Доля по нижней четверти: канал есть и у того, кто стримит мало. */
const CC_TW_FROM_X=0.5;
// Сейв, где X ушёл далеко вперёд Twitch, подтягивается один раз до той же доли.
function careerMigrateTwitchFromX(){
  const cr=CAREER && CAREER.career; if(!cr || cr.twX) return false;
  cr.twX=1;
  const floor=Math.min(CC_TW_CEIL, Math.round((cr.reach||0)*CC_TW_FROM_X));
  if(floor>(cr.twitch||0)) cr.twitch=floor;
  return true;
}
function careerMigrateTwitch(){
  const cr=CAREER && CAREER.career; if(!cr) return false;
  /* Карьера за креатора приносит СВОЙ канал (Ibai — 20 млн): он настоящий, а не наигранный,
     и потолок для него — его же число. Сторож check-career-creator краснел ровно на этом. */
  const p=CAREER.player||{};
  const real=(p.creator && typeof ccProAmFollowers==='function') ? (ccProAmFollowers(p.nick)||0) : 0;
  const ceil=Math.max(CC_TW_CEIL, real);
  if(!((cr.twitch||0)>ceil)) return false;
  cr.twitch=ceil;
  return true;
}
function ccStreamViewersNow(){
  const cr=CAREER && CAREER.career; if(!cr) return 0;
  return ccTwViewersOf(cr.twitch||0, careerReach());
}
/* YouTube карьеры. Канал ведёт нанятый СММ: без него роликов нет, энергию канал не тратит.
   Замер по 10 последним роликам каналов про (подписчики / медиана просмотров, тыс.): Peterbot 1030/536,
   Malibuca 185/41, vic0 107/23, Pixie 44.7/21, Queasy 104/45, SwizzY 52.9/39, Pollo 188/249, shxrk 173/443,
   Mero 358/188, Kami 142/30, t3eny 46.7/106, Tjino 19.3/16, Veno 103/27, Scroll 13.9/24.
   Ролики только из заметного (победы, подиумы, квалификации, топ-10 больших событий), раз в игровой месяц
   сборник «<ник> Highlights #N». Названия капсом по-английски, с призом и напарником. Просмотры = доля
   подписчиков, медиана 20–250 % (обычно ~половина), разброс внутри канала в 3–10 раз. */
const CC_YT_KINDS={
  win:   {views:1.3,  min:12},
  podium:{views:0.9,  min:13},
  qual:  {views:0.7,  min:15},
  hl:    {views:0.55, min:10}
};
const CC_YT_FRESH=7, CC_YT_DECAY=0.6, CC_YT_DAYS=30, CC_YT_RPM=2.5, CC_YT_YPP={subs:1000, hours:4000}, CC_YT_HL_EVERY=30;
const CC_YT_BIG=['major','summit','globals','gclc','rc','solo','eval'];   // недельный финал Д1 — не большое (у Malibuca его победы 20–40 % подписчиков)
function ccYt(){ const cr=CAREER.career; cr.yt=cr.yt||{subs:0, views:0, hours:0, usd:0, vids:[]}; return cr.yt; }
function ccYtSat(n, k){ return 1/Math.sqrt(1+Math.max(0, n||0)/k); }
function ccYtMonet(y){ return (y.subs||0)>=CC_YT_YPP.subs && (y.hours||0)>=CC_YT_YPP.hours; }
function ccYtKey(e){ return e.day+'|'+(e.kind||'cup')+'|'+(e.stage||''); }
// Что из вечера станет роликом: победа и подиум — всегда, большое событие — топ-10 или пройденный этап.
function ccYtKindFor(e){
  const p=e.place||99, big=CC_YT_BIG.indexOf(e.kind)>=0;
  if(p===1) return 'win';
  if(p<=3) return 'podium';
  if(big && (p<=10 || e.passed===true)) return 'qual';
  return null;
}
// Свежие заметные турниры (неделя) без ролика.
function ccYtFresh(){
  const cr=CAREER.career, y=ccYt(), from=ccAddDays(careerToday(), -CC_YT_FRESH);
  const used=new Set(y.vids.map(v=>v.ev));
  return (cr.log||[]).filter(e=>e && e.day && e.day>from && e.day<=careerToday() && e.place && ccYtKindFor(e) && !used.has(ccYtKey(e)))
    .slice(-4).reverse();
}
// Сколько посмотрят ролик за всю жизнь: доля подписчиков по виду и событию, разброс как у живых каналов.
function ccYtTotal(e, kind, rnd){
  const y=ccYt(), s=y.subs||0, k=CC_YT_KINDS[kind];
  const big=(e && CC_YT_BIG.indexOf(e.kind)>=0) ? 1.5 : 1;
  const spread=Math.exp((rnd()-0.5)*1.6);              // ×0.45 … ×2.2
  /* Известность приводит людей и на НОВЫЙ канал (28.10, его «ютуб медленно растёт»: доля была reach·0.001, у игрока с
     28 тыс. фолловеров в X первый ролик набирал 30–80 просмотров и одного подписчика). Теперь от фолловеров в X — до 20 %
     (потолок 3000 + подписчики канала) и от Twitch 5 %: про с аудиторией начинает с тысяч, а не с десятков. */
  const cr=CAREER.career, fame=Math.min(careerReach()*0.2, 3000+s) + (cr.twitch||0)*0.05;
  return Math.max(5, Math.round((25 + s*0.4*k.views*big + fame*k.views*big)*spread));
}
// Имя события на английском — названия у про всегда английские.
function ccYtEvName(e){
  const keep=LANG; let n='';
  // Подпись дня из календаря собрана на языке сайта и закэширована (Notion 27.10, скрин 15: «HOW I QUALIFIED IN ПЕРФОМАНС»):
  // не на английском берётся общее имя события.
  try{ LANG='en'; n=String(ccLogName(e, keep!=='en')).replace(/<[^>]*>/g,''); }catch(x){ n=''; } finally{ LANG=keep; }
  return n.toUpperCase();
}
// Имя у роликов, вышедших до этой правки: подпись пересобирается из события, если в ней не латиница.
function ccYtFixName(v){
  if(!v || v.kind==='hl' || v._en || !/[^\x00-\x7F·🏆🥈🥉👑]/.test((v.title||'')+(v.evShort||''))) return;
  const e={kind:v.ekind, day:v.on, div:v.div, place:v.place, prize:v.prize, mate:v.mate, passed:/QUALIFIED/.test(v.title||'') ? true : undefined};
  v.title=ccYtMakeTitle(e, v.kind, ''); v.evShort=ccYtShort(ccYtEvName(e)); v._en=1;
}
function ccYtTitle(v){
  if(v.title) return v.title;
  return v.name || '';
}
function ccYtMakeTitle(e, kind, nick){
  const ord=p=>p+(p%100>=11 && p%100<=13 ? 'TH' : ({1:'ST', 2:'ND', 3:'RD'}[p%10]||'TH'));
  const prize=e.prize>0 ? ' ($'+ccNum(Math.round(e.prize))+')' : '';
  const mate=e.mate ? ' w/ '+e.mate : '';
  const n=ccYtEvName(e);
  if(kind==='win') return '1ST PLACE '+n+prize+' 🏆'+mate;
  if(kind==='podium') return ord(e.place)+' PLACE '+n+prize+(e.place===2 ? ' 🥈' : ' 🥉')+mate;
  return e.passed===true ? 'HOW I QUALIFIED IN '+n+' 👑' : ord(e.place)+' PLACE '+n+prize+' 🏆'+mate;
}
let CH_YT_OPEN=null;
/* ПРЕВЬЮ КАК У ПРО (28.10, его «превью все одинаковые, мб сделать как у про игроков, смотря в каком скине играет»): у
   Peterbot, Malibuca, Pixie на превью свой скин крупно, огромная надпись места и приз. Здесь так же: размытый фон события,
   скин, надетый в шкафчике В ДЕНЬ выхода ролика (ccFnWorn('o'), картинка fortnite-api featured), место капсом и приз;
   цвет по результату (золото, серебро, бронза, квалификация, сборник). Нет скина — без фигуры. */
function ccYtSkin(){ try{ const w=ccFnWorn('o'); return w ? w.id : ''; }catch(e){ return ''; } }
// Нет featured (полного роста) — квадратная иконка; нет и её — без фигуры.
function ccYtSkinErr(img){ if(img.dataset.alt && img.src!==img.dataset.alt){ img.src=img.dataset.alt; img.dataset.alt=''; } else img.remove(); }
/* ПРЕВЬЮ КАК У НАСТОЯЩИХ КАНАЛОВ (28.10, его «можно превью прям как у игроков в реальной жизни»; разобраны превью
   Peterbot, Malibuca, vic0, Pixie, shxrk, Pollo, SwizzY, Tjino): сверху капсом турнир («DIV1 FINALS», «EVAL FINALS»),
   слева белая плашка «#1 НИК & НАПАРНИК» с очками в жёлтом шестиугольнике, справа крупно фигура (у них лицо, здесь
   скин из шкафчика), снизу огромный приз жёлтым с обводкой («$10K», «$160.000»), фон — яркий градиент с осколками. */
function ccYtShort(n){
  const w=String(n||'').replace(/\bFNCS\b|\b20\d\d\b|[·:|]/g, ' ').replace(/\s+/g, ' ').trim().split(' ');
  let out='';
  for(const x of w){ if((out+' '+x).trim().length>15) break; out=(out+' '+x).trim(); }
  return out || w[0] || '';
}
function ccYtCashShort(n){
  n=Math.round(n||0); if(n<1000) return '$'+n;
  const k=n/1000; return '$'+(k>=100 ? Math.round(k) : (Math.round(k*10)/10)).toString().replace(/\.0$/, '')+'K';
}
/* ДВА ШАБЛОНА НАСТОЯЩИХ ПРЕВЬЮ (28.10, его «посмотри как у них устроено»; разобраны 24 превью Peterbot, Malibuca, vic0,
   Pixie, shxrk, Pollo, SwizzY, Tjino):
   1. «таблица» (Tjino EVAL FINALS, Pollo SOLO FNCS, SwizzY EWC FINALS): слева сверху огромный турнир, белая строка
      «#1» золотом + ники в две строки + очки в золотом шестиугольнике, под ней полупрозрачные #2 и #3 соперников, ниже
      наклейка «EARNED $800» (зелёный приз) или «QUALED GRANDS»; справа крупно фигура с белой обводкой, у победы корона;
   2. «плашка» (Malibuca DIVISION FINALS, Pollo & Peterbot #2): огромный турнир сверху уходит за фигуру, фигура в центре,
      снизу белая полоса «#1 НИК & НАПАРНИК» и гигантский золотой «$10K» (или очки «504PTS»).
   Фон — размытый кадр, голубой свет, стеклянные осколки. Шаблон — от ролика (хеш), соперники в таблице — настоящие
   игроки сцены, записываются в ролик один раз (v.rows). */
/* Известные про региона карьеры (30.10, его «никнеймы чет не популярные»): вес — log10 подписчиков Twitch+YouTube+X
   (CC_PRO_SOCIAL) плюс рейтинг/20. Состав меняется по дням, поэтому кэш на день и регион. */
let CC_POP_CACHE=null;
function ccPopularCards(n){
  const key=careerToday()+'|'+ccCareerRegion();
  if(!CC_POP_CACHE || CC_POP_CACHE.key!==key){
    let list=[];
    try{
      list=(careerRosterNowEU()||[]).filter(c=>c && c.handle)
        .map(c=>{ const s=ccProSocial(c.handle); return {c, w:Math.log10(1+(s[0]||0)+(s[1]||0)+(s[2]||0))+(c._ovr||c.rating||0)/20}; })
        .sort((a,b)=>b.w-a.w).slice(0, 80).map(x=>x.c);
    }catch(e){ list=[]; }
    CC_POP_CACHE={key, list};
  }
  return CC_POP_CACHE.list.slice(0, n||80);
}
function ccPopularHandles(){
  const me=hKey(String((CAREER && CAREER.player && CAREER.player.nick)||''));
  return ccPopularCards(60).map(c=>c.handle).filter(h=>hKey(h)!==me);
}
function ccYtRows(v){
  if(v.rowsV===2 && v.rows && v.rows.some(r=>r[2]>0) && v.rows.every((r,i)=>!i || r[2]<=v.rows[i-1][2]) && (v.pts!=null || v.kind==='hl')) return v.rows;   // ролики до 28.10 с «0» очков и до 30.10 со случайными никами — пересобрать
  const rnd=careerRng(ccHashStr('ytrows|'+(v.ev||'')));
  /* 30.10, его «никнеймы чет не популярные»: в таблице превью — известные про региона (подписчики Twitch+YouTube+X из
     CC_PRO_SOCIAL и рейтинг), а не случайные из всего состава; напарник — свой настоящий дуо (card.partner), как
     «Clix & Rapid» на превью Peterbot. */
  const skip=new Set([hKey(String((CAREER.player||{}).nick||'')), hKey(String(v.mate||''))]);
  const stars=ccPopularCards(30).filter(c=>!skip.has(hKey(c.handle)));
  const used=new Set();
  const pick=()=>{
    const free=stars.filter(c=>!used.has(hKey(c.handle)));
    if(!free.length) return 'player';
    const c=free[Math.floor(rnd()*free.length)]; used.add(hKey(c.handle));
    if(!v.mate) return c.handle;
    const ph=c.partner && (typeof c.partner==='string' ? c.partner : c.partner.handle);
    if(ph && !used.has(hKey(ph)) && !skip.has(hKey(ph))){ used.add(hKey(ph)); return c.handle+' & '+ph; }
    const o=free.find(x=>x!==c && !used.has(hKey(x.handle)));
    if(o){ used.add(hKey(o.handle)); return c.handle+' & '+o.handle; }
    return c.handle;
  };
  const p=v.place||1, pts=v.pts!=null ? v.pts : 200+Math.round(rnd()*200);
  // Очков в логе нет — у самого те же оценочные, что легли в основу соседей: иначе соседи с очками, а он без.
  if(v.pts==null && v.kind!=='hl') v.pts=pts;
  const rows=[];
  let cur=pts;   // вниз по таблице очки только убывают
  for(let i=1;i<=4;i++){ const n=pick(); cur=Math.max(0, cur-Math.round(4+rnd()*22)); rows.push([p+i, n, cur]); }   // пять строк, как у про
  v.rows=rows; v.rowsV=2;
  return rows;
}
function ccYtThumbHTML(v){
  ccYtFixName(v);
  if(!(v.pts>0)) v.pts=null;   // 0 очков = не записаны
  ccYtRows(v);
  const p=v.place||0, me=String((CAREER.player||{}).nick||'');
  const mate=v.mate ? String(v.mate) : '';
  const big=v.kind==='hl' ? 'HIGHLIGHTS' : (v.evShort || 'FNCS');
  const art=ccLogArt({day:v.on, kind:v.ekind, div:v.div});
  const sk=v.skin!==undefined ? v.skin : ccYtSkin();   // у старых роликов скина нет, берём нынешний
  const cash=v.prize>0 ? ccYtCashShort(v.prize) : '';
  const fig=sk ? '<img class="ytt-fig" src="'+esc(ccFnFull(sk))+'" data-alt="'+esc(ccFnImg(sk))+'" alt="" loading="lazy" onerror="ccYtSkinErr(this)">' : '';
  const bg=(art ? '<img class="ytt-bg" src="'+esc(art)+'" alt="" loading="lazy" onerror="this.remove()">' : '')+'<i class="ytt-glow"></i><i class="ytt-shard ytt-s1"></i><i class="ytt-shard ytt-s2"></i>';
  const dur='<span class="yt-dur">'+v.min+':'+String(10+(v.total%50)).slice(-2)+'</span>';
  const names='<span class="ytr-who">'+esc(me)+(mate ? '<small>& '+esc(mate)+'</small>' : '')+'</span>';
  // Сборник: размытый кадр игры и строка «ELIMINATED <ник>».
  if(v.kind==='hl') return '<div class="yt-thumb ytt ytt-hl">'+bg+fig+
    '<span class="ytt-elim">ELIMINATED <b>'+esc(String((ccYtRows(v)[0]||[])[1]||'').split(' & ')[0])+'</b></span><span class="ytt-title ytt-title-c">'+esc(me.toUpperCase())+' HIGHLIGHTS #'+esc(String(v.n||''))+'</span>'+dur+'</div>';
  /* Два вида, как на каналах про. Победа с призом: турнир плашкой, игрок по центру, внизу «#1 НИК & НАПАРНИК» и приз.
     Остальное: название слева сверху, таблица слева (#1 белой строкой с очками в шестиугольнике), игрок справа по плечи. */
  if(v.kind==='win' && cash){
    return '<div class="yt-thumb ytt ytr ytr-gold ytr-w">'+bg+'<div class="ytr-fig ytr-figw">'+fig+'</div><i class="ytr-shadew"></i>'+
      '<span class="ytr-tag">'+esc(big)+'</span>'+
      '<div class="ytr-wbot"><span class="ytr-wn"><b>#1</b> '+esc(me.toUpperCase())+(mate ? ' & '+esc(mate.toUpperCase()) : '')+'</span>'+
      '<b class="ytr-cash">'+esc(cash)+'</b></div>'+dur+'</div>';
  }
  const rows=ccYtRows(v).slice(0, 4).map(r=>'<div class="ytr-row"><b>#'+r[0]+'</b><span>'+esc(r[1])+'</span><em>'+r[2]+'</em></div>').join('');
  const tone=v.kind==='win' ? 'ytr-gold' : v.kind==='podium' ? 'ytr-teal' : 'ytr-blue';
  const tsz=big.length>14 ? ' ytr-t-s' : big.length>9 ? ' ytr-t-m' : '';
  return '<div class="yt-thumb ytt ytr '+tone+'">'+bg+'<div class="ytr-fig">'+fig+'</div><i class="ytr-shade"></i>'+
    '<span class="ytr-title'+tsz+'">'+esc(big)+'</span>'+
    '<div class="ytr-board"><div class="ytr-row ytr-me"><b>#'+(p||1)+'</b>'+names+
      (v.pts!=null ? '<i class="ytr-hex">'+esc(String(v.pts))+'</i>' : '')+'</div>'+rows+'</div>'+dur+'</div>';
}
function ccYtSmmMul(){ const m=ccSmm(); if(!m) return 0; const card=ccSmmOf(m.id)||m; return 0.8+0.6*(ccSmmPull((card && card.x)||0)||0); }
function ccYtComments(y, total, mood, rnd){
  const who=(careerStreamChat(12)||[]).map(x=>x && x.who).filter(Boolean);
  const bank=L()['ytC_'+mood]||[];
  const nC=Math.max(1, Math.min(6, Math.round(1+Math.log10(total+1)*1.3)));
  const out=[];
  for(let n=0;n<nC && who.length && bank.length;n++)
    out.push({who:who.splice(Math.floor(rnd()*who.length), 1)[0], text:bank[Math.floor(rnd()*bank.length)], likes:Math.round(rnd()*total*0.004)});
  return out;
}
function ccYtPush(y, v){ y.vids.unshift(v); if(y.vids.length>60) y.vids.length=60; }
function ccYtPublish(e, mul){
  const y=ccYt(), id=ccYtKey(e), kind=ccYtKindFor(e); if(!kind) return;
  const k=CC_YT_KINDS[kind];
  if(y.vids.some(v=>v.ev===id)) return;
  const nick=CAREER.player.nick||'';
  const rnd=careerRng(ccHashStr('yt|'+id+'|'+kind+'|'+nick));
  const total=Math.max(5, Math.round(ccYtTotal(e, kind, rnd)*mul));
  ccYtPush(y, {ev:id, day:careerToday(), on:e.day, kind:kind, ekind:e.kind||'cup', div:e.div, place:e.place, of:e.of,
               title:ccYtMakeTitle(e, kind, nick), skin:ccYtSkin(), prize:e.prize||0, pts:e.pts>0 ? e.pts : null, mate:e.mate||'', evShort:ccYtShort(ccYtEvName(e)), total:total, v:0, likes:0, min:k.min+Math.floor(rnd()*8),
               comments:ccYtComments(y, total, e.place===1 ? 'win' : 'good', rnd), by:(ccSmm()||{}).name||''});
}
// Сборник месяца: «<ник> Highlights #N», если месяц был игровым и сборника не было.
function ccYtHighlights(mul){
  const cr=CAREER.career, y=ccYt(), today=careerToday(), from=ccAddDays(today, -CC_YT_HL_EVERY);
  if(y.vids.some(v=>v.kind==='hl' && v.day>from)) return;
  const played=(cr.log||[]).filter(e=>e && e.day>from && e.day<today);
  if(played.length<6) return;   // игровой месяц: шесть турниров и больше
  y.hlN=(y.hlN||0)+1;
  const nick=CAREER.player.nick||'';
  const rnd=careerRng(ccHashStr('ythl|'+today+'|'+nick));
  const total=Math.max(5, Math.round(ccYtTotal(null, 'hl', rnd)*mul));
  ccYtPush(y, {ev:'hl|'+today, day:today, on:played[played.length-1].day, kind:'hl', ekind:played[played.length-1].kind||'cup',
               div:played[played.length-1].div, title:nick+' Highlights #'+y.hlN, n:y.hlN, skin:ccYtSkin(), total:total, v:0, likes:0,
               min:CC_YT_KINDS.hl.min+Math.floor(rnd()*6), comments:ccYtComments(y, total, 'good', rnd), by:(ccSmm()||{}).name||''});
}
// СММ выпускает ролики из заметных турниров, сыгранных до сегодняшнего дня (монтаж занимает ночь), и сборник месяца.
function ccYtAuto(){
  const mul=ccYtSmmMul(); if(!mul) return;
  ccYtFresh().filter(e=>e.day<careerToday()).reverse().forEach(e=>ccYtPublish(e, mul));
  ccYtHighlights(mul);
}
// День карьеры: ролики добирают просмотры, канал подписчиков, часы и деньги.
function ccYtTick(){
  const cr=CAREER && CAREER.career; if(!cr) return;
  if(ccSmm()) ccYtAuto();
  if(!cr.yt) return;
  const y=cr.yt, today=careerToday();
  let gotV=0, gotH=0;
  y.vids.forEach(v=>{
    const age=Math.max(0, Math.round((new Date(today+'T00:00:00Z')-new Date(v.day+'T00:00:00Z'))/86400000));
    const want=Math.round(v.total*(1-Math.pow(CC_YT_DECAY, Math.min(CC_YT_DAYS, age)+1)));
    const add=Math.max(0, want-(v.v||0));
    if(!add) return;
    v.v=(v.v||0)+add; v.likes=Math.round(v.v*0.045);
    gotV+=add; gotH+=add*(v.min*0.45)/60;   // досматривают меньше половины ролика
  });
  if(!gotV) return;
  const wasMon=ccYtMonet(y);
  y.views=(y.views||0)+gotV; y.hours=(y.hours||0)+gotH;
  // Подписываются 5 % досмотревших у нового канала, у большого меньше (sat).
  y.subs=(y.subs||0)+Math.max(0, Math.round(gotV*0.05*ccYtSat(y.subs, 300000)));
  if(wasMon){
    const usd=gotV/1000*CC_YT_RPM;
    y.usd=Math.round(((y.usd||0)+usd)*100)/100;
    y.owe=(y.owe||0)+usd;
    const whole=Math.floor(y.owe); if(whole>0){ cr.balance=(cr.balance||0)+whole; y.owe-=whole; }
  }
}
function careerYtHTML(){
  const T=L(), y=ccYt(), me=CAREER.player||{};
  const mon=ccYtMonet(y);
  const pct=(a,b)=>Math.min(100, Math.round((a||0)/b*100));
  const bar=(a,b,w)=>'<div class="yt-bar"><i style="width:'+pct(a,b)+'%"></i><span>'+ccNum(Math.min(Math.round(a||0), b))+' / '+ccNum(b)+' '+esc(w)+'</span></div>';
  const head='<div class="yt-head"><span class="yt-logo">▶</span><div class="yt-ch"><b>'+esc(me.nick||'')+'</b><small>'+
    esc(T.ytSubs(ccNum(y.subs||0)))+' · '+esc(T.ytViews(ccNum(y.views||0)))+'</small></div>'+
    '<div class="yt-earn"><em>'+esc(T.ytEarned)+'</em><b>'+ccMoney(Math.round(y.usd||0))+'</b></div></div>'+
    (mon ? '<p class="yt-mon on">'+esc(T.ytMonOn)+'</p>'
         : '<div class="yt-mon"><span>'+esc(T.ytMonNeed)+'</span>'+bar(y.subs, CC_YT_YPP.subs, T.ytSubsW)+bar(y.hours, CC_YT_YPP.hours, T.ytHoursW)+'</div>');
  const sm=ccSmm(), smc=sm ? (ccSmmOf(sm.id)||sm) : null, fresh=ccYtFresh();
  const make='<div class="ch-tile yt-make"><h4>'+esc(T.ytWho)+'</h4>'+(smc
    ? '<p class="yt-by">'+esc(T.ytBy(smc.name, smc.at||''))+'</p>'+(fresh.length ? '<p class="yt-sub">'+esc(T.ytQueue)+'</p>'+fresh.map(e=>'<div class="yt-ev">'+ccLogArtHTML(e)+
        '<div class="yt-ev-t"><b>'+ccLogName(e)+'</b><small>#'+e.place+(e.of ? ' / '+e.of : '')+' · '+esc(T['ytK_'+ccYtKindFor(e)])+'</small></div></div>').join('') : '')
    : '<p class="yt-sub">'+esc(T.ytNoSmm)+'</p><button class="ch-play" onclick="ccSmmPickOpen()">'+esc(T.ytHireSmm)+'</button>')+'</div>';
  const vids=y.vids.length ? '<div class="yt-grid">'+y.vids.map((v,i)=>{
      const age=Math.max(0, Math.round((new Date(careerToday()+'T00:00:00Z')-new Date(v.day+'T00:00:00Z'))/86400000));
      const open=CH_YT_OPEN===i;
      return '<div class="yt-vid'+(open ? ' open' : '')+'" onclick="CH_YT_OPEN='+(open ? 'null' : i)+';careerRenderHub(\'youtube\')">'+
        ccYtThumbHTML(v)+
        '<b class="yt-title">'+esc(ccYtTitle(v))+'</b><small>'+esc(T.ytViews(ccNum(v.v||0)))+' · '+esc(T.ytAgo(age))+' · 👍 '+ccNum(v.likes||0)+'</small>'+
        (open ? '<div class="yt-com">'+(v.comments.length ? v.comments.map(c=>'<p><b>@'+esc(c.who)+'</b> '+esc(c.text)+(c.likes ? ' <small>👍 '+ccNum(c.likes)+'</small>' : '')+'</p>').join('') : '<p class="ch-empty">'+esc(T.ytNoCom)+'</p>')+'</div>' : '')+
        '</div>';
    }).join('')+'</div>' : '<p class="ch-empty">'+esc(T.ytNoVids)+'</p>';
  return '<div class="yt-wrap">'+head+make+'<h4 class="yt-h">'+esc(T.ytVids)+'</h4>'+vids+'</div>';
}
/* Партнёрская программа: галочку надо заработать, а не получить с первого дня.
   Пороги Twitch за 30 дней, действующие в 2026 (компаньона упростили, блог «Monetization for All», 13 мая 2026):
     компаньон  25 фолловеров, 4 часа эфира, 4 разных дня, средний онлайн 3
     партнёр    25 часов, 12 разных дней, средний онлайн 75
   В справке у партнёра окно два месяца, но «Путь к партнёрству» в дашборде считает 30 дней, берём его. Галочка только у партнёра. */
const CC_TW_WINDOW=30;
const CC_TW_AFF ={fol:25, days:4,  hours:4,  avg:3};
const CC_TW_PART={days:12, hours:25, avg:75};
function ccStreamLogTrim(cr){
  const log=cr.streamLog||[];
  const from=ccAddDays(cr.day||careerToday(), -CC_TW_WINDOW);
  cr.streamLog=log.filter(r=>r && r.d && r.d>from);
  return cr.streamLog;
}
// Что накоплено за окно: разных дней, часов и средний онлайн по эфирам.
function ccTwMonth(){
  const cr=CAREER && CAREER.career; if(!cr) return {days:0, hours:0, avg:0, mins:0};
  const from=ccAddDays(careerToday(), -CC_TW_WINDOW);
  const rows=(cr.streamLog||[]).filter(r=>r && r.d && r.d>from);
  const days={}; let hours=0, sum=0;
  rows.forEach(r=>{ days[r.d]=1; hours+=(r.h||4); sum+=(r.v||0); });
  return {days:Object.keys(days).length, hours:hours, mins:Math.round(hours*60),
          avg:rows.length ? Math.round(sum/rows.length) : 0, n:rows.length};
}
// none → aff → part. Получив, уже не теряешь: у Twitch статус тоже не снимают
// за спокойный месяц.
function ccTwStatus(){
  const cr=CAREER && CAREER.career; if(!cr) return 'none';
  return cr.twTier || 'none';
}
function ccTwEarned(){
  return ccTwGoals('part').every(g=>g.a>=g.b) ? 'part'
       : ccTwGoals('aff').every(g=>g.a>=g.b) ? 'aff' : 'none';
}
/* Цели ступени — та же таблица, по которой рисуются полоски и считается
   выдача статуса. Одна на всех, чтобы полоска не могла показывать одно, а
   программа считать другое. */
function ccTwGoals(tier){
  const T=L(), m=ccTwMonth(), cr=(CAREER && CAREER.career)||{};
  if(tier==='part') return [
    {k:T.ccTwGoalDays,  a:m.days,               b:CC_TW_PART.days},
    {k:T.ccTwGoalHours, a:Math.round(m.hours),  b:CC_TW_PART.hours},
    {k:T.ccTwGoalAvg,   a:m.avg,                b:CC_TW_PART.avg}];
  return [
    {k:T.ccTwGoalFol,   a:cr.twitch||0,         b:CC_TW_AFF.fol},
    {k:T.ccTwGoalDays,  a:m.days,               b:CC_TW_AFF.days},
    {k:T.ccTwGoalHours, a:Math.round(m.hours),  b:CC_TW_AFF.hours},
    {k:T.ccTwGoalAvg,   a:m.avg,                b:CC_TW_AFF.avg}];
}
const CC_TW_RANK={none:0, aff:1, part:2};
function careerTwTick(){
  const cr=CAREER && CAREER.career; if(!cr) return null;
  const got=ccTwEarned(), had=cr.twTier||'none';
  if(CC_TW_RANK[got]<=CC_TW_RANK[had]) return null;
  cr.twTier=got;
  careerNews(got==='part'?'big':'good',
             got==='part'?'ccNewsTwPartner':'ccNewsTwAffiliate', []);
  return got;
}
/* Полоска под стримом — правка: «пусть полоска будет под
   стримом, сколько там нужно фоловеров и онлайн для компаньенки и сколько до
   партнерки». Это дашбордный «Путь к компаньону»: на каждое требование своя
   шкала с числами, выполненное отмечено галкой. Достигнув компаньона, панель
   сама переключается на партнёрку; у партнёра её нет — идти больше некуда. */
function careerTwBarHTML(){
  const T=L(), tier=ccTwStatus(); if(tier==='part') return '';
  const next=tier==='aff' ? 'part' : 'aff';
  const rows=ccTwGoals(next).map(g=>{
    const done=g.a>=g.b, pc=Math.min(100, Math.round(g.a/g.b*100));
    return `<div class="tw-goal${done?' on':''}">
      <span class="tw-k">${esc(g.k)}</span>
      <span class="tw-bar"><i style="width:${pc}%"></i></span>
      <span class="tw-n">${done?'✓ ':''}${ccNum(g.a)}<em>/${ccNum(g.b)}</em></span>
    </div>`;
  }).join('');
  return `<div class="tv-path">
    <div class="tw-h">${esc(next==='part'?T.ccTwToPart:T.ccTwToAff)}</div>
    ${rows}</div>`;
}
/* ПОДЛОЖКА ПЛЕЕРА: нарисованный бой на билдах (см. .tv-fb в стилях).
   Никаких картинок и файлов — сцена собрана прямоугольниками, поэтому весит ноль и
   работает в отрезанном app.js так же, как в целой странице. Поверх неё встаёт живой
   ролик, а если он не приехал — видно её. */
/* В плеере ролик YouTube (youtube-nocookie, без звука и контролов): рекорд Peterbot'а с финала Cash Cup и фрибилды Intangible, оба публичные, `playableInEmbed: true`, 865 и 588 с.
   Режется адресом (start/end) на куски по CC_TV_CUT секунд, ничего не качаем. Список кусков ручной, у фрибилдов первый с 5-й секунды. Кусок выбирается по дню, по концу ccTvClipLoop отматывает к его началу. Автор подписан в углу.
   Рамка прозрачна, пока плеер не ответит playerState 1 через postMessage (enablejsapi=1): onload срабатывает и на «видео недоступно», а таймер снял бы медленный ролик.
   Не пошло (YouTube режут в России), в кадре остаётся нарисованный бой (.tv-fb). */
// Длина куска. Короткий отрывок, а не «включили ролик и ушли».
const CC_TV_CUT=55;
/* Куски: секунды НАЧАЛА каждого. Расставлены по всему ролику с ровным шагом, последний
   заканчивается до конца видео (865 и 588 секунд) — конец там титры и прощание. */
const CC_TV_CLIPS=[
  {id:'Ig75ACe_zzk', who:'Peterbot', len:865,
   cuts:[45, 150, 255, 360, 465, 570, 675, 770]},
  {id:'fqTCQIgCq34', who:'Intangible', len:588,
   cuts:[5, 95, 185, 275, 365, 455, 520]}
];
/* ЧУЖОЙ ФИНАЛ В КАДРЕ — ЕГО РОЛИК (9 сентября): «с 1 минуты начинай только видео и до 26:20,
   это смотреть за турниром, типа стрим из этого видео моменты». Гранд-финал FNCS с канала
   Malibuca (xGTo4-XSFkw, «1ST FNCS GRAND-FINALS ($170.000) w/ Merstach», oembed 9.09). Эфир
   идёт CC_TV_WATCH_SECS секунд, и по ходу финала плеер перескакивает по МОМЕНТАМ ролика:
   отрезок 1:00–26:20 разбит на moments кусков по CC_TV_CUT, кусок меняется каждые games/moments
   игр (ccWatchStep → ccTvClipJump), какой сдвиг внутри куска — решает день. */
const CC_TV_WATCH_CLIP={id:'xGTo4-XSFkw', who:'Malibuca', from:60, to:1580, moments:6};
const CC_TV_WATCH_SECS=60;
function ccTvWatchPiece(k){
  const c=CC_TV_WATCH_CLIP, cr=CAREER && CAREER.career;
  const rnd=careerRng(ccHashStr('watchclip|'+((cr&&cr.day)||'')));
  const span=Math.max(CC_TV_CUT, (c.to-c.from)/c.moments);
  const i=Math.max(0, Math.min(c.moments-1, k|0));
  const at=Math.round(c.from+i*span+rnd()*Math.max(0, span-CC_TV_CUT));
  return {c:{id:c.id, who:c.who, len:c.to}, at:at, to:Math.min(c.to, at+CC_TV_CUT), k:i};
}
function ccTvClipJump(k){
  const el=document.querySelector('.tv-clip'); if(!el) return;
  if(String(el.dataset.k||'0')===String(k)) return;
  const p=ccTvWatchPiece(k);
  el.dataset.k=String(p.k); el.dataset.at=String(p.at); el.dataset.to=String(p.to); el.dataset.playing=''; el.dataset.try='0';
  el.src=ccTvClipSrc(p);   // адрес начинается со start и кончается на end — новый момент
}
// Какой кусок идёт сегодня. Тот же день — тот же кусок.
function ccTvClipOf(){
  // Чужой финал — момент его ролика, по счёту игр (см. CC_TV_WATCH_CLIP).
  if(typeof CC_TV_PLAIN!=='undefined' && CC_TV_PLAIN && CC_TV_PLAIN.watch){
    const w=CC_TV_PLAIN.watch; return ccTvWatchPiece(Math.floor((w.n||0)/Math.max(1, w.games/CC_TV_WATCH_CLIP.moments)));
  }
  const cr=CAREER && CAREER.career;
  const rnd=careerRng(ccHashStr('clip|'+((cr&&cr.day)||'')));
  const c=CC_TV_CLIPS[Math.floor(rnd()*CC_TV_CLIPS.length)];
  const at=c.cuts[Math.floor(rnd()*c.cuts.length)];
  return {c:c, at:at, to:Math.min(c.len, at+CC_TV_CUT)};
}
/* Адрес встроенного плеера: молча, без органов управления, ровно от start до end.
   loop сюда не ставится — он гоняет ВСЁ видео, а нам нужен один кусок; назад его
   отматывает ccTvClipLoop. enablejsapi — чтобы плеер вообще мог отвечать. */
function ccTvClipSrc(p){
  /* origin — для ответов плеера; со страницы, открытой файлом, его нет (протокол file:
     даёт origin «null»), и тогда параметр не ставится вовсе. */
  const org=(typeof location!=='undefined' && /^https?:$/.test(location.protocol))
    ? '&origin='+encodeURIComponent(location.origin) : '';
  return 'https://www.youtube-nocookie.com/embed/'+encodeURIComponent(p.c.id)+
    '?autoplay=1&mute=1&controls=0&start='+p.at+'&end='+p.to+
    '&modestbranding=1&rel=0&playsinline=1&disablekb=1&iv_load_policy=3'+
    '&enablejsapi=1'+org;
}
// Рамка загрузилась — спрашиваем плеер, что с ним. Молчит — значит и показывать нечего.
function ccTvClipHello(el){
  try{ el.contentWindow.postMessage(JSON.stringify({event:'listening', id:1, channel:'widget'}), '*'); }
  catch(e){}
}
// Сколько ждём плеер, прежде чем признать, что ролика не будет, и показать рисунок.
const CC_TV_FB_MS=4000;
// Пошла картинка. Только теперь ролик видно — до этого кадр чёрный.
function ccTvClipPlaying(){
  document.querySelectorAll('.tv-clip-slot').forEach(function(s){ s.dataset.on='1'; });
  document.querySelectorAll('.tv-fb').forEach(function(f){ f.dataset.on=''; });
  document.querySelectorAll('.tv-clip').forEach(function(e){ e.dataset.playing='1'; e.dataset.try=0; });
}
/* Кусок доиграл до end (или плеер почему-то встал) — гоним его заново. Без этого в
   кадре висит стоп-кадр, а поверх него YouTube выкладывает свою шапку и «More videos»
   — ровно то, что он снял 8 сентября.

   Сначала по-хорошему: команда плееру отмотать к началу куска и играть. Но команды
   ходят не везде (плеер может их не принять — тогда ответа «играю» так и не будет), и
   поэтому через CC_TV_CLIP_BACK стоит проверка: не заиграл — рамка перезагружается
   своим же адресом, а он начинается со start. Это грубее, зато работает всегда.
   Перезагрузок не больше CC_TV_CLIP_TRY, чтобы не молотить в пустоту. */
const CC_TV_CLIP_BACK=1800;
const CC_TV_CLIP_TRY=4;
function ccTvClipLoop(){
  const el=document.querySelector('.tv-clip'); if(!el) return;
  const at=+(el.dataset.at||0);
  el.dataset.playing='';
  /* И ПРЯЧЕМ КАДР НА ВРЕМЯ ПЕРЕЗАПУСКА. Отзыв: «ютуб там иногда
     высвечивается». Кусок доиграл — плеер выкладывает поверх стоп-кадра свою шапку,
     а перезагрузка рамки начинается с его заставки с логотипом. Пока идёт перезапуск,
     экран чёрный, как между сценами на настоящем стриме; вернётся он сам, как только
     плеер снова скажет «играю». */
  document.querySelectorAll('.tv-clip-slot').forEach(function(s){ s.dataset.on=''; });
  const say=(func, args)=>{ try{
    el.contentWindow.postMessage(JSON.stringify({event:'command', func:func, args:args||[]}), '*');
  }catch(e){} };
  say('seekTo', [at, true]); say('playVideo');
  if(el.dataset.wait) return;
  el.dataset.wait='1';
  setTimeout(function(){
    el.dataset.wait='';
    if(!el.isConnected || el.dataset.playing) return;   // команда сработала — всё
    const n=+(el.dataset.try||0);
    if(n>=CC_TV_CLIP_TRY) return;
    el.dataset.try=n+1;
    el.src=el.src;                                       // адрес начинается со start
  }, CC_TV_CLIP_BACK);
}
/* Слушаем ответы плеера. Чужие сообщения отсекаются по origin — его ставит браузер,
   подделать со страницы нельзя, — и из всего ответа берётся одно число состояния. */
let CC_TV_CLIP_L=0;
function ccTvClipListen(){
  if(CC_TV_CLIP_L || typeof window==='undefined') return;
  CC_TV_CLIP_L=1;
  window.addEventListener('message', function(e){
    if(String(e.origin||'').indexOf('youtube')<0) return;
    let d=null; try{ d=JSON.parse(e.data); }catch(err){ return; }
    const st=d && d.info && d.info.playerState;
    /* 1 — «играю», 0 — «кусок кончился», 2 — «стою». Стоять плееру не с чего: кликов
       он не принимает, — значит это он сам встал, и его надо гнать дальше. */
    if(st===1) ccTvClipPlaying();
    else if(st===0 || st===2) ccTvClipLoop();
  });
}
// Вешает плеер поверх сцены. Прозрачным: увидят его, только если он заиграет.
function ccTvClipMount(){
  if(typeof document==='undefined') return;
  const slot=document.querySelector('.tv-player.live .tv-clip-slot');
  if(!slot || slot.dataset.done) return;
  slot.dataset.done='1';
  ccTvClipListen();
  const p=ccTvClipOf(), T=L();
  slot.innerHTML='<iframe class="tv-clip" src="'+esc(ccTvClipSrc(p))+'" title="'+esc(p.c.who)+'"'+
    ' data-at="'+p.at+'" data-to="'+p.to+'" data-k="'+(p.k!=null ? p.k : 0)+'"'+
    ' allow="autoplay; encrypted-media" referrerpolicy="strict-origin-when-cross-origin"'+
    ' frameborder="0" onload="ccTvClipHello(this)"></iframe>';
  /* Не заиграл за CC_TV_FB_MS — показываем рисунок: значит ролика не будет вовсе.
     Заиграл — рисунок так и не появится (ccTvClipPlaying его гасит). */
  setTimeout(function(){
    const el=document.querySelector('.tv-clip');
    if(!el || !el.isConnected || el.dataset.playing) return;
    document.querySelectorAll('.tv-fb').forEach(function(f){ f.dataset.on='1'; });
  }, CC_TV_FB_MS);
}
/* Место под ролик — поверх сцены. Рисуется вместе с кадром, а плеер вставляется
   следующим тиком: к этой секунде разметка уже в документе. */
function ccStreamClipHTML(){
  setTimeout(ccTvClipMount, 0);
  return '<div class="tv-clip-slot"></div>';
}
// Сначала подложка, потом ролик: ролик кладётся сверху, и, если его нет, кадр не пуст.
function ccStreamScreenHTML(){
  return '<div class="tv-fb" aria-hidden="true">'+
    '<i class="tv-fb-far"></i><i class="tv-fb-storm"></i>'+
    '<i class="tv-fb-w tv-fb-w1"></i><i class="tv-fb-w tv-fb-w2"></i>'+
    '<i class="tv-fb-w tv-fb-w3"></i><i class="tv-fb-w tv-fb-w4"></i>'+
    '<i class="tv-fb-w tv-fb-w5"></i><i class="tv-fb-r"></i>'+
    '<b class="tv-fb-p tv-fb-p1"></b><b class="tv-fb-p tv-fb-p2"></b>'+
    '<u class="tv-fb-f"></u></div>'+ccStreamClipHTML();
}
/* УВЕДОМЛЕНИЯ НА ЭКРАНЕ (отзыв: «и уведомления будут приходить на
   экране»). У стримера алерты всплывают поверх картинки — фолловер, саб, донат. Здесь
   так же: карточка выезжает над плеером и сама уходит.

   Показывается НЕ КАЖДОЕ событие: у канала на тысячу зрителей фолловеры идут пачками, и
   алерт на каждого превратился бы в мигающую стену. Фолловеры показываются по одному на
   CC_TV_AL_EVERY, а сабы, донаты и события эфира — всегда, их и так немного. Больше
   CC_TV_AL_MAX карточек на экране не живёт. */
const CC_TV_AL_EVERY=6, CC_TV_AL_MAX=2;
let CC_TV_AL_N=0;
function ccTvAlert(kind, title, note){
  if(typeof document==='undefined') return;
  const hosts=[document.getElementById('tvAlert'), document.querySelector('.cc-tv .cc-tv-alert')].filter(Boolean);
  if(!hosts.length) return;
  hosts.forEach(host=>{
    while(host.children.length>=CC_TV_AL_MAX) host.removeChild(host.firstChild);
    const el=document.createElement('div');
    el.className='cc-tv-al '+kind;
    el.innerHTML='<b>'+esc(title)+'</b>'+(note ? '<em>'+esc(note)+'</em>' : '');
    host.appendChild(el);
    setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, 3400);
  });
}
function careerStreamsHTML(){
  const cr=CAREER.career, T=L();
  const me=CAREER.player;
  /* «В эфире» — пока эфир ИДЁТ, а не весь день после него. Скриншот из Notion (страница «socials»): после пятнадцати секунд обычного эфира плеер
     вкладки оставался живым — рисованная сцена билд-файта крутилась, ролик
     перевешивался заново — потому что признак читался как «сегодня стримил».
     Отзыв тем же днём: «потом выключается видео и статистику показывает».
     Идущий эфир — это обычный (CC_TV_PLAIN) или турнирный (рамка стоит,
     ccTvLive); после конца плеер гаснет, сводка живёт отдельно (.tv-sum). */
  const onAir=!!CC_TV_PLAIN || (typeof ccTvLive==='function' && ccTvLive());
  const live=(onAir && cr.streamLast && cr.streamLast.day===careerToday()) ? cr.streamLast : null;
  const av=(url, name, ring)=>`<span class="tv-av${ring?' on':''}">${
    url ? `<img src="${url}" alt="" loading="lazy" onerror="this.remove()">`
        : esc(String(name||'?').slice(0,2).toUpperCase())}</span>`;
  const mine=photoURL(me.photo ? {_photo:me.photo} : careerCard());
  const mate=ccStreamMate();
  const closed=careerDayClosed();
  // Кнопка вида: сколько стоит и что даёт — числами, а не словами.
  const btn=k=>{
    const can=!closed && careerEnergy()>=k.energy;
    const extra=(k.mate && mate) ? ' · @'+esc(ccHandle(mate.name)) : '';
    // Выключенная кнопка называет причину, а не повторяет цену. См. ccStreamCupWhy.
    const why=can ? null : (closed ? T.ccStreamDayGone : T.ccStreamNeed(k.energy, careerEnergy()));
    return `<button class="tv-go${can?'':' off'}" ${can?'':'disabled'}
      onclick="careerStreamGo('${k.id}')">
      <b>${esc(T['ccStream_'+k.id])}${extra}</b>
      <em>${esc(why || T.ccStreamCost(k.energy))} · ${esc(T['ccStream_'+k.id+'Note'])}</em></button>`;
  };
  /* Пятая кнопка — турнирный вечер, и стоит она только в тот день, когда есть
     что стримить: в остальные дни стримить турнир нечего, и пустая кнопка с
     «сегодня нет турнира» была бы шумом на плеере. См. careerPlayLive. */
  const evNext=careerNext();
  const evToday=!ccMpOn() && !cr.seasonOver && evNext &&
                evNext.day===careerToday() && careerCanPlay(evNext);
  const cupWhy=evToday ? ccStreamCupWhy() : null;
  // Чужой финал — эфир-просмотр, когда финал есть, а тебя в нём нет. См. CC_STREAM_WATCH.
  const wEv=ccStreamWatchEvent();
  const wCan=!!wEv && !closed && careerEnergy()>=CC_STREAM_WATCH.energy;
  const watchBtn=wEv ? `<button class="tv-go tv-go-watch${wCan?'':' off'}"${wCan?'':' disabled'}
      onclick="careerStreamGo('watch')">
      <b>${esc(T.ccStreamWatchOf(wEv.label||wEv.title||''))}</b>
      <em>${esc(wCan ? T.ccStreamCost(CC_STREAM_WATCH.energy) : (closed ? T.ccStreamDayGone : T.ccStreamNeed(CC_STREAM_WATCH.energy, careerEnergy())))} · ${esc(T.ccStream_watchNote)}</em></button>` : '';
  const cupBtn=evToday ? `<button class="tv-go tv-go-cup${cupWhy?' off':''}"${cupWhy?' disabled':''}
      onclick="careerPlayLive()">
      <b>${esc(T.ccStreamCupTitle)} · ${esc(evNext.label||evNext.title||'')}</b>
      <em>${esc(cupWhy || T.ccStreamCupHint(CC_STREAM_CUP.energy, CC_STREAM_POW))}</em></button>` : '';
  /* СТРАНИЦА КАНАЛА, а не витрина. Скриншот из Notion — это
     twitch.tv/<канал> во время эфира, и оттуда взято ровно то, что делает
     страницу собой:
       слева  — «Отслеживаемые каналы»: аватар, ник, категория, красная точка с
                числом зрителей или «Не в сети», ниже «Показать ещё»;
       центр  — плеер во всю ширину, поверх него HUD (зрители, подписки за
                сегодня, время в эфире), под ним строка канала: аватар с
                плашкой LIVE, ник с галочкой, заголовок эфира, категория и
                язык, справа кнопки — сердце, колокол, Bits, Gift a Sub и
                фиолетовая «Подписаться»;
       справа — «Чат трансляции»: закреплённое сообщение, строки со временем и
                цветными никами, поле «Отправить сообщение» внизу.
     Кнопки видов эфира стоят на самом плеере, когда ты не в эфире: это и есть
     «включить трансляцию», а не отдельная панель сбоку. */
  const viewers=live ? (live.a && live.a[0]) || ccStreamViewersNow() : ccStreamViewersNow();
  const subsToday=live ? (live.a && live.a[2]) || 0 : 0;
  const tier=ccTwStatus();
  const side=careerLiveNow(10).sort((a,b)=>(ccTwFollowing(b.name)?1:0)-(ccTwFollowing(a.name)?1:0));
  const offline=side.slice(6, 9);   // трое «не в сети» — как на скриншоте
  const sideRow=(s, off)=>`
    <div class="tv-srow">
      ${av(s.card ? photoURL(s.card) : (s.ava||null), s.name, !off)}
      <div class="tv-sin"><b>${esc(s.name)}</b><em>${esc(T[s.cat])}</em></div>
      ${off ? `<span class="tv-off">${T.ccStreamOffline}</span>`
            : `<span class="tv-vv"><i></i>${ccNum(s.v)}</span>`}
      ${ccTwFollowBtnHTML(s.name, !!s.creator, 'tv-fb')}
    </div>`;
  const chat=careerStreamChat(live ? 14 : 8).map(m=>`
    <div class="tv-msg"><i>${esc(m.at)}</i><b style="color:${m.c}">${esc(m.who)}</b>: <span>${esc(m.text)}</span></div>`).join('');
  const art=(typeof CAREER_EV_ART!=='undefined' && CAREER_EV_ART.cup) || '';
  return `<div class="tv-wrap">
    <aside class="tv-side">
      <div class="tv-side-h">${T.ccStreamFollowed}</div>
      ${side.slice(0,6).map(s=>sideRow(s, false)).join('')}
      ${offline.map(s=>sideRow(s, true)).join('')}
      <div class="tv-more">${T.ccStreamMore}</div>
    </aside>
    <main class="tv-main">
      <div class="tv-player${live?' live':''}" style="${live ? '' : (art?`background-image:url(${art})`:'')}">
        ${live ? ccStreamScreenHTML() : ''}
        <div class="tv-alert" id="tvAlert"></div>
        <div class="tv-hud">
          <span class="tv-hud-v"><i></i>${ccNum(viewers)}</span>
          ${subsToday?`<span class="tv-hud-s">${esc(T.ccStreamSubsToday(ccNum(subsToday)))}</span>`:''}
          ${live?`<span class="tv-hud-t">${esc(T.ccStreamUptime)}</span>`:''}
        </div>
        ${live ? '' : `<div class="tv-go-wrap">
          <div class="tv-go-h">${T.ccStreamGoLive}</div>
          ${closed ? `<div class="tv-go-off">${T.ccStreamDayGone}</div>`
                   : `<div class="tv-go-row">${cupBtn}${watchBtn}${CC_STREAM_KINDS.map(btn).join('')}</div>`}
        </div>`}
      </div>
      <div class="tv-chanrow">
        <span class="tv-chan-av">${av(mine, me.nick, false)}
          ${live?`<i class="tv-live">${T.chLiveTag}</i>`:''}</span>
        <div class="tv-chan-in">
          <b>${esc(me.nick||'')}${tier==='part'?`<i class="tv-tick" title="${esc(T.ccTwPartner)}">✓</i>`:''}${
            tier==='aff'?`<i class="tv-aff">${esc(T.ccTwAffiliate)}</i>`:''}</b>
          <div class="tv-title">${esc(live ? T.ccStreamTitleLive : T.ccStreamTitleOff)}</div>
          <div class="tv-cat"><span class="tv-cat-l">${T.ccStreamCatFn}</span>
            <span class="tv-lang">${esc(T.ccStreamLang)}</span></div>
          ${ccSacOn() ? `<div class="tv-sac" title="${esc(T.ccSacTitle)}">${esc(T.ccSacBio(ccSacCode()))}</div>`
                      : `<div class="tv-sac off">${esc(T.ccSacLocked(ccNum(CC_SAC.fol)))}</div>`}
        </div>
        <div class="tv-acts">
          <span class="tv-heart">♥</span><span class="tv-bell">🔔</span>
          <span class="tv-bits">${T.ccStreamBits}</span>
          <span class="tv-gift">${T.ccStreamGift}</span>
          <span class="tv-sub">${T.ccStreamSub}</span>
        </div>
      </div>
      <div class="tv-stats">
        <span>${T.xFollowers} <b>${ccNum(cr.twitch||0)}</b></span>
        <span>${T.ccStreamViewers} <b>${ccNum(ccStreamViewersNow())}</b></span>
        <span>${T.ccSumStreamed} <b>${ccMoney(cr.streamed||0)}</b></span>
        ${ccSacOn() ? `<span>${esc(T.ccSacTitle)} <b>${ccMoney(cr.sac||0)}</b></span>` : ''}
        ${Object.keys(ccTwSubs()).length ? `<span>${esc(T.ccTwSubsCost(ccTwSubsMonthly()))}</span>` : ''}
        ${live?`<span class="tv-last">${esc(T.ccNewsStreamStats.apply(null, live.a))}</span>`:''}
      </div>
      ${cr.streamLast && cr.streamLast.sum ? `<div class="tv-sum"><div class="tw-h">${esc(T.ccTvSumTitle)}${
          cr.streamLast.label?' · '+esc(cr.streamLast.label):''}${cr.streamLast.day?' · '+esc(ccStamp({day:cr.streamLast.day})):''}</div>${
          ccTvSumTilesHTML(cr.streamLast.sum)}${ccTvSumChartHTML(cr.streamLast.sum)}</div>` : ''}
      ${live ? '' : ccColabPanelHTML()}
      ${careerTwBarHTML()}
    </main>
    <aside class="tv-chat">
      <div class="tv-chat-h">${T.ccStreamChat}</div>
      <div class="tv-pin"><i>${esc(T.ccStreamPinned(me.nick||''))}</i>
        <b>${esc(T.ccStreamPinText)}</b></div>
      <div class="tv-msgs">${chat}</div>
      <div class="tv-say">${T.ccStreamSay}</div>
    </aside>
  </div>`;
}
/* Чат эфира. Люди в нём настоящие — те же, кого мод уже знает: напарник, клуб,
   друзья, подписки, соперники из комнаты и креаторы; строки короткие, как в
   чате, и посеяны днём, чтобы при перерисовке чат не прыгал. Цвет ника — из
   ника же, как это делает сам Twitch. */
function careerStreamChat(n){
  const cr=CAREER && CAREER.career; if(!cr) return [];
  const rnd=careerRng(ccHashStr('chat|'+(cr.season||1)+'|'+careerToday()));
  const who=[];
  const add=h=>{ if(h && !who.some(x=>hKey(x)===hKey(h))) who.push(String(h)); };
  const mate=careerPartnerCard(); if(mate) add(mate.handle);
  (cr.friends||[]).forEach(add);
  (ccFollows()||[]).forEach(add);
  careerLiveNow(8).forEach(s=>add(s.name));
  try{ careerRosterNowEU().slice(0, 40).forEach(p=>{ if(rnd()<0.3) add(p.handle); }); }catch(e){}
  /* КТО ПИШЕТ — В ОСНОВНОМ НИКТО. Правка: «фоловятся и в чат
     пишут не про-игроки и контент-мейкеры, могут иногда, но в основном
     рандомные ники, и сделай ники без циферок маленькими буквами». Так и на
     настоящем Twitch: чат — это зрители, а не сцена. Люди сцены остаются в
     списке, но один на семерых; остальные — выдуманные ники, посеянные днём,
     как и всё в этом чате. */
  const CC_CHAT_REAL=0.15;
  const fake=[]; const seen=new Set(who.map(hKey));
  for(let i=0;i<40 && fake.length<32;i++){
    const h=ccChatNick(rnd);
    if(!seen.has(h)){ seen.add(h); fake.push(h); }
  }
  if(!who.length && !fake.length) return [];
  const bank=L().ccStreamChatLines||[];
  const hhmm=i=>{
    const m=(3*60+11+i)%1440;                     // «03:11», как на скриншоте
    return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
  };
  const out=[];
  for(let i=0;i<(n||10);i++){
    const real=who.length && (!fake.length || rnd()<CC_CHAT_REAL);
    const h=real ? who[Math.floor(rnd()*who.length)] : fake[Math.floor(rnd()*fake.length)];
    const t=bank.length ? bank[Math.floor(rnd()*bank.length)] : '';
    out.push({who:real ? ccHandle(h) : h, text:t, at:hhmm(i), c:ccChatColor(h)});
  }
  return out;
}
/* Выдуманный ник зрителя: строчные латинские буквы, без цифр — отзыв.
   Собирается из трёх корзин (приставка, корень, хвост), как ники и собирают:
   «sleepyfox», «notkev», «mrnoodlettv». Бросок — снаружи, чтобы список дня
   был одним и тем же при перерисовке. */
const CC_NICK_A=['sleepy','tiny','big','dark','cold','lucky','shy','loud','mr','not','just','the','lil',
  'old','soft','wild','dry','pale','lazy','mad','sir','fake','real','sad','okay','late','only','no',
  'cozy','ghost','grim','kinda','ex','pro','ur','my','og','low','high','sus'];
const CC_NICK_B=['fox','kev','moon','ash','pepper','noodle','bean','cat','wolf','pixel','storm','maple',
  'taco','rice','frog','pine','cloud','neon','sock','wren','otter','mint','crow','dust','lime','fern',
  'vex','zed','rune','koi','max','leo','nova','ivy','milo','bear','duck','pie','jam','yoshi','remy',
  'kai','luna','pug','toast','waffle','mango','kiwi','ziggy','bones'];
const CC_NICK_C=['','','','','','','tv','yt','ttv','lol','pls','gg','x','z','er','y','ie','o','s'];
function ccChatNick(rnd){
  const r=rnd||Math.random;
  // Зритель — настоящий игрок региона (CC_LADDER_REAL), как в живом чате; иначе собранный ник.
  const rp=ccLadderRealPick(r, new Set(), 0); if(rp) return rp[0];
  const pick=a=>a[Math.floor(r()*a.length)];
  const shape=r();
  const nick = shape<0.55 ? pick(CC_NICK_A)+pick(CC_NICK_B)+pick(CC_NICK_C)
             : shape<0.8  ? pick(CC_NICK_B)+pick(CC_NICK_C)
             : pick(CC_NICK_B)+pick(CC_NICK_B);
  return nick.toLowerCase().replace(/[^a-z]/g,'');
}
// Цвет ника в чате — из самого ника, как у Twitch: один и тот же человек
// всегда одного цвета.
const CC_CHAT_COLORS=['#ff7f50','#1e90ff','#00ff7f','#ff69b4','#daa520','#9acd32',
                      '#00ced1','#ff4500','#8a2be2','#5f9ea0'];
function ccChatColor(h){
  return CC_CHAT_COLORS[ccHashStr(String(h||'')) % CC_CHAT_COLORS.length];
}

/* ---- Трансферы сцены ----
   Пары распадаются (ccDuoBroken), стоят на рынке CC_FA_DAYS и сходятся заново
   (ccRemadeDuos). Каждый день сверяем, кто с кем в паре (ccPairMateOf по
   careerPools), со снимком прошлой сверки, и объявляем новые пары как трансфер,
   не больше CC_MOVE_POSTS_DAY в день. Раз в месяц пресса называет самого
   выросшего и самого просевшего за сезон (CAREER.dev, careerDevOf). */
const CC_MOVE_POSTS_DAY=2, CC_RISE_MIN=3;
function ccPairKeyNow(){
  const out={};
  let duos=[];
  try{ duos=(careerPools()||{}).duos||[]; }catch(e){ return out; }
  duos.forEach(d=>{
    const cs=(d.cards||[]).filter(Boolean);
    if(cs.length<2) return;
    const ks=cs.map(c=>hKey(c)).sort();
    ks.forEach((k,i)=>{ out[k]=ks.filter((_,j)=>j!==i).join('+'); });
  });
  return out;
}
function careerSceneMovesTick(){
  const cr=CAREER && CAREER.career; if(!cr) return 0;
  const now=ccPairKeyNow();
  const was=cr.pairs || null;
  cr.pairs=now;
  if(!was) return 0;                     // первая сверка: снимок без новостей
  const mine=hKey(CAREER.player && (CAREER.player.handle||CAREER.player.nick));
  const said=new Set(), rows=[];
  Object.keys(now).forEach(k=>{
    if(k===mine || now[k]===was[k]) return;      // пара та же — не новость
    if(!now[k]) return;                          // распад объявляет свой пост
    const pair=[k].concat(now[k].split('+')).sort().join('+');
    if(said.has(pair)) return;
    said.add(pair);
    if(pair.split('+').some(h=>h===mine)) return;  // свою пару объявляешь сам
    rows.push(pair.split('+'));
  });
  let n=0;
  rows.slice(0, CC_MOVE_POSTS_DAY).forEach(ks=>{
    const card=ccWhoCard(ks[0]);
    careerNews('flat', 'ccNewsSceneDuo',
               [ccHandle(ks[0]), ks.slice(1).map(h=>'@'+ccHandle(h)).join(L().ccListAnd)],
               {by:card ? {name:ks[0], ovr:card._ovr!=null?card._ovr:(attrsFor(card)||{}).ovr,
                           card:card.region?{handle:card.handle, region:card.region}:null}
                        : undefined});
    n++;
  });
  return n;
}
/* Раз в месяц — кто вырос и кто просел. Числа из книги роста сцены, а не из
   воздуха: careerDevOf это то, на сколько человек уже сдвинулся за карьеру. */
function careerSceneRiseTick(){
  const cr=CAREER && CAREER.career; if(!cr) return false;
  const key='rise|'+ccMonthKey(careerToday());
  cr.told=cr.told||{};
  if(cr.told[key]) return false;
  const book=(CAREER && CAREER.dev) || null;
  if(!book) return false;
  const rows=Object.keys(book).map(k=>({k:k, d:book[k]})).filter(r=>Math.abs(r.d)>=CC_RISE_MIN);
  if(!rows.length) return false;
  cr.told[key]=1;
  rows.sort((a,b)=>b.d-a.d);
  const up=rows[0], down=rows[rows.length-1];
  const nameOf=k=>{ const c=ccWhoCard(k); return ccHandle((c && c.handle) || k); };
  if(up && up.d>=CC_RISE_MIN) careerNews('good', 'ccNewsSceneRise', [nameOf(up.k), Math.round(up.d)]);
  if(down && down.d<=-CC_RISE_MIN) careerNews('bad', 'ccNewsSceneFall', [nameOf(down.k), Math.round(-down.d)]);
  return true;
}

/* ---- Анкета свободного агента — через два дня после развода ----

   Развод и анкета одним вечером читались как два одинаковых поста (скриншот
   3 сентября). Теперь ccAdMake помечает анкету (ad.post) в день развода, а
   пост с карточкой выходит, когда прошло два дня и человек всё ещё свободен.
   Не больше двух анкет в день, чтобы лента не стала доской объявлений. */
const CC_AD_POST_DELAY=2, CC_AD_POSTS_DAY=2;
function careerAdPostTick(){
  const ads=CAREER && CAREER.ads; if(!ads) return 0;
  const today=careerToday();
  let n=0;
  Object.keys(ads).forEach(k=>{
    const ad=ads[k];
    if(!ad || !ad.post || ad.posted || n>=CC_AD_POSTS_DAY) return;
    if(ccDaysBetween(ad.day, today)<CC_AD_POST_DELAY) return;
    ad.posted=1;
    const h=ad.handle || k;
    if(!ccAdOf(h)) return;   // уже нашёл пару — анкета не нужна
    // PR — круглым числом, а без порога — без «min 0 PR» (16.10): так анкету в X никто не пишет.
    const pr=Math.round((+ad.pr||0)/500)*500;
    careerNews('flat', pr>0 ? 'ccPostLfdWant' : 'ccPostLfdWantAny', [ccHandle(h), ad.div, pr>0 ? ccNum(pr) : 0], {card:ccHandle(h)});
    n++;
  });
  return n;
}

/* ---- 12. Мета сезона ----

   Смена сезона Fortnite меняет остров и пул. Три дня разбора новой меты —
   каждый плюс к форме; кто не разобрал, первые две недели сезона играет со
   штрафом к форме, который тает с каждым разобранным днём. */
const CC_META_DAYS=3, CC_META_WINDOW=14, CC_META_OPEN=21, CC_META_PEN=0.3, CC_META_FORM=0.15;
function ccMeta(){ const cr=CAREER && CAREER.career; return (cr && cr.meta) || null; }
function ccMetaOpen(){
  const m=ccMeta(); if(!m || !m.from) return false;
  return m.days<CC_META_DAYS && ccDaysBetween(m.from, careerToday())<CC_META_OPEN;
}
function ccMetaPen(){
  const m=ccMeta(); if(!m || !m.from || m.days>=CC_META_DAYS) return 0;
  if(ccDaysBetween(m.from, careerToday())>=CC_META_WINDOW) return 0;
  return Math.round(CC_META_PEN*(CC_META_DAYS-m.days)/CC_META_DAYS*100)/100;
}
function careerMetaStart(id){
  const cr=CAREER && CAREER.career; if(!cr) return;
  if(cr.meta && cr.meta.id===id) return;
  cr.meta={id:id, days:0, from:careerToday()};
  // Сезон в посте — «C7S2», не внутренний «S40» (16.10).
  careerNews('flat', 'ccNewsMetaNew', [(function(){ try{ return ccSeasonTag(careerToday()).short || id; }catch(e){ return id; } })()]);
}
function careerMetaDay(){
  const m=ccMeta(); if(!m) return;
  m.days=(m.days||0)+1;
  const cr=CAREER.career;
  cr.form=clamp((cr.form||0)+CC_META_FORM, -CC_FORM_MAX, CC_FORM_MAX);
}

/* ---- 5. Контракт с зубами: бонус за Мейджор и клуб, уходящий из Fortnite ----

   Бонус — половина месячной зарплаты, не меньше ста, за каждый финал Мейджора
   в сезоне; платится в день, когда строка появляется в журнале. Уход клуба —
   раз за сезон с шансом CC_ORG_QUIT_ODDS, день назначается заранее и лежит в
   сейве, чтобы перезагрузка ничего не переигрывала. */
const CC_ORG_QUIT_ODDS=0.08;
function careerOrgBonusFor(salary){ return Math.max(100, Math.round((salary||0)*0.5/50)*50); }
function careerOrgBonus(org){
  // Свой клуб премий хозяину не платит — деньги и так его (careerClubHTML).
  if(!org || org.own) return 0;
  return org.bonus!=null ? org.bonus : careerOrgBonusFor(org.salary);
}
function careerOrgBonusTick(){
  const org=CAREER && CAREER.org, cr=CAREER && CAREER.career;
  if(!org || !cr) return 0;
  const bonus=careerOrgBonus(org); if(!bonus) return 0;
  let paid=0;
  (cr.log||[]).forEach(r=>{
    if(r.kind!=='major' || r.stage!=='final' || r.season!==cr.season || r.bonusPaid) return;
    r.bonusPaid=1; paid+=bonus;
  });
  if(paid){
    cr.balance=(cr.balance||0)+paid;
    cr.wages=(cr.wages||0)+paid;
    org.paid=(org.paid||0)+paid;
    careerNews('good', 'ccNewsOrgBonus', [org.name, ccMoney(paid)], {by:ccOrgBy(org.name)});
  }
  return paid;
}
function careerOrgQuitDue(iso){
  const cr=CAREER && CAREER.career, org=CAREER && CAREER.org;
  // Свой клуб состав не закрывает — см. careerOrgSeasonEnd.
  if(!cr || !org || org.own) return false;
  cr.told=cr.told||{};
  const key='oq|'+cr.season+'|'+org.name;
  if(!cr.told[key]){
    cr.told[key]=1;
    const rnd=careerRng(ccHashStr(key+'|'+(CAREER.player.nick||'')));
    cr.orgQuit = rnd()<CC_ORG_QUIT_ODDS
      ? {org:org.name, day:ccAddDays(iso, 20+Math.floor(rnd()*200))} : null;
  }
  const q=cr.orgQuit;
  return !!(q && q.org===org.name && iso>=q.day && iso<=ccYearTo());
}

/* ---- 2. События-развилки: принудительные дни ----

   Обычные события дня кидаются броском (ccDayRoll). Уход клуба приходит по
   делу, а не по жребию — в назначенный день. */
function careerForcedEvent(iso){
  const cr=CAREER && CAREER.career; if(!cr) return null;
  if((careerYearDays().get(iso)||[]).length) return null;
  if((cr.did||{})[iso]) return null;
  if(careerOrgQuitDue(iso)) return CC_DAY_EVENTS.find(e=>e.id==='orgQuit') || null;
  return null;
}
// Самый слабый из шести — то, что тренер-волонтёр берётся подтянуть.
function ccWeakestAttr(){
  const six=(CAREER.player.attrs) || ccOwnAttrs();
  return ATTR_KEYS.slice().sort((a,b)=>(six[a]||50)-(six[b]||50))[0];
}
// Нижний предел стата: выставленное на вкладке «Свои статы до 99», иначе 35.
function ccAttrFloor(k){
  const f=CAREER && CAREER.player && CAREER.player.attrsFloor;
  return (f && f[k]!=null) ? Math.min(99, f[k]) : 35;
}
function careerStatBump(k, by){
  const pl=CAREER.player;
  if(!pl.attrs) pl.attrs=ccOwnAttrs();
  pl.attrs[k]=clamp((pl.attrs[k]||50)+by, ccAttrFloor(k), 99);
  const raw=ATTR_KEYS.reduce((sum,x)=>sum+(pl.attrs[x]||50)*ATTR_W[x],0);
  const now=pl.ovrExact!=null?pl.ovrExact:pl.ovr;
  pl.ovrExact=clamp(Math.max(now, Math.min(raw, careerTrainCap())), 40, 99);
  pl.ovr=Math.round(pl.ovrExact);
  pl.attrs.ovr=Math.round(raw);
}
// Вчерашний вечер был провальным: место в нижней половине, и это вчера.
function ccBadNightYesterday(){
  const cr=CAREER.career, row=(cr.log||[]).slice(-1)[0];
  if(!row || !row.of) return false;
  if(ccDaysBetween(row.day, careerToday())!==1) return false;
  return row.place>row.of/2;
}

/* ---- 11. План недели — был и снят тем же днём.

   Плитка с сессией на все свободные дни и кнопкой «до турнира» стояла на
   центре пару часов; отзыв: «week plan не нравится, верни как
   было». Перемотка снова тренирует «лучшее за энергию» (careerFfSpendDay). */

/* ---- 3. Вкладка «Статистика» ----

   Всё считается из журнала, ничего не хранится отдельно: журнал и есть
   статистика, вкладка — только её чтение. */
function ccStKindName(kind){
  const w=ccFfKindWord(kind);
  if(w) return w;
  const K={rc:L().ccSumParis, gclc:L().ccSumGclc, summit:L().ccSumSummit, globals:L().ccSumGlobals,
           solo:L().ccStSolo, solos:L().ccStSolo, gc:L().chWkGC};
  return K[kind] || kind || L().chWkCup;
}
function careerStatsHTML(){
  const cr=CAREER.career, T=L();
  const log=(cr.log||[]).filter(r=>r.place);
  const tile=(h, body)=>`<div class="ch-tile"><h4>${h}</h4>${body}</div>`;
  const row=(k,v)=>`<div class="ch-row"><em>${k}</em><b>${v}</b></div>`;
  if(!log.length) return `<div class="ch-grid" style="grid-template-columns:1fr;">${
    tile(T.ccStTitle, `<div class="ch-empty">${T.ccStEmpty}</div>`)}</div>`;
  const sum=(rows,k)=>rows.reduce((s,e)=>s+(e[k]||0),0);
  const avgOf=rows=>{ const w=rows.filter(e=>e.avg!=null);
    return w.length ? (w.reduce((s,e)=>s+e.avg,0)/w.length).toFixed(1) : '-'; };
  const bestOf=rows=>rows.length ? Math.min.apply(null, rows.map(e=>e.place)) : null;
  const games=sum(log,'games'), wins=sum(log,'wins'), elims=sum(log,'elims');
  const podiums=log.filter(e=>e.place<=3).length, top10=log.filter(e=>e.place<=10).length;
  const bestNight=log.reduce((b,e)=>(e.wins||0)>(b?(b.wins||0):0)?e:b, null);
  const bestElims=log.reduce((b,e)=>(e.elims||0)>(b?(b.elims||0):0)?e:b, null);
  const totals=tile(T.ccStTitle,
    row(T.ccStEvents, log.length)+row(T.ccStGames, games)+
    row(T.ccStWins, wins+(games ? ' · '+(wins/games*100).toFixed(1)+'%' : ''))+
    row(T.ccStElims, elims+(games ? ' · '+(elims/games).toFixed(2)+' '+T.ccStPerGame : ''))+
    row(T.ccStAvg, avgOf(log))+row(T.ccStPodiums, podiums)+row(T.ccStTop10, top10)+
    row(T.ccStPromos, log.filter(e=>e.passed).length)+
    row(T.ccStPrize, ccMoney(cr.earnings||0))+row(T.ccStWages, ccMoney(cr.wages||0))+
    row(T.ccStSide, ccMoney(cr.side||0))+
    (bestNight ? row(T.ccStBestNight, bestNight.wins+' VR · '+ccLogName(bestNight)) : '')+
    (bestElims ? row(T.ccStBestElims, bestElims.elims+' · '+ccLogName(bestElims)) : ''));
  const group=(keyOf)=>{ const m=new Map(); log.forEach(e=>{ const k=keyOf(e);
    if(!m.has(k)) m.set(k,[]); m.get(k).push(e); }); return m; };
  const table=(head, m, name)=>tile(head, `<div class="ev-wrap"><table class="ev-table cc-st-table">
    <thead><tr><th></th><th>${T.ccStEvents}</th><th>${T.ccStBest}</th><th>VR</th><th>${T.ccStAvg}</th><th>$</th></tr></thead><tbody>${
    [...m.entries()].map(([k,rows])=>`<tr><td class="ev-name"><b>${name(k,rows)}</b></td>
      <td class="ev-num">${rows.length}</td><td class="ev-num">#${bestOf(rows)}</td>
      <td class="ev-num">${sum(rows,'wins')}</td><td class="ev-num">${avgOf(rows)}</td>
      <td class="ev-num ev-cash">${sum(rows,'prize') ? ccMoney(sum(rows,'prize')) : '-'}</td></tr>`).join('')
    }</tbody></table></div>`);
  const byKind=table(T.ccStByKind, group(e=>e.kind||'cup'), k=>esc(ccStKindName(k)));
  const bySeason=table(T.ccStBySeason, group(e=>e.season||1),
    (k,rows)=>T.ccStSeason+' '+k+' · '+T.ccRoOvr+' '+Math.round(rows.reduce((m,e)=>Math.max(m,e.ovr||0),0)));
  const mates=group(e=>e.mate||'');
  mates.delete('');
  const byMate=mates.size ? table(T.ccStPartners, mates, k=>esc(k)) : '';
  const spots=(()=>{
    const store=careerSpots(); const lines=[];
    Object.keys(store||{}).forEach(key=>{
      const v=Array.isArray(store[key]) ? store[key] : (store[key] ? [store[key]] : []);
      v.forEach(s=>{ if(s && s.i!=null) lines.push(row(esc(key)+' · '+T.ccStSpotBox+' '+(s.i+1),
        T.ccStAura+' '+(s.aura||0)+' · '+T.ccStWins+' '+(s.won||0))); });
    });
    return lines.length ? tile(T.ccStSpots, lines.join('')) : '';
  })();
  const curve=careerRatingCurve(log.slice().reverse());
  const rating=curve ? tile(T.ccStCurve, curve) : '';
  return `<div class="ch-grid ch-standings">${totals}${rating}${byKind}${bySeason}${byMate}${spots}</div>`;
}

/* ---- 4. Зал славы по слотам ----

   Шесть карьер на одном экране: кто чего добился и четыре рекорда между
   ними. Читается прямо из сейвов, ничего не грузя. */
function careerHallRows(){
  const rows=[];
  for(let n=1; n<=CC_SLOTS; n++){
    const s=ccSlotRead(n), c=ccSlotCard(n);
    if(!s || !c || !s.career) continue;
    const log=(s.career.log||[]).filter(r=>r.place);
    const majors=log.filter(r=>r.kind==='major' && r.stage==='final');
    const d1=log.filter(r=>r.div===1).sort((a,b)=>(a.season-b.season)||(a.day<b.day?-1:a.day>b.day?1:0))[0];
    rows.push({n:n, card:c, nick:s.player.nick||'', seasons:s.career.season||1,
      peak:Math.round(log.reduce((m,r)=>Math.max(m,r.ovr||0), s.player.ovr||0)),
      topDiv:log.reduce((m,r)=>Math.min(m,r.div||5), s.career.division||5),
      wins:log.reduce((a,r)=>a+(r.wins||0),0), events:log.length,
      earnings:s.career.earnings||0,
      d1:d1 ? {season:d1.season, day:d1.day} : null,
      major:majors.length ? Math.min.apply(null, majors.map(r=>r.place)) : null,
      retired:!!s.retired});
  }
  return rows;
}
function careerHallHTML(){
  const T=L(), rows=careerHallRows();
  if(rows.length<1) return '';
  const top=(val, better)=>rows.filter(r=>val(r)!=null).sort((a,b)=>better(val(a), val(b)))[0] || null;
  const rich=top(r=>r.earnings||null, (a,b)=>b-a);
  const early=top(r=>r.d1 ? r.d1.season*10000+ccDaysBetween(ccYearFrom(), r.d1.day) : null, (a,b)=>a-b);
  const most=top(r=>r.wins||null, (a,b)=>b-a);
  const major=top(r=>r.major, (a,b)=>a-b);
  const rec=(label, r, v)=>r ? `<div class="ch-row"><em>${label}</em><b>${esc(r.nick)} · ${v}</b></div>` : '';
  const records=rec(T.ccHallRich, rich, rich ? ccMoney(rich.earnings) : '')+
    rec(T.ccHallEarlyD1, early, early ? T.ccSlotSeason+' '+early.d1.season+' · '+ccDayLabel(early.d1.day) : '')+
    rec(T.ccHallMostWins, most, most ? most.wins+' VR' : '')+
    rec(T.ccHallBestMajor, major, major ? '#'+major.major : '');
  const list=rows.map(r=>`<div class="ch-row cc-hall-row"><em>${esc(r.nick)}${r.retired ? ' · '+T.ccSlotRetired : ''}</em>
    <b>${T.ccHallSeasons} ${r.seasons} · ${T.ccHallPeak} ${r.peak} · ${T.ccDivision} ${r.topDiv} · ${r.wins} VR · ${ccMoney(r.earnings)}</b></div>`).join('');
  return `<div class="ch-tile cc-hall"><h4>${T.ccHallTitle}</h4>${
    records ? `<div class="cc-hall-rec">${records}</div>` : ''}${list}</div>`;
}

