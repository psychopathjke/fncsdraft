/*@@PART js/career/awards-share-boards.js@@*/
/* ИКОНКИ НАГРАД — предметы Fortnite вместо эмодзи (17.10, его «awards сделай логотипы, фортнайтовские»): игрок года —
   мифическая золотая рыбка (главный трофей острова), награда месяца — флоппер Мидаса, лучшее дуо — Chug Splash (лечит
   всю команду), новичок — Small Fry, фраггер — помпа, IGL — сканер разведки. Картинки — из items/ сайта. */
const CC_AW_ICON={goty:'items/m1-mythic-goldfish.png', month:'items/m1-midas-flopper.png', duo:'items/m1-chug-splash.png',
  rookie:'items/m1-small-fry.png', frag:'items/m1-iron-pump-shotgun.png', igl:'items/itm-recon-scanner.webp'};
function ccAwIcon(k){ const s=CC_AW_ICON[k] || CC_AW_ICON.igl; return '<img class="cc-aw-ic" src="'+s+'" alt="" loading="lazy">'; }
function careerSeasonCatsHTML(){
  const cr=CAREER.career, T=L();
  const won=careerAwardCatsWon(cr.season);
  if(!won.length) return '';
  const block=a=>{ const top=a.top||[]; if(!top.length) return ''; const w=top[0];
    const rest=top.slice(1).map((r,i)=>`<div class="ch-row cc-goty-row${r.you?' me':''}"><em><i>${i+2}</i>${esc(r.n)}</em><b>${r.pct}%</b></div>`).join('');
    return `<div class="cc-aw-cat"><h5>${esc(ccAwCatLabel(a.cat))}</h5>
      <div class="cc-goty-win${w.you?' me':''}"><span class="cc-goty-ball" aria-hidden="true">${ccAwIcon(a.cat)}</span>
        <div><b>${esc(w.n)}</b><em>${esc(T.ccAwVote(w.pct))}</em></div></div>${rest}</div>`; };
  return `<div class="ch-tile cc-goty cc-aw"><h4>${T.ccAwCatsH}</h4>${won.map(block).join('')}<div class="ch-hint">${T.ccAwHow}</div></div>`;
}
function careerSeasonAwardHTML(){
  const cr=CAREER.career;
  const aw=(careerAwards().won||[]).filter(a=>a.kind==='season' && a.season===cr.season)[0];
  if(!aw) return '';
  let top=aw.top;
  if(!top || !top.length){
    const from=Math.max(0, (cr.season||1)-1)*365;
    top=careerAwardBoard(from, from+365).slice(0, CC_AWARD_TOP)
        .map(r=>({n:r.name, p:Math.round(r.pts), e:r.events, you:!!r.you}));
  }
  if(!top.length) return '';
  const win=top[0];
  const rest=top.slice(1).map((r,i)=>`<div class="ch-row cc-goty-row${r.you?' me':''}">
      <em><i>${i+2}</i>${esc(r.n)}</em><b>${ccNum(r.p)}</b></div>`).join('');
  return `<div class="ch-tile cc-goty">
    <h4>${L().ccGotyTitle}</h4>
    <div class="cc-goty-win${win.you?' me':''}">
      <span class="cc-goty-ball" aria-hidden="true">${ccAwIcon('goty')}</span>
      <div><b>${esc(win.n)}</b>
        <em>${esc(L().ccGotyLine(ccNum(win.p), win.e))}</em></div>
    </div>
    ${rest}
    <div class="ch-hint">${L().ccGotyHow}</div>
  </div>`;
}

/* Церемония закрытия сезона, отдельный последний день года (careerEvents, вид 'gala'). Четыре экрана: год
   открывается, твои числа, вечера и награды, игрок года.
   Открывается только по кнопке: окно без спроса вешает headless-проверки (так было с confirm() и окном метки, см.
   careerSpotGate). Кнопка рядом с «Новым сезоном», а не вместо, путь «.ch-play и дальше» не тронут. */
const CC_GALA_SLIDES=6;   // + слайд «Твой год» (ccGalaYouSlide) после цифр года   // 10.09: слайд номинаций перед игроком года
let CC_GALA_STEP=0;
// Год, собранный из того, что карьера УЖЕ записала: журнал, доска PR и список
// наград. Церемония ничего не считает от себя — она читает.
function ccGalaYear(season){
  const cr=CAREER.career, s=season||cr.season;
  const log=(cr.log||[]).filter(r=>r.season===s);
  const placed=log.filter(r=>r.place);
  const best=placed.length ? placed.reduce((a,b)=>(b.place<a.place ? b : a)) : null;
  const from=Math.max(0, (s||1)-1)*365;
  const me=careerAwardBoard(from, from+365).filter(r=>r.you)[0];
  const card=careerCard(), a=card ? attrsFor(card) : null;
  // Прошлый сезон — рейтинг его последнего вечера, а не сегодняшний.
  const ovr = s!==cr.season && log.length && log[log.length-1].ovr ? log[log.length-1].ovr
            : a ? Math.round(a.ovr + (card._ageEdge||0))
                : CAREER.player.ovr;
  return {
    season:s, div:cr.division,
    events:log.length,
    wins:log.reduce((n,r)=>n+(r.wins||0), 0),
    elims:log.reduce((n,r)=>n+(r.elims||0), 0),
    prize:log.reduce((n,r)=>n+(r.prize||0), 0),
    pr: me ? Math.round(me.pts) : 0,
    best: best,
    ovr: ovr,
    // Рейтинг на первом вечере года — от него и считается рост. Вечеров не
    // было — роста тоже нет, а не «вырос на весь рейтинг».
    grew: placed.length ? Math.round(ovr - (placed[0].ovr||ovr)) : 0,
    runs: careerBigRuns(s),
    prev: ccGalaPrev(s),
    months: (careerAwards().won||[]).filter(x=>x.kind==='month' && x.season===s && x.you),
    goty: (careerAwards().won||[]).filter(x=>x.kind==='season' && x.season===s)[0] || null
  };
}
/* ИТОГИ ГОДА (17.10, его «8»): к церемонии — сравнение с прошлым годом и картинка, которой можно поделиться. */
function ccGalaPrev(s){
  const log=((CAREER.career.log)||[]).filter(r=>r.season===s-1);
  if(!log.length) return null;
  const placed=log.filter(r=>r.place);
  return {events:log.length, wins:log.reduce((n,r)=>n+(r.wins||0), 0), elims:log.reduce((n,r)=>n+(r.elims||0), 0),
          prize:log.reduce((n,r)=>n+(r.prize||0), 0), best:placed.length ? Math.min.apply(null, placed.map(r=>r.place)) : null};
}
function ccGalaDelta(now, was, money){
  if(was==null) return '';
  const d=now-was; if(!d) return '<i class="cc-gala-d">=</i>';
  return '<i class="cc-gala-d '+(d>0 ? 'up' : 'down')+'">'+(d>0 ? '▲' : '▼')+(money ? ccMoney(Math.abs(d)) : ccNum(Math.abs(d)))+'</i>';
}
function ccGalaShareLines(y){
  const cr=CAREER.career, log=(cr.log||[]).filter(e=>e.season===y.season);
  const mates={}; log.forEach(e=>(e.mates||(e.mate?[e.mate]:[])).forEach(m=>{ if(m) mates[m]=(mates[m]||0)+1; }));
  const top=Object.keys(mates).sort((a,b)=>mates[b]-mates[a])[0];
  const run=(y.runs||[])[0];
  return {tiles:[[ccNum(y.events), L().ccGalaEvents], [ccNum(y.wins), L().ccGalaWins], [ccNum(y.elims), L().ccGalaElims],
                 [ccMoney(y.prize), L().ccGalaPrize], [y.best ? '#'+y.best.place : '-', L().ccGalaBest], [String(y.ovr), L().ccGalaOvr]],
          rows:[run ? [careerRunLabel(run), L().ccBoardPlace(run.place, run.of)] : null,
                top ? [L().lfGalaTopMate, top+' · '+mates[top]] : null,
                (y.goty && y.goty.you) ? [L().ccGalaGotyYou, '🏆'] : null,
                y.prev ? [L().ccGalaPrevRow, ccMoney(y.prev.prize)+' · '+(y.prev.best ? '#'+y.prev.best : '-')] : null,
                ((CAREER.career.locker||[]).filter(it=>it.season===y.season && it.kind!=='spray').length)
                  ? [L().ccLockerTitle, (CAREER.career.locker||[]).filter(it=>it.season===y.season && it.kind!=='spray').map(it=>it.name).slice(0, 2).join(', ')] : null
               ].filter(Boolean).slice(0, 4)};
}
/* ПОДЕЛИТЬСЯ — ОКНОМ С КАРТИНКОЙ (17.10, его «поделиться результатами сезона нельзя»). Раньше кнопка
   молча отдавала файл: на ПК он тихо падал в загрузки (или открывалось окно Windows), в Safari
   navigator.share после await рисования терял жест нажатия и падал. Теперь картинка рисуется сразу,
   показывается, и уже по ГОТОВОМУ файлу: «Отправить» (share в том же нажатии), «Сохранить» (обычная
   ссылка download) и «Скопировать» (буфер обмена). Любой сезон — не только идущий: из Истории тоже. */
let CC_GALA_FILE=null;
async function ccGalaShare(season){
  let blob=null, name='';
  try{ ({blob, name}=await ccGalaShareBlob(season)); }
  catch(e){ console.warn('gala share', e); }
  ccGalaShareModal(blob, name);
}
function ccGalaShareModal(blob, name, title){
  const T=L();
  if(CC_GALA_FILE && CC_GALA_FILE.url) URL.revokeObjectURL(CC_GALA_FILE.url);
  CC_GALA_FILE=blob ? {blob:blob, name:name, url:URL.createObjectURL(blob), file:null} : null;
  try{ if(blob && typeof File==='function') CC_GALA_FILE.file=new File([blob], name, {type:'image/png'}); }catch(e){}
  const canSend=!!(CC_GALA_FILE && CC_GALA_FILE.file && navigator.canShare && (()=>{ try{ return navigator.canShare({files:[CC_GALA_FILE.file]}); }catch(e){ return false; } })());
  const canCopy=!!(blob && navigator.clipboard && navigator.clipboard.write && typeof ClipboardItem==='function');
  let el=document.getElementById('ccGalaShareModal');
  if(!el){ el=document.createElement('div'); el.id='ccGalaShareModal'; el.className='cc-gala-wrap cc-share-wrap';
    el.addEventListener('click', e=>{ if(e.target===el) ccGalaShareClose(); }); document.body.appendChild(el); }
  el.innerHTML=`<div class="cc-share" role="dialog" aria-modal="true">
    <h4>${esc(title||T.ccGalaShare)}</h4>
    ${CC_GALA_FILE ? `<img class="cc-share-img" src="${CC_GALA_FILE.url}" alt="">` : `<div class="cc-gala-hint">${esc(T.ccShareFail||'Could not draw the picture')}</div>`}
    <div class="cc-share-cta">
      ${canSend ? `<button class="cstrip-btn cstrip-btn-go" onclick="ccGalaShareSend()">${esc(T.ccShareSend||'Send')}</button>` : ''}
      ${CC_GALA_FILE ? `<a class="cstrip-btn ${canSend ? 'cstrip-btn-code' : 'cstrip-btn-go'}" href="${CC_GALA_FILE.url}" download="${esc(name)}">${esc(T.ccShareSave||'Save image')}</a>` : ''}
      ${canCopy ? `<button class="cstrip-btn cstrip-btn-code" id="ccShareCopyBtn" onclick="ccGalaShareCopy()">${esc(T.ccShareCopy||'Copy')}</button>` : ''}
      <button class="cstrip-btn cstrip-btn-code" onclick="ccGalaShareClose()">${esc(T.ccShareClose||'Close')}</button>
    </div>
    <div class="cc-gala-hint" id="ccShareNote"></div>
  </div>`;
}
function ccGalaShareSend(){
  const f=CC_GALA_FILE; if(!f || !f.file) return;
  // Файл уже готов: share зовётся в том же нажатии, без await перед ним.
  navigator.share({files:[f.file]}).catch(e=>{
    if(e && e.name==='AbortError') return;
    const n=document.getElementById('ccShareNote'); if(n) n.textContent=L().ccShareSendFail||'Sharing did not open. Save the image instead';
  });
}
function ccGalaShareCopy(){
  const f=CC_GALA_FILE, n=document.getElementById('ccShareNote'); if(!f) return;
  navigator.clipboard.write([new ClipboardItem({'image/png':f.blob})])
    .then(()=>{ if(n) n.textContent=L().ccShareCopied||'Copied'; })
    .catch(()=>{ if(n) n.textContent=L().ccShareSendFail||'Sharing did not open. Save the image instead'; });
}
/* Картинка карточки для X/Twitter (25.10, его «делай» на «кнопка "Скачать карточку", PNG 1200×675»):
   про отмечают и ретвитят свою карточку, ссылка ведёт на /player/<ник>. Окно то же, что у итогов года
   (ccGalaShareModal): отправить, сохранить, скопировать. */
let CARD_SHARE_PL=null;
function cardShareWord(k){
  const W={btn:{ru:'Поделиться карточкой', fr:'Partager la carte', it:'Condividi la carta', pt:'Compartilhar carta', de:'Karte teilen', es:'Compartir carta', en:'Share card'},
    earn:{ru:'Призовые 2026', fr:'Gains 2026', it:'Guadagni 2026', pt:'Ganhos 2026', de:'Preisgeld 2026', es:'Ganancias 2026', en:'2026 earnings'},
    cards:{ru:'Карточек в игре', fr:'Cartes dans le jeu', it:'Carte nel gioco', pt:'Cartas no jogo', de:'Karten im Spiel', es:'Cartas en el juego', en:'Cards in the game'},
    sub:{ru:'Симулятор карьеры и драфта FNCS', fr:'Simulateur de carrière et de draft FNCS', it:'Simulatore di carriera e draft FNCS', pt:'Simulador de carreira e draft FNCS', de:'FNCS Karriere- und Draft-Simulator', es:'Simulador de carrera y draft FNCS', en:'FNCS career & draft simulator'}};
  return (W[k] && (W[k][LANG] || W[k].en)) || '';
}
function cardShareBtnHTML(pl){
  if(!pl || !pl.handle) return '';
  CARD_SHARE_PL=pl;
  return '<div style="text-align:center;margin:12px 0 2px;"><button class="cstrip-btn cstrip-btn-go" type="button" onclick="cardShareOpen()">'+esc(cardShareWord('btn'))+'</button></div>';
}
// Адрес страницы игрока — по тем же правилам, что build-player-pages.js (≥3 карточки, фото или призовые 2026).
function cardShareLink(pl){
  const h=String(pl.handle||'').trim(), k=h.toLowerCase();
  if(pl._regen || pl._photo || (typeof CAREER!=='undefined' && CAREER && CAREER.player && pl===careerCard())) return 'fncsdraft.com';
  const n=PLAYERS_BASE.filter(p=>p && p.tier!=='qualifier' && hKey(p)===k).length;
  const earn=(typeof HOME_EARN_LQ!=='undefined' ? HOME_EARN_LQ : []).some(r=>String(r.n).toLowerCase()===k);
  const slug=h.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return (slug && (n>=3 || photoURLReal(pl) || earn)) ? 'fncsdraft.com/player/'+slug : 'fncsdraft.com';
}
function cardShareImg(src){
  return new Promise(r=>{ if(!src) return r(null);
    const im=new Image(); const t=setTimeout(()=>r(null), 4000);
    im.onload=()=>{ clearTimeout(t); r(im); }; im.onerror=()=>{ clearTimeout(t); r(null); }; im.src=src; });
}
async function cardShareBlob(pl){
  const W=1200, H=675, c=document.createElement('canvas'); c.width=W; c.height=H;
  const x=c.getContext('2d'), font=(w, s)=>w+' '+s+'px Oswald, "Segoe UI", Roboto, sans-serif';
  try{ if(document.fonts && document.fonts.ready) await document.fonts.ready; }catch(e){}
  const shown=pl._regen && typeof ccRegenShown==='function' ? ccRegenShown(pl) : pl;
  const a=attrsFor(shown), skin=CARD_SKIN[shownRarity(shown)]||CARD_SKIN.common;
  const cols=(String(skin.bg).match(/#[0-9a-f]{6}/gi)||['#7c838c', '#3d424a']);
  const [photo, flag]=await Promise.all([cardShareImg(photoURLReal(shown)), cardShareImg(FLAG_CODE[shown.nat] ? 'flags/w40/'+FLAG_CODE[shown.nat]+'.png' : null)]);
  const g=x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#141a2e'); g.addColorStop(1, '#07090f');
  x.fillStyle=g; x.fillRect(0, 0, W, H);
  const glow=x.createRadialGradient(260, 340, 40, 260, 340, 420); glow.addColorStop(0, skin.glow+'55'); glow.addColorStop(1, skin.glow+'00');
  x.fillStyle=glow; x.fillRect(0, 0, W, H);
  // Карточка слева.
  const cx=70, cy=58, cw=380, ch=560;
  const cg=x.createLinearGradient(cx, cy, cx+cw, cy+ch);
  cols.forEach((col, i)=>cg.addColorStop(cols.length>1 ? i/(cols.length-1) : 0, col));
  roundRect(x, cx, cy, cw, ch, 26); x.fillStyle=cg; x.fill();
  x.save(); roundRect(x, cx, cy, cw, ch, 26); x.clip();
  if(photo){ const s=Math.max(330/photo.width, 400/photo.height), pw=photo.width*s, ph=photo.height*s, px=cx+cw-pw;
    x.drawImage(photo, px, cy, pw, ph);
    // Низ фото растворяется в карточке, а угол под рейтингом темнее, чтобы цифры читались на любом фото.
    const fb=x.createLinearGradient(0, cy+ph-120, 0, cy+ph); fb.addColorStop(0, cols[cols.length-1]+'00'); fb.addColorStop(1, cols[cols.length-1]);
    x.fillStyle=fb; x.fillRect(cx, cy+ph-120, cw, 120);
    const fl=x.createRadialGradient(cx, cy, 30, cx, cy, 300); fl.addColorStop(0, 'rgba(0,0,0,.6)'); fl.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle=fl; x.fillRect(cx, cy, cw, ch); }
  else{ x.fillStyle='rgba(255,255,255,.18)'; x.font=font(800, 260); x.textAlign='right'; x.fillText(String(shown.handle||'?').trim().charAt(0).toUpperCase(), cx+cw-24, cy+300); x.textAlign='left'; }
  const shade=x.createLinearGradient(0, cy+250, 0, cy+ch); shade.addColorStop(0, 'rgba(0,0,0,0)'); shade.addColorStop(.35, 'rgba(0,0,0,.55)'); shade.addColorStop(1, 'rgba(0,0,0,.8)');
  x.fillStyle=shade; x.fillRect(cx, cy+250, cw, ch-250);
  x.restore();
  x.fillStyle='#fff'; x.font=font(800, 104); x.fillText(String(a.ovr), cx+26, cy+112);
  x.font=font(700, 26); x.fillStyle='rgba(255,255,255,.85)'; x.fillText(String(shown.region||'').toUpperCase(), cx+30, cy+150);
  if(flag) x.drawImage(flag, cx+30, cy+166, 48, 36);
  let nm=String(shown.handle||'').trim(), ns=54; x.font=font(800, ns);
  while(ns>28 && x.measureText(nm).width>cw-40){ ns-=2; x.font=font(800, ns); }
  x.textAlign='center'; x.fillStyle='#fff'; x.fillText(nm, cx+cw/2, cy+392);
  x.fillStyle='rgba(255,255,255,.35)'; x.fillRect(cx+40, cy+412, cw-80, 2);
  ATTR_KEYS.forEach((k, i)=>{
    const col=i%3, row=Math.floor(i/3), ax=cx+70+col*120, ay=cy+462+row*58;
    x.fillStyle='#fff'; x.font=font(800, 34); x.fillText(String(a[k]!=null ? a[k] : ''), ax, ay);
    x.fillStyle='rgba(255,255,255,.7)'; x.font=font(600, 18); x.fillText(String(L()[ATTR_LABEL[k]]||k).toUpperCase(), ax, ay+22);
  });
  x.textAlign='left';
  // Справа: ник, турнир, цифры, адрес.
  const rx=510, rw=W-rx-60;
  x.fillStyle='#ffd23f'; x.fillRect(rx, 78, 10, 150);
  x.font=font(700, 30); x.fillText('FNCS DRAFT', rx+30, 108);
  let big=String(shown.handle||'').trim(), bs=84; x.font=font(800, bs);
  while(bs>40 && x.measureText(big).width>rw-30){ bs-=4; x.font=font(800, bs); }
  x.fillStyle='#f2f4fa'; x.fillText(big, rx+30, 214);
  const ev=String(shown.event||'').trim().replace(/\s*[—–]\s*/g, ' · '), yr=String(shown.date||'').slice(0, 4);
  const evFull=(shown.placement ? '#'+shown.placement+' · ' : '')+ev+(yr && ev.indexOf(yr)<0 ? ' '+yr : '');
  let evl=evFull;
  x.font=font(500, 28); x.fillStyle='#9aa3b8';
  while(evl.length>8 && x.measureText(evl+'…').width>rw-30) evl=evl.slice(0, -1);
  if(evl!==evFull) evl=evl.trim()+'…';
  x.fillText(evl, rx+30, 266);
  const rows=[], r=shown.real;
  if(r){ const lb=realStageLabel(r);
    if(r.rank!=null) rows.push([lb.rank, '#'+r.rank]);
    if(r.pts!=null) rows.push([L().realPts, fmtNum(r.pts)]);
    if(r.wins!=null) rows.push([L().realWins, String(r.wins)]); }
  const earn=(typeof HOME_EARN_LQ!=='undefined' ? HOME_EARN_LQ : []).find(e=>String(e.n).toLowerCase()===String(shown.handle||'').trim().toLowerCase());
  if(earn) rows.push([cardShareWord('earn'), '$'+fmtNum(earn.e)]);
  const nCards=shown._regen ? 0 : PLAYERS_BASE.filter(p=>p && p.tier!=='qualifier' && hKey(p)===hKey(shown)).length;
  if(nCards>1 && rows.length<4) rows.push([cardShareWord('cards'), String(nCards)]);
  rows.slice(0, 4).forEach((row, i)=>{
    const bx=rx+30+(i%2)*(rw/2), by=356+Math.floor(i/2)*112;
    x.fillStyle='rgba(255,255,255,.06)'; x.fillRect(bx, by-52, rw/2-24, 96);
    x.fillStyle='#f2f4fa'; x.font=font(800, 42); x.fillText(String(row[1]), bx+20, by);
    x.fillStyle='#9aa3b8'; x.font=font(600, 20); x.fillText(String(row[0]).toUpperCase().slice(0, 30), bx+20, by+30);
  });
  x.fillStyle='#ffd23f'; x.font=font(700, 36); x.fillText(cardShareLink(shown), rx+30, H-104);
  x.fillStyle='#5b6378'; x.font=font(600, 24); x.fillText(cardShareWord('sub'), rx+30, H-66);
  const blob=await new Promise(res=>c.toBlob(res, 'image/png'));
  if(!blob) throw new Error('toBlob gave nothing');
  const slug=String(shown.handle||'card').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'card';
  return {blob, name:'fncsdraft-'+slug+'.png'};
}
async function cardShareOpen(){
  const pl=CARD_SHARE_PL; if(!pl) return;
  let blob=null, name='';
  try{ ({blob, name}=await cardShareBlob(pl)); }
  catch(e){ console.warn('card share', e); }
  ccGalaShareModal(blob, name, cardShareWord('btn'));
  const el=document.getElementById('ccGalaShareModal'); if(el) el.style.zIndex='240';   // поверх окна карточки (220)
}
function ccGalaShareClose(){
  const el=document.getElementById('ccGalaShareModal'); if(el) el.remove();
  if(CC_GALA_FILE && CC_GALA_FILE.url) URL.revokeObjectURL(CC_GALA_FILE.url);
  CC_GALA_FILE=null;
}
async function ccGalaShareBlob(season){
  const y=ccGalaYear(season), S=ccGalaShareLines(y), pl=CAREER.player;
  const W=1080, H=1350, c=document.createElement('canvas'); c.width=W; c.height=H;
  const x=c.getContext('2d'), font=(w, s)=>w+' '+s+'px Oswald, "Segoe UI", Roboto, sans-serif';
  const g=x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#141a2e'); g.addColorStop(1, '#07090f');
  x.fillStyle=g; x.fillRect(0, 0, W, H);
  x.fillStyle='#ffd23f'; x.fillRect(72, 96, 12, 120);
  x.fillStyle='#ffd23f'; x.font=font(700, 40); x.fillText(L().ccGalaShareTag.toUpperCase(), 108, 136);
  x.fillStyle='#f2f4fa'; x.font=font(800, 88); x.fillText(String(pl.nick||'').slice(0, 18), 108, 214);
  x.fillStyle='#9aa3b8'; x.font=font(500, 38); x.fillText(L().ccGalaTitle(y.season)+' · '+ccSeasonYearOf(y.season), 108, 268);
  const cols=3, gap=24, tw=(W-144-gap*(cols-1))/cols, th=210, top=330;
  S.tiles.forEach((t, i)=>{
    const cx=72+(i%cols)*(tw+gap), cy=top+Math.floor(i/cols)*(th+gap);
    x.fillStyle='rgba(255,255,255,.06)'; x.fillRect(cx, cy, tw, th);
    let size=72; x.font=font(800, size); while(size>34 && x.measureText(t[0]).width>tw-40){ size-=4; x.font=font(800, size); }
    x.fillStyle='#f2f4fa'; x.fillText(t[0], cx+24, cy+108);
    x.fillStyle='#9aa3b8'; x.font=font(600, 30); x.fillText(String(t[1]).slice(0, 22), cx+24, cy+164);
  });
  let ry=top+2*(th+gap)+50;
  S.rows.forEach(r=>{
    x.fillStyle='#9aa3b8'; x.font=font(500, 32); x.fillText(String(r[0]).slice(0, 40), 72, ry);
    x.fillStyle='#ffd23f'; x.font=font(700, 40); x.fillText(String(r[1]).slice(0, 40), 72, ry+50);
    ry+=118;
  });
  x.fillStyle='#5b6378'; x.font=font(700, 34); x.fillText('fncsdraft.com', 72, H-64);
  const blob=await new Promise(r=>c.toBlob(r, 'image/png'));
  if(!blob) throw new Error('toBlob gave nothing');
  return {blob:blob, name:'fncsdraft-season-'+y.season+'.png'};
}
function ccGalaNum(v, label){
  return `<div class="cc-gala-num"><b>${v}</b><em>${label}</em></div>`;
}
/* «Твой год» — личное, чего нет в цифрах года: оценки вечеров, лучший вечер, MVP, с кем
   играл (и с кем чаще всего), ранг и сессии Noble. Из журнала сезона и cr.life. */
function ccGalaYouSlide(){
  const cr=CAREER.career, log=(cr.log||[]).filter(e=>e.season===cr.season);
  const rated=log.filter(e=>e.rating!=null);
  const avg=rated.length ? (rated.reduce((a,e)=>a+e.rating,0)/rated.length).toFixed(1) : '-';
  const best=rated.slice().sort((a,b)=>b.rating-a.rating)[0];
  const mvp=rated.filter(e=>e.mvpYou).length;
  const mates={}; log.forEach(e=>(e.mates||(e.mate?[e.mate]:[])).forEach(m=>{ if(m) mates[m]=(mates[m]||0)+1; }));
  const mateList=Object.keys(mates).sort((a,b)=>mates[b]-mates[a]);
  const lf=cr.life||{};
  return '<h4>'+L().lfGalaYouH+'</h4><div class="cc-gala-nums">'+
    ccGalaNum(avg, L().lfAvgRateAll)+ccGalaNum(ccNum(mvp), L().lfMvpAll)+
    ccGalaNum(ccNum(mateList.length), L().lfGalaMates)+
'</div>'+
    (best ? '<div class="cc-gala-row"><em>'+L().lfGalaBestNight+'</em><b>'+best.rating.toFixed(1)+' · '+ccLogName(best)+'</b></div>' : '')+
    (mateList.length ? '<div class="cc-gala-row"><em>'+L().lfGalaTopMate+'</em><b>'+esc(mateList[0])+' · '+mates[mateList[0]]+'</b></div>' : '')+
    (lf.icon ? '<div class="cc-gala-row me"><em>'+L().lfIcon+'</em><b>Icon Series</b></div>' : '');
}
function ccGalaSlide(i, y){
  if(i===0) return `<div class="cc-gala-open">
      <div class="cc-gala-big">${esc(String(y.season))}</div>
      <div class="cc-gala-line">${esc(L().ccGalaOpenLine(y.div, y.events))}</div>
      <div class="cc-gala-hint">${esc(L().ccGalaOpenHint)}</div>
    </div>`;
  if(i===1) return `<h4>${L().ccGalaYearH}</h4>
    <div class="cc-gala-nums">
      ${ccGalaNum(ccNum(y.events)+ccGalaDelta(y.events, y.prev && y.prev.events), L().ccGalaEvents)}
      ${ccGalaNum(ccNum(y.wins)+ccGalaDelta(y.wins, y.prev && y.prev.wins), L().ccGalaWins)}
      ${ccGalaNum(ccNum(y.elims)+ccGalaDelta(y.elims, y.prev && y.prev.elims), L().ccGalaElims)}
      ${ccGalaNum(ccMoney(y.prize)+ccGalaDelta(y.prize, y.prev && y.prev.prize, true), L().ccGalaPrize)}
      ${ccGalaNum(ccNum(y.pr), L().ccGalaPr)}
      ${ccGalaNum(y.best ? '#'+y.best.place : '-', L().ccGalaBest)}
    </div>
    <div class="cc-gala-row"><em>${L().ccGalaOvr}</em><b>${y.ovr} <i>${
      esc(L().ccGalaOvrUp(y.grew))}</i></b></div>
    ${y.prev ? `<div class="cc-gala-hint">${esc(L().ccGalaVsPrev)}</div>` : ''}`;
  if(i===2) return ccGalaYouSlide();
  if(i===3) return `<h4>${L().ccGalaRunsH}</h4>
    ${y.runs.length ? y.runs.map(r=>`<div class="cc-gala-row"><em>${esc(careerRunLabel(r))}</em><b>${
        L().ccBoardPlace(r.place, r.of)}${r.prize ? ' · '+ccMoney(r.prize) : ''}</b></div>`).join('')
      : `<div class="cc-gala-hint">${L().ccGalaRunsNone}</div>`}
    <h4 class="cc-gala-h2">${L().ccGalaAwardsH}</h4>
    ${(y.months.length || (y.goty && y.goty.you))
      ? (y.goty && y.goty.you ? `<div class="cc-gala-row me"><em>${
            esc(L().ccGalaGotyYou)}</em><b>${ccAwIcon('goty')}</b></div>` : '')+
        y.months.map(m=>`<div class="cc-gala-row"><em>${
            esc(L().ccGalaMonthWon(ccMonthName(m.key)))}</em><b>${ccAwIcon('month')}</b></div>`).join('')
      : `<div class="cc-gala-hint">${L().ccGalaAwardsNone}</div>`}`;
  // Номинации сезона — перед игроком года (careerSeasonCatsHTML).
  if(i===4) return careerSeasonCatsHTML() || `<div class="cc-gala-hint">${L().ccGalaAwardsNone}</div>`;
  // Последним — игрок года: ровно та же плитка, что стоит на экране конца
  // сезона, чтобы церемония и хаб не разошлись в числах.
  return careerSeasonAwardHTML() ||
    `<div class="cc-gala-hint">${L().ccGalaAwardsNone}</div>`;
}
function ccGalaDraw(){
  const el=document.getElementById('ccGalaModal');
  if(!el) return;
  const y=ccGalaYear(), i=CC_GALA_STEP, last=i>=CC_GALA_SLIDES-1;
  let dots='';
  for(let k=0;k<CC_GALA_SLIDES;k++) dots+=`<i class="${k===i?'on':''}"></i>`;
  el.innerHTML=`<div class="cc-gala" role="dialog" aria-modal="true">
    <div class="cc-gala-body">
      <div class="cc-gala-head">
        <div><div class="cc-gala-tag">${L().ccGalaDaySub}</div>
          <h3>${esc(L().ccGalaTitle(y.season))}</h3></div>
      </div>
      <div class="cc-gala-slide">${ccGalaSlide(i, y)}</div>
      <div class="cc-gala-dots">${dots}</div>
      <div class="cc-gala-cta">
        ${i>0 ? `<button class="cstrip-btn cstrip-btn-code" onclick="ccGalaGo(-1)">${L().ccGalaBack}</button>` : ''}
        ${i>=1 ? `<button class="cstrip-btn cstrip-btn-code" onclick="ccGalaShare(${y.season})">${L().ccGalaShare}</button>` : ''}
        ${last ? `<button class="cstrip-btn cstrip-btn-go" onclick="ccGalaFinish()">${L().ccNewSeason}</button>`
               : `<button class="cstrip-btn cstrip-btn-go" onclick="ccGalaGo(1)">${L().ccGalaNext}</button>`}
        <button class="cstrip-btn cstrip-btn-code" onclick="ccGalaClose()">${L().ccGalaSkip}</button>
      </div>
    </div>
    <div class="cc-gala-art" style="background-image:url(${CAREER_EV_ART.gala})"></div>
  </div>`;
}
function ccGalaOpen(){
  if(!CAREER || !CAREER.career) return;
  CC_GALA_STEP=0;
  let el=document.getElementById('ccGalaModal');
  if(!el){
    el=document.createElement('div');
    el.id='ccGalaModal';
    el.className='cc-gala-wrap';
    document.body.appendChild(el);
  }
  ccGalaDraw();
}
function ccGalaGo(n){
  CC_GALA_STEP=Math.max(0, Math.min(CC_GALA_SLIDES-1, CC_GALA_STEP+n));
  ccGalaDraw();
}
function ccGalaClose(){
  const el=document.getElementById('ccGalaModal');
  if(el) el.remove();
}
// Церемония кончается тем же, чем кончался экран конца сезона: новым годом.
// Только если сезон ещё не перевёрнут: вдвоём напарник мог уже начать новый, и кнопка церемонии перескакивала главу.
function ccGalaFinish(){ ccGalaClose(); if(CAREER && CAREER.career && CAREER.career.seasonOver) careerNewSeason(); }
function careerSeasonBoardHTML(){
  const cr=CAREER.career;
  const rows=careerBigRuns(cr.season);
  return `<div class="ch-tile cc-board">
    <h4>${L().ccBoardTitle}</h4>
    ${rows.length ? rows.map(r=>`<div class="ch-row"><em>${esc(careerRunLabel(r))}</em><b>${
        L().ccBoardPlace(r.place, r.of)}${r.prize ? ' · '+ccMoney(r.prize) : ''}</b></div>`).join('')
      : `<div class="ch-empty">${L().ccBoardNone}</div>`}
  </div>`;
}
/* What a career amounted to, read out of what it recorded rather than tallied
   as it went — every line below is already in the save, which is why there is
   no honours list kept anywhere: the log is the honours list. */
function careerSummary(){
  const cr=CAREER.career, pl=CAREER.player;
  const log=cr.log||[];
  const by=k=>log.filter(r=>r.kind===k);
  const best=rows=>rows.length ? Math.min.apply(null, rows.map(r=>r.place)) : null;
  const peak=log.reduce((m,r)=>Math.max(m, r.ovr||0), pl.ovr||0);
  const topDiv=log.reduce((m,r)=>Math.min(m, r.div||5), cr.division||5);
  const majors=by('major').filter(r=>r.stage==='final');
  const wf=by('final');
  return {
    seasons: cr.season,
    age: (CAREER.retired && CAREER.retired.age) || ccPlayerAge(),
    peak: Math.round(peak),
    topDiv: topDiv,
    events: log.length,
    wins: log.reduce((n,r)=>n+(r.wins||0), 0),
    earnings: cr.earnings||0,
    wages: cr.wages||0,
    reach: cr.reach||0,
    bestWf: best(wf),
    wfPlayed: wf.length,
    bestMajor: best(majors),
    majorsPlayed: majors.length,
    // The LANs, which the last screen used to leave out entirely. His report,
    // 20 August. Read the same way everything else here is: off the log.
    bestSummit: best(by('summit').filter(r=>r.stage==='final')),
    summitsPlayed: by('summit').filter(r=>r.stage==='final').length,
    bestGlobals: best(by('globals')),
    globalsPlayed: by('globals').length,
    bestGclc: best(by('gclc').filter(r=>r.stage==='final')),
    seats: (cr.ewc||[]).length,
    paris: best(by('rc').filter(r=>r.stage==='final')),
    orgs: (cr.orgs||[]).slice(),
    club: CAREER.org ? CAREER.org.name : null,
    /* What a career leaves behind that a rating cannot say.

       The rating is where you finished; these are the three things a scene
       actually repeats about somebody afterwards. Where you stood on Europe's
       Power Rankings at your best, because that is the public number this sport
       is ranked by. Where the money put you on the all-time board, because that
       is the number a player puts in their own bio. And whether anybody wanted
       to play with you, which is the one the rating is silent about and the one
       a career spends every interview deciding.

       All three are read off tallies the mode already keeps rather than tracked
       from here - a summary should not be the thing that measures. */
    pr: (()=>{ const rows=careerPrRows(); const me=rows.findIndex(r=>r.you);
               return me<0 ? null : {rank:me+1, of:rows.length, pr:rows[me].pr}; })(),
    money: (()=>{ const rows=careerMoneyRows('all'); const me=rows.findIndex(r=>r.you);
                  return me<0 ? null : {rank:me+1, of:rows.length}; })(),
    rep: careerRep(),
    repKey: careerRepKey(),
    streamed: cr.streamed||0,
    rent: cr.rent||0
  };
}

/* GC Last Chance, ~16,900 EU duos in Round 1. From Tracker windows:
   Round 1  3 and 7 Aug   10 matches, kill 1, top 1,000 through
   Round 2  4 and 8 Aug    9 matches, kill 1, top 300 through
   Round 3  5 and 9 Aug   11 matches, kill 2, top 25 through
   Finals   14 Aug         6 matches, kill 4, 50 teams
   Placement ladder is FNCS 2026 (win 65), purse GCLC_PRIZES_BY_REGION ($40,000 1st,
   $400 at 50th). Epic lets the PR top 2,000 skip Round 1; we have no PR, so Div 1
   starts at Round 2. Two qualifiers, the second restarts from Round 1. */
const CC_GCLC=[
  {day:'2026-08-03', q:1, round:1}, {day:'2026-08-04', q:1, round:2},
  {day:'2026-08-05', q:1, round:3},
  {day:'2026-08-07', q:2, round:1}, {day:'2026-08-08', q:2, round:2},
  {day:'2026-08-09', q:2, round:3},
  {day:'2026-08-14', q:0, round:0}          // the Finals
];
// Rounds run in a career-sized lobby the way every other stage does; only the
// last cut is a real count, because 25 of 299 and 25 of 150 mean the same thing
// — the twenty-five who go, and two qualifiers of them fill the Final.
const CC_GCLC_ROUND={
  1:{games:10, kill:1, cut:CAREER_CUP_CUT},
  2:{games:9,  kill:1, cut:CAREER_CUP_CUT},
  3:{games:11, kill:2, cut:25}
};
const CC_GCLC_FINAL={games:6, kill:4, teams:50};
function careerGclcOn(iso){
  const row=CC_GCLC.find(x=>x.day===iso);
  if(!row) return null;
  return {q:row.q, round:row.round, final:row.q===0,
          label: row.q===0 ? L().ccGcFinal : L().ccGcRound(row.q, row.round)};
}
/* Where a career is in it.

   cr.gclc holds the qualifier it is in and the deepest round cleared. A new
   qualifier resets that: the second one is not a continuation of the first, it
   is the same three rounds again for whoever did not get through. A place in the
   Final, once earned, survives both. */
function careerGclcCan(ev){
  if(!ev) return false;
  const cr=CAREER.career, g=cr.gclc||{};
  if(ev.final) return !!g.through;
  if(g.through) return false;                       // already in, nothing to play
  const here = g.q===ev.q ? (g.round||0) : 0;
  if(here>=ev.round) return false;                  // this round is played
  if(ev.round===1) return cr.division!==1;          // Division 1 starts at Round 2
  if(ev.round===2 && here===0) return cr.division===1;
  return here===ev.round-1;
}
// The Last Chance is a regional event too, so it is paid on the career's own
// region rather than on Europe's. See careerPrizeRegion.
function gclcPrize(place){
  const t=(typeof GCLC_PRIZES_BY_REGION!=='undefined' && ccRegionTable(GCLC_PRIZES_BY_REGION)) || null;
  return t ? (t[String(place)]||0) : 0;
}

/* Reload Championship, Paris. Where the twelve EU seats from four Reload cups (three each, cr.ewc) go.
   Format off Liquipedia (docs/superpowers/specs/2026-08-13-ewc-reload-elite-series-design.md):
     Group Stage  40 teams, two groups of 20, 10 maps; top 7 to Finals, 8-17 to Survival, bottom 3 out.
     Survival     the 20 who dropped, 10 maps, 6 through.
     Finals       20 teams, match point: first past 350 who then wins a game; 15 games max.
   Scoring isn't published, so it uses R_PLACEMENT with the Heats' 3 per kill. The real event alternates two islands
   between games; here a run keeps one. */
// The day the Championship opens, so a seat won in February can say what it is
// a seat to rather than sitting in the save until August.
const CC_RC_DAY='2026-08-19';
const CC_RC_GROUP={teams:20, games:10, direct:7, drop:17};
const CC_RC_SURV ={teams:20, games:10, cut:6};
const CC_RC_FINAL={teams:20, games:15, line:350};
const CC_RC_KILL=3;
/* Чем состав опознаётся между этапами одного турнира.

   Не индексом в броске: у разных этапов броски разные, а команда переезжает из
   одного в другой. Ники состава, в нижнем регистре и по алфавиту, — это и есть
   «вот эти двое», и переживает и пересборку объекта, и перезагрузку сейва.
   См. ccRcField и ccMajorFinalRoom. */
function ccSeatKey(t){
  return ((t && (t.squad||t._cards||t.cards)) || [])
    .map(c=>c && c.handle).filter(Boolean)
    .map(h=>String(h).toLowerCase()).sort().join('+');
}
/* Кто сидит в лобби этапа Парижа.
   Париж один турнир в три этапа, а careerSeed сеется календарной неделей, так что careerCupField давал всем трём дням одну двадцатку, и вылетевшие сидели в финале.
   Теперь три воспроизводимых броска, помним только ключи составов (ccSeatKey): A групповой этап, B добор на сёрвайвл, C добор в финал.
   Из A на сёрвайвл 8-17, в финал 1-7, из сёрвайвла в финал топ-6, остальное из B и C. Выбывший не возвращается.
   Добор фиксирован (двадцатка), чтобы B повторялся и финал узнавал прошедших по ключу. Старый сейв без seats играет как раньше.
   Кого записывать, решает раннер (runCareerReloadChampionship). */
/* Сорок пар парижского ЛАНа 2026 года в порядке итогового места.
   Источник — liquipedia.net/fortnite/Reload_Elite_Series/2026 — Esports World Cup 2026, Paris, 19-22 авг.
   По регионам: EU 12, BR 4, NAW 4, ME 4, NAC 8, ASIA 4, OCE 4. */
const RC_TEAMS_2026=[
{p:"1",r:"EU",c:260000,d:["vic0","Malibuca"]},
{p:"2",r:"EU",c:150000,d:["Momsy","SkyJump"]},
{p:"3",r:"EU",c:90000,d:["shxrk","t3eny"]},
{p:"4",r:"EU",c:60000,d:["SwizzY","Pixie"]},
{p:"5",r:"BR",c:45000,d:["Lewa","Romero"]},
{p:"6",r:"EU",c:35000,d:["charyy","Kami"]},
{p:"7",r:"NAW",c:30000,d:["VicterV","Khanada"]},
{p:"8",r:"EU",c:28000,d:["Demus","Darm"]},
{p:"9",r:"EU",c:26000,d:["Faded","Kaan"]},
{p:"10",r:"ME",c:24000,d:["SaLva","Yassen"]},
{p:"11",r:"EU",c:22000,d:["Sky","Scroll"]},
{p:"12",r:"NAC",c:20000,d:["Peterbot","Pollo"]},
{p:"13",r:"EU",c:18000,d:["Tjino","PabloWingu"]},
{p:"14",r:"NAC",c:16000,d:["josh","Eomzo"]},
{p:"15",r:"ASIA",c:15000,d:["Minipiyo","FuuKun"]},
{p:"16",r:"EU",c:14000,d:["Nociff","Izzi"]},
{p:"17",r:"NAC",c:13000,d:["Muz","Sphinx"]},
{p:"18",r:"NAC",c:12000,d:["Cold","Rapid"]},
{p:"19",r:"OCE",c:11000,d:["Goofy","ZDog"]},
{p:"20",r:"NAC",c:10000,d:["Acorn","Boltz"]},
{p:"21",r:"ASIA",c:9500,d:["Koyota","yuma"]},
{p:"22",r:"NAC",c:9000,d:["Bugha","Braydz"]},
{p:"23",r:"BR",c:8500,d:["Night","916Gon"]},
{p:"24",r:"EU",c:8000,d:["Cringe","Volko"]},
{p:"25",r:"OCE",c:7500,d:["Oatley","Spookz"]},
{p:"26",r:"ASIA",c:7000,d:["Mofu","tomat"]},
{p:"27",r:"ME",c:6500,d:["Mshary","5aald"]},
{p:"28",r:"ME",c:6000,d:["Moda","Rew"]},
{p:"29",r:"OCE",c:5500,d:["Vazen","Anon"]},
{p:"30",r:"EU",c:5000,d:["panzer","Japko"]},
{p:"31",r:"BR",c:4500,d:["Edson","Phzin"]},
{p:"32",r:"NAC",c:4000,d:["Shadow","Vergo"]},
{p:"33",r:"NAC",c:3500,d:["Aoxy","Jojofishy"]},
{p:"34",r:"NAW",c:3000,d:["phoenix","Retro"]},
{p:"35-36",r:"ASIA",c:2500,d:["Rainy","Nalu"]},
{p:"35-36",r:"NAW",c:2500,d:["Inact","Salko"]},
{p:"37-38",r:"NAW",c:2250,d:["EpikWhale","PXMP"]},
{p:"37-38",r:"BR",c:2250,d:["axadasz","Seven"]},
{p:"39-40",r:"OCE",c:2000,d:["alex","Wreckless"]},
{p:"39-40",r:"ME",c:2000,d:["Henchman","Snowvaks"]}
];

/* Настоящее поле Парижа: те же сорок пар, что приехали на Esports World Cup.

   Отзыв игрока: ЛАН собирался людьми его же региона, а в жизни это
   один мировой турнир на сорок дуо — двенадцать европейских, восемь из NA
   Central, по четыре из остальных пяти регионов. Пары садятся тем же
   ccLanSeats, что и Саммит с Глобалами, поэтому регион приезжает вместе с парой
   и колонка «Регион» в таблице показывает её собственный, а не регион первой
   карточки.

   Кого нет в карточках — того пропускаем молча: список настоящий, а набор
   карточек своего года, и пара из чужого года просто не находится. Если
   осталось меньше половины, поле строится по-старому броском. */
/* Кэш — по сезону, размеру состава и своему составу (Notion 12.10, Kaizen: «trios and duos in the same
   tournament… still happens sometimes but for reload»). Был один на страницу: зал, собранный в одном сезоне
   (дуо), садился и в трио-сезон, а свой напарник прошлого сезона мог сидеть в зале чужой парой. */
let CC_RC_REAL=null, CC_RC_REAL_KEY='';
function ccRcRealTeams(seated){
  if(ccNowYear()!==2026) return null;
  const cr=(typeof CAREER!=='undefined' && CAREER && CAREER.career) || {};
  const key=[cr.season||0, careerSquadSize(), Array.from(seated||[]).sort().join('+')].join('|');
  if(CC_RC_REAL_KEY===key) return CC_RC_REAL;
  /* Его слово 12.10: «все турниры от симуляции». Из сорока настоящих пар берутся только КВОТЫ регионов
     (EU 12, NAC 8, по четыре остальным) — сами пары садит симулированный отбор Reload каждого региона
     (ccLanSimSeats 'rc'), в порядке силы, как посев. Настоящий список — запас вне карьеры. */
  const quota={};
  RC_TEAMS_2026.forEach(t=>{ quota[t.r]=(quota[t.r]||0)+1; });
  const room=new Set(seated||[]);
  let built=[];
  const mine=(typeof CAREER!=='undefined' && CAREER && CAREER.career) ? [careerCard()].concat(careerMates()).filter(Boolean) : [];
  Object.keys(quota).forEach(reg=>{
    const got=ccLanSimSeats(reg, ccTeams(quota[reg]), mine, room, 'rc');
    if(got) built=built.concat(got);
  });
  built.sort((x,y)=>(y.pow||0)-(x.pow||0));
  if(built.length<RC_TEAMS_2026.length/2){
    const rows=RC_TEAMS_2026.map(t=>({duo:t.d, reg:t.r}));
    built=ccLanSeats(rows, rows.length, null, new Set(seated||[]));
  }
  CC_RC_REAL=(built.length>=RC_TEAMS_2026.length/2) ? built : null;
  CC_RC_REAL_KEY=key;
  return CC_RC_REAL;
}
function ccRcField(cr, worldCr, drafted, stage, teams){
  const mine=new Set((drafted||[]).map(c=>hKey(c)));
  const real=ccRcRealTeams(mine);
  /* Настоящие сорок пар идут в том порядке, в каком они закончили турнир:
     группа берёт верх списка, сёрвайвл и финал — следующих, мимо уже взятых.
     Без списка (не 2026-й или карточек не хватило) — прежний бросок. */
  const draw=(n, salt, skip)=>{
    if(real){
      const used=new Set((skip||[]).map(c=>hKey(c)));
      return real.filter(t=>!((t.squad||[]).some(c=>used.has(hKey(c))))).slice(0, n);
    }
    return ccAsWorld(()=>careerCupField(worldCr,
      drafted.concat(skip||[]), n, salt, false, CC_FIELD_SHARP.globals));
  };
  const cards=t=>(t && (t.squad||t._cards||t.cards)) || [];
  // Соло-год: в группе 40 одиночек вместо 20 пар (ccTeams), иначе к двадцати ботам добавлялся ты, и выходил 21.
  const A=draw(Math.max(CC_RC_GROUP.teams, ccTeams(CC_RC_GROUP.teams)), null, null);
  /* Групповой этап играем в комнате этого сезона, обрезанной до размера этапа.
     В трио ccTeams(20) = 13, а сюда приходило 20 команд, движок резал их на два
     лобби, и каждая игра давала две победы (20 Виктори за 10 игр). Противоречило
     и правилу «ЛАН целиком в одно лобби». В дуо срез берёт все 19 строк.
     Остальные этапы уже считали по teams, см. need ниже. */
  if(stage==='group') return A.slice(0, Math.max(0, (teams||CC_RC_GROUP.teams)-1));
  const seenA=[].concat(...A.map(cards));
  const B=draw(Math.max(CC_RC_SURV.teams, ccTeams(CC_RC_SURV.teams)), 'rcSurv', seenA);
  const want=(cr.rc && cr.rc.seats && cr.rc.seats[stage]) || null;
  const room = stage==='survival' ? A : A.concat(B);
  /* B — вторая группа (полный прогон 9.10, check-career-rc-stages: в 2026-м из сорока настоящих пар мимо обеих групп
     не оставалось никого, и финал садился из двенадцати вместо двадцати). Её прямые путёвки едут в финал, остальные —
     на сёрвайвл, как на настоящем ЛАНе; свежий бросок — только добор сверху. */
  const bDirect=ccTeams(CC_RC_GROUP.direct);
  const fill = stage==='survival' ? B.slice(bDirect).concat(B.slice(0, bDirect))
             : B.slice(0, bDirect).concat(draw(CC_RC_FINAL.teams, 'rcFinal', seenA.concat([].concat(...B.map(cards)))), B.slice(bDirect));
  /* И здесь комната этого сезона, по той же причине, что этажом выше: без
     сохранённых мест keep — это весь бросок A, то есть двадцать дуо, а лобби
     сёрвайвла в трио тринадцать. need при этом уходил в ноль (двадцать уже
     больше тринадцати), добора не было, и вечер тихо разъезжался на два лобби
     с двумя победами за игру. Сторож — tools/check-career-rc-lobby.js. */
  const room1=Math.max(0, (teams||CC_RC_FINAL.teams)-1);
  const keep = (want ? room.filter(t=>want.indexOf(ccSeatKey(t))>=0) : A.slice()).slice(0, room1);
  const need=Math.max(0, room1-keep.length);
  return keep.concat(fill.filter(t=>keep.indexOf(t)<0).slice(0, need));
}
/* A Paris stage, counted in this season's teams.

   Twenty duos is a Reload lobby, and a Reload lobby is forty players — so a trio
   season plays the same room thirteen teams wide, with the group's two lines
   moving with it. ccScaleStage does the same job for the tables that name their
   field `field`; this one knows Paris's own names. `games` and `line` are not
   team counts and are left alone. */
function ccRcStage(st){
  if(!st) return st;
  const out=Object.assign({}, st);
  ['teams','direct','drop','cut'].forEach(k=>{ if(out[k]!=null) out[k]=ccTeams(out[k]); });
  return out;
}
/* The published purse, place by place. It steps: a thousand a place from
   fifteenth to twentieth, five hundred a place to thirtieth, then the tail. */
/* Награда MVP — сверх таблицы призовых: на настоящем ЛАНе 2026 года это
   $25 000 (Liquipedia, Reload Elite Series/2026). */
const CC_RC_MVP=25000;
function rcPrize(place){
  const top=[260000,150000,90000,60000,45000,35000,30000,28000,26000,24000,
             22000,20000,18000,16000,15000];
  if(place<=15) return top[place-1]||0;
  if(place<=20) return 15000-(place-15)*1000;
  if(place<=30) return 10000-(place-20)*500;
  if(place<=34) return [4500,4000,3500,3000][place-31];
  if(place<=36) return 2500;
  if(place<=38) return 2250;
  if(place<=40) return 2000;
  return 0;
}
function rcPoints(place){
  const t=R_PLACEMENT.r4;
  return place<=t.length ? t[place-1] : 0;
}
const CC_RC_ORDER=['group','survival','final'];
// Which day of the Paris block this is. The row is four days end to end; the
// tournament is three stages, so they sit on the first three.
function careerRcOn(iso){
  const e=(careerYearDays().get(iso)||[]).find(x=>x.kind==='gc' &&
        String(x.id||'')==='ReloadChampionshipParis');
  if(!e) return null;
  const row=ccYearRows().find(r=>r[2]==='ReloadChampionshipParis');
  if(!row) return null;
  let i=0;
  for(let d=row[0]; d<iso; d=ccAddDays(d,1)) i++;
  const stage=CC_RC_ORDER[i];
  return stage ? {stage:stage, label:e.label} : null;
}
function careerRcCan(ev){
  if(!ev) return false;
  const cr=CAREER.career, rc=cr.rc;
  if(ccGaveUp('rc')) return false;
  if(rc && CC_RC_ORDER.indexOf(rc.got)>=CC_RC_ORDER.indexOf(ev.stage)) return false;
  // A seat is the entry, and the Reload finals are the only place one comes from.
  // Место этого сезона, а не прошлогоднее. См. ccRelMySeats.
  if(ev.stage==='group')    return !!ccRelMySeats(cr).length;
  if(ev.stage==='survival') return !!(rc && rc.got==='group' && rc.dropped);
  if(ev.stage==='final')    return !!(rc && rc.ticket);
  return false;
}
/* Match point.

   Nothing in this app has ever scored a run that stops early. The games are
   simulated the ordinary way and the stopping rule is applied afterwards, off
   each team's own per-game log: walk the games in order, keep every team's
   running total, and the first game whose winner was already past the line ends
   the tournament. Every score is then read as it stood at that game, which is
   exactly the table Epic would have printed — the games after it were never
   played. */
function rcMatchPoint(teams, line){
  const n=Math.max.apply(null, teams.map(t=>(t.stageLog||[]).length));
  const run=new Map();
  teams.forEach(t=>run.set(t, 0));
  for(let g=0; g<n; g++){
    let champ=null;
    teams.forEach(t=>{
      const e=(t.stageLog||[])[g];
      if(!e) return;
      const before=run.get(t);
      run.set(t, before+(e.pts||0));
      if(e.place===1 && before>=line && !champ) champ=t;
    });
    if(champ){
      const at=g+1;
      return {champ:champ, games:at,
              score:teams.map(t=>({team:t,
                pts:(t.stageLog||[]).slice(0,at).reduce((s,e)=>s+(e.pts||0),0)}))};
    }
  }
  return {champ:null, games:n,
          score:teams.map(t=>({team:t, pts:t.stagePts||0}))};
}

/* The Major, numbers from Tracker's FNCS Major 2 Europe pages.
   Placement ladder as in the Weekly Final (VR 9, 2–5 +4, 6–25 +2, win = 65), except a Heats VR is 944:
   Epic's instant qualification, a heat win is 1,000.
     Play-In  D1 only, 22 matches, kill 2, 150 of 848 EU duos go to Heats.
     Heats    3 groups, 5 matches, kill 3, top 10 per group plus any game winner.
     LCQ      all divisions, two sessions cut to 50, then a 4-match Last Chance Lobby, each winner a ticket.
     Finals   50 duos, 12 matches, kill 4, PRIZE_TABLES.EU ($120,000 first).
   Play-In runs at full size (CC_MAJOR_PI_FIELD); later stages use the cup/Reload compression. */
const CC_MAJOR_HEAT_VR=944;
/* Число хитов по региону. У Epic три хита только в Европе и NA Central (150 из плей-ина, змейка, 45 дальше),
   в остальных пяти два хита по 50, отбор 100, проходят 46. Тот же раскол, что DEEP_MAJOR_REGIONS в majorFormat.
   Карьера играет свой хит, но поле собирает на все, иначе весь верх региона садился в её комнату. */
function ccMajorHeats(){ if(ccIs2025()) return 3; return DEEP_MAJOR_REGIONS.has(ccCareerRegion()) ? 3 : 2; }
/* Один хит: сколько в нём игр и сколько из него проходит.

   Глубокий регион — пять игр, топ-15 (игрок, 26 августа: «in duos its top
   15 not top 10»). Остальные — пять игр и топ-23, кроме одного места: в
   Мейджоре 1 у Океании, Азии и Ближнего Востока второй хит шёл ШЕСТЬ игр, и
   проходило из него двадцать четыре. Это не подгонка под сумму — у Ближнего
   Востока Ласт Ченс Мейджора 1 дал ровно трёх победителей, и 47+3 остаётся
   единственным, что складывается в полсотни мест финала. Числа те же, что у
   majorFormat: один турнир — одна сетка, где бы её ни спрашивали.

   Номер хита известен только после посева, поэтому по умолчанию отвечает за
   первый; свой номер раннер подставляет сам. См. runCareerMajor. */
function ccMajorHeat(n, heatNo){
  const reg=ccCareerRegion();
  // 2025: групповой этап — пять игр, топ-10 группы: пять побед (944 очка ставят их наверх) и пять по очкам; счёт уже в трио (raw).
  if(ccIs2025()) return {games:CC_MAJOR_STAGE_2025.group.games, cut:CC_MAJOR_STAGE_2025.group.cut, raw:true};
  if(DEEP_MAJOR_REGIONS.has(reg)) return {games:5, cut:15};
  const six = (n===1 && heatNo===2 &&
               (reg==='OCE' || reg==='ASIA' || reg==='ME'));
  return six ? {games:6, cut:24} : {games:5, cut:23};
}
// The FNCS 2026 ladder, shared by every stage that is not the Heats. wfPoints is
// this curve; it was written for the Weekly Final and the Major uses the same one.
function majorPoints(place){ return wfPoints(place); }
function majorHeatPoints(place){
  // 944 replaces the win step, and everything below it is unchanged: the Heats
  // pay their own Victory Royale on top of what second place is worth, which is
  // 56 in duos and 54 in trios. Read rather than typed, so the trio ladder does
  // not quietly pay a duo second place. See wfPoints.
  return place===1 ? CC_MAJOR_HEAT_VR+wfPoints(2) : wfPoints(place);
}
/* The Last Chance is the one stage of a Major that anybody can enter.

   His screenshot, 17 August: the career's Last Chance was running 150 teams over
   four games, which is the Play-In's room and the lobby's game count wearing the
   wrong label. Every division plays this one — that is what makes it the back
   door — so the room is the whole ladder the opens draw, the same 2,480 duos a
   Victory Cup seats, and the qualifier is eleven games to a top fifty. The four
   games belong to what comes after it: the Last Chance Lobby, where the fifty
   who came through play for the ticket and only a win is worth anything.

   Which is Epic's own shape, and the draft mode already had it written down —
   lcqQualTitle says "11 games, top 50 advance" on the other side of this file. */
const CC_MAJOR_LC_GAMES=11, CC_MAJOR_LC_LOBBY_GAMES=5;   // Liquipedia 2026: «Teams have 5 set-lobby games» (было 4; сверка 7.10)
/* ЛОББИ ПОСЛЕДНЕГО ШАНСА — КТО БЕРЁТ МЕСТА (сверка с Liquipedia 7.10). 2026, Мейджор 1: «Scoring based on placement and
   eliminations… The top 5 teams qualify» — по очкам; Мейджор 2 и 2025-й: «Each Victory Royale qualifies a team» /
   «the winner of each game qualifying» — победы, победитель уходит. Мир и твой неудачный LCQ играют лобби так же,
   а не отдают места топу таблицы LCQ, как было. */
function ccLcByPoints(ev){ return !ccIs2025() && !!ev && ev.n===1; }
function ccLcLobbyGames(){ return ccIs2025() ? CC_MAJOR_STAGE_2025.lclobby.games : CC_MAJOR_LC_LOBBY_GAMES; }
/* Сколько мест даёт лобби по очкам — «The top 5 teams qualify», ровно пять. Считалось остатком зала (финал минус
   записанные), а победители хитов проходят СВЕРХ отсечки, и остаток падал до одного: Notion 25.10, #2 лобби с 241
   очком — «пас де тикет». */
function ccLcLobbySeats(ev, need){ return ccLcByPoints(ev) ? ccTeams(ccLcLobbyGames()) : need; }
function ccLcLobbySim(lobby, ev, kill){
  lobby.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
  if(ccLcByPoints(ev)) simulateGames(lobby, ccLcLobbyGames(), majorPoints, kill);
  else simulateGamesStopOnWin(lobby, ccLcLobbyGames(), victoryR2Points, 0);
}
function ccLcLobbySort(lobby, ev){
  return lobby.slice().sort(ccLcByPoints(ev) ? ((a,b)=>(b.stagePts||0)-(a.stagePts||0) || (b.stageElims||0)-(a.stageElims||0))
                                             : ((a,b)=>(b.wins||0)-(a.wins||0) || (b.stagePts||0)-(a.stagePts||0)));
}
function ccLcLobbyPick(lobby, need, ev){ return ccLcLobbySort(lobby, ev).slice(0, need); }
/* Плей-Ин в настоящей комнате: по Tracker в EU 848 команд, 22 матча, килл за 2, в Хиты 150. Сжатая версия (150
   с отсечкой 50) по доле была даже мягче (33% против 17.7%), но число на экране не совпадало с Epic.
   Цена: 848 команд собираются за 92 мс, 22 матча за 1.3 с (сжатая 0.4 с); Ласт Чанс уже крутит 2480 за 3.8 с.
   Хиты не трогаем: у Epic три группы по 50 с топ-10 из каждой, 50 с отсечкой 10 это одна группа, в которой играет
   карьера. */
/* Комната Плей-Ина: только те, кто в дивизионе 1, в Д1 ничего не выдумывается (см. ccD1FillOvr).
   С числами Epic (150 из 848) 641 место занимали придуманные: ниже по карточкам (77.6 против 82), но с полным ролевым
   бонусом от ccSquadCastRoles (4 против 1.57), то есть сильнее настоящих. Комната читается, как у Ласт Чанса
   (careerLadderEntrants).
   Отсечка = число мест в хитах, не доля: 17.7% от 300 пар дают 53 при одной комнате хитов на 50, и трое «проходят»,
   но не садятся. Обе стадии идут через ccScaleStage, в трио уменьшаются вместе.
   У Epic Плей-Ин раздаёт три комнаты хитов по 50, здесь одна. */
function careerD1Entrants(){
  const n=(careerPools().duos||[]).length;
  return Math.max(2, n+1);
}
const CC_MAJOR_STAGE={
  playin:{games:22, kill:2, pts:majorPoints,
          /* Комната Плей-Ина — не только записанные дуо дивизиона 1.

             Их сто семьдесят четыре, и когда отсечка стала честной (сто
             пятьдесят во все три хита), проходить стало 86% комнаты — это уже
             не отбор. У Epic Плей-Ин открыт всему региону, и сто пятьдесят
             выходят из тысяч. Поэтому комната достраивается лестницей до трёх
             хитовых полей на каждое место в хитах: реальные имена сидят
             первыми (careerCupField сажает их до лестницы), дальше — ладдер.
             Проход возвращается к трети, как и был до правки хитов.

             Цена замерена: 174 команды — 0.37 с, 520 — 0.65 с на десктопе,
             и Плей-Ин всё равно считается без показа. */
          get field(){ return Math.max(careerD1Entrants(),
                                       CC_MAJOR_STAGE.heats.field*ccMajorHeats()*3); },
          /* Плей-Ин отбирает во ВСЕ хиты, а не в один.

             Мой же регресс от 25 августа: комната хитов стала одной из трёх
             (см. ccMajorHeats — правка «в первом хите всегда все сильные»),
             а отсечка Плей-Ина по-прежнему читала размер ОДНОЙ комнаты и
             пускала дальше пятьдесят вместо ста пятидесяти. Игрок поймал
             это в ту же ночь: «плей ин мажора квал в хиты топ 50 почему-то
             вместо топ 150 остался». У Epic из плей-ина выходят сто пятьдесят
             и делятся змейкой на три хита — ровно это здесь и написано. */
          /* Считается в командах СЕЗОНА, а не в дуо, — отсюда cutScaled.

             Порядок округления решал одну команду: ccTeams(50×3) — это сто, а
             мест в трёх трио-хитах 3×ccTeams(50) = девяносто девять. Сотый
             проходил в этап, где для него не было стула. Правило записано
             строкой выше и в playInSeats режима драфта одинаково: плей-ин
             отбирает столько, сколько хиты могут посадить. */
          cutScaled:true,
          get cut(){ return ccTeams(CC_MAJOR_STAGE.heats.field)*ccMajorHeats(); }},
  /* Из хита проходят 15, не 10: так в драфте (majorFormat, Европа, три хита,
     cut:15), и «45 с хитов + 5 с LCQ» сходится только с 15. В трио ccTeams даёт
     15x2/3 = 10. 15 это отсечка глубокого региона, у остальных пяти два хита по 23
     (ccMajorHeat). Здесь геттеры, потому что регион известен только в рантайме;
     они про первый хит, номер своего раннер подставляет после посева. */
  heats :{kill:3, field:50, pts:majorHeatPoints,
          get games(){ return ccMajorHeat(0, 1).games; },
          get cut(){ return ccMajorHeat(0, 1).cut; }},
  // Read rather than typed, because the ladder's size is read rather than typed.
  lcq   :{games:CC_MAJOR_LC_GAMES, kill:2, cut:CAREER_CUP_CUT, pts:majorPoints,
          get field(){ return careerLadderEntrants(); }},
  final :{games:12, kill:4, field:50,               cut:0,              pts:majorPoints}
};
const CC_MAJOR_DAY={PlayIn:'playin', Heats:'heats', LCQ:'lcq', LCLobby:'lclobby', Final:'final'};
// Лобби последнего шанса — своя стадия только в 2025-м; в 2026-м оно идёт в день LCQ.
const CC_MAJOR_ORDER=['playin','heats','lcq','lclobby','final'];
/* Числа стадии — по году. 2025-й: плей-ин двадцать игр (два дня по десять,
   одной сессией — упрощение), отсечка 99 трио как есть; LCQ десять игр и 33
   трио; лобби три игры, победа — билет; финал двенадцать игр. Отсечки 2025-го
   уже в трио, поэтому cutScaled — чтобы ccScaleStage их не резал ещё раз. */
// Showdown 2025 — Мейджоры с номером 4 и выше (см. careerMajorOn).
function ccMajorIsShowdown(n){ return ccIs2025() && n>=4; }
// Лобби последнего шанса своим днём — только у настоящих Мейджоров 2025-го.
function ccMajLc2025(ev){ return ccIs2025() && !!ev && !ccMajorIsShowdown(ev.n); }
function ccMajorStageSpec(stage, n){
  const base=CC_MAJOR_STAGE[stage] || (stage==='lclobby' ? CC_MAJOR_STAGE.lcq : null);
  if(!ccIs2025()) return base;
  if(ccMajorIsShowdown(n)){
    // Раунд 1 — дивизионы 1–2 региона, десять игр, топ-33; раунд 2 — шесть игр на 33 трио.
    // Поля — в дуо-счёте, как вся таблица: ccScaleStage переведёт 450 → 300 и 50 → 33 трио.
    if(stage==='lcq')   return Object.assign({}, base, {games:10, cut:33, cutScaled:true, field:450});
    if(stage==='final') return Object.assign({}, base, {games:6, field:50});
    return base;
  }
  const y=CC_MAJOR_STAGE_2025;
  if(stage==='playin') return Object.assign({}, base, {games:y.playin.games*y.playin.days, cut:y.playin.cut, cutScaled:true});
  if(stage==='lcq')    return Object.assign({}, base, {games:y.lcq.games, cut:y.lcq.cut, cutScaled:true});
  if(stage==='lclobby')return {games:y.lclobby.games, kill:0, pts:victoryR2Points, cut:0, field:y.lcq.cut, cutScaled:true};
  if(stage==='final')  return Object.assign({}, base, {games:y.final.games*y.final.days});
  return base;
}
// Комната лобби последнего шанса 2025-го — те, кто прошёл вчерашний LCQ.
function ccMajorLcRoom(you, ev){
  const cr=CAREER.career, lc=cr.majorLc;
  if(!lc || lc.n!==ev.n || lc.season!==cr.season) return [you];
  const room=lc.rows.map(r=>r==='you' ? you : ccMajorTeamFrom(r)).filter(Boolean);
  /* Своя строка в записи могла не лечь (гонка 2025, 20.10: лобби 13.02 упало «you.stageLog is not iterable» —
     своей команды в комнате не было, и прогон её не завёл). Сам вечер открыт тем, кто прошёл, — значит, свой там
     есть: садится последним, как в хите (см. ccMajorRoom). */
  if(room.indexOf(you)<0){ if(room.length) room[room.length-1]=you; else room.push(you); }
  return room;
}

/* ---- Мейджор 2024-го: своя машина --------------------------------------------
   Формат — см. CAREER_YEAR_2024. Состояние живёт в cr.major24 (по номеру Мейджора и
   сезону): got — сыгранные дни; q[1|2].r1/r2 — прошедшие раунды квалификатора
   (строки посева, 'you' — свой состав); series — очки серии по ключу состава,
   seriesRows — как его посадить; upper/lower — сетки полуфинала (rows — комната
   первого дня, r1/r2/r3 — прошедшие каждого дня, tickets — победители матчей
   верхней сетки, rest — не прошедшие третьего дня); bracket — своя сетка;
   ticket — место в финале. Своя сетка играется вживую, чужая — тем же вечером
   молча (ccM24Settle), и то, чего игрок не доиграл, досчитывается перед финалом. */
/* ---- СЧЁТ 2024-го — ТАБЛИЦА EPIC ТОГО ГОДА ---------------------------------

   FNCS 2024: Victory Royale 65, второе 56, третье 52, пятое 44, двадцать пятое
   2, и четыре очка за элим. Это ровно та лестница, что лежит в PLAYIN_STEPS
   («9 + 4×4 + 2×20 = 65»), поэтому она читается оттуда, а не переписывается
   рядом третьей копией. До этой правки Мейджор 2024-го считался таблицей
   2026-го (majorPoints → wfPoints) и платил за элим два на квалификаторах.

   Второй день — ×1.5 на всё: VR 100, второе 84, третье 78, элим 6. Их и
   печатал лидерборд Форт-Уэрта. Какая игра идёт, знает только сам прогон,
   поэтому день ставит dropEachGame (он зовётся раз на игру), а читают его
   ccM24PointsGf и ccM24KillGf. */
const CC_M24_KILL=4, CC_M24_DAY2=1.5, CC_M24_DAY1_GAMES=6;
/* Квалификаторы 2024-го — два за элим: правила Epic S28–S30 FNCS_Major*_Qualifier1/2 (kill 2),
   а полуфиналы и Гранд-финалы — четыре (аудит 29.09 по CC_CUP_SCORE). Лестница мест та же. */
const CC_M24_KILL_Q=2;
let CC_M24_GAME=0;
function ccM24Day(){ return (CC_M24_GAME>CC_M24_DAY1_GAMES) ? CC_M24_DAY2 : 1; }
/* Таблица ДУО, а не текущего состава: 2024-й играется в дуо весь год, и
   спрашивать про это ambient squadSize незачем — он в этот момент может быть
   ещё сквадным (по умолчанию страницы), и тогда второе место читалось бы 42
   вместо 56. playInPointsForPlace как раз через squadSize и ходит. */
function ccM24Points(place){
  const t=PLAYIN_TABLE[2];
  return place<=t.length ? t[place-1] : 0;
}
function ccM24PointsGf(place){
  const d=ccM24Day();
  if(d===1) return ccM24Points(place);
  /* Второй день — ×1.5 на всё: второе 56→84, третье 52→78, элим 4→6. Кроме
     победы: 65×1.5 это 97.5, а лидерборд Форт-Уэрта печатал ровную сотню —
     Epic округлил её вверх, и бонус за Victory Royale во второй день выходит
     16 вместо девяти. */
  return (place===1) ? 100 : Math.round(ccM24Points(place)*d);
}
function ccM24KillGf(){ return CC_M24_KILL*ccM24Day(); }
/* Настоящее поле открытого квалификатора — та же измеренная лестница региона,
   которой читаются опены круга Reload (CC_LADDER_TRUE, 9 766 дуо). Карьера
   играет её ВЫБОРКОЙ (careerLadderEntrants), поэтому отсечка переводится в
   комнату, а место читается в настоящем размере — правило и помощники те же,
   что у опенов: ccStretchTo. */
const CC_M24={
  /* Отсечки квалификатора: форма Epic, размер нашей лестницы. Epic 2024, 10 матчей в раунде:
     EU и NAC 2000 → 1000 → 250 (четвёртый за серию), малые регионы 1000 → 250 (третий за серию).
     Малые у нас так же, глубокие 1000 → 500 → 250: лестница 2 360 дуо (CC_CUP_ENTRANTS, ради скорости,
     5000 дуо считались 7.2 с), и 2000 первым шагом сделало бы первый раунд бесплатным. Кончаться обязано на 250:
     полуфинал настоящего размера, 50 дуо в верхней сетке и 200 в нижней. Последний раунд без отсечки, он за серию. */
  q:    {1:{games:10, cut:1000, open:true}, 2:{games:10, cut:250}, 3:{games:10, cut:0}},
  /* Верхняя сетка не выбивает, а роняет в нижнюю: «Duos that place 26th-50th in Upper Rounds 1 and 2 will be
     relegated to Lower Rounds 2 and 3».
     keep: сколько остаётся наверху под билетчиками; остальные падают в день нижней с номером +1.
     Каждый день верхней 50 команд (Liquipedia, 2024 Major 1 Europe: Upper Round 1-3 и Lower Round 3, team_number=50).
     Места 1-25 без билетчиков остаются, 26-50 падают, пустые места верхней добирают лучшие нижней (ccM24Promo).
     Финал: до 5 + до 5 билетов, топ-25 третьего дня верхней, топ-15 нижней. */
  upper:{1:{games:5, vr:true, cut:0, keep:25}, 2:{games:5, vr:true, cut:0, keep:25}, 3:{games:3, cut:25}},
  lower:{1:{games:10, cut:100}, 2:{games:6, cut:50}, 3:{games:3, cut:15}},
  final:{games:12, cut:0, field:50},
  qDeep:{2:{games:10, cut:500}, 3:{games:10, cut:250}},
  upperSize:50, lowerSize:200, vrSeats:5
};
/* Карьера, у которой неделя стоит на первом квалификаторе ЭТОГО Мейджора.

   Не сама карьера, а её копия: seedWeek читает только careerSeed, и ничего,
   кроме броска комнаты, от неё не зависит. Нет строки в календаре (чужой
   сейв) — возвращается карьера как есть, и вечер играется как играл. */
function ccM24OpenCr(cr, n){
  const row=ccYearRows().find(r=>r[2]==='Major'+n+'_2024_Q1R1');
  if(!row) return cr;
  return Object.assign({}, cr, {seedWeek: careerWeekIndex(row[0])});
}
// Третий день полуфинала у Мейджоров 2 и 3 — «3 hours and 5 games limit» (у Мейджора 1 — «3 games»). Сверка 7.10.
function ccM24SemiSpec(n, bracket, r){ const sp=CC_M24[bracket][r]; return (r===3 && n>=2) ? Object.assign({}, sp, {games:5}) : sp; }
/* Очки серии квалификатора 2024-го (Liquipedia, сверка 7.10): 625, 600, дальше минус 5 — до 21-го (505) таблица
   опубликована; ниже её нет, и дальше своя оценка: минус 1 за место (250-е — 276), чтобы весь зал различался. */
function ccM24SeriesPts(p){ return p<=1 ? 625 : p<=21 ? 600-5*(p-2) : Math.max(1, 505-(p-21)); }
function ccM24Deep(){ return DEEP_MAJOR_REGIONS.has(ccCareerRegion()); }
function ccM24Spec(ev){
  /* Третий вечер квалификатора — очки серии в любом регионе: у глубоких это
     четвёртый раунд по счёту (суббота играется двумя подряд), у остальных
     третий. Отсечки у него нет ни там, ни там. */
  if(ev.stage==='q'){
    const sp=(ev.r===2 && ccM24Deep()) ? CC_M24.qDeep[2] : CC_M24.q[ev.r];
    // Мейджор 3: последний раунд квала — «6 set-lobby games» (Liquipedia, сверка 7.10), у 1 и 2 — десять.
    return (ev.n===3 && sp && !sp.cut && !sp.open) ? Object.assign({}, sp, {games:6}) : sp;
  }
  if(ev.stage==='semi'){ const m=ccM24Of(ev.n); return ccM24SemiSpec(ev.n, (m && m.bracket) || 'upper', ev.r); }
  return CC_M24.final;
}
function ccM24Of(n){
  const cr=CAREER && CAREER.career; if(!cr) return null;
  const m=cr.major24;
  return (m && m.n===n && m.season===cr.season) ? m : null;
}
function ccM24State(n){
  const cr=CAREER.career;
  let m=ccM24Of(n);
  if(!m) m=cr.major24={n:n, season:cr.season, got:{}, q:{}, series:{}, seriesRows:{}, youKey:null,
                       upper:null, lower:null, bracket:null, built:false, ticket:false};
  return m;
}
// Первый день полуфинала этого Мейджора — до него сетки не строятся.
function ccM24SemiDay(n){ const row=ccYearRows().find(r=>r[2]==='Major'+n+'_2024_Semi1'); return row ? row[0] : null; }
/* Сетки — из таблицы серии: топ-50 в верхнюю, 51–250 в нижнюю. Строится раз, когда
   полуфинал уже на календаре (careerMajorCan спрашивает про будущие дни тоже). */
function ccM24Brackets(m){
  if(!m || m.built) return;
  const day=ccM24SemiDay(m.n);
  if(!day || careerToday()<day) return;
  /* В сетку садятся люди, а не строки таблицы. Правило Epic 2024: «qualified players for FNCS Semi-Finals can duo with any other qualified player (Upper with Upper, Lower with Lower)».
     Между квалификаторами состав можно сменить, и человек стоит в таблице серии дважды.
     Идём сверху: свободны оба, пара садится целой. Свободен один: половинка уходит в очередь и садится с ближайшей такой же.
     Без этого в полуфинале один и тот же игрок сидел дважды. */
  const taken=new Set(), rows=[];
  const hOf=c=>hKey((c && c.h) || c);
  let half=null;
  Object.keys(m.series).sort((a,b)=>m.series[b]-m.series[a]).forEach(k=>{
    const row=m.seriesRows[k]; if(!row) return;
    const faces=String(k).split('+').filter(Boolean);
    // Своя строка — свой состав, и он не пересобирается: карьера играет вдвоём.
    if(row==='you'){
      if(faces.some(h=>taken.has(h))) return;
      faces.forEach(h=>taken.add(h));
      rows.push('you');
      return;
    }
    const seats=Array.isArray(row) ? row : [row];
    const free=seats.filter(c=>!taken.has(hOf(c)));
    if(!free.length) return;
    free.forEach(c=>taken.add(hOf(c)));
    if(free.length===seats.length){ rows.push(row); return; }
    free.forEach(c=>{ if(half){ rows.push([half, c]); half=null; } else half=c; });
  });
  m.upper={rows:rows.slice(0, CC_M24.upperSize), tickets:[]};
  m.lower={rows:rows.slice(CC_M24.upperSize, CC_M24.upperSize+CC_M24.lowerSize)};
  const at=rows.indexOf('you');
  m.bracket = at<0 ? null : at<CC_M24.upperSize ? 'upper' : at<CC_M24.upperSize+CC_M24.lowerSize ? 'lower' : null;
  m.built=true;
}
function ccM24SeriesRank(m, key){
  const keys=Object.keys(m.series).sort((a,b)=>m.series[b]-m.series[a]);
  const at=keys.indexOf(key);
  return at<0 ? 0 : at+1;
}
const ccM24Rank=f=>f.slice().sort((a,b)=>(b.stagePts||0)-(a.stagePts||0) || (b.wins||0)-(a.wins||0) || (b.stageElims||0)-(a.stageElims||0));
/* Записать день сетки по его таблице. Верхняя сетка, дни 1–2: победители матчей —
   в билеты (не больше пяти, у Epic пять игр — пять билетов), остальные дальше;
   день 3 — топ-25. Нижняя: топ-100 → топ-50 → топ-15. */
function ccM24Write(m, bracket, r, ranked, you){
  const br=m[bracket]; if(!br) return;
  const row=t=>ccSeedRow(t, you, ccMajorSeatRow);
  const sp=ccM24SemiSpec(m.n, bracket, r);
  if(sp.vr){
    const winners=[]; const seen=new Set();
    ranked.forEach(t=>{ if((t.wins||0)>0 && winners.length<CC_M24.vrSeats && !seen.has(t)){ seen.add(t); winners.push(t); } });
    br.tickets=(br.tickets||[]).concat(winners.map(row));
    // Остаются места 1..keep по таблице дня (билетчики уходят в финал), ниже — вниз, днём позже.
    const keep=(sp.keep!=null) ? sp.keep : ranked.length;
    br['r'+r]=ranked.slice(0, keep).filter(t=>!seen.has(t)).map(row);
    br.down=br.down||{};
    br.down[r+1]=ranked.slice(keep).filter(t=>!seen.has(t)).map(row);
    return winners;
  }
  br['r'+r]=ranked.slice(0, sp.cut).map(row);
  if(r===3) br.rest=ranked.slice(sp.cut).map(row);
  return ranked.slice(0, sp.cut);
}
/* Комната дня НИЖНЕЙ сетки: прошедшие её вчерашнего дня плюс те, кого верхняя
   уронила этим утром (ccM24Write, br.down). Первый день нижней — только её
   собственный посев: ронять ещё некому. */
function ccM24LowerRoom(m, r){
  const br=m && m.lower; if(!br) return [];
  if(r===1) return br.rows||[];
  const up=new Set(ccM24Promo(m, r-1).map(x=>x==='you' ? 'you' : JSON.stringify(x)));
  const prev=(br['r'+(r-1)]||[]).filter(x=>!up.has(x==='you' ? 'you' : JSON.stringify(x)));
  const down=(m.upper && m.upper.down && m.upper.down[r])||[];
  return prev.concat(down);
}
/* Подъём из нижней: пустые места верхней на день r+1 (до upperSize) — лучшие
   прошедшие нижнюю в день r. Оба дня r должны быть записаны; нет — подъёма нет. */
function ccM24Promo(m, r){
  if(!m || !m.upper || !m.lower || r>=3) return [];
  const stay=m.upper['r'+r], low=m.lower['r'+r];
  if(!stay || !low) return [];
  return low.slice(0, Math.max(0, CC_M24.upperSize-stay.length));
}
// Комната дня r своей сетки — одна для игрока, для «Играть» и для молчаливого досчёта.
function ccM24Room(m, bracket, r){
  const br=m && m[bracket]; if(!br) return [];
  if(r>1){ ccM24Settle(m, 'upper', r-1); ccM24Settle(m, 'lower', r-1); }
  if(bracket==='lower') return ccM24LowerRoom(m, r);
  if(r===1) return br.rows||[];
  return (br['r'+(r-1)]||[]).concat(ccM24Promo(m, r-1));
}
// Досчитать день сетки молча — чужую сетку, или свою, если игрок из неё выбыл.
function ccM24Settle(m, bracket, r){
  const br=m[bracket]; if(!br) return;
  if(r>1) ccM24Settle(m, bracket, r-1);
  if(br['r'+r]) return;
  // День, в котором игрок ещё не сыграл, молча не досчитывается — его посев в нём живой.
  const day=(ccYearRows().find(x=>x[2]==='Major'+m.n+'_2024_Semi'+r)||[])[0];
  if(day && careerToday()<day) return;
  const prev=ccM24Room(m, bracket, r);
  // Не явившийся на свой день — выбыл: посева 'you' в молчаливой комнате нет.
  const room=prev.filter(x=>x!=='you').map(ccMajorTeamFrom);
  if(!room.length){ br['r'+r]=[]; if(r===3) br.rest=[]; return; }
  const sp=ccM24SemiSpec(m.n, bracket, r);
  room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
  // Дни верхней с билетом за победу: победитель уходит, как в живом вечере (stopOnWin), — иначе бот брал две победы.
  (sp.vr ? simulateGamesStopOnWin : simulateGames)(room, sp.games, ccM24Points, CC_M24_KILL);
  ccM24Write(m, bracket, r, ccM24Rank(room), null);
}
/* Финал — пятьдесят: билеты верхней сетки, топ-25 её третьего дня, топ-15 нижней;
   недобор — из оставшихся верхней, потом нижней. null — Мейджор без записи
   (игрок в него не заходил): мир соберёт финал сам, из лестницы. */
function ccM24GfRows(m){
  if(!m || !m.built || !m.upper || !m.lower) return null;
  ccM24Settle(m, 'upper', 3); ccM24Settle(m, 'lower', 3);
  const out=[], seen=new Set();
  const key=r=>r==='you' ? 'you' : JSON.stringify(r);
  const add=r=>{ const k=key(r); if(seen.has(k) || out.length>=CC_M24.final.field) return; seen.add(k); out.push(r); };
  (m.upper.tickets||[]).forEach(add);
  (m.upper.r3||[]).forEach(add);
  (m.lower.r3||[]).forEach(add);
  (m.upper.rest||[]).forEach(add);
  (m.lower.rest||[]).forEach(add);
  return out;
}
// Комната финала для мира (без игрока): из записи, а без неё — верх лестницы.
function ccM24WorldFinalRoom(m, drafted, lobbyCr){
  const rows=ccM24GfRows(m);
  const room=(rows && rows.length>=10) ? rows.filter(r=>r!=='you').map(ccMajorTeamFrom) : [];
  if(room.length<CC_M24.final.field){
    const seen=new Set(room.map(ccSeatKey));
    careerCupField(lobbyCr, drafted, CC_M24.final.field+20, null, false, CC_FIELD_SHARP.final).forEach(t=>{
      if(room.length>=CC_M24.final.field || seen.has(ccSeatKey(t))) return;
      seen.add(ccSeatKey(t)); room.push(t);
    });
  }
  return room.slice(0, CC_M24.final.field);
}
/* Место в Форт-Уэрт — квота региона на финал каждого Мейджора (GC2024_M*_SEATS),
   NA West читает NA Central; занятые места переходят следующим — здесь это
   просто «место не выше квоты». */
function ccGc24Seats(n){
  const t={1:GC2024_M1_SEATS, 2:GC2024_M2_SEATS, 3:GC2024_M3_SEATS}[n]||GC2024_M3_SEATS;
  let r=careerPrizeRegion(); if(r==='NAW') r='NAC';
  return t[r]!=null ? t[r] : 1;
}
function careerMajorOn(iso){
  const e=(careerYearDays().get(iso)||[]).find(x=>x.kind==='major');
  if(!e) return null;
  let m=String(e.id||'').match(/^Major(\d)_(PlayIn|Heats|LCQ|Final)$/);
  /* 2019–2020: неделя w (раунды вечера), хиты (день r), финал — машина runCareerMajorMX. */
  const mx=String(e.id||'').match(/^Major(\d)_(2019|2020)_(?:W(\d+)R([1-4]+)|Heat([12])|(Final))$/);
  if(mx){
    const evx={n:+mx[1], yx:+mx[2], id:e.id, label:e.label, nth:1};
    if(mx[3]!=null) return Object.assign(evx, {stage:'q', w:+mx[3], rounds:mx[4].split('').map(Number)});
    if(mx[5]) return Object.assign(evx, {stage:'heat', r:+mx[5]});
    return Object.assign(evx, {stage:'final'});
  }
  /* 2021-й: квалификатор, полуфинал (день r), Reboot Round, финал — своя машина, runCareerMajor2021. */
  const m21=String(e.id||'').match(/^Major(\d)_2021_(?:Q([123])R([1-4]+)|Semi([12])|(Reboot)|(Final))$/);
  if(m21){
    let nth=0;
    const row21=ccYearRows().find(r=>r[2]===e.id);
    if(row21) for(let d=row21[0], i=1; d<=row21[1]; d=ccAddDays(d,1), i++) if(d===iso){ nth=i; break; }
    const ev21={n:+m21[1], y21:true, id:e.id, label:e.label, nth:nth};
    if(m21[2]) return Object.assign(ev21, {stage:'q', q:+m21[2], rounds:m21[3].split('').map(Number)});
    if(m21[4]) return Object.assign(ev21, {stage:'semi', r:+m21[4]});
    if(m21[5]) return Object.assign(ev21, {stage:'reboot'});
    return Object.assign(ev21, {stage:'final'});
  }
  /* 2022-й: квалификатор (q, раунды вечера), полуфинал (сессия r), финал — своя машина, runCareerMajor2022. */
  const m22=String(e.id||'').match(/^Major(\d)_2022_(?:Q([123])R([1-4]+)|Semi([123])|(Final))$/);
  if(m22){
    let nth=0;
    const row22=ccYearRows().find(r=>r[2]===e.id);
    if(row22) for(let d=row22[0], i=1; d<=row22[1]; d=ccAddDays(d,1), i++) if(d===iso){ nth=i; break; }
    const ev22={n:+m22[1], y22:true, id:e.id, label:e.label, nth:nth};
    if(m22[2]) return Object.assign(ev22, {stage:'q', q:+m22[2], rounds:m22[3].split('').map(Number)});
    if(m22[4]) return Object.assign(ev22, {stage:'semi', r:+m22[4]});
    return Object.assign(ev22, {stage:'final'});
  }
  /* 2023-й: недели (d1, d2, финал недели wf), Surge Week, финал — своя машина, runCareerMajor2023. */
  const m23=String(e.id||'').match(/^Major(\d)_2023_(?:W([123])(D1|D2|F)|(Surge)|(Final))$/);
  if(m23){
    let nth=0;
    const row23=ccYearRows().find(r=>r[2]===e.id);
    if(row23) for(let d=row23[0], i=1; d<=row23[1]; d=ccAddDays(d,1), i++) if(d===iso){ nth=i; break; }
    const stage=m23[2] ? ({D1:'d1', D2:'d2', F:'wf'})[m23[3]] : m23[4] ? 'surge' : 'final';
    return {n:+m23[1], stage:stage, w:m23[2] ? +m23[2] : 0, y23:true, id:e.id, label:e.label, nth:nth};
  }
  /* 2024-й: квалификатор (q, раунд r), полуфинал (день r), финал — своя машина, runCareerMajor2024. */
  const m24=String(e.id||'').match(/^Major(\d)_2024_(?:Q([12])R([123])|Semi([123])|Final)$/);
  if(m24){
    let nth=0;
    const row24=ccYearRows().find(r=>r[2]===e.id);
    if(row24) for(let d=row24[0], i=1; d<=row24[1]; d=ccAddDays(d,1), i++) if(d===iso){ nth=i; break; }
    if(m24[2]) return {n:+m24[1], stage:'q', q:+m24[2], r:+m24[3], y24:true, id:e.id, label:e.label, nth:nth};
    if(m24[4]) return {n:+m24[1], stage:'semi', r:+m24[4], y24:true, id:e.id, label:e.label, nth:nth};
    return {n:+m24[1], stage:'final', y24:true, id:e.id, label:e.label, nth:nth};
  }
  /* 2025-й: Major1_2025_Group2 — это хиты, и номер группы — это nth: свой
     день у каждой группы, как у Epic, а не блок подряд. */
  let m25=String(e.id||'').match(/^Major(\d)_2025_(PlayIn|Group([123])|LCQ|LCLobby|Final)$/);
  // FNCS Showdown 2025 — «Мейджоры 4–6»: раунд 1 = LCQ, раунд 2 = финал.
  if(!m25) m25=String(e.id||'').match(/^Showdown(\d)_2025_(LCQ|Final)$/);
  if(!m && m25){
    if(m25[3]) return {n:+m25[1], stage:'heats', id:e.id, label:e.label, nth:+m25[3], group:true};
    m=[m25[0], m25[1], m25[2]];
  }
  if(!m) return null;
  /* Какой это по счёту день блока — то есть КАКОЙ ХИТ идёт сегодня.

     Отзыв: «есть же два дня отдельных, где они проходят, тогда
     можно». И правда: Major1_Heats стоит в календаре с 17 по 19 апреля, три
     дня — три хита, ровно как у Epic. Раньше номер дня не читался вовсе, и
     хиты были одним событием на три одинаковых дня.

     Нужен он затем, чтобы каждый хит игрался в СВОЙ день: свой — тобой,
     соседние — миром. Тогда и вечер не дорожает: за день считается один хит,
     а не все сразу. */
  let nth=0;
  const row=ccYearRows().find(r=>r[2]===e.id);
  if(row) for(let d=row[0], i=1; d<=row[1]; d=ccAddDays(d,1), i++)
    if(d===iso){ nth=i; break; }
  return {n:+m[1], stage:CC_MAJOR_DAY[m[2]], id:e.id, label:e.label, nth:nth};
}
/* В каком хите сидит игрок — по той же змейке, которой их и раскладывают.

   Считается ДО вечера, из записи Плей-Ина: номер хита нужен, чтобы понять, в
   какой из трёх дней игроку выходить, а вечер к этому моменту ещё не начался.
   Нет записи — нет и номера, и тогда день не ограничивается ничем: старый сейв
   должен доиграть свой Мейджор, как играл. */
/* Хит, который сегодня играет МИР, а не игрок.

   Каждый день блока — свой хит. Тот, что достался игроку, играет он сам
   (careerMajorCan пускает его только в его день); остальные считаются здесь, по
   одному за день, тем же движком и тем же правилом — stopOnWin, потому что
   победа в игре билет, и heatQualifiers поверх. Не рисуются: смотреть некому.

   Прошедшие дописываются в ту же запись, которую читает финал
   (majorSeed.through), а сыгранные номера помечаются в majorSeed.played, чтобы
   один и тот же хит не сыграли дважды — перемотка ходит по дням, и день может
   быть пройден не один раз. */
function ccMajorWorldHeats(iso){
  const ev=careerMajorOn(iso);
  if(!ev || ev.stage!=='heats' || !ev.nth) return 0;
  const cr=CAREER && CAREER.career;
  const s=cr && cr.majorSeed;
  if(!s || s.n!==ev.n || s.season!==cr.season) return 0;
  s.played=s.played||[];
  if(s.played.indexOf(ev.nth)>=0) return 0;
  const mine=ccMajorMyHeat(ev);
  if(mine && ev.nth===mine) return 0;          // свой играет игрок
  const rows=ccMajorSeedRows(ev);
  if(!rows) return 0;
  const h=ccMajorHeat(ev.n, ev.nth);
  const st=Object.assign({}, ccScaleStage(CC_MAJOR_STAGE.heats),
                         {games:h.games, cut:h.raw ? h.cut : ccTeams(h.cut)});
  /* Место игрока в змейке занимает заглушка: сама раскладка обязана совпасть с
     той, по которой он вышел в свой день, иначе соседний хит соберётся из
     других людей. В комнату заглушка не идёт. */
  const stub={name:'-', pow:0, squad:[], _stub:true};
  const seeded=rows.map(r=>r==='you' ? stub : ccMajorTeamFrom(r));
  const heats=seedHeats(seeded, ccMajorHeats());
  const room=(heats[ev.nth-1]||[]).filter(t=>!t._stub).slice(0, st.field);
  if(room.length<2) return 0;
  // Хит без игрока — тоже мир: один бросок на всех (см. ccWorldRun).
  ccWorldRun('mheat|'+cr.season+'|'+ev.n+'|'+ev.nth,
             ()=>(winIsATicket() ? simulateGamesStopOnWin : simulateGames)(room, st.games, st.pts, st.kill));
  const q=heatQualifiers(room, st.cut, winIsATicket());
  // Та же дверь, что у своего хита — см. ccMajorSeedThrough.
  ccMajorSeedThrough(cr, room.slice().sort(heatsRank).filter(t=>q.has(t)).map(ccMajorSeatRow), ev.nth);
  return 1;
}
/* Последние места финала разыгрывает Ласт Ченс в свой день, а не посев из таблицы Плей-Ина.
   Сколько мест, не задано, а считается: что осталось в зале после хитов. Так сходится и где хиты режут иначе
   (Ближний Восток, Мейджор 1: 47+3).
   Не играем, пока игрок ещё может пройти сам: careerMajorCan отвечает точнее проверки билета. */
function ccMajorWorldLcq(iso){
  const ev=careerMajorOn(iso);
  if(!ev || ev.stage!=='lcq') return 0;
  const cr=CAREER && CAREER.career;
  ccMajorWorldSeat(ev);
  const s=cr && cr.majorSeed;
  if(!s || s.n!==ev.n || s.season!==cr.season) return 0;
  if(s.lcq) return 0;
  if(careerMajorCan(ev)) return 0;
  const me=careerCard(), mates=careerMates();
  if(!me) return 0;
  const drafted=[me].concat(mates.filter(Boolean));
  const fin=ccScaleStage(ccMajorStageSpec('final'));
  const seatsTaken=(s.through||[]).length;
  const need=Math.max(0, fin.field-seatsTaken);
  if(!ccLcLobbySeats(ev, need)) { s.lcq=[]; return 0; }
  const st=ccScaleStage(ccMajorStageSpec('lcq'));
  // И у мира то же правило: держащий место в финале Ласт Ченс не играет.
  /* Ласт Ченс РЕГИОНАЛЬНЫЙ (его слово 20.10: «там же у каждого региона свои, не?»). Комната собиралась через
     ccAsWorld — пул всего мира, как у Глобалса и Парижа, — и её победители (s.through) садились в финал
     Мейджора своего региона: в европейском финале 2026-го оказывались команды NAC, BR, ME (проба: 2469 команд
     семи регионов в одной комнате, лобби 50 — NAC 40 игроков из 100). Теперь — пул своего региона, как у
     Ласт Ченса, который играет сам игрок. */
  const room=careerCupField(Object.assign({}, cr, {division:1}),
                            drafted.concat(ccMajorSeatedHandles(ev)),
                            st.field, 'majLcq', true,
                            CC_FIELD_SHARP.heats);
  if(room.length<2){ s.lcq=[]; return 0; }
  simulateGames(room, st.games, st.pts, st.kill);
  const lob=room.slice().sort(heatsRank).slice(0, ccIs2025() ? st.cut : ccTeams(CAREER_CUP_CUT));
  ccLcLobbySim(lob, ev, st.kill);
  const rows=ccLcLobbyPick(lob, ccLcLobbySeats(ev, need), ev).map(ccMajorSeatRow);
  s.through=(s.through||[]).concat(rows);
  s.lcq=rows;
  return rows.length;
}
/* Кого в Ласт Ченсе быть не может — тех, у кого место в финале уже есть.

   Отзыв: «можно сделать, чтобы ласт ченс не могли играть те,
   кто уже квальнулся в финалы». Игроку это правило поставлено с 17 августа
   (careerMajorCan: есть билет — день пустой), а комната Ласт Ченса собиралась
   открытым полем из всего ладдера, и прошедшие хиты садились в неё наравне со
   всеми: карьера смотрела, как за последние пять мест финала играют те, кто в
   этом финале уже сидит.

   Кто прошёл — записано: majorSeed.through, тот самый список, из которого
   собирается зал финала. Отдаётся он ровно тем же аргументом, которым
   careerCupField не выдаёт тебе тебя самого, — одними никами. Тот же приём,
   что у круга Reload, см. ccRelRoom. */
/* МИР САЖАЕТ ФИНАЛ, КОГДА ИГРОК ПЛЕЙ-ИН НЕ ПРОШЁЛ (Notion 23.10, скрин 8: «в 6 главе почему-то все могут
   играть последний шанс»). Запись прошедших пишет только свой Плей-Ин, а Ласт Ченс как раз для тех, кто
   его не играл или не прошёл (2025: Д2–Д3 и выбывшие; 2026: все). Без записи комната LCQ собиралась из всей лестницы: Veno, Pixie, Queasy, Malibuca играли
   последний шанс рядом с игроком (проба t-lcqfield.js). Теперь в день LCQ мир один раз сажает в финал
   сильнейших региона (места групп: финал минус победы лобби), и их нет ни в LCQ, ни в добор финала. */
function ccMajorWorldSeat(ev){
  const cr=CAREER && CAREER.career;
  if(!cr || !ev || ev.stage!=='lcq' || ev.yx || ev.y21 || ev.y22 || ev.y23 || ev.y24 || ccMajorIsShowdown(ev.n)) return;
  const s=cr.majorSeed;
  if(s && s.n===ev.n && s.season===cr.season) return;
  const me=careerCard();
  if(!me) return;
  const drafted=[me].concat(careerMates().filter(Boolean));
  const fin=ccScaleStage(ccMajorStageSpec('final', ev.n));
  // Места финала минус те, что разыграет лобби Ласт Ченса (игра = место: 3 в 2025-м, 5 в 2026-м).
  const n=Math.max(0, fin.field-ccLcLobbyGames());
  const room=careerCupField(Object.assign({}, cr, {division:1}), drafted, n+1, 'majSeat', false, CC_FIELD_SHARP.heats);
  cr.majorSeed={n:ev.n, season:cr.season, size:careerSquadSize(), rows:[], world:true,
                through:room.slice().sort((a,b)=>(b.pow||0)-(a.pow||0)).slice(0, n).map(ccMajorSeatRow)};
}
function ccMajorSeatedHandles(ev){
  ccMajorWorldSeat(ev);
  const cr=CAREER && CAREER.career, s=cr && cr.majorSeed;
  if(!s || !ev || s.n!==ev.n || s.season!==cr.season) return [];
  if(!Array.isArray(s.through)) return [];
  const out=[];
  s.through.forEach(row=>{
    if(!Array.isArray(row)) return;             // 'you' — своя строка, она и так занята
    row.forEach(e=>{
      const h=(typeof e==='string') ? e : (e && e.h);
      if(h) out.push(h);
    });
  });
  return out;
}
/* Прошедшие хит дописываются в запись, а не замещают её.
   Было `majorSeed.through=rows`: блок хитов идёт три дня, соседние играет мир (ccMajorWorldHeats дописывает), и вечер игрока стирал уже прошедших.
   Тогда ccMajorSeatedHandles их не видел, они играли Last Chance, а финал добирался посевом.
   Идемпотентно: уже лежащая строка второй раз не ложится, номер хита не задваивается (перемотка может пройти день не раз). */
function ccMajorSeedThrough(cr, rows, heatNo){
  const s=cr && cr.majorSeed;
  if(!s) return;
  const seen=new Set(), ppl=new Set();
  // И по людям: та же тройка с другим четвёртым — уже записанная команда, а не новая (см. ccMajorFinalRoom).
  const who=r=>Array.isArray(r) ? r.map(e=>hKey(typeof e==='string' ? e : (e && e.h) || '')).filter(Boolean) : [];
  s.through=(s.through||[]).concat(rows||[])
    .filter(r=>{ const k=(r==='you') ? 'you' : JSON.stringify(r);
                 if(seen.has(k)) return false;
                 const ks=who(r); if(ks.some(x=>ppl.has(x))) return false;
                 seen.add(k); ks.forEach(x=>ppl.add(x)); return true; });
  // Помечается НОМЕР ХИТА, а не день: игрок может сыграть свой хит в любой
  // день блока, а мир не должен потом сыграть его второй раз. Номера соседних,
  // уже сыгранных миром, остаются на месте по той же причине.
  s.played=(s.played||[]).concat([heatNo||0])
    .filter((v,i,a)=>a.indexOf(v)===i);
}
function ccMajorMyHeat(ev){
  const rows=ccMajorSeedRows(ev);
  if(!rows) return 0;
  const at=rows.indexOf('you');
  if(at<0) return 0;
  const heats=ccMajorHeats();
  const lap=Math.floor(at/heats), pos=at%heats;
  return (lap%2 ? heats-1-pos : pos)+1;
}
/* Who may enter what. Play-In: Division 1 only (Epic: "Reach FNCS Division 1 to
   unlock this event"). Heats: whoever came through it. Last Chance: everyone,
   except those already through this Major. Final: ticket holders from Heats or LCQ.
   Don't confuse it with the Global Championship Last Chance (GCLC_PRIZES_BY_REGION,
   careerGclcCan), where qualified duos still play for money.
   The order guard above misses this: LCQ comes after Heats on the calendar but is
   not a later stage. Each stage is played once, on its first day. */
// Why the button is off today: a ticket-holder is not locked out of a Major,
// they are already through it, and being told the Heats have to be earned when
// you have just earned them reads as the mode losing track.
function ccMajWhyLocked(){
  const ev=careerMajorOn(careerToday()), m=CAREER.career.major;
  // Соло-Мейджор в команде: свой вечер сыгран, день ждёт напарника (ccMXTeamSettle).
  if(ev && ev.yx && ccMpTeam() && (ccMXSpec(ev.yx, ev.n)||{}).size===1){
    const d=CAREER.career.mxDone||{};
    if(d[hKey(careerCard())]===careerToday()) return L().ccMpSoloWait;
  }
  if(ev && ev.stage==='lcq' && m && m.n===ev.n && m.ticket) return L().ccMajHaveTicket;
  if(ev && ev.stage==='lcq' && ccMajLc2025(ev) && (CAREER.career.division||1)>3) return L().ccMajLcqDiv||L().ccMajLocked;
  return L().ccMajLocked;
}
function careerMajorCan(ev){
  if(!ev) return false;
  const cr=CAREER.career, m=cr.major;
  const done = m && m.n===ev.n ? m.got : null;
  // A seat given up to change partner is a seat somebody else is sitting in.
  const gaveUp=(cr.gaveUp||[]).indexOf('major:'+ev.n)>=0;
  const ticket = !gaveUp && !!(m && m.n===ev.n && m.ticket);
  // 2023-й: см. ccM23CanStage.
  if(ev.y23) return ccM23CanStage(ev, cr, gaveUp);
  if(ev.y22) return ccM22CanStage(ev, cr, gaveUp);
  if(ev.y21) return ccM21CanStage(ev, cr, gaveUp);
  if(ev.yx) return ccMXCanStage(ev, cr, gaveUp);
  /* 2024-й: раунд 1 квалификатора открыт всем; дальше — тем, кто прошёл вчерашний;
     полуфинал — своей сетке, пока жив и без билета; финал — по билету. */
  if(ev.y24){
    const s=ccM24Of(ev.n);
    if(s && s.got[ev.id]) return false;
    if(ev.stage==='q'){
      if(ev.r===1) return true;
      const prev=s && s.q[ev.q] && s.q[ev.q]['r'+(ev.r-1)];
      return ccSeedHasMe(prev);
    }
    if(ev.stage==='semi'){
      if(!s) return false;
      ccM24Brackets(s);
      const br=s.bracket && s[s.bracket];
      if(!br || s.ticket) return false;
      /* Упавший из верхней сетки сидит в upper.down[r], а не в нижней сетке прошлого дня —
         комната нижней сетки собирается ccM24LowerRoom. Без этого «Играть» гасла после
         «падение в нижнюю сетку» (аудит 29.09). */
      const prev=ccM24Room(s, s.bracket, ev.r);
      return ccSeedHasMe(prev);
    }
    return !gaveUp && !!(s && s.ticket);
  }
  if(done && CC_MAJOR_ORDER.indexOf(done)>=CC_MAJOR_ORDER.indexOf(ev.stage)) return false;
  if(ev.stage==='playin') return cr.division===1;
  if(ev.stage==='lcq'){
    if(ccMajorIsShowdown(ev.n) && cr.division>2) return false;   // Showdown — дивизионы 1–2
    /* 2025: LCQ Мейджора у Epic открыт дивизионам 1, 2 и 3 (Notion 23.10, скрин 8: «в 6 главе почему-то все
       могут играть последний шанс»). В Европе и NA Central у карьеры пять ступеней, 4 и 5 сюда не входят. */
    if(ccMajLc2025(ev) && (cr.division||1)>3) return false;
    return !ticket && !(ccMajLc2025(ev) && m && m.n===ev.n && m.pass==='lcq');
  }
  // 2025: лобби — на следующий день после LCQ, для тех, кто прошёл его отсечку.
  if(ev.stage==='lclobby') return ccMajLc2025(ev) && !ticket && !!(m && m.n===ev.n && m.pass==='lcq');
  // Cleared, not merely played: finishing 140th in a Play-In is not a place in
  // the Heats. See the note where cr.major is written.
  /* День блока игрока НЕ ограничивает: у Epic твой хит в свой день, но хаб
     об этом пока не говорит ни слова, и запрет читался бы как «кнопка пропала».
     Днями расписан только МИР — см. ccMajorWorldHeats. */
  if(ev.stage==='heats'){
    if(!(!gaveUp && !!(m && m.n===ev.n && m.pass==='playin'))) return false;
    // 2025: группа играется в СВОЙ день. Своя группа — по той же змейке посева.
    if(ev.group){ const mine=ccMajorMyHeat(ev); if(mine && mine!==ev.nth) return false; }
    return true;
  }
  if(ev.stage==='final')  return ticket;
  return false;
}
/* Prize table by the career's region, not always EU. Epic pays Majors by region (EU $591,500,
   NAC $412,000, NAW and BR $137,000, ASIA/ME/OCE $75,000); both payouts used to read EU by name.
   Uses the career's region, not ccHomeRegion, which goes through drafted and the draft screen's
   globals. Rookies are EU anyway (CC.region). */
/* …И ГДЕ ТЫ ИГРАЕШЬ, А НЕ ОТКУДА КАРТОЧКА (Notion 20.10, скрин 13: «я переехал в Азию и куча европейских команд в
   финале», «и призы в Азии не те»). Регион карточки шёл первым, и карточка Европы после переезда в Азию получала
   европейские призы и европейские настоящие трио финала (GR2021_TRIOS[регион призов] — они и были на скрине). Теперь
   регион вечеров карьеры (ccCareerRegion: свой, командный или чужой недели), карточка — только запасной. */
function careerPrizeRegion(){
  try{ if(CAREER && CAREER.career && typeof ccCareerRegion==='function') return ccCareerRegion() || 'EU'; }catch(e){}
  const r=CAREER && CAREER.player &&
          (CAREER.player.region || CAREER.player.cardRegion);
  return r || 'EU';
}
function ccRegionTable(tables){
  return (tables && (tables[careerPrizeRegion()] || tables.EU)) || null;
}
// Epic's payout for a Major Final, read straight rather than through
// prizeTableFor, which branches on CARD_SET — a global the career does not set.
// Showdown 2025: на игрока №1 $3 000, №2 $1 000, №3 $750, 4–10 $300, 11–15 $250, 16–25 $150 — на трио втрое.
const CC_SHOWDOWN_PAY=[[1,3000],[2,1000],[3,750],[10,300],[15,250],[25,150]];
// По регионам (Tracker 20.10): EU и NAC — таблица выше, NAW/BR/ASIA/ME/OCE — №1 $600, №2 $300, №3 $200, 4–25 $100.
const CC_SHOWDOWN_PAYR={EU:CC_SHOWDOWN_PAY, NAC:CC_SHOWDOWN_PAY,
  NAW:[[1,600],[2,300],[3,200],[25,100]]};
['BR','ASIA','ME','OCE'].forEach(r=>{ CC_SHOWDOWN_PAYR[r]=CC_SHOWDOWN_PAYR.NAW; });
function showdownPrize(place){ return ccPay24(CC_SHOWDOWN_PAYR, place)*careerSquadSize(); }
/* День, за который платят: мир, доигрывая пропущенный финал, считает деньги в день того финала,
   а не в день, с которого ушёл игрок (иначе таблица бралась у другого Мейджора — аудит 29.09). */
let CC_PRIZE_DAY=null;
function majorPrize(place){
  const ev=careerMajorOn(CC_PRIZE_DAY || careerToday());
  if(ev && ccMajorIsShowdown(ev.n)) return showdownPrize(place);
  // 2024-й: таблица окна Day 2 Finals своего региона (Tracker), на игрока — на дуо вдвое.
  if(ccIs2024()) return ccPay24(CC_MAJOR_PAY_2024, place)*careerSquadSize();
  // 2023-й: своя таблица у каждого Мейджора (у NA в Мейджоре 1 — NA East).
  // 2022-й: таблица Гранд-финала своего сезона и региона (Tracker, на игрока).
  // 2019–2020: World Cup — призовые Нью-Йорка (одна таблица на мир), FNCS — финал сезона и региона.
  if(ev && ev.yx) return ccMXPrize(ev.yx, ev.n, place);
  // 2021-й: таблица финала своего сезона и региона (Tracker, на игрока); 5 — Grand Royale.
  if(ccIs2021()) return ccPay24(CC_MAJOR_PAY_2021[(ev && ev.y21) ? ev.n : 4], place)*careerSquadSize();
  if(ccIs2022()) return ccPay24(CC_MAJOR_PAY_2022[(ev && ev.y22) ? ev.n : 3], place)*careerSquadSize();
  if(ccIs2023()) return ccPay24(CC_MAJOR_PAY_2023[(ev && ev.y23 && ev.n<=3) ? ev.n : 3], place)*careerSquadSize();
  // 2025-й платит своей таблицей (Attachment C 2025, одна на все три Мейджора).
  const t=ccRegionTable(ccIs2025() ? P2025_PRIZES : PRIZE_TABLES) || null;
  return t ? (t[String(place)]||0) : 0;
}

/* Money table: every event this career has seen, the Weekly Finals Europe plays without the player plus every
   paying event the player enters (whole field's cheques come from the payout table). Skipped events nobody
   simulated are not in it. Filed by career year and Fortnite season together, so a second year replaying S40
   does not add to the first. Prize money only, no wages, same number as cr.earnings. */
/* Имя человека в доске — БЕЗ подписи состава. Своя команда зовётся «Твой состав: Malibuca &
   vic0», и доска призовых резала это на людей как есть: у себя строка звалась «Твой состав:
   Malibuca», у соседа по гонке тот же человек — «Malibuca». Две разные строки об одном, и
   доски у двоих не сходились никогда. Доска рейтинга подпись снимала (careerPrAdd), доска
   денег — нет. Скриншот: слева «Твой состав: Malibuca» 58 вечеров $553k, справа
   «Malibuca» 50 вечеров $324k. */
/* Значок региона (cardFlag без страны: <span class="reg-badge">EU</span>) уходит ЦЕЛИКОМ, с текстом. Иначе снятие
   тегов оставляло «EU» перед ником: у соседа по гонке я был «EULive2», у себя «Live2» — две строки одного человека
   (онлайн-прогон 2019 года, 21.10, «строка есть не у всех»). */
const ccBoardName=n=>String(n||'').replace(/<span class="reg-badge"[^>]*>[^<]*<\/span>/g, '').replace(/<[^>]*>/g, '').replace(/^[^:&+]{1,40}:\s*/, '').trim();
/* Люди за именем состава. Сборная Кубка наций зовётся «Польша (Darm, demus, Pixx, FRANEK)», и
   доска делила имя только по «+»/«&» — сборная вставала строкой среди людей, а каждый новый
   порядок четвёрки давал ещё одну («Польша» трижды; Notion 13.10). Скобки со списком — это люди. */
function ccMoneyWho(name){
  const m=/\(([^()]*,[^()]*)\)\s*$/.exec(name);
  const list=m ? m[1].split(',') : name.split(/\s*[+&]\s*/);
  return list.map(x=>x.trim()).filter(Boolean);
}
function careerMoney(){
  const cr=CAREER.career;
  if(!cr.money) cr.money={rows:{}};
  /* Старые сейвы: строки с подписью сливаются в строку человека — один раз, при первом
     чтении. Без этого в доске стояли бы обе. */
  if(!cr.money.named){
    cr.money.named=1;
    Object.keys(cr.money.rows).forEach(function(k){
      const to=ccBoardName(k); if(!to || to===k) return;
      const a=cr.money.rows[k], b=cr.money.rows[to];
      delete cr.money.rows[k];
      if(!b){ cr.money.rows[to]=a; return; }
      b.usd=(b.usd||0)+(a.usd||0); b.events=(b.events||0)+(a.events||0); b.you=b.you||a.you;
      ['yr','fs'].forEach(function(w){ a[w]=a[w]||{}; b[w]=b[w]||{};
        Object.keys(a[w]).forEach(function(x){ b[w][x]=(b[w][x]||0)+a[w][x]; }); });
    });
  }
  // Старые сейвы: строки сборных («США (Curve, Peterbot, Ritual, Clix)») расходятся по людям поровну.
  if(!cr.money.nat){
    cr.money.nat=1;
    Object.keys(cr.money.rows).forEach(function(k){
      const who=ccMoneyWho(k); if(who.length<2) return;
      const a=cr.money.rows[k], n=who.length;
      delete cr.money.rows[k];
      who.forEach(function(h){
        const b=cr.money.rows[h] || (cr.money.rows[h]={usd:0, events:0, yr:{}, fs:{}});
        b.usd=(b.usd||0)+Math.round((a.usd||0)/n); b.events=(b.events||0)+(a.events||0); b.you=b.you||a.you;
        ['yr','fs'].forEach(function(w){ b[w]=b[w]||{};
          Object.keys(a[w]||{}).forEach(function(x){ b[w][x]=(b[w][x]||0)+Math.round(a[w][x]/n); }); });
      });
    });
  }
  /* Старые сейвы: «ты» стояло на всём своём составе (напарник, стэнд-ин капа). Остаётся на своём
     нике, если он среди помеченных; иначе не трогаем — лучше лишняя подсветка, чем никакой. */
  if(!cr.money.you1){
    cr.money.you1=1;
    const yk=ccMoneyYouKey();
    const marked=Object.keys(cr.money.rows).filter(k=>cr.money.rows[k].you);
    if(yk && marked.some(k=>hKey(k)===yk)) marked.forEach(function(k){ if(hKey(k)!==yk) delete cr.money.rows[k].you; });
  }
  ccMoneyYouMerge(cr.money);
  return cr.money;
}
/* Смена ника (careerNickSet) оставляла в доске строку старого ника отдельным игроком.
   Свои строки (you) под другим ником сливаются в строку текущего; напарники с меткой из старых сейвов не трогаются. */
function ccMoneyYouMerge(money){
  const pl=CAREER && CAREER.player; if(!pl || pl.handle || !pl.nick) return;
  const yk=hKey(pl.nick), rows=money.rows;
  const mates=new Set();
  try{ (CAREER.partners||[]).concat(CAREER.career.exMates||[]).forEach(r=>{ const c=r && (ccMateCardOf(r)||r.card||r); const h=c && (c.handle||c.h); if(h) mates.add(hKey(h)); }); }catch(e){}
  const old=Object.keys(rows).filter(k=>rows[k] && rows[k].you && hKey(k)!==yk && !mates.has(hKey(k)));
  if(!old.length) return;
  const b=rows[pl.nick] || (rows[pl.nick]={usd:0, events:0, yr:{}, fs:{}});
  old.forEach(function(k){
    const a=rows[k]; delete rows[k];
    b.usd=(b.usd||0)+(a.usd||0); b.events=(b.events||0)+(a.events||0);
    ['yr','fs'].forEach(function(w){ b[w]=b[w]||{}; Object.keys(a[w]||{}).forEach(function(x){ b[w][x]=(b[w][x]||0)+a[w][x]; }); });
  });
  b.you=true;
}
/* СВОЯ СТРОКА ДОСКИ — ТОЛЬКО СВОЙ НИК, как в Power Ranking (careerPrAdd).
   Метка «ты» на всём составе прятала напарника и стэнд-ина от чужих копилок (ccEvResApply не трогает
   свою строку): стэнд-ин, сыгравший с тобой один кап, дальше копил только у соседей. Прогон годов 20.10,
   2021: у каждого из троих не хватало строки ровно своего стэнд-ина. */
function ccMoneyYouKey(){
  return hKey((CAREER && CAREER.player && (CAREER.player.handle || CAREER.player.nick))||'');
}
function careerMoneyKeys(){
  const cr=CAREER.career;
  const fs=careerFncsSeason(careerToday());
  return {yr:String(cr.season), fs:cr.season+':'+((fs&&fs.id)||'-'),
          fsName:(fs&&fs.id)||'-'};
}
// prize(place, team) — the payout table of whatever just finished.
/* Prize money is split between the duo. Epic's tables are per team ($10,000 for a divisional cup is for the pair),
   and paying it all to one player doubles earnings against real per-player boards. Each handle takes half; an odd
   dollar is lost to rounding. The prize tables still say what Epic pays a team. */
function ccShareOf(cash, team){
  const n=(team && team.squad && team.squad.length) || 2;
  return Math.round((cash||0)/Math.max(1, n));
}
/* ДОСКИ ОДНИ НА ГОНКУ. Призовые и Power Ranking копятся из вечеров, которые карьера ВИДЕЛА:
   не прошёл в финал Мейджора — денег того финала в твоей доске нет вовсе, и у соседа по гонке
   доска другая (скриншот: у одного Sky 63 вечера и $642k, у другого тот же Sky — 60 и
   $349k). Вечера теперь общие, но сыграть их могут не все: у кого-то нет напарника, кто-то не
   квалифицировался. Поэтому каждый вечер складывается в копилку (CC_EV_DELTA) и уезжает в
   комнату актом 'res'; кто этот вечер не играл, добавляет его к себе один раз — по ключу дня и
   вида (cr.evSeen). Свои вечера помечаются тем же ключом, так что дважды не считается. */
let CC_EV_DELTA=null;
/* КЛЮЧ ВЕЧЕРА — ДЕНЬ, ВИД И ДИВИЗИОН. Ключ «день|вид» сталкивал ДВА РАЗНЫХ вечера: сосед
   играет тот же кубок в своём дивизионе, оба помечают один ключ, и каждый отказывается от
   чужой копилки как от своей собственной. Оба вечера в мире были, а в досках у каждого
   остался только свой. Годовая проба на двоих 11.09: 6 строк из 454 разошлись — три дуо,
   у одного клиента на пять-шесть вечеров меньше. Вместе играют ОДИН дивизион, значит
   ключ у них сходится по-прежнему; врозь — расходится, и копилки доезжают в обе стороны. */
function ccEvKey(next, day){
  const t=next && (next.id || next.type) || '?';
  const div=(CAREER && CAREER.career && CAREER.career.division) || 0;
  /* И ВРОЗЬ — ЭТО ДРУГОЙ ВЕЧЕР. Дивизиона мало: соло-серия у каждого своя, день и вид у неё
     общие, и два РАЗНЫХ вечера получали один ключ — каждый отказывался от чужой копилки как
     от своей. Вторая годовая проба на двоих 11.09: те же 6 строк из 446, три дуо. Вечер,
     сыгранный не вместе, метится своим ником: у общего ключ по-прежнему один на всех.
     ccRaceShared спрашивается ДО замка (CC_RACE_LOCK ставится позже), поэтому зовём её саму. */
  let alone='';
  try{ if(typeof ccRaceOn==='function' && ccRaceOn() && typeof ccRaceShared==='function' && !ccRaceShared(next))
         alone='|s'+hKey(careerCard()||{handle:''}); }catch(e){}
  return String(day||careerToday())+'|'+String(t)+'|d'+div+alone;
}
function ccEvSeen(){ const cr=CAREER && CAREER.career; if(!cr) return {}; if(!cr.evSeen) cr.evSeen={}; return cr.evSeen; }
function ccEvSeenMark(key){
  const seen=ccEvSeen(); if(!key || seen[key]) return false;
  seen[key]=1;
  const ks=Object.keys(seen);
  if(ks.length>400) ks.slice(0, ks.length-400).forEach(k=>{ delete seen[k]; });
  return true;
}
/* КЛЮЧ МЕТИТСЯ НА ВХОДЕ.
   Метка стояла в конце вечера (ccEvDeltaSend), и между началом и концом оставалось окно:
   сосед, закончивший раньше, присылал свою копилку, а я в этот момент уже записал те же
   деньги своим ходом, но ключ ещё не пометил — и строки ложились дважды. Вечер, который я
   считаю сам, чужой копилки не ждёт, поэтому ключ метится там, где вечер начинается.
   Отмена вечера ничего не ломает: ccEvDeltaSend зовётся и на ошибке, из finally. */
function ccEvDeltaStart(key){
  /* Новый вечер (не хвост) — флаг «разошёлся на границе раундов» снимается здесь: перемотка запускает вечера мимо
     careerPlayRun0, и поднятый с соло-капа флаг делал личными все следующие общие вечера (их итоги ложились у
     напарника второй раз копилкой — командный год 20.10, Evaluation 29.01: Kami 800 против 400). */
  if(typeof CC_TEAM_NIGHT_APART!=="undefined" && !(key && /\|t[^|]*$/.test(key))) CC_TEAM_NIGHT_APART=false;
  CC_EV_DELTA=key ? {key:key, money:{}, ev:{}, pr:{}, yr:null, fs:null, day:careerToday()} : null;
  if(key) ccEvSeenMark(key);
}
/* ВЕЧЕР РАЗОШЁЛСЯ ПОСРЕДИ — ЗНАЧИТ У НЕГО ДВЕ ЧАСТИ.
   Границы раундов (Evaluation R2, Victory Cup R2, лобби LCQ) отпускают локстеп, когда
   прошли не все: дальше прошедший играет свою комнату, а вылетевший закрывает вечер. До
   этой минуты вечер был общий и посчитан одинаково, после — он у каждого свой.
   А ключ копилки один на весь вечер, и это и есть ответ на жалобу про
   разные доски: прошедший записывал призовые второго раунда себе, вылетевший помечал тот
   же ключ пустым и потому отказывался от присланных чисел как от уже учтённых. Разница
   в $800 на человека вставала навсегда (проба на двоих 11.09: Evaluation 9 января,
   Pixovsky и SereN — 5 вечеров и $2100 против 4 и $1300).
   Поэтому вечер закрывается дважды: общая часть уходит под общим ключом (у обоих она
   одинакова, каждый свою уже посчитал), а хвост — под своим, с ником. Так его принимает
   сосед, и оба видят один второй раунд. Ровно так же давно живут соло-серии: вечер,
   сыгранный не вместе, метится ником (см. ccEvKey). */
function ccRaceNightApart(){
  CC_RACE_LOCK=false; CC_RACE_NIGHT_APART=true;
  const d=CC_EV_DELTA; if(!d || !d.key) return;
  const key=d.key;
  ccEvDeltaSend();
  let me=''; try{ me=hKey(careerCard()||{handle:''}); }catch(e){}
  ccEvDeltaStart(key+'|t'+me);
}
/* И вопросы врозь: хвост вечера — одиночный (CC_MP_ALONE), иначе прошедший ждал ответа на высадку от вылетевшего (онлайн-
   прогон 2020 года, 21.10: Platform Cash Cup 11.05, «peer done · q drop#1» на первой игре второго раунда — красная строка).
   Снимается в конце вечера (careerPlayRun). */
let CC_TEAM_APART_ALONE=false;
function ccTeamNightApart(){
  CC_TEAM_NIGHT_APART=true;
  if(!CC_MP_ALONE){ CC_MP_ALONE=true; CC_TEAM_APART_ALONE=true; }
  const d=CC_EV_DELTA; if(!d || !d.key) return;
  const key=d.key;
  ccEvDeltaSend();
  let me=''; try{ me=hKey(careerCard()||{handle:''}); }catch(e){}
  ccEvDeltaStart(key+'|t'+me);
}
function ccEvDeltaSend(){
  try{ if(typeof careerClubTake==='function') careerClubTake(); }catch(e){}   // доля клуба с призовых состава
  const d=CC_EV_DELTA; CC_EV_DELTA=null;
  if(!d || !d.key) return;
  ccEvSeenMark(d.key);
  /* КОМАНДА: вечер, который сыграл один из двоих (CC_MP_ALONE, напарнику в этот день играть нечего),
     у напарника не считался вовсе — его призовых и рейтинга в досках второго не было (командный год
     20.10: доски разошлись на 454 строки). Общие вечера оба считают сами, им копилка не нужна. */
  if(d.alone && typeof ccMpTeam==='function' && ccMpTeam() && !(typeof ccRaceOn==='function' && ccRaceOn())){
    if(!Object.keys(d.money).length && !Object.keys(d.pr).length) return;
    let me=''; try{ me=hKey(careerCard()||{handle:''}); }catch(e){}
    if(!/\|t[^|]*$/.test(d.key)) d.key=d.key+'|s'+me;
    ccEvSeenMark(d.key);
    try{ if(typeof MP!=='undefined' && MP.act){ d.by=ccMpId(); MP.act('res', d); } }catch(e){}
    return;
  }
  if(typeof ccRaceOn!=='function' || !ccRaceOn() || typeof ccRaceLive!=='function' || !ccRaceLive()) return;
  if(!Object.keys(d.money).length && !Object.keys(d.pr).length) return;
  try{ d.by=ccMpId(); MP.act('res', d); }catch(e){}
}
/* Чужой вечер в свои доски: те же строки, что записал бы свой (careerMoneyAdd/careerPrAdd),
   только числа приехали готовыми. Свою строку в них не трогаем — она своя по определению. */
/* СВОИ СТРОКИ — только из своих вечеров. Чужая копилка везёт всё поле, включая того, кто её
   прислал; моя собственная строка в ней стоять не может (я этот вечер не играл — иначе ключ
   уже помечен), но подстраховка дешевле разбирательства: строка, помеченная как своя, и мой
   собственный ник чужими числами не трогаются. */
function ccEvMine(){
  const s={};
  try{ const me=careerCard(); if(me && me.handle) s[hKey(me)]=1; }catch(e){}
  return s;
}
/* ФИНАЛ МИРА ПРОТИВ СЫГРАННОГО ФИНАЛА (гонка, онлайн-прогон 2026, 22.10). Финал, который сыграл один из людей,
   второй мог досчитать за мир раньше, чем пришла копилка сыгравшего (в гонке день у каждого свой) — и призы всего поля
   ложились дважды: Summit 31.05, 50 лишних строк. Выплату мира за финал помним (cr.wfinPaid); пришла копилка
   сыгранного финала того же вида в те же дни — сначала снимаем выплату мира. И наоборот: копилку мира за финал,
   который здесь уже сыгран (своим вечером или копилкой соседа), не принимаем. */
function ccFinalKindOf(day, id){
  const e=(careerYearDays().get(day)||[]).find(x=>x && String(x.id||'')===String(id||''));
  if(!e) return null;
  // Reload Championship в календаре идёт видом 'gc' (общая краска с Last Chance), а мир платит её видом 'rc' (ccLanKindOf).
  if(String(e.id||'')==='ReloadChampionshipParis') return 'rc';
  return (['globals','gclc','rc'].indexOf(e.kind)>=0 || e.stage==='final' || /Final|_GF|Grand/i.test(String(e.id||''))) ? e.kind : null;
}
function ccWfinKeep(d){
  try{
    if(!d || !d.wkind || !CAREER || !CAREER.career) return;
    const cr=CAREER.career, w=cr.wfinPaid=cr.wfinPaid||{};
    w[d.key]={kind:d.wkind, day:d.day||careerToday(), money:Object.assign({}, d.money||{}), ev:Object.assign({}, d.ev||{}), pr:JSON.parse(JSON.stringify(d.pr||{})), yr:d.yr||null, fs:d.fs||null};
    const ks=Object.keys(w); if(ks.length>40) ks.slice(0, ks.length-40).forEach(k=>{ delete w[k]; });
  }catch(e){}
}
function ccWfinPlayedHere(kind, day){
  const cr=CAREER.career;
  if((cr.log||[]).some(r=>r && r.kind===kind && r.season===cr.season && (r.stage==null || r.stage==='final') && Math.abs(ccDaysBetween(r.day, day))<=3)) return true;
  return Object.keys(ccEvSeen()).some(k=>{ if(/\|wfin\|/.test(k)) return false; const p=k.split('|');
    return p[0] && Math.abs(ccDaysBetween(p[0], day))<=3 && ccFinalKindOf(p[0], p[1])===kind; });
}
function ccWfinUndo(key){
  const cr=CAREER.career, w=cr.wfinPaid||{};
  const p=String(key||'').split('|'); if(!p[0] || /\|wfin\|/.test(key)) return;
  const kind=ccFinalKindOf(p[0], p[1]); if(!kind) return;
  Object.keys(w).forEach(wk=>{
    const r=w[wk]; if(!r || r.kind!==kind || Math.abs(ccDaysBetween(r.day, p[0]))>3) return;
    const m=careerMoney();
    Object.keys(r.money||{}).forEach(h=>{ const each=Math.round(r.money[h]||0), row=m.rows[h]; if(!each || !row || row.you) return;
      row.usd-=each; row.events=Math.max(0, (row.events||0)-Math.max(1, Math.round((r.ev && r.ev[h])||1)));
      if(r.yr && row.yr) row.yr[r.yr]=(row.yr[r.yr]||0)-each;
      if(r.fs && row.fs) row.fs[r.fs]=(row.fs[r.fs]||0)-each;
      if(row.usd<=0 && !row.events) delete m.rows[h]; });
    const t=careerPrTally(), ad=ccAbsDay(cr.season, r.day);
    Object.keys(r.pr||{}).forEach(name=>{ const row=t.rows[name]; if(!row || row.you) return;
      (r.pr[name]||[]).forEach(rating=>{
        let i=row.v.findIndex(v=>v[0]===rating && v[1]===ad); if(i<0) i=row.v.findIndex(v=>v[0]===rating);
        if(i>=0){ row.v.splice(i, 1); row.n=Math.max(0, (row.n||0)-1); } });
      if(!row.v.length && !row.n) delete t.rows[name]; });
    delete w[wk];
  });
}
function ccEvResApply(d){
  if(!d || !d.key || !CAREER || !CAREER.career) return false;
  if(d.wkind && ccWfinPlayedHere(d.wkind, d.day||careerToday())){ ccEvSeenMark(d.key); return false; }
  if(!ccEvSeenMark(d.key)) return false;
  if(d.wkind) ccWfinKeep(d); else try{ ccWfinUndo(d.key); }catch(e){}
  const mine=ccEvMine();
  const m=careerMoney(), k={yr:d.yr||careerMoneyKeys().yr, fs:d.fs||careerMoneyKeys().fs};
  Object.keys(d.money||{}).forEach(function(h){
    const each=Math.round(d.money[h]||0); if(!each) return;
    if(mine[hKey(h)] || (m.rows[h] && m.rows[h].you)) return;
    const row=m.rows[h] || (m.rows[h]={usd:0, events:0, yr:{}, fs:{}});
    row.usd+=each; row.events+=Math.max(1, Math.round((d.ev && d.ev[h])||1));
    row.yr[k.yr]=(row.yr[k.yr]||0)+each;
    row.fs[k.fs]=(row.fs[k.fs]||0)+each;
  });
  const t=careerPrTally(), day=ccAbsDay(CAREER.career.season, d.day||careerToday());
  Object.keys(d.pr||{}).forEach(function(name){
    if(mine[hKey(name)] || (t.rows[name] && t.rows[name].you)) return;
    (d.pr[name]||[]).forEach(function(rating){
      if(!(rating>0)) return;
      const row=t.rows[name] || (t.rows[name]={v:[], n:0});
      row.v.push([rating, day]);
      ccPrRowTrim(row);
      row.n++;
    });
  });
  careerSave();
  return true;
}
function careerMoneyAdd(ranked, prize){
  if(!CAREER || !CAREER.career) return;   // вечер дорисовался после выхода из карьеры (журнал: экран режимов)
  if(!ranked || !ranked.length) return;
  const m=careerMoney(), k=careerMoneyKeys();
  ranked.forEach(function(t, i){
    if(ccBoardOnlyYou() && !t.isYou) return;
    const usd=prize(i+1, t)||0;
    if(!usd) return;
    const name=ccBoardName(t.name);
    if(!name) return;
    // The board is a board of people, so a duo's prize lands on two rows.
    const who=ccMoneyWho(name);
    const parts=who.length || 1;
    const each=Math.round(usd/parts);
    // «ты» — свой ник в составе; не нашёлся (имя без людей) — вся строка, как раньше.
    const yk=t.isYou ? ccMoneyYouKey() : '';
    const youAll=t.isYou && !(who.length ? who : [name]).some(h=>hKey(h)===yk);
    (who.length ? who : [name]).forEach(function(h){
      if(ccTeamPeerSkip(h)) return;
      const row=m.rows[h] || (m.rows[h]={usd:0, events:0, yr:{}, fs:{}});
      row.usd+=each; row.events++;
      row.yr[k.yr]=(row.yr[k.yr]||0)+each;
      row.fs[k.fs]=(row.fs[k.fs]||0)+each;
      if(t.isYou && (youAll || hKey(h)===yk)) row.you=true;
      /* Копилка вечера — для тех, кто его не играет (см. ccEvDeltaSend). СВОЯ СТРОКА ТОЖЕ:
         своя она только у меня, а у соседа по гонке я — обычный человек сцены, и мои
         призовые за вечер, который он не играл, не попадали к нему ВООБЩЕ. Отсюда скриншот
         11.09: у себя 58 вечеров и $553k, у соседа тот же человек — 50 и $324k. Свою строку
         от чужой копилки бережёт приёмник (ccEvResApply). */
      if(CC_EV_DELTA){ CC_EV_DELTA.money[h]=(CC_EV_DELTA.money[h]||0)+each; CC_EV_DELTA.yr=k.yr; CC_EV_DELTA.fs=k.fs;
        if(ccTeamSoloNight()) CC_EV_DELTA.alone=true;
        // И сколько выплат: два раунда одного вечера — два турнира в доске (прогон годов 20.10, Solo Cash Cup 2023).
        if(CC_EV_DELTA.ev) CC_EV_DELTA.ev[h]=(CC_EV_DELTA.ev[h]||0)+1; }
    });
  });
}
// scope: 'season' — the Fortnite season being played, 'year' — this career year.
// careerMoneyRows still answers 'all' and the tally still keeps it — the header
// reads the career's own all-time earnings off it — but the standing is not
// shown over all time. A board that never resets is a board nobody can catch up
// on, and the two windows that reset are the ones a season is played inside.
/* Reading it.

   Two buttons over one list, because the same money answers two questions.
   Thirty rows, and if the player is below them their own row is pinned to the
   bottom — a leaderboard you are not on tells you nothing. */
/* Год, не сезон, открывается первым — скриншот: «перестали
   считаться призовые за фнкс и саммит». Деньги никуда не девались (проба
   money-scope-probe: сезонное окно пустеет на стыке, годовое держит всё) —
   но саммит стоит в S40, финал Мейджора в S41, и вкладка «Сезон S42»
   честно показывала таблицу без обоих. Окна остались те же, добавилось
   «За всё время» — careerMoneyRows отвечал на 'all' всегда, кнопки не было. */
let CH_MONEY='year';
function careerMoneyTab(v){ CH_MONEY=v; careerRenderHub(CH_TAB); }
function careerMoneyHTML(){
  const scope=CH_MONEY==='year' ? 'year' : CH_MONEY==='all' ? 'all' : 'season';
  const rows=careerMoneyRows(scope), k=careerMoneyKeys();
  const usd=n=>ccMoney(n||0);
  const tab=(id,label)=>`<button class="cm-tab${scope===id?" on":""}" onclick="careerMoneyTab(\'${id}\')">${label}</button>`;
  const head=`<div class="cm-head">${tab("season", L().ccMoneySeason(k.fsName))}${tab("year", L().ccMoneyYear(CAREER.career.season))}${tab("all", L().ccMoneyAll)}</div>`;
  if(!rows.length)
    return `<div class="ch-tile"><h4>${L().ccMoneyTitle}</h4>${head}<div class="ch-empty">${L().ccMoneyEmpty}</div></div>`;
  const mine=careerMoneyPlace(scope);
  const line=(r,n)=>`<tr class="${r.you?"you":""}"><td>${n}</td><td class="ct-name">${esc(r.name)}</td><td>${r.events}</td><td class="cm-usd">${usd(r.usd)}</td></tr>`;
  const top=rows.slice(0, 30).map((r,i)=>line(r, i+1)).join("");
  // Pinned only when they fell off the end of the list.
  const below=(mine && mine>30) ? line(rows[mine-1], mine) : "";
  return `<div class="ch-tile"><h4>${L().ccMoneyTitle}</h4>
    ${head}
    <table class="ct cm"><thead><tr><th>#</th><th>${L().ccTableTeam}</th><th>${L().evEvents}</th><th class="cm-usd">${L().chEarnings}</th></tr></thead>
    <tbody>${top}${below}</tbody></table>
    <div class="ct-note">${mine ? L().ccMoneyYou(mine) : L().ccMoneyNotIn}</div>
  </div>`;
}
function careerMoneyRows(scope){
  const m=careerMoney(), k=careerMoneyKeys();
  return Object.keys(m.rows).map(function(name){
    const r=m.rows[name];
    const usd = scope==='season' ? ((r.fs||{})[k.fs]||0)
              : scope==='year'   ? ((r.yr||{})[k.yr]||0)
              : r.usd;
    return {name:name, usd:usd, events:r.events, you:!!r.you};
  }).filter(function(r){ return r.usd>0; })
    .sort(function(a,b){ return b.usd-a.usd || b.events-a.events; });
}
function careerMoneyPlace(scope){
  const rows=careerMoneyRows(scope);
  for(let i=0;i<rows.length;i++) if(rows[i].you) return i+1;
  return null;
}

/* ===== Division 1's season table =====
   Every Weekly Final adds points; at year end it decides who stays in D1 (Epic: "Division 1 is kept only by last
   season's standing", no demotion mid-season). Only D1 has one, since only D1 has a Weekly Final.
   Top 50 stay, matching the Weekly Final's 50 seats. The one invented rule here: Epic publishes no relegation. */
const CC_TABLE_KEEP=50;
function careerTable(){
  const cr=CAREER.career;
  if(!cr.table || cr.table.season!==cr.season)
    cr.table={season:cr.season, weeks:0, rows:{}};
  return cr.table;
}
// One Weekly Final's worth. Called with the night's standings whether the player
// was in them or the rest of Europe played it without them.
function careerTableAdd(ranked){
  const t=careerTable();
  t.weeks++;
  ranked.forEach(function(team, i){
    const name=String(team.name||'').replace(/<[^>]*>/g,'');
    if(!name) return;
    /* Your own row is keyed on being you, not on what the team is called.

       The name is yourTeamPrefix plus the partner's handles, so it changed the
       moment the duo changed — and again if the language changed — and the week
       after wrote a second row. A season's points then stood in two places,
       careerTablePlace read whichever half sorted higher, and under a fifty-team
       cut that is a relegation nobody earned: the only way out of Division 1 is
       this line. Everybody else in the room is a snapshot pair whose name does
       not move, which is why nothing else showed it. His report, 20 August.

       Rows written before this fix keep their name as the key and stay where
       they are; the merge is not retroactive, because a split that already
       happened cannot be told from two teams. */
    /* И у тройки ключ — её ядро, а не имя.

       Тестер, страница «05» (5.10): «в 6 главе двое свиззи стало». Третий у
       настоящей тройки 2025-го меняется со снимком сезона (ccRealSnap), и
       «SwizzY & Queasy & Merstach» с «SwizzY & Queasy & Rad3on» вставали в
       таблицу двумя строками — замер года (tools/p05-ff.js): 33-я и 37-я, и
       так у каждого второго ядра сцены. Ядро — первые двое состава (пара
       пула, к ней садится третий), оно сезон и держит. */
    const sq=team.squad||[];
    const key=team.isYou ? '__you__'
            : (sq.length>=3 && sq[0] && sq[1]) ? 'core:'+[hKey(sq[0]), hKey(sq[1])].sort().join('+')
            : name;
    const row=t.rows[key] || (t.rows[key]={pts:0, weeks:0, best:null, wins:0});
    // The name is carried rather than keyed on, so the table still prints the
    // duo the player is in now.
    row.name=name;
    row.pts += team.stagePts||0;
    row.weeks++;
    row.wins += team.wins||0;
    if(row.best==null || i+1<row.best) row.best=i+1;
    if(team.isYou) row.you=true;
  });
}
// Sorted the way the standing is read: points, then how often you were there,
// then the best night you had.
/* Reading it.

   Fifty rows and a line under the fiftieth, because that line is the whole
   point of the table: everything above it is still in Division 1 next year.
   Below Division 1 there is nothing to show and the screen says why rather
   than drawing an empty table. */
/* Сезонной таблицы больше нет — отзыв: «убери эту таблицу и
   power ranking оставь». Плитка ТАБЛИЦА с очками финалов недели и правилом
   «первые N остаются в Дивизионе 1» удалена целиком (careerTableHTML и её
   ccTable*-строки — мёртвые ключи в словарях); вылет из Д1 был снят ещё
   22 августа, теперь снята и сама витрина правила. careerTableRows/Place
   живут: ими рисуются скриншоты таблиц в ленте (careerD1Posts). */
function careerTableRows(){
  if(CC_RENDER_MEMO){ if(!CC_RENDER_MEMO.has('tbl')) CC_RENDER_MEMO.set('tbl', careerTableRowsRaw()); return CC_RENDER_MEMO.get('tbl').slice(); }
  return careerTableRowsRaw();
}
function careerTableRowsRaw(){
  const t=careerTable();
  return Object.keys(t.rows).map(function(name){
    const r=t.rows[name];
    // The key is the name for everybody whose name cannot move, and a sentinel
    // for the one team whose name can — see careerTableAdd. A row from a save
    // written before that carries no name of its own and reads its key, which
    // is what it always was.
    return {name:r.name||name, pts:r.pts, weeks:r.weeks, best:r.best, wins:r.wins, you:!!r.you};
  }).sort(function(a,b){
    return b.pts-a.pts || b.weeks-a.weeks || (a.best||99)-(b.best||99);
  });
}
function careerTablePlace(){
  const rows=careerTableRows();
  for(let i=0;i<rows.length;i++) if(rows[i].you) return i+1;
  return null;
}

/* Division 1's Weekly Final, the first thing in a career that pays (below Division 1 the payout table is empty).
   From Tracker's Division 1 EU page: 50 teams, 6 matches, VR +9, 2nd-5th +4 each, 6th-25th +2, cumulative so a win is 65. Elimination 4.
   Entry is the top 50 across the week's two sessions, the cut the divisional cup already computes (Division 1 has nothing to promote into). */
const CC_WF_GAMES=6, CC_WF_KILL=4;
/* Season-aware FNCS placement points. Trio seasons use PLACEMENT_POINTS_TRIO (2025 trio rules:
   VR +11, Top 2 +6, Top 3-5 +4, Top 6-17 +3, VR still 65), otherwise PLACEMENT_POINTS_DUO
   (65, 56, 52, 48, 44 …). Same path as pointsForPlace so career and lobbies can't drift apart.
   Outside a career (mode tiles) it's duos, like real FNCS 2026. */
function wfPoints(place){
  const trio=(typeof CAREER!=='undefined') && CAREER && CAREER.career &&
             careerSquadSize()===3;
  const t=trio ? PLACEMENT_POINTS_TRIO : PLACEMENT_POINTS_DUO;
  return (place>0 && place<=t.length) ? t[place-1] : 0;
}
const CC_WF_PAY={1:10000, 2:5000, 3:3000, 4:2000, 5:1500, 6:1000, 7:1000,
                 8:800, 9:800, 10:800};
/* Финал Division 1 Practice платит по своей таблице — снята с Tracker
   (payoutTableV2 окна Week1Final_EU, S42) 23 августа, просьба
   «призовые достань как на фортнайттрекере»: №1 $2500, №2 $1250, №3 $625,
   №4 $500, №5 $375, 6–7 $250, 8–10 $200, 11–20 $150, 21–40 $100. На дуо. */
const CC_WF_PAY_S42={1:2500, 2:1250, 3:625, 4:500, 5:375, 6:250, 7:250,
                     8:200, 9:200, 10:200};
function ccWfIsPractice(){
  const w=ccCupWeeks().find(r=>r[3]===careerToday());
  return !!(w && /^S42_/.test(w[0]));
}
/* Финал недели Дивизиона 1 в 2025-м (Tracker, S33/S34/S36 Week Final EU, на игрока):
   №1 $7 500, №2 $4 500, №3 $3 000, №4 $2 100, №5 $1 650, 6–10 $1 200, 11–15 $600,
   16–20 $300, 21–25 $150 — на трио втрое. */
const CC_WF_PAY_2025=[[1,7500],[2,4500],[3,3000],[4,2100],[5,1650],[10,1200],[15,600],[20,300],[25,150]];
// Финал недели Elite, 2023-й (Tracker, S23_DivisionalCups_Elite_Finals, на игрока); NA — NA East.
const CC_WF_PAY_2023={EU:[[1,5000],[2,2700],[3,1800],[10,900],[25,450],[40,300]], NAC:[[1,2500],[2,1200],[3,800],[10,400],[40,200]],
  BR:[[1,1250],[2,600],[3,400],[40,200]], ASIA:[[1,1250],[2,600],[3,400],[40,200]], ME:[[1,1250],[2,600],[3,400],[40,200]], OCE:[[1,1250],[2,600],[3,400],[40,200]]};
/* ПО РЕГИОНАМ (его слово 20.10: «посмотри у каждого региона призы и сравнивай с Европой»). Таблицы 2025/2026 стояли
   одни на все регионы — европейские: Азия за первое место Финала недели получала $5 000 на игрока, как Европа. Снято с
   Tracker 20.10 (imp_event.Windows[].PayoutTable, окна S39/S40/S41/S42_FNCSDivisionalCup_Division1_Week1Final_<рег>,
   S33/S34/S36 — то же у 2025-го), на ИГРОКА, «до места N — сумма». NAW и BR платят одной таблицей, ASIA/ME/OCE — другой
   (группировка Epic). Европа совпадает с прежними числами до доллара (CC_WF_PAY ×2 у дуо). Практика S42 раньше платила
   свою сумму на всю команду — у Epic это сумма на игрока, теперь ×размер состава, как везде. */
const CC_WF_PAY_2026R={
  EU:  [[1,5000],[2,2500],[3,1500],[4,1000],[5,750],[7,500],[10,400],[20,300],[40,200]],
  NAC: [[1,3000],[2,1500],[3,900],[4,600],[5,450],[7,375],[10,300],[20,225],[40,150]],
  NAW: [[1,1500],[2,1000],[3,500],[4,300],[5,200],[10,150],[20,100]],
  ASIA:[[1,1000],[2,500],[3,250],[4,200],[5,150],[20,100]]};
CC_WF_PAY_2026R.BR=CC_WF_PAY_2026R.NAW; CC_WF_PAY_2026R.ME=CC_WF_PAY_2026R.ASIA; CC_WF_PAY_2026R.OCE=CC_WF_PAY_2026R.ASIA;
const CC_WF_PAY_S42R={
  EU:  [[1,2500],[2,1250],[3,625],[4,500],[5,375],[7,250],[10,200],[20,150],[40,100]],
  NAC: [[1,1500],[2,750],[3,450],[4,300],[5,225],[7,188],[10,150],[20,113],[40,75]],
  NAW: [[1,750],[2,500],[3,250],[4,150],[5,100],[10,75],[20,50]],
  ASIA:[[1,500],[2,250],[3,125],[4,100],[5,75],[20,50]]};
CC_WF_PAY_S42R.BR=CC_WF_PAY_S42R.NAW; CC_WF_PAY_S42R.ME=CC_WF_PAY_S42R.ASIA; CC_WF_PAY_S42R.OCE=CC_WF_PAY_S42R.ASIA;
const CC_WF_PAY_2025R={
  EU:  [[1,7500],[2,4500],[3,3000],[4,2100],[5,1650],[10,1200],[15,600],[20,300],[25,150]],
  NAC: [[1,5000],[2,3000],[3,2000],[4,1400],[5,1100],[10,800],[15,400],[20,200],[25,100]],
  NAW: [[1,2500],[2,1500],[3,1000],[4,850],[5,650],[10,400],[15,200],[20,100]],
  ASIA:[[1,2100],[2,1050],[3,700],[4,595],[5,455],[10,280],[15,140]]};
CC_WF_PAY_2025R.BR=CC_WF_PAY_2025R.NAW; CC_WF_PAY_2025R.ME=CC_WF_PAY_2025R.ASIA; CC_WF_PAY_2025R.OCE=CC_WF_PAY_2025R.ASIA;
function wfPrize(place){
  if(ccIs2023()) return ccPay24(CC_WF_PAY_2023, place)*careerSquadSize();
  if(ccIs2022()) return ccPay24(CC_WF_PAY_2022, place)*careerSquadSize();
  if(ccIs2025()) return ccPay24(CC_WF_PAY_2025R, place)*careerSquadSize();
  if(ccWfIsPractice()) return ccPay24(CC_WF_PAY_S42R, place)*careerSquadSize();
  return ccPay24(CC_WF_PAY_2026R, place)*careerSquadSize();
}
// Whether this Saturday is yours: the cut you cleared is stamped with the Monday
// of its own week, so a final can never be played on the back of last week's.
function careerWeeklyFinalOn(iso){
  const cr=CAREER.career;
  if(cr.division!==1) return false;
  if(!(careerYearDays().get(iso)||[]).some(e=>e.kind==='final')) return false;
  return !!(cr.wf && cr.wf.monday===careerMonday(iso));
}

/* Reload Elite Series: a second circuit beside the ladder and the only road out that skips FNCS. Four cups, each a
   chain: Opens are open to all divisions, later stages must be earned.
   Numbers from docs/superpowers/specs/2026-08-13-ewc-reload-elite-series-design.md: Opens and Play-Ins 2 per elim,
   Heats and Final 3; placement R_PLACEMENT (cup 1 steeper). Heat: 20 duos, 8 games, top 5 out; final 20 duos, 8 games.
   The final pays EWC seats, not money: EU top 3 per cup, twelve total.
   Opens field = the whole ladder summed (D1 field + entrants of all rungs below, 9,766 duos now). Cut is Epic's share,
   see ccReloadOpenCut. */
// Kept per region, because Division 1's rung is the region's own roster and a
// career that moves across the map takes a different ladder with it.
/* БЕЗ ВЕЧНОГО КЭША (errlog 23.10, команда на 23.10f: «field … n2470 vs n2390», «n2470 vs n2330» каждый вечер).
   Дивизион 1 в сумме — живой размер пула сезона (ccDiv1Size), а кэш был по одному региону: вкладка, где раньше
   открывали карьеру другого года, держала его лестницу (проба t-hist.js: сразу 2026 — 2470, сначала 2025 — 2560),
   и двое в одной команде садились в открытые поля разного размера. Сумма пяти чисел — считаем каждый раз. */
function careerLadderEntrants(){
  let n=0;
  Object.keys(CC_CUP_ENTRANTS).forEach(d=>{ n+=CC_CUP_ENTRANTS[d]; });
  return n;
}
/* A Reload match holds forty players.

   That is the mode's own lobby and not a choice a tournament makes: twenty duos
   in the Elite Series, forty solos in a Reload Victory Cup. The career was
   playing the Opens and the Play-In in fifties, which is the Battle Royale
   lobby — and the circuit's own spec says what that costs in as many words:
   "A stage played in a fifty-duo lobby would score every placement in the cup
   wrong." Placement points are paid per lobby, so a fifty-duo room hands out
   top-ten finishes to teams that were nowhere near the top ten of a real one.

   The heats and the final were already right, because their whole field is
   twenty and the lobby could not be bigger than the room. */
const CC_RELOAD_PLAYERS=40;
/* До какого круга в Reload возрождаются (движок: onDeath, respawnUntilZone). По
   реплеям первые выбывшие — к восьмому кругу, заметные потери с девятого. */
const CC_RELOAD_RESPAWN_ZONE=9;
function ccReloadLobby(teamSize){
  return Math.max(1, Math.round(CC_RELOAD_PLAYERS/(teamSize||2)));
}
/* Share of an Opens session that advances to the Play-In.
   Epic advances the top 1000 of ~9,766 EU duos, so one in ten. Stored as a share because the sim plays Opens in a room of careerLadderEntrants(): a flat 1000 out of ~2100 would move half the ladder.
   Replaces a derived 50 per session, which came from reading Tracker's top-100 display cap (tools/build-ewc-rows.js) as the field size.
   The Play-In then cuts to the 80 the heats seat (four heats of 20). */
/* And how many the Opens actually send, read off Epic's own event page on
   17 August rather than remembered: "the top players on the Open cumulative
   leaderboard will qualify for the Play-Ins — Top 2,000 EU; Top 1,000 NAC;
   Top 500 OCE, ASIA, ME, BR, NAW." The thousand that stood here was NAC's.
   The career can be played in any region now, so the number follows the region
   the way the roster does. */
const CC_LADDER_TRUE=9766;
const CC_OPEN_CUT={EU:2000, NAC:1000, NAE:1000, NAW:500, OCE:500, ASIA:500, ME:500, BR:500};
function ccOpenAdvance(){ return CC_OPEN_CUT[ccCareerRegion()] || 500; }
/* Open cut shown at Epic's scale. The real ladder is 9,766 duos (Tracker division sizes summed), ours is
   CC_CUP_ENTRANTS 1000/500/300/150, 2,100 in the open, because 5,000+ duos cost 7.2 s a stage.
   So the room is a 1-in-4.65 sample of the real open and places are scaled up: the card shows Epic's cut of 1000
   and field of 9,766 instead of 215. See ccOpenScale. */
/* Room size the Opens is actually simulated at. The ladder summed grows too big (4,200 duos x 12 games = 7.5 s a
   stage). Results are already scaled to the real open (9,766 duos vs Epic's thousand, ccOpenScale), so the room is a
   sample; 2,000 gives the same tournament in ~4 s.
   Measured one Chrome per size, page load subtracted (performance.now() under --virtual-time-budget reports 0):
     450 x 11: 948ms, 500 x 11: 1,016ms, 2,000 x 11: 3,745ms, 4,200 x 12: 7,527ms */
const CC_OPEN_ROOM=2100;
/* And what a phone can hold, which is not the same number.

   The room is already a sample of the real open — 9,766 duos read out of 2,100
   played, see ccOpenScale — so its size decides how finely that sample is cut
   and nothing else. On a desktop 2,100 is four seconds of work; on a phone the
   same twelve games are a stall long enough to look like the page has died, and
   his report of 20 August is exactly that. Two-fifths of the room is the same
   tournament at the same odds, read out at the same 9,766 and the same thousand,
   in a fraction of the time.

   Measured once and kept: a career does not move between devices mid-session,
   and asking matchMedia on every field build would be its own cost. */
const CC_OPEN_ROOM_SMALL=900;
let CC_SMALL_DEVICE=null;
function ccSmallDevice(){
  if(CC_SMALL_DEVICE!=null) return CC_SMALL_DEVICE;
  let small=false;
  try{
    small = (window.matchMedia && window.matchMedia('(max-width: 820px)').matches) ||
            (navigator.hardwareConcurrency>0 && navigator.hardwareConcurrency<=4) ||
            /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent||'');
  }catch(e){ small=false; }
  CC_SMALL_DEVICE=small;
  return small;
}
/* В КОМАНДНОЙ карьере комната не зависит от устройства.

   Скриншот квал Reload, игра 2: «Вечера разошлись на игре 1 —
   field …n2100h68 vs …n900h68». Двое считают один вечер шаг в шаг, а комнату
   один собрал на 2100 дуо (ноутбук), другой на 900 (телефон, или просто
   четыре ядра) — это два разных турнира с первой же игры. Размер комнаты
   решает, что покажет вечер, значит в команде он обязан быть у обоих одним,
   и выбирается тот, который потянет любой из двух телефонов: малый. Это тот же
   турнир при тех же шансах (см. выше), только считается быстрее.
   Одиночная карьера как выбирала по устройству, так и выбирает. */
function ccOpenRoom(){
  /* И в ГОНКЕ то же: скриншот (две вкладки, три гонщика) — «field …r1.15.n2100h106+106+114 vs
     …n900h106+106+114», одно окно узкое (max-width 820) — и у него комната 900 против 2100 у соседа.
     Годовая проба этого не ловила: шесть вкладок одной машины считают комнату одинаково. */
  const small = ccSmallDevice() || (typeof ccMpTeam==='function' && ccMpTeam()) || (typeof ccRaceOn==='function' && ccRaceOn());
  return Math.min(small ? CC_OPEN_ROOM_SMALL : CC_OPEN_ROOM, careerLadderEntrants());
}
function ccReloadOpenCut(){
  return Math.max(20, Math.round(ccOpenRoom()*ccOpenAdvance()/CC_LADDER_TRUE));
}
/* The real open and its cut, counted in this season's teams.

   Epic's 9,766 and Epic's thousand are duos, and the room they are read against
   is converted for a trio season by ccScaleStage — so without these two the
   sample was multiplied out against a duo-sized open and a trio's place in the
   Opens read half as good again as it was. The share is untouched: it is the
   same people either way, described in the unit the season plays in. */
function ccOpenTrue(){ return ccTeams(CC_LADDER_TRUE); }
function ccOpenAdvanceNow(){ return ccTeams(ccOpenAdvance()); }
// How much bigger the real open is than the room we play it in. Display only:
// the cut, the field size and a place read off it. Nothing decided by it.
function ccOpenScale(fieldSize){
  return (fieldSize>0) ? ccOpenTrue()/fieldSize : 1;
}
/* Первое место — первое, и последнее — последнее.
 *
 * Умножение места на размер выборки верно в середине поля и неверно на его
 * краю: выиграв комнату, игрок читал у себя «топ-11», второй — «топ-22»,
 * третий — «топ-33». Сообщение тестера, 21 августа: «i get 1st but after cup
 * its noted as a top 11 (same for top 2 n 3 22 33)». Одиннадцать — честное
 * матожидание лучшего из выборки, но человеку, который только что видел на
 * экране единицу, оно читается как ошибка, и по делу: кто-то этот опен всё же
 * выиграл.
 *
 * Поэтому отображение не пропорциональное, а линейное с закреплёнными концами:
 * первый в комнате — первый, последний в комнате — последний из настоящих
 * девяти с половиной тысяч, между ними та же равномерная растяжка. */
function ccOpenShow(n, fieldSize){
  return ccRankStretch(n, fieldSize);
}
function ccRankStretch(n, fieldSize){
  return ccStretchTo(n, fieldSize, ccOpenTrue());
}
/* То же правило, но настоящее поле называется вслух. Опен — не единственный
   турнир, который играется выборкой: дивизионный кубок собирает тысячу дуо и
   играется комнатой в полторы сотни, и место в нём тоже читается в тысяче.
   Концы закреплены так же: кто выиграл комнату, выиграл турнир. */
function ccStretchTo(n, roomOf, trueOf){
  const k=(roomOf>0 && trueOf>0) ? trueOf/roomOf : 1;
  if(!(k>1) || !(n>0)) return Math.max(1, Math.round(n));
  return Math.max(1, Math.round(1+(n-1)*k));
}
// Set for the length of one standings table and put straight back. Every rank a
// table prints is multiplied by it; nothing a table decides is.
let CC_RANK_SCALE=1;
// Тем же правилом, что и место игрока: концы закреплены, растянута середина.
// Иначе таблица печатала бы «11» напротив того, у кого в шапке стоит «1».
function ccRankShow(i){
  const k=CC_RANK_SCALE;
  if(!(k>1) || !(i>0)) return Math.max(1, Math.round(i));
  return Math.max(1, Math.round(1+(i-1)*k));
}
/* Reload circuit prizes: the qualifying series pays $1.5m of the $2.5m, only $1m is Paris.
   From saved Fortnite Tracker pages (Cash Prize column, EU Heats and Finals of cups 1-3). Per duo; ccShareOf halves it.
     Opens, Play-In  nothing
     Heats          top 5 advance unpaid; 6-10 $500, 11-15 $400, 16-20 $300 ($6,000 a heat, four a cup)
     Final          $30,000 down to $1,000 over 20 places, $122,000 a cup
   Other regions below come from Epic's own tables. A region with no table pays nothing; do not copy Europe's shape. */
const CC_REL_PRIZES={
  EU:{
    heat: {6:500, 7:500, 8:500, 9:500, 10:500,
           11:400, 12:400, 13:400, 14:400, 15:400,
           16:300, 17:300, 18:300, 19:300, 20:300},
    final:{1:30000, 2:20000, 3:14000, 4:10000, 5:8000, 6:7000, 7:6000, 8:5000,
           9:4000, 10:3000, 11:2000, 12:2000, 13:2000, 14:2000, 15:2000,
           16:1000, 17:1000, 18:1000, 19:1000, 20:1000}
  }
};
/* Остальные шесть регионов (29.09, Tracker: imp_event.Windows[].PayoutTable событий
   S39_ReloadEliteSeries1{Heat1,Final}_{REG} и S41_ReloadEliteSeries4 — таблицы одинаковы в сериях 1 и 4).
   У Epic Quantity — на игрока, «до места N»; здесь, как у Европы выше, — на дуо (×2). */
(function(){
  const duo=rows=>{ const t={}; let from=1; rows.forEach(([upTo, v])=>{ for(let p=from; p<=upTo; p++) if(v) t[p]=v*2; from=upTo+1; }); return t; };
  const F_NAC=[[1,10000],[2,7000],[3,5000],[4,4000],[5,3000],[6,2000],[7,1500],[8,1250],[9,1000],[10,750],[15,500],[20,250]];
  const F_NAW=[[1,3000],[2,2000],[3,1500],[4,1000],[5,900],[6,800],[7,700],[8,600],[9,500],[10,400],[15,300],[20,250]];
  const F_SM=[[1,1500],[2,1000],[3,750],[4,600],[5,500],[6,400],[7,350],[8,300],[9,250],[10,200],[20,150]];
  CC_REL_PRIZES.NAC={heat:duo([[5,0],[10,200],[15,150],[20,100]]), final:duo(F_NAC)};
  CC_REL_PRIZES.NAW={heat:duo([[5,0],[10,150],[15,100]]), final:duo(F_NAW)};
  CC_REL_PRIZES.BR ={heat:duo([[5,0],[10,150],[15,100]]), final:duo(F_NAW)};
  ['ME','ASIA','OCE'].forEach(r=>{ CC_REL_PRIZES[r]={heat:duo([[5,0],[10,100]]), final:duo(F_SM)}; });
})();
function relStagePrize(stage, place){
  const byRegion=CC_REL_PRIZES[careerPrizeRegion()];
  const t=byRegion && byRegion[stage];
  return (t && t[place]) || 0;
}
const CC_RELOAD_ORDER=['open','playin','heat','final'];
const CC_RELOAD_STAGE={
  open:  {games:12, kill:2, get field(){ return ccOpenRoom(); },
                            get cut(){ return ccReloadOpenCut(); }},
  playin:{games:12, kill:2, get field(){ return ccReloadOpenCut(); }, cut:80},
  heat:  {games:8,  kill:3, field:20,               cut:5},
  final: {games:8,  kill:3, field:20,               cut:3}
};
// Насколько маленькой должна быть комната, чтобы её выбывших стоило запомнить.
// Лобби круга — двадцать дуо; сорок оставлены на то, чтобы правило пережило
// смену размера состава, и всё равно отсекают отбор с его сотнями. См. ccRelRoom.
const CC_REL_OUT_MAX=40;
const CC_RELOAD_DAY={Opens:'open', PlayIn:'playin', Heats:'heat', Final:'final'};
// Which cup and which stage a day belongs to, read off the calendar's own id.
function careerReloadOn(iso){
  const e=(careerYearDays().get(iso)||[]).find(x=>x.kind==='reload');
  if(!e) return null;
  const m=String(e.id||'').match(/^ReloadEliteSeries(\d)(Opens|PlayIn|Heats|Final)$/);
  if(!m) return null;
  return {series:+m[1], set:'r'+m[1], stage:CC_RELOAD_DAY[m[2]], id:e.id, label:e.label};
}
// You may enter the Opens whenever they run. Everything after them asks what you
// came through, and a new cup starts the chain again from nothing.
/* The Opens are two evenings and one tournament.

   His words, 16 August: the Opens are the sum of two tournaments and the top
   thousand goes to the Play-In. The calendar has always had the two dates - the
   generated year calls the row "Opens, two sessions" and this file marks it
   'pair' so only the endpoints run - but each evening was scored on its own and
   cut on its own, so a career got two independent shots at the same seat and the
   second one wiped the first.

   The same shape Division 1's Monday and Tuesday already use: the first evening
   settles nothing and banks its points, the second carries them in and the table
   at the end of it is the tournament's. A player who only turns up for one
   evening is scored on that evening, which is also true of the real thing. */
function careerReloadSession(ev){
  const row=ccYearRows().find(r=>r[2]===ev.id);
  if(!row || row[0]===row[1]) return 1;
  return careerToday()===row[1] ? 2 : 1;
}
function careerReloadBanking(ev){
  return !!ev && ev.stage==='open' && careerReloadSession(ev)===1;
}
/* What the first evening leaves behind, and why it is a string.

   The banked evening was four objects keyed by team name - points, elims, games,
   wins - which is fine for a Weekly Final's hundred and fifty duos and is not
   fine for an Opens. At the Opens' real size that is nine thousand seven hundred
   names written out four times, about a megabyte of JSON, and careerSave swallows
   a quota error without a word: the save simply stops happening and the career
   silently stops existing between sessions.

   So it is one row per team in one string. Same four numbers, the name written
   once, about a quarter of the size - and it is unpacked back into the four maps
   the field builder already reads, so nothing downstream knows the difference.
   A save banked in the old shape still opens, because the old shape is still
   read when it is the one that is there. */
/* And it is keyed on who they are, not on what the row says.

   A team's name is display markup - two flag images from flagcdn with widths and
   titles and inline styles around two handles - so keying the carry on it wrote
   about two hundred and fifty characters of HTML per duo. Nine thousand of those
   is the four megabytes that killed the save. The handles alone are twenty. */
function ccRelKey(t){
  const s=(t.squad||[]).map(p=>String(p&&p.handle||'')).join('&');
  return s || String(t.name||'').replace(/<[^>]*>/g, '').trim();
}
function ccRelPack(field){
  return field.map(t=>[ccRelKey(t).split(';').join(','), t.stagePts||0,
                       t.stageElims||0, (t.stageLog||[]).length,
                       t.wins||0].join('|')).join(';');
}
function ccRelUnpack(rows){
  const out={pts:{}, elims:{}, games:{}, wins:{}};
  String(rows||'').split(';').forEach(r=>{
    if(!r) return;
    const p=r.split('|'), n=p[0];
    out.pts[n]=+p[1]||0; out.elims[n]=+p[2]||0;
    out.games[n]=+p[3]||0; out.wins[n]=+p[4]||0;
  });
  return out;
}
function careerReloadCarry(ev){
  const r=CAREER.career.rel;
  if(!(ev && ev.stage==='open' && careerReloadSession(ev)===2 && r && r.id===ev.id))
    return null;
  if(!r.rows){ r.byName=true; return r; }
  const c=ccRelUnpack(r.rows);
  c.log=r.log;
  return c;
}
/* Пройденную стадию Reload больше не предлагать. Стадия идёт окном в несколько дней, и все дни календарь
   выдаёт её же; got растёт на ступень за успех, и прошедший снова попадал на вылет в той же стадии.
   Открыта, когда пройдена предыдущая и не пройдена она сама. Проигрыш got не двигает, повтор остаётся. */
function careerReloadCan(ev){
  if(!ev) return false;
  const r=CAREER.career.reload;
  const mine=(r && r.series===ev.series) ? r : null;
  if(mine && ccGaveUp('reload:'+mine.series)) return false;
  const at=mine ? CC_RELOAD_ORDER.indexOf(mine.got) : -1;
  return at === CC_RELOAD_ORDER.indexOf(ev.stage)-1;
}
// The placement ladder of the cup being played, without touching CARD_SET: that
// global also decides which cards exist, and a career must not have its roster
// swapped out from under it for the length of a tournament.
function reloadCareerPoints(set){
  /* И Reload в сезоне трио — по тому же правилу.

     Правило: «релоад сделай похожим образом». Похожим — потому
     что своей трио-таблицы у Reload Elite Series нет и быть не может: этот
     турнир никто и никогда не играл втроём. Поэтому опубликованная дуо-лестница
     переносится через ccTrioLadder — те же ступени, обрезанные там, где
     кончается трио-комната, и растянутые так, чтобы Victory Royale стоил свои
     шестьдесят. Кубок 1 остаётся круче трёх остальных, как и в дуо.

     Для r2: 60, 48, 41, 34, 27, 20, 16, 12, 8, 4 — десять мест вместо
     пятнадцати. */
  const duo=R_PLACEMENT[set]||R_PLACEMENT.r2;
  const key=(R_PLACEMENT[set] ? set : 'r2');
  const t=(CAREER && CAREER.career && careerSquadSize()===3)
          ? ccTrioLadderOf('rl3:'+key, duo) : duo;
  return function(place){ return place<=t.length ? t[place-1] : 0; };
}

/* Victory Cup: open to everybody, the only event paying players far from Division 1. Numbers from Tracker EU event pages per window.
   Round 1: 6 matches, VR +7, Top 2 +4, Top 3 +2, +1 per tier Top 4..Top 50, cumulative (win = 60). Elimination +2.
   Round 2: 3 matches, only a win scores: +100 points and $100 ($200 for a duo).
   Round 2 size: Tracker's S41_SoloVictoryCup R2 EU board runs 40 pages of 100, so 4000 players (CC_VICTORY_R2_PLAYERS).
   Field is the whole ladder: careerLadderEntrants() in duos, twice that in solo (it used to be 150 with the divisional cut).
   Not modelled: Epic's per-day Ranked gates (Platinum, Elite, Unreal). There's no Ranked ladder, so every day is open. */
const CC_VICTORY_R1_GAMES=6, CC_VICTORY_R1_KILL=2, CC_VICTORY_R2_GAMES=3;
// Three of the year's Victory Cups are played in Reload, and a Reload match
// seats forty players however the tournament pairs them up — so a Reload solo
// cup is forty in the lobby and a Battle Royale solo cup is a hundred.
function ccVictoryLobby(ev, solo){
  // Mobile Series: режим только для мобилы, 16 в лобби (страница серии Epic).
  if(ccIsMobSeries(ev)) return CC_MOBSER_LOBBY;
  if(ccIsReloadEv(ev)) return ccReloadLobby(solo?1:careerSquadSize());
  return solo ? 100 : ccTeams(50);
}
/* How many reach Round 2: four thousand, which is Epic's own number rather than
   a share of it — the same call the divisional quotas got. Tracker's leaderboard
   for S41_SoloVictoryCup Round 2 in Europe runs to 40 pages of 100.

   It is four thousand people, so a duos cup counts them as two thousand teams.
   Against the fields here that is one entrant in five either way, where Epic's
   own ninety thousand made it one in twenty-two — the room is the part this
   mode cannot hold, and the quota is the part it can. */
// Epic's 4,000 belonged to the 19,532-player room; the share is what carries
// to the user's smaller ladder: 20.5% of 4,200 solo players is 860.
const CC_VICTORY_R2_PLAYERS=860;
/* The room and the quota, in the teams this season plays in.

   careerLadderEntrants is the ladder counted in duos, and the quota is 860
   people: a solo cup is those people, a duo cup is half of them and a trio cup a
   third. Both were duo counts whatever season it was, so a trio Victory Cup ran
   a duo-sized room and advanced a duo-sized quota out of it. See ccTeams. */
function careerVictoryField(solo){
  return solo ? careerLadderEntrants()*2 : ccTeams(careerLadderEntrants());
}
function careerVictoryCut(solo){
  return solo ? CC_VICTORY_R2_PLAYERS : ccTeams(CC_VICTORY_R2_PLAYERS/2);
}
const CC_VICTORY_WIN_PTS=100, CC_VICTORY_CASH_SOLO=100, CC_VICTORY_CASH_DUO=200;
// Cumulative "reach top N", so the points for a place are every tier at or below
// it. Written as the sum rather than a 50-row table, because that is how Epic
// publishes it and a table would have to be checked row by row against this.
function victoryR1Points(place){
  if(!(place>0) || place>50) return 0;
  return (place<=1?7:0) + (place<=2?4:0) + (place<=3?2:0) + (50 - Math.max(place,4) + 1);
}
function victoryR2Points(place){ return place===1 ? CC_VICTORY_WIN_PTS : 0; }

/* The days it ran. One row per day rather than a span, because a Victory Cup
   does not keep a rhythm — Season 41's Reload cup ran on the 1st, the 11th and
   the 15th of August. Taken from the EU event pages:

     S39 Duos          5, 12, 19 January
     S39 Solo          8, 15 March
     S40 Solo          22, 29 March, 5, 12 April
     S41 Solo          13, 20 June, 18, 25 July
     S41 Solo Reload   1, 11, 15 August                                      */
/* Скин-капы: именные капы Epic с 2021-го (даты и формат: event-windows-eu, event-scoring-eu; tools/measured/skin-cups.json),
   скин по имени капа из fortnite-api. Денег не платят, награда скин сразу в шкафчик за верхнюю четверть первого раунда
   (порог наш: настоящие пороги у Epic свои, в архиве их нет). Только в настоящем году, 2027+ их нет. */
const CC_SKIN_CUPS=[
  {day:'2021-02-10',id:'S15_FlashCup',mode:'duo',n:1,fmt:true,name:"The Flash Cup",skin:'CID_A_010_Athena_Commando_M_Tar_46FMC',skinN:"The Flash"},
  {day:'2021-04-14',id:'S16_AloyCup',mode:'duo',n:1,fmt:true,name:"Aloy Cup",skin:'CID_A_062_Athena_Commando_F_Alchemy_XD6GP',skinN:"Aloy"},
  {day:'2021-04-28',id:'S16_NeymarJrCup',mode:'solo',n:1,fmt:true,name:"Neymar Jr Cup",skin:'CID_A_078_Athena_Commando_M_Bicycle',skinN:"Neymar Jr"},
  {day:'2021-05-12',id:'S16_TeenTitansCup',mode:'duo',n:1,fmt:true,name:"Teen Titans Cup",skin:'CID_A_092_Athena_Commando_M_Broccoli_PR297',skinN:"Beast Boy"},
  {day:'2021-05-27',id:'S16_DeathstrokeCup',mode:'solo',n:1,fmt:true,name:"Deathstroke Cup",skin:'CID_A_103_Athena_Commando_M_Grim_VM52M',skinN:"Deathstroke Zero"},
  {day:'2021-06-21',id:'S17_ThanosCup',mode:'duo',n:1,fmt:true,name:"Thanos Cup",skin:'CID_A_128_Athena_Commando_M_Menace',skinN:"Thanos"},
  {day:'2021-08-05',id:'S17_CammyCup',mode:'duo',n:1,fmt:true,name:"Cammy Cup",skin:'CID_A_162_Athena_Commando_F_Quarrel_E5D63',skinN:"Cammy"},
  {day:'2021-08-11',id:'S17_GamoraCup',mode:'duo',n:1,fmt:true,name:"Gamora Cup",skin:'CID_A_157_Athena_Commando_F_Stereo_3A08Z',skinN:"Gamora"},
  {day:'2021-08-18',id:'S17_WonderWomanCup',mode:'duo',n:1,fmt:true,name:"Wonder Woman Cup",skin:'CID_A_187_Athena_Commando_F_Monarch',skinN:"Wonder Woman"},
  {day:'2021-08-24',id:'S17_JBalvinCup',mode:'duo',n:1,fmt:true,name:"J Balvin Cup",skin:'CID_A_182_Athena_Commando_M_Vivid_LZGQ3',skinN:"J Balvin"},
  {day:'2022-02-07',id:'S19_SilkSonicCup',mode:'duo',n:1,fmt:true,name:"Silk Sonic Cup",skin:'CID_A_334_Athena_Commando_M_Sleek_U06KF',skinN:"Bruno Mars"},
  {day:'2022-03-24',id:'S20_ChloeKimCup',mode:'duo',n:1,fmt:true,name:"Chloe Kim Cup",skin:'CID_A_375_Athena_Commando_F_Snowfall_WXW2T',skinN:"Chloe Kim"},
  {day:'2022-05-18',id:'S20_AliaACup',mode:'duo',n:1,fmt:true,name:"Ali-A Cup",skin:'CID_A_415_Athena_Commando_M_Alfredo',skinN:"Ali-A"},
  {day:'2022-05-22',id:'S20_ObiWanCup',mode:'duo',n:1,fmt:true,name:"Obi-Wan Cup",skin:'CID_A_411_Athena_Commando_M_Noble',skinN:"Obi-Wan Kenobi"},
  {day:'2022-09-21',id:'S22_SypherPKIconCup',mode:'duo',n:1,fmt:true,name:"SypherPK Icon Cup",skin:'Character_Headset',skinN:"SypherPK"},
  {day:'2022-11-04',id:'S22_PoloStadiumCup',mode:'solo',n:1,fmt:true,name:"Polo Stadium Cup",skin:'Character_StallionAviator',skinN:"Polo Prodigy"},
  {day:'2023-01-24',id:'S23_thekidlaroi',mode:'duo',n:1,fmt:true,name:"The Kid LAROI Cup",skin:'Character_SunBurst',skinN:"The Kid LAROI"},
  {day:'2023-02-23',id:'S23_SuperFlakesCup',mode:'duo',n:1,fmt:true,name:"Super Flakes Cup",skin:'Character_OceanBreeze',skinN:"Flakes Power"},
  {day:'2023-03-01',id:'S23_CreedCup',mode:'solo',n:1,fmt:true,name:"Creed Cup",skin:'Character_InspireSpell',skinN:"Adonis Creed"},
  {day:'2023-04-12',id:'S24_RenegadeRunnerCupBuild',mode:'duo',n:1,fmt:true,name:"Renegade Runner Cup",skin:'Character_HeadhunterStar',skinN:"Renegade Runner"},
  {day:'2023-08-11',id:'S25_JJKCup',mode:'duo',n:1,fmt:true,name:"Jujutsu Kaisen Cup",skin:'Character_BirdNest',skinN:"Yuji Itadori"},
  {day:'2024-06-12',id:'S30_NickEh',mode:'duo',n:1,fmt:true,name:"Nick Eh 30 Cup",skin:'Character_WeaveHarbor',skinN:"Nick Eh 30"},
  {day:'2024-06-18',id:'S30_MetallicaCup',mode:'squad',n:1,fmt:true,name:"Metallica Cup",skin:'Character_GreatPool',skinN:"James Hetfield"},
  {day:'2024-09-21',id:'S31_RubiusIconCup',mode:'duo',n:1,fmt:true,name:"Rubius Icon Cup",skin:'Character_LivelyDomino',skinN:"Rubius"},
  {day:'2024-10-22',id:'S31_SymbioteCup',mode:'duo',n:1,fmt:true,name:"Symbiote Cup",skin:'Character_DoughDisk',skinN:"She-Venom"},
  {day:'2025-03-15',id:'S34_ShoheiOhtaniCup',mode:'solo',n:1,fmt:true,name:"Shohei Ohtani Cup",skin:'Character_VelvetDeskCam',skinN:"Shohei Ohtani"},
  {day:'2025-03-21',id:'S34_ClixIconCup',mode:'trio',n:1,fmt:true,name:"Clix Icon Cup",skin:'Character_TwilightSpotSpell',skinN:"Clix"},
  {day:'2025-08-06',id:'S36_RangerCup_Pink',mode:'solo',n:1,fmt:true,name:"Power Rangers Cup",skin:'Character_FumeFleeceJig',skinN:"Pink Ranger"},
  {day:'2025-08-06',id:'S36_RangerCup_Red',mode:'solo',n:1,fmt:true,name:"Power Rangers Cup",skin:'Character_FumeFleeceFade',skinN:"Red Ranger"},
  {day:'2025-08-15',id:'S37_AceWildCardCup',mode:'duo',n:1,fmt:true,name:"Aces Wild Card Cup",skin:'Character_HeistFNCS',skinN:"Aces Wild Card"},
  {day:'2025-08-17',id:'S37_ChampionCrystalCup',mode:'solo',n:1,fmt:true,name:"Champion Crystal Cup",skin:'Character_RowdyDevilFNCS',skinN:"Champion Crystal"},
  {day:'2025-08-31',id:'S37_SurfWitchCup',mode:'solo',n:1,fmt:true,name:"Surf Witch Cup",skin:'Character_PunkDevilSummerFNCS',skinN:"Champion Surf Witch"},
  {day:'2025-09-12',id:'S37_KaiCenatIconCup',mode:'solo',n:1,fmt:true,name:"Kai Cenat Icon Cup",skin:'Character_EssayViewMyth',skinN:"Kai Cenat"},
  {day:'2025-09-24',id:'S37_MrSavageIconCup',mode:'duo',n:1,fmt:true,name:"MrSavage Icon Cup",skin:'Character_PineTrimPack',skinN:"MrSavage"},
  {day:'2025-10-16',id:'S37_HauntedCupJason',mode:'duo',n:1,fmt:true,name:"Jason Cup",skin:'Character_GnatGala',skinN:"Jason "},
  {day:'2025-10-23',id:'S37_HauntedCupWednesday',mode:'duo',n:1,fmt:true,name:"Wednesday Cup",skin:'Character_PolkaSkate',skinN:"Wednesday Addams"},
  {day:'2025-11-21',id:'S38_StrangerThingsCup',mode:'solo',n:1,fmt:true,name:"Stranger Things Cup",skin:'Character_GroovyReader',skinN:"Eleven"},
  {day:'2025-12-19',id:'S39_BleachCup',mode:'solo',n:1,fmt:true,name:"Bleach Cup",skin:'Character_LatteStir',skinN:"Ichigo Kurosaki"},
  {day:'2026-01-13',id:'S39_KizunaAICup',mode:'duo',n:1,fmt:true,name:"KizunaAI Cup",skin:'Character_MarchTreatCup',skinN:"KizunaAI"},
  {day:'2026-02-06',id:'S39_KPDHCup',mode:'solo',n:1,fmt:true,name:"KPop Demon Hunters Cup",skin:'Character_LoanFloat',skinN:"Rumi (HUNTR/X)"},
  {day:'2026-02-19',id:'S39_SoloLevelingCup',mode:'solo',n:1,fmt:true,name:"Solo Leveling Cup",skin:'Character_RampCanal',skinN:"Sung Jinwoo"},
  {day:'2026-03-06',id:'S39_PickleRickCup',mode:'solo',n:1,fmt:true,name:"Pickle Rick Cup",skin:'Character_QuartzSqueak',skinN:"Pickle Rick"},
  {day:'2026-04-15',id:'S40_TripleThreatCup',mode:'trio',n:1,fmt:true,name:"Triple Threat Cup",skin:'Character_AlderOptic',skinN:"Triple Threat Sommerset"},
  {day:'2026-05-20',id:'S40_MandalorianCup',mode:'duo',n:1,fmt:true,name:"Mandalorian Cup",skin:'Character_ChiliAbide',skinN:"The Mandalorian (Pen & Ink)"},
  {day:'2026-05-26',id:'S40_TypicalGamerCup',mode:'solo',n:1,fmt:true,name:"Typical Gamer Cup",skin:'Character_QuarterClaspZoom',skinN:"Typical Gamer"},
  {day:'2026-06-10',id:'S41_ViniJr',mode:'trio',n:1,fmt:true,name:"Vini Jr. Cup",skin:'Character_ChewyStaveCurve',skinN:"Vini Jr."},
  {day:'2026-06-24',id:'S41_SupergirlCup',mode:'duo',n:1,fmt:true,name:"Supergirl Cup",skin:'Character_VowelSleep',skinN:"Supergirl"},
  {day:'2026-06-27',id:'S41_MongraalIconCup',mode:'duo',n:1,fmt:true,name:"Mongraal Icon Cup",skin:'Character_VigorKnackDill',skinN:"Mongraal"},
  {day:'2026-07-15',id:'S41_TheOdysseyCup',mode:'solo',n:1,fmt:true,name:"The Odyssey Cup",skin:'Character_HornetBerm',skinN:"Odysseus"},
  {day:'2026-07-17',id:'S41_DavidBeckham',mode:'trio',n:1,fmt:true,name:"David Beckham Cup",skin:'Character_CiderPetalClover',skinN:"David Beckham"},
  {day:'2026-08-28',id:'S42_CrashBandicootCup',mode:'duo',n:1,fmt:true,name:"Crash Bandicoot Cup",skin:'Character_SpruceBark',skinN:"Crash Bandicoot"},
  {day:'2026-09-08',id:'S42_MegaManCup',mode:'duo',n:1,fmt:true,name:"Mega Man Cup",skin:'Character_DuneBriefMerry',skinN:"Mega Man (Dual Override)"},
  {day:'2026-09-12',id:'S42_WeezyIconCup',mode:'solo',n:1,fmt:true,name:"Weezy Icon Cup",skin:'Character_NoiseClueGust',skinN:"Weezy"},
  {day:'2026-09-15',id:'S42_IronmouseIconCup',mode:'duo',n:1,fmt:true,name:"Ironmouse Icon Cup",skin:'Character_FeelUnionSki',skinN:"Ironmouse"},
  {day:'2026-09-18',id:'S42_KingdomHeartsCup',mode:'solo',n:1,fmt:true,name:"Kingdom Hearts Cup",skin:'Character_SpireTend',skinN:"Sora"},
  {day:'2026-09-24',id:'S42_MadisonBeerIconCup',mode:'duo',n:1,fmt:true,name:"Madison Beer Icon Cup",skin:'Character_MistTycoonLife',skinN:"Satin Angel Madison"},
  {day:'2026-09-25',id:'S42_Persona5Cup',mode:'solo',n:1,fmt:true,name:"Persona 5 Cup",skin:'Character_CosmicTrellis',skinN:"Joker (P5R)"},
  {day:'2026-11-06',id:'S43_OnePieceZoroCup',mode:'trio',n:1,fmt:true,name:"One Piece Zoro Cup",skin:'Character_BrandCreed',skinN:"Roronoa Zoro"}
];
const CC_S43_TRIOS_PAY={"EU":[[1,4000],[2,1250],[3,900],[10,400],[15,300],[25,150]],"OCE":[[1,625],[2,400],[3,300],[5,200],[25,100]],"BR":[[1,625],[2,400],[3,300],[5,200],[25,100]],"ASIA":[[1,625],[2,400],[3,300],[5,200],[25,100]],"ME":[[1,625],[2,400],[3,300],[5,200],[25,100]],"NAC":[[1,4000],[2,1250],[3,900],[10,400],[15,225],[25,100]]};
const CC_VICTORY=[
  /* Микро-ланы — его пункт 11 со страницы «ы», 22 августа: «дримхак». Два
     комьюнити-лана в год той же машинерией Victory Cup: вечер на два раунда,
     сотня за победу во втором. lan несёт своё имя вместо сезонного; торговую
     марку DreamHack не берём — DreamCup читается сам. */
  {day:'2026-02-22', id:'DreamCupWinter', mode:'duo', n:1, lan:'DreamCup Winter'},
  {day:'2026-09-06', id:'DreamCupAutumn', mode:'duo', n:1, lan:'DreamCup Autumn'},
  {day:'2026-01-05', id:'S39_DuosVictoryCup',        mode:'duo',  n:1},
  {day:'2026-01-12', id:'S39_DuosVictoryCup',        mode:'duo',  n:2},
  {day:'2026-01-19', id:'S39_DuosVictoryCup',        mode:'duo',  n:3},
  {day:'2026-03-08', id:'S39_SoloVictoryCup',        mode:'solo', n:1},
  {day:'2026-03-15', id:'S39_SoloVictoryCup',        mode:'solo', n:2},
  {day:'2026-03-22', id:'S40_SoloVictoryCup',        mode:'solo', n:1},
  {day:'2026-03-29', id:'S40_SoloVictoryCup',        mode:'solo', n:2},
  {day:'2026-04-05', id:'S40_SoloVictoryCup',        mode:'solo', n:3},
  {day:'2026-04-12', id:'S40_SoloVictoryCup',        mode:'solo', n:4},
  {day:'2026-06-13', id:'S41_SoloVictoryCup',        mode:'solo', n:1},
  {day:'2026-06-20', id:'S41_SoloVictoryCup',        mode:'solo', n:2},
  {day:'2026-07-18', id:'S41_SoloVictoryCup',        mode:'solo', n:3},
  {day:'2026-07-25', id:'S41_SoloVictoryCup',        mode:'solo', n:4},
  {day:'2026-08-01', id:'S41_ReloadSoloVictoryCup',  mode:'solo', n:1},
  {day:'2026-08-11', id:'S41_ReloadSoloVictoryCup',  mode:'solo', n:2},
  {day:'2026-08-15', id:'S41_ReloadSoloVictoryCup',  mode:'solo', n:3},
  // S43: Squads Victory Cup 9 и 23 ноября (календарь Epic, два раунда одним вечером). Состав на турнир — четвёрка (fmt).
  {day:'2026-11-09', id:'S43_SquadsVictoryCup',      mode:'squad', n:1, fmt:true, name:'Squads Victory Cup', cash:100},
  {day:'2026-11-23', id:'S43_SquadsVictoryCup',      mode:'squad', n:2, fmt:true, name:'Squads Victory Cup', cash:100},
  // S43: Trios Cash Cup, даты календаря Epic. Таблицы S43 в архиве нет, призы последнего Trios Cash Cup из архива Tracker (S31).
  {day:'2026-11-07', id:'S43_TriosCashCup', mode:'trio', n:1, fmt:true, name:'Trios Cash Cup', payT:CC_S43_TRIOS_PAY},
  {day:'2026-11-14', id:'S43_TriosCashCup', mode:'trio', n:2, fmt:true, name:'Trios Cash Cup', payT:CC_S43_TRIOS_PAY},
  {day:'2026-11-22', id:'S43_TriosCashCup', mode:'trio', n:3, fmt:true, name:'Trios Cash Cup', payT:CC_S43_TRIOS_PAY}
];
/* Дуо-капы с деньгами в 2025-м (с архива Tracker): Squid Grounds Cash Cup
   (S36, три капа, $100 на игрока за победу во втором раунде) и Reload Quick Cup
   (5 сентября, единственный до Лиона; $200 на игрока за победу в третьем
   раунде). Играются тем же составом, что и сезон, — как и Victory Cup в
   трио-год 2026-го. cash — на игрока; умножается на состав. */
const CC_VICTORY_2025=[
  {day:'2025-07-18', id:'S36_SquidGroundsCashCup', mode:'duo', n:1, name:'Squid Grounds Cash Cup', cash:100},
  {day:'2025-07-25', id:'S36_SquidGroundsCashCup', mode:'duo', n:2, name:'Squid Grounds Cash Cup', cash:100},
  {day:'2025-08-01', id:'S36_SquidGroundsCashCup', mode:'duo', n:3, name:'Squid Grounds Cash Cup', cash:100}
  // Reload Quick Cup 5.09 снят: Reload — только в 2026-м (отзыв).
];
// ==== Cups archive (tools/build-cups-archive.js) ====
const CC_CUPS_ARCH_PAY=[{EU:[[1,30000],[2,15000],[3,13750],[4,12500],[5,11250],[6,10000],[7,9250],[8,8500],[9,7750],[10,7000],[11,6250],[12,4750],[13,4500],[14,4250],[15,4000],[16,3750],[17,3500],[18,3250],[19,3000],[20,2750],[30,2500],[35,2000],[40,1750],[50,1000],[75,750],[100,500]]},{EU:[[1,2100],[2,1700],[3,1500],[4,1250],[5,1000],[6,850],[7,750],[8,650],[9,500],[20,400],[50,300],[100,200]],NAC:[[1,2000],[2,1500],[3,1300],[4,1200],[5,900],[6,800],[7,700],[8,600],[9,450],[20,350],[50,250]],NAW:[[1,1300],[2,1000],[3,900],[4,800],[5,700],[6,600],[7,500],[8,350],[9,300],[20,200]],OCE:[[1,1200],[2,900],[3,800],[4,650],[5,550]],BR:[[1,1300],[2,1000],[3,900],[4,800],[5,700],[6,600],[7,500],[8,350],[9,300],[20,200]],ASIA:[[1,1200],[2,900],[3,800],[4,650],[5,550]],ME:[[1,1200],[2,900],[3,800],[4,650],[5,550]]},{EU:[[1,6000],[2,5000],[3,4200],[4,3600],[5,3100],[6,2700],[7,2400],[8,2200],[9,2000],[10,1800],[20,1600],[30,1400],[40,1200],[50,1000],[75,800],[100,700],[125,600],[150,500]],NAC:[[1,5000],[2,4200],[3,3500],[4,3100],[5,2800],[6,2500],[7,2200],[8,1900],[9,1700],[10,1500],[20,1300],[30,1000],[40,900],[50,800],[75,600]],NAW:[[1,3000],[2,2500],[3,1800],[4,1600],[5,1400],[6,1200],[7,1100],[8,1000],[9,900],[10,800],[20,600],[30,500],[40,400],[50,300]],OCE:[[1,2500],[2,2200],[3,1800],[4,1500],[5,1300],[6,1200],[7,1100],[8,900],[9,700],[10,500],[20,300]],BR:[[1,3000],[2,2500],[3,1800],[4,1600],[5,1400],[6,1200],[7,1100],[8,1000],[9,900],[10,800],[20,600],[30,500],[40,400],[50,300]],ASIA:[[1,2500],[2,2200],[3,1800],[4,1500],[5,1300],[6,1200],[7,1100],[8,900],[9,700],[10,500],[20,300]]},{EU:[[1,5000],[2,4300],[3,3400],[4,3100],[5,2700],[6,2400],[7,2100],[8,1800],[9,1500],[10,1200],[20,1000],[30,900],[50,800],[75,600],[100,500],[200,400],[250,300],[275,200]],NAC:[[1,4000],[2,3300],[3,3000],[4,2700],[5,2400],[6,2000],[7,1800],[8,1500],[9,1200],[10,1000],[30,800],[50,600],[75,400],[150,300]],NAW:[[1,3000],[2,2500],[3,1800],[4,1600],[5,1400],[6,1200],[7,1100],[8,1000],[9,900],[10,800],[20,600],[30,500],[40,400],[50,300]],OCE:[[1,2500],[2,2200],[3,1800],[4,1500],[5,1300],[6,1200],[7,1100],[8,900],[9,700],[10,500],[20,300]],BR:[[1,3000],[2,2500],[3,1800],[4,1600],[5,1400],[6,1200],[7,1100],[8,1000],[9,900],[10,800],[20,600],[30,500],[40,400],[50,300]],ASIA:[[1,2500],[2,2200],[3,1800],[4,1500],[5,1300],[6,1200],[7,1100],[8,900],[9,700],[10,500],[20,300]]},{EU:[[1,3000],[3,1800],[5,1400],[8,1000],[10,600],[22,400],[30,200]],NAC:[[1,2500],[3,1500],[5,1000],[8,700],[10,500],[22,300],[30,100]],NAW:[[1,1300],[3,800],[5,500],[8,300],[10,100]],OCE:[[1,1000],[3,400],[5,200],[8,100]],BR:[[1,1300],[3,750],[5,325],[8,100]],ASIA:[[1,1300],[3,750],[5,325],[8,100]]},{EU:[[1,4500],[2,3500],[3,3000],[4,2500],[5,2250],[6,2000],[7,1750],[8,1600],[9,1500],[10,1400],[20,1300],[30,1200],[40,1100],[50,1000],[75,900],[100,700],[250,600],[500,300],[2500,200]],NAC:[[1,4000],[2,3250],[3,2750],[4,2250],[5,2000],[6,1700],[7,1600],[8,1500],[9,1400],[10,1300],[20,1200],[30,1100],[40,1000],[50,900],[75,800],[100,650],[250,450],[500,250],[1500,200]],NAW:[[1,3000],[2,2500],[3,2250],[4,2000],[5,1800],[6,1500],[7,1400],[8,1300],[9,1200],[10,1050],[20,900],[30,750],[40,600],[50,450],[75,400],[100,350],[250,300],[500,250]],OCE:[[1,2600],[2,2250],[3,2000],[4,1500],[5,1400],[6,1300],[7,1250],[8,1200],[9,1100],[10,900],[20,750],[30,600],[40,450],[50,400],[75,350],[100,300],[250,200]],BR:[[1,3000],[2,2500],[3,2250],[4,2000],[5,1800],[6,1500],[7,1400],[8,1300],[9,1200],[10,1050],[20,900],[30,750],[40,600],[50,450],[75,400],[100,350],[250,300],[500,250]],ASIA:[[1,2600],[2,2250],[3,2000],[4,1500],[5,1400],[6,1300],[7,1250],[8,1200],[9,1100],[10,900],[20,750],[30,600],[40,450],[50,400],[75,350],[100,300],[250,200]],ME:[[1,2600],[2,2250],[3,2000],[4,1500],[5,1400],[6,1300],[7,1250],[8,1200],[9,1100],[10,900],[20,750],[30,600],[40,450],[50,400],[75,350],[100,300],[250,200]]},{EU:[[1,2500],[5,1500],[10,1000],[20,750],[30,400],[60,250],[90,150],[120,100]],NAC:[[1,2500],[5,1500],[10,1000],[20,500],[30,250],[60,200],[90,100]],NAW:[[1,1300],[5,800],[10,500],[20,200],[30,100]],OCE:[[1,1000],[5,500],[10,200],[20,100]],BR:[[1,1300],[5,800],[10,400],[20,100]],ASIA:[[1,1300],[5,800],[10,400],[20,100]]},{EU:[[1,1750],[5,1500],[10,1000],[16,500],[25,250]],NAC:[[1,1250],[5,1000],[10,750],[16,400],[25,150]],NAW:[[1,500],[5,400],[10,250],[25,100]],OCE:[[1,500],[5,400],[10,250],[25,100]],BR:[[1,500],[5,400],[10,250],[25,100]],ASIA:[[1,500],[5,400],[10,250],[25,100]]},{EU:[[1,10000],[2,8000],[3,7500],[4,7000],[5,6500],[6,6000],[7,5500],[8,5000],[9,4500],[10,4000],[15,2000],[20,1000],[25,500],[30,250]]},{EU:[[35,600],[400,400]],NAC:[[25,600],[250,400]],NAW:[[15,600],[95,400]],OCE:[[10,600],[45,400]],BR:[[15,600],[95,400]],ASIA:[[10,600],[45,400]],ME:[[10,600],[45,400]]},{EU:[[1,2000],[2,1750],[3,1500],[4,1350],[5,1300],[6,1250],[7,1200],[8,1150],[9,1100],[10,1000],[20,900],[30,750],[40,650],[50,550],[75,500],[100,450],[250,400],[500,300]],NAC:[[1,1750],[2,1500],[3,1350],[4,1300],[5,1250],[6,1200],[7,1150],[8,1050],[9,1000],[10,900],[20,750],[30,700],[40,550],[50,500],[75,475],[100,425],[250,375]],NAW:[[1,1500],[2,1250],[3,1150],[4,1000],[5,950],[6,900],[7,850],[8,800],[9,750],[10,700],[20,600],[30,500],[40,450],[50,425],[75,400],[100,375]],OCE:[[1,1250],[2,1000],[3,950],[4,900],[5,850],[6,800],[7,750],[8,700],[9,650],[10,600],[20,500],[30,450],[40,350],[50,250],[75,200]],BR:[[1,1500],[2,1250],[3,1150],[4,1000],[5,950],[6,900],[7,850],[8,800],[9,750],[10,700],[20,600],[30,500],[40,450],[50,425],[75,400],[100,375]],ASIA:[[1,1250],[2,1000],[3,950],[4,900],[5,850],[6,800],[7,750],[8,700],[9,650],[10,600],[20,500],[30,450],[40,350],[50,250],[75,200]],ME:[[1,1250],[2,1000],[3,950],[4,900],[5,850],[6,800],[7,750],[8,700],[9,650],[10,600],[20,500],[30,450],[40,350],[50,250],[75,200]]},{EU:[[1,12000],[2,7050],[3,5750],[4,4800],[5,3925],[6,2900],[7,2350],[8,2050],[9,1800],[10,1550],[15,1300],[20,900],[25,550],[35,400],[50,300]],NAC:[[1,7500],[2,4500],[3,3625],[4,2925],[5,2450],[6,1850],[7,1450],[8,1275],[9,1125],[10,950],[15,800],[20,500],[25,300],[35,250],[50,200]],NAW:[[1,3250],[2,2000],[3,1475],[4,1150],[5,950],[6,750],[7,625],[8,525],[9,450],[10,400],[15,300],[20,250],[25,225],[35,200]]},{EU:[[1,16000],[2,8000],[3,7400],[4,6700],[5,6100],[6,5400],[7,5000],[8,4600],[9,4100],[10,3750],[11,3300],[12,2500],[13,2400],[14,2300],[15,2100],[16,2000],[17,1900],[18,1700],[19,1600],[20,1500],[30,1300],[35,1050],[40,900],[75,400],[100,300]],NAC:[[1,10000],[2,5000],[3,4700],[4,4300],[5,3850],[6,3400],[7,3050],[8,2800],[9,2600],[10,2300],[11,2100],[12,1600],[13,1500],[14,1400],[15,1300],[16,1250],[17,1150],[18,1100],[19,1000],[20,900],[30,800],[35,650],[40,450],[75,250],[100,200]],NAW:[[1,4000],[2,2000],[3,1800],[4,1650],[5,1500],[6,1350],[7,1150],[8,1050],[9,950],[10,850],[11,750],[12,650],[13,600],[14,550],[15,500],[16,450],[17,400],[18,375],[19,350],[20,325],[30,275],[35,245],[40,225],[75,200]]},{EU:[[1,4000],[2,3500],[3,3000],[4,2000],[5,1500],[6,1200],[7,900],[8,700],[9,500],[10,400],[14,300],[30,200]],NAC:[[1,3000],[2,2500],[3,2000],[4,1500],[5,1200],[6,1000],[7,600],[8,500],[9,400],[10,300],[14,200]],NAW:[[1,1200],[2,1000],[3,800],[4,700],[5,600],[6,500],[7,400],[8,300],[9,250],[10,200]],OCE:[[1,600],[2,500],[3,500],[4,350],[5,300],[6,250],[7,200]],BR:[[1,1200],[2,1000],[3,800],[4,700],[5,600],[6,500],[7,400],[8,300],[9,250],[10,200]],ASIA:[[1,600],[2,500],[3,500],[4,350],[5,300],[6,250],[7,200]],ME:[[1,600],[2,500],[3,500],[4,350],[5,300],[6,250],[7,200]]},{EU:[[1,1800],[2,1600],[3,1400],[4,1200],[5,1000],[6,800],[7,600],[8,500],[9,400],[10,300],[20,200]],NAC:[[1,1500],[2,1200],[3,900],[4,700],[5,500],[6,400],[7,350],[8,300],[9,250],[10,200]],NAW:[[1,500],[2,400],[3,350],[4,300],[5,275],[6,250],[7,225],[8,200]],OCE:[[1,300],[2,250],[3,200]],BR:[[1,500],[2,400],[3,350],[4,300],[5,275],[6,250],[7,225],[8,200]],ASIA:[[1,300],[2,250],[3,200]],ME:[[1,300],[2,250],[3,200]]},{EU:[[1,1000],[2,900],[3,800],[4,700],[5,600],[6,500],[7,400],[8,300],[9,250],[10,200]],NAC:[[1,700],[2,600],[3,500],[4,400],[5,350],[6,300],[7,250],[8,200]],NAW:[[1,400],[2,350],[3,300],[4,250],[5,200]],OCE:[[1,300],[2,250],[3,200]],BR:[[1,400],[2,350],[3,300],[4,250],[5,200]],ASIA:[[1,300],[2,250],[3,200]],ME:[[1,300],[2,250],[3,200]]},{EU:[[1,16000],[2,8000],[3,7400],[4,6700],[5,6100],[6,5400],[7,5000],[8,4600],[9,4100],[10,3750],[11,3300],[12,2500],[13,2400],[14,2300],[15,2100],[16,2000],[17,1900],[18,1700],[19,1600],[20,1500],[30,1300],[35,1050],[40,900],[50,500],[75,400],[100,300]],NAC:[[1,10000],[2,5000],[3,4700],[4,4300],[5,3850],[6,3400],[7,3050],[8,2800],[9,2600],[10,2300],[11,2100],[12,1600],[13,1500],[14,1400],[15,1300],[16,1250],[17,1150],[18,1100],[19,1000],[20,900],[30,800],[35,650],[40,450],[50,300],[75,250],[100,200]],NAW:[[1,4000],[2,2000],[3,1800],[4,1650],[5,1500],[6,1350],[7,1150],[8,1050],[9,950],[10,850],[11,750],[12,650],[13,600],[14,550],[15,500],[16,450],[17,400],[18,375],[19,350],[20,325],[30,275],[35,245],[40,225],[75,200]]},{EU:[[1,1333],[2,800],[3,600],[4,400],[5,200]]},{EU:[[1,750],[2,600],[3,550],[4,500],[5,450],[6,400],[7,375],[8,350],[9,325],[10,300],[14,275],[20,250],[30,225],[50,200]],NAC:[[1,600],[2,500],[3,450],[4,425],[5,400],[6,375],[7,350],[8,325],[9,300],[10,275],[14,250],[20,225],[30,200]],NAW:[[1,500],[2,450],[3,400],[4,375],[5,350],[6,325],[7,300],[8,275],[9,225],[10,200]],OCE:[[1,350],[2,300],[3,280],[4,260],[5,240],[6,220],[7,200]],BR:[[1,500],[2,450],[3,400],[4,375],[5,350],[6,325],[7,300],[8,275],[9,225],[10,200]],ASIA:[[1,350],[2,300],[3,280],[4,260],[5,240],[6,220],[7,200]],ME:[[1,350],[2,300],[3,280],[4,260],[5,240],[6,220],[7,200]]},{EU:[[1,300],[2,275],[3,250],[4,225],[14,200]],NAC:[[1,250],[2,225],[10,200]],NAW:[[1,250],[2,225],[4,200]],OCE:[[1,250],[2,225],[3,200]],BR:[[1,250],[2,225],[4,200]],ASIA:[[1,250],[2,225],[3,200]],ME:[[1,250],[2,225],[3,200]]},{EU:[[1,7000],[2,3250],[3,2000],[4,1500],[5,1250],[10,1000]],NAC:[[1,4375],[2,2050],[3,1250],[4,925],[5,775],[10,625]],NAW:[[1,1750],[2,825],[3,500],[4,375],[5,300],[10,250]],OCE:[[1,1250],[2,500],[3,325],[4,225],[5,200]],BR:[[1,1750],[2,825],[3,500],[4,375],[5,300],[10,250]],ASIA:[[1,1250],[2,500],[3,325],[4,225],[5,200]],ME:[[1,1250],[2,500],[3,325],[4,225],[5,200]]},{EU:[[1,14000],[2,6500],[3,4000],[4,3000],[5,2500],[10,2000]],NAC:[[1,8750],[2,4100],[3,2500],[4,1850],[5,1550],[10,1250]],NAW:[[1,3500],[2,1650],[3,1000],[4,750],[5,600],[10,500]],OCE:[[1,2500],[2,1000],[3,650],[4,450],[5,400]],BR:[[1,3500],[2,1650],[3,1000],[4,750],[5,600],[10,500]],ASIA:[[1,2500],[2,1000],[3,650],[4,450],[5,400]],ME:[[1,2500],[2,1000],[3,650],[4,450],[5,400]]},{EU:[[1,3000],[2,2000],[3,1500],[4,1200],[5,1000],[6,700],[7,400],[8,200]]},{EU:[[10,250]]},{EU:[[1,400],[2,300],[3,200]],NAC:[[1,400],[2,300],[3,200]],NAW:[[1,400],[2,300],[3,200]],OCE:[[1,400],[2,300],[3,200]],BR:[[1,400],[2,300],[3,200]],ASIA:[[1,400],[2,300],[3,200]],ME:[[1,400],[2,300],[3,200]]},{EU:[[1,1334],[2,800],[3,600],[4,400],[5,200]]},{EU:[[1,5000],[2,3000],[3,2000]]},{EU:[[1,1500],[2,1300],[3,1100],[4,900],[5,800],[6,650],[7,600],[8,550],[9,530],[14,480],[25,420],[50,400]],NAC:[[1,1350],[2,1200],[3,1000],[4,800],[5,700],[6,650],[7,600],[8,550],[9,500],[14,450],[25,400]],NAW:[[1,1250],[2,1100],[3,950],[4,900],[5,800]],OCE:[[1,600],[2,550],[3,500],[4,450],[5,400]],BR:[[1,1250],[2,1100],[3,950],[4,900],[5,800]],ASIA:[[1,600],[2,550],[3,500],[4,450],[5,400]],ME:[[1,600],[2,550],[3,500],[4,450],[5,400]]},{EU:[[1,375]],NAC:[[1,375]],NAW:[[1,375]],OCE:[[1,375]],BR:[[1,375]],ASIA:[[1,375]],ME:[[1,375]]},{EU:[[1,3000],[2,2300],[3,2000],[4,1800],[5,1700],[6,1600],[7,1500],[8,1400],[9,1200],[10,1100],[20,900],[30,800],[40,700],[50,600],[75,500],[100,400],[250,350],[500,250],[1000,225],[1500,200]],NAC:[[1,2500],[2,2000],[3,1875],[4,1700],[5,1600],[6,1500],[7,1400],[8,1300],[9,1100],[10,900],[20,800],[30,700],[40,500],[50,400],[75,300],[100,275],[250,250],[500,225],[1000,200]],NAW:[[1,1200],[2,900],[3,715],[4,600],[5,550],[6,500],[7,450],[8,400],[9,375],[10,350],[20,325],[30,300],[40,275],[50,250],[75,230],[100,220],[250,210],[500,200]],OCE:[[1,500],[2,400],[3,300],[4,275],[5,265],[6,255],[7,250],[8,245],[9,240],[10,235],[20,230],[30,225],[40,220],[50,215],[75,210],[100,205],[250,200]],BR:[[1,1200],[2,900],[3,715],[4,600],[5,550],[6,500],[7,450],[8,400],[9,375],[10,350],[20,325],[30,300],[40,275],[50,250],[75,230],[100,220],[250,210],[500,200]],ASIA:[[1,500],[2,400],[3,300],[4,275],[5,265],[6,255],[7,250],[8,245],[9,240],[10,235],[20,230],[30,225],[40,220],[50,215],[75,210],[100,205],[250,200]],ME:[[1,500],[2,400],[3,300],[4,275],[5,265],[6,255],[7,250],[8,245],[9,240],[10,235],[20,230],[30,225],[40,220],[50,215],[75,210],[100,205],[250,200]]},{EU:[[1,750],[2,650],[3,550],[4,475],[5,400],[6,325],[7,300],[8,275],[9,265],[14,240],[25,210],[50,200]],NAC:[[1,675],[2,600],[3,500],[4,400],[5,350],[6,325],[7,300],[8,275],[9,250],[14,225],[25,200]],NAW:[[1,625],[2,550],[3,475],[4,450],[5,400]],OCE:[[1,300],[2,275],[3,250],[4,225],[5,200]],BR:[[1,625],[2,550],[3,475],[4,450],[5,400]],ASIA:[[1,300],[2,275],[3,250],[4,225],[5,200]],ME:[[1,300],[2,275],[3,250],[4,225],[5,200]]},{EU:[[1,11500],[2,7000],[3,5400],[4,4600],[5,3775],[6,2750],[7,2200],[8,1925],[9,1650],[10,1450],[15,1200],[20,850],[25,500],[35,375],[50,250]],NAC:[[1,6750],[2,4000],[3,3300],[4,2650],[5,2225],[6,1700],[7,1325],[8,1175],[9,1025],[10,850],[15,725],[20,450],[25,275],[35,225],[50,200]]},{EU:[[1,4667],[2,2167],[3,1334],[4,1000],[5,834],[6,667],[7,667],[8,667],[9,667],[10,667]],NAC:[[1,2917],[2,1367],[3,834],[4,617],[5,517],[6,417],[7,417],[8,417],[9,417],[10,417]],NAW:[[1,1167],[2,550],[3,334],[4,250],[5,200],[6,200],[7,200],[8,200],[9,200],[10,200]],OCE:[[1,834],[2,334],[3,217],[4,200],[5,200]],BR:[[1,1167],[2,550],[3,334],[4,250],[5,200],[6,200],[7,200],[8,200],[9,200],[10,200]],ASIA:[[1,834],[2,334],[3,217],[4,200],[5,200]],ME:[[1,834],[2,334],[3,217],[4,200],[5,200]]},{EU:[[1,10000],[2,5000],[3,2500],[4,1500],[5,1000]],NAC:[[1,5000],[2,2500],[3,1250],[4,750],[5,500]],NAW:[[1,2500],[2,1500],[3,1000]],OCE:[[1,1500],[2,700],[3,300]],BR:[[1,4000],[2,2000],[3,1000],[4,500]],ASIA:[[1,1500],[2,700],[3,300]],ME:[[1,1500],[2,700],[3,300]]},{EU:[[1,300],[2,200],[3,200],[4,200]],NAW:[[1,200],[2,200]],OCE:[[1,200]],BR:[[1,200],[2,200]],ASIA:[[1,200],[2,200]],ME:[[1,200]]},{EU:[[1,1000],[2,600],[3,400],[4,200],[5,200],[6,200],[7,200],[8,200],[9,200],[10,200]],NAC:[[1,1000],[2,600],[3,400],[4,200],[5,200],[6,200],[7,200],[8,200],[9,200],[10,200]],NAW:[[1,1000],[2,600],[3,400],[4,200],[5,200],[6,200],[7,200],[8,200],[9,200],[10,200]],OCE:[[1,1000],[2,600],[3,400],[4,200],[5,200],[6,200],[7,200],[8,200],[9,200],[10,200]],BR:[[1,1000],[2,600],[3,400],[4,200],[5,200],[6,200],[7,200],[8,200],[9,200],[10,200]],ASIA:[[1,1000],[2,600],[3,400],[4,200],[5,200],[6,200],[7,200],[8,200],[9,200],[10,200]],ME:[[1,1000],[2,600],[3,400],[4,200],[5,200],[6,200],[7,200],[8,200],[9,200],[10,200]]},{EU:[[1,500],[2,400],[3,300],[4,150],[5,150],[6,150],[7,150],[8,150],[9,150],[10,150]],NAC:[[1,500],[2,400],[3,300],[4,150],[5,150],[6,150],[7,150],[8,150],[9,150],[10,150]],NAW:[[1,500],[2,400],[3,300],[4,150],[5,150],[6,150],[7,150],[8,150],[9,150],[10,150]],OCE:[[1,500],[2,400],[3,300],[4,150],[5,150],[6,150],[7,150],[8,150],[9,150],[10,150]],BR:[[1,500],[2,400],[3,300],[4,150],[5,150],[6,150],[7,150],[8,150],[9,150],[10,150]],ASIA:[[1,500],[2,400],[3,300],[4,150],[5,150],[6,150],[7,150],[8,150],[9,150],[10,150]],ME:[[1,500],[2,400],[3,300],[4,150],[5,150],[6,150],[7,150],[8,150],[9,150],[10,150]]},{EU:[[1,400],[2,200],[3,200],[4,200],[5,200]],NAC:[[1,400],[2,200],[3,200],[4,200],[5,200]],NAW:[[1,400],[2,200],[3,200],[4,200],[5,200]],OCE:[[1,400],[2,200],[3,200],[4,200],[5,200]],BR:[[1,400],[2,200],[3,200],[4,200],[5,200]],ASIA:[[1,400],[2,200],[3,200],[4,200],[5,200]],ME:[[1,400],[2,200],[3,200],[4,200],[5,200]]},{EU:[[1,300],[4,200]],NAC:[[1,250],[4,200]],NAW:[[2,200]],OCE:[[1,200]],BR:[[2,200]],ASIA:[[2,200]],ME:[[1,200]]},{EU:[[1,12000],[2,6000],[3,5500],[4,5000],[5,4500],[6,4000],[7,3700],[8,3400],[9,3100],[10,2800],[11,2500],[12,1900],[13,1800],[14,1700],[15,1600],[16,1500],[17,1400],[18,1300],[19,1200],[20,1100],[30,1000],[35,800],[40,700],[50,400],[75,300],[100,200]]},{EU:[[5,200]],NAW:[[3,200]],OCE:[[2,200]],BR:[[3,200]],ASIA:[[3,200]],ME:[[2,200]]},{EU:[[5,600]],NAC:[[3,600]],NAW:[[3,600]],OCE:[[2,600]],BR:[[3,600]],ASIA:[[3,600]],ME:[[2,600]]},{EU:[[5,200]],NAC:[[4,200]],NAW:[[4,200]],OCE:[[2,200]],BR:[[4,200]],ASIA:[[4,200]],ME:[[2,200]]},{EU:[[100,100],[200,200],[300,300]],OCE:[[100,100],[200,200],[300,300]],BR:[[100,100],[200,200],[300,300]],ASIA:[[100,100],[200,200],[300,300]],ME:[[100,100],[200,200],[300,300]],NAC:[[100,100],[200,200],[300,300]]},{EU:[[3,500],[5,400],[10,300],[20,250],[25,200]]},{EU:[[3,250],[5,200],[10,150],[20,125],[25,100]]},{EU:[[1,1200]],OCE:[[1,250]],BR:[[1,400]],ASIA:[[1,400]],ME:[[1,250]]},{EU:[[1,200],[2,200],[3,200],[4,200],[5,200]],NAC:[[1,200],[2,200],[3,200],[4,200],[5,200]]},{EU:[[1,3000],[2,1800],[3,1200],[4,300],[5,300],[6,300],[7,300],[8,300],[9,300],[10,300],[11,300],[12,300],[13,300],[14,300],[15,300],[16,150],[17,150],[18,150],[19,150],[20,150],[21,150],[22,150],[23,150],[24,150],[25,150],[26,150],[27,150],[28,150],[29,150],[30,150]],NAC:[[1,2000],[2,1200],[3,800],[4,400],[5,400],[6,150],[7,150],[8,150],[9,150],[10,150],[11,150],[12,150],[13,150],[14,150],[15,150]],NAW:[[1,1000],[2,600],[3,400],[4,200],[5,200],[6,200],[7,200],[8,200],[9,200],[10,200]],OCE:[[1,1000],[2,600],[3,400],[4,200],[5,200],[6,200],[7,200],[8,200],[9,200],[10,200]],BR:[[1,1000],[2,600],[3,400],[4,200],[5,200],[6,200],[7,200],[8,200],[9,200],[10,200]],ASIA:[[1,1000],[2,600],[3,400],[4,200],[5,200],[6,200],[7,200],[8,200],[9,200],[10,200]],ME:[[1,1000],[2,600],[3,400],[4,200],[5,200],[6,200],[7,200],[8,200],[9,200],[10,200]]},{EU:[[1,1000],[2,750],[3,500],[4,300],[5,300],[6,300],[7,300],[8,300],[9,300],[10,300]],NAC:[[1,750],[2,500],[3,300],[4,300],[5,300],[6,300],[7,300],[8,300],[9,300],[10,300]],NAW:[[1,500],[2,300],[3,300],[4,300],[5,300]],OCE:[[1,500],[2,300],[3,300],[4,300],[5,300]],BR:[[1,500],[2,300],[3,300],[4,300],[5,300]],ASIA:[[1,500],[2,300],[3,300],[4,300],[5,300]],ME:[[1,500],[2,300],[3,300],[4,300],[5,300]]},{EU:[[1,3000],[2,1000],[3,750],[10,300],[15,250],[25,150]],OCE:[[1,600],[2,300],[3,200],[25,100]],BR:[[1,600],[2,300],[3,200],[25,100]],ASIA:[[1,600],[2,300],[3,200],[25,100]],ME:[[1,600],[2,300],[3,200],[25,100]],NAC:[[1,3000],[2,1000],[3,750],[10,300],[15,250],[25,150]]},{EU:[[1,600],[2,300],[10,200]],OCE:[[1,300],[2,200],[3,150],[10,100]],BR:[[1,300],[2,200],[3,150],[10,100]],ASIA:[[1,300],[2,200],[3,150],[10,100]],ME:[[1,300],[2,200],[3,150],[10,100]],NAC:[[1,600],[2,300],[10,200]]},{EU:[[1,1000],[2,750],[3,500],[8,250],[10,125]],OCE:[[1,375],[2,200],[3,150],[6,125],[10,100]],BR:[[1,375],[2,200],[3,150],[6,125],[10,100]],ASIA:[[1,375],[2,200],[3,150],[6,125],[10,100]],ME:[[1,375],[2,200],[3,150],[6,125],[10,100]],NAC:[[1,1000],[2,750],[3,500],[8,250],[10,125]]},{EU:[[1,4000],[2,1250],[3,900],[10,400],[15,300],[25,150]],OCE:[[1,625],[2,400],[3,300],[5,200],[25,100]],BR:[[1,625],[2,400],[3,300],[5,200],[25,100]],ASIA:[[1,625],[2,400],[3,300],[5,200],[25,100]],ME:[[1,625],[2,400],[3,300],[5,200],[25,100]],NAC:[[1,4000],[2,1250],[3,900],[10,400],[15,225],[25,100]]},{EU:[[100,250],[200,500],[300,750]],OCE:[[100,100],[200,200],[300,300]],BR:[[100,100],[200,200],[300,300]],ASIA:[[100,100],[200,200],[300,300]],ME:[[100,100],[200,200],[300,300]],NAC:[[100,250],[200,500],[300,750]]},{EU:[[100,100],[200,200],[300,300]],NAW:[[100,100],[200,200],[300,300]],OCE:[[100,100],[200,200],[300,300]],BR:[[100,100],[200,200],[300,300]],ASIA:[[100,100],[200,200],[300,300]],ME:[[100,100],[200,200],[300,300]],NAC:[[100,100],[200,200],[300,300]]},{EU:[[1,10000],[2,5000],[3,2500],[4,2000],[5,1500],[10,1000],[50,500],[100,250],[1000,100],[2000,50]],NAW:[[1,4000],[2,2000],[3,1000],[4,750],[5,500],[10,300],[50,200],[100,150],[200,100],[500,50]],OCE:[[1,2500],[2,1500],[3,1000],[4,750],[5,500],[10,300],[50,200],[100,100],[250,50]],BR:[[1,4000],[2,2000],[3,1000],[4,750],[5,500],[10,300],[50,200],[100,150],[200,100],[500,50]],ASIA:[[1,2500],[2,1500],[3,1000],[4,750],[5,500],[10,300],[50,200],[100,100],[250,50]],ME:[[1,2500],[2,1500],[3,1000],[4,750],[5,500],[10,300],[50,200],[100,100],[250,50]],NAC:[[1,8000],[2,4000],[3,2000],[4,1500],[5,1000],[10,800],[50,400],[100,200],[600,100],[1200,50]]},{EU:[[100,200],[200,400],[300,600]],NAW:[[100,200],[200,400],[300,600]],OCE:[[100,200],[200,400],[300,600]],BR:[[100,200],[200,400],[300,600]],ASIA:[[100,200],[200,400],[300,600]],ME:[[100,200],[200,400],[300,600]],NAC:[[100,200],[200,400],[300,600]]},{EU:[[1,4000],[2,3000],[3,2000],[4,1500],[5,1250],[6,1000],[7,900],[8,800],[9,700],[10,600],[20,500],[30,400],[50,300],[75,200],[100,100]],NAW:[[1,1000],[2,750],[3,600],[4,500],[5,450],[6,400],[7,350],[8,300],[9,250],[10,200],[25,150],[40,100]],OCE:[[1,1000],[2,750],[3,600],[4,500],[5,450],[6,400],[7,350],[8,300],[9,250],[10,200],[25,150],[40,100]],BR:[[1,1000],[2,750],[3,600],[4,500],[5,450],[6,400],[7,350],[8,300],[9,250],[10,200],[25,150],[40,100]],ASIA:[[1,1000],[2,750],[3,600],[4,500],[5,450],[6,400],[7,350],[8,300],[9,250],[10,200],[25,150],[40,100]],ME:[[1,1000],[2,750],[3,600],[4,500],[5,450],[6,400],[7,350],[8,300],[9,250],[10,200],[25,150],[40,100]],NAC:[[1,2500],[2,1500],[3,1250],[4,1000],[5,750],[6,500],[7,450],[8,400],[9,350],[10,300],[20,250],[30,200],[50,150],[75,100]]},{EU:[[1,4000],[2,2000],[3,1200],[4,800],[5,600],[7,500],[10,400],[20,300],[40,200]],NAW:[[1,1500],[2,1000],[3,500],[4,300],[5,200],[10,150],[20,100]],OCE:[[1,1000],[2,500],[3,250],[4,200],[5,150],[20,100]],BR:[[1,1500],[2,1000],[3,500],[4,300],[5,200],[10,150],[20,100]],ASIA:[[1,1000],[2,500],[3,250],[4,200],[5,150],[20,100]],ME:[[1,1000],[2,500],[3,250],[4,200],[5,150],[20,100]],NAC:[[1,3000],[2,1500],[3,900],[4,600],[5,450],[7,375],[10,300],[20,225],[40,150]]},{EU:[[1,15000],[2,10000],[3,9000],[4,8000],[5,7000],[6,6000],[7,5000],[8,4000],[9,3000],[10,2000],[25,1000],[50,750],[75,500],[100,250]],NAW:[[1,4000],[2,2000],[3,1000],[5,750],[10,500],[25,400],[50,300],[75,200]],OCE:[[1,2500],[2,1250],[3,750],[5,500],[10,375],[25,250],[50,150]],BR:[[1,4000],[2,2000],[3,1000],[5,750],[10,500],[25,400],[50,300],[75,200]],ASIA:[[1,2500],[2,1250],[3,750],[5,500],[10,375],[25,250],[50,150]],ME:[[1,2500],[2,1250],[3,750],[5,500],[10,375],[25,250],[50,150]],NAC:[[1,10000],[2,8000],[3,6000],[4,5000],[5,4000],[6,3000],[7,2500],[8,2000],[9,1500],[10,1000],[25,750],[50,500],[75,300],[100,200]]},{EU:[[1,3750],[2,3000],[3,2200],[4,2000],[5,1800],[6,1700],[7,1600],[8,1500],[9,1400],[10,1300],[20,1100],[30,1000],[40,800],[50,700],[75,550],[100,450],[250,375],[500,250]],NAC:[[1,4000],[2,3250],[3,2750],[4,2250],[5,2000],[6,1700],[7,1600],[8,1500],[9,1400],[10,1300],[20,1200],[30,1100],[40,1000],[50,900],[75,800],[100,650],[250,450],[500,250],[1500,200]],NAW:[[1,3000],[2,2500],[3,2250],[4,2000],[5,1800],[6,1500],[7,1400],[8,1300],[9,1200],[10,1050],[20,900],[30,750],[40,600],[50,450],[75,400],[100,350],[250,300],[500,250]],OCE:[[1,2600],[2,2250],[3,2000],[4,1500],[5,1400],[6,1300],[7,1250],[8,1200],[9,1100],[10,900],[20,750],[30,600],[40,450],[50,400],[75,350],[100,300],[250,200]],BR:[[1,3000],[2,2500],[3,2250],[4,2000],[5,1800],[6,1500],[7,1400],[8,1300],[9,1200],[10,1050],[20,900],[30,750],[40,600],[50,450],[75,400],[100,350],[250,300],[500,250]],ASIA:[[1,2600],[2,2250],[3,2000],[4,1500],[5,1400],[6,1300],[7,1250],[8,1200],[9,1100],[10,900],[20,750],[30,600],[40,450],[50,400],[75,350],[100,300],[250,200]],ME:[[1,2600],[2,2250],[3,2000],[4,1500],[5,1400],[6,1300],[7,1250],[8,1200],[9,1100],[10,900],[20,750],[30,600],[40,450],[50,400],[75,350],[100,300],[250,200]]},{EU:[[1,5000],[2,4000],[3,3000],[4,2500],[5,2250],[6,2000],[7,1750],[8,1500],[9,1250],[10,1000],[20,700],[30,600],[40,500],[50,400],[75,350],[100,300],[250,250],[1000,200]],NAC:[[1,5000],[2,4000],[3,3000],[4,2500],[5,2250],[6,2000],[7,1750],[8,1500],[9,1250],[10,1000],[20,800],[30,650],[40,550],[50,450],[75,400],[100,350],[250,300],[1000,250],[1500,200]],NAW:[[1,5000],[2,4000],[3,3000],[4,2500],[5,2250],[6,2000],[7,1750],[8,1500],[9,1250],[10,1000],[20,700],[30,600],[40,500],[50,400],[75,350],[100,300],[250,250],[750,200]],OCE:[[1,3500],[2,3000],[3,2500],[4,2250],[5,2000],[6,1800],[7,1500],[8,1300],[9,1000],[10,900],[20,700],[30,500],[40,400],[50,300],[75,250],[100,200]],BR:[[1,3500],[2,3000],[3,2500],[4,2250],[5,2000],[6,1800],[7,1500],[8,1300],[9,1000],[10,900],[20,700],[30,500],[40,400],[50,300],[75,250],[100,200]],ASIA:[[1,3500],[2,3000],[3,2500],[4,2250],[5,2000],[6,1800],[7,1500],[8,1300],[9,1000],[10,900],[20,700],[30,500],[40,400],[50,300],[75,250],[100,200]]},{EU:[[1,1000],[2,900],[3,800],[4,700],[5,600],[6,500],[7,400],[8,350],[9,250],[15,200]],NAC:[[1,1600],[2,1100],[3,900],[4,700],[5,500],[10,300],[20,200]],NAW:[[1,800],[2,600],[3,400],[4,300],[5,250],[10,200]],OCE:[[1,500],[2,400],[3,300],[5,200]],BR:[[1,800],[2,600],[3,400],[4,300],[5,250],[10,200]],ASIA:[[1,500],[2,400],[3,300],[5,200]],ME:[[1,500],[2,400],[3,300],[5,200]]},{EU:[[1,1800],[2,1200],[3,800],[4,600],[5,400],[20,300],[40,200]],NAC:[[1,1600],[2,1100],[3,900],[4,700],[5,500],[10,300],[20,200]],NAW:[[1,800],[2,600],[3,400],[4,300],[5,250],[10,200]],OCE:[[1,500],[2,400],[3,300],[5,200]],BR:[[1,800],[2,600],[3,400],[4,300],[5,250],[10,200]],ASIA:[[1,500],[2,400],[3,300],[5,200]],ME:[[1,500],[2,400],[3,300],[5,200]]},{EU:[[1,3000],[2,2500],[3,2000],[4,1500],[5,1200],[6,900],[7,800],[8,700],[9,600],[10,500],[11,400],[12,350],[13,300],[14,250],[20,200]],NAC:[[1,2000],[2,1600],[3,1200],[4,900],[5,800],[6,700],[7,600],[8,500],[9,400],[10,300],[15,200]],NAW:[[1,700],[2,600],[3,550],[4,500],[5,450],[6,400],[7,350],[8,300],[9,250],[10,200]],OCE:[[1,600],[2,500],[3,400],[4,300],[5,200]],BR:[[1,700],[2,600],[3,550],[4,500],[5,450],[6,400],[7,350],[8,300],[9,250],[10,200]],ASIA:[[1,600],[2,500],[3,400],[4,300],[5,200]],ME:[[1,600],[2,500],[3,400],[4,300],[5,200]]},{EU:[[1,7200],[2,5500],[3,4500],[4,3000],[5,2500],[6,2000],[7,1750],[8,1500],[9,1000],[10,800],[20,400],[33,300]],NAC:[[1,3200],[2,2400],[3,2000],[4,1200],[5,900],[6,700],[7,600],[8,500],[9,400],[10,350],[20,300],[33,200]],NAW:[[1,1400],[2,1000],[3,900],[4,600],[5,500],[6,400],[7,350],[8,300],[9,250],[15,200]],OCE:[[1,750],[2,500],[5,200]],BR:[[1,1800],[2,1500],[3,1000],[4,800],[5,700],[6,500],[7,400],[8,350],[9,325],[10,300],[20,250],[25,200]],ASIA:[[1,1000],[2,600],[3,500],[4,350],[5,325],[6,300],[7,275],[8,250],[9,225],[10,200]],ME:[[1,1000],[2,600],[3,500],[4,350],[5,325],[6,300],[7,275],[8,250],[9,225],[10,200]]},{EU:[[1,4200],[2,3000],[3,2200],[4,1600],[5,1400],[6,1200],[7,1000],[8,900],[9,800],[10,700],[11,600],[12,500],[13,400],[14,300],[20,200]],NAC:[[1,2500],[2,1400],[3,1150],[4,1000],[5,900],[6,800],[7,700],[8,600],[9,500],[10,450],[11,400],[12,350],[13,300],[14,250],[20,200]],NAW:[[1,1000],[2,600],[3,450],[4,400],[5,350],[6,300],[7,275],[8,225],[15,200]],OCE:[[1,450],[2,300],[3,275],[4,250],[5,225],[10,200]],BR:[[1,1000],[2,600],[3,450],[4,400],[5,350],[6,300],[7,275],[8,225],[15,200]],ASIA:[[1,450],[2,300],[3,275],[4,250],[5,225],[10,200]],ME:[[1,450],[2,300],[3,275],[4,250],[5,225],[10,200]]},{EU:[[1,5000],[2,3000],[3,1800],[4,1600],[5,1400],[6,1200],[7,1000],[8,800],[9,600],[10,400]],NAC:[[1,2600],[2,1800],[3,1200],[4,1000],[5,900],[6,800],[7,700],[8,600],[9,500],[10,400]],NAW:[[1,1100],[2,900],[3,700],[4,600],[5,500],[6,400]],OCE:[[1,900],[2,700],[3,500]],BR:[[1,1100],[2,900],[3,700],[4,600],[5,500],[6,400]],ASIA:[[1,900],[2,700],[3,500]],ME:[[1,900],[2,700],[3,500]]},{EU:[[1,1200],[2,1100],[3,1000],[4,800],[5,725],[6,600],[7,550],[8,500],[9,450],[25,400],[50,300],[64,200]],NAC:[[1,1200],[2,1100],[3,1000],[4,800],[5,725],[6,600],[7,550],[8,500],[9,450],[25,400],[50,300],[64,200]],NAW:[[1,1200],[2,1100],[3,1000],[4,800],[5,725],[6,600],[7,550],[8,500],[9,450],[25,400],[50,300],[64,200]],OCE:[[1,650],[2,600],[3,550],[4,500],[5,450],[6,400],[7,350],[8,300],[9,300],[20,200]],BR:[[1,1200],[2,1100],[3,1000],[4,800],[5,725],[6,600],[7,550],[8,500],[9,450],[25,400],[50,300],[64,200]],ASIA:[[1,650],[2,600],[3,550],[4,500],[5,450],[6,400],[7,350],[8,300],[9,300],[20,200]],ME:[[1,650],[2,600],[3,550],[4,500],[5,450],[6,400],[7,350],[8,300],[9,300],[20,200]]},{EU:[[1,7000],[2,5500],[3,4500],[4,3000],[5,2500],[6,2000],[7,1750],[8,1500],[9,1000],[10,800],[20,400],[33,300]],NAC:[[1,3500],[2,2800],[3,2300],[4,1500],[5,1000],[6,800],[7,600],[8,500],[9,400],[10,350],[20,300],[33,200]],NAW:[[1,1600],[2,1200],[3,1000],[4,650],[5,500],[6,400],[7,350],[8,300],[9,250],[10,225],[20,200]],OCE:[[1,750],[2,500],[5,200]],BR:[[1,1600],[2,1200],[3,1000],[4,650],[5,500],[6,400],[7,350],[8,300],[9,250],[10,225],[20,200]],ASIA:[[1,1000],[2,600],[3,500],[4,350],[5,325],[6,300],[7,275],[8,250],[9,225],[10,200]],ME:[[1,1000],[2,600],[3,500],[4,350],[5,325],[6,300],[7,275],[8,250],[9,225],[10,200]]},{EU:[[1,2000],[2,1800],[3,1700],[4,1600],[5,1500],[6,1400],[7,1300],[8,1200],[9,1000],[10,800],[20,600],[30,500],[60,400],[100,200]],ASIA:[[1,1000],[2,850],[3,800],[4,750],[5,700],[6,650],[7,600],[8,550],[9,500],[10,450],[50,400],[100,200]]},{EU:[[1,6000],[2,5500],[3,5000],[4,4000],[5,3500],[6,3000],[7,2500],[8,2000],[9,1500],[10,1200],[15,900],[20,750],[25,600],[30,500],[40,400],[50,350]],NAC:[[1,2800],[2,2200],[3,2000],[4,1800],[5,1600],[6,1400],[7,1200],[8,1000],[9,800],[10,600],[20,500],[30,350],[40,250],[45,200]],NAW:[[1,1000],[2,900],[3,800],[4,600],[5,500],[6,450],[7,425],[8,400],[9,375],[10,350],[15,300],[20,250],[30,200]],OCE:[[1,700],[2,500],[3,300],[15,200]],BR:[[1,2000],[2,1500],[3,1250],[4,1000],[5,750],[6,500],[7,475],[8,450],[9,425],[10,400],[15,350],[20,300],[30,250],[40,225]],ASIA:[[1,800],[2,600],[3,500],[4,400],[5,375],[6,350],[7,325],[8,300],[9,275],[10,250],[15,225],[20,200]],ME:[[1,750],[2,550],[3,450],[4,400],[5,350],[6,300],[7,275],[8,250],[9,225],[15,200]]},{EU:[[1,2000],[2,1800],[3,1700],[4,1600],[5,1500],[6,1400],[7,1300],[8,1200],[9,1000],[10,800],[20,600],[30,500],[50,400]],NAC:[[1,1600],[2,1400],[3,1300],[4,1200],[5,1100],[6,1000],[7,900],[8,800],[9,700],[10,600],[20,500],[30,400]],NAW:[[1,1400],[2,1200],[3,1100],[4,1000],[5,900],[6,800],[7,700],[8,600],[9,500],[15,400]],OCE:[[1,1000],[2,800],[3,750],[4,700],[5,650],[6,600],[7,550],[8,500],[9,450],[10,400]],BR:[[1,1500],[2,1300],[3,1200],[4,1100],[5,1000],[6,900],[7,800],[8,700],[9,600],[10,500],[25,400]],ME:[[1,1000],[2,800],[3,750],[4,700],[5,650],[6,600],[7,550],[8,500],[9,450],[10,400]]},{EU:[[1,7000],[2,5500],[3,5000],[4,4000],[5,3500],[6,3000],[7,2500],[8,2000],[9,1500],[10,1200],[15,900],[20,750],[25,600],[30,500],[40,400],[50,350]],NAC:[[1,3750],[2,2200],[3,2000],[4,1800],[5,1600],[6,1400],[7,1200],[8,1000],[9,800],[10,600],[20,500],[30,350],[40,250],[50,200]],NAW:[[1,1800],[2,1200],[3,900],[4,700],[5,600],[6,500],[7,450],[8,400],[9,375],[10,350],[15,300],[20,250]],OCE:[[1,750],[2,550],[3,450],[4,400],[5,400],[6,350],[7,300],[8,275],[9,225],[15,200]],BR:[[1,1800],[2,1200],[3,900],[4,700],[5,600],[6,500],[7,450],[8,400],[9,375],[10,350],[15,300],[20,250]],ASIA:[[1,1800],[2,1200],[3,900],[4,700],[5,600],[6,500],[7,450],[8,400],[9,375],[10,350],[15,300],[20,250]],ME:[[1,750],[2,550],[3,450],[4,400],[5,350],[6,300],[7,275],[8,250],[9,225],[15,200]]},{EU:[[1,2000],[2,1800],[3,1700],[4,1600],[5,1500],[6,1400],[7,1300],[8,1200],[9,1000],[10,800],[20,600],[30,500],[60,400],[100,200]],NAC:[[1,1600],[2,1400],[3,1300],[4,1200],[5,1100],[6,1000],[7,900],[8,800],[9,700],[10,600],[20,500],[50,400],[100,200]],NAW:[[1,1400],[2,1200],[3,1100],[4,1000],[5,900],[6,800],[7,700],[8,600],[9,500],[10,450],[50,400],[100,200]],OCE:[[1,1000],[2,800],[3,750],[4,700],[5,650],[6,600],[7,550],[8,500],[9,450],[10,400],[90,200]],BR:[[1,1500],[2,1300],[3,1200],[4,1100],[5,1000],[6,900],[7,800],[8,700],[9,600],[10,500],[50,400],[100,200]],ME:[[1,1000],[2,800],[3,750],[4,700],[5,650],[6,600],[7,550],[8,500],[9,450],[10,400],[90,200]]},{EU:[[1,2500],[2,1500],[3,900],[4,800],[5,700],[6,600],[7,500],[8,400],[9,300],[10,200]],NAC:[[1,1300],[2,900],[3,600],[4,500],[5,450],[6,400],[7,350],[8,300],[9,250],[10,200]],NAW:[[1,550],[2,450],[3,350],[4,300],[5,250],[6,200]],OCE:[[1,450],[2,350],[3,250]],BR:[[1,550],[2,450],[3,350],[4,300],[5,250],[6,200]],ASIA:[[1,450],[2,350],[3,250]],ME:[[1,450],[2,350],[3,250]]},{EU:[[10,200]],NAC:[[10,200]],NAW:[[10,200]],OCE:[[10,200]],BR:[[10,200]],ASIA:[[10,200]],ME:[[10,200]]},{EU:[[1,1000],[2,900],[3,850],[4,800],[5,750],[6,700],[7,650],[8,600],[9,500],[10,400],[20,300],[30,250],[50,200]],NAC:[[1,800],[2,700],[3,650],[4,600],[5,550],[6,500],[7,450],[8,400],[9,350],[10,300],[20,250],[30,200]],NAW:[[1,700],[2,600],[3,550],[4,500],[5,450],[6,400],[7,350],[8,300],[9,250],[15,200]],OCE:[[1,500],[2,400],[3,375],[4,350],[5,325],[6,300],[7,275],[8,250],[9,225],[10,200]],BR:[[1,750],[2,650],[3,600],[4,550],[5,500],[6,450],[7,400],[8,350],[9,300],[10,250],[25,200]],ASIA:[[1,500],[2,425],[3,400],[4,375],[5,350],[6,325],[7,300],[8,275],[9,250],[10,225],[50,200]],ME:[[1,500],[2,400],[3,375],[4,350],[5,325],[6,300],[7,275],[8,250],[9,225],[10,200]]},{EU:[[1,1200],[2,1100],[3,1000],[4,800],[5,725],[6,600],[7,550],[8,500],[9,450],[25,400],[50,300],[64,200]],NAC:[[1,1200],[2,1100],[3,1000],[4,800],[5,725],[6,600],[7,550],[8,500],[9,450],[25,400],[50,300],[64,200]],NAW:[[1,1200],[2,1100],[3,1000],[4,800],[5,725],[6,600],[7,550],[8,500],[9,450],[25,400],[50,300],[64,200]],OCE:[[1,650],[2,600],[3,550],[4,500],[5,450],[6,400],[7,350],[9,300],[20,200]],BR:[[1,1200],[2,1100],[3,1000],[4,800],[5,725],[6,600],[7,550],[8,500],[9,450],[25,400],[50,300],[64,200]],ME:[[1,650],[2,600],[3,550],[4,500],[5,450],[6,400],[7,350],[9,300],[20,200]]},{EU:[[1,975],[2,700],[3,650],[4,600],[5,550],[6,500],[7,400],[8,250],[9,200],[10,175],[15,125]],OCE:[[1,325],[2,225],[3,150],[4,125],[5,100]],BR:[[1,250],[2,200],[5,150],[7,125],[8,100]],ASIA:[[1,250],[2,200],[5,150],[7,125],[8,100]],ME:[[1,325],[2,225],[3,150],[4,125],[5,100]],NAC:[[1,975],[2,700],[3,650],[4,600],[5,550],[6,500],[7,400],[8,250],[9,200],[10,175],[15,125]]},{EU:[[1,3000],[2,2000],[3,1500],[4,1200],[5,1100],[6,1000],[7,900],[8,800],[9,700],[10,600],[20,500],[30,400],[60,300],[75,150],[100,100]],OCE:[[1,650],[2,400],[3,375],[4,350],[5,325],[6,300],[7,275],[8,250],[9,225],[10,200],[100,100]],BR:[[1,1000],[2,650],[3,600],[4,550],[5,500],[6,450],[7,400],[8,350],[9,300],[10,250],[50,200],[75,150],[100,100]],ASIA:[[1,1000],[2,650],[3,600],[4,550],[5,500],[6,450],[7,400],[8,350],[9,300],[10,250],[50,200],[75,150],[100,100]],ME:[[1,650],[2,400],[3,375],[4,350],[5,325],[6,300],[7,275],[8,250],[9,225],[10,200],[100,100]],NAC:[[1,2500],[2,1500],[3,1200],[4,1000],[5,900],[6,700],[7,650],[8,600],[9,500],[10,400],[20,300],[30,250],[60,200],[75,150],[100,100]]},{EU:[[1,3500],[2,2750],[3,2500],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,750],[10,600],[15,450],[20,375],[25,300],[30,250],[40,200],[50,175]],OCE:[[1,375],[2,275],[3,225],[4,200],[5,175],[7,150],[9,125],[15,100]],BR:[[1,900],[2,600],[3,450],[4,350],[5,300],[6,250],[7,225],[8,200],[10,175],[15,150],[20,125]],ASIA:[[1,900],[2,600],[3,450],[4,350],[5,300],[6,250],[7,225],[8,200],[10,175],[15,150],[20,125]],ME:[[1,375],[2,275],[3,225],[4,200],[5,175],[7,150],[9,125],[15,100]],NAC:[[1,2750],[2,1700],[3,1450],[4,1250],[5,1100],[6,950],[7,825],[8,700],[9,600],[10,475],[15,400],[20,375],[30,175],[50,125]]},{EU:[[1,3000],[2,2000],[3,1500],[4,1200],[5,1100],[6,1000],[7,900],[8,800],[9,700],[10,600],[20,500],[30,400],[60,300],[75,150],[100,100]],ASIA:[[1,1000],[2,650],[3,600],[4,550],[5,500],[6,450],[7,400],[8,350],[9,300],[10,250],[50,200],[75,150],[100,100]]},{EU:[[1,3000],[2,2000],[3,1500],[4,1200],[5,1100],[6,1000],[7,900],[8,800],[9,700],[10,600],[20,500],[30,400],[60,300],[75,150],[100,100]],OCE:[[1,650],[2,400],[3,375],[4,350],[5,325],[6,300],[7,275],[8,250],[9,225],[10,200],[100,100]],BR:[[1,1000],[2,650],[3,600],[4,550],[5,500],[6,450],[7,400],[8,350],[9,300],[10,250],[50,200],[75,150],[100,100]],ME:[[1,650],[2,400],[3,375],[4,350],[5,325],[6,300],[7,275],[8,250],[9,225],[10,200],[100,100]]},{EU:[[1,5000],[2,4000],[3,2500],[4,2300],[5,2200],[6,2000],[7,1800],[8,1600],[9,1400],[10,1200],[20,1000],[30,800],[60,600],[100,200]],ASIA:[[1,1000],[2,850],[3,800],[4,750],[5,700],[6,650],[7,600],[8,550],[9,500],[10,450],[50,400],[100,200]]},{EU:[[1,6000],[2,5500],[3,5000],[4,4000],[5,3500],[6,3000],[7,2500],[8,2000],[9,1500],[10,1200],[15,900],[20,750],[25,600],[30,500],[40,400],[50,350]],OCE:[[1,700],[2,500],[3,300],[15,200]],BR:[[1,2000],[2,1500],[3,1250],[4,1000],[5,750],[6,500],[7,475],[8,450],[9,425],[10,400],[15,350],[20,300],[30,250],[40,225]],ASIA:[[1,800],[2,600],[3,500],[4,400],[5,375],[6,350],[7,325],[8,300],[9,275],[10,250],[15,225],[20,200]],ME:[[1,750],[2,550],[3,450],[4,400],[5,350],[6,300],[7,275],[8,250],[9,225],[15,200]],NAC:[[1,5550],[2,3400],[3,2900],[4,2500],[5,2200],[6,1900],[7,1650],[8,1400],[9,1175],[10,950],[15,800],[20,750],[30,350],[40,250],[50,200]]},{EU:[[1,6000],[2,5500],[3,5000],[4,4000],[5,3500],[6,3000],[7,2500],[8,2000],[9,1500],[10,1200],[15,900],[20,750],[25,600],[30,500],[40,400],[50,350]],OCE:[[1,700],[2,500],[3,300],[15,200]],BR:[[1,2000],[2,1500],[3,1250],[4,1000],[5,750],[6,500],[7,475],[8,450],[9,425],[10,400],[15,350],[20,300],[30,250],[40,225]],ASIA:[[1,800],[2,600],[3,500],[4,400],[5,375],[6,350],[7,325],[8,300],[9,275],[10,250],[15,225],[20,200]],ME:[[1,750],[2,550],[3,450],[4,400],[5,350],[6,300],[7,275],[8,250],[9,225],[15,200]],NAC:[[1,5500],[2,3400],[3,2900],[4,2500],[5,2200],[6,1900],[7,1650],[8,1400],[9,1175],[10,950],[15,800],[20,750],[30,350],[40,250],[50,200]]},{EU:[[1,2000],[2,1800],[3,1700],[4,1600],[5,1500],[6,1400],[7,1300],[8,1200],[9,1000],[10,800],[20,600],[30,500],[60,400],[100,200]],NAC:[[1,1600],[2,1400],[3,1300],[4,1200],[5,1100],[6,1000],[7,900],[8,800],[9,700],[10,600],[20,500],[50,400],[100,200]],NAW:[[1,1400],[2,1300],[3,1200],[4,1100],[5,1000],[6,900],[7,800],[8,700],[9,600],[10,500],[50,400],[100,200]],OCE:[[1,1000],[2,800],[3,750],[4,700],[5,650],[6,600],[7,550],[8,500],[9,450],[10,400],[90,200]],BR:[[1,1500],[2,1300],[3,1200],[4,1100],[5,1000],[6,900],[7,800],[8,700],[9,600],[10,500],[50,400],[100,200]],ASIA:[[1,1000],[2,850],[3,800],[4,750],[5,700],[6,650],[7,600],[8,550],[9,500],[10,450],[50,400],[100,200]],ME:[[1,1000],[2,800],[3,750],[4,700],[5,650],[6,600],[7,550],[8,500],[9,450],[10,400],[90,200]]},{EU:[[1,7000],[2,4000],[3,3000],[4,2000],[5,1500],[50,1000],[100,750]],NAW:[[1,3000],[2,1750],[3,1250],[5,750],[40,500]],OCE:[[1,1500],[2,875],[3,625],[5,375],[40,250]],BR:[[1,3000],[2,1750],[3,1250],[5,750],[40,500]],ASIA:[[1,1500],[2,875],[3,625],[5,375],[40,250]],ME:[[1,1500],[2,875],[3,625],[5,375],[40,250]],NAC:[[1,5000],[2,3000],[3,2000],[5,1250],[10,1000],[50,750],[100,300]]},{EU:[[1,1500],[2,500],[3,300],[10,100]],OCE:[[1,300],[2,200],[3,150],[5,100],[10,50]],BR:[[1,300],[2,200],[3,150],[5,100],[10,50]],ASIA:[[1,300],[2,200],[3,150],[5,100],[10,50]],ME:[[1,300],[2,200],[3,150],[5,100],[10,50]],NAC:[[1,1500],[2,500],[3,300],[10,100]]},{EU:[[1,325],[2,200],[3,150]],OCE:[[1,325],[2,200],[3,150]],BR:[[1,325],[2,200],[3,150]],ASIA:[[1,325],[2,200],[3,150]],ME:[[1,325],[2,200],[3,150]],NAC:[[1,325],[2,200],[3,150]]},{EU:[[1,2500],[2,675],[3,450],[10,225]],OCE:[[1,325],[2,200],[3,150],[5,100],[10,50]],BR:[[1,325],[2,200],[3,150],[5,100],[10,50]],ASIA:[[1,325],[2,200],[3,150],[5,100],[10,50]],ME:[[1,325],[2,200],[3,150],[5,100],[10,50]],NAC:[[1,2500],[2,675],[3,450],[10,225]]},{EU:[[1,6000],[2,4000],[3,3000],[4,2400],[5,2200],[6,2000],[7,1800],[8,1600],[9,1400],[10,1200],[20,1000],[30,800],[60,600],[75,300],[100,200]],OCE:[[1,1300],[2,800],[3,750],[4,700],[5,650],[6,600],[7,550],[8,500],[9,450],[10,400],[100,200]],BR:[[1,2000],[2,1300],[3,1200],[4,1100],[5,1000],[6,900],[7,800],[8,700],[9,600],[10,500],[50,400],[75,300],[100,200]],ASIA:[[1,2000],[2,1300],[3,1200],[4,1100],[5,1000],[6,900],[7,800],[8,700],[9,600],[10,500],[50,400],[75,300],[100,200]],ME:[[1,1300],[2,800],[3,750],[4,700],[5,650],[6,600],[7,550],[8,500],[9,450],[10,400],[100,200]],NAC:[[1,5000],[2,3000],[3,2400],[4,2000],[5,1800],[6,1400],[7,1300],[8,1200],[9,1000],[10,800],[20,600],[30,500],[60,400],[75,300],[100,200]]},{EU:[[1,3000],[2,2000],[3,1500],[4,1200],[5,1100],[6,1000],[7,900],[8,800],[9,700],[10,600],[20,500],[30,400],[60,300],[75,150],[100,100]],ASIA:[[1,1000],[2,650],[3,600],[4,550],[5,500],[6,450],[7,400],[8,350],[9,300],[10,250],[50,200],[75,150],[100,100]],NAC:[[1,2500],[2,1500],[3,1200],[4,1000],[5,900],[6,700],[7,650],[8,600],[9,500],[10,400],[20,300],[30,250],[60,200],[75,150],[100,100]]},{EU:[[1,2500],[2,1350],[3,900],[10,450],[25,300],[40,150]],OCE:[[1,625],[2,400],[3,300],[5,200],[40,100]],BR:[[1,625],[2,400],[3,300],[5,200],[40,100]],ASIA:[[1,625],[2,400],[3,300],[5,200],[40,100]],ME:[[1,625],[2,400],[3,300],[5,200],[40,100]],NAC:[[1,2500],[2,1350],[3,900],[10,450],[25,300],[40,150]]},{EU:[[1,3000],[2,2000],[3,1500],[4,1200],[5,1100],[6,1000],[7,900],[8,800],[9,700],[10,600],[20,500],[30,400],[60,300],[75,150],[100,100]],OCE:[[1,650],[2,400],[3,375],[4,350],[5,325],[6,300],[7,275],[8,250],[9,225],[10,200],[100,100]],BR:[[1,1000],[2,650],[3,600],[4,550],[5,500],[6,450],[7,400],[8,350],[9,300],[10,250],[50,200],[75,150],[100,100]],ME:[[1,650],[2,400],[3,375],[4,350],[5,325],[6,300],[7,275],[8,250],[9,225],[10,200],[100,100]],NAC:[[1,2500],[2,1500],[3,1200],[4,1000],[5,900],[6,700],[7,650],[8,600],[9,500],[10,400],[20,300],[30,250],[60,200],[75,150],[100,100]]},{EU:[[1,4000],[2,3000],[3,2250],[4,1250],[5,1000],[10,500],[15,400],[20,300]],NAW:[[1,1000],[2,750],[3,500],[4,400],[5,300],[6,250],[20,200]],OCE:[[1,750],[2,600],[3,450],[5,300],[7,250],[10,200]],BR:[[1,1000],[2,750],[3,500],[4,400],[5,300],[6,250],[20,200]],ASIA:[[1,750],[2,600],[3,450],[5,300],[7,250],[10,200]],ME:[[1,750],[2,600],[3,450],[5,300],[7,250],[10,200]],NAC:[[1,2000],[2,1250],[3,1000],[4,750],[5,500],[10,400],[15,300],[20,200]]},{EU:[[1,375],[2,250],[3,200],[4,150],[5,125],[16,100]],NAW:[[1,375],[2,250],[3,200],[4,150],[5,125],[16,100]],OCE:[[1,375],[2,250],[3,200],[4,150],[5,125],[16,100]],BR:[[1,375],[2,250],[3,200],[4,150],[5,125],[16,100]],ASIA:[[1,375],[2,250],[3,200],[4,150],[5,125],[16,100]],ME:[[1,375],[2,250],[3,200],[4,150],[5,125],[16,100]],NAC:[[1,375],[2,250],[3,200],[4,150],[5,125],[16,100]]},{EU:[[1,5500],[2,3500],[3,2500],[4,1500],[5,1000],[50,800],[100,600]],NAW:[[1,2500],[2,1250],[3,1000],[4,750],[5,500],[40,400]],OCE:[[1,1250],[2,750],[3,500],[5,250],[40,200]],BR:[[1,2500],[2,1250],[3,1000],[4,750],[5,500],[40,400]],ASIA:[[1,1250],[2,750],[3,500],[5,250],[40,200]],ME:[[1,1250],[2,750],[3,500],[5,250],[40,200]],NAC:[[1,4000],[2,2500],[3,1500],[5,1000],[10,800],[50,600],[100,240]]},{EU:[[1,1500],[2,1000],[3,800],[4,600],[5,500],[6,450],[7,400],[8,350],[9,325],[10,300],[11,275],[12,250],[13,225],[14,200],[15,175],[16,150]],NAW:[[1,375],[2,250],[3,200],[4,150],[5,125],[16,100]],OCE:[[1,375],[2,250],[3,200],[4,150],[5,125],[16,100]],BR:[[1,375],[2,250],[3,200],[4,150],[5,125],[16,100]],ASIA:[[1,375],[2,250],[3,200],[4,150],[5,125],[16,100]],ME:[[1,375],[2,250],[3,200],[4,150],[5,125],[16,100]],NAC:[[1,1500],[2,1000],[3,800],[4,600],[5,500],[6,450],[7,400],[8,350],[9,325],[10,300],[11,275],[12,250],[13,225],[14,200],[15,175],[16,150]]},{EU:[[1,7000],[2,4000],[3,3000],[4,2000],[5,1500],[50,1000],[100,750]],ASIA:[[1,1500],[2,875],[3,625],[5,375],[40,250]],NAC:[[1,5000],[2,3000],[3,2000],[5,1250],[10,1000],[50,750],[100,300]]},{EU:[[1,20000],[2,16000],[3,12000],[4,8000],[5,6000],[6,6000],[7,4000],[8,4000],[9,4000],[10,4000],[11,2000],[12,2000],[13,2000],[14,2000],[15,2000],[16,2000],[17,1000],[18,1000],[19,1000],[20,1000]]},{EU:[[1,40000],[2,32000],[3,24000],[4,16000],[5,12000],[6,12000],[7,8000],[8,8000],[9,8000],[10,8000],[11,4000],[12,4000],[13,4000],[14,4000],[15,4000],[16,4000],[17,2000],[18,2000],[19,2000],[20,2000]]},{EU:[[1,39000],[2,32333],[3,29333],[4,29333],[5,26833],[6,23000],[7,20750],[8,20500],[9,17750],[10,12333],[11,11000],[12,9167],[13,8500],[14,8333],[15,6833],[16,4667],[17,4333],[18,4333],[19,4167],[20,3500],[21,2667],[22,2667],[23,2000],[24,2000],[25,1750],[26,1500],[27,1417],[28,1333],[29,1333],[30,1333]]},{EU:[[1,8000],[2,4000],[3,2500],[4,1500],[5,1000],[6,1000],[7,750],[8,750],[9,750],[10,750],[11,500],[12,500],[13,500],[14,500],[15,500],[16,300],[17,300],[18,300],[19,300],[20,300],[21,200],[22,200],[23,200],[24,200],[25,200]]},{EU:[[1,50000],[2,20000],[3,10000]]},{EU:[[1,125000],[2,75000],[3,50000],[4,37500],[5,25000],[6,20000],[7,15000],[8,12500],[9,10000],[10,7500],[11,5400],[12,5200],[13,5000],[14,4850],[15,4700],[16,4550],[17,4450],[18,4350],[19,4250],[20,4150],[21,4050],[22,3950],[23,3850],[24,3750],[25,3650],[26,3550],[27,3450],[28,3350],[29,3250],[30,3200],[31,3150],[32,3100],[33,3050],[34,3000],[35,2950],[36,2900],[37,2850],[38,2800],[39,2750],[40,2700],[41,2650],[42,2600],[43,2550],[44,2500]]},{EU:[[1,14000],[2,9000],[3,7000],[4,5000],[5,4500],[6,4000],[7,3500],[8,3000],[9,2500],[10,2000],[11,1600],[12,1600],[13,1300],[14,1300],[15,1300],[16,1000],[17,1000],[18,1000],[19,1000],[20,1000]]},{EU:[[1,12000],[2,6000],[3,5500],[4,5000],[5,4500],[6,4000],[7,3700],[8,3400],[9,3100],[10,2800],[11,2500],[12,1900],[13,1800],[14,1700],[15,1600],[16,1500],[17,1400],[18,1300],[19,1200],[20,1100],[21,1000],[22,1000],[23,1000],[24,1000],[25,1000],[26,1000],[27,1000],[28,1000],[29,1000],[30,1000],[31,800],[32,800],[33,800],[34,800],[35,800],[36,700],[37,700],[38,700],[39,700],[40,700],[41,400],[42,400],[43,400],[44,400],[45,400],[46,400],[47,400],[48,400],[49,400],[50,400],[51,300],[52,300],[53,300],[54,300],[55,300],[56,300],[57,300],[58,300],[59,300],[60,300],[61,300],[62,300],[63,300],[64,300],[65,300],[66,300],[67,300],[68,300],[69,300],[70,300],[71,300],[72,300],[73,300],[74,300],[75,300],[76,200],[77,200],[78,200],[79,200],[80,200],[81,200],[82,200],[83,200],[84,200],[85,200],[86,200],[87,200],[88,200],[89,200],[90,200],[91,200],[92,200],[93,200],[94,200],[95,200],[96,200],[97,200],[98,200],[99,200],[100,200]]},{EU:[[1,12000],[2,6000],[3,5500],[4,5000],[5,4500],[6,4000],[7,3700],[8,3400],[9,3100],[10,2800],[11,2500],[12,1900],[13,1800],[14,1700],[15,1600],[16,1500],[17,1400],[18,1300],[19,1200],[20,1100],[21,1000],[22,1000],[23,1000],[24,1000],[25,1000],[26,1000],[27,1000],[28,1000],[29,1000],[30,1000],[31,800],[32,800],[33,800],[34,800],[35,800],[36,700],[37,700],[38,700],[39,700],[40,700],[41,400],[42,400],[43,400],[44,400],[45,400],[46,400],[47,400],[48,400],[49,400],[50,400],[51,300],[52,300],[53,300],[54,300],[55,300],[56,300],[57,300],[58,300],[59,300],[60,300],[61,300],[62,300],[63,300],[64,300],[65,300],[66,300],[67,300],[68,300],[69,300],[70,300],[71,300],[72,300],[73,300],[74,300],[75,300],[76,200],[77,200],[78,200],[79,200],[80,200],[81,200],[82,200],[83,200],[84,200],[85,200],[86,200],[87,200],[88,200],[89,200],[90,200],[91,200],[92,200],[93,200],[94,200],[95,200],[96,200],[97,200],[98,200],[99,200]]},{EU:[[1,21382],[2,15722],[3,11320],[4,8175],[5,6289],[6,5345],[7,4402],[8,3773],[9,3459],[10,3144],[11,2830],[12,2390],[13,2264],[14,2138],[15,2012],[16,1887],[17,1761],[18,1635],[19,1509],[20,1384],[21,943],[22,943],[23,943],[24,943],[25,943],[26,943],[27,943],[28,943],[29,943],[30,943],[31,943],[32,943],[33,943],[34,943],[35,943],[36,943],[37,943],[38,943],[39,943],[40,943],[41,440],[42,440],[43,440],[44,440],[45,440],[46,440],[47,440],[48,440],[49,440],[50,440]]},{EU:[[1,2500],[2,2400],[3,2300],[4,2200],[5,2200],[6,2100],[7,2100],[8,2100],[9,2100],[10,2000],[11,2000],[12,2000],[13,2000],[14,1900],[15,1900],[16,1900],[17,1900],[18,1900]]},{EU:[[1,25000],[2,22500],[3,20000],[4,17500],[5,15000],[6,12500],[7,12500],[8,12500],[9,12500],[10,12500],[11,10000],[12,10000],[13,10000],[14,10000],[15,10000],[16,7500],[17,7500],[18,7500],[19,7500],[20,7500]]},{EU:[[1,8710],[2,4645],[3,3484],[4,2207],[5,1162],[6,1045],[7,929],[8,697],[9,581],[10,349],[11,581],[12,581],[13,581],[14,2323],[15,581],[16,581]]},{EU:[[1,14460],[2,11568],[3,8676],[4,6940],[5,5784],[6,3470],[7,1736],[8,1446],[9,1156],[10,868]]},{EU:[[1,8000],[2,3000],[3,2000],[4,1200],[5,1000],[6,700],[7,650],[8,500],[9,500],[10,450]]},{EU:[[1,30000],[2,15000],[3,13750],[4,12500],[5,11250],[6,10000],[7,9250],[8,8500],[9,7750],[10,7000],[11,6250],[12,4750],[13,4500],[14,4250],[15,4000],[16,3750],[17,3500],[18,3250],[19,3000],[20,2750],[21,2500],[22,2500],[23,2500],[24,2500],[25,2500],[26,2500],[27,2500],[28,2500],[29,2500],[30,2500],[31,2000],[32,2000],[33,2000],[34,2000],[35,2000],[36,1750],[37,1750],[38,1750],[39,1750],[40,1750],[41,1000],[42,1000],[43,1000],[44,1000],[45,1000],[46,1000],[47,1000],[48,1000],[49,1000],[50,1000],[51,750],[52,750],[53,750],[54,750],[55,750],[56,750],[57,750],[58,750],[59,750],[60,750],[61,750],[62,750],[63,750],[64,750],[65,750],[66,750],[67,750],[68,750],[69,750],[70,750],[71,750],[72,750],[73,750],[74,750],[75,750],[76,500],[77,500],[78,500],[79,500],[80,500],[81,500],[82,500],[83,500],[84,500],[85,500],[86,500],[87,500],[88,500],[89,500],[90,500],[91,500],[92,500],[93,500],[94,500],[95,500],[96,500],[97,500],[98,500],[99,500],[100,500]]},{EU:[[1,22500],[2,12500],[3,9000],[4,7500],[5,6000],[6,5000],[7,4500],[8,4000],[9,3500],[10,3000],[11,2500],[12,2500],[13,2500],[14,2500],[15,2500],[16,2000],[17,2000],[18,2000],[19,2000],[20,2000],[21,1500],[22,1500],[23,1500],[24,1500],[25,1500],[26,1000],[27,1000],[28,1000],[29,1000],[30,1000],[31,750],[32,750],[33,750],[34,750],[35,750],[36,750],[37,750],[38,750],[39,750],[40,750],[41,500],[42,500],[43,500],[44,500],[45,500],[46,500],[47,500],[48,500],[49,500],[50,500]]},{EU:[[1,250000],[2,150000],[3,100000],[4,75000],[5,50000],[6,40000],[7,30000],[8,25000],[9,20000],[10,15000],[11,10650],[12,10150],[13,9850],[14,9550],[15,9300],[16,9100],[17,8900],[18,8700],[19,8500],[20,8300],[21,8100],[22,7900],[23,7700],[24,7500],[25,7300],[26,7150],[27,7000],[28,6850],[29,6700],[30,6550],[31,6400],[32,6250],[33,6100],[34,6000],[35,5900],[36,5800],[37,5700],[38,5600],[39,5500],[40,5400],[41,5300],[42,5200],[43,5100],[44,5000]]},{EU:[[1,2500],[2,1000],[3,675],[4,625],[5,575],[6,500],[7,450],[8,400],[9,350],[10,300],[11,250],[12,250],[13,250],[14,250],[15,250],[16,175],[17,175],[18,175],[19,175],[20,175],[21,125],[22,125],[23,125],[24,125],[25,125],[26,125],[27,125],[28,125],[29,125],[30,125],[31,100],[32,100],[33,100],[34,100],[35,100],[36,100],[37,100],[38,100],[39,100],[40,100],[41,75],[42,75],[43,75],[44,75],[45,75],[46,75],[47,75],[48,75],[49,75],[50,75]]},{EU:[[1,16002],[2,10668],[3,5334]]},{EU:[[1,100000],[2,40000],[3,20000],[4,20000],[5,10000],[6,10000],[7,10000],[8,10000],[9,5000],[10,5000],[11,5000],[12,5000],[13,2500],[14,2500],[15,2500],[16,2500]]},{EU:[[1,2500],[2,2000],[3,1500],[4,1250],[5,1125],[6,1000],[7,875],[8,750],[9,625],[10,500],[20,450],[30,350],[40,300],[50,250],[75,225],[100,200],[250,175],[500,150]],NAC:[[1,2250],[2,1750],[3,1375],[4,1125],[5,1000],[6,850],[7,750],[8,625],[9,500],[10,400],[20,350],[30,300],[40,250],[50,225],[75,200],[100,175],[250,125],[500,100]],NAW:[[1,1250],[2,1100],[3,1000],[4,900],[5,800],[6,725],[7,625],[8,500],[9,450],[10,400],[20,350],[30,300],[40,250],[50,200],[75,150],[100,100]],BR:[[1,1250],[2,1100],[3,1000],[4,875],[5,725],[6,600],[7,500],[8,450],[9,400],[10,350],[20,300],[30,250],[40,200],[50,150],[75,100]],ASIA:[[1,1250],[2,1100],[3,1000],[4,875],[5,725],[6,600],[7,500],[8,450],[9,400],[10,350],[20,300],[30,250],[40,200],[50,150],[75,100]],OCE:[[1,1250],[2,1100],[3,950],[4,800],[5,650],[6,500],[7,450],[8,400],[9,350],[10,300],[20,200],[30,150],[40,125],[50,100]]},{EU:[[1,67100],[2,26840],[3,16775],[4,12078],[5,7381],[6,6710],[7,5368],[8,4026],[9,3355],[24,2013],[90,1342]]},{EU:[[1,4000],[2,2800],[3,2250],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,750],[10,500],[11,450],[12,425],[13,400],[14,350],[15,325],[16,300],[17,275],[18,250],[19,225],[40,200]]},{EU:[[1,10000],[2,7500],[3,5500],[4,4000],[5,3000],[6,2000],[7,1500],[8,1250],[9,1000],[10,750],[89,175]]},{EU:[[1,2250],[2,2200],[3,2150],[4,2100],[5,2050],[6,2000],[7,1950],[8,1900],[9,1850],[10,1800],[15,1750],[20,1700]]},{EU:[[1,35000],[2,32500],[3,27500],[4,22500],[5,20000],[10,17500],[15,15000],[20,10000]]},{EU:[[1,25000],[2,8750],[3,6250],[4,4250],[5,2250],[6,1750],[7,1500],[8,1250],[10,750],[20,500]]},{EU:[[1,6250],[2,3750],[3,2500],[4,2000],[5,1750],[6,1500],[7,1250],[8,750]]},{EU:[[1,25000],[2,11000],[3,7000],[4,4500],[6,2500],[8,1500],[16,875]]},{EU:[[1,0]]}];
// Постеры этих капов — архив Tracker (tools/fetch-archive-posters.js).
Object.assign(CC_CUP_POSTER, {"S11_DreamhackWinter_BYOC":"cups/a-9868a28044","S11_CC_Contenders":"cups/a-ff2310d4d7","CashCup_Trios2":"cups/a-2bcf5fbd2c","CashCup_Trios1":"cups/a-e50eef7dd3","LuxeCup":"cups/a-1dc7cf8ed5","S11_WinterRoyale_PC":"cups/a-b34bf12bdc","BlackheartCup":"cups/a-7346a067bb","ScallywagCup":"cups/a-7c5745c6fb","S14_EUEncore":"cups/a-8db2611580","S15_FrostyFrenzy":"cups/a-af1008c05b","S14_MarvelSuperCup":"cups/a-3cfb0ee2e7","S15_Dreamhack_December":"cups/a-713e597735","S14_Dreamhack_November":"cups/a-713e597735","S14_Dreamhack_October":"cups/a-713e597735","S14_CC_Champions":"cups/a-76987e57b5","S14_WildWednesday":"cups/a-a6e39a8e20","S14_CC_Contenders":"cups/a-e6c53b00a5","S14_Dreamhack_September":"cups/a-713e597735","S13_LlobetiTriosCup":"cups/a-8db2611580","S13_CC_Champions":"cups/a-12d07029c8","S13_Dreamhack_August":"cups/a-713e597735","S13_CC_Contenders":"cups/a-e7c01b85f1","S13_AquaNyhroxThrowbackCup":"cups/a-8787e74bd2","S13_BughaThrowbackCup":"cups/a-d7bcdcb3b9","S13_MongraalSoloCup":"cups/a-8db2611580","S13_JacobSoloCup":"cups/a-bc725610c8","S13_DailyTrios":"cups/a-402a6ec6cb","S13_MrSavageTriosCup":"cups/a-8db2611580","S13_AmarTriosCup":"cups/a-8db2611580","S13_Dreamhack_July":"cups/a-713e597735","S12_BenjyFishyCup":"cups/a-7c5745c6fb","S12_CCV2_Contenders":"cups/a-12d07029c8","S12_DailyDuos":"cups/a-7987676c0e","S11_CelebrationCup":"cups/a-3f9583fe8d","S12_CC_Contenders":"cups/a-12d07029c8","S18_Dreamhack_October":"cups/a-be32eaada8","S17_Dreamhack_August":"cups/a-be32eaada8","S17_BlueCheese":"cups/a-f040c05fce","S16_UEFA_Euro_Cup_2020":"cups/a-f7f8c09c97","S16_Dreamhack_April":"cups/a-be32eaada8","S15_Dreamhack_January":"cups/a-713e597735","S22_QueasyCup":"cups/a-3380291c49","S21_LGSoloCashCup":"cups/a-e29b82f490","S22_ZBMCashCup":"cups/a-20616706ce","S21_LGTriosCashCup":"cups/a-ba3e72ce31","S21_PgodCup":"cups/a-ed9ad7cf4f","S21_DreamhackSummerZBM":"cups/a-d6d5f8e00b","S21_TriosCashCupZBM":"cups/a-a12d155672","S21_DreamhackSummer":"cups/a-56b324ab44","S21_TriosQuickCashCup":"cups/a-99f3c3f75d","S21_SommersetCup":"cups/a-bd073fb356","S28_DuosZBVictoryCashCup":"cups/a-ac2e2b1d76","S27_SoloVictoryCashCup":"cups/a-094ae31bec","S28_SoloVictoryCashCup":"cups/a-094ae31bec","S27_OGGrefg_Duos":"cups/a-c0605bf346","S27_OGInoxtag_Duos":"cups/a-de1053a64f","S27_DuosZBVictoryCashCup":"cups/a-ac2e2b1d76","S27_OGJacob_Duos":"cups/a-c0605bf346","S27_OGAmar_Duos":"cups/a-de1053a64f","S27_OGGrefg_Squads":"cups/a-c0605bf346","S26_DuosZBVictoryCashCup":"cups/a-ac2e2b1d76","S25_DuosZBVictoryCashCup":"cups/a-ac2e2b1d76","S24_TriosZBVictoryCashCup":"cups/a-891369eb47","S24_MamaBenjyFishy":"cups/a-6a11de2460","S23_ThunderCup":"cups/a-a309a3cdcd","S23_ZBMCashCup":"cups/a-f30171d854","S23_LGSoloCashCup":"cups/a-f6c3d6e933","S23_LGTriosCashCup":"cups/a-f6c3d6e933","S32_SoloVictoryCashCup":"cups/a-af2ca98c52","S32_SoloZBVictoryCashCup":"cups/a-af2ca98c52","S32_TriosCashCup":"cups/a-e85f02997e","S32_TriosCashCup_ZB":"cups/a-ca8ce3e4a5","S32_SquadsReloadCup":"cups/a-e7c00e1f68","S31_SquadsReloadCup":"cups/a-e7c00e1f68","S31_TriosCashCup":"cups/a-e85f02997e","S31_SoloVictoryCashCup":"cups/a-af2ca98c52","S31_SquadsReloadVictoryCashCup":"cups/a-02580158c4","S31_SoloZBVictoryCashCup":"cups/a-af2ca98c52","S31_InfluencerCup":"cups/a-be0811d2a0","S30_SoloVictoryCashCup":"cups/a-949fe3f249","S30_SoloZBVictoryCashCup":"cups/a-54c4266908","S30_SquadsVictoryCashCup":"cups/a-02580158c4","S29_DuosZBVictoryCashCup":"cups/a-02580158c4","S29_SoloVictoryCashCup":"cups/a-949fe3f249","S39_ReloadCashVictoryCup_Dec":"cups/a-c8b57e08bd","S39_1MillionUnrealCup":"cups/a-f654cf32bd","S38_SoloSeriesCup":"cups/a-76a72bc4f5","S39_NvidiaCup":"cups/a-34bffa5fc6","S38_SquadsVictoryCup":"cups/a-deef3060bd","S38_DuosVictoryCup":"cups/a-b395d6251b","S38_ReloadQuickCup":"cups/a-7017b7a983","S37_DuosDivisionalCup_Division1":"cups/a-4f7fa3e19e","S37_SoloSeriesCup":"cups/a-acb601afc8","S37_ReloadQuickCup":"cups/a-7017b7a983","S36_VictoryDuosCup":"cups/a-e3c5928e97","S35_VictoryDuosCup":"cups/a-e3c5928e97","S11_WinterRoyale_Mobile":"cups/a-b34bf12bdc","S11_WinterRoyale_Console":"cups/a-b34bf12bdc","XboxCup_Solo1":"cups/a-1819dd1c93","S11_PlatformCup_Mobile":"cups/a-45e7209a96","S11_PlatformCup_PC":"cups/a-5ab3929a99","S11_PlatformCup_Console":"cups/a-a61630c9c0","S14_CC_Platform":"cups/a-0f69f3fdf7","S18_ConsoleChampionsCup":"cups/a-a0517468ac","S13_CC_Platform":"cups/a-f50e743287","S12_CCV2_Platform":"cups/a-4fbe5ae85c","S18_PlaystationCup":"cups/a-6e2f82c5ec","S17_ConsoleChampionsCup":"cups/a-f3e50d2e05","S16_ConsoleChampionsCup":"cups/a-5c4d14af99","S22_PlaystationCupNov":"cups/a-31409ed971","S22_PlaystationCupOct":"cups/a-43544e9da2","S22_PlaystationCupSep":"cups/a-51d7cedc91","S22_ConsoleChampionsCup":"cups/a-d935fb890c","S21_PlaystationCupAug":"cups/a-442a4bf8e7","S21_ConsoleChampionsCup":"cups/a-79beeb3e6c","S21_PlaystationCupJuly":"cups/a-00c69620d6","S21_ConsoleChampionsCupZBM":"cups/a-79beeb3e6c","S12_CC_Platform":"cups/a-4fbe5ae85c","S21_PlaystationCupJune":"cups/a-00c69620d6","S21_SoloCashCupConsole":"cups/a-788260be90","S20_ConsoleChampionsCup":"cups/a-9df98ef7fe","S20_PlaystationCupMay":"cups/a-374c1f34c8","S19_PlaystationCup":"cups/a-0822b34fec","S19_ConsoleChampionsCup":"cups/a-02108ac805","S28_ConsoleCashCupsZB":"cups/a-82ad85e0fb","S28_ConsoleCashCups":"cups/a-82ad85e0fb","S28_PlaystationCupZBDecember":"cups/a-29973b0ab5","S28_PlaystationCupDecember":"cups/a-ec55627842","S26_ConsoleChampionsCupZB":"cups/a-e57c53b1a6","S26_PlaystationCupZBSeptember":"cups/a-e1d5e68884","S26_ConsoleChampionsCup":"cups/a-e57c53b1a6","S26_PlaystationCupSeptember":"cups/a-de1d835729","S25_PlaystationCupZBJune":"cups/a-e1d5e68884","S25_PlaystationCupJune":"cups/a-de1d835729","S24_PlaystationCupMar":"cups/a-6c2a19dea0","S25_ConsoleChampionsCup":"cups/a-e57c53b1a6","S23_PlaystationCupJan":"cups/a-31409ed971","S24_ConsoleChampionsCupMay":"cups/a-e57c53b1a6","S24_ConsoleChampionsCup":"cups/a-d935fb890c","S23_PlaystationCupFeb":"cups/a-31409ed971","S33_PlaystationCup":"cups/a-ec55627842","S32_PlatformReloadDuosCashCupConsole":"cups/a-0d94d108a2","S32_PlatformReloadDuosCashCupMobile":"cups/a-0d94d108a2","S32_PlatformReloadDuosCashCupPC":"cups/a-0d94d108a2","S31_PlatformReloadDuosCashCupConsole":"cups/a-0d94d108a2","S31_PlatformReloadDuosCashCupPC":"cups/a-0d94d108a2","S31_PlatformReloadDuosCashCupMobile":"cups/a-0d94d108a2","S31_PlaystationSypherPKCup":"cups/a-77f6e44b4b","S30_PlaystationCupJune":"cups/a-ec55627842","S30_ConsoleCashCups":"cups/a-d5c03535eb","S30_PlaystationCupZBJune":"cups/a-29973b0ab5","S29_ConsoleCashCupsZB":"cups/a-1a3827e19f","S29_ConsoleCashCups":"cups/a-d5c03535eb","S29_PlaystationCupMarch":"cups/a-ec55627842","S29_PlaystationCupZBMarch":"cups/a-29973b0ab5","S38_PlayStationCupReload":"cups/a-e66ff6746d","S38_TouchOnlyMobileCup":"cups/a-91b673ebee","S37_PlayStationCup":"cups/a-8dc0a9a594","S38_BlitzMobileCup":"cups/a-7de3db9692","S37_ConsoleDuosCashCups":"cups/a-e3c5928e97","S34_PlaystationCup":"cups/a-e66ff6746d","S36_PlayStationCup":"cups/a-e66ff6746d"});
const CC_CUPS_ARCH=[
  {day:'2019-03-01',id:'LAN_ESL_Katowice_Royale_International_Edition_Solos',mode:'solo',n:1,name:"ESL Katowice Royale Solos",payT:CC_CUPS_ARCH_PAY[102],lan:"ESL Katowice Royale Solos · Katowice",invite:100},
  {day:'2019-03-02',id:'LAN_ESL_Katowice_Royale_International_Edition_Duos',mode:'duo',n:1,name:"ESL Katowice Royale Duos",payT:CC_CUPS_ARCH_PAY[103],lan:"ESL Katowice Royale Duos · Katowice",invite:100},
  {day:'2019-03-17',id:'ScallywagCup',mode:'duo',n:1,name:"Scallywag Cup",payT:CC_CUPS_ARCH_PAY[7]},
  {day:'2019-03-24',id:'BlackheartCup',mode:'solo',n:1,name:"Blackheart Cup",payT:CC_CUPS_ARCH_PAY[6]},
  {day:'2019-03-31',id:'LuxeCup',mode:'duo',n:1,name:"Luxe Cup",payT:CC_CUPS_ARCH_PAY[4]},
  {day:'2019-04-07',id:'ONL_Fortnite_World_Cup_2019_Warmup',mode:'duo',n:1,name:"World Cup Warmup",payT:CC_CUPS_ARCH_PAY[123]},
  {day:'2019-07-14',id:'CashCup_Trios1',mode:'trio',n:1,name:"Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[3]},
  {day:'2019-07-21',id:'CashCup_Trios2',mode:'trio',n:1,name:"Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[2]},
  {day:'2019-07-21',id:'XboxCup_Solo1',mode:'solo',n:1,name:"Xbox Cup",payT:CC_CUPS_ARCH_PAY[62]},
  {day:'2019-09-27',id:'LAN_Twitch_Rivals_TwitchCon_Fortnite_Showdown',mode:'trio',n:1,name:"Twitch Rivals TwitchCon Fortnite Showdown",payT:CC_CUPS_ARCH_PAY[104],lan:"Twitch Rivals TwitchCon Fortnite Showdown · San Diego",invite:90},
  {day:'2019-10-30',id:'S11_PlatformCup_Mobile',mode:'solo',n:1,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[63]},
  {day:'2019-10-30',id:'S11_PlatformCup_PC',mode:'solo',n:1,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2019-10-30',id:'S11_PlatformCup_Console',mode:'solo',n:1,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2019-10-31',id:'S11_CC_Contenders',mode:'solo',n:1,name:"Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[1]},
  {day:'2019-11-06',id:'S11_PlatformCup_Mobile',mode:'solo',n:2,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[63]},
  {day:'2019-11-06',id:'S11_PlatformCup_PC',mode:'solo',n:2,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2019-11-06',id:'S11_PlatformCup_Console',mode:'solo',n:2,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2019-11-07',id:'S11_CC_Contenders',mode:'solo',n:2,name:"Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[1]},
  {day:'2019-11-13',id:'S11_PlatformCup_Mobile',mode:'solo',n:3,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[63]},
  {day:'2019-11-13',id:'S11_PlatformCup_PC',mode:'solo',n:3,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2019-11-13',id:'S11_PlatformCup_Console',mode:'solo',n:3,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2019-11-14',id:'S11_CC_Contenders',mode:'solo',n:3,name:"Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[1]},
  {day:'2019-11-18',id:'S11_CC_Contenders',mode:'solo',n:4,name:"Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[1]},
  {day:'2019-11-20',id:'S11_PlatformCup_Mobile',mode:'solo',n:4,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[63]},
  {day:'2019-11-20',id:'S11_PlatformCup_PC',mode:'solo',n:4,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2019-11-20',id:'S11_PlatformCup_Console',mode:'solo',n:4,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2019-11-21',id:'S11_CC_Contenders',mode:'solo',n:5,name:"Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[1]},
  {day:'2019-11-27',id:'S11_PlatformCup_Mobile',mode:'solo',n:5,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[63]},
  {day:'2019-11-27',id:'S11_PlatformCup_PC',mode:'solo',n:5,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2019-11-27',id:'S11_PlatformCup_Console',mode:'solo',n:5,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2019-11-28',id:'S11_CC_Contenders',mode:'solo',n:6,name:"Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[1]},
  {day:'2019-12-01',id:'S11_DreamhackWinter_BYOC',mode:'solo',n:1,name:"DreamHack Winter 19 Featuring Fortnite",payT:CC_CUPS_ARCH_PAY[0]},
  {day:'2019-12-04',id:'S11_PlatformCup_Mobile',mode:'solo',n:6,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[63]},
  {day:'2019-12-04',id:'S11_PlatformCup_PC',mode:'solo',n:6,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2019-12-04',id:'S11_PlatformCup_Console',mode:'solo',n:6,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2019-12-05',id:'S11_CC_Contenders',mode:'solo',n:7,name:"Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[1]},
  {day:'2019-12-11',id:'S11_PlatformCup_Mobile',mode:'solo',n:7,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[63]},
  {day:'2019-12-11',id:'S11_PlatformCup_PC',mode:'solo',n:7,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2019-12-11',id:'S11_PlatformCup_Console',mode:'solo',n:7,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2019-12-16',id:'S11_CC_Contenders',mode:'solo',n:8,name:"Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[1]},
  {day:'2019-12-18',id:'S11_PlatformCup_Mobile',mode:'solo',n:8,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[63]},
  {day:'2019-12-18',id:'S11_PlatformCup_PC',mode:'solo',n:8,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2019-12-18',id:'S11_PlatformCup_Console',mode:'solo',n:8,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2019-12-19',id:'S11_CC_Contenders',mode:'solo',n:9,name:"Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[1]},
  {day:'2019-12-20',id:'S11_WinterRoyale_PC',mode:'duo',n:1,name:"Winter Royale",payT:CC_CUPS_ARCH_PAY[5]},
  {day:'2019-12-20',id:'S11_WinterRoyale_Mobile',mode:'duo',n:1,name:"Winter Royale",payT:CC_CUPS_ARCH_PAY[61]},
  {day:'2019-12-20',id:'S11_WinterRoyale_Console',mode:'duo',n:1,name:"Winter Royale",payT:CC_CUPS_ARCH_PAY[5]},
  {day:'2019-12-21',id:'S11_WinterRoyale_PC',mode:'duo',n:2,name:"Winter Royale",payT:CC_CUPS_ARCH_PAY[5]},
  {day:'2019-12-21',id:'S11_WinterRoyale_Mobile',mode:'duo',n:2,name:"Winter Royale",payT:CC_CUPS_ARCH_PAY[61]},
  {day:'2019-12-21',id:'S11_WinterRoyale_Console',mode:'duo',n:2,name:"Winter Royale",payT:CC_CUPS_ARCH_PAY[5]},
  {day:'2019-12-22',id:'S11_WinterRoyale_PC',mode:'duo',n:3,name:"Winter Royale",payT:CC_CUPS_ARCH_PAY[5]},
  {day:'2019-12-22',id:'S11_WinterRoyale_Mobile',mode:'duo',n:3,name:"Winter Royale",payT:CC_CUPS_ARCH_PAY[61]},
  {day:'2019-12-22',id:'S11_WinterRoyale_Console',mode:'duo',n:3,name:"Winter Royale",payT:CC_CUPS_ARCH_PAY[5]},
  {day:'2020-01-15',id:'S11_PlatformCup_Mobile',mode:'solo',n:9,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[63]},
  {day:'2020-01-15',id:'S11_PlatformCup_PC',mode:'solo',n:9,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2020-01-15',id:'S11_PlatformCup_Console',mode:'solo',n:9,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2020-01-16',id:'S11_CC_Contenders',mode:'solo',n:10,name:"Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[1]},
  {day:'2020-01-22',id:'S11_PlatformCup_Mobile',mode:'solo',n:10,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[63]},
  {day:'2020-01-22',id:'S11_PlatformCup_PC',mode:'solo',n:10,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2020-01-22',id:'S11_PlatformCup_Console',mode:'solo',n:10,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2020-01-23',id:'S11_CC_Contenders',mode:'solo',n:11,name:"Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[1]},
  {day:'2020-01-29',id:'S11_PlatformCup_Mobile',mode:'solo',n:11,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[63]},
  {day:'2020-01-29',id:'S11_PlatformCup_PC',mode:'solo',n:11,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2020-01-29',id:'S11_PlatformCup_Console',mode:'solo',n:11,name:"Solo Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[64]},
  {day:'2020-01-30',id:'S11_CC_Contenders',mode:'solo',n:12,name:"Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[1]},
  {day:'2020-02-02',id:'LAN_Australian_Open_Summer_Smash_2020',mode:'solo',n:1,name:"Australian Open Summer Smash 2020",payT:CC_CUPS_ARCH_PAY[124],lan:"Australian Open Summer Smash 2020 · Melbourne",invite:90,region:'OCE'},
  {day:'2020-02-16',id:'S11_CelebrationCup',mode:'solo',n:1,name:"Celebration Cup",payT:CC_CUPS_ARCH_PAY[29]},
  {day:'2020-02-21',id:'LAN_DreamHack_2020_Anaheim',mode:'solo',n:1,name:"DreamHack Anaheim 2020",payT:CC_CUPS_ARCH_PAY[117],lan:"DreamHack Anaheim 2020 · Anaheim",invite:100,region:'NAC'},
  {day:'2020-03-18',id:'S12_CC_Contenders',mode:'duo',n:1,name:"Contender Cash Cup Solo",payT:CC_CUPS_ARCH_PAY[30]},
  {day:'2020-03-19',id:'S12_CC_Platform',mode:'solo',n:1,name:"Platform Cash Cup Solo",payT:CC_CUPS_ARCH_PAY[76]},
  {day:'2020-03-25',id:'S12_DailyDuos',mode:'duo',n:1,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-03-25',id:'S12_CC_Contenders',mode:'duo',n:2,name:"Contender Cash Cup Solo",payT:CC_CUPS_ARCH_PAY[30]},
  {day:'2020-03-26',id:'S12_DailyDuos',mode:'duo',n:2,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-03-26',id:'S12_CC_Platform',mode:'solo',n:2,name:"Platform Cash Cup Solo",payT:CC_CUPS_ARCH_PAY[76]},
  {day:'2020-03-27',id:'S12_DailyDuos',mode:'duo',n:3,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-03-28',id:'S12_DailyDuos',mode:'duo',n:4,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-03-29',id:'S12_DailyDuos',mode:'duo',n:5,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-03-30',id:'S12_DailyDuos',mode:'duo',n:6,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-03-31',id:'S12_DailyDuos',mode:'duo',n:7,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-01',id:'S12_DailyDuos',mode:'duo',n:8,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-01',id:'S12_CC_Contenders',mode:'duo',n:3,name:"Contender Cash Cup Solo",payT:CC_CUPS_ARCH_PAY[30]},
  {day:'2020-04-02',id:'S12_DailyDuos',mode:'duo',n:9,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-02',id:'S12_CC_Platform',mode:'solo',n:3,name:"Platform Cash Cup Solo",payT:CC_CUPS_ARCH_PAY[76]},
  {day:'2020-04-03',id:'S12_DailyDuos',mode:'duo',n:10,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-04',id:'S12_DailyDuos',mode:'duo',n:11,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-05',id:'S12_DailyDuos',mode:'duo',n:12,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-06',id:'S12_DailyDuos',mode:'duo',n:13,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-07',id:'S12_DailyDuos',mode:'duo',n:14,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-08',id:'S12_DailyDuos',mode:'duo',n:15,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-08',id:'S12_CC_Contenders',mode:'duo',n:4,name:"Contender Cash Cup Solo",payT:CC_CUPS_ARCH_PAY[30]},
  {day:'2020-04-09',id:'S12_DailyDuos',mode:'duo',n:16,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-09',id:'S12_CC_Platform',mode:'solo',n:4,name:"Platform Cash Cup Solo",payT:CC_CUPS_ARCH_PAY[76]},
  {day:'2020-04-10',id:'S12_DailyDuos',mode:'duo',n:17,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-11',id:'S12_DailyDuos',mode:'duo',n:18,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-12',id:'S12_DailyDuos',mode:'duo',n:19,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-13',id:'S12_DailyDuos',mode:'duo',n:20,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-14',id:'S12_DailyDuos',mode:'duo',n:21,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-15',id:'S12_DailyDuos',mode:'duo',n:22,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-15',id:'S12_CC_Contenders',mode:'duo',n:5,name:"Contender Cash Cup Solo",payT:CC_CUPS_ARCH_PAY[30]},
  {day:'2020-04-16',id:'S12_DailyDuos',mode:'duo',n:23,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-16',id:'S12_CC_Platform',mode:'solo',n:5,name:"Platform Cash Cup Solo",payT:CC_CUPS_ARCH_PAY[76]},
  {day:'2020-04-17',id:'S12_DailyDuos',mode:'duo',n:24,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-18',id:'S12_DailyDuos',mode:'duo',n:25,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-19',id:'S12_DailyDuos',mode:'duo',n:26,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-20',id:'S12_DailyDuos',mode:'duo',n:27,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-21',id:'S12_DailyDuos',mode:'duo',n:28,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-26',id:'S12_DailyDuos',mode:'duo',n:29,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-27',id:'S12_DailyDuos',mode:'duo',n:30,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-28',id:'S12_DailyDuos',mode:'duo',n:31,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-29',id:'S12_DailyDuos',mode:'duo',n:32,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-04-30',id:'S12_DailyDuos',mode:'duo',n:33,name:"Daily Duos Cup",payT:CC_CUPS_ARCH_PAY[28]},
  {day:'2020-05-01',id:'S12_CCV2_Platform',mode:'solo',n:1,name:"Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[68]},
  {day:'2020-05-04',id:'S12_CCV2_Contenders',mode:'duo',n:1,name:"Contender Cash Cup",payT:CC_CUPS_ARCH_PAY[27]},
  {day:'2020-05-07',id:'S12_CCV2_Contenders',mode:'duo',n:2,name:"Contender Cash Cup",payT:CC_CUPS_ARCH_PAY[27]},
  {day:'2020-05-11',id:'S12_CCV2_Platform',mode:'solo',n:2,name:"Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[68]},
  {day:'2020-05-14',id:'S12_CCV2_Contenders',mode:'duo',n:3,name:"Contender Cash Cup",payT:CC_CUPS_ARCH_PAY[27]},
  {day:'2020-05-15',id:'S12_CCV2_Platform',mode:'solo',n:3,name:"Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[68]},
  {day:'2020-05-21',id:'S12_CCV2_Contenders',mode:'duo',n:4,name:"Contender Cash Cup",payT:CC_CUPS_ARCH_PAY[27]},
  {day:'2020-05-22',id:'S12_CCV2_Platform',mode:'solo',n:4,name:"Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[68]},
  {day:'2020-05-27',id:'S12_BenjyFishyCup',mode:'solo',n:1,name:"Benjyfishy Cup",payT:CC_CUPS_ARCH_PAY[26]},
  {day:'2020-05-28',id:'S12_CCV2_Contenders',mode:'duo',n:5,name:"Contender Cash Cup",payT:CC_CUPS_ARCH_PAY[27]},
  {day:'2020-05-29',id:'S12_CCV2_Platform',mode:'solo',n:5,name:"Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[68]},
  {day:'2020-06-27',id:'S13_AmarTriosCup',mode:'trio',n:1,name:"Amar Trios Cup",payT:CC_CUPS_ARCH_PAY[25]},
  {day:'2020-06-30',id:'S13_MrSavageTriosCup',mode:'trio',n:1,name:"MrSavage Cup",payT:CC_CUPS_ARCH_PAY[25]},
  {day:'2020-07-01',id:'S13_JacobSoloCup',mode:'solo',n:1,name:"Jacob Cup",payT:CC_CUPS_ARCH_PAY[23]},
  {day:'2020-07-14',id:'S13_MongraalSoloCup',mode:'solo',n:1,name:"Mongraal Cup",payT:CC_CUPS_ARCH_PAY[22]},
  {day:'2020-07-14',id:'S13_DailyTrios',mode:'trio',n:1,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-07-15',id:'S13_CC_Champions',mode:'trio',n:1,name:"Champion Cash Cup",payT:CC_CUPS_ARCH_PAY[18]},
  {day:'2020-07-15',id:'S13_CC_Contenders',mode:'trio',n:1,name:"Contender Cash Cup",payT:CC_CUPS_ARCH_PAY[19]},
  {day:'2020-07-15',id:'S13_DailyTrios',mode:'trio',n:2,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-07-16',id:'S13_DailyTrios',mode:'trio',n:3,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-07-16',id:'S13_CC_Platform',mode:'solo',n:1,name:"Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[67]},
  {day:'2020-07-17',id:'S13_DailyTrios',mode:'trio',n:4,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-07-18',id:'S13_DailyTrios',mode:'trio',n:5,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-07-19',id:'S13_DailyTrios',mode:'trio',n:6,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-07-19',id:'S13_Dreamhack_July',mode:'solo',n:1,name:"DreamHack Online Open",payT:CC_CUPS_ARCH_PAY[12]},
  {day:'2020-07-20',id:'S13_DailyTrios',mode:'trio',n:7,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-07-21',id:'S13_DailyTrios',mode:'trio',n:8,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-07-22',id:'S13_CC_Champions',mode:'trio',n:2,name:"Champion Cash Cup",payT:CC_CUPS_ARCH_PAY[18]},
  {day:'2020-07-22',id:'S13_CC_Contenders',mode:'trio',n:2,name:"Contender Cash Cup",payT:CC_CUPS_ARCH_PAY[19]},
  {day:'2020-07-22',id:'S13_DailyTrios',mode:'trio',n:9,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-07-23',id:'S13_DailyTrios',mode:'trio',n:10,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-07-23',id:'S13_CC_Platform',mode:'solo',n:2,name:"Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[67]},
  {day:'2020-07-24',id:'S13_DailyTrios',mode:'trio',n:11,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-07-25',id:'S13_DailyTrios',mode:'trio',n:12,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-07-26',id:'S13_DailyTrios',mode:'trio',n:13,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-07-27',id:'S13_DailyTrios',mode:'trio',n:14,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-07-28',id:'S13_DailyTrios',mode:'trio',n:15,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-07-29',id:'S13_DailyTrios',mode:'trio',n:16,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-07-30',id:'S13_DailyTrios',mode:'trio',n:17,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-07-31',id:'S13_BughaThrowbackCup',mode:'solo',n:1,name:"Bugha Throwback Cup",payT:CC_CUPS_ARCH_PAY[21]},
  {day:'2020-07-31',id:'S13_DailyTrios',mode:'trio',n:18,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-08-01',id:'S13_DailyTrios',mode:'trio',n:19,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-08-02',id:'S13_DailyTrios',mode:'trio',n:20,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-08-03',id:'S13_DailyTrios',mode:'trio',n:21,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-08-04',id:'S13_DailyTrios',mode:'trio',n:22,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-08-05',id:'S13_DailyTrios',mode:'trio',n:23,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-08-06',id:'S13_DailyTrios',mode:'trio',n:24,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-08-06',id:'S13_CC_Platform',mode:'solo',n:3,name:"Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[67]},
  {day:'2020-08-07',id:'S13_DailyTrios',mode:'trio',n:25,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-08-08',id:'S13_DailyTrios',mode:'trio',n:26,name:"Daily Trios Cup",payT:CC_CUPS_ARCH_PAY[24]},
  {day:'2020-08-12',id:'S13_CC_Champions',mode:'trio',n:3,name:"Champion Cash Cup",payT:CC_CUPS_ARCH_PAY[18]},
  {day:'2020-08-12',id:'S13_CC_Contenders',mode:'trio',n:3,name:"Contender Cash Cup",payT:CC_CUPS_ARCH_PAY[19]},
  {day:'2020-08-12',id:'S13_AquaNyhroxThrowbackCup',mode:'duo',n:1,name:"Aqua & Nyhrox Throwback Cup",payT:CC_CUPS_ARCH_PAY[20]},
  {day:'2020-08-13',id:'S13_CC_Platform',mode:'solo',n:4,name:"Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[67]},
  {day:'2020-08-19',id:'S13_CC_Champions',mode:'trio',n:4,name:"Champion Cash Cup",payT:CC_CUPS_ARCH_PAY[18]},
  {day:'2020-08-19',id:'S13_CC_Contenders',mode:'trio',n:4,name:"Contender Cash Cup",payT:CC_CUPS_ARCH_PAY[19]},
  {day:'2020-08-20',id:'S13_CC_Platform',mode:'solo',n:5,name:"Platform Cash Cup",payT:CC_CUPS_ARCH_PAY[67]},
  {day:'2020-08-23',id:'S13_Dreamhack_August',mode:'solo',n:1,name:"DreamHack Online Open",payT:CC_CUPS_ARCH_PAY[16]},
  {day:'2020-08-26',id:'S13_CC_Champions',mode:'trio',n:5,name:"Champion Cash Cup",payT:CC_CUPS_ARCH_PAY[18]},
  {day:'2020-08-26',id:'S13_CC_Contenders',mode:'trio',n:5,name:"Contender Cash Cup",payT:CC_CUPS_ARCH_PAY[19]},
  {day:'2020-09-13',id:'S13_LlobetiTriosCup',mode:'trio',n:1,name:"Llobeti Cup",payT:CC_CUPS_ARCH_PAY[17]},
  {day:'2020-09-15',id:'S14_CC_Champions',mode:'trio',n:1,name:"Chopper's Champion Cup",payT:CC_CUPS_ARCH_PAY[13]},
  {day:'2020-09-15',id:'S14_CC_Contenders',mode:'trio',n:1,name:"Castor's Contender Cup",payT:CC_CUPS_ARCH_PAY[15]},
  {day:'2020-09-16',id:'S14_WildWednesday',mode:'solo',n:1,name:"Wild Wednesday",payT:CC_CUPS_ARCH_PAY[14]},
  {day:'2020-09-18',id:'S14_CC_Platform',mode:'solo',n:1,name:"Paradox's Platform Cup",payT:CC_CUPS_ARCH_PAY[65]},
  {day:'2020-09-20',id:'S14_Dreamhack_September',mode:'solo',n:1,name:"DreamHack Online Open",payT:CC_CUPS_ARCH_PAY[16]},
  {day:'2020-09-21',id:'S14_CC_Platform',mode:'solo',n:2,name:"Paradox's Platform Cup",payT:CC_CUPS_ARCH_PAY[65]},
  {day:'2020-09-22',id:'S14_CC_Champions',mode:'trio',n:2,name:"Chopper's Champion Cup",payT:CC_CUPS_ARCH_PAY[13]},
  {day:'2020-09-22',id:'S14_CC_Contenders',mode:'trio',n:2,name:"Castor's Contender Cup",payT:CC_CUPS_ARCH_PAY[15]},
  {day:'2020-09-23',id:'S14_WildWednesday',mode:'solo',n:2,name:"Wild Wednesday",payT:CC_CUPS_ARCH_PAY[14]},
  {day:'2020-10-05',id:'S14_CC_Platform',mode:'solo',n:3,name:"Paradox's Platform Cup",payT:CC_CUPS_ARCH_PAY[65]},
  {day:'2020-10-06',id:'S14_CC_Champions',mode:'trio',n:3,name:"Chopper's Champion Cup",payT:CC_CUPS_ARCH_PAY[13]},
  {day:'2020-10-06',id:'S14_CC_Contenders',mode:'trio',n:3,name:"Castor's Contender Cup",payT:CC_CUPS_ARCH_PAY[15]},
  {day:'2020-10-07',id:'S14_WildWednesday',mode:'solo',n:3,name:"Wild Wednesday",payT:CC_CUPS_ARCH_PAY[14]},
  {day:'2020-10-12',id:'S14_CC_Platform',mode:'solo',n:4,name:"Paradox's Platform Cup",payT:CC_CUPS_ARCH_PAY[65]},
  {day:'2020-10-21',id:'S14_WildWednesday',mode:'solo',n:4,name:"Wild Wednesday",payT:CC_CUPS_ARCH_PAY[14]},
  {day:'2020-10-22',id:'S14_Dreamhack_October',mode:'solo',n:1,name:"DreamHack Online Open",payT:CC_CUPS_ARCH_PAY[12]},
  {day:'2020-10-26',id:'S14_CC_Platform',mode:'solo',n:5,name:"Paradox's Platform Cup",payT:CC_CUPS_ARCH_PAY[65]},
  {day:'2020-10-27',id:'S14_CC_Champions',mode:'trio',n:4,name:"Chopper's Champion Cup",payT:CC_CUPS_ARCH_PAY[13]},
  {day:'2020-10-27',id:'S14_CC_Contenders',mode:'trio',n:4,name:"Castor's Contender Cup",payT:CC_CUPS_ARCH_PAY[15]},
  {day:'2020-11-02',id:'S14_CC_Platform',mode:'solo',n:6,name:"Paradox's Platform Cup",payT:CC_CUPS_ARCH_PAY[65]},
  {day:'2020-11-08',id:'S14_Dreamhack_November',mode:'duo',n:1,name:"DreamHack Online Open",payT:CC_CUPS_ARCH_PAY[11]},
  {day:'2020-11-09',id:'S14_CC_Champions',mode:'trio',n:5,name:"Chopper's Champion Cup",payT:CC_CUPS_ARCH_PAY[13]},
  {day:'2020-11-09',id:'S14_CC_Contenders',mode:'trio',n:5,name:"Castor's Contender Cup",payT:CC_CUPS_ARCH_PAY[15]},
  {day:'2020-11-16',id:'S14_CC_Champions',mode:'trio',n:6,name:"Chopper's Champion Cup",payT:CC_CUPS_ARCH_PAY[13]},
  {day:'2020-11-16',id:'S14_CC_Contenders',mode:'trio',n:6,name:"Castor's Contender Cup",payT:CC_CUPS_ARCH_PAY[15]},
  {day:'2020-11-21',id:'S14_MarvelSuperCup',mode:'duo',n:1,name:"$1M Super Cup",payT:CC_CUPS_ARCH_PAY[10]},
  {day:'2020-11-22',id:'S14_EUEncore',mode:'trio',n:1,name:"EU Encore",payT:CC_CUPS_ARCH_PAY[8]},
  {day:'2020-12-12',id:'S15_FrostyFrenzy',mode:'trio',n:1,name:"Frosty Frenzy",payT:CC_CUPS_ARCH_PAY[9]},
  {day:'2020-12-13',id:'S15_FrostyFrenzy',mode:'trio',n:2,name:"Frosty Frenzy",payT:CC_CUPS_ARCH_PAY[9]},
  {day:'2020-12-20',id:'S15_Dreamhack_December',mode:'duo',n:1,name:"DreamHack Online Open",payT:CC_CUPS_ARCH_PAY[11]},
  {day:'2021-01-31',id:'S15_Dreamhack_January',mode:'duo',n:1,name:"DreamHack Online Open",payT:CC_CUPS_ARCH_PAY[11]},
  {day:'2021-05-16',id:'S16_ConsoleChampionsCup',mode:'trio',n:1,name:"Console Champions Cup",payT:CC_CUPS_ARCH_PAY[70]},
  {day:'2021-05-20',id:'S16_Dreamhack_April',mode:'duo',n:1,name:"DreamHack Online Open",payT:CC_CUPS_ARCH_PAY[31]},
  {day:'2021-06-17',id:'S16_UEFA_Euro_Cup_2020',mode:'solo',n:1,name:"UEFA Euro 2020™ Cup",payT:CC_CUPS_ARCH_PAY[33]},
  {day:'2021-07-25',id:'S17_ConsoleChampionsCup',mode:'trio',n:1,name:"Console Champions Cup",payT:CC_CUPS_ARCH_PAY[66]},
  {day:'2021-07-28',id:'S17_BlueCheese',mode:'trio',n:1,name:"Bugha's Late Game",payT:CC_CUPS_ARCH_PAY[32]},
  {day:'2021-08-19',id:'S17_Dreamhack_August',mode:'duo',n:1,name:"DreamHack Online Open",payT:CC_CUPS_ARCH_PAY[31]},
  {day:'2021-10-02',id:'S18_PlaystationCup',mode:'solo',n:1,name:"PlayStation Cup",payT:CC_CUPS_ARCH_PAY[69]},
  {day:'2021-10-10',id:'S18_Dreamhack_October',mode:'duo',n:1,name:"DreamHack Online Open",payT:CC_CUPS_ARCH_PAY[31]},
  {day:'2021-11-07',id:'S18_ConsoleChampionsCup',mode:'trio',n:1,name:"Console Champions Cup",payT:CC_CUPS_ARCH_PAY[66]},
  {day:'2021-11-14',id:'S18_PlaystationCup',mode:'solo',n:2,name:"PlayStation Cup",payT:CC_CUPS_ARCH_PAY[69]},
  {day:'2022-01-30',id:'LAN_Australian_Open_Summer_Smash_2022',mode:'duo',n:1,name:"Australian Open Summer Smash 2022",payT:CC_CUPS_ARCH_PAY[125],lan:"Australian Open Summer Smash 2022 · Online",invite:80,region:'OCE'},
  {day:'2022-02-12',id:'S19_PlaystationCup',mode:'solo',n:1,name:"PlayStation Cup",payT:CC_CUPS_ARCH_PAY[79]},
  {day:'2022-03-19',id:'S19_ConsoleChampionsCup',mode:'duo',n:1,name:"Console Champions Cup",payT:CC_CUPS_ARCH_PAY[72]},
  {day:'2022-05-28',id:'S20_PlaystationCupMay',mode:'duo',n:1,name:"PlayStation Cup",payT:CC_CUPS_ARCH_PAY[78]},
  {day:'2022-06-03',id:'S20_ConsoleChampionsCup',mode:'duo',n:1,name:"Console Champions Cup",payT:CC_CUPS_ARCH_PAY[72]},
  {day:'2022-06-03',id:'LAN_DreamHack_Summer_2022_Dallas',mode:'solo',n:1,name:"DreamHack Dallas 2022 Final",payT:CC_CUPS_ARCH_PAY[105],lan:"DreamHack Dallas 2022 Final · Dallas",invite:100},
  {day:'2022-06-19',id:'S21_DreamhackSummer',mode:'solo',n:1,name:"Dreamhack Summer Battle Royale",payT:CC_CUPS_ARCH_PAY[39]},
  {day:'2022-06-20',id:'S21_DreamhackSummerZBM',mode:'solo',n:1,name:"Dreamhack Summer Zero Build",payT:CC_CUPS_ARCH_PAY[39],zb:true},
  {day:'2022-06-23',id:'S21_SommersetCup',mode:'duo',n:1,name:"Sommerset Cup",payT:CC_CUPS_ARCH_PAY[42]},
  {day:'2022-06-24',id:'S21_TriosCashCupZBM',mode:'trio',n:1,name:"Trios Zero Build Cash Cup",payT:CC_CUPS_ARCH_PAY[40],zb:true},
  {day:'2022-06-24',id:'S21_TriosQuickCashCup',mode:'trio',n:1,name:"Quick Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[41]},
  {day:'2022-06-26',id:'S21_PlaystationCupJune',mode:'solo',n:1,name:"PlayStation Cup",payT:CC_CUPS_ARCH_PAY[73]},
  {day:'2022-06-29',id:'S21_SoloCashCupConsole',mode:'solo',n:1,name:"Console Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[77]},
  {day:'2022-07-01',id:'S21_TriosCashCupZBM',mode:'trio',n:2,name:"Trios Zero Build Cash Cup",payT:CC_CUPS_ARCH_PAY[40],zb:true},
  {day:'2022-07-01',id:'S21_TriosQuickCashCup',mode:'trio',n:2,name:"Quick Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[41]},
  {day:'2022-07-15',id:'S21_TriosCashCupZBM',mode:'trio',n:3,name:"Trios Zero Build Cash Cup",payT:CC_CUPS_ARCH_PAY[40],zb:true},
  {day:'2022-07-15',id:'S21_TriosQuickCashCup',mode:'trio',n:3,name:"Quick Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[41]},
  {day:'2022-07-17',id:'LAN_TimTheTatman_s_Hoedown',mode:'solo',n:1,name:"TimTheTatman's Hoedown",payT:CC_CUPS_ARCH_PAY[106],lan:"TimTheTatman's Hoedown · Arlington",invite:100},
  {day:'2022-07-22',id:'S21_TriosCashCupZBM',mode:'trio',n:4,name:"Trios Zero Build Cash Cup",payT:CC_CUPS_ARCH_PAY[40],zb:true},
  {day:'2022-07-22',id:'S21_TriosQuickCashCup',mode:'trio',n:4,name:"Quick Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[41]},
  {day:'2022-07-24',id:'S21_PlaystationCupJuly',mode:'duo',n:1,name:"PlayStation Cup",payT:CC_CUPS_ARCH_PAY[75]},
  {day:'2022-07-28',id:'LAN_Gamers8_2022_Zero_Build',mode:'duo',n:1,name:"Gamers8 2022 - Zero Build",payT:CC_CUPS_ARCH_PAY[107],zb:true,lan:"Gamers8 2022 - Zero Build · Riyadh",invite:88},
  {day:'2022-07-30',id:'LAN_Gamers8_2022',mode:'duo',n:1,name:"Gamers8 2022",payT:CC_CUPS_ARCH_PAY[107],lan:"Gamers8 2022 · Riyadh",invite:88},
  {day:'2022-08-11',id:'S21_PgodCup',mode:'trio',n:1,name:"Pgod Cup",payT:CC_CUPS_ARCH_PAY[38]},
  {day:'2022-08-12',id:'S21_TriosCashCupZBM',mode:'trio',n:5,name:"Trios Zero Build Cash Cup",payT:CC_CUPS_ARCH_PAY[40],zb:true},
  {day:'2022-08-12',id:'S21_TriosQuickCashCup',mode:'trio',n:5,name:"Quick Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[41]},
  {day:'2022-08-14',id:'S21_ConsoleChampionsCupZBM',mode:'duo',n:1,name:"Console Champions Cup Zero Build",payT:CC_CUPS_ARCH_PAY[74],zb:true},
  {day:'2022-08-17',id:'S21_SoloCashCupConsole',mode:'solo',n:2,name:"Console Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[77]},
  {day:'2022-08-19',id:'S21_TriosCashCupZBM',mode:'trio',n:6,name:"Trios Zero Build Cash Cup",payT:CC_CUPS_ARCH_PAY[40],zb:true},
  {day:'2022-08-19',id:'S21_TriosQuickCashCup',mode:'trio',n:6,name:"Quick Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[41]},
  {day:'2022-08-21',id:'S21_ConsoleChampionsCup',mode:'duo',n:1,name:"Console Champions Cup",payT:CC_CUPS_ARCH_PAY[74]},
  {day:'2022-08-24',id:'S21_SoloCashCupConsole',mode:'solo',n:3,name:"Console Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[77]},
  {day:'2022-08-26',id:'S21_TriosCashCupZBM',mode:'trio',n:7,name:"Trios Zero Build Cash Cup",payT:CC_CUPS_ARCH_PAY[40],zb:true},
  {day:'2022-08-26',id:'S21_TriosQuickCashCup',mode:'trio',n:7,name:"Quick Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[41]},
  {day:'2022-08-28',id:'S21_PlaystationCupAug',mode:'solo',n:1,name:"PlayStation Cup",payT:CC_CUPS_ARCH_PAY[73]},
  {day:'2022-08-31',id:'S21_SoloCashCupConsole',mode:'solo',n:4,name:"Console Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[77]},
  {day:'2022-09-02',id:'S21_TriosCashCupZBM',mode:'trio',n:8,name:"Trios Zero Build Cash Cup",payT:CC_CUPS_ARCH_PAY[40],zb:true},
  {day:'2022-09-02',id:'S21_TriosQuickCashCup',mode:'trio',n:8,name:"Quick Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[41]},
  {day:'2022-09-07',id:'S21_SoloCashCupConsole',mode:'solo',n:5,name:"Console Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[77]},
  {day:'2022-09-08',id:'S21_LGTriosCashCup',mode:'trio',n:1,name:"Late Game Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[37]},
  {day:'2022-09-09',id:'S21_TriosCashCupZBM',mode:'trio',n:9,name:"Trios Zero Build Cash Cup",payT:CC_CUPS_ARCH_PAY[40],zb:true},
  {day:'2022-09-09',id:'S21_TriosQuickCashCup',mode:'trio',n:9,name:"Quick Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[41]},
  {day:'2022-09-13',id:'S21_LGSoloCashCup',mode:'solo',n:1,name:"Late Game Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[35]},
  {day:'2022-09-14',id:'S21_SoloCashCupConsole',mode:'solo',n:6,name:"Console Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[77]},
  {day:'2022-09-16',id:'S21_LGSoloCashCup',mode:'solo',n:2,name:"Late Game Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[35]},
  {day:'2022-09-25',id:'S22_QueasyCup',mode:'trio',n:1,name:"Queasy Cup",payT:CC_CUPS_ARCH_PAY[34]},
  {day:'2022-09-25',id:'S22_PlaystationCupSep',mode:'solo',n:1,name:"PlayStation Cup",payT:CC_CUPS_ARCH_PAY[71]},
  {day:'2022-10-01',id:'S22_ZBMCashCup',mode:'squad',n:1,name:"Zero Build Cash Cup",payT:CC_CUPS_ARCH_PAY[36],zb:true},
  {day:'2022-10-08',id:'S22_ZBMCashCup',mode:'squad',n:2,name:"Zero Build Cash Cup",payT:CC_CUPS_ARCH_PAY[36],zb:true},
  {day:'2022-10-09',id:'LAN_Twitch_Rivals_2022_San_Diego',mode:'trio',n:1,name:"Twitch Rivals Zero Build World Invitational",payT:CC_CUPS_ARCH_PAY[108],zb:true,lan:"Twitch Rivals Zero Build World Invitational · San Diego",invite:60},
  {day:'2022-10-15',id:'S22_ZBMCashCup',mode:'squad',n:3,name:"Zero Build Cash Cup",payT:CC_CUPS_ARCH_PAY[36],zb:true},
  {day:'2022-10-22',id:'S22_ZBMCashCup',mode:'squad',n:4,name:"Zero Build Cash Cup",payT:CC_CUPS_ARCH_PAY[36],zb:true},
  {day:'2022-10-27',id:'S22_PlaystationCupOct',mode:'solo',n:1,name:"PlayStation Cup",payT:CC_CUPS_ARCH_PAY[71]},
  {day:'2022-10-29',id:'S22_ZBMCashCup',mode:'squad',n:5,name:"Zero Build Cash Cup",payT:CC_CUPS_ARCH_PAY[36],zb:true},
  {day:'2022-11-05',id:'S22_ZBMCashCup',mode:'squad',n:6,name:"Zero Build Cash Cup",payT:CC_CUPS_ARCH_PAY[36],zb:true},
  {day:'2022-11-19',id:'S22_ZBMCashCup',mode:'squad',n:7,name:"Zero Build Cash Cup",payT:CC_CUPS_ARCH_PAY[36],zb:true},
  {day:'2022-11-20',id:'S22_ConsoleChampionsCup',mode:'duo',n:1,name:"Console Champions Cup",payT:CC_CUPS_ARCH_PAY[72]},
  {day:'2022-11-20',id:'LAN_DreamHack_Atlanta_2022',mode:'solo',n:1,name:"DreamHack Atlanta 2022",payT:CC_CUPS_ARCH_PAY[109],lan:"DreamHack Atlanta 2022 · Atlanta",invite:100},
  {day:'2022-11-26',id:'S22_ZBMCashCup',mode:'squad',n:8,name:"Zero Build Cash Cup",payT:CC_CUPS_ARCH_PAY[36],zb:true},
  {day:'2022-11-27',id:'LAN_DreamHack_Winter_2022',mode:'solo',n:1,name:"DreamHack Winter 2022",payT:CC_CUPS_ARCH_PAY[110],lan:"DreamHack Winter 2022 · Jönköping",invite:99},
  {day:'2022-11-29',id:'S22_PlaystationCupNov',mode:'solo',n:1,name:"PlayStation Cup",payT:CC_CUPS_ARCH_PAY[71]},
  {day:'2023-01-07',id:'S23_ZBMCashCup',mode:'squad',n:1,name:"ZBM Squads Cash Cup",payT:CC_CUPS_ARCH_PAY[36],zb:true},
  {day:'2023-01-14',id:'S23_ZBMCashCup',mode:'squad',n:2,name:"ZBM Squads Cash Cup",payT:CC_CUPS_ARCH_PAY[36],zb:true},
  {day:'2023-01-21',id:'S23_ZBMCashCup',mode:'squad',n:3,name:"ZBM Squads Cash Cup",payT:CC_CUPS_ARCH_PAY[36],zb:true},
  {day:'2023-01-22',id:'S23_PlaystationCupJan',mode:'solo',n:1,name:"PlayStation Cup",payT:CC_CUPS_ARCH_PAY[71]},
  {day:'2023-01-26',id:'S23_ThunderCup',mode:'duo',n:1,name:"Thunder Cup",payT:CC_CUPS_ARCH_PAY[47]},
  {day:'2023-01-28',id:'S23_ZBMCashCup',mode:'squad',n:4,name:"ZBM Squads Cash Cup",payT:CC_CUPS_ARCH_PAY[36],zb:true},
  {day:'2023-01-29',id:'S23_LGTriosCashCup',mode:'trio',n:1,name:"Late Game Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[49]},
  {day:'2023-01-29',id:'LAN_Australian_Open_Summer_Smash_2023',mode:'solo',n:1,name:"Australian Open Summer Smash 2023",payT:CC_CUPS_ARCH_PAY[126],lan:"Australian Open Summer Smash 2023 · Online",invite:89,region:'OCE'},
  {day:'2023-01-30',id:'S23_LGSoloCashCup',mode:'solo',n:1,name:"Late Game Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[48]},
  {day:'2023-02-04',id:'S23_ZBMCashCup',mode:'squad',n:5,name:"ZBM Squads Cash Cup",payT:CC_CUPS_ARCH_PAY[36],zb:true},
  {day:'2023-02-06',id:'S23_ThunderCup',mode:'duo',n:2,name:"Thunder Cup",payT:CC_CUPS_ARCH_PAY[47]},
  {day:'2023-02-11',id:'S23_ZBMCashCup',mode:'squad',n:6,name:"ZBM Squads Cash Cup",payT:CC_CUPS_ARCH_PAY[36],zb:true},
  {day:'2023-02-18',id:'S23_ZBMCashCup',mode:'squad',n:7,name:"ZBM Squads Cash Cup",payT:CC_CUPS_ARCH_PAY[36],zb:true},
  {day:'2023-02-24',id:'S23_PlaystationCupFeb',mode:'solo',n:1,name:"PlayStation Cup",payT:CC_CUPS_ARCH_PAY[88]},
  {day:'2023-02-25',id:'S23_ZBMCashCup',mode:'squad',n:8,name:"ZBM Squads Cash Cup",payT:CC_CUPS_ARCH_PAY[36],zb:true},
  {day:'2023-03-04',id:'S23_ZBMCashCup',mode:'squad',n:9,name:"ZBM Squads Cash Cup",payT:CC_CUPS_ARCH_PAY[36],zb:true},
  {day:'2023-03-17',id:'S24_MamaBenjyFishy',mode:'trio',n:1,name:"MamaBenjyFishy Creator Cup",payT:CC_CUPS_ARCH_PAY[46]},
  {day:'2023-03-19',id:'S24_ConsoleChampionsCup',mode:'duo',n:1,name:"March Console Champions Cup",payT:CC_CUPS_ARCH_PAY[87]},
  {day:'2023-03-26',id:'S24_PlaystationCupMar',mode:'solo',n:1,name:"PlayStation Cup",payT:CC_CUPS_ARCH_PAY[85]},
  {day:'2023-04-02',id:'S24_TriosZBVictoryCashCup',mode:'trio',n:1,name:"ZB Trios Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-04-09',id:'S24_TriosZBVictoryCashCup',mode:'trio',n:2,name:"ZB Trios Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-04-09',id:'LAN_DreamHack_San_Diego_2023',mode:'duo',n:1,name:"DreamHack San Diego 2023",payT:CC_CUPS_ARCH_PAY[118],lan:"DreamHack San Diego 2023 · San Diego",invite:100,region:'NAC'},
  {day:'2023-04-16',id:'S24_TriosZBVictoryCashCup',mode:'trio',n:3,name:"ZB Trios Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-04-23',id:'S24_TriosZBVictoryCashCup',mode:'trio',n:4,name:"ZB Trios Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-04-30',id:'S24_TriosZBVictoryCashCup',mode:'trio',n:5,name:"ZB Trios Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-05-07',id:'S24_TriosZBVictoryCashCup',mode:'trio',n:6,name:"ZB Trios Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-05-26',id:'S24_ConsoleChampionsCupMay',mode:'duo',n:1,name:"May Console Champions Cup",payT:CC_CUPS_ARCH_PAY[86]},
  {day:'2023-05-28',id:'S24_TriosZBVictoryCashCup',mode:'trio',n:7,name:"ZB Trios Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-06-04',id:'LAN_DreamHack_Dallas_2023',mode:'duo',n:1,name:"DreamHack Dallas 2023",payT:CC_CUPS_ARCH_PAY[118],lan:"DreamHack Dallas 2023 · Dallas",invite:100,region:'NAC'},
  {day:'2023-06-10',id:'LAN_Red_Bull_Contested',mode:'solo',n:1,name:"Red Bull Contested",payT:CC_CUPS_ARCH_PAY[111],lan:"Red Bull Contested · Edinburgh",invite:99},
  {day:'2023-06-18',id:'S25_DuosZBVictoryCashCup',mode:'duo',n:1,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-06-18',id:'LAN_DreamHack_Summer_2023',mode:'duo',n:1,name:"DreamHack Summer 2023",payT:CC_CUPS_ARCH_PAY[118],lan:"DreamHack Summer 2023 · Jönköping",invite:100,region:'EU'},
  {day:'2023-06-19',id:'S25_PlaystationCupZBJune',mode:'solo',n:1,name:"PlayStation Cup Zero Build",payT:CC_CUPS_ARCH_PAY[83],zb:true},
  {day:'2023-06-19',id:'S25_PlaystationCupJune',mode:'solo',n:1,name:"PlayStation Cup Battle Royale",payT:CC_CUPS_ARCH_PAY[84]},
  {day:'2023-06-25',id:'S25_DuosZBVictoryCashCup',mode:'duo',n:2,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-06-30',id:'S25_DuosZBVictoryCashCup',mode:'duo',n:3,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-07-07',id:'LAN_Gamers8_2023',mode:'duo',n:1,name:"Gamers8 2023",payT:CC_CUPS_ARCH_PAY[119],lan:"Gamers8 2023 · Riyadh",invite:88,qualFrom:["LAN_DreamHack_San_Diego_2023","LAN_DreamHack_Dallas_2023","LAN_DreamHack_Summer_2023"],qualTop:10,prInvite:18},
  {day:'2023-07-23',id:'S25_DuosZBVictoryCashCup',mode:'duo',n:4,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-07-30',id:'S25_DuosZBVictoryCashCup',mode:'duo',n:5,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-08-06',id:'S25_DuosZBVictoryCashCup',mode:'duo',n:6,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-08-21',id:'S25_ConsoleChampionsCup',mode:'duo',n:1,name:"Console Champions Cup",payT:CC_CUPS_ARCH_PAY[86]},
  {day:'2023-09-10',id:'S26_DuosZBVictoryCashCup',mode:'duo',n:1,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-09-15',id:'S26_PlaystationCupZBSeptember',mode:'solo',n:1,name:"PlayStation Cup Zero Build",payT:CC_CUPS_ARCH_PAY[83],zb:true},
  {day:'2023-09-16',id:'S26_PlaystationCupSeptember',mode:'solo',n:1,name:"PlayStation Cup Battle Royale",payT:CC_CUPS_ARCH_PAY[84]},
  {day:'2023-09-17',id:'S26_DuosZBVictoryCashCup',mode:'duo',n:2,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-09-24',id:'S26_DuosZBVictoryCashCup',mode:'duo',n:3,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-10-01',id:'S26_DuosZBVictoryCashCup',mode:'duo',n:4,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-10-08',id:'S26_DuosZBVictoryCashCup',mode:'duo',n:5,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-10-22',id:'S26_DuosZBVictoryCashCup',mode:'duo',n:6,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-10-29',id:'S26_ConsoleChampionsCupZB',mode:'duo',n:1,name:"Zero Build Console Champions Cup",payT:CC_CUPS_ARCH_PAY[82],zb:true},
  {day:'2023-10-29',id:'S26_ConsoleChampionsCup',mode:'duo',n:1,name:"Battle Royale Console Champions Cup",payT:CC_CUPS_ARCH_PAY[82]},
  {day:'2023-11-05',id:'S27_OGJacob_Duos',mode:'duo',n:1,name:"Jacob's OG Skirmish",payT:CC_CUPS_ARCH_PAY[44],zb:true},
  {day:'2023-11-05',id:'S27_OGAmar_Duos',mode:'duo',n:1,name:"Amar's OG Skirmish",payT:CC_CUPS_ARCH_PAY[44],zb:true},
  {day:'2023-11-06',id:'S27_OGJacob_Duos',mode:'duo',n:2,name:"Jacob's OG Skirmish",payT:CC_CUPS_ARCH_PAY[44],zb:true},
  {day:'2023-11-06',id:'S27_OGAmar_Duos',mode:'duo',n:2,name:"Amar's OG Skirmish",payT:CC_CUPS_ARCH_PAY[44],zb:true},
  {day:'2023-11-13',id:'S27_DuosZBVictoryCashCup',mode:'duo',n:1,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-11-17',id:'S27_OGGrefg_Duos',mode:'duo',n:1,name:"Grefg's OG Skirmish",payT:CC_CUPS_ARCH_PAY[44]},
  {day:'2023-11-17',id:'S27_OGInoxtag_Duos',mode:'duo',n:1,name:"Inoxtag's OG Skirmish",payT:CC_CUPS_ARCH_PAY[44],zb:true},
  {day:'2023-11-18',id:'S27_OGInoxtag_Duos',mode:'duo',n:2,name:"Inoxtag's OG Skirmish",payT:CC_CUPS_ARCH_PAY[44],zb:true},
  {day:'2023-11-18',id:'S27_OGGrefg_Squads',mode:'squad',n:1,name:"Grefg's OG Skirmish",payT:CC_CUPS_ARCH_PAY[45],zb:true},
  {day:'2023-11-19',id:'S27_OGGrefg_Duos',mode:'duo',n:2,name:"Grefg's OG Skirmish",payT:CC_CUPS_ARCH_PAY[44]},
  {day:'2023-11-19',id:'S27_OGInoxtag_Duos',mode:'duo',n:3,name:"Inoxtag's OG Skirmish",payT:CC_CUPS_ARCH_PAY[44],zb:true},
  {day:'2023-11-22',id:'S27_SoloVictoryCashCup',mode:'solo',n:1,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2023-11-22',id:'S27_DuosZBVictoryCashCup',mode:'duo',n:2,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-11-27',id:'S27_SoloVictoryCashCup',mode:'solo',n:2,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2023-11-27',id:'S27_DuosZBVictoryCashCup',mode:'duo',n:3,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-11-29',id:'S27_SoloVictoryCashCup',mode:'solo',n:3,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2023-11-29',id:'S27_DuosZBVictoryCashCup',mode:'duo',n:4,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-11-30',id:'S27_SoloVictoryCashCup',mode:'solo',n:4,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2023-11-30',id:'S27_DuosZBVictoryCashCup',mode:'duo',n:5,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-12-08',id:'S28_DuosZBVictoryCashCup',mode:'duo',n:1,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-12-08',id:'S28_SoloVictoryCashCup',mode:'solo',n:1,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2023-12-10',id:'S28_DuosZBVictoryCashCup',mode:'duo',n:2,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-12-10',id:'S28_SoloVictoryCashCup',mode:'solo',n:2,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2023-12-14',id:'S28_ConsoleCashCupsZB',mode:'duo',n:1,name:"Duos Console ZB Cash Cup",payT:CC_CUPS_ARCH_PAY[80],zb:true},
  {day:'2023-12-14',id:'S28_ConsoleCashCups',mode:'duo',n:1,name:"Duos Console Cash Cup",payT:CC_CUPS_ARCH_PAY[80]},
  {day:'2023-12-15',id:'S28_DuosZBVictoryCashCup',mode:'duo',n:3,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-12-15',id:'S28_SoloVictoryCashCup',mode:'solo',n:3,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2023-12-15',id:'LAN_DreamHack_Atlanta_2023',mode:'duo',n:1,name:"DreamHack Atlanta 2023",payT:CC_CUPS_ARCH_PAY[120],lan:"DreamHack Atlanta 2023 · Atlanta",invite:100,region:'NAC'},
  {day:'2023-12-16',id:'S28_DuosZBVictoryCashCup',mode:'duo',n:4,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-12-16',id:'S28_SoloVictoryCashCup',mode:'solo',n:4,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2023-12-20',id:'S28_DuosZBVictoryCashCup',mode:'duo',n:5,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-12-20',id:'S28_SoloVictoryCashCup',mode:'solo',n:5,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2023-12-21',id:'S28_DuosZBVictoryCashCup',mode:'duo',n:6,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-12-21',id:'S28_SoloVictoryCashCup',mode:'solo',n:6,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2023-12-22',id:'S28_DuosZBVictoryCashCup',mode:'duo',n:7,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2023-12-22',id:'S28_SoloVictoryCashCup',mode:'solo',n:7,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-01-13',id:'S28_PlaystationCupZBDecember',mode:'solo',n:1,name:"PlayStation Cup Zero Build",payT:CC_CUPS_ARCH_PAY[81],zb:true},
  {day:'2024-01-14',id:'S28_PlaystationCupDecember',mode:'solo',n:1,name:"PlayStation Cup Battle Royale",payT:CC_CUPS_ARCH_PAY[81]},
  {day:'2024-01-18',id:'S28_ConsoleCashCupsZB',mode:'duo',n:2,name:"Duos Console ZB Cash Cup",payT:CC_CUPS_ARCH_PAY[80],zb:true},
  {day:'2024-01-18',id:'S28_ConsoleCashCups',mode:'duo',n:2,name:"Duos Console Cash Cup",payT:CC_CUPS_ARCH_PAY[80]},
  {day:'2024-01-19',id:'S28_DuosZBVictoryCashCup',mode:'duo',n:8,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-01-19',id:'S28_SoloVictoryCashCup',mode:'solo',n:8,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-01-21',id:'S28_DuosZBVictoryCashCup',mode:'duo',n:9,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-01-21',id:'S28_SoloVictoryCashCup',mode:'solo',n:9,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-02-09',id:'S28_DuosZBVictoryCashCup',mode:'duo',n:10,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-02-09',id:'S28_SoloVictoryCashCup',mode:'solo',n:10,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-02-10',id:'S28_ConsoleCashCupsZB',mode:'duo',n:3,name:"Duos Console ZB Cash Cup",payT:CC_CUPS_ARCH_PAY[80],zb:true},
  {day:'2024-02-10',id:'S28_ConsoleCashCups',mode:'duo',n:3,name:"Duos Console Cash Cup",payT:CC_CUPS_ARCH_PAY[80]},
  {day:'2024-02-11',id:'S28_DuosZBVictoryCashCup',mode:'duo',n:11,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-02-11',id:'S28_SoloVictoryCashCup',mode:'solo',n:11,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-02-15',id:'S28_ConsoleCashCupsZB',mode:'duo',n:4,name:"Duos Console ZB Cash Cup",payT:CC_CUPS_ARCH_PAY[80],zb:true},
  {day:'2024-02-15',id:'S28_ConsoleCashCups',mode:'duo',n:4,name:"Duos Console Cash Cup",payT:CC_CUPS_ARCH_PAY[80]},
  {day:'2024-03-17',id:'S29_DuosZBVictoryCashCup',mode:'duo',n:1,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-03-17',id:'S29_SoloVictoryCashCup',mode:'solo',n:1,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-03-22',id:'S29_DuosZBVictoryCashCup',mode:'duo',n:2,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-03-22',id:'S29_SoloVictoryCashCup',mode:'solo',n:2,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-03-28',id:'S29_ConsoleCashCupsZB',mode:'duo',n:1,name:"Duos Console ZB Cash Cup",payT:CC_CUPS_ARCH_PAY[80],zb:true},
  {day:'2024-03-28',id:'S29_ConsoleCashCups',mode:'duo',n:1,name:"Duos Console Cash Cup",payT:CC_CUPS_ARCH_PAY[80]},
  {day:'2024-03-29',id:'S29_DuosZBVictoryCashCup',mode:'duo',n:3,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-03-29',id:'S29_SoloVictoryCashCup',mode:'solo',n:3,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-03-29',id:'S29_PlaystationCupZBMarch',mode:'solo',n:1,name:"PlayStation Cup Zero Build",payT:CC_CUPS_ARCH_PAY[81],zb:true},
  {day:'2024-03-30',id:'S29_PlaystationCupMarch',mode:'solo',n:1,name:"PlayStation Cup Battle Royale",payT:CC_CUPS_ARCH_PAY[81]},
  {day:'2024-03-31',id:'S29_DuosZBVictoryCashCup',mode:'duo',n:4,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-03-31',id:'S29_SoloVictoryCashCup',mode:'solo',n:4,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-04-03',id:'S29_DuosZBVictoryCashCup',mode:'duo',n:5,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-04-03',id:'S29_SoloVictoryCashCup',mode:'solo',n:5,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-04-18',id:'S29_ConsoleCashCupsZB',mode:'duo',n:2,name:"Duos Console ZB Cash Cup",payT:CC_CUPS_ARCH_PAY[80],zb:true},
  {day:'2024-04-18',id:'S29_ConsoleCashCups',mode:'duo',n:2,name:"Duos Console Cash Cup",payT:CC_CUPS_ARCH_PAY[80]},
  {day:'2024-04-24',id:'S29_DuosZBVictoryCashCup',mode:'duo',n:6,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-04-24',id:'S29_SoloVictoryCashCup',mode:'solo',n:6,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-05-05',id:'S29_DuosZBVictoryCashCup',mode:'duo',n:7,name:"Zero Build Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-05-05',id:'S29_SoloVictoryCashCup',mode:'solo',n:7,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-05-09',id:'S29_ConsoleCashCupsZB',mode:'duo',n:3,name:"Duos Console ZB Cash Cup",payT:CC_CUPS_ARCH_PAY[80],zb:true},
  {day:'2024-05-09',id:'S29_ConsoleCashCups',mode:'duo',n:3,name:"Duos Console Cash Cup",payT:CC_CUPS_ARCH_PAY[80]},
  {day:'2024-05-23',id:'S29_ConsoleCashCupsZB',mode:'duo',n:4,name:"Duos Console ZB Cash Cup",payT:CC_CUPS_ARCH_PAY[80],zb:true},
  {day:'2024-05-23',id:'S29_ConsoleCashCups',mode:'duo',n:4,name:"Duos Console Cash Cup",payT:CC_CUPS_ARCH_PAY[80]},
  {day:'2024-06-01',id:'LAN_DreamHack_Dallas_2024',mode:'duo',n:1,name:"DreamHack Dallas 2024",payT:CC_CUPS_ARCH_PAY[131],lan:"DreamHack Dallas 2024 · Dallas",invite:148,ewc24:"dallas"},
  {day:'2024-06-02',id:'S30_SquadsVictoryCashCup',mode:'squad',n:1,name:"Squads Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-06-03',id:'S30_SoloVictoryCashCup',mode:'solo',n:1,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-06-03',id:'S30_SoloZBVictoryCashCup',mode:'solo',n:1,name:"ZB Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-06-09',id:'S30_SquadsVictoryCashCup',mode:'squad',n:2,name:"Squads Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-06-10',id:'S30_SoloVictoryCashCup',mode:'solo',n:2,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-06-10',id:'S30_SoloZBVictoryCashCup',mode:'solo',n:2,name:"ZB Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-06-17',id:'S30_SoloVictoryCashCup',mode:'solo',n:3,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-06-17',id:'S30_SoloZBVictoryCashCup',mode:'solo',n:3,name:"ZB Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-06-24',id:'S30_SoloVictoryCashCup',mode:'solo',n:4,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-06-24',id:'S30_SoloZBVictoryCashCup',mode:'solo',n:4,name:"ZB Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-06-29',id:'S30_PlaystationCupJune',mode:'solo',n:1,name:"PlayStation Cup Battle Royale",payT:CC_CUPS_ARCH_PAY[94]},
  {day:'2024-06-29',id:'S30_ConsoleCashCups',mode:'duo',n:1,name:"Duos Console Cash Cup",payT:CC_CUPS_ARCH_PAY[95]},
  {day:'2024-06-30',id:'S30_SquadsVictoryCashCup',mode:'squad',n:3,name:"Squads Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-06-30',id:'S30_PlaystationCupZBJune',mode:'solo',n:1,name:"PlayStation Cup Zero Build",payT:CC_CUPS_ARCH_PAY[96],zb:true},
  {day:'2024-07-05',id:'LAN_Esports_World_Cup_2024_Qualifier',mode:'duo',n:1,name:"EWC 2024 Qualifier",payT:CC_CUPS_ARCH_PAY[132],lan:"EWC 2024 Qualifier · Online",invite:999,ewc24:"qual"},
  {day:'2024-07-15',id:'S30_SoloVictoryCashCup',mode:'solo',n:5,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-07-15',id:'S30_SoloZBVictoryCashCup',mode:'solo',n:5,name:"ZB Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-07-22',id:'S30_SoloVictoryCashCup',mode:'solo',n:6,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-07-22',id:'S30_SoloZBVictoryCashCup',mode:'solo',n:6,name:"ZB Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-07-29',id:'S30_SoloVictoryCashCup',mode:'solo',n:7,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-07-29',id:'S30_SoloZBVictoryCashCup',mode:'solo',n:7,name:"ZB Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-08-03',id:'S30_ConsoleCashCups',mode:'duo',n:2,name:"Duos Console Cash Cup",payT:CC_CUPS_ARCH_PAY[95]},
  {day:'2024-08-04',id:'S30_SquadsVictoryCashCup',mode:'squad',n:4,name:"Squads Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-08-05',id:'S30_SoloVictoryCashCup',mode:'solo',n:8,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-08-05',id:'S30_SoloZBVictoryCashCup',mode:'solo',n:8,name:"ZB Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-08-08',id:'LAN_Esports_World_Cup_2024',mode:'duo',n:1,name:"Esports World Cup 2024",payT:CC_CUPS_ARCH_PAY[122],lan:"Esports World Cup 2024 · Riyadh",invite:64,ewc24:true},
  {day:'2024-08-10',id:'S30_ConsoleCashCups',mode:'duo',n:3,name:"Duos Console Cash Cup",payT:CC_CUPS_ARCH_PAY[95]},
  {day:'2024-08-11',id:'S30_SquadsVictoryCashCup',mode:'squad',n:5,name:"Squads Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-08-12',id:'S30_SoloVictoryCashCup',mode:'solo',n:9,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-08-12',id:'S30_SoloZBVictoryCashCup',mode:'solo',n:9,name:"ZB Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-08-30',id:'S31_PlatformReloadDuosCashCupConsole',mode:'duo',n:1,name:"Reload Duos Cash Cup (Console)",payT:CC_CUPS_ARCH_PAY[92]},
  {day:'2024-08-30',id:'S31_PlatformReloadDuosCashCupPC',mode:'duo',n:1,name:"Reload Duos Cash Cup (PC)",payT:CC_CUPS_ARCH_PAY[92]},
  {day:'2024-08-30',id:'S31_PlatformReloadDuosCashCupMobile',mode:'duo',n:1,name:"Reload Duos Cash Cup (Mobile)",payT:CC_CUPS_ARCH_PAY[91]},
  {day:'2024-09-01',id:'S31_SquadsReloadVictoryCashCup',mode:'squad',n:1,name:"Reload Squads Victory Cup",payT:CC_CUPS_ARCH_PAY[54]},
  {day:'2024-09-01',id:'S31_PlaystationSypherPKCup',mode:'solo',n:1,name:"PlayStation SypherPK Cup",payT:CC_CUPS_ARCH_PAY[93]},
  {day:'2024-09-02',id:'S31_SoloVictoryCashCup',mode:'solo',n:1,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-09-02',id:'S31_SoloZBVictoryCashCup',mode:'solo',n:1,name:"ZB Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-09-06',id:'S31_InfluencerCup',mode:'duo',n:1,name:"katoo FNCS Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-09-09',id:'S31_SoloVictoryCashCup',mode:'solo',n:2,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-09-09',id:'S31_SoloZBVictoryCashCup',mode:'solo',n:2,name:"ZB Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-09-16',id:'S31_SoloVictoryCashCup',mode:'solo',n:3,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-09-16',id:'S31_SoloZBVictoryCashCup',mode:'solo',n:3,name:"ZB Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-09-20',id:'S31_PlatformReloadDuosCashCupConsole',mode:'duo',n:2,name:"Reload Duos Cash Cup (Console)",payT:CC_CUPS_ARCH_PAY[92]},
  {day:'2024-09-20',id:'S31_PlatformReloadDuosCashCupPC',mode:'duo',n:2,name:"Reload Duos Cash Cup (PC)",payT:CC_CUPS_ARCH_PAY[92]},
  {day:'2024-09-20',id:'S31_PlatformReloadDuosCashCupMobile',mode:'duo',n:2,name:"Reload Duos Cash Cup (Mobile)",payT:CC_CUPS_ARCH_PAY[91]},
  {day:'2024-09-20',id:'LAN_Twitch_Rivals_Cracked_Cup',mode:'duo',n:1,name:"Twitch Rivals Cracked Cup",payT:CC_CUPS_ARCH_PAY[112],lan:"Twitch Rivals Cracked Cup · San Diego",invite:36},
  {day:'2024-09-22',id:'S31_SquadsReloadVictoryCashCup',mode:'squad',n:2,name:"Reload Squads Victory Cup",payT:CC_CUPS_ARCH_PAY[54]},
  {day:'2024-09-23',id:'S31_SoloVictoryCashCup',mode:'solo',n:4,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-09-23',id:'S31_SoloZBVictoryCashCup',mode:'solo',n:4,name:"ZB Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-09-27',id:'S31_PlatformReloadDuosCashCupConsole',mode:'duo',n:3,name:"Reload Duos Cash Cup (Console)",payT:CC_CUPS_ARCH_PAY[92]},
  {day:'2024-09-27',id:'S31_PlatformReloadDuosCashCupPC',mode:'duo',n:3,name:"Reload Duos Cash Cup (PC)",payT:CC_CUPS_ARCH_PAY[92]},
  {day:'2024-09-27',id:'S31_PlatformReloadDuosCashCupMobile',mode:'duo',n:3,name:"Reload Duos Cash Cup (Mobile)",payT:CC_CUPS_ARCH_PAY[91]},
  {day:'2024-09-28',id:'S31_SquadsReloadVictoryCashCup',mode:'squad',n:3,name:"Reload Squads Victory Cup",payT:CC_CUPS_ARCH_PAY[54]},
  {day:'2024-09-30',id:'S31_SoloVictoryCashCup',mode:'solo',n:5,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-09-30',id:'S31_SoloZBVictoryCashCup',mode:'solo',n:5,name:"ZB Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-10-04',id:'S31_PlatformReloadDuosCashCupConsole',mode:'duo',n:4,name:"Reload Duos Cash Cup (Console)",payT:CC_CUPS_ARCH_PAY[92]},
  {day:'2024-10-04',id:'S31_PlatformReloadDuosCashCupPC',mode:'duo',n:4,name:"Reload Duos Cash Cup (PC)",payT:CC_CUPS_ARCH_PAY[92]},
  {day:'2024-10-04',id:'S31_PlatformReloadDuosCashCupMobile',mode:'duo',n:4,name:"Reload Duos Cash Cup (Mobile)",payT:CC_CUPS_ARCH_PAY[91]},
  {day:'2024-10-06',id:'S31_SquadsReloadCup',mode:'squad',n:1,name:"Reload Squads Cash Cup",payT:CC_CUPS_ARCH_PAY[52]},
  {day:'2024-10-06',id:'S31_TriosCashCup',mode:'trio',n:1,name:"Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[53]},
  {day:'2024-10-07',id:'S31_SoloVictoryCashCup',mode:'solo',n:6,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-10-07',id:'S31_SoloZBVictoryCashCup',mode:'solo',n:6,name:"ZB Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-10-13',id:'S31_SquadsReloadCup',mode:'squad',n:2,name:"Reload Squads Cash Cup",payT:CC_CUPS_ARCH_PAY[52]},
  {day:'2024-10-13',id:'S31_TriosCashCup',mode:'trio',n:2,name:"Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[53]},
  {day:'2024-10-14',id:'S31_SoloVictoryCashCup',mode:'solo',n:7,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-10-14',id:'S31_SoloZBVictoryCashCup',mode:'solo',n:7,name:"ZB Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-10-18',id:'S31_PlatformReloadDuosCashCupConsole',mode:'duo',n:5,name:"Reload Duos Cash Cup (Console)",payT:CC_CUPS_ARCH_PAY[92]},
  {day:'2024-10-18',id:'S31_PlatformReloadDuosCashCupPC',mode:'duo',n:5,name:"Reload Duos Cash Cup (PC)",payT:CC_CUPS_ARCH_PAY[92]},
  {day:'2024-10-18',id:'S31_PlatformReloadDuosCashCupMobile',mode:'duo',n:5,name:"Reload Duos Cash Cup (Mobile)",payT:CC_CUPS_ARCH_PAY[91]},
  {day:'2024-10-19',id:'S31_SquadsReloadCup',mode:'squad',n:3,name:"Reload Squads Cash Cup",payT:CC_CUPS_ARCH_PAY[52]},
  {day:'2024-10-19',id:'S31_TriosCashCup',mode:'trio',n:3,name:"Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[53]},
  {day:'2024-10-21',id:'S31_SoloVictoryCashCup',mode:'solo',n:8,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-10-21',id:'S31_SoloZBVictoryCashCup',mode:'solo',n:8,name:"ZB Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-10-26',id:'S31_SquadsReloadCup',mode:'squad',n:4,name:"Reload Squads Cash Cup",payT:CC_CUPS_ARCH_PAY[52]},
  {day:'2024-10-26',id:'S31_TriosCashCup',mode:'trio',n:4,name:"Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[53]},
  {day:'2024-10-28',id:'S31_SquadsReloadCup',mode:'squad',n:5,name:"Reload Squads Cash Cup",payT:CC_CUPS_ARCH_PAY[52]},
  {day:'2024-10-28',id:'S31_PlatformReloadDuosCashCupConsole',mode:'duo',n:6,name:"Reload Duos Cash Cup (Console)",payT:CC_CUPS_ARCH_PAY[92]},
  {day:'2024-10-28',id:'S31_PlatformReloadDuosCashCupPC',mode:'duo',n:6,name:"Reload Duos Cash Cup (PC)",payT:CC_CUPS_ARCH_PAY[92]},
  {day:'2024-10-28',id:'S31_PlatformReloadDuosCashCupMobile',mode:'duo',n:6,name:"Reload Duos Cash Cup (Mobile)",payT:CC_CUPS_ARCH_PAY[91]},
  {day:'2024-10-29',id:'S31_PlatformReloadDuosCashCupConsole',mode:'duo',n:7,name:"Reload Duos Cash Cup (Console)",payT:CC_CUPS_ARCH_PAY[92]},
  {day:'2024-10-29',id:'S31_PlatformReloadDuosCashCupPC',mode:'duo',n:7,name:"Reload Duos Cash Cup (PC)",payT:CC_CUPS_ARCH_PAY[92]},
  {day:'2024-10-29',id:'S31_PlatformReloadDuosCashCupMobile',mode:'duo',n:7,name:"Reload Duos Cash Cup (Mobile)",payT:CC_CUPS_ARCH_PAY[91]},
  {day:'2024-10-30',id:'S31_PlatformReloadDuosCashCupConsole',mode:'duo',n:8,name:"Reload Duos Cash Cup (Console)",payT:CC_CUPS_ARCH_PAY[92]},
  {day:'2024-10-30',id:'S31_PlatformReloadDuosCashCupPC',mode:'duo',n:8,name:"Reload Duos Cash Cup (PC)",payT:CC_CUPS_ARCH_PAY[92]},
  {day:'2024-10-30',id:'S31_PlatformReloadDuosCashCupMobile',mode:'duo',n:8,name:"Reload Duos Cash Cup (Mobile)",payT:CC_CUPS_ARCH_PAY[91]},
  {day:'2024-10-31',id:'S31_TriosCashCup',mode:'trio',n:5,name:"Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[53]},
  {day:'2024-11-07',id:'S32_TriosCashCup',mode:'trio',n:1,name:"Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[50]},
  {day:'2024-11-07',id:'S32_TriosCashCup_ZB',mode:'trio',n:1,name:"ZB Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[51],zb:true},
  {day:'2024-11-08',id:'S32_SoloVictoryCashCup',mode:'solo',n:1,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-11-08',id:'S32_SoloZBVictoryCashCup',mode:'solo',n:1,name:"ZB Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-11-09',id:'S32_TriosCashCup',mode:'trio',n:2,name:"Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[50]},
  {day:'2024-11-09',id:'S32_PlatformReloadDuosCashCupConsole',mode:'duo',n:1,name:"Reload Duos Cash Cup (Console)",payT:CC_CUPS_ARCH_PAY[90]},
  {day:'2024-11-09',id:'S32_PlatformReloadDuosCashCupMobile',mode:'duo',n:1,name:"Reload Duos Cash Cup (Mobile)",payT:CC_CUPS_ARCH_PAY[91]},
  {day:'2024-11-09',id:'S32_PlatformReloadDuosCashCupPC',mode:'duo',n:1,name:"Reload Duos Cash Cup (PC)",payT:CC_CUPS_ARCH_PAY[90]},
  {day:'2024-11-10',id:'S32_SquadsReloadCup',mode:'squad',n:1,name:"Reload Squads Cash Cup",payT:CC_CUPS_ARCH_PAY[52]},
  {day:'2024-11-14',id:'S32_TriosCashCup',mode:'trio',n:3,name:"Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[50]},
  {day:'2024-11-15',id:'S32_SoloVictoryCashCup',mode:'solo',n:2,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-11-15',id:'S32_SoloZBVictoryCashCup',mode:'solo',n:2,name:"ZB Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-11-16',id:'S32_TriosCashCup',mode:'trio',n:4,name:"Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[50]},
  {day:'2024-11-18',id:'S32_TriosCashCup_ZB',mode:'trio',n:2,name:"ZB Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[51],zb:true},
  {day:'2024-11-21',id:'S32_TriosCashCup',mode:'trio',n:5,name:"Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[50]},
  {day:'2024-11-21',id:'S32_TriosCashCup_ZB',mode:'trio',n:3,name:"ZB Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[51],zb:true},
  {day:'2024-11-22',id:'S32_SoloVictoryCashCup',mode:'solo',n:3,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-11-22',id:'S32_SoloZBVictoryCashCup',mode:'solo',n:3,name:"ZB Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-11-23',id:'S32_TriosCashCup',mode:'trio',n:6,name:"Trios Cash Cup",payT:CC_CUPS_ARCH_PAY[50]},
  {day:'2024-11-25',id:'S32_SoloVictoryCashCup',mode:'solo',n:4,name:"Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43]},
  {day:'2024-11-25',id:'S32_SoloZBVictoryCashCup',mode:'solo',n:4,name:"ZB Solo Victory Cup",payT:CC_CUPS_ARCH_PAY[43],zb:true},
  {day:'2024-12-08',id:'S33_PlaystationCup',mode:'solo',n:1,name:"Solo Cash Cup",payT:CC_CUPS_ARCH_PAY[89]},
  {day:'2025-04-30',id:'S34_PlaystationCup',mode:'solo',n:1,name:"PlayStation Cup",payT:CC_CUPS_ARCH_PAY[101]},
  {day:'2025-05-10',id:'LAN_Fortnite_Champion_Series_Pro_Am_2025',mode:'duo',n:1,name:"FNCS 2025 Pro-Am",payT:CC_CUPS_ARCH_PAY[113],lan:"FNCS 2025 Pro-Am · Los Angeles",invite:40},
  {day:'2025-05-17',id:'S35_VictoryDuosCup',mode:'duo',n:1,name:"Duos Console Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-05-24',id:'S35_VictoryDuosCup',mode:'duo',n:2,name:"Duos Console Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-05-31',id:'S35_VictoryDuosCup',mode:'duo',n:3,name:"Duos Console Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-05-31',id:'LAN_Twitch_Rivals_Cracked_Cup_TwitchCon_Europe_Reload',mode:'duo',n:1,name:"Twitch Rivals Cracked Cup 2025",payT:CC_CUPS_ARCH_PAY[127],lan:"Twitch Rivals Cracked Cup 2025 · Rotterdam",invite:40,region:'EU'},
  {day:'2025-06-13',id:'S36_VictoryDuosCup',mode:'duo',n:1,name:"Duos Console Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-06-20',id:'S36_VictoryDuosCup',mode:'duo',n:2,name:"Duos Console Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-06-27',id:'S36_VictoryDuosCup',mode:'duo',n:3,name:"Duos Console Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-07-18',id:'S36_VictoryDuosCup',mode:'duo',n:4,name:"Duos Console Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-07-25',id:'S36_VictoryDuosCup',mode:'duo',n:5,name:"Duos Console Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-07-26',id:'S36_PlayStationCup',mode:'solo',n:1,name:"PlayStation Cup",payT:CC_CUPS_ARCH_PAY[99]},
  {day:'2025-08-01',id:'S36_VictoryDuosCup',mode:'duo',n:6,name:"Duos Console Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-08-17',id:'S37_ConsoleDuosCashCups',mode:'duo',n:1,name:"Duos Console Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-08-22',id:'LAN_Amar_x_Rohat_Cup_2',mode:'duo',n:1,name:"Amar x Rohat Cup #2",payT:CC_CUPS_ARCH_PAY[114],lan:"Amar x Rohat Cup #2 · Cologne",invite:32},
  {day:'2025-08-24',id:'S37_ConsoleDuosCashCups',mode:'duo',n:2,name:"Duos Console Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-08-31',id:'S37_ConsoleDuosCashCups',mode:'duo',n:3,name:"Duos Console Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-09-04',id:'S37_PlayStationCup',mode:'solo',n:1,name:"PlayStation Cup",payT:CC_CUPS_ARCH_PAY[99]},
  {day:'2025-09-05',id:'S37_ReloadQuickCup',mode:'duo',n:1,name:"Reload Quick Cup",payT:CC_CUPS_ARCH_PAY[57]},
  {day:'2025-09-12',id:'S37_ReloadQuickCup',mode:'duo',n:2,name:"Reload Quick Cup",payT:CC_CUPS_ARCH_PAY[57]},
  {day:'2025-09-14',id:'S37_ConsoleDuosCashCups',mode:'duo',n:4,name:"Duos Console Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-09-19',id:'S37_ReloadQuickCup',mode:'duo',n:3,name:"Reload Quick Cup",payT:CC_CUPS_ARCH_PAY[57]},
  {day:'2025-09-20',id:'S37_DuosDivisionalCup_Division1',mode:'duo',n:1,name:"Duos Division 1",payT:CC_CUPS_ARCH_PAY[59]},
  {day:'2025-09-20',id:'S37_ConsoleDuosCashCups',mode:'duo',n:5,name:"Duos Console Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-09-27',id:'S37_DuosDivisionalCup_Division1',mode:'duo',n:2,name:"Duos Division 1",payT:CC_CUPS_ARCH_PAY[59]},
  {day:'2025-09-27',id:'S37_ConsoleDuosCashCups',mode:'duo',n:6,name:"Duos Console Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-09-28',id:'S37_ReloadQuickCup',mode:'duo',n:4,name:"Reload Quick Cup",payT:CC_CUPS_ARCH_PAY[57]},
  {day:'2025-10-04',id:'S37_DuosDivisionalCup_Division1',mode:'duo',n:3,name:"Duos Division 1",payT:CC_CUPS_ARCH_PAY[59]},
  {day:'2025-10-04',id:'S37_ConsoleDuosCashCups',mode:'duo',n:7,name:"Duos Console Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-10-10',id:'S37_ReloadQuickCup',mode:'duo',n:5,name:"Reload Quick Cup",payT:CC_CUPS_ARCH_PAY[57]},
  {day:'2025-10-11',id:'S37_DuosDivisionalCup_Division1',mode:'duo',n:4,name:"Duos Division 1",payT:CC_CUPS_ARCH_PAY[59]},
  {day:'2025-10-11',id:'S37_ConsoleDuosCashCups',mode:'duo',n:8,name:"Duos Console Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-10-17',id:'S37_ReloadQuickCup',mode:'duo',n:6,name:"Reload Quick Cup",payT:CC_CUPS_ARCH_PAY[57]},
  {day:'2025-10-18',id:'S37_DuosDivisionalCup_Division1',mode:'duo',n:5,name:"Duos Division 1",payT:CC_CUPS_ARCH_PAY[59]},
  {day:'2025-10-18',id:'S37_ConsoleDuosCashCups',mode:'duo',n:9,name:"Duos Console Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-10-25',id:'S37_ConsoleDuosCashCups',mode:'duo',n:10,name:"Duos Console Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-10-26',id:'S37_SoloSeriesCup',mode:'solo',n:1,name:"Solo Series",payT:CC_CUPS_ARCH_PAY[60]},
  {day:'2025-10-26',id:'S37_ReloadQuickCup',mode:'duo',n:7,name:"Reload Quick Cup",payT:CC_CUPS_ARCH_PAY[57]},
  {day:'2025-10-29',id:'S37_DuosDivisionalCup_Division1',mode:'duo',n:6,name:"Duos Division 1",payT:CC_CUPS_ARCH_PAY[59]},
  {day:'2025-11-05',id:'S38_TouchOnlyMobileCup',mode:'solo',n:1,name:"Touch-Only Test Cup",payT:CC_CUPS_ARCH_PAY[98],zb:true},
  {day:'2025-11-07',id:'S38_ReloadQuickCup',mode:'duo',n:1,name:"Reload Quick Cup (Reload)",payT:CC_CUPS_ARCH_PAY[57]},
  {day:'2025-11-08',id:'S38_DuosVictoryCup',mode:'duo',n:1,name:"Duos Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-11-09',id:'S38_SquadsVictoryCup',mode:'squad',n:1,name:"Squads Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-11-14',id:'S38_ReloadQuickCup',mode:'duo',n:2,name:"Reload Quick Cup (Reload)",payT:CC_CUPS_ARCH_PAY[57]},
  {day:'2025-11-15',id:'S38_DuosVictoryCup',mode:'duo',n:2,name:"Duos Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-11-16',id:'S38_SquadsVictoryCup',mode:'squad',n:2,name:"Squads Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-11-16',id:'S38_BlitzMobileCup',mode:'solo',n:1,name:"Blitz Mobile Cup",payT:CC_CUPS_ARCH_PAY[100],zb:true},
  {day:'2025-11-21',id:'S38_ReloadQuickCup',mode:'duo',n:3,name:"Reload Quick Cup (Reload)",payT:CC_CUPS_ARCH_PAY[57]},
  {day:'2025-11-22',id:'S38_DuosVictoryCup',mode:'duo',n:3,name:"Duos Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-11-23',id:'S38_SquadsVictoryCup',mode:'squad',n:3,name:"Squads Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-11-23',id:'S38_BlitzMobileCup',mode:'solo',n:2,name:"Blitz Mobile Cup",payT:CC_CUPS_ARCH_PAY[100],zb:true},
  {day:'2025-11-24',id:'S38_SoloSeriesCup',mode:'solo',n:1,name:"Solo Series Victory Cash Cup",payT:CC_CUPS_ARCH_PAY[57]},
  {day:'2025-11-25',id:'S38_PlayStationCupReload',mode:'duo',n:1,name:"PlayStation Reload Cup",payT:CC_CUPS_ARCH_PAY[97]},
  {day:'2025-12-05',id:'S39_ReloadCashVictoryCup_Dec',mode:'duo',n:1,name:"Reload Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-12-09',id:'S39_ReloadCashVictoryCup_Dec',mode:'duo',n:2,name:"Reload Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-12-13',id:'S39_ReloadCashVictoryCup_Dec',mode:'duo',n:3,name:"Reload Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-12-14',id:'S39_ReloadCashVictoryCup_Dec',mode:'duo',n:4,name:"Reload Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-12-16',id:'S39_ReloadCashVictoryCup_Dec',mode:'duo',n:5,name:"Reload Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-12-20',id:'S39_ReloadCashVictoryCup_Dec',mode:'duo',n:6,name:"Reload Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2025-12-20',id:'S39_1MillionUnrealCup',mode:'duo',n:1,name:"$1 Million Unreal Cup",payT:CC_CUPS_ARCH_PAY[56]},
  {day:'2025-12-21',id:'S39_NvidiaCup',mode:'solo',n:1,name:"NVIDIA GeForce RTX Cup",payT:CC_CUPS_ARCH_PAY[58]},
  {day:'2026-01-11',id:'S39_ReloadCashVictoryCup_Dec',mode:'duo',n:7,name:"Reload Duos Victory Cup",payT:CC_CUPS_ARCH_PAY[55]},
  {day:'2026-03-21',id:'LAN_Amar_Lost_Legends_European_Showdown',mode:'squad',n:1,name:"Lost Legends: European Showdown",payT:CC_CUPS_ARCH_PAY[129],zb:true,lan:"Lost Legends: European Showdown · Online",invite:88,region:'EU'},
  {day:'2026-04-22',id:'LAN_Saudi_eLeague_2026',mode:'duo',n:1,name:"Saudi eLeague 2026",payT:CC_CUPS_ARCH_PAY[121],lan:"Saudi eLeague 2026 · Riyadh",invite:40},
  {day:'2026-08-15',id:'LAN_Red_Bull_Red_Bull_Reshuffle_2026_Reload',mode:'solo',n:1,name:"Red Bull Reshuffle",payT:CC_CUPS_ARCH_PAY[115],lan:"Red Bull Reshuffle · Vienna",invite:40,reshuffle:true},
  {day:'2026-09-17',id:'LAN_Virtuocity_Battleground_Qatar_2026',mode:'duo',n:1,name:"Virtuocity Battleground Qatar 2026",payT:CC_CUPS_ARCH_PAY[130],lan:"Virtuocity Battleground Qatar 2026 · Doha",invite:40,region:'ME'},
  {day:'2026-09-21',id:'LAN_Amar_Rohat_Pro_Invitational',mode:'solo',n:1,name:"Amar x Rohat: Pro Invitational",payT:CC_CUPS_ARCH_PAY[116],lan:"Amar x Rohat: Pro Invitational · Online",invite:100}
];
// ==== /Cups archive ====
function ccVictoryBase(){ return ccIs2020() ? [] : ccIs2019() ? CC_VICTORY_2019 : ccIs2021() ? CC_VICTORY_2021 : ccIs2022() ? CC_VICTORY_2022 : ccIs2023() ? CC_VICTORY_2023 : ccIs2024() ? CC_VICTORY_2024 : ccIs2025() ? CC_VICTORY_2025
  : ccYearShift()>0 ? CC_VICTORY.concat(ccNextYearEvents()) : CC_VICTORY; }
/* СОБЫТИЯ 2027-ГО (17.10, его «2» из идей: Epic 27.09.2026 объявил на 2027 Reload Zero Build Championship и Arenas Fight Night —
   fortnitetracker.com/article/2437). Годы после 2026-го живут по календарю 2026-го (ccYearShift), поэтому дни — в датах 2026-го,
   на экране они уже с годом сдвига. Дни выбраны свободные (пятницы без FNCS/кубков, проба free.js). Расписания и призовых Epic
   ещё не публиковал — это наш расклад, а не измерение:
   · Reload Zero Build Championship — два открытых отбора (машина Victory Cup, без строек, лобби Reload) и финал на 40 человек
     по приглашению: топ-10 любого отбора (qualFrom), остальные — по PR.
   · Arenas Fight Night — вечер файтов 1 на 1 сеткой на 16 (runCareerFightNight), до пяти раундов, как дружеский 1v1.
   В игре вдвоём Fight Night нет: сетка не локстеп. */
const CC_Y27_ZBC_PAY={EU:[[1,1500],[2,1000],[3,800],[5,600],[10,400],[25,250],[50,150],[100,100]]};
const CC_Y27_ZBC_FINAL_PAY={EU:[[1,25000],[2,15000],[3,10000],[5,6000],[10,3000],[20,1500]]};
const CC_Y27_FN_PAY={EU:[[1,5000],[2,2500],[4,1000],[8,500]]};
const CC_NEXT_YEAR_EVENTS=[
  {day:'2026-01-30', id:'Y27_ArenasFightNight', mode:'solo', n:1, name:'Arenas Fight Night', fight:true, payT:CC_Y27_FN_PAY},
  {day:'2026-03-13', id:'Y27_ArenasFightNight', mode:'solo', n:2, name:'Arenas Fight Night', fight:true, payT:CC_Y27_FN_PAY},
  {day:'2026-04-03', id:'Y27_ReloadZBChampionship_Q', mode:'duo', n:1, name:'Reload Zero Build Championship · Qualifier', zb:true, payT:CC_Y27_ZBC_PAY},
  {day:'2026-04-10', id:'Y27_ReloadZBChampionship_Q', mode:'duo', n:2, name:'Reload Zero Build Championship · Qualifier', zb:true, payT:CC_Y27_ZBC_PAY},
  {day:'2026-04-24', id:'Y27_ReloadZBChampionship_Final', mode:'duo', n:1, name:'Reload Zero Build Championship · Final', zb:true, payT:CC_Y27_ZBC_FINAL_PAY,
   invite:40, qualFrom:['Y27_ReloadZBChampionship_Q'], qualTop:10, prInvite:20},
  {day:'2026-07-31', id:'Y27_ArenasFightNight', mode:'solo', n:3, name:'Arenas Fight Night', fight:true, payT:CC_Y27_FN_PAY},
  {day:'2026-10-09', id:'Y27_ArenasFightNight', mode:'solo', n:4, name:'Arenas Fight Night', fight:true, payT:CC_Y27_FN_PAY}
];
function ccNextYearEvents(){
  const mp=typeof ccMpOn==='function' && ccMpOn();
  return CC_NEXT_YEAR_EVENTS.filter(v=>!(mp && v.fight));
}
function ccVictoryListKey(){ let cn=''; try{ cn=(ccShopSlotRank('ps')?'p':'')+(ccShopSlotRank('xbox')?'x':'')+(ccMobileOwn()?'m':'')+(ccPlatCalOn('console')?'C':'')+(ccPlatCalOn('mobile')?'M':''); const ms=CAREER && CAREER.career && CAREER.career.mobSer; if(ms) cn+='|'+ms.next+ms.until+(ms.heat||'');
  const gs=CAREER && CAREER.career && CAREER.career.mobGS; if(gs) cn+='|'+gs.stage+(gs.grp||''); if(CAREER && CAREER.career && CAREER.career.mobLcq) cn+='|l'+CAREER.career.mobLcq; cn+='|'+(ccPlatCalOn('console')?1:0)+(ccPlatCalOn('mobile')?1:0); }catch(e){}
  return ccCalYear()+'|'+ccYearShift()+'|'+((typeof ccMpOn==='function' && ccMpOn()) ? 1 : 0)+'|'+ccOwnCupsVer()+'|z'+((CAREER && CAREER.career && CAREER.career.size)||2)+'|'+cn; }
/* Остальные денежные капы года — всё, что в архиве Tracker платило деньгами (ecomm в
   PayoutTable) и не вошло выше: DreamHack Online Open, Winter Royale, капы стримеров и
   т. п. (CC_CUPS_ARCH, tools/build-cups-archive.js). Вечер — машина Victory Cup, выплаты —
   таблица Epic региона (payT). День, где уже стоит FNCS, кубок дивизиона или другой кап,
   остаётся за ним: два вечера в один день карьера не играет. 2026-й свой список держит сам. */
