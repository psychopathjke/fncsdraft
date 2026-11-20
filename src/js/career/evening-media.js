/*@@PART js/career/evening-media.js@@*/
/* ВЕЧЕР ПО ФАКТАМ (16.10, его «123»: план коуча, живые твиты, разбор вечера).
   Одна запись на вечер: CC_EVENING = {day, rows:[…], posted}. Строку кладёт score() в simulateGamesLive для своей команды
   после каждой игры: место, киллы, от кого/чего погиб (_deathCause движка: ник команды, 'storm', 'surge'), зона, погиб ли
   на высадке, ротация, и сколько пунктов плана коуча выполнено. Из неё — карточка «Разбор вечера» и посты в ленте. */
let CC_EVENING=null, CC_GAME_PICKS={}, CC_GAME_OPTS={}, CC_COACH_PLAN=null;
function ccEveningRows(){
  const d=(typeof careerToday==='function' && CAREER && CAREER.career) ? careerToday() : '';
  if(!CC_EVENING || CC_EVENING.day!==d) CC_EVENING={day:d, rows:[], posted:false};
  return CC_EVENING.rows;
}
// Ник из имени команды-убийцы: «Peterbot & Pollo» → Peterbot (первый — тот, кто назван первым).
function ccEveningKillerHandle(name){
  const n=String(name||'').replace(/<[^>]+>/g,'').split(/\s*(?:&|\/|\+|,| x )\s*/)[0].trim();
  return n;
}
function ccEveningRecord(t, g, place, elims, pts, of){
  if(!t || !t.isYou || !CAREER || !CAREER.career) return;
  const plan=CC_COACH_PLAN ? ccCoachPlanScore() : null;
  /* mk/who — киллы каждого игрока отряда в этой игре (zone-sim _mK, порядок team.squad) и их ники: из них аналитик
     собирает личную статистику вечера (ccAnalystMe). Своя строка — ник карьеры. */
  const meN=(CAREER.player && (CAREER.player.handle||CAREER.player.nick))||'';
  const who=(t.squad||[]).map(c=>(c && (c.handle||c.nick))||'');
  ccEveningRows().push({g, place, elims, pts:pts||0, of:of||0, mk:t._mK ? t._mK.slice() : null, who, me:meN,
                        dc:t._deathCause||null, dz:t._zoneReached||null, dd:!!t._droppedOut,
                        rot:t._rot||null, plan, zp:t._zonePull!=null ? t._zonePull : null});
}
/* ПЛАН КОУЧА. Строится перед первой игрой вечера, если коуч нанят (одиночная игра). Ставка — по дивизиону: в первых двух
   коуч играет от силы (контест, с зоной, файты, центр в эндгейме), ниже — от выживания (своя точка, рано, без лишних файтов,
   край зоны). Ротацию «с зоной»/«рано» меняет день: у плана одного коуча нет одной заготовки на весь год. */
function ccCoachPlanMake(){
  const c=(typeof ccCoach==='function') ? ccCoach() : null;
  if(!c || (typeof ccMpOn==='function' && ccMpOn())) return null;
  const div=(CAREER.career.division||5);
  const strong=div<=2;
  const dayOdd=(ccHashStr ? ccHashStr(careerToday()+'|'+c.id) : 0)%2===1;
  return {coach:c.name, drop:strong ? 'contest' : 'home', rot:strong ? (dayOdd ? 'with' : 'early') : (dayOdd ? 'early' : 'with'),
          fight:strong ? 'fight' : 'avoid', late:strong ? 'mid' : 'edge'};
}
// Какой вариант вопроса — пункт плана. null — у этого вопроса пункта нет.
function ccCoachPlanTarget(kind, ids){
  const p=CC_COACH_PLAN; if(!p || !ids) return null;
  const k=String(kind||'').replace(/:.*$/, ''), has=x=>ids.indexOf(x)>=0 ? x : null;
  if(k==='drop') return has(p.drop) || (p.drop==='home' ? has('quiet') : null);
  if(k==='rot') return has(p.rot);
  if(k==='site') return p.fight==='fight' ? has('fight') : has('leave');
  if(k==='farm') return p.fight==='fight' ? has('fight') : has('full');
  if(k==='mid') return p.fight==='fight' ? has('fight') : has('stay');
  if(k==='late') return has(p.late);
  return null;
}
function ccCoachPlanScore(){
  let ok=0, n=0;
  Object.keys(CC_GAME_PICKS).forEach(k=>{ const tg=ccCoachPlanTarget(k, CC_GAME_OPTS[k]); if(!tg) return; n++; if(CC_GAME_PICKS[k]===tg) ok++; });
  return n ? {ok, n} : null;
}
// Карточка плана перед первой игрой — одна кнопка «Принято»; под скипом и симуляцией проходит сама (ccChoiceBox).
async function ccCoachPlanShow(){
  CC_COACH_PLAN=ccCoachPlanMake();
  if(!CC_COACH_PLAN) return;
  const T=L(), p=CC_COACH_PLAN;
  const li=(a,b)=>'<li><em>'+esc(a)+'</em> '+esc(b)+'</li>';
  const hint='<ul class="cc-plan">'+li(T.ccPlanDrop, T['ccPlanDrop_'+p.drop])+li(T.ccPlanRot, T['ccPlanRot_'+p.rot])+
    li(T.ccPlanFight, T['ccPlanFight_'+p.fight])+li(T.ccPlanLate, T['ccPlanLate_'+p.late])+'</ul>';
  /* Карточку плана перед первой игрой убрали (его слово 19.11, скрин «game plan for tonight»: «я бы это убрал»). План
     остаётся тихо: коуч подсказывает в каждом вопросе (ccCoachOpinion), разбор вечера считает, сколько пунктов совпало. */
  void hint;
}
/* РАЗБОР ВЕЧЕРА — в карточке результата, под оценкой матча (ccNightRateLine). Только то, что было: смерти по причинам,
   кто чаще всех убивал, лучшая игра, ротации, план коуча; и что из этого следует для тренировки. */
function ccEveningReviewHTML(){
  const rows=(CC_EVENING && CC_EVENING.day===careerToday()) ? CC_EVENING.rows : [];
  if(!rows.length) return '';
  try{ ccEveningPosts(rows); }catch(e){}
  const T=L();
  const deaths={kill:0, storm:0, surge:0, drop:0}, killers={};
  rows.forEach(r=>{
    if(r.place===1) return;
    if(r.dd) deaths.drop++;
    else if(r.dc==='storm') deaths.storm++;
    else if(r.dc==='surge') deaths.surge++;
    else if(r.dc){ deaths.kill++; const h=ccEveningKillerHandle(r.dc); if(h) killers[h]=(killers[h]||0)+1; }
  });
  const top=Object.entries(killers).sort((a,b)=>b[1]-a[1])[0];
  const best=rows.slice().sort((a,b)=>a.place-b.place || b.elims-a.elims)[0];
  const kills=rows.reduce((n,r)=>n+(r.elims||0), 0);
  const plan=rows.filter(r=>r.plan);
  const pOk=plan.reduce((n,r)=>n+r.plan.ok, 0), pN=plan.reduce((n,r)=>n+r.plan.n, 0);
  const line=(a,b)=>'<li><em>'+esc(a)+'</em><b>'+b+'</b></li>';
  let html='<div class="ev-review"><h5>'+esc(T.evTitle)+'</h5><ul>';
  html+=line(T.evBest, esc(T.evBestGame(best.g, best.place, best.elims)));
  html+=line(T.evKills, esc(String(kills))+' · '+esc(T.evPerGame((kills/rows.length).toFixed(1))));
  const dl=[];
  if(deaths.kill) dl.push(T.evDeathKill(deaths.kill));
  if(deaths.drop) dl.push(T.evDeathDrop(deaths.drop));
  if(deaths.storm) dl.push(T.evDeathStorm(deaths.storm));
  if(deaths.surge) dl.push(T.evDeathSurge(deaths.surge));
  if(dl.length) html+=line(T.evDeaths, esc(dl.join(' · ')));
  if(top && top[1]>=1) html+=line(T.evNemesis, '@'+esc(top[0])+(top[1]>1 ? ' ×'+top[1] : ''));
  if(pN) html+=line(T.evPlan, esc(T.evPlanDone(pOk, pN)));
  html+='</ul>';
  // Что тренировать: по главной причине вылетов.
  const main=Object.entries(deaths).sort((a,b)=>b[1]-a[1])[0];
  if(main && main[1]>0) html+='<p class="ev-tip">'+esc(T['evTip_'+main[0]])+'</p>';
  return html+'</div>';
}
/* ПОСТЫ ПО ФАКТАМ ВЕЧЕРА (Notion 15.10: «the tweets are kinda weird»). Один раз на вечер, только одиночная игра:
   — тот, кто убил тебя больше всех (дважды и чаще) и есть в базе карточек, пишет об этом сам (автор — arg0);
   — твой пост про Victory Royale с киллами этой игры;
   — твой пост, если за вечер вышло много киллов (5+ в среднем за игру нет — порог 3 за игру). */
function ccEveningPosts(rows){
  if(!CC_EVENING) return;
  if(typeof ccMpOn==='function' && ccMpOn()) return;
  // Каждый вид поста — раз за вечер, но не обязательно после первого раунда: факты копятся (вечер в два раунда).
  const done=CC_EVENING.posted=(CC_EVENING.posted && typeof CC_EVENING.posted==='object') ? CC_EVENING.posted : {};
  const me=(CAREER.player && (CAREER.player.nick||CAREER.player.handle)) || '';
  const killers={};
  rows.forEach(r=>{ if(r.place!==1 && r.dc && r.dc!=='storm' && r.dc!=='surge' && !r.dd){ const h=ccEveningKillerHandle(r.dc); if(h) killers[h]=(killers[h]||0)+1; } });
  const top=Object.entries(killers).sort((a,b)=>b[1]-a[1])[0];
  let posted=false;
  if(!done.k && top && top[1]>=2 && typeof ccCardsByKey==='function' && (ccCardsByKey().get(hKey(top[0]))||[]).length){
    careerNews('flat', 'ccPostEvKilled', [top[0], top[1], me]); posted=done.k=true;
  }
  const vr=rows.filter(r=>r.place===1).sort((a,b)=>b.elims-a.elims)[0];
  if(vr && !done.vr){ careerNews('good', 'ccPostEvVR', [vr.g, vr.elims, rows.length]); posted=done.vr=true; }
  const kills=rows.reduce((n,r)=>n+(r.elims||0), 0);
  if(!vr && !done.e && rows.length>=4 && kills/rows.length>=3){ careerNews('good', 'ccPostEvKills', [kills, rows.length]); posted=done.e=true; }
  /* Удача зон (28.10, X после Solo FNCS: «pulled 1/12 zones & played 2 endgames but still W»). Считаются эндгеймы, до
     которых дожил (zp не null, см. PULL_ZONE в zone-sim): по всем играм вышло бы «1/12» почти у каждого, потому что
     большинство до шестого круга не доживает. Зона приходит примерно в четверти эндгеймов, поэтому пост — только
     заметный вечер: ни одной из шести и больше (или одна из восьми), либо три и больше и не меньше половины. */
  const zr=rows.filter(r=>r.zp!=null), zn=zr.filter(r=>r.zp).length;
  if(!done.z && ((zn===0 && zr.length>=6) || (zn<=1 && zr.length>=8) || (zn>=3 && zn*2>=zr.length))){
    const best=rows.reduce((m,r)=>Math.min(m, r.place||999), 999);
    careerNews(zn<=1 ? 'flat' : 'good', 'ccPostZoneLuck', [zn, zr.length, best, zr.length%3]); posted=done.z=true;
  }
  if(posted){ try{ careerSave(); }catch(e){} }
}
/* ПРЕСС-КОНФЕРЕНЦИИ (16.10, его «делай» на «пресс-конференции как в FIFA»). После заметного вечера — победа, подиум,
   провал фаворита, серия из трёх сильных или трёх слабых вечеров, исход обещания — в «Центре» ждёт журналист: два-три
   вопроса, по три ответа разного тона. Ответ двигает форму, подписчиков, настрой напарника и репутацию (мелко — это
   приправа, не двигатель карьеры), уходит цитатой в ленту, а провокация зовёт ответ названного игрока сцены.
   ОБЕЩАНИЕ («цель на следующий турнир: топ-10 / только победа») проверяется следующим вечером: сдержал — большой плюс,
   нет — следующая пресс-конференция начнётся с этого. Карточка, а не окно посреди вечера: перемотка и симуляция недели
   её не ждут, неотвеченная гаснет через день без последствий. В игре вдвоём (ccMpOn) не бывает — форма читается обоими
   браузерами. Тексты — PRESS_TXT, 7 языков. */
const CC_PRESS_GAP=3;      // дней между пресс-конференциями (победа — без паузы)
const CC_PRESS_LIFE=1;     // сколько дней неотвеченная висит в «Центре»
// [форма, подписчики (% охвата, не меньше 20), напарник, репутация] на каждый из трёх ответов.
const CC_PRESS_EFF={
  win:   [[0.25,1,2,1],[0.5,3,0,0],[0.25,4,0,-1]],
  podium:[[0.25,1,2,1],[0.5,2,0,0],[0,3,0,-1]],
  flop:  [[0.25,0,2,1],[0.25,1,0,-1],[0.25,2,-10,-1]],
  hot:   [[0.25,1,2,1],[0.5,3,0,0],[0.25,4,0,-1]],
  cold:  [[0.5,0,2,1],[0.25,1,0,-1],[0,2,-10,-1]],
  kept:  [[0.25,1,0,1],[0.25,3,0,0],[0.5,2,0,0]],
  broke: [[0.25,0,0,1],[0,1,0,-1],[0,1,0,-2]],
  goal:  [[0,0,0,0],[0,1,0,0],[0,2,0,0]]};
// Исход обещания: [форма, подписчики, репутация].
/* Единица подписчиков с ответа (17.10, его «пресс конференции слишком много подписчиков дают»): было 1% охвата
   (не меньше 20) — за конференцию из 3–4 вопросов 5–10% аудитории, раз в три дня и с ростом от роста. Стало 0.15%
   (не меньше 5): конференция ≈ 1%, сдержанное обещание победы ≈ 1.5%. */
const CC_PRESSCONF_REACH=0.0015, CC_PRESSCONF_REACH_MIN=5;
function ccPressReachUnit(){ return Math.max(CC_PRESSCONF_REACH_MIN, careerReach()*CC_PRESSCONF_REACH); }
const CC_PRESS_PROMISE={kept:{top10:[0.5,5,2], win:[1,10,3]}, broke:{top10:[-0.25,-2,-1], win:[-0.5,-3,-2]}};
const PRESS_TXT={
  ru:{title:'Пресс-конференция', skip:'Пропустить', of:(p,n)=>'#'+p+' из '+n, tags:{form:'форма', fans:'подписчики', mate:'напарник', rep:'репутация', promise:'обещание — проверят на следующем турнире'},
    goalName:{top10:'топ-10', win:'победу'},
    q:{win:'Победа! Что сегодня решило турнир?', podium:c=>'#'+c.p+' из '+c.n+'. Довольны или чего-то не хватило?', flop:c=>'Вас ставили в фавориты, а итог — #'+c.p+'. Что случилось?',
       hot:'Третий сильный вечер подряд. В чём секрет формы?', cold:'Три слабых вечера подряд. Это кризис?', kept:c=>'Вы обещали '+c.g+' — и сделали. Что дальше?',
       broke:c=>'Вы обещали '+c.g+', а заняли #'+c.p+'. Что скажете?', goal:'И последнее: цель на следующий турнир?'},
    a:{win:['Командная работа и спокойный эндгейм. Завтра снова с нуля.','Мы просто лучшие в этом лобби. Привыкайте.',c=>'Спросите у '+c.r+' — он сегодня видел нас вблизи.'],
       podium:['Хороший вечер, пару ошибок в концовке разберём.','Ещё чуть-чуть — и это была бы победа. Следующая наша.',c=>c.r+' сегодня повезло с зоной, не больше.'],
       flop:['Ошиблись в эндгейме, разберём записи.','Лобби было случайным, мы лучше этого результата.',c=>c.mate ? 'Пару раз мы с '+c.mate+' разошлись по плану.' : 'Зона весь вечер была против меня.'],
       hot:['Режим и тренировки, никакой магии.','Я сейчас в лучшей форме в регионе.',c=>'Пусть догоняют. '+c.r+', ты следующий.'],
       cold:['Бывает. Работаем, результат вернётся.','Кризис? Поговорим после следующего турнира.',c=>c.mate ? 'Нам с '+c.mate+' надо поговорить внутри команды.' : 'Слишком много случайностей в лобби.'],
       kept:['Спасибо, но это только начало.','Я же говорил.','Теперь цель выше.'],
       broke:['Не справился. Отвечаю за слова — исправим.','Сезон длинный, ещё сделаем.','Обещания — это для прессы.'],
       goal:['Без обещаний — играем свою игру.','Топ-10.','Только победа.']},
    post:(me,q)=>'🎙 @'+me+' на пресс-конференции: «'+q+'»',
    rival:[me=>'@'+me+' смело. Увидимся в следующем капе 🙂',me=>'громкие слова от @'+me+'. посмотрим в лобби',me=>'@'+me+' запомню 👀'],
    kept:(me,g)=>'@'+me+' обещал '+g+' — и сдержал слово 👏', broke:(me,g,p)=>'@'+me+' обещал '+g+', а в итоге #'+p+'. Неловко.'},
  en:{title:'Press conference', skip:'Skip', of:(p,n)=>'#'+p+' of '+n, tags:{form:'form', fans:'followers', mate:'teammate', rep:'reputation', promise:'a promise — checked at the next tournament'},
    goalName:{top10:'a top 10', win:'a win'},
    q:{win:'A win! What decided the tournament today?', podium:c=>'#'+c.p+' of '+c.n+'. Happy, or was something missing?', flop:c=>'You were the favourites and finished #'+c.p+'. What happened?',
       hot:'Third strong night in a row. What is the secret?', cold:'Three weak nights in a row. Is this a crisis?', kept:c=>'You promised '+c.g+' — and delivered. What next?',
       broke:c=>'You promised '+c.g+' and finished #'+c.p+'. Your answer?', goal:'One last thing: the goal for the next tournament?'},
    a:{win:['Teamwork and a calm endgame. Tomorrow we start from zero.','We are simply the best in this lobby. Get used to it.',c=>'Ask '+c.r+' — he saw us up close today.'],
       podium:['A good night, we will review a couple of endgame mistakes.','So close to a win. The next one is ours.',c=>c.r+' just got lucky with the zone today.'],
       flop:['We messed up the endgame, we will review the VODs.','The lobby was random, we are better than this result.',c=>c.mate ? c.mate+' and I were not on the same plan a few times.' : 'The zone was against me all night.'],
       hot:['Routine and practice, no magic.','I am the best player in the region right now.',c=>'Let them catch up. '+c.r+', you are next.'],
       cold:['It happens. We keep working, the results will come back.','A crisis? Talk to me after the next tournament.',c=>c.mate ? c.mate+' and I need to talk inside the team.' : 'Too much randomness in the lobby.'],
       kept:['Thanks, but this is only the start.','I told you so.','Now the goal is higher.'],
       broke:['I did not deliver. I own my words — we will fix it.','The season is long, we will get there.','Promises are for the press.'],
       goal:['No promises — we play our game.','Top 10.','Only the win.']},
    post:(me,q)=>'🎙 @'+me+' at the press conference: “'+q+'”',
    rival:[me=>'@'+me+' bold. see you next cup 🙂',me=>'big words from @'+me+'. we will see in the lobby',me=>'@'+me+' noted 👀'],
    kept:(me,g)=>'@'+me+' promised '+g+' and delivered 👏', broke:(me,g,p)=>'@'+me+' promised '+g+' and finished #'+p+'. Awkward.'},
  fr:{title:'Conférence de presse', skip:'Passer', of:(p,n)=>'#'+p+' sur '+n, tags:{form:'forme', fans:'abonnés', mate:'coéquipier', rep:'réputation', promise:'une promesse — vérifiée au prochain tournoi'},
    goalName:{top10:'un top 10', win:'une victoire'},
    q:{win:'Victoire ! Qu’est-ce qui a fait la différence ce soir ?', podium:c=>'#'+c.p+' sur '+c.n+'. Satisfait, ou il manquait quelque chose ?', flop:c=>'Vous étiez favoris et vous finissez #'+c.p+'. Que s’est-il passé ?',
       hot:'Troisième grosse soirée d’affilée. Le secret de cette forme ?', cold:'Trois soirées ratées d’affilée. C’est la crise ?', kept:c=>'Vous aviez promis '+c.g+' — c’est fait. Et maintenant ?',
       broke:c=>'Vous aviez promis '+c.g+' et vous finissez #'+c.p+'. Votre réponse ?', goal:'Dernière question : l’objectif pour le prochain tournoi ?'},
    a:{win:['Travail d’équipe et un endgame calme. Demain on repart de zéro.','On est simplement les meilleurs de ce lobby. Habituez-vous.',c=>'Demandez à '+c.r+' — il nous a vus de près ce soir.'],
       podium:['Bonne soirée, on revoit deux-trois erreurs de fin de partie.','Si proche de la victoire. La prochaine est pour nous.',c=>c.r+' a juste eu de la chance avec la zone.'],
       flop:['On a raté l’endgame, on va revoir les VODs.','Le lobby était aléatoire, on vaut mieux que ça.',c=>c.mate ? 'Avec '+c.mate+', on n’avait pas le même plan plusieurs fois.' : 'La zone était contre moi toute la soirée.'],
       hot:['Routine et entraînement, pas de magie.','Je suis le meilleur joueur de la région en ce moment.',c=>'Qu’ils nous rattrapent. '+c.r+', tu es le prochain.'],
       cold:['Ça arrive. On travaille, les résultats reviendront.','La crise ? On en reparle après le prochain tournoi.',c=>c.mate ? 'On doit parler en interne avec '+c.mate+'.' : 'Trop de hasard dans le lobby.'],
       kept:['Merci, mais ce n’est que le début.','Je l’avais dit.','Maintenant l’objectif est plus haut.'],
       broke:['Je n’ai pas tenu parole. J’assume — on va corriger.','La saison est longue, on y arrivera.','Les promesses, c’est pour la presse.'],
       goal:['Pas de promesses — on joue notre jeu.','Top 10.','Seulement la victoire.']},
    post:(me,q)=>'🎙 @'+me+' en conférence de presse : « '+q+' »',
    rival:[me=>'@'+me+' audacieux. on se voit à la prochaine cup 🙂',me=>'grands mots de @'+me+'. on verra dans le lobby',me=>'@'+me+' noté 👀'],
    kept:(me,g)=>'@'+me+' avait promis '+g+' et a tenu parole 👏', broke:(me,g,p)=>'@'+me+' avait promis '+g+' et finit #'+p+'. Gênant.'},
  it:{title:'Conferenza stampa', skip:'Salta', of:(p,n)=>'#'+p+' su '+n, tags:{form:'forma', fans:'follower', mate:'compagno', rep:'reputazione', promise:'una promessa — verificata al prossimo torneo'},
    goalName:{top10:'una top 10', win:'una vittoria'},
    q:{win:'Vittoria! Cosa ha deciso il torneo stasera?', podium:c=>'#'+c.p+' su '+c.n+'. Soddisfatto o mancava qualcosa?', flop:c=>'Eravate i favoriti e chiudete #'+c.p+'. Cos’è successo?',
       hot:'Terza grande serata di fila. Il segreto della forma?', cold:'Tre serate storte di fila. È crisi?', kept:c=>'Avevi promesso '+c.g+' — e ce l’hai fatta. E adesso?',
       broke:c=>'Avevi promesso '+c.g+' e chiudi #'+c.p+'. Cosa rispondi?', goal:'Ultima cosa: l’obiettivo per il prossimo torneo?'},
    a:{win:['Lavoro di squadra e un endgame tranquillo. Domani si riparte da zero.','Siamo semplicemente i migliori di questa lobby. Abituatevi.',c=>'Chiedete a '+c.r+' — stasera ci ha visti da vicino.'],
       podium:['Bella serata, rivedremo un paio di errori nel finale.','Così vicini alla vittoria. La prossima è nostra.',c=>c.r+' è stato solo fortunato con la zona.'],
       flop:['Abbiamo sbagliato l’endgame, rivedremo le VOD.','La lobby era casuale, valiamo più di questo.',c=>c.mate ? 'Con '+c.mate+' non eravamo sullo stesso piano un paio di volte.' : 'La zona è stata contro di me tutta la sera.'],
       hot:['Routine e allenamento, nessuna magia.','Sono il miglior giocatore della regione adesso.',c=>'Che ci inseguano. '+c.r+', sei il prossimo.'],
       cold:['Capita. Lavoriamo, i risultati torneranno.','Crisi? Ne riparliamo dopo il prossimo torneo.',c=>c.mate ? 'Io e '+c.mate+' dobbiamo parlarne in squadra.' : 'Troppa casualità nella lobby.'],
       kept:['Grazie, ma è solo l’inizio.','Ve l’avevo detto.','Ora l’obiettivo è più alto.'],
       broke:['Non ce l’ho fatta. Rispondo delle mie parole — rimedieremo.','La stagione è lunga, ci arriveremo.','Le promesse sono per la stampa.'],
       goal:['Niente promesse — giochiamo il nostro gioco.','Top 10.','Solo la vittoria.']},
    post:(me,q)=>'🎙 @'+me+' in conferenza stampa: «'+q+'»',
    rival:[me=>'@'+me+' coraggioso. ci vediamo alla prossima cup 🙂',me=>'parole grosse da @'+me+'. vedremo in lobby',me=>'@'+me+' segnato 👀'],
    kept:(me,g)=>'@'+me+' aveva promesso '+g+' e ha mantenuto 👏', broke:(me,g,p)=>'@'+me+' aveva promesso '+g+' e chiude #'+p+'. Imbarazzante.'},
  pt:{title:'Coletiva de imprensa', skip:'Pular', of:(p,n)=>'#'+p+' de '+n, tags:{form:'forma', fans:'seguidores', mate:'parceiro', rep:'reputação', promise:'uma promessa — conferida no próximo torneio'},
    goalName:{top10:'um top 10', win:'uma vitória'},
    q:{win:'Vitória! O que decidiu o torneio hoje?', podium:c=>'#'+c.p+' de '+c.n+'. Satisfeito ou faltou algo?', flop:c=>'Vocês eram favoritos e terminaram em #'+c.p+'. O que aconteceu?',
       hot:'Terceira noite forte seguida. Qual o segredo da forma?', cold:'Três noites fracas seguidas. É crise?', kept:c=>'Você prometeu '+c.g+' — e cumpriu. E agora?',
       broke:c=>'Você prometeu '+c.g+' e terminou em #'+c.p+'. O que diz?', goal:'Última: qual a meta para o próximo torneio?'},
    a:{win:['Trabalho em equipe e um endgame calmo. Amanhã começa do zero.','Somos simplesmente os melhores deste lobby. Acostumem-se.',c=>'Pergunta pro '+c.r+' — ele viu a gente de perto hoje.'],
       podium:['Noite boa, vamos rever uns erros no final.','Quase a vitória. A próxima é nossa.',c=>c.r+' só teve sorte com a zona hoje.'],
       flop:['Erramos o endgame, vamos rever as VODs.','O lobby foi aleatório, somos melhores que isso.',c=>c.mate ? 'Eu e o '+c.mate+' não estivemos no mesmo plano algumas vezes.' : 'A zona esteve contra mim a noite toda.'],
       hot:['Rotina e treino, nada de mágica.','Sou o melhor jogador da região agora.',c=>'Que corram atrás. '+c.r+', você é o próximo.'],
       cold:['Acontece. Seguimos trabalhando, os resultados voltam.','Crise? Conversamos depois do próximo torneio.',c=>c.mate ? 'Eu e o '+c.mate+' precisamos conversar internamente.' : 'Aleatoriedade demais no lobby.'],
       kept:['Obrigado, mas é só o começo.','Eu avisei.','Agora a meta é mais alta.'],
       broke:['Não cumpri. Assumo minhas palavras — vamos corrigir.','A temporada é longa, a gente chega lá.','Promessa é coisa de imprensa.'],
       goal:['Sem promessas — jogamos o nosso jogo.','Top 10.','Só a vitória.']},
    post:(me,q)=>'🎙 @'+me+' na coletiva: “'+q+'”',
    rival:[me=>'@'+me+' corajoso. nos vemos na próxima cup 🙂',me=>'palavras grandes do @'+me+'. veremos no lobby',me=>'@'+me+' anotado 👀'],
    kept:(me,g)=>'@'+me+' prometeu '+g+' e cumpriu 👏', broke:(me,g,p)=>'@'+me+' prometeu '+g+' e terminou em #'+p+'. Constrangedor.'},
  de:{title:'Pressekonferenz', skip:'Überspringen', of:(p,n)=>'#'+p+' von '+n, tags:{form:'Form', fans:'Follower', mate:'Teamkollege', rep:'Ruf', promise:'ein Versprechen — wird beim nächsten Turnier geprüft'},
    goalName:{top10:'eine Top 10', win:'einen Sieg'},
    q:{win:'Sieg! Was hat heute das Turnier entschieden?', podium:c=>'#'+c.p+' von '+c.n+'. Zufrieden oder fehlte etwas?', flop:c=>'Ihr wart Favoriten und landet auf #'+c.p+'. Was ist passiert?',
       hot:'Dritter starker Abend in Folge. Was ist das Geheimnis?', cold:'Drei schwache Abende in Folge. Ist das eine Krise?', kept:c=>'Du hast '+c.g+' versprochen — und geliefert. Was jetzt?',
       broke:c=>'Du hast '+c.g+' versprochen und bist #'+c.p+' geworden. Deine Antwort?', goal:'Zum Schluss: das Ziel fürs nächste Turnier?'},
    a:{win:['Teamwork und ein ruhiges Endgame. Morgen fangen wir bei null an.','Wir sind einfach die Besten in dieser Lobby. Gewöhnt euch dran.',c=>'Fragt '+c.r+' — der hat uns heute aus der Nähe gesehen.'],
       podium:['Guter Abend, ein paar Fehler im Endgame schauen wir uns an.','So knapp am Sieg. Der nächste gehört uns.',c=>c.r+' hatte heute einfach Glück mit der Zone.'],
       flop:['Wir haben das Endgame verbockt, wir schauen die VODs.','Die Lobby war Zufall, wir sind besser als das.',c=>c.mate ? c.mate+' und ich hatten ein paarmal nicht denselben Plan.' : 'Die Zone war den ganzen Abend gegen mich.'],
       hot:['Routine und Training, keine Magie.','Ich bin gerade der beste Spieler der Region.',c=>'Sollen sie aufholen. '+c.r+', du bist der Nächste.'],
       cold:['Kommt vor. Wir arbeiten weiter, die Ergebnisse kommen zurück.','Krise? Reden wir nach dem nächsten Turnier.',c=>c.mate ? c.mate+' und ich müssen intern reden.' : 'Zu viel Zufall in der Lobby.'],
       kept:['Danke, aber das ist erst der Anfang.','Hab ich doch gesagt.','Jetzt ist das Ziel höher.'],
       broke:['Ich habe nicht geliefert. Ich stehe zu meinem Wort — wir korrigieren das.','Die Saison ist lang, wir schaffen das.','Versprechen sind für die Presse.'],
       goal:['Keine Versprechen — wir spielen unser Spiel.','Top 10.','Nur der Sieg.']},
    post:(me,q)=>'🎙 @'+me+' auf der Pressekonferenz: „'+q+'“',
    rival:[me=>'@'+me+' mutig. wir sehen uns im nächsten cup 🙂',me=>'große worte von @'+me+'. wir sehen uns in der lobby',me=>'@'+me+' notiert 👀'],
    kept:(me,g)=>'@'+me+' hat '+g+' versprochen und geliefert 👏', broke:(me,g,p)=>'@'+me+' hat '+g+' versprochen und ist #'+p+' geworden. Peinlich.'},
  es:{title:'Rueda de prensa', skip:'Saltar', of:(p,n)=>'#'+p+' de '+n, tags:{form:'forma', fans:'seguidores', mate:'compañero', rep:'reputación', promise:'una promesa — se comprueba en el próximo torneo'},
    goalName:{top10:'un top 10', win:'una victoria'},
    q:{win:'¡Victoria! ¿Qué decidió hoy el torneo?', podium:c=>'#'+c.p+' de '+c.n+'. ¿Contento o faltó algo?', flop:c=>'Erais favoritos y acabáis #'+c.p+'. ¿Qué pasó?',
       hot:'Tercera gran noche seguida. ¿El secreto de la forma?', cold:'Tres noches flojas seguidas. ¿Es una crisis?', kept:c=>'Prometiste '+c.g+' — y cumpliste. ¿Y ahora?',
       broke:c=>'Prometiste '+c.g+' y acabaste #'+c.p+'. ¿Qué dices?', goal:'Por último: ¿el objetivo para el próximo torneo?'},
    a:{win:['Trabajo en equipo y un endgame tranquilo. Mañana empezamos de cero.','Somos simplemente los mejores de este lobby. Acostumbraos.',c=>'Preguntadle a '+c.r+' — hoy nos vio de cerca.'],
       podium:['Buena noche, revisaremos un par de errores del final.','A nada de la victoria. La próxima es nuestra.',c=>c.r+' solo tuvo suerte con la zona hoy.'],
       flop:['Fallamos el endgame, revisaremos los VODs.','El lobby fue aleatorio, somos mejores que esto.',c=>c.mate ? c.mate+' y yo no tuvimos el mismo plan varias veces.' : 'La zona estuvo contra mí toda la noche.'],
       hot:['Rutina y entrenamiento, nada de magia.','Ahora mismo soy el mejor jugador de la región.',c=>'Que nos alcancen. '+c.r+', eres el siguiente.'],
       cold:['Pasa. Seguimos trabajando, los resultados volverán.','¿Crisis? Hablamos después del próximo torneo.',c=>c.mate ? c.mate+' y yo tenemos que hablar dentro del equipo.' : 'Demasiado azar en el lobby.'],
       kept:['Gracias, pero esto es solo el principio.','Os lo dije.','Ahora el objetivo es más alto.'],
       broke:['No cumplí. Respondo de mis palabras — lo arreglaremos.','La temporada es larga, llegaremos.','Las promesas son para la prensa.'],
       goal:['Sin promesas — jugamos nuestro juego.','Top 10.','Solo la victoria.']},
    post:(me,q)=>'🎙 @'+me+' en rueda de prensa: «'+q+'»',
    rival:[me=>'@'+me+' valiente. nos vemos en la próxima cup 🙂',me=>'palabras grandes de @'+me+'. lo veremos en el lobby',me=>'@'+me+' apuntado 👀'],
    kept:(me,g)=>'@'+me+' prometió '+g+' y cumplió 👏', broke:(me,g,p)=>'@'+me+' prometió '+g+' y acabó #'+p+'. Incómodo.'}};
function ccPressT(){ return PRESS_TXT[typeof LANG!=='undefined' ? LANG : 'en'] || PRESS_TXT.en; }
function ccPressMe(){ const pl=CAREER && CAREER.player; return (pl && (pl.nick||pl.handle)) || ''; }
// Текст ответа — из ключей, на языке, который сейчас открыт (запись в сейве — ситуация и номер ответа, не строка).
function ccPressAns(sit, ai, c){ const a=(ccPressT().a[sit]||PRESS_TXT.en.a[sit]||[])[ai]; return typeof a==='function' ? a(c||{}) : (a||''); }
function ccPressQ(sit, c){ const q=ccPressT().q[sit]; return typeof q==='function' ? q(c||{}) : (q||''); }
// Соперник для провокации: сильный человек своей сцены, не ты и не напарник; один на день.
function ccPressRival(){
  let pool=[]; try{ pool=(careerRosterNowEU()||[]).slice(); }catch(e){}
  const mate=careerMateRec(), mk=mate && mate.card ? hKey(mate.card) : '';
  pool=pool.filter(p=>p && p.handle && hKey(p)!==mk).sort((a,b)=>((b._ovr||b.rating||0)-(a._ovr||a.rating||0))).slice(0, 15);
  if(!pool.length) return '';
  return pool[careerRng(ccHashStr('press-rival|'+careerToday()))()*pool.length|0].handle;
}
/* Конец вечера (careerApplyGrowth): сначала исход обещания, потом — нужна ли пресс-конференция. beat — доля поля,
   которую ты обошёл; expected — доля, которую ты сильнее (то же, что считает рост). */
function ccPressAfterNight(place, total, expected){
  if(!CAREER || !CAREER.career || !(total>1)) return;
  if(typeof ccMpOn==='function' && ccMpOn()) return;
  const cr=CAREER.career, today=careerToday(), beat=1-(place-1)/(total-1);
  cr.pressLog=(cr.pressLog||[]).concat([Math.round(beat*100)/100]).slice(-3);
  let res=null;
  const pr=cr.pressPromise;
  if(pr && pr.day<today && total>=10){
    const ok=pr.goal==='win' ? place===1 : place<=10;
    const e=CC_PRESS_PROMISE[ok?'kept':'broke'][pr.goal];
    cr.form=clamp((cr.form||0)+e[0], -CC_FORM_MAX, CC_FORM_MAX);
    careerReachAdd(Math.round(ccPressReachUnit()*e[1]), true);
    careerRepAdd(e[2]);
    careerNews(ok ? 'good' : 'bad', ok ? 'ccPostPressKept' : 'ccPostPressBroke', [ccPressMe(), pr.goal, place]);
    res={ok, goal:pr.goal, p:place};
    delete cr.pressPromise;
  }
  let sit=null;
  if(place===1) sit='win';
  else if(place<=3 && total>=20) sit='podium';
  else if(expected>=0.7 && beat<0.4) sit='flop';
  else if(cr.pressLog.length===3 && cr.pressLog.every(b=>b>=0.8)) sit='hot';
  else if(cr.pressLog.length===3 && cr.pressLog.every(b=>b<=0.35)) sit='cold';
  if(!sit && !res) return;
  if(!res && sit!=='win' && cr.pressLast && ccDaysBetween(cr.pressLast, today)<CC_PRESS_GAP) return;
  const qs=[];
  if(res) qs.push(res.ok ? 'kept' : 'broke');
  if(sit) qs.push(sit);
  if(!cr.pressPromise) qs.push('goal');
  const mate=careerMateRec();
  cr.press={day:today, qs, i:0, ctx:{p:place, n:total, r:ccPressRival(), mate:mate && mate.card ? mate.card.handle : '', g:res ? res.goal : ''}};
  cr.pressLast=today;
  if(sit==='hot' || sit==='cold') cr.pressLog=[];
}
function ccPressLive(){
  const cr=CAREER && CAREER.career, pr=cr && cr.press;
  if(!pr || !pr.qs || pr.i>=pr.qs.length) return null;
  if(ccDaysBetween(pr.day, careerToday())>CC_PRESS_LIFE){ cr.press=null; return null; }
  return pr;
}
// Что ответ сдвинет — словами, без чисел: [форма, подписчики, напарник, репутация].
function ccPressTags(e){
  const T=ccPressT().tags, out=[];
  if(e[0]) out.push((e[0]>0?'+':'−')+' '+T.form);
  if(e[1]) out.push((e[1]>0?'+':'−')+' '+T.fans);
  if(e[2]) out.push((e[2]>0?'+':'−')+' '+T.mate);
  if(e[3]) out.push((e[3]>0?'+':'−')+' '+T.rep);
  return out.join(' · ');
}
function ccPressCtx(pr){
  const c=Object.assign({}, pr.ctx);
  if(c.g) c.g=(ccPressT().goalName||{})[c.g]||c.g;
  return c;
}
function ccPressHTML(){
  const pr=ccPressLive(); if(!pr) return '';
  const T=ccPressT(), sit=pr.qs[pr.i], c=ccPressCtx(pr), eff=CC_PRESS_EFF[sit]||[];
  const mateless=!pr.ctx.mate;
  const btns=[0,1,2].map(ai=>{ const e=(eff[ai]||[0,0,0,0]).slice(); if(mateless) e[2]=0;
    return '<button class="cc-press-a" type="button" onclick="ccPressAnswer('+ai+')"><b>«'+esc(ccPressAns(sit, ai, c))+'»</b>'+
      ((sit==='goal' && ai>0) ? '<small>🤝 '+esc(T.tags.promise)+'</small>' : (ccPressTags(e) ? '<small>'+esc(ccPressTags(e))+'</small>' : ''))+'</button>'; }).join('');
  return '<div class="ch-tile cc-press"><div class="cc-press-h"><b>🎙 '+esc(T.title)+'</b><span>'+(pr.i+1)+' / '+pr.qs.length+'</span></div>'+
    '<p class="cc-press-q">'+esc(ccPressQ(sit, c))+'</p><div class="cc-press-as">'+btns+'</div>'+
    '<button class="cc-press-skip" type="button" onclick="ccPressSkip()">'+esc(T.skip)+'</button></div>';
}
function ccPressAnswer(ai){
  const pr=ccPressLive(); if(!pr) return;
  const cr=CAREER.career, sit=pr.qs[pr.i], e=(CC_PRESS_EFF[sit]||[])[ai]||[0,0,0,0];
  cr.form=clamp((cr.form||0)+e[0], -CC_FORM_MAX, CC_FORM_MAX);
  if(e[1]) careerReachAdd(Math.round(ccPressReachUnit()*e[1]), true);
  const mate=careerMateRec();
  if(e[2] && mate && pr.ctx.mate){ if(mate.patience==null) mate.patience=CAREER_PATIENCE_START; mate.patience=clamp(mate.patience+e[2], 0, 100); }
  if(e[3]) careerRepAdd(e[3]);
  if(sit==='goal' && ai>0) cr.pressPromise={goal:ai===2 ? 'win' : 'top10', day:careerToday()};
  // Цитата — первый ответ по делу (не «цель»), в ленту от прессы; провокация с ником — ответ этого игрока.
  if(sit!=='goal' && !pr.posted){
    pr.posted=true;
    careerNews('flat', 'ccPostPress', [ccPressMe(), sit, ai, pr.ctx.p, pr.ctx.n, pr.ctx.r, pr.ctx.mate, pr.ctx.g]);
    const provoke=ai===2 && /^(win|podium|hot)$/.test(sit) && pr.ctx.r;
    if(provoke) careerNews('flat', 'ccPostPressRival', [pr.ctx.r, ccPressMe(), ccHashStr(pr.day+pr.ctx.r)%3]);
  }
  pr.i++;
  if(pr.i>=pr.qs.length) cr.press=null;
  careerSave();
  careerRenderHub(CH_TAB);
}
function ccPressSkip(){ if(CAREER && CAREER.career){ CAREER.career.press=null; careerSave(); careerRenderHub(CH_TAB); } }
// Строки ленты: ключи живут в I18N.en (L() кладёт английский под каждый язык), текст — на открытом языке.
function ccPressPostText(me, sit, ai, p, n, r, mate, g){
  const T=ccPressT(), c={p, n, r, mate, g:g ? (T.goalName||{})[g]||g : ''};
  return T.post(me, ccPressAns(sit, ai, c));
}
/* ЛИЧКА ПОСЛЕ ВЕЧЕРА (16.10, его слова: «пусть Кинч в лс пишет разбор игрока и сравнение с тиммейтами», «и остальной
   стафф пишет что-то», «психолог советует», «чтоб разнообразие было»).
   — Kinch Analytics: разбор финала больше не пост в ленте, а личка: место, плейс, киллы, место в лобби по киллам и
     раскладка ВНУТРИ состава — киллы и урон каждого, доля урона. Делит тем же, чем «моя статистика» (ccKillWeights,
     ZoneReplay.killShare), и подводит итог: кто тащил.
   — Стафф, который нанят: коуч (план вечера и главное, что тренировать), аналитик (шторм, высадка, файты), психолог
     (после провала, серии, выгорания и после победы), SMM (сколько пришло подписчиков и что постить), маркетолог
     (бренды после сильного вечера). Только по делу, каждый не чаще раза в CC_STAFF_DM_GAP дня, за вечер не больше
     CC_STAFF_DM_MAX. Ничего не меняют в числах — это голоса, а не механика. В игре вдвоём молчат (ccMpOn). */
const CC_STAFF_DM_GAP=2, CC_STAFF_DM_MAX=2;
const CC_KINCH_WHO={handle:'Kinch Analytics', verified:true, roster:false, staff:'kinch'};
function ccStaffThread(who){ return careerDmFind(who.handle) || careerDmThread(who); }
function ccKinchDm(ranked, you, label){
  if(typeof ccMpOn==='function' && ccMpOn()) return false;
  const log=(you.stageLog||[]).filter(g=>g && g.place!=null);
  if(log.length<2) return false;
  const games=log.length, place=ranked.indexOf(you)+1;
  if(place<1) return false;
  const avg=log.reduce((s,g)=>s+g.place, 0)/games, elims=log.reduce((s,g)=>s+(g.elims||0), 0);
  const rk=ranked.filter(t=>t!==you && (t.stageElims||0)>elims).length+1;
  const t=ccStaffThread(CC_KINCH_WHO);
  /* 30.10, его «сделай кинчу в лс такой же разбор и как его посты в медиа»: при записи вечера по игрокам — разбор
     аналитика (ccEveningPlayers) одним сообщением, строками с эмодзи, как пост Кинча в ленте (ccKinchBoardText). */
  /* 30.10, его «пусть игрок сам пишет насчет разбора и может выбрать какого тимейта»: Кинч присылает только сводку,
     разбор по человеку — по кнопке в ветке (ccKinchPick), кого спросил, того и разбирает. Вечер лежит в cr.kinchNight,
     чтобы кнопки пережили перезагрузку страницы; новый вечер его заменяет. */
  let pl=null; try{ pl=ccEveningPlayers(careerToday()); }catch(e){ pl=null; }
  if(pl){
    CAREER.career.kinchNight={day:careerToday(), lbl:String(label), p:place, g:games, avg:avg.toFixed(1), rk, done:[],
      rows:pl.map(b=>[b.me ? '' : String(b.h), b.el, b.dmg, b.took, b.alive, b.place, b.top10, b.wins, b.pts])};
    careerDmPush(t, 'them', 'ccDmKinchSum', [label, place, games, avg.toFixed(1), elims, (elims/games).toFixed(1), rk]);
    return true;
  }
  careerDmPush(t, 'them', 'ccDmKinchSum', [label, place, games, avg.toFixed(1), elims, (elims/games).toFixed(1), rk]);
  // Раскладка внутри состава: доля каждого — по весам киллов (как в «моей статистике»), урон — той же долей.
  const sq=((you.squad||you._cards||you.cards)||[]).filter(c=>c && c.handle);
  if(sq.length>=2){
    let w=null; try{ w=ccKillWeights(sq); }catch(e){}
    if(w && w.length===sq.length){
      const sum=w.reduce((a,v)=>a+Math.max(0.01, v||0), 0), dmg=(you.mstats && you.mstats.dmgTo)||0;
      const me=hKey((CAREER.player && (CAREER.player.nick||CAREER.player.handle))||''), pc=careerCard && careerCard();
      const rows=sq.map((c,i)=>{
        let e=Math.round(elims*Math.max(0.01, w[i]||0)/sum);
        try{ if(typeof ZoneReplay!=='undefined' && ZoneReplay.killShare){ const v=ZoneReplay.killShare(elims, w, i); if(v!=null) e=v; } }catch(err){}
        const share=Math.round(Math.max(0.01, w[i]||0)/sum*100);
        const isMe=(pc && hKey(c)===hKey(pc)) || hKey(c)===me || !!c.isYou;
        return [String(c.handle), e, Math.round(dmg*share/100), share, isMe ? 1 : 0];
      });
      careerDmPush(t, 'them', 'ccDmKinchCmp', [rows]);
      const top=rows.slice().sort((a,b)=>b[3]-a[3])[0];
      careerDmPush(t, 'them', 'ccDmKinchVerdict', [top[0], top[4], top[3], ccHashStr(careerToday()+label)%2]);
    }
  }
  return true;
}
// Кто из стаффа нанят: [ключ, имя]. Коуч — по справочнику, остальные — по записи найма (ccStaffTermRecs).
function ccStaffOn(){
  const out=[];
  try{ (ccStaffTermRecs()||[]).forEach(r=>{ if(r && r.name && !(r.rec && r.rec.gone)) out.push([r.key, String(r.name)]); }); }catch(e){}
  return out;
}
function ccStaffAfterNight(place, total){
  if(!CAREER || !CAREER.career || !(total>1)) return;
  if(typeof ccMpOn==='function' && ccMpOn()) return;
  const cr=CAREER.career, today=careerToday(), beat=1-(place-1)/(total-1);
  const last=cr.staffDm=(cr.staffDm && typeof cr.staffDm==='object') ? cr.staffDm : {};
  const rows=(CC_EVENING && CC_EVENING.day===today) ? CC_EVENING.rows : [];
  const deaths={kill:0, storm:0, surge:0, drop:0};
  rows.forEach(r=>{ if(r.place===1) return; if(r.dd) deaths.drop++; else if(r.dc==='storm') deaths.storm++; else if(r.dc==='surge') deaths.surge++; else if(r.dc) deaths.kill++; });
  const v=ccHashStr(today+'|'+place)%4;
  const lines=[];   // [вес, ключ стаффа, имя, ключ реплики, аргументы]
  const f=careerForm(), burn=careerBurnout();
  ccStaffOn().forEach(([k, name])=>{
    if(last[k] && ccDaysBetween(last[k], today)<CC_STAFF_DM_GAP) return;
    if(k==='coach'){
      const plan=rows.filter(r=>r.plan), ok=plan.reduce((n,r)=>n+r.plan.ok, 0), n=plan.reduce((n,r)=>n+r.plan.n, 0);
      const main=Object.entries(deaths).sort((a,b)=>b[1]-a[1])[0];
      if(n || (main && main[1]>=2)) lines.push([beat<0.5 ? 3 : 1, k, name, 'ccDmCoachNight', [ok, n, main && main[1]>0 ? main[0] : '', v]]);
    } else if(k==='analyst'){
      if(deaths.storm>=2) lines.push([3, k, name, 'ccDmAnStorm', [deaths.storm, v]]);
      else if(deaths.drop>=2) lines.push([3, k, name, 'ccDmAnDrop', [deaths.drop, v]]);
      else if(deaths.kill>=4 && beat<0.5) lines.push([2, k, name, 'ccDmAnFights', [deaths.kill, v]]);
      else if(beat>=0.8 && rows.length) lines.push([1, k, name, 'ccDmAnGood', [Math.round(rows.reduce((s,r)=>s+r.place,0)/rows.length*10)/10, v]]);
    } else if(k==='psych'){
      if(burn>0) lines.push([5, k, name, 'ccDmPsyBurn', [v]]);
      else if(beat<0.35 || f<=-1.5) lines.push([4, k, name, 'ccDmPsyBad', [v]]);
      else if(place===1) lines.push([2, k, name, 'ccDmPsyWin', [v]]);
      else if(f>=2) lines.push([1, k, name, 'ccDmPsyHot', [v]]);
    } else if(k==='smm'){
      const grow=(cr.reach||0)-(cr.smmSeen!=null ? cr.smmSeen : (cr.reach||0));
      cr.smmSeen=cr.reach||0;
      if(beat<0.3) lines.push([2, k, name, 'ccDmSmmBad', [v]]);
      else if(grow>=20) lines.push([beat>=0.8 ? 3 : 1, k, name, 'ccDmSmmGrow', [ccNum(grow), beat>=0.8 ? 1 : 0, v]]);
    } else if(k==='mkt'){
      if(place<=3 && total>=20) lines.push([2, k, name, 'ccDmMktBrands', [v]]);
    }
  });
  lines.sort((a,b)=>b[0]-a[0]).slice(0, CC_STAFF_DM_MAX).forEach(([w, k, name, key, args])=>{
    const t=ccStaffThread({handle:name, roster:false, staff:k});
    careerDmPush(t, 'them', key, args);
    last[k]=today;
  });
}
/* СЛУХИ, ОПРОСЫ, ТРЕНДЫ (16.10, его «3468» из «сделай соцсеть очень реалистично»). Аккаунты выдуманные — ни одного
   настоящего медиа. Roster Watch пишет слухи о составах: два настоящих игрока одной силы «скримятся вместе», и если на
   стыке сезона они правда объявят дуо — «called it ✅» (ccRumorConfirm из careerWorldDuos). После твоего подиума без
   клуба — «@ты на радаре у оргов». Comp Tea ☕ — драма в ответах, без последствий. FNCS Hub перед Мейджором и ЛАНом
   спрашивает «кто выиграет» — четыре самые сильные пары региона (и ты, если ты там), голос сохраняется, проценты — от
   силы с разбросом. Тренды справа считаются по ленте за неделю: кого упоминают и кто пишет (по лайкам), плюс #FNCS
   рядом с Мейджором и метка сезона. Клик по тренду — лента по нему. */
const CC_RUMOR_BY={name:'Roster Watch', handle:'rosterwatchfn', f:48000};
const CC_TEA_BY={name:'Comp Tea ☕', handle:'comptea', f:21000};
const CC_POLL_BY={name:'FNCS Hub', handle:'fncshub', f:65000};
function careerRumorTick(){
  const cr=CAREER && CAREER.career; if(!cr) return;
  if(typeof ccMpOn==='function' && ccMpOn()) return;
  const today=careerToday();
  if(cr.rumorNext && today<cr.rumorNext) return;
  const rnd=careerRng(ccHashStr('rumor|'+today+'|'+(cr.season||1)));
  const first=!cr.rumorNext;
  cr.rumorNext=ccAddDays(today, 5+Math.floor(rnd()*4));
  if(first) return;   // первый раз — только завести часы, не в день старта карьеры
  const me=ccHandle((CAREER.player && CAREER.player.nick)||''), v=Math.floor(rnd()*3);
  const top=(cr.log||[]).some(x=>x && x.day && x.place>0 && x.place<=3 && ccDaysBetween(x.day, today)<=7);
  if(top && !CAREER.org && rnd()<0.6){ careerNews('flat', 'ccPostRumorYou', [me, v], {by:CC_RUMOR_BY}); return; }
  let roster=[]; try{ roster=(careerRosterNowEU()||[]).filter(c=>c && c.handle && hKey(c)!==hKey(me)); }catch(e){}
  roster=roster.sort((a,b)=>ccCardOvr(b)-ccCardOvr(a)).slice(0, 80);
  if(roster.length<6) return;
  if(rnd()<0.2){
    const a=roster[Math.floor(rnd()*Math.min(40, roster.length))]; let b=a;
    for(let g=0; g<10 && b===a; g++) b=roster[Math.floor(rnd()*Math.min(40, roster.length))];
    if(b!==a) careerNews('flat', 'ccPostRumorDrama', [ccHandle(a.handle), ccHandle(b.handle), v], {by:CC_TEA_BY});
    return;
  }
  for(let g=0; g<20; g++){
    const a=roster[Math.floor(rnd()*roster.length)], oa=ccCardOvr(a);
    let mate=null; try{ mate=ccPairMateOf(a.handle); }catch(e){}
    const c=roster.filter(x=>x!==a && Math.abs(ccCardOvr(x)-oa)<=4 && !(mate && hKey(mate)===hKey(x)));
    if(!c.length) continue;
    const b=c[Math.floor(rnd()*c.length)];
    cr.rumors=(cr.rumors||[]).concat([{a:a.handle, b:b.handle, day:today}]).slice(-12);
    careerNews('flat', 'ccPostRumorPair', [ccHandle(a.handle), ccHandle(b.handle), v], {by:CC_RUMOR_BY});
    return;
  }
}
function ccRumorConfirm(a, b){
  const cr=CAREER && CAREER.career; if(!cr || !cr.rumors) return;
  const same=(x,y)=>hKey(x)===hKey(y);
  const r=cr.rumors.find(x=>!x.ok && ((same(x.a,a) && same(x.b,b)) || (same(x.a,b) && same(x.b,a))));
  if(!r) return;
  r.ok=1;
  careerNews('good', 'ccPostRumorTrue', [ccHandle(r.a), ccHandle(r.b)], {by:CC_RUMOR_BY});
}
// Варианты опроса: четыре самые сильные пары региона; ты — вместо четвёртой, если ты не слабее её.
/* Notion 21.10 (опрос «Who wins…»: «@mongraal & @wolfiez» и ниже «@mongraal»): карьера за карточку Mongraal, а его
   настоящая пара стояла в опросе рядом с ним самим. Пары, где сидит ты или кто-то из твоего состава, в варианты не
   идут; твой вариант — весь состав вечера (careerMates), а не ты с одним напарником. */
function ccPollOptions(){
  let mates=[]; try{ mates=(careerMates()||[]).filter(Boolean); }catch(e){}
  const mine=new Set(mates.map(c=>hKey(c)));
  try{ const P=CAREER.player; if(P.handle) mine.add(hKey({handle:P.handle})); if(P.nick) mine.add(hKey({handle:P.nick})); }catch(e){}
  let duos=[]; try{ duos=(careerPools().duos||[]).filter(d=>d && d.cards && d.cards.length>=2 && !d.cards.some(c=>mine.has(hKey(c)))); }catch(e){}
  duos=duos.slice().sort((a,b)=>ccDuoOvr(b)-ccDuoOvr(a)).slice(0, 4);
  const out=duos.map(d=>({l:'@'+ccHandle(d.cards[0].handle)+' & @'+ccHandle(d.cards[1].handle), o:ccDuoOvr(d)}));
  try{
    const ovrs=[ccMyShownOvr()].concat(mates.map(c=>ccCardOvr(c))), avg=ovrs.reduce((a,b)=>a+b, 0)/ovrs.length;
    if(out.length>=4 && avg>=out[3].o-1){
      const me=['@'+ccHandle(CAREER.player.nick||'')].concat(mates.map(c=>'@'+ccHandle(c.handle))).join(' & ');
      out[3]={l:me, o:avg, you:1};
    }
  }catch(e){}
  if(!out.length) return out;
  const rnd=careerRng(ccHashStr('poll|'+careerToday())), mx=Math.max(...out.map(x=>x.o));
  out.forEach(x=>{ x.w=Math.round(Math.exp((x.o-mx)/2.5)*(0.8+0.4*rnd())*1000); });
  return out;
}
function careerPollTick(){
  const cr=CAREER && CAREER.career; if(!cr) return;
  if(typeof ccMpOn==='function' && ccMpOn()) return;
  const days=careerYearDays(), today=careerToday();
  for(let d=1; d<=3; d++){
    const at=ccAddDays(today, d);
    const on=(days.get(at)||[]).filter(e=>e && (e.kind==='major' || e.kind==='gc'));
    if(!on.length) continue;
    const key='poll|'+at.slice(0, 7);
    cr.told=cr.told||{};
    if(cr.told[key]) return;
    cr.told[key]=1;
    const opts=ccPollOptions();
    if(opts.length<3) return;
    careerNews('flat', 'ccPostPollWin', [on[0].label||''],
      {by:CC_POLL_BY, poll:{o:opts.map(x=>x.l), w:opts.map(x=>x.w), end:at, v:null}});
    return;
  }
}
/* СПОР «КТО ЛУЧШЕ» (28.10, X: «Lets end the Debate. SHXRK: … MALIBUCA: … Who's better?»). Раз в 10–16 дней медиа-аккаунт
   ставит рядом двух соседей по Power Rankings из первой восьмёрки (не ты и не твой состав): место в PR, призовые за год,
   кубки, взятые на глазах у карьеры (CAREER.titles). Опрос на два дня; доли — от PR, как у опроса перед Мейджором. */
const CC_DEBATE_BY={name:'Comp Debates', handle:'compdebatesfn', f:42000};
function careerDebateTick(){
  const cr=CAREER && CAREER.career; if(!cr) return;
  if(typeof ccMpOn==='function' && ccMpOn()) return;
  const today=careerToday();
  if(cr.debateNext && today<cr.debateNext) return;
  const rnd=careerRng(ccHashStr('debate|'+today+'|'+(cr.season||1)));
  const first=!cr.debateNext;
  cr.debateNext=ccAddDays(today, 10+Math.floor(rnd()*7));
  if(first) return;
  const mine=new Set(); try{ (careerMates()||[]).forEach(c=>c && mine.add(hKey(c))); }catch(e){}
  let rows=[]; try{ rows=careerPrRows().map((r,i)=>Object.assign({rank:i+1}, r)).filter(r=>!r.you && !mine.has(hKey({handle:r.name}))).slice(0, 8); }catch(e){}
  if(rows.length<4) return;
  const i=Math.floor(rnd()*(rows.length-1)), a=rows[i], b=rows[i+1];
  let usd={}; try{ careerMoneyRows('year').forEach(r=>{ usd[hKey({handle:r.name})]=r.usd; }); }catch(e){}
  const T=CAREER.titles||{};
  const side=r=>[ccHandle(r.name), r.rank, Math.round(usd[hKey({handle:r.name})]||0), T[hKey({handle:r.name})]||0];
  const w=[a.pr, b.pr].map(p=>Math.round(p*(0.8+0.4*rnd())));
  careerNews('flat', 'ccPostDebate', [side(a), side(b), Math.floor(rnd()*2)],
    {by:CC_DEBATE_BY, poll:{o:['@'+ccHandle(a.name), '@'+ccHandle(b.name)], w, end:ccAddDays(today, 2), v:null}});
}
function ccPollHTML(n){
  const P=n && n.poll; if(!P || !P.o || !P.o.length) return '';
  const T=(typeof LANG!=='undefined' && LANG==='ru') ? {votes:'голосов', ends:'до', done:'Итоги'} : {votes:'votes', ends:'ends', done:'Final results'};
  const ended=careerToday()>P.end, voted=P.v!=null;
  let st={likes:0}; try{ st=ccPostStats(n, ccPostAuthor(n)); }catch(e){}
  const total=Math.max(12, Math.round(st.likes*2.2))+(voted?1:0);
  const sum=P.w.reduce((a,b)=>a+b, 0)||1;
  const pct=P.o.map((x,i)=>Math.round((P.w[i]/sum*(total-(voted?1:0))+(P.v===i?1:0))/total*100));
  const rows=(voted || ended)
    ? P.o.map((x,i)=>'<div class="x-poll-r'+(P.v===i?' me':'')+'"><i style="width:'+pct[i]+'%"></i><span>'+esc(x)+(P.v===i?' ✓':'')+'</span><b>'+pct[i]+'%</b></div>').join('')
    : P.o.map((x,i)=>'<button class="x-poll-b" onclick="careerPollVote(\''+esc(n.id||'')+'\','+i+')">'+esc(x)+'</button>').join('');
  return '<div class="x-poll">'+rows+'<small>'+ccNum(total)+' '+T.votes+' · '+(ended ? T.done : T.ends+' '+esc(ccDayLabel(P.end)))+'</small></div>';
}
function careerPollVote(id, i){
  const e=(CAREER.career.news||[]).find(n=>n && n.id===id);
  if(!e || !e.poll || e.poll.v!=null || careerToday()>e.poll.end) return;
  e.poll.v=i; careerSave(); careerRenderHub(CH_TAB);
}
function ccTrendsHTML(){
  const cr=CAREER && CAREER.career; if(!cr) return '';
  const today=careerToday(), score=new Map(), name=new Map();
  const add=(t, v)=>{ if(!t) return; const k=t.toLowerCase(); score.set(k, (score.get(k)||0)+v); if(!name.has(k)) name.set(k, t); };
  const me=hKey(ccHandle((CAREER.player && CAREER.player.nick)||''));
  (cr.news||[]).forEach(n=>{
    if(!n || !n.day || ccDaysBetween(n.day, today)>6) return;
    let who, st; try{ who=ccPostAuthor(n); st=ccPostStats(n, who); }catch(e){ return; }
    const w=Math.max(1, st.likes);
    let txt=''; try{ txt=String(ccText(n)).replace(/<[^>]+>/g, ' '); }catch(e){}
    // Ник — как пишет его сам человек (карточка), а не строчными из @-упоминания.
    (txt.match(/@([A-Za-z0-9_]+)/g)||[]).forEach(h=>{ const x=h.slice(1); if(hKey(x)===me) return; let c=null; try{ c=ccWhoCard(x); }catch(e){} add((c && c.handle) || x, w); });
    if(who && !who.you && !who.verified && !who.f && who.name) add(who.name, w*0.5);
  });
  try{
    const days=careerYearDays();
    for(let d=-2; d<=7; d++){ const on=(days.get(ccAddDays(today, d))||[]); if(on.some(e=>e && (e.kind==='major'||e.kind==='gc'))){ add('#FNCS', 40000); break; } }
    for(let d=0; d<=3; d++){ const on=(days.get(ccAddDays(today, d))||[]); if(on.some(e=>e && e.kind==='reload')){ add('#Reload', 9000); break; } }
    if(ccMetaOpen()) add(ccSeasonTag(today).short||'', 25000);
  }catch(e){}
  const list=[...score.entries()].sort((a,b)=>b[1]-a[1]).slice(0, 5);
  if(!list.length) return '';
  const ru=(typeof LANG!=='undefined' && LANG==='ru');
  const T=ru ? {h:'Тренды', p:'В тренде в Fortnite', e:'Киберспорт · в тренде', posts:'постов'} : {h:'Trends for you', p:'Trending in Fortnite', e:'Esports · Trending', posts:'posts'};
  return '<div class="ch-tile x-trends"><h4>'+T.h+'</h4>'+list.map(([k,v],i)=>{ const t=name.get(k), tag=/^#/.test(t) || /^C\d+/.test(t);
    return '<button class="x-trend" onclick="careerTrend(\''+jsq(t)+'\')"><em>'+(i+1)+' · '+(tag ? T.e : T.p)+'</em><b>'+esc(t)+'</b><span>'+ccFollowers(Math.round(v/3)+40)+' '+T.posts+'</span></button>'; }).join('')+'</div>';
}
function careerTrend(t){ CH_FEED_Q=t||null; CH_SOCIAL='feed'; CH_FEED='all'; careerRenderHub('social'); }
/* СОВЕТ КОУЧА (Notion 15.10, фидбек: «the option to get a coach doesn't really do anything»; ответ игроку — «coach
   suggests…»). Нанятый коуч говорит, что выбрать: где у вариантов есть проценты (ccChoiceOdds — «X% выживают»), он берёт
   вариант с лучшим последним числом; где чисел нет — ход по умолчанию. Слабый коуч (прирост тренировки < 0.32) ошибается
   в каждом пятом совете. Онлайн и соло-вечер — молчит: лишний бросок развёл бы два браузера (CC_MP_ROLLS). */
function ccCoachOpinion(options, dflt, kind){
  if(!options || options.length<2 || typeof ccCoach!=='function') return null;
  if(typeof ccMpOn==='function' && ccMpOn()) return null;
  const c=ccCoach(); if(!c) return null;
  const last=o=>{ const m=String((o && o.note)||'').replace(/<[^>]+>/g,'').match(/(\d+(?:[.,]\d+)?)\s*%/g); return m ? parseFloat(m[m.length-1]) : null; };
  const scored=options.filter(o=>o && last(o)!=null);
  let pick=scored.length>=2 ? scored.reduce((a,b)=>last(b)>last(a) ? b : a) : dflt;
  // Есть план вечера — совет по нему (ccCoachPlanTarget); у вопроса без пункта плана — как раньше.
  const tg=ccCoachPlanTarget(kind, options.map(o=>o && o.id));
  if(tg){ const o=options.find(x=>x && x.id===tg); if(o) pick=o; }
  if((c.train||0)<0.32 && Math.random()<0.2){ const alt=options.filter(o=>o && o!==pick); pick=alt[Math.floor(Math.random()*alt.length)]||pick; }
  const say=L().ccCoachLeans;
  return {name:c.name, pick, text: typeof say==='function' ? say(String(pick.title||'').replace(/<[^>]+>/g,'')) : ''};
}
/* Оформление остановок вечера по типу решения. Цвет каждой взят из самой игры: высадка небо/автобус,
   точка золото сундука, лут фиолетовый эпик, фарм дерево, ротация стена шторма, середина оранжевый сёрдж,
   концовка красный последнего круга. Цвет только на полосе заголовка, кольце и метке хода по умолчанию,
   остальное синее стекло. Кольцо = круг шторма с номером зоны, догорает по ходу матча.
   У ходов в процентах под названием тонкая полоса той же краски, чтобы сравнивать взглядом. */
const CC_CHOICE_ZONES=11;
const CC_CHOICE_THEME={
  style: {th:'#ffd600', zone:1},    // стиль игры перед игрой — жёлтый W-key
  plan:  {th:'#6fe3d0', zone:1},    // план тренера перед вечером (ccPlanTitle) — бирюза штаба
  drop:  {th:'#5ec8ff', zone:1},    // автобус и небо
  site:  {th:'#ffc93c', zone:1},    // золото сундука
  loot:  {th:'#b46bff', zone:3},    // эпик из лестницы редкости
  farm:  {th:'#c98d4e', zone:3},    // дерево
  build: {th:'#c98d4e', zone:3},
  rot:   {th:'#7b6bff', zone:4},    // стена шторма
  mid:   {th:'#ff7a3d', zone:5},    // урон сёрджа
  heal:  {th:'#3ddc9a', zone:5},    // хилки
  mats:  {th:'#c98d4e', zone:5},
  late:  {th:'#ff3d6e', zone:8},    // последний круг
  moving:{th:'#b36bff', zone:10},   // двигающиеся круги, фиолет шторма
  last:  {th:'#ff3d6e', zone:11}
};
/* Кольцо круга: сколько вечера позади и на каком мы круге. Чистая геометрия, без
   анимации — у него в браузере всегда включён «меньше движения». */
function ccChoiceDial(t){
  if(!t || !t.zone) return '';
  const R=13, C=2*Math.PI*R, done=Math.max(0, Math.min(1, t.zone/CC_CHOICE_ZONES));
  return '<svg class="cc-dial" viewBox="0 0 34 34" aria-hidden="true">'+
    '<circle class="cc-dial-bg" cx="17" cy="17" r="'+R+'"></circle>'+
    '<circle class="cc-dial-on" cx="17" cy="17" r="'+R+'" stroke-dasharray="'+(C*done).toFixed(1)+' '+C.toFixed(1)+'"></circle>'+
    '<text x="17" y="17" class="cc-dial-n">'+t.zone+'</text></svg>';
}
// Ход, названный процентом («65%: держим середину», «33 in 100»), получает полосу шанса.
function ccChoiceOdds(note){
  const txt=String(note||'').replace(/<[^>]+>/g, ' ');
  // Три формы, которыми игра называет шанс: «65%», «33 in 100» и «40/60» (пара, дающая сто).
  const pair=txt.match(/(\d{1,3})\s*\/\s*(\d{1,3})/);
  const m=txt.match(/(\d{1,3})\s*(?:%|(?:in|из)\s*100)/);
  const v=m ? +m[1] : (pair && +pair[1]+ +pair[2]===100 ? +pair[1] : 0);
  if(!v || v>100) return '';
  return '<i class="cc-odds" style="--v:'+v+'%"></i>';
}
/* Пак картинками — пять ячеек, как хотбар: стволы, хилки, передвижение; ячейка носит цвет
   редкости, стак — числом в углу, без картинки — имя мелко. Отзыв: «добавь фотографии
   лут-пулу, если нет» — до этого пак в вопросе высадки и лута шёл строкой имён. */
function ccPackSlotsHTML(p){
  if(!p) return '';
  const items=[...(p.weapons||[]), ...(p.heals||[]), p.move].filter(Boolean).slice(0, 5);
  while(items.length<5) items.push(null);
  return '<span class="cc-pack">'+items.map(o=>{
    if(!o) return '<i class="empty"></i>';
    let h=''; try{ h=(typeof weaponIconHTML==='function' && weaponIconHTML(o, ccLootSet()))||''; }catch(e){ h=''; }
    const art=/<img/.test(h) ? h : '<span>'+esc(o.name)+'</span>';
    return '<i class="r-'+ccRarityKey(o.rarity)+'" title="'+esc(ccItemLabel(o))+'">'+art+(o.n>1 ? '<u>'+o.n+'</u>' : '')+'</i>';
  }).join('')+'</span>';
}
/* «Как это считается» под каждым вопросом — тестер, 16.09: «не ясно, как именно
   влияет лут, очки силы, ресы на результат матча, если б это было где-то
   прописано». Строки из словаря, числа — из тех же констант, что считают. */
function ccGameHowHTML(){
  const T=L();
  if(typeof T.ccGameHow!=='function') return '';
  let lines=[];
  try{
    lines=T.ccGameHow({full:CC_MATS_FULL, early:CC_MATS_EARLY_ZONE, zone:CC_MATS_ZONE, farm:CC_MATS_FARM, short:CC_MATS_FARM_SHORT,
      pen:CC_MATS_PEN, surge:CC_SURGE_FARM, surgePow:CC_SURGE_FARM_POW, decide:Math.round(CC_FIGHT.decide*100),
      trade:Math.round(CC_FIGHT.trade*100), fightPow:CC_FIGHT.pow, tradePow:CC_FIGHT.tradePow});
  }catch(e){ return ''; }
  return '<details class="cc-how"><summary>'+esc(T.ccGameHowTitle||'')+'</summary><ul>'+
    lines.map(l=>'<li>'+esc(l)+'</li>').join('')+'</ul></details>';
}
/* Открытое окно выбора. На широком экране оно живёт в body (cc-choice-side/over), а не в карте, поэтому те, кто
   дописывает в него чипы и тап по карте пути (ротация, концовка), берут его отсюда, а не поиском в карте. */
let CC_CHOICE_OPEN=null;
function ccChoiceIn(host){
  if(CC_CHOICE_OPEN && CC_CHOICE_OPEN.isConnected && (!host || CC_CHOICE_OPEN._host===host)) return CC_CHOICE_OPEN;
  const boxes=host ? host.querySelectorAll('.cc-choice') : [];
  return boxes.length ? boxes[boxes.length-1] : null;
}
function ccChoiceBox(title, hint, options, onMap, side, kind){
  /* Порядок кнопок — тот, что передали: сторожа кликают по data-at и ждут
     именно его. Правило «ход по умолчанию — первым» живёт там, где список
     собирают (см. ccAskMenu), а не здесь. */
  return ccMpIdle(new Promise(resolve=>{
    const host=onMap || document.getElementById('majorStages');
    const dflt=options.find(o=>o && o.def) || options[0];
    const mate=ccMateOpinion(options, dflt), coach=ccCoachOpinion(options, dflt, kind);
    // Что спросили и что выбрали — для плана коуча (ccCoachPlanScore). Только карьера.
    const baseKind=String(kind||'').replace(/:.*$/, '');
    if(typeof CAREER_RUN!=='undefined' && CAREER_RUN && baseKind) CC_GAME_OPTS[baseKind]=options.map(o=>o && o.id);
    let done=false;
    const answer=o=>{ if(done) return; done=true;
      if(typeof CAREER_RUN!=='undefined' && CAREER_RUN && baseKind && o) CC_GAME_PICKS[baseKind]=o.id;
      clearInterval(watch); clearTimeout(bell);
      // Чат эфира видел вопрос — видит и ответ. Только там, где вопрос стоял.
      if(box && typeof ccTvOnChosen==='function') ccTvOnChosen(o);
      if(box && box.isConnected) box.remove();
      resolve(o); };
    const auto=()=>answer(dflt);
    let box=null, watch=null, bell=null;
    // Симуляция спрошена отдельно от skipAnimation: высадку спрашивают ДО
    // первого этапа, когда флаг пропуска ещё не выставлен, и без этой проверки
    // вечер, отданный симуляции, всё равно останавливался бы на первом вопросе.
    if(!host || skipAnimation || careerSimOn() || (typeof CC_FF!=='undefined' && CC_FF)){
      resolve(dflt); return;
    }
    box=document.createElement('div');
    box.className=onMap ? 'cc-choice cc-choice-map' : 'stage-card cc-choice';
    // Тема остановки: краска момента и круг на заголовке (см. CC_CHOICE_THEME).
    const th=CC_CHOICE_THEME[String(kind||'').replace(/:.*$/, '')]||null;
    if(th){ box.dataset.th=String(kind).replace(/:.*$/, ''); box.style.setProperty('--th', th.th); }
    const sub=(side && (side.left||side.right)) || hint
      ? `<div class="cc-choice-sub">`+
        (side && side.left ? `<div class="cc-choice-ava">${side.left}</div>` : '')+
        (hint ? `<span>${hint}</span>` : '<span></span>')+
        (side && side.right ? `<div class="cc-choice-mini">${side.right}</div>` : '')+
        `</div>`
      : '';
    const mateLine=(mate ? `<div class="cc-choice-mate"><i>${esc(mate.name)}</i> ${esc(mate.text)}</div>` : '')+
      (coach ? `<div class="cc-choice-mate cc-choice-coach"><i>${esc(coach.name)}</i> ${esc(coach.text)}</div>` : '');
    box.innerHTML=`<div class="cc-choice-head"><b>${ccChoiceDial(th)}<span class="cc-choice-t">${esc(title)}</span></b>${sub}${mateLine}${ccGameHowHTML()}</div>`+
      `<div class="cc-choice-row">${options.map((o,i)=>
        `<button class="cc-choice-btn${o.art?' has-art':''}${o.icon?' has-ico':''}${o===dflt && options.length>1?' def':''}${mate && o===mate.pick?' mate':''}${coach && o===coach.pick?' coach':''}" data-at="${i}"${mate && o===mate.pick ? ' data-mate="'+esc(mate.name)+'"' : ''}${coach && o===coach.pick ? ' data-coach="'+esc(L().ccCoachTag)+'"' : ''}>
           ${o.art||''}<span class="cc-choice-tt">${o.icon?'<i class="cc-choice-ico'+(o.icoCls?' '+o.icoCls:'')+'">'+o.icon+'</i>':''}<b>${esc(o.title)}</b></span>${o.pack ? ccPackSlotsHTML(o.pack) : ''}${ccChoiceOdds(o.note)}<em>${o.note||''}</em></button>`).join('')}</div>`+
      `<div class="cc-choice-bar"><i></i></div>`;
    /* Широкий экран: вопрос посреди игры — поверх экрана по центру, а не окошком внутри карты боя (его скрин 19.11:
       ротация с картой пути и ходами зажата в карте и листается). В body: у карты бывает transform. Окно карты дропов
       (.cc-dm-ask) уже поверх экрана — там как было. Телефон — как было. */
    const over=!!(onMap && !(onMap.classList && onMap.classList.contains('cc-dm-ask')) && (window.innerWidth||0)>=900);
    if(over) box.classList.add('cc-choice-over');
    /* И не посреди экрана, а слева, на месте карты боя: таблица справа остаётся видна (его слово 19.11, как у лута:
       «все выборы пусть там показываются»). Рамка — по карте в окне; карта мала или не видна — по центру экрана. */
    if(over){
      const r=onMap.getBoundingClientRect(), top=Math.max(8, r.top), h=Math.min(r.bottom, window.innerHeight-8)-top;
      if(r.width>=560 && h>=380){
        box.classList.add('cc-choice-side');
        Object.assign(box.style, {left:Math.round(Math.max(0, r.left))+'px', top:Math.round(top)+'px', width:Math.round(r.width)+'px', maxHeight:Math.round(h)+'px'});
      }
    }
    (over ? document.body : host).appendChild(box);
    box._host=host; CC_CHOICE_OPEN=box;
    // По высоте — посередине карты, как стояло окошко внутри неё.
    if(box.classList.contains('cc-choice-side')){ const r=onMap.getBoundingClientRect(), top=Math.max(8, r.top), h=Math.min(r.bottom, window.innerHeight-8)-top;
      box.style.top=Math.round(top+Math.max(0, (h-box.offsetHeight)/2))+'px'; }
    // Чат эфира видит вопрос и начинает советовать. См. ccTvOnChoice.
    if(typeof ccTvOnChoice==='function') ccTvOnChoice(options);
    if(!onMap) box.scrollIntoView({block:'center',
      behavior:(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
        ? 'auto' : 'smooth'});
    // Полоска времени: видно, что вопрос не будет ждать вечно, и сколько
    // осталось до того, как игра решит сама.
    const bar=box.querySelector('.cc-choice-bar i');
    if(bar){ bar.style.transition='transform '+CC_CHOICE_WAIT+'ms linear';
             requestAnimationFrame(()=>{ bar.style.transform='scaleX(0)'; }); }
    box.querySelectorAll('.cc-choice-btn').forEach(b=>{
      b.onclick=()=>answer(options[+b.dataset.at]);
    });
    // Читает «как это считается» — вопрос ждёт: полоска встаёт, звонок снимается.
    const how=box.querySelector('.cc-how');
    if(how) how.addEventListener('toggle', ()=>{
      if(!how.open) return;
      clearTimeout(bell); bell=null;
      if(bar){ bar.style.transition='none'; bar.style.transform='scaleX(1)'; }
    });
    // Тронул карту (точка пути, ccAskPath) — тоже ждём: человек выбирает руками.
    box.querySelectorAll('[data-hold]').forEach(el=>el.addEventListener('pointerdown', ()=>{
      clearTimeout(bell); bell=null;
      if(bar){ bar.style.transition='none'; bar.style.transform='scaleX(1)'; }
    }));
    // Скип, нажатый посреди вопроса, тоже отвечает — иначе кнопка «пропустить»
    // переставала пропускать ровно там, где это нужнее всего.
    watch=setInterval(()=>{ if(skipAnimation) auto(); }, 120);
    // И вопрос, на который никто не ответил, отвечает сам.
    bell=setTimeout(auto, CC_CHOICE_WAIT);
  }));
}
/* Чем кончилось решение — на той же карте, где его принимали.

   Правка: «может пусть пишет удачно или нет». Монетка хайграунда решается
   молча, и без ответа выбор читается как кнопка без последствий: ты нажал,
   игра поехала дальше, а повезло или нет — знает только счёт в конце. Поэтому
   на месте панели на пару секунд встаёт плашка: что вышло и что это дало.

   Под скипом и в перемотке не показывается вовсе — там некому смотреть. */
function ccChoiceResult(map, text, ok){
  return new Promise(resolve=>{
    if(ccAskRivalName()){ resolve(); return; }   // чужой ответ — строкой в логе, не баннером
    if(!map || skipAnimation || careerSimOn() ||
       (typeof CC_FF!=='undefined' && CC_FF)){ resolve(); return; }
    const tag=document.createElement('div');
    tag.className='cc-choice-out'+(ok===false?' bad':(ok?' good':''));
    tag.innerHTML=`<b>${esc(text)}</b>`;
    map.appendChild(tag);
    // И чат эфира знает, чем кончилось. См. ccTvOnResult.
    if(typeof ccTvOnResult==='function') ccTvOnResult(ok);
    setTimeout(()=>{ tag.classList.add('out'); }, 1500);
    setTimeout(()=>{ tag.remove(); resolve(); }, 1900);
  });
}
/* ПОВТОР СМЕРТИ — из его списка идей 6 сентября: после вылета показать, кто и
   чем выбил, откуда и на чём стояли. Движок знает причину (deathCause — шторм,
   сёрдж или имя команды), зону, место, чистый урон и где стояли оба отряда;
   ствол убийцы — из его пака (сундуки на точке есть у всех, ccRoomSite).
   Дистанция — словами по шкале движка: вплотную (до CONTACT_RANGE 2.2), с
   соседней постройки (до CHIP_RANGE 4.4), издалека. Карточка стоит на карте
   три секунды и под скипом/симуляцией/перемоткой не показывается. */
const CC_DEATH_NEAR=2.2, CC_DEATH_MID=4.4, CC_DEATH_MS=3200;
function ccDeathInfo(you, game){
  const sq=you && you._sq;
  if(!sq || sq.alive) return null;
  const cause=sq.deathCause;
  const killer=(cause && cause!=='storm' && cause!=='surge' && game && game.squads)
    ? game.squads.find(s=>s.team && s.team.name===cause) : null;
  let range=null;
  if(killer){
    const d=Math.hypot((killer.x||0)-(sq.x||0), (killer.y||0)-(sq.y||0));
    range = d<=CC_DEATH_NEAR ? 'close' : d<=CC_DEATH_MID ? 'near' : 'far';
  }
  const gun=killer && killer.team._loot && killer.team._loot.weapons && killer.team._loot.weapons[0];
  const net=Math.round((sq.dealt||0)-(sq.taken||0));
  return {zone:sq.zoneReached||0, cause:cause||'', who:killer ? String(killer.team.name||'').replace(/<[^>]+>/g,'').trim() : '',
          gun:gun ? gun.name : '', range, place:sq.place||0, net:net, elims:sq.elims||0,
          surge:ccSurgeGapAt(game && game.frames ? game.frames() : null, net)};
}
/* Шторм и сюрдж своего года (29.10, его «в каждом чаптере были разные зоны и сюрдж правила»): таблица из
   ZoneSim.phasesFor по дню карьеры, вне карьеры по сезону острова. Reload: своя таблица, как была.
   CC_GAME_PHASES: таблица последней игры, по ней HUD считает порог следующего круга. */
let CC_GAME_PHASES=null;
const CC_STORM_DAY={g:'2019-03-01', h:'2019-08-01', i:'2020-06-01', j:'2021-06-01', k1:'2022-03-15', k2:'2022-06-15', k3:'2022-09-01',
  e:'2023-06-01', f:'2024-06-01', t:'2025-06-01'};
function ccStormDay(set){
  try{ if(CAREER_RUN && typeof CAREER!=='undefined' && CAREER && CAREER.career) return careerToday(); }catch(e){}
  const k=String(set||'');
  return CC_STORM_DAY[k] || CC_STORM_DAY[k.charAt(0)] || '';
}
function ccStormPhases(set, squadSize){
  // Вид шторма на карте (zone-replay stormLook): Главы 1–2 до 5.12.2021, Главы 3–5 до 1.12.2024, дальше нынешний.
  const day=ccStormDay(set);
  try{ window.CC_STORM_LOOK=!day ? 'c6' : day<'2021-12-05' ? 'c1' : day<'2024-12-01' ? 'c3' : 'c6'; }catch(e){}
  if(/^r\d$/.test(set)){ CC_GAME_PHASES=ZoneSim.reloadPhasesFor ? ZoneSim.reloadPhasesFor(day) : ZoneSim.RELOAD_PHASES; return CC_GAME_PHASES; }
  CC_GAME_PHASES=ZoneSim.phasesFor ? ZoneSim.phasesFor(ccStormDay(set), squadSize) : null;
  return CC_GAME_PHASES || undefined;
}
/* Число сёрджа, как его пишет HUD («149 ABOVE DAMAGE THRESHOLD»): чистый урон
   отряда минус линия отсечки последнего кадра. Пока сёрдж никого не бьёт, но
   живых больше порога следующего круга — линия предварительная, тем же
   правилом, что у панели набора (k-й снизу по чистому урону). null — сёрджа
   нет. Отзыв: «пиши количество сюрджа, а не урона за игру» — урон за
   игру у нас выше реального (≈2300 против 1400–2000 в реплеях), а число над
   линией откалибровано по ним (career-surge-you-probe). */
function ccSurgeGapAt(frames, net){
  const f=frames && frames.length ? frames[frames.length-1] : null;
  if(!f) return null;
  if(f.surgeAt>0 && f.surgeLine!=null) return Math.round(net-f.surgeLine);
  const reload=/^r[0-9]$/.test(String(typeof ACTIVE_LANDING_SET!=='undefined' ? ACTIVE_LANDING_SET : ''));
  const nextPh=(!reload && typeof ZoneSim!=='undefined' && ZoneSim.PHASES) ? (CC_GAME_PHASES||ZoneSim.PHASES)[f.zone] : null;
  const nextAt=nextPh && isFinite(nextPh.surgeAt) ? nextPh.surgeAt : 0;
  if(!(f.zone>=2 && nextAt>0 && f.players>nextAt)) return null;
  const alive=(f.dots||[]).filter(x=>x && x.alive);
  if(!alive.length) return null;
  const per=Math.max(1, f.players/alive.length);
  const nets=alive.map(x=>Number(x.n)||0).sort((a,b)=>a-b);
  const k=Math.min(nets.length-1, Math.ceil((f.players-nextAt)/per));
  return Math.round(net-nets[k]);
}
function ccDeathCard(map, info){
  return new Promise(resolve=>{
    if(!map || !info || skipAnimation || careerSimOn() ||
       (typeof CC_FF!=='undefined' && CC_FF)){ resolve(); return; }
    const T=L();
    const how = info.cause==='storm' ? T.ccDeathStorm : info.cause==='surge' ? T.ccDeathSurge
      : T.ccDeathBy(info.who, info.gun, info.range ? T.ccDeathRange[info.range] : '');
    const tag=document.createElement('div');
    tag.className='cc-choice-out bad cc-death';
    const sg = info.surge==null ? T.ccDeathSurgeOff : info.surge<0 ? T.ccDeathSurgeBelow(ccNum(-info.surge)) : T.ccDeathSurgeAbove(ccNum(info.surge));
    tag.innerHTML='<b>'+esc(T.ccDeathTitle(info.zone))+'</b><span>'+esc(how)+'</span><em>'+esc(T.ccDeathStats(info.place, sg, info.elims))+'</em>';
    map.appendChild(tag);
    setTimeout(()=>{ tag.classList.add('out'); }, CC_DEATH_MS-400);
    setTimeout(()=>{ tag.remove(); resolve(); }, CC_DEATH_MS);
  });
}
/* Лут середины игры. Пак — два ствола, две хилки и мувмент; тиммейт разбирает
   свой сам («тимейт сам выбирает»), поэтому его прибавка считается без
   вопросов и по такому же паку. */
/* Соседняя точка стоит риска: чужой POI занят, добежать до круга с полным инвентарём выходит не всегда.
   Свой пак +0, соседняя +4, шанс 40/60, при провале «лишний урон» и минус power. Своя точка теперь база, поэтому
   ccLootPow и прибавка за напарника убраны: сила идёт от решения, а не от выпавших предметов.
   Ожидание пробежки 0.4·4 - 0.6·2 = +0.4. Та же форма, что у хайграунда: потолок выше, ожидание ниже. */
/* Действия на точке. Первая остановка до того, как кто-то сдвинулся (playTo(1) ничего не играет).
   Своя точка: сундуки открываются молча. Чужие на точке: по сундуку каждому и вопрос, файтить или уйти.
   Шансы редкости: из сундука Common не падает (вики Fortnite, Chest), остальное по датамайну
   (mein-mmo.de, Hypex Ch2S5) без common: uncommon больше половины, rare под треть, epic/legendary единицы %.
   Таблицы Ch7 Epic не публикует, сумма 1. Сундуков 8 на точке, 4 если уйти на соседнюю (порядок, не замер).
   Класс ствола из поля icon пула (rifle/shotgun/...). */
const CC_CHEST_RARITY={common:0, uncommon:0.57, rare:0.31, epic:0.09, legendary:0.03};
const CC_CHESTS_POI=8, CC_CHESTS_LEAVE=4, CC_CHEST_CONSUMABLE=0.6;
/* Сундуков на точке — по луту КОРОБКИ, а не одной цифрой на всех (его список
   7.09: «сундуки плавно по коробке вместо 8/4»). Лут коробки — считанные с вики
   сундуки и ящики (ZONE_STATS.loot, build-2025-zone-loot.js); середина острова
   (медиана коробок с лутом) = CC_CHESTS_POI, дальше пропорционально, в пределах
   CC_CHESTS_MIN…CC_CHESTS_MAX. Пустое поле (loot 0) — минимум. Уходя на соседнюю —
   доля её сундуков (CC_CHESTS_LEAVE_SHARE = прежние 4 из 8): часть уже открыта, пока
   летели. Остров без счётного лута — по-старому 8/4. Пропорция и края — порядок
   величины, как и сама восьмёрка, не замер. */
const CC_CHESTS_MIN=2, CC_CHESTS_MAX=14, CC_CHESTS_LEAVE_SHARE=CC_CHESTS_LEAVE/CC_CHESTS_POI;
