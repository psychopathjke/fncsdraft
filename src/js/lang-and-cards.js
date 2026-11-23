/*@@PART js/lang-and-cards.js@@*/
// Версия fn-shop.js (магазин Fortnite по дням, tools/build-fn-shop.js) — для ?v= ленивой загрузки.
let CC_FN_SHOP_V='dc62e7dc';
const CC_LANG_WAIT={};
// Пришёл ли ленивый словарь. Не по I18N[lang]: кусок словаря может завести и код (менеджер), а целого ещё нет.
// Не пришёл файл (сеть) — тоже «готово»: дальше английский, а не загрузка по кругу.
const CC_LANG_DONE={};
function ccLangLoad(lang, done){
  if(!CC_LANG_FILES[lang] || CC_LANG_DONE[lang]){ done && done(); return; }
  if(CC_LANG_WAIT[lang]){ CC_LANG_WAIT[lang].push(done); return; }
  CC_LANG_WAIT[lang]=[done];
  const el=document.createElement('script');
  el.src='i18n-'+lang+'.js?v='+(CC_I18N_V[lang]||'0');
  el.onload=el.onerror=function(){ CC_LANG_DONE[lang]=1; const q=CC_LANG_WAIT[lang]||[]; delete CC_LANG_WAIT[lang]; CC_L_CACHE={}; q.forEach(f=>{ try{ f && f(); }catch(e){ console.error(e); } }); };
  document.head.appendChild(el);
}
let CC_L_CACHE={};
let LANG=(function(){
  if(CC_PATH_LANG) return CC_PATH_LANG;
  try{
    const saved=localStorage.getItem(LS_LANG);
    if(CC_LANGS.indexOf(saved)>=0) return saved;
  }catch(e){}
  const nav=String(navigator.language||'').toLowerCase();
  for(const l of ['ru','fr','it','pt','de','es']) if(nav.indexOf(l)===0) return l;
  return 'en';
})();
/* Строки «жизни между турнирами» (оценка вечера, награды, клуб, скримы, тренировка,
   усталость, поездки, скандалы, икон-скин, ранкед) — русский и английский; остальные
   языки берут английский из-под себя (см. L). */
Object.assign(I18N.ru, {
  lfRate:'Оценка за вечер', lfMvp:'MVP вечера', lfMvpYou:'ты — MVP вечера', lfAvgRate:'Средняя оценка сезона', lfMvpCount:'MVP за сезон',
  lfNewsPlaced:n=>'Посев: Дивизион '+n, lfDropH:'Где я сажусь', lfDropHint:'кружок — точка, размер — сколько раз, цвет — среднее место', lfDropTip:(n,c,p,w)=>'точка '+n+': '+c+' раз, выше '+p+'% лобби'+(w?', побед '+w:''), lfFocusH:'Фокус недели', lfFocusOn:(a,p)=>a+': +'+p+'% к приросту до конца недели', lfFocusPick:p=>'Выбери атрибут недели — его занятия дают +'+p+'%. Сменить до конца недели нельзя.', lfGoalH:'Цель', lfGoalHint:'Поставь число — дошёл, и форма чуть лучше.', lfGoalDone:(a,t)=>a+' '+t+' — цель выполнена', lfNewsGoal:(a,t)=>'Цель выполнена: '+a+' '+t, lfCompare:'Ты и тиммейт', lfCalQual:'Квалифицирован', lfCalInvited:'Приглашён', chTabMedia:'Медиа', chTabBoards:'Таблицы', lfSubPrMoney:'PR и призовые', ccBellClear:'Прочитать всё', lfInbox:'Входящие', lfPtsShort:'очк.', chTabTrain:'Тренировка', lfTrainTitle:'Тренировочный центр', lfTrainOpen:'Открыть', lfTrainPromo:(w,a)=>'За неделю '+w+' · слабее всего: '+a, lfTrainEventDay:t=>'Сегодня турнир'+(t?' — '+t:'')+'. Тренировки — в свободный день.', lfTrainToCentre:'К турниру',
  lfHdrNext:'Далее', lfHdrToday:'Сегодня', lfHdrPlay:'можно играть', lfHdrIn:n=>n===1?'завтра':'через '+n+' дн.', lfHdrSeason:'Рейтинг за сезон',
  lfTitle:'Между турнирами', lfToday:'Сегодня', lfFatigue:'Усталость', lfGalaYouH:'Твой год', lfGalaMates:'Тиммейтов', lfGalaBestNight:'Лучший вечер', lfGalaTopMate:'Чаще всего вместе', lfVod:'Разобрать реплей: в чём была главная ошибка?', lfVod_drop:'Дроп', lfVod_rot:'Ротации и зона', lfVod_fight:'Файты', lfVodOk:'Верно — опыт +0.4, форма чуть лучше', lfVodNo:t=>'Не то — главная беда была: '+t, lfNewsVodOk:t=>'Разобрал реплей: ошибка — '+t+'. Понял, что делать', lfNewsVodNo:t=>'Разбор реплея не зашёл — на самом деле проблема была: '+t, lfScout:'Разведка', lfScoutYou:p=>'ты в топ-'+p+'% сцены', lfScoutFav:'Фавориты сцены', lfScoutForm:'В форме (PR)', lfChem:'Сыгранность', lfChemHint:d=>'Растёт от дней вместе ('+d+' до максимума), вечер вместе считается за 3 дня, скрим — за 2.', lfChemBonus:'Бонус к силе команды', lfYouTag:'ты', lfWordSoloOne:'соло', lfNewsStandin:n=>'На кап своего состава нет — играю со стэнд-инами: '+n, lfRateShort:'Оценка', lfAvgRateAll:'Средняя оценка', lfMvpAll:'MVP вечеров', lfLastNights:'Последние вечера', lfAwards:'Награды', lfAwYear:'Игрок года', lfAwMonth:'Игрок месяца', lfAwCups:'Кубки', lfAwMonths:'Игрок месяца', lfAwPts:'очков PR', lfAwEv:'турниров', lfAwWeekly:'Финалы недели', lfAwNone:'Пока наград нет. Игрок месяца, игрок года и номинации решаются по Power Ranking.', lfMetaGive:'форма в новом сезоне', lfFatFresh:'свежий', lfFatTired:'устал', lfFatBurn:'выгорание', lfInjuryRisk:p=>'риск травмы '+p+'% в день', lfCoachBoost:p=>'коуч +'+p+'%', chTabClub:'Клуб', lfContract:'Контракт', lfNoOrg:'Без клуба. Предложения приходят в личку после результатов.', lfSalary:'Зарплата в месяц', lfCut:'Доля клуба с призовых', lfGoal:'Цель сезона', lfGoalMet:'выполнена', lfGoalOpen:'пока нет', lfBuyout:'Отступные', lfSince:'В клубе с сезона', lfPaid:'Выплачено клубом', lfIncome:'Доходы', lfPrize:'Призовые', lfWages:'Зарплата', lfSide:'Побочные', lfSponsor:'Спонсоры', lfOrgCut:'Ушло клубу', lfBalance:'Баланс', lfRosters:'Составы', lfRostersHint:'У дуо, трио и сквада — свои составы; этап года выбирает, какой играет.', lfRosterDuo:'Дуо', lfRosterTrio:'Трио', lfRosterSquad:'Сквад', lfRosterNow:'сейчас', lfRosterEmpty:'пусто', lfWordSolo:'игроков', lfWordSquads:'сквадов', lfRank:'Ранкед', lfHurt:'Травма', lfWrist:'запястье', lfIll:'болезнь', lfUntil:'до', lfCaseOpen:'Разбирательство',
  lfBan:'Бан открытых турниров', lfIcon:'Икон-скин',
  lfWeek:'неделя', lfSessions:'сессий',
  lfWhyHurt:'Травма — играть нельзя', lfWhyBan:'Бан открытых турниров',
  lfCaseteam:'тиминг', lfCasesnipe:'стрим-снайпинг', lfCasetoxic:'токсичный пост',
  ccActnoble:'Noble Pro Scrims',
  lfNewsRankUp:r=>'Новый ранг в ранкеде: '+r,
  lfNewsNoble:(s,p,of,k,pts,fg)=>s+': #'+p+' из '+of+', '+k+' килл., '+pts+' очк.'+(fg ? ' · форма +'+fg : ''), lfNobleForm:'+ форма',
  lfNewsWrist:n=>'Боль в запястье: врач запретил играть '+n+' дн.',
  lfNewsIll:n=>'Заболел — '+n+' дн. без игры',
  lfNewsHealed:()=>'Снова в строю',
  lfNewsCase:c=>'Жалоба на тебя: '+c+'. Epic разбирается',
  lfNewsCleared:c=>'Жалоба ('+c+') не подтвердилась',
  lfNewsFined:(c,f)=>'Жалоба ('+c+') подтвердилась: штраф '+f,
  lfNewsBanned:(c,n)=>'Бан на '+n+' дн. за '+c+': открытые турниры закрыты',
  lfNewsSceneBan:(h,c)=>h+' получил бан за '+c,
  lfNewsIcon:(n,p)=>'Epic выпускает скин '+n+' в серии Icon! Разовая выплата '+p,
  lfTlIcon:()=>'Свой скин в серии Icon'
});
Object.assign(I18N.en, {
  lfRate:'Match rating', lfMvp:'Player of the night', lfMvpYou:'you were the player of the night', lfAvgRate:'Season average rating', lfMvpCount:'Player-of-the-night awards',
  lfNewsPlaced:n=>'Seeded into Division '+n, lfDropH:'Where I land', lfDropHint:'dot — spot, size — how often, colour — average place', lfDropTip:(n,c,p,w)=>'spot '+n+': '+c+' times, above '+p+'% of the lobby'+(w?', wins '+w:''), lfFocusH:'Focus of the week', lfFocusOn:(a,p)=>a+': +'+p+'% gain until the week ends', lfFocusPick:p=>'Pick the attribute of the week — its sessions give +'+p+'%. It stays until the week ends.', lfGoalH:'Goal', lfGoalHint:'Set a number — reach it and your form improves a little.', lfGoalDone:(a,t)=>a+' '+t+' — goal reached', lfNewsGoal:(a,t)=>'Goal reached: '+a+' '+t, lfCompare:'You and your teammate', lfCalQual:'Qualified', lfCalInvited:'Invited', chTabMedia:'Media', chTabBoards:'Boards', lfSubPrMoney:'PR and prize money', ccBellClear:'Mark all as read', lfInbox:'Inbox', lfPtsShort:'pts', chTabTrain:'Training', lfTrainTitle:'Training centre', lfTrainOpen:'Open', lfTrainPromo:(w,a)=>'This week '+w+' · weakest: '+a, lfTrainEventDay:t=>'Tournament today'+(t?' — '+t:'')+'. Training is on free days.', lfTrainToCentre:'To the tournament',
  lfHdrNext:'Next', lfHdrToday:'Today', lfHdrPlay:'ready to play', lfHdrIn:n=>n===1?'tomorrow':'in '+n+' days', lfHdrSeason:'Rating this season',
  lfTitle:'Between events', lfToday:'Today', lfFatigue:'Fatigue', lfGalaYouH:'Your year', lfGalaMates:'Teammates', lfGalaBestNight:'Best night', lfGalaTopMate:'Most nights with', lfVod:'Review the replay: what was the main mistake?', lfVod_drop:'The drop', lfVod_rot:'Rotations and zone', lfVod_fight:'Fights', lfVodOk:'Right — experience +0.4, a bit more form', lfVodNo:t=>'Not quite — the real problem was: '+t, lfNewsVodOk:t=>'Reviewed the replay: the mistake was '+t+'. Got it', lfNewsVodNo:t=>'The replay review missed — the real problem was: '+t, lfScout:'Scouting', lfScoutYou:p=>'you are top '+p+'% of the scene', lfScoutFav:'Scene favourites', lfScoutForm:'In form (PR)', lfChem:'Chemistry', lfChemHint:d=>'Grows with days together ('+d+' to max); a night together counts as 3 days, a scrim as 2.', lfChemBonus:'Team strength bonus', lfYouTag:'you', lfWordSoloOne:'solo', lfNewsStandin:n=>'No roster of my own for this cup — playing with stand-ins: '+n, lfRateShort:'Rating', lfAvgRateAll:'Average rating', lfMvpAll:'Nights as MVP', lfLastNights:'Last nights', lfAwards:'Awards', lfAwYear:'Player of the year', lfAwMonth:'Player of the month', lfAwCups:'Trophies', lfAwMonths:'Player of the month', lfAwPts:'PR points', lfAwEv:'events', lfAwWeekly:'Weekly finals', lfAwNone:'No awards yet. Player of the month, of the year and the season categories are decided by Power Ranking.', lfMetaGive:'form in the new season', lfFatFresh:'fresh', lfFatTired:'tired', lfFatBurn:'burnt out', lfInjuryRisk:p=>'injury risk '+p+'% a day', lfCoachBoost:p=>'coach +'+p+'%', chTabClub:'Club', lfContract:'Contract', lfNoOrg:'No club. Offers arrive in your DMs after results.', lfSalary:'Monthly salary', lfCut:'Club share of prize money', lfGoal:'Season goal', lfGoalMet:'done', lfGoalOpen:'not yet', lfBuyout:'Buyout', lfSince:'At the club since season', lfPaid:'Paid by the club', lfIncome:'Income', lfPrize:'Prize money', lfWages:'Salary', lfSide:'Side income', lfSponsor:'Sponsors', lfOrgCut:'Went to the club', lfBalance:'Balance', lfRosters:'Rosters', lfRostersHint:'Duos, trios and squads keep their own rosters; the stage of the year picks which one plays.', lfRosterDuo:'Duos', lfRosterTrio:'Trios', lfRosterSquad:'Squads', lfRosterNow:'now', lfRosterEmpty:'empty', lfWordSolo:'players', lfWordSquads:'squads', lfRank:'Ranked', lfHurt:'Injury', lfWrist:'wrist', lfIll:'illness', lfUntil:'until', lfCaseOpen:'Under review',
  lfBan:'Banned from open events', lfIcon:'Icon skin',
  lfWeek:'week', lfSessions:'sessions',
  lfWhyHurt:'Injured — cannot play', lfWhyBan:'Banned from open events',
  lfCaseteam:'teaming', lfCasesnipe:'stream sniping', lfCasetoxic:'a toxic post',
  ccActnoble:'Noble Pro Scrims',
  lfNewsRankUp:r=>'New ranked rank: '+r,
  lfNewsNoble:(s,p,of,k,pts,fg)=>s+': #'+p+' of '+of+', '+k+' kills, '+pts+' pts'+(fg ? ' · form +'+fg : ''), lfNobleForm:'+ form',
  lfNewsWrist:n=>'Wrist pain: the doctor says no games for '+n+' days',
  lfNewsIll:n=>'Ill — '+n+' days off',
  lfNewsHealed:()=>'Back in action',
  lfNewsCase:c=>'A report against you: '+c+'. Epic is looking into it',
  lfNewsCleared:c=>'The report ('+c+') was not upheld',
  lfNewsFined:(c,f)=>'The report ('+c+') was upheld: fined '+f,
  lfNewsBanned:(c,n)=>n+'-day ban for '+c+': open events are closed',
  lfNewsSceneBan:(h,c)=>h+' banned for '+c,
  lfNewsIcon:(n,p)=>'Epic is releasing a '+n+' Icon Series skin! One-off payment '+p,
  lfTlIcon:()=>'An Icon Series skin of your own'
});
// Раунд за раундом: после пропуска — играть или симулировать следующий (ccRoundChoice).
Object.assign(I18N.ru, {ccYrXHeatsIn:k=>'Топ-'+k+' серии — в хитах', ccYrXHeatsZone:k=>'В зоне хитов: топ-'+k+' серии', ccYrXHeatsOut:k=>'Вне топ-'+k+' серии — мимо хитов'});
Object.assign(I18N.en, {ccYrXHeatsIn:k=>'Top '+k+' of the series — into the Heats', ccYrXHeatsZone:k=>'In the Heats zone: series top '+k, ccYrXHeatsOut:k=>'Outside the series top '+k+' — no Heats'});
Object.assign(I18N.fr, {ccYrXHeatsIn:k=>'Top '+k+' de la série — en heats', ccYrXHeatsZone:k=>'Zone des heats : top '+k+' de la série', ccYrXHeatsOut:k=>'Hors du top '+k+' de la série — pas de heats'});
Object.assign(I18N.it, {ccYrXHeatsIn:k=>'Top '+k+' della serie — negli heat', ccYrXHeatsZone:k=>'Zona heat: top '+k+' della serie', ccYrXHeatsOut:k=>'Fuori dal top '+k+' della serie — niente heat'});
Object.assign(I18N.pt, {ccYrXHeatsIn:k=>'Top '+k+' da série — nos heats', ccYrXHeatsZone:k=>'Zona dos heats: top '+k+' da série', ccYrXHeatsOut:k=>'Fora do top '+k+' da série — sem heats'});
// Шкафчик: подписи как в русском клиенте Fortnite; в остальных языках остаётся английский вид Epic.
Object.assign(I18N.ru, {ownTitle:'Свой турнир', ownLead:'Устрой кап сам: дата, режим, инвайт или квалы, игры и призовой фонд. Играешь в нём сам.',
  ownNew:'Устроить турнир', ownName:'Название', ownLogo:'Аватарка', ownLogoNone:'Без аватарки', ownLogoUp:'Своя картинка', ownLogoBig:'Картинка не подошла, попробуй другую', ownDate:'Дата', ownMode:'Режим', ownEntry:'Допуск', ownSize:'Лобби, игроков', ownGames:'Игр',
  ownPool:'Призовой фонд', ownInvite:'Инвайт', ownOpenQ:'Квалы и финал', ownOpenNote:'Два дня: в первый открытые квалы региона, на следующий день финал на 100 игроков. Ты как хозяин сразу в финале.',
  ownShape:'Как делить', ownAllPaid:(n,p)=>'Призовые получают все '+n+' составов финала, фонд $'+p, ownPerPlayer:'суммы на игрока',
  ownTeam:'Состав', ownTeamMine:'Моя команда', ownTeamAuto:'Сильнейшие свободные', ownTeamPick:'Выбрать самому',
  ownTeamFill:n=>'не хватает '+n+', доберём по рейтингу', ownTeamPicked:(a,b)=>'Выбрано '+a+' из '+b,
  ownDates:'Даты: квалы и финал', ownQualTag:'Квалы', ownFinalTag:'Финал', ownQualIn:n=>'Прошёл в финал (топ-'+n+')', ownQualOut:n=>'Не прошёл в финал (топ-'+n+')',
  ownNewsQualOut:n=>'Не прошёл квалы своего турнира '+n+'. Финал завтра без меня', ownShapeTop:'Победителю половина', ownShapePodium:'Подиум', ownShapeTop10:'Топ-10', ownShapeEven:'Ровнее', ownMin:n=>'Фонд от $'+n, ownMode_solo:'Соло', ownMode_duo:'Дуо', ownMode_trio:'Трио', ownMode_squad:'Сквад',
  ownNoDays:'Свободных дней в ближайшие два месяца нет', ownNoCash:n=>'Не хватает $'+n+' на фонд', ownCreate:n=>'Объявить · фонд $'+n, ownCancel:'Отменить',
  ownWhyMp:'Вдвоём свои турниры не устраиваются', ownNewsAnnounce:(n,d,p)=>'Объявил свой турнир '+n+': '+d+', фонд $'+p});
Object.assign(I18N.en, {ownTitle:'Your tournament', ownLead:'Run a cup yourself: date, mode, invite or qualifier, games and prize pool. You play in it.',
  ownNew:'Host a tournament', ownName:'Name', ownLogo:'Logo', ownLogoNone:'No logo', ownLogoUp:'Your own picture', ownLogoBig:'That picture did not work, try another', ownDate:'Date', ownMode:'Mode', ownEntry:'Entry', ownSize:'Lobby, players', ownGames:'Games',
  ownPool:'Prize pool', ownInvite:'Invite', ownOpenQ:'Qualifier + final', ownOpenNote:'Two days: an open regional qualifier, then a 100-player final the next day. As the host you go straight to the final.',
  ownShape:'Split', ownAllPaid:(n,p)=>'All '+n+' teams in the final are paid, $'+p+' pool', ownPerPlayer:'amounts per player',
  ownTeam:'Team', ownTeamMine:'My team', ownTeamAuto:'Best free players', ownTeamPick:'Pick myself',
  ownTeamFill:n=>n+' short, filled by rating', ownTeamPicked:(a,b)=>a+' of '+b+' picked',
  ownDates:'Dates: qualifier and final', ownQualTag:'Qualifier', ownFinalTag:'Final', ownQualIn:n=>'Through to the final (top '+n+')', ownQualOut:n=>'Out before the final (top '+n+')',
  ownNewsQualOut:n=>'Out in the qualifier of my own '+n+'. The final goes on tomorrow without me', ownShapeTop:'Half to the winner', ownShapePodium:'Podium', ownShapeTop10:'Top 10', ownShapeEven:'Flatter', ownMin:n=>'Pool from $'+n, ownMode_solo:'Solo', ownMode_duo:'Duos', ownMode_trio:'Trios', ownMode_squad:'Squads',
  ownNoDays:'No free days in the next two months', ownNoCash:n=>'$'+n+' short for the pool', ownCreate:n=>'Announce · $'+n+' pool', ownCancel:'Cancel',
  ownWhyMp:'Own tournaments are not hosted in a two-player career', ownNewsAnnounce:(n,d,p)=>'Announced my own tournament '+n+': '+d+', $'+p+' pool'});
Object.assign(I18N.ru, {ccLkSub:'Мой набор', ccLkChar:'Персонаж', ccLkEmotes:'Эмоции', ccFnSave:'Сохранить набор', ccSacFind:'Найти автора'});
Object.assign(I18N.ru, {ccYr21ToDay2:'Не прошли — завтра хиты второго дня'}); Object.assign(I18N.en, {ccYr21ToDay2:'Not through — the day-2 heats are tomorrow'});
Object.assign(I18N.fr, {ccYr21ToDay2:'Pas qualifiés — heats du jour 2 demain'}); Object.assign(I18N.it, {ccYr21ToDay2:'Non passati — domani gli heat del giorno 2'}); Object.assign(I18N.pt, {ccYr21ToDay2:'Não passaram — amanhã os heats do dia 2'});
Object.assign(I18N.ru, {ccYrSemiZone:k=>'В зоне полуфинала: топ-'+k+' серии', ccYrSemiOut:k=>'Вне топ-'+k+' серии — мимо полуфинала'});
Object.assign(I18N.en, {ccYrSemiZone:k=>'In the Semi-Finals zone: series top '+k, ccYrSemiOut:k=>'Outside the series top '+k+' — no Semi-Finals'});
Object.assign(I18N.fr, {ccYrSemiZone:k=>'Zone des demi-finales : top '+k+' de la série', ccYrSemiOut:k=>'Hors du top '+k+' de la série — pas de demi-finales'});
Object.assign(I18N.it, {ccYrSemiZone:k=>'Zona semifinali: top '+k+' della serie', ccYrSemiOut:k=>'Fuori dal top '+k+' della serie — niente semifinali'});
Object.assign(I18N.pt, {ccYrSemiZone:k=>'Zona das semifinais: top '+k+' da série', ccYrSemiOut:k=>'Fora do top '+k+' da série — sem semifinais'});
/* EWC 2024 — ESL Featuring Fortnite 4 на 4 (29.09). */
Object.assign(I18N.ru, {ewc24Title:'Esports World Cup 2024 · Эр-Рияд', ewc24Intro:'ESL Featuring Fortnite: 4 на 4 на аренах, серии карт — Capture the Flag, Hardpoint, Keeper. 16 команд: группы (до трёх побед), плей-офф (до четырёх).', ewc24You:'Твоя команда', ewc24Group:g=>'Группа '+g, ewc24Through:'в плей-офф', ewc24Playoffs:'Плей-офф', ewc24Qf:'Четвертьфиналы', ewc24Sf:'Полуфиналы', ewc24Final:'Финал', ccNewsEwc24Champ:n=>n+' — чемпионы Esports World Cup 2024 в Эр-Рияде 🏆',
  ewc24MeKd:(e,d)=>'ты '+e+'/'+d, ewc24Ticket:'путёвка на EWC', ewc24Stats:'Твоя четвёрка: убийства / смерти', ewc24Maps:n=>n+' карт', ewc24Standings:'Итоговая таблица',
  ewc24DhTitle:'DreamHack Dallas 2024 · 4 на 4', ewc24DhIntro:'ЛАН в Далласе, 37 команд: швейцарка на посев (до двух побед), плей-ин, 8 групп, 16 команд в двойное выбывание. Топ-6 едут на Esports World Cup в Эр-Рияд.', ewc24Swiss:'Швейцарка · посев', ewc24SwissSeed:(s,w)=>'Посев #'+s+' · побед: '+w+' из 3', ewc24PlayIn:'Плей-ин', ewc24DhGroup:g=>'Группа '+g+' · Даллас', ewc24DhPlayoffs:'Плей-офф · двойное выбывание',
  ewc24Tag:t=>t==='gf' ? 'Гранд-финал' : t==='lb' ? 'Нижняя сетка' : 'Верхняя сетка · раунд '+String(t).slice(2),
  ewc24QTitle:r=>'Отбор EWC 2024 · '+r, ewc24QIntro:n=>'Онлайн-отбор своего региона: группы (до трёх побед), двойное выбывание. Путёвок в Эр-Рияд: '+n+'. Призовых нет.', ewc24QPlayoffs:'Плей-офф отбора',
  ewc24ViaDallas:p=>'Путёвка: DreamHack Dallas 2024, '+p+'-е место', ewc24ViaQual:r=>'Путёвка: онлайн-отбор '+r, ewc24MvpTour:(p,t)=>'MVP турнира: '+p+' ('+t+')',
  ccNewsEwc24Ticket:e=>e+': путёвка на Esports World Cup 2024 в Эр-Рияде ✈️', ccNewsEwc24Mvp:c=>'MVP Esports World Cup 2024 — ты! +$'+c});
Object.assign(I18N.en, {ewc24Title:'Esports World Cup 2024 · Riyadh', ewc24Intro:'ESL Featuring Fortnite: 4v4 arenas, series of maps — Capture the Flag, Hardpoint, Keeper. 16 teams: groups (first to three), playoffs (first to four).', ewc24You:'Your team', ewc24Group:g=>'Group '+g, ewc24Through:'to playoffs', ewc24Playoffs:'Playoffs', ewc24Qf:'Quarterfinals', ewc24Sf:'Semifinals', ewc24Final:'Grand Final', ccNewsEwc24Champ:n=>n+' win the Esports World Cup 2024 in Riyadh 🏆',
  ewc24MeKd:(e,d)=>'you '+e+'/'+d, ewc24Ticket:'EWC ticket', ewc24Stats:'Your four: kills / deaths', ewc24Maps:n=>n+' maps', ewc24Standings:'Final standings',
  ewc24DhTitle:'DreamHack Dallas 2024 · 4v4', ewc24DhIntro:'LAN in Dallas, 37 teams: Swiss seeding (first to two), play-in, 8 groups, 16 teams in double elimination. Top 6 go to the Esports World Cup in Riyadh.', ewc24Swiss:'Swiss · seeding', ewc24SwissSeed:(s,w)=>'Seed #'+s+' · wins: '+w+' of 3', ewc24PlayIn:'Play-in', ewc24DhGroup:g=>'Group '+g+' · Dallas', ewc24DhPlayoffs:'Playoffs · double elimination',
  ewc24Tag:t=>t==='gf' ? 'Grand Final' : t==='lb' ? 'Lower bracket' : 'Upper bracket · round '+String(t).slice(2),
  ewc24QTitle:r=>'EWC 2024 Qualifier · '+r, ewc24QIntro:n=>'Online qualifier of your region: groups (first to three), double elimination. Tickets to Riyadh: '+n+'. No prize money.', ewc24QPlayoffs:'Qualifier playoffs',
  ewc24ViaDallas:p=>'Ticket: DreamHack Dallas 2024, place '+p, ewc24ViaQual:r=>'Ticket: online qualifier '+r, ewc24MvpTour:(p,t)=>'Tournament MVP: '+p+' ('+t+')',
  ccNewsEwc24Ticket:e=>e+': ticket to the Esports World Cup 2024 in Riyadh ✈️', ccNewsEwc24Mvp:c=>'Esports World Cup 2024 MVP — you! +$'+c});
Object.assign(I18N.fr, {ewc24Title:'Esports World Cup 2024 · Riyad', ewc24Intro:'ESL Featuring Fortnite : arènes 4 contre 4, séries de cartes — Capture the Flag, Hardpoint, Keeper. 16 équipes : groupes (trois victoires), phase finale (quatre victoires).', ewc24You:'Ton équipe', ewc24Group:g=>'Groupe '+g, ewc24Through:'en phase finale', ewc24Playoffs:'Phase finale', ewc24Qf:'Quarts de finale', ewc24Sf:'Demi-finales', ewc24Final:'Grande finale', ccNewsEwc24Champ:n=>n+' remportent l’Esports World Cup 2024 à Riyad 🏆',
  ewc24MeKd:(e,d)=>'toi '+e+'/'+d, ewc24Ticket:'billet EWC', ewc24Stats:'Ton quatuor : éliminations / morts', ewc24Maps:n=>n+' cartes', ewc24Standings:'Classement final',
  ewc24DhTitle:'DreamHack Dallas 2024 · 4 contre 4', ewc24DhIntro:'LAN à Dallas, 37 équipes : ronde suisse pour le seeding (deux victoires), play-in, 8 groupes, 16 équipes en double élimination. Le top 6 part à l’Esports World Cup à Riyad.', ewc24Swiss:'Ronde suisse · seeding', ewc24SwissSeed:(s,w)=>'Seed n°'+s+' · victoires : '+w+' sur 3', ewc24PlayIn:'Play-in', ewc24DhGroup:g=>'Groupe '+g+' · Dallas', ewc24DhPlayoffs:'Phase finale · double élimination',
  ewc24Tag:t=>t==='gf' ? 'Grande finale' : t==='lb' ? 'Tableau inférieur' : 'Tableau supérieur · tour '+String(t).slice(2),
  ewc24QTitle:r=>'Qualifications EWC 2024 · '+r, ewc24QIntro:n=>'Qualifications en ligne de ta région : groupes (trois victoires), double élimination. Billets pour Riyad : '+n+'. Pas de cashprize.', ewc24QPlayoffs:'Phase finale des qualifications',
  ewc24ViaDallas:p=>'Billet : DreamHack Dallas 2024, '+p+'e place', ewc24ViaQual:r=>'Billet : qualifications en ligne '+r, ewc24MvpTour:(p,t)=>'MVP du tournoi : '+p+' ('+t+')',
  ccNewsEwc24Ticket:e=>e+' : billet pour l’Esports World Cup 2024 à Riyad ✈️', ccNewsEwc24Mvp:c=>'MVP de l’Esports World Cup 2024 — toi ! +$'+c});
Object.assign(I18N.it, {ewc24Title:'Esports World Cup 2024 · Riad', ewc24Intro:'ESL Featuring Fortnite: arene 4 contro 4, serie di mappe — Capture the Flag, Hardpoint, Keeper. 16 squadre: gironi (al meglio di tre vittorie), playoff (quattro vittorie).', ewc24You:'La tua squadra', ewc24Group:g=>'Girone '+g, ewc24Through:'ai playoff', ewc24Playoffs:'Playoff', ewc24Qf:'Quarti di finale', ewc24Sf:'Semifinali', ewc24Final:'Finale', ccNewsEwc24Champ:n=>n+' vincono l’Esports World Cup 2024 a Riad 🏆',
  ewc24MeKd:(e,d)=>'tu '+e+'/'+d, ewc24Ticket:'pass EWC', ewc24Stats:'Il tuo quartetto: eliminazioni / morti', ewc24Maps:n=>n+' mappe', ewc24Standings:'Classifica finale',
  ewc24DhTitle:'DreamHack Dallas 2024 · 4 contro 4', ewc24DhIntro:'LAN a Dallas, 37 squadre: sistema svizzero per il seeding (due vittorie), play-in, 8 gironi, 16 squadre in doppia eliminazione. Le prime 6 vanno all’Esports World Cup a Riad.', ewc24Swiss:'Svizzero · seeding', ewc24SwissSeed:(s,w)=>'Seed #'+s+' · vittorie: '+w+' su 3', ewc24PlayIn:'Play-in', ewc24DhGroup:g=>'Girone '+g+' · Dallas', ewc24DhPlayoffs:'Playoff · doppia eliminazione',
  ewc24Tag:t=>t==='gf' ? 'Finale' : t==='lb' ? 'Tabellone inferiore' : 'Tabellone superiore · turno '+String(t).slice(2),
  ewc24QTitle:r=>'Qualificazioni EWC 2024 · '+r, ewc24QIntro:n=>'Qualificazioni online della tua regione: gironi (tre vittorie), doppia eliminazione. Pass per Riad: '+n+'. Nessun montepremi.', ewc24QPlayoffs:'Playoff delle qualificazioni',
  ewc24ViaDallas:p=>'Pass: DreamHack Dallas 2024, '+p+'° posto', ewc24ViaQual:r=>'Pass: qualificazioni online '+r, ewc24MvpTour:(p,t)=>'MVP del torneo: '+p+' ('+t+')',
  ccNewsEwc24Ticket:e=>e+': pass per l’Esports World Cup 2024 a Riad ✈️', ccNewsEwc24Mvp:c=>'MVP dell’Esports World Cup 2024 — tu! +$'+c});
Object.assign(I18N.pt, {ewc24Title:'Esports World Cup 2024 · Riad', ewc24Intro:'ESL Featuring Fortnite: arenas 4 contra 4, séries de mapas — Capture the Flag, Hardpoint, Keeper. 16 equipes: grupos (três vitórias), playoffs (quatro vitórias).', ewc24You:'Tua equipe', ewc24Group:g=>'Grupo '+g, ewc24Through:'aos playoffs', ewc24Playoffs:'Playoffs', ewc24Qf:'Quartas de final', ewc24Sf:'Semifinais', ewc24Final:'Grande final', ccNewsEwc24Champ:n=>n+' vencem a Esports World Cup 2024 em Riad 🏆',
  ewc24MeKd:(e,d)=>'você '+e+'/'+d, ewc24Ticket:'vaga na EWC', ewc24Stats:'Teu quarteto: abates / mortes', ewc24Maps:n=>n+' mapas', ewc24Standings:'Classificação final',
  ewc24DhTitle:'DreamHack Dallas 2024 · 4 contra 4', ewc24DhIntro:'LAN em Dallas, 37 equipes: suíço para o seeding (duas vitórias), play-in, 8 grupos, 16 equipes em dupla eliminação. O top 6 vai para a Esports World Cup em Riad.', ewc24Swiss:'Suíço · seeding', ewc24SwissSeed:(s,w)=>'Seed #'+s+' · vitórias: '+w+' de 3', ewc24PlayIn:'Play-in', ewc24DhGroup:g=>'Grupo '+g+' · Dallas', ewc24DhPlayoffs:'Playoffs · dupla eliminação',
  ewc24Tag:t=>t==='gf' ? 'Grande final' : t==='lb' ? 'Chave inferior' : 'Chave superior · rodada '+String(t).slice(2),
  ewc24QTitle:r=>'Qualificatória EWC 2024 · '+r, ewc24QIntro:n=>'Qualificatória online da tua região: grupos (três vitórias), dupla eliminação. Vagas para Riad: '+n+'. Sem premiação.', ewc24QPlayoffs:'Playoffs da qualificatória',
  ewc24ViaDallas:p=>'Vaga: DreamHack Dallas 2024, '+p+'º lugar', ewc24ViaQual:r=>'Vaga: qualificatória online '+r, ewc24MvpTour:(p,t)=>'MVP do torneio: '+p+' ('+t+')',
  ccNewsEwc24Ticket:e=>e+': vaga na Esports World Cup 2024 em Riad ✈️', ccNewsEwc24Mvp:c=>'MVP da Esports World Cup 2024 — você! +$'+c});
Object.assign(I18N.ru, {ewc24T:{rush:['Раш флага','вчетвером за чужим флагом'], split:['Сплит 2–2','двое на флаг, двое держат базу'], def:['Защита и контратака','встречать раш у своей базы'], hold:['Держать точку','стоять на холме до конца'], hunt:['Охота на подходах','ловить соперника на ротации'], rot:['Ротация заранее','первыми занять следующую точку'], press:['Давить на носителя','всей командой за ключом'], hide:['Прятать носителя','трое прикрывают ключ'], spread:['Рассыпаться','ждать спавна ключа по всей карте']},
  ewc24AskH:(i,m,p)=>'Карта '+i+' · '+m+' · '+p, ewc24AskSub:(o,a,b)=>'Против '+o+' · серия '+a+':'+b+'. Тактика на карту:', ewc24SerLine:(a,b,bo)=>'серия '+a+':'+b+' · до '+Math.ceil(bo/2), ewc24Auto:'Решай сам до конца турнира', ewc24MidH:'Проигрываете — подстроиться?', ewc24Read:(o,t)=>o+' играет: '+t,
  ewc24H1:'1-й тайм', ewc24H2:'2-й тайм', ewc24OT:'Овертайм', ewc24Rot:n=>'Точка '+n+'/5', ewc24Rnd:n=>'Раунд '+n, ewc24Scheme:'схема режима', ewc24You2:'Ты', ewc24Cap:n=>n+' приносит флаг', ewc24Kill:(a,b)=>a+' ✕ '+b, ewc24KeyTake:n=>n+' взял ключ', ewc24HillTake:(t,n)=>'Точка '+n+' — за '+t});
Object.assign(I18N.en, {ewc24T:{rush:['Flag rush','all four go for their flag'], split:['Split 2–2','two on the flag, two hold base'], def:['Defend and counter','meet the rush at your base'], hold:['Hold the point','stay on the hill to the end'], hunt:['Hunt the approaches','catch them rotating'], rot:['Rotate early','take the next point first'], press:['Pressure the carrier','whole team on the key'], hide:['Hide the carrier','three guard the key'], spread:['Spread out','wait for the key spawn map-wide']},
  ewc24AskH:(i,m,p)=>'Map '+i+' · '+m+' · '+p, ewc24AskSub:(o,a,b)=>'Versus '+o+' · series '+a+':'+b+'. Tactic for this map:', ewc24SerLine:(a,b,bo)=>'series '+a+':'+b+' · first to '+Math.ceil(bo/2), ewc24Auto:'Decide for me until the end', ewc24MidH:'Behind — adjust?', ewc24Read:(o,t)=>o+' are playing: '+t,
  ewc24H1:'1st half', ewc24H2:'2nd half', ewc24OT:'Overtime', ewc24Rot:n=>'Point '+n+'/5', ewc24Rnd:n=>'Round '+n, ewc24Scheme:'mode diagram', ewc24You2:'You', ewc24Cap:n=>n+' captures the flag', ewc24Kill:(a,b)=>a+' ✕ '+b, ewc24KeyTake:n=>n+' takes the key', ewc24HillTake:(t,n)=>'Point '+n+' — '+t});
Object.assign(I18N.fr, {ewc24T:{rush:['Rush du drapeau','à quatre sur leur drapeau'], split:['Split 2–2','deux au drapeau, deux en défense'], def:['Défense et contre','accueillir le rush à la base'], hold:['Tenir le point','rester sur la zone jusqu’au bout'], hunt:['Chasser les accès','les prendre en rotation'], rot:['Rotation anticipée','prendre le point suivant en premier'], press:['Presser le porteur','toute l’équipe sur la clé'], hide:['Cacher le porteur','trois protègent la clé'], spread:['S’écarter','attendre l’apparition de la clé partout']},
  ewc24AskH:(i,m,p)=>'Carte '+i+' · '+m+' · '+p, ewc24AskSub:(o,a,b)=>'Contre '+o+' · série '+a+':'+b+'. Tactique pour la carte :', ewc24SerLine:(a,b,bo)=>'série '+a+':'+b+' · en '+Math.ceil(bo/2), ewc24Auto:'Décide pour moi jusqu’à la fin', ewc24MidH:'Mené — s’adapter ?', ewc24Read:(o,t)=>o+' jouent : '+t,
  ewc24H1:'1re mi-temps', ewc24H2:'2e mi-temps', ewc24OT:'Prolongation', ewc24Rot:n=>'Point '+n+'/5', ewc24Rnd:n=>'Manche '+n, ewc24Scheme:'schéma du mode', ewc24You2:'Toi', ewc24Cap:n=>n+' ramène le drapeau', ewc24Kill:(a,b)=>a+' ✕ '+b, ewc24KeyTake:n=>n+' prend la clé', ewc24HillTake:(t,n)=>'Point '+n+' — '+t});
Object.assign(I18N.it, {ewc24T:{rush:['Rush alla bandiera','tutti e quattro sulla loro bandiera'], split:['Split 2–2','due sulla bandiera, due in difesa'], def:['Difesa e contropiede','aspettare il rush alla base'], hold:['Tenere il punto','restare sulla zona fino alla fine'], hunt:['Caccia agli accessi','prenderli in rotazione'], rot:['Rotazione anticipata','prendere per primi il punto dopo'], press:['Pressare il portatore','tutta la squadra sulla chiave'], hide:['Nascondere il portatore','tre proteggono la chiave'], spread:['Sparpagliarsi','aspettare la chiave su tutta la mappa']},
  ewc24AskH:(i,m,p)=>'Mappa '+i+' · '+m+' · '+p, ewc24AskSub:(o,a,b)=>'Contro '+o+' · serie '+a+':'+b+'. Tattica per la mappa:', ewc24SerLine:(a,b,bo)=>'serie '+a+':'+b+' · al meglio di '+bo, ewc24Auto:'Decidi tu fino alla fine', ewc24MidH:'Sotto — adattarsi?', ewc24Read:(o,t)=>o+' giocano: '+t,
  ewc24H1:'1° tempo', ewc24H2:'2° tempo', ewc24OT:'Supplementari', ewc24Rot:n=>'Punto '+n+'/5', ewc24Rnd:n=>'Round '+n, ewc24Scheme:'schema della modalità', ewc24You2:'Tu', ewc24Cap:n=>n+' porta la bandiera', ewc24Kill:(a,b)=>a+' ✕ '+b, ewc24KeyTake:n=>n+' prende la chiave', ewc24HillTake:(t,n)=>'Punto '+n+' — '+t});
Object.assign(I18N.pt, {ewc24T:{rush:['Rush na bandeira','os quatro na bandeira deles'], split:['Split 2–2','dois na bandeira, dois na base'], def:['Defesa e contra-ataque','segurar o rush na base'], hold:['Segurar o ponto','ficar no ponto até o fim'], hunt:['Caçar nas entradas','pegá-los na rotação'], rot:['Rotação antecipada','pegar o próximo ponto primeiro'], press:['Pressionar o portador','o time todo na chave'], hide:['Esconder o portador','três protegem a chave'], spread:['Espalhar','esperar a chave pelo mapa todo']},
  ewc24AskH:(i,m,p)=>'Mapa '+i+' · '+m+' · '+p, ewc24AskSub:(o,a,b)=>'Contra '+o+' · série '+a+':'+b+'. Tática para o mapa:', ewc24SerLine:(a,b,bo)=>'série '+a+':'+b+' · melhor de '+bo, ewc24Auto:'Decida por mim até o fim', ewc24MidH:'Atrás — ajustar?', ewc24Read:(o,t)=>o+' jogam: '+t,
  ewc24H1:'1º tempo', ewc24H2:'2º tempo', ewc24OT:'Prorrogação', ewc24Rot:n=>'Ponto '+n+'/5', ewc24Rnd:n=>'Round '+n, ewc24Scheme:'esquema do modo', ewc24You2:'Você', ewc24Cap:n=>n+' captura a bandeira', ewc24Kill:(a,b)=>a+' ✕ '+b, ewc24KeyTake:n=>n+' pega a chave', ewc24HillTake:(t,n)=>'Ponto '+n+' — '+t});
Object.assign(I18N.ru, {evPickH:(e,n)=>'Состав на '+e+': добери '+n, evPickSub:'Кого берёшь на этот кап? Выбранные останутся в составе этого формата.', evPickAuto:'Подобрать за меня', evPickGo:(k,n)=>'Играть · '+k+'/'+n, evPickHave:'в составе'});
Object.assign(I18N.en, {evPickH:(e,n)=>'Roster for '+e+': add '+n, evPickSub:'Who do you bring to this cup? They stay in your roster for this format.', evPickAuto:'Pick for me', evPickGo:(k,n)=>'Play · '+k+'/'+n, evPickHave:'in roster'});
Object.assign(I18N.fr, {evPickH:(e,n)=>'Roster pour '+e+' : ajoute '+n, evPickSub:'Qui emmènes-tu sur cette cup ? Ils restent dans ton roster de ce format.', evPickAuto:'Choisis pour moi', evPickGo:(k,n)=>'Jouer · '+k+'/'+n, evPickHave:'dans le roster'});
Object.assign(I18N.it, {evPickH:(e,n)=>'Roster per '+e+': aggiungi '+n, evPickSub:'Chi porti a questa cup? Restano nel tuo roster di questo formato.', evPickAuto:'Scegli tu per me', evPickGo:(k,n)=>'Gioca · '+k+'/'+n, evPickHave:'nel roster'});
Object.assign(I18N.pt, {evPickH:(e,n)=>'Line-up para '+e+': adicione '+n, evPickSub:'Quem você leva para esta copa? Eles ficam na sua line-up deste formato.', evPickAuto:'Escolha por mim', evPickGo:(k,n)=>'Jogar · '+k+'/'+n, evPickHave:'na line-up'});
Object.assign(I18N.ru, {lfRosterAsk:'Позвать'}); Object.assign(I18N.en, {lfRosterAsk:'Invite'}); Object.assign(I18N.fr, {lfRosterAsk:'Inviter'}); Object.assign(I18N.it, {lfRosterAsk:'Invita'}); Object.assign(I18N.pt, {lfRosterAsk:'Chamar'});
Object.assign(I18N.ru, {ccMajSeatGc25:n=>'Топ-'+n+' едут на Global Championship в Лион'});
Object.assign(I18N.en, {ccMajSeatGc25:n=>'Top '+n+' go to the Global Championship in Lyon'});
Object.assign(I18N.fr, {ccMajSeatGc25:n=>'Le top '+n+' part au Global Championship de Lyon'});
Object.assign(I18N.it, {ccMajSeatGc25:n=>'I primi '+n+' vanno al Global Championship di Lione'});
Object.assign(I18N.pt, {ccMajSeatGc25:n=>'O top '+n+' vai para o Global Championship em Lyon'});
Object.assign(I18N.ru, {ccYrXWildIn:'Wildcard: один матч в день Гранд-финала, победитель проходит', ccYrXWildLabel:n=>n+' · Wildcard'});
Object.assign(I18N.en, {ccYrXWildIn:'Wildcard: one match on Grand Finals day, the winner goes through', ccYrXWildLabel:n=>n+' · Wildcard'});
Object.assign(I18N.fr, {ccYrXWildIn:'Wildcard : un match le jour de la Grande finale, le vainqueur passe', ccYrXWildLabel:n=>n+' · Wildcard'});
Object.assign(I18N.it, {ccYrXWildIn:'Wildcard: una partita il giorno della Grand Final, passa il vincitore', ccYrXWildLabel:n=>n+' · Wildcard'});
Object.assign(I18N.pt, {ccYrXWildIn:'Wildcard: uma partida no dia da Grande Final, o vencedor avança', ccYrXWildLabel:n=>n+' · Wildcard'});
Object.assign(I18N.ru, {evPickWho:e=>'С кем идёшь на '+e+'?', evPickSub2:n=>n===1 ? 'Нажми на того, с кем играешь, — или позови другого в личке.' : 'Нажми на тех, с кем играешь, — или позови других в личке.', evPickPlay:w=>'Играть: '+w});
Object.assign(I18N.en, {evPickWho:e=>'Who do you take to '+e+'?', evPickSub2:n=>n===1 ? 'Tap who you play with — or ask someone else in DMs.' : 'Tap who you play with — or ask others in DMs.', evPickPlay:w=>'Play: '+w});
Object.assign(I18N.fr, {evPickWho:e=>'Avec qui vas-tu à '+e+' ?', evPickSub2:n=>'Touche ton coéquipier — ou écris à quelqu’un d’autre en MP.', evPickPlay:w=>'Jouer : '+w});
Object.assign(I18N.it, {evPickWho:e=>'Con chi vai a '+e+'?', evPickSub2:n=>'Tocca con chi giochi — o scrivi a qualcun altro in DM.', evPickPlay:w=>'Gioca: '+w});
Object.assign(I18N.pt, {evPickWho:e=>'Com quem você vai para '+e+'?', evPickSub2:n=>'Toque em quem joga com você — ou chame outro por DM.', evPickPlay:w=>'Jogar: '+w});
Object.assign(I18N.ru, {evPickSub:'Позови недостающих в личке — или на этот вечер возьмутся стэнд-ины (в состав они не войдут).', evPickAuto:'Стэнд-ины на вечер', evPickFind:'Написать игрокам', rsFindTitle:n=>'Кого позвать в '+({2:'дуо',3:'трио',4:'сквад'})[n]+'-состав'});
Object.assign(I18N.en, {evPickSub:'Ask the missing players in DMs — or stand-ins play this night (they don’t join the roster).', evPickAuto:'Stand-ins for tonight', evPickFind:'Message players', rsFindTitle:n=>'Who to ask into the '+({2:'duo',3:'trio',4:'squad'})[n]+' roster'});
Object.assign(I18N.fr, {evPickSub:'Invite les joueurs manquants en MP — ou des remplaçants jouent ce soir (ils n’entrent pas dans le roster).', evPickAuto:'Remplaçants ce soir', evPickFind:'Écrire aux joueurs', rsFindTitle:n=>'Qui inviter dans le roster '+({2:'duo',3:'trio',4:'squad'})[n]});
Object.assign(I18N.it, {evPickSub:'Invita i giocatori mancanti in DM — oppure stasera giocano dei sostituti (non entrano nel roster).', evPickAuto:'Sostituti per stasera', evPickFind:'Scrivi ai giocatori', rsFindTitle:n=>'Chi invitare nel roster '+({2:'duo',3:'trio',4:'squad'})[n]});
Object.assign(I18N.pt, {evPickSub:'Chame os que faltam por DM — ou reservas jogam esta noite (não entram na line-up).', evPickAuto:'Reservas nesta noite', evPickFind:'Mandar mensagem', rsFindTitle:n=>'Quem chamar para a line-up de '+({2:'duo',3:'trio',4:'squad'})[n]});
Object.assign(I18N.ru, {rsSoonH:(k,d)=>(k===0 ? 'Сегодня' : k===1 ? 'Завтра' : 'Через '+k+' дн.')+' · '+d, rsFmt:n=>({2:'дуо',3:'трио',4:'сквад'})[n]||'', rsHave:(who,n,f)=>'Состав: '+who+' · '+n+' из '+f, rsGo:n=>'Собрать состав · добрать '+n});
Object.assign(I18N.en, {rsSoonH:(k,d)=>(k===0 ? 'Today' : k===1 ? 'Tomorrow' : 'In '+k+' days')+' · '+d, rsFmt:n=>({2:'duos',3:'trios',4:'squads'})[n]||'', rsHave:(who,n,f)=>'Roster: '+who+' · '+n+' of '+f, rsGo:n=>'Build the roster · add '+n});
Object.assign(I18N.fr, {rsSoonH:(k,d)=>(k===0 ? 'Aujourd’hui' : k===1 ? 'Demain' : 'Dans '+k+' jours')+' · '+d, rsFmt:n=>({2:'duo',3:'trio',4:'squad'})[n]||'', rsHave:(who,n,f)=>'Roster : '+who+' · '+n+' sur '+f, rsGo:n=>'Compléter le roster · ajouter '+n});
Object.assign(I18N.it, {rsSoonH:(k,d)=>(k===0 ? 'Oggi' : k===1 ? 'Domani' : 'Tra '+k+' giorni')+' · '+d, rsFmt:n=>({2:'duo',3:'trio',4:'squad'})[n]||'', rsHave:(who,n,f)=>'Roster: '+who+' · '+n+' su '+f, rsGo:n=>'Completa il roster · aggiungi '+n});
Object.assign(I18N.pt, {rsSoonH:(k,d)=>(k===0 ? 'Hoje' : k===1 ? 'Amanhã' : 'Em '+k+' dias')+' · '+d, rsFmt:n=>({2:'duo',3:'trio',4:'squad'})[n]||'', rsHave:(who,n,f)=>'Line-up: '+who+' · '+n+' de '+f, rsGo:n=>'Montar a line-up · adicionar '+n});
Object.assign(I18N.ru, {mapPickH:'Карта года', mapPickCycle:'По кругу', ccFmtGo:'Начать год'}); Object.assign(I18N.en, {mapPickH:'Map this year', mapPickCycle:'Rotation', ccFmtGo:'Start the year'});
Object.assign(I18N.fr, {mapPickH:'Carte de l’année', mapPickCycle:'Rotation', ccFmtGo:'Commencer l’année'}); Object.assign(I18N.it, {mapPickH:'Mappa dell’anno', mapPickCycle:'A rotazione', ccFmtGo:'Inizia l’anno'}); Object.assign(I18N.pt, {mapPickH:'Mapa do ano', mapPickCycle:'Rotação', ccFmtGo:'Começar o ano'});
/* Драфт прошлых лет: этапы (29.09). */
Object.assign(I18N.ru, {dpPastDesc2:'Карточки — по настоящим результатам игроков на этом турнире. Формат, очки, призы и остров — того же сезона.'});
Object.assign(I18N.en, {dpPastDesc2:'Cards built from the players’ real results at this event. Format, scoring, prize money and island of that season.'});
Object.assign(I18N.fr, {dpPastDesc2:'Cartes d’après les vrais résultats. Format, points, gains et île de la même saison.'});
Object.assign(I18N.it, {dpPastDesc2:'Carte dai veri risultati. Formato, punti, premi e isola della stessa stagione.'});
Object.assign(I18N.pt, {dpPastDesc2:'Cartas pelos resultados reais. Formato, pontos, prêmios e ilha da mesma temporada.'});
Object.assign(I18N.ru, {pdQual:(i,k)=>'Квалификатор · раунд '+i+' из '+k, pdWeekFinal:'Финал недели', pdHeat:h=>'Хит '+h, pdSemis:'Полуфинал', pdFinal:'Гранд-финал'});
Object.assign(I18N.en, {pdQual:(i,k)=>'Qualifier · round '+i+' of '+k, pdWeekFinal:'Week Finals', pdHeat:h=>'Heat '+h, pdSemis:'Semi-Finals', pdFinal:'Grand Finals'});
Object.assign(I18N.fr, {pdQual:(i,k)=>'Qualificatif · manche '+i+' sur '+k, pdWeekFinal:'Finale de la semaine', pdHeat:h=>'Heat '+h, pdSemis:'Demi-finales', pdFinal:'Grande finale'});
Object.assign(I18N.it, {pdQual:(i,k)=>'Qualificazione · round '+i+' di '+k, pdWeekFinal:'Finale della settimana', pdHeat:h=>'Heat '+h, pdSemis:'Semifinali', pdFinal:'Gran finale'});
Object.assign(I18N.pt, {pdQual:(i,k)=>'Classificatória · rodada '+i+' de '+k, pdWeekFinal:'Final da semana', pdHeat:h=>'Heat '+h, pdSemis:'Semifinais', pdFinal:'Grande final'});
/* Магазин и главная 15.10 — французский, итальянский, португальский (немецкий и испанский — в i18n-de.js / i18n-es.js). */
Object.assign(I18N.fr, {ccMerchTitle:'Ton propre merch', ccMerchHint:'Le lancement se paie une fois ; ensuite, chaque 1er du mois, une part de ton public achète et de nouveaux abonnés arrivent. Rentable sur des années.',
ccMerch_capsule:'Collection capsule', ccMerch_line:'Ligne de vêtements', ccMerch_brand:'Ta propre marque',
ccMerchRate:(p,c)=>p+'% des abonnés en $, jusqu’à $'+c+'/mois', ccMerchAsk:(n,c)=>'Lancer « '+n+' » pour $'+c+' ?',
ccMerchMonth:'Par mois en ce moment', ccMerchEarned:'Gagné avec le merch', ccNewsMerch:n=>'Merch lancé : '+n,
ccCharityTitle:'Caritatif', ccCharityHint:'L’argent va à l’association ; toi, tu gagnes le respect de la scène et des abonnés. Une fois par mois maximum.',
ccCharityGive:n=>'Donner '+n, ccCharityAsk:n=>'Donner $'+n+' à une association ?', ccCharityYes:n=>'Donner · $'+n, ccCharityTotal:n=>'Dons ('+n+')',
ccNewsCharity:(n,f)=>'$'+n+' donnés à une association',
ccLuxTitle:'Luxe', ccLuxHint:'N’apporte rien à ton jeu — juste une étagère sur ton profil et la ligne « Dépensé » dans Joueurs du site.',
ccLuxNote:'va sur l’étagère de ton profil', ccLux_watch:'Montre', ccLux_hyper:'Hypercar', ccLux_yacht:'Yacht', ccLux_jet:'Jet privé',
ccLuxAsk:(n,c)=>'Acheter « '+n+' » pour $'+c+' ? Aucun bonus de niveau — juste une étagère sur ton profil.', ccNewsLux:n=>'Nouvel achat : '+n,
ccCollTitle:'Collection', ccCollSpent:'Dépensé en gros achats', lbByEarn:'Par gains', lbBySpent:'Par dépenses', lbSpentCol:'Dépensé',
ccSecGear:'Setup', ccSecHome:'Logement', ccSecFame:'Notoriété', ccSecLux:'Luxe', ccSecClub:'Club',
ccSecHint_gear:'Le matériel fait monter tes compétences et l’entraînement, les chaises et les pièces ajoutent de l’énergie. Un nouveau palier remplace l’ancien.',
ccSecHint_home:'Un logement à toi supprime le loyer et ajoute de l’énergie. Le déménagement dans un autre pays ou une autre région est ici aussi.',
ccSecHint_fame:'Ta propre cup, le merch et le caritatif apportent des abonnés. Le merch rapporte aussi chaque mois.',
ccSecHint_lux:'La voiture garde ta confiance pendant les mauvaises semaines. Le reste n’ajoute aucun niveau — juste une étagère sur ton profil.',
ccSecHint_club:'Ta propre organisation : roster, caisse et sponsors. Cher, mais le club est à toi.',
ccShopRooms:'Pièces et déplacements', ccShopNow:'Actuel', ccShopMaxed:'Au max',
ccSlot_mouse:'Souris', ccSlot_keyboard:'Clavier', ccSlot_headset:'Casque', ccSlot_monitor:'Écran', ccSlot_pc:'PC', ccSlot_ps:'PlayStation', ccSlot_xbox:'Xbox', ccSlot_android:'Android', ccSlot_ios:'iPhone et iPad', ccMobOpen:'Classement', ccShopConFx:n=>'+'+n+' puissance sur console', ccSlot_chair:'Chaise', ccSlot_stream:'Stream', ccSlot_car:'Voiture',
ccShopBest:'Meilleur achat maintenant', ccShopShort:n=>'Il manque '+n, ccShopBought:n=>'Acheté : '+n,
ccDealsTitle:'Offres du jour', ccDealsHint:'Trois articles en promo. Demain, trois autres.',
hmContinue:'Continuer', hmContinueSub:'Tes sauvegardes, au jour où tu t’es arrêté.', hmPlayOn:'Jouer', hmSlotCareer:'Carrière', hmSlotMgr:'Manager',
hmSlotLine:(s,d,e)=>'Saison '+s+' · division '+d+' · '+e, hmMgrLine:(s,c)=>'Saison '+s+' · caisse '+c,
hmFriendsTitle:'Avec un ami', hmFriendsSub:'Trois façons de ne pas jouer seul.',
hmFriendDuo:'Une carrière à deux : vous êtes dans la même équipe et les jours avancent ensemble.', hmFriendCode:'Ton ami a déjà créé une équipe ou une course ? Entre son code.',
hmFriendRace:'Chacun mène sa propre carrière, et un lobby commun montre qui est devant.',
hmSceneTitle:'La scène en ce moment', hmSceneSub:'Le vrai calendrier FNCS 2026.', hmSceneLive:'en cours', hmSceneTomorrow:'demain',
hmSceneIn:n=>'dans '+n+' jour'+(n===1 ? '' : 's'), hmSceneDone:'La saison FNCS 2026 est terminée.',
hmBoardSub:'Les carrières des joueurs du site, par gains.', hmBoardMore:n=>'Afficher '+n, hmBoardLess:'Réduire', hmHistSub:'Drafts passés, records et récompenses.',
ccNewsOwnCup:(who,n,w,f)=>'Cup '+who+', $'+n+' de cashprize : victoire de '+w});
Object.assign(I18N.it, {ccMerchTitle:'Il tuo merch', ccMerchHint:'Il lancio si paga una volta; poi, il primo di ogni mese, una parte del tuo pubblico compra e arrivano nuovi follower. Si ripaga in anni.',
ccMerch_capsule:'Capsule', ccMerch_line:'Linea di abbigliamento', ccMerch_brand:'Il tuo brand',
ccMerchRate:(p,c)=>p+'% dei follower in $, fino a $'+c+'/mese', ccMerchAsk:(n,c)=>'Lanciare “'+n+'” per $'+c+'?',
ccMerchMonth:'Al mese adesso', ccMerchEarned:'Guadagnato col merch', ccNewsMerch:n=>'Merch lanciato: '+n,
ccCharityTitle:'Beneficenza', ccCharityHint:'I soldi vanno in beneficenza; tu ottieni il rispetto della scena e follower. Al massimo una volta al mese.',
ccCharityGive:n=>'Dona '+n, ccCharityAsk:n=>'Donare $'+n+' in beneficenza?', ccCharityYes:n=>'Dona · $'+n, ccCharityTotal:n=>'Donazioni ('+n+')',
ccNewsCharity:(n,f)=>'Donati $'+n+' in beneficenza',
ccLuxTitle:'Lusso', ccLuxHint:'Non aggiunge nulla al tuo gioco — solo uno scaffale sul profilo e la riga “Speso” in Giocatori del sito.',
ccLuxNote:'va sullo scaffale del profilo', ccLux_watch:'Orologio', ccLux_hyper:'Hypercar', ccLux_yacht:'Yacht', ccLux_jet:'Jet privato',
ccLuxAsk:(n,c)=>'Comprare “'+n+'” per $'+c+'? Non dà forza — solo uno scaffale sul profilo.', ccNewsLux:n=>'Nuovo acquisto: '+n,
ccCollTitle:'Collezione', ccCollSpent:'Speso in grandi acquisti', lbByEarn:'Per premi', lbBySpent:'Per spese', lbSpentCol:'Speso',
ccSecGear:'Setup', ccSecHome:'Casa', ccSecFame:'Nome', ccSecLux:'Lusso', ccSecClub:'Club',
ccSecHint_gear:'Le periferiche alzano abilità e allenamento, sedie e stanze aggiungono energia. Un nuovo livello sostituisce il vecchio.',
ccSecHint_home:'Una casa tua elimina l’affitto e aggiunge energia. Qui c’è anche il trasloco in un altro paese o regione.',
ccSecHint_fame:'La tua cup, il merch e la beneficenza portano follower. Il merch paga anche ogni mese.',
ccSecHint_lux:'L’auto tiene alta la fiducia nelle settimane storte. Il resto non dà forza — solo uno scaffale sul profilo.',
ccSecHint_club:'La tua organizzazione: roster, cassa e sponsor. Costa, ma il club è tuo.',
ccShopRooms:'Stanze e trasferte', ccShopNow:'Ora', ccShopMaxed:'Al massimo',
ccSlot_mouse:'Mouse', ccSlot_keyboard:'Tastiera', ccSlot_headset:'Cuffie', ccSlot_monitor:'Monitor', ccSlot_pc:'PC', ccSlot_ps:'PlayStation', ccSlot_xbox:'Xbox', ccSlot_android:'Android', ccSlot_ios:'iPhone e iPad', ccMobOpen:'Classifica', ccShopConFx:n=>'+'+n+' potenza su console', ccSlot_chair:'Sedia', ccSlot_stream:'Stream', ccSlot_car:'Auto',
ccShopBest:'Miglior acquisto adesso', ccShopShort:n=>'Mancano '+n, ccShopBought:n=>'Comprato: '+n,
ccDealsTitle:'Offerte del giorno', ccDealsHint:'Tre articoli in sconto. Domani, altri tre.',
hmContinue:'Continua', hmContinueSub:'I tuoi salvataggi, dal giorno in cui ti sei fermato.', hmPlayOn:'Gioca', hmSlotCareer:'Carriera', hmSlotMgr:'Manager',
hmSlotLine:(s,d,e)=>'Stagione '+s+' · divisione '+d+' · '+e, hmMgrLine:(s,c)=>'Stagione '+s+' · cassa '+c,
hmFriendsTitle:'Con un amico', hmFriendsSub:'Tre modi per non giocare da solo.',
hmFriendDuo:'Una carriera in due: siete nella stessa squadra e i giorni vanno avanti insieme.', hmFriendCode:'Il tuo amico ha già creato una squadra o una gara? Inserisci il suo codice.',
hmFriendRace:'Ognuno porta avanti la sua carriera, e una lobby comune mostra chi è davanti.',
hmSceneTitle:'La scena adesso', hmSceneSub:'Il vero calendario FNCS 2026.', hmSceneLive:'in corso', hmSceneTomorrow:'domani',
hmSceneIn:n=>'tra '+n+' giorn'+(n===1 ? 'o' : 'i'), hmSceneDone:'La stagione FNCS 2026 è finita.',
hmBoardSub:'Le carriere dei giocatori del sito, per premi.', hmBoardMore:n=>'Mostra '+n, hmBoardLess:'Riduci', hmHistSub:'Draft passati, record e premi.',
ccNewsOwnCup:(who,n,w,f)=>'Cup di '+who+', montepremi $'+n+': vince '+w});
Object.assign(I18N.pt, {ccMerchTitle:'Seu próprio merch', ccMerchHint:'O lançamento se paga uma vez; depois, todo dia 1º, uma parte do seu público compra e chegam novos seguidores. Se paga em anos.',
ccMerch_capsule:'Coleção cápsula', ccMerch_line:'Linha de roupas', ccMerch_brand:'Sua própria marca',
ccMerchRate:(p,c)=>p+'% dos seguidores em $, até $'+c+'/mês', ccMerchAsk:(n,c)=>'Lançar “'+n+'” por $'+c+'?',
ccMerchMonth:'Por mês agora', ccMerchEarned:'Ganho com merch', ccNewsMerch:n=>'Merch lançado: '+n,
ccCharityTitle:'Caridade', ccCharityHint:'O dinheiro vai para a caridade; você ganha o respeito da cena e seguidores. No máximo uma vez por mês.',
ccCharityGive:n=>'Doar '+n, ccCharityAsk:n=>'Doar $'+n+' para a caridade?', ccCharityYes:n=>'Doar · $'+n, ccCharityTotal:n=>'Doações ('+n+')',
ccNewsCharity:(n,f)=>'Doou $'+n+' para a caridade',
ccLuxTitle:'Luxo', ccLuxHint:'Não acrescenta nada ao seu jogo — só uma prateleira no perfil e a linha “Gasto” em Jogadores do site.',
ccLuxNote:'vai para a prateleira do perfil', ccLux_watch:'Relógio', ccLux_hyper:'Hipercarro', ccLux_yacht:'Iate', ccLux_jet:'Jato particular',
ccLuxAsk:(n,c)=>'Comprar “'+n+'” por $'+c+'? Não dá força — só uma prateleira no perfil.', ccNewsLux:n=>'Nova compra: '+n,
ccCollTitle:'Coleção', ccCollSpent:'Gasto em compras grandes', lbByEarn:'Por prêmios', lbBySpent:'Por gastos', lbSpentCol:'Gasto',
ccSecGear:'Setup', ccSecHome:'Moradia', ccSecFame:'Nome', ccSecLux:'Luxo', ccSecClub:'Clube',
ccSecHint_gear:'Periféricos aumentam habilidades e treino, cadeiras e cômodos dão energia. Um novo nível substitui o antigo.',
ccSecHint_home:'Uma casa sua acaba com o aluguel e dá energia. A mudança para outro país ou região também fica aqui.',
ccSecHint_fame:'Sua própria cup, o merch e a caridade trazem seguidores. O merch também paga todo mês.',
ccSecHint_lux:'O carro segura sua confiança nas semanas ruins. O resto não dá força — só uma prateleira no perfil.',
ccSecHint_club:'Sua própria organização: elenco, caixa e patrocinadores. Caro, mas o clube é seu.',
ccShopRooms:'Cômodos e viagens', ccShopNow:'Agora', ccShopMaxed:'No máximo',
ccSlot_mouse:'Mouse', ccSlot_keyboard:'Teclado', ccSlot_headset:'Headset', ccSlot_monitor:'Monitor', ccSlot_pc:'PC', ccSlot_ps:'PlayStation', ccSlot_xbox:'Xbox', ccSlot_android:'Android', ccSlot_ios:'iPhone e iPad', ccMobOpen:'Ranking', ccShopConFx:n=>'+'+n+' de força no console', ccSlot_chair:'Cadeira', ccSlot_stream:'Stream', ccSlot_car:'Carro',
ccShopBest:'Melhor compra agora', ccShopShort:n=>'Faltam '+n, ccShopBought:n=>'Comprado: '+n,
ccDealsTitle:'Ofertas do dia', ccDealsHint:'Três itens em promoção. Amanhã, outros três.',
hmContinue:'Continuar', hmContinueSub:'Seus saves, do dia em que você parou.', hmPlayOn:'Jogar', hmSlotCareer:'Carreira', hmSlotMgr:'Manager',
hmSlotLine:(s,d,e)=>'Temporada '+s+' · divisão '+d+' · '+e, hmMgrLine:(s,c)=>'Temporada '+s+' · caixa '+c,
hmFriendsTitle:'Com um amigo', hmFriendsSub:'Três jeitos de não jogar sozinho.',
hmFriendDuo:'Uma carreira para dois: vocês estão no mesmo time e os dias andam juntos.', hmFriendCode:'Seu amigo já criou um time ou uma corrida? Digite o código dele.',
hmFriendRace:'Cada um leva a própria carreira, e um lobby comum mostra quem está na frente.',
hmSceneTitle:'A cena agora', hmSceneSub:'O calendário real do FNCS 2026.', hmSceneLive:'ao vivo', hmSceneTomorrow:'amanhã',
hmSceneIn:n=>'em '+n+' dia'+(n===1 ? '' : 's'), hmSceneDone:'A temporada FNCS 2026 terminou.',
hmBoardSub:'As carreiras dos jogadores do site, por prêmios.', hmBoardMore:n=>'Mostrar '+n, hmBoardLess:'Mostrar menos', hmHistSub:'Drafts anteriores, recordes e prêmios.',
ccNewsOwnCup:(who,n,w,f)=>'Cup de '+who+', premiação de $'+n+': '+w+' venceu'});
/* «Результаты 2026» на главной. */
Object.assign(I18N.ru, {hmRealTitle:'Результаты 2026', hmRealSub:'Настоящие итоги турниров FNCS этого года. Нажми — откроется вся таблица.', hmRealOpen:'Таблица', hmRealTeam:'Команда', hmRealReg:'Регион', hmRealPts:'Очки', hmRealPrize:'Призовые', hmRealClose:'Закрыть'});
Object.assign(I18N.en, {hmRealTitle:'2026 results', hmRealSub:'Real results of this year’s FNCS events. Tap one for the full table.', hmRealOpen:'Table', hmRealTeam:'Team', hmRealReg:'Region', hmRealPts:'Points', hmRealPrize:'Prize', hmRealClose:'Close'});
Object.assign(I18N.fr, {hmRealTitle:'Résultats 2026', hmRealSub:'Les vrais résultats des tournois FNCS de cette année. Touche un tournoi pour le tableau complet.', hmRealOpen:'Tableau', hmRealTeam:'Équipe', hmRealReg:'Région', hmRealPts:'Points', hmRealPrize:'Gains', hmRealClose:'Fermer'});
Object.assign(I18N.it, {hmRealTitle:'Risultati 2026', hmRealSub:'I veri risultati dei tornei FNCS di quest’anno. Tocca un torneo per la classifica completa.', hmRealOpen:'Classifica', hmRealTeam:'Squadra', hmRealReg:'Regione', hmRealPts:'Punti', hmRealPrize:'Premio', hmRealClose:'Chiudi'});
Object.assign(I18N.pt, {hmRealTitle:'Resultados 2026', hmRealSub:'Os resultados reais dos torneios FNCS deste ano. Toque em um para a tabela completa.', hmRealOpen:'Tabela', hmRealTeam:'Time', hmRealReg:'Região', hmRealPts:'Pontos', hmRealPrize:'Prêmio', hmRealClose:'Fechar'});
/* Топ-10 и призовые в расписании (15.10). */
Object.assign(I18N.ru, {hmRealAll:n=>'Вся таблица ('+n+')', hmScenePrize:(r,a,b)=>r+': 1-е место $'+a+', фонд $'+b});
Object.assign(I18N.en, {hmRealAll:n=>'Full table ('+n+')', hmScenePrize:(r,a,b)=>r+': 1st $'+a+', pool $'+b});
Object.assign(I18N.fr, {hmRealAll:n=>'Tableau complet ('+n+')', hmScenePrize:(r,a,b)=>r+' : 1er $'+a+', cagnotte $'+b});
Object.assign(I18N.it, {hmRealAll:n=>'Classifica completa ('+n+')', hmScenePrize:(r,a,b)=>r+': 1° $'+a+', montepremi $'+b});
Object.assign(I18N.pt, {hmRealAll:n=>'Tabela completa ('+n+')', hmScenePrize:(r,a,b)=>r+': 1º $'+a+', premiação $'+b});
/* Призовые 2026 у игроков. */
Object.assign(I18N.ru, {hmEarnTitle:'Призовые 2026', hmEarnSub:'Сколько игроки заработали на FNCS в этом году: финалы Мейджоров, Саммит, Reload Championship, Мировой чемпионат. Нажми на игрока, где заработал.', hmEarnEvents:n=>n+' '+(n%10===1&&n%100!==11?'турнир':(n%10>=2&&n%10<=4&&(n%100<10||n%100>=20))?'турнира':'турниров'), hmEarnEvent:'Турнир', hmEarnNote:'Доля игрока — половина призовых дуо. Квалификации и капы сюда не входят.'});
Object.assign(I18N.en, {hmEarnTitle:'2026 earnings', hmEarnSub:'What players earned at FNCS this year: Major finals, Summit, Reload Championship, Global Championship. Tap a player to see where.', hmEarnEvents:n=>n+' event'+(n===1?'':'s'), hmEarnEvent:'Event', hmEarnNote:'A player’s share is half of the duo’s prize. Qualifiers and cups are not counted.'});
Object.assign(I18N.fr, {hmEarnTitle:'Gains 2026', hmEarnSub:'Ce que les joueurs ont gagné en FNCS cette année : finales des Majors, Summit, Reload Championship, Global Championship. Touche un joueur pour le détail.', hmEarnEvents:n=>n+' tournoi'+(n===1?'':'s'), hmEarnEvent:'Tournoi', hmEarnNote:'La part d’un joueur est la moitié du gain du duo. Qualifs et cups non comptées.'});
Object.assign(I18N.it, {hmEarnTitle:'Guadagni 2026', hmEarnSub:'Quanto hanno guadagnato i giocatori in FNCS quest’anno: finali dei Major, Summit, Reload Championship, Global Championship. Tocca un giocatore per il dettaglio.', hmEarnEvents:n=>n+' torne'+(n===1?'o':'i'), hmEarnEvent:'Torneo', hmEarnNote:'La quota del giocatore è metà del premio del duo. Qualificazioni e cup escluse.'});
Object.assign(I18N.pt, {hmEarnTitle:'Ganhos 2026', hmEarnSub:'Quanto os jogadores ganharam no FNCS este ano: finais dos Majors, Summit, Reload Championship, Global Championship. Toque num jogador para ver onde.', hmEarnEvents:n=>n+' torneio'+(n===1?'':'s'), hmEarnEvent:'Torneio', hmEarnNote:'A parte do jogador é metade do prêmio da dupla. Classificatórias e cups não contam.'});
/* Призовые 2026 со всех турниров (Liquipedia). */
Object.assign(I18N.ru, {hmEarnSub:d=>'Все турниры 2026 года, не только FNCS, по Liquipedia ('+d+'). Нажми на игрока.', hmEarnMedals:(a,b,c)=>'Медали за год: 1-х мест '+a+', 2-х '+b+', 3-х '+c+'.', hmEarnFncs:'Из них финалы FNCS (доля игрока: половина призовых дуо):', hmEarnSrc:'Источник: Liquipedia, Portal:Statistics/2026.'});
Object.assign(I18N.en, {hmEarnSub:d=>'Every 2026 event, not just FNCS, from Liquipedia ('+d+'). Tap a player.', hmEarnMedals:(a,b,c)=>'This year: '+a+' first places, '+b+' second, '+c+' third.', hmEarnFncs:'FNCS finals among them (a player’s share is half the duo prize):', hmEarnSrc:'Source: Liquipedia, Portal:Statistics/2026.'});
Object.assign(I18N.fr, {hmEarnSub:d=>'Tous les tournois 2026, pas seulement la FNCS, d’après Liquipedia ('+d+'). Touche un joueur.', hmEarnMedals:(a,b,c)=>'Cette année : '+a+' victoires, '+b+' deuxièmes places, '+c+' troisièmes.', hmEarnFncs:'Dont finales FNCS (part du joueur : moitié du gain du duo) :', hmEarnSrc:'Source : Liquipedia, Portal:Statistics/2026.'});
Object.assign(I18N.it, {hmEarnSub:d=>'Tutti i tornei 2026, non solo FNCS, da Liquipedia ('+d+'). Tocca un giocatore.', hmEarnMedals:(a,b,c)=>'Quest’anno: '+a+' primi posti, '+b+' secondi, '+c+' terzi.', hmEarnFncs:'Di cui finali FNCS (quota del giocatore: metà del premio del duo):', hmEarnSrc:'Fonte: Liquipedia, Portal:Statistics/2026.'});
Object.assign(I18N.pt, {hmEarnSub:d=>'Todos os torneios de 2026, não só o FNCS, pela Liquipedia ('+d+'). Toque num jogador.', hmEarnMedals:(a,b,c)=>'Este ano: '+a+' primeiros lugares, '+b+' segundos, '+c+' terceiros.', hmEarnFncs:'Destes, finais do FNCS (parte do jogador: metade do prêmio da dupla):', hmEarnSrc:'Fonte: Liquipedia, Portal:Statistics/2026.'});
/* Расписание с Liquipedia (16.10). */
Object.assign(I18N.ru, {hmSceneSub2:'Ближайшие призовые турниры: FNCS по календарю и остальные — по Liquipedia.', hmSceneOther:'Другие турниры с призовыми'});
Object.assign(I18N.en, {hmSceneSub2:'Upcoming prize events: FNCS from the calendar, the rest from Liquipedia.', hmSceneOther:'Other prize events'});
Object.assign(I18N.fr, {hmSceneSub2:'Prochains tournois avec cashprize : la FNCS d’après le calendrier, le reste d’après Liquipedia.', hmSceneOther:'Autres tournois avec cashprize'});
Object.assign(I18N.it, {hmSceneSub2:'Prossimi tornei a premi: FNCS dal calendario, il resto da Liquipedia.', hmSceneOther:'Altri tornei a premi'});
Object.assign(I18N.pt, {hmSceneSub2:'Próximos torneios com premiação: FNCS pelo calendário, o resto pela Liquipedia.', hmSceneOther:'Outros torneios com premiação'});
/* Расписание — только Epic (16.10). */
Object.assign(I18N.ru, {hmSceneSub2:'Ближайшие турниры Epic с призовыми: FNCS и капы.', hmSceneOther:'Капы Epic'});
Object.assign(I18N.en, {hmSceneSub2:'Upcoming Epic prize events: FNCS and cups.', hmSceneOther:'Epic cups'});
Object.assign(I18N.fr, {hmSceneSub2:'Prochains tournois Epic avec cashprize : FNCS et cups.', hmSceneOther:'Cups Epic'});
Object.assign(I18N.it, {hmSceneSub2:'Prossimi tornei Epic a premi: FNCS e cup.', hmSceneOther:'Cup Epic'});
Object.assign(I18N.pt, {hmSceneSub2:'Próximos torneios da Epic com premiação: FNCS e cups.', hmSceneOther:'Cups da Epic'});
/* Список топ-50 поверх экрана. */
Object.assign(I18N.ru, {hmTop50:'топ-50'});
Object.assign(I18N.en, {hmTop50:'top 50'});
Object.assign(I18N.fr, {hmTop50:'top 50'});
Object.assign(I18N.it, {hmTop50:'top 50'});
Object.assign(I18N.pt, {hmTop50:'top 50'});
/* Таймер до турнира Epic. */
Object.assign(I18N.ru, {hmTimerNext:'Ближайший турнир Epic:', hmTimerLive:'Идёт сейчас', hmTimerWatch:'Смотреть', hmTimerToday:'сегодня', hmTimerTomorrow:'завтра', hmDayShort:'д'});
Object.assign(I18N.en, {hmTimerNext:'Next Epic event:', hmTimerLive:'Live now', hmTimerWatch:'Watch', hmTimerToday:'today', hmTimerTomorrow:'tomorrow', hmDayShort:'d'});
Object.assign(I18N.fr, {hmTimerNext:'Prochain tournoi Epic :', hmTimerLive:'En direct', hmTimerWatch:'Regarder', hmTimerToday:'aujourd’hui', hmTimerTomorrow:'demain', hmDayShort:'j'});
Object.assign(I18N.it, {hmTimerNext:'Prossimo torneo Epic:', hmTimerLive:'In diretta', hmTimerWatch:'Guarda', hmTimerToday:'oggi', hmTimerTomorrow:'domani', hmDayShort:'g'});
Object.assign(I18N.pt, {hmTimerNext:'Próximo torneio da Epic:', hmTimerLive:'Ao vivo', hmTimerWatch:'Assistir', hmTimerToday:'hoje', hmTimerTomorrow:'amanhã', hmDayShort:'d'});
/* Победители недавних турниров. */
Object.assign(I18N.ru, {hmSceneRecent:'Недавно: победители'});
Object.assign(I18N.en, {hmSceneRecent:'Recent winners'});
Object.assign(I18N.fr, {hmSceneRecent:'Derniers vainqueurs'});
Object.assign(I18N.it, {hmSceneRecent:'Vincitori recenti'});
Object.assign(I18N.pt, {hmSceneRecent:'Vencedores recentes'});
/* Фидбек 15.10: коуч советует, тренер после карьеры, сверка денег дуо онлайн. */
Object.assign(I18N.ru, {ccNewsMpPaySync:d=>'Призовые сверены с напарником по общей таблице вечера: '+d, ccCoachLeans:t=>'я бы взял «'+t+'»', ccCoachTag:'коуч', ccRetCoachTitle:'Клубы зовут тебя в тренеры', ccRetCoachSub:'Карьера игрока закончена, но сцена тебя знает. Возьми клуб: состав, расписание, решения между играми.', ccRetCoachBtn:'Стать тренером клуба'});
Object.assign(I18N.en, {ccNewsMpPaySync:d=>'Prize money matched with your partner by the shared table: '+d, ccCoachLeans:t=>'I’d take «'+t+'»', ccCoachTag:'coach', ccRetCoachTitle:'Clubs want you as a coach', ccRetCoachSub:'Your playing career is over, but the scene knows you. Take a club: roster, schedule, calls between games.', ccRetCoachBtn:'Become a club coach'});
Object.assign(I18N.fr, {ccNewsMpPaySync:d=>'Gains alignés avec ton coéquipier selon le tableau commun : '+d, ccCoachLeans:t=>'je prendrais «'+t+'»', ccCoachTag:'coach', ccRetCoachTitle:'Des clubs te veulent comme coach', ccRetCoachSub:'Ta carrière de joueur est finie, mais la scène te connaît. Prends un club : roster, calendrier, décisions entre les games.', ccRetCoachBtn:'Devenir coach d’un club'});
Object.assign(I18N.it, {ccNewsMpPaySync:d=>'Premi allineati col compagno secondo la classifica comune: '+d, ccCoachLeans:t=>'prenderei «'+t+'»', ccCoachTag:'coach', ccRetCoachTitle:'I club ti vogliono come coach', ccRetCoachSub:'La carriera da giocatore è finita, ma la scena ti conosce. Prendi un club: roster, calendario, decisioni tra le partite.', ccRetCoachBtn:'Diventa coach di un club'});
Object.assign(I18N.pt, {ccNewsMpPaySync:d=>'Prêmios acertados com o parceiro pela tabela comum: '+d, ccCoachLeans:t=>'eu iria de «'+t+'»', ccCoachTag:'coach', ccRetCoachTitle:'Clubes querem você como coach', ccRetCoachSub:'Sua carreira de jogador acabou, mas a cena te conhece. Assuma um clube: elenco, calendário, decisões entre as partidas.', ccRetCoachBtn:'Virar coach de um clube'});
/* План коуча, разбор вечера, посты по фактам (16.10). */
Object.assign(I18N.ru, {ccPlanTitle:n=>'План коуча '+n+' на вечер', ccPlanOk:'Принято', ccPlanDrop:'Высадка:', ccPlanDrop_home:'своя точка, без контеста', ccPlanDrop_contest:'контест — забираем точку силой', ccPlanRot:'Ротация:', ccPlanRot_early:'рано, до сужения', ccPlanRot_with:'вместе с зоной', ccPlanFight:'Файты:', ccPlanFight_fight:'берём, когда предлагают', ccPlanFight_avoid:'не лезем, бережём места', ccPlanLate:'Эндгейм:', ccPlanLate_mid:'центр зоны', ccPlanLate_edge:'край зоны', evTitle:'Разбор вечера', evBest:'Лучшая игра', evBestGame:(g,p,e)=>'игра '+g+': '+p+'-е место, '+e+' килл.', evKills:'Киллы', evPerGame:x=>x+' за игру', evDeaths:'Вылеты', evDeathKill:n=>'от игроков ×'+n, evDeathDrop:n=>'на высадке ×'+n, evDeathStorm:n=>'шторм ×'+n, evDeathSurge:n=>'сюрдж ×'+n, evNemesis:'Чаще всех тебя убивал', evPlan:'План коуча', evPlanDone:(a,b)=>'выполнен '+a+' из '+b, evTip_kill:'Больше всего вылетов в файтах — на неделе качай стрельбу и билд.', evTip_drop:'Падаешь на высадке — тренируй старт и выбирай точку спокойнее.', evTip_storm:'Шторм забирает игры — тренируй ротации и выживание.', evTip_surge:'Сюрдж выбивает — нужен урон: файты в середине игры.', ccPostEvKilled:(h,n,m)=>['@'+m+', '+n+' раза за вечер через нас. Ничего личного','сегодня '+n+' раза встретили @'+m+' — каждый раз в нашу пользу','@'+m+' в лобби = плюс киллы для нас ('+n+' за вечер)'][n%3], ccPostEvVR:(g,e,n)=>['Victory Royale в игре '+g+' из '+n+', '+e+' килл. Едем дальше','игра '+g+': корона и '+e+' киллов 👑','взяли игру '+g+'. '+e+' киллов, это было громко'][g%3], ccPostEvKills:(k,n)=>[k+' киллов за '+n+' игр. Лобби запомнит',k+' киллов за вечер, без короны, но громко'][k%2]});
Object.assign(I18N.en, {ccPlanTitle:n=>n+'’s game plan for tonight', ccPlanOk:'Got it', ccPlanDrop:'Drop:', ccPlanDrop_home:'our own spot, no contest', ccPlanDrop_contest:'contest — take the spot by force', ccPlanRot:'Rotation:', ccPlanRot_early:'early, before it closes', ccPlanRot_with:'with the storm', ccPlanFight:'Fights:', ccPlanFight_fight:'take them when they come', ccPlanFight_avoid:'stay out, protect placement', ccPlanLate:'Endgame:', ccPlanLate_mid:'middle of the zone', ccPlanLate_edge:'edge of the zone', evTitle:'Evening review', evBest:'Best game', evBestGame:(g,p,e)=>'game '+g+': #'+p+', '+e+' elims', evKills:'Elims', evPerGame:x=>x+' per game', evDeaths:'Deaths', evDeathKill:n=>'to players ×'+n, evDeathDrop:n=>'off spawn ×'+n, evDeathStorm:n=>'storm ×'+n, evDeathSurge:n=>'surge ×'+n, evNemesis:'Killed you most', evPlan:'Coach plan', evPlanDone:(a,b)=>a+' of '+b+' followed', evTip_kill:'Most deaths came in fights — train aim and building this week.', evTip_drop:'You die off spawn — train the opening and pick a calmer spot.', evTip_storm:'The storm takes your games — train rotations and survival.', evTip_surge:'Surge knocks you out — you need damage: mid-game fights.', ccPostEvKilled:(h,n,m)=>['@'+m+', '+n+' times through us tonight. Nothing personal','ran into @'+m+' '+n+' times tonight — went our way every time','@'+m+' in the lobby = free elims ('+n+' tonight)'][n%3], ccPostEvVR:(g,e,n)=>['Victory Royale in game '+g+' of '+n+', '+e+' elims. On to the next','game '+g+': crown and '+e+' elims 👑','took game '+g+'. '+e+' elims, that was loud'][g%3], ccPostEvKills:(k,n)=>[k+' elims in '+n+' games. The lobby will remember',k+' elims tonight, no crown but loud'][k%2]});
Object.assign(I18N.fr, {ccPlanTitle:n=>'Le plan de '+n+' pour ce soir', ccPlanOk:'Compris', ccPlanDrop:'Drop :', ccPlanDrop_home:'notre spot, sans contest', ccPlanDrop_contest:'contest — on prend le spot de force', ccPlanRot:'Rotation :', ccPlanRot_early:'tôt, avant la fermeture', ccPlanRot_with:'avec la zone', ccPlanFight:'Fights :', ccPlanFight_fight:'on les prend quand ils viennent', ccPlanFight_avoid:'on évite, on protège le placement', ccPlanLate:'Endgame :', ccPlanLate_mid:'centre de la zone', ccPlanLate_edge:'bord de la zone', evTitle:'Bilan de la soirée', evBest:'Meilleure game', evBestGame:(g,p,e)=>'game '+g+' : '+p+'e, '+e+' kills', evKills:'Kills', evPerGame:x=>x+' par game', evDeaths:'Morts', evDeathKill:n=>'face aux joueurs ×'+n, evDeathDrop:n=>'au drop ×'+n, evDeathStorm:n=>'tempête ×'+n, evDeathSurge:n=>'surge ×'+n, evNemesis:'T’a le plus tué', evPlan:'Plan du coach', evPlanDone:(a,b)=>a+' sur '+b+' suivis', evTip_kill:'Tu meurs surtout en fight — travaille la visée et le build cette semaine.', evTip_drop:'Tu meurs au drop — travaille l’ouverture et prends un spot plus calme.', evTip_storm:'La tempête te coûte des games — travaille les rotations et la survie.', evTip_surge:'Le surge te sort — il faut des dégâts : fights en milieu de game.', ccPostEvKilled:(h,n,m)=>['@'+m+', '+n+' fois face à nous ce soir. Rien de personnel','croisé @'+m+' '+n+' fois ce soir — à chaque fois pour nous','@'+m+' dans le lobby = kills offerts ('+n+' ce soir)'][n%3], ccPostEvVR:(g,e,n)=>['Top 1 en game '+g+' sur '+n+', '+e+' kills. On continue','game '+g+' : couronne et '+e+' kills 👑','game '+g+' pour nous. '+e+' kills, ça a fait du bruit'][g%3], ccPostEvKills:(k,n)=>[k+' kills en '+n+' games. Le lobby s’en souviendra',k+' kills ce soir, pas de top 1 mais du bruit'][k%2]});
Object.assign(I18N.it, {ccPlanTitle:n=>'Il piano di '+n+' per stasera', ccPlanOk:'Ricevuto', ccPlanDrop:'Drop:', ccPlanDrop_home:'il nostro spot, niente contest', ccPlanDrop_contest:'contest — prendiamo lo spot con la forza', ccPlanRot:'Rotazione:', ccPlanRot_early:'presto, prima che chiuda', ccPlanRot_with:'con la tempesta', ccPlanFight:'Fight:', ccPlanFight_fight:'li prendiamo quando arrivano', ccPlanFight_avoid:'stiamo fuori, proteggiamo il piazzamento', ccPlanLate:'Endgame:', ccPlanLate_mid:'centro della zona', ccPlanLate_edge:'bordo della zona', evTitle:'Analisi della serata', evBest:'Partita migliore', evBestGame:(g,p,e)=>'partita '+g+': '+p+'°, '+e+' kill', evKills:'Kill', evPerGame:x=>x+' a partita', evDeaths:'Morti', evDeathKill:n=>'contro giocatori ×'+n, evDeathDrop:n=>'al drop ×'+n, evDeathStorm:n=>'tempesta ×'+n, evDeathSurge:n=>'surge ×'+n, evNemesis:'Ti ha ucciso più spesso', evPlan:'Piano del coach', evPlanDone:(a,b)=>a+' su '+b+' seguiti', evTip_kill:'Muori soprattutto nei fight — allena mira e build questa settimana.', evTip_drop:'Muori al drop — allena l’apertura e scegli uno spot più tranquillo.', evTip_storm:'La tempesta ti costa partite — allena rotazioni e sopravvivenza.', evTip_surge:'Il surge ti elimina — servono danni: fight a metà partita.', ccPostEvKilled:(h,n,m)=>['@'+m+', '+n+' volte contro di noi stasera. Niente di personale','incontrato @'+m+' '+n+' volte stasera — sempre a nostro favore','@'+m+' in lobby = kill gratis ('+n+' stasera)'][n%3], ccPostEvVR:(g,e,n)=>['Victory Royale nella partita '+g+' di '+n+', '+e+' kill. Avanti','partita '+g+': corona e '+e+' kill 👑','presa la partita '+g+'. '+e+' kill, rumorosa'][g%3], ccPostEvKills:(k,n)=>[k+' kill in '+n+' partite. La lobby se lo ricorderà',k+' kill stasera, niente corona ma rumore'][k%2]});
Object.assign(I18N.pt, {ccPlanTitle:n=>'O plano de '+n+' para hoje', ccPlanOk:'Entendido', ccPlanDrop:'Drop:', ccPlanDrop_home:'nosso spot, sem contest', ccPlanDrop_contest:'contest — tomar o spot na força', ccPlanRot:'Rotação:', ccPlanRot_early:'cedo, antes de fechar', ccPlanRot_with:'junto com a tempestade', ccPlanFight:'Fights:', ccPlanFight_fight:'pegamos quando aparecem', ccPlanFight_avoid:'ficamos fora, protegemos a colocação', ccPlanLate:'Endgame:', ccPlanLate_mid:'centro da zona', ccPlanLate_edge:'borda da zona', evTitle:'Resumo da noite', evBest:'Melhor partida', evBestGame:(g,p,e)=>'partida '+g+': '+p+'º, '+e+' abates', evKills:'Abates', evPerGame:x=>x+' por partida', evDeaths:'Mortes', evDeathKill:n=>'para jogadores ×'+n, evDeathDrop:n=>'no drop ×'+n, evDeathStorm:n=>'tempestade ×'+n, evDeathSurge:n=>'surge ×'+n, evNemesis:'Quem mais te matou', evPlan:'Plano do coach', evPlanDone:(a,b)=>a+' de '+b+' seguidos', evTip_kill:'Você morre mais nos fights — treine mira e build esta semana.', evTip_drop:'Você morre no drop — treine a abertura e escolha um spot mais calmo.', evTip_storm:'A tempestade custa partidas — treine rotações e sobrevivência.', evTip_surge:'O surge te elimina — precisa de dano: fights no meio da partida.', ccPostEvKilled:(h,n,m)=>['@'+m+', '+n+' vezes contra nós hoje. Nada pessoal','encontramos @'+m+' '+n+' vezes hoje — sempre a nosso favor','@'+m+' no lobby = abates grátis ('+n+' hoje)'][n%3], ccPostEvVR:(g,e,n)=>['Victory Royale na partida '+g+' de '+n+', '+e+' abates. Seguimos','partida '+g+': coroa e '+e+' abates 👑','levamos a partida '+g+'. '+e+' abates, foi barulhento'][g%3], ccPostEvKills:(k,n)=>[k+' abates em '+n+' partidas. O lobby vai lembrar',k+' abates hoje, sem coroa mas barulhento'][k%2]});
/* Снятие команды перед ЛАНом (ccLanDqRoll) и полная команда онлайн (ccMpByeFull). w — причина: visa | cheat | mate. */
Object.assign(I18N.ru, {ccDropMap:'Карта высадок', ccDropMapClose:'Закрыть', ccDropMapHot:'Стычки на высадке', ccDropMapNote:(n,h)=>'Команд на карте: '+n+'. Спорных точек: '+h+'. Команды твоих лобби помнят свою точку весь сезон.', ccDropMapNone:'Пока пусто: команды запоминают точки после первого вечера на этом острове в сезоне.',
  ccMpFull:'В этой команде уже двое. Втроём и больше играйте гонкой карьер: «Против друга».',
  ccNewsDqSeat:(t,w)=>({visa:'У '+t+' не вышла виза',cheat:t+' дисквалифицированы за читы',mate:'Напарник из '+t+' не может лететь'})[w]+': их место на ЛАНе переходит к вам',
  ccNewsDqOther:(t,w)=>({visa:'У '+t+' не вышла виза',cheat:t+' дисквалифицированы за читы',mate:'Напарник из '+t+' не может лететь'})[w]+': место на ЛАНе уходит следующей команде'});
Object.assign(I18N.en, {ccDropMap:'Drop map', ccDropMapClose:'Close', ccDropMapHot:'Contested drops', ccDropMapNote:(n,h)=>'Teams on the map: '+n+'. Contested spots: '+h+'. Teams from your lobbies keep their spot all season.', ccDropMapNone:'Empty for now: teams claim their spots after the first night on this island this season.',
  ccMpFull:'This team already has two players. For three or more, play a Career race: “Against a friend”.',
  ccNewsDqSeat:(t,w)=>({visa:t+' were denied a visa',cheat:t+' were disqualified for cheating',mate:'A player from '+t+' cannot travel'})[w]+': their LAN seat passes to you',
  ccNewsDqOther:(t,w)=>({visa:t+' were denied a visa',cheat:t+' were disqualified for cheating',mate:'A player from '+t+' cannot travel'})[w]+': their LAN seat goes to the next team'});
Object.assign(I18N.fr, {ccDropMap:'Carte des drops', ccDropMapClose:'Fermer', ccDropMapHot:'Drops contestés', ccDropMapNote:(n,h)=>'Équipes sur la carte : '+n+'. Spots contestés : '+h+'. Les équipes de tes lobbies gardent leur spot toute la saison.', ccDropMapNone:'Vide pour l’instant : les équipes prennent leur spot après la première soirée sur cette île cette saison.',
  ccMpFull:'Cette équipe a déjà deux joueurs. À trois ou plus, jouez une Course de carrières : « Contre un ami ».',
  ccNewsDqSeat:(t,w)=>({visa:t+' n’ont pas obtenu de visa',cheat:t+' disqualifiés pour triche',mate:'Un joueur de '+t+' ne peut pas voyager'})[w]+' : leur place à la LAN vous revient',
  ccNewsDqOther:(t,w)=>({visa:t+' n’ont pas obtenu de visa',cheat:t+' disqualifiés pour triche',mate:'Un joueur de '+t+' ne peut pas voyager'})[w]+' : leur place à la LAN passe à l’équipe suivante'});
Object.assign(I18N.it, {ccDropMap:'Mappa dei drop', ccDropMapClose:'Chiudi', ccDropMapHot:'Drop contesi', ccDropMapNote:(n,h)=>'Squadre sulla mappa: '+n+'. Punti contesi: '+h+'. Le squadre delle tue lobby tengono il loro punto per tutta la stagione.', ccDropMapNone:'Vuota per ora: le squadre scelgono il punto dopo la prima serata su quest’isola in stagione.',
  ccMpFull:'Questa squadra ha già due giocatori. In tre o più, avviate una Gara.',
  ccNewsDqSeat:(t,w)=>({visa:'A '+t+' è stato negato il visto',cheat:t+' squalificati per cheating',mate:'Un giocatore di '+t+' non può viaggiare'})[w]+': il loro posto alla LAN passa a voi',
  ccNewsDqOther:(t,w)=>({visa:'A '+t+' è stato negato il visto',cheat:t+' squalificati per cheating',mate:'Un giocatore di '+t+' non può viaggiare'})[w]+': il loro posto alla LAN va alla squadra successiva'});
Object.assign(I18N.pt, {ccDropMap:'Mapa de drops', ccDropMapClose:'Fechar', ccDropMapHot:'Drops disputados', ccDropMapNote:(n,h)=>'Equipes no mapa: '+n+'. Pontos disputados: '+h+'. As equipes dos seus lobbies mantêm o ponto a temporada toda.', ccDropMapNone:'Vazio por enquanto: as equipes marcam o ponto depois da primeira noite nesta ilha na temporada.',
  ccMpFull:'Esta equipe já tem dois jogadores. Com três ou mais, comecem uma Corrida.',
  ccNewsDqSeat:(t,w)=>({visa:t+' tiveram o visto negado',cheat:t+' desclassificados por trapaça',mate:'Um jogador de '+t+' não pode viajar'})[w]+': a vaga deles na LAN passa para vocês',
  ccNewsDqOther:(t,w)=>({visa:t+' tiveram o visto negado',cheat:t+' desclassificados por trapaça',mate:'Um jogador de '+t+' não pode viajar'})[w]+': a vaga deles na LAN vai para a próxima equipe'});
/* Облачные сохранения (16.10). */
Object.assign(I18N.ru, {clTitle:'Облако', clOn:'включено', clOffNow:'выключено — карьеры только в этом браузере', clWhy:'Включи облако — получишь код. По нему карьеры и менеджер откроются на любом устройстве, даже если браузер почистят.', clEnable:'Включить облако', clHave:'У меня есть код', clKeep:'Запиши этот код: по нему твои карьеры откроются на другом устройстве.', clSent:w=>'Последняя отправка: '+w, clBusy:'отправляем…', clPushNow:'Отправить сейчас', clOther:'Ввести другой код', clOff:'Выключить', clOpen:'Открыть', clFound:n=>'В облаке по этому коду: '+n, clCareer:'карьера', clMgr:'менеджер', clTake:'Забрать в этот браузер', clSure:'Заменит такие же слоты здесь — нажми ещё раз', clErr:m=>'Облако не ответило ('+m+'). Карьера сохранена в браузере, попробуем позже.', clBad:'Код — 16 знаков, например K7QM-2XPA-9RTD-WH4C'});
Object.assign(I18N.en, {clTitle:'Cloud', clOn:'on', clOffNow:'off — careers live only in this browser', clWhy:'Turn on the cloud to get a code. With it your careers and manager open on any device, even if this browser is wiped.', clEnable:'Turn on cloud', clHave:'I have a code', clKeep:'Write this code down: it opens your careers on another device.', clSent:w=>'Last upload: '+w, clBusy:'uploading…', clPushNow:'Upload now', clOther:'Enter another code', clOff:'Turn off', clOpen:'Open', clFound:n=>'Saves on this code: '+n, clCareer:'career', clMgr:'manager', clTake:'Bring them to this browser', clSure:'Replaces the same slots here — tap again', clErr:m=>'The cloud did not answer ('+m+'). Your career is saved in the browser; we will retry.', clBad:'The code is 16 characters, like K7QM-2XPA-9RTD-WH4C'});
Object.assign(I18N.fr, {clTitle:'Cloud', clOn:'activé', clOffNow:'désactivé — les carrières restent dans ce navigateur', clWhy:'Active le cloud pour obtenir un code. Avec lui, tes carrières et ton manager s’ouvrent sur n’importe quel appareil, même si ce navigateur est vidé.', clEnable:'Activer le cloud', clHave:'J’ai un code', clKeep:'Note ce code : il ouvre tes carrières sur un autre appareil.', clSent:w=>'Dernier envoi : '+w, clBusy:'envoi…', clPushNow:'Envoyer maintenant', clOther:'Entrer un autre code', clOff:'Désactiver', clOpen:'Ouvrir', clFound:n=>'Sauvegardes sur ce code : '+n, clCareer:'carrière', clMgr:'manager', clTake:'Les récupérer ici', clSure:'Remplace les mêmes emplacements ici — touche encore', clErr:m=>'Le cloud n’a pas répondu ('+m+'). Ta carrière est sauvegardée dans le navigateur ; on réessaiera.', clBad:'Le code fait 16 caractères, ex. K7QM-2XPA-9RTD-WH4C'});
Object.assign(I18N.it, {clTitle:'Cloud', clOn:'attivo', clOffNow:'spento — le carriere restano in questo browser', clWhy:'Attiva il cloud per avere un codice. Con esso carriere e manager si aprono su qualsiasi dispositivo, anche se questo browser viene svuotato.', clEnable:'Attiva il cloud', clHave:'Ho un codice', clKeep:'Segnati questo codice: apre le tue carriere su un altro dispositivo.', clSent:w=>'Ultimo invio: '+w, clBusy:'invio…', clPushNow:'Invia ora', clOther:'Inserisci un altro codice', clOff:'Spegni', clOpen:'Apri', clFound:n=>'Salvataggi con questo codice: '+n, clCareer:'carriera', clMgr:'manager', clTake:'Portali in questo browser', clSure:'Sostituisce gli stessi slot qui — tocca di nuovo', clErr:m=>'Il cloud non ha risposto ('+m+'). La carriera è salvata nel browser; riproveremo.', clBad:'Il codice ha 16 caratteri, es. K7QM-2XPA-9RTD-WH4C'});
Object.assign(I18N.pt, {clTitle:'Nuvem', clOn:'ligada', clOffNow:'desligada — as carreiras ficam só neste navegador', clWhy:'Ligue a nuvem para receber um código. Com ele, suas carreiras e o manager abrem em qualquer aparelho, mesmo se este navegador for limpo.', clEnable:'Ligar a nuvem', clHave:'Tenho um código', clKeep:'Anote este código: ele abre suas carreiras em outro aparelho.', clSent:w=>'Último envio: '+w, clBusy:'enviando…', clPushNow:'Enviar agora', clOther:'Digitar outro código', clOff:'Desligar', clOpen:'Abrir', clFound:n=>'Saves neste código: '+n, clCareer:'carreira', clMgr:'manager', clTake:'Trazer para este navegador', clSure:'Substitui os mesmos slots aqui — toque de novo', clErr:m=>'A nuvem não respondeu ('+m+'). Sua carreira está salva no navegador; tentaremos de novo.', clBad:'O código tem 16 caracteres, ex. K7QM-2XPA-9RTD-WH4C'});
Object.assign(I18N.ru, {clShow:'Показать', clHide:'Скрыть', clCopy:'Скопировать', clCopied:'Скопировано'});
Object.assign(I18N.en, {clShow:'Show', clHide:'Hide', clCopy:'Copy', clCopied:'Copied'});
Object.assign(I18N.fr, {clShow:'Afficher', clHide:'Masquer', clCopy:'Copier', clCopied:'Copié'});
Object.assign(I18N.it, {clShow:'Mostra', clHide:'Nascondi', clCopy:'Copia', clCopied:'Copiato'});
Object.assign(I18N.ru, {ccNatAutoTag:'выбран сам', ytK_win:'Победа', ytK_podium:'Подиум', ytK_qual:'Квалификация', ytWho:'Кто ведёт канал', ytBy:(n,a)=>'Ролики монтирует и выкладывает '+n+(a ? ' (@'+a+')' : '')+'. Выкладывает заметное: победы, подиумы, квалификации на больших турнирах (на следующий день) и раз в месяц сборник хайлайтов.', ytQueue:'В монтаже:', ytNoSmm:'Канал ведёт СММ: монтирует ролики из турниров и выкладывает. Без СММ роликов нет.', ytHireSmm:'Нанять СММ', chTabYt:'YouTube', ytSubs:n=>n+' подписчиков', ytViews:n=>n+' просмотров', ytEarned:'Заработано', ytSubsW:'подписчиков', ytHoursW:'часов просмотра',
  ytMonOn:'Партнёрская программа подключена: реклама в роликах платит', ytMonNeed:'Партнёрка YouTube: деньги с рекламы после 1000 подписчиков и 4000 часов просмотра',
  ytNew:'Новый ролик', ytNoFresh:'Пока нечего выкладывать: ролик выходит после победы, подиума или квалификации на большом турнире.', ytVids:'Ролики канала', ytNoVids:'На канале пока пусто.',
  ytNoCom:'Комментариев пока нет.', ytNoEnergy:n=>'Не хватает энергии: нужно '+n, ytAgo:d=>d===0 ? 'сегодня' : d===1 ? 'вчера' : d+' дн. назад',
  ytK_hl:'Хайлайты', ytK_vlog:'Влог', ytK_react:'Разбор',
  ytTHlWin:n=>'ВЫИГРАЛ '+n+'! Хайлайты', ytTHl:(n,p)=>n+': #'+p+', лучшие моменты', ytTVlog:n=>'Влог: как прошёл '+n, ytTReact:(n,p)=>'Разбираю свои игры на '+n+' (#'+p+')',
  ytC_win:['ЗАСЛУЖЕННО','легенда','я знал что выиграешь','это было безумно','финальная зона 🔥','GG','лучший в регионе','момент на 6:40 просто жесть'],
  ytC_good:['хорошая игра','в следующий раз победа','ротации топ','жаль последнюю зону','стабильно','топ 10 это уже сила'],
  ytC_bad:['бывает','не сдавайся','лобби было жёсткое','что случилось во второй игре?','жду реванш','норм, следующий будет лучше']});
Object.assign(I18N.en, {ccNatAutoTag:'auto pick', ytK_win:'Win', ytK_podium:'Podium', ytK_qual:'Qualified', ytWho:'Who runs the channel', ytBy:(n,a)=>n+(a ? ' (@'+a+')' : '')+' edits and uploads. Only what stands out: wins, podiums, big-event qualifications (the next day) and a monthly highlights compilation.', ytQueue:'Being edited:', ytNoSmm:'The channel is run by an SMM: they edit videos from your tournaments and upload them. No SMM, no videos.', ytHireSmm:'Hire an SMM', chTabYt:'YouTube', ytSubs:n=>n+' subscribers', ytViews:n=>n+' views', ytEarned:'Earned', ytSubsW:'subscribers', ytHoursW:'watch hours',
  ytMonOn:'Partner Program on: ads in your videos pay', ytMonNeed:'YouTube Partner Program: ad money after 1,000 subscribers and 4,000 watch hours',
  ytNew:'New video', ytNoFresh:'Nothing to upload yet: a video comes after a win, a podium or a big-event qualification.', ytVids:'Channel videos', ytNoVids:'Nothing on the channel yet.',
  ytNoCom:'No comments yet.', ytNoEnergy:n=>'Not enough energy: '+n+' needed', ytAgo:d=>d===0 ? 'today' : d===1 ? 'yesterday' : d+' days ago',
  ytK_hl:'Highlights', ytK_vlog:'Vlog', ytK_react:'Breakdown',
  ytTHlWin:n=>'I WON '+n+'! Highlights', ytTHl:(n,p)=>n+': #'+p+', best moments', ytTVlog:n=>'Vlog: how '+n+' went', ytTReact:(n,p)=>'Breaking down my '+n+' games (#'+p+')',
  ytC_win:['DESERVED','goat','knew you would win this','that was insane','endgame 🔥','GG','best in the region','6:40 is crazy'],
  ytC_good:['good games','win next time','rotations were clean','unlucky last zone','consistent','top 10 is still huge'],
  ytC_bad:['it happens','keep going','that lobby was stacked','what happened in game 2?','waiting for the comeback','next one will be better']});
Object.assign(I18N.fr, {ccNatAutoTag:'choix auto', ytK_win:'Victoire', ytK_podium:'Podium', ytK_qual:'Qualif', ytWho:'Qui gère la chaîne', ytBy:(n,a)=>n+(a ? ' (@'+a+')' : '')+' monte et publie. Seulement le marquant : victoires, podiums, qualifs des grands tournois (le lendemain) et une compil de highlights par mois.', ytQueue:'En montage :', ytNoSmm:'La chaîne est gérée par un SMM : il monte les vidéos de tes tournois et les publie. Sans SMM, pas de vidéos.', ytHireSmm:'Engager un SMM', chTabYt:'YouTube', ytSubs:n=>n+' abonnés', ytViews:n=>n+' vues', ytEarned:'Gagné', ytSubsW:'abonnés', ytHoursW:'heures de visionnage',
  ytMonOn:'Programme Partenaire actif : les pubs de tes vidéos paient', ytMonNeed:'Programme Partenaire YouTube : argent des pubs après 1 000 abonnés et 4 000 heures de visionnage',
  ytNew:'Nouvelle vidéo', ytNoFresh:'Une vidéo se fait à partir d\'un tournoi de la semaine passée. Joue un tournoi et il apparaîtra ici.', ytVids:'Vidéos de la chaîne', ytNoVids:'Rien sur la chaîne pour l\'instant.',
  ytNoCom:'Pas encore de commentaires.', ytNoEnergy:n=>'Pas assez d\'énergie : il faut '+n, ytAgo:d=>d===0 ? 'aujourd\'hui' : d===1 ? 'hier' : 'il y a '+d+' j',
  ytK_hl:'Highlights', ytK_vlog:'Vlog', ytK_react:'Analyse',
  ytTHlWin:n=>'J\'AI GAGNÉ '+n+' ! Highlights', ytTHl:(n,p)=>n+' : #'+p+', meilleurs moments', ytTVlog:n=>'Vlog : mon '+n, ytTReact:(n,p)=>'J\'analyse mes games de '+n+' (#'+p+')'});
Object.assign(I18N.it, {ccNatAutoTag:'scelta auto', ytK_win:'Vittoria', ytK_podium:'Podio', ytK_qual:'Qualifica', ytWho:'Chi gestisce il canale', ytBy:(n,a)=>n+(a ? ' (@'+a+')' : '')+' monta e pubblica. Solo ciò che conta: vittorie, podi, qualifiche nei grandi tornei (il giorno dopo) e una raccolta di highlights al mese.', ytQueue:'In montaggio:', ytNoSmm:'Il canale lo gestisce un SMM: monta i video dei tuoi tornei e li pubblica. Senza SMM niente video.', ytHireSmm:'Assumi un SMM', chTabYt:'YouTube', ytSubs:n=>n+' iscritti', ytViews:n=>n+' visualizzazioni', ytEarned:'Guadagnato', ytSubsW:'iscritti', ytHoursW:'ore di visualizzazione',
  ytMonOn:'Programma partner attivo: la pubblicità nei video paga', ytMonNeed:'Programma partner YouTube: soldi dalla pubblicità dopo 1.000 iscritti e 4.000 ore di visualizzazione',
  ytNew:'Nuovo video', ytNoFresh:'Un video si fa da un torneo della settimana scorsa. Gioca un torneo e comparirà qui.', ytVids:'Video del canale', ytNoVids:'Ancora niente sul canale.',
  ytNoCom:'Ancora nessun commento.', ytNoEnergy:n=>'Energia insufficiente: serve '+n, ytAgo:d=>d===0 ? 'oggi' : d===1 ? 'ieri' : d+' giorni fa',
  ytK_hl:'Highlights', ytK_vlog:'Vlog', ytK_react:'Analisi',
  ytTHlWin:n=>'HO VINTO '+n+'! Highlights', ytTHl:(n,p)=>n+': #'+p+', momenti migliori', ytTVlog:n=>'Vlog: com\'è andata a '+n, ytTReact:(n,p)=>'Analizzo le mie partite a '+n+' (#'+p+')'});
Object.assign(I18N.pt, {ccNatAutoTag:'escolha automática', ytK_win:'Vitória', ytK_podium:'Pódio', ytK_qual:'Classificação', ytWho:'Quem cuida do canal', ytBy:(n,a)=>n+(a ? ' (@'+a+')' : '')+' edita e publica. Só o que se destaca: vitórias, pódios, classificações em grandes torneios (no dia seguinte) e uma compilação de destaques por mês.', ytQueue:'Em edição:', ytNoSmm:'O canal é cuidado por um SMM: ele edita vídeos dos seus torneios e publica. Sem SMM, sem vídeos.', ytHireSmm:'Contratar SMM', chTabYt:'YouTube', ytSubs:n=>n+' inscritos', ytViews:n=>n+' visualizações', ytEarned:'Ganho', ytSubsW:'inscritos', ytHoursW:'horas assistidas',
  ytMonOn:'Programa de Parcerias ativo: os anúncios nos vídeos pagam', ytMonNeed:'Programa de Parcerias do YouTube: dinheiro de anúncios após 1.000 inscritos e 4.000 horas assistidas',
  ytNew:'Novo vídeo', ytNoFresh:'Um vídeo é feito de um torneio da semana passada. Jogue um torneio e ele aparece aqui.', ytVids:'Vídeos do canal', ytNoVids:'Nada no canal ainda.',
  ytNoCom:'Sem comentários ainda.', ytNoEnergy:n=>'Energia insuficiente: precisa de '+n, ytAgo:d=>d===0 ? 'hoje' : d===1 ? 'ontem' : 'há '+d+' dias',
  ytK_hl:'Destaques', ytK_vlog:'Vlog', ytK_react:'Análise',
  ytTHlWin:n=>'GANHEI '+n+'! Destaques', ytTHl:(n,p)=>n+': #'+p+', melhores momentos', ytTVlog:n=>'Vlog: como foi '+n, ytTReact:(n,p)=>'Analisando meus jogos em '+n+' (#'+p+')'});
Object.assign(I18N.pt, {clShow:'Mostrar', clHide:'Ocultar', clCopy:'Copiar', clCopied:'Copiado'});
/* Драфт дня (16.10). */
Object.assign(I18N.ru, {playersLink:'Игроки FNCS'}); Object.assign(I18N.en, {playersLink:'FNCS players'}); Object.assign(I18N.fr, {playersLink:'Joueurs FNCS'}); Object.assign(I18N.it, {playersLink:'Giocatori FNCS'}); Object.assign(I18N.pt, {playersLink:'Jogadores FNCS'});
Object.assign(I18N.ru, {dyNickBad:"Такой ник в таблицу не пускаем, выбери другой", dyTitleW:'Драфт дня', dyTag:'Каждый день', dyTitle:n=>'Драфт дня #'+n, dySub:'Каждый день случайный сезон: паки у всех свои, но только из игроков того периода. Одна попытка, таблица дня по силе состава.', dyRules:'сквад · все регионы · 12 игр', dyPlayers:y=>'игроки '+y, dyOnce:'Попытка одна: после «Выйти на турнир» переиграть нельзя.', dyPlay:'Играть', dyBoard:'Таблица дня', dyShare:'Поделиться', dyCopied:'Скопировано', dyPts:'очк.', dyNick:'Ник для таблицы', dySend:'В таблицу', dySent:n=>'Ты в таблице дня как '+n, dyLeft:'Турнир не доигран, попытка сгорела', dyNext:t=>'Новый драфт через '+t, dyH:'ч', dyM:'мин', dyRank:(r,t)=>'Твоё место: '+r+' из '+t, dyEmpty:'Сегодня ещё никто не сыграл. Будь первым.', dyHonest:'Результат присылает браузер игрока, сервер его не пересчитывает.'});
Object.assign(I18N.en, {dyNickBad:"This name is not allowed on the board, pick another", dyTitleW:'Daily Draft', dyTag:'Every day', dyTitle:n=>'Daily Draft #'+n, dySub:'A random season every day: your own packs, but only players from that period. One try, the daily board ranks squad power.', dyRules:'squad · all regions · 12 games', dyPlayers:y=>'players of '+y, dyOnce:'One try: once you hit “Enter tournament” there is no replay.', dyPlay:'Play', dyBoard:'Daily leaderboard', dyShare:'Share', dyCopied:'Copied', dyPts:'pts', dyNick:'Name for the leaderboard', dySend:'Submit', dySent:n=>'You are on today’s board as '+n, dyLeft:'Tournament not finished, the try is used', dyNext:t=>'Next draft in '+t, dyH:'h', dyM:'min', dyRank:(r,t)=>'Your place: '+r+' of '+t, dyEmpty:'Nobody has played today yet. Be the first.', dyHonest:'Results are sent by the player’s browser; the server does not recompute them.'});
Object.assign(I18N.fr, {dyNickBad:"Ce pseudo n’est pas accepté au classement, choisis-en un autre", dyTitleW:'Draft du jour', dyTag:'Chaque jour', dyTitle:n=>'Draft du jour #'+n, dySub:'Une saison au hasard chaque jour : tes propres packs, mais seulement des joueurs de cette période. Un seul essai, le classement du jour se fait à la force de la squad.', dyRules:'squad · toutes les régions · 12 parties', dyPlayers:y=>'joueurs de '+y, dyOnce:'Un seul essai : après « Entrer dans le tournoi », pas de revanche.', dyPlay:'Jouer', dyBoard:'Classement du jour', dyShare:'Partager', dyCopied:'Copié', dyPts:'pts', dyNick:'Pseudo pour le classement', dySend:'Envoyer', dySent:n=>'Tu es dans le classement du jour : '+n, dyLeft:'Tournoi non terminé, l’essai est perdu', dyNext:t=>'Prochain draft dans '+t, dyH:'h', dyM:'min', dyRank:(r,t)=>'Ta place : '+r+' sur '+t, dyEmpty:'Personne n’a encore joué aujourd’hui. Sois le premier.', dyHonest:'Le résultat est envoyé par le navigateur du joueur ; le serveur ne le recalcule pas.'});
Object.assign(I18N.it, {dyNickBad:"Questo nome non è ammesso in classifica, scegline un altro", dyTitleW:'Draft del giorno', dyTag:'Ogni giorno', dyTitle:n=>'Draft del giorno #'+n, dySub:'Ogni giorno una stagione a caso: pack tuoi, ma solo giocatori di quel periodo. Un solo tentativo, la classifica del giorno va per forza della squad.', dyRules:'squad · tutte le regioni · 12 partite', dyPlayers:y=>'giocatori del '+y, dyOnce:'Un solo tentativo: dopo «Entra nel torneo» non si rigioca.', dyPlay:'Gioca', dyBoard:'Classifica del giorno', dyShare:'Condividi', dyCopied:'Copiato', dyPts:'pt', dyNick:'Nome per la classifica', dySend:'Invia', dySent:n=>'Sei nella classifica del giorno come '+n, dyLeft:'Torneo non finito, tentativo usato', dyNext:t=>'Nuovo draft tra '+t, dyH:'h', dyM:'min', dyRank:(r,t)=>'Il tuo posto: '+r+' su '+t, dyEmpty:'Oggi non ha ancora giocato nessuno. Sii il primo.', dyHonest:'Il risultato lo invia il browser del giocatore; il server non lo ricalcola.'});
Object.assign(I18N.pt, {dyNickBad:"Esse nick não é aceito no ranking, escolha outro", dyTitleW:'Draft do dia', dyTag:'Todo dia', dyTitle:n=>'Draft do dia #'+n, dySub:'Uma temporada aleatória por dia: packs só seus, mas apenas jogadores daquele período. Uma tentativa, o ranking do dia é pela força do squad.', dyRules:'squad · todas as regiões · 12 partidas', dyPlayers:y=>'jogadores de '+y, dyOnce:'Uma tentativa só: depois de “Entrar no torneio” não dá para jogar de novo.', dyPlay:'Jogar', dyBoard:'Ranking do dia', dyShare:'Compartilhar', dyCopied:'Copiado', dyPts:'pts', dyNick:'Nick para o ranking', dySend:'Enviar', dySent:n=>'Você está no ranking do dia como '+n, dyLeft:'Torneio não terminado, tentativa usada', dyNext:t=>'Próximo draft em '+t, dyH:'h', dyM:'min', dyRank:(r,t)=>'Sua posição: '+r+' de '+t, dyEmpty:'Ninguém jogou hoje ainda. Seja o primeiro.', dyHonest:'O resultado é enviado pelo navegador do jogador; o servidor não o recalcula.'});
/* Пресс-конференции (16.10): строки ленты — тексты в PRESS_TXT на открытом языке, ключ один (английский словарь лежит
   под каждым языком в L()). */
Object.assign(I18N.en, {ccPostPress:(me,sit,ai,p,n,r,mate,g)=>ccPressPostText(me,sit,ai,p,n,r,mate,g),
  ccPostPressRival:(r,me,v)=>ccPressT().rival[(v||0)%3](me),
  ccPostPressKept:(me,g)=>ccPressT().kept(me, (ccPressT().goalName||{})[g]||g),
  ccPostPressBroke:(me,g,p)=>ccPressT().broke(me, (ccPressT().goalName||{})[g]||g, p)});
/* Личка после вечера (16.10, ccKinchDm / ccStaffAfterNight). v — номер варианта фразы, чтобы не повторялись. */
Object.assign(I18N.en, {
  dmKinchYouAsk:who=>who ? 'Break down @'+who+"'s night" : 'Break down my night',
  ccDmKinchOne:(lbl,r)=>'🏆 '+String(lbl)+' 🏆\n👤 '+(r[0] ? '@'+r[0] : 'You')+'\n🎯 Elims: '+r[1]+'\n💥 Damage: ≈'+ccNum(r[2])+'\n🩸 Taken: ≈'+ccNum(r[3])+
    '\n⏱️ Time alive: ≈'+r[4]+'\n📍 Avg place: '+r[5]+'\n🔟 Top 10s: '+r[6]+'\n👑 Wins: '+r[7]+'\n⭐ Points: '+r[8],
  ccDmKinchSum:(lbl,p,g,avg,el,pg,rk)=>'📊 '+esc(String(lbl))+': #'+p+'. '+g+' games, avg placement '+avg+', '+el+' elims ('+pg+' per game) — #'+rk+' in the lobby by elims.',
  ccDmKinchCmp:rows=>'Inside the squad: '+(rows||[]).map(r=>(r[4] ? 'you' : '@'+esc(r[0]))+' — '+r[1]+' elims, '+ccNum(r[2])+' dmg ('+r[3]+'%)').join(' · '),
  ccDmKinchVerdict:(who,me,sh,v)=>me ? ['You carried tonight: '+sh+'% of the squad damage was yours.','Top fragger of the squad — you, '+sh+'% of the damage.'][v%2]
    : ['@'+esc(who)+' led the squad with '+sh+'% of the damage. Your fights are where the points are.','Top fragger: @'+esc(who)+' ('+sh+'%). Worth watching how he takes fights.'][v%2],
  ccDmCoachNight:(ok,n,cause,v)=>(n ? ['We followed the plan '+ok+' of '+n+' times. ','Plan check: '+ok+'/'+n+'. ','You stuck to the plan '+ok+'/'+n+'. ','Plan: '+ok+' of '+n+'. '][v%4] : '')+(cause ? (L()['evTip_'+cause]||'') : ['Good work tonight.','Let’s keep this up.'][v%2]),
  ccDmAnStorm:(s,v)=>['You died in the storm '+s+' times. Rotate one circle earlier — by the second zone it is already late.','Storm deaths: '+s+'. Your rotations start too late, move on the first close.','We lost '+s+' games to the storm. I would leave POI 20 seconds earlier.','Zone killed us '+s+' times tonight. Earlier rotations, fewer fights on the way.'][v%4],
  ccDmAnDrop:(d,v)=>['Off spawn twice ('+d+'). Either the drop is contested or we fight too early.','We died on drop '+d+' times. Let’s look at a quieter spot for a week.','Drop fights cost us '+d+' games. Numbers say: avoid the contest.','Early deaths: '+d+'. Land, loot, then take the fight.'][v%4],
  ccDmAnFights:(k,v)=>['Lost '+k+' fights tonight. Take fights with the height and full mats only.','You died in fights '+k+' times. Too many third-party situations — reset more.','Fight deaths: '+k+'. Fewer open-field fights, more boxes.','We lose fights after rotations — '+k+' times. Heal up before you push.'][v%4],
  ccDmAnGood:(a,v)=>['Avg placement '+a+'. This is the level — now add elims in the mid game.','Solid night, avg '+a+'. Survival is there, damage can be higher.','Avg placement '+a+'. Repeat this and the points come by themselves.','Numbers look good: avg '+a+'. Keep the same rotations.'][v%4],
  ccDmPsyBad:v=>['One bad night is one night. Write down one mistake and one good thing — then close the game.','Don’t scroll the feed tonight. Sleep, water, tomorrow with a clear head.','If you tilt — 10 minutes without a screen before the next game. Every time.','Compare yourself with you a month ago, not with the top 1.'][v%4],
  ccDmPsyWin:v=>['Congrats. Tomorrow — same routine. Don’t change what works.','Enjoy it today. Tomorrow the goal is the next game, not the next trophy.','Big night. Remember how calm you were in the endgame — that is the skill.','Well done. Sleep well, the pressure will be higher next week.'][v%4],
  ccDmPsyBurn:v=>['You are running on empty. Take a day off — the form comes back faster than from grinding.','I see the fatigue in the numbers. One rest day, no scrims, no tournaments.'][v%2],
  ccDmPsyHot:v=>['You are in form. Don’t add hours now — protect the routine.','Good streak. The trap is overthinking it — play like it is a normal day.'][v%2],
  ccDmSmmGrow:(n,big,v)=>(big ? ['+'+n+' followers tonight. Post the W while it is hot — screenshot plus one line.','+'+n+' new followers. Now is the moment: a clip from your best game.'] : ['+'+n+' followers since last time. A short post about tonight keeps them.','+'+n+' new followers. One post a day is enough, don’t spam.'])[v%2],
  ccDmSmmBad:v=>['Today better post nothing in emotions. Tomorrow — a calm line about the next goal.','Skip the feed today. Bad nights do not need a tweet.'][v%2],
  ccDmMktBrands:v=>['After nights like this brands ask about you — check the sponsors tab.','Two brands asked for your stats today. Results like this raise your price.'][v%2]});
Object.assign(I18N.ru, {
  dmKinchYouAsk:who=>who ? 'Разбери игру @'+who : 'Разбери мою игру',
  ccDmKinchSum:(lbl,p,g,avg,el,pg,rk)=>'📊 '+esc(String(lbl))+': #'+p+'. Игр: '+g+', средний плейс '+avg+', киллов: '+el+' ('+pg+' за игру) — #'+rk+' в лобби по киллам.',
  ccDmKinchCmp:rows=>'Внутри состава: '+(rows||[]).map(r=>(r[4] ? 'ты' : '@'+esc(r[0]))+' — киллы '+r[1]+', урон '+ccNum(r[2])+' ('+r[3]+'%)').join(' · '),
  ccDmKinchVerdict:(who,me,sh,v)=>me ? ['Сегодня тащил ты: '+sh+'% урона состава — твои.','Топ-фраггер состава — ты, '+sh+'% урона.'][v%2]
    : ['@'+esc(who)+' тащил: '+sh+'% урона. Очки у тебя — в файтах.','Топ-фраггер: @'+esc(who)+' ('+sh+'%). Посмотри, как он заходит в файты.'][v%2],
  ccDmCoachNight:(ok,n,cause,v)=>(n ? ['По плану сыграли '+ok+' из '+n+'. ','План: '+ok+'/'+n+'. ','Ты держался плана '+ok+'/'+n+'. ','По плану — '+ok+' из '+n+'. '][v%4] : '')+(cause ? (L()['evTip_'+cause]||'') : ['Хорошая работа сегодня.','Так и держим.'][v%2]),
  ccDmAnStorm:(s,v)=>['Смертей в шторме: '+s+'. Ротируй на круг раньше — на второй зоне уже поздно.','Шторм: '+s+' смерти за вечер. Ротации начинаются поздно — выходи на первом сужении.','Игр, отданных шторму: '+s+'. Я бы уходил с точки на 20 секунд раньше.','Зона забрала у нас игр: '+s+'. Раньше ротации, меньше файтов по пути.'][v%4],
  ccDmAnDrop:(d,v)=>['Смертей на высадке: '+d+'. Либо точку контестят, либо мы рано лезем в файт.','Падений на дропе: '+d+'. Давай неделю на более тихой точке.','Игр, проигранных на высадке: '+d+'. Цифры говорят: без контеста.','Ранних смертей: '+d+'. Сначала лут, потом файт.'][v%4],
  ccDmAnFights:(k,v)=>['Проиграно файтов: '+k+'. Заходи с высотой и полными метсами.','Смертей в файтах: '+k+'. Слишком много третьих — чаще ресетай.','Файтов в минус: '+k+'. Меньше драк в открытую, больше боксов.','Проигранных файтов после ротаций: '+k+'. Сначала хил, потом пуш.'][v%4],
  ccDmAnGood:(a,v)=>['Средний плейс '+a+'. Это уровень — теперь добавь киллы в середине игры.','Ровный вечер, средний '+a+'. Выживание есть, урона можно больше.','Средний плейс '+a+'. Повтори — и очки придут сами.','Цифры хорошие: средний '+a+'. Ротации те же.'][v%4],
  ccDmPsyBad:v=>['Один плохой вечер — это один вечер. Запиши одну ошибку и одну хорошую вещь — и закрой игру.','Не листай ленту сегодня. Сон, вода, завтра с чистой головой.','Если тильт — 10 минут без экрана перед следующей игрой. Каждый раз.','Сравнивай себя с собой месяц назад, а не с топ-1.'][v%4],
  ccDmPsyWin:v=>['Поздравляю. Завтра — тот же режим. Не меняй то, что работает.','Порадуйся сегодня. Завтра цель — следующая игра, не следующий кубок.','Сильный вечер. Запомни, как спокойно ты играл концовку — это и есть навык.','Молодец. Выспись — на следующей неделе давление будет выше.'][v%4],
  ccDmPsyBurn:v=>['Ты на износе. Возьми день отдыха — форма вернётся быстрее, чем от гринда.','Вижу усталость по цифрам. Один день отдыха: без скримов и турниров.'][v%2],
  ccDmPsyHot:v=>['Ты в форме. Не добавляй часы сейчас — береги режим.','Хорошая серия. Ловушка — начать загоняться. Играй как в обычный день.'][v%2],
  ccDmSmmGrow:(n,big,v)=>(big ? ['Подписчиков за вечер: +'+n+'. Запости W, пока горячо — скрин и одна строка.','Новых подписчиков: +'+n+'. Сейчас момент: клип с лучшей игры.'] : ['Подписчиков с прошлого раза: +'+n+'. Короткий пост о вечере их удержит.','Новых подписчиков: +'+n+'. Одного поста в день хватит, не спамь.'])[v%2],
  ccDmSmmBad:v=>['Сегодня лучше ничего не постить на эмоциях. Завтра — спокойная строка про следующую цель.','Пропусти ленту сегодня. Плохому вечеру твит не нужен.'][v%2],
  ccDmMktBrands:v=>['После таких вечеров бренды спрашивают про тебя — загляни в спонсоров.','Два бренда сегодня просили твою стату. Такие результаты поднимают твою цену.'][v%2]});
/* Хотфиксы, связь, выплаты (16.10, careerHotfixTick / ccTechToday / careerPayTick). */
Object.assign(I18N.en, {ccPayPend:'pending', ccPayNext:d=>'next '+d, ccPayPendAll:'Prize money arrives 30 days after the event. Tap for all payouts', ccTechLbl:'Connection',
  ccDmPayout:(sum,n)=>'Your payout of $'+sum+' for '+n+(n===1?' event':' events')+' has been sent. Thanks for competing!',
  ccNewsHotfix:(w,v)=>['Competitive hotfix: '+w+' is disabled in tournaments for the rest of the season.','Hotfix is live: '+w+' has been removed from competitive playlists.','Update: '+w+' is now unvaulted from comp… just kidding, it is disabled for the rest of the season.'][v%2],
  ccPostTechNet:v=>['internet is dying today 💀 playing on 80 ping','my wifi picked the worst day possible','packet loss on cup day. love it'][v%3],
  ccNewsRehost:g=>'Game '+g+' of tonight’s session was re-hosted due to server issues. Points from the original game are void.',
  ccNewsTeamingDq:(a,b)=>'@'+a+' and @'+b+' have been disqualified from tonight’s event for teaming.'});
Object.assign(I18N.ru, {ccPayPend:'ожидается', ccPayNext:d=>'ближайшая '+d, ccPayPendAll:'Призовые приходят через 30 дней после турнира. Нажми — все выплаты с датами', ccTechLbl:'Связь',
  ccDmPayout:(sum,n)=>'Выплата $'+sum+' за турниры ('+n+') отправлена. Спасибо за участие!',
  ccNewsHotfix:(w,v)=>['Хотфикс компетитива: '+w+' отключён в турнирах до конца сезона.','Хотфикс вышел: '+w+' убран из соревновательных плейлистов.'][v%2],
  ccPostTechNet:v=>['интернет умирает сегодня 💀 играю на 80 пинге','вайфай выбрал худший день','потеря пакетов в день капа. обожаю'][v%3],
  ccNewsRehost:g=>'Игра '+g+' сегодняшней сессии перехощена из-за проблем с сервером. Очки исходной игры аннулированы.',
  ccNewsTeamingDq:(a,b)=>'@'+a+' и @'+b+' дисквалифицированы с сегодняшнего турнира за тиминг.'});
/* Обучение новичка (27.10, ccTourStart): семь шагов по хабу карьеры. Немецкий и испанский — английские до доперевода. */
Object.assign(I18N.en, {lfPlanH:'Week plan', lfPlanOff:p=>'optional: a focus (+'+p+'% to one stat) and a goal', ccTourBtn:'How to play', ccTourNext:'Next', ccTourDone:'Got it', ccTourSkip:'Skip the tour',
  ccTourOvr:'Your rating. A career is about raising it: train every day and do well in tournaments.',
  ccTourEnergy:'Energy. Training and everything else you do in a day costs energy. A new day gives it back.',
  ccTourDay:'Today. Tap a stat to train it, or pick scrims, a stream or rest below. Each costs energy. "More" has Creative maps and a part-time job.',
  ccDayMore:'More', ccDayDid:'Today:', ccActGrpMaps:'Creative maps',
  ccTourSeason:'Your season on the real FNCS calendar. Highlighted days are tournaments. "A week" and "A month" play the days for you.',
  ccTourGo:'When you are ready, this takes you to the next tournament day. There you press Play.',
  ccTourMate:'This is a duos season, so you need a partner to enter team tournaments. Find one here.',
  ccTourTabs:'Everything else (club, shop, media, locker) can wait. Open this tour again any time with "How to play" at the bottom.'});
Object.assign(I18N.ru, {lfPlanH:'План недели', lfPlanOff:p=>'по желанию: фокус (+'+p+'% к одному параметру) и цель', ccTourBtn:'Как играть', ccTourNext:'Дальше', ccTourDone:'Понятно', ccTourSkip:'Пропустить',
  ccTourOvr:'Твой рейтинг. Вся карьера про то, чтобы его поднять: тренироваться каждый день и хорошо играть турниры.',
  ccTourEnergy:'Энергия. Тренировки и всё остальное за день тратят её. Новый день её возвращает.',
  ccTourDay:'Сегодня. Нажми на параметр, чтобы его потренировать, или выбери ниже скримы, стрим, отдых. Всё тратит энергию. В «Ещё» карты Creative и подработка.',
  ccDayMore:'Ещё', ccDayDid:'Сегодня:', ccActGrpMaps:'Карты Creative',
  ccTourSeason:'Твой сезон по настоящему календарю FNCS. Выделенные дни это турниры. «Неделю» и «Месяц» проигрывают дни за тебя.',
  ccTourGo:'Когда будешь готов, эта кнопка перенесёт к ближайшему дню турнира. Там жмёшь «Играть».',
  ccTourMate:'Сезон дуо: на командные турниры нужен напарник. Найди его здесь.',
  ccTourTabs:'Всё остальное (клуб, магазин, медиа, шкафчик) может подождать. Открыть этот тур снова можно кнопкой «Как играть» внизу.'});
Object.assign(I18N.fr, {lfPlanH:'Plan de la semaine', lfPlanOff:p=>'facultatif : un focus (+'+p+' % sur une stat) et un objectif', ccTourBtn:'Comment jouer', ccTourNext:'Suivant', ccTourDone:'Compris', ccTourSkip:'Passer',
  ccTourOvr:'Ta note. Une carrière, c’est la faire monter : t’entraîner chaque jour et bien jouer les tournois.',
  ccTourEnergy:'L’énergie. L’entraînement et tout ce que tu fais dans la journée en coûtent. Un nouveau jour la rend.',
  ccTourDay:'Aujourd’hui. Touche une stat pour l’entraîner, ou choisis plus bas scrims, stream ou repos. Tout coûte de l’énergie. « Plus » contient les cartes Creative et le petit boulot.',
  ccDayMore:'Plus', ccDayDid:'Aujourd’hui :', ccActGrpMaps:'Cartes Creative',
  ccTourSeason:'Ta saison sur le vrai calendrier FNCS. Les jours mis en avant sont des tournois. « Une semaine » et « Un mois » jouent les jours pour toi.',
  ccTourGo:'Quand tu es prêt, ce bouton t’emmène au prochain jour de tournoi. Là, tu appuies sur Jouer.',
  ccTourMate:'Saison en duo : il te faut un partenaire pour les tournois en équipe. Trouve-le ici.',
  ccTourTabs:'Tout le reste (club, boutique, médias, casier) peut attendre. Relance ce tour quand tu veux avec « Comment jouer » en bas.'});
Object.assign(I18N.it, {lfPlanH:'Piano della settimana', lfPlanOff:p=>'facoltativo: un focus (+'+p+'% a una statistica) e un obiettivo', ccTourBtn:'Come si gioca', ccTourNext:'Avanti', ccTourDone:'Capito', ccTourSkip:'Salta',
  ccTourOvr:'Il tuo rating. Una carriera serve a farlo salire: allenati ogni giorno e gioca bene i tornei.',
  ccTourEnergy:'Energia. Allenamenti e tutto ciò che fai in un giorno la consumano. Un nuovo giorno la restituisce.',
  ccTourDay:'Oggi. Tocca una statistica per allenarla, oppure scegli sotto scrim, stream o riposo. Tutto costa energia. In «Altro» ci sono le mappe Creative e il lavoretto.',
  ccDayMore:'Altro', ccDayDid:'Oggi:', ccActGrpMaps:'Mappe Creative',
  ccTourSeason:'La tua stagione sul vero calendario FNCS. I giorni evidenziati sono tornei. «A week» e «A month» giocano i giorni per te.',
  ccTourGo:'Quando sei pronto, questo pulsante ti porta al prossimo giorno di torneo. Lì premi Gioca.',
  ccTourMate:'Stagione in duo: per i tornei a squadre serve un compagno. Trovalo qui.',
  ccTourTabs:'Tutto il resto (club, negozio, media, armadietto) può aspettare. Riapri questo tour quando vuoi con «Come si gioca» in basso.'});
Object.assign(I18N.pt, {lfPlanH:'Plano da semana', lfPlanOff:p=>'opcional: um foco (+'+p+'% em um atributo) e uma meta', ccTourBtn:'Como jogar', ccTourNext:'Próximo', ccTourDone:'Entendi', ccTourSkip:'Pular',
  ccTourOvr:'Seu rating. A carreira é sobre subir ele: treinar todo dia e jogar bem os torneios.',
  ccTourEnergy:'Energia. Treinos e tudo que você faz no dia gastam energia. Um novo dia devolve.',
  ccTourDay:'Hoje. Toque em um atributo para treinar, ou escolha abaixo scrims, live ou descanso. Tudo gasta energia. Em "Mais" ficam os mapas Creative e o trabalho.',
  ccDayMore:'Mais', ccDayDid:'Hoje:', ccActGrpMaps:'Mapas Creative',
  ccTourSeason:'Sua temporada no calendário real da FNCS. Os dias destacados são torneios. "A week" e "A month" jogam os dias por você.',
  ccTourGo:'Quando estiver pronto, este botão leva ao próximo dia de torneio. Lá você aperta Jogar.',
  ccTourMate:'Temporada de duos: você precisa de uma dupla para torneios em equipe. Encontre aqui.',
  ccTourTabs:'Todo o resto (clube, loja, mídia, armário) pode esperar. Abra este tour de novo quando quiser em "Como jogar" lá embaixo.'});
/* Слухи, опросы, ветки (16.10, careerRumorTick / careerPollTick / ccPostComments). */
Object.assign(I18N.en, {
  ccPostRumorPair:(a,b,v)=>['sources: @'+a+' and @'+b+' have been scrimming together 👀 duo next season?','hearing @'+a+' x @'+b+' is a thing for next season. thoughts?','👀 @'+a+' and @'+b+' in the same customs again. something is cooking'][v%3],
  ccPostRumorYou:(me,v)=>['hearing @'+me+' is on a few orgs’ radar after this week 👀','multiple orgs asked about @'+me+' after the last cup. stay tuned','@'+me+' could be the next unsigned player to get picked up 👀'][v%3],
  ccPostRumorDrama:(a,b,v)=>['@'+a+' and @'+b+' going at it in the replies after last night 🍿','things got heated between @'+a+' and @'+b+' in the cup lobby 🍿','@'+a+' vs @'+b+' beef is back on the timeline 🍿'][v%3],
  ccPostRumorTrue:(a,b)=>'called it ✅ @'+a+' x @'+b+' confirmed',
  ccPostPollWin:ev=>'Who wins '+ev+'? 🏆',
  ccCoRumorMe:['🤫','no comment','fake news','maybe 👀','lol','who told you this','👀'],
  ccCoRumor:['source?','cap','👀👀','would be cracked','no way','trust me bro','this account is never right','W if true','not happening'],
  ccCoPoll:['voted','easy pick','first option is free','sleeper pick: last one','where is my guy','this poll is rigged','hard one'],
  ccCoDefend:['who asked','check the scoreboard','ratio','imagine saying this','stay mad','he’s top 10 in the region btw','L take','go play the cup yourself'],
  ccCoHateBack:['cope','ok bro','we’ll see','fanboy','relax','whatever helps you sleep'],
  ccCoBanter:['fr','real','this','+1','no shot','facts','nah']});
Object.assign(I18N.ru, {
  ccPostRumorPair:(a,b,v)=>['источники: @'+a+' и @'+b+' скримятся вместе 👀 дуо на следующий сезон?','слышал, @'+a+' x @'+b+' будут играть в следующем сезоне. что думаете?','👀 @'+a+' и @'+b+' опять в одних кастомках. что-то готовится'][v%3],
  ccPostRumorYou:(me,v)=>['слышал, @'+me+' на радаре у нескольких оргов после этой недели 👀','после прошлого капа про @'+me+' спрашивали сразу несколько оргов. ждём','@'+me+' может стать следующим подписанным 👀'][v%3],
  ccPostRumorDrama:(a,b,v)=>['@'+a+' и @'+b+' сцепились в ответах после вчерашнего 🍿','между @'+a+' и @'+b+' стало жарко в лобби капа 🍿','бифф @'+a+' vs @'+b+' снова в ленте 🍿'][v%3],
  ccPostRumorTrue:(a,b)=>'я же говорил ✅ @'+a+' x @'+b+' подтверждено',
  ccPostPollWin:ev=>'Кто выиграет '+ev+'? 🏆',
  ccCoRumorMe:['🤫','без комментариев','фейк','может быть 👀','лол','кто тебе такое сказал','👀'],
  ccCoRumor:['источник?','кап','👀👀','было бы жёстко','не может быть','верь мне бро','этот акк никогда не прав','W если правда','не будет такого'],
  ccCoPoll:['проголосовал','лёгкий выбор','первый вариант бесплатный','тёмная лошадка — последний','где мой игрок','опрос подкручен','сложно'],
  ccCoDefend:['кто спрашивал','посмотри таблицу','ратио','представь такое написать','бесись дальше','он топ-10 региона кстати','слабый тейк','иди сам сыграй кап'],
  ccCoHateBack:['копиум','ок бро','посмотрим','фанат','расслабься','как скажешь'],
  ccCoBanter:['реально','факт','вот','+1','не','база','неа']});
/* Ответы под постами своего вида (16.10, см. CC_CO_BY_KIND): статистика, новый сезон, подкол, цитата с пресс-конференции.
   Остальные языки берут английский — на X сцена и так отвечает по-английски. */
Object.assign(I18N.en, {ccPostLfdWantAny:(h,d)=>['LFD. Div '+d+' and up. DMs open','looking for a duo, div '+d+'+. dms open','LFD 🙏 div '+d+' or higher, hmu'][ccHashStr(String(h))%3],
  ccCoStat:['insane numbers','who was #1 in elims?','kinch the goat 🐐','those elims 📈','bookmarking this','that avg placement 👀','numbers dont lie','pls do this every cup'],
  ccCoMeta:['pool looks good','pump back pls 🙏','rip my drop spot','we will see in scrims','meta is so mid 💀','finally a new map','who else hates this pool','surge is gonna be crazy'],
  ccCoTaunt:['💀💀','he is cooking you','ratio','get him in scrims','🤣🤣','free elims bro…','you are not safe','reply @ him'],
  ccCoPress:['W mentality','bold','he means it','we will see 👀','humble 🙏','talk is cheap','clip this','respect the honesty']});
Object.assign(I18N.ru, {ccPostLfdWantAny:(h,d)=>'LFD. Дивизион '+d+' и выше. Пишите в лс',
  ccCoStat:['цифры безумные','кто первый по киллам?','кинч лучший 🐐','эти киллы 📈','сохранил','средний плейс 👀','цифры не врут','делай так каждый кап'],
  ccCoMeta:['пул норм','верните помпу 🙏','прощай моя точка','посмотрим на скримах','мета мид 💀','наконец новая карта','кто ещё ненавидит этот пул','сюрдж будет жёсткий'],
  ccCoTaunt:['💀💀','он тебя готовит','ратио','поймай его на скримах','🤣🤣','бесплатные киллы…','ты не в безопасности','ответь ему'],
  ccCoPress:['менталка W','смело','он серьёзно','посмотрим 👀','скромно 🙏','слова ничего не стоят','клипни это','уважаю честность']});
/* Прорыв (28.10, идея игрока в Notion «27.10»: «random ai can become good from 1 breakthrough tournament»). */
Object.assign(I18N.en, {ccPostBreakout:(tags,place,v)=>['Out of nowhere: '+tags+', #'+place+' tonight. Remember the name, this is a breakout 📈','Nobody had '+tags+' on the radar. #'+place+' tonight. Looks like the scene has a new star ⭐','#'+place+' for '+tags+'. A week ago nobody knew them. Breakout run 🚀'][v%3]});
Object.assign(I18N.ru, {ccPostBreakout:(tags,place,v)=>['Из ниоткуда: '+tags+', #'+place+' за вечер. Запомните ник, это прорыв 📈','Никто не ставил на '+tags+'. #'+place+' сегодня. Похоже, у сцены новая звезда ⭐','#'+place+' у '+tags+'. Неделю назад их никто не знал. Прорыв 🚀'][v%3]});
Object.assign(I18N.fr, {ccPostBreakout:(tags,place,v)=>['Sorti de nulle part : '+tags+', #'+place+' ce soir. Retenez ce nom, c’est une révélation 📈','Personne ne voyait venir '+tags+'. #'+place+' ce soir. La scène tient une nouvelle star ⭐','#'+place+' pour '+tags+'. Il y a une semaine, personne ne les connaissait 🚀'][v%3]});
Object.assign(I18N.it, {ccPostBreakout:(tags,place,v)=>['Dal nulla: '+tags+', #'+place+' stasera. Ricordatevi questo nome, è un exploit 📈','Nessuno puntava su '+tags+'. #'+place+' stasera. La scena ha una nuova stella ⭐','#'+place+' per '+tags+'. Una settimana fa nessuno li conosceva 🚀'][v%3]});
Object.assign(I18N.pt, {ccPostBreakout:(tags,place,v)=>['Do nada: '+tags+', #'+place+' hoje. Lembrem desse nome, é uma revelação 📈','Ninguém apostava em '+tags+'. #'+place+' hoje. A cena tem uma nova estrela ⭐','#'+place+' para '+tags+'. Uma semana atrás ninguém os conhecia 🚀'][v%3]});
/* Удача зон, спор «кто лучше», серия страны (28.10, его «357» по X после Solo FNCS). */
Object.assign(I18N.en, {
  ccPostZoneLuck:(n,g,b,v)=>(n*2>=g ? ['zones on my side tonight: '+n+'/'+g+'. No excuses for anyone', n+'/'+g+' zones came to me. Best game #'+b, 'the zone loved me tonight: '+n+'/'+g]
                                    : ['pulled '+n+'/'+g+' zones tonight. Best game #'+b+', not much you can do without zones', n+'/'+g+' on zones tonight. Crossed half the map every game', 'zone luck tonight: '+n+'/'+g+'. On to the next'])[v%3],
  ccNewsZoneLuck:(ev,list)=>'ZONE LUCK · '+(ev!=null?ev+', ':'')+'top 10, endgames where the zone came to them: '+(list||[]).map(r=>'#'+r[0]+' '+r[1]+' '+r[2]+'/'+r[3]).join(' · '),
  ccPostDebate:(a,b,v)=>{ const s=x=>'@'+x[0]+': #'+x[1]+' PR'+(x[2]?', $'+ccNum(x[2])+' this year':'')+(x[3]?', '+x[3]+(x[3]===1?' cup':' cups'):'');
    return ["Let's end the debate. "+s(a)+'. '+s(b)+". Who's better?", 'Settle it. '+s(a)+' vs '+s(b)+'.'][v%2]; },
  ccNewsNatStreak:(nat,k,ev,v)=>{ const nm=natDisplay(nat);
    return ['The last '+k+' big finals were won by a team with a player from '+nm+' (latest: '+ev+'). Is '+nm+' the best nation in Fortnite right now?', nm+' again. '+k+' big finals in a row with a player from '+nm+' on the winning team. Is anyone stopping them?'][v%2]; }
});
Object.assign(I18N.ru, {
  ccPostZoneLuck:(n,g,b,v)=>(n*2>=g ? ['зоны сегодня за меня: '+n+'/'+g+'. Оправданий нет ни у кого', n+'/'+g+' зон пришли ко мне. Лучшая игра #'+b, 'зона сегодня меня любит: '+n+'/'+g]
                                    : ['зона пришла '+n+'/'+g+' за вечер. Лучшая игра #'+b+', без зон много не сделаешь', n+'/'+g+' по зонам сегодня. Каждую игру ехал через полкарты', 'удача зон за вечер: '+n+'/'+g+'. Дальше'])[v%3],
  ccNewsZoneLuck:(ev,list)=>'УДАЧА ЗОН · '+(ev!=null?ev+', ':'')+'топ-10, в скольких эндгеймах зона пришла к ним: '+(list||[]).map(r=>'#'+r[0]+' '+r[1]+' '+r[2]+'/'+r[3]).join(' · '),
  ccPostDebate:(a,b,v)=>{ const s=x=>'@'+x[0]+': #'+x[1]+' в PR'+(x[2]?', $'+ccNum(x[2])+' за год':'')+(x[3]?', кубков: '+x[3]:'');
    return ['Закроем спор. '+s(a)+'. '+s(b)+'. Кто лучше?', 'Решайте. '+s(a)+' против '+s(b)+'.'][v%2]; },
  ccNewsNatStreak:(nat,k,ev,v)=>{ const nm=natDisplay(nat);
    return ['Крупных финалов подряд, где в составе победителей игрок из страны '+nm+': '+k+' (последний: '+ev+'). '+nm+' сейчас лучшая страна в Fortnite?', 'Снова '+nm+'. Уже '+k+' крупных финала подряд победитель с игроком из этой страны. Их кто-нибудь остановит?'][k>=5 ? 0 : v%2]; }
});
Object.assign(I18N.fr, {
  ccPostZoneLuck:(n,g,b,v)=>(n*2>=g ? ['les zones pour moi ce soir : '+n+'/'+g+'. Aucune excuse pour personne', n+'/'+g+' zones venues à moi. Meilleure game #'+b, 'la zone m’aime ce soir : '+n+'/'+g]
                                    : ['zone venue '+n+'/'+g+' ce soir. Meilleure game #'+b+', sans zones on ne fait pas grand-chose', n+'/'+g+' en zones ce soir. Toute la soirée à traverser la map', 'chance de zone ce soir : '+n+'/'+g+'. Au suivant'])[v%3],
  ccNewsZoneLuck:(ev,list)=>'CHANCE DE ZONE · '+(ev!=null?ev+', ':'')+'top 10, endgames où la zone est venue à eux : '+(list||[]).map(r=>'#'+r[0]+' '+r[1]+' '+r[2]+'/'+r[3]).join(' · '),
  ccPostDebate:(a,b,v)=>{ const s=x=>'@'+x[0]+' : n°'+x[1]+' PR'+(x[2]?', $'+ccNum(x[2])+' cette année':'')+(x[3]?', '+x[3]+(x[3]===1?' coupe':' coupes'):'');
    return ['Mettons fin au débat. '+s(a)+'. '+s(b)+'. Qui est le meilleur ?', 'Tranchez. '+s(a)+' contre '+s(b)+'.'][v%2]; },
  ccNewsNatStreak:(nat,k,ev,v)=>{ const nm=natDisplay(nat);
    return ['Les '+k+' dernières grandes finales ont été gagnées par une équipe avec un joueur de '+nm+' (dernière : '+ev+'). '+nm+', meilleure nation de Fortnite en ce moment ?', nm+' encore. '+k+' grandes finales de suite avec un joueur de '+nm+' dans l’équipe gagnante. Qui va les arrêter ?'][v%2]; }
});
Object.assign(I18N.it, {
  ccPostZoneLuck:(n,g,b,v)=>(n*2>=g ? ['zone dalla mia stasera: '+n+'/'+g+'. Nessuna scusa per nessuno', n+'/'+g+' zone arrivate da me. Partita migliore #'+b, 'la zona mi ama stasera: '+n+'/'+g]
                                    : ['zona arrivata '+n+'/'+g+' stasera. Partita migliore #'+b+', senza zone si fa poco', n+'/'+g+' di zone stasera. Tutta la sera ad attraversare la mappa', 'fortuna con le zone stasera: '+n+'/'+g+'. Avanti'])[v%3],
  ccNewsZoneLuck:(ev,list)=>'FORTUNA CON LE ZONE · '+(ev!=null?ev+', ':'')+'top 10, endgame in cui la zona è arrivata da loro: '+(list||[]).map(r=>'#'+r[0]+' '+r[1]+' '+r[2]+'/'+r[3]).join(' · '),
  ccPostDebate:(a,b,v)=>{ const s=x=>'@'+x[0]+': #'+x[1]+' PR'+(x[2]?', $'+ccNum(x[2])+' quest’anno':'')+(x[3]?', '+x[3]+(x[3]===1?' coppa':' coppe'):'');
    return ['Chiudiamo il dibattito. '+s(a)+'. '+s(b)+'. Chi è più forte?', 'Decidete voi. '+s(a)+' contro '+s(b)+'.'][v%2]; },
  ccNewsNatStreak:(nat,k,ev,v)=>{ const nm=natDisplay(nat);
    return ['Le ultime '+k+' grandi finali le ha vinte una squadra con un giocatore di '+nm+' (l’ultima: '+ev+'). '+nm+' è la nazione migliore di Fortnite adesso?', nm+' ancora. '+k+' grandi finali di fila con un giocatore di '+nm+' tra i vincitori. Chi li ferma?'][v%2]; }
});
Object.assign(I18N.pt, {
  ccPostZoneLuck:(n,g,b,v)=>(n*2>=g ? ['zonas do meu lado hoje: '+n+'/'+g+'. Sem desculpa pra ninguém', n+'/'+g+' zonas vieram até mim. Melhor partida #'+b, 'a zona me ama hoje: '+n+'/'+g]
                                    : ['zona veio '+n+'/'+g+' hoje. Melhor partida #'+b+', sem zona não dá pra fazer muito', n+'/'+g+' de zonas hoje. A noite toda atravessando o mapa', 'sorte de zona hoje: '+n+'/'+g+'. Próxima'])[v%3],
  ccNewsZoneLuck:(ev,list)=>'SORTE DE ZONA · '+(ev!=null?ev+', ':'')+'top 10, endgames em que a zona veio até eles: '+(list||[]).map(r=>'#'+r[0]+' '+r[1]+' '+r[2]+'/'+r[3]).join(' · '),
  ccPostDebate:(a,b,v)=>{ const s=x=>'@'+x[0]+': #'+x[1]+' PR'+(x[2]?', $'+ccNum(x[2])+' este ano':'')+(x[3]?', '+x[3]+(x[3]===1?' copa':' copas'):'');
    return ['Vamos encerrar o debate. '+s(a)+'. '+s(b)+'. Quem é melhor?', 'Decidam. '+s(a)+' contra '+s(b)+'.'][v%2]; },
  ccNewsNatStreak:(nat,k,ev,v)=>{ const nm=natDisplay(nat);
    return ['As últimas '+k+' grandes finais foram vencidas por um time com um jogador de '+nm+' (a última: '+ev+'). '+nm+' é a melhor nação do Fortnite agora?', nm+' de novo. '+k+' grandes finais seguidas com um jogador de '+nm+' no time campeão. Alguém para eles?'][v%2]; }
});
/* Особые карточки 97/98/99 (16.10). */
Object.assign(I18N.ru, {formWhyLanwin:'чемпион ЛАНа', formWhyPoty:'игрок года'});
Object.assign(I18N.en, {formWhyLanwin:'LAN champion', formWhyPoty:'player of the year'});
Object.assign(I18N.fr, {formWhyLanwin:'champion d’un LAN', formWhyPoty:'joueur de l’année'});
Object.assign(I18N.it, {formWhyLanwin:'campione di una LAN', formWhyPoty:'giocatore dell’anno'});
Object.assign(I18N.pt, {formWhyLanwin:'campeão de LAN', formWhyPoty:'jogador do ano'});
/* Главная 15.10: «Продолжить», «С другом», «Сцена сейчас», «Игроки сайта». Остальные языки — английские до доперевода. */
Object.assign(I18N.ru, {hmContinue:'Продолжить', hmContinueSub:'Твои сохранения — с того дня, где остановился.', hmPlayOn:'Играть',
  hmSlotCareer:'Карьера', hmSlotMgr:'Менеджер', hmSlotLine:(s,d,e)=>'Сезон '+s+' · дивизион '+d+' · '+e, hmMgrLine:(s,c)=>'Сезон '+s+' · касса '+c,
  hmFriendsTitle:'С другом', hmFriendsSub:'Три способа играть не одному.',
  hmFriendDuo:'Одна карьера на двоих: вы в одной команде, дни идут вместе.', hmFriendCode:'Друг уже создал команду или гонку — введи его код.',
  hmFriendRace:'У каждого своя карьера, а общее лобби показывает, кто впереди.',
  hmSceneTitle:'Сцена сейчас', hmSceneSub:'Настоящий календарь FNCS 2026.', hmSceneLive:'идёт сейчас', hmSceneTomorrow:'завтра',
  hmSceneIn:n=>'через '+n+' '+(n%10===1&&n%100!==11 ? 'день' : (n%10>=2&&n%10<=4&&(n%100<10||n%100>=20)) ? 'дня' : 'дней'),
  hmSceneDone:'Сезон FNCS 2026 закончился.', hmBoardSub:'Карьеры игроков сайта по призовым.', hmBoardList:'Весь список',
  hmBoardMore:n=>'Показать '+n, hmBoardLess:'Свернуть', hmHistSub:'Прошлые драфты, рекорды и награды.'});
Object.assign(I18N.en, {hmContinue:'Continue', hmContinueSub:'Your saves, from the day you stopped.', hmPlayOn:'Play',
  hmSlotCareer:'Career', hmSlotMgr:'Manager', hmSlotLine:(s,d,e)=>'Season '+s+' · division '+d+' · '+e, hmMgrLine:(s,c)=>'Season '+s+' · cash '+c,
  hmFriendsTitle:'With a friend', hmFriendsSub:'Three ways to play with someone else.',
  hmFriendDuo:'One career for two: you are on one team and the days run together.', hmFriendCode:'Your friend already made a team or a race? Enter their code.',
  hmFriendRace:'Each of you runs your own career, and a shared lobby shows who is ahead.',
  hmSceneTitle:'The scene now', hmSceneSub:'The real FNCS 2026 calendar.', hmSceneLive:'live now', hmSceneTomorrow:'tomorrow',
  hmSceneIn:n=>'in '+n+' day'+(n===1 ? '' : 's'),
  hmSceneDone:'The FNCS 2026 season is over.', hmBoardSub:'Careers of the players on this site, by prize money.', hmBoardList:'Full list',
  hmBoardMore:n=>'Show '+n, hmBoardLess:'Show less', hmHistSub:'Past drafts, records and awards.'});
/* Главная: два режима и драфт по годам (29.09). */
Object.assign(I18N.ru, {hmGmH:"Что есть в главном меню", hmGm1:"<b>Карьера</b>: один игрок, сезон за сезоном по настоящему календарю", hmGm2:"<b>С друзьями</b>: карьера вдвоём или гонка, у кого карьера лучше", hmGm3:"<b>Менеджер</b>: ведёшь настоящий клуб через сезон", hmGm4:"<b>Драфт</b>: собираешь состав из настоящих карточек и играешь турнир любого года", hmGm5:"<b>Драфт дня</b>: каждый день новый сезон, одна попытка и общая таблица", hmGm6:"<b>Компетитив</b>: настоящие турниры, календарь, результаты и live", hmGm7:"<b>Аккаунт</b>: твой профиль и сохранения в облаке", hmGuideBtn:"Как играть", hmGuideH:"Как играть", hmGuide1:"Создай игрока или возьми настоящего про", hmGuide2:"Тренируйся и выбирай, чем занять день", hmGuide3:"Играй турниры FNCS по настоящему календарю 2019–2026 и поднимайся из дивизиона 5 в дивизион 1", hmGuideGo:"Начать карьеру", hmGuideMore:"Подробнее", hmWhatIs:"Бесплатная карьера в Fortnite прямо в браузере. Ничего не нужно скачивать.", hcHeroTitle:'Стань про. <em>Сезон за сезоном.</em>', hdHeroTitle:'Собери состав. <em>Любой год FNCS.</em>', hdChipFormats:'Дуо · Трио · Сквады', hdPlay:'Играть драфт'});
Object.assign(I18N.en, {hmGmH:"What's on the main menu", hmGm1:"<b>Career</b>: one player, season after season on the real calendar", hmGm2:"<b>With friends</b>: play a duo career together or race your friends", hmGm3:"<b>Manager</b>: run a real club through a season", hmGm4:"<b>Draft</b>: build a team from real cards and play a tournament from any year", hmGm5:"<b>Daily draft</b>: a new season every day, one try, one shared table", hmGm6:"<b>Competitive</b>: real tournaments with the calendar, results and live standings", hmGm7:"<b>Account</b>: your profile and cloud saves", hmGuideBtn:"How to play", hmGuideH:"How to play", hmGuide1:"Create a player or pick a real pro", hmGuide2:"Train and choose how to spend each day", hmGuide3:"Play FNCS tournaments on the real 2019–2026 calendar and climb from Division 5 to Division 1", hmGuideGo:"Start a career", hmGuideMore:"Learn more", hmWhatIs:"Free Fortnite career game in your browser. No download.", hcHeroTitle:'Go pro. <em>Season after season.</em>', hdHeroTitle:'Build a squad. <em>Any FNCS year.</em>', hdChipFormats:'Duos · Trios · Squads', hdPlay:'Play the draft'});
Object.assign(I18N.fr, {hmGmH:"Ce qu'il y a dans le menu", hmGm1:"<b>Carrière</b> : un joueur, saison après saison sur le vrai calendrier", hmGm2:"<b>Entre amis</b> : une carrière en duo ou une course entre amis", hmGm3:"<b>Manager</b> : dirige un vrai club pendant une saison", hmGm4:"<b>Draft</b> : monte une équipe de vraies cartes et joue un tournoi de n'importe quelle année", hmGm5:"<b>Draft du jour</b> : une nouvelle saison chaque jour, un essai, un classement commun", hmGm6:"<b>Competitive</b> : les vrais tournois, avec calendrier, résultats et live", hmGm7:"<b>Compte</b> : ton profil et tes sauvegardes dans le cloud", hmGuideBtn:"Comment jouer", hmGuideH:"Comment jouer", hmGuide1:"Crée un joueur ou prends un vrai pro", hmGuide2:"Entraîne-toi et choisis comment occuper chaque journée", hmGuide3:"Joue les tournois FNCS sur le vrai calendrier 2019–2026 et monte de la Division 5 à la Division 1", hmGuideGo:"Lancer une carrière", hmGuideMore:"En savoir plus", hmWhatIs:"Jeu de carrière Fortnite gratuit dans ton navigateur. Aucun téléchargement.", hcHeroTitle:'Deviens pro. <em>Saison après saison.</em>', hdHeroTitle:'Monte ton équipe. <em>N’importe quelle année FNCS.</em>', hdChipFormats:'Duos · Trios · Squads', hdPlay:'Jouer le draft'});
Object.assign(I18N.it, {hmGmH:"Cosa c'è nel menu", hmGm1:"<b>Carriera</b>: un giocatore, stagione dopo stagione sul vero calendario", hmGm2:"<b>Con gli amici</b>: una carriera in duo o una gara tra amici", hmGm3:"<b>Manager</b>: guida un vero club per una stagione", hmGm4:"<b>Draft</b>: crea una squadra di vere carte e gioca un torneo di qualsiasi anno", hmGm5:"<b>Draft del giorno</b>: una nuova stagione ogni giorno, un tentativo, una classifica comune", hmGm6:"<b>Competitive</b>: i veri tornei, con calendario, risultati e live", hmGm7:"<b>Account</b>: il tuo profilo e i salvataggi nel cloud", hmGuideBtn:"Come si gioca", hmGuideH:"Come si gioca", hmGuide1:"Crea un giocatore o scegli un vero pro", hmGuide2:"Allenati e scegli come usare ogni giornata", hmGuide3:"Gioca i tornei FNCS sul vero calendario 2019–2026 e sali dalla Divisione 5 alla Divisione 1", hmGuideGo:"Inizia una carriera", hmGuideMore:"Scopri di più", hmWhatIs:"Gioco di carriera Fortnite gratis nel browser. Nessun download.", hcHeroTitle:'Diventa pro. <em>Stagione dopo stagione.</em>', hdHeroTitle:'Crea la squadra. <em>Qualsiasi anno FNCS.</em>', hdChipFormats:'Duo · Trio · Squad', hdPlay:'Gioca il draft'});
Object.assign(I18N.pt, {hmGmH:"O que tem no menu", hmGm1:"<b>Carreira</b>: um jogador, temporada após temporada no calendário real", hmGm2:"<b>Com amigos</b>: uma carreira em dupla ou uma corrida entre amigos", hmGm3:"<b>Manager</b>: comande um clube de verdade por uma temporada", hmGm4:"<b>Draft</b>: monte um time com cartas reais e jogue um torneio de qualquer ano", hmGm5:"<b>Draft do dia</b>: uma temporada nova por dia, uma tentativa, uma tabela geral", hmGm6:"<b>Competitive</b>: torneios reais, com calendário, resultados e ao vivo", hmGm7:"<b>Conta</b>: seu perfil e seus saves na nuvem", hmGuideBtn:"Como jogar", hmGuideH:"Como jogar", hmGuide1:"Crie um jogador ou escolha um pro de verdade", hmGuide2:"Treine e escolha como usar cada dia", hmGuide3:"Jogue torneios FNCS no calendário real de 2019–2026 e suba da Divisão 5 para a Divisão 1", hmGuideGo:"Começar carreira", hmGuideMore:"Saiba mais", hmWhatIs:"Jogo de carreira de Fortnite grátis no navegador. Sem download.", hcHeroTitle:'Vire pro. <em>Temporada após temporada.</em>', hdHeroTitle:'Monte o time. <em>Qualquer ano do FNCS.</em>', hdChipFormats:'Duplas · Trios · Squads', hdPlay:'Jogar o draft'});
Object.assign(I18N.ru, {hmMgrNav:"Менеджер", hmMgrCareer:"Карьера менеджера", hmMgrTag:"Режим 2 · Карьера менеджера", hmMgrTitle:"Собери клуб. <em>Веди его через сезон.</em>", hmMgrSub:"Ты Head of Fortnite: настоящий клуб и состав года, турниры по реальному календарю, смотришь вечера и решаешь между играми.", hmMgrBtn:"Стать менеджером", hmCareerTag:'Режим 1 · Карьера', hmCareerTitle:'Карьера', hmCareerSub:'Один игрок, сезон за сезоном по настоящему календарю 2019–2026: дивизионы, Мейджоры, клубы, ЛАНы', hmPlay:'Играть',
  hmDraftTag:'Режим 3 · Драфт', hmDraftTitle:'Драфт', hmDraftSub:'Собери команду из реальных карточек и пройди турнир: любой год 2019–2026, All FNCS, дуо, трио, сквады',
  dpFormats:'All FNCS · форматы', dpBack:'Назад', dpRealCards:'Реальные карточки', dpPastDesc:'Карточки игроков по их настоящим результатам на этом турнире. Круг — Play-In, хиты и финал.'});
Object.assign(I18N.en, {hmMgrNav:"Manager", hmMgrCareer:"Manager career", hmMgrTag:"Mode 2 · Manager career", hmMgrTitle:"Build a club. <em>Run it through a season.</em>", hmMgrSub:"You are Head of Fortnite: a real club and its roster of the year, events on the real calendar, you watch the nights and decide between games.", hmMgrBtn:"Become a manager", hmCareerTag:'Mode 1 · Career', hmCareerTitle:'Career', hmCareerSub:'One player, season after season on the real 2019–2026 calendar: divisions, Majors, clubs, LANs', hmPlay:'Play',
  hmDraftTag:'Mode 3 · Draft', hmDraftTitle:'Draft', hmDraftSub:'Build a team from real cards and run the tournament: any year 2019–2026, All FNCS, duos, trios, squads',
  dpFormats:'All FNCS · formats', dpRealCards:'Real cards', dpBack:'Back', dpPastDesc:'Player cards built from their real results at this event. The run is Play-In, Heats and Finals.'});
Object.assign(I18N.fr, {hmMgrNav:"Manager", hmMgrCareer:"Carrière de manager", hmMgrTag:"Mode 2 · Carrière de manager", hmMgrTitle:"Bâtis un club. <em>Mène-le toute la saison.</em>", hmMgrSub:"Tu es Head of Fortnite : un vrai club et son roster de l’année, les tournois du vrai calendrier, tu regardes les soirées et décides entre les games.", hmMgrBtn:"Devenir manager", hmCareerTag:'Mode 1 · Carrière', hmCareerTitle:'Carrière', hmCareerSub:'Un joueur, saison après saison sur le vrai calendrier 2019–2026 : divisions, Majors, clubs, LAN', hmPlay:'Jouer',
  hmDraftTag:'Mode 3 · Draft', hmDraftTitle:'Draft', hmDraftSub:'Monte une équipe de vraies cartes et joue le tournoi : n\'importe quelle année 2019–2026, All FNCS, duos, trios, squads',
  dpFormats:'All FNCS · formats', dpRealCards:'Vraies cartes', dpBack:'Retour', dpPastDesc:'Cartes des joueurs d\'après leurs vrais résultats sur cet événement. Play-In, heats et finale.'});
Object.assign(I18N.it, {hmMgrNav:"Manager", hmMgrCareer:"Carriera da manager", hmMgrTag:"Modalità 2 · Carriera da manager", hmMgrTitle:"Costruisci un club. <em>Guidalo per tutta la stagione.</em>", hmMgrSub:"Sei Head of Fortnite: un vero club e il suo roster dell’anno, i tornei del calendario reale, guardi le serate e decidi tra le partite.", hmMgrBtn:"Diventa manager", hmCareerTag:'Modalità 1 · Carriera', hmCareerTitle:'Carriera', hmCareerSub:'Un giocatore, stagione dopo stagione sul vero calendario 2019–2026: divisioni, Major, club, LAN', hmPlay:'Gioca',
  hmDraftTag:'Modalità 3 · Draft', hmDraftTitle:'Draft', hmDraftSub:'Crea una squadra di carte reali e gioca il torneo: qualsiasi anno 2019–2026, All FNCS, duo, trio, squad',
  dpFormats:'All FNCS · formati', dpBack:'Indietro', dpRealCards:'Carte reali', dpPastDesc:'Carte dei giocatori dai loro veri risultati a questo evento. Play-In, heat e finale.'});
Object.assign(I18N.pt, {hmMgrNav:"Manager", hmMgrCareer:"Carreira de manager", hmMgrTag:"Modo 2 · Carreira de manager", hmMgrTitle:"Monte um clube. <em>Conduza-o pela temporada.</em>", hmMgrSub:"Você é Head of Fortnite: um clube real e seu elenco do ano, torneios no calendário real, você assiste às noites e decide entre as partidas.", hmMgrBtn:"Virar manager", hmCareerTag:'Modo 1 · Carreira', hmCareerTitle:'Carreira', hmCareerSub:'Um jogador, temporada após temporada no calendário real 2019–2026: divisões, Majors, clubes, LANs', hmPlay:'Jogar',
  hmDraftTag:'Modo 3 · Draft', hmDraftTitle:'Draft', hmDraftSub:'Monte um time de cartas reais e jogue o torneio: qualquer ano 2019–2026, All FNCS, duplas, trios, squads',
  dpFormats:'All FNCS · formatos', dpBack:'Voltar', dpRealCards:'Cartas reais', dpPastDesc:'Cartas dos jogadores pelos resultados reais neste evento. Play-In, heats e final.'});
/* Разговор с тиммейтом (7.10): тон разбора, план на вечер, честно о переманивании. */
Object.assign(I18N.ru, {dmMateBtnreview:'Поговорить о сливе',
  dmMateWhatreview:'После плохого вечера — каким тоном, решаешь ты',
  dmMateBtnplan:'План на вечер',
  dmMateWhatplan:'Договориться, как играем сегодня',
  dmRevHint:'Каким тоном говорить?',
  dmRevBtn_support:'Поддержать',
  dmRevBtn_analyze:'Разобрать ошибки',
  dmRevBtn_blame:'Наехать',
  dmRevYou_support:(p,o)=>'Вчера не зашло, бывает. Мы сильнее этого, следующий наш',
  dmRevYou_analyze:(p,o)=>ccTopC(p)+' из '+o+'. Давай по пунктам: где отдали зону и почему первый файт был наш',
  dmRevYou_blame:(p,o)=>ccTopC(p)+' из '+o+'. Честно — ты вчера был не в игре',
  dmRevGood:(p,o)=>'Спасибо. Именно это и нужно было услышать. Завтра отыграем',
  dmRevOk:(p,o)=>'Ок, принято. Работаем',
  dmRevBad:(p,o)=>'Серьёзно? Я тоже не один там играл',
  dmPlanHint:'Как играем сегодня?',
  dmPlanBtn_aggr:'Агрессивно',
  dmPlanBtn_zone:'От зоны',
  dmPlanYou_aggr:'Сегодня играем агрессивно: контесты, файты, килы',
  dmPlanYou_zone:'Сегодня спокойно: от зоны, без лишних файтов',
  dmPlanOk_aggr:'Го. Беру первый контакт, ты за мной',
  dmPlanOk_zone:'Ок. Ротации ранние, файты только на своих условиях',
  dmPlanKept:'Вот это я понимаю — сыграли как договорились',
  dmPlanBroken:'Мы же договаривались по-другому. Зачем тогда план?',
  dmHeadsUp:p=>'Хочу, чтобы ты знал раньше всех: после '+ccTop(p)+' мне написали с предложением. Думаю. Скажи что-нибудь',
  dmHeadsUpHint:'Его зовут в другую команду — он ждёт твоего слова',
  dmHeadsUpStayBtn:'Останься, договоримся',
  dmHeadsUpGoBtn:'Решай сам',
  dmHeadsUpStayYou:'Спасибо, что сказал. Ты мне нужен — давай договоримся, что поменять',
  dmHeadsUpGoYou:'Решай сам. Держать не буду',
  dmHeadsUpStays:'Ладно. Раз так — остаюсь. Но давай правда что-то менять'});
Object.assign(I18N.en, {dmMateBtnreview:'Talk about the bad night',
  dmMateWhatreview:'After a bad night — you pick the tone',
  dmMateBtnplan:'Plan for tonight',
  dmMateWhatplan:'Agree how you play today',
  dmRevHint:'What tone?',
  dmRevBtn_support:'Back them up',
  dmRevBtn_analyze:'Go over the mistakes',
  dmRevBtn_blame:'Call them out',
  dmRevYou_support:(p,o)=>'Yesterday did not land, it happens. We are better than that, next one is ours',
  dmRevYou_analyze:(p,o)=>ccTopC(p)+' of '+o+'. Point by point: where we lost zone and why the first fight was ours',
  dmRevYou_blame:(p,o)=>ccTopC(p)+' of '+o+'. Honestly — you were not in the game yesterday',
  dmRevGood:(p,o)=>'Thanks. That is exactly what I needed to hear. We bounce back tomorrow',
  dmRevOk:(p,o)=>'Ok, noted. Back to work',
  dmRevBad:(p,o)=>'Seriously? I was not playing alone out there',
  dmPlanHint:'How do we play today?',
  dmPlanBtn_aggr:'Aggressive',
  dmPlanBtn_zone:'Play zone',
  dmPlanYou_aggr:'Tonight we go aggressive: contests, fights, kills',
  dmPlanYou_zone:'Tonight we play it calm: zone first, no extra fights',
  dmPlanOk_aggr:'Let us go. I take first contact, you follow',
  dmPlanOk_zone:'Ok. Early rotations, fights only on our terms',
  dmPlanKept:'That is what I am talking about — played it exactly like we said',
  dmPlanBroken:'We agreed on something else. Why make a plan then?',
  dmHeadsUp:p=>'I want you to hear it first: after '+ccTop(p)+' I got an offer. I am thinking. Say something',
  dmHeadsUpHint:'Another team wants them — they are waiting for your word',
  dmHeadsUpStayBtn:'Stay, we will sort it out',
  dmHeadsUpGoBtn:'Your call',
  dmHeadsUpStayYou:'Thanks for telling me. I need you — let us agree what to change',
  dmHeadsUpGoYou:'Your call. I will not hold you',
  dmHeadsUpStays:'Alright. If that is how it is — I stay. But let us actually change something'});
Object.assign(I18N.fr, {dmMateBtnreview:'Parler de la mauvaise soirée',
  dmMateWhatreview:'Après une mauvaise soirée — à toi de choisir le ton',
  dmMateBtnplan:'Plan pour ce soir',
  dmMateWhatplan:'Se mettre d\u2019accord sur le jeu du jour',
  dmRevHint:'Sur quel ton ?',
  dmRevBtn_support:'Soutenir',
  dmRevBtn_analyze:'Revoir les erreurs',
  dmRevBtn_blame:'Recadrer',
  dmRevYou_support:(p,o)=>'Hier ça n\u2019a pas souri, ça arrive. On vaut mieux que ça, la prochaine est pour nous',
  dmRevYou_analyze:(p,o)=>ccTopC(p)+' sur '+o+'. Point par point : où on a perdu la zone et pourquoi le premier fight était à nous',
  dmRevYou_blame:(p,o)=>ccTopC(p)+' sur '+o+'. Franchement — hier tu n\u2019étais pas dans le match',
  dmRevGood:(p,o)=>'Merci. C\u2019est exactement ce que j\u2019avais besoin d\u2019entendre. On se rattrape demain',
  dmRevOk:(p,o)=>'Ok, noté. On bosse',
  dmRevBad:(p,o)=>'Sérieux ? Je ne jouais pas seul non plus',
  dmPlanHint:'On joue comment aujourd\u2019hui ?',
  dmPlanBtn_aggr:'Agressif',
  dmPlanBtn_zone:'Jouer la zone',
  dmPlanYou_aggr:'Ce soir on joue agressif : contests, fights, kills',
  dmPlanYou_zone:'Ce soir on joue calme : la zone d\u2019abord, pas de fights en trop',
  dmPlanOk_aggr:'Go. Je prends le premier contact, tu suis',
  dmPlanOk_zone:'Ok. Rotations tôt, fights seulement à nos conditions',
  dmPlanKept:'Là je reconnais — joué exactement comme prévu',
  dmPlanBroken:'On avait dit autre chose. À quoi bon un plan alors ?',
  dmHeadsUp:p=>'Je veux que tu le saches en premier : après le '+ccTop(p)+' on m\u2019a fait une offre. Je réfléchis. Dis quelque chose',
  dmHeadsUpHint:'Une autre équipe le veut — il attend ta réponse',
  dmHeadsUpStayBtn:'Reste, on va s\u2019arranger',
  dmHeadsUpGoBtn:'C\u2019est ton choix',
  dmHeadsUpStayYou:'Merci de me l\u2019avoir dit. J\u2019ai besoin de toi — voyons ce qu\u2019on change',
  dmHeadsUpGoYou:'C\u2019est ton choix. Je ne te retiens pas',
  dmHeadsUpStays:'Bon. Si c\u2019est comme ça — je reste. Mais changeons vraiment quelque chose'});
Object.assign(I18N.it, {dmMateBtnreview:'Parlare della serata storta',
  dmMateWhatreview:'Dopo una serata storta — scegli tu il tono',
  dmMateBtnplan:'Piano per stasera',
  dmMateWhatplan:'Mettersi d\u2019accordo su come giocare oggi',
  dmRevHint:'Con che tono?',
  dmRevBtn_support:'Sostenerlo',
  dmRevBtn_analyze:'Rivedere gli errori',
  dmRevBtn_blame:'Fargli una ramanzina',
  dmRevYou_support:(p,o)=>'Ieri non è andata, capita. Siamo meglio di così, la prossima è nostra',
  dmRevYou_analyze:(p,o)=>ccTopC(p)+' su '+o+'. Punto per punto: dove abbiamo perso la zona e perché il primo fight era nostro',
  dmRevYou_blame:(p,o)=>ccTopC(p)+' su '+o+'. Sinceramente — ieri non eri in partita',
  dmRevGood:(p,o)=>'Grazie. Era proprio quello che mi serviva sentire. Domani ci rifacciamo',
  dmRevOk:(p,o)=>'Ok, ricevuto. Al lavoro',
  dmRevBad:(p,o)=>'Sul serio? Non giocavo mica da solo',
  dmPlanHint:'Come giochiamo oggi?',
  dmPlanBtn_aggr:'Aggressivi',
  dmPlanBtn_zone:'Giocare la zona',
  dmPlanYou_aggr:'Stasera aggressivi: contest, fight, kill',
  dmPlanYou_zone:'Stasera tranquilli: prima la zona, niente fight inutili',
  dmPlanOk_aggr:'Andiamo. Prendo io il primo contatto, tu dietro',
  dmPlanOk_zone:'Ok. Rotazioni presto, fight solo alle nostre condizioni',
  dmPlanKept:'Così mi piace — giocato esattamente come avevamo detto',
  dmPlanBroken:'Avevamo deciso diversamente. A che serve un piano allora?',
  dmHeadsUp:p=>'Voglio che tu lo sappia per primo: dopo il '+ccTop(p)+' mi hanno fatto un\u2019offerta. Ci sto pensando. Di\u2019 qualcosa',
  dmHeadsUpHint:'Un\u2019altra squadra lo vuole — aspetta una tua parola',
  dmHeadsUpStayBtn:'Resta, ci accordiamo',
  dmHeadsUpGoBtn:'Decidi tu',
  dmHeadsUpStayYou:'Grazie di avermelo detto. Mi servi — vediamo cosa cambiare',
  dmHeadsUpGoYou:'Decidi tu. Non ti trattengo',
  dmHeadsUpStays:'Va bene. Se è così — resto. Ma cambiamo davvero qualcosa'});
Object.assign(I18N.pt, {dmMateBtnreview:'Falar da noite ruim',
  dmMateWhatreview:'Depois de uma noite ruim — você escolhe o tom',
  dmMateBtnplan:'Plano pra hoje',
  dmMateWhatplan:'Combinar como vocês jogam hoje',
  dmRevHint:'Em que tom?',
  dmRevBtn_support:'Apoiar',
  dmRevBtn_analyze:'Rever os erros',
  dmRevBtn_blame:'Dar uma bronca',
  dmRevYou_support:(p,o)=>'Ontem não encaixou, acontece. A gente é melhor que isso, a próxima é nossa',
  dmRevYou_analyze:(p,o)=>ccTopC(p)+' de '+o+'. Ponto por ponto: onde perdemos a zona e por que a primeira luta era nossa',
  dmRevYou_blame:(p,o)=>ccTopC(p)+' de '+o+'. Sinceramente — ontem você não tava no jogo',
  dmRevGood:(p,o)=>'Valeu. Era exatamente isso que eu precisava ouvir. Amanhã a gente recupera',
  dmRevOk:(p,o)=>'Ok, anotado. Bora trabalhar',
  dmRevBad:(p,o)=>'Sério? Eu não tava jogando sozinho lá',
  dmPlanHint:'Como a gente joga hoje?',
  dmPlanBtn_aggr:'Agressivo',
  dmPlanBtn_zone:'Jogar de zona',
  dmPlanYou_aggr:'Hoje é agressivo: contest, luta, kill',
  dmPlanYou_zone:'Hoje é tranquilo: zona primeiro, sem luta à toa',
  dmPlanOk_aggr:'Bora. Eu pego o primeiro contato, você vem atrás',
  dmPlanOk_zone:'Ok. Rotação cedo, luta só nos nossos termos',
  dmPlanKept:'Assim que é — jogamos exatamente como combinamos',
  dmPlanBroken:'A gente combinou outra coisa. Pra que plano então?',
  dmHeadsUp:p=>'Quero que você saiba antes de todo mundo: depois do '+ccTop(p)+' me fizeram uma proposta. Tô pensando. Fala alguma coisa',
  dmHeadsUpHint:'Outro time quer ele — ele espera sua palavra',
  dmHeadsUpStayBtn:'Fica, a gente se acerta',
  dmHeadsUpGoBtn:'Você decide',
  dmHeadsUpStayYou:'Valeu por me contar. Preciso de você — bora combinar o que mudar',
  dmHeadsUpGoYou:'Você decide. Não vou te segurar',
  dmHeadsUpStays:'Beleza. Se é assim — eu fico. Mas vamos mudar alguma coisa de verdade'});
/* Переговоры с тиммейтом (7.10): аргументы «играли вместе / земляки / свой клуб / буткемп», условия «пересядь» и «пробный кап». */
Object.assign(I18N.ru, {ccSpbTitle:"Спонсоры", ccSpbOfferNow:"Сейчас предлагают", ccSpbAll:"Выбрать спонсора", ccSpbPer:"Платят за эфир", ccOrgMore:"Подробнее", ccSpPostBtn:p=>'📣 Пост · +'+p, ccSpPostWaitT:d=>'пост через '+d+' дн.', ccSpPostReady:'Ждут рекламный пост', ccSpPostTexts:[b=>'турнирный сетап готов — спасибо '+b+' 🎮',b=>'с '+b+' на каждом вечере. скоро на стриме',b=>'новый дроп от '+b+' уже у меня. как вам?',b=>'тренировка на 8 часов. '+b+' держит в строю 💪'], ccSpbDrop:'Расторгнуть', ccSpbFree:n=>'Свободно слотов: '+n+' — подпиши бренд ниже', ccSpbNextSlot:n=>'Ещё слот — с '+n+' подписчиков', ccSpbSwap:'Заменить', ccSpbFull:'слоты заняты', ccSpbMktOn:r=>'Маркетолог торгуется: ставки ×'+r, ccSpbMktOff:'Без маркетолога бренды платят ×0.8 — он выбивает больше', dmStaffFoot:"Штаб пишет сам: после вечеров, перед турнирами и по своей работе.", dmStHi_coach:"Привет! Я твой коуч. После каждого вечера буду разбирать игру и говорить, над чем работать.", dmStHi_analyst:"На связи. Перед турнирами разбираю лобби и точки, после — цифры вечера.", dmStHi_psych:"Здравствуй. Я рядом, если вечер пошёл не так. Пиши в любое время.", dmStHi_smm:"Привет! Беру твои соцсети. Раз в неделю присылаю, сколько пришло подписчиков.", dmStHi_mkt:"Привет! Я по спонсорам. Как появится предложение — сразу напишу.", dmStCoachNight:(p,of,w,s)=>"Разбор: "+p+"-е место"+(of?" из "+of:"")+". "+(p<=Math.max(3,of*0.1)?"Сильный вечер, держим уровень.":p<=of*0.5?"Нормально, но можно выше.":"Тяжело. Не паникуем.")+" Сильнее всего сейчас — "+s.toLowerCase()+", подтянуть надо "+w.toLowerCase()+".", dmStCoachWeek:w=>"План недели: упор на "+w.toLowerCase()+". Остальное поддерживаем.", dmStAnPrep:(ev,d,n,p)=>"Разобрал лобби к «"+ev+"» ("+d+"). Опаснее всех "+n+" — №"+p+" в PR. С ними в лейте не дерёмся, зону берём заранее.", dmStAnPrep0:(ev,d)=>"Готовлю разбор к «"+ev+"» ("+d+"): точки соседей и где обычно встаёт зона.", dmStAnMe:s=>s, dmStAnKinch:(w,e,d,t,a,p,t10,wn,pt)=>w+": элим. "+e+" · урон ≈"+d+" · получено ≈"+t+" · жизнь ≈"+a+" · ср. место "+p+" · топ-10 "+t10+" · победы "+wn+" · очки "+pt, dmStAnYou:"ты", dmStAnMeRow:(w,k,p,b)=>w+" "+k+" ("+p+"%, лучшая игра "+b+")", dmStAnNight:(avg,k,g)=>"Цифры вечера: среднее место "+avg+(g?" за "+g+" игр":"")+", элиминаций "+k+".", dmStPsBad:p=>"Вижу, "+p+" место. Это один вечер, а не ты. Выспись, завтра разберём спокойно.", dmStPsGood:"Прошёл — отлично. Запомни, как себя чувствовал перед стартом: это и есть твоё рабочее состояние.", dmStPsWeek:"Как ты в целом? Сон, усталость, настрой — если что-то давит, пиши.", dmStSmmWeek:(n,all)=>"Неделя в соцсетях: +"+n+" подписчиков, всего "+all+".", dmStMktOffer:(b,pay)=>b+" готовы подписать тебя: "+pay+" за эфир. Предложение — во вкладке «Клуб», блок спонсоров.", dmStMktWeek:(b,n)=>"Следующий бренд — "+b+", они смотрят на аудиторию от "+n+". Растём.", dmStMktTop:"Ты на уровне самых крупных брендов. Держим аудиторию.", ccSpbFrom:n=>'от '+n+' подписчиков', ccSpbYours:'твой спонсор', ccSpbWait:'ждём предложения', ccSpbNeedMkt:'предложения приносит маркетолог', ccOrgPayAskBtn:'Попросить клуб оплатить', ccOrgPayNoUntil:d=>'Клуб отказал · снова с '+d, ccNewsOrgPays:(o,r)=>o+' оплачивает тебе: '+r.toLowerCase(), ccNewsOrgPaysNo:(o,r)=>o+' не стал оплачивать: '+r.toLowerCase(), ccOrgSignRow:n=>'+'+n+' подписчиков при подписании', roSpotFrom:d=>'откроется с '+d, roChests:'Сундуки', roSpotPow:'Сила точки', roClubNoUntil:d=>'Клуб отказал · снова с '+d, ccStaffYear:'Год', ccStaffAuto:'Автопродление', ccStaffOn:'вкл', ccStaffOff:'выкл', ccNewsStaffRenew:(r,n,c,m)=>r+' '+n+': контракт продлён на '+(m>=12?'год':'месяц')+(c?' — $'+ccNum(c):' — платит клуб'), ccNewsStaffGone:(r,n)=>r+' '+n+' ушёл: не хватило денег на продление', ccStaffTitle:'Штаб', ccStaffHire:'Нанять', ccStaffRole:{coach:'Коуч', agent:'Менеджер', smm:'SMM', mkt:'Маркетинг', analyst:'Аналитик', psych:'Психолог'}, ccStaffMktFx:r=>'спонсоры ×'+r, ccStaffChange:'Сменить', ccAnalyst:'Аналитик', ccAnalystHint:'Перед вечером разбирает соперников и точки — плюс к силе команды. Только в одиночной карьере', ccAnalystNone:'Аналитика нет', ccAnalystHire:'Посмотреть аналитиков', ccAnalystDoes:'Разбор', ccAnalystPow:p=>'+'+p+' к силе на вечер', ccPsych:'Психолог', ccPsychHint:'Работает с тильтом: после плохого вечера форма падает меньше', ccPsychNone:'Психолога нет', ccPsychHire:'Посмотреть психологов', ccPsychDoes:'Тильт', ccPsychSoft:p=>'провал формы мягче на '+p+'%', ccOrgFans:'Подписчики клуба в X', ccOrgFansEst:'Оценка: точного числа не нашли', ccOrgMedia:'Медийка клуба', ccOrgMediaRow:n=>'+'+n+' подписчиков в месяц', dmMateBtnrival:'Про соперников', dmMateWhatrival:'Кого опасаться сейчас', dmMeTalkrival:()=>'Кто сейчас самый опасный, как думаешь?', dmMateTalkrival:(n,p,m)=>'Смотрю на '+n+' — №'+p+' в PR.'+(m ? ' Мы — №'+m+'.' : '')+' В лейте против них не лезем, зону берём раньше', dmMateHi:'Ну что, теперь вместе. Пиши сюда, если что — договоримся по вечерам.', dmMateHi1:'Привет. Играем вместе — пиши, если что.', dmMateHi2:'Йо! Рад, что играем вместе 🙌 Пиши в любое время, всё обсудим.', dmMateHi3:'Ну всё, с нами теперь считаться придётся. Пиши, когда будешь готов тащить.', dmMateHi4:'Привет. По вечерам — сюда.', dmSecPinned:'Закреплено', dmMateTalkDone:'Сегодня уже поговорили — завтра', ccRoleCool:d=>'Роль недавно менялась — снова можно через '+d+' дн.', ccDuoLimit:'Сегодня уже написал троим — завтра',
  dmArghistoryBtn:'Мы уже играли вместе', dmArghistoryWhat:'Напомнить общие вечера — помнит, как было',
  dmArgnatBtn:'Мы земляки', dmArgnatWhat:'Одна страна, один язык — в коммах проще',
  dmArgclubBtn:'Зову в свой клуб', dmArgclubWhat:'Ты в основе клуба — это весомо',
  dmArgcampBtn:'Буткемп за мой счёт', dmArgcampWhat:'$1,000 с твоего баланса — убеждает сильно',
  dmArgHistory:n=>'Мы уже сыграли вместе '+n+' вечер(а). Ты знаешь, как я играю',
  dmArgNat:c=>'Мы оба из страны «'+c+'». Коммы на родном языке — это плюс',
  dmArgClub:c=>'Я в основе '+c+'. Пойдёшь со мной — поговорю, чтобы взяли и тебя',
  dmArgCamp:v=>'Беру буткемп на себя: $'+v+'. Неделя вместе — сыграемся',
  dmCondRole:r=>'Слушай, давай так: я в деле, если '+r+' будешь ты. Двух одинаковых нам не надо',
  dmCondTrial:'Почти уговорил. Давай сначала один кап вместе — посмотрим, как сыграемся',
  dmCondRoleHint:'Он согласен, если ты сменишь роль', dmCondTrialHint:'Он согласен на пробу: один кап вместе, потом решит',
  dmCondRoleBtn:'Пересяду', dmCondTrialBtn:'Давай пробный кап', dmCondNoBtn:'Нет, не подходит',
  dmCondNo:'Не, так не пойдёт', dmCondNoBack:'Ну, твоё дело. Если что — пиши',
  dmCondRoleOk:r=>'Договорились, '+r+' — моё', dmCondTrialOk:'Давай. Один кап — и решаем',
  dmCondTrialYes:'Идёт. Ближайший кап играем вместе, по итогу скажу',
  dmTrialStay:p=>'Ну что, '+ccTop(p)+' вместе. Остаюсь, играем дальше',
  dmTrialGo:p=>ccTopC(p)+'. Не сыграемся, честно. Без обид, ищи дальше',
  ccNewsTrialGone:h=>'Проба не задалась: @'+ccHandle(h)+' ушёл после первого капа'});
Object.assign(I18N.en, {ccSponsorlenovo:"Lenovo Legion", ccSponsorsteelseries:"SteelSeries", ccSponsorgfuel:"G FUEL", ccSponsorcorsair:"Corsair", ccSponsorprime:"PRIME", ccSponsorkitkat:"KitKat", ccSponsoramd:"AMD", ccSponsoralienware:"Alienware", ccSponsorintel:"Intel", ccSponsorsamsung:"Samsung", ccSponsornvidia:"NVIDIA", ccSponsordhl:"DHL", ccSponsormastercard:"Mastercard", ccSponsorbmw:"BMW", ccSponsormercedes:"Mercedes-Benz", ccSpbTitle:"Sponsors", ccSpbOfferNow:"Offer now", ccSpbAll:"Choose a sponsor", ccSpbPer:"Paid per stream", ccOrgMore:"More", ccSpPostBtn:p=>'📣 Post · +'+p, ccSpPostWaitT:d=>'post in '+d+'d', ccSpPostReady:'Waiting for a sponsored post', ccSpPostTexts:[b=>'tournament setup ready — thanks '+b+' 🎮',b=>'with '+b+' every single night. live soon',b=>'the new '+b+' drop just landed. thoughts?',b=>'8 hour practice day. '+b+' keeps me going 💪'], ccSpbDrop:'End deal', ccSpbFree:n=>'Free slots: '+n+' — sign a brand below', ccSpbNextSlot:n=>'Another slot at '+n+' followers', ccSpbSwap:'Replace', ccSpbFull:'slots full', ccSpbMktOn:r=>'Your marketer negotiates: rates ×'+r, ccSpbMktOff:'Without a marketer brands pay ×0.8 — a marketer gets more', dmStaffFoot:"Your staff write on their own: after nights, before events and about their work.", dmStHi_coach:"Hey! I am your coach. After every night I will break the games down and tell you what to work on.", dmStHi_analyst:"Here. Before events I break down the lobby and the drops, after them the numbers.", dmStHi_psych:"Hi. I am here if a night goes wrong. Message me any time.", dmStHi_smm:"Hey! I am running your socials. Once a week I will tell you how many followers came in.", dmStHi_mkt:"Hey! I handle sponsors. The moment an offer comes in, I will message you.", dmStCoachNight:(p,of,w,s)=>"Review: #"+p+(of?" of "+of:"")+". "+(p<=Math.max(3,of*0.1)?"A strong night, keep it there.":p<=of*0.5?"Fine, but there is more.":"Rough one. No panic.")+" Your best right now is "+s.toLowerCase()+", we need to lift "+w.toLowerCase()+".", dmStCoachWeek:w=>"This week: focus on "+w.toLowerCase()+". Keep the rest ticking over.", dmStAnPrep:(ev,d,n,p)=>"Lobby breakdown for "+ev+" ("+d+"): the most dangerous is "+n+", #"+p+" in PR. No late fights with them, take zone early.", dmStAnPrep0:(ev,d)=>"Preparing "+ev+" ("+d+"): nearby drops and where zone usually ends.", dmStAnMe:s=>s, dmStAnKinch:(w,e,d,t,a,p,t10,wn,pt)=>w+": elims "+e+" · damage ≈"+d+" · taken ≈"+t+" · alive ≈"+a+" · avg place "+p+" · top 10 "+t10+" · wins "+wn+" · points "+pt, dmStAnYou:"you", dmStAnMeRow:(w,k,p,b)=>w+" "+k+" ("+p+"%, best game "+b+")", dmStAnNight:(avg,k,g)=>"Night numbers: average place "+avg+(g?" over "+g+" games":"")+", "+k+" elims.", dmStPsBad:p=>"I saw it, #"+p+". That is one night, not you. Sleep on it, we will go over it calmly tomorrow.", dmStPsGood:"Qualified, well done. Remember how you felt before the start: that is your working state.", dmStPsWeek:"How are you overall? Sleep, fatigue, mood. If something weighs on you, message me.", dmStSmmWeek:(n,all)=>"Your week on socials: +"+n+" followers, "+all+" in total.", dmStMktOffer:(b,pay)=>b+" are ready to sign you: "+pay+" a stream. The offer is on the Club tab, in the sponsors block.", dmStMktWeek:(b,n)=>"Next brand is "+b+", they look at audiences from "+n+". Keep growing.", dmStMktTop:"You are at the level of the biggest brands. Keep the audience.", ccSpbFrom:n=>'from '+n+' followers', ccSpbYours:'your sponsor', ccSpbWait:'waiting for an offer', ccSpbNeedMkt:'a marketer brings offers', ccOrgPayAskBtn:'Ask the club to pay', ccOrgPayNoUntil:d=>'The club said no · again from '+d, ccNewsOrgPays:(o,r)=>o+' now pays for your '+r.toLowerCase(), ccNewsOrgPaysNo:(o,r)=>o+' will not pay for your '+r.toLowerCase(), ccOrgSignRow:n=>'+'+n+' followers on signing', roSpotFrom:d=>'opens on '+d, roChests:'Chests', roSpotPow:'Spot power', roClubNoUntil:d=>'The club said no · ask again from '+d, ccStaffYear:'Year', ccStaffAuto:'Auto-renew', ccStaffOn:'on', ccStaffOff:'off', ccNewsStaffRenew:(r,n,c,m)=>r+' '+n+': contract renewed for a '+(m>=12?'year':'month')+(c?' — $'+ccNum(c):' — the club pays'), ccNewsStaffGone:(r,n)=>r+' '+n+' left: not enough money to renew', ccStaffTitle:'Staff', ccStaffHire:'Hire', ccStaffRole:{coach:'Coach', agent:'Manager', smm:'SMM', mkt:'Marketing', analyst:'Analyst', psych:'Psychologist'}, ccStaffMktFx:r=>'sponsors ×'+r, ccStaffChange:'Change', ccAnalyst:'Analyst', ccAnalystHint:'Breaks down opponents and drops before the night — more team power. Solo career only', ccAnalystNone:'No analyst', ccAnalystHire:'See analysts', ccAnalystDoes:'Prep', ccAnalystPow:p=>'+'+p+' team power for the night', ccPsych:'Psychologist', ccPsychHint:'Works on tilt: a bad night costs less form', ccPsychNone:'No psychologist', ccPsychHire:'See psychologists', ccPsychDoes:'Tilt', ccPsychSoft:p=>'form drops '+p+'% softer', ccOrgFans:'Club followers on X', ccOrgFansEst:'Estimate: no exact number found', ccOrgMedia:'Club exposure', ccOrgMediaRow:n=>'+'+n+' followers a month', dmMateBtnrival:'About rivals', dmMateWhatrival:'Who to watch out for now', dmMeTalkrival:()=>'Who is the most dangerous right now, you think?', dmMateTalkrival:(n,p,m)=>'I am watching '+n+', #'+p+' in PR.'+(m ? ' We are #'+m+'.' : '')+' No late fights with them, we take zone early', dmMateHi:'Alright, we are a team now. Message me here and we will sort out the nights.', dmMateHi1:'Hey. We are playing together, message me if anything comes up.', dmMateHi2:'Yo! Glad we are teaming 🙌 Message me any time, we will talk it all through.', dmMateHi3:'That is it, they will have to deal with us now. Message me when you are ready to carry.', dmMateHi4:'Hey. Nights go here.', dmSecPinned:'Pinned', dmMateTalkDone:'You have already talked today — tomorrow', ccRoleCool:d=>'Role changed recently — again in '+d+' d', ccDuoLimit:'Already asked three today — tomorrow',
  dmArghistoryBtn:'We have played together', dmArghistoryWhat:'Remind them of the nights you shared — they remember how it went',
  dmArgnatBtn:'Same country', dmArgnatWhat:'One country, one language — comms are easier',
  dmArgclubBtn:'Bring them to my club', dmArgclubWhat:'You are on a club main roster — that carries weight',
  dmArgcampBtn:'Bootcamp on me', dmArgcampWhat:'$1,000 from your balance — very convincing',
  dmArgHistory:n=>'We already played '+n+' night(s) together. You know how I play',
  dmArgNat:c=>'We are both from '+c+'. Comms in our own language is a plus',
  dmArgClub:c=>'I am on the '+c+' main roster. Come with me and I will push for them to sign you too',
  dmArgCamp:v=>'Bootcamp is on me: $'+v+'. A week together and we will click',
  dmCondRole:r=>'Look, here is the deal: I am in if you play '+r+'. We do not need two of the same',
  dmCondTrial:'You almost have me. Let us play one cup together first — see how we click',
  dmCondRoleHint:'They are in if you switch roles', dmCondTrialHint:'They want a trial: one cup together, then they decide',
  dmCondRoleBtn:'I will switch', dmCondTrialBtn:'Trial cup it is', dmCondNoBtn:'No, that does not work',
  dmCondNo:'Nah, that does not work for me', dmCondNoBack:'Your call. Hit me up if anything changes',
  dmCondRoleOk:r=>'Deal, '+r+' is mine', dmCondTrialOk:'Let us do it. One cup and we decide',
  dmCondTrialYes:'Done. We play the next cup together and I will tell you after',
  dmTrialStay:p=>ccTopC(p)+' together. I am staying, let us keep going',
  dmTrialGo:p=>ccTopC(p)+'. Honestly we do not click. No hard feelings, keep looking',
  ccNewsTrialGone:h=>'The trial did not work out: @'+ccHandle(h)+' left after the first cup'});
Object.assign(I18N.fr, {ccSpbTitle:"Sponsors", ccSpbOfferNow:"Offre du moment", ccSpbAll:"Choisir un sponsor", ccSpbPer:"Payé par stream", ccOrgMore:"Détails", ccSpPostBtn:p=>'📣 Post · +'+p, ccSpPostWaitT:d=>'post dans '+d+' j', ccSpPostReady:'Post sponsorisé attendu', ccSpPostTexts:[b=>'setup de tournoi prêt — merci '+b+' 🎮',b=>'avec '+b+' à chaque soirée. live bientôt',b=>'le nouveau drop '+b+' est arrivé. vous en pensez quoi ?',b=>'8 h d’entraînement. '+b+' me tient debout 💪'], ccSpbDrop:'Résilier', ccSpbFree:n=>'Places libres : '+n+' — signe une marque ci-dessous', ccSpbNextSlot:n=>'Une place de plus dès '+n+' abonnés', ccSpbSwap:'Remplacer', ccSpbFull:'places prises', ccSpbMktOn:r=>'Ton marketeur négocie : tarifs ×'+r, ccSpbMktOff:'Sans marketeur les marques paient ×0.8', dmStaffFoot:"Ton staff écrit de lui-même : après les soirées, avant les tournois et sur son travail.", dmStHi_coach:"Salut ! Je suis ton coach. Après chaque soirée, je décortique les games et je te dis quoi travailler.", dmStHi_analyst:"Présent. Avant les tournois j’analyse le lobby et les drops, après — les chiffres.", dmStHi_psych:"Bonjour. Je suis là si une soirée tourne mal. Écris quand tu veux.", dmStHi_smm:"Salut ! Je gère tes réseaux. Chaque semaine, je te dis combien d’abonnés sont arrivés.", dmStHi_mkt:"Salut ! Je m’occupe des sponsors. Dès qu’une offre arrive, je t’écris.", dmStCoachNight:(p,of,w,s)=>"Débrief : "+p+(of?" sur "+of:"")+". "+(p<=Math.max(3,of*0.1)?"Grosse soirée, on garde ce niveau.":p<=of*0.5?"Correct, mais on peut mieux.":"Dur. Pas de panique.")+" Ton point fort : "+s.toLowerCase()+", à travailler : "+w.toLowerCase()+".", dmStCoachWeek:w=>"Cette semaine : priorité "+w.toLowerCase()+".", dmStAnPrep:(ev,d,n,p)=>"Analyse du lobby pour "+ev+" ("+d+") : le plus dangereux est "+n+", n°"+p+" au PR. Pas de fight en fin de game avec eux.", dmStAnPrep0:(ev,d)=>"Je prépare "+ev+" ("+d+") : drops des voisins et fins de zone.", dmStAnMe:s=>s, dmStAnKinch:(w,e,d,t,a,p,t10,wn,pt)=>w+" : élim. "+e+" · dégâts ≈"+d+" · subis ≈"+t+" · survie ≈"+a+" · place moy. "+p+" · top 10 "+t10+" · victoires "+wn+" · points "+pt, dmStAnYou:"toi", dmStAnMeRow:(w,k,p,b)=>w+" "+k+" ("+p+" %, meilleure game "+b+")", dmStAnNight:(avg,k,g)=>"Chiffres : place moyenne "+avg+(g?" sur "+g+" games":"")+", "+k+" éliminations.", dmStPsBad:p=>"J’ai vu, "+p+"e. C’est une soirée, pas toi. Dors, on en reparle demain au calme.", dmStPsGood:"Qualifié, bravo. Souviens-toi de ton état avant le départ : c’est ton état de travail.", dmStPsWeek:"Comment ça va en général ? Sommeil, fatigue, moral — écris si quelque chose pèse.", dmStSmmWeek:(n,all)=>"Semaine sur les réseaux : +"+n+" abonnés, "+all+" au total.", dmStMktOffer:(b,pay)=>b+" veut te signer : "+pay+" par stream. L’offre est dans l’onglet Club.", dmStMktWeek:(b,n)=>"Prochaine marque : "+b+", à partir de "+n+" abonnés.", dmStMktTop:"Tu es au niveau des plus grandes marques. On garde l’audience.", ccSpbFrom:n=>'dès '+n+' abonnés', ccSpbYours:'ton sponsor', ccSpbWait:'en attente d\u2019une offre', ccSpbNeedMkt:'un marketeur apporte les offres', ccOrgPayAskBtn:'Demander au club de payer', ccOrgPayNoUntil:d=>'Le club a refusé · de nouveau le '+d, ccNewsOrgPays:(o,r)=>o+' paie ton '+r.toLowerCase(), ccNewsOrgPaysNo:(o,r)=>o+' ne paiera pas ton '+r.toLowerCase(), ccOrgSignRow:n=>'+'+n+' abonnés à la signature', roSpotFrom:d=>'ouvre le '+d, roChests:'Coffres', roSpotPow:'Puissance du spot', roClubNoUntil:d=>'Le club a refusé · redemander dès le '+d, ccStaffYear:'Année', ccStaffAuto:'Renouvellement auto', ccStaffOn:'oui', ccStaffOff:'non', ccNewsStaffRenew:(r,n,c,m)=>r+' '+n+' : contrat prolongé '+(m>=12?'d\u2019un an':'d\u2019un mois')+(c?' — '+ccNum(c)+' $':' — le club paie'), ccNewsStaffGone:(r,n)=>r+' '+n+' est parti : pas assez d\u2019argent pour prolonger', ccStaffTitle:'Staff', ccStaffHire:'Recruter', ccStaffRole:{coach:'Coach', agent:'Agent', smm:'SMM', mkt:'Marketing', analyst:'Analyste', psych:'Psychologue'}, ccStaffMktFx:r=>'sponsors ×'+r, ccStaffChange:'Changer', ccAnalyst:'Analyste', ccAnalystHint:'Analyse les adversaires et les drops avant la soirée — plus de puissance. Carrière solo uniquement', ccAnalystNone:'Pas d\u2019analyste', ccAnalystHire:'Voir les analystes', ccAnalystDoes:'Préparation', ccAnalystPow:p=>'+'+p+' de puissance pour la soirée', ccPsych:'Psychologue', ccPsychHint:'Travaille le tilt : une mauvaise soirée coûte moins de forme', ccPsychNone:'Pas de psychologue', ccPsychHire:'Voir les psychologues', ccPsychDoes:'Tilt', ccPsychSoft:p=>'baisse de forme '+p+'% plus douce', ccOrgFans:'Abonnés du club sur X', ccOrgFansEst:'Estimation : pas de chiffre exact', ccOrgMedia:'Visibilité du club', ccOrgMediaRow:n=>'+'+n+' abonnés par mois', dmMateBtnrival:'Les rivaux', dmMateWhatrival:'De qui se méfier maintenant', dmMeTalkrival:()=>'Qui est le plus dangereux en ce moment, d\u2019après toi ?', dmMateTalkrival:(n,p,m)=>'Je surveille '+n+', n°'+p+' au PR.'+(m ? ' Nous, n°'+m+'.' : '')+' Pas de fights en fin de partie contre eux, on prend la zone tôt', dmMateHi:'Bon, on est une équipe maintenant. Écris-moi ici, on s\u2019organisera pour les soirées.', dmSecPinned:'Épinglé', dmMateTalkDone:'Vous avez déjà parlé aujourd\u2019hui — demain', ccRoleCool:d=>'Rôle changé récemment — de nouveau dans '+d+' j', ccDuoLimit:'Déjà trois demandes aujourd\u2019hui — demain',
  dmArghistoryBtn:'On a déjà joué ensemble', dmArghistoryWhat:'Rappeler vos soirées communes — il s\u2019en souvient',
  dmArgnatBtn:'Même pays', dmArgnatWhat:'Même pays, même langue — les comms sont plus simples',
  dmArgclubBtn:'Je t\u2019emmène dans mon club', dmArgclubWhat:'Tu es dans l\u2019équipe principale d\u2019un club — ça pèse',
  dmArgcampBtn:'Bootcamp à mes frais', dmArgcampWhat:'1 000 $ de ton solde — très convaincant',
  dmArgHistory:n=>'On a déjà joué '+n+' soirée(s) ensemble. Tu sais comment je joue',
  dmArgNat:c=>'On vient tous les deux de : '+c+'. Les comms dans notre langue, c\u2019est un plus',
  dmArgClub:c=>'Je suis dans l\u2019équipe principale de '+c+'. Viens avec moi, je pousse pour qu\u2019ils te signent aussi',
  dmArgCamp:v=>'Le bootcamp est pour moi : $'+v+'. Une semaine ensemble et ça va matcher',
  dmCondRole:r=>'Écoute, voilà le deal : je suis partant si c\u2019est toi qui joues '+r+'. Pas besoin de deux pareils',
  dmCondTrial:'Tu m\u2019as presque convaincu. Faisons d\u2019abord une cup ensemble — on verra si ça matche',
  dmCondRoleHint:'Il est partant si tu changes de rôle', dmCondTrialHint:'Il veut un essai : une cup ensemble, puis il décide',
  dmCondRoleBtn:'Je change', dmCondTrialBtn:'Va pour la cup d\u2019essai', dmCondNoBtn:'Non, ça ne me va pas',
  dmCondNo:'Non, ça ne va pas le faire', dmCondNoBack:'Comme tu veux. Écris-moi si ça change',
  dmCondRoleOk:r=>'Deal, '+r+' c\u2019est moi', dmCondTrialOk:'Allez. Une cup et on décide',
  dmCondTrialYes:'Ça marche. On joue la prochaine cup ensemble et je te dis après',
  dmTrialStay:p=>ccTopC(p)+' ensemble. Je reste, on continue',
  dmTrialGo:p=>ccTopC(p)+'. Franchement, ça ne matche pas. Sans rancune, cherche encore',
  ccNewsTrialGone:h=>'L\u2019essai n\u2019a pas marché : @'+ccHandle(h)+' est parti après la première cup'});
Object.assign(I18N.it, {ccSpbTitle:"Sponsor", ccSpbOfferNow:"Offerta ora", ccSpbAll:"Scegli uno sponsor", ccSpbPer:"Pagato a stream", ccOrgMore:"Dettagli", ccSpPostBtn:p=>'📣 Post · +'+p, ccSpPostWaitT:d=>'post tra '+d+' g', ccSpPostReady:'Post sponsorizzato in attesa', ccSpPostTexts:[b=>'setup da torneo pronto — grazie '+b+' 🎮',b=>'con '+b+' ogni sera. live a breve',b=>'è arrivato il nuovo drop '+b+'. che ne dite?',b=>'8 ore di allenamento. '+b+' mi tiene in piedi 💪'], ccSpbDrop:'Rescindi', ccSpbFree:n=>'Slot liberi: '+n+' — firma un marchio qui sotto', ccSpbNextSlot:n=>'Un altro slot da '+n+' follower', ccSpbSwap:'Sostituisci', ccSpbFull:'slot pieni', ccSpbMktOn:r=>'Il marketer tratta: tariffe ×'+r, ccSpbMktOff:'Senza marketer i marchi pagano ×0.8', dmStaffFoot:"Lo staff scrive da sé: dopo le serate, prima dei tornei e sul proprio lavoro.", dmStHi_coach:"Ciao! Sono il tuo coach. Dopo ogni serata analizzo le partite e ti dico su cosa lavorare.", dmStHi_analyst:"Ci sono. Prima dei tornei studio lobby e drop, dopo i numeri.", dmStHi_psych:"Ciao. Ci sono se una serata va storta. Scrivimi quando vuoi.", dmStHi_smm:"Ciao! Gestisco i tuoi social. Ogni settimana ti dico quanti follower sono arrivati.", dmStHi_mkt:"Ciao! Mi occupo degli sponsor. Appena arriva un’offerta ti scrivo.", dmStCoachNight:(p,of,w,s)=>"Analisi: "+p+(of?" su "+of:"")+". "+(p<=Math.max(3,of*0.1)?"Serata forte, teniamo il livello.":p<=of*0.5?"Bene, ma si può di più.":"Dura. Niente panico.")+" Punto forte: "+s.toLowerCase()+", da migliorare: "+w.toLowerCase()+".", dmStCoachWeek:w=>"Questa settimana: focus su "+w.toLowerCase()+".", dmStAnPrep:(ev,d,n,p)=>"Analisi lobby per "+ev+" ("+d+"): il più pericoloso è "+n+", n."+p+" nel PR. Niente fight a fine partita con loro.", dmStAnPrep0:(ev,d)=>"Preparo "+ev+" ("+d+"): drop dei vicini e dove chiude la zona.", dmStAnMe:s=>s, dmStAnKinch:(w,e,d,t,a,p,t10,wn,pt)=>w+": elim. "+e+" · danni ≈"+d+" · subiti ≈"+t+" · in vita ≈"+a+" · posiz. media "+p+" · top 10 "+t10+" · vittorie "+wn+" · punti "+pt, dmStAnYou:"tu", dmStAnMeRow:(w,k,p,b)=>w+" "+k+" ("+p+"%, partita migliore "+b+")", dmStAnNight:(avg,k,g)=>"Numeri: piazzamento medio "+avg+(g?" in "+g+" partite":"")+", "+k+" eliminazioni.", dmStPsBad:p=>"Ho visto, "+p+"°. È una serata, non sei tu. Dormici su, domani ne parliamo con calma.", dmStPsGood:"Qualificato, bravo. Ricorda come stavi prima del via: è il tuo stato di lavoro.", dmStPsWeek:"Come stai in generale? Sonno, stanchezza, umore — se qualcosa pesa, scrivimi.", dmStSmmWeek:(n,all)=>"Settimana social: +"+n+" follower, "+all+" in totale.", dmStMktOffer:(b,pay)=>b+" vuole firmarti: "+pay+" a stream. L’offerta è nella scheda Club.", dmStMktWeek:(b,n)=>"Prossimo marchio: "+b+", da "+n+" follower.", dmStMktTop:"Sei al livello dei marchi più grandi. Teniamo il pubblico.", ccSpbFrom:n=>'da '+n+' follower', ccSpbYours:'il tuo sponsor', ccSpbWait:'in attesa di un\u2019offerta', ccSpbNeedMkt:'le offerte le porta un marketer', ccOrgPayAskBtn:'Chiedi al club di pagare', ccOrgPayNoUntil:d=>'Il club ha detto no · di nuovo dal '+d, ccNewsOrgPays:(o,r)=>o+' ti paga: '+r.toLowerCase(), ccNewsOrgPaysNo:(o,r)=>o+' non paga: '+r.toLowerCase(), ccOrgSignRow:n=>'+'+n+' follower alla firma', roSpotFrom:d=>'si apre il '+d, roChests:'Forzieri', roSpotPow:'Forza del punto', roClubNoUntil:d=>'Il club ha detto no · di nuovo dal '+d, ccStaffYear:'Anno', ccStaffAuto:'Rinnovo automatico', ccStaffOn:'sì', ccStaffOff:'no', ccNewsStaffRenew:(r,n,c,m)=>r+' '+n+': contratto rinnovato per '+(m>=12?'un anno':'un mese')+(c?' — $'+ccNum(c):' — paga il club'), ccNewsStaffGone:(r,n)=>r+' '+n+' se n\u2019è andato: soldi insufficienti per rinnovare', ccStaffTitle:'Staff', ccStaffHire:'Ingaggia', ccStaffRole:{coach:'Coach', agent:'Manager', smm:'SMM', mkt:'Marketing', analyst:'Analista', psych:'Psicologo'}, ccStaffMktFx:r=>'sponsor ×'+r, ccStaffChange:'Cambia', ccAnalyst:'Analista', ccAnalystHint:'Studia avversari e drop prima della serata — più forza di squadra. Solo carriera singola', ccAnalystNone:'Nessun analista', ccAnalystHire:'Vedi analisti', ccAnalystDoes:'Preparazione', ccAnalystPow:p=>'+'+p+' di forza per la serata', ccPsych:'Psicologo', ccPsychHint:'Lavora sul tilt: una serata storta costa meno forma', ccPsychNone:'Nessuno psicologo', ccPsychHire:'Vedi psicologi', ccPsychDoes:'Tilt', ccPsychSoft:p=>'calo di forma più morbido del '+p+'%', ccOrgFans:'Follower del club su X', ccOrgFansEst:'Stima: nessun numero esatto', ccOrgMedia:'Visibilità del club', ccOrgMediaRow:n=>'+'+n+' follower al mese', dmMateBtnrival:'I rivali', dmMateWhatrival:'Di chi diffidare adesso', dmMeTalkrival:()=>'Chi è il più pericoloso adesso, secondo te?', dmMateTalkrival:(n,p,m)=>'Tengo d\u2019occhio '+n+', n.'+p+' nel PR.'+(m ? ' Noi siamo n.'+m+'.' : '')+' Niente fight a fine partita con loro, zona presa presto', dmMateHi:'Bene, adesso siamo una squadra. Scrivimi qui e ci organizziamo per le serate.', dmSecPinned:'Fissati', dmMateTalkDone:'Avete già parlato oggi — domani', ccRoleCool:d=>'Ruolo cambiato da poco — di nuovo tra '+d+' g', ccDuoLimit:'Già tre richieste oggi — domani',
  dmArghistoryBtn:'Abbiamo già giocato insieme', dmArghistoryWhat:'Ricordagli le serate insieme — si ricorda com\u2019è andata',
  dmArgnatBtn:'Stesso paese', dmArgnatWhat:'Stesso paese, stessa lingua — le comms sono più facili',
  dmArgclubBtn:'Ti porto nel mio club', dmArgclubWhat:'Sei nel roster principale di un club — conta',
  dmArgcampBtn:'Bootcamp a mie spese', dmArgcampWhat:'$1.000 dal tuo saldo — convince parecchio',
  dmArgHistory:n=>'Abbiamo già giocato '+n+' serata/e insieme. Sai come gioco',
  dmArgNat:c=>'Veniamo tutti e due da: '+c+'. Le comms nella nostra lingua sono un vantaggio',
  dmArgClub:c=>'Sono nel roster principale di '+c+'. Vieni con me e spingo perché prendano anche te',
  dmArgCamp:v=>'Il bootcamp lo pago io: $'+v+'. Una settimana insieme e ci troviamo',
  dmCondRole:r=>'Senti, facciamo così: ci sto se '+r+' lo fai tu. Due uguali non ci servono',
  dmCondTrial:'Mi hai quasi convinto. Prima una cup insieme — vediamo come ci troviamo',
  dmCondRoleHint:'Ci sta se cambi ruolo', dmCondTrialHint:'Vuole una prova: una cup insieme, poi decide',
  dmCondRoleBtn:'Cambio ruolo', dmCondTrialBtn:'Vada per la cup di prova', dmCondNoBtn:'No, non va',
  dmCondNo:'No, così non va', dmCondNoBack:'Come vuoi. Scrivimi se cambia qualcosa',
  dmCondRoleOk:r=>'Affare fatto, '+r+' lo faccio io', dmCondTrialOk:'Andiamo. Una cup e decidiamo',
  dmCondTrialYes:'Fatto. Giochiamo insieme la prossima cup e poi ti dico',
  dmTrialStay:p=>ccTopC(p)+' insieme. Resto, andiamo avanti',
  dmTrialGo:p=>ccTopC(p)+'. Sinceramente non ci troviamo. Niente di personale, cerca ancora',
  ccNewsTrialGone:h=>'La prova non è andata: @'+ccHandle(h)+' se n\u2019è andato dopo la prima cup'});
Object.assign(I18N.pt, {ccSpbTitle:"Patrocinadores", ccSpbOfferNow:"Oferta agora", ccSpbAll:"Escolher patrocinador", ccSpbPer:"Pago por live", ccOrgMore:"Detalhes", ccSpPostBtn:p=>'📣 Post · +'+p, ccSpPostWaitT:d=>'post em '+d+' d', ccSpPostReady:'Post patrocinado pendente', ccSpPostTexts:[b=>'setup de torneio pronto — valeu '+b+' 🎮',b=>'com '+b+' em toda noite. live já já',b=>'o novo drop da '+b+' chegou. o que acharam?',b=>'8 horas de treino. '+b+' me mantém de pé 💪'], ccSpbDrop:'Encerrar', ccSpbFree:n=>'Vagas livres: '+n+' — assine uma marca abaixo', ccSpbNextSlot:n=>'Mais uma vaga a partir de '+n+' seguidores', ccSpbSwap:'Trocar', ccSpbFull:'vagas cheias', ccSpbMktOn:r=>'Seu marqueteiro negocia: valores ×'+r, ccSpbMktOff:'Sem marqueteiro as marcas pagam ×0.8', dmStaffFoot:"Sua equipe escreve sozinha: depois das noites, antes dos torneios e sobre o trabalho.", dmStHi_coach:"E aí! Sou seu coach. Depois de cada noite eu analiso as partidas e digo no que trabalhar.", dmStHi_analyst:"Na área. Antes dos torneios analiso lobby e drops, depois os números.", dmStHi_psych:"Oi. Estou aqui se uma noite der errado. Me chama quando quiser.", dmStHi_smm:"E aí! Cuido das suas redes. Toda semana te mando quantos seguidores chegaram.", dmStHi_mkt:"E aí! Cuido dos patrocínios. Chegou oferta, te aviso na hora.", dmStCoachNight:(p,of,w,s)=>"Análise: "+p+(of?" de "+of:"")+". "+(p<=Math.max(3,of*0.1)?"Noite forte, mantém o nível.":p<=of*0.5?"Ok, mas dá pra mais.":"Pesado. Sem pânico.")+" Seu forte agora: "+s.toLowerCase()+", precisa melhorar: "+w.toLowerCase()+".", dmStCoachWeek:w=>"Semana: foco em "+w.toLowerCase()+".", dmStAnPrep:(ev,d,n,p)=>"Lobby de "+ev+" ("+d+"): o mais perigoso é "+n+", nº"+p+" no PR. Nada de luta no fim com eles.", dmStAnPrep0:(ev,d)=>"Preparando "+ev+" ("+d+"): drops dos vizinhos e onde a zona fecha.", dmStAnMe:s=>s, dmStAnKinch:(w,e,d,t,a,p,t10,wn,pt)=>w+": elim. "+e+" · dano ≈"+d+" · sofrido ≈"+t+" · vivo ≈"+a+" · posição média "+p+" · top 10 "+t10+" · vitórias "+wn+" · pontos "+pt, dmStAnYou:"tu", dmStAnMeRow:(w,k,p,b)=>w+" "+k+" ("+p+"%, melhor partida "+b+")", dmStAnNight:(avg,k,g)=>"Números: colocação média "+avg+(g?" em "+g+" partidas":"")+", "+k+" eliminações.", dmStPsBad:p=>"Vi, "+p+"º. É uma noite, não é você. Dorme, amanhã a gente conversa com calma.", dmStPsGood:"Classificou, boa. Lembra como se sentiu antes do início: esse é seu estado de trabalho.", dmStPsWeek:"Como você está no geral? Sono, cansaço, humor — se algo pesar, me chama.", dmStSmmWeek:(n,all)=>"Semana nas redes: +"+n+" seguidores, "+all+" no total.", dmStMktOffer:(b,pay)=>b+" quer te assinar: "+pay+" por live. A oferta está na aba Clube.", dmStMktWeek:(b,n)=>"Próxima marca: "+b+", a partir de "+n+" seguidores.", dmStMktTop:"Você está no nível das maiores marcas. Mantém a audiência.", ccSpbFrom:n=>'a partir de '+n+' seguidores', ccSpbYours:'seu patrocinador', ccSpbWait:'esperando oferta', ccSpbNeedMkt:'um marqueteiro traz as ofertas', ccOrgPayAskBtn:'Pedir ao clube para pagar', ccOrgPayNoUntil:d=>'O clube recusou · de novo a partir de '+d, ccNewsOrgPays:(o,r)=>o+' paga seu '+r.toLowerCase(), ccNewsOrgPaysNo:(o,r)=>o+' não vai pagar seu '+r.toLowerCase(), ccOrgSignRow:n=>'+'+n+' seguidores na assinatura', roSpotFrom:d=>'abre em '+d, roChests:'Baús', roSpotPow:'Força do ponto', roClubNoUntil:d=>'O clube recusou · de novo a partir de '+d, ccStaffYear:'Ano', ccStaffAuto:'Renovação automática', ccStaffOn:'sim', ccStaffOff:'não', ccNewsStaffRenew:(r,n,c,m)=>r+' '+n+': contrato renovado por '+(m>=12?'um ano':'um mês')+(c?' — $'+ccNum(c):' — o clube paga'), ccNewsStaffGone:(r,n)=>r+' '+n+' saiu: sem dinheiro para renovar', ccStaffTitle:'Staff', ccStaffHire:'Contratar', ccStaffRole:{coach:'Coach', agent:'Empresário', smm:'SMM', mkt:'Marketing', analyst:'Analista', psych:'Psicólogo'}, ccStaffMktFx:r=>'patrocínio ×'+r, ccStaffChange:'Trocar', ccAnalyst:'Analista', ccAnalystHint:'Estuda adversários e drops antes da noite — mais força do time. Só carreira solo', ccAnalystNone:'Sem analista', ccAnalystHire:'Ver analistas', ccAnalystDoes:'Preparação', ccAnalystPow:p=>'+'+p+' de força na noite', ccPsych:'Psicólogo', ccPsychHint:'Trabalha o tilt: noite ruim custa menos forma', ccPsychNone:'Sem psicólogo', ccPsychHire:'Ver psicólogos', ccPsychDoes:'Tilt', ccPsychSoft:p=>'queda de forma '+p+'% mais suave', ccOrgFans:'Seguidores do clube no X', ccOrgFansEst:'Estimativa: sem número exato', ccOrgMedia:'Visibilidade do clube', ccOrgMediaRow:n=>'+'+n+' seguidores por mês', dmMateBtnrival:'Sobre rivais', dmMateWhatrival:'De quem tomar cuidado agora', dmMeTalkrival:()=>'Quem é o mais perigoso agora, você acha?', dmMateTalkrival:(n,p,m)=>'Tô de olho em '+n+', nº'+p+' no PR.'+(m ? ' A gente é nº'+m+'.' : '')+' Nada de luta no fim contra eles, pegamos a zona cedo', dmMateHi:'Beleza, agora somos um time. Me chama aqui e a gente combina as noites.', dmSecPinned:'Fixados', dmMateTalkDone:'Vocês já conversaram hoje — amanhã', ccRoleCool:d=>'Função trocada há pouco — de novo em '+d+' d', ccDuoLimit:'Já chamou três hoje — amanhã',
  dmArghistoryBtn:'A gente já jogou junto', dmArghistoryWhat:'Lembrar das noites juntos — ele lembra como foi',
  dmArgnatBtn:'Somos do mesmo país', dmArgnatWhat:'Mesmo país, mesma língua — call mais fácil',
  dmArgclubBtn:'Te levo pro meu clube', dmArgclubWhat:'Você tá no time principal de um clube — isso pesa',
  dmArgcampBtn:'Bootcamp por minha conta', dmArgcampWhat:'$1.000 do seu saldo — convence bastante',
  dmArgHistory:n=>'A gente já jogou '+n+' noite(s) junto. Você sabe como eu jogo',
  dmArgNat:c=>'Nós dois somos de: '+c+'. Call na nossa língua é vantagem',
  dmArgClub:c=>'Tô no time principal da '+c+'. Vem comigo que eu forço pra te contratarem também',
  dmArgCamp:v=>'O bootcamp é por minha conta: $'+v+'. Uma semana junto e a gente se acerta',
  dmCondRole:r=>'Olha, fechado assim: eu topo se o '+r+' for você. Dois iguais não dá',
  dmCondTrial:'Quase me convenceu. Bora jogar uma cup junto primeiro — ver se encaixa',
  dmCondRoleHint:'Ele topa se você trocar de função', dmCondTrialHint:'Ele quer um teste: uma cup junto, depois decide',
  dmCondRoleBtn:'Eu troco', dmCondTrialBtn:'Bora a cup de teste', dmCondNoBtn:'Não, assim não dá',
  dmCondNo:'Não, assim não rola', dmCondNoBack:'Você que sabe. Se mudar algo, chama',
  dmCondRoleOk:r=>'Fechado, '+r+' fico eu', dmCondTrialOk:'Bora. Uma cup e a gente decide',
  dmCondTrialYes:'Fechou. A próxima cup a gente joga junto e depois te falo',
  dmTrialStay:p=>ccTopC(p)+' juntos. Fico, bora seguir',
  dmTrialGo:p=>ccTopC(p)+'. Sinceramente não encaixou. Sem ressentimento, segue procurando',
  ccNewsTrialGone:h=>'O teste não deu certo: @'+ccHandle(h)+' saiu depois da primeira cup'});
/* Переговоры с клубом поинтереснее (7.10): размер просьбы, встречное, доля с призовых, бонус за подпись, козырь. */
Object.assign(I18N.ru, {ccAskMoneyLbl:'Деньги', ccAskTermsLbl:'Условия', ccAsk_small:'Чуть больше', ccAsk_fair:'Больше', ccAsk_hard:'Жёстко', ccAskCut:'Меньше доли с призовых', ccAskBonus:'Бонус за подпись',
  ccAskLever:'Сказать про другое предложение', ccAskLeverWhat:'У тебя на руках другой оффер — следующая просьба пройдёт легче', ccSignBonusRow:'Бонус за подпись',
  dmAskSmall:v=>'Предложение нравится. Если подтянете до $'+v+' в месяц — подписываю сразу',
  dmAskHard:v=>'Буду честен: меньше $'+v+' в месяц не рассматриваю. Я знаю, сколько стою',
  dmAskCut:p=>'По деньгам почти сошлись. Но доля клуба с призовых высоковата — давайте '+p+'%',
  dmAskBonus:v=>'Готов подписать. Но хочу бонус за подпись — $'+v+' сразу',
  dmAskLever:c=>'Скажу прямо: '+c+' тоже на меня вышли. Решаю на этой неделе',
  dmOrgLever:c=>'Понимаем. Про '+c+' слышали — постараемся сделать так, чтобы выбор был очевиден',
  dmOrgCounter:(w,m)=>'$'+w+' в месяц не потянем. Можем $'+m+' — это честная середина',
  dmOrgYesCut:p=>'Ладно, '+p+'% с призовых. Для тебя сделаем',
  dmOrgNoCut:'Доля с призовых у нас одна для всех. Тут не двигаемся',
  dmOrgYesBonus:v=>'Договорились: $'+v+' бонусом при подписании',
  dmOrgNoBonus:'Бонус за подпись не даём никому. Зарплата — вот наш аргумент',
  tlSignBonus:(c,v)=>c+': бонус за подпись $'+v,
  dmStFxForm:v=>'+'+v+' к форме',
  dmStFxRest:"меньше усталости",
  dmStFxReach:"немного охвата",
  dmStBtn_coach_drill:"Давай разберём ошибки",
  dmStBtn_coach_rest:"Мне нужен выходной",
  dmStBtn_coach_ok:"Понял, спасибо",
  dmStYou_coach_drill:"Давай разберём ошибки по реплею. Хочу понять, где теряли",
  dmStYou_coach_rest:"Чувствую, что выгораю. Можно завтра полегче?",
  dmStYou_coach_ok:"Понял, спасибо. Учту",
  dmStRe_coach_drill:"Отлично. Скинул таймкоды — смотри третью зону, там всё началось. Завтра отработаем",
  dmStRe_coach_rest:"Без проблем. Отдых — тоже тренировка. Завтра лёгкий день, без скримов",
  dmStRe_coach_ok:"👍 На связи",
  dmStBtn_analyst_vod:"Скинь разбор VOD",
  dmStBtn_analyst_top:"Как играют топы?",
  dmStBtn_analyst_ok:"Ок",
  dmStYou_analyst_vod:"Скинь разбор VOD, посмотрю перед следующим вечером",
  dmStYou_analyst_top:"А как этот эндгейм играли топ-команды?",
  dmStYou_analyst_ok:"Ок, принял",
  dmStRe_analyst_vod:"Готово: 6 клипов с пометками. Главное — ротации после второй зоны",
  dmStRe_analyst_top:"Топы заходят в зону на 20 секунд раньше и берут высоту. Мы опаздываем стабильно",
  dmStRe_analyst_ok:"Если что — пиши",
  dmStBtn_kinch_vod:"Покажи по играм",
  dmStBtn_kinch_top:"Где я против топов?",
  dmStBtn_kinch_ok:"Спасибо",
  dmStYou_kinch_vod:"Покажи по играм — где именно просел?",
  dmStYou_kinch_top:"А где я против топ-10 лобби?",
  dmStYou_kinch_ok:"Спасибо за разбор",
  dmStRe_kinch_vod:"Игры 3 и 5 — ранний вылет без файта. Остальное ровно, дело в дропе",
  dmStRe_kinch_top:"По урону ты в топ-15 лобби, по плейсменту ниже. Файты есть — выживания не хватает",
  dmStRe_kinch_ok:"Всегда пожалуйста. Удачи на следующем",
  dmStBtn_psych_talk:"Давай поговорим",
  dmStBtn_psych_fine:"Я в порядке",
  dmStBtn_psych_later:"Не сейчас",
  dmStYou_psych_talk:"Давай поговорим. Голова забита после вечера",
  dmStYou_psych_fine:"Всё нормально, я в порядке",
  dmStYou_psych_later:"Не сейчас, потом напишу",
  dmStRe_psych_talk:"Хорошо, что сказал. Сегодня без разборов: прогулка, сон, и запиши три вещи, которые получились",
  dmStRe_psych_fine:"Рад слышать. Если накроет — я рядом",
  dmStRe_psych_later:"Конечно. Я на связи, когда будешь готов",
  dmStBtn_smm_clip:"Сделай клип с вечера",
  dmStBtn_smm_fans:"Пост для фанатов",
  dmStBtn_smm_quiet:"Сегодня без постов",
  dmStYou_smm_clip:"Сделай клип с вечера, лучший файт",
  dmStYou_smm_fans:"Давай пост с благодарностью фанатам",
  dmStYou_smm_quiet:"Сегодня без постов, не хочу",
  dmStRe_smm_clip:"Уже режу. Выложим в пик, к вечеру будет охват 🔥",
  dmStRe_smm_fans:"Сделаю. Такие посты аудитория любит",
  dmStRe_smm_quiet:"Понял, тишина. Завтра вернёмся",
  dmStBtn_mkt_more:"Ищи ещё бренды",
  dmStBtn_mkt_big:"Только крупные",
  dmStBtn_mkt_ok:"Ок",
  dmStYou_mkt_more:"Ищи ещё бренды, я открыт к предложениям",
  dmStYou_mkt_big:"Давай только крупные бренды, мелочь не нужна",
  dmStYou_mkt_ok:"Ок, на твоё усмотрение",
  dmStRe_mkt_more:"Принято. Пройдусь по списку, напишу, если кто-то клюнет",
  dmStRe_mkt_big:"Понял. Крупные смотрят на результаты — подиум сильно поможет",
  dmStRe_mkt_ok:"Договорились",
  ccCoReady:["посмотрим в субботу","👀","докажи на турнире","слова слова","верю","ну давай","жду результат","лочнулся 🔒","так держать"],
  ccCoProReady:["👀","посмотрим","увидимся в лобби","бери высоту, тогда поверю","ну-ну"],
  ccCoMateReady:["мы готовы 🤝","го","суббота наша","варимся 🍳","заряжен"],
  ccCoTalk:["реально","факт","👀","жиза","согласен","лол","база","ну такое","+"],
  ccCoProTalk:["реально","лол","👀","факт","+1"],
  ccCoMateTalk:["😂","факт","это правда","лол","ага"],
  ccCoAsk:["зависит от зоны","вопрос года","спроси у Кинча","сложный вопрос","👀","хороший вопрос","тут без вариантов","ответ очевиден"],
  ccCoProAsk:["зависит","👀","лол","скажу в субботу","без комментариев"],
  ccCoMateAsk:["спросишь меня потом","лол","ты знаешь ответ","😂"],
  dyColPlayer:'Игрок и состав', dyYou:'ты', dyPowSplit:'средний рейтинг карточек + синергия',
  ccFnChamp:h=>'Чемпион вечера — @'+h,
  ccLockerTitle:'Шкафчик', ccLockerNone:'Пусто. Баннер дают за гранд-финал или ЛАН и за каждый клуб, кирку — чемпиону FNCS',
  ccLockClub:'баннер клуба', ccLockNow:'сейчас', ccLock_pickaxe:'кирка', ccLock_glider:'дельтаплан', ccLock_spray:'спрей', ccLock_banner:'баннер', ccLock_emote:'эмоция',
  ccNewsLocker:(i,n)=>i+' В шкафчике новое: «'+n+'»',
  ccGalaShare:'Поделиться итогами', ccShareSend:'Отправить', ccShareSave:'Сохранить картинку', ccShareCopy:'Скопировать', ccShareClose:'Закрыть', ccShareCopied:'Картинка скопирована', ccShareSendFail:'Не открылось. Сохрани картинку', ccShareFail:'Картинку нарисовать не вышло', ccShareSeason:'Поделиться сезоном', ccGalaShareTag:'Итоги года', ccGalaVsPrev:'▲▼ — сравнение с прошлым сезоном', ccGalaPrevRow:'Прошлый сезон: призовые · лучшее место',
  ccCastStart:[n=>'Поехали! '+n+' команд в лобби, автобус пошёл', n=>'И мы в эфире — '+n+' команд, кто заберёт эту игру?', n=>'Новая игра, '+n+' команд. Смотрим за дропами'],
  ccCastZone:[(z,n)=>'Зона '+z+' закрывается, осталось '+n, (z,n)=>'Ротации к '+z+'-й зоне — '+n+' команд ещё в игре', (z,n)=>'Круг '+z+'. '+n+' живых, становится тесно'],
  ccCastWipe:[(k,n)=>'Мясо! Минус '+k+' команд за секунды, осталось '+n, (k,n)=>'Что там происходит?! '+k+' команд вылетели разом'],
  ccCastYouKill:[h=>h+' забирает файт!', h=>'Чистый килл от '+h, h=>h+' не прощает ошибок'],
  ccCastYouMulti:[(h,k)=>h+' — '+k+' килла подряд! Это заявка', (h,k)=>'ДАБЛ от '+h+'! Лобби проснулось'],
  ccCastFinal:[n=>'Финальные '+n+'! Каждая ротация решает', n=>'Осталось '+n+' — сейчас начнётся самое интересное'],
  ccCastYouOut:[(h,p)=>'А вот и всё для '+h+' — '+p+'-е место', (h,p)=>h+' падает, '+p+'-е. Обидно'],
  ccCastYouWin:[h=>'VICTORY ROYALE — '+h.toUpperCase()+'!!!', h=>h+' ЗАБИРАЕТ ИГРУ! Какой эндгейм!'],
  ccCastWin:[h=>h+' забирает эту игру', h=>'Победа — '+h+'. Чисто сыграно'],
  ccNewsFnWin:(n,p,h,w)=>n+': чемпион! '+w+' побед подряд, в финале — @'+h+' 🥊',
  ccNewsFnOut:(n,p,h,w)=>n+': '+(p===2 ? 'финал' : p===3 ? 'полуфинал' : p===5 ? 'четвертьфинал' : 'первый круг')+', выбил @'+h,
  ccAskTimeLbl:'Время', ccAskThink:'Дай подумать пару дней', ccAskThinkWhat:p=>'Просьбой не считается. Клуб ждёт '+CC_THINK_DAYS+' дня: ~'+p+'% — поднимут предложение, иначе поставят срок (или уйдут, если тянулись к тебе вниз)',
  dmAskThink:'Спасибо, предложение серьёзное. Дайте пару дней подумать — отвечу',
  dmOrgThinkOk:d=>'Конечно, не торопим. Ждём ответ к '+ccDayLabel(d)+'.',
  dmOrgThinkSweet:v=>'Подумали со своей стороны: чтобы тебе было проще решиться — $'+v+' в месяц. Это наш потолок',
  dmOrgThinkPush:d=>'Нам нужно закрывать состав. Предложение в силе до '+ccDayLabel(d)+', потом идём дальше',
  dmOrgThinkGone:n=>n+': пока ты думал, мы договорились с другим игроком. Без обид, удачи'});
Object.assign(I18N.en, {ccAskMoneyLbl:'Money', ccAskTermsLbl:'Terms', ccAsk_small:'A bit more', ccAsk_fair:'More', ccAsk_hard:'Hardball', ccAskCut:'Smaller prize cut', ccAskBonus:'Signing bonus',
  ccAskLever:'Mention the other offer', ccAskLeverWhat:'You have another offer on the table — your next ask lands easier', ccSignBonusRow:'Signing bonus',
  dmAskSmall:v=>'I like the offer. Bring it to $'+v+' a month and I sign right away',
  dmAskHard:v=>'I will be straight with you: nothing under $'+v+' a month. I know what I am worth',
  dmAskCut:p=>'We are close on money. But the club cut of prize money is steep — let us make it '+p+'%',
  dmAskBonus:v=>'Ready to sign. But I want a signing bonus — $'+v+' up front',
  dmAskLever:c=>'Being honest: '+c+' reached out too. I am deciding this week',
  dmOrgLever:c=>'Understood. We heard about '+c+' — we will make the choice an easy one',
  dmOrgCounter:(w,m)=>'$'+w+' a month is too much for us. We can do $'+m+' — that is a fair middle',
  dmOrgYesCut:p=>'Fine, '+p+'% of prize money. We will make it work for you',
  dmOrgNoCut:'The prize cut is the same for everyone here. We will not move on that',
  dmOrgYesBonus:v=>'Deal: $'+v+' as a signing bonus',
  dmOrgNoBonus:'We do not do signing bonuses for anyone. The salary is our argument',
  tlSignBonus:(c,v)=>c+': signing bonus $'+v,
  dmStFxForm:v=>'+'+v+' form',
  dmStFxRest:"less fatigue",
  dmStFxReach:"a bit of reach",
  dmStBtn_coach_drill:"Let us go over the mistakes",
  dmStBtn_coach_rest:"I need a day off",
  dmStBtn_coach_ok:"Got it, thanks",
  dmStYou_coach_drill:"Let us go over the mistakes on the replay. I want to see where we lost it",
  dmStYou_coach_rest:"I feel burned out. Can tomorrow be lighter?",
  dmStYou_coach_ok:"Got it, thanks. Will keep it in mind",
  dmStRe_coach_drill:"Good. Sent you timestamps — watch zone three, that is where it started. We drill it tomorrow",
  dmStRe_coach_rest:"No problem. Rest is training too. Light day tomorrow, no scrims",
  dmStRe_coach_ok:"👍 Here if you need me",
  dmStBtn_analyst_vod:"Send the VOD review",
  dmStBtn_analyst_top:"How do the top teams play it?",
  dmStBtn_analyst_ok:"Ok",
  dmStYou_analyst_vod:"Send me the VOD review, I will watch it before the next night",
  dmStYou_analyst_top:"How did the top teams play that endgame?",
  dmStYou_analyst_ok:"Ok, noted",
  dmStRe_analyst_vod:"Done: 6 clips with notes. The main thing is rotations after zone two",
  dmStRe_analyst_top:"The top teams enter zone 20 seconds earlier and take height. We are late every time",
  dmStRe_analyst_ok:"Ping me anytime",
  dmStBtn_kinch_vod:"Show me game by game",
  dmStBtn_kinch_top:"Where am I vs the top?",
  dmStBtn_kinch_ok:"Thanks",
  dmStYou_kinch_vod:"Show me game by game — where exactly did I drop?",
  dmStYou_kinch_top:"Where am I against the top 10 of the lobby?",
  dmStYou_kinch_ok:"Thanks for the breakdown",
  dmStRe_kinch_vod:"Games 3 and 5 — early exits without a fight. The rest is steady, it is the drop",
  dmStRe_kinch_top:"Damage puts you in the lobby top 15, placement lower. The fights are there — survival is not",
  dmStRe_kinch_ok:"Anytime. Good luck next time",
  dmStBtn_psych_talk:"Let us talk",
  dmStBtn_psych_fine:"I am fine",
  dmStBtn_psych_later:"Not now",
  dmStYou_psych_talk:"Let us talk. My head is full after the night",
  dmStYou_psych_fine:"All good, I am fine",
  dmStYou_psych_later:"Not now, I will text you later",
  dmStRe_psych_talk:"Good that you said it. No reviews today: a walk, sleep, and write down three things that went well",
  dmStRe_psych_fine:"Glad to hear it. If it hits you — I am here",
  dmStRe_psych_later:"Of course. I am here when you are ready",
  dmStBtn_smm_clip:"Cut a clip from tonight",
  dmStBtn_smm_fans:"A post for the fans",
  dmStBtn_smm_quiet:"No posts today",
  dmStYou_smm_clip:"Cut a clip from tonight, the best fight",
  dmStYou_smm_fans:"Let us do a thank-you post for the fans",
  dmStYou_smm_quiet:"No posts today, not feeling it",
  dmStRe_smm_clip:"Cutting it now. We post at peak, reach by tonight 🔥",
  dmStRe_smm_fans:"On it. The audience loves posts like that",
  dmStRe_smm_quiet:"Got it, quiet day. Back tomorrow",
  dmStBtn_mkt_more:"Keep looking for brands",
  dmStBtn_mkt_big:"Only big brands",
  dmStBtn_mkt_ok:"Ok",
  dmStYou_mkt_more:"Keep looking for brands, I am open to offers",
  dmStYou_mkt_big:"Only big brands please, no small stuff",
  dmStYou_mkt_ok:"Ok, your call",
  dmStRe_mkt_more:"Noted. I will go through the list and tell you if someone bites",
  dmStRe_mkt_big:"Got it. The big ones look at results — a podium would help a lot",
  dmStRe_mkt_ok:"Deal",
  ccCoReady:["see you saturday","👀","prove it in the lobby","talk is cheap","i believe","lets see it","waiting on results","locked in 🔒","keep it up"],
  ccCoProReady:["👀","we will see","see you in the lobby","take height and i will believe it","sure"],
  ccCoMateReady:["we are ready 🤝","lets go","saturday is ours","cooking 🍳","locked in"],
  ccCoTalk:["real","fr","👀","true","agreed","lol","facts","eh","+1"],
  ccCoProTalk:["real","lol","👀","facts","+1"],
  ccCoMateTalk:["😂","facts","this is true","lol","yep"],
  ccCoAsk:["depends on zone","question of the year","ask Kinch","hard one","👀","good question","no contest","answer is obvious"],
  ccCoProAsk:["depends","👀","lol","ask me saturday","no comment"],
  ccCoMateAsk:["ask me later","lol","you know the answer","😂"],
  dyColPlayer:'Player and squad', dyYou:'you', dyPowSplit:'average card rating + synergy',
  ccFnChamp:h=>'Champion of the night — @'+h,
  ccLockerTitle:'Locker', ccLockerNone:'Empty. A banner comes with a grand final, a LAN and every club you play for, the pickaxe with an FNCS title',
  ccLockClub:'club banner', ccLockNow:'current', ccLock_pickaxe:'pickaxe', ccLock_glider:'glider', ccLock_spray:'spray', ccLock_banner:'banner', ccLock_emote:'emote',
  ccNewsLocker:(i,n)=>i+' New in the locker: "'+n+'"',
  ccGalaShare:'Share my year', ccShareSend:'Send', ccShareSave:'Save image', ccShareCopy:'Copy', ccShareClose:'Close', ccShareCopied:'Image copied', ccShareSendFail:'Sharing did not open. Save the image instead', ccShareFail:'Could not draw the picture', ccShareSeason:'Share season', ccGalaShareTag:'Year in review', ccGalaVsPrev:'▲▼ — compared with last season', ccGalaPrevRow:'Last season: prize money · best place',
  ccCastStart:[n=>'Here we go! '+n+' teams in the lobby, the bus is moving', n=>'And we are live — '+n+' teams, who takes this one?', n=>'New game, '+n+' teams. Eyes on the drops'],
  ccCastZone:[(z,n)=>'Zone '+z+' closing, '+n+' left', (z,n)=>'Rotations into zone '+z+' — '+n+' teams still alive', (z,n)=>'Circle '+z+'. '+n+' alive, it is getting tight'],
  ccCastWipe:[(k,n)=>'Carnage! '+k+' teams gone in seconds, '+n+' left', (k,n)=>'What is happening?! '+k+' teams out at once'],
  ccCastYouKill:[h=>h+' takes the fight!', h=>'Clean pick from '+h, h=>h+' does not forgive mistakes'],
  ccCastYouMulti:[(h,k)=>h+' with '+k+' in a row! That is a statement', (h,k)=>'DOUBLE from '+h+'! The lobby is awake'],
  ccCastFinal:[n=>'Final '+n+'! Every rotation matters now', n=>n+' left — this is where it gets good'],
  ccCastYouOut:[(h,p)=>'And that is it for '+h+' — '+p+'th place', (h,p)=>h+' goes down in '+p+'th. Painful'],
  ccCastYouWin:[h=>'VICTORY ROYALE FOR '+h.toUpperCase()+'!!!', h=>h+' TAKES THE GAME! What an endgame!'],
  ccCastWin:[h=>h+' takes this game', h=>'Victory for '+h+'. Clean'],
  ccNewsFnWin:(n,p,h,w)=>n+': champion! '+w+' wins in a row, beat @'+h+' in the final 🥊',
  ccNewsFnOut:(n,p,h,w)=>n+': '+(p===2 ? 'lost the final' : p===3 ? 'out in the semis' : p===5 ? 'out in the quarters' : 'out in round one')+' to @'+h,
  ccAskTimeLbl:'Time', ccAskThink:'Let me think a couple of days', ccAskThinkWhat:p=>'Not an ask. The club waits '+CC_THINK_DAYS+' days: ~'+p+'% they sweeten the offer, otherwise they set a deadline (or walk, if they were reaching down for you)',
  dmAskThink:'Thanks, it is a serious offer. Give me a couple of days to think it over',
  dmOrgThinkOk:d=>'Of course, no rush. We will wait for your answer by '+ccDayLabel(d)+'.',
  dmOrgThinkSweet:v=>'We thought about it on our side too: to make it easier — $'+v+' a month. That is our ceiling',
  dmOrgThinkPush:d=>'We need to lock the roster. The offer stands until '+ccDayLabel(d)+', then we move on',
  dmOrgThinkGone:n=>n+': while you were thinking we agreed terms with another player. No hard feelings, good luck'});
Object.assign(I18N.fr, {ccAskMoneyLbl:'Argent', ccAskTermsLbl:'Conditions', ccAsk_small:'Un peu plus', ccAsk_fair:'Plus', ccAsk_hard:'Sans concession', ccAskCut:'Moins de part sur les gains', ccAskBonus:'Prime à la signature',
  ccAskLever:'Parler de l\u2019autre offre', ccAskLeverWhat:'Tu as une autre offre en main — ta prochaine demande passera plus facilement', ccSignBonusRow:'Prime à la signature',
  dmAskSmall:v=>'L\u2019offre me plaît. Montez à $'+v+' par mois et je signe direct',
  dmAskHard:v=>'Je vais être franc : rien en dessous de $'+v+' par mois. Je sais ce que je vaux',
  dmAskCut:p=>'On est proches sur l\u2019argent. Mais la part du club sur les gains est élevée — passons à '+p+' %',
  dmAskBonus:v=>'Prêt à signer. Mais je veux une prime à la signature — $'+v+' tout de suite',
  dmAskLever:c=>'Pour être honnête : '+c+' m\u2019a contacté aussi. Je décide cette semaine',
  dmOrgLever:c=>'Compris. On a entendu parler de '+c+' — on va rendre le choix évident',
  dmOrgCounter:(w,m)=>'$'+w+' par mois, c\u2019est trop pour nous. On peut faire $'+m+' — un juste milieu',
  dmOrgYesCut:p=>'D\u2019accord, '+p+' % des gains. On fait un effort pour toi',
  dmOrgNoCut:'La part sur les gains est la même pour tout le monde. On ne bouge pas là-dessus',
  dmOrgYesBonus:v=>'Marché conclu : $'+v+' de prime à la signature',
  dmOrgNoBonus:'Pas de prime à la signature, pour personne. Le salaire, c\u2019est notre argument',
  tlSignBonus:(c,v)=>c+' : prime à la signature $'+v});
Object.assign(I18N.it, {ccAskMoneyLbl:'Soldi', ccAskTermsLbl:'Condizioni', ccAsk_small:'Un po\u2019 di più', ccAsk_fair:'Di più', ccAsk_hard:'Linea dura', ccAskCut:'Meno quota sui premi', ccAskBonus:'Bonus alla firma',
  ccAskLever:'Parla dell\u2019altra offerta', ccAskLeverWhat:'Hai un\u2019altra offerta in mano — la prossima richiesta passa più facilmente', ccSignBonusRow:'Bonus alla firma',
  dmAskSmall:v=>'L\u2019offerta mi piace. Arrivate a $'+v+' al mese e firmo subito',
  dmAskHard:v=>'Sarò diretto: sotto i $'+v+' al mese non ci penso. So quanto valgo',
  dmAskCut:p=>'Sui soldi ci siamo quasi. Ma la quota del club sui premi è alta — facciamo '+p+'%',
  dmAskBonus:v=>'Pronto a firmare. Ma voglio un bonus alla firma — $'+v+' subito',
  dmAskLever:c=>'Ti dico la verità: mi ha cercato anche '+c+'. Decido questa settimana',
  dmOrgLever:c=>'Capito. Di '+c+' abbiamo sentito — faremo in modo che la scelta sia facile',
  dmOrgCounter:(w,m)=>'$'+w+' al mese per noi è troppo. Possiamo arrivare a $'+m+' — una via di mezzo onesta',
  dmOrgYesCut:p=>'Va bene, '+p+'% dei premi. Per te facciamo un\u2019eccezione',
  dmOrgNoCut:'La quota sui premi è uguale per tutti. Su questo non ci muoviamo',
  dmOrgYesBonus:v=>'Affare fatto: $'+v+' di bonus alla firma',
  dmOrgNoBonus:'Bonus alla firma non ne diamo a nessuno. L\u2019argomento è lo stipendio',
  tlSignBonus:(c,v)=>c+': bonus alla firma $'+v});
Object.assign(I18N.pt, {ccAskMoneyLbl:'Dinheiro', ccAskTermsLbl:'Condições', ccAsk_small:'Um pouco mais', ccAsk_fair:'Mais', ccAsk_hard:'Jogo duro', ccAskCut:'Menos parte da premiação', ccAskBonus:'Bônus de assinatura',
  ccAskLever:'Falar da outra proposta', ccAskLeverWhat:'Você tem outra proposta na mão — o próximo pedido passa mais fácil', ccSignBonusRow:'Bônus de assinatura',
  dmAskSmall:v=>'Gostei da proposta. Chegando em $'+v+' por mês, eu assino na hora',
  dmAskHard:v=>'Vou ser direto: abaixo de $'+v+' por mês nem considero. Sei quanto valho',
  dmAskCut:p=>'No dinheiro a gente quase fechou. Mas a parte do clube na premiação tá alta — vamos de '+p+'%',
  dmAskBonus:v=>'Pronto pra assinar. Mas quero bônus de assinatura — $'+v+' na hora',
  dmAskLever:c=>'Vou ser sincero: a '+c+' também me procurou. Decido essa semana',
  dmOrgLever:c=>'Entendido. A gente soube da '+c+' — vamos deixar a escolha fácil',
  dmOrgCounter:(w,m)=>'$'+w+' por mês fica pesado pra gente. Dá pra fazer $'+m+' — meio-termo justo',
  dmOrgYesCut:p=>'Fechado, '+p+'% da premiação. Pra você a gente faz',
  dmOrgNoCut:'A parte da premiação é igual pra todo mundo. Nisso a gente não mexe',
  dmOrgYesBonus:v=>'Fechado: $'+v+' de bônus de assinatura',
  dmOrgNoBonus:'Bônus de assinatura a gente não dá pra ninguém. O salário é o nosso argumento',
  tlSignBonus:(c,v)=>c+': bônus de assinatura $'+v});

// Строка «клуб» в шапке карьеры (check-i18n: ключа не было ни в одном языке, на русском стояло «Club»).
Object.assign(I18N.ru,{chOrg:'Клуб'}); Object.assign(I18N.en,{chOrg:'Club'}); Object.assign(I18N.fr,{chOrg:'Club'}); Object.assign(I18N.it,{chOrg:'Club'}); Object.assign(I18N.pt,{chOrg:'Clube'});
/* Своя организация: основание, штат, отделы (29.09). */
Object.assign(I18N.ru, {ogFundH:'Деньги', ogFundSelf:'Свои деньги', ogFundSelfSub:'Клуб целиком твой, весь доход — клубу',
  ogFundInv:'С инвестором', ogFundInvSub:(p,b)=>'Остальное вносит инвестор: '+p+'% всего дохода клуба — ему, пока не выкупишь долю за $'+b,
  ogFocusH:'Направление', ogFocusComp:'Киберспорт', ogFocusCompSub:'Классика: 20% с призовых составов',
  ogFocusContent:'Контент', ogFocusContentSub:'Спонсоры ×1,6 и охват выше, с призовых — 10%',
  ogFocusAcad:'Академия', ogFocusAcadSub:'Академия сразу и 5 мест в ней, спонсоры ×0,8, с призовых — 15%',
  ogFound:'Основать', ogInvPill:p=>'инвестор '+p+'%', ogSponsors:'Спонсоры / мес', ogWages:'Зарплаты составов', ogStaffPay:'Штат',
  ogUpkeep:'Содержание', ogNet:'Итог месяца', ogCutRow:'С призовых', ogInvLine:(p,s)=>'Инвестору идёт '+p+'% дохода · уже получил $'+s, ogBuyback:'Выкупить долю',
  ogBrand:'Бренд: герб, цвет, тег, лого', ogPay:'Зарплата', ogReplace:'Заменить', ogFire:'Уволить', ogHire:'Нанять',
  ccStaff_manager:'Менеджер команды', ccStaff_smm:'SMM-менеджер', ccStaff_coach:'Главный тренер',
  ogEff_manager:t=>'Игроки просят на '+(4*t)+'% меньше, верность составов +'+(25*t)+'%, за проданных +'+(10*t)+'%',
  ogEff_smm:t=>'Спонсоры +'+(15*t)+'%, клуб постит тебя: +'+(150*t)+' подписчиков в месяц',
  ogEff_coach:t=>'Тренер у всех составов — отдельно за него не платишь',
  ogWhy_manager:'Ведёт переговоры: дешевле контракты, составы реже уходят, дороже продажи',
  ogWhy_smm:'Ведёт соцсети клуба: больше денег от спонсоров и подписчиков у тебя',
  ogWhy_coach:'Один тренер на весь клуб вместо тренера за доплату у каждого состава',
  ogStaffH:'Штат', ogDeptH:'Отделы', ogRosterH:'Составы', ogMarketH:'Трансферный рынок',
  ogDept_sponsor:'Отдел спонсорства', ogDept_scout:'Скаутинг', ogDept_house:'Геймхаус',
  ogDeptEff_sponsor:l=>l ? '+$'+(500*l)+' спонсора за каждый состав в месяц' : 'Приводит спонсоров: +$500 за состав на каждый уровень',
  ogDeptEff_scout:l=>l ? 'Академия находит талант ближе к тебе, в списке на '+(4*l)+' больше' : 'Ищет молодых: сильнее кандидаты в академию',
  ogDeptEff_house:l=>l ? 'Буткемп у всех составов — отдельно за него не платишь' : 'Общий дом для составов: буткемп всем сразу',
  ogUpgrade:'Улучшить', ogBuild:'Построить', ogMax:'максимум',
  ccNewsClubStaff:(c,n,r)=>c+': '+n+' — наш новый '+String(r).toLowerCase(), ccNewsClubBuyback:c=>c+': доля инвестора выкуплена, клуб снова целиком наш'});
Object.assign(I18N.en, {ogFundH:'Funding', ogFundSelf:'Own money', ogFundSelfSub:'The club is all yours, every dollar stays in it',
  ogFundInv:'With an investor', ogFundInvSub:(p,b)=>'An investor puts in the rest and takes '+p+'% of all club income until you buy the stake back for $'+b,
  ogFocusH:'Direction', ogFocusComp:'Esports', ogFocusCompSub:'The classic: 20% of the rosters\' prize money',
  ogFocusContent:'Content', ogFocusContentSub:'Sponsors ×1.6 and more reach, 10% of prize money',
  ogFocusAcad:'Academy', ogFocusAcadSub:'Academy from day one with 5 seats, sponsors ×0.8, 15% of prize money',
  ogFound:'Found', ogInvPill:p=>'investor '+p+'%', ogSponsors:'Sponsors / mo', ogWages:'Roster wages', ogStaffPay:'Staff',
  ogUpkeep:'Upkeep', ogNet:'Month net', ogCutRow:'Prize cut', ogInvLine:(p,s)=>'The investor takes '+p+'% of income · paid so far $'+s, ogBuyback:'Buy the stake back',
  ogBrand:'Brand: crest, colour, tag, logo', ogPay:'Salary', ogReplace:'Replace', ogFire:'Let go', ogHire:'Hire',
  ccStaff_manager:'Team manager', ccStaff_smm:'Social media manager', ccStaff_coach:'Head coach',
  ogEff_manager:t=>'Players ask '+(4*t)+'% less, roster loyalty +'+(25*t)+'%, sales +'+(10*t)+'%',
  ogEff_smm:t=>'Sponsors +'+(15*t)+'%, the club posts you: +'+(150*t)+' followers a month',
  ogEff_coach:t=>'A coach for every roster — no per-roster coaching fee',
  ogWhy_manager:'Does the talking: cheaper contracts, rosters stay longer, better sale prices',
  ogWhy_smm:'Runs the club\'s socials: more sponsor money and more followers for you',
  ogWhy_coach:'One coach for the whole club instead of paying for one per roster',
  ogStaffH:'Staff', ogDeptH:'Departments', ogRosterH:'Rosters', ogMarketH:'Transfer market',
  ogDept_sponsor:'Partnerships', ogDept_scout:'Scouting', ogDept_house:'Gaming house',
  ogDeptEff_sponsor:l=>l ? '+$'+(500*l)+' sponsorship per roster a month' : 'Brings sponsors: +$500 per roster for each level',
  ogDeptEff_scout:l=>l ? 'The academy finds talent closer to your level, '+(4*l)+' more in the list' : 'Finds young players: stronger academy candidates',
  ogDeptEff_house:l=>l ? 'A bootcamp for every roster — no per-roster fee' : 'A shared house: a bootcamp for everyone at once',
  ogUpgrade:'Upgrade', ogBuild:'Build', ogMax:'max level',
  ccNewsClubStaff:(c,n,r)=>c+': welcome '+n+', our new '+String(r).toLowerCase(), ccNewsClubBuyback:c=>c+': the investor\'s stake is bought back, the club is all ours again'});
Object.assign(I18N.fr, {ogFundH:'Financement', ogFundSelf:'Fonds propres', ogFundSelfSub:'Le club est entièrement à toi',
  ogFundInv:'Avec un investisseur', ogFundInvSub:(p,b)=>'L\'investisseur apporte le reste et prend '+p+'% des revenus jusqu\'au rachat pour $'+b,
  ogFocusH:'Orientation', ogFocusComp:'Esport', ogFocusCompSub:'Classique : 20 % des gains des équipes',
  ogFocusContent:'Contenu', ogFocusContentSub:'Sponsors ×1,6 et plus d\'audience, 10 % des gains',
  ogFocusAcad:'Académie', ogFocusAcadSub:'Académie dès le début avec 5 places, sponsors ×0,8, 15 % des gains',
  ogFound:'Fonder', ogInvPill:p=>'investisseur '+p+' %', ogSponsors:'Sponsors / mois', ogWages:'Salaires des équipes', ogStaffPay:'Staff',
  ogUpkeep:'Entretien', ogNet:'Solde du mois', ogCutRow:'Part des gains', ogInvLine:(p,s)=>'L\'investisseur prend '+p+' % · déjà versé $'+s, ogBuyback:'Racheter la part',
  ogBrand:'Marque : blason, couleur, tag, logo', ogPay:'Salaire', ogReplace:'Remplacer', ogFire:'Renvoyer', ogHire:'Embaucher',
  ccStaff_manager:'Manager d\'équipe', ccStaff_smm:'Community manager', ccStaff_coach:'Coach principal',
  ogEff_manager:t=>'Joueurs '+(4*t)+' % moins chers, fidélité +'+(25*t)+' %, ventes +'+(10*t)+' %',
  ogEff_smm:t=>'Sponsors +'+(15*t)+' %, le club te met en avant : +'+(150*t)+' abonnés par mois',
  ogEff_coach:t=>'Un coach pour chaque équipe, sans supplément',
  ogWhy_manager:'Négocie : contrats moins chers, équipes plus fidèles, meilleures ventes',
  ogWhy_smm:'Gère les réseaux du club : plus de sponsors et d\'abonnés pour toi',
  ogWhy_coach:'Un seul coach pour tout le club au lieu d\'un par équipe',
  ogStaffH:'Staff', ogDeptH:'Départements', ogRosterH:'Équipes', ogMarketH:'Marché des transferts',
  ogDept_sponsor:'Partenariats', ogDept_scout:'Recrutement', ogDept_house:'Gaming house',
  ogDeptEff_sponsor:l=>l ? '+$'+(500*l)+' de sponsor par équipe et par mois' : 'Amène des sponsors : +$500 par équipe par niveau',
  ogDeptEff_scout:l=>l ? 'L\'académie trouve des talents plus proches de ton niveau, '+(4*l)+' de plus' : 'Repère les jeunes : meilleurs candidats pour l\'académie',
  ogDeptEff_house:l=>l ? 'Bootcamp pour toutes les équipes, sans supplément' : 'Une maison commune : bootcamp pour tous',
  ogUpgrade:'Améliorer', ogBuild:'Construire', ogMax:'niveau max',
  ccNewsClubStaff:(c,n,r)=>c+' : bienvenue à '+n+', notre nouveau '+String(r).toLowerCase(), ccNewsClubBuyback:c=>c+' : part de l\'investisseur rachetée'});
Object.assign(I18N.it, {ogFundH:'Fondi', ogFundSelf:'Soldi propri', ogFundSelfSub:'Il club è tutto tuo',
  ogFundInv:'Con un investitore', ogFundInvSub:(p,b)=>'L\'investitore mette il resto e prende il '+p+'% delle entrate finché non ricompri la quota per $'+b,
  ogFocusH:'Indirizzo', ogFocusComp:'Esport', ogFocusCompSub:'Classico: 20% dei premi dei roster',
  ogFocusContent:'Contenuti', ogFocusContentSub:'Sponsor ×1,6 e più pubblico, 10% dei premi',
  ogFocusAcad:'Accademia', ogFocusAcadSub:'Accademia da subito con 5 posti, sponsor ×0,8, 15% dei premi',
  ogFound:'Fonda', ogInvPill:p=>'investitore '+p+'%', ogSponsors:'Sponsor / mese', ogWages:'Stipendi roster', ogStaffPay:'Staff',
  ogUpkeep:'Mantenimento', ogNet:'Saldo del mese', ogCutRow:'Quota premi', ogInvLine:(p,s)=>'All\'investitore va il '+p+'% · già versati $'+s, ogBuyback:'Ricompra la quota',
  ogBrand:'Brand: stemma, colore, tag, logo', ogPay:'Stipendio', ogReplace:'Sostituisci', ogFire:'Licenzia', ogHire:'Assumi',
  ccStaff_manager:'Team manager', ccStaff_smm:'Social media manager', ccStaff_coach:'Allenatore capo',
  ogEff_manager:t=>'Giocatori chiedono il '+(4*t)+'% in meno, fedeltà +'+(25*t)+'%, vendite +'+(10*t)+'%',
  ogEff_smm:t=>'Sponsor +'+(15*t)+'%, il club ti promuove: +'+(150*t)+' follower al mese',
  ogEff_coach:t=>'Un coach per ogni roster, senza supplemento',
  ogWhy_manager:'Tratta: contratti più economici, roster più fedeli, vendite migliori',
  ogWhy_smm:'Gestisce i social del club: più sponsor e più follower per te',
  ogWhy_coach:'Un solo coach per tutto il club invece di uno per roster',
  ogStaffH:'Staff', ogDeptH:'Reparti', ogRosterH:'Roster', ogMarketH:'Mercato',
  ogDept_sponsor:'Partnership', ogDept_scout:'Scouting', ogDept_house:'Gaming house',
  ogDeptEff_sponsor:l=>l ? '+$'+(500*l)+' di sponsor per roster al mese' : 'Porta sponsor: +$500 per roster per livello',
  ogDeptEff_scout:l=>l ? 'L\'accademia trova talenti più vicini al tuo livello, '+(4*l)+' in più' : 'Cerca giovani: candidati migliori per l\'accademia',
  ogDeptEff_house:l=>l ? 'Bootcamp per tutti i roster, senza supplemento' : 'Una casa comune: bootcamp per tutti',
  ogUpgrade:'Migliora', ogBuild:'Costruisci', ogMax:'livello max',
  ccNewsClubStaff:(c,n,r)=>c+': benvenuto '+n+', nostro nuovo '+String(r).toLowerCase(), ccNewsClubBuyback:c=>c+': quota dell\'investitore ricomprata'});
Object.assign(I18N.pt, {ogFundH:'Dinheiro', ogFundSelf:'Dinheiro próprio', ogFundSelfSub:'O clube é todo seu',
  ogFundInv:'Com investidor', ogFundInvSub:(p,b)=>'O investidor põe o resto e leva '+p+'% da receita até você recomprar a parte por $'+b,
  ogFocusH:'Direção', ogFocusComp:'Esports', ogFocusCompSub:'Clássico: 20% da premiação das equipes',
  ogFocusContent:'Conteúdo', ogFocusContentSub:'Patrocínio ×1,6 e mais alcance, 10% da premiação',
  ogFocusAcad:'Academia', ogFocusAcadSub:'Academia desde o início com 5 vagas, patrocínio ×0,8, 15% da premiação',
  ogFound:'Fundar', ogInvPill:p=>'investidor '+p+'%', ogSponsors:'Patrocínio / mês', ogWages:'Salários das equipes', ogStaffPay:'Staff',
  ogUpkeep:'Manutenção', ogNet:'Saldo do mês', ogCutRow:'Parte da premiação', ogInvLine:(p,s)=>'O investidor leva '+p+'% · já recebeu $'+s, ogBuyback:'Recomprar a parte',
  ogBrand:'Marca: escudo, cor, tag, logo', ogPay:'Salário', ogReplace:'Trocar', ogFire:'Demitir', ogHire:'Contratar',
  ccStaff_manager:'Team manager', ccStaff_smm:'Social media', ccStaff_coach:'Técnico principal',
  ogEff_manager:t=>'Jogadores pedem '+(4*t)+'% menos, lealdade +'+(25*t)+'%, vendas +'+(10*t)+'%',
  ogEff_smm:t=>'Patrocínio +'+(15*t)+'%, o clube te divulga: +'+(150*t)+' seguidores por mês',
  ogEff_coach:t=>'Técnico para todas as equipes, sem custo extra',
  ogWhy_manager:'Negocia: contratos mais baratos, equipes mais fiéis, vendas melhores',
  ogWhy_smm:'Cuida das redes do clube: mais patrocínio e mais seguidores para você',
  ogWhy_coach:'Um técnico para o clube todo em vez de um por equipe',
  ogStaffH:'Staff', ogDeptH:'Departamentos', ogRosterH:'Equipes', ogMarketH:'Mercado',
  ogDept_sponsor:'Parcerias', ogDept_scout:'Olheiros', ogDept_house:'Gaming house',
  ogDeptEff_sponsor:l=>l ? '+$'+(500*l)+' de patrocínio por equipe por mês' : 'Traz patrocinadores: +$500 por equipe por nível',
  ogDeptEff_scout:l=>l ? 'A academia acha talentos mais perto do seu nível, '+(4*l)+' a mais' : 'Procura jovens: candidatos melhores para a academia',
  ogDeptEff_house:l=>l ? 'Bootcamp para todas as equipes, sem custo extra' : 'Uma casa em comum: bootcamp para todos',
  ogUpgrade:'Melhorar', ogBuild:'Construir', ogMax:'nível máx.',
  ccNewsClubStaff:(c,n,r)=>c+': bem-vindo '+n+', nosso novo '+String(r).toLowerCase(), ccNewsClubBuyback:c=>c+': parte do investidor recomprada'});
Object.assign(I18N.ru, {lfRateYou:'Твоя оценка'}); Object.assign(I18N.en, {lfRateYou:'Your rating'});
Object.assign(I18N.fr, {lfRateYou:'Ta note'}); Object.assign(I18N.it, {lfRateYou:'Il tuo voto'}); Object.assign(I18N.pt, {lfRateYou:'Tua nota'});
Object.assign(I18N.ru, {stPrizeEach:'каждому'}); Object.assign(I18N.en, {stPrizeEach:'each'});
Object.assign(I18N.fr, {stPrizeEach:'chacun'}); Object.assign(I18N.it, {stPrizeEach:'a testa'}); Object.assign(I18N.pt, {stPrizeEach:'cada'});
Object.assign(I18N.ru, {rcNextH:'Следующий раунд',rcNextSub:s=>'Играть самому или симулировать? Через '+s+' с — симуляция',
  rcSim:'Симулировать раунд', rcSimAll:'Симулировать всё', rcPlay:'Играть'});
Object.assign(I18N.en, {rcNextH:'Next round', rcNextSub:s=>'Play it yourself or simulate? Simulating in '+s+' s',
  rcSim:'Simulate round', rcSimAll:'Simulate the rest', rcPlay:'Play'});
Object.assign(I18N.fr, {rcNextH:'Manche suivante', rcNextSub:s=>'La jouer ou la simuler ? Simulation dans '+s+' s',
  rcSim:'Simuler la manche', rcSimAll:'Tout simuler', rcPlay:'Jouer'});
Object.assign(I18N.it, {rcNextH:'Prossimo round', rcNextSub:s=>'Giocarlo o simularlo? Simulazione tra '+s+' s',
  rcSim:'Simula il round', rcSimAll:'Simula tutto', rcPlay:'Gioca'});
Object.assign(I18N.pt, {rcNextH:'Próxima rodada', rcNextSub:s=>'Jogar ou simular? Simulando em '+s+' s',
  rcSim:'Simular rodada', rcSimAll:'Simular tudo', rcPlay:'Jogar'});
// Тренировка: карты Creative, оценки, Арена, своя карта, полоса недели.
Object.assign(I18N.ru, {ccActtrPit:'The Pit', ccActtrBox:'Бокс-файты', ccActtrZw:'Зон-вары', ccActtrEdit:'Эдит-курс', ccActtrMap:'Своя карта',
  lfArena:'Арена', lfArenaDiv:'див.',
  lfNewsArena:(d,n,b)=>'Арена: '+d+' Hype, '+n+' · лучшее место #'+b, lfNewsArenaChamp:()=>'Champion League! Кэш-капы открыты',
  lfGradeLast:'Последняя оценка', lfMapBuild:(p,n)=>'Стройка: '+p+' из '+n+' вечеров', lfMapLive:(nm,c,pl,e)=>nm+' · '+c+' · '+pl+' игр за месяц · всего '+e,
  lfMapUpdate:'Обновить карту', lfMapGive:'деньги за игры', lfNewsMapOut:(nm,c)=>'Моя карта вышла: '+nm+' — код '+c,
  lfNewsMapUpd:nm=>'Обновил карту '+nm, lfNewsMapPay:(nm,pl,m)=>nm+': '+pl+' игр за месяц, выплата '+m,
  lfTwH:'Неделя', lfTwPick:'выбери'});
Object.assign(I18N.en, {ccActtrPit:'The Pit', ccActtrBox:'Box fights', ccActtrZw:'Zone wars', ccActtrEdit:'Edit course', ccActtrMap:'Own map',
  lfArena:'Arena', lfArenaDiv:'div.',
  lfNewsArena:(d,n,b)=>'Arena: '+d+' Hype, '+n+' · best place #'+b, lfNewsArenaChamp:()=>'Champion League! Cash cups are open',
  lfGradeLast:'Last grade', lfMapBuild:(p,n)=>'Building: '+p+' of '+n+' evenings', lfMapLive:(nm,c,pl,e)=>nm+' · '+c+' · '+pl+' plays this month · '+e+' total',
  lfMapUpdate:'Update the map', lfMapGive:'money from plays', lfNewsMapOut:(nm,c)=>'My map is out: '+nm+' — code '+c,
  lfNewsMapUpd:nm=>'Updated my map '+nm, lfNewsMapPay:(nm,pl,m)=>nm+': '+pl+' plays this month, payout '+m,
  lfTwH:'Week', lfTwPick:'pick'});
Object.assign(I18N.fr, {ccActtrPit:'The Pit', ccActtrBox:'Box fights', ccActtrZw:'Zone wars', ccActtrEdit:'Parcours d\'édit', ccActtrMap:'Ma map',
  lfArena:'Arène', lfArenaDiv:'div.',
  lfNewsArena:(d,n,b)=>'Arène : '+d+' Hype, '+n+' · meilleure place #'+b, lfNewsArenaChamp:()=>'Champion League ! Cash cups ouvertes',
  lfGradeLast:'Dernière note', lfMapBuild:(p,n)=>'Construction : '+p+' soirées sur '+n, lfMapLive:(nm,c,pl,e)=>nm+' · '+c+' · '+pl+' parties ce mois · '+e+' au total',
  lfMapUpdate:'Mettre à jour la map', lfMapGive:'argent des parties', lfNewsMapOut:(nm,c)=>'Ma map est sortie : '+nm+' — code '+c,
  lfNewsMapUpd:nm=>'Map '+nm+' mise à jour', lfNewsMapPay:(nm,pl,m)=>nm+' : '+pl+' parties ce mois, versement '+m,
  lfTwH:'Semaine', lfTwPick:'à choisir'});
Object.assign(I18N.it, {ccActtrPit:'The Pit', ccActtrBox:'Box fight', ccActtrZw:'Zone wars', ccActtrEdit:'Percorso edit', ccActtrMap:'La mia mappa',
  lfArena:'Arena', lfArenaDiv:'div.',
  lfNewsArena:(d,n,b)=>'Arena: '+d+' Hype, '+n+' · miglior posto #'+b, lfNewsArenaChamp:()=>'Champion League! Cash cup aperte',
  lfGradeLast:'Ultimo voto', lfMapBuild:(p,n)=>'Costruzione: '+p+' serate su '+n, lfMapLive:(nm,c,pl,e)=>nm+' · '+c+' · '+pl+' partite nel mese · '+e+' in totale',
  lfMapUpdate:'Aggiorna la mappa', lfMapGive:'soldi dalle partite', lfNewsMapOut:(nm,c)=>'La mia mappa è uscita: '+nm+' — codice '+c,
  lfNewsMapUpd:nm=>'Mappa '+nm+' aggiornata', lfNewsMapPay:(nm,pl,m)=>nm+': '+pl+' partite nel mese, pagamento '+m,
  lfTwH:'Settimana', lfTwPick:'scegli'});
Object.assign(I18N.pt, {ccActtrPit:'The Pit', ccActtrBox:'Box fights', ccActtrZw:'Zone wars', ccActtrEdit:'Curso de edit', ccActtrMap:'Meu mapa',
  lfArena:'Arena', lfArenaDiv:'div.',
  lfNewsArena:(d,n,b)=>'Arena: '+d+' Hype, '+n+' · melhor lugar #'+b, lfNewsArenaChamp:()=>'Champion League! Cash cups liberadas',
  lfGradeLast:'Última nota', lfMapBuild:(p,n)=>'Construção: '+p+' de '+n+' noites', lfMapLive:(nm,c,pl,e)=>nm+' · '+c+' · '+pl+' partidas no mês · '+e+' no total',
  lfMapUpdate:'Atualizar o mapa', lfMapGive:'dinheiro das partidas', lfNewsMapOut:(nm,c)=>'Meu mapa saiu: '+nm+' — código '+c,
  lfNewsMapUpd:nm=>'Mapa '+nm+' atualizado', lfNewsMapPay:(nm,pl,m)=>nm+': '+pl+' partidas no mês, pagamento '+m,
  lfTwH:'Semana', lfTwPick:'escolha'});
// Главная по образцу EA FC: плитки «Цели» и «Развитие».
Object.assign(I18N.ru, {hgTitle:'Цели', hgClub:'Клуб', hgMonth:'Задача месяца', hgOwn:'Своя цель', hgDone:'выполнено',
  hgNow:'сейчас', hgOpen:'в работе', hgNone:'Клуб целей не ставил', hgNoClub:'Без клуба целей сезона нет — поставь свою в тренировке',
  hgSet:'Поставить цель и фокус', hdTitle:'Развитие', hdToTrain:'В тренировку'});
Object.assign(I18N.en, {hgTitle:'Objectives', hgClub:'Club', hgMonth:'Monthly task', hgOwn:'Personal goal', hgDone:'done',
  hgNow:'now', hgOpen:'in progress', hgNone:'The club has set no objectives', hgNoClub:'No club, no season objectives — set your own in training',
  hgSet:'Set a goal and focus', hdTitle:'Development', hdToTrain:'To training'});
Object.assign(I18N.fr, {hgTitle:'Objectifs', hgClub:'Club', hgMonth:'Mission du mois', hgOwn:'Objectif perso', hgDone:'fait',
  hgNow:'actuel', hgOpen:'en cours', hgNone:'Le club n\'a fixé aucun objectif', hgNoClub:'Sans club, pas d\'objectifs de saison — fixe le tien à l\'entraînement',
  hgSet:'Fixer un objectif et un focus', hdTitle:'Progression', hdToTrain:'Vers l\'entraînement'});
Object.assign(I18N.it, {hgTitle:'Obiettivi', hgClub:'Club', hgMonth:'Compito del mese', hgOwn:'Obiettivo personale', hgDone:'fatto',
  hgNow:'ora', hgOpen:'in corso', hgNone:'Il club non ha fissato obiettivi', hgNoClub:'Senza club niente obiettivi di stagione — fissa il tuo in allenamento',
  hgSet:'Fissa obiettivo e focus', hdTitle:'Crescita', hdToTrain:'All\'allenamento'});
Object.assign(I18N.pt, {hgTitle:'Objetivos', hgClub:'Clube', hgMonth:'Tarefa do mês', hgOwn:'Meta pessoal', hgDone:'feito',
  hgNow:'agora', hgOpen:'em andamento', hgNone:'O clube não definiu objetivos', hgNoClub:'Sem clube, sem objetivos da temporada — defina o seu no treino',
  hgSet:'Definir meta e foco', hdTitle:'Evolução', hdToTrain:'Para o treino'});
/* БОЛЬШЕ РЕПЛИК (его слово 7.10: «просто больше фраз добавить, реплаи тимейту, менеджеру и т.д.» — вместо ИИ).
   dm — дополнительные варианты реплик в личке по ключу (с голосом): выбирает ccText по m.vi; co — добавка
   к пулам реплаев под постами (ccCo*). Метки {a0} {top0} {Top0} {date0} — ccMoreFill. Данные —
   tools/measured/lines-more/<язык>.json, вставляет tools/build-lines-more.js. */
// ==== CC_LINES_MORE (tools/build-lines-more.js) ====
var CC_LINES_MORE=(typeof CC_LINES_MORE!=='undefined' && CC_LINES_MORE) || {};
// ==== /CC_LINES_MORE ====
function ccMoreFill(tpl, a){
  return String(tpl).replace(/\{(a|top|Top|date)(\d)\}/g, (m, t, i)=>{
    const v=(a||[])[+i];
    if(t==='a') return v==null ? '' : String(v);
    try{ return t==='top' ? ccTop(v) : t==='Top' ? ccTopC(v) : ccDayLabel(v); }catch(e){ return String(v); }
  });
}
function L(){
  if(CC_L_CACHE[LANG]) return CC_L_CACHE[LANG];
  const own=I18N[LANG]||I18N.en;
  // English underneath, so a key nobody has reached yet still says something.
  CC_L_CACHE[LANG]= (LANG==='en') ? own : Object.assign({}, I18N.en, own);
  // Пулы реплаев под постами — шире (CC_LINES_MORE.co). Своя копия, I18N не трогаем.
  const more=(CC_LINES_MORE[LANG]||{}).co;
  if(more){
    if(LANG==='en') CC_L_CACHE[LANG]=Object.assign({}, own);
    Object.keys(more).forEach(k=>{ const base=CC_L_CACHE[LANG][k]; if(Array.isArray(base)) CC_L_CACHE[LANG][k]=base.concat(more[k]); });
  }
  CC_L_CACHE[LANG]=ccNoDashDict(CC_L_CACHE[LANG]);
  return CC_L_CACHE[LANG];
}
/* БЕЗ ДЛИННЫХ ТИРЕ (его слово 18.10: «длинные тире убери»; главная — 17.10). Весь текст интерфейса идёт через L(), и
   словарь языка чистится один раз, на копии (I18N не трогается): строки, массивы строк и функции-шаблоны (их
   результат). Первое « — » в предложении — двоеточие, если двоеточия до него нет, дальше — запятые; тире в
   начале фразы снимается; одиночное (пустая клетка) — «-»; между числами — «-». Названия турниров в данных не
   трогаются: по ним код сверяет события. */
function ccNoDash(s){
  if(typeof s!=='string' || s.indexOf('—')<0) return s;
  if(/^\s*—\s*$/.test(s)) return '-';
  s=s.replace(/(\d)\s*—\s*(\d)/g, '$1-$2');
  s=s.replace(/(^|[\n(«"])[  ]*—[  ]*/g, '$1');
  s=s.replace(/[  ]+—[  ]*$/g, '');
  s=s.replace(/[^.!?\n]+[.!?\n]*/g, sen=>{
    let used=false;
    return sen.replace(/[  ]+—(?:[  ]+|(?=<)|$)/g, (m, off)=>{
      const before=sen.slice(0, off).replace(/<[^>]*>/g, '');
      if(!used && before.indexOf(':')<0 && before.trim()){ used=true; return ': '; }
      return ', ';
    });
  });
  return s.replace(/—/g, '-');
}
function ccNoDashDict(d){
  const out={};
  Object.keys(d).forEach(k=>{
    const v=d[k];
    if(typeof v==='string') out[k]=ccNoDash(v);
    else if(typeof v==='function') out[k]=function(){ const r=v.apply(this, arguments); return typeof r==='string' ? ccNoDash(r) : Array.isArray(r) ? r.map(ccNoDash) : r; };
    else if(Array.isArray(v)) out[k]=v.map(x=>typeof x==='string' ? ccNoDash(x)
      : typeof x==='function' ? function(){ const r=x.apply(this, arguments); return typeof r==='string' ? ccNoDash(r) : r; } : x);
    else out[k]=v;
  });
  return out;
}
function applyStaticI18n(){
  // {CARDS} / {EVENTS} are filled from the roster itself so the explainer can
  // never drift out of date when players or tournaments are added.
  const cards=PLAYERS.length;
  const events=new Set(PLAYERS.map(p=>p.event)).size;
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key=el.getAttribute('data-i18n');
    const val=L()[key];
    if(typeof val!=='string') return;
    // Тот же текст не переписывать: новая отрисовка первого экрана считается поздним LCP.
    const html=val.replace(/\{CARDS\}/g,cards).replace(/\{EVENTS\}/g,events);
    if(el.innerHTML!==html) el.innerHTML=html;
  });
  ccModeCountPills();
}
/* Строка через «·» — это перечисление, и выглядеть оно должно рядом пилюль,
   а не одной длинной плашкой. Режется после перевода: в словаре строка живёт
   целиком и по-своему в каждом языке, а разделитель у них общий. */
function ccModeCountPills(){
  document.querySelectorAll('.mode-count').forEach(function(el){
    const txt=(el.textContent||'').trim();
    if(!txt) return;
    el.innerHTML=txt.split('·').map(function(p){
      return '<i>'+esc(p.trim())+'</i>';
    }).join('');
  });
}
function refreshPreRegionLabels(){
  // The pre-draft heading changes wording depending on whether the choice is
  // exclusive, so applyStaticI18n's data-i18n text has to be re-overridden.
  const el=document.getElementById('preRegionChecks');
  if(el && el.children.length){
    const singlePick = pendingCards || el.querySelectorAll('button').length<=1
      || !el.querySelector('[data-region="ALL"]');
    // By id, not by position: this screen has two headings now and the first of
  // them is the mode question, so 'the first h4' silently retitled the wrong one.
  const titleEl=document.getElementById('preregionTitle');
    const noteEl=document.getElementById('preregionNote');
    if(titleEl) titleEl.textContent = singlePick ? L().preregionTitleOne : L().preregionTitle;
    if(noteEl) noteEl.textContent = singlePick ? L().preregionNoteOne : L().preregionNote;
  }
  if(el){
    el.querySelectorAll('button').forEach(b=>{
      if(b.dataset.region==='ALL') b.textContent=L().allRegions;
      else if(b.dataset.region) b.textContent=regionName(b.dataset.region);
    });
  }
  const eraEl=document.getElementById('eraChecks');
  if(eraEl){
    eraEl.querySelectorAll('button').forEach(b=>{
      if(b.dataset.year==='all') b.textContent=L().eraAll;
    });
  }
}

// persist===false is the restore-on-load path: it repaints the UI without
// writing back, so a language merely guessed from navigator.language never
// hardens into a saved preference the user did not actually pick.
function setLang(lang, persist){
  if(CC_LANG_FILES[lang] && !CC_LANG_DONE[lang]){ ccLangLoad(lang, function(){ setLang(lang, persist); }); if(LANG!==lang){ LANG=lang; } return; }
  LANG=lang;
  setTimeout(function(){ try{ if(typeof mgrHeroText==='function') mgrHeroText(); }catch(e){} }, 0);   // подписи блока Fortnite Manager
  // The year's labels are built once and cached; a language change rebuilds them.
  CC_YEAR_DAYS=null;
  /* Две двери в командную карьеру на карточке карьеры — только когда лобби
     есть куда подключаться (CC_MP_OPEN). Стоит здесь, потому что setLang
     зовётся на загрузке и проходит по всем data-i18n: подписи кнопок
     проставляются тем же обходом, что и остальное меню. */
  (function(){ /* Ряда дверей на карточке карьеры больше нет — они переехали в
                  полосу под героем (.cstrip). Остались герой и полоса. */
               /* Дверей «вдвоём» и «по коду» в герое больше нет (5 сентября,
                  «будто одно и то же два раза») — командные двери только в
                  полосе карьеры под героем (см. .cstrip), этим флагом. */
               ['heroTeam','cstripDuo','cstripRace','cstripCode'].forEach(function(id){
                 const b=document.getElementById(id);
                 if(b) b.hidden=!CC_MP_OPEN;
               }); })();
  if(persist!==false){ try{ localStorage.setItem(LS_LANG, lang); }catch(e){} }
  // Компетитив на том же языке; путь относительный — зеркало живёт в подпапке.
  try{ const nc=document.getElementById('navComp'); if(nc) nc.setAttribute('href', (/\/(ru|fr|it|pt|de|es)\/(index\.html)?$/.test(location.pathname) ? '../' : '')+(lang==='en' ? '' : lang+'/')+'competitive'); }catch(e){}
  // Сменил язык руками на /ru/ и т.п. — адрес следом, иначе перезагрузка вернула бы язык адреса.
  if(persist!==false && CC_PATH_LANG && lang!==CC_PATH_LANG){
    try{ history.replaceState(null, '', '/' + (lang==='en' ? '' : lang + '/') + location.search + location.hash); }catch(e){}
  }
  try{ if(typeof homeRender==='function') homeRender(); }catch(e){}
  // Keep the declared language honest, otherwise search engines and screen
  // readers go on trusting whatever <html lang> said at load.
  document.documentElement.lang=lang;
  // Один заголовок на всех языках: имя сайта первым, слова поиска следом. Переводы (CC_SEO) в description и og/twitter.
  document.title = 'fncsdraft: fortnite career mode';
  // The career hub is built as innerHTML through L() at the moment it is drawn,
  // so it keeps whatever language it was drawn in. data-i18n nodes get swept by
  // the loop below and the tabs change; the body does not, and a player who
  // switched to Russian sat looking at Russian tabs over an English screen.
  //
  // Both harnesses missed it because both re-rendered the hub themselves before
  // reading it. Nothing was checking the one path a player actually takes:
  // press RU, change nothing else.
  if(typeof CAREER!=='undefined' && CAREER){
    const hub=document.getElementById('screen-career-hub');
    if(hub && hub.classList.contains('active')) careerRenderHub(CH_TAB);
  }
  CC_LANGS.forEach(function(code){
    const b=document.getElementById('lang'+code.charAt(0).toUpperCase()+code.slice(1));
    if(!b) return;
    b.style.background = lang===code ? 'var(--accent)' : 'var(--panel2)';
    b.style.color = lang===code ? 'var(--accent-ink)' : 'var(--ink-dim)';
    b.classList.toggle('lang-on', lang===code);
  });
  applyStaticI18n();
  renderAchievementBadge();
  if(document.getElementById('screen-draft').classList.contains('active')){
    buildRegionFilter();
    rerenderDraftPacks();
    updateLootPoolNote();
    renderSlots();
  }
  if(document.getElementById('screen-preregion').classList.contains('active')){
    refreshPreRegionLabels();
  }
  if(document.getElementById('screen-history').classList.contains('active')){
    renderHistoryScreen();
  }
  /* Экран создания тоже: applyStaticI18n возвращает подписи по data-i18n, а у
     поля полос подпись зависит от ГОДА — в году без дивизионов она своя
     (ccStartOvr, см. ccRenderChips). Без этой строки нажатие RU/EN посреди
     создания карьеры 2024-го писало над чипами «Дивизион». */
  if(document.getElementById('screen-career-create').classList.contains('active')){
    if(typeof ccRenderChips==='function') ccRenderChips();
  }
  // Выбор года драфта на главной — подписи на языке, который включили.
  if(typeof homeDraftInit==='function') try{ homeDraftInit(); }catch(e){}
  // Таблица дня на главной — тоже (Notion «20.10»: английская главная с русской шапкой таблицы).
  if(typeof homeDailyDraw==='function' && document.getElementById('homeDaily') && !document.getElementById('homeDaily').hidden) try{ homeDailyDraw(); }catch(e){}
  if(typeof homeHlDraw==='function') try{ homeHlDraw(); }catch(e){}
  document.documentElement.classList.remove('i18n-wait');   // язык стоит — страницу можно показать (см. <head>)
}

const REGIONS=[
  {code:'EU',nameEn:'Europe',nameRu:'Европа'},{code:'NAC',nameEn:'NA Central',nameRu:'NA Central'},{code:'NAW',nameEn:'NA West',nameRu:'NA West'},
  {code:'BR',nameEn:'Brazil',nameRu:'Бразилия'},{code:'ASIA',nameEn:'Asia',nameRu:'Азия'},{code:'ME',nameEn:'Middle East',nameRu:'Ближний Восток'},{code:'OCE',nameEn:'Oceania',nameRu:'Океания'},
];
const RARITY_COLOR={common:'var(--common)',uncommon:'var(--uncommon)',rare:'var(--rare)',epic:'var(--epic)',legendary:'var(--legendary)',mythic:'var(--mythic)',
                    // Контент-мейкер Про-Ама — см. --exotic и shownRarity.
                    exotic:'var(--exotic)', form:'var(--form)'};
const FLAG={
  'Австрия':'\u{1F1E6}\u{1F1F9}','Россия':'\u{1F1F7}\u{1F1FA}','США':'\u{1F1FA}\u{1F1F8}',
  'Дания':'\u{1F1E9}\u{1F1F0}','Канада':'\u{1F1E8}\u{1F1E6}','Великобритания':'\u{1F1EC}\u{1F1E7}',
  'Словения':'\u{1F1F8}\u{1F1EE}','Румыния':'\u{1F1F7}\u{1F1F4}','Швеция':'\u{1F1F8}\u{1F1EA}',
  'Польша':'\u{1F1F5}\u{1F1F1}','Испания':'\u{1F1EA}\u{1F1F8}','Израиль':'\u{1F1EE}\u{1F1F1}',
  'Швейцария':'\u{1F1E8}\u{1F1ED}','Германия':'\u{1F1E9}\u{1F1EA}','Шотландия':'\u{1F3F4}',
  'Италия':'\u{1F1EE}\u{1F1F9}'
};
const FLAG_CODE={
  'Австрия':'at','Россия':'ru','США':'us','Дания':'dk','Канада':'ca','Великобритания':'gb',
  'Словения':'si','Румыния':'ro','Швеция':'se','Польша':'pl','Испания':'es','Израиль':'il',
  'Швейцария':'ch','Германия':'de','Шотландия':'gb','Италия':'it','Мексика':'mx'
};
const FLAG_CODE_MISSING_COMMON={'Турция':'tr','Нидерланды':'nl','Португалия':'pt','Бельгия':'be','Греция':'gr'};
Object.assign(FLAG_CODE, FLAG_CODE_MISSING_COMMON);
function flagImg(nat, size){
  const code=FLAG_CODE[nat];
  if(!code) return '';
  const h=size||16, w=Math.round(h*4/3);
  const nm=(typeof natDisplay==='function') ? natDisplay(nat) : nat;
  return `<img src="flags/w40/${code}.png" alt="${nm}" title="${nm}" width="${w}" height="${h}" style="vertical-align:-2px;border-radius:2px;display:inline-block;margin-right:4px;">`;
}
/* Флаг карточки, а если страны нет нигде (ни у Epic, ни на Liquipedia — у трети игроков
   квалификаторов) — значок региона того же размера, чтобы строка не зияла пустотой. */
function cardFlag(p, size){
  if(p && p.nat){ const f=flagImg(p.nat, size); if(f) return f; }
  const r=p && p.region; if(!r) return '';
  const h=size||16, w=Math.round(h*4/3);
  return `<span class="reg-badge" title="${r}" style="display:inline-block;width:${w}px;height:${h}px;line-height:${h}px;font-size:${Math.max(7,Math.round(h*0.5))}px;font-weight:800;text-align:center;border-radius:2px;margin-right:4px;vertical-align:-2px;background:#2b3a67;color:#cfd8ff;letter-spacing:-.2px;overflow:hidden">${r==='ASIA'?'AS':r}</span>`;
}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function rarityFor(placement){
  if(placement==null) return 'common';
  if(placement<=1) return 'legendary';
  if(placement<=3) return 'epic';
  if(placement<=6) return 'rare';
  return 'uncommon';
}

// Card rating/rarity bands:
// 100 Mythic (gold)     — won on an actual offline LAN (Global Championship, Invitational, Major Summit)
//  90 Legendary (orange)— won any online FNCS (Grand Finals/Major/All-Star, 1st place)
// 80-89 Epic (purple)   — top 10 finish
// 70-79 Rare (blue)     — any ranked finish below top 10
// 60-69 Uncommon (green)/50-59 Common (gray) — unranked qualifier appearances (no public placement)
// Floor is always 50 — nothing goes lower.
function isLANEvent(event){
  if(!event) return false;
  return event.includes('Global Championship') || event.includes('Invitational 2022') || event.includes('Major 1 Summit');
}
function ratingForRank(rank, percentile, event){
  if(rank==null) return 55; // unranked/qualifier appearance — flat common-tier floor
  if(isLANEvent(event)){
    if(rank===1) return 100;
    if(rank===2) return 95;
    if(rank===3) return 90;
  } else if(rank===1){
    return 90;
  }
  const pctFrac = clamp(percentile,0,100)/100;
  if(rank<=10) return clamp(Math.round(80 + pctFrac*9), 80, 89);
  return clamp(Math.round(70 + pctFrac*9), 70, 79);
}
// The rarity a player can actually verify.
//
// p.rarity comes from p.rating — the tournament result — but the big number on
// the card is a.ovr, the weighted attribute total, and the two drift apart on
// about 5% of cards (worst case 21 points). That produced purple cards reading
// 61. Colour follows the number the player can see; p.rating still decides how
// strong the card is in play, it just no longer decides its colour.
function shownRarity(p){
  if(!p) return 'common';
  /* Контент-мейкер Про-Ама носит СВОЮ редкость — Exotic, цветом самой игры
     (#70C7F8, см. --exotic). Правка: в этой комнате креатор не
     про и не ладдер, и рейтинг у него один на всех (67), так что обычная
     лестница по числу сказала бы про всех одно и то же слово. */
  if(p.creator) return 'exotic';
  // Карточка формы носит свой вид при любом числе — см. ccFormCardsFor.
  /* Только объект события: у карточки напарника по сети form — ЧИСЛО (форма в карьере, mp.js MP.card), и в хорошей
     форме он рисовался чёрной «IN FORM» с «undefined +undefined» (Notion 20.10, «почему чёрная карта»). */
  if(ccIsFormCard(p)) return 'form';
  // Colour follows the number actually printed on the card. For everyone in the
  // roster that is just their rating; for a career player it also carries what
  // country and age are worth, so a 92 reads legendary rather than sitting in
  // epic purple with a legendary number on it.
  //
  // Division is deliberately not read from here. It stays on the base rating, so
  // choosing a good country still cannot move you up a rung.
  const a=attrsFor(p);
  const extra=(p._ageEdge||0);   // пинг скрыт (23.11)
  return rarityForRating(Math.round(a.ovr+extra));
}

// Mythic opens at 95, not 100. Rating a card on a whole season instead of one
// night means nobody reaches a clean 100 any more — a single ordinary stage is
// enough to stop it — so the gold tier had emptied out completely. 95 is the
// level a player only reaches by holding form across the Grand Final, the heats
// and the cups together, which is what the tier was supposed to mean.
function rarityForRating(rating){
  if(rating>=95) return 'mythic';
  if(rating>=90) return 'legendary';
  if(rating>=80) return 'epic';
  if(rating>=70) return 'rare';
  if(rating>=60) return 'uncommon';
  return 'common';
}

const NATIONALITY={
  vic0:'Австрия', Malibuca:'Россия', Peterbot:'США', Pollo:'Мексика',
  Sky:'Дания', Scroll:'Дания', Acorn:'Канада', Boltz:'США',
  Curve:'США', Veno:'Великобритания', Kingaling:'США', Kraez:'США',
  Shadow:'США', Vergo:'США', VicterV:'США', Khanada:'США',
  t3eny:'Словения', shxrk:'Румыния', Pixie:'Швеция', SwizzY:'Россия',
  Darm:'Польша', Demus:'Польша', Syaaz:'Испания', Scaryy:'Испания',
  FoCuS:'Израиль', Th0masHD:'Дания', PabloWingu:'Дания', Tjino:'Дания',
  Chap:'Швейцария', Flickzy:'Германия', Cr1nge:'Шотландия', Twi:'Великобритания',
  Japko:'Польша', panzer:'Россия', Belusi:'Италия', Zangi:'Италия',
  Juu:'Германия', Kami:'Польша', charyy:'Польша',
  Cooper:'США', Reet:'США', Cold:'США', Rapid:'Канада',
  Ajerss:'США', Ritual:'США', Scarebear:'США', oSydd:'Канада',
  liamtfup:'Канада', Avivv:'Канада'
};

// RANKED: real Grand Finals standing (rank = position in the real final standings, field = real tournament size)
const RANKED=[
  // European Major 1 Grand Finals, taken from the Fortnite Tracker standings
  // page. The regional finals for every other region were already here;
  // Europe's were the gap, which left EU players with no 2026 finals card.
  {duo:'Sky & Scroll', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:1, field:50, note:'Чемпионы регионального EU Major 1 Grand Finals, 738 pts'},
  {duo:'Tjino & PabloWingu', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:2, field:50},
  {duo:'vic0 & Malibuca', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:3, field:50},
  {duo:'Focus & Th0masHD', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:4, field:50},
  {duo:'Shxrk & t3eny', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:5, field:50},
  {duo:'Shur4 & Repairs', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:6, field:50},
  {duo:'Darm & demus', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:7, field:50},
  {duo:'Cr1nge & Twi', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:8, field:50},
  {duo:'Syaaz & Scaryy', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:9, field:50},
  {duo:'Japko & panzer', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:10, field:50},
  {duo:'Nebs & Nxthan', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:11, field:50},
  {duo:'Cringe & Volko', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:12, field:50},
  {duo:'IDrop & MariusCOW', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:13, field:50},
  {duo:'charyy & Kami', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:14, field:50},
  {duo:'Cheetiin & JannisZ', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:15, field:50},
  {duo:'SwizzY & Pixie', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:16, field:50},
  {duo:'Chap & Flickzy', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:17, field:50},
  {duo:'Noahreyli & rezon ay', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:18, field:50},
  {duo:'dandepuzo & Werex', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:19, field:50},
  {duo:'Minori & Darkos', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:20, field:50},
  {duo:'SkyJump & Momsy', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:21, field:50},
  {duo:'Nero & Joshbot', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:22, field:50},
  {duo:'Glubschi & prax', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:23, field:50},
  {duo:'AzatGo & iFr0zi', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:24, field:50},
  {duo:'dinus & FRANEK', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:25, field:50},
  {duo:'Howly & 1Lusha', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:26, field:50},
  {duo:'Shaykoz & Tylio', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:27, field:50},
  {duo:'Belusi & Zangi', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:28, field:50},
  {duo:'Kyto & Hijoe', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:29, field:50},
  {duo:'Huty & F1shyX', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:30, field:50},
  {duo:'k0tyarich & Kyry', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:31, field:50},
  {duo:'Pixovsky & SereN', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:32, field:50},
  {duo:'lunex 23 & Wolvax', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:33, field:50},
  {duo:'Trooly & Ghonzo', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:34, field:50},
  {duo:'JarKo & Kiire', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:35, field:50},
  {duo:'Moneymaker & Fnajen', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:36, field:50},
  {duo:'Gold & Peshka', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:37, field:50},
  {duo:'Birk & Zayni', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:38, field:50},
  {duo:'Akiira & Kurama', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:39, field:50},
  {duo:'KANTRI & Juu', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:40, field:50},
  {duo:'Ziffy 73 & Jurdy', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:41, field:50},
  {duo:'CTRL ghxstyah & glubfnbr', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:42, field:50},
  {duo:'f3kserǃ & Xteryy 86', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:43, field:50},
  {duo:'in the pооl & Xaizz Durden 1st', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:44, field:50},
  {duo:'Kaan & Faded', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:45, field:50},
  {duo:'slyzzbotǃ & Schmalibuca', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:46, field:50},
  {duo:'R3xxx & Alvin', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:47, field:50},
  {duo:'xzeevit & Crisbuca', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:48, field:50},
  {duo:'Twek & mydro', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:49, field:50},
  {duo:'Brindﱞa & icknadaǃ 13', region:'EU', event:'FNCS 2026 Major 1 — Grand Finals (Europe)', date:'26 апр 2026', rank:50, field:50},
  {duo:'vic0 & Malibuca', region:'EU', event:'FNCS 2026 Major 1 Summit — Grand Finals', date:'31 мая 2026', rank:1, field:50, note:'Чемпионы Major 1 Summit, $250,000 приза'},
  {duo:'Pollo & Peterbot', region:'NAC', event:'FNCS 2026 Major 1 Summit — Grand Finals', date:'31 мая 2026', rank:2, field:50, note:'Реальные многолетние тиммейты — вместе выиграли FNCS Global Championship 2024'},
  {duo:'t3eny & shxrk', region:'EU', event:'FNCS 2026 Major 1 Summit — Grand Finals', date:'31 мая 2026', rank:3, field:50},
  {duo:'Sky & Scroll', region:'EU', event:'FNCS 2026 Major 1 Summit — Grand Finals', date:'31 мая 2026', rank:4, field:50, note:'Чемпионы регионального EU Major 1 Grand Finals; дуо ещё с 2024 года'},
  {duo:'Acorn & Boltz', region:'NAC', event:'FNCS 2026 Major 1 Summit — Grand Finals', date:'31 мая 2026', rank:5, field:50},
  {duo:'Curve & Veno', region:'NAC', event:'FNCS 2026 Major 1 — NA Central Grand Finals', date:'26 апр 2026', rank:1, field:50, note:'Чемпионы региональных Grand Finals NA Central, 727 pts'},
  {duo:'Kingaling & Kraez', region:'NAC', event:'FNCS 2026 Major 1 Summit — Grand Finals', date:'31 мая 2026', rank:6, field:50},
  {duo:'Cooper & Reet', region:'NAC', event:'FNCS 2026 Major 1 Summit — Grand Finals', date:'31 мая 2026', rank:7, field:50},
  {duo:'Shadow & Vergo', region:'NAC', event:'FNCS 2026 Major 1 Summit — Grand Finals', date:'31 мая 2026', rank:8, field:50},
  {duo:'Pixie & SwizzY', region:'EU', event:'FNCS 2026 Major 1 Summit — Grand Finals', date:'31 мая 2026', rank:9, field:50},
  {duo:'Darm & Demus', region:'EU', event:'FNCS 2026 Major 1 Summit — Grand Finals', date:'31 мая 2026', rank:10, field:50},
  {duo:'Syaaz & Scaryy', region:'EU', event:'FNCS 2026 Major 1 Summit — Grand Finals', date:'31 мая 2026', rank:11, field:50},
  {duo:'FoCuS & Th0masHD', region:'EU', event:'FNCS 2026 Major 1 Summit — Grand Finals', date:'31 мая 2026', rank:12, field:50},
  {duo:'Golden & Ozone', region:'NAC', event:'FNCS 2026 Major 1 Summit — Grand Finals', date:'31 мая 2026', rank:13, field:50},
  {duo:'PabloWingu & Tjino', region:'EU', event:'FNCS 2026 Major 1 Summit — Grand Finals', date:'31 мая 2026', rank:14, field:50},
  {duo:'Chap & Flickzy', region:'EU', event:'FNCS 2026 Major 1 Summit — Grand Finals', date:'31 мая 2026', rank:15, field:50},
  {duo:'Kami & charyy', region:'EU', event:'FNCS 2026 Major 1 Summit — Grand Finals', date:'31 мая 2026', rank:16, field:50},
  {duo:'Ajerss & Ritual', region:'NAC', event:'FNCS 2026 Major 1 Summit — Grand Finals', date:'31 мая 2026', rank:17, field:50},
  {duo:'Cold & Rapid', region:'NAC', event:'FNCS 2026 Major 1 Summit — Grand Finals', date:'31 мая 2026', rank:18, field:50},
  {duo:'Cr1nge & Twi', region:'EU', event:'FNCS 2026 Major 1 Summit — Grand Finals', date:'31 мая 2026', rank:19, field:50},
  {duo:'Japko & panzer', region:'EU', event:'FNCS 2026 Major 1 Summit — Grand Finals', date:'31 мая 2026', rank:20, field:50},
  {duo:'Akiira & Kurama', region:'EU', event:'FNCS 2026 Major 1 Summit — Grand Finals', date:'31 мая 2026', rank:21, field:50},
  {duo:'EpikWhale & PXMP', region:'NAW', event:'FNCS 2026 Major 1 Summit — Grand Finals', date:'31 мая 2026', rank:22, field:50},
  {duo:'Momsy & SkyJump', region:'EU', event:'FNCS 2026 Major 1 Summit — Grand Finals', date:'31 мая 2026', rank:23, field:50},
  {duo:'VicterV & Khanada', region:'NAW', event:'FNCS 2026 Major 1 Summit — Upper Bracket', date:'29 мая 2026', rank:22, field:74, note:'Чемпионы регионального NA West Grand Finals (2 VR, +160 очков над 2-м местом)'}
];

// QUALIFIER: confirmed real name + region, competed at Summit Group Stage / Lower Bracket, no individual rank published
const QUALIFIERS=[
  {duo:'josh & Eomzo', region:'NAC'}, {duo:'liamtfup & Jayse1x', region:'NAC'},
  {duo:'Scarebear & oSydd', region:'NAC'}, {duo:'Avivv & Cam', region:'NAC'},
  {duo:'pixx & ghost', region:'EU'}, {duo:'MrSavage & Velofps', region:'EU'},
  {duo:'Belusi & Zangi', region:'EU'}, {duo:'PodaSai & Seyyto', region:'EU'},
  {duo:'Izzi & Nociff', region:'EU'}, {duo:'Vadeal & Juu', region:'EU'},
  {duo:'916Gon & Night', region:'BR'}, {duo:'TheFeloz & Jxness', region:'BR'},
  {duo:'Nutifps & Gabzera', region:'BR'}, {duo:'Lewa & Romero', region:'BR'}, {duo:'Randu & Grx', region:'BR'},
  {duo:'yuma & Koyota', region:'ASIA'}, {duo:'LBworks & Bot', region:'ASIA'}, {duo:'Minipiyo & FuuKun', region:'ASIA'},
  {duo:'FKS & Hero', region:'ME'}, {duo:'7man & Controller', region:'ME'}, {duo:'Yo7med & Rxtr', region:'ME'},
  {duo:'alex & Wreckless', region:'OCE'}, {duo:'Vazen & Bulldogz', region:'OCE'}, {duo:'Resignz & Tinka', region:'OCE'}
];

// FNCS 2025 Global Championship — the actual season Grand Finals (Lyon, 6-7 Sep 2025, 33 trios / 99 players).
// Top 18 have exact confirmed placement from the prize table; the rest are confirmed real participants
// (full team list published) without an individually confirmed exact rank, so they're added as unranked.
// FNCS 2023 Global Championship — Grand Finals (Copenhagen, 13-15 Oct 2023, 50 duos in the finals)
// FNCS 2025 Major 3 — Grand Finals, full top-10 for all 7 regions (33 trios each, Aug 2-3 2025)
// FNCS Chapter 2 Season 5 — Grand Finals: Europe (Trios, 33 teams, 14 Mar 2021)
const CH2S5_EU_RANKED=[
  {trio:'Hen & JannisZ & Chapix', rank:1},
  {trio:'Flikk & Anas & Th0masHD', rank:2},
  {trio:'Vadeal & Noahreyli & rezon ay', rank:3},
  {trio:'Andilex & Snayzy & xsweeze', rank:4},
  {trio:'Umplify & Matsoe & benjyfishy', rank:5},
  {trio:'Setty & Kami & teeq', rank:6},
  {trio:'Snap & Miro & Swag', rank:7},
  {trio:'IDrop & TaySon & MrSavage', rank:8},
  {trio:'Mexe & Michael & Verox', rank:9},
  {trio:'Kikoo & Slender & MOSh', rank:10},
  {trio:'AirkNn & DKS & Blacky', rank:11},
  {trio:'JoeFN & Jur3ky & SHAD0W', rank:12},
  {trio:'Queasy & packo & Rakso', rank:13},
  {trio:'nebs & M1lo & Ceesay', rank:14},
  {trio:'Pinq & TruleX & stompy', rank:15},
  {trio:'Diablo & Flecken & Bayon', rank:16},
  {trio:'Mr.J & ks1light & Mawakha', rank:17},
  {trio:'Artox & Pizza4k & ardit', rank:18},
  {trio:'Malibuca & shizogod & Mayhem', rank:19},
  {trio:'Paddy & Knifer & Veno', rank:20},
  {trio:'Refsgaard & Endretta & Skram', rank:21},
  {trio:'NicoAyy & Meldgaard & Fredoxie', rank:22},
  {trio:'Joolex & Cherentos & Merstach', rank:23},
  {trio:'ZQ & crr & leo the crack', rank:24},
  {trio:'advise & Kubx & artor', rank:25},
  {trio:'Downs2k & ETq & PabloWingu', rank:26},
  {trio:'Wishi & Traitor & Raqz', rank:27},
  {trio:'Legxndz & karma & Awaer', rank:28},
  {trio:'Boyer & Hellfire & Klusia', rank:29},
  {trio:'k1nzell & Decyptos & wakie', rank:30},
  {trio:'egrm & voxe & Kebo', rank:31},
  {trio:'Jannes & tillv1 & Gripey', rank:32},
  {trio:'Younes & Robnic & Lame', rank:33}
];
const CH2S5_EU_FIELD=33;
const CH2S5_EU_EVENT='FNCS Chapter 2 Season 5 — Grand Finals (Europe)';
const CH2S5_EU_DATE='14 мар 2021';

// FNCS Chapter 2 Season 6 — Grand Finals: Europe (Trios, 32 teams, 29-30 May 2021)
const CH2S6_EU_RANKED=[
  {trio:'Queasy & TruleX & Jur3ky', rank:1},
  {trio:'Refsgaard & Endretta & MrSavage', rank:2},
  {trio:'4zr & TaySon & nayte', rank:3},
  {trio:'Flikk & Anas & Th0masHD', rank:4},
  {trio:'Vadeal & Noahreyli & rezon ay', rank:5},
  {trio:'Kiryache32 & Stormyrite & Toose', rank:6},
  {trio:'Andilex & Snayzy & xsweeze', rank:7},
  {trio:'Hen & JannisZ & Chapix', rank:8},
  {trio:'k1nzell & IDrop & wakie', rank:9},
  {trio:'zeykoo & Sunddely & Jules', rank:10},
  {trio:'nebs & bubak & WaiZ', rank:11},
  {trio:'Floki & Clement & Decyptos', rank:12},
  {trio:'RedRush & xsterioz & Mappi', rank:13},
  {trio:'JoeFN & stompy & SHAD0W', rank:14},
  {trio:'Safik & Siberiajkee & iRezUmi', rank:15},
  {trio:'Shaykoz & DKS & Grayinjo', rank:16},
  {trio:'Hottie & elokratz & trippernn', rank:17},
  {trio:'Johku & Anddone & Jetsku', rank:18},
  {trio:'FlowiS & kejseR & Hellfire', rank:19},
  {trio:'Fastroki & Pizza4k & ardit', rank:20},
  {trio:'Bloomy & Perceval & TomzyV1', rank:21},
  {trio:'Lnuef & SliX & Merijn', rank:22},
  {trio:'Meta & skyzouw & XpeR', rank:23},
  {trio:'Kikoo & Skram & Putrick', rank:24},
  {trio:'Kirzzii & Raifla & Saevid', rank:25},
  {trio:'Nexxs & scriwy & Fusion', rank:26},
  {trio:'Slender & Voidd & Wolfiez', rank:27},
  {trio:'Jamside & Fury Legendary & Domentos', rank:28},
  {trio:'BlastR & Nikof & Alpha', rank:29},
  {trio:'Marvin & EsTy & BadSniper', rank:30},
  {trio:'Wanlast & PodaSai & EMXXRR', rank:31},
  {trio:'hycr1s & Vortex & Nightsck', rank:32}
];
const CH2S6_EU_FIELD=32;
const CH2S6_EU_EVENT='FNCS Chapter 2 Season 6 — Grand Finals (Europe)';
const CH2S6_EU_DATE='29–30 мая 2021';

// FNCS Chapter 2 Season 8 — Grand Finals: Europe (Trios, 33 teams, 31 Oct 2021)
const CH2S8_EU_RANKED=[
  {trio:'Setty & Kami & Teeq', rank:1},
  {trio:'FlowiS & Hellfire & Skram', rank:2},
  {trio:'Fastroki & Crr & aqua', rank:3},
  {trio:'Floki & Clement & Decyptos', rank:4},
  {trio:'Kiryache32 & Stormyrite & Toose', rank:5},
  {trio:'Michael & AstroSMZ & Verox', rank:6},
  {trio:'Merstach & Malibuca & Shizogod', rank:7},
  {trio:'Queasy & Anas & Th0masHD', rank:8},
  {trio:'Raifla & K1nzell & Jur3ky', rank:9},
  {trio:'Dyox & Crow VII & Joseeh', rank:10},
  {trio:'Seanvp & Xenolith & Remix', rank:11},
  {trio:'Andilex & 4zr & Xsweeze', rank:12},
  {trio:'Hottie & elokratz & trippernn', rank:13},
  {trio:'Pinq & Nebs & Stompy', rank:14},
  {trio:'advise & Voxe & Edison', rank:15},
  {trio:'TaySon & chapix & rezon ay', rank:16},
  {trio:'vadeal & JannisZ & Noahreyli', rank:17},
  {trio:'zeykoo & EsTy & Slovay', rank:18},
  {trio:'Korol1k & Sp1aash & Mawakha', rank:19},
  {trio:'Vetle & ETq & Surprise', rank:20},
  {trio:'Egrm & Nikof & Naekoz', rank:21},
  {trio:'Karma & Kylie & Awaer', rank:22},
  {trio:'Endretta & Benjyfishy & MrSavage', rank:23},
  {trio:'Folnet & WingS & Karmy', rank:24},
  {trio:'Aryan & Milan & Mitr0', rank:25},
  {trio:'Braw & Didzzz & Jokzz', rank:26},
  {trio:'Snayzy & Skite & Nayte', rank:27},
  {trio:'Krizzii & Pollyy & Wiqciz', rank:28},
  {trio:'G0lDx2 & p1ng & Vanyak3kk', rank:29},
  {trio:'Robban & Axeforce & Fnajen', rank:30},
  {trio:'KaanDE & Klinberi & Cryed', rank:31},
  {trio:'Essitam & Sabajo & Tidi', rank:32},
  {trio:'Hynei & Bridou & Mygoute', rank:33}
];
const CH2S8_EU_FIELD=33;
const CH2S8_EU_EVENT='FNCS Chapter 2 Season 8 — Grand Finals (Europe)';
const CH2S8_EU_DATE='31 окт 2021';

// FNCS 2021 Grand Royale — Europe (Trios, 33 teams, 21 Nov 2021)
const GRANDROYALE2021_EU_RANKED=[
  {trio:'Hen & TaySon & Chapix', rank:1},
  {trio:'Setty & Kami & Teeq', rank:2},
  {trio:'Queasy & Anas & Th0masHD', rank:3},
  {trio:'Vadeal & JannisZ & Noahreyli', rank:4},
  {trio:'Safik & 1lushaFN & Putrick', rank:5},
  {trio:'L1nk & Fury Legendary & 97default', rank:6},
  {trio:'Dyox & Crow VII & Joseeh', rank:7},
  {trio:'Kefyy & pkr29 & Mlody', rank:8},
  {trio:'FlowiS & Hellfire & Skram', rank:9},
  {trio:'Scriwy & Shady & Stompy', rank:10},
  {trio:'FORK & jimke & Chico', rank:11},
  {trio:'PabloWingu & Bloomy & Swag', rank:12},
  {trio:'Hottie & ETq & elokratz', rank:13},
  {trio:'Fastroki & aqua & rezon ay', rank:14},
  {trio:'Endretta & Benjyfishy & MrSavage', rank:15},
  {trio:'Karma & JoeFN & Kylie', rank:16},
  {trio:'Floki & Clement & Decyptos', rank:17},
  {trio:'Fornax & Aurero & P0ul', rank:18},
  {trio:'xsweeze & Andilex & 4zr', rank:19},
  {trio:'DKS & Grayinjo & Mirza', rank:20},
  {trio:'Flyy & Ghosty4k & WaiZ', rank:21},
  {trio:'Skite & Bubak & OvLDER', rank:22},
  {trio:'Umplify & Saevid & Matsoe', rank:23},
  {trio:'TuNa & Mikson & Sneake', rank:24},
  {trio:'Pinq & Nebs & TruleX', rank:25},
  {trio:'Kirb1 & Banw1se19 & ks1light', rank:26},
  {trio:'Merstach & Malibuca & shizogod', rank:27},
  {trio:'Skydeun & bitflox & Cookie', rank:28},
  {trio:'Kiryache32 & Stormyrite & Toose', rank:29},
  {trio:'Aury & FiR3hUNTER & Art1st', rank:30},
  {trio:'Michael & AstroSMZ & Verox', rank:31},
  {trio:'Smapfy & Voun & Blacha', rank:32},
  {trio:'Laxus & BadSniper & Force', rank:33}
];
const GRANDROYALE2021_EU_FIELD=33;
const GRANDROYALE2021_EU_EVENT='FNCS 2021 Grand Royale (Europe)';
const GRANDROYALE2021_EU_DATE='21 ноя 2021';

// FNCS All-Star Showdown 2021 — Solo Grand Finals: Europe (Solo, top 60 of 100, 26 Jun 2021)
const ALLSTAR2021_SOLO_EU=[
  {handle:'TaySon',rank:1},{handle:'veno',rank:2},{handle:'AirkNn',rank:3},{handle:'nebs',rank:4},
  {handle:'K1nzell',rank:5},{handle:'rezon ay',rank:6},{handle:'trippernn',rank:7},{handle:'Fastroki',rank:8},
  {handle:'Th0masHD',rank:9},{handle:'Michael',rank:10},{handle:'Slender',rank:11},{handle:'Bubak',rank:12},
  {handle:'Setty',rank:13},{handle:'Shizogod',rank:14},{handle:'Snayzy',rank:15},{handle:'Jetsku',rank:16},
  {handle:'Andilex',rank:17},{handle:'Blacky',rank:18},{handle:'Floki',rank:19},{handle:'BadSniper',rank:20},
  {handle:'Vadeal',rank:21},{handle:'Stormyrite',rank:22},{handle:'Matsoe',rank:23},{handle:'Knifer',rank:24},
  {handle:'teeq',rank:25},{handle:'Anddone',rank:26},{handle:'Hen',rank:27},{handle:'ks1light',rank:28},
  {handle:'Queasy',rank:29},{handle:'Refsgaard',rank:30},{handle:'Grayinjo',rank:31},{handle:'Decyptos',rank:32},
  {handle:'Safik',rank:33},{handle:'Shaykoz',rank:34},{handle:'Endretta',rank:35},{handle:'wakie',rank:36},
  {handle:'iRezUmi',rank:37},{handle:'JannisZ',rank:38},{handle:'Toose',rank:39},{handle:'Chapix',rank:40},
  {handle:'Kami',rank:41},{handle:'Kikoo',rank:42},{handle:'TruleX',rank:43},{handle:'packo',rank:44},
  {handle:'WaiZ',rank:45},{handle:'Malibuca',rank:46},{handle:'IDrop',rank:47},{handle:'Sunddely',rank:48},
  {handle:'hycr1s',rank:49},{handle:'Mr.J',rank:50},{handle:'JoeFN',rank:51},{handle:'Mappi',rank:52},
  {handle:'kejseR',rank:53},{handle:'Ceesay',rank:54},{handle:'Miro',rank:55},{handle:'Snap',rank:56},
  {handle:'Anas',rank:57},{handle:'elokratz',rank:58},{handle:'Swag',rank:59},{handle:'Peach',rank:60}
];
const ALLSTAR2021_SOLO_EU_FIELD=100;
const ALLSTAR2021_SOLO_EU_EVENT='FNCS All-Star Showdown 2021 — Solo Grand Finals (Europe)';
const ALLSTAR2021_SOLO_EU_DATE='26 июн 2021';

// FNCS 2023 — Major 1: Europe - Grand Finals (Duos, 50 teams, 5 Mar 2023)
const M1_2023_EU_RANKED=[
  {duo:'Merstach & TaySon', rank:1},{duo:'Malibuca & Th0masHD', rank:2},{duo:'JannisZ & rezon ay', rank:3},
  {duo:'Queasy & Veno', rank:4},{duo:'Pixie & Dela', rank:5},{duo:'G13ras & charyy', rank:6},
  {duo:'Pinq & nebs', rank:7},{duo:'DABUEL & vexi', rank:8},{duo:'SwizzY & Shamokiy', rank:9},
  {duo:'Ijtwo & Glubschi', rank:10},{duo:'trippernn & Skram', rank:11},{duo:'MariusCOW & Fredoxie', rank:12},
  {duo:'Merijn & Packo', rank:13},{duo:'Vanyak3kk & Karmy', rank:14},{duo:'P1ng & Kyry', rank:15},
  {duo:'Rifty & Flodax', rank:16},{duo:'Blacha & Mikson', rank:17},{duo:'Refsgaard & Hellfire', rank:18},
  {duo:'Vic0try0na & Kylie', rank:19},{duo:'Andilex & Snayzy', rank:20},{duo:'Asa & Trexer', rank:21},
  {duo:'Zara & Zangi', rank:22},{duo:'Setty & Kami', rank:23},{duo:'Coope & KaydFN', rank:24},
  {duo:'Kombek & Purchawa', rank:25},{duo:'Floki & BadSniper', rank:26},{duo:'Fastroki & Hijoe', rank:27},
  {duo:'Grolzz & fiR3hUNTER', rank:28},{duo:'dyox & Mappi', rank:29},{duo:'Kefyy & artor', rank:30},
  {duo:'Vortex & Belusi', rank:31},{duo:'IDrop & MrSavage', rank:32},{duo:'TChypSs & Artskill', rank:33},
  {duo:'PabloWingu & bevvys', rank:34},{duo:'Axeforce & Vortexers', rank:35},{duo:'Brandtman & Moneymaker', rank:36},
  {duo:'KIANDR0 & wafflar', rank:37},{duo:'PodaSai & Xsweeze', rank:38},{duo:'Clement & Decyptos', rank:39},
  {duo:'Gudn & Forzen', rank:40},{duo:'JarKo & Clone', rank:41},{duo:'Liwshe & Stenno', rank:42},
  {duo:'Cheatiin & Flickzy', rank:43},{duo:'Fury Legendary & Leyyner', rank:44},{duo:'Zqcca & Arc', rank:45},
  {duo:'Czb & Nipsy', rank:46},{duo:'Cr4zy & Paceve', rank:47},{duo:'Klown & Fray', rank:48},
  {duo:'Nakoo & DaaN', rank:49},{duo:'Boaz & Jaggy', rank:50}
];
const M1_2023_EU_FIELD=50;
const M1_2023_EU_EVENT='FNCS 2023 Major 1 — Grand Finals (Europe)';
const M1_2023_EU_DATE='5 мар 2023';

// FNCS 2023 — Major 2: Europe - Grand Finals (Duos, 50 teams, 14 May 2023)
const M2_2023_EU_RANKED=[
  {duo:'Queasy & Veno', rank:1},{duo:'Merstach & TaySon', rank:2},{duo:'Malibuca & Th0masHD', rank:3},
  {duo:'Vanyak3kk & Karmy', rank:4},{duo:'Setty & Kami', rank:5},{duo:'Gripey & Flickzy', rank:6},
  {duo:'IDrop & Mappi', rank:7},{duo:'Vadeal & MrSavage', rank:8},{duo:'Blacha & Mikson', rank:9},
  {duo:'TruleX & Chico', rank:10},{duo:'Vacan & Skvii', rank:11},{duo:'Stenno & Liwshe', rank:12},
  {duo:'Asa & Slovay', rank:13},{duo:'JannisZ & rezon ay', rank:14},{duo:'Andilex & dyox', rank:15},
  {duo:'P1ng & Kyry', rank:16},{duo:'PabloWingu & bevvys', rank:17},{duo:'Skydeun & Shaykoz', rank:18},
  {duo:'Zara & Zangi', rank:19},{duo:'Boaz & Jurdy', rank:20},{duo:'Pixie & Dela', rank:21},
  {duo:'Jur3ky & Fredoxie', rank:22},{duo:'S1ned & iRezUmi', rank:23},{duo:'Kiro & Flodax', rank:24},
  {duo:'Kirb1 & 97default', rank:25},{duo:'SwizzY & Shamokiy', rank:26},{duo:'Vortex & Japko', rank:27},
  {duo:'Cosmo & Jae', rank:28},{duo:'L1nk & pkr29', rank:29},{duo:'Toose & Putrick', rank:30},
  {duo:'Snayzy & PodaSai', rank:31},{duo:'G0lDx2 & Anchor', rank:32},{duo:'G13ras & Charyy', rank:33},
  {duo:'Cheatiin & Glubschi', rank:34},{duo:'Floki & Clement', rank:35},{duo:'DreySon & Darky', rank:36},
  {duo:'Misha & t3eny', rank:37},{duo:'Kombek & Artor', rank:38},{duo:'Wheat & Qroll', rank:39},
  {duo:'Refsgaard & Hellfire', rank:40},{duo:'Arc & Ricky', rank:41},{duo:'Eltensy & Howly', rank:42},
  {duo:'Jalen & Twi', rank:43},{duo:'Fastroki & Hijoe', rank:44},{duo:'Kyzen & Voxe', rank:45},
  {duo:'Gabix & Shmeky', rank:46},{duo:'Filipmonk & Paluch', rank:47},{duo:'Kefyy & Purchawa', rank:48},
  {duo:'Art1st & FiR3hUNTER', rank:49},{duo:'MikL & M0ne', rank:50}
];
const M2_2023_EU_FIELD=50;
const M2_2023_EU_EVENT='FNCS 2023 Major 2 — Grand Finals (Europe)';
const M2_2023_EU_DATE='14 мая 2023';

// FNCS 2023 — Major 3: Europe - Grand Finals (Duos, 50 teams, 10 Jun 2023)
const M3_2023_EU_RANKED=[
  {duo:'Putrick & SwizzY', rank:1},{duo:'Chico & TruleX', rank:2},{duo:'Misha & t3eny', rank:3},
  {duo:'Kami & Setty', rank:4},{duo:'Blacha & Mikson', rank:5},{duo:'Axeforce & Robban', rank:6},
  {duo:'PodaSai & Snayzy', rank:7},{duo:'Pinq & vic0', rank:8},{duo:'Grolzz & Klown', rank:9},
  {duo:'Fastroki & Kylie', rank:10},{duo:'Malibuca & Th0masHD', rank:11},{duo:'Kyry & P1ng', rank:12},
  {duo:'charyy & G13ras', rank:13},{duo:'Huty & TropeX', rank:14},{duo:'Merstach & TaySon', rank:15},
  {duo:'Asa & Slovay', rank:16},{duo:'Shaykoz & Skydeun', rank:17},{duo:'bevvys & PabloWingu', rank:18},
  {duo:'DKS & Voxe', rank:19},{duo:'Hellfire & Nebs', rank:20},{duo:'Skvii & Vacan', rank:21},
  {duo:'Refsgaard & trippernn', rank:22},{duo:'Japko & Packo', rank:23},{duo:'Anchor & G0lDx2', rank:24},
  {duo:'OvLDER & Vaske1x', rank:25},{duo:'Fnajen & Moneymaker', rank:26},{duo:'FiR3hUNTER & Kirb1', rank:27},
  {duo:'Anas & Srapt', rank:28},{duo:'Karmy & Vanyak3kk', rank:29},{duo:'Deckzee & Hedra', rank:30},
  {duo:'Liwshe & Stenno', rank:31},{duo:'Hijoe & Trexer', rank:32},{duo:'corni & Sqyve', rank:33},
  {duo:'Kiro & Merijn', rank:34},{duo:'Dyox & Kayd', rank:35},{duo:'FrostiPeshka & Kenty', rank:36},
  {duo:'Jakei & Nxthan', rank:37},{duo:'Kefyy & Mlody', rank:38},{duo:'Art1st & Volko', rank:39},
  {duo:'Flickzy & Gripey', rank:40},{duo:'Belusi & Vortex', rank:41},{duo:'Akiira & Skyjump', rank:42},
  {duo:'MrSavage & Vadeal', rank:43},{duo:'IDrop & Mappi', rank:44},{duo:'Chapix & Hen', rank:45},
  {duo:'iRezUmi & S1ned', rank:46},{duo:'Blurfire & Skrill', rank:47},{duo:'Archie & Nipsy', rank:48},
  {duo:'Gawid & Rxnxn', rank:49},{duo:'Clone & JarKo', rank:50}
];
const M3_2023_EU_FIELD=50;
const M3_2023_EU_EVENT='FNCS 2023 Major 3 — Grand Finals (Europe)';
const M3_2023_EU_DATE='12 авг 2023';   // Гранд-финал Major 3 — 12–13 августа (было «10 июн», сверка 7.10)

// FNCS 2024 — Major 1: Europe - Grand Finals (Duos, 50 teams, 25 Feb 2024)
const M1_2024_EU_RANKED=[
  {duo:'Merstach & Malibuca', rank:1},{duo:'Queasy & Th0masHD', rank:2},{duo:'Kiro & kiduoo', rank:3},
  {duo:'Sangild & MariusCOW', rank:4},{duo:'vic0 & Pinq', rank:5},{duo:'PabloWingu & bevvys', rank:6},
  {duo:'Vadeal & rezon ay', rank:7},{duo:'G13ras & charyy', rank:8},{duo:'LunexHD & M0ne', rank:9},
  {duo:'Andilex & Seyyto', rank:10},{duo:'Nebs & IDrop', rank:11},{duo:'dyox & KaydFN', rank:12},
  {duo:'Artskill & Astralsq', rank:13},{duo:'Deckzee & Eclipse', rank:14},{duo:'Veno & TaySon', rank:15},
  {duo:'JannisZ & Flickzy', rank:16},{duo:'Wheat & Shamokiy', rank:17},{duo:'P1ng & Mikson', rank:18},
  {duo:'Volko & Vortexers', rank:19},{duo:'Laizen & Loxxx', rank:20},{duo:'SwizzY & Putrick', rank:21},
  {duo:'Wox & Pixie', rank:22},{duo:'Noahreyli & Aqua', rank:23},{duo:'L0WK3Y & Aryan', rank:24},
  {duo:'S1neD & Vanyak3kk', rank:25},{duo:'Cringe & Nomzz', rank:26},{duo:'Robban & Axeforce', rank:27},
  {duo:'Skydeun & Shaykoz', rank:28},{duo:'SloxZay & Saphir', rank:29},{duo:'Pixelpiotr & DABUEL', rank:30},
  {duo:'Darky & DarKiiZ', rank:31},{duo:'Hen & Vaske1x', rank:32},{duo:'Setty & Kami', rank:33},
  {duo:'Skyboy & Scroll', rank:34},{duo:'Hris & Skvii', rank:35},{duo:'Misha & t3eny', rank:36},
  {duo:'Czb & Nxthan', rank:37},{duo:'Purchawa & vexi', rank:38},{duo:'Mongraal & MrSavage', rank:39},
  {duo:'Fazer & K1nG', rank:40},{duo:'Belusi & Gabix', rank:41},{duo:'Predage & AyarBaffo', rank:42},
  {duo:'Dandir & SnozQQQ', rank:43},{duo:'Mathi & Robin', rank:44},{duo:'MikL & Cheqzie', rank:45},
  {duo:'Grolzz & Klown', rank:46},{duo:'Prism & Casperinovic', rank:47},{duo:'Layn & naytelfg', rank:48},
  {duo:'Tjino & Chapix', rank:49},{duo:'Ricbor & Arc', rank:50}
];
const M1_2024_EU_FIELD=50;
const M1_2024_EU_EVENT='FNCS 2024 Major 1 — Grand Finals (Europe)';
const M1_2024_EU_DATE='25 фев 2024';

// FNCS 2024 — Major 2: Europe - Grand Finals (Duos, 50 teams, 19 May 2024)
const M2_2024_EU_RANKED=[
  {duo:'SwizzY & Vanyak3kk', rank:1},{duo:'Chap & t3eny', rank:2},{duo:'Setty & Kami', rank:3},
  {duo:'Vadeal & rezon ay', rank:4},{duo:'Andilex & Seyyto', rank:5},{duo:'Merstach & Malibuca', rank:6},
  {duo:'Queasy & Th0masHD', rank:7},{duo:'TruleX & Chico', rank:8},{duo:'Fastroki & Robban', rank:9},
  {duo:'Wox & Pixie', rank:10},{duo:'Veno & TaySon', rank:11},{duo:'Cringe & Nomzz', rank:12},
  {duo:'Skyboy & Scroll', rank:13},{duo:'Klown & Axeforce', rank:14},{duo:'RELLVIS & DABUEL', rank:15},
  {duo:'Destru & Pirozz', rank:16},{duo:'Deckzee & Eclipse', rank:17},{duo:'Snayzy & PodaSai', rank:18},
  {duo:'FiR3hUNTER & ve1ryy', rank:19},{duo:'JannisZ & Flickzy', rank:20},{duo:'Mappi & Kiro', rank:21},
  {duo:'Srapt & Skrill', rank:22},{duo:'Purchawa & vexi', rank:23},{duo:'trippernn & Fredoxie', rank:24},
  {duo:'Kirwa & Hedra', rank:25},{duo:'Kombek & Blacha', rank:26},{duo:'Czb & Nxthan', rank:27},
  {duo:'Twi & Jakei', rank:28},{duo:'Howly & NeFrizi', rank:29},{duo:'Hlechis & Upl', rank:30},
  {duo:'G13ras & charyy', rank:31},{duo:'vic0 & Pinq', rank:32},{duo:'VoltiaX & CoolKid', rank:33},
  {duo:'Finn & Auvahalo', rank:34},{duo:'Hris & Skvii', rank:35},{duo:'Sangild & MariusCOW', rank:36},
  {duo:'Toose & Karmy', rank:37},{duo:'Volko & Vortexers', rank:38},{duo:'dandepuzo & Hizixx', rank:39},
  {duo:'Kielba & Gobaw', rank:40},{duo:'Turtle & Cheapz', rank:41},{duo:'Eltensy & panzer', rank:42},
  {duo:'Asa & Marco', rank:43},{duo:'2Trash & Zohan', rank:44},{duo:'fant & Sp1aash', rank:45},
  {duo:'Glubschi & Trexer', rank:46},{duo:'D00mguy & Ice', rank:47},{duo:'Gudn & Forzen', rank:48},
  {duo:'Cr1nge & Jakebuca', rank:49},{duo:'Gacus & Czesiack', rank:50}
];
const M2_2024_EU_FIELD=50;
const M2_2024_EU_EVENT='FNCS 2024 Major 2 — Grand Finals (Europe)';
const M2_2024_EU_DATE='19 мая 2024';

// FNCS 2024 — Major 3: Europe - Grand Finals (Duos, 50 teams, 28 Jul 2024)
const M3_2024_EU_RANKED=[
  {duo:'vic0 & Flickzy', rank:1},{duo:'Chap & t3eny', rank:2},{duo:'SwizzY & Vanyak3kk', rank:3},
  {duo:'Merstach & Malibuca', rank:4},{duo:'Vadeal & rezon ay', rank:5},{duo:'Czb & Nxthan', rank:6},
  {duo:'P1ng & Wox', rank:7},{duo:'JannisZ & Pixie', rank:8},{duo:'Skyboy & Scroll', rank:9},
  {duo:'Turtle & Cheapz', rank:10},{duo:'Prism & Casperinovic', rank:11},{duo:'TruleX & Chico', rank:12},
  {duo:'Huty & KovaaksXD', rank:13},{duo:'G13ras & charyy', rank:14},{duo:'Dela & Fnajen', rank:15},
  {duo:'Mappi & Kiro', rank:16},{duo:'QnDx & Phantom', rank:17},{duo:'PabloWingu & bevvys', rank:18},
  {duo:'Nebs & kiduoo', rank:19},{duo:'Tjino & Skvii', rank:20},{duo:'Akiira & YZY', rank:21},
  {duo:'FoCuS & Belusi', rank:22},{duo:'Asa & Juu', rank:23},{duo:'Gudn & Forzen', rank:24},
  {duo:'dandepuzo & Hizixx', rank:25},{duo:'Kyto & Hijoe', rank:26},{duo:'Deckzee & Eclipse', rank:27},
  {duo:'Klown & Axeforce', rank:28},{duo:'Kroma & Loxxx', rank:29},{duo:'VoltiaX & CoolKid', rank:30},
  {duo:'Artskill & Shaykoz', rank:31},{duo:'Eltensy & panzer', rank:32},{duo:'Snayzy & PodaSai', rank:33},
  {duo:'Cxshy & Maciak', rank:34},{duo:'Queasy & Th0masHD', rank:35},{duo:'Merijn & KaydFN', rank:36},
  {duo:'TChypSs & Decyptos', rank:37},{duo:'Predage & Rad3on', rank:38},{duo:'Polish & Wojtus', rank:39},
  {duo:'Destru & Pirozz', rank:40},{duo:'FiR3hUNTER & Art1st', rank:41},{duo:'Filipmonk & Firen', rank:42},
  {duo:'Maxi & Mystic', rank:43},{duo:'Kombek & Purchawa', rank:44},{duo:'kantri & KryFalse', rank:45},
  {duo:'LunexHD & M0ne', rank:46},{duo:'2Trash & Splashy', rank:47},{duo:'Setty & Kami', rank:48},
  {duo:'Guiik & Stormy2x', rank:49},{duo:'Lolo & Neu', rank:50}
];
const M3_2024_EU_FIELD=50;
const M3_2024_EU_EVENT='FNCS 2024 Major 3 — Grand Finals (Europe)';
const M3_2024_EU_DATE='28 июл 2024';

function processDuoRanked(list, field, event, date, region){
  list.forEach(r=>{
    const names=r.duo.split(' & ');
    TEAMMATE_GROUPS.push(names);
    const percentile=(field-r.rank)/(field-1)*100;
    names.forEach(h=>{
      pushCard({
        handle:h, nat:NATIONALITY[h]||null,
        region:region, event:event, date:date, placement:r.rank, note:r.note||'',
        tier:'ranked', rarity:rarityForRating(ratingForRank(r.rank,percentile,event)), rating:ratingForRank(r.rank,percentile,event)
      });
    });
  });
}

function processTrioRanked(list, field, event, date, region){
  list.forEach(r=>{
    const names=r.trio.split(' & ');
    TEAMMATE_GROUPS.push(names);
    const percentile=(field-r.rank)/(field-1)*100;
    names.forEach(h=>{
      pushCard({
        handle:h, nat:NATIONALITY[h]||null,
        region:region, event:event, date:date, placement:r.rank, note:r.note||'',
        tier:'ranked', rarity:rarityForRating(ratingForRank(r.rank,percentile,event)), rating:ratingForRank(r.rank,percentile,event)
      });
    });
  });
}

const CH2S7_EU_RANKED=[
  {trio:'kiryache32 & stormyrite & Toose', rank:1},
  {trio:'Hottie & elokratz & trippernn', rank:2},
  {trio:'Pinq & nebs & stompy', rank:3},
  {trio:'Setty & Kami & teeq', rank:4},
  {trio:'veno & TaySon & rezon ay', rank:5},
  {trio:'Floki & Clement & Decyptos', rank:6},
  {trio:'Hen & JannisZ & Chapix', rank:7},
  {trio:'Vadeal & Noahreyli & aqua', rank:8},
  {trio:'Andilex & 4zr & xsweeze', rank:9},
  {trio:'Safik & 97default & Putrick', rank:10},
  {trio:'Refsgaard & Endretta & MrSavage', rank:11},
  {trio:'Kylie & Awaer & bubak', rank:12},
  {trio:'Dokko & Flecken & xKumu', rank:13},
  {trio:'7tor & Siberiajkee & Force', rank:14},
  {trio:'Queasy & TruleX & Jur3ky', rank:15},
  {trio:'Umplify & Adn & Matsoe', rank:16},
  {trio:'korol1k & Sp1aash & Mawakha', rank:17},
  {trio:'RedRush & xsterioz & Mappi', rank:18},
  {trio:'seanvp & zAndy & Chashy', rank:19},
  {trio:'TenZeN & jaggy & Trixi', rank:20},
  {trio:'Raifla & Saevid & AstroSMZ', rank:21},
  {trio:'egrm & voxe & buzz', rank:22},
  {trio:'Ghosty4k & Diablo & Bayon', rank:23},
  {trio:'Folnet & WingS & karmy', rank:24},
  {trio:'JoeFN & benjyfishy & Shadowfn', rank:25},
  {trio:'Rotory & tosialpha & ovLDER', rank:26},
  {trio:'TChypSs & Artskill & XpeR', rank:27},
  {trio:'Merstach & Malibuca & Shizogod', rank:28},
  {trio:'Fastroki & karma & Voidd', rank:29},
  {trio:'keziix & ZQ & Falconly', rank:30},
  {trio:'bagfiz & Zeston & Hijoe', rank:31},
  {trio:'Aryan & Surprise & fsi', rank:32},
  {trio:'PSY & miknup & Zebre', rank:33}
];
const CH2S7_EU_FIELD=33;
const CH2S7_EU_EVENT='FNCS Chapter 2 Season 7 — Grand Finals (Europe)';
const CH2S7_EU_DATE='4–5 сен 2021';

// Chapter 2 Season 5 (Denmark/Germany/UK/France/Poland/Norway/Russia/etc.)
const NAT_2021_A={
  Anas:'Дания', Boyer:'Дания', Downs2k:'Дания', ETq:'Дания', Flecken:'Дания', Flikk:'Дания', Fredoxie:'Дания',
  Hellfire:'Дания', Klusia:'Дания', Meldgaard:'Дания', NicoAyy:'Дания', PabloWingu:'Дания', Refsgaard:'Дания',
  Skram:'Дания', Swag:'Дания', Th0masHD:'Дания',
  ardit:'Германия', Artox:'Германия', Awaer:'Германия', Gripey:'Германия', Jannes:'Германия', JannisZ:'Германия',
  karma:'Германия', Lame:'Германия', Pizza4k:'Германия', 'rezon ay':'Германия', Robnic:'Германия', tillv1:'Германия',
  Vadeal:'Германия', Younes:'Германия',
  benjyfishy:'Великобритания', Ceesay:'Великобритания', crr:'Великобритания', Diablo:'Великобритания', Hen:'Великобритания',
  JoeFN:'Великобритания', Knifer:'Великобритания', Mexe:'Великобритания', Michael:'Великобритания', nebs:'Великобритания',
  Pinq:'Великобритания', 'SHAD0W':'Великобритания', Veno:'Великобритания', Verox:'Великобритания',
  AirkNn:'Франция', Andilex:'Франция', Blacky:'Франция', Decyptos:'Франция', DKS:'Франция', egrm:'Франция',
  Kebo:'Франция', 'leo the crack':'Франция', Snayzy:'Франция', voxe:'Франция', xsweeze:'Франция', ZQ:'Франция',
  advise:'Польша', artor:'Польша', Kami:'Польша', Kubx:'Польша', packo:'Польша', Rakso:'Польша', Setty:'Польша', teeq:'Польша',
  Endretta:'Норвегия', IDrop:'Норвегия', MrSavage:'Норвегия', Raqz:'Норвегия', Traitor:'Норвегия', Wishi:'Норвегия',
  Cherentos:'Россия', Joolex:'Россия', Malibuca:'Россия', Mayhem:'Россия', shizogod:'Россия',
  Matsoe:'Нидерланды', Miro:'Нидерланды', Snap:'Нидерланды', Umplify:'Нидерланды',
  Bayon:'Швеция', chapix:'Швеция', M1lo:'Швеция', wakie:'Швеция',
  Kikoo:'Португалия', MOSh:'Португалия', Slender:'Португалия',
  Legxndz:'Австрия', stompy:'Австрия', Queasy:'Сербия', TruleX:'Сербия', k1nzell:'Словения', TaySon:'Словения',
  ks1light:'Украина', 'Mr.J':'Украина', Mawakha:'Беларусь', Jur3ky:'Хорватия', Paddy:'Ирландия',
  Merstach:'Латвия', Noahreyli:'Швейцария'
};
// Chapter 2 Season 6 (France-heavy, plus Denmark/Germany/Russia/UK/Finland/Norway/Sweden)
const NAT_2021_B={
  Alpha:'Франция', BadSniper:'Франция', BlastR:'Франция', Clement:'Франция', EMXXRR:'Франция', EsTy:'Франция',
  Floki:'Франция', Grayinjo:'Франция', Marvin:'Франция', Meta:'Франция', nayte:'Франция', Nikof:'Франция',
  Perceval:'Франция', PodaSai:'Франция', Shaykoz:'Франция', skyzouw:'Франция', Sunddely:'Франция', Wanlast:'Франция',
  XpeR:'Франция', zeykoo:'Франция',
  elokratz:'Дания', FlowiS:'Дания', Hottie:'Дания', kejseR:'Дания', trippernn:'Дания',
  Fastroki:'Германия', hycr1s:'Германия', Nightsck:'Германия', Vortex:'Германия',
  'Fury Legendary':'Россия', iRezUmi:'Россия', Jamside:'Россия', Kiryache32:'Россия', Putrick:'Россия',
  Safik:'Россия', Siberiajkee:'Россия', Toose:'Россия',
  Bloomy:'Великобритания', Fusion:'Великобритания', TomzyV1:'Великобритания', Voidd:'Великобритания', Wolfiez:'Великобритания',
  Anddone:'Финляндия', Jetsku:'Финляндия', Johku:'Финляндия', Raifla:'Финляндия', SliX:'Финляндия',
  Kirzzii:'Норвегия', scriwy:'Норвегия', Mappi:'Швеция', WaiZ:'Швеция', xsterioz:'Швеция',
  RedRush:'Литва', Lnuef:'Нидерланды', Merijn:'Нидерланды',
  '4zr':'Швейцария', Jules:'Бельгия', Domentos:'Латвия', Nexxs:'Польша', bubak:'Словакия', Stormyrite:'Украина'
};
// All-Star Showdown Solo 2021 (France/UK/Denmark/Germany/Russia/Sweden/Poland)
const NAT_2021_C={
  Peach:'Великобритания', PanixZ:'Германия', Seahorse:'Польша', VoltiaX:'Египет', BelliX:'Италия'
};
// Chapter 2 Season 8
const NAT_2021_D={
  Braw:'Франция', Bridou:'Франция', Didzzz:'Франция', Hynei:'Франция', Jokzz:'Франция', Mygoute:'Франция',
  Naekoz:'Франция', Skite:'Франция',
  Vetle:'Дания',
  Aryan:'Великобритания', AstroSMZ:'Великобритания', Crr:'Великобритания', Surprise:'Великобритания', Xenolith:'Великобритания',
  G0lDx2:'Россия', Korol1k:'Россия',
  KaanDE:'Германия',
  Cryed:'Нидерланды', Milan:'Нидерланды', Mitr0:'Нидерланды', Sabajo:'Нидерланды', Tidi:'Нидерланды',
  Krizzii:'Норвегия', Pollyy:'Норвегия', Wiqciz:'Норвегия',
  Edison:'Швеция', Fnajen:'Швеция', Robban:'Швеция',
  WingS:'Украина',
  Klinberi:'Финляндия', Remix:'Ирландия', 'Crow VII':'Испания', Joseeh:'Испания',
  Essitam:'Бельгия', Karmy:'Эстония', Kylie:'Турция'
};
// Grand Royale 2021
const NAT_2021_E={
  '1lushaFN':'Россия', Aury:'Россия', Banw1se19:'Россия', FiR3hUNTER:'Россия', Force:'Россия', L1nk:'Россия',
  Fornax:'Дания', P0ul:'Дания',
  Laxus:'Франция', Mirza:'Франция', Skydeun:'Франция',
  Blacha:'Польша', Kefyy:'Польша', Mikson:'Польша', Mlody:'Польша', pkr29:'Польша', Smapfy:'Польша',
  Sneake:'Польша', TuNa:'Польша', Voun:'Польша',
  Flyy:'Германия',
  bitflox:'Швеция', Cookie:'Швеция', Shady:'Швеция',
  FORK:'Сербия', Kirb1:'Украина',
  Ghosty4k:'Уэльс', jimke:'Хорватия', Aurero:'Израиль'
};
Object.assign(NATIONALITY, NAT_2021_A, NAT_2021_B, NAT_2021_C, NAT_2021_D, NAT_2021_E);
const FLAG_CODE_2021={'Египет':'eg','Израиль':'il'};
Object.assign(FLAG_CODE, FLAG_CODE_2021);

// FNCS 2024 Major 1 country representation
const NAT_2024_M1={
  Deckzee:'Дания', L0WK3Y:'Дания', LunexHD:'Дания', M0ne:'Дания', MariusCOW:'Дания', MikL:'Дания',
  PabloWingu:'Дания', Sangild:'Дания', Scroll:'Дания', Skyboy:'Дания', Th0masHD:'Дания', Tjino:'Дания',
  Aryan:'Великобритания', Cheqzie:'Великобритания', Czb:'Великобритания', Eclipse:'Великобритания',
  KaydFN:'Великобритания', Mongraal:'Великобритания', Nebs:'Великобритания', Nxthan:'Великобритания',
  Pinq:'Великобритания', Prism:'Великобритания', Veno:'Великобритания', Vortexers:'Великобритания',
  charyy:'Польша', DABUEL:'Польша', Dandir:'Польша', G13ras:'Польша', Kami:'Польша', Mikson:'Польша',
  Pixelpiotr:'Польша', Purchawa:'Польша', Setty:'Польша', SnozQQQ:'Польша', vexi:'Польша',
  Andilex:'Франция', Artskill:'Франция', Astralsq:'Франция', Laizen:'Франция', Layn:'Франция',
  Loxxx:'Франция', Saphir:'Франция', Seyyto:'Франция', Shaykoz:'Франция', Skydeun:'Франция',
  Flickzy:'Германия', JannisZ:'Германия', kiduoo:'Германия', Nomzz:'Германия', 'rezon ay':'Германия',
  Robin:'Германия', Vadeal:'Германия', Volko:'Германия',
  Arc:'Италия', AyarBaffo:'Италия', Belusi:'Италия', DarKiiZ:'Италия', Darky:'Италия', Gabix:'Италия',
  Predage:'Италия', Ricbor:'Италия',
  Axeforce:'Швеция', bevvys:'Швеция', Chapix:'Швеция', Klown:'Швеция', naytelfg:'Швеция',
  Pixie:'Швеция', Robban:'Швеция', Wox:'Швеция',
  Grolzz:'Россия', Malibuca:'Россия', Putrick:'Россия', Shamokiy:'Россия', SwizzY:'Россия', Wheat:'Россия',
  Aqua:'Австрия', Mathi:'Австрия', vic0:'Австрия',
  Queasy:'Сербия', Skvii:'Сербия', Vaske1x:'Сербия',
  P1ng:'Украина', S1neD:'Украина', Vanyak3kk:'Украина',
  Fazer:'Аргентина', K1nG:'Аргентина', Casperinovic:'Бельгия', SloxZay:'Бельгия',
  dyox:'Нидерланды', Kiro:'Нидерланды', IDrop:'Норвегия', MrSavage:'Норвегия',
  't3eny':'Словения', TaySon:'Словения', Cringe:'Швейцария', Noahreyli:'Швейцария',
  Merstach:'Латвия', Hen:'Литва', Misha:'Молдова', Hris:'Северная Македония'
};
// FNCS 2024 Major 2 country representation
const NAT_2024_M2={
  Blacha:'Польша', Czesiack:'Польша', fant:'Польша', Gacus:'Польша', Gobaw:'Польша', Kielba:'Польша',
  Kombek:'Польша', RELLVIS:'Польша',
  '2Trash':'Дания', Auvahalo:'Дания', Fredoxie:'Дания', Skrill:'Дания', Srapt:'Дания', trippernn:'Дания', Zohan:'Дания',
  Cheapz:'Германия', Fastroki:'Германия', Finn:'Германия', Glubschi:'Германия', Trexer:'Германия', Turtle:'Германия',
  dandepuzo:'Россия', FiR3hUNTER:'Россия', Hlechis:'Россия', Howly:'Россия', NeFrizi:'Россия', panzer:'Россия',
  Sp1aash:'Россия', Toose:'Россия',
  CoolKid:'Великобритания', Jakei:'Великобритания', Twi:'Великобритания',
  Destru:'Франция', Hedra:'Франция', Kirwa:'Франция', Pirozz:'Франция',
  Forzen:'Швеция', Gudn:'Швеция', Mappi:'Швеция',
  Eltensy:'Украина', Hizixx:'Украина', ve1ryy:'Украина',
  Asa:'Австрия', Karmy:'Эстония', Upl:'Эстония', D00mguy:'Греция', Ice:'Греция',
  Cr1nge:'Шотландия', Jakebuca:'Шотландия', Chap:'Швейцария',
  Chico:'Босния и Герцеговина', VoltiaX:'Египет', Marco:'Финляндия'
};
// FNCS 2024 Major 3 country representation
const NAT_2024_M3={
  Akiira:'Франция', Decyptos:'Франция', Kroma:'Франция', TChypSs:'Франция', YZY:'Франция',
  Hijoe:'Германия', Juu:'Германия', Kyto:'Германия', Maxi:'Германия', Mystic:'Германия',
  Cxshy:'Польша', Filipmonk:'Польша', Firen:'Польша', Maciak:'Польша', Polish:'Польша', Wojtus:'Польша',
  KovaaksXD:'Дания',
  Dela:'Швеция', Fnajen:'Швеция',
  Art1st:'Россия', KryFalse:'Россия',
  kantri:'Украина',
  Rad3on:'Италия', Splashy:'Великобритания',
  Stormy2x:'Северная Македония', Guiik:'Северная Македония', Lolo:'Испания', Neu:'Испания',
  Huty:'Чехия', FoCuS:'Израиль', QnDx:'Оман', Phantom:'Саудовская Аравия', 't3eny':'Словения'
};
Object.assign(NATIONALITY, NAT_2024_M1, NAT_2024_M2, NAT_2024_M3);
const FLAG_CODE_2024={'Аргентина':'ar','Шотландия':'gb-sct','Чехия':'cz'};
Object.assign(FLAG_CODE, FLAG_CODE_2024);

const NEW_NATIONALITY_M2023={
  artor:'Польша', Blacha:'Польша', charyy:'Польша', DABUEL:'Польша', G13ras:'Польша', Kami:'Польша',
  Kefyy:'Польша', Kombek:'Польша', Mikson:'Польша', Packo:'Польша', Purchawa:'Польша', Setty:'Польша',
  vexi:'Польша', Filipmonk:'Польша', Japko:'Польша', Paluch:'Польша', pkr29:'Польша',
  Cheatiin:'Германия', Fastroki:'Германия', Flickzy:'Германия', Fray:'Германия', Glubschi:'Германия',
  Hijoe:'Германия', JannisZ:'Германия', Jjtwo:'Германия', 'rezon ay':'Германия', Trexer:'Германия',
  Vortex:'Германия', Gripey:'Германия', Vadeal:'Германия',
  Fredoxie:'Дания', Hellfire:'Дания', Liwshe:'Дания', MariusCOW:'Дания', PabloWingu:'Дания',
  Refsgaard:'Дания', Skram:'Дания', Stenno:'Дания', Th0masHD:'Дания', trippernn:'Дания',
  M0ne:'Дания', MikL:'Дания',
  Andilex:'Франция', Artskill:'Франция', BadSniper:'Франция', Clement:'Франция', Decyptos:'Франция',
  Floki:'Франция', PodaSai:'Франция', Snayzy:'Франция', TChypSs:'Франция', Xsweeze:'Франция',
  Kyzen:'Франция', Shaykoz:'Франция', Skydeun:'Франция', Voxe:'Франция',
  Axeforce:'Швеция', bevvys:'Швеция', Brandtman:'Швеция', Dela:'Швеция', Forzen:'Швеция',
  Gudn:'Швеция', Klown:'Швеция', Mappi:'Швеция', Moneymaker:'Швеция', Pixie:'Швеция', Vacan:'Швеция',
  fiR3hUNTER:'Россия', 'Fury Legendary':'Россия', Grolzz:'Россия', Leyyner:'Россия', Malibuca:'Россия',
  Shamokiy:'Россия', SwizzY:'Россия', '97default':'Россия', Art1st:'Россия', G0lDx2:'Россия',
  Howly:'Россия', iRezUmi:'Россия', Putrick:'Россия', Qroll:'Россия', Toose:'Россия', Wheat:'Россия',
  Czb:'Великобритания', KaydFN:'Великобритания', nebs:'Великобритания', Pinq:'Великобритания',
  Veno:'Великобритания', Vortexers:'Великобритания', wafflar:'Великобритания', Jalen:'Великобритания',
  Twi:'Великобритания', Jae:'Великобритания',
  Arc:'Италия', Belusi:'Италия', Kyry:'Италия', Zangi:'Италия', Zara:'Италия', Zqcca:'Италия',
  Darky:'Италия', DreySon:'Италия', Gabix:'Италия', Ricky:'Италия', Shmeky:'Италия',
  Boaz:'Нидерланды', dyox:'Нидерланды', Flodax:'Нидерланды', Jaggy:'Нидерланды', Merijn:'Нидерланды',
  Rifty:'Нидерланды', Jurdy:'Нидерланды', Kiro:'Нидерланды',
  Clone:'Испания', Cr4zy:'Испания', DaaN:'Испания', JarKo:'Испания', Nakoo:'Испания', Paceve:'Испания',
  Asa:'Австрия', Vic0try0na:'Австрия',
  Coope:'Ирландия', Nipsy:'Ирландия',
  IDrop:'Норвегия', MrSavage:'Норвегия',
  P1ng:'Украина', Vanyak3kk:'Украина', Eltensy:'Украина', Kirb1:'Украина', S1ned:'Украина',
  Karmy:'Эстония', Merstach:'Латвия', Queasy:'Сербия', Skvii:'Сербия', TruleX:'Сербия',
  TaySon:'Словения', t3eny:'Словения', Kylie:'Турция', KIANDR0:'Уэльс',
  Anchor:'Беларусь', L1nk:'Беларусь', Cosmo:'Швейцария', Slovay:'Швейцария',
  Chico:'Босния и Герцеговина', 'Jur3ky':'Хорватия', Misha:'Молдова'
};
const FLAG_CODE_M2023={'Молдова':'md'};
Object.assign(FLAG_CODE, FLAG_CODE_M2023);
Object.assign(NATIONALITY, NEW_NATIONALITY_M2023);

const NEW_NATIONALITY_CH2S7={
  '7tor':'Россия', '97default':'Россия', Folnet:'Россия', Force:'Россия', karmy:'Россия', kiryache32:'Россия',
  korol1k:'Россия', ovLDER:'Россия', Putrick:'Россия', Rotory:'Россия', Safik:'Россия', Shizogod:'Россия',
  Siberiajkee:'Россия', Sp1aash:'Россия', Toose:'Россия',
  Andilex:'Франция', Artskill:'Франция', buzz:'Франция', Clement:'Франция', Decyptos:'Франция', egrm:'Франция',
  Falconly:'Франция', Floki:'Франция', keziix:'Франция', TChypSs:'Франция', TenZeN:'Франция', voxe:'Франция',
  XpeR:'Франция', xsweeze:'Франция', ZQ:'Франция',
  Adn:'Великобритания', Aryan:'Великобритания', AstroSMZ:'Великобритания', benjyfishy:'Великобритания',
  Chashy:'Великобритания', Diablo:'Великобритания', fsi:'Великобритания', Ghosty4k:'Великобритания',
  nebs:'Великобритания', Pinq:'Великобритания', Shadowfn:'Великобритания', Surprise:'Великобритания',
  veno:'Великобритания', Voidd:'Великобритания',
  Awaer:'Германия', bagfiz:'Германия', Fastroki:'Германия', Hijoe:'Германия', JannisZ:'Германия',
  karma:'Германия', PSY:'Германия', Vadeal:'Германия', Zebre:'Германия', Zeston:'Германия',
  elokratz:'Дания', Flecken:'Дания', Hottie:'Дания', Refsgaard:'Дания', trippernn:'Дания',
  Dokko:'Норвегия', Endretta:'Норвегия', xKumu:'Норвегия',
  Bayon:'Швеция', Chapix:'Швеция', Mappi:'Швеция', xsterioz:'Швеция',
  Raifla:'Финляндия', tosialpha:'Финляндия', Trixi:'Финляндия',
  jaggy:'Нидерланды', Matsoe:'Нидерланды', Umplify:'Нидерланды',
  Kami:'Польша', Setty:'Польша', teeq:'Польша',
  '4zr':'Швейцария', miknup:'Швейцария',
  aqua:'Австрия', stompy:'Австрия',
  Saevid:'Ирландия', seanvp:'Ирландия',
  Hen:'Литва', RedRush:'Литва',
  Queasy:'Сербия', TruleX:'Сербия',
  stormyrite:'Украина', WingS:'Украина',
  Mawakha:'Беларусь', Jur3ky:'Хорватия', bubak:'Словакия', Kylie:'Турция', JoeFN:'Уэльс'
};
const FLAG_CODE_CH2S7={'Беларусь':'by','Хорватия':'hr','Словакия':'sk','Ирландия':'ie'};
Object.assign(FLAG_CODE, FLAG_CODE_CH2S7);
Object.assign(NATIONALITY, NEW_NATIONALITY_CH2S7);

const M3_2025_RANKED=[
  // Europe
  {trio:'Tjino & PabloWingu & Fredoxie', region:'EU', rank:1, note:'Чемпионы EU Major 3'},
  {trio:'vic0 & Veno & Flickzy', region:'EU', rank:2},
  {trio:'Vanyak3kk & Pixie & MariusCOW', region:'EU', rank:3},
  {trio:'Setty & Japko & panzer', region:'EU', rank:4},
  {trio:'Hris & TaySon & Chico', region:'EU', rank:5},
  {trio:'FoCuS & Mikson & Upl', region:'EU', rank:6},
  {trio:'SwizzY & Queasy & Merstach', region:'EU', rank:7},
  {trio:'IDrop & charyy & Kami', region:'EU', rank:8},
  {trio:'Chap & MrSavage & rezon ay', region:'EU', rank:9},
  {trio:'Cheatiin & Trexer & Mappi', region:'EU', rank:10},
  // NA Central
  {trio:'Ritual & Cold & Peterbot', region:'NAC', rank:1, note:'Победа с отрывом всего в 3 очка'},
  {trio:'Ajerss & Acorn & Pollo', region:'NAC', rank:2},
  {trio:'Rapid & Khanada & Boltz', region:'NAC', rank:3},
  {trio:'Visxals & Braydz & Aminished', region:'NAC', rank:4},
  {trio:'Muz & Shadow & Sphinx', region:'NAC', rank:5},
  {trio:'Avivv & GMoney & Rise', region:'NAC', rank:6},
  {trio:'Bugha & Threats & Kraez', region:'NAC', rank:7},
  {trio:'Clix & Higgs & Eomzo', region:'NAC', rank:8},
  {trio:'Fazer & Phzin & K1nG', region:'NAC', rank:9},
  {trio:'Reet & Cooper & Curly', region:'NAC', rank:10},
  // NA West (rating capped at 85)
  {trio:'Bacca & Parz & PXMP', region:'NAW', rank:1, note:'Победа с отрывом 200+ очков'},
  {trio:'Ark & Sxhool & Salko', region:'NAW', rank:2},
  {trio:'VicterV & EpikWhale & paper', region:'NAW', rank:3},
  {trio:'Silxzys & Cyrzr & Velo', region:'NAW', rank:4},
  {trio:'phoenix & Mero & THORIK', region:'NAW', rank:5},
  {trio:'Raygun & Jemitty & LgndryBanana', region:'NAW', rank:6},
  {trio:'Bucke & Okis & Vergo', region:'NAW', rank:7},
  {trio:'xenon & vorx & Freeze', region:'NAW', rank:8},
  {trio:'Source & Yumi & Convic', region:'NAW', rank:9},
  {trio:'Hajuu & purebx & Creep', region:'NAW', rank:10},
  // Brazil (rating capped at 85)
  {trio:'WeY & Gabzera & Scarpa', region:'BR', rank:1},
  {trio:'Edson & Seeyun & KING', region:'BR', rank:2},
  {trio:'Lewa & Randu & Romero', region:'BR', rank:3},
  {trio:'Stryker & Tisco & Cadu', region:'BR', rank:4},
  {trio:'Gonzalo & Hazzense & Tecne', region:'BR', rank:5},
  {trio:'Frans & Redlee & Kitoz', region:'BR', rank:6},
  {trio:'Persa & Diguera & EdRoadToGlory', region:'BR', rank:7},
  {trio:'Xeat & Thiagin & Magni', region:'BR', rank:8},
  {trio:'916Gon & Nutifps & Night', region:'BR', rank:9},
  {trio:'Fuzettin & Dream & Grx', region:'BR', rank:10},
  // Asia (rating capped at 85)
  {trio:'Rise & Koyota & yuma', region:'ASIA', rank:1},
  {trio:'Raito & Razl & Kimkana', region:'ASIA', rank:2},
  {trio:'Merem & wickesy & Buyuriru', region:'ASIA', rank:3},
  {trio:'Rainy & Taiya & BOBY', region:'ASIA', rank:4},
  {trio:'Goki & Maa-san & PRBK', region:'ASIA', rank:5},
  {trio:'xMipoli & Shelom & Michael.', region:'ASIA', rank:6},
  {trio:'LILY & meah & Teddy', region:'ASIA', rank:7},
  {trio:'Qjac & RiaM & Reim', region:'ASIA', rank:8},
  {trio:'Kametin & Stella & mxrxk', region:'ASIA', rank:9},
  {trio:'Bataco & He-stin & Rabbit', region:'ASIA', rank:10},
  // Middle East (rating capped at 85)
  {trio:'Balor & Adapter & Mansour', region:'ME', rank:1},
  {trio:'Yassen & Fatla & SHRSHF', region:'ME', rank:2},
  {trio:'Saald & FKS & Hero', region:'ME', rank:3},
  {trio:'VoltiaX & Rxtr & Escdark', region:'ME', rank:4},
  {trio:'TuNa & Dandir & SnozQ', region:'ME', rank:5},
  {trio:'Snowy & saad & Rew', region:'ME', rank:6},
  {trio:'Hellonsteam & Rapit & P5EK', region:'ME', rank:7},
  {trio:'FHD & Kalgamer & SaLva', region:'ME', rank:8},
  {trio:'SoMiN & Tiggz & DaNicush', region:'ME', rank:9},
  {trio:'itay & Zenox & Sultanfv', region:'ME', rank:10},
  // Oceania (rating capped at 85)
  {trio:'Resignz & alex & Anon', region:'OCE', rank:1},
  {trio:'Tinka & Cazi & Aspect', region:'OCE', rank:2},
  {trio:'VortexM & m0untain & Goofy', region:'OCE', rank:3},
  {trio:'Teroq & ZDog & volx', region:'OCE', rank:4},
  {trio:'Mase & Phazgod & Crusades', region:'OCE', rank:5},
  {trio:'Vazen & Gazer & Bulldogz', region:'OCE', rank:6},
  {trio:'Oatley & danath & Mace', region:'OCE', rank:7},
  {trio:'Fisher & Pumpkin & Rip', region:'OCE', rank:8},
  {trio:'Zak & Jai & clayrixx', region:'OCE', rank:9},
  {trio:'Satisfy & Merc & Hezzaar', region:'OCE', rank:10}
];
const M3_2025_FIELD=33;
const M3_2025_EVENT='FNCS 2025 Major 3 — Grand Finals';
const M3_2025_DATE='2–3 авг 2025';
const M3_CAPPED_REGIONS=new Set(['NAW','BR','ASIA','ME','OCE']);

// FNCS 2025 Major 1 — Europe Grand Finals (33 trios, real results)
const M1_2025_EU_RANKED=[
  {trio:'vic0 & Veno & Flickzy', rank:1}, {trio:'P1ng & Wox & Malibuca', rank:2},
  {trio:'Vanyak3kk & Pixie & MariusCOW', rank:3}, {trio:'SwizzY & Queasy & Merstach', rank:4},
  {trio:'pixx & Darm & Demus', rank:5}, {trio:'kantri & F1n4ik & Upl', rank:6},
  {trio:'TruleX & TaySon & Chico', rank:7}, {trio:'Mongraal & MrSavage & panzer', rank:8},
  {trio:'IDrop & Sky & Scroll', rank:9}, {trio:'Czb & Eclipse & Nxthan', rank:10},
  {trio:'JarKo & Nakoo & Kiire', rank:11}, {trio:'Pinq & Nebs & Tjino', rank:12},
  {trio:'Nomzz & Rezoy & Gripey', rank:13}, {trio:'Kombek & Blacha & Mikson', rank:14},
  {trio:'Chap & JannisZ & Noahreyli', rank:15}, {trio:'Hris & t3eny & Skvii', rank:16},
  {trio:'Dinus & Franek & Kizers', rank:17}, {trio:'Rax & Predage & Rad3on', rank:18},
  {trio:'Robin & Trexer & Hijoe', rank:19}, {trio:'1vanjkee & Pixovsky & Battercry', rank:20},
  {trio:'Setty & charyy & Kami', rank:21}, {trio:'shxrk & Juu & zAndy', rank:22},
  {trio:'Cringe & KaydFN & Mappi', rank:23}, {trio:'L0WK3Y & M0ne & Liwshe', rank:24},
  {trio:'NeFrizi & 1Lusha & Starkus', rank:25}, {trio:'Akiira & PodaSai & xsweeze', rank:26},
  {trio:'Adesito & Kifo & Marvik', rank:27}, {trio:'Art1st & KryFalse & iFr0zi', rank:28},
  {trio:'Fastroki & Ankido & Volko', rank:29}, {trio:'SkyJump & Shaykoz & Momsy', rank:30},
  {trio:'Gudn & Klown & Moneymaker', rank:31}, {trio:'Robban & Axeforce & Fnajen', rank:32},
  {trio:'unZxn & Domtat22 & Ewik', rank:33}
];
const M1_2025_EU_FIELD=33;
const M1_2025_EU_EVENT='FNCS 2025 Major 1 — Europe Grand Finals';
// Was 'апр 2025', which is Major 2's month. Epic's window metadata puts the
// Major 1 Grand Finals on 15-16 February 2025, and the mode tile above has said
// "янв — фев" all along.
const M1_2025_EU_DATE='фев 2025';

// FNCS 2025 Major 2 — Europe Grand Finals (33 trios, real results)
const M2_2025_EU_RANKED=[
  {trio:'Vanyak3kk & Pixie & MariusCOW', rank:1}, {trio:'Tjino & PabloWingu & Fredoxie', rank:2},
  {trio:'pixx & Darm & Demus', rank:3}, {trio:'P1ng & Wox & Malibuca', rank:4},
  {trio:'SwizzY & Queasy & Merstach', rank:5}, {trio:'vic0 & Veno & Flickzy', rank:6},
  {trio:'Hris & TaySon & Chico', rank:7}, {trio:'Th0masHD & Upl & panzer', rank:8},
  {trio:'Setty & charyy & Kami', rank:9}, {trio:'Pinq & Nebs & Kiro', rank:10},
  {trio:'IDrop & Sky & Scroll', rank:11}, {trio:'Cringe & Volko & kiduoo', rank:12},
  {trio:'Akiira & Kurama & Werex', rank:13}, {trio:'Dinus & G13ras & Franek', rank:14},
  {trio:'Moneymaker & Fnajen & Faded', rank:15}, {trio:'Robin & Cheatiin & Trexer', rank:16},
  {trio:'Artskill & PodaSai & xsweeze', rank:17}, {trio:'Ricbor & Zara & Zangi', rank:18},
  {trio:'Vadeal & MrSavage & rezon ay', rank:19}, {trio:'Srapt & Hellfire & trippernn', rank:20},
  {trio:'Kombek & Blacha & Mikson', rank:21}, {trio:'shxrk & TruleX & Noahreyli', rank:22},
  {trio:'Noia & Misha & Yassen', rank:23}, {trio:'Sangild & tidi & Julle', rank:24},
  {trio:'Chap & t3eny & Skvii', rank:25}, {trio:'Nomzz & Auvahalo & Twi', rank:26},
  {trio:'Fastroki & FoCuS & JannisZ', rank:27}, {trio:'Glubschi & prax & Gripey', rank:28},
  {trio:'ARDI & Falex & DarKiizZ', rank:29}, {trio:'Juu & F1n4ik & zAndy', rank:30},
  {trio:'Ricky & Belusi & Gabix', rank:31}, {trio:'Deckzee & Huty & Art1st', rank:32},
  {trio:'Aryanly & KaydFN & 1vanjkee', rank:33}
];
const M2_2025_EU_FIELD=33;
const M2_2025_EU_EVENT='FNCS 2025 Major 2 — Europe Grand Finals';
// Was 'июн 2025'. The Major 2 Grand Finals ran 26-27 April 2025.
const M2_2025_EU_DATE='апр 2025';

// Nationalities from the Country Representation tables of both events —
// only fills handles that don't already have a nationality set elsewhere.
const M1M2_2025_EU_NAT={
  // Major 1 EU representation
  Kiire:'Испания', Rezoy:'Германия', Dinus:'Польша', Franek:'Польша', Kizers:'Польша',
  Rax:'Италия', Battercry:'Сербия', Pixovsky:'Польша', '1Lusha':'Россия', Starkus:'Дания',
  Adesito:'Испания', Kifo:'Испания', Marvik:'Испания', iFr0zi:'Россия', Ankido:'Ирак',
  SkyJump:'Франция', Momsy:'Франция', unZxn:'Швеция', Domtat22:'Великобритания', Ewik:'Эстония',
  Hijoe:'Германия', Nomzz:'Германия', Nxthan:'Великобритания', Eclipse:'Великобритания',
  Klown:'Швеция', Gudn:'Швеция', Mappi:'Швеция', Axeforce:'Швеция', Robban:'Швеция',
  L0WK3Y:'Дания', Liwshe:'Дания', M0ne:'Дания', NeFrizi:'Россия', KryFalse:'Россия', Art1st:'Россия',
  Predage:'Италия', Rad3on:'Италия', kantri:'Украина', Hris:'Северная Македония',
  F1n4ik:'Украина', '1vanjkee':'Сербия',
  // Major 2 EU representation
  Kurama:'Франция', Faded:'Румыния', Noia:'Франция', Yassen:'Египет', tidi:'Нидерланды',
  Julle:'Финляндия', prax:'Германия', ARDI:'Италия', Falex:'Великобритания', DarKiizZ:'Италия',
  Aryanly:'Великобритания', Cheatiin:'Германия', Glubschi:'Германия', Gripey:'Германия',
  kiduoo:'Германия', Vadeal:'Германия', Auvahalo:'Дания', Deckzee:'Дания', Fredoxie:'Дания',
  Hellfire:'Дания', PabloWingu:'Дания', Sangild:'Дания', Srapt:'Дания', trippernn:'Дания',
  G13ras:'Польша', Belusi:'Италия', Gabix:'Италия', Ricbor:'Италия', Ricky:'Италия',
  Zangi:'Италия', Zara:'Италия', Artskill:'Франция', Werex:'Франция', Twi:'Великобритания',
  Kiro:'Нидерланды', Misha:'Молдова',
};
const FLAG_CODE_M1M2_2025={'Ирак':'iq','Финляндия':'fi'};
Object.assign(FLAG_CODE, FLAG_CODE_M1M2_2025);
Object.keys(M1M2_2025_EU_NAT).forEach(h=>{ if(!NATIONALITY[h]) NATIONALITY[h]=M1M2_2025_EU_NAT[h]; });
const NEW_NATIONALITY_M3_2025={
  Balor:'Саудовская Аравия', Adapter:'Саудовская Аравия', Mansour:'Саудовская Аравия',
  Rew:'Саудовская Аравия', Rxtr:'Саудовская Аравия', saad:'Саудовская Аравия', SaLva:'Саудовская Аравия',
  FHD:'Саудовская Аравия', Kalgamer:'Саудовская Аравия',
  Sultanfv:'Израиль', DaNicush:'Израиль', SoMiN:'Израиль', Tiggz:'Израиль', itay:'Израиль', Zenox:'Израиль',
  TuNa:'Польша', Dandir:'Польша', SnozQ:'Польша', Darm:'Польша', Demus:'Польша', Japko:'Польша',
  Escdark:'Бахрейн', Hellonsteam:'Пакистан',
  Bataco:'Япония', BOBY:'Япония', Goki:'Япония', 'He-stin':'Япония', Kametin:'Япония', LILY:'Япония',
  'Maa-san':'Япония', meah:'Япония', 'Michael.':'Япония', mxrxk:'Япония', PRBK:'Япония', Qjac:'Япония',
  Rabbit:'Япония', Rainy:'Япония', Stella:'Япония', Taiya:'Япония', Teddy:'Япония', xMipoli:'Япония',
  WeY:'Бразилия', Scarpa:'Бразилия', Edson:'Бразилия', Seeyun:'Бразилия', KING:'Бразилия', Stryker:'Бразилия',
  Cadu:'Бразилия', Frans:'Бразилия', Redlee:'Бразилия', Kitoz:'Бразилия', Persa:'Бразилия', Diguera:'Бразилия',
  EdRoadToGlory:'Бразилия', Xeat:'Бразилия', Magni:'Бразилия', Fuzettin:'Бразилия', Dream:'Бразилия',
  alex:'Австралия', Anon:'Австралия', Aspect:'Австралия', Bulldogz:'Австралия', clayrixx:'Австралия',
  danath:'Австралия', Fisher:'Австралия', Gazer:'Австралия', Goofy:'Австралия', Jai:'Австралия',
  m0untain:'Австралия', Mace:'Австралия', Mase:'Австралия', Merc:'Австралия', Oatley:'Австралия',
  Phazgod:'Австралия', Pumpkin:'Австралия', Rip:'Австралия', Satisfy:'Австралия', Teroq:'Австралия',
  Vazen:'Австралия', volx:'Австралия', VortexM:'Австралия', Zak:'Австралия', ZDog:'Австралия',
  Cazi:'Новая Зеландия', Crusades:'Новая Зеландия',
  Mappi:'Швеция', Wox:'Швеция', Trexer:'Германия',
  Ark:'США', Bacca:'США', EpikWhale:'США', Parz:'США', PXMP:'США', Salko:'США', Sxhool:'США',
  THORIK:'США', VicterV:'США', vorx:'США',
  Creep:'Канада', LgndryBanana:'Канада', Mero:'Канада',
  Cyrzr:'Мексика', Yumi:'Мексика'
};
const FLAG_CODE_M3_EXTRA={'Пакистан':'pk'};
Object.assign(FLAG_CODE, FLAG_CODE_M3_EXTRA);
Object.assign(NATIONALITY, NEW_NATIONALITY_M3_2025);

const GC2023_RANKED=[
  {duo:'Mero & Cooper', rank:1}, {duo:'Kami & Setty', rank:2},
  {duo:'TruleX & Chico', rank:3}, {duo:'Cheatiin & Pixie', rank:4},
  {duo:'Mkmkpapa & Shelom', rank:5}, {duo:'Brycx & Chubs', rank:6},
  {duo:'Acorn & Cold', rank:7}, {duo:'Eomzo & Rise', rank:8},
  {duo:'Ritual & Reet', rank:9}, {duo:'vic0 & Pinq', rank:10}
];
const GC2023_FIELD=50;
const GC2023_EVENT='FNCS 2023 Global Championship — Grand Finals (Copenhagen)';
const GC2023_DATE='13–15 окт 2023';

// FNCS Invitational 2022 — the first in-person FNCS LAN (Raleigh, 12-13 Nov 2022, 50 duos)
const INV2022_RANKED=[
  {duo:'Kami & Setty', rank:1}, {duo:'Queasy & Veno', rank:2},
  {duo:'Cented & Cold', rank:3}, {duo:'Th0masHD & Trippernn', rank:4},
  {duo:'Kitoz & Phzin', rank:5}, {duo:'Hen & Vortex', rank:6},
  {duo:'BadSniper & Noahreyli', rank:7}, {duo:'Joefn & zAndy', rank:8},
  {duo:'KBR & xeat', rank:9}, {duo:'Larson & Smite', rank:10},
  {duo:'Avery & Commandment', rank:11}, {duo:'klown & Refsgaard', rank:12},
  {duo:'Acorn & Edgey', rank:13}, {duo:'bevvys & Vortexers', rank:14}
];
const INV2022_FIELD=50;
const INV2022_EVENT='FNCS Invitational 2022 — Grand Finals (Raleigh)';
const INV2022_DATE='12–13 ноя 2022';

// FNCS 2024 Global Championship — Fort Worth, offline LAN, 50 duos, $2,000,000 (real results, Sep 7-8 2024)
const GC2024_RANKED=[
  {duo:'Peterbot & Pollo', rank:1}, {duo:'Queasy & Th0masHD', rank:2},
  {duo:'Chico & TruleX', rank:3}, {duo:'Flickzy & vic0', rank:4},
  {duo:'P1ng & Wox', rank:5}, {duo:'Chap & t3eny', rank:6},
  {duo:'Boltz & Brycx', rank:7}, {duo:'Dukez & Sphinx', rank:8},
  {duo:'Batman Bugha & Rapid', rank:9}, {duo:'Japko & SwizzY', rank:10},
  {duo:'Clix & Veno', rank:11}, {duo:'Reet & Ritual', rank:12},
  {duo:'Bacca & Parz', rank:13}, {duo:'Avivv & Bugha', rank:14},
  {duo:'JannisZ & Pixie', rank:15}, {duo:'Ajerss & Rise', rank:16},
  {duo:'916Gon & Kwanti', rank:17}, {duo:'Huty & KovaaksXD', rank:18},
  {duo:'rezon ay & Vadeal', rank:19}, {duo:'Cooper & Khanada', rank:20},
  {duo:'paper & VicterV', rank:21}, {duo:'Fazer & K1nG', rank:22},
  {duo:'Kami & Setty', rank:23}, {duo:'Koyota & xMipoli', rank:24},
  {duo:'Czb & Nxthan', rank:25}, {duo:'Acorn & Cold', rank:26},
  {duo:'EpikWhale & Muz', rank:27}, {duo:'Scroll & Sky', rank:28},
  {duo:'charyy & G13ras', rank:29}, {duo:'Shadow & Vergo', rank:30},
  {duo:'EdRoadToGlory & Persa', rank:31}, {duo:'Malibuca & Merstach', rank:32},
  {duo:'Deymo & Resignz', rank:33}, {duo:'Cheapz & Krisp', rank:34},
  {duo:'Cadu & Seeyun', rank:35}, {duo:'Threats & Trashy', rank:36},
  {duo:'Braydz & Visxals', rank:37}, {duo:'Casperinovic & Prism', rank:38},
  {duo:'Adapter & FKS', rank:39}, {duo:'Shelom & Zagou', rank:40},
  {duo:'Kayky & Kchorro', rank:41}, {duo:'7man & Kalgamer', rank:42},
  {duo:'Rise & yuma', rank:43}, {duo:'Clone & KramSu', rank:44},
  {duo:'alex & worthy', rank:45}, {duo:'Job & Michael.', rank:46},
  {duo:'Andilex & Seyyto', rank:47}, {duo:'BOBY & Larkpex', rank:48},
  {duo:'Aspect & Cazi', rank:49}, {duo:'danath & Tinka', rank:50}
];
const GC2024_FIELD=50;
const GC2024_EVENT='FNCS 2024 Global Championship — Grand Finals (Fort Worth)';
const GC2024_DATE='7–8 сен 2024';
// A few of the above hadn't appeared in earlier events yet — fill in their
// nationalities (from Liquipedia's Country Representation table for this event).
const GC2024_NEW_NATIONALITY={
  Braydz:'США', Visxals:'США', Trashy:'США', 'Batman Bugha':'США',
  Sphinx:'США', Clix:'США', Bugha:'США', Kwanti:'США', Krisp:'США',
  Job:'Япония', Larkpex:'Япония', Zagou:'Япония',
  Kayky:'Бразилия', Kchorro:'Бразилия',
  worthy:'Австралия', Muz:'Австралия', Deymo:'Австралия',
  KramSu:'Испания',
  paper:'Индия',
  Threats:'Куба',
  Dukez:'Мексика',
  Rise:'Канада',
};
const FLAG_CODE_GC2024={'Куба':'cu'};
Object.assign(FLAG_CODE, FLAG_CODE_GC2024);
Object.assign(NATIONALITY, GC2024_NEW_NATIONALITY);

// Every one of the thirty-three places, off the Global Championship prize table.
// Fifteen of these used to sit in GC2025_UNRANKED as "place not published" --
// they were published, on the same page, in the table that pays them.
const GC2025_RANKED=[
  {trio:'Merstach & Queasy & SwizzY', rank:1}, {trio:'MariusCOW & Pixie & Vanyak3kk', rank:2},
  {trio:'Japko & Setty & panzer', rank:3}, {trio:'IDrop & Kami & charyy', rank:4},
  {trio:'Boltz & Khanada & Rapid', rank:5}, {trio:'Darm & Demus & pixx', rank:6},
  {trio:'Fredoxie & PabloWingu & Tjino', rank:7}, {trio:'Malibuca & P1ng & Wox', rank:8},
  {trio:'Chap & MrSavage & rezon ay', rank:9}, {trio:'Muz & Shadow & Sphinx', rank:10},
  {trio:'Fazer & K1nG & Phzin', rank:11}, {trio:'Cadu & Stryker & Tisco', rank:12},
  {trio:'Cooper & Curly & Reet', rank:13}, {trio:'Flickzy & Veno & vic0', rank:14},
  {trio:'Cold & Peterbot & Ritual', rank:15}, {trio:'Acorn & Ajerss & Pollo', rank:16},
  {trio:'Bacca & PXMP & Parz', rank:17}, {trio:'Clix & Eomzo & Higgs', rank:18},
  {trio:'Ark & Salko & Sxhool', rank:19}, {trio:'FoCuS & Mikson & Upl', rank:20},
  {trio:'5aald & FKS & Hero', rank:21}, {trio:'Chico & Hris & TaySon', rank:22},
  {trio:'Aminished & Braydz & Visxals', rank:23}, {trio:'Anon & Resignz & alex', rank:24},
  {trio:'Koyota & Rise & yuma', rank:25}, {trio:'Goofy & VortexM & m0untain', rank:26},
  {trio:'Gabzera & Scarpa & WeY', rank:27}, {trio:'Buyuriru & Merem & wickesy', rank:28},
  {trio:'Rew & Snowy & saad', rank:29}, {trio:'Kimkana & Raito & Razl', rank:30},
  {trio:'EpikWhale & VicterV & paper', rank:31}, {trio:'Adapter & Balor & Mansour', rank:32},
  {trio:'Aspect & Cazi & Tinka', rank:33}
];
// Nothing is unplaced any more. Kept as an empty list rather than deleted: the
// builder below still reads it, and a future event may well have participants
// whose finishing position never gets published.
const GC2025_UNRANKED=[
];
const GC2025_FIELD=33;
const GC2025_EVENT='FNCS 2025 Global Championship — Grand Finals (Lyon)';
const GC2025_DATE='6–7 сен 2025';

const NEW_NATIONALITY_REGION_QUALIFIERS={
  '916Gon':'Бразилия', Grx:'Бразилия', Night:'Бразилия', Nutifps:'Бразилия', TheFeloz:'Бразилия',
  Lewa:'Аргентина', Randu:'Аргентина', Romero:'Аргентина',
  yuma:'Япония', Koyota:'Япония', LBworks:'Япония', Bot:'Япония', Minipiyo:'Япония', FuuKun:'Япония',
  '7man':'Бахрейн', Rew:'Саудовская Аравия', Rxtr:'Саудовская Аравия', Yo7med:'Саудовская Аравия',
  alex:'Австралия', Bulldogz:'Австралия', Resignz:'Австралия', Tinka:'Австралия', Vazen:'Австралия', Wreckless:'Австралия'
};
const FLAG_CODE_EXTRA4={'Бахрейн':'bh'};
Object.assign(FLAG_CODE, FLAG_CODE_EXTRA4);
Object.assign(NATIONALITY, NEW_NATIONALITY_REGION_QUALIFIERS);

const NEW_NATIONALITY_2022_2023={
  Brycx:'США', Chubs:'США',
  Mero:'Канада', TruleX:'Сербия', Mkmkpapa:'Япония', Shelom:'Япония',
  Setty:'Польша', Cented:'Канада', Trippernn:'Дания', Kitoz:'Бразилия',
  Hen:'Литва', Vortex:'Германия', BadSniper:'Франция', Noahreyli:'Швейцария',
  Joefn:'Уэльс', zAndy:'Румыния', KBR:'Бразилия', xeat:'Бразилия',
  Larson:'США', Smite:'США', Avery:'Канада', Commandment:'США',
  klown:'Швеция', Refsgaard:'Дания', Edgey:'США', bevvys:'Швеция', Vortexers:'Великобритания',
  Pinq:'Великобритания', Vic0tryOna:'Австрия'
};
const FLAG_CODE_EXTRA3={'Литва':'lt','Уэльс':'gb','Румыния':'ro'};
Object.assign(FLAG_CODE, FLAG_CODE_EXTRA3);
Object.assign(NATIONALITY, NEW_NATIONALITY_2022_2023);

const NEW_NATIONALITY_2025={
  MariusCOW:'Дания', Werex:'Франция', Nebs:'Великобритания',
  Fredoxie:'Дания', Mikson:'Польша', Setty:'Польша', Wox:'Швеция', P1ng:'Украина',
  Vanyak3kk:'Украина', Merstach:'Латвия', Queasy:'Сербия', TaySon:'Словения',
  Hris:'Северная Македония', Upl:'Эстония', MrSavage:'Норвегия', pixx:'Польша',
  FKS:'Саудовская Аравия', Hero:'Саудовская Аравия', EpikWhale:'США', PXMP:'США',
  Eomzo:'Канада', Chico:'Босния и Герцеговина', IDrop:'Норвегия', 'rezon ay':'Германия'
};
const FLAG_CODE_EXTRA={'Сенегал':'sn','Франция':'fr','Норвегия':'no','Саудовская Аравия':'sa','Аргентина':'ar',
  'Украина':'ua','Латвия':'lv','Сербия':'rs','Северная Македония':'mk','Эстония':'ee',
  'Босния и Герцеговина':'ba','Новая Зеландия':'nz','Оман':'om','Кувейт':'kw','Австралия':'au',
  'Япония':'jp','Индия':'in','Бразилия':'br'};
Object.assign(FLAG_CODE, FLAG_CODE_EXTRA);
Object.assign(NATIONALITY, NEW_NATIONALITY_2025);

const GLOBALS2025_EXTRA=[
  {handle:'S1neD',region:'UNK',nat:'Украина',event:'Профиль игрока (результат на FNCS не опубликован)',date:'-'},
  {handle:'Goofy',region:'OCE',nat:'Австралия'},{handle:'m0untain',region:'OCE',nat:'Австралия'},{handle:'VortexM',region:'OCE',nat:'Австралия'},
  {handle:'Snowy',region:'ME',nat:'Оман'},{handle:'Saald',region:'ME',nat:'Кувейт'},
  {handle:'Scarpa',region:'BR',nat:'Бразилия'},{handle:'WeY',region:'BR',nat:'Бразилия'},
  {handle:'Cazi',region:'OCE',nat:'Новая Зеландия'},{handle:'paper',region:'ASIA',nat:'Индия'}
];



const PLAYERS_BASE=[];
const cardKeys=new Set();
const TEAMMATE_GROUPS=[];
let cardSeq=0;

// Rating ceiling by tournament prestige — only true elite LAN/international events can hit 100.
function tierCapForEvent(event){
  if(!event) return 90;
  const isLAN = event.includes('Global Championship') || event.includes('Invitational 2022') || event.includes('Major 1 Summit');
  return isLAN ? 100 : 90; // LAN events (Global Championship, Invitational, Major Summit) can hit 100 — everything else, online, caps at 90
}

function pushCard(card){
  // Написание чистится ЗДЕСЬ, до ключа склейки: иначе «Japko » и «Japko» с
  // одного турнира лягут двумя карточками. См. hKey.
  card.handle=String(card.handle||'').trim();
  // Ник без единой буквы («04 06 03», «14.04.2027») в лобби читается как «куча цифр вместо ника».
  if(!/\p{L}/u.test(card.handle)) return;
  const key=card.handle+'|'+card.event+'|'+card.placement;
  if(cardKeys.has(key)) return;
  cardKeys.add(key);
  cardSeq++;
  card.id=card.handle+'__'+cardSeq;
  card.rating=Math.min(card.rating, tierCapForEvent(card.event));
  PLAYERS_BASE.push(card);
  // Индекс «набор|регион» — чтобы сборка набора не фильтровала все карточки на каждый регион.
  const ik=(card.cardSet||'')+'|'+(card.region||'');
  const il=CARDS_BY_SETREG.get(ik); if(il) il.push(card); else CARDS_BY_SETREG.set(ik, [card]);
}
const CARDS_BY_SETREG=new Map();

RANKED.forEach(r=>{
  const names=r.duo.split(' & ');
  TEAMMATE_GROUPS.push(names);
  const percentile=(r.field-r.rank)/(r.field-1)*100;
  names.forEach(h=>{
    pushCard({
      handle:h, nat:NATIONALITY[h]||null,
      region:r.region, event:r.event, date:r.date, placement:r.rank, note:r.note||'',
      tier:'ranked', rarity:rarityForRating(ratingForRank(r.rank,percentile,r.event)), rating:ratingForRank(r.rank,percentile,r.event)
    });
  });
});
QUALIFIERS.forEach(r=>{
  const names=r.duo.split(' & ');
  TEAMMATE_GROUPS.push(names);
  names.forEach(h=>{
    pushCard({
      handle:h, nat:NATIONALITY[h]||null,
      region:r.region, event:'FNCS 2026 Major 1 Summit — Group Stage', date:'29–30 мая 2026',
      placement:null, note:'',
      tier:'qualifier', rarity:'common', rating:55
    });
  });
});
const NAT_TO_REGION={
  'США':'NAC','Канада':'NAC','Мексика':'NAC',
  'Бразилия':'BR','Аргентина':'BR',
  'Япония':'ASIA','Индия':'ASIA',
  'Саудовская Аравия':'ME','Оман':'ME','Кувейт':'ME',
  'Австралия':'OCE','Новая Зеландия':'OCE'
};
function regionForNat(nat){ return NAT_TO_REGION[nat] || 'EU'; }
function regionForNatOrUnknown(nat){ return nat ? (NAT_TO_REGION[nat]||'EU') : 'UNK'; }

CH2S7_EU_RANKED.forEach(r=>{
  const names=r.trio.split(' & ');
  TEAMMATE_GROUPS.push(names);
  const percentile=(CH2S7_EU_FIELD-r.rank)/(CH2S7_EU_FIELD-1)*100;
  names.forEach(h=>{
    pushCard({
      handle:h, nat:NATIONALITY[h]||null,
      region:'EU', event:CH2S7_EU_EVENT, date:CH2S7_EU_DATE, placement:r.rank, note:'',
      tier:'ranked', rarity:rarityForRating(ratingForRank(r.rank,percentile,CH2S7_EU_EVENT)), rating:ratingForRank(r.rank,percentile,CH2S7_EU_EVENT)
    });
  });
});

processTrioRanked(CH2S5_EU_RANKED, CH2S5_EU_FIELD, CH2S5_EU_EVENT, CH2S5_EU_DATE, 'EU');
processTrioRanked(M1_2025_EU_RANKED, M1_2025_EU_FIELD, M1_2025_EU_EVENT, M1_2025_EU_DATE, 'EU');
processTrioRanked(M2_2025_EU_RANKED, M2_2025_EU_FIELD, M2_2025_EU_EVENT, M2_2025_EU_DATE, 'EU');
processDuoRanked(M1_2023_EU_RANKED, M1_2023_EU_FIELD, M1_2023_EU_EVENT, M1_2023_EU_DATE, 'EU');
// 2024 EU finals now come from the full 2024 sets (f1–f3) with stats and six regions;
// the old rank-only lists stay for the draft's history and nationality tables.
// processDuoRanked(M1_2024_EU_RANKED, M1_2024_EU_FIELD, M1_2024_EU_EVENT, M1_2024_EU_DATE, 'EU');
// processDuoRanked(M2_2024_EU_RANKED, M2_2024_EU_FIELD, M2_2024_EU_EVENT, M2_2024_EU_DATE, 'EU');
// processDuoRanked(M3_2024_EU_RANKED, M3_2024_EU_FIELD, M3_2024_EU_EVENT, M3_2024_EU_DATE, 'EU');
processDuoRanked(M2_2023_EU_RANKED, M2_2023_EU_FIELD, M2_2023_EU_EVENT, M2_2023_EU_DATE, 'EU');
processDuoRanked(M3_2023_EU_RANKED, M3_2023_EU_FIELD, M3_2023_EU_EVENT, M3_2023_EU_DATE, 'EU');
processTrioRanked(CH2S6_EU_RANKED, CH2S6_EU_FIELD, CH2S6_EU_EVENT, CH2S6_EU_DATE, 'EU');
processTrioRanked(CH2S8_EU_RANKED, CH2S8_EU_FIELD, CH2S8_EU_EVENT, CH2S8_EU_DATE, 'EU');
processTrioRanked(GRANDROYALE2021_EU_RANKED, GRANDROYALE2021_EU_FIELD, GRANDROYALE2021_EU_EVENT, GRANDROYALE2021_EU_DATE, 'EU');
ALLSTAR2021_SOLO_EU.forEach(r=>{
  const percentile=(ALLSTAR2021_SOLO_EU_FIELD-r.rank)/(ALLSTAR2021_SOLO_EU_FIELD-1)*100;
  pushCard({
    handle:r.handle, nat:NATIONALITY[r.handle]||null,
    region:'EU', event:ALLSTAR2021_SOLO_EU_EVENT, date:ALLSTAR2021_SOLO_EU_DATE, placement:r.rank, note:'',
    tier:'ranked', rarity:rarityForRating(ratingForRank(r.rank,percentile,ALLSTAR2021_SOLO_EU_EVENT)), rating:ratingForRank(r.rank,percentile,ALLSTAR2021_SOLO_EU_EVENT)
  });
});

M3_2025_RANKED.forEach(r=>{
  const names=r.trio.split(' & ');
  TEAMMATE_GROUPS.push(names);
  const percentile=(M3_2025_FIELD-r.rank)/(M3_2025_FIELD-1)*100;
  let rating=ratingForRank(r.rank, percentile, M3_2025_EVENT);
  if(M3_CAPPED_REGIONS.has(r.region)) rating=Math.min(rating,85);
  names.forEach(h=>{
    pushCard({
      handle:h, nat:NATIONALITY[h]||null,
      region:r.region, event:M3_2025_EVENT, date:M3_2025_DATE, placement:r.rank, note:r.note||'',
      tier:'ranked', rarity:rarityForRating(rating), rating:rating
    });
  });
});

GC2023_RANKED.forEach(r=>{
  const names=r.duo.split(' & ');
  TEAMMATE_GROUPS.push(names);
  const percentile=(GC2023_FIELD-r.rank)/(GC2023_FIELD-1)*100;
  names.forEach(h=>{
    const nat=NATIONALITY[h]||null;
    pushCard({
      handle:h, nat:nat,
      region:regionForNatOrUnknown(nat), event:GC2023_EVENT, date:GC2023_DATE, placement:r.rank, note:'',
      tier:'ranked', rarity:rarityForRating(ratingForRank(r.rank,percentile,GC2023_EVENT)), rating:ratingForRank(r.rank,percentile,GC2023_EVENT)
    });
  });
});
GC2024_RANKED.forEach(r=>{
  const names=r.duo.split(' & ');
  TEAMMATE_GROUPS.push(names);
  const percentile=(GC2024_FIELD-r.rank)/(GC2024_FIELD-1)*100;
  names.forEach(h=>{
    const nat=NATIONALITY[h]||null;
    pushCard({
      handle:h, nat:nat,
      region:regionForNatOrUnknown(nat), event:GC2024_EVENT, date:GC2024_DATE, placement:r.rank, note:'',
      tier:'ranked', rarity:rarityForRating(ratingForRank(r.rank,percentile,GC2024_EVENT)), rating:ratingForRank(r.rank,percentile,GC2024_EVENT)
    });
  });
});
INV2022_RANKED.forEach(r=>{
  const names=r.duo.split(' & ');
  TEAMMATE_GROUPS.push(names);
  const percentile=(INV2022_FIELD-r.rank)/(INV2022_FIELD-1)*100;
  names.forEach(h=>{
    const nat=NATIONALITY[h]||null;
    pushCard({
      handle:h, nat:nat,
      region:regionForNatOrUnknown(nat), event:INV2022_EVENT, date:INV2022_DATE, placement:r.rank, note:'',
      tier:'ranked', rarity:rarityForRating(ratingForRank(r.rank,percentile,INV2022_EVENT)), rating:ratingForRank(r.rank,percentile,INV2022_EVENT)
    });
  });
});

GC2025_RANKED.forEach(r=>{
  const names=r.trio.split(' & ');
  TEAMMATE_GROUPS.push(names);
  const percentile=(GC2025_FIELD-r.rank)/(GC2025_FIELD-1)*100;
  names.forEach(h=>{
    const nat=NATIONALITY[h]||null;
    pushCard({
      handle:h, nat:nat,
      region:regionForNat(nat), event:GC2025_EVENT, date:GC2025_DATE, placement:r.rank, note:'',
      tier:'ranked', rarity:rarityForRating(ratingForRank(r.rank,percentile,GC2025_EVENT)), rating:ratingForRank(r.rank,percentile,GC2025_EVENT)
    });
  });
});
GC2025_UNRANKED.forEach(trioStr=>{
  const names=trioStr.split(' & ');
  TEAMMATE_GROUPS.push(names);
  names.forEach(h=>{
    const nat=NATIONALITY[h]||null;
    pushCard({
      handle:h, nat:nat,
      region:regionForNat(nat), event:GC2025_EVENT+' (участник, точное место не опубликовано)', date:GC2025_DATE, placement:null, note:'',
      tier:'qualifier', rarity:'common', rating:55
    });
  });
});
GLOBALS2025_EXTRA.forEach(g=>{
  pushCard({
    handle:g.handle, nat:g.nat||NATIONALITY[g.handle]||null,
    region:g.region, event:g.event||'FNCS 2025 Global Championship — Lyon', date:g.date||'6–7 сен 2025',
    placement:null, note:'',
    tier:'qualifier', rarity:'common', rating:55
  });
});
// Local meme: S1neD always shows 101, on every card, no matter the tournament
// tier cap. Setting it here is not enough on its own — the season ledgers below
// rewrite every Major card, and the card prints attrsFor().ovr rather than the
// rating — so applyS1nedMeme() runs again after all of that. This early pass
// still matters for the cards the ledgers never touch.
// withAttrs is false on the early pass: ATTR_KEYS is declared thousands of lines
// below this point, so touching attrsFor here throws a temporal-dead-zone error
// and takes the whole script down with it. The early pass sets the rating for
// the cards no ledger will rewrite; the post-ledger pass does the rest.
function applyS1nedMeme(withAttrs){
  PLAYERS_BASE.forEach(p=>{
    if(p.handle.toLowerCase()!=='s1ned') return;
    // Every card-mode Major is left alone. A card reading 101 outranks every
    // real result, and it took first place in both competitive modes ahead of
    // the players who actually won those seasons. There he is rated on his
    // tournaments like everybody else; the joke keeps the older sets.
    // Written against the tier rather than a list of set names, so a set added
    // later cannot reintroduce the problem by not being on the list — which is
    // exactly what happened when the 2025 set arrived.
    if(p.tier==='cardmode') return;
    p.rating=101; p.rarity='mythic'; p._targetOvr=101;
    if(!withAttrs) return;
    // The six bars stay inside the normal 99 ceiling; only the headline number
    // breaks it, which is the joke — a card that reads higher than the scale.
    const a=attrsFor(p);
    ATTR_KEYS.forEach(k=>{ a[k]=99; });
    a.ovr=101;
    p._attrs=a;
  });
}
applyS1nedMeme(false);

const PLAYERS=PLAYERS_BASE;

// The Grand Finals are the truth of the season: whoever reached them gets their
// card rebuilt from what they did there.
const NO_GF_PENALTY=10;

// Nobody who missed a Grand Finals can outrank someone who played it: the
// Grand Finals band bottoms out at 70, and every other result scores strictly
// below that. Winning the Play-In is still worth far more than scraping the
// Last Chance Qualifier, but neither reaches a finalist.
const NO_GF_TOP=68, NO_GF_FLOOR=50;      // Play-In rank 1 … last
const NO_GF_LCQ_TOP=58, NO_GF_LCQ_FLOOR=42;
function missedGfPlayinBase(rank, field){
  return NO_GF_TOP - ((rank-1)/Math.max(field-1,1))*(NO_GF_TOP-NO_GF_FLOOR);
}
function missedGfLcqBase(rank, field){
  return NO_GF_LCQ_TOP - ((rank-1)/Math.max(field-1,1))*(NO_GF_LCQ_TOP-NO_GF_LCQ_FLOOR);
}

// ---------- Card set: FNCS 2026 Major 1 (Europe) ----------
// All figures come from Fortnite Tracker: the cumulative Play-In board, the
// Last Chance Qualifier and the Finals. Nicknames and orgs are Tracker's too.
// Nationality prefers Liquipedia (per player); where Liquipedia has no entry we
// fall back to the duo flag Tracker shows.
// Play-In, cumulative top 150 duos.
// [rank, points, matches, wins, avgElims, avgPlace, player1, player2]
const CARD_M1_PLAYIN_RAW=[
[1,1071,21,3,12.81,16.9,"Focus","Th0masHD"],
[2,932,22,2,9.73,22.73,"SwizzY","Pixie"],
[3,916,21,0,9.14,18.81,"Tjino","PabloWingu"],
[4,915,22,1,9.68,19.32,"Sky","Scroll"],
[5,911,17,5,5.76,8.82,"AzatGo","iFr0zi"],
[6,899,19,3,5.21,12.58,"Huty","F1shyX"],
[7,899,21,1,10.95,19.19,"vic0","Malibuca"],
[8,892,20,2,6.8,14.4,"MrSavage","Velo"],
[9,890,21,2,8.71,17.48,"Zarbeh","F1n4ik"],
[10,864,20,2,9.1,16.8,"SkyJump","Momsy"],
[11,847,20,3,4.95,16.65,"Purchawa","Maciak"],
[12,833,22,5,5.0,17.82,"Trooly","TwitterZynoxFNBR"],
[13,823,21,5,5.19,16.95,"Turtle","Cheapz"],
[14,818,21,2,6.57,17.76,"Cheetiin","JannisZ"],
[15,815,21,3,6.62,19.38,"Akiira","Kurama"],
[16,799,22,3,8.55,24.36,"Darm","demus"],
[17,795,20,3,6.35,17.8,"Kiro","Upl"],
[18,790,22,2,5.86,18.36,"charyy","Kami"],
[19,781,21,1,3.52,15.48,"Klayzz","paceve"],
[20,780,22,2,4.36,18.0,"Lovero nah","nayzix7"],
[21,778,22,4,5.41,20.45,"Shur4","Repairs"],
[22,775,22,1,4.45,17.73,"Glubschi","prax"],
[23,772,22,2,3.59,19.05,"f3kserǃ","Xteryy"],
[24,769,20,1,5.25,17.2,"Cr1nge","Twi"],
[25,766,21,4,4.71,17.48,"Deckzee","frxstyy"],
[26,757,22,1,4.27,18.09,"in the pool","Xaizz Durden 1st"],
[27,755,21,3,4.0,16.95,"xzeevit","Crisbuca"],
[28,753,22,3,7.77,23.59,"Chap","Flickzy"],
[29,752,21,2,3.38,15.19,"morlezǃ","KovaaksXD"],
[30,751,21,3,5.71,18.81,"Pinq","Seyyto"],
[31,749,20,1,3.2,14.9,"lfc simʕᵒᴥᵒʔ","algyz"],
[32,745,22,5,4.55,19.45,"Wox","Vanyak3kk"],
[33,735,21,1,6.29,18.81,"Fastroki","bevvys"],
[34,732,21,0,3.33,17.05,"ozbozǃ","VGN Headhurting"],
[35,731,21,1,3.0,16.0,"exotic","harry.bor.2008"],
[36,729,22,1,8.18,25.77,"IDrop","MariusCOW"],
[37,729,22,1,5.5,20.14,"Prism","Casperinovic"],
[38,729,22,1,5.27,19.14,"Trexer","kiduoo"],
[39,723,21,3,5.1,19.71,"S1neD","G13ras"],
[40,721,22,3,4.14,20.0,"Belusi","Zangi"],
[41,719,19,1,4.11,14.05,"Kielba","PDR Gobawfvǃ"],
[42,718,19,0,3.21,14.11,"Nero","Joshbot"],
[43,717,21,1,6.67,22.14,"Robin","Hyper"],
[44,714,20,2,3.9,15.05,"CTRL ghxstyah","glubfnbr"],
[45,713,20,3,3.75,15.95,"Peakz","Ghaple"],
[46,712,21,2,6.05,20.38,"Hellfire","trippernn"],
[47,707,22,1,5.77,22.41,"Kizers","Ghonzo"],
[48,705,22,1,3.18,19.09,"noia","Tarpz"],
[49,702,22,2,3.41,20.27,"Efexy","Waiz"],
[50,702,22,0,6.45,20.86,"Syaaz","Scaryy"],
[51,698,20,2,5.0,18.1,"Vexi","SnozQ"],
[52,698,20,0,4.0,16.25,"Moneymaker","Fnajen"],
[53,696,22,2,4.64,20.77,"Noahreyli","rezon ay"],
[54,696,22,2,3.59,18.82,"Art1st","Aurora Heror3h"],
[55,692,21,2,3.86,18.29,"arco 10","Wed1"],
[56,684,21,0,3.62,16.29,"Triix","Zyyron"],
[57,683,21,3,2.9,18.33,"YRI Wavy","King Josh75 Ψ"],
[58,682,22,0,2.91,17.27,"thrtysevnn","Klown"],
[59,675,20,1,6.2,19.05,"dandepuzo","Werex"],
[60,674,22,2,4.5,23.09,"lunex 23","Wolvax"],
[61,674,21,2,2.9,18.9,"zidanekrunpaskaa","cehkuyyy"],
[62,674,22,0,4.32,21.59,"Setty","Rax"],
[63,672,20,2,5.85,19.6,"Nebs","Nxthan"],
[64,669,20,3,1.8,15.9,"needstoquitasap","Haste 26"],
[65,668,22,4,4.77,22.41,"Srapt","Julle"],
[66,665,22,3,2.91,20.68,"Wheat","NeFrizi"],
[67,663,21,1,3.1,15.71,"Floki","Clement"],
[68,662,20,0,3.25,15.95,"Asa","PodaSai"],
[69,661,21,1,3.86,17.71,"alcon","noah"],
[70,660,22,2,4.14,21.68,"DRUXYZ FYITB","Sadee32"],
[71,658,22,2,1.91,18.55,"FataL f.saint 10","KNÄCKE 22"],
[72,656,22,2,3.5,20.86,"Chuckxz","Ve1ryy"],
[73,655,19,1,2.68,14.63,"Detect EffyCutie","Szumich."],
[74,654,21,2,2.38,18.05,"AXR Jazki 19ǃ","Eddie"],
[75,652,21,2,4.38,18.1,"snowzy welling","Noobplays"],
[76,652,22,2,4.18,21.36,"Misha","kora 2ǃ"],
[77,652,18,0,3.0,12.89,"anti z","metaalǃ"],
[78,652,22,0,2.64,18.95,"Batman Heath 7","aevion 74"],
[79,651,22,1,5.55,23.77,"Ghost","TaySon"],
[80,650,20,2,2.8,17.1,"Gold","PDR Kenty"],
[81,649,21,1,1.9,17.52,"Maxiking","Doom"],
[82,648,22,2,2.82,19.18,"Kenrop","gw Snaylyx 18"],
[83,647,22,1,2.36,18.32,"AFD MAINY 88","Exqu"],
[84,646,21,2,3.48,18.19,"batman ken 21","KryF"],
[85,646,22,2,3.09,21.09,"black earring","FuryLegendary"],
[86,646,19,0,3.37,14.74,"Minori","Darkos"],
[87,646,21,0,3.05,18.57,"FiTo","Skvii"],
[88,645,21,1,3.71,18.67,"Clapzey","Kjeld 74"],
[89,644,22,4,4.45,26.64,"Japko","panzer"],
[90,644,19,0,2.0,13.05,"KPI 311ǃ","KPI HELLO"],
[91,643,20,1,3.9,18.25,"vistraal 213","Wiiphix"],
[92,641,20,1,2.75,16.5,"WAKXJ 999","SkyL1ght"],
[93,640,22,0,4.32,21.41,"Robban","Axeforce"],
[94,640,19,0,1.47,13.21,"KPI Extresito77","KPI DORAAQG 脳ǃ"],
[95,639,22,1,3.77,19.82,"Twek","mydro"],
[96,639,21,1,2.19,17.57,"coldr","Slxshbuca"],
[97,638,22,0,6.32,22.27,"Kaan","Faded"],
[98,638,20,0,3.4,15.85,"Adn","Mark McClarkey"],
[99,638,20,0,3.0,15.85,"syhx .","stan 1st"],
[100,637,21,1,5.81,19.1,"dinus","FRANEK"],
[101,637,21,1,3.1,18.86,"Pixovsky","SereN"],
[102,636,20,0,3.55,16.8,"k0tyarich","Kyry"],
[103,635,20,1,3.25,17.55,"Auvahalo","ONE callum 10ǃ"],
[104,633,22,3,3.59,22.36,"Eclipse","Kayd"],
[105,633,20,1,3.65,16.3,"L0WK3Y","Aryan Yagami"],
[106,632,19,2,2.95,15.16,"Eyne","Twitter iggyfn6"],
[107,632,22,0,2.41,21.23,"UD hansdhinoǃ","Ceesay My G"],
[108,631,20,3,7.15,27.5,"Shxrk","t3eny"],
[109,631,20,1,3.5,16.0,"nichemοn","øway shixi"],
[110,630,21,2,3.76,22.38,"Cxshy","Firen"],
[111,630,20,0,3.1,17.15,"zeykoo 9","Rz Lwavy 7"],
[112,628,22,0,4.23,21.5,"Shaykoz","Tylio"],
[113,628,22,0,3.59,21.0,"Zucki","Yanni"],
[114,627,19,1,3.42,17.21,"shidubotfvǃ","Isuf"],
[115,627,18,1,2.89,13.56,"R3xxx","Alvin"],
[116,626,19,0,2.79,15.0,"Brindﱞa","icknadaǃ 13"],
[117,625,20,1,2.85,16.9,"Marco","Arc"],
[118,625,21,1,2.81,18.57,"Spexx","Mirooz"],
[119,624,21,0,2.76,17.9,"merfind480","hx neeon 7"],
[120,623,22,1,4.32,20.23,"Cringe","Volko"],
[121,623,21,1,2.38,18.14,"Peshka","Kulb"],
[122,622,22,2,2.95,19.23,"ODIN","Hx cerkam1n善與惡"],
[123,621,21,3,3.67,20.71,"Kyto","Hijoe"],
[124,621,21,1,3.71,19.76,"KANTRI","Juu"],
[125,620,22,0,3.55,21.27,"chrisc","Kaktus"],
[126,620,22,0,2.36,18.23,"Juxzǃ","DETECT JUNEX A28"],
[127,618,22,0,3.27,19.73,"Wka CTJMFTDHǃ","Bidou"],
[128,618,22,0,2.68,19.27,"shyssfv.","Lunar"],
[129,616,21,0,2.43,19.95,"king tozeoftw Ψ","95V Scoezz eyouǃ"],
[130,616,21,0,2.24,18.14,"SaNyaGoD","Kreg 逝"],
[131,615,20,1,2.45,16.95,"Sbari","Aleezy"],
[132,614,21,0,3.33,17.95,"Ziffy 73","Jurdy"],
[133,614,19,0,2.42,14.84,"mxst3rzzz","Veeq"],
[134,613,22,3,3.36,22.91,"Howly","1Lusha"],
[135,613,21,1,3.0,20.33,"Spleez","Anden 10ǃ"],
[136,612,21,0,3.81,18.38,"sout polish 7ǃ","Robcioz8."],
[137,611,21,1,3.1,19.81,"Adrixx","Bambi"],
[138,608,20,2,4.6,19.1,"Callejr 88","Foczka"],
[139,608,22,0,3.32,21.23,"Birk","Zayni"],
[140,608,22,0,2.0,19.0,"slyzzbotǃ","Schmalibuca"],
[141,607,22,1,4.09,21.86,"Sangild","Fredoxie"],
[142,606,21,0,3.29,19.9,"Matez","Kacpi"],
[143,606,21,0,2.14,19.0,"ozn natekǃ","Tw1gzǃ"],
[144,603,22,1,2.59,19.32,"Xantify","Poyo werzzǃ"],
[145,600,21,0,4.19,18.9,"big diegoǃ","Quix"],
[146,599,21,3,3.33,22.33,"Adrx","oozy"],
[147,599,21,1,2.95,19.33,"Ed Bimboǃ","jxshh"],
[148,598,20,0,2.9,18.4,"Litr0L","omexo."],
[149,598,22,0,2.27,20.45,"cloudz2x -ω-","enefy redzVZ -ω-"],
[150,597,21,3,2.38,19.33,"ATL Bugsy","Nstar Cracky"]
];
// Last Chance Qualifier, 50 duos.
// [rank, points, matches, wins, avgElims, avgPlace, player1, player2]
const CARD_M1_LCQ_RAW=[
[1,1082,4,1,6.75,10.0,"Howly","1Lusha"],
[2,1062,3,1,3.33,7.33,"JarKo","Kiire"],
[3,1046,5,1,2.6,21.0,"Gold","Peshka"],
[4,1020,2,1,3.5,8.5,"Moneymaker","Fnajen"],
[5,1000,1,1,8.0,1.0,"Trooly","Ghonzo"],
[6,136,5,0,1.8,15.8,"Kenrop","gw Snaylyx 18"],
[7,134,5,0,3.2,13.0,"Sxdia","Ricbor"],
[8,134,5,0,3.2,14.2,"exotic","fa mafia ツ"],
[9,132,5,0,4.4,17.2,"Vadeal","Vampi"],
[10,118,5,0,3.0,16.4,"Julle","Mirooz"],
[11,116,4,0,1.75,11.5,"trippernn","Fredoxie"],
[12,114,5,0,2.0,16.8,"Blacha","Mikson"],
[13,110,5,0,1.0,15.8,"Polo","LeqüY"],
[14,104,5,0,3.6,16.2,"FiTo","frxstyy"],
[15,104,5,0,2.2,27.4,"fourkayǃ","Mystiqul"],
[16,102,5,0,4.2,17.0,"Wozah","Nova"],
[17,100,5,0,5.0,21.8,"sekayg0d","Ary"],
[18,100,5,0,2.0,16.2,"Asa","PodaSai"],
[19,98,5,0,2.4,16.6,"Artskill","Nociff"],
[20,94,5,0,2.8,24.8,"Wheat","NeFrizi"],
[21,84,5,0,2.4,19.4,"Zarbeh","F1n4ik"],
[22,80,5,0,1.4,20.0,"Vexi","SnozQ"],
[23,76,5,0,3.6,23.4,"Nomzz","Rz Lwavy 7"],
[24,76,5,0,1.6,19.8,"Kombek","Purchawa"],
[25,72,5,0,1.8,29.2,"Setty","Rax"],
[26,70,5,0,1.2,19.8,"Pinq","Seyyto"],
[27,60,5,0,1.6,25.0,"Radas","Maciak"],
[28,58,5,0,1.2,25.0,"f3kserǃ","Xteryy"],
[29,58,5,0,1.0,29.0,"P1ng","Vanyak3kk"],
[30,56,5,0,1.8,30.8,"Zenox","RinzY"],
[31,54,5,0,1.6,24.2,"Auvahalo","Jakebuca"],
[32,54,5,0,1.4,31.2,"best support","хулл"],
[33,54,5,0,0.8,26.2,"Wifi","Borsuk"],
[34,48,4,0,0.75,22.75,"kescary","Lu984"],
[35,44,5,0,1.4,24.6,"Triix","Zyyron"],
[36,40,5,0,1.8,28.8,"9unaxuty 7ǃ","Maku"],
[37,38,5,0,2.2,25.0,"justǃ","xlr8ǃ"],
[38,30,5,0,0.6,26.4,"Kielba","PDR Gobawfvǃ"],
[39,28,5,0,1.0,26.6,"xzy ayanami","Vizu"],
[40,28,5,0,0.8,27.8,"jsn 1st.","Skozr"],
[41,26,5,0,1.6,29.6,"Lovero nah","Izzi"],
[42,20,5,0,0.2,36.4,"ARDI","Ricky"],
[43,18,3,0,1.67,32.33,"Fant","Hlechis"],
[44,16,5,0,0.4,32.4,"LecietwzY","egy vartics 10"],
[45,6,5,0,0.2,37.8,"Turtle","Cheapz"],
[46,0,5,0,1.4,33.0,"Hugoooo2134","Juxzǃ"],
[47,0,5,0,0.6,34.0,"xzeevit","Crisbuca"],
[48,0,5,0,0.6,36.4,"Yummy","Szarik"],
[49,0,5,0,0.4,41.0,"rxb qerz","RxB Justin"],
[50,0,4,0,0.0,41.0,"ZRT 0MECA","sylaǃ"]
];
// Grand Finals, 50 duos.
// [rank, points, matches, wins, avgElims, avgPlace, player1, player2]
const CARD_M1_GF_RAW=[
[1,738,12,2,4.75,6.83,"Sky","Scroll"],
[2,662,12,0,4.17,10.0,"Tjino","PabloWingu"],
[3,528,12,0,4.25,14.17,"vic0","Malibuca"],
[4,499,12,1,4.33,16.58,"Focus","Th0masHD"],
[5,460,12,2,4.33,23.42,"Shxrk","t3eny"],
[6,441,12,1,2.83,17.25,"Shur4","Repairs"],
[7,430,12,0,4.0,19.33,"Darm","demus"],
[8,412,12,0,2.25,16.17,"Cr1nge","Twi"],
[9,396,12,0,3.25,18.92,"Syaaz","Scaryy"],
[10,380,12,0,2.08,18.75,"Japko","panzer"],
[11,369,12,1,2.67,26.42,"Nebs","Nxthan"],
[12,359,12,1,2.5,17.25,"Cringe","Volko"],
[13,359,12,1,2.42,19.33,"IDrop","MariusCOW"],
[14,322,12,0,1.58,17.67,"charyy","Kami"],
[15,322,12,0,1.33,16.83,"Cheetiin","JannisZ"],
[16,317,12,1,2.33,28.67,"SwizzY","Pixie"],
[17,315,12,1,2.5,20.92,"Chap","Flickzy"],
[18,310,12,0,2.5,20.25,"Noahreyli","rezon ay"],
[19,304,12,0,1.67,18.42,"dandepuzo","Werex"],
[20,284,12,0,1.67,23.42,"Minori","Darkos"],
[21,262,12,0,2.17,25.75,"SkyJump","Momsy"],
[22,254,12,0,1.83,22.83,"Nero","Joshbot"],
[23,244,12,0,2.42,26.42,"Glubschi","prax"],
[24,240,12,0,2.33,26.92,"AzatGo","iFr0zi"],
[25,222,12,0,1.33,21.83,"dinus","FRANEK"],
[26,218,12,0,1.75,28.75,"Howly","1Lusha"],
[27,216,12,0,1.25,23.33,"Shaykoz","Tylio"],
[28,214,12,0,2.0,26.92,"Belusi","Zangi"],
[29,198,12,0,1.33,26.42,"Kyto","Hijoe"],
[30,195,12,1,1.67,31.17,"Huty","F1shyX"],
[31,182,12,0,1.75,23.42,"k0tyarich","Kyry"],
[32,182,12,0,1.5,29.42,"Pixovsky","SereN"],
[33,170,12,0,1.42,31.0,"lunex 23","Wolvax"],
[34,166,12,0,1.67,35.08,"Trooly","Ghonzo"],
[35,158,12,0,1.33,28.42,"JarKo","Kiire"],
[36,156,12,0,1.83,29.33,"Moneymaker","Fnajen"],
[37,152,12,0,1.25,30.5,"Gold","Peshka"],
[38,150,12,0,1.25,32.17,"Birk","Zayni"],
[39,142,12,0,1.42,29.5,"Akiira","Kurama"],
[40,130,12,0,0.75,32.5,"KANTRI","Juu"],
[41,114,12,0,0.75,29.42,"Ziffy 73","Jurdy"],
[42,112,12,0,0.92,32.33,"CTRL ghxstyah","glubfnbr"],
[43,106,12,0,0.75,32.5,"f3kserǃ","Xteryy"],
[44,104,12,0,0.42,31.17,"in the pool","Xaizz Durden 1st"],
[45,94,12,0,1.08,37.75,"Kaan","Faded"],
[46,78,11,0,0.45,30.45,"slyzzbotǃ","Schmalibuca"],
[47,56,12,0,0.67,33.08,"R3xxx","Alvin"],
[48,46,12,0,0.42,41.17,"xzeevit","Crisbuca"],
[49,32,12,0,0.58,37.25,"Twek","mydro"],
[50,28,12,0,0.33,36.0,"Brindﱞa","icknadaǃ 13"]
];
const M1_NAT_LIQUI={"Focus": "il", "Th0masHD": "dk", "SwizzY": "ru", "Pixie": "se", "Tjino": "dk", "PabloWingu": "dk", "Sky": "dk", "Scroll": "dk", "AzatGo": "ru", "iFr0zi": "ru", "Huty": "cz", "F1shyX": "cz", "vic0": "at", "Malibuca": "ru", "Zarbeh": "se", "F1n4ik": "ua", "SkyJump": "fr", "Momsy": "fr", "Purchawa": "pl", "Maciak": "pl", "Trooly": "se", "Turtle": "de", "Cheapz": "de", "JannisZ": "de", "Akiira": "fr", "Kurama": "fr", "Darm": "pl", "demus": "pl", "charyy": "pl", "Kami": "pl", "Lovero nah": "ch", "Shur4": "by", "Repairs": "fi", "Glubschi": "de", "prax": "de", "f3kserǃ": "ua", "Cr1nge": "gb-sct", "Twi": "gb", "frxstyy": "gb", "Xaizz Durden 1st": "es", "xzeevit": "es", "Chap": "ch", "Flickzy": "de", "Pinq": "gb", "Seyyto": "fr", "Vanyak3kk": "ua", "IDrop": "no", "MariusCOW": "dk", "Belusi": "it", "Zangi": "it", "Kielba": "pl", "Nero": "gb", "Joshbot": "gb", "trippernn": "dk", "Ghonzo": "no", "Syaaz": "es", "Vexi": "pl", "SnozQ": "pl", "Moneymaker": "se", "Fnajen": "se", "Noahreyli": "ch", "rezon ay": "de", "Triix": "fr", "Zyyron": "fr", "dandepuzo": "ru", "Werex": "fr", "lunex 23": "dk", "Wolvax": "se", "Setty": "pl", "Rax": "it", "Nebs": "gb", "Nxthan": "gb", "Julle": "fi", "Wheat": "ru", "NeFrizi": "ru", "Asa": "at", "PodaSai": "fr", "Kenrop": "fr", "gw Snaylyx 18": "fr", "Minori": "ch", "Darkos": "fr", "FiTo": "rs", "Japko": "pl", "panzer": "ru", "Twek": "nl", "mydro": "nl", "Kaan": "de", "Faded": "ro", "dinus": "pl", "FRANEK": "pl", "Pixovsky": "pl", "SereN": "pl", "k0tyarich": "ua", "Kyry": "it", "Auvahalo": "dk", "Shxrk": "ro", "t3eny": "si", "Rz Lwavy 7": "fr", "Shaykoz": "fr", "Tylio": "fr", "R3xxx": "is", "Alvin": "pl", "Mirooz": "fi", "Cringe": "ch", "Volko": "de", "Peshka": "ru", "Kyto": "de", "Hijoe": "de", "KANTRI": "ua", "Juu": "de", "Juxzǃ": "se", "Ziffy 73": "nl", "Jurdy": "nl", "Howly": "ru", "1Lusha": "ru", "Birk": "dk", "Zayni": "dk", "Fredoxie": "dk", "JarKo": "es", "Kiire": "es", "Sxdia": "it", "Ricbor": "it", "Vadeal": "de", "Vampi": "de", "Blacha": "pl", "Mikson": "pl", "LeqüY": "es", "Mystiqul": "fr", "Wozah": "se", "Nova": "nl", "Ary": "gb", "Artskill": "fr", "Nociff": "fr", "Nomzz": "de", "Kombek": "pl", "Radas": "pl", "P1ng": "ua", "Zenox": "il", "RinzY": "il", "Jakebuca": "gb-sct", "best suppоrt": "ru", "Wifi": "pl", "Borsuk": "pl", "kescary": "it", "Lu984": "it", "Maku": "de", "Vizu": "de", "jsn 1st.": "gb", "Skozr": "gb", "Izzi": "fr", "ARDI": "it", "Ricky": "it", "Fant": "ua", "Hlechis": "ru", "egy vartics 10": "de", "Yummy": "pl", "Szarik": "pl", "rxb qerz": "de", "RxB Justin": "de", "sylaǃ": "fr", "PDR Gobawfvǃ": "pl", "sekayg0d": "pl", "9unaxuty 7ǃ": "de", "LecietwzY": "de", "Xteryy": "lv", "Schmalibuca": "de", "Scaryy": "es", "CTRL ghxstyah": "gb", "glubfnbr": "gb", "slyzzbotǃ": "at"};
const M1_NAT_TRN={"Focus": "il", "Th0masHD": "il", "SwizzY": "ru", "Pixie": "ru", "Tjino": "dk", "PabloWingu": "dk", "Sky": "dk", "Scroll": "dk", "AzatGo": "ru", "iFr0zi": "ru", "Huty": "cz", "F1shyX": "cz", "vic0": "ru", "Malibuca": "ru", "MrSavage": "be", "Velo": "be", "Zarbeh": "se", "F1n4ik": "se", "SkyJump": "fr", "Momsy": "fr", "Purchawa": "pl", "Maciak": "pl", "Trooly": "se", "TwitterZynoxFNBR": "se", "Turtle": "de", "Cheapz": "de", "Cheetiin": "de", "JannisZ": "de", "Akiira": "fr", "Kurama": "fr", "Darm": "pl", "demus": "pl", "Kiro": "nl", "Upl": "nl", "charyy": "pl", "Kami": "pl", "Klayzz": "es", "paceve": "es", "Lovero nah": "ro", "nayzix7": "ro", "Shur4": "fi", "Repairs": "fi", "Glubschi": "de", "prax": "de", "f3kserǃ": "it", "Xteryy": "it", "Cr1nge": "gb", "Twi": "gb", "Deckzee": "dk", "frxstyy": "dk", "in the pооl": "es", "Xaizz Durden 1st": "es", "xzeevit": "nl", "Crisbuca": "nl", "Chap": "ch", "Flickzy": "ch", "morlezǃ": "es", "KovaaksXD": "es", "Pinq": "fr", "Seyyto": "fr", "lfc simʕᵒᴥᵒʔ": "pl", "algyz": "pl", "Wox": "se", "Vanyak3kk": "se", "Fastroki": "de", "bevvys": "de", "ozbozǃ": "gb", "VGN Headhurting": "gb", "exotic": "il", "harry.bor.2008": "il", "IDrop": "kr", "MariusCOW": "kr", "Prism": "gb", "Casperinovic": "gb", "Trexer": "de", "kiduoo": "de", "S1neD": "ua", "G13ras": "ua", "Belusi": "it", "Zangi": "it", "Kielba": "pl", "PDR Gobawfvǃ": "pl", "Nero": "gb", "Joshbot": "gb", "Robin": "de", "Hyper": "de", "CTRL ghxstyah": "gb", "glubfnbr": "gb", "Peakz": "se", "Ghaple": "se", "Hellfire": "dk", "trippernn": "dk", "Kizers": "pl", "Ghonzo": "pl", "noia": "fr", "Tarpz": "fr", "Efexy": "se", "Waiz": "se", "Syaaz": "es", "Scaryy": "es", "Vexi": "pl", "SnozQ": "pl", "Moneymaker": "se", "Fnajen": "se", "Noahreyli": "kr", "rezon ay": "kr", "Art1st": "ru", "Aurora Heror3h": "ru", "arco 10": "ua", "Wed1": "ua", "Triix": "fr", "Zyyron": "fr", "YRI Wavy": "se", "King Josh75 Ψ": "se", "thrtysevnn": "ro", "Klown": "ro", "dandepuzo": "ru", "Werex": "ru", "lunex 23": "dk", "Wolvax": "dk", "zidanekrunpaskaa": "fi", "cehkuyyy": "fi", "Setty": "it", "Rax": "it", "Nebs": "gb", "Nxthan": "gb", "needstoquitasap": "lt", "Haste 26": "lt", "Srapt": "dk", "Julle": "dk", "Wheat": "ru", "NeFrizi": "ru", "Floki": "fr", "Clement": "fr", "Asa": "at", "PodaSai": "at", "alcon": "se", "noah": "se", "DRUXYZ FYITB": "se", "Sadee32": "se", "FataL f.saint 10": "de", "KNÄCKE 22": "de", "Chuckxz": "lv", "Ve1ryy": "lv", "Detect EffyCutie": "pl", "Szumich.": "pl", "AXR Jazki 19ǃ": "se", "Eddie": "se", "snowzy welling": "at", "Noobplays": "at", "Misha": "fr", "kora 2ǃ": "fr", "аnti z": "nl", "metaalǃ": "nl", "Batman Heath 7": "gb", "aevion 74": "gb", "Ghost": "gr", "TaySon": "gr", "Gold": "ru", "PDR Kenty": "ru", "Maxiking": "gr", "Doom": "gr", "Kenrop": "fr", "gw Snaylyx 18": "fr", "AFD MAINY 88": "de", "Exqu": "de", "batman ken 21": "de", "KrуF": "de", "black earring": "by", "FuryLegendary": "by", "Minori": "ch", "Darkos": "ch", "FiTo": "rs", "Skvii": "rs", "Clapzey": "dk", "Kjeld 74": "dk", "Japko": "rs", "panzer": "rs", "KPI 311ǃ": "es", "KPI HELLO": "es", "vistraal 213": "dz", "Wiiphix": "dz", "WAKXJ 999": "cz", "SkyL1ght": "cz", "Robban": "se", "Axeforce": "se", "KPI Extresito77": "es", "KPI DORAAQG 脳ǃ": "es", "Twek": "nl", "mydro": "nl", "coldr": "nl", "Slxshbuca": "nl", "Kaan": "ro", "Faded": "ro", "Adn": "no", "Mark McClarkey": "no", "syhx .": "no", "stan 1st": "no", "dinus": "pl", "FRANEK": "pl", "Pixovsky": "pl", "SereN": "pl", "k0tyarich": "ua", "Kyry": "ua", "Auvahalo": "dk", "ONE callum 10ǃ": "dk", "Eclipse": "gb", "Kayd": "gb", "L0WK3Y": "gb", "Aryan Yagami": "gb", "Eyne": "de", "Twitter iggyfn6": "de", "UD hansdhinoǃ": "se", "Ceesay My G": "se", "Shxrk": "ro", "t3eny": "ro", "nichemοn": "no", "øway shixi": "no", "Cxshy": "pl", "Firen": "pl", "zeykoo 9": "fr", "Rz Lwavy 7": "fr", "Shaykoz": "fr", "Tylio": "fr", "Zucki": "de", "Yanni": "de", "shidubotfvǃ": "de", "Isuf": "de", "R3xxx": "pl", "Alvin": "pl", "Brindﱞa": "ee", "icknadaǃ 13": "ee", "Marco": "fi", "Arc": "fi", "Spexx": "gb", "Mirooz": "gb", "merfind480": "rs", "hx neeon 7": "rs", "Cringe": "de", "Volko": "de", "Peshka": "ua", "Kulb": "ua", "ODIN": "ru", "Hx cerkam1n善與惡": "ru", "Kyto": "de", "Hijoe": "de", "KANTRI": "ua", "Juu": "ua", "chrisc": "dk", "Kaktus": "dk", "Juxzǃ": "se", "DETECT JUNEX A28": "se", "Wka CTJMFTDHǃ": "fr", "Bidou": "fr", "shyssfv.": "gr", "Lunar": "gr", "king tozeoftw Ψ": "es", "95V Scoezz eyouǃ": "es", "SaNyaGoD": "ru", "Kreg 逝": "ru", "Sbari": "it", "Aleezy": "it", "Ziffy 73": "nl", "Jurdy": "nl", "mxst3rzzz": "pl", "Veeq": "pl", "Howly": "ru", "1Lusha": "ru", "Spleez": "dk", "Anden 10ǃ": "dk", "sout polish 7ǃ": "pl", "Robcioz8.": "pl", "Adrixx": "pl", "Bambi": "pl", "Callejr 88": "se", "Foczka": "se", "Birk": "dk", "Zayni": "dk", "slyzzbotǃ": "at", "Schmalibuca": "at", "Sangild": "dk", "Fredoxie": "dk", "Mаtez": "pl", "Kacpi": "pl", "ozn natekǃ": "pl", "Tw1gzǃ": "pl", "Xantify": "nl", "Poyo werzzǃ": "nl", "big diegoǃ": "ch", "Quix": "ch", "Adrx": "es", "oozy": "es", "Ed Bimboǃ": "it", "jxshh": "it", "Litr0L": "dk", "omexo.": "dk", "cloudz2x -ω-": "de", "enefy redzVZ -ω-": "de", "ATL Bugsy": "dk", "Nstar Cracky": "dk", "JarKo": "es", "Kiire": "es", "Sxdia": "it", "Ricbor": "it", "fa mafia ツ": "il", "Vadeal": "de", "Vampi": "de", "Blacha": "pl", "Mikson": "pl", "Polo": "es", "LeqüY": "es", "fourkayǃ": "gb", "Mystiqul": "gb", "Wozah": "se", "Nova": "se", "sekayg0d": "pl", "Ary": "pl", "Artskill": "fr", "Nociff": "fr", "Nomzz": "fr", "Kombek": "pl", "Radas": "pl", "P1ng": "ua", "Zenox": "il", "RinzY": "il", "Jakebuca": "dk", "best suppоrt": "lv", "хулл": "lv", "Wifi": "pl", "Borsuk": "pl", "kescary": "it", "Lu984": "it", "9unaxuty 7ǃ": "de", "Maku": "de", "juѕtǃ": "it", "хlr8ǃ": "it", "xzy ayanami": "de", "Vizu": "de", "jsn 1st.": "gb", "Skozr": "gb", "Izzi": "ro", "ARDI": "it", "Ricky": "it", "Fant": "pl", "Hlechis": "pl", "LecietwzY": "de", "egy vartics 10": "de", "Hugoooo2134": "se", "Yummy": "pl", "Szarik": "pl", "rxb qerz": "de", "RxB Justin": "de", "ZRT 0MECA": "fr", "sylaǃ": "fr"};
const M1_ORG={"Focus": "Virtus Pro", "Th0masHD": "Virtus Pro", "SwizzY": "Team HavoK", "Pixie": "Team HavoK", "Tjino": "Team HavoK", "PabloWingu": "Team HavoK", "Sky": "All Gamers", "Scroll": "All Gamers", "iFr0zi": "MGA Esport", "Huty": "Pandore eSport", "vic0": "BIG", "Malibuca": "BIG", "MrSavage": "XSET", "Velo": "XP42", "Zarbeh": "Vulcan Esport", "F1n4ik": "FLC", "SkyJump": "SOLARY", "Momsy": "Lyost Esport", "Purchawa": "Aevion Gaming", "Maciak": "Team Quax", "JannisZ": "CGN Esports", "Akiira": "Gentle Mates", "Kurama": "Gentle Mates", "Darm": "T1", "demus": "T1", "Upl": "Knights of Shadows", "charyy": "ROC Esports", "Kami": "ROC Esports", "Klayzz": "NOW eSport", "paceve": "ATC Esports", "nayzix7": "EKINOX", "Shur4": "Knights of Shadows", "Glubschi": "X6 Esport", "prax": "X6 Esport", "f3kserǃ": "FLC", "Xteryy": "Flawless Region", "Cr1nge": "XP42", "Twi": "XP42", "Deckzee": "XP42", "frxstyy": "XP42", "xzeevit": "Lynox Esport", "Crisbuca": "XP42", "Chap": "GodLike Esports", "Flickzy": "GodLike Esports", "Seyyto": "Team Orchid", "algyz": "Knights of Shadows", "Wox": "Team HavoK", "Vanyak3kk": "Gentle Mates", "Fastroki": "FOKUS", "exotic": "EGY Esports", "IDrop": "Team HavoK", "MariusCOW": "Gentle Mates", "Prism": "XP42", "Trexer": "Detect Esports", "S1neD": "EOZ eSport", "G13ras": "Detect Esports", "Belusi": "Aspect Esports", "Zangi": "SOLARY", "Kielba": "WIP Esports", "Nero": "Knights of Shadows", "Joshbot": "The ONE", "Robin": "FOKUS", "Hyper": "OneProdige", "glubfnbr": "OneProdige", "Peakz": "OneProdige", "Ghaple": "The ONE", "Kizers": "FataL", "Ghonzo": "SOLARY", "noia": "NTO Corp", "Tarpz": "Vulcan Esport", "Syaaz": "MGA Esport", "Vexi": "Aevion Gaming", "SnozQ": "Poyo Esports", "Moneymaker": "XP42", "Fnajen": "Orphée Esport", "Wed1": "BLINDSPOT", "thrtysevnn": "Knights of Shadows", "dandepuzo": "Avery E-sports", "Werex": "Lyost Esport", "Wolvax": "EGY Esports", "Julle": "OneProdige", "Wheat": "Aspect Esports", "NeFrizi": "Flawless Region", "Asa": "K13 Esport", "alcon": "The ONE", "noah": "The ONE", "Chuckxz": "FataL", "Ve1ryy": "WIP Esports", "Eddie": "Ascend eSports", "Noobplays": "Evolution Esports", "Misha": "EKINOX", "Gold": "Monto Esports", "Doom": "BLINDSPOT", "Kenrop": "R4C", "Exqu": "Ascend eSports", "Minori": "SOLARY", "Darkos": "SOLARY", "FiTo": "XP42", "Clapzey": "Team Atlantic", "Japko": "Geekay Esports", "panzer": "Geekay Esports", "SkyL1ght": "Ascend eSports", "Twek": "Lyost Esport", "mydro": "Lyost Esport", "coldr": "OneProdige", "Kaan": "S8UL", "Faded": "S8UL", "dinus": "Team Quax", "SereN": "SOLARY", "k0tyarich": "Evolution Esports", "Eyne": "ZENN eSports", "Shxrk": "Aurora Gaming", "t3eny": "Aurora Gaming", "Firen": "K13 Esport", "Tylio": "GameWard", "Zucki": "ZENN eSports", "Yanni": "ZENN eSports", "Isuf": "Aevion Gaming", "R3xxx": "Wooka Esport", "Alvin": "Flawless Region", "Marco": "Northern Star Gaming", "Mirooz": "EKINOX", "Cringe": "7VEN CLUB", "Volko": "Northern Star Gaming", "Kyto": "The ONE", "Hijoe": "Detect Esports", "KANTRI": "FataL", "Juu": "FOKUS", "chrisc": "NOW eSport", "Kaktus": "BLINDSPOT", "Juxzǃ": "OneProdige", "Bidou": "K13 Esport", "SaNyaGoD": "Ascend eSports", "Sbari": "Knights of Shadows", "Aleezy": "Knights of Shadows", "Spleez": "The ONE", "Bambi": "Flawless Region", "Foczka": "R4C", "slyzzbotǃ": "Averiour Gaming", "Mаtez": "Wooka Esport", "Kacpi": "2R Esport", "Xantify": "Lyost Esport", "Quix": "ZENN eSports", "Adrx": "EGY Esports", "oozy": "ZENN eSports", "jxshh": "Detect Esports", "Sxdia": "Knights of Shadows", "Polo": "ATC Esports", "Mystiqul": "EOZ eSport", "Wozah": "Team Natrix", "Nova": "FLC", "Nociff": "Team Orchid", "Nomzz": "Averiour Gaming", "Kombek": "GameWard", "Radas": "Red Triad Esport", "Zenox": "LAVIE Esports", "RinzY": "LAVIE Esports", "Wifi": "FLC", "Borsuk": "Lyost Esport", "Maku": "SOLARY", "Vizu": "Avery E-sports", "Skozr": "Flawless Region", "Izzi": "Team Orchid", "Ricky": "Twentystars", "Hlechis": "EGY Esports", "Yummy": "Team Quax", "Szarik": "Wooka Esport"};
// Country names by ISO code — shared by every card set.
const CC_RU={"de": "Германия", "pl": "Польша", "dk": "Дания", "fr": "Франция", "se": "Швеция", "it": "Италия", "ru": "Россия", "kr": "Южная Корея", "ua": "Украина", "es": "Испания", "gb": "Великобритания", "nl": "Нидерланды", "gb-eng": "Англия", "no": "Норвегия", "by": "Беларусь", "be": "Бельгия", "lv": "Латвия", "gb-wls": "Уэльс", "us": "США", "ch": "Швейцария", "ng": "Нигерия", "mx": "Мексика", "ar": "Аргентина", "tr": "Турция", "br": "Бразилия", "gb-sct": "Шотландия", "cz": "Чехия", "jp": "Япония", "sa": "Саудовская Аравия", "ca": "Канада", "is": "Исландия", "au": "Австралия", "ie": "Ирландия", "pt": "Португалия", "nz": "Новая Зеландия", "co": "Колумбия"};
const CC_EN={"de": "Germany", "pl": "Poland", "dk": "Denmark", "fr": "France", "se": "Sweden", "it": "Italy", "ru": "Russia", "kr": "South Korea", "ua": "Ukraine", "es": "Spain", "gb": "United Kingdom", "nl": "Netherlands", "gb-eng": "England", "no": "Norway", "by": "Belarus", "be": "Belgium", "lv": "Latvia", "gb-wls": "Wales", "us": "United States", "ch": "Switzerland", "ng": "Nigeria", "mx": "Mexico", "ar": "Argentina", "tr": "Turkey", "br": "Brazil", "gb-sct": "Scotland", "cz": "Czech Republic", "jp": "Japan", "sa": "Saudi Arabia", "ca": "Canada", "is": "Iceland", "au": "Australia", "ie": "Ireland", "pt": "Portugal", "nz": "New Zealand", "co": "Colombia"};

// Countries that only appear in the Major 2 European field — their names went
// out with the old Osirion-era block and have to come back before the cards
// are built.
// Percentile of a value inside a sorted array, 0..1 — used by every card set's
// attribute builder.
function pctOf(sortedArr, v){
  let lo=0, hi=sortedArr.length;
  while(lo<hi){ const mid=(lo+hi)>>1; if(sortedArr[mid]<v) lo=mid+1; else hi=mid; }
  return sortedArr.length>1 ? lo/(sortedArr.length-1) : 0.5;
}

const CC_RU_EXTRA_M2={"at":"Австрия","fi":"Финляндия","gr":"Греция","hr":"Хорватия","hu":"Венгрия",
  "il":"Израиль","mk":"Северная Македония","ro":"Румыния","rs":"Сербия","si":"Словения",
  "ba":"Босния и Герцеговина","ee":"Эстония","md":"Молдова"};
const CC_EN_EXTRA_M2={"at":"Austria","fi":"Finland","gr":"Greece","hr":"Croatia","hu":"Hungary",
  "il":"Israel","mk":"North Macedonia","ro":"Romania","rs":"Serbia","si":"Slovenia",
  "ba":"Bosnia and Herzegovina","ee":"Estonia","md":"Moldova"};
Object.assign(CC_RU, CC_RU_EXTRA_M2);
Object.assign(CC_EN, CC_EN_EXTRA_M2);
Object.keys(CC_RU).forEach(code=>{ FLAG_CODE[CC_RU[code]]=code; });

const CC_RU_EXTRA2={'dz':'Алжир','lt':'Литва'};
const CC_EN_EXTRA2={'dz':'Algeria','lt':'Lithuania'};

Object.assign(CC_RU, CC_RU_EXTRA2);
Object.assign(CC_EN, CC_EN_EXTRA2);
Object.keys(CC_RU).forEach(code=>{ FLAG_CODE[CC_RU[code]]=code; });

// ---------- Card set: FNCS 2025 Major 1 (all seven regions, trios) ----------
// Event S33_FNCSMajor1. Generated by tools/build-2025-rows.js straight from
// Epic's own leaderboard payload -- do not hand-edit, regenerate instead.
// [rank, points, matches, wins, avgElims, avgPlace, elimPoints, p1, p2, p3]
// elimPoints is the measured elimination half of the score, so the endgame
// share is read rather than inferred.
/* ---- FNCS 2024, дуо, шесть регионов (NA West в 2024-м не было) ---------------
   Отзыв: «добавь 2024 год и рейтинги карточек этого года».
   Снято с Tracker 21 сентября 2026 (tools/measured/tracker-2024-majors.json +
   -gf-days.json): последний раунд Open Qualifier 2 (до 250 дуо), оба полуфинала
   (раунд 3, верхняя сетка первой) и двухдневный финал. Собрано
   tools/build-2024-rows.js в ту же форму, что и 2025-й. */
// ==== FNCS 2019 rows (tools/splice-2019.js) ====
// Generated by tools/build-2019-rows.js — World Cup and FNCS 2019, seven regions, from tools/measured/.
const CARD_H1EU_Q_RAW=[
[1,56,10,0,2.6,31.1,52,"Th0masHD"],
[2,56,9,2,2.11,35.44,38,"kieb0ard"],
[3,56,9,1,1.89,30.11,34,"Mexe"],
[4,56,10,2,1.6,30.7,32,"Tschinken"],
[5,56,10,1,1.9,33.6,38,"Imsdalo"],
[6,56,10,1,2.4,31.1,48,"AstroSMZ"],
[7,56,9,1,1.89,30.33,34,"McDaBeast1"],
[8,55,9,0,2.89,31.67,52,"Skrib OG"],
[9,55,10,0,2.3,33.3,46,"VCTRY cen"],
[10,55,10,2,1.7,34,34,"K1nfetti"],
[11,55,9,1,2,24.89,36,"snoda"],
[12,55,10,0,2.4,43.6,48,"atheist avenger"],
[13,55,9,0,2.78,26.89,50,"Tobi マ"],
[14,55,10,1,2.5,31.1,50,"smfdb Mayhem"],
[15,55,10,1,2,30.1,40,"Sir Liam Richard"],
[16,55,9,1,2.22,21.78,40,"mellibuca"],
[17,55,10,1,2.7,30.5,54,"oldyz ."],
[18,54,9,2,1.44,27.11,26,"MOTOR"],
[19,54,10,1,3.4,45.2,68,"Magin"],
[20,54,9,0,2,23,36,"Tohaj"],
[21,54,10,0,2.2,38.9,44,"Chapix"],
[22,54,10,0,1.9,31.2,38,"hqwkers"],
[23,54,10,0,2.5,41.4,50,"YoungCza"],
[24,54,10,0,2.7,33.2,54,"Verox"],
[25,54,9,1,2.44,32,44,"Boyer"],
[26,54,10,1,3.1,36.1,62,"wolfiez"],
[27,54,9,0,3,34.22,54,"HICHAM LE BOM"],
[28,54,10,2,2.2,41.8,44,"Heatzy"],
[29,54,10,1,2.3,33.3,46,"Jzck."],
[30,54,9,0,2.56,23.67,46,"pennzor"],
[31,54,10,1,3.4,40.9,68,"Lowless"],
[32,54,10,1,2.4,33,48,"xKumu"],
[33,54,10,0,2.2,38.5,44,"Rojo"],
[34,54,10,0,2,29.7,40,"Pranayama."],
[35,53,10,1,2.6,36.2,52,"Naranj1t0"],
[36,53,10,1,2.1,35.4,42,"Belvid."],
[37,53,9,0,3.44,29.56,62,"miroslav ilić"],
[38,53,9,0,2.11,24.22,38,"DaaV1996"],
[39,53,10,1,1.2,30.6,24,"wasJAG"],
[40,53,9,1,1.67,22,30,"Pepe 文"],
[41,53,9,1,2.22,29.78,40,"Andilex"],
[42,53,10,2,2.6,40,52,"screw1x"],
[43,53,10,2,2.2,36.5,44,"взломанны"],
[44,53,8,2,1.88,24.5,30,"Sorfosmo"],
[45,53,10,2,1.8,29.1,36,"qvycfv"],
[46,53,8,1,1.88,19.88,30,"M10 Pepper"],
[47,53,10,0,2.5,31.9,50,"veteranک"],
[48,52,9,2,1.89,36.22,34,"SvendProت"],
[49,52,8,1,3,20.63,48,"6633X"],
[50,52,10,1,1.9,34.9,38,"Misery"],
[51,52,9,1,1.22,25.11,22,"zodieu yt"],
[52,52,8,1,3.13,23.88,50,"Crusti "],
[53,52,10,0,3.5,46.1,70,],
[54,52,10,3,1.1,28.4,22,"ɴᴏ ɴᴀᴍᴇᴇ"],
[55,52,10,1,2,40,40,"BEAST"],
[56,52,9,0,3.11,36.22,56,"F R E Q."],
[57,52,10,1,1.7,37.9,34,"Osmo"],
[58,52,10,2,2.7,41.4,54,"Toose"],
[59,52,9,1,2.56,31.22,46,"jetpacksGG"],
[60,52,10,1,1.5,30.7,30,"Corbs-_-"]
];
const CARD_H1EU_S_RAW=[
[1,87,10,2,4.7,32.3,141,"Letshe"],
[2,74,9,0,4.33,27.33,117,"Stompy"],
[3,72,9,2,3.11,29.33,84,"OG Prisi0n3r0"],
[4,71,9,2,3.11,23.33,84,"Aqua"],
[5,70,10,2,3.3,35.9,99,"Endretta"],
[6,69,8,1,4.38,16.13,105,"Crue"],
[7,69,9,0,4.22,28,114,"OG luKi3"],
[8,68,10,0,3.8,32.4,114,"Benjyfishy"],
[9,68,10,2,2.2,28.3,66,"LeftEye71"],
[10,67,10,1,3.1,29,93,"BELAEU"],
[11,67,9,2,2.22,20.78,60,"pacific fledi"],
[12,67,10,1,3,34.8,90,"JarkoS ."],
[13,67,9,1,3.33,33.78,90,"Skite"],
[14,66,10,0,3.9,40.5,117,"Letw1k3"],
[15,66,9,1,3.56,25.56,96,"Klusiabtw"],
[16,66,8,1,4,22.5,96,"wkey LYGHT"],
[17,65,10,1,3.5,44.8,105,"鬼 Issa"],
[18,65,9,2,3.33,30.78,90,"MrSavage"],
[19,65,10,1,3.5,38.3,105,"marteen 027"],
[20,64,10,2,2.4,29.8,72,"Snayzy"],
[21,64,10,1,3.6,37.4,108,"Lindstrom3"],
[22,63,10,1,3.2,30.2,96,"Mongraal"],
[23,63,9,1,3.11,24.11,84,"BlastR"],
[24,63,10,2,2.5,36.4,75,"antwon 67"],
[25,63,8,1,4.13,23.63,99,"Erouce"],
[26,62,10,0,3.5,35.9,105,"Wakie "],
[27,62,10,3,1.3,26.6,39,"CORE Ѱ"],
[28,62,10,0,2.8,36.9,84,"Εmqu"],
[29,61,9,2,3.33,31.89,90,"Nayte"],
[30,61,10,0,2.7,30.8,81,"DiegoGB ツ"],
[31,61,10,1,2.7,33.6,81,"Maxoûwû"],
[32,61,9,2,2.89,28,78,"teeq"],
[33,61,10,1,2.4,31.7,72,"abusivestepdad."],
[34,60,9,0,2.33,22.78,63,"lolb0om"],
[35,60,10,1,3.3,40.4,99,"Pr0vokd ."],
[36,59,9,0,2.44,24.11,66,"Domentos"],
[37,59,7,0,4,16.57,84,"Kinstaar Aim.exe"],
[38,59,10,1,2.9,39.5,87,"Robabz."],
[39,59,10,1,2.7,41.8,81,"Skailereu"],
[40,58,10,2,2.8,37.8,84,"drģ."],
[41,58,10,1,2.4,28.4,72,"VGIA Khisanth"],
[42,58,9,1,2.33,25.44,63,"Samzahef"],
[43,58,9,1,2.78,28.22,75,"BadSniper"],
[44,58,9,0,3.44,29.89,93,"K1nzell"],
[45,58,10,0,2.5,32,75,"bead"],
[46,58,10,1,2,30.6,60,"Mitr0"],
[47,58,10,2,2.3,32.9,69,"Cհrono"],
[48,58,10,0,2.4,30.3,72,"Τeekzie"],
[49,58,10,0,2.4,36.2,72,"fwe"],
[50,58,10,1,2.6,36.5,78,"Saevid"],
[51,58,10,0,2.8,33.9,84,"Eгm00n"],
[52,57,9,0,2.44,23.11,66,"lol lmao rofling"],
[53,57,10,2,2.1,35.4,63,"HCavill"],
[54,57,8,0,2.88,13,69,"JrgeQ"],
[55,57,10,0,2.5,28.9,75,"nate -iwnl-"],
[56,57,9,1,1.89,22.56,51,"Shdw Bear"],
[57,57,8,3,1.75,23.75,42,"Elias M20"],
[58,56,10,0,2.9,32,87,"faze_20packngts"],
[59,56,9,0,2.33,27.11,63,"yconelsiete"],
[60,56,9,3,0.67,25.44,18,"XeMarlek"]
];
const CARD_H1EU_GF_RAW=[
[1,115,6,0,1,6.7,18,"crue"],
[2,113,6,0,1,7.15,18,"Skite"],
[3,112,6,0,1,7.6,18,"nayte"],
[4,108,6,0,1,9.4,18,"Tchub"],
[5,107,6,0,1,9.85,18,"Mongraal"],
[6,106,6,0,1,10.3,18,"Stompy"],
[7,102,6,0,1,11.65,18,"BELAEU"],
[8,98,6,0,1,13.45,18,"Domentos"],
[9,97,6,0,1,13.9,18,"Skailer"],
[10,95,6,0,1,14.8,18,"Endretta"],
[11,94,6,0,1,15.25,18,"benjyfishy"],
[12,93,6,0,1,15.7,18,"Kinstaar"],
[13,89,6,0,1,17.05,18,"MrSavage"],
[14,88,6,0,1,17.5,18,"K1nzell"],
[15,87,6,0,1,17.95,18,"fwexY"],
[16,86,6,0,1,18.4,18,"LeTsHe"],
[17,80,6,0,1,20.65,18,"Issa"],
[18,77,6,0,1,22,18,"DiegoGB"],
[19,76,6,0,1,22.45,18,"LeftEye"],
[20,74,6,0,1,23.35,18,"teeq"],
[21,73,6,0,1,23.8,18,"smeef"],
[22,72,6,0,1,24.25,18,"DRG"],
[23,71,6,0,1,24.7,18,"Prisi0n3r0"],
[24,69,6,0,1,25.15,18,"Klusia"],
[25,68,6,0,1,25.6,18,"wakie"],
[26,67,6,0,1,26.05,18,"Core"],
[27,64,6,0,1,27.4,18,"JarkoS"],
[28,62,6,0,1,28.3,18,"Evilmare"],
[29,57,6,0,1,30.1,18,"lolb0om"],
[30,56,6,0,1,30.55,18,"letw1k3"],
[31,52,6,0,1,32.35,18,"Fledermoys"],
[32,49,6,0,1,33.7,18,"Emqu"],
[33,42,6,0,1,36.4,18,"Erouce"],
[34,34,6,0,1,39.55,18,"Blax"],
[35,33,6,0,1,40,18,"LYGHT"],
[36,32,6,0,1,40.45,18,"BlastR"],
[37,31,6,0,1,40.9,18,"luKi"],
[38,29,6,0,1,41.8,18,"marteen"],
[39,28,6,0,1,42.25,18,"karhu"],
[40,26,6,0,1,42.7,18,"Robabz"],
[41,24,6,0,1,43.6,18,"Snayzy"],
[42,18,6,0,1,46.3,18,"aqua"]
];
const CARD_H1NAC_Q_RAW=[
[1,57,10,0,2.7,32,54,"Animal"],
[2,57,9,1,2.67,31.78,48,"Smqcked"],
[3,57,9,0,3,32.44,54,"Tragix"],
[4,57,10,2,2.7,37.4,54,"LG Keys."],
[5,57,10,2,3.4,39.9,68,"illest"],
[6,56,8,1,2.25,13.88,36,"Hippie Habitat"],
[7,56,9,1,1.67,32.89,30,"Twitch Lanson"],
[8,56,10,0,2.5,32.2,50,"Avsilver"],
[9,56,9,1,3.22,29.67,58,"Khanada"],
[10,56,10,4,1.6,39.7,32,"nanolite."],
[11,56,10,0,2.4,33.5,48,"Xcells"],
[12,56,9,1,2.11,24.11,38,"Outcast Jacobaqi"],
[13,56,9,0,3.33,25,60,"jammyz"],
[14,55,10,0,2,33.7,40,"jdw"],
[15,55,10,2,1.7,37.3,34,"yurrrrboyjp"],
[16,55,10,1,1.6,34,32,"HEARTT"],
[17,55,10,1,1.3,31.7,26,"Monsieur JTruth"],
[18,55,8,0,2.88,25.5,46,"4114 Elevate"],
[19,55,10,2,2.2,31.7,44,"danielle_luvz_u"],
[20,55,10,1,2.1,35.9,42,"PerfectTilt"],
[21,55,9,2,1.89,24.78,34,"Terps7.10"],
[22,55,10,1,2.8,38.5,56,"TrickVAL"],
[23,55,9,0,2.67,30.11,48,"Shadow.1487"],
[24,55,10,1,1.9,33.2,38,"Cheese slice."],
[25,55,9,0,3.33,27.11,60,"KBKPlays"],
[26,55,9,0,2.67,28.33,48,"UntamedSZN"],
[27,54,9,1,2.11,27.22,38,"BOCIK_Dubixxシ"],
[28,54,10,1,1.7,31.6,34,"bhegs"],
[29,54,10,1,2.4,31.6,48,"joseph7k 暁"],
[30,54,10,2,1.9,28.6,38,"Jermfn"],
[31,54,10,1,2.2,32.6,44,"Ƨad"],
[32,54,9,0,2.11,26.67,38,"MiG Tidav"],
[33,54,9,0,2.22,26.89,40,"Rube Stunwear"],
[34,54,10,1,2.6,40.2,52,"Scoped"],
[35,54,10,0,2.4,33.3,48,"Jonnys Bull"],
[36,54,9,1,2.67,28.56,48,"soulseeker93"],
[37,54,9,2,1.89,23.67,34,"PumpShottyRushTV"],
[38,54,9,1,2.22,26.67,40,"casqer"],
[39,54,9,0,3.44,39.89,62,"Anjo RD"],
[40,54,9,0,3.22,42.44,58,"Tubbey."],
[41,54,10,0,2.8,29.8,56,"dolbz"],
[42,54,10,0,2.2,31.5,44,"SEBBY IS BACK"],
[43,54,10,0,2.3,39,46,"Andrew yz"],
[44,54,10,0,2.6,32,52,"Prodigy Aces"],
[45,53,10,1,2.3,41,46,"inno da god"],
[46,53,9,1,1.22,22.11,22,"Ｆｒｅｙ"],
[47,53,10,1,2.6,35.6,52,"Blindx2"],
[48,53,10,0,1.9,35.2,38,"sukunarcohs"],
[49,53,10,1,2.3,35.6,46,"ᴡᴀᴋᴇ ᴜᴘﾠ"],
[50,53,9,0,2.78,36.89,50,"Xebiit"],
[51,53,10,0,2.7,32.3,54,"Coop"],
[52,53,10,2,2.1,37.8,42,"KoopTrain"],
[53,53,10,0,2.1,32.2,42,"dyslecix."],
[54,53,9,2,2.33,31.22,42,"AcePGH."],
[55,53,10,1,2.7,32.7,54,"Blake"],
[56,53,10,1,2.5,37.6,50,"2exyy"],
[57,53,9,0,2.22,21.56,40,"ApeJesusTTV"],
[58,53,10,0,3,33.5,60,"retired old man"],
[59,53,10,2,1.9,39.2,38,"Daevon1x"],
[60,53,9,1,2.89,28.11,52,"LPB Reckz"]
];
const CARD_H1NAC_S_RAW=[
[1,84,10,3,4,31.1,120,"Dubs"],
[2,79,9,3,4.33,32.56,117,"Clix"],
[3,71,10,2,2.4,32.1,72,"Zayt"],
[4,71,9,2,3,23.44,81,"clarityG"],
[5,69,10,1,3.3,29.9,99,"Bugha"],
[6,69,9,3,2.89,24.67,78,"Reverse2k"],
[7,69,9,3,3.44,29.67,93,"Tfue"],
[8,67,8,0,5,23.63,120,"Unknown Army"],
[9,66,10,2,2.6,35.4,78,"RogueShark"],
[10,65,10,1,2.6,30.9,78,"Bizzle"],
[11,65,9,2,3.22,34,87,"KΛWZMIK"],
[12,64,9,1,3.22,29.33,87,"Nittle"],
[13,64,8,1,3,17.63,72,"psalm"],
[14,64,10,3,2.2,27.6,66,"FunkBomb"],
[15,64,10,1,2.2,30.4,66,"kolor"],
[16,64,10,0,2.6,28.3,78,"Megga"],
[17,63,10,2,2.5,34.9,75,"Commandment"],
[18,63,9,0,3.44,20.89,93,"snood jr"],
[19,63,8,2,3.5,23.25,84,"Bucke"],
[20,63,10,2,2.5,28.6,75,"Klass"],
[21,62,10,0,2.5,32.1,75,"ImAstonish"],
[22,62,9,0,2.89,26,78,"Ferrrnandѵ"],
[23,62,10,1,2.5,35.1,75,"Touzii"],
[24,62,9,1,2.11,20.22,57,"Legedien"],
[25,61,10,2,1.9,30.8,57,"4baldy"],
[26,60,9,2,3.11,28.22,84,"V ivid"],
[27,60,10,2,2,33.4,60,"Ceice"],
[28,60,9,1,2.67,22.78,72,"Ahbramx"],
[29,60,10,1,2.1,27.8,63,"Fuzzy301"],
[30,60,10,0,4,41.7,120,"KingTrigg"],
[31,60,8,0,3.75,18,90,"Kreo"],
[32,60,10,1,3,33,90,"Ꭰestroy"],
[33,60,10,1,2.4,33.7,72,"Hornet"],
[34,60,10,1,2.4,28.3,72,"Mackwood"],
[35,60,10,2,3.5,52.4,105,"Aspect"],
[36,59,9,2,2.44,29,66,"Assault ک"],
[37,59,8,0,4.5,23.25,108,"life ζ"],
[38,59,10,3,1.9,29.1,57,"Hogman"],
[39,59,10,1,3.6,40.8,108,"Saf"],
[40,59,10,1,3.1,36.3,93,"ShawnClaude"],
[41,59,10,2,2.5,39.2,75,"Vicefps"],
[42,59,9,2,2.11,22.33,57,"xilFN"],
[43,59,10,1,2,30.1,60,"W7M Thome"],
[44,59,9,1,1.89,21,51,"Kdoe."],
[45,58,10,0,3.1,35.3,93,"Marzz"],
[46,58,9,0,2.67,29.44,72,"Girlitsjayy"],
[47,58,9,1,2.33,27,63,"Thiccboy Luneze"],
[48,58,10,0,3.1,36.4,93,"Kioxx."],
[49,58,10,0,2.2,36.4,66,"Nate Hill"],
[50,58,9,1,2.11,25.11,57,"Zamblowski"],
[51,58,10,1,1.4,27.6,42,"Fatch"],
[52,58,10,1,2.2,39.2,66,"muyunbrothers"],
[53,58,9,0,3.89,30,105,"XXiF"],
[54,57,10,0,2,32.1,60,"isoTwiz"],
[55,57,9,1,1.78,23.67,48,"bIackie281_"],
[56,57,10,1,2.4,30.1,72,"MIGHTYNOBLE 23"],
[57,57,10,1,3,41.1,90,"graaaaazca"],
[58,57,9,1,2.33,22.89,63,"Dominant"],
[59,57,9,1,2.22,24.22,60,"keen WRLD"],
[60,57,10,1,2,35.9,60,"Yung Calculator"]
];
const CARD_H1NAC_GF_RAW=[
[1,120,6,1,1,4.45,18,"Bugha"],
[2,119,6,1,1,4.9,18,"psalm"],
[3,117,6,0,1,5.8,18,"Kreo"],
[4,111,6,0,1,8.05,18,"Riversan"],
[5,110,6,0,1,8.5,18,"Fatch"],
[6,109,6,0,1,8.95,18,"Rhux"],
[7,105,6,0,1,10.75,18,"Dubs"],
[8,104,6,0,1,11.2,18,"Pika"],
[9,101,6,0,1,12.1,18,"Clix"],
[10,99,6,0,1,13,18,"Commandment"],
[11,96,6,0,1,14.35,18,"Bizzle"],
[12,90,6,0,1,16.6,18,"Klass"],
[13,83,6,0,1,19.75,18,"RogueShark"],
[14,82,6,0,1,20.2,18,"Zayt"],
[15,79,6,0,1,21.1,18,"Vivid"],
[16,75,6,0,1,22.9,18,"kolorful"],
[17,66,6,0,1,26.5,18,"Chenkinz"],
[18,59,6,0,1,29.2,18,"clarityG"],
[19,55,6,0,1,31,18,"Ceice"],
[20,54,6,0,1,31.45,18,"Aspect"],
[21,53,6,0,1,31.9,18,"Megga"],
[22,51,6,0,1,32.8,18,"Bucke"],
[23,47,6,0,1,34.15,18,"Tfue"],
[24,45,6,0,1,35.05,18,"Unknown"],
[25,44,6,0,1,35.5,18,"Kawzmik"],
[26,40,6,0,1,37.3,18,"Snow"],
[27,38,6,0,1,38.2,18,"Touzii"],
[28,36,6,0,1,38.65,18,"Luneze"],
[29,25,6,0,1,43.15,18,"Astonish"],
[30,23,6,0,1,44.05,18,"Legedien"],
[31,22,6,0,1,44.5,18,"Reverse2k"],
[32,20,6,0,1,45.4,18,"Nittle"],
[33,19,6,0,1,45.85,18,"Hornet"],
[34,14,6,0,1,47.65,18,"Herrions"],
[35,12,6,0,1,48.55,18,"Funk"]
];
const CARD_H1NAW_Q_RAW=[
[1,58,9,0,3,26.56,54,"blix 22"],
[2,58,10,2,2.1,32.2,42,"nolburrito"],
[3,58,10,1,1.9,30,38,"5FootPudgeBall"],
[4,57,10,2,2.4,28.3,48,"chancepants."],
[5,57,10,1,1.9,31.2,38,"Aspire"],
[6,57,9,1,3.11,34.22,56,"Sake 999"],
[7,57,10,1,2.2,30.3,44,"Xetiq_"],
[8,56,10,1,2.1,30.9,42,"1400 Vex"],
[9,56,9,1,2.44,27.33,44,"Quinn"],
[10,56,10,0,1.7,26.9,34,"ectorvibin"],
[11,56,10,0,2.8,33.8,56,"BarBan."],
[12,56,9,0,2.56,24.44,46,"DanteAllDay"],
[13,56,9,2,1.67,22.44,30,"crow.wave"],
[14,56,9,1,3.11,35.22,56,"Cyvin"],
[15,56,10,0,2.6,34.1,52,"Deesο"],
[16,56,10,1,2.8,43.4,56,"cr1002cr"],
[17,56,10,0,2.5,34.6,50,"hunnyu7"],
[18,55,10,1,2.5,31.9,50,"Pcket"],
[19,55,10,0,2.2,37.4,44,"1400 Joel"],
[20,55,9,0,2.11,25.78,38,"lunaatiiiiccc"],
[21,55,10,2,2.5,42.9,50,"makenbaken9"],
[22,55,9,1,2.89,31.11,52,"trėν"],
[23,55,10,1,2,34.1,40,"thaitanks"],
[24,55,10,2,2.8,48.3,56,"Prollo G"],
[25,55,10,1,2.3,37.9,46,"SaeSaucy"],
[26,55,10,0,2.8,34.9,56,"OhMyPulse"],
[27,55,9,0,2.56,26,46,"iNV Mojo"],
[28,55,10,0,3.2,33.9,64,"Yagi"],
[29,54,10,1,3,42.6,60,"LeDevilz"],
[30,54,10,0,2.2,31,44,"Howdy"],
[31,54,10,1,2.5,41.5,50,"ALUCARD P"],
[32,54,10,1,2.8,38.2,56,"Xairos"],
[33,54,10,1,2.7,32.3,54,"TTV_1rosefn"],
[34,54,10,0,2.2,30.8,44,"Sritzer"],
[35,54,10,0,2.6,42.7,52,"TiGG"],
[36,54,10,2,2.2,30.4,44,"g0dku"],
[37,54,10,1,2.1,33.2,42,"Balgozdi"],
[38,54,10,1,2.2,35.9,44,"bluzro"],
[39,54,9,1,1.78,26.78,32,"cortex444"],
[40,53,8,1,1.63,18,26,"zizrow who took"],
[41,53,10,1,2.6,36,52,"dymide"],
[42,53,9,2,2.33,38.22,42,"Gunnah is chill"],
[43,53,8,2,1.88,23.63,30,"redshiftㅤ"],
[44,53,9,0,3.44,34.22,62,"LühGeeked"],
[45,53,8,0,2.25,15.75,36,"JayWick."],
[46,53,10,0,2.4,37.8,48,"Silent"],
[47,52,10,2,2.1,33.8,42,"Gatekka"],
[48,52,9,0,3,31.33,54,"cupid요"],
[49,52,9,1,3.22,29.11,58,"Frapai"],
[50,52,9,2,2.11,34.56,38,"Wheels"],
[51,52,10,0,2.3,39.1,46,"Cadet"],
[52,52,8,1,3.38,31.63,54,"V4YNE."],
[53,52,9,1,2.11,26.78,38,"sevn"],
[54,52,9,1,2.78,30.78,50,"DELBEEFBURRITO29"],
[55,52,9,1,2.44,35.89,44,"bddddddddddddddd"],
[56,52,10,1,2,42.6,40,"slim"],
[57,52,10,1,2.2,43.8,44,"User-309ed6f3c7"],
[58,52,10,0,2.6,40.4,52,"mewmaxxing1337"],
[59,52,9,0,1.89,28.11,34,"evan trapper"],
[60,52,10,0,2,28.8,40,"HAANZER"]
];
const CARD_H1NAW_S_RAW=[
[1,87,9,2,4.22,16.22,114,"Riversan"],
[2,84,9,3,4.33,20.89,117,"Arkhram"],
[3,83,8,3,4.38,13.63,105,"skylar 637"],
[4,81,7,2,5.29,8,111,"EpikWhale"],
[5,81,7,3,4.86,10.14,102,"pika"],
[6,76,10,2,3.1,29.7,93,"Rhux"],
[7,75,9,1,4.44,22,120,"Herrions."],
[8,73,9,0,4.11,28.33,111,"finland465"],
[9,71,8,2,3.25,15.63,78,"Cented"],
[10,70,10,1,3.4,39.3,102,"cesars milizéǃ"],
[11,70,9,2,3.67,33.89,99,"Kayuun"],
[12,69,9,1,3.33,27.56,90,"T1 SinOoh 666"],
[13,68,9,0,4,26.56,108,"4DRStorm"],
[14,68,10,1,2.7,30.3,81,"Spicy"],
[15,68,8,0,3,8.88,72,"pzuhs"],
[16,68,10,1,3.9,32.7,117,"Kehnys"],
[17,67,9,0,3.44,20.89,93,"CLG fiona lover"],
[18,67,9,0,3.22,25.33,87,"vvflocka"],
[19,66,8,1,3.63,19.75,87,"spook 7"],
[20,66,10,1,3.3,31.9,99,"Twitch Maximoe"],
[21,65,9,1,3.33,27,90,"Edgey"],
[22,65,8,0,3.88,15.38,93,"Tocata"],
[23,65,9,1,2.67,23.56,72,"barliana"],
[24,65,9,1,3.11,23.22,84,"Sogys."],
[25,65,10,3,2.5,27.3,75,"Rehx"],
[26,65,10,2,2.5,36.6,75,"Mony"],
[27,64,7,2,3.14,14.86,66,"jarvis"],
[28,64,10,0,4.3,44.8,129,"Jοnny."],
[29,64,10,0,4.2,30.9,126,"Unlocalize"],
[30,64,10,1,3.6,32,108,"SirD-_-"],
[31,64,10,2,2.2,41.1,66,"Rift"],
[32,63,8,1,3.13,18.38,75,"aixei"],
[33,63,10,1,3,33.3,90,"Fulmerlol"],
[34,63,9,1,3.22,30.89,87,"Falconer"],
[35,63,8,2,2.63,24.38,63,"Sealmatt."],
[36,63,10,1,2.6,30.7,78,"DV ƾ"],
[37,62,10,1,2.8,34.6,84,"Jelty"],
[38,62,10,2,2.7,38,81,"Hdizzle"],
[39,62,9,1,3.11,27.22,84,"Saf"],
[40,61,10,1,3.1,34.7,93,"Extinct"],
[41,61,10,1,2.1,29.4,63,"vent."],
[42,61,10,1,2.8,32.2,84,"bumboy6."],
[43,61,10,2,1.9,34.2,57,"flx"],
[44,61,8,1,3.25,22.38,78,"domo"],
[45,61,10,1,3.1,33,93,"Dabzi."],
[46,60,10,1,2.8,35.4,84,"760 Kylo"],
[47,60,10,0,2.8,35.9,84,"希望 _"],
[48,60,10,1,2.5,32.2,75,"Durag Danman"],
[49,60,10,0,2.7,29,81,"ivek"],
[50,60,9,2,2.56,33,69,"nanolite."],
[51,59,10,2,1.9,35.1,57,"Tavern"],
[52,59,8,1,2.13,14.75,51,"geeg sev"],
[53,59,10,0,3,34,90,"jmo"],
[54,59,10,0,3.2,34.9,96,"Retake Spectro"],
[55,59,10,1,2.7,40.3,81,"xVerty"],
[56,59,9,2,2.33,30.56,63,"zensd"],
[57,59,10,1,2.5,33.6,75,"Knives Is Daddy"],
[58,59,10,1,1.5,32.1,45,"Adolfwasright67"],
[59,59,8,2,3.25,23.63,78,"Outcast Litzinio"],
[60,58,8,1,3.75,26.38,90,"mikaylagoated2.0"]
];
const CARD_H1NAW_GF_RAW=[
[1,118,6,0,1,5.35,18,"EpikWhale"],
[2,84,6,0,1,19.3,18,"Pzuhs"],
[3,78,6,0,1,21.55,18,"4DRStorm"],
[4,63,6,0,1,27.85,18,"Arkhram"]
];
const CARD_H1BR_Q_RAW=[
[1,58,9,0,3,30.56,54,"The Ikoonzzz"],
[2,57,10,2,2.7,31.1,54,],
[3,57,10,0,3.1,36.1,62,"tuti lindo"],
[4,57,9,0,1.56,24.78,28,"mojakhub"],
[5,57,10,1,2.3,27.7,46,"j0das"],
[6,57,9,1,2,28,36,"mstzera1"],
[7,57,10,2,2.3,37.3,46,"Granjero 247"],
[8,56,10,1,2.7,37.9,54,"C9 psychopira9x"],
[9,56,10,1,2.1,34,42,"some1ab0ve"],
[10,56,9,0,2.11,24.44,38,"fazer"],
[11,56,10,0,2.2,34.2,44,"Sanku"],
[12,56,8,0,3.13,20.25,50,"fernofishyposta"],
[13,56,10,1,1.8,32.6,36,"EZezinN."],
[14,56,10,0,2.9,30.3,58,"CUIDADO CONMIGO"],
[15,56,10,1,1.9,35.2,38,"PHZINツL2R2"],
[16,56,9,1,2.56,29.44,46,"Kaizertem."],
[17,56,8,1,2.38,15.63,38,"I1x."],
[18,55,10,1,3.2,45.6,64,"zytlee"],
[19,55,9,1,3.22,27.56,58,"devest1"],
[20,55,10,1,2.9,36.8,58,"lekmaluco7"],
[21,55,10,0,3,40.8,60,"TommyMDQ"],
[22,55,10,0,3.3,29.3,66,"seth1"],
[23,54,10,1,3.6,34.8,72,"4liciaontop"],
[24,54,10,1,3.1,37.4,62,"ﾠﾠﾠ ﾠﾠ ﾠﾠﾠﾠﾠﾠ"],
[25,54,10,1,1.9,31.5,38,"s6ntzrrPDF"],
[26,54,10,0,2.1,33.7,42,"loqqty"],
[27,54,10,1,2.8,30.6,56,"RustyK"],
[28,54,10,0,3.2,33.3,64,"Becho_"],
[29,54,10,1,2.5,31.3,50,"Zappa TOXIC"],
[30,54,10,1,2.1,31.3,42,"kalluto afoito"],
[31,54,9,0,2.33,19,42,"Hitagi Gahara"],
[32,54,10,1,2.7,39.4,54,"Avlr 友"],
[33,54,10,0,2.4,31.4,48,"HBN kngted"],
[34,53,10,2,2.1,36.5,42,"Ig Edwnnn24_"],
[35,53,10,0,1.9,34.7,38,"toñuel"],
[36,53,9,0,2.33,29.89,42,"Tomi204"],
[37,53,10,2,2.5,38.7,50,"Motitarica"],
[38,53,10,0,3,34,60,"kinmgǃ"],
[39,53,9,0,1.78,24.22,32,"Иaash"],
[40,53,9,0,1.89,24.67,34,"BΕNZ"],
[41,53,10,1,2.3,37.2,46,"seamu321"],
[42,53,6,1,2.5,8.5,30,"anclärityyXX"],
[43,53,10,1,1.8,34.9,36,"sanctuary"],
[44,53,10,1,1.4,32.6,28,"Andreoli-"],
[45,53,10,1,1.9,38.9,38,"Strong力"],
[46,53,10,2,2,40.2,40,"Chanchox."],
[47,53,9,1,2.44,29.89,44,"aoropac"],
[48,52,10,2,1.3,29.2,26,"bisicletovich"],
[49,52,10,1,1.8,35.3,36,"dudu classic"],
[50,52,10,1,1.8,43.4,36,"Beatsburn"],
[51,52,10,0,2,32.8,40,"Germán BENDECIDO"],
[52,52,9,2,3.22,44.44,58,"yahiikoﾠ"],
[53,52,9,2,1.33,26.11,24,"1chances99loss"],
[54,52,10,1,2.4,30.8,48,"stellar snx"],
[55,52,10,2,2.5,45.4,50,"Twitch.Nocturnoz"],
[56,52,10,1,1.3,29.6,26,"RAUL IN DA HAUSE"],
[57,52,9,0,2.67,25,48,"Ezterminia"],
[58,52,10,0,2,30.5,40,"wave edsonǃ"],
[59,52,9,0,2.56,32.78,46,"Redlee"],
[60,52,9,1,1.44,26.11,26,"ÏŒdf4ʝ"]
];
const CARD_H1BR_S_RAW=[
[1,96,10,2,6.1,37.5,183,"Nicks"],
[2,91,10,3,5.4,47.2,162,"Clipnode 28"],
[3,85,9,2,4.56,24.67,123,"K1nG"],
[4,84,8,2,4.38,9.38,105,"Twitch Leobas"],
[5,82,8,2,5.5,17.88,132,"INTZ DRAKONZ"],
[6,81,9,1,4.11,20.33,111,"technoviking46"],
[7,79,10,3,3.2,29.3,96,"Lasers"],
[8,76,10,0,3.7,32.7,111,"187 ـ رئيس الوزر"],
[9,76,8,2,4,15.13,96,"xxxxǃǃǃǃ"],
[10,76,8,1,3.75,16,90,"w estevin"],
[11,74,9,2,4.11,26.56,111,"leleo"],
[12,74,10,2,4,38.1,120,"guardiao BJJ 22"],
[13,72,9,0,4,27.44,108,"Twayko"],
[14,71,10,2,3.1,32.2,93,"fakkz endless"],
[15,70,10,2,3.8,39.5,114,"Snowspampiunpiun"],
[16,69,10,1,3.6,33.6,108,"Nothing Ω"],
[17,69,9,2,2.89,20.67,78,"Jpsk1ng"],
[18,68,10,0,3.8,36.1,114,"sнeco"],
[19,68,10,1,3.8,37.2,114,"Pulga"],
[20,68,10,2,3.8,38.9,114,"KING"],
[21,68,10,1,2.5,31.5,75,"TCH Chigua ヅ"],
[22,67,10,1,1.9,26,57,"diofvǃ"],
[23,67,10,0,3.4,28.6,102,"zEkÔ"],
[24,67,10,0,4.2,30.5,126,"PROP Ӝ"],
[25,65,10,1,2.6,35.5,78,"mystickftw."],
[26,65,10,0,3.5,38,105,"w um"],
[27,65,9,1,3.11,35.56,84,"LURKER 力"],
[28,65,10,1,3.4,34,102,"dyfsssj"],
[29,64,10,1,2.9,35.2,87,"njrⓐⓢשٍّ"],
[30,64,9,1,4.11,26.78,111,"Chapo_ッ"],
[31,64,10,2,2.6,35.1,78,"veloso 360hz"],
[32,64,9,1,3.67,25.44,99,"Gabiruga JM"],
[33,63,9,2,3.44,31.56,93,"randomuserjajaja"],
[34,63,10,2,2.6,34.3,78,"tito caIderon"],
[35,63,9,1,4,32.33,108,"Febas Banzaking"],
[36,63,10,1,2.1,27,63,"Incvs"],
[37,63,10,0,3.1,30.2,93,"xKovak"],
[38,62,10,2,3.1,42.5,93,"i am dizzy."],
[39,62,10,1,3.6,32.5,108,"SebitAsxs"],
[40,61,10,1,2.9,36.9,87,"vargass ᵛᵖ"],
[41,61,10,1,3.4,37.1,102,"blackoutz"],
[42,61,10,1,3.3,32.8,99,"44 Skill gap"],
[43,61,10,2,2.9,32,87,"santidead22"],
[44,61,9,2,3.11,37.11,84,"riqueessj."],
[45,61,9,1,3.33,32,90,"Filipe"],
[46,60,9,1,3.44,26.33,93,"ᥴh7"],
[47,60,10,1,1.8,29.8,54,"xlг8"],
[48,60,10,0,2.1,30.5,63,"Dreus2"],
[49,59,10,1,2.7,35.2,81,"GusTavox8"],
[50,59,9,0,3.56,27.89,96,"Matousky"],
[51,59,10,2,2.2,26,66,"BerИardZᶜʳᶠ"],
[52,59,10,1,2.5,45.4,75,"xOwNSpamPiumPium"],
[53,59,9,2,1.56,26.56,42,"foronezx"],
[54,59,10,1,3.4,43,102,"Nocturnoz GT-R"],
[55,58,9,2,2,24.22,54,"O Reira"],
[56,58,9,1,1.78,24,48,"Mirkσ"],
[57,58,10,2,1.6,29,48,"GGOrión"],
[58,58,10,0,2.8,33.1,84,"Kitoz"],
[59,58,10,0,2.6,31.8,78,"EsTani 2 gambas"],
[60,58,10,1,3.8,37.2,114,"ＩｔｚＢｌｏｏｐｙ"]
];
const CARD_H1BR_GF_RAW=[
[1,116,6,0,1,6.25,18,"k1nG"],
[2,91,6,0,1,16.15,18,"kurtz"],
[3,65,6,0,1,26.95,18,"Nicks"],
[4,58,6,0,1,29.65,18,"leleo"],
[5,43,6,0,1,35.95,18,"Lasers"],
[6,39,6,0,1,37.75,18,"drakoNz"],
[7,13,6,0,1,48.1,18,"Clipnode"]
];
const CARD_H1ASIA_Q_RAW=[
[1,59,10,2,3.2,36.2,64,"Malobin"],
[2,59,9,2,2.22,27.33,40,"ᴴᴱᴵꟸᴲᴵ"],
[3,59,10,1,2.6,38.6,52,"Shinckyfishy"],
[4,58,10,1,2.7,31.8,54,"Tonbocub"],
[5,58,10,0,2.4,26.1,48,"backhou- -"],
[6,58,10,2,2.3,32.9,46,"HowlAreYou"],
[7,58,9,1,1.89,24.67,34,"Mevǃ"],
[8,58,10,0,3.3,32.3,66,"Spidermon"],
[9,58,8,1,3,18,48,"UramEkat"],
[10,58,10,0,2.5,31,50,"Mikage 琉"],
[11,57,10,0,3,30.8,60,"AlterEgo.Feezle"],
[12,57,5,0,7,23.4,70,"seak."],
[13,57,10,1,1.8,31.2,36,"SWIFT Taytan"],
[14,57,10,1,2.1,31.8,42,"WGS MacChan"],
[15,56,10,1,1.2,29.8,24,"kobayashi mayo"],
[16,56,9,0,1.89,21.33,34,"MrYAMAKIN"],
[17,56,10,0,3.1,39.5,62,"C9_Duty"],
[18,56,10,2,2,28.5,40,"CR.VanilLa"],
[19,56,10,2,2.4,37.4,48,"DFM_Hamuppi"],
[20,56,10,1,2,33.6,40,"nagnapnag"],
[21,56,10,0,2.3,44.1,46,"King.Sone"],
[22,56,8,0,2.88,13.5,46,"GULlCK"],
[23,56,9,0,3.22,31.44,58,"轮转转"],
[24,55,10,1,2.7,36.4,54,"Dabzi."],
[25,55,10,0,2.7,33.8,54,"CR.Arisakaaa"],
[26,55,10,1,2,33.4,40,"l_l_1DA"],
[27,55,10,0,2.9,36,58,"wzj20"],
[28,55,10,1,3.4,33.5,68,"メンタンピン ドラドラ 満貫です"],
[29,54,10,1,2.9,41,58,"아기고양이응애용"],
[30,54,10,1,2,34.1,40,"iamfromansan"],
[31,54,10,0,3.1,36.1,62,"MidniteStars"],
[32,54,10,0,3,36.4,60,"Tempura 3"],
[33,54,10,1,1.6,25.7,32,"21346741"],
[34,54,10,0,3.9,42.4,78,"zepher y"],
[35,54,10,1,2.5,38.3,50,"7Months Galassia"],
[36,54,9,0,2.44,29.78,44,"gold pump203"],
[37,54,10,0,1.6,26.7,32,"かわいいひなたろう"],
[38,54,10,1,1.6,30.5,32,"SungKyu."],
[39,54,10,1,2.5,36.5,50,"Kenshin1xx"],
[40,54,10,1,2.3,37.9,46,"Notchǃ"],
[41,53,10,0,2.9,36.6,58,"CR.UyuRiru"],
[42,53,10,1,2.6,40.5,52,"zMuGï"],
[43,53,10,0,2,31.4,40,"Phate"],
[44,53,10,0,2.6,34.7,52,"도랄팤fan"],
[45,53,9,2,2.22,30,40,"User-f96164af44"],
[46,53,10,1,1.9,33.9,38,"SZ KilluA"],
[47,53,10,0,3.2,39.7,64,"seita isono"],
[48,53,10,0,2.8,31.4,56,"김진붕"],
[49,53,10,1,2.3,30.3,46,"p7aymaker"],
[50,53,9,1,2.11,23.33,38,"くるくるさしごぶらんく"],
[51,53,10,0,2.9,31,58,"DSS21511"],
[52,52,9,1,2.89,26.67,52,"FPX 01"],
[53,52,10,1,2.4,32.2,48,"HARIGOD"],
[54,52,10,1,2.2,31.8,44,"TOXIC_GRINGO15"],
[55,52,10,0,3.4,41.5,68,"CR.Daruma"],
[56,52,10,1,1.3,40,26,"tsunami zzz"],
[57,52,8,1,3.13,31.5,50,"G r ä y"],
[58,52,10,1,1.8,38.7,36,"Sanctier"],
[59,52,10,1,1.4,34.3,28,"Shiras"],
[60,52,10,0,2.2,32.4,44,"FLUID voke"]
];
const CARD_H1ASIA_S_RAW=[
[1,102,8,2,6.25,5.88,150,"Banny 運"],
[2,90,9,3,5.78,26.78,156,"Hood.J"],
[3,90,9,2,6.11,27.89,165,"Maufin"],
[4,89,10,3,4.2,28.3,126,"SexyBoy"],
[5,89,9,2,3.78,19.33,102,"Peterpan"],
[6,86,9,4,4.33,30.33,117,"Washed P1ay2r"],
[7,85,10,2,3.8,29.3,114,"Medusa"],
[8,85,8,3,3.88,10.13,93,"Ruri"],
[9,85,8,1,5.63,16.5,135,"Arius"],
[10,84,10,2,4.6,38.3,138,"middko2lfy"],
[11,83,10,1,4.9,33.9,147,"NewbeeXXM"],
[12,81,9,3,4.56,27.78,123,"RizArt"],
[13,80,9,1,5,21.33,135,"Aimhero_o."],
[14,79,9,0,4.56,20.22,123,"T1 SinOoh 666"],
[15,76,9,0,4.78,24.11,129,"ADUO21312"],
[16,75,10,2,3.7,31,111,"torifyx"],
[17,73,9,0,4,21.44,108,"AT Kushi"],
[18,72,9,4,3,19.11,81,"SV_peach.CN"],
[19,72,9,1,3.67,23.67,99,"Bob"],
[20,71,9,2,4,28,108,"ALBA-A fa1zzy"],
[21,70,10,2,3,30.8,90,"Qjac"],
[22,70,10,1,2.8,27.3,84,"petauyu"],
[23,69,10,2,3.6,35.6,108,"Swillium"],
[24,68,10,2,2.9,37.2,87,"Jinu-"],
[25,68,10,0,4.2,38.6,126,"Maya21h"],
[26,67,10,1,4.2,29.5,126,"Newbee -"],
[27,67,10,1,3.1,29.3,93,"CR TOPPY XD"],
[28,67,10,0,3.4,32.2,102,"なんかのプロ"],
[29,67,10,2,2.9,30.7,87,"N1nGD0- -"],
[30,67,10,1,2.8,33,84,"SHIA.44"],
[31,67,10,2,3,34.9,90,"そふぃあだよおおおおおお"],
[32,66,10,0,3.2,27.2,96,"要杀我的随便来"],
[33,66,9,1,2.22,22.11,60,"Shin gwan"],
[34,66,10,1,2.2,26.5,66,"JuneKstar"],
[35,66,10,1,3.6,33.3,108,"Overlordism"],
[36,65,9,1,3.33,23.44,90,],
[37,65,9,1,2.78,23.44,75,"rehx no.1"],
[38,65,8,2,2.38,15.25,57,"Yusea"],
[39,65,10,2,2.3,33.7,69,"Sªrüzÿ"],
[40,65,10,2,2.5,31,75,"Macyfishy"],
[41,64,8,2,2.75,16.63,66,"New Gaymer"],
[42,64,10,2,2.2,27.6,66,"Twitch_Kyuhan"],
[43,64,10,2,2.8,34.1,84,"intr0."],
[44,64,8,0,3.63,18.38,87,"DRX Zest"],
[45,63,7,1,3,8.14,63,"FNturtlesurfer"],
[46,63,8,3,2.88,20.75,69,"Chocoluv"],
[47,63,10,2,2.3,33.3,69,"LwxFN"],
[48,62,10,1,2.5,31.3,75,"Kurara"],
[49,62,10,0,3.2,30.9,96,"Sunfloweboy"],
[50,61,9,0,2.78,30.56,75,"YESEONGHO"],
[51,61,10,1,3.4,40.7,102,"FL CLZ"],
[52,61,9,1,2.67,24.67,72,"Märtyfishy"],
[53,60,10,1,3,31.9,90,"wasp nomfu"],
[54,60,9,2,1.67,22.33,45,"ZETA Nisidera"],
[55,60,10,2,2.3,31.6,69,"97ut65fewa"],
[56,60,10,1,3,34.8,90,"ゆーざーＡ"],
[57,59,10,1,3,35.2,90,"매생이4"],
[58,59,9,1,2.56,19.67,69,"FADΞDPIǤEON47"],
[59,59,10,1,1.4,25.8,42,"GlizzyGobbler500"],
[60,59,9,1,2.56,26.67,69,"ragna"]
];
const CARD_H1ASIA_GF_RAW=[
[1,100,6,0,1,12.55,18,"Peterpan"],
[2,85,6,0,1,18.85,18,"TAKAMURA"],
[3,61,6,0,1,28.75,18,"Hood.J"],
[4,50,6,0,1,33.25,18,"Banny"],
[5,41,6,0,1,36.85,18,"FaxFox"],
[6,21,6,0,1,44.95,18,"Maufin"],
[7,11,6,0,1,49,18,"Arius"]
];
const CARD_H1OCE_Q_RAW=[
[1,60,10,0,3.6,36.5,72,"coltini jenkins"],
[2,60,10,0,3.6,40.7,72,"Yoink Meister 28"],
[3,59,9,0,2.78,23.56,50,"Smeeferino"],
[4,59,9,0,1.56,18.44,28,"AeroOCE"],
[5,59,10,1,3.2,32.2,64,"Criser"],
[6,59,10,1,3.2,38.4,64,"vF m1nt"],
[7,59,10,0,3.3,29.6,66,"cracksfn 74"],
[8,59,9,1,3,23,54,"GﱞﱞﱞﱞﱞﱞﱞTA 6"],
[9,58,8,1,2,16.38,32,"atmptz"],
[10,58,10,1,2.6,32.9,52,"rushedache32"],
[11,58,10,1,1.6,26,32,"westy.-"],
[12,58,10,1,3.3,35.2,66,"123456789123abc1"],
[13,57,10,2,2.4,36,48,"spraz."],
[14,57,10,1,2.1,30.7,42,"Lapex YT"],
[15,57,10,0,2.7,42.6,54,"Twitch MythOCE"],
[16,57,10,2,2.2,30.4,44,"ORBIT Spin"],
[17,57,9,1,3.33,30.56,60,"Tyraxe"],
[18,57,10,2,1.3,30.9,26,"goeg."],
[19,56,9,1,1.89,28.33,34,"Price"],
[20,56,10,0,3.4,34.6,68,"i dont hit max"],
[21,56,9,2,1.67,25.11,30,"Gosu_Keith"],
[22,56,10,2,2.5,33.7,50,"Kytuuz"],
[23,55,10,1,1.9,30,38,"Biocyder"],
[24,55,10,1,1.1,29.9,22,"jiahǃ"],
[25,55,10,1,2.8,43.7,56,"ORNZY"],
[26,55,10,1,2,36.9,40,"sikǃ"],
[27,55,10,1,3.2,44,64,"고민서린"],
[28,55,10,1,2.5,36.7,50,"vRxthless"],
[29,54,10,1,2.5,42.7,50,"amazedtm"],
[30,54,10,0,3.6,39.5,72,"spoi"],
[31,54,10,1,1.7,29.8,34,"Cheeezzy."],
[32,54,10,0,2.7,39.8,54,"Shaydan"],
[33,54,10,2,2.9,41.7,58,"Whitearmor1515"],
[34,54,10,1,3,38.9,60,"twitch.sethylad"],
[35,54,10,1,2.6,47.6,52,"oceDEXX"],
[36,54,10,0,3,25.7,60,"clipslool"],
[37,54,10,0,2.6,36,52,"2 ez g nxt time"],
[38,54,9,1,2.11,35.11,38,"irasna dddd"],
[39,53,10,1,2.2,31.3,44,"binklebonkles"],
[40,53,10,2,2,37.9,40,"Free R Kelly"],
[41,53,10,1,2.8,29.8,56,"TwitchJordyx3"],
[42,53,9,1,2.56,28.78,46,"ethiopian queen"],
[43,53,10,0,2.3,33,46,"200IQ-KING-_-"],
[44,53,10,0,1.9,35,38,"allah amen"],
[45,52,10,1,2.7,34.4,54,"serpppppppppp"],
[46,52,10,1,2.4,34,48,"Sync"],
[47,52,9,0,2.22,22.44,40,"Amossss."],
[48,52,9,1,1.67,27.67,30,"NotBhedAndy"],
[49,52,9,1,2.11,23.44,38,"DrillaGorilla55"],
[50,52,9,1,3.11,31.89,56,"moyai lachy"],
[51,52,10,1,2.6,32.3,52,"clean 恐"],
[52,52,10,0,3.4,34.7,68,"spearnz"],
[53,52,9,0,1.56,23.44,28,"rees"],
[54,52,10,1,2.3,34.8,46,"sajjcd"],
[55,52,10,1,1.8,38.3,36,"Jay quit"],
[56,52,9,0,2.56,25.11,46,"deangaz01"],
[57,52,10,1,2.5,37.5,50,"Oreo"],
[58,52,10,1,2,37.8,40,"damo051"],
[59,51,8,1,2.38,22.25,38,"rαdius."],
[60,51,10,1,1.6,35,32,"soul.ㅤ"]
];
const CARD_H1OCE_S_RAW=[
[1,93,10,3,4.3,27.1,129,"Link.ㅤ"],
[2,85,10,2,4.6,35.2,138,"X2twins Jordan"],
[3,82,8,2,5.5,15.88,132,"I_QUIT_THE_GAME"],
[4,81,8,2,4.63,18,111,"worthy"],
[5,81,10,2,4.5,29.7,135,"alecc"],
[6,80,10,1,4.7,30.1,141,"cat flobber"],
[7,80,10,0,4.2,29.9,126,"trapped"],
[8,79,10,3,3.4,28,102,"skyʬ"],
[9,77,9,0,5,28.33,135,"slaya"],
[10,77,9,1,4.22,23.78,114,"Jynx"],
[11,76,10,1,5,43.2,150,"volx"],
[12,76,9,1,4.67,27.78,126,"the 13th apollo"],
[13,76,10,3,3.6,30.6,108,"RepulseGod"],
[14,75,10,2,3.1,28.9,93,"Lucid."],
[15,74,9,0,4.33,20.33,117,"kquid og"],
[16,73,10,2,3.4,32.1,102,"Jahlyn"],
[17,72,9,1,3.33,21.78,90,"Tsuǃ"],
[18,72,9,3,2.33,21.11,63,"Predep"],
[19,72,10,2,3.5,34.2,105,"Tyhu_"],
[20,72,10,0,4,32.2,120,"ronniestats"],
[21,72,8,1,4.25,16.25,102,"Loyal Eshz 11 真"],
[22,70,8,0,4.88,16.63,117,"Gheez"],
[23,70,9,1,4.56,24.22,123,"desire 米"],
[24,70,10,2,4.5,36.6,135,"Psyper"],
[25,70,10,1,4.3,29.3,129,"jap8n"],
[26,70,9,0,4.67,25.67,126,"aerion 99"],
[27,69,10,2,3.2,31.5,96,"hillo 7"],
[28,69,10,2,3.1,38.4,93,"Borgie789"],
[29,69,9,3,3.33,19.22,90,"Flexah_"],
[30,68,8,1,3.88,16.88,93,"SpeedyND"],
[31,68,9,1,2.67,17.11,72,"Saxlea"],
[32,67,10,1,3,28.6,90,"delkud6v"],
[33,67,10,1,2.6,35,78,"Jax1wnl"],
[34,66,9,2,3,21.22,81,"Shaggyャ"],
[35,66,10,1,2.5,24.1,75,"celtics shäq"],
[36,65,10,1,2.8,26.9,84,"Spizza"],
[37,65,10,3,2.9,40.6,87,"User-54729151d2"],
[38,65,8,0,3.5,19.88,84,"snốwy"],
[39,65,10,1,2.8,30.4,84,"x2twins Jesse"],
[40,65,8,0,3.5,15.5,84,"itscontest"],
[41,64,10,1,3.6,36.2,108,"mrfreshasian"],
[42,64,9,0,2.67,26.22,72,"willcuzz"],
[43,64,10,0,2.7,28.9,81,"dolf"],
[44,63,10,0,3.5,36.3,105,"Mangozk"],
[45,63,10,1,2.7,27.1,81,"Hussy"],
[46,63,10,1,3.8,33.1,114,"minkin 8"],
[47,62,10,1,3,29,90,"kulesy"],
[48,62,10,2,3.2,42.4,96,"Flackovski"],
[49,62,10,1,4.1,41.5,123,"Cazoldist"],
[50,62,10,1,2.5,27.1,75,"bugnutz"],
[51,62,10,1,2.7,35.6,81,"trashcan clints"],
[52,61,10,2,2.4,26.1,72,"Hersh"],
[53,61,10,2,1.9,29.3,57,"kwupington"],
[54,61,10,1,3.6,32.5,108,"7VEN Jimbob"],
[55,61,9,1,3.44,29.33,93,"0G Cray0n"],
[56,61,10,3,2.4,34.4,72,"Vincey"],
[57,61,10,0,2.9,31.5,87,"Cliqahh"],
[58,61,10,2,2.4,30.2,72,"ty-005"],
[59,60,9,2,2,26.33,54,"Jack_Sparrow2007"],
[60,60,10,1,2.7,36.8,81,"Rel"]
];
const CARD_H1OCE_GF_RAW=[
[1,46,6,0,1,34.6,18,"sozman"],
[2,35,6,0,1,39.1,18,"slaya"],
[3,30,6,0,1,41.35,18,"Link"],
[4,17,6,0,1,46.75,18,"Cat"],
[5,15,6,0,1,47.2,18,"Jordan"]
];
const CARD_H2EU_Q_RAW=[
[1,72,10,1,3.5,19.5,70,"CaptainLucyy","Azqvro"],
[2,72,8,0,4,11.13,64,"AG.Skyllers","Twitch GMasta"],
[3,72,7,1,4.86,6.86,68,"atheist avenger","Dfective"],
[4,72,9,1,4.44,14.33,80,"K1nfetti","Toose"],
[5,71,10,1,4.1,18.6,82,"Andilex","Orkhx"],
[6,71,10,1,4,20.9,80,"add me lolǃ","sayr3ez"],
[7,71,9,0,3.89,16.33,70,"kejseR","trippernn"],
[8,71,9,1,3.78,16.44,68,"fym hamster","mwkhx"],
[9,71,10,1,4.7,23.9,94,"Freemok","ZXC KongTV"],
[10,71,10,0,4.1,18.9,82,"Refsgaard","haxcore."],
[11,71,9,0,5,15.56,90,"script is insane","rasneyicy"],
[12,71,8,2,2.75,7.25,44,"edra","Dang0ms"],
[13,70,10,1,3.1,17.2,62,"ZohaaN_","Naranj1t0"],
[14,70,10,2,4.7,21.2,94,"鬼 Issa","Sir Liam Richard"],
[15,70,10,1,4,22.3,80,"WeisseMoehre","Kullie"],
[16,70,10,3,3,18.6,60,"WashedMagicPølse","BEAST"],
[17,70,9,2,3.44,16.11,62,"6633X","LeftEye71"],
[18,70,8,1,4.75,12.5,76,"OG luKi3","Smileyy"],
[19,70,10,0,4.1,19.3,82,"Tonyy le steak","Decyptos"],
[20,69,8,1,4.88,12.75,78,"Luuu 90","Coffeh"],
[21,69,9,1,4.11,19.11,74,"Firex〆","setox04"],
[22,69,10,0,3.2,16.3,64,"lol lmao rofling","abusivestepdad."],
[23,69,10,0,3.3,17,66,"brodie","GV Napoleon"],
[24,69,10,2,2.7,18.7,54,"EMXXRR","nawqa9"],
[25,68,10,2,3.1,18.3,62,"Xsterioz","Papito"],
[26,68,10,1,3.1,19.2,62,"AlminoxDak","Klusiabtw"],
[27,68,10,0,3.9,19.2,78,"dihmoo","VCTRY cen"],
[28,68,10,0,5.2,21.2,104,"marteen 027","Skailereu"],
[29,68,10,1,3.7,21,74,"Stārlyeu","Cāps 44"],
[30,68,9,1,3.89,15.56,70,"Hen","stuffs ک"],
[31,68,10,0,3.4,16.5,68,"JannisZ","Rijas77"],
[32,68,9,1,4.11,15.89,74,"Thh Filip","Rakso"],
[33,68,10,1,3.7,20.7,74,"TRICKED Jarl","gramg0d"],
[34,67,10,2,3.5,21,70,"WTerp"],
[35,67,10,0,4.7,19.6,94,"jazkiii","Tohaj"],
[36,67,9,0,4.56,18.11,82,"fellexyz","Wakie "],
[37,67,10,1,2.8,19.8,56,"FNX Papy Elite","Papy OmyTV"],
[38,67,9,2,3.67,16.44,66,"astro is back.","ＡＲＢＥＩＴＭＡＣＨＴＦＲＥＩ"],
[39,67,10,1,4.6,21.9,92,"Twitch wurxzy","LDLC OLSpk"],
[40,67,10,1,3.4,17.1,68,"Ginge 7","flyxㄲ"],
[41,67,10,1,2.8,17.5,56,"AX Dexter","veduki 78"],
[42,67,10,0,3.3,17.7,66,"KiritóSan","DIG.Fero"],
[43,66,10,1,3.1,18.5,62,"Dyner.","nork"],
[44,66,10,1,4.3,22.1,86,"K1nzell","Villex who"],
[45,66,10,1,3.7,22.8,74,"Rᶒno","TitanOlympus"],
[46,66,10,1,2.3,17.9,46,"nikoㅤ","Solo FNCS Grind"],
[47,66,10,0,4.2,20.3,84,"Merijn","jaspaay."],
[48,66,10,2,3.9,20.6,78,"Noahreyli","tickleナ"],
[49,66,10,2,3.2,20.7,64,"Whai.","Tj uwu尔"],
[50,66,9,2,3.11,15.56,56,"raptey","Gawho"],
[51,66,9,1,3,16,54,"faze_20packngts","hide in ur box"],
[52,65,10,1,4.2,23.3,84,"Bjergz","X2014XFriendly67"],
[53,65,9,1,3.78,16.44,68,"El Guyzou","Zenyx彡"],
[54,65,9,1,3.56,17.22,64,"Malchïk","NCBz Novaaa"],
[55,65,9,0,3.44,15.44,62,"FR_Bijour","Sarkanos"],
[56,65,8,0,3.88,12.38,62,"Kling 177","faze_20packngts"],
[57,65,10,3,2.2,18.7,44,"Líll-Lars","Alliance.Powder"],
[58,65,9,2,3.11,16.89,56,"fake vorwenn","M a r t o zㅤ"],
[59,65,10,2,3.1,22.3,62,"snoozloozz","Crusti "],
[60,65,10,0,3.3,18.9,66,"moko Siffredi","Salut Jeune"]
];
const CARD_H2EU_S_RAW=[
[1,110,7,1,8.57,3.86,180,"Benjyfishy","MrSavage"],
[2,105,8,2,7.25,8,174,"Mongraal","Mitr0"],
[3,105,9,2,7.22,14.78,195,"Tschinken","Stompy"],
[4,98,7,3,7.57,5.86,159,"Samzahef","Nikof"],
[5,94,9,1,6.44,15.44,174,"wolfiez","Rojo"],
[6,91,8,3,5.88,12.38,141,"Hunter","Kinstaar Aim.exe"],
[7,89,9,2,5,10.56,135,"Mexe","Skram"],
[8,89,10,1,4.6,15.9,138,"Lnuef","Tce TomeK1942"],
[9,87,9,2,5.11,16.56,138,"itemm","Derox"],
[10,87,10,1,5.1,16.9,153,"fwe","Letw1k3"],
[11,86,9,1,4.67,12.56,126,"Washed Orange","h4count"],
[12,86,10,2,4.4,16.6,132,"Nyhrox","Aqua"],
[13,86,10,1,5.9,22.9,177,"7ssk7","Jamside"],
[14,85,8,2,5.38,11.5,129,"Crue","Chapix"],
[15,85,9,1,5.44,15.22,147,"TimideMaisLucide","M11Z"],
[16,85,9,1,5.22,14.33,141,"Zyppan.","Pez1x"],
[17,85,10,1,4.4,16.7,132,"Clem_idk","Nyydo"],
[18,85,9,1,4.44,14.11,120,"Skite","yconelsiete"],
[19,84,9,2,4.44,15.89,120,"Sethouu","drģ."],
[20,83,10,2,4.6,17.5,138,"OlsoCK","BadSniper"],
[21,81,9,0,4.89,14,132,"Pr0vokd .","Magin"],
[22,81,10,0,5.4,19,162,"MOTOR","Verox"],
[23,81,10,2,4,18,120,"AstroSMZ","Khuna"],
[24,81,9,3,4.56,15.67,123,"fake vorwenn","Tuckz"],
[25,80,10,2,4.6,18.4,138,"4zr","SOL Noward"],
[26,80,10,2,3.8,17.2,114,"RedRush","AMG znappy"],
[27,80,8,1,5.75,14.38,138,"Klusiabtw","Th0masHD"],
[28,79,10,1,4.5,19.3,135,"3vildelta","teeq"],
[29,79,9,1,4.78,15.33,129,"Falconly ӝ","Robabz."],
[30,79,10,3,3.5,17,105,"TheAddzZ","Tyler女"],
[31,78,9,0,4.67,16.67,126,"BELAEU","Kaxie"],
[32,78,10,3,3.6,19.1,108,"sine cosine","FuryLegendary"],
[33,78,10,2,4.1,21.9,123,"WTerp","en farlig araber"],
[34,78,10,0,4.9,17.8,147,"Maxoûwû","Nayte"],
[35,77,10,2,3.5,20.4,105,"BlastR","TrainH Alphaa"],
[36,77,9,2,4.44,13.78,120,"Harmii","M10 Pepper"],
[37,77,8,2,4.63,10.88,111,"antwon 67","BL Tickeling"],
[38,76,9,0,3.89,14.44,105,"KC Keolys","hqwkers"],
[39,76,9,2,4,12.44,108,"SqualzK","m a r c o t e"],
[40,76,8,1,4,10.25,96,"pacific aimsi","pacific fledi"],
[41,76,9,2,4,12.89,108,"Nymach","Oblivìon"],
[42,76,9,1,3.89,15.67,105,"ynssnow","Clement"],
[43,76,8,0,5.13,11.75,123,"JustSullyy","xBrookzz"],
[44,75,10,1,3.3,16.6,99,"xPlash.","ohtedi_"],
[45,75,9,1,4.44,12.78,120,"kamiki9x","Adn"],
[46,75,10,0,5,19.5,150,"Hoop3k","Shikuni"],
[47,75,10,0,4.6,19.8,138,"Elqoe","Herettic"],
[48,74,10,1,4.9,19,147,"Osmo","Milan"],
[49,74,7,1,5,7,105,"Harambe uwu","JrgeQ"],
[50,74,9,2,4,14.33,108,"TSE Didzzz","ƒanta"],
[51,74,9,1,4.22,15.56,114,"dDaaaANNnDDAANN","FeRinS"],
[52,73,10,0,4.3,18.2,129,"PnR.","playboyyy006"],
[53,73,10,0,3.5,16.3,105,"lolb0om","CORE Ѱ"],
[54,73,10,1,4.2,22,126,"Kylix","qvycfv"],
[55,73,10,2,4.6,22,138,"Flikk","Ova x8 Yamal"],
[56,73,10,0,4.6,18.4,138,"pack-a-punch333","Letshe"],
[57,73,9,1,3.78,12.11,102,"elokratz","Zrool 尔"],
[58,73,8,2,4.13,11.63,99,"Djani","Cazorla"],
[59,72,8,1,4.38,12.25,105,"CRIPPΑ","Boyer"],
[60,72,10,1,4.2,19.8,126,"Lain V","washed floriixn"]
];
const CARD_H2EU_GF_RAW=[
[1,150,6,1,1.67,4.6,30,"nyhrox","aqua"],
[2,147,6,1,1.67,5.2,30,"Wolfiez","Rojo"],
[3,136,6,0,1.67,7.6,30,"Mongraal","Mitr0"],
[4,130,6,0,1.67,8.8,30,"itemm","derox"],
[5,125,6,0,1.67,10,30,"Skite","Vato"],
[6,122,6,0,1.67,10.6,30,"Deadra","M11Z"],
[7,116,6,0,1.67,11.8,30,"4zr","Noward"],
[8,114,6,0,1.67,12.4,30,"MrSavage","benjyfishy"],
[9,100,6,0,1.67,15.4,30,"BadSniper","Oslo"],
[10,94,6,0,1.67,16.6,30,"Klusia","Th0masHD"],
[11,91,6,0,1.67,17.2,30,"crue","chapix"],
[12,88,6,0,1.67,17.8,30,"Hunter","Kinstaar"],
[13,86,6,0,1.67,18.4,30,"RedRush","znappy"],
[14,83,6,0,1.67,19,30,"Stompy","Tschinken"],
[15,80,6,0,1.67,19.6,30,"Vorwenn","Tuckz"],
[16,77,6,0,1.67,20.2,30,"KBB","YuWang"],
[17,72,6,0,1.67,21.4,30,"Airwaks","Nikof"],
[18,63,6,0,1.67,23.2,30,"fwexY","letw1k3"],
[19,60,6,0,1.67,23.8,30,"7ssk7","Jamside"],
[20,30,6,0,1.67,30.4,30,"Lnuef","Quinten"],
[21,27,6,0,1.67,31,30,"Mexe","Skram"],
[22,16,6,0,1.67,33.4,30,"XXM","Xmende"]
];
const CARD_H2NAC_Q_RAW=[
[1,75,9,1,4,14.56,72,"ookers khai","kyro 〆"],
[2,75,9,2,4.22,15.78,76,"LordNM","Rocaine"],
[3,74,10,0,3.3,16.7,66,"atleij ay лол 7","JLoveMaps"],
[4,74,9,0,4.22,16,76,"Monsieur JTruth","monstcr"],
[5,74,10,1,3.5,15,70,"iNV Blasta","ᴡᴀᴋᴇ ᴜᴘﾠ"],
[6,74,9,2,4.11,15.22,74,"grove 45","J A Y C Y N"],
[7,74,10,1,4,18.3,80,"A1 SIMPLE","2exyy"],
[8,74,9,0,4.67,15.56,84,"Xebiit","laterkidgetgood"],
[9,73,10,1,4.4,18.8,88,"javasㅤ","Clank"],
[10,73,10,0,4.9,22.6,98,"aawedwada","chaotic"],
[11,73,8,1,4.13,9.25,66,"Felix - -","TimburrUwU"],
[12,73,9,1,3.78,12.33,68,"Kad.V2","clarityG"],
[13,73,10,1,5,22.6,100,"c0dgenesis","Janikkkkkkkkkkkk"],
[14,72,10,0,5.2,23,104,"KingTrigg","Ryannx2"],
[15,72,10,1,3.4,17.1,68,"Baltic","ImAstonish"],
[16,72,10,2,4.2,20.7,84,"modtingg","Armond."],
[17,72,10,0,4.4,20.9,88,"Ꭰestroy","4baldy"],
[18,71,10,1,4,19.7,80,"African Tayson.","Shaedess"],
[19,71,10,1,3.4,17.7,68,"muyunbrothers","soulseeker93"],
[20,71,9,1,3.89,13.89,70,"jammyz","Tristan Hipp"],
[21,71,10,1,4.6,22.3,92,"wahleeee","Tahi"],
[22,71,10,1,4.2,19.4,84,"curnballswag","Neferux"],
[23,71,9,1,5.11,17.22,92,"Rhux","pika"],
[24,70,9,0,4.33,14,78,"Perplexii","PRED456"],
[25,70,10,3,3.7,19.6,74,"thrashingsigma","TabzG"],
[26,70,10,1,4.5,26.3,90,"Twitch SpiroK"],
[27,70,10,0,3.8,18.4,76,"DebtCollector23","TSM ImperialHal"],
[28,70,10,1,4,21.2,80,"Criz","Joyboy Shivsy"],
[29,70,10,0,3.6,16.5,72,"LordNM","TWITCH Kodi"],
[30,70,10,2,3.6,20.7,72,"Bandman4D","Jackieski"],
[31,70,9,1,4,16.11,72,"code antics","Cazz"],
[32,70,10,0,4.2,17.4,84,"Grenades","Coop"],
[33,69,10,1,2.9,18.1,58,"infamous .","Sicko is back"],
[34,69,9,0,4.67,16.11,84,"potgxd","MiG Tidav"],
[35,69,10,0,3.7,18.8,74,"Arckite","EmadGG_"],
[36,69,10,1,4.4,21.8,88,"Zyfa ","HEARTT"],
[37,69,9,1,3.78,17,68,"୨שٍّ亗fent亗שٍّ୨","Daevon1x"],
[38,69,10,1,4,19.9,80,"DuhVera","ChrisChinrr"],
[39,69,10,0,3.7,19.2,74,"Clank","Posick"],
[40,68,10,0,4,17.2,80,"Latenci ._.","4PF TiKi"],
[41,68,10,0,3.5,18.1,70,"yung drum","collinfrags."],
[42,68,8,2,4.75,14.63,76,"Girlitsjayy","DaSheepa"],
[43,68,8,0,4,12.38,64,"7eoӝ","TWITCH Kodi"],
[44,68,10,0,3.7,17.9,74,"Dagger1x.","Thorniee"],
[45,68,9,1,3.56,16.33,64,"Native 웃","9 wunder"],
[46,68,10,0,3.4,18.7,68,"KronnyLuhDih_69","BackPackkMatt"],
[47,68,9,1,5,19.22,90,"Unknown Army","BoxedbyGlitch"],
[48,68,10,2,3,18,60,"dopi 3","araㅤ"],
[49,68,7,2,3.14,8,44,"cardilius.","roqz"],
[50,68,10,0,4.9,19.3,98,"noobie Pandda","00 Fiber"],
[51,67,10,0,2.6,14.5,52,"BosWuji","bhegs"],
[52,67,10,0,3.3,20.1,66,"cs2 gamer","Stretch "],
[53,67,10,3,1.8,14.9,36,"KK3ito","aphilly zz"],
[54,67,10,1,3.5,16.9,70,"Hades.","FLAWLΕSS"],
[55,67,10,0,3.3,21.1,66,"Reeloads","jdw"],
[56,67,10,2,2.8,19.2,56,"Hornet","lyejax"],
[57,67,10,0,3.6,20.9,72,"m0b0yy","yurrrrboyjp"],
[58,67,10,0,3.9,18,78,"Luhgnut","Pxlarized"],
[59,67,10,0,3.4,15.8,68,"Bosco00","nicslams"],
[60,66,10,1,4.5,22.7,90,"exuhz","hydrasr"]
];
const CARD_H2NAC_S_RAW=[
[1,102,9,1,6.44,11.78,174,"Slackes","LG Keys."],
[2,99,9,1,6.22,16.44,168,"Ceice","4114 Elevate"],
[3,99,9,3,7.11,18.44,192,"Zayt","Saf"],
[4,94,9,2,5.56,13.56,150,"tetchraa","Eclipsae"],
[5,94,8,3,4.38,4.13,105,"Lanjok","vvPunisher"],
[6,94,9,1,5.11,9.56,138,"roatdw","Boomer BlooTea"],
[7,93,8,2,5.25,7.5,126,"im washed man.","Eros1233345"],
[8,91,9,2,5,14.89,135,"code ronaldo","XXiF"],
[9,91,8,2,5,9.38,120,"big balls brush","CizLucky"],
[10,90,10,1,5.1,15.7,153,"Code Crimz","life ζ"],
[11,89,9,2,5.78,16.44,156,"Clix","Sceptιc lol"],
[12,89,10,4,4.1,19.7,123,"Yung Calculator","Mackwood"],
[13,89,8,3,4.38,6.38,105,"bhegs","HEARTT"],
[14,88,9,1,4.78,14.22,129,"Animal","Aspect"],
[15,88,10,2,6.1,23,183,"Megga","Dubs"],
[16,87,9,1,5,14.78,135,"Ahbramx","Tyler15lol"],
[17,87,10,1,4.6,16,138,"Yung Calculator","shiba sho"],
[18,87,9,4,3.56,11.67,96,"Hornet","tickrss"],
[19,86,8,3,4.25,8.63,102,"Rube Stunwear","phungggggggg"],
[20,86,9,2,4.89,12.89,132,"Kreo","vOGTZIBBY"],
[21,86,8,1,5.63,11.13,135,"zzDmo","Bizzle"],
[22,86,10,3,3.5,16.5,105,"Ninja","Reverse2k"],
[23,85,9,1,4.78,13.56,129,"Bugha","dartlover67"],
[24,85,10,0,4.2,18.2,126,"irregular.","KenKireMoth"],
[25,85,10,1,4.8,20.1,144,"Nate Hill","FunkBomb"],
[26,84,9,2,4.33,11,117,"TF Cole","Legedien"],
[27,84,10,1,5.6,17.5,168,"Fuzzy301","Hogman"],
[28,84,9,3,4.33,14.78,117,"Nut","2exyy"],
[29,84,9,2,5.44,15.78,147,"endIesslyy","Smqcked"],
[30,83,10,0,4.8,18.1,144,"SuperEvan","ItsGodNick"],
[31,83,9,0,6.11,14.67,165,"retired old man","deez"],
[32,83,10,0,5.1,15.5,153,"morgausse","Wristtoocold"],
[33,82,10,2,5.1,23,153,"00 Fiber","Neferux"],
[34,82,9,3,3.78,12.11,102,"graaaaazca","Daxorita"],
[35,82,8,2,5,10.25,120,"clkzy","Tfue"],
[36,81,10,1,4.3,16.6,129,"Aircool","Cadet"],
[37,81,9,1,5.56,18.44,150,"ZexRowwww","Eros1233345"],
[38,81,9,1,4.89,13.89,132,"Nittle","casqer"],
[39,80,8,1,5.25,14.5,126,"72HRS IS HERE","V ivid"],
[40,80,9,3,3.89,16.33,105,"Mikey","I Finessed Yo Bi"],
[41,80,10,1,4.3,16.5,129,"Daevon1x","Ferrrnandѵ"],
[42,79,10,1,3.7,13.3,111,"Young rxchHD","Anordy"],
[43,79,10,1,4.2,21.1,126,"gjergoadnmgioasd","snood jr"],
[44,79,7,2,5.57,7,117,"daeji.","Obviusㅤ"],
[45,78,10,3,3.6,18.3,108,"Nittle","Posick"],
[46,78,9,1,4.22,12.67,114,"The Donfatha","Βίrdy"],
[47,78,10,1,4.3,19.2,129,"josepro2012gmail","steanzz"],
[48,78,9,1,3.56,12.78,96,"シΒαηαηα","Nolanlul"],
[49,77,10,0,4.3,18,129,"Mackwood","Shmecked"],
[50,77,8,0,5.13,11.63,123,"Co1azo","Wyggs"],
[51,76,10,1,3.5,15.7,105,"RogueShark","Dr Flossen"],
[52,76,9,2,4.56,16,123,"JLOVΕ","Jermfn"],
[53,75,10,1,4.7,19.8,141,"PerfectTilt","yMastoris"],
[54,75,10,1,4.1,16.8,123,"inno da god","Assault ک"],
[55,75,10,1,3.6,20.1,108,"Commandment","ItssHighSky"],
[56,75,10,2,3.8,20.6,114,"Liquid POACH","4D Chap"],
[57,75,10,2,3.6,19.1,108,"th3pacifistOTB","Tech With JT"],
[58,75,10,2,4.3,20.2,129,"Jamper","Paper"],
[59,75,10,0,4.6,19.4,138,"Furious","free moncler"],
[60,75,10,1,4.6,16.8,138,"CLG fiona lover","psalm"]
];
const CARD_H2NAC_GF_RAW=[
[1,144,6,0,1.67,5.8,30,"Ceice","Elevate"],
[2,142,6,0,1.67,6.4,30,"Zayt","Saf"],
[3,133,6,0,1.67,8.2,30,"Dubs","Megga"],
[4,128,6,0,1.67,9.4,30,"ZexRow","Vinny1x"],
[5,111,6,0,1.67,13,30,"Slackes","Keys"],
[6,108,6,0,1.67,13.6,30,"MackWood","yung calculator"],
[7,105,6,0,1.67,14.2,30,"Crimz","Spades"],
[8,74,6,0,1.67,20.8,30,"ronaldo","XXiF"],
[9,69,6,0,1.67,22,30,"Lanjok","Punisher"],
[10,66,6,0,1.67,22.6,30,"Nate Hill","Funk"],
[11,58,6,0,1.67,24.4,30,"Tetchra","Eclipsae"],
[12,55,6,0,1.67,25,30,"Clix","Sceptic"],
[13,52,6,0,1.67,25.6,30,"Brush","CizLucky"],
[14,49,6,0,1.67,26.2,30,"Sean","Aydan"],
[15,38,6,0,1.67,28.6,30,"Leno","Barl"],
[16,32,6,0,1.67,29.8,30,"LeNain","Tyler15"],
[17,24,6,0,1.67,31.6,30,"RoAtDW","BlooTea"]
];
const CARD_H2NAW_Q_RAW=[
[1,77,9,1,4.22,12.89,76,"dopi 3","araㅤ"],
[2,76,8,2,4,14.88,64,"highskyǃ","Kytrex"],
[3,76,10,0,4.3,17.5,86,"Adrianッ","Aetherful"],
[4,76,9,0,4.11,15.44,74,"Squirtt.","daddy samster"],
[5,76,10,2,3.8,16.7,76,"Juuki 勇気","skiǃ"],
[6,75,10,1,4.3,20.3,86,"carried by pearl","Toukii"],
[7,75,9,1,3.78,12.44,68,"User-3cf8853a72","W7M Thome"],
[8,75,8,0,5,14.63,80,"jammyz","Tristan Hipp"],
[9,75,10,0,5.1,20.3,102,"Mony","TiGG"],
[10,75,9,1,4.56,15.67,82,"SLICKMON","impakt xx"],
[11,75,10,1,3.9,18.9,78,"Jay","srt frames"],
[12,75,10,0,4.1,18.7,82,"Naga Opsv2","Ezzi"],
[13,75,10,1,3.9,20.6,78,"rieo -α-","Saf"],
[14,74,9,1,4.44,17.67,80,"Triggy Triggy","Hαrmful"],
[15,74,10,0,3.7,15.7,74,"ㅤFranceㅤ","vokrat gosh"],
[16,74,10,0,4,19.4,80,"AA KarimSZN","LühGeeked"],
[17,74,9,2,3.56,14.67,64,"Bzrk301","fullboxedjajajaa"],
[18,74,10,1,4.9,18.9,98,"CoolPenguin48"],
[19,73,8,1,3.63,9,58,"Fulmerlol","Sοfa"],
[20,73,10,0,4.6,17.8,92,"BarBan.","Rift"],
[21,73,10,0,3.5,16.4,70,"OhMyPulse","redshiftㅤ"],
[22,73,10,1,4.4,16.4,88,"aimkey","parm"],
[23,73,10,1,3.2,19.2,64,"B0ppinZ","IBEATMYSLOTH"],
[24,73,10,1,3.9,20.2,78,"Retr0 -α-","nuqlo"],
[25,72,9,2,4.11,14.89,74,"Enthozz","xmeltze"],
[26,72,9,2,2.67,15.22,48,"largeChugga","Clash Royaleツ"],
[27,72,10,1,3.6,18.3,72,"Dordon.","kaysid."],
[28,72,10,2,3.3,19,66,"officialaus","akau_-"],
[29,71,10,1,4,20.4,80,"User-78a3bd6f60","frnzy lucasbyars"],
[30,71,10,0,3.2,16.2,64,"zhex2k","syphx."],
[31,71,9,1,4,16.44,72,"Cented","psalm"],
[32,71,10,1,4.3,18.2,86,"Powur","Unlocalize"],
[33,71,10,1,3.8,18.3,76,"Twitch Maximoe","jaejaejae."],
[34,71,10,1,4.1,20.4,82,"Yagi","frnzy lucasbyars"],
[35,71,9,0,5.22,18.22,94,"skylar 637","Nitrix"],
[36,71,9,0,4.11,14.89,74,"Outcast Litzinio","Reguletor"],
[37,71,10,2,4.4,23.3,88,"Hyn","Sake 999"],
[38,71,10,1,3.5,20.1,70,"ALUCARD P","User-3cf8853a72"],
[39,71,10,1,3.4,20.9,68,"Ramos1x","cohllin"],
[40,70,9,2,3.89,21.11,70,"xVerty","Flufix69."],
[41,70,9,1,3,13.44,54,"lunaatiiiiccc","wxck"],
[42,70,10,0,3.6,17.7,72,"TT KingSauul","TTV Psyckno"],
[43,70,9,1,6.11,21.89,110,"Got Builds","CoolAsianShark"],
[44,70,10,0,3.2,19.2,64,"Outcast Litzinio","AA RektSZN"],
[45,70,9,0,4.33,17.33,78,"Au Fate","Frapai"],
[46,70,9,1,3.78,20.33,68,"Rungir","raei"],
[47,70,10,2,2.8,17.3,56,"TikTok_WKeyGodツ","leno linsanity"],
[48,70,9,0,4.67,18.44,84,"Whip Nasty YT","ﾠﾠﱞﾠﾠﱞﾠﾠﾠﱞ"],
[49,69,9,2,3.78,16.67,68,"KoopTrain","alexbabyineedyou"],
[50,69,10,1,3.5,18.1,70,"door llama","lair champion"],
[51,69,10,0,3.2,17.3,64,"g0dku"],
[52,69,9,1,3.89,15.22,70,"Herrions.","Zoof"],
[53,69,9,0,4,16.67,72,"millianlll","Xycik"],
[54,69,8,2,3.75,11.75,60,"chancepants.","CrankOnLoL"],
[55,69,10,0,3.8,18.1,76,"Knives Is Daddy","1Brecci"],
[56,68,10,1,3.5,22.5,70,"DV ƾ","Code Tendai"],
[57,68,10,2,3.6,22.6,72,"kunichi.","cohllin"],
[58,68,10,1,4.5,22.4,90,"InflatedDuck","fliccfn"],
[59,68,10,1,3.6,18.4,72,"CLG fiona lover","psalm"],
[60,68,10,1,3.6,19.4,72,"Chubbietubs.","Juuki 勇気"]
];
const CARD_H2NAW_S_RAW=[
[1,122,8,2,8.63,5.75,207,"Arkhram","Falconer"],
[2,114,9,1,7.78,9.89,210,"basementwizard27","aydanㅤ"],
[3,110,8,3,7.38,7.63,177,"EpikWhale","4DRStorm"],
[4,108,10,1,6.7,14.4,201,"Jasper 2nd place","User-e9ac38c15f"],
[5,105,10,3,5.5,14.5,165,"Lanjok","vvPunisher"],
[6,103,8,3,6.63,9,159,"Cented","Edgey"],
[7,102,9,3,5.33,12.56,144,"Little","Jay"],
[8,100,10,3,6,17.4,180,"kunichi.","mewmaxxing1337"],
[9,98,9,2,6.44,12.22,174,"Thomuss_","wavyjacob"],
[10,97,10,2,6,17.4,180,"Raпger","SypherPK"],
[11,93,8,2,6.63,9.5,159,"hide on 1x1","barliana"],
[12,93,9,3,5.11,16,138,"youtube vlufn","SiaDark"],
[13,92,10,4,4.5,17.5,135,"thaitanks","Thomuss_"],
[14,92,9,2,5.56,13.44,150,"ΤRose","Retake Spectro"],
[15,92,8,2,5.13,8.13,123,"skylar 637","W7M Thome"],
[16,91,8,3,5.5,10.25,132,"Rhux","pika"],
[17,91,9,2,5.56,13,150,"Persecute.","Nitrix"],
[18,90,8,1,6.13,9.75,147,"muyunbrothers","soulseeker93"],
[19,90,10,4,3.8,16.6,114,"Tavern","vent."],
[20,90,9,3,5.56,17.67,150,"760 Kylo","4DRStorm"],
[21,90,9,1,6.22,13,168,"Kayuun","Fake-Tocata"],
[22,90,10,1,5.6,20.8,168,"AnteeDoot","Kehnys"],
[23,88,10,2,4.8,18,144,"spook 7","spideyy"],
[24,88,10,1,3.8,15,114,"cortex444","77landen"],
[25,88,9,1,5.67,15.56,153,"Extinct","CarsonCBC"],
[26,88,10,1,4.8,16.9,144,"bumboy6.","VersaceApee"],
[27,87,8,2,4.5,9.25,108,"favs","daddy golden"],
[28,86,10,0,6.1,21.9,183,"TT cadenciaa","Venor"],
[29,85,9,1,7.11,16.78,192,"CuteBugMan","Jοnny."],
[30,85,10,3,4.5,17.3,135,"SplashBroAlex","SplashBroAlan"],
[31,85,10,1,4.6,17.1,138,"skylar 637","swork1"],
[32,84,9,1,5.33,13.44,144,"CLG fiona lover","Tocata"],
[33,84,9,2,5,16.22,135,"tyvan","makenbaken9"],
[34,84,9,1,5,15,135,"Sogys.","Howdy"],
[35,84,10,2,5,20.6,150,"krumm._","norcal nugz"],
[36,83,10,1,3.8,15.4,114,"s2 walla","m4 aaron"],
[37,83,10,3,5,20.8,150,"Specs frJosh","Nitrix"],
[38,83,10,1,5.6,21.6,168,"Kenshi","Μadarah"],
[39,83,9,1,4.67,11.22,126,"rio Ψ","Herrions."],
[40,82,7,3,5.71,7.29,120,"Sealmatt.","EpikWhale"],
[41,81,10,2,3.6,17,108,"vvflocka","domo"],
[42,81,9,1,5.22,16.78,141,"5FootPudgeBall","Durag Danman"],
[43,81,9,3,4.22,13,114,"DELBEEFBURRITO29","cesars milizéǃ"],
[44,81,10,1,4.7,17.3,141,"Fulmerlol","Kytrex"],
[45,80,10,1,5.3,21,159,"NioRooch","Nickmercs"],
[46,80,10,2,4,18.9,120,"BaySoldier","SirD-_-"],
[47,80,9,2,5.56,16.67,150,"Persecute.","Riversan"],
[48,80,8,2,4.5,8.38,108,"tt xenonog","flx"],
[49,80,10,0,4.9,18.9,147,"Triggy Triggy","domo"],
[50,79,10,1,5,17.9,150,"V4YNE.","Hαrmful"],
[51,79,10,0,4.7,21.8,141,"bumboy6.","Rehx"],
[52,78,9,0,5.11,16.33,138,"Rehx","ALUCARD P"],
[53,78,10,1,4.1,16.9,123,"OhMyPulse","Tocata"],
[54,78,10,1,4.6,20.5,138,"AG-D cant aim","User-7c05838d2f"],
[55,78,10,0,4.7,17.2,141,"TikTok Lxnfn_","salvo"],
[56,77,10,2,4.3,19.4,129,"Reverse Abérix","Fiscoo"],
[57,77,9,1,4.11,10,111,"Vide ツ","Spicy"],
[58,77,10,2,3.9,18.5,117,"beauqt","koldqt"],
[59,77,10,1,4,19.8,120,"User-dbfcf1bca1","keru zxzx"],
[60,77,9,2,3.89,15.22,105,"JayWick.","DV ƾ"]
];
const CARD_H2NAW_GF_RAW=[
[1,139,6,0,1.67,7,30,"Arkhram","Falconer"],
[2,119,6,0,1.67,11.2,30,"EpikWhale","4DRStorm"],
[3,46,6,0,1.67,26.8,30,"little","Jay"]
];
const CARD_H2BR_Q_RAW=[
[1,76,10,2,3.4,20.7,68,"skiper ay","Francholigan."],
[2,76,10,1,4,17.7,80,"Luks","Cadu"],
[3,76,10,1,4,16.9,80,"Binho On","bad ち"],
[4,75,9,1,3.78,16.56,68,"Francholigan.","Erni7siuu"],
[5,75,9,1,3.22,13.22,58,"some1ab0ve","devest1"],
[6,75,10,0,5.8,21.6,116,"lekmaluco7","Avlr 友"],
[7,75,9,1,4.44,16.33,80,"foox","PROP Ӝ"],
[8,75,10,0,4.8,16,96,"Marechal.","216fb9a2"],
[9,74,10,1,4.4,17,88,"Felipe zuus","Filipe"],
[10,74,8,2,3.13,7.5,50,"lukettyネ","Lufer-"],
[11,74,10,1,4,18.4,80,"einstenfishy","icabbb"],
[12,74,10,0,4.3,16.7,86,"Becho_","SMR Jsme"],
[13,74,10,1,3.7,17.6,74,"Tu madre ネ","COLORADO MASIVO"],
[14,73,10,0,4.4,18.6,88,"DkazL","Zerø-."],
[15,73,10,1,3.4,18.2,68,"ʙᴀʙʏᴇᴘsᴛᴇ1ɴ","diofvǃ"],
[16,73,10,0,3.9,16.7,78,"amirzao","lluventus"],
[17,73,9,1,5.11,15.56,92,"lorax ","ndp"],
[18,72,10,0,3.8,16.8,76,"Steayonn","mojakhub"],
[19,72,9,0,4.22,14.67,76,"g ay лол1","Make 神様"],
[20,72,9,1,4.11,14.22,74,"080340","bisicletovich"],
[21,72,9,1,5,17.67,90,"Lucoǃ","loqqty"],
[22,72,9,2,4.11,17,74,"Caduzin","PoPoT0_"],
[23,72,10,2,2.9,14.5,58,"calangolove","アキザShowtime"],
[24,72,10,2,3.4,17.9,68,"facu on top","Gustyx 7"],
[25,71,10,1,2.8,19.5,56,"User-86673d30c1","XSET ZERA L2"],
[26,71,9,1,3.56,14.33,64,"xeat Makhachevǃ","Broggyx"],
[27,71,9,0,5,17.78,90,"Cuɀ","Filipe"],
[28,71,9,2,4,14.56,72,"lau7a-_-","Mirkσ"],
[29,71,10,1,4.8,18.3,96,"lekmaluco7","Exileyd"],
[30,71,10,0,3.7,21.5,74,"30fps y un sueño","Kaygro02"],
[31,71,9,1,4.33,14.33,78,"Diamond","Cuɀ"],
[32,70,10,3,2.8,20.1,56,"xxxxǃǃǃǃ","Revert -cr-"],
[33,70,10,2,4,20.6,80,"la passion aaaaa","wype"],
[34,70,10,1,3.8,18.6,76,"Lekao 22k","pedrzooo"],
[35,70,9,1,2.67,13.22,48,"kingpapa iii","Maldini Maldini"],
[36,70,10,0,3.3,17.9,66,"EZezinN.","1chances99loss"],
[37,69,10,0,4.7,21,94,"thz1njesuS","KING"],
[38,69,10,1,3.3,16.9,66,"KnigthErrôneo","caueeeeeeeeeeeee"],
[39,69,10,0,3.2,14.8,64,"SabrinaCarpenteʀ","strafezoldyck"],
[40,69,9,1,3.11,13.56,56,"亗ｲのｲﾉ亗","xXLaManuelaXx"],
[41,69,10,2,4.6,22,92,"Bellakera420","SebitAsxs"],
[42,68,10,1,3.8,17.5,76,"JeaderSSJ","TCH Chigua ヅ"],
[43,68,10,0,4.1,20.7,82,"Tomi204","CUIDADO CONMIGO"],
[44,68,10,1,3.1,19,62,"Redlee","Gabiruga JM"],
[45,68,10,0,3.9,16.3,78,"Sanku","ИEWT"],
[46,68,10,1,4.1,20.5,82,"Gatts x","Kzn"],
[47,68,9,0,4,14.78,72,"levi barril","pvS 999"],
[48,68,10,0,3.4,17,68,"Guri de CWB","dıgo"],
[49,68,10,2,3.7,19.2,74,"vargass ᵛᵖ","ＩｔｚＢｌｏｏｐｙ"],
[50,68,10,0,3.7,19,74,"DkazL","vichinpillo"],
[51,67,10,1,3.3,14,66,"funizera","nar0n TTV"],
[52,67,9,0,3.44,14.44,62,"Motitarica","toñuel"],
[53,67,9,1,4.44,18.44,80,"Frosty ","13K ta de volta"],
[54,67,8,0,4.63,12,74,"rvSoz","hrkzer4"],
[55,67,9,1,3.78,18.67,68,"meguelzin","Bentozx."],
[56,67,10,1,3.7,20,74,"repoIInqs.","Twitter Snuupyy"],
[57,67,9,1,3,14.78,54,"Eslipnot 32","Chipi TS3"],
[58,67,10,2,4.4,23.6,88,"Febas Banzaking","Nocturnoz GT-R"],
[59,67,10,1,3.7,17,74,"ˡᵒʸᵃˡᵗʸツ","Iván ⓣⓣ"],
[60,67,9,1,3.44,16.56,62,"Denji え","FNP Zikaue"]
];
const CARD_H2BR_S_RAW=[
[1,144,8,4,10.38,8.25,249,"xOwNSpamPiumPium","K1nG"],
[2,120,8,2,9.5,11.63,228,"pfzinhu","Nicks"],
[3,115,10,3,7.7,17.7,231,"santidead22","zEkÔ"],
[4,113,9,3,6.56,10,177,"leleo","gørdiNN9j"],
[5,112,10,2,8.4,21.4,252,"INTZ DRAKONZ","blackoutz"],
[6,111,9,3,7.56,14.44,204,"tito caIderon","Twayko"],
[7,110,8,4,7.88,10.5,189,"guardiao BJJ 22","GusTavox8"],
[8,109,8,1,8.75,11.25,210,"femmycs","187 ـ رئيس الوزر"],
[9,108,10,2,6.8,13.5,204,"Clipnode 28","Nothing Ω"],
[10,106,8,2,7.88,9.88,189,"Prodigy 33","KING"],
[11,105,10,3,5.8,16.8,174,"mystickftw.","ᵐᵃˢᵗᵉᵉʳ"],
[12,105,10,2,6.6,17.9,198,"O Reira","Uncle Turlet"],
[13,104,8,2,8.38,14.25,201,"マ字Jリ","Twitch Leobas"],
[14,103,10,3,6.1,16.3,183,"stellar snx","Berteyr"],
[15,100,10,0,6.4,16.7,192,"Snowspampiunpiun","Avlr 友"],
[16,99,10,1,5.3,13.4,159,"Pulga","TØNY THE CREATOR"],
[17,98,8,3,6.63,12.63,159,"njrⓐⓢשٍّ","Damage.-13"],
[18,97,9,3,5.56,12.89,150,"C9 psychopira9x","technoviking46"],
[19,97,10,2,5.6,19.6,168,"veloso 360hz","ＩｔｚＢｌｏｏｐｙ"],
[20,94,10,0,6.7,18,201,"Zugorow","w um"],
[21,93,10,2,4.9,18.9,147,"vitinskrt","t0nygol"],
[22,92,9,1,5.89,13.44,159,"4liciaontop","ageplayin w dada"],
[23,91,9,0,6.33,13.89,171,"mstzera1","w estevin"],
[24,91,8,2,5.63,8.25,135,"Lasers","iguin pocas bala"],
[25,91,9,0,5.56,11.78,150,"fakkz endless","el sney equis pa"],
[26,91,9,0,6.11,15.44,165,"yfire","GabeCFN"],
[27,88,10,1,5.8,21.5,174,"sнeco","rgv ₚᵢₜₜ"],
[28,88,10,1,5.4,16.8,162,"troya","Andreoli-"],
[29,88,10,1,6.7,19.8,201,"Febas Banzaking","ＩｔｚＢｌｏｏｐｙ"],
[30,87,10,2,4.8,17.7,144,"Twitch.Nocturnoz","Febas Banzaking"],
[31,86,8,1,6.88,13.63,165,"Untouch 240hz","aguszk."],
[32,85,9,1,5.11,13.78,138,"Lazer 17SP","xKovak"],
[33,85,10,2,5.9,21.9,177,"Chapo_ッ","Shayoutzzz"],
[34,85,10,2,4.8,16.1,144,"Zqullin","tuusa-"],
[35,85,10,2,3.2,12.7,96,"Lowyi_zx","Gary Jr7"],
[36,84,9,2,5.56,15.78,150,"ztfdw9k8u5r7z2","i am dizzy."],
[37,83,8,2,4.38,12.63,105,"teupapaiッ","teruel lul"],
[38,83,10,1,4.2,14.7,126,"ZuiCx1","Nahue507."],
[39,83,9,2,4.78,13.44,129,"exKzz7","OPai"],
[40,82,10,1,5.5,17.6,165,"Ezterminia","Ghostinh01"],
[41,81,9,1,4.78,18.56,129,"Bigasftw","ttv champzeraa"],
[42,81,9,2,4.33,11.44,117,"ﾠﾠﾠ ﾠﾠ ﾠﾠﾠﾠﾠﾠ","sohan666."],
[43,81,10,2,3.5,17.8,105,"tortugafishy","vichoobtw"],
[44,81,10,0,4.5,15.4,135,"NúckLes","mero. J R"],
[45,80,10,2,3.9,18,117,"Bryan","sanctuary"],
[46,80,9,3,3.33,13.89,90,"Hitagi Gahara","Incvs"],
[47,80,10,1,5,20.3,150,"SOU ORIGINAL","Luks-.Ssj"],
[48,80,10,2,4.6,27.9,138,"Marechal.","Barrin."],
[49,80,9,1,4.33,13.33,117,"kalluto afoito","Iuka doncic"],
[50,80,10,0,4.7,17.8,141,"Hitagi Gahara","nkøø"],
[51,78,10,1,5.3,23.5,159,"zytlee","dyfsssj"],
[52,78,8,0,4.88,10.38,117,"sгмaтi 4刀","VairoV."],
[53,78,10,0,4.2,17.6,126,"Scream is back","hMbox"],
[54,78,10,1,4.6,18.4,138,"BerИardZᶜʳᶠ","Gon IIII"],
[55,77,9,2,4.67,16.33,126,"Palermo","riqueessj."],
[56,77,10,3,3.4,18.8,102,"Thg","Hoskes"],
[57,77,8,2,3.88,11.63,93,"lilgiela33","foronezx"],
[58,77,8,1,5.13,14.63,123,"Luks","vc é muito ruim1"],
[59,76,9,1,4.11,15,111,"Dreus2","Beatsburn"],
[60,76,10,0,4.2,18.5,126,"ÏŒdf4ʝ","axeddy"]
];
const CARD_H2BR_GF_RAW=[
[1,44,6,0,1.67,27.4,30,"xOwN","k1nG"],
[2,21,6,0,1.67,32.2,30,"pfzin","Nicks"],
[3,18,6,0,1.67,32.8,30,"wisheydp","Gustavo"]
];
const CARD_H2ASIA_Q_RAW=[
[1,80,7,2,5.14,8,72,"Twitch_LiseNoob","zMuGï"],
[2,80,9,1,5.78,16.33,104,"Magic of min10ns","Tempura 3"],
[3,79,10,0,4.2,17.5,84,"CR.UyuRiru","CR.Francisco"],
[4,78,8,1,4.75,9,76,"4ndy","ᴼʰʲʸᴼⁿᵀᶦᵏᵗᵒᵏ"],
[5,78,8,1,5.38,9.5,86,"WGS MacChan","psyduck- -"],
[6,77,9,3,4.11,14,74,"Tonbocub","zepher y"],
[7,77,6,2,6.33,10.5,76,"DSS21511","User-name 55213"],
[8,76,9,1,4.89,15.89,88,"Sunfloweboy","King.Sone"],
[9,76,10,1,3.5,18.4,70,"Qjac","RazL"],
[10,76,10,2,4.3,18.7,86,"Overlordism","KinG_1peace"],
[11,75,10,2,4.2,19.1,84,"SZ KilluA","Kenshin1xx"],
[12,75,10,2,3.8,19.4,76,"Sonic_green88","Refret FN"],
[13,75,10,1,5,22,100,"overStun.","Gwynble1dd."],
[14,75,10,0,4,13.5,80,"yannieS Ψ","父Kaptnᵁʷᵁک"],
[15,75,10,1,4.3,17.1,86,"Chocoluv"],
[16,74,10,1,4.6,20.8,92,"AlterEgo.Feezle","Mevǃ"],
[17,74,8,2,3.13,7.25,50,"ZETA Nisidera","Kurara"],
[18,74,10,0,4.6,16.8,92,"yunyache32","토인 동원"],
[19,74,10,1,4.9,23,98,"LemonTeaSuki","sprCRANEL"],
[20,74,10,0,3.8,17.6,76,"Sickerz .","frenz ."],
[21,74,10,0,3.4,16.5,68,"goopygash","izzizolimamo둘"],
[22,74,9,1,3.11,11.56,56,"Cold 3s","Bunta0n0"],
[23,74,9,1,4.56,13.78,82,"Jozya","ᴼʰʲʸᴼⁿᵀᶦᵏᵗᵒᵏ"],
[24,74,9,1,5,16.78,90,"ロケリ界のタケクボ","ちきんぬーぶ."],
[25,73,10,0,4.1,18.2,82,"lnvoke","wisa"],
[26,73,10,2,4.3,19.3,86,"Maesar","ᵗʳᵒ"],
[27,73,9,2,4.67,18.78,84,"aMetUbu6","TIKTOKまいざくらで検索"],
[28,73,9,1,4.33,13.22,78,"taysoniya","User-b10a6fd8a6"],
[29,72,8,1,4.75,12.88,76,"KINGzzzzx","Velody1"],
[30,72,9,2,3.67,15.11,66,"Shiras","アニマルまさきプラネット"],
[31,72,9,1,3.44,13.78,62,"aqeel","GlizzyGobbler500"],
[32,72,10,2,2.8,19.5,56,"しのぶo","kichi43"],
[33,71,9,1,4,16.56,72,"FPX 01","SV_peach.CN"],
[34,71,10,1,4.1,17.9,82,"Depppp.","valorant grinder"],
[35,71,8,2,3.63,9.25,58,"KUREN","Tatto"],
[36,71,10,0,3.9,16.8,78,"zepher y","黄金米青子"],
[37,71,10,1,4.9,19.2,98,"三笠的含义还是三笠喲","我日你哥你"],
[38,70,10,2,3.6,19.2,72,"aMetUbu6","wxyz22"],
[39,70,10,2,3.1,20.8,62,"Ortensia Gepard","なんかのプロ"],
[40,70,9,2,2.56,14.78,46,"神之愛","KOR Destyle"],
[41,70,10,1,3.8,17.9,76,"Cringemenッ","ねざぁ"],
[42,70,10,1,4.4,20.7,88,"Hazar HaiL","Maya21h"],
[43,70,10,0,3.7,20.2,74,"Lettuce","ちんぱん 氷鬼"],
[44,70,10,1,3.3,19.1,66,"pisyat 2","Scrupik"],
[45,70,10,1,4.9,20,98,"Demonぱん子","Alice"],
[46,70,10,2,3.8,20.2,76,"Daddy.fld","KuronozZ"],
[47,70,10,1,3.2,18,64,"Daizuii","retired volten"],
[48,69,10,1,4.6,19.1,92,"FUDEN.ふでん","Macyfishy"],
[49,69,10,1,3.3,16.4,66,"にじーです","GULlCK"],
[50,69,10,1,2.6,16.9,52,"Stel RaMulus"],
[51,69,9,1,3.78,16.89,68,"SWIFT Taytan","くるくるさしごぶらんく"],
[52,69,10,2,3,16.4,60,"AEOLSK","l_l_1DA"],
[53,69,10,1,3.4,18.1,68,"ふらっと爺","K-DINGDINGDONG"],
[54,69,10,0,3.5,17.8,70,"オワワワワワ","huyusamu_i"],
[55,69,10,1,4.1,18,82,"Qjac","TIKTOKまいざくらで検索"],
[56,69,9,2,4.33,18.67,78,"ゆーざーＡ","メンタンピン ドラドラ 満貫です"],
[57,69,10,0,4.4,20.7,88,"도랄팤fan","gold pump203"],
[58,68,10,1,3.6,22.1,72,"Ruri","Shinckyfishy"],
[59,68,10,0,4.4,20.3,88,"KinG_1peace","User-6d35cb7549"],
[60,68,10,0,3.5,18.6,70,"FLUID voke","visqu1n"]
];
const CARD_H2ASIA_S_RAW=[
[1,125,9,2,8,12,216,"NewbeeXXM","要杀我的随便来"],
[2,121,10,1,7.5,15.5,225,"SexyBoy","backhou- -"],
[3,118,8,2,8.5,6.38,204,"Washed P1ay2r","Banny 運"],
[4,117,10,3,7.2,16.1,216,"JuneKstar","Medusa"],
[5,117,9,0,8.67,11.56,234,"TOP Puzz","매생이4"],
[6,113,7,2,8.57,3.86,180,"MidniteStars","TriggerQQ Uniq"],
[7,110,10,2,6.4,16.8,192,"Peterpan","Spidermon"],
[8,106,10,3,5.4,15.7,162,"FNturtlesurfer","Chill AIMer"],
[9,103,10,2,6.2,18.8,186,"Swillium","ALBA-A fa1zzy"],
[10,101,10,1,5.9,16.9,177,"Fire","Maufin"],
[11,100,8,3,6.63,9.63,159,"Ruri","RizArt"],
[12,100,10,2,5.8,19.7,174,"Hood.J","HardCarry"],
[13,100,10,1,5.9,13.2,177,"FA Horde","xieniajw"],
[14,99,10,1,6.7,17.5,201,"ragna","Bob"],
[15,98,10,1,5,14,150,"Ortensia Gepard","LwxFN"],
[16,96,10,2,5.4,16.9,162,"nagnapnag","GoRou-w-"],
[17,95,9,2,4.89,13.22,132,"tsunami zzz","WANG Joker"],
[18,95,9,1,5.78,13.33,156,"rehx no.1","Tonbocub"],
[19,94,9,1,5.56,11.67,150,"Weibo_ShenLan.CN","ADUO21312"],
[20,94,9,2,5,10,135,"97ut65fewa","Dabzi."],
[21,94,8,2,5.75,10.38,138,"WGS MacChan","TOXIC_GRINGO15"],
[22,93,10,2,5.1,16.4,153,"SexyBoy","bloom"],
[23,93,10,1,6.4,17.4,192,"SV_hair.CN","我日你哥你"],
[24,92,9,2,5.78,13.22,156,"senkrad99","ZAP.ZAP.ZAP"],
[25,91,8,1,6.75,10.5,162,"CR TOPPY XD","totot_Mix"],
[26,91,10,1,5.4,17,162,"T1 SinOoh 666","HardCarry"],
[27,91,9,2,5.89,16.56,159,"wasp nomfu","AlterEgo.Feezle"],
[28,90,10,0,6.6,22.5,198,"Aimhero_o.","include_557"],
[29,90,9,3,5.56,15.67,150,"DRX Zest","GE Eraser"],
[30,89,10,3,4.6,17.3,138,"FL CLZ","ふぉーとないと勢"],
[31,87,9,1,5.78,13,156,"Arius","zMuGï"],
[32,87,10,1,5.1,17.7,153,"babestay","Newbee -"],
[33,87,10,4,4.2,17.8,126,"ДЕНИС БОГ ИГРЫ","хипcтер"],
[34,86,7,0,7,6.86,147,"Macyfishy","Shinckyfishy"],
[35,85,10,3,4.2,16.5,126,"TOXIC_GRINGO15","Jinu-"],
[36,85,10,1,4.8,16.1,144,"Malobin","7Months Galassia"],
[37,85,10,1,5.1,18.1,153,"Maehwa.","bloom"],
[38,85,9,0,5.67,16.33,153,"AT Kushi","Sªrüzÿ"],
[39,84,10,1,4.6,16.9,138,"YESEONGHO","N1nGD0- -"],
[40,84,10,2,4.2,17.1,126,"Nephrite","bykn"],
[41,84,10,1,5.6,20.3,168,"COCONUTSIR_","ehre zuko"],
[42,83,10,1,4.9,23.2,147,"T1 SinOoh 666","Hood.J"],
[43,83,10,2,5.1,19.2,153,"middko2lfy","C9_Duty"],
[44,83,9,1,5.11,16.67,138,"Yusea","マッチョラマ"],
[45,83,10,2,4.1,16.5,123,"CR.Arisakaaa","CR Cornn"],
[46,83,10,1,5,18.5,150,"世田谷育ち","DFM_Hamuppi"],
[47,83,10,1,5.1,18.1,153,"kobayashi mayo","そふぃあだよおおおおおお"],
[48,83,10,0,5.4,17.3,162,"T1 SinOoh 666","Envy"],
[49,82,9,0,5.22,13.56,141,"New Gaymer","아기고양이응애용"],
[50,82,10,1,5,15.3,150,"なんかのプロ","Albedo"],
[51,82,9,2,4.78,15.44,129,"FNturtlesurfer","CR スカっとスカスカ"],
[52,82,10,1,5.6,18.7,168,"青い鳥愛護協会理事長らりーばーど"],
[53,82,10,2,5,17.3,150,"Jeongwoo 運","zepher y"],
[54,81,9,0,5.22,13,141,"GGK_ing","SEN Zest"],
[55,81,10,2,5.8,21.1,174,"hibitk","Rupaǃ"],
[56,81,10,0,5.5,18.6,165,"SV_peach.CN"],
[57,81,10,1,5,20,150,"wasJAG","Jinu-"],
[58,80,10,2,3.8,19,114,"Maehwa.","backhou- -"],
[59,80,10,1,4.2,16.4,126,"Komech-D-Zoldyck","Albedo"],
[60,80,10,1,5,23.2,150,"轮转转","一只阿星吖"]
];
const CARD_H2ASIA_GF_RAW=[
[1,97,6,0,1.67,16,30,"Scarlet","bell"],
[2,35,6,0,1.67,29.2,30,"Puzz","Ming"]
];
const CARD_H2OCE_Q_RAW=[
[1,77,10,1,4,17.7,80,"Twitch MythOCE","StubzzZ."],
[2,77,10,1,4.5,19.5,90,"soggyporridge89","Fungy Chungy"],
[3,77,10,1,5.3,21.8,106,"desire 米","123456789123abc1"],
[4,77,9,1,4.78,20.11,86,"hrst","vaḻ"],
[5,77,10,1,4,13.1,80,"binklebonkles","User-41307c5580"],
[6,76,9,1,4.56,13.78,82,"Χerty","UnQ TGVee"],
[7,76,10,0,4.2,17.9,84,"saberr ツ","AUS_SWAGG"],
[8,76,9,2,5,18.33,90,"Vincey","westy.-"],
[9,76,10,0,4.3,17,86,"vZmdmas","dictator dǃngle"],
[10,76,7,1,4,4.57,56,"bandana","conc"],
[11,76,10,0,4.3,19.3,86,"M1","Juzgod1"],
[12,75,9,1,4.56,15.89,82,"enligh.t","MakiMasterBones"],
[13,75,10,0,4.5,18.1,90,"sMELma69","Cheeezzy."],
[14,75,10,1,5.1,20.4,102,"esky Ψ","LawrenceMelvin"],
[15,75,10,1,5,25.2,100,"AV.","xilax-diamswag8"],
[16,74,10,2,4.4,19.1,88,"Lapex YT","cat flobber"],
[17,74,10,2,4,19.6,80,"g natanyo","Jack_Sparrow2007"],
[18,74,9,1,4.11,13.44,74,"kronsgirl","Эйнштейнн"],
[19,74,10,1,3.8,19.3,76,"BACKYARDIIGAN","Jax1wnl"],
[20,74,10,1,5.2,18.6,104,"ttvFrendo"],
[21,74,10,2,4.2,18.3,84,"Barbuxx.","Lunr"],
[22,74,9,0,4.78,18.56,86,"User-54729151d2","callatemmg"],
[23,73,9,1,5.11,17.89,92,"Biocyder","vRxthless"],
[24,73,10,0,5.3,20.2,106,"clipslool","ORBIT Spin"],
[25,73,10,1,3.8,20,76,"Lucid.","chonkyCrocodile7"],
[26,72,10,1,3.5,16.6,70,"willcuzz","strafecuz"],
[27,72,9,1,3.33,12.78,60,"synthss","Джесc."],
[28,72,10,0,4.1,17.9,82,"kгiz","bigdoodler"],
[29,72,10,2,4.7,24.4,94,"Lynch .","stndrd-"],
[30,72,10,0,4.5,18,90,"Smeeferino","Mingovi"],
[31,72,9,1,3.44,15.56,62,"Flexah_","mabs ."],
[32,72,8,1,4.88,14.75,78,"Vink","phluxzy"],
[33,71,10,0,5.9,23.3,118,"samuel the 17th","idc if shes 1ツ"],
[34,71,10,3,3.6,15.9,72,"tysonjames","TwitchSmitherzz"],
[35,71,10,1,3.6,22.6,72,"HACK","Sir yon wick"],
[36,71,10,0,4.5,20.7,90,"Thradoz","οhmylοrdylοrd"],
[37,71,8,1,3.5,8.88,56,"Snakebite_VM10","finwaa"],
[38,70,9,1,4.78,18.44,86,"Serenn","Tekmarr"],
[39,70,10,0,3.2,17.4,64,"AeroOCE","soul.ㅤ"],
[40,70,9,2,4.44,18.11,80,"Freska -","amazedtm"],
[41,70,9,0,3.22,12.56,58,"dolf","Sevenn."],
[42,70,9,2,2.89,12.89,52,"Ornzy.","ORNZY"],
[43,70,10,0,4.3,23.2,86,"spoi","delkud6v"],
[44,70,10,2,3.7,19.2,74,"Use Code Serpent","ॐॐvvॐॐ"],
[45,69,9,1,2.78,12,50,"Unc Meltzy","Touchy ツ"],
[46,69,10,3,3.4,17.5,68,"ghosting 様","Jamieegod"],
[47,69,10,1,3.5,21.4,70,"sylfs greasy hog","Naaaaan Bread"],
[48,69,10,0,4.2,19.3,84,"lIlIlIlIIlIlIIII","Open 7 Days"],
[49,68,10,2,3.1,17.6,62,"Yoսr Goth Mommy","Jax1wnl"],
[50,68,10,0,3.7,15.8,74,"Biocyder","Shaggyャ"],
[51,68,10,0,3,18.2,60,"rushedache32","loudgoblin1"],
[52,68,10,1,3.5,16,70,"beny","turps"],
[53,68,10,1,3.3,19.8,66,"ideal","twitch.sethylad"],
[54,68,10,0,4.8,21.1,96,"Wotcha.","C9 Death"],
[55,68,10,0,4.2,18.1,84,"200IQ-KING-_-","srw uchiha"],
[56,68,10,0,3.9,18.2,78,"sikǃ","50ㅤ"],
[57,67,10,0,4.6,15.9,92,"BOLΑ","Larsinz"],
[58,67,10,0,4.2,20.6,84,"WRA booher","ttvFrendo"],
[59,67,10,0,4,18.7,80,"Kyzah washed lol","38 gravenberch"],
[60,67,9,0,4.56,18.89,82,"m4shd","shaaaaanebk"]
];
const CARD_H2OCE_S_RAW=[
[1,159,8,5,12.75,6.38,306,"volx","Yoink Meister 28"],
[2,132,10,3,8.3,15.1,249,"the 13th apollo","Gheez"],
[3,128,7,3,10,2.57,210,"serpppppppppp","jap8n"],
[4,121,10,2,7.8,15.6,234,"Jahlyn","skyʬ"],
[5,119,10,1,7.1,14.9,213,"Mangozk","trapped"],
[6,113,9,3,7,13.33,189,"worthy","GANCHO"],
[7,111,9,3,6.67,14.44,180,"rev0c.","Twizz.-"],
[8,111,9,4,5.56,9.11,150,"X2twins Jordan","x2twins Jesse"],
[9,110,9,3,7.33,18.11,198,"Jynx","shyshyshy ."],
[10,108,9,2,7.22,10,195,"ronniestats","slaya"],
[11,107,10,2,6.1,16.9,183,"TwitchJordyx3","rαdius."],
[12,105,8,2,7.88,10.25,189,"0G Cray0n","coltini jenkins"],
[13,101,10,3,5.7,16.8,171,"willcuzz","straafe"],
[14,100,8,1,6.25,6.25,150,"Free R Kelly","Tyhu_"],
[15,100,10,0,7.1,16.6,213,"RepulseGod","Psyper"],
[16,99,10,1,6,15.3,180,"cracksfn 74","Loyal Eshz 11 真"],
[17,99,9,3,4.56,10.67,123,"Sorif","Raaq ㅤ"],
[18,99,10,2,5.5,15.8,165,"desire 米","I_QUIT_THE_GAME"],
[19,97,10,2,5.1,17.7,153,"minkin 8","Rel"],
[20,96,9,2,6.67,14.11,180,"Youtube.Kayez","Flackovski"],
[21,96,10,1,5.3,12.9,159,"Cliqahh","Shaggyャ"],
[22,93,9,2,7,18.22,189,"I_QUIT_THE_GAME","cat flobber"],
[23,93,9,2,6.44,16.78,174,"Lapex YT","alecc"],
[24,91,9,2,6.56,20.11,177,"mrfreshasian","Lachlan "],
[25,91,9,2,5.33,12.78,144,"g natanyo","spraz."],
[26,89,9,2,5.78,14.33,156,"Yoսr Goth Mommy","vF m1nt"],
[27,88,9,1,5.89,14.56,159,"ty-005","50ㅤ"],
[28,88,9,2,4.78,11.22,129,"gaylaxies","Gosu_Keith"],
[29,88,9,0,6.22,16.44,168,"aerion 99","XXXluketaci0n"],
[30,87,10,0,5.8,18.3,174,"alecc","Mingovi"],
[31,87,10,2,5.7,19.7,171,"spoi","who dares wins"],
[32,87,9,2,4.22,11.33,114,"Quann","Tyraxe"],
[33,87,10,2,5,22.7,150,"raptahcuz","trashcan clints"],
[34,87,10,1,4.8,17.2,144,"BACKYARDIIGAN","itscontest"],
[35,86,9,1,5.78,15.44,156,"Lucid.","User-433af99d1f"],
[36,86,10,2,5.6,17.9,168,"Rel","mrfreshasian"],
[37,85,8,2,6.38,14.88,153,"Criser","hillo 7"],
[38,84,10,2,4.9,16.6,147,"Derek ChAuvin","xavier"],
[39,83,10,0,5.4,20,162,"RepulseGod","mrfreshasian"],
[40,83,9,1,4.56,13.22,123,"Hersh","Sync"],
[41,82,8,1,4.5,9.75,108,"feenbuca","sio tzu"],
[42,82,10,2,4.8,17.5,144,"bàrlow","Tsuǃ"],
[43,82,10,1,4.7,20.7,141,"DrillaGorilla55","hsad78sa7h8dasd7"],
[44,81,10,1,4.6,19.9,138,"binklebonkles","desire 米"],
[45,81,10,2,3.7,17.7,111,"tuxoner","Hussy"],
[46,80,10,3,3,16.1,90,"pok","NotBhedAndy"],
[47,80,9,2,5.11,25.67,138,"Swerl","EarningsCheck"],
[48,80,10,0,4.4,17.9,132,"FURY Krule","bigdoodler"],
[49,79,10,0,4.5,18.2,135,"Link.ㅤ","hillo 7"],
[50,79,10,4,3.2,17.2,96,"chonkyCrocodile7","Jax1wnl"],
[51,78,10,0,4.8,16.1,144,"Jamieegod","coltini jenkins"],
[52,78,9,1,3.56,13.89,96,"Twitch.Altro47","bugnutz"],
[53,78,10,1,4.6,16.8,138,"67INGHAPPINESS","SpeedyND"],
[54,78,9,1,4.33,14.67,117,"Predep","Doolesworth"],
[55,78,10,2,4.3,19.5,129,"nunkerr","UntoldSkillz"],
[56,78,10,1,4.4,20.2,132,"minzin.","sikǃ"],
[57,78,10,0,5,17.3,150,"2AMa Aftersky","Link.ㅤ"],
[58,78,9,1,4.78,14,129,"Spizza","koswy"],
[59,78,10,0,4.4,18.6,132,"Price","SpeedyND"],
[60,78,10,1,4.2,18.4,126,"AfricanPancakexo","james burnz"]
];
const CARD_H2OCE_GF_RAW=[
[1,102,6,0,1.67,14.8,30,"serpennt","Hype"],
[2,41,6,0,1.67,28,30,"volx","parpy"],
[3,13,6,0,1.67,34,30,"CoverH","Twizz"]
];
const CARD_H3EU_Q_RAW=[
[1,151,9,3,9.78,10.22,176,"Mongraal","Mitr0","Benjyfishy"],
[2,130,7,2,7,2.29,98,"fwe","Letw1k3","Domentos"],
[3,119,8,2,9.63,10.38,154,"Tschinken","Stompy","Aqua"],
[4,114,8,4,4.88,5.5,78,"Tohaj","BELAEU","Kaxie"],
[5,113,8,2,5.88,6.63,94,"Hunter","Skite","Kinstaar Aim.exe"],
[6,111,8,3,6.75,9.88,108,"Pr0vokd .","SOL Noward","fake vorwenn"],
[7,106,9,1,5.44,11.78,98,"elokratz","Klusiabtw","Th0masHD"],
[8,104,8,1,6.25,6.63,100,"OG luKi3","Smileyy","artor"],
[9,102,10,2,6,12.6,120,"Kiryache32","Freemok","ZXC KongTV"],
[10,102,10,1,6.6,13.3,132,"Osmo","Kylix","qvycfv"],
[11,99,9,2,5.67,12.22,102,"Samzahef","yconelsiete","Nikof"],
[12,98,7,2,6.29,9.43,88,"Belvid.","Nayte","Magin"],
[13,98,10,1,6.5,15.8,130,"Pez1x","Endretta","я Pate1k"],
[14,96,9,2,4.67,10.89,84,"BEAST","Refsgaard","haxcore."],
[15,96,8,1,4.88,7.63,78,"IDrop","Flikk","zodieu yt"],
[16,95,9,2,4.56,9,82,"Stormyrite","Siberiajkee","Putrick"],
[17,95,9,0,7.22,13.89,130,"faze_20packngts","fellexyz","Nyhrox"],
[18,94,10,1,5.2,13.5,104,"snap","Cazorla","PHOOL DEL REY"],
[19,94,9,1,5.44,11.11,98,"nate -iwnl-","Merijn","NakiryeFreeze-_-"],
[20,94,8,3,3.88,8.75,62,"AL4N","edra","فانبويميثك"],
[21,92,10,1,5.3,14.8,106,"RedRush","Zyppan.","LeftEye71"],
[22,92,8,1,4.38,8.88,70,"Misery","hiuqldfy7sd7f","Dealersz1"],
[23,91,10,1,4.3,13.4,86,"PnR.","JannisZ","Rijas77"],
[24,90,9,2,3.33,11,60,"itemm","Derox","Rojo"],
[25,90,8,1,4.88,7.25,78,"Crue","lol lmao rofling","Chapix"],
[26,90,10,1,4.5,13.2,90,"Mexe","Lindstrom3","Skram"],
[27,90,10,2,5.1,14.8,102,"pack-a-punch333","wolfiez","Letshe"],
[28,89,10,2,3.5,11,70,"Aimi Morii","zemee","Jjεssε"],
[29,89,9,1,4.89,10.89,88,"Lnuef","Tce TomeK1942","AstroSMZ"],
[30,89,9,0,5.22,12,94,"Swaggi 07","xKumu","Imsdalo"],
[31,88,8,1,5.75,9.88,92,"Andilex","Orkhx","SqualzK"],
[32,88,8,1,3.13,5.38,50,"Luuu 90","nuggison","Coffeh"],
[33,88,9,0,4.44,9.44,80,"B2ZDEHH","Izenmaa","Youtube Pentah"],
[34,88,10,0,4.9,11.3,98,"Trixou is back","M11Z","Antorak_"],
[35,87,9,1,5.33,10.33,96,"fym hamster","Toose","mwkhx"],
[36,87,10,1,5.7,14.7,114,"K1nzell","Milan","Crr"],
[37,87,10,0,3.6,12.9,72,"MarkusC","kejseR","trippernn"],
[38,86,6,0,7.33,5.83,88,"Umplify","Djani","Miro"],
[39,86,10,0,4.1,11.4,82,"Ginge 7","flippingtommo","sevenjoshh"],
[40,85,7,1,5.71,7.57,80,"Raifla","Tobi マ","23785 earned"],
[41,85,8,0,4.63,6.13,74,"10k earnings.","SliX","Aistimus"],
[42,85,8,0,4.63,9.88,74,"bead","M a r t o zㅤ","jaspaay."],
[43,85,10,0,4.6,12.1,92,"KPZET","Team123 LETHAL","fredzinh0 exe"],
[44,84,9,3,2.33,10.56,42,"itemm","Rojo","MrSavage"],
[45,83,8,1,4,9.13,64,"KC Keolys","Washed Orange","hqwkers"],
[46,83,10,0,4.1,13.1,82,"TimideMaisLucide","Nyx O_O","h4count"],
[47,83,8,0,6.25,11,100,"Legxndz xaxaxaxa","Dichlo 〆","washed floriixn"],
[48,82,9,0,4.78,11.78,86,"CRIPPΑ","AMG znappy","Wakie "],
[49,82,9,1,3.78,9.89,68,"krejz 999","ogdog74","ren ͅ"],
[50,81,9,1,5,12.22,90,"Hen","Whai.","JulianCoM"],
[51,81,9,0,4.67,10.56,84,"TARKOV GOD","Washed Orange","11l00"],
[52,81,9,0,5,12,90,"qvädö","Wulfee","oldyz ."],
[53,80,8,1,4.38,7.88,70,"pacific aimsi","Ova x8 Yamal","pacific fledi"],
[54,80,10,1,3.2,11.8,64,"VHV Kris","BL Tickeling","McDaBeast1"],
[55,79,10,1,3.7,14.5,74,"Stārlyeu","Skailereu","Cāps 44"],
[56,79,7,0,4.43,5.43,62,"LARON LORU77","steptr bro","iRezUmi"],
[57,79,10,2,2.5,13.9,50,"Gemz_","Aimo on old acc","Gonzobuca"],
[58,78,10,0,3.9,12.7,78,"Hen","Nymach","Oblivìon"],
[59,78,9,0,4.67,10.11,84,"Boyer","MOTOR","Verox"],
[60,78,8,1,2.63,8.5,42,"dDaaaANNnDDAANN","illusion el niño","FeRinS"]
];
