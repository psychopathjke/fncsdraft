/*@@PART js/career-3.js@@*/
/* The same room, counted in this season's teams.

   Every field and every cut in a career is written as a number of duos, because
   that is the year the mode was built on. A trio season seats the same people —
   a hundred and fifty duos and a hundred trios are both three hundred players —
   so a team count converts rather than being rewritten, and one rule does every
   one of them. Rounded, because a third of a field is not always whole; the
   simulation's own TEAM_TARGET agrees at the sizes that matter, 50 duos to 33
   trios.

   Nothing here is a balance decision. It is the same lobby, described in the
   unit the season plays in. */
/* A stage of a tournament, counted in this season's teams.

   CC_MAJOR_STAGE and CC_GCLC_ROUND are written once, at load, in duos. Rather
   than rewriting them per season this hands back a copy with the two numbers
   that are team counts converted — the games and the kill value are neither. */
function ccScaleStage(st){
  if(!st) return st;
  const out=Object.assign({}, st);
  if(out.field!=null) out.field=ccTeams(out.field);
  // cutScaled — этап, чья отсечка уже посчитана в командах сезона. Такая
  // отсечка складывается из УЖЕ пересчитанных мест (см. плей-ин Мейджора), и
  // второй пересчёт превратил бы её в две трети от самой себя.
  if(out.cut && !out.cutScaled) out.cut=ccTeams(out.cut);
  return out;
}
function ccTeams(duoCount){
  if(!(duoCount>0)) return duoCount;
  const n=careerSquadSize();
  return n===3 ? Math.round(duoCount*2/3) : n===4 ? Math.round(duoCount/2) : n===1 ? duoCount*2 : duoCount;
}
/* What this season calls a team, in the language on screen.

   The counts were converted for the trios season and the words were not, so a
   trios night said "Division 1 Cup — 11 games, 133 duos" over a lobby of trios,
   and the calendar called the Victory Cup a duos cup all year. His report,
   20 August.

   Only the career's own words go through here. The lines about the real FNCS —
   which is played in duos, and says so on the mode tiles and in the summit and
   Global Championship notes — are statements about a real tournament and are
   left alone. */
/* То же слово, что и ccSquadWord, но так, как его печатают крупные плитки —
   с заглавной. Отдельной функцией, чтобы «дуо» и «Дуо» никогда не разъехались
   по сезонам: разъехались они ровно так — счёт команд пересчитывался, слово
   стояло вшитым. */
function ccSquadWordCap(){
  const w=ccSquadWord();
  return w ? w.charAt(0).toUpperCase()+w.slice(1) : w;
}
function ccSquadWord(){
  // В день капа со своим форматом — его формат (ccVictoryFormat), а не состав года.
  let n=careerSquadSize();
  if(!CC_EVENT_SIZE && typeof ccVictoryFormat==='function' && typeof careerVictoryOn==='function'){
    const f=ccVictoryFormat(careerVictoryOn(careerToday())); if(f) n=f;
  }
  // В день Кубка наций — сборная: отбор соло, квалификация и финал — сквадом.
  if(!CC_EVENT_SIZE && typeof careerNationsOn==='function'){
    try{ const ev=careerNationsOn(careerToday()); if(ev) n=ccNatStage(ev)==='trial' ? 1 : CC_NATIONS_SQUAD; }catch(e){}
  }
  return n===1 ? L().lfWordSoloOne : n===4 ? L().lfWordSquads : n===3 ? L().ccWordTrios : L().ccWordDuos;
}
// The Victory Cup is the season's own, so its name is too.
function ccVictoryCupName(){
  const n=careerSquadSize(); return n===1 ? L().calVictorySolo : n===3 ? L().calVictoryTrio : L().calVictoryDuo;
}
function ccCupField(div){ return ccTeams(CC_CUP_ENTRANTS[div] || CAREER_CUP_FIELD); }
function ccCupCut(div){ return ccTeams(CC_CUP_QUOTA[div] || CAREER_CUP_CUT); }
function ccMajorFinalField(){ return ccTeams(50); }
function ccGlobField(){ return ccTeams(CC_GLOB_FIELD); }
function careerCupCut(div){ return ccCupCut(div); }
function careerCupSize(div){ return ccCupField(div); }

// A week draws the same field every time it is opened. Reloading the page in the
// middle of a season must not reroll who you are up against.
function careerRng(seed){
  let a=(seed>>>0)||1;
  return function(){
    a=a+0x6D2B79F5|0;
    let t=Math.imul(a^a>>>15, 1|a);
    t=t+Math.imul(t^t>>>7, 61|t)^t;
    return ((t^t>>>14)>>>0)/4294967296;
  };
}
/* Бросок недели — и соль самой карьеры.

   Без соли сезон, неделя и дивизион у всех новых карьер одинаковые, а значит
   одинаков и весь сгенерированный мир вокруг: те же четыре человека пишут в
   инбокс, те же клубы, те же имена на лестнице. Просьба от игрока: «чтоб при создании новой карьеры не одни и те же каждый раз
   предлагали дуо, а менялись первые тиммейты».

   Соль ставится один раз при создании и лежит в сейве (см. ccCareerSeed),
   поэтому внутри карьеры ничего не пляшет — неделя даёт тот же список, пока
   она та же неделя. Старый сейв соли не имеет: ему достаётся ник, и его мир
   остаётся его собственным. */
function careerSeed(cr, salt){
  /* В общей комнате гонки сид берётся от ЛОББИ, а не от карьеры: у каждого гонщика
     свой cr.seed, и на нём каждый собирал бы свой набор ботов. Сид вечера сервер
     выдаёт всем один (CC_MP_SEED), сезон, неделя и дивизион в гонке тоже совпадают
     (ccRaceShared), поэтому комната у всех выходит одна — и её не нужно пересылать:
     замер race-field-size-probe показал 162 КиБ на кубке Д1 при лимите DO в 128. */
  const own=(typeof ccRaceLock==='function' && ccRaceLock() && CC_MP_SEED)
    || (cr && cr.seed) || ccCareerSeed();
  /* НЕДЕЛЯ — ОБЫЧНО СЕГОДНЯШНЯЯ, НО НЕ ВСЕГДА ЕЁ СПРАШИВАЮТ.

     Турнир, который идёт дольше недели, обязан играться одной и той же сценой
     от первого дня до последнего. У Мейджора 2024-го два открытых
     квалификатора — 26-28 января и 2-4 февраля, — и это две календарные
     недели: бросок ложился по-новому, и во втором квалификаторе народ выходил
     с ДРУГИМИ напарниками. Отзыв: «все сильные дуо сразу друг
     друга сплитнули», и следом «два мерстача» — потому что очки серии копятся
     по ключу СОСТАВА (ccSeatKey), и человек с двумя напарниками держал в
     таблице две строки, а сетки полуфинала сажали обе.

     Париж такой правки не потребовал: три его этапа лежат в одной неделе, и
     сид там совпадал сам собой (см. ccRcField). Здесь неделю называет тот,
     кто строит комнату: `Object.assign({}, cr, {seedWeek: …})`. */
  const wk=(cr && cr.seedWeek!=null) ? cr.seedWeek : careerWeek();
  return hashStr('c'+cr.season+'w'+wk+'d'+cr.division+(salt||'')+'|'+own);
}

/* LADDER NAMES begin — tools/build-ladder-names.js */
const CC_LADDER_REAL={"EU":[["Zukiri","fr",1],["Nesty","",2],["Hquex","fr",2],["GG_winner08","dk",2],["DenizLiveYT","tr",2],["crunch","no",2],["Tempofv","",2],["flyz832","nl",2],["Juikelii","se",2],["erus","ar",2],["hiroto","es",2],["Andreyreily","it",2],["dex","us",2],["wooka","gb",2],["shayfv","sa",2],["Jeessxsrr","es",2],["riilěx","es",2],["Poluxia","fr",2],["67sylyzz","dk",2],["aroundinthesnow","pl",2],["canthangnomore","gb",2],["Unknown Alpha_74","de",2],["aight","de",2],["Dretox","cz",2],["darakingthe3rd","gb",2],["MrToothbrushh","gb",2],["Oma","pl",2],["Zyren","pt",2],["SPECTER","dk",2],["Shtifke79","ch",2],["tkeyyAIM7","ca",2],["slixy","ar",2],["zalreyli","es",2],["magbro","by",2],["tra2ce","by",2],["Hades","pl",2],["milusgoty","pl",2],["erenfnr.","de",2],["Rymse.","nl",2],["Swack77","nl",2],["Butplukmaster","",2],["mheroos","gb",2],["zewq281","mx",2],["patrik","",2],["mar1k","fr",2],["detect skuezbot","de",2],["Slowejector28","gb",2],["Goondox.","gb",2],["martinxk19","kr",2],["bean","ng",2],["kr1nzy","ua",2],["georgie","ng",2],["bangeryz","pl",2],["Kazama5","pl",2],["Lyon","",2],["Space","gb",2],["Evo","ng",2],["noxhern","no",2],["ELIAS GOTYGOAT","de",2],["moxiefnr","nl",2],["Bietje","nl",2],["dragonthijs","nl",2],["dragonnick10","nl",2],["Zynet","co",2],["ivory phbanandre","it",2],["photoxfn","",2],["Kenzies E-kitten","pl",2],["Trocoolz","fr",2],["radox","fr",2],["Frayz8_","fr",2],["Sxlar","fr",2],["ocinaims","de",2],["Stonyhaze","de",2],["FataL Nyuzy10","de",2],["Buzzaw","be",2],["Kaizo","gb",2],["kakou","gb",2],["zab","dk",2],["Slayerfnz","kr",2],["monto ze3ks","nl",2],["Walid","jp",2],["jackbuca","gb",2],["fredamane","gb",2],["AmiralGOTY","br",2],["bavzz","pl",2],["vexu","pl",2],["pietrucha","pl",2],["Luxxftn","pt",2],["cabrita seÿku","se",2],["kotekwingu","eg",2],["cekol","pl",2],["Cuber","de",2],["Twixx","ie",2],["Mind","de",2],["slickzbot","de",2],["Kxend","fr",2],["oslo","fr",2],["bernaGOTY","pt",2],["yupi1k-","pt",2],["satrÿfv","kr",2],["farzieyo","se",2],["nyxcog0d","nl",2],["Pico1zr","de",2],["melam3d","",2],["nicky","de",2],["pluskochatorty69","pl",2],["gelo","pl",2],["laszlo","de",2],["lucania","de",2],["NIGHT","tr",2],["detwazerra","jp",2],["monto fragg","ua",2],["NyxsChaChi","nl",2],["Oboyawesomer","se",2],["Jak0v","",2],["Antidroll","se",2],["VillalonaHD","es",2],["batman","es",2],["kolme1k-","dk",2],["Mashy","ca",2],["gsr","pl",2],["txny","ru",2],["roskotsaurus","cz",2],["Lucka","cz",2],["xPlash.","es",2],["Shimo Kyzën","es",2],["lynex izanai10","fr",2],["sleazyx","fr",2],["Future","de",2],["CrazyDxvid.","de",2],["Montii","es",2],["ryōmen","es",2],["VCTRY","de",2],["DaeZinhoo","se",2],["Deano","tr",2],["SNM","kr",2],["FreshLaPeufra","gb",2],["leoj65","ch",2],["Matikreyli","pl",2],["Kai5N","pl",2],["Onzi","kr",2],["Mertteu Akaza","de",2],["Vouchnada","de",2],["clxtch","",2],["dotling","it",2],["nachoski","se",2],["zoldyck","gb",2],["CRINGE KINGH","nl",2],["clikczyfv","de",2],["Clarkio37","gb",2],["Sawey","de",2],["Clue","de",2],["kiliaan","dk",2],["marou","nl",2],["ksawii","pl",2],["ozrix","fr",2],["skays tchikibrr","jp",2],["wally","kr",2],["retxed","gb",2],["exy","",2],["vizu","de",2],["eSpuma","nl",2],["DoriFN","",2],["DXXII.","gb",2],["EwikNada","kr",2],["exizze","no",2],["NECUYAE","ca",2],["black santa","fr",2],["zedroxski","fr",2],["NataN.","pl",2],["poltoraak","pl",2],["Wooka Layk3k","pt",2],["Punkt","pl",2],["ethanbuca","gb",2],["luxio","tr",2],["m0mse","gb",2],["Kaiser","es",2],["yeison.","es",2],["skinhead","gb",2],["zeofn6","us",2],["aventus dëniko","gb",2],["dxkocow","gb",2],["kxrvinho","br",2],["te21a2211","dk",2],["Clapzy","ru",2],["ravens","ua",2],["zbekou","es",2],["Lélé","fr",2],["Kappa","fr",2],["Chicken","de",2],["uxven","us",2],["Vasic","se",2],["xzdde","fr",2],["FEAR","de",2],["Fewe","de",2],["batmanvico","ch",2],["6.4FtRiskTaker","se",2],["Brave","co",2],["darkxy","kr",2],["zizouyy","",2],["Demon nivey","gb",2],["Fjellstad-","no",2],["arnie381","by",2],["mbappé","es",2],["asc","gb",2],["Leylowfnz","fr",2],["Dr7","sa",2],["monto shamajkee","ua",2],["monto GreeGo","ru",2],["r4uuL","es",2],["dxfelipe schranz","es",2],["kayzo","gb",2],["showthem","ar",2],["pflaume","de",2],["Kenala","pl",2],["grandpa","pl",2],["aimar","es",2],["lander","es",2],["ascend d4nil","de",2],["m4kew","de",2],["BluntBot96","",2],["harelds.","gb",2],["callañ","gb",2],["chadi","it",2],["devil","it",2],["kajfnr","nl",2],["zaka2fly","dk",2],["skrotas","no",2],["HeizHD","it",2],["Excitingstew","gb",2],["Chicaille.","fr",2],["Knoll","it",2],["Relq","pl",2],["Czesiack","us",2],["Antique","",2],["sigalek","pl",2],["Kyo","jp",2],["filobro32","",2],["kelofv","pl",2],["KetnaFN","pl",2],["vatox","fr",2],["nopzy","kr",2],["Poppybot","ch",2],["playb0ii levin","ch",2],["kairo","kr",2],["polski","kr",2],["taido","de",2],["myndsz7","it",2],["Frosty","kr",2],["23aitoor","es",2],["Purified","es",2],["KowGeur","fr",2],["kyksskinchallah","fr",2],["Loyal Virgin","dk",2],["eldii7","",2],["v1x","no",2],["Haribo","gb",2],["St.Patrick","gb",2],["troclife","pl",2],["benjishxrk23","it",2],["Woobldidobldidoo","ch",2],["EGY","de",2],["eqwiz","fr",2],["Jekibot","dk",2],["xizefv","de",2],["k1ng","ch",2],["takehighdontdieL","de",2],["edoo1x","uy",2],["1312Cata","it",2],["zirox","",2],["Binzy","be",2],["atlantic","dk",2],["Atlantic Bacon","dk",2],["V1tr0_","de",2],["zoxyGOTY","lv",2],["YikesJxn","de",2],["vixen","no",2],["tobix","no",2],["BlackieQbz","es",2],["holnix","es",2],["tsecreeiednich","dk",2],["xanders","ch",2],["cypnku","fr",2],["dxrth","fr",2],["leo","gb",2],["Steasy","nl",2],["SMARTI","dk",2],["fabrizio","gb",2],["SORCAPELOSA","it",2],["seize","ru",2],["hadi","gb",2],["Sonuu4","",2],["AdreYnada","de",2],["henryesque","kr",2],["Bachira Rikow","fr",2],["Gioelito67","de",2],["oxyKiller voxzy","it",2],["akideu2yc","de",2],["ItzJxson2yc","de",2],["syylo","kr",2],["kaw","fr",2],["mainyfnr","de",2],["Zrrto","",2],["arvid","se",2],["falcon peterbot","us",2],["braze crxgosocks","se",2],["johan","cz",2],["Tommy","gb",2],["Wiener","de",2],["Enrico","de",2],["Duzets","de",2],["IndoorWood14","gb",2],["Gidane","it",2],["rezeii","no",2],["traydox","",2],["JMC","nl",2],["FRIES","nl",2],["kenjyyjyy","gb",2],["khamzat","fr",2],["wxnteruk","gb",2],["korpalbot","de",2],["Rainer Winkler","gb",2],["Arzenski","no",2],["sleck pinkman","",2],["Danielx","",2],["vnedr","fr",2],["coronaa3k","de",2],["Hectoor1x","es",2],["blaze qÿthic","kr",2],["Akyfv.","tr",2],["Patron Belgique","be",2],["Bacobeertje","nl",2],["VrsMarquinho","ar",2],["king","es",2],["Polygon","gb",2],["Itoshi","",2],["voka.","de",2],["yaawzyy","gb",2],["Skoudoufliss","",2],["Grandpa Hunti","pl",2],["WojtylaGOTY7","br",2],["zaak97","jp",2],["Washed Treyy","it",2],["zFiXi","gb",2],["Kaïs","br",2],["wasy","fr",2],["Pear","se",2],["levi","es",2],["slyisszen","kr",2],["DIASBROTH","fr",2],["laiwooxyache32","fr",2],["laguna","pl",2],["VILLIAN811","ng",2],["DerGroßeYahu","de",2],["Zeroluck.","fr",2],["koza","fr",2],["tarzy","es",2],["zAversy","nl",2],["Atomfv","",2],["sahur","fr",2],["octotheoptimist","us",2],["Detect","de",2],["KoD","ie",2],["torzy","gb",2],["ghetto attitude","nl",2],["XxTUEXMANXx","de",2],["lizardrr","br",2],["Bror","se",2],["Tanzyy.","gb",2],["nickpomGoHard","it",2],["laraxgoty","es",2],["dizzý","es",2],["andis ero_barber","de",2],["FABIANTOP5HUMAN","de",2],["cadjovi","us",2],["Futres.","tr",2],["bixgiorr","fr",2],["nizxr","it",2],["M8akiifv","fr",2],["pxnda","ch",2],["Hiruzen","fr",2],["NOCEY","ng",2],["Wallahi Daryl","ng",2],["Joltz","de",2],["Scolix","de",2],["Hvskii","gb",2],["redwoks","ca",2],["liorapikou","gb",2],["Abyssal","uy",2],["RAYSKOLKHARA","de",2],["kadealbot","nz",2],["Japeezz","de",2],["NStar zy7fen","se",2],["RxzY","gb",2],["kairobot","de",2],["verx","is",2],["semih","tr",2],["Patrushka","de",2],["Combat","gb",2],["biofn6","kr",2],["benjinxz","",2],["slowenegoty","fr",2],["xYuni3uh","kr",2],["Julis","de",2],["ivory laykz","kr",2],["Valesway","it",2],["Mikaelson","it",2],["tarik","gb",2],["Final Misha","gb",2],["MUSTI.21.","ar",2],["TheSabz","fr",2],["FlexxEU","de",2],["Clensh","de",2],["Leoxloll","kr",2],["enc","it",2],["Ronfv","de",2],["lvcafv","de",2],["Monto cla1z","ng",2],["yuitaro","",2],["arda","de",2],["Mirage","ua",2],["Beast","se",2],["deni","de",2],["Txzie","nl",2],["Kulle","se",2],["Bhad","ie",2],["Demonfnz.","de",2],["ollebass","no",2],["kasjszn","mx",2],["Aymaniwnl","co",2],["spookerfishy","sa",2],["oOo","pl",2],["chlysteek","pl",2],["viee2","us",2],["Skalbaggen4","ng",2],["aleshawnn25.","it",2],["ventuu","it",2],["Hippo","nl",2],["Lxrsino assasino","nl",2],["Kaireks","ch",2],["KILLEDBYUNC","",2],["ekay","gb",2],["tsukuyomi","jp",2],["zaÿdeun4x","fr",2],["bylouisonfn","fr",2],["Magnobot","de",2],["kendu","de",2],["vixsicular","fr",2],["kikiwaka scoopy","ua",2],["TreJackson","gb",2],["67Kid_Rizzler","se",2],["k0paty4.","mx",2],["Sh1ft","se",2],["sanya","de",2],["Dejvis","cz",2],["OLYMPIAN","be",2],["Van","gb",2],["mayvox","fr",2],["Larper Velon","cz",2],["Rafael7","de",2],["aleksvv","pl",2],["amakazz","pl",2],["Brandonn24x","lv",2],["havok shotgun","gb",2],["Flakes","lv",2],["lotzonreyli1","ua",2],["cngyÿ","es",2],["fyzraa","fr",2],["SMB","fr",2],["Schmalibuca","de",2],["Fridge","sa",2],["kyeuk.","kr",2],["zyloxi","gb",2],["Zisiufv","kr",2],["Kazy","de",2],["zorox","",2],["ClaeHD","it",2],["derre","se",2],["alexsirbot","se",2],["1ntel","pl",2],["igorsu","pl",2],["RISX","de",2],["veqo","cz",2],["Madera","dk",2],["shmurda","cz",2],["Gader","us",2],["elitihi","de",2],["juramonkey","",2],["Legi1 Sparx","it",2],["qlivyy","pl",2],["craek","gb",2],["MrQuota","ng",2],["Pidina","nl",2],["Quan","nl",2],["al1ch","it",2],["kenzý","us",2],["dias","pt",2],["kyrxÿ","gb",2],["ImNeilzZ","es",2],["KafriStyle","es",2],["chemol","pl",2],["Siggi","ng",2],["Gae_beł_","it",2],["pingureyl","ch",2],["post","nl",2],["cozyy","gb",2],["GYMSKIN","gb",2],["lucaxdeal","de",2],["yunesplayer","de",2],["Amiksiwnl","de",2],["ibrxdl","fr",2],["Yoichi.Isagi","es",2],["sk1lar","es",2],["ErekFN","de",2],["Polochreyli","de",2],["NaliTw","fr",2],["Louis","fr",2],["loading","ua",2],["tchiki","dk",2],["ukule21","by",2],["Danemon7","it",2],["Nuk3Shawn","it",2],["haledk1ng","",2],["Haleds backpack","no",2],["psycho","de",2],["Legi1 Caritas","it",2],["Majoren2x","se",2],["Vybew7","ru",2],["Ascend Marvin","",2],["waterzreyl","fr",2],["Psycho AltoxX3D","fr",2],["lukeaim200xd","gb",2],["uzr","gb",2],["eziziiziez","ar",2],["desire","pl",2],["unemployed","gb",2],["boro.700","fr",2],["Wigmaan","fr",2],["kingos52","cz",2],["nettspend41x","cz",2],["FNR","it",2],["blizz","",2],["olololo","pl",2],["tabzenz","dk",2],["Tillema","dk",2],["villain","fr",2],["bololo","fr",2],["Aventus Faaki","de",2],["reastro","de",2],["rokichyø","by",2],["r1fat1k","ng",2],["jimbo","es",2],["Aaroniñho","br",2],["Dépouilleur2bp","fr",2],["PyjamaFTN","fr",2],["pth","ch",2],["syq","se",2],["PRIME","dk",2],["JJFnbr_","ch",2],["Z0W.","fr",2],["Laiso","fr",2],["selfix","de",2],["laenum","gb",2],["Atlantic Lopax","dk",2],["Frimann","dk",2],["Rebus","es",2],["Javi3rr","es",2],["Arasaka kaizixfv","dk",2],["FTLDavidMartinez","jp",2],["bobbersb","gb",2],["lowski","gb",2],["metifv1","de",2],["KEKSKÖNIG","de",2],["señor drago","ch",2],["axgel","",2],["andrey_topchik_1","ru",2],["Aiden","gb",2],["deepxfn","ie",2],["finos4k","ng",2],["Nussbaum","sa",2],["67raiz","sa",2],["gosha90637","fr",2],["herfy","",2],["fxtea","gb",2],["JudeJägaren67","se",2],["Edward Elskåp","se",2],["Velt7x","lv",2],["prikzY","dk",2],["Kurdi_burdie27","au",2],["sinnerbot","it",2],["ivory darkino","it",2],["konupk","de",2],["GLD","it",2],["sneax","it",2],["IBBY","gb",2],["Fizzyboy211","gb",2],["Pontii","dk",2],["Andre","dk",2],["waLahey1x","",2],["devade","us",2],["Lizer Draigerbot","ru",2],["Zach","gb",2],["Crypto","ch",2],["overeemfn_","de",2],["Lyric","de",2],["Tjebmans","nl",2],["Nix","nl",2],["RaysZ","fr",2],["Rasix.","",2],["sambrellaERIS","",2],["Asuna","de",2],["qunlaagblocka08","kr",2],["Reece","gb",2],["fragger gabba","gb",2],["Katherine","de",2],["richh freecs.","no",2],["2pat","br",2],["nyegaard","dk",2],["Sleepy","fr",2],["mytex","tr",2],["sebyuh","fr",2],["AUR","nz",2],["011Alehsad","ru",2],["Hiken","fr",2],["avora neofinny","de",2],["detect solix","de",2],["Fiuz","",2],["Toby","gb",3],["peasant","gb",3],["Lulukala","",3],["osku","kr",3],["T1y234R56i79A","be",3],["Shurkxn","co",3],["cabers","gb",3],["Hallöö Isaac","se",3],["Hxno","fr",3],["Spaylix.","fr",3],["tr0pico9","dk",3],["creqsbot","ch",3],["sojabube tomzyy","de",3],["auraking.","de",3],["TweeGOTY","ch",3],["Pjoter63","nl",3],["Minipekkanator","nl",3],["Vigz","dk",3],["Storm","dk",3],["Forever Cloy.","",3],["Visxals","us",3],["yngxskny","gb",3],["nazartrisemerki","de",3],["yäkitovski","fr",3],["LaPeace Fanta","",3],["lantz","se",3],["Big-Faze-Hylix","kr",3],["keyman","de",3],["zorme","",3],["FATAL","it",3],["vetoobot","",3],["dry","es",3],["SrDavo22","es",3],["kawa","pl",3],["spriteg0d","br",3],["lenrss-","ng",3],["Awzps","gb",3],["Yoichi Isagi","pt",3],["pedrox","",3],["Sanzz McGraw","gb",3],["Hxluu7x","fr",3],["BSK","fr",3],["PetkaFN_","cz",3],["falcon dabsbot","de",3],["Ackerman","es",3],["Manjirō ssammuu","es",3],["Rockeye.","gb",3],["Neyzoxfn6","fr",3],["DroyYz67","fr",3],["Softisffs","se",3],["player.","fr",3],["Hapock.exe","fr",3],["BlochC","dk",3],["Yellow Crystal","dk",3],["Mørke","gb",3],["Jin","fr",3],["Simple","kr",3],["nael_sigma030","se",3],["kamuvy","fr",3],["RunningKraKen","fr",3],["wexz3k","dk",3],["mirak","fr",3],["kirox","de",3],["iKarmoo","fr",3],["ballo","dk",3],["Toffee_7","",3],["snow","co",3],["bar9al hotgaam","co",3],["steppe","gb",3],["электро","br",3],["TwitterStxwyy","eg",3],["NATCOOK7.","co",3],["ZayloFPS","de",3],["m3rl0n","de",3],["kaorii1-","gb",3],["v1xie","",3],["thelaunch05","kr",3],["therocket05.","gb",3],["FN-killerboy273","de",3],["cubex","it",3],["tylor.crr","de",3],["Cleansii.","nl",3],["kopyboty","ng",3],["motszxyz","de",3],["tweazy","gb",3],["keanify","nl",3],["Arya","kr",3],["W1ndÿ","dk",3],["kxlsontfup","nl",3],["Piotrek","pl",3],["hvk","",3],["pizè.","it",3],["Dneepp","it",3],["dictator zvlics","gb",3],["Jankey","nl",3],["Aeÿzn","",3],["Detect Lunex","de",3],["auraGOAT","ru",3],["MEITOK3K","fr",3],["robezyweaponX","us",3],["qeady77","",3],["guerra","br",3],["backs17","gb",3],["pxddy","gb",3],["Philipp7","kr",3],["evolve frosty","gb",3],["RiskTaker","de",3],["RexAURI","kr",3],["belmondawg123","pl",3],["frytbot fanboy","pl",3],["Stagala","",3],["batman janne","",3],["Nxywakkfn","jp",3],["bevyx","fr",3],["Olomeister","pl",3],["kunxq","",3],["Gregsmet","ru",3],["edem","fr",3],["kiko","br",3],["blaze hyper","",3],["Blenko","de",3],["poura jobnight","de",3],["Chatgpt.A7M","fr",3],["XSET","",3],["Albanianpapi10","",3],["Kaydan","gb",3],["dukex","gb",3],["odibafodouro","ua",3],["Quax","es",3],["WiciuGOTY","pl",3],["abdoullahski","fr",3],["abdelbuca","sa",3],["yunus","de",3],["Zangets CYPER","de",3],["pluto3k","gb",3],["binks","gb",3],["Jeannot Elcuisto","fr",3],["hugol1n","es",3],["BASTINHO","sa",3],["derschwanz","de",3],["Schepijs","kr",3],["Mudman","nl",3],["Senpai","ua",3],["shxrkÿ","co",3],["charlie","gb",3],["mexro","no",3],["Forza Brygge","no",3],["tnikos.","ru",3],["Etvi.","no",3],["rivens","nl",3],["olinoss","",3],["boxynoa","fr",3],["shxooter","nl",3],["filiandro","cz",3],["vivet lover","",3],["Sdk","pl",3],["FedorOreh","ru",3],["Senzon.","es",3],["Alvrx.x1Yk","es",3],["ollieuk","ng",3],["ryanb0t","dk",3],["Unc","ng",3],["VerTiiGeV2","be",3],["ShaMblEZzs","dk",3],["cloudzÿ sheesh","de",3],["skullyfps","se",3],["codetisje","be",3],["Vipex","cz",3],["Czech jeff.","cz",3],["lalagoof","",3],["tropiqt","fr",3],["Harri","ru",3],["n1ls3eny","dk",3],["Duki100","pl",3],["kenzoo","pl",3],["come-back-time","lv",3],["Bernd","de",3],["twinx7z","de",3],["shakx","dk",3],["vertyyzz","it",3],["max","gb",3],["joshuk","gb",3],["Ryqzo","fr",3],["Abjo","se",3],["Zlind.","ch",3],["knüxì","",3],["manqü","",3],["Wappel","sa",3],["PETR","ru",3],["mufie","pl",3],["relixxz","pl",3],["chriszyache32","nl",3],["alby56","it",3],["FataL Shjetsu.","it",3],["Shrk","se",3],["6ix7even.67.","se",3],["reiss","fr",3],["FURIA musctez","it",3],["Squishy1x","nl",3],["Reisshub","gb",3],["Legacy","de",3],["Hubert Steifen","de",3],["szaziak","pl",3],["ThePardoBear","es",3],["CHEthughunter","pl",3],["Szopen","pl",3],["harvey","gb",3],["FooFoos10","gb",3],["Giakz","nl",3],["limited","gb",3],["NIXXY NAKANO","es",3],["audazmosquito331","es",3],["JoshScamell","gb",3],["zaruu","gb",3],["FleysOzaur","br",3],["Kemalek","jp",3],["unity impressedU","fr",3],["vyzer","fr",3],["bosarikk","cz",3],["Melii","cz",3],["Lucky","",3],["Wolverine","se",3],["ErikSon","",3],["reyli","de",3],["preciosa","es",3],["YuncoTheSåsMaker","se",3],["karkkitähti75","",3],["candystar75","",3],["noxstar","gb",3],["kylrr","kr",3],["Giorno4x","de",3],["Jghurt","de",3],["Taiga","de",3],["wrapitupson","kr",3],["babu","",3],["pltna","se",3],["witz2y","se",3],["veccy","",3],["Bradfn","nl",3],["SURF","pl",3],["vuer","se",3],["vamos chmielar","es",3],["PRIME Wroski","ru",3],["Kylazz","it",3],["mxttiarr.","it",3],["RyZe","lv",3],["cosmoreyli","is",3],["TopuriaZen","it",3],["amix","it",3],["D1ch3","",3],["vixlfg","",3],["Maxxed","gb",3],["mayzix","",3],["Atomm.","fr",3],["wxshed","no",3],["sorin vazenbot","au",3],["monto","us",3],["GUTERBEAR","",3],["Latexei","",3],["migee.","gb",3],["dxvi","it",3],["leox","it",3],["wazowski","pt",3],["Puri","se",3],["tinyytm","gb",3],["qwemat","pl",3],["clover","pl",3],["noyomng","gb",3],["Sayex","de",3],["Xeno7","",3],["Gangsta Draxter.","fr",3],["KVARA","fr",3],["psykoz","fr",3],["azakt","fr",3],["LinGangulibami9","nl",3],["シェフケ","nl",3],["cruizreyli.","gb",3],["polishjeff","pl",3],["Bamse","se",3],["Manzambi.","ch",3],["Taiko","tr",3],["Govax","fr",3],["Milvil","dk",3],["Tebirkes.","dk",3],["mariahoptimist","kr",3],["mustiixz","gb",3],["lenek.","pl",3],["mlody1337.","pl",3],["theoptimist","jp",3],["AlfieFN_","fr",3],["habsy.","ng",3],["Lucky Popishter","pl",3],["Christina Milian","gb",3],["Seanxijr","kr",3],["sweaby","de",3],["Liamdowskii","gb",3],["BLANSHZGEEK","ru",3],["Criptyft_","nl",3],["Akuma","fr",3],["Эйрокс","be",3],["devhn","it",3],["sayeizinho78mok","co",3],["KeptalivebyGod","ru",3],["yank0 badema","ng",3],["MitakaABC123","",3],["Islam Danichev","es",3],["Inno2x","gb",3],["Hillzy","gb",3],["Giggle Monsterr","ch",3],["Diktator D0r1an.","ch",3],["eyzo","de",3],["yUZBEKISTANy","by",3],["EksterWystawiacz","sa",3],["dely","fr",3],["Sakura Kloyz","es",3],["emiliano29112009","",3],["Thefourdragon44","it",3],["kubix-oxo","pl",3],["HAAHAHAHAH","ng",3],["Lissom-puddle2","gb",3],["aimgoty","gb",3],["megakn1ght","gb",3],["zeebyache","br",3],["ri.shepherd","br",3],["Vortix","de",3],["drxgon","de",3],["dxryus7","de",3],["haxxan_9","de",3],["Nirecx","es",3],["Varitą","cz",3],["M.kone17","it",3],["Notenkraker002","nl",3],["avarrfv","",3],["twtrmauriceaufv","fr",3],["dxny","dk",3],["Qetzalcoatl","",3],["Elou","mx",3],["facman","fr",3],["Diablo99","ua",3],["qq21","ru",3],["saucy","dk",3],["R3ul","de",3],["Sight","jp",3],["Fcl_Laurin","de",3],["Natoxrr","fr",3],["skaalder","fr",3],["reccy rizefv","gb",3],["TimgihoFN","de",3],["large","cz",3],["lamefx2","ru",3],["ctg281","de",3],["scandic woflan","dk",3],["scoinzzy","kr",3],["Negelfis","no",3],["Frizlez","gb",3],["dopebwoy","it",3],["bosnyak","it",3],["psycho keanu","de",3],["karbonat","kr",3],["펠릭스115","kr",3],["KALFA","tr",3],["jj0sh-","gb",3],["beilleau","fr",3],["FataL Yadox","it",3],["BUSTALIMA","it",3],["RCENT.","ch",3],["juuh","de",3],["chlebo27","is",3],["vemi","pl",3],["benniefortje","nl",3],["FlappyGoty","be",3],["comeback.chek","",3],["Sk8star","it",3],["NOAH.","se",3],["VENSO","no",3],["begin shadeÿ","pl",3],["astralfps1-","pl",3],["ZNN","es",3],["mila","es",3],["snows.","nl",3],["dexzzÿ","nl",3],["BELUGA","it",3],["DOCTORS","it",3],["TwinsskiFn","fr",3],["Skaymers","fr",3],["solofv","de",3],["falcobot","mx",3],["trexX","de",3],["Zscarys WYTER","jp",3],["starad1","es",3],["art91.","jp",3],["noizy","de",3],["Dăvid","de",3],["ViniJr","gb",3],["kevonada","de",3],["shmuel","gb",3],["StickyTip911","de",3],["bucoyc","se",3],["fluzsae","dk",3],["TOM2009YTB","fr",3],["FinitoSD","sa",3],["Balixfn","de",3],["aeroshx","fr",3],["clever","",3],["kozmoo","fr",3],["vezz","nl",3],["ismadubada","es",3],["Lu1sma","gb",3],["K13","fr",3],["Sebastiaanr","nl",3],["goldkian","be",3],["Bikwong","dk",3],["okokokxdxd67","",3],["Visoualz","de",3],["Levin","de",3],["eljo","",3],["dolarox009","pl",3],["DeleteThisSeason","no",3],["kekxgrind","gb",3],["Benqÿ","ca",3],["Rauldit","es",3],["HolaSoyTezyx","es",3],["Peakzy7","dk",3],["Matei","ie",3],["Ventox","ch",3],["SORBEL M3SKEE","ar",3],["undav","de",3],["mdemprcheck","sa",3],["jaybot","gb",3],["jackreyli1","gb",3],["Clouds","ca",3],["palad1nfv","se",3],["Fernandes","pt",3],["itzrax-","dk",3],["scuub","ch",3],["methods","ng",3],["A_Moha.","be",3],["Why","fr",3],["oogwayshter","jp",3],["crashout","is",3],["konefn","",3],["Stake Kimura","de",3],["Chillera","pl",3],["schmeq","ng",3],["larper","ng",3],["адвик","ua",3],["Vyro","pl",3],["Teakzreturn","pl",3],["tojiofv","de",3],["Lyost th1zoo","",3],["rylie","mx",3],["BABOS BLING","ch",3],["novafn","fr",3],["bader","de",3],["Spender","de",3],["ASTRA Tjyr4","be",3],["swkfv","fr",3],["NaYz","ch",3],["ZetFar","fr",3],["саммер","ua",3],["Daltar.","fr",3],["shmelby","gb",3],["AgressiveGiraffe","de",3],["nopeyxz","ie",3],["w8qz","de",3],["SiemienTanczy","gb",3],["Hinajhin","fr",3],["slashfv","sa",3],["rexobot","de",3],["eferekdal","de",3],["zovemebober","de",3],["srw","pt",3],["ELFROTH","kr",3],["Krisbot.","de",3],["shyzybot.","",3],["anr","kr",3],["mateybot","gb",3],["OBRIGADO DADDOX","it",3],["mentosv","pl",3],["snywad.","pl",3],["Marin Katigawa","fr",3],["D4rk","be",3],["pawcifiedluv_1","mx",3],["gzbxdd.","fr",3],["Seay","de",3],["bartus223","pl",3],["RY14EZ","pl",3],["Carti","us",3],["Bokify","us",3],["kaneki","es",3],["hannixe","eg",3],["agileszn","us",3],["DAFEG","jp",3],["QUET_3K","ru",3],["Rene","de",3],["OKTONAUTEN","de",3],["CHUGGINGTON","de",3],["Funny Skills","de",3],["cheapz.","de",3],["remyfnr","de",3],["kubifv","pl",3],["9bmeechie","de",3],["Tim","de",3],["nonchalant","br",3],["tommyÿÿ","it",3],["Freemok","tr",3],["leksa","ru",3],["Aspas","es",3],["thanos","",3],["maor1x","",3],["schiller","dk",3],["Rottegift","dk",3],["Bing","nl",3],["Whistyfv.","nl",3],["falcon landobot","us",3],["Uchiha","it",3],["Pringolinio","es",3],["Espvda7Feyeur","ar",3],["KatshinhoFromRio","fr",3],["Aatu","ar",3],["EeDu.","",3],["Daevidq","",3],["YF7","gb",3],["tiagreedy","pt",3],["Raxaro","it",3],["sverigevmvinst26","se",3],["Isaknator","se",3],["88Skailer","ng",3],["Vortrex","ng",3],["makkonada","ch",3],["juikm lamar","it",3],["siwex","de",3],["JendaGOTY","cz",3],["yami","de",3],["Lenox753","de",3],["Morenos Daddy","de",3],["sukehiro","de",3],["Leonardo DiPilar","pl",3],["xiraco192","ru",3],["avais","de",3],["monelazy","ru",3],["Elliot_Fn9","se",3],["BaiHarborBoucher","fr",3],["LebonvieuxAirkyy","fr",3],["Tyz","ca",3],["mongoloidefnbr67","dk",3],["BLLKO rivasb2b","es",3],["James","de",3],["spexxy","br",3],["Aleksz.","ng",3],["ebeid","eg",3],["phxntomraga","tr",3],["Fleury","gb",3],["hand","pl",3],["Grzybowa","pl",3],["MAYESTRO KACZOR","pl",3],["onlycashyzzr","nl",3],["walidfn","",3],["Harun93_","fr",3],["Zbyszek Rakieta","",3],["RONALDO VAMOS","pt",3],["gryglik","pl",3],["splashy","gb",3],["1Sylph1","gb",3],["Manny","ru",3],["VoxyGOTY7","ch",3],["blueberry ice10K","fr",3],["NatFly","",3],["raxxyrawr","ng",3],["Zent7x","cz",3],["Timex","cz",3],["PRK","au",3],["nedjii","fr",3],["sloxyg0d","it",3],["TIJIA9x","it",3],["Bambi","it",3],["Gxbri","it",3],["bionzy","de",3],["Dugz40Spaz","dk",3],["PIZZARDUNE","jp",3],["owlyy7","dk",3],["STONE","dk",3],["kirillian regen","fr",3],["STARL TOKYOO","de",3],["LeSeul","",3],["spyy","gb",3],["zBaileyzure","gb",3],["wackem","fr",3],["penta99_","de",3],["dojo","de",3],["Přístroj Fugas","cz",3],["cursed","ch",3],["Kuzvinho","ua",3],["цуанцен","mx",3],["abecsÿ","sa",3],["Kamolbeast","pl",3],["mrhban leiche","de",3],["Sxmpo","gb",3],["اکوز","co",3],["46fv","it",3],["oneup cadobot","sa",3],["auraking kennÿ","de",3],["murki","ru",3],["Schmetern","de",3],["pitpat1234","ar",3],["veroc0","es",3],["zyox","de",3],["triq","de",3],["optixz","us",3],["anoniana","us",3],["Koros","fr",3],["GoldNeron","be",3],["V1ggo","se",3],["Titleist T150.","se",3],["CTN","pl",3],["walabux","cz",3],["Junis","de",3],["ChalayanSS07","jp",3],["scottski","gb",3],["purky","",3],["sneeky ducky","us",3],["Giyuu","de",3],["trixx","kr",3],["Nazen7_","nl",3],["aura.","fr",3],["P3lot","ca",3],["dictator","ng",3],["MIZZ.","fr",3],["Habib38","fr",3],["catelover24","sa",3],["Kälev_","",3],["xotiicvsz","de",3],["Thaiyox","se",3],["Babareyli","gb",3],["Thundercory","gb",3],["KOSma28","pl",3],["BARNI K3BAB","ca",3],["Nicci","de",3],["FörmaBoy Jessie","de",3],["aldeon","gb",3],["Gromago","cz",3],["nahoz207","it",3],["clinixx","gb",3],["flinty","gb",3],["straight","gb",3],["Krakuls Washed","gb",3],["GeeStar","de",3],["Joah8","kr",3],["almir d.xebec","de",3],["mohaGattouz","tr",3],["geeked 7imonÿ","pl",3],["Eldin","de",3],["jason","pl",3],["rexo","pl",3],["Wvynko","",3],["Mal1xz","se",3],["Desryx","fr",3],["Sevkić","ua",3],["poison","pl",3],["zirranbot","",3],["straightedge0101","ru",3],["yutebis mfutavi","",3],["Doom","de",3],["bkaydee","de",3],["Henrik Aikkila","",3],["Konde","br",3],["Jibou1.1","fr",3],["Juzeyy","kr",3],["Alexlewa7","de",3],["Ascend KROXxG","de",3],["n3dix","fr",3],["Swaxii.","fr",3],["mug1fs","",3],["KONNIEUR","fr",3],["Roxa","fr",3],["meräxo","pl",3],["Snixie","sa",3],["Finn07.","gb",3],["VANLOLOL","gb",3],["Flawreyli.","gb",3],["avii","nl",3],["dreamless","",3],["Vilxu","se",3],["yeye205beep","de",3],["SharafloseBinit","pl",3],["Isaiah","nl",3],["Balkoekje","nl",3],["SIVOG","fr",3],["Adri","es",3],["maxceser","es",3],["Bibou azler","fr",3],["ZyKe_Wàrøx","",3],["14stormy","no",3],["axlsola7","de",3],["frank lucas","",3],["Underrated","se",3],["David","",3],["daniel","ru",3],["Aventus Speedy","de",3],["chiara","gb",3],["Nolsko","fr",3],["messna","fr",3],["darthfv","pt",3],["brunixGOTy","pt",3],["LA_1Taps","",3],["alo","nl",3],["Dado","it",3],["Nazax","fr",3],["gteez","es",3],["active sanzz","sa",3],["NyrOx11","fr",3],["Golden -Nono","fr",3],["sYriano","de",3],["AuroraSoloLaPunt","it",3],["chmsz","nl",3],["skwiks","fr",3],["Sennah","se",3],["Riqu","se",3],["avora tizzyfv","de",3],["JoniGioh","de",3],["dimitar.0z","",3],["Dawix","pl",3],["luixyy","de",3],["teeqzy","eg",3],["moonfn64","de",3],["RAZ","it",3],["Fatal Nando","it",3],["205z","fr",3],["vasoxx","ca",3],["zJordanSZN","it",3],["KiszBim67","br",3],["krzywy","pl",3],["Jackson.","se",3],["Deminem Jackson.","se",3],["monevfn","",3],["1sebfn","pl",3],["kapy-chan","fr",3],["speedrun","",3],["mopsyache32","ru",4],["Z1mple","gb",4],["keysufnr","es",4],["Adriaht","es",4],["zVianix","is",4],["Navarrette","kr",4],["yorazenfv","gb",4],["junkster","gb",4],["shuddinho","it",4],["limit","es",4],["Ino","ru",4],["IconicJack","gb",4],["àstrò","br",4],["panabøt","es",4],["jplazeyt","us",4],["oscr","no",4],["yempy","kr",4],["snyz.","be",4],["daniilfv","fr",4],["scoot","gb",4],["Slizy","",4],["cvs","pl",4],["vayde","gb",4],["skechy.","pl",4],["ollie","gb",4],["dizo","gb",4],["monik","gb",4],["layer saint","de",4],["zeyrox","tr",4],["rogacz","pl",4],["balix","pl",4],["Baum","dk",4],["ben1tesz","pt",4],["Lixm","gb",4],["Kaziix","de",4],["jubarax","pl",4],["Blere0","",4],["mikas","br",4],["3robi","fr",4],["カイザ.","fr",4],["sayyz zoldyck","es",4],["long","de",4],["bene","kr",4],["roblox enjoy","se",4],["upthefulham","kr",4],["Kubsztal","pl",4],["bzykk.","sa",4],["crapuuvski","es",4],["xeng0d","nl",4],["MAR1UX","gb",4],["ŘaFæL3k","",4],["OZIAKING","pl",4],["Adlène Guédioura","pl",4],["Sebju19","dk",4],["Soffe","dk",4],["Kagamifv.","kr",4],["force bobby","gb",4],["martial","pl",4],["Cucurella","es",4],["YvngZexxy","es",4],["flaymrelated","ar",4],["frisery","",4],["Lazeky","",4],["charbuca","ru",4],["Luka","",4],["Twinkovsky","cz",4],["zenxzo","nl",4],["Thijs waterijs","",4],["donnemoitapuff","fr",4],["CoLtRaNe WIlDeRL","pt",4],["zKlixx","",4],["BestConsoleGR","",4],["nico","it",4],["ignale","it",4],["t21","nl",4],["egirL Fr3ya","gb",4],["zorrokungen","se",4],["пролидер","ru",4],["Gwert","ua",4],["Moch","se",4],["SUBURASHI.AI","by",4],["biGBOYedW1n","ie",4],["Roschyld","",4],["prospa-","kr",4],["thorfinn2K","",4],["DZK","",4],["alohaGOTY","mx",4],["Koryn","",4],["itachi yeager.","de",4],["Meruem","de",4],["snoder","de",4],["aqtylo","pl",4],["Drxgo","it",4],["flowsti","gb",4],["klaydfn1","fr",4],["TravzZzeroO","be",4],["dazed jason","de",4],["OscuRo","",4],["marcxyahu","es",4],["Frozone1.","",4],["Misugi","it",4],["Oba","fr",4],["punisher34.","no",4],["bobecfv","pl",4],["Krizz","pl",4],["Chouwel82z","be",4],["isko","dk",4],["Dougie","gb",4],["ゑょゆ","tr",4],["Kowalski","br",4],["Zenoreyli","fr",4],["eatahi.","fr",4],["white_toes 4ever","pl",4],["Wallahibillahi.","",4],["Enkka.","no",4],["redski2x","sa",4],["laykzz","jp",4],["Hexsi","mx",4],["Dywelinho","pl",4],["morris","br",4],["og.anunoby.","de",4],["mangopalka tomek","pl",4],["loirinha","pt",4],["vice","pt",4],["flying","gb",4],["sylyx","fr",4],["AUGUS7XD","be",4],["vaylo jane7","tr",4],["Breathbot","ch",4],["corni","de",4],["blade xotwod","kr",4],["xLATSU","ch",4],["kayyebot","se",4],["defil","fr",4],["Patrick","nl",4],["SnOzy","pl",4],["ｂａｎｉａ","pl",4],["Doncaster Demon","gb",4],["drixwd","gb",4],["Brutusoficjalnie","pl",4],["CW3LIK HAMES","pl",4],["CACHØPPENDØGGÜEN","es",4],["Raze1309","es",4],["Dziobak3kk","jp",4],["delegant monster","tr",4],["Asgard","de",4],["delmusfnrl","nl",4],["Nakki._.","",4],["dictator golkot","",4],["leftyydagoon.","",4],["kenzu","pl",4],["rockstar kaczmil","pl",4],["Coerbii","de",4],["Cabro","gb",4],["Heaven mogged","fr",4],["Overlord","fr",4],["Krótki","pl",4],["OZDY-LOVE-EROX","ch",4],["T0SCA","fr",4],["barbershop dance","it",4],["KoIpeek","pl",4],["krzychu","pl",4],["wockst","it",4],["Lotic-","de",4],["bajram","de",4],["dubistgutgennug2","mx",4],["vikz","jp",4],["Fretze","mx",4],["Poweroki","br",4],["enademy","by",4],["t1larÿ","ru",4],["Jayden","",4],["Jaknada","pl",4],["yergYK","au",4],["Chutter5","de",4],["dinho","br",4],["SiddY281","it",4],["Freaky Pablo","dk",4],["OkkaDK","dk",4],["simple.","de",4],["tapex","uy",4],["PaezyAIM7","gb",4],["synder","ch",4],["DaigoDog","",4],["rhyisi","gb",4],["wakefv","gb",4],["Ramsfv","fr",4],["Turkos91_","de",4],["TiNXO-","de",4],["olixer","",4],["chaosfinn7","se",4],["Husain_08","sa",4],["bobuu.","",4],["Tariousa.","kr",4],["mightyfn","ch",4],["Jaiko","kr",4],["IsbergN_","ch",4],["n1ah","de",4],["Brokenvfx","de",4],["тес","ch",4],["BALLON","us",4],["Liammski","nl",4],["rezey","pt",4],["sosaahi","gb",4],["ExDedeadorVascas","es",4],["Qwixly","es",4],["solo","gb",4],["luhreyli","lv",4],["Lazfnz","fr",4],["Azen3x","fr",4],["dejvid","br",4],["wenxiety","sa",4],["vixiis","pl",4],["cybleon","pl",4],["PokitFv","fr",4],["Nezox1n","fr",4],["lixborr","it",4],["Teamo","pl",4],["prasii","pl",4],["Sebko","it",4],["twttr jackeyyfn","no",4],["Admin","ru",4],["Ladyniec.","pl",4],["reboxinho","es",4],["Arafat","es",4],["drohez TUDOSE","es",4],["Jonaazz Kaiser23","es",4],["hisxka212","eg",4],["MystiqHubbert","nl",4],["Fxstro","be",4],["dexter morgish","se",4],["K3ezox8x","ua",4],["Shxrk","pt",4],["TOFFEN.","no",4],["lyrixreyli","au",4],["Snowzyreyli","de",4],["trazx16","gb",4],["Rhys","gb",4],["Rigsby","se",4],["Natsu","it",4],["Atlantic Quippy","tr",4],["CAPS","gb",4],["NainBoy","fr",4],["RSTT","fr",4],["l21xx","ru",4],["kapec","pl",4],["kancerfv","",4],["Twix","pl",4],["Vertex","",4],["ARTIX","fr",4],["Morzy","ch",4],["Jaxss","de",4],["FlayZz","fr",4],["watchmeshine.","fr",4],["Cheater cl1pzh","jp",4],["Karlito","de",4],["MineLol656","ua",4],["manzaan","",4],["ewso.","de",4],["Ethxnset","",4],["Comeback rizz.","de",4],["finessims daddy7","ua",4],["kayz128","de",4],["Reapz","",4],["SwizzY281","kr",4],["zeroxfnbr","se",4],["Greek Dagestanos","nl",4],["Teasy","de",4],["ReZessFN","no",4],["nachoo","se",4],["Jollefv","no",4],["kpi","es",4],["saw","fr",4],["DeciMus Meridis","fr",4],["Sxk0uille","kr",4],["litrus","",4],["Octogon.","ie",4],["PATR0N","is",4],["Aluzzek","",4],["P3TER","pl",4],["spartiate.fnr1","fr",4],["Arurora","de",4],["Cooldown","de",4],["choces","",4],["Durozes sunelis","fr",4],["Floss legal","br",4],["VezaTungChadlite","ca",4],["harmo.","gb",4],["vxjtass","cz",4],["perÿx1xrki","cz",4],["LHTH27","eg",4],["m4tekk.","pl",4],["BLEEDfv","se",4],["Kyrox11K.","fr",4],["fyrïx","fr",4],["ImTterrible","",4],["NERROZOFF","be",4],["HYPTICZ","gb",4],["eclipse4844","gb",4],["jirdon","",4],["BananenEsser67","de",4],["JustJay","gb",4],["Kaggant","se",4],["b0udis","dk",4],["febik.","cz",4],["xiy.","es",4],["asvatryona","de",4],["Lyrox","de",4],["lepus","dk",4],["nonocaro73","fr",4],["Zukx","fr",4],["DLH_FV","fr",4],["aymane","",4],["chizy","fr",4],["BIG","",4],["xid","it",4],["SKÓRKA_schodzi67","ua",4],["prime bonniebl67","pl",4],["Binolt.","fr",4],["hyz","fr",4],["Galaxack","cz",4],["MzXfLy_","fr",4],["adrianlovetortas","ch",4],["RyAnGosling","",4],["manolito","es",4],["ammgletinho","es",4],["Aquila.exe","fr",4],["Keyer","no",4],["mralexfn","de",4],["lovery88kg","mx",4],["stan9art","ru",4],["AartixZ","de",4],["V.W.C.","dk",4],["pølsemixs","dk",4],["EnJoy","de",4],["arthuryeyy","de",4],["Mazz","be",4],["welagreen23","jp",4],["suto","nl",4],["Goosemaster38","kr",4],["Three_Squirrel","gb",4],["utfrogs","gb",4],["JNT","us",4],["dubbyfn","no",4],["Sinon","de",4],["aexu","nl",4],["grind","nl",4],["Jxshbot","de",4],["KAIDO","",4],["DaNya loveshushi","ua",4],["kārma","de",4],["cApTa1n_on_too","de",4],["ShivGutz","es",4],["Minii Schiller","es",4],["Brxzy","us",4],["leooilnw-","ar",4],["Kal","",4],["Adx","gb",4],["aquav3_","de",4],["alefv","",4],["repztapen","pt",4],["rexivski","cz",4],["morobot","se",4],["AmaroHabib","de",4],["Momo_ lefra84","fr",4],["baronet","co",4],["retirement jesse","be",4],["casper","be",4],["plaxyy","kr",4],["CymeeQ","pl",4],["zw19nny","pl",4],["ricky","se",4],["deyroWW","de",4],["LUSTIGER","de",4],["KM10","de",4],["flekzY2811","ru",4],["Мяу","de",4],["Mussfv","us",4],["tazy","gb",4],["respirator","pl",4],["dziadyga V1sual","pl",4],["clizzy","nl",4],["Arive","nl",4],["Mikixx","pl",4],["dawidos09.","pl",4],["Casheey","se",4],["Pinzk","se",4],["Worrlat","",4],["nox-wars-actar2","fr",4],["lyotryona","de",4],["falcon crabs","tr",4],["Milou","ch",4],["Avora Ciara","de",4],["Tuschibuca","de",4],["how2killacall101","us",4],["kvaradona.7","fr",4],["Casco","it",4],["stufts","nl",4],["nessa","gb",4],["blueye","pt",4],["kkyr3z","de",4],["novasbuca","gb",4],["Ashton","gb",4],["JINBEII","fr",4],["NzVs","",4],["Lukas","de",4],["kivoraga","de",4],["BELLY","jp",4],["morro","kr",4],["milosz","ar",4],["koczik","pl",4],["лаич88","ru",4],["YanDiomande49x","cz",4],["vojtisek22","cz",4],["marovsk1","de",4],["wenxtwenxtwenxt","ca",4],["czesioxGOTY","kr",4],["Kurex7.0","de",4],["Bobito798","de",4],["ngapuh","se",4],["Tsxr.","gb",4],["percyache32","jp",4],["Brooksy971","gb",4],["Fuxas","sa",4],["muzzyfv","gb",4],["Dyktator Szymi","br",4],["Franticc lover","pl",4],["TNK","co",4],["Ascend Krewto","pl",4],["Barcola Axiqed","gb",4],["matyl","de",4],["kalaszugge","se",4],["Lethiq7","de",4],["Andyy","kr",4],["johnGOTYY","ru",4],["ourdas","dk",4],["moni_bossi","ch",4],["Zity","fr",4],["Dikxo","fr",4],["kluczsyna","pl",4],["Crakerson","pl",4],["szeryf","pl",4],["Miraggio","it",4],["Kaso","de",4],["Feetlicker78","dk",4],["Grality","fr",4],["bonobo Mxlka","pl",4],["EgeausHeidelberg","de",4],["etnababyy","ua",4],["stussyB2Bprospa","gb",4],["Noaah","se",4],["CtrlWin","gb",4],["auraking","ch",4],["mw3sebas","es",4],["Thonix3","es",4],["bobggs","mx",4],["rainfox","ua",4],["shortmi","",4],["skywalker","ru",4],["nightÿ","it",4],["nixxfn","es",4],["koraa","fr",4],["Seiko","fr",4],["Return","pl",4],["youvkofnx","jp",4],["aktGOATy","fr",4],["Zxnopikou","fr",4],["letti","ar",4],["melanin","fr",4],["Lxmrr_-","ng",4],["Etàn13","fr",4],["nayrox","fr",4],["mankix","mx",4],["zenalay","fr",4],["Yaickraquante","",4],["Kyroo","de",4],["Levyl","de",4],["SDVG","",4],["ODIOIFROEINEG","ng",4],["Bufalo","gb",4],["cycorkisnokera67","kr",4],["t3eny","jp",4],["PLBATMAN67","ar",4],["grypex zeekxrr","pl",4],["letriangle67","se",4],["ch7ko","kr",4],["NaiterFn","fr",4],["mxzzu","it",4],["CAMILLA","no",4],["vaicy","kr",4],["MaxWinOnly","jp",4],["Nexo744","fr",4],["Syfels15","pl",4],["Bobrito36","ua",4],["Focus pandro","mx",4],["Flickzoybot","de",4],["Tanjiiro","ru",4],["1zlot","es",4],["Mulle","se",4],["ᴺᵒᵃʰ父","se",4],["SECRET_Fågel","se",4],["swayz1x","fr",4],["bigluca8","ng",4],["oger0-","de",4],["miesepeter0-","de",4],["mlad3y","jp",4],["foxy","it",4],["stormern","no",4],["Kylian Mbappé10","pt",4],["twis","fr",4],["Scepex","",4],["Sterixx.","",4],["squizyrrGOTY","fr",4],["Cjxnr","ca",4],["Sleepah.","ng",4],["TsG_AZ","se",4],["zeisswe","se",4],["Jesse Bisiwu","gb",4],["maongurban","pl",4],["wash.","pl",4],["Gatkowski","pl",4],["Bartonfv","pl",4],["I_clap_you_all","de",4],["bibby","gb",4],["spp300","",4],["LorenazZzer0","",4],["EgirlHunter","de",4],["Socken Verbot","br",4],["IssaonEU","",4],["rxmag","de",4],["Arxx97","dk",4],["Ravn","dk",4],["Oohareyli","fr",4],["reipper ekisbox","se",4],["FASTSOS","jp",4],["perezinho7","es",4],["Kastrioti","gb",4],["Mille HAHAHA","se",4],["zapix grind","pl",4],["kxlian","no",4],["kaza1fv","be",4],["Ace","co",4],["GeschmeidigerCan","de",4],["Yengari","de",4],["enisgoat","",4],["pollo","no",4],["rÿmn","jp",4],["fishyslit","gb",4],["Альфа","gb",4],["zeta","pl",4],["rajdejo","pl",4],["saint sahur.","gb",4],["maxbuddys","be",4],["Matpi national","",4],["slayxkeyb0ard","fr",4],["fotuzik","ua",4],["Nopierre26","jp",4],["LuckyOKLM","au",4],["Ionccdar12.","de",4],["cosmonada","kr",4],["PierinoPSG","it",4],["ActingLikeTommy7","it",4],["L2BOT5","gb",4],["meshek","ar",4],["Manuelsen","de",4],["WØX","de",4],["markyywoo","es",4],["h4chemon","es",4],["Azrael","gb",4],["elexity","",4],["Kubaa","pl",4],["tłusty sewek","",4],["Rabbitxaim","eg",4],["NickyBabylon69","",4],["braydz","cz",4],["gIore pruzen","de",4],["Spyzenator","",4],["sweylobot","us",4],["Venok","es",4],["Super Roscio","it",4],["Bobby Prime090","it",4],["Weyzzer","be",4],["Kira","be",4],["Kenpach1x","fr",4],["NightKira-_","jp",4],["Hendrik Martinus","nl",4],["NATO","de",4],["kejcpi12","pl",4],["bepro p4wciu","pl",4],["GOTY7","fr",4],["Nxtrawesommer","ch",4],["alb1us","es",4],["Christro.","es",4],["Doggunos","es",4],["stinkypigtoes","de",4],["Benjyfishy","it",4],["BUGHAZZ","it",4],["primelino20","it",4],["Nyzee9x","de",4],["Sneezy","se",4],["NVKG","fr",4],["FAZE","fr",4],["lb.1312","ch",4],["Abbe","se",4],["JAIMEuk.","gb",4],["Nosehair.","gb",4],["Foid","se",4],["Bandoo","gb",4],["Fishy","gb",4],["Berg","no",4],["PiqZz","de",4],["шюрикь","de",4],["скоро","ch",4],["hanfiez","dk",4],["falcon Kingdra","fr",4],["Icystria","de",4],["LaBriocheFn.","fr",4],["HAERO Äffchen","de",4],["XenxzA","de",4],["lizer twizzy","",4],["chickixbublic6","gb",4],["Lore_SKardi","it",4],["kezzrr.","fr",4],["margiela","gb",4],["HeadShutz","pl",4],["Gwiboot","gb",4],["wnna","se",4],["xale","de",4],["1man","de",4],["Fexzÿ","no",4],["spxcemax","be",4],["Tupanar Cekata","es",4],["5kxmxn","kr",4],["Schmaadri","ch",4],["tunioo","pl",4],["Yene","pl",4],["zwie3ak15","pl",4],["200IQ","kr",4],["pitty boogeyman","it",4],["DavidHT60","cz",4],["washed creep","",4],["AR10AN","fr",4],["neviojin","gb",4],["Dyna-Q","de",4],["νσιх","de",4],["DalartoTwitch","es",4],["dagestan b-camp","gb",4],["reznada","it",4],["Lkav1reyli","ru",4],["hytr1x","de",4],["warekboss","pl",4],["Hoopezy","kr",4],["Seeqyu","",4],["120KL","fr",4],["Kacper Velaryon","de",4],["Lederhosen","ng",4],["RHchalao","es",4],["javiloeches961","",4],["Refgabbs","es",4],["Deigou","es",4],["Margo","mx",4],["dxn","es",4],["nexxrr","pl",4],["Flozy","cz",4],["COMEBACK Myška","cz",4],["tequa7","de",4],["Ishtirakiyah","de",4],["Strxm","jp",4],["Taiso","fr",4],["aim.abuser","it",4],["gd8","it",4],["Chirox","es",4],["Meraa","kr",4],["Fly","fr",4],["46.trix","ch",4],["scarlatescu","pt",4],["reborn mefciu","kr",4],["Aquta","de",4],["convexbot","gb",4],["nxvio","de",4],["7VEN","it",4],["bxrlyy","it",4],["danielcrid06","it",4],["leevis7","pl",4],["HUNTER","",4],["Xowen69","fr",4],["cafard werox","",4],["Скорлупа","de",4],["PieceK1ng","gb",4],["totowxlf","es",4],["keelàn","gb",4],["abcshayxyz","gb",4],["dbxfv","ch",4],["MrAlexan.","es",4],["meloen","nl",4],["slemigt korvspad","se",4],["mii3en","pl",4],["f1akez","no",4],["S6røx","fr",4],["καμπεら","",4],["aight david474","it",4],["tryonagacuś","mx",4],["swefty","pl",4],["WFELPZ","pt",4],["BGB","br",4],["Garrikson","ca",4],["Merkku","ng",4],["Inksa.","is",4],["xJK7x","ie",4],["Joeyfitz1234","ie",4],["maaxaeuuss","fr",4],["AyyTox","fr",4],["Esprizr","fr",4],["Wizard","fr",4],["LUZ","us",4],["maxnw","ca",4],["Ryota","gb",4],["Zqcxre","de",4],["VtxykoAIM7","fr",4],["Lay14","kr",4],["Olise","se",4],["UNICEF TITAN","tr",4],["SCAL1SS","ru",4],["HMSTR GerBanio","nl",4],["Degloved Altrues","gb",4],["DslJtaiTué","fr",4],["Gin-Tama.","fr",4],["szymx palmer","pl",5],["Mee","pl",5],["Den0r","no",5],["luffyfv","",5],["YIYOPAYANAONLY","es",5],["Cuqui","es",5],["AMZ","se",5],["drakisfnr","se",5],["WatDaSigmaRewind","se",5],["karfamore sedni","cz",5],["Jakub3x","cz",5],["arioxxzy17","ng",5],["Skalmar","dk",5],["Bolt","es",5],["liyaz1wxr7","se",5],["montana","fr",5],["statusfv281","us",5],["Cynicwyd","gb",5],["Eronne.","fr",5],["KeinTinn.","fr",5],["200IQ NaveJR","ar",5],["200IQ Turbo.","",5],["Alexy2x","gb",5],["enxj","kr",5],["Jelke","nl",5],["SvenFV","nl",5],["PradaUCarti4","mx",5],["zaza","de",5],["bibek leszno","pl",5],["geeg","dk",5],["kejvireyli","cz",5],["Grave","no",5],["Crave","no",5],["SmUtt1s Farmand","",5],["ElGondelazo","",5],["14ｲ","es",5],["MikePike","",5],["McLovin69","de",5],["ADrizin","pt",5],["flayck5","",5],["Lwk","gb",5],["DerLiamABC123","de",5],["zum1","de",5],["plizro","us",5],["pluto pressure","kr",5],["TOTORIINA.69","it",5],["tamz","ca",5],["Mixghty","pl",5],["Detect mozzie","de",5],["Sw8tybuca","fr",5],["B3NHD","",5],["Metric","gb",5],["neoxito.","fr",5],["Zo-tuff","gb",5],["iloveaoifethighs","gb",5],["Tog","de",5],["Krowber","de",5],["GOOSE67","by",5],["Vorona","by",5],["ابو","mx",5],["4txxr Rikow","gb",5],["dazed reverned","ch",5],["scripted","us",5],["Rloan","pl",5],["david caloriferu","ru",5],["Sypex","it",5],["Dvces Copytrader","it",5],["zzastro1x","us",5],["DISRESPECTED","",5],["Baram","",5],["Nercos_","ng",5],["bxchaj","pl",5],["VeNoNeQ","pl",5],["alawi","pt",5],["WailyX","cz",5],["dxdkÿxreyli","",5],["Symz","kr",5],["profitsfnn","kr",5],["سمندل.","gb",5],["PEPSI","pt",5],["rytrox","pt",5],["maniac","nl",5],["vexo","pt",5],["MiniJeep","pl",5],["wpawel05","pl",5],["cboomfn","ar",5],["poissonfn","it",5],["BetterCall","",5],["OubliePasTaSalat","fr",5],["daitx","gb",5],["villian","gb",5],["symere woodsx2","kr",5],["steveen1x","es",5],["ortaa","es",5],["RebnerFred_","de",5],["Th54_Galaxy_Tho","be",5],["Peacē","nl",5],["drako","fr",5],["paPaolo","it",5],["ELGigio.","it",5],["Slaypzi","us",5],["Born","jp",5],["side","ch",5],["draxen","be",5],["AyelxelGOTY","de",5],["Vexx","de",5],["okechaseer","ng",5],["javjunior26","es",5],["steffann.","ru",5],["Nikolaso2005","ar",5],["majerfps","pl",5],["Blaejja","pl",5],["Mr.Muel","us",5],["2349x","fr",5],["kubi","es",5],["adrian","mx",5],["Dylan Harper","pt",5],["MLR","it",5],["Vision","mx",5],["jewncy","ru",5],["charmtryona","gb",5],["ambi17","es",5],["layniiz_","fr",5],["ante","",5],["LACKY","dk",5],["Butze","de",5],["max3enÿ","pt",5],["samlol7","de",5],["JAMON24","es",5],["Yop3","es",5],["Snezzy","es",5],["PXN_KILLABOT","dk",5],["tommison","gb",5],["Dropzz","jp",5],["Arastelias","de",5],["Guffer","ng",5],["sutter","dk",5],["seanbear","us",5],["Finn.weij","nl",5],["Milkkuma","",5],["Akane","ca",5],["liltism","us",5],["2WSET","",5],["v.bence73","",5],["LiL.HuGo.","nl",5],["Joke","it",5],["mixx","br",5],["bobbyy","gb",5],["alfie","gb",5],["zLeo","jp",5],["gervonta davi8s","de",5],["Ahead Crossair","de",5],["Jonas","de",5],["bämbi doue14","kr",5],["stikiss","fr",5],["RicRambo.","fr",5],["Sampeisz","it",5],["andryyGoHard","ru",5],["yaoulinho","fr",5],["Faloaf SAHUR","pl",5],["9uilfv1","se",5],["Own7.","de",5],["vooyt","ch",5],["true","es",5],["Tagliaferro","",5],["Rqven89","de",5],["Hunt","mx",5],["jochem","nl",5],["Razyx","es",5],["zeyn","de",5],["Vetufv","gb",5],["höbyri","es",5],["skoti","pl",5],["bambo39","pl",5],["andy","gb",5],["Tobi","nl",5],["exey","gb",5],["daddy","gb",5],["Jamiebotÿ","ch",5],["Tuxym55","de",5],["Artex","gb",5],["ZAVRR.","ng",5],["ERNOfire","pl",5],["iKayzenfv","be",5],["Djolu2","be",5],["Tk.Tiefkühlpizza","br",5],["Max_2","de",5],["julius","dk",5],["oL1cser","be",5],["xen0","fr",5],["3XBoop IQUWFT.","ua",5],["Smallxx","us",5],["snowfv","sa",5],["cNoir","us",5],["Arkoz 207hihi","jp",5],["Tiger","fr",5],["SAT","",5],["Kiratryona","de",5],["JaZee","de",5],["eghosa","nl",5],["zix.fnr","gb",5],["tine","no",5],["Single fragger","no",5],["mikro","pl",5],["xleftyy7","sa",5],["hantic","fr",5],["Léopasthecrack","fr",5],["ILUVMYFATGF10","kr",5],["ScipioDias","",5],["NextPro Antox.","kr",5],["Tomek","pl",5],["Esteves","kr",5],["henzdani9","de",5],["jojoaffe09","",5],["cratetryona","gb",5],["Kyozy_","fr",5],["demon neyyhyh","gb",5],["MariofVictor.NL","nl",5],["Edqxq","kr",5],["ichrii-_-","it",5],["unlucky","de",5],["solouxy","br",5],["maxyn","fr",5],["Maikipalma","br",5],["copifv","ng",5],["gamerbande","de",5],["Lokimi33","jp",5],["Savagee","br",5],["Syizor","de",5],["eichelpilz jonah","",5],["HosamÆæ","de",5],["BePro","pl",5],["BePro kxrolek","pl",5],["Cärlos","no",5],["baller","es",5],["Armando","es",5],["Azurya","fr",5],["faywen","fr",5],["sevenup","pl",5],["JakubKebab","se",5],["phanta","lv",5],["be-my-mommy-pls","tr",5],["FastTiger13","de",5],["bl4k.exe","fr",5],["Roito","fr",5],["Öppnaren Biffen","se",5],["Sindrefv","",5],["Nik0nor_","no",5],["NabeŁschnur","ng",5],["KubakG0d","pl",5],["toux","",5],["Hvb0n","pl",5],["Роуленд","es",5],["SorwdI","nl",5],["Anakin.","",5],["ʕᵒᴥᵒʔ","gb",5],["3AM","pl",5],["wer1xc","mx",5],["Larpcob","",5],["7pinkie","de",5],["Knospanski.","de",5],["Nrdved","br",5],["Shama","jp",5],["Pokifnx","us",5],["falcon spiro","ca",5],["Clark","pl",5],["kubinex.","pl",5],["kizzers_kokosowy","is",5],["sokuś","gb",5],["peakz","de",5],["EZARI","lv",5],["Didinee1","fr",5],["fresara","fr",5],["unö","pl",5],["Foverks","pl",5],["Blitz","gb",5],["Fabiol","",5],["Aft3rAk0s","ng",5],["lewis","gb",5],["lécheurfou2chtte","gb",5],["kafnr","de",5],["VOLLAUFTESTOMRK","",5],["Larzy","tr",5],["nextlvl leoszn","",5],["DomcaLovesBranka","cz",5],["F1X","ar",5],["elmoo29","pl",5],["Master Zhenren","jp",5],["Alfred0o0o0o","kr",5],["irooi","us",5],["moonmenfly","it",5],["ZN-TOZWEYn","be",5],["Thxrz","fr",5],["Detect Sherwind","sa",5],["Carlitos1X","es",5],["PROlaspod","fr",5],["Vy3se","kr",5],["kubymos","es",5],["jxppe","",5],["Iblis","",5],["zkxwq7","us",5],["Sbyge","",5],["Expectt.","",5],["Jackidulla","se",5],["mini","it",5],["mqnix","it",5],["NSTAR Toastÿ","kr",5],["Cold","gb",5],["Bermu","",5],["Rovbe.","es",5],["TaySon","de",5],["Joachim","fr",5],["wxilÿ","kr",5],["barougoty.","",5],["vay","kr",5],["minu","es",5],["mbappe special","gb",5],["console_beast67","pl",5],["CrypticVex.","pl",5],["Rixteldeal7","ru",5],["derpycront240tel","gb",5],["unknown warix","dk",5],["darth_shot","pt",5],["MCL39-","gb",5],["YOACE.","is",5],["Freddy","de",5],["Gretar","is",5],["Erbian Kallanär","se",5],["Gh0st","de",5],["capy","de",5],["bigcoy123","gb",5],["Arne_Engels27","",5],["BuzzCutBrody","gb",5],["Dreezy","de",5],["-200iQ","de",5],["snappi","dk",5],["wilpse","pt",5],["anysimon.","ru",5],["AuraFarmer","sa",5],["nwego","",5],["jamescl","gb",5],["Washed Polker","gb",5],["Koya","",5],["kledi21","tr",5],["Zeniix","se",5],["NOVA_nyrox21","be",5],["Alvxrolopez7","es",5],["Blanyak","es",5],["Amex","dk",5],["Doctor Dezers","gb",5],["zMontella","it",5],["PeakbotX3D","fr",5],["Fake","nl",5],["Juulioo2.0","",5],["lajnn","gb",5],["zawitheoptimist","se",5],["labrix.","fr",5],["ann3emoLUV","ch",5],["finishfoidslyr92","ru",5],["veltrix","ua",5],["Shury4ek","ru",5],["Vypixfn","",5],["Christos22125","",5],["21lenzyy","kr",5],["mommymaker","eg",5],["Chudy","pl",5],["BladeTV","fr",5],["Jabox","es",5],["LAZERBOT","",5],["MowGliNL","ca",5],["Habicht Joshi","ch",5],["teeze","de",5],["Twizyzy","fr",5],["KODGE","pl",5],["Teli.","kr",5],["agent_Delli7","no",5],["hovi","pl",5],["darek","pl",5],["atlantic mcrae.","dk",5],["24senz","gb",5],["throbicallz","gb",5],["todox","fr",5],["hoyzen","us",5],["agent Dudys","cz",5],["dïisloqz","jp",5],["KoS","it",5],["ƴukiizz.","fr",5],["kinetic","de",5],["Jenelen","no",5],["Daddy Markosyus","no",5],["wojtixbot","pl",5],["rikrav","it",5],["LEFILLABECANYAHU","es",5],["Roman Reigns.","",5],["Eli22","de",5],["Razar","ch",5],["MMIHANA1","no",5],["tobickx ololo","gb",5],["erqsy","",5],["fixify","kr",5],["pínqqe","kr",5],["clutchUK","tr",5],["aight fragger","fr",5],["noanlepirate","fr",5],["Kregg","be",5],["Thragg","it",5],["BePro KoBiś","pl",5],["IGL","it",5],["VulK7","no",5],["primeDRUXI9","it",5],["Peter","",5],["Sibbi","de",5],["MCqueem20121707","ng",5],["ttvskanderdf","it",5],["dillacrash","it",5],["zR7CheneVorTeXx","fr",5],["Mwetwo shados","fr",5],["FULsheton-59","",5],["Galaxy_Faze3","fr",5],["neufreyli","kr",5],["Arvez87","ua",5],["Ezzforencee","de",5],["milowgooner","",5],["aZixx_tv","fr",5],["brain","fr",5],["fragg nyrox","fr",5],["Azyon","tr",5],["AleFRa_ThePOW3R","it",5],["samu_gamerz11","pl",5],["Portugal Vekzy","fr",5],["Nazário Quixyy","ru",5],["Finlay","gb",5],["Emil4cow","de",5],["GambleBot","fr",5],["MITEX","",5],["Kabuus Bambus7x.","cz",5],["TILLBREAD","gb",5],["Z3rïa","fr",5],["Eri-qrt","sa",5],["Demon","",5],["Pilzy.","",5],["Jikhva","",5],["itasi155","de",5],["Sneex64","de",5],["TxmassOO","cz",5],["Dxmzzx","cz",5],["Fraanticcs","it",5],["Solary Minori.","fr",5],["Kuramaa","fr",5],["lyners","de",5],["AsKa_GoKu","fr",5],["AsKa_p0k3s","fr",5],["Serious7","co",5],["talent","ru",5],["homz","de",5],["Creative Cha0s","us",5],["Tactical","us",5],["zwoigig","fr",5],["slowzn","fr",5],["havok nowaa","dk",5],["yhyh.","ar",5],["ganah","br",5],["coachesdontplay7","eg",5],["Ipana","tr",5],["Tiyoku","de",5],["Spayabi","de",5],["paulowingu","pt",5],["Antunes","pt",5],["VIRGEN Ncala","es",5],["ᵇⁱˢᶜᵒ.","it",5],["sparta","it",5],["Kochany-Flixxy","pl",5],["Kochany Felix","de",5],["lidohz","it",5],["Cracker","it",5],["joseangelc17","es",5],["Subaru Dylan.","de",5],["Stilinski","eg",5],["Kefir","pl",5],["Swittyz.","pl",5],["Albaner","",5],["rax","ie",5],["1shaa.","cz",5],["UNKNOWN","us",5],["FOKUS","",5],["Romebot","us",5],["chance","us",5],["kxtsoo","",5],["ggs","ng",5],["Rayzz","de",5],["Cyclíct","es",5],["Bryandrmt22","",5],["GOTY77","",5],["Funtrix","de",5],["ᵏᶦʷᶦ","de",5],["MucaFn","tr",5],["ton1ko","pt",5],["FALCON madvic","nl",5],["CLXSE","nl",5],["namofn.","fr",5],["Jolagreen","ch",5],["obyjj","gb",5],["XP42","uy",5],["tutisven","ua",5],["kazzytryona","es",5],["kylian mbario","es",5],["Shxwn","de",5],["KAYNE","de",5],["Kafa23.","de",5],["envii8","pl",5],["FÎlt","nl",5],["Henry","gb",5],["fenaticc.","pl",5],["Zyroskii.","gb",5],["dylanbugha1","gb",5],["yuum1","de",5],["Seaw.","lv",5],["Agilidan","gb",5],["dapairu.","es",5],["fajaardoo.","es",5],["chinese pollo","ie",5],["oogway.fv","",5],["capi","se",5],["RÆYKA","dk",5],["Knut-Uwe","de",5],["KCP","es",5],["sosa7","de",5],["Booma2025","de",5],["moltisanti","gb",5],["szxmus","pl",5],["hxnus","pl",5],["solar","gb",5],["Potato alexx","gb",5],["Chkzy.","br",5],["Bummsbanause.","de",5],["Tinoo4k","eg",5],["BEVERLY Kr4ks","fr",5],["nxhill","fr",5],["youboy","fr",5],["MiniKami89","jp",5],["Sweetie","pl",5],["gotzy","",5],["Ratable_b0xed_u","gb",5],["Yeetdudeop1","gb",5],["Huurcontract","nl",5],["veggio","nl",5],["Kivancc.","tr",5],["zAmethyst","ng",5],["BassieFN","nl",5],["adølf","ua",5],["dma","kr",5],["baby","fr",5],["Antiheldd","de",5],["Szeth","us",5],["yuhzc","pt",5],["goofytrain","ru",5],["wat4ed","ru",5],["Rwar1","tr",5],["Romeoangy","kr",5],["Yousif Goty1","us",5],["Enrique","de",5],["maik_inho","br",5],["frxnc","de",5],["Fxlkoo","",5],["SupermanSandro","ch",5],["SeeKiwi","de",5],["Heuwender1","de",5],["rs6","tr",5],["Grind Zekrom","it",5],["SwE3xIt","uy",5],["expofv","pl",5],["v7_samu","",5],["B1i0n","",5],["dzikus enulkus","pl",5],["bombozzero","pl",5],["Bobatek","pl",5],["gabe","pl",5],["K3llio.","pl",5],["ninaa","it",5],["Wyved","gb",5],["emst437","nl",5],["Shady","",5],["wazzinowingu","fr",5],["adam-sahur","ie",5],["Zykofv.","",5],["twizzyfnr","",5],["MyMatch Julian","de",5],["Lasko","de",5],["comeback B0ris","au",5],["KB_Potato69","se",5],["syph8k","fr",5],["deglingos77","fr",5],["zachbot","gb",5],["victor","gb",5],["t7mus","pl",5],["twix.w3eq","",5],["kelany","gb",5],["limit lightskin","ng",5],["Efe","de",5],["wekzz","de",5],["Discord Kanaya","",5],["Yaniszz","dk",5],["lu4oo1","",5],["Kirko","de",5],["kxsios.","",5],["ᵏᵒⁿᵃ","pt",5],["yutuk","ch",5],["0mer_00","it",5],["Prefired200","gb",5],["VManu13579","gb",5],["bayy.exe","fr",5],["Skyzo","br",5],["HIF","se",5],["comeback","",5],["twich jinacl2","",5],["rxbyGOTY","",5],["levi272828","jp",5],["brokenpay","fr",5],["hugoserranopt92","pt",5],["BuckyN7","it",5],["Puggcili2312","",5],["opportunitytaker","eg",5],["Olp_biscote-_-","fr",5],["Ghostfit","fr",5],["Veltrax","it",5],["rawl","it",5],["dedeo panchitas","es",5],["Top8Nton.","gb",5],["GameLeftHim","",5],["TomasJRUK","es",5],["00lytex","se",5],["l4vr0","es",5],["Zak","it",5],["fast","gb",5],["falcon","us",5],["painency","tr",5],["loyal","ie",5],["zarexbubu","kr",5],["Fixz","",5],["halias","gb",5],["kaznacho","ca",5],["Cboyx_","ca",5],["Tearrd","",5],["PawPatrolFan6969","kr",5],["anyxii","de",5],["cräpźź","be",5],["Primal Chudlet","eg",5],["Raffi","eg",5],["cookssbot","fr",5],["zaddy","br",5],["Jewwyv2x","mx",5],["manolz","dk",5],["el1j","kr",5],["Chiqui uzumaki","es",5],["jxsee7x","es",5],["Kttorz","be",5],["kiri","be",5],["Wombats00","de",5],["timo1fnbr","de",5],["BackToLobby","us",5],["Bierkönig","ch",5],["Mertr0","kr",5],["larp","fr",5],["CrOcX","de",5],["BT_VoXiFy7","de",5],["kkuxÿ","ru",5],["andrix","it",5],["Ramasse_TesDent","fr",5],["DegustesLeSol","fr",5],["trzouke","gb",5],["Mourinho0","de",5],["Guardiola0","de",5],["Alias","fr",5],["quixx","de",5],["slaÿz","de",5],["warrior","ch",5],["venndetta.","es",5],["JorgeJIJM","es",5],["TèñZ","gb",5],["markohotshotav","gb",5],["frey","ru",5],["wasched","",5],["GOAT","pt",5],["Badocha Dictador","pt",5],["onkel crakzy","",5],["unsair-elpepas","ie",5],["cabezudoo","es",5],["ziy4r","be",5],["Elected","gb",5]],"NAC":[["CHLOEAIMS","us",2],["imwashedfv","us",2],["p1ngfnz","by",2],["Smokerized","mx",2],["Mixghty","pl",2],["Burritoes","mx",2],["Mouss","fr",2],["Bachira Rikow","fr",2],["Reboundz","au",2],["xarhexok","mx",2],["batch","us",2],["June","us",2],["coop","us",2],["skyyfv7.","kr",2],["SRG","pt",2],["Milkzy","us",2],["yolkslieinapril.","us",2],["uchiha","us",2],["jackreyli67","au",2],["melon","us",2],["loganbot","us",2],["sameer","us",2],["Migon","fr",2],["Flawless Nejii","br",2],["Dallem.","",2],["BlackBean","",2],["fisty","",2],["angelfishyuwu","mx",2],["roohkey","",2],["Toonss1x","us",2],["jj0sh.","us",2],["Sxrge_EX","us",2],["CUPIDO","us",2],["p1nto7d-Ceo.Of","",2],["blehxoxo","mx",2],["BabyShadyDoit","",2],["just","",2],["heated1x","us",2],["smearicular","us",2],["peace","us",2],["Kyro7x","",2],["mateofnx","us",2],["gritsaga","",2],["civko","us",2],["M1keScythe","us",2],["fruitpunchlove44","de",2],["zxylaa8","mx",2],["solox14_","us",2],["keetÿ","us",2],["star","",2],["Krampus","",2],["arima","mx",2],["alehch","mx",2],["ILUVMYFATGF10","kr",2],["bray","us",2],["owen1x_","us",2],["FroStywydd","ca",2],["blackrocpalantir","us",2],["levens rocket","",2],["sunami","us",2],["izumi","mx",2],["Slaypzi","us",2],["Born","jp",2],["susbakaglace","pl",2],["power","pt",2],["npcbray","us",2],["Firemask1","mx",2],["Bully Nakano","",2],["cagxyz","ru",2],["Cola","co",2],["Drillexd.","us",2],["arcticfnr","dk",2],["kerox.","se",2],["lopera","ng",2],["NyxsChaChi","nl",2],["kolme1k-","dk",2],["Rehan","us",2],["beck","",2],["owyee369","us",2],["tonicfn1","us",2],["CorkedTester634","us",2],["Jaden","ca",2],["Zoxly","sa",2],["egy","us",2],["alexfv","us",2],["scxff.","by",2],["Arctix1x","us",2],["riichardd-","mx",2],["urus.","co",2],["Kytro","de",2],["xavreyli","us",2],["kudo","br",2],["goodfellas","us",2],["swimz1x","",2],["fluprs","us",2],["parby","co",2],["taizen","fr",2],["kobyxyz","us",2],["height merchant","",2],["kepiana","us",2],["dazed matawdym","ru",2],["obito","us",2],["Dust","mx",2],["Jyrxh","",2],["Yiorghos","",2],["Nytzx.","ca",2],["SP3REX","ca",2],["plaz","us",2],["Boqzo","us",2],["odufs1x","ng",2],["yoshi","",2],["CrFrmdaWic","",2],["Housen paveo","gb",2],["Housen","mx",2],["piece","ng",2],["btwthiaginszn","nz",2],["Rodriguez.","ar",2],["dazed phoenix","us",2],["bbc","us",2],["KillA","mx",2],["zorph","ar",2],["tabsfv_","us",2],["rrealer3800","us",2],["Vira","pl",2],["flwlss frizi","pl",2],["warrionaa","ca",2],["sazey3x","us",2],["Batman1Fv","us",2],["sapofv","gb",2],["zenn","no",2],["peter4","dk",2],["Ynott","gb",2],["Twtter EclipseVC","ca",2],["Spacemax","de",2],["Dark","dk",2],["nidexmvp","ca",2],["who.xora","ca",2],["dzd","ca",2],["Jakski","au",2],["luu","de",2],["JanmanNK","ca",2],["axel","co",2],["CAB","us",2],["loganmbl","us",2],["duzan","us",2],["fear","us",2],["t2g","ca",2],["icey","ua",2],["Legi1","it",2],["HIZIXX","ua",2],["t3eny","fr",2],["Jay","us",2],["Aimiri","us",2],["mikiefv","",2],["cxmaron","mx",2],["remake yunter","mx",2],["smokcristo","mx",2],["bran-eds-gal","mx",2],["francho","co",2],["Lask","mx",2],["shxrk","dk",2],["Mercy","mx",2],["PEAK","mx",2],["belgucci","gb",2],["dwavyskì","gb",2],["uhMattex","us",2],["glimp.exe","ng",2],["relax andy.","",2],["RJOKIC","",2],["Muggy.","it",2],["crotex","us",2],["flux","us",2],["axel281","",2],["ganadi94","kr",2],["GoKu","ar",2],["loyza","dk",2],["kyred","us",2],["Lazy","ng",2],["dannyJzombie","us",2],["ARCA","us",2],["reroluvsblondes","us",2],["SirBolks","us",2],["Reaxtion","mx",2],["toitoy kawai","mx",2],["scufd","be",2],["Wollo","kr",2],["torchspot","",2],["chrisxyz","us",2],["zergfv1","",2],["Mortyx","co",2],["falcon zykobot","us",2],["slimerops.","us",2],["CopeCopeSahurYAY","",2],["pock","",2],["Fear421","us",2],["Floperchik","ua",2],["Estrogen","ca",2],["swavey","de",2],["frubot","us",2],["Zbergh","us",2],["Izzy","us",2],["qreyy","us",2],["ghoul","us",2],["flokzŸ","us",2],["ALCURIST","",2],["vxbezbuca","us",2],["z19","ca",2],["PolloLocoCuh","mx",2],["dummysana","mx",2],["EVILT3DDYY","mx",2],["polly","sa",2],["emptyRX","",2],["fxbrix","es",2],["mewfv","us",2],["Cxsh3x","us",2],["OhMyGodDuck","us",2],["ECHOELITE","",2],["Says","mx",2],["boogeyzkbm","ca",2],["KenanOW","us",2],["Retired trxckz.","ca",2],["Tyler","us",2],["Solar4x","ca",2],["complex1fn","no",2],["Free","gb",2],["Slix","",2],["Fearzy","us",2],["Kdnyfv","us",2],["sover","us",2],["parzZzero0","ca",2],["GhostyNallanVort","sa",2],["tyt","ar",2],["reesefv","",2],["Tuso","gb",2],["sparkz","kr",2],["falcon yostin","mx",2],["ANTHEM","",2],["koslix","",2],["syphon goons","",2],["kaijufv","",2],["Bxcon","us",2],["VTP","is",2],["snackyfv","",2],["Aced117.","us",2],["ritualxs","us",2],["Buzzata.","",2],["ëdgy","ca",2],["grwth drispy","us",2],["xsy8","kr",2],["kriptik2x","ie",2],["Absent","us",2],["Bdayy","kr",2],["Hidden Factor","us",2],["Teeqs","us",2],["proper","",2],["Toronto","br",2],["saucy.","gb",2],["EnMiPrima","mx",2],["cerberus","us",2],["gura","jp",2],["khauzy","us",2],["WTJ","",2],["mortywtw.","us",2],["Nazaroonie","uy",2],["lÿxiexz","tr",2],["acerofnx","us",2],["Gax","co",2],["t3rlox","",2],["beana","mx",2],["Logan Tyrone","it",2],["senquz","pl",2],["solecitotox","mx",2],["HazeVG","gb",2],["uphis","mx",2],["piven","mx",2],["paa8_","pl",2],["dig","us",2],["1xwxrrier","",2],["Chompiman","co",2],["Pirush.exe","mx",2],["Soiledfnw","mx",2],["dahbiggah Swezy","",2],["sokyo pigeon","gb",2],["nut","kr",2],["melly","de",2],["Jayce","ng",2],["OVO","",2],["TSP","us",2],["Editzz369","gb",2],["FLIRKMGERKIN","",2],["kellan","gb",2],["shmuel","gb",2],["StickyTip911","de",2],["lluvia","mx",2],["morfv","us",2],["Mandoom","ar",2],["Marett1","",2],["trixx","jp",2],["MaIek","us",2],["hylnd vediana.","mx",2],["goonbot kaysonfn","fr",2],["cxloudzy","ar",2],["treyhszZzero0o","jp",2],["ayden","pl",2],["vindicbajatangas","mx",2],["shxfty","de",2],["JaydzZzeroOo","pt",2],["ohzyxx7","us",2],["yoru","ru",2],["1337soup","us",2],["Rancewithnopants","us",2],["iomod","mx",2],["Jona","us",2],["destroÿ","fr",2],["Exoticz","kr",2],["markoz","kr",2],["wydwix","se",2],["oakzy","us",2],["temareyli1","mx",2],["fansy","by",2],["Autizc_1025","",2],["Mihson.","pl",2],["oogwayshter","jp",2],["Portfn","us",2],["twis","kr",2],["Oatsey","jp",2],["Vigo","is",2],["noah","dk",2],["kapz","ch",2],["twich xeleroid","fr",2],["zzastro1x","us",2],["DISRESPECTED","",2],["sprite","br",2],["venox larps","ar",2],["Хох0лд1к","ua",2],["cactiwyd","",2],["spotify-zevvyy","",2],["yansteriana","mx",2],["jisus","us",2],["dominicano","dk",2],["proders","mx",2],["Coqeéin","mx",2],["pinky","us",2],["evo","mx",2],["adamfvv","ca",2],["hachee","ca",2],["TelAviv spleeqzi","fr",2],["SHOmedaway","",2],["crxyq","us",2],["Loss1x","ca",2],["cheekilycheek123","us",2],["outfv","us",2],["mtn","es",2],["deniro","gb",2],["ZINX1V","us",2],["hativa7","",2],["hunch1k","mx",2],["Mevqttles","ca",2],["pebblefnx","ch",2],["spiralrr","ca",2],["IHATEGODKICKS","us",2],["Rizmo","fr",2],["Toaderina","",2],["Jvsshua","kr",2],["nbayoungbodih","",2],["viperxyz","br",2],["twan","ca",2],["okayrehab","us",2],["doa","",2],["ADEY","ng",2],["zurkiz","ru",2],["Rylxn","us",2],["Jxson","us",2],["OnRamen","us",2],["Dustyfnx","us",2],["Dazed","it",2],["davidu","ca",2],["vifth-","",2],["drankmethod","",2],["Blitz","",2],["DubhowlTTV","us",2],["wasted talent_","us",2],["maiki","mx",2],["deafnw","mx",2],["khaosbot","us",2],["GIOALV","mx",2],["roimaine","",2],["Xërxes","ca",2],["LuLuzito","br",2],["strendd","ru",2],["winboxing","jp",2],["Yumilicious","us",2],["Assassin-Ex","",2],["FNmrtiger","us",2],["makeittofriday0","",2],["king","us",2],["hqy","ca",2],["psyc","ca",2],["FataL","se",2],["sinssbot","",2],["dashfv_","us",2],["Rule","ca",2],["pulse","mx",2],["k1ngenzo","us",2],["deazorr","mx",2],["leonissz","mx",2],["jakerzMAX","au",2],["cunop","",2],["Oceanzfire","us",2],["fear3k-","us",2],["crystal5x","eg",2],["N.Y.","mx",2],["gluffylmao","us",2],["dextuhroonie","",2],["talanfv","kr",2],["timid","it",2],["gabe","us",2],["funkymonkey1346","mx",2],["skı","",2],["drkkfnx","",2],["Kosher","pl",2],["Teyko.","br",2],["josh","gb",2],["Dxrth","",2],["aycesznn","us",2],["amador.","mx",2],["kwake_","us",2],["Charledd","ca",2],["Amary","mx",2],["Zinedine","pt",2],["blitzZzeroOoo","us",2],["coopfnv","gb",2],["monkey zKief","mx",2],["CVX","us",2],["LwaFvv","es",2],["noxiwyd","mx",2],["Elfbot","us",2],["t3enyxarr7","se",2],["Lynx1zr","se",2],["blaze milofnw","us",2],["timfnn7","fr",2],["BRW","us",3],["Lightskin Sphinx","kr",3],["Nick1ck","us",3],["okie","ca",3],["cotatofn","us",3],["zaxy","us",3],["Tomluvssmgs","fr",3],["Silis","mx",3],["nobless","us",3],["Andrew","us",3],["Tizzy_f","us",3],["venyx","dk",3],["foyzelia","us",3],["Johemp","us",3],["Haydenfn4","ca",3],["tugo","co",3],["range235","us",3],["itzmeduty","",3],["aurora sxntinal","us",3],["scrutony","us",3],["wydtiago","pt",3],["Volit","mx",3],["xmagbot","mx",3],["SNST","us",3],["kaz1rl","us",3],["Daniel","us",3],["GREY","us",3],["arkxlogy","kr",3],["joytonrogerlinz","gb",3],["AndrewFNBR","lv",3],["cyl7sxv","us",3],["zrr2v","ca",3],["aimmade","us",3],["BLICKY","ca",3],["Yoobua","mx",3],["KLA","ca",3],["yhambot","us",3],["Zhira","de",3],["BABYGANG.","gb",3],["FbujLovesFeet","",3],["Tekzzie12","pt",3],["derre","se",3],["znn","se",3],["boro.700","fr",3],["dada","fr",3],["oscr","no",3],["yempy","kr",3],["Zet3eny","dk",3],["n0k","gb",3],["vernow.","gb",3],["Pxle","gb",3],["EndEvilFortnite","us",3],["Fortnite","us",3],["Runrun","mx",3],["dingus","us",3],["princefv0","us",3],["Noonkk","",3],["BUBBA","us",3],["dillbot","us",3],["salvatore","de",3],["vuxyfv","us",3],["ppt","mx",3],["Its_chirris","mx",3],["slukky1","br",3],["Taedenn","ca",3],["flujo","",3],["yoRavage","us",3],["Jacobo Wayne","mx",3],["jutsk-","mx",3],["bibloeroonie","us",3],["Brxndn","us",3],["Kaycargr","ie",3],["pookie","",3],["Teddfv","us",3],["benjfv","es",3],["CrownKaChow","ar",3],["cris.","pt",3],["thementalist","mx",3],["MANITOGAM","mx",3],["Munky","us",3],["sprox1x","us",3],["HydracteurX","fr",3],["storm","us",3],["sak","",3],["HvK","us",3],["kor","us",3],["vatz","ru",3],["Batman","mx",3],["maximum whipped.","us",3],["chatgpskii.","es",3],["zeyy","fr",3],["fno","ca",3],["Tenzi","mx",3],["tedsterfn","us",3],["FRXSTYY GRIMES","",3],["Amaree","us",3],["1up","mx",3],["slowfn6","mx",3],["raftfn1","ca",3],["Albie","gb",3],["Vinnie","gb",3],["xv.bnoah","",3],["hamzathepirate1","",3],["jaaysBfn","",3],["zapuff_","",3],["TsmMigue","mx",3],["Fullychopx filmy","",3],["Moneymaker","us",3],["bolt","ca",3],["Legi1 WhyAlwsPiz","it",3],["Panino Giusto","jp",3],["Kyvero","",3],["cozyfnx","uy",3],["ZolarDiff","us",3],["Koval","",3],["Koz","us",3],["Miles Pardo","us",3],["STRIKERG220","",3],["Nagiagats","mx",3],["B1ionic","mx",3],["Antonix","it",3],["LuNaR","ua",3],["Hyper","us",3],["Atlxsgender","",3],["December","us",3],["devize","",3],["USERALVIN","us",3],["ToughGuyClifford","",3],["Splix17","se",3],["RyetZzZ","se",3],["연시은","",3],["falcon","gb",3],["mariahhdum","mx",3],["venofnw","gb",3],["moxybot","ca",3],["dash","ca",3],["meechoh","",3],["SnackyFN","us",3],["puhriah","sa",3],["Pakkabot","",3],["3xta1an","us",3],["gansobo","mx",3],["YERELI","mx",3],["SSJAGJ","mx",3],["ċqm","",3],["ehxsw","",3],["X963M","mx",3],["TARAMM.","gb",3],["Omenz","ca",3],["navarrette","ca",3],["Demmygodz","ng",3],["barnabi.","mx",3],["clapbytrapz","mx",3],["eduartxnwz","ca",3],["80msOmar","us",3],["Joyboy Gxbri","es",3],["Taqwx","br",3],["XDBoomie","",3],["foule","ca",3],["cosmic","us",3],["Fadezyfv","us",3],["Sponge","mx",3],["Repio.","",3],["syco","",3],["matinker","pl",3],["upr","jp",3],["prs","mx",3],["Priv","us",3],["Nutty Slushy","us",3],["SubluxatedFN","",3],["VOID","mx",3],["dihsciple","us",3],["ALCHEMIST PRIME.","ca",3],["Joeyywackem","fr",3],["Frye_boyz","us",3],["Jewstafa.","ca",3],["Lowswiz","pt",3],["pormoco","",3],["riitatouille","gb",3],["lurrkur","us",3],["mika","de",3],["SHYLAH UZUMAKI","us",3],["9toast9","ca",3],["splxsh","",3],["cuhzui","us",3],["sidbot1x","ng",3],["Slëëpy","mx",3],["strix","us",3],["Lovlaxy","us",3],["GIZMO","fr",3],["sisya","jp",3],["SILENCE","nl",3],["AGAIN_","mx",3],["ditto","us",3],["ytMexicanGrubby","",3],["stride","ua",3],["scxred.exe","us",3],["twttr vitex49","de",3],["bonanza","ru",3],["黑色的","ca",3],["Bento","us",3],["fairs Andres","br",3],["nekovsky","fr",3],["sabbycarp","de",3],["Torrado","cz",3],["Rielero009","mx",3],["Futgamepr0","mx",3],["kimmichfnx","pl",3],["dripwoo.","",3],["fortnitelego90","gb",3],["wokatures.","",3],["mirkill3","",3],["Tokyo","jp",3],["Jisk","mx",3],["TheBlackou","ca",3],["Klazoxie","ca",3],["Vitzz","br",3],["4capss","ca",3],["glokk","us",3],["benjyfn","us",3],["tigoki","mx",3],["cubanfv","us",3],["ianwywd","gb",3],["Duty.","br",3],["Engel","pt",3],["uwu","us",3],["jesus saves","us",3],["jbolivia","",3],["moonfz","br",3],["LandonZ","us",3],["BraelonZ","us",3],["decker","br",3],["Big","us",3],["warden","mx",3],["harlem","us",3],["BOOYAH","",3],["Daltonic.","us",3],["Acetryona","ca",3],["newsoltz","ca",3],["fartmachine","us",3],["Flumiy","",3],["mtrx","",3],["Bodzyz","ca",3],["project prokat.","us",3],["Monster Elvis","us",3],["rexs","us",3],["Kudej.","us",3],["octuple bypass","",3],["Fronxp","",3],["tixi","ua",3],["Kamifv.","mx",3],["Acid","us",3],["Derxy camilo","us",3],["Neon058","",3],["AUR","de",3],["ttvpeywonthisone","",3],["PRIME DALEY","ie",3],["ZeroLovesAkeno","us",3],["Lynox","gb",3],["kane","ru",3],["Kurzafnbr","us",3],["FuriouseMix","tr",3],["coax","mx",3],["zRandyachee","gb",3],["JaidonAllen","us",3],["JamzterFN","us",3],["xorexyy","us",3],["Hgonit","us",3],["Peter","de",3],["auraking pkbot","",3],["richie","br",3],["ThanosKbm1","ng",3],["Tome","ng",3],["lebronn","",3],["absxlutefn","us",3],["ccisnutty","us",3],["Vola.","us",3],["Sxlar Taylor","",3],["vertzerzgk4fv","us",3],["quinn","",3],["frugal","jp",3],["mikropiece","ua",3],["Paco_Pedroza","",3],["crijim_","",3],["Zyca","de",3],["IndianTribefv","us",3],["raynnfps","us",3],["sunflame","br",3],["HavoK Solar","uy",3],["antoboyy","ca",3],["mikydouda","fr",3],["Aura","ca",3],["FN.Jake","us",3],["lurker.","us",3],["Jaden_mtz","mx",3],["DRY-21","mx",3],["67Manuu","mx",3],["unknown","mx",3],["amour","",3],["Stepz","fr",3],["snowcat1x","",3],["chrisfv","mx",3],["JakobWorld1","",3],["FrXyZz","",3],["dazed chargedxdz","fr",3],["Meowlbubu","pt",3],["Siglarski","us",3],["Grotto Henchman","us",3],["Javsterfv","mx",3],["Yeetzinho","mx",3],["0lof332","kr",3],["roccoicular","us",3],["tharealstar","us",3],["perodox","us",3],["admista","ca",3],["Insta cobieg_","us",3],["Shotzz","ca",3],["sylxnt","ch",3],["cheeseburger51","",3],["dymanic1x","ca",3],["Elrompecraneo954","es",3],["Irv","mx",3],["zoot","",3],["syan1x","us",3],["bingaling","br",3],["Tactical","us",3],["Wrath","pl",3],["Elicool8901","mx",3],["AKUMA Shxrp","by",3],["finity","us",3],["Lotz","us",3],["canezerrafan69","us",3],["spaz","",3],["Ferr","",3],["WerooBot","mx",3],["lancelot","mx",3],["SOITISMYID","us",3],["Astroski","",3],["Lil","us",3],["kite1","kr",3],["HRZ","",3],["Riven5x","us",3],["jax","mx",3],["T0RTA_DE_TAMAL","mx",3],["cubicfnw","mx",3],["Jamon1423","mx",3],["Roimarlol","us",3],["Fundes","mx",3],["pooduhwooduh","",3],["deb0vwxz37ozki0x","mx",3],["Obrien","us",3],["Blake","",3],["chubby","us",3],["Shord","us",3],["zurlyfv1","us",3],["7treyy","de",3],["HostCustoms","us",3],["applemuffin22","us",3],["Dinotics","",3],["Kyroxxda","is",3],["Closer","mx",3],["RAVAǤE","us",3],["Skylaä","mx",3],["kozart","",3],["nonocaro73","fr",3],["UntamedOwl38","ru",3],["thekillernug17","",3],["A.P","mx",3],["blade","ca",3],["ryze","es",3],["inspired_","us",3],["kaznacho","ca",3],["AST_Meuxybtw","mx",3],["Snacky","mx",3],["JJ00","us",3],["Julius-Juukulius","us",3],["AleIN Pozolito","mx",3],["ᶜʰᵉᵛⁱˢ.","mx",3],["dmilszn","",3],["sync","es",3],["yanca","mx",3],["nowy","us",3],["SHATTERED","us",3],["grabba shake","ca",3],["astroreyli","pt",3],["MertiLux","us",3],["ttvtrickyo","",3],["Drowt","us",3],["Vixzo1k","us",3],["bladed","",3],["grenzgod","",3],["Deion.","us",3],["ChunkyLukeYT69","us",3],["turbo","us",3],["Vayreyli","",3],["max","us",3],["dawdabaye","us",3],["FPFReflex","",3],["Teqhz","",3],["adynify","kr",3],["cvkfortnite","us",3],["kvandelden","us",3],["blohshY281","nz",3],["KaizFire","ca",3],["muybien","nz",3],["m8game","fr",3],["DroxzAim7","us",3],["ZynxV2","",3],["slizies","",3],["bndos","es",3],["tacobell luver","us",3],["prx","us",3],["FXR","",3],["YAKSH","us",3],["vyrx","us",3],["MXRCY","",3],["A1den","us",3],["HugeCrawdad4475","mx",3],["Leadfv","us",3],["nightlux","ar",3],["Broxer.","us",3],["SKIBIDI alex67","mx",3],["ify","us",3],["nxh","",3],["Afexxking78","ca",3],["Warven","ca",3],["xnaytee","ca",3],["heywillie","ca",3],["blowy","it",3],["Zeyvonta","",3],["m.fv","gb",3],["CHEESEMAN","gb",3],["Optitamal","mx",3],["BlytheZ7","mx",3],["masha","mx",3],["wholetiefv","ua",3],["Ravalks","us",3],["Tdiddle Truce","",3],["koaztz","",3],["HUSKII","mx",3],["sahur","",3],["realmz11","it",3],["marks","gb",3],["7cooler","mx",3],["Dignitas vCrxzys","no",3],["Portssy","gb",3],["LeakyWalrus","ca",3],["Shxrk1x","es",3],["xAngel","mx",3],["czshy","se",3],["Tronsz","mx",3],["Jack0","co",3],["fizyfv","us",3],["jinn","kr",3],["Volxy","",3],["Raikel","",3],["Damian08destruct","",3],["Insane","",3],["FLATTER26","us",3],["Gokap","mx",3],["Glorify","us",3],["Vortex","us",3],["zaph7k","us",3],["Itz_21_","us",3],["Pilates Scrappy","eg",3],["lizardd","mx",3],["Mordecai","mx",3],["yennifer","us",3],["Noticed","us",3],["naby","fr",3],["pioupiou","fr",3],["vexox","sa",3],["anime_lover901","us",3],["Flanker","mx",3],["dyzzle","ca",3],["hyd","us",3],["always first","fr",3],["Sunix","mx",3],["malibuce","ca",3],["shellzz","es",3],["SNIPEBOT","us",3],["tonio","us",3],["Lootboy_shrimpy","",3],["Sharky","",3],["grc","es",3],["veroc0","es",3],["yearn zeek.","",3],["MANCity","us",3],["Risky","us",3],["cuhkiez","mx",3],["Zyrek","mx",3],["LXZARO","mx",3],["burrbary","us",3],["babydxwndoit","mx",3],["poey","us",3],["fenixxyz","",3],["Obliviousfnx","jp",3],["ale-daru.","ca",3],["Kursed","us",3],["funky","us",3],["JeyyReaper","br",3],["XSET","us",3],["ᴊᴏꜱɪᴇꜱ","us",3],["Coffeefeinn","us",3],["GOD","ca",3],["Punkiesaurus","us",3],["01Senka","us",3],["NMC","us",3],["matt","us",3],["Ryofn0","",3],["Diegofvt1","ar",3],["ilyzaid","co",3],["yowfn","mx",3],["4ktJelly","us",3],["zCrash2f4u","us",3],["vosh","us",3],["screwblank","us",3],["broisonfv","ua",3],["adhd","us",3],["60ﾠﾠ","us",3],["chillyybtw","",3],["jimbo","es",3],["kiko","br",3],["Matt_boxed_u","us",3],["eurotakis","us",3],["regresa","mx",3],["ᵃˡᵇᵃʳⁱᵗᵒ","mx",3],["Reese Fan123","",3],["xbofv","ca",3],["Marcus Crackus","",3],["Ghostyz","us",3],["phantomwtw","us",3],["alvaro10010","mx",3],["Carriolo","es",3],["pekka","fr",3],["Jotazs17.","ru",3],["spankywyd","jp",3],["Xylofrt","us",3],["rynfv","us",3],["Playboi","",3],["kirios knockers","pt",3],["Van","es",3],["FataL Never","es",3],["WhenIcatchYOU","pt",3],["itsqxan","us",3],["jīnx","us",3],["ReczoFn","mx",3],["XSETCHROMEWRIST","ru",3],["Pilvix","us",3],["Pathless.","mx",3],["Seunamii","us",3],["Slush","us",3],["cam","us",3],["WavyTen","",3],["Fished on3742","",3],["AstroTB","ca",3],["autm0","",3],["Drexfv","us",3],["mmg","",3],["BraynzzQ_","ru",3],["Lyost Tøhundred","dk",3],["K3.147","",3],["SPAIDERDOGE2","co",3],["SNOW3","us",3],["nekko","mx",3],["Cookie_2z","",3],["ovajuju","",3],["Vezy","us",3],["ColeWtv","us",3],["blamm","",3],["wydflxy","us",3],["yoDJ_","us",3],["Firestarter9948","us",4],["DaRealGuyy","",4],["kiira","kr",4],["ybbetter7x","",4],["skies","us",4],["Akane","ca",4],["Ethicalreyli","us",4],["SCARPEY","br",4],["MurphTheUnicorn","cz",4],["Egirl foxette","fr",4],["Kiler ghostt","",4],["stixzz","us",4],["darklord","br",4],["chapis1x","us",4],["BazzZeroOo","",4],["qxertski","se",4],["narF","by",4],["Mad","us",4],["Yuu-pollike","ar",4],["gznsr","us",4],["Sinefnx","us",4],["notice","us",4],["Solo","us",4],["benegas","ru",4],["payn","us",4],["Aciid","us",4],["İcy","us",4],["Auntie Annes","co",4],["keyj.","",4],["Shxrk Junior","us",4],["bheasley274","us",4],["TIKTOKEmalaz","mx",4],["Skywrld Syphon","pt",4],["modric","fr",4],["rezeii","no",4],["ZAYREYLI","fr",4],["ʏᴀɴᴇᴢ","ar",4],["oni","gb",4],["Fronkyfv","mx",4],["Giuly","mx",4],["Snoxxi704","us",4],["mattlol3","it",4],["arabkevin","",4],["Vergo","us",4],["Carlor07","us",4],["iceman","us",4],["PixelGod.","gb",4],["harrison","gb",4],["matuidi skyrix","eg",4],["Tibl4ze_","it",4],["Bahmlol","",4],["Buddy","us",4],["Führer Change","gb",4],["J2YXD","us",4],["fadedtrynder","",4],["treywtww","us",4],["anthxnyfv","gb",4],["kiwifyXD","us",4],["Drxppz","",4],["Drixwyd","us",4],["CHILi","",4],["leoxd12204","pl",4],["KhizaBot","us",4],["doxwtw","us",4],["blessedbyisrael","us",4],["cri","ca",4],["Washedfnx","us",4],["cozy","it",4],["Kylefooty","us",4],["Uzbek","mx",4],["ZetSawTheSigns7","kr",4],["Zharr","",4],["junyfv","",4],["Sizz_x1","es",4],["Snoopy","mx",4],["Loboloko","mx",4],["JayVXYfn","us",4],["Draygor","",4],["NeWincognit","",4],["mitchelalga","mx",4],["Divine","mx",4],["Kluewix","us",4],["CrxitDaTruth","us",4],["Terpin","gb",4],["willywonkawanka","au",4],["vibinxyz","us",4],["goofytrain","gb",4],["osaa","pl",4],["icyjerss","",4],["A-Tate","us",4],["stewy","us",4],["LondysCozy","us",4],["Faze_gav_xx","gb",4],["JESUSS SAVES","us",4],["Shine JuTe.","us",4],["B1rd","tr",4],["ｋ１ｎｚｏｏ","mx",4],["Skatefw","mx",4],["OL1VER","mx",4],["ValdoKong1234567","mx",4],["jxvì","us",4],["bellakayfan69","us",4],["FoxyJayJay","us",4],["tittals","us",4],["dayclan14","us",4],["R8INTV","ng",4],["Trixy abc123","us",4],["aaron","mx",4],["raxxor1k3","ua",4],["Yonnafv","kr",4],["sorin voidtxz","us",4],["force Adrianfv","us",4],["cheetoh","us",4],["Skaydo.","fr",4],["Matavis","",4],["skywar mommy","us",4],["COMATOZZE PRIME","mx",4],["Xenón","mx",4],["ᴬⁱᵏᵘ","mx",4],["Octaxzz","mx",4],["Cool","us",4],["beepi.","",4],["lurkz1x","us",4],["curvv","gb",4],["davery GOTY7","ie",4],["Noxify","us",4],["Swampywater365","us",4],["vague mnootz","us",4],["vague pixel","",4],["novamvk","us",4],["Super Soldier","no",4],["toes40spaz","",4],["blxss","us",4],["jojobestplayer7","fr",4],["7VEN","us",4],["Vivid","mx",4],["vvsaint9_","mx",4],["MERCHANT","ru",4],["somafps1","jp",4],["Volt","mx",4],["RAF_D30","fr",4],["div2","ca",4],["Jasiam.","us",4],["hawkfv","us",4],["Dcawesomerx1.","us",4],["ZenixxFN","",4],["JRdaBeast32","",4],["DrMinXVII","kr",4],["julez","ca",4],["Face_peruanita","co",4],["Ryzxr","co",4],["CRXZY","de",4],["Alexplayzfn","mx",4],["Lupin","fr",4],["Zar1ty","us",4],["flȇx","us",4],["Yum","ca",4],["criss","mx",4],["KRZ","mx",4],["controller","ua",4],["shevfn8","se",4],["Stung","us",4],["Popstyle","us",4],["Ⱥnthony","",4],["FNDemiGod","ng",4],["GUERRA","us",4],["wrathfv","",4],["Marykay89","us",4],["Trinity","",4],["gibby","",4],["7Ronex","us",4],["washi","jp",4],["MostHatedFWMario","us",4],["Gavin_Da_Reaper","",4],["qte","mx",4],["ʜɪʀᴀᴍ","mx",4],["bosnian","",4],["ttvKnockdownNico","us",4],["SYNCED","de",4],["CrimsonClutch438","pl",4],["Loxkfnx","us",4],["BaBaYaJa7","it",4],["certi_skhann","gb",4],["vitality theory","us",4],["tdog","us",4],["dcja","pt",4],["bryson67.","us",4],["Cosy","br",4],["Netrox","ca",4],["dom","it",4],["ggmonfn","",4],["rubertism","ca",4],["ArashFN","",4],["C4rtix1","mx",4],["VR11940","mx",4],["nick","us",4],["bunkq","",4],["VisibleBench4140","mx",4],["CrocsSito","fr",4],["SarAstre Skaikru","be",4],["visionslam","",4],["Fazorah","us",4],["larp","mx",4],["sebas","mx",4],["Moogweytokita","mx",4],["FzANGRY","mx",4],["Vyx","sa",4],["PiecyHotDog47","",4],["Fredoxie2.0","",4],["Ryzē","gb",4],["josenieto22","co",4],["barrywood","us",4],["thuta.","it",4],["Haazy","us",4],["cite","us",4],["ディーケイ","kr",4],["PrimoDeFausto","mx",4],["7liwliw","kr",4],["ilyasprobzf","es",4],["Toasttzz","fr",4],["Kizzy","us",4],["samson4x","",4],["Falconreyli","",4],["tek_here","mx",4],["Webs45.","us",4],["Rodr1gu3z","mx",4],["WILLY","ca",4],["jelr3x","mx",4],["Malik67","mx",4],["Chris","us",4],["PermafrostFN","us",4],["ßrysøñ","us",4],["LoganHojo","us",4],["LIQTIZ","us",4],["Envy","us",4],["ghostofalltime","us",4],["imhaitianbtw","gb",4],["dinosaur smasher","br",4],["prince","ca",4],["ItchyFreshy","ca",4],["panik","gb",4],["PandaBG2","",4],["auraitself","us",4],["itisasada","us",4],["Manila Villa","",4],["spexyGOTY7","de",4],["Trxzy","de",4],["Kyrqzz","mx",4],["SaidTune","us",4],["force","us",4],["resaix.","mx",4],["aight11","mx",4],["ZzZzzero","",4],["Epistrefo","us",4],["Mksadilla","us",4],["yklaxus","us",4],["ChickenWing2012","us",4],["fortnitegod54.","pl",4],["KratosFv","us",4],["Coodie","mx",4],["Alexzzdrr","pl",4],["Grained Chivas","mx",4],["popeyeZzero0","us",4],["ReyesMan1253","se",4],["swymox esdrongo","it",4],["afire","us",4],["BluéJdoobee","mx",4],["Iñaki","es",4],["Pazify","",4],["kellupnex","gb",4],["Clutxh pollo","us",4],["Daguar","",4],["rl_fault","us",4],["Franzua-Fiallos","",4],["TICO_Calytoz","",4],["1sxaac","mx",4],["Steez","co",4],["Nock","",4],["Darkj2","co",4],["Chimbionte","co",4],["392royc3","us",4],["rhexqt","cz",4],["sovixreyli 1234x","fr",4],["Waaqqi","",4],["Victualler","mx",4],["twissler","",4],["CRYPTIX GOTY.","gb",4],["taihyuk.","de",4],["ҠᛁᚱΛ","",4],["Hunter","mx",4],["samuel0x","",4],["Kynzy","us",4],["volta7.","us",4],["Yak1x","us",4],["Tjaywtf","us",4],["relaxlocks","",4],["KingMelvin_FTW","us",4],["Bennett","lv",4],["rez","us",4],["immobile homage","us",4],["Mystery","mx",4],["TikTokZeroplay31","",4],["Azzafnw","mx",4],["frijolito","mx",4],["Cleev3r","",4],["Radvxz4Life","us",4],["ben10fan21","us",4],["izymuffen","us",4],["GarlicBread_fn","us",4],["Diligent","",4],["chlysteek","pl",4],["Humbjino","us",4],["question brokage","ua",4],["Lawliet","mx",4],["saintedd.","mx",4],["RekkMeyer","mx",4],["gaboo_10","sa",4],["percentfv","us",4],["qnc","mx",4],["Gustavo","",4],["federico","co",4],["TEED","",4],["SALTY","",4],["Pibble Mostaza","mx",4],["洗过的","co",4],["aick","co",4],["JesusChristCares","",4],["Reapergotbandz","",4],["MasonKirbyRoman","us",4],["Sanxyaache","co",4],["DPiero.","ca",4],["GreasyHairBrush2","us",4],["123pbakeABC","gb",4],["realleonell","",4],["MarcSugar","ca",4],["VicVicFTN","",4],["R33ZY","jp",4],["voltz.","us",4],["Bean.","us",4],["foityn","us",4],["VOKTIZ.","us",4],["exaltedkbm","",4],["MOTO","co",4],["papi","br",4],["beytav","mx",4],["blakekbm","ru",4],["RetiredCJ","ca",4],["wordy","ua",4],["IGcq1by","",4],["jxvitro","mx",4],["alexovich","mx",4],["ficksixrkÿ","ru",4],["Sp3sialTan","",4],["TFS_Tanzac","us",4],["border patrol","us",4],["Bomboclaat","",4],["breeze","us",4],["Mirza","us",4],["Kyzin","",4],["ElDesviado28","",4],["MONKEY","",4],["Exotic","us",4],["chuta style","cz",4],["Tywave","mx",4],["BaddieGod","us",4],["chewzen.","us",4],["Dill","us",4],["shawnmills117","us",4],["xzein","se",4],["Rapiz","us",4],["SirSleek","us",4],["scr","fr",4],["Bonice","gb",4],["Cedant","",4],["VENT4RR","co",4],["retired","co",4],["lewrsaur","us",4],["Seakii","us",4],["leobot","mx",4],["Dumenkos","",4],["TheGoodBerger","us",4],["Chrisreyli","",4],["Brusco.","it",4],["ｐｉｓｅ","ie",4],["Exotic POWES","co",4],["Chupirul","no",4],["Yar","",4],["Baemon","co",4],["APmane","es",4],["RipRap_","us",4],["DBMBOT","is",4],["redski2x","sa",4],["tooshh1","br",4],["Splaxc","mx",4],["rhino","us",4],["air281","us",4],["Svverve.","us",4],["papii","ar",4],["kidvargas","",4],["DaBearsFN","us",4],["Fedreyli","gb",4],["NubsFN","us",4],["seth","",4],["Dxltaa.","us",4],["vinny","mx",4],["zeyko","fr",4],["Faizullah_786","",4],["Shadow","us",4],["RETIRED tylerr","",4],["cukee","",4],["xJK7x","ie",4],["Joeyfitz1234","ie",4],["Clxzy","us",4],["KRYNX","us",4],["DDsSaenz","co",4],["ReportLABZ","ru",4],["OOPSITSELI","us",4],["blyber","us",4],["AllTheUro","us",4],["paralyzedfn","us",4],["Silva Raijin","mx",4],["Mason Jeffrey","",4],["Daniel Jeffrey","us",4],["yeivvs","",4],["lilstacheTRIPPY","us",4],["CtGhakito.17","fr",4],["terminator","gb",4],["arlxng","gb",4],["Mertteu Akaza","de",4],["latrys","de",4],["yvesaintxv","us",4],["CloverChristmas","us",4],["Force Mikey","us",4],["Sluge","us",4],["kobe","us",4],["zexng","ng",4],["ShrimpFrydYoRice","es",4],["OsoAgro","",4],["Adenfnn","us",4],["kamstats","us",4],["Ryan121165","us",4],["Active Reload","us",4],["Thiago1x_","us",4],["TRASHAY","jp",4],["dank6x","us",4],["Lil-bray-bray22","",4],["timothy_jr","us",4],["dubz","tr",4],["ilyEmoks","mx",4],["PaoRamírez","tr",4],["JUICE3","ca",4],["Brisket","ca",4],["Acey","us",4],["httptæ_","fr",4],["warza","fr",4],["AngleUnexpected","us",4],["blindedbyhatred","us",4],["Sauma.","gb",4],["Petebot","",4],["Scroll","us",4],["iso","us",4],["bpizza","us",4],["MereLight6632","",4],["Herm","mx",4],["Kova-LelandFv","us",4],["Tidal-Bryson14","us",4],["gallina","by",4],["chicken72.mx","mx",4],["separationist","",4],["ᴀʟʟ","de",4],["Timor Domini","us",4],["AzimtheKing360","ca",4],["ZENIN","mx",4],["Stails5380","mx",4],["ʀᴇᴘᴀɪʀᴇᴅ","mx",4],["north","fr",4],["goldstein","de",4],["STARL TOKYOO","de",4],["Future","jp",4],["tydrae","us",4],["Pumpyqc","ca",4],["TiktokDonChimbo","co",4],["IxMa","us",4],["Tazer","",4],["Ponyo","gb",4],["UnsaidChiken","",4],["Astrxl","mx",4],["peterbot clonee","mx",4],["nosh","us",4],["gaviego","",4],["Cashville","us",4],["Romanos","mx",4],["AcelDaNoNiNo","mx",4],["GoofyGoober.Jr","de",4],["Chrıs","de",4],["silasIs240Lean","",4],["Zen_Shapiro","us",4],["mcvicky","",4],["ZPQÌR","ca",4],["player","ca",4],["nkt","ca",4],["jeree.","de",4],["DeVonta Smith6","gb",4],["Filsh","nl",4],["Schepijs","kr",4],["quispe.pe","lv",4],["samulkfn","br",4],["Bananapants","us",4],["DLH_FV","fr",4],["aymane","",4],["iskovs","mx",4],["Jeanzfnw","mx",4],["Pląnet.","de",4],["xuccz.","us",4],["Goty7","mx",4],["VAX5x","",4],["Pibba","gb",4],["aeroreyli","it",4],["voidreyli","pt",4],["Dune","ca",4],["back","mx",4],["Sxto","gb",4],["Zydd","mx",4],["Junglefnz","ca",4],["DravenWave","us",4],["Devon Achane","us",4],["gold1x","",4],["Naztto","",4],["faker","",4],["washed-daniel","us",4],["kayygotkashh","us",4],["Ailin","",4],["Cfreire025","co",4],["CaliFn98","ng",4],["Freemok","tr",4],["EL.EOBO","",4],["Drizzy_brother","nl",4],["қأқأѓɑ","",4],["Meykix7","",4],["Its_Me_Saif","",4],["sophomore zlekto","",4],["Gabzz","us",4],["Vxrge","us",4],["CoveX","us",4],["RC_Santi_SM","",4],["Crr4zy","gb",4],["CachetonS","mx",4],["Miniso Im2Good4U","mx",4],["GodzyWhale","mx",4],["Wu-Zi","mx",4],["realityfnx","ca",4],["ShoeShinning","ch",4],["barber","eg",4],["EpixzIsCool","",4],["prep5x","us",4],["frxst","ca",4],["Hypern1te","mx",4],["microfv954","us",4],["david_br19","mx",4],["Pulsyz","",4],["SRWmarco","us",4],["jcells","us",4],["hulsty.","us",4],["Ondree","de",4],["Êlliah","de",4],["jossfv","lv",4],["CR4ZZYCOW10","",4],["kikiwhale.","us",4],["extiks","co",4],["novaaprd","",4],["Sebeartian","",4],["Brysear","",4],["sean2372","gb",4],["kyzi.","jp",4],["Habitz","mx",4],["ICE-COLD-B3CK","us",4],["MrBanananonFAKE","",4],["disabled_jew","mx",4],["Craxker","co",4],["peter skeletrix","us",4],["Xander","us",4],["Oxsin","",4],["jorgesapii.","es",4],["keezzszn","gb",4],["TwitchCandygod04","us",4],["joshdontmiss","kr",4],["Jassel","us",4],["DarKinGJL","",4],["monte.yls","",4],["rist.","",4],["ARIEL-zz","",4],["P1rax11","us",4],["mxriomz","es",4],["puchi","es",4],["aczzyzz","mx",4],["iphaem","de",4],["Kylian Mastérr","it",4],["why","us",4],["1xMorty","mx",4],["AboutCravk1030","mx",4],["GA3LelPAPU123","mx",4],["Da-Beast8","uy",4],["prayn4peacee","kr",4],["iwearcoatzinside","ca",4],["Flaco4pena","us",4],["Venom","us",4],["NYC","us",4],["Xyrowingu","ca",4],["rexfv","",4],["GaLaXy98","mx",4],["lavonzoOG","us",4],["Youngboy-_-21","",4],["goaticular","",4],["Amauri","gb",4],["Rubinsky.","pt",4],["ZaphkielX11","mx",4],["v3ny","mx",4],["SLOTHY.","",4],["Ugly","",4],["heem","ng",4],["tomiSON","ng",4],["xops.","mx",4],["wyadd.","mx",4],["Norłan","us",4],["creedpunish","us",4],["Stionz.","ar",4],["breqqz","",4],["clovxr","us",4],["hylnd","us",4],["Koreyli14.","ua",4],["zzGrimmjow","",4],["BuckeyeCole","us",4],["Fighter.Cr","no",4],["Mcburger","us",4],["Clutch.ec","us",4],["Dylan","gb",4],["LuxyniA-","mx",4],["Ruin","",4],["renzi","us",4],["snuperyun","co",4],["xng3l","mx",4],["housen pachis","mx",4],["Tranx","jp",4],["xGenn","mx",4],["V1x","de",4],["Peterbot","",4],["ruinz_fn","us",4],["KipPlaze","",4],["psycho killer","kr",4],["Sezen","br",4],["zeriam67","fr",4],["Raptor","fr",4],["NEOXADC","ca",4],["Diablo","mx",4],["Noexfv","mx",4],["zerqz","us",4],["Treaky.","fr",4],["BRIXREYLI","mx",4],["NotJoey7x","",4],["kbm","mx",4],["MPK","mx",4],["Aspect TakeFault","us",4],["Fortnite Ferrell","us",4],["Vissionz","us",4],["Cloudy7x_","",4],["force trackd","us",4],["Batman Mimic","gb",4],["zollosaurus","us",4],["vinni3.","us",4],["bouzel1x","kr",4],["reytron","kr",4],["Axi","ca",4],["Quam","",4],["powers7bs","us",4],["Sonarfn","us",4],["Saitama","us",4],["jokr.","us",4],["ʟᴇᴄʜᴇɢᴏᴅ","us",4],["Rapidz","us",4],["rulex","us",4],["buxkle","us",4],["chuky","mx",4],["Aur.King","mx",4],["clpz","de",4],["Unreach","de",4],["potsu","kr",4],["Arya_x11","us",4],["BAN","co",4],["Kei.K237","jp",4],["Lukez","us",4],["Grauz","us",4],["Gaael.44","mx",4],["KASHIRO30","",4],["Chompi_fn","mx",4],["Agent samptx","mx",4],["zakhk.","",4],["selfmade.angelo","us",4],["Plechangomario","mx",4],["hvk_Leo_fv","",4],["crumb","de",4],["Prime Trilix","us",4],["noizeski","jp",4],["lacketxd","it",4],["jollibeejaden","es",4],["waerofps","us",4],["Kiko12307","",4],["pxlsemonsta","",4],["perksfv","ca",4],["5ithz baker","ca",4],["5ithz","us",4],["lyxe","us",4],["1Archi.","mx",4],["Fosz.","mx",4],["25max roller","ca",4],["twins","us",4],["Ültimate","us",4],["PashaØ","ua",4],["raysoxx","fr",5],["sach4x7","by",5],["Bxng","",5],["neero","mx",5],["astro","",5],["sennings","",5],["syfe","us",5],["señor kxrry","gb",5],["Twixy Ka-Chow","no",5],["REECE","",5],["CraigzZzeroOo","",5],["Spooky Heathy.","",5],["Rival_DRoc","us",5],["Zero.Edits","us",5],["sergioperez","es",5],["deni","de",5],["gabos","us",5],["d6niel.","mx",5],["Ren","mx",5],["Sunny","ca",5],["Burnit.","ca",5],["CriptycAIM7","it",5],["gleqzyrr","kr",5],["1oneam","us",5],["justsidthekid","co",5],["boosted grandpa","nl",5],["vico","fr",5],["maupin","us",5],["Staxfangirl7","us",5],["Asian Pandaz","kr",5],["idc","",5],["Štefanøvić","it",5],["ReikooBenfica","it",5],["alefeal uchiha","pt",5],["Jewzra","us",5],["Atlas","us",5],["Userishim","by",5],["blast","cz",5],["MiniXiola","pt",5],["Cray_JT","",5],["sturgo","",5],["gloobus","ca",5],["Compton","",5],["Virus","",5],["sniper","ca",5],["They_fw_Rocha","us",5],["juanio1890","gb",5],["darby7fn","de",5],["Dictator Sypex","de",5],["mongrio.","se",5],["ʕᵒᴥᵒʔ","de",5],["exqstein files","de",5],["Halimfnbr","fr",5],["MUSLIM BAIDA","sa",5],["Soy","",5],["xylosfn1","us",5],["GDM_Sapesito","mx",5],["SimonKaile-99","mx",5],["fabrizio","gb",5],["veloc","es",5],["dz6an","pl",5],["2wqz.","pl",5],["mintywtw.","",5],["NipsuFVv","de",5],["MetricOnlyZB","fr",5],["ZayrozFN","fr",5],["fairs","mx",5],["Pollus","de",5],["Mat","mx",5],["Urixz","mx",5],["fdez","it",5],["bl4k.exe","fr",5],["ozone","us",5],["v.o.i.d.-.-","",5],["danouchesev51","fr",5],["NATCOOK7.","co",5],["StimpxL","us",5],["Azera sonic","us",5],["liquid-currant9","mx",5],["limit","se",5],["BRAYFTZ","",5],["MIXALNG","",5],["GlikzzySSJ","mx",5],["Bcks","ie",5],["Asad","gb",5],["Atlantic Mald1s","dk",5],["AbenGobber","dk",5],["mtweaks.1","ca",5],["Trunk1s","us",5],["l.zytyz","mx",5],["Demonreyli","",5],["andlyfv","it",5],["Vantawtf","us",5],["Mcqueen Zlaihx","mx",5],["AJromani","dk",5],["kash1kx","us",5],["georgie","ng",5],["ekn","lv",5],["banishh_","us",5],["Dingbats.","us",5],["lando dilworth.","pt",5],["ANW65","us",5],["azuara","mx",5],["Lirayache11","mx",5],["Ilai233","",5],["OnixGuard.","de",5],["Viyic1208","mx",5],["batman razer","es",5],["agentbot23fv","",5],["kustzyy","",5],["RomuWingu","gb",5],["wtwskiqttles.","us",5],["jaxson","us",5],["TWEAKED-OUT","ca",5],["holdenfv","us",5],["curse","",5],["MrBdeaux","ca",5],["NRGLittletimmy","us",5],["frijoliento","mx",5],["Its","mx",5],["xluded","gb",5],["Rxcon Dostoevsky","gb",5],["cholovagohaha6ik","jp",5],["Meriosolo.","nl",5],["P1ngu1nBoy","dk",5],["Excell","us",5],["Goonette","",5],["Synix","gb",5],["TYGER TROXYZ","gb",5],["DeadToFall824","us",5],["Desmond","dk",5],["wemby","",5],["Flash Navarrette","br",5],["Tjaoki","se",5],["CaFune","se",5],["kuba","gb",5],["ka1do","gb",5],["greyfv","us",5],["ArcKive47","",5],["Washed","us",5],["Titanium","us",5],["Lanko698","br",5],["MYSTIC8Q","mx",5],["noshreyli24","gb",5],["Dylan Harper","pt",5],["pedra","pt",5],["lent-kun","de",5],["winter","",5],["P3PSI_ZER0","us",5],["RYFT_CLAY","us",5],["WHZAYOR97231","fr",5],["Georg Cooper","fr",5],["sells","",5],["maxbot360","it",5],["cxsh","mx",5],["GarfieldDiff","cz",5],["AMS","",5],["strike","us",5],["slowr.","gb",5],["Emm4xz","co",5],["Superratfatcat","",5],["swrrdd","",5],["Frankilson","us",5],["ShaneHarlow","us",5],["حكيم.","it",5],["2200x","ar",5],["SCRroxy","",5],["JacobGG","ca",5],["inconnu","",5],["Rombumk","co",5],["ShxrkTom1to","co",5],["Cortacept","",5],["restrict","ca",5],["isiphx","us",5],["pųßßÿ","",5],["jpizza","ng",5],["primed cooker1x","",5],["Thebestlandon","be",5],["Chxtto","mx",5],["Defaul","mx",5],["whysoempty","ru",5],["iHatethisShiGame","kr",5],["intellect","",5],["Faze_.Maury","mx",5],["pxpus","",5],["flrx","us",5],["DVØX","",5],["banderas","pl",5],["Cryst1an.","pl",5],["DESCO","mx",5],["IsakeMtz","",5],["mirz","es",5],["madlex navarrett","es",5],["troyzerwozer","us",5],["One","mx",5],["SebeastienTier2","",5],["Nicoloco16","co",5],["Xvro","",5],["meereum40","",5],["maliboocuh.","kr",5],["Torontos savior","ca",5],["young rubioo","mx",5],["LE0516","co",5],["Mykeylan","us",5],["quickbots","us",5],["Sealdood","us",5],["DomuPR","",5],["Roxas","us",5],["sȯnder","",5],["pacific","de",5],["MeNoShleep","mx",5],["Checo","mx",5],["geno","ca",5],["Varkyj","us",5],["toutoune","ca",5],["kxdefn","us",5],["clipzy281","us",5],["King.Dez","jp",5],["ŁÆGoat","us",5],["Tidal qwixy","us",5],["xzire","",5],["viper.cam.","",5],["goofslapper","gb",5],["compbot","ca",5],["lanifv1","",5],["playboi frosty","us",5],["۷ɛཞ","mx",5],["FLT","us",5],["fnatic cashyy","us",5],["aymko","",5],["tali","us",5],["Nanass212","fr",5],["peakzy","us",5],["Sanit","us",5],["y22uk","gb",5],["Diamond taper","us",5],["cabezita","mx",5],["johan33e","mx",5],["ʀᴄᴢ","mx",5],["Zachy heeta","uy",5],["EXIT","",5],["Lecxi","mx",5],["Javiervj","mx",5],["Maxxbone","us",5],["Tavxzz.","mx",5],["DAVITOOP","mx",5],["Noxslay","mx",5],["NATICK LaQuicka","fr",5],["JessePinkmanxz","pl",5],["thederpyrober","",5],["FB_Alva","mx",5],["lilleam6","us",5],["Luis11r09","mx",5],["Babyisaacx","mx",5],["Jepa39","",5],["Nerfynerf","us",5],["hearts4_1234","us",5],["Queso.rayado","mx",5],["Dmszy","mx",5],["Sweetie","it",5],["GAS","it",5],["euro2024olmo","ua",5],["rzn","ru",5],["Jonyy1989","",5],["GariBot_","mx",5],["M8_anonimo","mx",5],["Gemini","no",5],["Sigve","gb",5],["dr1xk","us",5],["Tangowe","",5],["AchroBlaze","us",5],["Mini_Asianjeff","br",5],["RÆXIN-Yeon","kr",5],["cgw","us",5],["Skayresh","ar",5],["vetharold","",5],["WBOTY","us",5],["TwitchRazerSw0rd","us",5],["midleofn","us",5],["Drippy.","us",5],["Twisted Reggie","us",5],["Dynasty Darqs7.","eg",5],["Creations","de",5],["jexoo.unc","de",5],["Pegxsuss","mx",5],["luggz.","se",5],["Josueetp14","us",5],["IDrawid","mx",5],["expertz","mx",5],["pxlar.1","mx",5],["ftx.jd","",5],["pepp","pt",5],["Dougieetello","",5],["rafbtw","gb",5],["Comandante Llama","mx",5],["prixnada","mx",5],["Alexbot","mx",5],["E-xecute-","mx",5],["CarsonHuff1","us",5],["WOTAA","es",5],["Cboy98x_","it",5],["HTW.Nanoo","",5],["DHECREASE","co",5],["JordanVR787","co",5],["stariheartabgs","us",5],["FNX_Louis","ca",5],["DemonTrill","us",5],["retrowya","",5],["edub","us",5],["Solqbotn","mx",5],["LoudSwift977","mx",5],["Pikachu7373","mx",5],["LootTrooper","us",5],["fliqZzz","us",5],["jeffski","mx",5],["2xfalcon","",5],["Pgqf","us",5],["Flagler","",5],["alduga","mx",5],["Captain Neegy","",5],["tekkiuu","mx",5],["Inzalex dowman56","fr",5],["Tyronlebg","it",5],["1bIeood","be",5],["Renzyfv","us",5],["Marcos7L2R2","mx",5],["JACK-_-","es",5],["jersey","us",5],["sagaz desnutrido","mx",5],["BLIX","it",5],["Droxz","kr",5],["newsipi12","ca",5],["walay","fr",5],["wala","",5],["7_d5r","pt",5],["slimedude2003","",5],["Bruno Lefillas","de",5],["eldiegozzshawn","es",5],["koshii","",5],["crum2","",5],["yn_vo1d","au",5],["Nythan","us",5],["thomaq","us",5],["yerkawesomer","us",5],["psycho","",5],["boingawesomer","mx",5],["Winni","ca",5],["Summit","fr",5],["monsterauditore","",5],["showdup","co",5],["Amur","de",5],["10nightmares","us",5],["popsicle","us",5],["bailout","",5],["Parker Ackerman","us",5],["jirdon","",5],["flak00","es",5],["TopOppTrxpz","us",5],["Tøxic","us",5],["Solodolo_da","",5],["lemme","us",5],["1tr","gb",5],["Pla","mx",5],["ec4stillo","mx",5],["Leo-23.","mx",5],["ludvig","ar",5],["ATKPerish","gb",5],["kabiibii","ca",5],["Ruwanplayz","ca",5],["Snypr","us",5],["goldneegyfn","be",5],["Prodigy HYDRO1x","us",5],["ɢʟ丨ΔϟḰツ","ca",5],["pinarr.","",5],["SEBASBOOM","",5],["Solid thomis","it",5],["DiegoRamero","",5],["Edwxrdo","ca",5],["Manolo","us",5],["xAlee","mx",5],["Syxkkø","mx",5],["Badgerboy21","us",5],["LilFurly","us",5],["Xav","kr",5],["GaBoUh","be",5],["etralfv","be",5],["Sherry","us",5],["lep","ca",5],["Mercs_ƒor_Hire","gb",5],["Don","",5],["ezzyww","mx",5],["wedwhale","mx",5],["minex","mx",5],["goonstructo","us",5],["zobuhtron","kr",5],["irax","fr",5],["Thernox_ma","jp",5],["Matty","us",5],["oozma-kappa","",5],["Ëmibot","de",5],["petervaquita","ca",5],["LiveForJesusJ316","",5],["Zen1KD","us",5],["Josue-_-oG","mx",5],["Vengador151","mx",5],["doitraw1","",5],["Roncha","us",5],["Shxdxxr","us",5],["6mme","ca",5],["Dxrk","mx",5],["xCARLXZDY","mx",5],["domestic","us",5],["AVG","us",5],["Messi","us",5],["8in","mx",5],["topp","us",5],["zero09th","us",5],["JetzFTW","us",5],["wayke.","jp",5],["Dwromy","us",5],["Keoo","de",5],["coxnase","kr",5],["Spexify99","gb",5],["gurulando","",5],["SYBAU","us",5],["clovrix","us",5],["wesomer draku","es",5],["LetsScareSteve","ca",5],["120HzJacob","us",5],["anxtony","mx",5],["ZENTROX3K","pt",5],["Tiwan08","fr",5],["SlickNoob28","",5],["ARC","ca",5],["EXD_TOXIC15","mx",5],["BTW","mx",5],["PRIME_1IXN","mx",5],["PRIME_KRIS_R","co",5],["Darimart","es",5],["Hamburguesas","es",5],["TBK_ColoPR23","us",5],["salvatrucha","us",5],["PingPredatơr","us",5],["pacifica","ca",5],["AshleyFox","",5],["hannahowo._","mx",5],["FNG_Koki","us",5],["david.","us",5],["raiden","mx",5],["raiden 4rathxfv","mx",5],["KOS_LEO27","",5],["ceekay21","ca",5],["crolofv","us",5],["Shakurr","mx",5],["zboise7","mx",5],["swixy281","mx",5],["fading triflers","mx",5],["GØMEZi10","mx",5],["Riz-10-","",5],["chrio","it",5],["enc","it",5],["1shotdubz","us",5],["Shannte","us",5],["LOVEULS","ch",5],["amarou.","fr",5],["poetfv.","us",5],["ollyGOTy","gb",5],["MxryZB-","it",5],["Tepiteño.","mx",5],["Lilmanintwo211","",5],["CUXGPT Piece","",5],["prolly","us",5],["Ricdarula","us",5],["Sauce Ginchi","co",5],["laradtnabellakas","mx",5],["gamich","mx",5],["Melecosama","",5],["SimpleEdit_onTop","mx",5],["seif","dk",5],["Vitalitykérann","fr",5],["ᵇᵉⁿⁿʸ","us",5],["Monsa_fn","mx",5],["lola","",5],["Tojoak","us",5],["zachary1jelly","us",5],["JakesTwoLips","us",5],["OwingFiber9948","",5],["datshmu","us",5],["khanfps","us",5],["Xizz","lv",5],["vLAROI","us",5],["vShinx","",5],["agapé-_-","us",5],["Kingdom","",5],["Schoolmarm","us",5],["n1ghtmarzu","ca",5],["AlphasBigDaddy","us",5],["AlphaReyes1234","mx",5],["CTRLAIM_GfragAM5","us",5],["Hilo","",5],["rxset23","sa",5],["Ryder","ua",5],["76ers Lebron.","",5],["vezbot","se",5],["chubba","ca",5],["M4kia","co",5],["CortisolCricky","co",5],["Rizen","ca",5],["neegy abbott","ca",5],["murvn","",5],["larrygetsnoplay","",5],["ima","ca",5],["tahj","gb",5],["SnowK45","us",5],["Prodigy","us",5],["leoreyil","mx",5],["kyzenggs","us",5],["Arminn2stacz","ca",5],["coachingroro","us",5],["wInX4mike","",5],["eclipcx","mx",5],["Ramskiownviskyu","us",5],["5foot8and400lbs","",5],["SousFrozjteEZ","de",5],["EnPetardGros","",5],["JHULIO","co",5],["Barto","co",5],["tojifv","",5],["Lixify2x","ca",5],["Veridaxx","us",5],["W_Tide","us",5],["Motion Fragz","",5],["Motion Dvrkk","mx",5],["yani-","co",5],["nyrozyn","mx",5],["falcon_Coquis","mx",5],["BookCold","us",5],["3pataa","us",5],["Limit Txrian.","us",5],["RaneFv","de",5],["OmarElPro2308","mx",5],["cf22","co",5],["Aurora","mx",5],["Falcon Summit","mx",5],["centrix","",5],["illusion.n","us",5],["R2P","us",5],["bergSZN","dk",5],["Zeroopassion","de",5],["careless","",5],["Aixn","mx",5],["expo","de",5],["brok3nbot","ca",5],["ʙᴇɴᴇʟʟ","mx",5],["BalaHB7","mx",5],["Yajana","",5],["JACXFN","co",5],["pXylon","co",5],["ryuki 3arolf","us",5],["Mex_Demon","mx",5],["SwAAyyLe","",5],["XSETFresh","mx",5],["Jofra","mx",5],["Deimoos","mx",5],["Mr.doroo","mx",5],["TSM_ChickenJoe","mx",5],["NachoJr","br",5],["Dennys","co",5],["lastforever-aim","us",5],["FatherOfOne-2022","",5],["aimifypiece.","us",5],["1KPR","",5],["Sweet_Suzy","us",5],["delta","",5],["polar","",5],["Dingersfv","us",5],["JeffreyBaily","us",5],["PlugzyXD","us",5],["TimhotepPK","pt",5],["IDZAAV.","mx",5],["Sweetboi7946","",5],["kerry kaberga147","mx",5],["Elsacatangas147","fr",5],["ᴾᴿᴱᴹᴼ","gb",5],["orc","us",5],["vyderxx","de",5],["jinete","es",5],["Yimiflyfncs","es",5],["Goldox","",5],["FISK_JM","mx",5],["SKY_roméo","ca",5],["Skywize_57","ca",5],["munyoz","es",5],["CAMRYN","",5],["sirjupiter1","us",5],["BUG.PUT.IT.N.U","mx",5],["слабый","ua",5],["Jaxkfv","us",5],["cyo","us",5],["BIGchesseona","us",5],["Ectoplasma","se",5],["RockleeGhost","mx",5],["232Gage","us",5],["lizzy","kr",5],["MaGnU.","it",5],["Smargax","mx",5],["virozfv","ca",5],["Aless hanma.","es",5],["WayZ_FN12","es",5],["dizz","mx",5],["spida","us",5],["Fortunate2x","us",5],["Pinz","us",5],["4moz.","us",5],["unsasa24","us",5],["REVENGE","us",5],["Luchemaraie","",5],["Zod","ca",5],["ᴏᴄᴛᴏʙᴇʀ","mx",5],["e1braham1x","mx",5],["9G.blizy-_-2","co",5],["Velffx","ar",5],["Nutifyy","mx",5],["ezkoow","tr",5],["kiksonfn","",5],["heyy","de",5],["jorge","mx",5],["Rica","br",5],["Yūhabahha Quincy","es",5],["9pm","mx",5],["Stix","",5],["hindall.","us",5],["pinguinon","mx",5],["Mrsebas104","se",5],["Julian","",5],["Bayoumonster","us",5],["synfnx1","",5],["pz8","cz",5],["CoachThigs","",5],["Jondoeogc","ie",5],["braind3ad0","",5],["reofv","mx",5],["ratakitos","mx",5],["bxserk","us",5],["5STAR Dbot117","us",5],["Tomek","tr",5],["XPAPO","mx",5],["iSipTris","us",5],["dotbuggout","",5],["67VIX67","",5],["double tower","us",5],["Rola","",5],["Sehki sehki.","",5],["scandalous sarge","us",5],["XMIGUEL105158","mx",5],["SDL_Giø","mx",5],["OxolcƵƶ","ca",5],["Mutant NicoD","ca",5],["Nojoch.","mx",5],["Anubbizz_","mx",5],["cruser","",5],["SAWN","us",5],["Qyrup","us",5],["XwillXwynnX","us",5],["camz","",5],["Creepz","mx",5],["AlanPN","mx",5],["MAD-MAN-SWEATS","ca",5],["Wrilled","kr",5],["double-truble","uy",5],["fvke","gb",5],["GUPPYHYDRO","us",5],["TwistedHydr0","ua",5],["carboncito","co",5],["pablo_lares","mx",5],["sippinFAITH","us",5],["goonmachine6741","br",5],["prjme boozii","",5],["JesusLovesRiko","",5],["Ultimategoat14","us",5],["xandersabot24","",5],["PR1MAS","mx",5],["Dtxemmanuel","us",5]],"NAW":[["Fever","us",2],["NiceBoi2400","mx",2],["SkyHealOff","us",2],["SoPuma","us",2],["snowburd.","",2],["Jxquari","us",2],["Cecxi","",2],["bandito","mx",2],["Yk_Zeus","",2],["VicFN99","us",2],["Draftshoes","us",2],["pokey","es",2],["SpinelessSchlump","mx",2],["Cuvey","mx",2],["Snakeboss2018","dk",2],["Mac","ca",2],["Fear","mx",2],["dustin","us",2],["Eyup","us",2],["larsofv","us",2],["axpect","mx",2],["Astro","mx",2],["Drew.","us",2],["shank rodrigo","",2],["batsyfv","eg",2],["rexifyiq","ca",2],["Plasma amfam","ca",2],["KeanYe Reeves","us",2],["Yestappen","",2],["Justin","",2],["mercer","us",2],["79fv","mx",2],["wen0tequal","jp",2],["slapsfv","us",2],["kevoplayz","ru",2],["gpgethan","us",2],["Vorgzfv","",2],["Taiga","ua",2],["nobanme27","us",2],["bery","us",2],["Spx","br",2],["Mitr0","",2],["castle","us",2],["Bolty Wolty","ca",2],["sawcyandre","ie",2],["sawcykyro","mx",2],["wade","ca",2],["YoManMan.","",2],["Rom_-","es",2],["neckfn","jp",2],["Diligent","",2],["ZEN","",2],["Trocoe","ng",2],["capital281","",2],["Degon","mx",2],["Jay","us",2],["mintt","mx",2],["chino","us",2],["CHAVA","fr",2],["Uncle Keoki","us",2],["Dreamer plumita","mx",2],["Bravofnbr","no",2],["serene","mx",2],["AchichiMela","mx",2],["Monta.66","mx",2],["Toftegård","dk",2],["KeithTowersG","us",2],["Tobi","ca",2],["fvr","mx",2],["pxmp5x","mx",2],["Krelouch","ng",2],["solznaldo","mx",2],["Taquelomucho","mx",2],["DandyzZzero","mx",2],["LeOrbit James","gb",2],["pazix","us",2],["spirz","",2],["veekzz","de",2],["tony1x","us",2],["Herb","jp",2],["mxrxku","gb",2],["nejivi","us",2],["dizz","mx",2],["Perrobtw","mx",2],["Avalos Baratheon","mx",2],["noxiwyd","mx",2],["Scawesomer","us",2],["Prada","us",2],["Plaxbtw","fr",2],["Arath","mx",2],["Xthon","mx",2],["sfg","us",2],["DumbprosFN","us",2],["Evasive","",2],["LMS1024","",2],["MudG","mx",2],["LaEnchulada","",2],["IWALKSHIDOWNGA","ar",2],["JALAPENO","ar",2],["clipps.","us",2],["bakedcuh","us",2],["lunasekai","us",2],["koolaidfps","us",2],["Murlito Bandito","de",2],["AptobossV3","us",2],["Jacobpinkham","us",2],["Slushiibot","us",2],["dev","jp",2],["1up","mx",2],["NM-Sniper-","mx",2],["vamp","us",2],["sunnisoho","jp",2],["6Mine9","es",2],["HarpTown12s","",2],["Noahfv6","us",2],["Fortunate2x","us",2],["eli20","us",2],["Hyperkitten101","",2],["chunkychipmunk47","ca",2],["tyt","",2],["gavv","us",2],["quicks","gb",2],["dx4n1","mx",2],["sneakyfoxus","us",2],["believeah","mx",2],["bloodhound moody","us",2],["Lucadiff","mx",2],["blixyfn4","us",2],["Mystical","us",2],["thiny","mx",2],["Watercitoo","mx",2],["Aspxs","fr",2],["Bikinho","fr",2],["dwavynickyfishy","mx",2],["ribi","it",2],["glamorousPHONK23","ca",2],["perro paradog","mx",2],["quinto","mx",2],["ÆDDIE","mx",2],["Kitofnz","mx",2],["CoveX DerekSr","",2],["CoveX DerekJr","us",2],["Housen isaacfnbr","mx",2],["Ayønreyli.","mx",2],["JennaOrtegaFan67","fr",2],["mazza zuckerburg","de",2],["maxwhale.","us",2],["rivizas washed","ca",2],["Rustika.","mx",2],["phntm","ar",2],["Dxnyxzz","mx",2],["Swxft","au",2],["jed1knightt","us",2],["YE-ETSY","us",2],["flugame clxmatic","mx",2],["diegowyd7","mx",2],["zxr","mx",2],["Stepbro Sebaas","mx",2],["Vadhir1x","mx",2],["Slapdinho","mx",2],["WBOTY","uy",2],["qamon","us",2],["chrome","mx",2],["vM3lo","",2],["kwame","us",2],["burkxfn","us",2],["369Cario369","us",2],["KingSauul","mx",2],["MIH","us",2],["carbo","us",2],["bluff","us",2],["snakes","de",2],["bao","kr",2],["kye","us",2],["patrck bonaparte","ar",2],["sxlence","tr",2],["Karnnitas","mx",2],["Ñ0pe","us",2],["whigha","",2],["tamalbot","mx",2],["Zancudoo-","mx",2],["Delsinofn1x","mx",2],["spultyy_","",2],["zMyxie","us",2],["shlimzify","us",2],["slush","jp",2],["VANCE","es",2],["Zadiefv","us",2],["vamos thugz","",2],["Poshern","us",2],["Vibes","us",2],["Tappedd","ca",2],["Nyroze","",2],["ninjasbolt773","us",2],["NyrRyven","mx",2],["og_ic20310","mx",2],["marvel tryona","mx",2],["nicomiah","us",2],["Wuuqs","dk",2],["xX_DaddyPickles_","us",2],["reiss","mx",2],["Burrit07","us",2],["DieWhenImHeight","us",2],["Revxnge1x","us",2],["PrinceNana","",2],["Koa","ie",2],["kvor.","mx",2],["MANITOGAM","mx",2],["we_hit_arsenic","es",2],["coldfv","it",2],["wtj","us",2],["Sofi","us",2],["Wunkz","us",2],["skuffy","mx",2],["Jitsu","",2],["Biaghi","es",2],["Zaxfv1","",2],["Kozy","mx",2],["ankerwtf","",2],["1JAAKE","mx",2],["Aviles","",2],["RGZIA","mx",2],["paniÿ","mx",2],["solja","",2],["Zominiğer","us",2],["Nighmers","mx",2],["QTE","mx",2],["Mora67x","sa",2],["Ethelerl","br",2],["aÎdanfnbr","us",2],["Nightfv","us",2],["trix","mx",2],["TwitchbossDenn1s","",2],["yergYK","au",2],["NESTORGPT","mx",2],["Miloboy7","mx",2],["FryzzOBv","pl",2],["sleyz","mx",2],["emybot","nl",2],["BAM","mx",2],["Frxmes","mx",2],["Hercules","mx",2],["Kuri","",2],["Redemption","mx",2],["brazilian piec3","br",2],["Echelon","us",2],["Mcqueen","",2],["Savagefv","us",2],["Sapphire","tr",2],["HOODLUM THANOS","is",2],["TeLosEchoDndevan","fr",2],["sask","",2],["drixtyAIM","mx",2],["Summerz7","us",2],["solobot","",2],["surgefnw","de",2],["IDuller","mx",2],["Edssonsinho","tr",2],["yan4uk.","mx",2],["Julian Quiñ0nes","mx",2],["føfomarquez","mx",2],["Jotazs17.","ru",2],["ManCity","mx",2],["Sw3nky","",2],["dennis.","ar",2],["ayjay","",2],["ShoeShinning","ch",2],["vjake7","us",2],["5thOG","us",2],["beleifxyz","us",2],["Goob","us",2],["PieceBot","",2],["iseekjckz","us",2],["chetos_enlacasa","mx",2],["Grimmz","mx",2],["ricky","",2],["LaserEyedSalmon","us",2],["wydidrxp","us",2],["gio","mx",2],["kotuh","us",2],["Yuvi_Cookie","fr",2],["EpikHyper1v","mx",2],["TcA","mx",2],["ABOTY archy","ca",2],["wtazer","us",2],["Yk-Myles-","jp",2],["khawz","us",2],["Rybandz","us",2],["junior37809","",2],["scared","fr",2],["全日不登校","jp",2],["Vi2","jp",2],["Jossy Crema","mx",2],["RY2","us",2],["Bull4xel","mx",2],["Sifulwk","",2],["kydro","jp",2],["kaboom","us",2],["zLouisr","pl",2],["vTylerfvz7","gb",2],["Flowzery","us",2],["B4tmanbob","us",2],["ryzic","mx",2],["fishysbad","us",2],["Salty1x","",2],["Iogic","mx",2],["javowayne","mx",2],["gremory","jp",2],["anton_chill","",2],["kuronada","us",2],["confirmxz1","us",2],["sour","us",2],["The","",2],["immacoustic","mx",2],["spex","us",2],["Xtra3xLargeZeno","us",2],["vin","se",2],["vyper","br",2],["vowki","",2],["Hacha","fr",2],["CDmeyster8","us",2],["chainsaw-cranker","us",2],["zaytoxlang","ca",2],["Efox","kr",2],["Aizhen17","mx",3],["goonker Filthy","gb",3],["Unsings","",3],["Łurvy","ca",3],["Lonzo","ca",3],["sxythe","",3],["RenActive","us",3],["simple edited","us",3],["14voxy","mx",3],["14donkey","",3],["ab9z","us",3],["pineapple pizza","",3],["mp7matthew","ca",3],["dakaramotto","ca",3],["mateo","mx",3],["makeittofriday0","",3],["Djayfv","nl",3],["Daanfv","nl",3],["ÆTERNUM","fr",3],["huffer2tone","us",3],["Row","",3],["Ashaciaga","us",3],["kryptic","de",3],["Nxvyy","us",3],["Wavvy5x","gb",3],["walrus","us",3],["Vib3s","pl",3],["noorfv","ua",3],["scotty.eth","us",3],["yasmafv","us",3],["Jack.exe","us",3],["Captain tosen","",3],["chunkymonkey916","us",3],["pork","ng",3],["Neegy","no",3],["cr67","us",3],["krozFV","ca",3],["Raiydzreyli","mx",3],["Falcon","mx",3],["Powerfv","",3],["Jbearfnn","us",3],["ayzen","ca",3],["Hazardfv","ru",3],["brayxyz","us",3],["TEED","",3],["SALTY","",3],["Punchabys","mx",3],["VicensFn.","mx",3],["Craftiburger","mx",3],["eldelacadena","jp",3],["Bupkis Floatz","mx",3],["bupkis rush11","mx",3],["morph","",3],["HighCarter","",3],["clixfan","ca",3],["muribi","br",3],["pablo","gb",3],["speed","uy",3],["Mcqueen Neji.","mx",3],["Craziest","mx",3],["Xyfe","us",3],["ve1ofv","us",3],["izzygotabag","",3],["Starzz","be",3],["godiego","co",3],["amador.","mx",3],["GodzyWhale","mx",3],["Wu-Zi","mx",3],["auy3fn","ar",3],["robotfn22zawg","it",3],["Clxtch","us",3],["Faddr","mx",3],["Ahveq","",3],["Zbergh","us",3],["CR4ZZYCOW10","",3],["Aliže","gb",3],["Jaquiga.","mx",3],["Nolan","us",3],["ikynx","us",3],["masonlol.","ca",3],["Benny","ca",3],["Lypoid","sa",3],["Ordicle","us",3],["zanyfv","",3],["BlakeGotzIt","us",3],["AirUrchin","",3],["Slick","mx",3],["vorcezy","us",3],["CYN","us",3],["polofv","",3],["Its","ar",3],["bizzre.","mx",3],["covs.","mx",3],["Gollemm","mx",3],["paralyzedfn","us",3],["Exthrenity","us",3],["swifty","sa",3],["Cracker.","ca",3],["Curious jasper","us",3],["rusos","mx",3],["Cuzzo990","",3],["TheJuiceBoxer","us",3],["JustintimeTV","pl",3],["orihuela","mx",3],["Aquysy","mx",3],["Stelar7v.","mx",3],["WBryson","us",3],["Chimo","",3],["snagz","us",3],["SNAZY","us",3],["cynxfnx","ng",3],["jonyfv","mx",3],["piece.","se",3],["NeverFaded_fv","mx",3],["BIGJustina","ca",3],["Triple Links","",3],["AtendraiGoat","mx",3],["Cabe","mx",3],["nosna","ca",3],["cillic","de",3],["Beazy","us",3],["starkawesomer","us",3],["itoshi qu1klyf","ua",3],["pocardo","ar",3],["Saibot_99","ar",3],["NRS_PINACTOR","mx",3],["Ne0_","mx",3],["frias","us",3],["ZA1Nxr","ca",3],["Davicular.","br",3],["timid","it",3],["gabe","us",3],["Brodeybot","us",3],["twtter yusajoker","fr",3],["deniro","gb",3],["Bobscott81","us",3],["ElsamuraiGG","mx",3],["Aeternum Senfy","mx",3],["BradTooBasic","us",3],["Slacks","us",3],["maidonal","kr",3],["royce","us",3],["KsDconsulYT","mx",3],["Optitamal","mx",3],["jilux","mx",3],["Jesusito","mx",3],["mlad3y","jp",3],["HUEVOLOCO9164","",3],["Gallinazo Letal","mx",3],["Skillmeister","us",3],["Avila","mx",3],["yoforce1x.","sa",3],["solaria","be",3],["六平千鉱","gb",3],["Haneet","ng",3],["dxrkfv","ie",3],["void","gb",3],["HazeVG","gb",3],["ShortManTrev","ca",3],["ShåÐðw","mx",3],["plugs","us",3],["Penreyli","",3],["clonebuca","mx",3],["S1XTY","mx",3],["Confleis-de-Agua","mx",3],["frosty","us",3],["Termski","ng",3],["JoeyyFNBR","mx",3],["wynz","us",3],["schwifty","us",3],["CHUNGUS831","mx",3],["BannonFN","us",3],["beneath smoothy","us",3],["kkilluh","",3],["classichawkk","mx",3],[".QUESIX.","us",3],["Moatydontmiss","pl",3],["Bra22.","us",3],["TIKCHARLI","mx",3],["Father Sleepy","us",3],["John3","",3],["SPOOKY V00D00","jp",3],["princess kaley","us",3],["Sorin Aizen","",3],["GALAXY25879","mx",3],["Zby","us",3],["snackyfv","",3],["Jhozafat","uy",3],["Cløudz","us",3],["svn","mx",3],["prime","de",3],["lelouch heavenly","us",3],["Saryyx","mx",3],["grimlin","us",3],["frostzZzeroOo","",3],["Ghost_BrandonX","mx",3],["xlJordanSPlx","mx",3],["ntz","",3],["みげる３","jp",3],["あむすつ","sa",3],["Jehujunoir18","us",3],["cozyinmebed","mx",3],["smallzy","ar",3],["purpenbtw","us",3],["TAYZ","ng",3],["Galleta","mx",3],["Galletafatt","mx",3],["ascension","us",3],["Go00mba","co",3],["Twblaze","mx",3],["marcghostboy","gb",3],["SirJCashMoney","",3],["Legacy","us",3],["luxfnw","mx",3],["Cone","us",3],["batmann boogie","mx",3],["Hey","mx",3],["wetzup","us",3],["sloppy","us",3],["IAmForrever","",3],["nleflopa","mx",3],["SKZCY","mx",3],["SethTurtle","mx",3],["bryanxi","sa",3],["malibu awesomer.","mx",3],["Super Sonic_27","mx",3],["nnvrze","",3],["Flowstate Denson","",3],["KBEEZYFV","us",3],["Jeremiah-L-2011","mx",3],["Rittbo7","us",3],["Vxmp","tr",3],["Raidel94","us",3],["Miles10","mx",3],["thunderdih","mx",3],["OIIi","de",3],["jayne","us",3],["kvicha","mx",3],["krw","",3],["ぞ.404","sa",3],["delta","mx",3],["Alexbot","mx",3],["E-xecute-","mx",3],["NOTXY7","es",3],["CierraElBimbollo","mx",3],["strix","us",3],["Retired Critty","us",3],["tmawesomer","us",3],["ADRXN","mx",3],["Charliee","",3],["soulz","ca",3],["Grohl","",3],["chemx","mx",3],["pope","mx",3],["teamovaleria","",3],["Dm_Aura","us",3],["BIG","us",3],["AdoptMeLover33","",3],["TSMjuli425","mx",3],["Listoparalaccion","mx",3],["ｅｚｚｙａ","mx",3],["perdónamephyrui","mx",3],["KDG","us",3],["Wraith","ch",3],["zVipex","mx",3],["Squirtlefeet47","",3],["tiloncito","mx",3],["Moreryu","",3],["sudafv","",3],["Uncle Tilez","us",3],["crispy.fnn","",3],["helios","dk",3],["HUNTER.92","",3],["zenji","de",3],["Scuffron","",3],["acexz","us",3],["chxpper","us",3],["GodNoob","us",3],["WWEJbro","",3],["iker171819","mx",3],["erick22araiz","mx",3],["shrimpfriedrice","us",3],["1су","au",3],["sentix","co",3],["antoboyy","ca",3],["EpikDreidel","us",3],["droxz","us",3],["vazen","ru",3],["Potetbot","es",3],["newport","",3],["Prime Chudbot","",3],["reggykumbiscuts","ng",3],["きゅうり128本","eg",3],["hativa7","",3],["Cando2k","us",3],["r4zoray","us",3],["Arct1c","us",3],["Gemzz","us",3],["Champ","us",3],["Nicho","ca",3],["Crawfv","us",3],["chrollo","mx",3],["Shakespe4rs","ie",3],["BL2oR2X","ar",3],["RC_Santi_SM","",3],["ZZERO","nl",3],["Falling Chris","br",3],["huevin","",3],["MeRedeyez","mx",3],["clout","us",3],["fnbrlgn","ca",3],["hunky","",3],["Landero3165p","mx",3],["Krauz","de",3],["Burst","us",3],["voidftv","us",3],["Pessihub.XP","mx",3],["R.Marinez","mx",3],["Alexzzdrr","pl",3],["ANDYBALA.","mx",3],["Slinky.","mx",3],["Donzo","",3],["Skopez_","us",3],["firefonix","mx",3],["vinyy","mx",3],["Boomer Shiesty","us",3],["Shell","us",3],["batman","us",3],["Flxks3","us",3],["Void_Fierce","us",3],["7oza.","",3],["strideslol","ca",3],["GODFV","",3],["earebad","ng",3],["RyanTheLion","us",3],["Faidez123456","",3],["batman-tony","mx",3],["batman-barrioz","",3],["pinkvenomR","jp",3],["Chungus195459","ca",3],["aero.","ca",3],["Nyro","co",3],["Maaykm","us",3],["Drowning Polux","us",3],["AsianTora","jp",3],["Crazy Poofle","mx",3],["Karros","mx",3],["AcozyH","fr",3],["neyzouille","mx",3],["VEXKY","mx",3],["ChabtanK","mx",3],["enfants riches.","jp",3],["ɢʟ丨ΔϟḰツ","ca",3],["walkemdowndodd","it",3],["y3x","gb",3],["cabritofv.","br",3],["Awugh Miguel","it",3],["DavidFlashh","fr",3],["julyy","us",3],["Vynxer.01","ca",3],["ES1Juju","mx",3],["BlxtzTradez","mx",3],["realseekfn","us",3],["pxmpski","mx",3],["Lr0317","us",3],["dlow","us",3],["kng_angel","mx",3],["kmidi","us",3],["ak1saudade","mx",3],["Karttesqk","mx",3],["Désiré Abeél","ar",3],["tr.310","us",3],["denim","kr",3],["Egamethakilla","us",3],["j.dalocss","us",3],["ethyxs","ca",3],["B89pp","gb",3],["Frxsty","",3],["FINxREEL","us",3],["cryiptic","es",3],["Ayesha","us",3],["FearHorsey","mx",3],["Hy8ra","us",3],["maji_ruffy","gb",3],["Ziqnx","ng",3],["meduzaCUH","ca",3],["stecx Ryzen","be",3],["francho","co",3],["Nexzyy","ie",3],["Bennett","lv",3],["KingMelvin_FTW","us",3],["LeQuartzMAX","us",3],["Fluid1ko","ng",3],["Ryo","mx",3],["sinqreyli","",3],["skar","us",3],["BLIZY","",3],["Llama","mx",3],["GRRMondays","ca",3],["kdubya Schenbe","us",3],["joshtatochip","",3],["pxce","mx",3],["JenryXD.","mx",3],["Smorezz","jp",3],["Bitter","us",3],["FRUTSI chavarria","",3],["cris_minatiza","",3],["LVGRATTY","ar",3],["morawashed","",3],["ParTheSebas","mx",3],["Ghøst_Exe.","us",3],["Zhxdowz","us",3],["Sweaty Fr1cksy","mx",3],["Sølo","",3],["Fragger_di4tyg","mx",3],["korol_danylo","ua",3],["lumxreal","ca",3],["tkayreyli","us",3],["why","us",3],["Yisuswolf99","mx",3],["LeonardoLuna18","mx",3],["xkyreox","ca",3],["cdooley11","",3],["hadireyli","ca",3],["Slepzifylol","us",3],["Wong","mx",3],["ASMRWITHEIKO","ng",3],["tokyeo","ca",3],["din0","gb",3],["Aiden","us",3],["shinji","us",3],["Spooky13B","mx",3],["ash0fps","us",3],["zoe81","us",3],["oreo","it",3],["Dexterity","",3],["Drxcofy","",3],["Shinikage._.","jp",3],["gandalf","ca",3],["Ketzal","mx",3],["kingfnw","mx",3],["YTIhave playz","us",3],["APE","us",3],["Tyson","gb",3],["ᴡʜᴏᴀ","us",3],["Lupin","fr",3],["CloseLongStrafes","ru",3],["kaden2k.","us",3],["Adrianosincejas","mx",3],["Shivison","",3],["jakob","",3],["Goose","",3],["Pavitfn","",3],["IGLF4T3Hovo","ca",3],["Frenzy","ca",3],["CRISTO_ES_REY","mx",3],["MarketToast","gb",3],["Tylerdfn","us",3],["i-own-Tylerdf","",3],["CEO","us",3],["DATBOIDINO","us",3],["Ragin Cagen","us",3],["sinmanospai","mx",3],["musthavedejavu","ca",3],["blitz","ca",3],["Goy-Detector.X","",3],["chubby","us",3],["Tokyoants","us",3],["zynix","",3],["lightfv","gb",3],["ExponentHail70","mx",3],["Alex_Azazel","mx",3],["joe","mx",3],["Terrell123mm","us",3],["airgod1","mx",3],["wavohh","ca",3],["Clutch","us",3],["you","us",3],["R2P","mx",3],["aimnada","mx",3],["Nstar Nkyy1st","jp",3],["monyy54","nz",3],["LexicalChair7169","",3],["BoxicFN","us",3],["gunner","",3],["NateSportsCards1","us",3],["plaq","us",3],["ZalyWaly12","us",3],["Zergama.","mx",3],["ただのあいす.","jp",3],["TH_ZEUS123","mx",3],["Lightxyz","fr",3],["taylor","",3],["connr88","us",3],["gardy","us",3],["nbayoungzexe38","ru",3],["Bananinblast","mx",3],["huberga","mx",3],["Pirush.exe","mx",3],["ItzRealF0sty","mx",3],["mrmakai","us",3],["ItsLxca","us",3],["Bokify","us",3],["chaseylovesu","ca",3],["why.so.seriuos","",3],["Meldabby","us",3],["Raqqy7","us",3],["flako","us",3],["phill","ie",3],["MOSSPIT Bunny","us",3],["Simbaz","",3],["JEPG05","mx",3],["juice","us",3],["s4l","us",3],["da_goat697","",3],["XSET_QUILL","",3],["altee","us",3],["Getboxedbot101","kr",3],["swxngyota","",3],["valentine","fr",3],["Prime Kaibear","us",3],["Positive360","us",3],["poga","",3],["Chipotle worker8","de",3],["Douglas123567","ca",3],["Жёсткий","ua",3],["shanewarne66","us",3],["MAXPASSION DARKS","ca",3],["boxed_u","ca",3],["cookies8854","mx",3],["G3X","ru",3],["Pipashu","fr",3],["guccimarel","us",3],["ttvdaniel123m","",3],["oxi","no",3],["Zockerboyslelu","de",3],["Moneymaker","us",3],["bolt","ca",3],["B3ąsty","it",3],["aurum Timbers","mx",3],["LeoAchac03","mx",3],["xskullreyli","mx",3],["maiki","mx",3],["deafnw","mx",3],["per3ect","us",3],["ReverseElk","us",3],["jacob","us",3],["Artizx.","mx",3],["ilovemochi11","ch",3],["Jordi Barajas","mx",3],["flexx","us",3],["endless1k","de",3],["1pfeze","mx",3],["ScroogieMcdoogie","ca",3],["user.kg13","se",3],["gar6x","mx",3],["indie2hard","de",3],["otsutsuki","mx",3],["Kyrixzy","us",3],["GMN","ca",3],["PanchoDaGoat3","us",3],["Nephew Jerald","mx",3],["usdmomo","mx",3],["tsAldx7","mx",3],["pblob","",3],["Seafish","us",3],["nexor","uy",3],["vilchez superior","us",3],["ZAGS","mx",3],["legionbtw","us",3],["jabyai","us",3],["silver","us",3],["120fpspredator","",3],["swefty","pl",3],["dawqfn","tr",3],["Sirlex_XD","mx",3],["DRAGONMETAL350","mx",3],["Tiza","mx",3],["AzLyAx","mx",3],["IceStxrz","us",3],["manman_myhn","us",3],["bigbj_myhm","",3],["Diego","mx",3],["SPXSZ","mx",3],["C4beza","mx",3],["mikaelson","ie",3],["matuidi skyrix","eg",3],["Tibl4ze_","it",3],["RowBoat612","us",3],["Marcos.1x","",3],["woasta","us",3],["TRICK","us",3],["blackopscop","us",3],["boiled pinklemon","",3],["syb.tony","",3],["Hasbulla2k","",3],["HeLovesAbby","us",3],["Retired","us",3],["Dolphin13","us",3],["Gopher","us",3],["RXN","us",3],["vanishh","it",3],["roofus","mx",3],["Raidz","",3],["Cxmbõs","mx",3],["SRGKairo","mx",3],["herminio20","mx",3],["えいときえ","",3],["LeSkipper","us",3],["saucyfn_","us",3],["OsoBrandon","mx",3],["osuna","mx",3],["Quit.","us",3],["Aeroftw","mx",3],["qazha","",3],["Gamer_boy1659","us",3],["CORE","us",3],["KROVENlol","mx",3],["Banitza","us",3],["daddyddestroyer1","us",3],["FlyAydih","mx",3],["The_king_of_bear","us",3],["KingzChaz","mx",3],["Titanerenjaguer","us",3],["Ecu","co",3],["Sixsevencito.","lv",3],["Limit","ca",3],["貝になるために","",3],["Akofpsx","es",3],["KFF_DAGGER","us",3],["Godgamer8919","us",3],["GxelFn","mx",3],["Arquimides_14","mx",3],["SolarCarpet8377","mx",3],["WerooBot","mx",3],["lancelot","mx",3],["Tnk-envy12","us",3],["turning","us",3],["chickfilafry","co",3],["krisiwnl","us",3],["Cxshed","mx",3],["SRG","pt",3],["Milkzy","us",3],["LicraAndr3","mx",3],["Leg3nd","mx",3],["kylex","pl",3],["simpleman","",3],["RISSMASJOSE69","us",3],["Pluto Vertz","",3],["righteous","us",3],["7ven","mx",3],["tatta","mx",3],["coldyyfv","ca",3],["Lihfty.","us",3],["shredtfup","tr",3],["alefront53","mx",3],["rt8æ","mx",3],["Hydro_C","",3],["SMG","",3],["DaDaDizzy","ru",3],["VenomHazm4T5","mx",3],["shxrk","mx",3],["AQUINO","mx",3],["Hip-Romz","no",3],["Jnext10","es",3],["invictus","br",3],["JJettas Griddy","us",3],["zIvan1x","mx",3],["riicoo1","mx",3],["wentars","mx",3],["Mxnko","mx",3],["music1x","us",3],["PRIME_GALIVANTER","mx",3],["chuzz magnent","us",3],["syfbau negey","de",3],["AmusedDragon931","us",3],["Ttvglassofwater0","ca",3],["notkillerisgood","br",3],["PERRELL","ca",3],["Surge-_-","",3],["Eric1FN","",3],["wrtulo","mx",3],["DeMujuLaSolto","mx",3],["Aqua","mx",3],["Edyy","kr",3],["Tajinorolapiedad","mx",3],["Hunt","mx",3],["Exsivity","us",3],["tidefnx","us",3],["OtherDuck4574","us",3],["matthew","us",3],["Squiddy","us",3],["NIKOZY","us",3],["tyrese","",3],["Uyjg43454","mx",3],["Litzyy","",3],["ihynga","mx",3],["netenyahu","us",3],["SilkyMilker","gb",3],["Emonster117059","",3],["Madridfc27","us",3],["svnt","us",3],["CARTOON","us",3],["AnasWashedZzz.","jp",3],["Nitr3k","sa",3],["67MILLONARIO","mx",3],["Christian4683","mx",3],["Spiritual","us",3],["BatmanOrca","se",3],["snxwPIE","",3]],"BR":[["piterjackpro","ng",2],["Chainsaw","se",2],["natsibot","br",2],["reiken","ar",2],["mntk","ar",2],["nxto","gb",2],["bränn","uy",2],["Retrofv","ar",2],["Diedan.Bad","lv",2],["Zircelochi","de",2],["eretoxz","ru",2],["reisx","gb",2],["spookyzrr","no",2],["lofefv","uy",2],["mentalista","is",2],["bnt","mx",2],["LoreFerrazz","br",2],["Kenzo9.","br",2],["nieto","ar",2],["Leyton","gb",2],["porangudo","pt",2],["gealouse","br",2],["bertinrk","dk",2],["edchansempai","br",2],["7ven","tr",2],["nogal","br",2],["miguelcriolo.","ar",2],["Gardenal","br",2],["Revers","kr",2],["Dioguinho","uy",2],["blessed","br",2],["Jota","br",2],["hrollo Vorcaro","de",2],["puello return","de",2],["kyzenn7ko.O","de",2],["Yagiz kaan.","de",2],["vxpeer","br",2],["demon felpz","it",2],["nourzs","sa",2],["skzin","jp",2],["power","ar",2],["Mxt","br",2],["LiterallyTheKing","br",2],["turco","br",2],["pantera pret7","br",2],["chief fdfsax157","kr",2],["Nayhowin","ar",2],["Lichxzn","au",2],["Pirizafganistan.","ar",2],["MTRX","br",2],["1chance99loss","",2],["tengomasegoqvos","lv",2],["wdym","br",2],["zitox vault","br",2],["Pxcho","jp",2],["Cxarly","ar",2],["Escobarzinho.","ar",2],["holloway","pt",2],["Txmiling","ar",2],["botonoZoydarD4","gb",2],["creativeplayer2","br",2],["vrturo yankees","jp",2],["feña","br",2],["Joãoftn7","br",2],["Julioftn7","de",2],["couto.bet.br","",2],["Bicalhou","",2],["insano","jp",2],["pedro","be",2],["Chrollo Vorcaro","de",2],["Arturo Vidal7","gb",2],["kinxz Yagami","br",2],["vanhohenheim2270","it",2],["rulayvngblood","no",2],["Manguihapod","ru",2],["Marcal lalau","br",2],["fernandesflex","tr",2],["Fernández","pl",2],["Bxnja Shelby","kr",2],["dalizzs","cz",2],["benshy malado","ar",2],["fiotoso","br",2],["monocelha","pt",2],["Theobuca","dk",2],["gambler","gb",2],["Carraxx","ar",2],["pascu","se",2],["jonipro23","",2],["Shayren","ar",2],["LYTHS","ar",2],["Vitto","fr",2],["klownn","ar",2],["Gxrbotz","ar",2],["ISG","ar",2],["elenano4336_","gb",2],["bnjaa_ignacio","cz",2],["Holger Yamal","cz",2],["señor ortega","ru",2],["lawyer","de",2],["LypusX","br",2],["CalangoAlejado","",2],["DuduzinL2L2","br",2],["w7m","ar",2],["Jsv","ar",2],["Young Diares.","br",2],["Drope69_","ng",2],["Lautyfv","ar",2],["oleo2x","gb",2],["swedrato","br",2],["Shadow Joacoo","uy",2],["cuxu","jp",2],["Eclesiastes","ch",2],["Kento.117","is",2],["ASTYKISS","jp",2],["01Timoteo","ar",2],["Matix","br",2],["elevate sousa","br",2],["jjuanznn","ar",2],["HumilladoByNono","ar",2],["lawss.","ar",2],["K1NG","br",2],["Mixter","ar",2],["WalmarTambo","lv",2],["Mnxao.","uy",2],["t1nchØ","it",2],["deps.","uy",2],["unchblocoronando","gb",2],["7pölar","",2],["Gastøn","ar",2],["BastyFORT","se",2],["joacoAr-","ar",2],["bielrichlife.","br",2],["kikincito","fr",2],["narux","ar",2],["Tomizînn","ar",2],["UKNOWWHEREURWITH","ar",2],["joakirk","ar",2],["floow","ar",2],["Malulo","ar",2],["Slapp","gb",2],["7RX","jp",2],["champs","br",2],["drigomasterpiece","se",2],["venly sanguivar","dk",2],["blixed19","gb",2],["Sant1kk","se",2],["Joakokk","ar",2],["BDC","br",2],["artzÿ","kr",2],["rustzinwingu","us",2],["Panettone","br",2],["floyd","ar",2],["isabel demon","be",2],["floost","it",2],["7Alisio","au",2],["RAMZFVV","ar",2],["bella","kr",2],["kzy","nl",2],["santi marciano67","ar",2],["marciano67","",2],["Matfv","is",2],["EUTDM NACHO","cz",2],["ChoriRey KaTchAu","cz",2],["luckshino","ar",2],["rexyekz","uy",2],["tecladaddy","br",2],["Mvxx","br",2],["anthony mudanças","br",2],["legend","be",2],["Tolosa","ar",2],["valen","ar",2],["lynox pedrorobo","fr",2],["crioxdl","cz",2],["n4xstfv","de",2],["アダムᴬ","",2],["TuyxHD","no",2],["Unstoppable","br",2],["Cebozin.","ar",2],["ttomyZzz","ar",2],["voRensao.","de",2],["prime rob2.0","br",2],["artzxrr","br",2],["seferovic.exe","pt",2],["MOREIRA","pt",2],["kif","jp",2],["uury.","uy",2],["nitero","fr",2],["24szk","de",2],["nyckfv","de",2],["Atom","ca",2],["Potatotulonn","eg",2],["santiv1llaa_","ar",2],["nicoh90s","kr",2],["Shapzx","br",2],["Feiker","uy",2],["anástasis otiel","ar",2],["vinizrr","it",2],["kongfv","lv",2],["kmz.36","cz",2],["BRUCCEFPS","br",2],["莫妮卡出自队伍","eg",2],["boyzao","",2],["MasterBlasterX67","de",2],["teotkbron","ar",2],["Leanwave.","ar",2],["olax","uy",2],["ab7nnon","br",2],["SHARKTUBARAO1","br",2],["xdzin","cz",2],["Bloquinhotv","br",2],["paleto6x","fr",2],["jashreyli","be",2],["Gioox Kvaradona.","ar",2],["fishyssney","by",2],["Lucking","br",2],["esmoux","ar",2],["N4cherki","ar",2],["911Secret","br",2],["Still Unmatched","br",2],["nescafn.","br",2],["neurose7","br",2],["nzr","de",2],["zTokyoHD","jp",2],["d4torz","ar",2],["milaz","ar",2],["soprano","gb",2],["tunon","ng",2],["hyperzin","gb",2],["yutuk","ch",2],["Nayuhhx7","br",2],["benvestylo32jaja","ar",2],["PathsofYmir","br",2],["HenriLOVEBolzani","br",2],["coyes1k","ar",2],["ignvxo.lk","no",2],["JPzinxs","br",2],["Fenix papoi","tr",2],["Conepp","tr",2],["VI7","gb",2],["sapphire","us",2],["Boby17x","tr",2],["IMPACT","jp",2],["Mohamed zynox.","tr",2],["gxbes","br",2],["Crazy","",2],["peluche","lv",2],["2pw89ya53yxqywqb","us",2],["freecss","",2],["nachulinx","uy",2],["Chupasapos65","cz",2],["Kurome","gb",2],["prockleltrocket","br",2],["ltz","dk",2],["tayitorr","ng",2],["Olise Dictador","nl",2],["joaquitogominola","nl",2],["tinoywk","ar",2],["VoShibubu","ca",2],["Agustin5383","",2],["GB10","br",2],["Nova7","br",2],["Hatakefxc","br",2],["plush","fr",2],["Toliveira0","br",2],["Paiva slobers","",2],["Six","ar",2],["bauti","be",2],["kzn237","ca",2],["Cadu","br",2],["razard","lv",2],["vovózinha","es",2],["sanchodzz","ar",2],["chimuzrr","ar",2],["4puntosbeatz","de",2],["bertoL2R2","ua",2],["nwexzrr","ar",2],["Ψʜᴀʏᴋɪᴜ","ar",2],["b.shevchenko","gb",2],["streamFYE","br",2],["telaviv","se",2],["Cellfvx","br",2],["ikxlHF","ar",2],["sxndes blessed.","nl",2],["KaykyFn","it",2],["Silvaz rasga","sa",2],["xngelitx16","",2],["NOAHREYLI","",2],["papoi","fr",2],["enaldo","fr",2],["chiodi","ru",2],["vexzrr cmxota","mx",2],["Soyunmalodemrd","lv",2],["FrancO_O.","lv",2],["Maxvers7x-","eg",2],["crybaby","br",2],["h1724","lv",2],["zami124","ru",2],["4ARON","no",2],["JosecitoLp79","",2],["quartzok","ar",2],["Zryks.","se",2],["TobiHF","ar",2],["Pola247","pl",2],["Luchizin","ar",2],["v.aXu","gb",2],["Durtzfv","br",2],["RaffNotFrom63rd","",2],["PedroHC","br",2],["BAGUAL","br",2],["Alx","lv",2],["FelpzMikasa","br",2],["Kønlan","br",2],["glorius-chan","br",2],["Rnx","cz",2],["Sekiro","ar",2],["innaerealG4life","gb",2],["Joazinfv","ar",2],["henry","br",2],["franco121274","cz",2],["igrwl","eg",2],["cocaah","de",2],["AURA","",2],["Tumamagolfaleo","cz",2],["negatrom","",2],["worstyfv","fr",2],["VTM","br",2],["hxraldmaHD","dk",2],["Octasahur","ar",2],["T1kTok Titisaco","ar",2],["Dirtzz","gb",2],["AntiAwelas6.5","gb",2],["ggaboo11","cz",2],["wekzzy.","ar",2],["solo","ar",2],["Sky1FN","de",2],["kayzera","ar",2],["F4TALITY vizenfv","cz",2],["Juxm7fn","lv",2],["Gutin9907","pt",2],["VENLY throne","de",2],["jokerzrfn","br",2],["velvet","it",2],["D1sr3spectful","eg",2],["dakuon.","",2],["couz","ru",2],["Velocity.opy","gb",2],["Bomfim","br",2],["Alvxanderssj","nl",2],["qeezyw","gb",2],["amorim","de",2],["t1bu","gb",2],["gaspy","cz",2],["Boiocrr","nl",2],["Felpsz","br",2],["zeteka","ru",2],["zuko","it",2],["L0RZ0.","jp",2],["EUFORINHO","se",2],["botinha","br",2],["vex","tr",2],["Mathi","uy",2],["CUY","",2],["Sh0tha","ar",2],["señor courtz","gb",2],["guiszan.exe","uy",2],["lothbrok","br",2],["NawaK","ru",2],["tatianaS2lorizon","ie",2],["Cosmic7.","it",2],["cacaa duvet","de",2],["Jordannbzx","br",2],["Only.","lv",2],["PMB","lv",2],["frxzy","de",2],["ferrxyraHD","ar",2],["naikki.","",2],["duda","it",2],["bondii","ca",2],["kyzes","",2],["vexo","cz",2],["Jxnko","lv",2],["mxteoo23","ar",2],["Fabrizn","ng",2],["krvwn.","no",2],["capos","de",2],["ᴊᴏᴇʟ十","ar",2],["pinq","gb",2],["MOUNTXS","gb",2],["Anar.lmao","de",2],["gsprado","br",2],["arthurpanon","br",2],["ragedythone70","ch",2],["0IGHT Mythos","br",2],["Vatski","br",2],["92nikitoxjr","",2],["92bitoxjr","br",2],["jissenialezcano","nl",2],["theeuzinsz","br",2],["1zetti","br",2],["Tjzzfv","ar",2],["Limpu","ng",2],["Sxbwnz","cz",2],["faelzinn","br",2],["Vida-Dalu","ar",2],["CR4ZZYCOW10","",2],["kikiwhale.","us",2],["ᴍᴛᴢɪᴍ","br",2],["LoHarePorTiPiki","eg",2],["JuanBaldaa23","ar",2],["YelloBRZ","br",2],["gear5 gepeto","ru",2],["lincolln","de",2],["tuyzin","de",2],["KREYIO","",2],["KarboncitooXDD","lv",2],["ignite swimsbot","br",2],["coltzbot","mx",2],["Nauak","fr",2],["MONACOKV1","au",2],["Kruust","ng",2],["Moreno fragger","tr",2],["Hugoyxz7.","",2],["BENJUCHOms","ar",2],["joaregue","ar",2],["patinchelo","no",2],["grymachtine","de",2],["onurB","br",2],["digas","br",2],["GRD","ar",2],["Pingu","jp",2],["Leonel","br",2],["kentabuca","cz",2],["Klooss","cz",2],["greed matthewfv","gb",2],["NPNH","de",2],["authenticg0","",2],["Lacabra Tuttys7x","br",2],["Jeanfishy","lv",2],["07Lanky","ar",3],["fxrko prime","ar",3],["PRIQUITO","br",3],["ruhtraa","is",3],["finta","de",3],["Faddo Beltera291","br",3],["gustalfg","uy",3],["Bonfa NEGRALHA","br",3],["FLASHZRR SAPIEN","gb",3],["abusadilson","br",3],["BLD","ar",3],["Roncola","",3],["TheyLoveDaytona","ng",3],["mvp.pingubuca","sa",3],["Dbest","br",3],["rkz","br",3],["Siberiano","ar",3],["Gafexx.","ng",3],["señor valentino","pl",3],["Shinakwaicatgirl","kr",3],["Doumbia.","pt",3],["Goofy","ca",3],["Diree.","br",3],["Pxncho","ar",3],["Jeazy","ar",3],["Tobitachero","ar",3],["Joaco","ar",3],["wooka ferdy","pt",3],["Mvx","kr",3],["sxntyn","cz",3],["duritodeplay22","ru",3],["Davidominee","ru",3],["fynx11.","cz",3],["PRIME TOMIBOT","ar",3],["Lynox Dembélé","fr",3],["OGui","br",3],["Erikao","br",3],["BoberGOTY","",3],["Kenso Gaethje","tr",3],["rafapeixonauta","br",3],["drekyzrr","br",3],["F1BR7","ar",3],["6-F3R-9","",3],["Albert-lynx","ar",3],["Young Matuzz","ar",3],["facilitomanito","ar",3],["Pochola Curtzkk7","eg",3],["fierosargento678","ar",3],["Dabliw","br",3],["guih","br",3],["zeninpkxd","es",3],["KingTz malado","br",3],["Maybank","no",3],["coronaa3k","de",3],["unknwn.jose","",3],["Demon_Alberthxt","ar",3],["benjota25.8","eg",3],["docinho","gb",3],["Digosh.","jp",3],["safirapatasfofas","jp",3],["leobex","ar",3],["everydayleka","fr",3],["artify7","ru",3],["crabeache","ua",3],["no-limits","cz",3],["milkxv","gb",3],["yeiimon","sa",3],["tuti","ar",3],["queirozrr7","br",3],["sharin gaucho","br",3],["dacunha","br",3],["Timoteo Griguol","ar",3],["snacky","",3],["riqzera.","br",3],["joao","dk",3],["Doritos","br",3],["Takis","br",3],["diykuat.","tr",3],["Fl1ck_","gb",3],["Anilzxz","ar",3],["Ice1v3","br",3],["Monobrazil","br",3],["lingua raulzito","br",3],["pxsqa cafeta","it",3],["Papooi","ar",3],["Washed_luki","",3],["Noobleon1231","se",3],["Rushz","se",3],["Not","br",3],["spedii","br",3],["hometown glory","",3],["yamal.","es",3],["mrtnzera.","no",3],["sleetzko","cz",3],["fireglorydays23","sa",3],["mensola","it",3],["Jolly19_","it",3],["kraek","ch",3],["cardoso preto","pt",3],["viggx","no",3],["pardal","cz",3],["TheFirstRomantic","br",3],["TRAKINAX","br",3],["klanngkuenstlerr","",3],["khvicha7.","cz",3],["Limas Tommy","be",3],["AresTheSinner","br",3],["kainancrzylk","br",3],["grigorio","sa",3],["malik fidecrente","",3],["labubu kawai","br",3],["andre1st.","",3],["clivbot","us",3],["bernarrd1nn","by",3],["Rochx","br",3],["goggins","br",3],["astrothunder","de",3],["16nvcolass","no",3],["teeqwk","ca",3],["Tjota.","br",3],["cekky1103","eg",3],["bryan","br",3],["vitin atroz","gb",3],["cksx","de",3],["Light","br",3],["ISCARIOTES","br",3],["Lx62hz.","ar",3],["AerCool_","ar",3],["Lukaroman9","br",3],["LOWRX.","uy",3],["dalecuidate3279","",3],["VILLX","co",3],["Donnald","br",3],["Asaphzz","gb",3],["mıstĸ","ar",3],["porcos castaways","cz",3],["garotinhaemokwai","br",3],["TESTOSTERONIX_OG","br",3],["Guimoks","br",3],["nicholas","br",3],["Sable Fillipin","ca",3],["hazvar","ca",3],["Reyess7x.","ar",3],["smart money","nz",3],["Cacovini10","kr",3],["lucxz","br",3],["Gemeos_dl","",3],["leonardovvs.jr","pt",3],["tonecas.","pt",3],["c4co","gb",3],["GOODTIMETOGLORY","br",3],["YeezZY","br",3],["roncaria","mx",3],["gerelson dureza","mx",3],["G7.","",3],["Nutria Marinaa","br",3],["PAOLO","",3],["mrpotaxiogod67","gb",3],["crowtz","",3],["sickz","br",3],["lautyy","ar",3],["Luxio_13x","",3],["Zynx.","ru",3],["Agus2019crack","ar",3],["CarlWheezer","ar",3],["Ram1","ar",3],["Ferrari","br",3],["Walberty Noxyz","br",3],["onlyN1NE","ar",3],["bless","cz",3],["Joacc lechon","ar",3],["Valen9x","ar",3],["palmerammerchef","de",3],["Careca Chocante","",3],["starboy","br",3],["cleitobravo","br",3],["JuninhoO","ru",3],["DARK","br",3],["bauabb","us",3],["ismaelARG12","",3],["luanguk1","it",3],["mogger","br",3],["blessedb0y_","by",3],["milkard123","br",3],["migzfps","br",3],["vichontii","",3],["N7s","kr",3],["kirchmaier.","de",3],["seven shxrk","br",3],["määxsanty","br",3],["NAJA","br",3],["chickixbublic7","gb",3],["flippynada","ua",3],["Chizu Estoico","ar",3],["IGL_Emi","ar",3],["MATØFV","cz",3],["benguisx","cz",3],["Sengerx7","ar",3],["after","ar",3],["Dictator Kylian.","cz",3],["G0TI4","",3],["Aless","nl",3],["enzinnfv","ar",3],["Liro_Duck","br",3],["pequeno cristo7","fr",3],["raizera","de",3],["senor varela","ar",3],["1Xx_wesley_xX3","br",3],["Bigsm0ke1320","ar",3],["RednavEh99","de",3],["washed","de",3],["venas","ar",3],["joeljunior09","br",3],["Tutuu","br",3],["sylren","br",3],["frohuel","br",3],["Marcosprobt","jp",3],["ferz1","ar",3],["nyxzwow10","gb",3],["Keiko Fujlmori","dk",3],["deus.","ar",3],["comeback","ar",3],["pulga","gb",3],["Gxlle","gb",3],["anubiz sixtytwo","br",3],["Firezin7z","fr",3],["pedrock2005","ar",3],["juliengenon975","cz",3],["porotodeus","gb",3],["BIG","gb",3],["Lucas","",3],["Ferdi.DIGIT","",3],["Usuzerus","ar",3],["zxdinn.seven","es",3],["Allanfv7","br",3],["Yonkazee Ruthles","fr",3],["gulealz","au",3],["valenttino","ar",3],["rulinho","is",3],["Enddshadow","ar",3],["santijumy_09_","",3],["santi","ar",3],["Fht","br",3],["klow","gb",3],["Lautadeus","pt",3],["Nahuel19-","ar",3],["pinkyy","",3],["gaspipineda","gb",3],["tio_fanjamon","",3],["PlayLanhouse","",3],["Jzn","br",3],["Noxyr","br",3],["1Brendo","",3],["Jako","",3],["ᶠᵃᵏᵉ","br",3],["Ascent","br",3],["ジョアックス","br",3],["stylo32sabelo.","ar",3],["stylo32","",3],["valenzen","sa",3],["Chizo9","ar",3],["Fr.Dylan varela","ar",3],["vtchef","br",3],["Camarote","br",3],["basti sempai","cz",3],["Eitoz.","",3],["tugasz7","br",3],["ABUELO RETIRAO","es",3],["cheesee","es",3],["VOLTAGE","br",3],["Enygma","br",3],["jeffrey","ua",3],["L4ITE","br",3],["corongo","br",3],["Milanesa","ar",3],["BAUTIKIUT67","gb",3],["GORDO PISTOLA","ar",3],["PELADO PISTOLA","ar",3],["bää","fr",3],["Senn","ar",3],["gordita cocien","sa",3],["PACCOLA","",3],["jul1antz","ca",3],["yknz","ru",3],["Noway Hakai","br",3],["Webcorno.greyrat","de",3],["M1NT","ar",3],["Swinko","ar",3],["luizinnx","de",3],["SNTØG","eg",3],["Santt","gb",3],["mvp.1laurinmw","ar",3],["Jun","ng",3],["26turcofv","",3],["PERSEO.","kr",3],["benjx","",3],["quieres","br",3],["Chubby","de",3],["ChiperiaSanRoque","ar",3],["CONTROLANDOELKi-","nl",3],["arroganti mirkus","co",3],["Dwasouzawyy1x","",3],["mario","ar",3],["Clopy","nl",3],["Venly","br",3],["venly vxlenn","ar",3],["もう少しだよ","ar",3],["P3dr_o_","br",3],["zhutrat","br",3],["zika","",3],["merge","br",3],["aurora geroo","br",3],["Backyardigan","it",3],["Adriano1401849","br",3],["7WL","fr",3],["fer","",3],["KchaMostrolikos","ca",3],["koshureky7","br",3],["ToxicNextAge","br",3],["Mxthfv","br",3],["Biel2k26.","br",3],["Arthurkxr","br",3],["Cragchilee","",3],["armndo.mmnf","gb",3],["TerryPO Clutch","cz",3],["W10-Matador-GG","br",3],["Fe_barbado","br",3],["firas","",3],["L10N_zy","br",3],["soretemarron67","sa",3],["MILKEDBYCHIQUI","",3],["Deadbiel prime","",3],["Feliper","",3],["bautyy7.","ca",3],["绝地求生的战女","fr",3],["cuesto inshallah","br",3],["戻ってきました","br",3],["legitzbtw","",3],["cronixs10","",3],["Fixo_-","br",3],["gbot","mx",3],["ReLosis","br",3],["mazarabot","",3],["fazee","gb",3],["BorenaT","ar",3],["Godin_288_outfit","br",3],["ＮＡＲＲＡＤＯＲ","br",3],["falcon","br",3],["souza1mple","jp",3],["rem2k.","gb",3],["mvp","ar",3],["Default","br",3],["frzq","kr",3],["kikino","uy",3],["négabrieo2","br",3],["StuckWhippet3230","ar",3],["Augustomartin770","ar",3],["ᴄᴀʟᴅɪᴛᴏ","ar",3],["L1xusdeus","pl",3],["t0mzydeus","ar",3],["Bastyjrr","cz",3],["ANV1X.","cz",3],["baddending.","uy",3],["Vskezy","no",3],["kekex67","ar",3],["KaliLinux","ar",3],["chërki patrão","ar",3],["Bennjazrr","ar",3],["Juani takbron","gb",3],["negrin","br",3],["SPINELLINEXTDOOR","jp",3],["bombini jackzini","br",3],["doutor rupretoni","br",3],["jow","fr",3],["Pedrinx12_","br",3],["GenioPW","br",3],["Control","fr",3],["peretik1ng","gb",3],["F4RB1","sa",3],["consolegotyfv","cz",3],["josupro07","es",3],["Flatarøn","ua",3],["amasaboludo","gb",3],["V0iid Notunrboy","kr",3],["synoxxALBIS","br",3],["ykz","br",3],["Lxrsino assasino","nl",3],["L2R2isLove","de",3],["sienna","ar",3],["Theusbren","br",3],["Fenixx1st","br",3],["flawio","nl",3],["kernel klona","ar",3],["cori","ua",3],["Thitiplays","br",3],["BrunoAwaysWins","br",3],["TTRYXMA","no",3],["sadeyy","gb",3],["pscuploser","br",3],["ghost","br",3],["Sxares7","",3],["IETrindade","br",3],["MegaPrime.","ru",3],["INDIANO_244_","br",3],["venanciofnt","br",3],["quejo lalelu","br",3],["Cheetos p3dr0n","",3],["ɴᴏᴠᴏᴀ","",3],["dynam1tro","de",3],["tomqtee","de",3],["29.gtz","br",3],["pimpolho","br",3],["nunezzss","fr",3],["shinden capko","ar",3],["NotPach01","br",3],["Petrix67resenha","fr",3],["23kinder","es",3],["Itsmateo88","ca",3],["Cese.","ar",3],["GALDINOFN","br",3],["v1eira.chad","be",3],["zh3kkax7fyachefv","ru",3],["Adolf Benin.","gb",3],["Kzagus","br",3],["Aurora bxrriga.","cz",3],["kn1ght","kr",3],["JulitoLugano","ar",3],["arame","ar",3],["Enysangt","ar",3],["McQueen","ar",3],["FORCE","kr",3],["wolfgang","br",3],["Yultra-xd","ar",3],["khabib","pl",3],["Machadofv","br",3],["chipi342","ar",3],["伊ﱞ万ﱞ尔","ar",3],["CODE","br",3],["voidd","jp",3],["BrilliantOwl8314","br",3],["andre","us",3],["Zykrxn","de",3],["Guikiller30","br",3],["Paulobassani","gb",3],["ᴡᴀʀʀɪᴏᴅᴢ","",3],["zreedx.","br",3],["thrasys","br",3],["rilex445","jp",3],["Isawa2.0","de",3],["Peterpepe","ar",3],["marc","ar",3],["POLLO dictador","ar",3],["PRIME.","fr",3],["polar training","de",3],["coxta.","br",3],["plaajhb","br",3],["IGL","by",3],["jaqueline","de",3],["Amandalima","fr",3],["Gallo2462","gb",3],["Jöaco","de",3],["Jermaxma125","ar",3],["PS4-luquitaa123","ar",3],["drx","br",3],["katsuzyw","",3],["HACEELO","de",3],["pardalx6","co",3],["ritxzen","no",3],["ELQETELOPONE6.5","",3],["cruizcredo","br",3],["chatao","br",3],["tub4fh","br",3],["ＣＡＢＥＬＬＯツ","br",3],["iojan","",3],["nazzxa","us",3],["Bernardo1441","de",3],["Arthurcohu","",3],["spittfv","br",3],["zendaya parker.","gb",3],["ファクンド","ua",3],["ルシアナ","ar",3],["iT_zoof0r","cz",3],["ᴠɪᴠᴀꜱッ","ar",3],["banana","gb",3],["Manuu","br",3],["Sp5derr","cz",3],["MAVALT","cz",3],["łoko_","",3],["BenjaGiovanna","br",3],["Winter_esports","",3],["slowy","ar",3],["alexober06","ar",3],["FERNANDXO","ar",3],["netogalante","",3],["Mateus_braboo10","br",3],["Faisca22","gb",3],["nhzz","br",3],["mnzz","us",3],["prime","",3],["Nana","gb",3],["nxght seven","gb",3],["vicek","fr",3],["maximus","br",3],["Jordan","br",3],["Canico_aprumado","br",3],["warken","br",3],["ferriOImbroxável","fr",3],["Furia","gb",3],["马蒂亚斯ツ么","br",3],["pressureogzz","ru",3],["pazprevalece7","de",3],["Katuli00","es",3],["Skipper","kr",3],["lozano requiem.","lv",3],["raphinhadamotoca","br",3],["batom","ng",3],["1pedroftn","",3],["lorenzo201938","de",3],["Mnjohn","br",3],["heliorstheend","gb",3],["L3godd","uy",3],["YaelGolera01","uy",3],["omena7","br",3],["thimafre","br",3],["ELA.NUNCA.TE.AMO","es",3],["Amysset","ar",3],["14gon","uy",3],["CALDERON","ar",3],["Migon","fr",3],["Flawless Nejii","br",3],["frans classic","br",3],["cossÿo","uy",3],["KJSEMMIRA","br",3],["pocoyo","tr",3],["ph4nton","es",3],["tomiinnjrr","cz",3],["Vxlenzh1nPRIME","ar",3],["Theohuracan2011","ch",3],["Pirarucu S3boso","br",3],["ravenzinn","ar",3],["ik1pls","pt",3],["Tedesco","br",3],["lawless","br",3],["козел","jp",3],["LeKOwilybuca6.","cz",3],["simon_manu_1234","kr",3],["barco","dk",3],["twitchf1sheyefn","lv",3],["Estxn Lollipop","lv",3],["peluzon69","us",3],["mastter","be",3],["Haroldinho_neto1","br",3],["TioDimKiller","",3],["StarYass","",3],["yvng","ar",3],["Prime Miguel3M","br",3],["pucho","se",3],["007_TOKIO","",3],["Finitp","",3],["BAIÄNO","",3],["aberlinck","br",3],["Ortigoso","br",3],["Adlhin","",3],["fakerr","es",3],["bzt1","ar",3],["manyamujermia-4","uy",3],["sharksito","ar",3],["Zelde","",3],["Lucxxno23","",3],["fentgar","us",3],["Pharm","us",3],["menor","br",3],["nowebubu","lv",3],["MistXify","gb",3],["Pedrpiilk677","",3],["pipintao","gb",3],["aquiga_","",3],["sbxysk7","co",3],["jackronyx","",3],["Vida0077","gb",3],["DXLLARIZED","us",3],["Chache FinalBoss","jp",3],["Flameeszn","is",3],["Fadd4D","br",3],["wolfTHE-BEST-_-","br",3],["JoyBoy","br",3],["Sasha Astral","fr",3],["Cauagameplays30","kr",3],["Thrivago","ar",3],["Lira","br",3],["Inter_Mathy","us",3],["Guizeta 180hz","br",3],["Rattus novegicus","br",3],["Caiox brabox","br",3],["nevesx","br",3],["SYNC","fr",3],["K3nny","",3],["Marcos Antônio","br",3],["yutaxz.","by",3],["ᴘᴀɴ","fr",3],["manizrr3279","ar",3],["benjjstylo.32","fr",3],["67tembo","ng",3],["Nahuxboyy","",3],["PERONCHO","ar",3],["scott ironsight","br",3],["Guiramonos","br",3],["Gabriell41","br",3],["t1ng10","gb",3],["Ginogd14","ar",3],["Pedluk","br",3],["NachoElPro2029","",3],["Pat0SpamPiumPium","ar",3],["logan27lea","ar",3],["DaviMGBRK","gb",3],["señor chaquetas","de",3],["ñokiiay1.","gb",3],["svn.ww","",3],["Chemzcita","",3],["HENDRIX","pt",3],["caramelodu7","ng",3],["vendochori","nl",3],["rising bazarrin","gb",3],["ycaueFNy","",3],["santybaby","cz",3],["wave","",3],["zurdoo.","",3],["Hernan Inyeccion","ar",3],["Kurzyto","de",3],["T6I","de",3],["lin8fv","by",3],["señor guedes","br",3],["joker_six seven","it",3],["JoacoFlores23","ar",3],["bxnzz","ar",3],["LXUTI7","by",3],["block","lv",3],["fabri","",3],["carolinex","gb",3],["bael","gb",3],["Seiko","ar",3],["Smashh","",3],["dossantos17","br",3],["Lulo452","ar",3],["Wuistaxe14","jp",3],["Mogli","it",3],["mighxty","ar",3],["Lamine castro","es",3],["luizvyy7","br",3],["Uhtred","br",3],["Feli_promax22","ar",3],["johnfime","",3],["grinberryall","dk",3],["Rdr","ar",3],["alwx4nder","lv",3],["isaac","",3],["igxfv.","gb",3],["señor bunny","ar",3],["nickywask97","br",3],["nyxø","br",3],["Kayrox","br",3],["LamentoDoAndre","cz",3],["McGregor","lv",3],["tuss1adinho","br",3],["diegodeus67","by",3],["AlvarooZ.","sa",3],["6vlonss","br",3],["BigG","br",3],["Thorfinn","br",3],["Synth Optimizer","br",3],["señor","no",3],["4ever","gb",3],["Ninja","",3],["Dembélé","gb",3],["Arkplays","br",3],["charradin","es",3],["Fancy","",3],["mxchii.vzz","",3],["EUsouomaestro","us",3],["naogrita_","br",3],["salum","",3],["Diter-Py","",3],["Moura","br",3],["TwitchKaslow2703","",3],["GROOT_","br",3],["fluflu","fr",3],["XixioHD","ar",3],["mgz","fr",3],["7even tayrone2x","br",3],["PATRICKINFLA21","pt",3],["shinden","ar",3],["quincy oziel.","ar",3],["castrinxz","br",3],["Senór Pardal","br",3],["KYLIAN DICTAROR.","jp",3],["CEDROS kazzy","ca",3],["stellarfv","us",3],["linkmassk916","br",3]],"ASIA":[["DFM","",2],["nxvuzo","jp",2],["Vertex","jp",2],["fightgum3","nz",2],["E36","jp",2],["DFM_Nephrite","jp",2],["BFS_Chupey","jp",2],["oxthdead","",2],["umaibo_s","jp",2],["SwizzY281","kr",2],["なれじか","us",2],["valxcheeseburger","",2],["LooperHD","jp",2],["White T1gers","",2],["るーくん給食当番","gb",2],["MLBfn7","jp",2],["shxrkÿ","jp",2],["たつや","",2],["ひかる舎弟","",2],["高3になりたくな","jp",2],["がーちゃー","jp",2],["Zero","jp",2],["safaiafv","jp",2],["Zst","br",2],["むいくん001","jp",2],["GOATGOATGOATGOTY","be",2],["クラッチゆうき","jp",2],["Lefre","jp",2],["way_qwisty","ru",2],["uk78.","be",2],["Redo","jp",2],["ねこきちまる","jp",2],["cr9zc","dk",2],["へんなりねす","jp",2],["ソヘイテンらいと","ar",2],["すぽんじなのだ","jp",2],["リオネルメッシ","",2],["yumubataa","",2],["Remiry","",2],["きいねるやけん","jp",2],["ねおん77","",2],["rice","de",2],["kamiti-akyuma1","",2],["shxrk","jp",2],["復活のたなか姫","",2],["lca3yz","jp",2],["millicent","",2],["しゅうとはやと.","jp",2],["meah._x","",2],["OBI-F Aostach","",2],["AMORIS","jp",2],["amoris wagers","",2],["ソルガニール","jp",2],["pinkÿ7","jp",2],["t3eny.","jp",2],["デーモンりゅか.","jp",2],["osarufn","jp",2],["respect tjino","",2],["たかちゃっか.","",2],["奥田葉","gb",2],["falcon acerola","us",2],["ぬりぃぞ","",2],["しゅんコロ","kr",2],["Lets","",2],["ジェット","gb",2],["wickesyzz","",2],["taikufv_mini","jp",2],["もちクッキー","jp",2],["res.rise","gb",2],["Herb","jp",2],["Reirei","br",2],["まてうすくーにゃ","jp",2],["れおジャイロ","jp",2],["Turbo","",2],["menma","ar",2],["ORIUS","jp",2],["ざぐーぱわぁ","jp",2],["xlqvn","jp",2],["智慧之王","ru",2],["ReLit mintiaxz","jp",2],["ぽこた選手","jp",2],["Tetu24x","jp",2],["RYZ","jp",2],["ていにーぼっと","jp",2],["魔法少女こぽ","jp",2],["Dolyxski","",2],["簡単操作","ca",2],["灰宮美桜","fr",2],["ryufnq","ca",2],["reyt","",2],["Jam","se",2],["GLAMOROUS","gb",2],["しゃなやけん","jp",2],["金獅子のシキだあ","",2],["xFiwlzy","jp",2],["llxqwx","ar",2],["Michael Olise11.","jp",2],["XERO","jp",2],["shogofn","jp",2],["シュナウ","jp",2],["Hamufn7","jp",2],["Acris Hinaking","jp",2],["ささもっＴ","jp",2],["Japan","jp",2],["Salvatore1st","jp",2],["めぐサンタ","",2],["beaver","",2],["SPYLE_nysvc","jp",2],["ぱずるくん","jp",2],["misshinyache32","ng",2],["minit","jp",2],["kayleyslayer-_","jp",2],["儚い暗殺者","jp",2],["大妖怪ワビナシ","jp",2],["IGNITE.Totto3","",2],["karimu_u","",2],["aimer","de",2],["xqhrpyer","jp",2],["zen","kr",2],["宮村伊澄","jp",2],["SecondaryEar7733","jp",2],["FitSquirrel1261","jp",2],["DIE","jp",2],["Acris","jp",2],["ichitoichigo","jp",2],["しゃとる","jp",2],["Riam","jp",2],["みーちゃんじょ","jp",2],["dokn","jp",2],["sleepy","gb",2],["stitch_the_NK","",2],["Alpha","",2],["ニセモノのるな","jp",2],["まっぴぃーー","jp",2],["Mofu","jp",2],["masapooh","jp",2],["zetafvx","jp",2],["ぽぽちゃんまん2","",2],["FranticLion8872","jp",2],["xset","fr",2],["Atlas","",2],["ミルトピ","kr",2],["おもちなう","se",2],["ブシニャンです","jp",2],["コルク狩り33","",2],["FNATIC Salko","us",2],["さかなっち32","jp",2],["liullèzski","gb",2],["faIcon chache","fr",2],["ほいっぷくりーむ","jp",2],["Wagers","jp",2],["e-sporterSS","jp",2],["xpf5m","sa",2],["xha3o0","sa",2],["たけたけ35","jp",2],["Ponyobøt","",2],["俺はハンターだ","jp",2],["fancy Arunghamfv","jp",2],["小鳥遊ホシノ","jp",2],["LALWINNER","jp",2],["T1ger respandy","fr",2],["T1ger","jp",2],["KH-gisa","",2],["感覚に頼るなぴぱ","jp",2],["Cruise","gb",2],["repochikin","nz",2],["堀大輔のマラ","jp",2],["C3MOA","jp",2],["ｋｅｙ０４５","jp",2],["なかおともっちー","jp",2],["NEOS-G","de",2],["ただのたわしー","jp",2],["たつぐらーる","jp",2],["るてだよ","jp",2],["とまとけちゃっぷ","jp",2],["いとうあさこです","",2],["くらっちあーる","jp",2],["たてもじ","jp",2],["AST","kr",2],["Frisk_freedom","ng",2],["Kin.79","jp",2],["フェイ","",2],["かつおブシ斬り","jp",2],["さるみっちーー","jp",2],["ほねっくすーー","",2],["Life","be",2],["超拡声みみっち","jp",2],["squzy","kr",2],["yaxcgzeet","ru",2],["IGNXL wonth","jp",2],["ほかほかやで","jp",2],["もっちーとなかお","",2],["古川龍星.","",2],["xiao8.-","jp",2],["かなはむだお","jp",2],["スイッチ勢黒猫","jp",2],["よわないうめしゅ","jp",2],["klyeux.","",2],["王です.","co",2],["近藤高志ｒｅｓ","jp",2],["Raijiefv","",2],["のぐにき","jp",2],["takatofv","",2],["タイミーばぶち","jp",2],["サマードッグ","jp",2],["akatoao-7iro","jp",2],["Reyschenä","",2],["君がくれた冬.","eg",2],["zhinfnr","jp",2],["ききごろう","",2],["lastdancerveco","jp",2],["くろえ-.-","kr",2],["はにーたると","jp",2],["gxzrm1","jp",2],["Christmas","",2],["wacban fanzolly","ru",2],["本気出す5分前","jp",2],["Herb-N Ralim","gb",2],["timko","jp",2],["Lyr1cal Lemonade","gb",2],["あめみや","jp",2],["VICTORYROYAL3150","jp",2],["ばつ8532","es",2],["SUAC","jp",2],["shokun0921","jp",2],["lxp_2q","jp",2],["강하다입니다","jp",2],["遠藤まりん","jp",2],["筋トレ楽しℬ_-","jp",2],["よっ99","jp",2],["ナラーめん","",2],["ふつうのぬっこ","jp",2],["pageyann","jp",2],["ししょうだぞ","nz",2],["AUR","jp",2],["NXFZ","jp",2],["CH.Cloudy","jp",2],["hxldr","ru",2],["ralezski","ru",2],["ゆい弱","jp",2],["ゆい弱い","jp",2],["のぶりん","jp",2],["AFT","jp",2],["rakirye","jp",2],["peterbot","jp",2],["のしっとん","gb",2],["NOA","jp",2],["つきかげなんよね","jp",2],["よこすけで検索","jp",2],["ととまるちゃん","jp",2],["してし","jp",2],["めんちゃんㅤ","jp",2],["ぴぃたこ","",2],["ろじにき","cz",2],["marxbot","",2],["BIG","jp",2],["Reelafn","jp",2],["nightcity lives","jp",2],["f0rkeiken","ca",2],["ラッシーメッシー","jp",2],["bouquet","jp",2],["PompadollS.","gb",2],["ほくっぴやけん","ar",2],["Рамуне","jp",2],["きっとふぃぶ","jp",2],["aeNingNing","fr",2],["martin","jp",2],["沖縄に帰るために","jp",2],["resKirillian","jp",2],["Gum","jp",2],["beedogs4N","jp",2],["pinkvenomR","jp",2],["SEDWICH","gb",2],["xtugutti","jp",2],["平和主義.","jp",2],["藤本太郎","jp",2],["こよせぷんぷん","jp",2],["tomato","br",2],["Rheno_YouTube","jp",2],["shxrky","",2],["火星人","jp",2],["バナナ大王つばさ","jp",2],["偽物の勇者","jp",2],["あっなるまん","cz",2],["Lionel Yutta","gb",2],["Makishter","se",2],["Lasseshter","se",2],["rai","",2],["サムこれは補助","jp",2],["くらっちぽよ","jp",2],["asgardski","jp",2],["n1pline","gb",2],["NexF-G spark","",2],["葛城結界","",2],["あかさーなんよ","ar",2],["FewApartment5006","",2],["レクオ","jp",2],["Anonymous","jp",2],["Aurora shxrk","",2],["supuneko","jp",2],["GIGA42323232","",2],["岡崎8番","jp",2],["りすあるっちゃ","mx",2],["wayyache","jp",2],["Lum1ns","br",2],["シャマルピー6","",2],["ω炒炒ω","jp",2],["NECTAR","jp",2],["t3eny","dk",2],["Endearmentvessel","kr",2],["大会に出てみたい","us",2],["ZiRouFN","mx",2],["FUZIMA46","jp",2],["kouchanz","jp",2],["MMC","jp",2],["syouyu77","jp",2],["Tomatocamoyo","",2],["さんどりばー","sa",2],["REOMURAMURA","",2],["8時間睡眠堀","kr",2],["pikafnbr","gb",2],["ha1lr.1ia","jp",2],["FAxeno","",2],["Forever Cloy.","",2],["Sherryfv","jp",2],["Peterpoteto118","",2],["ResidentAir218","",2],["kirakirand","jp",3],["すたさんてんさい","gb",3],["HXMach_ECT","jp",3],["ひろちゃんだお","jp",3],["Salvatore","se",3],["BenBen","ar",3],["フィリピン","gb",3],["korpyache32","de",3],["skyland","ru",3],["Flowers","ru",3],["BOBUTI","jp",3],["天賦第八究明者","",3],["paralym","jp",3],["眉頭蛇乃助","gb",3],["enjoy_PEN","jp",3],["ギゥィ","",3],["Worker","jp",3],["ぐーー","",3],["ガードレール３","jp",3],["Oliviasj1e1","nz",3],["Хох0лд1к","ua",3],["nxltz","",3],["Summer Pockets","jp",3],["くらりんぱっぱ","jp",3],["Chillplayer","jp",3],["AMORIS ROGI281","jp",3],["爽快な不愉快","jp",3],["H.a.z.r","jp",3],["SoundCloud16ss","gb",3],["六根清浄Ӝ","jp",3],["Gödelscher","jp",3],["Schrödinger","",3],["tasaki","jp",3],["misty","",3],["Aile","",3],["Liberta yaqfv","jp",3],["hajime0924","jp",3],["Zagoutoxic","",3],["からすんすん","sa",3],["Splix7_","jp",3],["among 170mm","",3],["RGL","jp",3],["非常食もやし","jp",3],["pxlarized","gb",3],["魎魑魑魍魅魍魅魍","jp",3],["ごきぃやで","",3],["jingg","kr",3],["Knurinho549","pl",3],["らむだってばよ","",3],["PabloSharku","jp",3],["kenyosi","gb",3],["射生理管理者代表","",3],["imposter shn1ft","mx",3],["joker","jp",3],["rikumal","jp",3],["auragoty874","ru",3],["ウランヒカン","",3],["takeuma","",3],["FUNNY birdyn","jp",3],["faicon pollo","jp",3],["ZAPPI","jp",3],["karfÿ","kr",3],["hayasuu97","jp",3],["ひらりら","jp",3],["黄色だっちゃ","jp",3],["o-iotya","jp",3],["happyend","jp",3],["E1_shiro42","",3],["覚醒清家","",3],["Rimitofnbr","gb",3],["らいげーむず.","jp",3],["Илюха","ru",3],["havok skxly","es",3],["piece24","jp",3],["Shogunyan","es",3],["delarue","es",3],["綾小路","jp",3],["ショドショド","br",3],["Ryo-chan","jp",3],["ʚれもねɞ","",3],["pixiefnbr","gb",3],["illÿabot","",3],["ごうくん","jp",3],["LinearTray6422","jp",3],["shiikÿ","jp",3],["marszn","kr",3],["sab","it",3],["T3neÿ","jp",3],["Syumapiyo210","jp",3],["quixx häyhä","se",3],["Rxcon Dostoevsky","gb",3],["TakoBeL","jp",3],["demuś","jp",3],["偽キノコ","ua",3],["ゆっくり霊夢よ","",3],["misa_ädragon","eg",3],["ECP","",3],["次こそはやめます","sa",3],["吉良涼介の右腕","",3],["seifnx_","jp",3],["りふれいん","",3],["匿名25-","jp",3],["mikëvski","it",3],["arnausitofnr","es",3],["TOB","jp",3],["fa_fredoxie.","",3],["はる3232","jp",3],["En-Nagi","jp",3],["ねりだっちゃ","jp",3],["VRS","",3],["たくや０７０７","jp",3],["Eiking","",3],["ruis","jp",3],["ʚもこあɞ","jp",3],["Kylian Mbappé","jp",3],["KOLOcologne","us",3],["DistinctBee7247","gb",3],["renkon019","kr",3],["womux","ru",3],["eVoZa Kmrbi","mx",3],["FTW","jp",3],["Astrafv","jp",3],["れなちゃんあのね","",3],["Konpe1","ng",3],["Leviatán","kr",3],["2424na","fr",3],["かなジャイロ","jp",3],["Wallenstein","jp",3],["いまいさあん","jp",3],["〆殺す","jp",3],["CloudYY","",3],["terubou","kr",3],["ハルメット","jp",3],["fabe","mx",3],["LomelyFn_","mx",3],["対面力で舐め回す","au",3],["løAqu_zz","be",3],["TANGO","",3],["Kairi300Hz","jp",3],["tanuchildren.","ca",3],["かすいせい.","jp",3],["rupiafn","jp",3],["Keider120fps","jp",3],["nish4ko_.ay","jp",3],["piengraal","jp",3],["京都のらっきょう","jp",3],["anointed","",3],["riakusii","gb",3],["friesthe13th","us",3],["tontoko","us",3],["always-fanta","sa",3],["みぃキング","kr",3],["w4sp","ar",3],["VILLIAN","",3],["ぼくがキラだ.","pt",3],["赤ちゃんてぃんぽ","gb",3],["なまらめんこい","jp",3],["Treexyz._","ar",3],["こよた視点","gb",3],["熱くなれよ","jp",3],["音ノ瀬らこ","no",3],["RSL","jp",3],["IPF-A","jp",3],["れあジャイロ","jp",3],["fuukun","eg",3],["ClumsyGerbil9822","gb",3],["kokeniwa2","jp",3],["Faded Nikson","ru",3],["Relwz8q","",3],["こんにちは","jp",3],["まひたな","jp",3],["morikun","jp",3],["うんぽだいすき","jp",3],["tuirune","jp",3],["囚人番号667","",3],["jinxvibaemon","jp",3],["mtrx","ca",3],["緋弾のミリア","jp",3],["vinqtryona","ru",3],["Fangon","se",3],["corsairfn","jp",3],["おもち73","jp",3],["Teckfv","",3],["shun_movie","",3],["しゃーくやけん","us",3],["すむさʕᵒᴥᵒʔ","",3],["Ride","jp",3],["binnkusu871","mx",3],["ふらい","jp",3],["ベイクドポテト","jp",3],["ぱぎゃる","kr",3],["Xqhpyer","jp",3],["Lit","jp",3],["i_am_Arumera","",3],["i_am_Rusk409","jp",3],["ざっくだよぉぉん","jp",3],["luxy281","it",3],["MqtteFN","it",3],["鳥いちごっと烏","",3],["むちむちえめち","jp",3],["ぐろかわㅤ","sa",3],["umineko_x","jp",3],["ひろやちぇ","",3],["renren0709","",3],["さかただいあ.","",3],["すぴっきー","jp",3],["marufv","jp",3],["harunon","jp",3],["Fuwahurii","jp",3],["trc","gb",3],["4tran","jp",3],["元祖アカマル肉球","jp",3],["きりん寺","jp",3],["kotekwingu","eg",3],["ゼンマール","jp",3],["yasatuku","jp",3],["Action","jp",3],["しゅん_小吉","us",3],["SR_senn","jp",3],["Sa_Roppun","",3],["yuma_6","",3],["done-bundle14","jp",3],["TIG_tiger10","jp",3],["SR_teitei_res","de",3],["おむおむ食事中","jp",3],["るなちゃんこえだ","jp",3],["yarou","jp",3],["RobustQuelea6549","jp",3],["NŁT","",3],["眠党ジャイロ","jp",3],["さやたなら","jp",3],["Nasho-on-eu","gb",3],["BRAMS","nl",3],["T-K-MAX","",3],["Zenoa","",3],["りょとく","jp",3],["prime-_norubot","jp",3],["Ruto_fn","jp",3],["grind","ru",3],["ころいか","jp",3],["びくとろ","br",3],["kai29","jp",3],["havok swizzÿ281","gb",3],["hayax","jp",3],["IHZATRAGA","",3],["ReadyBench6481","jp",3],["knight","gb",3],["ふさわ特訓中","jp",3],["Sxlø","jp",3],["rimr","eg",3],["n1m0_fn","jp",3],["res_tossyfv","jp",3],["とやぬかは","jp",3],["遙日.","jp",3],["涼太.","gb",3],["Lhucy","jp",3],["ヤバい頭痛が痛い","jp",3],["FamousHyena5090","jp",3],["天野げいた","gb",3],["Ledra","jp",3],["Kosmos","ng",3],["六平千鉱","gb",3],["riqvell","jp",3],["CELEBRATION","sa",3],["ポン酢大好き","jp",3],["FJP","",3],["iwa-118_YouTube","jp",3],["sander knight","jp",3],["LocalWinner7552","jp",3],["RunnerZydie","sa",3],["SigmaDaddyy420","ru",3],["200iq maniczz","jp",3],["戦犯愛好家のつる","",3],["Limit","",3],["Oyashiro","jp",3],["Nemushy","jp",3],["silvente","es",3],["君に明日はこない","jp",3],["FarHeadphone6077","jp",3],["秋ミカン工房","jp",3],["Vicroys n0vafv","be",3],["Vicroys Barzl","jp",3],["RyzxParanoid","kr",3],["ha3zor","es",3],["kite.713","jp",3],["Sagum3","jp",3],["VEXEL clear","",3],["qxtuun","kr",3],["ぽんずは友達","jp",3],["ルシファーの騎士","",3],["Birikeifv","jp",3],["まいのるやで","fr",3],["えいなの","jp",3],["L1p","ru",3],["ぶりそん.","",3],["らずの弟子ｆｖ","jp",3],["ln4sq","jp",3],["zeebyache","br",3],["Lunkanbre","se",3],["akarenren.","ua",3],["DelightedArm8735","jp",3],["FA_clock.","jp",3],["havok pixie","jp",3],["specter wagers","gb",3],["doradorachan13","",3],["れんこんやんけ","",3],["MrLërüy","jp",3],["MrGo9se","ch",3],["Lightning","jp",3],["kuma-v-","",3],["kyuityanpon417","jp",3],["TypicalElk6421","jp",3],["void-is-back","be",3],["Ra6x.","jp",3],["peger3k.","es",3],["saxonkbm","",3],["1up","us",3],["VXR_K0uda","kr",3],["パワフル歯磨き粉","jp",3],["sakana_yufasan","",3],["皇帝ペンギン２号","jp",3],["temareyli1","mx",3],["fansy","by",3],["せんりつちび","jp",3],["taiekioa","",3],["のずく2","jp",3],["VioletGoose9697","jp",3],["よう6","",3],["BW_Sepia","",3],["asknowl","",3],["datumidatu","se",3],["STR","nl",3],["senji","us",3],["SkilledMole9878","",3],["Hikacha3","jp",3],["axl","jp",3],["PlayboiArbuZz67","",3],["ほんまやぬ","ru",3],["ちきん","",3],["ゴットユーガ","",3],["KANATy","pt",3],["onewayticket","kr",3],["2017x_.","",3],["sootybread3","jp",3],["ほくっぴやんけ","",3],["SPYLE mimihi","jp",3],["MuffetUT","jp",3],["Linnet.","dk",3],["Mark86","dk",3],["huqnxy","jp",3],["shizuA","jp",3],["moonttey","jp",3],["くらっちまぁさん","jp",3],["CluchKing-_-Lucy","jp",3],["ではありません","jp",3],["めめたらちゃん","jp",3],["北海道産いもぼー","jp",3],["最強なもやし先輩","jp",3],["でーもんさいた","jp",3],["Marirus","jp",3],["ちいかわワニ軍団","jp",3],["あすたは陽キャ","jp",3],["soradayo","jp",3],["NYLIS","",3],["MushyReptile1838","ua",3],["yuunosuk3456","",3],["Nekomugi1234","",3],["makaron","",3],["prof10el","es",3],["PajiiGOTY","by",3],["Reas","jp",3],["HAYDENBUCA","",3],["shxgui","",3],["Malaya Peterbot","jp",3],["puls","",3],["Mosari","ua",3],["dyd","jp",3],["sfefnr","jp",3],["Belly","jp",3],["shark7","kr",3],["Roger","",3],["agent","fr",3],["클러치의신","jp",3],["hanuke_0821","",3],["氷を愛す","jp",3],["RattyNarwhal2857","gb",3],["えあーむ","jp",3],["ʚ愛の標識ɞ","",3],["Mizukana_ch","jp",3],["GreyGuanaco9099","jp",3],["るいこうるいこう","",3],["さえだよん","de",3],["ぷーある","jp",3],["shunta1220","",3],["ㅤえぬㅤ","",3],["padkirari","jp",3],["Azera 3l1fn","jp",3],["deto_01","it",3],["おこひ","",3],["Hylxfv","jp",3],["uchanbot","jp",3],["ねっこはぬっこ","jp",3],["シキングの弟","jp",3],["Tapioka_toxic","jp",3],["Valibuca","gb",3],["SKYZ","",3],["バタンバチ","jp",3],["リーク1120","",3],["RItual4x","",3],["beppsy","it",3],["Bein","",3],["こうか","",3],["Mukkunfv","jp",3],["اخطبوطム","",3],["coach Retx43","sa",3],["Bechin.","jp",3],["対面最弱のねきゃ","jp",3],["めーなさん","ru",3],["でーもんみずき","jp",3],["リザイア強い","jp",3],["Ritual","ar",3],["Dunu","",3],["poteto256","",3],["Lokit3eny","",3],["一般人びりけん","jp",3],["4そうめん","jp",3],["secret keeperG","jp",3],["ariusu","jp",3],["Riru_fv","ng",3],["sheesh frnxz","ru",3],["0rtKvanit70","au",3],["kairfnz74","kr",3],["nopzy","kr",3],["RVL","jp",3],["vrozify","ca",3],["vital","us",3],["sota16","jp",3],["clutch","jp",3],["AMARAR","jp",3],["Castorice1","",3],["いっち118","jp",3],["きょうた0708","jp",3],["ethan_s2010","",3],["Rakire","it",3],["tenshi","pl",3],["yarinRequiem","",3],["plaque_Ringo","",3],["strait_plaque82","jp",3],["たいはるブラック","jp",3],["pengu1n","",3],["lime","jp",3],["るあ障害","",3],["Xiaodan47twitch","",3],["Desire","tr",3],["Your","jp",3],["すてぃっきーげい","jp",3],["Malem1x","no",3],["Resover","",3],["ʚばうɞ","jp",3],["OrderandWatcher","jp",3],["brawly7","mx",3],["Slick","mx",3],["falcon","ng",3],["MorachasoFN","",3],["生ベーコン.","jp",3],["にこ丸6-25","jp",3],["Ninolamejorqunti","mx",3],["薫る花は凛と咲く","jp",3],["fatcat","ca",3],["noesisbtw","",3],["Fruzel Cardeneia","",3],["yuna","",3],["merstaach123","ru",3],["Qertzo","",3],["메리아ӝ","ca",3],["GFORTIK","ru",3],["deluz","ru",3],["スライムだーよ","jp",3],["L.A.M.A.N.O_.1.9","fr",3],["Skinti_wean","fr",3],["ゆーた0423","",3],["MheetFN","",3],["ecti23","",3],["woeaqqx","be",3],["piki1.","ru",3],["KiwiFishy","mx",3],["CASHONDIS","mx",3],["netz","ar",3],["raf1ktryona","ru",3],["Ramuniku-jp","",3],["うちの苦兄弟","jp",3],["S1Ry","jp",3],["Only","",3],["ばしばしひかる","jp",3],["NEYO","jp",3],["ぽにゃさい","jp",3],["REGEER","nl",3],["th0mza","nl",3],["lef.lef","no",3],["もぐもぐはるはる","us",3],["芽吹の唄","",3],["dolphin","",3],["MattFortniteDad","au",3],["agent neytiri","au",3],["shark","jp",3],["kurea","",3],["hyper","",3],["Makavelifv","",3],["obonkor","jp",3],["まだ負けないめび","jp",3],["xp42","jp",3],["cypro","de",3],["NEXUS_teddy.","",3],["ちるごっと","jp",3],["mercer","us",3],["TikTokBreezybran","us",3],["PRINSIE141","",3],["x69Ertanel","",3],["Ciaraadolphs","",3],["Aemeath","jp",3],["Loberia","jp",3],["Kamil Kovalenko","pl",3],["Xyro","pl",3],["twxvz","jp",3],["HadronJr","sa",3],["Colofi","au",3],["NXT-_-KABIBKA-_-","au",3],["地ならしの黒幕","jp",3],["バトルいぐり","",3],["水さん0546","",3],["11Venomus","ru",3],["KEMAN","us",3],["eli","fr",3],["kuromu","jp",3],["elx7vlet","jp",3],["れおくん레오-","",3],["cos_simon","fr",3],["ThonySSJ2","fr",3],["あいすとかつどん","nz",3],["Mrnadash28","ru",3],["Флейд","ru",3],["lapeacefv","pt",3],["Reydox","fr",3],["亀太郎乃介","jp",3],["kumona","jp",3],["franpijoenpinao","es",3],["極太むさし","gb",3],["noda","jp",3]],"ME":[["Reymoro9x","sa",2],["MLRd3strozaa1x","de",2],["u2n4","sa",2],["Speed","",2],["ᴠɪᴘᴇʀ","jp",2],["Soro","sa",2],["f1x1k","eg",2],["brandoxiehdfn","gb",2],["Tropycal","es",2],["Unit","",2],["shrader","fr",2],["nekovsky","fr",2],["Møstafa-77","eg",2],["myassin-77","eg",2],["fero","",2],["Kia_Elv","eg",2],["Kemba Sutherland","ua",2],["Bolt","sa",2],["5050F16","sa",2],["rafan yeager","gb",2],["FW3XY","ar",2],["Scroll","es",2],["Nana_FNBR","us",2],["HeNzY","us",2],["salesxz","de",2],["cardoso preto","pt",2],["Ｔ１ＴＡＮ","ua",2],["doctor","",2],["ascend d4nil","de",2],["m4kew","de",2],["torta","se",2],["الكشميري","",2],["CRVSTAN","ar",2],["Alfori4e","",2],["dorey","",2],["N1TRO","",2],["sinreyli","ch",2],["MLHM","",2],["papo","sa",2],["Polat","sa",2],["Abu3tp7","sa",2],["of3kk","fr",2],["Prime Equinox","ru",2],["JAMON24","es",2],["Yop3","es",2],["Munoz","es",2],["snakez51","es",2],["voltix","sa",2],["zBertok1ng","br",2],["alwhede","",2],["SPARKY","sa",2],["perezinho7","es",2],["ELITE MIGHTY.","sa",2],["PmYb-","sa",2],["nms3k","",2],["xauusd","de",2],["Yrox7.","it",2],["Jolly19_","it",2],["HAZARD","sa",2],["ZORITO","",2],["Joker","gb",2],["MARK","sa",2],["Yuki","",2],["FARES","",2],["7mdn","",2],["abdullą3k","sa",2],["Kayo","sa",2],["allureGOTY","ru",2],["kaito","sa",2],["Arztryona","es",2],["beatz","de",2],["Felixgaming1919","ng",2],["Brfx","sa",2],["Rios","",2],["ñengo","es",2],["washed scarface","ca",2],["rotty","se",2],["DOYLE","se",2],["Hummusfv","jp",2],["QuInnNADA","",2],["Xnofast","fr",2],["HaiderGOTY","sa",2],["xL2R2","sa",2],["Клык","kr",2],["S8.R","ru",2],["fei","kr",2],["NoAnxiety","pt",2],["chlebo27","is",2],["matador","us",2],["sambo.exe","es",2],["HavoK Grizi","es",2],["Accretionbg","ru",2],["WiLLER","eg",2],["ZETA","",2],["HMNI","sa",2],["Eng","sa",2],["osto","ru",2],["AURA","es",2],["xA7mdy","",2],["tax1x","ar",2],["getlek","",2],["Demer Lothbrok","pt",2],["DanielSON2025","gb",2],["dolphine","",2],["SnopyNEW","gb",2],["comeback donotbr","es",2],["Dvr","sa",2],["7.s.","",2],["OBRIGADO DADDOX","it",2],["glouwi","by",2],["AzulaY","dk",2],["FIEX116","",2],["doomi","",2],["ayoondagoon","",2],["reyifnbr_","es",2],["B7R","gb",2],["Sight","ru",2],["7sn","sa",2],["LastDanceAriel1x","",2],["A7med.","eg",2],["OMAR.","es",2],["ShakerMcPuff","jp",2],["zaid","gb",2],["A7mad.92","",2],["ICEMAN SELOZ","sa",2],["RVL","eg",2],["verxy rodrigo","ng",2],["JUS","sa",2],["Hadiwingu","",2],["XBwingu","sa",2],["kxyzefvv","es",2],["Dv_JoseeFNBR-_-","es",2],["muscular atrophy","",2],["nlxfvv","",2],["Paincula","ar",2],["Suhail1x","gb",2],["Cristianlopez19","gb",2],["Saw","sa",2],["lxmpGOTY","ar",2],["TheFarisa","sa",2],["roei","ca",2],["NEFSO","sa",2],["oly","br",2],["EstaR Suhaib","",2],["r1ome","sa",2],["ahha931","",2],["fightwar","",2],["Cande Shigaraki.","br",2],["auguetinho","jp",2],["Kenshi","sa",2],["Bneiixeyy","sa",2],["Karamfv","sa",2],["Malikfv","",2],["insta x3taibii","sa",2],["Dozz","sa",2],["Risee","de",2],["benji","",2],["Tsla","fr",2],["na0r","",2],["BIg","",2],["al3ezz1x","",2],["N7SREET","sa",2],["AGENT SEIF.","",2],["SolyCreates","eg",2],["SpeedyHXRK","",2],["nahiyantryona","es",2],["20nprix","uy",2],["Salem","pt",2],["Iclxn","sa",2],["RHJ","be",2],["n7r","ar",2],["Bond2","eg",2],["Melo","br",2],["Arnold","ru",2],["Pixietillo33","sa",2],["Twich-juanmaa016","es",2],["Kcsfv","de",2],["ckenNugget","",2],["Zenin","ru",2],["Kory","mx",2],["shabfn_","",2],["18Q8","",2],["ovler404","de",2],["Hasoon","",2],["6suh","sa",2],["Adam","gb",2],["كريسي","sa",2],["iRakanlol","sa",2],["OXIDO201","es",2],["Retrikx","es",2],["zMou7x","es",2],["K3yys","gb",2],["Noirr","de",2],["Edwardwingu","de",2],["SeLoxrk.","es",2],["Triple Consoleyy","eg",2],["Xavzy","es",2],["abood","",2],["t_vr","sa",2],["STRYDER","",2],["broskiwyd1","be",2],["reyÿaling","sa",2],["drilo13k","es",2],["zetareaper","es",2],["Błack Swordsman.","fr",2],["Drags","",2],["Yahia","eg",2],["Youssuf","eg",2],["IFASZ","sa",2],["abu","ar",2],["BarshF","de",2],["Greek","",2],["Mir","ng",2],["yohurt","sa",2],["Agent cactusrage","sa",2],["Sweatyplaywr135","sa",2],["bynatiix_","eg",2],["FOMO","es",2],["Jenfoor","sa",2],["linxÿ","kr",2],["Firedlol","",2],["desables roses","",2],["DashiiX-_","us",2],["Bravedyy","sa",2],["Abadi","sa",2],["黑色的","ca",2],["Démonbot","pt",2],["F911","sa",2],["Sarhoşey","tr",2],["solo","es",2],["Jumppezb","",2],["NipsuFVv","de",2],["Tripz","",2],["Fierce","sa",2],["Wasay","tr",2],["Ler","fr",2],["FLX1X","fr",2],["byarnau99FN","es",2],["Kkyze.","es",2],["finessed","",2],["patrick morrisey","gb",2],["ivory phbanandre","it",2],["Minty_Meow","",2],["mtktkt","es",2],["vanillaa simple","",2],["Hero3k.","sa",2],["Scarface","es",2],["Kahlout","",2],["Crimson","sa",2],["zxxiix","",2],["prime swizi7","",2],["7Ido7","",2],["DSTRƵ","sa",2],["CrownBurger","pt",2],["Spite","sa",2],["garjoukk","es",2],["3amory","",2],["Hrxis","de",2],["Drago_fn_","it",2],["ULISSE FaStrage","gb",2],["HK_to-kun","jp",2],["午後のジョンジー","jp",2],["frey0324385","sa",2],["Dxzy","gb",2],["محمد","",2],["Tonireet","",2],["GOTeaY","us",2],["plake","",2],["xrk","gb",2],["Sot","gb",2],["Reina","kr",2],["Abdullah","gb",2],["vnrs","sa",2],["Lokal","",2],["Asharbot","tr",2],["Doksha Tweaks305","",2],["NahjX","",2],["EpikRsm","sa",2],["bmo.aim","jp",2],["mikey","kr",2],["batman harris","",2],["ghxrm","",2],["Anoos","",2],["Alhitmifv","sa",2],["flamik","tr",2],["Trenfv","us",2],["Yousefcold","jp",2],["dhaim3K","sa",2],["Mallah3k","sa",2],["GOAT","sa",2],["w7sh","sa",2],["chaos","kr",2],["Rynqzy","",2],["Adeeb","sa",2],["NBK","",2],["1up","",2],["NVP","pt",2],["SAE","sa",2],["MolanaMontainJEW","",2],["Fearless","gb",2],["ILAYGOTY","ar",2],["xXpandacoolXx","ar",2],["ibra","",2],["AbuALNe9","sa",2],["SoPuma","us",2],["0FRED5","de",2],["cuteimmocatboy","ar",2],["nahniels","pt",2],["Kabra Morgan","sa",2],["Reckzy","",2],["3wislinx","pt",2],["GNiell","es",2],["chachijr sahur","es",2],["Raed","sa",2],["Dizzy","sa",2],["hvk","sa",2],["FFA","sa",2],["vortex","sa",2],["Micha","it",2],["rezon","ru",3],["Sarusi1X","dk",3],["iM7x_","sa",3],["shade","de",3],["Vookz205","de",3],["Bumk","sa",3],["Professor","sa",3],["bloski","es",3],["Chillplayer","jp",3],["MLBfn7","jp",3],["Tinky Winkyfnbr","",3],["fetian77x","ng",3],["LoversRocks.","ng",3],["7liwliw","kr",3],["mene","es",3],["fv.saint","kr",3],["iMalik88","",3],["prime 7asant","sa",3],["AyanKōji","sa",3],["Fahad Abrar","tr",3],["fabié22","it",3],["99制","sa",3],["푸루푸루씨각성","jp",3],["missav","kr",3],["kyrie","pt",3],["Jordano Chabo","de",3],["Tasty","de",3],["CAM","se",3],["flipmode","by",3],["Giggle Monsterr","ch",3],["Gianluca Pomodor","es",3],["KrayVoryy","gb",3],["Pelaio.","pt",3],["larry","es",3],["ewanuk","gb",3],["HAHAHA Karoy","gb",3],["Kirito","fr",3],["ZENISTU","fr",3],["Ryxy","sa",3],["SYNERTIO225","fr",3],["Snipes","gb",3],["blanziage.","it",3],["VTX_ZYCAI","",3],["Jesin_","",3],["Loucas1409","fr",3],["AlphaXx","fr",3],["FixedPigeon7368","",3],["Winning","",3],["lxuxÿ","de",3],["Gitano vacilon.","es",3],["egoist sleepy","",3],["bvd","pt",3],["Munnies","de",3],["LMS1024","",3],["calce","es",3],["Atlas Soliis","ng",3],["nilzyfn","es",3],["Xpaabloo_","es",3],["ellything","kr",3],["mxyy","",3],["Benfoo","",3],["PRIME DxyLight","ar",3],["beN","fr",3],["Philipst","ar",3],["vino","kr",3],["Head_Reaper00","",3],["dxrki.","it",3],["lolloraga","it",3],["Nwx","sa",3],["donald","de",3],["Kanki","sa",3],["prince","de",3],["cozalot","de",3],["Anaskii-","sa",3],["Even","sa",3],["estatheeazy","gb",3],["yuqii muichiro","it",3],["iAzozti","sa",3],["abod838","sa",3],["always","jp",3],["TPIZ","",3],["ObitoUchihaXxx","gb",3],["ROYL","sa",3],["Grnta","sa",3],["Khalid","sa",3],["殺手大師","",3],["Ivory sweaz","us",3],["ZAYAN","",3],["mooki","",3],["Ritual","ar",3],["Vodix","de",3],["PUNISHER","es",3],["Elite Chris","es",3],["ryz3r","dk",3],["M1stfv","sa",3],["buga_x","",3],["Motaaljr_","eg",3],["sorry","fr",3],["SHXRKŸ","",3],["みずるん.","ua",3],["vizz","sa",3],["Áhmed","sa",3],["V3rtfv","",3],["Mcacon","it",3],["thomäsGOTY","it",3],["Dan1el","es",3],["izzanx","es",3],["cucaracha","es",3],["nyz","es",3],["Janice","",3],["GXR","",3],["maacroo.","",3],["Soyuz","es",3],["gussy","sa",3],["Argy","sa",3],["blonded","eg",3],["Merstach","lv",3],["bugaz","sa",3],["scuba","gb",3],["falcon rohanbot","",3],["Mastered","us",3],["Sf-Qo","sa",3],["woxt","sa",3],["BaconSavage07","fr",3],["WOLF_PACK_BOI","ng",3],["posti prime","it",3],["Pelle","it",3],["ÄDOMÿ","",3],["EUR","",3],["Timazuna","de",3],["s1mply","de",3],["DitRo","",3],["killua","sa",3],["wh1tesh","",3],["Karve","kr",3],["Beka7","",3],["Kalbaz7","eg",3],["PabloLuckz","jp",3],["qualyz.","",3],["alroy","pt",3],["Babagha","",3],["Qyrox.67","us",3],["NEMERALQBI","sa",3],["Melon capara","",3],["shara kamron","pt",3],["voltaicc","eg",3],["fifthyoussef","no",3],["derre","se",3],["znn","se",3],["GHOST","kr",3],["Abu7rb25","sa",3],["Slash LaPulga","eg",3],["MagnetoSOUP","eg",3],["Disswade","pt",3],["Salted","",3],["Kaizo","gb",3],["Void","eg",3],["Envy","no",3],["layku","au",3],["Hipsy Dipsy","eg",3],["Esaam","sa",3],["abrafcoraga","",3],["arxytryona","it",3],["MykeViBritannia","it",3],["Da_Pero","",3],["人ꪶꪮꪀꫀㅤヤ","sa",3],["21_unknown","",3],["21_BATMAN","",3],["medo","sa",3],["RuXeZ","ar",3],["TomTom","no",3],["NITROGOONER","",3],["Nitro Simba","",3],["Astro._s","",3],["Mxtte","",3],["ch0py","lv",3],["Reyzer","de",3],["luixyy","de",3],["teeqzy","eg",3],["meyzy","dk",3],["shmuel","gb",3],["StickyTip911","de",3],["ichigo76kurosaki","",3],["knJi","nl",3],["x5hy","",3],["biggestfelloff","de",3],["somafps1","jp",3],["Gnx","",3],["65ue","",3],["insta","sa",3],["Clovr","sa",3],["wkyysShter21k","es",3],["Mask","es",3],["Omkarx14","",3],["Pinkubot","pt",3],["vyc","eg",3],["olise","",3],["f4lcon mtraps","gb",3],["ROC","sa",3],["CRYSTAL14","it",3],["Flame Andre","it",3],["bocmaN","de",3],["vatePlease.","",3],["Coach","fr",3],["blxm.fv","fr",3],["00Mr.Gabbana","it",3],["FXDN","",3],["Rino","",3],["3bood","sa",3],["704-ALK","",3],["qez","tr",3],["AUR","tr",3],["avoxy.aim","",3],["nilky","",3],["stroke","",3],["littlekingkalil","",3],["brendan","se",3],["Arshaan296","",3],["cozt","",3],["Untitled79","",3],["Lsantos36","pt",3],["fonsecaro_da","pt",3],["Blackwulph","de",3],["Ghuman","tr",3],["dennyvar","",3],["b6njo","us",3],["Exoidd","gb",3],["sidhudaaruwaala","",3],["Wizullah","",3],["victorVX7","sa",3],["treyhszZzero0o","jp",3],["iceyvns","us",3],["bios","ua",3],["dxviȲ","is",3],["3xmer","sa",3],["jona033.","de",3],["egereyli","jp",3],["kenbot","de",3],["Vzytheoptimist","au",3],["marquitosrc_14","es",3],["Small","es",3],["jinjeddah1","sa",3],["Orynex","sa",3],["Foz1019","es",3],["Kraken","es",3],["Mightyibrahim","sa",3],["shugø","es",3],["Yusef","eg",3],["Ij7","sa",3],["mocny_czynsz","pl",3],["waChu440","",3],["king","is",3],["wish","gb",3],["Noah","pt",3],["ryzox","fr",3],["m8game","fr",3],["KEO6_-","fr",3],["Capdouk","es",3],["Zoldyck","es",3],["ALARYANÌ4x","sa",3],["ZAYED","",3],["Dr.Shanawer","",3],["LoganF99","is",3],["suheilskii.","ca",3],["lfd","pt",3],["Vaint","",3],["rayan","",3],["agencyplayz","sa",3],["lurikeen ranni","",3],["safetÿ","mx",3],["noizemc1337","es",3],["targaryen","",3],["Dark","br",3],["Y4Zainab","",3],["Z4Yeno","",3],["gahara","ar",3],["Vynz","es",3],["deeivv","fr",3],["xelaa","es",3],["Alshamsi","",3],["real","ca",3],["Kaido","us",3],["sofiix","fr",3],["Moxo","kr",3],["arunke","de",3],["VOIDZxVxS.","pl",3],["SAW_HASHIR","",3],["Kingșlayêr","sa",3],["Ciacialand","fr",3],["kiira100earnyhyh","gb",3],["Ftninju","fr",3],["Bilbon88","fr",3],["JAVIFN","es",3],["Qu1iet","cz",3],["harmony shveps","ru",3],["AgentZesty","se",3],["falcon_zoombyq8","sa",3],["NXRSHAW","es",3],["200IQnext_Savage","es",3],["Eriksen2356","es",3],["TornaRulii","es",3],["AGENT","",3],["Yazan-1st","eg",3],["Batman Saint","de",3],["Niek_im7","nl",3],["Artski","lv",3],["Kempinew.","nl",3],["nojuxas","ca",3],["Inno2x","gb",3],["Hillzy","gb",3],["athix009","",3],["DLH_FV","fr",3],["aymane","",3],["BlackHand","es",3],["Lagsonfnz","gb",3],["primed walus","pl",3],["falcon","sa",3],["notdaalito","sa",3],["Kappo Scofield","es",3],["dictator golkot","",3],["ziyad","gb",3],["74lk","sa",3],["mchs","es",3],["guerreroo","es",3],["Berfin","jp",3],["falop1xbtw","gb",3],["LIAD5587","",3],["ascend sweaty","de",3],["joproo.","de",3],["raz","fr",3],["itay13hasid","ar",3],["ivanrasahur","es",3],["islembkhzr","",3],["FiskYhyh","fr",3],["timko","jp",3],["PARON RyoIT","us",3],["prime kingvon67","us",3],["Dheyaa2005","",3],["PRIME","fr",3],["Faze_Nylix","fr",3],["VIXGOTY","tr",3],["LastDance_Apollo","gb",3],["ntrex2","sa",3],["h2sn","eg",3],["Bsam3K","sa",3],["Moath.","",3],["little","fr",3],["X2-Tour daiglun","fr",3],["sapooiclapedyou","lv",3],["Clexsito.","es",3],["Falcon Jannie","us",3],["falco","kr",3],["rui","kr",3],["gyutaro","kr",3],["a7mdd","",3],["KHAMIS","sa",3],["ApollxFNBR","fr",3],["Mayood","",3],["Moh5321","",3],["Orca","ru",3],["Virex","",3],["FeaR","",3],["MythicIQ","",3],["EmptyV2","eg",3],["Brave Kaidnada","gb",3],["Deano","tr",3],["HeizHD","it",3],["Teyko.","br",3],["kkd","lv",3],["KUNO","gb",3],["Jaloos","de",3],["Detect JulesAy","de",3],["SY1F","fr",3],["REXSKll","fr",3],["mannequien-","us",3],["x9inegod","no",3],["gyupfnbr","kr",3],["Falcon Ramobot","de",3],["detect","be",3],["Tranka","es",3],["Pishoto","gb",3],["momreyli","ar",3],["absolute","",3],["John","",3],["Roger","fr",3],["Lenox","",3],["oncatimex6","es",3],["taixx","lv",3],["ErenDiren42","",3],["Maksyy","",3],["3omar","",3],["z22","sa",3],["Clapperxlorenzo","",3],["KAVLIARHS","",3],["ʟɪɢʜᴛ","ua",3],["ɴꜰʀ","",3],["uhq8x","ng",3],["MylynFN","pl",3],["eilson","",3],["Meliod10","sa",3],["TNT","sa",3],["SnowDani.","es",3],["Yonexer","es",3],["prime_Shechter","",3],["Chloe Sulivan","ca",3],["لوزكس","ar",3],["MHADI","ar",3],["twis","sa",3],["Yen","eg",3],["Serry1x","eg",3],["INTREX","eg",3],["4ever axeeh","by",3],["pepon2kk","",3],["Kyyruxfn","es",3],["InTrix","",3],["elperillas.","es",3],["asoguh","",3],["ArmanAfg","nl",3],["Snickereater3","dk",3],["flosza","it",3],["wrath","gb",3],["moey-ya-beast","au",3],["Jimbob","au",3],["lateef","",3],["Lorex","",3],["LaPeilledu69","fr",3],["LWX","sa",3],["YAlex223","es",3],["Färed","eg",3],["Omaar","eg",3],["TTVQueenOfBot5","gb",3],["Axinnss","de",3],["Oblos","",3],["Agent MaazBot","",3],["Vanta","fr",3],["ibrahem_3abood","sa",3],["adil.q8","sa",3],["prophet RobNski","se",3],["greek-freak","ng",3],["sburro","co",3],["ight","ar",3],["edus","pt",3],["al-BokuhouudBB","sa",3],["SalaminoP3nguino","de",3],["x966","br",3],["YASSIN","eg",3],["Xjoel51","es",3],["Atlantic patrick","es",3],["Atlantic Sponge","",3],["Hype","",3],["ExcitingOrca5127","",3],["Killafv","kr",3],["shayan","",3],["Aar1zV2","",3],["bxxha","kr",3],["nikxz","co",3],["IceKing Ivanoide","es",3],["Almighty","no",3],["STRIKE","",3],["8_rss","",3],["j3sus rikow","de",3],["syvnfnz","es",3],["arctys","de",3],["Markus","de",3],["difizinGOTY","jp",3],["CRYPT","pt",3],["G77-.","gb",3],["Sakura Kloyz","es",3],["kvara x4swer","it",3],["Bóbr","de",3],["nerowwx","ca",3],["RyZze","fr",3],["sant1pt","pt",3],["Batmans Bugha","pt",3],["Conrod","",3],["ceejay","",3],["Juchio","fr",3],["Pera.","",3],["Vilixe","fr",3],["Blitz","ua",3],["Kishi","it",3],["LGS.ittsmathis","fr",3],["FLOZKS","sa",3],["Malook","sa",3],["Z3KROFN","pt",3],["Faze_lcs90","",3],["NMK","sa",3],["alsamahi","gb",3],["Mohamed","us",3],["Cillo","us",3],["RS3","gb",3],["XINGPT","fr",3],["draxy FN436","no",3],["Syton","",3],["BenGGBRO","nz",3],["omerezra2005","",3],["yhyh","ar",3],["FlexyRageVaks","",3],["antles","gb",3],["unknown","pl",3],["CarliyoErNervio","by",3],["PRIME booder","",3],["47Q8","",3],["Barrak05","",3],["woyex7","de",3],["synox7","de",3],["FISHY","",3],["cjojokadi","fr",3],["Game.of.stones","fr",3],["orxvex","ar",3],["MRW_LUYMOK","ar",3],["washed flyckzy","it",3],["zBega","it",3],["krayz slixlaix","se",3],["lxtherr","es",3],["valtz","jp",3],["lyost.crew","kr",3],["oslo","fr",3],["Witt0y","",3],["Mddix","kr",3],["FluXi","eg",3],["2AM","eg",3],["FedeHD","it",3],["Chrisky","pt",3],["ValeCP","it",3],["порядку","au",3],["BaBaYaJa7","it",3],["josaify","",3],["FastFlick0","",3],["ronaldoswag","se",3],["Ramprr.","gb",3],["GoNext Lankia7x","fr",3],["Elite","fr",3],["元祖アカマル肉球","jp",3],["NyrOx11","fr",3],["Golden -Nono","fr",3],["gugafv","pt",3],["aponbadi99","pt",3],["ᵈᶤʳᶤᶠメ","es",3],["mnd","es",3],["Pab7.","es",3],["timur_topchik_1","ua",3],["BoldNail1483","",3],["M8-RUBIN","",3],["TheBigYahu","ar",3],["TheLilYahu","ar",3],["ZolOFNBR_","es",3],["gabhru13","",3],["MheetFN","",3],["kelke","es",3],["mavere1k","es",3],["ahn","gb",3],["noahreyli","gb",3],["Benzy","",3],["10-ki","",3],["Dexfight1","us",3],["Fyrox","fr",3],["alxqwa","fr",3],["gxskoö","ch",3],["antekhibob","pt",3],["ihatebober","pl",3],["yeez1q.","no",3],["teoleolupab89","",3],["lokuuraN","es",3],["mohammed246nas","",3],["Nolimit","eg",3],["3t8tx","",3],["babysofian","es",3],["Claped_haytam","br",3],["Notxaw.","",3],["xLevr.","",3],["S3UD","sa",3],["مساعد","sa",3],["GiovAnt12","it",3],["PRIME rib3lle","it",3],["bortex","it",3],["Campurriana.","es",3],["SHISHAS","es",3],["IV-N.","es",3],["Magik MrConiic","",3],["Yayoslick","",3],["Sosa_moans-Donny","",3],["FaZe_Eliya","eg",3],["EitanCa1","jp",3],["Nathzz.","fr",3],["letriangle67","se",3],["ch7ko","kr",3],["OO12.","jp",3],["flash67","kr",3],["Pierożekk","pl",3],["Duduś","jp",3],["W.xg76","",3],["falcon sharx","ar",3],["00Mr_AbrahamGoat","es",3],["achiri calvo","es",3],["Crispro82839j","",3],["10pointsofyelsha","",3],["stxf","ng",3],["Washed Ceezy","",3],["Falcon Fraxy","",3],["つきかげなんよね","jp",3],["vnedr","fr",3],["Alvarolr366","",3],["M5LL12","sa",3],["Alghoul","no",3],["toxic","sa",3],["ALEIXITUZ","es",3],["roboranacr7","es",3],["forroncio5","es",3],["Fr1gx","",3],["Tifko","eg",3],["ぜろむの弟","jp",3],["captainRex501vst","de",3],["UNC_ANTHO","de",3],["aightÿ","kr",3],["Quettzy","es",3],["Vanza","jp",3],["Vairox","kr",3],["Lukero101","lv",3],["Blacktegg","de",3],["hvk_stricker","eg",3],["Selim","fr",3],["BachirDaGamer395","gb",3],["Hed2010","es",3],["Pollicojc2010","es",3],["Rubi","dk",3],["Suchy kaktus","",3],["Ninox-lokito","it",3],["Tonio212022","it",3],["Casper Griffin","es",3],["Ra6x.","jp",3],["peger3k.","es",3],["adricancellino","it",3],["redzfnr","de",3],["aight","de",3],["kodekGOTY","de",3],["automatovic","gb",3],["avarrfv","",3],["twtrmauriceaufv","fr",3],["pollo","es",3],["ENC","it",3],["CLouDy","",3],["موجود","nl",3],["YEEZYBAB","es",3],["PUMPKIN klindox","lv",3],["zammÿ","de",3],["Broski","no",3],["anywway.","gb",3],["piece.","cz",3],["5aaldbot","gb",3],["r7mr.","gb",3],["seaport","ca",3],["TreeBee","au",3],["kaiba","ar",3],["Alvino_FN","se",3],["les_daltons-sold","fr",3],["LYSCOUILLE","fr",3],["Nab","mx",3],["NORDIN271","",3],["Pluto","nz",3],["DAMON SALVATOORE","sa",3],["itslunargg","be",3],["Reptain0311","de",3],["パチンコやめます","jp",3],["Prtix","jp",3],["Rippel","",3],["jewish yogiGX","fr",3],["Mansoorfv","",3],["IBH","gb",3],["Cool","au",3],["Zetagoty0","it",3],["SX1LYX7G0TY","ua",3],["NicoGOTY","de",3],["BUNKER","de",3],["الفريدو","eg",3],["tiyoka","kr",3],["Plsnxx","",3],["mxnuu","it",3],["V3MX","es",3],["Valor","",3],["のぐにき","jp",3],["LiMiT STRiKER","jp",3],["clapzFN","sa",3],["swiftbot","",3],["Aurora shxrk","es",3],["Frostiss","lv",3],["traputis","de",3],["MaYeS-","fr",3],["Starboy MaxNada","sa",3],["EDU_PRO_GAME_","br",3],["Darimart","es",3],["Hamburguesas","es",3],["helameash","gb",3],["WonkeeLucks","ca",3],["UnT","no",3],["Singe.","fr",3],["oargju","",3],["yageledri1","",3],["WilHarvestUrSoul","",3],["CrackedRush","",3],["Rg4_Mitsuya-ZB","",3],["SAAD","kr",3],["SoySuggar.","kr",3],["Pika","",3],["mxmocertycfv07X","ca",3],["VolixerrGOTY","it",3],["مهند515","sa",3],["Ay-zo_","fr",3],["Majd","eg",3],["nasir","sa",3],["968suntob","gb",3],["clapxx6","lv",3],["CODE","fr",3],["sergioperez","es",3]],"OCE":[["Wharfers","au",2],["cozmofnt","au",2],["oskiuk","gb",2],["rmxnau","au",2],["Solvik.","jp",2],["swxftyy","nz",2],["coast","au",2],["Meytrah","nl",2],["warpedfnt","nz",2],["Stawbawey","nz",2],["AUR","",2],["noodske","au",2],["baked primed","au",2],["MxngoFv","au",2],["Chrome Blikkyc","nz",2],["Swavynada","sa",2],["ander lucifer","au",2],["Flashy Brilliant","nz",2],["Dynasty","",2],["Higgs Junior","us",2],["Jrjigs","au",2],["Loyal Coozy","au",2],["Loyal","au",2],["textbook","ca",2],["DoctorAyKay","au",2],["pxr","gb",2],["ziggy","nz",2],["captaingreatly","nl",2],["Unkwn.","nz",2],["Volts","be",2],["Kayo","pl",2],["Arctic","ie",2],["boyce","au",2],["zeke","nz",2],["bizza","it",2],["Cheesyboi","be",2],["Peyserfn","au",2],["nextlevel Trunks","fr",2],["Evans","fr",2],["kefebollo22","mx",2],["melobot","mx",2],["crea","au",2],["Kuri","",2],["ethanfnt","",2],["Wizz","au",2],["shmay.","au",2],["Flexfv","gb",2],["Fibre","au",2],["Kayzezx","au",2],["Masterfv","gb",2],["falcon aiden","au",2],["noxys","",2],["stiff","au",2],["pompy","au",2],["j0xsem1","mx",2],["chayzzerfnt","au",2],["Haidxw","sa",2],["DeadDestroyer86","au",2],["sonder","au",2],["Lunareth","au",2],["stax","au",2],["RelevanceFN","gb",2],["ElephantsFN","",2],["falcon","au",2],["haps","br",2],["Lemon","",2],["DayZes","fr",2],["oxzen","fr",2],["HeyHunter","kr",2],["jabbÿ","au",2],["Runexfv","au",2],["starkz","de",2],["xanzreyli","de",2],["young","au",2],["Gubby","nz",2],["digga","",2],["Toyo_Phantom","tr",2],["Josiah Pereira","au",2],["lufon","au",2],["zertfan123","fr",2],["Mxhlo-7","au",2],["Nerdzfv","nz",2],["mickybot","",2],["Batman","nz",2],["MAYMAY","fr",2],["Bailey","au",2],["Bings","au",2],["TRACE peakzy","gb",2],["smoky","gb",2],["limefnbr","",2],["7VEN","",2],["Iceddzx","au",2],["gen","au",2],["volifyoce","au",2],["tzvrs","au",2],["silkkyfv","au",2],["flakez","au",2],["bella","",2],["N3ymarSunnyInnit","is",2],["Kloo","au",2],["Syn","au",2],["MooMooOnMilk","au",2],["NJayyee","au",2],["Grandpa Yannzzy","au",2],["BiscoffBandit456","gb",2],["rileyfps","au",2],["rRezu","ar",2],["qoizon","",2],["pns","kr",2],["Crocxy","au",2],["eXiLiTyfn","nz",2],["EBJreyli","kr",2],["Optic","au",2],["tatsu3kk","au",2],["Wiremu","nz",2],["twis","",2],["chrome f4lldog","gb",2],["Yuskeyz","au",2],["lock","au",2],["grands","kr",2],["Arctis","au",2],["Bandit","no",2],["GusGOTY","gb",2],["calzy","",2],["boston","au",2],["ezipzÿ28","nz",2],["sharky","gb",2],["mns","nz",2],["neqxus.","au",2],["TĘZZ.","by",2],["spexy","au",2],["jackyjerky","kr",2],["vanyak","au",2],["rourky","pt",2],["VezaTungChadlite","ca",2],["jinxbot","",2],["falcons flixbot","nz",2],["chrome plexxy","nz",2],["ACC1Dxyz","dk",2],["movin","au",2],["ydenn","es",2],["dflt.z","au",2],["ruqxz","au",2],["kre","ch",2],["Cabra mcgregor","br",2],["Skykingfv","au",2],["Flukez","",2],["inojit","au",2],["pocoz","sa",2],["Slizzyzx","au",2],["tan","",2],["AyoAdobo1","kr",2],["syyhr","gb",2],["njifishy","au",2],["ander totie","us",2],["pickle","nz",2],["Jamaiso inomata","au",2],["Ravenbry.","it",2],["CBWolck","au",2],["IIEX0TiCII","au",2],["ᶜᵒᵃˢᵗ","au",2],["EventualBoar7631","au",2],["FlyArcher","au",2],["yuzu","it",2],["ashytholomew","",2],["anderdingus","tr",2],["Arkadian7","de",2],["mylo.","au",2],["vorynx","",2],["Xacklebot","sa",2],["Hobo","br",2],["xShineAu","au",2],["grungy","nz",2],["Kii","nz",2],["jacefnt","br",2],["fatnaganawz","br",2],["Achez","au",2],["drkL","",2],["Yen","de",2],["visionn","sa",2],["saint","kr",2],["swerve","au",2],["Fluxzy","au",2],["elytra","au",2],["fdgz.","gb",2],["N-_-W01","au",2],["flavourcb","",2],["GTA","au",2],["Vexyn_fort","nz",2],["glokk","au",2],["Maceszn","nl",2],["Pakeke.","nz",2],["kettama","cz",2],["Ohms","",2],["mechyfv23","au",2],["Coley","au",2],["Macezx","",2],["Tafa.","sa",2],["Addz27yea","gb",2],["Maxim123234","ua",2],["Dscary","us",2],["Dragzfn","au",2],["oskyfnt","",2],["unckranks","nz",2],["Zink","au",2],["dstniy","",2],["Average","au",2],["kingston","au",2],["SamPapasidero123","au",2],["choccy","no",2],["gumbo","gb",2],["Dexters Shadow","au",2],["ALmond","nz",2],["spairz","au",2],["rehksbot","",2],["SepV1","tr",2],["chqse","au",2],["Colofi","au",2],["NXT-_-KABIBKA-_-","au",2],["FeetLoverKanye","fr",2],["zurkz","sa",2],["nathhok","lv",2],["auvanquish","au",2],["xzc","tr",2],["RobustCable4017","au",2],["envix2x","br",2],["scared","us",2],["okasy14","mx",2],["froy","dk",2],["Kandy Wandy","",2],["x1nate_","au",2],["scarz","au",2],["Fallenduckykid1","au",2],["BennyBoy01IsCool","au",2],["yt_zkbot","au",2],["Progamer7529","au",2],["Artixz","mx",2],["Xenn","gb",2],["gregoryjefferson","jp",2],["Kingz","no",2],["vexwingu","",2],["NutellaCrêpe328","au",2],["Huey.s","au",2],["LewisLengend85","au",2],["blakebot.","",2],["DonutsFN","au",2],["phantom","nz",2],["kailashfv","",2],["tassieuk","au",2],["THANOS","nl",2],["clawzv2","pt",2],["patty","",2],["Boxjump Toezy","",2],["Twigarno","au",2],["burtonboys","nz",2],["gizza sniff","nz",2],["falcon stormbot","",2],["Moutey","au",2],["GuadaPou","mx",2],["SoyxAir","mx",2],["Daisy Jones.","ca",2],["shxrk","au",2],["coast zander","nl",2],["Greekfv","au",2],["Tantrum0x","au",2],["mxso","au",2],["Johnson","au",2],["mrarabmuffinfv","mx",2],["Photon1x","us",2],["GodSigma67","au",2],["TaiRaga","nz",2],["Māori Bugha","nz",2],["Beyondcliff.","au",2],["Gab_Star1738","es",2],["iceman","au",2],["melonfarmer2","au",2],["Crackerzz","nz",2],["itsvec.","au",2],["Chrome slyxycuhh","gb",2],["Hazza.g24","au",2],["xennoro","au",2],["Beast265","au",2],["centszn","gb",2],["strawhat flixz","au",2],["Viduna","",2],["villxrk","gb",2],["Silver","mx",2],["easlz","gb",2],["oatleycuh","co",2],["arlo","au",2],["Soccer_Crazy11","",3],["ˢᵖᵒᵒᵏʸ","au",3],["Jabox","es",3],["drągneeł","uy",3],["Sonifyy","au",3],["RAGE","",3],["Hadron Lurks","ca",3],["kevbekoolin","us",3],["force kaden","us",3],["PRIME","nz",3],["IGL","nz",3],["copdivx","mx",3],["ZYR_Sebis","mx",3],["Alolex.","pl",3],["Luzid3k-","",3],["TheFallenShade57","nz",3],["arjun","be",3],["isaac","jp",3],["Lixzyy1x","fr",3],["Viking gaming","ru",3],["Mexicen","mx",3],["Americano","us",3],["diesel","mx",3],["osrn","mx",3],["smqked","au",3],["lucas","au",3],["pacca","nz",3],["Kurovi","",3],["poplikeaballoon","ng",3],["pokey","es",3],["Vinsmoke Zurtum","au",3],["Nanzawys","",3],["Breakifyy","us",3],["Qenza.","au",3],["Sh1vyfn","au",3],["MIB","au",3],["Srozy","au",3],["Xynzo","au",3],["Kaztou_","fr",3],["Flatarøn","ua",3],["Doctor Chani","",3],["turkz","de",3],["teezÿ","gb",3],["BIueishh","au",3],["Jucie_7","pt",3],["Succes. Clouver7","kr",3],["Hopulater","",3],["caiden","au",3],["ᵇᵒᵇᵒʸ","",3],["kyozoki","",3],["Astro","mx",3],["sahz","ca",3],["corlixfv","kr",3],["Dawzau","au",3],["Samyar-ganji","",3],["GUTERBEAR","",3],["shaledel","",3],["icndndnlolkjn","jp",3],["vast","us",3],["kiwix","us",3],["Redeagle","",3],["Aaron_O1234","uy",3],["dark.","us",3],["CLB","mx",3],["tafiddy","nz",3],["sdarky","co",3],["FRAGDAZ","nz",3],["CoveX Snooze","mx",3],["expofv","au",3],["dr1pfnt","au",3],["Pizzaman","au",3],["Kirito","fr",3],["ZENISTU","fr",3],["xng3l","mx",3],["housen pachis","mx",3],["Wolve","tr",3],["CliffeBRat-_-","mx",3],["hardstuck","au",3],["Lamz","au",3],["Rax","nz",3],["Jax","nz",3],["Jack.","au",3],["scon.","it",3],["jaypowell17","us",3],["Born","jp",3],["OCE","au",3],["owenlookredlight","au",3],["TikTokSpeedYFN","au",3],["sydneybug","us",3],["catboy","au",3],["aggro rexx.","nz",3],["chad67","no",3],["ʙʟɨχʏ","us",3],["vivixz","us",3],["pewpew","nz",3],["plutöski","",3],["Nozzybot","us",3],["bery","us",3],["saarbot","ar",3],["124sdawdaf","es",3],["Mariusky_01","it",3],["please","au",3],["79fv","mx",3],["tony","mx",3],["nexae","au",3],["xavier","nz",3],["retired","au",3],["Bnth","au",3],["falcon dizzyy","uy",3],["ahmadhnf","br",3],["zanewally","",3],["slyfv","co",3],["draxen","be",3],["frznau","",3],["HWK","au",3],["w1nter","au",3],["JettOTP","it",3],["harper","ca",3],["kurve","gb",3],["zyth","gb",3],["captian kirkey","au",3],["HiggsAIM-_-","gb",3],["Zii","nz",3],["RustyToolbox","au",3],["Sweat","es",3],["dakoy.","es",3],["azzy-tarou","au",3],["CazlenkasBock","gb",3],["butterstogeelong","eg",3],["VyperOk","",3],["bcmd.","au",3],["Shearny112","au",3],["vic0tryona","au",3],["EagleCuhh","es",3],["dotklubeur","au",3],["CABBAGE KlNG.","au",3],["Chillplayer","jp",3],["AMORIS ROGI281","jp",3],["lucidfv.","au",3],["frosty","au",3],["ArKaWingu","fr",3],["Keldras","",3],["SwiftDesk8075","au",3],["Bigglefart","sa",3],["ninjagofn","",3],["pixybot","au",3],["KobyD5","",3],["novabot","mx",3],["Levis-03fn","",3],["Zinoslap","it",3],["iraitz_iwnl","es",3],["Danelyache32","es",3],["yos4y-.-","jp",3],["HansNJ NeverDie","jp",3],["NYX","",3],["alexbot","mx",3],["Lyte","",3],["ѕⅼеер","mx",3],["marshmellow9920","au",3],["twttr Shayfv","us",3],["r1choffbluess","",3],["suryafnr","be",3],["shoury6.2ft","no",3],["hxddy.","gb",3],["Autumn","",3],["Ler","fr",3],["FLX1X","fr",3],["GOTeaY","us",3],["figxred.","ca",3],["Dreamer plumita","mx",3],["Cometortas77.KKP","es",3],["CXLTS","au",3],["creatina Mbappe.","es",3],["Mıkes","it",3],["ˢᵘˡˡʸ_","sa",3],["Snapped","au",3],["adore haylee","au",3],["neon-bluette","it",3],["Young bilby","gb",3],["EGY","mx",3],["nekomeyi","jp",3],["Falcon Enzobot","co",3],["REIGN Pixzy1x","us",3],["Fake_Artrøz","fr",3],["esptien","au",3],["nrcnexo","au",3],["TWIZ","au",3],["juniqr","us",3],["pepper","",3],["gd8","it",3],["Gianluca Pomodor","es",3],["Striker3k.","sa",3],["Naser","sa",3],["早坂ゆう","es",3],["ダークネスたけし","jp",3],["Swiftyrr","gb",3],["Cluaholic","gb",3],["Merkz.","",3],["christ","au",3],["Metototititoto","",3],["zennreyli","",3],["nnoahhfv","nz",3],["BobTsmn","au",3],["Ragsdaleboy18","us",3],["Dodging","au",3],["Decayz","au",3],["grasp","nz",3],["ast","au",3],["LILRiot123456","us",3],["Bubbas_.67","us",3],["TopresuIt","au",3],["Cripticfntt","it",3],["twinxii","kr",3],["KippiCat","dk",3],["Nathaniel_c03","au",3],["Lucid","us",3],["Ahveq","",3],["Ducksxy","us",3],["Squiddy","us",3],["zacceditz2.0","",3],["JaquaviousVI","",3],["jamesfv","au",3],["caseyfv","au",3],["DubZz","us",3],["beepi.","",3],["DAGOAT Vohit","au",3],["Cambo","",3],["Vertex","jp",3],["danielfpsx","us",3],["zydebot","us",3],["Nyron","",3],["CovVaR.","au",3],["CurrentLamp4766","nz",3],["2sweaty4u8527","au",3],["joshmaxheight","us",3],["crispyicey","it",3],["blzzyreyli","ar",3],["kwazie","au",3],["idc","",3],["slax","us",3],["commandment229","",3],["polish.peterbot","ru",3],["dannycuh","au",3],["berserk","au",3],["monkweh","ca",3],["nothidudespeedl","au",3],["ObedientIron405","au",3],["乇乂０尺匚丨丂ㄒ","es",3],["Prada","us",3],["zoda","us",3],["awaken slxmmed7x","es",3],["SIM","nl",3],["HarukiyoFN","jp",3],["souyou2","",3],["Cohen0603","au",3],["BoogieTheMinion","us",3],["SßOĶÆ","us",3],["Eron","nz",3],["Goody","au",3],["EXTC","au",3],["RIZE_Peanut","gb",3],["cacahuète_igl","gb",3],["8Life-Fortnite8","",3],["yourboymase16","au",3],["Dlyan","au",3],["ticktock liamfn","au",3],["Komptyn","au",3],["Spxrkyy-17k","au",3],["RubXfv","",3],["NZ_Kray101","fr",3],["Momsy aura17","jp",3],["voltx","nz",3],["Cozzy","",3],["mancity coldjers","au",3],["smiggleworld9","au",3],["B12","nz",3],["R1zeaqy","",3],["XSET_QUILL","",3],["ocean","us",3],["demon","us",3],["柿くん_0702","",3],["Herb-N akastach","jp",3],["Iceya","au",3],["kydzbot","ar",3],["まこはるなお","jp",3],["TIBURON.","mx",3],["Jacob1.2.3","au",3],["flyr","us",3],["DATBOIDINO","us",3],["Jibba","us",3],["brawly7","mx",3],["yuitoyuitodayo","jp",3],["リフレの神","jp",3],["りっきーえふえぬ","jp",3],["THAZEN.exe","ar",3],["Me1z","ar",3],["HarryNalaa","fr",3],["ゆうたろう選手","kr",3],["MiLagartijo","",3],["SShift","us",3],["Thaifv","nz",3],["resignz4x","au",3],["z4yro7","es",3],["èqua","pl",3],["pacs","pl",3],["Letty","au",3],["ego","no",3],["mr.ethical","au",3],["baellaggio","",3],["syndrome","au",3],["yarque","au",3],["xsetboxedu482","au",3],["spxrks comeback","au",3],["lil","au",3],["hexybot","",3],["Keyan","",3],["Anthony","gb",3],["PriorLeopon7638","au",3],["baileycricket","",3],["Caydz15","nz",3],["happy-cool_kidz","",3],["PWR_MASON_ON_TTK","nz",3],["にーこっこ","jp",3],["UnlikelyFire4776","",3],["LukasFN","nz",3],["hollo","nz",3],["IDuller","mx",3],["mx.papaleta","",3],["williams-boyz87","au",3],["Womber67","au",3],["Ŵïłłfv","au",3],["いっさですー","jp",3],["remon-37564","lv",3],["Nazoko.","us",3],["NEMERALQBI","sa",3],["Klombo-","au",3],["akry1x","au",3],["Schyzo","au",3],["Scythe","au",3],["fayki","gb",3],["Fear_Quals0","",3],["SkulldorX","de",3],["OnHighWeh","de",3],["IslaVista6","au",3],["montgamer78","au",3],["larper","kr",3],["Vex_clan_tvhayds","nz",3],["anthorem","fr",3],["SkYzYonax","fr",3],["selim_onfire23","",3],["V1z01","us",3],["t.h.r.o.a.t","gb",3],["Zavking.AI","nz",3],["mystry ota171er","mx",3],["Compton","",3],["hyper","",3],["Makavelifv","",3],["ｃｒｏｎｕｓメ","",3],["minty","nz",3],["4kt","au",3],["just1nfever","gb",3],["RvL","sa",3],["7jz","ar",3],["invalid nïckxzr","de",3],["Peakrl_07","",3],["Dysfunctional","au",3],["TOXIC-_-KENJI","fr",3],["Aquila.exe","fr",3],["CoopsA14","au",3],["Fighterboy89","",3],["7VENMotors","us",3],["Ketzal","mx",3],["vaylix","au",3],["chrome","tr",3],["prilse","ca",3],["AXIS","jp",3],["Barbie","au",3],["ZAYYB","au",3],["Cløudz","us",3],["swizzie","ca",3],["OtherDuck4574","us",3],["sprite","cz",3],["breezy","us",3],["vokkufn6","kr",3],["deeivv","fr",3],["xelaa","es",3],["Sterling20144","",3],["Tristful-litre1","",3],["Archie181191","au",3],["Fuzzy_bluebell48","au",3],["xTAHEKE_RIDERZx","nz",3],["パワフル歯磨き粉","jp",3],["Anis_progame","fr",3],["xnono","fr",3],["napp1on60fps","",3],["Lepaonpro","",3],["Bxgbug","ca",3],["cligga1st","",3],["void","au",3],["swimXy","",3],["Vexify","us",3],["falcon nanobot","kr",3],["PRIME_CascavoYT","ca",3],["timba","",3],["TRM","",3],["josiahtha1","mx",3],["nikojr_mystrong","jp",3],["somagongon","",3],["California.","",3],["blazefury","ca",3],["Tiger","au",3],["Jqck7","au",3],["FREAKY","au",3],["ProfoundDesk6741","",3],["Ayden","au",3],["Kojiro","",3],["Elite Noahy","gb",3],["LethalVenom7131","de",3],["Frosty156377","",3],["juan.pineirot","mx",3],["jsgivetheatk","au",3],["Zul","au",3],["falcon meyzyx","fr",3],["yureyli","fr",3],["5xFyn","nz",3],["Kazzi","fr",3]]};
/* LADDER NAMES end */
// Ladder handles. Two syllables and sometimes a number, which is what a ranked
// lobby actually looks like. They are never presented as real people: every one
// carries ccLadderEvent on its card, the same way makeFiller labels its reserves.
const CC_LAD_A=['ne','ka','ri','zo','mi','tu','va','sha','dre','lo','fi','xe','ju','ba','sol','kry','nyx','ro','ta','vi','pe','glo','yu','ash','ver'];
const CC_LAD_B=['ko','vy','ren','sha','ki','dor','nis','lex','mar','tez','win','ply','fer','gus','sy','nex','ton','var','zel','ric','mo','buk','dan','sen','qy'];

// Where the ladder's nationalities come from: one entry per European player in
// the roster, so drawing from it reproduces the real spread — Russia heavy,
// the Caucasus empty — instead of a flat list of flags.
let CC_NAT_POOL={};
/* Флаги выдуманных игроков берутся из распределения ростера региона, включая
   карточки без флага. В Азии 2 627 карточек, флаг у 1 765, из них Япония 93%,
   а среди всех только 63%: без учёта безфлаговых лобби было японским сильнее
   ростера. Пустая страна остаётся null (карточка без флага), самый частый флаг
   не подставляем. */
function careerNatPool(){
  const reg=ccCareerRegion();
  if(CC_NAT_POOL[reg]) return CC_NAT_POOL[reg];
  const seen=new Set(), out=[];
  PLAYERS.forEach(p=>{
    if((p.region||'')!==reg) return;
    const k=hKey(p); if(seen.has(k)) return;
    seen.add(k); out.push(p.nat||null);
  });
  CC_NAT_POOL[reg] = out.length ? out : [null];
  return CC_NAT_POOL[reg];
}

/* Normal draw for division strength, SD measured. Epic's PR example: D3 cup of 1,000, field 20,000 PR,
   100th 23,000, 900th 17,000. At 976 PR per OVR that is p10 +3.07 / p90 -3.07 around the mean.
   Sweep with the app's field builder and lobby sim (D3, 1,250 duos, 11 games, 14 runs):
     SD 4: +4.37/-4.21   3.3: +3.17/-3.45   3.2: +2.94/-3.11 (used)   3: +2.51/-2.62
   Old guessed 4 put the promotion cut 5.6 over the band; now about 4.5. Odds: tools/career-cup-calibration.js. */
const CC_BAND_SD=3.2;
function careerGauss(rnd){
  const u=Math.max(1e-9, rnd()), v=rnd();
  return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
}
/* Names the ladder is not allowed to invent.

   The generator builds a handle out of two syllables, and some of what it built
   was somebody's actual name: Firen, Nemo and Misha all turned up in a Division
   5 lobby as generated players while the real ones were Division 1 cards. From
   the outside that reads as exactly one thing — real people in Division 5 —
   and it is the one thing the ladder is not.

   Built once off the roster and kept, because this is asked a thousand times
   filling a Division 5 room. */
let CC_REAL_NAMES={};
/* Ключ — тот же, что у ростера (регион и год, careerRosterEU). Был только регион: список запоминался на первом же
   году, где его спросили (экран создания стоит на 2026-м), и в карьере другого года отсеивал ники лестницы по людям
   чужого года. */
function ccRealNames(){
  const reg=ccCareerRegion()+(ccNowYear()<2026 ? '|'+ccNowYear() : '');
  if(CC_REAL_NAMES[reg]) return CC_REAL_NAMES[reg];
  CC_REAL_NAMES[reg]=new Set();
  careerRosterEU().forEach(p=>{
    CC_REAL_NAMES[reg].add(String(p.handle||'').toLowerCase());
    CC_REAL_NAMES[reg].add(hKey(p));
  });
  return CC_REAL_NAMES[reg];
}
/* Generated cards are capped below the top division band: anything above it has to be a real roster player.
   Read off the band, not typed next to it; when the band moved below the old typed cap, a generated card walked
   into Division 1.
   Enforced here where every generated person is built. Callers can cap lower, none may go above. */
const CC_GEN_TOP=CC_DIV_RATING[1]-1;
// natHint — the flag the people this card is being seated beside are wearing.
// Kept most of the time, so a generated third belongs to the trio rather than
// to the alphabet, and dropped the rest so a room is not all one country.
/* Насколько выдуманный третий стоит ниже своей пары.

   Решение: «хотя бы подобных, 90 и тд». До него у пары 96/96
   третий выходил ровно на 81 — потолок выдуманных (ccGenTop, «выше топ-дивизиона
   только реальный игрок», правило). Реального свободного
   на 96 в опенах нет, все такие стоят в своих парах, так что подбор упирался не
   в химию, а в арифметику.

   Правило остаётся, но у него появляется одно исключение — ТРЕТИЙ К РЕАЛЬНОЙ
   ПАРЕ. Он и только он может подняться выше потолка, и не куда угодно, а на
   шесть ниже своей пары: 96 → 90, 93 → 87. Слабых пар это не касается вовсе —
   у них средняя и так ниже потолка, третий равен паре, как и был. */
const CC_TRIO_GEN_UNDER=6;
function ccTrioGenTop(avg){
  return Math.max(ccGenTop(), Math.round((avg||0)-CC_TRIO_GEN_UNDER));
}
/* Сезонный ростер лестницы: кто вообще существует в этом дивизионе этот год.

   Рождается один раз на сезон и дивизион, сидом БЕЗ календарной недели, — этим
   он и отличается от прежнего заполнения на лету. Порядок внутри мешается
   недельным броском: комната каждую неделю своя, но собирается из одних и тех
   же людей.

   Ростер в полтора раза больше комнаты (CC_LADDER_SPARE): будь он ровно по
   размеру, каждую неделю играли бы поголовно все, и «кто сегодня пришёл»
   перестало бы что-либо значить.

   Кэш живёт до конца страницы и сбрасывается ccWorldReset вместе с остальными
   снимками мира — иначе новый сезон играл бы прошлогодним народом. */
const CC_LADDER_SPARE=1.5;
let CC_LADDER_POOL={};
function ccLadderSeason(cr, open, need){
  const div=open ? 'open' : (cr.division||1);
  const key='s'+(cr.season||1)+'|'+div;
  if(!CC_LADDER_POOL[key]){
    const size=Math.ceil((need||0)*CC_LADDER_SPARE)+8;
    const rnd=careerRng(ccHashStr('ladderSeason|'+ccWorldSeed()+'|'+key));
    const seen=new Set(), out=[];
    while(out.length<size){
      const o = open ? ccOpenFillOvr(rnd)
              : cr.division===1 ? ccD1FillOvr(rnd)
                                : ccBand(cr.division)+careerGauss(rnd)*CC_BAND_SD;
      // Дивизионы 2–5 — строчными без цифр (см. careerLadderPlayer, plain).
      const c=careerLadderPlayer(rnd, o, seen, null, null, null, !open && (cr.division||1)>=2);
      if(!c) break;
      out.push(c);
    }
    CC_LADDER_POOL[key]=out;
  }
  /* Кто из них сегодня играет — решает неделя. Бросок посолен ею, поэтому
     раздача повторяется при перезагрузке и меняется от вечера к вечеру. */
  const wr=careerRng(careerSeed(cr, 'ladderWeek'));
  const pool=CC_LADDER_POOL[key].slice();
  for(let i=pool.length-1;i>0;i--){ const j=Math.floor(wr()*(i+1));
    const t=pool[i]; pool[i]=pool[j]; pool[j]=t; }
  return pool;
}
/* plain — ник строчными и без цифр. Правка: «пусть с 5 дива по 2
   будут никнеймы без цифр и маленькими буквами». Так выглядят ники в нижних
   дивизионах и у зрителей; заглавная и «Nekо47» остаются за опенами. Чтобы
   625 сочетаний двух слогов не кончались на большой комнате, у plain-ника
   иногда три слога. */
/* НАСТОЯЩИЕ НИКИ ЛЕСТНИЦЫ (его слово 29.09: «может вместо случайных ников добавить реальные,
   которые встречаются»). Люди, которые реально играли кубки дивизионов 2–5 в своём регионе
   (tools/build-ladder-names.js → CC_LADDER_REAL): ник как в Epic, флаг — тот, что человек
   сам выбрал. Прежнее правило остаётся: людей СЦЕНЫ внизу нет (ccRealNames — ростер), и ник
   не повторяется в комнате (taken). Сначала берётся ник своего дивизиона, потом любой; когда
   запас кончился — слоги, как было. Флаг — настоящий или никакой, чужой не выдумывается. */
function ccLadderRealPick(rnd, taken, div){
  if(typeof CC_LADDER_REAL==='undefined') return null;
  const pool=CC_LADDER_REAL[ccCareerRegion()]; if(!pool || !pool.length) return null;
  const real=ccRealNames();
  const ok=e=>{ const low=e[0].toLowerCase(); return !taken.has(low) && !real.has(low) && !real.has(hKey({handle:e[0]})); };
  // The division's slice of the pool, cut once per pool: this runs for every seat of a ladder room.
  const om=ccLadderRealPick.m || (ccLadderRealPick.m=new WeakMap());
  let byDiv=om.get(pool); if(!byDiv){ byDiv={}; om.set(pool, byDiv); }
  const own=div>=2 ? (byDiv[div] || (byDiv[div]=pool.filter(e=>e[2]===div))) : pool;
  for(const list of [own, pool]){
    if(!list.length) continue;
    for(let t=0; t<24; t++){ const e=list[Math.floor(rnd()*list.length)]; if(ok(e)) return e; }
  }
  return null;
}
function careerLadderPlayer(rnd, ovr, taken, natHint, roleWant, topOvr, plain){
  let h='';
  const real=ccRealNames();
  const crd=(CAREER && CAREER.career) ? CAREER.career.division||0 : 0;
  const rp=ccLadderRealPick(rnd, taken, crd);
  if(rp) h=rp[0];
  for(let guard=0; !rp && guard<40; guard++){
    const a=CC_LAD_A[Math.floor(rnd()*CC_LAD_A.length)];
    const b=CC_LAD_B[Math.floor(rnd()*CC_LAD_B.length)];
    if(plain){
      h=a+b;
      if(rnd()<0.35) h+=CC_LAD_B[Math.floor(rnd()*CC_LAD_B.length)];
      h=h.toLowerCase();
    } else {
      h=a.charAt(0).toUpperCase()+a.slice(1)+b;
      if(rnd()<0.45) h+=String(10+Math.floor(rnd()*89));
    }
    const low=h.toLowerCase();
    if(!taken.has(low) && !real.has(low) && !real.has(hKey({handle:h}))) break;
  }
  taken.add(h.toLowerCase());
  const nats=careerNatPool();
  /* Роль — по заказу, если её заказали: команда собирается вокруг одного
     ИГЛа, и выдуманный человек занимает то место, которое свободно. Кость
     бросается в любом случае: она же двигает последовательность дальше, и без
     броска один и тот же сид рождал разных людей в зависимости от того,
     заказали роль или нет. */
  const rolled = rnd()<0.5 ? 'roleIGL' : 'roleFRG';
  const role = roleWant || rolled;
  /* И то, что этот человек наиграл в ЭТОЙ карьере, — на его рейтинг.

     Без этой строки книга выдуманных (CAREER.devL) писалась бы в пустоту:
     careerLadderPlayer собирает карточку из полосы и про книгу не знает, а
     ccSceneLift ходит только по настоящему роастеру. Сезонный ростер низких
     дивизионов постоянный (ccLadderSeason), поэтому ник повторяется из вечера
     в вечер — и сдвиг на нём виден. */
  const top=topOvr||ccGenTop();
  const dev=careerDevOf({handle:h});
  const r=clamp(Math.round(ovr+(dev||0)), 35, top);
  const natGen=(natHint && rnd()<CC_TRIO_NAT_KEEP) ? natHint : nats[Math.floor(rnd()*nats.length)];
  // Настоящему — его собственный флаг (или никакого), выдуманному — из пула региона.
  const nat=rp ? (rp[1] ? ccNatOf(rp[1]) : null) : natGen;
  return {handle:h, nat:nat, region:ccCareerRegion(), org:null,
          tier:'ladder', event:L().ccLadderEvent, date:'-', placement:null,
          rating:r, _targetOvr:r, _attrs:ccRookieAttrs(r, role), _real:!!rp};
}

// Every European card the roster holds, one per person, strongest spelling kept.
// The roster spells the same player several ways across events, so this dedupes
// on hKey the way the drafting code already does.
let CC_EU_CARDS={};
function careerRosterEU(){
  const reg=ccCareerRegion()+(ccNowYear()<2026 ? '|'+ccNowYear() : '');
  if(CC_EU_CARDS[reg]) return CC_EU_CARDS[reg];
  const best=new Map();
  // В 2025-м году сцена — это люди 2025-го: карты позже того года не существуют.
  const yearCap=ccNowYear();
  PLAYERS.forEach(p=>{
    if((p.region||'')!==ccCareerRegion()) return;
    if(yearCap<2026 && ccCardYear(p)>yearCap) return;
    const k=hKey(p), o=attrsFor(p).ovr;
    const cur=best.get(k);
    if(!cur || o>cur._ovr){ const c={...p}; c._ovr=o; best.set(k, c); }
  });
  CC_EU_CARDS[reg]=[...best.values()].sort((a,b)=>b._ovr-a._ovr);
  return CC_EU_CARDS[reg];
}

/* When a card was made.

   The roster writes a date four ways — '2026-06-26', '31 мая 2026',
   '18–19 июл 2026' and 'апр 2025' — and 1,015 European cards carry no date at
   all. Read as a sortable number, with the parts it does not know left at zero,
   so 'апр 2025' sorts before every April day and after March.

   The year is the part that has to be right, and every card knows it even when
   the date is empty, because the event name carries it: everything is
   'FNCS <year> ...' bar the Reload Elite Series, which is the 2026 circuit and
   the only event in the roster named without a year. Measured: 0 of 5,024
   European cards come out yearless. */
// The year the career is played in, taken from the measured calendar rather
// than written down a second time.
const CC_NOW_YEAR=+CC_YEAR_TO.slice(0,4);
const CC_MON={'янв':1,'фев':2,'мар':3,'апр':4,'мая':5,'май':5,'июн':6,
              'июл':7,'авг':8,'сен':9,'окт':10,'ноя':11,'дек':12};
function ccCardDay(card){
  const d=String((card && card.date)||'').trim();
  let m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
  if(m) return +m[1]*10000 + +m[2]*100 + +m[3];
  // A two-day block is the day it opened.
  m=/(\d{1,2})(?:[–-]\d{1,2})?\s+([а-я]+)\s+(\d{4})$/.exec(d);
  if(m) return +m[3]*10000 + (CC_MON[m[2]]||0)*100 + +m[1];
  m=/^([а-я]+)\s+(\d{4})$/.exec(d);
  if(m) return +m[2]*10000 + (CC_MON[m[1]]||0)*100;
  return 0;
}
function ccCardYear(card){
  const day=ccCardDay(card);
  if(day) return Math.floor(day/10000);
  const ev=String((card && card.event)||'');
  const m=/(20\d\d)/.exec(ev);
  if(m) return +m[1];
  return /Reload Elite Series/.test(ev) ? CC_NOW_YEAR : 0;   // серия 2026-го: константа, не год карьеры
}

/* The roster as it stands now: the newest card each player has from the year
   the career is being played in, and nothing older.

   careerRosterEU keeps a player's *strongest* card instead, which is right for
   how good somebody is and wrong for where they are. A club is not what its
   players were worth at their peak — Team Falcons read 92 off cards from 2024,
   Gentle Mates 93, and the pool ranked clubs by their own history. Measured on
   the 2026 cards the same two clubs are 80 and 83, which is what they are.

   1,155 of the 2,056 European cards of 2026 are a second showing of somebody
   already counted, so this is 901 players. */
let CC_NOW_CARDS={}, CC_NOW_TAG=null, CC_ARC_PAIRS={};
/* Чей это снимок. Карточки в нём носят сдвиг, который наиграла себе одна
   конкретная карьера, поэтому снимок принадлежит ей, а не странице: открыли
   другой слот — старые числа надо забыть. Внутри одной карьеры кэш живёт
   дальше, а сбрасывает его тот, кто сдвиги меняет, — careerGrowField. */
function ccSceneTag(){
  // Неделя подтягивания к рейтингу из жизни (ccRealPull) — сцена пересобирается раз в неделю.
  // И сезон рейтинга (ccRatingSnap): со сменой сезона внутри года сцена берёт его числа.
  const y='|y'+ccCalYear()+'|p'+ccRealPullStep()+'|r'+ccRatingSnapTag();
  if(!CAREER) return 'none'+y;
  return ccSlot()+'|'+((CAREER.player&&CAREER.player.nick)||'')+'|'+((CAREER.career&&CAREER.career.season)||0)+y;
}
function ccSceneCheck(){
  const tag=ccSceneTag();
  // Пары архива держат карточки этого же роастера — вместе с ним и живут,
  // иначе после пересборки сцены в истории стояли бы старые объекты.
  if(tag!==CC_NOW_TAG){ CC_NOW_CARDS={}; CC_ARC_PAIRS={}; CC_NOW_TAG=tag; }
}
/* Сцена региона сейчас: по одной самой свежей карточке на человека, с рейтингом его года плюс наигранное.
   Одна функция и для ccArcRoster: две копии с общим кэшем CC_NOW_CARDS давали регион того, кто вызвал первым.
   Рейтинг года, а не лучшей ночи, как в ccEuCards внутри лобби. Иначе у человека два числа (391 из 916
   европейцев расходились, в среднем на 4.6, максимум на 18). Сезон ставится до ccSceneLift. */
/* ПЕРЕЕХАВШИЕ ЗА ГОД (17.10, Notion «fncsdraft 15.10»: «тайсон и на na и в европе»). TaySon в 2024-м
   сыграл Мейджоры 1–2 за Европу, а с июньского квала Мейджора 3 — за NAC (с Eomzo), и сцена года,
   собранная «все карты региона за этот год», держала его в обоих регионах весь сезон.
   Переезд отличается от тёзок датами: у переехавшего карты года идут по регионам ПОДРЯД, без
   пересечения (EU до апреля, NAC с июня), а тёзки (Rise NAC/ASIA, Cold NAC/NAW) играют параллельно —
   их правило не трогает. Человек стоит там, где его последняя карта на день карьеры, до первой —
   в регионе первой. Ключ — hKey без региона, как и у самих карт.
   Мировые турниры (Глобалы, Инвитейшнл, Саммит, EWC) в расчёт не идут — это не «где он играет», и
   страна должна совпадать: разные флаги на двух сегментах — это два человека. */
let CC_MOVERS={};
const CC_MOVER_REGS=new Set(['EU','NAC','NAW','BR','ASIA','ME','OCE']);
const CC_MOVER_SKIP=/Global Championship|Invitational|Summit|Esports World Cup|EWC|Pro-Am|All-Star/;
function ccYearMovers(y){
  if(CC_MOVERS[y]) return CC_MOVERS[y];
  const seg=new Map();
  PLAYERS.forEach(p=>{
    if(ccCardYear(p)!==y) return;
    const r=p.region||'';
    if(!CC_MOVER_REGS.has(r) || CC_MOVER_SKIP.test(p.event||'')) return;
    const d=ccCardDay(p); if(!d) return;
    const k=hKey(p);
    if(!seg.has(k)) seg.set(k, new Map());
    const m=seg.get(k);
    let s=m.get(r);
    if(!s) m.set(r, s={r:r, lo:d, hi:d, nat:new Set()});
    else { if(d<s.lo) s.lo=d; if(d>s.hi) s.hi=d; }
    if(p.nat) s.nat.add(p.nat);
  });
  const out=new Map();
  seg.forEach((m, k)=>{
    if(m.size<2) return;
    const list=[...m.values()].sort((a,b)=>a.lo-b.lo);
    for(let i=1; i<list.length; i++){
      if(list[i].lo<=list[i-1].hi) return;
      const a=list[i-1].nat, b=list[i].nat;
      if(a.size && b.size && ![...a].some(n=>b.has(n))) return;
    }
    out.set(k, list.map(s=>({r:s.r, lo:s.lo, hi:s.hi})));
  });
  return (CC_MOVERS[y]=out);
}
function ccMoverRegion(k){
  const list=ccYearMovers(ccNowYear()).get(k);
  if(!list) return null;
  const t=+String(careerToday()).replace(/-/g,'');
  let r=list[0].r;
  list.forEach(s=>{ if(s.lo<=t) r=s.r; });
  return r;
}
// Не здесь в этот день — переехал (или ещё не переехал) в другой регион.
function ccMovedAway(p, reg){
  if(ccCardYear(p)!==ccNowYear()) return false;
  const r=ccMoverRegion(hKey(p));
  return r!=null && r!==reg;
}
// Где сейчас все переехавшие года — часть ключа кэшей сцены и пула лобби.
let CC_MOVERS_TAG={at:null, s:''};
function ccMoversTag(){
  const at=ccNowYear()+'|'+careerToday();
  if(CC_MOVERS_TAG.at===at) return CC_MOVERS_TAG.s;
  const m=ccYearMovers(ccNowYear());
  let s=m.size ? '|mv' : '';
  m.forEach((list, k)=>{ s+=','+ccMoverRegion(k); });
  CC_MOVERS_TAG={at:at, s:s};
  return s;
}
function ccSceneRoster(reg){
  ccSceneCheck();
  const ck=reg+ccMoversTag()+ccRegenTag();
  if(CC_NOW_CARDS[ck]) return CC_NOW_CARDS[ck];
  const season=ccSeasonOvr();
  const now=new Map();
  ccRegenSync();
  PLAYERS.forEach(p=>{
    if((p.region||'')!==reg || ccCardYear(p)!==ccNowYear()) return;
    if(ccMovedAway(p, reg) || ccRegenGone(p)) return;
    const k=hKey(p), day=ccCardDay(p) || ccNowYear()*10000;
    const cur=now.get(k);
    if(!cur || day>cur._day){
      const c={...p}, a=attrsFor(p);
      c._day=day; c._ovr=a.ovr;
      const yr=season.get(ccSeasonKey(p));
      if(yr!=null && yr!==c._ovr){
        /* Свой набор шести чисел, а не общий с настоящей карточкой: attrsFor
           сдвигает их к _targetOvr прямо в переданном объекте, а после {...p}
           он у копии и у оригинала один и тот же. Без этой строки сезонный
           рейтинг переписал бы карточку во всём приложении — та же ловушка,
           что описана в ccEuCards. */
        c._attrs={...a, _floored:false};
        c._targetOvr=yr; c.rating=yr; c._ovr=yr;
      }
      // Контракт годичный: часть народа каждое межсезонье меняет клуб.
      const org=ccSeasonOrg(c, reg);
      if(org) c.org=org;
      ccSceneLift(c); now.set(k, c);
    }
  });
  /* И дебютанты следующих лет (ccDebutants) — самой свежей карточкой года
     дебюта, с настоящим рейтингом того года. */
  const debut=ccDebutants(reg);
  if(debut && debut.size){
    const pick=new Map();
    PLAYERS.forEach(p=>{
      if((p.region||'')!==reg) return;
      const k=hKey(p), d=debut.get(k);
      if(!d || ccCardYear(p)!==d.year || now.has(k)) return;
      const day=ccCardDay(p) || d.year*10000, cur=pick.get(k);
      if(!cur || day>cur.day) pick.set(k, {p:p, d:d, day:day});
    });
    pick.forEach(({p, d, day}, k)=>{
      const c=ccDebutCard(p, d);
      c._day=day;
      const org=ccSeasonOrg(c, reg);
      if(org) c.org=org;
      ccSceneLift(c); now.set(k, c);
    });
  }
  // Регены (ccRegenCards) — после 2026-го, на месте ушедших.
  ccRegenCards(reg).forEach(g=>{ const c={...g}; if(now.has(c._k)) return; ccSceneLift(c); now.set(c._k, c); });
  // Люди своего клуба носят его герб — см. ccClubStamp.
  CC_NOW_CARDS[ck]=ccClubStamp([...now.values()].sort((a,b)=>b._ovr-a._ovr));
  return CC_NOW_CARDS[ck];
}
function careerRosterNowEU(){ return ccSceneRoster(ccCareerRegion()); }

/* Who a third seat belongs beside: people who played together, share a country, or a language.
   Reads the whole history, not 2026 cards (those hold one partner each). Europe: 3,100 duos, 1,472 trios recorded;
   131 of 140 Division 1 pairs have a third who played with one of them.
   Language is read off the teams instead of a table: 60.4% of EU teams are one nationality, mixed ones are pairs
   like RU-UA 22, DE-CH 20, PL-SE 10, AT-DE 9, GB-DK 9, LV-UA 8.
   Per region, cached like CC_NOW_CARDS. */
function ccCardOvr(c){
  if(!c) return 0;
  return c._ovr!=null ? c._ovr : ((attrsFor(c)||{}).ovr || 0);
}
let CC_PLAYED_WITH={};
function ccPlayedWith(reg){
  const r=reg||ccCareerRegion();
  if(CC_PLAYED_WITH[r]) return CC_PLAYED_WITH[r];
  const map=new Map();
  PLAYERS.forEach(p=>{
    if((p.region||'')!==r) return;
    const k=hKey(p);
    rosterEntriesOf(p).forEach(function(e){
      e.entry.duo.forEach(h=>{
        const o=hKey(h);
        if(o===k) return;
        let s=map.get(k); if(!s){ s=new Set(); map.set(k, s); }
        s.add(o);
      });
    });
  });
  CC_PLAYED_WITH[r]=map;
  return map;
}
function ccHasPlayedWith(a, b, reg){
  if(!a || !b) return false;
  const s=ccPlayedWith(reg).get(hKey(a));
  return !!(s && s.has(hKey(b)));
}
let CC_NAT_FIT={};
function ccNatFit(reg){
  const r=reg||ccCareerRegion();
  if(CC_NAT_FIT[r]) return CC_NAT_FIT[r];
  const nat=new Map(), fit=new Map(), seen=new Set(), seenRow=new Set();
  PLAYERS.forEach(p=>{ if((p.region||'')===r && p.nat) nat.set(hKey(p), p.nat); });
  PLAYERS.forEach(p=>{
    if((p.region||'')!==r) return;
    rosterEntriesOf(p).forEach(function(e){
      // Teammates share one row object: a row already read has its id in seen.
      if(seenRow.has(e.entry)) return;
      seenRow.add(e.entry);
      // The same team is written on every card in it, so it is counted once.
      const hs=e.entry.duo.map(h=>hKey(h)).slice().sort();
      const id=hs.join('|');
      if(seen.has(id)) return;
      seen.add(id);
      for(let i=0;i<hs.length;i++) for(let j=i+1;j<hs.length;j++){
        const a=nat.get(hs[i]), b=nat.get(hs[j]);
        if(!a || !b || a===b) continue;
        const key=a<b ? a+'|'+b : b+'|'+a;
        fit.set(key, (fit.get(key)||0)+1);
      }
    });
  });
  CC_NAT_FIT[r]=fit;
  return fit;
}
function ccNatPairSeen(a, b, reg){
  if(!a || !b || a===b) return 0;
  return ccNatFit(reg).get(a<b ? a+'|'+b : b+'|'+a) || 0;
}
/* What a candidate is worth beside the people already seated.

   The rating stays the frame around the other three, so a pair of 96s is not
   handed a 60 for being Danish — that was already the rule here and it is the
   one thing this must not break. */
const CC_TRIO_PLAYED=100, CC_TRIO_SAME_NAT=30, CC_TRIO_NAT_FIT=20, CC_TRIO_OVR=1.5;
/* И сила — не только приправа к истории.

   Жалоба игрока: «третий тиммейт совсем нн чел, у которого
   меньше 80 рейтинга, хотя дуос один из самых сильных». Так и считалось: один
   совместный турнир стоил сто очков, а рейтинг — полтора за пункт, поэтому
   человек, однажды сыгравший с одним из них, обходил кандидата на шестьдесят
   пунктов ближе. В снапшоте таких совместных строк много: сцена маленькая, за
   год почти все со всеми где-нибудь да играли.

   Поэтому разрыв в рейтинге теперь стоит по-разному. Внутри полосы — почти
   ничего, там и должна решать химия: с кем играл, чей флаг. За полосой цена
   растёт отдельным слагаемым и быстро перевешивает даже две общие строки, так
   что сильному дуо больше некого подсадить, кроме такого же сильного. */
const CC_TRIO_BAND=6, CC_TRIO_FAR=22;
function ccThirdScore(core, cand, reg){
  if(!cand) return -Infinity;
  let s=0;
  const cn=cand.nat||null;
  (core||[]).forEach(c=>{
    if(!c) return;
    if(ccHasPlayedWith(c, cand, reg)) s+=CC_TRIO_PLAYED;
    if(cn && c.nat && cn===c.nat) s+=CC_TRIO_SAME_NAT;
    else s+=Math.min(CC_TRIO_NAT_FIT, ccNatPairSeen(cn, c.nat, reg)*2);
  });
  const seated=(core||[]).filter(Boolean);
  const avg=seated.length ? seated.reduce((t,c)=>t+ccCardOvr(c),0)/seated.length : ccCardOvr(cand);
  const gap=Math.abs(ccCardOvr(cand)-avg);
  return s - gap*CC_TRIO_OVR - Math.max(0, gap-CC_TRIO_BAND)*CC_TRIO_FAR;
}
/* Weighted over the best few rather than strictly the best, on purpose: the
   strict answer is the same trio every season, and Division 1 would read as a
   room of unchanging teams nobody could ever break into. */
const CC_TRIO_TOP=[8, 4, 2, 1, 1];
/* Слишком ли слаб этот кандидат для этой пары — по той же полосе, которой
   ccPickThird отбирает. Односторонняя нарочно: третий сильнее пары — это
   удачный трансфер, а не дефект. См. takeExtra. */
function ccThirdTooWeak(core, cand){
  const seated=(core||[]).filter(Boolean);
  if(!seated.length || !cand) return false;
  const avg=seated.reduce((t,c)=>t+ccCardOvr(c), 0)/seated.length;
  return (avg-ccCardOvr(cand))>CC_TRIO_BAND;
}
function ccPickThird(core, pool, rnd, reg){
  if(!pool || !pool.length) return -1;
  if(!core || !core.length) return 0;
  /* Сначала полоса силы, и только внутри неё — химия.

     Разрыв в рейтинге стоял слагаемым в самой оценке, и этого мало: бросок
     ниже берёт не лучшего, а одного из пяти лучших весами 8:4:2:1:1 — нарочно,
     чтобы комната не застывала. Пятёрка при этом собиралась со всего пула, и в
     неё пролезал кандидат на четырнадцать пунктов ниже пары; в трети случаев
     он и садился. Игрок: «у самых сильных дуосов третий чел с
     рейтингом 70». Замер: у пары 94/94 третьим вышел 80.

     Полоса отбирает кандидатов ДО оценки. Хватает пятерых внутри неё — играет
     химия, как и было задумано. Не хватает (пара 96/96, а все, кто так силён,
     стоят в своих парах) — берутся двенадцать ближайших по силе, и бросок
     ходит уже между ними. Дальше арифметики никакой подбор не уедет. */
  const seated=(core||[]).filter(Boolean);
  const avg=seated.length ? seated.reduce((t,c)=>t+ccCardOvr(c), 0)/seated.length : null;
  let idx=pool.map((c, i)=>i);
  if(avg!=null){
    const near=idx.filter(i=>Math.abs(ccCardOvr(pool[i])-avg)<=CC_TRIO_BAND);
    idx = near.length>=CC_TRIO_TOP.length ? near
        : idx.slice().sort((a,b)=>Math.abs(ccCardOvr(pool[a])-avg)-Math.abs(ccCardOvr(pool[b])-avg))
             .slice(0, Math.max(CC_TRIO_TOP.length, 12));
  }
  const scored=idx.map(i=>({i:i, s:ccThirdScore(core, pool[i], reg)}))
                   .sort((a,b)=>b.s-a.s)
                   .slice(0, CC_TRIO_TOP.length);
  const w=CC_TRIO_TOP.slice(0, scored.length);
  let roll=rnd()*w.reduce((t,v)=>t+v, 0);
  for(let k=0;k<scored.length;k++){ roll-=w[k]; if(roll<0) return scored[k].i; }
  return scored[0].i;
}
// The flag a generated seat should be wearing: one of the people already there,
// so an invented third is at least from a country the core actually plays with.
const CC_TRIO_NAT_KEEP=0.7;
function ccCoreNat(core, rnd){
  const nats=(core||[]).filter(c=>c && c.nat).map(c=>c.nat);
  if(!nats.length) return null;
  return nats[Math.floor(rnd()*nats.length)];
}
/* And the flag beside a flag, for a team of invented people.

   Below Division 1 nobody in the room ever played with anybody — there is no
   history to read, because none of them existed until this lobby. What there
   still is is the shape: 60.4% of the recorded European teams are one flag, and
   the mixed ones are drawn here from the pairs the region really produces,
   weighted by how often it produces them. So a generated trio comes out looking
   like a trio instead of like three rolls of the same die. */
const CC_SAME_FLAG=0.604;
function ccTeamNat(lead, rnd, reg){
  if(!lead) return null;
  if(rnd()<CC_SAME_FLAG) return lead;
  const rows=[];
  ccNatFit(reg).forEach((n, key)=>{
    const at=key.indexOf('|'), a=key.slice(0, at), b=key.slice(at+1);
    if(a===lead) rows.push([b, n]);
    else if(b===lead) rows.push([a, n]);
  });
  if(!rows.length) return null;
  let roll=rnd()*rows.reduce((s,r)=>s+r[1], 0);
  for(let i=0;i<rows.length;i++){ roll-=rows[i][1]; if(roll<0) return rows[i][0]; }
  return rows[0][0];
}

// A team in a career cup. Every duo in that lobby is a standing pair — you have
// played the season with your partner, the generated field plays with theirs,
// and Division 1's real duos played whole Majors together — so every one of
// them is paid the teammate synergy the engine already has for a pair that
// really played together.
//
// Measured, and the reason this exists: the moment Division 1 became real duos,
// its field carried five points of synergy that nothing else in the mode could
// earn, and a player rated exactly at Division 1's band finished 106th of 150
// instead of mid-field. Paying it to every career duo puts the band back where
// the design says it is, in every division at once.
/* A generated team is a standing team, whatever size it is.

   This read cards.length!==2, from the years when two was the only size a career
   played. In a trio season that made every invented team in the room worth five
   points less than the invented duos of a duo season — a whole field quietly
   easier, for arithmetic reasons rather than for anything that happened.

   Recorded pairs need nothing from here and never did: buildTeam already knows
   that Sky and Scroll played that season together and pays the link itself,
   whether the two of them are alone or have a third drawn in beside them. That
   is what the guard below catches, and it is why a real pair inside a trio keeps
   its synergy without this function being told anything about it. */
/* ---- Кого в команде сажают звать ------------------------------------------
 *
 * Правило одно на весь режим: ровно один ИГЛ. Дуо — ИГЛ и фраггер, трио — ИГЛ и
 * два фраггера. Команды в лобби собираются по рейтингу, а не по ролям, поэтому
 * роли расставляются здесь, когда состав уже известен.
 *
 * Двигают только выдуманных: их шесть чисел выдуманы вместе с ними, и
 * перестроить их под другую половину игры — то же самое, что выдумать иначе. У
 * настоящего игрока роль пришла из его собственной сцены, и переписывать её,
 * чтобы сошёлся состав, значит подделать данные — если реальная пара оказалась
 * двумя фраггерами, она такой и играет и просто не получает бонуса за роли.
 */
/* Разложить карточку под другую половину игры, не трогая её рейтинг.

   Шесть чисел меняются, седьмое — нет: человек, севший звать, не стал хуже или
   лучше, он стал делать другое. ccRookieAttrs как раз и раскладывает статы
   вокруг рейтинга под роль.

   Отдельно от ccCastLadderRole, потому что у той есть охрана, которую снимать
   нельзя: выдуманного соседа мод пересаживает сам, когда собирает команду, и
   делать то же самое с настоящим игроком молча — значит переписывать его
   измеренные статы за его спиной. Настоящего можно пересадить, только когда он
   согласился; согласие спрашивает careerMateRoleAsk и записывает в pr.role,
   откуда ccMateCardOf и берёт его сюда. */
function ccRecastRole(c, want){
  if(!c || !want) return false;
  const a=attrsFor(c);
  if(!a || a.roleKey===want) return false;
  const r=Math.round(a.ovr);
  c._attrs=ccRookieAttrs(r, want);
  c.rating=r; c._targetOvr=r;
  /* И роль называется вслух, а не выводится из шести чисел.
     attrsFor у настоящего игрока читает роль с Liquipedia (realRoleKey), и она
     бьёт любую раскладку: переписать статы и не сказать роль значило вернуть
     человека обратно на следующем же чтении карточки. `_roleKey` — тот самый
     флаг, которым пересаживается сам игрок; у выдуманного он лишний, но и не
     мешает: там роль и так выводится из статов. */
  c._roleKey=want;
  return true;
}
function ccCastLadderRole(c, want){
  if(!c || c.tier!=='ladder') return false;
  return ccRecastRole(c, want);
}
function ccSquadCastRoles(cards){
  if(!cards || cards.length<2) return cards;
  const role=c=>(attrsFor(c)||{}).roleKey;
  const igls=cards.filter(c=>role(c)==='roleIGL');
  if(igls.length===1) return cards;
  if(igls.length>1){
    // Настоящий ИГЛ остаётся ИГЛом, лишние выдуманные пересаживаются.
    const keep=igls.find(c=>c.tier!=='ladder') || igls[0];
    igls.forEach(c=>{ if(c!==keep) ccCastLadderRole(c, 'roleFRG'); });
  }else{
    // Звать некому: зовёт тот выдуманный, кто ближе всех к этой половине игры.
    const lean=c=>{ const a=attrsFor(c)||{}; return (a.end+a.sur)/2-(a.aim+a.clu)/2; };
    const made=cards.filter(c=>c.tier==='ladder').sort((a,b)=>lean(b)-lean(a));
    if(made.length) ccCastLadderRole(made[0], 'roleIGL');
  }
  return cards;
}
function careerTeam(cards, keepRoles, strangers){
  // Своя команда собрана по правилу с самого начала — поиск не предлагает
  // лишнего ИГЛа, — и её роли не переписываются под тобой.
  if(!keepRoles) ccSquadCastRoles(cards);
  const t=buildTeam(cards);
  /* Выдуманная на вечер пара в открытой комнате не получает химию: ни +5 за
     постоянное дуо, ни флаг/язык из ccTeamNat. Иначе пара выдуманных 82 приезжала
     с силой 92 и выигрывала 7% вечеров НАК (career-open-top-probe.js), после среза 0%.
     Режем только в открытой сборке (флаг strangers). Дивизионные комнаты не трогаем:
     они откалиброваны с синергией с обеих сторон (career-gap-calibration). Реальная
     пара с выдуманным третьим свои бонусы держит, третий своих не приносит. */
  const isLad=c=>!c || c.tier==='ladder' || !c.handle;
  const lad=strangers ? new Set(cards.filter(isLad).map(c=>String((c&&c.handle)||'').toLowerCase()))
                      : new Set();
  if(lad.size){
    (t.syn.links||[]).forEach(l=>{
      if(lad.has(String(l.a||'').toLowerCase()) || lad.has(String(l.b||'').toLowerCase()))
        t.syn.bonus-=l.val||0;
    });
  }
  const already=(t.syn.links||[]).some(l=>l.type==='partner');
  const duoReal=cards.length>=2 && !(strangers && (isLad(cards[0]) || isLad(cards[1])));
  if(duoReal && !already){
    t.syn.bonus+=SYN_TEAMMATES;
    t.syn.details.push(cards[0].handle+' + '+cards[1].handle+L().ccSynergyDuo(SYN_TEAMMATES));
    t.syn.links.push({a:cards[0].handle, b:cards[1].handle, type:'partner', val:SYN_TEAMMATES});
  }
  if(lad.size || (duoReal && !already)){
    const after=synCap(t.syn.bonus);
    // Rebuilt from the parts buildTeam left on the team rather than nudged, so
    // the number is the one buildTeam would have produced with this synergy.
    const ageEdge=ageEdgeOf(cards);
    t.pow = CARD_MODE
      ? Math.round((t.ovrAvg+after+t.roleBonus)*t.regionMult + ageEdge)
      : Math.round((cards.reduce((s,p)=>s+p.rating,0)/cards.length+after)*t.regionMult + ageEdge);
  }
  if(!keepRoles && !lad.size) ccBotEdge(t, cards, already);
  return t;
}
/* ФОРМА, ХИМИЯ И АНАЛИТИК У БОТОВ (21.10, его слово: «может ботам добавить это всё», потом «форму, химию тоже
   сделай»). Игрок спросил, почему при средних рейтингах и слабой локе у него сила больше почти всех: своей команде
   careerYouTeam прибавляет форму (±CC_FORM_MAX), химию (до CC_CHEM_MAX) и аналитика (1..3), а ботам — ничего.
   Теперь те же три слагаемых есть и у них, по тем же шкалам:
   - форма: ±CC_FORM_MAX, своя у каждого игрока на неделю (сид ник+понедельник), среднее по составу;
   - химия: пара, игравшая вместе по-настоящему, — полная; собранная сценой — растёт с начала сезона FNCS, как у игрока;
   - аналитик: у клуба, по его призовым (тот же 1+2k, что у нанятого игрока), клуб без призовых — 1, без клуба — 0.
   Всё от ника и даты, без Math.random: у двоих онлайн одно и то же. Выдуманных (лестница опена) не трогает — у них
   и синергию срезают, и замер опена держится на этом. Не для своей команды (keepRoles) и не в менеджере. */
/* Квал-симуляция ЛАНа (ccLanSimRanked, ccLanSummitSim) считается лениво, в тот день, когда её впервые спросили, и у
   двоих онлайн это разные дни: форма недели и химия от дня развели бы зал ЛАНа (прогон годов 21.10, DreamHack и EWC
   2024, DreamHack Winter 2022). Там играют одни боты против ботов, поправка снимается целиком. */
let CC_BOT_EDGE_HOLD=0;
function ccBotEdge(t, cards, hist){
  if(CC_BOT_EDGE_HOLD) return;
  if(typeof MGR_ACTIVE!=='undefined' && MGR_ACTIVE) return;
  if(!CAREER || !CAREER.career || !cards || !cards.length) return;
  const today=careerToday(), wk=careerMonday(today);
  const formOf=c=>{ const h=hashStr('form|'+hKey(c)+'|'+wk); const u1=(h&0xffff)/65535, u2=(h>>>16)/65535;
                    return (u1+u2-1)*CC_FORM_MAX; };
  const form=Math.round(cards.reduce((s,c)=>s+formOf(c),0)/cards.length*10)/10;
  let chem=0;
  if(cards.length>=2){
    if(hist) chem=CC_CHEM_MAX;
    else { const s=careerFncsSeason(today); const days=s && s.from ? ccDaysBetween(s.from, today) : 0;
           chem=Math.round(Math.min(1, days/CC_CHEM_DAYS)*CC_CHEM_MAX*10)/10; }
  }
  const org=(cards.find(c=>c && c.org)||{}).org;
  let an=0;
  // Онлайн аналитика нет и у живых (ccAnalystPow → 0 при ccMpOn) — и у ботов нет: на равных.
  /* И в гонке (23.10, прогон: Глобалы 26.09.2026, поле у двоих 111 против 113 у braydz+visxals): призовые клуба —
     у каждого гонщика свои (своя карьера), и аналитик ботов разводил одну комнату. */
  if(org && !ccMpOn() && !ccRaceOn()){ const usd=ccOrgEarn(org);
           an=usd==null ? 1 : Math.round(1+2*Math.max(0, Math.min(1, (ccOrgEarnLevel(usd)-60)/35))); }
  t.botEdge={form, chem, an};
  t.pow=Math.round(t.pow+form+chem+an);
}

/* Ladder is a snapshot of one Major's Play-In, not the roster's whole history (old way kept split duos alive
   and filled D5-2 with fakes). European sets: people / recorded duos / duos with nobody twice / avg:
     2026 M1 Play-In 300 152 150 80.6; M2 Play-In 300 150 150 82.0; M1 LC 54 23 23 72.4;
     M2 LC 47 18 18 72.2; Reload Elite cleaned 407 159 146 57.1
   150 pairs fits a 149 cup lobby. Pairs seated strongest-first, skipping anyone already placed.
   Only D1 seats real names: LC/Reload people are the competitive scene and look wrong in low lobbies; D5-2 stay
   generated. Snapshot turns over with the Major (139 of M1's 300 not in M2, the 161 who stayed gained 1.4 OVR). */
// Снимки 2025-го — по Плей-Инам трёх Мейджоров (даты — CAREER_YEAR_2025).
/* 2025: одна книга троек на весь год, как в 2024. Пересдача по снимкам ломала составы:
   из 162 пар февраля до сентября доживали 12. 2026 работает так же (ccSnapshotNow для тройки
   всегда CC_SNAPSHOTS[0], переключаются только дуо). Теперь 288 пар в каждом снимке, все доживают,
   ccSeat сажает человека ровно в одну пару.
   Порядок не как в 2024: у финалов 2025 составов нет (rosterEntriesOf: 0), поэтому сначала плей-ин
   (299 записей), потом ласт-ченс (201). С финалами первыми книга схлопывается до одной пары. */
const CC_SNAPSHOTS_2025=[
  {tag:'t1', from:CC_YEAR_2025_FROM, playIn:/2025 Major [123] . Play-In Stage/, lcq:/2025 Major [123] . Last Chance Qualifier/},
  {tag:'t2', from:'2025-04-09',      playIn:/2025 Major [123] . Play-In Stage/, lcq:/2025 Major [123] . Last Chance Qualifier/},
  {tag:'t3', from:'2025-07-16',      playIn:/2025 Major [123] . Play-In Stage/, lcq:/2025 Major [123] . Last Chance Qualifier/}
];
const CC_SNAPSHOTS=[
  {tag:'m1', from:CC_YEAR_FROM, playIn:/2026 Major 1 . Play-In/,
   lcq:/2026 Major 1 . Last Chance Qualifier/},
  // The Play-In weekend of Major 2, off Epic's own schedule.
  {tag:'m2', from:'2026-07-18', playIn:/2026 Major 2 . Play-In/,
   lcq:/2026 Major 2 . Last Chance Qualifier/}
];

/* Reload Championship (Paris) and Global Championship are the only world fields; everything else comes from
   ccEuCards, own region only. Without this a EU career's Paris field was 78 cards, all EU. The roster has
   ~2.6-2.9k cards in each other region.
   Region is a switch held for one field build and restored in finally, a leftover flag turns every cup into a
   world cup. Cached under its own key so both pools coexist. */
let CC_WORLD=false;
function ccPoolRegion(){ return CC_WORLD ? 'ALL' : ccCareerRegion(); }
// Run one field build as a world event. Restores whatever was set, always.
function ccAsWorld(fn){
  const was=CC_WORLD;
  CC_WORLD=true;
  try{ return fn(); } finally { CC_WORLD=was; }
}
/* Тот же переключатель, но на ЧУЖОЙ регион — сыграть неделю Северной Америки,
   оставаясь европейской карьерой.

   Отзыв: «чтоб твитер был и других регионов… могут ли игроки
   постить результаты своих матчей на других регионах». Всё, что для этого нужно,
   в файле уже лежит: у каждого из семи регионов свой пул пар и свой ростер
   (ccSceneRoster(reg), ccEuCards по ccPoolRegion) — не хватало только способа
   на время сказать «регион — вот этот». Тот же приём, что и у ccAsWorld:
   ставится на длину одного вызова и снимается в finally, потому что забытый
   флаг тихо пересадил бы всю карьеру в другой регион. См. careerRegionsWeek. */
let CC_REGION_AS=null;
function ccAsRegion(reg, fn){
  const was=CC_REGION_AS;
  CC_REGION_AS=reg;
  try{ return fn(); } finally { CC_REGION_AS=was; }
}
/* Рейтинг в карьере за год, а не за лучший вечер: среднее трёх лучших карточек года.
   По 901 европейцу 2026 (медиана / 90-й / макс / 85+ / 90+): максимум 73/87/99/135/61,
   лучшая половина 72/84/96/84/25, затухание 70.3/84/97/75/26, среднее 68/81/93/32/14.
   Максимум даёт 99 за одну ночь на Саммите, простое среднее валит всех, кто играл Опены.
   Окно фиксировано (3), а не половина результатов: иначе лишний турнир снижал рейтинг (Malibuca −2
   против vic0 при тех же топ-5). С тремя дуо читается как дуо (оба 97), медиана 69, выше 90 у 28.
   Только карьера (ccEuCards → careerPools), драфт и режимы FNCS не меняются. */
/* Вес этапа теми же весами, что карточка в драфте (ledger): Саммит 3.0, гранд-финал 2.0, хит 0.9,
   неделя дивизионного кубка 0.6, Плей-Ин 0.5, Ласт Ченс 0.4. Раунды, решающие только проход, стоят меньше
   титульного, поэтому див капы весят меньше финалов Мейджора и ЛАНов. Reload в ledger заглушён (CAREER_MUTE),
   его веса выбраны вручную: финал серии вровень с неделей дивизиона, хит и плей-ин вдвое ниже, опен ещё вдвое. */
// Вес голоса сцены, пока своих турниров мало: ровно вес одного гранд-финала
// Мейджора. См. ccSeasonOvr, там же и почему.
/* Вес несыгранного и перцентиль низа. Подобрано перебором по трём условиям: Toose (2 капа) заметно ниже G13ras
   (5 событий), NOCIF с одним финалом Reload не в тройке Европы, Д1 в среднем 76-82 (check-career-field).
     вес 2, низ 10%: д1 73.6 ✗  Toose 68  G13ras 77  NOCIF 67
     вес 1, низ 10%: д1 75.1 ✗  Toose 71  G13ras 78  NOCIF 71
     вес 2, низ 25%: д1 75.8 ✗  Toose 72  G13ras 78  NOCIF 71
     вес 1, низ 25%: д1 76.6 ✓  Toose 74  G13ras 78  NOCIF 75
     вес 1, низ 40%: д1 78.4 ✓  Toose 77  G13ras 79  NOCIF 80 ✗ */
const CC_SEASON_PRIOR=1;
const CC_SEASON_FLOOR_PCT=0.25;
const CC_STAGE_WEIGHT=[
  [/Summit .*Grand Finals/i, 3.0],
  // Всё остальное на ЛАНе — верхняя сетка, нижняя, группа — весит как хит: это
  // раунды, решающие, кто дойдёт до финала, а не сам финал. Одним правилом, а
  // не списком: у Саммита стадий больше, чем помнит любой список, и «Upper
  // Bracket» уже успел провалиться в вес по умолчанию.
  [/Summit/i,                0.6],
  [/Grand Finals/i,          2.0],
  [/Week \d+ Finals/i,      0.6],
  [/Last Chance/i,           0.4],
  [/Play-?In/i,              0.5],
  [/Reload.*Finals/i,        0.6],
  [/Reload.*(Heat|Play-?In)/i, 0.3],
  [/Reload.*Open/i,          0.15]
];
function ccStageWeight(ev){
  const e=String(ev||'');
  for(const [re, w] of CC_STAGE_WEIGHT) if(re.test(e)) return w;
  return 0.5;
}
const CC_SEASON_TOP=3;
let CC_SEASON_OVR=null;
/* Этапы года так, как их знает ledger драфта. Заполняется там же, где ledger
   строится, — см. CC_LEDGER_2026 в конце того блока.

   var без значения, и оба слова важны. var — потому что заполняется он тысячей
   строк выше этого места, а let оставил бы то присваивание в мёртвой зоне:
   ReferenceError на загрузке, который сносит весь скрипт. Без значения — потому
   что «= null» здесь выполнится уже после заполнения и сотрёт его. Объявление
   поднимается наверх, присваивание остаётся на месте: это и нужно. */
var CC_LEDGER_2026;
/* Год считается человеку, а не нику.
 *
 * В наборах 137 ников заняты дважды — разными людьми из разных сцен, — и без
 * региона в ключе год европейского p1ng складывался с годом азиатского: восемь
 * событий вместо четырёх, тройка лучших выбиралась из чужих вечеров. Тот же
 * недосмотр, что был в двух источниках национальности; см. ccNatRegions. */
function ccSeasonKey(c){ return (c && c.region || '')+'|'+hKey(c); }
let CC_SEASON_OVR_YEAR=null;
/* РЕЙТИНГ СЕЗОНА (18.10, его выбор: «старт + составы + рейтинг сезона»). Внутри года сцена живёт снимками
   (ccSnapshotNow: C5S1/C5S2/C5S3 и т.д.), и рейтинг теперь идёт за ними: в год идут только вечера по конец
   текущего сезона. Chap в 2024-м: в C5S1 у него полуфинал Мейджора 1 и слабый 2023-й, к C5S3 — гранд-финалы и
   Форт-Уэрт. Последний сезон года — весь год, как было. Только когда карьера играет свой год (календарь = год
   людей); годы после 2026-го — весь 2026-й. */
const CC_SNAPS_BY_YEAR=()=>({2019:CC_SNAPSHOTS_2019, 2020:CC_SNAPSHOTS_2020, 2021:CC_SNAPSHOTS_2021, 2022:CC_SNAPSHOTS_2022,
  2023:CC_SNAPSHOTS_2023, 2024:CC_SNAPSHOTS_2024, 2025:CC_SNAPSHOTS_2025, 2026:CC_SNAPSHOTS});
function ccRatingSnap(){
  /* Экран создания: сезон — выбранный на плитке года (ccPickedStart, иначе первый), чтобы список карточек
     показывал рейтинги того сезона, с которого начнётся карьера (его «каждый сезон пусть обновляются»). */
  if(typeof SHOWN_SCREEN!=='undefined' && SHOWN_SCREEN==='screen-career-create' && typeof CC!=='undefined' && CC && !CC_NOW_YEAR_FORCE){
    const list=CC_SNAPS_BY_YEAR()[ccNowYear()];
    if(!list || list.length<2) return null;
    let s=(typeof ccPickedStart==='function' && ccPickedStart()) || list[0];
    if(s && s.snap) s=list.find(x=>x.tag===s.snap) || s;
    const i=list.indexOf(s);
    if(i<0 || i===list.length-1) return null;
    return {tag:s.tag, cut:+String(list[i+1].from).replace(/-/g, ''), nextTag:list[i+1].tag};
  }
  const cr=(typeof CAREER!=='undefined' && CAREER && CAREER.career) || null;
  const Y=ccNowYear();
  // Рейтинг года «как у свежей карьеры» (ccRealTargets, ccDebutants ставят CC_NOW_YEAR_FORCE) — весь год, не сезон:
  // иначе он запоминался с тем снимком, что стоял в момент первого вызова (check-career-chapter-squads, 2027+).
  if(!cr || CC_NOW_YEAR_FORCE || ccCalYear()!==Y) return null;
  if(Y>=2026 && ccYearShift()>0) return null;   // 2027-й и дальше — тот же 2026-й, весь
  const list=CC_SNAPS_BY_YEAR()[Y];
  if(!list || list.length<2) return null;
  const s=ccSnapshotNow(), i=list.indexOf(s);
  if(i<0 || i===list.length-1) return null;
  const next=list[i+1];
  return {tag:s.tag, cut:+String(next.from).replace(/-/g, ''), nextTag:next.tag};
}
function ccRatingSnapTag(){ const r=ccRatingSnap(); return r ? r.tag : 'Y'; }
/* Сезон — порядок, год — шкала. Числа сезона считаются тем же расчётом по вечерам до его конца, а потом место
   человека в регионе переносится на числа всего года (как alignPrev переносит прошлый сезон): в начале года
   вечеров мало, вес несыгранного тянет середину вниз, и Д1 2026-го в Major 1 читался 74.5 при полосе 75–82
   (check-career-field). Порядок — сезона, шкала дивизионов — прежняя. */
let CC_SEASON_FULL={key:null, r:null};
function ccSeasonOvr(){
  const RS=ccRatingSnap(), rsKey=ccNowYear()+'|'+(RS ? RS.tag : 'Y');
  if(CC_SEASON_OVR && CC_SEASON_OVR_YEAR===rsKey) return CC_SEASON_OVR;
  CC_SEASON_OVR_YEAR=rsKey;
  if(CC_SEASON_FULL.key!==ccNowYear()) CC_SEASON_FULL={key:ccNowYear(), r:ccSeasonOvrCalc(null)};
  const full=CC_SEASON_FULL.r;
  if(!RS){ CC_SEASON_OVR=full.out; CC_SEASON_WORK=full.work; return CC_SEASON_OVR; }
  const part=ccSeasonOvrCalc(RS), regOf=k=>String(k).slice(0, String(k).indexOf('|'));
  const fullBy={}, partBy={};
  full.out.forEach((v, k)=>(fullBy[regOf(k)]=fullBy[regOf(k)] || []).push(v));
  part.out.forEach((v, k)=>(partBy[regOf(k)]=partBy[regOf(k)] || []).push(v));
  Object.values(fullBy).forEach(a=>a.sort((x,z)=>x-z)); Object.values(partBy).forEach(a=>a.sort((x,z)=>x-z));
  const out=new Map();
  part.out.forEach((v, k)=>{
    const a=partBy[regOf(k)], b=fullBy[regOf(k)];
    if(!b || b.length<10 || a.length<10){ out.set(k, v); return; }
    // Место — середина равных (у равных один номер), на шкалу года той же долей.
    let lo=0; while(lo<a.length && a[lo]<v) lo++;
    let hi=lo; while(hi<a.length && a[hi]===v) hi++;
    const f=((lo+hi-1)/2)/(a.length-1);
    out.set(k, b[Math.min(b.length-1, Math.max(0, Math.round(f*(b.length-1))))]);
  });
  CC_SEASON_OVR=out;
  CC_SEASON_WORK=Object.assign({}, part.work, {season:part.out, year:full.out});
  return out;
}
function ccSeasonOvrCalc(RS){
  // Кто в году есть, но по конец этого сезона ещё не играл — ниже, после смеси с прошлым.
  const allK=new Set();
  // Сколько веса вечеров года уже позади (по всем людям): вес несыгранного (CC_SEASON_PRIOR) — той же долей года.
  let wAll=0, wCut=0;
  const setT=(typeof YEAR_RATING!=='undefined' && YEAR_RATING && YEAR_RATING.setT) || {};
  const ledgerIn=set=>!RS || setT[set]==null || setT[RS.nextTag]==null || setT[set]<setT[RS.nextTag];
  const cardIn=c=>{ const d=ccCardDay(c); return !RS || !d || d<RS.cut; };
  // 2025-й: книга 2026-го не читается — рейтинг года складывается из карточек 2025-го (t1–t3).
  const LEDGER=ccNowYear()<2026 ? null : CC_LEDGER_2026;
  /* Один вечер — одна строка.

     Финалист Мейджора лежит в файле дважды: отдельной карточкой гранд-финала и
     своей квалификационной, переписанной по тому же гранд-финалу (см. блок с
     _M1G и _M2G — там rating пересчитывается, а event остаётся плей-инным).
     Максимуму было всё равно, какой из двух брать; среднему нет — лучший
     результат попадал в выборку дважды и тянул её вверх у всех, кто доходил до
     финала. Поэтому события сначала схлопываются по своему настоящему имени
     (gfEvent, если карточка переписана финалом), и от каждого остаётся лучшее
     число. */
  const by=new Map();
  const add=(k, ev, score, weight)=>{
    if(!(score>0)) return;
    const seen=by.get(k) || new Map();
    const cur=seen.get(ev);
    if(!cur || cur.score<score) seen.set(ev, {score:score, weight:weight});
    by.set(k, seen);
  };
  /* Этапы года из ledger, как их считает драфт. Карточных наборов меньше, чем событий (за 2026 девять недель
     кубка плюс хиты и Саммит, а наборы есть на четыре недели и без хитов), и по карточкам сравнения переворачивались:
     игрок с одним плей-ином вставал выше того, кто дошёл до гранд-финала. Та же карта мест, кривая и вес. */
  /* Человек засчитывается только в свой регион.
   *
   * Саммит — один ЛАН на все семь сцен, и в ledger он приклеен к каждому
   * региону: S40[reg].concat([summitStage]). Перебор «регион × этап» без
   * проверки записывал каждого участника ЛАНа во все семь регионов сразу —
   * peterbot, pollo, acorn и boltz оказались в европейской таблице с одним
   * этапом и рейтингом 99, задрали верх Европы и придавили нормировкой всех
   * настоящих европейцев: Scroll читался 91 вместо 96.
   *
   * Кто где играет, известно из самих наборов: карточка знает свой регион. */
  if(LEDGER){
    const here=new Set();
    PLAYERS_BASE.forEach(c=>{
      if(c.tier!=='cardmode') return;
      here.add((c.region||'')+'|'+String(c.handle||'').toLowerCase());
    });
    Object.keys(LEDGER).forEach(reg=>{
      LEDGER[reg].forEach(src=>{
        const ev=src.set+'|'+src.label+(src.nth!=null ? '|'+src.nth : '');
        Object.keys(src.map).forEach(h=>{
          const rank=src.map[h];
          if(!(rank>0)) return;
          const k=reg+'|'+h;
          if(!here.has(k)) return;
          allK.add(k); wAll+=src.weight;
          if(!ledgerIn(src.set)) return;
          wCut+=src.weight;
          add(k, ev, src.score(rank), src.weight);
        });
      });
    });
  }
  /* ---- И то, чего в ledger нет: Reload -----------------------------------
     Он там заглушён намеренно (CAREER_MUTE), но в карьере играется, значит
     чего-то стоить обязан. Читается с карточек, весами из CC_STAGE_WEIGHT. */
  PLAYERS_BASE.forEach(c=>{
    if(ccCardYear(c)!==ccNowYear()) return;
    if(LEDGER && !/^r[1-4]$/.test(String(c.cardSet||''))) return;
    /* Число этого вечера, а не карточки: attrsFor читает q.rating, а в него
       подмешаны три лучшие карточки человека за все годы. Правка: «не надо прошлые карточки притягивать к рейтингу, только
       2026 год». _eventOvr — то же число до подмеса, см. блок careerOf. */
    const o=(c._eventOvr!=null ? c._eventOvr : (attrsFor(c)||{}).ovr);
    if(!(o>0)) return;
    const ev=String((c.gfEvent || c.event) || '');
    allK.add(ccSeasonKey(c)); wAll+=ccStageWeight(ev);
    if(!cardIn(c)) return;
    wCut+=ccStageWeight(ev);
    add(ccSeasonKey(c), ev, o, ccStageWeight(ev));
  });
  const out=new Map();
  /* Взвешенное среднее по всему году, а не среднее трёх лучших.

     Здесь стояло окно из трёх, и оно решало две задачи сразу: не давать одному
     удачному вечеру определять человека и не наказывать за лишний турнир. Первую
     веса решают лучше — вечер, который ничего не решал, и весит мало, — а вторую
     они решают тем же способом, что и драфт: событие с малым весом почти не
     двигает среднее, поэтому играть больше по-прежнему не вредно.

     Ровно та формула, что показана на карточке в драфте: сумма (оценка × вес)
     делить на сумму весов. Правка. */
  /* Взвешенная сумма — и нормировка по региону следом, как в драфте.

     На карточке драфта это две последние строки: «Total / weight = 94.7» и
     «After the region is normalised = 96». Первую даёт среднее, вторую —
     растяжка: лучший в регионе читается по потолку своего региона (REGION_TOP),
     остальные пропорционально под ним. Без неё карьера давала на три пункта
     ниже драфта у того же человека — Scroll 93 против 96, — потому что среднее
     по всему году всегда ниже лучших вечеров, а потолок остаётся тем же.

     Растягивается регион целиком, а не каждый по отдельности: порядок людей
     от этого не меняется, меняется только шкала, на которой они стоят. */
  /* Число сыгранных событий входит в рейтинг: к своим вечерам добавляется вес несыгранного по нижнему краю региона (CC_SEASON_FLOOR_PCT).
     Без этого среднее по одному событию равно этому событию: один финал Reload с 4-м местом выводил в топ-3 Европы (вес 0.6 против 11.5 у Scroll).
     Якорь снизу, а не по середине сцены: середина поднимала тех, кто мало играл (2 капа и своё 78 давали 82).
     Это не штраф за качество, один хороший вечер всё равно выше одного плохого. */
  const raw=new Map(), byReg=new Map(), scene=new Map();
  const pre=new Map();
  by.forEach((seen, k)=>{
    let sum=0, w=0;
    seen.forEach(row=>{ sum+=row.score*row.weight; w+=row.weight; });
    if(!(w>0)) return;
    pre.set(k, {sum:sum, w:w});
    const reg=String(k).slice(0, String(k).indexOf('|'));
    const sc=scene.get(reg) || [];
    sc.push(sum/w); scene.set(reg, sc);
  });
  /* Низ региона — не самый плохой вечер в нём, а край основной массы: один
     разгромленный опен не должен решать, чего стоит несыгранный турнир. */
  const floors=new Map();
  const floorOf=reg=>{
    if(floors.has(reg)) return floors.get(reg);
    const list=(scene.get(reg)||[]).slice().sort((a,b)=>a-b);
    const v=list.length ? list[Math.floor(list.length*CC_SEASON_FLOOR_PCT)] : null;
    floors.set(reg, v);
    return v;
  };
  const PRIOR_W=CC_SEASON_PRIOR*((RS && wAll>0) ? wCut/wAll : 1);
  pre.forEach((p, k)=>{
    const reg=String(k).slice(0, String(k).indexOf('|'));
    const prior=floorOf(reg);
    const v=(prior!=null)
      ? (p.sum + prior*PRIOR_W)/(p.w + PRIOR_W)
      : p.sum/p.w;
    raw.set(k, v);
    const cur=byReg.get(reg);
    if(cur==null || v>cur) byReg.set(reg, v);
  });
  /* РЕЙТИНГ ГОДА КАК В ФИФЕ — те же доли, что у карточек драфта (yearRatingPass, YEAR_RATING.cfg):
     год, растянутый по региону, → 60% года + 40% чистого прошлого сезона (год назад, иначе два)
     + 1.5 за каждый финал до этого года (гранд-финал FNCS, World Cup, ЛАН), не больше двух;
     снова растяжка региона под потолок и сжатие верха (выше «потолок − 4» степенью 2).
     Статы события сюда не входят: в году карьеры есть этапы без строк статистики (недели кубка, хиты). */
  const FR=(typeof YEAR_RATING!=='undefined' && YEAR_RATING) || null, Y=ccNowYear();
  const topOf=reg=>(typeof REGION_TOP!=='undefined' && REGION_TOP[reg]!==undefined) ? REGION_TOP[reg] : null;
  const blended=new Map(), hi2=new Map(), lo2=new Map(), stage1=new Map(), prevRaw=new Map(), prevAl=new Map();
  raw.forEach((v, k)=>{
    const reg=String(k).slice(0, String(k).indexOf('|'));
    const hi=byReg.get(reg), top=topOf(reg);
    stage1.set(k, (top!=null && hi>0) ? v*(top/hi) : v);
    if(FR){ const pu=FR.pure[k] || {};
      const prev=pu[Y-1]!=null ? pu[Y-1] : pu[Y-2]!=null ? pu[Y-2] : null;
      if(prev!=null) prevRaw.set(k, prev); }
  });
  /* Прошлый сезон — на шкалу этого года по месту в очереди (как у карточек драфта, см. alignPrev в yearRatingPass):
     место человека среди тех, у кого в регионе есть прошлый сезон, переносится на числа года после растяжки. */
  // Рейтинг сезона: в году есть, по конец сезона не играл — его прошлый сезон (на той же шкале), без него — низ региона.
  const prevMiss=new Map(), missing=[];
  if(RS) allK.forEach(k=>{ if(raw.has(k)) return; missing.push(k);
    const pu=FR && FR.pure[k] || {}; const prev=pu[Y-1]!=null ? pu[Y-1] : pu[Y-2]!=null ? pu[Y-2] : null;
    if(prev!=null) prevMiss.set(k, prev); });
  { const AL={};
    prevRaw.forEach((p, k)=>{ const reg=String(k).slice(0, String(k).indexOf('|'));
      const m=AL[reg]=AL[reg] || {a:[], b:[]}; m.a.push(p); m.b.push(stage1.get(k)); });
    Object.values(AL).forEach(m=>{ m.a.sort((x,z)=>x-z); m.b.sort((x,z)=>x-z); });
    const align=(p, k, to)=>{ const m=AL[String(k).slice(0, String(k).indexOf('|'))];
      if(!m || m.a.length<10){ to.set(k, p); return; }
      let i=0; while(i<m.a.length && m.a[i]<p) i++;
      to.set(k, m.b[Math.min(m.b.length-1, Math.round(i/(m.a.length-1)*(m.b.length-1)))]); };
    prevRaw.forEach((p, k)=>align(p, k, prevAl));
    prevMiss.forEach((p, k)=>align(p, k, prevMiss)); }
  stage1.forEach((s1, k)=>{
    const reg=String(k).slice(0, String(k).indexOf('|'));
    let b=s1;
    if(FR){
      const prev=prevAl.get(k);
      if(prev!=null) b=Math.max((1-FR.cfg.prevW)*b + FR.cfg.prevW*prev, b-(FR.cfg.dropCap!=null ? FR.cfg.dropCap : 99));
      b+=FR.cfg.expPts*Math.min(FR.cfg.expCap, (FR.finals[k] || []).filter(t=>t<Y).length);
    }
    blended.set(k, b);
    if(!(hi2.get(reg)>=b)) hi2.set(reg, b);
    if(!(lo2.get(reg)<=b)) lo2.set(reg, b);
  });
  missing.forEach(k=>{
    const reg=String(k).slice(0, String(k).indexOf('|'));
    let b=prevMiss.has(k) ? prevMiss.get(k) : floorOf(reg);
    if(b==null) return;
    if(FR) b+=FR.cfg.expPts*Math.min(FR.cfg.expCap, (FR.finals[k] || []).filter(t=>t<Y).length);
    // В растяжку региона не входят: шкалу задают те, кто в этом году уже играл.
    blended.set(k, Math.min(b, hi2.has(reg) ? hi2.get(reg) : b));
  });
  blended.forEach((b, k)=>{
    const reg=String(k).slice(0, String(k).indexOf('|'));
    /* Вторая растяжка — с низом на месте, как у карточек драфта: опыт и прошлый сезон поднимают верх, и умножение
       от нуля опустило бы под ним всю середину региона. */
    const top=topOf(reg), hi=hi2.get(reg), lo=lo2.get(reg);
    let scaled=(top!=null && hi>lo) ? lo+(b-lo)*(top-lo)/(hi-lo) : b;
    if(FR && top!=null){ const K=top-FR.cfg.knee;
      if(scaled>K) scaled=K+(top-K)*Math.pow(Math.min(1, (scaled-K)/(top-K)), FR.cfg.gamma); }
    out.set(k, Math.round(clamp(scaled, 30, CAREER_SCALE_TOP)));
  });
  // Промежуточные числа — для сторожа (check-career-season-rating): год после первой растяжки, смесь ФИФЫ, края региона.
  return {out, work:{stage1, blended, lo2, hi2, prevAl}};
}
let CC_SEASON_WORK=null;
let CC_EU_ALL={};
function ccEuCards(){
  // Карьера, перешедшая в следующий год, держит ещё и дебютантов (ccDebutants) — своим ключом.
  const debut=ccDebutants();
  // Переехавшие за год (ccMovedAway) — в пуле только того региона, где они в этот день.
  ccRegenSync();
  const reg=ccPoolRegion()+(ccNowYear()<2026 ? '|'+ccNowYear() : '')+(debut ? '|d'+ccCalYear() : '')+ccMoversTag()+'|r'+ccRatingSnapTag()+ccRegenTag();
  if(CC_EU_ALL[reg]) return CC_EU_ALL[reg];
  const season=ccSeasonOvr();
  const reg0=ccPoolRegion(), yearCap=ccNowYear();
  // 2025-й год: сцена — люди 2025-го, карт позже того года не существует.
  CC_EU_ALL[reg]=(reg0==='ALL' ? PLAYERS.slice() : PLAYERS.filter(p=>(p.region||'')===reg0 && !ccMovedAway(p, reg0)))
                   .filter(p=>(yearCap>=2026 || ccCardYear(p)<=yearCap) && !ccRegenGone(p))
                   .map(p=>{
                     const c={...p};
                     const a=attrsFor(p);
                     c._ovr=a.ovr; c._k=hKey(p);
                     // Ключ года — с регионом (ccSeasonKey), а _k без него:
                     // _k опознаёт человека внутри уже отфильтрованного по
                     // региону пула, и менять его значило бы трогать всё, что
                     // на нём стоит. Разные вопросы — разные ключи.
                     const yr=ccCardYear(p)===ccNowYear() ? season.get(ccSeasonKey(p)) : null;
                     if(yr!=null && yr!==c._ovr){
                       /* Свой набор шести чисел, а не общий с настоящей
                          карточкой: attrsFor сдвигает их к _targetOvr прямо в
                          том объекте, который ему дали, а он у копии и у
                          оригинала один и тот же. Без этой строки сезонный
                          рейтинг переписал бы карточку во всём приложении.
                          Форма при этом сохраняется — сдвигаются все шесть
                          разом, — так что измеренные с лидерборда aim и sur
                          остаются собой. */
                       c._attrs={...a, _floored:false};
                       c._targetOvr=yr; c.rating=yr; c._ovr=yr;
                     }
                     return c;
                   });
  if(debut && debut.size){
    PLAYERS.forEach(p=>{
      if(reg0!=='ALL' && (p.region||'')!==reg0) return;
      const d=debut.get(hKey(p));
      if(d && ccCardYear(p)===d.year) CC_EU_ALL[reg].push(ccDebutCard(p, d));
    });
  }
  ccRegenCards(reg0).forEach(g=>CC_EU_ALL[reg].push({...g}));
  return CC_EU_ALL[reg];
}
// One card per person inside one set of events — the strongest, because a
// person who played the Play-In and its sessions is the same person and the
// card that survived the furthest is the one that describes them.
// The floor of Division 1's own band. The spec's line is that it runs about 75
// to 96, and the year recorded pairs well below that - taking every pair dropped
// the room's average rating to 70, which is Division 3, and a Division 1 that
// reads as Division 3 is not a division.
const CC_D1_FLOOR=75;
function ccPeopleOf(re){
  const m=new Map();
  ccEuCards().forEach(c=>{
    if(!re.test(String(c.event||''))) return;
    const cur=m.get(c._k);
    if(!cur || c._ovr>cur._ovr) m.set(c._k, c);
  });
  return m;
}
// The pairs that set recorded, both halves resolved inside it. A duo is only as
// real as both its halves: if one of them is not in the set the pair is dropped
// rather than completed from somewhere else.
function ccDuosOf(re, people){
  const seen=new Map();
  ccEuCards().forEach(c=>{
    if(!re.test(String(c.event||''))) return;
    rosterEntriesOf(c).forEach(({entry})=>{
      // The 2025 sets hold trios in the same shape; a Division cup plays duos.
      /* В 2025-м году трио — это настоящий состав: первые двое — ядро пары,
         третий запоминается и пишется в cr.trios (careerPools), а не
         разыгрывается рынком. */
      /* И тройки (и сквады — ядро и третий) прошлых лет: в трио-сезонах 2019–2023 записи трио
         пропускались целиком, и настоящих троек в пуле не было вовсе (замер 30.09). */
      const trio=ccNowYear()<2026 && entry.duo.length>=3;
      if(entry.duo.length!==2 && !trio) return;
      const keys=entry.duo.slice(0,2).map(h=>hKey(h)).sort(), id=keys.join('|');
      if(seen.has(id)) return;
      const a=people.get(keys[0]), b=people.get(keys[1]);
      if(!a || !b) return;
      const third=trio ? people.get(hKey(entry.duo[2])) : null;
      seen.set(id, {cards:[a, b], avg:(a._ovr+b._ovr)/2, third:third ? (third._k||hKey(third)) : null});
    });
  });
  return [...seen.values()];
}
// Seat the pairs, strongest first, skipping anybody already standing somewhere.
// `seated` is carried from rung to rung, which is the whole no-repeat rule.
function ccSeat(duos, seated){
  const out=[];
  duos.slice().sort((a,b)=>b.avg-a.avg).forEach(d=>{
    const ka=d.cards[0]._k, kb=d.cards[1]._k;
    if(seated.has(ka) || seated.has(kb)) return;
    seated.add(ka); seated.add(kb);
    out.push(d);
  });
  return out;
}
function ccSnapshotNow(){
  /* В ТРИО-ГОД СНИМОК ОДИН НА ВЕСЬ СЕЗОН.

     Снимок переключается 18 июля на Плей-Ин второго Мейджора — в дуо-год это
     правда Epic: пары к лету другие, и комната честно их показывает. В трио-год
     пара — это ядро тройки, которую рынок (careerTrioRaids) собрал на стыке года
     и записал в cr.trios по ключу пары. Замер (scratchpad trio-time-probe, D1,
     сезон 2): до 6 июля из 119 пар пула на месте все 119, средний разрыв третьего
     −0.6…−1.2; 20 июля пар на месте 25 из 119, троек первой недели в комнате 9 из
     79, память троек растёт с 342 до 434 (все — новые составы), разрыв −2.2.
     Игрок: «когда начинается второй сезон, формируются норм
     триосы, но через месяц опять максимально не настоящие триосы формируются».
     Правило: «в начале сезона изменения только, если они
     нужны, а не каждый кап». Дуо-год не тронут. */
  const today=careerToday();
  // 2025: снимок идёт за Мейджором — составы того года измерены по каждому.
  // Люди 2025-го: снимок по Мейджорам 2025-го; во втором году карьеры (календарь 2026-й) — последний, t3.
  if(ccNowYear()===2025){ let s25=CC_SNAPSHOTS_2025[0]; CC_SNAPSHOTS_2025.forEach(s=>{ if(today>=s.from) s25=s; }); return s25; }
  // Люди 2024-го: снимок по Мейджорам 2024-го; дальше (календарь 2025/2026) — последний, f3.
  if(ccNowYear()===2024){ let s24=CC_SNAPSHOTS_2024[0]; CC_SNAPSHOTS_2024.forEach(s=>{ if(today>=s.from) s24=s; }); return s24; }
  // 2019–2023 — по сезону (снимки с датами), как 2024/2025.
  const past={2023:CC_SNAPSHOTS_2023, 2022:CC_SNAPSHOTS_2022, 2021:CC_SNAPSHOTS_2021, 2019:CC_SNAPSHOTS_2019, 2020:CC_SNAPSHOTS_2020}[ccNowYear()];
  if(past){ let sp=past[0]; past.forEach(x=>{ if(today>=x.from) sp=x; }); return sp; }
  let snap=CC_SNAPSHOTS[0];
  if(typeof careerSquadSize==='function' && CAREER && CAREER.career && careerSquadSize()===3) return snap;
  CC_SNAPSHOTS.forEach(s=>{ if(today>=s.from) snap=s; });
  return snap;
}
let CC_POOLS=null;
/* Пулы чужих регионов — отдельной полкой, по коду региона. Своя полка одна и
   вытесняется любой сменой региона; если бы неделя Северной Америки ложилась
   на неё, следующий же вызов у себя дома пересобирал бы европейский пул, и так
   семь раз каждое воскресенье. Чистится вместе со своей: сброс CC_POOLS=null
   стоит в шести местах (трансфер, переезд, новый сезон), и здесь он читается
   как «всё устарело». */
let CC_POOLS_AWAY={};
/* СОСТАВЫ ГОДА КАЛЕНДАРЯ — для карьеры, перешедшей в следующий год.

   Отзыв: «когда настоящий сезон 24 заканчивал и переходил в 25, чтобы
   триосы становились как в жизни, и потом когда из 25 года в 26». Решение: люди и рейтинги остаются свои (карьера живёт
   людьми года, с которого началась, с тем, что они наиграли), а КТО С КЕМ
   играет — берётся из записей года календаря: трио 2025-го, дуо 2026-го.
   Состав игрока не меняется — он со своим напарником ищет +1.

   Снимок года календаря — тот же, что взяла бы свежая карьера этого года
   (Мейджоры по датам); записи — с карточек этого года. В состав сажаются
   только те, кто есть на сцене карьеры: нет человека в мире карьеры — его
   место пустое, двое оставшихся стоят парой, один — свободным агентом. */
function ccRealSnap(year){
  const list=year===2025 ? CC_SNAPSHOTS_2025 : year===2024 ? CC_SNAPSHOTS_2024 : year===2023 ? CC_SNAPSHOTS_2023 : year===2022 ? CC_SNAPSHOTS_2022 : year===2021 ? CC_SNAPSHOTS_2021 : year===2019 ? CC_SNAPSHOTS_2019 : year===2020 ? CC_SNAPSHOTS_2020 : CC_SNAPSHOTS;
  const today=careerToday();
  let s=list[0]; list.forEach(x=>{ if(today>=x.from) s=x; });
  return s;
}
function ccRealTeamDuos(year, snap){
  const res=[snap.playIn];
  if(snap.lcq) res.push(snap.lcq);
  if(year>=2026) res.push(/Division 1 . Week \d+ Finals/);
  const reg0=ccPoolRegion();
  /* Люди мира карьеры: по человеку одна карточка — своего года, иначе карточка
     дебюта (ccDebutants), иначе сильнейшая из прошлых. */
  const people=new Map(), yr=ccNowYear();
  const rankOf=c=>ccCardYear(c)===yr ? 2 : c._debut ? 1 : 0;
  ccEuCards().forEach(c=>{
    const cur=people.get(c._k);
    if(!cur) { people.set(c._k, c); return; }
    const a=rankOf(c), b=rankOf(cur);
    if(a>b || (a===b && c._ovr>cur._ovr)) people.set(c._k, c);
  });
  const seen=new Map();
  PLAYERS.forEach(p=>{
    if(reg0!=='ALL' && (p.region||'')!==reg0) return;
    if(ccCardYear(p)!==(snap.yr||year)) return;
    const ev=String(p.event||'');
    if(!res.some(r=>r.test(ev))) return;
    rosterEntriesOf(p).forEach(({entry})=>{
      const hs=(entry.duo||[]).map(h=>hKey(h)).filter(Boolean);
      if(hs.length<2) return;
      const id=hs.slice().sort().join('|');
      if(!seen.has(id)) seen.set(id, hs);
    });
  });
  const out=[];
  seen.forEach(hs=>{
    const here=hs.filter(h=>people.has(h));
    if(here.length<2) return;
    const a=people.get(here[0]), b=people.get(here[1]);
    const third=here.length>2 ? here[2] : null;
    out.push({cards:[a, b], avg:(a._ovr+b._ovr)/2, third:third, _real:true});
  });
  return out;
}
/* Настоящий состав года разводится только тем, что случилось В ЭТОМ году:
   прошлогодние разводы и межсезонный бросок (ccDuoBroken считает его от
   номера сезона) к составу, который собрала сама жизнь, не относятся. */
function ccRealTeamBroken(d, cr){
  const c=cr || (CAREER && CAREER.career);
  const key=d.cards.map(x=>hKey(x)).sort().join('+');
  const when=c && (c.duoSplits||{})[key];
  return !!(when && String(when)>=ccYearFrom());
}
/* Размер состава в ключе кэша пула — только в команде: там пул капа другого формата сеется книгой мира хозяина
   (ccWorldPoolsSeed) до сборки поля. В гонке и в одиночной — как было: кап другого формата берёт пул года из кэша.
   С размером в ключе гонка пересобирала пул под тройки посреди сборки поля, у каждого в своё время — онлайн-прогон
   гонки 2025 (22.10): FNCS Trial 7.12, поле 1707 у одного и 1700 у другого. */
function ccPoolSizeOk(p){
  const team=typeof ccMpTeam==='function' && ccMpTeam() && !(typeof ccRaceOn==='function' && ccRaceOn());
  return !team || p.size===careerSquadSize();
}
function careerPools(){
  const snap0=ccSnapshotNow();
  // Карьера, перешедшая в следующий год: составы — года календаря (ccRealTeamDuos).
  const cont=ccChapterMoved();
  const real=cont ? ccRealSnap(ccCalYear()) : null;
  // Посев троек — по снимку года, кэш пула — ещё и по неделе потенциала (ccRealPull):
  // иначе недельная пересборка стирала бы тройки каждую неделю.
  const seedTag=real ? 'R'+ccCalYear()+real.tag : snap0.tag;
  const snap=real ? Object.assign({}, snap0, {tag:seedTag+'p'+ccRealPullStep()}) : snap0;
  // The world pool is cached under its own key beside the region's. See ccAsWorld.
  const reg=ccPoolRegion();
  if(!CC_POOLS) CC_POOLS_AWAY={};
  if(CC_REGION_AS){
    const away=CC_POOLS_AWAY[reg];
    if(away && away.tag===snap.tag && ccPoolSizeOk(away)) return away;
  } else if(CC_POOLS && CC_POOLS.tag===snap.tag && CC_POOLS.reg===reg && ccPoolSizeOk(CC_POOLS)) return CC_POOLS;
  const seated=new Set();
  const duos=real ? ccSeat(ccRealTeamDuos(ccCalYear(), real), seated)
                  : ccSeat(ccDuosOf(snap.playIn, ccPeopleOf(snap.playIn)), seated);
  /* 2025: третьи — с карточек, один раз на снимок. Записываются в ЖИВУЮ
     карьеру, потому что читает их комната оттуда (careerCupField). То же в
     трио-году карьеры, перешедшей из 2024-го: третьи — настоящие 2025-го, и
     память троек прошлых лет им не мешает (стирается при посеве). */
  let triSeed=false;
  if((ccNowYear()<2026 || real) && careerSquadSize()>=3 && CAREER && CAREER.career && !CC_REGION_AS && CAREER.career.triosSeeded!==seedTag){
    triSeed=true;
    const cr=CAREER.career; cr.trios=(real || ccNowYear()<2025) ? {} : (cr.trios||{});
    duos.forEach(d=>{ if(d.third && !seated.has(d.third)){
      // Третий с записи садится поверх добранного (pastFill ниже): прошлым снимком он мог стоять третьим у другой пары.
      Object.keys(cr.trios).forEach(k=>{ if(cr.trios[k]===d.third) delete cr.trios[k]; });
      cr.trios[d.cards.map(c=>hKey(c)).sort().join('+')]=d.third; seated.add(d.third); } });
    if(real) ccContinuityThirds(duos, seated, cr);
    cr.triosSeeded=seedTag;
    if(typeof careerSave==='function') careerSave();
  }
  /* И те, кто зашёл в Мейджор с другой стороны.

     Правило: в дивизионе 1 те команды, которые были в Плей-Ине
     или квалифицировались через Ласт Ченс. Это определение событием, а не
     порогом рейтинга, и оно и есть настоящее: в дивизион 1 попадают не потому,
     что число большое, а потому, что прошли туда. Ласт Ченс — вторая дверь в
     Мейджор, единственная, открытая любому дивизиону, и вышедший из неё стоит
     в том же турнире, что и вышедший из Плей-Ина.

     Порога тут больше нет и не нужно: CC_D1_FLOOR отбирал по числу из списка
     всех записанных за год пар — из тех, кто мог вообще не играть Мейджор, — и
     сам же не применялся к Плей-Ину, поэтому в комнате стояли пары по 65 при
     заявленной отсечке 75. Событие отвечает на этот вопрос честнее числа. */
  /* Then every other recorded pair of the year.
     The Play-In field alone is 152 duos, while the year has 1,719 EU cards in 728 recorded pairs (other Major, Reload, qualifiers).
     Only recorded pairs, never made-up ones. Play-In pairs go first as this month's field, then ccSeat takes the rest strongest-first, nobody in two duos.
     Limited to Division 1's band (~75-96): taking everyone dropped the room average to 70, which is Division 3. */
  // Карьере, перешедшей в следующий год, Ласт Ченс и финалы недель уже взяты
  // из года календаря (ccRealTeamDuos); прошлогодние пары сюда не идут.
  if(snap.lcq && !real) ccSeat(ccDuosOf(snap.lcq, ccPeopleOf(snap.lcq)), seated)
                 .forEach(d=>duos.push(d));
  /* Третьи с ПОЛУФИНАЛОВ и отборочных — тоже (25.10, его «посмотри в других сезонах все норм ли»). Посев выше видел
     только пары гранд-финала, а у 2019–2024 карточки гранд-финала составов не несут или не находятся регуляркой
     снимка вовсе («FNCS Chapter 2 Season 5 — Grand Finals» против /2021 C2S5 . Grand Finals/). Пары сцены приходили
     отсюда, с третьими (2021 C2S5: 137 пар, у 130 записан третий), а в cr.trios не попадал ни один: трио-сезоны
     2019–2021 стояли без троек, топы — без состава (2021: rezon ay, Chapix, Th0masHD, Mongraal… 17 из топ-40). */
  if(triSeed){
    const cr=CAREER.career, used=new Set(Object.values(cr.trios||{}));
    duos.forEach(d=>{
      if(!d.third || seated.has(d.third) || used.has(d.third)) return;
      const key=d.cards.map(c=>hKey(c)).sort().join('+');
      if(cr.trios[key]) return;
      cr.trios[key]=d.third; used.add(d.third); seated.add(d.third);
    });
    if(typeof careerSave==='function') careerSave();
  }
  /* И финалы недели самого дивизиона.

     Правило: в дивизионе 1 остаются только игроки — те, кто
     был в Плей-Ине либо прошёл Ласт Ченс. Пары, записанные где-то ещё за год,
     отсюда уходят: человек, отыгравший опен Reload, этим в дивизион 1 не
     попадает, а раньше попадал, если рейтинг перевалил за CC_D1_FLOOR. Порог
     был числом вместо ответа на вопрос «а он вообще туда квалифицировался».

     Третья дверь — сами финалы недели дивизиона 1: играть их может только тот,
     кто в дивизионе стоит, так что это его состав по определению, и в нём есть
     люди, которых нет ни в одном Плей-Ине. */
  /* Здесь с 28 августа стояло «Week d+» — обратный слэш потерялся при правке,
     и регулярка искала букву d: третья дверь не открывалась ни разу. */
  const divRe=/Division 1 . Week \d+ Finals/;
  if(!real) ccSeat(ccDuosOf(divRe, ccPeopleOf(divRe)), seated).forEach(d=>duos.push(d));
  /* Рост сцены из книги в пуле. careerPools кэшируется по снимку и региону и книгу не видел, поэтому сцена росла
     в сейве, а на экране стояла. Поднимается копия: ccPeopleOf отдаёт общие объекты из ccEuCards, а ccSceneLift
     пишет в переданный объект, правка на месте переписала бы человека везде, включая драфт (см. ccSceneRoster).
     Копия на человека одна, иначе половинки дуо, стоящего в двух парах, разъедутся по рейтингу. */
  const lifted=new Map();
  const liftOne=c=>{
    if(!c) return c;
    const k=hKey(c);
    if(lifted.has(k)) return lifted.get(k);
    const out=(careerDevOf(c) || ccRealPull(c) || ccSceneDrift(c)) ? ccSceneLift({...c}) : c;
    lifted.set(k, out);
    return out;
  };
  /* Пары, распавшиеся по ходу сезона, стоят врозь — пункт 14 страницы «ы».
     Развод записан в CAREER.splits (careerGrowField); пара уходит из duos, её
     половинки не попадают в pooled и ниже сами становятся свободными
     агентами — теми же, из которых собираются третьи и новые составы. */
  const splitBook=(CAREER && CAREER.splits) || {};
  /* Плюс разведённые межсезоньем (ccDuoBroken) и трансферы.
     Без пересборки мир вымирает (tools/duo-churn-probe.js): к 5-му сезону пул 173 → 57 пар,
     комната Д1 169 → 49 команд, а ccOrphanPairs собирает только тех, кого осиротил сам игрок.
     Здесь свободные сходятся заново по силе, соседи по таблице, с сезонным броском внутри пары. */
  /* Кого позвали третьим — тот не «половинка», а состав.

     Когда верхняя пара забирает человека (careerTrioRaids), его пара
     распадается: на рынок идёт БРОШЕННЫЙ, а сам он уже в тройке, и сводить его
     с кем-то в новую пару значило бы отменить трансфер на том же кадре. Кто
     где — написано в памяти троек: значения cr.trios это и есть третьи. */
  const inTrio=new Set(Object.values((CAREER && CAREER.career && CAREER.career.trios) || {}));
  /* РАЗОШЛИСЬ — ЗНАЧИТ, КАКОЕ-ТО ВРЕМЯ СТОЯТ ВРОЗЬ.

     Пересборка ниже работала в тот же тик, что и развод: половинки уходили в
     freed и тут же сходились обратно, чаще всего друг с другом — они же ближе
     всего по рейтингу. Со стороны это выглядело так, будто разводов нет вовсе:
     пост «я больше не в дуо с @x» в ленте есть, а свободного агента в мире не
     существует ни одного дня, и звать некого.

     Поэтому свежий развод держит человека на рынке две недели: он стоит в
     players свободным агентом (вечера и третьи кресла берут его оттуда, как
     брали), носит статус F/A и держит открытой анкету. Через две недели он
     возвращается в общую пересборку — там же, где сходятся все остальные, и
     сойтись может хоть с бывшим: воссоединения тоже бывают. */
  const CC_FA_DAYS=14;
  const today=careerToday();
  const freed=[];
  const duosLive=duos.filter(function(d){
    const k=d.cards.map(c=>hKey(c)).sort().join('+');
    const split=splitBook[k];
    const broken=!!split || (d._real ? ccRealTeamBroken(d) : ccDuoBroken(d));
    if(broken) d.cards.forEach(c=>{
      if(!c || inTrio.has(hKey(c))) return;
      if(split && ccDaysBetween(split, today)<CC_FA_DAYS) return;   // ещё на рынке
      freed.push(c);
    });
    return !broken;
  });
  /* В ТРИО-ГОД брошенный ищет третье кресло, а не новую пару.

     Правка. Рынок трио (careerTrioRaids) разбирает треть пар, чтобы
     их людьми закрыть третьи кресла, — а через две недели ccRemadeDuos сводил
     этих же людей обратно в дуо, и комната опять оставалась без свободных:
     замер показал «vic0 & t3eny» и «Shxrk & SwizzY» — пары, собранные из
     брошенных, — с третьим на 16 и 10 ниже себя. В год, который играется
     втроём, пар и не должно становиться больше: их должно становиться меньше
     ровно на треть. Пересборка возвращается в дуо-год. */
  if(careerSquadSize()!==3) ccRemadeDuos(freed).forEach(d=>duosLive.push(d));
  /* Дуо-год карьеры 2025-го: сцена — люди 2025-го, настоящих пар 2026-го у неё
     нет. Ядра трио 2025-го уже стоят парами (ccDuosOf); все свободные сцены
     не ниже полосы Дивизиона 1 собираются в пары сами — сначала те, кто играл
     вместе на записи (ccRemadeDuos), остальные — сосед по силе с соседом. */
  // И после 2026-го (регены, ccRegenSync): напарник ушёл из сцены — половинка и новички сходятся по силе так же.
  /* И в прошлых годах, начатых с них (25.10): снимок там — сквады C2S1 (2020 до 19.02) или соло/дуо World Cup (2019), и
     из четвёрок и одиночек пары складываются не у всех — без пары в топ-40 стояли 23 (2020: aqua 96, nayte, nyhrox…)
     и 16 (2019: Tchub, Domentos, Skailer…), в 2024-м трое (Mikson 91, dyox, Flickzy). */
  if(careerSquadSize()!==3 && (ccChapterMoved() || ccRegenOn() || ccPastYear(ccCalYear()))) ccContinuityDuos(duosLive);
  // Трио-год такой карьеры: ядра троек, собранных на стыке из свободных (ccContinuityThirds).
  /* ТРИО-ГОД ПОСЛЕ 2026-ГО У КАРЬЕРЫ, НАЧАТОЙ В 2026-М (25.10, его «что ещё может быть не так с чаптером, мб потом
     распадаются триосы»). Рассадка третьих на стыке (ccContinuityThirds) стояла только у карьеры, перешедшей из
     прошлого года (ccChapterMoved): у начатой в 2026-м третьи садились лениво — когда пара впервые попадала в комнату
     трио-капа. Проба (трио-год 2027, день за днём): с 15.12 до 13.02 полных троек 3 из 136 пар, без состава в топ-40
     шестеро (PabloWingu 94, Sky 93, Tjino 92, panzer, Pixx, Momsy) — «команды сломались» на старте года.
     Теперь раз за сезон, после рынка трио (тот собирает пул мира — CC_WORLD, здесь не сеем) и по ЖИВЫМ парам пула:
     развод и «жизнь пары» (ccDuoBroken) к этому месту уже отработали. По сырым парам снимка рассадка сажала третьего к
     паре, которую пул тут же выбрасывал, и её люди стояли без состава весь год (PabloWingu в той же пробе). */
  /* Трио-этапы прошлых лет (2019 Season X, 2020 C2S4, 2021, 2022): записанные третьи садятся посевом снимка выше
     (triSeed), а сильные свободные, кому пары с записью не хватило, оставались без состава весь этап — 2019 с 1.08:
     Tchub 90, Skailer, Vato, Deadra…; 2020 с 27.08: Snayzy, Twainz, FrenzyFishy, Klusia. Добор тот же — в тот же
     проход, что посев снимка, поэтому метка посева остаётся его.
     И 2025 (25.10, его «пусть с первого дня будут полными»): снимок 7.12 даёт третьих не всем — у 8 из топ-30 пар
     (Nebs+Pinq, Scroll+Sky, Mongraal+MrSavage…) третьего не было до снимка 21.02, Kiro стоял без состава. */
  const pastFill=triSeed && !real && ccPastYear(ccCalYear());
  const cycleFill=!real && ccYearShift()>0 && CAREER && CAREER.career && CAREER.career.triosSeeded!=='Y'+CAREER.career.season;
  if((pastFill || cycleFill) && !CC_WORLD && careerSquadSize()===3 && !CC_REGION_AS && CAREER && CAREER.career){
    const cr=CAREER.career; cr.trios=cr.trios||{};
    const took=new Set(); duosLive.forEach(d=>d.cards.forEach(c=>took.add(hKey(c)))); Object.values(cr.trios).forEach(k=>took.add(k));
    ccContinuityThirds(duosLive, took, cr);
    if(cycleFill) cr.triosSeeded='Y'+cr.season;
    if(typeof careerSave==='function') careerSave();
  }
  if(careerSquadSize()===3 && (real || ccYearShift()>0 || ccPastYear(ccCalYear())) && !CC_REGION_AS) ccContinuityCores(duosLive);
  duosLive.forEach(d=>{ if(d && d.cards) d.cards=d.cards.map(liftOne); });
  /* И все остальные имена ростера — свободными агентами.

     Отзыв («расширь»): в открытом трио-поле все 173 реальные
     пары получали выдуманного третьего, потому что players был просто суммой
     пар — неспаренных реальных в пуле стояло ровно ноль
     (career-pool-thirds-probe.js). Ростер держит девятьсот карточек с
     измеренными рейтингами; кто не стоит в записанной паре, встаёт в players
     свободным — третьим к реальной паре теперь садится настоящий человек, а
     окно рейтинга, в котором его выбирают, держит ccPickThird, как держал. */
  const pooled=new Set();
  duosLive.forEach(d=>d.cards.forEach(c=>pooled.add(hKey(c))));
  const players=duosLive.reduce((a,d)=>a.concat(d.cards), []);
  careerRosterNowEU().forEach(p=>{
    const k=hKey(p);
    if(pooled.has(k)) return;
    pooled.add(k);
    // Копия со своим _k: ростерные объекты общие со всем приложением, а _k —
    // ключ, по которому пул считает людей и careerRealPlayers режет занятых.
    const c=(careerDevOf(p) || ccRealPull(p) || ccSceneDrift(p)) ? ccSceneLift({...p}) : {...p};
    c._k=k;
    players.push(c);
  });
  /* Размер состава — в ключе кэша (онлайн-прогон 2019 года, 22.10: трио-кап в дуо-год командой — у одного пул остался
     собранным дуо-днём и третьих не посеял, другой собрал его под трио; «blax+issa+mitr0 vs kinstaar+mitr0+oslo»). */
  const built={tag:snap.tag, reg:reg, duos:duosLive, players, size:careerSquadSize()};
  if(CC_REGION_AS){ CC_POOLS_AWAY[reg]=built; return built; }
  CC_POOLS=built;
  return CC_POOLS;
}
// The real pairs a lobby can seat — Division 1's own, or an open event's, which
// take the same 150 because Division 1 is the only rung with real names in it.
// `taken` is who is already seated: you, your partner, and anybody a duo above
// this one used.
//
// Shuffled rather than taken from the top, so the division is not the same
// fifty teams every week.
/* A half whose pair lost a member to the player gets re-paired instead of dropped. Seating is by pair, so before
   this the whole pair vanished from the division for the season. First try another duo the year recorded for
   them (most have two or three across Majors and Reload), then anyone free by rating. The new pair goes into
   the same shuffle as everyone else. */
/* Трансферный рынок межсезонья: кто остался один, ищет себе равного.

   Освободившиеся сортируются по силе и сходятся соседями — сильный со
   сильным, — потому что так это и работает: распавшийся топ-дуо не идёт играть
   с сорок вторым номером. Внутри пары бросок посолен сезоном и обоими никами:
   раздача не меняется от перезагрузки, но и не повторяет прошлый год.

   Чтобы рынок не был совсем механическим, соседей берут не строго по порядку, а
   из ближайшей тройки — тогда у одного и того же человека в разные годы разные
   партнёры, а уровень пары остаётся своим. */
/* С КЕМ ЧЕЛОВЕК ИГРАЛ НА САМОМ ДЕЛЕ — по записям года (rosterEntriesOf: дуо каждого турнира).
   Отзыв: «Malibuca Scroll в дуо не играли» — рынок сводил освободившихся по рейтингу,
   и два топа из разных пар оказывались дуо, которого не было. Теперь освободившийся сходится
   только с тем, с кем у него есть записанная пара; нет такого свободного — остаётся свободным
   агентом (players), как и было с теми, кому не нашлось пары. Правило буквально:
   «Recorded pairs, not made-up ones». */
let CC_REC_MATES=null;
function ccRecordedMates(){
  if(CC_REC_MATES) return CC_REC_MATES;
  const m=new Map();
  try{
    ccEuCards().forEach(c=>{ rosterEntriesOf(c).forEach(({entry})=>{
      if(!entry || !Array.isArray(entry.duo) || entry.duo.length!==2) return;
      const a=hKey(entry.duo[0]), b=hKey(entry.duo[1]); if(!a || !b || a===b) return;
      if(!m.has(a)) m.set(a, new Set()); if(!m.has(b)) m.set(b, new Set());
      m.get(a).add(b); m.get(b).add(a);
    }); });
  }catch(e){}
  CC_REC_MATES=m; return m;
}
function ccRecordedTogether(a, b){ const m=ccRecordedMates(); const s=m.get(hKey(a)); return !!(s && s.has(hKey(b))); }
/* Трио-год без третьих. Карьера после года календаря берёт составы ccRealTeamDuos, рынок трио
   выключен (ccTrioMarket), а в карточках 2026 (и каждого следующего трио-года) только дуо.
   tools/check-career-chapter-squads.js: в первый день трио-года 11 из топ-40 без состава, в дуо-годы 0.
   На стыке, раз на снимок: паре без третьего ближайший по силе свободный не ниже полосы Д1
   (сильные пары вперёд, совместная игра плюсом), оставшихся свободных собираем тройками по силе.
   Ядра пишутся в cr.trioCores, иначе еженедельная пересборка пула их разобьёт. */
const CC_THIRD_RECORDED=2;
function ccContinuityThirds(duos, seated, cr){
  const floor=ccBand(1, ccPoolRegion()==='ALL' ? undefined : ccPoolRegion())-2-CC_CHAPTER_CAP;   // с запасом на поправку прошлой главы (ccChapterCarry): карта ниже, рейтинг в сцене выше
  const free=careerRosterNowEU().filter(p=>!seated.has(hKey(p)) && ccCardOvr(p)>=floor)
    .map(p=>{ const c={...p}; c._k=hKey(p); return c; })
    .sort((a,b)=>ccCardOvr(b)-ccCardOvr(a));
  cr.trioCores=[]; cr.trioFilled={};   // какие третьи посажены по силе, а не с карточек
  if(!free.length) return;
  const open=duos.filter(d=>!cr.trios[d.cards.map(c=>hKey(c)).sort().join('+')])
    .sort((a,b)=>ccDuoOvr(b)-ccDuoOvr(a));
  for(const d of open){
    if(!free.length) break;
    const avg=ccDuoOvr(d);
    if(avg<floor-4) break;   // ниже — третьего возьмёт вечер, как брал (ccPickThird)
    let bi=-1, bs=Infinity;
    free.forEach((c,i)=>{
      const s=Math.abs(ccCardOvr(c)-avg)-(d.cards.some(x=>ccRecordedTogether(x, c)) ? CC_THIRD_RECORDED : 0);
      if(s<bs){ bs=s; bi=i; }
    });
    const t=free.splice(bi, 1)[0], key=d.cards.map(c=>hKey(c)).sort().join('+');
    cr.trios[key]=hKey(t); cr.trioFilled[key]=1;
    seated.add(hKey(t));
  }
  for(let i=0; i+2<free.length; i+=3){
    const a=free[i], b=free[i+1], c=free[i+2];
    cr.trioCores.push([hKey(a), hKey(b)]);
    cr.trios[[hKey(a), hKey(b)].sort().join('+')]=hKey(c); cr.trioFilled[[hKey(a), hKey(b)].sort().join('+')]=1;
    [a, b, c].forEach(x=>seated.add(hKey(x)));
  }
}
function ccContinuityCores(duosLive){
  const cr=CAREER && CAREER.career, cores=cr && cr.trioCores;
  if(!cores || !cores.length) return;
  const taken=new Set(); duosLive.forEach(d=>d.cards.forEach(c=>taken.add(hKey(c))));
  const byKey=new Map(); careerRosterNowEU().forEach(p=>byKey.set(hKey(p), p));
  cores.forEach(([ka, kb])=>{
    const a=byKey.get(ka), b=byKey.get(kb);
    if(!a || !b || taken.has(ka) || taken.has(kb)) return;
    const key=[ka, kb].sort().join('+');
    if(ccRealTeamBroken({cards:[a, b]})) return;   // разошлись в этом году — стоят врозь, как все
    const ca={...a, _k:ka}, cb={...b, _k:kb};
    duosLive.push({cards:[ca, cb], avg:(ccCardOvr(a)+ccCardOvr(b))/2, _remade:true, _core:key});
    taken.add(ka); taken.add(kb);
  });
}
function ccContinuityDuos(duosLive){
  const taken=new Set(); duosLive.forEach(d=>d.cards.forEach(c=>taken.add(hKey(c))));
  const floor=ccBand(1, ccPoolRegion()==='ALL' ? undefined : ccPoolRegion())-2-CC_CHAPTER_CAP;
  const free=careerRosterNowEU().filter(p=>!taken.has(hKey(p)) && ccCardOvr(p)>=floor).map(p=>{ const c={...p}; c._k=hKey(p); return c; });
  if(free.length<2) return;
  const made=ccRemadeDuos(free);
  made.forEach(d=>{ duosLive.push(d); d.cards.forEach(c=>taken.add(hKey(c))); });
  const rest=free.filter(c=>!taken.has(hKey(c))).sort((a,b)=>ccCardOvr(b)-ccCardOvr(a));
  for(let i=0; i+1<rest.length; i+=2){
    const a=rest[i], b=rest[i+1];
    duosLive.push({cards:[a, b], avg:(ccCardOvr(a)+ccCardOvr(b))/2, _remade:true});
  }
}
function ccRemadeDuos(freed){
  const out=[];
  if(!freed || freed.length<2) return out;
  const cr=(CAREER && CAREER.career) || {};
  const seen=new Set(), pool=[];
  freed.forEach(c=>{ const k=hKey(c); if(!k || seen.has(k)) return; seen.add(k); pool.push(c); });
  pool.sort((a,b)=>ccCardOvr(b)-ccCardOvr(a));
  const rnd=careerRng(ccHashStr('transfer|'+ccWorldSeed()+'|'+(cr.season||1)));
  /* Обратно к тому же человеку рынок не сводит.

     Ловушка, пойманная проверкой 28 августа: пара распадается — обе половинки
     оказываются в freed рядом, они же и самые сильные из freed, — и следующая
     строка сажает их обратно вместе. Развод, которого никто не видит: и
     межсезонный бросок, и плохой сезон отменялись сами собой. Отсюда же его
     старое «дуосы не меняются, скай скролл до сих пор играют».

     Кто с кем только что расстался, записано в книге разводов — она и есть
     запрет. */
  const book=(cr.duoSplits||{});
  const wasTogether=(a,b)=>!!book[[hKey(a), hKey(b)].sort().join('+')];
  while(pool.length>=2){
    const a=pool.shift();
    // Партнёр — только из тех, с кем есть ЗАПИСАННАЯ пара (ccRecordedTogether), не тот, с кем
    // только что разошлись; из ближайшей тройки таких по силе. Нет никого — остаётся свободным.
    const cands=pool.map((c,i)=>i).filter(i=>ccRecordedTogether(a, pool[i]) && !wasTogether(a, pool[i]));
    if(!cands.length) continue;
    const near=Math.min(3, cands.length);
    const at=cands[Math.floor(rnd()*near)];
    const b=pool.splice(at, 1)[0];
    if(!b) break;
    out.push({cards:[a, b], avg:(ccCardOvr(a)+ccCardOvr(b))/2, _remade:true});
  }
  return out;
}
function ccOrphanPairs(pool, taken, rnd, spare, seats){
  const out=[], loose=[];
  const gone=new Set();
  pool.duos.forEach(d=>{
    const a=d.cards[0], b=d.cards[1];
    // Тем же ключом, что и в careerRealDuos: _k может быть не проставлен.
    const kk=c=>(c && (c._k||hKey(c)))||'';
    const aOut=taken.has(kk(a)), bOut=taken.has(kk(b));
    if(aOut===bOut) return;                 // both in, or both out: not orphaned
    const left=aOut ? b : a;
    if(!gone.has(left._k)){ gone.add(left._k); loose.push(left); }
  });
  if(!loose.length) return out;
  /* An odd one out needs somebody who is not already in a pair.

     Taking Malibuca orphans exactly one player, and one player cannot make a duo
     on his own. The free agents are at the back of the shuffle: the division
     seats two hundred pairs out of the two hundred and six the year recorded, so
     six of them are standing about every week anyway. One of those pairs breaks,
     one half of it plays with vic0, and the other half is the one who does not
     get a seat - which is what happens when a duo splits and only one of them
     finds somebody. */
  while(loose.length%2 && spare && spare.length){
    /* And the free agent is the one who fits, not the one at the back.

       Taken by shuffle position first, which handed vic0 - a 91, a Summit
       champion - to coldr, an 81 who finished 96th and 110th in the two
       Play-Ins. Ten points apart, because "nearest rating" was being chosen out
       of a set of one. A player at the top of Europe who loses their duo picks up
       somebody else at the top of Europe; the pair that half came from is the one
       that loses a seat, which is what happens. */
    /* Напарник осиротевшему: свободный агент, один на весь сезон. Когда игрок забирал карточку (vic0), Malibuca
       оставался один, и пара собиралась заново в каждой комнате из хвоста очереди, напарник менялся от турнира к
       турниру.
       Теперь берём ближайшего по силе без пары (в пуле 500+ свободных агентов, разводить никого не надо) и пишем в
       cr.orphanMate, как третьего в cr.trios. Любая комната читает ту же запись. */
    const odd=loose[loose.length-1];
    const oddKey=odd._k||hKey(odd);
    const cr=(CAREER && CAREER.career) || null;
    const memo=cr ? (cr.orphanMate=cr.orphanMate||{}) : null;
    const pairedNow=new Set();
    pool.duos.forEach(d=>d.cards.forEach(c=>pairedNow.add(c._k||hKey(c))));
    /* В трио-год запомненный третий целой пары тоже занят: иначе сирота уводил его к себе,
       и уже та тройка на каждом капе искала замену (отзыв 25.10: «из других триосов
       воровать по игроку»). Третий распавшейся пары свободен. */
    if(cr && cr.trios && typeof careerSquadSize==='function' && careerSquadSize()===3)
      Object.keys(cr.trios).forEach(key=>{ if(!key.split('+').some(k=>taken.has(k))) pairedNow.add(cr.trios[key]); });
    const freeOnes=(pool.players||[]).filter(c=>{
      const k=c._k||hKey(c);
      // Только что брошенный игроком — ещё на рынке (ccMateParted, 16.09).
      return k && k!==oddKey && !pairedNow.has(k) && !taken.has(k) && !ccMateJustParted(k);
    });
    let take=null;
    const want=memo ? memo[oddKey] : null;
    if(want) take=freeOnes.find(c=>(c._k||hKey(c))===want) || null;
    /* Трио-год: двое, что остались от тройки, играют дальше вместе, а третьего добирают
       (отзыв 25.10: «чтобы она со своим рейтингом примерно тиммейта нового находила»).
       Раньше сирота брал ближайшего свободного, а свободные в верху сцены на десять-пятнадцать
       слабее: vic0 95 остался с Kyto 76, хотя его третий t3eny 94 был свободен. */
    if(!take && !want && cr && cr.trios && careerSquadSize()===3){
      const was=Object.keys(cr.trios).find(key=>{ const p=key.split('+'); return p.indexOf(oddKey)>=0 && p.some(k=>taken.has(k)); });
      if(was) take=freeOnes.find(c=>(c._k||hKey(c))===cr.trios[was]) || null;
      if(take && memo) memo[oddKey]=take._k||hKey(take);
    }
    if(!take){
      /* Один из трёх ближайших по силе, а не строго ближайший: при двух-трёх
         сильных свободных на весь пул «ближайший» — это всегда один и тот же
         человек (проба 16.09: семь сирот подряд получили pixx). Бросок — по
         ключу сироты, чтобы у обоих клиентов комнаты вышел один и тот же. */
      const near=freeOnes.map(c=>({c, gap:Math.abs(ccCardOvr(c)-ccCardOvr(odd))}))
        .sort((a,b)=>a.gap-b.gap).slice(0, 3);
      if(near.length){
        const pick=careerRng(ccHashStr('orphan|'+ccWorldSeed()+'|'+oddKey))();
        take=near[Math.floor(pick*near.length)].c;
      }
      if(take && memo) memo[oddKey]=take._k||hKey(take);
    }
    if(!take) break;
    loose.push(take);
  }
  if(loose.length<2) return out;
  const free=new Map(loose.map(c=>[c._k, c]));
  loose.forEach(c=>{
    if(!free.has(c._k)) return;
    free.delete(c._k);
    // Somebody they have really played with, if one of them is also loose.
    let mate=null;
    for(const {entry} of rosterEntriesOf(c)){
      if(entry.duo.length!==2) continue;
      const k=entry.duo.map(h=>hKey(h)).find(x=>x!==c._k);
      if(k && free.has(k)){ mate=free.get(k); break; }
    }
    if(!mate){
      // Otherwise the nearest rating still standing about.
      // Через ccCardOvr, а не через _ovr: у свободного агента пула этого поля
      // нет вовсе, и сравнение молча уезжало в NaN.
      let best=null;
      free.forEach(o=>{ if(!best || Math.abs(ccCardOvr(o)-ccCardOvr(c))<
                                    Math.abs(ccCardOvr(best)-ccCardOvr(c))) best=o; });
      mate=best;
    }
    if(!mate) return;
    free.delete(mate._k);
    out.push({cards:[c, mate], avg:(ccCardOvr(c)+ccCardOvr(mate))/2});
  });
  return out;
}
/* sharp: ширина шума при отборе комнаты, в баллах рейтинга. Не задан: ровное перемешивание, как в открытом
   турнире. Задан: пары по силе плюс шум, берутся первые; меньше значит ближе к списку сильнейших.
   Без него глубокие стадии были случайными 50 пар из 130 D1 (среднее / верх): Reload отборы 77.1 / 96, финал
   Reload топ-20 74 / 82, хиты, финал Мейджора и Глобалы 75.6 / 93, один и тот же бросок.
   0 не передаём: строго сильнейшие одни и те же каждый раз, войти нельзя (по той же причине CC_TRIO_TOP бросает
   монету). */
function ccDuoOvr(d){
  const cs=(d && d.cards) || [];
  let s=0, n=0;
  cs.forEach(c=>{ const v=(c && (c.ovr!=null ? c.ovr : c.rating))||0;
                  if(v>0){ s+=v; n++; } });
  return n ? s/n : 0;
}
// Нормальный шум из того же сеянного генератора, чтобы комната оставалась
// воспроизводимой: один и тот же посев — одно и то же лобби.
function ccGauss(rnd){
  let u=rnd(); if(u<1e-9) u=1e-9;
  return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*rnd());
}
/* Ширина шума по стадиям, в баллах рейтинга.

   Не отсечка, а то, насколько результат вечера расходится с рейтингом. Хит —
   пять карт, там выносит кого угодно; финал — двенадцать, и на длинной
   дистанции сильные доезжают чаще. Глобалы жёстче всех: туда отобралась не
   Европа, а мир, и ошибиться этому отбору было где меньше всего.

   Числа мои, не его: измерить их не по чему — расхождение реального посева с
   реальным результатом посчитать не из чего, у нас нет посева. Подобраны так,
   чтобы порядок комнат читался (финал сильнее хитов, хиты сильнее плей-ина) и
   при этом верх Европы не стоял в финале одним и тем же составом. Что из
   этого вышло — в комментарии к careerRealDuos. */
const CC_FIELD_SHARP={heats:6, final:3, lan:3, globals:2};
function careerRealDuos(taken, rnd, scope, seats, sharp){
  const pool=(scope==='all' || scope===1) ? careerPools() : null;
  /* Занятость читается по `_k ИЛИ нику`. `_k` ставится не на каждом пути
     сборки пула, а `taken` собирается из ников (careerCupField: mine.map(hKey)) —
     и там, где `_k` не проставлен, `taken.has(undefined)` молча отвечал «нет».
     Отсюда карточка, которую взял сам игрок, оказывалась в чужой команде на
     экране (его снимок хитов: «Malibuca & vic0», при том что vic0 — это он). */
  const key=c=>(c && (c._k||hKey(c)))||'';
  const duos=(pool ? pool.duos : [])
    .filter(d=>!taken.has(key(d.cards[0])) && !taken.has(key(d.cards[1])));
  if(sharp>0){
    duos.forEach(d=>{ d._pick=ccDuoOvr(d)+ccGauss(rnd)*sharp; });
    duos.sort((a,b)=>b._pick-a._pick);
  } else {
  for(let i=duos.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); const t=duos[i]; duos[i]=duos[j]; duos[j]=t; }
  }
  // Shuffled first, so the pair a free agent is taken from is one of the ones at
  // the back that were not going to play anyway.
  if(pool) ccOrphanPairs(pool, taken, rnd, duos, seats).forEach(d=>duos.unshift(d));
  return duos;
}
/* Whether the people around this career are real.
   One line for the whole mode: above it real cards, below it the generated ladder at your rating. Inbox offers and partner picks follow the same rule as the lobbies.
   Without it a Division 5 career on 54 got offered real players rated 46-62 with their photos (photos/ is the Play-In field). */
/* Настоящие имена — в Дивизионе 1 и во все годы без дивизионов (его слово 29.09: «я 99, но в выборе не все игроки»):
   в 2019–2021, 2024 и вне дивизионных недель 2022–23 карьера числилась в своей ступени, и поиск/личка/лента
   показывали сгенерированную лестницу этой ступени вместо сцены. */
function ccRealNamesHere(){ return (CAREER.career.division||5)===1 || (typeof ccNoDivisions==='function' && ccNoDivisions()); }
// The same pool read as people rather than pairs, for the events that seat
// individuals: a solo lobby, and the list of who is around to talk to.
function careerRealPlayers(taken, rnd, scope){
  const out=(scope==='all' || scope===1 ? careerPools().players : [])
    .filter(p=>!taken.has(p._k));
  for(let i=out.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); const t=out[i]; out[i]=out[j]; out[j]=t; }
  return out;
}

// The field for one cup. Division 1 is the snapshot whole — 150 real people in
// the pairs they really played — and the divisions below are the generated
// ladder, banded on their own rating.
// size is how many teams the lobby holds in total, the player included. It
// defaults to the divisional cup's own field, which is every caller but the
// Reload circuit — a heat there is twenty duos and a final is twenty.
/* Which cup week today is, when a calendar week holds two of them.

   careerSeed keys on the calendar week, and everywhere in the year but one that
   is exactly right: Monday and Tuesday are two sessions of one tournament and
   want one field. The exception is Divisions 2-5 in July, where the cup weeks of
   13-14 and 18-19 sit inside the same Monday-to-Sunday because Epic moved the
   second onto the weekend of the Major Play-In. Those two weeks are two
   tournaments, and the second was drawing the first one's hundred and fifty duos
   — the same lobby, five days later.

   Only the later week is salted. The first cup week of any calendar week keeps
   the plain seed, so every lobby already drawn in a save stays the one it was,
   and this touches one week of the year rather than all seventeen. */
function ccCupWeekSalt(){
  const today=careerToday();
  const idx=ccCupWeeks().findIndex(r=>r[1]===today || r[2]===today);
  if(idx<0) return '';
  const first=ccCupWeeks().findIndex(r=>careerMonday(r[1])===careerMonday(today));
  return idx===first ? '' : 'cw'+ccCupWeeks()[idx][1];
}
/* open — this event is open to every division rather than played inside one.

   The Reload Opens are the one thing in the mode Epic describes that way, and
   the field was being built the same as a divisional cup's: banded on the
   player's own division, so a Division 4 player's Opens were a room of Division
   4 ladder players and not one real name in it. An open is the whole region —
   every real European duo the roster can field, and the ladder filling in
   behind them from every division's band rather than from one. */
/* The generated fill of Division 1 is the part of the division that did not
   make the Play-In: better than Division 2's band, and never at Division 1's
   own — the people at the band are the 300 real cards. Measured, and the
   reason this exists: fill banded at 82 grew a 90+ tail out of 990 draws that
   outranked the snapshot's stars and won two cups in ten over the real names —
   "who are these people and why are they winning" is the user reading that
   standings screen. Banded between the two rungs, redrawn under the cap. */
function ccD1FillOvr(rnd){
  const mid=(ccBand(1)+ccBand(2))/2;
  for(let g=0; g<20; g++){
    const o=mid+careerGauss(rnd)*CC_BAND_SD;
    if(o<ccBand(1)) return o;
  }
  return CC_DIV_RATING[1]-2;
}
/* Which rung a generated face in an open comes from. Weighted by CC_CUP_ENTRANTS (D5 is half of Europe, D1 7%)
   instead of a flat fifth.
   Rung 1 is never drawn: Division 1 is the snapshot, nothing in it is generated. A flat fifth put ~200 invented duos
   into D1's band against 150 real pairs and some finished above them. So only rungs 2-5. */
const CC_OPEN_RUNGS=[2,3,4,5];
function ccOpenRung(rnd){
  const w=CC_OPEN_RUNGS.map(d=>CC_CUP_ENTRANTS[d]||0);
  let r=rnd()*w.reduce((s,v)=>s+v,0);
  for(let i=0;i<CC_OPEN_RUNGS.length;i++){ r-=w[i]; if(r<=0) return CC_OPEN_RUNGS[i]; }
  return 5;
}
function ccOpenFillOvr(rnd){
  /* И ничего выдуманного не читается на полосе дивизиона 1, откуда бы его ни
     тянули: этот рунг — настоящие люди, и придуманное имя на их рейтинге и есть
     то, о чём был скриншот. careerLadderPlayer держит ту же линию для всего
     остального, что собирает режим.

     Перебросить, а не обрезать. Обрезка сваливает весь хвост распределения в
     одну точку — потолок, — и когда полоса дивизиона 1 переехала с 82 на 78,
     этой точкой стал 77, вплотную к полосе дивизиона 2. Комната открытого
     турнира тут же перестала быть похожей на лестницу: у второго дивизиона
     вырос горб из чужих хвостов. Тот же приём, которым ccD1FillOvr уже держит
     свою линию. */
  /* И ниже полосы Дивизиона 2 — тем же правилом, каким выдуманное не читается
     на полосе Д1. Скриншот: «опять рандомные бомжи проходят, а
     настоящие команды не могут» — полоса отсечки опенов #400–430 была на 73%
     из придуманных пар. Все реальные имена дивизионов уже сидят в поле
     поимённо (443 команды из снапшота и свободных агентов), поэтому
     ladder-масса опена — анонимные гриндеры ниже дивизионных полос, а не
     «вторые дивизионы» с их силой. Замер career-open-cut-probe.js:
     реальных в топ-430 было 198 из 444, стало 225; остаток — честная
     дисперсия шести игр, откалиброванная по реальным опенам (лидеры
     настоящих Play-In в среднем 17-е). */
  const top=Math.min(ccGenTop(), ccBand(2)-1);
  for(let g=0; g<20; g++){
    const o=ccBand(ccOpenRung(rnd))+careerGauss(rnd)*CC_BAND_SD;
    if(o<=top) return o;
  }
  return top-2;
}
/* Соперника больше нет — отзыв: «убери соперника». Дуо,
   которое сезон сидело в каждом кубке (careerRival/careerRivalMake/
   careerRivalResult/careerRivalHTML, плитка на вкладке карьеры, первая
   посадка в careerCupField), выпилено целиком. cr.rival в старых сейвах
   просто лежит и никем не читается; строки ccRival* в словарях остались
   мёртвыми, чтобы не трогать три локали ради удаления. */
/* Пары для незаписанных считаются на сезон, а не на комнату. Раньше нарезка шла после отбора
   в комнату, и размер комнаты менял напарников (2024 EU дуо: 400 против 800 мест, 272 из 798 с другим
   напарником; открытая против закрытой 580 из 762). Пул careerRealPlayers один на scope 1 и 'all'.
   Теперь пары режутся один раз по всему остатку ростера (минус записанные в книге), а комната
   берёт пары только целиком: половина пары сдвинет нарезку по per и перепишет все пары после неё. */
function ccRestPairs(cr, per){
  const pl=careerPools();
  const inDuo=new Set();
  ((pl && pl.duos)||[]).forEach(d=>(d.cards||[]).forEach(c=>{
    if(c) inDuo.add(c._k || hKey(c)); }));
  const pool=((pl && pl.players)||[]).filter(p=>!inDuo.has(p._k || hKey(p)))
    .slice().sort((a,b)=>attrsFor(b).ovr-attrsFor(a).ovr);
  const m=new Map();
  for(let i=0;i+per-1<pool.length;i+=per){
    const chunk=pool.slice(i, i+per);
    /* Место в сезонной нарезке едет НА САМОЙ карточке: объекты пула — те же
       объекты, что приходят в комнату. Ниже комната сортируется по нему, а не
       по рейтингу заново: на равных оверах сортировка устойчива к порядку
       входа, а входят они перемешанными, и пары на одинаковом рейтинге
       переслаивались. Замер после первой половины правки: 78 из 798. */
    chunk.forEach((p, k)=>{ p._rest=i+k; m.set(p._k || hKey(p), chunk); });
  }
  return m;
}
/* ДЕНЬ НАЙМА НЕ МЕНЯЕТ МИР (29.10, его «пусть не будет распада трио у них из-за этого только на один кап»). Поле капа
   с нанятым собирается как обычно: его напарникам на этот вечер подбирают кого-то вместо него. Но память мира — кто чей
   третий (cr.trios, cr.trioFilled) и пара осиротевшему (cr.orphanMate) — после сборки возвращается к прежней: проба
   (трио-год 2027, наняли Pixie) показала, что без этого Swizzy и Shxrk навсегда становились тройкой с новым третьим. */
function careerCupField(cr, mine, size, salt, open, sharp){
  const live=CAREER && CAREER.career;
  if(!live || !(typeof ccHireActive==='function' && ccHireActive())) return careerCupFieldRaw(cr, mine, size, salt, open, sharp);
  const keep={}; ['trios','trioFilled','orphanMate'].forEach(k=>{ keep[k]=live[k]===undefined ? undefined : JSON.stringify(live[k]); });
  try{ return careerCupFieldRaw(cr, mine, size, salt, open, sharp); }
  finally{ Object.keys(keep).forEach(k=>{ if(keep[k]===undefined) delete live[k]; else live[k]=JSON.parse(keep[k]); }); }
}
function careerCupFieldRaw(cr, mine, size, salt, open, sharp){
  /* Гонка: из ботов вычитаются и соперники со своими напарниками — они в комнате людьми.
     И В ТОТ ВЕЧЕР, КОТОРЫЙ ИГРАЕТСЯ БЕЗ НИХ. Вычитание стояло под ccRaceLock, то есть только
     в общем вечере; когда сосед сегодня не играет, его пара выходила в поле обычным ботом и
     зарабатывала призовые — у меня в доске они есть, а у него самого их нет и быть не может
     (он этот вечер не играл). Скриншот: Shur4 и Repairs у соседа на три вечера и
     пятнадцать тысяч богаче, чем у себя. Человек комнаты не бот ни в каком вечере. */
  if(typeof ccRaceOn==='function' && ccRaceOn()) mine=(mine||[]).concat(ccRaceAllCards());
  // Менеджер: люди клуба в поле мира — только составами клуба (см. mgrSeatedTaken).
  if(typeof mgrSeatedTaken==='function') mine=(mine||[]).concat(mgrSeatedTaken());
  const rnd=careerRng(careerSeed(cr, salt));
  const band=ccBand(cr.division);
  const taken=new Set(mine.map(hKey));
  const teams=[];
  const need=(size||CAREER_CUP_FIELD)-1;
  /* Real pairs first — Division 1's snapshot, which an open event also seats
     because it is the only rung with real names. Below Division 1 this yields
     nothing and the whole field is ladder.

     In a trio season the pair is still the pair. Nobody has played 2026 in
     threes, so there are no recorded trios to seat and inventing them would
     throw away the one real thing in the room: Sky and Scroll played that season
     together, and in a trio year they are two thirds of a team with somebody
     else beside them. So the recorded duo stays whole and a third is drawn in —
     which is the same shape the player's own squad has, a real core and a seat
     that had to be filled.

     His pick, 19 August, of the two ways to do it. */
  const per=careerSquadSize();
  /* Рынок трио открывается до того, как собрана первая комната года: пары,
     распавшиеся на нём, не должны стоять в ней ядрами. Раз за сезон, метка на
     самой карьере — см. ccTrioMarket. */
  /* Живой карьере, а не копии, которую комната собрала для себя: раннеры и
     пробы зовут careerCupField с Object.assign({}, cr, {...}), и разводы,
     записанные в копию, не увидит ни careerPools, ни следующая комната. */
  if(per>2 && typeof ccTrioMarket==='function') ccTrioMarket(null);
  if(per>2 && typeof ccTrioRefill==='function') ccTrioRefill(mine);
  /* Where the third comes from.
     Not from all leftovers: most of Division 1's leftovers are in another recorded pair, so drawing thirds broke later duos (130 real pairs became 4).
     From the back of the queue instead: careerRealDuos returns more pairs than seats (205 for 132), and the ones past the cut never play. Same rule as ccOrphanPairs above.
     Division 1 in trios can't be all real (133 trios is ~400 people, the snapshot has 300), the rest falls to the ladder. */
  const allDuos=careerRealDuos(taken, rnd, open ? 'all' : cr.division, need, sharp);
  try{ const pl=(open || cr.division===1) ? careerPools() : null; const dl=(pl && pl.duos)||[];
    CC_MP_FIELD_FP='s'+String(careerSeed(cr, salt)).slice(0,6)+'.t'+String(ccHashStr([...taken].sort().join('|'))).slice(0,6)+
      '.p'+dl.length+':'+String(ccHashStr(dl.map(d=>(d.cards||[]).map(c=>c&&(c._k||hKey(c))).join('+')).join('|'))).slice(0,6)+':'+String(ccHashStr(dl.map(d=>Math.round(ccDuoOvr(d)*10)).join(','))).slice(0,6)+
      '.'+String(ccPoolRegion())+'.sh'+String(sharp||0)+'.o'+(open?1:0)+
      // Из чего сложен сид (careerSeed): разошёлся s — видно, что именно.
      '.c'+cr.season+'w'+((cr.seedWeek!=null) ? cr.seedWeek : careerWeek())+'d'+cr.division+'.e'+String(ccHashStr(String((typeof CC_MP_SEED!=='undefined' && CC_MP_SEED)||''))).slice(0,6)+
      (ccRaceLock() ? '.L' : '')+'.z'+careerSquadSize()+(CC_MP_FMT_WHY ? ':'+CC_MP_FMT_WHY : ''); }catch(e){ CC_MP_FIELD_FP='fp-err'; }
  const cores=(per>2) ? allDuos.slice(0, need) : allDuos;
  const extras=[];
  /* Хвост очереди больше не разбираем на третьих. С тех пор как careerPools кладёт
     в players весь ростер свободными агентами (565 на ~100 мест), третьих хватает,
     а разбор ломал сильные пары: Scroll & Sky выпадали 151-ми из 173 и садились
     третьими в разные трио, и cr.trios это запоминал на весь сезон
     (tools/career-lan-duos-probe.js). Третьи только из тех, у кого нет пары, не
     хватило, выдумываем по силе пары. */

  /* Свободные агенты пула — после хвоста очереди, до выдуманных. Половинки
     пар сюда не попадают: их дуо в очереди, и увести половинку третьим значило
     бы выбросить пару целиком. Ниже первого дивизиона careerRealPlayers пуст,
     и правило «реальных имён под Д1 нет» стоит, где стояло. */
  /* Кто в паре — не свободен. Считается по ПУЛУ, а не по очереди этой недели:
     пара, которая на этот кубок не приехала, всё равно пара, и разбирать её на
     третьих нельзя. Раньше здесь стоял inQ по allDuos — то есть по тем, кого
     очередь довезла, — и пара, не попавшая в очередь, оказывалась свободной. */
  /* Два разных «занят», не путать.
     pairedPool: кто в записанной паре года. Свойство сезона, такой человек третьим не бывает никогда.
     paired: то же плюс собранные в пару на этой неделе (ccOrphanPairs, ccRemadeDuos). Свойство вечера, завтра он снова может быть третьим.
     С одним набором память троек (cr.trios) стиралась по недельному признаку и составы менялись каждую неделю (490 из 997 человек за две недели). */
  const paired=new Set(), pairedPool=new Set();
  if(per>2) ((careerPools().duos)||[]).forEach(d=>(d.cards||[]).forEach(c=>{
    if(c){ paired.add(c._k||hKey(c)); pairedPool.add(c._k||hKey(c)); }
  }));
  /* И пары, которых в пуле нет, а в очереди есть: осиротевший (у кого напарника
     забрал сам игрок) собирается заново в careerRealDuos — ccOrphanPairs, — и
     его новый напарник в пуле числится свободным.

     Отчёт: в опене «Malibuca & Xezel51 & Xesen42», хотя в
     кубке он же играет с Pixx. Так и выходило: очередь честно собирала пару
     Malibuca & Pixx, а следом проход по памяти троек забирал Pixx ТРЕТЬИМ к
     другой паре — он же «свободен», — после чего ядро садиться было не с кем,
     и Malibuca доставался ладдеру. Кто стоит в очереди парой, тот не третий. */
  if(per>2) allDuos.forEach(d=>(d.cards||[]).forEach(c=>{
    if(c) paired.add(c._k||hKey(c));
  }));
  if(per>2){
    /* Свободных перемешивает сезонный бросок, не недельный. careerRealPlayers тасует пул переданным броском,
       а приходил careerSeed с ключом по неделе, и ccPickThird каждую неделю выбирал третьего из другого порядка:
       ядро (coreRnd) и cr.trios стабильны, а третий менялся (661 из 997 за две недели). Явка дуо остаётся
       недельной, меняется только порядок свободных. Ключ: сезон, мир, дивизион. */
    /* В команде — сид хозяина (cr.teamWseed, едет книгой мира ccTeamWorldPack): ccWorldSeed там — сид карьеры
       каждого, и свободные у двоих перемешивались по-разному (онлайн-прогон 2019, 22.10: «mitr0+issa» у одного,
       «mitr0+kinstaar» у другого на Trios Cash Cup). */
    const fws=(typeof ccMpTeam==='function' && ccMpTeam() && CAREER.career.teamWseed) ? CAREER.career.teamWseed : ccWorldSeed();
    const freeRnd=careerRng(ccHashStr('free|'+fws+'|'+(cr.season||1)+
                                      '|'+(cr.division||1)+'|'+(open?1:0)));
    careerRealPlayers(taken, freeRnd, open ? 'all' : cr.division).forEach(c=>{
      if(!paired.has(c._k||hKey(c))) extras.push(c);
    });
  }
  /* The seat is chosen for the pair it is joining, not dealt off the front of
     the queue: somebody who has really played with one of them, or shares their
     country, or comes from a country the scene actually pairs theirs with. See
     ccPickThird — the rating window it scores inside is the one that was here
     before, so a strong duo still cannot be handed a weak third. */
  /* Третий в трио один на весь сезон. careerSeed содержит календарную неделю, и без своего генератора пара получала
     нового третьего каждый кубок. У пары свой бросок без недели (сезон, дивизион, сами двое), выбранный запоминается
     в cr.trios и садится, даже если очередь легла иначе (ищется среди свободных). Выдуманного не храним, тот же бросок
     собирает того же человека. На новом сезоне память чистится (careerNewSeason). */
  if(!cr.trios || typeof cr.trios!=="object") cr.trios={};
  const trioMemo=cr.trios;
  /* Третьего забрал к себе игрок (или он в комнате человеком): запись о нём неисполнима,
     пока он у тебя, и её стираем. Раньше она оставалась — новый третий не записывался
     («пишется один раз»), и тройка на каждом капе брала нового из остатков или
     выдуманного слабого. Отзыв 25.10: «команда, у которой я забрал игрока, начинает либо
     с каким-то слабым играть, либо на каждый турнир из других триосов воровать по
     игроку». Теперь она один раз выбирает по силе среди свободных, и это запоминается. */
  const mineKeys=new Set((mine||[]).map(c=>c && (c._k||hKey(c))).filter(Boolean));
  const coreKey=core=>core.map(c=>hKey(c)).sort().join('+');
  const coreRnd=core=>careerRng(hashStr('t'+cr.season+'d'+cr.division+'|'+coreKey(core)));
  /* Память рассаживается раньше любых свежих выборов.

     Пары обрабатываются в порядке очереди недели, и свежий выбор ранней пары
     умел увести запомненного третьего поздней: та падала в свежий выбор и
     ПЕРЕЗАПИСЫВАЛА свою память новым человеком. Очередь каждую неделю другая —
     и тройки текли при живой памяти: 51% устойчивых пар держали одного
     третьего, тройка первой недели доживала до пятой в 13% случаев
     (career-trio-stick-probe.js). Его третья жалоба: «каждый новый
     кап команды новые, нету ни одного триоса, которые все турниры вместе
     играют». Резерв до раздачи возвращает памяти силу: сначала каждому ядру —
     его запомненный третий, и только потом свободные разбирают остальных. */
  const reserved=new Map();
  if(per>2 && trioMemo){
    cores.forEach(d=>{
      if(d.cards.some(c=>taken.has(hKey(c)))) return;
      const key=coreKey(d.cards);
      const want=trioMemo[key];
      /* Память старого сейва может держать человека, у которого есть своя
         пара: до 28 августа третьих разбирали из хвоста очереди, и такой
         выбор застывал на весь сезон (см. абзац про Scroll & Sky выше).
         Такую строку просто не читаем — пара важнее записи, и тройка соберётся
         заново из свободных. */
      /* Запись, которую нельзя исполнить, СТИРАЕТСЯ — один раз, а не читается
         мимо каждую комнату. Иначе состав пересобирался бы на каждом кубке:
         прочитать нельзя, записать нельзя (пишем только в пустое), и пара
         каждый раз брала бы кого-то нового. Правило:
         «пусть в начале сезона изменения только, если они нужны, а не каждый
         кап». Эта — нужна: она осталась от старого разбора живых пар. */
      /* Забываем запись только тогда, когда её НЕЛЬЗЯ исполнить никогда:
         человек встал в записанную пару года. «Занят на этой неделе» — не
         повод стирать память: на следующей он снова свободен, а состав уже
         развалился. См. pairedPool выше. */
      if(want && (pairedPool.has(want) || mineKeys.has(want))){ delete trioMemo[key]; return; }
      if(!want) return;
      const at=extras.findIndex(c=>(c._k||hKey(c))===want);
      const c=at>=0 ? extras[at]
            : careerRealPlayers(taken, coreRnd(d.cards), open ? 'all' : cr.division)
                .find(p=>(p._k||hKey(p))===want) || null;
      if(c && !taken.has(c._k) && !taken.has(hKey(c))){
        if(at>=0) extras.splice(at, 1);
        reserved.set(key, c);
        taken.add(c._k||hKey(c));
      }
    });
  }
  /* Запомненный третий пары года, которая сегодня не приехала, — всё равно её третий: свежий
     выбор его не берёт. Иначе он уходил к той паре, что разбирала раньше, она его записывала, а
     его собственная тройка на следующем капе искала замену (25.10: «из других триосов воровать
     по игроку»; проба: vic0 и t3eny брали Momsy, записанного за другой парой). */
  if(per>2 && trioMemo){
    const held=new Set();
    Object.keys(trioMemo).forEach(key=>{ const p=key.split('+');
      if(p.length===2 && p.every(k=>!mineKeys.has(k))) held.add(trioMemo[key]); });
    for(let i=extras.length-1; i>=0; i--) if(held.has(extras[i]._k||hKey(extras[i]))) extras.splice(i, 1);
  }
  /* А свежие тройки раздаются ПО СИЛЕ ПАРЫ, а не по очереди недели.

     Жалоба игрока: «триосы нереалистично делаются, у самых
     сильных дуосов третий чел с рейтингом 70, надо чтобы по рейтингу».
     Замер того же дня (трио-сезон, Д1, финал Мейджора): у пары 93/93 третий
     вышел 79, а у пары 91/91 — 85. Разрыв не в подборе, а в очерёдности:
     ядра разбирали свободных в том порядке, в каком их выдала очередь недели
     (careerRealDuos сортирует с остротой sharp, то есть с шумом), и пара
     послабее, попавшая в очередь раньше, уводила лучшего свободного.

     Теперь свободных разбирают сверху вниз по силе ядра, и только потом идёт
     посадка. Ближе, чем позволяет арифметика, третий не станет: пара 96/96 не
     получит 96 — все, кто так силён, стоят в своих парах, — но выше самого
     сильного свободного никто и не претендует. */
  if(per>2){
    cores.slice()
      .filter(d=>!reserved.has(coreKey(d.cards)) &&
                 /* Память, которую нельзя прочитать (третий встал в записанную
                    пару года), памятью не считается — такая пара выбирает
                    заново, по силе. Признак сезонный, а не недельный: см.
                    pairedPool. */
                 !(trioMemo && trioMemo[coreKey(d.cards)] &&
                   !pairedPool.has(trioMemo[coreKey(d.cards)])) &&
                 !d.cards.some(c=>taken.has(hKey(c))))
      .sort((a,b)=>ccDuoOvr(b)-ccDuoOvr(a))
      .forEach(d=>{
        const key=coreKey(d.cards), prnd=coreRnd(d.cards);
        while(extras.length){
          const at=ccPickThird(d.cards, extras, prnd);
          const c=extras[at<0 ? 0 : at];
          if(!c) break;
          /* Полосы здесь больше нет — отзыв: «не надо
             выдумывать». Раньше кандидат дальше CC_TRIO_BAND от пары
             отклонялся, и на его место садился выдуманный человек с красивым
             числом; в Европе, где все сильные стоят в парах, это значило
             выдуманного третьего у КАЖДОЙ верхней тройки (Vabuk65 90 к
             Malibuca & vic0). Живой роастер важнее ровного числа: берём
             лучшего свободного, какой есть, а выдумывают только там, где
             реальных имён нет вовсе — ниже Дивизиона 1. Кого именно взять,
             по-прежнему решает ccPickThird, то есть ближайшего по силе. */
          extras.splice(at<0 ? 0 : at, 1);
          if(taken.has(c._k) || taken.has(hKey(c))) continue;
          reserved.set(key, c);
          taken.add(c._k||hKey(c));
          if(trioMemo && !trioMemo[key]) trioMemo[key]=c._k||hKey(c);   // состав пишется один раз за сезон
          break;
        }
      });
  }
  const takeExtra=(core, nearOvr)=>{
    const prnd=coreRnd(core);
    const key=coreKey(core);
    const held=reserved.get(key);
    if(held){ reserved.delete(key); return held; }
    /* Тот же фильтр и то же стирание, что в резерве: неисполнимую запись
       убираем один раз, чтобы ниже она записалась заново — и больше не менялась.

       ПРИЗНАК СЕЗОННЫЙ, а не недельный. Здесь стоял paired — а в нём лежит
       явка недели, — и запомненный третий, который сегодня сам приехал в
       чужой паре, считался «занятым навсегда»: запись стиралась, ядро брало
       нового. Копий этого стирания в функции две, и вчера я поправил только
       ту, что в резервном проходе; эта — в takeExtra, то есть в том проходе,
       который разбирает большинство ядер, — осталась недельной, и состав
       продолжал ехать. См. pairedPool. */
    if(trioMemo && trioMemo[key] && (pairedPool.has(trioMemo[key]) || mineKeys.has(trioMemo[key]))) delete trioMemo[key];
    const want=trioMemo ? trioMemo[key] : null;
    if(want){
      const at=extras.findIndex(c=>(c._k||hKey(c))===want);
      if(at>=0){
        const c=extras.splice(at, 1)[0];
        if(c && !taken.has(c._k) && !taken.has(hKey(c))) return c;
      }else{
        // Не попал в очередь этой недели — но он всё ещё в дивизионе.
        const back=careerRealPlayers(taken, prnd, open ? 'all' : cr.division)
                     .find(p=>(p._k||hKey(p))===want);
        if(back) return back;
      }
    }
    while(extras.length){
      const at=ccPickThird(core, extras, prnd);
      const c=extras[at<0 ? 0 : at];
      if(!c) break;
      /* Третьего не режем по полосе силы, берём лучшего из свободных. Выдуманный только там, где реальных имён нет
         (ниже Д1 careerRealPlayers пуст).
         Остатки очереди по построению слабее каждого ядра (cores берут верхние N пар, extras это половинки), поэтому
         разрыв есть: tools/trio-third-gap-probe.js, Д1 -1.2, опены -4.7, мировой ЛАН -15.6. Но в Европе свободных 90+
         нет, и запрет по полосе давал выдуманного каждой верхней тройке. ccThirdTooWeak и CC_TRIO_BAND остаются в
         ccPickThird как подбор по силе, а не запрет. */
      extras.splice(at<0 ? 0 : at, 1);
      if(!taken.has(c._k) && !taken.has(hKey(c))){
        if(trioMemo && !trioMemo[key]) trioMemo[key]=c._k||hKey(c);   // состав пишется один раз за сезон
        return c;
      }
    }
    const o = open ? ccOpenFillOvr(prnd)
            : cr.division===1 ? ccD1FillOvr(prnd)
                              : ccBand(cr.division)+careerGauss(prnd)*CC_BAND_SD;
    // Below Division 1 the seat is invented, and an invented one at least wears
    // a flag the people beside it play with.
    // Третий к реальной паре может встать выше общего потолка. См. ccTrioGenTop.
    return careerLadderPlayer(prnd, nearOvr!=null ? nearOvr : o, taken, ccCoreNat(core, prnd),
                              null, nearOvr!=null ? ccTrioGenTop(nearOvr) : null,
                              !open && (cr.division||1)>=2);
  };
  cores.forEach(d=>{
    if(teams.length>=need) return;
    // A player is in the lobby once. The pools are seated so nobody is in two
    // of them, and this holds the same rule against you and your partner.
    if(d.cards.some(c=>taken.has(hKey(c)))) return;
    d.cards.forEach(c=>taken.add(hKey(c)));
    // Соло-вечер (World Cup Solo, C2S3): пара года садится двумя одиночками, а не командой.
    if(per===1){ d.cards.forEach(c=>{ if(teams.length>=need) return; const t=careerTeam([c], false, open); t.name=teamLabel([c]); teams.push(t); }); return; }
    const chunk=d.cards.slice();
    while(chunk.length<per){
      // Near the pair rather than near the division, so a strong duo does not
      // get handed a weak third and land in a lobby it cannot place in.
      const avg=Math.round(d.cards.reduce((s,c)=>s+attrsFor(c).ovr,0)/d.cards.length);
      // Everybody already seated, so a fourth seat would read the third too.
      const x=takeExtra(chunk, avg);
      if(!x) break;
      taken.add(x._k || hKey(x));
      chunk.push(x);
    }
    // buildTeam already pays the recorded pair inside this squad — see the note
    // over careerTeam — so the third being a stranger costs nothing to say here.
    const t=careerTeam(chunk, false, open);
    t.name=teamLabel(chunk);
    teams.push(t);
  });
  const players=[];
  const short=(need-teams.length)*per;
  // Division 1 is real people, so what is left of them is seated before anything
  // is invented. Taking a partner out of the pool breaks a recorded pair and the
  // other half is still somebody - without this, one generated player walked
  // into a division whose whole rule is that nobody in it is generated.
  /* Остаток ростера тоже сезонным броском. Пары со своими третьими садятся выше, а остальные ~400 настоящих
     careerRealPlayers тасует и режет по три (for i+=per). С недельным броском тройки собирались заново каждую
     неделю (421 из 928 за две недели 2025 EU). Ключ тот же, что у свободных; явка недели решает только, кто приехал. */
  const restRnd=careerRng(ccHashStr('rest|'+ccWorldSeed()+'|'+(cr.season||1)+
                                    '|'+(cr.division||1)+'|'+(open?1:0)));
  const restPairs=ccRestPairs(cr, per);
  const addRest=p=>{
    if(players.length>=short) return;
    const pair=restPairs.get(p._k || hKey(p));
    if(!pair) return;                                   // хвост, не делящийся на пары
    if(pair.some(q=>taken.has(q._k || hKey(q)))) return; // половина уже в комнате
    pair.forEach(q=>{ taken.add(q._k || hKey(q)); players.push(q); });
  };
  if(cr.division===1 && !open){
    careerRealPlayers(taken, restRnd, 1).forEach(addRest);
  }
  /* Опен — очередь всего региона, и реальные одиночки пула стоят в ней раньше
     выдуманных. Скриншот («опять…»): #30–36 таблицы опена были
     заняты парами из придуманных имён, при том что сотни настоящих свободных
     агентов в дуо-опене вообще не участвовали — в поле шли только 173 пары
     снапшота, весь остальной верх был лестницей. Соло-про в опене играет с
     таким же соло-про: сортировка ниже сама сводит их по рейтингу, тем же
     правилом, каким рассаживаются выдуманные. Замер до/после — в
     career-open-top-probe.js. */
  if(open){
    careerRealPlayers(taken, restRnd, 'all').forEach(addRest);
  }
  // What the pool cannot fill is ladder, as it always was. The roster is not
  // raided for it any more: the snapshot is the division, and padding it with
  // history would seat people the month says are not there.
  /* Ростер дивизиона живёт сезон, а не неделю. careerSeed сеется неделей, и комната менялась на две
     трети каждую неделю (tools/ladder-persist-probe.js, Д4: 100% внутри недели, 31% через неделю),
     так что выдуманным расти было некому. Теперь сезонный ростер сеется без недели и больше комнаты,
     а неделя только тасует, кто пришёл сегодня. */
  const ladder=ccLadderSeason(cr, open, short);
  let li=0;
  while(players.length < short){
    const from=ladder[li++];
    if(from){
      const k=hKey(from);
      if(taken.has(k)) continue;
      taken.add(k);
      players.push(from);
      continue;
    }
    // Ростер кончился — добираем на месте, как добирали всегда.
    const o = open ? ccOpenFillOvr(rnd)
            : cr.division===1 ? ccD1FillOvr(rnd)
                              : ccBand(cr.division)+careerGauss(rnd)*CC_BAND_SD;
    players.push(careerLadderPlayer(rnd, o, taken, null, null, null, !open && (cr.division||1)>=2));
  }
  // Teams are rating-matched, the way real pairs are: sort, then take
  // neighbours — two of them in a duo season and three in a trio one. These are
  // invented people, so there is no recorded pair inside them and careerTeam is
  // told nothing: a made-up trio is three strangers and is paid as three.
  /* НАСТОЯЩИЕ РЕЖУТСЯ С НАСТОЯЩИМИ.

     Состав здесь — это соседи по рейтингу: список сортируется и режется по
     три подряд. Значит тройка настоящего человека зависит от того, кто из
     ВЫДУМАННЫХ встал рядом с ним в сортировке, — а выдуманных неделя приводит
     разных, и рейтинг у них теперь вдобавок дрейфует (CAREER.devL). Один
     сосед сдвинулся — и нарезка после него переписана целиком.

     Настоящие идут первыми, выдуманные за ними; внутри каждой половины —
     по-прежнему по рейтингу, то есть подбор соседа не меняется. Смешанной
     остаётся одна тройка на стыке, а не весь хвост. */
  players.sort((a,b)=>{
    const la=(a && a.tier==='ladder') ? 1 : 0, lb=(b && b.tier==='ladder') ? 1 : 0;
    if(la!==lb) return la-lb;
    const ra=(a && a._rest!=null) ? a._rest : null, rb=(b && b._rest!=null) ? b._rest : null;
    if(ra!=null && rb!=null) return ra-rb;
    return attrsFor(b).ovr-attrsFor(a).ovr;
  });
  for(let i=0;i+per-1<players.length;i+=per){
    const chunk=players.slice(i, i+per);
    /* And the flags inside an invented team are an invented team's flags.

       Nobody here has a history to read — none of them existed before this
       lobby — but the shape is still measurable, so the seats beside the first
       one are drawn by ccTeamNat: the same flag six times in ten, and otherwise
       one the region really pairs it with. Only generated cards are touched;
       a real leftover keeps the nationality it actually has. */
    const lead=chunk[0] && chunk[0].nat;
    if(lead) chunk.forEach((c, k)=>{
      if(k===0 || !c || c.tier!=='ladder') return;
      const n=ccTeamNat(lead, rnd);
      if(n) c.nat=n;
    });
    const t=careerTeam(chunk, false, open);
    t.name=teamLabel(chunk);
    teams.push(t);
  }
  return teams;
}

/* ---- The partner ----------------------------------------------------------
   The market is not written yet, so one is assigned: somebody of your own band,
   and always a real card off the roster, whatever division the career is in. */
/* ---- The other half of the duo ----------------------------------------------
   The partner grows on the same terms as the player: careerDevelopBase at their
   own age, the same taper near the top, careerMateFactor with the sign flipped,
   the same share of the result, and decline with age. Without this the partner
   was a fixed rating and duos always ended lopsided.
   Age comes from the roster where known (69 of them), otherwise the scene's
   measured median. We store the movement, not the rating. */
let CC_SCENE_AGE=null;
function ccSceneAge(){
  // The median is a property of the roster and is measured once; the seasons on
  // top of it are the career's and are added every time it is asked. Caching the
  // sum would have frozen the stand-in age the way the birthdays were frozen —
  // see ccAgeNow.
  if(CC_SCENE_AGE==null){
    const ages=Object.keys(CC_BORN).map(h=>ccAgeOf(h)).filter(a=>a>0).sort((a,b)=>a-b);
    CC_SCENE_AGE = ages.length ? ages[Math.floor(ages.length/2)] : 20;
  }
  return CC_SCENE_AGE+ccSeasonsIn();
}
/* The seat next to you, which in a trio year is two seats.

   It was one record, CAREER.partner, and about thirty places read it. Most of
   them mean "the person I play with" in a place where one is the answer, so
   careerPartnerCard stays and answers with the first mate and careerMateRec is
   their record; what moved to careerMates is the handful that mean "everybody I
   play with" — the runners, the squad panel, the chemistry.

   Per slot, because they are per person: how long they have been here, how much
   patience they have left, and what this career has done to their rating. */
function careerMateSeats(){ return careerSquadSize()-1; }
function careerMateRecords(){
  const list=(CAREER && CAREER.partners) || [];
  return list.filter(Boolean).slice(0, careerMateSeats());
}
// The first mate's record, which is what a duo means by "the partner".
function careerMateRec(){ return careerMateRecords()[0] || null; }
// One record becomes a list of one. A career that has played a whole season in a
// duo keeps the person it played it with, in the seat they were already in.
function careerMigratePartners(){
  if(!CAREER) return;
  if(!CAREER.partners){
    CAREER.partners = CAREER.partner ? [CAREER.partner] : [];
    delete CAREER.partner;
    careerSave();
  }
  /* And a save that already holds the same person twice keeps one of them.

     careerMateSeat cannot let it happen any more, but the ones it did happen to
     are on disk — his squad of himself, Scroll and Sky came back as himself,
     Sky and Sky. The first chair is the one kept, because that is the one they
     were sitting in when the second was opened. */
  const seen=new Set(), out=[];
  (CAREER.partners||[]).filter(Boolean).forEach(p=>{
    const k=ccMateKeyOf(p);
    if(k && seen.has(k)) return;
    if(k) seen.add(k);
    out.push(p);
  });
  if(out.length!==(CAREER.partners||[]).length){ CAREER.partners=out; careerSave(); }
}
// One person leaves, not the squad. A poach takes the player it names and the
// other seats are untouched — which is the whole difference between losing a
// partner and losing a team.
function careerMateDrop(handle){
  const list=(CAREER && CAREER.partners) || [];
  // A record names its person one of two ways: a roster handle, or a whole card
  // for somebody the roster does not hold. Matching only the first meant a mate
  // who arrived as a card could never leave — check-career-duo caught it.
  const at=list.findIndex(p=>p && (p.handle===handle ||
                                   (p.card && p.card.handle===handle)));
  if(at<0) return false;
  list.splice(at, 1);
  careerSave();
  return true;
}
/* Разрыв записывается на ветку — иначе у разговора нет памяти о нём.

   t.left ставили только пойч и неудержанный напарник; обычные пути ухода —
   мораль и смена сезона — не ставили ничего, и бросивший тебя вчера отвечал
   «да, играем» как незнакомец, почти со стопроцентным согласием. Жалоба игрока. Ветки может не быть только у напарника, взятого до
   первого сообщения, — тогда помнить не на чем, и это честно. */
function careerMateLeftMark(handle){
  if(!handle) return;
  const t=careerDmFind(handle);
  if(!t) return;
  t.left=careerToday();
  t.state='declined';
}
/* Кик напарника крестиком на его карточке, с подтверждением. Без этого уйти из дуо можно было только через
   замену.
   Последствия как у замены: место на ЛАНе у пары, разрыв в июне его теряет (careerSlotGiveUp, то же правило в
   careerMatePoach), репутация −1.
   Подтверждение в careerMateKickAsk, а не здесь: действия карьеры гоняет симуляция, а нативная модалка в headless
   Chrome вешает страницу (так было с careerSkipWeek). */
function careerMateKick(at){
  /* Онлайн состав — напарник-человек первым, потом боты из cr.mates; одиночный список (CAREER.partners) с ним
     не совпадает: крестик у третьего не делал ничего, а у человека выгонял невидимого бота. */
  const mp=ccMpOn() && typeof MP!=='undefined' && !!MP.peer;
  if(mp && at===0) return false;
  const recs=mp ? ccMpMateRecs() : careerMateRecords();
  const rec=recs[mp ? at-1 : at];
  if(!rec) return false;
  const card=careerMates()[at];
  const who=(card && card.handle) || rec.handle || '';
  if(who) careerSlotGiveUp(who);
  if(mp){ const cr=CAREER.career; cr.mates=(cr.mates||[]).filter(p=>p!==rec); }
  else if(!careerMateDrop(rec.handle || who)) return false;
  careerNews('bad', 'ccNewsDropped', [who]);
  careerRepAdd(-1);
  careerEvent('tlDuoQuit', [who]);
  careerSave();
  careerRenderHub();
  return true;
}
/* Что стоит на кону, когда состав меняют.

   Квала принадлежит ПАРЕ: разрыв пары её сжигает, и место уходит команде ниже
   (careerSlotGiveUp, правило). Само правило работало давно, а
   вот сказано вслух оно было в одном месте из трёх — строчкой над кнопкой в
   личке. «Выгнать» и переезд сжигали место молча.

   Игрок: «you should add a warning if you qualled lan with your
   team and then try switch like "are you sure you wanna disband your globals
   spot" or smth with ewc».

   Возвращает хвост к тексту подтверждения — пустую строку, когда терять
   нечего. Отдельного окна не заводит: там, где спрашивают, уже спрашивают. */
function ccSlotCostText(){
  const held=careerSlotHeld();
  return held ? '\n\n'+L().ccSlotLoseAsk(held.what) : '';
}
function careerMateKickAsk(at){
  const card=careerMates()[at];
  if(!card) return;
  ccAsk(L().ccMateKickAsk(card.handle)+ccSlotCostText(), ()=>careerMateKick(at));
}
/* Приём нового напарника — вторая из трёх дверей.

   Над кнопкой уже стояла строчка про цену (ccSlotLoseHint), но строчку читают
   не все, а нажатие необратимо. Спрашивается только когда есть что терять:
   без места ccSlotAsk зовёт действие сразу, и обычный приём в пустое кресло
   остаётся одним нажатием.

   Спрашивает ОБОЛОЧКА, а не careerDmAccept: саму функцию зовут харнессы, и
   вопрос в ней подвесил бы их навсегда — эта ловушка тут уже была. */
function ccSlotAsk(go){
  if(!careerSlotHeld()){ go(); return; }
  ccAsk(L().ccSlotLoseAsk(careerSlotHeld().what), go);
}
function careerDmAcceptAsk(id){
  // В команде третьего берут вдвоём — предложение уходит напарнику.
  if(ccMpOn()){ ccMpThirdAsk(id); return; }
  // Состав другого формата пару года не трогает — терять нечего, вопроса про слот нет.
  const ft=careerDms().find(x=>x.id===id);
  if(ft && ft.fmt && ft.fmt>1 && ft.fmt!==careerSquadSize()){ careerDmAccept(id); return; }
  // Кресло пустое — терять нечего: место сгорает от ЗАМЕНЫ, а не от посадки. Это и
  // свободное третье кресло: пара, берущая третьего в трио-этап года, не разрывается.
  if(!careerPartnerCard() || careerMates().filter(Boolean).length<careerMateSeats()){ careerDmAccept(id); return; }
  ccSlotAsk(()=>careerDmAccept(id));
}
/* Третьего в команду берут оба: один предлагает, второй отвечает, садится только на два «да». Кресло общее (см. ccMpBotSeats).
   Это не ccMpChoose, где вопрос у одного по роли. По проводу два события: 'third' (предложение) и 'third-ok' (ответ). Сажают оба на одном событии, иначе составы разъедутся к следующему вечеру.
   Ответ разбирает один обработчик, повешенный при входе в лобби: спрашивают того, кто сейчас ничего не нажимал.
   Проверка: tools/check-mp-third.js. */
let CC_MP_THIRD_OK=false;     // сейчас применяется согласованная посадка
let CC_MP_THIRD_WAIT=null;    // закрывалка окна «ждём напарника»
function ccMpThirdWho(id){
  const t=(typeof careerDms==='function') ? careerDms().find(x=>x.id===id) : null;
  const h=(t && t.who && t.who.handle) || '';
  return (typeof ccHandle==='function' && h) ? ccHandle(h) : h;
}
function ccMpThirdAsk(id){
  const go=function(){
    if(CC_MP_THIRD_WAIT) CC_MP_THIRD_WAIT();
    CC_MP_THIRD_WAIT=ccMpWaitBox(L().ccMpThirdWait);
    /* Едет ИМЯ, а не номер письма.

       Письма про кресло лежат в личном инбоксе (careerSeatDm пишет их одному
       владельцу лобби), и у напарника ветки с таким id нет вовсе — спросить
       его «берём id 7?» значило бы показать пустое имя. Поэтому предложение
       несёт того, о ком речь, а садит третьего тот, у кого письмо: запись о
       нём уезжает вторым обычным путём, полем mates командного состояния. */
    MP.act('third', {id:id, by:ccMpId(), who:ccMpThirdWho(id)});
  };
  // Место на ЛАНе принадлежит паре: замена его жжёт, посадка на пустое
  // кресло — нет. Правило то же, что и в одиночной карьере, и спрашивается
  // ДО предложения — незачем дёргать напарника ради отменённого хода.
  /* Пустое третье кресло — терять нечего, как и в одиночной карьере (careerDmAcceptAsk): в команде
     напарник есть всегда, и вопрос «потеряете место на ЛАНе?» вставал на каждую посадку третьего в
     трио-этап (годовой прогон вдвоём 2020: перемотка стояла на Llobeti Cup, окно ждало ответа). */
  /* Роль — ДО вопроса напарнику. Второй ИГЛ в составе не садится (careerDmAccept), и раньше это
     выяснялось уже после его «да»: напарник жал «Берём», и ничего не происходило. Теперь конфликт
     ролей сразу открывает ветку с выбором, кто пересядет (тот же разговор, что в одиночной карьере). */
  try{
    const t=careerDms().find(x=>x.id===id);
    const roles=[ccRoleNow()].concat(careerMates().filter(Boolean).map(m=>attrsFor(m).roleKey));
    if(t && t.who && t.who.role && !(t.fmt && t.fmt!==careerSquadSize()) && !ccSquadRoleFits(roles.concat([t.who.role]), careerSquadSize())){
      CC_MP_THIRD_OK=true;
      try{ careerDmAccept(id); } finally{ CC_MP_THIRD_OK=false; }
      careerDmOpen(id);
      return;
    }
  }catch(e){}
  if(!careerPartnerCard() || careerMates().filter(Boolean).length<careerMateSeats()){ go(); return; }
  ccSlotAsk(go);
}
function ccMpThirdWire(){
  if(typeof MP==='undefined' || ccMpThirdWire.done) return;
  ccMpThirdWire.done=true;
  // Одиночный вечер напарника — в свои доски, один раз по ключу (ccEvDeltaSend, ccEvResApply).
  MP.on('act', function(m){
    if(!m || m.kind!=='res' || !m.payload || (typeof ccRaceOn==='function' && ccRaceOn()) || !ccMpTeam()) return;
    if(m.payload.by===ccMpId()) return;
    if(ccEvResApply(m.payload)){ try{ if(typeof careerRenderHub==='function' && document.getElementById('chBody')) careerRenderHub('centre'); }catch(e){} }
  });
  // Напарник прислал хеш таблицы — значит вечер у него кончился.
  MP.on('digest', function(){ ccMpPeerDone(); });
  MP.on('start', function(m){
    /* Свежий старт, когда вечер здесь уже идёт: оба нажали «играть» заново в
       застрявшем вечере, сервер завёл новый. Этот раннер обрывается
       (runGeneration — его паузы бросят RUN_ABANDONED) и вечер запускается
       снова под новым сидом. В перемотке не трогаем: там свой сторож. */
    if(!m || !m.fresh || !CC_MP_RAND || (typeof CC_FF!=='undefined' && CC_FF)) return;
    try{ runGeneration++; }catch(e){}
    ccMpSeedOff();
    setTimeout(function(){ try{ careerBackToHub(); careerPlay(); }catch(e){} }, 50);
  });
  MP.on('act', function(m){
    if(!m || !m.payload || !ccMpOn()) return;
    /* «Пропустить» — голос, и свой считается здесь же, а не при клике: так
       он включается у двоих от одного сообщения. См. ccMpSkipAsk. */
    if(m.kind==='skip'){ ccMpSkipSaw(m.payload.by); return; }
    if(m.kind==='nextday'){ ccMpNextSaw(m.payload); return; }
    if(m.kind==='ff'){ ccMpFfSaw(m.payload); return; }
    if(m.kind==='fferr'){ ccMpFfErrSaw(m.payload); return; }
    if(m.kind==='leave'){ if(m.payload.by!==ccMpId()) ccMpSplitLeave(true); return; }
    if(m.kind==='undo' || m.kind==='undono'){ ccUndoSaw(m.kind, m.payload); return; }
    if(m.kind==='ffskip'){
      if(m.payload.by!==ccMpId() && m.payload.day){
        CC_MP_PEER_SKIPS.add(m.payload.day);
        if(typeof CC_FF!=='undefined' && CC_FF && MP.gate && (MP.gateDay||careerToday())===m.payload.day && MP.gateCancel){
          CC_MP_FF_SKIPDAY=m.payload.day; MP.gateCancel('peer skipped '+m.payload.day);
        }
      }
      return;
    }
    if(m.kind==='apart'){ if(m.payload.by!==ccMpId()){ try{ ccMpSplitSeen(CC_MP_GAME||'?', 'peer split'); }catch(e){} ccMpSplitApart(true); } return; }
    if(m.kind==='ffno'){ ccMpFfNoSaw(m.payload); return; }
    if(m.kind==='gift'){ ccGiftSaw(m.payload); return; }
    if(m.kind==='syncreq'){ if(m.payload.by!==ccMpId() && !CC_MP_RAND && MP.push) MP.push(ccTeamState()); return; }
    if(m.kind==='fmtpick'){
      if(m.payload.by===ccMpId()) return;
      const p=m.payload;
      ccAsk(L().ccMpFmtAsk ? L().ccMpFmtAsk(String(p.h||'?'), p.f) : L().ccMpThirdAsk(p.h),
        function(){ MP.act('fmtpick-ok', {f:p.f, h:p.h, ok:true, to:p.by, by:ccMpId()}); },
        {yes:L().ccMpThirdYes, no:L().ccMpThirdNo,
         onNo:function(){ MP.act('fmtpick-ok', {f:p.f, h:p.h, ok:false, to:p.by, by:ccMpId()}); }});
      return;
    }
    if(m.kind==='fmtpick-ok'){
      if(CC_MP_THIRD_WAIT && m.payload.to===ccMpId()){ CC_MP_THIRD_WAIT(); CC_MP_THIRD_WAIT=null; }
      if(m.payload.ok) ccMpFmtPickApply(m.payload.f, m.payload.h);
      return;
    }
    if(m.kind==='third'){
      // Своё же предложение вернулось эхом — ждём ответа, окно уже открыто.
      if(m.payload.by===ccMpId()) return;
      ccAsk(L().ccMpThirdAsk(m.payload.who || '?'),
        function(){ MP.act('third-ok', {id:m.payload.id, ok:true, to:m.payload.by}); },
        {yes:L().ccMpThirdYes, no:L().ccMpThirdNo,
         onNo:function(){ MP.act('third-ok', {id:m.payload.id, ok:false, to:m.payload.by}); }});
      return;
    }
    if(m.kind==='third-ok'){
      // Ответ пришёл — ждать нечего, чем бы он ни был.
      if(CC_MP_THIRD_WAIT){ CC_MP_THIRD_WAIT(); CC_MP_THIRD_WAIT=null; }
      // Сажает тот, у кого письмо: у второго этой ветки в инбоксе нет.
      if(!m.payload.ok || m.payload.to!==ccMpId()) return;
      CC_MP_THIRD_OK=true;
      try{ careerDmAccept(m.payload.id); }
      finally{ CC_MP_THIRD_OK=false; }
    }
  });
}
/* Переезд — третья дверь, и самая тихая из трёх.

   Уехать ВМЕСТЕ место сохраняет: пара цела, значит и квала при ней. Уехать
   одному — сжигает, и раньше об этом сообщала только строчка в ленте уже
   постфактум («место ушло»), на которую игрок и жаловался. Поэтому
   спрашивается ровно тот переезд, который платит: без команды. */
function careerMoveAsk(code, country, withMates){
  if(withMates){ careerMoveRegion(code, country, true); return; }
  ccSlotAsk(()=>careerMoveRegion(code, country));
}

/* Somebody takes a chair.

   The empty one if there is an empty one, which is the whole of it in a trio
   with a seat open. With none, this is the swap the mode has always had: you
   accept a better card and the season you had together is gone, which
   check-career-chem states as a rule. The person who loses the chair is the
   weakest of them, because the offer being worth taking is what makes it a swap
   — dropping the one you had longest instead would cost the chemistry twice.

   Never more people than the season is played by. */
// A seat record names its person one of two ways — a roster handle, or a whole
// card for somebody the roster does not hold. This is that person, either way.
function ccMateKeyOf(rec){
  if(!rec) return '';
  return hKey({handle: rec.handle || (rec.card && rec.card.handle) || ''});
}
/* Nobody sits in two chairs.

   His report, 20 August, in a trios season: the squad was him, Scroll and Sky,
   he pressed Scroll to change that seat, and what he got was a second Sky. The
   pools all hold the rule — careerDmPool and careerDuoSearchPool both filter the
   squad out — but a conversation that was already open does not go through a
   pool, and a named chair was answered exactly as asked: whoever was handed over
   went into that chair, including somebody sitting in the chair beside it.

   So the rule is where the seating happens rather than in the six places that
   lead to it: somebody already in the squad cannot be seated again. Asked for a
   chair they are not in, the answer is no — the seat they hold is the seat they
   hold, and swapping the two would be a shuffle nobody asked for. */
function careerMateSeat(rec, seat){
  if(!CAREER || !rec) return false;
  // Гонка: одинаковых ботов брать нельзя (отзыв) — напарник соперника занят.
  if(typeof ccRaceOn==='function' && ccRaceOn() && ccRaceTakenKeys().has(ccMateKeyOf(rec))){
    try{ if(typeof ccMpTell==='function') ccMpTell(L().ccRaceBotTaken); }catch(e){}
    return false;
  }
  /* В командной карьере взятые садятся в ОБЩИЙ список: он едет напарнику
     вместе с днём, и третий у обоих один. Кресел под них ровно столько,
     сколько остаётся от двух живых (ccMpBotSeats) — в дуо ноль, в трио одно. */
  if(ccMpOn()){
    const cr=CAREER.career;
    if(!Array.isArray(cr.mates)) cr.mates=[];
    // Владелец лобби — или любой из двоих на два «да» (CC_MP_THIRD_OK).
    if((cr.mp.role||'a')!=='a' && !CC_MP_THIRD_OK) return false;
    const key=ccMateKeyOf(rec);
    const at=key ? cr.mates.findIndex(p=>ccMateKeyOf(p)===key) : -1;
    if(at>=0){ cr.mates[at]=rec; return true; }
    if(cr.mates.length>=ccMpBotSeats()) return false;
    cr.mates.push(rec);
    return true;
  }
  CAREER.partners=(CAREER.partners||[]).filter(Boolean).slice(0, careerMateSeats());
  const key=ccMateKeyOf(rec);
  if(key){
    const at=CAREER.partners.findIndex(p=>ccMateKeyOf(p)===key);
    if(at>=0){
      // Already here. A fresh record for the same person updates the chair they
      // are in — their patience or their card may have moved — and never opens
      // a second one.
      CAREER.partners[at]=rec;
      return (typeof seat!=='number') || seat===at;
    }
  }
  /* A named chair is answered exactly, whatever is sitting in it.

     The rule underneath — the weakest one goes — is for when nobody said which,
     and it is the right rule then. It is the wrong one the moment the player
     points at a card: he looked at both and decided, and taking the other one
     because it happens to be rated lower is the mode overruling him. */
  if(typeof seat==='number' && seat>=0 && seat<careerMateSeats()){
    if(seat<CAREER.partners.length){ ccMateParted(CAREER.partners[seat]); CAREER.partners[seat]=rec; return true; }
    CAREER.partners.push(rec); return true;
  }
  if(CAREER.partners.length<careerMateSeats()){ CAREER.partners.push(rec); return true; }
  const rate=p=>{ const c=ccMateCardOf(p); if(!c) return -Infinity;
                  const o=(c._ovr!=null ? c._ovr : (attrsFor(c)||{}).ovr);
                  return isFinite(o) ? o : -Infinity; };
  let worst=0;
  CAREER.partners.forEach((p,i)=>{ if(rate(p)<rate(CAREER.partners[worst])) worst=i; });
  ccMateParted(CAREER.partners[worst]);
  CAREER.partners[worst]=rec;
  return true;
}
/* Брошенный напарник — какое-то время без пары.

   Тестер, 16 сентября: «если взять новое дуо, твой бывший тимейт обязательно
   уйдёт к бывшему тимейту твоего нового дуо». Проба career-orphan-mate-probe:
   так и было, и не случайно. Половинка взятой пары остаётся одна, и
   ccOrphanPairs сажает к ней БЛИЖАЙШЕГО ПО СИЛЕ свободного — а сильных
   свободных в пуле почти нет (565 свободных, из них 85+ — двое, 80–85 —
   двенадцать). Только что брошенный напарник — как раз сильный и как раз
   свободный: он и есть ближайший, всегда.

   Поэтому брошенный стоит на рынке те же две недели, что и половинка
   распавшейся пары (CC_FA_DAYS в careerPools): в эти дни его к сироте не
   сажают. Книга — cr.exMates {ключ: день}. */
function ccMateParted(rec){
  const cr=CAREER && CAREER.career; if(!cr || !rec) return;
  const k=ccMateKeyOf(rec); if(!k) return;
  cr.exMates=cr.exMates||{};
  cr.exMates[k]=careerToday();
}
function ccMateJustParted(key){
  const cr=CAREER && CAREER.career;
  const d=cr && cr.exMates && cr.exMates[key];
  return !!d && ccDaysBetween(d, careerToday())<14;
}
/* Nobody in the squad is still asking to play with you.

   A conversation that stands as an offer keeps its accept button, and a seat can
   be taken in a different thread — you write to one person while another one is
   still waiting on an answer, or the second chair of a trio is filled from the
   search list. The people who ended up beside you went on offering a duo to the
   person they already play with. His report, 20 August.

   Called wherever a chair changes hands rather than at render, so the save is
   the thing that is right and the screen only draws it. */
function careerDmSquadTidy(){
  if(!CAREER || !CAREER.dms) return;
  const mine=ccMyPeople();
  careerDms().forEach(t=>{
    if(t.state==='offer' && t.who && !t.who.org && !t.who.brand &&
       mine.has(hKey(t.who.handle))) t.state='partner';
  });
}
function careerMateDev(){ return (careerMateRec() || {}).dev || 0; }
/* Everybody in the squad has the week, so everybody in the squad grows from it.

   This read careerMateRec and careerPartnerCard — both of which mean seat one —
   so in a trios season the second seat never moved: a career could play a whole
   year beside somebody and leave them exactly where they were found, while the
   first seat climbed. The note under ccMateLift already promised a trio's two
   seats would not share one development number; the lift kept that promise and
   the growth never gave it anything to lift. His report, 20 August.

   The sum comes back rather than one seat's delta, because the only caller
   ignores it and a total is the honest answer to "how much did the squad
   improve". */
function careerMateGrow(actual, expected){
  const recs=careerMateRecords();
  if(!recs.length) return 0;
  const mine=(CAREER.player.ovrExact!=null?CAREER.player.ovrExact:CAREER.player.ovr);
  let total=0;
  recs.forEach(function(pr){
    const card=ccMateCardOf(pr);
    if(!card) return;
    const now=(card._ovr!=null ? card._ovr : (attrsFor(card)||{}).ovr);
    if(!(now>0)) return;
    const taper=clamp((CAREER_SCALE_TOP-now)/CAREER_TAPER, 0, 1);
    const base=careerDevelopNow(ccAgeNow(pr.handle) || ccSceneAge());
    // The gap read from their side of the seat.
    const gap=mine-now;
    const pull=clamp(1+(gap>0 ? gap*CC_MATE_UP : gap*CC_MATE_DOWN), CC_MATE_MIN, CC_MATE_MAX);
    // The same setting on the same terms — see careerApplyGrowth. Without it the
    // seat beside a Legend career sank while the career itself held.
    /* Результат тоже идёт через запас до потолка — и в ОБЕ стороны.

       Здесь была та же односторонность, что и у сцены (см. careerGrowField):
       возрастная половина резалась запасом, а результат шёл целиком. У
       напарника на 96 запас 0.3, то есть удачный вечер стоил ему трети, а
       неудачный — целого, и шум становился налогом.

       До 27 августа это пряталось: сцена сама сползала, карточка напарника
       вместе с ней, запас рос и тейпер переставал жать. Как только сцена
       перестала сползать, дырка вылезла наружу — check-career-mate-drift
       покраснел на −1.66 при пороге −1.5, хотя на выложенной сборке давал
       −0.4. Лечится тем же, чем у сцены: у потолка вечер значит мало, но
       одинаково мало вверх и вниз. */
    /* Возрастная половина у напарника весит как у сцены (CC_SCENE_AGE_W). Полная кривая только у своей карьеры
       (careerApplyGrowth). С полной кривой напарник за полсезона уходил выше игрока. Тяга к силе игрока (pull)
       остаётся, она и отличает соседа по креслу от постороннего. */
    const delta=base*(base>0?taper:1)*pull*CC_SCENE_AGE_W
                + (actual-expected)*careerGrowthMax()*careerDiff().age*taper;
    pr.dev=clamp((pr.dev||0)+delta, -40, 40);
    total+=delta;
  });
  return total;
}
// What this career has done to them since they took the seat, applied to a
// copy: the roster's card is the roster's, and attrsFor lifts the six numbers
// onto whatever rating it is handed. Per person, so a trio's two seats do not
// share one development number.
function ccMateLift(c, dev){
  if(!dev || !c) return c;
  const base=(c._ovr!=null ? c._ovr : (attrsFor(c)||{}).ovr);
  if(!(base>0)) return c;
  const to=clamp(Math.round(base+dev), 35, CAREER_SCALE_TOP);
  const out={...c, _targetOvr:to, rating:to};
  delete out._attrs; delete out._ovr;
  return out;
}
function ccMateCardOf(pr){
  if(!pr) return null;
  const dev=pr.dev||0;
  const cast=c=>{
    /* Пересадка, записанная кнопкой в профиле. Держится на записи, а не на
       карточке, потому что карточку ccMateLift пересобирает под каждый новый
       рейтинг и стирает с неё разложенные статы. См. careerRoleSwap.

       ccRecastRole, а не ccCastLadderRole: у второй стоит охрана «только
       выдуманного», и она здесь не к месту. Охрана нужна там, где решают, —
       ccSquadCastRoles пересаживает соседей молча, когда собирает лобби, и
       настоящего игрока трогать не должна. Здесь решение уже принято и записано
       в pr.role: либо мод переставил придуманного, либо настоящий согласился
       сам. Пока строка была общей, согласие некуда было применить — напарник
       говорил «да» и оставался в своей роли. */
    if(c && pr.role) ccRecastRole(c, pr.role);
    return c;
  };
  /* Клуб записи (подписан вместе с тобой — careerOrgSignMates, или позван в клуб — ccOrgBringMate) главнее
     клуба карточки года: иначе напарник, подписанный с тобой, так и висел в старом клубе. */
  const withOrg=c=>{ if(c && pr.org) c.org=pr.org; return c; };
  if(pr.card) return withOrg(cast(ccMateLift(pr.card, dev)));
  // The newest 2026 card first — a handle used to resolve to whichever card of
  // that person PLAYERS happened to list first, any era — then the whole
  // roster for a legacy save whose partner has no card this year.
  /* В СОСТАВЕ РЕЙТИНГ НЕ ИДЁТ ЗА РЕАЛЬНОЙ ИСТОРИЕЙ (его слово 29.09: «пусть деградация наступает, если
     результаты плохие»). Карточка года даёт человеку статы и клуб, но основа рейтинга — та, с которой он
     сел в состав (pr.base, пишется при первом чтении); дальше его двигают только ваши вечера и возраст
     (pr.dev, careerMateDevelop). Монграл, взятый в 2019-м на 96, в 2021-м не падает к своим 62 сам —
     только если вы играете хуже, чем должны. Ушёл из состава — снова живёт по карточке года. */
  const own0=careerRosterNowEU().find(x=>x.handle===pr.handle);
  const now=own0 || (pr.cardRegion && pr.cardRegion!==ccCareerRegion()
    ? ccSceneRoster(pr.cardRegion).find(x=>x.handle===pr.handle) : null);
  const found=now || PLAYERS.find(x=>x.handle===pr.handle && x.region===(pr.cardRegion||'EU') && (ccNowYear()>=2026 || ccCardYear(x)<=ccNowYear()));
  if(!found) return null;
  const c={...found};
  const own=(c._ovr!=null ? c._ovr : (attrsFor(c)||{}).ovr);
  if(pr.base==null && own>0) pr.base=Math.round(own);
  if(pr.base>0 && pr.base!==own){ c._ovr=pr.base; c._targetOvr=pr.base; c.rating=pr.base; delete c._attrs; delete c._floored; }
  return withOrg(cast(ccMateLift(c, dev)));
}
/* Сцена растёт от своих результатов. Та же арифметика, что у карьеры и напарника: возрастная кривая плюс
   место против ожидаемого по силе. Ожидание из того же лобби, так что по комнате сумма около нуля, инфляции нет.
   Двигаются только настоящие люди ростера; выдуманные живут один вечер, см. careerLadderPlayer.
   Хранится сдвиг в сейве карьеры, а не рейтинг: PLAYERS это измеренные карточки, их не переписываем.
   Сдвиг надевается на копию карточки, как ccMateLift у напарника. */
// Сколько расставаний за вечер вообще попадает в ленту. См. careerGrowField.
const CC_SPLIT_POSTS_DAY=2;
const CC_SCENE_DEV_MAX=25;
/* Вес возрастной кривой для чужих. careerDevelopBase рассчитана на свою карьеру (0.10 за турнир), а сцене
   она достаётся каждый вечер, 109 раз в год, и (base − mid) роняла старших на 5–6 рейтинга за год
   (career-year-drift-probe: Th0masHD −6.2, PodaSai −4.6, MrSavage −4.2). Множитель подобран так, чтобы
   знакомое имя за год сдвигалось в пределах пары рейтинга. Свою карьеру не трогает, у careerApplyGrowth своя кривая. */
const CC_SCENE_AGE_W=0.6;
// Возраст, на котором про перестаёт прибавлять: моложе — растут, старше — сходят.
// Взят по кривой careerDevelopBase, где ступень 22-24 и есть плато карьеры.
const CC_SCENE_AGE_REF=23;
/* Выдуманные тоже растут и падают, но в своей книге CAREER.devL. До этого ниже Д1 не двигался никто
   (tools/ladder-grow-diag.js: 1258 выдуманных из 1259, ноль записей). Общая книга на всю комнату дала бы ~702 КБ
   сейва за год, поэтому сдвиги меньше CC_DEV_L_MIN не пишутся, а сверх CC_DEV_L_MAX остаются крупнейшие по модулю.
   Мелочь не резать: за ночь сдвиг десятые доли, ему нужно копиться. Ростер низших дивизионов постоянный
   на сезон (ccLadderSeason), поэтому сдвиги накапливаются. CAREER.dev настоящей сцены не меняется. */
const CC_DEV_L_MAX=600;
function careerDevOf(p){
  if(!CAREER) return 0;
  const k=hKey(p);
  const book=CAREER.dev;
  if(book && book[k]) return book[k];
  const lad=CAREER.devL;
  return (lad && lad[k]) || 0;
}
/* Книга выдуманных обрезается ПОСЛЕ вечера, а не во время: за один вечер в неё
   приходит вся комната, и решать, кто в ней останется, можно только когда все
   сдвиги уже посчитаны. Уходит хвост по модулю — те, кого сезон двигал меньше
   всех, и кого игрок поэтому всё равно не заметит. */
function ccDevLTrim(){
  const lad=CAREER && CAREER.devL;
  if(!lad) return;
  const keys=Object.keys(lad);
  if(keys.length<=CC_DEV_L_MAX) return;
  keys.sort((a,b)=>Math.abs(lad[b])-Math.abs(lad[a]))
      .slice(CC_DEV_L_MAX).forEach(k=>{ delete lad[k]; });
}
/* Потенциал из жизни. Карьера в следующем году (ccContinuity) живёт людьми года
   старта, а их карточка года календаря становится целью: рейтинг подтягивается
   к ней, половина разницы за CC_REAL_PULL_HALF дней (к первому Мейджору).
   Считается от даты, не копится в сейве, поэтому одинаково в гонке и после
   перезагрузки; шаг неделя, чтобы сцена не пересобиралась каждый день (ccSceneTag).
   Сверху ложится careerDevOf. Нет карточки года, нет цели: мы пишем не все турниры. */
// Год начинается в декабре, первый Мейджор — в марте: ~90 дней = половина разницы, к концу сезона ~90%.
const CC_REAL_PULL_HALF=90;
/* МЕЖСЕЗОНЬЕ ДВИГАЕТ РЕЙТИНГ СРАЗУ.

   Тестер, страница «05» (5.10): «рейтинг кстати не меняется, когда новый сезон
   начинается». Так и было: в первый день года подтяжка была ноль, и сцена
   стояла на прошлогодних числах шесть недель, пока набегала хотя бы единица.
   Замер (tools/p05-pull.js, Европа 2024→2025): разница с рейтингом 2025-го у
   330 человек в среднем 9.7, у 233 — пять и больше; в день стыка изменилось 0
   из 834, через шесть недель — в среднем на единицу. Теперь стык сам закрывает
   треть разницы (как обновление рейтингов к новому сезону), остальное идёт
   постепенно, как шло. */
/* И ДВЕ ТРЕТИ, А НЕ ТРЕТЬ (Notion «fncsdraft 15.10», 16.10: «у части ботов рейтинг даже
   близко не становится похож на реальный, когда новая глава начинается»). Замер
   (tools/check-career-chapter-squads.js, карьера 2020-го, стыки 2021–2026): в день стыка
   с рейтингом года расходятся на 5+ от 150 до 280 человек. Постепенность остаётся
   (выбор «постепенно за сезон»), но стык теперь — обновление рейтингов к сезону всерьёз. */
const CC_REAL_PULL_OPEN=2/3;
let CC_NOW_YEAR_FORCE=0;
const CC_REAL_TARGETS={};
function ccRealPullStep(){
  if(typeof CAREER==='undefined' || !CAREER || !CAREER.career || !ccContinuity()) return 0;
  return 1+Math.floor(ccDaysBetween(ccYearFrom(), careerToday())/7);
}
function ccRealPullCurve(step){
  return CC_REAL_PULL_OPEN+(1-CC_REAL_PULL_OPEN)*(1-Math.pow(0.5, (step-1)*7/CC_REAL_PULL_HALF));
}
function ccRealPullFrac(){
  const step=ccRealPullStep();
  if(!step) return 0;
  /* Календарь после 2026-го — снова 2026-й (ccSeasonYear), и до этой правки
     подтяжка начиналась с нуля каждый такой сезон: дошедшие за год до своего
     2026-го откатывались назад на стыке. Год 2026 уже прожит — цель держится. */
  if(ccCalYear()>=2026 && ccYearShift()>0) return ccRealYearEndFrac(2026);
  return ccRealPullCurve(step);
}
// Рейтинг каждого человека в году year — так, как его считает свежая карьера того года.
// reg — регион сцены (по умолчанию тот, чей пул сейчас строится).
function ccRealTargets(year, reg){
  const R=reg || ccPoolRegion();
  const key=year+'|'+R;
  if(CC_REAL_TARGETS[key]) return CC_REAL_TARGETS[key];
  const m=new Map(), was=CC_NOW_YEAR_FORCE;
  const run=()=>ccEuCards().forEach(c=>{
    if(ccCardYear(c)!==year) return;
    const cur=m.get(c._k);
    if(cur==null || c._ovr>cur) m.set(c._k, c._ovr);
  });
  CC_NOW_YEAR_FORCE=year;
  try{
    if(R===ccPoolRegion()) run();
    else if(R==='ALL') ccAsWorld(run);
    else ccAsRegion(R, run);
  } finally { CC_NOW_YEAR_FORCE=was; }
  CC_REAL_TARGETS[key]=m;
  return m;
}
/* ДЕБЮТАНТЫ СЛЕДУЮЩИХ ЛЕТ.

   У карьеры, начатой в 2024-м, в 2025-м не было
   ни одного новичка 2025-го — 593 человека в Европе, 97 из топ-300 года, — и
   настоящие трио с ними стояли без третьего. Теперь на стыке года в сцену
   входят те, у кого нет ни одной карточки до года старта карьеры, но есть
   карточка следующего года (до года календаря включительно): со своей
   карточкой года дебюта и своим настоящим рейтингом того года. Дальше их ведёт
   тот же потенциал (ccRealPull) — цепочка с года дебюта. */
const CC_DEBUT={};
function ccDebutants(reg){
  if(CC_NOW_YEAR_FORCE || typeof CAREER==='undefined' || !CAREER || !CAREER.career || !ccContinuity()) return null;
  const R=reg || ccPoolRegion(), y0=ccNowYear(), y1=ccCalYear();
  const key=R+'|'+y0+'|'+y1;
  if(CC_DEBUT[key]) return CC_DEBUT[key];
  const inReg=p=>R==='ALL' || (p.region||'')===R;
  /* «Известен» — тот, кто стоит в сцене года старта, то есть у кого есть карточка
     ИМЕННО этого года (ccSceneRoster). Игравший раньше, но пропустивший год старта,
     возвращается дебютантом — с рейтингом года возвращения, а не с позапрошлогодним. */
  const known=new Set();
  PLAYERS.forEach(p=>{ if(inReg(p) && ccCardYear(p)===y0) known.add(hKey(p)); });
  const m=new Map();
  for(let y=y0+1; y<=y1; y++){
    ccRealTargets(y, R).forEach((ovr, k)=>{
      if(!known.has(k) && !m.has(k)) m.set(k, {year:y, ovr:ovr});
    });
  }
  CC_DEBUT[key]=m;
  return m;
}
// Копия карточки дебютанта: рейтинг — настоящий рейтинг года дебюта.
function ccDebutCard(p, deb){
  const c={...p}, a=attrsFor(p);
  c._k=hKey(p);
  c._attrs={...a, _floored:false};
  c._targetOvr=deb.ovr; c.rating=deb.ovr; c._ovr=deb.ovr;
  c._debut=deb.year;
  return c;
}
/* РЕГЕНЫ (Notion «19.10», тестер: «как в фифе добавить регенов… когда месси карьеру завершает, появляется
   аргентинец с очень крутыми статами, и логично, что это реген месси; либо реген не чей-то, а просто рандомный»).

   Настоящие данные кончаются на 2026-м: дальше каждый год — тот же 2026-й, и сцена без этого не стареет и не
   обновляется. Теперь на каждом стыке года после 2026-го (ccYearShift) часть сцены уходит — чем старше, тем
   вероятнее (возраст ccAgeNow; без даты рождения — ровный шанс), — а на место ушедшего приходит новичок
   16–17 лет: та же страна и регион, тот же почерк (шесть чисел — с карточки ушедшего, растянутые к его
   рейтингу), стартует ниже и год за годом растёт к уровню оригинала. Ушедшая звезда (84+) всегда оставляет
   регена — «видно, чей он»; остальные — через раз, и тогда это просто новичок.

   Решение пишется в сейв один раз на год (cr.regen: y — до какого года посчитано, out — ушедшие, list —
   регены), поэтому сцена одна и та же при каждой загрузке. Свои напарники и составы не уходят. */
const CC_REGEN_STAR=84;
const CC_REGEN_A=['Ky','Zo','Vex','Ri','No','Lu','Tre','Mak','Sol','Ven','Jax','Ori','Fen','Kai','Rex','Dru','Ash','Lio','Nyx','Pax',
  'Bry','Cael','Dax','Eli','Fyn','Gus','Hux','Ivo','Jin','Kov','Lex','Mav','Nox','Oz','Pim','Quin','Rho','Sky','Tav','Ulv','Vio','Wyn','Yuk','Zev'];
const CC_REGEN_B=['ro','ix','en','yo','zz','ly','ka','ra','on','is','ex','ii','ey','o','a','zy','va','no','th','ko','ri','us','el','x','n'];
const CC_REGEN_C=['', '', '', '', 'z', 'x', 'FN', 'fn', 'TTV', '1', '7', '22', '09', 'Pro', 'OG', 'Jr'];
function ccRegenOn(){
  const cr=(typeof CAREER!=='undefined' && CAREER && CAREER.career) || null;
  return !!(cr && !CC_NOW_YEAR_FORCE && ccYearShift()>0);
}
function ccRegenName(seed, taken){
  for(let i=0; i<40; i++){
    const h=ccHashStr(seed+'|'+i);
    const a=CC_REGEN_A[h%CC_REGEN_A.length], b=CC_REGEN_B[Math.floor(h/53)%CC_REGEN_B.length], c=CC_REGEN_C[Math.floor(h/1597)%CC_REGEN_C.length];
    const name=(i>=20 ? a+b+c+(h%90+10) : a+b+c);
    if(!taken.has(name.toLowerCase())){ taken.add(name.toLowerCase()); return name; }
  }
  return 'Rookie'+(ccHashStr(seed)%9000+1000);
}
// Свои: напарники, составы других форматов, сам игрок — они не уходят, даже старые.
function ccRegenKeep(){
  const keep=new Set();
  const add=r=>{ if(!r) return; const h=r.card ? r.card.handle : r.handle; if(h) keep.add(hKey(h)); };
  (CAREER.partners||[]).forEach(add); add(CAREER.partner);
  Object.values(CAREER.rosters||{}).forEach(l=>(l||[]).forEach(add));
  try{ const me=careerCard(); if(me) keep.add(hKey(me)); }catch(e){}
  return keep;
}
/* Шанс уйти за год по возрасту на этот год. Слово 19.10: «до 30 это очень рано для киберспортсмена» —
   до 30 уходят единицы, с 30 — 45 % в год (его «после 30 будет 45 всегда»). Без даты рождения — 3 %. Слабый (ниже 70) уходит чаще, но не раньше 25. */
function ccRegenRetireP(age, ovr){
  let p=age==null ? 0.03 : age<25 ? 0 : age<28 ? 0.02 : age<30 ? 0.05 : 0.45;
  if(ovr<70 && (age==null || age>=25)) p+=0.05;
  return p;
}
function ccRegenYear(cr, y){
  const R=cr.regen, keep=ccRegenKeep(), seed=String(cr.seed||'')+'|'+(cr.year0||'')+'|rg'+y;
  const taken=new Set(PLAYERS.map(p=>hKey(p))); R.list.forEach(g=>taken.add(hKey(g.h)));
  // Самая свежая карточка 2026-го на человека (ключ — регион+ник: тёзки разных регионов — разные люди).
  const best=new Map();
  PLAYERS.forEach(p=>{
    if(ccCardYear(p)!==2026 || CC_REGIONS.indexOf(p.region||'')<0) return;
    const k=(p.region||'')+'|'+hKey(p), d=ccCardDay(p)||0, cur=best.get(k);
    if(!cur || d>cur.d) best.set(k, {p:p, d:d});
  });
  // И регены прошлых лет стареют и уходят так же.
  const people=[];
  best.forEach(({p}, k)=>{ if(!R.out[hKey(p)]) people.push({k:hKey(p), handle:p.handle, reg:p.region, nat:p.nat||'', card:p,
    ovr:Math.round((attrsFor(p)||{}).ovr||p.rating||0)+Math.round(careerDevOf({...p, _k:hKey(p)})||0)}); });
  R.list.forEach(g=>{ if(!R.out[hKey(g.h)]) people.push({k:hKey(g.h), handle:g.h, reg:g.reg, nat:g.nat, regen:g, ovr:ccRegenOvr(g, y)}); });
  const gone=[], born=[];
  people.forEach(x=>{
    if(keep.has(x.k)) return;
    const age=x.regen ? (17+(y-x.regen.y)+(x.regen.a-16)) : ccAgeShown(x.handle);
    const roll=(ccHashStr(seed+'|'+x.k)%10000)/10000;
    if(roll>=ccRegenRetireP(age, x.ovr)) return;
    R.out[x.k]=y; gone.push({h:x.handle, age:age, ovr:x.ovr, reg:x.reg});
    // «Завершили карьеру» (его «да» 20.10): заметные ушедшие (75+) — в R.past, со сменщиком-регеном, если он будет.
    const pastRow=x.ovr>=CC_REGEN_PAST_MIN ? {h:x.handle, y:y, age:age, ovr:x.ovr, reg:x.reg, nat:x.nat||'', regen:!!x.regen} : null;
    if(pastRow){ R.past=R.past||[]; R.past.push(pastRow); }
    const star=x.ovr>=CC_REGEN_STAR;
    if(!star && (ccHashStr(seed+'|b|'+x.k)%2)) return;
    const h2=ccHashStr(seed+'|g|'+x.k);
    const src=x.regen ? x.regen.src : x.handle;
    const peak=clamp(x.ovr+((h2%7)-3), 55, CAREER_SCALE_TOP);
    const g={h:ccRegenName(seed+'|'+x.k, taken), of:x.handle, src:src, srcReg:x.regen ? x.regen.srcReg : x.reg, reg:x.reg, nat:x.nat, y:y,
      a:16+(h2%2), o0:clamp(peak-(star ? 9 : 7)-(Math.floor(h2/7)%5), 50, 92), to:peak, gr:2+(Math.floor(h2/31)%3)};
    R.list.push(g); born.push(g);
    if(pastRow) pastRow.by=g.h;
  });
  // Список ушедших держится коротким: сильнейшие CC_REGEN_PAST_MAX (сейв не пухнет к 2040-м).
  if(R.past && R.past.length>CC_REGEN_PAST_MAX) R.past=R.past.sort((a,b)=>b.ovr-a.ovr || b.y-a.y).slice(0, CC_REGEN_PAST_MAX);
  // В ленту — заметные: ушедшие 84+ и их регены, не больше четырёх строк каждого.
  const my=ccCareerRegion();
  gone.filter(x=>x.ovr>=CC_REGEN_STAR).sort((a,b)=>(b.reg===my)-(a.reg===my) || b.ovr-a.ovr).slice(0, 4)
    .forEach(x=>careerNews('flat', 'ccNewsSceneRetire', [x.h, x.age!=null ? x.age : 0]));
  born.filter(g=>g.of && ccRegenOvr(g, y)>=70).sort((a,b)=>(b.reg===my)-(a.reg===my) || b.to-a.to).slice(0, 4)
    .forEach(g=>careerNews('good', 'ccNewsRegen', [g.h, g.a, g.of, g.nat||'']));
}
// Рейтинг регена в год y: старт o0, растёт на gr в год до to.
function ccRegenOvr(g, y){ return Math.min(g.to, g.o0+g.gr*Math.max(0, y-g.y)); }
function ccRegenSync(){
  if(!ccRegenOn()) return null;
  const cr=CAREER.career, shift=ccYearShift();
  if(!cr.regen) cr.regen={y:0, out:{}, list:[]};
  // Сейв до 20.10: уходы уже были, а списка «Завершили карьеру» нет — собирается из R.out и ссылок регенов (возраст — нынешний минус годы).
  if(!cr.regen.past && cr.regen.y>0) try{
    const R=cr.regen, by={}, card={};
    R.list.forEach(g=>{ if(g.of) by[hKey(g.of)]=g.h; });
    PLAYERS.forEach(p=>{ if(ccCardYear(p)===2026){ const k=hKey(p), c=card[k]; if(!c || (ccCardDay(p)||0)>(ccCardDay(c)||0)) card[k]=p; } });
    R.past=Object.keys(R.out).map(k=>{ const p=card[k]; if(!p) return null; const ovr=Math.round((attrsFor(p)||{}).ovr||p.rating||0);
      if(ovr<CC_REGEN_PAST_MIN) return null; const a=ccAgeShown(p.handle);
      return {h:p.handle, y:R.out[k], age:a!=null ? a-(shift-R.out[k]) : null, ovr, reg:p.region, nat:p.nat||'', by:by[k]||undefined}; })
      .filter(Boolean).sort((a,b)=>b.ovr-a.ovr).slice(0, CC_REGEN_PAST_MAX);
  }catch(e){ cr.regen.past=[]; }
  if(cr.regen.y>=shift) return cr.regen;
  while(cr.regen.y<shift){ cr.regen.y++; ccRegenYear(cr, cr.regen.y); }
  CC_NOW_CARDS={}; CC_EU_ALL={}; CC_POOLS=null; CC_REGEN_CARDS={};
  if(typeof careerSave==='function') careerSave();
  return cr.regen;
}
// Ушёл из сцены (по году карьеры) — его карточек нет ни в сцене, ни в лобби.
function ccRegenGone(p){
  if(!ccRegenOn()) return false;
  const R=CAREER.career.regen;
  return !!(R && R.out[hKey(p)]);
}
function ccRegenTag(){ const R=ccRegenOn() && CAREER.career.regen; return R ? '|g'+R.y+'.'+R.list.length : ''; }
// Карточки регенов региона: карточка ушедшего-«исходника» под новым ником, растянутая к рейтингу года.
let CC_REGEN_CARDS={};
function ccRegenCards(reg){
  const R=ccRegenSync(); if(!R || !R.list.length) return [];
  const y=ccYearShift(), key=(reg||'ALL')+ccRegenTag()+'|'+y;
  if(CC_REGEN_CARDS[key]) return CC_REGEN_CARDS[key];
  const src=new Map();
  PLAYERS.forEach(p=>{ if(ccCardYear(p)!==2026) return; const k=(p.region||'')+'|'+hKey(p), d=ccCardDay(p)||0, cur=src.get(k); if(!cur || d>cur.d) src.set(k, {p:p, d:d}); });
  const out=[];
  R.list.forEach(g=>{
    if(R.out[hKey(g.h)] || (reg && reg!=='ALL' && g.reg!==reg)) return;
    const base=src.get(g.srcReg+'|'+hKey(g.src)); if(!base) return;
    const c={...base.p};
    ['org','team','liquiName','photo','twitch','partner','earnings','x','tw','yt'].forEach(f=>{ delete c[f]; });
    c.handle=g.h; c.region=g.reg; c.nat=g.nat; c._k=hKey(g.h);
    c.regenOf=g.of||null; c._regen=g.y;
    // Роль — исходника: почерк тот же (realRoleKey ищет по нику, а ник новый).
    const rk=realRoleKey(base.p); if(rk) c._roleKey=rk;
    const r=ccRegenOvr(g, y);
    delete c._attrs; delete c._floored; delete c._lifted;
    c._targetOvr=r; c.rating=r; c._ovr=r;
    out.push(c);
  });
  CC_REGEN_CARDS[key]=out;
  return out;
}
/* Лист регена в профиле: шесть чисел и рейтинг — его, а турниры, финалы и разбор рейтинга — нет: это история
   исходника, у семнадцатилетнего её быть не может. */
function ccRegenShown(pl){
  const c={...pl, _attrs:{...attrsFor(pl), _floored:true}};
  ['real','realGf','missedGf','_ratingParts','_m2Playin','_m2Gf','gfEvent','_eventOvr','note','placement','_yr'].forEach(f=>{ delete c[f]; });
  return c;
}
// День рождения регена: ему a лет в год появления, дальше стареет вместе со сценой (ccAgeNow).
function ccRegenBorn(handle){
  if(!ccRegenOn()) return null;
  const R=CAREER.career.regen; if(!R) return null;
  const g=R.list.find(x=>hKey(x.h)===hKey(handle)); if(!g) return null;
  // ccAgeNow = возраст на дату календаря + ccYearShift: в год y (ccYearShift) ему a+(сейчас−y).
  const seasonsAtY=g.y;
  return (ccCalYear()-(g.a-seasonsAtY))+'-01-01';
}
/* Годы идут цепочкой: следующий начинается с того, на чём закончился прошлый.
   Иначе каждый новый год считался бы от рейтинга года старта, и прошлогодний
   рост пропадал на стыке — замер S1neD: 2025-й 76 → 80, как в жизни, а в
   декабре 2026-го снова 76. */
function ccRealYearSpan(y){
  return y===2019 ? [CC_YEAR_2019_FROM, CC_YEAR_2019_TO]
       : y===2020 ? [CC_YEAR_2020_FROM, CC_YEAR_2020_TO]
       : y===2021 ? [CC_YEAR_2021_FROM, CC_YEAR_2021_TO]
       : y===2022 ? [CC_YEAR_2022_FROM, CC_YEAR_2022_TO]
       : y===2023 ? [CC_YEAR_2023_FROM, CC_YEAR_2023_TO]
       : y===2024 ? [CC_YEAR_2024_FROM, CC_YEAR_2024_TO]
       : y===2025 ? [CC_YEAR_2025_FROM, CC_YEAR_2025_TO]
       : [CC_YEAR_FROM, CC_YEAR_TO];
}
function ccRealYearEndFrac(y){
  const s=ccRealYearSpan(y), step=1+Math.floor(ccDaysBetween(s[0], s[1])/7);
  return ccRealPullCurve(step);
}
function ccRealPull(c){
  if(!c || !ccRealPullStep()) return 0;
  const base=(c._ovr!=null ? c._ovr : (attrsFor(c)||{}).ovr);
  if(!(base>0)) return 0;
  const k=c._k||hKey(c);
  let start=base;
  for(let y=ccNowYear()+1; y<ccCalYear(); y++){
    const ty=ccRealTargets(y).get(k);
    if(ty!=null) start+=(ty-start)*ccRealYearEndFrac(y);
  }
  const t=ccRealTargets(ccCalYear()).get(k);
  if(t==null) return start-base;
  return (start-base)+(t-start)*ccRealPullFrac();
}
// Карточка роастера, поднятая на то, что эта карьера с ней сделала.
/* Один раз на карточку (_lifted едет и в копии {...c}): careerPools поднимал копии карточек сцены,
   а ccSceneRoster их уже поднял — рост и подтяжка к году ложились дважды, и один человек был 87
   в сцене и 82 в пуле, пары «по силе» расходились после сборки (полный прогон 9.10,
   check-career-2025-continuity: 147 из 2252 карточек пула не совпадали со сценой). */
/* СЦЕНА ПОСЛЕ 2026 ЖИВЁТ. Каждый сезон заново берёт рейтинги 2026-го, и без этого топ не менялся годами (жалоба игроков
   16.11: «после 4–5 лет наверху те же»). Замер по базе 2021–2026 (EU и NAC): из топ-20 через год остаются 61%, через
   три года 28%; в карьере было 88% и 88%. Порядок людей идёт скрытой величиной: тяга к среднему сцены (RHO), шум
   (sd·√(1−RHO²)), возраст (AGE в год от пика PEAK). Числа рейтингов раздаются по местам из распределения 2026-го,
   поэтому уровень сцены и потолок не уплывают, меняется только кто где. Подбор пробой (scratchpad calib): 57% и 30%.
   Жребий от сида мира, ника и сезона: одинаковый у двоих онлайн, свой у каждой карьеры. */
const CC_DRIFT_RHO=0.96, CC_DRIFT_AGE=0.25, CC_DRIFT_PEAK=21;
let CC_DRIFT={tag:null, maps:{}};
function ccSceneDriftMap(reg){
  const S=ccYearShift(); if(!(S>0) || !reg) return null;
  const tag=ccSlot()+'|'+S+'|'+ccWorldSeed();
  if(CC_DRIFT.tag!==tag) CC_DRIFT={tag:tag, maps:{}};
  if(CC_DRIFT.maps[reg]) return CC_DRIFT.maps[reg];
  const season=ccSeasonOvr(), base=new Map();
  PLAYERS.forEach(p=>{
    if((p.region||'')!==reg || ccCardYear(p)!==ccNowYear()) return;
    const k=hKey(p), day=ccCardDay(p)||0, cur=base.get(k);
    if(cur && day<=cur.day) return;
    const yr=season.get(ccSeasonKey(p));
    base.set(k, {day:day, o:yr!=null ? yr : (attrsFor(p)||{}).ovr, h:p.handle});
  });
  const list=[...base.entries()].map(([k,v])=>({k:k, o:v.o, a:ccAgeOf(v.h, '2026-07-01')})).filter(x=>x.o>0);
  if(list.length<20) return (CC_DRIFT.maps[reg]=new Map());
  const m=list.reduce((s,x)=>s+x.o, 0)/list.length;
  const sd=Math.sqrt(list.reduce((s,x)=>s+(x.o-m)*(x.o-m), 0)/list.length);
  const sig=sd*Math.sqrt(1-CC_DRIFT_RHO*CC_DRIFT_RHO), W=ccWorldSeed();
  list.forEach(x=>{
    let L=x.o; const a0=x.a!=null ? x.a : 18;
    for(let s=1; s<=S; s++){
      const rnd=careerRng(ccHashStr('drift|'+W+'|'+x.k+'|'+s));
      let u=0; for(let i=0;i<6;i++) u+=rnd();
      L=m+CC_DRIFT_RHO*(L-m)+sig*(u-3)/Math.sqrt(0.5)+CC_DRIFT_AGE*(CC_DRIFT_PEAK-(a0+s-1));
    }
    x.L=L;
  });
  const sorted=list.map(x=>x.o).sort((a,b)=>b-a);
  const out=new Map();
  list.slice().sort((a,b)=>b.L-a.L).forEach((x,i)=>{ const d=sorted[i]-x.o; if(d) out.set(x.k, d); });
  return (CC_DRIFT.maps[reg]=out);
}
function ccSceneDrift(c){
  if(!c || c._regen) return 0;
  const mp=ccSceneDriftMap(c.region||''); if(!mp) return 0;
  return mp.get(hKey(c)) || 0;
}
function ccSceneLift(c){
  if(!c || c._lifted) return c;
  const d=careerDevOf(c)+ccRealPull(c)+ccSceneDrift(c);
  if(!d) return c;
  const base=(c._ovr!=null ? c._ovr : (attrsFor(c)||{}).ovr);
  if(!(base>0)) return c;
  const to=clamp(Math.round(base+d), 40, CAREER_SCALE_TOP);
  c._ovr=to; c._targetOvr=to; c._lifted=true;
  // Шесть чисел пересчитываются под новый рейтинг: кэш карточки — это её
  // старый вечер. attrsFor поднимает их на _targetOvr сам.
  delete c._attrs; delete c._floored;
  return c;
}
/* Порядок, в котором лобби закончило вечер. Тот же ключ, по которому каждое
   событие само строит свою таблицу: очки этапа, потом победы, потом элимы. */
function careerRankField(field){
  const pts=t=>(t.stagePts!=null ? t.stagePts : (t.pts!=null ? t.pts : 0));
  return field.slice().sort((a,b)=>pts(b)-pts(a) || (b.wins||0)-(a.wins||0)
                                 || (b.stageElims||0)-(a.stageElims||0));
}
/* Наклон регрессии последнего посчитанного вечера: сколько ранга силы реально
   доехало до ранга финиша в ЭТОЙ комнате. Ставится careerGrowField, читается
   careerApplyGrowth. Ноль значит «не считали» — тогда ожидание остаётся сырым,
   как оно и было до 25 августа. */
let CC_NIGHT_SLOPE=0;
function careerGrowField(field, you){
  if(!CAREER || !field || field.length<2) return 0;
  const ranked=careerRankField(field);
  const n=ranked.length;
  /* Ожидание — доля комнаты слабее тебя, посчитанная один раз по всей комнате.
     Считать её для каждой команды перебором значило бы пройти лобби из двух с
     половиной тысяч дуо квадратом. */
  const strength=t=>t.pow+(t.closeEdge||0);
  const byPow=ranked.slice().sort((a,b)=>strength(a)-strength(b));
  const exp=new Map();
  byPow.forEach((t,i)=>{ exp.set(t, n>1 ? i/(n-1) : 0.5); });
  const book=CAREER.dev=CAREER.dev||{};
  // В гонке шаг мира один на комнату (ccWorldDiff): личная сложность двигала бы общий мир по-разному.
  const grown=careerGrowthMax(), hard=ccWorldDiff().age;
  /* Сначала комната собирается целиком, и только потом двигается.

     Возраст у карьеры — это движение к своему потолку: шестнадцатилетний
     растёт, двадцатидвухлетний сходит. Если ту же кривую выдать всей комнате
     как есть, комната поедет вверх целиком — роастер молодой, и каждый вечер
     стоил бы всем по десятой доле рейтинга просто за то, что он состоялся. За
     пять сезонов вся сцена упёрлась бы в 99, и обгонять стало бы некого.

     Поэтому возрастная половина здесь относительная: у каждого своя, но из неё
     вычитается средняя по комнате. Молодые по-прежнему поднимаются, ветераны
     по-прежнему сходят, а средний уровень сцены держится сам — двигают его
     только результаты, а их сумма по комнате около нуля, потому что ожидание
     читается с этой же комнаты. */
  /* Ожидание считается регрессией, а не местом в строю.
     Иначе у сильнейшего ожидание = 1-е место, и он платил за саму дисперсию. Плюс тейпер резал возрастной плюс до вычитания среднего по комнате.
     Было (career-scene-drift-probe.js, 40 вечеров Д1): топ-10 −3.2 (Scroll 96→92.4), низ +1.5.
     Наклон регрессии берётся с этой же комнаты в этот вечер, ноль по силе держится сам без подобранной константы. Тейпер перенесён на итоговый шаг: потолок держит, среднее не крадёт. */
  let sae=0, see=0;
  ranked.forEach((t,i)=>{
    const a=(n>1 ? 1-i/(n-1) : 0.5)-0.5;
    const e=(exp.get(t)||0.5)-0.5;
    sae+=a*e; see+=e*e;
  });
  const slope=see>0 ? clamp(sae/see, 0, 1) : 0;
  /* Тот же наклон нужен и своему вечеру — см. careerApplyGrowth. Комната одна
     и вечер один, поэтому он считается здесь, а не второй раз там. */
  CC_NIGHT_SLOPE=slope;
  const rows=[];
  let peerKey=null;
  try{ if(typeof ccMpTeam==='function' && ccMpTeam() && typeof MP!=='undefined' && MP.peer) peerKey=hKey(MP.peer); }catch(e){ peerKey=null; }
  ranked.forEach((t,i)=>{
    if(t===you) return;                       // свой вечер считает careerApplyGrowth
    /* И команду СОПЕРНИКА по гонке тоже: у него самого она «своя» и в книгу не идёт, а у меня
       шла бы как обычная — и его напарник (настоящий игрок сцены: Sky, Scroll, vic0) рос у меня
       и не рос у него. Книга расходилась на этом одном человеке, и следующее поле — на его
       силе (двухсезонная проба 10.09, третий запуск: 15.03 «kiro:85 vs kiro:84 · state dev»). */
    if(t.isRival) return;
    /* И НАПАРНИКА ПО КОМАНДЕ, который в этом вечере стоит своей командой (соло вдвоём: каждый своим
       игроком в одной сотне, t.isMate). У него он — «ты» и в книгу не идёт, у меня шёл бы обычным:
       за настоящих игроков (Pixie и SwizzY, командный год 20.10) книга расходилась на нём после
       хитов Solo Series 17.01, и Duos Victory Cup 19.01 — на силе бота. */
    if(t.isMate) return;
    if(peerKey && (t.squad||[]).some(c=>c && hKey(c)===peerKey)) return;
    const actual=n>1 ? 1-i/(n-1) : 0.5;
    const e=exp.get(t)||0.5;
    const gap=(actual-(0.5+slope*(e-0.5)))*grown*hard;
    (t.squad||[]).forEach(c=>{
      /* Выдуманный в книгу роста не идёт — отзыв: «выдуманных
         рост не надо». Сезонный ростер у него теперь есть (ccLadderSeason,
         соперники в низких дивизионах постоянные), но рейтинг ему не пишется:
         в Дивизионе 4 комната это 1258 выдуманных на одного реального, и книга
         росла бы на всю комнату разом — 702 КБ сейва за год на первом замере. */
      // Выдуманный идёт в СВОЮ книгу (см. careerDevOf), а не мимо всего.
      if(!c || !c.handle) return;
      const lad=(c.tier==='ladder');
      const k=hKey(c);
      if(!k) return;
      const now=(c._ovr!=null ? c._ovr : (attrsFor(c)||{}).ovr);
      if(!(now>0)) return;
      /* Возраст неизвестен — человек считается стоящим НА точке отсчёта, а не
         молодым. Раньше подставлялась медиана сцены, и 778 человек из 911
         получали её прибавку просто за то, что год рождения не записан:
         +0.52 за год каждому, то есть тихая инфляция всей сцены. Не знаем
         возраст — не двигаем возрастом; результаты их двигают как и всех. */
      const base=careerDevelopBase(ccAgeNow(c.handle) || CC_SCENE_AGE_REF)*ccWorldDiff().age;
      rows.push({k:k, base:base, now:now, gap:gap, lad:lad});
    });
  });
  if(!rows.length) return 0;
  /* Точка отсчёта роста по возрасту: CC_SCENE_AGE_REF, возраст, после которого про перестаёт прибавлять. Моложе
     растут, старше сходят.
     Средняя по комнате как отсчёт не годится: у 778 из 911 возраст не записан (берётся медиана, ccSceneAge), и молодые
     не росли, а только медленнее падали.
     Сумма по комнате теперь не ноль, сцена чуть растёт, это осознанно. Разбегания нет из-за CAREER_TAPER у потолка.
     Проверка tools/career-year-drift-probe.js. */
  const mid=careerDevelopNow(CC_SCENE_AGE_REF);
  const bookL=CAREER.devL=CAREER.devL||{};
  let moved=0;
  rows.forEach(r=>{
    const into=r.lad ? bookL : book;
    const was=into[r.k]||0;
    /* Тейпер держит потолок, но обязан быть симметричным и только на результатах.
       С `if(delta>0) delta*=…` плюс срезался, а минус шёл целиком: у игрока на 96 удачный вечер стоил 30%, неудачный 100%, и разница копилась.
       Замер tools/career-year-drift-probe.js, год, 109 турниров: топ-20 −1.66, середина −1.02, низ +0.02 (Th0masHD −6.42).
       Возрастная часть через тейпер не идёт, иначе ветеран у потолка перестал бы сходить. */
    const near=clamp((CAREER_SCALE_TOP-r.now)/CAREER_TAPER, 0, 1);
    /* Возрастная половина ВВЕРХ глохнет у потолка, вниз идёт целиком.

       Замер на четыре сезона (tools/scene-ceiling-probe.js) показал, куда
       это едет: старт — средний топ-20 93.4 и максимум 96, к третьему
       сезону четверо из двадцати стоят на 99, к четвёртому пятеро.
       Верхушка слипается в стену из потолка.

       Односторонний тейпер здесь — не тот баг, что я чинил утром: тот был
       на РЕЗУЛЬТАТЕ, где шум симметричен и одностороннее глушение делало
       из него налог. Возраст не шум: расти к 99 действительно всё труднее,
       а сходить с 99 — нет. Поэтому вверх через запас, вниз без него.
       Ветеран по-прежнему сходит на всю глубину кривой. */
    const age=(r.base-mid)*CC_SCENE_AGE_W;
    const delta=(age>0 ? age*near : age)+r.gap*near;
    const to=clamp(was+delta, -CC_SCENE_DEV_MAX, CC_SCENE_DEV_MAX);
    // Сотые доли рейтинга: сейв держит девятьсот человек, и полная точность
    // числа с плавающей точкой стоит в нём больше, чем значит.
    into[r.k]=Math.round(to*100)/100;
    moved++;
  });
  // Комната выдуманных — тысяча с лишним человек за вечер; книга режется сразу.
  ccDevLTrim();
  // Снимок роастера построен на старых числах, и теперь он старый.
  // Пул — тоже: он кэшируется по календарному снимку и про книгу роста сам не
  // узнает, а показывает именно его комната дивизиона 1 и экран выбора.
  if(moved){ CC_NOW_CARDS={}; CC_POOLS=null; }
  /* Реальные дуо мира расходятся после серии провалов — его пункт 14 со
     страницы «ы», 22 августа: «чтоб менялись дуосы из-за плохих результатов,
     если их прям много подряд у настоящих игроков». Нижняя треть комнаты
     подряд четыре вечера — пара распадается: её половинки уходят в свободные
     агенты пула (careerPools отфильтрует), и очередь пересобирает мир.
     Хороший вечер серию сбрасывает. */
  const ds=CAREER.duoStreak=CAREER.duoStreak||{};
  let told=0;
  ranked.forEach((t,i)=>{
    if(t===you) return;
    const sq=(t.squad||[]).filter(c=>c && c.handle && c.tier!=='ladder');
    if(sq.length!==2) return;
    const key=sq.map(c=>hKey(c)).sort().join('+');
    const frac=n>1 ? i/(n-1) : 0.5;
    if(frac>0.67) ds[key]=(ds[key]||0)+1;
    else if(frac<0.5) ds[key]=0;
    /* Расставание объявляет сам игрок (LFD/LFT), не сцена. Старый ключ
       ccNewsDuoWorldSplit оставлен ради лент в сейвах.
       В трио-сезоне ветка срабатывает на паре с выдуманным третьим, и там пара не
       распадается: пишем ccPostTrioLF, память в cr.lft, пулы не трогаем.
       В дуо пара распадается, половинки идут в пул, CC_POOLS сбрасывается. */
    const trioLF=careerSquadSize()===3;
    const memo=trioLF ? (CAREER.lft=CAREER.lft||{}) : (CAREER.splits=CAREER.splits||{});
    if((ds[key]||0)>=4 && !memo[key]){
      memo[key]=careerToday();
      if(!trioLF){ CC_POOLS=null; CC_NOW_CARDS={}; }
      /* Расходятся сколько расходятся, а ЛЕНТА показывает пару штук.

         Его снимок ленты, 27 августа: шесть одинаковых «я больше не в дуо
         с @…» подряд одним днём. Так и выходило: четыре провальных вечера
         набегают у нескольких пар разом, и каждая писала свой пост. Сам
         развод при этом честный и остаётся — молчит только лента, потому
         что шесть одинаковых строк подряд читаются как сбой, а не как
         шесть новостей. */
      /* Обе половинки становятся свободными агентами С АНКЕТОЙ: кого ищут и с
         каким PR. В трио-сезоне пара не распадается, и объявление ей ни к
         чему — там уже написан свой пост «ищем трио». См. ccAdMake. */
      if(!trioLF) sq.forEach(c=>ccAdMake(c));
      if(told<CC_SPLIT_POSTS_DAY){
        told++;
        careerNews('flat', trioLF ? 'ccPostTrioLF' : 'ccPostDuoSplitBy',
                   [ccHandle(sq[0].handle), ccHandle(sq[1].handle),
                    trioLF ? 'LFT' : 'LFD']);
        /* И сразу — само объявление, с карточкой под ним: так это и выглядит
           в жизни, где к «lfd» приложен скрин своего PR-профиля. Пишет его
           первый из двоих; второй ищет молча, иначе один развод даёт четыре
           поста подряд — та же причина, по которой стоит CC_SPLIT_POSTS_DAY. */
        /* Анкета — не тем же вечером. Скриншот: «not duo with @…
           anymore. LFD» и сразу под ним «LFD. Div 1 and up… DMs open» от того
           же человека — два почти одинаковых поста. Теперь развод объявляется
           сегодня, а анкета с карточкой выходит через два дня, если человек
           всё ещё свободен. См. careerAdPostTick. */
        const ad=!trioLF && ccAdOf(sq[0].handle);
        if(ad) ad.post=1;
      }
    }
  });
  return moved;
}
// Everybody you play with, in seat order.
function careerMates(){
  /* В командной карьере первое кресло — живой человек из лобби.

     Его карточка приезжает перед каждым вечером (см. MP.card) и содержит ровно
     то, что двигает силу. Брать вместо неё запись из сейва нельзя: там лежит
     бот, оставшийся с одиночных времён, и команда собралась бы не та, которую
     видит напарник, — а это расхождение на первой же игре.

     Дальше — взятые, и только в трио-сезоне (ccMpBotSeats). Они общие: запись
     о них едет в командном состоянии, поэтому у обоих один и тот же третий. */
  if(ccMpOn() && typeof MP!=='undefined'){
    const rest=ccMpMateRecs().map(ccMateCardOf).filter(Boolean);
    const all=MP.peer ? [MP.peer].concat(rest) : rest;
    return all.slice(0, careerMateSeats());
  }
  /* Пара в гонке: напарник — друг, его карточка из строки гонки (упакована с шестью числами,
     ccRacePackCard). Свой бот при этом уже отпущен (careerRacePairFree) и ищет команду сам. */
  if(typeof ccRacePairOn==='function' && ccRacePairOn()){
    const p=ccRacePairPeer();
    return p && p.card ? [p.card].slice(0, careerMateSeats()) : [];
  }
  const list=careerMateRecords().map(ccMateCardOf).filter(Boolean);
  /* Нанятые на сегодняшний турнир (ccHireActive) — сначала в пустые кресла, и только когда пустых нет, вместо твоих
     тиммейтов с последнего (29.10, его вопрос «нанять можно только если нет тиммейта?» — нет, но свой тиммейт теперь
     остаётся, пока есть свободное место). */
  if(typeof ccHireActive==='function' && ccHireActive()){
    const seats=careerMateSeats(), hc=ccHireCards().slice(0, seats), own=list.slice(0, seats);
    return own.slice(0, Math.max(0, seats-hc.length)).concat(hc);
  }
  return list;
}
/* Карточка первого кресла — той же дверью, что и все остальные.
 *
 * Здесь стояла вторая копия ccMateCardOf: тот же поиск, тот же ccMateLift, то
 * же careerMateDev() (которое и есть dev первой записи) — и без одной строки,
 * той, что раскладывает pr.role. А первое кресло читает весь мод.
 *
 * Из-за этого пересадка напарника не доходила до экрана вообще, включая
 * молчаливую пересадку выдуманного соседа, которая живёт в моде давно: запись
 * менялась, careerMates показывал новую роль, careerPartnerCard — старую, и
 * согласившийся напарник оставался фраггером. Копия и расхождение — это одно и
 * то же, поэтому копии больше нет. */
function careerPartnerCard(){
  // Та же врезка, что и в careerMates: первое кресло тоже занимает живой.
  if(ccMpOn() && typeof MP!=='undefined' && MP.peer) return MP.peer;
  // С нанятым первое кресло — то, что вышло в careerMates (свой тиммейт остаётся, если нанятый сел в пустое).
  if(typeof ccHireActive==='function' && ccHireActive()){ const m=careerMates()[0]; if(m) return m; }
  return ccMateCardOf(careerMateRec());
}

/* Growth. Without improvement the ladder is a wall: a player at their own band promotes ~4/10,
   one band below promotes 0/40.
   Performance (share of the field you outpower, via pow) is unbiased, so it's noise, not trend.
   Development is the trend: big for teens, flat mid-20s, negative past 30, shrinking near the top.
   Potential is a ceiling drawn once from the roster's own ratings (most ~80, a few 95);
   without it everyone hit 90 OVR in six seasons.
   Development numbers are tuned, not measured: a teen who plays every cup can reach the D1 band in a
   season (about a third do). tools/career-arc-calibration.js checks this. */
/* Divided by five, because the year has five times the cups in it.

   These numbers were tuned when a season was eleven made-up weeks holding eight
   cups. The measured year holds twenty-one cup weeks, and below Division 1 each
   week is two separate goes — forty-two attempts where the tuning assumed eight.
   Unchanged, they took a fifteen-year-old to the Division 1 band inside their
   first season, every career out of twelve, which is not a climb.

   A year of a player's life should still improve them by about as much as it
   did; there are simply more tournaments in it now. So the per-cup figures come
   down by the same factor the cup count went up, and the target above is
   unchanged — three or four seasons to the Division 1 band. */
const CAREER_GROWTH_MAX=0.55;
/* How much a career learns from a result: four difficulty ceilings, the old one is the easiest.
   Age curve, taper and partner pull are unchanged; money, prizes and room strength are the same on all of them.
   Stored on the career at creation and never derived, like cr.size, so editing this table cannot reshape
   existing careers. The partner uses the same ceiling, see careerMateGrow. */
/* Difficulty scales the age curve, not CAREER_GROWTH_MAX.
   Of the ~36 points a career climbs, ~33 come from age and playing and ~3 from placement, so capping results only moved 54→90 from 204 to 218 tournaments.
     easy    x1.00   54 to 90 in ~1.4 seasons
     pro     x0.50   2.6 seasons
     elite   x0.25   5 seasons
     legend  x0.10   ~12 seasons (16-28 at the tails), marathon setting
   Old saves migrated legend→elite stay on elite. Result ceiling 0.55, field, prizes and shop prices are the same on all, harder just means longer. */
const CC_DIFFS=[{id:'easy', age:1.00}, {id:'pro', age:0.50},
                {id:'elite', age:0.25}, {id:'legend', age:0.10}];
function ccDiffOf(id){ return CC_DIFFS.find(d=>d.id===id) || CC_DIFFS[0]; }
function careerDiff(){
  return ccDiffOf(CAREER && CAREER.career && CAREER.career.diff);
}
// Сложность, которой растёт МИР (книга развития сцены): в гонке — одна на комнату, иначе своя.
function ccWorldDiff(){ return (typeof ccRaceOn==='function' && ccRaceOn()) ? CC_DIFFS[0] : careerDiff(); }
function careerGrowthMax(){ return CAREER_GROWTH_MAX; }
// What a year of a career's life is worth to it, on the difficulty it is on.
// The curve is the curve; this is how much of it a career is given.
function careerDevelopNow(age){ return careerDevelopBase(age)*careerDiff().age; }
/* Своя карьера после тридцати идёт вниз. 5.10, его ответ игроку «after 30,
   your rating starts to drop» и потом «может после 30 уже снижение идёт»: до
   этого база росла до 36 и падала только с 37. Ступени 31–33 / 34–36, с 37 —
   прежние −0.06. Только своя карьера: сцена растёт по careerDevelopBase и
   откалибрована под неё (CC_SCENE_AGE_W), её не трогаем. Результаты вечера
   идут сверху, так что тридцатилетний на хорошей форме ещё может расти. */
const CC_MY_FADE=[[30, null], [33, -0.02], [36, -0.04]];
function careerMyDevelopNow(age){
  const a=Number(age);
  if(isFinite(a) && a>CC_MY_FADE[0][0] && a<=CC_MY_FADE[2][0])
    return (a<=CC_MY_FADE[1][0] ? CC_MY_FADE[1][1] : CC_MY_FADE[2][1])*careerDiff().age;
  return careerDevelopNow(age);
}
// A career from before the setting existed played the easy one, because that
// was the only one there was.
function careerMigrateDiff(){
  const cr=CAREER && CAREER.career;
  if(!cr) return;
  if(cr.diff!=null) return;
  cr.diff='easy';
  careerSave();
}
/* Age decides where a card starts, not whether it can grow.

   It used to decide both, and the second half was mine rather than measured.
   From twenty-eight the curve went negative and walked the rating down every
   week, so a player who made themselves at thirty could not climb at all — they
   started at the floor and sank. That is a whole way of playing the mode ruled
   out by a number nobody measured.

   What is measured stays: the roster says FNCS is won by teenagers, and that is
   in the ceiling draw and the age edge printed on the card. A thirty-year-old
   starts worse and reaches less. But after the card is made, a career develops
   on its results like any other, and decline comes late and shallow — a career
   should fade, not be born fading. */
function careerDevelopBase(age){
  if(!isFinite(age)) return 0.10;
  if(age<=17) return 0.16;
  if(age<=19) return 0.13;
  if(age<=21) return 0.10;
  if(age<=24) return 0.07;
  if(age<=27) return 0.05;
  if(age<=30) return 0.04;
  if(age<=33) return 0.025;
  if(age<=36) return 0.012;
  return -0.06;
}
/* There is no ceiling any more — the user's call: a career keeps developing.

   It used to be drawn once from the roster (471 cards, 75 to 96, median 81) and
   kept in the save, so a career's whole arc was decided at creation: a 76 was
   never leaving Division 2 however it played, and the arc harness kept showing
   careers standing still for three seasons at a number they had reached in the
   first. That is what this removes.

   The scale itself is the only limit left: 99, which every card in the game is
   measured on, and which the six attributes clamp to anyway. The taper below
   still reads off this, so the last ten points to 99 come slowly — a career
   climbing at half a point a day walks the eighties in weeks and grinds the
   high nineties for a season. Nothing is stored: an old save's drawn ceiling is
   ignored rather than migrated, so every career that exists is uncapped now. */
const CAREER_SCALE_TOP=99;
function careerPotential(){ return CAREER_SCALE_TOP; }
/* How far training alone can take you: only the scale's own ceiling, with the
   taper near 99. Division ceilings (band +4: 58/65/72/79/86) are gone, telling
   an 84 in Division 1 that training stops at 86 made no sense.
   Calibration: a duo at its band promotes ~never, at +3.5 19-42% of the time.
   After the change a train-only rookie reaches the low 90s within a season, so
   the day store paces a career, not the ladder. */
const CC_TRAIN_OVER=4;
function careerTrainCap(){ return CAREER_SCALE_TOP; }
/* Fatigue is gone: it was a second bar that cut a day's value by a percentage
   nobody could see, and it is folded into energy — one store, spent by days
   and refilled by nights and rest. See careerEnergy. */
/* ---- Form ----
   Short memory of results in rating points, saved and applied to the next tournament, so a season has shape. A
   design choice, not measured (no week-to-week data to fit).
   Small and short: ±3 max (under half a division band), gone after a fortnight without playing. Per result: top
   10% +1, top third +0.5, bottom half −0.5, bottom 10% −1. */
const CC_FORM_MAX=3, CC_FORM_DECAY=0.15;
/* Burnout, in the one number every result already reads.

   A run of days with no day off in them. Nine is free - that is a fortnight of
   work with a weekend in it - and every day past nine costs a fifth of a point
   of form, down to two points, which is a fifth of the whole scale and the
   difference between a cut and a miss over a season.

   Deliberately not energy: the bar already fills every night, and a career that
   grinds a month straight was punished by exactly nothing. Deliberately not a
   separate meter either - form is what the results read, the hub prints it, and
   a career reading "cold -1.8" after three weeks without a break has been told
   what happened in the words the mode already uses. */
const CC_GRIND_FREE=9, CC_GRIND_STEP=0.2, CC_GRIND_MAX=2;
function ccTipToggle(el, ev){
  if(ev) ev.stopPropagation();
  const was=el.classList.contains('open');
  document.querySelectorAll('.ch-tipw.open').forEach(x=>x.classList.remove('open'));
  if(!was){ el.classList.add('open'); setTimeout(()=>document.addEventListener('click', function off(){ el.classList.remove('open'); document.removeEventListener('click', off); }), 0); }
}
function careerBurnout(){
  const over=(CAREER.career.grind||0)-CC_GRIND_FREE;
  return over>0 ? Math.min(CC_GRIND_MAX, Math.round(over*CC_GRIND_STEP*10)/10) : 0;
}
function careerForm(){
  // Confidence holds the floor and never the ceiling. See the cars in CC_SHOP.
  const conf=(CAREER.gear && CAREER.gear.conf) || 0;
  return clamp((CAREER.career.form||0)-careerBurnout()-ccMetaPen()-ccTechPen(),
               Math.min(0, -CC_FORM_MAX+conf), CC_FORM_MAX);
}
function careerFormAdd(place, of){
  if(!(of>1)) return 0;
  const beat=1-(place-1)/(of-1);
  let step = beat>=0.9 ? 1 : beat>=0.67 ? 0.5 : beat<=0.1 ? -1 : beat<0.5 ? -0.5 : 0;
  if(step<0) step=Math.round(step*(1-ccPsychSoft())*100)/100;   // психолог смягчает провал (ccPsychSoft)
  const cr=CAREER.career;
  cr.form=clamp((cr.form||0)+step, -CC_FORM_MAX, CC_FORM_MAX);
  return step;
}
// Form fades with the days rather than with the tournaments: a career that
// stops playing comes back level, which is what a fortnight off is.
function careerFormFade(nights){
  const cr=CAREER.career;
  /* Days nobody spent are days off. The first night is the one that follows the
     day just worked, so it is not counted - otherwise every training day would
     undo its own grind on the way to tomorrow. Everything past it is a career
     that simply was not at the desk, which is what a break is. */
  if(nights>1) cr.grind=Math.max(0, (cr.grind||0)-(nights-1));
  if(!nights || !cr.form) return;
  const f=cr.form;
  cr.form = f>0 ? Math.max(0, f-nights*CC_FORM_DECAY) : Math.min(0, f+nights*CC_FORM_DECAY);
}
/* Duo chemistry, same as computeSynergy in the draft.
   Same SYN_TEAMMATES points but earned: zero when the pair forms, full after one Fortnite season together, linear between (nothing measured to curve it with).
   Resets when the seat changes, so swapping for a slightly better card costs a season. A taken card starts with its real duo at full chemistry. */
const CC_CHEM_DAYS=91, CC_CHEM_MAX=SYN_TEAMMATES;
function careerChemDays(){
  /* В команде стаж — с того дня, как команду завели (chemSince, командный
     ключ), а не из личного списка напарников: тот у каждого свой — у
     вошедшего вторым там лежит бот одиночных времён, — и стаж выходил разный.
     См. ccTeamFormPow, та же история. */
  if(ccMpOn()){
    const cr=CAREER.career;
    /* Обе стороны считают от РАННЕЙ из двух дат. Свой chemSince у вошедшего
       вторым появляется только с первым 'state' — до этого он считал химию
       нулём, а напарник уже нет: «you me 68+0+0 | mate 68+0+0.2» (его
       страница «баги», 30 августа) — сила своей команды расходится на
       единицу («…:106 vs …:107»). Дата напарника едет в его карточке. */
    const theirs=(typeof MP!=='undefined' && MP.peer && MP.peer.chemSince) || null;
    const mine=cr.chemSince || null;
    const since=(mine && theirs) ? (mine<theirs ? mine : theirs) : (mine || theirs);
    return since ? Math.max(0, ccDaysBetween(since, careerToday())) : 0;
  }
  /* The shortest of them, not the average.

     A trio is played in as far as its newest member is. An average would let a
     partnership of three months cover for somebody who arrived last week, and
     the lobby does not see it that way — the squad is only as settled as the
     person still learning where everybody drops. */
  const recs=careerMateRecords().filter(p=>p && p.since);
  if(!recs.length) return 0;
  // Совместные вечера и скримы ускоряют сыгранность: chemX — «дни», набранные вместе (ccChemBump).
  return Math.min.apply(null,
    recs.map(p=>Math.max(0, ccDaysBetween(p.since, careerToday()))+(p.chemX||0)));
}
/* Сыгранность растёт не только от календаря: вечер, сыгранный вместе, — как три дня,
   скрим — как два. Пишется в запись напарника, поэтому у дуо и трио она своя. */
function ccChemBump(n){
  if(typeof ccMpOn==='function' && ccMpOn()) return;
  careerMateRecords().forEach(p=>{ if(p && !p.standin) p.chemX=Math.min(CC_CHEM_DAYS, (p.chemX||0)+n); });
}
// Сыгранность с каждым тиммейтом — плиткой во вкладке «Карьера».
/* Ты и тиммейт бок о бок: шесть атрибутов зеркальными полосами и рейтинг. Кто сильнее
   в строке — подсвечен. По тиммейту на блок (в трио — двое). */
function ccMateCompareHTML(){
  /* Онлайн рядом — живой напарник (careerMates: MP.peer и общие взятые), а не бот, оставшийся в сейве с одиночных
     времён (Notion 21.10, двое играли командой: «в пункте карьера указан не твой тиммейт», стоял Misery 57). */
  const recs=(ccMpOn() ? (careerMates()||[]) : careerMateRecords()).filter(Boolean); if(!recs.length) return '';
  /* Числа — те же, что на карточках (Notion «27» скрин 23: «некрасиво и цифры не точные» —
     здесь стояли сырые статы с десятыми, 98.8 при 99 на карточке). Своя сторона — с карточки
     игрока (attrsFor(careerCard())), чужая — с карточки напарника; целыми, как на карточках. */
  const myCard=careerCard(), mineA=myCard ? attrsFor(myCard) : null;
  const mine=mineA || CAREER.player.attrs || ccOwnAttrs(), myOvr=ccMyShownOvr();
  const num=v=>String(Math.round(v));
  const blocks=recs.map(p=>{
    const c=ccMpOn() ? p : ccMateCardOf(p); if(!c || !c.handle) return '';
    const a=attrsFor(c), mo=Math.round(a.ovr||c.rating||0);
    const rows=ATTR_KEYS.map(k=>{
      const x=Math.round(mine[k]!=null ? mine[k] : 50), y=Math.round(a[k]!=null ? a[k] : 50);
      const px=Math.max(0, Math.min(100, (x-35)/64*100)), py=Math.max(0, Math.min(100, (y-35)/64*100));
      return '<div class="mc-row"><b class="'+(x>y?'win':'')+'">'+num(x)+'</b>'+
        '<u class="l"><s style="width:'+px.toFixed(0)+'%"></s></u><span>'+(CC_ATTR_ICON[k]||'')+' '+(L()['ccAttr'+k.toUpperCase()]||k)+'</span>'+
        '<u class="r"><s style="width:'+py.toFixed(0)+'%"></s></u><b class="'+(y>x?'win':'')+'">'+num(y)+'</b></div>';
    }).join('');
    return '<div class="mc-block"><div class="mc-head"><span>'+esc(CAREER.player.nick||'')+' <em>'+myOvr+'</em></span><i>vs</i>'+
      '<span>'+esc(c.handle)+' <em>'+mo+'</em></span></div>'+rows+'</div>';
  }).join('');
  return '<div class="ch-tile"><h4>'+esc(L().lfCompare)+'</h4>'+blocks+'</div>';
}
function ccChemTileHTML(){
  // Онлайн — напарник по команде, стаж от создания команды (careerChemDays), как и сила считает.
  const mp=ccMpOn();
  const recs=(mp ? (careerMates()||[]) : careerMateRecords()).filter(Boolean);
  if(!recs.length) return '';
  const rows=recs.map(p=>{
    const c=mp ? p : ccMateCardOf(p); if(!c || !c.handle) return '';
    const d=mp ? careerChemDays() : (p.since ? Math.max(0, ccDaysBetween(p.since, careerToday())) : 0)+(p.chemX||0);
    const pct=Math.min(100, Math.round(d/CC_CHEM_DAYS*100));
    return '<div class="chem-row"><span>'+esc(c.handle)+'</span><u><s style="width:'+pct+'%"></s></u><b>'+pct+'%</b></div>';
  }).join('');
  return '<div class="ch-tile"><h4>'+L().lfChem+'</h4><div class="ch-hint">'+L().lfChemHint(CC_CHEM_DAYS)+'</div>'+rows+
    '<div class="ch-row"><em>'+L().lfChemBonus+'</em><b>+'+careerChem()+'</b></div></div>';
}
function careerChem(){
  if(!careerPartnerCard()) return 0;
  /* And what a coach adds to it.

     His ask of 18 August: a coach could bring synergy with the teammate. Time
     together is what makes a duo — CC_CHEM_DAYS of it — and a coach who works
     with pairs rather than with a player shortens that, which is the honest
     version of what one actually does. It is a bonus on top rather than a
     replacement, so a coach cannot buy a partnership you have not played. */
  const c=ccCoach();
  const base=Math.min(1, careerChemDays()/CC_CHEM_DAYS)*CC_CHEM_MAX;
  return Math.round((base + (c && c.chem ? c.chem : 0))*10)/10;
}
// The player's own team, with the week they are having on it and the time they
// have had together. Every event builds it through here, so both apply once and
// everywhere.
/* Форма своей команды в командной карьере = среднее двух личных.
   careerForm() и careerChem() личные, и каждый браузер считал команду со своей
   формой: 113 против 106 силы, таблицы расходились до любого выбора
   (tools/check-mp-you-pow.js). Форма напарника приходит в MP.card уже посчитанной
   (formPow, после перегруза и пола от машины), оба берут среднее. Одиночная
   карьера как была. */
let CC_MP_MYCARD=null;
// Своя карточка этого вечера — та, что уехала напарнику на гейте. Только внутри командного вечера.
/* СВОЙ ИГРОК В СОЛО ВДВОЁМ — ПО ТОЙ ЖЕ КАРТОЧКЕ, ЧТО ВИДИТ НАПАРНИК (командный год за Pixie и SwizzY 20.10: хиты Solo Series
   17.01, «swizzy:102 vs 101»). Напарник считает меня по присланной на воротах карточке (MP.card, с formPow), а я себя — по
   живой и по форме сейчас; сдвинулось что-то между отправкой и вечером — сила на единицу разная. Вне команды — как было. */
function ccSoloSelf(me){
  try{ const c=(typeof CC_MP_MYCARD!=='undefined') ? CC_MP_MYCARD : null;
    if(c && typeof ccMpTeam==='function' && ccMpTeam() && hKey(c)===hKey(me)) return {card:c, form:Number(c.formPow)||0}; }catch(e){}
  return {card:me, form:careerForm()};
}
function ccMpMyCardNow(){
  return (ccMpOn() && CC_MP_MYCARD && typeof CC_MP_RAND!=='undefined' && CC_MP_RAND) ? CC_MP_MYCARD : null;
}
function ccTeamFormPow(){
  const snap=ccMpMyCardNow();
  const mine=(snap && isFinite(Number(snap.formPow))) ? Number(snap.formPow) : careerForm();
  if(!ccMpOn() || typeof MP==='undefined' || !MP.peer) return mine;
  const theirs=Number(MP.peer.formPow);
  return (mine+(isFinite(theirs) ? theirs : 0))/2;
}
function careerYouTeam(cards){
  // Своя карточка в командном вечере — из снимка гейта, как у напарника (см. ccMpMyCardNow).
  /* И напарник — СВЕЖИЙ, из MP.peer. Раннеры берут careerMates() ДО гейта (runCareerCup и др.),
     а карточка напарника на этот вечер приходит на гейте — в составе у одного оставалась вчерашняя
     (LiveB 87 против его собственных 89, 30.09). Здесь состав собирается уже после гейта. */
  const snap=ccMpMyCardNow();
  if(snap && Array.isArray(cards)){
    const me=hKey(snap), peer=(typeof MP!=='undefined' && MP.peer) || null, pk=peer ? hKey(peer) : null;
    cards=cards.map(c=>!c ? c : hKey(c)===me ? JSON.parse(JSON.stringify(snap))
                              : (pk && hKey(c)===pk) ? peer : c);
  }
  /* В команде состав — В ОДНОМ ПОРЯДКЕ у обоих.

     Каждый клиент собирает свой состав как [я, напарник]: у A это «A & B»,
     у B — «B & A». Всё, что читает состав по порядку — первая карточка,
     склейка атрибутов, любой цикл по squad, — у двоих выходит разным, и
     вечер расходится с первой игры при одинаковых входах. Живой сторож 28
     августа (check-mp-live-two): та же сила, тот же сид, те же броски на
     старте — и разные первые игры. MP.teamOf сортирует по нику — тем же
     ключом здесь. Одиночная карьера порядок не меняет. */
  let ordered=(ccMpOn() && typeof MP!=='undefined' && MP.teamOf && cards && cards.length===2)
    ? MP.teamOf(cards[0], cards[1]) : cards;
  /* Тройка и сквад — то же правило (онлайн-прогон 2019 года, 21.10: в трио Season X у A «Pixie+SwizzY+Aqua», у B
     «SwizzY+Pixie+Aqua» — 29 таблиц с разным составом при одинаковых очках): двое живых — по нику, как MP.teamOf,
     остальные следом в своём порядке. */
  if(ccMpOn() && typeof MP!=='undefined' && MP.teamOf && MP.peer && cards && cards.length>2){
    const pk=hKey(MP.peer), mk=snap ? hKey(snap) : (cards[0] ? hKey(cards[0]) : null), mi=cards.findIndex(c=>c && hKey(c)===mk), pi=cards.findIndex(c=>c && hKey(c)===pk);
    if(mi>=0 && pi>=0){ const two=MP.teamOf(cards[mi], cards[pi]); ordered=two.concat(cards.filter((c, i)=>i!==mi && i!==pi)); }
  }
  const t=careerTeam(ordered, true);
  /* В команде форма — ОБЩАЯ, среднее из двух. См. ccTeamFormPow. */
  /* И эфир, если вечер идёт в эфир: −CC_STREAM_POW к силе своей команды.
     Это цена, которой платят за стрим с турнира — см. CC_STREAM_CUP. В
     командной карьере всегда ноль: эфира там нет, и сила у двоих сходится. */
  const basePow=t.pow, formPow=ccTeamFormPow(), chemPow=careerChem(), livePow=ccStreamPow(), anPow=ccAnalystPow();
  t.pow=Math.round(basePow+formPow+chemPow+livePow+anPow);   // anPow — разбор аналитика (ccAnalystPow), в команде 0
  // Общая комната гонки: у своей команды адрес вопросов — своя карточка (ccMpMine по ':<ник>').
  if(typeof ccRaceLock==='function' && ccRaceLock()) t.mpTag=':'+hKey(ordered[0]);
  // Окошко трансляции читает свою команду отсюда — один вход на все раннеры.
  CC_TV_YOU=t;
  /* Слагаемые — в сверку игры (payload yp): скриншоты —
     «diff 1 of 170: #1 flickzy+malibuca:106 vs :107» — сила своей команды
     разошлась на единицу, а из чего она сложилась, не видно никому. */
  if(typeof CC_MP_YOU_PARTS!=='undefined')
    CC_MP_YOU_PARTS=Math.round(basePow*10)/10+'+'+Math.round(formPow*10)/10+'+'+Math.round(chemPow*10)/10+
      '='+t.pow+(ordered && ordered.length ? ' ['+ordered.map(c=>String((c&&c.handle)||'?')+':'+Math.round(ccCardOvr(c)*10)/10).join(' ')+']' : '');
  /* The region this team plays in is the career's, not the card's.

     Every row in a lobby is labelled with the region of its first card, which is
     right for a field drawn out of that region and wrong for the one team that
     was not drawn at all. A career playing in NA West as a card whose real
     result was NA Central sat in a table of NA West teams with NA Central
     printed beside its own name. His report, 20 August: a career competes where
     it lives, and where its passport was stamped is a different question. */
  t.summitRegion=ccCareerRegion();
  return t;
}
const CAREER_TAPER=10;
/* Partner rating gap multiplies the development term:
     +10 above x1.50, +5 x1.25, same x1.00, -5 x0.85, -10 x0.70
   Range kept narrow so a partner shapes a career but never replaces playing well. Only the development
   term: the (actual - expected) half already reflects pair strength, paying it twice would let careers farm it. */
const CC_MATE_UP=0.05, CC_MATE_DOWN=0.03, CC_MATE_MAX=1.5, CC_MATE_MIN=0.7;
function careerMateFactor(myOvr){
  const mates=careerMates();
  if(!mates.length) return 1;
  /* The best seat at the table, not the sum of them.

     Adding two gaps together would hand a trio a faster arc than a duo for
     arithmetic reasons rather than for anything that happened in a lobby, and
     the range here is deliberately narrow on purpose — who you play with should
     shape a career and never replace playing well. */
  const his=Math.max.apply(null, mates.map(m=>{
    const o=(m._ovr!=null ? m._ovr : (attrsFor(m)||{}).ovr);
    return isFinite(o) ? o : -Infinity;
  }));
  if(!isFinite(his)) return 1;
  const gap=his-myOvr;
  const f=1 + (gap>0 ? gap*CC_MATE_UP : gap*CC_MATE_DOWN);
  return clamp(f, CC_MATE_MIN, CC_MATE_MAX);
}
/* Every played night grows the rating, not just the division cup. careerApplyGrowth used to be called only from
   the cup, so about six nights in ten (for the partner too) taught nothing.
   Same math: (actual − expected) against the same field, same taper.
   Guarded: a stage with one team, or a runner that has moved past its field when writing the row, gets nothing
   instead of a divide by zero. */
/* ПРОРЫВ (28.10, идея игрока в Notion «27.10»: на двадцатом сезоне карьеры одни и те же про, «make it so random ai
   can become good from 1 breakthrough tournament and maybe later place good in majors/lans», «each tournament could
   give a new star player»). Плавный рост книги (careerGrowField) двигает по десятым и звёзд не делает. Здесь после
   турнира с полем от CC_BREAK_FIELD команд одна команда из топ-CC_BREAK_TOP, вышедшая из слабой половины поля по
   силе, с шансом CC_BREAK_P получает разовый скачок +4…+7 каждому из состава в книгу роста (выдуманные — в свою,
   devL) и пост «новая звезда». Не чаще раза в неделю, человек — не чаще раза в год, потолок CC_BREAK_TO. Случай — от
   дня и поля, не Math.random: в гонке и командной игре книга у всех одна (вызывается там же, где careerGrowField). */
/* Возраст (его «давай так» 28.10): до CC_BREAK_YOUNG лет прорыв насовсем — новая звезда; старше — вспышка формы на
   CC_BREAK_HOT турниров, потом прибавка снимается (ccBreakoutTick). Возраст — как на карточке (ccAgeShown). */
const CC_BREAK_FIELD=40, CC_BREAK_TOP=3, CC_BREAK_P=0.6, CC_BREAK_TO=92, CC_BREAK_YOUNG=22, CC_BREAK_HOT=6;
// Каждый турнир: у временных прорывов на один турнир меньше; кончились — прибавка уходит из книги.
function ccBreakoutTick(){
  const cr=CAREER && CAREER.career;
  if(!cr || !Array.isArray(cr.breakouts)) return;
  cr.breakouts.forEach(b=>{
    if(!b || !(b.left>0)) return;
    if(--b.left>0) return;
    const book=b.lad ? CAREER.devL : CAREER.dev;
    if(book && book[b.k]!=null){ const v=Math.round((book[b.k]-(b.d||0))*10)/10; if(Math.abs(v)<0.05) delete book[b.k]; else book[b.k]=v; }
    b.d=0;
  });
}
const CC_BREAK_BY={name:'Rising Stars FN', handle:'risingstarsfn', f:36000};
function ccBreakoutCheck(field, you){
  const cr=CAREER && CAREER.career;
  if(!cr || !field || field.length<CC_BREAK_FIELD) return;
  const today=careerToday();
  cr.breakouts=(cr.breakouts||[]).filter(b=>b && ccDaysBetween(b.day, today)<=365);
  // Не чаще раза в неделю: турниров в неделе несколько, и прорыв каждый вечер раздул бы сцену.
  if(cr.breakouts.some(b=>ccDaysBetween(b.day, today)<7)) return;
  const rnd=careerRng(ccHashStr('breakout|'+today+'|'+field.length));
  if(rnd()>CC_BREAK_P) return;
  const ranked=careerRankField(field);
  const strength=t=>(t.pow||0)+(t.closeEdge||0);
  const weakHalf=new Set(field.slice().sort((a,b)=>strength(a)-strength(b)).slice(0, Math.floor(field.length/2)));
  const seen=new Set(cr.breakouts.map(b=>b.k));
  let peerKey=null;
  try{ if(typeof ccMpTeam==='function' && ccMpTeam() && typeof MP!=='undefined' && MP.peer) peerKey=hKey(MP.peer); }catch(e){ peerKey=null; }
  for(let i=0; i<Math.min(CC_BREAK_TOP, ranked.length); i++){
    const t=ranked[i];
    if(t===you || t.isYou || t.isRival || t.isMate || !weakHalf.has(t)) continue;
    const cards=(t.squad||[]).filter(c=>c && c.handle);
    if(!cards.length || cards.some(c=>seen.has(hKey(c)) || (peerKey && hKey(c)===peerKey))) continue;
    const d=4+Math.floor(rnd()*4);
    cards.forEach(c=>{
      const k=hKey(c), lad=(c.tier==='ladder');
      const book=lad ? (CAREER.devL=CAREER.devL||{}) : (CAREER.dev=CAREER.dev||{});
      const now=(c._ovr!=null ? c._ovr : (attrsFor(c)||{}).ovr)||0;
      const add=Math.max(0, Math.min(d, CC_BREAK_TO-now));
      if(add>0) book[k]=Math.round(((book[k]||0)+add)*10)/10;
      const age=(typeof ccAgeShown==='function') ? ccAgeShown(c.handle) : null;
      const hot=age!=null && age>CC_BREAK_YOUNG;
      cr.breakouts.push(hot ? {k, day:today, d:add, lad:lad?1:0, left:CC_BREAK_HOT} : {k, day:today, d:add});
    });
    const tags=cards.map(c=>'@'+ccHandle(c.handle)).join(' & ');
    careerNews('good', 'ccPostBreakout', [tags, i+1, Math.floor(rnd()*3)], {by:CC_BREAK_BY});
    return;
  }
}
function careerGrowEvent(place, total, you, field){
  if(!(place>0) || !(total>1) || !you) return 0;
  /* Вечер учит всю комнату, а не только того, кто её читает. См. careerGrowField.
     В ГОНКЕ — только общий вечер: книга развития (CAREER.dev) и разводы пар — это
     мир, из которого потом собирается поле у всех; личный вечер (соло-серия, вечер
     врозь) двигал бы мир у одного, и следующее общее поле расходилось бы на 892
     команды из 900 (годовая проба на шестерых 8.09: Reload 8 января после соло 6-го). */
  /* И общий вечер НЕ ВСЕЙ комнаты (финал недели у двоих из шести, кому хватило квала) мир тоже
     не двигает: книга росла бы у двоих и стояла у четверых, и следующий общий кубок расходился
     бы на первой игре (год 9.09: финал 7.02 у Live1+Live6 → кубок 9.02, две группы таблиц). */
  /* Решает СНИМОК комнаты на старте (CC_RACE_ROOM0), а не живая комната: живая у первого
     доигравшего ещё полная, у последнего уже без ушедших вперёд — рост был делом скорости.
     И вечер, разошедшийся на границе раундов (CC_RACE_NIGHT_APART), мир не двигает ни у кого. */
  const raceApart=(typeof ccRaceOn==='function' && ccRaceOn() &&
    ((typeof CC_RACE_NIGHT_APART!=='undefined' && CC_RACE_NIGHT_APART) ||
     !(typeof CC_RACE_ROOM0!=='undefined' && CC_RACE_ROOM0) ||
     (typeof ccRaceRivals==='function' && Object.keys(CC_RACE_ROOM0).length<ccRaceRivals().length)));
  /* В КОМАНДЕ ТО ЖЕ: вечер, который играет один (CC_MP_ALONE — напарнику в этот день играть нечего),
     двигал книгу развития только у него, и следующее общее поле расходилось на силе бота
     (командный год за Pixie и SwizzY 20.10: соло 17.01 → Duos Victory Cup 19.01, f1n4ik+zarbeh 88 против 89). */
  const teamApart=(typeof ccTeamSoloNight==='function' && ccTeamSoloNight());
  if(field && field.length>1 && !raceApart && !teamApart){ careerGrowField(field, you); ccBreakoutTick(); ccBreakoutCheck(field, you); }
  /* И вечер, отыгранный дома, пишется на дом — на ту из трёх точек, где ты
     сидел. Ауру делает не результат турнира, а то, удержал ли ты место: счёт
     стычек за этап против счёта поражений. См. careerSpotNight. */
  if(you.landingZone){
    const at=careerSpotZones(ccNightSpot(ACTIVE_LANDING_SET)).findIndex(x=>x.zone===you.landingZone);
    if(at>=0) careerSpotNight(you.landingWins||0, you.landingLosses||0, ccNightSpot(ACTIVE_LANDING_SET), at,
                              !!you._beefMet);
  }
  /* Очки прокачки за вечера больше не капают — правка:
     «очки только в начале карьеры, в создании карточки, один раз». Раздача
     живёт на экране создания (ccSpField); careerSpAward/careerSpSpend ниже —
     мёртвые, оставлены ради сейвов, где cr.sp ещё лежит. */
  return careerApplyGrowth(place, total, you, (field && field.length) ? field : [you]);
}
/* Очки прокачки — его пункт 3 со страницы «ы», 22 августа: «отдавать очки
   (типо как рпг, игрок может все в аим отдать или в клатч или тд)». Копятся
   за результат вечера: титул +3, подиум +2, верхняя четверть комнаты +1 —
   награда за турниры, а не замена тренировкам. Тратятся с карточки на хабе:
   одно очко — плюс полшага в выбранный стат, той же арифметикой и с тем же
   тренировочным потолком, что и день в KovaaK's. */
function careerSpAward(place, total){
  if(!CAREER || !(place>0) || !(total>1)) return 0;
  const got = place===1 ? 3 : place<=3 ? 2 : ((place-1)/(total-1)<=0.25 ? 1 : 0);
  if(!got) return 0;
  const cr=CAREER.career;
  cr.sp=(cr.sp||0)+got;
  careerNews('good', 'ccNewsSp', [got, cr.sp]);
  return got;
}
function careerSpSpend(k){
  const cr=CAREER.career, pl=CAREER.player;
  if(!(cr.sp>0) || ATTR_KEYS.indexOf(k)<0) return;
  if(!pl.attrs) pl.attrs=ccOwnAttrs();
  if(!pl.attrs) return;
  const now = pl.ovrExact!=null ? pl.ovrExact : pl.ovr;
  pl.attrs[k]=clamp((pl.attrs[k]||50)+0.5, 35, 99);
  const raw=ATTR_KEYS.reduce((s,a)=>s+(pl.attrs[a]||50)*ATTR_W[a],0);
  pl.ovrExact=clamp(Math.max(now, Math.min(raw, careerTrainCap())), 40, 99);
  pl.ovr=Math.round(pl.ovrExact);
  pl.attrs.ovr=Math.round(raw);
  cr.sp--;
  careerSave();
  careerRenderHub('me');
}
/* Сильный игрок сцены замечает хороший вечер: пишет в комменты/ЛС и даёт небольшую прибавку формы (в тех же границах).
   Решается в конце вечера, а не при отрисовке ленты: комментарии собираются из хэша поста при каждой отрисовке, и форма росла бы от листания.
   Порог: верхняя десятая сверх своего места в комнате. Пишет настоящий человек из ростера своей сцены выше тебя, если выше никого нет, не пишет никто. */
const CC_NOD_TOP=0.10, CC_NOD_FORM=0.5;
function ccProNod(place, total){
  if(!CAREER || !(place>0) || !(total>1)) return null;
  if((place-1)/(total-1) > CC_NOD_TOP) return null;
  const cr=CAREER.career, pl=CAREER.player;
  const mine=(pl.ovrExact!=null?pl.ovrExact:pl.ovr)||0;
  let pool=[];
  try{
    pool=(careerRosterNowEU()||[]).filter(p=>{
      const o=(p._ovr!=null?p._ovr:(attrsFor(p)||{}).ovr)||0;
      return o>mine+2 && String(p.handle||'');
    });
  }catch(e){ return null; }
  if(!pool.length) return null;
  // Тот же бросок при том же вечере: сейв читается дважды — ответ один.
  const rnd=careerRng(ccHashStr('nod|'+cr.season+'|'+careerToday()+'|'+place));
  const who=pool[Math.floor(rnd()*pool.length)];
  if(!who) return null;
  cr.form=clamp((cr.form||0)+CC_NOD_FORM, -CC_FORM_MAX, CC_FORM_MAX);
  return String(who.handle||'');
}
function careerApplyGrowth(place, total, you, field){
  const pl=CAREER.player;
  // The week that just happened is remembered before it is scored.
  careerFormAdd(place, total);
  // И, если вечер того стоил, кто-то сверху это заметил. Записывается на карьеру,
  // а лента потом просто показывает записанное — см. ccProNod.
  const nod=ccProNod(place, total);
  if(nod) CAREER.career.nod={day:careerToday(), who:nod};
  const actual = total>1 ? 1-(place-1)/(total-1) : 0.5;
  // Strength as the fight sees it, not as the card prints it. `pow` leaves the
  // connection out — the engine carries it separately as closeEdge and adds it
  // inside a duel — so a German player beat their own expectation every single
  // week and the rating drifted upwards for a reason that had nothing to do
  // with playing well. The arc harness caught it: careers finished twelve
  // points above a ceiling that was supposed to stop them.
  const strength = t => t.pow + (t.closeEdge||0);
  const mine=strength(you);
  const stronger=field.filter(t=>t!==you && strength(t)<mine).length;
  const expected = field.length>1 ? stronger/(field.length-1) : 0.5;
  // Пресс-конференция после заметного вечера и исход обещания (ccPressAfterNight). Не ломает вечер ни при какой ошибке.
  try{ ccPressAfterNight(place, total, expected); }catch(e){ console.error('press', e); }
  try{ ccStaffAfterNight(place, total); }catch(e){ console.error('staff dm', e); }
  try{ ccTechSceneAfterNight(total); }catch(e){}
  const before = pl.ovrExact!=null ? pl.ovrExact : pl.ovr;
  const taper = clamp((careerPotential()-before)/CAREER_TAPER, 0, 1);
  // Who you play with is who you learn from. A partner above you drags you up
  // and one below you does not, which is the one thing a duo decides that the
  // rating did not carry: the seat was worth half of every result and nothing
  // at all of the growth. Half a point of partner is a point of learning, and
  // the pull is capped both ways so a duo cannot replace playing well.
  const develop = careerMyDevelopNow(ccPlayerAge())*(careerMyDevelopNow(ccPlayerAge())>0 ? taper : 1)
                  * careerMateFactor(before);
  /* Difficulty scales the whole arithmetic, not just the gains. If it sits only on careerDevelopNow and training while
     this line (what a result is worth) stays full strength, on Legend a good day gives 0.1 and a bad night a whole
     point, and since expectation is read off the field it pins you in place. CC_DIFFS: a harder career is the same room
     for longer, which only holds if everything that moves a rating scales by the same fraction. */
  /* Ожидание — РЕГРЕССИЯ, а не голая доля поля, которую ты сильнее.

     Жалоба игрока: «упал рейтинг за год на 6, не должно такого
     быть, почему они вообще падают». Замер по сорока вечерам подряд: игрок 96 в
     дивизионе 1 с МЕДИАННЫМ ВТОРЫМ местом терял 0.5, двадцатишестилетний 92 с
     пятым — 0.7. Причина арифметическая: у сильнейшего доля поля, которую он
     сильнее, почти единица, выше приехать некуда, а вниз — сколько угодно, и
     дисперсию оплачивает он сам.

     Ровно это уже починено для сцены 22 августа (см. careerGrowField): ожидание
     ставится не туда, где стоит сила, а туда, куда сила в этой комнате в
     среднем доезжает — наклон считается с самого вечера. Теперь тем же живёт и
     свой вечер: комната одна, наклон один (CC_NIGHT_SLOPE). Без него — как
     раньше: сцена не считалась, значит и наклона нет. */
  const fit = CC_NIGHT_SLOPE>0 ? 0.5+CC_NIGHT_SLOPE*(expected-0.5) : expected;
  const delta = develop + (actual-fit)*careerGrowthMax()*careerDiff().age;
  const after = clamp(before+delta, 40, 99);
  pl.ovrExact = after;
  pl.ovr = Math.round(after);
  /* The seat beside them played the same night and grows on the same terms.

     На тех же — значит и ожидание то же. Сюда уходило СЫРОЕ expected, хотя
     строкой выше своё считается по регрессии (fit): у сильной пары доля поля,
     которую она сильнее, почти единица, выше ехать некуда, а вниз — сколько
     угодно, и всю дисперсию оплачивал напарник.

     Замер: «180 дней промотал, мой игрок вырос, напарник упал».
     Прогон той же кнопкой (careerFastForward, 180 дней, 78 вечеров): игрок
     90 → 93, напарник 96 → 93, запись дуо −3.34. Возрастная половина при этом
     ПЛЮСОВАЯ (кривая 0.13, тейпер 0.6) — то есть весь минус приезжал из этого
     одного аргумента. Ровно та же поломка, что чинили карьере 24 августа. */
  careerMateGrow(actual, fit);
  /* A result pays into all six, rather than rebuilding them.

     His design, 17 August: train one stat at a time, and let the tournaments pay
     into everything. The second half of that could not work, because this line
     used to rebuild a rookie's six numbers from the rating after every cup - so
     a week of training one attribute was wiped by the next result, and the card
     always had the same shape whatever the player had actually worked on.

     The weights sum to one, so adding the same delta to every attribute moves the
     rating by exactly that delta: the growth calibration is untouched, and what
     survives is the difference between an aim player and an endurance player,
     which is the only reason to choose a session at all. */
  // A taken card that has never trained has no six of its own and keeps reading
  // the roster's, so this only runs where there is something to pay into.
  if(!pl.handle || pl.attrs){
    if(!pl.attrs) pl.attrs=ccRookieAttrs(pl.ovr, pl.role);
    ATTR_KEYS.forEach(k=>{ pl.attrs[k]=clamp((pl.attrs[k]||50)+delta, ccAttrFloor(k), 99); });
    pl.ovrExact=clamp(ATTR_KEYS.reduce((s,k)=>s+pl.attrs[k]*ATTR_W[k], 0), 40, 99);
    pl.ovr=Math.round(pl.ovrExact);
    // The rating the six add up to, kept beside them: attrsFor starts its lift
    // from this number, and a stale one flattens the card. See careerDoAct.
    pl.attrs.ovr=Math.round(pl.ovrExact);
  }
  return {delta, develop, before, after, expected, actual, taper};
}

/* Career organisations. An org's standing is the mean rating of its real players in the current
   year (careerOrgPool reads it, tools/career-org-check.js checks it); it decides who looks at you,
   what they pay and what they expect. All clubs are in, not only the 39 with a crest on disk;
   crestless clubs get a monogram. */

// Which crests are on disk, so a club can be told from a club that has to be
// drawn. Filenames rather than club names because that is what clubLogoFile
// answers, aliases and all — FOKUS and FOKUS CLAN both come out FOKUS_CLAN.png.
// Generated by tools/career-org-check.js; regenerate it when logos/ changes.
const CAREER_CRESTS=new Set([
  '7VEN_CLUB.png','AlUla_Club.png','All_Gamers.png','Aspect_Esport.png','Aurora_Gaming.png',
  'BAZ_ESPORTS.png','BIG.png','Baron_Clan.png','BetBoom_Team.png','CGN_Esports.png',
  'COOLER_Esport.png','Clan_Housen.png','Cloud9.png','CoveX.png','Cynapse_Esports.png',
  'DELTA_esports.png','Detect_Esports.png','DetonatioN_FocusMe.png','Dignitas.png',
  'Eleven_Gaming.png','Elite_Esports.png','FOKUS_CLAN.png','FURIA_Esports.png','FaZe_Clan.png',
  'Fear.png','Flare_Esports.png','Fluxo_W7M.png','Fnatic.png','G2_Esports.png',
  'G2_Esports_2019_lightmode.png','Gambit_Esports.png','Geekay_Esports.png','Gen.G_Esports.png',
  'Gentle_Mates.png','GodLike.png','HYLND.png','Hawk_Esports.png','JFT_Esports.png',
  'KIT_Gaming_Elite.png','KoS_Esports.png','LEAF.png','Leviat_n.png','Loyalty_Gamer.png',
  'Lynox_Esport.png','Lyost_Esport.png','MGA_Esport.png','MOUZ.png','Matrix.png','NEXUS.png',
  'NOM_eSports.png','NTO_Corp.png','Natare_Six.png','Natus_Vincere.png',
  'Northern_Star_Gaming.png','OCE5N.png','ORA_Esport.png','PARIVISION.png','PWR.png',
  'Drayko_Esport.png','Poyo_Esports.png','QT_DIG.png','R8_Esports.png','ROC_Esports.png','SORIN.png','Shimo.png','Team_Eldia.jpg','Kraven_Esport.jpg',
  'ShindeN.png','Solary.png','T1.png','TRKF_E-Sport.png','TSM.png','TYT_Esports.png',
  'Team_Falcons.png','Team_HavoK.png','Team_Liquid.png','Team_STM.png','Team_Spirit.png',
  'Team_Vitality.png','Twisted_Minds.png','Virtus.pro.png','Void_Esports.png','Vulcan_Esport.png',
  'Wave_Esports.png','XP42.png','XSET.png','ZETA_DIVISION.png',
  '00_Nation.png','01_Esports.png','100_Thieves.png','26_Rising.png','2AM_Esports.png','2R-Esport.png','2R_Esport.png','9z_Team.png','A2.png','Absolute_First.png','AceOfSpades_Esports.png','Agent_Gaming.png','AIGHT.png','AJS.png','ALBA_E-sports_Etajima.png','Alliance_Esport.png','Alore_Unit.png','Al_Qadsiah.png','Al_Ula.png','Anarchy_Esports.png','Apeks.png','Armour_Esports.png','ASMR_eSports.png','Astralis.png','Avery_E-Sports.png','Avesta_Gaming.png','Azteca_Esport.png','Become_Elegant.png','Become_Legends.png','Beneath_Reality.png','Beyond_eSports.png','Bifrost.png','BK_ROG_Esports.png','Blaze_E-Sports.png','Blessed_Esports.png','Blue_Phoenix.png','Blue_Phoenix_e-sports.png','BornToPlay.png','Bravado_Gaming.png','Built_By_Gamers.png','Built_For_Greatness.png','Centric_Gaming.png','Cherry_Esport.png','Chronic.png','Cloud_Esports.png','Complexity_Gaming.png','Continuum_Esports.png','Copenhagen_Flames.png','Counter_Logic_Gaming.png','Crazy_Raccoon.png','Create_The_Revolution.png','Crow_Esports.png','CXT_Esports.png','Cyber_Legacy.png','DAMWON_Gaming.png','DRAGONS_eSports.png','Dsyre.png','ECV_Esports.png','EGY_Esports.png','ENDLESS.png','Enefy_Esports.png','Enterprise_Esports.png','Enterprise_Gaming.png','ENTER_FORCE.36.png','eRa_Eternity.png','Evils_Esport.png','Exalty.png','Exceed.png','Excel_Esports.png','Executors_One.png','Exeed.png','Exen_Esports.png','Extinct_Esports.png','F4TALITY.png','Falcons_Esports.png','FISTERIA.png','Flame_Hard.png','Flawless_Region.png','FLC.png','FLC_Clan.png','FLu_Esports.png','Flyh_Esports.png','FNO.png','Focus_e-Sports.png','Foolish_e-sports.png','Frantik_Esports.png','Fruity_Esports.png','FUSION.png','Future_Talent.png','Gaimin_Gladiators.png','Galaxy_Racer.png','Galions.png','GamersOrigin.png','GameWard.png','GameWith.png','Gamma_Gaming.png','Ghost_Gaming.png','GigaHub.png','GLORE.png','Glorious_Esport.png','Glory_Esports.png','GNF_Clan.png','Gremio_Esports.png','Grizi_Esport.png','Guild_Academy.png','Guild_Esports.png','Gutta_Esports.png','Gz.png','Heaven_Gates.png','HEROIC.png','Hero_Base.png','Honor_Future.png','Intake_Region.png','Isurus_Gaming.png','J.Storm.png','JFT.png','JOGO.png','K13_Esport.png','Karmine_Corp.png','KINGS_Esports.png','KIT_StarLeven_KYUSHU.png','Knights_of_Shadows.png','Koji_Gaming.png','KPI_Gaming.png','Kungarna.png','Kyrex_Esports.png','Lazarus_Esports.png','Legacy_Esports.png','Legends_Esports.png','Lethal_Region.png','Limit_Esports.png','Lionscreed.png','LND_Esports.png','LootBoy_Esports.png','LOUD.png','Loyal_Esports.png','Lucky_e-Sports.png','Luminosity_Gaming.png','Luminox_Planet.png','LvlUp_Esports.png','LYNX_e-sports.png','M10_eSports.png','Manchester_City_Esports.png','Medal_Esports.png','Mighty_Titans_Osaka.png','Mind_Games.png','Mirage_Elyandra.png','Mirage_Esports.png','Misfits.png','Misfits_Gaming.png','MNRS_Sports.png','Monaco_Esports.png','Morning_Stars.png','mYinsanity.png','Mystic_Esports.png','Nester.png','Newbee.png','Nexus_Team.png','NightMare_E-sports.png','Ninjas_in_Pyjamas.png','NLT.png','NORTHWINS.png','NXG_JFT.png','Oath_Esports.png','OBI_E-sports.png','ODD_PLAN.png','One_True_Army.png','Oni_Esports.png','Onyx_Esports.png','Onyx_Ravens.png','Ooredoo_Thunders.png','ORDER.png','Orkadia_Esports.png','orz_e-Sports.png','Outcast_Region.png','Outlaws.png','Ovation_eSports.png','Overt.png','Overtake.png','Overt_Academy.png','Panic_eSports.png','Paradis_Esport.png','Paradox_Gaming.png','PHNX_Esports.png','Pipeline_Esports.png','Playwell_Esports.png','POWER_eSports.png','Premium_Gaming.png','Prodigy.png','PSG_TNA.png','PULVEREX.png','Quadrant.png','R4_Corp.png','RAFHA_eSPORTS.png','RAK_United.png','Reality_Zone.png','Red_Bull_eSports.png','RED_Canids.png','Red_Line.png','Regal_Esports.png','REIGNITE.png','REJECT.png','Renegades.png','Repulse_Gaming.png','Revolution_Esports.png','Riddle.png','Rival_Esports.png','Rix.GG.png','RIZON.png','Rogue.png','Royalsten_Esports.png','RVL_ESPORT.png','RVL_Esports.png','Ry2_Esports.png','Saints_Esports.png','Saku_Esports.png','SCYTES.png','Sengoku_Gaming.png','Sentinels.png','Siko_Esports.png','Singularity_Esports.png','SmokeSolid_Gaming.png','Solary_Academy.png','Soolit_Esport.png','Soul_Runner.png','SRG.png','Staria.png','STELF.png','Stride_Esports.png','Strike_Esports.png','STR_Awlay.png','Sudor_Esports.png','Supremacy.png','Swamp_Gaming.png','T6_eSports.png','TeamPWR.png','Team_33.png','Team_33_Gaming_Academy.png','Team_ACTIVE.png','Team_Assault.png','Team_Atlantic.png','Team_Atlantis.png','Team_BDS.png','Team_Elevate.png','Team_Envy.png','Team_Fourty7.png','Team_Fury.png','Team_GO.png','Team_Heretics.png','Team_Honor.png','Team_MCES.png','Team_Nature.png','Team_New_Age.png','Team_Nova.png','Team_Orchid.png','Team_Parallel.png','Team_Pulsar.png','Team_Queso.png','Team_SAQR.png','Team_Sarrow.png','Team_Secret.png','Team_Singularity.png','Team_Sleight.png','Team_Sonic.png','Team_South.png','Team_Stallions.png','Team_Summit.png','Team_Swipe.png','Team_Vanish.png','Team_Velora.png','Team_Vikings.png','Tempo_Storm.png','TheCartel_Esports.png','The_Ultimates.png','Thrive_Against_Odds.png','Titans_Esports.png','TrainHard_eSport.png','Tricked_Esport.png','Triple_Esports.png','Trojan_Esports.png','Tropical_Esports.png','Tru_North_Gaming.png','TT9_Esports.png','Tulsa_Esports.png','Tundra_Esports.png','Turtle_Bunnies.png','Ultimate_Warriors.png','Valhalla_Vikings.png','Valiant.png','Vatles_Esport.png','VCTRY_Esports.png','Veloce_Esports.png','Venomy_Esports.png','Vigorous.png','Villain.png','Vision_Esports.png','VISU_Gaming.png','Vitality.png','Vivid_Esport.png','VOLARE.png','Vortex_CGO.png','w7m_esports.png','Warriors_ESport.png','Warriors_Esports.png','Wave_Esports_Academy.png','Wick_eSports.png','Williams_Resolve.png','Winthrop_University.png','Witness_The_Journey.png','WIZARD_ESPORTS.png','Wooka_Esport.png','World_Best_Gaming.png','Xen.png','Xenesis_e-sports.png','Xility_Esports.png','Xplosion.png','XTRA_Gaming.png','Zenn_eSports.png',
  'Lazarus.png','STRAW.png',
  'Aevion_Gaming.png','ASMR.png','Coast.png','Crow.png','F4TALITY_eSports.png','FNO_Esports.png','Legacy.png','Luminosity.png','Mirage.png','Nature_e-sports.png','New_Age_eSports.png','Oath_Gaming.png','Overlooked.png','Playwell_Esport.png','Requiem_Esports.png','RXB.png','S8UL.png','Singularity.png','Team_Darth.png','Team_Lumina.png','Team_Onyx.png','Tension.png','Vanish.png','ZO.png',
  '4elements.png','9ine.png','Aerial_Unit.png','AION_Esports.png','Alpine_Gaming.png','Athletix_eSport.png','AXR_Esports.png','Chiefs_Esports_Club.png','Control_Gaming.png','DNA_Esports.png','EDGE.png','ELEVATE.png','EvozA_eSport.png','Justice_Esports.png','Kova_Esports.png','Lestream_Esport.png','Marine_Region.png','MBI.png','MRKN_Clan.png','NASR_ESports.png','Nerve_Gaming.png','NRG.png','ONEUP_ESPORTS.png','One_True_Revival.png','Optimal_Ambition.png','Outplayed.png','Pandore_eSport.png','Primitive_Esports.png','Quantum_Esports.png','Raised_By_Kings.png','Riot_Squad_Esports.png','RisingStars.png','Savant_Esports.png','Siren_Esports.png','Stratum_Esports.png','Team_Eltrocity.png','Team_Overtime.png','Team_Pure.png','Team_Synergy.png','Team_TRIBE.png','TLS_E-Sports.png','Trident_Esports.png','Tsk_Esports.png','Tsunami_Esports.png','Tt9.png','Wake_eSports.png','Windigo_Gaming.png','Wiz_ESports.png','YJM_Esports.png',
  '1620_Kings.png','22_E-SPORTS.png','25_Esports.png','38_Esports.png','4T_Esports.png','9ine_Team.png','9LIVES.png','A10_Esports.png','ABK_Esports.png','ABSTRACT.png','Ace_Esports.png','Aeq_Esports.png','ALOFT_Gaming.png','Alterego_Esports.png','Alternative.png','Aqualix_Esports.png','Aquatic_Esports.png','Arrow_Clan.png','Ascend_eSports.png','Asteria_Gaming.png','Astronic_Esports.png','ATK_Esports.png','Aurum_Esports.png','Aventix_Esports.png','Averiour_Gaming.png','AWOL_Esports.png','AXIS_e-Sports.png','AYM_Esports.png','Azera_Esports.png','beGenius_ESC.png','Behard_Esport.png','BLAZE_Esports.png','BLZ_Esports.png','Ceesp_Gaming.png','Chrome.png','Claim_Esports.png','Clarity.png','Clarix_Esports.png','Colors_Esport.png','Crazy_Himmeen.png','Cream_Esports.png','Creed.png','Crest_Gaming.png','CRKG_Esports.png','Crucial_Esports.png','Cutlass_Esports.png','Destiny_Esports.png','Diinasty_Esports.png','Divinity_Esports.png','Dragon_Blue.png','Dreags_Esport.png','DTY_Esports.png','Eagles_Esports.png','Easy_Money_Esports.png','ECL_Gaming.png','ECS_e-Sports.png','EKINOX.png','eKod_eSports.png','Element_Esports.png','ENIX_Esport.png','EOZ_eSport.png','Esports_Psycho.png','eSpuma.png','Explicit.png','F2_Esport.png','FataL.png','FataL_Esports.png','Flawless_Esports.png','Frosted_Esports.png','Furious_Esports.png','GENIUS_e-sports.png','Gray_Hex.png','GRE_E-sports.png','GRY_Esports.png','Hawks_Esports.png','Heaven_Esports.png','HST.png','HwR_Esports.png','Hypro_Gaming.png','Impact_Esports.png','Invertice.png','Irg_Team.png','Kairos_Esports.png','Kira_Esports.png','KmB_Esport.png','Knockout_Esport.png','KnS_Clan.png','Lane_Esport.png','LAVIE_Esports.png','Leaf_Esp.png','Legit_Esports.png','Liberta_Building.png','Lizer_Esports.png','LizoR_Esport.png','Lsodya_Esport.png','Luminary_Esport.png','Magnum_Gaming.png','Mercury_eSports.png','Merge.png','Meta_Esports.png','Minus_Esports.png','Monto_Esports.png','MRN.png','Msr_Esport.png','Muse.png','NEXUS_e-sports_team.png','Nom_Gaming.png','Notorious.png','Oblique.png','Odious_Esport.png','ONEUP_FUTURE.png','OnLy_Esports.png','Oserv_Esport.png','OTX_ESPORT.png','Overtime.png','Overtime_Gaming.png','Pap_s_Esport.png','Paradise_eSports.png','Polarity_Clan.png','Polestar_Esports.png','PTH_E-Sports.png','QLT_Esports.png','RDT.png','Re-Lit_Esports.png','Redemption_Esports.png','REDLINE.png','Red_Triad_Esport.png','Refill_Gaming.png','Reign_Esports.png','ReLit_e-sports.png','Revile_Esports.png','RGN_E-Sports.png','RGN_Esports.png','Rog_Esport.png','RosCey_eSports.png','Ruls_Esports.png','Sacred_Esports.png','Savior.png','Savior_Esports.png','SAW_eSports.png','SK7_Esports.png','Slide_Esport.png','Solace.png','Solitary.png','Storm_ESport.png','Syrus_Esports.png','Tao_Esports.png','Team_Abstract.png','Team_Abyssal.png','Team_Acy.png','Team_Aex.png','Team_Aquiver.png','Team_Arrow.png','Team_Axey.png','Team_Aztech.png','Team_Clarity.png','Team_Corp.png','Team_Defuse.png','Team_Devour.png','Team_Dillusion.png','Team_Dionix.png','Team_Envious.png','Team_Eronic.png','Team_Exploit.png','Team_Extract.png','Team_Finest.png','Team_GrayHex.png','Team_Krypto.png','Team_Monarchy.png','Team_Process.png','Team_Qnas.png','Team_Quax.png','Team_Spectators.png','Team_Spectralis.png','Team_Trizon.png','Team_Vavory.png','Team_Whale.png','THE_ONE.png','Thrill_Region.png','Timbers_Esports.png','TRIBE.png','Trident.png','Uprise_Region.png','V3_Esports.png','V4_Gaming.png','Validus_Esports.png','VAMOS.png','VCGO.png','Vendetta.png','Vendetta_Esports.png','Viable.png','Vigilant_Esports.png','Violet_Esports.png','Voltage_Arise.png','Voltage_Esports.png','Vonix_E-Sports.png','VsBANDITS.png','Wasp_Esports.png','Wavy_Esport.png','WIP_Esports.png','Wolves_ESports.png','XPRT_Esports.png','Zenco_E-Sports.png','Zentra_Esports.png','Zyon_E-Sports.png',
  'FUT_Esports.png']);

// A club with no crest still needs a mark, or two thirds of the pool arrive on
// the contract screen as a name floating beside nothing. Initials, in the club's
// own colour: the hue is a hash of the name, so a club looks the same every time
// it is drawn without anybody choosing sixty colours.
function careerCrestMono(org, px, cls){
  const words=String(org).split(/[\s.\-]+/).filter(w=>/[A-Za-z0-9]/.test(w));
  const ini=(words.length>1 ? words[0].charAt(0)+words[1].charAt(0) : String(org).slice(0,2))
    .toUpperCase();
  const hue=hashStr(String(org))%360;
  return `<span class="cc-mono ${cls||''}" aria-hidden="true" style="width:${px}px;height:${px}px;
    font-size:${Math.round(px*0.42)}px;background:hsl(${hue} 42% 26%);
    border:1px solid hsl(${hue} 45% 46%);color:hsl(${hue} 65% 82%);">${esc(ini)}</span>`;
}

// clubCrestHTML sizes its badge with inline styles and sets display:block, which
// is right on a card and wrong beside a name. The career draws its own so the
// crest can sit inline in the identity bar and large in the club tile.
/* Logos whose background is painted into the file. See careerCrestImg. */
/* Аватарки клубов из X (9b95fe5, 8136544, e3bcf71) — квадраты с фоном, а список
   остался пустым с 19.08 (полный прогон 9.10, check-crest-alpha: 221 герб без плашки). */
const CC_LOGO_SOLID=[
  '1620_Kings.png','22_E-SPORTS.png','25_Esports.png','38_Esports.png','4elements.png',
  '4T_Esports.png','9ine.png','9ine_Team.png','A10_Esports.png','ABK_Esports.png','Ace_Esports.png',
  'Aerial_Unit.png','AION_Esports.png','ALOFT_Gaming.png','Alpine_Gaming.png','Alternative.png',
  'Aqualix_Esports.png','Aquatic_Esports.png','Arrow_Clan.png','Ascend_eSports.png',
  'Asteria_Gaming.png','Astronic_Esports.png','Athletix_eSport.png','ATK_Esports.png',
  'Aventix_Esports.png','Averiour_Gaming.png','AWOL_Esports.png','AXR_Esports.png','AYM_Esports.png',
  'Azera_Esports.png','beGenius_ESC.png','Behard_Esport.png','BLZ_Esports.png','Ceesp_Gaming.png',
  'Chiefs_Esports_Club.png','Chrome.png','Claim_Esports.png','Clarity.png','Clarix_Esports.png',
  'Colors_Esport.png','Control_Gaming.png','Crazy_Himmeen.png','Cream_Esports.png','Crest_Gaming.png',
  'CRKG_Esports.png','Crucial_Esports.png','Cutlass_Esports.png','Destiny_Esports.png',
  'Diinasty_Esports.png','Divinity_Esports.png','DNA_Esports.png','Dragon_Blue.png',
  'Dreags_Esport.png','DTY_Esports.png','Easy_Money_Esports.png','ECL_Gaming.png','ECS_e-Sports.png',
  'EDGE.png','EKINOX.png','eKod_eSports.png','Element_Esports.png','ELEVATE.png','ENIX_Esport.png',
  'EOZ_eSport.png','Esports_Psycho.png','eSpuma.png','EvozA_eSport.png','F2_Esport.png','FataL.png',
  'FataL_Esports.png','Flawless_Esports.png','Frosted_Esports.png','FUT_Esports.png',
  'GENIUS_e-sports.png','Gray_Hex.png','GRE_E-sports.png','GRY_Esports.png','Hawks_Esports.png',
  'HwR_Esports.png','Invertice.png','Irg_Team.png','Kairos_Esports.png','Kira_Esports.png',
  'KmB_Esport.png','Knockout_Esport.png','KnS_Clan.png','Kova_Esports.png','Lane_Esport.png',
  'LAVIE_Esports.png','Leaf_Esp.png','Legit_Esports.png','Lestream_Esport.png','Liberta_Building.png',
  'Lizer_Esports.png','LizoR_Esport.png','Lsodya_Esport.png','Luminary_Esport.png',
  'Magnum_Gaming.png','Marine_Region.png','MBI.png','Mercury_eSports.png','Merge.png',
  'Meta_Esports.png','Monto_Esports.png','MRKN_Clan.png','MRN.png','Msr_Esport.png','Muse.png',
  'NEXUS_e-sports_team.png','Nom_Gaming.png','Notorious.png','NRG.png','Oblique.png',
  'Odious_Esport.png','One_True_Revival.png','ONEUP_ESPORTS.png','ONEUP_FUTURE.png',
  'OnLy_Esports.png','Optimal_Ambition.png','Oserv_Esport.png','OTX_ESPORT.png','Outplayed.png',
  'Overtime.png','Overtime_Gaming.png','Pandore_eSport.png','Pap_s_Esport.png','Polarity_Clan.png',
  'Polestar_Esports.png','Primitive_Esports.png','PTH_E-Sports.png','QLT_Esports.png',
  'Quantum_Esports.png','Raised_By_Kings.png','RDT.png','Re-Lit_Esports.png','Red_Triad_Esport.png',
  'REDLINE.png','Refill_Gaming.png','ReLit_e-sports.png','Revile_Esports.png','RGN_E-Sports.png',
  'RGN_Esports.png','Riot_Squad_Esports.png','RisingStars.png','Rog_Esport.png','RosCey_eSports.png',
  'Ruls_Esports.png','Sacred_Esports.png','Savant_Esports.png','Savior_Esports.png','SAW_eSports.png',
  'Shimo.png','SK7_Esports.png','Slide_Esport.png','Solace.png','Solitary.png','Stratum_Esports.png',
  'Tao_Esports.png','Team_Abstract.png','Team_Abyssal.png','Team_Acy.png','Team_Aex.png',
  'Team_Aquiver.png','Team_Arrow.png','Team_Axey.png','Team_Aztech.png','Team_Clarity.png',
  'Team_Corp.png','Team_Defuse.png','Team_Devour.png','Team_Dillusion.png','Team_Dionix.png',
  'Team_Eldia.jpg','Team_Envious.png','Team_Eronic.png','Team_Exploit.png','Team_Extract.png',
  'Team_GrayHex.png','Team_Krypto.png','Team_Monarchy.png','Team_Overtime.png','Team_Process.png',
  'Team_Qnas.png','Team_Quax.png','Team_Spectators.png','Team_Spectralis.png','Team_TRIBE.png',
  'Team_Trizon.png','Team_Vavory.png','THE_ONE.png','Thrill_Region.png','Timbers_Esports.png',
  'TLS_E-Sports.png','TRIBE.png','Trident.png','Trident_Esports.png','Tsk_Esports.png','Tt9.png',
  'Uprise_Region.png','V4_Gaming.png','Validus_Esports.png','VAMOS.png','VCGO.png','Vendetta.png',
  'Vendetta_Esports.png','Viable.png','Vigilant_Esports.png','Violet_Esports.png','Voltage_Arise.png',
  'Voltage_Esports.png','Vonix_E-Sports.png','VsBANDITS.png','Wake_eSports.png','Wasp_Esports.png',
  'WIP_Esports.png','Wiz_ESports.png','XPRT_Esports.png','YJM_Esports.png','Zenco_E-Sports.png',
  'Zentra_Esports.png','Zyon_E-Sports.png'];
function ccCrestSolid(f){ return CC_LOGO_SOLID.indexOf(f)>=0; }
function careerCrestImg(org, px, cls){
  /* Свой клуб — своим гербом: его рисует careerClubCrest, а зовут эту функцию
     шапка, таблицы, лента и переписка, так что подстановка нужна одна. */
  try{ if(typeof careerClub==='function'){ const my=careerClub();
    if(my && org && String(org)===String(my.name)) return careerClubCrest(px, cls, my); } }catch(e){}
  const f=org && clubLogoFile(org);
  if(!f) return '';
  if(!CAREER_CRESTS.has(f)) return careerCrestMono(org, px, cls);
  const solid=ccCrestSolid(f);
  return `<img class="${cls||''}${solid?' crest-tile':''}" src="${LOGO_DIR}${f}" alt=""
    onerror="this.remove()"
    style="height:${px}px;width:auto;max-width:${Math.round(px*1.9)}px;object-fit:contain;${
      solid ? '' : 'filter:drop-shadow(0 1px 3px rgba(0,0,0,.5));'}">`;
}

/* Clubs fielding someone this year, with their tier.
   Uses the current year's cards: careerRosterEU keeps each player's best card ever, which put Falcons
   at 92 and Gentle Mates at 93 instead of 80/83 and kept clubs with nobody in 2026.
   Spellings resolving to the same crest file merge (FOKUS / FOKUS CLAN, Knights of Shadows); the name
   kept is the one more current players carry. Crestless clubs get a monogram (careerCrestImg).
   Measured: 89 clubs across 901 EU players of 2026, tiers 50 to 96. */
let CC_ORG_POOL={};
/* Clubs that have no cards.
   careerOrgPool derives clubs from p.org on the roster, so an org without a Fortnite roster can't appear. These are tier-one Dota/CS orgs written by hand.
   Tiers sit just under the Fortnite giants (All Gamers 96, Virtus.pro 95): big orgs, no pedigree in this game. Tier decides who they look at and what they pay.
   No crest files: careerCrestImg falls back to a monogram until a matching .png lands in logos/. */
/* Ordered by career prize money, his call, 18 August — and the order is read
   rather than felt. The first pass was my guess and the guess was wrong in both
   directions: Team Liquid sat at 91 while being the highest-earning team in
   esports, and BetBoom sat level with it while being ninth of the ten.

   Totals from esportsearnings.com, 18 August 2026. The tier is the standing
   these numbers describe, not the numbers themselves. */
const CC_ORG_NEW=[
  {name:'Team Liquid',    tier:96, n:0, newcomer:true},  // $57.3M
  {name:'Team Spirit',    tier:96, n:0, newcomer:true},  // $37.8M
  {name:'Natus Vincere',  tier:94, n:0, newcomer:true},  // $24.9M
  {name:'FaZe Clan',      tier:93, n:0, newcomer:true},  // $21.7M
  {name:'G2 Esports',     tier:93, n:0, newcomer:true},  // $19.5M
  {name:'Team Vitality',  tier:92, n:0, newcomer:true},  // $16.6M
  {name:'Cloud9',         tier:92, n:0, newcomer:true},  // $14.5M
  {name:'MOUZ',           tier:91, n:0, newcomer:true},  // $10.5M
  {name:'BetBoom Team',   tier:89, n:0, newcomer:true},  // $5.2M
  {name:'PARIVISION',     tier:88, n:0, newcomer:true},  // $3.0M
  // Both have Fortnite rosters, so the pool derives them and the dedupe below
  // drops these. Left in place so the list reads as the full crossover set.
  {name:'Team Falcons',   tier:92, n:0, newcomer:true},
  {name:'Tundra Esports', tier:87, n:0, newcomer:true},
  /* Shimo (до вечера 21.09 — «Shimo Crew») — просьба (Notion «bags», x.com/ShimoCrew, герб
     logos/Shimo.png с их аватара). Призовых нет ни на esportsearnings, ни на
     Liquipedia — молодой клуб; уровень 80 — чуть выше пола списка (CC_ORG_EARN_FLOOR 78),
     это оценка, а не замер. */
  {name:'Shimo',          tier:80, n:0, newcomer:true},   // 21.09 вечер, отзыв: «Shimo, просто не Crew»
  /* Drayko Esport — по просьбе (x.com/Esportdrayko). Основан в 2026-м,
     в шапке профиля сам пишет свой счёт: «1x final div | 3x final solo | 900$».
     Ни на esportsearnings, ни на Liquipedia его нет, состава в карточках тоже
     нет — уровень ставится полом списка, ниже Shimo: это самый молодой клуб
     здесь, и любая цифра выше была бы выдумкой в его пользу. */
  {name:'Drayko Esport',  tier:78, n:0, newcomer:true},   // герб logos/Drayko_Esport.png с аватара
  /* Team Eldia — по просьбе 30.09 (x.com/Team_Eldia, «Team amateur fortnite», открыт 26.09.2026).
     Любительский клуб: ни esportsearnings, ни Liquipedia — уровень пола списка, как у Drayko.
     Состав из их же анонсов: Chainsaw mag (@magmafavelado, Бразилия) и Chapofn1 (@emilfn12, Дания); с 8.10 — ещё
     serkkovv, luk3, Vicens; с 18.10 Buedelupro вместо Infinix (см. pushCard Team Eldia). */
  {name:'Team Eldia',     tier:78, n:0, newcomer:true},   // герб logos/Team_Eldia.jpg с аватара
  // Kraven Esport — просьба 26.10 (x.com/kravenesport, Франция, с 30.09.2026): любительский клуб без призовых — пол списка.
  {name:'Kraven Esport',  tier:78, n:0, newcomer:true},
  /* Его четыре, 30 августа («на рабочем столе орги, добавил новые»): гербы
     легли в logos/. Уровни — по тому же ряду призовых esportsearnings, что и
     выше: TSM (~$15M за историю) рядом с Vitality/Cloud9, Gambit (~$18M, но
     без активного состава) чуть ниже. Eleven и COOLER стояли «у полосы
     Tundra» на глаз — и глаз ошибся: по Fortnite-призовым (CC_ORG_EARN,
     30 августа) COOLER — вторая команда за всю историю игры ($3.33M, выше
     FaZe и Liquid), Eleven — 21-я ($642k, между Falcons и Cloud9). У этих
     двоих нет другой дисциплины, по которой их можно было бы оценить, так
     что их уровень — ccOrgEarnLevel от этой суммы, как у клубов из ростера. */
  {name:'TSM',            tier:92, n:0, newcomer:true},
  {name:'Gambit Esports', tier:90, n:0, newcomer:true},
  {name:'Eleven Gaming',  tier:88, n:0, newcomer:true},  // $642k  → 88.5
  {name:'COOLER Esport',  tier:94, n:0, newcomer:true},  // $3.33M → 94.2
  /* Ссылка: x.com/TeamLG__ — Loyalty Gamer, французский клуб (Fortnite, Rocket
     League, Brawl Stars), 133 подписчика, состава по Fortnite в снимке сцены нет. Уровень 78 —
     пол списка призовых (CC_ORG_EARN_FLOOR): в топ-100 команд по Fortnite клуб не входит, а
     ростером его оценить не по кому. Герб — с его же аватарки в X, logos/Loyalty_Gamer.png. */
  {name:'Loyalty Gamer',  tier:78, n:0, newcomer:true}
];
/* Призовые команд Fortnite с esportsearnings.com/games/534-fortnite/top-teams, топ-100 (последняя $31k).
   Уровень клуба по двум сильнейшим путал клубы с одной-двумя звёздами и большие орги, поэтому нужны и ростер,
   и призовые. Шкала 82 + 8·log10(призовые / $100k): $31k → 78, $100k → 82, $1M → 90, $3.6M (Lazarus) → 94.5.
   Клуб из списка: (ростер + призовые) / 2. Вне списка 78 только прижимает сверху: 1–2 человека наполовину,
   3–5 на четверть, от шести верим ростеру (слабый клуб не поднимает). Таблица целиком, пул по региону
   (в NA Sentinels, 100 Thieves, NRG). Имена как на сайте, сопоставление через ccOrgKey (строчные буквы и цифры). */
const CC_ORG_EARN={
  'Lazarus':3618205,'Cooler Esport':3328635,'Sentinels':3327512,'FaZe Clan':2432777,
  '100 Thieves':2359564,'NRG':2222262,'TSM':2040027,'Counter Logic Gaming':1901035,
  'Team Liquid':1455588,'LeStream Esport':1358030,'Guild Esports':1316511,
  'Ghost Gaming':1260674,'Become Legends':1065515,'9z Team':1048800,'Kungarna':753676,
  'Wave Esports':739135,'Solary':724472,'Valhalla Vikings':719800,'Team Falcons':707948,
  'XSET':648150,'Eleven Gaming':642225,'Team Atlantis':584729,'Cloud9':478448,
  'Twisted Minds':427350,'Crazy Raccoon':395842,'Misfits':394200,'Virtus.pro':336333,
  'Gaimin Gladiators':323900,'TrainHard eSport':316831,'MCES':312245,
  'Gambit Esports':312234,'Team Vitality':292200,'Dignitas':289010,'Team GO':270180,
  'World Best Gaming':262500,'Karmine Corp':259350,'T1':254575,
  'Luminosity Gaming':229483,'Nigma Galaxy':212649,'Team Secret':209725,
  'GameWith':196040,'Fnatic':187730,'Gentside Esports Club':180276,
  'Team Kinguin':177548,'Built By Gamers':169783,'Complexity Gaming':168550,
  'Executors One':155650,'Tundra Esports':155000,'Team Envy':151000,
  'Triple Esports':150000,'Excel Esports':135900,'Millenium':133602,
  'Tempo Storm':120200,'PWR':118257,'Helsinki REDS':117030,'Natus Vincere':114305,
  'Supremacy':113817,'G2 Esports':113350,'AGO Esports':110850,'Riddle':106245,
  'Newbee':105100,'World Elite':104500,'Riot Squad Esports':100000,
  'Team Singularity':99682,'Heroic':99650,'Grizi Esport':96935,'Renegades':94018,
  'Team Vikings':93300,'Ninjas in Pyjamas':86441,'Gentle Mates':83593,'Astralis':83300,
  'Copenhagen Flames':82105,'Team Heretics':81429,'Raised by Kings':77218,
  'Optimal Ambition':74696,'Alliance':73445,'Chiefs Esports Club':71430,
  'Ovation eSports':70500,'M10 Esports':69000,'Enterprise Gaming':67700,
  'FunPlus Phoenix':65947,'Team Queso':65600,'Valiant':61750,'Oserv Esport':59856,
  'Dynamind':55950,'Manchester City eSports':55689,'GODSENT':54470,
  'Stratum Esports':50300,'Tricked eSports':50200,'FURIA':50000,'GamerLegion':50000,
  'MOUZ':49500,'Team Sniper Gang':42000,'Spectrum ESC':40250,'R8 Esports':40000,
  'Gamma Gaming':39775,'Elite Esports':37785,'Team BDS':33513,'BIG':31500,
  'Rise Nation':31350
};
const CC_ORG_EARN_FLOOR=78;   // уровень 100-й команды списка; ниже него список не видит
let CC_ORG_EARN_KEYS=null;
function ccOrgKey(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9]/g,''); }
// Призовые клуба по Fortnite или null, если его нет в топ-100.
/* Ключ для призовых мягче, чем ccOrgKey (его слово 8.10 «орги рейтинг … обнови если не так»): переименованный клуб
   терял свои призовые — Falcons Esports (2021) ≠ Team Falcons, Lazarus Esports ≠ Lazarus, FURIA Esports ≠ FURIA.
   Без «team» спереди и «esports/esport/gaming/clan/club» сзади — с обеих сторон, поэтому совпадения не шире смысла. */
function ccOrgEarnKey(s){
  let k=ccOrgKey(s);
  for(let i=0; i<2; i++) k=k.replace(/^team(?=.{3})/, '').replace(/(esports|esport|gaming|clan|club)$/, '');
  return k;
}
function ccOrgEarn(name){
  if(!CC_ORG_EARN_KEYS){
    CC_ORG_EARN_KEYS=new Map();
    Object.keys(CC_ORG_EARN).forEach(k=>CC_ORG_EARN_KEYS.set(ccOrgEarnKey(k), CC_ORG_EARN[k]));
  }
  const v=CC_ORG_EARN_KEYS.get(ccOrgEarnKey(name));
  return v==null ? null : v;
}
function ccOrgEarnLevel(usd){ return 82+8*Math.log10(usd/1e5); }
/* ПОДПИСЧИКИ КЛУБОВ В X (его слова 8.10: «добавь фоловеров оргам», «пусть фоловеры рядом с клубом пишет, типо даёт
   клуб медийку»). Основной аккаунт клуба: число и месяц снимка. Сняты 8.10.2026 через api.fxtwitter.com (профиль X
   без входа), каждый сверен по имени и описанию — у многих клубов есть чужие тёзки (Wave, BIG, Valiant…), их нет.
   NRG и Gambit — последние найденные (2023-07). Клуб без числа получает ОЦЕНКУ (на экране «≈»), подобранную по этим
   же клубам: с призовыми топ-100 — lg f = 1.963 + 0.607·lg(призовые) (50 клубов), без них — lg f = −4.654 +
   0.1068·уровень клуба (41 клуб). Общие для карьеры и менеджера. */
const CC_ORG_FOL={"FUT Esports":[171728,'2026-10'],"100 Thieves":[1204938,'2026-10'],"7VEN CLUB":[49700,'2026-10'],"9z Team":[310905,'2026-10'],"A2":[22277,'2026-10'],"AIGHT":[34700,'2026-10'],"Absolute First":[6421,'2026-10'],"Agent Gaming":[26400,'2026-10'],"Armour Esports":[2322,'2026-10'],"Become Legends":[92685,'2026-10'],"Bravado Gaming":[14700,'2026-10'],"COOLER Esport":[22615,'2026-10'],"Chiefs Esports Club":[29120,'2026-10'],"Cloud9":[1114040,'2026-10'],"Complexity Gaming":[268957,'2026-10'],"Copenhagen Flames":[22666,'2026-10'],"Crazy Raccoon":[1241481,'2026-10'],"Delta Esports":[414,'2026-10'],"DetonatioN FocusMe":[190098,'2026-10'],"Dignitas":[260599,'2026-10'],"Dynamind":[478,'2026-10'],"Elite Esports":[60951,'2026-10'],"Enterprise Gaming":[23669,'2026-10'],"EvozA eSport":[11300,'2026-10'],"Executors One":[1052,'2026-10'],"F4TALITY":[9932,'2026-10'],"FOKUS":[60760,'2026-10'],"FOKUS CLAN":[60760,'2026-10'],"FURIA Esports":[621200,'2026-10'],"FaZe Clan":[5300000,'2026-10'],"Falcons Esports":[703512,'2026-10'],"Fluxo W7M":[433323,'2026-10'],"Fnatic":[1662760,'2026-10'],"G2 Esports":[1623788,'2026-10'],"Galaxy Racer":[196952,'2026-10'],"Gambit Esports":[138400,'2023-07'],"Gen.G Esports":[223300,'2026-10'],"Gentle Mates":[344900,'2026-10'],"Ghost Gaming":[246051,'2026-10'],"Glory Esports":[1063,'2026-10'],"Godsent":[92805,'2026-10'],"Grizi Esport":[60469,'2026-10'],"Guild Esports":[107603,'2026-10'],"HEROIC":[191282,'2026-10'],"HarD Gaming Pro":[1999,'2026-10'],"Hero Base":[102231,'2026-10'],"JFT Esports":[13445,'2026-10'],"Karmine Corp":[568236,'2026-10'],"LND Esports":[2381,'2026-10'],"LOUD":[1814509,'2026-10'],"LYNX e-sports":[53400,'2026-10'],"Lestream Esport":[32574,'2026-10'],"Leviatán":[176200,'2026-10'],"Loyal Esports":[5410,'2026-10'],"Lyost Esport":[17300,'2026-10'],"M10 eSports":[56466,'2026-10'],"Manchester City Esports":[53874,'2026-10'],"NRG":[868144,'2023-07'],"Natus Vincere":[876741,'2026-10'],"Newbee":[47550,'2026-10'],"Ninjas in Pyjamas":[514855,'2026-10'],"Northern Star Gaming":[5358,'2026-10'],"OBI E-sports":[3526,'2026-10'],"Optimal Ambition":[17835,'2026-10'],"Ovation eSports":[33575,'2026-10'],"Overt":[10383,'2026-10'],"Raised By Kings":[13800,'2026-10'],"Renegades":[57607,'2026-10'],"Ry2 Esports":[2052,'2026-10'],"SCYTES":[4023,'2026-10'],"Sentinels":[1053314,'2026-10'],"ShindeN":[30800,'2026-10'],"Siko Esports":[7072,'2026-10'],"SmokeSolid Gaming":[1591,'2026-10'],"Solary":[333644,'2026-10'],"Spectrum Esc":[2450,'2026-10'],"Supremacy":[38467,'2026-10'],"T1":[369435,'2026-10'],"TSM":[1899008,'2026-10'],"TT9 Esports":[19800,'2026-10'],"Team Atlantic":[12342,'2026-10'],"Team Envy":[517448,'2026-10'],"Team Falcons":[703512,'2026-10'],"Team Heretics":[1059691,'2026-10'],"Team Liquid":[737797,'2026-10'],"Team SAQR":[19300,'2026-10'],"Team Secret":[576689,'2026-10'],"Team TRIBE":[1726,'2026-10'],"Team Vitality":[853862,'2026-10'],"Tempo Storm":[164235,'2026-10'],"Ultimate Warriors":[2764,'2026-10'],"Virtus.pro":[247989,'2026-10'],"XSET":[200049,'2026-10'],"ZETA DIVISION":[640793,'2026-10']};
let CC_ORG_FOL_KEYS=null;
function ccOrgFollowers(name, tier){
  if(!CC_ORG_FOL_KEYS){ CC_ORG_FOL_KEYS=new Map(); Object.keys(CC_ORG_FOL).forEach(k=>CC_ORG_FOL_KEYS.set(ccOrgEarnKey(k), CC_ORG_FOL[k])); }
  const hit=CC_ORG_FOL_KEYS.get(ccOrgEarnKey(name));
  if(hit) return {n:hit[0], est:false, asOf:hit[1]};
  const earn=ccOrgEarn(name);
  const lg=earn ? 1.963+0.607*Math.log10(earn) : -4.654+0.1068*(tier||78);
  return {n:Math.max(500, Math.min(400000, Math.round(Math.pow(10, lg)/100)*100)), est:true, asOf:null};
}
function ccOrgFolText(f){ return (f.est ? '≈' : '')+ccFollowers(f.n); }
/* Медийка клуба для игрока (оценка режима): объявление о подписании — 1.5% аудитории клуба (от 500 до 50 000),
   дальше клуб постит тебя каждый месяц — 0.2% (от 50 до 8 000). Академия — вдвое меньше: её постят реже.
   Было 0.3% и 0.05% — его слово 8.10: «подписчики в месяц нереалистично мало, и когда анонсят игрока, подпишутся же
   сколько-то». Замера нет (сколько людей приходит к игроку с поста клуба, никто не публикует) — это оценка. */
function ccOrgMediaSign(name, tier, academy){
  const f=ccOrgFollowers(name, tier).n;
  return Math.round(Math.max(500, Math.min(50000, f*0.015))*(academy ? 0.5 : 1));
}
function ccOrgMediaMonth(name, tier, academy){
  const f=ccOrgFollowers(name, tier).n;
  return Math.round(Math.max(50, Math.min(8000, f*0.002))*(academy ? 0.5 : 1));
}
/* Ростерный уровень + призовые → уровень клуба. n — сколько людей в снимке.

   Правка 8.10 (его «почему BIG так далеко» → «делай» для карьеры): BIG 2026 (vic0 + Malibuca) выходил ≈85 —
   два человека считались «малым составом», а $31.5k призовых (клуб в Fortnite недавно, последнее место топ-100)
   тянули ядро к 78. Теперь как в менеджере (mgrClubLevel):
   — срез к полу 78 (половина лишнего) — только когда людей МЕНЬШЕ, чем выходит на турнир (дуо 2, трио 3);
   — призовые — история клуба: смешиваются пополам, но только поднимают (Sentinels с одним Bugha — да,
     действующий сильный дуэт без истории — не опускают). */
function ccOrgTier(name, roster, n){
  const usd=ccOrgEarn(name);
  const size=(typeof careerSquadSize==='function' && CAREER && CAREER.career) ? careerSquadSize() : 2;
  let t=roster;
  if(n<size) t-=Math.max(0, roster-CC_ORG_EARN_FLOOR)*0.5;
  if(usd!=null) t=Math.max(t, (t+ccOrgEarnLevel(usd))/2);
  return Math.min(96, Math.round(t));
}
/* Контракты годичные: каждый год игрок по броску продлевает или уходит. Бросок не хранится, с 2-го года до
   текущего пересчитывается тот же посоленный бросок, так что переходы копятся, перезагрузка их не меняет,
   а сейв не растёт. Первый сезон не трогаем, снимок играет как записан. Клубы берём из базовых карточек:
   careerOrgPool выводится из ростера, читать его отсюда значит замкнуть круг. */
const CC_ORG_MOVE=0.25;
let CC_ORG_NAMES={};
function ccOrgNamesOf(reg){
  if(CC_ORG_NAMES[reg]) return CC_ORG_NAMES[reg];
  const seen=new Map();
  PLAYERS.forEach(p=>{
    if((p.region||'')!==reg || !p.org) return;
    const k=clubLogoFile(p.org)||p.org;
    if(!seen.has(k)) seen.set(k, p.org);
  });
  CC_ORG_NAMES[reg]=[...seen.values()];
  return CC_ORG_NAMES[reg];
}
function ccSeasonOrg(card, reg){
  const cr=CAREER && CAREER.career;
  if(!cr || !card || !card.org) return null;
  const s=Math.max(1, cr.season||1);
  if(s<=1) return null;
  const list=ccOrgNamesOf(reg||card.region||ccCareerRegion());
  if(list.length<2) return null;
  let org=card.org;
  for(let y=2; y<=s; y++){
    const r=careerRng(ccHashStr('orgYear|'+ccWorldSeed()+'|'+y+'|'+hKey(card)));
    if(r()>=CC_ORG_MOVE) continue;             // контракт продлён
    const pick=list[Math.floor(r()*list.length)];
    if(pick) org=pick;
  }
  return org;
}
function careerOrgPool(){
  const reg=ccCareerRegion();
  if(CC_ORG_POOL[reg]) return CC_ORG_POOL[reg];
  const by=new Map();
  careerRosterNowEU().forEach(p=>{
    if(!p.org) return;
    const key=clubLogoFile(p.org)||p.org;
    if(!by.has(key)) by.set(key, {names:new Map(), ovrs:[]});
    const g=by.get(key);
    g.names.set(p.org, (g.names.get(p.org)||0)+1);
    g.ovrs.push(p._ovr);
  });
  /* Уровень клуба — то, что он ВЫСТАВЛЯЕТ, а не среднее по списку.

     Средним арифметическим клуб с одним игроком 95 выходил ровно 95 («Aurora
     tier 95 будто точно» — отзыв), а Team HavoK с восемью
     людьми от 94 до 77 — 88, ниже клуба из двух 96-х. Глубина состава
     наказывалась, а одна звезда делала «клуб мирового уровня».

     Теперь: средняя двух сильнейших (дуо, которое клуб реально сажает), минус
     два у клуба с одним игроком (непроверенный), плюс глубина — +1 от четырёх
     человек, +2 от восьми. Потолок 96, как у верха сцены.

     Это ростерная половина. Вторая — призовые клуба по Fortnite, ccOrgTier
     над CC_ORG_EARN: там же сказано, почему двух звёзд мало для уровня Liquid.
     `roster` в строке клуба — ростерная половина без призовых, для проверок. */
  CC_ORG_POOL[reg]=[...by.values()].map(g=>{
    const o=g.ovrs.slice().sort((a,b)=>b-a);
    const top=o.length>=2 ? (o[0]+o[1])/2 : o[0]-2;
    const depth=o.length>=8 ? 2 : o.length>=4 ? 1 : 0;
    const name=[...g.names.entries()].sort((a,b)=>b[1]-a[1])[0][0];
    const roster=Math.min(96, Math.round(top+depth));
    return {name, n:o.length, roster, tier:ccOrgTier(name, roster, o.length), earn:ccOrgEarn(name)};
  });
  // A newcomer only enters if the roster has not already produced it — Falcons
  // and Virtus.pro do have Fortnite players, so they are derived, not typed, and
  // must not appear twice.
  const have=new Set(CC_ORG_POOL[reg].map(o=>clubLogoFile(o.name)||o.name));
  CC_ORG_POOL[reg]=CC_ORG_POOL[reg]
    .concat(CC_ORG_NEW.filter(o=>!have.has(clubLogoFile(o.name)||o.name)))
    .sort((a,b)=>b.tier-a.tier);
  return CC_ORG_POOL[reg];
}

// What a club pays for a season. Invented, and anchored to the one salary-shaped
// number the app already holds: a Division 1 Weekly Final pays its winning duo
// $5,000. A wage should sit under what winning outright is worth, so the scale
// runs from about £1,500 at the bottom club to eight thousand at the very top.
/* A wage is a month's wage, and the division decides its ceiling.

   Set by the user, 14 August: up to $100 a month in Division 3, up to $300 in
   Division 2, and no ceiling in Division 1, where it scales with how big the
   player is rather than with which rung they are on. That last one is the point
   where the ladder stops paying and the audience starts.

   It used to be one number for the whole season, off the club's own standard —
   $1,400 a season for a Division 3 player, which is not a wage anybody in this
   scene is paid at that level. */
// С какого дивизиона клубы вообще смотрят. Одним числом, потому что об этом
// говорит и подсказка в плитке, и правило ниже: разъехаться им нельзя.
const CC_CLUBS_FROM=3;
const CC_WAGE_CAP={5:0, 4:0, 3:100, 2:300};
// Платят — значит не меньше $50 в месяц (его слово 9.10: Дивизион 3 предлагал $37 — «можно 50 я думаю»).
const CC_WAGE_FLOOR=50;
/* ovrOf names whose contract this is. Left out it is the player's own, which
   was every call this had until the roster started quoting what its own people
   are on: a card is not a career — no ovrExact, no log — so asking for somebody
   else's wage would have priced them at the player's rating and the player's
   recent form. */
/* Wage cap is looked up by the rating's band, not the current rung; the rung is only a fallback when there's no
   rating. Otherwise T1 offers a 96 walking Division 3 $100 a month. The numbers don't change: a D3 standard is still
   $100 because it's a rating of ~68. Same rule ccPlayerPay already uses for roster players. */
function ccWageDiv(ovr){
  if(!(ovr>0)) return null;
  for(let d=1; d<=5; d++) if(ovr>=ccBand(d)-2) return d;
  return 5;
}
/* What the club takes off prize money. Bigger clubs take more, from nothing up
   to a fifth of the board, so an offer is a trade: money up front vs money you win.
   The spread is the mode's own, not a real contract. Terms live on the deal, so a
   contract signed before this keeps a zero cut. See careerOrgCut. */
/* Narrowed with the wage, 20 August, and for the same reason.

   Five to twenty per cent against a wage that moved by a third meant a big club
   in Division 1 was a worse deal than a small one for anybody who actually won
   boards: more money up front, fifteen points more off every prize. His call is
   that a better club is simply better, so the cut stays a real term — a club
   takes a share, that is what a contract is — without being able to swallow
   what the club pays for you. */
const CC_ORG_CUT_MIN=0.05, CC_ORG_CUT_MAX=0.10;
function careerOrgCutFor(tier){
  const k=clamp((tier-64)/26, 0, 1);
  return Math.round((CC_ORG_CUT_MIN+k*(CC_ORG_CUT_MAX-CC_ORG_CUT_MIN))*100)/100;
}
// The cut the career is actually on: what was signed, and nothing for a contract
// that predates the term.
/* Своя организация. Деньги уходят трижды:
     основать   CC_CLUB_COST разово. Из текущего клуба уходишь, зато доли с призовых никто не берёт
     содержать  CC_CLUB_KEEP в месяц, пустой клуб чистый убыток
     зарплаты   за каждое подписанное дуо, по их рейтингу
   Приходит доля CC_CLUB_CUT с призовых состава (по доске призовых) и спонсор CC_CLUB_SPONSOR за каждое дуо. Не хватило на зарплату: состав уходит, пишем в ленту. */
const CC_CLUB_COST=1000000;    // основать — его цена, 11.09: «создать миллион долларов нужно». Цель на несколько сезонов: лучшие карьеры берут за год 300-500 тысяч
const CC_CLUB_KEEP=2500;       // содержание в месяц
const CC_CLUB_SEATS=3;         // сколько дуо держит клуб
const CC_CLUB_CUT=0.2;         // доля клуба с призовых состава
const CC_CLUB_SPONSOR=1000;    // спонсор за дуо в месяц
function careerClub(){ const cr=CAREER && CAREER.career; return (cr && cr.club) || null; }
/* ===== УСТРОЙСТВО СВОЕЙ ОРГАНИЗАЦИИ: деньги, направление, штат, отделы ===============
   Его просьба 29.09: «улучшить вариативность в создании орги, управление, нанять менеджеров,
   SMM и т. д., как в реальной организации».

   ДЕНЬГИ ПРИ ОСНОВАНИИ. Свои — миллион, клуб целиком твой. С инвестором — вносишь
   CC_CLUB_FUND.investor.pay, остальное даёт он и забирает долю share со всего дохода клуба
   (спонсоры и доля с призовых), пока долю не выкупишь.
   НАПРАВЛЕНИЕ. Киберспорт — классика (20% с призовых). Контент — спонсоры и охват выше, доля
   с призовых ниже. Академия — своя академия с первого дня и больше мест в ней, спонсор ниже.
   ШТАТ — реальные люди сцены из тех же списков, что личный найм: менеджеры (CC_AGENTS),
   SMM (CC_SMM), тренеры (CC_COACHES). Уровень 1–3 — от их веса: подписчики или цена тренера.
   ОТДЕЛЫ — постройка разово и содержание в месяц, по уровням.
   Все числа здесь — оценка режима: открытых зарплат штата киберспортивных клубов нет. */
const CC_CLUB_FUND={
  self:    {pay:CC_CLUB_COST, share:0},
  investor:{pay:350000, share:0.3, buyback:900000}
};
const CC_CLUB_FOCUS={
  comp:   {cut:0.20, sponsor:1.0, reach:1.0},
  content:{cut:0.10, sponsor:1.6, reach:1.6},
  academy:{cut:0.15, sponsor:0.8, reach:1.0, acadFree:true, acadSeats:5}
};
function ccClubFocus(club){ return CC_CLUB_FOCUS[(club && club.focus)||'comp'] || CC_CLUB_FOCUS.comp; }
function ccClubCut(club){ return ccClubFocus(club).cut; }
function ccClubShare(club){ return (club && club.investor && !club.investor.bought) ? (club.investor.share||0) : 0; }
function ccClubAcadMax(club){ return ccClubFocus(club).acadSeats || CC_CLUB_ACAD_SEATS; }
// Штат.
const CC_CLUB_ROLES=['manager', 'smm', 'coach'];
function ccStaffPool(role){
  if(role==='manager') return (typeof CC_AGENTS!=='undefined' ? CC_AGENTS : []).map(a=>({id:a.at, name:a.name, at:a.at, photo:a.photo, x:a.x||0}));
  if(role==='smm')     return (typeof CC_SMM!=='undefined' ? CC_SMM : []).map(a=>({id:a.at, name:a.name, at:a.at, photo:a.photo, x:a.x||0}));
  return (typeof CC_COACHES!=='undefined' ? CC_COACHES : []).map(c=>({id:c.id, name:c.name, at:c.at, photo:c.photo, cost:c.cost}));
}
function ccStaffTier(p){
  if(!p) return 0;
  if(p.cost) return p.cost>=3500 ? 3 : p.cost>=3000 ? 2 : 1;
  const x=p.x||0; return x>=5000 ? 3 : x>=1500 ? 2 : 1;
}
function ccStaffPay(p){
  if(!p) return 0;
  if(p.cost) return p.cost;
  return Math.round((700+Math.min(3300, (p.x||0)*0.2))/50)*50;
}
function ccClubStaff(role){ const c=careerClub(); return (c && c.staff && c.staff[role]) || null; }
function ccStaffT(role){ const s=ccClubStaff(role); return s ? (s.t||1) : 0; }
function careerClubHire(role, id){
  const club=careerClub(); if(!club || CC_CLUB_ROLES.indexOf(role)<0) return false;
  const p=ccStaffPool(role).find(x=>x.id===id); if(!p) return false;
  club.staff=club.staff||{};
  club.staff[role]={id:p.id, name:p.name, at:p.at||null, photo:p.photo||null, t:ccStaffTier(p), pay:ccStaffPay(p), since:careerToday()};
  careerNews('good', 'ccNewsClubStaff', [club.name, p.name, L()['ccStaff_'+role]], {by:ccOrgBy(club.name)});
  careerSave();
  return true;
}
function careerClubFire(role){
  const club=careerClub(); if(!club || !club.staff || !club.staff[role]) return false;
  delete club.staff[role];
  careerSave();
  return true;
}
// Отделы.
const CC_CLUB_DEPTS={
  sponsor:{build:[60000, 150000, 300000], keep:[800, 1600, 2800]},   // +$500 спонсора за состав на уровень
  scout:  {build:[40000, 100000, 200000], keep:[500, 1000, 1800]},   // академия: талант ближе к тебе, список шире
  house:  {build:[250000], keep:[3500]}                              // геймхаус: буткемп у всех составов
};
function ccDeptLv(k){ const c=careerClub(); return (c && c.dept && c.dept[k]) || 0; }
function ccDeptNextCost(k){ const d=CC_CLUB_DEPTS[k], lv=ccDeptLv(k); return (d && lv<d.build.length) ? d.build[lv] : 0; }
function ccClubDeptKeep(club){
  let s=0; const dp=(club && club.dept)||{};
  Object.keys(CC_CLUB_DEPTS).forEach(k=>{ const lv=dp[k]||0; if(lv) s+=CC_CLUB_DEPTS[k].keep[lv-1]; });
  return s;
}
function careerClubDeptUp(k){
  const club=careerClub(), cr=CAREER && CAREER.career; if(!club || !cr || !CC_CLUB_DEPTS[k]) return false;
  const cost=ccDeptNextCost(k); if(!cost) return false;
  // Платит касса клуба, недостающее — твой баланс.
  const fromClub=Math.min(cost, Math.max(0, club.cash||0)), rest=cost-fromClub;
  if((cr.balance||0)<rest) return false;
  club.cash=(club.cash||0)-fromClub; cr.balance=(cr.balance||0)-rest;
  club.dept=club.dept||{}; club.dept[k]=(club.dept[k]||0)+1;
  careerSave();
  return true;
}
function careerClubBuyback(){
  const club=careerClub(), cr=CAREER && CAREER.career; if(!club || !cr || !ccClubShare(club)) return false;
  const cost=CC_CLUB_FUND.investor.buyback;
  const fromClub=Math.min(cost, Math.max(0, club.cash||0)), rest=cost-fromClub;
  if((cr.balance||0)<rest) return false;
  club.cash=(club.cash||0)-fromClub; cr.balance=(cr.balance||0)-rest;
  club.investor.bought=careerToday();
  careerNews('good', 'ccNewsClubBuyback', [club.name], {by:ccOrgBy(club.name)});
  careerSave();
  return true;
}
// Спонсор за один наёмный состав в месяц — база, отдел, направление, SMM.
function ccClubSponsorPer(club){
  return Math.round((CC_CLUB_SPONSOR+500*ccDeptLv('sponsor'))*ccClubFocus(club).sponsor*(1+0.15*ccStaffT('smm')));
}
function ccClubStaffPay(club){ return CC_CLUB_ROLES.reduce((s, r)=>s+(((club && club.staff && club.staff[r])||{}).pay||0), 0); }
/* Плитка клуба — на вкладке магазина, там же, где тратятся деньги. Пока клуба нет:
   строка с ценой и поле для названия. Есть: касса, состав с зарплатами и что каждое
   дуо принесло, и список свободных пар. */
/* ГЕРБ СВОЕГО КЛУБА — отзыв: «можно сделать лого орги название».

   Две дороги, обе без файлов на сервере. Первая — собрать: четыре формы, восемь
   цветов и до трёх букв; рисуется SVG, весит десяток байт в сейве и одинаково
   выглядит везде, где рисуются гербы настоящих клубов. Вторая — своя картинка:
   она ужимается до 64 точек ещё в браузере и ложится в сейв строкой, поэтому
   сейв не пухнет (CC_CLUB_LOGO_MAX — потолок, сторож сейва его и держит).

   Подставляется в careerCrestImg: свой клуб рисуется своим гербом ВЕЗДЕ —
   в шапке, в таблицах, в ленте и в переписке, — потому что все они зовут её. */
const CC_CLUB_SHAPES=['shield','circle','hex','rhomb'];
const CC_CLUB_HUES=[210, 150, 95, 45, 20, 340, 275, 0];
const CC_CLUB_LOGO_MAX=24000;   // столько знаков картинки терпит сейв
function ccClubTag(club){
  const c=club||careerClub(); if(!c) return '';
  if(c.crest && c.crest.tag) return String(c.crest.tag).slice(0, 3).toUpperCase();
  const w=String(c.name||'').split(/[\s.\-]+/).filter(x=>/[A-Za-z0-9]/.test(x));
  return ((w.length>1 ? w[0].charAt(0)+w[1].charAt(0) : String(c.name||'').slice(0,2))).toUpperCase();
}
function ccClubHue(club){
  const c=club||careerClub(); if(!c) return 210;
  if(c.crest && c.crest.hue!=null) return c.crest.hue;
  return CC_CLUB_HUES[hashStr(String(c.name||''))%CC_CLUB_HUES.length];
}
function ccClubShape(club){
  const c=club||careerClub();
  return (c && c.crest && c.crest.shape) || 'shield';
}
// Контур формы в квадрате 48×48 — один путь на форму.
function ccClubPath(shape){
  if(shape==='circle') return 'M24 2a22 22 0 1 0 .1 0z';
  if(shape==='hex')    return 'M24 2 43 13v22L24 46 5 35V13z';
  if(shape==='rhomb')  return 'M24 2 46 24 24 46 2 24z';
  return 'M24 2 44 8v18c0 11-9 18-20 20C13 44 4 37 4 26V8z';   // щит
}
function careerClubCrest(px, cls, club){
  const c=club||careerClub(); if(!c) return '';
  if(c.logo) return '<img class="'+(cls||'')+'" src="'+c.logo+'" alt="" style="height:'+px+'px;width:'+px+
    'px;object-fit:contain;border-radius:6px;">';
  const hue=ccClubHue(c), tag=esc(ccClubTag(c));
  const fs2=Math.round(px*(tag.length>2 ? 0.34 : 0.42));
  return '<svg class="'+(cls||'')+'" viewBox="0 0 48 48" width="'+px+'" height="'+px+'" aria-hidden="true" '+
    'style="vertical-align:middle;flex:none;">'+
    '<path d="'+ccClubPath(ccClubShape(c))+'" fill="hsl('+hue+' 45% 24%)" stroke="hsl('+hue+' 55% 55%)" stroke-width="2.5"/>'+
    '<text x="24" y="24" text-anchor="middle" dominant-baseline="central" '+
      'style="font:800 '+Math.round(48*(tag.length>2?0.34:0.42))+'px Oswald,system-ui,sans-serif;fill:hsl('+hue+' 70% 84%);letter-spacing:.5px;">'+tag+'</text>'+
    '</svg>';
}
function careerClubCrestSet(what, val){
  const club=careerClub(); if(!club) return false;
  club.crest=club.crest||{};
  if(what==='tag') club.crest.tag=String(val||'').replace(/[^A-Za-z0-9]/g,'').slice(0, 3).toUpperCase();
  else if(what==='hue') club.crest.hue=Number(val)||0;
  else if(what==='shape' && CC_CLUB_SHAPES.indexOf(val)>=0) club.crest.shape=val;
  else return false;
  careerSave();
  return true;
}
/* Своя картинка: ужимается до 64 точек прямо здесь, в сейв уходит строкой.
   Не влезла в потолок — не берём вовсе, сейв важнее картинки. */
/* Готовая картинка — в сейв, если влезла в потолок. Отдельно от загрузки, потому что
   загрузка это браузерная механика (FileReader и декодирование), а потолок — наше правило,
   и проверять его надо без картинки на диске. */
function careerClubLogoSet(url){
  const club=careerClub();
  if(!club || String(url||'').slice(0, 11)!=='data:image/') return false;
  if(String(url).length>CC_CLUB_LOGO_MAX) return false;
  club.logo=String(url); careerSave();
  return true;
}
/* Картинка ужимается до 64 точек в квадрате, с полями, чтобы не тянуть пропорции.
   Отдельной функцией — её зовёт и кнопка выбора файла, и сторож. */
function careerClubLogoFrom(src, done){
  const club=careerClub(); if(!club || !src){ if(done) done(false); return; }
  const img=new Image();
  img.onload=function(){
    let ok=false;
    try{
      const cv=document.createElement('canvas'); cv.width=cv.height=64;
      const x=cv.getContext('2d');
      const k=Math.min(64/(img.width||1), 64/(img.height||1));
      const w=Math.max(1, Math.round(img.width*k)), h=Math.max(1, Math.round(img.height*k));
      x.drawImage(img, Math.round((64-w)/2), Math.round((64-h)/2), w, h);
      ok=careerClubLogoSet(cv.toDataURL('image/png'));
    }catch(e){}
    if(ok && typeof careerRenderHub==='function' && document.getElementById('chBody')) careerRenderHub('shop');
    if(done) done(ok);
  };
  img.onerror=function(){ if(done) done(false); };
  img.src=String(src);
}
function careerClubLogoPick(input){
  if(!careerClub() || !input || !input.files || !input.files[0]) return;
  const rd=new FileReader();
  rd.onload=function(){ careerClubLogoFrom(String(rd.result||'')); };
  rd.readAsDataURL(input.files[0]);
}
function careerClubLogoClear(){ const c=careerClub(); if(!c) return; delete c.logo; careerSave(); careerRenderHub('shop'); }
/* СТЕНА ГЕРБОВ НА ПРЕВЬЮ. Отзыв: «добавь на превью множество лого организаций».
   Плитка до основания объясняла клуб словами и ценой, и ни одного клуба на ней не было.
   Берём те орги, что игрок и так видит в таблицах своего региона — это его сцена, а не
   случайный набор, — и ставим их в ряд приглушёнными: место, куда встанет твой герб. */
function ccClubWall(){
  let names=[];
  try{ names=[...new Set((ccSceneRoster(ccCareerRegion())||[]).map(c=>c && c.org).filter(Boolean))]; }
  catch(e){ names=[]; }
  const imgs=names.slice(0, 20).map(n=>careerCrestImg(n, 24, 'cc-club-wall-i')).filter(Boolean);
  if(imgs.length<4) return '';
  return '<div class="cc-club-wall">'+imgs.join('')+'</div>';
}
function careerClubHTML(){
  const cr=CAREER && CAREER.career; if(!cr) return '';
  const T=L(), club=careerClub();
  /* ЭКРАН СВОЕЙ ОРГАНИЗАЦИИ — плитками хаба (его скрин 41, 29.09: «сделай дизайн в нашем
     стиле, то чет странно выглядит»): вместо длинных строк на всю ширину — карточки. */
  const pips=(n, of)=>'<i class="og-pips">'+Array.from({length:of}, (_, i)=>'<b class="'+(i<n?'on':'')+'"></b>').join('')+'</i>';
  const money=v=>'$'+ccNum(Math.round(v||0));
  if(!club){
    const buyout=careerClubBuyout(), left=(CAREER.org && !CAREER.org.own) ? CAREER.org.name : null;
    const P=CC_CLUB_PICK, price=CC_CLUB_FUND[P.fund].pay+buyout;
    const can=(cr.balance||0)>=price;
    const choice=(k, v, title, sub, extra)=>'<button class="og-choice'+(P[k]===v?' on':'')+'" onclick="careerClubPick(\''+k+'\',\''+v+'\')">'+
      '<b>'+esc(title)+'</b>'+(extra ? '<i>'+extra+'</i>' : '')+'<em>'+esc(sub)+'</em></button>';
    return '<div class="ch-tile cc-club cc-club-pre og og-pre"><h4>'+esc(T.ccClubTitle)+'</h4>'+
      ccClubWall()+
      '<div class="ch-hint">'+esc(T.ccClubHint)+'</div>'+
      '<h5 class="og-sec">'+esc(T.ogFundH)+'</h5>'+
      '<div class="og-choices">'+
        choice('fund', 'self', T.ogFundSelf, T.ogFundSelfSub, money(CC_CLUB_FUND.self.pay))+
        choice('fund', 'investor', T.ogFundInv, T.ogFundInvSub(Math.round(CC_CLUB_FUND.investor.share*100), ccNum(CC_CLUB_FUND.investor.buyback)), money(CC_CLUB_FUND.investor.pay))+
      '</div>'+
      '<h5 class="og-sec">'+esc(T.ogFocusH)+'</h5>'+
      '<div class="og-choices og-choices-3">'+
        choice('focus', 'comp', T.ogFocusComp, T.ogFocusCompSub)+
        choice('focus', 'content', T.ogFocusContent, T.ogFocusContentSub)+
        choice('focus', 'academy', T.ogFocusAcad, T.ogFocusAcadSub)+
      '</div>'+
      '<div class="og-kv"><span>'+esc(T.ccClubKeep)+'</span><b>'+money(CC_CLUB_KEEP)+' '+esc(T.ccClubMonth)+'</b></div>'+
      (left ? '<div class="og-kv"><span>'+esc(T.ccClubQuit(left))+'</span><b>'+money(buyout)+'</b></div>' : '')+
      '<div class="og-found">'+
        '<input id="ccClubName" maxlength="24" placeholder="'+esc(T.ccClubNamePh)+'">'+
        '<button class="og-btn og-btn-go"'+(can?'':' disabled')+' onclick="careerClubNew()">'+esc(T.ogFound)+' · '+money(price)+'</button>'+
      '</div>'+
      (can ? '' : '<div class="ch-hint">'+esc(T.ccClubNoCash)+'</div>')+'</div>';
  }
  const roster=club.roster||[];
  const focus=club.focus||'comp', share=ccClubShare(club);
  // ---- финансы месяца
  const hired=roster.filter(r=>!r.mine).length;
  const sponsor=ccClubSponsorPer(club)*hired, inv=Math.round(sponsor*share);
  const wages=roster.reduce((a,r)=>a+(r.salary||0)+careerClubPerkCost(r), 0);
  const staffPay=ccClubStaffPay(club);
  const keep=CC_CLUB_KEEP+(club.acad ? CC_CLUB_ACAD_KEEP : 0)+ccClubDeptKeep(club);
  const net=sponsor-inv-wages-staffPay-keep;
  const stat=(label, v, cls)=>'<div class="og-stat'+(cls?' '+cls:'')+'"><em>'+esc(label)+'</em><b>'+v+'</b></div>';
  const head='<div class="og-head">'+careerClubCrest(56, 'cc-club-big')+
    '<div class="og-head-t"><b>'+esc(club.name)+'</b>'+
      '<span><i class="og-pill">'+esc(T['ogFocus'+({comp:'Comp', content:'Content', academy:'Acad'})[focus]])+'</i>'+
      (share ? '<i class="og-pill og-pill-inv">'+esc(T.ogInvPill(Math.round(share*100)))+'</i>' : '')+'</span></div>'+
    '<div class="og-cash"><em>'+esc(T.ccClubCash)+'</em><b class="'+((club.cash||0)<0?'neg':'')+'">'+money(club.cash)+'</b>'+
      ((club.cash||0)>0 ? '<button class="og-btn og-btn-sm" onclick="careerClubTake2()">'+esc(T.ccClubOut2)+'</button>' : '')+'</div></div>';
  const fin='<div class="og-stats">'+
    stat(T.ogSponsors, '+'+money(sponsor-inv), 'up')+
    stat(T.ogWages, '−'+money(wages))+
    stat(T.ogStaffPay, '−'+money(staffPay))+
    stat(T.ogUpkeep, '−'+money(keep))+
    stat(T.ogNet, (net>=0?'+':'−')+money(Math.abs(net)), net>=0?'up':'down')+
    stat(T.ogCutRow, Math.round(ccClubCut(club)*100)+'%')+
  '</div>'+
  (share ? '<div class="og-inv"><span>'+esc(T.ogInvLine(Math.round(share*100), ccNum(Math.round(club.inv||0))))+'</span>'+
    '<button class="og-btn og-btn-sm" onclick="careerClubBuybackBtn()">'+esc(T.ogBuyback)+' · '+money(CC_CLUB_FUND.investor.buyback)+'</button></div>' : '');
  // ---- бренд (герб) — свёрнут
  const brand='<details class="og-brand"><summary>'+esc(T.ogBrand)+'</summary><div class="cc-club-crest-box">'+careerClubCrest(64, 'cc-club-big')+
    '<div class="cc-club-pick">'+
      '<div class="cc-club-shapes">'+CC_CLUB_SHAPES.map(sh=>
        '<button class="cc-club-sh'+(ccClubShape(club)===sh?' on':'')+'" onclick="careerClubSet(\'shape\',\''+sh+'\')">'+
        '<svg viewBox="0 0 48 48" width="16" height="16"><path d="'+ccClubPath(sh)+'" fill="currentColor"/></svg></button>').join('')+'</div>'+
      '<div class="cc-club-hues">'+CC_CLUB_HUES.map(h=>
        '<button class="cc-club-hue'+(ccClubHue(club)===h?' on':'')+'" style="background:hsl('+h+' 55% 45%)" onclick="careerClubSet(\'hue\','+h+')"></button>').join('')+'</div>'+
      '<div class="cc-club-tagrow">'+
        '<input id="ccClubTag" maxlength="3" value="'+esc(ccClubTag(club))+'" oninput="careerClubSet(\'tag\', this.value)">'+
        '<label class="og-btn og-btn-sm cc-club-file">'+esc(T.ccClubLogo)+'<input type="file" accept="image/*" hidden onchange="careerClubLogoPick(this)"></label>'+
        (club.logo ? '<button class="og-btn og-btn-sm og-btn-ghost" onclick="careerClubLogoClear()">'+esc(T.ccClubLogoOff)+'</button>' : '')+
      '</div></div></div></details>';
  // ---- штат
  const face=p=>p && p.photo ? '<img class="og-face" src="'+PHOTO_DIR+esc(p.photo)+'" alt="" loading="lazy" onerror="this.remove()">' : '<span class="og-face og-face-none"></span>';
  const staffCard=role=>{
    const s=ccClubStaff(role), open=CC_CLUB_STAFF_OPEN===role;
    const eff=T['ogEff_'+role](s ? s.t : 0);
    let body;
    if(s){
      body='<div class="og-person">'+face(s)+'<div><b>'+esc(s.name)+'</b>'+(s.at ? '<em>@'+esc(s.at)+'</em>' : '')+pips(s.t, 3)+'</div></div>'+
        '<div class="og-kv"><span>'+esc(T.ogPay)+'</span><b>'+money(s.pay)+' '+esc(T.ccClubMonth)+'</b></div>'+
        '<div class="og-eff">'+esc(eff)+'</div>'+
        '<div class="og-acts"><button class="og-btn og-btn-sm" onclick="careerClubStaffOpen(\''+role+'\')">'+esc(T.ogReplace)+'</button>'+
        '<button class="og-btn og-btn-sm og-btn-ghost" onclick="careerClubFireBtn(\''+role+'\')">'+esc(T.ogFire)+'</button></div>';
    } else {
      body='<div class="og-eff og-eff-off">'+esc(T['ogWhy_'+role])+'</div>'+
        '<div class="og-acts"><button class="og-btn og-btn-go og-btn-sm" onclick="careerClubStaffOpen(\''+role+'\')">'+esc(T.ogHire)+'</button></div>';
    }
    const list=open ? '<div class="og-cands">'+ccStaffPool(role)
      .filter(p=>!s || p.id!==s.id)
      .sort((a,b)=>ccStaffTier(b)-ccStaffTier(a) || ccStaffPay(a)-ccStaffPay(b))
      .map(p=>'<div class="og-cand">'+face(p)+'<div class="og-cand-t"><b>'+esc(p.name)+'</b>'+pips(ccStaffTier(p), 3)+
        '<em>'+money(ccStaffPay(p))+' '+esc(T.ccClubMonth)+'</em></div>'+
        '<button class="og-btn og-btn-sm og-btn-go" onclick="careerClubHireBtn(\''+role+'\',\''+esc(p.id)+'\')">'+esc(T.ogHire)+'</button></div>').join('')+'</div>' : '';
    return '<div class="og-card'+(s?' on':'')+'"><h6>'+esc(T['ccStaff_'+role])+'</h6>'+body+list+'</div>';
  };
  const staff='<h5 class="og-sec">'+esc(T.ogStaffH)+'</h5><div class="og-grid">'+CC_CLUB_ROLES.map(staffCard).join('')+'</div>';
  // ---- отделы
  const deptCard=k=>{
    const d=CC_CLUB_DEPTS[k], lv=ccDeptLv(k), max=d.build.length, cost=ccDeptNextCost(k);
    const can=cost && ((club.cash||0)+(cr.balance||0))>=cost;
    return '<div class="og-card'+(lv?' on':'')+'"><h6>'+esc(T['ogDept_'+k])+'</h6>'+pips(lv, max)+
      '<div class="og-eff'+(lv?'':' og-eff-off')+'">'+esc(T['ogDeptEff_'+k](lv))+'</div>'+
      (lv ? '<div class="og-kv"><span>'+esc(T.ogUpkeep)+'</span><b>'+money(d.keep[lv-1])+' '+esc(T.ccClubMonth)+'</b></div>' : '')+
      '<div class="og-acts">'+(cost
        ? '<button class="og-btn og-btn-sm og-btn-go"'+(can?'':' disabled')+' onclick="careerClubDeptBtn(\''+k+'\')">'+esc(lv?T.ogUpgrade:T.ogBuild)+' · '+money(cost)+'</button>'
        : '<i class="og-max">'+esc(T.ogMax)+'</i>')+'</div></div>';
  };
  const depts='<h5 class="og-sec">'+esc(T.ogDeptH)+'</h5><div class="og-grid">'+Object.keys(CC_CLUB_DEPTS).map(deptCard).join('')+'</div>';
  // ---- составы
  const perk=r=>[(r.camp||ccClubCampAll())?T.ccClubCamp:'', (r.coach||ccClubCoachAll())?T.ccClubCoach:''].filter(Boolean);
  const tag=(t, cls)=>'<i class="og-tag'+(cls?' '+cls:'')+'">'+esc(t)+'</i>';
  const rosterCard=r=>'<div class="og-card og-duo">'+
      '<div class="og-duo-top"><b>'+esc((r.who||[]).join(' & '))+'</b><i class="og-ovr">'+r.ovr+'</i></div>'+
      '<div class="og-tags">'+(r.mine?tag(T.ccClubMine, 'mine'):'')+(r.acad?tag(T.ccClubYoung):'')+perk(r).map(p=>tag(p, 'perk')).join('')+
        (r.offer?tag(T.ccClubPoach(r.offer.org), 'buy'):'')+'</div>'+
      '<div class="og-kv"><span>'+esc(T.ogPay)+'</span><b>'+money((r.salary||0)+careerClubPerkCost(r))+' '+esc(T.ccClubMonth)+'</b></div>'+
      (r.won ? '<div class="og-kv"><span>'+esc(T.ccClubWon)+'</span><b>'+money(r.won)+'</b></div>' : '')+
      '<div class="og-acts">'+(r.offer
        ? '<button class="og-btn og-btn-sm og-btn-go" onclick="careerClubLet(\''+esc(r.id)+'\')">'+esc(T.ccClubLet)+' '+money(r.offer.sum)+'</button>'+
          '<button class="og-btn og-btn-sm og-btn-ghost" onclick="careerClubNo(\''+esc(r.id)+'\')">'+esc(T.ccClubStay)+'</button>'
        : (r.acad && careerClubSeats()<CC_CLUB_SEATS ? '<button class="og-btn og-btn-sm" onclick="careerClubUp(\''+esc(r.id)+'\')">'+esc(T.ccClubUp)+'</button>' : '')+
          '<button class="og-btn og-btn-sm og-btn-ghost" onclick="careerClubOut(\''+esc(r.id)+'\')">'+esc(T.ccClubDrop)+'</button>')+'</div></div>';
  // ---- рынок: те же разговоры и галочки, что были (id полей сохранены)
  const talks=careerClubTalks();
  const say=t=>!t ? '' : t.state==='yes' ? '' :
    t.state==='ask' ? tag(T.ccClubSayAsk(ccNum(t.ask))) :
    t.state==='no'  ? tag(T.ccClubSayNo, 'no') : tag(T.ccClubSayWait, 'no');
  const deal=d=>{
    const t=talks[d.id], base=(t && t.ask) ? t.ask : d.salary;
    const perks=CC_CLUB_PERKS[d.id]||{};
    const ck=(k, on, all)=>all ? '' : '<label class="og-toggle'+(on?' on':'')+'"><input type="checkbox" id="ccClub'+k+'_'+esc(d.id)+'"'+(on?' checked':'')+
      ' onchange="careerClubPerk(\''+esc(d.id)+'\')">'+esc(k==='Camp'?T.ccClubCamp:T.ccClubCoach)+'</label>';
    const ask=careerClubAsking(base, perks);
    return '<div class="og-card og-duo">'+
      '<div class="og-duo-top"><b>'+esc(d.who.join(' & '))+'</b><i class="og-ovr">'+d.ovr+'</i></div>'+
      '<div class="og-tags">'+(d.mine?tag(T.ccClubMine, 'mine'):'')+(d.org?tag(T.ccClubBuyout(d.org)+' '+money(d.buyout), 'buy'):'')+say(t)+'</div>'+
      '<div class="og-toggles">'+ck('Camp', !!perks.camp, ccClubCampAll())+ck('Coach', !!perks.coach, ccClubCoachAll())+'</div>'+
      '<div class="og-offer"><span>'+money(ask)+' '+esc(T.ccClubMonth)+'</span>'+
        '<input class="cc-club-sum" id="ccClubSum_'+esc(d.id)+'" value="'+ask+'" inputmode="numeric">'+
        '<button class="og-btn og-btn-sm og-btn-go" onclick="careerClubAsk(\''+esc(d.id)+'\')">'+esc(T.ccClubTalk)+'</button></div></div>';
  };
  const mate=careerClubMateFree();
  const free=(careerClubSeats()<CC_CLUB_SEATS ? careerClubFree(CC_CLUB_Q) : []).map(deal).join('');
  const acadMax=ccClubAcadMax(club);
  return '<div class="ch-tile cc-club og">'+head+fin+brand+staff+depts+
    '<h5 class="og-sec">'+esc(T.ogRosterH)+' <i>'+careerClubSeats()+'/'+CC_CLUB_SEATS+'</i></h5>'+
    (roster.length ? '<div class="og-grid">'+roster.map(rosterCard).join('')+'</div>' : '<div class="ch-empty">'+esc(T.ccClubEmpty)+'</div>')+
    (mate ? '<div class="ch-hint">'+esc(T.ccClubMateHint)+'</div><div class="og-grid">'+deal(mate)+'</div>' : '')+
    (careerClubSeats()<CC_CLUB_SEATS
      ? '<h5 class="og-sec">'+esc(T.ogMarketH)+'</h5>'+
        '<div class="og-search"><input id="ccClubQ" value="'+esc(CC_CLUB_Q)+'" placeholder="'+esc(T.ccClubFind)+'" oninput="careerClubSearch(this.value)"></div>'+
        '<div class="og-grid">'+free+'</div>'
      : '')+
    '<h5 class="og-sec">'+esc(T.ccClubAcad)+(club.acad ? ' <i>'+careerClubAcadSeats()+'/'+acadMax+'</i>' : '')+'</h5>'+
    (club.acad
      ? (careerClubAcadSeats()<acadMax ? '<div class="og-grid">'+careerClubYoung(CC_CLUB_Q).map(deal).join('')+'</div>' : '')
      : '<div class="og-card og-wide"><div class="og-eff">'+esc(T.ccClubAcadHint)+'</div><div class="og-acts">'+
          '<button class="og-btn og-btn-sm og-btn-go" onclick="careerClubAcad()">'+esc(T.ccClubAcadBuild)+' · '+money(CC_CLUB_ACAD)+'</button></div></div>')+
    '<div class="og-close"><div class="ch-hint">'+esc(T.ccClubCloseHint)+'</div>'+
    '<button class="ch-decline" onclick="careerClubCloseAsk()">'+esc(T.ccClubClose)+'</button></div>'+
    '</div>';
}
/* ЗАКРЫТЬ СВОЙ КЛУБ. До 13 сентября дороги назад не было вовсе: основал — и чужие
   клубы молчат навсегда (careerOrgOffers). Состав отпускается, касса возвращается,
   миллион — нет; CAREER.org снимается, и скаутинг снова открыт. Вопрос — на клике,
   действие — отдельно, чтобы харнессы не упирались в модалку. */
function careerClubCloseAsk(){
  const club=careerClub(); if(!club) return;
  ccAsk(L().ccClubCloseAsk(club.name), careerClubClose, {yes:L().ccClubClose, no:L().ccAskNo});
}
function careerClubClose(){
  const cr=CAREER && CAREER.career, club=careerClub(); if(!cr || !club) return false;
  const people=(club.roster||[]).reduce((n,r)=>n+((r.who||[]).length||1), 0);
  if((club.cash||0)>0){ cr.balance=(cr.balance||0)+Math.round(club.cash); }
  careerNews('flat', 'ccNewsClubClosed', [club.name, people], {by:ccOrgBy(club.name)});
  delete cr.club;
  if(CAREER.org && CAREER.org.own) CAREER.org=null;
  CAREER.offers=null; CAREER.scoutOff=false;
  careerSave();
  if(typeof careerRenderHub==='function') careerRenderHub('shop');
  return true;
}
let CC_CLUB_PICK={fund:'self', focus:'comp'};
function careerClubPick(k, v){ CC_CLUB_PICK[k]=v; const el=document.getElementById('ccClubName'); const nm=el ? el.value : ''; careerRenderHub('shop'); const e2=document.getElementById('ccClubName'); if(e2) e2.value=nm; }
function careerClubNew(){
  const el=document.getElementById('ccClubName');
  if(careerClubFound(el && el.value, CC_CLUB_PICK.fund, CC_CLUB_PICK.focus)) careerRenderHub('shop');
}
function careerClubHireBtn(role, id){ if(careerClubHire(role, id)) careerRenderHub('shop'); }
function careerClubFireBtn(role){ if(careerClubFire(role)) careerRenderHub('shop'); }
function careerClubDeptBtn(k){ if(careerClubDeptUp(k)) careerRenderHub('shop'); }
function careerClubBuybackBtn(){ if(careerClubBuyback()) careerRenderHub('shop'); }
let CC_CLUB_STAFF_OPEN=null;
function careerClubStaffOpen(role){ CC_CLUB_STAFF_OPEN=(CC_CLUB_STAFF_OPEN===role) ? null : role; careerRenderHub('shop'); }
function careerClubSet(what, val){ if(careerClubCrestSet(what, val)) careerRenderHub('shop'); }
let CC_CLUB_Q='';
function careerClubSearch(q){
  CC_CLUB_Q=String(q||'');
  const box=document.querySelector('.cc-club');
  careerRenderHub('shop');
  const el=document.getElementById('ccClubQ'); if(el){ el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
}
function careerClubTake2(){ const got=careerClubCashOut((careerClub()||{}).cash); if(got) careerRenderHub('shop'); }
/* Галочки живут до конца разговора, не в сейве: это черновик предложения.
   Подписали — условия переехали в строку состава и дальше живут там. */
let CC_CLUB_PERKS={};
function careerClubPerk(id){
  const camp=document.getElementById('ccClubCamp_'+id), coach=document.getElementById('ccClubCoach_'+id);
  CC_CLUB_PERKS[id]={camp:!!(camp && camp.checked), coach:!!(coach && coach.checked)};
  careerRenderHub('shop');
}
function careerClubAsk(id){
  const el=document.getElementById('ccClubSum_'+id);
  careerClubOffer(id, el ? el.value : 0, CC_CLUB_PERKS[id]);
  careerRenderHub('shop');
}
function careerClubOut(id){ if(careerClubDrop(id)) careerRenderHub('shop'); }
function careerClubLet(id){ if(careerClubRelease(id)) careerRenderHub('shop'); }
function careerClubNo(id){ if(careerClubRefuse(id)) careerRenderHub('shop'); }
function careerClubUp(id){ if(careerClubPromote(id)) careerRenderHub('shop'); }
function careerClubAcad(){ if(careerClubAcadBuild()) careerRenderHub('shop'); }
// Зарплата дуо в месяц — от их среднего рейтинга. Пара 90-х стоит как турнирный вечер.
function careerClubSalary(avg){ return Math.max(200, Math.round(Math.max(0, avg-70)*24)*10); }
function careerClubKey(d){ return (d.cards||[]).map(c=>hKey(c)).sort().join('+'); }
/* ГЕРБ НА ПОДПИСАННЫХ. Клуб заводят ради того, чтобы твой значок стоял рядом с их никами.
   Сцена карьеры — свои копии карточек (ccSceneRoster строит {...p} и кэширует), поэтому
   клуб проставляется на них, а не на общих: мир соседа по гонке от этого не двигается,
   а движок орг не читает вовсе. Кэш пересобирается каждый вечер — метка ставится заново. */
function ccClubOf(handle){
  const club=careerClub(); if(!club || !handle) return null;
  const k=hKey(handle);
  return (club.roster||[]).some(r=>(r.who||[]).some(h=>hKey(h)===k)) ? club.name : null;
}
function ccClubStamp(cards){
  const club=careerClub(); if(!club || !(club.roster||[]).length) return cards;
  (cards||[]).forEach(c=>{ const nm=c && ccClubOf(c.handle); if(nm) c.org=nm; });
  return cards;
}
/* Кого можно подписать: записанные пары сцены без клуба, не сильнее тебя самого —
   чемпион мира к новичку не пойдёт, — и не свои. Шесть верхних, как в поиске напарника. */
/* ПЕРЕГОВОРЫ. Отзыв: «потом можно писать игрокам, кому хочешь предлагать
   условия». Значит не кнопка с ценником, а разговор: кого искать — твоё дело, сколько
   предложить — тоже. Дуо держит в голове свою цену (careerClubSalary от рейтинга) и
   отвечает по ней: дал столько или больше — идут; дал чуть меньше — торгуются и называют
   своё число; дал мало — отказ, и следующий разговор с ними только завтра. */
const CC_CLUB_HAGGLE=0.75;     // ниже этой доли от цены даже не торгуются
const CC_CLUB_BUYIN=3;         // окладов отступных чужому клубу
/* УСЛОВИЯ В КОНТРАКТЕ. Отзыв: «буткемп тренера и тд можно обговаривать».
   Значит разговор не только про сумму: дом на сборы и тренер — это то, ради чего
   соглашаются на меньшие деньги. Клуб платит за них каждый месяц, а дуо за них
   держится — на этом и стоит верность (careerClubLoyal). */
const CC_CLUB_CAMP=1200;       // буткемп, в месяц
const CC_CLUB_COACH=900;       // тренер, в месяц
const CC_CLUB_CAMP_OFF=0.12;   // насколько дешевле просят за буткемп
const CC_CLUB_COACH_OFF=0.10;  // и за тренера
// Геймхаус даёт буткемп всем, главный тренер клуба — тренера всем: отдельно за них не платят.
function ccClubCampAll(){ return ccDeptLv('house')>0; }
function ccClubCoachAll(){ return !!ccClubStaff('coach'); }
function careerClubPerkCost(r){ return (r&&r.camp&&!ccClubCampAll()?CC_CLUB_CAMP:0)+(r&&r.coach&&!ccClubCoachAll()?CC_CLUB_COACH:0); }
// Менеджер команды держит людей: каждое его «очко» уровня — четверть к верности.
function careerClubLoyal(r){ return 1+((r&&r.camp)||ccClubCampAll()?0.5:0)+((r&&r.coach)||ccClubCoachAll()?0.4:0)+0.25*ccStaffT('manager'); }
function careerClubAsking(base, perks){
  const camp=(perks&&perks.camp)||ccClubCampAll(), coach=(perks&&perks.coach)||ccClubCoachAll();
  // Менеджер торгуется: минус 4% с просьбы за уровень.
  const off=(1-(camp?CC_CLUB_CAMP_OFF:0)-(coach?CC_CLUB_COACH_OFF:0))*(1-0.04*ccStaffT('manager'));
  return Math.max(100, Math.round(base*off/10)*10);
}
/* Своё дуо и академия мест в составе не занимают: места — про наёмных.
   Отзыв: «мой напарник в своём» — напарник живёт в клубе отдельной строкой.
   Ему платят как всем, а доля идёт с ЕГО призовых: свои в этой строке не считаются,
   иначе клуб брал бы двадцать процентов из твоего же кармана. */
function careerClubSeats(){ return (careerClub()&&careerClub().roster||[]).filter(r=>!r.mine && !r.acad).length; }
/* АКАДЕМИЯ. Отзыв: «академию тоже можно добавить». Академия — это ставка на
   тех, кого сцена ещё не считает: свободные дуо заметно слабее тебя стоят доли обычной
   зарплаты и мест в составе не занимают. Вырастут сами — сцена год за годом пересчитывает
   рейтинги, — и их можно поднять в состав уже своими. Не вырастут, значит не угадал. */
const CC_CLUB_ACAD=150000;       // построить академию
const CC_CLUB_ACAD_KEEP=600;     // её содержание в месяц
const CC_CLUB_ACAD_SEATS=3;      // сколько дуо в ней живёт
const CC_CLUB_ACAD_PAY=0.4;      // доля обычной зарплаты
const CC_CLUB_ACAD_GAP=10;       // насколько слабее тебя берут в академию
function careerClubAcadSeats(){ return (careerClub()&&careerClub().roster||[]).filter(r=>r.acad).length; }
function careerClubAcadBuild(){
  const club=careerClub(), cr=CAREER && CAREER.career;
  if(!club || !cr || club.acad) return false;
  // Платит клуб, добирая из кармана: стройка в долг не идёт, как и выкуп.
  if((club.cash||0)+Math.max(0, cr.balance||0)<CC_CLUB_ACAD) return false;
  if((club.cash||0)<CC_CLUB_ACAD){
    const fromMe=CC_CLUB_ACAD-(club.cash||0);
    cr.balance=(cr.balance||0)-fromMe; club.cash=(club.cash||0)+fromMe;
  }
  club.cash-=CC_CLUB_ACAD; club.paid=(club.paid||0)+CC_CLUB_ACAD; club.acad=true;
  careerNews('good', 'ccNewsClubAcad', [club.name], {by:ccOrgBy(club.name)});
  careerSave();
  return true;
}
function careerClubYoung(q){
  const club=careerClub(); if(!club || !club.acad) return [];
  let duos=[]; try{ duos=(careerPools()||{}).duos||[]; }catch(e){ return []; }
  const mine=new Set((careerMates()||[]).concat([careerCard()]).filter(Boolean).map(hKey));
  const have=new Set((club.roster||[]).map(r=>r.id));
  const me=(CAREER.player.ovrExact!=null?CAREER.player.ovrExact:CAREER.player.ovr)||80;
  return duos.filter(d=>{
      const cs=d.cards||[]; if(cs.length!==2) return false;
      if(cs.some(c=>!c || !c.handle || mine.has(hKey(c)) || c.org)) return false;   // из чужого клуба молодёжь не забирают
      const k=careerClubKey(d); if(have.has(k) || have.has('acad:'+k)) return false;
      // Скаутинг находит талант ближе к тебе по уровню: минус 3 к разрыву за уровень отдела.
      return d.avg<=me-Math.max(2, CC_CLUB_ACAD_GAP-3*ccDeptLv('scout'));
    })
    .filter(d=>{ const t=String(q||'').trim().toLowerCase();
      return !t || d.cards.some(c=>String(c.handle||'').toLowerCase().indexOf(t)>=0); })
    .sort((a,b)=>b.avg-a.avg).slice(0, 8+4*ccDeptLv('scout'))
    .map(d=>({id:'acad:'+careerClubKey(d), who:d.cards.map(c=>c.handle), ovr:Math.round(d.avg),
              salary:Math.max(100, Math.round(careerClubSalary(d.avg)*CC_CLUB_ACAD_PAY/10)*10),
              org:null, buyout:0, acad:true}));
}
/* Поднять из академии — в свободное место состава и на взрослую зарплату.
   Сколько он стоит теперь, считает сцена: рейтинг у неё за год мог и вырасти. */
function careerClubPromote(id){
  const club=careerClub(); if(!club) return false;
  const r=(club.roster||[]).find(x=>x.id===id && x.acad); if(!r) return false;
  if(careerClubSeats()>=CC_CLUB_SEATS) return false;
  let now=r.ovr;
  const key=id.slice(5);   // 'acad:' — это дверь, а не человек
  try{ const d=((careerPools()||{}).duos||[]).find(x=>careerClubKey(x)===key); if(d) now=Math.round(d.avg); }catch(e){}
  r.acad=false; r.ovr=now; r.salary=careerClubSalary(now);
  careerNews('good', 'ccNewsClubUp', [club.name, (r.who||[]).join(' & ')], {by:ccOrgBy(club.name)});
  careerSave();
  return true;
}
function careerClubMateFree(){
  const club=careerClub(); if(!club) return null;
  const mates=(careerMates()||[]).filter(m=>m && m.handle); if(!mates.length) return null;
  const id='mine:'+mates.map(hKey).sort().join('+');
  if((club.roster||[]).some(r=>r.id===id)) return null;
  const ovr=Math.round(mates.reduce((a,m)=>a+(m._ovr||m.ovr||80), 0)/mates.length);
  const salary=careerClubSalary(ovr);
  const org=(mates.find(m=>m && m.org)||{}).org || null;
  return {id:id, who:mates.map(m=>m.handle), ovr:ovr, salary:salary, org:org,
          buyout:org ? salary*CC_CLUB_BUYIN : 0, mine:true};
}
function ccClubDuo(id){
  const m=careerClubMateFree();
  if(m && m.id===id) return m;
  if(String(id).indexOf('acad:')===0) return careerClubYoung('').find(d=>d.id===id) || null;
  return careerClubFree('', true).find(d=>d.id===id) || null;
}
/* ЗА ТВОИМИ ПРИХОДЯТ. Правило: «отпускать за отступные если хочет игрок».
   Раз ты выкупаешь чужих, чужие выкупают твоих: раз в месяц за кем-то приходят и
   называют сумму. Отпустил — деньги в кассе; отказал — это твоё право, но второй
   отказ подряд человек не прощает и уходит сам. Условия контракта (буткемп, тренер)
   тут и работают: за них держатся, и приходят за такими реже.
   Бросок свой, посеянный: общий счётчик трогать нельзя, по нему сверяется гонка. */
const CC_CLUB_POACH=0.3;         // с какой вероятностью за дуо приходят в месяц
function ccClubRivalOrg(rnd){
  let names=[];
  try{ names=[...new Set((((careerPools()||{}).duos)||[]).flatMap(d=>(d.cards||[]).map(c=>c && c.org).filter(Boolean)))]; }catch(e){}
  const club=careerClub();
  names=names.filter(n=>!club || n!==club.name);
  return names.length ? names[Math.floor(rnd()*names.length)%names.length] : null;
}
function careerClubPoach(){
  const club=careerClub(); if(!club) return 0;
  const day=careerToday(); let n=0;
  (club.roster||[]).filter(r=>!r.mine && !r.offer).forEach((r, i)=>{
    const rnd=careerRng(ccHashStr('poach|'+club.name+'|'+r.id+'|'+day+'|'+i));
    if(rnd()>=CC_CLUB_POACH/careerClubLoyal(r)) return;
    const org=ccClubRivalOrg(rnd); if(!org) return;
    // Менеджер выбивает за проданных больше: +10% за уровень.
    r.offer={org:org, sum:Math.round((r.salary||0)*CC_CLUB_BUYIN*(1+rnd()*0.8)*(1+0.1*ccStaffT('manager'))/10)*10, day:day};
    careerNews('flat', 'ccNewsClubWant', [org, (r.who||[]).join(' & ')], {by:ccOrgBy(org)});
    n++;
  });
  if(n) careerSave();
  return n;
}
function careerClubRelease(id){
  const club=careerClub(); if(!club) return false;
  const r=(club.roster||[]).find(x=>x.id===id); if(!r || !r.offer) return false;
  const sum=r.offer.sum||0, org=r.offer.org;
  club.cash=(club.cash||0)+sum; club.got=(club.got||0)+sum;
  careerNews('flat', 'ccNewsClubSold', [club.name, (r.who||[]).join(' & '), org], {by:ccOrgBy(club.name)});
  careerClubDrop(id);
  return true;
}
function careerClubRefuse(id){
  const club=careerClub(); if(!club) return false;
  const r=(club.roster||[]).find(x=>x.id===id); if(!r || !r.offer) return false;
  delete r.offer; r.sour=(r.sour||0)+1;
  careerSave();
  return true;
}
function careerClubTalks(){ const c=careerClub(); if(!c) return {}; if(!c.talks) c.talks={}; return c.talks; }
function careerClubOffer(id, sum, perks){
  const club=careerClub(); if(!club) return null;
  const duo=ccClubDuo(id); if(!duo) return null;
  if(duo.acad && (!club.acad || careerClubAcadSeats()>=ccClubAcadMax(club))) return null;
  if(!duo.mine && !duo.acad && careerClubSeats()>=CC_CLUB_SEATS) return null;
  const money=Math.max(0, Math.round(Number(sum)||0));
  const talks=careerClubTalks(), was=talks[id];
  // Отказ держится до следующего дня: нельзя давить одним и тем же вечером.
  if(was && was.state==='no' && was.day===careerToday()) return {state:'wait', ask:was.ask};
  const base=(was && was.ask) ? was.ask : duo.salary;
  // Условия сбивают цену: за дом и тренера идут дешевле.
  const ask=careerClubAsking(base, perks);
  if(money>=ask){
    talks[id]={state:'yes', ask:base, offer:money, day:careerToday()};
    careerClubSign(id, money, perks);
    return {state:'yes', ask:ask, offer:money};
  }
  if(money>=Math.round(ask*CC_CLUB_HAGGLE)){
    /* Торг: называют своё число, и оно ниже прежнего — разговор двигается.
       Ниже настоящей цены дуо не опускается. */
    const want=Math.max(duo.salary, Math.round((base+money)/2/10)*10);
    talks[id]={state:'ask', ask:want, offer:money, day:careerToday()};
    careerSave();
    return {state:'ask', ask:want, offer:money};
  }
  talks[id]={state:'no', ask:base, offer:money, day:careerToday()};
  careerSave();
  return {state:'no', ask:ask, offer:money};
}
function careerClubFree(q, all){
  const club=careerClub(); if(!club) return [];
  let duos=[]; try{ duos=(careerPools()||{}).duos||[]; }catch(e){ return []; }
  const mine=new Set((careerMates()||[]).concat([careerCard()]).filter(Boolean).map(hKey));
  const have=new Set((club.roster||[]).map(r=>r.id));
  const me=(CAREER.player.ovrExact!=null?CAREER.player.ovrExact:CAREER.player.ovr)||80;
  return duos.filter(d=>{
      const cs=d.cards||[]; if(cs.length!==2) return false;
      if(cs.some(c=>!c || !c.handle || mine.has(hKey(c)))) return false;
      // Свой же состав вторым заходом не показываем — ни взрослый, ни академический.
      const k=careerClubKey(d); if(have.has(k) || have.has('acad:'+k)) return false;
      return d.avg<=me+2;
    })
    .filter(d=>{
      const s=String(q||'').trim().toLowerCase();
      return !s || d.cards.some(c=>String(c.handle||'').toLowerCase().indexOf(s)>=0);
    })
    .sort((a,b)=>b.avg-a.avg).slice(0, all ? 200 : 10)
    .map(d=>{
      /* ПОД КОНТРАКТОМ — ЧЕРЕЗ ВЫКУП. Правило: «они разрывают контракт или мы
         выкупаем или предлагаем свободному агенту». Свободный стоит только зарплаты; у
         чужого клуба человека выкупают — три оклада отступных, и платит их клуб. */
      const salary=careerClubSalary(d.avg);
      const org=(d.cards.find(c=>c && c.org)||{}).org || null;
      return {id:careerClubKey(d), who:d.cards.map(c=>c.handle), ovr:Math.round(d.avg),
              salary:salary, org:org, buyout:org ? salary*CC_CLUB_BUYIN : 0};
    });
}
/* РАСТОРЖЕНИЕ КОНТРАКТА. Правило: «если создаёшь, то должен расторгнуть с клубом
   контракт, если есть орга». Уйти посреди сезона нельзя бесплатно нигде: клуб отпускает за
   неустойку в два месячных оклада. Своя организация при этом не считается — из себя уходить
   некуда. */
const CC_CLUB_BUYOUT=2;        // месяцев оклада за расторжение
function careerClubBuyout(){
  const org=CAREER && CAREER.org;
  if(!org || org.own) return 0;
  return Math.round((org.salary||0)*CC_CLUB_BUYOUT);
}
function careerClubFound(name, fund, focus){
  const cr=CAREER && CAREER.career; if(!cr || cr.club) return false;
  const nm=String(name||'').replace(/<[^>]*>/g,'').trim().slice(0, 24);
  if(!nm) return false;
  const F=CC_CLUB_FUND[fund] ? fund : 'self', FO=CC_CLUB_FOCUS[focus] ? focus : 'comp';
  const price=CC_CLUB_FUND[F].pay;
  const buyout=careerClubBuyout(), left=(CAREER.org && !CAREER.org.own) ? CAREER.org.name : null;
  if((cr.balance||0)<price+buyout) return false;
  cr.balance-=price+buyout;
  if(left){
    // Контракт расторгнут — как при любом уходе: клуб объявляет, ты прощаешься.
    cr.wages=(cr.wages||0)-buyout;
    careerNews('flat', 'ccNewsLeftOrg', [left], {by:ccOrgBy(left)});
    careerNews('flat', 'ccPostBye', [ccHandle(left)]);
    try{ careerEvent('tlOrgLeft', [left]); }catch(e){}
  }
  cr.club={name:nm, since:careerToday(), cash:0, roster:[], paid:0, got:0, focus:FO, staff:{}, dept:{},
           investor: CC_CLUB_FUND[F].share ? {share:CC_CLUB_FUND[F].share, since:careerToday()} : null,
           acad: !!CC_CLUB_FOCUS[FO].acadFree};
  /* Свой клуб — это и есть твой клуб: CAREER.org читают герб, таблицы и лента,
     поэтому он ставится туда же, только без зарплаты и без доли. */
  CAREER.org={name:nm, salary:0, cut:0, tier:70, own:true, since:cr.season, paid:0};
  cr.orgs=cr.orgs||[]; if(cr.orgs.indexOf(nm)<0) cr.orgs.push(nm);
  CAREER.offers=[];
  careerNews('good', 'ccNewsClubFound', [nm], {by:ccOrgBy(nm)});
  careerSave();
  return true;
}
function careerClubSign(id, salary, perks){
  const club=careerClub(); if(!club) return false;
  const free=ccClubDuo(id); if(!free) return false;
  if(free.acad && (!club.acad || careerClubAcadSeats()>=ccClubAcadMax(club))) return false;
  if(!free.mine && !free.acad && careerClubSeats()>=CC_CLUB_SEATS) return false;
  // Зарплата — та, о которой договорились; без разговора берётся их цена.
  const pay=Math.max(1, Math.round(Number(salary)||free.salary));
  /* Отступные чужому клубу — сразу и из кассы. Нечем платить — сделки нет:
     выкуп в долг не берут. */
  const fee=free.buyout||0;
  if(fee){
    const have=(club.cash||0)+Math.max(0, CAREER.career.balance||0);
    if(have<fee+pay) return false;
    if((club.cash||0)<fee){
      const fromMe=fee-(club.cash||0);
      CAREER.career.balance=(CAREER.career.balance||0)-fromMe;
      club.cash=(club.cash||0)+fromMe;
    }
    club.cash-=fee; club.paid=(club.paid||0)+fee;
    careerNews('flat', 'ccNewsClubBuy', [club.name, free.who.join(' & '), free.org||''], {by:ccOrgBy(club.name)});
  }
  // Подпись стоит месяца зарплаты вперёд — из кассы клуба, а не из своего кармана.
  club.roster.push({id:free.id, who:free.who, ovr:free.ovr, salary:pay,
                    camp:!!(perks&&perks.camp), coach:!!(perks&&perks.coach), mine:!!free.mine,
                    acad:!!free.acad, since:careerToday(), won:0, seen:{}});
  club.cash=(club.cash||0)-pay;
  club.paid=(club.paid||0)+pay;
  careerNews('good', 'ccNewsClubSign', [club.name, free.who.join(' & ')], {by:ccOrgBy(club.name)});
  careerSave();
  return true;
}
/* КАССА — В КАРМАН. Отзыв: «пусть копит клуб потом можно вывести себе». Клуб
   копит сам по себе, но деньги в нём твои: взять их можно в любой момент, и об этом
   остаётся строка — вывел кассу перед зарплатой, значит состав уйдёт. */
function careerClubCashOut(sum){
  const club=careerClub(), cr=CAREER && CAREER.career;
  if(!club || !cr) return 0;
  const take=Math.min(Math.max(0, Math.round(Number(sum)||0)), Math.max(0, Math.round(club.cash||0)));
  if(!take) return 0;
  club.cash-=take;
  cr.balance=(cr.balance||0)+take;
  cr.side=(cr.side||0)+take;
  careerSave();
  return take;
}
function careerClubDrop(id){
  const club=careerClub(); if(!club) return false;
  const i=(club.roster||[]).findIndex(r=>r.id===id); if(i<0) return false;
  const r=club.roster.splice(i, 1)[0];
  careerNews('bad', 'ccNewsClubLeft', [club.name, (r.who||[]).join(' & ')], {by:ccOrgBy(club.name)});
  careerSave();
  return true;
}
/* Доля с призовых состава. Ничего заново не считается: доска призовых ведётся по
   людям и уже знает, сколько каждый взял за год. Клуб запоминает, сколько он
   видел, и берёт свою долю с прибавки. Зовётся в конце каждого вечера. */
function careerClubTake(){
  const club=careerClub(); if(!club || !(club.roster||[]).length) return 0;
  let got=0;
  const rows=careerMoney().rows||{};
  club.roster.forEach(r=>{
    r.seen=r.seen||{};
    (r.who||[]).forEach(h=>{
      // Свои призовые клубу не режут: это тот же карман.
      const now=Math.round((rows[h]||{}).usd||0);
      const was=r.seen[h];
      if(was==null){ r.seen[h]=now; return; }   // первый вечер после подписи — точка отсчёта
      if(now>was){ const cut=Math.round((now-was)*ccClubCut(club)*(1-ccClubShare(club))); got+=cut; r.won=(r.won||0)+(now-was); }
      r.seen[h]=now;
    });
  });
  if(got){ club.cash=(club.cash||0)+got; club.got=(club.got||0)+got; }
  return got;
}
/* Месяц клуба: спонсор платит за состав, содержание и зарплаты уходят. Касса в
   минусе — добираем из своего кармана; не хватило и там — уходит самое дорогое
   дуо, и об этом пишут. */
function careerClubMonth(months){
  const club=careerClub(); if(!club || !(months>0)) return 0;
  const cr=CAREER.career;
  /* Напарник в клубе — пока он напарник. Разошлись — контракт с ним кончился сам,
     держать в составе человека, с которым больше не играешь, клуб не станет. */
  (club.roster||[]).filter(r=>r.mine).forEach(r=>{
    const now=new Set((careerMates()||[]).filter(Boolean).map(hKey));
    if(!(r.who||[]).every(h=>now.has(hKey(h)))) careerClubDrop(r.id);
  });
  for(let m=0; m<months; m++){
    const roster=club.roster||[];
    // Спонсор платит за наёмных: своё дуо спонсору не состав, а ты сам.
    // Спонсор (база + отдел + направление + SMM), доля инвестора; штат и отделы — расходы.
    const sponsorAll=ccClubSponsorPer(club)*roster.filter(r=>!r.mine).length;
    const inv=Math.round(sponsorAll*ccClubShare(club)), sponsor=sponsorAll-inv;
    const wages=roster.reduce((a,r)=>a+(r.salary||0)+careerClubPerkCost(r), 0)+ccClubStaffPay(club);
    const keep=CC_CLUB_KEEP+(club.acad ? CC_CLUB_ACAD_KEEP : 0)+ccClubDeptKeep(club);
    club.cash=(club.cash||0)+sponsor-keep-wages;
    club.paid=(club.paid||0)+keep+wages;
    club.got=(club.got||0)+sponsor;
    club.inv=(club.inv||0)+inv;
    // SMM клуба растит и твою аудиторию: клуб постит тебя.
    const smm=ccStaffT('smm'); if(smm) careerReachAdd(Math.round(150*smm*ccClubFocus(club).reach), true);
    if(club.cash<0){
      const need=-club.cash;
      const have=Math.min(need, Math.max(0, cr.balance||0));
      cr.balance=(cr.balance||0)-have; club.cash+=have;
      if(club.cash<0 && roster.length){
        const worst=roster.slice().sort((a,b)=>(b.salary||0)-(a.salary||0))[0];
        careerClubDrop(worst.id);
        careerNews('bad', 'ccNewsClubUnpaid', [club.name, (worst.who||[]).join(' & ')], {by:ccOrgBy(club.name)});
        club.cash=0;
      }
    }
  }
  /* Второго отказа подряд человек не прощает: он хотел уйти, ему не дали.
     Условия контракта это гасят — с буткемпом и тренером прощают. */
  (club.roster||[]).filter(r=>(r.sour||0)>=2 && careerClubLoyal(r)<1.4).forEach(r=>{
    careerNews('bad', 'ccNewsClubSour', [club.name, (r.who||[]).join(' & ')], {by:ccOrgBy(club.name)});
    careerClubDrop(r.id);
  });
  careerClubPoach();
  careerSave();
  return 1;
}
function careerOrgCut(){
  const org=CAREER && CAREER.org;
  return (org && org.cut!=null) ? org.cut : 0;
}
/* Where a club sits inside the band the scene pays.

   Stable per club and per week, which is the clock the offers themselves are
   drawn on: the three clubs writing this week are the same three however many
   times the screen redraws, so the money they name has to be too. A contract
   already signed or already on the table carries the number it was written
   with — this only prices an offer as it is made. */
const CC_ORG_WAGE_SPREAD=0.12;
function ccOrgWageNoise(name){
  const cr=CAREER && CAREER.career;
  if(!name || !cr) return 1;
  const rnd=careerRng(ccHashStr('wage|'+name+'|'+(cr.season||1)+'|'+careerWeek()));
  return 1 + (rnd()*2-1)*CC_ORG_WAGE_SPREAD;
}
function careerOrgSalary(tier, div, reach, ovrOf){
  const rated=(ovrOf!=null) ? ovrOf
            : (CAREER && CAREER.player
                ? (CAREER.player.ovrExact!=null ? CAREER.player.ovrExact : CAREER.player.ovr)
                : null);
  const cap=CC_WAGE_CAP[ccWageDiv(rated) || div];
  if(cap!=null){
    if(!cap) return 0;
    // Within the division's band, a better club pays nearer the top of it.
    const share=clamp((tier-64)/26, 0.35, 1);
    return Math.max(CC_WAGE_FLOOR, Math.round(cap*share/10)*10);
  }
  /* Division 1 pays $500 to $15,000 a month, and what moves it is how well you
     play — the user's call, 14 August.

     Rating carries it, because in this build a rating is already made of
     results: careerApplyGrowth moves it by how far a run beat or missed what the
     field expected, so it is the measured summary of how good somebody is. The
     Division 1 band runs about 75 to 96, and the money runs steeply across it —
     the difference between the bottom of the division and the top of the world
     is not a straight line, and neither is what clubs pay for it.

     Recent form nudges it either way. A player who has been finishing near the
     front is worth more this month than the same rating that has been finishing
     mid-table, which is the part a rating alone smooths over. */
  const mine=(ovrOf==null);
  const ovr=mine ? (CAREER.player.ovrExact!=null ? CAREER.player.ovrExact : CAREER.player.ovr)
                 : ovrOf;
  const across=clamp((ovr-75)/21, 0, 1);
  // Scaled so that the base times the best club lands on the top of the range
  // rather than under it — see the club factor below.
  const base=500+Math.round(7800*Math.pow(across, 2.1));
  // The last four runs, as a share of the field beaten. Half is average — and
  // half is what somebody whose season this mode never simulates is worth,
  // because for them the honest answer is that there is no information.
  const log=mine ? (CAREER.career.log||[]).slice(-4) : [];
  const beat=log.length
    ? log.reduce((t,r)=>t+(r.of>1 ? 1-(r.place-1)/(r.of-1) : 0.5), 0)/log.length
    : 0.5;
  const form=clamp(0.7+beat*0.6, 0.7, 1.3);
  /* And what the club is decides most of what the offer is.

     It used to be a nudge at the edges — 0.85 to 1.15, so the biggest club in
     Europe paid a third more than the smallest one that would sign you, and the
     whole of the offer was really the player's own rating. His call, 20 August,
     after his tester read the market as fixed: a better club is simply a better
     contract, and it should be the loudest thing on the table.

     Three to one across the pool, which runs tier 50 to 96. The base is scaled
     back to match, so the top of the range is where it always was — his own
     number from 14 August, five hundred to fifteen thousand a month — rather
     than everybody good being pinned against the ceiling, which is the same
     mistake in the other direction: a cap nobody can see under is a club that
     stops mattering again at the top. */
  const club=0.6+clamp((tier-60)/36, 0, 1)*1.2;
  return clamp(Math.round(base*form*club/10)*10, 500, 15000);
}

// How close you have to be before a club looks at you. Six points under their
// own standard is the reach: enough that a club one rung above is a real target,
// not so much that the top of Europe signs a Division 4 player.
const CAREER_ORG_REACH=6;
/* Transfer windows. Offers used to be rebuilt after every cup, so turning one down cost nothing.
   Two windows off the calendar: December-January before the season, and the month after each Major, when the scene actually moves.
   Outside them nothing new arrives and existing offers live out their fortnight. The hub shows which it is, so the player knows it's the month and not them. */
const CC_WINDOWS=[
  ['2025-12-01','2026-01-31'],   // the year is built
  ['2026-04-25','2026-05-25'],   // after Major 1
  ['2026-08-01','2026-08-31']    // after Major 2 and Paris
];
/* His call, 17 August: leave it open, clubs write all year, in Fortnite that
   is normal. And it is - this scene has no registration deadline and no window
   to respect. A duo splits in March and both halves are signed by April; a
   Division 2 player wins one open and hears from three clubs the same week. The
   windows above were a football habit borrowed onto a game that does not have
   them, and what they actually did was leave a career unable to move for four
   months at a time for no reason it could see.

   The dates stay in the file because the shape they describe is still true -
   most of this scene moves after a Major - and that is worth something to read
   later. Nothing gates on them. */
function careerWindowNow(iso){ return true; }
// When the next one opens, for the tile to say so.
function careerWindowNext(iso){
  const d=iso||careerToday();
  const w=CC_WINDOWS.find(x=>x[0]>d);
  return w ? w[0] : null;
}
/* Доля предложений, которые берут весь состав, а не одного игрока.
   Четверть — на глаз это «иногда», а по смыслу столько, чтобы такой контракт
   был событием, а не нормой: в окне их два-три, и один из них парный. */
const CC_ORG_DUO_SHARE=0.25;
/* КЛУБ ЗОВЁТ ЗА РЕЗУЛЬТАТ, А НЕ ЗА ЦИФРУ НА КАРТОЧКЕ.

   Его слово 2.10: «как-то в оргу слишком быстро добавить можно». Так и было: ворота
   спрашивали только рейтинг, и новичок с 65+ получал три контракта после первого же
   капа, где он мог занять сотое место. Плитка свободного агента при этом давно
   обещает «предложение приходит после результата» — код этого не делал.

   Результат — то, о чём сцена говорит: топ-10 или верхние 5% поля. Нужно два таких
   вечера за карьеру. Кто уже играл за клуб (карточка настоящего игрока, прошлый
   контракт — cr.orgs), сцене известен и ждать не должен. */
const CC_ORG_PROOF=2;
function ccOrgResult(r){
  return !!(r && r.place>0 && (r.place<=10 || (r.of>0 && r.place<=r.of*0.05)));
}
function ccOrgProven(){
  const cr=CAREER && CAREER.career;
  if(!cr) return false;
  if((cr.orgs||[]).length) return true;
  return (cr.log||[]).filter(ccOrgResult).length>=CC_ORG_PROOF;
}
function careerOrgOffers(){
  // Свой клуб закрывает рынок: играть под своим флагом и получать чужую зарплату нельзя.
  if(typeof careerClub==='function' && careerClub()) return [];
  const pl=CAREER.player, cr=CAREER.career;
  // Nobody signs anybody below Division 3. The tile has said so for weeks —
  // "clubs start looking at about 65 rating, Division 3 and up" — but the code
  // only ever checked the rating, so a Division 5 player who had trained their
  // way to 82 was offered contracts worth nothing a month.
  /* Read at the rating, for the same reason the wage is. The gate used to be the
     rung, which was itself a fix: checking the rating alone had offered a
     Division 5 player who trained to 82 a contract worth nothing a month. The
     nothing was the bug - now that the wage follows the rating, the offer can
     too, and "clubs start looking at about 65 rating" is finally what the code
     does rather than what the tile says. */
  const wageDiv=ccWageDiv(pl.ovrExact!=null ? pl.ovrExact : pl.ovr) || cr.division;
  if(CC_WAGE_CAP.hasOwnProperty(wageDiv) && !CC_WAGE_CAP[wageDiv]) return [];
  /* And a player who said "stop looking" is not looked for.

     A viewer's ask, 20 August, relayed with the screenshot: signed with a club,
     every window still filled the inbox with offers he was never going to take,
     and each one arrived as an unread mark he had to go and clear. So the
     looking is a switch. Off, no new offer is generated — what is already on
     the table keeps its own deadline, exactly like the closed window below —
     and the signed club's own contract talk is untouched, because renewals and
     the goal do not come through this. On is the default: a career that never
     touches the switch behaves as it always has. */
  if(ccScoutOff()) return CAREER.offers||[];
  // And clubs are not signing in March. What is already on the table stays
  // there until its own deadline; this only stops new ones arriving.
  if(!careerWindowNow()) return CAREER.offers||[];
  if(!ccOrgProven()) return CAREER.offers||[];
  const rnd=careerRng(careerSeed(cr,'org'));
  // Somebody whose job it is gets you looked at by clubs that would not have
  // looked. See careerAgent.
  // Плюс то, что менеджер выходил по просьбе игрока — см. careerPitchOn.
  const reach=CAREER_ORG_REACH+careerAgentTerms().reach+careerPitchReach();
  /* Reach was a wall, and his point, 18 August, is that it should not be one:
     Team Spirit can take an 85, it just pays an 85 what an 85 is worth.

     The wall made the wage rule unreachable. A player at 85 topped out at BIG on
     91 — the thirteen clubs above that were not offering worse terms, they were
     not offering at all, so "the big club pays you less" never happened because
     the big club never wrote.

     It is not a straight opening either, or every career would collect the same
     five famous names in its first month and they would stop meaning anything.
     Inside the reach a club looks as it always did. Past it the chance falls
     away with the distance and runs out about seven above, so hearing from a
     club far over your head is a thing that happens rather than a thing you
     plan on — and what arrives is a real first-team offer at your own wage. */
  const mine=(CAREER.org && CAREER.org.name) || null;
  const bound=CAREER.org && !CAREER.org.own && ccOrgSeasonsLeft(CAREER.org)>0 ? (CAREER.org.tier||0)+CC_ORG_POACH_STEP : null;
  const eligible=careerOrgPool().filter(o=>{
    if(mine && o.name===mine) return false;
    if(bound!=null && o.tier<bound) return false;
    const gap=o.tier-pl.ovr;
    if(gap<=reach) return true;
    return rnd() < Math.max(0, 0.35-(gap-reach)*0.05);
  });
  /* Клуб, которому написал менеджер по просьбе игрока, стоит в окне всегда:
     он уже ответил «посмотрим» в диалоге (см. careerAgentPitch), и не найти
     его потом в почте значило бы, что просьба ничего не значит. */
  const asked=careerPitchClub();
  if(asked && !eligible.some(o=>o.name===asked)){
    const o=careerOrgPool().find(x=>x.name===asked);
    if(o && !(mine && o.name===mine)) eligible.unshift(o);
  }
  if(!eligible.length) return [];
  /* The best three that will have you, with a little noise so two careers at the
     same rating do not get the same three names.

     The eight were taken off the top of the pool, which quietly assumed the top
     was thin. Adding the crossover clubs made it dense — ten new names between
     88 and 96 — and every one of the eight ended up above the player, so the
     academy rule below fired on all of them. An 88-rated player was offered
     seven deals and not one was for a main roster: $3,000 where $6,470 was on
     the table the day before. The clubs were right; the window was wrong.

     So the candidates are drawn from both sides: the biggest that will have you,
     and the ones at your own level who will actually start you. */
  /* Three of them, drawn rather than taken off the top.

     His report, 20 August: the manager writes to the same three clubs every
     week. He was right and it was not the seed — that changes with the week. It
     was the shortlist: the five biggest that would have him and the three at his
     own level, off a pool sorted by tier, which at a settled rating is the same
     eight names every time. Three shuffled out of eight the same eight times
     over reads as a manager with three phone numbers.

     So every eligible club is in the draw, weighted toward the ones near the
     player — a club far above is a story rather than a weekly occurrence — and
     whoever wrote last week is weighted down hard, so the list turns over
     instead of circling. Nobody is excluded outright: a club that wants you can
     come back, it just does not come back first. */
  const lastWeek=(cr.orgRecent && cr.orgRecent.week!==careerWeek())
    ? (cr.orgRecent.names||[]) : [];
  const weightOf=o=>{
    const gap=Math.abs(o.tier-pl.ovr);
    return (1/(1+gap*0.35)) * (lastWeek.indexOf(o.name)>=0 ? 0.15 : 1);
  };
  const pool=eligible.slice();
  const shuffled=[];
  while(shuffled.length<3 && pool.length){
    const total=pool.reduce((s,o)=>s+weightOf(o), 0);
    let r=rnd()*total, at=0;
    for(; at<pool.length; at++){ r-=weightOf(pool[at]); if(r<=0) break; }
    shuffled.push(pool.splice(Math.min(at, pool.length-1), 1)[0]);
  }
  /* И клуб, которому написал менеджер, стоит в этой тройке обязательно.
     Держать его в списке кандидатов было мало: тройка тянется броском, и
     адресная просьба могла не выпасть. Вытесняется самый слабый — просьба
     игрока весит больше случайного письма. */
  if(asked && !shuffled.some(o=>o.name===asked)){
    const o=eligible.find(x=>x.name===asked);
    if(o){
      if(shuffled.length>=3) shuffled.sort((a,b)=>a.tier-b.tier).shift();
      shuffled.push(o);
    }
  }
  /* СЛУХИ (29.10, его «10»): за неделю до оффера в ленте «по слухам, X присматривается к тебе», как на сцене.
     Слух — про клуб из тех, кто мог бы написать, но не написал в этот раз; через 5–12 дней он садится в окно,
     и то не всегда: семь из десяти слухов сбываются, остальные просто гаснут. Один слух за раз. */
  const today=careerToday(), ru=cr.rumor;
  if(ru && ru.real && !ru.done && ccDaysBetween(ru.day, today)>=ru.wait){
    ru.done=1;
    const o=eligible.find(x=>x.name===ru.name);
    if(o && !shuffled.some(x=>x.name===o.name)){
      if(shuffled.length>=3) shuffled.sort((a,b)=>a.tier-b.tier).shift();
      shuffled.push(o);
    }
  } else if(!ru || (ru.done || !ru.real) && ccDaysBetween(ru.day, today)>=CC_RUMOR_GAP){
    // Не тот же клуб, что в трёх последних слухах: иначе лента пишет одно и то же имя месяцами.
    const past=cr.rumorPast||[];
    const pool2=eligible.filter(o=>!shuffled.some(x=>x.name===o.name) && o.tier>=pl.ovr-2 && past.indexOf(o.name)<0);
    if(pool2.length && rnd()<CC_RUMOR_ODDS){
      const o=pool2.slice().sort((a,b)=>weightOf(b)-weightOf(a))[Math.floor(rnd()*Math.min(3, pool2.length))];
      cr.rumor={name:o.name, day:today, wait:5+Math.floor(rnd()*8), real:rnd()<0.7};
      cr.rumorPast=past.concat(o.name).slice(-3);
      careerNews('flat', 'ccNewsRumor', [o.name, ccHandle(pl.nick||'')]);
    }
  }
  // Клуб сел в окно — просьба исполнена: менеджера можно просить о следующем.
  if(asked && shuffled.some(o=>o.name===asked) && CAREER.pitch) CAREER.pitch.done=careerToday();
  shuffled.sort((a,b)=>b.tier-a.tier);
  cr.orgRecent={week:careerWeek(), names:shuffled.map(o=>o.name)};
  return shuffled.map(o=>{
    /* A big club does not put an unproven player on its main roster — it signs
       them to the academy and moves them up when they earn it. So the gap
       between what the club is and what the player is decides which roster the
       offer is for: reaching well above yourself gets you the junior side.

       Except in Division 1, his call, 18 August: a player who is already there
       is not unproven, whoever is asking. The club will take any of them for the
       first team and says what it thinks of them with the wage instead — which
       needs no separate rule, because the wage is built from the player's own
       rating and form. Reaching above yourself in Division 1 now costs money
       rather than the seat. The academy stays what it was below it. */
    const academy = cr.division > 1 && o.tier - pl.ovr >= 4;
    /* And a club values a player slightly differently from the club next to it.

       careerOrgSalary is a pure function of the tier and the rating, so every
       club on the same tier named the identical number to the cent and the best
       offer on the table was always simply the biggest badge — his tester had
       HavoK top the list twice running and read the market as fixed, which it
       was. The band is the scene's; where a club sits inside it is the club's
       own business, so this is a stable ±12% per club per window: the same club
       says the same thing all fortnight, and a different one is worth going to
       look at. */
    // And asks for more than the player would have been offered cold.
    const wage = Math.round(careerOrgSalary(o.tier, cr.division, cr.reach)*
                            careerAgentTerms().wage*ccOrgWageNoise(o.name));
    return {
      name:o.name, tier:o.tier, academy:academy,
      // An academy deal pays the bottom of the band. It is a place to be seen,
      // not a job.
      salary: wage>0 ? Math.max(CC_WAGE_FLOOR, academy ? Math.round(wage*0.45/10)*10 : wage) : 0,
      goal: careerOrgGoal(cr.division),
      cut: careerOrgCutFor(o.tier),
      perk: ccOrgPerk(o.tier, academy, rnd),
      term: ccOrgTermRoll(o.tier, academy, rnd),
      // Под контрактом: новый клуб выкупает игрока у нынешнего — платит отступные он, не игрок.
      fee: (CAREER.org && !CAREER.org.own) ? careerBuyoutCost() : 0,
      /* Иногда клуб берёт не игрока, а состав.

         Правка: «пусть будет иногда приходить контракт двоим
         игрокам, чтоб их сразу подписали». В жизни это обычное дело — дуо
         подписывают парой, потому что порознь оно и не играет.

         Каждое четвёртое предложение и только когда напарник вообще есть;
         академия так не подписывает — туда берут поодиночке смотреть. */
      duo: !academy && careerMateRec() && rnd()<CC_ORG_DUO_SHARE
    };
  });
}
/* What a club puts on the table besides money.

   The two things a career actually spends on are the desk and the coach, and a
   club that wants you badly enough pays for one of them — which is what a real
   contract looks like: the org kits the player out, or carries their coach.

   The tier says what a club can afford — an academy deal is a place to be seen
   and carries nothing, a mid club can set you up with gear, and only the top of
   the pool can carry a coach — but affording it is not the same as offering it.
   Some do and some do not, drawn on the same seed the offers are, so a club
   that offered a setup this week is offering it every time that week is opened
   and a reload cannot shop for a better contract. Roughly one in three at the
   gear tier, one in four at the coach tier: rare enough that an offer with a
   coach on it is a reason to sign rather than the usual terms. */
const CC_ORG_GEAR_TIER=80, CC_ORG_COACH_TIER=88;
const CC_ORG_GEAR_CHANCE=0.35, CC_ORG_COACH_CHANCE=0.25;
function ccOrgPerk(tier, academy, rnd){
  if(academy) return null;
  const roll=rnd ? rnd() : 1;
  if(tier>=CC_ORG_COACH_TIER) return roll<CC_ORG_COACH_CHANCE ? 'coach'
                                   : roll<CC_ORG_COACH_CHANCE+CC_ORG_GEAR_CHANCE ? 'gear' : null;
  if(tier>=CC_ORG_GEAR_TIER)  return roll<CC_ORG_GEAR_CHANCE ? 'gear' : null;
  return null;
}
// The club's kit: the peripherals and a PRO rig, given rather than bought. A
// desk the player already owns better of is left alone, and the training it is
// worth is recomputed rather than added, so nothing is paid for twice.
const CC_ORG_KIT=['mouse','headset','keyboard','monitor','pcpro'];
function careerOrgKitOut(){
  CAREER.gear=CAREER.gear||{own:[], train:0};
  CC_ORG_KIT.forEach(id=>{
    const it=CC_SHOP.find(x=>x.id===id);
    if(!it || careerOwns(id)) return;
    if(it.slot && ccShopSlotRank(it.slot)>=it.rank) return;
    CAREER.gear.own=(CAREER.gear.own||[]).concat(id);
  });
  // The desk is worth its best of each thing, counted once.
  const slots={};
  CAREER.gear.train=CC_SHOP.reduce((s,it)=>{
    if(!careerOwns(it.id)) return s;
    if(!it.slot) return s+it.train;
    if((slots[it.slot]||0)>=it.train) return s;
    const gain=it.train-(slots[it.slot]||0);
    slots[it.slot]=it.train;
    return s+gain;
  }, 0);
  careerGearSkill();
}
/* What the desk is worth on the card: per slot the best rung owned, the same
   rule the training bonus uses, so an upgrade replaces rather than stacks.
   Recounted from scratch on every change — buying and being kitted out both
   come through here — and read by careerCard. */
function careerGearSkill(){
  const bySlot={}, skill={};
  CC_SHOP.forEach(it=>{
    if(!it.skill || !careerOwns(it.id)) return;
    const key=it.slot||it.id;
    if(!bySlot[key] || (it.rank||0)>(bySlot[key].rank||0)) bySlot[key]=it;
  });
  Object.values(bySlot).forEach(it=>{
    Object.keys(it.skill).forEach(k=>{ skill[k]=(skill[k]||0)+it.skill[k]; });
  });
  CAREER.gear=CAREER.gear||{own:[], train:0};
  CAREER.gear.skill=skill;
  // And the confidence in the garage: the best car owned, nothing stacked.
  CAREER.gear.conf=CC_SHOP.reduce((v,it)=>
    (it.conf && careerOwns(it.id) && it.conf>v) ? it.conf : v, 0);
}
// Whether the club is paying for the coach this month.
function ccOrgPaysCoach(){ return !!(CAREER.org && (CAREER.org.perk==='coach' || (CAREER.org.pays||{}).coach)); }
/* ПОПРОСИТЬ КЛУБ ОПЛАТИТЬ ШТАБ (его слово 8.10: «в карьере игрока добавить возможность попросить оплатить оргу коуча,
   аналитика, психолога»). Просьба — к своему клубу (не к своей организации). Согласие — от того, насколько ты ему нужен:
   рейтинг против уровня клуба, шанс 25…90% (оценка режима), бросок на день и роль — одно и то же нажатие даёт один ответ.
   «Да» — клуб платит эту роль, пока ты в нём (найм и продления бесплатно). «Нет» — снова спросить через 30 дней. */
const CC_ORG_PAY_COOL=30;
function ccOrgPays(kind){
  const o=CAREER && CAREER.org; if(!o || o.own) return false;
  return kind==='coach' ? ccOrgPaysCoach() : !!((o.pays||{})[kind]);
}
function ccOrgPayAskUntil(kind){
  const o=CAREER && CAREER.org, m=o && o.payNo, d=m && m[kind];
  return (d && careerToday()<d) ? d : null;
}
function ccOrgPayChance(){
  const o=CAREER.org, pl=CAREER.player, ovr=pl.ovrExact!=null ? pl.ovrExact : pl.ovr;
  return Math.max(0.25, Math.min(0.9, 0.5+(ovr-(o.tier||80))*0.05));
}
function careerOrgPayAsk(kind){
  const o=CAREER.org; if(!o || o.own || ccOrgPays(kind) || ccOrgPayAskUntil(kind)) return false;
  const ok=careerRng(ccHashStr('orgpay|'+o.name+'|'+kind+'|'+careerToday()))()<ccOrgPayChance();
  const role=L().ccStaffRole[kind];
  if(ok){ o.pays=o.pays||{}; o.pays[kind]=true; careerNews('good', 'ccNewsOrgPays', [o.name, role]); }
  else { o.payNo=o.payNo||{}; o.payNo[kind]=ccAddDays(careerToday(), CC_ORG_PAY_COOL); careerNews('bad', 'ccNewsOrgPaysNo', [o.name, role]); }
  careerSave(); careerRenderHub(); return ok;
}

// What they want for it. Below Division 1 a club wants the thing the ladder is
// for: get up a rung. In Division 1 there is no rung left, so they want a
// result — a top-20 finish in any cup this season.
/* ЦЕЛЬ СЕЗОНА — НА ВЫБОР (его слово 20.10, вслед за целями месяца: «сам выбирает реалистичные цели… не в любом кубке,
   а FNCS»). Клуб предлагает три, выбор — до конца сезона один раз; не выбрал — остаётся средняя. Выполнена —
   продление с прибавкой по сложности (+10% / +15% / +30%), провал — клуб расторгает, как и было.
     Дивизион 2+: надёжная — топ-20 в кубке; средняя — подняться на дивизион; амбициозная — на два (со 2-го —
       подняться и взять топ-5 в сессии FNCS Divisional Cup).
     Дивизион 1 (и годы без дивизионов): надёжная — топ-20 в Финале недели FNCS (если их в году нет — в кубке);
       средняя — дойти до финала Мейджора FNCS; амбициозная — топ-10 в финале Мейджора FNCS. */
const CC_ORG_GOAL_RAISE=[0.10, 0.15, 0.30];
function careerOrgGoalOpts(div){
  const noDiv=typeof ccNoDivisions==='function' && ccNoDivisions();
  if(!noDiv && div>1){
    return [{type:'place', target:20},
            {type:'promote', target:div-1},
            div>2 ? {type:'promote', target:div-2} : {type:'promote', target:div-1, plus:{cat:'fncsCup', how:'place', n:5}}];
  }
  let wf=false; try{ careerEvents().forEach(evs=>{ if((evs||[]).some(e=>e.kind==='final')) wf=true; }); }catch(e){}
  return [wf ? {type:'cat', cat:'fncsFinal', how:'place', n:20} : {type:'place', target:20},
          {type:'cat', cat:'majorFinal', how:'reach'},
          {type:'cat', cat:'majorFinal', how:'place', n:10}];
}
// Цель по умолчанию — средняя, с вариантами внутри: выбрать можно до конца сезона (careerOrgGoalPick).
function careerOrgGoal(div){
  const opts=careerOrgGoalOpts(div).map((o, i)=>Object.assign(o, {tier:i}));
  return Object.assign({}, opts[1], {opts:opts, pick:null});
}
function careerOrgGoalPick(i){
  const org=CAREER && CAREER.org; if(!org || org.own || !org.goal || !org.goal.opts || org.goal.pick!=null) return;
  const o=org.goal.opts[i]; if(!o) return;
  org.goal=Object.assign({}, o, {opts:org.goal.opts, pick:i});
  careerSave(); if(typeof careerRenderHub==='function') careerRenderHub();
}
function careerOrgGoalText(goal){
  // Цели может не быть вовсе: свой клуб задач себе не ставит. См. careerClubFound.
  if(!goal || !goal.type) return '-';
  const T=L();
  if(goal.type==='cat'){
    if(goal.how==='reach') return (T.ccGoalReach||{})[goal.cat] || T.ccGoalPlace(10);
    const f=(T.ccMgPlaceOf||{})[goal.cat]; return f ? f(goal.n) : T.ccGoalPlace(goal.n);
  }
  const base=goal.type==='promote' ? T.ccGoalPromote(goal.target) : T.ccGoalPlace(goal.target);
  if(goal.plus){ const f=(T.ccMgPlaceOf||{})[goal.plus.cat]; return base+' + '+(f ? f(goal.plus.n) : T.ccGoalPlace(goal.plus.n)); }
  return base;
}
function ccOrgGoalPickHTML(){
  /* 23.10, его слово (Notion): «про проценты можно убрать». Выбор цели сезона с +10/+15/+30% больше не показывается:
     цель остаётся средней, как и было без выбора. careerOrgGoalPick оставлен для старых сейвов. */
  return '';
  const org=CAREER && CAREER.org, g=org && org.goal;
  if(!g || org.own || !g.opts || g.pick!=null) return '';
  const T=L();
  return '<div class="cc-mg-pick"><small>'+esc(T.ccOrgGoalPickHint)+'</small>'+g.opts.map((o, i)=>
    '<button type="button" class="cc-mg-opt cc-mg-t'+i+'" onclick="event.stopPropagation();careerOrgGoalPick('+i+')">'+
      '<em>'+esc((T.ccMgTier||[])[i]||'')+'</em><b>'+esc(careerOrgGoalText(o))+'</b><i>+'+Math.round(CC_ORG_GOAL_RAISE[i]*100)+'%</i></button>').join('')+'</div>';
}
// Whether the season's log has already done it. Promotion is read off the
// division you are standing in, a placement off the best finish of the season.
function careerOrgGoalMet(){
  /* СВОЙ КЛУБ НЕ СТАВИТ СЕБЕ ЗАДАЧ, и цели у него нет. Скриншот: основал
     организацию по ссылке с деньгами, открыл вкладку «карьера» — «Cannot read properties
     of undefined (reading 'type')». Читалось org.goal.type у контракта, которого нет:
     careerClubFound ставит CAREER.org сам, без зарплаты, доли и цели. */
  const org=CAREER.org; if(!org || !org.goal) return false;
  const cr=CAREER.career;
  const rows=(cr.log||[]).filter(e=>e.season===cr.season);
  const catOk=(c)=>rows.some(r=>ccMgCat(r)===c.cat && (c.how==='reach' ? true : c.how==='cut' ? !!r.passed : (r.place||999)<=c.n));
  if(org.goal.type==='cat') return catOk(org.goal);
  if(org.goal.type==='promote') return cr.division<=org.goal.target && (!org.goal.plus || catOk(org.goal.plus));
  const best=(cr.log||[]).filter(e=>e.season===cr.season).reduce((b,e)=>Math.min(b, e.place), 999);
  return best<=org.goal.target;
}

/* Клуб, подписавший состав, подписывает и напарника.

   Возвращает ник первого из подписанных вместе с тобой — им и называется пост,
   — или null, если контракт был личным. Больше ничего в карьере не меняется:
   зарплата остаётся твоей, цели — твои, а у напарника появляется клуб, который
   виден в составе и в ленте. Именно это и просили: «чтоб их сразу подписали». */
function careerOrgSignMates(offer){
  if(!offer || !offer.duo) return null;
  const recs=careerMateRecords();
  if(!recs.length) return null;
  recs.forEach(r=>{ if(r) r.org=offer.name; });
  const first=recs[0];
  const card=ccMateCardOf(first);
  return ccHandle((card && card.handle) || (first && first.handle) || '');
}
function careerSign(i){
  const offer=(CAREER.offers||[])[i];
  if(!offer) return;
  CAREER.org={name:offer.name, tier:offer.tier, salary:offer.salary,
              goal:offer.goal, cut:offer.cut!=null?offer.cut:careerOrgCutFor(offer.tier),
              since:CAREER.career.season, paid:0, perk:offer.perk||null,
              bonus:careerOrgBonusFor(offer.salary), to:CAREER.career.season+(offer.term||1)-1};
  CAREER.offers=null;
  careerReachAdd(ccOrgMediaSign(offer.name, offer.tier, offer.academy), true);
  const withMates=careerOrgSignMates(offer);
  if(withMates) careerNews('good', 'ccNewsSignedDuo', [offer.name, withMates], {by:ccOrgBy(offer.name)});
  else careerNews('good', 'ccNewsSigned', [offer.name, offer.salary], {by:ccOrgBy(offer.name)});
  // What they promised, delivered the day it is signed rather than owed.
  if(offer.perk==='gear'){
    careerOrgKitOut();
    careerNews('good', 'ccNewsOrgKit', [offer.name]);
  } else if(offer.perk==='coach'){
    careerNews('good', 'ccNewsOrgCoach', [offer.name]);
  }
  careerSave();
  careerRenderHub();
}
/* Saying no to what is on the table, not to the rest of the year.

   This wrote the season number and the rebuild was skipped for as long as the
   season lasted — forty-three weeks of silence from one press. A player's
   report, 18 August: "you decline and they never appear again, I could not
   believe it", and then the part that shows how bad it is — he won a LAN, left
   his club to be signed for more, and nobody wrote.

   Which also contradicts this file's own decision: careerWindowNow returns true
   because in this scene clubs write all year. A no cannot mean more than a no.

   So it quiets the ones who asked, for a month, and a real result reopens it
   immediately — because a club that passed in February is a different club after
   you win something. */
const CC_OFFER_QUIET=30;
function careerDeclineOffers(){
  CAREER.offers=null;
  CAREER.offersDeclined={day:careerToday()};
  careerSave();
  careerRenderHub();
}
// Whether clubs may write again after this result.
function ccOffersOpen(place, of){
  const d=CAREER.offersDeclined;
  if(!d) return true;
  // An old save carries the season number this used to store; a career that
  // declined under the old rule is not held to it for the rest of the year.
  const day=(typeof d==='object' && d.day) ? d.day : null;
  if(!day) return true;
  if(ccDaysBetween(day, careerToday())>=CC_OFFER_QUIET) return true;
  // Anything the room would talk about: a win, a podium, a LAN seat.
  return place<=3;
}

/* Wages arrive on the first of the month, the way a club actually pays.

   They used to be a slice of the season divided by its weeks, which is a number
   no contract has ever quoted. With a date for a clock the career can pay the
   way the deal reads: a payday is the first of a month, and a season of them
   adds up to the season's salary — so the instalment is the contract over how
   many paydays this career year has left, rather than a twelfth of anything.
   Derived, so it stays right when the career's start moves.

   They are not earnings. A Fortnite career is measured publicly in prize money —
   the number a player puts in their own bio — and a club wage is not part of it.
   cr.earnings is what events paid, cr.wages is what clubs did. */
function careerWagePaydays(){
  const out=[];
  for(let d=ccAddDays(careerStartDay(),1); d<=ccYearTo(); d=ccAddDays(d,1))
    if(d.slice(8)==='01') out.push(d);
  return out;
}
// Paid for the days a move crosses rather than for the day it lands on: a week
// that steps over the 1st still pays, and the clock mostly will not land on it.
function careerPayWages(fromISO, toISO){
  const org=CAREER.org;
  const pays=careerWagePaydays();
  if(!pays.length) return 0;
  const months=pays.filter(d=>d>fromISO && d<=toISO).length;
  try{ if(typeof careerClubMonth==='function') careerClubMonth(months); }catch(e){}   // свой клуб: спонсор, содержание, зарплаты
  try{ if(typeof careerMerchMonth==='function') careerMerchMonth(months); }catch(e){}   // свой мерч: доля аудитории
  let paid=0;
  if(org && org.salary){
    /* A monthly wage is paid monthly.

       careerOrgSalary is a month's money and says so - "Division 1 pays $500 to
       $15,000 a month", his call on 14 August - the offer prints it with "/ мес"
       beside it, and this divided it by the eleven paydays in a year before
       handing any of it over. So a club offered a Division 1 player seven and a
       half thousand a month and paid six hundred and eighty, which is the whole
       of "they offer very little": the number in the message was true and the
       money was a eleventh of it. */
    paid+=org.salary*months;
    // Клуб постит тебя каждый месяц — медийка от его аудитории (ccOrgMediaMonth).
    if(months && !org.own) careerReachAdd(ccOrgMediaMonth(org.name, org.tier, org.academy)*months, true);
    if(paid){
      CAREER.career.wages=(CAREER.career.wages||0)+paid;
      org.paid=(org.paid||0)+paid;
    }
  }
  /* The sponsor used to pay here, on the first, for existing.

     Which made it the second thing in the mode converting followers into money
     - the stream day is the other - and the worse of the two: a monthly cheque
     for a number that goes up on its own is a notification, not a decision. A
     brand is not paying for an audience, it is paying for a slot in front of
     one, and the slot only exists on a night somebody actually streams.

     So it pays per stream now, in careerDoAct, and this day is the club and the
     rent alone. */
  if(paid){
    // The agent's share of a month's wage, taken the way it is taken off a
    // prize: the club paid what the club paid, and the cut is a line of its own.
    const cut=Math.round(paid*careerAgentTerms().cut);
    if(cut){
      CAREER.career.agentPaid=(CAREER.career.agentPaid||0)+cut;
    }
    CAREER.career.balance=(CAREER.career.balance||0)+(paid-cut);
  }
  /* And what the month costs. A career that has moved pays the rent of the
     country it moved to on the same day the wages land, so the first of the
     month is one row and not two — money in, money out, one balance.

     Paid after the wages rather than before them: the point of a wage is that it
     covers the rent, and charging first would evict a player on the morning
     their salary arrived. A month that still cannot be covered ends the lease
     rather than running a debt — this mode has no debt, and inventing one to
     punish a bad season would be a system nobody asked for. */
  const rent=ccRentNow()*months;
  if(rent){
    if((CAREER.career.balance||0)>=rent){
      CAREER.career.balance-=rent;
      CAREER.career.rent=(CAREER.career.rent||0)+rent;
    } else careerMoveEvict();
  }
  return paid;
}

/* ---- Sponsors ----
   Followers turn into money. Three tiers by audience: peripheral brand 10k, provider 50k, brand deal 150k. Paid
   monthly on wage day.
   Kept small vs Division 1 (top deal is about a Weekly Final 4th a month) so careers are won on the ladder. The
   point is the bottom: below D1 nothing pays, so sponsors make coach and desk reachable early. */
/* What a brand pays, and what it is paying for.

   It was a monthly cheque against a follower count, which made it the second
   thing in this mode turning an audience into money and the worse of the two:
   the number goes up on its own, so the money arrived for nothing anybody
   decided. A brand is not buying an audience, it is buying a slot in front of
   one, and the slot exists on the nights somebody streams.

   So the fee is per stream night. The sizes are set against what the monthly
   cheque used to be at a normal amount of streaming - ten nights a month puts
   the gear deal at $600 and the brand deal at $5,000, near enough where they
   were - except that now a career that never streams is paid nothing, which is
   also what would happen. */
/* Brand deals priced per thousand readers ($6 per 1k, the scene's creator-slot rate), so offers grow
   with the audience; a fixed fee per tier stayed at $60/night from 10k to 49k readers.
   Tier decides who writes and the budget ceiling, which keeps deals below Division 1 earnings.
   A brand re-offers once the audience is worth 25% more than the signed rate. */
/* The order the shop draws people in: biggest account first, smallest last.

   His call, 19 August. Three lists here are priced off a follower count — the
   manager, the marketing manager and the SMM — and they were drawn in three
   different orders: marketing and SMM biggest-first, and the managers in the
   order the people were added to the file. One rule for all three now, and it is
   the one the other two already had — the window opens on the name worth wanting
   and runs down to the one anybody can get.

   Sorted where it is drawn rather than in the tables, because the tables carry
   their own order — CC_AGENTS is written in the order the people arrived, and
   the notes on those rows are the history of it. Coaches are not in this: they
   have no follower count and their list is deliberately grouped, heads first
   and then the specialists, who are all one price on purpose. */
/* The order the four windows run in, his own, off the two screenshots.

   It has been three things now: the follower count, then his hand-written
   order, then the alphabet. This is the hand-written one back, because it is
   the one he keeps writing out — and this time the numbers follow it rather
   than argue with it. See ccRankPull.

   One list for all four, keyed by handle, because a person moves between them:
   an SMM who starts managing is one line moved rather than a row rewritten.

   Anybody not named falls to the end keeping their own table’s order. A person
   added to the data and forgotten here shows up at the bottom of the window
   rather than somewhere in the middle of it, and last is a visible thing to fix.
*/
const CC_SHOP_ORDER=[
  // Managers. Yeekzie last, his call — placed rather than left to fall there,
  // so the end of this list is a decision and not an omission.
  // Razia is placed on the one thing this list is allowed to be placed on when
  // there is no hand-written order for a new row: his account is larger than the
  // two under him and smaller than the one over him. Move him if he belongs
  // somewhere else — the position is the whole price.
  'alhasarda','JoaovEU','ElyxxM','F0C8S','IdziU97','RemssMNG','AlybiSaCE',
  'Th0masNL','ZedroxMNG','DamlosMNG','ClapMNG','errieMNG','PixelzMNG',
  'Raziaa_','NaaxoMNG','Kiinywz0','Yeekzie7',
  // Socials. Sweety second and Lumos beside Ugo under Sandora, both his call:
  // his own list writes those two on a single line.
  'v1nteroFN','SweetyyFN','SandoraFN','CmLumos','UgoComm','Pyp4ingS','veltrixx10','Lair_Fn',
  // Marketing
  'PyraxMGMT','Goalkikermng','KaizenMNG','murlotron',
  // Coaches — ПО РЕЙТИНГУ КОУЧА (его слова 8.10: «по фоловерам твитера» → «или по результатам» → «вот и сделай зп и
  // рейтинг их»): сначала подтверждённые результаты, ниже — по подписчикам. Рейтинг — ccCoachRatingOf, цена от него.
  'RazZzero0oFN','Thomas5x_','BloodxEU','SvenSE_','Gripeyy','PeanutBrainTS','tallami1','Coach_F0x','Flaireeeee','CoachDashura','BoopNL_','stormyrite','diaspaulin_','Rabidfn','At0m_GG','kha0rz','EgeXJerG','ZykomaTV','xpl0t','ValentaynL','spidryx','CoachEsteh','CoachNassimm','coachAchille'
];
/* Подписчики коучей в X, сняты 8.10.2026 через api.fxtwitter.com по их же адресам (at) — каждый сверен по имени и
   описанию; у Boop, Stormyrite, Gripey, Spidryx, Zykoma тёзки отброшены. */
const CC_COACH_X={DestinysJesus:112065, RazZzero0oFN:418315, BoopNL_:127598, stormyrite:98460, BloodxEU:82759, SvenSE_:26955, Gripeyy:22316, diaspaulin_:18474, tallami1:17589, Rabidfn:13220, At0m_GG:12350, Coach_F0x:9342, kha0rz:9246, PeanutBrainTS:6675, Thomas5x_:6498, EgeXJerG:4403, ZykomaTV:4329, xpl0t:3852, ValentaynL:3072, spidryx:2609, CoachEsteh:2343, Flaireeeee:742, CoachDashura:1065, CoachNassimm:478, coachAchille:56};
const CC_SHOP_RANK=(function(){
  const m={};
  CC_SHOP_ORDER.forEach((h,i)=>{ m[String(h).toLowerCase()]=i; });
  return m;
})();
function ccShopKey(x){ return String((x&&x.at)||(x&&x.id)||'').toLowerCase(); }
/* Position in the list as a 0..1 value for the four agent windows (manager cut/reach/wage,
   marketer ask/land, SMM ask/boost). Top = 1, bottom = 0, evenly spread; ranges are unchanged,
   only the order now follows the list instead of a log curve on followers.
   Matched by handle since a signed agent is a copy in the save; not in the list gives null (plain terms). */
/* РЕЙТИНГ ЛЮДЕЙ ИЗ МАГАЗИНА — менеджеры, SMM, маркетинг (его «может и с другими так сделать, менеджеры, смм», 8.10;
   коучи — ccCoachRatingOf). Результат человека — его клиенты: средний рейтинг четырёх лучших игроков, которых он
   ведёт, по его же описанию в X (сняты 8.10.2026) и картам этой базы; рейтинг = p − 6, от 60 до 95. У кого клиенты
   не названы или их нет в базе — по подписчикам: 60 + 6·lg(подписчики/1000), не выше 76. Условия (доля, охват,
   прибавка, цена) идут от рейтинга, а не от места в списке; порядок окна — по рейтингу. Формула — оценка режима. */
const CC_STAFF_X={"roxogg":3007, "ZeyroxMNG1":380, "JoaovEU":2874, "ElyxxM":16729, "alhasarda":3166, "NaaxoMNG":853, "PixelzMNG":2439, "Kiinywz0":822, "Yeekzie7":3076, "F0C8S":4581, "ClapMNG":4144, "AlybiSaCE":3366, "IdziU97":3200, "Th0masNL":2363, "RemssMNG":2150, "DamlosMNG":1674, "ZedroxMNG":1364, "errieMNG":1304, "Raziaa_":953, "LC7_MNG":931, "ArtinMNG":866, "yaleblan":787, "DrazoxMNG":702, "Skyforcemng272":525, "Zerkomng":516, "Lou1sMNG":385, "askebott":294, "v1nteroFN":2137, "SweetyyFN":1991, "SandoraFN":1014, "baderwtw":885, "Pyp4ingS":613, "UgoComm":548, "Lair_Fn":594, "veltrixx10":481, "CmLumos":357, "MetiDark_":49, "murlotron":3007, "Goalkikermng":1104, "KaizenMNG":785, "PyraxMGMT":433, "loicmng_":565, "wyzefn6":1893};
const CC_STAFF_RES={
  "roxogg":{p:91, who:["Phzin","Edson","916Gon","Night"]},   // 23.10: в X — phzin, edson, 916gon, blxckoutz, night, seeyun, pardal; четыре лучшие карты
  "PixelzMNG":{p:77, who:["Matice","Shadox","Seili","Th3ioF"]},   // 23.10: matice, Shadox, Seili, Th3io, Sobyy, Berre (двух последних в базе нет)
  "ClapMNG":{p:90.5, who:["Twek","Salko","Kyzen","Artskill"]},   // 23.10: Kyzen, Lame (BR, не EU Lame), Girlybella, Artskill, salko, twek, Turtl3
  "IdziU97":{p:92.5, who:["Shadow","Blacha","Nxthan","G13ras"]},   // 23.10: Nathan, Shadow, Blacha, Kombek, Pixovsky, Predage, cheatiin, G13ras
  "SweetyyFN":{p:95.8, who:["Flickzy","Pixie","MariusCOW","Tjino"]},
  "SandoraFN":{p:96, who:["Vanyak3kk"]},
  "baderwtw":{p:95, who:["Eomzo","PXMP"]},
  "veltrixx10":{p:89.7, who:["SkyJump","Werex","Akiira"]},
  "Goalkikermng":{p:89.7, who:["Upl","F1n4ik","Predage"]},
  "PyraxMGMT":{p:92, who:["SkyJump"]},
  "JoaovEU":{p:96, who:["Vanyak3kk","Ajerss"]},   // 23.10: JV Agency — Vanyak3kk и Ajerss
  "wyzefn6":{p:62.7, who:["Rz Verifvǃ","fa wiverǃ","Rz Pruzen 10"]},   // capri в базе нет
  "loicmng_":{p:52, who:["Galaxyache 32"]},   // 23.10: konect.gg/loicmng — 23 клиента; в базе только Galaxyache (Louis 92 и voz OCE — тёзки)
  /* 23.10 вечер (его слово: «пусть от игроков зависит рейтинг, а не от подписчиков»): составы агентств — сайты агентств,
     konect.gg, linktree, твиты игроков «contact @…». Тёзки из чужого региона отброшены (Magma NAC, Raz ME, Noa ASIA,
     Jax OCE, Hugo OCE, Centro NAW). Четыре лучшие карты базы. */
  "alhasarda":{p:98, who:["Kami","SwizzY","JannisZ","Flickzy"]},   // onlygrp.com/clients: + charyy, Chap, Kaan
  "ElyxxM":{p:97, who:["Setty","Sky","Scroll","TaySon"]},   // «agent for Sky and Scroll» (24.09), TaySon и Setty — contact в твитах
  "AlybiSaCE":{p:92.8, who:["EpikWhale","Braydz","Aoxy","Kraez"]},   // Proxy: + Vazen, Twunti, crylix (contact в твитах 2026)
  "Yeekzie7":{p:92.3, who:["P1ng","Howly","1Lusha","Minori"]},   // questmind.gg/fr/esport: + Darkos, Syaaz, Ghonzo, iFr0zi, Aiden, NeFrizi, Tylio
  "RemssMNG":{p:92, who:["Momsy","Izzi","Darkos","Minori"]},   // konect.gg/RemssMNG: + Tisma, Tylio, Frost, Th3ioF, Sweey
  "F0C8S":{p:92, who:["Bacca","Curve","Ozone","Dolzeur"]},   // CreedTalent: + Channce, Wolvax, Wheat, Hedra, catman
  "Th0masNL":{p:87.5, who:["Repairs","Robin"]},   // contact в твитах 2026; Hiizix в базе нет
  "ArtinMNG":{p:83, who:["karmy","Akiira","glubfnbr","3R8"]},   // Beyond Agency (konect.gg/Artin, теги агентства)
  "DamlosMNG":{p:81, who:["Noia","Ve1ryy","Seekk","Zyyron"]},   // almanagement.fr/talents
  "NaaxoMNG":{p:77, who:["Tisma","Skyz"]},   // naaxo.netlify.app, konect.gg/NaaxoMNG
  "askebott":{p:67, who:["noah","Poweer","DANYA"]},   // konect.gg/AskeyMNG
  // Игроки названы, а карт в базе нет (или только тёзки) — рейтинг 65.
  "Zerkomng":{p:null, who:["insaneebtw","cuhkifn","eonshh","snekgery"]},   // шапка X
  "LC7_MNG":{p:null, who:["toryzenfv","maddingooo"]},   // шапка X
  "Lou1sMNG":{p:null, who:["Timur11x","Worizome180"]},   // шапка X
  "yaleblan":{p:null, who:["rexivski","Hugo","Linqish","dkay","arvid","Meltz","ozarxo","Atome","Da1ko","dzeq"]},   // linktr.ee/YaleblanFN
  "Raziaa_":{p:null, who:["Noaggs","Hazyache","squadir23","noa"]},   // шапка X 21.08, konect.gg/raziaa
  "Skyforcemng272":{p:null, who:["joyyfnrr","NATEKFN1","Karotek_"]},   // шапка X 29.09
  "apolinmng":{p:null, who:["crunkezz","jayzfnn"]}   // шапка X 27.09 (аккаунт 23.10 заблокирован)
};
function ccStaffRating(x){
  if(!x) return 60;
  // Коуч узнаётся по своим полям: обращение к CC_COACHES отсюда падает на загрузке (константа ниже по файлу, TDZ).
  if(x.train!=null && x.keys){ try{ return ccCoachRatingOf(x); }catch(e){ return x.rating||60; } }
  const r=CC_STAFF_RES[x.at];
  // Один-два клиента — ещё не результат: −2 за каждого недостающего до четырёх.
  // Есть хоть один свой игрок — не ниже 65 (его слово 23.10); p:null — игроки названы, но карт в базе нет.
  if(r) return r.p==null ? 65 : Math.max(65, Math.min(95, Math.round(r.p-6-2*Math.max(0, 4-(r.who||[]).length))));
  /* Менеджер — только от игроков (его слово 23.10: «пусть от игроков зависит рейтинг, а не от подписчиков»). Без найденных
     игроков — низ шкалы; подписчики решают лишь порядок равных (ccByHand). SMM и маркетинг — по-прежнему по аудитории. */
  let agent=false; try{ agent=CC_AGENTS.some(a=>a.at===x.at); }catch(e){}
  if(agent) return 60;
  const f=CC_STAFF_X[x.at]!=null ? CC_STAFF_X[x.at] : (x.x||500);
  return Math.max(60, Math.min(76, Math.round(60+6*Math.log10(Math.max(1000, f)/1000))));
}
function ccRankPull(list, item){
  if(!item || !list || list.length<2) return null;
  // Не из списка (вписанный руками, чужой) — без места, обычные условия, как было.
  const key=ccShopKey(item); if(!list.some(r=>ccShopKey(r)===key)) return null;
  return Math.max(0, Math.min(1, (ccStaffRating(item)-60)/35));
}
function ccByHand(list){
  /* Равный рейтинг — по подписчикам (его слово 20.10). Коучи держат подписчиков в CC_COACH_X, а читался только
     CC_STAFF_X — у коучей одного рейтинга порядок был файловый (Boop 128K стоял ниже 98K). */
  const fol=x=>CC_STAFF_X[x.at]!=null ? CC_STAFF_X[x.at] : (typeof CC_COACH_X!=='undefined' && CC_COACH_X[x.at]!=null) ? CC_COACH_X[x.at] : (x.x||0);
  const rank=x=>-ccStaffRating(x)*1e7-fol(x);
  // Index carried alongside, so everyone unplaced keeps their own table’s order
  // rather than whatever the sort happens to do with equal keys.
  return list.map((x,i)=>({x:x,i:i}))
             .sort((a,b)=>(rank(a.x)-rank(b.x)) || (a.i-b.i))
             .map(o=>o.x);
}


const CC_AD_PER=6, CC_AD_STEP=1.25;
const CC_MKT_DAYS=30;
const CC_MARKETING=[
  {id:'murlotron',name:'Murlo',          at:'murlotron',   photo:'murlotron.jpg',   x:3057},
  {id:'goalkiker',name:'Lyost Goalkiker',at:'Goalkikermng',photo:'Goalkikermng.jpg',x:1056},
  {id:'kaizen',   name:'Kaizen',         at:'KaizenMNG',   photo:'KaizenMNG.jpg',   x:738},
  {id:'pyrax',    name:'Paul',           at:'PyraxMGMT',   photo:'PyraxMGMT.jpg',   x:378}
];
function ccMktOf(id){ return CC_MARKETING.find(m=>m.id===id) || null; }
/* What one asks for a month, and what they land. Both off the account, on the
   same curve the player's manager is priced on — see ccAgentPull. A month costs
   what the smallest of them asks when nothing has been read yet. */
const CC_MKT_BASE=600;
const CC_MKT_X_FLOOR=250, CC_MKT_X_TOP=3500;
function ccMktTermsOf(m){
  const k=ccRankPull(CC_MARKETING, m);
  // Цена — та же кривая штаба, $250…3 000 (17.10, его «а другой стафф»); без места в списке — CC_MKT_BASE.
  return {cost: m && m.cost!=null ? m.cost
                : (k==null ? CC_MKT_BASE : ccStaffCostCurve(250, 3000, k)),
          rate: m && m.rate!=null ? m.rate : (1+(k==null?0:k*0.6))};
}
function ccMkt(){
  const m=CAREER && CAREER.mkt;
  if(!m || careerToday()>m.until) return null;
  return m;
}
function careerHireMkt(id, months){
  months=months>=CC_STAFF_YEAR ? CC_STAFF_YEAR : 1;
  const cr=CAREER.career, who=ccMktOf(id);
  if(!who || ccMkt()) return false;
  const t=ccMktTermsOf(who), due=ccStaffTermCost(t.cost, months);
  if((cr.balance||0)<due) return false;
  cr.balance-=due;
  CAREER.mkt={id:who.id, name:who.name, at:who.at, photo:who.photo,
              cost:t.cost, rate:t.rate, months,
              from:careerToday(), until:ccAddDays(careerToday(), ccStaffTermDays(months))};
  ccMktPickClose();
  careerSave();
  careerRenderHub();
  return true;
}
function careerEndMkt(){
  if(!CAREER.mkt) return false;
  CAREER.mkt=null;
  careerSave();
  careerRenderHub();
  return true;
}
function ccMktPickOpen(){
  const cr=CAREER.career, on=ccMkt();
  const rows=ccByHand(CC_MARKETING).map(m=>{
    const t=ccMktTermsOf(m);
    const mine=on && on.id===m.id;
    const can=!on && (cr.balance||0)>=t.cost;
    return `<div class="cc-buy${mine?' own':''}">
      ${m.photo ? `<img class="cc-buy-img cc-buy-face" src="${PHOTO_DIR}${esc(m.photo)}" alt=""
           loading="lazy" onerror="this.remove()">` : ''}
      <div class="cc-buy-in"><b><span class="cc-buy-nm">${esc(m.name)}</span> ${ccStaffBadge(ccStaffRating(m)).replace('cc-staff-rt', 'cc-staff-rt mgf-rt')}</b>
        <i class="cc-buy-who">${m.x ? '👥 '+ccFollowers(m.x)+' · ' : ''}@${esc(m.at)}</i>
        <span class="cc-buy-chips"><em class="up">${L().ccMktRate} +${Math.round((t.rate-1)*100)}%</em></span></div>
      ${mine ? `<span class="cc-owned">${L().ccAgentYours}</span>`
             : ccHireBtns(can, t.cost, "careerHireMkt('"+m.id+"')", "careerHireMkt('"+m.id+"',12)")}
    </div>`;
  }).join('');
  document.getElementById('mktPickBody').innerHTML=
    `<h4 class="cc-pick-h">${L().ccMkt}</h4>
     <div class="ch-hint">${L().ccMktHint}</div>
     <div class="cc-buys">${rows}</div>`;
  document.getElementById('mktPickModal').style.display='flex';
  document.addEventListener('keydown', ccMktPickKey);
}
function ccMktPickClose(){
  const m=document.getElementById('mktPickModal');
  if(m) m.style.display='none';
  document.removeEventListener('keydown', ccMktPickKey);
}
function ccMktPickKey(e){ if(e.key==='Escape') ccMktPickClose(); }
/* Спонсоры — по именам, не по архетипам. Отзыв: «делай и с
   логотипами чтоб… и сделай, чтоб каждый по-разному давал». Имена свои — те
   же узнаваемые аналоги, что DreamCup и баннеры стрима: чужую марку в проект
   не кладём (правило макдака). Лесенка по аудитории, и у каждого бренда своя
   щедрость: rate — множитель ставки, cap — его потолок за эфир. Девять. */
/* Отзыв вторым заходом: «а можешь настоящие названия?» —
   можешь. Имена настоящие, ids прежние (сейвы не трогаются), а вот логотипы
   НЕ их: чужой товарный знак не рисуем, на плашке — монограмма в фирменном
   цвете. Если бренд однажды напишет письмо — имена откатываются одной
   правкой этого блока и трёх словарных строк. */
/* ЛИНЕЙКА ШИРЕ (его слова 8.10: «мало спонсоров будто», «от 50к нет ни одного спонсора»). Было девять, и между 50 и
   120 тыс. — два. Теперь 23 настоящих бренда, которые спонсируют киберспорт (логотипы — photos/sp_*.png, у новых id =
   имя файла), ступенька каждые 1,2–1,5 раза по подписчикам. Пороги и потолки ставок — оценка режима, не данные. */
const CC_SPONSORS=[
  {id:'progrip',    need:5000,   cap:250,  rate:0.8,  c:'#00b8fc'}, // Logitech G
  {id:'steelseries',need:8000,   cap:300,  rate:0.9,  c:'#ff5200'},
  {id:'crankd',     need:10000,  cap:400,  rate:1.0,  c:'#e21836'}, // OMEN
  {id:'gfuel',      need:15000,  cap:450,  rate:1.0,  c:'#e4002b'},
  {id:'vyper',      need:25000,  cap:600,  rate:1.1,  c:'#44d62c'}, // Razer
  {id:'corsair',    need:35000,  cap:750,  rate:1.05, c:'#ffd400'},
  {id:'fiberx',     need:50000,  cap:900,  rate:1.0,  c:'#e60000'}, // Vodafone
  {id:'prime',      need:60000,  cap:1000, rate:1.1,  c:'#3b82f6'},
  {id:'thronelab',  need:80000,  cap:1200, rate:1.15, c:'#f04e23'}, // Secretlab
  {id:'kitkat',     need:100000, cap:1400, rate:1.1,  c:'#d6001c'},
  {id:'ggenergy',   need:120000, cap:1600, rate:1.25, c:'#95d600'}, // Monster Energy
  {id:'amd',        need:150000, cap:1900, rate:1.2,  c:'#000000'},
  {id:'alienware',  need:180000, cap:2000, rate:1.15, c:'#00a3e0'},
  {id:'dripwear',   need:200000, cap:2200, rate:1.2,  c:'#111111'}, // Nike
  {id:'lenovo',     need:220000, cap:2400, rate:1.2,  c:'#e2231a'}, // Lenovo Legion — 24-й, чтобы сетка брендов была ровной
  {id:'intel',      need:250000, cap:2700, rate:1.3,  c:'#0071c5'},
  {id:'samsung',    need:300000, cap:3000, rate:1.3,  c:'#1428a0'},
  {id:'redbolt',    need:350000, cap:3200, rate:1.4,  c:'#d5001c'}, // Red Bull
  {id:'nvidia',     need:400000, cap:3600, rate:1.4,  c:'#76b900'},
  {id:'dhl',        need:450000, cap:3800, rate:1.3,  c:'#ffcc00'},
  {id:'mastercard', need:500000, cap:4200, rate:1.45, c:'#eb001b'},
  {id:'kosmo',      need:600000, cap:4500, rate:1.5,  c:'#f40009'}, // Coca-Cola
  {id:'bmw',        need:750000, cap:5200, rate:1.5,  c:'#0066b1'},
  {id:'mercedes',   need:900000, cap:6000, rate:1.55, c:'#222222'}
];
/* Логотип — свой на каждого: монограмма с фирменным знаком, инлайн-SVG,
   потому что сайт — один файл и чужих картинок в нём нет. */
/* Настоящие логотипы (его выбор 8.10: «настоящие названия и логотипы» — для менеджера, и «в карьеру игрока добавь
   настоящих спонсоров»). Файлы — photos/sp_*.png из инфобоксов их статей в Википедии. HyperX своего логотипа там не
   имеет (статья ведёт на HP OMEN, HyperX — бренд HP), поэтому этот спонсор теперь OMEN. Без файла — монограмма, как было. */
const CC_SPONSOR_LOGO={progrip:'logitech', crankd:'hyperx', vyper:'razer', fiberx:'vodafone', thronelab:'secretlab',
  ggenergy:'monster', dripwear:'nike', redbolt:'redbull', kosmo:'cocacola'};
CC_SPONSORS.forEach(b=>{ if(!CC_SPONSOR_LOGO[b.id]) CC_SPONSOR_LOGO[b.id]=b.id; });
function ccBrandLogo(id, px){
  const f=CC_SPONSOR_LOGO[id];
  if(f){ const h=px||18; return '<span class="cc-sponsor-logo cc-sp-img" style="height:'+h+'px;width:'+Math.round(h*2.4)+'px;"><img src="'+PHOTO_DIR+'sp_'+f+'.png" alt="" loading="lazy"></span>'; }
  const s=CC_SPONSORS.find(x=>x.id===id);
  const c=(s&&s.c)||'#444';
  const size=px||18;
  // Монограммы, не их логотипы: буква бренда на его цвете.
  const T=(t,fs)=>'<text x="16" y="'+(t.length>1?21:22)+'" text-anchor="middle" '+
    'font-family="Arial Black,Arial" font-size="'+(fs||(t.length>1?12:16))+'" font-weight="900" fill="#fff">'+t+'</text>';
  const M={
    progrip:  T('L'),         // Logitech
    crankd:   T('HX'),        // HyperX
    vyper:    T('R'),         // Razer
    fiberx:   T('V'),         // Vodafone
    thronelab:T('S'),         // Secretlab
    ggenergy: T('M'),         // Monster Energy
    dripwear: T('N'),         // Nike
    redbolt:  T('RB'),        // Red Bull
    kosmo:    T('CC')         // Coca-Cola
  };
  // Не cc-brand: этот класс уже носит угловой бейдж «Fortnite Championship
  // Series» с position:absolute — логотипы улетали в правый верхний угол.
  return '<svg class="cc-sponsor-logo" width="'+size+'" height="'+size+'" viewBox="0 0 32 32" '+
    'style="vertical-align:-3px;margin-right:5px;"><rect width="32" height="32" rx="8" fill="'+c+'"/>'+
    (M[id]||'')+'</svg>';
}
function ccSponsorRate(s, reach){
  return Math.max(20, Math.min(s.cap,
    Math.round((reach||0)/1000*CC_AD_PER*(s.rate||1))));
}
/* НЕСКОЛЬКО СПОНСОРОВ (как в менеджере): слоты по подписчикам — 1 / 2 от 50 тыс. / 3 от 150 тыс. / 4 от 400 тыс. /
   5 от 800 тыс. Бренд подписывается сам из списка на «Клубе» или из письма; маркетолог больше не обязателен — без него
   ставка ×0.8, с ним ×его rate (он торгуется). Оценка режима. CAREER.sponsors = [{id, pay, since, paid}];
   старый одиночный CAREER.sponsor переезжает первым слотом. */
const CC_SP_NOMKT=0.8;
function ccSpSlots(){ const f=careerReach(); return f>=8e5 ? 5 : f>=4e5 ? 4 : f>=1.5e5 ? 3 : f>=5e4 ? 2 : 1; }
function ccSpNextSlotAt(){ const f=careerReach(); return [5e4,1.5e5,4e5,8e5].find(x=>x>f)||null; }
function ccSponsorsAll(){
  if(!CAREER) return [];
  if(!CAREER.sponsors){
    CAREER.sponsors=[];
    const s=CAREER.sponsor;
    if(s){ const LEGACY={drink:'fiberx', isp:'fiberx', gear:'progrip', brand:'kosmo'}; if(LEGACY[s.id]) s.id=LEGACY[s.id];
      const e=CC_SPONSORS.find(x=>x.id===s.id); if(e) CAREER.sponsors.push({id:e.id, pay:(s.pay!=null ? s.pay : ccSponsorRate(e, careerReach())), since:s.since, paid:s.paid||0}); }
  }
  CAREER.sponsors=CAREER.sponsors.filter(x=>CC_SPONSORS.some(b=>b.id===x.id));
  CAREER.sponsor=CAREER.sponsors[0]||null;
  return CAREER.sponsors;
}
function ccSponsor(){
  const s=ccSponsorsAll()[0]; if(!s) return null;
  const e=CC_SPONSORS.find(x=>x.id===s.id);
  return {id:e.id, need:e.need, cap:e.cap, pay:s.pay};
}
/* РЕКЛАМНЫЙ ПОСТ (его слово 8.10: «со спонсорами ещё, может, не только стримы — может, пост в соцсети или ещё что»).
   Каждый подписанный бренд раз в CC_SP_POST_DAYS дней ждёт пост: кнопка «📣 Пост» в окне спонсоров кладёт в ленту
   твой пост с брендом и #ad и платит CC_SP_POST_SHARE ставки за стрим. Числа — оценка режима, не замер. */
const CC_SP_POST_DAYS=7, CC_SP_POST_SHARE=0.6;
function ccSpPostPay(x){ return Math.max(10, Math.round((x.pay||0)*CC_SP_POST_SHARE)); }
/* 23.10, баг от игрока (Notion): «подпиши бренд, сделай пост, расторгни, подпиши снова — и так бесконечно». День поста
   жил только в записи контракта и пропадал вместе с ней. Теперь он ещё и в cr.spPost[бренд], который расторжение не трогает:
   один пост на бренд в CC_SP_POST_DAYS дней, сколько ни переподписывай. */
function ccSpPostDay(x){
  const m=CAREER && CAREER.career && CAREER.career.spPost, d=m && x && m[x.id];
  return [x && x.postDay, d].filter(Boolean).sort().slice(-1)[0] || null;
}
function ccSpPostWait(x){ const d=ccSpPostDay(x); if(!x || !d) return 0; return Math.max(0, CC_SP_POST_DAYS-ccDaysBetween(d, careerToday())); }
function ccSpPostsReady(){ return ccSponsorsAll().filter(x=>!ccSpPostWait(x)).length; }
function careerSponsorPost(id){
  const x=ccSponsorsAll().find(y=>y.id===id); if(!x || ccSpPostWait(x)) return;
  const T=L(), cr=CAREER.career, pay=ccSpPostPay(x), name=T['ccSponsor'+id]||id;
  const lines=T.ccSpPostTexts||I18N.en.ccSpPostTexts;
  const k=Math.abs(hashStr(id+'|'+careerToday()))%lines.length;
  careerNews('flat', null, null, {text:lines[k](name)+' #ad', sp:id});
  x.postDay=careerToday(); x.paid=(x.paid||0)+pay;
  cr.spPost=Object.assign({}, cr.spPost, {[id]:careerToday()});
  cr.balance=(cr.balance||0)+pay; cr.sponsored=(cr.sponsored||0)+pay;
  careerSave();
  try{ ccSpPickRefresh(); }catch(e){}
  try{ careerRenderHub(CH_TAB); }catch(e){}
}
function ccSponsorPayNow(b){ const mkt=ccMkt(); return Math.round(ccSponsorRate(b, careerReach())*(mkt ? (mkt.rate||1) : CC_SP_NOMKT)); }
// Лучший бренд, который сейчас подпишет: есть свободный слот — самый крупный открытый из неподписанных;
// слоты заняты — только если он платит заметно больше самого слабого (тогда заменит его).
function ccSponsorOffer(){
  const reach=careerReach(), all=ccSponsorsAll();
  const open=CC_SPONSORS.filter(b=>reach>=b.need && !all.some(x=>x.id===b.id));
  const best=open.slice(-1)[0]; if(!best) return null;
  const pay=ccSponsorPayNow(best);
  if(all.length>=ccSpSlots()){
    const weak=all.reduce((m,x)=>!m || x.pay<m.pay ? x : m, null);
    if(!weak || pay<weak.pay*CC_AD_STEP) return null;
    return {id:best.id, need:best.need, cap:best.cap, pay:pay, replaces:weak.id};
  }
  return {id:best.id, need:best.need, cap:best.cap, pay:pay};
}
/* A brand writes to you, because that is how this actually happens.

   The deal was a button on a tile that appeared when a number crossed a line -
   the mode announcing to itself that you were now worth something. Nobody has
   ever been sponsored by a tile. They write, they say what they want on the
   stream and what the slot pays, and it sits in the inbox with the clubs, which
   is where offers live. */
/* ---- The agent ----
   10% cut (real range is 10-20%), taken off money as it lands, as its own expense line; winnings on the board and
   log stay as won.
   Gives what playing can't: clubs look 3 points further down (CAREER_ORG_REACH + CC_AGENT_REACH, a 71 gets seen by
   clubs signing 80s) and offers are a fifth better.
   Signed and ended in the inbox like other deals; ending is free and immediate. */
const CC_AGENT_CUT=0.1, CC_AGENT_REACH=3, CC_AGENT_WAGE=1.2, CC_AGENT_FROM=68;
/* Сильный менеджер берёт не всех (его «1» 23.10 на «агент Kami и SwizzY не возьмёт игрока 70»): с рейтинга игрока
   на 10 ниже своего, но не ниже общего порога CC_AGENT_FROM. Менеджеры на 60–65 берут всех от 68. Слабому игроку
   остаются слабые менеджеры, и к сильному он дорастает. */
function ccAgentMinOvr(a){ return Math.max(CC_AGENT_FROM, ccStaffRating(a)-10); }
function ccAgentTakes(a, ovr){ return ovr>=ccAgentMinOvr(a); }
function careerAgent(){ return (CAREER && CAREER.agent) || null; }
/* The agent is a real person from the scene, not a generated name. Only the
   name, handle and flag are borrowed (public professional identity); the deal is
   this mode's own table (CC_AGENTS), no bio or opinions. One line per person.
   Picked per season, so the same agent all year. Empty list falls back to the
   generator. */
/* Agents are different deals: cut, reach and wage per person, and a weighted draw.
   All four come from one measure, the account's published follower count. Cuts stay
   in the scene's real 10-20% range; bigger accounts open more doors and charge more,
   so it's a trade, not an upgrade. The numbers are the mode's fiction, not quotes.
   weight is how often a career hears from them. */
/* Agents. All nine follower counts read off x.com in one sitting so they're comparable. X rounds above 10k, so Elyxx and Fifty carry the printed figure.
   No hand-written terms on any row. ccAgentTermsOf and ccAgentWeight still let written-in fields win if someone needs it.
   photo is a filename in PHOTO_DIR, falls back to the initials circle. */
const CC_AGENTS=[
  // Founder of JV Agency, Seixal. Manages Vanyak3k and Ajerss, both of whom are
  // on this roster, so he arrives inside a scene the mode already describes.
  {name:'João Venes',   at:'JoaovEU',       nat:'pt', photo:'JoaovEU.jpg',       x:2767},
  /* The rest of them, 18 August: only the ones with a face.

     It stood at sixteen with nine of them drawn as an initials circle, and half
     an inbox of monograms beside half an inbox of people reads as something
     broken. So the nine came out rather than being given a stand-in picture —
     Krish, Zenko, Loripasto76 and Michxsh, who were never more than a working
     name, and the Legacy Agency four and Coach Timmy, who have published handles
     and no portrait that was sent here. Any of them goes back in as one line the
     moment a photograph exists. */
  // Raphael Di Giuseppe, Global Partnerships at G2. X prints 16.3K and no more.
  {name:'G2 Elyxx',     at:'ElyxxM',        nat:null, photo:'ElyxxM.jpg',        x:16300},
  {name:'Arda A',       at:'alhasarda',     nat:null, photo:'alhasarda.jpg',     x:3115},
  // Head of Fortnite for Poyo Esports, Bordeaux.
  {name:'Poyo Naaxo',   at:'NaaxoMNG',      nat:null, photo:'NaaxoMNG.jpg',      x:749},
  // Fortnite manager for Lyost, agent of Belgian talent, Marseille.
  {name:'Lyost Pixelz', at:'PixelzMNG',     nat:null, photo:'PixelzMNG.jpg',     x:2430},
  // Fortnite manager for Lyost, agent of Belgian talent. The account name is
  // the handle until a profile with a name on it arrives.
  {name:'Kiinywz0',     at:'Kiinywz0',      nat:null, photo:'Kiinywz0.jpg',      x:841},
  // Talent manager for Questmind, agent of talents, Pau. Named the way his own
  // profile names him, without the club in front of it.
  {name:'Yeekzie',      at:'Yeekzie7',      nat:'fr', photo:'Yeekzie.jpg',       x:3088},
  /* Eight more, 20 August, off his own screenshots. Every number is the follower
     count the profile showed on the day it was saved, read the same way the nine
     above were — nothing here is hand-priced, so ccAgentWeight still does the
     arithmetic for the cut and for how far above a career the clubs look. */
  /* x.com/F0C8S, 4 584 фолловера, 1 октября. «Focus» — Head of Fortnite в CreedTalent
     (@CreedTalent), affiliated with @ParagonTweaks; «Representing top talent in gaming».
     Страны в профиле нет — nat пустой; значок у имени — бейдж аффилиации, не флаг.
     Имя — просто «Focus», без тега клуба (его слово 1.10). Над Lyost Clap по фолловерам. */
  {name:'Focus',        at:'F0C8S',         nat:null, photo:'F0C8S.jpg',         x:4584},
  // Partnership manager and agent at Lyost.
  {name:'Lyost Clap',   at:'ClapMNG',       nat:'rs', photo:'ClapMNG.jpg',       x:4100},
  // Talent agent at Proxy: EpikWhale, anonzr and Crylix are his.
  {name:'aCE',          at:'AlybiSaCE',     nat:null, photo:'AlybiSaCE.jpg',     x:3114},
  // Fortnite manager at Lyost.
  {name:'IdziU',        at:'IdziU97',       nat:'pl', photo:'IdziU97.jpg',       x:3110},
  // Esports talent agent, and the only one here whose own line is a management
  // service rather than a roster of names.
  /* x.com/roxogg, 2 989 фолловеров, 8 октября (его просьба «добавить менеджера»). «Roxo» — агент в @oneshotmidia, раньше
     @futesportsgg; ведёт phzinfps1, edsonmalado, 916gon, blxckoutz, nightftn, seeyun5, pardalflexlolo «& more» —
     бразильская сцена. Страны в профиле нет — nat пустой. По фолловерам — перед Th0masNL. */
  {name:'Roxo',         at:'roxogg',        nat:null, photo:'roxogg.jpg',        x:2989},
  {name:'Th0masNL',     at:'Th0masNL',      nat:'nl', photo:'Th0masNL.jpg',      x:2311},
  // Head of Fortnite for Lyost.
  {name:'Remss',        at:'RemssMNG',      nat:null, photo:'RemssMNG.jpg',      x:2085},
  // Fortnite-менеджер K13esport, ведёт Verif, wiver, pruzen10 и capri. Страны в профиле нет.
  {name:'K13 Wyze',     at:'wyzefn6',       nat:null, photo:'wyzefn6.jpg',       x:1893},
  // Founder of AL Management, Lille.
  {name:'Adam',         at:'DamlosMNG',     nat:'fr', photo:'DamlosMNG.jpg',     x:1654},
  // Head of Fortnite at MGA.
  {name:'MGA Alexi',    at:'ZedroxMNG',     nat:'fr', photo:'ZedroxMNG.jpg',     x:1376},
  // Head of Fortnite at GLORE.
  {name:'GLORE errie',  at:'errieMNG',      nat:'pl', photo:'errieMNG.jpg',      x:1184},
  // 21 August. Head of Fortnite for Cloud Esport, Carcassonne; Noaggs, Hazyache
  // and squadir23 are his.
  {name:'CLD Razia',    at:'Raziaa_',       nat:'fr', photo:'Raziaa_.jpg',       x:932},
  /* x.com/LC7_MNG, 910 фолловеров, 27 сентября. «Fortnite Manager for ??» —
     клуб в шапке буквально не назван, поэтому имя без тега; агент toryzenfv,
     maddingooo «and more». Страны в профиле нет — nat пустой. Над Artin: у
     новичков вне ручного порядка таблица идёт по фолловерам. */
  {name:'LC7',          at:'LC7_MNG',       nat:null, photo:'LC7_MNG.jpg',       x:910},
  /* x.com/ArtinMNG, 836 фолловеров. Основатель Beyond Agency, в шапке его
     игроки поимённо: Karmyzzz, 7Polish7, GlubFNBR, PligzFN, Trikshotz, Domler_fn.
     Страны в профиле нет — флаг 🇧🇪 в шапке стоит у клуба @rec_2027, а не у
     него, — поэтому nat пустой. Стоит над yaleblan: среди новичков вне ручного
     порядка (CC_SHOP_ORDER) таблица идёт по фолловерам. */
  {name:'Artin',        at:'ArtinMNG',      nat:null, photo:'ArtinMNG.jpg',      x:836},
  /* Ссылка и его число, 24 сентября: x.com/yaleblan, 749 фолловеров;
     портрет — аватарка оттуда же, круглым кропом на белом (в интерфейсе она
     всё равно режется в круг). Имя — хендл, как у Kiinywz0 выше, и по той же
     причине: профиля с именем сюда не приезжало, а выдумывать его нельзя. */
  {name:'X6 Yaleblan',  at:'yaleblan',      nat:null, photo:'yaleblan.jpg',      x:749},
  /* Ссылка и его число, 25 сентября: x.com/DrazoxMNG, 681 фолловер, то
     есть он встаёт последним — список отсортирован по ним, и ccRankPull
     ранжирует менеджеров по месту в нём. Тег организации перед именем — как у
     GLORE errie и CLD Razia выше; FLC — бельгийский клан. Страны в профиле
     нет, поэтому nat пустой, как у yaleblan. Портрет — аватарка оттуда же. */
  {name:'Drazox',       at:'DrazoxMNG',     nat:null, photo:'DrazoxMNG.jpg',     x:681},
  /* x.com/Apolinmng2, 601 фолловер, 27 сентября. «Management at ✧» — клуб в
     шапке не назван, поэтому имя без тега; агент crunkezz, jayzfnn «& more».
     Страны в профиле нет — nat пустой. Между Drazox и Vira Askey: у новичков
     вне ручного порядка таблица идёт по фолловерам. */
  // Тег — @apolinmng: так он сам попросил 29.09 («for the @, you can just use apolinmng»).
  {name:'Apolin',       at:'apolinmng',     nat:null, photo:'Apolinmng2.jpg',    x:601},
  /* x.com/loicmng_, 565 фолловеров, 23 октября (сам попросил в ЛС, страница Notion 22–23.10). «Loïcmng» —
     Head of Fortnite в @NafeOfficiel, менеджер Galaxyache, Gabusg67, 7destroyy, Rezpaaaan, FnKeran «& more».
     Флаг 🇫🇷 в шапке. Между Apolin и BS Skyforce по фолловерам. */
  {name:'Loïcmng',      at:'loicmng_',      nat:'fr', photo:'loicmng_.jpg',      x:565},
  /* x.com/Skyforcemng272, 463 фолловера, 29 сентября. «BS Skyforce» — Head of Fortnite
     в Team Blindspot (@_Team_BS), агент joyyfnrr, NATEKFN1, Karotek_ «& more», staff
     @REC_2027. Страны в профиле нет — nat пустой. Между Apolin и FA ZERKO по фолловерам. */
  {name:'BS Skyforce',  at:'Skyforcemng272', nat:null, photo:'Skyforcemng272.jpg', x:463},
  /* x.com/Zerkomng, 461 фолловер, 27 сентября. Имя — как в профиле, «FA
     ZERKO»; «Head of Fortnite for @?» — клуб не назван. Агент insaneebtw,
     cuhkifn, eonshh «& more». В шапке два флага, 🇫🇷🇵🇹, — берётся первый. */
  {name:'FA ZERKO',     at:'Zerkomng',      nat:'fr', photo:'Zerkomng.jpg',      x:461},
  /* x.com/Lou1sMNG, 385 фолловеров. D.E в RG22 (@RG22ESP), игроки Timur11x и Worizome180.
     Флаги 🇫🇷🇧🇪, берётся первый. */
  {name:'RG22 Lou1s',   at:'Lou1sMNG',      nat:'fr', photo:'Lou1sMNG.jpg',      x:385},
  /* x.com/ZeyroxMNG1, 380 фолловеров. «ancien manager & ceo esport», клиенты не названы, поэтому рейтинг 60.
     Флаги 🇮🇹🇫🇷, берётся первый. */
  {name:'ZEY',          at:'ZeyroxMNG1',    nat:'it', photo:'ZeyroxMNG1.jpg',    x:380},
  /* Скриншот профиля: x.com/askebott — Vira Askey, Марокко,
     Head of Fortnite в Vira Esport, 252 фолловера. Агент семерых, и все семеро
     названы у него в шапке поимённо (zbidak3kk, CyranKids, Litr07, 2Kixu,
     kylxz8, ROITFN, phrygienfnbr) — то же, чем João выше заслужил первую
     строку: человек приезжает внутрь сцены, которую мод уже описывает. */
  {name:'Askey',        at:'askebott',      nat:'ma', photo:'askebott.jpg',      x:252}
];
// The fallback, for a row added before anybody has read its account: fifteen per
// cent, which is the middle of the real range, and one draw like everybody else.
// Nothing on the list is on it today — every row above carries a count.
const CC_AGENT_PLAIN={cut:0.15, reach:2, wage:1.10, weight:1};
const CC_AGENT_X_FLOOR=500, CC_AGENT_X_TOP=25000;
// Where an account sits between the floor and the ceiling, 0 to 1, log-spaced.
function ccAgentPull(x){
  if(!(x>0)) return null;
  const lo=Math.log(CC_AGENT_X_FLOOR), hi=Math.log(CC_AGENT_X_TOP);
  return clamp((Math.log(x)-lo)/(hi-lo), 0, 1);
}
// The three terms an account buys. A written-in term always wins: see the note.
function ccAgentTermsOf(a){
  const k=ccRankPull(CC_AGENTS, a);
  const base = k==null ? CC_AGENT_PLAIN : {
    cut:  Math.round((0.12+k*0.06)*100)/100,
    reach: 2+Math.round(k*3),
    wage: Math.round((1.10+k*0.20)*100)/100
  };
  return {cut:  a && a.cut!=null  ? a.cut  : base.cut,
          reach:a && a.reach!=null? a.reach: base.reach,
          wage: a && a.wage!=null ? a.wage : base.wage};
}
/* How often a career hears from somebody at all, which is the other half of
   what an account is worth.

   The terms were taken off the follower count on 18 August and this was not: it
   stayed at one apiece with a hand-written three on João, so a 3,000-follower
   manager wrote as often as one nobody has read. His ask, 19 August — the size
   of the account is what makes a manager a catch, so it decides both halves.
   Same curve the terms are on, so the two cannot drift apart: an unread account
   is the ordinary one draw, the biggest is five, and a written-in weight still
   wins where one exists, the same as a written-in term does. */
function ccAgentWeight(a){
  if(a && a.weight!=null) return a.weight;
  const k=ccRankPull(CC_AGENTS, a);
  return k==null ? CC_AGENT_PLAIN.weight
                 : Math.round((1+k*4)*10)/10;
}
// The deal a career is actually on, which is the signed one. An agent signed
// before the terms were his own keeps the mode's old numbers rather than being
// quietly moved onto somebody else's.
/* Менеджер, которого попросили обойти клубы.

   Правка: «дать возможность не только читать от менеджера
   орги, но и самому попросить менеджера написать организатору, чтоб подписали
   игрока». До этого менеджер был односторонним: он приносил, ты читал.

   Просьба стоит две недели и делает ровно то, за что менеджеру и платят —
   расширяет круг клубов, которые вообще смотрят (CAREER_ORG_REACH + reach в
   careerOrgOffers). Не гарантия контракта: клуб всё равно решает сам, и выше
   потолка своей полосы игрок не прыгнет. Пока просьба в работе, кнопки нет —
   иначе это была бы кнопка «дай контракт», нажимаемая каждый день. */
/* 60, не 14: просьба должна дожить до ПЕРВОГО окна предложений. Между Solo Series в январе и
   первым дивизионным кубком (2 февраля) проходит больше двух недель, и просьба
   истекала за день до того, как клуб мог написать (скриншот: «expect their offer this
   window» — и три клуба без Shimo). Просьба закрывается, когда клуб сел в окно (pitch.done),
   а 60 дней — только потолок на случай, когда окон нет вовсе. */
const CC_PITCH_DAYS=60, CC_PITCH_REACH=3;
function careerPitchOn(){
  const p=CAREER && CAREER.pitch;
  return !!(p && p.until && !p.done && careerToday() <= p.until);
}
function careerPitchClub(){
  return careerPitchOn() ? (CAREER.pitch.club||null) : null;
}
function careerPitchReach(){ return careerPitchOn() ? CC_PITCH_REACH : 0; }
/* До какого дня «идут переговоры» на плитке: до ближайшей сессии кубка дивизиона — окно
   предложений открывается после неё (см. runCareerCup → careerOrgOffers). Потолок просьбы
   (pitch.until, 60 дней) показывается только там, где кубков впереди нет. */
function careerPitchDue(){
  const p=CAREER && CAREER.pitch; if(!p) return null;
  const today=careerToday();
  let due=null;
  (typeof ccCupWeeks==='function' ? ccCupWeeks() : []).forEach(w=>{
    [w[1], w[2]].forEach(d=>{ if(d && d>=today && d<=p.until && (!due || d<due)) due=d; });
  });
  // Письмо приходит, когда день уже сдвинут за сессию — назавтра после неё.
  return due ? ccAddDays(due, 1) : p.until;
}
/* Кому написать — выбирает игрок.

   Правка поверх первой версии: «именно спросить, клуб который
   хочет игрок, например Спирит, чтоб выбор был». Просьба «обойди клубы» была
   про всех сразу и ничем не отличалась от ожидания; адресная — это решение.

   Список — те, до кого менеджер вообще может дотянуться: разрыв уровня клуба и
   рейтинга игрока в пределах общего охвата плюс то, что добавляет сама просьба
   (CC_PITCH_REACH). Клуб, в котором игрок уже стоит, из списка выпадает. */
/* Список — ВСЕ клубы сцены, кроме своего. Отзыв: «где игрок
   просит менеджера найти организацию, чтоб там все были». Раньше список резался
   охватом менеджера и шестью строками — и клубов, о которых игрок знает, в нём
   не было. Дотянется ли менеджер — по-прежнему решает сама просьба
   (careerAgentPitch: разрыв уровня и рейтинга против охвата); список только
   показывает выбор и честно пишет разрыв под каждым клубом. */
function careerPitchClubs(){
  const pl=CAREER && CAREER.player;
  if(!pl) return [];
  const mine=(CAREER.org && CAREER.org.name)||null;
  return careerOrgPool()
    .filter(o=>o.name!==mine)
    .sort((a,b)=>b.tier-a.tier);
}
/* Та же просьба, но нажатая с плитки менеджера.

   Диалог для неё заводится сам (ccAgentThreadOf), потому что просьба обязана
   лечь именно в переписку с ним — отзыв: «это сообщение автоматически
   пишется в лс менеджеру». Клуб по-прежнему выбирает игрок: список открывает
   тот же ccClubPickOpen, что и в самом диалоге. */
function careerPitchAsk(){
  const on=careerAgent();
  if(!on || careerPitchOn()) return;
  const t=ccAgentThreadOf(on.name, true);
  if(!t) return;
  careerSave();
  ccClubPickOpen(t.id);
}
function careerAgentPitch(id, club){
  if(!careerAgent() || careerPitchOn() || !club) return;
  const t=careerDms().find(x=>x.id===id);
  const o=careerOrgPool().find(x=>x.name===club);
  if(!o) return;
  CAREER.pitch={club:o.name, since:careerToday(), until:ccAddDays(careerToday(), CC_PITCH_DAYS)};
  if(t){
    careerDmPush(t, 'you', 'dmPitchAskClub', [o.name]);
    careerDmPush(t, 'them', 'dmPitchOkClub', [o.name]);
  }
  /* Ответ клуба — сразу, а не «когда-нибудь». Разрыв решает: в пределах охвата
     менеджера клуб готов посмотреть (и его предложение принудительно попадает
     в это окно, см. careerOrgOffers), выше — вежливый отказ, и просьба
     закрывается, чтобы можно было написать другому. */
  const gap=o.tier-CAREER.player.ovr;
  const ok=gap<=CAREER_ORG_REACH+careerAgentTerms().reach+CC_PITCH_REACH*0.5;
  /* Сначала — что он съездил и поговорил, и только потом чем кончилось.
     Правка: «что переговоры провёл». Без этой строки клуб
     отвечал будто сам по себе, и работа менеджера не была видна вовсе. */
  if(t){ careerDmPush(t, 'them', 'dmPitchTalked', [o.name]);
         careerDmPush(t, 'them', ok ? 'dmPitchYes' : 'dmPitchNo', [o.name]); }
  /* Клуб готов, но игрок ещё не показал результат (правило 2.10, ccOrgProven: два вечера в топ-10) — менеджер говорит
     это прямо, просьба остаётся в силе (9.10: ответ был «жди предложение», а оно молча не приходило). */
  if(ok && t && !ccOrgProven()){
    const have=(CAREER.career.log||[]).filter(ccOrgResult).length;
    careerDmPush(t, 'them', 'dmPitchProve', [o.name, Math.max(1, CC_ORG_PROOF-have)]);
  }
  if(!ok) CAREER.pitch=null;
  careerSave();
  careerRenderHub('social');
}
function careerAgentTerms(){
  const on=careerAgent();
  if(!on) return {cut:0, reach:0, wage:1};
  // Agreed terms are stored on the deal, so a career signed under an old list
  // keeps what it signed. Anything missing is read off the account.
  const of=ccAgentTermsOf(CC_AGENTS.find(a=>a.name===on.name) || on);
  return {cut: on.cut!=null ? on.cut : of.cut,
          reach: on.reach!=null ? on.reach : of.reach,
          wage: on.wage!=null ? on.wage : of.wage};
}
/* Who somebody is, as opposed to what they agreed to.

   The deal belongs to the contract — a cut signed last season stays signed —
   but the face and the handle belong to the person, and looking them up on the
   save meant a career that signed before a photo existed never got one. His
   report, 18 August: the tile still showed the initials. So presentation is read
   off the roster by name every time it is drawn, and only the terms are read off
   what was signed. Anybody not on the list any more keeps whatever the save has. */
function ccAgentCard(name){
  return CC_AGENTS.find(a=>a.name===name) || null;
}
function ccAgentFace(on){
  const card=on ? ccAgentCard(on.name) : null;
  return {photo:(card && card.photo) || (on && on.photo) || null,
          at:(card && card.at) || (on && on.at) || null};
}
function ccAgentPick(){
  const rnd=careerRng(ccHashStr('agent|'+(CAREER.career.season||1)));
  if(!CC_AGENTS.length)
    return {name:careerLadderPlayer(rnd, 60, new Set()).handle, at:null, nat:null};
  const ovr=CAREER.player.ovrExact!=null ? CAREER.player.ovrExact : CAREER.player.ovr;
  const pool=CC_AGENTS.filter(a=>ccAgentTakes(a, ovr)), list=pool.length ? pool : CC_AGENTS;
  const total=list.reduce((s,a)=>s+ccAgentWeight(a), 0);
  let n=rnd()*total;
  for(const a of list){ n-=ccAgentWeight(a); if(n<0) return a; }
  return list[0];
}
function careerAgentDm(){
  if(careerAgent()) return null;
  const ovr=CAREER.player.ovrExact!=null ? CAREER.player.ovrExact : CAREER.player.ovr;
  // Nobody represents a career nobody is looking at. The line is the one the
  // clubs already use for looking at all — see careerOrgOffers.
  if(ovr<CC_AGENT_FROM) return null;
  const have=careerDms().find(t=>t.who && t.who.agent);
  if(have) return have;
  const who=ccAgentPick();
  // org:true keeps the thread in the clubs pile, where the business is; the
  // agent flag is what stops it being drawn as a club. See the inbox row.
  const t=careerDmThread({handle:who.name, at:who.at||null, nat:who.nat||null,
                          photo:who.photo||null,
                          ovr:null, role:'roleIGL', roster:false,
                          org:true, agent:true});
  t.state='agent';
  /* His own terms, in his own opening line: two agents no longer say the same
     sentence, and the one worth signing says a better number in it.

     Off the account, like everything else about him. This read ccAgentTerms,
     which was the written-in term or the ordinary deal and never looked at the
     follower count — so every manager but João opened with 15% and +2 whoever
     he was, while the list beside the message and the contract he actually
     signed were both priced off his account. The same man quoted two different
     deals depending on which screen you read him on. */
  const terms=ccAgentTermsOf(who);
  t.who.cut=terms.cut; t.who.reach=terms.reach; t.who.wage=terms.wage;
  careerDmPush(t, 'them', 'dmAgent', [Math.round(terms.cut*100), terms.reach]);
  careerSave();
  return t;
}
/* Диалог КОНКРЕТНОГО менеджера — по имени, а не «любого со значком».

   Правка: «я взял его... но пишет он, пусть пишет мой
   менеджер». Подпись искала тред первым попавшимся `find(x=>x.who.agent)`, и
   «с этого дня разговариваю с клубами я» уходило в диалог того, кто просто
   написал раньше. А если взятый менеджер в почту не писал вовсе (его выбрали
   из списка), треда у него не было — и согласие ложилось в чужой навсегда.

   Поэтому: находим по имени, а нет — заводим. Диалог с тем, кто на тебя
   работает, существовать обязан: в нём стоят и просьба найти клуб, и разрыв. */
function ccAgentThreadOf(name, make){
  if(!name) return null;
  const have=careerDms().find(x=>x.who && x.who.agent && hKey(x.who.handle)===hKey(name));
  if(have || !make) return have || null;
  const a=CC_AGENTS.find(x=>x.name===name) || {name:name};
  const t=careerDmThread({handle:a.name, at:a.at||null, nat:a.nat||null,
                          photo:a.photo||null,
                          ovr:null, role:'roleIGL', roster:false,
                          org:true, agent:true});
  const terms=ccAgentTermsOf(a);
  t.who.cut=terms.cut; t.who.reach=terms.reach; t.who.wage=terms.wage;
  return t;
}
/* И чужие письма закрываются, когда своё подписано.

   «Пусть не пишут, когда есть менеджер» — отзыв. Новых писем не будет
   (careerAgentDm выходит на careerAgent), но уже лежащее предложение так и
   висело с кнопкой «подписать», а под ним рисовались действия ТВОЕГО
   менеджера — чужой диалог предлагал разорвать контракт с другим человеком. */
function ccAgentOthersOff(name){
  careerDms().forEach(function(t){
    if(!t.who || !t.who.agent) return;
    if(hKey(t.who.handle)===hKey(name)) return;
    if(t.state==='agent') t.state='agentPast';
  });
}
function careerSignAgent(name){
  const cr=CAREER.career;
  if(careerAgent()) return false;
  const who=CC_AGENTS.find(a=>a.name===name);
  if(!who) return false;
  const ovr=CAREER.player.ovrExact!=null ? CAREER.player.ovrExact : CAREER.player.ovr;
  // Nobody represents a career nobody is looking at — the same line the letter
  // is gated on, see careerAgentDm. И свой порог у каждого: ccAgentMinOvr.
  if(ovr<CC_AGENT_FROM || !ccAgentTakes(who, ovr)) return false;
  const terms=ccAgentTermsOf(who);
  CAREER.agent={name:who.name, at:who.at||null, photo:who.photo||null,
                cut:terms.cut, reach:terms.reach, wage:terms.wage,
                since:careerToday()};
  // Whatever he was going to say in the inbox, he has said it in person now —
  // и говорит это ОН, в своём диалоге. См. ccAgentThreadOf.
  const t=ccAgentThreadOf(who.name, true);
  if(t){ t.state='agentOn'; careerDmPush(t, 'them', 'dmAgentYes'); }
  ccAgentOthersOff(who.name);
  ccAgentPickClose();
  careerSave();
  careerRenderHub();
  return true;
}
/* All of them behind a press, priced per person: the cut they take, how much
   further clubs look, and what that does to an offer. */
function ccAgentPickOpen(){
  const ovr=CAREER.player.ovrExact!=null ? CAREER.player.ovrExact : CAREER.player.ovr;
  const on=careerAgent();
  const rows=ccByHand(CC_AGENTS).map(a=>{
    const t=ccAgentTermsOf(a);
    const cut=t.cut, reach=t.reach, wage=t.wage;
    const mine=on && on.name===a.name;
    const need=ccAgentMinOvr(a), can=!on && ovr>=CC_AGENT_FROM && ovr>=need;
    return `<div class="cc-buy${mine?' own':''}">
      ${a.photo ? `<img class="cc-buy-img cc-buy-face" src="${PHOTO_DIR}${esc(a.photo)}" alt=""
           loading="lazy" onerror="this.remove()">` : ''}
      <div class="cc-buy-in"><b><span class="cc-buy-nm">${esc(a.name)}</span> ${ccStaffBadge(ccStaffRating(a)).replace('cc-staff-rt', 'cc-staff-rt mgf-rt')}</b>
        <i class="cc-buy-who">${a.x ? '👥 '+ccFollowers(a.x)+' · ' : ''}${a.at ? '@'+esc(a.at) : ''}</i>
        <span class="cc-buy-chips"><em>${L().ccAgentCutRow} ${Math.round(cut*100)}%</em><em class="up">${L().ccAgentReachRow} +${reach}</em><em class="up">${L().ccAgentWageRow} +${Math.round((wage-1)*100)}%</em></span></div>
      ${mine ? `<span class="cc-owned">${L().ccAgentYours}</span>`
             : `<button class="ch-sign"${can?'':' disabled'} onclick="careerSignAgent('${
                 jsq(a.name)}')">${!on && ovr<need && need>CC_AGENT_FROM ? esc(L().ccAgentNeed(need)) : L().ccAgentSign}</button>`}
    </div>`;
  }).join('');
  document.getElementById('agentPickBody').innerHTML=
    `<h4 class="cc-pick-h">${L().ccAgentTag}</h4>
     <div class="ch-hint">${ovr<CC_AGENT_FROM ? L().ccAgentFrom(CC_AGENT_FROM) : L().ccAgentPickHint}</div>
     <div class="cc-buys">${rows}</div>`;
  document.getElementById('agentPickModal').style.display='flex';
  document.addEventListener('keydown', ccAgentPickKey);
}
/* Меню «кому написать». Строки — те клубы, до кого менеджер дотягивается
   (careerPitchClubs): герб, название, уровень и разрыв с твоим рейтингом.
   Нажал — он пошёл говорить.

   Правка: «а менеджера как попросить, чтоб оргу нашёл — добавь
   в менюшке, типа какую игрок хочет». Раньше клубы стояли шестью узкими
   фишками в подвале переписки: на телефоне это ряд обрезанных названий, и что
   это вообще выбор — не читалось.

   Открывается из переписки с менеджером и оттуда же берёт id ветки: ответ
   клуба приходит в тот же разговор, а не отдельным уведомлением. */
function ccClubPickOpen(id){
  if(!careerAgent() || careerPitchOn()) return;
  const pl=CAREER && CAREER.player;
  const q=s=>jsq(s);
  const rows=careerPitchClubs().map(o=>`<div class="cc-buy">
      <div class="cc-buy-in"><b>${clubLogoHTML(o.name, true)}${esc(o.name)}</b>
        <span>${L().ccPitchTier(o.tier)}${
          pl ? ' · '+L().ccPitchGap(Math.max(0, Math.round(o.tier-pl.ovr))) : ''} · 👥 ${ccOrgFolText(ccOrgFollowers(o.name, o.tier))}</span></div>
      <button class="ch-sign" onclick="ccClubPickAsk('${q(id)}','${q(o.name)}')">${
        L().ccPitchAskBtn}</button>
    </div>`).join('');
  document.getElementById('clubPickBody').innerHTML=
    `<h4 class="cc-pick-h">${L().ccPitchPickTitle}</h4>
     <div class="ch-hint">${L().ccPitchPickHint}</div>
     <div class="cc-buys">${rows || '<div class="ch-hint">'+L().ccPitchNone+'</div>'}</div>`;
  document.getElementById('clubPickModal').style.display='flex';
  document.addEventListener('keydown', ccClubPickKey);
}
function ccClubPickAsk(id, club){
  ccClubPickClose();
  careerAgentPitch(id, club);
  // Ответ клуба лежит в переписке — туда и возвращаемся.
  careerTab('social');
  careerDmOpen(id);
}
function ccClubPickClose(){
  const m=document.getElementById('clubPickModal');
  if(m) m.style.display='none';
  document.removeEventListener('keydown', ccClubPickKey);
}
function ccClubPickKey(e){ if(e.key==='Escape') ccClubPickClose(); }
function ccAgentPickClose(){
  const m=document.getElementById('agentPickModal');
  if(m) m.style.display='none';
  document.removeEventListener('keydown', ccAgentPickKey);
}
function ccAgentPickKey(e){ if(e.key==='Escape') ccAgentPickClose(); }
function careerSignAgentFromDm(id){
  const t=careerDms().find(x=>x.id===id);
  if(!t || !t.who || !t.who.agent || careerAgent()) return;
  // The deal is stored with the man, so changing the table later cannot rewrite
  // a contract somebody already signed. The thread carries the three numbers he
  // opened with, so this reads them back rather than pricing him again.
  const terms=ccAgentTermsOf(t.who);
  CAREER.agent={name:t.who.handle, at:t.who.at||null, photo:t.who.photo||null,
                cut:terms.cut, reach:terms.reach, wage:terms.wage,
                since:careerToday()};
  t.state='agentOn';
  careerDmPush(t, 'them', 'dmAgentYes');
  // Остальные письма менеджеров закрываются: работает один. См. ccAgentOthersOff.
  ccAgentOthersOff(t.who.handle);
  careerSave();
  careerRenderHub('social');
}
function careerEndAgentFromDm(id){
  const t=careerDms().find(x=>x.id===id);
  if(!t || !careerAgent()) return;
  CAREER.agent=null;
  t.state='agentOff';
  careerDmPush(t, 'you', 'dmAgentEnd');
  careerSave();
  careerRenderHub('social');
}
// The same ending, pressed from the tile on the centre instead of from inside
// the conversation — the line still lands in the thread, because that is where
// it was said.
function careerEndAgent(){
  const t=careerDms().find(x=>x.who && x.who.agent);
  if(t) return careerEndAgentFromDm(t.id);
  CAREER.agent=null;
  careerSave();
  careerRenderHub();
}
// What lands in the hand, and what the agent takes out of it on the way. The
// winnings are untouched: a board of prize money is a board of prize money.
function ccPayIn(mine, now){
  const cr=CAREER.career;
  if(!(mine>0)) return 0;
  cr.earnings=(cr.earnings||0)+mine;
  /* The club's share of what was won, which used to be the manager's.

     His correction, 19 August. A manager is paid out of the wage he negotiated —
     see careerPayWages, where his cut still is — and the club is paid out of the
     board, which is what a contract actually says. */
  const cut=Math.round(mine*careerOrgCut());
  if(cut){
    cr.orgCut=(cr.orgCut||0)+cut;
  }
  /* ВЫПЛАТА НЕ СРАЗУ (16.10, его «4»: «задержка призовых»). Epic платит призовые через несколько недель после турнира —
     до этого они «ожидаются»: видны под балансом, на баланс приходят в день выплаты (careerPayTick), с письмом.
     В игре вдвоём — сразу: там балансы сверяются между браузерами (ccMpOn). Заработок (earnings) пишется сразу. */
  if(!now && !(typeof ccMpOn==='function' && ccMpOn())){
    cr.payQ=(cr.payQ||[]).concat([{amt:mine-cut, day:careerToday(), due:ccAddDays(careerToday(), CC_PAY_DELAY)}]);
    return mine-cut;
  }
  cr.balance=(cr.balance||0)+(mine-cut);
  return mine-cut;
}
const CC_PAY_DELAY=30;
/* Когда придут призовые (17.10, его вопрос «где посмотреть, когда призовые придут?»): под балансом — сумма
   и ближайшая дата, по нажатию — весь список выплат с датами. */
let CC_PAY_OPEN=false;
function ccPayPendHTML(){
  const q=((CAREER.career.payQ)||[]).slice().sort((a,b)=>a.due<b.due?-1:a.due>b.due?1:0);
  if(!q.length) return '';
  const rows=CC_PAY_OPEN ? '<span class="ch-pend-list">'+q.map(x=>'<span>'+ccMoney(x.amt)+' — '+esc(ccDayLabel(x.due))+'</span>').join('')+'</span>' : '';
  return '<small class="ch-pend" role="button" tabindex="0" onclick="CC_PAY_OPEN=!CC_PAY_OPEN;careerRenderHub()" title="'+esc(L().ccPayPendAll)+'">+'+
    ccMoney(ccPayPending())+' · '+esc(ccDayLabel(q[0].due))+(q.length>1 ? ' ▾' : '')+rows+'</small>';
}
function ccPayPending(){ const q=(CAREER && CAREER.career && CAREER.career.payQ)||[]; return q.reduce((a,x)=>a+(x.amt||0), 0); }
const CC_PAY_WHO={handle:'Epic Payouts', verified:true, roster:false, staff:'pay'};
function careerPayTick(){
  const cr=CAREER && CAREER.career; if(!cr || !(cr.payQ||[]).length) return 0;
  const today=careerToday(), due=cr.payQ.filter(x=>x.due<=today);
  if(!due.length) return 0;
  const sum=due.reduce((a,x)=>a+(x.amt||0), 0);
  cr.payQ=cr.payQ.filter(x=>x.due>today);
  cr.balance=(cr.balance||0)+sum;
  try{ careerDmPush(ccStaffThread(CC_PAY_WHO), 'them', 'ccDmPayout', [ccNum(sum), due.length]); }catch(e){}
  return sum;
}
/* ХОТФИКС ПОСРЕДИ СЕЗОНА (16.10, его «1»). Раз в 4+ недели, не раньше двух недель от начала сезона и не больше двух
   за сезон: Epic выключает в соревновательном одно оружие — до конца сезона его нет ни в сундуках, ни в наборах
   (ccLootPool). Последний автомат и последний дробовик не трогаются. Пост от аккаунта сцены, реакция — как на мету. */
const CC_HOTFIX_GAP=28, CC_HOTFIX_ODDS=0.08;
function careerHotfixTick(){
  const cr=CAREER && CAREER.career; if(!cr) return;
  if(typeof ccMpOn==='function' && ccMpOn()) return;
  const m=cr.meta, today=careerToday();
  if(!m || !m.from || ccDaysBetween(m.from, today)<14) return;
  const h=(cr.hotfix && cr.hotfix.sid===m.id) ? cr.hotfix : null;
  if(h && (h.n>=2 || ccDaysBetween(h.day, today)<CC_HOTFIX_GAP)) return;
  const rnd=careerRng(ccHashStr('hotfix|'+today+'|'+m.id));
  if(rnd()>CC_HOTFIX_ODDS) return;
  const k=ccLootSet(), pool=(CC_LOOT_BY_SET[k]||{}).weapons||[];
  const out=new Set((h && h.vault)||[]);
  const names=[...new Set(pool.map(w=>w.name))].filter(n=>!out.has(n));
  const cand=names.filter(n=>{ const ic=(pool.find(w=>w.name===n)||{}).icon;
    return pool.some(w=>w.icon===ic && w.name!==n && !out.has(w.name)); });
  if(!cand.length) return;
  const pick=cand[Math.floor(rnd()*cand.length)];
  cr.hotfix={sid:m.id, set:k, vault:[...out, pick], n:((h && h.n)||0)+1, day:today};
  careerNews('flat', 'ccNewsHotfix', [pick, Math.floor(rnd()*3)]);
}
/* ПРОБЛЕМЫ СО СВЯЗЬЮ (16.10, его «2»). В день онлайн-турнира с шансом CC_TECH_ODDS «интернет лагает с утра» — минус
   CC_TECH_PEN к форме на этот день (careerForm), видно в шапке и постом. На ЛАНе (gc) не бывает. Бросок посеян днём:
   перезагрузка не перебросит. После крупного вечера сцена иногда пишет о перехосте игры или дисквалификации команды
   за тиминг (ccTechSceneAfterNight) — новости, без чисел. */
const CC_TECH_ODDS=0.05, CC_TECH_PEN=0.6;
function ccTechToday(){
  const cr=CAREER && CAREER.career; if(!cr) return null;
  if(typeof ccMpOn==='function' && ccMpOn()) return null;
  const today=careerToday();
  if(cr.tech && cr.tech.day===today) return cr.tech.kind ? cr.tech : null;
  let on=[]; try{ on=(careerYearDays().get(today)||[]).filter(e=>e && e.kind!=='gc'); }catch(e){}
  const hit=on.length>0 && careerRng(ccHashStr('tech|'+today+'|'+(cr.season||1)))()<CC_TECH_ODDS;
  cr.tech={day:today, kind:hit ? 'net' : null};
  if(hit) careerNews('bad', 'ccPostTechNet', [ccHashStr(today)%3]);
  return hit ? cr.tech : null;
}
function ccTechPen(){ try{ return ccTechToday() ? CC_TECH_PEN : 0; }catch(e){ return 0; } }
function ccTechSceneAfterNight(total){
  const cr=CAREER && CAREER.career; if(!cr || !(total>=30)) return;
  if(typeof ccMpOn==='function' && ccMpOn()) return;
  const today=careerToday();
  let big=false; try{ big=(careerYearDays().get(today)||[]).some(e=>e && (e.kind==='major' || e.kind==='gc' || e.kind==='final')); }catch(e){}
  if(!big) return;
  const rnd=careerRng(ccHashStr('techscene|'+today));
  const r=rnd();
  if(r<0.12) careerNews('flat', 'ccNewsRehost', [2+Math.floor(rnd()*4)]);
  else if(r<0.18){
    let duos=[]; try{ duos=(careerPools().duos||[]).filter(d=>d && d.cards && d.cards.length>=2); }catch(e){}
    if(duos.length>20){ const d=duos[10+Math.floor(rnd()*(duos.length-10))];
      careerNews('flat', 'ccNewsTeamingDq', [ccHandle(d.cards[0].handle), ccHandle(d.cards[1].handle)]); }
  }
}
function careerSponsorDm(){
  const offer=ccSponsorOffer();
  if(!offer) return null;
  /* Found by which brand it is, not by what the brand is called today.

     His screenshot, 17 August: "Провайдер" and "Internet provider" sitting in
     the club list as two different companies, and the same again for the
     peripheral brand. A thread is found by its handle and the handle was the
     translated name, so a career that switched language stopped recognising the
     brand it had already heard from and a second one wrote in. The name is
     display, and display is decided when the screen is drawn - the rule the rest
     of this file already follows for every sentence in the inbox. */
  const name=L()['ccSponsor'+offer.id];
  const t=careerDms().find(x=>x.who && x.who.brand===offer.id)
       || careerDmFind(name)
       || careerDmThread({handle:name, ovr:null, role:'roleIGL',
                          roster:false, org:true, brand:offer.id});
  // An older thread carries brand:true and its name in whichever language it
  // arrived in. Give it the id, so it is never mistaken for a second company.
  t.who.brand=offer.id;
  // The same brand can come back with a better rate, which is the point of the
  // rate moving at all - so it is the terms that decide whether this is news.
  // Тот же бренд пишет снова, только если ставка выросла заметно (CC_AD_STEP), а не на каждый новый подписчик.
  if(t.sponsor && t.sponsor.id===offer.id && offer.pay<t.sponsor.pay*CC_AD_STEP) return t;
  if(t.state==='signed' && ccSponsorsAll().some(x=>x.id===offer.id)) return t;
  t.sponsor={id:offer.id, pay:offer.pay};
  t.state='sponsor';
  careerDmPush(t, 'them', 'dmSponsor', [name, ccNum(offer.pay)]);
  careerSave();
  return t;
}
function careerSignSponsorFromDm(id){
  const t=careerDms().find(x=>x.id===id);
  if(!t || !t.sponsor) return;
  if(!careerSignSponsor(t.sponsor.id)) return;
  t.state='signed';
  careerDmPush(t, 'them', 'dmSponsorYes');
  t.sponsor=null;
  careerSave();
  careerRenderHub('social');
}
function careerSignSponsor(id){
  const s=CC_SPONSORS.find(x=>x.id===id); if(!s) return false;
  if(careerReach()<s.need) return false;
  const all=ccSponsorsAll(); if(all.some(x=>x.id===id)) return false;
  if(all.length>=ccSpSlots()){
    const offer=ccSponsorOffer();
    if(!offer || offer.id!==id || !offer.replaces) return false;
    CAREER.sponsors=all.filter(x=>x.id!==offer.replaces);
  }
  const pay=ccSponsorPayNow(s);
  CAREER.sponsors.push({id:s.id, pay:pay, since:careerToday(), paid:0});
  ccSponsorsAll();
  careerNews('good', 'ccNewsSponsor', [L()['ccSponsor'+s.id], ccNum(pay)]);
  careerEvent('tlSponsor', [L()['ccSponsor'+s.id]]);
  careerSave();
  careerRenderHub();
  ccSpPickRefresh();
  return true;
}
function careerDropSponsor(id){
  CAREER.sponsors=ccSponsorsAll().filter(x=>x.id!==id); ccSponsorsAll();
  careerSave(); careerRenderHub(); ccSpPickRefresh();
}

/* Monthly club objective. The yearly contract goal gave no week any weight, so the club also asks for one thing
   per month (a cut, a top 20, a podium, sized on the current division) and pays a bonus of one month's wage.
   Nothing is tracked: results already carry day, place and pass, so the month is just the rows dated inside it. */
function ccMonthKey(iso){ return String(iso||careerToday()).slice(0,7); }
function ccMonthName(key){ return L().calMonths[Number(String(key).slice(5,7))-1]||key; }

/* Player of the month / season: sum of a name's rated results (Power Rankings, Epic's multiplier table) dated
   inside the month, at least two to qualify.
   Read off the same board as History, which keeps each name's best 20 of the year. Fine here: a winning month
   survives the prune by definition.
   Who posts it is ccPressWorthy's call: scene account for Division 1, the player's own post below. */
const CC_AWARD_MIN=2;
// Сколько человек стоит в церемонии игрока года. Пять — как в футбольной
// пятёрке номинантов: победитель и те, кто был рядом. См. careerAwardSeason.
const CC_AWARD_TOP=5;
function careerAwardBoard(fromDay, toDay){
  const t=careerPrTally();
  const out=[];
  Object.keys(t.rows).forEach(function(name){
    const row=t.rows[name];
    const inside=(row.v||[]).filter(e=>e[1]>=fromDay && e[1]<toDay);
    if(inside.length<CC_AWARD_MIN) return;
    out.push({name:name, pts:inside.reduce((s,e)=>s+e[0],0),
              events:inside.length, you:!!row.you});
  });
  return out.sort((a,b)=>b.pts-a.pts || b.events-a.events);
}
function careerAwards(){
  const cr=CAREER.career;
  if(!cr.aw) cr.aw={last:ccMonthKey(careerToday()), won:[]};
  return cr.aw;
}
// How many of each the career has, which is what a summary wants to print.
function careerAwardsWon(kind){
  return (careerAwards().won||[]).filter(a=>a.you && (!kind || a.kind===kind)).length;
}
// Called wherever the clock moves. A month that has ended is judged once.
function careerAwardCheck(){
  const cr=CAREER.career, aw=careerAwards();
  const now=ccMonthKey(careerToday());
  if(aw.last===now) return null;
  const past=aw.last;
  aw.last=now;
  // The month that just ended, in the career's own absolute days.
  const from=ccAbsDay(cr.season, past+'-01');
  const board=careerAwardBoard(from, from+31);
  if(!board.length) return null;
  const win=board[0];
  aw.won=aw.won||[];
  aw.won.push({kind:'month', key:past, season:cr.season, name:win.name, you:!!win.you, pts:Math.round(win.pts||0), ev:win.events||0});
  if(win.you){
    careerReachAdd(CC_REACH_DIV(cr.division)*8);
    careerNews('good', 'ccNewsAwardYou', [ccMonthName(past)]);
  } else {
    careerNews('flat', 'ccNewsAward', [win.name, ccMonthName(past)]);
  }
  careerSave();
  return win;
}
/* НАГРАДЫ СЕЗОНА — четыре номинации рядом с игроком года. Отзыв («8 делай»: «награды
   года: голосование сцены после Глобалов — лучший игл, фраггер, новичок, дуо»). Всё читается из
   того, что карьера уже пишет: игл и новичок — по ПР сезона среди карточек с ролью игла / не
   старше CC_AW_ROOKIE_AGE; фраггер — по килам в журнале вечеров (cr.plog); дуо — пара сцены с
   наибольшей суммой ПР (плюс твоя пара). «Голоса сцены» — доли метрики среди тройки номинантов:
   не выдумка, а та же таблица в процентах. Тройки пишутся в саму награду (aw.won, kind 'cat'),
   чтобы церемония не пересчитывалась по изменившемуся ростеру. */
const CC_AW_ROOKIE_AGE=17, CC_AW_TOP=3;
/* В трио-сезон (2021, 2025, трио-главы продолжения) номинация — «Трио года», а не «Дуо года»
   (17.10, Notion «fncsdraft 15.10»: «25 год и в трио сезоны номинация была дуо года»). Состав —
   пара пула и её третий из cr.trios, сумма ПР всех троих; своя тройка — ты и оба напарника. */
const CC_AW_CATS=['igl','frag','rookie','duo','trio'];
function ccAwCatLabel(cat){ const T=L(); return {igl:T.ccAwIgl, frag:T.ccAwFrag, rookie:T.ccAwRookie, duo:T.ccAwDuo, trio:T.ccAwTrio||'Trio of the Year'}[cat]||cat; }
function careerAwardCats(){
  const cr=CAREER.career, s=cr.season;
  const from=Math.max(0, (s||1)-1)*365;
  const board=careerAwardBoard(from, from+365);
  const me=careerCard(), meKey=me ? hKey(me) : '';
  const cardOf=n=>(meKey && hKey(n)===meKey) ? me : ccWhoCard(n);
  // Роль карточки сцены — из опубликованного списка ролей (realRoleKey: I/F), у своей — из карьеры.
  const roleOf=c=>{ if(!c) return null; if(c===me) return (CAREER.player && CAREER.player.role)||c._roleKey||null; let r=null; try{ r=realRoleKey(c); }catch(e){} return r||c._roleKey||c.role||null; };
  const ageOf=c=>!c ? 99 : (c===me ? ccPlayerAge() : (c.age||99));
  const share=rows=>{ const top=rows.slice(0, CC_AW_TOP); const sum=top.reduce((a,r)=>a+r.v, 0)||1;
    return top.map(r=>({n:r.name, p:Math.round(r.v), pct:Math.round(r.v/sum*100), you:!!r.you})); };
  const byPr=f=>board.filter(r=>f(cardOf(r.name))).map(r=>({name:r.name, v:r.pts, you:r.you}));
  const igl=byPr(c=>roleOf(c)==='roleIGL');
  const rookie=byPr(c=>ageOf(c)<=CC_AW_ROOKIE_AGE);
  const frag=Object.keys(cr.plog||{}).map(n=>{ const rows=cr.plog[n]||[];
      return {name:n, v:rows.reduce((a,e)=>a+(e[5]||0), 0), n:rows.length, you:n===cr.plogYou}; })
    .filter(x=>x.n>=CC_AWARD_MIN && x.v>0).sort((a,b)=>b.v-a.v || b.n-a.n);
  const pts={}; board.forEach(r=>{ pts[hKey(r.name)]=r; });
  const pair=(a,b)=>{ const ra=a && pts[hKey(a)], rb=b && pts[hKey(b)]; if(!ra || !rb) return null;
    return {name:String(a.handle||a)+' & '+String(b.handle||b), v:ra.pts+rb.pts, you:!!(ra.you||rb.you)}; };
  const trio=careerSquadSize()>=3;
  // Тройка: пара и третий (ключ hKey) — имя третьего с доски сезона.
  const team=(a, b, k3)=>{ const p=pair(a, b), r3=k3 && pts[k3]; if(!p || !r3) return null;
    return {name:p.name+' & '+r3.name, v:p.v+r3.pts, you:!!(p.you||r3.you)}; };
  const trios=(CAREER.career.trios)||{};
  let duos=[]; try{ duos=(careerPools().duos||[]).map(d=>trio
      ? team(d.cards[0], d.cards[1], trios[d.cards.map(c=>hKey(c)).sort().join('+')])
      : pair(d.cards[0], d.cards[1])).filter(Boolean); }catch(e){ duos=[]; }
  try{ const ms=careerMates()||[];
    const mine=!me ? null : trio ? (ms[0] && ms[1] ? team(me, ms[0], hKey(ms[1])) : null) : (ms[0] ? pair(me, ms[0]) : null);
    if(mine && !duos.some(d=>d.you)) duos.push(mine); }catch(e){}
  duos.sort((a,b)=>b.v-a.v);
  const out={igl:share(igl), frag:share(frag), rookie:share(rookie)};
  out[trio ? 'trio' : 'duo']=share(duos);
  return out;
}
function careerAwardCatsWon(season){
  return (careerAwards().won||[]).filter(a=>a.kind==='cat' && a.season===season);
}
// And the year, at the boundary the season ends on.
function careerAwardSeason(){
  const cr=CAREER.career, aw=careerAwards();
  if((aw.won||[]).some(a=>a.kind==='season' && a.season===cr.season)) return null;
  const from=Math.max(0, (cr.season||1)-1)*365;
  const board=careerAwardBoard(from, from+365);
  if(!board.length) return null;
  const win=board[0];
  aw.won=aw.won||[];
  /* И ПЯТЁРКА НОМИНАНТОВ рядом с победителем — идея игрока 4 сентября:
     «чтоб в конце главы выбирали лучшего игрока за год, типо как в футболе
     золотой мяч». Игрок года в моде был и раньше, но приходил одной строкой в
     ленту; у «золотого мяча» же главное — церемония: список тех, кто на него
     претендовал, и кто из них взял. Пятёрка пишется в саму награду, чтобы
     таблица не пересчитывалась потом по изменившемуся ростеру. */
  aw.won.push({kind:'season', key:String(cr.season), season:cr.season,
               name:win.name, you:!!win.you,
               top:board.slice(0, CC_AWARD_TOP).map(r=>({n:r.name, p:Math.round(r.pts),
                                                         e:r.events, you:!!r.you}))});
  if(win.you){
    careerReachAdd(CC_REACH_DIV(cr.division)*20);
    careerNews('good', 'ccNewsAwardSeasonYou', [cr.season]);
  } else {
    careerNews('flat', 'ccNewsAwardSeason', [win.name, cr.season]);
  }
  // И четыре номинации — той же церемонией (careerAwardCats).
  try{ const cats=careerAwardCats();
    CC_AW_CATS.forEach(cat=>{ const top=cats[cat]||[]; if(!top.length) return;
      const w=top[0];
      aw.won.push({kind:'cat', cat:cat, key:String(cr.season)+':'+cat, season:cr.season, name:w.n, you:!!w.you, top:top});
      if(w.you){ careerReachAdd(CC_REACH_DIV(cr.division)*8); careerNews('good', 'ccNewsAwardCatYou', [ccAwCatLabel(cat), cr.season]); }
      else careerNews('flat', 'ccNewsAwardCat', [ccAwCatLabel(cat), w.n, cr.season]);
    }); }catch(e){}
  careerSave();
  return win;
}
/* ЦЕЛЬ МЕСЯЦА — ВЫБИРАЕТ ИГРОК (его слово 20.10: «может цели от орг пусть сам выбирает реалистичные цели, за
   которые может получить бонусы, и топ 3 не в любом кубке, а FNCS там например или квал FNCS и т.д.»).

   Было: клуб бросал одну цель на месяц — «топ-3 в кубке», «топ-10», «пройти отбор» — по дивизиону, и годилось любое
   событие. Теперь клуб предлагает три, и все три — из того, что в этом месяце правда стоит в календаре:
     надёжная   — кэш-кап (Victory Cup, Perf Eval) или пройти сессию FNCS Divisional Cup;
     средняя    — квал FNCS: пройти этап Мейджора (Play-In, Heats, Last Chance) или место в Финале недели;
     амбициозная — место в финале Мейджора или в Финале недели, если нет — высоко в кэш-капе.
   Планка места — по своим же последним местам в событиях этого вида (доля поля, квантиль 0.7 / 0.4 / 0.15, круглое
   число из CC_MG_NICE), без истории — по всем вечерам. Бонус растёт со сложностью (×1 / ×2 / ×4). Пока не выбрано, цель
   не засчитывается; не выбрал до вечера — клуб ставит среднюю сам (и в перемотке). Засчитывается вечер с дня выбора. */
const CC_MG_NICE=[1,2,3,5,10,15,20,25,30,40,50,75,100,150,200,250,300,500,1000];
const CC_MG_FIELD={cash:500, fncsCup:180, fncsFinal:50, majorFinal:50};
const CC_MG_MUL=[1, 2, 4];
// Вид строки журнала по меркам цели: сессия Divisional Cup пишется без kind.
function ccMgCat(r){
  const k=(r && r.kind) || 'cup';
  if(k==='victory' || k==='eval') return 'cash';
  if(k==='cup') return 'fncsCup';
  if(k==='final') return 'fncsFinal';
  if(k==='major') return r.stage==='final' ? 'majorFinal' : 'majorQual';
  return k;
}
function ccMgNice(x){ for(const v of CC_MG_NICE) if(v>=x) return v; return CC_MG_NICE[CC_MG_NICE.length-1]; }
// Планка места: доля поля по своим строкам этого вида (последние 12), квантиль q, умноженная на поле вида.
/* Где ты по силе в поле кэш-капа (Notion «20.10»: «очень слабые цели для игрока у которого рейтинг 95» — без истории
   планка бралась от размера поля, топ-200 из 2470 для 95-го). Поле региона той же сборкой, что у Victory Cup
   (careerCupField), твой состав — careerYouTeam; место = сколько составов сильнее + 1. Считается раз в месяц. */
function ccMgExpect(){
  const cr=CAREER.career, key=ccMonthKey(careerToday())+'|'+Math.round((CAREER.player&&CAREER.player.ovr)||0);
  if(cr._mgExp && cr._mgExp.key===key) return cr._mgExp;
  let out=null;
  try{
    const solo=careerSquadSize()===1, mine=[careerCard()].concat(solo ? [] : (careerMates()||[]).filter(Boolean)), n=careerVictoryField(solo);
    const pm=CARD_MODE, ps=squadSize, pd=drafted; CARD_MODE=true; squadSize=careerSquadSize(); drafted=mine;
    let field=[], you=null;
    try{ field=careerCupField(Object.assign({}, cr), mine, n, 'mgexp|'+key, true)||[]; you=careerYouTeam(mine); }
    finally{ CARD_MODE=pm; squadSize=ps; drafted=pd; }
    if(field.length && you && you.pow!=null){ const better=field.filter(t=>(t.pow||0)>you.pow).length; out={key, rank:better+1, n:field.length+1}; }
  }catch(e){ out=null; }
  Object.defineProperty(cr, '_mgExp', {value:out||{key, rank:0, n:0}, enumerable:false, configurable:true, writable:true});
  return cr._mgExp;
}
// Множитель к ожидаемому месту по сложности: надёжная — в 2.5 раза хуже ожидания, средняя — само ожидание, амбициозная — в 2.5 раза лучше.
function ccMgPriorMul(q){ return q>=0.7 ? 2.5 : q>=0.4 ? 1 : 0.4; }
function ccMgTarget(cat, q){
  const tHist=ccMgTargetHist(cat, q);
  if(cat!=='cash' && cat!=='any') return tHist;
  const ex=ccMgExpect(); if(!ex || !ex.rank) return tHist;
  const prior=ccMgNice(Math.max(1, Math.round(ex.rank*ccMgPriorMul(q))));
  // Своя история есть — середина между ней и силой (геометрически), нет — по силе.
  const log=(CAREER.career.log||[]).filter(r=>r && r.place && r.of && ccMgCat(r)===cat);
  const v=log.length>=3 ? Math.sqrt(prior*tHist) : prior;
  // Амбициозная — круглое число вниз (6 → 5), остальные — вверх.
  const r=Math.max(1, Math.round(v)), dn=CC_MG_NICE.filter(x=>x<=r).pop()||1;
  return Math.min(tHist, q<0.4 ? dn : ccMgNice(r));
}
function ccMgTargetHist(cat, q){
  const log=(CAREER.career.log||[]).filter(r=>r && r.place && r.of);
  let rows=log.filter(r=>ccMgCat(r)===cat).slice(-12);
  if(rows.length<3) rows=log.slice(-12);
  // Поле — медиана своих полей этого вида (у кэш-капов это и 19 на ЛАНе, и 2470 в Victory Cup).
  const own=rows.filter(r=>ccMgCat(r)===cat).map(r=>r.of).sort((a,b)=>a-b);
  const field=own.length ? own[own.length>>1] : (CC_MG_FIELD[cat]||100);
  // Пол планки по сложности: «топ-1» в кубке на тысячу — не цель, а лотерея.
  const floor=q>=0.7 ? 10 : q>=0.4 ? 5 : 3;
  if(!rows.length) return Math.min(ccMgNice(Math.max(floor, field*q*0.5)), ccMgNice(field/2));
  const fr=rows.map(r=>r.place/r.of).sort((a,b)=>a-b);
  const v=fr[Math.min(fr.length-1, Math.floor(q*fr.length))];
  return Math.min(ccMgNice(Math.max(floor, v*field)), ccMgNice(field/2));
}
// Что ещё стоит в календаре карьеры в этом месяце, по видам (с сегодняшнего дня). «Пустят ли» не спрашивается: до квала
// в Мейджор и Финал недели не пускает никто, а цель как раз в том, чтобы туда пройти.
function ccMgMonthKinds(key){
  const out={}, today=careerToday();
  try{
    careerEvents().forEach((evs, day)=>{
      if(ccMonthKey(day)!==key || day<today) return;
      (evs||[]).forEach(e=>{
        const fin=e.kind==='major' && /final/i.test(String(e.id||'')) && !/lcq|last/i.test(String(e.id||''));
        const c=e.kind==='major' ? (fin ? 'majorFinal' : 'majorQual') : ccMgCat({kind:e.kind});
        out[c]=(out[c]||0)+1;
      });
    });
  }catch(e){}
  return out;
}
function ccMgOptions(key, base){
  const has=ccMgMonthKinds(key), o=[];
  const pl=(cat, q)=>({type:'place', cat, n:ccMgTarget(cat, q)});
  // Надёжная.
  o.push(has.cash ? pl('cash', 0.7) : has.fncsCup ? {type:'cut', cat:'fncsCup'} : has.fncsFinal ? pl('fncsFinal', 0.7) : {type:'place', cat:'any', n:ccMgTarget('any', 0.7)});
  // Средняя — квал FNCS.
  o.push(has.majorQual ? {type:'cut', cat:'majorQual'} : has.fncsFinal ? pl('fncsFinal', 0.4) : has.fncsCup ? pl('fncsCup', 0.4) : has.solo ? {type:'cut', cat:'solo'} : has.cash ? pl('cash', 0.4) : {type:'place', cat:'any', n:ccMgTarget('any', 0.4)});
  // Амбициозная — FNCS.
  o.push(has.majorFinal ? pl('majorFinal', 0.15) : has.fncsFinal ? pl('fncsFinal', 0.15) : has.majorQual ? pl('fncsCup', 0.15) : has.cash ? pl('cash', 0.15) : {type:'place', cat:'any', n:ccMgTarget('any', 0.15)});
  // Одно и то же дважды — не выбор: средняя и амбициозная одного вида должны отличаться планкой.
  if(o[2].cat===o[1].cat && o[2].type===o[1].type && o[2].n>=o[1].n) o[2].n=Math.max(1, CC_MG_NICE[Math.max(0, CC_MG_NICE.indexOf(o[1].n)-2)]||1);
  if(o[1].cat===o[0].cat && o[1].type===o[0].type && o[1].n>=o[0].n) o[1].n=Math.max(1, CC_MG_NICE[Math.max(0, CC_MG_NICE.indexOf(o[0].n)-2)]||1);
  return o.map((g, i)=>Object.assign(g, {tier:i, bonus:Math.round(base*CC_MG_MUL[i]/10)*10}));
}
function careerMonthGoal(){
  const cr=CAREER.career, org=CAREER.org;
  // Свой клуб задач хозяину не ставит и премий за месяц не платит.
  if(!org || org.own) return null;
  const key=ccMonthKey();
  if(cr.mg && cr.mg.key===key) return cr.mg;
  const base=Math.max(100, Math.round((org.salary||400)/Math.max(1,careerWagePaydays().length)/10)*10);
  cr.mg={key:key, opts:ccMgOptions(key, base), pick:null, from:null, type:null, cat:null, n:0, bonus:0, paid:false};
  careerSave();
  return cr.mg;
}
// Выбор: цель становится этой (type/cat/n/bonus сверху — их читают ячейки и проверка), засчитывается с сегодняшнего дня.
function careerMonthGoalPick(i, quiet){
  const g=careerMonthGoal(); if(!g || g.pick!=null || !g.opts || !g.opts[i]) return;
  const o=g.opts[i];
  g.pick=i; g.from=careerToday(); g.type=o.type; g.cat=o.cat; g.n=o.n||0; g.bonus=o.bonus;
  careerSave();
  if(!quiet && typeof careerRenderHub==='function') careerRenderHub();
}
// Не выбрал до вечера — клуб ставит среднюю (вызывается перед проверкой после вечера и в перемотке).
function careerMonthGoalAuto(){
  const g=careerMonthGoal(); if(!g || g.pick!=null || !g.opts) return;
  careerMonthGoalPick(Math.min(1, g.opts.length-1), true);
  // Вечер, на котором выбрал клуб, тоже идёт в зачёт — он мог быть первым вечером месяца.
  const last=(CAREER.career.log||[]).slice(-1)[0];
  if(last && ccMonthKey(last.day)===g.key && last.day<g.from) g.from=last.day;
  // Без поста в ленте (его слово 20.10: «посты про клуб новые не надо»): цель видна в плитке клуба.
}
function careerMonthGoalMet(){
  const g=careerMonthGoal(); if(!g) return false;
  // Старые сейвы: цель без вариантов — как раньше, любое событие месяца.
  if(!g.opts) return (CAREER.career.log||[]).some(r=>ccMonthKey(r.day)===g.key &&
    (g.type==='cut' ? !!r.passed : (r.place||99)<=g.n));
  if(g.pick==null) return false;
  return (CAREER.career.log||[]).some(r=>ccMonthKey(r.day)===g.key && r.day>=(g.from||'') &&
    (g.cat==='any' || ccMgCat(r)===g.cat) &&
    (g.type==='cut' ? !!r.passed : (r.place||99)<=g.n));
}
// Judged where a result lands, so the money arrives with the night that earned
// it rather than at some later boundary.
function careerMonthGoalCheck(){
  careerMonthGoalAuto();
  const g=careerMonthGoal(); if(!g || g.paid) return 0;
  if(!careerMonthGoalMet()) return 0;
  const cr=CAREER.career;
  g.paid=true;
  cr.balance=(cr.balance||0)+g.bonus;
  cr.wages=(cr.wages||0)+g.bonus;
  careerSave();
  return g.bonus;
}
function careerMonthGoalText(g){
  if(!g) return '-';
  if(g.opts && g.pick==null) return L().ccMgChoose;
  return ccMgGoalLine(g);
}
function ccMgGoalLine(g){
  const T=L();
  if(!g.cat) return g.type==='cut' ? T.ccMgCut : T.ccMgPlace(g.n);
  if(g.type==='cut') return (T.ccMgCutOf||{})[g.cat] || T.ccMgCut;
  const f=(T.ccMgPlaceOf||{})[g.cat];
  return f ? f(g.n) : T.ccMgPlace(g.n);
}
// Три кнопки выбора: цель, бонус, сложность.
function ccMgPickHTML(){
  const g=careerMonthGoal(); if(!g || !g.opts || g.pick!=null) return '';
  const T=L();
  return '<div class="cc-mg-pick"><small>'+esc(T.ccMgPickHint)+'</small>'+g.opts.map((o, i)=>
    '<button type="button" class="cc-mg-opt cc-mg-t'+o.tier+'" onclick="event.stopPropagation();careerMonthGoalPick('+i+')">'+
      '<em>'+esc(T.ccMgTier[o.tier]||'')+'</em><b>'+esc(ccMgGoalLine(o))+'</b><i>+'+esc(ccMoney(o.bonus))+'</i></button>').join('')+'</div>';
}

// The season boundary is where a contract is judged. One season, one objective:
// met and they extend with a raise, missed and you are a free agent again.
/* Контракт на год, продлевать или уходить решает игрок. Условия (текущие и предложенные) прямо
   в вопросе, уход снова открывает скаутинг, чтобы свободного агента видели клубы.
   Не спрашиваем, если цель провалена (решает клуб), и под перемоткой: там продлеваем,
   как и на остальные вопросы. */
function careerOrgSeasonEnd(){
  const org=CAREER.org; if(!org) return;
  /* СВОЙ КЛУБ НЕ РАСТОРГАЕТ КОНТРАКТ С ХОЗЯИНОМ. Цели у него нет (careerClubFound), и
     careerOrgGoalMet на нём честно отвечает «нет» — а эта строка читала «нет» как
     провал сезона: «клуб расторгает контракт: задача не выполнена», CAREER.org=null,
     при этом cr.club оставался, и careerOrgOffers из-за него молчал весь следующий
     год. Игрок: «ты как бы ушёл из клуба потому что он не
     выполнил цели, то есть твой клуб, но он есть. И после этого, когда ты пытаешься
     найти новый клуб, тебе никто не пишет». Сейв с этой дырой чинит careerMigrateOwnClub. */
  if(org.own) return;
  if(!careerOrgGoalMet()){
    careerNews('bad', 'ccNewsReleased', [org.name], {by:ccOrgBy(org.name)});
    /* И слово самого игрока: у настоящих расставание с клубом это ДВА поста —
       объявление клуба и длинное «спасибо за эти годы» от человека (Sylkaos и
       HavoK by Vitality, 30 августа). Раньше клуб говорил, а игрок молчал. */
    careerNews('flat', 'ccPostBye', [ccHandle(org.name)]);
    CAREER.org=null;
    // «Не искать клуб», нажатое в клубе, относилось к тому клубу: без сброса после расторжения не писал никто.
    CAREER.scoutOff=false; delete CAREER.scoutOffFree;
    return;
  }
  // Контракт идёт и дальше — продлевать нечего: та же зарплата, новая задача на сезон.
  if(ccOrgSeasonsLeft(org)>0){
    org.goal=careerOrgGoal(CAREER.career.division);
    careerNews('good', 'ccNewsOrgYear', [org.name, org.to-(CAREER.career.season||1)], {by:ccOrgBy(org.name)});
    careerSave();
    return;
  }
  const was=org.salary;
  const sal=org.salary, grain=sal>=2000 ? 50 : sal>=200 ? 10 : 1;
  const raise=Math.max(sal+grain, Math.round(sal*(1+CC_ORG_GOAL_RAISE[(org.goal && org.goal.tier!=null) ? org.goal.tier : 1])/grain)*grain);
  const stay=function(){
    org.salary=raise;
    org.to=(CAREER.career.season||1)+1;   // продление — на следующий сезон (сезон ещё не сменился)
    org.goal=careerOrgGoal(CAREER.career.division);
    careerNews('good', 'ccNewsExtended', [org.name, org.salary], {by:ccOrgBy(org.name)});
    careerSave();
  };
  const leave=function(){
    careerNews('flat', 'ccNewsLeftOrg', [org.name], {by:ccOrgBy(org.name)});
    careerNews('flat', 'ccPostBye', [ccHandle(org.name)]);
    CAREER.org=null;
    // Ушёл искать лучше — значит клубы снова смотрят. См. careerOrgOffers.
    CAREER.scoutOff=false;
    careerSave();
    if(typeof careerRenderHub==='function') careerRenderHub('centre');
  };
  if((typeof CC_FF!=='undefined' && CC_FF) || skipAnimation){ stay(); return; }
  ccAsk(L().ccOrgEndText(org.name, was, raise), stay,
        {yes:L().ccOrgStay, no:L().ccOrgLeave, onNo:leave});
}

/* ---- Morale ---------------------------------------------------------------
   The partner can walk away and patience is what drives it. The scale is invented,
   the line it is scored against is the middle of the field. Scoring against the
   promotion cut drained patience for anyone outside the top third: partners left
   in 22% of cups (teen) / 46% (veteran). Now a hold is safe, promoting is better,
   and three-four weeks in the bottom third empties the seat. */
const CAREER_PATIENCE_START=60, CAREER_PATIENCE_QUIT=18;
/* Тот, чей переезд оплачен, не уходит сам. Правило: «не
   проблема что тимейт может бросить тебя если оплатишь ему переезд? запрети».
   И оно держится на том же, на чём loyal в careerDuoHolds: уехавший за тобой
   на другой континент уехал от всех, к кому мог бы уйти. Запрет — только на
   его сторону решения: твой отрыв на ступень ('behind') и смена напарника
   твоей рукой остались как были. Настроение тоже живёт как жило — он может
   быть недоволен и говорить об этом, он не может только уйти. */
function ccMateStays(pr){ return !!(pr && pr.movedWith); }
/* В команде настрой — ОБЩИЙ: от стажа дуо (chemSince — ключ команды), а не
   от терпения бота-напарника из личного списка. Отзыв:
   «настрой ещё не общий у тимейтов» — «общую делай». Растёт с днями вместе,
   от стартового значения до ста за CC_CHEM_DAYS; одинаков у обоих по
   построению. Одиночная карьера — как была. */
function careerPatience(){
  if(typeof ccMpTeam==='function' && ccMpTeam()){
    const d=careerChemDays();
    const base=CAREER_PATIENCE_START+(100-CAREER_PATIENCE_START)*Math.min(1, d/CC_CHEM_DAYS);
    return Math.round(Math.min(100, base+ccGiftMood()));
  }
  const pr=careerMateRec();
  if(!pr) return CAREER_PATIENCE_START;
  if(pr.patience==null) pr.patience=CAREER_PATIENCE_START;
  return pr.patience;
}
/* Whichever seat is closest to a decision.

   The messages after a night and the people who come for your partner both used
   to mean chair one, so a trio's second seat could not be unhappy out loud and
   could not be taken. The least patient of them is the one with something to
   say — in a duo that is the only one there is, so nothing about a duo season
   moves. */
function ccMateAtRisk(){
  const recs=careerMateRecords(), cards=careerMates();
  if(!recs.length) return null;
  const pat=r=>(r && r.patience!=null) ? r.patience : CAREER_PATIENCE_START;
  let at=0;
  recs.forEach((r,i)=>{ if(pat(r)<pat(recs[at])) at=i; });
  return {rec:recs[at], card:cards[at], at:at, patience:pat(recs[at])};
}
function careerMoodKey(p){
  return p<25 ? 'ccMoodEdge' : p<45 ? 'ccMoodUnhappy' : p<70 ? 'ccMoodSteady' : 'ccMoodHappy';
}
// Returns what happened to the partner, so the news can report it and the result
// card can say the duo is over.
/* What the night did to the people in the seats.

   Every seat, not the first one. This read careerMateRec — which means chair one
   — so in a trio season the second partner sat through a whole year of bad
   nights at the mood he arrived with: he never got happier, never got tired of
   the player, and could not walk out. The same half-written shape as the poach
   and the messages beside it, and his report of 20 August is all three at once.

   The return is still chair one's, because the result card prints one number and
   that is the number it has always printed. Whoever actually left is in the feed
   and in the timeline, the way a departure always was. */
function careerApplyMorale(place, total, passed){
  const recs=careerMateRecords();
  const mates=careerMates();
  // Половина квалифицированного состава не уходит и после плохого вечера:
  // место — пары, и пара его доигрывает. Та же строка, что в careerMatePoach
  // и careerMateDm; терпение при этом тратится как тратилось — он может быть
  // недоволен, он не может только уйти. См. careerDuoHolds, правило.
  const held=careerSlotHeld();
  if(recs.length>1){
    const perfAll = total>1 ? 1-(place-1)/(total-1) : 0.5;
    const moveAll = clamp(Math.round((perfAll-0.5)*12) + (passed?2:0), -5, 6);
    // Backwards, so dropping one does not renumber the seats still to be read.
    for(let i=recs.length-1; i>=1; i--){
      const rec=recs[i];
      const was=rec.patience!=null ? rec.patience : CAREER_PATIENCE_START;
      rec.patience=clamp(was+moveAll, 0, 100);
      if(rec.patience<CAREER_PATIENCE_QUIT && !ccMateStays(rec) && !held){
        const card=mates[i];
        careerMateDrop(rec.handle || (card && card.handle));
        careerMateLeftMark(rec.handle || (card && card.handle));
        careerRepAdd(-2);
        careerEvent('tlDuoQuit', [card ? card.handle : '']);
        careerNews('bad', 'ccNewsMateLeftFor', [card ? card.handle : '']);
      }
    }
  }
  const pr=careerMateRec();
  if(!pr) return null;
  const perf = total>1 ? 1-(place-1)/(total-1) : 0.5;
  // Scaled with everything else that was tuned per cup. These figures were set
  // when a season held eight of them; the measured year holds forty-two below
  // Division 1, and unchanged they emptied the seat almost every week — the arc
  // harness went from 128 partners walking out to 743 across the same careers,
  // for no reason but that the calendar got longer.
  //
  // A duo is supposed to hold for a season and go at the turn of it. This is not
  // that rule yet — patience still drains from any bad night — but at this size
  // it drains at the speed it was measured at rather than five times it.
  const move = clamp(Math.round((perf-0.5)*12) + (passed?2:0), -5, 6);
  const before=careerPatience();
  pr.patience=clamp(before+move, 0, 100);
  const left = pr.patience<CAREER_PATIENCE_QUIT && !ccMateStays(pr) && !held;
  const who = careerPartnerCard();
  // A partner walking out costs more than one you left, because this is the one
  // the room heard about from the other side.
  if(left){ if(pr){ careerMateDrop(pr.handle); careerMateLeftMark(pr.handle); } careerRepAdd(-2); careerEvent('tlDuoQuit', [who?who.handle:'']); }
  return {move, before, after:pr.patience, left, name:who?who.handle:''};
}

/* ---- The feed -------------------------------------------------------------
   What a career sounds like from the outside. Every line is built from
   something that actually happened in the run — the placement, who won the cup,
   what the rating did, what the partner thinks — rather than from a bank of
   flavour text, so the feed can never say something the standings do not. */
/* Сколько записей лента вообще помнит.

   Было сорок, и этого не хватало: отзыв — «будто не все посты в
   твитере». Так и есть, только теряются они не при показе, а при записи —
   careerNews режет хвост, и сорок первая запись выталкивает первую навсегда.
   Один турнирный вечер пишет пять-семь строк (результат, поздравление сцены,
   пост клуба, объявленные точки высадки), то есть сорок — это неделя. Лента
   карьеры, в которой не видно прошлого месяца, перестаёт быть историей.

   Сто двадцать — примерно сезон плотной игры, и в сейве это десятки килобайт:
   запись это ключ, пара аргументов и дата, а не текст. Чтобы длинная лента не
   стоила отрисовки, посты за экраном пропускаются (content-visibility у
   .x-post ниже). */
const CAREER_NEWS_KEEP=120;

/* A saved line is a key and its numbers, never a sentence.

   It used to be the sentence: careerNews was handed L().ccNewsRating(56, 57),
   already built in whatever language was on at the time, and the feed printed
   it back. So a career played in Russian stayed Russian in its feed, its
   history and its inbox after the player switched to English — every dictionary
   key present and correct, and half the screen in the wrong language.

   Storing {k:'ccNewsRating', a:[56,57]} instead means the sentence is built at
   the moment it is drawn, in the language that is on then. The numbers are the
   part worth keeping; the words were never the save's to own. */
/* Имя зоны для строк ленты. Номер превращается в «зона 9» / «zone 9» на
   показе, то есть в языке, который стоит СЕЙЧАС. Старые сейвы хранят уже
   собранное имя строкой — оно проходит насквозь: переводить его нечем, но и
   ломать пост из-за этого незачем. См. ccPostDropCall. */
function ccZoneName(z){
  return (typeof z==='number' && isFinite(z)) ? L().landingZoneSuffix(z) : String(z==null?'':z);
}
/* Название турнира в аргументах поста. Ключ поста переводится на показе, а имя вечера раннеры отдают уже готовой
   строкой (ccBoardAfter(ranked, you, ev.label) — «Дуо Виктори Кап 1»), и после смены языка пост читался
   «Дуо Виктори Кап 1 — stats leaders» (сторож check-language-switch, 9.10). Строка, которая начинается со строки словаря
   любого загруженного языка (дальше — конец, пробел, «·», двоеточие, запятая или цифра), получает её перевод на текущий,
   хвост («1», «· Даллас») остаётся как есть. Индекс — по первым трём буквам, самое длинное совпадение первым. */
let CC_ARG_REV=null;
function ccArgLive(a){
  if(typeof a!=='string' || a.length<6 || a.length>120 || a.charAt(0)==='@') return a;
  const nLang=Object.keys(I18N).length;
  if(!CC_ARG_REV || CC_ARG_REV.n!==nLang){
    const key=new Map(), by=new Map();
    Object.keys(I18N).forEach(lg=>{ const d=I18N[lg]||{}; Object.keys(d).forEach(k=>{ const v=d[k];
      if(typeof v!=='string' || v.length<6 || v.length>60 || v.indexOf('<')>=0 || key.has(v)) return;
      key.set(v, k); const p=v.slice(0, 3); (by.get(p)||by.set(p, []).get(p)).push(v); }); });
    by.forEach(list=>list.sort((x,y)=>y.length-x.length));
    CC_ARG_REV={n:nLang, key, by};
  }
  const list=CC_ARG_REV.by.get(a.slice(0, 3)); if(!list) return a;
  const cur=L();
  for(const v of list){
    if(a.length<v.length || a.slice(0, v.length)!==v) continue;
    const nx=a.charAt(v.length); if(nx && !/[\s·:,\d]/.test(nx)) continue;
    const now=cur[CC_ARG_REV.key.get(v)];
    return (typeof now==='string' && now!==v) ? now+a.slice(v.length) : a;
  }
  return a;
}
function ccText(e){
  if(e && e.k){
    const args=(e.a||[]).map(ccArgLive);
    // Вариант реплики (m.vi от careerDmPush): 0 — исходная, дальше — CC_LINES_MORE.dm своего языка.
    if(e.vi!=null){
      const ex=((CC_LINES_MORE[LANG]||{}).dm||{})[e.k];
      if(ex && ex.length){ const i=e.vi%(ex.length+1); if(i>0) return ccNoDash(ccMoreFill(ex[i-1], args)); }   // варианты из lines-more.js идут мимо L() — тире чистятся здесь
    }
    const line=L()[e.k];
    if(typeof line==='function') return line.apply(null, args);
    if(typeof line==='string') return line;
  }
  /* Строка без ключа: либо написанная игроком (careerPostWrite), либо
     оставшаяся от сейва, который писали до словаря. И та и другая — не наш
     текст, поэтому экранируется: пост рисуется как разметка, и единственное
     место, куда в эту ленту попадает чужой текст, — здесь. */
  return (e && e.text) ? esc(e.text) : '';
}
// What an entry says it happened on. Entries written before the clock became a
// date carry a week and no day, and they still have to read — a save is not
// worth breaking over a label.
function ccStamp(e){
  if(!e || !e.day) return L().chWeek+' '+((e&&e.week)||1);
  const t=new Date(e.day+'T00:00:00Z');
  // calDows starts on Monday; getUTCDay starts on Sunday.
  return L().calDows[(t.getUTCDay()+6)%7]+' '+t.getUTCDate()+' '+L().calMonthsShort[t.getUTCMonth()];
}
/* opt carries the two things a post can have beyond its words:

   by  — the account that posted it, when it is not the player, their partner or
         the scene's own feed. A cup winner posts their own result.
   tbl — a picture of the standings. {t: caption, rows: [{p, n, s}], me: handle}

   A like is stored on the entry rather than counted, because the reader can only
   ever add one. */
function careerNews(kind, key, args, opt){
  const cr=CAREER.career;
  cr.news=cr.news||[];
  // In the words of the season it is posted in. See ccSquadKey.
  // Ключа может и не быть: строку, которую игрок написал сам, не из чего
  // переводить — она едет в записи как есть. См. careerPostWrite.
  key=key ? ccSquadKey(key) : undefined;
  // Ушёл твой напарник — окно в хабе (ccMateGoneMaybe). В команде места двигают вместе — там окна нет.
  try{ if(CC_MATE_GONE_KEYS.test(key||'') && !(typeof ccMpOn==='function' && ccMpOn())) cr.mateGone={who:String((args||[])[0]||''), day:careerToday()}; }catch(e){}
  // Вариант фразы — и от автора: иначе шесть победителей недели подряд писали одно «W @… 🐐» (9.10).
  if((key==='ccPostPlaced' || key==='ccPostWon' || key==='ccPostPodium') && opt && opt.by && opt.by.name && args){
    const vi=key==='ccPostPlaced' ? 3 : key==='ccPostWon' ? 2 : 3;
    if(typeof args[vi]==='number') args=args.slice(0, vi).concat([args[vi]+ccHashStr(String(opt.by.name))%7], args.slice(vi+1));
  }
  // Годы без дивизионов — посты без «Дивизиона» (вариант Nd, как у реплик в личке, см. careerDmPush).
  try{ if(key && typeof ccNoDivisions==='function' && ccNoDivisions() && L()[key+'Nd']) key=key+'Nd'; }catch(e){}
  // The division the line was written in, stamped on the entry: the press gate
  // reads it, and a post from a Division 4 week must not change its author
  // because the career has since climbed.
  // Dated today unless the caller knows better. One advance can cross a week,
  // and a birthday belongs on the day it fell rather than on the day the clock
  // happened to stop.
  // CC_POST_DAY — то же самое для целого блока записей, которые пишет не игрок,
  // а прошедшая мимо неделя. См. careerD1Posts.
  const day=(opt&&opt.day)||CC_POST_DAY||careerToday();
  /* Одна и та же таблица в ленте один раз за вечер. Вечер дивизиона пишет три поста с местами плюс поздравление
     сцены, и каждый прикладывал копию того же топ-5, в ленте это выглядело как четыре турнира.
     Картинка остаётся у последнего (он сверху, записи кладутся наверх): игрок на подиуме или аккаунт сцены. Места
     остаются текстом.
     Сравниваем строки, а не подпись. careerD1TablePost не попадает, у неё другие строки. Окно 24 записи, вечер пишет
     6-7. */
  const tbl=(opt&&opt.tbl)||undefined;
  // Вид таблицы вечера (ccShotLook) — в запись: скрин рисуется так, как таблица выглядела в симуляции.
  if(tbl && tbl.rows && !tbl.lk){ const lk=ccShotLook(); if(lk) tbl.lk=lk; }
  if(tbl && tbl.rows){
    const sig=t=>((t&&t.rows)||[]).map(r=>r.p+':'+r.n+':'+r.s).join(',');
    const mine=sig(tbl);
    for(let i=0; i<cr.news.length && i<24; i++){
      const e=cr.news[i];
      if(e && e.day===day && e.tbl && sig(e.tbl)===mine) e.tbl=undefined;
    }
  }
  cr.news.unshift({season:cr.season, day, kind, k:key, a:args||[], f:cr.reach||0,
                   dv:cr.division, id:'n'+(cr.newsN=(cr.newsN||0)+1),
                   by:(opt&&opt.by)||undefined, tbl,
                   // Доска лидеров вечера — вложение того же рода, что и tbl.
                   lead:(opt&&opt.lead)||undefined,
                   // Объявленная точка: номер клетки и остров, на котором она.
                   zone:(opt&&opt.zone!=null)?opt.zone:undefined,
                   set:(opt&&opt.set)||undefined,
                   // Арт события под постом и цитируемая запись — см. ccArtHTML
                   // и ccQuoteHTML.
                   art:(opt&&opt.art)||undefined,
                   // Постер турнира этого дня, если он свой (см. ccNewsArtOf).
                   evArt:(opt&&opt.evArt)||(()=>{ try{ return ccEventArtOwn((careerYearDays().get(day)||[])[0])||undefined; }catch(e){ return undefined; } })(),
                   q:(opt&&opt.q)||undefined,
                   // Ник, чья карточка (био + PR) висит под постом. Хранится
                   // ник, а не сама карточка: числа считаются на показ, и
                   // вчерашняя копия соврала бы. См. ccCardShotHTML.
                   card:(opt&&opt.card)||undefined,
                   // Ник, с которым идёт ссора: по нему пост знает, что под ним
                   // стоят две кнопки, и кому адресован ответ. См. careerBeefAnswer.
                   beef:(opt&&opt.beef)||undefined,
                   sp:(opt&&opt.sp)||undefined,   // рекламный пост бренда (careerSponsorPost)
                   poll:(opt&&opt.poll)||undefined,   // опрос (careerPollTick, 16.10)
                   text:(opt&&opt.text)||undefined});
  if(cr.news.length>CAREER_NEWS_KEEP) cr.news.length=CAREER_NEWS_KEEP;
}
// One line a headline, the way an inbox reads.
//
// It used to be two: a stamp above every entry saying which season and week it
// was. Five entries came to two hundred and forty pixels of a column that has a
// ladder and a club in it as well, and four of those five stamps said the same
// week as the one above them — the feed is written when something happens, and
// several things happen on the same night.
//
// So the stamp moves onto the end of the line it belongs to, where it costs no
// height at all, and it says only what is not already on the screen: the week,
// and the season only when it is not the season you are standing in.
//
// It is printed on every line rather than only where the week changes. Under a
// wide screen the strip runs the headlines across three or four columns, and a
// stamp that appears only on a change lands wherever the flow happens to put it
// — a boundary that reads as one in a single column reads as an accident in
// four. The same rule has to hold in both, and this one does.
/* Who posted it.

   A feed line used to be a fact with nobody attached: "Rating: 56 -> 57" is
   something that happened, not something anybody said. The reference is X, and
   in X a post has an author — and the shot itself shows who posts FNCS results
   in real life: competitive news accounts, @FNCompetitive and @CompAwardsFN.

   So the author comes off the key the save already stores. A result is reported
   by the scene's own account, a rating is something you post about yourself, and
   a partner's mood is the partner speaking. Nothing new is stored for this: the
   key was already there, and it always knew whose line it was. */
const CC_POST_BY={
  // Your own placing is your own post, in every division. The scene's account
  // reports titles, the table and who moved clubs — not that somebody finished
  // 103rd of 150, which is what it was doing and what a real one never does.
  ccNewsResult:'you', ccNewsResultWeek:'you',
  // Жизнь между турнирами (cr.life): Арена, ранг, Noble, травма, жалоба и бан, цель, своя карта,
  // икон-скин, место в Trial, замена — строки о самом игроке. Бан кого-то из сцены — пресса.
  lfNewsArena:'you', lfNewsArenaChamp:'you', lfNewsBanned:'you', lfNewsCase:'you', lfNewsCleared:'you',
  lfNewsFined:'you', lfNewsGoal:'you', lfNewsHealed:'you', lfNewsIcon:'you', lfNewsMapOut:'you',
  lfNewsMapPay:'you', lfNewsMapUpd:'you', lfNewsNoble:'you', lfNewsPlaced:'you', lfNewsRankUp:'you',
  lfNewsStandin:'you', lfNewsSceneBan:'press',
  // Разошедшийся вечер командной игры — своя строка о своём вечере.
  ccNewsMpSplit:'you',
  ccNewsMpPaySync:'you',
  ccPostEvKilled:'arg0', ccPostEvVR:'you', ccPostEvKills:'you',
  // Пресс-конференции (16.10): цитату и исход обещания пишет пресса, на провокацию отвечает названный игрок.
  ccPostPress:'press', ccPostPressKept:'press', ccPostPressBroke:'press', ccPostPressRival:'arg0',
  // Слухи и опросы (16.10) пишут выдуманные медиа-аккаунты — автор едет в opt.by; здесь — на случай записи без него.
  ccPostRumorPair:'press', ccPostRumorYou:'press', ccPostRumorDrama:'press', ccPostRumorTrue:'press', ccPostPollWin:'press', ccPostBreakout:'press',
  // Удача зон, спор «кто лучше», серия страны (28.10): свой пост о зонах — твой, остальное пишут медиа (автор в opt.by).
  ccPostZoneLuck:'you', ccNewsZoneLuck:'press', ccPostDebate:'press', ccNewsNatStreak:'press',
  ccNewsHotfix:'press', ccNewsRehost:'press', ccNewsTeamingDq:'press', ccPostTechNet:'you',
  // LFD is the player saying it out loud. Nobody else posts that for you.
  ccNewsLfd:'you',
  // And so is an injury: a wrist is the player's own week, not a transfer the
  // scene reports. The room finds out because they said so.
  // Who represents you and what they took: the player's own week again.
  ccNewsPromoted:'press', ccNewsWinner:'press',
  ccNewsKinch:'analyst',
  ccNewsStatBoard:'analyst',
  ccNewsEliteFlop:'analyst',
  // The Performance Evaluation is a Division 1 night, so the press gate let
  // these through — but what they say is where the player finished, and a
  // scene account does not post "I went out in Round 1". Same rule that moved
  // ccNewsResult across: a placing is the player's own line.
  ccNewsEvalCash:'you', ccNewsEvalPlace:'you', awNewsDivUp:'you', ccNewsMobSer:'you', ccNewsEvalNoWin:'you', ccNewsEvalOut:'you',
  // Поздравление сверху приносит лента сцены; подарок — твоя строка.
  // Эти строки говорят люди сцены — автором стоит тот, чьё имя первым
  // аргументом. См. 'arg0' в ccPostAuthor.
  ccPostBdayPro:'arg0', ccNewsBdayGift:'you',
  ccPostBanSad1:'arg0', ccPostBanSad2:'arg0', ccPostBanSad3:'arg0',
  ccPostDuoSplitBy:'arg0', ccPostDuoSplitByt:'arg0', ccPostTrioLF:'arg0',
  // Анкету свободного агента пишет он сам — как и всё остальное про себя.
  // Точку высадки объявляет тоже он.
  ccPostLfdWant:'arg0', ccPostLfdWantAny:'arg0', ccPostDropCall:'arg0',
  // Квал из хитов: свой — свой, прошедший бот — от своего имени (первый аргумент).
  ccPostQualGrands:'you', ccPostBotQualGrands:'arg0',
  // Кастомка — свой вечер и своя строка о нём. Пост про титул подписывает
  // клуб: он назван первым аргументом, и его берёт CC_ORG_POST_ARG, но автор
  // должен быть решён и здесь — иначе ключ считается забытым (check-career-feed).
  // Клуб приезжает автором записи (opt.by), а 'press' — страховка на случай,
  // когда клуба в пуле уже нет: тогда титул объявляет лента сцены.
  // Воуч — твоя рекомендация и твоя строка.
  // Благодарность за турнир — своя строка после ЛАНа.
  ccDayEvcustomTake:'you', ccPostOrgWin:'press', ccPostVouch:'you', ccPostThanks:'you', ccPostOneOff:'you', ccPostTriedBest:'you',
  ccPostBye:'you', ccPostAskYes:'you', ccPostAskNo:'you',
  ccNewsAnnounce:'press', ccNewsRoadmap:'press', ccPostHype:'arg0', ccPostDates:'arg0', ccPostCustomsOpen:'press',
  ccPostHosted:'you',
  // Свой клуб говорит своим гербом (by), подписка и SAC — свои строки. Ключи с 11.09,
  // ловил check-career-feed.
  ccNewsClubAcad:'by', ccNewsClubBuy:'by', ccNewsClubFound:'by', ccNewsClubLeft:'by', ccNewsClubSign:'by',
  ccNewsClubSold:'by', ccNewsClubSour:'by', ccNewsClubUnpaid:'by', ccNewsClubUp:'by', ccNewsClubWant:'by',
  ccNewsSacPay:'you', ccNewsTwSubbed:'you', ccNewsClubClosed:'by',
  ccNewsLeftOrg:'press',
  ccNewsSigned:'press', ccNewsReleased:'press', ccNewsExtended:'press', ccNewsTransfer:'press', ccNewsOrgYear:'press', ccNewsRumor:'press',
  /* Парный контракт заведён 25 августа, когда клубы уже постили сами, поэтому
     ему не нужен запасной автор из прошлого: его пишет тот, кто подписал, и
     запись всегда приходит с ним ('by'). */
  ccNewsSignedDuo:'by',
  // A move between clubs is announced rather than confessed, and coming up out
  // of an academy is the club's news about its own roster: the account that
  // posts a signing posts these two as well.
  ccNewsLeft:'press', ccNewsPromotedRoster:'press', ccNewsRaise:'press',
  // What the club paid and what it bought are the player's own week, not the
  // scene's business. These were reaching the feed under the scene's name only
  // because nothing had named an author for them.
  ccNewsOrgKit:'you', ccNewsOrgCoach:'you',
  ccNewsRating:'you', ccNewsCeiling:'you', ccNewsCoach:'you',
  // A stream night is the player's own post, the same as the unpaid one.
  ccNewsStreamPaid:'you', ccNewsScrim:'you',
  /* Семь строк, которые попадали сюда по умолчанию и потому нигде не были
     названы, — check-career-feed требует решения на каждую, и красным он
     стоял именно на них. Все семь — своя жизнь, а не сцена: спарринг и 1v1,
     простуда, ответ на запрос в друзья, отказ от читов и бан за них. Даже
     бан: строка написана про свой аккаунт («карьера завершена»), а не про
     чужой, и постит её тот, чья карьера кончилась. */
  /* Ссора. Первый пост пишет соперник, и он приходит со своим автором в
     opt.by — карта для него не читается вовсе. Но названным он быть обязан:
     проверка требует решения на каждый ключ, и «у него автор свой» — это
     тоже решение, а не пропуск. Значение 'by' именно это и говорит; если
     когда-нибудь позовут без by, ccPostAuthor отдаст пост игроку, как и
     всякую неназванную строку. Ответ и отказ — твои собственные слова. */
  ccBeefStart:'by',
  ccBeefHit:'you', ccBeefQuiet:'you',
  ccNewsSp:'you', ccNews1v1:'you', ccNewsSick:'you', ccNewsLocker:'you', ccNewsFnGift:'you', ccNewsSacOwn:'you', ccNewsSacPaid:'you', ccNewsSacPromo:'you', ccNewsMgAuto:'by', ccNewsFnWin:'you', ccNewsFnOut:'you',
  ccNewsFriendYes:'you', ccNewsFriendNo:'you',
  ccNewsCheatPaid:'you', ccNewsBanned:'you',
  // Moving is the player's own news in all three directions — the flight, the
  // way back, and the month that could not be covered. The scene does not
  // report where somebody lives, and a career saying it itself is what the
  // timeline actually looks like when a player relocates.
  ccNewsMoved:'you', ccNewsMovedHome:'you', ccNewsRentGone:'you',
  ccNewsMovedRegion:'you', ccNewsLeftRegionClub:'you', ccNewsRentGoneRegion:'you',
  ccNewsSponsor:'you',
  // The player's own placement post, and their stream announcement. A post with
  // an author on it (see e.by) never reaches this map — a cup winner is not one
  // of the three fixed accounts.
  ccPostPlaced:'you', ccNewsStream:'you',
  // The title and the podium are the player's own post, with the table on it.
  ccPostWon:'you', ccPostPodium:'you',
  // Giving a qualification away is the player's own week, loudly.
  // A birthday in the scene is the scene's account; the player's own is theirs.
  ccPostBday:'press', ccPostBdayMe:'you', ccPostBdayEpic:'press',
  ccNewsVicCash:'you', ccNewsVicNoWin:'you', ccNewsVicOut:'you',
  ccNewsRelThrough:'you', ccNewsRelOut:'you', ccNewsRelSeat:'you',
  // Место, которое ты не занял, потому что оно у тебя уже есть, — тоже твоя
  // собственная строка: путёвку отдаёшь ты. См. ccRelSeatPass.
  ccNewsRelSeatPass:'you',
  // What a Reload run paid is the same kind of line as where it finished, and
  // it was the one key in the set nobody had named an author for.
  ccNewsRelCash:'you',
  /* Ключи 29.09–8.10 без решённого автора (полный прогон 9.10, check-career-feed): свой клуб —
     гербом, титул EWC — лента сцены, путёвка, MVP, штаб, оплата клуба и отказ клуба взять
     напарника — своя неделя. */
  ccNewsClubStaff:'by', ccNewsClubBuyback:'by', ccNewsEwc24Champ:'press',
  ccNewsEwc24Ticket:'you', ccNewsEwc24Mvp:'you', ccNewsOrgPays:'you', ccNewsOrgPaysNo:'you',
  ccNewsStaffGone:'you', ccNewsStaffRenew:'you', roClubNo:'you',
  // Leaving a region hands the seat down, and that is the player's own line.
  ccNewsSlotRegion:'you',
  // Подарок напарнику — и полученный, и отправленный — своя строка: вещь
  // покупаешь и получаешь ты, а не сцена о тебе пишет. Пришло с командной
  // карьерой (ccGiftBuy/ccGiftSaw) и стояло без автора — красное
  // check-career-feed.
  ccNewsGiftSent:'you', ccNewsGiftGot:'you',
  // Магазин богатых (15.10): свой кап, мерч, взнос и покупка — всё пишет сам игрок.
  ccNewsOwnCup:'you', ccNewsMerch:'you', ccNewsCharity:'you', ccNewsLux:'you',
  ccNewsWfIn:'you', ccNewsWfCash:'you', ccNewsWfNoCash:'you',
  // ccNewsRelegated больше не пишется — из первого дивизиона не вылетают, см.
  // careerNewSeason, — но ключ остаётся ради старых сейвов, чья лента его уже
  // держит: без автора такая строка ушла бы под имя сцены задним числом.
  ccNewsRelegated:'press', ccNewsKeptD1:'press', ccNewsKeptD1Low:'press',
  ccNewsRetired:'press', ccNewsRetiredForced:'press', ccNewsSceneRetire:'press', ccNewsRegen:'press',
  ccNewsDuoAgain:'you', ccNewsDuoSplit:'you', ccNewsDuoOutgrown:'you',
  ccNewsDuoAnnounce:'you',
  ccNewsMajThrough:'you', ccNewsMajOut:'you', ccNewsMajCash:'you', ccNewsMajNoCash:'you', ccNewsEvCash:'you', ccNewsEvNoCash:'you',
  ccNewsSumThrough:'you', ccNewsSumOut:'you', ccNewsSumCash:'you', ccNewsSumNoCash:'you',
  ccNewsSoloThrough:'you', ccNewsSoloOut:'you', ccNewsSoloCash:'you',
  ccNewsRcThrough:'you', ccNewsRcDrop:'you', ccNewsRcOut:'you', ccNewsRcCash:'you', ccNewsRcChamp:'you',
  ccNewsRcMvp:'you',
  ccNewsGcThrough:'you', ccNewsGcIn:'you', ccNewsGcOut:'you', ccNewsGcCash:'you', ccNewsGcNoCash:'you',
  ccNewsGcSeat:'you',
  ccNewsGlobCash:'you', ccNewsGlobNoCash:'you', ccNewsGlobChamp:'you',
  // An award is the scene's to hand out, so it is the scene's to announce —
  // and below Division 1, where the scene does not report, ccPressWorthy turns
  // the same line into the player's own post.
  // An answer is the player's own words, so it is the player's own post. The
  // key carries which wording was used, so all four of each are listed.
  ccIvSaidduo1:'you', ccIvSaidduo2:'you', ccIvSaidduo3:'you', ccIvSaidduo4:'you',
  ccIvSaidboast1:'you', ccIvSaidboast2:'you', ccIvSaidboast3:'you', ccIvSaidboast4:'you',
  ccIvSaidblame1:'you', ccIvSaidblame2:'you', ccIvSaidblame3:'you', ccIvSaidblame4:'you',
  // And the trio wordings of the same three, which are the same post.
  ccIvSaidduot1:'you', ccIvSaidduot2:'you', ccIvSaidduot3:'you', ccIvSaidduot4:'you',
  ccIvSaidblamet1:'you', ccIvSaidblamet2:'you', ccIvSaidblamet3:'you', ccIvSaidblamet4:'you',
  ccNewsAward:'press', ccNewsAwardYou:'press',
  // Снятие команды перед ЛАНом (ccLanDqRoll) — новость сцены.
  ccNewsDqSeat:'press', ccNewsDqOther:'press',
  ccNewsAwardSeason:'press', ccNewsAwardSeasonYou:'press', ccNewsAwardCat:'press', ccNewsAwardCatYou:'press',
  ccNewsPartnerNew:'you', ccNewsSquadNew:'you', ccNewsDropped:'you', ccNewsPairFreed:'you', ccNewsRoleMoved:'you', ccNewsRoleYes:'you', ccNewsRoleNo:'you', ccNewsTalkFix:'you', ccNewsTalkKeep:'you', ccNewsTalkFine:'you', ccNewsTalkAgain:'you',
  // Переезд вдвоём — это твой пост: платил за него ты. Автора ему не завели,
  // когда добавляли саму кнопку; check-career-feed поймал.
  ccNewsMovedTogether:'you',
  // The seat beside you changing hands is the player's own news, both ways.
  ccNewsMateLeftFor:'you', ccNewsTrialGone:'you',
  ccNewsBoughtOut:'you',
  ccNewsStreamAd:'you',
  // The rivalry is the player's own running commentary on their season.
  ccNewsRivalWon:'you', ccNewsRivalLost:'you',
  // A scrim score and a bootcamp are the player's own week, not the scene's.
  ccNewsCampReady:'you',
  // 3 сентября: поездка на ЛАН, нервы, мета, бонус и уход клуба,
  // развилки дня — свои строки о своём дне, клубные — с by клуба.
  ccPostLanArrive:'you', ccNewsMetaNew:'press', ccNewsResultWf:'you', ccNewsResultWeekWf:'you',
  // Трансфер объявляет сам человек (by приходит с постом), рост и спад — пресса.
  ccNewsSceneDuo:'by', ccNewsSceneRise:'press', ccNewsSceneFall:'press',
  ccNewsProAmCash:'you', ccNewsProAmOut:'you', ccNewsProAmReach:'you',
  // Коллаб-стрим — свой вечер, свой пост. См. careerStreamGo.
  ccNewsStreamColab:'you', ccNewsColabYes:'you', ccNewsColabNo:'you',
  // И эфир с турнира — тоже свой. Денег в строке нет намеренно: правка 23
  // августа сняла из ленты денежные твиты эфира, отчёт вечера с заработком
  // живёт в панели дня. См. ccStreamCupAfter.
  ccNewsStreamCup:'you',
  ccNewsTwAffiliate:'you', ccNewsTwPartner:'you',
  ccNewsOrgBonus:'by', ccNewsOrgGone:'by', ccPostLft:'you',
  ccDayEvmateSpotRmove:'you', ccDayEvmateSpotRkeep:'you', ccDayEvmateSpotRtrial:'you',
  ccDayEvorgLateRwait:'you', ccDayEvorgLateRpublic:'you', ccDayEvorgLateRleave:'you',
  ccDayEvleakRdeny:'you', ccDayEvleakRconfirm:'you', ccDayEvleakRsilent:'you',
  ccDayEvhouseRgo:'you', ccDayEvhouseRno:'you',
  ccDayEvcoachFreeRtake:'you', ccDayEvcoachFreeRpass:'you',
  ccDayEvtiltRblame:'you', ccDayEvtiltRown:'you', ccDayEvtiltRtalk:'you',
  ccDayEvorgQuitRfa:'you', ccDayEvorgQuitRquiet:'you',
  // Answering a hater is the player's own decision and their own post.
  // The partner's mood stays with the press account, even though it is about
  // them. Every line in this feed is written as a report — "Rimo is unhappy with
  // the week" — and a report about somebody, posted from their own account,
  // reads as a person talking about themselves in the third person. Moving them
  // to the partner needs the copy rewritten in the first person first, and that
  // is a change to the words rather than to who says them.
  ccNewsPartnerHappy:'press', ccNewsPartnerCross:'press', ccNewsPartnerLeft:'press',
  ccNewsCongrats:'press', ccNewsD1Table:'press',
  ccNewsWorldWon:'press',   // финал без игрока — пишет пресса, как таблицу Д1 (16.09)
  // Ранкед и Арена, свой буткемп, свой турнир: строки о самом игроке.
  rkNewsArenaReset:'you', rkNewsReset:'you', rkNewsDown:'you', rkNewsPlaced:'you', rkNewsTop100:'you', rkNewsTop1:'you',
  ccNewsHomeCamp:'you', ownNewsAnnounce:'you', ownNewsQualOut:'you'
};
/* What the scene's account covers: Division 1, the Majors, the Reload circuit
   — the rooms with real names in them — and congratulating whoever won. Real
   competitive accounts do not report the ladder's middle, and this one did: a
   Division 4 cup result, a Division 3 signing, all filed under the scene's
   banner. Anything the gate turns away is the player's own post instead,
   which is who actually announces those things. */
function ccPressWorthy(e){
  if(e.k==='ccNewsCongrats') return true;
  // Расписание года — анонс Epic для всех, в каком бы дивизионе ни читали.
  if(e.k==='ccNewsRoadmap') return true;
  // A birthday is the scene's own account posting about the scene, whatever
  // division the career reading it happens to be standing in — and the same
  // holds for the one it sends the player, which is the whole reason a career
  // is given somewhere to write a date of birth down. See careerBirthdays.
  if(e.k==='ccPostBday' || e.k==='ccPostBdayEpic') return true;
  if(e.k==='ccNewsPromoted') return !!(e.a && e.a[0]===1);
  /* Дивизион у записи, а если его нет — у карьеры. КАРЬЕРЫ МОЖЕТ НЕ БЫТЬ:
     Скриншот, красная плашка «Cannot read properties of null
     (reading 'career')» — лента дорисовывается после выхода из карьеры, а
     разбор автора поста лезет сюда. Тогда запись читается как не-первый
     дивизион: её напишет игрок, а не пресса, и это безопасный ответ. */
  const cr=CAREER && CAREER.career;
  return (e.dv!=null ? e.dv : (cr ? cr.division : 5))===1;
}
// The scene's own account — the name the real one goes by, which is what the
// user asked for: @FNCompetitive is who posts FNCS results.
/* av — аватарка аккаунта, правка: «в Notion добавил аватарку
   для твитера фортнайт». До неё единственный аккаунт ленты, который не игрок,
   сидел под кружком с двумя буквами: у игрока и у напарника лица берутся с
   карточки, а у сцены карточки нет и взять было неоткуда. Файл лежит там же,
   где портреты, — это лицо в ленте, а не эмблема клуба. */
/* Аналитик сцены: свой аккаунт, как у прессы, со своим лицом. */
const CC_ANALYST={name:'Kinch Analytics', handle:'KinchAnalytics', verified:true,
                  av:'KinchAnalytics.jpg'};
const CC_PRESS={name:'Fortnite Competitive', handle:'FNCompetitive', verified:true,
                av:'FNCompetitive.png'};
// The action row's glyphs, drawn rather than lettered so they read at 13px and
// do not depend on an emoji font being present.
const CC_X_REPLY='<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.9-.8L3 21l1.9-4.6A8.3 8.3 0 0 1 3.6 11.5a8.4 8.4 0 0 1 9-8.4 8.4 8.4 0 0 1 8.4 8.4z"/></svg>';
const CC_X_REPOST='<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M17 2l4 4-4 4"/><path d="M3 12V9a3 3 0 0 1 3-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 12v3a3 3 0 0 1-3 3H3"/></svg>';
const CC_X_LIKE='<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 20.5S3.5 15 3.5 9.2A4.7 4.7 0 0 1 12 6.6a4.7 4.7 0 0 1 8.5 2.6c0 5.8-8.5 11.3-8.5 11.3z"/></svg>';
const CC_X_HOME='<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/></svg>';
const CC_X_CHAT='<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.9-.8L3 21l1.9-4.6A8.3 8.3 0 0 1 3.6 11.5a8.4 8.4 0 0 1 9-8.4 8.4 8.4 0 0 1 8.4 8.4z"/></svg>';
const CC_X_DISCORD='<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M7 6.5c3.3-1.3 6.7-1.3 10 0 1.6 2.6 2.4 5.6 2.2 9-1.4 1.1-2.9 1.8-4.5 2.3l-1-1.7M7 6.5C5.4 9.1 4.6 12.1 4.8 15.5c1.4 1.1 2.9 1.8 4.5 2.3l1-1.7"/><circle cx="9.5" cy="12.5" r="1.2"/><circle cx="14.5" cy="12.5" r="1.2"/></svg>';
const CC_X_USER='<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="8" r="3.6"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/></svg>';
const CC_X_VIEWS='<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M4 20V10M10 20V4M16 20v-7M22 20V8"/></svg>';
/* Followers. Invented, nothing in the roster data measures it. Anchored so a career starts unknown and a streaming
   Division 1 regular reaches tens of thousands in a year.
   Moved by stream days (more reach higher up), results (steep in placement: a D1 win is worth six stream days,
   mid-table half of one) and signing for a club (a slice of its audience). Nothing takes followers away. */
const CC_REACH_DIV = d => 20 + (5-clamp(d,1,5))*40;
// What an evening on stream is worth: one dollar per two thousand readers, so
// fifty thousand is twenty-five dollars a night. Small on purpose - see the day
// loop, where it is paid.
const CC_STREAM_PER=2000;
/* Followers for a night on stream, by rung. Measured against CC_XFOLLOW rather
   than drawn as a line: nobody is watching Division 5, and Division 1 is watched
   every week. At roughly 150 stream nights a year this is 750 / 1,800 / 3,750 /
   9,000 / 27,000 from the bottom up. */
const CC_STREAM_BY_DIV={1:180, 2:60, 3:25, 4:12, 5:5};
function CC_STREAM_REACH(d){ return CC_STREAM_BY_DIV[clamp(d,1,5)] || CC_REACH_DIV(d); }
// A scrim is a set, and a set is twelve rounds.
function careerReach(){ return (CAREER.career.reach||0); }
const CC_SMM_DAYS=30;
const CC_SMM_X_FLOOR=250, CC_SMM_X_TOP=2500;
const CC_SMM=[
  {id:'v1ntero',  name:'v1ntero77',       at:'v1nteroFN',  photo:'v1nteroFN.jpg',  x:2152},
  // Social media manager and editor. His own line names who he has worked with,
  // and most of them are on this roster — Sky, Scroll, Tjino, Pablowingu, Pixie —
  // so he arrives inside the scene the mode already describes, the way João does
  // among the managers. Count read off x.com on 19 August 2026.
  {id:'sweety',   name:'Sweety',          at:'SweetyyFN',  photo:'SweetyyFN.jpg',  x:1827},
  {id:'sandora',  name:'SandoraFN',       at:'SandoraFN',  photo:'SandoraFN.jpg',  x:1006},
  // x.com/baderwtw (Notion «02», 2.10): «w/w @creedtalent | Co-Own @Forceesportss», ведёт
  // eomzo1, regsita, channcefn и других. 855 фолловеров по api.fxtwitter.com 2 октября 2026.
  {id:'bader',    name:'bader',           at:'baderwtw',   photo:'baderwtw.jpg',   x:855},
  {id:'pyp4ing',  name:'Pyp4ingS',        at:'Pyp4ingS',   photo:'Pyp4ingS.jpg',   x:602},
  {id:'ugo',      name:'Lyost Ugo',       at:'UgoComm',    photo:'UgoComm.jpg',    x:543},
  {id:'lair',     name:'LairFN',          at:'Lair_Fn',    photo:'Lair_Fn.jpg',    x:456},
  {id:'veltrixx', name:'Lyost zVeltrixx', at:'veltrixx10', org:'zVeltrixx',
                  photo:'veltrixx10.jpg', x:427},
  {id:'lumos',    name:'MGA Lumos',       at:'CmLumos',    photo:'CmLumos.jpg',    x:296},
  /* Скриншот профиля: x.com/MetiDark_ — NOW MetiDark, Франция,
     Community Manager у Noww_eSport и REC_2027, TikTok у WyckerTv, 46
     фолловеров. CM, а не SMM по названию, но работа та же, и список это уже
     знает: MGA Lumos строчкой выше — тоже CM (CmLumos), как и Lyost Ugo
     (UgoComm).

     Сорок шесть — это НИЖЕ пола шкалы (CC_SMM_X_FLOOR=250), поэтому ccSmmPull
     зажимает его тягу в ноль: самый слабый СММ из возможных. Так и должно
     быть, и это не повод опускать пол — аккаунту четыре месяца. */
  {id:'metidark', name:'NOW MetiDark',    at:'MetiDark_',  photo:'MetiDark_.jpg',  x:46}
];
// Подписчики в окнах — свежие (CC_STAFF_X, 8.10.2026), где снимок есть.
[CC_AGENTS, CC_SMM, CC_MARKETING].forEach(list=>list.forEach(x=>{ if(CC_STAFF_X[x.at]!=null) x.x=CC_STAFF_X[x.at]; }));
// Where an account sits between the smallest of them and the biggest, 0 to 1.
function ccSmmPull(x){
  if(!(x>0)) return null;
  const lo=Math.log(CC_SMM_X_FLOOR), hi=Math.log(CC_SMM_X_TOP);
  return clamp((Math.log(x)-lo)/(hi-lo), 0, 1);
}
/* What a month of them costs and what it does. A written-in number still wins,
   the way it does for the player's manager, so one of them can be tuned by hand
   without the curve arguing back. */
function ccSmmTermsOf(m){
  const k=ccRankPull(CC_SMM, m);
  // Цена — та же кривая штаба, $150…3 000 (17.10, его «а другой стафф»); прирост — прежний.
  const t=(k==null) ? {cost:600, boost:0.22}
                    : {cost:ccStaffCostCurve(150, 3000, k), boost:+(0.18+k*0.42).toFixed(2)};
  return {cost: m && m.cost!=null ? m.cost : t.cost,
          boost: m && m.boost!=null ? m.boost : t.boost};
}
// What the cheapest of them asks, which is what the tile prints before anybody
// is hired.
const CC_SMM_FROM=Math.min.apply(null, CC_SMM.map(m=>ccSmmTermsOf(m).cost));
function ccSmmOf(id){ return CC_SMM.find(x=>x.id===id) || null; }
function ccSmm(){
  const m=CAREER && CAREER.smm;
  if(!m || careerToday()>m.until) return null;
  return m;
}
function ccSmmBoost(){
  const m=ccSmm();
  if(!m) return 0;
  // Stored on the month, so terms agreed under an old price list still stand.
  return m.boost!=null ? m.boost : ccSmmTermsOf(ccSmmOf(m.id)).boost;
}
/* Staff bring their own audience on top of the boost.
   The boost is a share of what a result paid, and CC_REACH_DIV is 20/night in Division 5 vs 180 in Division 1, so at the bottom it was close to nothing.
   An editor posts regardless of results: a month of work brings a quarter of their follower count (from the roster), delivered per day rather than in a lump.
   Also counted into cr.smmGot so the tile can show what the hire actually did. */
const CC_SMM_OWN=0.25;
function ccSmmWork(nights){
  const m=ccSmm();
  if(!m || !(nights>0)) return 0;
  const card=ccSmmOf(m.id) || m;
  const own=(card && card.x) || 0;
  if(!own) return 0;
  // Their own audience, spread across the month they are hired for. Raw, so the
  // boost does not pay itself a percentage of its own work.
  const per=own*CC_SMM_OWN/CC_SMM_DAYS;
  const got=careerReachAdd(per*nights, true);
  const cr=CAREER.career;
  cr.smmGot=(cr.smmGot||0)+got;
  return got;
}
// What the month has actually brought, for the tile to print instead of a
// percentage nobody could check.
function ccSmmGot(){ return Math.round((CAREER && CAREER.career && CAREER.career.smmGot) || 0); }
function careerHireSmm(id, months){
  months=months>=CC_STAFF_YEAR ? CC_STAFF_YEAR : 1;
  const cr=CAREER.career;
  const who=ccSmmOf(id) || CC_SMM[0];
  // Смена, как у коуча и маркетолога: отзыв — «СММ сделай такую же кнопку, чтоб мог выбирать».
  if(ccSmm() && ccSmm().id===who.id) return false;
  const t=ccSmmTermsOf(who), due=ccStaffTermCost(t.cost, months);
  if((cr.balance||0)<due) return false;
  cr.balance-=due;
  CAREER.smm={id:who.id, name:who.name, at:who.at, photo:who.photo,
              cost:t.cost, boost:t.boost, x:who.x, months,
              from:careerToday(), until:ccAddDays(careerToday(), ccStaffTermDays(months))};
  // The count starts at nought with the month, so the tile reads what this hire
  // has brought rather than what every hire ever has.
  cr.smmGot=0;
  careerSave();
  ccSmmPickClose();
  careerRenderHub();
  return true;
}
/* The three of them behind a press, the same shape the coaches are picked in:
   a face, what they are for, and one button. */
function ccSmmPickOpen(){
  const cr=CAREER.career;
  const rows=ccByHand(CC_SMM).map(m=>{
    const t=ccSmmTermsOf(m);
    const on=!!ccSmm() && ccSmm().id===m.id;
    const can=!on && (cr.balance||0)>=t.cost;
    return `<div class="cc-buy${on?' own':''}">
      <img class="cc-buy-img cc-buy-face" src="${PHOTO_DIR}${esc(m.photo)}" alt=""
           loading="lazy" onerror="this.remove()">
      <div class="cc-buy-in"><b><span class="cc-buy-nm">${esc(m.name)}</span> ${ccStaffBadge(ccStaffRating(m)).replace('cc-staff-rt', 'cc-staff-rt mgf-rt')}</b>
        <i class="cc-buy-who">${m.x ? '👥 '+ccFollowers(m.x)+' · ' : ''}@${esc(m.at)}${m.org ? ' · '+esc(m.org) : ''}</i>
        <span class="cc-buy-chips"><em class="up">${L().ccSmmGain} +${Math.round(t.boost*100)}%</em></span></div>
      ${on ? `<span class="cc-owned">${L().ccShopUntil(ccDayLabel(CAREER.smm.until))}</span>`
           : ccHireBtns(can, t.cost, "careerHireSmm('"+m.id+"')", "careerHireSmm('"+m.id+"',12)")}
    </div>`;
  }).join('');
  document.getElementById('smmPickBody').innerHTML=
    `<h4 class="cc-pick-h">${L().ccSmm}</h4>
     <div class="ch-hint">${L().ccSmmHint}</div>
     <div class="cc-buys">${rows}</div>`;
  document.getElementById('smmPickModal').style.display='flex';
  document.addEventListener('keydown', ccSmmPickKey);
}
function ccSmmPickClose(){
  const m=document.getElementById('smmPickModal');
  if(m) m.style.display='none';
  document.removeEventListener('keydown', ccSmmPickKey);
}
function ccSmmPickKey(e){ if(e.key==='Escape') ccSmmPickClose(); }
/* НАЁМ НА ТУРНИР (29.10, идея игрока из Notion 27.10 скрин 27: «чтобы ты мог заплатить игрокам на голову
   сильнее, чтобы они пошли с тобой турнир»; его выбор «наём на турнир»). В день турнира — кнопка на Центре:
   топ-100 сцены твоего региона по рейтингу (сверху сильнейшие), плата сразу. Нанятый садится в первое кресло на ЭТОТ день (careerMates/careerPartnerCard): поле турнира
   убирает его из своей пары, как убирает любого из твоего состава (careerCupField, mine). Призы — как с
   напарником. Отменить до игры — деньги назад. Цена — ccHireFee ниже (заработок за вечер).
   В команде и в гонке найма нет: первое кресло там занято человеком. */
/* ЦЕНА ПО ЗАРАБОТКАМ (29.10, его «цены нереалистичные, слишком мало»). Было 150 × 1,15^(r−85): Sky 95 — $610 за вечер,
   при его $277 тыс. призовых за 2026. Замер (scratchpad hire-fit.js): заработок 2026 из Liquipedia (HOME_EARN_LQ, 49 игроков
   с карточкой) против рейтинга карточки — log(e) = CC_HIRE_FIT_A + CC_HIRE_FIT_B·r (r² 0,30; шаг ×1,147 за очко — тот же,
   что был, ошибалась база). Цена — заработок игрока за один дуо-вечер года: свой из Liquipedia, если он есть и год 2026,
   иначе по кривой; делитель CC_HIRE_DAYS — дни дуо-турниров карьеры 2026 (кубки 34, финалы 19, Мейджоры 18, Victory 23,
   Reload 24, Саммит 5, GC 11, Глобалы 2). Что турнир платит больше или меньше среднего, цена не знает — это оценка. */
/* 29.10 вечером (его «цены больше, чёт слишком мало»): делитель — не все 136 дуо-дней года, а около 40 турниров, в которых
   топ-игрок за год реально играет и берёт призы (кубки, финалы, Мейджоры, Глобалы). 40 — оценка, не замер. */
const CC_HIRE_FIT_A=-1.110, CC_HIRE_FIT_B=0.1371, CC_HIRE_DAYS=40, CC_HIRE_TOP=100;
let CC_HIRE_MEMO=null;
function ccHireAllowed(){
  return !!(CAREER && CAREER.career) && !(typeof ccMpOn==='function' && ccMpOn()) &&
    !(typeof ccRacePairOn==='function' && ccRacePairOn()) && !(typeof ccRaceLock==='function' && ccRaceLock()) &&
    careerMateSeats()>0;
}
/* Нанятые на сегодня — список (cr.hire.list), по одному на кресло напарника: в трио двое, в скваде трое. Старый сейв
   хранил одного ({handle, region, fee}) — читается как список из одного. */
function ccHireList(){
  const h=CAREER && CAREER.career && CAREER.career.hire;
  if(!h || h.day!==careerToday()) return [];
  if(Array.isArray(h.list)) return h.list;
  return h.handle ? [{handle:h.handle, region:h.region, fee:h.fee||0}] : [];
}
function ccHireActive(){ return ccHireList().length>0 && ccHireAllowed(); }
function ccHireCards(){
  const list=ccHireList(), day=careerToday(), key=list.map(x=>x.handle).join('|')+'|'+day;
  if(CC_HIRE_MEMO && CC_HIRE_MEMO.key===key) return CC_HIRE_MEMO.cards;
  const cards=list.map(x=>{ try{ return ccMateCardOf({handle:x.handle, cardRegion:x.region}); }catch(e){ return null; } }).filter(Boolean);
  CC_HIRE_MEMO={key, cards};
  return cards;
}
// Ключи нанятых сегодня — их команды в мире не пересобираются (ccTrioRefill): наём на один кап, а не переход.
function ccHireKeys(){ return new Set(ccHireActive() ? ccHireList().map(x=>hKey(x.handle)) : []); }
function ccHireOvr(c){ return Math.round(c ? (c._ovr!=null ? c._ovr : ((attrsFor(c)||{}).ovr||c.rating||0)) : 0); }
function ccHireEarn(c, ovr){
  if(c && c.handle && (CAREER && CAREER.career && CAREER.career.year)===2026 && typeof HOME_EARN_LQ!=='undefined'){
    const k=hKey(c.handle), r=HOME_EARN_LQ.find(x=>hKey(x.n)===k); if(r && r.e>0) return r.e;
  }
  return Math.exp(CC_HIRE_FIT_A+CC_HIRE_FIT_B*ovr);
}
/* Медийка в цене (29.10, его «пусть медийка тоже влияет на цену игры»): подписчики в X (CC_XFOLLOW — настоящие у 343 про,
   иначе кривая по рейтингу ccReachOf). 50 тыс. — ×1; каждый десятикратный рост — +25%, в пределах ×0,8…×1,6: Clix (2,9 млн)
   ×1,44, Peterbot (805 тыс.) ×1,30, Sky (42 тыс.) ×0,98. Шкала — оценка режима, данных о гонорарах нет. */
function ccHireMedia(c, ovr){
  const fl=(typeof ccReachOf==='function') ? ccReachOf(ovr, c && c.handle) : 0;
  return fl>0 ? clamp(1+0.25*Math.log10(fl/50000), 0.8, 1.6) : 1;
}
function ccHireFee(ovr, c){ return Math.max(50, Math.round(ccHireEarn(c, ovr)/CC_HIRE_DAYS*ccHireMedia(c, ovr)/10)*10); }
function ccHireCands(){
  const reg=ccCareerRegion();
  const roster=(typeof ccSceneRoster==='function' && reg!=='EU') ? ccSceneRoster(reg) : careerRosterNowEU();
  const own=careerMateRecords().map(ccMateCardOf).filter(Boolean);
  const mine=new Set([hKey(CAREER.player.handle||CAREER.player.nick||'')].concat(own.map(c=>hKey(c))));
  /* Все игроки региона, не только сильнее напарника (29.10, его «пусть все игроки региона твоего будут в этом списке»):
     сверху сильнейшие, один ник — одна строка; потом — только топ CC_HIRE_TOP региона (его «возьми топ 100 каждого региона»). */
  const seen=new Set();
  return (roster||[]).filter(c=>{ if(!c || !c.handle || mine.has(hKey(c))) return false; const k=hKey(c); if(seen.has(k)) return false; seen.add(k); return true; })
    .sort((a,b)=>ccHireOvr(b)-ccHireOvr(a)).slice(0, CC_HIRE_TOP);
}
function ccHireOpen(){
  if(!ccHireAllowed()) return;
  const cr=CAREER.career, T=L(), list=ccHireCands(), got=ccHireList(), seats=careerMateSeats();
  const hired=new Set(got.map(x=>hKey(x.handle))), full=got.length>=seats;
  const rows=list.map((c, i)=>{
    const ovr=ccHireOvr(c), fee=ccHireFee(ovr, c), on=hired.has(hKey(c)), can=on || (!full && (cr.balance||0)>=fee);
    return '<div class="cc-buy'+(on ? ' own' : '')+'"><div class="cc-buy-in"><b>'+cardFlag(c, 14)+'<span class="cc-buy-nm">'+esc(c.handle)+'</span> <span class="cc-staff-rt mgf-rt">'+ovr+'</span></b>'+
      '<i class="cc-buy-who">'+esc(c.org||T.ccHireFree||'')+' · X '+esc(ccFollowText(c.handle, ovr))+'</i></div>'+
      '<span class="cc-buy-btns"><button class="'+(on ? 'cc-back' : 'ch-sign')+'"'+(can?'':' disabled')+' onclick="careerHire('+i+')">'+(on ? esc(T.ccHireCancel) : ccMoney(fee))+'</button></span></div>';
  }).join('');
  const count=seats>1 && T.ccHireCount ? '<div class="ch-hint"><b>'+esc(T.ccHireCount(got.length, seats))+'</b></div>' : '';
  document.getElementById('hirePickBody').innerHTML='<h4 class="cc-pick-h">'+esc(T.ccHireT)+'</h4>'+
    '<div class="ch-hint">'+esc(T.ccHireHint)+'</div>'+count+(rows ? '<div class="cc-buys">'+rows+'</div>' : '<p class="ch-empty">'+esc(T.ccHireNone)+'</p>');
  document.getElementById('hirePickModal').style.display='flex';
  document.addEventListener('keydown', ccHireKey);
}
function ccHireClose(){
  const m=document.getElementById('hirePickModal'); if(m) m.style.display='none';
  document.removeEventListener('keydown', ccHireKey);
}
function ccHireKey(e){ if(e.key==='Escape') ccHireClose(); }
/* Нажатие на строку: свободное кресло есть — нанять (платишь сразу, каждому своё); уже нанят — отпустить с возвратом.
   Кресла заняты все — новых не берёт, пока кого-то не отпустишь. Окно остаётся открытым, пока мест больше одного. */
function careerHire(i){
  const cr=CAREER.career; if(!ccHireAllowed()) return;
  const c=ccHireCands()[i]; if(!c) return;   // номер в том же списке, что показан в окне
  const list=ccHireList().slice(), at=list.findIndex(x=>hKey(x.handle)===hKey(c));
  if(at>=0){ cr.balance=(cr.balance||0)+(list[at].fee||0); list.splice(at, 1); }
  else {
    if(list.length>=careerMateSeats()) return;
    const fee=ccHireFee(ccHireOvr(c), c);
    if((cr.balance||0)<fee) return;
    cr.balance=(cr.balance||0)-fee;
    list.push({handle:c.handle, region:ccCareerRegion(), fee});
  }
  cr.hire=list.length ? {day:careerToday(), list} : null;
  CC_HIRE_MEMO=null;
  careerSave();
  if(careerMateSeats()>1 && list.length<careerMateSeats()) ccHireOpen(); else ccHireClose();
  careerRenderHub();
}
function careerHireCancel(){
  const cr=CAREER.career; if(!ccHireActive()) return;
  cr.balance=(cr.balance||0)+ccHireList().reduce((s,x)=>s+(x.fee||0), 0); cr.hire=null; CC_HIRE_MEMO=null;
  careerSave(); careerRenderHub();
}
/* АНАЛИТИК И ПСИХОЛОГ (его слова 8.10: «1 2 6 какие есть примеры» → «поищи ещё психологов и аналитиков» →
   «youenn не надо», «и аналитикам сделай рейтинги»). Люди настоящие, найдены 8.10.2026:
   аналитики — категория Analysts на Liquipedia и состав официальной трансляции FNCS (Liquipedia: Major 1 Summit 2026,
   GC 2025; пост @FNCompetitive о составе GC 2024), Kinch — «Official FNCS Data Provider», Osirion — сервис данных;
   психологи — AlwyzPAPPIE («Mental-life-performance mentor», бывший коуч Falcons EU), Val («Préparateur Mental &
   Physique diplômé»), Mia Stellberg (лицензированный психолог и психотерапевт, OG / SK / ENCE; аккаунта X не нашёл).
   РЕЙТИНГ. Аналитик: 60 + работа на FNCS + свои призовые + 1.5·lg(подписчики/1000) (см. CC_ANALYST_ROLE); потолок 95. Психолог: по известным фактам, а не по аудитории — у этой профессии её почти нет
   (Mia 90: лицензия и 19 лет, топ-клубы; AlwyzPAPPIE 80: про-клиенты, бывший коуч Falcons; Val 72: диплом).
   ЭФФЕКТ (оценка режима). Аналитик — разбор соперников перед вечером: +1…+3 к силе своей команды (только в одиночной
   карьере — в командной у двоих сила должна сходиться, как с эфиром, ccStreamPow). Психолог — работа с тильтом: шаг
   формы вниз после плохого вечера мягче на 25…50%. Цена в месяц от рейтинга: аналитик $1 000…2 500, психолог $800…2 500. */
const CC_STAFF2_DAYS=30;
/* Без ведущих и стола трансляции FNCS (его слово 8.10: «Leven и бродкаст FNCS убрать будто можно»): остались те, чья
   работа — анализ: официальная статистика, независимые аналитики, сервис данных. */
const CC_ANALYSTS=[
  {id:'kinch',    name:'Kinch Analytics',at:'KinchAnalytics', photo:'KinchAnalytics.jpg', x:96473,  role:'data', earn:0,  why:'Official FNCS Data Provider'},
  {id:'reisshub', name:'Reisshub',       at:'Reisshub',       photo:'Reisshub.jpg',       x:65644,  role:'indie', earn:2367, why:'Fortnite analyst'},
  {id:'osirion',  name:'Osirion',        at:'osirion_gg',     photo:'osirion_gg.jpg',     x:39270,  role:'service', earn:0, why:'Fortnite data & AI coach'}
];
const CC_PSYCHS=[
  {id:'stellberg',name:'Mia Stellberg', at:null,          photo:'MiaStellberg.jpg',              x:0,     rating:90, why:'licensed psychologist, OG / SK / ENCE'},
  {id:'pappie',   name:'AlwyzPAPPIE',   at:'AlwyzPAPPIE', photo:'AlwyzPAPPIE.jpg', x:17004, rating:80, why:'mental performance mentor, ex-coach Falcons EU'},
  {id:'val',      name:'Val',           at:'ValentaynL',  photo:'ValentaynL.jpg',  x:3072,  rating:72, why:'certified mental & physical trainer'}
];
/* Рейтинг аналитика — по результатам (его слова 8.10: «leven не настолько аналитик жёсткий», «упор на результаты»).
   Работа: официальная статистика FNCS +20, стол аналитиков трансляции FNCS +12, сервис данных +8, кастер или ведущий
   трансляции +6, независимый аналитик +4. Своя игра: 4·lg(призовые/10 000$) по Liquipedia (Vivid 26k, Blakeps 83k,
   Tocata 6k). Аудитория — 1.5·lg(подписчики/1000), почти ничего. */
const CC_ANALYST_ROLE={data:20, desk:12, service:8, host:6, indie:4};
/* Цены штаба — как у коучей (17.10, его «а другой стафф» после «цены коучей поменять»): от рейтинга по квадрату,
   дешёвый низ по карману со второго-третьего дивизиона, верх как хорошая зарплата первого. Аналитик $300…6 000
   (+1…+3 к силе — эффект сильный), психолог $250…4 000. См. ccStaffCostCurve. */
const CC_STAFF2={analyst:{list:CC_ANALYSTS, cost:[300,6000]}, psych:{list:CC_PSYCHS, cost:[250,4000]}};
function ccStaffCostCurve(lo, hi, k){
  const c=lo+(hi-lo)*k*k;
  return c<1000 ? Math.round(c/50)*50 : Math.round(c/100)*100;
}
function ccStaff2Rating(kind, p){
  if(!p) return 60;
  if(p.rating!=null) return p.rating;
  // Упор на результаты (его слово 8.10): работа на FNCS + собственные призовые (Liquipedia), аудитория — почти ничего.
  const play=p.earn>10000 ? 4*Math.log10(p.earn/10000) : 0;
  return Math.max(60, Math.min(95, Math.round(60+(CC_ANALYST_ROLE[p.role]||0)+play+1.5*Math.log10(Math.max(1000, p.x||0)/1000))));
}
function ccStaff2K(kind, p){ return Math.max(0, Math.min(1, (ccStaff2Rating(kind, p)-60)/35)); }
function ccStaff2Cost(kind, p){ const c=CC_STAFF2[kind].cost; return ccStaffCostCurve(c[0], c[1], ccStaff2K(kind, p)); }
function ccStaff2List(kind){ return CC_STAFF2[kind].list.slice().sort((a,b)=>ccStaff2Rating(kind, b)-ccStaff2Rating(kind, a) || (b.x||0)-(a.x||0)); }
function ccStaff2(kind){ const m=CAREER && CAREER[kind]; return (!m || careerToday()>m.until) ? null : m; }
function ccAnalystPow(){ const m=ccStaff2('analyst'); return (!m || ccMpOn() || ccRaceOn()) ? 0 : Math.round(1+2*Math.max(0, Math.min(1, (m.rating-60)/35))); }
function ccPsychSoft(){ const m=ccStaff2('psych'); return !m ? 0 : Math.round((0.25+0.25*Math.max(0, Math.min(1, (m.rating-60)/35)))*100)/100; }
function careerHireStaff2(kind, id, months){
  months=months>=CC_STAFF_YEAR ? CC_STAFF_YEAR : 1;
  const cr=CAREER.career, who=CC_STAFF2[kind].list.find(p=>p.id===id); if(!who) return false;
  if(ccStaff2(kind) && ccStaff2(kind).id===id) return false;
  const cost=ccStaff2Cost(kind, who), due=ccOrgPays(kind) ? 0 : ccStaffTermCost(cost, months); if((cr.balance||0)<due) return false;
  cr.balance-=due;
  CAREER[kind]={id:who.id, name:who.name, at:who.at, photo:who.photo, cost, rating:ccStaff2Rating(kind, who), months,
                from:careerToday(), until:ccAddDays(careerToday(), ccStaffTermDays(months))};
  careerSave(); ccStaff2PickClose(); careerRenderHub(); return true;
}
function careerEndStaff2(kind){ if(!CAREER[kind]) return false; CAREER[kind]=null; careerSave(); careerRenderHub(); return true; }
function ccStaff2Effect(kind, rating){
  const k=Math.max(0, Math.min(1, ((rating||60)-60)/35));
  return kind==='analyst' ? L().ccAnalystPow(Math.round(1+2*k)) : L().ccPsychSoft(Math.round((0.25+0.25*k)*100));
}
function careerStaff2TileHTML(kind){
  const m=ccStaff2(kind), T=L(), K=kind==='analyst' ? 'ccAnalyst' : 'ccPsych';
  if(m) return `<div class="ch-tile">
    <h4>${T[K]}</h4>
    <div class="ch-orghead">${m.photo ? `<img class="ch-coach-av" src="${PHOTO_DIR}${esc(m.photo)}" alt="" onerror="this.remove()">` : ''}
      <b>${esc(m.name)}</b>${m.at ? `<em class="ch-agent-at">@${esc(m.at)}</em>` : ''}</div>
    <div class="ch-row"><em>${T.ccRoOvr}</em><b>${m.rating}</b></div>
    <div class="ch-row"><em>${T[K+'Does']}</em><b class="ch-goal-met">${ccStaff2Effect(kind, m.rating)}</b></div>
    <div class="ch-row"><em>${T.ccWage}</em><b>${ccNum(m.cost)}${T.ccPerSeason}</b></div>
    <div class="ch-row"><em>${T.ccCoachUntil}</em><b>${ccDayLabel(m.until)}</b></div>
    <button class="ch-swap" onclick="ccStaff2PickOpen('${kind}')">${T.ccStaffChange}</button>
    <button class="ch-swap" onclick="careerEndStaff2('${kind}')">${T.ccAgentEnd}</button>
  </div>`;
  return `<div class="ch-tile">
    <h4>${T[K]}</h4>
    <div class="ch-hint">${T[K+'Hint']}</div>
    <div class="ch-empty">${T[K+'None']}</div>
    <button class="ch-swap" onclick="ccStaff2PickOpen('${kind}')">${T[K+'Hire']}</button>
  </div>`;
}
function ccStaff2PickOpen(kind){
  const cr=CAREER.career, T=L(), K=kind==='analyst' ? 'ccAnalyst' : 'ccPsych', on=ccStaff2(kind);
  const rows=ccStaff2List(kind).map(p=>{
    const r=ccStaff2Rating(kind, p), paid=ccOrgPays(kind), cost=ccStaff2Cost(kind, p), mine=!!on && on.id===p.id, can=!mine && (paid || (cr.balance||0)>=cost);
    return `<div class="cc-buy${mine?' own':''}">
      ${p.photo ? `<img class="cc-buy-img cc-buy-face" src="${PHOTO_DIR}${esc(p.photo)}" alt="" loading="lazy" onerror="this.remove()">` : ''}
      <div class="cc-buy-in"><b><span class="cc-buy-nm">${esc(p.name)}</span> ${ccStaffBadge(r).replace('cc-staff-rt', 'cc-staff-rt mgf-rt')}</b>
        <i class="cc-buy-who">${p.x ? '👥 '+ccFollowers(p.x)+' · ' : ''}${p.at ? '@'+esc(p.at) : ''}</i>
        <span class="cc-buy-chips"><em class="up">${ccStaff2Effect(kind, r)}</em><em>${esc(p.why)}</em></span></div>
      ${mine ? `<span class="cc-owned">${T.ccShopUntil(ccDayLabel(on.until))}</span>`
             : ccHireBtns(can, paid ? 0 : cost, "careerHireStaff2('"+kind+"','"+p.id+"')", "careerHireStaff2('"+kind+"','"+p.id+"',12)", paid ? L().ccOrgPays(esc(CAREER.org.name)) : null)}
    </div>`;
  }).join('');
  document.getElementById('staff2PickBody').innerHTML=`<h4 class="cc-pick-h">${T[K]}</h4><div class="ch-hint">${T[K+'Hint']}</div><div class="cc-buys">${rows}</div>`;
  document.getElementById('staff2PickModal').style.display='flex';
  document.addEventListener('keydown', ccStaff2PickKey);
}
function ccStaff2PickClose(){ const m=document.getElementById('staff2PickModal'); if(m) m.style.display='none'; document.removeEventListener('keydown', ccStaff2PickKey); }
function ccStaff2PickKey(e){ if(e.key==='Escape') ccStaff2PickClose(); }
function careerEndSmm(){
  if(!CAREER.smm) return false;
  CAREER.smm=null;
  careerSave();
  careerRenderHub();
  return true;
}
/* raw is for a figure that is a floor rather than a gain: see the note above. */
function careerReachAdd(n, raw){
  const cr=CAREER.career;
  const was=cr.reach||0;
  const add=raw ? n : n*(1+ccSmmBoost());
  cr.reach=Math.max(0, Math.round(was+add));
  // Часть новых читателей X идёт и на Twitch, см. CC_TW_FROM_X.
  const got=cr.reach-was;
  if(got>0) cr.twitch=Math.min(CC_TW_CEIL, (cr.twitch||0)+Math.round(got*CC_TW_FROM_X));
  return got;
}
/* What a result is worth to the audience.

   Results always fed this — the cup, the Weekly Final, the Majors, Paris — but
   the curve was cubed, so it paid for a near-win and for nothing else: a
   Division 5 night in the middle of the room was fifteen followers against
   twenty for a day of streaming, and the player's own reading was that only
   streams grow it.

   Softer, and worth more. At 2.2 a third of the way up the room still pays,
   and the nine puts a good night ahead of a day at the desk rather than level
   with it: in Division 5 a win is 180 against a stream's 20, the cut is 150,
   a third of the room is 74. Which is the shape it should have — a career is
   followed for playing well, and the stream is what fills the days between. */
/* Audience multiplier by what the event pays:
     div cup x1, Victory Cup / Perf Eval x0.5, Reload stage x1.5, Weekly Final ($10k) x2.5, Major final ($120k) x5,
     GC Last Chance x6, Reload Championship ($260k of $1.02M) x8, Summit final ($250k of $1.29M) x9, Globals ($2M) x14.
   Summit and Globals are not in a career year yet (year ends 23 Aug, Antwerp is 26-27 Sep) but are weighted already. */
const CC_REACH_EVENT={cup:1, final:2.5, victory:0.5, eval:0.5, reload:1.5,
                      major:5, gc:6, rc:8, summit:9, globals:14,
                      // Про-Ам — показательный вечер: смотрят его много, но
                      // главное там не место, а с кем ты сидишь (см. ccProAmReachFrom).
                      proam:4};
function careerReachResult(place, of, div, kind){
  if(!(of>1)) return 0;
  const beat=clamp(1-(place-1)/(of-1), 0, 1);
  const w=CC_REACH_EVENT[kind]!=null ? CC_REACH_EVENT[kind] : 1;
  return Math.round(Math.pow(beat,2.2)*CC_REACH_DIV(div)*9*w);
}
// Going up a rung is the thing people actually follow you for, and it happened
// silently: the cup that promoted you paid its own placing and nothing for the
// promotion. A rung is worth a fortnight of streaming in the room it lands in.
//
// And Division 1 carries a floor. Nobody is in that room unknown — it is 300
// people the scene watches every week — so arriving there tops the count up to
// ten thousand if a quiet career got there on results alone. Nothing is ever
// taken away again: falling out of the division does not unfollow anybody,
// which is the same rule the rest of this number lives by.
const CC_REACH_D1=10000;
function careerReachPromote(newDiv){
  const got=careerReachAdd(CC_REACH_DIV(newDiv)*12);
  if(newDiv===1 && careerReach()<CC_REACH_D1) return got+careerReachAdd(CC_REACH_D1-careerReach(), true);
  return got;
}
// K and M, the way a profile writes them.
/* Money and counts, written the way the reader’s own language writes them.

   Every amount in this file was built as "$" + n.toLocaleString("en-US"), which
   is right in English and wrong in French: there a sum is 120 000 $, with a
   space between the thousands and the sign after the number. Eighty-eight places
   did it by hand, so they now go through here instead.

   Russian is left on the English shape deliberately. It has been reading
   $120,000 since the mode was built and nobody asked for that to move; changing
   it would be a change to a language that is already finished, made in passing
   while adding a third. One line here does it whenever it is wanted. */
function ccMoney(n){
  const v=Math.round(Number(n)||0);
  return LANG==="fr" ? v.toLocaleString("fr-FR")+" $" : "$"+v.toLocaleString("en-US");
}
// A plain count — no currency, same grouping rule.
function ccNum(n){
  return (Number(n)||0).toLocaleString(LANG==="fr" ? "fr-FR" : "en-US");
}
function ccFollowers(n){
  n=Math.max(0, Math.round(n||0));
  if(n<1000) return String(n);
  if(n<100000) return String(Math.round(n/100)/10).replace(/\.0$/,'')+'K';
  if(n<1000000) return Math.round(n/1000)+'K';
  return String(Math.round(n/100000)/10).replace(/\.0$/,'')+'M';
}
// A number that is the same every time the same post is drawn.
function ccHashStr(str){
  let h=2166136261;
  for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); }
  return Math.abs(h);
}
/* The numbers under a post.

   Derived rather than dealt out: views come off the audience the account had on
   the day it posted, and everything else comes off views in the proportions a
   real timeline holds — a couple of percent of the people who see something like
   it, a tenth of those repost, slightly more reply.

   The follower count is stamped onto the entry when it is written, so a post
   from February keeps February's audience instead of growing every time the
   screen is redrawn. Entries written before followers existed read the count as
   it stands now, which is the only answer available to them.

   The scene's own account has its own audience and does not care how big the
   player is. */
const CC_PRESS_REACH=120000;
// What a name on the roster is read by. Invented like the player's own count and
// on the same scale, so that a career catching up with Division 1 catches up
// with its audience too: a 96 sits around fifty thousand, a 70 around twelve.
/* Followers: real X numbers where known, otherwise the rating curve.
   Audience doesn't track rating: Sky 31k, Scroll 39k, Malibuca 403k while rated 5 lower;
   Cr1nge is 95 with ~6k, Mongraal ~2.5M.
   Read in August 2026, rounded to the hundred like the source; static, never updated. */
/* 8.10.2026 (его слово «у игроков тоже можно писать фоловеров»): +321 человек и свежие числа у
   прежних. Адрес X — из инфобокса игрока на Liquipedia (tools/fetch-liqui-twitter.js: ссылка с его же страницы —
   доказательство, что аккаунт его, а не тёзки), число — api.fxtwitter.com в тот же день. Топ-420 по рейтингу:
   у 367 адрес есть, у 343 профиль ответил. */
const CC_XFOLLOW={
  "1lusha":17606, "4zr":197248, "916gon":42447, "acorn":582685, "ajay":4790, "ajerss":115746, "aminished":9889,
  "anas":283485, "andilex":261658, "aoxy":2610, "ark":22761, "arkhram":202881, "artor":63337, "asianjeff":147641,
  "aspect":76804, "assault":88647, "astrosmz":39921, "av":45746, "avery":5772, "avivv":33544, "axeforce":13761,
  "ayarbaffo":57822, "baackup":321, "bacca":7504, "badsniper":144008, "barroso":79667, "belaeu":4917,
  "belusi":28931, "benjyfishy":2250255, "bevvys":19407, "bizzle":600143, "blake":236181, "blakeps":236180,
  "boltz":423586, "boyer":63099, "braydz":19507, "brycx":8527, "bucke":669972, "bugha":1968808, "bully":78552,
  "bylah":12818, "cadu":101961, "casperinovic":5121, "cazz":28641, "ceice":185618, "cented":822979,
  "chap":578409, "chapix":185622, "charyy":25401, "cheapz":6880, "chico":29770, "chimp":6727, "chris":8641,
  "chubs":10266, "cinxz":656, "cizlucky":8571, "clement":76759, "clix":2862623, "cofts":815, "cold":504903,
  "commandment":131505, "convic":3902, "coop":119806, "cooper":453714, "cr1nge":10265, "cringe":21690,
  "crr":487872, "crue":29633, "crunchy":5695, "curly":13395, "curve":31270, "czb":5605, "dabuel":7107,
  "darkos":4090, "darm":26466, "death":27614, "decyptos":98012, "degen":54854, "demus":27432, "deroller":18974,
  "derox":8497, "deyy":303081, "diguera":143577, "dks":44156, "domentos":32475, "domo":2102, "dubs":683013,
  "edgey":300023, "edroadtoglory":111608, "edson":34631, "elitxe":10709, "elokratz":11393, "endretta":253063,
  "enough":5673, "eomzo":468786, "epikwhale":822027, "f1n4ik":6822, "faded":16021, "falconer":29576,
  "fastroki":60011, "fatch":14109, "favs":42738, "fazer":73742, "fishy":58687, "flickzy":65734, "flikk":150943,
  "focus":18900, "fredoxie":62842, "frenzyfishy":4377, "froggy":6069, "fryst":24651, "g13ras":25299,
  "gabzera":17459, "glubschi":10170, "gmoney":44574, "golden":3670, "gripey":22316, "grolzz":12353,
  "hazthagreat":31968, "hellfire":32484, "hen":255218, "higgs":481951, "hijoe":29254, "hottie":8447,
  "howly":9959, "hris":16275, "ibooohai":19251, "idrop":449550, "inact":4622, "itemm":33073, "izzi":10705,
  "jahlyn":12423, "jahq":62003, "jamper":115601, "jannisz":426130, "japko":40621, "jaxenj":1843, "jayrosez":2114,
  "jayse1x":4118, "joji":54372, "jojofishy":1977, "josh":31411, "justice":14078, "juu":44020, "k1ng":571598,
  "k1nzell":147187, "kacpi":1514, "kami":269341, "kaxie":4270, "kbr":48476, "kefyy":25383, "khanada":888117,
  "kiduoo":17474, "king":239077, "kingaling":11145, "kiox":959, "kiro":12564, "kiryache32":106911,
  "kitoz":116773, "klass":15957, "klown":7932, "knight":50167, "kraez":16971, "krisp":6220, "kubx":97434,
  "kwah":11433, "kwanti":268001, "kylie":64020, "larson":33635, "letw1k3":4, "lewa":16742, "louis":38845,
  "m0ne":2121, "mackwood":282346, "malibuca":639254, "mappi":18302, "mariuscow":70761, "matsoe":140,
  "megga":566083, "mero":443652, "merstach":532789, "mikson":46036, "milan":114795, "minori":4800, "miro":66766,
  "mitr0":918573, "momsy":21212, "mongraal":2615770, "motor":229015, "mrsavage":1886231, "muz":578082,
  "mydro":2441, "naekoz":33693, "nanolite":15778, "nate":10784, "nayte":243112, "nebs":44035, "night":28693,
  "nikof":406390, "noahreyli":364458, "noxy":13065, "npen":62730, "nxthan":19589, "nyhrox":308687, "okis":122488,
  "oliverog":93178, "on1":19, "opai":81546, "osp":25, "osydd":7036, "ozone":7403, "p1ng":30128,
  "pablowingu":60143, "pamstou":24819, "panzer":39636, "paper":138544, "parz":9717, "persa":175512,
  "peterbot":805096, "pgod":312807, "phoenix":3282, "phzin":119557, "pingu":28566, "pinq":224042, "pixie":100549,
  "pixx":27374, "plege":9378, "podasai":111700, "pollo":183263, "prism":9961, "psalm":68866, "pulga":293533,
  "putrick":58384, "pxmp":61377, "queasy":401056, "raifla":49189, "rakso":50217, "rapid":389520, "ratgun":1256,
  "rax":31688, "rays":7209, "redlee":39797, "redrush":5339, "reet":372242, "refsgaard":187404, "rehx":87373,
  "resypical":7050, "retro":3137, "reverse2k":162592, "revised":11747, "rezon ay":534695, "rhux":11011,
  "rise":128868, "ritual":416839, "rocaine":22768, "rogueshark":33539, "rojo":37060, "romero":15617,
  "ronaldo":6972, "s1ned":12965, "saf":353310, "salko":7616, "salt":2524, "sangild":7072, "scarpa":29637,
  "scroll":45286, "setty":622813, "seyyto":23947, "shadow":17652, "shamokiy":20745, "shxrk":129755,
  "silxzys":2191, "skite":252193, "skqttles":41715, "skram":63951, "skvii":8998, "sky":42471, "skyjump":19414,
  "slackes":50413, "smite":9817, "snap":277, "snayzy":144419, "source":4036, "spayde":30266, "sphinx":35834,
  "stompy":134797, "stormyrite":98461, "stretch":425748, "stryker":14166, "swag":14109, "swizzy":140033,
  "sxhool":5897, "t3eny":95612, "tabzg":23970, "tahi":55943, "tayson":572204, "tchub":2088, "teeq":100809,
  "teqqz":4037, "teyo":11137, "th0mashd":687295, "thevic":189496, "threats":70163, "till":5783, "tisco":13895,
  "tjino":52628, "tohaj":9794, "toose":90947, "tragix":4965, "trashy":14227, "trippernn":81417, "trulex":89830,
  "tschinken":113375, "turtle":4605, "twainz":434, "twek":5164, "twi":18335, "umplify":63929, "upl":12787,
  "userz":11692, "vadeal":387242, "vanyak3kk":78594, "veno":301038, "vergo":36380, "verox":116069, "vert":24256,
  "vexi":5507, "vic0":499090, "victerv":21988, "visxals":14681, "volko":13315, "whofishy":54466,
  "wolfiez":511075, "wox":36015, "xavi":1112, "xccept":10262, "xeat":45055, "xenon":553, "xoonies":14177,
  "xsweeze":117052, "yumi":15650, "zandy":63379, "zayt":511800, "zookez":4754
};
function ccFollowOf(handle){
  const v=CC_XFOLLOW[String(handle||'').toLowerCase()];
  return v>0 ? v : null;
}
function ccReachOf(ovr, handle){
  const real=ccFollowOf(handle);
  if(real) return real;
  const o=Math.max(55, Math.min(99, ovr||72));
  /* Выдуманный игрок рейтинга 80 — ≈5 тыс. подписчиков, 90 — ≈8 тыс. (было 25 и 41 тыс.: LFD-твит неизвестного собирал
     по 300 лайков). У настоящих — их настоящее число из CC_XFOLLOW выше. 16.10. */
  return Math.round(40*Math.pow(o-55, 1.5));
}
/* Подписчики человека на экране (его слово 8.10: «у игроков тоже можно писать фоловеров»): настоящее число из
   CC_XFOLLOW, иначе — та же кривая по рейтингу, что считает просмотры ленты, со знаком «≈». */
function ccFollowText(handle, ovr){
  const real=ccFollowOf(handle);
  return real ? ccFollowers(real) : '≈'+ccFollowers(ccReachOf(ovr, null));
}
const CC_POST_W={good:1, flat:0.42, bad:0.72};
function ccPostStats(e, who){
  const f = who.you ? (e.f!=null ? e.f : careerReach())
          : who.f>0 ? who.f   // свой счёт подписчиков у аккаунта (слухи, опросы — 16.10)
          : who.verified ? CC_PRESS_REACH
          : ccReachOf(who.ovr, who.name);
  const w = CC_POST_W[e.kind]!=null ? CC_POST_W[e.kind] : 0.5;
  const jit = 0.82 + (ccHashStr((e.k||'')+'|'+(e.day||'')+'|'+((e.a||[]).join(','))+'|'+(e.text||''))%37)/100;
  /* ОХВАТ ПАДАЕТ С РАЗМЕРОМ АККАУНТА (16.10, «сделай реалистичней»). Было f×(0.35…1.5): у Merstach (530 тыс.) недельный
     кап собирал 660 тыс. просмотров и 14,6 тыс. лайков, подкол Chap'а — 395 тыс. и 8,7 тыс. На живом X маленький
     аккаунт добирает до своего числа подписчиков, большой — 10–30 %: 0.9 × (f/5000)^−0.35, не ниже 0.08. */
  const share = Math.max(0.08, Math.min(0.9, 0.9*Math.pow(Math.max(1, f)/5000, -0.35)));
  const views = Math.round(f*share*(0.35+1.15*w)*jit);
  const likes = Math.round(views*0.022);
  /* Ответов — одна двадцатая от лайков, репостов — одна двенадцатая.

     Стояло 16% и 12%: у Малибуки под победой выходило две тысячи ответов на
     двенадцать тысяч лайков, у аккаунта сцены семьсот под «happy birthday».
     На живом X (сентябрь 2026, @MalibucaFN, @FNCompetitive, посты LFD) на
     десять тысяч лайков приходится сто-триста ответов, под LFD в двести лайков
     — десять-двадцать. Пост, который собрал хоть немного лайков, получает
     хотя бы один ответ: иначе у молодой карьеры под постом пусто. */
  const replies = likes>=3 ? Math.max(1, Math.round(likes*0.05)) : 0;
  return {views, likes, reposts:Math.round(likes*0.08), replies};
}
/* Клуб как автор поста.

   Правка двумя строками: «фортнайт не должен ниче писать про
   орги» и «когда подписывают тебя, орга постит это от своего ника со своей
   аватаркой». Раньше подписания, продления, увольнения и повышения выходили
   под именем Fortnite Competitive — аккаунт сцены, который в жизни про
   ростер-муву чужого клуба не пишет; пишет сам клуб.

   Галочка у клуба стоит: это официальный аккаунт организации. Герб берётся тем
   же путём, что и на карточках (clubLogoFile), и если файла нет — кружок
   останется с инициалами, как у всякого автора без картинки. */
function ccOrgBy(name){
  if(!name) return null;
  return {name:String(name), handle:ccHandle(String(name)), verified:true,
          logo:clubLogoFile(String(name))};
}
/* Имя клуба из аргумента старой записи — если это действительно клуб.

   Аргумент приходит из сейва, то есть из чего угодно: числа, пустой строки,
   тега. Клубом он считается, только если такой клуб в сцене есть — иначе пост
   уйдёт по общему правилу, а не подпишется выдумкой. */
function ccPostOrgName(v){
  const s=(v==null ? '' : String(v)).trim();
  if(!s) return null;
  const pool=(typeof careerOrgPool==='function') ? careerOrgPool() : [];
  const hit=(pool||[]).find(o=>String(o && o.name).toLowerCase()===s.toLowerCase());
  return hit ? hit.name : null;
}
/* Строки, которые пишет клуб, и в каком аргументе стоит его имя.

   Записи о трансферах приходят с автором (opt.by, см. ccOrgBy) — но только те,
   что написаны ПОСЛЕ того, как клубы научились постить сами. В сейве, который
   играется с тех пор, лежат старые записи без автора, и они падали на карту
   CC_POST_BY, где эти ключи помечены 'press'. Отсюда скриншот:
   Fortnite Competitive с галочкой пишет «BIG продлевает контракт», и отзыв
   к нему — «фортнайт не должен ниче писать про орги».

   Имя клуба в такой записи никуда не девалось: оно стоит в аргументах строки,
   потому что строка его печатает. Значит автора можно достать оттуда же и
   старым записям — герб и ник подтянутся как у новых. У ccNewsLeft клуб,
   который подписал, стоит вторым: первым идёт тот, откуда ушли. */
const CC_ORG_POST_ARG={
  ccNewsSigned:0, ccNewsSignedDuo:0, ccNewsSignedAcademy:0,
  ccNewsReleased:0, ccNewsExtended:0, ccNewsPromotedRoster:0, ccNewsRaise:0,
  ccNewsLeft:1, ccNewsTransfer:1, ccNewsOrgYear:0,
  // Победу своего человека клуб празднует сам — см. careerD1Posts.
  ccPostOrgWin:0
};
function ccPostAuthor(e){
  if(e.by) return {name:e.by.name, handle:e.by.handle||ccHandle(e.by.name),
                   verified:!!e.by.verified, card:e.by.card||null, ovr:e.by.ovr, f:e.by.f||0,
                   // Герб клуба едет с автором: без этой строки аватарка
                   // организации оставалась кружком с инициалами.
                   logo:e.by.logo||null};
  // Запись клуба без автора — это запись, написанная до правки. Клуб в ней
  // назван, и подписать её им же честнее, чем отдать прессе.
  {
    const at=CC_ORG_POST_ARG[e.k];
    if(at!=null){
      const org=ccPostOrgName((e.a||[])[at]);
      if(org) return ccOrgBy(org);
    }
  }
  /* A line nobody assigned belongs to the player, not to the scene.

     This defaulted to 'press', which is the wrong way round and kept being
     wrong: every key added since — the day events, the interviews, anything
     built at run time like 'ccDayEv'+id+'Take' — turned up under Fortnite
     Competitive's name the moment it was written, and the account ended up
     posting "scrimmed the evening with a stronger squad" and "Evaluation:
     #79 in Round 1" as if it were reporting on itself.

     The scene's account is an opt-in list. CC_POST_BY names what it covers;
     everything else is somebody talking about their own week, which is who
     actually posts those things. */
  let who=CC_POST_BY[e.k]||'you';
  /* 'arg0' — говорит человек сцены, и его имя лежит первым аргументом строки.

     Отзыв скриншотом: пост «@jut: я больше не в дуо с @lr8.
     LFD 🙏» стоял под аккаунтом Fortnite Competitive — «это не должны фортнайт
     писать, игроки только». Строка написана от первого лица и начиналась с
     собственного ника, потому что автором была сцена; теперь автор — сам jut,
     а ник из текста убран (см. локали). То же у поздравлений с днём рождения и
     у трёх строк про бан: их тоже говорят люди, а не аккаунт. */
  if(who==='arg0'){
    const h=String(((e.a||[])[0])||'').trim();
    if(h){
      /* По индексам ника, а не перебором: PLAYERS.find по шестидесяти тысячам карточек
         на каждый такой пост и на каждую перерисовку вешал хаб на телефоне на секунду
         (профиль при CPU ×6: ccPostAuthor — 1,9 с из 2 с отрисовки «Центра»). */
      const hk=hKey(h);
      const card=ccNowByKey(ccSceneRoster(ccCareerRegion())).get(hk) ||
                 ((ccCardsByKey().get(hk)||[])[0]) || null;
      return {name:h, handle:ccHandle(h), verified:false, card:card,
              ovr: card ? (card._ovr!=null?card._ovr:(attrsFor(card)||{}).ovr) : null};
    }
    who='you';
  }
  // 'by' значит «автор приходит с записью». Записи без него здесь уже нет
  // (её перехватил бы e.by выше), так что это страховка: пост без автора —
  // пост игрока, как и всякая неназванная строка.
  if(who==='by') who='you';
  // Разбор пишет аналитик и только он: это его формат, не пресса и не игрок.
  if(who==='analyst') return Object.assign({}, CC_ANALYST);
  if(who==='press' && !ccPressWorthy(e)) who='you';
  if(who==='you'){
    const pl=CAREER.player;
    // A career player uploads their own portrait; photoURL reads it off _photo.
    // A career played as a taken card wears that card's portrait instead —
    // careerCard is the roster card, so the photo is the one on the card.
    return {name:pl.nick, handle:ccHandle(pl.nick), verified:false, you:true,
            card: pl.photo ? {_photo:pl.photo} : careerCard()};
  }
  if(who==='mate'){
    const mate=careerPartnerCard();
    if(mate) return {name:mate.handle, handle:ccHandle(mate.handle), verified:false, card:mate,
                     ovr:(mate._ovr!=null?mate._ovr:(attrsFor(mate)||{}).ovr)};
  }
  return {name:CC_PRESS.name, handle:CC_PRESS.handle, verified:true, av:CC_PRESS.av};
}
/* An @ off a nickname. It used to be replace(/s+/g,''), which strips the letter
   s rather than the spaces — Ghost posted as @ghot.

   Reduced to what an @ can actually hold, because roster names carry things no
   handle ever does: "flc sǃ", "ihminen ʕᵒᴥᵒʔ", "Phaпtom2x". A mention is picked
   out of a finished post as far as the first character that cannot be in one, so
   leaving them in printed half a blue name with a loose symbol trailing it.
   A name that is nothing but such characters keeps what it had — better a
   strange handle than an empty one. */
function ccHandle(nick){
  const h=String(nick||'').toLowerCase().replace(/[^a-z0-9_]+/g,'');
  return h || String(nick||'').replace(/\s+/g,'').toLowerCase();
}
// The person out of the pair. Team names in this app are "A + B".
function ccOneOf(team){ return String(team||'').split(/\s*[+&]\s*/)[0].trim() || String(team||''); }
// The initials stay under the photo rather than instead of it: a portrait that
// fails to load removes itself and leaves the letters that were always there.
function ccAvatar(a){
  // Лицо берётся с карточки, а у аккаунта сцены карточки нет — у него свой
  // файл (CC_PRESS.av). Инициалы под картинкой остаются: если файл не отдался,
  // <img> снимает себя сам и кружок читается, как читался.
  /* У клуба лица нет — у него герб, и лежит он в другой папке. Правка: «когда подписывают тебя, орга постит это от своего ника со
     своей аватаркой». Поэтому автор может принести logo вместо card. */
  const url=a.card ? photoURL(a.card)
          : a.logo ? LOGO_DIR+a.logo
          : (a.av ? PHOTO_DIR+a.av : null);
  return `<span class="x-av${a.you?' x-av-you':''}">`+
    (url ? `<img src="${esc(url)}" alt="" onerror="this.remove()">` : '')+
    `${esc((a.name||'?').slice(0,2).toUpperCase())}</span>`;
}
// The standings as an attachment. Five rows is what fits in a screenshot before
// anybody stops reading, and the poster's own row is pinned in if it falls below
// them — the point of posting a table is being in it.
/* Доска лидеров как ВЛОЖЕНИЕ, а не строкой текста.
   Отзыв: «делай как у кинча реал». У Кинча это картинка-таблица: слева
   показатель, справа число и ник. Здесь та же карточка, что уже носит таблицу
   этапа (.x-shot), только колонки свои. Своя строка подсвечивается — как и в
   таблице этапа: смысл доски в том, чтобы искать на ней себя. */
function ccLeadHTML(lead){
  if(!lead || !lead.rows || !lead.rows.length) return '';
  const me=ccHandle((CAREER.player && CAREER.player.nick) || '');
  const rows=lead.rows.map(r=>{
    const who=String(r[2]||'');
    /* Своя карточка (lead.mine): справа не лидер, а место в лобби, и
       подсвечено то, где игрок первый. */
    const mine=lead.mine ? !!r[4] : who.toLowerCase()===String(me).toLowerCase();
    const ico=CC_LEAD_ICO[r[0]] || '';
    const flag=r[3] ? flagImg(r[3], 11) : '';
    return `<div class="x-shot-r x-lead-r${mine?' me':''}">`+
           `<b><span class="x-lead-ico">${ico}</span>${esc(L()[r[0]]||r[0])}</b>`+
           `<em>${esc(String(r[1]))}</em><i>${lead.mine ? esc(who) : flag+'@'+esc(who)}</i></div>`;
  }).join('');
  return `<div class="x-shot"><div class="x-shot-h"><span>${esc(lead.cap||'')}</span>`+
         `<span>${lead.mine ? '@'+esc(me) : '<span class="x-lead-ico">🔥</span>'+esc(L().ccLeadCap)}</span></div>${rows}</div>`;
}
/* ВИД СКРИНА ТАБЛИЦЫ (Notion 27.10, его «сделай эту таблицу как в игре и как в симуляции, смотря какой турнир»).
   Скрин в посте рисуется тем же видом, что живая таблица этого вечера (ccEvPaletteApply): 2026-й — бирюзовая таблица
   симуляции, прошлые годы — экран турнира из игры тех лет в палитре события. Вид пишется в запись в момент поста:
   год карьеры потом сменится, а скрин останется таким, каким был. Старые записи без вида — прежний тёмный скрин. */
function ccShotLook(){
  try{
    if(typeof CAREER==='undefined' || !CAREER || !CAREER.career) return null;
    if(ccCalYear()>=2026) return {k:'sim'};
    const root=document.documentElement, s=root.style;
    let l=s.getPropertyValue('--ev-l').trim(), r=s.getPropertyValue('--ev-r').trim(), h=s.getPropertyValue('--ev-h').trim(),
        lt=root.classList.contains('ev-light');
    if(!root.classList.contains('ev-classic') || !l){
      const d=careerToday(), n=ccSeasonNumOn(d);
      const p=ccEvPalette({id:''}, d) || (n<=9 ? ccEvPalOf('OnlineOpen_Week1') : null);
      if(!p) return {k:'sim'};
      l='#'+p[0]; r='#'+p[1]; h='#'+(p[2]||'FFE600'); lt=ccEvLight(p);
    }
    let rg=''; try{ rg=regionName(ccCareerRegion()); }catch(e){}
    return {k:'cl', l, r, h, lt:lt?1:0, rg};
  }catch(e){ return null; }
}
// Скрин в виде таблицы вечера: колонки как в симуляции (место, команда, очки, матчи, победы, киллы), без сводки Tracker.
function ccShotLookHTML(tbl){
  const lk=tbl.lk, cl=lk.k==='cl';
  const flags=r=>(r.f||[]).map(n=>flagImg(n, 12)).join('');
  const meK=tbl.me ? hKey(tbl.me) : null;
  const line=(r, extra)=>{
    const cls=(r.p===1?' win':'')+(meK && hKey(r.n)===meK ? ' me' : '')+(tbl.cut && r.p===tbl.cut ? ' cut' : '')+(extra||'');
    return `<div class="x-shot-r${cls}"><i>#${r.p}</i><b>${flags(r)}${esc(r.n)}</b><em>${r.s}</em>`+
      `<u>${r.m!=null?r.m:''}</u><u>${r.w!=null?r.w:''}</u><u>${r.e!=null?r.e:''}</u></div>`;
  };
  // Своя строка внизу — только когда её нет в кадре, как в живой таблице.
  const pinIn=tbl.pin && tbl.rows.some(r=>r.p===tbl.pin.p);
  const rows=tbl.rows.map(r=>line(r, '')).join('')+(tbl.pin && !pinIn ? line(tbl.pin, ' pin') : '');
  const sty=cl ? ` style="--sl:${esc(lk.l)};--sr:${esc(lk.r)};--sh:${esc(lk.h||'#FFE600')}"` : '';
  const cap=esc(tbl.cap||L().ccShotCap(tbl.div))+(tbl.mode?' · '+esc(tbl.mode):'');
  const cut=tbl.cut && tbl.cutPts!=null ? esc(L().ccShotCut(tbl.cut, ccNum(tbl.cutPts))) : '';
  const head=cl
    ? `<div class="x-lk-cap"><b>${cap}</b>${lk.rg ? `<span>(${esc(lk.rg)})</span>` : ''}${cut ? `<small>${cut}</small>` : ''}</div>`
    : `<div class="x-shot-h"><span>${cap}</span><span>${cut || L().ccShotPts}</span></div>`;
  return `<div class="x-shot x-lk x-lk-${cl?'cl':'sim'}${cl && lk.lt?' x-lk-lt':''}"${sty}>${head}
    <div class="x-shot-rows">
      <div class="x-shot-r x-shot-head"><i>#</i><b>${L().ccTableTeam}</b><em>${L().ptsHeader}</em>
        <u>${L().matchesWord}</u><u>${L().winsWord}</u><u>${L().killsHeader}</u></div>
      ${rows}
    </div>
  </div>`;
}
function ccShotHTML(tbl){
  if(!tbl || !tbl.rows || !tbl.rows.length) return '';
  if(tbl.lk && tbl.rows.some(r=>r.m!=null)) return ccShotLookHTML(tbl);
  /* Старые записи в сейве несут только место, имя и очки — у них колонок
     меньше, и таблица просто рисуется без них. */
  const wide=tbl.rows.some(r=>r.m!=null);
  /* Строка как в таблице игры: флаги перед ником (по картам состава), очки
     сразу за ником, потом матчи, победы, элимы. Своя строка — жёлтой рамкой и
     ещё раз внизу (pin), как в кадре из твита Th0masHD, 3 сентября. */
  const flags=r=>(r.f||[]).map(n=>flagImg(n, 12)).join('');
  const line=(r, extra)=>{
    const cls=(r.p===1?' win':'')+(tbl.me && hKey(r.n)===hKey(tbl.me) ? ' me' : '')+(extra||'');
    return `<div class="x-shot-r${cls}"><i>#${r.p}</i><b>${flags(r)}${esc(r.n)}</b>`+
      (wide ? `<u>${r.m!=null?r.m:''}</u><u>${r.w!=null?r.w:''}</u><u>${r.e!=null?r.e:''}</u>` : '')+
      `<em>${r.s}</em></div>`;
  };
  const rows=tbl.rows.map(r=>line(r, '')).join('')+
    (tbl.pin ? line(tbl.pin, ' pin') : '');
  /* Сводка справа — та же, что на странице Tracker: большое число очков и под
     ним шесть строк. Есть она только тогда, когда есть журнал игр. */
  const s=tbl.sum;
  const side=s ? `<div class="x-shot-side">
      <div class="x-shot-pts"><b>${ccNum(tbl.pts||0)}</b><span>${L().ptsHeader}</span></div>
      <div class="x-shot-sum">
        <span>${L().ccShotVr}<b>${s.vr}</b></span>
        <span>${L().ccShotTop5}<b>${s.t5}</b></span>
        <span>${L().ccShotTop10}<b>${s.t10}</b></span>
        <span>${L().killsHeader}<b>${s.e}</b></span>
        <span>${L().avgElimsWord}<b>${s.ae}</b></span>
        <span>${L().avgPlaceWord}<b>${s.ap}</b></span>
      </div></div>` : '';
  // A screenshot of a Major carries the Major's name, not a division caption.
  /* Широкая сетка колонок включается по КОЛОНКАМ, а не по сводке: у поста без
     журнала игр сводки нет, а матчи, победы и киллы есть — и заголовок тогда
     ехал по узкой сетке, обрезая «MATCHES» до «MATC…». */
  return `<div class="x-shot x-shot-g${wide?' x-shot-wide':''}${s?' x-shot-sum-on':''}">
    <div class="x-shot-h"><span>${esc(tbl.cap||L().ccShotCap(tbl.div))}${
      tbl.mode?' · '+esc(tbl.mode):''}</span><span>${
      tbl.cut && tbl.cutPts!=null ? esc(L().ccShotCut(tbl.cut, ccNum(tbl.cutPts))) : L().ccShotPts}</span></div>
    <div class="x-shot-body">
      <div class="x-shot-rows">
        ${wide ? `<div class="x-shot-r x-shot-head"><i>#</i><b>${L().ccTableTeam}</b>
          <u>${L().matchesWord}</u><u>${L().winsWord}</u><u>${L().killsHeader}</u>
          <em>${L().ptsHeader}</em></div>` : ''}
        ${rows}
      </div>
      ${side}
    </div>
  </div>`;
}
/* Статус, био и PR-карточка, как в живой ленте про-сцены (@ScrollSZN, LFD/LFT, доска LFP у Tracker).
   Статус живёт в нике («F/A Zhelix 🇫🇷 (lfd div 1)»), к объявлению прикладывается PR-карточка или таблица
   вечера, био = карточка карьеры («17 🇩🇰 | Fortnite for @AGGlobalEsports | 2x FNCS WINNER | 350k$+»).
   Всё из сейва: CAREER.splits, CAREER.lft, ростер сезона, CAREER.titles (пишет careerD1Posts),
   careerPrTally. */
function ccWhoCard(handle){
  if(!handle) return null;
  const k=hKey(handle);
  const pl=CAREER && CAREER.player;
  if(pl && pl.handle && hKey(pl.handle)===k) return null;   // свой — не из ростера
  // Индексами ника, а не перебором всех карточек (см. ccPostAuthor).
  return ccNowByKey(ccSceneRoster(ccCareerRegion())).get(k) ||
         ((ccCardsByKey().get(k)||[])[0]) || null;
}
// Когда человек остался один: последняя запись о его разводе. Ключ книги —
// «а+б» из ccSeatKey, поэтому ищется вхождение половинки.
function ccWhoAloneSince(handle, memo){
  const k=hKey(handle);
  let last=null;
  Object.keys(memo||{}).forEach(function(key){
    if(key.split('+').indexOf(k)<0) return;
    if(!last || memo[key]>last) last=memo[key];
  });
  return last;
}
/* С кем человек играет СЕГОДНЯ.

   Не ccRealMateOf: тот читает ростер Epic, то есть пару, с которой человек
   начал год, и про разводы не знает вовсе — по нему свободных агентов в мире
   не бывает. Настоящий ответ у careerPools: там пары уже пересобраны, половинки
   распавшихся стоят врозь, а трансферы сведены заново. */
function ccPairMateOf(handle){
  return ccSquadMatesOf(handle)[0] || null;
}
/* Весь состав человека, а не только пара.

   Тестер, страница «05» (5.10): «малибука без сквада почему-то, когда из 5 главы
   в 6 переходишь». В трио-год карьеры, перешедшей из 2024-го, Malibuca —
   ТРЕТИЙ у P1ng & Wox (настоящая тройка 2025-го, cr.trios), а список «Кому
   написать», статус в ленте и объявления спрашивали только пары пула — и
   третий читался свободным. Теперь третий — в составе своей пары, а у пары
   в составе её третий. */
function ccSquadMatesOf(handle){
  const k=hKey(handle);
  let duos=[];
  try{ duos=(careerPools()||{}).duos||[]; }catch(e){ return []; }
  const trios=(careerSquadSize()===3 && CAREER && CAREER.career && CAREER.career.trios) || {};
  const keyOf=d=>(d.cards||[]).map(c=>hKey(c)).sort().join('+');
  for(let i=0;i<duos.length;i++){
    const cs=duos[i].cards||[];
    if(!cs.some(c=>hKey(c)===k)) continue;
    const out=cs.filter(c=>c && hKey(c)!==k);
    const third=trios[keyOf(duos[i])];
    if(third && third!==k){ const tc=ccWhoCard(third); if(tc) out.push(tc); }
    return out;
  }
  const core=Object.keys(trios).find(key=>trios[key]===k);
  if(core){
    const d=duos.find(x=>keyOf(x)===core);
    if(d) return (d.cards||[]).filter(Boolean);
  }
  return [];
}
/* Статус человека на сегодня. Свободен — только если он И правда один: пара
   могла собраться обратно, и тогда старая запись о разводе ничего не значит. */
function ccWhoStatus(handle){
  const card=ccWhoCard(handle);
  if(!card) return null;
  if(ccPairMateOf(handle)) return card.org ? {kind:'org', text:card.org} : null;
  const trio=careerSquadSize()===3;
  const since=ccWhoAloneSince(handle, trio ? CAREER.lft : CAREER.splits);
  if(since) return {kind:trio?'lft':'fa', text:trio ? L().ccWhoLft : L().ccWhoFa};
  return card.org ? {kind:'org', text:card.org} : null;
}
function ccWhoChipHTML(handle){
  const st=ccWhoStatus(handle);
  if(!st) return '';
  return `<i class="x-who x-who-${st.kind}">${esc(st.text)}</i>`;
}
// PR-строка человека лежит под его ником — тем же, каким она пишется в
// careerPrAdd, поэтому сравнение по hKey, а не по строке.
function ccPrRowOf(handle){
  const rows=careerPrTally().rows||{}, k=hKey(handle);
  const name=Object.keys(rows).find(n=>hKey(n)===k);
  return name ? rows[name] : null;
}
/* Карточка Power Ranking — то же, что показывает Tracker: сколько всего,
   какое место, сколько набрано за этот сезон и за последний год, и кривая. */
function ccPrCardOf(handle){
  const row=ccPrRowOf(handle);
  if(!row || !(row.v||[]).length) return null;
  const now=ccAbsDay(CAREER.career.season, careerToday());
  const seasonFrom=Math.max(0, (CAREER.career.season-1)*365);
  const sum=(from)=>(row.v||[]).reduce((s,e)=>s+(e[1]>=from ? e[0] : 0), 0);
  const rows=careerPrRows(), k=hKey(handle);
  let rank=null;
  for(let i=0;i<rows.length;i++) if(hKey(rows[i].name)===k){ rank=i+1; break; }
  // Кривая — накопленный PR по месяцам года, как на их графике. Точек всегда
  // хотя бы две: у карьеры, которой месяц от роду, окно короче месяца, и
  // одной точкой кривая не рисуется вовсе — а пустое место под числом
  // читается как «данных нет», хотя они есть.
  const step=30, pts=[];
  for(let d=Math.max(0, now-365); d<=now; d+=step)
    pts.push((row.v||[]).reduce((s,e)=>s+(e[1]<=d ? e[0]*ccPrDecay(Math.max(0, d-e[1])) : 0), 0));
  if(pts.length<2) pts.unshift(0);
  return {pr:careerPrOf(row), rank:rank, events:row.n||0,
          season:Math.round(sum(seasonFrom)), year:Math.round(sum(Math.max(0, now-365))), pts:pts};
}
// Кривая под числом — та же, что у рейтинга в истории, только своими точками.
function ccSparkSVG(pts){
  if(!pts || pts.length<2) return '';
  const w=100, h=26, pad=2;
  const lo=Math.min(...pts), hi=Math.max(...pts);
  // Ровная линия рисуется ПОСЕРЕДИНЕ, а не по нижнему краю: у карьеры, где
  // все точки равны, кривая ложилась на дно и читалась как «ноль», хотя это
  // «не менялось».
  const flat=hi===lo, span=Math.max(1, hi-lo);
  const xy=pts.map((v,i)=>[(i/(pts.length-1))*w,
                           flat ? h/2 : h-pad-((v-lo)/span)*(h-pad*2)]);
  const line=xy.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
  return `<svg class="x-spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
    <polygon points="0,${h} ${line} ${w},${h}" fill="rgba(126,240,221,.14)"/>
    <polyline points="${line}" fill="none" stroke="#7ef0dd" stroke-width="1.4"
      vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>`;
}
/* Био человека СЦЕНЫ. Своё уже есть — careerBioHTML собирает его из журнала
   по образцу настоящих профилей, и второй копии тут не будет: свой человек
   уходит туда же.

   Про чужого известно ровно то, что видит сцена: возраст, флаг, клуб, кубки,
   которые он взял на глазах у карьеры (их считает CAREER.titles), место в PR и
   сколько турниров он сыграл. Ключи те же, что у своего био, — «×3 победитель
   кубка» читается одинаково, о ком бы ни шла речь. */
function ccBioLine(handle){
  const pl=CAREER.player;
  if(pl && pl.handle && hKey(pl.handle)===hKey(handle)) return careerBioHTML();
  const card=ccWhoCard(handle);
  const bits=[];
  const age=ccAgeShown(handle);
  if(age) bits.push(String(age));
  if(card && card.nat) bits.push(esc(natDisplay(card.nat)||card.nat));
  if(card && card.org) bits.push(L().ccBioPro+' '+esc(card.org));
  const titles=(CAREER.titles||{})[hKey(handle)]||0;
  if(titles) bits.push(L().ccBioCups(titles));
  const pr=ccPrCardOf(handle);
  if(pr && pr.rank) bits.push(L().ccBioPrRank(pr.rank));
  if(pr && pr.events) bits.push(L().ccBioEvents(pr.events));
  return bits.filter(Boolean).join(' · ');
}
// Кубок, взятый на глазах у карьеры, остаётся в био победителя. Пишет
// careerD1Posts — он и так знает, кто выиграл неделю наверху.
function ccTitleAdd(handle){
  if(!handle) return;
  const t=CAREER.titles=CAREER.titles||{}, k=hKey(handle);
  t[k]=(t[k]||0)+1;
}
/* Приложение к посту: био строкой и PR-карточка под ним. Это ровно тот скрин,
   который настоящие прикладывают к объявлению, только собранный из сейва. */
function ccCardShotHTML(handle){
  if(!handle) return '';
  const bio=ccBioLine(handle), pr=ccPrCardOf(handle);
  if(!bio && !pr) return '';
  /* Числа PR — ПОЛНОСТЬЮ, а не «3K»: у Tracker на карточке стоит 10 257, и
     разница между 1 954 и 2 946 — это и есть то, ради чего её показывают.
     Сжатие остаётся там, где числа большие и точность не нужна: фолловеры,
     просмотры, лайки. */
  const nums=pr ? `<div class="x-card-num"><b>${ccNum(pr.pr)}</b>
      <span>${L().ccCardPr}${pr.rank?' · '+L().ccBioPrRank(pr.rank):''}</span></div>
    <div class="x-card-cols"><span><i>${ccNum(pr.season)}</i>${L().ccCardSeason}</span>
      <span><i>${ccNum(pr.year)}</i>${L().ccCardYear}</span></div>
    ${ccSparkSVG(pr.pts)}` : '';
  return `<div class="x-card"><div class="x-card-bio">${esc(handle)}${bio?' — '+bio:''}</div>${nums}</div>`;
}
/* ---- Кто куда садится, вслух ----------------------------------------------

   Перед крупным вечером про постят свою точку: «Solo FNCS 🔥» и карта со
   стрелками (@ScrollSZN, 2 сентября 2026). Смысл не в картинке — в том, что
   намерение объявлено ЗАРАНЕЕ, и соседи решают, лететь туда или нет.

   Здесь то же самое и из тех же чисел: комната уже распределена (pre в
   careerLandingPick считается ДО твоего выбора), поэтому объявление ничего не
   выдумывает и ни одного лишнего броска не делает — оно просто говорит вслух
   то, что уже решено. Два имени, не больше: это подсказка к своему решению, а
   не сводка. Пишется один раз за этап — на первой игре.

   Возвращает строку для подсказки в окне выбора; посты кладёт сам. */
function ccDropCalls(pre, you, stage){
  if(!pre || !pre.forEach) return '';
  const bare=t=>String((t&&t.name)||'').replace(/<[^>]*>/g,'');
  const out=[];
  pre.forEach(function(list, zone){
    (list||[]).forEach(function(t){
      if(!t || t===you || t.isYou || t.isMate) return;
      const at=ALL_LANDING_ZONES.indexOf(zone);
      if(at<0) return;
      out.push({t:t, at:at, pow:Number(t.pow)||0,
                h:((t.squad||[])[0]||{}).handle || bare(t)});
    });
  });
  if(!out.length) return '';
  // Громко говорят сильные: две верхние команды комнаты.
  out.sort((a,b)=>b.pow-a.pow);
  const said=out.slice(0, 2);
  const first=!((you.stageLog||[]).length);
  said.forEach(function(c){
    /* К объявлению приложена КАРТА с обведённой точкой — так это и выглядит у
       настоящих: «north side in solos» у @RitualFPS, 2 сентября, и картинка
       острова с закрашенной областью. Хранится номер зоны и остров, а не
       картинка: рисуется она на показ, как и всё остальное. */
    /* Уезжает НОМЕР зоны, а не готовое «зона 9»: имя строится на показе, в
       том языке, который стоит сейчас. Со строкой пост оставался русским в
       английской ленте — это же правило записано у ccText: «числа — то, что
       стоит хранить, слова никогда не были собственностью сейва». */
    if(first && c.h) careerNews('flat', 'ccPostDropCall',
                                [ccHandle(c.h), c.at+1],
                                {day:careerToday(), zone:c.at, set:ACTIVE_LANDING_SET});
  });
  return said.map(c=>'@'+ccHandle(c.h)+' → '+L().landingZoneSuffix(c.at+1)).join(' · ');
}
/* «qual grands, land X» — посты после хитов.

   Отзыв: «во время хитов в сошиал ещё можно писать qual grands
   land туда, где метка стоит у игрока… также и боты, которые квальнулись,
   могут писать». Так это и выглядит у настоящих после хитов: «QUALIFIED TO
   GRANDS» и следом точка, куда сядут в финале.

   Точка — та, где команда САДИЛАСЬ в последней игре хитов (landingZone): у
   игрока это его метка, у бота — его место в комнате. Как и у объявления
   точки (ccDropCalls), уезжает НОМЕР зоны и остров, имя строится на показе.
   Пишут не все прошедшие, а трое сильнейших: лента после хитов — это несколько
   громких постов, а не сорок пять одинаковых. `what` — grands у Мейджора,
   finals у соло-серии: словарь ставит нужное слово сам. */
function ccGrandsCalls(what, you, through, passers){
  const zoneNo=t=>{
    const at=ALL_LANDING_ZONES.indexOf(t && t.landingZone);
    return at>=0 ? at+1 : null;
  };
  const opt=z=>z ? {zone:z-1, set:ACTIVE_LANDING_SET} : {};
  if(through){ const z=zoneNo(you); careerNews('good', 'ccPostQualGrands', [z, what], opt(z)); }
  const bots=(passers||[]).filter(t=>t && t!==you && !t.isYou && !t.isMate)
    .sort((a,b)=>(Number(b.pow)||0)-(Number(a.pow)||0)).slice(0, 3);
  bots.forEach(t=>{
    const h=((t.squad||[])[0]||{}).handle;
    if(!h) return;
    const z=zoneNo(t);
    careerNews('flat', 'ccPostBotQualGrands', [ccHandle(h), z, what], opt(z));
  });
  return bots.length+(through?1:0);
}
/* Картинка под постом — арт события.

   Титул уходил в ленту таблицей, а у настоящих это фотография со сцены и
   подпись в два слова («BIG and thomas», @MalibucaFN, 20 тысяч лайков). Своих
   фотографий с ЛАНов у нас нет и взяться им неоткуда, зато есть арты событий —
   те же, что носят клетки недели и новостной хаб. Ставится только туда, где
   повод громкий: титул, чемпионство, ЛАН. */
function ccArtHTML(n){
  if(!n || !n.art) return '';
  const src=CAREER_EV_ART[n.art] || CAREER_EV_ART.cup;
  return src ? `<div class="x-art" style="background-image:url(${src})"></div>` : '';
}
/* Цитата — пост внутри поста.

   Половина настоящей ленты устроена так: анонс Epic и под ним реплика игрока,
   чужой результат и «W» сверху. У нас счётчик репостов стоял, а самого
   действия не было, и лента читалась как стопка монологов. Хранится ссылка на
   запись (её id), а не копия текста: цитируемый пост живёт своей жизнью и
   переводится вместе со всей лентой. */
function ccQuoteHTML(n){
  if(!n || !n.q) return '';
  const src=(CAREER.career.news||[]).find(x=>x.id===n.q);
  if(!src) return '';
  const who=ccPostAuthor(src);
  return `<div class="x-quote">
    <div class="x-quote-h">${ccAvatar(who)}<b>${esc(who.name)}</b>
      <span>@${esc(who.handle)}</span><span class="x-dot">·</span><span>${ccStamp(src)}</span></div>
    <p>${ccMentions(ccText(src))}</p>
    ${ccShotHTML(src.tbl)+ccLeadHTML(src.lead)}${ccArtHTML(src)}</div>`;
}
/* Карта с обведённой точкой — картинка под объявлением высадки.

   Снято с настоящего поста (@RitualFPS, 2 сентября: «north side in solos» и
   остров с закрашенной областью). Рисуется из того же, из чего рисуется пикер:
   клетки — проценты этой самой картинки, поэтому рамка ложится точно.

   Набор клеток берётся из записи, а не из текущего острова: вечер давно
   кончился, ACTIVE_LANDING_SET уехал на другой Мейджор, а пост в ленте
   остался — и показывать он должен ту карту, о которой говорил. */
/* Объявленная точка высадки — ВЫРЕЗКОЙ вокруг коробки, а не целым островом.

   Правка со ссылкой на пост @MalibucaFN («карта слишком
   большая, вот пример поста»): у настоящих под таким постом кадр 627×570
   вокруг своей точки — видно название POI, рельеф и жёлтую рамку, а не весь
   остров, на котором коробку не разглядеть. У нас карта шла фоном во всю
   ширину поста с отношением 16/9, то есть занимала полэкрана и показывала
   в основном воду.

   Арифметика та же, что у careerSpotShotHTML (плитка дома): слой — вся карта,
   растянутая в zoom раз, внутри него координаты ZONE_SETS, и translate
   подводит центр коробки к центру кадра. Отличий два: набор берётся тот, что
   записан в посте (без careerSpotGrid — индекс коробки принадлежит именно
   ему), и заполнение мягче, чтобы вокруг точки осталась узнаваемая местность. */
const CC_DROP_SHOT_RATIO=11/10, CC_DROP_SHOT_FILL=58;
function ccDropMapHTML(n){
  if(!n || n.zone==null) return '';
  const set=(n.set && ZONE_SETS[n.set]) ? n.set : ACTIVE_LANDING_SET;
  const z=(ZONE_SETS[set]||[])[n.zone];
  const art=MAP_ART[set];
  if(!z || !art) return '';
  const asp=MAP_ASPECT[set]||'1100/970';
  const ar=String(asp).split('/');
  const hOverW=(Number(ar[1])||970)/(Number(ar[0])||1100);
  const byW=CC_DROP_SHOT_FILL/Math.max(z.w, 3);
  const byH=CC_DROP_SHOT_FILL/(Math.max(z.h, 3)*hOverW*CC_DROP_SHOT_RATIO);
  const zoom=Math.max(1.2, Math.min(9, Math.min(byW, byH)));
  // Кадр прижимается к краю острова, а не выезжает за него: у береговых точек
  // иначе в угол заезжает пустота. См. ту же правку в careerSpotShotHTML.
  const halfW=Math.min(50, 50/zoom);
  const halfH=Math.min(50, 50/(zoom*hOverW*CC_DROP_SHOT_RATIO));
  const cx=clamp(z.x+z.w/2, halfW, 100-halfW);
  const cy=clamp(z.y+z.h/2, halfH, 100-halfH);
  return `<div class="x-map x-map-shot">
    <div class="x-map-in" style="width:${(zoom*100).toFixed(0)}%;aspect-ratio:${asp};
      background-image:url('${art}');
      transform:translate(${(-cx).toFixed(2)}%, ${(-cy).toFixed(2)}%);">
      <i style="left:${z.x}%;top:${z.y}%;width:${z.w}%;height:${z.h}%"></i>
    </div></div>`;
}
/* Скрин таблицы к посту о вечере.

   Так это и выглядит у настоящих: подпись в две строки, а под ней картинка со
   стандингами, где своя строка подсвечена (@ScrollSZN, 31 августа 2026:
   «Reality's Reign In Finals» и таблица под ней). Кубок дивизиона и вечер
   Дивизиона 1 так и постили, остальные девять вечеров — нет, и Мейджор с ЛАНом
   уходили в ленту голой строчкой. Собирается в одном месте, потому что правило
   одно: пятёрка сверху и своя строка под ней, если она ниже. */
/* Скрин стандингов — тот самый, который постят.

   Правка: «а такие же таблицы можешь сделать, как игроки
   постят». У них это скриншот таблицы Tracker, и в нём всегда одно и то же:
   слева места с очками, матчами, победами и киллами, справа — большое число
   очков и сводка (виктори, топ-5, топ-10, всего киллов, средние киллы и место),
   внизу полоска кнопок. Смотрел живьём у @MalibucaFN, @darmfn, @RitualFPS,
   @Tjino9 — layout один в один у всех, потому что это одна и та же страница.

   Всё это у вечера уже посчитано: журнал игр (stageLog) есть у каждой команды,
   очки, победы и киллы тоже. Сводка считается по журналу того, чья строка
   подсвечена, — то есть автора поста. */
// Строка скрина таблицы: место, имя, очки, матчи, победы, киллы, флаги по картам состава (рисуются при показе, flagImg).
function ccShotRow(t, i){
  return {p:i+1, n:String((t&&t.name)||'').replace(/<[^>]*>/g,''), s:Math.round(t.stagePts||0),
          // Второй вечер кубка: игры первого у остальных лежат в _carryGames, свои уже склеены в лог (Notion 27.10: 11 против 22).
          m:(t.stageLog||[]).length+(t._carryGames||0), w:t.wins||0, e:Math.round(t.stageElims||0),
          f:((t&&t.squad)||[]).map(p=>p&&p.nat).filter(Boolean)};
}
function ccStageShot(ranked, you, div, cap, cut){
  if(!ranked || !ranked.length || !you) return undefined;
  const bare=t=>String((t&&t.name)||'').replace(/<[^>]*>/g,'');
  const row=ccShotRow;
  const place=ranked.indexOf(you)+1;
  /* Как в таблице самой игры — его твит 3 сентября (Th0masHD на #33, в
     кадре #29–#36, своя строка ещё раз приколота внизу, справа «Points to
     qualify Top 50: 371 pts»). Окно вокруг своей строки, в восьмёрке —
     просто верх; своя строка всегда повторена внизу (pin). */
  // Топ-10 (его «пусть топ 10 пишет», 28.10): в десятке просто верх, ниже окно из десяти вокруг своей строки.
  const from=place<=10 ? 0 : Math.max(0, place-6);
  const rows=ranked.slice(from, from+10).map((t,i)=>row(t, from+i));
  const pin=place>0 ? row(you, place-1) : null;
  const cutPts=(cut && ranked[cut-1]) ? Math.round(ranked[cut-1].stagePts||0) : undefined;
  const log=(you.stageLog||[]);
  const sum=log.length ? {
    vr:log.filter(g=>g.place===1).length,
    t5:log.filter(g=>g.place<=5).length,
    t10:log.filter(g=>g.place<=10).length,
    e:Math.round(log.reduce((s,g)=>s+(g.elims||0),0)),
    ae:Math.round(log.reduce((s,g)=>s+(g.elims||0),0)/log.length*10)/10,
    ap:Math.round(log.reduce((s,g)=>s+(g.place||0),0)/log.length*10)/10
  } : null;
  return {div:div||CAREER.career.division, cap:cap||undefined, rows:rows, me:bare(you),
          pts:Math.round(you.stagePts||0), sum:sum, pin:pin||undefined,
          cut:cut||undefined, cutPts:cutPts, of:ranked.length,
          // «Дуо» или «Трио» — тем же словом, каким режим называет их везде.
          mode:careerSquadSize()===3 ? L().modeTrioTitle : L().modeDuoTitle};
}
function careerNewsHTML(limit){
  const news=(CAREER.career.news||[]);
  if(!news.length) return `<div class="ch-empty">${L().ccNewsEmpty}</div>`;
  return news.slice(0, limit||6).map(ccPostHTML).join('');
}
/* ---- Лента: всё или только подписки ---------------------------------------

   Подписка обязана что-то менять, иначе кнопка «подписаться» — украшение.
   «Подписки» показывают тех, на кого подписан игрок, и его самого: своя строка
   в своей же ленте стоит везде, где такая вкладка есть. */
let CH_FEED='all', CH_WHO=null, CH_FEED_Q=null;
function careerFeedMode(m){ CH_FEED=m; careerRenderHub('social'); }
/* ПОСТЫ ТИММЕЙТА (29.10, игрок из Франции: «pouvoir voir les tweet du mate ?»). В командной карьере напарник шлёт свои
   последние посты с карточкой (MP.card → posts); здесь они встают в ленту под его ником — до следующего вечера,
   когда карточка приедет заново. Лайк и ответ на них не пишутся: пост живёт у него. */
const CC_MATE_POSTS_N=12;
function ccMatePostsWire(){
  try{
    return (CAREER.career.news||[]).filter(e=>{ try{ return ccPostAuthor(e).you; }catch(x){ return false; } })
      .slice(0, CC_MATE_POSTS_N).map(e=>({id:e.id, day:e.day, k:e.k, a:e.a, text:e.text, kind:e.kind, likes:e.likes||0, rts:e.rts||0,
        res:(e.res||[]).slice(-CC_REPLY_MAX)}));
  }catch(e){ return null; }
}
/* Ответ под постом напарника в команде. Сервер пропускает только известные сообщения, поэтому ответ едет в своей карточке
   (reMate), а напарник вписывает его под свой пост (ccMateReMerge). Свои хранятся в cr.mateRe — у себя видны сразу. */
const CC_MATE_RE_N=40;
function ccMateReWire(){ const a=(CAREER && CAREER.career && CAREER.career.mateRe)||[]; return a.slice(-CC_MATE_RE_N); }
function ccMateReMerge(){
  try{
    const p=(typeof MP!=='undefined') && MP.peer;
    if(!p || !Array.isArray(p.reMate) || !(typeof ccMpOn==='function' && ccMpOn())) return false;
    const news=CAREER.career.news||[]; let got=false;
    p.reMate.forEach(r=>{
      if(!r || r.id==null || !r.k || !r.t) return;
      const n=news.find(x=>String(x.id)===String(r.id));
      if(!n || (n.res||[]).some(x=>x.k===r.k)) return;
      n.res=(n.res||[]).concat([{t:String(r.t).slice(0, CC_POST_MAX), day:r.day, by:p.handle, k:r.k}]).slice(-CC_REPLY_MAX);
      got=true;
    });
    if(got) careerSave();
    return got;
  }catch(e){ return false; }
}
function ccMpSendCardSoon(){ try{ if(typeof ccMpOn==='function' && ccMpOn() && typeof MP!=='undefined' && MP.sendCard) MP.sendCard(); }catch(e){} }
/* Посты живого соседа приезжают по сети как есть, а лента рисует их разметкой: из каждой строки поста убираются
   знаки, которыми можно открыть тег, атрибут или строку JS. Свои посты и посты сцены сюда не ходят. */
function ccPeerStr(s){ return String(s==null?'':s).replace(/[<>"`\\\u0000-\u001f]/g, ''); }
function ccPeerSafe(o, d){
  if(typeof o==='string') return ccPeerStr(o);
  if(!o || typeof o!=='object' || (d||0)>6) return (typeof o==='number' || typeof o==='boolean') ? o : null;
  if(Array.isArray(o)) return o.slice(0, 200).map(v=>ccPeerSafe(v, (d||0)+1));
  const r={};
  Object.keys(o).slice(0, 60).forEach(k=>{ if(k!=='__proto__' && k!=='constructor' && k!=='prototype') r[ccPeerStr(k)]=ccPeerSafe(o[k], (d||0)+1); });
  return r;
}
function ccMatePosts(){
  try{
    // Гонка: посты соперников-людей приезжают в их строке (careerRaceCard posts), на них можно ответить.
    if(typeof ccRaceOn==='function' && ccRaceOn() && !(typeof ccMpOn==='function' && ccMpOn())){
      const out=[];
      (typeof ccRaceRivals==='function' ? ccRaceRivals() : []).forEach(p=>{
        if(!p || !p.card || !Array.isArray(p.posts)) return;
        const c=p.card, by={name:ccPeerStr(c.handle), handle:ccHandle(ccPeerStr(c.handle)), card:c, ovr:c._ovr};
        p.posts.map(x=>ccPeerSafe(x)).forEach(x=>{ if(x && x.id!=null) out.push(Object.assign({}, x, {id:'race:'+hKey(c)+':'+x.id, by:by, mate:true})); });
      });
      return out;
    }
    if(!(typeof ccMpOn==='function' && ccMpOn()) || typeof MP==='undefined' || !MP.peer || !Array.isArray(MP.peerPosts)) return [];
    const p=MP.peer, by={name:ccPeerStr(p.handle), handle:ccHandle(ccPeerStr(p.handle)), card:p, ovr:p._ovr};
    // Под постом: ответы, что он получил (свои мои — из cr.mateRe, чтобы не задваивать), и мои.
    const myK=hKey(careerCard()||{handle:''}), mine=(CAREER.career.mateRe||[]);
    return MP.peerPosts.map(x=>ccPeerSafe(x)).map(x=>{
      const theirs=(x.res||[]).filter(r=>!(r.by && hKey(r.by)===myK)).map(r=>r.by ? r : Object.assign({}, r, {by:ccPeerStr(p.handle)}));
      const res=theirs.concat(mine.filter(r=>String(r.id)===String(x.id)).map(r=>({t:r.t, day:r.day})));
      return Object.assign({}, x, {id:'mate:'+x.id, by:by, mate:true, res:res});
    });
  }catch(e){ return []; }
}
function careerFeedHTML(){
  const mp=ccMatePosts();
  // Свои и тиммейта — одной лентой, новые сверху (у своих порядок записи сохраняется).
  const news=mp.length ? (CAREER.career.news||[]).concat(mp).map((e,i)=>[e,i]).sort((x,y)=>(x[0].day<y[0].day?1:x[0].day>y[0].day?-1:x[1]-y[1])).map(x=>x[0])
                       : (CAREER.career.news||[]);
  let list=CH_FEED==='subs'
    ? news.filter(n=>{ const w=ccPostAuthor(n); return w.you || ccFollowing(w.handle); })
    : news;
  // Нажатый тренд (ccTrendsHTML) — лента по нему, с крестиком сверху.
  let chip='';
  if(CH_FEED_Q){ const q=CH_FEED_Q.toLowerCase(); list=list.filter(n=>{ try{ return (ccText(n)+' '+ccPostAuthor(n).handle).toLowerCase().indexOf(q.replace(/^[#@]/,''))>=0; }catch(e){ return false; } });
    chip='<div class="x-trend-on"><b>'+esc(CH_FEED_Q)+'</b><button class="x-act" onclick="careerTrend(null)">✕</button></div>'; }
  if(!list.length) return `<div class="ch-empty">${
    CH_FEED==='subs' ? L().ccFeedSubsEmpty : L().ccNewsEmpty}</div>`;
  return chip+list.slice(0, CAREER_NEWS_KEEP).map(ccPostHTML).join('');
}
/* ---- Чужой профиль --------------------------------------------------------

   По нику можно нажать — и это главный способ ходить по X. Всё, что нужно, уже
   считается: био (ccBioLine), карточка PR, статус F/A и посты этого человека в
   ленте. Здесь они просто собраны на один экран, плюс три действия: подписаться,
   написать и поручиться. */
function careerWho(h){ CH_WHO=String(h||''); CH_SOCIAL='who'; careerRenderHub('social'); }
function careerWhoHTML(h){
  if(!h) return `<div class="ch-tile"><div class="ch-empty">${L().ccNewsEmpty}</div></div>`;
  const card=ccWhoCard(h), esh=jsq(h);
  const who={name:h, handle:ccHandle(h), card:card, logo:null};
  // Живой напарник: его посты едут с карточкой (ccMatePosts), в своей ленте их нет.
  const matePosts=ccMatePosts().filter(x=>x.by && hKey(x.by.name)===hKey(h));
  const posts=matePosts.concat((CAREER.career.news||[]).filter(n=>hKey(ccPostAuthor(n).handle)===hKey(ccHandle(h))));
  const ad=(typeof ccAdOf==='function') ? ccAdOf(h) : null;
  return `<div class="ch-tile x-profile">
    <div class="x-profile-head">
      ${ccAvatar(who)}
      <div><b>${esc(h)}</b>${ccWhoChipHTML(h)}${ccRegChipHTML(card)}<span>@${esc(ccHandle(h))} · 👥 ${ccFollowText(h, card ? ccCardOvr(card) : null)}</span>
        <span class="x-bio">${ccBioLine(h)}</span></div>
    </div>
    <div class="x-acts2">
      ${ccFollowing(h)
        ? `<button class="x-act" onclick="careerUnfollow(\'${esh}\')">${L().ccFollowingBtn}</button>`
        : `<button class="x-act" onclick="careerFollow(\'${esh}\')">${L().ccFollowBtn}</button>`}
      <button class="x-act" onclick="careerPostDm(\'${esh}\')">${L().ccPostDmBtn}</button>
      ${ad ? (ccVouched(h)
        ? `<span class="x-act-done">${L().ccPostVouched}</span>`
        : `<button class="x-act" onclick="careerVouch(\'${esh}\')">${L().ccPostVouchBtn}</button>`) : ''}
    </div>
    ${ccCardShotHTML(h)}
    ${careerPlayerStatsHTML(h, card && card.region)}
    <div class="x-timeline">${posts.length
      ? posts.slice(0, 20).map(ccPostHTML).join('')
      : `<div class="ch-empty">${L().xNoPostsWho}</div>`}</div>
  </div>`;
}

/* ---- Новостной хаб на центре ----
   Одна новость крупно и список заголовков с датами рядом, вместо ленты из 12 одинаковых постов. Ничего не пишется
   заново: заголовок это текст поста, картинка это арт события по виду турнира (CAREER_EV_ART, как на клетках
   недели) или фото человека. Полная лента с лайками и ответами в соцсети, кнопка ведёт туда. */
let CH_NEWS_CAT='all', CH_NEWS_PICK=null;
/* Три полки, как четыре вкладки у них: что сделал ты, что делает сцена и кто
   куда перешёл. Полка выводится из ключа записи — своего поля у неё нет и не
   нужно: ключ всегда знал, о чём строка. */
const CC_NEWS_MOVE=/^(ccPostDuoSplitBy|ccPostTrioLF|ccPostLfdWant|ccNewsSigned|ccNewsSignedDuo|ccNewsSignedAcademy|ccNewsReleased|ccNewsLeft|ccNewsLeftOrg|ccNewsExtended|ccNewsPromotedRoster|ccNewsDuoAnnounce|ccNewsDuoSplit|ccNewsDuoWorldSplit|ccNewsPartnerNew|ccNewsPartnerLeft|ccNewsMateLeftFor|ccNewsLfd)/;
function ccNewsCat(n){
  if(ccPostAuthor(n).you) return 'you';
  return CC_NEWS_MOVE.test(String(n.k||'')) ? 'moves' : 'scene';
}
/* Картинка новости. Сначала — арт турнира, о котором она: ключи вечеров
   называют свой вид сами. Потом — лицо человека, если новость про человека.
   Ничего не нашлось — карточка идёт без картинки, а не с заглушкой. */
const CC_NEWS_KIND=[[/^ccNewsMaj/, 'major'], [/^ccNewsRel|^ccNewsRc/, 'reload'],
  [/^ccNewsSolo/, 'solo'], [/^ccNewsGlob|^ccNewsGc/, 'gc'], [/^ccNewsSum/, 'summit'],
  [/^ccNewsVic/, 'victory'], [/^ccNewsEval/, 'eval'], [/^ccNewsWf|^ccNewsResultWeek/, 'final'],
  [/^ccNewsResult|^ccPostWon|^ccPostPodium|^ccNewsCongrats|^ccPostOrgWin|^ccNewsWinner|^ccNewsD1Table/, 'cup']];
/* Обложка новости — в оформлении того, что игралось (его правка 28.09, скрин поста Kinch
   про ESL Katowice 2019 с гербом FNCS 2026): свой постер у турнира дня (n.evArt, пишется в
   careerNews), иначе постер сезона FNCS, в котором вышел пост; 2026-й — как раньше, по виду. */
/* Картинка под панелью дня — своего сезона (ccSeasonArtOn), а не кап 2026-го на любом году (Notion «19.10», скрин 32:
   «кап 26 года на превью не того года»). С ноября 2025-го своей картинки сезона нет — тогда кап этого года. */
function ccDayArt(){ return ccSeasonArtOn(careerToday()) || CAREER_EV_ART.cup; }
function ccSeasonArtOn(day){
  const d=String(day||'');
  if(!d || d>='2025-11-29') return '';
  const all=[].concat(CC_SEASONS_2019, CC_SEASONS_2020, CC_SEASONS_2021, CC_SEASONS_2022,
                      CC_SEASONS_2023, CC_SEASONS_2024, CC_SEASONS_2025);
  const s=all.find(x=>d>=x.from && d<=x.to);
  const num=s ? +String(s.id).slice(1) : 0;
  if(!num) return d<'2019-12-31' ? 'art/fncs-2019.jpg' : 'art/fncs-'+d.slice(0,4)+'.jpg';
  if(num<=9) return 'art/fncs-2019.jpg';
  if(num===22) return 'art/cups/f22inv.jpg';
  if(num<=25) return 'art/cups/f'+num+'.jpg';
  if(num<=27) return 'art/fncs-2023.jpg';
  if(num<=31) return 'art/cups/f28.jpg';
  return num<=33 ? 'art/mode-major1-2025.jpg' : num<=35 ? 'art/mode-major2-2025.jpg' : 'art/mode-major3-2025.jpg';
}
// Свой постер события (сезон FNCS, id, постер капа) — без запасной обложки по виду.
function ccEventArtOwn(ev){
  if(!ev) return '';
  const own=ccOwnLogoOf(ev); if(own) return own;
  return ccFncsPoster(ev.id||ev.eid) || CAREER_EV_ART_ID[ev.id||ev.eid||''] || ccCupPoster(ev.id||ev.eid) || '';
}
function ccNewsArtOf(n){
  const k=String(n.k||'');
  for(let i=0;i<CC_NEWS_KIND.length;i++)
    if(CC_NEWS_KIND[i][0].test(k)){
      const art=n.evArt || ccSeasonArtOn(n.day) || CAREER_EV_ART[CC_NEWS_KIND[i][1]] || CAREER_EV_ART.cup;
      if(art) return {src:art, kind:'art'};
    }
  const who=ccPostAuthor(n);
  // Герб лежит в своей папке, лицо — в своей: те же две двери, что у ccAvatar.
  if(who.logo) return {src:LOGO_DIR+who.logo, kind:'crest'};
  if(who.card){ const u=photoURL(who.card); if(u) return {src:u, kind:'face'}; }
  if(who.you){ const u=photoURL(careerCard()); if(u) return {src:u, kind:'face'}; }
  /* Картинка есть ВСЕГДА — отзыв: «чтоб новости там были и картинки
     фортнайт». Новость без арта на этом экране выглядит как пустая карточка,
     поэтому последним рубежом стоит афиша сезона. */
  return {src:n.evArt || ccSeasonArtOn(n.day) || CAREER_EV_ART.cup, kind:'art'};
}
function careerNewsCat(c){ CH_NEWS_CAT=c; CH_NEWS_PICK=null; careerRenderHub('centre'); }
/* Выбранная руками новость останавливает карусель: игрок читает то, что открыл,
   и карточка не должна уезжать у него из-под глаз. */
function careerNewsPick(id){ CH_NEWS_PICK=id; careerNewsShow(id); }
/* ---- Карусель новостей ----------------------------------------------------

   Правка, со скриншотом точек под панелью FIFA: «хочу чтоб тут
   менялись картинки раз в какое-то время как на референсе». Каждые шесть секунд
   карточка показывает следующую новость, снизу — точки, по ним можно кликнуть.

   Перерисовывается ТОЛЬКО карточка, а не весь центр: центр — это неделя,
   календарь, панель дня и магазин, и гонять их каждые шесть секунд значит
   отдать батарею телефона за смену картинки.

   Уважение к prefers-reduced-motion здесь особое: смена новости — это не
   анимация, а содержимое, и её мы не отключаем (иначе игрок с включённым
   reduced-motion не увидит фичу вовсе). Отключается плавность: при reduced
   карточка меняется мгновенно, без затухания. */
const CC_NEWS_ROT_MS=6000;
let CC_NEWS_ROT=null, CC_NEWS_IDS=[], CC_NEWS_AT=0;
function ccNewsLeadOf(id){
  /* Карьеры может уже не быть: скриншот — «Cannot read properties of
     null (reading 'career')» на этой строке. Таймер ленты (careerNewsRotStart)
     проверял только, что элемент #nhLead на месте, а после выхода из карьеры экран
     хаба лишь прячется, элемент остаётся — и тик шёл в CAREER=null. */
  const cr=CAREER && CAREER.career;
  const all=(cr && cr.news)||[];
  return all.find(n=>n.id===id) || null;
}
function careerNewsShow(id){
  const box=document.getElementById('nhLead');
  const n=ccNewsLeadOf(id);
  if(!box || !n) return;
  box.innerHTML=ccNewsLeadHTML(n);
  box.classList.remove('nh-in');
  // Пересборка стиля, чтобы затухание проигралось заново.
  void box.offsetWidth;
  box.classList.add('nh-in');
  const list=document.querySelectorAll('#screen-career-hub .nh-row');
  list.forEach(el=>el.classList.toggle('on', el.dataset.id===id));
  document.querySelectorAll('#screen-career-hub .nh-dot')
    .forEach(el=>el.classList.toggle('on', el.dataset.id===id));
  CC_NEWS_AT=Math.max(0, CC_NEWS_IDS.indexOf(id));
}
function careerNewsRotStop(){
  if(CC_NEWS_ROT){ clearInterval(CC_NEWS_ROT); CC_NEWS_ROT=null; }
}
function careerNewsRotStart(ids){
  careerNewsRotStop();
  CC_NEWS_IDS=ids||[];
  if(CH_NEWS_PICK || CC_NEWS_IDS.length<2) return;
  CC_NEWS_ROT=setInterval(function(){
    // Экран сменился — таймер снимает себя сам, без подписки на переходы.
    if(!document.getElementById('nhLead')){ careerNewsRotStop(); return; }
    if(CH_NEWS_PICK){ careerNewsRotStop(); return; }
    // Карьеры нет или хаб спрятан (выход из карьеры, другая вкладка) — таймеру нечего листать.
    const hub=document.getElementById('screen-career-hub');
    if(!CAREER || !CAREER.career || !hub || !hub.classList.contains('active')){ careerNewsRotStop(); return; }
    CC_NEWS_AT=(CC_NEWS_AT+1)%CC_NEWS_IDS.length;
    careerNewsShow(CC_NEWS_IDS[CC_NEWS_AT]);
  }, CC_NEWS_ROT_MS);
}
function careerNewsHubHTML(){
  const all=(CAREER.career.news||[]);
  const list=(CH_NEWS_CAT==='all' ? all : all.filter(n=>ccNewsCat(n)===CH_NEWS_CAT)).slice(0, 14);
  const cats=['all','scene','moves','you'];
  const tabs=cats.map(c=>`<button class="nh-tab${CH_NEWS_CAT===c?' on':''}"
      onclick="careerNewsCat(\'${c}\')">${L()['ccNewsCat'+c]}</button>`).join('');
  if(!list.length)
    return `<div class="ch-tile ch-newsbar"><h4>${L().ccNewsHub}</h4>
      <div class="nh-tabs">${tabs}</div>
      <div class="ch-empty">${L().ccNewsEmpty}</div></div>`;
  const lead=list.find(n=>n.id===CH_NEWS_PICK) || list[0];
  const rows=list.map(n=>{
    const w=ccPostAuthor(n);
    return `<button class="nh-row${n===lead?' on':''}" data-id="${esc(n.id||'')}"
        onclick="careerNewsPick('${n.id||''}')">
      <em>${ccStamp(n)}</em><b>${esc(ccText(n))}</b>
      <span>${esc(w.name)}</span></button>`;
  }).join('');
  /* Точки — как под панелью новостей у них: сколько новостей в карусели и на
     какой она сейчас. Первые шесть, дальше карусель не ходит: это витрина
     свежего, а весь список и так стоит слева. */
  const ids=list.slice(0, 6).map(n=>n.id).filter(Boolean);
  const dots=ids.map(id=>`<button class="nh-dot${id===lead.id?' on':''}" data-id="${esc(id)}"
      onclick="careerNewsPick(\'${id}\')" aria-label="${esc(L().ccNewsHub)}"></button>`).join('');
  // Карусель заводится после того, как разметка попала в документ.
  setTimeout(function(){ careerNewsRotStart(ids); }, 0);
  return `<div class="ch-tile ch-newsbar">
    <h4>${L().ccNewsHub}</h4>
    <div class="nh-tabs">${tabs}</div>
    <div class="nh-wrap">
      <div class="nh-list">${rows}</div>
      <div class="nh-side">
        <article class="nh-lead nh-in" id="nhLead">${ccNewsLeadHTML(lead)}</article>
        ${ids.length>1 ? `<div class="nh-dots">${dots}</div>` : ''}
      </div>
    </div>
  </div>`;
}
// Одна новость крупно. Вынесено отдельно, потому что карусель меняет только её.
function ccNewsLeadHTML(lead){
  const art=ccNewsArtOf(lead), who=ccPostAuthor(lead);
  return `${art ? `<div class="nh-art nh-art-${art.kind}" style="background-image:url(${art.src})"></div>` : ''}
    <div class="nh-lead-in">
      <em class="nh-kicker">${L()['ccNewsCat'+ccNewsCat(lead)]} · ${ccStamp(lead)}</em>
      <h5>${ccMentions(ccText(lead))}</h5>
      <div class="nh-by">${ccAvatar(who)}<span><b>${esc(who.name)}</b>@${esc(who.handle)}</span></div>
      ${ccShotHTML(lead.tbl)+ccLeadHTML(lead.lead)}
      ${ccCardShotHTML(lead.card)}
      <button class="cc-back nh-open" onclick="careerOpenFeed()">${L().ccNewsOpen}</button>
    </div>`;
}
// One post. The feed and the profile draw the same thing, so a like put on a
// post in one place is the same like in the other.
/* Mentions.

   Pulled out of the text after it is built rather than assembled into it, so a
   translation can put the @ wherever the sentence wants it and the renderer
   never has to know which argument was a handle. A club like Virtus.pro keeps
   its dot; a sentence's full stop does not get eaten, because a dot only counts
   when something follows it. */
function ccMentions(t){
  return String(t==null?'':t)
    .replace(/@([A-Za-z0-9_\-]+(?:\.[A-Za-z0-9_\-]+)*)/g, '<span class="x-at">@$1</span>');
}
/* Комментарии под постом. Не хранятся, собираются из самого поста, как и
   ccPostStats: лента держит CAREER_NEWS_KEEP записей, и пять строк на каждую
   раздули бы сейв впятеро. Рисовальщик ничего не меняет: прибавку к форме за
   похвалу даёт конец вечера (ccProNod), иначе форма росла бы от листания ленты.
   Только под своими постами. Пишут болельщики с никами из генератора ладдера,
   сверху настоящий профи, если его записал ccProNod. */
const CC_CO_MAX=5;
/* Настроение поста — по ключу, и только потом по месту.

   Раньше банк выбирался по первым двум аргументам как по «место из скольких»,
   а у половины ключей там лежит не это: у ccPostPlaced вторым идёт дивизион,
   у ccNewsWfCash — деньги. Отсюда выгрузка ленты 3 сентября: «deserved» и
   «congrats» под «Evaluation: Round 2 without a win», «good run» под 33-м
   местом финала недели (33 из $400 — это 92% «побитых»). Ключ говорит, о чём
   пост, и решает первым; место читается только там, где оно правда место. */
const CC_CO_BY_KIND=[
  [/^ccPostDuoSplitBy|^ccPostTrioLF|^ccNewsDuoWorldSplit|^ccNewsDuoSplit|^ccNewsMateLeftFor|^ccNewsPartnerLeft|^ccPostMateLeft|^ccNewsDuoOutgrown/, 'Sad'],
  [/^ccPostLfdWant|^ccNewsLfd/, 'Lfd'],
  [/Bday/, 'Bday'],
  [/^ccNewsAnnounce|^ccNewsRoadmap|^ccPostHype|^ccPostDates/, 'Hype'],
  [/^ccNewsDuoAnnounce|^ccNewsDuoAgain|^ccNewsSquadNew|^ccNewsPartnerNew|^ccNewsSceneDuo/, 'Duo'],
  /* Свои банки (16.10, «посмотри твиттер и сделай реалистичней»): под таблицей статистики Kinch, анонсом сезона и
     подколом писали ответы на средний вечер («mid but fine», «could be worse») — у них не было своего вида. */
  [/^ccNewsStatBoard|^ccNewsKinch/, 'Stat'],
  [/^ccNewsMetaNew|^ccNewsHotfix|^ccNewsRehost/, 'Meta'],
  [/^ccPostTechNet/, 'Bad'],
  [/^ccNewsTeamingDq/, 'Rumor'],
  [/^ccPostEvKilled|^ccPostPressRival/, 'Taunt'],
  [/^ccPostPress$/, 'Press'],
  [/^ccPostRumor/, 'Rumor'],
  [/^ccPostPoll/, 'Poll'],
  [/^ccPostDebate/, 'Poll'],
  [/^ccNewsZoneLuck/, 'Stat'],
  [/^ccPostZoneLuck/, 'Bad'],
  [/^ccPostPressBroke/, 'Bad'],
  [/^ccNewsSigned|^ccNewsExtended|^ccNewsPromotedRoster|^ccNewsRaise/, 'Sign'],
  [/^ccNewsReleased|^ccNewsLeft|^ccPostBye/, 'Left'],
  [/^ccNewsD1Table/, 'Table'],
  [/^ccNewsStream|^ccPostStreamD1/, 'Stream'],
  [/^ccPostDropCall/, 'Drop'],
  [/^ccPostQualGrands|^ccPostBotQualGrands/, 'Pod'],
  [/^ccPostCustomsOpen|^ccPostHosted/, 'Cust'],
  [/^ccNewsRetired/, 'Bye'],
  [/^ccNewsBanned|^ccPostBanSad/, 'Ban'],
  [/^ccNewsCongrats|^ccPostOrgWin|^ccNewsWinner|^ccPostWon|^ccNewsGlobChamp|^ccNewsRcChamp|^ccNewsAward|^ccNewsPromoted$/, 'Win'],
  [/^ccPostPodium|Through$|^ccNewsWfIn|^ccNewsGcIn|^ccPostWins|^ccNewsEvalCash|^ccNewsVicCash/, 'Pod'],
  [/Out$|NoWin$|NoCash$|^ccPostClose|^ccPostOneOff|^ccPostTriedBest|^ccNewsRcDrop|^ccNewsRelegated|^ccNewsMpSplit|^ccNewsRentGone/, 'Bad']
];
/* ОТВЕТЫ ПОД СВОИМ ПОСТОМ ПО СМЫСЛУ (17.10, Notion «fncsdraft 15.10», его «реплаи не по теме»: под «ищу дуо на сезон 🙏
   лс открыты» и «форма есть 📈» писали «best 🔥», «earned», «congrats» — любая своя строка словами считалась новостью
   и брала банк поздравлений). Теперь тема — по словам поста: ищу дуо/трио → «V», «dm'd»; форма, готовность, буткемп,
   скримы → «посмотрим в субботу», «👀»; победа → поздравления; тильт и плохой вечер → поддержка; вопрос → ответы на
   вопрос; остальное — разговорное «real», «fr», без поздравлений. */
const CC_CO_TEXT=[
  [/(^|[^a-zа-яё])(lf[dts]|looking for|ищу|ищем|нужен (дуо|тиммейт|трио)|лс открыт|dms? open|need a (duo|trio|mate))/i, 'Lfd'],
  [/(выиграл|выиграли|победил|победа|we won|i won|won the|#1\b|топ[- ]?1\b|\bgg wp\b|🏆)/i, 'Win'],
  [/(тильт|tilt|плохо|ужасн|rough|awful|сгорел|бросаю|quit|😔|😞|💀)/i, 'Bad'],
  [/(форм|ready|готов|bootcamp|буткемп|grind|гринд|тренир|scrim|скрим|📈|cook|in form|locked in|настрой|голоден|hungry)/i, 'Ready'],
  [/\?\s*$/, 'Ask']
];
function ccCoTextMood(t){
  for(let i=0;i<CC_CO_TEXT.length;i++) if(CC_CO_TEXT[i][0].test(t)) return CC_CO_TEXT[i][1];
  return 'Talk';
}
function ccCoMood(n){
  const k=String((n&&n.k)||'');
  for(let i=0;i<CC_CO_BY_KIND.length;i++) if(CC_CO_BY_KIND[i][0].test(k)) return CC_CO_BY_KIND[i][1];
  const a=(n&&n.a)||[];
  const p=+a[0];
  // Место — там, где строка про место: своё место в комнате, финал недели,
  // призовые за этап. Где размер комнаты не записан, он берётся за пятьдесят —
  // это финал недели и любой финал круга.
  if(/^ccPostPlaced|^ccNewsResult|^ccNewsWfCash|Cash$/.test(k) && p>0){
    const of=(/^ccNewsResult/.test(k) && +a[1]>1) ? +a[1] : 50;
    const beat=1-(p-1)/Math.max(1, of-1);
    return p===1 ? 'Win' : (p<=3 || beat>=0.9) ? 'Pod' : beat<=0.3 ? 'Bad' : 'Mid';
  }
  if(!k) return ccCoTextMood(String((n && n.text) || ''));   // своя строка словами — по смыслу (ccCoTextMood)
  return n.kind==='bad' ? 'Bad' : n.kind==='good' ? 'News' : 'Mid';
}
/* Главный свой пост вечера.

   Вечер пишет четыре-пять строк подряд — место в комнате, проход в финал,
   призовые, рейтинг, — и напарник с кивнувшим профи стояли под каждой: в
   выгрузке 3 сентября vic0 четыре раза за вечер хвалил один и тот же кап.
   Настоящие пишут под одним постом — под тем, где скрин. Якорь — самый свежий
   свой пост о результате того же дня; под остальными строками вечера люди
   сцены появляются редко. Поста может не быть в ленте вовсе (проверки рисуют
   запись отдельно) — тогда якорь он сам. */
const CC_CO_RESULT=/^ccPostPlaced|^ccPostWon|^ccPostPodium|^ccNewsResult|^ccNewsWfIn|^ccNewsWfCash|Cash$|Out$|NoWin$|NoCash$|Through$|^ccNewsPromoted$|^ccNewsRelSeat|^ccNewsGcIn|^ccNewsGcSeat|^ccNewsCup/;
function ccCoAnchor(n){
  const list=(CAREER && CAREER.career && CAREER.career.news)||[];
  const top=list.find(x=>x && x.day===n.day && !x.by && CC_CO_RESULT.test(String(x.k||'')) &&
                          (CC_POST_BY[x.k]||'you')==='you');
  return !top || top.id===n.id;
}
/* Кто пишет под постом. Как на X: под победой про первым напарник, потом клуб, потом другие про из комнаты
   («W», «deserved»), потом зрители; под LFD настоящие пишут «V», именинник отвечает «ty», под плохим вечером «washed».
   Настоящие берутся из уже записанного: напарник (careerPartnerCard), клуб (CAREER.org), друзья, подписки, ссора
   (careerBeefHot); у человека сцены его пара (ccPairMateOf), клуб (ccWhoCard), соседи по таблице и упомянутые.
   Ничего не хранится: тот же хэш, тот же разговор. Под постом сцены автор иногда отвечает веткой. Под своим постом
   за игрока никто не отвечает. */
function ccPostComments(n, who, st){
  /* Свои реплики под чужим постом: короткая кнопочная и всё, что написано
     словами (n.res). Обе видны всегда — они написаны игроком. См. careerReply. */
  const meAt=esc(ccHandle((CAREER.player||{}).nick||''));
  /* Ответ КОНКРЕТНОМУ человеку под своим постом — игрок из Notion, 8 сентября:
     «we could reply to the people in our own tweet». Такой ответ несёт адресата
     (r.to) и рисуется веткой под его строкой; ответ без адресата — как раньше,
     внизу. Строки под своим постом не хранятся (тот же хэш — тот же разговор),
     поэтому адресат ищется по нику среди нарисованных; если его строка не
     собралась (сменился напарник, подписки), ответ уходит вниз с «@кому». */
  const res=((n&&n.res)||[]);
  const toKey=r=>r.to ? hKey(r.to) : '';
  // r.by — ответ живого напарника (ccMateReMerge), рисуется его ником.
  const mineRow=r=>'<div class="x-co-r'+(r.by?'':' x-co-mine')+(r.to?' sub':'')+'"><b>@'+(r.by?esc(ccHandle(r.by)):meAt)+'</b>'+
      '<span>'+(r.to?'<u>@'+esc(ccHandle(r.to))+'</u> ':'')+esc(r.t||'')+'</span></div>';
  const mine=((n && n.re)
      ? '<div class="x-co-r x-co-mine"><b>@'+meAt+'</b><span>'+esc(L()['ccRe'+n.re]||'')+'</span></div>'
      : '')+
    res.filter(r=>!r.to).map(mineRow).join('');
  const placed=new Set();
  const orphans=()=>res.filter(r=>r.to && !placed.has(toKey(r))).map(mineRow).join('');
  const onlyMine=()=>{ const s=mine+orphans(); return s ? '<div class="x-co">'+s+'</div>' : ''; };
  if(!n || !who) return onlyMine();
  const replies=(st && st.replies)||0;
  if(replies<1) return onlyMine();
  const cr=(CAREER&&CAREER.career)||{};
  const seed=ccHashStr('co|'+(n.id||'')+'|'+(n.k||'')+'|'+(n.day||'')+'|'+(n.text||''));
  const rnd=careerRng(seed);
  const mood=ccCoMood(n);
  // Банк по сезону: в трио про дуо писать нечего — см. ccSquadKey.
  const bankOf=name=>{ const b=L()[ccSquadKey(name)]||L()[name]; return (Array.isArray(b)&&b.length) ? b : null; };
  const fanBank=bankOf('ccCo'+mood)||L().ccCoNews;
  const good=(mood==='Win'||mood==='Pod'||mood==='Duo'||mood==='Sign');
  // Под анонсом дуо профи желают удачи, а не «earned 🐐» (16.10) — у анонса свой банк.
  const proBank=mood==='Duo' ? fanBank : good ? bankOf('ccCoProWin') : mood==='Bad' ? bankOf('ccCoProBad')
              : mood==='Lfd' ? bankOf('ccCoProLfd') : (mood==='Ready'||mood==='Talk'||mood==='Ask') ? (bankOf('ccCoPro'+mood)||fanBank) : fanBank;
  // «🐐» от напарника под сорок третьим местом — нет; под серединой он пишет
  // то же, что под плохим вечером: «вернёмся», «в следующий раз».
  const mateBank=bankOf(mood==='Duo' ? 'ccCoDuo' : (mood==='Bad'||mood==='Mid') ? 'ccCoMateDown'
                 : (mood==='Ready'||mood==='Talk'||mood==='Ask') ? 'ccCoMate'+mood : 'ccCoMateUp');
  // Напарник пишет под вечером, а не под анонсом Epic или скрином таблицы.
  const resulty=good || mood==='Bad' || mood==='Mid' || mood==='News';
  const rows=[], seenH=new Set(), seenT=new Set();
  const authorK=hKey(who.handle||who.name||'');
  const myK=hKey(ccHandle((CAREER.player||{}).nick||''));
  if(authorK) seenH.add(authorK);
  if(myK) seenH.add(myK);
  // Одна и та же строка под одним постом два раза — это уже не два человека.
  const pick=bank=>{
    if(!bank||!bank.length) return null;
    for(let g=0; g<8; g++){ const c=bank[Math.floor(rnd()*bank.length)]; if(!seenT.has(c)){ seenT.add(c); return c; } }
    return null;
  };
  const add=(h, bank, opt)=>{
    const k=hKey(h);
    if(!h||!k||seenH.has(k)||rows.length>=CC_CO_MAX+1) return false;
    const t=pick(bank);
    if(t==null) return false;
    seenH.add(k);
    rows.push(Object.assign({h:String(h), t:t}, opt||{}));
    return true;
  };
  const ovrOf=c=>c ? ((c._ovr!=null?c._ovr:(attrsFor(c)||{}).ovr)||0) : 0;
  // Под постом из другого региона комната — того региона: европейские про под
  // победой в Северной Америке не сидят. См. careerRegionsWeek.
  const away=ccAwayRegionOf(who.card);
  let roster=[];
  try{ roster=(away ? ccSceneRoster(away) : careerRosterNowEU())||[]; }catch(e){ roster=[]; }
  const realOf=h=>{ const k=hKey(h); return k ? (roster.find(c=>hKey(c)===k)||null) : null; };
  // Кто был в той же комнате — по таблице под постом; кого пост упоминает —
  // по тексту. И те и другие — настоящие имена, иначе они не считаются.
  const room=[];
  ((n.tbl&&n.tbl.rows)||[]).forEach(r=>String(r.n||'').split(/\s*[+&]\s*/).forEach(x=>{
    const c=realOf(x.trim()); if(c && hKey(c)!==authorK) room.push(c.handle); }));
  const mentioned=[];
  try{
    String(ccText(n)||'').replace(/@([A-Za-z0-9_]+)/g, (m,h)=>{ const c=realOf(h); if(c && hKey(c)!==authorK) mentioned.push(c.handle); return m; });
  }catch(e){}
  const sad=(mood==='Sad'), hush=(mood==='Ban');
  let hater=false;
  if(who.you){
    const anchor=ccCoAnchor(n);
    // Кивок профи — первым, и только под главным постом того самого дня.
    if(anchor && cr.nod && cr.nod.day===n.day && cr.nod.who) add(cr.nod.who, bankOf('ccCoPro')||L().ccCoPro, {pro:true});
    // Напарник — почти всегда под главным постом вечера, редко под остальными.
    let mate=null; try{ mate=careerPartnerCard(); }catch(e){}
    const mateP=(anchor && resulty) ? (good?0.85:mood==='Bad'?0.6:0.35) : 0.15;
    if(mate && mate.handle && !sad && !hush && rnd()<mateP) add(mate.handle, mateBank, {pro:true});
    // Клуб — под тем, чем можно хвастаться, и только под главным.
    const org=CAREER.org;
    if(anchor && org && org.name && good && rnd()<0.5) add(ccOrgAt(org.name)||ccHandle(org.name), bankOf('ccCoOrg'), {pro:true, org:true});
    // Друзья и те, на кого подписан, — настоящие имена сцены.
    const near=[].concat(cr.friends||[], cr.follows||[]).filter(h=>realOf(h));
    if(near.length && rnd()<(anchor?0.5:0.2)) add(near[Math.floor(rnd()*near.length)], proBank, {pro:true});
    // Живая ссора: соперник приходит и под хороший вечер, и под плохой.
    let hot=[]; try{ hot=careerBeefHot(); }catch(e){}
    if(hot.length && hot[0].h && rnd()<(anchor?0.6:0.2)) add(hot[0].h, bankOf('ccCoTroll'), {pro:true});
    // Хейтер — тем чаще, чем хуже вечер и чем громче карьера.
    const hateP=hush ? 0 : mood==='Bad' ? 0.5 : mood==='Mid' ? 0.25 : good ? 0.12 : 0.08;
    hater=rnd()<hateP*Math.min(1, 0.4+(careerReach()||0)/20000);
  } else if(!who.verified && !who.f){
    // Человек сцены: его пара, его клуб, кто был в комнате, кого он упомянул.
    let mate=null; try{ mate=ccPairMateOf(who.handle); }catch(e){}
    if(mate && mate.handle && resulty && rnd()<(good?0.6:0.3)) add(mate.handle, mateBank, {pro:true});
    let card=null; try{ card=ccWhoCard(who.handle); }catch(e){}
    if(card && card.org && good && rnd()<0.4) add(ccOrgAt(card.org)||ccHandle(card.org), bankOf('ccCoOrg'), {pro:true, org:true});
    /* Кого пост упоминает: бывшая половина под разводом говорит «спасибо за
       всё», новая — под анонсом пары — «🐐», остальные — как сцена. Кто
       упомянут и промолчал, в общий пул не попадает: под «playing with
       @maloyache» сам maloyache писал «ez lobby». */
    mentioned.forEach(h=>{
      // Под постом о вечере отмеченный — это напарник по этому вечеру, даже
      // если пул пар знает его за другим: «top 2 @swizzy» отвечает swizzy как
      // половина, а не как посторонний про.
      if(rnd()<0.5) add(h, sad ? bankOf('ccCoLeft') : (mood==='Duo'||resulty) ? mateBank : proBank, {pro:true});
      else seenH.add(hKey(h));
    });
    const mine=who.ovr||ovrOf(card)||80;
    const pros=room.length ? room : roster.filter(c=>Math.abs(ovrOf(c)-mine)<=8).map(c=>c.handle);
    const nPro=1+Math.floor(rnd()*2);
    for(let i=0; i<nPro && pros.length; i++) add(pros[Math.floor(rnd()*pros.length)], proBank, {pro:true});
  } else {
    // Пресса или клуб: отвечают те, о ком пост, и верх сцены.
    // Тот, о ком пост, либо благодарит, либо молчит — «monster» под
    // поздравлением с собственной победой он не пишет.
    // Под слухом о себе не благодарят — отмалчиваются или отшучиваются (16.10).
    mentioned.forEach(h=>{ if(rnd()<0.6) add(h, bankOf(mood==='Rumor' ? 'ccCoRumorMe' : 'ccCoTy'), {pro:true}); else seenH.add(hKey(h)); });
    const top=roster.slice().sort((a,b)=>ovrOf(b)-ovrOf(a)).slice(0, 60);
    const nPro=(mood==='Table'||mood==='Hype') ? 1 : 1+Math.floor(rnd()*2);
    for(let i=0; i<nPro && top.length; i++) add(top[Math.floor(rnd()*top.length)].handle, proBank, {pro:true});
  }
  // Зрители — сколько под постом принято показывать, минус те, кто уже сказал.
  const want=Math.min(CC_CO_MAX, Math.max(1, Math.min(replies, 2+Math.floor(rnd()*4))));
  const fanHandle=()=>{
    // 30.10, его «никнеймы чет не популярные» (скрин ответов @krisbot, @lenrss): больше половины пишущих — известные
    // про региона (ccPopularHandles), остальное — люди с кубков, как раньше.
    const pop=ccPopularHandles();
    if(pop.length && rnd()<0.55) return pop[Math.floor(rnd()*pop.length)];
    // Настоящие люди региона, которые играют кубки (CC_LADDER_REAL), — выдуманный ник только когда их нет.
    const rp=ccLadderRealPick(rnd, new Set(), 0); if(rp) return rp[0];
    // Тем же составителем, что и ладдер: зритель под постом и выдуманный из
    // лобби — одна и та же сцена, и ники у них должны быть одной породы.
    const a=CC_LAD_A[Math.floor(rnd()*CC_LAD_A.length)];
    const b=CC_LAD_B[Math.floor(rnd()*CC_LAD_B.length)];
    let h=a.charAt(0).toUpperCase()+a.slice(1)+b;
    const r=rnd();
    if(r<0.35) h+=String(10+Math.floor(rnd()*89));
    else if(r<0.55) h+=['fn','_fn','ttv','yt','_'][Math.floor(rnd()*5)];
    return h;
  };
  let guard=0;
  while(rows.length<want && guard++<40) add(fanHandle(), fanBank, {});
  if(hater) add(fanHandle(), bankOf((mood==='Bad'||mood==='Mid') ? 'ccCoHateBad' : 'ccCoHate'), {hate:true});
  /* ВЕТКИ И РАТИО (16.10, его «3»): под хейтером за тебя вступаются — напарник, если есть, иначе зритель, — и хейтер
     иногда огрызается; под чужими постами зрители спорят с первым ответом. У каждого ответа свои лайки (доля лайков
     поста по роли), а хейтер под твоим слабым вечером иногда собирает больше лайков, чем пост, — «Ratio». */
  {
    const hi=rows.findIndex(r=>r.hate);
    if(hi>=0){
      const hr=rows[hi];
      hr.ratio=!!who.you && (mood==='Bad'||mood==='Mid') && rnd()<0.25;
      let mh=null; try{ const m=who.you ? careerPartnerCard() : ccPairMateOf(who.handle); mh=m && m.handle; }catch(e){}
      const dh=(mh && hKey(mh)!==authorK) ? mh : fanHandle();
      const dt=pick(bankOf('ccCoDefend'));
      if(dt){
        rows.splice(hi+1, 0, {h:dh, t:dt, pro:dh===mh, sub:true, def:true});
        if(rnd()<0.45){ const bt=pick(bankOf('ccCoHateBack')); if(bt) rows.splice(hi+2, 0, {h:hr.h, t:bt, hate:true, sub:true}); }
      }
    }
    if(!who.you && rows.length>=2 && rnd()<0.3){
      const i=rows.findIndex(r=>!r.sub && !r.hate);
      const bt=i>=0 ? pick(bankOf('ccCoBanter')) : null;
      if(bt) rows.splice(i+1, 0, {h:fanHandle(), t:bt, sub:true});
    }
    const pl=Math.max(1, (st && st.likes)||1);
    rows.forEach(r=>{ const k=r.ratio ? 1.1+rnd()*0.9 : r.pro ? 0.04+rnd()*0.25 : r.def ? 0.05+rnd()*0.3 : r.hate ? 0.01+rnd()*0.06 : 0.005+rnd()*0.08;
      r.likes=Math.round(pl*k); });
  }
  /* Автор отвечает одному из написавших — только человек сцены, и не в
     каждом посте: под своим за игрока не пишет никто, аккаунт сцены и клуб
     в комментариях не сидят. */
  if(!who.you && !who.verified && !who.f && who.handle && rows.length && !hush && rnd()<0.4){
    const at=rows.findIndex(r=>r.pro && !r.org);
    const i=at>=0 ? at : Math.floor(rnd()*rows.length);
    const t=pick(bankOf('ccCoTy'));
    if(t!=null) rows.splice(i+1, 0, {h:who.handle, t:t, pro:true, sub:true});
  }
  if(!rows.length) return onlyMine();
  const left=Math.max(0, replies-rows.length);
  const idAt=esc(n.id||'');
  const rowHTML=r=>{
    const hAt=esc(ccHandle(r.h));
    let s='<div class="x-co-r'+(r.pro?' pro':'')+(r.org?' org':'')+(r.hate?' hate':'')+(r.sub?' sub':'')+'">'+
        '<b>@'+hAt+(r.org?'<i class="x-tick">✓</i>':'')+'</b><span>'+esc(r.t)+'</span>'+
        (r.ratio ? '<i class="x-ratio">Ratio</i>' : '')+(r.likes>0 ? '<em class="x-co-l">♥ '+ccFollowers(r.likes)+'</em>' : '')+
        // Под своим постом у каждой строки — «Ответить»: см. careerReplyTo.
        (who.you && !r.sub ? '<button class="x-co-re" onclick="careerReplyTo(\''+idAt+'\',\''+
           jsq(r.h)+'\')">'+esc(L().ccReplyBtn)+'</button>' : '')+
      '</div>';
    if(!who.you) return s;
    const k=hKey(r.h);
    const thread=res.filter(x=>x.to && toKey(x)===k);
    if(thread.length){
      placed.add(k);
      s+=thread.map(mineRow).join('');
      /* И он отвечает в ответ — коротко, из того же банка благодарностей, что и
         под прессой. Посеяно от поста и ника: перерисовка не меняет разговор.
         Хейтер не отвечает — с ним разговора нет. */
      if(!r.hate){
        const back=bankOf('ccCoTy');
        const rb=careerRng(ccHashStr('back|'+(n.id||'')+'|'+k));
        if(back && back.length && rb()<0.6)
          s+='<div class="x-co-r'+(r.pro?' pro':'')+' sub"><b>@'+hAt+'</b><span>'+
             esc(back[Math.floor(rb()*back.length)])+'</span></div>';
      }
    }
    if(CC_REPLY_OPEN===n.id && CC_REPLY_TO && hKey(CC_REPLY_TO)===k)
      s+='<div class="x-replybox x-replybox-sub">'+
         '<textarea id="ccReplyBox'+idAt+'" rows="2" maxlength="'+CC_POST_MAX+'" placeholder="'+
           esc(L().ccReplyPh)+' @'+hAt+'"></textarea>'+
         '<button class="ch-sign" onclick="careerReplyWrite(\''+idAt+'\')">'+esc(L().ccReplySend)+'</button></div>';
    return s;
  };
  return '<div class="x-co">'+rows.map(rowHTML).join('')+
    mine+orphans()+
    (left?'<div class="x-co-more">'+esc(L().ccCoMore(ccFollowers(left)))+'</div>':'')+
  '</div>';
}
/* Регион автора, если он не свой. Карточка автора несёт регион с записи
   (by.card.region — так ищется и портрет); свой регион и всё, что не регион,
   читается как «дома». */
function ccAwayRegionOf(card){
  const reg=card && card.region;
  if(!reg || reg===ccCareerRegion() || CC_REGIONS.indexOf(reg)<0) return null;
  return reg;
}
function ccRegChipHTML(card){
  const reg=ccAwayRegionOf(card);
  return reg ? '<i class="x-reg" title="'+esc(regionName(reg))+'">'+esc(ccRegShort(reg))+'</i>' : '';
}
/* Две кнопки под чужим постом — единственное место в ленте, где игрок отвечает
   не лайком. Стоят только под постом ссоры и только пока на него не ответили:
   отвеченный биф — это уже история, и предлагать выбрать заново нечего. */
/* ---- ПОДПИСКИ, УВЕДОМЛЕНИЯ И ЧТО МОЖНО СДЕЛАТЬ ПОД ПОСТОМ -----------------

   Правка: «уведомления добавил, чтоб видел скок лайков ему
   ставят или если игрок подписался на него ты можешь в ответ подписаться…
   подписки зависят от самого игрока он сам жмёт… если лфд или лфт человек, на
   твите будет кнопка написать в лс… или воуч написать, что игроку нужно дать
   шанс… чтоб в сошиал у игрока был выбор разный в комментариях».

   Пять вещей, и все — про одно: лента до сих пор была только для чтения. Здесь
   она становится местом, где можно ответить.

   Ничего не выдумывается заново: лайки берутся из ccPostStats (те же числа, что
   и под постом), подписчики — из охвата, который и есть аудитория карьеры, а
   личка и поиск дуо уже умеют всё, к чему ведут кнопки. */
function ccFollows(){ const cr=CAREER.career; return (cr.follows=cr.follows||[]); }
/* Кого показать из чужого региона: четверо из сорока сильнейших его ростера,
   без тех, на кого уже подписан, перетасованные неделей — чтобы список не стоял
   одной и той же четвёркой весь год. Форма записи — как у инбокса (careerDmPool):
   аватарка читает roster/cardRegion, чтобы взять портрет из папки региона. */
let CH_SUG_REG=null;
function careerSugRegion(r){ CH_SUG_REG=String(r||''); careerRenderHub('social'); }
function ccAwaySuggest(reg){
  let list=[];
  try{ list=(ccSceneRoster(reg)||[]).slice(0, 40); }catch(e){ list=[]; }
  list=list.filter(c=>c && c.handle && !ccFollowing(c.handle));
  let week=1; try{ week=careerWeekIndex(careerToday()); }catch(e){}
  const rnd=careerRng(ccHashStr('sug|'+reg+'|'+week));
  for(let i=list.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); const t=list[i]; list[i]=list[j]; list[j]=t; }
  return list.slice(0, 4).map(c=>({handle:c.handle, ovr:c._ovr, nat:c.nat,
    role:(attrsFor(c)||{}).roleKey, roster:true, cardRegion:reg}));
}
function ccFollowing(h){ return ccFollows().some(x=>hKey(x)===hKey(h)); }
function careerFollow(h){
  if(!h || ccFollowing(h)) return;
  ccFollows().push(String(h));
  careerSave(); careerRenderHub('social');
}
function careerUnfollow(h){
  const f=ccFollows(), at=f.findIndex(x=>hKey(x)===hKey(h));
  if(at<0) return;
  f.splice(at,1);
  careerSave(); careerRenderHub('social');
}
/* Уведомления. Хранятся как события, а не как готовые строки: текст собирается
   на показ, поэтому смена языка переписывает и их. Больше CC_NOTES_KEEP не
   копится — это лента уведомлений, а не журнал. */
const CC_NOTES_KEEP=40;
// Каждая тысяча охвата — это новый человек, который на тебя подписался.
const CC_NOTE_REACH_STEP=1000;
function careerNotes(){ const cr=CAREER.career; return (cr.notes=cr.notes||[]); }
function careerNoteAdd(kind, who, extra){
  const cr=CAREER.career, list=careerNotes();
  list.unshift(Object.assign({id:'t'+(cr.noteN=(cr.noteN||0)+1), kind:kind,
                              who:who||'', day:careerToday()}, extra||{}));
  if(list.length>CC_NOTES_KEEP) list.length=CC_NOTES_KEEP;
}
function careerNotesNew(){
  const seen=CAREER.career.noteSeen||0;
  return careerNotes().filter(t=>Number(String(t.id).slice(1))>seen).length;
}
/* Имя нарочно НЕ careerNotesSeen: так уже называется отметка ленты
   прочитанной (cr.newsSeen), и вторая функция с тем же именем молча
   переопределила бы первую — счётчик уведомлений тогда не гаснет вовсе.
   Поймано сторожем: «seen=undefined». */
function careerNoteMarkSeen(){
  const list=careerNotes();
  if(list.length) CAREER.career.noteSeen=Number(String(list[0].id).slice(1));
}
/* День приносит уведомления. Два повода, оба — из уже посчитанного:

   ЛАЙКИ. Свежий свой пост собирает их по ccPostStats — те же числа, что стоят
   под ним в ленте. Уведомление приходит один раз на пост, иначе один вечер
   писал бы их каждый день.

   ПОДПИСЧИКИ. Охват вырос через тысячу — значит на тебя подписался кто-то из
   сцены. Кто именно — берётся из комнаты, а не выдумывается, и на него можно
   подписаться в ответ. */
/* ---- Анонсы Epic и что сцена о них думает ---------------------------------

   У настоящих это самые громкие посты года: «wait but there's more :) FNCS
   SOLO. RELOAD. NOVEMBER. Details soon.» — 514 тысяч просмотров, и следом
   сотни ответов от игроков: «omggggg», «Plz dont be in the 4-9th november plz».

   У нас пресс-аккаунт писал только результаты. Теперь он объявляет и то, что
   будет: за две недели до крупного вечера — анонс с артом события, а двое из
   комнаты отвечают на него цитатой. Календарь мод знает наперёд, поэтому
   ничего не выдумывается: берётся ближайшее событие и его же арт. */
const CC_ANNOUNCE_DAYS=14;
/* РАСПИСАНИЕ ГОДА ОДНИМ ПОСТОМ — как у Epic. Отзыв: «анонсы капов пусть
   будут такие же, как у эпиков, они же там на год всё расписывают». Так и есть: у Epic
   в начале сезона выходит дорожная карта — все Мейджоры, Reload, Соло и ЛАНы с датами
   на весь год, а тизеры («wait but there's more :)») идут уже по ходу. Здесь то же:
   один раз на сезон пресс-аккаунт выкладывает весь календарь (собранный из CAREER_YEAR:
   событие — первый и последний день его блоков), а анонсы за две недели остались.
   Событие называется именем серии без стадии: «Мейджор 1», «Reload · кап 3», «Саммит»,
   у ЛАНов — с городом (ccYearLabel). Сцена отвечает цитатой, как под любым анонсом. */
function ccRoadmapLines(){
  const groups=new Map();
  const keyOf=id=>String(id).replace(/_(PlayIn|Heats|LCQ|Final|Upper|Lower|Qualifier|Q\dRound\d|FastTrack|LCQRound\d|LCQFinal)$/,'')
                          .replace(/(Opens|PlayIn|Heats|Final)$/,'');
  ccYearRows().forEach(row=>{
    const from=row[0], to=row[1], id=row[2], kind=row[3];
    const k=keyOf(id);
    const g=groups.get(k)||{from:from, to:to, id:id, kind:kind, n:0};
    if(from<g.from) g.from=from;
    if(to>g.to){ g.to=to; g.id=id; }
    g.n++;
    groups.set(k, g);
  });
  const name=g=>{
    let s=ccYearLabel(g.id, g.from, g.from);
    if(g.n>1){
      // Стадию с конца долой: «Reload · кап 1, финал» → «Reload · кап 1», «Мейджор 1 · финал» → «Мейджор 1».
      if(/,\s*[^,]+$/.test(s)) s=s.replace(/,\s*[^,]+$/,'');
      else if(/\s·\s[^·]+$/.test(s)) s=s.replace(/\s·\s[^·]+$/,'');
    }
    return s;
  };
  return [...groups.values()].sort((a,b)=>a.from<b.from?-1:1).map(g=>
    '• '+esc(name(g))+' — '+esc(ccDayLabel(g.from))+(g.to!==g.from ? ' – '+esc(ccDayLabel(g.to)) : ''));
}
/* РАСПИСАНИЯ ГОДА В ЛЕНТЕ БОЛЬШЕ НЕТ. Слово со скрином «FNCS 2026 — the year at a
   glance» и репостом «please not those exact dates»: «не надо подобные посты про даты». Пост
   не выходит, а тот, что уже лежит в старом сейве, вычищается вместе с ответами на него.
   Календарь года у игрока остаётся на вкладке календаря; анонс ближайшего Мейджора за две
   недели (careerAnnounceTick) остаётся — это одно событие, а не список дат. */
function careerRoadmapTick(){
  const cr=CAREER && CAREER.career; if(!cr) return false;
  const news=cr.news||[];
  // И продление стаффа (16.10, его слово «стафф когда продление не нужно писать в сошиал») — тем же путём из старых сейвов.
  const gone=new Set(news.filter(n=>n && (n.k==='ccNewsRoadmap' || n.k==='ccNewsStaffRenew')).map(n=>n.id));
  if(gone.size) cr.news=news.filter(n=>!(n && (gone.has(n.id) || (n.q && gone.has(n.q)))));
  return false;
}
// Двое из комнаты отвечают анонсу цитатой — так это выглядит в ленте.
function ccAnnounceReact(top){
  const pool=(typeof careerDmPool==='function') ? careerDmPool() : [];
  pool.slice(0, 2).forEach(function(w, i){
    if(!w || !w.handle || !top) return;
    careerNews('flat', i===0 ? 'ccPostHype' : 'ccPostDates', [ccHandle(w.handle)], {q:top.id});
  });
}
function careerAnnounceTick(){
  const cr=CAREER.career, days=careerYearDays();
  careerRoadmapTick();
  const at=ccAddDays(careerToday(), CC_ANNOUNCE_DAYS);
  /* Только по-настоящему крупное и НЕ ЧАЩЕ РАЗА В МЕСЯЦ.

     Первая версия звала анонсом каждый вечер Мейджора и каждую сессию Reload —
     сорок анонсов за год, то есть один в девять дней. Epic объявляет пять-шесть
     раз в год, и именно поэтому такой пост читается как событие. Ключ — месяц,
     а не дата: так один анонс закрывает всю серию. */
  const on=(days.get(at)||[]).filter(e=>e && (e.kind==='major'||e.kind==='gc'));
  if(!on.length) return;
  const ev=on[0], key='an|'+at.slice(0,7);
  cr.told=cr.told||{};
  if(cr.told[key]) return;
  cr.told[key]=1;
  careerNews('good', 'ccNewsAnnounce', [ev.label||'', ccDayLabel(at)],
             {art:(ev.kind==='gc'?'gc':ev.kind)});
  // И реакция сцены — цитатой, как это и выглядит в ленте.
  ccAnnounceReact((cr.news||[])[0]);
}
function careerNotesTick(){
  /* Карьеры может не быть вовсе: скриншот — красная плашка
     «Cannot read properties of null (reading 'career')» ровно на этой строке.
     Тик зовётся из careerAdvanceBody и из ленты, а обе дороги можно застать
     после выхода из карьеры (careerWipe оставляет CAREER=null, а перерисовка
     ещё идёт). Молчим — уведомлять некого. */
  const cr=CAREER && CAREER.career;
  if(!cr) return;
  (cr.news||[]).slice(0, 6).forEach(function(n){
    if(!n || !n.id || n.liked===undefined && false) return;
    if(n.noted) return;
    const who=ccPostAuthor(n);
    if(!who.you) return;
    const st=ccPostStats(n, who);
    if(!(st.likes>0)) return;
    n.noted=1;
    // Кто лайкнул — настоящий человек из комнаты, как в уведомлениях X
    // («ASP wheat and 11 others liked your post»). См. ccNoteWho.
    careerNoteAdd('like', ccNoteWho(n, 'l'), {post:n.id, n:st.likes});
    if(st.reposts>0) careerNoteAdd('repost', ccNoteWho(n, 'r'), {post:n.id, n:st.reposts});
  });
  /* И ответы под своими постами — их видно по счётчику, который лента и так
     рисует. Одно уведомление на пост, как и у лайков. */
  (cr.news||[]).slice(0, 6).forEach(function(n){
    if(!n || !n.id || n.notedRe) return;
    const who=ccPostAuthor(n);
    if(!who.you) return;
    const st=ccPostStats(n, who);
    if(!(st.replies>0)) return;
    n.notedRe=1;
    careerNoteAdd('reply', ccNoteWho(n, 'c'), {post:n.id, n:st.replies});
  });
  const step=Math.floor(careerReach()/CC_NOTE_REACH_STEP);
  const was=cr.noteReach||0;
  if(step>was){
    cr.noteReach=step;
    const pool=(typeof careerDmPool==='function') ? careerDmPool() : [];
    const pick=pool.filter(w=>w && w.handle && !ccFollowing(w.handle))
                   .sort((a,b)=>(b.ovr||0)-(a.ovr||0))[Math.min(2, Math.max(0, step%3))];
    if(pick) careerNoteAdd('follow', pick.handle, {});
  }
}
/* Что можно сделать прямо под постом.

   Свободному агенту — написать в личку и поручиться за него; своему посту —
   ответить тем, кто под ним написал. Обе кнопки ведут туда, где действие
   по-настоящему живёт: первая открывает диалог, вторая пишет твою строку. */
function careerPostDm(h){
  CH_SOCIAL='dms';
  careerDmWrite(h);
}
/* Воуч — публичное «дайте ему шанс». Стоит он не денег, а имени: сцена читает
   это как твою рекомендацию, и тот, за кого поручились, отвечает теплее (та же
   прибавка, что и у дружбы, — см. CAREER.dmBoost в careerFriendAsk). */
function careerVouch(h){
  const cr=CAREER.career;
  cr.vouch=cr.vouch||{};
  const k=hKey(h);
  if(cr.vouch[k]) return;
  cr.vouch[k]=careerToday();
  careerNews('good', 'ccPostVouch', [ccHandle(h)]);
  careerReachAdd(1);
  careerSave();
  careerRenderHub('social');
}
function ccVouched(h){ return !!((CAREER.career.vouch||{})[hKey(h)]); }
/* Ответ игрока только под чужим постом, под своим отвечать незачем. Как у настоящих (@ScrollSZN, Replies):
   одно-два слова, «V» это воуч, «Hbd goat», «I did». Ответы предлагаются там, где есть повод, и короткие.
   Ответ пишется в сам пост и показывается последней строкой комментариев. */
const CC_RE_BY_KIND=[
  // Ищет напарника — ему поручаются буквой «V» или желают удачи.
  [/^ccPostLfdWant|^ccPostTrioLF|^ccPostDuoSplitBy|^ccNewsLfd/, ['v','gl']],
  // День рождения — «hbd goat», как под настоящим.
  [/^ccPostBday|^ccNewsBday/, ['hbd']],
  // Взятый титул — «W» и аплодисменты.
  [/^ccNewsCongrats|^ccPostOrgWin|^ccNewsWinner|^ccPostWon|^ccPostPodium/, ['w','clap']]
];
function ccReplyOpts(n){
  const k=String((n&&n.k)||'');
  for(let i=0;i<CC_RE_BY_KIND.length;i++)
    if(CC_RE_BY_KIND[i][0].test(k)) return CC_RE_BY_KIND[i][1];
  return null;
}
function careerReply(id, re){
  const n=(CAREER.career.news||[]).find(x=>x.id===id);
  if(!n || n.re) return;
  const opts=ccReplyOpts(n);
  if(!opts || opts.indexOf(re)<0) return;
  n.re=re;
  /* «V» — это и есть воуч: та же запись и та же прибавка, только сказанная так,
     как её говорят на самом деле. Остальные ответы стоят строчку внимания и
     ничего больше: сцена их читает, но карьеру они не двигают. */
  if(re==='v'){
    const who=ccPostAuthor(n);
    if(who && who.handle) careerVouch(who.handle);
    return;                                   // careerVouch сам сохранит и перерисует
  }
  careerReachAdd(1);
  careerSave();
  careerRenderHub('social');
}
/* ---- Репост, цитата и свой ответ словами ----------------------------------

   Три действия, которых в ленте не было, а в настоящей они и есть лента.

   РЕПОСТ — своя запись без текста, которая показывает чужую. ЦИТАТА — она же,
   но со своей строкой сверху: так отвечают на анонсы («omggggg» под «FNCS SOLO.
   RELOAD. NOVEMBER»). ОТВЕТ — обычный комментарий под чужим постом, сколько
   угодно раз и любыми словами, а не пятью заготовками.

   Цитата пишется через тот же композер, что и свой пост: нажатие запоминает,
   что цитируется, и следующая отправленная строка уезжает с ссылкой. */
let CC_QUOTE=null;
function careerRepost(id){
  const src=(CAREER.career.news||[]).find(x=>x.id===id);
  if(!src || src.reposted) return;
  src.reposted=1;
  careerNews('flat', null, null, {q:id});
  careerReachAdd(1);
  careerSave();
  careerRenderHub('social');
}
function careerQuote(id){
  CC_QUOTE=id;
  CH_SOCIAL='feed';
  careerRenderHub('social');
  const box=document.getElementById('ccPostBox');
  if(box) box.focus();
}
function careerQuoteCancel(){ CC_QUOTE=null; careerRenderHub('social'); }
/* Ответ словами. Живёт в самой записи списком, потому что это ответы на неё;
   пятнадцать штук под одним постом — уже разговор, дальше не копится. */
const CC_REPLY_MAX=15;
function careerReplyWrite(id){
  const box=document.getElementById('ccReplyBox'+id);
  if(!box) return;
  const text=String(box.value||'').replace(/\s+/g,' ').trim().slice(0, CC_POST_MAX);
  if(!text) return;
  if(/^mate:/.test(String(id))){
    const cr=CAREER.career, k=hKey(careerCard()||{handle:''})+':'+Date.now().toString(36);
    cr.mateRe=(cr.mateRe||[]).concat([{id:String(id).slice(5), t:text, day:careerToday(), k:k}]).slice(-CC_MATE_RE_N);
    box.value='';
    careerSave(); ccMpSendCardSoon();
    careerRenderHub('social');
    return;
  }
  const n=(CAREER.career.news||[]).find(x=>x.id===id);
  if(!n) return;
  // Адресат — только если поле открыто именно ему под этим постом.
  const to=(CC_REPLY_TO && CC_REPLY_OPEN===id) ? String(CC_REPLY_TO) : null;
  n.res=(n.res||[]).concat([to ? {t:text, day:careerToday(), to:to} : {t:text, day:careerToday()}]);
  if(n.res.length>CC_REPLY_MAX) n.res.length=CC_REPLY_MAX;
  if(to){ CC_REPLY_OPEN=null; CC_REPLY_TO=null; }
  careerSave(); ccMpSendCardSoon();
  careerRenderHub('social');
}
let CC_REPLY_OPEN=null, CC_REPLY_TO=null;
function careerReplyOpen(id){ CC_REPLY_OPEN=(CC_REPLY_OPEN===id?null:id); CC_REPLY_TO=null; careerRenderHub('social'); }
/* Ответить человеку под СВОИМ постом. Игрок: «I think
   u should add more things like we could reply to the people in our own tweet».
   Правило («зачем под свой твит чет писать») остаётся про пост
   целиком — под своим постом нет общего поля; есть «Ответить» у каждой строки,
   и это ответ человеку, а не себе. Поле встаёт под его строкой, запись уходит
   с адресатом (см. careerReplyWrite и ветка в ccPostComments). */
function careerReplyTo(id, h){
  if(!id || !h) return;
  if(CC_REPLY_OPEN===id && CC_REPLY_TO && hKey(CC_REPLY_TO)===hKey(h)){ CC_REPLY_OPEN=null; CC_REPLY_TO=null; }
  else { CC_REPLY_OPEN=id; CC_REPLY_TO=String(h); }
  careerRenderHub('social');
  const box=document.getElementById('ccReplyBox'+id);
  if(box) box.focus();
}
function ccPostActsHTML(n, who, st){
  if(who.you){
    // Под своим постом отвечать некому, но свои ответы под ним видны.
    return '';
  }
  const bits=[];
  const id=esc(n.id||'');
  bits.push(`<button class="x-act" onclick="careerReplyOpen(\'${id}\')">${L().ccReplyBtn}</button>`);
  bits.push(n.reposted
    ? `<span class="x-act-done">${L().ccRepostDone}</span>`
    : `<button class="x-act" onclick="careerRepost(\'${id}\')">${L().ccRepostBtn}</button>`);
  bits.push(`<button class="x-act" onclick="careerQuote(\'${id}\')">${L().ccQuoteBtn}</button>`);
  // Под постом набора в кастомку — «попроситься», пока не попросился.
  if(n.k==='ccPostCustomsOpen') bits.push(n.asked
    ? `<span class="x-act-done">${L().ccAskDone}</span>`
    : `<button class="x-act" onclick="careerCustomAsk(\'${id}\')">${L().ccAskBtn}</button>`);
  /* Свободный агент — тот, у кого открыта анкета: ему и пишут. Кнопка стоит
     под его же объявлением, где решение и принимается. */
  if(who.handle && typeof ccAdOf==='function' && ccAdOf(who.handle))
    bits.push(`<button class="x-act" onclick="careerPostDm('${
      jsq(who.handle)}')">${L().ccPostDmBtn}</button>`);
  // И короткий ответ, если под этим постом есть что сказать. См. careerReply.
  const opts=ccReplyOpts(n);
  if(opts){
    if(n.re) bits.push(`<span class="x-act-done">${L().ccReDone(L()['ccRe'+n.re])}</span>`);
    else opts.forEach(a=>bits.push(`<button class="x-act x-act-re" onclick="careerReply('${
      esc(n.id||'')}','${a}')"${a==='v'?` title="${esc(L().ccPostVouchWhat)}"`:''}>${
      L()['ccRe'+a]}</button>`));
  }
  // Поле ответа открывается по кнопке и стоит прямо под ней.
  const box=(CC_REPLY_OPEN===n.id)
    ? `<div class="x-replybox">
        <textarea id="ccReplyBox${esc(n.id||'')}" rows="2" maxlength="${CC_POST_MAX}"
          placeholder="${esc(L().ccReplyPh)}"></textarea>
        <button class="ch-sign" onclick="careerReplyWrite('${esc(n.id||'')}')">${L().ccReplySend}</button>
      </div>`
    : '';
  return bits.length ? `<div class="x-acts2">${bits.join('')}</div>`+box : box;
}
function ccBeefActsHTML(n){
  if(!n || !n.beef) return '';
  if(n.beefDone) return `<div class="x-beef-done">${
    n.beefDone==='hit' ? L().ccBeefDoneHit : L().ccBeefDoneQuiet}</div>`;
  return `<div class="x-beef">
    <button class="x-beef-hit" onclick="careerBeefAnswer('${esc(n.id||'')}','hit')">${
      L().ccBeefBtnHit}</button>
    <button class="x-beef-quiet" onclick="careerBeefAnswer('${esc(n.id||'')}','quiet')">${
      L().ccBeefBtnQuiet}</button></div>`;
}
function ccPostHTML(n){
  const stamp=ccStamp(n);
  const who=ccPostAuthor(n);
  const st=ccPostStats(n, who);
  return `<article class="x-post x-post-${n.kind}">`+
      `${ccAvatar(who)}`+
      `<div class="x-post-in">`+
        // По нику можно нажать и попасть в его профиль — так ходят по X.
        `<header>${who.you
          ? `<b>${esc(who.name)}</b>`
          : `<b class="x-who-link" onclick="careerWho('${jsq(who.name)}')">${
              esc(who.name)}</b>`}${who.verified?'<i class="x-tick">✓</i>':''}`+
        // Статус — на самом человеке, как в настоящей ленте: «F/A», «LFT» или
        // клуб. См. ccWhoStatus.
        `${who.you?'':ccWhoChipHTML(who.handle)}`+
        // Из другого региона — с его кодом рядом с ником. См. careerRegionsWeek.
        `${who.you?'':ccRegChipHTML(who.card)}`+
        `<span>@${esc(who.handle)}</span><span class="x-dot">·</span><span>${stamp}</span></header>`+
        `<p>${ccFlagImgs(ccMentions(ccText(n)))}</p>`+
        ccShotHTML(n.tbl)+ccLeadHTML(n.lead)+
        ccDropMapHTML(n)+
        ccArtHTML(n)+
        ccQuoteHTML(n)+
        ccCardShotHTML(n.card)+
        ccPollHTML(n)+
        (n.sp ? `<div class="x-sp"><img src="${PHOTO_DIR}sp_${esc(CC_SPONSOR_LOGO[n.sp]||n.sp)}.png" alt="" onerror="this.remove()"><span>${esc(L()["ccSponsor"+n.sp]||n.sp)}</span></div>` : "")+
        `<div class="x-acts"><span>${CC_X_REPLY}<b>${ccFollowers(st.replies)}</b></span>`+
        `<span>${CC_X_REPOST}<b>${ccFollowers(st.reposts)}</b></span>`+
        `<button class="x-like${n.liked?' on':''}" onclick="careerPostLike('${n.id||''}')"`+
        ` title="${esc(L().xLike)}" aria-pressed="${n.liked?'true':'false'}">`+
        `${CC_X_LIKE}<b>${ccFollowers(st.likes+(n.liked?1:0))}</b></button>`+
        `<span>${CC_X_VIEWS}<b>${ccFollowers(st.views)}</b></span></div>`+
        ccBeefActsHTML(n)+
        ccPostActsHTML(n, who, st)+
        ccPostComments(n, who, st)+
      `</div></article>`;
}
/* ---- Свой пост -------------------------------------------------------------
 *
 * Просьба: писать в ленту самому. Всё остальное в ней написано
 * режимом — под твоим ником, но твоими словами о твоём вечере, — и одной
 * строки, которую действительно написал игрок, там не было.
 *
 * Двести сорок знаков, потому что это одна мысль, а лента карьеры держит
 * последние CAREER_NEWS_KEEP записей и своя строка вытесняет чужие наравне со
 * всеми. Текст ложится в запись как есть — careerNews умеет запись без ключа, —
 * и ccText отдаёт его экранированным: единственный текст в этой ленте, который
 * пришёл не из словаря.
 */
const CC_POST_MAX=240;
function ccPostLeft(){
  const box=document.getElementById('ccPostBox'), left=document.getElementById('ccPostLeft');
  if(!box || !left) return;
  left.textContent=String(CC_POST_MAX-(box.value||'').length);
}
/* ЧТО НАПИСАТЬ (16.10, Notion 15.10 скрин 13: «варианты ответов что написать, смотря что происходит в карьере»). Под полем
   поста — до четырёх готовых строк из того, что с карьерой сейчас: свежий результат, новый напарник или его нет, турнир
   завтра, форма, новый сезон, обещание с пресс-конференции. Клик ставит строку в поле — её можно поправить. Языки, где
   строк нет, берут английский: в X сцена пишет так. */
const CC_IDEAS={
  ru:{win:m=>['W'+(m?' @'+m:'')+' 🐐','взяли 🏆 спасибо всем кто болел','1st. едем дальше'],
      pod:(m,p)=>['#'+p+'. близко, следующий наш','топ-'+p+(m?' с @'+m:'')+' 🔥'],
      bad:p=>['не наш день. разберём и вернёмся','#'+p+'. тяжело. go next'],
      mid:p=>['#'+p+' — нормально, но можем лучше','средний вечер, завтра лучше'],
      mate:m=>['играю с @'+m+' 🤝','новый сезон, новое дуо — @'+m+' 🔥'],
      lfd:d=>['LFD. дивизион '+d+'+, пишите в лс','ищу дуо на сезон 🙏 лс открыты'],
      next:e=>['завтра: '+e+'. let’s go','завтра турнир 🎯 фокус'],
      hot:['форма есть 📈','лучшая неделя за сезон'], cold:['тяжёлая неделя. обратно на скримы','не сдаёмся. гринд'],
      meta:s=>['новый сезон '+s+' — мнения по пулу?',''+s+': ищем новую точку 👀'],
      promise:g=>['цель — '+g+'. посмотрите','сказал '+g+' — значит '+g],
      code:c=>['код '+c+' в магазине предметов 💙 #ad','поддержите кодом '+c+' в Item Shop, это правда помогает 🙏 #ad','новый скин в магазине? вводите '+c+' #ad']},
  en:{win:m=>['W'+(m?' @'+m:'')+' 🐐','we won 🏆 thanks for the support','1st. on to the next'],
      pod:(m,p)=>['#'+p+'. so close, next one is ours','top '+p+(m?' with @'+m:'')+' 🔥'],
      bad:p=>['not our day. we review and come back','#'+p+'. rough one. go next'],
      mid:p=>['#'+p+' — fine, but we can do better','mid night, tomorrow better'],
      mate:m=>['playing with @'+m+' 🤝','new season, new duo — @'+m+' 🔥'],
      lfd:d=>['LFD. div '+d+'+, dms open','looking for a duo this season 🙏 dms open'],
      next:e=>['tomorrow: '+e+'. let’s go','tournament tomorrow 🎯 locking in'],
      hot:['in form rn 📈','best week of the season'], cold:['rough week. back to scrims','we don’t stop. grind'],
      meta:s=>['new season '+s+' — thoughts on the pool?',s+': looking for a new spot 👀'],
      promise:g=>['goal is '+g+'. watch','said '+g+', meant '+g],
      code:c=>['use code '+c+' in the Item Shop 💙 #ad','support with code '+c+' in the Item Shop, it really helps 🙏 #ad','new skin in the shop? type '+c+' #ad']}};
function ccPostIdeas(){
  const T=CC_IDEAS[typeof LANG!=='undefined' ? LANG : 'en'] || CC_IDEAS.en, cr=CAREER.career, out=[];
  const rnd=careerRng(ccHashStr('ideas|'+careerToday()));
  const one=a=>a && a.length ? a[Math.floor(rnd()*a.length)] : null;
  const mate=careerMateRec(), mh=mate && mate.card ? mate.card.handle : '';
  // Свежий свой результат — из журнала карьеры (cr.log), последние три дня: место и размер комнаты.
  const last=(cr.log||[]).slice().reverse().find(x=>x && x.day && x.place>0 && ccDaysBetween(x.day, careerToday())<=3);
  if(last){
    const p=last.place, of=Math.max(2, last.of||50), beat=1-(p-1)/(of-1);
    if(p===1) out.push(one(T.win(mh)));
    else if(p<=3 || beat>=0.9) out.push(one(T.pod(mh, p)));
    else if(beat<=0.3) out.push(one(T.bad(p)));
    else out.push(one(T.mid(p)));
  }
  if(mh && mate.since && ccDaysBetween(mate.since, careerToday())<=7) out.push(one(T.mate(mh)));
  if(!mh && !(typeof ccMpOn==='function' && ccMpOn())) out.push(one(T.lfd(cr.division||1)));
  try{ const nx=ccHdrNext(); if(nx && nx.n===1 && nx.ev && nx.ev.label) out.push(one(T.next(nx.ev.label))); }catch(e){}
  const f=careerForm();
  if(f>=1.5) out.push(one(T.hot)); else if(f<=-1.5) out.push(one(T.cold));
  try{ if(ccMetaOpen()) out.push(one(T.meta(ccSeasonTag(careerToday()).short||''))); }catch(e){}
  if(cr.pressPromise){ const g=(ccPressT().goalName||{})[cr.pressPromise.goal]||cr.pressPromise.goal; out.push(one(T.promise(g))); }
  // Свой код — первой идеей, пока промо этого месяца не набрано и сегодня его ещё не было.
  try{ const code=ccSacOwnCode(), p=code && ((CAREER.sacOwn.promo||{})[ccMonthKey()]||{n:0, days:[]});
    if(code && ccSacOwnOn() && p.n<CC_SAC_PROMO_MAX && p.days.indexOf(careerToday())<0 && T.code) out.unshift(one(T.code(code))); }catch(e){}
  return out.filter(Boolean).slice(0, 4);
}
function ccPostIdeasHTML(){
  let ideas=[]; try{ ideas=ccPostIdeas(); }catch(e){ return ''; }
  if(!ideas.length) return '';
  return '<div class="x-ideas">'+ideas.map(t=>'<button type="button" class="x-idea" data-t="'+esc(t)+'" onclick="ccPostIdea(this)">'+esc(t)+'</button>').join('')+'</div>';
}
function ccPostIdea(b){
  const box=document.getElementById('ccPostBox'); if(!box || !b) return;
  box.value=String(b.dataset.t||'').slice(0, CC_POST_MAX); box.focus(); ccPostLeft();
}
function careerPostWrite(){
  const box=document.getElementById('ccPostBox');
  if(!box) return;
  const text=String(box.value||'').replace(/\s+/g,' ').trim().slice(0, CC_POST_MAX);
  if(!text) return;
  box.value='';
  // Если строка пишется как цитата — к ней едет ссылка на цитируемый пост.
  careerNews('flat', null, null, {text:text, q:CC_QUOTE||undefined});
  CC_QUOTE=null;
  try{ if(ccSacPromoPost(text)) careerNews('good', 'ccNewsSacPromo', [ccSacOwnCode(), Math.round(CC_SAC_PROMO*100*ccSacPromoOf(ccMonthKey()))]); }catch(e){}
  careerSave(); ccMpSendCardSoon();   // напарник видит пост сразу, а не после вечера
  careerRenderHub(CH_TAB);
}
// A reader's one contribution to a post. It is stored, so the heart survives a
// redraw and a reload, and it is the only thing on this screen the player can do
// to somebody else's post.
function careerPostLike(id){
  const e=(CAREER.career.news||[]).find(n=>n.id===id);
  if(!e) return;
  e.liked=!e.liked;
  careerSave();
  careerRenderHub(CH_TAB);
}

/* ---- Unread on the main screen ----
   The inbox and the Division 1 feed both sat behind the socials tab, the feed with no dot at all. So the hub lists
   what's unread, who from, one press to open it.
   Messages keep their own unread flag (read when opened); the feed has one mark, cleared by opening socials. Only
   other people's posts count, never your own. */
function ccNewsNum(id){ const n=Number(String(id||'').slice(1)); return n>0?n:0; }
function careerNewsNew(){
  // Та же дорога, что у ccPressWorthy: без карьеры непрочитанного нет.
  const cr=CAREER && CAREER.career;
  if(!cr) return [];
  const seen=cr.newsSeen||0;
  return (cr.news||[]).filter(e=>ccNewsNum(e.id)>seen && !ccPostAuthor(e).you);
}
function careerNotesN(){ return careerDmUnread()+careerNewsNew().length; }
function careerNotesSeen(){
  const cr=CAREER.career;
  cr.newsSeen=cr.newsN||0;
  careerSave();
}
// A save that predates the mark starts level rather than announcing forty posts
// it has already scrolled past.
function careerNotesMigrate(){
  const cr=CAREER && CAREER.career;
  if(cr && cr.newsSeen==null) cr.newsSeen=cr.newsN||0;
}
function careerOpenNote(id){
  const t=careerDms().find(x=>x.id===id);
  if(t) t.unread=false;
  // Pressing a notification opens that conversation, so the inbox it lands in
  // has to be one the conversation is in: whichever tab was left open, this
  // goes to all of them.
  CH_DMKIND=null;
  CH_DM=id; CH_SOCIAL='dms';
  careerSave();
  careerTab('social');
}
function careerOpenFeed(){
  CH_SOCIAL='feed';
  careerTab('social');
}
const CC_NOTES_ROWS=6;
function careerNotesHTML(){
  const dms=careerDms().filter(t=>t.unread);
  const posts=careerNewsNew();
  const total=dms.length+posts.length;
  if(!total) return '';
  const kindKey=t=>t.who.org ? 'club' : t.who.hater ? 'hater' : t.who.fan ? 'fan' : 'duo';
  // An agent is filed with the clubs, because that is the business pile — but he
  // is not one, and this strip was calling him ORGANISATION over a line that
  // reads "I represent players, I take ten per cent". The inbox row and the
  // thread header already say Agent; this is the third place that names him.
  const kindOf=t=>(t.who.agent || t.who.viaAgent) ? L().ccAgentTag
                : t.who.org ? (t.offer ? L().ccOffers : L().ccOrg)
                : t.who.hater ? L().dmSechaters
                : t.who.fan ? L().dmSecfans : L().dmSecduos;
  /* One of each before three of any.

     It took the first three unread threads, which is fine until a night that
     produces four different kinds of message - a club with an offer on it, a
     duo answering, a viewer, and somebody being unpleasant. Three of them
     showed and the contract could be the one that did not, because it happened
     to arrive last. A notification list that can hide the only item with a
     decision on it is not doing the job.

     So the first pass takes one thread per kind, in the order they matter -
     a club with terms on the table, then somebody who wants to play, then the
     room - and the rest fill whatever is left. */
  const CC_NOTE_ORDER=['club','duo','hater','fan'];
  const seen={}, picked=[];
  CC_NOTE_ORDER.forEach(k=>{
    const first=dms.find(t=>kindKey(t)===k);
    if(first){ picked.push(first); seen[first.id]=true; }
  });
  dms.forEach(t=>{ if(!seen[t.id] && picked.length<CC_NOTES_ROWS) picked.push(t); });
  const rows=[];
  // Messages first: a person waiting on an answer outranks a result somebody
  // else posted.
  picked.slice(0, CC_NOTES_ROWS-1).forEach(t=>{
    const last=t.msgs[t.msgs.length-1];
    rows.push(`<button class="cc-note cc-note-dm cc-note-${kindKey(t)}" onclick="careerOpenNote(\'${t.id}\')">
      <i>${kindOf(t)}</i><b>${esc(ccDmName(t.who))}</b>
      <span>${esc(last?ccText(last):'')}</span></button>`);
  });
  posts.slice(0, CC_NOTES_ROWS-rows.length).forEach(e=>{
    const who=ccPostAuthor(e);
    rows.push(`<button class="cc-note" onclick="careerOpenFeed()">
      <i>${who.verified?L().ccNoteScene:L().ccNoteFeed}</i><b>${esc(who.name)}</b>
      <span>${esc(ccText(e))}</span></button>`);
  });
  const more=total-rows.length;
  return `<div class="ch-tile cc-notes">
    <h4>${L().ccNotes}<i class="cc-note-n">${total}</i></h4>
    ${rows.join('')}
    <button class="ch-swap" onclick="careerOpenFeed()">${
      more>0 ? L().ccNotesMore(more) : L().ccNotesOpen}</button>
  </div>`;
}
/* The same thing as a row of icons, which is his reference of 18 August: a mail
   glyph, a speech bubble, a badge, each with the count of what is waiting on it.

   The list version above says who wrote and what they said, which is a lot of
   the screen for something that is read in half a second — "is anything waiting
   for me". This says exactly that and nothing else, and a press goes straight
   to the pile it counted rather than to the top of the inbox.

   Four piles, in the order they cost you something: a club with terms on the
   table, somebody who wants the seat, the room, and whoever is being unpleasant.
   A pile with nothing in it is drawn flat rather than hidden, so the row does
   not move about as the week goes on. */
const CC_NOTE_ICONS={
  clubs:'<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-11Zm2.2.5 6.8 5 6.8-5H5.2Z"/></svg>',
  duos: '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-5 4V5a1 1 0 0 1 1-1Z"/></svg>',
  fans: '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="m12 3 2.6 5.6 6.1.8-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.4l6.1-.8L12 3Z"/></svg>',
  haters:'<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M12 2 1.5 20.5h21L12 2Zm0 6.5 1 6h-2l1-6Zm0 8.2a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6Z"/></svg>'
};
function careerNoteBarHTML(){
  const dms=careerDms().filter(t=>t.unread);
  const pile=t=>(t.who.org || t.who.staff) ? 'clubs' : t.who.hater ? 'haters' : t.who.fan ? 'fans' : 'duos';
  const n={clubs:0, duos:0, fans:0, haters:0};
  dms.forEach(t=>{ n[pile(t)]++; });
  const posts=careerNewsNew().length;
  const btn=k=>`<button class="cc-nb cc-nb-${k}${n[k]?' on':''}" onclick="careerOpenPile(\'${k}\')"
      title="${esc(L()['dmSec'+k])}" aria-label="${esc(L()['dmSec'+k])}">
      ${CC_NOTE_ICONS[k]}${n[k]?`<i>${n[k]>99?'99+':n[k]}</i>`:''}</button>`;
  return `<div class="cc-notebar">
    ${['clubs','duos','fans','haters'].map(btn).join('')}
    <button class="cc-nb cc-nb-feed${posts?' on':''}" onclick="careerOpenFeed()"
      title="${esc(L().ccNews)}" aria-label="${esc(L().ccNews)}">
      <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M4 4h13a1 1 0 0 1 1 1v13a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2V4Zm2 3v3h9V7H6Zm0 5v2h9v-2H6Zm0 4v2h6v-2H6Z"/></svg>
      ${posts?`<i>${posts>99?'99+':posts}</i>`:''}</button>
    ${(dms.length || posts) ? `<button class="cc-nb cc-nb-clear" onclick="ccBellClearAll(event)" title="${esc(L().ccBellClear)}" aria-label="${esc(L().ccBellClear)}">✓</button>` : ''}
  </div>`;
}
/* Колокольчик в шапке: сумма всего непрочитанного, по нажатию — те же пять кнопок
   (клубы, напарники, фанаты, хейтеры, лента) выпадающим списком с подписями. */
let CC_BELL_OPEN=false;
function ccBellHTML(){
  const dms=careerDms().filter(t=>t.unread).length, posts=careerNewsNew().length, n=dms+posts;
  return '<button class="ch-bell'+(n?' on':'')+'" onclick="ccBellToggle(event)" aria-label="'+esc(L().lfInbox)+'" title="'+esc(L().lfInbox)+'">'+
    '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>'+
    (n ? '<i>'+(n>99?'99+':n)+'</i>' : '')+'</button>'+
    (CC_BELL_OPEN ? '<div class="ch-bell-pop">'+careerNoteBarHTML()+
      (n ? '<button class="ch-bell-clear" onclick="ccBellClearAll(event)">'+esc(L().ccBellClear)+'</button>' : '')+'</div>' : '');
}
/* «Прочитать всё» (его правка 29.09: «нет кнопки, чтоб все уведомления убрать»): все личные
   сообщения — прочитаны, лента — просмотрена. Сами сообщения и посты остаются на месте. */
function ccBellClearAll(e){
  if(e) e.stopPropagation();
  careerDms().forEach(t=>{ t.unread=false; });
  careerNotesSeen();
  CC_BELL_OPEN=false;
  const el=document.getElementById('chBell'); if(el) el.innerHTML=ccBellHTML();
  if(typeof careerRenderHub==='function') careerRenderHub(CH_TAB||'centre');
}
function ccBellToggle(e){
  if(e) e.stopPropagation();
  CC_BELL_OPEN=!CC_BELL_OPEN;
  const el=document.getElementById('chBell'); if(el) el.innerHTML=ccBellHTML();
}
document.addEventListener('click', function(e){
  if(!CC_BELL_OPEN) return;
  const el=document.getElementById('chBell');
  if(el && el.contains(e.target)) return;
  CC_BELL_OPEN=false; if(el) el.innerHTML=ccBellHTML();
});
// A press on one of them opens the socials already filtered to that pile,
// rather than at the top of everything.
function careerOpenPile(kind){
  CC_BELL_OPEN=false;
  CH_DMKIND=kind; CH_SOCIAL='dms';
  careerRenderHub('social');
}

/* Career DMs: duos are found by writing to each other, not on a transfer market.
   Every line is built from something on screen (the result that prompted it, the other player's
   division); no small-talk bank. Acceptance: within 3 rating points says yes, clearly above says no,
   a good result adds a couple of points of persuasion. */
const CAREER_DM_REACH=3, CAREER_DM_KEEP=14;

/* Reputation: whether anybody wants to play next to you, separate from rating. Built from what already happens:
   blaming a partner in public (big), dropping a partner (smaller, leaving is normal), a partner walking out on you
   (costs more than leaving them, the room heard about it).
   Read in one place only, careerDmWouldAccept: 3 rep = 1 rating point, so +10 asks like +1.5 and -20 needs to be
   seven points better. Clubs ignore it and sign on results. */
const CC_REP_MAX=25, CC_REP_PER_OVR=3;
// Что стоит титул, когда ты зовёшь человека к себе. См. careerDmMargin.
const CC_DM_CROWN_WIN=6, CC_DM_CROWN_POD=3, CC_DM_CROWN_TOP=1;
function careerRep(){ return clamp((CAREER.career.rep||0), -CC_REP_MAX, CC_REP_MAX); }
function careerRepAdd(n){
  const cr=CAREER.career;
  const was=careerRep();
  cr.rep=clamp((cr.rep||0)+n, -CC_REP_MAX, CC_REP_MAX);
  return careerRep()-was;
}
// Which word the hub puts on it. Four bands, because a number nobody can read
// is not a reputation.
function careerRepKey(){
  const r=careerRep();
  return r>=10 ? 'ccRepLoved' : r>=3 ? 'ccRepLiked'
       : r<=-10 ? 'ccRepToxic' : r<=-3 ? 'ccRepAwkward' : 'ccRepUnknown';
}
function careerDms(){ return (CAREER.dms=CAREER.dms||[]); }
function careerDmUnread(){ return careerDms().filter(t=>t.unread).length; }

// Who is around this week: real cards off the roster, matched on your rating,
// from whatever division they stand in.
//
// The pool is the same six people every time it is asked, all week. It used to
// exclude anyone you had already written to and then top itself back up to
// eight, which meant a new stranger appeared for every message sent and the list
// never ran out — you could sit there writing to an endless queue of people. A
// week has a finite number of people in it. Writing to one takes them off the
// list until the week turns over.
const CAREER_DM_POOL=6;
/* The week's list on a rung the roster does not reach into.

   Six of them, spread around the player's own rating on the same curve a cup
   field is banded on, so the list reads like the division it is in: mostly
   people at your level, one or two better, one or two worse. They carry the
   card they were generated as, because accepting one has to hand the duo seat
   something to play with - careerDmAccept stores `card` for anybody who is not
   off the roster.

   No club and no wage: a generated player on a rung where nothing pays has
   neither, and quoting one would be inventing a contract for somebody who does
   not exist. */
/* The spread is built rather than rolled, because both doors have to exist.

   A week's list is only a decision if it holds people who will say no. Rolled on
   the cup's own band the six came out inside three points of each other, every
   one of them a yes, and the inbox lost the thing it is for: somebody better
   than you writing first, which is the one way up that does not depend on you
   being good enough to ask. CAREER_DM_REACH is 3, so two of the six sit above
   it, two sit around you and two sit under. */
/* Real birthdays from ProSettings, kept only where the country matches the card's nationality (a handle isn't a
   person: their Chap is US, ours is Swiss). Mismatches dropped, hence 13 names. tools/fetch-player-dob.js extends
   it.
   Stored as birthday, not age, since a career walks the year. Display only: the age curve applies just to the
   player's own chosen age. */
const CC_BORN={
  sky:'2009-05-23', scroll:'2009-07-28', th0mashd:'2002-05-30',
  cr1nge:'2009-01-12', flickzy:'2006-05-09', kami:'2005-01-28',
  malibuca:'2005-10-14', tjino:'2007-09-27', pablowingu:'2007-10-04',
  charyy:'2007-11-11', nebs:'2004-07-28', nxthan:'2005-08-09',
  t3eny:'2008-09-11', shxrk:'2011-06-14', swizzy:'2006-04-17',
  pixie:'2007-08-10', rax:'2011-02-24', darm:'2008-12-04',
  demus:'2008-10-01', ghonzo:'2009-10-11', pixx:'2008-04-19',
  volko:'2006-01-22', idrop:'2004-10-27', repairs:'2006-08-16',
  twi:'2009-05-06', jannisz:'2005-04-23', vic0:'2007-05-22',
  shur4:'2006-10-12', kurama:'2007-08-03', wox:'2006-08-27',
  prax:'2007-07-05', tidi:'2008-02-04', hris:'2009-02-05',
  sxdia:'2007-04-03', faki:'2004-10-22', curve:'2010-12-23',
  trippernn:'2004-01-03', vexi:'2007-02-13', artskill:'2006-05-24',
  werex:'2007-01-11', podasai:'2005-07-29', seyyto:'2007-06-30',
  f1n4ik:'2009-08-18', lixium:'2006-07-13', rad3on:'2005-10-04',
  trulex:'2002-09-24', hijoe:'2006-01-04', kyry:'2006-04-02',
  // Quoted: a key that starts with a digit is not an identifier.
  '1lusha':'2004-07-22',
  czb:'2004-11-30', nomzz:'2009-02-02', kikoo:'2006-09-21',
  marco:'2006-12-01', arc:'2003-03-19', ardi:'2004-03-04',
  asa:'2006-03-26', momsy:'2007-03-29', akiira:'2008-05-30',
  mrsavage:'2004-11-12', japko:'2006-09-16', bevvys:'2005-12-26',
  waiz:'2004-02-25', mikson:'2006-04-30', p1ng:'2004-08-25',
  mariuscow:'2006-11-14', noahreyli:'2005-06-30', kiro:'2005-05-08',
  vanyak3kk:'2005-03-02', merstach:'2007-03-27', juu:'2006-07-22',
  vadeal:'2005-01-11', setty:'2003-09-08', skvii:'2003-11-17',
  ricbor:'2006-11-29', kombek:'2006-08-17', toose:'2002-07-29',
  queasy:'2002-04-17', minori:'2011-03-01', jarko:'2007-07-07',
  /* Семьдесят девять дат с Liquipedia, 22 августа — дивизион 1 Европы.
     Сверены по стране так же, как портреты выше; тёзки отсеяны.

     Fnajen, Moneymaker и Zenox найдены и подтверждены, но сюда не попали:
     ключ этой таблицы — голый ник без региона, а этих троих в файле носят
     по два человека из разных регионов. Их дата ушла бы чужому. */
  adrixx:'2007-06-03', akiira:'2008-05-30', ardi:'2004-03-04',
  art1st:'2005-07-12', artskill:'2006-05-24', asa:'2006-03-27',
  auvahalo:'2006-12-01', axeforce:'2006-05-18', birk:'2009-05-06',
  blacha:'2005-03-31', cheapz:'2002-03-18', cheetiin:'2004-10-22',
  clement:'2003-02-17', cxshy:'2007-10-16', deckzee:'2006-05-22',
  eclipse:'2007-04-16', f1n4ik:'2009-08-18', f1shyx:'2008-07-20',
  faded:'2006-06-21', fant:'2007-03-25', fastroki:'2006-04-17',
  firen:'2009-02-02', fito:'2009-08-29', floki:'2002-12-17',
  franek:'2009-07-14', g13ras:'2005-11-20', ghonzo:'2009-10-11',
  hellfire:'2004-09-26', hijoe:'2006-01-04', hlechis:'2006-03-21',
  huty:'2005-11-17', jannisz:'2005-04-23', jarko:'2007-07-07',
  jurdy:'2003-12-29', kiro:'2005-05-08', kizers:'2008-09-19',
  kovaaksxd:'2006-01-26', kulb:'2005-11-16', kyry:'2006-04-04',
  kyto:'2008-05-29', lu984:'2005-10-11', maciak:'2008-10-23',
  marco:'2006-11-30', mikson:'2006-04-30', nebs:'2004-07-28',
  nxthan:'2005-08-09', peshka:'2008-05-17', pinq:'2004-07-18',
  pixovsky:'2008-02-06', podasai:'2005-07-29', prism:'2007-05-08',
  purchawa:'2006-04-04', rax:'2011-02-24', repairs:'2006-08-16',
  ricbor:'2006-11-29', ricky:'2006-07-30', robban:'2006-09-17',
  robin:'2009-04-18', sangild:'2006-07-17', seren:'2004-02-11',
  seyyto:'2007-06-30', shaykoz:'2004-01-02', shur4:'2006-10-12',
  shxrk:'2011-06-14', skvii:'2003-11-16', spexx:'2007-06-06',
  srapt:'2006-10-09', sxdia:'2007-04-03', tarpz:'2007-06-09',
  trexer:'2005-02-03', triix:'2008-05-26', turtle:'2006-11-04',
  twek:'2009-12-11', upl:'2008-06-27', vexi:'2007-02-13',
  wheat:'2004-11-24', wolvax:'2008-12-15', zarbeh:'2007-03-10',
  zayni:'2008-12-08',
  /* Ключ с регионом — для тех, чей ник носят двое.

     Эти трое подтверждены по стране так же, как остальные, но Fnajen и
     Moneymaker живут и в Европе, и в Северной Америке, а Zenox — в Европе и
     на Ближнем Востоке. Голым ключом их дата ушла бы обоим. */
  'EU|fnajen':'2004-10-11', 'EU|moneymaker':'2009-01-03',
  'EU|zenox':'2009-06-30'
};
