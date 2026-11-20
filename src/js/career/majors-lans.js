/*@@PART js/career/majors-lans.js@@*/
/* НАБИТАЯ РУКА: «after you troll for so many games you get high kill wins» (тот же отзыв, вторая
   половина). Каждая игра в «кейить» — в cr.keyGames; за CC_KEY_MASTER_GAMES игр лут с килла растёт
   с CC_KEY_LOOT до CC_KEY_LOOT_MASTER. Замер 2.10 (career-spread-probe.js, 600 игр, очки · победы):
     97: обычно 39.1 · 4.5% | 0.01 44.6 · 6.5% | 0.015 46.1 · 8.3%
     86: обычно 29.4 · 0.5% | 0.01 25.9 · 0.7% | 0.015 29.3 · 1.7%
     78: обычно 19.1 · 0.2% | 0.01 16.7 · 0.0% | 0.015 20.1 · 0.0%
   Набитая агрессия — прибавка сильному и ноль в среднем слабому: не подарок всем (0.02 им был). */
const CC_KEY_MASTER_GAMES=100, CC_KEY_LOOT_MASTER=0.015;
function ccKeyGames(){ const cr=CAREER && CAREER.career; return (cr && cr.keyGames) || 0; }
function ccKeyMastery(){ return Math.min(1, ccKeyGames()/CC_KEY_MASTER_GAMES); }
/* ЧЕРТЫ ИГРОКОВ (29.10, идея игрока, Notion 27.10 скрин 19: «peterbot would have w keyer because he always fights»).
   Из настоящих таблиц (tools/build-player-traits.js): доля очков с киллов против своего лобби, среднее по турнирам.
   ≥ CC_TRAIT_HI — W-key (Peterbot 0.74), ≤ CC_TRAIT_LO — играет на место (Kami 0.32). В вечере карьеры команда ботов
   с такой чертой ищет драку так же, как игрок со стилем W-key (CC_KEY_SEEK и лут с киллов CC_KEY_LOOT, без набитой
   руки), или реже, как «Спокойно» (CC_CHILL_SEEK). Черта команды — по среднему её игроков. */
// ==== CC_PLAYER_TRAIT (tools/build-player-traits.js) ====
const CC_PLAYER_TRAIT={"0 earnt flooks":0.27,"123456789123abc1":0.65,"1438u4681":0.2,"1chances99loss":0.17,"1devon_":0.19,"1st vertz":0.31,"2 hundred":0.09,"22poraobolsonaro":0.67,"27q8":0.84,"2am aqt ϟ":0.16,"2eh ap 47":0.66,"2gunzsam":0.76,"2trash1zr":0.29,"30分睡眠":0.75,"33 favs3k.":0.67,"3zizfv":0.78,"47 matt":0.33,"4ce daibou":0.66,"4d chap":0.31,"4drstorm":0.3,"4fortik":0.66,"520 zombie":0.75,"5aald":0.78,"5kz dankame44":0.31,"6767dream7676767":0.71,"7 tz":0.07,"71nً":0.91,"7f la makina":0.78,"7f skies":0.26,"7kapipi":0.33,"7med":0.71,"7mood":0.29,"7snfps":0.81,"7x kimo":0.21,"918 spyderǃ":0.2,"9627ll6ll7ll7l77":0.96,"9amis":0.74,"a1 simple":0.72,"a7mdqt":0.66,"aatareet 201":0.79,"abasadasadgrggg":0.75,"abbo.":0.66,"abdullatif1 x":0.65,"abdurrehman 28":0.35,"abodeet fvǃ":0.78,"absntz 24":0.79,"abu tarf シ":0.66,"abusivestepdad.":0.32,"access.exe":0.69,"acris moze 飛躍":0.69,"acro":0.26,"adam":0.66,"adamlbǃ":0.65,"adol":0.66,"adolfwasright67":0.3,"adzyy":0.81,"adéla v2":0.32,"afd mainy 88":0.29,"ag rhys":0.34,"aguilarsiño":0.72,"aguszk.":0.75,"agusǃ":0.32,"aiizix うつろ":0.8,"aim":0.33,"aimer grizz 24":0.7,"aimuplayer":0.28,"alahna luvr":0.69,"aleex":0.23,"alessandro":0.28,"alex":0.65,"alexcod556":0.69,"alexx freecss":0.33,"alfﱞa":0.25,"ali primex":0.7,"allex tung 67":0.23,"alliege":0.66,"altria natural":0.19,"always on height":0.3,"always top 2":0.06,"alxnsofv":0.31,"ames44":0.7,"amg reyed":0.69,"aminished":0.67,"amoris ragna 狂剣王":0.74,"amplify":0.27,"anagennisi kaua":0.3,"ancheǃ":0.18,"andinio":0.72,"andrew igl":0.27,"andyvencha":0.21,"angel precks":0.74,"angrybunch-_-":0.66,"anix":0.18,"ankido":0.81,"anon":0.72,"ansilexx":0.34,"apar":0.33,"aposentado-_-":0.22,"appo 7":0.66,"arabuncut":0.31,"arcesd":0.28,"arctqrès":0.22,"arkhram":0.32,"arm pereznewera":0.25,"arrow":0.67,"arthurbc":0.83,"artor":0.33,"ary":0.75,"arzy fvǃ":0.69,"asf lulu":0.33,"asianzing x":0.26,"asna rairu":0.7,"asta":0.76,"astro wormy":0.21,"atheerψ":0.22,"atomsぁ":0.31,"atrct 時の戦士":0.32,"attay daql época":0.69,"audioz 47":0.34,"aur maxi 19ǃ":0.23,"aur t3eny 7ǃ":0.66,"autm0":0.65,"avenger":0.32,"avery":0.24,"avlr 友":0.7,"awtǃ":0.33,"axgisz 7":0.09,"b1urantics":0.68,"ba tuyo 7":0.69,"baby sneaky1k":0.89,"badex":0.3,"baily":0.82,"balafnn":0.74,"balor":0.69,"bananaapple fvǃ":0.16,"banw1se19":0.67,"barliana":0.28,"barney rexmas":0.7,"barroso":0.7,"bathan":0.33,"batman bugha":0.32,"batonho":0.77,"battal":0.7,"bbweewee":0.7,"bear":0.66,"bedin":0.25,"beef":0.81,"bellaquita remix":0.33,"ben ネ":0.66,"beαstfn":0.31,"bg final boss":0.18,"bg palmeirense":0.66,"bgdzin.":0.31,"bhegs":0.31,"bico sujo 157":0.88,"big kr4t4y 10ǃ":0.66,"biggtaro":0.29,"bigod":0.33,"bingle":0.2,"binmansoorǃ":0.68,"bioo":0.69,"birdyn":0.17,"biylox":0.75,"bizzie":0.72,"bizzle":0.35,"blaackish":0.78,"blakeps":0.19,"blanckz":0.24,"blazerd":0.76,"blazerway 神":0.11,"blind 001":0.19,"blits":0.33,"bludgansta47":0.8,"bluff gtfo":0.34,"blumecl mi amorr":0.35,"blynks":0.34,"boardzz1x-":0.31,"bobby":0.3,"bobyelbaynas 7":0.26,"bof べった":0.24,"boji":0.68,"bola":0.25,"bologn4":0.27,"bolsa de tusi":0.78,"bonzerǃ":0.21,"botboidrakey":0.21,"bowlcut oogway":0.67,"boxか":0.73,"bpro teku 74":0.72,"bqb なかよう":0.84,"bquuu":0.78,"braaaauuuuuu":0.33,"braden":0.73,"bravo":0.27,"braxlefn":0.33,"brian locz":0.34,"broken igl":0.33,"brook":0.09,"brunao":0.32,"buja xinelaxz.":0.72,"bumboy":0.3,"burga":0.29,"buster":0.33,"buzzo":0.68,"bwr bador":0.23,"bx1st":0.74,"bykn":0.32,"bylah":0.66,"bym7md":0.66,"bysalva":0.79,"büttowski":0.69,"c0ld104":0.66,"c10yyy":0.75,"callejr 88":0.66,"capcapcap":0.67,"carbone":0.72,"carrott":0.67,"carter":0.23,"caryion":0.25,"cash kissed you.":0.68,"cashǃ":0.74,"castro 19ǃ":0.34,"cat flobber":0.74,"catman":0.29,"cauzerz":0.71,"cc enczu":0.33,"ceaqul":0.69,"ceara":0.83,"ceeq":0.14,"ceice":0.34,"celis ひつじ":0.74,"ceno":0.31,"centro":0.35,"ceronnnn":0.68,"cesar":0.67,"cesars milizéǃ":0.32,"cesc fàbregas":0.72,"cest launcherr":0.34,"cg lucxzinn 1898":0.7,"ch.ネムタイヨ 姫":0.29,"chanzes":0.31,"chaosfvǃ -_-":0.22,"chap":0.74,"charlie":0.34,"chewy ebok":0.28,"chewybagodonuts":0.74,"chicha":0.22,"chinese.chicken.":0.66,"chip 8":0.67,"chipi ts3":0.28,"chiq.":0.21,"chivirimaxsteel8":0.77,"chizi":0.7,"chocoluv":0.35,"chrollo lucilfer":0.68,"chuckxz":0.7,"chunkymonkey543":0.69,"cizy909":0.21,"claim psy":0.32,"clarityg":0.29,"clawfv 7":0.34,"clayrixx":0.67,"clement":0.34,"clemxntǃ":0.68,"clextr":0.32,"cln 7":0.65,"cloud1k mini xyz":0.3,"clouds cc":0.7,"cloutzzy.":0.11,"clover":0.65,"clovr syren":0.21,"clw":0.24,"coast toxicǃ":0.31,"code spaghyt":0.29,"cofts":0.68,"cold fhd":0.66,"coldfvǃ ǃ":0.72,"cole":0.68,"colt kanox":0.34,"coltini jenkins":0.7,"comeback fynn":0.84,"commandment":0.25,"conin4k":0.68,"connor 74":0.7,"conor mcdavid":0.12,"conslebot001":0.76,"controllergoon67":0.77,"coolpenguin48":0.28,"coolsito 嬰兒":0.33,"corleoneexz":0.71,"cortex444":0.22,"corvalan":0.76,"cosmo1893":0.73,"coutinn愛":0.34,"covrezinn":0.27,"coxon":0.81,"coyes1k":0.32,"cr crr":0.26,"cr demon破壊しました":0.75,"cr huggy ういー":0.83,"cr7 ディーケイ":0.7,"crank":0.73,"craziest 7":0.34,"crisbuca":0.19,"crompz":0.7,"crow snohxxbot":0.67,"crunchy":0.32,"crusti":0.34,"cruz":0.33,"cryed":0.69,"crzy 23ǃち":0.31,"ctm":0.66,"cubix":0.78,"culture1x":0.27,"cup ヤ":0.65,"curious":0.68,"curve":0.74,"cuvey":0.11,"cwintrr":0.77,"cyluss":0.25,"cynical":0.65,"cynical421ǃ":0.66,"cyperzz":0.68,"cyrexブカ":0.32,"d1egobtw67":0.21,"d4stroy4r 神":0.81,"d7m ӝ":0.33,"da-ita 17.2":0.69,"dabuel":0.34,"daddysgirl823":0.34,"dana引退済":0.25,"danete do gonnet":0.35,"dang0ms":0.27,"danhope 1st":0.25,"dankline":0.84,"danyul":0.27,"darkos":0.29,"darkxz":0.67,"darm":0.67,"dashyy":0.15,"dawgslayerjohn92":0.74,"deadshotfnl":0.74,"deathstroke_ufc":0.84,"deejayy 67":0.88,"deez":0.76,"deftoneslover31":0.12,"deka tyson":0.66,"dekeltryr.":0.29,"demonnn pux1to.":0.67,"demus":0.7,"denis1k3":0.24,"dennys77_":0.79,"deqx 30":0.31,"deqzyy":0.79,"detect cavera":0.32,"dev0nhendryx":0.27,"devade":0.28,"devy9x":0.33,"deyydodger":0.84,"deﬁant milizé":0.85,"dgls 212":0.32,"dihmoo":0.26,"diktator vinq ム":0.69,"dinus":0.73,"divine":0.32,"dksking.f":0.18,"dl basel":0.65,"doctor9x":0.18,"dog":0.24,"dokan2700":0.28,"dominant":0.21,"domo":0.33,"doodle 32":0.79,"dopi 3":0.19,"dorapp1":0.34,"dragons ball zﾠ":0.35,"dragonzlfk.":0.33,"dreamrock":0.66,"dreus2":0.25,"drill pig":0.31,"drillexd.":0.27,"drizzo0":0.69,"drmd the fato ϟ":0.29,"drx zest":0.28,"dt peterbot":0.66,"dummygalloǃ":0.33,"dvs ttv adzy1x":0.33,"dwavyrex13":0.68,"dylan":0.26,"dylan aim":0.25,"dylangodoy9":0.24,"dyre doue":0.16,"e teddy":0.31,"echo":0.78,"edbertenjoyer":0.3,"edg jerryyokk":0.28,"eehnow":0.35,"egoist try":0.66,"egrm":0.35,"el filerovencha7":0.65,"elg adsrr":0.72,"eli get money":0.65,"elijah ityb":0.69,"elpulgaﾠ":0.84,"emberǃ":0.7,"emoboy09178":0.2,"emxxrr":0.32,"enbrevecorono777":0.21,"enough":0.32,"enquz":0.68,"ensar":0.74,"envy4tb":0.71,"enzobuca":0.32,"enzouzz 10":0.8,"epikpnp":0.21,"epiktuxe":0.84,"epsybotbotǃ":0.69,"equalz 444":0.34,"eshouu":0.67,"eshz":0.3,"esterotipo":0.74,"etzo":0.71,"evil salvatoreǃ":0.12,"evolved":0.68,"exoph":0.77,"exotic":0.29,"ezezinn.":0.21,"f3kserǃ":0.3,"f4bled_tacotv":0.25,"f5rﾠ":0.73,"fab":0.66,"faisal 17":0.66,"falcon":0.67,"falcon oathbotǃ":0.7,"falcon peterbotǃ":0.71,"falconer":0.29,"faluve":0.65,"fares":0.19,"fashers":0.25,"fatch":0.34,"fauquex":0.7,"favs":0.34,"fawaz 0.2":0.75,"faxfox":0.33,"faĩsal":0.3,"faひろ":0.25,"fct 波乗りペンギン":0.27,"fear fusionz":0.67,"febas banzaking":0.8,"feehzin go loko":0.72,"felipr.":0.82,"felix - -":0.32,"felpsz betrayed":0.75,"ferticeǃ":0.67,"fhoodi 12":0.69,"filipmonk":0.3,"finn":0.34,"firing boyzz":0.07,"fisher":0.71,"fkleyy":0.73,"fl envyfv":0.81,"fl tofpita":0.65,"flc dewayy190xd":0.31,"flex":0.31,"flexah_":0.27,"flicks":0.26,"flickzy":0.67,"flinty":0.67,"flipped":0.29,"flo xo":0.34,"flo キ":0.67,"floow":0.78,"flopytin":0.26,"fltrtxrodukanxpx":0.29,"flxqz_35":0.81,"fly":0.68,"fly carries":0.22,"fly darkyǃ":0.67,"flyzxbotǃ":0.69,"fmonraal fvǃ":0.66,"fnajen":0.67,"fnturtlesurfer":0.29,"folnet-":0.81,"forbes":0.18,"former":0.32,"foronezx":0.28,"fost1s":0.79,"fpg nanuǃ":0.33,"fpg アイライトではありません":0.34,"fpg ローグラクア 天蛾":0.34,"fragstage5":0.2,"france":0.7,"frans4b":0.82,"fraymy":0.31,"fredbotfn":0.7,"fredoxie":0.72,"free r kelly":0.28,"freemok":0.67,"freitas1x":0.67,"frixzbananǃ":0.17,"frost":0.27,"frox.7":0.72,"frxstyy":0.21,"ftc fleakz":0.67,"ftw あらきりょうすけ":0.2,"ftw しんぴよǃǃ":0.28,"full box46":0.68,"fulltrolling":0.78,"funizera":0.68,"funkbomb":0.22,"funkyhorse73":0.27,"fusionz":0.26,"fut phzin 伊万尔":0.74,"fuwa":0.71,"fuzettin":0.69,"fuzz":0.75,"förma cloudz 10ǃ":0.89,"g ay лол":0.67,"g5rc":0.35,"gabiruga jm":0.23,"gamex":0.23,"gandhi dabdabdab":0.34,"gary":0.65,"gary rain":0.33,"gatts x":0.68,"genie2rare":0.19,"genius くさちゃんǃ":0.26,"genius ばちこり":0.31,"gents quokka":0.27,"gents-c watchǃ":0.22,"georgefentfv":0.26,"germano":0.68,"ghost":0.88,"ghosty wanǃ":0.33,"ghsty":0.69,"glimsy ツ":0.21,"glm snow":0.68,"glowz":0.34,"glubschi":0.65,"gobawfvǃ":0.29,"god did ming":0.69,"gogos-":0.24,"goku":0.73,"goku 8x":0.24,"gold":0.34,"goldenboyy yk":0.33,"goliath travis":0.3,"gooboz":0.06,"goodguynani yt":0.67,"goon":0.82,"goonbag rotto":0.69,"gordete":0.71,"gordeteaim7 yx亗ǃ":0.71,"gosu_keith":0.13,"grandpa smoke":0.7,"grovr.":0.74,"gt montyy":0.16,"gter":0.66,"gudnbre":0.65,"guikzn":0.69,"gura":0.34,"guri de cwb":0.29,"gusnus333":0.86,"gutofps":0.24,"guuh shelby.":0.82,"gwooble":0.71,"gwxǃ":0.67,"gz faity 1":0.73,"had":0.72,"hadi":0.68,"haisenic":0.72,"hajuu":0.84,"hala μadridǃ":0.21,"halfdumb":0.26,"hallow4":0.66,"hames 200":0.16,"hamuppi":0.24,"hardin bacana":0.84,"harro":0.72,"hawk":0.27,"hawk!":0.21,"haze 14ǃ":0.89,"headtap33":0.75,"heartt":0.28,"heatzy":0.19,"hellfire":0.68,"henchman":0.76,"henphix":0.17,"henry30j":0.27,"hezzaar":0.66,"hiding 26":0.34,"hiro":0.32,"hisssbackkkkk":0.31,"hjapdpadpdagdap":0.71,"hmbox":0.22,"honguito n115":0.88,"honoᶻᶻ":0.29,"hopaim":0.72,"hornet":0.3,"houndz":0.26,"houndz x":0.27,"ho黒":0.29,"hris":0.68,"hunter":0.69,"hurtyn 花":0.66,"hussy":0.23,"hycken":0.81,"hype 7ǃ":0.68,"hyper":0.68,"hyperwallet ban":0.2,"hyrax malone":0.78,"hza3fv":0.73,"hàkuna matata":0.3,"i love doopie":0.28,"i4xpro":0.29,"i4xpro ǃ":0.31,"ian kewin s2.666":0.66,"ibp kro":0.22,"icee":0.67,"iceqo":0.33,"icy":0.31,"icyecle":0.65,"ignum rirksignzz":0.29,"ignum にかとツッパニャン":0.67,"igorlorens":0.2,"ikalifa pls":0.73,"illushxn 7ǃ":0.23,"im7 511":0.65,"imeyfishy":0.67,"imu 死":0.69,"inact":0.81,"india on top 7":0.67,"indian reaze":0.31,"insano":0.22,"insight":0.28,"invest in snp500":0.08,"iny れんこん":0.68,"its davasco":0.76,"itshi":0.81,"itsshighsky":0.32,"iv7rdo ᴶʳ":0.18,"izzi":0.71,"jack ϟ":0.28,"jackydee":0.01,"jackyjerky 17":0.28,"jacqwil":0.8,"jae igbbmn":0.73,"jahter all day":0.33,"jakebuca":0.31,"jakeocuh":0.67,"japko":0.69,"jara7 911":0.87,"jarritos":0.27,"jasper":0.71,"jaus":0.74,"javix":0.25,"jawsh":0.76,"jax1wnl":0.16,"jayz":0.79,"jbya":0.34,"jdw":0.34,"jeanz":0.31,"jeffy boby":0.88,"jellyiwnl":0.73,"jerema maxi":0.25,"jermfn":0.24,"jesse":0.15,"jesse 777":0.7,"jeulzz":0.32,"jezejearimǃ":0.73,"jg9-":0.3,"jinu-":0.33,"jjtwo.":0.72,"jo general":0.26,"job":0.67,"john":0.35,"johobo.":0.34,"jokzxzxz yhyh":0.67,"jonyfv":0.28,"jordan":0.21,"joseph":0.22,"joshbot":0.3,"joshuafnt":0.22,"jottax.":0.76,"jpsk1ng":0.28,"jsick":0.67,"jucy":0.34,"julle":0.73,"justice":0.22,"juu":0.67,"jxaco281":0.31,"jοnny.":0.87,"kaan":0.67,"kadenox":0.28,"kaf":0.71,"kaidon":0.76,"kairuv2ﱞ":0.75,"kaiz_-":0.35,"kakarot":0.67,"kal el":0.77,"kalki":0.72,"kami":0.32,"karmaa":0.66,"kashfv":0.23,"kauazin 11":0.91,"keemo 24ǃ":0.76,"keendryǃ":0.18,"keepitjeev":0.71,"kein callde":0.24,"kenn":0.29,"kenrop":0.19,"kenshi":0.34,"kenyto":0.32,"kerzuh":0.66,"khamisky":0.85,"khaxxz29":0.7,"khrawn is back":0.13,"killer queen":0.77,"king josh75 ψ":0.12,"kingaling":0.68,"kingston":0.32,"kioxx.":0.73,"kipp":0.68,"kippits":0.25,"kirb1":0.68,"kirwaǃ":0.77,"kisen":0.68,"kitkat":0.77,"klinberi":0.2,"klown":0.33,"knäcke 22":0.27,"kobyǃ":0.27,"kodex":0.66,"koexee grimes":0.83,"kolqz prime":0.7,"koox":0.32,"kov kirk pork":0.17,"kpi hello":0.17,"krabbs3k.":0.25,"kraez":0.73,"kreg 逝":0.33,"krreon":0.71,"kslayahh":0.72,"kubx":0.35,"kulb":0.34,"kumo":0.71,"kuren":0.2,"kwah":0.27,"kxyin":0.71,"kynsoul":0.24,"l7n":0.76,"labubu labubu 67":0.23,"lachsaim":0.25,"laizen.":0.68,"lame":0.81,"lamine vinkyǃ":0.69,"lancers":0.67,"laptic.":0.26,"lardl":0.65,"larynocap":0.82,"lasers":0.25,"layth":0.74,"lazarekツ":0.3,"lazzybaiano":0.32,"ldijdw8a2":0.35,"le danicush":0.68,"lefteye71":0.32,"legedien":0.26,"leif ﾒ":0.35,"lekmaluco7":0.73,"lengthylizard52":0.26,"leo messi 2012.":0.67,"leon142.":0.7,"lericx":0.31,"letshe00":0.66,"lezinǃ":0.69,"lezix":0.31,"lhz1n kalani2022":0.66,"liam":0.67,"lightlx":0.75,"liimaa":0.28,"lily":0.67,"limameyツ":0.66,"lime":0.75,"link":0.08,"linkaruni":0.26,"linxz 710":0.67,"lionz":0.2,"lit buyureyli":0.09,"lit erunfnz":0.76,"lixgoty7.exe":0.76,"lla scroll":0.27,"lnd fzklolǃ":0.75,"lnd maguire":0.74,"lofeo":0.76,"lol lmao rofling":0.26,"lomooca":0.35,"loneazzazzinator":0.89,"long live moo":0.66,"lorzizs":0.34,"louise frucci":0.83,"lovefas76":0.34,"lovero nah":0.3,"loxxit":0.7,"loyal ttvabstaau":0.29,"ltbfoidslayer63":0.72,"lucas":0.2,"lucid":0.22,"luckyali":0.17,"lucxss":0.68,"lucxss き":0.73,"lugganein":0.69,"luh motër":0.68,"lukxzzbuca":0.32,"lunex 11":0.68,"lupien":0.32,"lwxfn":0.14,"lxdesman":0.23,"lxmpgoty":0.78,"lyejax":0.28,"lzk_lzk":0.28,"lûkke":0.67,"m 亗亗亗亗亗":0.16,"m2bk 7x":0.33,"m7md_is_the_king":0.7,"m7trm_10":0.86,"m7xel tekkkǃ":0.31,"maatzera":0.2,"mace":0.67,"mack":0.74,"macyfishy":0.35,"mada 寬":0.73,"maddenv":0.7,"maestrofnbr91":0.82,"magevaks":0.76,"magicwnl":0.76,"magnum shaft":0.7,"mahi":0.75,"mainly":0.68,"majorcuh":0.31,"maken":0.27,"maku":0.83,"mald1s":0.18,"malibuca":0.71,"maloxty7 fvǃ":0.82,"malufvǃ":0.34,"mancity 1111":0.65,"mancity rtxy3kǃ":0.24,"maniac 5ǃ":0.26,"marcinward":0.79,"marco":0.33,"marco smallville":0.77,"marcylise 17":0.32,"mariuscow":0.68,"marvik is back":0.13,"mase":0.76,"mask fridge":0.18,"mason":0.66,"massimo":0.27,"matez":0.34,"matrx":0.75,"mattilsynet":0.34,"matuukdwiokaoid":0.67,"maxim1nn kt":0.66,"maxo":0.29,"mazenn74":0.26,"meah 31":0.74,"meki":0.78,"mellfart":0.71,"mely":0.13,"merman":0.35,"metrq":0.33,"mev":0.06,"mevǃ":0.31,"mexe":0.28,"mezega":0.74,"mfjzzz":0.19,"mi gloria a dios":0.69,"mia toretto.":0.33,"mikan":0.34,"mikebotǃ":0.26,"miknup亗":0.68,"milks shiesty":0.66,"milo":0.27,"mimic":0.23,"mimix kurosaki":0.14,"mina":0.73,"minit":0.75,"minty":0.26,"mirkσ":0.35,"misery":0.69,"misha":0.78,"mister":0.29,"mixer 001":0.32,"miyu":0.71,"mn3t":0.66,"mns hunterr ᵔᴥᵔ":0.23,"moda":0.24,"moet るるまる 723.":0.34,"mohanad":0.3,"monarch syco":0.19,"moomooonmilk":0.31,"morix":0.7,"moufa":0.34,"mouro 1803 愛":0.34,"mozart 10":0.74,"mpz çpn a私ajsek":0.77,"mshary":0.74,"mshhhhhhhhhhhhhh":0.73,"mstraw":0.67,"mtsfvǃ":0.26,"muath 10.":0.31,"muiticuh":0.72,"musa fvǃ":0.13,"musky":0.32,"mvx":0.7,"mvx 00":0.86,"mvxy":0.68,"mxnkey.exe":0.67,"mxrcio":0.26,"n8 imavov":0.71,"nacharrio ykǃ":0.09,"naekoz":0.34,"nagawithattitude":0.33,"nah righto champ":0.65,"nahhhh pa":0.25,"nahue507.":0.12,"nahuxwq":0.71,"nani":0.34,"nanolite.":0.32,"narwhal":0.27,"nasir":0.33,"navi h4kudo81":0.33,"nawaf":0.32,"neaxfnzǃ":0.13,"neeqo":0.34,"neohgay":0.35,"neos kira":0.79,"nero":0.33,"nerve focake":0.19,"nerzlah":0.66,"nex":0.27,"nextaaasz":0.82,"nexxsfortnitepl":0.11,"neyo":0.31,"neyto":0.2,"nhoulfv ǃ":0.75,"nhoulm10":0.69,"nic":0.68,"nickzrr":0.67,"nico":0.28,"nicobuca":0.33,"nicoliva1":0.34,"nightcore 2":0.66,"nigitiii":0.32,"niivzy":0.34,"nikola 75":0.68,"nikola jokic 15":0.67,"ninja":0.28,"nixxz":0.76,"njby":0.34,"nktǃㅤ":0.28,"nmaqttles":0.29,"noah281-_-":0.3,"noam":0.14,"nolifeispainted":0.32,"non fungible ark":0.29,"noodle neegy":0.69,"norcal nugz":0.68,"noseba 7":0.21,"nosh":0.26,"not dc its hk":0.73,"now king.":0.68,"noxy":0.66,"noxy1x":0.73,"nqz 19":0.28,"nrv ethyro":0.33,"ns top goon":0.24,"nsrfv":0.7,"nt adriaht":0.27,"ntz":0.33,"nutifyy":0.3,"nvs.g":0.17,"nx1xyfvǃ":0.09,"nxfz まいにちフロッパー":0.65,"nxndotheastro":0.69,"nxtftn":0.32,"nyhrox":0.65,"nyxlr":0.29,"o m oo m o":0.84,"o5 cyrzrǃ":0.8,"ob":0.69,"obi chamtor xd":0.35,"oce t3eny":0.65,"ofdylan":0.18,"ofix 7":0.34,"ogii":0.27,"olisykkes":0.67,"one callum 10ǃ":0.26,"onyx":0.29,"onyx katevolved":0.68,"oofersfvǃ":0.71,"ooh l1nкх":0.66,"optimal":0.35,"oreoraga":0.18,"orix on the dma":0.84,"ortopeda juzio":0.12,"osama 901":0.68,"osamabot ǃǃ":0.34,"osiris":0.65,"otazy":0.28,"ova ditrxx":0.67,"overstrand":0.31,"overstun.":0.74,"overt zanzjerss":0.33,"pachka .":0.67,"pacific fledi":0.22,"paco luciano":0.29,"paltbraaa":0.32,"pandore reelish":0.19,"pandushh":0.69,"panterr cs":0.18,"panzer 190":0.79,"papialka修":0.78,"papita iwnl-":0.66,"pardal":0.88,"paris":0.74,"parpy":0.26,"parur":0.75,"pat bellingham":0.66,"paul 117":0.78,"paulinn":0.68,"payna":0.69,"pegu":0.79,"pekgl":0.76,"pentexxxxxxx31":0.16,"pentium":0.66,"peppy":0.87,"pesal.xyz":0.29,"peta":0.32,"peterbot":0.74,"phaпtom2x":0.71,"phenom":0.68,"phluxzy":0.27,"physicss":0.23,"pietriinnn":0.71,"pietrofn6":0.72,"piggy bread":0.34,"pilat .":0.3,"pingu":0.66,"pipo 7ǃ":0.12,"pirozz":0.71,"piz":0.35,"plahs!":0.68,"pligz":0.1,"ploieyǃ":0.2,"pmb gohanbot κθ":0.29,"pnkayy":0.73,"po":0.78,"polar1z.":0.33,"polobcool.":0.75,"ponder":0.3,"pongio.":0.81,"potato":0.68,"powerbeshy":0.29,"powerofhaircutǃ":0.26,"poyart":0.74,"pq 9una k9ǃ":0.78,"pradabagsaucy":0.68,"praidyy":0.24,"prax":0.7,"predage":0.27,"predep":0.31,"prest222":0.34,"prime l2r2":0.3,"prime pluto.":0.86,"primodefausto":0.75,"procode metodos":0.68,"protoon":0.8,"provethemwrong.":0.71,"proxy 19":0.28,"prs dam1key":0.32,"psalm":0.29,"psw_s2":0.16,"pth reo breo":0.29,"ptt かいばぶ だっちゃろーǃ":0.35,"ptz cucurella":0.66,"pucchiǃ":0.73,"pudnara":0.71,"puello return":0.33,"pulse qzx":0.33,"pun cam slam":0.21,"punisher":0.22,"puremon":0.66,"puroboko":0.66,"puzera":0.71,"pvskybot.":0.07,"pxschoal":0.3,"pxzdun":0.29,"pzuhs":0.33,"qasruh":0.74,"qhvst":0.69,"quahbuca 62":0.69,"quann":0.24,"quaxzywtf":0.8,"quaлa":0.73,"quick stepǃ":0.29,"quickzy jane":0.82,"quinn":0.28,"r1ze":0.23,"r4c kevpieceyou":0.69,"r916fn":0.32,"rabbit day 1":0.21,"rafagoty":0.87,"rafast":0.72,"raiku":0.29,"rain":0.66,"raitex":0.32,"raito":0.8,"raizfv7ǃ":0.29,"rakirye":0.71,"rakso":0.34,"rakyu.":0.69,"ramadanyt":0.67,"ran":0.28,"rara":0.68,"raru 7ǃ":0.65,"ratgun":0.7,"raz":0.22,"razak":0.26,"razl":0.68,"raпger":0.79,"rbd rizquez":0.68,"realpro ネ":0.69,"rebel 英雄のヒーロー 轟":0.28,"reboot in motion":0.76,"red gt3 rs 992":0.84,"red ny":0.74,"redo botえもん -ω-":0.31,"reds rizen":0.66,"redz":0.83,"reevers":0.69,"refinefnx":0.31,"reflex":0.3,"reg コンビニ弁当がお袋の味":0.73,"regan":0.29,"regmosigndaptman":0.68,"regularbrd":0.34,"reguletor":0.27,"rel":0.28,"relit ryle 19ǃ":0.79,"rellvis":0.35,"relq 52":0.74,"relʚɞiz見沙織":0.27,"remi ihmo":0.24,"rempsosik":0.28,"remsy":0.69,"retired old man":0.84,"retnuhfv":0.16,"retro":0.66,"revised":0.65,"rexo":0.3,"rexx":0.34,"reyaxiereyli 14ǃ":0.22,"reyy":0.31,"rg22 insane":0.16,"rgl れーくんぺー":0.27,"rhay ʚïɞ":0.33,"rhythm":0.29,"riam":0.7,"rich humble king":0.68,"rich or dead 7ǃ":0.1,"richhomiequinn":0.34,"rickskrrrr":0.67,"rickycuh05":0.68,"rinconk1ng":0.27,"risk":0.69,"ritual":0.74,"rivbuca wins":0.79,"river":0.68,"rizart":0.33,"rl brocc3x":0.81,"robin":0.73,"rojocasa":0.79,"ronaldo":0.29,"ronin":0.13,"roqz":0.2,"roxxane":0.79,"royale7ezw7s cpx":0.78,"rqzrim3 喰":0.68,"rreflex.":0.79,"rube stunwear":0.21,"rubytanawp":0.7,"rucien":0.74,"rupaǃ":0.78,"rura":0.75,"ruri":0.26,"rutzmk":0.28,"ruva xl2r2":0.73,"rv":0.32,"rvl majedfv":0.27,"rvx":0.65,"rxin ǃǃ":0.78,"rykurr 9":0.27,"ryo":0.22,"ryze andyz":0.77,"rοchan":0.26,"s3fn":0.75,"saad":0.77,"saankspinppaauwu":0.25,"sabavell":0.25,"saf":0.34,"safik":0.67,"sails":0.66,"saku":0.33,"salko":0.67,"salt":0.35,"samkob.":0.33,"samnerb":0.77,"sapiros":0.32,"sasssssssssssski":0.35,"savaje":0.77,"schmalibuca":0.05,"scion holds w":0.74,"scythefntt":0.2,"seal 7":0.28,"sealmatt.":0.25,"sebassj7":0.16,"sekayg0d":0.8,"semo 0.2":0.7,"senz":0.35,"seven":0.34,"sg un1x":0.23,"sg4 asahi4.27end":0.65,"sh kairiϟﾋｴｰ":0.23,"sharp2k":0.27,"shawarma cat 1":0.65,"shifttykrpz 参":0.21,"shin0biiiiiiiiii":0.32,"shmecked":0.65,"shmeeb":0.71,"shoxy":0.22,"shuzeyy":0.21,"siempreleal32":0.72,"silent 女":0.66,"silxzys":0.75,"sinooh":0.25,"sio tzu":0.23,"sixx sevennn 35m":0.67,"skailereu":0.71,"skii":0.23,"skillet rwz":0.32,"skiper ay":0.3,"skvdoosh":0.65,"skw79_":0.27,"skylar 637":0.23,"skyy":0.25,"skyy 23":0.74,"skyz":0.23,"slapiin":0.69,"slender":0.29,"slide -207":0.77,"slix":0.34,"slowlybotǃ":0.25,"slq thomas":0.77,"sm1ly.":0.31,"smile":0.66,"snacky":0.01,"snak":0.76,"snake":0.34,"snakesǃ":0.21,"snakk":0.28,"sneaky":0.67,"snipez":0.27,"snoop":0.35,"snowvaks":0.16,"snowy":0.67,"snowzy welling":0.7,"soe":0.24,"softy abreu1x.":0.73,"sofyan 001":0.72,"sohib":0.3,"soleanäǃ":0.71,"solid":0.67,"solo vitin":0.35,"solution":0.29,"somali scammer":0.22,"sommerset":0.34,"soru1kk":0.67,"soul":0.25,"sound":0.26,"sout polish 7ǃ":0.67,"spacyx":0.2,"sparebow":0.31,"sparkz":0.81,"sparx":0.35,"spayed":0.33,"speckz bää":0.71,"spectral":0.67,"speed is here .":0.73,"speedybot fvǃ":0.25,"spider-rohun":0.7,"spideyy":0.23,"spiker":0.65,"spinelessschlump":0.22,"spooky":0.14,"spookz":0.69,"spraz":0.17,"spraz.":0.25,"squeakz":0.26,"squishy":0.31,"srw uchiha":0.67,"ssjassassin9":0.3,"ssjbobbfan":0.7,"stain":0.69,"stan 1st":0.33,"status":0.74,"steelix":0.19,"stekhnada fvǃ":0.2,"stelf batman":0.73,"sticks":0.33,"stiffaroonie":0.69,"stoopid":0.27,"stormysmz":0.28,"stravoox.":0.66,"stre4mless":0.32,"stretch":0.22,"strike smiky911":0.67,"string de sang":0.68,"subforpaula4ever":0.35,"sudds":0.8,"sully":0.71,"sultan":0.72,"sunekoneri":0.66,"supekey_":0.21,"supereye 11ǃ":0.69,"superman fawaz 人":0.7,"supremooooo back":0.29,"swaf destroyer":0.68,"sxcredǃ":0.71,"sxlo":0.34,"symetrical":0.29,"syopon":0.67,"syowl ᰔᩚ":0.71,"sythic":0.35,"szumich.":0.33,"sгмaтi 4刀":0.33,"t3ckyy":0.85,"t3eny":0.68,"t6 agustach":0.31,"t6 price":0.33,"tacsn 412":0.75,"tajinmangoo":0.68,"takii":0.68,"tako":0.16,"takumaikii":0.73,"talented aimerǃ":0.73,"tame":0.23,"tankslam":0.67,"tanmanǃ":0.68,"tarik skubal":0.77,"tatto":0.25,"tautai":0.33,"tavern":0.32,"tax.":0.32,"tbd":0.22,"teeq":0.31,"teitei":0.72,"tensa1x":0.69,"tenya":0.28,"teroq":0.67,"tfue":0.28,"th3iof":0.69,"thaitanks":0.27,"the big zeen":0.21,"the goat xa":0.73,"theonejit":0.8,"theqofnfnfnfnfn":0.7,"theux blessed":0.71,"thigashanma":0.7,"thorium":0.22,"thrtysevnn":0.7,"tickrss":0.13,"tidi":0.77,"tigg":0.75,"tik taker 73":0.23,"tik zeyad 73":0.25,"tiktk kiswanii1x":0.7,"tiktok aleczx":0.31,"tiktok aththat":0.76,"tiktok meatog":0.3,"tiktok sovzy4x":0.7,"tiktok vbqtify":0.66,"tiktok xamitos2":0.66,"tiktok のばぶか":0.15,"timelessqp":0.3,"timyoshi_":0.74,"tinytawn":0.29,"tippzylf":0.84,"tisma":0.34,"tito caideron":0.35,"tizi rabinovich":0.79,"tjaoki":0.27,"tjk 44 ネ":0.31,"tjorbenyeye 10":0.77,"tm abood":0.8,"tmsoki snoopy":0.33,"toba 〆":0.35,"toball.":0.18,"tobx":0.69,"tocata":0.7,"todynseu":0.79,"toff":0.29,"tomu -_-":0.28,"tonyfv":0.7,"toochh":0.21,"tootie":0.14,"topino quittino":0.34,"torifyx":0.75,"tossy":0.82,"totot":0.69,"toxic_gringo15":0.33,"toxicreoホンモノ":0.71,"traffikd by mika":0.68,"treatmxnt":0.71,"treebracnh67":0.18,"trg メロンキャッシュ 本物":0.16,"trickviv 7":0.8,"tristan hipp":0.33,"trixipuhǃ":0.69,"triz":0.28,"trueblackjew271":0.69,"truit":0.76,"trulex":0.33,"trusio":0.28,"trx 10ǃ":0.33,"try":0.81,"trzp":0.72,"trﱞﱞuth x":0.33,"ts4fo q8":0.34,"tschinken":0.29,"tt kingsauul":0.65,"tt stinkywhalee":0.69,"ttk indiaum":0.32,"ttv cornelius74":0.28,"ttv vbqtify":0.2,"tuedrip":0.73,"tups":0.66,"turbulence":0.24,"tutukuul17":0.34,"tw loidrehx":0.19,"tw unosukezz":0.35,"tweaker sow":0.83,"twicht aimxfer":0.29,"twitch angyyw23":0.7,"twitch bgftn":0.31,"twitch encilol":0.18,"twitch evagas":0.21,"twitch icyybtw":0.73,"twitch moakts ツ":0.33,"twitch peyyyszn":0.71,"twitch weeziefn":0.09,"twitch yodrexxiz":0.65,"twitch zpxyち":0.87,"twitch.strodles":0.3,"twitter blitzfn8":0.76,"twitter fnlofn":0.68,"twitter percntfn":0.34,"twitter sambtwfn":0.34,"twitter velqorz":0.67,"twitterzynoxfnbr":0.32,"twittr boazsn":0.26,"twx":0.68,"twzzk":0.28,"txrm":0.74,"txtuba":0.19,"typical gamer":0.3,"typo神":0.73,"tyt impail":0.27,"tzd mitski ټ":0.78,"tгonzi":0.31,"uc.2 ほちゃ":0.28,"uc.dttodot":0.31,"uc.negimaru 37":0.67,"uc.yama 橘":0.25,"uc.かえん":0.67,"uc.きな粉ばちぇǃǃ":0.71,"uc.そみー":0.16,"umzyǃ":0.35,"unicyy 212ǃ":0.26,"unit":0.14,"unknown army":0.74,"unrealiana":0.76,"unsolvedrr":0.77,"unsualhino 懶惰":0.67,"up the canes":0.32,"urmomsbig":0.83,"user-b4c5241967":0.71,"useг-7ccp28g505":0.27,"v comeback":0.93,"vaefo 852":0.76,"vagera":0.22,"valen 1940":0.32,"valunark 1":0.72,"vanixx midmidmid":0.73,"vaskee 67":0.32,"vavassori":0.26,"vaynle3k":0.75,"vazen":0.8,"vdxrek":0.23,"vediits":0.76,"veeq":0.25,"veer":0.66,"vehx":0.76,"veloso 360hz":0.29,"veno":0.72,"vent.":0.2,"vepz":0.32,"vermanzx":0.7,"verza":0.32,"vibefiez":0.26,"vibez juh":0.66,"vic0":0.72,"viei.":0.69,"villak3k":0.24,"vinizin":0.67,"viper d7nz31":0.33,"virus":0.21,"virus ǃ":0.82,"vjoy":0.3,"vleccks":0.66,"vluxt":0.27,"vmp dxnkz":0.2,"vohade":0.25,"void":0.76,"voil":0.33,"vokrat gosh":0.28,"volvest7":0.32,"vort 7":0.34,"voxe":0.65,"voz":0.69,"vtx quangtang":0.76,"vvflocka":0.22,"vwarwtf.":0.27,"vyruss .":0.33,"w estevin":0.33,"w6nu":0.24,"wakxj 999":0.22,"walver.":0.66,"war saw7 yhyh ǃ":0.66,"warbs.":0.3,"warrior":0.77,"waschsalon":0.85,"washed floriixn":0.73,"washedcollegekid":0.34,"wave":0.33,"wave juu aim7":0.27,"wavy":0.33,"wcr spiderman":0.27,"weeze":0.81,"westy.-":0.25,"wgs macchan":0.25,"wh imx":0.79,"wharfers":0.23,"what i chose.":0.33,"wheels":0.28,"wickesyv2":0.26,"wicxsy":0.73,"will":0.27,"willcuzz":0.18,"wings":0.69,"winther":0.66,"wolf":0.23,"wolf fvǃ":0.65,"wonderacute-.-":0.77,"woodzy 44":0.31,"wozah":0.69,"wp me proxen":0.26,"wqlz":0.75,"wqzzi":0.68,"wreckless":0.71,"wrigleyblue":0.35,"wtj milks clone":0.68,"x6 soby ǃ":0.99,"xaizz durden 1st":0.75,"xantaresʕᵒᴥᵒʔ":0.3,"xavier":0.85,"xavz":0.22,"xaxa":0.69,"xazr":0.86,"xcinik":0.35,"xenon":0.73,"xero":0.26,"xkovak":0.26,"xnb":0.21,"xnbシ":0.31,"xplo3k":0.73,"xrb ぺろぺおｒっぺろぺろぺろ":0.16,"xtra rystix":0.18,"xtremebumblebee4":0.31,"xx never gone di":0.35,"xx-madibha-xx":0.77,"xx360kirkscopexx":0.34,"xxp11pzz342xz":0.72,"xxtuexmanxx":0.65,"xyxy":0.71,"y1407":0.28,"yaakun":0.69,"yagi":0.88,"yagla hadron":0.14,"yampî":0.29,"yassen":0.73,"yb wavy":0.65,"ybenjassj 〆":0.79,"yerp":0.71,"yo7med":0.68,"yoda 91":0.29,"yoichi atreides":0.75,"yoicyﱞﱞ":0.78,"yonatz.":0.26,"yophantomau ttv":0.15,"yorozuya styler":0.71,"yotta 泥沼":0.25,"youngspirit5":0.71,"youngzayyski":0.7,"yousef 7.":0.33,"youtube vlfrosty":0.7,"yoyo":0.2,"yuazinho 7":0.81,"yung calculator":0.28,"yusuffǃ":0.65,"yuzon returns":0.3,"yvl rxvekz 28ms":0.76,"yyedge":0.65,"yzan":0.31,"z disaster":0.67,"zaczui":0.28,"zagouの弟":0.35,"zaikokame44":0.28,"zaire":0.69,"zarb":0.29,"zarbeh":0.73,"zayan":0.34,"zayt":0.22,"zdog":0.73,"zedox":0.26,"zeif oge":0.71,"zelofvǃ":0.26,"zen kobeネ":0.83,"zen ギア2ǃ":0.32,"zeng":0.69,"zenn":0.7,"zeph":0.74,"zeroo fvǃ":0.2,"zeta nisidera":0.06,"ziffy 73":0.66,"zinqxz":0.27,"zire":0.66,"zjacxb":0.17,"zlinkrain":0.8,"zoom 44":0.35,"zoom3rx 3 6 9":0.74,"zoreh":0.2,"ztibzrǃǃ":0.26,"zuccrr":0.72,"zugorow":0.68,"zxta2k":0.69,"zynbl prurun":0.3,"zyro":0.72,"zzmech 7":0.8,"zzmech fv":0.68,"ǃblur":0.76,"ǃzoomonster":0.3,"σπαρτιάτηςǃ":0.34,"ϋdanman":0.67,"гинатеамо fvǃ":0.32,"спасскдальний792":0.33,"тeıvann":0.28,"чекзе":0.76,"الحبابي rvl":0.66,"ح hitman ɪꜱ ɢᴏᴅ":0.19,"سكيبيدي":0.69,"َnightmare":0.33,"कदचटयचवनसगजचडदतत":0.66,"ᴅᴇᴠᴇꜱᴛᴜ":0.78,"ᴡᴀᴋᴇ ᴜᴘﾠ":0.34,"ᶠᵃᵏᵉあお":0.32,"ⓐⓢשٍّⓐⓢㅤㅤㅤㅤ":0.81,"ありす":0.69,"いくぜǃ":0.77,"えいぶか":0.85,"えのきたけのこのさとうのごはんǃ":0.69,"えるy7":0.91,"おかっぱがふ子":0.21,"こいる":0.71,"しこぴよフォートナイト":0.66,"ぜのぽったー":0.34,"ちきんぬーぶ.":0.29,"とまと":0.34,"どにやん":0.73,"どぶかすぶすごりら":0.87,"なにひりん":0.67,"なめとんき":0.3,"にんまりぬりぼう":0.27,"ばぶっち":0.25,"ぱんかすzz":0.15,"びくとろ ばうす":0.3,"ぴくぴくぴくぴくぴくぴくぴく":0.23,"まぁ":0.81,"まいきーくん888":0.31,"まぐろいち ﾇﾁｬﾈﾁｮｸﾞﾁｭ":0.23,"まもるよ47":0.71,"まよいマイマイ迷":0.84,"みかん":0.72,"めいる":0.69,"らいふ":0.66,"らりむ 配信中":0.2,"れんむz":0.24,"ガッツぴぐ":0.28,"クリープだぅ":0.67,"ナンデダロウコワい":0.77,"ハムちゃんchannelだにょん":0.26,"ハードスライム":0.65,"ボンバルディロクロコディロ鰐":0.12,"リョガタ":0.68,"ㅤ turbo ㅤ":0.23,"ㅤfranceㅤ":0.29,"不组队就能获胜的三好":0.35,"八月の夜.":0.28,"匿名.297":0.33,"壁の中に巨人がいるんですよ":0.67,"宇宙に行く兄弟募集":0.34,"岡副ヴァン智江トレア":0.66,"気合い入りまくりダニエル":0.32,"浪漫派マシュマロ":0.66,"瑠星.":0.7,"百男営業":0.26,"覚醒せいた":0.77,"ꮲd7":0.66,"고민서린":0.72,"ｉｔｚｂｌｏｏｐｙ":0.66,"ﾠkyro ǃ":0.22,"ﾠﾠﾠvǃﾠﾠﾠ":0.89};
// ==== /CC_PLAYER_TRAIT ====
const CC_TRAIT_HI=0.65, CC_TRAIT_LO=0.35;
function ccPlayerTraitScore(handle){ const v=CC_PLAYER_TRAIT[String(handle||'').toLowerCase()]; return v==null ? 0.5 : v; }
function ccPlayerTrait(handle){ const v=ccPlayerTraitScore(handle); return v>=CC_TRAIT_HI ? 'key' : v<=CC_TRAIT_LO ? 'chill' : null; }
function ccTeamTrait(t){
  const sq=(t && t.squad) || []; if(!sq.length) return null;
  const v=sq.reduce((a, c)=>a+ccPlayerTraitScore(c && c.handle), 0)/sq.length;
  return v>=CC_TRAIT_HI ? 'key' : v<=CC_TRAIT_LO ? 'chill' : null;
}
// Боту — один раз на вечер; что поставил менеджер клуба (mgr: _seekMul) или стиль людей — не трогается.
function ccTraitApply(t){
  if(!t || t.isYou || t.isMate || t.isRival || t.isClub || t._traitDone) return;
  t._traitDone=1;
  if(t._seekMul!=null) return;
  const tr=ccTeamTrait(t);
  if(tr==='key'){ t._seekMul=CC_KEY_SEEK; t._keyLoot=CC_KEY_LOOT; }
  else if(tr==='chill') t._seekMul=CC_CHILL_SEEK;
}
// Ярлык черты для экрана (разведка, карточки): пусто, если черты нет.
function ccTraitTag(handle){
  const tr=ccPlayerTrait(handle); if(!tr) return '';
  return '<span class="cc-trait cc-trait-'+tr+'" title="'+esc(tr==='key' ? L().ccTraitKeyNote : L().ccTraitChillNote)+'">'+esc(tr==='key' ? L().ccTraitKey : L().ccTraitChill)+'</span>';
}
function ccApplyPlayStyle(t){
  let ws=ccTeamStyles(t); if(!ws || !ws.length) return;
  // Стиль, выбранный на эту игру (ccStyleAskGame), — для всех людей команды; набитая рука у каждого своя.
  if(CC_STYLE_IDS.indexOf(t._styleGame)>=0) ws=ws.map(w=>({s:t._styleGame, m:w.m}));
  const seek=w=>w.s==='key' ? CC_KEY_SEEK : w.s==='chill' ? CC_CHILL_SEEK : 1;
  const loot=w=>w.s==='key' ? CC_KEY_LOOT+(CC_KEY_LOOT_MASTER-CC_KEY_LOOT)*Math.min(1, Math.max(0, Number(w.m)||0)) : 0;
  // Среднее в устойчивом порядке: сумма с плавающей точкой у обоих клиентов одна.
  const mean=f=>ws.map(f).sort((a,b)=>a-b).reduce((a,b)=>a+b, 0)/ws.length;
  t._seekMul=mean(seek); t._keyLoot=mean(loot);
}
function ccKeyNote(st){
  if(st==='key') return L().ccStyleKeyNote+' · '+L().ccStyleKeyHand(Math.min(CC_KEY_MASTER_GAMES, ccKeyGames()), CC_KEY_MASTER_GAMES);
  return st==='chill' ? L().ccStyleChillNote : '';
}
function ccSetPlayStyle(st, btn){
  const cr=CAREER && CAREER.career; if(!cr || ccStyleLocked()) return;
  cr.playStyle=st; ccApplyPlayStyle(CC_STYLE_TEAM);
  try{ careerSave(); }catch(e){}
  // Соседям — сразу: напарник и соперники ставят нашей команде то же, что и мы.
  if(ccStyleShared()){ try{ if(typeof MP!=='undefined' && MP.sendCard) MP.sendCard(); }catch(e){}
                       try{ if(typeof careerRaceSend==='function') careerRaceSend(); }catch(e){} }
  const row=btn && btn.closest('.cc-style'); if(row){ row.querySelectorAll('button').forEach(b=>b.classList.toggle('on', b.dataset.st===st));
    const n=row.querySelector('.cc-style-note'); if(n) n.textContent=ccKeyNote(st); }
}
/* ВОПРОС «СТИЛЬ ИГРЫ» ПЕРЕД КАЖДОЙ ИГРОЙ, ВЕЗДЕ. 5.10: «так раньше же перед каждой игрой писало это…
   пусть перед каждой игрой везде». Переключатель ездил в вопросе высадки, а его задают не везде
   (открытые раунды Кубка мира 2019, первый раунд капов). Теперь — свой вопрос, его зовёт
   simulateGamesLive перед каждой игрой карьеры, в любом режиме.
   В командной карьере и в общей комнате гонки — через ccMpChoose, как высадка: у каждой команды людей
   свой адрес ('style'+mpTag), отвечает тот, чей вопрос (ccMpMine), ответ едет остальным, и все ставят
   команде одно и то же (t._styleGame поверх ccTeamStyles). Набитая рука считается здесь же. */
const CC_STYLE_IDS=['chill', 'norm', 'key'];
function ccStyleLabel(s){ return ({chill:L().ccStyleChill, norm:L().ccStyleNorm, key:L().ccStyleKey})[s]||''; }
function ccTeamStyleNow(t){
  if(t && t.isYou) return ccPlayStyle();
  if(t && CC_STYLE_IDS.indexOf(t._styleGame)>=0) return t._styleGame;
  const ws=ccTeamStyles(t); return (ws && ws[0] && CC_STYLE_IDS.indexOf(ws[0].s)>=0) ? ws[0].s : 'norm';
}
async function ccStyleBox(cur){
  /* Значки — модели из игры (его «эти модельки тоже», 13.11; раньше «может W букву просто»): спокойно — щит-зелье,
     обычно — автомат, W-key — дробовик с клавишей W в углу. */
  const img=(src, extra)=>'<span class="cc-style-ic"><img src="'+src+'" alt="" width="26" height="26" decoding="async">'+(extra||'')+'</span>';
  const ico={
    chill:img('items/t3-shield-potion.webp'),
    norm:img('items/itm-assault-rifle.webp'),
    key:img('items/itm-pump-shotgun.webp', '<b>W</b>')};
  const o=await ccChoiceBox(L().ccStyleT, '', CC_STYLE_IDS.map(id=>({id:id, title:ccStyleLabel(id),
    note:id==='norm' ? '' : ccKeyNote(id), def:id===cur, icon:ico[id]})),
    // На острове, как высадка и остальные выборы игры (его «почему не на карте показывает»).
    (typeof CC_RUN_MAP!=='undefined' && CC_RUN_MAP && CC_RUN_MAP.isConnected) ? CC_RUN_MAP : null, null, 'style');
  return (o && o.id) || cur;
}
async function ccStyleAskGame(teams){
  const cr=CAREER && CAREER.career; if(!cr) return;
  const shared=ccStyleShared();
  const tagOf=t=>String(t.mpTag||'');
  const hs=teams.filter(t=>t && (t.isYou || (shared && (t.isRival || t.isMate))))
                .sort((a,b)=>tagOf(a)<tagOf(b) ? -1 : tagOf(a)>tagOf(b) ? 1 : 0);
  for(const t of hs){
    const cur=ccTeamStyleNow(t);
    const r=await ccMpChoose('style'+tagOf(t), ()=>t.isYou ? ccStyleBox(cur) : cur, ccStyleLabel);
    const s=(r && CC_STYLE_IDS.indexOf(r.v)>=0) ? r.v : cur;
    t._styleGame=s; ccApplyPlayStyle(t);
    if(t.isYou){
      CC_STYLE_TEAM=t;
      // Выбор запоминается как стиль по умолчанию (переключатель на Центре показывает его же).
      cr.playStyle=s;
      // Игра в «кейить» — в счёт набитой руки (ccKeyMastery). Сила ставится ДО счёта: эта игра идёт с тем, что было.
      if(s==='key') cr.keyGames=(cr.keyGames||0)+1;
    }
  }
}
function ccPlayStyleHTML(){
  if(ccStyleLocked()) return '';
  const st=ccPlayStyle();
  return '<span class="cc-style" onclick="event.stopPropagation()"><em>'+esc(L().ccStyleT)+'</em>'+
    [['chill',L().ccStyleChill],['norm',L().ccStyleNorm],['key',L().ccStyleKey]].map(([k,t])=>'<button type="button" data-st="'+k+'" class="'+(st===k?'on':'')+'" onclick="ccSetPlayStyle(\''+k+'\', this)">'+esc(t)+'</button>').join('')+
    '<small class="cc-style-note">'+esc(ccKeyNote(st))+'</small></span>';
}
async function careerLandingPick(field, you, title, kinds, o){
  // Вышел из карьеры посреди вечера: вопроса о высадке больше нет, раскладка остаётся прошлой (errlog 24–28.10).
  if(!CAREER || !CAREER.career) return null;
  o=o||{};
  // Стиль на игру спрашивается отдельно, перед каждой игрой (ccStyleAskGame); здесь — только поставить его.
  { if(!o.tag) CC_STYLE_TEAM=you; ccApplyPlayStyle(you); }
  /* Общая комната гонки: две команды людей, у каждой свой дроп, и порядок вопросов
     один у обоих клиентов — по адресу (mpTag), как у двоих в соло (ccSoloDrops).
     Раннер зовёт пик для своей команды без адреса; здесь он превращается в два
     адресных пика подряд. Соперник отвечает у себя, ответ приходит по проводу. */
  if(typeof ccRaceLock==='function' && ccRaceLock() && !o.tag && you && you.mpTag){
    const rivals=(field||[]).filter(t=>t.isRival && t!==you && t.mpTag);
    // Своей команды в комнате может не быть: второй раунд Victory Cup у вылетевшего
    // в первом досчитывается зрителем (см. runCareerVictory). Спрашивать тогда
    // некого, а ответы соперников всё равно надо дождаться — по адресу.
    const inRoom=(field||[]).indexOf(you)>=0;
    if(rivals.length || !inRoom){
      const hs=(inRoom ? [you] : []).concat(rivals).sort((a,b)=>String(a.mpTag)<String(b.mpTag) ? -1 : 1);
      let groups=o.pre||null;
      for(const h of hs) groups=await careerLandingPick(field, h, title, kinds, {tag:h.mpTag, pre:groups});
      return groups;
    }
    o.tag=you.mpTag;
  }
  // The grid belongs to the island the stage is played on. Every career runner
  // sets its own before it starts; this is the guard for the one case where a
  // save opens straight into a final and nothing has picked a map yet.
  // Rebuilt rather than merely filled: see the note in the runners' preamble.
  // A picker drawn off a squad-thinned grid offers the player half an island.
  useLandingSet(ACTIVE_LANDING_SET);
  // Nobody is watching a fast-forward, so the drop is made the way the rest of
  // the room makes it: everybody takes their turn in the qualification queue and
  // the best spot still worth taking. The player is in that queue rather than
  // skipped, so the seat they earned is still worth what it was worth.
  // Свою точку перемотка тоже уважает: метка стоит весь год, и вечер, который
  // никто не смотрит, играется с той же карты, что и вечер, который смотрят.
  /* В ОБЩЕЙ КОМНАТЕ ГОНКИ короткого пути нет: он сажал КАЖДОГО человека комнаты на МОЮ
     домашнюю точку (careerSpotZone — свой сейв), то есть у шести клиентов команды людей
     стояли на шести разных раскладах, и вопросы про коробку («своя»/«стычка») расходились —
     годовая проба 8.09: Evaluation 18.12, игра 3, у одного лишний own:live6 и вечер стоит.
     Голос за высадку идёт проводом, как в живой игре; в перемотке владелец отвечает сам
     («домой», если дом есть, иначе «тихо») — см. chooser ниже. */
  /* И СОЛО ВДВОЁМ В КОМАНДЕ (вопрос с адресом, you.mpTag): короткий путь сажал каждого из двоих на КОМАНДНУЮ точку
     своего сейва и раскладывал комнату заново на каждого — у двоих высадка финала Solo Reload расходилась с первой игры
     и вечер вставал на вопросах (командный год 20.10, 21.11: «drop=39/179000 vs drop=39/168784», «mid:swizzy#2 vs
     late:pixie#1»). Там высадка идёт общим путём, как в гонке: голос с адресом, в перемотке отвечает сам владелец. */
  const soloPair=!!(you && you.mpTag && typeof ccMpOn==='function' && ccMpOn());
  if(CC_FF && !(typeof ccRaceLock==='function' && ccRaceLock()) && !soloPair){
    const mine=careerSpotZone(ccNightSpot(ACTIVE_LANDING_SET));
    careerSpotFearOn(you);
    const groups=buildBotLandingAssignment(field.filter(t=>t!==you)).zoneGroups;
    careerSpotFearOff();
    if(mine){
      you.landingZone=mine; you.landingResult=null; you.landingRival=null;
      applyLandingPow(you, mine.points);
      if(!groups.has(mine)) groups.set(mine, []);
      groups.get(mine).push(you);
    } else {
      buildBotLandingAssignment([you], {into:groups});
    }
    return groups;
  }
  /* Where in the queue this career stands. A career field is built fresh per
     stage with no points to sort by, so it fell back to power and the player
     (usually the strongest) always picked first.
     Очередь читается по месту, которое привело сюда, а не по последнему вечеру:
     между кубком и Финалом недели стоит Victory Cup, и победа в кубке выбирала
     дроп тридцатой по виктори. Каждый раннер называет свои строки (kinds),
     читаем последнюю из них; дивизионный кубок пишет строку без kind, его слово 'cup'. */
  const rows=(CAREER.career.log||[]);
  // Строки с адресатом (who) — чужие не считаются: у соло в команде журнал общий.
  const myKey=you && you.mpTag ? you.mpTag.slice(1) : hKey(careerCard());
  let last=null;
  if(kinds && kinds.length){
    for(let i=rows.length-1; i>=0 && !last; i--){
      if(rows[i].who && rows[i].who!==myKey) continue;
      const k=rows[i].kind;
      if(kinds.indexOf(k)>=0 || (k==null && kinds.indexOf('cup')>=0)) last=rows[i];
    }
  }
  if(!last) last=rows.slice(-1)[0];
  const seat=last && last.place>0 ? clamp(last.place, 1, field.length) : 0;
  /* Оффспавн — тоже решение, а не только карта. Его спека: «когда идёт
     оффспавн до 1 зоны даётся выбор: упасть на свою локацию, законить
     кого-то». Дом у карьеры уже есть (careerSpots), сильнейший сосед в
     комнате известен, — значит два самых частых намерения можно назвать
     словами и не заставлять каждый раз искать нужный прямоугольник среди
     полусотни. Третьей строкой остаётся сама карта: она никуда не делась и
     нужна, когда хочется именно выбирать.

     Панель показывается только когда дом на этом острове есть: без него
     выбирать не из чего, и открывается карта, как открывалась. */
  /* Спрашивается ВСЕГДА, а не только когда дом уже стоит — правка:
     «насчёт локации, почему нет в финалах, early game выбор игроку». Раньше
     панель молчала на карьере без метки, и как раз в финалах, куда доходят
     раньше, чем успевают обжиться, выбора не было вовсе. Без дома первая
     строка — тихое место: та же мысль («сесть и собраться»), только адрес
     выбирает алгоритм, потому что своего адреса ещё нет. */
  /* Два хода, не три — правка: «пусть будет 2 варианта: первый — фотка
     твоей мапы, а второй контест, и там всю карту показывают».

     Так и правильнее: третья кнопка («выбрать на карте») делала ровно то же,
     что контест, только другими словами. Контест открывает остров целиком,
     где на коробках написаны ники: смотришь, кто где сидит, и летишь.

     Картинок на кнопках больше нет — правка, скриншотом того,
     как это выглядело на большом экране: две плитки во всю ширину и пустое
     поле под ними, «этого не должно быть», рядом снимок компактной панели —
     «пусть вот также будет». Фотография своей точки узнаётся по названию не
     хуже, а вопрос теперь везде одного размера: и на карте, и в ленте перед
     первой игрой. */
  /* Solo Series в команде — не командный турнир: своя точка у КАЖДОГО. Отзыв: «для соло каждому игроку нужно свою локацию выбрать».
     Метки команды (cr.spots) тут не годятся — они общие. У соло-игрока своя
     точка личная (cr.soloHome, по острову): ставится первым выбором на карте
     («законтестить») и дальше предлагается как «своя». Напарнику свой дом
     не виден — его голос «домой» несёт номер коробки (at). */
  const solo=!!(you && you.mpTag);
  const spot=solo ? null : careerSpotOn(ccNightSpot(ACTIVE_LANDING_SET));
  const home=solo ? ccSoloHomeZone(you) : careerSpotZone(ccNightSpot(ACTIVE_LANDING_SET));
  const aura=solo ? 0 : careerSpotAura(ACTIVE_LANDING_SET);
  /* Кто летит к тебе — ДО того, как выбирать.

     Правка: «перед турниром игрок понимал, конят ли его или
     нет, и после этого выбор — на свою или конить». Раньше на кнопке дома
     стояла только аура, то есть репутация точки вообще, а не сегодняшний
     вечер: узнать, что к тебе прилетели двое, можно было уже в воздухе.

     Комната расставляется здесь один раз и передаётся дальше в careerDropQuick
     — иначе число на кнопке было бы от одной раздачи, а высадка от другой. */
  let pre=o.pre||null;
  if(pre){
    // Комната уже разложена первым вопросом; свой игрок снимается с бот-коробки.
    pre.forEach(function(list){ const at=list.indexOf(you); if(at>=0) list.splice(at, 1); });
  } else {
    careerSpotFearOn(you);
    if(solo){
      /* В соло свою точку занимаем до раздачи, чтобы боты выбирали, зная, кто там (landingScore взвешивает контест
         по силе). Ауры у соло-точки нет (aura=0), и если игрок садится последним, сильнейший падает в толпу.
         tools/career-solo-qual-probe.js (комната 4900, топ-100, 10 игр): без этого карта 96 гибла на дропе 4/10 и проходила
         37%, 78-я 0%; с точкой до раздачи 96 без смертей на дропе, медиана 5-е, проход 87%, 78-я 75%.
         Сажаются все люди с известным домом в порядке меток (напарник из карточки, ccSoloHomeZoneOf), у двоих комната
         одна. Свой игрок потом снимается, его посадит ответ (домой / тихо / контест). */
      pre=new Map();
      const seated=[];
      // В гонке никого не досаживаем заранее: чей дом известен, у каждого клиента своё (см. careerSpotFearOn).
      /* И в команде вдвоём (23.10, прогон 2022: DreamHack Winter 20.11 и 27.11, игра 2 — Pixie на 56 у себя и на 9 у
         напарника, бот teeq садился на её точку). Дом напарника должен был ехать в MP.peer.soloHome, но его никто
         не пишет: в игре 1 дома ещё нет у обоих, а после первого выбора он есть только у хозяина. */
      ((typeof ccRaceLock==='function' && ccRaceLock()) || (typeof ccMpOn==='function' && ccMpOn()) ? [] : field.filter(t=>t.isYou||t.isMate))
           .sort((a,b)=>String(a.mpTag||'')<String(b.mpTag||'') ? -1 : 1)
           .forEach(h=>{
             const hz=ccSoloHomeZoneOf(h); if(!hz) return;
             h.landingZone=hz; h.landingResult=null; h.landingRival=null;
             if(!pre.has(hz)) pre.set(hz, []);
             pre.get(hz).push(h); seated.push(h);
           });
      buildBotLandingAssignment(field.filter(t=>t!==you && seated.indexOf(t)<0), {into:pre});
      pre.forEach(function(list){ const at=list.indexOf(you); if(at>=0) list.splice(at, 1); });
    } else {
      pre=buildBotLandingAssignment(field.filter(t=>t!==you)).zoneGroups;
    }
    careerSpotFearOff();
  }
  // Метки книги бросков вокруг каждого шага высадки: скриншот
  // (плей-ин) разошёлся между «dv» и «drop» без чужих обращений — теперь
  // видно, на каком именно шаге.
  ccMpMark('pre'+(o.pre ? '!' : ''));
  // Кто уже объявил свою точку — та же комната, тот же расклад, без лишних
  // бросков. См. ccDropCalls.
  const calls=ccDropCalls(pre, you, title);
  // Карта высадок комнаты: перед первой игрой этапа — карточкой в ленте вечера, и кнопкой в окне выбора.
  CC_DROP_ROOM={d:ccDropRoomData(pre, you, home), title:title||''};
  // Перед первой игрой этапа вопрос высадки встаёт ПОВЕРХ экрана вместе с картой комнаты (его слово 19.11: «показать
  // поверх экрана и подтвердить точку, чтоб не скролить ниже»). Дальше — маленькое окошко на карте, как было.
  /* Перед первой игрой этапа — всегда поверх экрана, и когда карта боя уже открыта: на финале недели она стоит с
     «Игра 1 из 6» (его скрин 19.11), и окно с картой высадок не появлялось — вопрос уходил маленьким окошком. */
  const dmFirst=!((you && you.stageLog)||[]).length;
  const rivals=home ? (pre.get(home)||[]).length : 0;
  /* Где стоит вопрос — на карте, если карта уже идёт.

     Правка: «сделай так же, как в mid гейме и late: маленькое
     окошко, и потом перебрасывает, если хочешь конить, и там кликаешь». Лут и
     высокая земля спрашиваются панелью на острове, а высадка — карточкой в
     ленте с двумя картинками во всю ширину; перед второй и каждой следующей
     игрой это значит уехать взглядом с карты, на которой идёт вечер.

     Поэтому: карта есть (вторая игра и дальше) — маленькое окошко на ней, без
     картинок, ровно как у середины игры. Карты нет (первый вопрос вечера,
     он задаётся до старта прогона) — прежняя карточка с фотографией своей
     точки и миниатюрой острова. Ходы и их последствия одни и те же. */
  const onMap=(CC_RUN_MAP && CC_RUN_MAP.isConnected) ? CC_RUN_MAP : null;
  /* Решение принимает один, комнату раскладывают оба.

     По проводу уходит ОТВЕТ ЧЕЛОВЕКА — «домой», «тихо» или «на такую-то
     коробку», — а не разложенная комната: комната у обоих уже одна и та же,
     она посчитана из одного сида (pre выше). Отправь мы Map команд, второй
     клиент получил бы чужие объекты вместо своих и разошёлся бы на первой же
     ссылке.

     Коробка называется своим МЕСТОМ в ALL_LANDING_ZONES: собственного номера
     у зоны нет (человеку показывается i+1, см. landingZoneSuffix), а сетка у
     обоих одна — тот же остров, тот же размер лобби. */
  const pics=home ? ccDropSideHTML(home, ACTIVE_LANDING_SET) : null;
  const vote=await ccMpChoose('drop'+(o.tag||''), async function(){
    // Перемотка в общей комнате: ответ без окна — домой, если дом есть, иначе тихо.
    if(CC_FF) return home ? {id:'home', at:ALL_LANDING_ZONES.indexOf(home)} : {id:'quiet', at:-1};
    const dmOv=(dmFirst && !skipAnimation && !careerSimOn()) ? ccDropOverlay(CC_DROP_ROOM.d, title) : null;
    const p=await ccChoiceBox(L().ccDropTitle,
      // Чужие объявления — прямо в подсказке: решение принимается здесь.
      L().ccDropHint+(calls ? ' · '+L().ccDropCalls+' '+calls : '')+(dmOv ? '' : ' <button class="cc-dm-open" onclick="event.stopPropagation();ccDropRoomOpen()">'+esc(L().ccDropMap)+'</button>'),
      /* Картинки — ВНУТРИ кнопок, отзыв: «внутри квадратика
         типа картинки эти». У «своей локации» — квадратик своей точки, у
         «законтестить» — остров целиком с рамкой на ней. Маленькие, слева от
         названия: плитки во всю ширину он снял 25 августа. */
      [ home ? {id:'home', title:L().ccDropHome, note:L().ccDropHomeNote(aura, rivals),
                icon:(pics ? pics.left : CC_CHOICE_ICON.home), icoCls:(pics ? 'pic' : '')}
             : {id:'quiet', title:L().ccDropQuiet, note:L().ccDropQuietNote, icon:CC_CHOICE_ICON.quiet},
        {id:'contest', title:L().ccDropContest, note:L().ccDropContestNote,
         icon:(pics ? pics.right : CC_CHOICE_ICON.contest), icoCls:(pics ? 'pic pic-wide' : '')}], dmOv ? dmOv.host : onMap, null, 'drop');
    if(dmOv) dmOv.el.remove();
    if(p.id!=='contest') return {id:p.id, at:(p.id==='home' && home) ? ALL_LANDING_ZONES.indexOf(home) : -1};
    /* Та же комната, что и на кнопке. pre посчитан выше — им и показывается
       остров, иначе «к тебе летят двое» и карта были бы двумя разными
       бросками одного и того же вечера. */
    await showFinalsLandingPicker(field, you, title, seat, pre);
    // Пикер уже поставил метку на you — её место в сетке и есть решение.
    const at=ALL_LANDING_ZONES.indexOf(you.landingZone);
    if(solo && you.isYou && at>=0) ccSoloHomeSet(at);   // выбранная коробка становится своей точкой
    return {id:'contest', at:at};
  }, function(v){
    if(!v) return '';
    if(v.id==='contest') return L().ccDropContest;
    return v.id==='home' ? L().ccDropHome : L().ccDropQuiet;
  },
  /* Вопрос о высадке задаётся перед КАЖДОЙ игрой, и к этому моменту таблица
     уже содержит всё, что случилось раньше. Лучшего места для сверки нет:
     номер игры берётся из журнала своей команды. */
  ((you.stageLog||[]).length+1)+'|'+ccTableHash(field)+'|'+CC_MP_ROLLS);
  const said=vote.v;
  ccMpMark('dv:'+String(said.id)+(said.at!=null ? '@'+said.at : ''));
  // Свой дом в соло приезжает номером коробки — и у напарника, и у себя.
  /* Дом — ТОЛЬКО по номеру коробки из голоса, у владельца тоже: свой объект дома мог быть
     клеткой крупной сетки, которой нет в ALL_LANDING_ZONES (indexOf → -1), и тогда владелец
     садился домой, а соседи ставили его «тихо» — сила команды на коробку расходилась на
     единицу (годовая проба 9.09: play-in 23.01, игра 8, live1+sky:116 vs 117). */
  const homeZ=(solo && said.id==='home') ? (said.at>=0 ? ALL_LANDING_ZONES[said.at] : null) : home;
  if(said.id!=='contest'){
    const q=await careerDropQuick(field, you, said.id, homeZ, pre);
    ccMpMark('dq');
    return q;
  }
  /* Коробку нажимали ОБА, а сядет команда в одну.

     Пикер каждого уже поставил свою метку: pickInitialZone пишет landingZone,
     зовёт applyLandingPow и толкает команду в свою группу комнаты. Победил
     один голос — значит комнату надо привести к общему виду, и делается это
     ОДНИМ И ТЕМ ЖЕ кодом с обеих сторон: своя метка снимается отовсюду и
     ставится заново по месту в сетке. Ветки «а я ли выбирал» здесь нет
     нарочно — она и была бы тем местом, где двое разъезжаются.

     applyLandingPow это переживает: он сам снимает прошлую прибавку, прежде
     чем положить новую. А одиночная карьера проходит здесь же и приходит к
     тому же — её собственная метка снимается и ставится обратно. */
  /* Комнату перестраивает ОТВЕТ, а не тот, кто его дал.

     Пикер открывает один из двоих, и вместе с показом он перестраивал состав
     — выбрасывал тёзок и ставил тебя первым. У напарника этого не
     происходило, и дальше они играли разные вечера. Теперь перестройка
     зовётся с обеих сторон, ровно на том ответе, на котором она случается. */
  ccLandingNormalize(field, you);
  ccMpMark('nz');
  const z=(said.at>=0) ? ALL_LANDING_ZONES[said.at] : null;
  // Места в сетке нет — трогать нечего, метка пикера остаётся как была.
  if(!z) return pre;
  pre.forEach(function(list){
    const at=list.indexOf(you);
    if(at>=0) list.splice(at, 1);
  });
  you.landingZone=z; you.landingResult=null; you.landingRival=null;
  applyLandingPow(you, z.points);
  if(!pre.has(z)) pre.set(z, []);
  pre.get(z).push(you);
  // И дом на острове — тоже по ответу, у обоих.
  ccLandingSpot(z);
  return pre;
}
/* Высадка без карты: домой или в чужую коробку.

   Комната расставляется тем же алгоритмом, что и всегда, — сначала боты, потом
   мы садимся поверх. «Законтестить» ищет самую сильную занятую коробку: это и
   есть смысл контеста — не «к кому-нибудь», а к тем, кого надо выбить, чтобы
   вечер стал твоим. */
async function careerDropQuick(field, you, how, home, pre){
  /* Раздача приходит готовой, когда её уже посчитали для вопроса: число «к
     тебе летят двое» на кнопке и та комната, в которую садишься, обязаны быть
     одним и тем же броском. Без неё — считаем сами, как считали. */
  let zoneGroups=pre;
  if(!zoneGroups){
    careerSpotFearOn(you);
    zoneGroups=buildBotLandingAssignment(field.filter(t=>t!==you)).zoneGroups;
    careerSpotFearOff();
  }
  let zone=home;
  if(how==='contest') zone=await careerContestPick(zoneGroups) || home;
  /* Тихое место — самая ненаселённая коробка, а среди равных самая богатая.

     Не «первая свободная»: в дивизионной комнате полсотни команд на три
     десятка коробок, свободных не остаётся вовсе, и правило «ищи пустую»
     молча возвращало бы занятую. «Тихо» — это про число соседей, и оно
     считается всегда, сколько бы народу ни было на острове. */
  if(how==='quiet' || !zone){
    let best=null, bestBusy=Infinity, bestPts=-Infinity;
    ALL_LANDING_ZONES.forEach(z=>{
      const busy=(zoneGroups.get(z)||[]).length;
      if(busy<bestBusy || (busy===bestBusy && z.points>bestPts)){
        bestBusy=busy; bestPts=z.points; best=z;
      }
    });
    zone=best||ALL_LANDING_ZONES[0];
  }
  you.landingZone=zone; you.landingResult=null; you.landingRival=null;
  applyLandingPow(you, zone.points);
  if(!zoneGroups.has(zone)) zoneGroups.set(zone, []);
  zoneGroups.get(zone).push(you);
  return zoneGroups;
}
/* К кому лететь — выбирает игрок, по никам.

   Правка: «законтестим летим, куда хочешь — смотришь на ники и летишь».
   Контест это не «к сильнейшим вообще», а к конкретным людям: в комнате сидят
   Focus, Malibuca, Scroll, и лететь на них — разные вечера. Поэтому вместо
   автоматического выбора показывается короткий список занятых коробок с их
   составами; сортировка по силе, потому что верх списка — это те, ради кого
   контест вообще затевают.

   Список короткий нарочно: сорок девять чужих коробок — это уже карта, а карта
   есть отдельным ходом для тех, кому нужна именно она. */
const CC_CONTEST_SHOW=4;
function careerContestPick(zoneGroups){
  const spots=[];
  zoneGroups.forEach((group, z)=>{
    if(!group || !group.length) return;
    spots.push({zone:z, group:group,
                pow:group.reduce((m,t)=>Math.max(m, t.pow||0), 0)});
  });
  if(!spots.length) return Promise.resolve(null);
  spots.sort((a,b)=>b.pow-a.pow);
  const top=spots.slice(0, CC_CONTEST_SHOW);
  const names=g=>g.map(t=>String(t.name||'').replace(/<[^>]*>/g,'').trim())
                  .join(' · ').slice(0, 90);
  return ccChoiceBox(L().ccContestTitle, L().ccContestHint,
    top.map(s=>({id:'z', zone:s.zone,
                 title:names(s.group),
                 note:L().ccContestNote(Math.round(s.pow), s.zone.points)})), null, null, 'drop')
    .then(pick=>pick && pick.zone);
}

/* Who is in the room at a LAN. A LAN is where the other six regions show up, all real duos off real
   leaderboards, same tables the draft mode uses for Antwerp:
   the Summit  each region's Major 1 Grand Finals, top N by SUMMIT_SLOTS (EU 20,
   NAC 13, BR 5, NAW/ASIA/ME/OCE 3 each), SUMMIT_SCQ_SLOTS for Second Chance.
   Antwerp     GC_SUMMIT_DUOS (15 from the Summit), GC_MAJOR2_DUOS (25 from Major 2).
   Europe's seats are the duos the career actually played against (as in
   buildSummitField). Foreign duos go through careerTeam so they keep standing-pair
   synergy; otherwise every non-EU seat would lose 5 power. */
// A real duo's cards, at the ratings the roster holds for them. gcFindCard is
// the draft mode's lookup and it takes the strongest card a handle has, which
// for a LAN qualifier is their Grand Finals card.
// Null when either player is already in the room. The check is on the resolved
// cards as well as on the names that were asked for: Liquipedia and Tracker
// write four of these people differently and GC_HANDLE_ALIAS bridges them, so
// two different spellings can land on one card and seat somebody twice.
/* Third chair at a LAN in a trio season. LAN seats are real duos (GC_SUMMIT_DUOS, GC_MAJOR2_DUOS,
   gcRegionFinals per region), so without this the player plays 3v2.
   Same rule as careerCupField: the recorded pair stays whole and a third comes from the back of the region's
   queue, read bottom up, so a future core isn't used as filler. What the queue can't cover comes from the ladder.
   */
let CC_LAN_THIRD_POOL={};
function ccLanPool(reg){
  const key=String(reg||'EU');
  if(CC_LAN_THIRD_POOL[key]) return CC_LAN_THIRD_POOL[key];
  const out=[];
  // Major 2's leaderboard first because it is the more recent month, then Major
  // 1's for the regions whose Major 2 list is short. Reversed: the bottom of a
  // qualifier is who is left once the seats are taken.
  ['m2','m1'].forEach(set=>gcRegionFinals(set, key)
    .forEach(e=>(e.duo||[]).forEach(h=>out.push(h))));
  out.reverse();
  CC_LAN_THIRD_POOL[key]=out;
  return out;
}
/* Третьим на ЛАН не может быть тот, у кого есть своя пара. Иначе комната брала третьих с доски региона по силе,
   а сильнейшие там как раз в парах: Scroll & Sky не приезжали целиком, Scroll стоял третьим у Malibuca & vic0, Sky
   у Shxrk & t3eny (tools/career-lan-duos-probe.js).
   Доска для третьего читается без тех, кто в живой паре сцены (careerPools().duos, тот же список, что у кубков и
   Мейджоров). Половинки распавшихся пар идут третьими, как раньше. */
function ccLanPaired(){
  try{
    const s=new Set();
    (careerPools().duos||[]).forEach(d=>(d.cards||[]).forEach(c=>{
      if(c && c.handle) s.add(_gcNorm(c.handle));
    }));
    return s;
  }catch(e){ return new Set(); }
}
function ccLanThird(reg, seated, ovr){
  const pool=ccLanPool(reg);
  const paired=ccLanPaired();
  const want=(ovr==null?CC_LAN_OVR:ovr);
  /* Третьего на ЛАН берём ближайшего по рейтингу к средней пары, а не первого свободного по доске региона
     (порядок доски с силой не связан, чемпионам доставались ноунеймы). ЛАН собирается своим кодом, мимо ccPickThird
     и CC_TRIO_BAND. Без этого средний разрыв -15.6 и 84% троек за полосой (tools/trio-third-gap-probe.js).
     Разрыв 0: выходим сразу. */
  /* Сравниваются по силе только те, у кого карточка ЕСТЬ.

     Не по следам бага, а чтобы его не завести: gcFindCard, не найдя ник в пуле
     ЛАНа, выдумывает карточку с тем рейтингом, который ей передали запасным. А
     передаём мы сюда среднюю пары — значит у любого неизвестного ника разрыв
     выходил бы ровно ноль, он побеждал бы мгновенно и выходил на break раньше
     всех настоящих. Третьим вставал бы первый ник без карточки, проштампованный
     силой пары.

     На нынешнем поле ЛАНа таких нет — замер до и после этой строки совпал до
     десятой, — но правило дешёвое, а ловушка настоящая. Ник без карточки в
     перебор по силе не входит; за него отвечает выдуманный третий ниже, у
     которого рейтинг назван честно. */
  const idx=gcCardIndex(ccNowYear());
  const known=h=>{
    const k=_gcNorm(h);
    return !!(idx[k] || idx[_gcNorm(GC_HANDLE_ALIAS[k]||'')]);
  };
  let best=null, bestGap=Infinity;
  for(let i=0;i<pool.length;i++){
    const h=pool[i];
    if(seated.has(_gcNorm(h)) || paired.has(_gcNorm(h)) || !known(h)) continue;
    const c=gcFindCard(h, reg, want, ccNowYear());
    if(!c || seated.has(_gcNorm(c.handle)) || paired.has(_gcNorm(c.handle))) continue;
    const gap=Math.abs(ccCardOvr(c)-want);
    if(gap<bestGap){ bestGap=gap; best={h:h, c:c}; if(gap===0) break; }
  }
  if(best){
    seated.add(_gcNorm(best.h)); seated.add(_gcNorm(best.c.handle));
    return best.c;
  }
  // Nobody left on that region's boards. A made-up name is better than a duo in
  // a trio lobby, and it is what a cup field falls back to as well.
  const rnd=careerRng(careerSeed(CAREER.career, 'lan3:'+String(reg||'EU')));
  const taken=new Set(Array.from(seated));
  const c=careerLadderPlayer(rnd, want, taken, null, null, ccTrioGenTop(want));
  seated.add(_gcNorm(c.handle));
  return c;
}
/* Третий на ЛАНе тот же, с кем пара играет весь сезон.
   Кубки помнят состав в cr.trios, а Саммит, Глобалы и Париж звали ccLanThird, который каждый раз брал ближайшего по силе. По tools/career-trio-drift-probe.js: кубки 0-2% смен, ЛАН 9 из 9 с другим третьим.
   Внутри сезона состав стоит, разводит тройки только межсезонье (careerTriosCarry).
   Поэтому ЛАН сначала смотрит память, и только если её нет (или человек уже в другой команде комнаты) выбирает по силе и записывает выбор. */
function ccLanTrioThird(cards, reg, room, avg){
  const cr=CAREER && CAREER.career;
  // Память — про ПАРУ. Ключ тот же, что у careerCupField: ники, строчными,
  // по алфавиту через плюс.
  const memo=(cr && cr.trios && cards.length===2) ? cr.trios : null;
  const key=memo ? cards.map(c=>hKey(c)).sort().join('+') : null;
  if(memo){
    const want=memo[key];
    if(want && !room.has(_gcNorm(want))){
      // Тройка ездит вместе: если её третьего нет на доске этого региона,
      // карточку ему всё равно найдут — он приехал с ними.
      const c=gcFindCard(want, reg, avg, ccNowYear());
      if(c && !room.has(_gcNorm(c.handle))){
        room.add(_gcNorm(want)); room.add(_gcNorm(c.handle));
        return c;
      }
    }
  }
  /* Не сел — но состав от этого не меняется.

     На ЛАНе комната собрана из дуо-досок региона, и запомненный третий вполне
     может сидеть в ней СВОЕЙ парой: дважды одного человека в зал не посадишь.
     Тогда его место на этот вечер занимает ближайший по силе — но память об
     этом не переписывается, иначе один такой вечер уводил бы тройку и во всех
     кубках после него. Записываем только тогда, когда помнить было нечего. */
  const c=ccLanThird(reg, room, avg);
  if(c && memo && c.handle && !memo[key]) memo[key]=hKey(c);
  return c;
}
/* ПАРА НА ЛАНЕ — ТА, ЧТО НА СЦЕНЕ КАРЬЕРЫ, А НЕ ИЗ НАСТОЯЩЕГО СПИСКА.

   Notion 12.10: «в дуо свизи квалится с ванякеком на глобалы, а играет их всё равно с пикси… чтобы они
   реально сплитались». Места ЛАНа без записи сыгранного этапа садятся настоящими списками (GC_SUMMIT_DUOS,
   доски m1/m2, Форт-Уэрт): SwizzY & Pixie, хотя сцена карьеры (careerPools) свела SwizzY с Vanyak3kk.
   Теперь строка списка сверяется со сценой: если у первого есть пара на сцене и это не второй — едет он со
   своей парой; иначе так же по второму. Никого на сцене нет — строка как была. */
function ccLanSceneDuo(duo){
  if(!Array.isArray(duo) || duo.length!==2 || typeof CAREER==='undefined' || !CAREER || !CAREER.career) return duo;
  let duos=[];
  try{ duos=(careerPools()||{}).duos||[]; }catch(e){ return duo; }
  const mateOf=h=>{
    const k=hKey(h);
    for(let i=0;i<duos.length;i++){
      const cs=(duos[i].cards||[]).filter(Boolean);
      if(cs.length===2 && cs.some(c=>hKey(c)===k)) return cs.find(c=>hKey(c)!==k) || null;
    }
    return null;
  };
  const a=mateOf(duo[0]);
  if(a && hKey(a)===hKey(duo[1])) return duo;
  if(a && a.handle) return [duo[0], a.handle];
  const b=mateOf(duo[1]);
  if(b && b.handle && hKey(b)!==hKey(duo[0])) return [b.handle, duo[1]];
  return duo;
}
function ccLanTeam(duo, region, fallbackOvr, seated){
  duo=ccLanSceneDuo(duo);
  // Карьера играет свой год — и на ЛАНе тоже. См. gcCardIndex.
  const cards=duo.map(h=>gcFindCard(h, region, fallbackOvr, ccNowYear()));
  if(seated){
    const keys=duo.map(_gcNorm).concat(cards.map(c=>_gcNorm(c.handle)));
    if(keys.some(k=>seated.has(k))) return null;
    keys.forEach(k=>seated.add(k));
  }
  /* And in a trio season, the seats the season has.

     The region is the one the seat came through where the caller knows it; the
     Summit's fifteen are a list of all seven regions at once, so the card's own
     region answers for them. */
  const per=careerSquadSize();
  if(per>cards.length){
    // Тот же рынок, что у кубков: ЛАН может оказаться первой трио-комнатой
    // года. См. ccTrioMarket.
    if(typeof ccTrioMarket==='function') ccTrioMarket(null);
    const room=seated || new Set(cards.map(c=>_gcNorm(c.handle)));
    const reg=region || (cards[0] && cards[0].region) || 'EU';
    const avg=Math.round(cards.reduce((s,c)=>s+attrsFor(c).ovr,0)/cards.length);
    while(cards.length<per){
      // Через ccLanTrioThird — состав пары помнит сама карьера.
      const x=ccLanTrioThird(cards, reg, room, avg);
      if(!x) break;
      cards.push(x);
    }
  }
  const t=careerTeam(cards);
  t.name=teamLabel(cards);
  t.lanRegion=region;
  /* Регионы на ЛАНе не равны, а нормализация делала их равными — и даже
     наоборот. Рейтинг считается внутри региона («after the region is
     normalised»), так что верхушка НАК приезжала в Антверпен с европейскими
     числами: замер career-lan-region-probe.js — средняя сила НАК-состава
     101.8 против 99.8 у ЕС, 47% титулов при 28% мест, жалоба игрока «дуо
     с америки всё выигрывают». Его ориентир, 22 августа: «последние ланы
     выигрывали еу, они сильнее но не намного». Минус полтора — по той же
     пробе ЕС берёт около двух третей титулов, НАК около трети и стоит вторым,
     а их лучшие дуо остаются в верхушке списка победителей. Остальные регионы
     и так везут 70-87 силы и титулов не берут — их не трогаем. */
  const lanHome=region || (cards[0] && cards[0].region) || 'EU';
  /* И поправка считается НА КАРТОЧКУ, а не на команду: перекос в −1.5 меряли
     на дуо, а нормализация рейтинга внутри региона едет с каждым человеком —
     в тройке таких карточек три, и перекос растёт вместе с составом. Отсюда
     множитель per/2: у дуо всё как было, у трио −2.25. Замер того же дня
     (tools/trio-region-probe.js, зал Глобалов в трио-год): титулы 87/113 в
     пользу НАК до этой строки. */
  t.pow += (CC_LAN_REGION_EDGE[lanHome]||0)*(per/2);
  return t;
}
const CC_LAN_REGION_EDGE={NAC:-1.5};
// The top N duos of a leaderboard that are not already seated somewhere, built.
// In finishing order rather than drawn: who qualified is a fact, not a roll.
function ccLanSeats(entries, count, region, seated, ovr){
  const out=[];
  (entries||[]).forEach(e=>{
    if(out.length>=count) return;
    const duo=(e.duo||[]).slice(0, 2);
    if(duo.length<2) return;
    // Регион строки, когда список знает его сам (GC_SUMMIT_DUOS — все семь регионов разом).
    const t=ccLanTeam(duo, e.reg||region, ovr==null?CC_LAN_OVR:ovr, seated);
    if(t) out.push(t);
  });
  return out;
}
/* Регион пары по её карточкам — для списка, в котором семь регионов вперемешку. Без него
   ccLanTeam звал третьего с ЕВРОПЕЙСКОЙ доски (ccLanPool(null) — 'EU') к любой паре мира:
   Peterbot & Pollo ездили на Глобалы с европейцем. Тестер 21.09: «слишком много во втором
   сезоне европейцев переезжает на америку». */
function gcDuoRegion(duo){
  const cnt={};
  (duo||[]).forEach(h=>{ const c=gcFindCard(h, null, 0, ccNowYear()); const r=c && c.region; if(r) cnt[r]=(cnt[r]||0)+1; });
  const best=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a])[0];
  return best||'EU';
}
function ccLanRowsReg(list){ return (list||[]).map(d=>({duo:d, reg:gcDuoRegion(d)})); }
/* ЧУЖОЙ РЕГИОН В ТРИО-ГОД — СВОЕЙ СЦЕНОЙ, А НЕ СПИСКОМ 2026-ГО.

   Трио-год держит один снимок на весь сезон (ccSnapshotNow), тройки чужих регионов живут в
   cr.trios и в пулах ccAsRegion — их и показывает лента чужих регионов. ЛАН же сажал чужие
   регионы статическими списками дуо 2026-го (GC_MAJOR2_DUOS, доски m1/m2): пары, которые
   рынок сезона развёл (careerTrioRaids), на ЛАНе снова сидели вместе, их третьи ехали к
   другим, тёзки с чужих досок садились чужими картами. Замер (tools/trio-season2-lan-probe.js):
   7 команд из 32 на Глобалах из людей разных регионов, у 5 пар из 13 третий не тот, что на
   Саммите. Теперь чужой регион в трио-год садится своей комнатой — той же, что строит
   careerCupField под ccAsRegion (пул региона, память троек, подбор по силе), — как свой
   регион садится через ccGcOwnSeats. Дуо-год и годы 2024/2025 не тронуты: там списки
   настоящие. Просим с запасом: верх региона по большей части уже сидит в зале. Возвращает
   null там, где правило не действует, — вызывающий тогда идёт старой дорогой. */
function ccLanAwaySeats(reg, n, drafted, seated, tag){
  if(!(n>0)) return [];
  if(careerSquadSize()!==3 || ccCalYear()<2026 || ccNowYear()<2026) return null;
  const cr=CAREER && CAREER.career; if(!cr) return null;
  const lanCr=Object.assign({}, cr, {division:1});
  const build=()=>careerCupField(lanCr, drafted||[], n+24, String(tag||'lan')+'|'+reg, false, CC_FIELD_SHARP.lan);
  let room=null;
  try{ room=(reg===ccCareerRegion()) ? build() : ccAsRegion(reg, build); }catch(e){ room=null; }
  if(!room) return null;
  // Занятыми помечаются только те, кто сел: помеченный, но не севший, пропал бы из зала.
  const out=[];
  for(const t of room){
    if(out.length>=n) break;
    const keys=(t.squad||[]).map(c=>_gcNorm(c && c.handle));
    if(keys.some(k=>seated.has(k))) continue;
    keys.forEach(k=>seated.add(k));
    t.summitRegion=reg;
    out.push(t);
  }
  return out;
}
/* ВСЕ ТУРНИРЫ — ОТ СИМУЛЯЦИИ, А НЕ ОТ НАСТОЯЩИХ ДАННЫХ (его слово 12.10).

   Чужие регионы садились на ЛАНы 2026-го настоящими досками (gcRegionFinals m1/m2, GC_MAJOR2_DUOS,
   GC_SUMMIT_DUOS, сорок пар Парижа RC_TEAMS_2026): кто прошёл в жизни, тот и ехал, как бы ни сложился
   год карьеры. Теперь у каждого региона свой квал, сыгранный симуляцией: комната региона — его сцена
   (careerCupField под ccAsRegion: пары карьеры, разводы, трансферы), десять игр движком, порядок финиша.
   ev — какой это квал: 'm1' (Мейджор 1 → Саммит), 'm2' (Мейджор 2 → Глобалы и добор), 'lcq' (Ласт
   Ченс), 'rc' (отбор в Париж). Итог пишется в сейв на сезон (cr.lanSim): Саммит идёт три дня, Глобалы
   два — зал не должен пересобираться между днями, а в гонке у всех один и тот же (ccWorldRun). */
const CC_LAN_SIM_KEEP=30, CC_LAN_SIM_GAMES=10;
/* В сейве строка — «ник~рейтинг» на человека (полная запись ccStageSeatRow весила 166 КБ за сезон). */
function ccLanSimPack(row){ return row.map(x=>String(x.h)+'~'+(x.o||0)).join('|'); }
function ccLanSimUnpack(str, reg){
  return String(str||'').split('|').filter(Boolean).map(p=>{ const i=p.lastIndexOf('~');
    return {h:i>0 ? p.slice(0, i) : p, o:i>0 ? (+p.slice(i+1)||0) : 0, r:reg}; });
}
function ccLanSimRanked(reg, ev, drafted){
  const cr=CAREER && CAREER.career; if(!cr) return null;
  const size=careerSquadSize();
  const box=cr.lanSim=(cr.lanSim && cr.lanSim.season===cr.season && cr.lanSim.size===size) ? cr.lanSim : {season:cr.season, size:size};
  const key=ev+'|'+reg;
  if(Array.isArray(box[key])) return box[key].map(p=>ccLanSimUnpack(p, reg));
  const lanCr=Object.assign({}, cr, {division:1});
  const n=ccTeams(50);
  const salt='lansim|'+cr.season+'|'+key;
  let rows=[];
  CC_BOT_EDGE_HOLD++;
  try{ ccWorldRun(salt, ()=>{
    const build=()=>careerCupField(lanCr, drafted||[], n, salt, false, CC_FIELD_SHARP.lan);
    const room=((reg===ccCareerRegion()) ? build() : ccAsRegion(reg, build)).filter(t=>t && !t.isYou && !t._stub);
    if(room.length<2) return;
    room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
    ccWithEventSize(size, ()=>simulateGames(room, CC_LAN_SIM_GAMES, majorPoints, CC_M24_KILL));
    rows=room.slice().sort((a,b)=>(b.stagePts||0)-(a.stagePts||0) || (b.wins||0)-(a.wins||0) || (b.stageElims||0)-(a.stageElims||0))
      .slice(0, CC_LAN_SIM_KEEP).map(t=>ccStageSeatRow(t).map(x=>Object.assign(x, {r:reg})));
  }); } finally { CC_BOT_EDGE_HOLD--; }
  box[key]=rows.map(ccLanSimPack);
  return rows;
}
// Верх симулированного квала региона, мимо тех, кто уже сидит в зале. null — правило не действует (не карьера).
function ccLanSimSeats(reg, n, drafted, seated, ev){
  if(!(n>0)) return [];
  let rows=null;
  try{ rows=ccLanSimRanked(reg, ev, drafted); }catch(e){ console.error('ccLanSimRanked', reg, ev, e); rows=null; }
  if(!rows || !rows.length) return null;
  const per=careerSquadSize(), out=[];
  for(const row of rows){
    if(out.length>=n) break;
    const keys=row.map(x=>_gcNorm(x.h));
    if(keys.some(k=>seated.has(k))) continue;
    const t=ccAsRegion(reg, ()=>ccStageTeamFrom(row));
    if(!t) continue;
    keys.forEach(k=>seated.add(k));
    t.summitRegion=reg; t.lanRegion=reg;
    t.pow+=(CC_LAN_REGION_EDGE[reg]||0)*(per/2);   // та же поправка региона, что у ccLanTeam
    out.push(t);
  }
  return out;
}
// Саммит, сыгранный симуляцией: финальный зал careerSummitField без игрока, восемь игр, порядок финиша.
function ccLanSummitSim(drafted){
  const cr=CAREER && CAREER.career; if(!cr) return null;
  const size=careerSquadSize();
  const box=cr.lanSim=(cr.lanSim && cr.lanSim.season===cr.season && cr.lanSim.size===size) ? cr.lanSim : {season:cr.season, size:size};
  // Строка Саммита — «регион#ник~рейтинг|…»: зал мировой, регион у каждой строки свой.
  if(Array.isArray(box['summit|all'])) return box['summit|all'].map(p=>{
    const s=String(p), i=s.indexOf('#'); return ccLanSimUnpack(s.slice(i+1), s.slice(0, i)||ccCareerRegion()); });
  let rows=[];
  CC_BOT_EDGE_HOLD++;
  try{
    ccWorldRun('lansim|'+cr.season+'|summit', ()=>{
      const stub={name:'-', pow:0, squad:[], _stub:true, isYou:true, stagePts:0};
      const room=(careerSummitField('final', stub, drafted||[])||[]).filter(t=>t && !t._stub && !t.isYou);
      if(room.length<2) return;
      room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
      ccWithEventSize(size, ()=>simulateGames(room, 8, majorPoints, CC_M24_KILL));
      rows=room.slice().sort((a,b)=>(b.stagePts||0)-(a.stagePts||0) || (b.wins||0)-(a.wins||0) || (b.stageElims||0)-(a.stageElims||0))
        .slice(0, CC_LAN_SIM_KEEP).map(t=>ccStageSeatRow(t).map(x=>Object.assign(x, {r:x.r||t.summitRegion||t.lanRegion||ccCareerRegion()})));
    });
  }catch(e){ console.error('ccLanSummitSim', e); return null; }
  finally { CC_BOT_EDGE_HOLD--; }
  if(!rows.length) return null;
  box['summit|all']=rows.map(r=>((r[0] && r[0].r) || ccCareerRegion())+'#'+ccLanSimPack(r));
  return rows;
}
// A written-down list of duos, read the same way a leaderboard is.
function ccLanRows(list){ return (list||[]).map(d=>({duo:d})); }
// Nobody plays a LAN they are not in. A room built from allocations can leave
// the player out of a stage they earned — the Grand Finals seats the Upper's
// top 25 and the career's own seed is not what decided that — so the seat is
// held open rather than hoped for.
function ccSeatYou(room, you){
  if(room.indexOf(you)<0) room[room.length-1]=you;
  return room;
}
const CC_LAN_OVR=88;

/* The Summit, Düsseldorf. Format is Epic's (see SUMMIT_SLOTS):
   Upper Bracket  50 Major 1 qualifiers, 6 games, top 25 to Grand Finals.
   Lower Bracket  25 dropped + 25 from Second Chance, 6 games, a Victory Royale
   advances instantly, the rest of 25 on points.
   Grand Finals   50 duos, 8 games. Отсечка нижней 25, не 19: иначе финал добирал
   6 мест посевом из вылетевших. См. careerSummitField, tools/check-career-summit-carry.js.
   EU: top 20 of Major 1 Grand Finals to Upper, next 8 to Second Chance, read off
   history. Purse PRIZE_TABLES.SUMMIT ($250,000 1st of $1,296,000), hence reach x9. */
const CC_SUMMIT_STAGE={
  scqplay:{games:10, kill:4, field:150, cut:15, pts:majorPoints},   // = CC_SCQ_PLAY (ниже), для карточки дня
  scq:{games:6, kill:4, field:50, cut:0, pts:majorPoints},          // = CC_SCQ_FINAL
  upper:{games:6, kill:3, field:50, cut:25, pts:majorPoints},
  lower:{games:6, kill:3, field:50, cut:25, pts:majorPoints},
  final:{games:8, kill:4, field:50, cut:0,  pts:majorPoints}
};
const CC_SUMMIT_DAY={Upper:'upper', Lower:'lower', Final:'final', SCQPlay:'scqplay', SCQ:'scq'};
/* Второй шанс. Открытый день у Epic — весь дивизион 1 без места на Саммите (в Европе около пятисот дуо), и в финал
   выходят пятьдесят. Карьера играет его своей комнатой на сто пятьдесят, поэтому черта та же доля: пятнадцать.
   Сколько игр в открытый день, Epic не пишет — десять, как в открытых раундах FNCS (оценка режима). Финал — как у
   Epic: пятьдесят дуо, шесть игр, счёт финалов (65 за победу, 4 за элим). */
const CC_SCQ_PLAY={games:10, kill:4, field:150, cut:15, pts:majorPoints};
const CC_SCQ_FINAL={games:6, kill:4, field:50, cut:0, pts:majorPoints};
// Призы финала по регионам — Liquipedia, FNCS 2026 Major 1 Summit: Second Chance Qualifier (EU/NAC $23 000, прочие $10 200).
const CC_SCQ_PRIZE_BIG=[1000,1000,1000,1000,1000,1000,1000,1000,1000,1000, 800,800,800,800,800, 600,600,600,600,600,
  400,400,400,400,400,400,400,400,400,400, 200,200,200,200,200,200,200,200,200,200];
const CC_SCQ_PRIZE_SMALL=[1000,1000,1000,800, 400,400,400,400,400,400, 200,200,200,200,200,200,200,200,200,200,
  100,100,100,100,100,100,100,100,100,100, 100,100,100,100,100,100,100,100,100,100];
function scqPrize(place){
  const reg=ccCareerRegion();
  const t=(reg==='EU' || reg==='NAC') ? CC_SCQ_PRIZE_BIG : CC_SCQ_PRIZE_SMALL;
  return t[place-1]||0;
}
// Запись Второго шанса этого сезона: {season, play:'pass'|'out', pass:true|false, place, rows}.
function ccScqOf(){
  const cr=CAREER && CAREER.career; const r=cr && cr.scq;
  return (r && r.season===cr.season) ? r : null;
}
const CC_SUMMIT_ORDER=['upper','lower','final'];
const CC_SUMMIT_EU_MAIN=20, CC_SUMMIT_EU_SCQ=28;
/* Сколько мест на Саммит даёт СВОЙ регион.

   Epic пишет квоты по регионам (SUMMIT_SLOTS / SUMMIT_SCQ_SLOTS): Европе
   двадцать в основную сетку и восемь во Второй шанс, Океании три и два. До
   26 августа карьера считала эти двадцать и восемь всем подряд — и в Океании
   на Саммит проходило четвёртое место, которого там не бывает.

   Возвращает и границу мест: main — до какого места дают основную сетку,
   scq — до какого Второй шанс. */
function ccSummitSlots(){
  const reg=ccCareerRegion();
  const main=SUMMIT_SLOTS[reg]!=null ? SUMMIT_SLOTS[reg] : CC_SUMMIT_EU_MAIN;
  const scq =SUMMIT_SCQ_SLOTS[reg]!=null ? SUMMIT_SCQ_SLOTS[reg]
            : (CC_SUMMIT_EU_SCQ-CC_SUMMIT_EU_MAIN);
  return {main:main, scq:scq, upTo:main+scq};
}
function careerSummitOn(iso){
  const e=(careerYearDays().get(iso)||[]).find(x=>x.kind==='summit');
  if(!e) return null;
  const m=String(e.id||'').match(/^Summit_(Upper|Lower|Final|SCQPlay|SCQ)$/);
  return m ? {stage:CC_SUMMIT_DAY[m[1]], id:e.id, label:e.label} : null;
}
// Where Major 1 left you: the placing in its European Grand Finals is the whole
// entry list. Read off the log, so a career that skipped the Major has nothing
// to show and stays home, which is what happens.
/* Что даёт финал этого Мейджора — одной строкой на его карточку.

   Числа не выдуманы: Мейджор 1 отправляет на Саммит топ-20 европейского
   гранд-финала и до 28-го во Второй шанс (CC_SUMMIT_EU_MAIN/SCQ, у Epic это
   места в финале на пятьдесят дуо), Мейджор 2 — по региональной квоте
   MAJOR2_GC_SLOTS. Обе цифры проходят через ccTeams, потому что трио-сезон
   играет финал на тридцать три команды, а не на пятьдесят, и доля региона
   должна ехать вместе с ним. */
function ccMajorSeatNote(ev){
  if(!ev || ev.stage!=='final') return '';
  if(ev.y24) return L().ccMajSeatGc24(ccGc24Seats(ev.n));
  if(ev.y23) return L().ccMajSeatGc23(ccGc23Seats('m'+ev.n));
  if(ev.y22) return L().ccMajSeatInv22(ccInv22Quota());
  if(ev.y21) return ev.n===5 ? '' : L().ccMajSeatGr21;
  if(ev.yx) return '';
  /* 2025: финал Мейджора везёт в Лион по квоте региона (GC2025_M*_SEATS, как ccGlobalsSeat); FNCS Showdown
     мест на ЛАН не давал. Раньше сюда шли строки 2026-го — Саммит и его квоты (аудит 29.09). */
  if(typeof ccIs2025==='function' && ccIs2025()){
    if(ccMajorIsShowdown(ev.n)) return '';
    return L().ccMajSeatGc25(ccGcSlots(({1:GC2025_M1_SEATS, 2:GC2025_M2_SEATS, 3:GC2025_M3_SEATS})[ev.n]||GC2025_M3_SEATS));
  }
  if(ev.n===1) return L().ccMajSeatSummit(ccTeams(CC_SUMMIT_EU_MAIN), ccTeams(CC_SUMMIT_EU_SCQ));
  if(ev.n===2) return L().ccMajSeatGc(ccGcSlots(MAJOR2_GC_SLOTS));
  return L().ccMajSeatNone;
}
function ccSummitSeat(){
  const cr=CAREER.career;
  // Саммит есть только в календаре 2026-го: в прошлых годах финал Мейджора (World Cup,
  // FNCS сезона) места на ЛАН не даёт — иначе пара «держала ЛАН», которого нет.
  if(ccCalYear()<2026) return null;
  /* Этого года, а не любого.

     cr.log копится через сезоны, а место на Саммит выдаётся за финал Мейджора 1
     этого года. Без фильтра сюда попадала прошлогодняя строка — и карьера,
     пропустившая Мейджор в этом сезоне, ехала в Дюссельдорф за прошлый. Строки
     носят season с самого начала, нужен один filter. Та же правка в
     ccGlobalsSeat, и она же — вторая половина того, что чинит careerNewSeason:
     турнир принадлежит своему году с обеих сторон, и по состоянию, и по
     журналу. */
  const row=(cr.log||[]).filter(r=>r.season===cr.season).reverse()
    .find(r=>r.kind==='major' && r.stage==='final');
  if(!row || !row.place) return null;
  // Epic's twenty and twenty-eight are places in a fifty-duo Grand Final. The
  // Major a trio season plays is thirty-three teams wide, so the two lines move
  // with it — otherwise the top twenty of thirty-three walked into Düsseldorf,
  // which is a third of the region rather than Epic's share of it. See ccTeams.
  // И границы — своего региона, а не всегда европейские. См. ccSummitSlots.
  const q=ccSummitSlots();
  if(row.place<=ccTeams(q.main)) return 'main';
  return ccSummitScqSeat(row);
}
/* Нижняя сетка — только через Второй шанс (его играют, а не получают за 21–28-е место в финале Мейджора). Сейв,
   прошедший 29 апреля до появления турнира, сидит по-старому: места финала до границы Второго шанса. */
function ccSummitScqSeat(row){
  const r=ccScqOf();
  if(r) return r.pass ? 'scq' : null;
  if(String(careerToday())>'2026-04-29' && row && row.place && row.place<=ccTeams(ccSummitSlots().upTo)) return 'scq';
  return null;
}
// Без места в основной сетке: финал Мейджора 1 не дал «main» (или его не было вовсе).
function ccSummitMainSeat(){
  const cr=CAREER.career;
  const row=(cr.log||[]).filter(r=>r.season===cr.season).reverse().find(r=>r.kind==='major' && r.stage==='final');
  return !!(row && row.place && row.place<=ccTeams(ccSummitSlots().main));
}
function careerSummitCan(ev){
  if(!ev) return false;
  const cr=CAREER.career, s=cr.summit||{};
  // Второй шанс: дивизион 1 без места через Мейджор; финал — прошедшим открытый день.
  if(ev.stage==='scqplay' || ev.stage==='scq'){
    if(ccCalYear()!==2026 || cr.division!==1 || ccSummitMainSeat()) return false;
    if((cr.gaveUp||[]).indexOf('lan')>=0) return false;
    const r=ccScqOf();
    if(ev.stage==='scqplay') return !r;
    return !!(r && r.play==='pass' && r.pass==null);
  }
  if(s.got && CC_SUMMIT_ORDER.indexOf(s.got)>=CC_SUMMIT_ORDER.indexOf(ev.stage)) return false;
  // And the same for a LAN seat handed down the standings.
  const seat=((cr.gaveUp||[]).indexOf('lan')>=0) ? null : ccSummitSeat();
  if(ev.stage==='upper') return seat==='main';
  // The Lower Bracket is the Second Chance seats plus whoever dropped out of
  // the Upper: both are here for the same reason, one day later.
  if(ev.stage==='lower') return seat==='scq' || (s.got==='upper' && !s.through);
  if(ev.stage==='final') return !!s.ticket;
  return false;
}
/* The seventy-five duos in Düsseldorf, and which fifty are in tonight's room.

   Europe's twenty-eight are the career's own Division 1 — the region whose
   Major 1 it played — and the other six regions' forty-seven are the real top
   of their own Major 1 Grand Finals, by Epic's published allocation.

   The three rooms follow from that. The Upper Bracket is the fifty direct
   qualifiers. The Lower is the twenty-five from the Second Chance plus the
   twenty-five who dropped out of the Upper, and since the whole Upper is not
   simulated, the seeding stands in for who dropped: the bottom half of the
   direct fifty. The Grand Finals is the Upper's top twenty-five and the
   twenty-five who came through the Lower, by the same reading. */
function careerSummitField(stage, you, drafted){
  const cr=CAREER.career;
  const lanCr=Object.assign({}, cr, {division:1});
  const seated=new Set();
  drafted.forEach(c=>seated.add(_gcNorm(c.handle)));
  const main=[], scq=[];
  /* Every allocation here is Epic's, and Epic's are written in duos: fifty in
     the bracket, Europe's top twenty into the Upper and the next eight into the
     Second Chance. A trio season seats the same people in fewer teams, so the
     numbers convert on the way through rather than being written twice. See
     ccTeams; the room went on being fifty in a trio year until his report of
     20 August. */
  const stField=ccTeams(CC_SUMMIT_STAGE.upper.field);
  /* Своя квота — квота СВОЕГО региона, а не европейская.

     Жалоба игрока: «if you qual summit in major 1 oce there is
     like 15 oce teams and 0 eu teams in all of summit». Так и было: комната,
     которую карьера строит из своего пула, садилась в европейские двадцать и
     восемь, а Европа не получала мест вообще. Замер до правки: у карьеры из
     Океании 45 карточек OCE и одна EU, у американской — 69 NAC и ни одной EU.
     Для европейской карьеры это выглядело правильно, потому и дожило.

     Теперь так: свои места занимают те, против кого карьера играла весь сезон
     (это и есть её регион), а все остальные регионы — включая Европу —
     приезжают со своих досок ниже. Сторож — tools/check-career-summit-regions.js. */
  const mine=ccCareerRegion();
  const myMainN=ccTeams(ccSummitSlots().main), myScqN=ccTeams(ccSummitSlots().scq);
  const own=careerCupField(lanCr, drafted, myMainN+myScqN, 'summit', false, CC_FIELD_SHARP.lan);
  own.forEach(t=>(t.squad||[]).forEach(p=>seated.add(_gcNorm(p.handle))));
  const mySeat=ccSummitSeat();
  const ownMain=own.slice(0, Math.max(0, myMainN-(mySeat==='main'?1:0)));
  let ownScq =own.slice(ownMain.length, myMainN+myScqN-(mySeat==='scq'?1:0));
  /* Сыгранный Второй шанс сажает тех, кто его прошёл (запись финала), а не следующих по силе. */
  { const r=ccScqOf(); if(r && Array.isArray(r.rows) && r.rows.length){
      const mainKeys=new Set(); drafted.forEach(c=>c && mainKeys.add(_gcNorm(c.handle)));
      ownMain.forEach(t=>(t.squad||[]).forEach(c=>c && mainKeys.add(_gcNorm(c.handle))));
      const from=r.rows.filter(x=>x!=='you').map(ccStageTeamFrom).filter(Boolean)
        .filter(t=>!(t.squad||[]).some(c=>c && mainKeys.has(_gcNorm(c.handle))));
      from.forEach(t=>(t.squad||[]).forEach(c=>c && seated.add(_gcNorm(c.handle))));
      const need=Math.max(0, myScqN-(mySeat==='scq'?1:0));
      if(from.length) ownScq=from.slice(0, need).concat(ownScq.filter(t=>!from.includes(t))).slice(0, need);
    } }
  main.push(...ownMain); scq.push(...ownScq);
  (mySeat==='scq' ? scq : main).push(you);
  // Everybody else: their own leaderboard, in the order it was finished in.
  // Свой регион пропускается, потому что он уже сел выше — и это ЛЮБОЙ свой,
  // а не всегда Европа.
  Object.keys(SUMMIT_SLOTS).forEach(reg=>{
    if(reg===mine) return;
    const n=ccTeams(SUMMIT_SLOTS[reg]||0), m=ccTeams(SUMMIT_SCQ_SLOTS[reg]||0);
    // Трио-год: своей сценой региона (ccLanAwaySeats); иначе — доска Мейджора 1.
    // Симулированный Мейджор 1 региона (ccLanSimSeats); доски — только запас вне карьеры.
    const teams=ccLanSimSeats(reg, n+m, drafted, seated, 'm1') || ccLanAwaySeats(reg, n+m, drafted, seated, 'summit') || ccLanSeats(gcRegionFinals('m1', reg), n+m, reg, seated);
    main.push(...teams.slice(0, n));
    scq.push(...teams.slice(n));
  });
  const seed=a=>a.slice().sort((x,y)=>(y.pow||0)-(x.pow||0));
  const M=seed(main), S=seed(scq);
  const half=Math.round(stField/2);
  if(stage==='upper') return ccSeatYou(M.slice(0, stField), you);
  const lower=S.concat(M.slice(half)).slice(0, stField);
  /* Второй день и финал Саммита собираются из прошедших (cr.summitSeed, пишет runCareerSummit), а не новым
     посевом по силе: нижняя сетка из вылетевших из верхней плюс Второй шанс, финал из прошедших обеих.
     Остаток зала добирается посевом (карьера видит одну комнату из семи регионов). Сейв без записи
     читается по-старому, иначе Саммит на середине остался бы без второго дня. */
  const carry=ccSummitCarry();
  const teamsOf=rows=>(rows||[]).filter(r=>r!=='you').map(ccStageTeamFrom);
  /* Комната: сначала те, кто её выиграл, потом добор посевом до полного зала.

     У добора одно правило — он не сажает обратно того, кого игрок видел
     вылетевшим. Иначе шесть свободных мест финала заполнялись бы теми, кто
     вчера не прошёл нижнюю сетку (замер: пять из шести). */
  const room=(first, rest, barred)=>{
    const seen=new Set([ccSeatKey(you)]), take=[];
    const bar=new Set((barred||[]).map(ccSeatKey));
    const add=t=>{ const k=ccSeatKey(t); if(seen.has(k)) return; seen.add(k); take.push(t); };
    first.forEach(add);
    rest.forEach(t=>{ if(take.length<stField-1 && !bar.has(ccSeatKey(t))) add(t); });
    return ccSeatYou([you, ...take.slice(0, stField-1)], you);
  };
  if(stage==='lower'){
    /* Добор нижней сетки не сажает тех, кто уже прошёл верхнюю: тот же барьер и тот же код, что у финала.
       Пока рейтинги разбросаны, граница «прошёл/вылетел» не плывёт. С ЛАНом из карточек года (gcCardIndex) верх
       сжимается, в посеве появляются равные, и без барьера прошедшая команда всплывает в нижней сетке.
       Ловит check-career-summit-carry. */
    const fell=teamsOf(carry && carry.fell);
    return fell.length
      ? room(fell.concat(S), lower, teamsOf(carry && carry.upper))
      : ccSeatYou(lower, you);
  }
  const seedFinal=M.slice(0, half).concat(lower.slice(0, half)).slice(0, stField);
  const up=teamsOf(carry && carry.upper), lo=teamsOf(carry && carry.lower);
  // Добор идёт по всему залу, а не по одной посевной полусотне: из неё после
  // запрета вылетевшим остаётся мало имён, и финал недосчитывался пяти команд.
  if(up.length || lo.length)
    return room(up.concat(lo), seedFinal.concat(M, S), teamsOf(carry && carry.out));
  return ccSeatYou(seedFinal, you);
}
/* Строка команды для записи между днями Саммита, и обратно.

   Отдельно от ccMajorSeatRow: там комната одного региона, и карточка ищется в
   своей сцене. Здесь зал из семи, поэтому регион пишется в строку — иначе
   океанийская пара воскресала бы европейской. */
/* ОДИН МИР НА ВСЮ ГОНКУ (отзыв: «делай»). Записи посева — кто прошёл Плей-Ин, кто вышел
   из хитов, кто сидит в сетках Саммита, кто взял места на Глобалы — карьера пишет своей строкой
   'you': к среде состав может смениться, а место в таблице нет. Но такую запись нельзя отдать
   соседу по гонке: у него 'you' — это ОН, и запись читается как чужая. Пока записи были личными,
   у каждого гонщика были свои финалы Мейджоров, свой Саммит и свои победители — отсюда скриншот
   10.09, где у двух вкладок разные чемпионы, разный ПР и разные награды.
   В гонке своя строка пишется НАСТОЯЩЕЙ (ник, регион, рейтинг), запись целиком уезжает соседям
   книгой мира (ccRaceWorldPack.seeds), и поле следующего этапа у всех одно. Себя в этом поле
   каждый находит по карточке — тем же hasCard, которым ccRaceFieldSync сажает соперников. */
function ccRaceSeeds(){ return typeof ccRaceOn==='function' && ccRaceOn() && typeof ccRaceLive==='function' && ccRaceLive(); }
function ccSeedRow(t, you, rowFn){ return (t===you && !ccRaceSeeds()) ? 'you' : rowFn(t); }
// Есть ли я в записи прошедших: в гонке своя строка пишется никами (ccSeedRow), а не 'you'.
function ccSeedHasMe(rows){
  if(!rows || !rows.length) return false;
  if(rows.indexOf('you')>=0) return true;
  let mk=''; try{ mk=hKey(careerCard()||{handle:''}); }catch(e){}
  return !!mk && rows.some(r=>Array.isArray(r) && r.some(x=>hKey(typeof x==='string' ? x : (x && x.h) || '')===mk));
}
function ccStageSeatRow(t){
  return (t.squad||[]).map(function(c){
    const a=attrsFor(c)||{};
    return {h:c.handle, r:c.region||null, n:c.nat||null,
            o:Math.round((c._ovr!=null ? c._ovr : a.ovr)||0), k:a.roleKey||null};
  });
}
function ccStageCardFrom(rec){
  if(typeof rec==='string') rec={h:rec};
  const reg=rec.r||ccCareerRegion();
  const found=ccSceneRoster(reg).find(x=>hKey(x)===hKey(rec.h));
  if(found) return found;
  // Ника больше нет в сцене — человек всё равно играл, и место его не пустует.
  const r=clamp(Math.round(rec.o||ccBand(1)), 35, ccGenTop());
  return {handle:rec.h, nat:rec.n||null, region:reg, org:null,
          tier:'ladder', event:L().ccLadderEvent, date:'-', placement:null,
          rating:r, _targetOvr:r, _attrs:ccRookieAttrs(r, rec.k||'roleFRG')};
}
/* СБОРКА КОМАНДЫ ИЗ ЗАПИСИ — ВНЕ СЕЯНОГО ПОТОКА. Атрибуты выдуманной карточки, роли и химия
   тратят броски, а сколько именно — зависит от того, кого запись назвала: у одного гонщика
   строка ложится на карточку из своей сцены, у другого собирается заново. Скриншот
   («table,rolls @ #30 p3=6477 vs 6447», поле при этом сошлось) — ровно это. Та же обёртка, что
   у ccRaceRivalTeam. */
function ccStageTeamFrom(row){
  return ccRaceUnseeded(function(){
    const cards=row.map(ccStageCardFrom);
    const t=careerTeam(cards);
    t.name=teamLabel(cards);
    return t;
  });
}
/* Сохраняем всю таблицу сыгранного вечера: 50 строк по 4 числа, ~2 КБ на турнир, 4 турнира за сезон.
   Без этого История переигрывала турнир своим броском и расходилась и с постом в ленте, и с самим вечером.
   Читает careerArchiveFinal. n для вызова, которому нужна только верхушка. */
function ccStageTop(ranked, you, n){
  const bare=t=>String(t && t.name || '').replace(/<[^>]*>/g, '').trim();
  const mine=()=>[CAREER.player.nick].concat(careerMates().map(c=>c && c.handle))
    .filter(Boolean).join(' & ');
  return (ranked||[]).slice(0, n>0 ? n : (ranked||[]).length).map(t=>({
    n: t===you ? mine() : bare(t),
    p: Math.round(t.stagePts||0),
    w: t.wins||0,
    e: t.stageElims||0,
    // ЛАН пишет регион под именем, поэтому он тоже сохраняется.
    r: t===you ? ccCareerRegion() : ((t.squad||[])[0]||{}).region || null,
    you: t===you || undefined
  }));
}
/* Комната стадии Reload — те, кто вышел из предыдущей.

   Отзыв: «мне кажется, что на всех финалах так». Так и было:
   круг Reload собирал careerCupField ЗАНОВО на каждой стадии — отборы, плей-ин,
   хиты и финал, — то есть в финале сидели двадцать сильнейших дуо континента, а
   не те пятеро из хита игрока, чей проход он только что смотрел.

   Записываются только глубокие стадии: плей-ин отдаёт в хиты восемьдесят строк,
   хит в финал — пять. Отборы не пишутся никогда: их отсечка — сотни команд, а
   сейв уже однажды умер от такой строки (см. ccRelPack).

   Остаток комнаты добирается прежним полем: игрок видел один хит из четырёх,
   остальные пятнадцать мест финала приезжают со стороны, как и должны. */
/* Соседние хиты круга — их вечер, сыгранный миром.

   Отложены нарочно: хиты Reload стоят в календаре одним днём, а финал через
   шесть, и считать три чужие комнаты сразу после своего вечера значило бы
   удлинить его. Раскладку хиты оставили в relSeed.pending (см. runCareerReload),
   здесь она просто доигрывается — тем же движком и тем же правилом отсечки, что
   и твоя: победа в игре у круга билетом не является, поэтому heatQualifiers
   зовётся с false, ровно как в раннере. */
function ccRelWorldHeats(){
  const cr=CAREER && CAREER.career;
  const s=cr && cr.relSeed;
  if(!s || s.next!=='final' || !Array.isArray(s.pending) || !s.pending.length) return 0;
  if(s.season!==cr.season || s.size!==careerSquadSize()) return 0;
  const st=ccScaleStage(CC_RELOAD_STAGE.heat);
  const pts=reloadCareerPoints(s.set);
  let played=0;
  s.pending.forEach((rows, i)=>{
    const room=(rows||[]).map(ccStageTeamFrom);
    if(room.length<2) return;
    ccWorldRun('rheat|'+cr.season+'|'+s.set+'|'+i, ()=>simulateGames(room, st.games, pts, st.kill));
    const q=heatQualifiers(room, st.cut, false);
    s.through=(s.through||[]).concat(
      room.slice().sort(heatsRank).filter(t=>q.has(t)).map(ccStageSeatRow));
    played++;
  });
  s.pending=null;
  return played;
}
function ccRelRoom(you, drafted, lobbyCr, ev, st, open, sharp){
  const s=CAREER.career.relSeed;
  /* И того же региона (Notion 23.10: в европейском финале капа 2 Peterbot & Bylah, Clix & Higgs, Magma & Pollo).
     Переезд посреди капа оставлял прошедших хит старого региона, а добор шёл из нового: проба — хит EU, переезд в
     NAC, финал 5 пар EU + 14 NAC. Старый сейв без reg — по-прежнему (переезд его теперь и так стирает). */
  const ok=s && s.season===CAREER.career.season && s.size===careerSquadSize() &&
           s.set===ev.set && s.next===ev.stage && (!s.reg || s.reg===ccPoolRegion()) &&
           Array.isArray(s.through) && s.through.length;
  /* Из добора финала исключаем тех, кто проиграл твой хит. Хит 20 дуо с отсечкой 5,
     финал снова 20, и 15 мест добирал careerCupField тем же броском (careerSeed по
     неделе, хит и финал в одной): 12 из 20 команд финала вылетали из твоего хита
     (tools/check-career-reload-heat-cut.js). Чужие из других хитовых лобби законны.
     Выбывшие уходят в тот же аргумент, которым careerCupField исключает тебя самого,
     как у Парижа (ccRcField). */
  const gone=(ok && Array.isArray(s.out)) ? s.out : [];
  const fresh=n=>careerCupField(lobbyCr, drafted.concat(gone), n, null, open, sharp);
  if(!ok) return [you, ...fresh(st.field)];
  /* Хиты круга Reload рассаживаем змейкой по финишу отбора (seedHeats, как у Мейджора: 1, 8, 9, 16…
     в первый хит, 2, 7, 10… во второй), а не through.slice(0, 19), который сажал весь верх отбора
     в один хит с игроком. Число хитов считается от числа прошедших; своё лобби ищется по игроку,
     куда его положила змейка. */
  if(ev.stage==='heat' && s.through.length>st.field){
    const seeded=s.through.map(r=>r==='you' ? you : ccStageTeamFrom(r));
    const heats=seedHeats(seeded, Math.max(2, Math.round(seeded.length/st.field)));
    const rAt=ccRaceHeatTogether(heats, you);   // гонка: один хит на комнату
    const at=rAt>=0 ? rAt : heats.findIndex(h=>h.indexOf(you)>=0);
    const mine=(heats[at<0 ? 0 : at]||[]).slice(0, st.field);
    if(mine.indexOf(you)<0) mine[mine.length-1]=you;
    // Змейка делит нацело редко — недобор закрывается лестницей, как везде.
    if(mine.length<st.field){
      const seen=new Set(mine.map(ccSeatKey));
      fresh(st.field).forEach(t=>{
        if(mine.length<st.field && !seen.has(ccSeatKey(t))){ seen.add(ccSeatKey(t)); mine.push(t); }
      });
    }
    return mine;
  }
  const seen=new Set([ccSeatKey(you)]), take=[];
  const add=t=>{ const k=ccSeatKey(t); if(seen.has(k)) return; seen.add(k); take.push(t); };
  s.through.filter(r=>r!=='you').map(ccStageTeamFrom).forEach(add);
  fresh(st.field).forEach(t=>{ if(take.length<st.field-1) add(t); });
  return [you, ...take.slice(0, st.field-1)];
}
/* Вечер, которого нет в журнале, но который помнит лента.

   Его снимок, 27 августа: пост «Топ 2 на Саммит в Дюссельдорфе» называет
   Acorn & Boltz с 390 очками, а таблица того же Саммита в Истории открывается
   на 411 и с другими командами на местах с третьего по пятое. Карьера была
   сыграна ДО того, как вечер начал записывать свою комнату, — в её строках
   журнала комнаты нет, и таблица снова становилась пересчётом.

   Но пост поздравления несёт ту же пятёрку с очками, и он в сейве есть. Значит
   имена и очки верхних строк можно взять оттуда, а победы и элимы оставить от
   реконструкции: их лента не хранит, а пустые колонки читались бы как ноль
   побед и ноль килов у чемпиона. Новые карьеры сюда не заходят — у них есть
   своя запись, она точнее и полнее. */
function ccArcTopFromNews(mine, rows){
  if(!mine || !mine.day || !CAREER || !CAREER.career) return null;
  const news=(CAREER.career.news||[]).find(e=>e && e.day===mine.day && e.tbl &&
    Array.isArray(e.tbl.rows) && e.tbl.rows.length);
  if(!news) return null;
  const mineName=[CAREER.player.nick].concat(
    (mine.mates && mine.mates.length) ? mine.mates : (mine.mate?[mine.mate]:[])
  ).filter(Boolean).join(' & ');
  const key=s=>String(s==null?'':s).toLowerCase().replace(/\s+/g,'');
  return news.tbl.rows.map((r,i)=>{
    const from=(rows||[])[i]||{};
    return {n:String(r.n||''), p:+r.s||0, w:from.wins||0, e:from.elims||0,
            r:from.reg||null,
            you: key(r.n)===key(mineName) ? true : undefined};
  });
}
// Запись этого Саммита, если она оставлена ЭТИМ сезоном и в ЭТОМ составе.
function ccSummitCarry(){
  const s=CAREER && CAREER.career && CAREER.career.summitSeed;
  if(!s || s.season!==CAREER.career.season || s.size!==careerSquadSize()) return null;
  return s;
}
// Epic's published Summit purse, read straight rather than through
// prizeTableFor, which branches on CARD_SET — a global the career does not set.
function summitPrize(place){
  const t=(typeof PRIZE_TABLES!=='undefined' && PRIZE_TABLES.SUMMIT) || null;
  return t ? (t[String(place)]||0) : 0;
}
/* ВТОРОЙ ШАНС — два вечера перед Саммитом (см. календарь 2026 и CC_SCQ_PLAY / CC_SCQ_FINAL).

   Открытый день: свой дивизион 1 без тех, кто уехал на Саммит из финала Мейджора 1 (основная сетка своего региона —
   тот же отбор, что сажает Саммит, careerSummitField), комната на сто пятьдесят, пятнадцать проходят. Финал: пятьдесят —
   прошедшие открытого дня и сильнейшие из оставшихся, шесть игр, квота региона (SUMMIT_SCQ_SLOTS) уезжает в нижнюю сетку
   Дюссельдорфа и садится там по записи финала (cr.scq.rows). Призы — таблица Liquipedia своего региона. */
async function runCareerScq(ev){
  const cr=CAREER.career;
  const final=ev.stage==='scq';
  const mpStart=ccMpLock() ? await ccMpGate('summit') : null;
  const st=ccScaleStage(final ? CC_SCQ_FINAL : CC_SCQ_PLAY);
  careerCampBonus('summit', ev.id||ev.label||'');
  const me=careerCard(), mates=careerMates();
  if(!me || mates.length<careerMateSeats() || mates.some(function(m){ return !m; })) return;
  const mate=mates[0]||null;

  const prevMode=CARD_MODE, prevSize=squadSize, prevDrafted=drafted;
  CARD_MODE=true; squadSize=careerSquadSize(); drafted=[me].concat(mates);
  useLandingSet(ACTIVE_LANDING_SET);
  skipAnimation=false; CC_SKIP_RUN=false;
  resetRunRecord();
  document.getElementById('majorStages').innerHTML='';
  const rsPrev=document.getElementById('runSummary'); if(rsPrev) rsPrev.innerHTML='';
  document.getElementById('lobbyTitle').textContent='';
  document.getElementById('lobbyBody').innerHTML='';
  clearEventPanel();
  document.getElementById('finalBanner').style.display='none';
  clearLandingResultsMap();
  CAREER_RUN=true;
  show('screen-results');
  ensureSkipButton();

  const you=careerYouTeam(drafted);
  you.name=L().yourTeamPrefix+teamLabel(drafted); you.isYou=true;
  const lobbyCr=Object.assign({}, cr, {division:1});
  // Кто уже на Саммите из своего региона — в этот турнир не идут (тот же отбор, что у careerSummitField).
  const q=ccSummitSlots();
  let mainCards=[];
  try{ const lanCr=Object.assign({}, cr, {division:1});
    mainCards=careerCupField(lanCr, drafted, ccTeams(q.main)+ccTeams(q.scq), 'summit', false, CC_FIELD_SHARP.lan)
      .slice(0, ccTeams(q.main)).flatMap(t=>(t.squad||[]).filter(Boolean)); }catch(e){ mainCards=[]; }
  const taken=drafted.concat(mainCards);
  let field;
  if(!final){
    field=[you, ...careerCupField(lobbyCr, taken, ccTeams(st.field)-1, 'scq', false, 0)];
  } else {
    const r=ccScqOf();
    const seen=new Set([ccSeatKey(you)]), take=[];
    const add=t=>{ if(!t) return; const k=ccSeatKey(t); if(seen.has(k)) return; seen.add(k); take.push(t); };
    ((r && r.through)||[]).filter(x=>x!=='you').map(ccStageTeamFrom).forEach(add);
    careerCupField(lobbyCr, taken, ccTeams(st.field), 'scq', false, CC_FIELD_SHARP.heats).forEach(t=>{ if(take.length<ccTeams(st.field)-1) add(t); });
    field=[you, ...take.slice(0, ccTeams(st.field)-1)];
  }
  const label=ev.label||L().liveScq;
  await simulateGamesLive(field, st.games, st.pts||majorPoints, st.kill, 'stage', 0, null, null,
    {lobbySize:ccTeams(50), stageName:label, mapReplay:true, choices:true, stopOnYourDeath:true,
     dropEachGame:(g,room)=>careerLandingPick(room||field, you, label, ['summit','major'])});
  const ranked=field.slice().sort((a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || b.stageElims-a.stageElims);
  const place=ranked.indexOf(you)+1;
  const slots=final ? ccTeams(SUMMIT_SCQ_SLOTS[ccCareerRegion()]||0) : st.cut;
  const through=place<=slots;
  removeSkipButton();

  const shell=createStageCardShell(label+' — '+field.length);
  await revealStageLog(you, shell, true);
  const cash=final ? scqPrize(place) : 0;
  const cashLine=cash ? L().ccWfCash(ccNum(cash)) : L().ccWfNoCash;
  finalizeStageCard(shell, place, field.length, you.stagePts, through, false,
    final ? (through ? L().ccScqSeat : L().ccScqNoSeat(slots))+' · '+cashLine
          : through ? L().ccRelPass(slots) : L().ccRelFail(slots));
  await revealStandings(shell, ranked, you, slots, null, null, final ? scqPrize : null, null, final);
  careerPrAdd(ranked, {div:1, kind:'major', stage:'lcq'});

  if(final){
    careerMoneyAdd(ranked, scqPrize);
    if(cash) ccPayIn(ccShareOf(cash, you));
    careerReachAdd(careerReachResult(place, field.length, 1, 'major'));
    const r=ccScqOf()||{season:cr.season, play:'pass'};
    cr.scq=Object.assign({}, r, {pass:through, place:place,
      rows:ranked.slice(0, Math.max(slots, ccTeams(SUMMIT_SCQ_SLOTS[ccCareerRegion()]||0))).map(t=>t===you ? 'you' : ccStageSeatRow(t))});
    careerNews(through?'good':'flat', through?'ccNewsSoloThrough':'ccNewsSoloOut', [label, place, field.length]);
  } else {
    cr.scq={season:cr.season, play:through?'pass':'out', pass:through?null:false, place:place,
            through:through ? ranked.slice(0, Math.max(st.cut, ccTeams(CC_SCQ_FINAL.field))).map(t=>t===you ? 'you' : ccStageSeatRow(t)) : null};
    careerNews(through?'good':'flat', through?'ccNewsSoloThrough':'ccNewsSoloOut', [label, place, field.length]);
  }

  const places=(you.stageLog||[]).map(g=>g.place);
  cr.log=cr.log||[];
  careerGrowEvent(place, field.length, you, field);
  cr.log.push({season:cr.season, day:careerToday(), div:cr.division, place:place,
               of:field.length, pts:you.stagePts, passed:through,
               ovr:CAREER.player.ovr, games:st.games, wins:you.wins||0, elims:you.stageElims||0,
               avg: places.length ? Math.round(places.reduce((s,v)=>s+v,0)/places.length*10)/10 : null,
               mate: mate ? mate.handle : null, mates: ccLogMates(mates), prize:ccShareOf(cash, you), kind:'scq',
               stage: final ? 'final' : 'playin'});
  await ccMpClose(ranked);
  careerAdvanceTo(ccAddDays(careerToday(), 1));
  careerSave();

  CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; CC_KILL_CAP=0;
  careerRenderHub('centre');
  careerReloadResultCard({label:label, place:place, of:field.length, through:through, cut:slots, seat:final && through,
    seatText: final && through ? L().ccScqSeat : null, money: final ? cash : null});
}
async function runCareerSummit(){
  const cr=CAREER.career;
  const ev=careerSummitOn(careerToday());
  if(!ev || !careerSummitCan(ev)) return;
  if(ev.stage==='scqplay' || ev.stage==='scq') return runCareerScq(ev);
  // Командный вечер ждёт напарника. См. ccMpGate.
  const mpStart=ccMpLock() ? await ccMpGate('summit') : null;
  // In this season's teams, like every other stage a career plays. See ccTeams.
  const st=ccScaleStage(CC_SUMMIT_STAGE[ev.stage]);
  // A month at the facility that covers this day is worth arriving ready.
  careerCampBonus('summit', ev.id||ev.label||'');
  careerLanArrive('summit', ev);
  /* The squad this season is played in, not a duo.

     Every one of these nine runners took the player and one partner and set
     squadSize to two by hand. In a trios season that put a duo in a lobby of
     trios: his own row showed two names beside everybody else's three, the
     lobby was built to the duo count of fifty rather than thirty-three, and
     the labels underneath said duos all night. His report, 20 August.

     careerMates is the seats the season actually has. An incomplete squad does
     not enter at all, which is the rule the day panel already states. */
  const me=careerCard(), mates=careerMates();
  if(!me || mates.length<careerMateSeats() || mates.some(function(m){ return !m; })) return;
  // The first seat, which is what the result records and the feed lines below
  // have always meant by the partner. A trio names the rest through mates.
  const mate=mates[0]||null;

  const prevMode=CARD_MODE, prevSize=squadSize, prevDrafted=drafted;
  CARD_MODE=true; squadSize=careerSquadSize(); drafted=[me].concat(mates);
  // A duo lobby drops on the whole island. The grid is thinned for squads —
  // trimLandingZonesForMode keeps the biggest 52% of the boxes so a four-player
  // lobby is not a wall of rectangles — and it was baked in at page load, when
  // squadSize was still the squad default. Nothing rebuilt it, so every career
  // night was played on a map with seventeen of its thirty-six boxes missing.
  // Rebuilding with squadSize already 2 is what puts the island back.
  useLandingSet(ACTIVE_LANDING_SET);

  // A new event is watched again: the skip a player pressed last night was for
  // last night. CC_SKIP_RUN is what makes one press cover a whole tournament.
  skipAnimation=false; CC_SKIP_RUN=false;
  resetRunRecord();
  document.getElementById('majorStages').innerHTML='';
  const rsPrev=document.getElementById('runSummary'); if(rsPrev) rsPrev.innerHTML='';
  document.getElementById('lobbyTitle').textContent='';
  document.getElementById('lobbyBody').innerHTML='';
  clearEventPanel();
  document.getElementById('finalBanner').style.display='none';
  clearLandingResultsMap();
  CAREER_RUN=true;
  show('screen-results');
  ensureSkipButton();

  const you=careerYouTeam(drafted);
  you.name=L().yourTeamPrefix+teamLabel(drafted); you.isYou=true;
  // A LAN is the world: Europe's seats are the season this career played, the
  // other six regions' are their own Grand Finals. See careerSummitField.
  const field=careerSummitField(ev.stage, you, drafted);

  // Все три вечера Саммита — комната в одно лобби, и точка выбирается в
  // каждом. Правка: «нельзя только в опенах выбирать».
  const kindsForDrop=['summit','major'];
  const zones=null;
  await simulateGamesLive(field, st.games, st.pts, st.kill, 'stage', 0, null, zones,
    {twoDay:ev.stage==='final', lobbySize:ccTeams(50), stageName:ev.label, mapReplay:true, choices:true, stopOnYourDeath:true,
     dropEachGame:(g,room)=>careerLandingPick(room||field, you, ev.label, kindsForDrop)});
  const ranked=field.slice().sort((a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || b.stageElims-a.stageElims);
  const place=ranked.indexOf(you)+1;
  let through = st.cut ? place<=st.cut : false;
  // In the Lower Bracket a Victory Royale is a seat on its own, the way the
  // Heats work: winning a game there is the whole point of the day.
  if(ev.stage==='lower' && (you.wins||0)>0) through=true;
  removeSkipButton();

  const shell=createStageCardShell(ev.label+' — '+field.length);
  await revealStageLog(you, shell, true);
  finalizeStageCard(shell, place, field.length, you.stagePts,
    ccStagePassed(through, st, place, ev.stage==='final' ? summitPrize : null), false,
    st.cut ? (through ? L().ccRelPass(st.cut) : L().ccRelFail(st.cut)) : '');
  /* The line across a Summit final is the seats it hands out.

     His count, 17 August: about fifteen duos go from the Summit to the Global
     Championship, and the card said ten. Ten was a fallback typed in when the
     stage has no cut of its own - a Summit final does not cut, it crowns - and
     it drew a line that meant nothing over the one number the room is played
     for. SUMMIT_GC_SLOTS is fifteen and it is what ccGlobalsSeat already reads,
     so the qualification was right all along and only the line was wrong. */
  await revealStandings(shell, ranked, you,
    st.cut || (ev.stage==='final' ? ccTeams(SUMMIT_GC_SLOTS) : 10), null, null,
    ev.stage==='final' ? summitPrize : null, null, ev.stage==='final');
  careerPrAdd(ranked, {div:1, kind:'summit', stage:ev.stage});

  let cash=0;
  if(ev.stage==='final'){
    careerMoneyAdd(ranked, summitPrize);
    cash=summitPrize(place);
    if(cash){ const mine=ccShareOf(cash, you);
      ccPayIn(mine); }
    careerReachAdd(careerReachResult(place, field.length, 1, 'summit'));
    careerNews(cash?'good':'flat', cash?'ccNewsSumCash':'ccNewsSumNoCash',
               cash?[place, ccNum(cash)]:[place, field.length],
               {tbl:ccStageShot(ranked, you, 1, ev.label)});
    /* И благодарность за турнир — обычный пост после ЛАНа: «thanks @redbull…
       for the event and my teammates throughout the tournament» (@MariusCOW,
       15 августа). Пишется только после ЛАНов, их в году три-четыре. */
    careerNews('flat', 'ccPostThanks', [ev.label]);
    careerCongrats(ranked, you, L().ccCongratsSummit(ccLanCityIn('summit')));
    ccGcKeepFinal(2026, 'summit', ranked.map(t=>ccSeedRow(t, you, ccMajorSeatRow)));   // для передачи мест Мейджора 2 (ccGcRolledSeat2026)
    cr.summit={got:'final', ticket:false, through:false};
  } else {
    cr.summit={got:ev.stage, through:through,
               ticket: through || !!(cr.summit && cr.summit.ticket)};
    /* И день оставляет после себя тех, кто из него вышел.

       Их места в следующей комнате не обсуждаются: игрок видел, как они их
       выиграли, и увидит их там же. Верхняя сетка пишет и вылетевших — из них
       собирается нижняя. См. careerSummitField. */
    if(ev.stage==='upper' || ev.stage==='lower'){
      const s=(cr.summitSeed && cr.summitSeed.season===cr.season &&
               cr.summitSeed.size===careerSquadSize())
        ? cr.summitSeed
        : (cr.summitSeed={season:cr.season, size:careerSquadSize()});
      const row=t=>ccSeedRow(t, you, ccStageSeatRow);
      /* В нижней сетке победа в игре — билет, ровно как у Хитов Мейджора: так
         написан сам формат («a Victory Royale advances instantly and the top 19
         on points fill the rest»), и так уже считается проход САМОГО игрока
         строкой выше. Комната обязана считаться тем же правилом, иначе из
         пятидесяти мест финала занято сорок четыре, а шесть добираются
         посевом — то есть теми, кто вчера вылетел. */
      const q=ev.stage==='lower' ? heatQualifiers(field, st.cut, winIsATicket()) : null;
      const passed=q ? ranked.filter(t=>q.has(t)) : ranked.slice(0, st.cut);
      const rest  =q ? ranked.filter(t=>!q.has(t)) : ranked.slice(st.cut);
      s[ev.stage]=passed.map(row);
      if(ev.stage==='upper') s.fell=rest.map(row);
      // Вылетевшие из нижней — это конец турнира для них. Записываются, чтобы
      // финал не добрал их посевом обратно в зал.
      if(ev.stage==='lower') s.out=rest.map(row);
      /* А финал Саммита оставляет тех, кто увёз с него места на Глобалы.

         Вопрос: «а глобалс и весь самит». Саммит-то как раз
         играется целиком — все три дня это одно лобби на пятьдесят, и каждый
         этап просчитан. А вот Глобалы его результат НЕ читали: пятнадцать мест
         «за Саммит» брались из GC_SUMMIT_DUOS, статического списка тех, кто
         прошёл в реальности. То есть можно было выиграть Саммит и увидеть в
         Антверпене не тех, кто в нём финишировал.

         Здесь запоминается ровно столько строк, сколько мест даёт Саммит
         (SUMMIT_GC_SLOTS), в порядке финиша. Читает их careerGlobalsField. */
      if(ev.stage==='final')
        s.gc=ranked.slice(0, ccTeams(SUMMIT_GC_SLOTS)).map(row);
    }
    careerNews(through?'good':'flat', through?'ccNewsSumThrough':'ccNewsSumOut',
               [ev.label, place, field.length]);
  }

  const places=(you.stageLog||[]).map(g=>g.place);
  cr.log=cr.log||[];
  // The night is played, so the night teaches. See careerGrowEvent.
  careerGrowEvent(place, field.length, you, field);
  cr.log.push({season:cr.season, day:careerToday(), div:1, place:place, of:field.length,
               pts:you.stagePts, passed:through || cash>0, ovr:CAREER.player.ovr,
               games:st.games, wins:you.wins||0, elims:you.stageElims||0,
               avg: places.length ? Math.round(places.reduce((s,v)=>s+v,0)/places.length*10)/10 : null,
               mate: mate ? mate.handle : null, mates: ccLogMates(mates), prize:ccShareOf(cash, you), kind:'summit', stage:ev.stage,
               won: ev.stage==='final' ? ccStageSeatRow(ranked[0]) : undefined,
               top: ev.stage==='final' ? ccStageTop(ranked, you) : undefined});
  careerMonthGoalCheck();
  // Командный вечер закрывает сервер: он же двигает день. См. ccMpClose.
  await ccMpClose(ranked);
  careerAdvanceTo(ccAddDays(careerToday(), 1));
  careerSave();

  CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; CC_KILL_CAP=0;
  careerRenderHub('centre');
  careerTwoRoundResultCard({title:ev.label, place:place, through:through||cash>0,
    wins:you.wins||0, cash:cash, cut:st.cut});
}

/* Global Championship, Antwerp. From Liquipedia, same numbers as the draft mode: offline Antwerp, 26-27 Sept 2026,
   50 duos, $2,000,000, one cumulative leaderboard. Twelve games, 6 per day, played
   as one stage like Heats and Play-In.
   Seats (Epic's allocation): Summit top 15 (SUMMIT_GC_SLOTS), Major 2 Final EU top 9
   (MAJOR2_GC_SLOTS.EU), Last Chance EU top 3 (GCLC_GC_SLOTS.EU), all read back off
   the career's history, not stored.
   Purse GC2026_PRIZES is the 2024 split: Epic gave only the total, and 2024 paid 50
   places summing exactly to $2,000,000. Field: careerGlobalsField. */
const CC_GLOB_GAMES=12, CC_GLOB_KILL=4, CC_GLOB_FIELD=50;
function careerGlobalsOn(iso){
  const e=(careerYearDays().get(iso)||[]).find(x=>x.kind==='globals');
  return e ? {id:e.id, label:e.label} : null;
}
/* The seat, and where it came from.

   Three separate reads of the log, in the order Epic fills the field. The Major
   row does not record which Major it was — nothing needed it until now — so the
   day it was played is asked instead, which is the calendar's own answer and
   cannot drift out of step with it. */
/* How many seats the career's own region carries down a route.

   Off the save, not off ccHomeRegion: that one resolves through `drafted`, and
   the hub asks this question with no lobby loaded at all. Both Antwerp routes
   used to read the EU column by name, so an Oceanic career needed a top three
   of a qualifier that seats one, and was handed the seat anyway on a number its
   own region never had. This is the same table the standings card draws its cut
   line from, which is the point: what the player was shown during the event and
   what the calendar checks afterwards have to be the same number. */
/* Epic's allocation is written in duos, like every other count in this file, so
   a trio season reads it in trios: nine European seats out of fifty duos is six
   out of thirty-three trios, and handing out nine would put a fifth of Europe's
   Major 2 field on the plane. See ccTeams. */
function ccGcSlots(table){
  const r=careerPrizeRegion();
  return ccTeams(table[r]!=null ? table[r] : (table.EU||0));
}
function ccGlobalsSeat(){
  /* 2025: в Лион везут финалы трёх Мейджоров, по квоте региона на каждый
     (GC2025_M1/M2/M3_SEATS — Epic'овы), и никакого последнего шанса. */
  if(ccIs2025()){
    const cr=CAREER.career;
    const log=(cr.log||[]).filter(r=>r.season===cr.season).reverse();
    const tables={1:GC2025_M1_SEATS, 2:GC2025_M2_SEATS, 3:GC2025_M3_SEATS};
    const hit=log.find(r=>{
      if(r.kind!=='major' || r.stage!=='final' || !r.place) return false;
      const ev=careerMajorOn(r.day);
      return !!ev && !ccMajorIsShowdown(ev.n) && ccGcRolledSeat(2025, ev.n, r.place, i=>ccGcSlots(tables[i]||GC2025_M3_SEATS));
    });
    return hit ? {via:'major2', place:hit.place, note:L().ccGlobSeatMajor25} : null;
  }
  // 2021: ЛАНа нет — Grand Royale идёт машиной сезона («Мейджор 5»).
  if(ccIs2021() || ccIs2020() || ccIs2019()) return null;
  // 2022: приглашение в Роли — место в Гранд-финале сезона не ниже ccInv22Quota.
  if(ccIs2022()){
    const cr=CAREER.career;
    const log=(cr.log||[]).filter(r=>r.season===cr.season).reverse();
    const hit=log.find(r=>{
      if(r.kind!=='major' || r.stage!=='final' || !r.place) return false;
      const ev=careerMajorOn(r.day);
      return !!ev && ev.y22 && r.place<=ccInv22Quota();
    });
    return hit ? {via:'major2', place:hit.place, note:L().ccMajSeatInv22(ccInv22Quota())} : null;
  }
  /* 2023: в Копенгаген — финалы трёх Мейджоров по квоте региона (верхняя сетка) и финал
     Last Chance Major (нижняя). Квоты — участники Liquipedia по дорогам (GC2023_SEATS). */
  if(ccIs2023()){
    const cr=CAREER.career;
    const log=(cr.log||[]).filter(r=>r.season===cr.season).reverse();
    const maj=log.find(r=>{
      if(r.kind!=='major' || r.stage!=='final' || !r.place) return false;
      const ev=careerMajorOn(r.day);
      return !!ev && ev.y23 && ev.n<=3 && ccGcRolledSeat(2023, ev.n, r.place, i=>ccGc23Seats('m'+i));
    });
    if(maj) return {via:'major2', place:maj.place, note:L().ccGlobSeatMajor25};
    const lcm=log.find(r=>r.kind==='major' && r.stage==='lcm' && r.place && r.place<=ccGc23Seats('lcm'));
    return lcm ? {via:'lcm', place:lcm.place, note:L().ccYr23LcmSeat(ccGc23Seats('lcm'))} : null;
  }
  /* 2024: в Форт-Уэрт везут финалы трёх Мейджоров по квоте региона (GC2024_M*_SEATS),
     последнего шанса не было. */
  if(ccIs2024()){
    const cr=CAREER.career;
    const log=(cr.log||[]).filter(r=>r.season===cr.season).reverse();
    const hit=log.find(r=>{
      if(r.kind!=='major' || r.stage!=='final' || !r.place) return false;
      const ev=careerMajorOn(r.day);
      return !!ev && ev.y24 && ccGcRolledSeat(2024, ev.n, r.place, ccGc24Seats);
    });
    return hit ? {via:'major2', place:hit.place, note:L().ccGlobSeatMajor25} : null;
  }
  // Этого года — см. ccSummitSeat.
  const cr=CAREER.career;
  const log=(cr.log||[]).filter(r=>r.season===cr.season).reverse();
  const summit=log.find(r=>r.kind==='summit' && r.stage==='final');
  if(summit && summit.place && summit.place<=ccTeams(SUMMIT_GC_SLOTS))
    return {via:'summit', place:summit.place, note:L().ccGlobSeatSummit};
  const major=log.find(r=>{
    if(r.kind!=='major' || r.stage!=='final') return false;
    const ev=careerMajorOn(r.day);
    return !!ev && ev.n===2;
  });
  if(major && major.place && ccGcRolledSeat2026(major.place))
    return {via:'major2', place:major.place, note:L().ccGlobSeatMajor};
  const gclc=log.find(r=>r.kind==='gclc' && r.stage==='final');
  if(gclc && gclc.place && gclc.place<=ccGcSlots(GCLC_GC_SLOTS))
    return {via:'gclc', place:gclc.place, note:L().ccGlobSeatGclc};
  return null;
}
// Whether a seat of this kind has already been handed down. See careerSlotGiveUp.
function ccGaveUp(key){ return ((CAREER.career.gaveUp)||[]).indexOf(key)>=0; }
function careerGlobalsCan(ev){
  if(!ev) return false;
  if(CAREER.career.globals) return false;      // it is one tournament, played once
  // Копенгаген — три дня, у каждого свой допуск. См. ccGc23Can.
  if(ccIs2023()) return !ccGaveUp('globals') && ccGc23Can();
  // Forfeited with the duo that won it, or with the region that gave it.
  if(ccGaveUp('globals')) return false;
  return !!ccGlobalsSeat();
}
/* The fifty duos in Antwerp: GC_SUMMIT_DUOS (15, all regions) and GC_MAJOR2_DUOS
   (25 from Major 2 regional finals). The last ten are the GC Last Chance, which
   hasn't been played, so we take the top duos of each region's Major 2 leaderboard
   not already in, by Epic's per-region allocation. Your seat displaces one duo on
   the route you came through. */
/* Места своего региона на ЛАНе — из сцены карьеры, той же, что играет кубки.

   Комната собирается так же, как своя квота Саммита: careerCupField от лица
   Дивизиона 1 с ланской остротой, минус те, кто в зале уже сидит. Пары
   приезжают парами — это и есть ответ на «почему сильных трио я не вижу». */
function ccGcOwnSeats(n, drafted, seated, tag){
  if(n<=0) return [];
  const cr=CAREER.career;
  const lanCr=Object.assign({}, cr, {division:1});
  /* С запасом: часть команд отсеется теми, кто уже сидит в зале. Восьми не хватало — верх
     Европы почти весь уже едет с Саммита, и после сдвига рейтингов Глобалами-2026 (30.09)
     Мейджор 2 недосчитывался двух мест, а их добирал ласт ченс (check-career-globals).
     Тот же урок, что у Форт-Уэрта ниже: «из десяти предложенных девять уже сидят в зале». */
  return careerCupField(lanCr, drafted, n+40, tag, false, CC_FIELD_SHARP.lan)
    .filter(t=>{
      const keys=(t.squad||[]).map(c=>_gcNorm(c && c.handle));
      if(keys.some(k=>seated.has(k))) return false;
      keys.forEach(k=>seated.add(k));
      return true;
    })
    .slice(0, n);
}
/* Форт-Уэрт 2024: пятьдесят дуо — настоящие, по дорогам (GC2024_M1/M2/M3_DUOS, Liquipedia),
   карточками своего года (ccLanTeam → gcCardIndex(2024)); своё место вытесняет одно из них,
   и если кто-то из настоящих уже сидит в твоём составе — его дуо не летит. Недобор —
   верх своего региона (ccGcOwnSeats). */
function buildGlobalChampionship2024Field(you, drafted){
  const seated=new Set();
  (you.squad||[]).forEach(p=>seated.add(_gcNorm(p.handle)));
  const field=[];
  const seat=(duos, route, rating)=>duos.forEach(d=>{
    if(field.length>=CC_GLOB_FIELD-1) return;
    const t=ccLanTeam(d, null, rating, seated);
    if(t){ t.gcRoute=route; field.push(t); }
  });
  seat(ccGcList('GC2024_M1_DUOS', GC2024_M1_DUOS), 'm1', 90);
  seat(ccGcList('GC2024_M2_DUOS', GC2024_M2_DUOS), 'm2', 88);
  seat(ccGcList('GC2024_M3_DUOS', GC2024_M3_DUOS), 'm3', 86);
  /* Недобор (тёзки, вытесненные) — верх своего региона; просить надо с запасом: верх
     Европы и есть эти самые люди, и из десяти предложенных девять уже сидят в зале. */
  if(field.length<CC_GLOB_FIELD-1){
    const lanCr=Object.assign({}, CAREER.career, {division:1});
    careerCupField(lanCr, drafted, 80, null, false, CC_FIELD_SHARP.lan).forEach(t=>{
      if(field.length>=CC_GLOB_FIELD-1) return;
      const keys=(t.squad||[]).map(c=>_gcNorm(c && c.handle));
      if(keys.some(k=>seated.has(k))) return;
      keys.forEach(k=>seated.add(k));
      t.gcRoute='m3'; field.push(t);
    });
  }
  you.gcRoute='m3'; you.summitRegion=ccCareerRegion();
  const capped=field.slice(0, CC_GLOB_FIELD-1);
  capped.push(you);
  return capped;
}
/* GLOBAL CHAMPIONSHIP (и Invitational 2022) — ИЗ СИМУЛЯЦИИ, А НЕ ИЗ ИСТОРИИ (его слова 29.09: «пусть из
   нашей симуляции игроки попадают», «и так должно быть на всех турнирах»). Залы Роли, Копенгагена,
   Форт-Уэрта и Лиона собирались из настоящих списков прошедших (INV2022_DUOS, GC2023_DUOS,
   GC2024_M*_DUOS, GC2025_M*_TRIOS). В карьере они подменяются: сколько мест было у региона на этой
   дороге — столько и отдаётся, но кому — решает сыгранный финал Мейджора этого региона. Свой регион —
   твой финал (cr.gfKeep, пишется в конце финала Мейджора), чужие — комната финала из настоящих команд
   года этого региона (пары/трио — по одному событию и месту в карточках), сыгранная движком. Кто уже
   взял место на ранней дороге, дальше не занимает. Считается один раз за сезон (cr.gcSim). В драфте —
   настоящие списки, как было. */
let CC_GC_SIM_DEPTH=0;
function ccGcSimOn(fn){ CC_GC_SIM_DEPTH++; try{ return fn(); } finally{ CC_GC_SIM_DEPTH--; } }
/* МЕСТО НА GLOBAL CHAMPIONSHIP С ПЕРЕДАЧЕЙ ВНИЗ (Liquipedia, сверка 7.10: «If a duo has already qualified, their
   spot will be transferred to the closest placing duo that has not qualified»). По записанным финалам года
   (cr.gfKeep) идём Мейджор за Мейджором: квоту каждого добирают сверху те, кто ещё без места. Финала в записи
   нет — старое правило «место не ниже квоты». quotaOf(i) — квота Мейджора i. */
/* ДИСКВАЛИФИКАЦИЯ ПЕРЕД ЛАНОМ. Иногда одну из прошедших команд финала снимают (виза, бан за читы, напарник не
   может лететь), и её место уходит следующей по таблице: так места на Global Championship и передаются. Жребий
   от сезона и финала, одинаковый у обоих в командной игре. CC_LAN_DQ_OFF — сравнить «без снятия» для новости. */
let CC_LAN_DQ_ODDS=0.12;   // let — сторож check-career-lan-dq ставит 1 и 0
const CC_LAN_DQ_TOP=12, CC_LAN_DQ_WHY=['visa','cheat','mate'];
let CC_LAN_DQ_OFF=false;
const ccGcRowKey=r=>r==='you' ? 'you' : (Array.isArray(r) ? r : [r]).map(c=>hKey((c && c.h) || c)).sort().join('+');
const ccGcDqOf=kept=>(!CC_LAN_DQ_OFF && kept && kept.dq) ? kept.dq.key : null;
function ccGcRolledSeat(year, n, place, quotaOf){
  const k=(CAREER && CAREER.career && CAREER.career.gfKeep)||{}, season=CAREER.career.season;
  const rowKey=ccGcRowKey;
  const got=new Set();
  for(let i=1; i<=n; i++){
    const kept=k[year+'|'+i];
    if(!kept || kept.season!==season || !(kept.rows||[]).length){ if(i===n) return place<=quotaOf(n); continue; }
    let seats=quotaOf(i);
    const dq=ccGcDqOf(kept);
    for(const r of kept.rows){
      if(seats<=0) break;
      const key=rowKey(r); if(got.has(key) || key===dq) continue;
      got.add(key); seats--;
    }
    if(i===n) return got.has('you');
  }
  return false;
}
/* 2026: квота Мейджора 2 передаётся вниз мимо тех, кто уже едет с Саммита (его топ-15). Нет записей — старое правило. */
function ccGcRolledSeat2026(place){
  const k=(CAREER.career.gfKeep)||{}, season=CAREER.career.season, sum=k['2026|summit'], m2=k['2026|2'];
  const quota=ccGcSlots(MAJOR2_GC_SLOTS);
  if(!m2 || m2.season!==season) return place<=quota;
  const rowKey=ccGcRowKey, dq=ccGcDqOf(m2);
  const got=new Set((sum && sum.season===season) ? sum.rows.slice(0, ccTeams(SUMMIT_GC_SLOTS)).map(rowKey) : []);
  let seats=quota;
  for(const r of m2.rows){ if(seats<=0) break; const key=rowKey(r); if(got.has(key) || key===dq) continue; if(key==='you') return true; seats--; }
  return false;
}
function ccGcKeepFinal(year, n, rows){
  if(!CAREER || !CAREER.career) return;
  const cr=CAREER.career, k=cr.gfKeep=cr.gfKeep||{};
  k[year+'|'+n]={season:cr.season, reg:ccCareerRegion(), rows:(rows||[]).slice()};
  if(cr.gcSim && cr.gcSim.season===cr.season) delete cr.gcSim[year];
  try{ ccLanDqRoll(year, n); }catch(e){ console.error('ccLanDqRoll', e); }
}
// Квота «моего» финала для сравнения с дисквалификацией и без: тем же путём, что и ccGlobalsSeat.
function ccLanDqSeatYou(year, n){
  if(year===2026) return n===2 ? ccGcRolledSeat2026(Infinity) : null;
  if(year===2025) return ccGcRolledSeat(2025, n, Infinity, i=>ccGcSlots(({1:GC2025_M1_SEATS, 2:GC2025_M2_SEATS, 3:GC2025_M3_SEATS})[i]||GC2025_M3_SEATS));
  if(year===2024) return ccGcRolledSeat(2024, n, Infinity, ccGc24Seats);
  if(year===2023 && n<=3) return ccGcRolledSeat(2023, n, Infinity, i=>ccGc23Seats('m'+i));
  return null;
}
function ccLanDqRoll(year, n){
  const cr=CAREER.career, kept=cr.gfKeep && cr.gfKeep[year+'|'+n];
  if(!kept || kept.dq!==undefined || (year!==2026 && year!==2025 && year!==2024 && year!==2023) || (year===2026 && n!==2) || (year===2023 && !(n<=3))) return;
  const rnd=careerRng(ccHashStr('lanDq|'+cr.season+'|'+year+'|'+n));
  // Снимают только того, у кого место есть: ставим его на место «you» и спрашиваем ту же раздачу.
  const holds=r=>{
    const orig=kept.rows; let ok=false;
    kept.rows=orig.map(x=>x===r ? 'you' : (x==='you' ? '__me' : x)); kept.dq=null; CC_LAN_DQ_OFF=true;
    try{ ok=!!ccLanDqSeatYou(year, n); } finally{ kept.rows=orig; CC_LAN_DQ_OFF=false; delete kept.dq; }
    return ok;
  };
  const pool=(kept.rows||[]).slice(0, CC_LAN_DQ_TOP).filter(r=>r!=='you' && holds(r));
  if(!pool.length || rnd()>=CC_LAN_DQ_ODDS){ kept.dq=null; return; }
  const row=pool[Math.floor(rnd()*pool.length)];
  const why=CC_LAN_DQ_WHY[Math.floor(rnd()*CC_LAN_DQ_WHY.length)];
  const names=(Array.isArray(row) ? row : [row]).map(c=>(c && c.h) || c).filter(Boolean).join(' & ');
  kept.dq={key:ccGcRowKey(row), why:why, names:names};
  const withDq=ccLanDqSeatYou(year, n);
  CC_LAN_DQ_OFF=true; let without=null;
  try{ without=ccLanDqSeatYou(year, n); } finally{ CC_LAN_DQ_OFF=false; }
  if(withDq && !without){ kept.dq.you=true; careerNews('good', 'ccNewsDqSeat', [names, why]); }
  else careerNews('flat', 'ccNewsDqOther', [names, why]);
}
const CC_GC_SIM={
  INV2022_DUOS:{year:2022, size:2, sets:['k1','k2','k3'], n:0, keepAll:[1,2,3], keepTop:()=>ccInv22Quota(), seats:()=>INV2022_SEATS, order:0},
  'GC2023_DUOS.m1':{year:2023, size:2, sets:['e1'], n:1, list:()=>GC2023_DUOS.m1, order:1},
  'GC2023_DUOS.m2':{year:2023, size:2, sets:['e2'], n:2, list:()=>GC2023_DUOS.m2, order:2},
  'GC2023_DUOS.m3':{year:2023, size:2, sets:['e3'], n:3, list:()=>GC2023_DUOS.m3, order:3},
  'GC2023_DUOS.lcm':{year:2023, size:2, sets:['e3'], n:0, list:()=>GC2023_DUOS.lcm, order:4},
  GC2024_M1_DUOS:{year:2024, size:2, sets:['f1'], n:1, seats:()=>GC2024_M1_SEATS, order:1},
  GC2024_M2_DUOS:{year:2024, size:2, sets:['f2'], n:2, seats:()=>GC2024_M2_SEATS, order:2},
  GC2024_M3_DUOS:{year:2024, size:2, sets:['f3'], n:3, seats:()=>GC2024_M3_SEATS, order:3},
  GC2025_M1_TRIOS:{year:2025, size:3, sets:['t1'], n:1, seats:()=>GC2025_M1_SEATS, order:1},
  GC2025_M2_TRIOS:{year:2025, size:3, sets:['t2'], n:2, seats:()=>GC2025_M2_SEATS, order:2},
  GC2025_M3_TRIOS:{year:2025, size:3, sets:['t3'], n:3, seats:()=>GC2025_M3_SEATS, order:3}
};
// Регион настоящей строки списка — по карточке первого человека в наборах года.
function ccGcRowRegion(row, sets){
  const h=hKey(row[0]||'');
  const c=PLAYERS.find(p=>p && hKey(p.handle)===h && sets.indexOf(String(p.cardSet||''))>=0) || PLAYERS.find(p=>p && hKey(p.handle)===h);
  return (c && c.region) || 'EU';
}
function ccGcSeatsOf(spec){
  if(spec.seats) return Object.assign({}, spec.seats());
  const out={};
  (spec.list()||[]).forEach(r=>{ const g=ccGcRowRegion(r, spec.sets); out[g]=(out[g]||0)+1; });
  return out;
}
// Настоящие команды региона в наборах года: у тиммейтов одно событие и одно место.
function ccGcRegionTeams(spec, reg){
  const grp=new Map();
  spec.sets.forEach(set=>((typeof CARDS_BY_SETREG!=='undefined' && CARDS_BY_SETREG.get(set+'|'+reg))||[]).forEach(c=>{
    if(!c.placement) return;
    const k=set+'|'+(c.gfEvent||c.event||'')+'|'+c.placement;
    (grp.get(k)||grp.set(k, []).get(k)).push(c);
  }));
  const seen=new Set(), out=[];
  grp.forEach(cs=>{
    if(cs.length!==spec.size) return;
    const key=cs.map(c=>hKey(c.handle)).sort().join('+');
    if(seen.has(key)) return; seen.add(key);
    out.push({row:cs.map(c=>c.handle), pow:cs.reduce((s,c)=>s+(+c.rating||0), 0)/cs.length});
  });
  return out.sort((a,b)=>b.pow-a.pow);
}
function ccGcSimYear(year){
  const cr=CAREER.career;
  const box=cr.gcSim=(cr.gcSim && cr.gcSim.season===cr.season) ? cr.gcSim : {season:cr.season};
  if(box[year]) return box[year];
  const lists={}, taken=new Set();
  const names=Object.keys(CC_GC_SIM).filter(k=>CC_GC_SIM[k].year===year).sort((a,b)=>CC_GC_SIM[a].order-CC_GC_SIM[b].order);
  names.forEach(name=>{
    const spec=CC_GC_SIM[name], seats=ccGcSeatsOf(spec), rows=[];
    const F=spec.size===3 ? 33 : 50;
    Object.keys(seats).forEach(reg0=>{
      const reg=reg0==='?' ? 'EU' : reg0, need=seats[reg0];
      if(!need) return;
      const free=r=>!r.some(h=>taken.has(hKey(h)));
      let pick=[];
      // Снятая перед ЛАНом команда (ccLanDqRoll) в зал не едет.
      const ownOf=kept=>(kept && kept.season===cr.season && kept.reg===reg) ? (kept.rows||[]).filter(r=>r!=='you' && !(kept.dq && ccGcRowKey(r)===kept.dq.key)).map(r=>r.map(x=>typeof x==='string' ? x : x.h)) : [];
      if(spec.keepAll){
        // Роли: приглашение давал любой из трёх финалов сезона 2022 (верх по квоте ccInv22Quota) — берём их по порядку.
        spec.keepAll.forEach(k=>ownOf(cr.gfKeep && cr.gfKeep[year+'|'+k]).slice(0, spec.keepTop()).forEach(r=>{
          if(pick.length<need && free(r) && !pick.some(p=>p.join('+')===r.join('+'))) pick.push(r); }));
      } else if(spec.n){
        pick=ownOf(cr.gfKeep && cr.gfKeep[year+'|'+spec.n]).filter(free).slice(0, need);
      }
      // Квал региона — симуляцией по его сцене карьеры (его слово 12.10), не настоящими командами года.
      if(pick.length<need && spec.size===careerSquadSize()){
        let sim=null;
        try{ sim=ccLanSimRanked(reg, 'gc|'+name, [careerCard()].concat(careerMates()).filter(Boolean)); }catch(e){ sim=null; }
        (sim||[]).forEach(r=>{ const row=r.map(x=>x.h); if(pick.length<need && free(row)) pick.push(row); });
      }
      if(pick.length<need){
        const pool=ccGcRegionTeams(spec, reg).filter(t=>free(t.row) && !pick.some(p=>p.join('+')===t.row.join('+')));
        const rnd=careerRng(ccHashStr('gcsim|'+cr.season+'|'+name+'|'+reg));
        const top=pool.slice(0, F*2);
        for(let i=top.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); const t=top[i]; top[i]=top[j]; top[j]=t; }
        const room=top.slice(0, F).map(t=>{ const tm=ccLanTeam(t.row, null, Math.round(t.pow), null); if(tm) tm._row=t.row; return tm; }).filter(Boolean);
        if(room.length){
          ccWithEventSize(spec.size, ()=>{
            room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
            ccWorldRun('gcsim|'+cr.season+'|'+name+'|'+reg, ()=>simulateGames(room, 12, ccM24Points, CC_M24_KILL));
          });
          ccM24Rank(room).forEach(t=>{ if(pick.length<need && free(t._row)) pick.push(t._row); });
        }
      }
      pick.forEach(r=>{ r.forEach(h=>taken.add(hKey(h))); rows.push(r); });
    });
    lists[name]=rows;
  });
  box[year]=lists;
  return lists;
}
// Список дороги: в карьере (внутри ccGcSimOn) — сыгранный, иначе — настоящий.
function ccGcList(name, real){
  if(!CC_GC_SIM_DEPTH || typeof CAREER==='undefined' || !CAREER || !CAREER.career) return real;
  const spec=CC_GC_SIM[name]; if(!spec) return real;
  const l=ccGcSimYear(spec.year)[name];
  return (l && l.length) ? l : real;
}
function careerGlobalsField(you, drafted, via){
  if(ccIs2022()) return ccGcSimOn(()=>buildInvitational2022Field(you));
  if(ccIs2023()) return ccGcSimOn(()=>buildGlobalChampionship2023Field(you));
  if(ccIs2024()) return ccGcSimOn(()=>buildGlobalChampionship2024Field(you, drafted));
  /* 2025: Лион — 33 трио, поле уже собрано режимом драфта из настоящих
     составов Лиона (buildGlobalChampionship2025Field): места Мейджоров 1 и 2 —
     реальные трио, Мейджора 3 — по регионам; твоё место вытесняет одно. */
  if(ccIs2025()) return ccGcSimOn(()=>buildGlobalChampionship2025Field(you, ccCareerRegion(), null));
  /* ЗАЛ ОДИН НА КОМНАТУ ГОНКИ. Список занятых мест начинался со СВОЕГО состава: строка
     записи, в которой стоит мой человек, у меня из зала выпадала, а у соседа — нет, и
     Глобалы у двоих собирались разные (годовая проба на шестерых, 01.10: 17 строк из 50
     при одинаковом пуле). В гонке занято место КАЖДОГО человека комнаты — список у всех
     один, а сажает людей ccRaceFieldSync. careerCupField вычитает их сам (ccRaceAllCards).
     Одиночная карьера считает как считала. */
  const ccRace=(typeof ccRaceLock==='function' && ccRaceLock());
  const mineAll=ccRace ? drafted.concat((typeof ccRaceAllCards==='function' ? ccRaceAllCards() : []).filter(Boolean)) : drafted;
  const seated=new Set();
  mineAll.forEach(c=>{ if(c && c.handle) seated.add(_gcNorm(c.handle)); });
  const field=[];
  const add=(teams, route)=>teams.forEach(t=>{ t.gcRoute=route; field.push(t); });
  // The Summit's fifteen first, because the Summit happened first: a duo that
  // won its seat in May keeps it, and a later event's place rolls down to
  // somebody not going yet. That is the order the draft mode seats them in too.
  // Counted in this season's teams, so the three routes still add up to the
  // field rather than being cut off by the slice at the bottom. See ccTeams.
  /* Пятнадцать мест за Саммит — с ТОГО Саммита, который сыграли.

     Вопрос: «а глобалс и весь самит». Стоял статический список
     GC_SUMMIT_DUOS — те, кто прошёл в реальности, — и результат сыгранного
     Саммита в Антверпен не доезжал вовсе. Теперь финал Саммита оставляет свои
     пятнадцать строк (summitSeed.gc), и они читаются здесь.

     Список остаётся запасным: сейв, где Саммит ещё не играли (или играли до
     этой правки), должен собрать зал как собирал. */
  const sum=ccSummitCarry();
  const sumGc=(sum && Array.isArray(sum.gc) && sum.gc.length) ? sum.gc : null;
  if(sumGc){
    const teams=sumGc.filter(r=>r!=='you').map(ccStageTeamFrom)
      .filter(t=>{
        const keys=(t.squad||[]).map(c=>_gcNorm(c && c.handle));
        if(keys.some(k=>seated.has(k))) return false;
        keys.forEach(k=>seated.add(k));
        return true;
      });
    add(teams.slice(0, ccTeams(SUMMIT_GC_SLOTS)), 'summit');
  }
  /* Саммита в записи нет (карьера пришла после мая, или старый сейв) — места даёт Саммит, сыгранный
     симуляцией тем же залом, что у живого (careerSummitField), а не настоящий список GC_SUMMIT_DUOS
     (его слово 12.10: «все турниры от симуляции»). Список — запас вне карьеры. */
  const sumLeft=ccTeams(SUMMIT_GC_SLOTS)-field.length;
  const sumSim=sumLeft>0 ? ccLanSummitSim(drafted) : null;
  if(sumSim){
    const got=[];
    for(const row of sumSim){
      if(got.length>=sumLeft) break;
      const keys=row.map(x=>_gcNorm(x.h));
      if(keys.some(k=>seated.has(k))) continue;
      const t=ccStageTeamFrom(row); if(!t) continue;
      keys.forEach(k=>seated.add(k)); got.push(t);
    }
    add(got, 'summit');
  }
  else add(ccLanSeats(ccLanRowsReg(GC_SUMMIT_DUOS),
                 ccTeams(SUMMIT_GC_SLOTS)-field.length, null, seated), 'summit');
  /* Свой регион садится ТЕМ финалом Мейджора 2, который сыграли.

     Отзыв: «а глобалы все, мейджоры наверное можно добирать с
     регионов». Своё поле карьера играет сама, поэтому его девять мест берутся
     из записи (cr.gcSeed, пишет runCareerMajor). Чужие регионы читаются с их
     лидербордов, как читались: их Мейджоры нигде не играются.

     Записи нет — старый сейв или Мейджор 2 ещё впереди — и регион собирается
     прежним списком. */
  const gs=CAREER.career.gcSeed;
  const myGc=(gs && gs.season===CAREER.career.season &&
              gs.size===careerSquadSize() && Array.isArray(gs.m2)) ? gs : null;
  Object.keys(MAJOR2_GC_SLOTS).forEach(reg=>{
    const slots=ccTeams(MAJOR2_GC_SLOTS[reg]||0);
    if(myGc && myGc.reg===reg){
      const mine2=myGc.m2.filter(r=>r!=='you').map(ccMajorTeamFrom).filter(t=>{
        const keys=(t.squad||[]).map(c=>_gcNorm(c && c.handle));
        if(keys.some(k=>seated.has(k))) return false;
        keys.forEach(k=>seated.add(k));
        return true;
      }).slice(0, slots);
      add(mine2, 'm2');
      if(mine2.length<slots)
        add(ccLanSeats(gcRegionFinals('m2', reg), slots-mine2.length, reg, seated), 'm2');
      return;
    }
    /* Свой регион — сцена карьеры, даже когда Мейджор 2 ещё не сыгран.

       Продолжение того же вопроса: сильных трио на ЛАНе не
       видно. Замер (career-lan-duos-probe): из двадцати верхних пар сцены до
       Глобалов доезжало восемь, и первой пары — Scroll & Sky, 96 — среди них
       не было вовсе. Причина в списке: без записи (`gcSeed`) регион садился
       статическим GC_MAJOR2_DUOS — теми, кто прошёл в РЕАЛЬНОСТИ 2026 года, —
       а карьера весь сезон смотрит на свою сцену, где пары уже другие: год
       развёл кого-то (ccDuoBroken), кого-то развели результаты.

       Своё поле карьера играет сама, и то же правило уже стоит у Саммита
       (careerSummitField: своя квота — из careerCupField, чужие регионы — с
       их досок). Здесь оно теперь стоит и у Глобалов. Запись, когда она есть,
       по-прежнему главнее списка: сыгранный Мейджор 2 — это факт. */
    if(reg===ccCareerRegion()){
      add(ccLanSimSeats(reg, slots, drafted, seated, 'm2') || ccGcOwnSeats(slots, drafted, seated, 'gcM2'), 'm2');
      return;
    }
    // Симулированный Мейджор 2 региона (его слово 12.10: «все турниры от симуляции»). См. ccLanSimSeats.
    const sim=ccLanSimSeats(reg, slots, drafted, seated, 'm2');
    if(sim){ add(sim, 'm2'); return; }
    // Трио-год: своей сценой региона, а не списком 2026-го. См. ccLanAwaySeats.
    const away=ccLanAwaySeats(reg, slots, drafted, seated, 'gcM2');
    if(away){ add(away, 'm2'); return; }
    const real=ccLanSeats(ccLanRows(GC_MAJOR2_DUOS[reg]), slots, reg, seated);
    // A qualifier the career itself took — the player, or their partner — leaves
    // its region a seat short. It rolls down that region's own final, which is
    // what an unclaimed slot does.
    add(real, 'm2');
    if(real.length<slots)
      add(ccLanSeats(gcRegionFinals('m2', reg), slots-real.length, reg, seated), 'm2');
  });
  // The Last Chance, undecided: each region's own Major 2 leaderboard, top down —
  // и свой регион опять же своей сценой, а не доской 2026 года.
  Object.keys(GCLC_GC_SLOTS).forEach(reg=>{
    const n=ccTeams(GCLC_GC_SLOTS[reg]||0);
    // Ласт Ченс — свой симулированный квал у каждого региона, своего тоже.
    add(ccLanSimSeats(reg, n, drafted, seated, 'lcq') ||
        (reg===ccCareerRegion() ? ccGcOwnSeats(n, drafted, seated, 'gcLcq')
                                : (ccLanAwaySeats(reg, n, drafted, seated, 'gcLcq') || ccLanSeats(gcRegionFinals('m2', reg), n, reg, seated))), 'lcq');
  });
  // Your seat, taken off the route you won it on rather than added to the room.
  const route = via==='summit' ? 'summit' : via==='gclc' ? 'lcq' : 'm2';
  /* Место под себя выкупается у СВОЕГО маршрута — но только в одиночной карьере: маршрут у
     каждого свой, и в общей комнате у одного выпадала бы строка Саммита, у другого строка
     Мейджора. В гонке уходит последняя строка зала, одинаково у всех, а людей рассадит и
     подрежет ccRaceFieldSync. */
  const mine=ccRace ? [] : field.filter(t=>t.gcRoute===route);
  const drop=mine.length ? mine[mine.length-1] : field[field.length-1];
  if(drop) field.splice(field.indexOf(drop), 1);
  you.gcRoute=route;
  field.push(you);
  /* And the room is full.

     The three routes add up to the field on paper and not always in fact: a duo
     is skipped where the same person is already seated under another spelling —
     Liquipedia and Tracker write four of these people differently — and nothing
     replaced them, so Antwerp went out at forty-nine. His report, 20 August.

     What fills it is the same thing an unclaimed slot rolls down to: each
     region's own Major 2 board, then Major 1's, taken in finishing order across
     the regions until the plane is full. Marked 'lcq', because the Last Chance
     is the road that decides the seats nobody has claimed. */
  const want=ccGlobField();
  if(field.length<want){
    /* По кругу, по одному месту на регион за проход, — а не весь остаток
       первому в списке. Старая форма передавала want-field.length целиком в
       первый же вызов, и это была Европа: любая недостача самолёта улетала
       европейскими дуо с ярлыком Ласт Чанса. Жалоба игрока:
       «с ласт чанса одни ЕУ дуо без других регионов». */
    const regions=Object.keys(MAJOR2_GC_SLOTS);
    ['m2','m1'].forEach(set=>{
      let gave=true;
      while(field.length<want && gave){
        gave=false;
        regions.forEach(reg=>{
          if(field.length>=want) return;
          // Трио-год: добор из сцены региона (и своего тоже); дуо-год — с досок, как было.
          const got=ccLanSimSeats(reg, 1, drafted, seated, set) || ccLanAwaySeats(reg, 1, drafted, seated, 'gcFill') || ccLanSeats(gcRegionFinals(set, reg), 1, reg, seated);
          if(got.length){ add(got, 'lcq'); gave=true; }
        });
      }
    });
  }
  /* Лишние срезаются с хвоста, но не ты. Квоты регионов округляются ccTeams по отдельности, и в год
     сквадов (2027+, выбор формата) их сумма выходит больше 25: slice(0, want) отрезал последнюю строку,
     а последней стоял ты — «you.stageLog is not iterable» на Глобалах в Сингапуре (Notion 24.10.26). */
  while(field.length>want){
    let i=field.length-1;
    while(i>=0 && field[i]===you) i--;
    if(i<0) break;
    field.splice(i, 1);
  }
  return field;
}
// Antwerp's purse. GC2026_PRIZES rather than prizeTableFor('GC2026'), which
// branches on CARD_SET — a global the career does not set.
function gcPrize(place){
  const t=ccIs2022() ? INV2022_PRIZES : ccIs2023() ? GC2023_PRIZES : ccIs2024() ? GC2024_PRIZES : ccIs2025() ? GC2025_PRIZES : ((typeof GC2026_PRIZES!=='undefined' && GC2026_PRIZES) || null);
  return t ? (t[String(place)]||0) : 0;
}
async function runCareerGlobals(){
  const cr=CAREER.career;
  const ev=careerGlobalsOn(careerToday());
  if(!ev || !careerGlobalsCan(ev)) return;
  // Командный вечер ждёт напарника. См. ccMpGate.
  const mpStart=ccMpLock() ? await ccMpGate('globals') : null;
  const seat=ccGlobalsSeat();
  // A month at the facility that covers this day is worth arriving ready.
  careerCampBonus('globals', ev.id||ev.label||'');
  careerLanArrive('globals', ev);
  /* The squad this season is played in, not a duo.

     Every one of these nine runners took the player and one partner and set
     squadSize to two by hand. In a trios season that put a duo in a lobby of
     trios: his own row showed two names beside everybody else's three, the
     lobby was built to the duo count of fifty rather than thirty-three, and
     the labels underneath said duos all night. His report, 20 August.

     careerMates is the seats the season actually has. An incomplete squad does
     not enter at all, which is the rule the day panel already states. */
  const me=careerCard(), mates=careerMates();
  if(!me || mates.length<careerMateSeats() || mates.some(function(m){ return !m; })) return;
  // The first seat, which is what the result records and the feed lines below
  // have always meant by the partner. A trio names the rest through mates.
  const mate=mates[0]||null;

  const prevMode=CARD_MODE, prevSize=squadSize, prevDrafted=drafted;
  CARD_MODE=true; squadSize=careerSquadSize(); drafted=[me].concat(mates);
  // A duo lobby drops on the whole island. The grid is thinned for squads —
  // trimLandingZonesForMode keeps the biggest 52% of the boxes so a four-player
  // lobby is not a wall of rectangles — and it was baked in at page load, when
  // squadSize was still the squad default. Nothing rebuilt it, so every career
  // night was played on a map with seventeen of its thirty-six boxes missing.
  // Rebuilding with squadSize already 2 is what puts the island back.
  useLandingSet(ACTIVE_LANDING_SET);

  // A new event is watched again: the skip a player pressed last night was for
  // last night. CC_SKIP_RUN is what makes one press cover a whole tournament.
  skipAnimation=false; CC_SKIP_RUN=false;
  resetRunRecord();
  document.getElementById('majorStages').innerHTML='';
  const rsPrev=document.getElementById('runSummary'); if(rsPrev) rsPrev.innerHTML='';
  document.getElementById('lobbyTitle').textContent='';
  document.getElementById('lobbyBody').innerHTML='';
  clearEventPanel();
  document.getElementById('finalBanner').style.display='none';
  clearLandingResultsMap();
  CAREER_RUN=true;
  show('screen-results');
  ensureSkipButton();

  const you=careerYouTeam(drafted);
  you.name=L().yourTeamPrefix+teamLabel(drafted); you.isYou=true;
  // Fifty duos from all seven regions, off the three real qualification lists.
  const field=careerGlobalsField(you, drafted, seat && seat.via);

  const kindsForDrop=['summit','major','gclc'];
  const zones=null;
  // Форт-Уэрт 2024: «points multiplied by 1.5x on the second day» (Liquipedia, сверка 7.10) — как Гранд-финалы 2024-го.
  const gc24=ccCalYear()===2024;
  CC_M24_GAME=0;
  /* Финал — один на оба дня, все двенадцать игр разом. Метка календаря второго дня несёт «· Сессия 2», и над игрой
     читалось «Session 2: partie 12 sur 12» — как будто это вторая сессия по двенадцать (игрок, Notion 22.10). */
  const sessCut=' · '+L().calSession.split('{N}')[0];
  const stageNm=ev.label.lastIndexOf(sessCut)>0 ? ev.label.slice(0, ev.label.lastIndexOf(sessCut)) : ev.label;
  await simulateGamesLive(field, CC_GLOB_GAMES, gc24 ? ccM24PointsGf : majorPoints, gc24 ? ccM24KillGf : CC_GLOB_KILL,
    'stage', 0, null, zones,
    {twoDay:true, lobbySize:ccTeams(50), stageName:stageNm, mapReplay:true, choices:true, stopOnYourDeath:true,
     dropEachGame:(g,room)=>{ CC_M24_GAME=g; return careerLandingPick(room||field, you, ev.label, kindsForDrop); }});
  const ranked=field.slice().sort((a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || b.stageElims-a.stageElims);
  const place=ranked.indexOf(you)+1;
  removeSkipButton();

  const shell=createStageCardShell(ev.label+' — '+field.length);
  await revealStageLog(you, shell, true);
  // Призовое место Глобалов — зелёная плашка, как у карточки итога (было: только первое).
  finalizeStageCard(shell, place, field.length, you.stagePts, place===1 || gcPrize(place)>0, false,
    place===1 ? L().gcChampion : L().gcPlaceNote(place));
  // Из финала Глобалов не проходят никуда — «топ-10» здесь был той же ложной
  // линией, что и на финале Мейджора. Деньги показывает колонка призовых.
  await revealStandings(shell, ranked, you, 0, null, null, gcPrize, null, true);
  careerPrAdd(ranked, {div:1, kind:'globals'});

  careerMoneyAdd(ranked, gcPrize);
  const cash=gcPrize(place);
  if(cash){ const mine=ccShareOf(cash, you);
    ccPayIn(mine); }
  careerReachAdd(careerReachResult(place, field.length, 1, 'globals'));
  if(place===1) careerNews('good', 'ccNewsGlobChamp', []);
  careerNews(cash?'good':'flat', cash?'ccNewsGlobCash':'ccNewsGlobNoCash',
             cash?[place, ccNum(cash)]:[place, field.length],
             {tbl:ccStageShot(ranked, you, 1, ev.label)});
  careerNews('flat', 'ccPostThanks', [ev.label]);
  careerCongrats(ranked, you, L().ccCongratsGlobals(ccLanCityIn('globals')));
  cr.globals={place:place, of:field.length, via:seat?seat.via:null, cash:cash};

  const places=(you.stageLog||[]).map(g=>g.place);
  cr.log=cr.log||[];
  // The night is played, so the night teaches. See careerGrowEvent.
  careerGrowEvent(place, field.length, you, field);
  cr.log.push({season:cr.season, day:careerToday(), div:1, place:place, of:field.length,
               pts:you.stagePts, passed:cash>0, ovr:CAREER.player.ovr,
               games:CC_GLOB_GAMES, wins:you.wins||0, elims:you.stageElims||0,
               avg: places.length ? Math.round(places.reduce((s,v)=>s+v,0)/places.length*10)/10 : null,
               mate: mate ? mate.handle : null, mates: ccLogMates(mates), prize:ccShareOf(cash, you), kind:'globals', stage:'final',
               won: ccStageSeatRow(ranked[0]), top: ccStageTop(ranked, you)});
  careerMonthGoalCheck();
  // Командный вечер закрывает сервер: он же двигает день. См. ccMpClose.
  await ccMpClose(ranked);
  careerAdvanceTo(ccAddDays(careerToday(), 1));
  careerSave();

  CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; CC_KILL_CAP=0;
  careerRenderHub('centre');
  careerTwoRoundResultCard({title:ev.label, place:place, through:place===1||cash>0,
    wins:you.wins||0, cash:cash, cut:0});
}

/* Посев хитов по местам Плей-Ина, как у Epic: змейка 1-2-3-3-2-1 по финишу, а не по силе.
   Пересчитать Плей-Ин нельзя: между ним и Хитами сцена подрастает и снимок может смениться, та же соль даст
   другой зал. Поэтому прошедшие пишутся в порядке финиша: настоящий ником (карточка берётся живая),
   выдуманный четырьмя числами, из которых собран. Около 150 строк, единицы КБ. Старый сейв сеется по силе. */
function ccMajorSeatRow(t){
  return (t.squad||[]).map(function(c){
    const a=attrsFor(c)||{};
    return (c && c.tier==='ladder')
      ? {h:c.handle, n:c.nat||null, o:Math.round(a.ovr||0), k:a.roleKey||null}
      : c.handle;
  });
}
/* ПОСЛЕ ПЕРЕЕЗДА (скрин 13): строки Мейджора, набранные на квалах в прошлом регионе, хранят ники того региона — в
   сцене нового их нет, и они становились безымянными заглушками («AS» вместо флага, рейтинг из полосы). Ник, который
   живёт в ДРУГОМ регионе, заменяется настоящим игроком сцены этого: по рейтингу сверху, без повторов, замена
   запоминается в сейве (cr.majSub) — перезагрузка и следующие этапы видят того же человека. Ушедшие из сцены совсем
   остаются, как были, заглушкой. Сбрасывается при переезде (careerMoveRegion). */
let CC_HANDLE_REGS=null;
function ccMajorRegionSub(handle){
  const cr=CAREER && CAREER.career, reg=ccCareerRegion(); if(!cr) return null;
  const k=hKey(handle);
  if(!CC_HANDLE_REGS){ CC_HANDLE_REGS=new Map(); (PLAYERS||[]).forEach(p=>{ const hk=hKey(p); if(!p.region) return; let st=CC_HANDLE_REGS.get(hk); if(!st) CC_HANDLE_REGS.set(hk, st=new Set()); st.add(p.region); }); }
  const regs=CC_HANDLE_REGS.get(k), elsewhere=!!regs && [...regs].some(r=>r!==reg);
  if(!elsewhere) return null;
  if(!cr.majSub || cr.majSub.reg!==reg) cr.majSub={reg:reg, map:{}, used:{}};
  const S=cr.majSub, roster=ccSceneRoster(reg);
  let h=S.map[k];
  if(!h){
    const taken=new Set(Object.keys(S.used));
    // И не свои: напарник в чужой команде — тот же человек дважды в лобби.
    try{ (careerMates()||[]).forEach(m=>taken.add(hKey(m))); taken.add(hKey(CAREER.player.handle||CAREER.player.nick||'')); }catch(e){}
    // Не тот, кто уже стоит в строках этого сезона живым ником: свой регион их и так покажет.
    const pick=roster.slice().sort((a,b)=>(b.rating||0)-(a.rating||0)).find(x=>!taken.has(hKey(x)) && !ccMajorRowHas(cr, hKey(x)));
    if(!pick) return null;
    h=pick.handle; S.map[k]=h; S.used[hKey(pick)]=1;
  }
  return roster.find(x=>hKey(x)===hKey(h)) || null;
}
// Стоит ли ник в каком-нибудь сохранённом состоянии Мейджоров сезона (поиском по JSON — состояния небольшие).
function ccMajorRowHas(cr, key){
  if(!cr.__majRowsAt || cr.__majRowsAt!==careerToday()){
    let blob='';
    Object.keys(cr).forEach(n=>{ if(/^major\d|^m2\d|^gr2|^summit|^gc/i.test(n)) try{ blob+=JSON.stringify(cr[n]); }catch(e){} });
    Object.defineProperty(cr, '__majRowsBlob', {value:blob.toLowerCase(), writable:true, configurable:true, enumerable:false});
    Object.defineProperty(cr, '__majRowsAt', {value:careerToday(), writable:true, configurable:true, enumerable:false});
  }
  return cr.__majRowsBlob.indexOf('"'+key+'"')>=0;
}
function ccMajorCardFrom(rec){
  if(typeof rec==='string'){
    const c=ccSceneRoster(ccCareerRegion()).find(x=>hKey(x)===hKey(rec));
    if(c) return c;
    const sub=ccMajorRegionSub(rec);
    if(sub) return sub;
    // Ника больше нет в сцене — человек всё равно играл, и его место не пустует.
    rec={h:rec, n:null, o:ccBand(1), k:null};
  }
  const r=clamp(Math.round(rec.o||ccBand(1)), 35, ccGenTop());
  return {handle:rec.h, nat:rec.n||null, region:ccCareerRegion(), org:null,
          tier:'ladder', event:L().ccLadderEvent, date:'-', placement:null,
          rating:r, _targetOvr:r, _attrs:ccRookieAttrs(r, rec.k||'roleFRG')};
}
// Тем же правилом, что ccStageTeamFrom: сборка из записи не берёт бросков вечера.
/* Записи прошедших -> команды раунда. В гонке своя строка пишется никами, а не 'you' (ccSeedRow при ccRaceSeeds:
   запись общая на всех), и при сборке следующего раунда она становилась отдельной командой-копией меня, а я добавлялся
   ещё раз: у каждого гонщика свой двойник, разная раскладка комнат, и сосед ждал ответов того, кого у себя не посадил
   (онлайн-прогон 2019 года, 21.10: Season X 3.11, третий раунд, «Your partner never reached the question»).
   Строка с моим ником — я, один раз. */
function ccStageRowsOf(rows, you){
  let mk=''; try{ mk=hKey(careerCard()||{handle:''}); }catch(e){}
  const mine=r=>!!mk && Array.isArray(r) && r.some(x=>hKey(typeof x==='string' ? x : (x && x.h) || '')===mk);
  let used=false;
  return (rows||[]).map(r=>{ if(r==='you' || mine(r)){ if(used) return null; used=true; return you; } return ccMajorTeamFrom(r); }).filter(Boolean);
}
function ccMajorTeamFrom(row){
  return ccRaceUnseeded(function(){
    const cards=row.map(ccMajorCardFrom);
    const t=careerTeam(cards);
    t.name=teamLabel(cards);
    return t;
  });
}
/* Финал Мейджора садится из тех же составов, что играли Плей-Ин и Хиты.
   careerSeed сеется неделей, а Хиты (24-26 июля) и финал (1-2 августа) в разных
   неделях, так что новый careerCupField перетасовывал пары, и призы уходили
   несуществующим командам. Берём cr.majorSeed (~150 составов в порядке финиша,
   см. ccMajorSeatRow): сначала прошедшие свой хит, остальное верх по силе.
   Сейв без записи (или вход через Ласт Ченс мимо Плей-Ина) играет по-старому. */
function ccMajorFinalRoom(you, lobbyCr, drafted, ev, st, sharp){
  const s=CAREER.career.majorSeed;
  const rows=ccMajorSeedRows(ev);
  // Финал, куда пришёл через Ласт Ченс без Плей-Ина: сидят те, кого мир посадил (ccMajorWorldSeat).
  const world=!rows && s && s.world && s.n===ev.n && s.season===CAREER.career.season;
  if(!rows && !world) return [you, ...careerCupField(lobbyCr, drafted, st.field, null, false, sharp)];
  const seen=new Set([ccSeatKey(you)]);
  /* Один человек — одна команда. Ключ всей команды пропускал ту же тройку с другим четвёртым (запись прошедших,
     дописанная до и после «Переиграть день», ладдер-четвёртый другой): Crue, Pez1x, Hanckee сидели в финале трижды. */
  const ppl=new Set((you.squad||[]).map(c=>hKey(c)));
  const take=[];
  const add=t=>{ const k=ccSeatKey(t); if(seen.has(k)) return;
    const ks=(t.squad||[]).map(c=>hKey(c)); if(ks.some(x=>ppl.has(x))) return;
    seen.add(k); ks.forEach(x=>ppl.add(x)); take.push(t); };
  ((s && s.through) || []).forEach(r=>{ if(r!=='you') add(ccMajorTeamFrom(r)); });
  const qual=take.length;
  (rows||[]).filter(r=>r!=='you').map(ccMajorTeamFrom)
      .sort((a,b)=>(b.pow||0)-(a.pow||0))
      .forEach(t=>{ if(take.length<st.field-1) add(t); });
  // Полуторасотни на пятьдесят мест хватает с запасом; если запись короче
  // (старый сейв трио-сезона), остаток добирается как раньше.
  const short=st.field-1-take.length;
  const fill=short>0 ? careerCupField(lobbyCr, drafted.concat(
      [].concat(...take.map(t=>t.squad||[]))), short+1, 'majFin', false, sharp) : [];
  CC_MAJOR_FIN_QUAL=qual;
  return [you, ...take, ...fill];
}
// Сколько мест финала занято теми, кто прошёл свой хит на глазах игрока.
// Читает только проверка — см. tools/check-career-major-final.js.
let CC_MAJOR_FIN_QUAL=0;
// Посев этого Мейджора, если он записан ЭТИМ сезоном и в ЭТОМ составе.
function ccMajorSeedRows(ev){
  const s=CAREER.career.majorSeed;
  if(!s || s.n!==ev.n || s.season!==CAREER.career.season) return null;
  if(s.size!==careerSquadSize()) return null;
  if(!Array.isArray(s.rows) || s.rows.length<ccMajorHeats()) return null;
  return s.rows.indexOf('you')>=0 ? s.rows : null;
}

// ==== FNCS 2019–2020 machine (tools/splice-2019.js) ====
/* ---- Сезоны 2019-го и 2020-го — формат меняется внутри года ------------------------
   2019: World Cup Solo и Duos (недели Online Open, финалы в Нью-Йорке), FNCS Season X (трио),
   FNCS Chapter 2 Season 1 (сквады). 2020: FNCS C2S2 (трио), C2S3 (соло), C2S4 (трио).
   Состав года — самый большой формат года; вечер идёт в своём формате (ccWithEventSize):
   соло — один, дуо — с первым тиммейтом. Спеки — CC_MX_SPEC (вклеивается с календарём).

   Неделя (или квалификатор) — раунды по вечерам: открытые раунды не хранят зал (только
   «прошёл»), закрытый — из записанного верха прошлого раунда. Последний раунд недели даёт
   очки серии (место в финале недели). У World Cup очков серии нет: верх недели по квоте
   региона (WC2019_QUOTA) — сразу в финал Нью-Йорка, и дальше недели уже не нужны.
   После недель — хиты из серии змейкой (план хитов в спеке), потом финал. */
/* Имя сезона-«Мейджора» для лет, когда Мейджоров не было: 2019–2020 — из спеки, 2021 — FNCS C2S5–C2S8
   и Grand Royale, 2022 — FNCS C3S1–C3S3. Для 2023+ — null (там это и есть Мейджоры). */
function ccSeasonEvName(y, n){
  if(y===2022) return 'FNCS C3S'+n;
  if(y===2021) return n===5 ? 'FNCS Grand Royale' : 'FNCS C2S'+(n+4);
  const sp=ccMXSpec(y, n); return sp ? sp.name : null;
}
function ccMXSpec(y, n){ return (CC_MX_SPEC[y]||{})[n] || null; }
function ccMXLobby(size){ return size===1 ? 100 : size===2 ? 50 : size===3 ? 33 : 25; }
/* Своё состояние у каждого турнира сезона (cr.majorxs[y|n]). Была одна ячейка cr.majorx на всех:
   недели World Cup Solo и Duos чередуются, и первая же сыгранная неделя Duos затирала состояние Solo
   вместе с билетом в Нью-Йорк (его правка 29.09: «квальнулся в финал ворлд капа и не сыграл его»).
   cr.majorx по-прежнему указывает на последний сыгранный — для старых сейвов и чтения. */
function ccMXOf(y, n){
  const cr=CAREER && CAREER.career; if(!cr) return null;
  const all=cr.majorxs=cr.majorxs||{};
  const old=cr.majorx; if(old && old.y!=null && !all[old.y+'|'+old.n] && old.season===cr.season) all[old.y+'|'+old.n]=old;
  const m=all[y+'|'+n];
  return (m && m.season===cr.season) ? m : null;
}
function ccMXState(y, n){
  const cr=CAREER.career;
  let m=ccMXOf(y, n);
  if(!m){ m={y:y, n:n, season:cr.season, got:{}, q:{}, series:{}, seriesRows:{}, heats:null, heatRes:{}, youKey:null, ticket:false};
          cr.majorxs[y+'|'+n]=m;
          /* Сейв, где билет затёрла чужая неделя: журнал помнит пройденный финал недели World Cup
             (день воскресенья этой недели, тот же размер состава, «прошёл») — билет возвращается. */
          const sp=ccMXSpec(y, n);
          if(sp && sp.kind==='wc'){
            const days=new Set((sp.weeks||[]).map(w=>ccMXDayOf(y, n, 'W'+w+'R'+sp.rounds.length)).filter(Boolean));
            m.ticket=(cr.log||[]).some(e=>e && e.kind==='major' && e.passed && e.season===cr.season && e.size===sp.size && days.has(e.day));
          } }
  cr.majorx=m;
  return m;
}
function ccMXRowId(y, n, tail){ return 'Major'+n+'_'+y+'_'+tail; }
function ccMXDayOf(y, n, tail){
  const row=ccYearRows().find(r=>r[2]===ccMXRowId(y, n, tail));
  return row ? row[0] : null;
}
function ccMXWeekEnd(y, n, w){
  let last=null;
  ccYearRows().forEach(r=>{ if(r[2].indexOf(ccMXRowId(y, n, 'W'+w+'R'))===0 && (!last || r[0]>last)) last=r[0]; });
  return last;
}
// Команда — по никам, а не по всей записи: у игроков лестницы в записи рейтинг, и за неделю он сдвигается — одна команда
// выглядела двумя и могла сесть в хиты дважды (сверка 7.10).
const ccMXKey=r=>r==='you' ? 'you' : (Array.isArray(r) ? r : [r]).map(c=>hKey((c && c.h) || c)).sort().join('+');
/* ПРЯМЫЕ МЕСТА НЕДЕЛИ (Liquipedia, его вопрос 7.10 «2019 по очкам за несколько недель?»): финал каждой недели сам
   отправляет свой верх в хиты — Season X «Top 8 trios», C2S1 «Top 10 squads», C2S2 «Top 20 duos», C2S3 «Top 50
   players», C2S4 «Top 15 teams»; уже прошедший отдаёт место следующему. Остаток хитов — «top performers that didn't
   qualify», то есть сумма очков недель (m.series). Раньше всё поле хитов шло только по сумме. */
const CC_MX_WEEK_DIRECT={h3:8, h4:10, i1:20, i2:50, i3:15};
function ccMXSeriesAdd(m, ranked, rowOf, w){
  if(w!=null){ (m.wf=m.wf||{})[w]=ranked.map(rowOf); m.heats=null; }
  const n=ranked.length;
  ranked.forEach((t,i)=>{ const k=ccSeatKey(t); m.series[k]=(m.series[k]||0)+(n-i); if(!m.seriesRows[k]) m.seriesRows[k]=rowOf(t); });
}
/* ТАБЛИЦА НЕДЕЛИ = ФИНАЛ, ПОТОМ ПОЛУФИНАЛ (его вопрос 7.10 «а типо если не квал»). Очки недели — не только финалистам:
   «top performers» Epic — это и полуфиналисты. Без этого не прошедший полуфинал игрок получал за неделю ноль, а мир —
   очки. Финалисты — по месту в финале, дальше полуфиналисты по месту в полуфинале (Q.semi — твой настоящий
   полуфинал, если ты его играл), до размера ccMXWeekSize. */
function ccMXWeekCut(sp){ const R=sp.rounds.length, F=ccMXLobby(sp.size); return (R>1 && sp.rounds[R-2].cut) || F; }
function ccMXWeekSize(sp){ const F=ccMXLobby(sp.size); return Math.max(F, (sp.heats||[]).length*F, 2*ccMXWeekCut(sp)); }
function ccMXSemiTail(m, Q, keys, size, list){
  ((Q && Q.semi)||[]).forEach(r=>{
    if(list.length>=size) return;
    const key=r==='you' ? m.youKey : ccSeatKey(ccMajorTeamFrom(r));
    if(!key || keys.has(key)) return;
    keys.add(key); list.push({key, row:r});
  });
}
function ccMXSeriesAddList(m, list, w, nFinal){
  (m.wf=m.wf||{})[w]=list.slice(0, nFinal).map(x=>x.row); m.heats=null;
  const n=list.length;
  list.forEach((x,i)=>{ m.series[x.key]=(m.series[x.key]||0)+(n-i); if(!m.seriesRows[x.key]) m.seriesRows[x.key]=x.row; });
}
function ccMXSeriesRank(m, key){
  const keys=Object.keys(m.series).sort((a,b)=>m.series[b]-m.series[a]);
  const at=keys.indexOf(key);
  return at<0 ? 0 : at+1;
}
// Квота World Cup: мест в Нью-Йорк с одной недели у региона карьеры.
function ccMXWcQuota(sp){
  const t=(typeof WC2019_QUOTA!=='undefined' && WC2019_QUOTA[sp.set]) || {};
  let r=careerPrizeRegion(); if(t[r]==null && r==='NAW') r='NAC';
  return Math.max(1, t[r]||1);
}
function ccMXWorld(y, n, size, salt){
  return ccWithEventSize(size, ()=>ccM23World(size+20, salt));
}
// Неделя, досчитанная молча: финал недели — сильные сцены; в серию (World Cup — без серии).
function ccMXSettleWeek(m, w){
  const sp=ccMXSpec(m.y, m.n), Q=m.q[w]=m.q[w]||{};
  if(Q.done || sp.kind==='wc') return;
  const end=ccMXWeekEnd(m.y, m.n, w);
  if(!end || careerToday()<=end) return;
  const R=sp.rounds.length, last=sp.rounds[R-1], F=ccMXLobby(sp.size);
  /* ФИНАЛ НЕДЕЛИ — ВЕСЬ, А НЕ ОДНО ЛОББИ (его вопрос 7.10 «а очки считаются у всех?»). Был срез до одного лобби (33
     трио), и почти каждую неделю — одни и те же сильнейшие: за пять недель Season X очки набрали 37 команд на 132
     места в хитах, остальные 95 добирались сценой без очков. У Epic в финал недели выходит отсечка полуфинала —
     Season X «Top 150 trios will advance to Finals», C2S1 — 25 сквадов; играется лобби по F, таблица общая. */
  /* И не меньше всего поля хитов: приглашённые — «top performers» сезона, их очки идут и из полуфиналов недели, а финал
     у C2S1/2020 — 25–100 команд. Без этого очки за недели были у 43 из 100 (C2S1), 58 из 200 (C2S2), 118 из 400 (C2S3),
     39 из 132 (C2S4), остальное поле хитов садилось без очков. Модель режима: таблица недели мира = полуфинал+финал. */
  const size=ccMXWeekSize(sp), cut=ccMXWeekCut(sp);
  ccWithEventSize(sp.size, ()=>{
    let finals=(Q['r'+(R-1)]||[]).filter(r=>r!=='you').map(ccMajorTeamFrom), semis=null;
    const seen=new Set(finals.map(ccSeatKey));
    if(!finals.length && !Q.semi){
      // Неделю не играл никто из людей: полуфинал мира (лобби по F), его верх — в финал.
      /* Зал недели — не одни и те же каждую неделю: верхняя половина — сильнейшие, остальное — жребий недели из круга
         втрое шире. Иначе в 2020 очки получали ровно 200/400 команд — ровно поле хитов, и проходил любой с очком. */
      const wide=ccM23World(size*3, 'mx|'+m.y+'|'+m.n+'|'+w), half=Math.ceil(size/2), rnd=careerRng(ccHashStr('mxpool|'+m.season+'|'+m.y+'|'+m.n+'|'+w));
      const rest=wide.slice(half);
      for(let i=rest.length-1; i>0; i--){ const j=Math.floor(rnd()*(i+1)); const tmp=rest[i]; rest[i]=rest[j]; rest[j]=tmp; }
      const pool=wide.slice(0, half).concat(rest).slice(0, size);
      pool.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
      ccWorldRun('mxs|'+m.season+'|'+m.y+'|'+m.n+'|'+w, ()=>splitIntoLobbies(pool, F).forEach(l=>simulateGames(l, sp.rounds[Math.max(0, R-2)].games, ccM24Points, CC_M24_KILL)));
      semis=ccM24Rank(pool); finals=semis.slice(0, cut); finals.forEach(t=>seen.add(ccSeatKey(t)));
    } else if(finals.length<cut){
      ccM23World(cut+20, 'mx|'+m.y+'|'+m.n+'|'+w).forEach(t=>{ if(finals.length>=cut || seen.has(ccSeatKey(t))) return; seen.add(ccSeatKey(t)); finals.push(t); });
    }
    finals.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
    ccWorldRun('mxq|'+m.season+'|'+m.y+'|'+m.n+'|'+w, ()=>splitIntoLobbies(finals, F).forEach(l=>simulateGames(l, last.games, ccM24Points, CC_M24_KILL)));
    const fr=ccM24Rank(finals), list=fr.map(t=>({key:ccSeatKey(t), row:ccMajorSeatRow(t)})), keys=new Set(list.map(x=>x.key));
    if(semis) semis.forEach(t=>{ const k=ccSeatKey(t); if(list.length>=size || keys.has(k)) return; keys.add(k); list.push({key:k, row:ccMajorSeatRow(t)}); });
    else ccMXSemiTail(m, Q, keys, size, list);
    if(list.length<size) ccM23World(size*2, 'mxt|'+m.y+'|'+m.n+'|'+w).forEach(t=>{ const k=ccSeatKey(t); if(list.length>=size || keys.has(k)) return; keys.add(k); list.push({key:k, row:ccMajorSeatRow(t)}); });
    ccMXSeriesAddList(m, list, w, fr.length);
  });
  Q.done=true;
}
function ccMXSettleWeeks(m){ (ccMXSpec(m.y, m.n).weeks||[]).forEach(w=>ccMXSettleWeek(m, w)); }
// Кто сейчас в поле хитов: прямые места недель по порядку недель, потом сумма очков. Без кэша — для плашки недели.
function ccMXHeatList(m){
  const sp=ccMXSpec(m.y, m.n), plan=sp.heats||[], F=ccMXLobby(sp.size);
  const need=plan.length*F, direct=CC_MX_WEEK_DIRECT[sp.set]||0;
  const list=[], seen=new Set();
  const push=r=>{ const key=ccMXKey(r); if(list.length>=need || seen.has(key)) return false; seen.add(key); list.push(r); return true; };
  if(direct) (sp.weeks||[]).forEach(w=>{ let got=0; ((m.wf||{})[w]||[]).forEach(r=>{ if(got<direct && push(r)) got++; }); });
  Object.keys(m.series).sort((a,b)=>m.series[b]-m.series[a]).forEach(k=>push(m.seriesRows[k]));
  return {list, need};
}
function ccMXHeats(m){
  /* Сначала досчитать прошедшие недели, потом отдавать кэш: спрошенное посреди сезона поле хитов запоминалось без
     последних недель (замер 7.10: недели 3–5 Season X — 0 из 8 прямых мест). Новая неделя сбрасывает кэш
     (ccMXSeriesAdd с номером недели). */
  ccMXSettleWeeks(m);
  if(m.heats) return m.heats;
  const sp=ccMXSpec(m.y, m.n), plan=sp.heats||[], F=ccMXLobby(sp.size);
  const H=plan.length, need=H*F;
  const pre=ccMXHeatList(m), list=pre.list, seen=new Set(list.map(ccMXKey));
  const push=r=>{ const key=ccMXKey(r); if(list.length>=need || seen.has(key)) return; seen.add(key); list.push(r); };
  Object.keys(m.series).sort((a,b)=>m.series[b]-m.series[a]).forEach(k=>push(m.seriesRows[k]));
  if(list.length<need) ccWithEventSize(sp.size, ()=>ccM23World(need*2, 'mxh|'+m.y+'|'+m.n).forEach(t=>push(ccMajorSeatRow(t))));
  const heats=plan.map(h=>({day:h.day, cut:h.cut, rows:[]}));
  list.forEach((r,i)=>{ const round=Math.floor(i/H), pos=i%H; heats[round%2 ? H-1-pos : pos].rows.push(r); });
  m.heats=heats; m.heatRes={};
  return heats;
}
function ccMXSettleHeats(m){
  const sp=ccMXSpec(m.y, m.n);
  if(!(sp.heats||[]).length) return;
  ccMXHeats(m).forEach((h,i)=>{
    if(m.heatRes[i] || !h.rows.length) return;
    const day=ccMXDayOf(m.y, m.n, 'Heat'+h.day);
    if(!day || careerToday()<=day) return;
    ccWithEventSize(sp.size, ()=>{
      const room=h.rows.filter(r=>r!=='you').map(ccMajorTeamFrom);
      room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
      ccWorldRun('mxh|'+m.season+'|'+m.y+'|'+m.n+'|'+i, ()=>simulateGames(room, sp.heatGames||6, ccM24Points, CC_M24_KILL));
      const ranked=ccM24Rank(room);
      m.heatRes[i]={up:ranked.slice(0, h.cut).map(ccMajorSeatRow), rest:ranked.slice(h.cut).map(ccMajorSeatRow)};
    });
  });
}
function ccMXYourHeat(m, d){ return ccMXHeats(m).findIndex(h=>h.day===d && ccSeedHasMe(h.rows)); }
// Финал: World Cup — настоящие финалисты Нью-Йорка; FNCS — прошедшие хиты, недобор по серии.
/* ФИНАЛ WORLD CUP — ИЗ СЫГРАННЫХ НЕДЕЛЬ (его слово 29.09: «пусть из нашей симуляции игроки попадают,
   которые квальнутся недель», «и так должно быть на всех турнирах»). Был готовый список настоящих
   финалистов Нью-Йорка (WC2019_FIELD). Теперь каждая неделя Online Open каждого региона — комната
   финала недели из настоящих карточек World Cup этого региона (дуо — реальными парами из истории),
   сыгранная движком; путёвки — верх таблицы по квоте региона (WC2019_QUOTA, приведённой к размеру
   финала), уже прошедшие путёвку не занимают. Свой регион в сыгранную неделю — твоя таблица (ccMXRun).
   Комнаты считаются один раз после конца недели и лежат в сейве (m.wcq), так что финал не меняется. */
function ccMXWcRowKey(r){ return r==='you' ? 'you' : (Array.isArray(r) ? r : [r]).map(x=>hKey(typeof x==='string' ? x : x.h)).sort().join('+'); }
function ccMXWcTaken(m, before){
  const out=new Set(), W=m.wcq||{};
  Object.keys(W).forEach(w=>{ if(before!=null && +w>=before) return; Object.values(W[w]).forEach(rows=>(rows||[]).forEach(r=>out.add(ccMXWcRowKey(r)))); });
  return out;
}
function ccMXWcPool(sp, reg){
  const cards=(typeof CARDS_BY_SETREG!=='undefined' && CARDS_BY_SETREG.get(sp.set+'|'+reg)||[]).slice().sort((a,b)=>(b.rating||0)-(a.rating||0));
  const row=c=>({h:c.handle, n:c.nat||null, o:Math.round(c.rating||0), k:(attrsFor(c)||{}).roleKey||null});
  if(sp.size===1) return cards.map(c=>[row(c)]);
  // Дуо — настоящими парами World Cup: у пары в карточках одно событие и одно место (Benjyfishy и
  // MrSavage — оба 1-е в Online Open Europe). Остальные — соседями по рейтингу.
  const used=new Set(), out=[], grp=new Map();
  cards.forEach(c=>{ const k=(c.gfEvent||c.event||'')+'|'+(c.placement||''); if(!c.placement) return; (grp.get(k)||grp.set(k, []).get(k)).push(c); });
  grp.forEach(cs=>{ if(cs.length!==sp.size || cs.some(c=>used.has(hKey(c.handle)))) return; cs.forEach(c=>used.add(hKey(c.handle))); out.push(cs.map(row)); });
  const rest=cards.filter(c=>!used.has(hKey(c.handle)));
  for(let i=0; i+sp.size-1<rest.length; i+=sp.size) out.push(rest.slice(i, i+sp.size).map(row));
  return out.sort((a,b)=>b.reduce((s,x)=>s+x.o,0)-a.reduce((s,x)=>s+x.o,0));
}
function ccMXWcRows(m, sp){
  const Q=(typeof WC2019_QUOTA!=='undefined' && WC2019_QUOTA[sp.set]) || null;
  if(!Q || !sp.weeks) return null;
  const F=ccMXLobby(sp.size), regs=Object.keys(Q);
  const total=regs.reduce((s,r)=>s+Q[r], 0)*sp.weeks.length;
  const q=r=>Math.max(1, Math.round(Q[r]*F/total));
  const W=m.wcq=m.wcq||{};
  const R=sp.rounds.length, games=sp.rounds[R-1].games;
  const out=[];
  sp.weeks.forEach(w=>{
    const end=ccMXWeekEnd(m.y, m.n, w);
    if(!end || careerToday()<=end && !(W[w] && Object.keys(W[w]).length)) return;
    const Ww=W[w]=W[w]||{};
    regs.forEach(reg=>{
      if(!Ww[reg] && careerToday()>end){
        const taken=ccMXWcTaken(m, w);
        const pool=ccMXWcPool(sp, reg).filter(r=>!taken.has(ccMXWcRowKey(r)));
        const rnd=careerRng(ccHashStr('wcq|'+m.season+'|'+m.n+'|'+w+'|'+reg));
        const top=pool.slice(0, F*2);
        for(let i=top.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); const t=top[i]; top[i]=top[j]; top[j]=t; }
        const room=top.slice(0, F).map(r=>{ const t=ccMajorTeamFrom(r); t._row=r; return t; });
        if(room.length){
          ccWithEventSize(sp.size, ()=>{
            room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
            ccWorldRun('wcq|'+m.season+'|'+m.n+'|'+w+'|'+reg, ()=>simulateGames(room, games, ccM24Points, CC_M24_KILL));
          });
          Ww[reg]=ccM24Rank(room).slice(0, q(reg)).map(t=>t._row);
        } else Ww[reg]=[];
      }
      (Ww[reg]||[]).forEach(r=>out.push(r));
    });
  });
  if(m.ticket && !out.includes('you')) out.unshift('you');
  return out.length ? out : null;
}
function ccMXGfRows(y, n, m){
  const sp=ccMXSpec(y, n), F=sp.finalN||ccMXLobby(sp.size), out=[], seen=new Set();
  const add=r=>{ const k=ccMXKey(r); if(!r || seen.has(k) || out.length>=F) return; seen.add(k); out.push(r); };
  // World Cup: финал — те, кто взял путёвки сыгранных недель (ccMXWcRows); без карьеры — настоящий список.
  if(sp.kind==='wc'){ ((m ? ccMXWcRows(m, sp) : null) || (typeof WC2019_FIELD!=='undefined' && WC2019_FIELD[sp.set]) || []).forEach(add); return out; }
  if(!m) return out;
  ccMXSettleWeeks(m); ccMXSettleHeats(m);
  ccMXHeats(m).forEach((h,i)=>((m.heatRes[i]||{}).up||[]).forEach(add));
  if(sp.wild){ const w=ccMXWildWinner(m, sp); if(w) add(w); }
  Object.keys(m.series).sort((a,b)=>m.series[b]-m.series[a]).forEach(k=>add(m.seriesRows[k]));
  return out;
}
function ccMXWorldFinalRoom(y, n, drafted, lobbyCr){
  const sp=ccMXSpec(y, n), F=sp.finalN||ccMXLobby(sp.size);
  const rows=ccMXGfRows(y, n, ccMXOf(y, n));
  const room=rows.filter(r=>r!=='you').map(ccMajorTeamFrom);
  if(room.length<F){
    const seen=new Set(room.map(ccSeatKey));
    careerCupField(lobbyCr, drafted, F+20, null, false, CC_FIELD_SHARP.final).forEach(t=>{
      if(room.length>=F || seen.has(ccSeatKey(t))) return;
      seen.add(ccSeatKey(t)); room.push(t);
    });
  }
  return room.slice(0, F);
}
function ccMXCanStage(ev, cr, gaveUp){
  const sp=ccMXSpec(ev.yx, ev.n); if(!sp) return false;
  const s=ccMXOf(ev.yx, ev.n);
  if(s && s.got[ev.id]) return false;
  if(ev.stage==='q'){
    /* World Cup 2019: прошедшие в Нью-Йорк играли следующие недели Online Open ради призовых (его слово 29.09:
       «почему week 3 соло не играется, можно же играть, даже если квал»). Вторую путёвку неделя не даёт — она уже есть.
       FNCS-недели после путёвки закрыты, как было. */
    if(s && s.ticket && sp.kind!=='wc') return false;
    const first=ev.rounds[0];
    if(first===1) return true;
    const prev=s && s.q[ev.w] && s.q[ev.w]['r'+(first-1)];
    return ccSeedHasMe(prev);
  }
  if(ev.stage==='heat'){
    if(!s || s.ticket || !s.youKey) return false;
    ccMXSettleHeats(s);
    return ccMXYourHeat(s, ev.r)>=0;
  }
  // Гранд-финал — с путёвкой; C2S4 — и с местом в Wildcard (9–16-е в хите): тот же вечер, сначала один матч.
  return !gaveUp && !!(s && (s.ticket || (sp.wild && s.wild && !s.wildRes)));
}
async function runCareerMajorMX(){
  const ev=careerMajorOn(careerToday());
  if(!ev || !ev.yx || !careerMajorCan(ev)) return;
  const sp=ccMXSpec(ev.yx, ev.n);
  const prevEv=CC_EVENT_SIZE;
  CC_EVENT_SIZE=sp.size;
  /* СОЛО-МЕЙДЖОР ВДВОЁМ — ЛИЧНЫЙ ВЕЧЕР (живой прогон двоих 30.09: неделя World Cup Solo 2019 не
     доигрывалась вовсе — каждый клиент ставил в поле себя одного, таблицы расходились с первой игры,
     вечер вставал). Открытые квалы World Cup и соло-FNCS 2020 каждый играет сам, как в жизни —
     в разных лобби; в хитах двое и так в разных комнатах. Итог (журнал, рост, деньги) — свой, день
     шагает, когда отыграли оба или второму сегодня нечего (ccMXTeamSettle). */
  /* КВАЛЫ СОЛО-НЕДЕЛИ ВДВОЁМ — ОДНО ЛОББИ (Notion 21.10, двое играли командой: «на квалах соло ворлд кап нет
     реализма, кнопка 0/2 не работает, ты соло запускаешься, таблицы всегда разные и непонятно, кто квальнулся»).
     Если сегодня квал недели могут играть оба (ccMXSharedOk), вечер общий, как соло-кап вдвоём: гейт «0/2», один сид,
     оба в одной сотне своими адресами, у каждого своя высадка; прошёл раунд один — дальше врозь (ccTeamNightApart).
     Хиты и финал Мейджора, и день, когда второму играть нечего, — как было, личным вечером. День после вечера
     шагает по-прежнему через mxDone (ccMXTeamSettle). */
  const soloTeam=sp.size===1 && ccMpTeam();
  // Отметка напарника на сегодня могла ещё не доехать (перемотка у одного быстрее) — решаем, дождавшись её.
  if(soloTeam && ev.stage==='q') await ccMXPeerFlagWait();
  const shared=soloTeam && ccMXSharedOk(ev);
  if(soloTeam){ if(!shared) CC_MP_ALONE=true; CC_MX_SOLO_RUN=true; CC_MX_SHARED=shared; CC_MX_GATE_OFF=false; }
  try{
    try{ await ccMXRun(ev, sp, soloTeam); }
    catch(e){
      /* Ворота общего квала отменены — напарник свой уже сыграл врозь (см. ccMpApplyRemote). Вечер не начинался
         (ворота — первая строка раннера): играем его тут же, лично. */
      if(!(shared && CC_MX_GATE_OFF)) throw e;
      CC_MX_GATE_OFF=false; CC_MX_SHARED=false; CC_MP_ALONE=true;
      await ccMXRun(ev, sp, soloTeam);
    }
  }
  finally{
    CC_EVENT_SIZE=prevEv;
    if(soloTeam){
      CC_MX_SOLO_RUN=false; CC_MP_ALONE=false; CC_MP_HOLD=false; CC_MX_SHARED=false;
      if(shared) CC_MP_DAY_DUE=false;   // общий вечер закрыт сервером, но день и тут двигает ccMXTeamSettle
      /* Разошлись посреди общего квала (прошёл один из двоих) — сервер вечер не закрывал (ccMpClose врозь пропускается),
         и сид вечера оставался включён: ccMXTeamSettle при нём не шагает, перемотка вставала (онлайн-прогон 2020, 22.10:
         FNCS C2S3 квал 1, раунды 1–2 в один вечер, 1.08). Вечер кончен — генератор вкладки возвращается себе. */
      if(shared) ccMpSeedOff();
      const cr=CAREER.career, me=hKey(careerCard());
      // Ворота отменены (напарник сыграл свой квал врозь) — вечера не было, отметки нет: «Играть» ещё раз — лично.
      if(!CC_MX_GATE_OFF) (cr.mxDone=cr.mxDone||{})[me]=careerToday();
      CC_MX_GATE_OFF=false;
      careerSave();
      ccMXTeamSettle();
    }
  }
}
let CC_MX_SHARED=false, CC_MX_GATE_OFF=false;
// Своя отметка «сегодня могу играть квал соло-недели» — в командное состояние (mxCan), чтобы напарник знал до «Играть».
function ccMXCanStamp(){
  try{
    if(!ccMpTeam() || (typeof ccRaceOn==='function' && ccRaceOn()) || !ccMXSoloTeamDay()) return;
    const ev=careerMajorOn(careerToday()), card=careerCard(); if(!card) return;
    const v=careerToday()+'|'+((ev && ev.stage==='q' && careerMajorCan(ev)) ? 1 : 0);
    const cr=CAREER.career, me=hKey(card);
    cr.mxCan=cr.mxCan||{};
    if(cr.mxCan[me]!==v){
      cr.mxCan[me]=v;
      // Напарнику — сразу, а не со следующим сохранением: он может решать прямо сейчас (ccMXPeerFlagWait).
      if(!CC_MP_RAND && typeof MP!=='undefined' && MP.push && MP.state==='live') setTimeout(function(){ try{ if(!CC_MP_RAND) MP.push(ccTeamState()); }catch(e){} }, 0);
    }
  }catch(e){}
}
// Ждём отметку напарника «могу/не могу» на сегодня (или его «сыграл») — не дольше CC_MX_FLAG_MS.
const CC_MX_FLAG_MS=8000;
async function ccMXPeerFlagWait(){
  try{
    if(typeof MP==='undefined' || MP.state!=='live' || !MP.peer) return;
    ccMXCanStamp();
    const pk=hKey(MP.peer), t0=Date.now();
    const known=()=>{ const cr=CAREER.career, today=careerToday();
      return String((cr.mxCan||{})[pk]||'').indexOf(today+'|')===0 || (cr.mxDone||{})[pk]===today; };
    while(!known() && Date.now()-t0<CC_MX_FLAG_MS){
      const w=new Promise(r=>setTimeout(r, 150));
      await ((typeof ccMpIdle==='function') ? ccMpIdle(w) : w);
    }
  }catch(e){}
}
// Квал соло-недели сегодня играют оба — вечер общий. Решают одни и те же общие отметки у обоих (mxCan, mxDone).
function ccMXSharedOk(ev){
  if(!ev || ev.stage!=='q' || !ccMpTeam() || (typeof ccRaceOn==='function' && ccRaceOn())) return false;
  /* Только вечер в один раунд (недели World Cup Solo 2019). Два раунда за вечер (соло-FNCS 2020, «round 1–2») — личным,
     как было: расход посреди такого вечера оставлял вылетевшего в общем вечере без закрытия, перемотка вставала
     (онлайн-прогон 2020, 22.10: FNCS C2S3 квал 1, 1.08). */
  if(!Array.isArray(ev.rounds) || ev.rounds.length!==1) return false;
  if(typeof MP==='undefined' || MP.state!=='live' || !MP.peer) return false;
  const me=careerCard(); if(!me || hKey(MP.peer)===hKey(me)) return false;
  ccMXCanStamp();
  const cr=CAREER.career, today=careerToday(), mk=hKey(me), pk=hKey(MP.peer), done=cr.mxDone||{}, can=cr.mxCan||{};
  if(done[mk]===today || done[pk]===today) return false;
  return can[mk]===today+'|1' && can[pk]===today+'|1';
}
/* Личные соло-вечера Мейджора в команде: кто сегодня отыграл (или играть нечего) — cr.mxDone по нику;
   день шагает, когда отмечены оба. Состояние напарника, приехавшее посреди своего вечера, ждёт
   (CC_MX_PENDING) — применить его посреди игры значит выбросить кэши мира. */
let CC_MX_SOLO_RUN=false, CC_MX_PENDING=null, CC_MX_SETTLING=false;
// Сегодня — соло-Мейджор в командной карьере (личные вечера, день от ведущего).
function ccMXSoloTeamDay(){
  if(!ccMpTeam()) return false;
  const ev=careerMajorOn(careerToday());
  return !!(ev && ev.yx && (ccMXSpec(ev.yx, ev.n)||{}).size===1);
}
// Перемотка ждёт, пока день сдвинет ведущий; не дождалась за пять минут — встаёт с причиной.
async function ccMXFfWait(day){
  for(let i=0; i<600 && careerToday()===day; i++){
    if(i%10===0) try{ ccMXTeamSettle(); }catch(e){}
    await new Promise(r=>setTimeout(r, 500));
  }
  if(careerToday()===day && typeof CC_FF!=='undefined' && CC_FF) CC_FF.stop={text:L().ccMpSoloWait};
}
function ccMXTeamSettle(){
  if(CC_MX_SETTLING || CC_MX_SOLO_RUN) return false;
  if(!ccMpTeam() || typeof MP==='undefined' || CC_MP_RAND) return false;
  if(CC_MX_PENDING){ const t=CC_MX_PENDING; CC_MX_PENDING=null; ccMpApplyRemote(t); }
  const cr=CAREER && CAREER.career; if(!cr) return false;
  const today=careerToday(), ev=careerMajorOn(today);
  if(!ev || !ev.yx) return false;
  const sp=ccMXSpec(ev.yx, ev.n);
  if(!sp || sp.size!==1) return false;
  CC_MX_SETTLING=true;
  try{
    const me=hKey(careerCard()), peer=MP.peer ? hKey(MP.peer) : null;
    const done=cr.mxDone=cr.mxDone||{};
    // Сам сегодня не играю (не прошёл, уже сыграл) — отмечаюсь, чтобы напарник не ждал.
    if(done[me]!==today && !careerMajorCan(ev)){ done[me]=today; careerSave(); }
    if(done[me]!==today) return false;
    if(peer && done[peer]!==today) return false;
    /* День двигает ОДИН — тот, чей ник меньше; второй получает день его состоянием. Оба доиграли почти
       разом — и оба шагнули сами, каждый со своим состоянием; следующий общий вечер разошёлся с первой
       игры (живой прогон 2019, World Cup Duos неделя 2). */
    if(peer && me>peer) return false;
    CC_MP_ALONE=true;
    try{ careerAdvanceTo(ccAddDays(today, 1)); }
    finally{ CC_MP_ALONE=false; }
    careerSave();
    return true;
  } finally { CC_MX_SETTLING=false; }
}
async function ccMXRun(ev, sp, soloTeam){
  const cr=CAREER.career; let lastR=0;
  const mpStart=ccMpLock() ? await ccMpGate('major') : null;
  careerCampBonus('major', ev.id||ev.label||'');
  const me=careerCard(), mates=careerMates();
  if(!me || mates.length<careerMateSeats() || mates.some(function(m){ return !m; })) return;
  const mate=mates[0]||null;
  const prevMode=CARD_MODE, prevSize=squadSize, prevDrafted=drafted;
  CARD_MODE=true; squadSize=sp.size; drafted=[me].concat(mates);
  // Клетки острова под формат вечера: соло-неделя дробит остров, как любое соло-лобби.
  const prevSet=ACTIVE_LANDING_SET; useLandingSet(ACTIVE_LANDING_SET);
  skipAnimation=false; CC_SKIP_RUN=false;
  resetRunRecord();
  document.getElementById('majorStages').innerHTML='';
  const rsPrev=document.getElementById('runSummary'); if(rsPrev) rsPrev.innerHTML='';
  document.getElementById('lobbyTitle').textContent='';
  document.getElementById('lobbyBody').innerHTML='';
  clearEventPanel();
  document.getElementById('finalBanner').style.display='none';
  clearLandingResultsMap();
  CAREER_RUN=true;
  show('screen-results');
  ensureSkipButton();

  /* Общий квал соло-недели (CC_MX_SHARED, см. runCareerMajorMX): оба человека — своими соло-командами, как в соло-капе
     вдвоём (runCareerVictoryNight): карточка с провода, своя форма, свой адрес вопросов (mpTag), порядок — по нику. */
  const pc=(CC_MX_SHARED && typeof MP!=='undefined' && MP.peer && hKey(MP.peer)!==hKey(me)) ? MP.peer : null;
  const soloYouMX=function(card, form, label){
    const t=careerTeam([card], true);
    t.pow=Math.round(t.pow+form);
    t.summitRegion=ccCareerRegion();
    t.name=label; t.mpTag=':'+hKey(card);
    return t;
  };
  let you, mxMate=null;
  if(pc){
    { const self=ccSoloSelf(me); you=soloYouMX(self.card, self.form, L().yourTeamPrefix+teamLabel(drafted)); }
    mxMate=soloYouMX(pc, Number(pc.formPow)||0, teamLabel([pc])); mxMate.isMate=true;
  } else {
    you=careerYouTeam(drafted);
    you.name=L().yourTeamPrefix+teamLabel(drafted);
  }
  you.isYou=true;
  let humans=mxMate ? (hKey(me)<hKey(pc) ? [you, mxMate] : [mxMate, you]) : [you];
  const m=ccMXState(ev.yx, ev.n);
  const F=ccMXLobby(sp.size);
  const rowsOf=rows=>ccStageRowsOf(rows, you);
  const seedOf=t=>ccSeedRow(t, you, ccMajorSeatRow);
  // Закрытый раунд из своих записей: напарник в них — строкой своей карточки; на его место садится он сам.
  const mateIn=fld=>{
    if(!mxMate) return;
    const pk=hKey(pc), i=fld.findIndex(t=>t && t!==you && (t.squad||[]).some(c=>c && hKey(c)===pk));
    if(i>=0) fld[i]=mxMate;
    else { ccTeamNightApart(); mxMate=null; humans=[you]; }
  };
  let field, spec, stageLabel=ev.label, through=false, note='', games=0;
  let ranked=[], place=0, heatPay=null, wildOut=false;
  const play=async (room, sp2, label, open)=>{
    room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; t.stageLog=[]; });
    CC_M24_GAME=0;
    const pS=ccPastMajorScore(ev);
    await simulateGamesLive(room, sp2.games, pS ? pS.pts : ccM24Points, pS ? pS.kill : CC_M24_KILL, 'stage', 0, null, null,
      {lobbySize:F, stageName:label, mapReplay:true, choices:true, stopOnYourDeath:true, roomOnly:!open,
       together: mxMate ? humans : null,
       dropEachGame:(g,rm)=>{ CC_M24_GAME=g; return open ? null : mxMate ? ccSoloDrops(rm||room, humans, label, ['major']) : careerLandingPick(rm||room, you, label, ['major']); }});
    games+=sp2.games;
    return ccM24Rank(room);
  };
  if(ev.stage==='q'){
    const Q=m.q[ev.w]=m.q[ev.w]||{};
    const R=sp.rounds.length;
    for(let i=0; i<ev.rounds.length; i++){
      const r=ev.rounds[i]; lastR=r;
      spec=Object.assign({}, sp.rounds[r-1]);
      const wc=sp.kind==='wc' && r===R;
      if(wc) spec.cut=ccMXWcQuota(sp);
      const open=!!spec.open;
      // Вдвоём из поля вычитаются оба (и тёзки обоих), людей — столько же, сколько мест: поле того же размера.
      field=open ? [...humans, ...careerCupField(cr, mxMate ? [me, pc] : drafted, careerLadderEntrants()-(humans.length-1), 'mx|'+ev.yx+'|'+ev.n+'|'+ev.w+'|'+r, true, 0)]
                 : rowsOf(Q['r'+(r-1)]);
      if(!open) mateIn(field);
      if(!open){
        const want=Math.min(sp.rounds[r-2].cut, F*2), seen=new Set(field.map(ccSeatKey));
        if(field.indexOf(you)<0) field.push(you);
        if(field.length<want) ccM23World(want+20, 'mxq|'+ev.yx+'|'+ev.n+'|'+ev.w+'|'+r).forEach(t=>{
          if(field.length>=want || seen.has(ccSeatKey(t))) return;
          seen.add(ccSeatKey(t)); field.push(t);
        });
      }
      stageLabel=ccYearLabel(ccMXRowId(ev.yx, ev.n, 'W'+ev.w+'R'+r), careerToday(), careerToday());
      ranked=await play(field, spec, stageLabel, open);
      place=ranked.indexOf(you)+1;
      let heatsNote=null;
      if(r===R){
        through=wc && place<=spec.cut;
        if(wc){
          if(through) m.ticket=true;
          // Кто из твоего региона взял путёвки этой недели — они и едут в Нью-Йорк (ccMXWcRows).
          const W=m.wcq=m.wcq||{}, done=ccMXWcTaken(m, ev.w);
          (W[ev.w]=W[ev.w]||{})[careerPrizeRegion()==='NAW' ? 'NAW' : careerPrizeRegion()]=
            ranked.map(seedOf).filter(r=>r==='you' || !done.has(ccMXWcRowKey(r))).slice(0, spec.cut);
        }
        else {
          m.youKey=ccSeatKey(you);
          const wl=ranked.map(t=>({key:ccSeatKey(t), row:seedOf(t)})), wk=new Set(wl.map(x=>x.key));
          ccMXSemiTail(m, Q, wk, ccMXWeekSize(sp), wl);
          ccMXSeriesAddList(m, wl, ev.w, ranked.length);
          /* Хиты берут верх серии: хитов × лобби (ccMXHeats). Карточка финала недели ставила «не
             прошёл» всегда — через неё шла только путёвка World Cup (его правка 29.09: «в финалах
             нет плашки, что квал в хиты»). В последнюю неделю место уже окончательное — «в хитах»,
             раньше — «в зоне хитов» по текущей серии. */
          if((sp.heats||[]).length){
            Q.done=true; ccMXSettleWeeks(m);
            const hl=ccMXHeatList(m), need=hl.need;
            const lastWeek=ev.w===(sp.weeks||[])[(sp.weeks||[]).length-1];
            through=ccSeedHasMe(hl.list);
            heatsNote=through ? (lastWeek ? L().ccYrXHeatsIn(need) : L().ccYrXHeatsZone(need)) : L().ccYrXHeatsOut(need);
          }
        }
        Q.done=true;
      } else {
        through=place<=spec.cut;
        // Следующий раунд открытый — зал не нужен, только отметка «прошёл».
        const nextOpen=!!(sp.rounds[r] && sp.rounds[r].open);
        Q['r'+r]=nextOpen ? (through ? ['you'] : []) : ranked.slice(0, spec.cut).map(seedOf);
        if(r===R-1 && sp.kind!=='wc'){ m.youKey=ccSeatKey(you); Q.semi=ranked.slice(0, ccMXWeekSize(sp)).map(seedOf); }
      }
      m.youKey=ccSeatKey(you);
      note = (r===R) ? (wc ? (through ? L().ccYrXWcIn(spec.cut) : L().ccRelFail(spec.cut))
                              : L().ccYr24Series(m.series[m.youKey]||0, ccMXSeriesRank(m, m.youKey))+(heatsNote ? ' · '+heatsNote : ''))
                     : (through ? L().ccRelPass(spec.cut) : L().ccRelFail(spec.cut));
      if(i<ev.rounds.length-1){
        // Раунд недели с призовыми (Season X: раунд 2 платит топ-150) — деньги сразу.
        const pf=ccMXWeekPrize(sp, ev.w, r, ev.n);
        if(pf){ careerMoneyAdd(ranked, pf); const c=pf(place); if(c){ ccPayIn(ccShareOf(c, you)); careerNews('good', 'ccNewsEvCash', [stageLabel, place, ccNum(c)], {tbl:ccStageShot(ranked, you, 1, stageLabel)}); } }
        const sh=createStageCardShell(stageLabel+' — '+field.length);
        await revealStageLog(you, sh, true);
        finalizeStageCard(sh, place, field.length, you.stagePts, through, false, note);
        await revealStandings(sh, ranked, you, spec.cut||0, null, null, pf, null, !!pf);
        careerPrAdd(ranked, {div:cr.division, kind:'major', stage:'q'});
        /* Следующий раунд — только у прошедших. Прошёл один из двоих — дальше врозь, как соло-кап вдвоём (общая часть уже
           посчитана обоими и закрыта общим ключом, хвост — свой). Не прошёл никто — оба заканчивают здесь. */
        if(mxMate && (ranked.indexOf(mxMate)+1<=spec.cut)!==through){ ccTeamNightApart(); mxMate=null; humans=[you]; }
        /* И в гонке — как второй раунд соло-капа (runCareerVictoryNight): кого-то из людей комнаты нет среди прошедших —
           дальше врозь. Онлайн-прогон гонки 2020 (22.10): неделя 2 Мейджора 2, 1.08 — прошедший играл раунд 2 один, а
           вылетевший ждал его ответа на вопрос («Your partner never reached the question»), доски разошлись. */
        if(typeof ccRaceLock==='function' && ccRaceLock()){
          const rivalOut=ranked.some((t, i)=>t && t.isRival && i>=spec.cut);
          if(!through || rivalOut) ccRaceNightApart();
        }
        if(!through) break;
      }
    }
  } else if(ev.stage==='heat'){
    ccMXSettleHeats(m);
    const hi=ccMXYourHeat(m, ev.r), heat=ccMXHeats(m)[hi];
    spec={games:sp.heatGames||6, cut:heat.cut};
    field=rowsOf(heat.rows);
    if(field.indexOf(you)<0) field.push(you);
    stageLabel=L().ccYrXHeatN(ev.label, hi+1);
    ranked=await play(field, spec, stageLabel, false);
    place=ranked.indexOf(you)+1;
    m.heatRes[hi]={up:ranked.slice(0, heat.cut).map(seedOf), rest:ranked.slice(heat.cut).map(seedOf)};
    through=place<=heat.cut;
    if(through) m.ticket=true;
    note=through ? L().ccYr22SemiUp : L().ccRelFail(heat.cut);
    if(!through && sp.wild && place<=heat.cut+(sp.wild.to-sp.wild.from+1)){ m.wild=true; note=L().ccYrXWildIn; }
    // Хиты 2020-го платили не прошедшим (ccMXHeatPrize) — деньги идут той же веткой, что неделя.
    heatPay=ccMXHeatPrize(sp, ev.n, hi, heat.cut);
  } else {
    if(!m.ticket && m.wild && sp.wild && !m.wildRes){
      // Wildcard: один матч, проходит только победитель. Проиграл — вечер кончается здесь (wildOut).
      // 32 места: 8 с каждого хита, одно из них твоё.
      const wf=rowsOf(ccMXWildRows(m, sp).slice(0, (sp.heats||[]).length*(sp.wild.to-sp.wild.from+1)-1));
      if(wf.indexOf(you)<0) wf.unshift(you);
      const wl=L().ccYrXWildLabel(sp.name), wspec={games:sp.wild.games, cut:1};
      const wr=await play(wf, wspec, wl, false);
      const wp=wr.indexOf(you)+1;
      m.wildRes={win:seedOf(wr[0])};
      if(wp===1){
        m.ticket=true;
        const pf=ccMXWildPrize(sp);
        const sh=createStageCardShell(wl+' — '+wf.length);
        await revealStageLog(you, sh, true);
        finalizeStageCard(sh, wp, wf.length, you.stagePts, true, false, L().ccYr22SemiUp);
        await revealStandings(sh, wr, you, 1, null, null, pf, null, !!pf);
        careerPrAdd(wr, {div:cr.division, kind:'major', stage:'wild'});
        if(pf) careerMoneyAdd(wr, pf);
        careerNews('good', 'ccNewsMajThrough', [wl, 1, wf.length], {tbl:ccStageShot(wr, you, 1, wl)});
      } else {
        wildOut=true; field=wf; ranked=wr; place=wp; spec=wspec; stageLabel=wl;
        through=false; note=L().ccRelFail(1); heatPay=ccMXWildPrize(sp);
      }
    }
  }
  if(ev.stage==='final' && !wildOut){
    spec={games:sp.finalGames||12, cut:0};
    field=rowsOf(ccMXGfRows(ev.yx, ev.n, m));
    // Отпечаток записи Мейджора — в сверку поля: разошлось поле финала — видно, на чём (хиты, их итоги, серия).
    try{ const h=v=>String(ccHashStr(JSON.stringify(v||null))).slice(0,6);
      CC_MP_FIELD_FP='mx h'+h(m.heats)+' r'+h(m.heatRes)+' s'+h(m.series)+' q'+h(m.q)+' w'+h(m.wf)+' tw'+CC_TW_APPLIED; }catch(e){}
    if(field.indexOf(you)<0) field.unshift(you);
    /* Недобор путёвок (квоты недель World Cup округляются — соло-финал 2019 был 93 из 100, 21.10) —
       добираем сильнейшими, как в финале без тебя (ccMXWorldFinalRoom). */
    if(field.length<F){
      const seen=new Set(field.map(ccSeatKey));
      careerCupField(cr, drafted, F+20, null, false, CC_FIELD_SHARP.final).forEach(t=>{
        if(field.length>=F || seen.has(ccSeatKey(t))) return;
        seen.add(ccSeatKey(t)); field.push(t);
      });
    }
    field=field.slice(0, F);
    if(field.indexOf(you)<0) field[field.length-1]=you;
    ranked=await play(field, spec, stageLabel, false);
    place=ranked.indexOf(you)+1;
  }
  m.got[ev.id]=true;
  removeSkipButton();
  const fin=ev.stage==='final' && !wildOut;
  // Неделя World Cup, сыгранная до финала недели, — платит по таблице недели своего региона.
  // Только за последний раунд вечера: промежуточные платятся в цикле (иначе вылет на раунде 2 платил бы дважды).
  const wcPrize=heatPay || ((!fin && ev.stage!=='heat' && lastR && ev.rounds && lastR===ev.rounds[ev.rounds.length-1]) ? ccMXWeekPrize(sp, ev.w, lastR, ev.n) : null);
  const wcWeek=!!wcPrize;
  const prizeFn=fin ? majorPrize : wcWeek ? wcPrize : null;
  const shell=createStageCardShell(stageLabel+' — '+field.length);
  await revealStageLog(you, shell, true);
  finalizeStageCard(shell, place, field.length, you.stagePts,
    ccStagePassed(through, spec, place, fin ? majorPrize : null), false, fin ? '' : note);
  await revealStandings(shell, ranked, you, spec.cut||0, null, null, prizeFn, null, fin || wcWeek);
  careerPrAdd(ranked, {div:cr.division, kind:'major', stage:fin ? 'final' : ev.stage});
  let cash=0;
  if(fin){
    careerMoneyAdd(ranked, majorPrize);
    cash=majorPrize(place);
    if(cash) ccPayIn(ccShareOf(cash, you));
    careerReachAdd(careerReachResult(place, field.length, 1, 'major'));
    careerNews(cash?'good':'flat', cash?'ccNewsEvCash':'ccNewsEvNoCash',
               cash?[sp.name, place, ccNum(cash)]:[sp.name, place, field.length], {tbl:ccStageShot(ranked, you, 1, stageLabel)});
    if(place>field.length/2) careerNews('bad', 'ccPostTriedBest', []);
    careerCongrats(ranked, you, L().ccCongratsEv(sp.name));
    cr.major={n:ev.n, got:'final', pass:'final', ticket:false};
  } else if(wcWeek){
    careerMoneyAdd(ranked, wcPrize);
    cash=wcPrize(place);
    if(cash){ ccPayIn(ccShareOf(cash, you)); careerNews('good', 'ccNewsEvCash', [stageLabel, place, ccNum(cash)], {tbl:ccStageShot(ranked, you, 1, stageLabel)}); }
    // Неделя FNCS с призом — такой же этап, как без него: отметка о проходе не теряется.
    if(sp.kind!=='wc'){
      const prev=(cr.major && cr.major.n===ev.n) ? cr.major : null;
      cr.major={n:ev.n, got:ev.stage, pass: through ? ev.stage : (prev ? prev.pass||null : null), ticket:!!m.ticket};
    }
  } else {
    careerNews(through?'good':'flat', through?'ccNewsMajThrough':'ccNewsMajOut',
               [stageLabel, place, field.length], {tbl:ccStageShot(ranked, you, 1, stageLabel)});
    const prev=(cr.major && cr.major.n===ev.n) ? cr.major : null;
    cr.major={n:ev.n, got:ev.stage, pass: through ? ev.stage : (prev ? prev.pass||null : null), ticket:!!m.ticket};
  }
  const places=(you.stageLog||[]).map(g=>g.place);
  cr.log=cr.log||[];
  careerGrowEvent(place, field.length, you, field);
  cr.log.push({season:cr.season, day:careerToday(), div:cr.division, place:place, of:field.length, pts:you.stagePts,
               passed: fin ? cash>0 : through, ovr:CAREER.player.ovr, games:games||spec.games, wins:you.wins||0, elims:you.stageElims||0,
               avg: places.length ? Math.round(places.reduce((s,v)=>s+v,0)/places.length*10)/10 : null,
               mate: (sp.size>1 && mate) ? mate.handle : null, mates: ccLogMates(mates.slice(0, sp.size-1)), prize:ccShareOf(cash, you), kind:'major', stage:fin ? 'final' : wildOut ? 'wild' : ev.stage,
               size: sp.size, won: fin ? ccStageSeatRow(ranked[0]) : undefined, top: fin ? ccStageTop(ranked, you) : undefined,
               who: soloTeam ? hKey(me) : undefined, solo: soloTeam || undefined});
  await ccMpClose(ranked);
  // Личный соло-вечер в команде день не двигает сам — см. ccMXTeamSettle.
  if(!soloTeam) careerAdvanceTo(ccAddDays(careerToday(), 1));
  if(ccOffersOpen(place, field.length)){
    CAREER.offers=careerOrgOffers();
    careerOrgOffersToDms();
    if(CAREER.offers && CAREER.offers.length) CAREER.offersDeclined=null;
  }
  careerSave();
  CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; useLandingSet(prevSet); CC_KILL_CAP=0;
  careerRenderHub('centre');
  careerReloadResultCard({label:stageLabel, place:place, of:field.length, through: fin ? cash>0 : through, cut:spec.cut||0,
    note: fin ? null : note, seat:false, seatText:null, money: (fin || wcWeek) ? cash : null});
}
/* Призовые недель Online Open World Cup 2019 — финал недели (Event2) платил до 2000-го места, своя
   таблица у каждого региона (Tracker imp_event.PayoutTable, tools/measured/wc2019-week-pay.json).
   Его правка 29.09: «и не пишет денег сколько выиграл». Доллары на игрока; NAC — NA East, ME — EU. */
const CC_WC_WEEK_PAY={"1":{"EU":[[1,5000],[2,4000],[3,3000],[4,2500],[5,2250],[6,2000],[7,1750],[8,1500],[9,1250],[10,1000],[20,800],[30,650],[40,550],[50,450],[75,400],[100,350],[250,300],[500,250],[1000,200],[1500,150],[2000,100]],"NAE":[[1,5000],[2,4000],[3,3000],[4,2500],[5,2250],[6,2000],[7,1750],[8,1500],[9,1250],[10,1000],[20,800],[30,650],[40,550],[50,450],[75,400],[100,350],[250,300],[500,250],[1000,150],[1500,100]],"NAW":[[1,4000],[2,3500],[3,3000],[4,2500],[5,2000],[6,1700],[7,1500],[8,1250],[9,1000],[10,800],[20,700],[30,500],[40,450],[50,350],[75,250],[100,200],[250,150],[500,100]],"BR":[[1,3000],[2,2500],[3,2250],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,800],[10,600],[20,500],[30,400],[40,300],[50,200],[75,175],[100,150],[250,125],[500,100]],"ASIA":[[1,3000],[2,2500],[3,2250],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,800],[10,600],[20,500],[30,400],[40,300],[50,200],[75,175],[100,150],[250,125],[500,100]],"OCE":[[1,2500],[2,2250],[3,2000],[4,1750],[5,1500],[6,1250],[7,1000],[8,750],[9,500],[10,450],[20,400],[30,350],[40,300],[50,250],[75,200],[100,150],[250,100]]},"2":{"EU":[[1,5000],[2,4000],[3,3250],[4,2500],[5,2250],[6,2000],[7,1750],[8,1500],[9,1250],[10,1000],[20,900],[30,650],[40,550],[50,450],[75,400],[100,350],[250,250],[500,175],[1000,100]],"NAE":[[1,5000],[2,4000],[3,3250],[4,2500],[5,2250],[6,2000],[7,1750],[8,1500],[9,1250],[10,1000],[20,900],[30,650],[40,550],[50,450],[75,400],[100,350],[250,250],[500,175]],"NAW":[[1,3250],[2,2750],[3,2375],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,750],[10,500],[20,350],[30,300],[40,250],[50,200],[75,150],[100,125],[250,100]],"BR":[[1,3250],[2,2750],[3,2250],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,750],[10,500],[20,400],[30,350],[40,300],[50,250],[75,200],[100,100]],"ASIA":[[1,3250],[2,2750],[3,2250],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,750],[10,500],[20,400],[30,350],[40,300],[50,250],[75,200],[100,100]],"OCE":[[1,2500],[2,2250],[3,2000],[4,1750],[5,1500],[6,1250],[7,875],[8,625],[9,400],[10,350],[20,300],[30,250],[40,200],[50,150],[75,100]]},"3":{"EU":[[1,5000],[2,4000],[3,3000],[4,2500],[5,2250],[6,2000],[7,1750],[8,1500],[9,1250],[10,1000],[20,800],[30,650],[40,550],[50,450],[75,400],[100,350],[250,300],[500,250],[1000,200],[1500,150],[2000,100]],"NAE":[[1,5000],[2,4000],[3,3000],[4,2500],[5,2250],[6,2000],[7,1750],[8,1500],[9,1250],[10,1000],[20,800],[30,650],[40,550],[50,450],[75,400],[100,350],[250,300],[500,250],[1000,150],[1500,100]],"NAW":[[1,4000],[2,3500],[3,3000],[4,2500],[5,2000],[6,1700],[7,1500],[8,1250],[9,1000],[10,800],[20,700],[30,500],[40,450],[50,350],[75,250],[100,200],[250,150],[500,100]],"BR":[[1,3000],[2,2500],[3,2250],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,800],[10,600],[20,500],[30,400],[40,300],[50,200],[75,175],[100,150],[250,125],[500,100]],"ASIA":[[1,3000],[2,2500],[3,2250],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,800],[10,600],[20,500],[30,400],[40,300],[50,200],[75,175],[100,150],[250,125],[500,100]],"OCE":[[1,2500],[2,2250],[3,2000],[4,1750],[5,1500],[6,1250],[7,1000],[8,750],[9,500],[10,450],[20,400],[30,350],[40,300],[50,250],[75,200],[100,150],[250,100]]},"4":{"EU":[[1,5000],[2,4000],[3,3250],[4,2500],[5,2250],[6,2000],[7,1750],[8,1500],[9,1250],[10,1000],[20,900],[30,650],[40,550],[50,450],[75,400],[100,350],[250,250],[500,175],[1000,100]],"NAE":[[1,5000],[2,4000],[3,3250],[4,2500],[5,2250],[6,2000],[7,1750],[8,1500],[9,1250],[10,1000],[20,900],[30,650],[40,550],[50,450],[75,400],[100,350],[250,250],[500,175]],"NAW":[[1,3250],[2,2750],[3,2375],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,750],[10,500],[20,350],[30,300],[40,250],[50,200],[75,150],[100,125],[250,100]],"BR":[[1,3250],[2,2750],[3,2250],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,750],[10,500],[20,400],[30,350],[40,300],[50,250],[75,200],[100,100]],"ASIA":[[1,3250],[2,2750],[3,2250],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,750],[10,500],[20,400],[30,350],[40,300],[50,250],[75,200],[100,100]],"OCE":[[1,2500],[2,2250],[3,2000],[4,1750],[5,1500],[6,1250],[7,875],[8,625],[9,400],[10,350],[20,300],[30,250],[40,200],[50,150],[75,100]]},"5":{"EU":[[1,5000],[2,4000],[3,3000],[4,2500],[5,2250],[6,2000],[7,1750],[8,1500],[9,1250],[10,1000],[20,800],[30,650],[40,550],[50,450],[75,400],[100,350],[250,300],[500,250],[1000,200],[1500,150],[2000,100]],"NAE":[[1,5000],[2,4000],[3,3000],[4,2500],[5,2250],[6,2000],[7,1750],[8,1500],[9,1250],[10,1000],[20,800],[30,650],[40,550],[50,450],[75,400],[100,350],[250,300],[500,250],[1000,150],[1500,100]],"NAW":[[1,4000],[2,3500],[3,3000],[4,2500],[5,2000],[6,1700],[7,1500],[8,1250],[9,1000],[10,800],[20,700],[30,500],[40,450],[50,350],[75,250],[100,200],[250,150],[500,100]],"BR":[[1,3000],[2,2500],[3,2250],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,800],[10,600],[20,500],[30,400],[40,300],[50,200],[75,175],[100,150],[250,125],[500,100]],"ASIA":[[1,3000],[2,2500],[3,2250],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,800],[10,600],[20,500],[30,400],[40,300],[50,200],[75,175],[100,150],[250,125],[500,100]],"OCE":[[1,2500],[2,2250],[3,2000],[4,1750],[5,1500],[6,1250],[7,1000],[8,750],[9,500],[10,450],[20,400],[30,350],[40,300],[50,250],[75,200],[100,150],[250,100]]},"6":{"EU":[[1,5000],[2,4000],[3,3250],[4,2500],[5,2250],[6,2000],[7,1750],[8,1500],[9,1250],[10,1000],[20,900],[30,650],[40,550],[50,450],[75,400],[100,350],[250,250],[500,175],[1000,100]],"NAE":[[1,5000],[2,4000],[3,3250],[4,2500],[5,2250],[6,2000],[7,1750],[8,1500],[9,1250],[10,1000],[20,900],[30,650],[40,550],[50,450],[75,400],[100,350],[250,250],[500,175]],"NAW":[[1,3250],[2,2750],[3,2375],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,750],[10,500],[20,350],[30,300],[40,250],[50,200],[75,150],[100,125],[250,100]],"BR":[[1,3250],[2,2750],[3,2250],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,750],[10,500],[20,400],[30,350],[40,300],[50,250],[75,200],[100,100]],"ASIA":[[1,3250],[2,2750],[3,2250],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,750],[10,500],[20,400],[30,350],[40,300],[50,250],[75,200],[100,100]],"OCE":[[1,2500],[2,2250],[3,2000],[4,1750],[5,1500],[6,1250],[7,875],[8,625],[9,400],[10,350],[20,300],[30,250],[40,200],[50,150],[75,100]]},"7":{"EU":[[1,5000],[2,4000],[3,3000],[4,2500],[5,2250],[6,2000],[7,1750],[8,1500],[9,1250],[10,1000],[20,800],[30,650],[40,550],[50,450],[75,400],[100,350],[250,300],[500,250],[1000,200],[1500,150],[2000,100]],"NAE":[[1,5000],[2,4000],[3,3000],[4,2500],[5,2250],[6,2000],[7,1750],[8,1500],[9,1250],[10,1000],[20,800],[30,650],[40,550],[50,450],[75,400],[100,350],[250,300],[500,250],[1000,150],[1500,100]],"NAW":[[1,4000],[2,3500],[3,3000],[4,2500],[5,2000],[6,1700],[7,1500],[8,1250],[9,1000],[10,800],[20,700],[30,500],[40,450],[50,350],[75,250],[100,200],[250,150],[500,100]],"BR":[[1,3000],[2,2500],[3,2250],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,800],[10,600],[20,500],[30,400],[40,300],[50,200],[75,175],[100,150],[250,125],[500,100]],"ASIA":[[1,3000],[2,2500],[3,2250],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,800],[10,600],[20,500],[30,400],[40,300],[50,200],[75,175],[100,150],[250,125],[500,100]],"OCE":[[1,2500],[2,2250],[3,2000],[4,1750],[5,1500],[6,1250],[7,1000],[8,750],[9,500],[10,450],[20,400],[30,350],[40,300],[50,250],[75,200],[100,150],[250,100]]},"8":{"EU":[[1,5000],[2,4000],[3,3250],[4,2500],[5,2250],[6,2000],[7,1750],[8,1500],[9,1250],[10,1000],[20,900],[30,650],[40,550],[50,450],[75,400],[100,350],[250,250],[500,175],[1000,100]],"NAE":[[1,5000],[2,4000],[3,3250],[4,2500],[5,2250],[6,2000],[7,1750],[8,1500],[9,1250],[10,1000],[20,900],[30,650],[40,550],[50,450],[75,400],[100,350],[250,250],[500,175]],"NAW":[[1,3250],[2,2750],[3,2375],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,750],[10,500],[20,350],[30,300],[40,250],[50,200],[75,150],[100,125],[250,100]],"BR":[[1,3250],[2,2750],[3,2250],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,750],[10,500],[20,400],[30,350],[40,300],[50,250],[75,200],[100,100]],"ASIA":[[1,3250],[2,2750],[3,2250],[4,2000],[5,1750],[6,1500],[7,1250],[8,1000],[9,750],[10,500],[20,400],[30,350],[40,300],[50,250],[75,200],[100,100]],"OCE":[[1,2500],[2,2250],[3,2000],[4,1750],[5,1500],[6,1250],[7,875],[8,625],[9,400],[10,350],[20,300],[30,250],[40,200],[50,150],[75,100]]},"9":{"EU":[[1,10000],[2,8000],[3,6000],[4,5000],[5,4500],[6,4000],[7,3500],[8,3000],[9,2500],[10,2000],[20,1600],[30,1300],[40,1100],[50,900],[75,800],[100,700],[250,600],[500,500],[1000,400],[1500,300],[2000,200]],"NAE":[[1,10000],[2,8000],[3,6000],[4,5000],[5,4500],[6,4000],[7,3500],[8,3000],[9,2500],[10,2000],[20,1600],[30,1300],[40,1100],[50,900],[75,800],[100,700],[250,600],[500,500],[1000,300],[1500,200]],"NAW":[[1,8000],[2,7000],[3,6000],[4,5000],[5,4000],[6,3400],[7,3000],[8,2500],[9,2000],[10,1600],[20,1400],[30,1000],[40,900],[50,700],[75,500],[100,400],[250,300],[500,200]],"BR":[[1,6000],[2,5000],[3,4500],[4,4000],[5,3500],[6,3000],[7,2500],[8,2000],[9,1600],[10,1200],[20,1000],[30,800],[40,600],[50,400],[75,350],[100,300],[250,250],[500,200]],"ASIA":[[1,6000],[2,5000],[3,4500],[4,4000],[5,3500],[6,3000],[7,2500],[8,2000],[9,1600],[10,1200],[20,1000],[30,800],[40,600],[50,400],[75,350],[100,300],[250,250],[500,200]],"OCE":[[1,5000],[2,4500],[3,4000],[4,3500],[5,3000],[6,2500],[7,2000],[8,1500],[9,1000],[10,900],[20,800],[30,700],[40,600],[50,500],[75,400],[100,300],[250,200]]},"10":{"EU":[[1,10000],[2,8000],[3,6500],[4,5000],[5,4500],[6,4000],[7,3500],[8,3000],[9,2500],[10,2000],[20,1800],[30,1300],[40,1100],[50,900],[75,800],[100,700],[250,500],[500,350],[1000,200]],"NAE":[[1,10000],[2,8000],[3,6500],[4,5000],[5,4500],[6,4000],[7,3500],[8,3000],[9,2500],[10,2000],[20,1800],[30,1300],[40,1100],[50,900],[75,800],[100,700],[250,500],[500,350]],"NAW":[[1,6500],[2,5500],[3,4750],[4,4000],[5,3500],[6,3000],[7,2500],[8,2000],[9,1500],[10,1000],[20,700],[30,600],[40,500],[50,400],[75,300],[100,250],[250,200]],"BR":[[1,6500],[2,5500],[3,4500],[4,4000],[5,3500],[6,3000],[7,2500],[8,2000],[9,1500],[10,1000],[20,800],[30,700],[40,600],[50,500],[75,400],[100,200]],"ASIA":[[1,6500],[2,5500],[3,4500],[4,4000],[5,3500],[6,3000],[7,2500],[8,2000],[9,1500],[10,1000],[20,800],[30,700],[40,600],[50,500],[75,400],[100,200]],"OCE":[[1,5000],[2,4500],[3,4000],[4,3500],[5,3000],[6,2500],[7,1750],[8,1250],[9,800],[10,700],[20,600],[30,500],[40,400],[50,300],[75,200]]}};
/* Призовые недель FNCS Season X (n=3) и Chapter 2 Season 1 (n=4): раунд → окно EventN Epic
   (tools/measured/fncs2019-week-pay.json). Season X платит раунд 2 и финал недели, C2S1 — финал недели. */
const CC_FNCS19_WEEK_PAY={"3":{"1":{"EU":{"2":[[250,320]],"3":[[1,32000],[2,19200],[4,7040],[8,2560],[30,640],[150,320]]},"NAE":{"2":[[250,200]],"3":[[1,20000],[2,12000],[4,4400],[8,1600],[30,400],[150,200]]},"NAW":{"3":[[1,8000],[2,4000],[4,1600],[8,600],[30,400],[100,200]]},"BR":{"3":[[1,8000],[2,4000],[4,1600],[8,600],[30,400],[100,200]]},"ASIA":{"3":[[1,4000],[2,2800],[4,1000],[14,400],[50,200]]},"OCE":{"3":[[1,4000],[2,2800],[4,1000],[14,400],[50,200]]}},"2":{"EU":{"2":[[250,320]],"3":[[1,32000],[2,19200],[4,7040],[8,2560],[30,640],[150,320]]},"NAE":{"2":[[250,200]],"3":[[1,20000],[2,12000],[4,4400],[8,1600],[30,400],[150,200]]},"NAW":{"3":[[1,8000],[2,4000],[4,1600],[8,600],[30,400],[100,200]]},"BR":{"3":[[1,8000],[2,4000],[4,1600],[8,600],[30,400],[100,200]]},"ASIA":{"3":[[1,4000],[2,2800],[4,1000],[14,400],[50,200]]},"OCE":{"3":[[1,4000],[2,2800],[4,1000],[14,400],[50,200]]}},"3":{"EU":{"2":[[250,320]],"3":[[1,32000],[2,19200],[4,7040],[8,2560],[30,640],[150,320]]},"NAE":{"2":[[250,200]],"3":[[1,20000],[2,12000],[4,4400],[8,1600],[30,400],[150,200]]},"NAW":{"3":[[1,8000],[2,4000],[4,1600],[8,600],[30,400],[100,200]]},"BR":{"3":[[1,8000],[2,4000],[4,1600],[8,600],[30,400],[100,200]]},"ASIA":{"3":[[1,4000],[2,2800],[4,1000],[14,400],[50,200]]},"OCE":{"3":[[1,4000],[2,2800],[4,1000],[14,400],[50,200]]}},"4":{"EU":{"2":[[250,320]],"3":[[1,32000],[2,19200],[4,7040],[8,2560],[30,640],[150,320]]},"NAE":{"2":[[250,200]],"3":[[1,20000],[2,12000],[4,4400],[8,1600],[30,400],[150,200]]},"NAW":{"3":[[1,8000],[2,4000],[4,1600],[8,600],[30,400],[100,200]]},"BR":{"3":[[1,8000],[2,4000],[4,1600],[8,600],[30,400],[100,200]]},"ASIA":{"3":[[1,4000],[2,2800],[4,1000],[14,400],[50,200]]},"OCE":{"3":[[1,4000],[2,2800],[4,1000],[14,400],[50,200]]}},"5":{"EU":{"2":[[250,320]],"3":[[1,32000],[2,19200],[4,7040],[8,2560],[30,640],[150,320]]},"NAE":{"2":[[250,200]],"3":[[1,20000],[2,12000],[4,4400],[8,1600],[30,400],[150,200]]},"NAW":{"3":[[1,8000],[2,4000],[4,1600],[8,600],[30,400],[100,200]]},"BR":{"3":[[1,8000],[2,4000],[4,1600],[8,600],[30,400],[100,200]]},"ASIA":{"3":[[1,4000],[2,2800],[4,1000],[14,400],[50,200]]},"OCE":{"3":[[1,4000],[2,2800],[4,1000],[14,400],[50,200]]}}},"4":{"1":{"EU":{"3":[[1,9000],[2,4000],[3,3000],[5,2000],[10,1000]]},"NAE":{"3":[[1,5625],[2,2500],[3,1875],[5,1250],[10,625]]},"NAW":{"3":[[1,2250],[2,1000],[3,750],[5,500],[10,250]]},"BR":{"3":[[1,2250],[2,1000],[3,750],[5,500],[10,250]]},"ASIA":{"3":[[1,1250],[2,750],[5,375]]},"OCE":{"3":[[1,1250],[2,750],[5,375]]}},"2":{"EU":{"3":[[1,9000],[2,4000],[3,3000],[5,2000],[10,1000]]},"NAE":{"3":[[1,5625],[2,2500],[3,1875],[5,1250],[10,625]]},"NAW":{"3":[[1,2250],[2,1000],[3,750],[5,500],[10,250]]},"BR":{"3":[[1,2250],[2,1000],[3,750],[5,500],[10,250]]},"ASIA":{"3":[[1,1250],[2,750],[5,375]]},"OCE":{"3":[[1,1250],[2,750],[5,375]]}},"3":{"EU":{"3":[[1,9000],[2,4000],[3,3000],[5,2000],[10,1000]]},"NAE":{"3":[[1,5625],[2,2500],[3,1875],[5,1250],[10,625]]},"NAW":{"3":[[1,2250],[2,1000],[3,750],[5,500],[10,250]]},"BR":{"3":[[1,2250],[2,1000],[3,750],[5,500],[10,250]]},"ASIA":{"3":[[1,1250],[2,750],[5,375]]},"OCE":{"3":[[1,1250],[2,750],[5,375]]}},"4":{"EU":{"3":[[1,9000],[2,4000],[3,3000],[5,2000],[10,1000]]},"NAE":{"3":[[1,5625],[2,2500],[3,1875],[5,1250],[10,625]]},"NAW":{"3":[[1,2250],[2,1000],[3,750],[5,500],[10,250]]},"BR":{"3":[[1,2250],[2,1000],[3,750],[5,500],[10,250]]},"ASIA":{"3":[[1,1250],[2,750],[5,375]]},"OCE":{"3":[[1,1250],[2,750],[5,375]]}}}};
/* Призовые недель, квалификаторов и хитов FNCS 2020 (C2S2/C2S3/C2S4): Liquipedia, tools/build-2020-week-pay.js.
   Доллары на игрока; week[n][неделя][регион] — финал недели (последний раунд), heat[n][регион][хит]. */
const CC_FNCS20_WEEK_PAY={"week":{"1":{"1":{"ASIA":[[1,565],[2,400],[3,375],[4,325],[5,300],[6,275],[7,250],[8,225],[9,210],[10,200]],"BR":[[1,1500],[2,1200],[3,750],[4,550],[5,500],[6,450],[7,400],[8,350],[9,300],[10,250]],"EU":[[1,2500],[2,2250],[3,2000],[4,1750],[5,1500],[6,1200],[7,1050],[8,900],[9,750],[10,600],[15,500],[20,350],[25,250],[50,200]],"ME":[[1,565],[2,400],[3,375],[4,325],[5,300],[6,275],[7,250],[8,225],[9,210],[10,200]],"NAE":[[1,2250],[2,2100],[3,1750],[4,1375],[5,1200],[6,1000],[7,700],[8,600],[9,500],[10,400],[15,300],[20,250],[25,200]],"NAW":[[1,1500],[2,1200],[3,750],[4,550],[5,500],[6,450],[7,400],[8,350],[9,300],[10,250]],"OCE":[[1,565],[2,400],[3,375],[4,325],[5,300],[6,275],[7,250],[8,225],[9,210],[10,200]]},"2":{"ASIA":[[1,565],[2,400],[3,375],[4,325],[5,300],[6,275],[7,250],[8,225],[9,210],[10,200]],"BR":[[1,1500],[2,1200],[3,750],[4,550],[5,500],[6,450],[7,400],[8,350],[9,300],[10,250]],"EU":[[1,2500],[2,2250],[3,2000],[4,1750],[5,1500],[6,1200],[7,1050],[8,900],[9,750],[10,600],[15,500],[20,350],[25,250],[50,200]],"ME":[[1,565],[2,400],[3,375],[4,325],[5,300],[6,275],[7,250],[8,225],[9,210],[10,200]],"NAE":[[1,2250],[2,2100],[3,1750],[4,1375],[5,1200],[6,1000],[7,700],[8,600],[9,500],[10,400],[15,300],[20,250],[25,200]],"NAW":[[1,1500],[2,1200],[3,750],[4,550],[5,500],[6,450],[7,400],[8,350],[9,300],[10,250]],"OCE":[[1,565],[2,400],[3,375],[4,325],[5,300],[6,275],[7,250],[8,225],[9,210],[10,200]]},"3":{"ASIA":[[1,565],[2,400],[3,375],[4,325],[5,300],[6,275],[7,250],[8,225],[9,210],[10,200]],"BR":[[1,1500],[2,1200],[3,750],[4,550],[5,500],[6,450],[7,400],[8,350],[9,300],[10,250]],"EU":[[1,2500],[2,2250],[3,2000],[4,1750],[5,1500],[6,1200],[7,1050],[8,900],[9,750],[10,600],[15,500],[20,350],[25,250],[50,200]],"ME":[[1,565],[2,400],[3,375],[4,325],[5,300],[6,275],[7,250],[8,225],[9,210],[10,200]],"NAE":[[1,2250],[2,2100],[3,1750],[4,1375],[5,1200],[6,1000],[7,700],[8,600],[9,500],[10,400],[15,300],[20,250],[25,200]],"NAW":[[1,1500],[2,1200],[3,750],[4,550],[5,500],[6,450],[7,400],[8,350],[9,300],[10,250]],"OCE":[[1,565],[2,400],[3,375],[4,325],[5,300],[6,275],[7,250],[8,225],[9,210],[10,200]]},"4":{"ASIA":[[1,565],[2,400],[3,375],[4,325],[5,300],[6,275],[7,250],[8,225],[9,210],[10,200]],"BR":[[1,1500],[2,1200],[3,750],[4,550],[5,500],[6,450],[7,400],[8,350],[9,300],[10,250]],"EU":[[1,2500],[2,2250],[3,2000],[4,1750],[5,1500],[6,1200],[7,1050],[8,900],[9,750],[10,600],[15,500],[20,350],[25,250],[50,200]],"ME":[[1,565],[2,400],[3,375],[4,325],[5,300],[6,275],[7,250],[8,225],[9,210],[10,200]],"NAE":[[1,2250],[2,2100],[3,1750],[4,1375],[5,1200],[6,1000],[7,700],[8,600],[9,500],[10,400],[15,300],[20,250],[25,200]],"NAW":[[1,1500],[2,1200],[3,750],[4,550],[5,500],[6,450],[7,400],[8,350],[9,300],[10,250]],"OCE":[[1,565],[2,400],[3,375],[4,325],[5,300],[6,275],[7,250],[8,225],[9,210],[10,200]]}},"2":{"1":{"ASIA":[[1,620],[2,580],[3,560],[4,540],[5,500],[6,350],[7,300],[8,280],[9,270],[10,250],[20,200]],"BR":[[1,1300],[2,1200],[3,1100],[4,1000],[5,900],[6,850],[7,750],[8,650],[9,550],[10,450],[15,300],[20,250],[25,200]],"EU":[[1,5000],[2,4200],[3,3500],[4,3200],[5,2900],[6,2600],[7,2100],[8,1600],[9,1300],[10,1100],[15,600],[20,350],[25,300],[50,250],[100,200]],"ME":[[1,620],[2,580],[3,560],[4,540],[5,500],[6,350],[7,300],[8,280],[9,270],[10,250],[20,200]],"NAE":[[1,3000],[2,2550],[3,1250],[4,1100],[5,950],[6,800],[7,600],[8,500],[9,400],[10,350],[15,300],[20,275],[25,250],[50,225],[100,200]],"NAW":[[1,1300],[2,1200],[3,1100],[4,1000],[5,900],[6,850],[7,750],[8,650],[9,550],[10,450],[15,300],[20,250],[25,200]],"OCE":[[1,620],[2,580],[3,560],[4,540],[5,500],[6,350],[7,300],[8,280],[9,270],[10,250],[20,200]]},"2":{"ASIA":[[1,620],[2,580],[3,560],[4,540],[5,500],[6,350],[7,300],[8,280],[9,270],[10,250],[20,200]],"BR":[[1,1300],[2,1200],[3,1100],[4,1000],[5,900],[6,850],[7,750],[8,650],[9,550],[10,450],[15,300],[20,250],[25,200]],"EU":[[1,5000],[2,4200],[3,3500],[4,3200],[5,2900],[6,2600],[7,2100],[8,1600],[9,1300],[10,1100],[15,600],[20,350],[25,300],[50,250],[100,200]],"ME":[[1,620],[2,580],[3,560],[4,540],[5,500],[6,350],[7,300],[8,280],[9,270],[10,250],[20,200]],"NAE":[[1,3000],[2,2550],[3,1250],[4,1100],[5,950],[6,800],[7,600],[8,500],[9,400],[10,350],[15,300],[20,275],[25,250],[50,225],[100,200]],"NAW":[[1,1300],[2,1200],[3,1100],[4,1000],[5,900],[6,850],[7,750],[8,650],[9,550],[10,450],[15,300],[20,250],[25,200]],"OCE":[[1,620],[2,580],[3,560],[4,540],[5,500],[6,350],[7,300],[8,280],[9,270],[10,250],[20,200]]},"3":{"ASIA":[[1,620],[2,580],[3,560],[4,540],[5,500],[6,350],[7,300],[8,280],[9,270],[10,250],[20,200]],"BR":[[1,1300],[2,1200],[3,1100],[4,1000],[5,900],[6,850],[7,750],[8,650],[9,550],[10,450],[15,300],[20,250],[25,200]],"EU":[[1,5000],[2,4200],[3,3500],[4,3200],[5,2900],[6,2600],[7,2100],[8,1600],[9,1300],[10,1100],[15,600],[20,350],[25,300],[50,250],[100,200]],"ME":[[1,620],[2,580],[3,560],[4,540],[5,500],[6,350],[7,300],[8,280],[9,270],[10,250],[20,200]],"NAE":[[1,3000],[2,2550],[3,1250],[4,1100],[5,950],[6,800],[7,600],[8,500],[9,400],[10,350],[15,300],[20,275],[25,250],[50,225],[97,200]],"NAW":[[1,1300],[2,1200],[3,1100],[4,1000],[5,900],[6,850],[7,750],[8,650],[9,550],[10,450],[15,300],[20,250],[25,200]],"OCE":[[1,620],[2,580],[3,560],[4,540],[5,500],[6,350],[7,300],[8,280],[9,270],[10,250],[20,200]]},"4":{"ASIA":[[1,620],[2,580],[3,560],[4,540],[5,500],[6,350],[7,300],[8,280],[9,270],[10,250],[20,200]],"BR":[[1,1300],[2,1200],[3,1100],[4,1000],[5,900],[6,850],[7,750],[8,650],[9,550],[10,450],[15,300],[20,250],[25,200]],"EU":[[1,5000],[2,4200],[3,3500],[4,3200],[5,2900],[6,2600],[7,2100],[8,1600],[9,1300],[10,1100],[15,600],[20,350],[25,300],[50,250],[100,200]],"ME":[[1,620],[2,580],[3,560],[4,540],[5,500],[6,350],[7,300],[8,280],[9,270],[10,250],[20,200]],"NAE":[[1,3000],[2,2550],[3,1250],[4,1100],[5,950],[6,800],[7,600],[8,500],[9,400],[10,350],[15,300],[20,275],[25,250],[50,225],[100,200]],"NAW":[[1,1300],[2,1200],[3,1100],[4,1000],[5,900],[6,850],[7,750],[8,650],[9,550],[10,450],[15,300],[20,250],[25,200]],"OCE":[[1,620],[2,580],[3,560],[4,540],[5,500],[6,350],[7,300],[8,280],[9,270],[10,250],[20,200]]}},"3":{"1":{"ASIA":[[1,450],[2,400],[3,375],[4,350],[5,325],[6,300],[7,275],[8,250],[9,225],[10,200]],"BR":[[1,550],[2,450],[3,425],[4,400],[5,375],[6,350],[7,325],[8,300],[9,275],[10,250],[15,200]],"EU":[[1,4000],[2,3500],[3,3000],[4,2000],[5,1000],[6,800],[7,700],[8,600],[9,500],[10,400],[15,350],[20,300],[26,225],[33,200]],"ME":[[1,450],[2,400],[3,375],[4,350],[5,325],[6,300],[7,275],[8,250],[9,225],[10,200]],"NAE":[[1,2500],[2,1500],[3,1000],[4,750],[5,660],[6,550],[7,450],[8,400],[9,350],[10,300],[15,275],[20,250],[26,200]],"NAW":[[1,550],[2,450],[3,425],[4,400],[5,375],[6,350],[7,325],[8,300],[9,275],[10,250],[15,200]],"OCE":[[1,450],[2,400],[3,375],[4,350],[5,325],[6,300],[7,275],[8,250],[9,225],[10,200]]},"2":{"ASIA":[[1,450],[2,400],[3,375],[4,350],[5,325],[6,300],[7,275],[8,250],[9,225],[10,200]],"BR":[[1,550],[2,450],[3,425],[4,400],[5,375],[6,350],[7,325],[8,300],[9,275],[10,250],[15,200]],"EU":[[1,4000],[2,3500],[3,3000],[4,2000],[5,1000],[6,800],[7,700],[8,600],[9,500],[10,400],[15,350],[20,300],[26,225],[33,200]],"ME":[[1,450],[2,400],[3,375],[4,350],[5,325],[6,300],[7,275],[8,250],[9,225],[10,200]],"NAE":[[1,2500],[2,1500],[3,1000],[4,750],[5,660],[6,550],[7,450],[8,400],[9,350],[10,300],[15,275],[20,250],[26,200]],"NAW":[[1,550],[2,450],[3,425],[4,400],[5,375],[6,350],[7,325],[8,300],[9,275],[10,250],[15,200]],"OCE":[[1,450],[2,400],[3,375],[4,350],[5,325],[6,300],[7,275],[8,250],[9,225],[10,200]]},"3":{"ASIA":[[1,450],[2,400],[3,375],[4,350],[5,325],[6,300],[7,275],[8,250],[9,225],[10,200]],"BR":[[1,550],[2,450],[3,425],[4,400],[5,375],[6,350],[7,325],[8,300],[9,275],[10,250],[15,200]],"EU":[[1,4000],[2,3500],[3,3000],[4,2000],[5,1000],[6,800],[7,700],[8,600],[9,500],[10,400],[15,350],[20,300],[26,225],[33,200]],"ME":[[1,450],[2,400],[3,375],[4,350],[5,325],[6,300],[7,275],[8,250],[9,225],[10,200]],"NAE":[[1,2500],[2,1500],[3,1000],[4,750],[5,660],[6,550],[7,450],[8,400],[9,350],[10,300],[15,275],[20,250],[26,200]],"NAW":[[1,550],[2,450],[3,425],[4,400],[5,375],[6,350],[7,325],[8,300],[9,275],[10,250],[15,200]],"OCE":[[1,450],[2,400],[3,375],[4,350],[5,325],[6,300],[7,275],[8,250],[9,225],[10,200]]}}},"heat":{"1":{"ASIA":{"1":[[25,0],[50,200]],"2":[[25,0],[50,200]]},"BR":{"1":[[12,0],[50,225]],"2":[[12,0],[50,225]],"3":[[12,0],[50,225]],"4":[[12,0],[50,225]]},"EU":{"1":[[12,0],[50,900]],"2":[[12,0],[50,900]],"3":[[12,0],[50,900]],"4":[[12,0],[50,900]]},"ME":{"1":[[25,0],[50,200]],"2":[[25,0],[50,200]]},"NAE":{"1":[[12,0],[50,560]],"2":[[12,0],[50,560]],"3":[[12,0],[50,560]],"4":[[12,0],[50,560]]},"NAW":{"1":[[12,0],[50,225]],"2":[[12,0],[50,225]],"3":[[12,0],[50,225]],"4":[[12,0],[50,225]]},"OCE":{"1":[[25,0],[50,250]],"2":[[25,0],[50,250]]}},"2":{"ASIA":{"1":[[50,0],[99,200]],"2":[[50,0],[100,200]]},"BR":{"1":[[25,0],[50,300],[100,250]],"2":[[25,0],[50,300],[100,250]],"3":[[25,0],[50,300],[100,250]],"4":[[25,0],[50,300],[100,250]]},"EU":{"1":[[25,0],[50,1250],[100,1000]],"2":[[25,0],[50,1250],[100,1000]],"3":[[25,0],[50,1250],[100,1000]],"4":[[25,0],[50,1250],[100,1000]]},"ME":{"1":[[50,0],[100,200]],"2":[[50,0],[100,200]]},"NAE":{"1":[[25,0],[50,800],[100,600]],"2":[[25,0],[50,800],[100,600]],"3":[[25,0],[50,800],[100,600]],"4":[[25,0],[50,800],[100,600]]},"NAW":{"1":[[25,0],[50,300],[100,250]],"2":[[25,0],[50,300],[100,250]],"3":[[25,0],[50,300],[100,250]],"4":[[25,0],[50,300],[100,250]]},"OCE":{"1":[[50,0],[100,200]],"2":[[50,0],[100,200]]}},"3":{"EU":{"1":[[16,0],[33,600]],"2":[[16,0],[33,600]],"3":[[16,0],[33,600]],"4":[[16,0],[33,600]]},"NAE":{"1":[[16,0],[33,400]],"2":[[16,0],[33,400]],"3":[[16,0],[33,400]],"4":[[16,0],[33,400]]}}}};
// Ближний Восток в 2019-м платился таблицей Европы (своей нет) — в 2020-м у него своя.
function ccRegPay(t){ let r=careerPrizeRegion(); r = r==='NAC' ? 'NAE' : r; return t[r] ? r : 'EU'; }
// Год турнира — по острову спеки: h* — 2019, i* — 2020. Номер сезона внутри года не уникален
// (C2S4 — n=3, как Season X), и таблица 2019-го по одному n платила C2S4 строкой Season X.
const ccMXIs2020=sp=>String(sp && sp.set || '').charAt(0)==='i';
function ccMXWeekPrize(sp, w, r, n){
  if(!sp) return null;
  if(sp.kind==='wc') return r===sp.rounds.length ? (p=>ccWcWeekPay(w, p)*sp.size) : null;
  // Номер сезона — с вечера (ev.n): в спеке его нет, и sp.n молча давал null (призов FNCS не было).
  const key=n!=null ? n : sp.n;
  let rows=null;
  if(ccMXIs2020(sp)){
    // 2020: платит финал недели / квалификатора — последний раунд вечера.
    if(r!==sp.rounds.length) return null;
    const t=(CC_FNCS20_WEEK_PAY.week[key]||{})[w]; if(!t) return null;
    rows=t[ccRegPay(t)];
  } else {
    const t=((CC_FNCS19_WEEK_PAY[key]||{})[w]); if(!t) return null;
    rows=(t[ccRegPay(t)]||{})[r];
  }
  if(!rows) return null;
  return p=>{ for(const x of rows) if(p<=x[0]) return x[1]*sp.size; return 0; };
}
/* Хиты 2020-го платили тем, кто дальше не прошёл (Liquipedia: прошедшие — $0). Порог прохода
   в карьере свой (spec.heats[].cut), поэтому за местом ниже него — первая выплата таблицы,
   даже если на Liquipedia это место ещё было «прошедшим» с нулём. */
/* Хиты 2019-го (Liquipedia, сверка 7.10): Season X — «$120,000» на хит, $4,800 трио за 9–33-е; C2S1 — «$68,400»,
   $3,600 скваду за 7–25-е. Прошедшие в финал из хита денег не берут. Сумма — на команду. */
const CC_MX_HEAT_PAY_2019={h3:{to:33, team:4800}, h4:{to:25, team:3600}};
function ccMXHeatPrize(sp, n, hi, cut){
  const p19=CC_MX_HEAT_PAY_2019[sp && sp.set];
  if(p19 && careerPrizeRegion()==='EU') return p=>(p>cut && p<=p19.to) ? p19.team : 0;
  if(!ccMXIs2020(sp)) return null;
  const t=CC_FNCS20_WEEK_PAY.heat[n]; if(!t) return null;
  const byHeat=t[ccRegPay(t)]||{}, rows=byHeat[hi+1]||byHeat[1]; if(!rows) return null;
  const firstPaid=(rows.find(x=>x[1]>0)||[0,0])[1];
  return p=>{ if(p<=cut) return 0; let v=0; for(const x of rows) if(p<=x[0]){ v=x[1]; break; }
    if(!v && p<=rows[rows.length-1][0]) v=firstPaid; return v*sp.size; };
}
function ccWcWeekPay(w, place){
  const t=CC_WC_WEEK_PAY[w]; if(!t) return 0;
  let r=careerPrizeRegion(); r = r==='NAC' ? 'NAE' : (r==='ME' || !t[r]) ? 'EU' : r;
  const rows=t[r]||[]; for(const x of rows) if(place<=x[0]) return x[1];
  return 0;
}
// Призовые финала сезона на команду: World Cup — таблица Нью-Йорка (одна на мир), FNCS — финал региона.
function ccMXPrize(y, n, place){
  const sp=ccMXSpec(y, n); if(!sp) return 0;
  const t=sp.kind==='wc' ? {EU:((typeof WC2019_PAY!=='undefined' && WC2019_PAY[sp.set])||[])}
        : y===2019 ? Object.assign({}, ((typeof CC_MX_PAY_2019_LQ!=='undefined' && CC_MX_PAY_2019_LQ[n])||{}), ((typeof CC_MX_PAY_2019!=='undefined' && CC_MX_PAY_2019[n])||{}))
        : (((typeof CC_MX_PAY_2020!=='undefined' && CC_MX_PAY_2020)||{})[n]||{});
  return ccPay24(t, place)*sp.size;
}
// ==== /FNCS 2019–2020 machine ====
// ==== FNCS 2021 machine (tools/splice-2021.js) ====
/* ---- Сезон FNCS 2021-го (Chapter 2, трио) -------------------------------------------
   Формат Epic (окна Tracker; спека career-year-2021-design.md): квалификатор — четыре раунда
   (пятница — раунд 1, топ-1500; суббота — раунды 2 и 3, топ-250 / топ-300 у C2S8 и топ-33;
   воскресенье — раунд 4: у C2S6–C2S8 топ-3 / топ-5 прямо в финал). Очки серии — раунд 4.
   Полуфинал — хиты по 33 трио из серии змейкой: C2S5 — четыре хита в два дня, топ-8; C2S6 и
   C2S7 — три хита, топ-6; C2S8 — два хита, топ-4, и второй день из не прошедших первый.
   Reboot Round — не прошедшие хиты: у C2S5 финал берёт одно трио, у C2S6/C2S7 — шесть (своё
   число режима: в окнах квоты нет, шесть добивают финал до 33). Финал — 33 трио, 12 игр.
   «Мейджор 5» — FNCS Grand Royale: финал с настоящими трио региона, пускает любой финал года. */
const CC_M21={
  // Раунды 2 и 3 — «3 hour limit & 10 match limit» на каждой странице квала (сверка с Liquipedia 7.10; было 6).
  q:{1:{games:10, cut:1500, open:true}, 2:{games:10, cut:250}, 3:{games:10, cut:33}, 4:{games:6, cut:3}},
  semi:{games:6}, reboot:{games:6}, final:{games:12, cut:0}
};
function ccM21Rounds(){ return 4; }
function ccM21Spec(n, r){
  const s=Object.assign({}, CC_M21.q[r]);
  if(r===2 && n===4) s.cut=300;
  // C2S7: «Top 300 trios will advance to Round 2» / «Top 150 trios will advance to Round 3».
  if(n===3 && r===1) s.cut=300;
  if(n===3 && r===2) s.cut=150;
  if(r===4) s.cut = n===1 ? 0 : n===4 ? 5 : 3;
  return s;
}
function ccM21Quals(n){ return n===4 ? 2 : 3; }
function ccM21Field(){ return ccTeams(50); }
// Хиты полуфинала: день и квота. prev — хит второго дня из не прошедших первый (C2S8).
function ccM21HeatPlan(n){
  if(n===1) return [{day:1, cut:8}, {day:1, cut:8}, {day:2, cut:8}, {day:2, cut:8}];
  // C2S8, день 2 — Reboot Round 1 и 2 (Liquipedia): 6 матчей, очки только за победу, топ-6 каждого.
  if(n===4) return [{day:1, cut:4}, {day:1, cut:4}, {day:2, cut:6, prev:true, winOnly:true}, {day:2, cut:6, prev:true, winOnly:true}];
  return [{day:1, cut:6}, {day:1, cut:6}, {day:1, cut:6}];
}
// C2S7 — «4 match limit … Scoring based Victory Royales. Top 4 trios will advance» (Liquipedia, сверка 7.10; было 6 и 6).
function ccM21RebootCut(n){ return n===1 ? 1 : n===2 ? 6 : n===3 ? 4 : 0; }
/* Reboot Round (Liquipedia): C2S5 — один матч, проходит победитель; C2S6/C2S7 — два раунда по три матча, проходят
   победители (у нас одним вечером — шесть матчей). Очки — правило Epic «только победа»: 10 за Victory Royale, 0 за элим. */
function ccM21RebootGames(n){ return n===1 ? 1 : n===3 ? 4 : 6; }
const CC_WIN_ONLY={pts:p=>p===1 ? 10 : 0, kill:0};
function ccM21Of(n){
  const cr=CAREER && CAREER.career; if(!cr) return null;
  const m=cr.major21;
  return (m && m.n===n && m.season===cr.season) ? m : null;
}
function ccM21State(n){
  const cr=CAREER.career;
  let m=ccM21Of(n);
  if(!m) m=cr.major21={n:n, season:cr.season, got:{}, q:{}, series:{}, seriesRows:{}, direct:[], heats:null, heatRes:{}, reboot:null, youKey:null, ticket:false};
  return m;
}
function ccM21DayOf(n, tail){
  const row=ccYearRows().find(r=>r[2]==='Major'+n+'_2021_'+tail);
  return row ? row[0] : null;
}
function ccM21QualEnd(n, q){
  let last=null;
  ccYearRows().forEach(r=>{ if(r[2].indexOf('Major'+n+'_2021_Q'+q+'R')===0 && (!last || r[0]>last)) last=r[0]; });
  return last;
}
const ccM21Key=r=>r==='you' ? 'you' : JSON.stringify(r);
function ccM21SeriesRank(m, key){
  if(!m || !key) return 0;
  const keys=Object.keys(m.series).sort((a,b)=>m.series[b]-m.series[a]);
  const at=keys.indexOf(key);
  return at<0 ? 0 : at+1;
}
function ccM21SeriesAdd(m, ranked, rowOf){
  const n=ranked.length;
  ranked.forEach((t,i)=>{ const k=ccSeatKey(t); m.series[k]=(m.series[k]||0)+(n-i); if(!m.seriesRows[k]) m.seriesRows[k]=rowOf(t); });
}
// Квалификатор, досчитанный молча: раунд 4 — 33 сильных трио сцены.
function ccM21SettleQual(m, q){
  const Q=m.q[q]=m.q[q]||{};
  if(Q.done) return;
  const end=ccM21QualEnd(m.n, q);
  if(!end || careerToday()<=end) return;
  const last=ccM21Spec(m.n, 4), F=ccM21Field();
  let room=(Q.r3||[]).filter(r=>r!=='you').map(ccMajorTeamFrom);
  if(room.length<F){
    const seen=new Set(room.map(ccSeatKey));
    ccM23World(F+20, 'm21|'+m.n+'|'+q).forEach(t=>{
      if(room.length>=F || seen.has(ccSeatKey(t))) return;
      seen.add(ccSeatKey(t)); room.push(t);
    });
  }
  room=room.slice(0, F);
  room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
  ccWorldRun('m21q|'+m.season+'|'+m.n+'|'+q, ()=>simulateGames(room, last.games, ccM24Points, CC_M24_KILL));
  const ranked=ccM24Rank(room);
  ranked.slice(0, last.cut).forEach(t=>m.direct.push(ccMajorSeatRow(t)));
  ccM21SeriesAdd(m, ranked.slice(last.cut), ccMajorSeatRow);
  Q.done=true;
}
function ccM21SettleQuals(m){ for(let q=1; q<=ccM21Quals(m.n); q++) ccM21SettleQual(m, q); }
// Хиты первого дня — из серии змейкой (без прямых), недобор — сценой. Строятся один раз.
function ccM21Heats(m){
  if(m.heats) return m.heats;
  ccM21SettleQuals(m);
  const plan=ccM21HeatPlan(m.n), F=ccM21Field();
  const first=plan.filter(h=>!h.prev), H=first.length, need=H*F;
  const direct=new Set(m.direct.map(ccM21Key));
  const list=[], seen=new Set();
  const push=r=>{ const key=ccM21Key(r); if(list.length>=need || direct.has(key) || seen.has(key)) return; seen.add(key); list.push(r); };
  Object.keys(m.series).sort((a,b)=>m.series[b]-m.series[a]).forEach(k=>push(m.seriesRows[k]));
  if(list.length<need) ccM23World(need*2, 'm21h|'+m.n).forEach(t=>push(ccMajorSeatRow(t)));
  const heats=plan.map(h=>({day:h.day, cut:h.cut, prev:!!h.prev, rows:[]}));
  list.forEach((r,i)=>{ const round=Math.floor(i/H), pos=i%H; heats[round%2 ? H-1-pos : pos].rows.push(r); });
  m.heats=heats; m.heatRes={};
  return heats;
}
// Хиты второго дня C2S8 — не прошедшие первый день, по месту, змейкой.
function ccM21PrevHeats(m){
  const heats=ccM21Heats(m);
  const pv=heats.filter(h=>h.prev);
  if(!pv.length || pv[0].rows.length) return;
  const idx1=heats.map((h,i)=>h.prev ? -1 : i).filter(i=>i>=0);
  if(idx1.some(i=>!m.heatRes[i])) return;
  const rests=idx1.map(i=>m.heatRes[i].rest);
  const merged=[];
  for(let p=0; ; p++){ let any=false; rests.forEach(l=>{ if(l[p]!==undefined){ merged.push(l[p]); any=true; } }); if(!any) break; }
  const H=pv.length;
  merged.forEach((r,i)=>{ const round=Math.floor(i/H), pos=i%H; pv[round%2 ? H-1-pos : pos].rows.push(r); });
}
function ccM21SettleHeats(m){
  const heats=ccM21Heats(m);
  heats.forEach((h,i)=>{
    if(h.prev) ccM21PrevHeats(m);
    if(m.heatRes[i] || !h.rows.length) return;
    const day=ccM21DayOf(m.n, 'Semi'+h.day);
    if(!day || careerToday()<=day) return;
    const room=h.rows.filter(r=>r!=='you').map(ccMajorTeamFrom);
    room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
    const sc=h.winOnly ? CC_WIN_ONLY : {pts:ccM24Points, kill:CC_M24_KILL};
    ccWorldRun('m21h|'+m.season+'|'+m.n+'|'+i, ()=>simulateGames(room, CC_M21.semi.games, sc.pts, sc.kill));
    const ranked=ccM24Rank(room);
    m.heatRes[i]={up:ranked.slice(0, h.cut).map(ccMajorSeatRow), rest:ranked.slice(h.cut).map(ccMajorSeatRow)};
  });
}
// Хит игрока на день d (или -1).
function ccM21YourHeat(m, d){
  const heats=ccM21Heats(m);
  ccM21PrevHeats(m);
  return heats.findIndex(h=>h.day===d && ccSeedHasMe(h.rows));
}
// Reboot Round: не прошедшие хиты первого дня по кругу, до лобби.
function ccM21RebootRoom(m){
  ccM21SettleHeats(m);
  const heats=ccM21Heats(m), F=ccM21Field();
  const lists=heats.map((h,i)=>h.prev ? null : ((m.heatRes[i]||{}).rest||null)).filter(Boolean);
  const room=[];
  for(let p=0; room.length<F; p++){ let any=false; lists.forEach(l=>{ if(l[p]!==undefined && room.length<F){ room.push(l[p]); any=true; } }); if(!any) break; }
  return room;
}
function ccM21SettleReboot(m){
  const cut=ccM21RebootCut(m.n);
  if(m.reboot || !cut) return;
  const day=ccM21DayOf(m.n, 'Reboot');
  if(!day || careerToday()<=day) return;
  const room=ccM21RebootRoom(m).filter(r=>r!=='you').map(ccMajorTeamFrom);
  if(!room.length){ m.reboot={up:[]}; return; }
  room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
  ccWorldRun('m21r|'+m.season+'|'+m.n, ()=>simulateGames(room, ccM21RebootGames(m.n), CC_WIN_ONLY.pts, CC_WIN_ONLY.kill));
  m.reboot={up:ccM24Rank(room).slice(0, cut).map(ccMajorSeatRow)};
}
// Финал: прямые, прошедшие хиты и Reboot Round; недобор — по серии. Grand Royale — трио региона.
function ccM21GfRows(m){
  if(!m) return null;
  const F=ccM21Field(), out=[], seen=new Set();
  const add=r=>{ const k=ccM21Key(r); if(!r || seen.has(k) || out.length>=F) return; seen.add(k); out.push(r); };
  if(m.n===5){ ((typeof GR2021_TRIOS!=='undefined' && GR2021_TRIOS[careerPrizeRegion()])||[]).forEach(add); return out; }
  ccM21SettleQuals(m); ccM21SettleHeats(m); ccM21SettleReboot(m);
  m.direct.forEach(add);
  ccM21Heats(m).forEach((h,i)=>((m.heatRes[i]||{}).up||[]).forEach(add));
  ((m.reboot||{}).up||[]).forEach(add);
  Object.keys(m.series).sort((a,b)=>m.series[b]-m.series[a]).forEach(k=>add(m.seriesRows[k]));
  return out;
}
function ccM21WorldFinalRoom(m, drafted, lobbyCr, n){
  const rows=m ? ccM21GfRows(m) : (n===5 ? ccM21GfRows({n:5}) : null);
  const F=ccM21Field();
  const room=(rows && rows.length>=10) ? rows.filter(r=>r!=='you').map(ccMajorTeamFrom) : [];
  if(room.length<F){
    const seen=new Set(room.map(ccSeatKey));
    careerCupField(lobbyCr, drafted, F+20, null, false, CC_FIELD_SHARP.final).forEach(t=>{
      if(room.length>=F || seen.has(ccSeatKey(t))) return;
      seen.add(ccSeatKey(t)); room.push(t);
    });
  }
  return room.slice(0, F);
}
// Grand Royale пускает любой Гранд-финал сезона этого года.
function ccM21GrTicket(){
  const cr=CAREER.career;
  return (cr.log||[]).some(r=>r.season===cr.season && r.kind==='major' && r.stage==='final' && r.place && String(r.day)<CC_YEAR_2021_TO && String(r.day)<'2021-11-20');
}
function ccM21CanStage(ev, cr, gaveUp){
  if(ev.n===5) return !gaveUp && ccM21GrTicket() && !((ccM21Of(5)||{}).got||{})[ev.id];
  const s=ccM21Of(ev.n);
  if(s && s.got[ev.id]) return false;
  if(ev.stage==='q'){
    if(s && s.ticket) return false;
    const first=ev.rounds[0];
    if(first===1) return true;
    const prev=s && s.q[ev.q] && s.q[ev.q]['r'+(first-1)];
    return ccSeedHasMe(prev);
  }
  if(ev.stage==='semi'){
    if(!s || s.ticket || !s.youKey) return false;
    ccM21SettleHeats(s);
    return ccM21YourHeat(s, ev.r)>=0;
  }
  if(ev.stage==='reboot'){
    if(!s || s.ticket || !s.youKey || !ccM21RebootCut(ev.n)) return false;
    return ccSeedHasMe(ccM21RebootRoom(s));
  }
  return !gaveUp && !!(s && s.ticket);
}
async function runCareerMajor2021(){
  const cr=CAREER.career;
  const ev=careerMajorOn(careerToday());
  if(!ev || !ev.y21 || !careerMajorCan(ev)) return;
  const mpStart=ccMpLock() ? await ccMpGate('major') : null;
  careerCampBonus('major', ev.id||ev.label||'');
  const me=careerCard(), mates=careerMates();
  if(!me || mates.length<careerMateSeats() || mates.some(function(m){ return !m; })) return;
  const mate=mates[0]||null;
  const prevMode=CARD_MODE, prevSize=squadSize, prevDrafted=drafted;
  CARD_MODE=true; squadSize=careerSquadSize(); drafted=[me].concat(mates);
  skipAnimation=false; CC_SKIP_RUN=false;
  resetRunRecord();
  document.getElementById('majorStages').innerHTML='';
  const rsPrev=document.getElementById('runSummary'); if(rsPrev) rsPrev.innerHTML='';
  document.getElementById('lobbyTitle').textContent='';
  document.getElementById('lobbyBody').innerHTML='';
  clearEventPanel();
  document.getElementById('finalBanner').style.display='none';
  clearLandingResultsMap();
  CAREER_RUN=true;
  show('screen-results');
  ensureSkipButton();

  const you=careerYouTeam(drafted);
  you.name=L().yourTeamPrefix+teamLabel(drafted); you.isYou=true;
  const m=ccM21State(ev.n);
  const F=ccM21Field();
  const rowsOf=rows=>ccStageRowsOf(rows, you);
  const seedOf=t=>ccSeedRow(t, you, ccMajorSeatRow);
  let field, spec, stageLabel=ev.label, through=false, note='', games=0;
  let ranked=[], place=0, shownOut=false, alive=false;
  const play=async (room, sp, label, open)=>{
    room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; t.stageLog=[]; });
    CC_M24_GAME=0;
    const pS=ccPastMajorScore(ev);
    await simulateGamesLive(room, sp.games, pS ? pS.pts : ccM24Points, pS ? pS.kill : CC_M24_KILL, 'stage', 0, null, null,
      {lobbySize:F, stageName:label, mapReplay:true, choices:true, stopOnYourDeath:true, roomOnly:!open,
       dropEachGame:(g,rm)=>{ CC_M24_GAME=g; return open ? null : careerLandingPick(rm||room, you, label, ['major']); }});
    games+=sp.games;
    return ccM24Rank(room);
  };
  if(ev.stage==='q'){
    const Q=m.q[ev.q]=m.q[ev.q]||{};
    const R=ccM21Rounds(ev.n);
    for(let i=0; i<ev.rounds.length; i++){
      const r=ev.rounds[i];
      let heatsNote=null, semiSeat=false;
      spec=ccM21Spec(ev.n, r);
      const open=(r===1);
      field=open ? [you, ...careerCupField(cr, drafted, careerLadderEntrants(), 'm21|'+ev.n+'|'+ev.q, true, 0)]
                 : rowsOf(Q['r'+(r-1)]);
      // Записанный зал короче лобби (старый сейв, пустая запись) — добор сценой.
      if(!open){
        const want=Math.min(ccM21Spec(ev.n, r-1).cut, 100), seen=new Set(field.map(ccSeatKey));
        if(field.indexOf(you)<0) field.push(you);
        if(field.length<want) ccM23World(want+20, 'm21q|'+ev.n+'|'+ev.q+'|'+r).forEach(t=>{
          if(field.length>=want || seen.has(ccSeatKey(t))) return;
          seen.add(ccSeatKey(t)); field.push(t);
        });
      }
      stageLabel=ccYearLabel('Major'+ev.n+'_2021_Q'+ev.q+'R'+r, careerToday(), careerToday());
      ranked=await play(field, spec, stageLabel, open);
      place=ranked.indexOf(you)+1;
      if(r===R){
        // Раунд 4: топ прямо в финал (кроме C2S5), остальные — в серию.
        through=spec.cut>0 && place<=spec.cut;
        ranked.slice(0, spec.cut).forEach(t=>m.direct.push(seedOf(t)));
        ccM21SeriesAdd(m, ranked.slice(spec.cut), seedOf);
        if(through) m.ticket=true;
        Q.done=true;
        /* Не прямое место — ещё не вылет: полуфинал набирается из серии (ccM21Heats: хиты первого
           дня × лобби, без прямых). Плашка раньше горела красным всегда, хотя хит открывался. */
        if(!through){
          ccM21SettleQuals(m);
          const direct=new Set(m.direct.map(ccM21Key)), myKey=ccSeatKey(you);
          const order=Object.keys(m.series).filter(k=>!direct.has(ccM21Key(m.seriesRows[k]))).sort((a,b)=>m.series[b]-m.series[a]);
          const need=ccM21HeatPlan(ev.n).filter(h=>!h.prev).length*F, at=order.indexOf(myKey)+1;
          heatsNote=(at>0 && at<=need) ? L().ccYrXHeatsZone(need) : L().ccYrXHeatsOut(need);
          semiSeat=at>0 && at<=need;
        }
      } else {
        through=place<=spec.cut;
        Q['r'+r]=ranked.slice(0, spec.cut).map(seedOf);
      }
      m.youKey=ccSeatKey(you);
      note = (r===R) ? (through ? L().ccYr22Direct(spec.cut) : L().ccYr24Series(m.series[m.youKey]||0, ccM21SeriesRank(m, m.youKey))+(heatsNote ? ' · '+heatsNote : ''))
                     : (through ? L().ccRelPass(spec.cut) : L().ccRelFail(spec.cut));
      // Место в полуфинале по серии — тоже проход (плашка, журнал, cr.major), но не билет в финал.
      if(semiSeat) through=true;
      if(i<ev.rounds.length-1){
        const sh=createStageCardShell(stageLabel+' — '+field.length);
        await revealStageLog(you, sh, true);
        finalizeStageCard(sh, place, field.length, you.stagePts, through, false, note);
        await revealStandings(sh, ranked, you, spec.cut||0);
        careerPrAdd(ranked, {div:cr.division, kind:'major', stage:'q'});
        // Вылет посреди вечера: карточка уже показана — общий блок ниже её не повторяет.
        if(!through){ shownOut=true; break; }
      }
    }
  } else if(ev.stage==='semi'){
    ccM21SettleHeats(m);
    const hi=ccM21YourHeat(m, ev.r), heat=ccM21Heats(m)[hi];
    spec={games:CC_M21.semi.games, cut:heat.cut};
    field=rowsOf(heat.rows);
    if(field.indexOf(you)<0) field.push(you);
    stageLabel=L().ccYrXHeatN(ev.label, hi+1);
    ranked=await play(field, spec, stageLabel, false);
    place=ranked.indexOf(you)+1;
    m.heatRes[hi]={up:ranked.slice(0, heat.cut).map(seedOf), rest:ranked.slice(heat.cut).map(seedOf)};
    through=place<=heat.cut;
    if(through) m.ticket=true;
    // C2S8: не прошедшие первый день играют хиты второго (ccM21HeatPlan, prev) — это не конец.
    const day2=!through && ccM21HeatPlan(ev.n).some(h=>h.prev) && !heat.prev;
    note=through ? L().ccYr22SemiUp : day2 ? L().ccYr21ToDay2 : (ccM21RebootCut(ev.n) ? L().ccYr21ToReboot : L().ccRelFail(heat.cut));
    if(day2) alive=true;
  } else if(ev.stage==='reboot'){
    const cut=ccM21RebootCut(ev.n);
    spec={games:ccM21RebootGames(ev.n), cut:cut};
    field=rowsOf(ccM21RebootRoom(m));
    if(field.indexOf(you)<0) field.push(you);
    ranked=await play(field, spec, stageLabel, false);
    place=ranked.indexOf(you)+1;
    m.reboot={up:ranked.slice(0, cut).map(seedOf)};
    through=place<=cut;
    if(through) m.ticket=true;
    note=through ? L().ccYr22SemiUp : L().ccRelFail(cut);
  } else {
    spec=CC_M21.final;
    field=rowsOf(ccM21GfRows(m));
    if(field.indexOf(you)<0) field.unshift(you);
    field=field.slice(0, F);
    if(field.indexOf(you)<0) field[field.length-1]=you;
    ranked=await play(field, spec, stageLabel, false);
    place=ranked.indexOf(you)+1;
  }
  m.got[ev.id]=true;
  removeSkipButton();
  const fin=ev.stage==='final';
  if(!shownOut){
    const shell=createStageCardShell(stageLabel+' — '+field.length);
    await revealStageLog(you, shell, true);
    finalizeStageCard(shell, place, field.length, you.stagePts,
      ccStagePassed(through || alive, spec, place, fin ? majorPrize : null), false, fin ? ccMajorSeatNote(ev) : note);
    await revealStandings(shell, ranked, you, spec.cut||0, null, null, fin ? majorPrize : null, null, fin);
    careerPrAdd(ranked, {div:cr.division, kind:'major', stage:fin ? 'final' : ev.stage});
  }
  let cash=0;
  if(fin){
    careerMoneyAdd(ranked, majorPrize);
    cash=majorPrize(place);
    if(cash) ccPayIn(ccShareOf(cash, you));
    careerReachAdd(careerReachResult(place, field.length, 1, 'major'));
    careerNews(cash?'good':'flat', cash?'ccNewsEvCash':'ccNewsEvNoCash',
               cash?[ccSeasonEvName(2021, ev.n), place, ccNum(cash)]:[ccSeasonEvName(2021, ev.n), place, field.length], {tbl:ccStageShot(ranked, you, 1, stageLabel)});
    if(place>field.length/2) careerNews('bad', 'ccPostTriedBest', []);
    careerCongrats(ranked, you, L().ccCongratsEv(ccSeasonEvName(2021, ev.n)));
    cr.major={n:ev.n, got:'final', pass:'final', ticket:false};
  } else {
    careerNews(through?'good':'flat', through?'ccNewsMajThrough':'ccNewsMajOut',
               [stageLabel, place, field.length], {tbl:ccStageShot(ranked, you, 1, stageLabel)});
    const prev=(cr.major && cr.major.n===ev.n) ? cr.major : null;
    cr.major={n:ev.n, got:ev.stage, pass: through ? ev.stage : (prev ? prev.pass||null : null), ticket:!!m.ticket};
  }
  const places=(you.stageLog||[]).map(g=>g.place);
  cr.log=cr.log||[];
  careerGrowEvent(place, field.length, you, field);
  cr.log.push({season:cr.season, day:careerToday(), div:cr.division, place:place, of:field.length, pts:you.stagePts,
               passed: fin ? cash>0 : (through || alive), ovr:CAREER.player.ovr, games:games||spec.games, wins:you.wins||0, elims:you.stageElims||0,
               avg: places.length ? Math.round(places.reduce((s,v)=>s+v,0)/places.length*10)/10 : null,
               mate: mate ? mate.handle : null, mates: ccLogMates(mates), prize:ccShareOf(cash, you), kind:'major', stage:fin ? 'final' : ev.stage,
               won: fin ? ccStageSeatRow(ranked[0]) : undefined, top: fin ? ccStageTop(ranked, you) : undefined});
  await ccMpClose(ranked);
  careerAdvanceTo(ccAddDays(careerToday(), 1));
  if(ccOffersOpen(place, field.length)){
    CAREER.offers=careerOrgOffers();
    careerOrgOffersToDms();
    if(CAREER.offers && CAREER.offers.length) CAREER.offersDeclined=null;
  }
  careerSave();
  CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; CC_KILL_CAP=0;
  careerRenderHub('centre');
  careerReloadResultCard({label:stageLabel, place:place, of:field.length, through: fin ? cash>0 : (through || alive), cut:spec.cut||0,
    note: fin ? null : note, seat:false, seatText:null, money: fin ? cash : null});
}
// ==== /FNCS 2021 machine ====
// ==== FNCS 2022 machine (tools/splice-2022.js) ====
/* ---- Сезон FNCS 2022-го (Chapter 3) ---------------------------------------------
   Формат Epic (окна Tracker, Liquipedia; спека career-year-2022-design.md), дуо:
   квалификаторы — C3S1 два по три раунда (10 игр → топ-400, 7 игр → топ-50, 6 игр → топ-8
   прямо в финал), C3S2/C3S3 три по четыре раунда (10 → топ-2000, 10 → топ-500/250, 10 →
   топ-50, 6 → топ-5 в финал); очки серии — за два последних раунда. Полуфинал — три сессии
   по пять игр: пятьдесят лучших по серии (без прямых), в финал — победители матчей (до
   пяти) и лучшие по очкам до 11–12 (квоты сессий — окна Epic); оставшиеся садятся в следующую сессию,
   недобор — следующими по серии. Финал — 50 дуо, двенадцать игр. «Мейджор n» = сезон n.
   Два раунда в один вечер у Epic бывали часто — день календаря несёт свой список раундов. */
const CC_M22={
  q:{1:{games:10, cut:250, open:true}, 2:{games:7, cut:50}, 3:{games:6, cut:8}},   // C3S1 Q1/Q2: «Top 250 duos will advance to Round 2» (было 400)
  /* Открытый раунд — форма Epic, размер нашей лестницы, как у 2024-го (CC_M24): у Epic 2000 из ~10 000, у нас лестница ~2 330,
     и 2000 из неё — это 86 % прохода, то есть раунд бесплатный (сверка 7.10). Ополовинено до 1000; дальше числа Epic. */
  qDeep:{1:{games:10, cut:1000, open:true}, 2:{games:10, cut:500}, 3:{games:10, cut:50}, 4:{games:6, cut:5}},
  qDeep3:{2:{games:10, cut:250}},
  semi:{games:5, vr:5, cut:[11, 12, 12], cut1:[11, 11, 12], field:50},
  final:{games:12, cut:0}, field:50
};
/* Матч-поинт финалов 2022 (Liquipedia, Grand Finals Europe, сверка 20.10): C3S1 — «3 Victory Royales and 300 Points»,
   C3S2 и C3S3 — «first to have 3 Victory Royales and 475 points», иначе — больше очков после 12 игр. C3S4 — Invitational, без него. */
const CC_M22_MP={1:{vr:3, pts:300}, 2:{vr:3, pts:475}, 3:{vr:3, pts:475}};
function ccM22Rounds(n){ return n===1 ? 3 : 4; }
function ccM22Spec(n, r){
  if(n===1) return CC_M22.q[r];
  if(n===3 && CC_M22.qDeep3[r]) return CC_M22.qDeep3[r];
  return CC_M22.qDeep[r];
}
// C3S2/C3S3, сессии 2 и 3 — «6 match limit» и «6 duos who got a victory royale» (Liquipedia; окна Epic S20/S21 SemiFinals — 5, потом 6). Сверка 7.10.
function ccM22SemiSpec(n, s){ const six=n>=2 && s>=2; return {games:six ? 6 : CC_M22.semi.games, vr:six ? 6 : CC_M22.semi.vr}; }
function ccM22SemiCut(n, s){ return (n===1 ? CC_M22.semi.cut1 : CC_M22.semi.cut)[s-1]||11; }
function ccM22Quals(n){ return n===1 ? 2 : 3; }
function ccM22Of(n){
  const cr=CAREER && CAREER.career; if(!cr) return null;
  const m=cr.major22;
  return (m && m.n===n && m.season===cr.season) ? m : null;
}
function ccM22State(n){
  const cr=CAREER.career;
  let m=ccM22Of(n);
  if(!m) m=cr.major22={n:n, season:cr.season, got:{}, q:{}, series:{}, seriesRows:{}, direct:[], semi:{}, youKey:null, ticket:false};
  return m;
}
function ccM22Day(n, tail){
  const row=ccYearRows().find(r=>r[2]==='Major'+n+'_2022_'+tail || (tail.charAt(0)==='Q' && r[2].indexOf('Major'+n+'_2022_'+tail)===0));
  return row ? row[0] : null;
}
// Последний день квалификатора q (его последний раунд).
function ccM22QualEnd(n, q){
  let last=null;
  ccYearRows().forEach(r=>{ if(r[2].indexOf('Major'+n+'_2022_Q'+q+'R')===0 && (!last || r[0]>last)) last=r[0]; });
  return last;
}
function ccM22SeriesRank(m, key){
  if(!m || !key) return 0;
  const keys=Object.keys(m.series).sort((a,b)=>m.series[b]-m.series[a]);
  const at=keys.indexOf(key);
  return at<0 ? 0 : at+1;
}
/* Очки серии за место в раунде: дошедший до последнего раунда стоит выше любого вылетевшего раньше.
   Было «weight×(n−i)» — у вылетевших на предпоследнем раунде n≈200, у последнего n≈42, и 51-е место
   второго раунда (≈200 очков) обгоняло 9-е место финального (84). Полуфинал (топ-50 серии) забирали
   вылетевшие раньше, и в C3S1 в финал было только «топ-8 в один из дней» (Notion «19.10», тестер).
   Теперь предпоследний раунд — 1…99, последний — 100 + 2×(n−i). */
function ccM22SeriesAdd(m, ranked, weight, rowOf){
  const n=ranked.length;
  ranked.forEach((t,i)=>{
    const k=ccSeatKey(t);
    const pts=weight===1 ? Math.max(1, Math.round(99*(n-i)/n)) : 100+weight*(n-i);
    m.series[k]=(m.series[k]||0)+pts; if(!m.seriesRows[k]) m.seriesRows[k]=rowOf(t);
  });
}
const ccM22Key=r=>r==='you' ? 'you' : JSON.stringify(r);
/* Квалификатор, досчитанный молча: его последние два раунда — пятьдесят сильных сцены.
   Прямые места (топ-8 / топ-5) уходят в финал, остальные — в серию. */
function ccM22SettleQual(m, q){
  const Q=m.q[q]=m.q[q]||{};
  if(Q.done) return;
  const end=ccM22QualEnd(m.n, q);
  if(!end || careerToday()<=end) return;
  const R=ccM22Rounds(m.n), last=ccM22Spec(m.n, R);
  let room=(Q['r'+(R-1)]||[]).filter(r=>r!=='you').map(ccMajorTeamFrom);
  if(room.length<CC_M22.field){
    const seen=new Set(room.map(ccSeatKey));
    ccM23World(CC_M22.field+20, 'm22|'+m.n+'|'+q).forEach(t=>{
      if(room.length>=CC_M22.field || seen.has(ccSeatKey(t))) return;
      seen.add(ccSeatKey(t)); room.push(t);
    });
  }
  room=room.slice(0, CC_M22.field);
  room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
  ccWorldRun('m22q|'+m.season+'|'+m.n+'|'+q, ()=>simulateGames(room, last.games, ccM24Points, CC_M24_KILL));
  const ranked=ccM24Rank(room);
  ranked.slice(0, last.cut).forEach(t=>m.direct.push(ccMajorSeatRow(t)));
  ccM22SeriesAdd(m, ranked.slice(last.cut), 2, ccMajorSeatRow);
  Q.done=true;
}
function ccM22SettleQuals(m){ for(let q=1; q<=ccM22Quals(m.n); q++) ccM22SettleQual(m, q); }
// Комната сессии s полуфинала: перенесённые из прошлой сессии + добор по серии до 50.
function ccM22SemiRoom(m, s){
  ccM22SettleQuals(m);
  for(let i=1; i<s; i++) ccM22SettleSemi(m, i);
  const direct=new Set(m.direct.map(ccM22Key));
  const done=new Set();
  for(let i=1; i<s; i++) ((m.semi[i]||{}).up||[]).forEach(r=>done.add(ccM22Key(r)));
  const prev=(s>1 && m.semi[s-1]) ? (m.semi[s-1].rest||[]) : [];
  const room=prev.filter(r=>!done.has(ccM22Key(r)));
  const seen=new Set(room.map(ccM22Key));
  Object.keys(m.series).sort((a,b)=>m.series[b]-m.series[a]).forEach(k=>{
    if(room.length>=CC_M22.semi.field) return;
    const r=m.seriesRows[k], key=ccM22Key(r);
    if(direct.has(key) || done.has(key) || seen.has(key)) return;
    // Уже сыгравшие прошлую сессию и не прошедшие — в её остатке; остальные ещё не садились.
    let played=false; for(let i=1; i<s; i++) if(((m.semi[i]||{}).all||[]).some(x=>ccM22Key(x)===key)) played=true;
    if(played) return;
    seen.add(key); room.push(r);
  });
  // Серия короче полусотни (одни и те же дуо в двух квалификаторах) — добор сценой.
  if(room.length<CC_M22.semi.field){
    const sat=new Set(); for(let i=1; i<s; i++) ((m.semi[i]||{}).all||[]).forEach(x=>sat.add(ccM22Key(x)));
    ccM23World(CC_M22.semi.field*2, 'm22s|'+m.n+'|'+s).forEach(t=>{
      if(room.length>=CC_M22.semi.field) return;
      const r=ccMajorSeatRow(t), key=ccM22Key(r);
      if(direct.has(key) || done.has(key) || seen.has(key) || sat.has(key)) return;
      seen.add(key); room.push(r);
    });
  }
  return room;
}
// Записать сессию: победители матчей (до пяти) и лучшие по очкам — до квоты сессии.
function ccM22WriteSemi(m, s, ranked, rowOf){
  const quota=ccM22SemiCut(m.n, s);
  const up=[], seen=new Set();
  ranked.forEach(t=>{ if((t.wins||0)>0 && up.length<ccM22SemiSpec(m.n, s).vr && !seen.has(t)){ seen.add(t); up.push(t); } });
  ranked.forEach(t=>{ if(up.length<quota && !seen.has(t)){ seen.add(t); up.push(t); } });
  m.semi[s]={up:up.map(rowOf), rest:ranked.filter(t=>!seen.has(t)).map(rowOf), all:ranked.map(rowOf)};
  return up;
}
function ccM22SettleSemi(m, s){
  if(m.semi[s]) return;
  const day=ccM22Day(m.n, 'Semi'+s);
  if(!day || careerToday()<=day) return;
  if(s>1) ccM22SettleSemi(m, s-1);
  const room=ccM22SemiRoom(m, s).filter(r=>r!=='you').map(ccMajorTeamFrom);
  if(!room.length){ m.semi[s]={up:[], rest:[], all:[]}; return; }
  room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
  ccWorldRun('m22semi|'+m.season+'|'+m.n+'|'+s, ()=>simulateGames(room, ccM22SemiSpec(m.n, s).games, ccM24Points, CC_M24_KILL));
  ccM22WriteSemi(m, s, ccM24Rank(room), ccMajorSeatRow);
}
// Финал: прямые из квалификаторов и прошедшие полуфинал; недобор — следующими по серии.
function ccM22GfRows(m){
  if(!m) return null;
  ccM22SettleQuals(m); for(let s=1; s<=3; s++) ccM22SettleSemi(m, s);
  const out=[], seen=new Set();
  const add=r=>{ const k=ccM22Key(r); if(!r || seen.has(k) || out.length>=CC_M22.field) return; seen.add(k); out.push(r); };
  m.direct.forEach(add);
  for(let s=1; s<=3; s++) ((m.semi[s]||{}).up||[]).forEach(add);
  Object.keys(m.series).sort((a,b)=>m.series[b]-m.series[a]).forEach(k=>add(m.seriesRows[k]));
  return out;
}
function ccM22WorldFinalRoom(m, drafted, lobbyCr){
  const rows=m ? ccM22GfRows(m) : null;
  const room=(rows && rows.length>=10) ? rows.filter(r=>r!=='you').map(ccMajorTeamFrom) : [];
  if(room.length<CC_M22.field){
    const seen=new Set(room.map(ccSeatKey));
    careerCupField(lobbyCr, drafted, CC_M22.field+20, null, false, CC_FIELD_SHARP.final).forEach(t=>{
      if(room.length>=CC_M22.field || seen.has(ccSeatKey(t))) return;
      seen.add(ccSeatKey(t)); room.push(t);
    });
  }
  return room.slice(0, CC_M22.field);
}
function ccM22CanStage(ev, cr, gaveUp){
  const s=ccM22Of(ev.n);
  if(s && s.got[ev.id]) return false;
  if(ev.stage==='q'){
    if(s && s.ticket) return false;                    // уже в финале — квалификаторы не нужны
    const first=ev.rounds[0];
    if(first===1) return true;
    const prev=s && s.q[ev.q] && s.q[ev.q]['r'+(first-1)];
    return ccSeedHasMe(prev);
  }
  if(ev.stage==='semi'){
    if(!s || s.ticket || !s.youKey) return false;
    const room=ccM22SemiRoom(s, ev.r);
    return ccSeedHasMe(room);
  }
  return !gaveUp && !!(s && s.ticket);
}
async function runCareerMajor2022(){
  const cr=CAREER.career;
  const ev=careerMajorOn(careerToday());
  if(!ev || !ev.y22 || !careerMajorCan(ev)) return;
  const mpStart=ccMpLock() ? await ccMpGate('major') : null;
  careerCampBonus('major', ev.id||ev.label||'');
  const me=careerCard(), mates=careerMates();
  if(!me || mates.length<careerMateSeats() || mates.some(function(m){ return !m; })) return;
  const mate=mates[0]||null;
  const prevMode=CARD_MODE, prevSize=squadSize, prevDrafted=drafted;
  CARD_MODE=true; squadSize=careerSquadSize(); drafted=[me].concat(mates);
  skipAnimation=false; CC_SKIP_RUN=false;
  resetRunRecord();
  document.getElementById('majorStages').innerHTML='';
  const rsPrev=document.getElementById('runSummary'); if(rsPrev) rsPrev.innerHTML='';
  document.getElementById('lobbyTitle').textContent='';
  document.getElementById('lobbyBody').innerHTML='';
  clearEventPanel();
  document.getElementById('finalBanner').style.display='none';
  clearLandingResultsMap();
  CAREER_RUN=true;
  show('screen-results');
  ensureSkipButton();

  const you=careerYouTeam(drafted);
  you.name=L().yourTeamPrefix+teamLabel(drafted); you.isYou=true;
  const m=ccM22State(ev.n);
  const rowsOf=rows=>ccStageRowsOf(rows, you);
  const seedOf=t=>ccSeedRow(t, you, ccMajorSeatRow);
  let field, spec, stageLabel=ev.label, through=false, note='', games=0;
  let ranked=[], place=0, shownOut=false, alive=false;
  /* Место в полуфинале по серии (ccM22SemiRoom: топ-50 серии без прямых мест). Плашка последнего
     раунда горела красным всегда, хотя полуфинал открывался (аудит 29.09). */
  const semiZone=()=>{
    const direct=new Set(m.direct.map(ccM22Key)), myKey=ccSeatKey(you);
    const order=Object.keys(m.series).filter(k=>!direct.has(ccM22Key(m.seriesRows[k]))).sort((a,b)=>m.series[b]-m.series[a]);
    const at=order.indexOf(myKey)+1;
    return at>0 && at<=CC_M22.semi.field;
  };
  const play=async (room, sp, label, open)=>{
    room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; t.stageLog=[]; });
    CC_M24_GAME=0;
    const pS=ccPastMajorScore(ev);
    // Матч-поинт финала (CC_M22_MP): первый, кто набрал и победы, и очки, — чемпион, финал кончается.
    const mp=(sp===CC_M22.final) ? CC_M22_MP[ev.n] : null;
    const mpOf=ts=>mp ? ts.find(t=>(t.wins||0)>=mp.vr && (t.stagePts||0)>=mp.pts) : null;
    await simulateGamesLive(room, sp.games, pS ? pS.pts : ccM24Points, pS ? pS.kill : CC_M24_KILL, 'stage', 0, null, null,
      {lobbySize:ccTeams(50), stageName:label, mapReplay:true, choices:true, stopOnYourDeath:true, roomOnly:!open,
       stopWhen: mp ? (ts=>!!mpOf(ts)) : null,
       dropEachGame:(g,rm)=>{ CC_M24_GAME=g; return open ? null : careerLandingPick(rm||room, you, label, ['major']); }});
    games+=sp.games;
    const ranked=ccM24Rank(room), champ=mpOf(room);
    if(champ && ranked[0]!==champ){ ranked.splice(ranked.indexOf(champ), 1); ranked.unshift(champ); }
    return ranked;
  };
  if(ev.stage==='q'){
    /* Раунды этого вечера подряд: прошёл — играешь следующий тем же вечером. Промежуточный
       раунд показывается своей карточкой, итог вечера — последним сыгранным. */
    const Q=m.q[ev.q]=m.q[ev.q]||{};
    const R=ccM22Rounds(ev.n);
    for(let i=0; i<ev.rounds.length; i++){
      const r=ev.rounds[i];
      spec=ccM22Spec(ev.n, r);
      const open=(r===1);
      field=open ? [you, ...careerCupField(cr, drafted, careerLadderEntrants(), 'm22|'+ev.n+'|'+ev.q, true, 0)]
                 : rowsOf(Q['r'+(r-1)]);
      // Записанный зал короче лобби (старый сейв, пустая запись) — добор сценой.
      if(!open){
        const want=Math.min(ccM22Spec(ev.n, r-1).cut, 100), seen=new Set(field.map(ccSeatKey));
        if(field.indexOf(you)<0) field.push(you);
        if(field.length<want) ccM23World(want+20, 'm22q|'+ev.n+'|'+ev.q+'|'+r).forEach(t=>{
          if(field.length>=want || seen.has(ccSeatKey(t))) return;
          seen.add(ccSeatKey(t)); field.push(t);
        });
      }
      stageLabel=ccYearLabel('Major'+ev.n+'_2022_Q'+ev.q+'R'+r, careerToday(), careerToday());
      ranked=await play(field, spec, stageLabel, open);
      place=ranked.indexOf(you)+1;
      if(r===R){
        // Последний раунд: топ прямо в финал, остальные — в серию (вдвое).
        through=place<=spec.cut;
        ranked.slice(0, spec.cut).forEach(t=>m.direct.push(seedOf(t)));
        ccM22SeriesAdd(m, ranked.slice(spec.cut), 2, seedOf);
        if(through) m.ticket=true;
        Q.done=true;
      } else {
        through=place<=spec.cut;
        Q['r'+r]=ranked.slice(0, spec.cut).map(seedOf);
        if(r===R-1) ccM22SeriesAdd(m, ranked.slice(spec.cut), 1, seedOf);
      }
      m.youKey=ccSeatKey(you);
      // Серию получают последний раунд и вылетевшие на предпоследнем — у них место в полуфинале решает она.
      const bySeries=!through && (r===R || r===R-1);
      const zone=bySeries && semiZone();
      note = (r===R) ? (through ? L().ccYr22Direct(spec.cut) : L().ccYr24Series(m.series[m.youKey]||0, ccM22SeriesRank(m, m.youKey)))
                     : (through ? L().ccRelPass(spec.cut) : L().ccRelFail(spec.cut));
      if(bySeries) note+=' · '+(zone ? L().ccYrSemiZone(CC_M22.semi.field) : L().ccYrSemiOut(CC_M22.semi.field));
      if(zone) alive=true;
      if(i<ev.rounds.length-1){
        const sh=createStageCardShell(stageLabel+' — '+field.length);
        await revealStageLog(you, sh, true);
        finalizeStageCard(sh, place, field.length, you.stagePts, through || zone, false, note);
        await revealStandings(sh, ranked, you, spec.cut||0);
        careerPrAdd(ranked, {div:cr.division, kind:'major', stage:'q'});
        // Вылет посреди вечера: карточка уже показана — общий блок ниже её не повторяет.
        if(!through){ shownOut=true; break; }
      }
    }
  } else if(ev.stage==='semi'){
    spec={games:ccM22SemiSpec(ev.n, ev.r).games, cut:ccM22SemiCut(ev.n, ev.r)};
    field=rowsOf(ccM22SemiRoom(m, ev.r));
    if(field.indexOf(you)<0) field.push(you);
    stageLabel=ev.label;
    ranked=await play(field, ccM22SemiSpec(ev.n, ev.r), stageLabel, false);
    place=ranked.indexOf(you)+1;
    const up=ccM22WriteSemi(m, ev.r, ranked, seedOf);
    through=up.indexOf(you)>=0;
    if(through) m.ticket=true;
    note=through ? L().ccYr22SemiUp : (ev.r<3 ? L().ccYr22SemiNext : L().ccRelFail(spec.cut));
  } else {
    spec=CC_M22.final;
    field=rowsOf(ccM22GfRows(m));
    if(field.indexOf(you)<0) field.unshift(you);
    field=field.slice(0, CC_M22.field);
    if(field.indexOf(you)<0) field[field.length-1]=you;
    ranked=await play(field, spec, stageLabel, false);
    place=ranked.indexOf(you)+1;
  }
  m.got[ev.id]=true;
  removeSkipButton();
  const fin=ev.stage==='final';
  if(!shownOut){
    const shell=createStageCardShell(stageLabel+' — '+field.length);
    await revealStageLog(you, shell, true);
    finalizeStageCard(shell, place, field.length, you.stagePts,
      ccStagePassed(through || alive, spec, place, fin ? majorPrize : null), false, fin ? ccMajorSeatNote(ev) : note);
    await revealStandings(shell, ranked, you, spec.cut||0, null, null, fin ? majorPrize : null, null, fin);
    careerPrAdd(ranked, {div:cr.division, kind:'major', stage:fin ? 'final' : ev.stage});
  }
  let cash=0;
  if(fin){
    careerMoneyAdd(ranked, majorPrize);
    cash=majorPrize(place);
    if(cash) ccPayIn(ccShareOf(cash, you));
    careerReachAdd(careerReachResult(place, field.length, 1, 'major'));
    careerNews(cash?'good':'flat', cash?'ccNewsEvCash':'ccNewsEvNoCash',
               cash?[ccSeasonEvName(2022, ev.n), place, ccNum(cash)]:[ccSeasonEvName(2022, ev.n), place, field.length], {tbl:ccStageShot(ranked, you, 1, stageLabel)});
    if(place>field.length/2) careerNews('bad', 'ccPostTriedBest', []);
    careerCongrats(ranked, you, L().ccCongratsEv(ccSeasonEvName(2022, ev.n)));
    ccGcKeepFinal(2022, ev.n, ranked.map(seedOf));
    cr.major={n:ev.n, got:'final', pass:'final', ticket:false};
  } else {
    careerNews(through?'good':'flat', through?'ccNewsMajThrough':'ccNewsMajOut',
               [stageLabel, place, field.length], {tbl:ccStageShot(ranked, you, 1, stageLabel)});
    const prev=(cr.major && cr.major.n===ev.n) ? cr.major : null;
    cr.major={n:ev.n, got:ev.stage, pass: through ? ev.stage : (prev ? prev.pass||null : null), ticket:!!m.ticket};
  }
  const places=(you.stageLog||[]).map(g=>g.place);
  cr.log=cr.log||[];
  careerGrowEvent(place, field.length, you, field);
  cr.log.push({season:cr.season, day:careerToday(), div:cr.division, place:place, of:field.length, pts:you.stagePts,
               passed: fin ? cash>0 : (through || alive), ovr:CAREER.player.ovr, games:games||spec.games, wins:you.wins||0, elims:you.stageElims||0,
               avg: places.length ? Math.round(places.reduce((s,v)=>s+v,0)/places.length*10)/10 : null,
               mate: mate ? mate.handle : null, mates: ccLogMates(mates), prize:ccShareOf(cash, you), kind:'major', stage:fin ? 'final' : ev.stage,
               won: fin ? ccStageSeatRow(ranked[0]) : undefined, top: fin ? ccStageTop(ranked, you) : undefined});
  await ccMpClose(ranked);
  careerAdvanceTo(ccAddDays(careerToday(), 1));
  if(ccOffersOpen(place, field.length)){
    CAREER.offers=careerOrgOffers();
    careerOrgOffersToDms();
    if(CAREER.offers && CAREER.offers.length) CAREER.offersDeclined=null;
  }
  careerSave();
  CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; CC_KILL_CAP=0;
  careerRenderHub('centre');
  const lanSeat = fin && ccGlobalsSeat() ? L().ccRelSeatGc(ccLanCity('globals')) : null;
  careerReloadResultCard({label:stageLabel, place:place, of:field.length, through: fin ? cash>0 : (through || alive), cut:spec.cut||0,
    note: fin ? null : note, seat: !!lanSeat, seatText: lanSeat, money: fin ? cash : null});
}
/* ---- FNCS Invitational 2022 (Роли) -----------------------------------------------
   50 приглашённых дуо со всего мира, двенадцать игр за два дня, $1 000 000 (Liquipedia).
   Зал — настоящие дуо (INV2022_DUOS) карточками 2022-го; своё место вытесняет одно.
   Приглашение карьеры — место в Гранд-финале сезона не ниже половины квоты региона
   (квоты — по настоящим участникам, INV2022_SEATS; у Epic — очки трёх сезонов). */
function ccInv22Quota(){
  let r=careerPrizeRegion();
  const n=(INV2022_SEATS[r]!=null ? INV2022_SEATS[r] : 1);
  return Math.max(1, Math.ceil(n/2));
}
function buildInvitational2022Field(you){
  const seated=new Set();
  const own=you && !you._stub ? you : null;
  if(own) (own.squad||[]).forEach(p=>seated.add(_gcNorm(p.handle)));
  const limit=CC_GLOB_FIELD-(own?1:0);
  const room=[];
  ccGcSimOn(()=>ccGcList('INV2022_DUOS', INV2022_DUOS)).forEach(d=>{ if(room.length>=limit) return; const t=ccLanTeam(d, null, 88, seated); if(t){ t.gcRoute='inv'; room.push(t); } });
  ccGc23Fill(room, limit, seated);
  if(own){ own.gcRoute='inv'; room.push(own); }
  return room;
}
/* Дивизионы C3S4: Placement Cup не играется — ступень по рейтингу против сцены региона.
   Своя оценка режима (у Epic: топ-200 кубка — Elite, до 1200 — Challenger, остальные —
   Contender): не ниже 30-го перцентиля сцены — Elite, не ниже 5-го — Challenger. */
function ccDiv22Place(){
  const cr=CAREER && CAREER.career; if(!cr) return;
  const d=careerToday();
  // День Placement Cup — его играют (ccPlacementApply); по рейтингу — только если кубок пропущен.
  if(d<=CC_DIV_FROM_2022 || d>CC_DIV_END_2022 || cr.div22===cr.season || cr.placed===cr.season) return;
  cr.div22=cr.season;
  const ovr=(CAREER.player && CAREER.player.ovr)||0;
  const pool=ccSceneRoster(ccCareerRegion()).map(c=>c._ovr!=null ? c._ovr : ((attrsFor(c)||{}).ovr||0)).sort((a,b)=>a-b);
  const at=q=>pool.length ? pool[Math.floor(q*(pool.length-1))] : 0;
  cr.division = ovr>=at(0.3) ? 1 : ovr>=at(0.05) ? 2 : 3;
}
/* C4S1: карьера, пришедшая из 2022-го, без сыгранного Placement Cup (16.12.2022) ставится по
   рейтингу против сцены региона той же меркой, что и C3S4 (ccDiv22Place). Свежая карьера 2023-го
   выбирает ступень на экране создания. */
function ccDiv23Place(){
  const cr=CAREER && CAREER.career; if(!cr || cr.placed===cr.season || cr.div23===cr.season) return;
  if(!(cr.year0<2023) || careerToday()<='2022-12-16') return;
  cr.div23=cr.season;
  const ovr=(CAREER.player && CAREER.player.ovr)||0;
  const pool=ccSceneRoster(ccCareerRegion()).map(c=>c._ovr!=null ? c._ovr : ((attrsFor(c)||{}).ovr||0)).sort((a,b)=>a-b);
  const at=q=>pool.length ? pool[Math.floor(q*(pool.length-1))] : 0;
  cr.division = ovr>=at(0.3) ? 1 : ovr>=at(0.05) ? 2 : 3;
}
// ==== /FNCS 2022 machine ====
async function runCareerMajor2024(){
  const cr=CAREER.career;
  const ev=careerMajorOn(careerToday());
  if(!ev || !ev.y24 || !careerMajorCan(ev)) return;
  // Командный вечер ждёт напарника. См. ccMpGate.
  const mpStart=ccMpLock() ? await ccMpGate('major') : null;
  careerCampBonus('major', ev.id||ev.label||'');
  const me=careerCard(), mates=careerMates();
  if(!me || mates.length<careerMateSeats() || mates.some(function(m){ return !m; })) return;
  const mate=mates[0]||null;
  const prevMode=CARD_MODE, prevSize=squadSize, prevDrafted=drafted;
  CARD_MODE=true; squadSize=careerSquadSize(); drafted=[me].concat(mates);
  skipAnimation=false; CC_SKIP_RUN=false;
  resetRunRecord();
  document.getElementById('majorStages').innerHTML='';
  const rsPrev=document.getElementById('runSummary'); if(rsPrev) rsPrev.innerHTML='';
  document.getElementById('lobbyTitle').textContent='';
  document.getElementById('lobbyBody').innerHTML='';
  clearEventPanel();
  document.getElementById('finalBanner').style.display='none';
  clearLandingResultsMap();
  CAREER_RUN=true;
  show('screen-results');
  ensureSkipButton();

  const you=careerYouTeam(drafted);
  you.name=L().yourTeamPrefix+teamLabel(drafted); you.isYou=true;
  const m=ccM24State(ev.n);
  const rowsOf=rows=>ccStageRowsOf(rows, you);
  const seedOf=t=>ccSeedRow(t, you, ccMajorSeatRow);
  let spec=ccM24Spec(ev);
  let field, stageLabel=ev.label;
  const openRound=(ev.stage==='q' && ev.r===1);
  if(ev.stage==='q'){
    // Первый раунд открыт всему региону — вся лестница, как Ласт Ченс 2026-го.
    /* Оба квалификатора Мейджора — одна и та же сцена.

       Комната открытого раунда сеется неделей ПЕРВОГО квалификатора этого
       Мейджора, а не сегодняшней: иначе февральский квалификатор пересобирал
       пары заново (см. careerSeed, seedWeek). */
    field=openRound ? [you, ...careerCupField(ccM24OpenCr(cr, ev.n), drafted, careerLadderEntrants(), null, true, 0)]
                    : rowsOf(m.q[ev.q]['r'+(ev.r-1)]);
  } else if(ev.stage==='semi'){
    const br=m[m.bracket];
    // Нижняя сетка садится своей вчерашней комнатой И теми, кого уронила верхняя.
    field=rowsOf(ccM24Room(m, m.bracket, ev.r));
    stageLabel=ev.label+' · '+L()[m.bracket==='upper' ? 'ccYr24Upper' : 'ccYr24Lower'];
  } else {
    field=rowsOf(ccM24GfRows(m));
    if(field.indexOf(you)<0) field.unshift(you);
    field=field.slice(0, CC_M24.final.field);
    if(field.indexOf(you)<0) field[field.length-1]=you;
  }
  const fin0=(ev.stage==='final');
  CC_M24_GAME=0;
  await simulateGamesLive(field, spec.games, fin0 ? ccM24PointsGf : ccM24Points,
    fin0 ? ccM24KillGf : ev.stage==='q' ? CC_M24_KILL_Q : CC_M24_KILL, 'stage', 0, null, null,
    {days:fin0 ? CC_M24_DAY1_GAMES : 0, lobbySize:ccTeams(50), stageName:stageLabel, mapReplay:true, choices:true, stopOnYourDeath:true,
     stopOnWin:!!spec.vr, roomOnly:!openRound,
     // Второй день гранд-финала — ×1.5, и какая игра идёт, знает только этот вопрос.
     dropEachGame:(g,room)=>{ CC_M24_GAME=g;
       return openRound ? null : careerLandingPick(room||field, you, stageLabel, ['major']); }});
  let ranked=ccM24Rank(field);
  let place=ranked.indexOf(you)+1;
  let through=false, note='', twoRounds=false;
  m.got[ev.id]=true;
  /* Европа и NA Central, суббота: раунд 2 показан своей карточкой, прошедшие тут же играют
     раунд 3 — и дальше вечер считается по нему (в записи q[..].r2 лежит топ-250 третьего). */
  let shownOut=false, stay=false;
  if(ev.stage==='q' && ev.r===2 && ccM24Deep()){
    const pass2=place<=spec.cut;
    const sh1=createStageCardShell(stageLabel+' — '+field.length);
    await revealStageLog(you, sh1, true);
    finalizeStageCard(sh1, place, field.length, you.stagePts, pass2, false,
                      pass2 ? L().ccRelPass(spec.cut) : L().ccRelFail(spec.cut));
    await revealStandings(sh1, ranked, you, spec.cut);
    careerPrAdd(ranked, {div:cr.division, kind:'major', stage:'q'});
    if(pass2){
      const room=ranked.slice(0, spec.cut);
      const sp3=CC_M24.qDeep[3];
      const label3=L().ccYr24Qual(ev.n, ev.q, 3);
      room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; t.stageLog=[]; });
      CC_M24_GAME=0;
      await simulateGamesLive(room, sp3.games, ccM24Points, CC_M24_KILL_Q, 'stage', 0, null, null,
        {lobbySize:ccTeams(50), stageName:label3, mapReplay:true, choices:true, stopOnYourDeath:true, roomOnly:true,
         dropEachGame:(g,rm)=>{ CC_M24_GAME=g; return careerLandingPick(rm||room, you, label3, ['major']); }});
      field=room; spec=sp3; stageLabel=label3; twoRounds=true;
      ranked=ccM24Rank(field); place=ranked.indexOf(you)+1;
    } else shownOut=true;   // вылет в раунде 2: его карточка уже показана — второй раз её не рисовать
  }
  if(ev.stage==='q'){
    if(ev.r<3){
      through=place<=spec.cut;
      m.q[ev.q]=m.q[ev.q]||{};
      m.q[ev.q]['r'+ev.r]=ranked.slice(0, spec.cut).map(seedOf);
      note=through ? L().ccRelPass(spec.cut) : L().ccRelFail(spec.cut);
    } else {
      // Очки серии: линейно по месту последнего раунда, за оба квалификатора.
      ranked.forEach((t,i)=>{ const k=ccSeatKey(t); m.series[k]=(m.series[k]||0)+ccM24SeriesPts(i+1); m.seriesRows[k]=seedOf(t); });
      m.youKey=ccSeatKey(you);
      /* Серия решает полуфинал после второго квалификатора: верх — upperSize+lowerSize.
         Раньше плашка горела зелёным у всех (аудит 29.09). После первого — ещё не решено. */
      const semiSeats=CC_M24.upperSize+CC_M24.lowerSize, sr=ccM24SeriesRank(m, m.youKey);
      through=ev.q<2 || (sr>0 && sr<=semiSeats);
      note=L().ccYr24Series(m.series[m.youKey]||0, sr)+(ev.q>=2 ? ' · '+(through ? L().ccYrSemiZone(semiSeats) : L().ccYrSemiOut(semiSeats)) : '');
    }
  } else if(ev.stage==='semi'){
    const bracket=m.bracket;
    const passed=ccM24Write(m, bracket, ev.r, ranked, you)||[];
    through=passed.indexOf(you)>=0;
    if(spec.vr){
      m.ticket=m.ticket||through;
      /* Билета нет — значит одно из двух: остался наверху или упал в нижнюю.
         Считается тем же правилом, что и запись (ccM24Write): среди тех, кто
         не взял билет, первые keep остаются, остальные вниз. */
      const keep=(spec.keep!=null) ? spec.keep : ranked.length;
      const dropped=!through && ranked.indexOf(you)>=keep;
      if(dropped) m.bracket='lower';
      // Остался в верхней сетке — вечер пройден (зелёная плашка), хоть билета и нет.
      stay=!through && !dropped;
      note = through ? L().ccYr24VrTicket : dropped ? L().ccYr24Down : L().ccMajNoTicket;
    }
    else { if(ev.r===3) m.ticket=m.ticket||through; note=through ? L().ccRelPass(spec.cut) : L().ccRelFail(spec.cut); }
    // Чужая сетка играет тот же вечер.
    ccM24Settle(m, bracket==='upper' ? 'lower' : 'upper', ev.r);
    // Лучшие нижней поднимаются на пустые места верхней (ccM24Promo) — и ты тоже.
    if(bracket==='lower' && ccM24Promo(m, ev.r).indexOf('you')>=0){ m.bracket='upper'; note+=' · '+L().ccYr24Up; }
  }
  removeSkipButton();
  const fin=ev.stage==='final';
  if(!shownOut){
    const shell=createStageCardShell(stageLabel+' — '+field.length);
    await revealStageLog(you, shell, true);
    finalizeStageCard(shell, place, field.length, you.stagePts,
      ccStagePassed(through || stay, spec, place, fin ? majorPrize : null), false,
      fin ? ccMajorSeatNote(ev) : note);
    await revealStandings(shell, ranked, you, spec.cut||0, null, null, fin ? majorPrize : null, null, fin);
    careerPrAdd(ranked, {div:cr.division, kind:'major', stage:ev.stage});
  }
  let cash=0;
  if(fin){
    careerMoneyAdd(ranked, majorPrize);
    cash=majorPrize(place);
    if(cash) ccPayIn(ccShareOf(cash, you));
    careerReachAdd(careerReachResult(place, field.length, 1, 'major'));
    careerNews(cash?'good':'flat', cash?'ccNewsMajCash':'ccNewsMajNoCash',
               cash?[ev.n, place, ccNum(cash)]:[ev.n, place, field.length],
               {tbl:ccStageShot(ranked, you, 1, stageLabel)});
    if(place>field.length/2) careerNews('bad', 'ccPostTriedBest', []);
    careerCongrats(ranked, you, L().ccCongratsMajor(ev.n));
    m.gf=ranked.map(seedOf);
    ccGcKeepFinal(ccCalYear(), ev.n, m.gf);
    cr.major={n:ev.n, got:'final', pass:'final', ticket:false};
  } else {
    careerNews((through || stay)?'good':'flat', (through || stay)?'ccNewsMajThrough':'ccNewsMajOut',
               [ev.label, place, field.length], {tbl:ccStageShot(ranked, you, 1, stageLabel)});
    if(!through && spec.cut && place===spec.cut+1) careerNews('bad', 'ccPostOneOff', [ev.label]);
    const prev=(cr.major && cr.major.n===ev.n) ? cr.major : null;
    cr.major={n:ev.n, got:ev.stage, pass: through ? ev.stage : (prev ? prev.pass||null : null), ticket:!!m.ticket};
  }
  const places=(you.stageLog||[]).map(g=>g.place);
  cr.log=cr.log||[];
  careerGrowEvent(place, field.length, you, field);
  cr.log.push({season:cr.season, day:careerToday(), div:cr.division,
               place:place, of:field.length, pts:you.stagePts,
               passed: fin ? cash>0 : (through || stay),
               ovr:CAREER.player.ovr, games:spec.games*(twoRounds ? 2 : 1), wins:you.wins||0,
               elims:you.stageElims||0,
               avg: places.length ? Math.round(places.reduce((s,v)=>s+v,0)/places.length*10)/10 : null,
               mate: mate ? mate.handle : null, mates: ccLogMates(mates), prize:ccShareOf(cash, you), kind:'major', stage:ev.stage,
               won: fin ? ccStageSeatRow(ranked[0]) : undefined,
               top: fin ? ccStageTop(ranked, you) : undefined});
  await ccMpClose(ranked);
  careerAdvanceTo(ccAddDays(careerToday(), 1));
  /* В 2024-м дивизионных кубков нет, а окно предложений клубов открывается только после кубка
     (runCareerCup) — то есть клубы писали бы раз в год, на стыке сезона. Здесь окно открывает
     вечер Мейджора: клуб смотрит на результат, как смотрел бы на кубок. */
  if(ccOffersOpen(place, field.length)){
    CAREER.offers=careerOrgOffers();
    careerOrgOffersToDms();
    if(CAREER.offers && CAREER.offers.length) CAREER.offersDeclined=null;
  }
  careerSave();
  CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; CC_KILL_CAP=0;
  careerRenderHub('centre');
  const lanSeat = fin && (ccGlobalsSeat()||{}).via==='major2' ? L().ccRelSeatGc(ccLanCity('globals')) : null;
  careerReloadResultCard({label:stageLabel, place:place, of:field.length,
    through: fin ? cash>0 : (through || stay), cut:spec.cut||0,
    // Та же строка, что и на карточке этапа: очки серии, билет за победу в
    // матче, отсечка — смотря чем этот вечер кончается. См. careerReloadResultCard.
    note: fin ? null : note,
    seat: !!lanSeat, seatText: lanSeat, money: fin ? cash : null});
}
/* ---- Мейджор 2023-го ----------------------------------------------------------
   Формат Epic (окна Tracker, Liquipedia; спека career-year-2023-design.md):
   неделя — Day 1 (открытый: вся лестница региона; у Мейджора 1 — только дивизион 1,
   Elite) → топ-200 → Day 2 → топ-50 → финал недели, шесть игр, очки серии по месту.
   После трёх недель — топ-40 серии в Гранд-финал, ещё десять — из Surge Week (у
   Мейджора 3 её нет: все 50 по серии). Гранд-финал — 50 дуо, двенадцать игр.
   «Мейджор 4» — Last Chance Major: одна неделя (топ-250 → топ-50 → финал), финал
   раздаёт места в нижнюю сетку Копенгагена по квоте региона.

   Недели, в которые игрок не играл (или вылетел), досчитываются молча: финал
   недели нужен серии целиком, иначе топ-40 решали бы только сыгранные вечера. */
const CC_M23={
  d1:{games:10, cut:200, open:true},
  d2:{games:10, cut:50},
  wf:{games:6, cut:0},
  // Surge Week (Liquipedia, сверка 7.10): «5 games limit»; «Top 10 … 5 Duos with a victory royale during the session, 5 best duos according to ranking».
  surge:{games:5, cut:10, vr:5},
  final:{games:12, cut:0},
  field:50, seriesTop:40,
  lcm:{d1:{games:10, cut:250, open:true}, d2:{games:10, cut:50}, wf:{games:6, cut:0}}
};
// Очки серии за место в финале недели (Liquipedia, FNCS 2023 Week Finals): 625, 600,
// дальше минус пять до 45-го (385), 46-е — 355 … 50-е — 335.
const CC_M23_SERIES=(function(){
  const t=[625];
  for(let p=2; p<=45; p++) t.push(600-5*(p-2));
  for(let p=46; p<=50; p++) t.push(355-5*(p-46));
  return t;
})();
function ccM23SeriesPts(place){ return (place>=1 && place<=CC_M23_SERIES.length) ? CC_M23_SERIES[place-1] : 0; }
function ccM23Spec(ev){ return ((ev.n===4) ? CC_M23.lcm : CC_M23)[ev.stage] || CC_M23.final; }
function ccM23Weeks(n){ return n===4 ? 1 : 3; }
function ccM23HasSurge(n){ return n===1 || n===2; }
function ccM23Top(n){ return ccM23HasSurge(n) ? CC_M23.seriesTop : CC_M23.field; }
function ccM23Of(n){
  const cr=CAREER && CAREER.career; if(!cr) return null;
  const m=cr.major23;
  return (m && m.n===n && m.season===cr.season) ? m : null;
}
function ccM23State(n){
  const cr=CAREER.career;
  let m=ccM23Of(n);
  if(!m) m=cr.major23={n:n, season:cr.season, got:{}, wk:{}, series:{}, seriesRows:{}, surgeTop:null, youKey:null};
  return m;
}
// День события по его id в календаре года (первый день строки).
// Десятка Surge: сначала до пяти победителей матчей (по месту в таблице), потом лучшие по очкам.
function ccM23SurgeTop(ranked){
  const up=[], seen=new Set();
  ranked.forEach(t=>{ if((t.wins||0)>0 && up.length<CC_M23.surge.vr){ seen.add(t); up.push(t); } });
  ranked.forEach(t=>{ if(up.length<CC_M23.surge.cut && !seen.has(t)){ seen.add(t); up.push(t); } });
  return up;
}
function ccM23Day(n, tail){
  const row=ccYearRows().find(r=>r[2]==='Major'+n+'_2023_'+tail);
  return row ? row[0] : null;
}
function ccM23SeriesRank(m, key){
  if(!m || !key) return 0;
  const keys=Object.keys(m.series).sort((a,b)=>m.series[b]-m.series[a]);
  const at=keys.indexOf(key);
  return at<0 ? 0 : at+1;
}
// Карточки своего состава — чтобы мир не посадил тебя же в чужую комнату.
function ccM23Mine(){
  const me=(typeof careerCard==='function') ? careerCard() : null;
  return me ? [me].concat(careerMates().filter(Boolean)) : [];
}
// Мир для молчаливых комнат: сцена от лица дивизиона 1, острота финала.
function ccM23World(size, salt){
  const cr=CAREER.career;
  return careerCupField(Object.assign({}, cr, {division:1}), ccM23Mine(), size, salt, false, CC_FIELD_SHARP.final);
}
/* Финал недели, досчитанный молча. Комната — вчерашний топ-50 недели, если он записан
   (игрок был, но вылетел), иначе топ-50 первого дня, иначе сцена. */
function ccM23SettleWeek(m, w){
  const wk=m.wk[w]=m.wk[w]||{};
  if(wk.f) return;
  const day=ccM23Day(m.n, 'W'+w+'F');
  if(!day || careerToday()<day) return;          // неделя ещё не сыграна
  const src=(wk.d2 && wk.d2.length) ? wk.d2 : (wk.d1 && wk.d1.length) ? wk.d1.slice(0, CC_M23.field) : null;
  let room=src ? src.filter(r=>r!=='you').map(ccMajorTeamFrom) : [];
  if(room.length<CC_M23.field){
    const seen=new Set(room.map(ccSeatKey));
    ccM23World(CC_M23.field+20, 'm23|'+m.n+'|'+w).forEach(t=>{
      if(room.length>=CC_M23.field || seen.has(ccSeatKey(t))) return;
      seen.add(ccSeatKey(t)); room.push(t);
    });
  }
  room=room.slice(0, CC_M23.field);
  room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
  ccWorldRun('m23wf|'+m.season+'|'+m.n+'|'+w, ()=>simulateGames(room, CC_M23.wf.games, ccM24Points, CC_M24_KILL));
  const ranked=ccM24Rank(room);
  if(m.n!==4) ranked.forEach((t,i)=>{ const k=ccSeatKey(t); m.series[k]=(m.series[k]||0)+ccM23SeriesPts(i+1); m.seriesRows[k]=ccMajorSeatRow(t); });
  wk.f=ranked.map(ccMajorSeatRow);
}
function ccM23SettleWeeks(m){ for(let w=1; w<=ccM23Weeks(m.n); w++) ccM23SettleWeek(m, w); }
// Серия по порядку: ключи и записи от первого места.
function ccM23SeriesOrder(m){
  return Object.keys(m.series).sort((a,b)=>m.series[b]-m.series[a]).map(k=>({key:k, row:m.seriesRows[k]}));
}
// Комната Surge Week: места серии 41–90 (игрок — если он вне топ-40).
function ccM23SurgeRows(m){
  ccM23SettleWeeks(m);
  const top=ccM23Top(m.n);
  return ccM23SeriesOrder(m).slice(top, top+CC_M23.field).map(x=>x.row);
}
// Surge Week, досчитанная молча.
function ccM23SettleSurge(m){
  if(m.surgeTop || !ccM23HasSurge(m.n)) return;
  const day=ccM23Day(m.n, 'Surge');
  if(!day || careerToday()<day) return;
  const room=ccM23SurgeRows(m).filter(r=>r!=='you').map(ccMajorTeamFrom);
  if(!room.length){ m.surgeTop=[]; return; }
  room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
  ccWorldRun('m23surge|'+m.season+'|'+m.n, ()=>simulateGames(room, CC_M23.surge.games, ccM24Points, CC_M24_KILL));
  m.surgeTop=ccM23SurgeTop(ccM24Rank(room)).map(ccMajorSeatRow);
}
/* Гранд-финал — пятьдесят: топ серии (40, у Мейджора 3 — 50) и топ-10 Surge Week;
   недобор — следующими по серии. */
function ccM23GfRows(m){
  if(!m) return null;
  ccM23SettleWeeks(m); ccM23SettleSurge(m);
  const out=[], seen=new Set();
  const key=r=>r==='you' ? 'you' : JSON.stringify(r);
  const add=r=>{ const k=key(r); if(!r || seen.has(k) || out.length>=CC_M23.field) return; seen.add(k); out.push(r); };
  const order=ccM23SeriesOrder(m);
  order.slice(0, ccM23Top(m.n)).forEach(x=>add(x.row));
  (m.surgeTop||[]).forEach(add);
  order.forEach(x=>add(x.row));
  return out;
}
// Билет в Гранд-финал. До дня финала — по текущему месту в серии (подсказка календарю).
function ccM23Ticket(m){
  if(!m || !m.youKey) return false;
  const fin=ccM23Day(m.n, 'Final');
  if(fin && careerToday()>=fin){ const rows=ccM23GfRows(m); return ccSeedHasMe(rows); }
  const k=ccM23SeriesRank(m, m.youKey);
  return k>0 && k<=ccM23Top(m.n);
}
// Финал для мира (без игрока): из записи, без неё — верх сцены.
function ccM23WorldFinalRoom(m, drafted, lobbyCr){
  const rows=m ? ccM23GfRows(m) : null;
  const room=(rows && rows.length>=10) ? rows.filter(r=>r!=='you').map(ccMajorTeamFrom) : [];
  if(room.length<CC_M23.field){
    const seen=new Set(room.map(ccSeatKey));
    careerCupField(lobbyCr, drafted, CC_M23.field+20, null, false, CC_FIELD_SHARP.final).forEach(t=>{
      if(room.length>=CC_M23.field || seen.has(ccSeatKey(t))) return;
      seen.add(ccSeatKey(t)); room.push(t);
    });
  }
  return room.slice(0, CC_M23.field);
}
// Квоты Копенгагена своего региона (участники Liquipedia по дорогам; NA West — в NAC).
function ccGc23Seats(route){
  let r=careerPrizeRegion(); if(r==='NAW') r='NAC';
  const t=GC2023_SEATS[route]||{};
  return t[r]!=null ? t[r] : 0;
}
function ccM23CanStage(ev, cr, gaveUp){
  const s=ccM23Of(ev.n);
  if(s && s.got[ev.id]) return false;
  const wk=s && s.wk[ev.w];
  if(ev.stage==='d1'){
    // Мейджор 1 — только Elite (дивизион 1), как токен EliteCupAccessS23 у Epic.
    if(ev.n===1 && !ccNoDivisions() && cr.division!==1) return false;
    // Last Chance Major — для тех, кто в Копенгаген ещё не едет.
    if(ev.n===4){ const seat=ccGlobalsSeat(); if(seat) return false; }
    return true;
  }
  if(ev.stage==='d2') return !!(wk && ccSeedHasMe(wk.d1));
  if(ev.stage==='wf') return !!(wk && ccSeedHasMe(wk.d2));
  if(ev.stage==='surge'){
    if(!s || !s.youKey) return false;
    ccM23SettleWeeks(s);
    const k=ccM23SeriesRank(s, s.youKey);
    return k===0 || k>ccM23Top(ev.n);
  }
  return !gaveUp && ccM23Ticket(s);
}
async function runCareerMajor2023(){
  const cr=CAREER.career;
  const ev=careerMajorOn(careerToday());
  if(!ev || !ev.y23 || !careerMajorCan(ev)) return;
  // Командный вечер ждёт напарника. См. ccMpGate.
  const mpStart=ccMpLock() ? await ccMpGate('major') : null;
  careerCampBonus('major', ev.id||ev.label||'');
  const me=careerCard(), mates=careerMates();
  if(!me || mates.length<careerMateSeats() || mates.some(function(m){ return !m; })) return;
  const mate=mates[0]||null;
  const prevMode=CARD_MODE, prevSize=squadSize, prevDrafted=drafted;
  CARD_MODE=true; squadSize=careerSquadSize(); drafted=[me].concat(mates);
  skipAnimation=false; CC_SKIP_RUN=false;
  resetRunRecord();
  document.getElementById('majorStages').innerHTML='';
  const rsPrev=document.getElementById('runSummary'); if(rsPrev) rsPrev.innerHTML='';
  document.getElementById('lobbyTitle').textContent='';
  document.getElementById('lobbyBody').innerHTML='';
  clearEventPanel();
  document.getElementById('finalBanner').style.display='none';
  clearLandingResultsMap();
  CAREER_RUN=true;
  show('screen-results');
  ensureSkipButton();

  const you=careerYouTeam(drafted);
  you.name=L().yourTeamPrefix+teamLabel(drafted); you.isYou=true;
  const m=ccM23State(ev.n);
  const rowsOf=rows=>ccStageRowsOf(rows, you);
  const seedOf=t=>ccSeedRow(t, you, ccMajorSeatRow);
  const spec=ccM23Spec(ev);
  const wk=(ev.w ? (m.wk[ev.w]=m.wk[ev.w]||{}) : null);
  const stageLabel=ev.label;
  const open=(ev.stage==='d1');
  let field;
  if(open){
    // Мейджор 1 — комната Elite (дивизион 1), остальные — вся лестница региона.
    const elite=(ev.n===1 && !ccNoDivisions());
    field=[you, ...careerCupField(elite ? Object.assign({}, cr, {division:1}) : cr, drafted,
      elite ? careerCupSize(1) : careerLadderEntrants(), 'm23|'+ev.n+'|'+ev.w, !elite, 0)];
  } else if(ev.stage==='d2') field=rowsOf(wk.d1);
  else if(ev.stage==='wf') field=rowsOf(wk.d2);
  else if(ev.stage==='surge'){ field=rowsOf(ccM23SurgeRows(m)); if(field.indexOf(you)<0) field.push(you); }
  else {
    field=rowsOf(ccM23GfRows(m));
    if(field.indexOf(you)<0) field.unshift(you);
    field=field.slice(0, CC_M23.field);
    if(field.indexOf(you)<0) field[field.length-1]=you;
  }
  CC_M24_GAME=0;
  const pS=ccPastMajorScore(ev);
  await simulateGamesLive(field, spec.games, pS ? pS.pts : ccM24Points, pS ? pS.kill : CC_M24_KILL, 'stage', 0, null, null,
    {lobbySize:ccTeams(50), stageName:stageLabel, mapReplay:true, choices:true, stopOnYourDeath:true,
     roomOnly:!open,
     dropEachGame:(g,room)=>{ CC_M24_GAME=g;
       return open ? null : careerLandingPick(room||field, you, stageLabel, ['major']); }});
  const ranked=ccM24Rank(field);
  const place=ranked.indexOf(you)+1;
  let through=false, note='';
  m.got[ev.id]=true;
  if(ev.stage==='d1' || ev.stage==='d2'){
    through=place<=spec.cut;
    wk[ev.stage]=ranked.slice(0, spec.cut).map(seedOf);
    note=through ? L().ccRelPass(spec.cut) : L().ccRelFail(spec.cut);
  } else if(ev.stage==='wf'){
    wk.f=ranked.map(seedOf);
    if(ev.n===4){
      const seats=ccGc23Seats('lcm');
      through=place<=seats;
      m.lcmPlace=place;
      note=L().ccYr23LcmSeat(seats);
    } else {
      ranked.forEach((t,i)=>{ const k=ccSeatKey(t); m.series[k]=(m.series[k]||0)+ccM23SeriesPts(i+1); m.seriesRows[k]=seedOf(t); });
      m.youKey=ccSeatKey(you);
      // Недели до этой, которые игрок пропустил, — в серию тоже.
      for(let w=1; w<ev.w; w++) ccM23SettleWeek(m, w);
      const k=ccM23SeriesRank(m, m.youKey), top=ccM23Top(ev.n);
      through=k>0 && k<=top;
      note=L().ccYr24Series(m.series[m.youKey]||0, k);
    }
  } else if(ev.stage==='surge'){
    const sTop=ccM23SurgeTop(ranked);
    m.surgeTop=sTop.map(seedOf);
    through=sTop.indexOf(you)>=0;
    note=through ? L().ccYr23SurgeWon : L().ccRelFail(spec.cut);
  }
  removeSkipButton();
  const fin=ev.stage==='final';
  const shell=createStageCardShell(stageLabel+' — '+field.length);
  await revealStageLog(you, shell, true);
  finalizeStageCard(shell, place, field.length, you.stagePts,
    ccStagePassed(through, spec, place, fin ? majorPrize : null), false,
    fin ? ccMajorSeatNote(ev) : note);
  await revealStandings(shell, ranked, you, spec.cut||0, null, null, fin ? majorPrize : null, null, fin);
  careerPrAdd(ranked, {div:cr.division, kind:'major', stage:fin ? 'final' : ev.stage});
  let cash=0;
  if(fin){
    careerMoneyAdd(ranked, majorPrize);
    cash=majorPrize(place);
    if(cash) ccPayIn(ccShareOf(cash, you));
    careerReachAdd(careerReachResult(place, field.length, 1, 'major'));
    careerNews(cash?'good':'flat', cash?'ccNewsMajCash':'ccNewsMajNoCash',
               cash?[ev.n, place, ccNum(cash)]:[ev.n, place, field.length],
               {tbl:ccStageShot(ranked, you, 1, stageLabel)});
    if(place>field.length/2) careerNews('bad', 'ccPostTriedBest', []);
    careerCongrats(ranked, you, L().ccCongratsMajor(ev.n));
    m.gf=ranked.map(seedOf);
    ccGcKeepFinal(ccCalYear(), ev.n, m.gf);
    cr.major={n:ev.n, got:'final', pass:'final', ticket:false};
  } else {
    careerNews(through?'good':'flat', through?'ccNewsMajThrough':'ccNewsMajOut',
               [ev.label, place, field.length], {tbl:ccStageShot(ranked, you, 1, stageLabel)});
    if(!through && spec.cut && place===spec.cut+1) careerNews('bad', 'ccPostOneOff', [ev.label]);
    const prev=(cr.major && cr.major.n===ev.n) ? cr.major : null;
    cr.major={n:ev.n, got:ev.stage, pass: through ? ev.stage : (prev ? prev.pass||null : null), ticket:false};
  }
  const places=(you.stageLog||[]).map(g=>g.place);
  cr.log=cr.log||[];
  careerGrowEvent(place, field.length, you, field);
  /* Финал Last Chance Major пишется как 'lcm': место в нижнюю сетку Копенгагена
     читается отсюда (ccGlobalsSeat). */
  const stageRec=fin ? 'final' : (ev.n===4 && ev.stage==='wf') ? 'lcm' : ev.stage;
  cr.log.push({season:cr.season, day:careerToday(), div:cr.division,
               place:place, of:field.length, pts:you.stagePts,
               passed: fin ? cash>0 : through,
               ovr:CAREER.player.ovr, games:spec.games, wins:you.wins||0,
               elims:you.stageElims||0,
               avg: places.length ? Math.round(places.reduce((s,v)=>s+v,0)/places.length*10)/10 : null,
               mate: mate ? mate.handle : null, mates: ccLogMates(mates), prize:ccShareOf(cash, you), kind:'major', stage:stageRec,
               won: fin ? ccStageSeatRow(ranked[0]) : undefined,
               top: fin ? ccStageTop(ranked, you) : undefined});
  await ccMpClose(ranked);
  careerAdvanceTo(ccAddDays(careerToday(), 1));
  if(ccOffersOpen(place, field.length)){
    CAREER.offers=careerOrgOffers();
    careerOrgOffersToDms();
    if(CAREER.offers && CAREER.offers.length) CAREER.offersDeclined=null;
  }
  careerSave();
  CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; CC_KILL_CAP=0;
  careerRenderHub('centre');
  const lanSeat=(fin || (ev.n===4 && ev.stage==='wf')) && ccGlobalsSeat() ? L().ccRelSeatGc(ccLanCity('globals')) : null;
  careerReloadResultCard({label:stageLabel, place:place, of:field.length,
    through: fin ? cash>0 : through, cut:spec.cut||0,
    note: fin ? null : note,
    seat: !!lanSeat, seatText: lanSeat, money: fin ? cash : null});
}

/* ---- Копенгаген 2023 -----------------------------------------------------------
   Royal Arena, 13–15 октября (Liquipedia): день 1 — верхняя сетка, 50 дуо с Мейджоров,
   пять игр, топ-25 в финал, остальные вниз; день 2 — нижняя: 25 упавших и 24 с Last
   Chance Major, пять игр, топ-25 в финал; день 3 — финал на 50, шесть игр.
   Залы — настоящие дуо по дорогам (GC2023_DUOS) карточками 2023-го; своё место
   вытесняет одно. Без игрока мир играет только финал (careerWorldFinals). */
/* Строка зала — ники: люди приезжают из всех регионов, и собрать их обратно по сцене
   своего региона (ccMajorTeamFrom) значило бы вернуть чужих игроков без рейтинга.
   ccLanTeam находит настоящую карточку года в любом регионе. */
function ccGc23Row(t){ return (t.squad||[]).map(c=>c && c.handle).filter(Boolean); }
function ccGc23Team(row){ return ccLanTeam(row, null, 85, null); }
const CC_GC23={upper:{games:5, cut:25}, lower:{games:5, cut:25}, final:{games:6, cut:0}, field:50};
function ccGc23Build(routes, rating, seated, limit){
  const out=[];
  routes.forEach(route=>(ccGcSimOn(()=>ccGcList('GC2023_DUOS.'+route, GC2023_DUOS[route]))||[]).forEach(d=>{
    if(out.length>=limit) return;
    const duo=d.length>=2 ? d : [d[0], d[0]];
    const t=ccLanTeam(duo.slice(0, 2), null, rating, seated);
    if(t){ t.gcRoute=route; out.push(t); }
  }));
  return out;
}
function ccGc23Fill(room, limit, seated){
  if(room.length>=limit) return room;
  const lanCr=Object.assign({}, CAREER.career, {division:1});
  careerCupField(lanCr, ccM23Mine(), 80, null, false, CC_FIELD_SHARP.lan).forEach(t=>{
    if(room.length>=limit) return;
    const keys=(t.squad||[]).map(c=>_gcNorm(c && c.handle));
    if(keys.some(k=>seated.has(k))) return;
    keys.forEach(k=>seated.add(k)); room.push(t);
  });
  return room;
}
// Мировой финал (без игрока) — пятьдесят дуо верхней сетки.
function buildGlobalChampionship2023Field(you){
  const seated=new Set();
  const own=you && !you._stub ? you : null;
  if(own) (own.squad||[]).forEach(p=>seated.add(_gcNorm(p.handle)));
  const room=ccGc23Fill(ccGc23Build(['m1','m2','m3'], 88, seated, CC_GC23.field-(own?1:0)), CC_GC23.field-(own?1:0), seated);
  if(own){ own.gcRoute='m3'; room.push(own); }
  return room;
}
function ccGc23State(){
  const cr=CAREER.career;
  if(!cr.gc23 || cr.gc23.season!==cr.season) cr.gc23={season:cr.season, finals:null, lower:null, lowerDone:false, you:null};
  return cr.gc23;
}
// Верхняя сетка без игрока (он пришёл через Last Chance Major): топ-25 — в финал, остальные вниз.
function ccGc23SettleUpper(st, you){
  if(st.lower) return;
  const seated=new Set(); ((you && you.squad)||[]).forEach(p=>seated.add(_gcNorm(p.handle)));
  const room=ccGc23Fill(ccGc23Build(['m1','m2','m3'], 88, seated, CC_GC23.field), CC_GC23.field, seated);
  room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
  ccWorldRun('gc23up|'+st.season, ()=>simulateGames(room, CC_GC23.upper.games, majorPoints, CC_GLOB_KILL));
  const ranked=ccM24Rank(room);
  st.finals=ranked.slice(0, CC_GC23.upper.cut).map(ccGc23Row);
  st.lower=ranked.slice(CC_GC23.upper.cut).map(ccGc23Row);
}
// Нижняя сетка без игрока (он уже в финале): её топ-25 дописываются в финал.
function ccGc23SettleLower(st, you){
  if(st.lowerDone) return;
  const seated=new Set(); ((you && you.squad)||[]).forEach(p=>seated.add(_gcNorm(p.handle)));
  (st.finals||[]).forEach(r=>{ if(r!=='you') r.forEach(h=>seated.add(_gcNorm(h))); });
  let room=(st.lower||[]).filter(r=>r!=='you').map(ccGc23Team);
  room.forEach(t=>(t.squad||[]).forEach(p=>seated.add(_gcNorm(p && p.handle))));
  room=room.concat(ccGc23Build(['lcm'], 84, seated, CC_GC23.field-room.length));
  room=ccGc23Fill(room, CC_GC23.field, seated);
  room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
  ccWorldRun('gc23low|'+st.season, ()=>simulateGames(room, CC_GC23.lower.games, majorPoints, CC_GLOB_KILL));
  st.finals=(st.finals||[]).concat(ccM24Rank(room).slice(0, CC_GC23.lower.cut).map(ccGc23Row));
  st.lowerDone=true;
}
async function runCareerGlobals2023(){
  const cr=CAREER.career;
  const ev=careerGlobalsOn(careerToday());
  if(!ev || !careerGlobalsCan(ev)) return;
  const mpStart=ccMpLock() ? await ccMpGate('globals') : null;
  const seat=ccGlobalsSeat();
  careerCampBonus('globals', ev.id||ev.label||'');
  careerLanArrive('globals', ev);
  const me=careerCard(), mates=careerMates();
  if(!me || mates.length<careerMateSeats() || mates.some(function(m){ return !m; })) return;
  const mate=mates[0]||null;
  const prevMode=CARD_MODE, prevSize=squadSize, prevDrafted=drafted;
  CARD_MODE=true; squadSize=careerSquadSize(); drafted=[me].concat(mates);
  useLandingSet(ACTIVE_LANDING_SET);
  skipAnimation=false; CC_SKIP_RUN=false;
  resetRunRecord();
  document.getElementById('majorStages').innerHTML='';
  const rsPrev=document.getElementById('runSummary'); if(rsPrev) rsPrev.innerHTML='';
  document.getElementById('lobbyTitle').textContent='';
  document.getElementById('lobbyBody').innerHTML='';
  clearEventPanel();
  document.getElementById('finalBanner').style.display='none';
  clearLandingResultsMap();
  CAREER_RUN=true;
  show('screen-results');
  ensureSkipButton();

  const you=careerYouTeam(drafted);
  you.name=L().yourTeamPrefix+teamLabel(drafted); you.isYou=true;
  const st=ccGc23State();
  const day=ccGc23DayOf(careerToday());          // 1 верхняя, 2 нижняя, 3 финал
  const seated=new Set(); (you.squad||[]).forEach(p=>seated.add(_gcNorm(p.handle)));
  const rowsOf=rows=>(rows||[]).map(r=>r==='you' ? you : ccGc23Team(r));
  const seedOf=t=>ccSeedRow(t, you, ccGc23Row);
  let field, spec;
  if(day===1){
    spec=CC_GC23.upper;
    field=ccGc23Build(['m1','m2','m3'], 88, seated, CC_GC23.field-1);
    field=ccGc23Fill(field, CC_GC23.field-1, seated);
    field.push(you);
  } else if(day===2){
    spec=CC_GC23.lower;
    // Пришёл через Last Chance Major — верхняя сетка вчера сыграна без него.
    ccGc23SettleUpper(st, you);
    // Упавшие из верхней (записаны вчера) и 24 с Last Chance Major.
    field=rowsOf(st.lower||[]);
    field.forEach(t=>(t.squad||[]).forEach(p=>seated.add(_gcNorm(p && p.handle))));
    const lcm=ccGc23Build(['lcm'], 84, seated, CC_GC23.field-field.length-(field.indexOf(you)<0 ? 1 : 0));
    field=field.concat(lcm);
    if(field.indexOf(you)<0) field.push(you);
    field=ccGc23Fill(field, CC_GC23.field, seated);
  } else {
    spec=CC_GC23.final;
    // Прошёл из верхней — нижняя вчера сыграна без него.
    ccGc23SettleLower(st, you);
    field=rowsOf(st.finals||[]);
    if(field.indexOf(you)<0) field.push(you);
    field=ccGc23Fill(field, CC_GC23.field, seated);
  }
  // Имя дня — сеткой, а не «сессией N»: у Копенгагена у каждого дня своё название.
  const row0=ccYearRows().find(r=>r[2]==='GlobalChampionship2023');
  const label=(row0 ? ccYearLabel(row0[2], row0[0], row0[0]) : ev.label)+' · '+L().ccYr23GcDay(day);
  await simulateGamesLive(field, spec.games, majorPoints, CC_GLOB_KILL, 'stage', 0, null, null,
    {twoDay:true, lobbySize:ccTeams(50), stageName:label, mapReplay:true, choices:true, stopOnYourDeath:true,
     dropEachGame:(g,room)=>careerLandingPick(room||field, you, label, ['summit','major','gclc'])});
  const ranked=field.slice().sort((a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || b.stageElims-a.stageElims);
  const place=ranked.indexOf(you)+1;
  removeSkipButton();
  let through=false, note='';
  if(day===1){
    through=place<=spec.cut;
    st.finals=ranked.slice(0, spec.cut).map(seedOf);
    st.lower=ranked.slice(spec.cut).map(seedOf);
    note=through ? L().ccYr23GcUp : L().ccYr23GcDown;
  } else if(day===2){
    through=place<=spec.cut;
    st.finals=(st.finals||[]).concat(ranked.slice(0, spec.cut).map(seedOf));
    st.lowerDone=true;
    note=through ? L().ccRelPass(spec.cut) : L().ccYr23GcOut;
  }
  const fin=(day===3);
  const shell=createStageCardShell(label+' — '+field.length);
  await revealStageLog(you, shell, true);
  finalizeStageCard(shell, place, field.length, you.stagePts, fin ? place===1 : through, false,
    fin ? (place===1 ? L().gcChampion : L().gcPlaceNote(place)) : note);
  await revealStandings(shell, ranked, you, spec.cut||0, null, null, fin ? gcPrize : null, null, fin);
  careerPrAdd(ranked, {div:1, kind:'globals'});
  let cash=0;
  if(fin){
    careerMoneyAdd(ranked, gcPrize);
    cash=gcPrize(place);
    if(cash) ccPayIn(ccShareOf(cash, you));
    careerReachAdd(careerReachResult(place, field.length, 1, 'globals'));
    if(place===1) careerNews('good', 'ccNewsGlobChamp', []);
    careerNews(cash?'good':'flat', cash?'ccNewsGlobCash':'ccNewsGlobNoCash',
               cash?[place, ccNum(cash)]:[place, field.length], {tbl:ccStageShot(ranked, you, 1, label)});
    careerNews('flat', 'ccPostThanks', [ev.label]);
    careerCongrats(ranked, you, L().ccCongratsGlobals(ccLanCityIn('globals')));
    cr.globals={place:place, of:field.length, via:seat?seat.via:null, cash:cash};
  } else if(!through && day===2){
    // Вылет из нижней сетки — место за финалом (51+), со своими призовыми.
    const out=CC_GC23.field+(place-spec.cut);
    cash=gcPrize(out);
    if(cash) ccPayIn(ccShareOf(cash, you));
    cr.globals={place:out, of:73, via:seat?seat.via:null, cash:cash};
  } else {
    careerNews(through?'good':'flat', through?'ccNewsMajThrough':'ccNewsMajOut', [label, place, field.length], {tbl:ccStageShot(ranked, you, 1, label)});
  }
  st.you=fin ? 'done' : through ? (day===1 ? 'final' : 'final') : (day===1 ? 'lower' : 'out');
  const places=(you.stageLog||[]).map(g=>g.place);
  cr.log=cr.log||[];
  careerGrowEvent(place, field.length, you, field);
  cr.log.push({season:cr.season, day:careerToday(), div:1, place:fin ? place : (cr.globals ? cr.globals.place : place), of:fin ? field.length : 73,
               pts:you.stagePts, passed: fin ? cash>0 : through, ovr:CAREER.player.ovr,
               games:spec.games, wins:you.wins||0, elims:you.stageElims||0,
               avg: places.length ? Math.round(places.reduce((s,v)=>s+v,0)/places.length*10)/10 : null,
               mate: mate ? mate.handle : null, mates: ccLogMates(mates), prize:ccShareOf(cash, you), kind:'globals',
               stage: fin ? 'final' : (day===1 ? 'upper' : 'lower'),
               won: fin ? ccStageSeatRow(ranked[0]) : undefined, top: fin ? ccStageTop(ranked, you) : undefined});
  careerMonthGoalCheck();
  await ccMpClose(ranked);
  careerAdvanceTo(ccAddDays(careerToday(), 1));
  careerSave();
  CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; CC_KILL_CAP=0;
  careerRenderHub('centre');
  careerTwoRoundResultCard({title:label, place:place, through: fin ? (place===1||cash>0) : through,
    wins:you.wins||0, cash:cash, cut:spec.cut||0});
}
// Какой это день Копенгагена (1–3) по календарю.
function ccGc23DayOf(iso){
  const row=ccYearRows().find(r=>r[2]==='GlobalChampionship2023');
  if(!row) return 3;
  return Math.min(3, Math.max(1, ccDaysBetween(row[0], iso)+1));
}
/* Можно ли играть сегодняшний день Копенгагена: день 1 — место с Мейджора; день 2 —
   упавший из верхней или место с Last Chance Major; день 3 — прошедший в финал. */
function ccGc23Can(){
  const cr=CAREER.career;
  const seat=ccGlobalsSeat(); if(!seat) return false;
  const st=(cr.gc23 && cr.gc23.season===cr.season) ? cr.gc23 : null;
  const day=ccGc23DayOf(careerToday());
  if(st && (st.you==='done' || st.you==='out')) return false;
  if(day===1) return seat.via==='major2' && !(st && st.you);
  if(day===2) return (seat.via==='lcm' && !(st && st.you)) || !!(st && st.you==='lower');
  return !!(st && st.you==='final');
}
async function runCareerMajor(){
  const cr=CAREER.career;
  const ev=careerMajorOn(careerToday());
  if(!ev || !careerMajorCan(ev)) return;
  // Командный вечер ждёт напарника. См. ccMpGate.
  const mpStart=ccMpLock() ? await ccMpGate('major') : null;
  // Read in the season's own unit: the fields and cuts below are written in
  // duos, and a trio Major seats the same players in a third fewer teams.
  // let, а не const: свой номер хита известен только после посева, а он в
  // одном регионе меняет и число игр, и отсечку. См. ccMajorHeat ниже.
  let st=ccScaleStage(ccMajorStageSpec(ev.stage, ev.n));
  // A month at the facility that covers this day is worth arriving ready.
  careerCampBonus('major', ev.id||ev.label||'');
  /* The squad this season is played in, not a duo.

     Every one of these nine runners took the player and one partner and set
     squadSize to two by hand. In a trios season that put a duo in a lobby of
     trios: his own row showed two names beside everybody else's three, the
     lobby was built to the duo count of fifty rather than thirty-three, and
     the labels underneath said duos all night. His report, 20 August.

     careerMates is the seats the season actually has. An incomplete squad does
     not enter at all, which is the rule the day panel already states. */
  const me=careerCard(), mates=careerMates();
  if(!me || mates.length<careerMateSeats() || mates.some(function(m){ return !m; })) return;
  // The first seat, which is what the result records and the feed lines below
  // have always meant by the partner. A trio names the rest through mates.
  const mate=mates[0]||null;

  const prevMode=CARD_MODE, prevSize=squadSize, prevDrafted=drafted;
  CARD_MODE=true; squadSize=careerSquadSize(); drafted=[me].concat(mates);
  // A duo lobby drops on the whole island. The grid is thinned for squads —
  // trimLandingZonesForMode keeps the biggest 52% of the boxes so a four-player
  // lobby is not a wall of rectangles — and it was baked in at page load, when
  // squadSize was still the squad default. Nothing rebuilt it, so every career
  // night was played on a map with seventeen of its thirty-six boxes missing.
  // Rebuilding with squadSize already 2 is what puts the island back.
  useLandingSet(ACTIVE_LANDING_SET);

  // A new event is watched again: the skip a player pressed last night was for
  // last night. CC_SKIP_RUN is what makes one press cover a whole tournament.
  skipAnimation=false; CC_SKIP_RUN=false;
  resetRunRecord();
  document.getElementById('majorStages').innerHTML='';
  const rsPrev=document.getElementById('runSummary'); if(rsPrev) rsPrev.innerHTML='';
  document.getElementById('lobbyTitle').textContent='';
  document.getElementById('lobbyBody').innerHTML='';
  clearEventPanel();
  document.getElementById('finalBanner').style.display='none';
  clearLandingResultsMap();
  CAREER_RUN=true;
  show('screen-results');
  ensureSkipButton();

  const you=careerYouTeam(drafted);
  you.name=L().yourTeamPrefix+teamLabel(drafted); you.isYou=true;
  // From the Heats on it is the top of Europe in the room whatever division the
  // player came from — the Last Chance is exactly the door that lets somebody
  // from Division 4 walk into it.
  const deep = ev.stage!=='playin' && ev.stage!=='lcq' && ev.stage!=='lclobby';
  const lobbyCr = deep ? Object.assign({}, cr, {division:1}) : cr;
  // And the Last Chance draws its field the way an open does: every rung of the
  // ladder weighted by how big that room really is, rather than the division the
  // player happens to stand on.
  // Хиты — пятьдесят из плей-ина, финал — пятьдесят из хитов. Раньше и то и
  // другое было одним ровным броском по дивизиону 1, отчего финал выходил ровно
  // такой же силы, как его собственная квалификация.
  const sharp = !deep ? 0
    : (ev.stage==='final' ? CC_FIELD_SHARP.final : CC_FIELD_SHARP.heats);
  /* Хиты — ОДИН из трёх, а не «все сильные разом».

     Жалоба игрока: «в первом хите, где играет человек, всегда
     все сильные и известные команды, не очень реалистично». Так и было: комната
     хитов бралась одним броском на пятьдесят, а careerCupField сажает
     записанные пары первыми — то есть весь верх Европы садился в тот
     единственный хит, который показывают.

     У Epic сто пятьдесят квалифицировавшихся делятся на три хита ЗМЕЙКОЙ по
     посеву: первый в первый хит, второй во второй, третий в третий, четвёртый
     снова в третий. Известные имена расходятся по трём комнатам, и в твоей их
     треть. Ровно это здесь и делается: поле строится на три хита, сортируется
     по силе, сеется seedHeats (та же функция, что у драфта), и играется тот
     хит, в который по своей силе попал сам игрок. */
  const heatsRoom = ev.stage==='heats';
  /* И на экране написано, КОТОРЫЙ из трёх хитов играется.

     Игрок уже после змейки: «всё равно в одном хите все самые
     сильные команды, нету распределения». Замер того же дня говорит обратное —
     из двадцати сильнейших команд поля в трёх хитах лежит 6/7/7, — но узнать
     это с экрана было неоткуда: комната называлась просто «хиты», и любые
     знакомые имена в ней читались как «все сильные собрались тут». Теперь
     карточка этапа говорит «Хит 2 из 3», как у Epic. */
  let heatNo=0;
  /* Соседние хиты — не декорация, их тоже играют. См. ниже, где они считаются:
     финал Мейджора обязан состоять из тех, кто прошёл СВОЙ хит, а не из посева
     по таблице Плей-Ина. Здесь они просто выносятся наружу, чтобы после своего
     вечера было что считать. */
  let otherHeats=null;
  const field = heatsRoom
    ? (()=>{
        /* Сеется финиш Плей-Ина, когда он записан, и сила — когда нет.
           См. ccMajorSeedRows: у Epic змейку раскладывает таблица, а не
           мощность состава, и порядок в записи — это и есть та таблица. */
        const rows=ccMajorSeedRows(ev);
        /* СВОЯ КОМАНДА В ПОСЕВ ХИТОВ НЕ ИДЁТ — В ГОНКЕ.

           Когда таблицы Плей-Ина нет (её пишет только прошедший), поле сеется броском и
           сортируется по силе. Своя команда, вставленная по своей силе, сдвигает вниз
           всех, кто слабее, — а змейка раскладывает сдвинутых по другим хитам. Двое
           получали почти одинаковые, но не одинаковые лобби: прогон 11 сентября,
           17 апреля — «diff 1 of 50» после того, как номер хита уже сошёлся.
           Пул без себя сортируется у всех одинаково, а своё место в хите — последнее,
           тем же правилом, что в Reload (см. ccStageRoom). Соперника досадит
           ccRaceFieldSync, как и всегда. */
        // careerCupField отдаёт поле без своего места (N−1); в гонке себя в посев не кладут — одна команда сверху,
        // иначе один из трёх хитов садился на 49 (замер 7.10: 20 из 60 хитов).
        const pool=careerCupField(lobbyCr, drafted, st.field*ccMajorHeats()+(ccRaceLock() ? 1 : 0), null, false, sharp);
        const seeded = rows
          ? rows.map(r=>r==='you' ? you : ccMajorTeamFrom(r))
          : (ccRaceLock() ? pool.slice() : [you, ...pool]).sort((a,b)=>(b.pow||0)-(a.pow||0));
        const heats=seedHeats(seeded, ccMajorHeats());
        const rAt=ccRaceHeatTogether(heats, you);   // гонка: один хит на комнату
        const at=rAt>=0 ? rAt : heats.findIndex(h=>h.indexOf(you)>=0);
        heatNo=(at<0 ? 0 : at)+1;
        const mine=heats[at<0 ? 0 : at];
        if(mine.indexOf(you)<0) mine[mine.length-1]=you;
        otherHeats=heats.filter(h=>h!==mine);
        // Комната ровно того размера, каким её описывает этап: змейка делит
        // поле нацело, но своя строка уже внутри — добирать не из чего.
        return mine.slice(0, st.field);
      })()
    : ev.stage==='final'
      // Финал садится из таблицы Плей-Ина, а не из свежего броска. См.
      // ccMajorFinalRoom — пары внутри турнира не пересобираются.
      ? ccMajorFinalRoom(you, lobbyCr, drafted, ev, st, sharp)
      : ev.stage==='lclobby'
      ? ccMajorLcRoom(you, ev)
      // В Ласт Ченсе поле строится без тех, у кого место в финале уже есть.
      // См. ccMajorSeatedHandles.
      : [you, ...careerCupField(lobbyCr,
                                ev.stage==='lcq' ? drafted.concat(ccMajorSeatedHandles(ev)) : drafted,
                                st.field, null, ev.stage==='lcq', sharp)];

  /* И теперь, когда номер хита известен, этап отвечает за СВОЙ хит.

     В глубоком регионе это ничего не меняет — все три одинаковые. В Мейджоре 1
     у Океании, Азии и Ближнего Востока второй хит шёл шесть игр вместо пяти и
     пускал двадцать четыре вместо двадцати трёх: попал игрок в него — вечер у
     него на игру длиннее. Поле у всех хитов одно и то же, поэтому пересчитывать
     нужно только эти два числа, и отсечку — в командах сезона (ccTeams), как
     это делает ccScaleStage. */
  if(heatsRoom && heatNo){
    const h=ccMajorHeat(ev.n, heatNo);
    st=Object.assign({}, st, {games:h.games, cut:h.raw ? h.cut : ccTeams(h.cut)});
  }

  /* Дроп выбирается в финале и в хитах — отзыв: «пусть не
     надо ставит метку в плейин и опенах ласт ченса, ток в финалах» и следом
     «в хитах тоже можно, там 100 людей в лобби». Правило — комната в одно
     лобби на сто человек (в трио девяносто девять): хит и финал живут весь
     вечер одной комнатой, и точка на острове там своя. Пикер на всех этапах
     прожил один вечер: Ласт Ченс открыт всему ладдеру и нарисовал две с
     половиной тысячи меток, Плей-Ин — свои двести; открытые этапы получают
     дроп раздачей, как получали. */
  /* Точка выбирается на всём Мейджоре, кроме открытого Ласт Ченса: тот один
     открыт всему ладдеру и рисовал две с половиной тысячи меток — скриншот. Правка: «нельзя только в опенах выбирать» —
     Плей-Ин на двести команд теперь тоже выбирает. */
  const zones=null;
  /* A Victory Royale in the Heats ends that team's night.

     It is the stage's own rule — a won game is the ticket — and the draft mode
     has always passed stopOnWin for it. The career runner never did, so a duo
     that had already qualified kept being seated in the next game and could win
     it again: Focus & Th0masHD, 17 August, two wins in five games with the
     qualification bonus counted twice — 2132 points against 212 for a duo that
     won nothing, and every row reading five matches where the ones who came
     through should have played fewer. The size of the bonus is not the problem;
     it is what makes a win a ticket rather than something grindable. Taking it
     twice is. */
  // Название комнаты — с номером хита, когда хит один из трёх.
  const stageLabel = heatNo ? ev.label+' · '+L().ccHeatOf(heatNo, ccMajorHeats()) : ev.label;
  await simulateGamesLive(field, st.games, st.pts, st.kill, 'stage', 0, null, zones,
    {twoDay:ev.stage==='final', lobbySize:ccTeams(50), stageName:stageLabel, mapReplay:true, choices:true, stopOnYourDeath:true,
     stopOnWin: ev.stage==='heats' || ev.stage==='lclobby', roomOnly: ev.stage==='lclobby',
     // Каждую игру, а не раз за этап — правка. LCQ идёт одним
     // общим полем и точку не выбирает вовсе, поэтому и вопроса там нет.
     dropEachGame:(g,room)=>ev.stage==='lcq' ? null : careerLandingPick(room||field, you, stageLabel, ['major'])});
  const ranked=field.slice().sort((a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || b.stageElims-a.stageElims);
  const place=ranked.indexOf(you)+1;
  let through = st.cut ? place<=st.cut : false;
  // A Victory Royale in the Heats is a ticket on its own — that is what the 944
  // is for, and a team that won a game is already above the cut anyway. Said out
  // loud so the rule does not depend on the arithmetic.
  if((ev.stage==='heats' || ev.stage==='lclobby') && (you.wins||0)>0) through=true;
  removeSkipButton();

  const shell=createStageCardShell(stageLabel+' — '+field.length);
  await revealStageLog(you, shell, true);
  /* Финал Мейджора отсечки не имеет, и потому его карточка молчала о том,
     ради чего он играется. Игрок: «не пишет, сколько квал на
     лан» и «не пишет, сколько нужно квал для самита» — обе строки про одно и
     то же место на карточке. Теперь на нём написано, сколько мест даёт ЭТОТ
     финал: Мейджор 1 — Саммит и Второй шанс, Мейджор 2 — Global Championship,
     всё по своему региону (ccGcSlots) и по размеру состава (ccTeams). */
  finalizeStageCard(shell, place, field.length, you.stagePts,
    ccStagePassed(through, st, place, ev.stage==='final' ? majorPrize : null), false,
    st.cut ? (through ? L().ccRelPass(st.cut) : L().ccRelFail(st.cut))
           : (ev.stage==='final' ? ccMajorSeatNote(ev) : ''));
  /* У финала отсечки нет — ||10 рисовал на нём красную «топ-10 проходят» и
     тушил всех ниже, хотя проходить из финала некуда. Игрок:
     «линия в див капе пропала, а на фнкс осталась». Призовая колонка остаётся. */
  await revealStandings(shell, ranked, you, st.cut, null, null,
    ev.stage==='final' ? majorPrize : null, null, ev.stage==='final');
  careerPrAdd(ranked, {div:CAREER.career.division, kind:'major', stage:ev.stage});

  // The Last Chance Lobby: the fifty who came through, four matches, and only a
  // win is worth anything.
  let ticket=false, lobbyPlace=null, lcLobby=null, lcSeats=0;
  /* 2025: Ласт Ченс Мейджора и раунд 1 FNCS Showdown проходят местом (топ-33), без лобби «только
     победа» из 2026-го. Showdown попадал в то лобби, и без победы в нём раунд 2 не открывался;
     LCQ Мейджора писал «не прошёл» по пустому билету (аудит 29.09). */
  const lcByPlace=ev.stage==='lcq' && ccIs2025();
  // Гонка: лобби Ласт Ченса общее, только если ВСЯ комната прошла открытый этап (как у Victory Cup и Evaluation).
  if(ev.stage==='lcq' && typeof ccRaceLock==='function' && ccRaceLock()){
    const top=ranked.slice(0, ccTeams(CAREER_CUP_CUT));
    const rivalOut=ccRaceNightRoom().some(p=>!top.some(t=>t.mpTag===':'+hKey(p.card)));
    if(!through || rivalOut) ccRaceNightApart();
  }
  /* 2025: прошедшие LCQ записываются, лобби — завтра, своим днём (careerMajorOn:
     Major<n>_2025_LCLobby). Комната лобби — ровно те, кто прошёл. */
  if(ev.stage==='lcq' && through && ccMajLc2025(ev)){
    cr.majorLc={n:ev.n, season:cr.season, rows:ranked.slice(0, st.cut).map(t=>ccSeedRow(t, you, ccMajorSeatRow))};
  }
  if(ev.stage==='lcq' && through && !lcByPlace){
    const lobby=ranked.slice(0, ccTeams(CAREER_CUP_CUT));
    ensureSkipButton();
    // Лобби Ласт Ченса — одна комната из пятидесяти, и точка в ней выбирается,
    // как в любой закрытой комнате.
    const lobbyZones=null;
    /* Выиграл — уехал. Победа здесь и ЕСТЬ билет (ticket ниже читает ровно
       её), а комната играла все четыре игры целиком, и один и тот же состав
       успевал взять две победы на место, которое даётся за одну.

       Отзыв: «кто катку в ласт ченс выиграл не мог играть
       дальше, потому что у них по 2 победы, хотя в игре такого быть не может».
       Правило у этапа уже было записано словами — «only a win is worth
       anything», — просто некому было снять победителя со стула. Тот же
       stopOnWin, что стоит на хитах. */
    const lcPts=ccLcByPoints(ev);
    lcLobby=lobby;
    await simulateGamesLive(lobby, CC_MAJOR_LC_LOBBY_GAMES, lcPts ? majorPoints : victoryR2Points, lcPts ? st.kill : 0,
      'stage', 0, null, lobbyZones,
      {lobbySize:ccTeams(50), stageName:L().ccMajLobby, mapReplay:true, choices:true, stopOnYourDeath:true,
       stopOnWin:!lcPts, roomOnly:true,
       dropEachGame:(g,room)=>careerLandingPick(room||lobby, you, L().ccMajLobby, ['major'])});
    removeSkipButton();
    /* И таблица читается победами, а не очками. Победитель уходит после своей
       игры и очков больше не набирает: по очкам он оказывался ниже тех, кто
       четыре раза приехал вторым и не взял ничего. В комнате, где считается
       только победа, порядок — победы, потом очки. */
    const lr=ccLcLobbySort(lobby, ev);
    lobbyPlace=lr.indexOf(you)+1;
    lcSeats=lcPts ? ccLcLobbySeats(ev, 1) : 0;
    ticket=lcPts ? lobbyPlace<=lcSeats : (you.wins||0)>0;
    const sh2=createStageCardShell(L().ccMajLobby+' — '+lobby.length);
    await revealStageLog(you, sh2, true);
    // По очкам — строка про топ-5, не «ни одной победы»: победа там ничего не решает.
    finalizeStageCard(sh2, lobbyPlace, lobby.length, you.stagePts, ticket, false,
      lcPts ? (ticket ? L().ccRelPass(lcSeats) : L().ccRelFail(lcSeats))
            : (ticket ? L().ccMajTicket : L().ccMajNoTicket));
    await revealStandings(sh2, lr, you, lcPts ? lcSeats : 0);
  }

  let cash=0;
  if(ev.stage==='final'){
    careerMoneyAdd(ranked, majorPrize);
    cash=majorPrize(place);
    if(cash){
      const mine=ccShareOf(cash, you);
      ccPayIn(mine);
    }
    careerReachAdd(careerReachResult(place, field.length, 1, 'major'));
    careerNews(cash?'good':'flat', cash?'ccNewsMajCash':'ccNewsMajNoCash',
               cash?[ev.n, place, ccNum(cash)]:[ev.n, place, field.length],
               {tbl:ccStageShot(ranked, you, 1, stageLabel)});
    /* И короткая строка о том, как это было, когда финал не удался. Так и
       пишут: «tried our best / wasn't enough / gg :/» (@MrSavage, 2 августа,
       8,5 тысячи лайков). Ниже середины поля — значит вечер не получился. */
    if(place>field.length/2) careerNews('bad', 'ccPostTriedBest', []);
    careerCongrats(ranked, you, L().ccCongratsMajor(ev.n));
    if(typeof ccIs2025==='function' && ccIs2025() && !ccMajorIsShowdown(ev.n)) ccGcKeepFinal(2025, ev.n, ranked.map(t=>ccSeedRow(t, you, ccMajorSeatRow)));
    else if(ccCalYear()===2026 && ev.n===2) ccGcKeepFinal(2026, 2, ranked.map(t=>ccSeedRow(t, you, ccMajorSeatRow)));
    cr.major={n:ev.n, got:'final', pass:'final', ticket:false};
  } else {
    const won = (ev.stage==='lcq' && !lcByPlace) ? ticket : through;
    /* Two different facts, and they were one field.

       His screenshot, 17 August: a Division 4 career told it was holding a slot
       at Major 2. It was not. The only Major stage a Division 4 player can enter
       is the Last Chance, he entered it and went out, and this wrote got:'lcq' -
       because got is the last stage played. Everything downstream read it as the
       last stage cleared, so playing a tournament and losing it counted as a
       place in that tournament.

       got is what stops a stage being played twice. pass is what a place in a
       Major actually is, and only a stage you came through writes it. */
    /* И Плей-Ин оставляет после себя таблицу, по которой сеются Хиты.

       Пишется в порядке финиша и только когда прошёл: не прошёл — хитов
       и не будет. Своя строка отмечена словом, а не составом: к среде состав
       может быть уже другим, а место в таблице от этого не меняется. */
    if(ev.stage==='playin' && through)
      cr.majorSeed={n:ev.n, season:cr.season, size:careerSquadSize(),
                    rows:ranked.slice(0, st.cut).map(t=>ccSeedRow(t, you, ccMajorSeatRow))};
    /* А Хиты оставляют после себя тех, кто из комнаты игрока прошёл.

       Их места в финале не обсуждаются: игрок видел, как они их выиграли, и
       увидит их там же. Победа в игре — тоже билет (heatQualifiers), поэтому
       список читается по тому же правилу, а не по одной отсечке. Остальные
       сорок мест финал добирает сам — из той же таблицы Плей-Ина. */
    if(ev.stage==='heats' && cr.majorSeed && cr.majorSeed.n===ev.n &&
       cr.majorSeed.season===cr.season){
      const q=heatQualifiers(field, st.cut, winIsATicket());
      const rows=ranked.filter(t=>q.has(t))
                       .map(t=>ccSeedRow(t, you, ccMajorSeatRow));
      /* Свой хит записан, соседние играются в свои дни, см. ccMajorWorldHeats.
         Хиты в календаре занимают три дня, по одному на хит, как у Epic. Считать все
         соседние сразу после своего вечера дорого: вечер рос с 38 до 61 с
         (tools/major-heats-sim-probe.js), а модель ради скорости менять нельзя, весь
         этап должен идти одной моделью. По дням это один хит на вечер. */
      /* Дописывает, а не перезаписывает. Блок хитов идёт три дня, мир играет соседние дни сам (ccMajorWorldHeats
         дописывает: `(s.through||[]).concat`). С `through=rows` вечер игрока стирал прошедших раньше,
         ccMajorSeatedHandles пускал их в Ласт Чанс, а финал добирался посевом.
         Дописывание идемпотентно (уже лежащая строка второй раз не ложится), перемотка через тот же день не задваивает.
         */
      ccMajorSeedThrough(cr, rows, heatNo||0);
    }
    /* Ласт Ченс, отыгранный САМИМ игроком, тоже оставляет своих прошедших.

       Мир играет этот день только когда игроку там делать нечего
       (ccMajorWorldLcq). Если билета нет, Ласт Ченс идёт своими руками — и без
       этой ветки его результат пропадал бы, а последние места финала опять
       добирались посевом. Берётся столько же, сколько взял бы мир: сколько
       зала осталось незанятым после хитов. */
    if(((ev.stage==='lcq' && (!ccMajLc2025(ev) || !through)) || ev.stage==='lclobby') && cr.majorSeed && cr.majorSeed.n===ev.n &&
       cr.majorSeed.season===cr.season && !cr.majorSeed.lcq){
      const fin=ccScaleStage(ccMajorStageSpec('final', ev.n));
      const need=Math.max(0, fin.field-((cr.majorSeed.through||[]).length));
      // Места — из лобби: сыгранного (своего), а без тебя в нём — досчитанного тем же правилом.
      let lobT=ev.stage==='lclobby' ? ranked.slice() : lcLobby;
      if(!lobT){ lobT=ranked.slice(0, ccIs2025() ? st.cut : ccTeams(CAREER_CUP_CUT)).filter(t=>t!==you); ccLcLobbySim(lobT, ev, st.kill); }
      const add=ccLcLobbyPick(lobT, ccLcLobbySeats(ev, need), ev).map(t=>ccSeedRow(t, you, ccMajorSeatRow));
      cr.majorSeed.through=(cr.majorSeed.through||[]).concat(add);
      cr.majorSeed.lcq=add;
    }
    /* Финал Мейджора 2 раздаёт места на Глобалы — своему региону.

       Отзыв: «а глобалы все, мейджоры наверное можно добирать
       с регионов, это слишком долго всё делать». Так и сделано: чужие регионы
       по-прежнему читаются с их лидербордов (их Мейджоры нигде не играются, и
       симулировать семь параллельных сезонов — это не правка), а СВОЙ регион
       ты играешь сам, и его девять мест теперь достаются тем, кто их выиграл.

       Лежит отдельным ключом, а не в majorSeed: тот перезаписывается каждым
       новым Мейджором, а до Антверпена ещё полсезона. */
    if(ev.stage==='final' && ev.n===2){
      const slots=ccTeams(MAJOR2_GC_SLOTS[ccCareerRegion()]||0);
      if(slots) cr.gcSeed={season:cr.season, size:careerSquadSize(),
                           reg:ccCareerRegion(),
                           m2:ranked.slice(0, slots)
                                    .map(t=>ccSeedRow(t, you, ccMajorSeatRow))};
    }
    const prev=(cr.major && cr.major.n===ev.n) ? cr.major : null;
    cr.major={n:ev.n, got:ev.stage,
              pass: won ? ev.stage : (prev ? prev.pass||null : null),
              ticket: won && (ev.stage==='heats' || ev.stage==='lclobby' || (ev.stage==='lcq' && !ccMajLc2025(ev)))
                      ? true : !!(prev && prev.ticket)};
    careerNews(won?'good':'flat', won?'ccNewsMajThrough':'ccNewsMajOut',
               [ev.label, place, field.length],
               {tbl:ccStageShot(ranked, you, 1, stageLabel)});
    // «qual grands, land X» — свой пост и посты прошедших из комнаты. См. ccGrandsCalls.
    if(ev.stage==='heats') ccGrandsCalls('grands', you, won, [...heatQualifiers(field, st.cut, winIsATicket())]);
    /* «Одного места не хватило» — отдельная строка, и говорит её сам игрок.

       Снято с живой ленты (@MrSavage, 31 августа: «i was one spot off globals
       im depressed»): промах на одно место — это не то же самое, что не пройти,
       и в жизни про него пишут отдельно. Числа для этого у вечера уже есть:
       место и отсечка. */
    if(!won && st.cut && place===st.cut+1) careerNews('bad', 'ccPostOneOff', [ev.label]);
  }

  const places=(you.stageLog||[]).map(g=>g.place);
  cr.log=cr.log||[];
  // The night is played, so the night teaches. See careerGrowEvent.
  careerGrowEvent(lobbyPlace||place, field.length, you, field);
  cr.log.push({season:cr.season, day:careerToday(), div:cr.division,
               place:lobbyPlace||place, of:field.length, pts:you.stagePts,
               passed: (ev.stage==='lcq' && !lcByPlace) ? ticket : (ev.stage==='final' ? cash>0 : through),
               ovr:CAREER.player.ovr, games:st.games, wins:you.wins||0,
               elims:you.stageElims||0,
               avg: places.length ? Math.round(places.reduce((s,v)=>s+v,0)/places.length*10)/10 : null,
               mate: mate ? mate.handle : null, mates: ccLogMates(mates), prize:ccShareOf(cash, you), kind:'major', stage:ev.stage,
               won: ev.stage==='final' ? ccStageSeatRow(ranked[0]) : undefined,
               top: ev.stage==='final' ? ccStageTop(ranked, you) : undefined});
  // Командный вечер закрывает сервер: он же двигает день. См. ccMpClose.
  await ccMpClose(ranked);
  careerAdvanceTo(ccAddDays(careerToday(), 1));
  careerSave();

  CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; CC_KILL_CAP=0;
  careerRenderHub('centre');
  /* The other door into a LAN, and it was as quiet as the Last Chance was.

     A Major Final is where the seats are handed out — Major 1's for the Summit,
     Major 2's for Antwerp — and this card said nothing about either, because
     `seat` was written for the stages that carry a ticket and switched itself
     off for the Final. A player finished ninth, was paid, was shown a green card
     that talked about money, and found out whether they were going by pressing
     Play on a day two months later. Read off the same two functions the calendar
     reads, so the card cannot say one thing and the calendar another. */
  const lanSeat = ev.stage==='final'
    ? (ev.n===2 ? ((ccGlobalsSeat()||{}).via==='major2' ? L().ccRelSeatGc(ccLanCity('globals')) : null)
                : (ccSummitSeat()==='main' ? L().ccRelSeatLan : null))
    : null;
  /* Место — из лобби, значит и строка про лобби: «топ-2 · мимо топ-50» (Notion 25.10) мешал место в лобби с
     отсечкой LCQ. */
  careerReloadResultCard({label:ev.label, place:lobbyPlace||place, of:field.length,
    through: (ev.stage==='lcq' && !lcByPlace) ? ticket : (ev.stage==='final' ? cash>0 : through),
    cut:st.cut||CAREER_CUP_CUT,
    note: lobbyPlace ? (lcSeats ? (ticket ? L().ccRelPass(lcSeats) : L().ccRelFail(lcSeats))
                                : (ticket ? L().ccMajTicket : L().ccMajNoTicket)) : null,
    /* 16.09, тестер: «после квала на какой-то турнир всегда пишет "место на
       Esports World Cup"». Хиты и LCQ ставили seat без текста, а запасной текст
       карточки — про Reload. Билет в следующую стадию карточка и так называет
       строкой «Топ-N — проход дальше»; строка места — только когда место есть. */
    seat: !!lanSeat,
    seatText: lanSeat,
    money: ev.stage==='final' ? cash : null});
}

/* Кто прошёл неделю — по именам, одной строкой.

   Тот же ключ, которым ccRelPack подписывает строку таблицы, и по той же
   причине: писать команды целиком стоило 315 КБ на понедельник и убивало сейв.
   Своя строка не пишется — своё место в финале и так есть, отдельным билетом. */
function ccWfCutKeys(ranked){
  return (ranked||[]).slice(0, ccTeams(CAREER_CUP_CUT))
    .filter(t=>t && !t.isYou)
    .map(t=>ccRelKey(t).split(';').join(','))
    .filter(Boolean).join(';');
}
/* Комната в субботу — это те, кто прошёл, а не свежая горсть из пула.

   Поле кубка воспроизводимо: тот же сезон, та же неделя, тот же дивизион —
   тот же бросок и те же дуо. Поэтому здесь оно собирается заново целиком и из
   него оставляются строки, которые записал ccWfCutKeys. Кого список не назвал
   (старый сейв, где списка ещё нет), добирается из того же поля по порядку —
   ровно то, что финал делал всегда, но теперь как запасной путь, а не как
   основной. */
function careerWeeklyFinalField(cr, drafted){
  const want=ccTeams(CAREER_CUP_CUT)-1;
  const keys=String((cr.wf && cr.wf.cut) || '').split(';').filter(Boolean);
  if(!keys.length) return careerCupField(cr, drafted, ccTeams(CAREER_CUP_CUT));
  const cup=careerCupField(cr, drafted, careerCupSize(cr.division), ccCupWeekSalt());
  const byKey=new Map();
  cup.forEach(t=>{ const k=ccRelKey(t).split(';').join(','); if(!byKey.has(k)) byKey.set(k, t); });
  const out=[], taken=new Set();
  keys.forEach(k=>{
    if(out.length>=want || taken.has(k)) return;
    const t=byKey.get(k);
    if(t){ taken.add(k); out.push(t); }
  });
  // Недобор — тем же порядком, каким кубок сажал их в лобби.
  for(let i=0;i<cup.length && out.length<want;i++){
    const k=ccRelKey(cup[i]).split(';').join(',');
    if(taken.has(k)) continue;
    taken.add(k); out.push(cup[i]);
  }
  return out;
}
async function runCareerWeeklyFinal(){
  const cr=CAREER.career;
  if(!careerWeeklyFinalOn(careerToday())) return;
  // Командный вечер ждёт напарника. См. ccMpGate.
  const mpStart=ccMpLock() ? await ccMpGate('final') : null;
  /* The squad this season is played in, not a duo.

     Every one of these nine runners took the player and one partner and set
     squadSize to two by hand. In a trios season that put a duo in a lobby of
     trios: his own row showed two names beside everybody else's three, the
     lobby was built to the duo count of fifty rather than thirty-three, and
     the labels underneath said duos all night. His report, 20 August.

     careerMates is the seats the season actually has. An incomplete squad does
     not enter at all, which is the rule the day panel already states. */
  const me=careerCard(), mates=careerMates();
  if(!me || mates.length<careerMateSeats() || mates.some(function(m){ return !m; })) return;
  // The first seat, which is what the result records and the feed lines below
  // have always meant by the partner. A trio names the rest through mates.
  const mate=mates[0]||null;

  const prevMode=CARD_MODE, prevSize=squadSize, prevDrafted=drafted;
  CARD_MODE=true; squadSize=careerSquadSize(); drafted=[me].concat(mates);
  // A duo lobby drops on the whole island. The grid is thinned for squads —
  // trimLandingZonesForMode keeps the biggest 52% of the boxes so a four-player
  // lobby is not a wall of rectangles — and it was baked in at page load, when
  // squadSize was still the squad default. Nothing rebuilt it, so every career
  // night was played on a map with seventeen of its thirty-six boxes missing.
  // Rebuilding with squadSize already 2 is what puts the island back.
  useLandingSet(ACTIVE_LANDING_SET);

  // A new event is watched again: the skip a player pressed last night was for
  // last night. CC_SKIP_RUN is what makes one press cover a whole tournament.
  skipAnimation=false; CC_SKIP_RUN=false;
  resetRunRecord();
  document.getElementById('majorStages').innerHTML='';
  const rsPrev=document.getElementById('runSummary'); if(rsPrev) rsPrev.innerHTML='';
  document.getElementById('lobbyTitle').textContent='';
  document.getElementById('lobbyBody').innerHTML='';
  clearEventPanel();
  document.getElementById('finalBanner').style.display='none';
  clearLandingResultsMap();
  CAREER_RUN=true;
  show('screen-results');
  ensureSkipButton();

  const you=careerYouTeam(drafted);
  you.name=L().yourTeamPrefix+teamLabel(drafted); you.isYou=true;
  if(CC_AWAY) you.pow=Math.max(1, Math.round(you.pow-CC_AWAY.pen));   // чужой сервер: пинг (ccAwayPen)
  // The fifty who came through the week, which in Division 1 is the roster's own
  // duos — careerCupField already seats them there.
  const field=[you, ...careerWeeklyFinalField(cr, drafted)];

  const kindsForDrop=['cup'];
  const zones=null;
  await simulateGamesLive(field, CC_WF_GAMES, wfPoints, CC_WF_KILL, 'stage', 0, null, zones,
    {lobbySize:ccTeams(50), stageName:L().calWeeklyFinal, mapReplay:true, choices:true, stopOnYourDeath:true,
     dropEachGame:(g,room)=>careerLandingPick(room||field, you, L().calWeeklyFinal, kindsForDrop)});
  const ranked=field.slice().sort((a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || b.stageElims-a.stageElims);
  const place=ranked.indexOf(you)+1;
  const cash=wfPrize(place);
  removeSkipButton();

  const shell=createStageCardShell(L().calWeeklyFinal+' — '+field.length);
  await revealStageLog(you, shell, true);
  finalizeStageCard(shell, place, field.length, you.stagePts, cash>0, false,
    cash ? L().ccWfCash(ccNum(cash)) : L().ccWfNoCash);
  // Из Финала недели никуда не проходят — это вечер денег, а не отсечки, и
  // «линия отсечки: топ-10 проходят» над ним врала. Скрин игрока,
  // 21 августа. Призовая колонка (wfPrize) остаётся.
  await revealStandings(shell, ranked, you, 0, null, null, wfPrize, false, true);
  careerPrAdd(ranked, {div:1, kind:'final'});

  if(cash){
    const mine=ccShareOf(cash, you);
    ccPayIn(mine);
  }
  // Выезд: таблица сезона и деньги сцены — домашние, чужой финал их не пишет (ccAwayPlay).
  if(!CC_AWAY){ careerTableAdd(ranked); careerMoneyAdd(ranked, wfPrize); }
  careerReachAdd(careerReachResult(place, field.length, 1, 'final'));
  careerNews(cash?'good':'flat', cash?'ccNewsWfCash':'ccNewsWfNoCash',
             cash?[place, ccNum(cash)]:[place, field.length],
             {tbl:ccStageShot(ranked, you, 1, L().calWeeklyFinal)});
  if(!CC_AWAY){ careerCongrats(ranked, you, L().calWeeklyFinal); careerD1TablePost(); }
  // The seat is spent whether or not it went well.
  delete cr.wf;

  const places=(you.stageLog||[]).map(g=>g.place);
  cr.log=cr.log||[];
  // The night is played, so the night teaches. See careerGrowEvent.
  careerGrowEvent(place, field.length, you, field);
  cr.log.push({season:cr.season, day:careerToday(), div:1, place:place, of:field.length,
               pts:you.stagePts, passed:cash>0, ovr:CAREER.player.ovr, games:CC_WF_GAMES,
               wins:you.wins||0, elims:you.stageElims||0,
               avg: places.length ? Math.round(places.reduce((s,v)=>s+v,0)/places.length*10)/10 : null,
               mate: mate ? mate.handle : null, mates: ccLogMates(mates), prize:ccShareOf(cash, you), kind:'final'});
  // Командный вечер закрывает сервер: он же двигает день. См. ccMpClose.
  await ccMpClose(ranked);
  if(!CC_AWAY){ ccAwayHomeDone(careerToday(), 'final'); careerAdvanceTo(ccAddDays(careerToday(), 1)); }   // выезд день не берёт
  careerSave();

  CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; CC_KILL_CAP=0;
  careerRenderHub('centre');
  careerReloadResultCard({label:L().calWeeklyFinal, place:place, of:field.length,
    through:cash>0, cut:40,
    seat:false, money:cash});
}

/* Место на Championship уходит тому, у кого его ещё нет: уже прошедший сохраняет
   место и деньги, путёвка съезжает ниже по таблице, как у Epic (у Глобалов это
   awardSeats и метка «уже в квале» в revealStandings). У Reload четыре финала
   раздают места одному кругу. Знаем себя (cr.ewc) и тех, кто взял места в
   сыгранных финалах (cr.relSeats, ники); финалы без игрока мест не раздают.
   Только текущий сезон: cr.ewc не чистится (это и трофеи), записи без сезона = первый. */
function ccRelMySeats(cr){
  return ((cr && cr.ewc) || []).filter(e => (e.season || 1) === ((cr && cr.season) || 1));
}
function ccRelHoldsSeat(you){
  const cr=CAREER.career;
  const mine=ccRelMySeats(cr).length>0;
  const held=new Set();
  (cr.relSeats||[]).filter(r=>r && (r.s||1)===(cr.season||1))
    .forEach(r=>(r.h||[]).forEach(h=>held.add(_gcNorm(h))));
  return t=>{
    if(!t) return false;
    if(t===you) return mine;
    return (t.squad||[]).some(p=>p && held.has(_gcNorm(p.handle)));
  };
}
// Кто взял места сегодня — в память круга, чтобы следующий финал их пропустил.
function ccRelSeatsKeep(cr, seats, you){
  if(!seats) return;
  cr.relSeats=(cr.relSeats||[]).concat([...seats].filter(t=>t!==you)
    .map(t=>({s:cr.season||1, h:(t.squad||[]).map(p=>p && p.handle).filter(Boolean)}))
    .filter(r=>r.h.length));
}

async function runCareerReload(){
  const cr=CAREER.career;
  const ev=careerReloadOn(careerToday());
  if(!ev || !careerReloadCan(ev)) return;
  // Командный вечер ждёт напарника. См. ccMpGate.
  const mpStart=ccMpLock() ? await ccMpGate('reload') : null;
  // In this season's teams: a Reload lobby is forty players, which is twenty
  // duos or thirteen trios, and the circuit's fields and cuts are written in
  // duos like everything else here. See ccTeams.
  const st=ccScaleStage(CC_RELOAD_STAGE[ev.stage]);
  /* The squad this season is played in, not a duo.

     Every one of these nine runners took the player and one partner and set
     squadSize to two by hand. In a trios season that put a duo in a lobby of
     trios: his own row showed two names beside everybody else's three, the
     lobby was built to the duo count of fifty rather than thirty-three, and
     the labels underneath said duos all night. His report, 20 August.

     careerMates is the seats the season actually has. An incomplete squad does
     not enter at all, which is the rule the day panel already states. */
  const me=careerCard(), mates=careerMates();
  if(!me || mates.length<careerMateSeats() || mates.some(function(m){ return !m; })) return;
  // The first seat, which is what the result records and the feed lines below
  // have always meant by the partner. A trio names the rest through mates.
  const mate=mates[0]||null;

  const prevMode=CARD_MODE, prevSize=squadSize, prevDrafted=drafted, prevSet=ACTIVE_LANDING_SET;
  CARD_MODE=true; squadSize=careerSquadSize(); drafted=[me].concat(mates);
  // The circuit stops counting a match's eliminations at ten. See ccKillPts.
  CC_KILL_CAP=CC_RELOAD_KILL_CAP;
  // A duo lobby drops on the whole island. The grid is thinned for squads —
  // trimLandingZonesForMode keeps the biggest 52% of the boxes so a four-player
  // lobby is not a wall of rectangles — and it was baked in at page load, when
  // squadSize was still the squad default. Nothing rebuilt it, so every career
  // night was played on a map with seventeen of its thirty-six boxes missing.
  // Rebuilding with squadSize already 2 is what puts the island back.
  useLandingSet(ACTIVE_LANDING_SET);
  // The circuit has its own island and the project has both of them on disk —
  // cups 1 and 2 on one, 3 and 4 on the other. Nothing in the career was ever
  // switching the map, so every Reload night was played on the Major island.
  useLandingSet(ev.set);

  // A new event is watched again: the skip a player pressed last night was for
  // last night. CC_SKIP_RUN is what makes one press cover a whole tournament.
  skipAnimation=false; CC_SKIP_RUN=false;
  resetRunRecord();
  document.getElementById('majorStages').innerHTML='';
  const rsPrev=document.getElementById('runSummary'); if(rsPrev) rsPrev.innerHTML='';
  document.getElementById('lobbyTitle').textContent='';
  document.getElementById('lobbyBody').innerHTML='';
  clearEventPanel();
  document.getElementById('finalBanner').style.display='none';
  clearLandingResultsMap();
  CAREER_RUN=true;
  show('screen-results');
  ensureSkipButton();

  const you=careerYouTeam(drafted);
  you.name=L().yourTeamPrefix+teamLabel(drafted); you.isYou=true;
  /* Who is in the room.
     From the heats on it's the top of Europe, not the player's division: a Reload final is the best 20 duos on the continent.
     Opens and Play-Ins also draw the open field (every real EU duo on the roster plus the ladder from all rungs), not the player's band. Reload Elite Series 1 Opens top ten is Focus, Th0masHD, Sky, Scroll, vic0, Malibuca, Cr1nge, the same names as the Majors. */
  const deep = st.field<=20;
  const open = !deep;
  const lobbyCr = deep ? Object.assign({}, cr, {division:1}) : cr;
  const sharp = !deep ? 0
    : (ev.stage==='final' ? CC_FIELD_SHARP.final : CC_FIELD_SHARP.heats);
  const field=ccRelRoom(you, drafted, lobbyCr, ev, st, open, sharp);

  /* Дроп выбирается везде, кроме Опенов, — правка: «нельзя
     только в опенах выбирать». Опены открыты всему региону и получают дроп
     раздачей, как получали; Плей-Ин, хиты и финал выбирают. */
  const kindsForDrop=['reload'];
  const zones=null;
  // The second evening of the Opens walks in with the first one's points, so the
  // table on screen is the tournament's all night and the line across it is the
  // real cut.
  const banking=careerReloadBanking(ev), carry=careerReloadCarry(ev);
  await simulateGamesLive(field, st.games, reloadCareerPoints(ev.set), st.kill,
    'stage', 0, null, zones,
    {lobbySize:Math.min(st.field, ccReloadLobby(careerSquadSize())), stageName:ev.label,
     mapReplay:true, choices:true, stopOnYourDeath:true,
     carry:carry, cutAt: banking ? 0 : st.cut,
     // Остров меняется игра через игру — кроме опенов, где карты нет вовсе.
     mapEach: ev.stage==='open' ? null : (g)=>ccRelIsland(ev.set, g),
     // И каждую игру — там же, где вообще выбирают.
     dropEachGame:(g,room)=>ev.stage==='open' ? null
                    : careerLandingPick(room||field, you, ev.label, kindsForDrop)});
  const ranked=field.slice().sort((a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || b.stageElims-a.stageElims);
  const place=ranked.indexOf(you)+1;
  careerPrAdd(ranked, {div:CAREER.career.division, kind:'reload', stage:ev.stage});
  const through=!banking && place<=st.cut;
  removeSkipButton();

  // Two evenings make one card: session 1's games in front of tonight's,
  // renumbered so the list reads straight through.
  if(carry && carry.log && carry.log.length){
    you.stageLog=carry.log.concat((you.stageLog||[]).map(g=>({...g, game:g.game+carry.log.length})));
    // Yours are in the log now, so the carry must not be counted a second
    // time on top of it - every other row still counts theirs off the team.
    you._carryGames=0;
  }

  /* An Opens is played in a sample of the real one, so it is read out at the
     real one's size: a place multiplied out of 2,100 into 9,766, and the line
     drawn where Epic draws it, at a thousand. Nothing here decides anything -
     "through" was settled on the room's own cut two lines above. See
     ccOpenScale. */
  const openRoom = ev.stage==='open';
  const showOf = openRoom ? ccOpenTrue() : field.length;
  const showPlace = openRoom ? ccOpenShow(place, field.length) : place;
  const showCut = openRoom ? ccOpenAdvanceNow() : st.cut;
  CC_RANK_SCALE = openRoom ? ccOpenScale(field.length) : 1;

  /* Приз — на самой карточке этапа. Скриншот («не пишут призы»):
     топ-1 финала капа читал «Топ-3 — проход дальше» и ни слова о деньгах —
     их показывала только маленькая карточка ниже, до которой не все
     долистывают. relStagePrize чистая, платит по-прежнему один блок ниже. */
  const cashNote=(()=>{ if(banking) return '';
    const c=relStagePrize(ev.stage, place);
    const m=c ? ccShareOf(c, you) : 0;
    return m ? ' · '+L().ccWfCash(ccNum(m)) : ''; })();
  const shell=createStageCardShell(ev.label+' - '+showOf);
  await revealStageLog(you, shell, true);
  // В финале дальше идти некуда: проход — это место на EWC, а если оно уже есть, так и пишем.
  const passText=ev.stage==='final'
    ? (ccRelMySeats(cr).length ? L().ccRelSeatHave : L().ccRelSeat)
    : L().ccRelPass(showCut);
  finalizeStageCard(shell, showPlace, showOf, you.stagePts, through, false,
    banking ? L().ccRelBanked
            : (through ? passText : L().ccRelFail(showCut))+cashNote);
  /* Кто из этой таблицы едет на Championship. Считается ДО таблицы, потому что
     таблица это и показывает: взявшие место — зелёной меткой, уже имеющие его —
     жёлтой «уже в квале» и без затемнения, ведь финиш позади такой команды
     место всё равно даёт. См. ccRelHoldsSeat и revealStandings. */
  let relSeats=null;
  if(ev.stage==='final' && !banking){
    CC_REL_HELD=ccRelHoldsSeat(you);
    relSeats=new Set(awardSeats(ranked, st.cut, holdsLanSeat));
  }
  await revealStandings(shell, ranked, you, banking ? 0 : st.cut, null, relSeats, p=>relStagePrize(ev.stage, p), null, ev.stage==='final');
  CC_REL_HELD=null;
  CC_RANK_SCALE = 1;

  /* The first evening settles nothing. The points are put away and the table
     they belong to is drawn on the second, out of both - the same rule Division
     1's Monday follows, and for the same reason: half a tournament is not a
     small result, it is no result. */
  if(banking){
    cr.rel={id:ev.id, series:ev.series, first:careerToday(), rows:ccRelPack(field)};
    cr.rel.log=(you.stageLog||[]).map(g=>({game:g.game, place:g.place, elims:g.elims,
                                           pts:g.pts, elimPts:g.elimPts, label:g.label}));
    // Командный вечер закрывает сервер: он же двигает день. См. ccMpClose.
    await ccMpClose(ranked);
    careerAdvanceTo(ccAddDays(careerToday(), 1));
    careerSave();
    CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; useLandingSet(prevSet); CC_KILL_CAP=0;
    CAREER_RUN=false;
    careerRenderHub('centre');
    careerBankedCard(showPlace, showOf, you.stagePts, L().ccRelBanked, st.games);
    return;
  }

  // A seat at the Esports World Cup is what the final is for. Epic gives Europe
  // first, second and third — and the circuit pays as well, which this used to
  // deny. See CC_REL_PRIZES.
  const cash=relStagePrize(ev.stage, place);
  // Всё, что вечер платит по таблице, — в зачёт призовых каждому в лобби,
  // как это делает Weekly Final; кошелёк ниже — только твоя половина.
  careerMoneyAdd(ranked, p=>relStagePrize(ev.stage, p));
  if(cash){
    const mine=ccShareOf(cash, you);
    ccPayIn(mine);
    // In the feed as well, the way every other paying night is.
    careerNews('good', 'ccNewsRelCash', [ev.label, showPlace, ccNum(mine)],
               {tbl:ccStageShot(ranked, you, CAREER.career.division, ev.label, st.cut)});
  }
  let seat=false, seatText=null;
  if(through){
    if(ev.stage==='final'){
      seat = relSeats ? relSeats.has(you) : true;
      cr.reload={series:ev.series, got:'final'};
      if(seat){
        cr.ewc=cr.ewc||[];
        // Сезон на записи: место действует в своём году. См. ccRelMySeats.
        cr.ewc.push({series:ev.series, place:place, day:careerToday(), season:cr.season});
        careerNews('good', 'ccNewsRelSeat', [ev.series, place]);
        careerEvent('tlSeat', [ev.series]);
      } else {
        /* Топ-3, но место уже есть — вечер обязан назвать того, кому путёвка
           ушла. Это те, кто взял место, стоя НИЖЕ отсечки: выше неё места
           берут своим результатом, а не твоим отказом. */
        const down=[...relSeats].filter(t=>ranked.indexOf(t)>=st.cut);
        const to=down.length ? down[down.length-1] : null;
        // В имени команды флаги тегами; карточка и лента пишут текстом.
        const toName=to ? String(to.name||'').replace(/<[^>]*>/g, '').trim() : '';
        seatText = toName ? L().ccRelSeatPass(toName) : L().ccRelSeatHave;
        careerNews('flat', 'ccNewsRelSeatPass', [ev.series, place, toName]);
      }
    } else {
      cr.reload={series:ev.series, got:ev.stage};
      careerNews('good', 'ccNewsRelThrough', [ev.label, showPlace]);
      /* И стадия оставляет после себя тех, кто из неё вышел, — их места в
         следующей комнате не обсуждаются. Только глубокие стадии: у отборов
         отсечка в сотни команд, и такая строка однажды уже убила сейв. Победа
         в игре у Reload билетом не является — см. heatQualifiers. */
      const NEXT={playin:'heat', heat:'final'};
      if(NEXT[ev.stage]){
        const q=heatQualifiers(field, st.cut, false);
        /* И тех, кто из неё НЕ вышел, — чтобы добор следующей комнаты их не
           поднял обратно. См. ccRelRoom.

           Одними никами, а не строками: список нужен только затем, чтобы
           careerCupField их не выдал, а он читает ники (hKey). И только с
           маленьких этапов — у отбора комната в сотни команд, и складывать её
           целиком в сейв нельзя, это та самая строка, которая однажды уже
           убил сейв. Хиту с его двадцатью дуо ограничение не мешает, а добор
           есть только у него: из отбора выходит восемьдесят команд на
           девятнадцать мест хита, добирать там нечего. */
        const out=(field.length<=CC_REL_OUT_MAX)
          ? ranked.filter(t=>!q.has(t) && t!==you)
                  .reduce((a,t)=>a.concat((t.squad||[]).map(c=>c && c.handle)
                                                       .filter(Boolean)), [])
          : null;
        /* И СОСЕДНИЕ хиты круга — их играет мир, но позже.

           Отзыв: «делай финал релоад». Из отбора выходит
           восемьдесят команд, хит — двадцать, отсечка пять: четыре хита дают
           ровно двадцать мест финала. Игрок отыгрывает один, и до сегодня
           остальные пятнадцать мест финал добирал свежим полем — то есть за
           три четверти зала никто не играл.

           Комнаты соседних хитов складываются здесь, потому что только здесь
           они ещё известны: строка ниже ПЕРЕЗАПИСЫВАЕТ relSeed, и таблица
           отбора, по которой их раскладывает змейка, после этого пропадает.
           Играет их ccRelWorldHeats в один из шести дней до финала — не в твой
           вечер, чтобы он не подорожал. */
        let pending=null;
        if(ev.stage==='heat'){
          const prevRows=(cr.relSeed && cr.relSeed.next==='heat' &&
                          Array.isArray(cr.relSeed.through)) ? cr.relSeed.through : null;
          if(prevRows && prevRows.length>st.field){
            const seeded=prevRows.map(r=>r==='you' ? you : ccStageTeamFrom(r));
            const hs=seedHeats(seeded, Math.max(2, Math.round(seeded.length/st.field)));
            const rAt=ccRaceHeatTogether(hs, you);   // гонка: один хит на комнату
            const at=rAt>=0 ? rAt : hs.findIndex(h=>h.indexOf(you)>=0);
            pending=hs.filter((h,i)=>i!==(at<0 ? 0 : at))
                      .map(h=>h.filter(t=>t!==you).slice(0, st.field)
                               .map(ccStageSeatRow))
                      .filter(rows=>rows.length>=2);
          }
        }
        cr.relSeed={season:cr.season, size:careerSquadSize(), set:ev.set, reg:ccPoolRegion(),
                    next:NEXT[ev.stage],
                    through:ranked.filter(t=>q.has(t))
                                  .map(t=>ccSeedRow(t, you, ccStageSeatRow)),
                    out:out, pending:pending};
      }
    }
  } else {
    careerNews('flat', 'ccNewsRelOut', [ev.label, showPlace, showOf]);
  }
  // Кто взял места сегодня — помним и тогда, когда сам ты мимо: следующий
  // финал круга этих людей пропустит. См. ccRelSeatsKeep.
  ccRelSeatsKeep(cr, relSeats, you);
  // The final crowns somebody whether or not it was you.
  if(ev.stage==='final') careerCongrats(ranked, you, ev.label);

  const places=(you.stageLog||[]).map(g=>g.place);
  cr.log=cr.log||[];
  // The night is played, so the night teaches. See careerGrowEvent.
  careerGrowEvent(showPlace, showOf, you, field);
  cr.log.push({season:cr.season, day:careerToday(), div:cr.division, place:showPlace,
               of:showOf, pts:you.stagePts, passed:through, ovr:CAREER.player.ovr,
               // Two evenings are one tournament, so the row says what was
               // actually played for the result it records.
               games:st.games*(carry?2:1), wins:you.wins||0, elims:you.stageElims||0,
               avg: places.length ? Math.round(places.reduce((s,v)=>s+v,0)/places.length*10)/10 : null,
               mate: mate ? mate.handle : null, mates: ccLogMates(mates), prize:ccShareOf(cash, you),
               kind:'reload', stage:ev.stage});
  // Командный вечер закрывает сервер — и только после этого шаг «завтра» слышен. См. ccMpClose.
  await ccMpClose(ranked);
  careerAdvanceTo(ccAddDays(careerToday(), 1));
  careerSave();

  CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; useLandingSet(prevSet); CC_KILL_CAP=0;
  careerRenderHub('centre');
  /* And it says what was won.

     The circuit pays — see CC_REL_PRIZES — and ccPayIn was banking it, but the
     results screen was called without money and there was no line in the feed
     either, so a career took a Heat cheque and a Final cheque and nothing on
     screen ever mentioned either. His report, 18 August: the finals do not write
     the prize money and do not give it. Half of that was true and the half that
     was true is the half a player can see. */
  careerReloadResultCard({label:ev.label, place:showPlace, of:showOf,
                          through:through, cut:showCut,
                          // Строка про место есть и тогда, когда места ты не
                          // взял: «оно у тебя уже есть» — это тоже новость.
                          seat: seat || !!seatText, seatText: seatText,
                          money: cash ? ccShareOf(cash, you) : null});
}
function careerReloadResultCard(r){
  const box=document.createElement('div');
  box.className='stage-card '+(r.through?'pass':'fail');
  box.innerHTML='<h4>'+esc(r.label)+' <span class="stage-badge '+(r.through?'pass':'fail')+
    '">'+ccTopC(r.place)+'</span></h4>'+
    '<div class="stage-detail">'+
      /* Строка вечера — его собственная, если она у вечера есть.

         Тестер, 22 сентября (скрин, подчёркнуто красным): последний раунд
         квалификатора 2024-го читался «Топ-0 — проход дальше». Отсечки у него
         и правда нет — раунд играется за ОЧКИ СЕРИИ, и это же написано на
         карточке этапа выше, — а нижняя карточка знала одну фразу на все
         случаи и подставляла в неё ноль. Так же молчали дни верхней сетки, где
         билет даёт победа в матче, а не место. */
      '<div>'+(r.money!=null
        ? (r.money ? L().ccWfCash(ccNum(r.money)) : L().ccWfNoCash)
        : r.note ? esc(r.note)
        : (r.through?L().ccRelPass(r.cut):L().ccRelFail(r.cut)))+'</div>'+
      // Which seat, not just that there is one: this card was written for the
      // Reload circuit and said "a seat at the Esports World Cup" whoever asked.
      (r.seat?'<div>'+esc(r.seatText||L().ccRelSeat)+'</div>':'')+
      (r.money?'<div>'+L().chEarnings+': $'+ccNum((CAREER.career.earnings||0))+'</div>':'')+
      ccNightRateLine()+
    '</div>'+
    '<div class="stage-actions"><button class="btn-primary" onclick="careerBackToHub()">'+
      L().ccBackToHub+'</button></div>';
  document.getElementById('majorStages').appendChild(box);
  ccAwayAfterAppend(box);   // поздние регионы этого вечера — кнопками прямо на итоге
  box.scrollIntoView({block:'end', behavior:'smooth'});
}

/* Zero Build-кап (ev.zb): без строек, ресурсов и высокой земли — тот же CC_ZB, что у Pro-Am
   в Сан-Паулу; снимается, как бы вечер ни кончился. */
async function runCareerVictory(){
  const ev=careerVictoryOn(careerToday());
  CC_ZB=!!(ev && ev.zb);
  /* RESHUFFLE ВДВОЁМ — ЛИЧНЫЙ ВЕЧЕР (командный год 20.10). Пары в нём тянутся из поля по одной
     карте команды (squad[0]), а своя команда в дуо — это двое: у каждого клиента первым стоял он сам,
     и каждый играл турнир без напарника — два разных турнира с одним сидом. Приглашены оба, каждый
     играет свой, итог уезжает напарнику копилкой (CC_MP_ALONE → ccEvDeltaSend). */
  const resh=!!(ev && ev.reshuffle && ccMpTeam() && !CC_MP_ALONE);
  if(resh) CC_MP_ALONE=true;
  const own=resh ? ccTeamOwnRowsOn() : false;   // таблица мира — у хозяина лобби, см. ccTeamOwnRowsOn
  /* И В ГОНКЕ — личный вечер (онлайн-прогон 2026 года, 21.10: Red Bull Reshuffle 15.08 — синхронизация комнаты сажала
     соперника его строкой, с его ботом-напарником, а не парой жребия: у одного «live1+wox», у другого «live1+sky», и
     команда без пары жребия роняла вечер — «Cannot read properties of undefined (reading 'forEach')», перемотка вставала).
     Каждый играет свой, всю таблицу пишет старший по адресу (копилка), остальные — только свою строку.
     И ESL 4 на 4 2024 (DreamHack Dallas, EWC; онлайн-прогон 2024 года, 21.10): четвёрка (ewc24MyTeam) и путёвки у каждого
     свои, ewc24Team вырезает её людей из настоящих команд — Karmine Corp у одного вчетвером, у другого втроём, и под общим
     ключом ЛАНа доски расходились на десятки строк. */
  let raceOwn=false;
  if(ev && (ev.reshuffle || ev.ewc24) && typeof ccRaceOn==='function' && ccRaceOn() && typeof ccRaceLock==='function' && ccRaceLock()){
    ccRaceNightApart();
    const ids=(typeof CC_RACE_PEERS!=='undefined') ? Object.keys(CC_RACE_PEERS).filter(k=>CC_RACE_PEERS[k]) : [];
    const elder=[ccMpId()].concat(ids).sort()[0]===ccMpId();
    if(!elder && !CC_BOARD_ONLY_YOU){ CC_BOARD_ONLY_YOU=true; raceOwn=true; }
  }
  const fmtSwap=ccEventRosterBegin(ccVictoryFormat(ev), ev && ev.own ? ev.roster : null);
  try{ return await runCareerVictoryNight(); }
  finally{ CC_ZB=false; ccEventRosterEnd(fmtSwap); if(resh) CC_MP_ALONE=false; ccTeamOwnRowsOff(own); if(raceOwn) CC_BOARD_ONLY_YOU=false; }
}
