/*@@PART js/career/shop-pass-cosmetics.js@@*/
/* МАГАЗИН РАЗДЕЛАМИ — его слово 15.10: «магазин дизайн поменяй, чтобы всё понятно было и красиво». Был одной
   лентой в четыре экрана телефона: тридцать строк сетапа подряд, у каждой «NEW», имена обрезаны, а ниже клуб, кап,
   мерч, жильё и роскошь. Теперь сверху баланс и чипы разделов (на чипе — сколько там по карману прямо сейчас), и
   виден один раздел. Сетап — по устройству одной карточкой: что стоит сейчас, лесенка ступеней и следующая
   покупка, а не все ступени списком.
   Второй заход того же вечера («давай делай» на список): на компьютере карточки в колонки, на покупке — «было →
   станет», над сетапом — лучшая покупка по карману, после оплаты — строка «Куплено» и подсветка карточки, и
   витрина дня как Item Shop в Fortnite: три вещи со скидкой, завтра другие. */
/* МАГАЗИН ПРЕДМЕТОВ (Notion «18.10», тестер: «купить кирки, скины и т. п. в карьере и видеть их в инвентаре во время
   игры»; его: «каждый день в зависимости от дня будет обновляться магазин», «вбаксы как у Epic, по цене смотря какой
   регион, рядом с балансом»).
   Витрина дня — НАСТОЯЩИЙ магазин Fortnite этой даты: fn-shop.js (tools/build-fn-shop.js, shopHistory fortnite-api.com,
   с 2019-01-01). Дата позже данных — тот же день недели годом раньше (364 дня), и так до попадания в данные.
   V-Bucks покупаются за деньги карьеры наборами Epic своего времени: до 13.08.2020 1 000 за $9.99, с Mega Drop $7.99,
   с 27.10.2023 $8.99, с 19.03.2026 за $8.99 уже 800. Регион — множитель цены App Store в долларах (16.10.2026):
   Европа €8.99 ≈ $10.11 (×1.125), Бразилия R$31.99 ≈ $6.29 (×0.70), Азия (Япония) ¥1 100 ≈ $6.96 (×0.774); Ближний
   Восток и Океания — данных нет, цена США. Цены предметов — обычные цены Epic по виду и редкости (серии Icon, Marvel
   и т. п. — по своей строке). Купленное — в шкафчике (образ из шести слотов), надетый скин — твой значок в таблице
   матча, кирка — в строке твоего убийства в ленте. */
let CC_FN_SHOP_WAIT=null, CC_FN_PICK=null, CC_FN_JUST=null;
function ccFnShopLoad(done){
  if(typeof CC_FN_SHOP!=='undefined'){ done && done(); return; }
  if(CC_FN_SHOP_WAIT){ CC_FN_SHOP_WAIT.push(done); return; }
  CC_FN_SHOP_WAIT=[done];
  const el=document.createElement('script');
  el.src='fn-shop.js?v='+(CC_FN_SHOP_V||'0');
  el.onload=el.onerror=function(){ const q=CC_FN_SHOP_WAIT||[]; CC_FN_SHOP_WAIT=null; q.forEach(f=>{ try{ f && f(); }catch(e){ console.error(e); } }); };
  document.head.appendChild(el);
}
let CC_FN_DAYS=null;
function ccFnItem(i){
  const x=CC_FN_SHOP.items[i];
  return x ? {i:i, id:x[0], name:x[1], t:x[2], r:x[3], set:x[4]!=null && CC_FN_SHOP.sets ? CC_FN_SHOP.sets[x[4]] : null} : null;
}
// Магазин дня: список предметов настоящего магазина Fortnite на эту дату.
function ccFnShopDay(day){
  if(typeof CC_FN_SHOP==='undefined') return null;
  if(!CC_FN_DAYS) CC_FN_DAYS=CC_FN_SHOP.days.split(';');
  let d=String(day||'').slice(0, 10);
  if(d<CC_FN_SHOP.first) d=CC_FN_SHOP.first;
  let guard=0;
  while(d>CC_FN_SHOP.last && guard++<20) d=ccAddDays(d, -364);
  const n=ccDaysBetween(CC_FN_SHOP.first, d);
  /* Дыры в данных fortnite-api (17.10.2022, 27.01.2026) — витрина предыдущего дня, магазин не пустеет (его «да» 20.10).
     14.10.2019 пуст по-настоящему: блэкаут ивента The End, магазина не было. */
  let row=CC_FN_DAYS[n] || '';
  if(!row && d!=='2019-10-14') for(let k=1; k<=3 && !row; k++) row=CC_FN_DAYS[n-k] || '';
  const order={o:0, p:1, g:2, e:3, w:4, b:5};
  return row.split(',').filter(Boolean).map(s=>ccFnItem(parseInt(s, 36))).filter(Boolean)
    .sort((a,b)=>order[a.t]-order[b.t] || ccFnPrice(b)-ccFnPrice(a) || a.name.localeCompare(b.name));
}
const CC_FN_PRICE={o:{common:500, uncommon:800, rare:1200, epic:1500, legendary:2000, S:1500},
  p:{common:300, uncommon:500, rare:800, epic:1200, legendary:1500, S:800},
  g:{common:300, uncommon:500, rare:800, epic:1200, legendary:1500, S:1200},
  e:{common:200, uncommon:200, rare:500, epic:800, legendary:800, S:500},
  b:{common:200, uncommon:200, rare:300, epic:500, legendary:500, S:400},
  w:{common:300, uncommon:300, rare:500, epic:700, legendary:700, S:500}};
function ccFnPrice(it){ const t=CC_FN_PRICE[it.t]||CC_FN_PRICE.o; return t[String(it.r).indexOf('S:')===0 ? 'S' : it.r] || t.rare; }
const CC_FN_RAR={common:'#6b6b6b', uncommon:'#3f8f24', rare:'#2a7fd4', epic:'#8a3fc4', legendary:'#c86b26', 'S:Icon':'#1f9aab',
  'S:MARVEL':'#b22b2b', 'S:DC':'#3a5bb5', 'S:Gaming Legends':'#4b2ca8', 'S:Star Wars':'#2f2f2f', 'S:DARK':'#8a1d8f',
  'S:Shadow':'#3a3a3a', 'S:Slurp':'#1aa6a6', 'S:Lava':'#b04a1a', 'S:Frozen':'#4f97c9', 'S:CREW':'#2b6c8f'};
function ccFnImg(id, small){ return 'https://fortnite-api.com/images/cosmetics/br/'+String(id).toLowerCase()+'/'+(small ? 'smallicon' : 'icon')+'.png'; }
// Скин в полный рост (featured.png: персонаж стоит, как в лобби игры, фон прозрачный) — для шкафчика.
// Нет такой картинки — квадратная иконка; нет и её — пусто.
function ccFnFull(id){ return 'https://fortnite-api.com/images/cosmetics/br/'+String(id).toLowerCase()+'/featured.png'; }
/* Рендер, обрезанный снизу (Notion «19.10», скрин 42: «почему не фулл мою модельку видно скина» — Rex). У старых скинов
   Главы 1 featured.png — промо-кадр по колени во весь квадрат, и в меню фигура выходила вдвое крупнее соседей и без ног.
   Полного роста у них нет ни в одном источнике, поэтому такой кадр (персонаж касается нижнего края) рисуется ниже ростом,
   а срез растворяется у подиума (класс cut). fortnite-api отдаёт картинки с CORS, пиксели читаются. */
function ccLbFigCut(img){
  try{
    const c=document.createElement('canvas'); c.width=c.height=48;
    const x=c.getContext('2d', {willReadFrequently:true}); x.drawImage(img, 0, 0, 48, 48);
    const row=x.getImageData(0, 46, 48, 2).data;
    let n=0; for(let i=3; i<row.length; i+=4) if(row[i]>60) n++;
    img.classList.toggle('cut', n>=6);
    /* Где у скина ноги (Notion 22.11, игрок из X «it looks wrong»: фигуры висели над дисками). У картинок скинов снизу
       разный прозрачный запас, а диск и фигура стоят по одним процентам. Ищем нижнюю непрозрачную строку и опускаем
       картинку на этот запас (--lb-gap, доля высоты), чтобы ноги стояли на диске. Обрезанным снизу (cut) запас не нужен. */
    if(n<6 && img.naturalWidth && img.naturalHeight>=img.naturalWidth*0.98){
      const H=96, W=Math.max(8, Math.round(H*img.naturalWidth/img.naturalHeight)), d=document.createElement('canvas'); d.width=W; d.height=H;
      const y=d.getContext('2d', {willReadFrequently:true}); y.drawImage(img, 0, 0, W, H);
      const px=y.getImageData(0, 0, W, H).data; let low=-1;
      for(let r=H-1; r>=0 && low<0; r--){ let k=0; for(let q=0; q<W; q++) if(px[(r*W+q)*4+3]>80) k++; if(k>=2) low=r; }
      if(low>0) img.style.setProperty('--lb-gap', Math.min(0.25, (H-1-low)/H).toFixed(3));
    }
  }catch(e){}
}
function ccFnHeroErr(img){
  if(img.dataset.f){ img.remove(); return; }
  img.dataset.f='1'; img.classList.remove('full'); img.classList.add('icon');
  img.src=ccFnImg(img.dataset.id);
}
// Вид магазина той главы, что идёт в карьере: c1 — синий «Рекомендуемые / Ежедневные» Главы 1, c2 — полосатые плитки
// Главы 2, c3 — светлый магазин Глав 3–4, c5 — тёмный магазин лентами (новый магазин с 3 ноября 2023).
const CC_FN_CHAPTERS=[['2019-10-13', 1], ['2021-12-04', 2], ['2022-12-03', 3], ['2023-12-02', 4], ['2024-11-30', 5], ['2025-11-29', 6]];
function ccFnShopEra(day){
  const d=String(day||careerToday());
  const ch=(CC_FN_CHAPTERS.find(c=>d<c[0])||[0, 7])[1];
  const k = d<'2019-10-13' ? 'c1' : d<'2021-12-05' ? 'c2' : d<'2023-11-03' ? 'c3' : 'c5';
  /* ВИД МАГАЗИНА ПО ВРЕМЕНИ, КАК В ИГРЕ (21.10, его «item shop в стиле, как в каждом сезоне, посмотри, как это выглядело
     в игре в разные времена»). Даты смены — патчи Epic (вики Item Shop, история версий) и скриншоты тех дней:
       a  до v10.20 (27.08.2019): тёмный фон лобби, две панели «Featured Items» / «Daily Items» со сланцевой шапкой;
       b  Season X: синий с сеткой, крупные заголовки с линией и секундомером;
       c  Глава 2 (v11.00): вкладки Featured | Daily и одна лента вбок;
       d  v14.00 (27.08.2020): «New Design» — разделы стопкой, чёрная полоса имени с полоской редкости, курсив;
       e  v26.20 (26.09.2023): плоские плитки, имя слева; og — тёмный магазин Season OG (v27.00);
       f  v28.00 (3.12.2023): «Shop», скруглённые плитки, имя строчными; с v29.20 (9.04.2024) без цветов редкости;
       g  2026: метки над именем (с февраля), большой баннер набора сверху (с середины апреля, по снимкам). */
  const v = d<'2019-08-27' ? 'a' : d<'2019-10-15' ? 'b' : d<'2020-08-27' ? 'c' : d<'2023-09-26' ? 'd'
          : d<'2023-11-03' ? 'e' : d<'2023-12-03' ? 'og' : d<'2026-02-01' ? 'f' : 'g';
  return {k, ch, v, noRar:d>='2024-04-09', hero:d>='2026-04-15'};
}
// Новинка дня: предмет впервые в магазине (по данным с 2019-го; стоявшие в 2018-м — CC_FN_SHOP.old — не новинка).
let CC_FN_FIRST=null, CC_FN_OLD=null;
function ccFnIsNew(it, day){
  if(typeof CC_FN_SHOP==='undefined' || !it) return false;
  if(!CC_FN_DAYS) CC_FN_DAYS=CC_FN_SHOP.days.split(';');
  if(!CC_FN_FIRST){
    CC_FN_FIRST=new Map(); CC_FN_OLD=new Set(CC_FN_SHOP.old||[]);
    CC_FN_DAYS.forEach((row, n)=>{ if(row) row.split(',').forEach(s=>{ const i=parseInt(s, 36); if(!CC_FN_FIRST.has(i)) CC_FN_FIRST.set(i, n); }); });
  }
  if(CC_FN_OLD.has(it.i)) return false;
  let d=String(day||careerToday()).slice(0, 10), guard=0;
  while(d>CC_FN_SHOP.last && guard++<20) d=ccAddDays(d, -364);
  const n=ccDaysBetween(CC_FN_SHOP.first, d);
  return n>0 && CC_FN_FIRST.get(it.i)===n;
}
// Цвет плитки без редкости (с v29.20 Epic красит плитку под предмет): свой оттенок у каждого набора.
function ccFnSetHue(it){ const k=String((it && (it.set||it.name))||''); return 'hsl('+(ccHashStr(k)%360)+' 62% 38%)'; }
// Наборы V-Bucks своего времени, цена в долларах с множителем региона карьеры.
const CC_VB_REGION={EU:1.125, BR:0.70, ASIA:0.774};
function ccVbPacks(day){
  const d=String(day||careerToday());
  const base = d<'2020-08-13' ? [[1000, 9.99], [2800, 24.99], [7500, 59.99], [13500, 99.99]]
             : d<'2023-10-27' ? [[1000, 7.99], [2800, 19.99], [5000, 31.99], [13500, 79.99]]
             : d<'2026-03-19' ? [[1000, 8.99], [2800, 22.99], [5000, 36.99], [13500, 89.99]]
             : [[800, 8.99], [2400, 22.99], [4500, 36.99], [12500, 89.99]];
  const m=CC_VB_REGION[ccCareerRegion()] || 1;
  return base.map(([vb, usd])=>({vb:vb, usd:Math.round(usd*m*100)/100}));
}
function ccFnOwn(){ return CAREER.fnOwn || (CAREER.fnOwn={}); }
/* ДЕФОЛТЫ И КИРКИ ЧЕМПИОНОВ (Notion «19.10», скрины 37–38, его «в симуляции должна быть кирка, которая у него стоит в
   шкафчике, и у него ещё дефолтные скины и кирки должны быть», «может выиграть фнкс и ему выдадут кирку, смотря какой
   фнкс он выиграл»). Дефолты лежат в шкафчике у всех: Default Pickaxe и Recruit Главы 1, с Главы 2 — её Recruit
   (Rebirth A–D, с C2S5 ещё E–I). Кирка FNCS — та, что Epic выдавал чемпионам этого сезона (fortnite-api, set «FNCS»,
   дата появления); сезон считается по дате (ccSeasonNumOn). До C2S2 своей кирки у FNCS не было — первая, The Axe of
   Champions. Сезон без своей — последняя вышедшая до него. */
const CC_FN_DEFAULTS=[
  ['2019-01-01', 'DefaultPickaxe', 'p', 'Default Pickaxe'],
  ['2019-01-01', 'CID_001_Athena_Commando_F_Default', 'o', 'Recruit'], ['2019-01-01', 'CID_005_Athena_Commando_M_Default', 'o', 'Recruit'],
  ['2019-01-01', 'CID_002_Athena_Commando_F_Default', 'o', 'Recruit'], ['2019-01-01', 'CID_006_Athena_Commando_M_Default', 'o', 'Recruit'],
  ['2019-01-01', 'CID_003_Athena_Commando_F_Default', 'o', 'Recruit'], ['2019-01-01', 'CID_007_Athena_Commando_M_Default', 'o', 'Recruit'],
  ['2019-01-01', 'CID_004_Athena_Commando_F_Default', 'o', 'Recruit'], ['2019-01-01', 'CID_008_Athena_Commando_M_Default', 'o', 'Recruit'],
  ['2019-10-13', 'CID_556_Athena_Commando_F_RebirthDefaultA', 'o', 'Recruit'], ['2019-10-13', 'CID_560_Athena_Commando_M_RebirthDefaultA', 'o', 'Recruit'],
  ['2019-10-13', 'CID_557_Athena_Commando_F_RebirthDefaultB', 'o', 'Recruit'], ['2019-10-13', 'CID_561_Athena_Commando_M_RebirthDefaultB', 'o', 'Recruit'],
  ['2019-10-13', 'CID_558_Athena_Commando_F_RebirthDefaultC', 'o', 'Recruit'], ['2019-10-13', 'CID_562_Athena_Commando_M_RebirthDefaultC', 'o', 'Recruit'],
  ['2019-10-13', 'CID_559_Athena_Commando_F_RebirthDefaultD', 'o', 'Recruit'], ['2019-10-13', 'CID_563_Athena_Commando_M_RebirthDefaultD', 'o', 'Recruit'],
  ['2020-12-02', 'CID_878_Athena_Commando_F_RebirthDefault_E', 'o', 'Recruit'], ['2020-12-02', 'CID_873_Athena_Commando_M_RebirthDefaultE', 'o', 'Recruit'],
  ['2020-12-02', 'CID_879_Athena_Commando_F_RebirthDefault_F', 'o', 'Recruit'], ['2020-12-02', 'CID_874_Athena_Commando_M_RebirthDefaultF', 'o', 'Recruit']
];
function ccFnDefaults(){
  if(!CAREER || !CAREER.career) return;
  const own=ccFnOwn(), day=careerToday();
  CC_FN_DEFAULTS.forEach(([from, id, t, n])=>{ if(day>=from && !own[id]) own[id]={t:t, n:n, r:'common', d:from, def:true}; });
}
const CC_FNCS_AXES=[
  ['2020-03-17', 'Pickaxe_ID_376_FNCS', 'The Axe of Champions'],
  ['2022-05-28', 'Pickaxe_ID_804_FNCSS20Male', 'The Axe of Champions 2.0'],
  ['2022-07-18', 'Pickaxe_ID_835_SpyMaleFNCS1H', 'Bow Blades'],
  ['2022-11-01', 'Pickaxe_SpyMale_FNCS_22', 'Champion Balisong'],
  ['2023-02-14', 'Pickaxe_Forsake_FNCS', 'Maceball Bat'],
  ['2023-05-04', 'Pickaxe_WinterHunterFNCS', 'Eyes of Victory'],
  ['2023-07-29', 'Pickaxe_HeadhunterStarFNCS', 'Star Jet'],
  ['2023-10-04', 'Pickaxe_SkeletonHunterFNCS', 'Competitive Slicer'],
  ['2024-01-23', 'Pickaxe_BestDressedFNCS', "Champion's Blade"],
  ['2024-04-09', 'Pickaxe_SpyMaleFNCS', 'Determination Daggers'],
  ['2024-06-22', 'Pickaxe_Angel_FNCS', 'Scarlet Champion'],
  ['2024-11-13', 'Pickaxe_FNCS_S32', 'Blade of Champions'],
  ['2025-01-31', 'Pickaxe_NoiseFNCS', 'Wild Blade'],
  ['2025-04-08', 'Pickaxe_WayWardRebelFNCS', 'FNCS Tape Decker'],
  ['2025-05-02', 'Pickaxe_RainFNCS', 'FNCS Blade'],
  ['2025-07-15', 'Pickaxe_StarWandFNCS', 'FNCS Star Wand'],
  ['2025-08-26', 'Pickaxe_FNCSChampion', 'The Axe of Champions 3.0'],
  ['2025-11-02', 'Pickaxe_HappyFNCS', 'Champion Chopper'],
  ['2026-04-01', 'Pickaxe_MoralKoreFNCS', "Competitor's Prybar"],
  ['2026-07-30', 'Pickaxe_OceanPearlFNCS', "Champion's Club"],
  ['2026-09-17', 'Pickaxe_FNCS_42', 'FNCS Scythe']
];
// Кирка чемпиона FNCS для победы в этот день: своего сезона, иначе последняя до него, до первой — первая.
function ccFncsAxeFor(day){
  const n=ccSeasonNumOn(day)||0;
  const same=n ? CC_FNCS_AXES.filter(a=>(ccSeasonNumOn(a[0])||0)===n) : [];
  const before=CC_FNCS_AXES.filter(a=>a[0]<=day);
  const a=same[0] || before[before.length-1] || CC_FNCS_AXES[0];
  return {id:a[1], name:a[2]};
}
/* VICTORY UMBRELLA (его выбор 20.10 из списка «чего нет из Fortnite»): первая Victory Royale сезона даёт зонтик этого
   сезона, как в игре. Номер сезона — ccSeasonNumOn дня вечера; зонтики — fortnite-api (Umbrella_Season_NN и ранние).
   Сезон без своего (дальше S42) — последний известный. Дельтаплан ложится в шкафчик, надевать — самому. */
const CC_UMBRELLAS={1:['Solo_Umbrella','The Umbrella'], 2:['Umbrella_Snowflake','Snowflake'], 3:['Umbrella_PaperParasol','Paper Parasol'],
  4:['Umbrella_Season_04','Wet Paint'], 5:['Umbrella_Season_05','Beach Umbrella'], 6:['Umbrella_Season_06','Webrella'], 7:['Umbrella_Season_07','Snowfall'],
  8:['Umbrella_Season_08','Palm Leaf'], 9:['Umbrella_Season_09','Holographic'], 10:['Umbrella_Season_10','X'], 11:['Umbrella_Season_11','Downpour'],
  12:['Umbrella_Season_12','CLASSIFIED'], 13:['Umbrella_Season_13','Fortilla Flier'], 14:["Umbrella_Season_14","Mighty Marvel 'Brella"],
  15:["Umbrella_Season_15","Bounty 'Brella"], 16:["Umbrella_Season_16","Foundational 'Brella"], 17:['Umbrella_Season_17','Invasion'],
  18:['Umbrella_Season_18','Umbrella of the Last Reality'], 19:['Umbrella_Season_19','Seven Signet'], 20:['Umbrella_Season_20','Gunn-brella'],
  21:['Umbrella_Season_21','Battle Bloom'], 22:['Umbrella_Season_22','Chromebrella'], 23:['Umbrella_Season_23','The Peerless Parasol'],
  24:['Umbrella_Season_24','MEGA-brella'], 25:['Umbrella_Season_25','Nana-brella'], 26:['Umbrella_Season_26','Eclipse Brella'],
  27:['Umbrella_Season_27','Time Brella'], 28:['Umbrella_Season_28','Rebel Brella'], 29:['Umbrella_Season_29','The Olympian'],
  30:["Umbrella_Season_30","Junker 'Brella"], 31:['Umbrella_Season_31','Doom Brella'], 32:["Umbrella_Season_32","Remix 'Brella"],
  33:["Umbrella_Season_33","Shogun 'Brella"], 34:['Umbrella_Season_34','The Vaultbrella'], 35:["Umbrella_Ch6MiniSeason1","Death Star 'Brella"],
  36:["Umbrella_Season36","Utopia 'Brella"], 37:["Umbrella_Season_37","O.X.R. 'Brella"], 38:["Umbrella_Ch6MiniSeason2","Safety Inspector 'Brella"],
  39:["Umbrella_RankedTandem","Fame 'Brella"], 40:["Umbrella_Season_40","New Seven 'Brella"], 41:['Umbrella_Season_41','Dark Cube-rella'],
  42:["Umbrella_Season_42","Override 'Brella"], 43:["Umbrella_Season_BR43_Victory","Crow's Nest Cascade"]};
function ccUmbrellaFor(day){
  const n=ccSeasonNumOn(day)||0;
  const k=CC_UMBRELLAS[n] ? n : n>43 ? 43 : 1;
  return {n:n, id:CC_UMBRELLAS[k][0], name:CC_UMBRELLAS[k][1]};
}
function ccUmbrellaGive(day){
  const u=ccUmbrellaFor(day), own=ccFnOwn();
  if(!own[u.id]) own[u.id]={t:'g', n:u.name, r:'rare', d:day, umb:true};
  return u;
}
const CC_FNCS_AXE3=['Pickaxe_FNCSChampion', 'The Axe of Champions 3.0'];
// Выдать кирку чемпиона: в шкафчик и сразу в руки (quiet — старый сейв задним числом: только в шкафчик).
// three — Axe of Champions 3.0 (за Мейджор, Саммит, ЛАН), иначе кирка чемпиона сезона.
function ccFncsAxeGive(day, quiet, three){
  const ax=three ? {id:CC_FNCS_AXE3[0], name:CC_FNCS_AXE3[1]} : ccFncsAxeFor(day), own=ccFnOwn();
  if(!own[ax.id]) own[ax.id]={t:'p', n:ax.name, r:'rare', d:day, fncs:true};
  if(!quiet) ccFnEq().p=ax.id;
  return ax;
}
function ccFnEq(){ return CAREER.fnEq || (CAREER.fnEq={}); }
/* БАТЛ ПАСС. У каждого сезона Fortnite свой
   пасс из настоящих наград этого сезона (CC_FN_SHOP.bp, tools/build-fn-bp.js): бесплатная линия и платная за 950 V-Bucks,
   50 уровней (дорожка плотная: между скинами — спреи, эмодзи, экраны загрузки того же пасса). Опыт идёт из журнала вечеров (cr.log, как шкафчик): сыгранные матчи, киллы, Victory Royale, место,
   квалификация, ЛАН. Плюс три испытания недели. Награды падают в шкафчик сами, как в игре.
   Пасс у каждого свой (CAREER.bp), в симуляцию не лезет и случайных чисел не тратит: онлайн вдвоём не расходится.
   CAREER.bp = { seen: сколько строк журнала прочитано, p: { ключ: { n, from, to, xp, prem, gf, gp, wk:{неделя:{g,e,w,t,q,n}}, wd:{} } } } */
/* Темп замерен tools/bp-xp-probe.js (год 2026, два сильных EU, 136–143 вечера): сезон даёт 33–81 тыс. опыта с матчей
   и до 2 000 за испытание. Опыт на уровень — от длины сезона (110 дней — 2 000, мини-сезон 35 дней — 800): сильный
   закрывает пасс к последней трети сезона, средний доходит до 60–90 уровня. */
const CC_BP_LVLS=50, CC_BP_PAGES=5, CC_BP_PRICE=950, CC_BP_LVL_PRICE=150, CC_BP_CH_XP=2000;
function ccBpLvlXp(p){ return Math.max(800, Math.min(2000, Math.round(ccDaysBetween(p.from, p.to)*20/50)*50)); }
const CC_BP_XP={game:40, elim:12, win:250, top10:150, top3:300, first:600, pass:500, lan:1000};
const CC_BP_T_ALL={
  en:{tp:{y:'Spray', j:'Emoticon', l:'Loading Screen', c:'Contrail', m:'Music'}, tab:'Battle Pass', lvl:'Level', free:'Free', paid:'Battle Pass', buy:'Buy Battle Pass', own:'Battle Pass owned', buyLvl:'Buy levels', lvlMax:'Max',
    noVb:'Not enough V-Bucks. Top up in the Item Shop.', left:n=>n+' days left', xpNote:'XP comes from your tournaments: every match, eliminations, Victory Royales, top finishes, qualifying and LANs. Rewards go to your Locker by themselves.',
    week:'Weekly challenges', ch:{g:n=>'Play '+n+' matches', e:n=>'Get '+n+' eliminations', w:()=>'Win a match', t:()=>'Finish top 10 in a tournament', q:()=>'Qualify for the next stage', n:n=>'Play '+n+' tournaments'},
    none:'This season has no Battle Pass data yet.', askBuy:'Buy the Battle Pass for 950 V-Bucks? Every paid reward up to your level unlocks now.', askLvl:(n, c)=>'Buy '+n+(n===1 ? ' level' : ' levels')+' for '+c+' V-Bucks?',
    max:'Pass complete', vb:n=>n+' V-Bucks', loading:'Loading the pass…', locker:'Open Locker', got:'New in your Locker', prev:'Back', next:'Next', page:(a,b)=>'Levels '+a+' to '+b, xpOf:(a,b)=>a+' / '+b+' XP', noWeek:'No week of this season yet.'},
  ru:{tp:{y:'Граффити', j:'Эмодзи', l:'Экран загрузки', c:'След', m:'Музыка'}, tab:'Боевой пропуск', lvl:'Уровень', free:'Бесплатно', paid:'Боевой пропуск', buy:'Купить боевой пропуск', own:'Боевой пропуск куплен', buyLvl:'Купить уровни', lvlMax:'Макс',
    noVb:'Не хватает V-Bucks. Пополни в магазине предметов.', left:n=>'До конца сезона '+n+' дн.', xpNote:'Опыт идёт с турниров: каждый матч, киллы, Victory Royale, топ-места, квалификации и ЛАНы. Награды сами падают в шкафчик.',
    week:'Испытания недели', ch:{g:n=>'Сыграй '+n+' матчей', e:n=>'Сделай '+n+' киллов', w:()=>'Выиграй матч', t:()=>'Займи топ-10 на турнире', q:()=>'Пройди в следующий этап', n:n=>'Сыграй '+n+' турнира'},
    none:'Для этого сезона пока нет данных пропуска.', askBuy:'Купить боевой пропуск за 950 V-Bucks? Все платные награды до твоего уровня откроются сразу.', askLvl:(n, c)=>'Купить уровней: '+n+' за '+c+' V-Bucks?',
    max:'Пропуск пройден', vb:n=>n+' V-Bucks', loading:'Загружаю пропуск…', locker:'В шкафчик', got:'Новое в шкафчике', prev:'Назад', next:'Дальше', page:(a,b)=>'Уровни '+a+'–'+b, xpOf:(a,b)=>a+' / '+b+' опыта', noWeek:'Недели этого сезона ещё не было.'},
  fr:{tp:{y:'Tag', j:'Émoticône', l:'Écran de chargement', c:'Traînée', m:'Musique'}, tab:'Passe de combat', lvl:'Niveau', free:'Gratuit', paid:'Passe de combat', buy:'Acheter le Passe de combat', own:'Passe de combat acheté', buyLvl:'Acheter des niveaux', lvlMax:'Max',
    noVb:'Pas assez de V-Bucks. Recharge dans la boutique.', left:n=>n+' jours restants', xpNote:"L'XP vient de tes tournois : chaque partie, éliminations, Top 1, bonnes places, qualifications et LAN. Les récompenses arrivent seules dans ton casier.",
    week:'Défis de la semaine', ch:{g:n=>'Joue '+n+' parties', e:n=>'Fais '+n+' éliminations', w:()=>'Gagne une partie', t:()=>'Finis dans le top 10 d\'un tournoi', q:()=>"Qualifie-toi pour l'étape suivante", n:n=>'Joue '+n+' tournois'},
    none:"Pas encore de Passe pour cette saison.", askBuy:'Acheter le Passe de combat pour 950 V-Bucks ? Toutes les récompenses payantes jusqu\'à ton niveau se débloquent.', askLvl:(n, c)=>'Acheter '+n+(n===1 ? ' niveau' : ' niveaux')+' pour '+c+' V-Bucks ?',
    max:'Passe terminé', vb:n=>n+' V-Bucks', loading:'Chargement du Passe…', locker:'Ouvrir le casier', got:'Nouveau dans ton casier', prev:'Retour', next:'Suite', page:(a,b)=>'Niveaux '+a+' à '+b, xpOf:(a,b)=>a+' / '+b+' XP', noWeek:'Aucune semaine de cette saison pour le moment.'},
  it:{tp:{y:'Spray', j:'Emoticon', l:'Schermata di caricamento', c:'Scia', m:'Musica'}, tab:'Pass battaglia', lvl:'Livello', free:'Gratis', paid:'Pass battaglia', buy:'Compra il Pass battaglia', own:'Pass battaglia acquistato', buyLvl:'Compra livelli', lvlMax:'Max',
    noVb:'V-Buck insufficienti. Ricarica nel negozio.', left:n=>n+' giorni rimasti', xpNote:'I PE arrivano dai tornei: ogni partita, eliminazioni, vittorie reali, piazzamenti alti, qualificazioni e LAN. Le ricompense vanno da sole nell\'armadietto.',
    week:'Sfide della settimana', ch:{g:n=>'Gioca '+n+' partite', e:n=>'Fai '+n+' eliminazioni', w:()=>'Vinci una partita', t:()=>'Arriva nella top 10 di un torneo', q:()=>'Qualificati alla fase successiva', n:n=>'Gioca '+n+' tornei'},
    none:'Nessun dato del Pass per questa stagione.', askBuy:'Comprare il Pass battaglia per 950 V-Buck? Tutte le ricompense a pagamento fino al tuo livello si sbloccano subito.', askLvl:(n, c)=>'Comprare '+n+(n===1 ? ' livello' : ' livelli')+' per '+c+' V-Buck?',
    max:'Pass completato', vb:n=>n+' V-Buck', loading:'Carico il Pass…', locker:'Apri armadietto', got:'Nuovo nell\'armadietto', prev:'Indietro', next:'Avanti', page:(a,b)=>'Livelli '+a+'-'+b, xpOf:(a,b)=>a+' / '+b+' PE', noWeek:'Nessuna settimana di questa stagione per ora.'},
  pt:{tp:{y:'Spray', j:'Emoticon', l:'Tela de carregamento', c:'Rastro', m:'Música'}, tab:'Passe de Batalha', lvl:'Nível', free:'Grátis', paid:'Passe de Batalha', buy:'Comprar Passe de Batalha', own:'Passe de Batalha comprado', buyLvl:'Comprar níveis', lvlMax:'Máx.',
    noVb:'V-Bucks insuficientes. Recarregue na Loja de Itens.', left:n=>n+' dias restantes', xpNote:'O XP vem dos seus torneios: cada partida, eliminações, vitórias, boas colocações, classificações e LANs. As recompensas vão sozinhas para o seu armário.',
    week:'Desafios da semana', ch:{g:n=>'Jogue '+n+' partidas', e:n=>'Faça '+n+' eliminações', w:()=>'Vença uma partida', t:()=>'Fique no top 10 de um torneio', q:()=>'Classifique-se para a próxima fase', n:n=>'Jogue '+n+' torneios'},
    none:'Ainda não há dados do Passe nesta temporada.', askBuy:'Comprar o Passe de Batalha por 950 V-Bucks? Todas as recompensas pagas até o seu nível liberam agora.', askLvl:(n, c)=>'Comprar '+n+(n===1 ? ' nível' : ' níveis')+' por '+c+' V-Bucks?',
    max:'Passe completo', vb:n=>n+' V-Bucks', loading:'Carregando o Passe…', locker:'Abrir armário', got:'Novo no armário', prev:'Voltar', next:'Próximo', page:(a,b)=>'Níveis '+a+' a '+b, xpOf:(a,b)=>a+' / '+b+' XP', noWeek:'Nenhuma semana desta temporada ainda.'},
  de:{tp:{y:'Spray', j:'Emoticon', l:'Ladebildschirm', c:'Kondensstreifen', m:'Musik'}, tab:'Battle Pass', lvl:'Stufe', free:'Gratis', paid:'Battle Pass', buy:'Battle Pass kaufen', own:'Battle Pass gekauft', buyLvl:'Stufen kaufen', lvlMax:'Max',
    noVb:'Nicht genug V-Bucks. Im Item-Shop aufladen.', left:n=>'Noch '+n+' Tage', xpNote:'EP gibt es aus Turnieren: jedes Match, Eliminierungen, Siege, Top-Platzierungen, Qualifikationen und LANs. Belohnungen landen von selbst im Spind.',
    week:'Wöchentliche Aufträge', ch:{g:n=>'Spiele '+n+' Matches', e:n=>'Erziele '+n+' Eliminierungen', w:()=>'Gewinne ein Match', t:()=>'Erreiche die Top 10 eines Turniers', q:()=>'Qualifiziere dich für die nächste Runde', n:n=>'Spiele '+n+' Turniere'},
    none:'Für diese Saison gibt es noch keine Pass-Daten.', askBuy:'Battle Pass für 950 V-Bucks kaufen? Alle bezahlten Belohnungen bis zu deiner Stufe werden sofort frei.', askLvl:(n, c)=>n+(n===1 ? ' Stufe' : ' Stufen')+' für '+c+' V-Bucks kaufen?',
    max:'Pass abgeschlossen', vb:n=>n+' V-Bucks', loading:'Pass wird geladen…', locker:'Spind öffnen', got:'Neu im Spind', prev:'Zurück', next:'Weiter', page:(a,b)=>'Stufen '+a+' bis '+b, xpOf:(a,b)=>a+' / '+b+' EP', noWeek:'Noch keine Woche dieser Saison.'},
  es:{tp:{y:'Grafiti', j:'Emoticono', l:'Pantalla de carga', c:'Estela', m:'Música'}, tab:'Pase de batalla', lvl:'Nivel', free:'Gratis', paid:'Pase de batalla', buy:'Comprar pase de batalla', own:'Pase de batalla comprado', buyLvl:'Comprar niveles', lvlMax:'Máx.',
    noVb:'No tienes suficientes paVos. Recarga en la tienda.', left:n=>'Quedan '+n+' días', xpNote:'La PE sale de tus torneos: cada partida, eliminaciones, victorias, buenos puestos, clasificaciones y LAN. Las recompensas van solas a tu taquilla.',
    week:'Desafíos de la semana', ch:{g:n=>'Juega '+n+' partidas', e:n=>'Consigue '+n+' eliminaciones', w:()=>'Gana una partida', t:()=>'Entra en el top 10 de un torneo', q:()=>'Clasifícate para la siguiente fase', n:n=>'Juega '+n+' torneos'},
    none:'Todavía no hay datos del pase para esta temporada.', askBuy:'¿Comprar el pase de batalla por 950 paVos? Todas las recompensas de pago hasta tu nivel se desbloquean ya.', askLvl:(n, c)=>'¿Comprar '+n+(n===1 ? ' nivel' : ' niveles')+' por '+c+' paVos?',
    max:'Pase completado', vb:n=>n+' paVos', loading:'Cargando el pase…', locker:'Abrir taquilla', got:'Nuevo en tu taquilla', prev:'Atrás', next:'Siguiente', page:(a,b)=>'Niveles '+a+' a '+b, xpOf:(a,b)=>a+' / '+b+' PE', noWeek:'Todavía no hay semanas de esta temporada.'}};
function ccBpT(){ return CC_BP_T_ALL[LANG] || CC_BP_T_ALL.en; }
// Испытания недели: вид и цель. Три на неделю, выбор — от номера сезона и недели (без случайных чисел).
const CC_BP_CH=[['g',25],['e',40],['w',2],['t',1],['q',2],['n',3],['g',40],['e',70]];
function ccBpWeekChallenges(n, w){
  const out=[], used={};
  for(let k=0; out.length<3 && k<40; k++){
    const c=CC_BP_CH[(n*7+w*5+k*3)%CC_BP_CH.length];
    if(used[c[0]]) continue; used[c[0]]=1; out.push(c);
  }
  return out;
}
// Сезон дня: номер Fortnite и границы. Годы по кругу (2027+) ходят по датам 2026-го — ключ пасса с номером круга.
function ccBpSeasonOf(day){
  const d=String(day||'').slice(0, 10), n=ccSeasonNumOn(d);
  const lists=[typeof CC_SEASONS_2019!=='undefined'?CC_SEASONS_2019:[], typeof CC_SEASONS_2020!=='undefined'?CC_SEASONS_2020:[],
    typeof CC_SEASONS_2021!=='undefined'?CC_SEASONS_2021:[], typeof CC_SEASONS_2022!=='undefined'?CC_SEASONS_2022:[],
    typeof CC_SEASONS_2023!=='undefined'?CC_SEASONS_2023:[], typeof CC_SEASONS_2024!=='undefined'?CC_SEASONS_2024:[],
    typeof CC_SEASONS_2025!=='undefined'?CC_SEASONS_2025:[], typeof CC_SEASONS!=='undefined'?CC_SEASONS:[]];
  const s=[].concat.apply([], lists).find(x=>d>=x.from && d<=x.to);
  if(!n || !s) return null;
  const k=(typeof ccYearShift==='function') ? ccYearShift() : 0;
  return {n:n, from:s.from, to:s.to, key:(k>0 ? k+'|' : '')+s.from};
}
function ccBp(){ return CAREER.bp || (CAREER.bp={seen:null, p:{}}); }
function ccBpPass(s){
  const b=ccBp();
  return b.p[s.key] || (b.p[s.key]={n:s.n, from:s.from, to:s.to, xp:0, prem:0, gf:0, gp:0, wk:{}, wd:{}});
}
// Опыт одного вечера: матчи, киллы, победы, место, квалификация, ЛАН.
function ccBpXpOf(e){
  const X=CC_BP_XP, pl=+e.place||0;
  let xp=(e.games||0)*X.game+(e.elims||0)*X.elim+(e.wins||0)*X.win;
  if(pl===1) xp+=X.first; else if(pl>0 && pl<=3) xp+=X.top3; else if(pl>0 && pl<=10) xp+=X.top10;
  if(e.passed) xp+=X.pass;
  if(e.lan) xp+=X.lan;
  return xp;
}
const ccBpLevel=p=>Math.min(CC_BP_LVLS, Math.floor((p.xp||0)/ccBpLvlXp(p))+1);
// Строка журнала → в пасс её сезона; плюс счётчики недели и испытания, закрытые этой строкой.
function ccBpAdd(e){
  const s=ccBpSeasonOf(e.day); if(!s) return;
  const p=ccBpPass(s), w=Math.floor(ccDaysBetween(p.from, e.day)/7);
  p.xp+=ccBpXpOf(e);
  const c=p.wk[w]||(p.wk[w]={g:0, e:0, w:0, t:0, q:0, n:0});
  c.g+=e.games||0; c.e+=e.elims||0; c.w+=(e.wins||0)>0 ? 1 : 0; c.n++;
  if(+e.place>0 && +e.place<=10) c.t=1;
  if(e.passed) c.q++;
  ccBpWeekChallenges(p.n, w).forEach((ch, i)=>{
    const id=w+'|'+i; if(p.wd[id] || (c[ch[0]]||0)<ch[1]) return;
    p.wd[id]=1; p.xp+=CC_BP_CH_XP;
  });
}
// Читает новые строки журнала. Первый раз (старый сейв) — только вечера текущего сезона, с конца журнала.
function ccBpCheck(){
  const cr=CAREER && CAREER.career; if(!cr || !Array.isArray(cr.log)) return;
  const b=ccBp(), log=cr.log;
  if(b.seen==null){
    const s=ccBpSeasonOf(careerToday()); let i=log.length;
    if(s) while(i>0 && log[i-1] && log[i-1].day>=s.from && log[i-1].day<=s.to) i--;
    b.seen=i;
  }
  if(b.seen>log.length) b.seen=log.length;
  let any=false;
  for(let i=b.seen; i<log.length; i++){ const e=log[i]; if(e && !e.who && e.day){ ccBpAdd(e); any=true; } }
  b.seen=log.length;
  if(typeof CC_FN_SHOP!=='undefined') ccBpGrantAll();
  else if(any && typeof ccFnShopLoad==='function' && typeof document!=='undefined') ccFnShopLoad(()=>{ try{ ccBpGrantAll(); }catch(e){} });
}
// Дорожка наград сезона: 100 уровней, у каждого бесплатная и платная награда (предмет, V-Bucks или ничего).
const CC_BP_RANK={common:0, uncommon:1, rare:2, epic:3, legendary:4};
let CC_BP_TRACKS={};
function ccBpItems(n){
  const B=(typeof CC_FN_SHOP!=='undefined' && CC_FN_SHOP.bp) || {};
  let k=n; while(k>0 && !B[k]) k--;   // у сезона без данных — пасс прошлого
  return (B[k]||[]).map(x=>({id:x[0], t:x[1], r:x[2], name:x[3], free:!!x[4], small:'yjlcm'.indexOf(x[1])>=0}));
}
function ccBpTrack(n){
  if(CC_BP_TRACKS[n]) return CC_BP_TRACKS[n];
  const all=ccBpItems(n), its=all.filter(x=>!x.small), small=all.filter(x=>x.small);
  const rk=it=>String(it.r).indexOf('S:')===0 ? 4 : (CC_BP_RANK[it.r]!=null ? CC_BP_RANK[it.r] : 2);
  let free=its.filter(x=>x.free);
  // В сезоне без бесплатных меток (S41) — четыре самых простых не-скина.
  if(!free.length) free=its.filter(x=>x.t!=='o').sort((a,b)=>rk(a)-rk(b)).slice(0, 4);
  const paid=its.filter(x=>free.indexOf(x)<0);
  const lv=Array.from({length:CC_BP_LVLS+1}, ()=>({f:null, p:null}));
  // Платная линия: скин на 1-м уровне и самый редкий на последнем, как в игре; остальное ровно по уровням.
  const outf=paid.filter(x=>x.t==='o').sort((a,b)=>rk(a)-rk(b)), rest=paid.filter(x=>x.t!=='o').sort((a,b)=>rk(a)-rk(b));
  const put=(list, key, a, z)=>{ list.forEach((it, i)=>{ let L=list.length===1 ? z : Math.round(a+(z-a)*i/(list.length-1));
    while(L<=CC_BP_LVLS && lv[L][key]) L++; if(L>CC_BP_LVLS){ L=a; while(L<=CC_BP_LVLS && lv[L][key]) L++; } if(L<=CC_BP_LVLS) lv[L][key]=it; }); };
  if(outf.length){ lv[1].p=outf[0]; lv[CC_BP_LVLS].p=outf[outf.length-1]; put(outf.slice(1, -1), 'p', 5, 45); }
  put(rest, 'p', 2, 49);
  put(free.sort((a,b)=>rk(a)-rk(b)), 'f', 3, 48);
  // V-Bucks: 1500 в платной (15 по 100) и 300 в бесплатной, на свободных уровнях.
  const vbs=(key, cnt)=>{ for(let j=0; j<cnt; j++){ let L=Math.round(3+j*(45/cnt)); while(L<=CC_BP_LVLS && lv[L][key]) L++; if(L<=CC_BP_LVLS) lv[L][key]={vb:100}; } };
  vbs('p', 15); vbs('f', 3);
  // Мелочь — в пустые уровни своей линии (бесплатная мелочь — в бесплатную), лишняя не встаёт.
  const fill=(list, key)=>{ let L=1; list.forEach(it=>{ while(L<=CC_BP_LVLS && lv[L][key]) L++; if(L<=CC_BP_LVLS) lv[L][key]=it; }); };
  fill(small.filter(x=>x.free), 'f'); fill(small.filter(x=>!x.free), 'p'); fill(small.filter(x=>x.free), 'p');
  return (CC_BP_TRACKS[n]=lv);
}
// Выдать всё, что открыто до текущего уровня: бесплатное всегда, платное — если пропуск куплен.
function ccBpGrant(p){
  if(typeof CC_FN_SHOP==='undefined' || !CC_FN_SHOP.bp) return 0;
  const lvl=ccBpLevel(p), tr=ccBpTrack(p.n), own=ccFnOwn(), eq=ccFnEq(), day=careerToday();
  let got=0;
  const give=r=>{ if(!r) return; if(r.vb){ CAREER.vb=(CAREER.vb||0)+r.vb; got++; return; }
    if(own[r.id]) return; own[r.id]={t:r.t, n:r.name, r:r.r, d:day, bp:p.n}; if(!eq[r.t]) eq[r.t]=r.id; got++; };
  for(let L=(p.gf||0)+1; L<=lvl; L++) give(tr[L].f);
  p.gf=Math.max(p.gf||0, lvl);
  if(p.prem){ for(let L=(p.gp||0)+1; L<=lvl; L++) give(tr[L].p); p.gp=Math.max(p.gp||0, lvl); }
  if(got) p.news=(p.news||0)+got;
  return got;
}
function ccBpGrantAll(){ const b=ccBp(); Object.keys(b.p).forEach(k=>ccBpGrant(b.p[k])); }
let CC_BP_PAGE=null, CC_BP_PAGE_K=null;
function ccBpCur(){ const s=ccBpSeasonOf(careerToday()); return s ? ccBpPass(s) : null; }
function ccBpBuy(){
  const p=ccBpCur(); if(!p || p.prem || (CAREER.vb||0)<CC_BP_PRICE) return;
  ccAsk(ccBpT().askBuy, ()=>{ if(p.prem || (CAREER.vb||0)<CC_BP_PRICE) return; CAREER.vb-=CC_BP_PRICE; p.prem=1; try{ ccSacSpend(CC_BP_PRICE); }catch(e){}
    ccBpGrant(p); careerSave(); careerRenderHub('bp'); });
}
// Сколько уровней можно купить: до конца пасса и на сколько хватит V-Bucks.
let CC_BP_LVL_N=1;
function ccBpLvlMax(p){ return Math.max(0, Math.min(CC_BP_LVLS-ccBpLevel(p), Math.floor((CAREER.vb||0)/CC_BP_LVL_PRICE))); }
function ccBpLvlPick(p){ return Math.max(1, Math.min(ccBpLvlMax(p)||1, CC_BP_LVL_N)); }
function ccBpLvlSet(n){ const p=ccBpCur(); if(!p) return; CC_BP_LVL_N=n; CC_BP_LVL_N=ccBpLvlPick(p); careerRenderHub('bp'); }
function ccBpBuyLvl(){
  const p=ccBpCur(); if(!p || !ccBpLvlMax(p)) return;
  const n=ccBpLvlPick(p), cost=n*CC_BP_LVL_PRICE;
  ccAsk(ccBpT().askLvl(n, cost), ()=>{ if(n>ccBpLvlMax(p)) return; CAREER.vb-=cost;
    p.xp+=n*ccBpLvlXp(p); CC_BP_LVL_N=1; try{ ccSacSpend(cost); }catch(e){} ccBpGrant(p); careerSave(); careerRenderHub('bp'); });
}
function ccBpPage(d){ CC_BP_PAGE=Math.max(0, Math.min(CC_BP_PAGES-1, (CC_BP_PAGE||0)+d)); careerRenderHub('bp'); }
function ccBpRewardHTML(r, open, have){
  const T=ccBpT(), L0=L();
  if(!r) return '<div class="cc-bp-r none"></div>';
  const cls='cc-bp-r'+(open ? ' open' : '')+(have ? ' have' : '');
  if(r.vb) return '<div class="'+cls+' vb"><span class="cc-bp-img"><i class="cc-vb-ic"></i></span><b>'+esc(T.vb(r.vb))+'</b></div>';
  const bg=CC_FN_RAR[r.r] || CC_FN_RAR.rare;
  return '<div class="'+cls+'" style="--fn-bg:'+bg+'" title="'+esc(r.name)+'"><span class="cc-bp-img"><img src="'+ccFnImg(r.id, true)+'" alt="" loading="lazy" onerror="this.remove()"></span>'+
    '<b>'+esc(r.name)+'</b><em>'+esc(L0['ccFnType_'+r.t]||T.tp[r.t]||'')+'</em></div>';
}
/* PIRATE SHOP TOKEN (мини-сезон Treasure Hunters, S43). Как в Fortnite: редкая находка в матче, у напарника тоже,
   включается в магазине: 14 дней всё за V-Bucks бесплатно. Шанса Epic не называла: 1/250 на игру наша настройка,
   tools/pirate-odds-probe.js намерил 70–120 игр за сезон, выходит примерно 1 карьера из 3. Читает журнал, как пасс:
   Math.random не трогает, бросок зависит от состава и дня, перезагрузка его не меняет. */
let CC_CHEST_DEMO=false;
const CC_PIRATE_P=1/250, CC_PIRATE_DAYS=14, CC_PIRATE_SEASON=43;
const CC_PIRATE_T_ALL={
  en:{title:'Pirate Shop Access', found:'YOU FOUND PIRATE SHOP ACCESS! Use it in the Item Shop: for 14 days everything priced in V-Bucks is free.', use:'Plunder the Item Shop', note:'One per career. Use it whenever you want: for 14 days everything priced in V-Bucks is free.', ask:'Plunder the Item Shop now? The 14 days start today.', left:n=>'Everything priced in V-Bucks is free. Days left: '+n},
  ru:{title:'Pirate Shop Access', found:'ТЫ НАШЁЛ PIRATE SHOP ACCESS! Включи его в магазине: 14 дней всё за V-Bucks бесплатно.', use:'Разграбить магазин', note:'Один на карьеру. Включай когда хочешь: 14 дней всё за V-Bucks бесплатно.', ask:'Разграбить магазин сейчас? 14 дней пойдут с сегодняшнего.', left:n=>'Всё за V-Bucks бесплатно. Осталось дней: '+n},
  fr:{title:'Pirate Shop Access', found:'TU AS TROUVÉ PIRATE SHOP ACCESS ! Active-le dans la boutique : pendant 14 jours, tout ce qui coûte des V-Bucks est gratuit.', use:'Piller la boutique', note:'Un seul par carrière. Active-le quand tu veux : pendant 14 jours, tout ce qui coûte des V-Bucks est gratuit.', ask:'Piller la boutique maintenant ? Les 14 jours commencent aujourd\'hui.', left:n=>'Tout ce qui coûte des V-Bucks est gratuit. Jours restants : '+n},
  it:{title:'Pirate Shop Access', found:'HAI TROVATO PIRATE SHOP ACCESS! Attivalo nel negozio: per 14 giorni tutto ciò che costa V-Buck è gratis.', use:'Saccheggia il negozio', note:'Uno per carriera. Attivalo quando vuoi: per 14 giorni tutto ciò che costa V-Buck è gratis.', ask:'Saccheggiare il negozio ora? I 14 giorni partono da oggi.', left:n=>'Tutto ciò che costa V-Buck è gratis. Giorni rimasti: '+n},
  pt:{title:'Pirate Shop Access', found:'VOCÊ ENCONTROU PIRATE SHOP ACCESS! Ative na loja: por 14 dias tudo que custa V-Bucks é grátis.', use:'Saquear a loja', note:'Um por carreira. Ative quando quiser: por 14 dias tudo que custa V-Bucks é grátis.', ask:'Saquear a loja agora? Os 14 dias começam hoje.', left:n=>'Tudo que custa V-Bucks é grátis. Dias restantes: '+n},
  de:{title:'Pirate Shop Access', found:'DU HAST PIRATE SHOP ACCESS GEFUNDEN! Aktiviere ihn im Shop: 14 Tage lang ist alles für V-Bucks gratis.', use:'Shop plündern', note:'Einer pro Karriere. Aktiviere ihn, wann du willst: 14 Tage lang ist alles für V-Bucks gratis.', ask:'Shop jetzt plündern? Die 14 Tage beginnen heute.', left:n=>'Alles für V-Bucks ist gratis. Verbleibende Tage: '+n},
  es:{title:'Pirate Shop Access', found:'¡HAS ENCONTRADO PIRATE SHOP ACCESS! Actívalo en la tienda: durante 14 días todo lo que cuesta paVos es gratis.', use:'Saquear la tienda', note:'Uno por carrera. Actívalo cuando quieras: durante 14 días todo lo que cuesta paVos es gratis.', ask:'¿Saquear la tienda ahora? Los 14 días empiezan hoy.', left:n=>'Todo lo que cuesta paVos es gratis. Días restantes: '+n}
};
function ccPirateT(){ return (!(typeof CC_CHEST_DEMO!=='undefined' && CC_CHEST_DEMO) && CC_PIRATE_T_ALL[LANG]) || CC_PIRATE_T_ALL.en; }
function ccPirate(){ return CAREER.pirate || (CAREER.pirate={seen:0}); }
// Ключ команды один у обоих в паре: напарник находит токен вместе с тобой.
function ccPirateTeam(){
  const pl=CAREER.player||{}, mates=(CAREER.partners||[]).map(x=>x && x.handle).filter(Boolean);
  return [pl.handle||pl.nick||''].concat(mates).map(x=>hKey(x)).sort().join('+');
}
function ccPirateRoll(team, day, k, g){ return careerRng(ccHashStr('pirate|'+team+'|'+day+'|'+k+'|'+g))()<CC_PIRATE_P; }
function ccPirateCheck(){
  const cr=CAREER && CAREER.career; if(!cr || !Array.isArray(cr.log)) return;
  const p=ccPirate(), log=cr.log, team=ccPirateTeam(), perDay={};
  if(p.seen>log.length) p.seen=log.length;
  if(p.found){ p.seen=log.length; return; }
  for(let i=0; i<log.length; i++){
    const e=log[i]; if(!e || e.who || !e.day) continue;
    const k=perDay[e.day]=(perDay[e.day]||0)+1;
    if(i<p.seen || ccSeasonNumOn(e.day)!==CC_PIRATE_SEASON) continue;
    for(let g=0; g<(e.games||0); g++) if(ccPirateRoll(team, e.day, k, g)){ p.found=e.day; p.news=1; p.seen=log.length; return; }
  }
  p.seen=log.length;
}
function ccPirateLeft(){
  const p=CAREER && CAREER.pirate; if(!p) return 0;
  const at=ccPirateSlot()===2 ? p.on2 : p.on; if(!at) return 0;
  if(p.onS!=null && p.onS!==(CAREER.career.season||1)) return 0;
  const d=ccDaysBetween(at, careerToday());
  return d<0 ? 0 : Math.max(0, CC_PIRATE_DAYS-d);
}
function ccPirateSlot(){ return ccYearShift()>0 ? 2 : 1; }
function ccPirateCanUse(){
  const p=CAREER && CAREER.pirate; if(!p || !p.found) return false;
  return ccPirateSlot()===2 ? !p.on2 : (!p.on && careerToday()<='2026-12-15');
}
const ccPirateOn=()=>ccPirateLeft()>0;
// Цена в магазине сейчас. Сортировка и суммы наборов считают по обычной ccFnPrice.
function ccFnCost(it){ return ccPirateOn() ? 0 : ccFnPrice(it); }
// Цена на кнопке: при монете слово вместо нуля и старая цена зачёркнутой, как в игре.
function ccFnTag(n, old){
  if(ccPirateOn()) return '<span class="cc-fn-free">'+esc(ccChestT().freeW)+'</span>'+(old ? ' <s>'+ccNum(old)+'</s>' : '');
  return '<i class="cc-vb-ic"></i>'+ccNum(n)+(old ? ' <s>'+ccNum(old)+'</s>' : '');
}
function ccPirateUse(){
  if(!ccPirateCanUse()) return;
  ccAsk(ccPirateT().ask, ()=>ccPirateActivate());
}
function ccPirateHTML(){
  const p=CAREER.pirate, T=ccPirateT(), C=ccChestT(); if(!p || !p.found) return '';
  const left=ccPirateLeft();
  if(left) return '<div class="ch-tile cc-pirate"><h4>'+esc(T.title)+'</h4><div class="cc-pirate-on" role="status">'+esc(T.left(left))+'</div></div>';
  if(ccPirateCanUse()) return '<div class="ch-tile cc-pirate"><h4>'+esc(T.title)+'</h4><div class="ch-hint">'+esc(C.two)+'</div><button class="cc-pirate-btn" onclick="ccPirateUse()">'+esc(T.use)+'</button></div>';
  return ccPirateSlot()===1 ? '<div class="ch-tile cc-pirate"><h4>'+esc(T.title)+'</h4><div class="ch-hint">'+esc(C.next)+'</div></div>' : '';
}
// Сказать о находке один раз, когда вечер закончился и игрок снова в хабе.
function ccPirateNews(){
  const p=CAREER && CAREER.pirate; if(!p || !p.news || (typeof CC_FF!=='undefined' && CC_FF)) return;
  p.news=0; try{ careerSave(); }catch(e){}
  ccTell(ccPirateT().found);
}
/* Пиратские сундуки S43: плитка на вкладке «Тренировка», карта острова с настоящими точками сундуков (fortnite.gg).
   Заход: 36 обычных и 4 редких, стоит 25 энергии (списывается с первым сундуком), заходов в день сколько хватит энергии. День не занимает, поэтому открыто и в дни турниров. Что лежит, решают день, состав и номер сундука,
   перезагрузка не перебрасывает. Шанс монеты наша настройка, Epic его не называет: 1/1300 обычный, 1/430 редкий.
   tools/check-career-chests.js: открывая все каждый день за месяц, находят примерно 2 карьеры из 3. */
/*@@S43-CHESTS-FROM@@*/const CC_S43_CHESTS={"n":[75.4,54.9,78.6,54.9,81.1,51.4,75.3,54.9,75.3,54.9,75.9,54.8,4.1,78,4.3,77.4,46.2,53.1,45.7,54.2,46.7,74.1,51.4,76.5,51.2,75.3,51.5,75.9,66.1,23,67.6,24,67.7,23.6,65,24,66.1,24.7,65.1,21.8,65.9,21.7,65.4,23.9,65.8,21.3,66.6,24.6,66.7,20.6,67.6,24.5,64.8,22.2,64.3,24.9,66.2,21.3,67,21.6,66.7,23.4,64.6,24,66.8,23.6,65.9,23,67,21.9,67.2,22.9,10.9,20.2,9.7,20.2,10.3,20.2,9.5,21.4,10.3,20,65.3,58.9,64.5,58.5,65.3,59.8,77.3,96.8,76.1,94.6,82.6,93.9,7.3,50.9,8.6,49.4,8.3,48.9,6.3,50.3,7.8,49,8.1,48.7,8.1,49.7,8.7,48,6.8,52.2,7.3,47.7,7.9,50.1,8.7,50.1,6.4,52.1,8.4,50.5,7.8,49,8.6,48.2,8.6,48.7,8.1,50.1,8.4,50.7,8.3,48.6,8.8,50.1,6.7,51.8,67.4,66.6,67.2,67.5,66.1,65.4,63.8,65.3,62.8,64.6,74.1,78.7,73.6,77.3,75.1,80.4,75.2,82.1,74.6,83.4,65.4,43.8,65.6,43.5,65.8,43.1,64.6,42.6,65.7,43.9,64.4,43.9,11.5,75.8,11.7,75.8,11.2,76.4,69.8,26.8,68.9,25.6,69.6,26.1,79.8,79.6,78.4,81.5,79.6,79.6,75.9,82.1,79.8,79.6,78,77.9,77.1,77.8,76,79.8,76,80.7,77.6,80.4,75.8,79.9,77,80.4,75.3,77.2,76.8,77.7,76.9,82.1,75.6,81,75.7,80.3,75.5,82.8,64.8,19.1,61.4,22.5,26.1,12.5,26.9,13.5,26.9,12.7,24.9,12.9,29.4,15,29.3,14.6,29.8,14.2,29.9,14.5,29.3,14.1,29,14.3,29.8,14.9,27.8,14.1,25.2,14.7,26.2,15.2,25.3,15.6,25.7,15.5,26.5,12.5,25.3,13.2,27.6,12.9,26,12.4,25.2,15.4,24.9,11.3,28.9,17.4,26,14.7,26.5,12.7,24.1,15.5,38.3,40.3,43.5,74.6,44.9,72.8,43,70.4,43.1,72.8,43.1,72.2,43.3,70.5,43.7,71.1,42.3,74.1,41.8,74.2,42.1,74.9,39.1,75,39.8,74.5,40,74.5,38.6,76.2,38.7,70.3,38.9,70.5,41.9,74.7,41,76.9,40.7,76.3,40.1,76.7,39,72.2,39.3,73.1,39.5,69.9,42.3,70.5,40.2,70.1,40.8,70.7,41.5,70.3,39.4,70.2,39.1,74.9,78.1,57,81.9,61,78.3,57.8,77.8,56.7,75.5,59.4,75.5,57.6,75.2,58.8,75.5,57.2,75.9,56,75.6,56.8,75.3,56.7,75.7,56.9,75.1,58.4,75.9,58.5,75.2,56.3,76.1,55.5,76,56.7,75.9,59.8,75.3,59.2,62.1,27.5,73.9,76.8,73.2,76.2,73.9,73.7,25,6.8,26.5,5.4,63.6,81.5,63.6,81.5,63.3,82.3,64,81,60.7,53.9,60.5,53,62.8,52.4,63.6,52.7,60.5,52.3,62.3,51.9,13.6,48.9,11.4,52.2,10.6,51.2,9.2,49,13.8,52.1,14,50.3,11.6,48.1,8.8,50,11.7,51.4,11.5,51.2,11.4,51.1,14.5,89.4,14.4,88.2,75.1,55.2,75.1,58.2,75.1,59.9,58.1,66.5,58.9,66.1,27.5,66.8,27.9,64.9,27,65.7,27.5,65.6,28.6,65.9,27,65.2,27.8,65.3,83,94,83.8,95.1,30.7,86.8,30.7,88.8,29.7,88.3,28.8,89.4,17,13.4,22.5,14.3,23.1,15.2,22.5,14.6,21.7,15.1,22.2,14.7,22.1,14.9,18.6,11.5,19.3,11.6,21.6,15.1,48.4,25.4,48.2,25.1,58.7,56.4,60.4,55,59.6,56.2,57.3,55.4,58.2,55.9,57.9,57.4,59.2,55.2,12.6,18.1,12.6,15.9,14.1,16.8,12.5,17,64.3,25.6,67.6,25.7,32.2,54.1,35.2,51.6,31.7,54.8,31.9,54.5,89.7,80.9,88.9,80.2,85.8,79.9,87,80,85.5,80.1,88.8,81.4,89.3,80.6,84.9,83.6,88.1,83.9,87.8,80.9,26.3,51.8,25.7,52.7,24.7,51.8,25.7,50.9,31.3,88.2,36.5,91.6,37.4,91.7,72.4,11.7,74,11,56.2,51.6,54.4,53.8,58.5,54.6,60.2,52.4,59.3,53.6,56.1,52.3,56,52.5,56.1,52.8,57.5,50.7,58.3,51.6,58.7,51.8,58.4,52.7,57.1,54.6,57.9,54.3,53.3,53.8,57.3,48.4,59.8,53,58.4,53.5,58.9,51.3,56.8,49.6,56,54.8,55.1,53,73.9,10.5,44.1,47.6,40.4,45.5,31,45.7,30.5,42.8,30.6,43,30.4,44.7,29.6,43.7,72.3,48.9,70.7,47.9,41.3,81.7,39.9,82.8,39.1,82.1,39.2,83.7,45.1,81.8,45.4,82,45.7,80.3,38.8,77.3,57.8,82.7,63,90.4,84.7,73,84,73.8,85.3,74.7,85.8,73.8,13.6,47.1,10.8,47.1,7.2,59.3,7.7,59.1,7.9,59.6,3.7,56.6,15.1,92,39.6,32.2,43.8,26.4,44.7,26.4,43.3,28.8,45.2,26,22.1,47.3,21,47.6,19.3,40.4,83.3,59.6,82.7,61,83.2,59.5,56.5,93.7,56.2,94,56,95.7,56.1,94.1,56.1,95.7,56.4,96.4,56.7,95.8,56.3,94.6,56.4,93.5,54.2,94.5,54,93.6,54.6,93.6,54,95.3,54.5,95.5,53.9,95.6,54.4,94.7,55,93.7,54.3,94.2,56.7,95.6,56,95,54.6,95.3,53.2,93.2,57.1,93.1,36.4,29.4,35.1,30,35.8,29.2,35.6,28.3,35.8,29.4,28.1,33.6,28.9,35.2,29.4,35,56.6,17.4,90.1,87.6,92,88.5,78,76.8,77.2,76.8,77.2,76.8,77.8,77,76.6,77.1,18.1,66.6,50.7,43.5,49.6,43,49.8,41.1,50.1,42.2,46.8,47.3,33.8,44.9,34.3,45.5,34,45.7,35.5,45.8,35.5,45.4,34.3,43.1,34.4,42.5,34.2,42.9,34.9,43.3,36.3,43.9,35.8,44.2,36.1,44.1,35.5,43.8,36.3,43.4,31.8,44.4,31.9,43.1,31.1,43.9,31.1,44.2,32.2,43.7,31.7,43.6,31.7,43.9,31.9,44.8,35,44.2,35,46,36.6,45.6,33.8,45.1,32.7,43,37.3,43.5,34.7,46.5,32,46.2,31.4,45.5,35.1,41.8,36,41.9,35.3,42.2,32,42.4,58.4,29.8,75,25.5,85.8,64.1,84.4,65,10.1,34.2,80.2,19.2,81.4,20.5,79.3,24.6,78.2,25.3,43.1,87,42.1,86.2,42.3,87.1,42.5,86,39,40.7,38.2,40.2,38.7,40.5,59.7,35.6,57.5,39.6,59.5,35.6,88.6,29.8,88.4,30.6,88.6,30.2,87.8,30.7,10.6,31.9,10.2,31.3,48.1,27.4,48,27.5,48,26.9,48.4,26,48.4,28.1,48.1,27.9,47.7,25.7,52,28.6,50.4,29.4,50.6,29.9,50.9,27.1,52.2,26.8,46.1,27.5,46,28,10.7,82.9,12.6,78.3,12.6,78,57.6,91.4,53.8,91.2,54.3,91.4,56.3,91.3,57.7,91.5,53.6,90.7,55.6,89.1,55.2,89.2,71.3,47.3,22.9,75.3,21.7,75.8,19.9,73.2,20.3,75.4,17,75.4,17.1,75.3,23.3,75.4,22.5,74.7,68.6,22.7,68.5,23.2,69.3,25.2,67.9,23.9,67.8,24.2,67.9,23.9,68.2,24.6,68.5,24,68,25.1,70.1,24.8,68.3,22.1,40.8,69.7,66.4,37.4,40.5,49.6,43.8,49.7,40.4,54.7,44.4,53.8,45.1,54.5,20.9,58.5,21.3,58.6,20.9,58.9,19.3,55.2,89.7,86,88.7,86.8,71.1,86.5,71.1,86.1,22.6,77.3,20.5,79.9,20.4,78.3,19.4,78.2,22,78.6,20.8,80.8,22.8,77.6,19.9,79,17.4,79.7,17.3,80.1,20.6,77.3,21.6,78.5,38.1,40.5,38.4,40.1,41.5,94.7,42.3,93,41.5,92.9,43.4,92.6,41.9,92.9,41.9,92.1,44.1,93.6,19.9,37.5,18.4,34.8,18.7,38.9,20.3,19.7,20.6,21.3,77.7,68.7,77.6,68,78.2,68.6,60.1,24.6,48.1,64.2,48.1,63.8,37.8,73.1,37.2,72.5,37.6,72,37,73.4,32.4,71.2,36.9,75.6,37.2,74.8,78.6,90.5,78.1,90.1,75.9,86.3,75.4,86.6,75.7,87.9,75.4,87.2,66.6,13.6,8.2,44.2,8,44,8,43.3,48.7,89.2,22.1,49.4,22,48.3,22.2,48.8,36.8,60.1,59.6,71.2,57.7,75.9,57.7,75.6,17.1,88.3,17.2,88.8,17.9,87.3,17.2,86.2,16.6,87.5,16.8,89.3,14.9,61.2,19.9,6.5,48.7,84.3,50.7,84,68,66.1,68.7,66.6,80.2,38.3,79.4,37.9,79.9,37.4,80,38.5,80.4,37.4,76.4,34.1,78.5,53.3,48.6,53.9,49.2,54,50.3,49.7,47.9,74.9,62.5,55.4,63.3,56.8,64.5,58.5,38.1,36.9,38.3,35.8,31.8,37.5,60.5,66.4,65.6,72.9,65.1,72.9,32.9,65.3,65.4,46.1,23.9,29.8,25.6,27.5,28.7,27.1,28.8,26.6,11.4,70,15.5,70.3,14.6,70.5,33.8,24.4,32.6,22.2,27.8,72.2,24.1,71,84.1,20.6,29.6,14.8,40.8,71.8,81.8,58.2,75.5,57.3,67.1,31.1,62.1,30.8,71.4,69.9,63.8,81.4,63.6,81.4,50.5,36.6,51,33.6,50.3,37.1,64.7,52.2,62.4,50.8,63.5,48.9,70.9,60,69.5,60,59.5,65.4,59.1,65.9,24.4,67,30.5,66.5,83.7,95,83.7,93,78.2,13.6,28.3,89.1,72.9,22.3,73.9,21.5,72.1,22.7,73.1,21.1,50.8,20.1,50.8,20.6,59.1,58.2,57.9,56.7,57.4,58.2,54.8,55.9,58.6,56.7,58,57.8,57.8,61.8,56.7,46.7,53.8,40.8,24.6,59.9,27.6,60.6,30.8,55.1,27,57.7,64.9,25.6,37.2,54.1,37.2,54,37.5,54.2,37.8,54.5,31.9,54.2,27,19.8,27.4,20.2,84.2,83.9,84.2,84,85.2,81.9,85.3,81.8,24.6,50.7,68.6,11.7,72.5,12,72.4,11.5,57.6,52.2,60.1,52.6,56.7,53.9,58.3,49.6,72.5,8.3,72.5,10.3,39.3,41.1,27.9,43.4,69.3,51.3,69.3,52,67.4,10.2,54.9,83.3,58.7,82.7,57.6,82.1,57.8,83.3,58.2,81.1,53.3,82.9,18.9,31.1,62.5,90.9,66,92,64.7,88.3,83.7,76.3,82.8,69.8,39.4,32.4,44.9,28.6,44.9,29.1,81.5,41.2,75.3,42.5,21.5,40.5,18,42.1,22.1,41.9,21.3,41,85.9,59.7,85.5,58,39.7,22.1,39.3,23.4,44.4,21.9,34.1,32.1,32.8,25.6,27.9,33.6,28.4,33.6,29.5,33.6,56.1,15.9,55.1,18,55.2,16.9,55.1,17.9,54.4,16.1,54.6,16.4,13.6,65,10.5,68.9,19.4,66.8,48.1,43.8,48.1,43.3,46.9,47,52.3,46.4,47.3,41.3,48.9,42.6,49.8,41.1,58,29.5,59.6,29.9,75.3,26.8,78.4,28.2,75.1,25.8,38.6,36.6,38.3,37.6,44.2,39.8,45.6,36.2,45.6,35.7,80.9,22,81.2,19.6,80.8,19.6,41.2,61.3,41.2,55.5,39.6,55.4,58.9,39.8,57,33.8,56.3,38.8,56.4,39.1,56.7,39.4,59.1,36.4,7.7,21.4,8.5,20.1,88.6,30.6,88.4,29.8,89.9,29,10.7,29.7,38.2,81.2,37.8,83.4,50.9,26,51.4,26,52,28.3,52.1,28.8,52,30,13,78.1,70.8,47,71.7,47,17.3,75.3,18.9,70.6,17.5,70.2,68.3,25.1,67.8,24.5,52,58.7,49.1,56.1,39,65.6,61.4,38.8,45.4,53.8,41,51.4,17.7,57.4,20.3,59.3,23.3,55.1,20.4,61,21.6,59.7,68.2,39.8,76.2,10.6,7.7,68.2,5.7,68.1,7.5,67.6,6.9,65.9,17,84,17.2,80,30.2,84,27.3,80.7,17.8,36.6,18.7,34.8,18,34.8,21.2,24.7,23.5,24,81.2,64.4,79.4,64,58.8,24.2,56.5,19.4,55.1,19,53.7,22.1,52.3,65,51.9,66.1,31.5,76.5,37.4,73.4,37.5,73.2,79,84.7,5.2,69.5,5.3,44.8,52.6,85.4,35.9,59.7,35.9,60.7,45.8,92,52.1,82.9,48.8,79.8,72.6,63.4,71.6,63.5,71.8,63,71.5,69.6,72.1,68.5,80.7,33.2,76.2,33.9,76.3,34.1,28,19.5,27.6,19.5,27.8,19.7,27.9,19.6,27.6,19.7,28,19.7,27.6,19.5,28,19.5,27.6,19.7,27.6,19.7,27.7,19.5,27.6,19.5,27.9,19.7,11.4,37.2,10.6,37.7,11.2,37.7,10.9,37.6,72.9,29.4,73.7,28.9,73.1,28.9,73.4,29,77.1,48.3,77.8,47.8,77.3,47.8,77.6,47.9,37.5,19.8,37,19.1,37,19.6,37.1,19.3,23.2,85.2,23.7,85.9,23.6,85.4,23.6,85.7,67.2,89,67.7,89.8,67.6,89.2,67.6,89.5],"r":[11.2,74,11.1,73.7,11.1,74,11.2,73.7,67.3,24.2,67.1,24.4,67.3,24.4,67,24.2,41.6,75,41.4,75.2,41.6,75.2,41.3,75,75.6,59.2,75.4,59,75.4,59.2,75.6,58.9,73.3,21.6,27.7,44,27.5,44.2,27.8,44.2,27.4,44,49,31.2,48.9,30.9,48.9,31.2,49,30.8,45.5,53.8,45.2,53.9,45.5,53.9,45.1,53.7,73.8,86.5,73.6,86.7,73.8,86.7,73.5,86.5,18.2,18.9,18.3,19.2,18.3,18.9,18.1,19.2,27.7,19.6,27.6,19.6]};/*@@S43-CHESTS-TILL@@*/
// Сундуки fortnite.gg для приближенной точки лута руками (s42, r5, r6), tools/build-loot-chests.js.
/*@@LR-CHESTS-FROM@@*/const CC_LR_CHESTS={"s42":{"n":[28.2,66.8,24.8,63,32.6,18.9,36.3,19.1,35.4,19.8,32.5,22.3,58.9,43.9,58,42.5,59.6,42.7,77.1,24,81.4,87.8,78.8,86.2,51.6,71,52.8,67.7,55,42.8,53.6,21.3,53.6,20.8,56,22.8,56.7,22.7,56,19.9,53.8,20.3,74.5,82.6,75,84,74.7,83.6,74.9,83.8,74.6,83.7,74.7,84.2,74.7,84.2,74.5,83.7,76.3,84.1,73.5,84.1,73.7,82.8,73.8,83.6,73.7,84.3,74.1,84.5,52.9,49.4,52.9,49.4,52.9,49.4,64.9,66.9,64.8,67,61.8,63.5,68.1,54.2,65.8,56.9,66.4,57.8,66.6,57.2,67.9,54,67.6,54.5,30.1,47.2,29.4,46.5,30.7,45.5,31.2,47.6,29.5,45.9,29.8,49.1,31.4,46.3,31.8,46.1,70,38.9,69.8,38.9,71.9,36.3,71.1,36.7,57.7,83.2,58.2,82.3,31.7,17,29.2,15.8,29.5,15.9,28.5,15,30.3,15.6,38.2,44.5,38.4,43.3,38.7,43.8,39.8,43.5,38.7,43.2,40.6,41.9,53.5,26.8,53.8,26.2,56.5,26.5,55.8,23,56.9,24.1,81.2,64.8,79.1,63.8,79.3,63.8,77.6,66.9,77.6,66.5,81,64.4,52,66.4,49.6,64.4,49.5,64.3,52.4,63.4,49.6,63.6,49.5,63.4,49.3,64.2,49.8,64.8,49.5,62.7,49.8,63,49,63.9,51.5,76.4,49.3,78.8,50.7,79.7,50.1,79.8,49.4,79.5,49,77.9,50.5,78.9,49.8,78.7,52.5,77.3,52.5,77.3,50.3,80.1,66.7,80.4,68.1,81.2,67.3,81.5,66.1,82,69.3,48.6,69.8,47.9,72.7,45.1,71.1,46.4,25.8,9.3,26.1,9,25.8,9,24.8,8.4,25.4,9.7,46.2,15.8,16,88.5,31.7,77.7,32,77.8,29.2,78.6,30.4,76.2,79.3,78.5,77.9,79.5,75.6,52.1,76.2,51.6,76.3,52,60.7,32.7,61,32.9,57.7,35.8,31.5,53.9,28.5,56.6,28.4,57.1,33.7,41.6,34.1,43.5,36.4,43.5,33.6,42.3,36.5,40.8,48,88.7,47.2,86.7,48.4,85.7,46.3,67.1,45.1,70.3,48.2,68,48.5,68.9,45.7,68.7,45.7,69.7,48.2,68.2,20.3,44.1,21.3,44.9,23.2,41.8,21.1,44.7,36,14.9,36.2,15,36,14.6,31.8,50.9,29.5,51.3,31.9,51.6,29.3,52.6,36.3,59.5,36.5,59.5,35.7,68.6,33.1,71.1,35.7,68.3,35.5,68.9,34.6,67.5,65.3,80.2,66.8,79.2,88.8,54,77.1,38.2,74.9,40.5,61.8,76.3,63.9,77.6,73.4,58.7,73.4,59.6,73.8,59.1,73.7,58.9,73.4,59.4,52.9,49.4,81.7,89.3,81.6,90.2,63.3,83.5,61.7,80.8,41,80.3,42.3,78.6,44.2,78.1,60.4,48.4,58.9,46.2,60.5,45.2,57.6,45.4,60.1,48.2,59.6,47.8,60.6,48.3,60.4,49.1,59.9,49.1,59.7,48.9,60.1,48.4,37.2,81.3,37.9,80.9,37.9,80.8,36.7,82.6,37.9,80.4,38.2,82.2,38.3,81.1,38.1,81,37.9,81.1,38,81,41.9,75.2,42.1,74.9,41.9,74.9,30.6,31.7,30.8,30.3,68.1,28.4,67.6,27.7,54,59.7,65.5,26.9,65.6,23.7,66.7,23.3,53.8,63.8,58.1,69.5,57.4,68.8,58.8,70.2,59.3,67.4,73.2,41.8,73,41.9,72.1,41.1,61.8,49.5,62.3,49.7,62.6,51.5,61.3,51.1,61.1,51.2,62.6,51.1,62.1,50.6,63,51.1,63.3,50.4,62,51.5,61.3,52.6,61.9,52.6,64.4,53.1,42.2,62.4,44.6,59.7,41.1,60.3,43.8,60.2,43.7,60.3,40.9,60.3,82.9,24.3,82.6,23.5,81.7,23.2,58.8,63.4,58.1,63.1,57.9,63.3,60.3,65.8,58.9,66.9,19.9,67.1,73.2,58.6,73,58.9,73,58.5,72.9,58.9,69.5,61.3,43.9,45.6,43.8,45.4,42.5,66.2,41.6,65.3,47.2,48.1,46.8,48.7,48.5,46.2,47.8,46.2,45.6,47.8,45.6,47.8,39,59.6,40.3,62,37.2,61.1,37.6,61.6,37.5,61.1,38,62.3,54.5,83.1,55.1,81.6,54.5,80.7,54.6,80.7,64.2,44.2,61.2,43.2,63.3,41.5,63.1,41.5,61.3,42.9,49.9,57,49.2,57.4,50,56.5,50.5,84.2,49.1,81.8,49.2,83.2,50.5,80.5,50.5,84.1,61.5,46.3,62.6,49.1,62.8,48.4,61.5,48.5,53.3,56,54,35.3,54.6,34,55.1,34.3,73,25.5,72.6,25.8,48.6,50.8,47.3,51.1,47.9,50.2,35.1,47.7,33.2,46.4,34.6,47.7,35.6,46.2,33.5,49.3,35.4,46.2,35,49.2,33.5,46.9,33,45.2,33.3,45.3,31.7,63.9,30.2,65.4,73.3,55.5,72.2,54,73.3,55.9,71.5,54.2,55.5,38.7,56.1,40.5,52.5,59.7,28.5,67.6,29.5,67.8,29.6,68.8,28.5,69.2,29.7,67.6,29.8,68,29.6,67.4,28.4,67.9,29.9,68.9,23,76.3,23.2,78.1,21.4,76.3,21.4,76.5,21.3,76.7,41.8,26.3,42.8,26.3,40.8,26.5,42.3,26.4,51.7,23.3,50.4,23.3,26.7,36.1,24.6,33.1,26.3,32.8,25.6,35.6,72,32.9,72.8,32.6,70.8,31.9,71.1,32.4,73.1,33.8,72.5,33.8,72.8,34,70.1,32.1,32.5,49.6,32.6,50.5,34.1,51,35.7,51.2,35.3,52.2,53.5,50.5,54.2,52,56,51.9,56,51.5,53.8,50.7,53.9,52.7,53.8,50.9,53.8,51.4,54,51.6,55.9,51.8,46.6,66.9,48.7,62.8,48,64.9,45.1,64.4,46.9,65.2,48,63.2,48.6,64.6,45.5,65.1,45.8,66,46.8,62.8,46.6,63.9,46.8,65,47.3,64.1,48.4,64.9,48.2,62.9,47.6,63.9,47.5,63.3,45.5,66.2,41.5,50.3,43.9,50.2,43.5,50.1,44,51.5,43.1,53.8,42.6,53.3,58,51.2,59.3,50.6,59.8,50.6,59.6,50.9,59.5,49.5,60.7,50.8,60.9,50.8,60.4,51.6,60.5,49.5,53.1,12.1,53.4,11.2,77.8,84,79.5,81.8,62.8,57,62.2,56.3,63.3,54,63.4,54.5,70.3,75.1,69.4,73.3,70.4,72.5,70.8,72.5,71.4,75.3,70.3,72.9,70.5,73,71.6,71.7,70.4,72.9,69.4,72.4,69.3,71.6,30.9,38,32.2,38.8,29.6,36.4,28.5,38.8,32.3,38.4,31.4,37.5,28.9,40.1,41.2,43,41.2,43.9,49.4,48.7,50.2,49.2,50,46.7,49.3,47.2,50.8,48.4,52,47.9,52.1,45.8,51.5,46.6,51.8,45.7,49.4,49.1,49.3,48.9,37.9,36.4,39.7,40.4,73.6,48.7,75.7,45.5,43.1,28.6,42.4,30.7,42.2,27.8,42.4,27.9,26.1,11.9,25.4,11.6,26.4,9.9,26.9,14,82.3,22.4,60.6,31,60.3,29.5,60.4,30.2,61,31.3,55.1,48.1,79,58.5,79.3,58.5,79.2,58.5,79.1,58.7,79.4,61.9,81.1,23.3,62.1,21.9,61.8,22.7,63.3,22.8,63.6,22.7,63.5,21.9,61.8,22.2,64.2,22.4,64.6,22,62.1,22.6,61.1,21.5,64.5,19.9,64.5,19.8,25.4,50.9,18.8,84,19.7,81.6,19.8,81.3,55.8,29.2,54.9,29.7,56.3,29.9,56.4,31.3,54,30.4,56.7,30.2,56.7,30.6,24.8,47,25.1,47,27.9,48,25.5,46.3,25,46.8,67.2,40.7,46.3,12.5,46.2,11.8,45.6,12.5,25.7,62.4,27.6,62.3,27.4,62.5,73,85.8,73.2,84.8,52.9,49.4,24.2,53.4,22.1,52.1,21.8,52.4,21.5,50.2,21.2,50.1,22.1,52.3,22,49.9,38.8,24.4,37.4,23.4,37.1,23.1,36.7,25.8,57.5,23.9,57.5,24.6,57.3,23.3,22.4,64.6,23.7,66.9,73.6,56.5,76.4,55.3,77.3,53.8,75.6,54,25.2,70.5,25.4,70.7,25.7,67.4,25.3,67.5,25.6,69.9,25.8,69.4,25.5,69.2,25.5,69.2,25.4,69.4,28.1,67.5,28.2,68.7,25.5,70.6,25.6,70.5,25.3,71,27.7,68.6,28.1,68.8,25.4,67.5,25.7,67.6,25.4,67.5,24.8,67.6,25.5,68.3,26.6,69.3,27.4,69.9,26.5,67.2,20,33.5,20,34,19.7,32.1,18.6,33.8,18,33.8,18.6,33.1,32.9,26.4,33.6,26.3,34.5,26.2,36.4,25.2,35.7,24.4,18.7,31.4,16.7,30.1,16.7,31.2,15.8,38.2,15.3,37.8,23.8,36.4,23.1,39.5,23.9,37.3,23.5,38,20.3,38.6,18.1,66.5,87.6,21.6,86.3,22.3,46.6,21.6,45.6,21.3,15.4,72.6,16,72.8,15.9,72.3,49.8,40,49.8,38.4,49.6,39.5,51.8,38.3,49.7,38,43.9,18.5,44,20.5,47,24.2,47.6,23,46.8,26.5,46.1,27,49.4,18.7,51,21.4,50.8,21,50.5,21.4,40.3,30.7,40.2,30.3,39.6,29.1,39.2,31,38.7,29,64.8,29.8,62.8,30.3,65.1,29.7,64.8,29.7,64.4,28.3,37.1,65.8,38.5,63,53.2,17.6,46.2,59,46.1,61.1,45.9,61.7,47.2,61.7,38.9,53.4,38.4,50.8,37,52,39.7,50,37.5,53.1,34.6,73.5,32.5,72.7,33.2,75.1,22.6,58.2,20.9,57.7,21.2,57.2,26.9,44.7,27.5,43.7,25.6,41.3,64.9,36,63.7,35.2,72.6,31.7,73.1,30.8,81.9,58,81.6,57.6,81.7,56.6,83.3,55.1,82.8,54.2,81.9,53.9,82.6,53.9,82,55.2,82.4,55.5,81.9,53.9,83,54.6,82.7,54.1,82.8,54.4,82.4,55.2,81.9,55.4,81.7,55.4,82.6,55.3,82.1,57.7,82.6,54.2,82,57.3,82.6,57.9,82.3,54.4,81.8,63.9,58.4,73.6,60.2,74.7,59,21.1,59.8,20,60.5,19.4,57.2,22.6,75.7,77.1,76,78.4,76.3,78.8,75.9,78.3,72.9,83.2,73.2,82.7,73.2,83.6,72.8,83.5,72.7,84,70.7,83.2,70.8,83.5,70.7,83.6,70.6,83.1,70.3,83.5,72.8,82.5,72.9,82.7,72.8,84.3,73.1,84.5,71.3,83.6,71.4,84.3,70.3,83.3,70.4,83.1,64.5,73.8,61.9,74.3,61.6,74.3,63.4,75.6,62.4,75.6,61.7,73.9,61.1,74.3,62.3,74.5,61.9,74.3,61.9,74.1,45.6,43.3,65.5,38.5,67.5,38.2,66.4,38.9,68,36.2,65.4,36.5,68,38.9,67.1,39.6,28.8,60.4,28.5,58.9,30.1,59.2,65.7,70,68.9,67.9,68.4,69.5,67.7,70.5,68.3,69.3,66.2,68,67.4,70.4,65.7,67.5,65.9,67.5,65.3,67.4,65.5,67.6,68.6,70,66.7,70.5,69.2,70.6,68.1,70,68.8,70.4,66.7,70.4,67.8,68.4,68,68.6,68.5,69.1,68.1,69.1,68,70.2,52.9,49.4,67.5,53.8,67.3,51.8,37.6,56.4,34.6,81.7,33.8,82.1,33.4,81.5,66.2,47.4,66.6,47.4,66.3,47.5,50.2,73.4,25.4,78.2,25.3,78.2,26,77.7,25.2,78.4,24.5,79.7,27.9,76.3,82.4,28.2,82.1,30.6,83,30.7,43,33.4,42.1,36.1,42.8,35.6,42,35.4,44.6,35,40.9,32.5,43.4,35.2,43.5,35.4,43.2,35.4,44.5,35.4,43.2,35.5,43.5,32.6,42.7,34.9,42.5,35.4,41.7,35.9,44.5,35.9,43.9,34,41.7,33.2,44.2,32.6,44.6,35.1,60.2,38.6,60.5,38.1,60.1,38.9,80.8,54.1,78.2,56.8,81.1,54.9,78.6,55.1,78.7,55,81.3,54.8,80.1,55.8,77.5,54.1,80.9,53.9,79.1,56.2,81.4,54.6,77.7,29.7,78.1,29.6,79,29.6,78.4,29.9,78.9,29.1,78.4,29.7,64,37.3,28.2,56.2,25.9,54.2,24.7,55.6,25.3,53.8,74.5,85.3,22.2,59,21.7,59.5,22.2,58.5,22,59.3,20.6,59.1,36.1,37.1,36.4,38.6,35.3,36.7,35.2,37.5,84.3,42.7,84.3,42.3,84.5,42.5,78.4,50.1,81.3,53.4,79.5,50.4,85.2,51.7,84.1,53.5,84.1,53.4,82.2,53.3,82.1,53.8,84.1,53.4,78.8,74.4,78,73.2,77.6,74.7,77.6,74.2,77.5,73.9,77.9,73.5,31,81.8,30,82.9,31.7,80.4,63.3,87.1,64.6,86.6,63.5,86.2,63.8,85.6,64.9,86.7,20.1,58.7,19.2,59,18.9,59.1,17,40.2,18.5,40.1,17.5,38.8,17.7,39.7,61.8,24,61.8,24.5,62.1,25.2,63.4,24.5,64.2,24.5,64.5,24.1,63.8,23.1,64.1,23.4,63.1,23.5,63.2,25.2,61.6,23.6,61.6,24.2,61.3,24.3,62.4,25,63,24.8,63.4,23.4,61.6,24.4,62.1,25.6,62,24.8,65.1,23,64.6,24.8,64.3,25,50.4,42.1,48.9,40.7,49.2,43.6,48.8,43.5,23.7,35.3,22,35.4,21.8,33.1,21.6,32.7,22.2,32.5,20.8,32.2,21.1,32.6,22.5,34.3,22.1,34.2,21.4,35.4,21.4,35.1,24.2,33.4,21.2,34.1,20.9,33.2,33.3,79.2,29.4,75.4,30.2,74.3,30.5,75,33.1,30.3,23.5,71.1,23.7,68.5,46.2,81.7,47.4,81.8,47.6,81.9,47.1,81.7,47.1,81.9,48.6,82.1,47.6,80.4,48,80.4,46.5,80.3,46.1,80.5,52.9,49.4,69.6,78.2,20.2,72.7,48,90.7,19.5,74.3,19.8,74.3,17.5,73,16.2,72.6,18.4,86.5,16.9,87.8,17.2,87.2,17.8,87.1,16.4,87.3,17.1,85.1,16.7,84.9,16.1,88.7,29.3,24.3,28.5,25.1,29,26.7,30.4,24,29.6,27.2,31.1,26.2,29.4,25.7,77.8,67.4,77.8,67.4,35.7,55,34.1,55.3,32.5,55.1,35.1,55.5,81.3,89.7,19.4,42.6,18.4,40.9,16.7,40.8,88,41.7,87.7,41.6,46.5,79.3,46.2,79.6,46.3,79.3,46.4,79.6,46.6,78.7,46.9,78.7,47.3,78.8,48.8,78.6,47.9,79,48.5,77.6,47.7,80.1,47.7,80.2,45.6,80.1,46.2,80.2,44.8,78.7,42.2,56,42.2,57.2,44.3,56.7,44.4,55,43.8,54.1,49.4,28.2,49.8,28.3,49.5,28.1,50,27.8,49.8,28.1,49.6,28.3,50.2,28.2,50.4,27.6,50.2,27.4,51.1,27.6,51,28.2,51.2,27.6,49.6,28.1,49.5,28,49.8,27.9,49.8,31.6,50.5,28.6,50,27.6,50.3,28.3,50.6,28,44.9,57.4,46.5,56.6,30.1,41.1,32.2,43.6,59.7,56.4,58.9,56.3,60.6,57.7,58.4,54.7,58.9,54.1,59.1,54.4,71.2,65.4,72.2,64.3,37,74.6,40.4,72.6,37.9,73.7,43.5,39.1,44.4,38.8,44.1,40.1,43.8,40.1,43.4,40.1,43.4,37.5,44.1,36.9,44,38.4,44.2,37.5,44.1,38.3,41.4,37,42.3,36.5,43.8,39.1,42.6,38.1,44.5,38,44.5,37.5,43.5,39.4,44.7,18.4,41.2,14.9,41.3,15.3,41,15.5,40.7,15.2,30.8,12.8,30.9,13.4,45.7,37.3,47,37.4,46.4,40.1,44.7,39.6,44.9,36.6,47,36.8,47.2,37,46.8,37.3,45.5,37,45.6,37.3,45.6,37.2,45.7,37.1,47,37.2,46.8,37.3,45.7,39.1,45.2,39.5,40.3,46.7,38,46,36.7,48.1,38.1,35.6,38.2,33.9,36.8,35.2,36.9,35.4,36.7,35.4,40.4,32.6,39.3,32.4,39.4,32.8,39.6,33.1,65.4,35.6,65.3,35.6,74.8,44.6,75.2,41.9,77.3,42.9,74.9,42.5,60,79.7,59.2,79.5,59.2,78.6,59.4,78.3,58.9,78.5,58.6,79.4,59.4,78.5,59,77.6,36.8,12.5,37.7,11.9,39.2,11.6,37.3,12.2,70.7,67.9,72.2,68.9,70.2,70.3,70.5,67.4,70.5,68.2,70.3,67.6,70.4,67.9,70.5,68.5,71.6,71.4,70.4,68.6,72.8,68.4,69.9,67.7,83.4,59.9,24.6,37.2,27.7,38,25.6,39.2,24.4,36.7,24.5,38.5,28.1,37.6,68.1,71.9,68.6,73.8,66.5,74.1,66.5,74,79,48.5,81.3,45,43.4,82.6,43.3,82.5,68.5,18.6,34.8,65.2,34.6,65,26,80.7,26.9,83,27.2,81.8,26.6,82.3,25.7,82.8,25.8,82.2,26.8,81.6,26.2,82.1,25.8,81.5,25.8,82.1,26.4,81.7,26.8,81.1,74,34.7,73.8,32.5,75.6,33.5,76.1,33.7,74.9,32.2,75.5,32.1,75.2,32.7,74.9,31.9,75.4,32.8,73.5,70.8,31.1,20.8,30.8,21.1,30.9,20.8,29.1,19.9,29.4,20.3,29.3,19.6,29.8,19.9,77.9,42.1,80.9,44.7,77.7,42.9,80.7,42.1,80.3,43.4,80.9,43.4,81.5,42.3,80.3,43.4,80.6,41.5,76.9,31.7,76.4,31.2,76,30.6,76.4,28.5,77.3,29.7,76.3,29.3,73.6,31.1,75,29.7,72.3,53.6,72,52.6,72,52.6,72,52.4,40.2,16,38.9,15.9,38.7,16.3,38.7,16.9,38.2,17.2,38.2,16.1,38.6,16,38.1,17,38.1,16.4,38.4,16.5,39.9,16.5,38.4,16,39.6,14.6,39.5,14.4,39.6,15.2,37.8,15.5,40.2,14.7,40.3,15.5,37.5,17.2,37.9,17,39.8,14.2,47.6,32.8,48,32.8,45.7,35.6,45.2,35.2,45.2,35.2,45.8,35.3,45.3,35.3,45.4,33.6,48,33.2,47.5,32.6,46.9,32.1,48.2,33.6,60.3,60,57.2,58.9,63.1,68.9,64.2,68.7,65,67.8,64.8,67.5,64.8,67.5,64.8,67.2,64.8,67.2,61.7,68.9,39.8,71.4,38.8,69.1,39.3,68.6,38.6,68.6,38.8,68.5,39.1,68.8,38.3,69.1,23.9,49.3,24,48.9,21.5,45.1,22,45.3,55,74.9,54.8,74.5,55.2,73.6,56.7,71.9,56.6,74.7,54.2,74.5,55.7,73.6,55.7,73.7,55.7,73.4,54.9,73.2,55.8,73.2,54.7,72.7,54.1,72.5,53.6,74.1,54.9,74.4,55.3,72.6,55.5,72.6,53.6,72.9,50.6,34.8,77.6,32.4,33.1,33.9,32.5,32.5,67.8,60.9,65.6,61.3,68,61.1,66.5,60.5,37.6,22.4,36.8,20.1,37.2,19.9,37.1,19.6,37.6,20,36.8,20.2,40.1,18.6,37.4,21.7,49.7,50.2,51.9,49.7,50,52,49.3,53.5,13.5,70.2,76.9,64.4,29.3,33,32.4,32.4,27.9,14.6,50.5,17.1,49.9,16.8,49.9,17.2,50.8,16.5,51.7,15.1,51.8,15.7,51.8,16,51,15.8,50.7,15.7,51.3,15.7,51.8,15.3,68.4,86.6,67.8,86.7,19.8,52.2,19.6,52.5,40.6,77,37.2,79.6,75.6,72.9,77.3,73.4,77.2,73.9,77.2,74.6,77.3,74.5,73.4,72.7,73.5,72.6,65.5,66.9,68.2,65.9,68,64.6,65.7,67,65.2,66.8,65.3,66.9,65.9,66.5,68.5,64.3,66,66.6,56.5,77.7,53.7,79.5,54.5,77.4,68.7,17.5,68.8,17.5,53.1,42.1,52.7,78.5,48.9,78.8,66,81.3,31.3,56.7,28.5,55.4,29,50.8,30,52.3,24.2,9.4,61.5,49.4,58.3,63.5,58.5,63.3,57.8,66.8,58.2,66.7,57.3,66.7,37.7,61,37.7,61.3,38.2,61.6,87.9,21.2,44.5,25.1,35.8,49.1,29.7,68.9,35.9,50.2,45.4,65.6,43.1,53.2,70.5,72.7,30.9,38,57.5,28.1,27.2,53.6,66.1,42.5,17.9,77.8,18,66.1,46.7,21.2,46.4,23.5,46.2,24.1,36.5,31.6,40.2,53.3,34.9,72,35.6,72.9,70.5,83.2,69.1,38.6,32.9,80.4,81.3,54.3,78.5,55,35.2,37,32.2,82.2,51.5,42.1,50.2,86.2,35.8,28.4,16.4,72.7,19.4,57.4,33.9,56.6,48.4,53.9,44.7,57.1,29.1,41.5,30.8,42.5,71.5,64.7,65.2,35.9,44.7,84.7,32.5,64.7,26.5,81.8,27.1,82.8,26.8,82.7,30.9,21.2,39.9,18.3,38.6,70.8,32.4,32.6,12.3,68.6,74.5,62.8,26.7,14.4,65.4,88.4,19.3,52.7,46.9,37,47.1,37.1,47.2,37,47.1,37,46.9,37,47,37.1,46.9,37,47.1,37.1,47.1,37.1,46.9,37.1,47,37,46.9,37,47.2,37.1,47,37.1,47.2,37.1,46.9,37,47.2,37,47,37.1,47.2,37,47,37],"r":[74.7,84.1,74.7,84.1,52.9,49.4,66.1,78,48.4,63.7,48.2,64,48.1,63.8,46.7,21.1,46.4,21.4,34.6,80.6,80.5,54.3,31.5,82.5,55.8,73.4,55.8,73.5,47.1,37,47,37.1,46.9,37.1,47,37.1],"a":[81.3,89.1,52.6,67.8,55.9,22.7,74.5,84,75.1,84.4,74.5,83.9,74.6,83.9,74.6,83.8,74.7,83.6,74.6,83.9,75,83.8,73.8,82.9,74.8,84.2,74.8,84.1,74.7,84.1,74.8,83.8,73.4,84.2,74.6,82.2,73.7,84.1,73.3,84.5,74.4,82.5,74.4,83.9,64.8,67,66.4,56.8,65.8,57.3,67.8,54,68,54.7,31.6,46.1,70.3,38.4,69.8,38.8,29.3,15.6,29.1,16.3,28.4,15.2,30.3,15.5,29.6,15.9,29.4,16,39.7,43.5,39.1,42.9,56.7,23.8,78.4,66,77.8,66.5,81.2,64.6,49.4,65.1,49.9,63.1,49.9,64.7,49.4,63.4,49.6,64.1,49,64.5,49.6,63.4,49.6,64.4,49.8,64.8,49.8,63,49.6,64.4,49.6,63.4,49,79,50.3,79.9,49.5,80.2,48.9,78.9,48.8,78.9,48.9,78.9,48.8,78.6,49.3,79.7,67.4,80.7,71.1,46.5,25.6,9.5,25.8,9.5,26,9,24.9,8.9,25.9,9.2,45.9,16.9,31.1,77.7,32.1,79.5,75.7,52.1,76.3,51.8,76.1,51.5,60.6,32.8,48.2,85.8,48.4,87.7,48.4,68.2,48.4,68.6,48,71.2,45.6,70,45.3,68.8,21.9,44.6,21.4,44.8,36.1,14.7,36.3,14.9,28.8,50.9,66.6,80.3,66.3,78.3,65.6,80.3,65.2,79.2,24.2,9.1,81.6,89.9,82.7,90.1,81.6,89.3,41.8,78.7,44.1,78.3,60,49.2,58.9,48.6,59.2,47.7,60.3,49.4,60.4,49.2,59.9,48.5,36.8,82.7,38.2,81.7,38,81.2,38.2,81.1,37.9,80.9,38.2,81.2,42.2,75.5,41,74.3,42.9,73.8,44.1,71.5,54.2,59.7,53.5,63.9,53.8,63.8,57.7,67.4,57.3,69.5,59.2,67.5,72.1,42.3,62.4,51.5,62.5,51.5,62.6,50.9,61.8,50,61.1,51.5,61.6,52.5,61.2,51.3,63.3,50.5,61.1,50.7,41.3,59.9,41,60.5,82.7,24.2,58.6,63.3,58.2,63.6,58.4,63.3,58.1,63.2,58.2,63.3,58.1,63.6,73.2,58.8,73.3,59.4,73.3,59.2,73,59,73,60.3,73.2,58.5,42.5,66.2,41.2,65.1,48.5,48.2,37.6,61.6,37.6,61,37,61.1,37.7,61.4,37.6,61.3,37.3,61.3,54.5,80.8,54.5,80.6,61.4,42.7,63.2,41.5,49.6,56.4,49.8,57.4,50.6,84,50.3,80.5,49.1,81.8,49.1,81.9,49.1,83.1,61.3,49,61.3,48.3,62.6,49,62.7,48.5,53.5,55.7,48.6,49.9,47.2,51,31.5,62.8,29.4,63.3,28.8,66.5,72.4,53.8,72.9,57.8,71.4,54,55.5,38.6,55.3,38.4,55.6,38.8,49.2,62.6,28.5,67.9,28.8,68.8,29.7,67.6,29.4,67.4,29.7,67.9,29.5,67.6,28.4,67.1,28.5,67.6,30,69.2,29.6,69.1,28.5,70.4,51.1,27.3,50.7,23.9,25.8,34.2,72.6,35.1,72.1,33,72.6,34,72.1,33.1,72.1,32.8,71,32.6,70.9,31.9,56.1,51.6,54.4,52.4,53.8,52.5,53,50.5,53.8,51.5,53.4,51.3,53.9,50.8,46.8,65.4,45.4,65.9,45.7,66.3,48.1,64.7,48.6,63.1,46.9,64.1,46.9,63.6,48.3,62.8,48.1,65.4,48.2,63.8,48.6,64.5,48,63.3,48.4,64.1,47.4,64.8,46.7,64.4,47.6,63.1,47.2,64.8,47.2,63,42.6,52.8,43.5,53.6,43.5,53.1,59.6,51.6,60.5,49.7,59.1,50.9,58.9,50.6,60.9,51.1,62.9,56.9,63.3,54,70.4,72.7,70.5,72.7,69.5,71.7,70.6,72.9,71.1,71.7,32.1,38.4,30.9,37.9,41.4,44.2,50.2,48.1,52,45.6,38.1,36.3,42.3,30.6,42.6,27.8,26,11.7,82,22.8,81.9,22.9,79,58.4,79.2,58.3,79.2,58.5,79.3,62.1,81,22.9,64.2,22.9,64.1,22.7,62.9,22.8,61.9,22.4,62.1,22.2,62.6,22.4,62.4,22,63.8,22.5,61.9,22.5,62.4,22.6,62.4,21.8,25.3,51.1,56.6,30.2,55.5,29.5,55.6,27.6,25,46.9,25.1,48.6,25.6,47,25,47.1,66.6,41,27.5,62.6,73.3,85.3,36.9,25,37.2,23.1,37.1,23.1,36.7,25.8,73.5,55.7,76.1,57.9,25.4,71,25.3,71,28.2,67.9,28.1,69.1,28.2,67.4,28.4,67.6,25.7,67.4,25.7,67.5,25.5,67.4,25.7,69.3,25.9,69.1,25.8,67.9,25.8,68.2,25.4,69.5,26.7,67.7,27.8,67.8,26.7,69.8,24.9,68.1,24.7,70.3,25.3,70.5,25.4,70.6,25.2,70.7,25.5,70.5,19.6,33.4,34.8,26.3,23.9,36.7,23.8,37.1,20.7,39.5,17.9,66.3,15.8,72.8,16,72.5,49.4,39.1,49.8,40.1,43,22.8,44,20.8,47.5,23.1,46.3,24.1,46.4,23.5,50.9,21.5,50.7,21.2,63.8,29.9,61.3,31.3,64.4,28.4,38.5,62.8,37.2,65.9,38.5,65.7,46.7,62.4,48.1,62.4,35.5,74.5,25.7,41.8,72.9,31.6,81.6,54.5,81.9,54,82.2,57.6,82.3,53.9,81.8,54.2,82.1,55.5,82.9,54.4,81.8,54.6,82.4,54.8,83.1,54.3,82.9,54.3,82.7,54.2,82.5,53.9,81.9,53.9,82.5,55.3,81.8,55.3,81.7,55.3,82.4,55.5,81.8,57.3,81.9,56.7,82.4,53.9,81.9,58,81.8,57.9,81.7,64.3,60.8,74.9,59.1,20.8,76,78.3,76.2,78.3,75.9,77.2,76.4,78.8,72.9,83.4,70.7,83.2,70.5,83,70.5,83.1,70.3,83.5,70.8,83.5,70.8,83.1,70.4,83.9,72.7,83.2,72.8,83.5,73,82.3,73.1,82.8,73.2,84.5,72.9,82.6,73.3,82.8,73,83.3,72.5,83.8,72.9,84,72.7,82.9,71.2,84.3,73.1,84.2,73.1,84.6,70.9,83.4,61.8,74.3,61.2,74.6,62.2,74.3,61.3,73.9,61.9,74.2,61.9,74.3,48.7,43.2,68.9,38.7,65.7,38.4,65.4,38.8,65.5,36.5,67.5,40.1,67.7,38.9,28.5,60.3,29.9,59.3,69.1,70.1,68.4,69,67.3,70.3,65.9,68,67.4,70.4,68.8,70.5,65.3,67.6,65.2,70,65.7,67.2,65.4,67.1,68.1,71.1,67.4,68.3,67.8,68.2,66.6,70.2,67.3,69.9,68.2,69.9,67.6,70.8,68.3,69.2,32.9,80.5,34.6,80.6,66.4,47.5,66.3,47.3,25,78.4,25.6,77.8,83,31,82,30.9,43.1,35.4,43.7,34.9,43,35.3,44.5,35.3,41.9,36,41.6,35.6,42.6,34.9,43.1,34.9,42.3,35.7,44.3,32.7,40.7,32.7,60.5,38.1,60.1,38.9,80.3,55.9,78.8,58,81,54.6,77.9,29.8,77.9,29.5,77.9,29.6,78.4,29.8,79,29.8,22.5,58.4,22,58.3,20.7,58.9,21.8,58.9,22.3,59.5,21.9,59.1,22.1,59,35.4,36.7,36.3,36.9,36.3,38.7,35.2,37.2,84.4,42.5,81.5,53.6,80.1,52.2,81.1,53.7,85.3,52,81.9,53.7,84.3,53.4,78.9,74.4,77.5,74.5,77.5,74.6,77.5,73.4,77.9,73.9,77.9,74.4,77.6,74.4,32.2,82.2,64.7,86.5,64.5,86.7,63.3,86.9,63.1,86.4,63.9,85.1,64.2,86.4,19.2,58.9,19.9,58.9,19.7,58.7,17.5,39.9,17.4,38.6,16.8,39.1,20,38.9,64,23.1,64,22.9,63.9,23.3,63.2,23.3,63.4,23.3,62.6,23.2,62.6,24,63.6,25.1,63,24.9,63.4,24.6,63.4,24.8,62.2,25.2,62.1,25.2,61.7,25,62,24.5,61.5,24.1,61.5,23.7,63.1,24.7,61.7,23.7,61.7,23.7,62,24.2,61.3,23.9,63,24.7,63.4,23.9,64.1,23.1,51.6,42.1,50.7,42.1,49.1,43.6,21.2,33,21.1,32.6,21.1,32.9,21.7,34.3,21.8,32.5,21.2,35.4,20.8,33.3,20.9,34.2,21.2,35,21.2,33.7,20.9,33.4,22,34.9,21.1,35.4,36.4,78.6,33.6,79.3,30.8,72.7,29.7,73.8,23.5,70.8,47.5,81.7,47.2,81.7,47.9,80.4,46.2,80.4,48.5,82.1,48,90.7,19.3,74.4,16.4,72.5,16.4,72.8,16.3,72.6,17,72.5,16.4,87.1,16.5,87.4,17.8,86.9,17.8,87.2,16.1,88.7,16,88.6,29.4,25.7,29.5,26,81.2,90,16.9,41.1,47.3,78.7,46.2,79.5,48.7,78.5,48,80.1,44.9,78.3,44.4,57.4,44.6,57.1,42,55.6,43.3,54.2,49.7,27.8,49.7,28.2,49.7,28.5,49.8,28.1,50.9,28.5,51.2,27.7,50.1,28.3,50.8,28,51.3,27.9,50.8,27.5,49.9,28,49.8,28.3,49.5,28.3,49.8,31.5,50.4,27.7,44.6,57.8,60.1,57.6,59.1,57.6,59.7,56.8,36.5,72.4,42.1,37.1,43.8,39.9,43.7,40,44,40.2,43.6,37.6,44.4,37.5,43.7,37.4,44.5,38.8,41.5,36.7,42,36.6,44.4,39.4,43.1,39.7,43.7,39,43.5,39.1,43.4,39.1,42.7,38.2,44.5,37.5,43.9,40.2,41,15.5,41.2,15.4,30.7,13.1,30.1,12.9,30.7,12.9,46.8,37.2,47,37,46.8,36.9,47.4,36.4,44.8,39.4,44.7,38,47.1,37.5,45.6,37.3,44.7,37.9,47.8,37.5,46.7,36.8,46.6,36.2,38.3,35.7,65.3,35.9,65.2,35.9,65.2,35.6,76.8,42.7,75.2,42.8,26.6,85.4,59.2,78.2,59,79.9,59.1,78.9,60,79.8,59.4,78.9,59.5,78.6,59.3,78.5,59,78.4,69.6,67.7,70.5,67.2,70.3,68,70.6,68.3,70.7,67.2,83.5,60.1,27.8,38.1,79,48.8,43.8,82.1,42.6,80.6,35.7,67,25.9,81.8,26.5,81.8,26.5,81.8,26.7,81.3,26.4,81.5,27.3,81.9,26.9,81.9,26.1,82.5,26.1,82.9,25.7,81.8,75.5,32,75,33.2,73.7,33.1,74.6,33.4,74,34.7,76,33.4,75.5,32.4,75.2,32.6,76.1,33.8,74.1,32.5,73.8,32.4,76.8,32.2,30.8,21,30.5,21.2,28.8,19.9,31,20.9,31,21.1,29.2,19.5,29.5,20.2,80.4,42.4,80.3,42.8,80.9,44.2,77.7,42.7,81.2,42.1,80.9,43.5,80.4,43.6,76.2,29.5,77,30.8,75.1,29.6,73.7,30.8,76.5,28.5,75.6,30.6,72,53.8,38.4,17,40.2,14.8,40.2,16.1,38.6,16.9,37.2,16.8,38.1,17.1,37,17,36.8,18.4,40.2,15.4,38.1,16.3,38.4,16.5,38.4,16,39.6,14.8,39.6,14.3,47.2,73.6,46.8,74.6,47.4,35.6,45.4,35.3,44.6,35.7,45.3,33.8,46.9,35.7,45.1,36,45.8,35.7,48.4,34.7,45.2,35.9,59.7,58.4,59.8,59.1,64.8,67.5,65.1,67.9,38.7,68.7,38.8,69.1,39,68.9,39.1,68.8,21.9,45.4,21.1,45.1,55.8,74,54.6,72.8,54.5,73.2,54.8,74.4,55.3,73.3,55.6,73.5,54.6,72.7,54.9,74.6,54.3,73.3,54.3,74.5,51.2,35.2,32.5,32.5,32.5,32.5,67.5,60.5,37.8,19.7,36.9,19.9,37.3,20.2,36.8,19.5,37.2,18.9,49.8,50.8,77.3,64.3,27.7,14.9,51.7,16.2,50,16.8,51.6,15.8,51.5,15.8,51.8,15.3,51.7,16,50,17.4,50.8,15.6,67.9,86.8,19.5,52.2,20,52.5,19.9,52.3,77.3,74.5,73.5,72.1,65.9,66.6,65.5,67,54.4,77.1,68.7,17.7,68.6,17.7,47.2,37.1,47.1,37,47.1,37,46.9,37.1,47.1,37,47,37,47.2,37,47.1,37.1,47,37,47.1,37.1,47,37,47.2,37.1,47.2,37,46.9,37.1,47,37.1,47.1,37.1,47,37,47.1,37.1,47.1,37.1,47.1,37.1,47.1,37,47.1,37.1,47,37.1],"g":[53.1,42.1,52.7,78.5,48.9,78.8,66,81.3,31.3,56.7,28.5,55.4,29,50.8,30,52.3,24.2,9.4,61.5,49.4,58.3,63.5,58.5,63.3,57.8,66.8,58.2,66.7,57.3,66.7,37.7,61,37.7,61.3,38.2,61.6,87.9,21.2,44.5,25.1,35.8,49.1,29.7,68.9,35.9,50.2,45.4,65.6,43.1,53.2,70.5,72.7,30.9,38,57.5,28.1,27.2,53.6,66.1,42.5,17.9,77.8,18,66.1,46.7,21.2,46.4,23.5,46.2,24.1,36.5,31.6,40.2,53.3,34.9,72,35.6,72.9,70.5,83.2,69.1,38.6,32.9,80.4,81.3,54.3,78.5,55,35.2,37,32.2,82.2,51.5,42.1,50.2,86.2,35.8,28.4,16.4,72.7,19.4,57.4,33.9,56.6,48.4,53.9,44.7,57.1,29.1,41.5,30.8,42.5,71.5,64.7,65.2,35.9,44.7,84.7,32.5,64.7,26.5,81.8,27.1,82.8,26.8,82.7,30.9,21.2,39.9,18.3,38.6,70.8,32.4,32.6,12.3,68.6,74.5,62.8,26.7,14.4,65.4,88.4,19.3,52.7,46.9,37,47.1,37.1,47.2,37,47.1,37,46.9,37,47,37.1,46.9,37,47.1,37.1,47.1,37.1,46.9,37.1,47,37,46.9,37,47.2,37.1,47,37.1,47.2,37.1,46.9,37,47.2,37,47,37.1,47.2,37,47,37],"v":[29.6,68.9,70.5,72.9,51.3,42,30.9,21,32.8,48.2,65.1,35.8,54.8,73.6],"V":[62.4,49.5]},"r5":{"n":[38.5,73.1,75.2,85.3,75.3,85.4,47.6,80.2,31.4,70.4,29.8,70.4,28.9,74.8,64.2,19,43,86,44.3,87.1,41.7,87.4,28.1,72.8,27.2,74.1,26,74.2,70.1,83.9,71.2,83.9,71.7,83.5,72.5,84.2,68.1,84.4,69,84.2,69.5,84.3,27.9,75,25.9,77.6,26.3,78,61.6,64.6,69.9,71.6,68.1,70.9,69.9,71.3,67.7,71,69.1,72,67.8,70.9,69.1,71.8,67,70.9,67.8,71,66.7,70.6,68.5,71,66.9,71.9,21.4,90.8,15.5,65.9,16.8,66.4,18,66.4,30.9,77.7,28.9,75.5,17.5,63.9,15.9,65.1,15.6,63,15.6,64.1,70.8,44.2,67.3,43.3,65.7,44.3,68.2,41.3,65.8,42.7,70.5,41.5,21.1,18.8,25.6,14.8,22.8,12.2,74.8,48,50.7,17.6,52.4,14,71,17.7,48.9,42.4,48.9,42.7,52.3,45,55,40.1,55.4,40.2,55.8,43.1,80.7,36.3,80.8,36.1,80.4,35.4,81.7,35.8,78.3,29.9,79.4,35.6,82.4,35.2,18.8,42.5,17.9,39.3,17.9,38.7,18.4,39.1,18.4,38.4,45.4,74.2,45.6,73.4,45.1,66.1,44.8,66.4,30.3,20.1,30.4,21.9,33,22.2,33.8,24.8,33.6,24.7,34.3,24.6,35,25.6,35,24.8,34.1,27.8,33.8,27.8,32.5,28.5,29.4,27.9,30.9,22.6,28.6,26.1,28.7,26.3,30.3,22.7,31,22.5,31.3,25.7,32.8,26,31.7,23.7,30.1,26.2,32.1,25.4,33.6,23.9,29.3,20.3,31.4,21.3,32.9,22.7,29.8,24.3,32.9,22.1,36.2,22.5,36.6,22.6,34.3,25.7,30.1,21.4,30.9,20.8,29,22.8,30.9,19.9,34.1,27.3,32.5,24.1,31,27.6,48.2,21.5,55.5,27.9,54.4,27.9,53.8,28.1,54.8,28.6,54.8,21.3,53.7,21.3,54.2,20.3,54.8,21.3,50.7,48.3,47.9,48.3,48,50.7,47.7,54.3,47.6,50.9,47.1,52.8,47.3,51.7,47.1,53.5,47.9,52.8,48.7,54.3,47.2,51.5,49.7,50.1,48.9,53.4,47.1,55,38.4,29.8,38.3,31.3,44,32.5,38.7,33.7,40.9,33.3,45.8,29.9,38.5,37.4,61.5,28.7,62.6,34.7,75.3,84.6,74.8,84.3,78.2,87.6,18.6,55.8,28.3,23.1,24.5,21.2,28.2,22,27.4,23.4,21.5,26.8,20.2,22.1,27.6,19.6,28,21.9,47.8,73.7,48.6,71.2,46.8,69.7,40.8,7.8,26.3,58.7,19.5,61.5,24.5,59.2,25.4,58.5,28,57.6,73.8,25.6,68.2,20.9,74,25.3,66.7,28.9,66.8,28.9,48.5,85.3,50.1,86.5,67.3,35.9,66.8,35.9,71,37.2,71.5,32.4,52.7,78.9,50.4,81.1,49.3,75.8,33.3,71.9,34.3,72,33.6,73.1,30,68.9,28.7,72.2,37,72.1,33.4,73.7,19.2,14.5,18.7,16.5,68.5,61.6,67.5,60.6,74.1,59.5,42.9,87.5,46.7,87,42.1,84.6,41.6,85.2,44.6,85.4,46.5,84.9,45.5,85.6,45.1,85.3,43.5,85.3,45,84.9,38.8,91.5,46.7,85.6,46.1,85.2,42.9,84.3,44.5,84.7,43.6,85.1,43.8,85.2,45.5,84.7,42.3,87.2,41.3,85.5,42.2,85.1,38.5,84.9,38.1,88.6,59.3,10.1,57.8,10.5,19.9,34.9,20.8,29.2,28.2,29.1,43.8,58.3,46,65.7,38.3,64,38.2,63.8,45,60.8,64.6,89.2,64.5,88.5,64.6,88.5,20.1,41.8,24.2,44.5,23.7,45.1,22.8,41.7,19.5,42,19.7,42.9,22.2,42.3,28.4,38.4,35.3,94.1,74.1,47,73.9,46.3,67.2,41.3,70.4,44.1,69.9,44.7,67.7,45.9,70.3,43.9,66.8,42.5,72.6,43,67.7,46.2,70.8,43.4,66.6,44.3,69.5,43.4,36.1,52.2,35.8,52.5,35.9,85.6,29.9,87.8,30,87.7,39.1,47.3,39.4,47,43.2,39,42.1,38.6,43.1,39.2,45.2,43.9,40.8,41.3,78.5,60.7,75.7,59.2,78.4,64.7,75,56.8,75.5,57.9,75,57.3,75.4,57.1,74.6,57.1,74.7,57.9,39.3,21.4,44.6,20.5,45,25.6,27.2,71.5,27.9,71.3,22.5,71.7,24.4,68.4,75.6,27.3,76.4,27.9,81.3,71.6,80.9,74.4,74.8,72.3,81.3,71.5,35,60.7,32.3,60.9,32.1,60.8,33.1,61.3,32.3,60.5,33.1,60.2,32.2,60.8,36.9,57.4,32.4,61.7,58.5,49.9,57.3,48.8,57.2,49.7,57.4,49.5,57.1,49.9,61.2,50.9,72.5,83.8,71.5,83.5,65.4,76.8,69.1,81.2,70,81.9,72.6,81.2,67.9,76.5,71.1,76.8,69,76.9,69.7,76.1,71.8,76.1,68,76.6,69.7,76.1,73,78.3,71.8,79.1,71.6,78.3,72,78.4,72.3,78.3,73.5,78.3,73.1,79.4,72.8,78.3,70.4,78.5,68.7,79.4,67.6,78.3,70.6,77.7,68,79.3,68.8,78.3,69,78.3,68.1,78.3,68.7,79.5,69.5,78.3,73.4,76,74,75.7,71.2,83.8,65.4,75.5,66.2,81.2,72,75.8,69.6,79.2,68.4,78.4,74.4,75,70.3,84.3,66.8,84.6,67.5,84.8,68,84.8,69.7,87,64.6,73.3,64.5,72.8,64.5,71.7,57.9,69.5,58.6,72,57.1,69.7,62.5,66.4,56.9,68.1,32.5,35.9,30.5,29,32,29.5,29.2,29.6,32,36.6,30,32.1,30.9,31.9,28.9,29.5,36.8,30.9,36.1,10.8,36,10.8,33.5,16.9,33.1,11.3,35.5,17.8,30.7,19.4,31.1,13.9,30.9,18.6,30.5,17,34,11,33.2,18.7,34.8,45,36.7,38.3,43.9,11.7,40.4,18.2,44.9,15.3,37.6,18.2,84.4,37.7,44.1,83.3,39.7,79.9,46.3,79.8,45.4,80.8,44.3,78.7,44.2,80.7,43.1,81.2,42.8,80.7,43.4,80.4,43.9,81.2,43.6,81.5,42.3,79.8,43.8,79.8,44.5,80.6,19.6,75,23.6,84.1,22.3,80.9,61.5,63.7,63.7,62.8,59.3,63.1,60.8,57.6,58.3,63.5,60.8,63.6,64,61.7,58.2,61.4,61,62.4,58.7,59.7,63.4,59.6,84,79.9,83.7,79.8,63.8,42.8,63.4,44.1,78,18.4,77.8,18.6,45.5,50.4,45.4,51,46.5,53.6,45.3,53.7,45.3,56,43.7,54.4,41.3,52.3,43.9,50,46.8,49,44.1,50.5,41.8,50.5,44.5,55.4,41.3,50.5,43,49.4,41.7,52.6,46,54.3,42.8,50.5,41.6,50.6,40.4,51.1,42.7,55,45.3,49.1,41.4,53.7,46.5,54.2,45.2,48.4,43.8,47.9,43.8,53.6,43.4,53.7,43.7,52.2,43.2,51.9,68.1,73.9,66.1,71.3,71.8,73.2,67.2,66.9,68.4,71.9,69.4,70.7,71.5,74.2,71.8,71,68.7,67.7,74,72.3,73.5,73.2,73.6,72.1,82.7,80.9,74.9,81.2,82.8,81.5,75,75.2,23,86.3,24.1,85.1,21.9,87.1,26.2,54.7,28.1,50.5,15.6,66.1,19.2,70.9,32.1,76.4,34.3,75.9,29.8,75.9,30.6,75.4,30.6,76.7,31.3,82.8,64.2,79.1,63,77.5,63.3,76.7,58.3,81.6,59.5,75.3,62.4,81.6,56.6,78.9,51,31.2,51.5,31.2,51.5,30.4,55.7,33.5,51.3,32.6,50.6,30.9,52,29.8,50.7,30.5,51,31.4,51.3,31.7,51.1,30.1,51.9,31.2,50.6,30.8,50.9,30.8,52.4,32.4,48.8,34.6,49.7,57.6,49.4,57.3,48.3,56.9,51.3,60.8,51.7,60.4,52.4,64.4],"r":[67,43.3,82.8,35.8,82.8,36.5,30.6,22.7,31.7,21.4,31.3,20.6,29.5,20.7,33.1,22,28.4,58.2,28.4,59,41.8,86,20.1,40.9,27.9,73.8,33,60.4,57.7,67.7,59.2,68.9,34.4,11.9,34,10.4,60.6,63.5,46.4,51.2,68.2,71.9,51,29.6],"a":[70.5,41.5,70.9,44.1,65.9,44,68.4,46.3,68.2,46.7,68.9,41.5,67.8,46.7,70.1,44.4,65.7,43.4,25.5,14,25.9,14.6,78.7,56.4,48.8,42.9,47.9,42.1,54.9,42.4,52.6,45.1,79.3,36.5,77.7,36.5,74.7,37.1,80.3,35.3,81.9,31.7,80.6,36.3,80.4,35.5,81.1,35.2,82.1,36.6,82.2,35.9,81.6,35.6,82.3,34.8,83.4,35.3,18.3,41.6,18.4,42.2,19.1,41.6,18.2,40.6,18.8,39.7,17.8,38.9,17.9,39.2,18.1,42,17.5,39.4,46,73.5,45.4,74.1,46.4,72.8,46.4,74.1,46,73.1,45.8,74.3,45.9,73.4,30.6,27.9,30,27,31.3,23.8,32,22.4,29.6,21.5,30.4,20.3,29.9,22.1,33.2,21.6,33.6,24.8,34.3,25.4,34.7,25.3,33.7,25.4,34.5,25.3,34,25.2,34.6,25.4,31.8,28.2,34.9,25.2,30.6,28,34.3,22.6,36.2,22,30.7,23.9,30.7,21.4,31.7,25.9,32.1,25.9,29.1,23.1,29.4,21.1,33.6,21.2,34.7,26.8,34.3,28.1,30.9,26,31.2,27.5,32.1,23.7,33.6,24.5,34.8,24.6,34.8,24.8,31.6,20.4,33,22.2,32.8,21.6,32.9,23.7,30.9,21.2,28.6,26,30.1,20,32.8,26,33.6,27.2,33.2,27.8,30.3,23,31.1,27.8,33.9,26.3,29.5,22.4,28.5,25.9,31.6,22,30.7,23.7,29.2,24.6,54.3,27.9,54.8,28,53.5,27.6,54.2,21.3,53.9,21.1,47.3,53.6,46.9,53.5,53.2,50.9,50.2,47.8,48,50.3,47.4,48.8,50,52.5,46.9,55,48.4,54.1,38.1,33,38.2,33,61.3,28.6,61.8,34.5,76,84.6,75.5,85.3,75.5,84.5,75.1,84.7,75.9,84.7,76,85.2,76.3,84.8,76,85,74.7,85.2,74.8,84.8,75.2,85.2,75.8,85.4,19,55.8,28.3,24.2,28,22.2,27.3,22,27.6,22.6,28.1,26.4,28.4,22.5,21,21.6,20.7,28.9,47.8,74.2,47.6,73.1,66.7,28.8,73.7,25.2,73.2,25.9,74.1,23.8,68.2,21.1,47.4,86.5,48.3,84.4,48.5,86.7,47.2,85.5,67.2,29.7,67.1,29.1,71.6,32.4,71,36.9,47.5,80.4,48,80.6,47.5,80.8,47.5,81,33.8,73.7,33.3,74,33.7,71.2,33.8,72,33.9,72.5,33.2,71.9,33.8,71.4,33.2,72,33.5,72.7,33.4,71.2,33.5,72.6,34.3,71.9,33.9,72.8,33.5,72.3,33.5,71.3,34.2,71,34,71.9,33.6,72.7,30.9,70.5,30,69.2,30.6,70.8,29.4,69.1,29.3,69.2,30.4,70.3,30.1,69.2,18.4,14.7,64.3,18.7,38.8,91.4,38.8,91.4,42.2,85.6,45.6,85.6,46.1,85.4,46.4,88.9,43.2,86.7,43.1,85.3,44.7,84.8,41.4,86.9,43,87.5,44.3,87.6,44.2,87,41.6,84.6,42,86.6,44.9,86.5,41.6,85.7,44.3,85.7,42.2,84.7,41.8,84.8,41.7,85.5,42.2,85.6,44.5,85,46.7,85.3,43.9,84.7,45,85.2,43.8,85.5,45.4,85.3,45.6,84.4,44.2,85.2,44.9,85,44.3,85.6,46.5,84.8,45.2,85.3,43.8,85,40.1,86.9,41.3,86.8,44.7,87.4,19.5,35.1,20,29.4,45,56.8,36.5,59.6,44.6,60.8,65,89.3,64.9,88.7,64.5,88.4,25.1,42.6,24.3,44.8,22.5,42.3,22.2,41.5,19.5,43.8,19.6,42.2,19.3,42.5,20.4,38.9,21.7,38.6,22,38.6,25.1,41,20.9,42,20.2,39.7,26,39.8,20.5,45.9,23.9,40.1,74,46,67.2,41.3,67.4,42.5,69.3,43.3,67.2,42.8,72.7,43.3,68.1,40.4,68.3,45.5,66.1,42.4,34.4,51.9,36.3,85.6,30.4,88.6,30.3,88,29.9,87.7,45.1,46.1,40.5,46.8,44.2,43.4,78.7,60.9,78.3,60.7,75.8,59.2,75.5,59.5,45.1,20.9,45,20.2,28,71,27.8,70.9,27.5,71.7,27.9,70.9,28.2,71,28,71.3,27.7,70.9,74.7,28.3,77.9,21.8,82.1,71.2,81.5,71.2,81.2,71.6,74.7,74.5,75.1,72.7,74.4,72.1,74.7,72.4,74.7,72.7,74.4,72.9,74.4,72.6,75.2,72.6,74.7,74.8,77.4,73.6,32.4,61.6,33.6,60.5,33.5,61,33.5,61.1,32.3,61,32.9,60.4,32.4,60.1,32.2,61.3,32.2,61.1,32.9,60.2,32.1,60.7,33.1,61,32.8,61,32.2,60.9,32.6,60.5,32.8,61,33.6,60.1,58.5,49.3,57.1,49.1,56.7,48.7,57,48.4,58,48.4,58.6,50.1,57,49.9,56.8,49.6,65.2,48.8,69.3,84,69.9,83.7,70.3,83.9,70.3,84.1,69.4,83.8,72.2,83.7,71.5,83.9,71.3,83.5,71.9,84.3,71.4,83.8,73.1,78.7,73.9,75.7,71.6,81.2,71.6,81.3,70.8,81.8,65.5,77.2,65.3,76.4,65.2,78.5,70.4,80.9,70.1,80.9,70,81.7,70.2,80.8,70.2,81.1,68.2,81.1,68.2,81.3,70.4,81.5,70.3,81.2,70,81.7,69.1,81.9,69.1,80.5,69.1,77.1,67.8,76.1,70.3,76.3,71.2,76.4,70.7,77.1,68.1,77.1,68.1,77.1,69.9,76.7,68.6,77,69.9,77.1,71.5,76.1,68.1,76.1,68.9,77.1,70,76.1,68.5,76.7,70.4,77.1,67.8,76.1,71,76.9,71.7,79,72.2,79.2,72,79,72.9,78.2,72.7,79,72.9,79.1,73.5,79,72.6,78.3,72.7,78.3,73.3,78.2,72.8,79,73.4,78.2,73,78.9,73.2,79,72.2,78.9,73.4,78.3,73.6,78.7,73.4,78.3,73.5,79,72.4,79,71.5,78.2,71.9,78.2,72,78.9,72.1,78.7,72.1,78.8,72,78.3,71.7,79,71.5,78.8,72,79,72.5,79,70.7,78.8,70,78.8,69.1,78.3,68.4,78.3,67.6,78.3,67.9,79,67.6,79,67.6,78.3,67.7,78.2,67.7,78.2,67.9,78.7,68.2,78.8,69.4,79,69.1,78.9,69.1,78.3,68.9,78.5,67.5,78.9,67.4,79,67.5,79,68.2,78.7,68.5,78.1,69.3,79,67.5,78.7,69.1,78.2,69.5,78.7,68.3,79,68.2,79.2,68.4,79,68.8,79,68.3,78.9,69.2,78.2,68.4,78.2,68.2,78.9,67.5,78.8,69.3,79.1,69.6,77.7,71.5,77.7,73.7,75.9,73.5,75,73.6,75.7,74.4,75.5,74.4,76.1,69,84,71.9,83.5,69.3,84,71.8,84.3,71.5,84.2,67.4,84.4,67.6,84.4,67,84.3,67.7,84.8,67.5,85.2,67,84.2,67.5,84.8,70.3,84.4,71.6,84.3,71.3,84.4,69.5,84.5,69.9,84.4,64.5,71.2,64.5,72.8,64.9,71.5,64.9,72.2,64.5,72.2,64.5,73.8,64.9,73.3,64.4,73.2,65,73.9,64.8,74.2,64.7,73.9,64.9,73.4,64.6,73.2,64.5,72.3,64.9,71,64.4,71.7,64.4,71.1,58.5,70.6,57.9,69.5,57.1,69.6,57.2,68.4,58.4,67.7,58.2,69,30.3,29.3,31.3,29.3,30.3,29.3,30.3,29.2,30,29.4,28.7,38.1,30.1,19.4,31.1,14.6,30.2,13.6,36.3,10.6,30.6,40.8,34,45.2,34.7,44.7,37.4,10.5,83.9,37.2,40.5,82.3,40.9,80.8,45.5,82,44.8,81.3,42.4,80.5,43,80.3,43.8,80,45.5,81.1,43.8,80.4,43.2,79.8,43.9,80.4,43.9,79.8,45.4,80.3,45.3,80.2,44.6,79.8,42,81.2,43.9,80.2,41.7,80.2,43.5,81.3,43.9,80.8,42.3,80.8,44.9,80.9,45.6,81.5,45.2,80.6,42.3,80.6,19.8,75.3,19.5,75.1,24.2,83.5,24.8,83.5,26.1,78.1,26.3,77.4,58.8,60.4,61.1,63.3,63.3,59.9,63.7,61.3,58.3,63.1,60.9,63.5,63.6,61.1,58.1,59.7,60.5,64,60.7,63.2,60,62.2,63.6,59.6,61.8,63.3,62.7,63.6,62.2,62.4,63.6,62.8,59.9,63.2,60.6,63.7,60.9,63.2,60.9,63.5,61.9,64.5,83.6,79.5,63.6,44.4,59.6,42.4,40.5,51.3,41.9,52.8,43.5,54.7,42.8,49.3,43.9,48.2,45.1,48.4,46.8,52.7,46.5,52,44.2,50.4,43.8,52.2,43.9,51.9,41.6,50.7,41.7,50.9,42.5,50.4,44.1,50.5,42,49.8,44.3,55.4,44.9,53,43.8,52.9,46.1,48.5,42.1,55,46.5,54.2,42.7,50.5,45.8,50.7,43.6,50.2,45.4,54,45.6,49.3,41.6,53.7,46.5,53,43.4,53.9,45.6,53.3,43.5,53.7,43.9,53.7,68.5,73.4,67.8,74.3,67.6,66.8,65.3,73.8,65.3,73.5,65.4,72.1,65.4,71.3,68.4,71.2,68.3,71.2,69.3,72,69.4,70.9,69,71,67,71.9,68.6,72,68.6,70.6,69.6,71,69.5,71.2,69,71.4,68.1,71.9,68.1,72.4,69.2,71.5,69.3,71.5,68.1,71.6,67.4,71.3,68.2,71,68.6,71.3,68.4,70.9,68,70.9,67.8,71,66.7,70.9,68.2,71.4,67.7,71,68.1,71.4,69.5,70.5,66.6,71.9,67.4,71,67.4,71.2,67.1,71.8,68.1,73.8,68.2,73.8,71.8,73.9,71.8,71,71,71.9,71.8,73.6,71.4,71.1,71.3,73.7,71.5,73.1,71.5,72.2,71.9,71.3,70.8,73.2,71.6,73,71.8,73.6,71.2,71.3,71.8,71.7,71.5,72.2,73.9,72,74.2,72.3,73.7,72.3,74.1,73.1,74.3,72.7,73.7,72.3,74.1,72.8,73.4,72.1,74.2,73.5,73.4,73.4,73.7,72.7,68.5,72.3,68.9,71.3,67.7,71.6,68.1,71,75,75.8,82.2,80.9,82.4,81.3,82.5,81.3,82.3,81.9,82.7,81.1,82.6,80.8,82.1,81.5,75.2,75,75,75.4,74.9,84.1,23.2,86.1,23,86.5,24,85,24,85.6,24.3,85.3,23.2,85.3,26.2,54,25.9,54.7,28.2,51.6,24.2,50.8,16.5,66.2,16.8,66.2,17.9,66.5,17,66.2,15.7,66.1,15.9,66,19.1,71.1,17.9,66.2,17.4,66.2,17.6,66.1,16.2,66.4,17.1,66,18.1,65.8,33.9,75.7,34.1,75.7,32.5,76.4,33.5,75.6,32.4,75.4,33.9,76,33.6,75.5,33.8,76.4,32.8,75.1,34,75.3,29.7,76.4,31.3,75.4,29.7,76.4,30.8,76,30.4,76.1,31.3,76,29.9,75.8,30,76.3,30.2,75.7,31.4,76.4,28.8,75.3,28.8,75,33.8,83.7,33.5,82.5,58.3,81.5,58.3,81.5,63,77.5,64.4,78.4,64.1,76.5,64.1,77.3,64.1,76.7,64.5,79.3,63.4,77.5,64.1,77.5,64.7,78.5,64.8,78.7,64.8,79.2,64.9,78.6,64.6,78.3,63.5,76.7,63.5,77.6,63.7,76.8,63,76.9,63.8,78.4,63.7,78.3,63.6,76.4,63.4,76,56.6,79.8,51.5,29.5,54.5,30.1,52.4,34.7,51.8,33.1,50.2,32.5,49.9,30.3,51.8,29.3,52.1,31.2,52.1,31.9,50.9,30.5,50.9,29.7,51.5,30.5,50.5,31.7,51.6,30.7,50.7,30.1,50.7,31.7,51.2,31.6,51.6,31.8,50.5,31.4,51.1,30.5,50.7,30.1,52,30.1,51.5,30.2,52.2,32.7,51.3,60.4,52,60.6,51.9,60.8,51.8,61.2,15.5,65.8,15.7,64,17.6,64.6,15.8,63.7,15.9,63,15.9,64.1,16,63.1,15.7,65]},"r6":{"n":[61.6,2.3,60.7,5.2,62.2,3.2,64.6,11.8,64.7,12.1,32.5,82.7,34,82.6,31.7,84.5,34.5,85.2,33.4,87.9,37.8,85.5,33.9,86.3,31.1,74.7,48.8,57.9,49.4,57.7,44.6,71.1,49.1,72,50.8,68.7,50.3,67.2,51.5,67.9,51.9,68.8,41.8,57.8,51,65.8,52.1,10.7,52.6,9.8,74.4,67.4,77.9,65.5,75.9,72.1,76,64.3,77.4,72.7,73.9,58.6,81.5,60.7,73.7,71.6,48.8,57.3,56.1,49,45.2,43.7,54.9,57.2,52.5,49.9,52.7,49.5,22,49.9,21.6,55.7,24.1,50.5,23.3,51.1,22.9,49.3,23.4,51.2,23.3,49.8,22.6,50.5,22,50.1,20.8,56,20.8,55,21.4,55,59.2,14.6,57.3,14,65.8,26.4,67.5,24.8,65.6,18.3,65.2,17.5,57.1,14.8,58,13.2,58.3,14.4,60.1,18.5,57.6,19.1,68.7,85.3,65.7,84.9,65.9,75.9,68.4,86.9,66.5,73.9,67.1,74.6,65.2,77.6,68.1,78.3,69.1,83,72,74.5,70.5,74.9,71.6,86.8,71.8,85.8,38.8,88.2,29.7,91.7,34.5,49.9,34.3,49,29.8,56.6,37.7,50.9,29.8,55,37.4,55.6,37.1,55.9,37.6,56.2,40.7,53.2,39.4,47.4,37.2,51.7,37.1,51.5,33.7,49,33.5,49.9,34,48.9,33.9,49.9,27.4,48.2,28.9,46.8,46.2,73.8,54,78.9,54.1,78.7,41.8,80.6,55.2,23.4,52.5,13.4,51,15.2,51.2,15.5,56.5,18.4,50.4,17.3,61.5,43.8,64.7,44.7,65.4,43.7,70.6,54.9,68.2,43.5,63.8,47,60.7,47.7,59.6,47.6,59.5,47.1,27.7,62.9,30.5,63.2,32.3,62.6,35.9,62.9,37.5,63.1,35.3,70.7,34.9,61.6,37.1,58.5,28.6,63.3,29.1,63.3,27.5,63.8,29.1,62.8,28.3,65,32.3,63.9,32.3,62.7,33.3,62.2,36.4,62.6,37.5,62.2,29.4,71.8,28.4,66.9,22.4,60.5,21.8,58.7,15.3,70.5,21.4,59,22.4,59.4,21.4,60.7,21.8,59.2,24.7,65.8,42.4,32.9,54.6,32.8,42.4,28.5,51.3,40.9,52.2,40.4,51,39.5,52.5,36.1,56.1,39.6,48.2,33.1,47.2,32.5,51.3,40.3,39.4,20,39.2,17,35.9,20.3,41.3,25.8,40.6,25.4,37.1,36.2,41.1,31.8,33.9,36.6,40.6,41,40.6,40.3,39.8,40.5,71.5,29.2,65.2,42.4,65.2,40.8,64.4,40.1,64.5,41.9,69.2,35.6,62.1,39.8,62.2,32.8,78.3,93.3,79.2,93.3,78,92.9,68,68.1,68.8,68.1,57.7,63.4,72.1,61,65.8,69.8,69,67.5,71.1,66.4,48.3,91.6,47.6,90.8,49.3,91.7,74.4,85.3,77.5,79.8,76.9,77.5,76.5,80.6,85.7,81,73.8,87.4,72.5,80.1,76.3,85.1,75.9,85.1,76.6,82.7,75.3,79.2,82.7,87.6,16.4,41.7],"r":[32.7,84.9,37.3,87.6,50.5,65.5,42,57.8,48.7,57.6,58.3,13.9,66.1,77.6,70.4,86.5,29.8,55.8,28.5,47.7,46.5,74.4,42.2,22.8,52.1,14,59.6,47,61.1,47.7,35.7,71.1,41.4,32.4,78.5,93.1,58.1,63.5,71.6,61.5,48.6,91.4,77.7,82,72.8,86.6,85.8,80.8],"a":[64.8,11.8,33.4,82,34,83.5,34.6,85.9,31.7,82.6,32.1,86.4,32.5,83.3,38.8,86.7,31.5,84.3,41.4,80.8,36,86,37.2,85.6,49.8,68.1,51.4,68.1,53.3,10.2,53.9,10.4,51.5,10.2,52,10.2,51.7,10.6,73.8,72.3,76.8,64,76,72.7,73.5,68,78.1,64.6,76.9,73,77.5,72.6,56.2,49.2,41.8,57.4,21,55.2,23.4,49.5,24.2,51.2,23,51.2,23.4,49.8,23.9,49.6,65.8,26.1,58.1,15.5,58.4,14.9,60.3,18.5,71.4,74.4,71.2,74.3,71.5,86.5,70.4,87.2,70.8,87.5,69.4,87.5,70.4,85.9,70.2,85.3,67.1,75,65.8,74.6,70.5,81,35.9,88.5,33.5,49.4,33.5,49.5,28.5,47.8,37.8,50.8,37.9,50.7,37.1,51.2,46.4,74,56.3,22.1,53.9,15.5,51,15.3,70.6,55,65,45.3,64.5,43.5,61.3,48.1,33.2,62.3,31.4,63.8,26.8,63.3,36.6,62.7,35.9,62.2,35.7,70.8,29,63.7,30.4,63.9,15.4,70.2,22.1,58.7,21.5,60.8,22.1,59.2,21.4,59.6,21.6,60.2,51,39.9,48.3,33.1,41.9,28.7,39.1,20.1,36,19.9,40.8,31.4,37.5,36.3,71.1,29,68,41.7,62.9,39.9,63.6,40.9,65.4,42.2,64.3,40.4,65.2,41,65.4,40.3,62.6,40.3,78.4,93.5,78.7,93.3,58,63.9,71.2,61.2,71.4,61.5,69,67.3,69.1,68.6,47.4,91.7,48.8,90.9,48.5,91.3,48.1,91.8,48.3,92.2,48.6,89.7,85.5,81.3,72.6,86.8,72.7,86.5,72.6,85.9,76.8,81.6,72.9,85.5,73.2,85.2,75.6,78.6,16.3,42.1,73.2,57]},"s43":{"n":[75.4,54.9,78.6,54.9,81.1,51.4,75.3,54.9,75.3,54.9,75.9,54.8,4.1,78,4.3,77.4,46.2,53.1,45.7,54.2,46.7,74.1,51.4,76.5,51.2,75.3,51.5,75.9,66.1,23,67.6,24,67.7,23.6,65,24,66.1,24.7,65.1,21.8,65.9,21.7,65.4,23.9,65.8,21.3,66.6,24.6,66.7,20.6,67.6,24.5,64.8,22.2,64.3,24.9,66.2,21.3,67,21.6,66.7,23.4,64.6,24,66.8,23.6,65.9,23,67,21.9,67.2,22.9,10.9,20.2,9.7,20.2,10.3,20.2,9.5,21.4,10.3,20,65.3,58.9,64.5,58.5,65.3,59.8,77.3,96.8,76.1,94.6,82.6,93.9,7.3,50.9,8.6,49.4,8.3,48.9,6.3,50.3,7.8,49,8.1,48.7,8.1,49.7,8.7,48,6.8,52.2,7.3,47.7,7.9,50.1,8.7,50.1,6.4,52.1,8.4,50.5,7.8,49,8.6,48.2,8.6,48.7,8.1,50.1,8.4,50.7,8.3,48.6,8.8,50.1,6.7,51.8,67.4,66.6,67.2,67.5,66.1,65.4,63.8,65.3,62.8,64.6,74.1,78.7,73.6,77.3,75.1,80.4,75.2,82.1,74.6,83.4,65.4,43.8,65.6,43.5,65.8,43.1,64.6,42.6,65.7,43.9,64.4,43.9,11.5,75.8,11.7,75.8,11.2,76.4,69.8,26.8,68.9,25.6,69.6,26.1,79.8,79.6,78.4,81.5,79.6,79.6,75.9,82.1,79.8,79.6,78,77.9,77.1,77.8,76,79.8,76,80.7,77.6,80.4,75.8,79.9,77,80.4,75.3,77.2,76.8,77.7,76.9,82.1,75.6,81,75.7,80.3,75.5,82.8,64.8,19.1,61.4,22.5,26.1,12.5,26.9,13.5,26.9,12.7,24.9,12.9,29.4,15,29.3,14.6,29.8,14.2,29.9,14.5,29.3,14.1,29,14.3,29.8,14.9,27.8,14.1,25.2,14.7,26.2,15.2,25.3,15.6,25.7,15.5,26.5,12.5,25.3,13.2,27.6,12.9,26,12.4,25.2,15.4,24.9,11.3,28.9,17.4,26,14.7,26.5,12.7,24.1,15.5,38.3,40.3,43.5,74.6,44.9,72.8,43,70.4,43.1,72.8,43.1,72.2,43.3,70.5,43.7,71.1,42.3,74.1,41.8,74.2,42.1,74.9,39.1,75,39.8,74.5,40,74.5,38.6,76.2,38.7,70.3,38.9,70.5,41.9,74.7,41,76.9,40.7,76.3,40.1,76.7,39,72.2,39.3,73.1,39.5,69.9,42.3,70.5,40.2,70.1,40.8,70.7,41.5,70.3,39.4,70.2,39.1,74.9,78.1,57,81.9,61,78.3,57.8,77.8,56.7,75.5,59.4,75.5,57.6,75.2,58.8,75.5,57.2,75.9,56,75.6,56.8,75.3,56.7,75.7,56.9,75.1,58.4,75.9,58.5,75.2,56.3,76.1,55.5,76,56.7,75.9,59.8,75.3,59.2,62.1,27.5,73.9,76.8,73.2,76.2,73.9,73.7,25,6.8,26.5,5.4,63.6,81.5,63.6,81.5,63.3,82.3,64,81,60.7,53.9,60.5,53,62.8,52.4,63.6,52.7,60.5,52.3,62.3,51.9,13.6,48.9,11.4,52.2,10.6,51.2,9.2,49,13.8,52.1,14,50.3,11.6,48.1,8.8,50,11.7,51.4,11.5,51.2,11.4,51.1,14.5,89.4,14.4,88.2,75.1,55.2,75.1,58.2,75.1,59.9,58.1,66.5,58.9,66.1,27.5,66.8,27.9,64.9,27,65.7,27.5,65.6,28.6,65.9,27,65.2,27.8,65.3,83,94,83.8,95.1,30.7,86.8,30.7,88.8,29.7,88.3,28.8,89.4,17,13.4,22.5,14.3,23.1,15.2,22.5,14.6,21.7,15.1,22.2,14.7,22.1,14.9,18.6,11.5,19.3,11.6,21.6,15.1,48.4,25.4,48.2,25.1,58.7,56.4,60.4,55,59.6,56.2,57.3,55.4,58.2,55.9,57.9,57.4,59.2,55.2,12.6,18.1,12.6,15.9,14.1,16.8,12.5,17,64.3,25.6,67.6,25.7,32.2,54.1,35.2,51.6,31.7,54.8,31.9,54.5,89.7,80.9,88.9,80.2,85.8,79.9,87,80,85.5,80.1,88.8,81.4,89.3,80.6,84.9,83.6,88.1,83.9,87.8,80.9,26.3,51.8,25.7,52.7,24.7,51.8,25.7,50.9,31.3,88.2,36.5,91.6,37.4,91.7,72.4,11.7,74,11,56.2,51.6,54.4,53.8,58.5,54.6,60.2,52.4,59.3,53.6,56.1,52.3,56,52.5,56.1,52.8,57.5,50.7,58.3,51.6,58.7,51.8,58.4,52.7,57.1,54.6,57.9,54.3,53.3,53.8,57.3,48.4,59.8,53,58.4,53.5,58.9,51.3,56.8,49.6,56,54.8,55.1,53,73.9,10.5,44.1,47.6,40.4,45.5,31,45.7,30.5,42.8,30.6,43,30.4,44.7,29.6,43.7,72.3,48.9,70.7,47.9,41.3,81.7,39.9,82.8,39.1,82.1,39.2,83.7,45.1,81.8,45.4,82,45.7,80.3,38.8,77.3,57.8,82.7,63,90.4,84.7,73,84,73.8,85.3,74.7,85.8,73.8,13.6,47.1,10.8,47.1,7.2,59.3,7.7,59.1,7.9,59.6,3.7,56.6,15.1,92,39.6,32.2,43.8,26.4,44.7,26.4,43.3,28.8,45.2,26,22.1,47.3,21,47.6,19.3,40.4,83.3,59.6,82.7,61,83.2,59.5,56.5,93.7,56.2,94,56,95.7,56.1,94.1,56.1,95.7,56.4,96.4,56.7,95.8,56.3,94.6,56.4,93.5,54.2,94.5,54,93.6,54.6,93.6,54,95.3,54.5,95.5,53.9,95.6,54.4,94.7,55,93.7,54.3,94.2,56.7,95.6,56,95,54.6,95.3,53.2,93.2,57.1,93.1,36.4,29.4,35.1,30,35.8,29.2,35.6,28.3,35.8,29.4,28.1,33.6,28.9,35.2,29.4,35,56.6,17.4,90.1,87.6,92,88.5,78,76.8,77.2,76.8,77.2,76.8,77.8,77,76.6,77.1,18.1,66.6,50.7,43.5,49.6,43,49.8,41.1,50.1,42.2,46.8,47.3,33.8,44.9,34.3,45.5,34,45.7,35.5,45.8,35.5,45.4,34.3,43.1,34.4,42.5,34.2,42.9,34.9,43.3,36.3,43.9,35.8,44.2,36.1,44.1,35.5,43.8,36.3,43.4,31.8,44.4,31.9,43.1,31.1,43.9,31.1,44.2,32.2,43.7,31.7,43.6,31.7,43.9,31.9,44.8,35,44.2,35,46,36.6,45.6,33.8,45.1,32.7,43,37.3,43.5,34.7,46.5,32,46.2,31.4,45.5,35.1,41.8,36,41.9,35.3,42.2,32,42.4,58.4,29.8,75,25.5,85.8,64.1,84.4,65,10.1,34.2,80.2,19.2,81.4,20.5,79.3,24.6,78.2,25.3,43.1,87,42.1,86.2,42.3,87.1,42.5,86,39,40.7,38.2,40.2,38.7,40.5,59.7,35.6,57.5,39.6,59.5,35.6,88.6,29.8,88.4,30.6,88.6,30.2,87.8,30.7,10.6,31.9,10.2,31.3,48.1,27.4,48,27.5,48,26.9,48.4,26,48.4,28.1,48.1,27.9,47.7,25.7,52,28.6,50.4,29.4,50.6,29.9,50.9,27.1,52.2,26.8,46.1,27.5,46,28,10.7,82.9,12.6,78.3,12.6,78,57.6,91.4,53.8,91.2,54.3,91.4,56.3,91.3,57.7,91.5,53.6,90.7,55.6,89.1,55.2,89.2,71.3,47.3,22.9,75.3,21.7,75.8,19.9,73.2,20.3,75.4,17,75.4,17.1,75.3,23.3,75.4,22.5,74.7,68.6,22.7,68.5,23.2,69.3,25.2,67.9,23.9,67.8,24.2,67.9,23.9,68.2,24.6,68.5,24,68,25.1,70.1,24.8,68.3,22.1,40.8,69.7,66.4,37.4,40.5,49.6,43.8,49.7,40.4,54.7,44.4,53.8,45.1,54.5,20.9,58.5,21.3,58.6,20.9,58.9,19.3,55.2,89.7,86,88.7,86.8,71.1,86.5,71.1,86.1,22.6,77.3,20.5,79.9,20.4,78.3,19.4,78.2,22,78.6,20.8,80.8,22.8,77.6,19.9,79,17.4,79.7,17.3,80.1,20.6,77.3,21.6,78.5,38.1,40.5,38.4,40.1,41.5,94.7,42.3,93,41.5,92.9,43.4,92.6,41.9,92.9,41.9,92.1,44.1,93.6,19.9,37.5,18.4,34.8,18.7,38.9,20.3,19.7,20.6,21.3,77.7,68.7,77.6,68,78.2,68.6,60.1,24.6,48.1,64.2,48.1,63.8,37.8,73.1,37.2,72.5,37.6,72,37,73.4,32.4,71.2,36.9,75.6,37.2,74.8,78.6,90.5,78.1,90.1,75.9,86.3,75.4,86.6,75.7,87.9,75.4,87.2,66.6,13.6,8.2,44.2,8,44,8,43.3,48.7,89.2,22.1,49.4,22,48.3,22.2,48.8,36.8,60.1,59.6,71.2,57.7,75.9,57.7,75.6,17.1,88.3,17.2,88.8,17.9,87.3,17.2,86.2,16.6,87.5,16.8,89.3,14.9,61.2,19.9,6.5,48.7,84.3,50.7,84,68,66.1,68.7,66.6,80.2,38.3,79.4,37.9,79.9,37.4,80,38.5,80.4,37.4,76.4,34.1,78.5,53.3,48.6,53.9,49.2,54,50.3,49.7,47.9,74.9,62.5,55.4,63.3,56.8,64.5,58.5,38.1,36.9,38.3,35.8,31.8,37.5,60.5,66.4,65.6,72.9,65.1,72.9,32.9,65.3,65.4,46.1,23.9,29.8,25.6,27.5,28.7,27.1,28.8,26.6,11.4,70,15.5,70.3,14.6,70.5,33.8,24.4,32.6,22.2,27.8,72.2,24.1,71,84.1,20.6,29.6,14.8,40.8,71.8,81.8,58.2,75.5,57.3,67.1,31.1,62.1,30.8,71.4,69.9,63.8,81.4,63.6,81.4,50.5,36.6,51,33.6,50.3,37.1,64.7,52.2,62.4,50.8,63.5,48.9,70.9,60,69.5,60,59.5,65.4,59.1,65.9,24.4,67,30.5,66.5,83.7,95,83.7,93,78.2,13.6,28.3,89.1,72.9,22.3,73.9,21.5,72.1,22.7,73.1,21.1,50.8,20.1,50.8,20.6,59.1,58.2,57.9,56.7,57.4,58.2,54.8,55.9,58.6,56.7,58,57.8,57.8,61.8,56.7,46.7,53.8,40.8,24.6,59.9,27.6,60.6,30.8,55.1,27,57.7,64.9,25.6,37.2,54.1,37.2,54,37.5,54.2,37.8,54.5,31.9,54.2,27,19.8,27.4,20.2,84.2,83.9,84.2,84,85.2,81.9,85.3,81.8,24.6,50.7,68.6,11.7,72.5,12,72.4,11.5,57.6,52.2,60.1,52.6,56.7,53.9,58.3,49.6,72.5,8.3,72.5,10.3,39.3,41.1,27.9,43.4,69.3,51.3,69.3,52,67.4,10.2,54.9,83.3,58.7,82.7,57.6,82.1,57.8,83.3,58.2,81.1,53.3,82.9,18.9,31.1,62.5,90.9,66,92,64.7,88.3,83.7,76.3,82.8,69.8,39.4,32.4,44.9,28.6,44.9,29.1,81.5,41.2,75.3,42.5,21.5,40.5,18,42.1,22.1,41.9,21.3,41,85.9,59.7,85.5,58,39.7,22.1,39.3,23.4,44.4,21.9,34.1,32.1,32.8,25.6,27.9,33.6,28.4,33.6,29.5,33.6,56.1,15.9,55.1,18,55.2,16.9,55.1,17.9,54.4,16.1,54.6,16.4,13.6,65,10.5,68.9,19.4,66.8,48.1,43.8,48.1,43.3,46.9,47,52.3,46.4,47.3,41.3,48.9,42.6,49.8,41.1,58,29.5,59.6,29.9,75.3,26.8,78.4,28.2,75.1,25.8,38.6,36.6,38.3,37.6,44.2,39.8,45.6,36.2,45.6,35.7,80.9,22,81.2,19.6,80.8,19.6,41.2,61.3,41.2,55.5,39.6,55.4,58.9,39.8,57,33.8,56.3,38.8,56.4,39.1,56.7,39.4,59.1,36.4,7.7,21.4,8.5,20.1,88.6,30.6,88.4,29.8,89.9,29,10.7,29.7,38.2,81.2,37.8,83.4,50.9,26,51.4,26,52,28.3,52.1,28.8,52,30,13,78.1,70.8,47,71.7,47,17.3,75.3,18.9,70.6,17.5,70.2,68.3,25.1,67.8,24.5,52,58.7,49.1,56.1,39,65.6,61.4,38.8,45.4,53.8,41,51.4,17.7,57.4,20.3,59.3,23.3,55.1,20.4,61,21.6,59.7,68.2,39.8,76.2,10.6,7.7,68.2,5.7,68.1,7.5,67.6,6.9,65.9,17,84,17.2,80,30.2,84,27.3,80.7,17.8,36.6,18.7,34.8,18,34.8,21.2,24.7,23.5,24,81.2,64.4,79.4,64,58.8,24.2,56.5,19.4,55.1,19,53.7,22.1,52.3,65,51.9,66.1,31.5,76.5,37.4,73.4,37.5,73.2,79,84.7,5.2,69.5,5.3,44.8,52.6,85.4,35.9,59.7,35.9,60.7,45.8,92,52.1,82.9,48.8,79.8,72.6,63.4,71.6,63.5,71.8,63,71.5,69.6,72.1,68.5,80.7,33.2,76.2,33.9,76.3,34.1,28,19.5,27.6,19.5,27.8,19.7,27.9,19.6,27.6,19.7,28,19.7,27.6,19.5,28,19.5,27.6,19.7,27.6,19.7,27.7,19.5,27.6,19.5,27.9,19.7,11.4,37.2,10.6,37.7,11.2,37.7,10.9,37.6,72.9,29.4,73.7,28.9,73.1,28.9,73.4,29,77.1,48.3,77.8,47.8,77.3,47.8,77.6,47.9,37.5,19.8,37,19.1,37,19.6,37.1,19.3,23.2,85.2,23.7,85.9,23.6,85.4,23.6,85.7,67.2,89,67.7,89.8,67.6,89.2,67.6,89.5],"r":[11.2,74,11.1,73.7,11.1,74,11.2,73.7,67.3,24.2,67.1,24.4,67.3,24.4,67,24.2,41.6,75,41.4,75.2,41.6,75.2,41.3,75,75.6,59.2,75.4,59,75.4,59.2,75.6,58.9,73.3,21.6,27.7,44,27.5,44.2,27.8,44.2,27.4,44,49,31.2,48.9,30.9,48.9,31.2,49,30.8,45.5,53.8,45.2,53.9,45.5,53.9,45.1,53.7,73.8,86.5,73.6,86.7,73.8,86.7,73.5,86.5,18.2,18.9,18.3,19.2,18.3,18.9,18.1,19.2,27.7,19.6,27.6,19.6],"a":[78.4,53.4,78.5,53.5,75.7,54.5,75.4,54.6,75.8,54.4,3.7,77.4,4.1,78.3,48.6,53.7,50.7,54,45.8,53.8,46.2,53.6,46.4,54.4,45.8,53.7,66.3,23.3,67.1,24.1,65,23.6,67.6,24.4,67.7,24.2,64.8,23.6,66.6,23.8,64.1,23.9,65.4,23.5,65.9,22.2,64.9,24.5,67.3,22.8,67.9,25.3,66.4,21.1,65.4,24.7,65.1,21.8,66.3,22.6,66.8,25.2,67.7,24,64.8,24.3,66.8,21.7,66.5,20.6,66.7,20.6,64.2,25.6,67,25,65.3,21.1,65.8,20.9,9.5,20.6,11,20.5,9.4,19.6,65.2,59,64.7,58.6,76.6,96.4,76.9,94.7,8,50.5,8.2,50.5,6.3,51.6,6.4,49,8.3,52.3,6.9,51,8.4,50.3,8.9,49.2,8.9,48.4,6.8,52.2,7,48.1,38.2,36.4,38.4,35.9,31.7,37.6,65.5,65.6,65.5,72.9,65.5,72.9,73.2,78.3,73,82.8,75.1,83.2,33.1,65.4,65.9,43.8,65.5,44,65.6,43,65.5,43.9,65.2,43.6,65.9,43.8,65.9,43.5,28.6,26.5,28.6,27,28.7,26.9,11,76,11.3,76.1,11.2,73.8,11.3,73.8,11.1,73.6,11,73.6,11.4,75.7,15.1,70.5,70.4,26.2,69.2,26.3,69.2,26.3,69,26,70.3,25.5,69.9,26.8,70.1,26.8,32.8,22.3,79.1,80.1,75.9,82.6,75.9,83,79.4,79.5,77,78,77.2,77.4,78,78.8,76.6,77.4,75.3,77.3,77.4,82.4,77.7,77.3,78.4,78,75.9,79.7,76.7,80.6,76.5,80,76,80.2,24,71.1,24,71.1,28.7,72.2,27.7,72.1,23.5,75.4,24.4,75.7,23.7,75.7,67.2,24.2,67.1,24.2,67,24.4,67,24.4,61.5,23.6,25.6,13,26,13,27.4,13.8,24.8,13.1,26.9,13.4,26.1,12.5,25.4,12.9,29.5,14.9,29.6,15.1,29.2,14.8,28.9,14.5,29.1,14.8,29.9,14.3,29.1,14.1,29.7,13.6,26.1,11.2,25.9,12.5,25.3,12.6,25.1,15.4,26,14.6,25.3,14.5,25.8,16,25.7,14.5,25.8,15.5,25.8,15,26.2,14.7,28,12.9,44,74.3,41.5,75,41.4,75,41.3,75.2,41.3,75.2,44,73.8,45,70.9,43.8,72.6,45.1,72.3,42.2,71.1,39.1,70.3,41.7,70,41.5,70.2,40.3,70.5,41.1,70.6,43.1,71,42.9,71.1,41.7,75.8,40.4,77,40.3,76.6,40.7,76.3,39,76.8,39.6,75.1,40.3,74.8,40,74.9,39,72.9,39.3,73.8,38.8,71,40.1,72.8,78,56.6,75.6,59.1,75.6,59,75.4,58.9,75.4,58.9,81.6,58.4,75.9,55.9,75.3,57.2,75.3,57.9,75.3,55.9,75.8,57.5,75.5,58.9,75.4,55.9,75.4,58.2,75.9,58.8,75.7,56.3,75.5,55.5,75.9,59.8,75.3,59.2,75.5,58.4,66.8,31,71.5,69.9,74.2,77,25.1,7,24.6,6.9,24.8,7.6,63.8,81.3,63.5,81.4,50.5,36.9,50.3,37,50.5,37.3,50.9,33.9,62.4,50.7,63.3,48.7,60.8,52.3,11.6,47.7,9.2,50.4,9.6,47.8,13.7,48.5,13.7,50.3,13.9,52.2,12.9,51.9,11.7,51.8,11.7,52.2,9.1,49,8.8,50.1,11.6,51,12.6,49.9,10.8,49.1,9.4,50.9,11.1,50.4,14.3,89.4,14.6,89.2,69.6,60.1,75.2,57.1,36.7,92.9,59.4,65.7,59.1,66.1,58.2,64.8,30.5,66.5,27.1,65.5,28.1,65.5,27.2,65.5,24.3,67.2,27.1,65.5,30.4,66.6,83.6,95.1,76,10.9,77.5,13.5,77.4,13.8,29.8,88.4,29.5,87.8,21.9,14.8,22,14.6,22,14.8,21.5,14.9,22.8,14.9,22.6,15,17,13.5,17,13.5,16.7,13.5,17.5,13.2,23,10.8,16.8,12.4,17.9,12.7,17.4,12.3,71.4,23.1,47.8,25.1,51,20.6,51,20.1,50.9,20.3,57.9,61.1,57.9,61.9,54.8,56,57.1,55.2,58.2,55.8,58,55.8,59.7,55.6,58.7,56.7,53.4,40.7,53.6,40.8,58.9,43.3,56.7,46.7,24.9,60.1,27,57.7,10.5,17.5,12.5,15.6,14.3,18,14.2,16.8,65.7,26.1,64.1,26,64.5,25.7,37.4,54.1,32,54,32.1,54.5,27.2,20,27.2,20,89.5,79.7,89.6,80.3,89.5,80.1,85.9,79.9,86.7,80.5,85.8,80,85.3,80.5,88.6,80.5,26.4,52.6,26.7,51.3,25.5,50.5,24.4,51.9,31,88.6,37.3,91.5,68.6,11.5,69,11.7,68.8,12.2,74,11.5,72.3,11.4,72.2,11.9,72.4,10.8,72.7,11.3,73.8,11.4,55.6,52.6,56.1,52.5,57.8,50.2,58.8,51.3,58.8,51.9,58.1,51.9,56.3,53,59.4,54,57.9,54.5,58.2,53.9,57.3,48.6,59.4,54.7,59.9,54.6,59.5,53,60.4,52.6,59.6,53,59.8,52.3,57.9,54.2,58.5,49.6,56.5,53.8,59.9,52.3,59.3,52.9,57.2,53,58.6,51.4,72.3,10.3,73.7,10.5,74.4,10.7,43.1,40.4,44.1,47.5,39.3,41.1,27.6,44,27.6,44,27.4,44.2,27.4,44.2,28.1,43.6,30.5,44.5,29.9,43.8,30.9,42.5,69.3,51.7,69.4,51.6,70.9,47.9,41.4,81.6,45.2,82,45.1,79.9,67.3,10.2,57.9,80.9,16.6,30.4,62.6,90.6,63.9,90.6,83.3,73.9,84,74.3,84.9,75.9,83.9,76.2,83,69.7,12.5,47.5,13.7,47.6,11.4,47,9.3,44.1,10.6,47.1,7.3,59.4,7.7,59.7,3.8,56.4,7.7,59.3,14.5,92,14.9,92.3,45.1,29.2,45.1,28.7,45,28.8,43.7,28.3,44.8,26.5,43.7,25.9,43.6,26.1,44.6,26.5,44.7,25.9,44,26.8,43.6,28.4,81.4,41.1,75.1,42.7,21.7,47.2,22.6,47,82.7,61.1,86.3,59.2,55.9,95.4,56.4,94.9,56.3,94.5,56,93.4,54.3,94.8,54,94.6,54,95.1,54.7,94.3,53.9,95.2,54.6,95.5,55.1,93.4,39.1,23.3,36.1,29.1,35.6,29.2,35.7,29.3,36.8,28.9,36,28.9,33,25.9,32.8,25.5,35.1,29.6,35.2,29.2,36.2,29.2,24,33.6,28.4,35.2,28.4,33.5,28,33.4,29.6,33.5,29.1,33.6,28.6,33.9,28.5,35,29.4,34.9,29.2,35.6,55.8,17.9,54.9,16.1,55.1,16.8,56.1,16.4,56,16.4,56.1,16.2,55.1,16.9,55.6,17.7,55.7,17,13.6,65.1,13.3,64.9,13.6,65.5,90.2,87.6,78.3,76.7,48.1,43.5,48.1,43.4,49.1,42.6,49.1,42.7,49.1,41.2,47.8,41.3,47.8,41.3,50.7,43.6,49,42.4,50,42.4,52.1,46.6,46.6,46.8,47.3,47,46.5,47.3,33.4,42.7,35.4,45.7,34.8,46.1,35,42.5,34.6,43,33.8,43.1,36.3,44.1,36.5,43.7,35.9,44,32.2,43.4,31.1,45.3,31.1,43,31.2,45.4,32.1,43.7,31.4,44.6,31.9,44.6,35.7,42.7,35.9,43.8,35.8,44.2,35.7,46.5,35.1,46.3,35.5,45,36.3,45.2,36.6,45.4,36.8,45.9,34.5,45.1,34.3,44.7,34.1,44.5,34.2,45.1,34.1,45.7,34.1,45.5,34.2,45.2,33.7,45.4,32.2,46.2,32,45.8,33.9,46.5,32.9,45.7,33,44.4,32.9,43.5,34.3,46,34.6,42.4,32.8,43.1,31.9,45.3,31.6,43.6,59.5,30,58.4,29.5,75,25.7,75.3,25.2,78.6,28,85.9,64.2,38.4,32.9,38.4,32.9,45.4,35.7,45.4,36.2,45.5,36,38.5,37.1,38.2,37.5,44.3,39.8,11.3,33.4,10.6,34,81.1,22,80.7,19.3,80.6,19.1,80.1,19.2,80.6,19.6,79.6,19,81.4,20.1,80.8,19.7,79.2,18.7,40.8,55.9,40.8,55.8,41.4,61.1,42.6,86,42,87,41.1,86.5,38.2,40.8,38.4,40,38.8,39.8,59.7,35.5,59.7,35.6,56.9,33.6,56.8,33.8,57.5,35.8,56.3,38.8,56.7,39.4,56.2,38.9,57.3,39.8,56.8,39.3,59.2,36.8,59.1,36.8,59.4,35.6,88.5,30.3,88.5,30.1,88.6,30.2,88.4,30.2,88.3,30.6,88.3,29.8,89.6,29.8,11,29.5,15.2,31.5,10.3,31.8,10.1,32.3,11.1,31.3,11.3,31.9,48,28.3,48,27.9,47.9,27.4,48,25.4,47.7,26.5,49,31,49,31,48.9,30.8,48.8,30.8,51.5,25.8,50.9,25.8,51.1,25.9,50.5,28.9,52.1,28.9,52.3,28.4,52.1,30.1,52.1,29.5,51.7,29.1,50.7,29,50.8,29.8,50.1,29.7,51.3,27.7,52.6,26.6,52.4,27.1,52,26.6,52.7,27,46.1,27.7,46.3,27.3,45.9,27.4,12.8,78.1,12.6,78.1,12.5,78.2,54.1,91.4,53.6,91.4,53.7,91.6,53.3,84.9,57.6,91.5,56.4,91.3,57.2,91,55.6,89.3,55.7,89.4,55.8,88.4,68.4,47.3,68.4,47.4,71.5,47.1,71.1,47.4,71.3,47.1,71.2,46.9,18.7,69.7,18.4,70.3,17.8,69.9,18.1,70.8,22.1,74.9,20.7,75.1,19.9,75.4,20.7,77.2,21.9,75,23,76.2,17.2,75.3,17,75.4,17,75.5,19.9,73.4,22.2,77.1,67.8,24.7,68.3,23.9,67.8,24.1,67.9,24.7,68.8,23.6,70.1,24.8,69.1,25.4,69.4,25.4,68.6,25.1,68.1,22.2,49.1,56.2,49.1,56.3,51.8,58.6,52,58.3,51.8,58.7,39.9,69.5,40.2,69.7,61.2,38.8,66.3,37.4,67.6,39.1,40.4,49.8,45.3,53.8,45.3,53.7,45.1,53.9,45.1,53.9,45.5,54.5,44.4,53.9,43.9,48.9,17.9,57.3,17.4,57.4,20.7,58.7,20.2,59.6,21.4,58.7,23.2,55.1,23.2,55,17.4,57.3,20.9,58.4,19.4,55,68.1,39.9,89.7,87.4,83.4,84.9,89.9,86.5,73.7,86.5,73.6,86.5,73.5,86.7,73.5,86.7,71,86.2,7.5,68.2,5.5,68.4,8.1,68.4,7.5,68.4,7.7,68,7.2,67.9,17.1,83.8,21.7,78.8,21.2,80.6,19.5,78.1,20.5,77.2,22.4,77.5,20.5,79.9,20.4,78.4,17.3,80,17.4,80.1,17.5,80.2,30.4,83.8,37.8,40,38.7,40.1,18,36.5,18.7,39.6,18.1,19.1,18.1,19.1,18.3,19.3,18.3,19.3,19.9,21.2,20.3,19.7,20.4,19.2,20.5,19.7,77.8,69.3,77.6,69.2,81,64.5,79.3,63.7,56.6,19.5,53.6,21.9,58.8,24.4,58.5,24.2,55.7,18.6,55.2,18.6,47.6,64.1,47.9,64.3,47.9,63.9,51.9,66.1,37.2,72.9,37.8,73.7,37.6,72.5,37.1,72.6,37.4,72.8,37.3,73.1,37.8,72.4,32.4,71.5,37.8,76.6,37.4,74.9,37.9,70.6,78.9,90.2,76,87.1,75.3,86.7,75.9,86.4,79.1,84.7,78.9,85.1,8.5,47.1,6.3,47.4,6.4,47.3,5.1,44.6,8.2,44.3,8.2,44,8.5,43.7,7.8,44.5,52.5,85.3,45.8,91.7,48.7,89,22.7,48.7,21.8,49.5,58.6,70.8,57.9,75.8,57.7,75.8,17,88.6,18,86.2,17.2,86.2,17.4,88.3,15.2,61,14.8,61,45.6,92,47.8,93.4,22.2,3.9,51,84,51.9,81.8,52.7,82.5,68.5,66.2,72.5,63.1,71.8,63.6,67.9,66.6,78.7,37.5,78.4,38.6,79.9,38,80.2,37.5,79,38.7,79.9,38.4,80.3,37.3,78.8,37.4,79.4,38,78.6,38.2,78.4,37.2,81,33.1,76.2,33.9,27.9,19.7,27.8,19.7,27.8,19.7,27.8,19.5,28,19.7,27.9,19.5,27.8,19.7,27.9,19.6,27.7,19.5,27.8,19.7,27.6,19.5,28.1,19.5,11.3,37.4,11.2,37.2,11.2,37.2,73,29.2,73.1,29.4,73.1,29.4,77.1,48.1,77.2,48.3,77.3,48.3,37.3,19.8,37.5,19.7,37.5,19.6,23.4,85.2,23.2,85.3,23.1,85.4,67.4,89.1,67.2,89.2,67.1,89.3]}};/*@@LR-CHESTS-TILL@@*/
// Настоящие награды недели 1 сундуков Treasure Hunters (гайды 1–5.11, Epic списка не публикует): наряд, кирка, экран загрузки.
// Джем-трек, G-Wagon, декаль и колёса не взяты: в шкафчике карьеры для них нет места. Неделя 2 (Lil Uzi Vert) ещё не в данных fortnite-api.
const CC_CHEST_DROPS={o:[["Character_SpillStrike","Solid Gold Rugahand","epic"]],p:[["Pickaxe_SpillStrikeReward","Solid Gold Gauntlets","rare"]],l:[["loadingscreen_delilahthw","Plunder in Paradise","uncommon"]]};
const CC_CHEST_NOTHING=.25, CC_CHEST_SCREEN=.02, CC_CHEST_PICK=.004, CC_CHEST_SKIN=.002;
const CC_CHEST_COST=25, CC_CHEST_N=36, CC_CHEST_R=4, CC_CHEST_OPENS=CC_CHEST_N+CC_CHEST_R, CC_CHEST_P=1/1300, CC_CHEST_P_RARE=1/430;
const CC_CHEST_T_ALL={
  en:{more:'More chests', freeW:'FREE', got:n=>'Weapons found: '+n, ko:'OUTFIT', kl:'LOADING SCREEN', kp:'PICKAXE', items:n=>n+' ITEMS', two:'Two periods of 14 days: the first until 15 December 2026, the second in 2027. Everything priced in V-Bucks is free.', next:'The second free period opens in 2027.', all:n=>'Open all ('+n+')', found:'YOU FOUND', map:'Pirate Chests', chip:'Weapons, items or a coin', done:'All opened today. Come back tomorrow', pick:'Tap the chests on the map. Inside: weapons and heals, sometimes a season outfit, pickaxe or loading screen, and very rarely the coin that opens the Pirate Shop.', left:n=>'Chests left today: '+n, none:'No chests left today. New ones tomorrow.', search:'Search', coin:'Pirate coin!', coinS:'Two periods of 14 days: the first until 15 December 2026, the second in 2027. Everything priced in V-Bucks is free.', now:'Plunder the shop now', later:'Keep for later', close:'Close', free:'14 days free'},
  ru:{more:'Ещё сундуки', freeW:'БЕСПЛАТНО', got:n=>'Найдено оружия: '+n, ko:'НАРЯД', kl:'ЭКРАН ЗАГРУЗКИ', kp:'КИРКУ', items:n=>'ПРЕДМЕТОВ: '+n, two:'Два срока по 14 дней: первый до 15 декабря 2026, второй в 2027. Всё за V-Bucks бесплатно.', next:'Второй бесплатный срок откроется в 2027.', all:n=>'Открыть все ('+n+')', found:'ТЫ НАШЁЛ', map:'Пиратские сундуки', chip:'Оружие, вещи или монета', done:'Сегодня все открыты. Приходи завтра', pick:'Нажимай на сундуки на карте. Внутри оружие и хилки, иногда наряд, кирка или экран загрузки сезона, а очень редко монета, которая открывает пиратский магазин.', left:n=>'Сундуков на сегодня: '+n, none:'На сегодня сундуки кончились. Новые завтра.', search:'Обыскать', coin:'Пиратская монета!', coinS:'Два срока по 14 дней: первый до 15 декабря 2026, второй в 2027. Всё за V-Bucks бесплатно.', now:'Разграбить магазин сейчас', later:'Оставить на потом', close:'Закрыть', free:'14 дней бесплатно'},
  fr:{more:'Encore des coffres', freeW:'GRATUIT', got:n=>'Armes trouvées : '+n, ko:'TENUE', kl:'ÉCRAN DE CHARGEMENT', kp:'PIOCHE', items:n=>n+' OBJETS', two:'Deux périodes de 14 jours : la première jusqu’au 15 décembre 2026, la seconde en 2027. Tout ce qui coûte des V-Bucks est gratuit.', next:'La seconde période gratuite ouvre en 2027.', all:n=>'Tout ouvrir ('+n+')', found:'TU AS TROUVÉ', map:'Coffres pirates', chip:'Armes, objets ou pièce', done:"Tous ouverts aujourd'hui. Reviens demain", pick:'Touche les coffres sur la carte. Dedans : armes et soins, parfois une tenue, une pioche ou un écran de chargement de la saison, et très rarement la pièce qui ouvre la boutique pirate.', left:n=>"Coffres restants aujourd'hui : "+n, none:'Plus de coffres aujourd\'hui. Nouveaux coffres demain.', search:'Fouiller', coin:'Pièce pirate !', coinS:'Deux périodes de 14 jours : la première jusqu’au 15 décembre 2026, la seconde en 2027. Tout ce qui coûte des V-Bucks est gratuit.', now:'Piller la boutique maintenant', later:'Garder pour plus tard', close:'Fermer', free:'14 jours gratuits'},
  it:{more:'Altri forzieri', freeW:'GRATIS', got:n=>'Armi trovate: '+n, ko:'COSTUME', kl:'SCHERMATA DI CARICAMENTO', kp:'PICCONE', items:n=>n+' OGGETTI', two:'Due periodi da 14 giorni: il primo fino al 15 dicembre 2026, il secondo nel 2027. Tutto ciò che costa V-Buck è gratis.', next:'Il secondo periodo gratis si apre nel 2027.', all:n=>'Apri tutti ('+n+')', found:'HAI TROVATO', map:'Forzieri pirata', chip:'Armi, oggetti o moneta', done:'Tutti aperti oggi. Torna domani', pick:'Tocca i forzieri sulla mappa. Dentro: armi e cure, a volte costume, piccone o schermata di caricamento della stagione, e molto di rado la moneta che apre il negozio pirata.', left:n=>'Forzieri rimasti oggi: '+n, none:'Niente più forzieri oggi. Nuovi forzieri domani.', search:'Cerca', coin:'Moneta pirata!', coinS:'Due periodi da 14 giorni: il primo fino al 15 dicembre 2026, il secondo nel 2027. Tutto ciò che costa V-Buck è gratis.', now:'Saccheggia il negozio ora', later:'Tieni per dopo', close:'Chiudi', free:'14 giorni gratis'},
  pt:{more:'Mais baús', freeW:'GRÁTIS', got:n=>'Armas encontradas: '+n, ko:'TRAJE', kl:'TELA DE CARREGAMENTO', kp:'PICARETA', items:n=>n+' ITENS', two:'Dois períodos de 14 dias: o primeiro até 15 de dezembro de 2026, o segundo em 2027. Tudo que custa V-Bucks é grátis.', next:'O segundo período grátis abre em 2027.', all:n=>'Abrir todos ('+n+')', found:'VOCÊ ENCONTROU', map:'Baús piratas', chip:'Armas, itens ou moeda', done:'Todos abertos hoje. Volte amanhã', pick:'Toque nos baús do mapa. Dentro: armas e curas, às vezes traje, picareta ou tela de carregamento da temporada, e muito raramente a moeda que abre a loja pirata.', left:n=>'Baús restantes hoje: '+n, none:'Sem baús por hoje. Novos baús amanhã.', search:'Procurar', coin:'Moeda pirata!', coinS:'Dois períodos de 14 dias: o primeiro até 15 de dezembro de 2026, o segundo em 2027. Tudo que custa V-Bucks é grátis.', now:'Saquear a loja agora', later:'Guardar para depois', close:'Fechar', free:'14 dias grátis'},
  de:{more:'Mehr Truhen', freeW:'GRATIS', got:n=>'Waffen gefunden: '+n, ko:'OUTFIT', kl:'LADEBILDSCHIRM', kp:'SPITZHACKE', items:n=>n+' GEGENSTÄNDE', two:'Zwei Zeiträume von 14 Tagen: der erste bis 15. Dezember 2026, der zweite 2027. Alles für V-Bucks ist gratis.', next:'Der zweite Gratis-Zeitraum öffnet 2027.', all:n=>'Alle öffnen ('+n+')', found:'DU HAST GEFUNDEN', map:'Piratentruhen', chip:'Waffen, Items oder Münze', done:'Heute alle geöffnet. Komm morgen wieder', pick:'Tippe auf die Truhen auf der Karte. Darin: Waffen und Heilung, manchmal Outfit, Spitzhacke oder Ladebildschirm der Saison und sehr selten die Münze, die den Piratenshop öffnet.', left:n=>'Truhen heute übrig: '+n, none:'Heute keine Truhen mehr. Neue morgen.', search:'Durchsuchen', coin:'Piratenmünze!', coinS:'Zwei Zeiträume von 14 Tagen: der erste bis 15. Dezember 2026, der zweite 2027. Alles für V-Bucks ist gratis.', now:'Shop jetzt plündern', later:'Für später aufheben', close:'Schließen', free:'14 Tage gratis'},
  es:{more:'Más cofres', freeW:'GRATIS', got:n=>'Armas encontradas: '+n, ko:'ATUENDO', kl:'PANTALLA DE CARGA', kp:'PICO', items:n=>n+' OBJETOS', two:'Dos periodos de 14 días: el primero hasta el 15 de diciembre de 2026, el segundo en 2027. Todo lo que cuesta paVos es gratis.', next:'El segundo periodo gratis se abre en 2027.', all:n=>'Abrir todos ('+n+')', found:'HAS ENCONTRADO', map:'Cofres pirata', chip:'Armas, objetos o moneda', done:'Todos abiertos hoy. Vuelve mañana', pick:'Toca los cofres del mapa. Dentro: armas y curas, a veces atuendo, pico o pantalla de carga de la temporada, y muy rara vez la moneda que abre la tienda pirata.', left:n=>'Cofres restantes hoy: '+n, none:'No quedan cofres hoy. Nuevos mañana.', search:'Buscar', coin:'¡Moneda pirata!', coinS:'Dos periodos de 14 días: el primero hasta el 15 de diciembre de 2026, el segundo en 2027. Todo lo que cuesta paVos es gratis.', now:'Saquear la tienda ahora', later:'Guardar para luego', close:'Cerrar', free:'14 días gratis'}
};
// Показ #chestdemo всегда по-английски: он для скринов в X.
function ccChestT(){ return (!CC_CHEST_DEMO && CC_CHEST_T_ALL[LANG]) || CC_CHEST_T_ALL.en; }
function ccChestOn(){ return !(CAREER.career && CAREER.career.seasonOver) && ccSeasonNumOn(careerToday())===CC_PIRATE_SEASON; }
function ccChestToday(){ const p=ccPirate(), day=careerToday(); return (p.chest && p.chest.day===day) ? p.chest : {day:day, opened:[], round:0}; }
// Номер захода в ключе дня: новый заход это новые сундуки и новый лут, перезагрузка их не меняет.
function ccChestKey(st){ return st.day+(st.round ? '#'+st.round : ''); }
function ccChestDoneRound(){ return ccChestToday().opened.length>=CC_CHEST_OPENS; }
function ccChestLeft(){ return Math.max(0, CC_CHEST_OPENS-ccChestToday().opened.length); }
// Сундуки дня: настоящие точки острова, не слишком близко друг к другу, чтобы по каждому можно было попасть пальцем.
function ccChestSpots(day){
  const r=careerRng(ccHashStr('chestspots|'+ccPirateTeam()+'|'+day)), out=[];
  const take=(flat, n, rare)=>{
    const total=flat.length/2; let got=0;
    for(let t=0; t<total*4 && got<n; t++){
      const k=Math.floor(r()*total), x=flat[k*2], y=flat[k*2+1];
      if(out.some(s=>Math.hypot(s.x-x, s.y-y)<6.5)) continue;
      out.push({x:x, y:y, rare:rare}); got++;
    }
  };
  take(CC_S43_CHESTS.r, CC_CHEST_R, 1);
  take(CC_S43_CHESTS.n, CC_CHEST_N, 0);
  return out;
}
// Что в сундуке: монета по шансу, вещь, ничего, иначе оружие и расходник тем же броском, что в матче (ccChestRoll).
function ccPirateChestRoll(day, i, rare){
  const r=careerRng(ccHashStr('chest|'+ccPirateTeam()+'|'+day+'|'+i)), x=r();
  if(x<(rare ? CC_CHEST_P_RARE : CC_CHEST_P) && !ccPirate().found) return {coin:1};
  const y=r(), w=r(), own=ccFnOwn();
  const item=t=>{ const l=CC_CHEST_DROPS[t], e=l[Math.floor(w*l.length)]; return own[e[0]] ? null : {item:{id:e[0], t:t, n:e[1], r:e[2]}}; };
  if(y<CC_CHEST_NOTHING) return {none:1};
  const got=y<CC_CHEST_NOTHING+CC_CHEST_SCREEN ? item('l') : y<CC_CHEST_NOTHING+CC_CHEST_SCREEN+CC_CHEST_PICK ? item('p') : y<CC_CHEST_NOTHING+CC_CHEST_SCREEN+CC_CHEST_PICK+CC_CHEST_SKIN ? item('o') : null;
  if(got) return got;
  return {loot:ccChestRoll(r, 's43')};
}
// Предмет сразу в шкафчик, как награды пасса.
function ccChestGive(it){
  const own=ccFnOwn(), eq=ccFnEq();
  if(own[it.id]) return;
  own[it.id]={t:it.t, n:it.n, r:it.r, d:careerToday(), chest:1};
  if(!eq[it.t]) eq[it.t]=it.id;
}
function ccChestTileHTML(){
  if(!ccChestOn()) return '';
  const T=ccChestT(), st=ccChestToday(), left=ccChestLeft(), started=st.opened.length>0 && left>0, can=ccChestCan();
  const need=(!started && !can) ? L().ccNeedEnergy(CC_CHEST_COST-careerEnergy()) : '';
  return '<button class="cc-dt'+(can ? '' : ' off')+'" title="'+esc(T.map)+'" '+(can ? 'onclick="ccChestOpen()"' : 'disabled')+'>'+
    '<span class="cc-dt-img" style="background-image:url(\'items/creative/trChest-s43.webp\')"><em class="cc-dt-en">'+(started ? left+'/'+CC_CHEST_OPENS : CC_CHEST_COST+L().ccEnergyMark)+'</em></span>'+
    '<span class="cc-dt-txt"><b>'+esc(T.map)+'</b><span class="cc-dt-g"><i class="m">'+esc(T.chip)+'</i></span>'+(need ? '<span class="cc-dt-why">'+esc(need)+'</span>' : '')+'</span></button>';
}
function ccChestArt(rare, part){ return '<img class="cc-chi '+(part==='lid' ? 'l' : 'b')+'" src="items/creative/pirate-chest'+(rare ? '-rare' : '')+'.webp" alt="">'; }
const CC_COIN_SVG='<img class="cc-coin-i" src="items/creative/pirate-coin.webp" alt="">';
function ccChestClose(){ const m=document.getElementById('ccChestOv'); if(m) m.remove(); }
function ccChestShow(html){
  ccChestClose();
  const m=document.createElement('div');
  m.id='ccChestOv'; m.className='cc-ch-ov'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
  m.innerHTML=html;
  document.body.appendChild(m);
  return m;
}
// Идёт заход (уже оплачен) или хватает энергии на новый.
function ccChestCan(){
  if(!ccChestOn()) return false;
  const st=ccChestToday();
  return (st.opened.length>0 && !ccChestDoneRound()) || careerEnergy()>=CC_CHEST_COST;
}
// Заход кончился: следующий открывает новые сундуки.
function ccChestNextRound(){
  const p=ccPirate(), st=ccChestToday();
  if(st.opened.length<CC_CHEST_OPENS) return;
  p.chest={day:st.day, opened:[], round:(st.round||0)+1};
  careerSave();
}
function ccChestLeftText(){ const T=ccChestT(), n=ccChestLeft(); return n ? T.left(n) : T.none; }
function ccChestMoreHTML(){ return '<button class="cc-ch-btn cc-chm-all" id="ccChestMore" onclick="ccChestMore()" '+(careerEnergy()>=CC_CHEST_COST ? '' : 'disabled')+'>'+esc(ccChestT().more)+' · '+CC_CHEST_COST+L().ccEnergyMark+'</button>'; }
function ccChestMore(){ if(CC_CHEST_BUSY || careerEnergy()<CC_CHEST_COST) return; ccChestNextRound(); ccChestOpen(); }
function ccChestOpen(){
  if(!ccChestCan()) return;
  if(ccChestDoneRound()) ccChestNextRound();
  const T=ccChestT(), day=ccChestKey(ccChestToday()), spots=ccChestSpots(day), opened=ccChestToday().opened;
  const pin=(s, i)=>'<button class="cc-chm'+(s.rare ? ' r' : '')+(opened.indexOf(i)>=0 ? ' o' : '')+'" style="left:'+s.x+'%;top:'+s.y+'%" aria-label="'+esc(T.map)+' '+(i+1)+'" '+
    (opened.indexOf(i)>=0 ? 'disabled' : '')+' onclick="ccChestPick('+i+')"><img src="items/creative/pirate-chest'+(s.rare ? '-rare' : '')+'-m.webp" alt=""></button>';
  ccChestShow('<div class="cc-ch-box cc-chm-box"><div class="cc-ch-t">'+esc(T.map)+'</div><div class="cc-ch-s" id="ccChestS">'+esc(T.pick)+'</div>'+
    '<div class="cc-chm-map" id="ccChestMap">'+spots.map(pin).join('')+'</div>'+
    '<div class="cc-chm-foot"><b id="ccChestLeft">'+esc(ccChestLeftText())+'</b><button class="cc-ch-btn q" onclick="ccChestDone()">'+esc(T.close)+'</button></div>'+
    '<button class="cc-ch-btn cc-chm-all" id="ccChestAll" onclick="ccChestOpenAll()">'+esc(T.all(ccChestLeft()))+'</button></div>');
}
// Сначала итог в сейв, потом анимация: закрытая вкладка посреди неё ничего не теряет и не перебрасывает.
function ccChestPick(i){
  if(CC_CHEST_BUSY || !ccChestCan() || ccChestDoneRound()) return;
  const p=ccPirate(), day=careerToday(), st=ccChestToday(), key=ccChestKey(st), spots=ccChestSpots(key), s=spots[i];
  if(!s || st.opened.indexOf(i)>=0) return;
  const got=ccPirateChestRoll(key, i, s.rare);
  if(!st.opened.length) careerSpend(CC_CHEST_COST);
  st.opened.push(i); p.chest=st;
  if(got.coin) p.found=day; else if(got.item) ccChestGive(got.item);
  careerSave();
  const pinEl=document.querySelectorAll('#ccChestMap .cc-chm')[i];
  if(pinEl){ pinEl.classList.add('o'); pinEl.disabled=true; }
  ccChestLeftSync();
  if(got.none) return;
  ccChestStage(s, got);
}
function ccChestLeftSync(){
  const T=ccChestT(), lf=document.getElementById('ccChestLeft'), all=document.getElementById('ccChestAll'), n=ccChestLeft();
  if(lf) lf.textContent=ccChestLeftText();
  if(all){ if(n) all.textContent=T.all(n); else all.outerHTML=ccChestMoreHTML(); }
}
// Открыть все оставшиеся разом: тот же лут по тем же номерам, одна сцена с суммой.
function ccChestOpenAll(){
  if(CC_CHEST_BUSY || !ccChestCan() || ccChestDoneRound()) return;
  const p=ccPirate(), day=careerToday(), st=ccChestToday(), key=ccChestKey(st), spots=ccChestSpots(key);
  if(!st.opened.length) careerSpend(CC_CHEST_COST);
  let coin=false, rare=false; const items=[], loots=[];
  const pins=document.querySelectorAll('#ccChestMap .cc-chm');
  spots.forEach((s, i)=>{
    if(st.opened.indexOf(i)>=0) return;
    const got=ccPirateChestRoll(key, i, s.rare);
    st.opened.push(i);
    if(s.rare) rare=true;
    if(got.coin){ p.found=day; coin=true; } else if(got.item){ ccChestGive(got.item); items.push(got.item); } else if(got.loot) loots.push(got.loot);
    if(pins[i]){ pins[i].classList.add('o'); pins[i].disabled=true; }
  });
  p.chest=st;
  careerSave();
  ccChestLeftSync();
  ccChestStage({rare:rare}, coin ? {coin:1} : {loots:loots, items:items});
}
let CC_CHEST_BUSY=false;
/* Открытие как в игре: шкала поиска, сундук дрожит и светится, крышка откидывается со вспышкой,
   искры веером, лут взлетает в столбе света цвета редкости. Нажатие на экран пропускает ожидание. */
function ccChestStage(s, got){
  const T=ccChestT(), m=document.getElementById('ccChestOv'); if(!m) return;
  CC_CHEST_BUSY=true;
  let sparks='';
  for(let k=0; k<14; k++){ const a=-160+k*(140/13), d=70+(k*37)%70; sparks+='<i style="--dx:'+Math.round(Math.cos(a*Math.PI/180)*d)+'px;--dy:'+Math.round(Math.sin(a*Math.PI/180)*d*1.3)+'px;animation-delay:'+(.72+(k%4)*.04).toFixed(2)+'s"></i>'; }
  const lootTop=got.loot ? got.loot.weapon : (got.loots && got.loots.length) ? ccChestBest(got.loots)[0].weapon : null;
  const rar=got.coin ? 'c' : got.item ? (got.item.r==='epic' ? 'e' : got.item.r==='rare' ? 'b' : 'g') : !lootTop ? 'g' : ({legendary:'l', epic:'e', rare:'b', uncommon:'g', common:'w'}[lootTop.rarity]||'w');
  const st=document.createElement('div');
  st.className='cc-chs'+(s.rare ? ' r' : '')+(got.coin ? ' coin' : '')+((got.coin || got.item || (got.items && got.items.length)) ? ' f' : ''); st.id='ccChestStage';
  st.innerHTML='<div class="cc-chs-in"><div class="cc-chs-glow"></div><div class="cc-chs-beam '+rar+'"></div><div class="cc-chs-sparks">'+sparks+'</div>'+
    (got.coin ? '<div class="cc-chs-boom"></div>' : ccChestLootHTML(got))+
    '<div class="cc-chs-chest"><span class="cc-chs-lid">'+ccChestArt(s.rare, 'lid')+'</span>'+ccChestArt(s.rare, 'body')+'</div>'+
    '<div class="cc-chs-search"><i class="cc-chs-ring"><svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15"/><circle class="p" cx="18" cy="18" r="15" pathLength="100"/></svg></i><b>'+esc(T.search)+'</b></div></div>';
  const found=ccChestFoundHTML(got);
  if(found) st.insertAdjacentHTML('afterbegin', found);
  m.appendChild(st);
  let over=false;
  // Монету закрывает выбор игрока, а не таймер.
  if(got.coin) return;
  const finish=()=>{ if(over) return; over=true; CC_CHEST_BUSY=false; st.remove(); };
  setTimeout(()=>{ st.onclick=finish; }, 900);
  setTimeout(finish, found ? 3600 : 2600);
}
function ccChestBest(list){ return list.slice().sort((a,b)=>RARITY_LADDER.indexOf(b.weapon.rarity)-RARITY_LADDER.indexOf(a.weapon.rarity)); }
// Карточка лута: рамка цвета редкости из файлов сезона, иконка ствола. Расходник рядом поменьше.
function ccChestCardHTML(o, small){
  const key=RARITY_LADDER.indexOf(o.rarity)>=0 ? o.rarity : (CONSUMABLE_SKIN_KEY[o.rarity]||'common');
  const k=key==='mythic' ? 'legendary' : key;
  return '<span class="cc-chl'+(small ? ' s' : '')+'" style="background-image:url(\'items/creative/pirate-card-'+k+'.webp\')">'+ccItemIconHTML(o, '')+'</span>';
}
function ccChestLootHTML(got){
  if(got.loot){
    const w=got.loot.weapon, c=got.loot.cons;
    return '<div class="cc-chs-loot"><div class="cc-chl-row">'+ccChestCardHTML(w)+(c ? ccChestCardHTML(c, 1) : '')+'</div><b class="cc-chl-n">'+esc(w.name)+'</b></div>';
  }
  if(got.loots && got.loots.length){
    const top=ccChestBest(got.loots).slice(0, 3);
    return '<div class="cc-chs-loot"><div class="cc-chl-row">'+top.map(x=>ccChestCardHTML(x.weapon, 1)).join('')+'</div><b class="cc-chl-n">'+esc(ccChestT().got(got.loots.length))+'</b></div>';
  }
  return '';
}
// Скин-кап: верхняя четверть первого раунда получает скин, баннером как находка из сундука.
function ccSkinCupAfter(ev, place, n){
  if(!(place>0) || place>Math.ceil(n/4)) return false;
  const it={id:ev.skin, t:'o', n:ev.skinN, r:'epic'};
  if(ccFnOwn()[it.id]) return false;
  ccChestGive(it);
  careerSave();
  if(typeof CC_FF==='undefined' || !CC_FF){
    const m=ccChestShow('<div class="cc-ch-box">'+ccChestFoundHTML({item:it}).replace('class="cc-chf"', 'class="cc-chf cc-chf-st"')+'<div class="cc-ch-btns"><button class="cc-ch-btn" onclick="ccChestClose()">'+esc(ccChestT().close)+'</button></div></div>');
    return !!m;
  }
  return true;
}
// Баннер YOU FOUND из игры: рамка с предметом и плашка с молниями. Текст наш, на языке игрока.
function ccChestFoundHTML(got){
  const T=ccChestT(), one=x=>'<div class="cc-chf-card"><img src="'+ccFnImg(x.id)+'" alt=""></div>';
  if(got.coin) return '<div class="cc-chf"><div class="cc-chf-cards"><div class="cc-chf-card">'+CC_COIN_SVG+'</div></div><div class="cc-chf-bar"><small>'+esc(T.found)+'</small><b>PIRATE SHOP ACCESS</b></div></div>'+
    '<div class="cc-chf-act"><div class="cc-chf-s">'+esc(T.coinS)+'</div><div class="cc-ch-btns"><button class="cc-ch-btn" onclick="ccChestCoinNow()">'+esc(T.now)+'</button><button class="cc-ch-btn q" onclick="ccChestCoinLater()">'+esc(T.later)+'</button></div></div>';
  const list=got.items || (got.item ? [got.item] : []);
  if(!list.length) return '';
  const kind=list.length>1 ? T.items(list.length) : T['k'+list[0].t];
  return '<div class="cc-chf"><div class="cc-chf-cards">'+list.slice(0, 4).map(one).join('')+'</div>'+
    '<div class="cc-chf-bar"><small>'+esc(T.found)+'</small><b>'+esc(kind)+'</b></div>'+(list.length===1 ? '<div class="cc-chf-n">'+esc(list[0].n)+'</div>' : '')+'</div>';
}
function ccChestDone(){ ccChestClose(); if(CC_CHEST_DEMO) return ccChestDemo(); careerRenderHub(CH_TAB); }
function ccChestBack(){ if(CC_CHEST_DEMO) return ccChestDemo(); if(ccChestCan()) ccChestOpen(); else ccChestDone(); }
function ccChestRainHTML(){
  let h='<div class="cc-ch-rays"></div>';
  for(let i=0; i<16; i++) h+='<i class="cc-ch-rain" style="left:'+((i*37+5)%100)+'%;animation-delay:'+(i*.11).toFixed(2)+'s"></i>';
  return h;
}
function ccChestCoinNow(){ CC_CHEST_BUSY=false; ccPirateActivate(); }
function ccChestCoinLater(){ CC_CHEST_BUSY=false; const st=document.getElementById('ccChestStage'); if(st) st.remove(); ccChestBack(); }
/* Показ анимаций по адресу #chestdemo: без карьеры и без записи в сейв, для скринов и записи экрана. */
function ccChestDemo(){
  CC_CHEST_DEMO=true; CC_CHEST_BUSY=false;
  const T=ccChestT(), pts=[], pick=(flat, n, rare)=>{ for(let k=0, got=0; k<flat.length/2 && got<n; k++){ const i=(k*37)%(flat.length/2), x=flat[i*2], y=flat[i*2+1]; if(pts.some(s=>Math.hypot(s.x-x, s.y-y)<6.5)) continue; pts.push({x:x, y:y, rare:rare}); got++; } };
  pick(CC_S43_CHESTS.r, CC_CHEST_R, 1); pick(CC_S43_CHESTS.n, CC_CHEST_N, 0);
  const pin=s=>'<button class="cc-chm'+(s.rare ? ' r' : '')+'" style="left:'+s.x+'%;top:'+s.y+'%" onclick="ccChestDemoPlay(\'gun\')"><img src="items/creative/pirate-chest'+(s.rare ? '-rare' : '')+'-m.webp" alt=""></button>';
  const btn=(k, n)=>'<button class="cc-ch-btn q" onclick="ccChestDemoPlay(\''+k+'\')">'+n+'</button>';
  ccChestShow('<div class="cc-ch-box cc-chm-box"><div class="cc-ch-t">'+esc(T.map)+'</div><div class="cc-ch-s">'+esc(T.pick)+'</div><div class="cc-chm-map" id="ccChestMap">'+pts.map(pin).join('')+'</div>'+
    '<div class="cc-ch-btns">'+btn('gun', 'Weapon')+btn('item', 'Outfit')+btn('coin', 'Coin')+btn('free', 'Free shop')+'</div></div>');
}
function ccChestDemoPlay(k){
  if(CC_CHEST_BUSY) return;
  if(k==='free') return ccPirateFreeFx(1);
  const gun=S43_WEAPON_POOL.find(x=>x.name==='Bundlebuss Repeater Rifle' && x.rarity==='epic') || S43_WEAPON_POOL[0];
  const got=k==='coin' ? {coin:1} : k==='item' ? {item:{id:CC_CHEST_DROPS.o[0][0], t:'o', n:CC_CHEST_DROPS.o[0][1], r:CC_CHEST_DROPS.o[0][2]}} : {loot:{weapon:gun, cons:S43_CONSUMABLE_POOL.find(x=>/Tangerine/.test(x.name))}};
  ccChestStage({rare:k==='coin' ? 0 : 0}, got);
}
window.addEventListener('load', ()=>{ if(location.hash==='#chestdemo') setTimeout(ccChestDemo, 300); });
// Включить токен: срок идёт сразу, магазин рисуется под анимацией, она закрывается сама или по нажатию.
function ccPirateActivate(){
  if(CC_CHEST_DEMO) return ccPirateFreeFx(1);
  if(!ccPirateCanUse()) return;
  const p=ccPirate();
  if(ccPirateSlot()===2) p.on2=careerToday(); else p.on=careerToday();
  p.onS=CAREER.career.season||1; careerSave(); careerRenderHub('items');
  ccPirateFreeFx();
}
function ccPirateFreeFx(demo){
  const T=ccChestT();
  const m=ccChestShow('<div class="cc-chb-gold"></div>'+ccChestRainHTML()+'<div class="cc-ch-box"><span class="cc-coin cc-coin-spin">'+CC_COIN_SVG+'</span><div class="cc-ch-t">'+esc(ccPirateT().title)+'</div><span class="cc-ch-stamp">'+esc(T.free)+'</span></div>');
  const end=()=>{ if(!m.parentNode) return; m.remove(); if(demo) ccChestDemo(); };
  m.onclick=end;
  setTimeout(end, 2600);
}
// Выбор числа уровней: − n + и всё, что по карману; на кнопке итоговая цена.
function ccBpLvlHTML(p, T){
  const top=ccBpLvlMax(p), n=ccBpLvlPick(p), off=' disabled title="'+esc(T.noVb)+'"';
  const step=(d, txt)=>'<button class="cc-bp-step" aria-label="'+txt+'" '+(n+d<1 || n+d>top ? 'disabled' : '')+' onclick="ccBpLvlSet('+(n+d)+')">'+txt+'</button>';
  return '<div class="cc-bp-lvlbuy">'+step(-1, '−')+'<b class="cc-bp-lvln">'+n+'</b>'+step(1, '+')+
    '<button class="cc-bp-step cc-bp-lvlmax" '+(n>=top ? 'disabled' : '')+' onclick="ccBpLvlSet('+top+')">'+esc(T.lvlMax)+'</button>'+
    '<button class="cc-bp-lvlbtn"'+(top ? '' : off)+' onclick="ccBpBuyLvl()">'+esc(T.buyLvl)+' · <i class="cc-vb-ic"></i>'+ccNum(n*CC_BP_LVL_PRICE)+'</button></div>';
}
function ccBpHTML(){
  const T=ccBpT();
  if(typeof CC_FN_SHOP==='undefined'){
    ccFnShopLoad(()=>{ try{ ccBpGrantAll(); }catch(e){} if(CH_TAB==='bp') careerRenderHub('bp'); });
    return '<div class="ch-tile"><div class="ch-empty">'+esc(T.loading)+'</div></div>';
  }
  ccBpCheck();
  const p=ccBpCur();
  if(!p || !ccBpItems(p.n).length) return '<div class="ch-tile"><div class="ch-empty">'+esc(T.none)+'</div></div>';
  const news=p.news||0; if(news){ p.news=0; try{ careerSave(); }catch(e){} }
  const LX=ccBpLvlXp(p), lvl=ccBpLevel(p), into=lvl>=CC_BP_LVLS ? LX : p.xp-(lvl-1)*LX, vb=CAREER.vb||0, day=careerToday();
  const tag=(typeof ccSeasonTag==='function') ? ccSeasonTag(day) : {full:'S'+p.n};
  const left=ccDaysBetween(day, p.to);
  const head='<div class="ch-tile cc-bp-head"><div class="cc-bp-top"><div><h4>'+esc(T.tab)+'</h4><div class="ch-hint">'+esc(tag.full||('S'+p.n))+' · '+esc(T.left(left))+'</div></div>'+
    '<div class="cc-bp-lvl"><em>'+esc(T.lvl)+'</em><b>'+lvl+'</b></div></div>'+
    '<div class="cc-bp-bar"><i style="width:'+Math.round(into/LX*100)+'%"></i></div>'+
    '<div class="cc-bp-xp">'+(lvl>=CC_BP_LVLS ? esc(T.max) : esc(T.xpOf(ccNum(into), ccNum(LX))))+'<span><i class="cc-vb-ic"></i>'+ccNum(vb)+'</span></div>'+
    (news ? '<div class="cc-bp-news" role="status">'+esc(T.got)+' · '+news+' <button class="cc-fn-tolock" onclick="ccFnLockerOpen(\'o\')">'+esc(T.locker)+'</button></div>' : '')+
    '<div class="cc-bp-btns">'+(p.prem ? '<span class="cc-bp-own">'+esc(T.own)+'</span>'
      : '<button class="cc-bp-buy" '+(vb>=CC_BP_PRICE ? '' : 'disabled title="'+esc(T.noVb)+'"')+' onclick="ccBpBuy()">'+esc(T.buy)+' · <i class="cc-vb-ic"></i>'+CC_BP_PRICE+'</button>')+
      (lvl<CC_BP_LVLS ? ccBpLvlHTML(p, T) : '')+
    '</div><div class="ch-hint">'+esc(T.xpNote)+'</div></div>';
  // Неделя: текущая неделя сезона, три испытания с прогрессом.
  const w=Math.floor(ccDaysBetween(p.from, day)/7), c=p.wk[w]||{};
  const week='<div class="ch-tile cc-bp-week"><h4>'+esc(T.week)+'</h4>'+ccBpWeekChallenges(p.n, w).map((ch, i)=>{
      const have=Math.min(ch[1], c[ch[0]]||0), done=!!p.wd[w+'|'+i];
      return '<div class="cc-bp-ch'+(done ? ' done' : '')+'"><span>'+esc(T.ch[ch[0]](ch[1]))+'</span><em>'+(done ? '✓' : have+' / '+ch[1])+'</em><b>+'+ccNum(CC_BP_CH_XP)+'</b></div>';
    }).join('')+'</div>';
  // Дорожка страницами по 10 уровней, как в игре; открыта страница текущего уровня.
  if(CC_BP_PAGE==null || CC_BP_PAGE_K!==p.from){ CC_BP_PAGE=Math.min(CC_BP_PAGES-1, Math.floor((lvl-1)/10)); CC_BP_PAGE_K=p.from; }
  const tr=ccBpTrack(p.n), a=CC_BP_PAGE*10+1, z=a+9;
  let cells='';
  for(let L=a; L<=z; L++){
    const open=L<=lvl;
    cells+='<div class="cc-bp-col'+(L===lvl ? ' cur' : '')+'"><span class="cc-bp-n">'+L+'</span>'+
      ccBpRewardHTML(tr[L].f, open, open)+ccBpRewardHTML(tr[L].p, open, open && !!p.prem)+'</div>';
  }
  const track='<div class="ch-tile cc-bp-track"><div class="cc-bp-pager"><button onclick="ccBpPage(-1)" '+(CC_BP_PAGE>0 ? '' : 'disabled')+'>‹ '+esc(T.prev)+'</button>'+
    '<b>'+esc(T.page(a, z))+'</b><button onclick="ccBpPage(1)" '+(CC_BP_PAGE<CC_BP_PAGES-1 ? '' : 'disabled')+'>'+esc(T.next)+' ›</button></div>'+
    '<div class="cc-bp-rows"><div class="cc-bp-lane"><em>'+esc(T.free)+'</em><em>'+esc(T.paid)+'</em></div><div class="cc-bp-cols">'+cells+'</div></div></div>';
  return head+week+track;
}
// Надетое — объект предмета (для значка в матче и кирки в ленте); без данных магазина — только id.
function ccFnWorn(slot){
  const id=CAREER && CAREER.fnEq && CAREER.fnEq[slot];
  return id ? {id:id, name:(CAREER.fnOwn && CAREER.fnOwn[id] && CAREER.fnOwn[id].n) || id} : null;
}
// Иконка надетой кирки для ленты убийств (zone-replay.js читает window.CC_FN_AXE в строке твоего убийства).
try{ Object.defineProperty(window, 'CC_FN_AXE', {configurable:true, get(){
  const w=(typeof CAREER!=='undefined' && CAREER && CAREER.career) ? ccFnWorn('p') : null;
  return w ? ccFnImg(w.id, true) : null; }}); }catch(e){}
/* СКИНЫ В ЛЕНТЕ УБИЙСТВ (его слово 20.10: «добавь в килл фиде иконки скинов, которые используют игроки в игре»).
   Своя команда — надетый образ (шкафчик). Что носят настоящие игроки, не пишет ни один источник, поэтому у каждой
   команды свой постоянный образ: бросок по имени среди образов, которые к дню карьеры уже выходили в магазине
   Fortnite (fn-shop.js) — в 2019-м никто не ходит в скине 2026-го. Данные магазина грузятся сами при первом вызове. */
let CC_FN_SKIN_FIRST=null, CC_FN_SKIN_POOL=null;
function ccFnSkinPool(){
  if(typeof CC_FN_SHOP==='undefined'){ try{ ccFnShopLoad(null); }catch(e){} return null; }
  if(!CC_FN_SKIN_FIRST){
    if(!CC_FN_DAYS) CC_FN_DAYS=CC_FN_SHOP.days.split(';');
    const first=new Map();
    CC_FN_DAYS.forEach((row, n)=>{ if(row) row.split(',').forEach(s=>{ const i=parseInt(s, 36); const x=CC_FN_SHOP.items[i];
      if(x && x[2]==='o' && !first.has(i)) first.set(i, n); }); });
    CC_FN_SKIN_FIRST=[...first.entries()].sort((a,b)=>a[1]-b[1]);
  }
  // Пул — на начало сезона карьеры: образ команды держится весь сезон, а не меняется с каждым днём магазина.
  const day=String((CAREER && CAREER.career && typeof ccYearFrom==='function' && ccYearFrom()) || CC_FN_SHOP.last).slice(0, 10);
  const n=Math.max(0, ccDaysBetween(CC_FN_SHOP.first, day > CC_FN_SHOP.last ? CC_FN_SHOP.last : day));
  if(!CC_FN_SKIN_POOL || CC_FN_SKIN_POOL.n!==n){
    const ids=CC_FN_SKIN_FIRST.filter(e=>e[1]<=n).map(e=>CC_FN_SHOP.items[e[0]][0]);
    CC_FN_SKIN_POOL={n:n, ids:ids.length ? ids : CC_FN_SKIN_FIRST.slice(0, 50).map(e=>CC_FN_SHOP.items[e[0]][0])};
  }
  return CC_FN_SKIN_POOL.ids;
}
try{ window.CC_FN_SKIN=function(name, you){
  if(typeof CAREER==='undefined' || !CAREER || !CAREER.career) return null;
  if(you){ const w=ccFnWorn('o'); if(w) return ccFnImg(w.id, true); }
  const pool=ccFnSkinPool(); if(!pool || !pool.length) return null;
  return ccFnImg(pool[Math.abs(ccHashStr('skin|'+String(name||'').toLowerCase()))%pool.length], true);
}; }catch(e){}
function ccVbBuy(k){
  const cr=CAREER.career, p=ccVbPacks()[k];
  if(!p || (cr.balance||0)<p.usd) return;
  cr.balance=Math.round(((cr.balance||0)-p.usd)*100)/100;
  CAREER.vb=(CAREER.vb||0)+p.vb;
  CC_FN_JUST={vb:p.vb};
  careerSave(); careerRenderHub('items');
}
/* «Купить всё»: все некупленные предметы дня. Не хватает V-Bucks — докупаются самым выгодным набором дня на деньги карьеры. */
function ccFnBuyAllPlan(){
  const day=careerToday(), own=ccFnOwn();
  const its=(ccFnShopDay(day)||[]).filter(it=>!own[it.id]);
  const vbNeed=its.reduce((s, it)=>s+ccFnCost(it), 0);
  const short=Math.max(0, vbNeed-(CAREER.vb||0));
  let pack=null, n=0, usd=0;
  if(short>0){
    pack=ccVbPacks(day).slice().sort((a, b)=>b.vb/b.usd-a.vb/a.usd)[0]||null;
    if(pack){ n=Math.ceil(short/pack.vb); usd=Math.round(n*pack.usd*100)/100; }
  }
  const ok=its.length>0 && (short===0 || (pack && (CAREER.career.balance||0)>=usd));
  return {its, vbNeed, short, pack, n, usd, ok};
}
function ccFnBuyAllHTML(){
  const T=L(), p=ccFnBuyAllPlan();
  if(!p.its.length) return '';
  const lbl=(T.ccFnBuyAll ? T.ccFnBuyAll(p.its.length) : 'Buy all ('+p.its.length+')');
  return '<button class="cc-fn-buyall" '+(p.ok ? '' : 'disabled title="'+esc(T.ccFnNoVb||'')+'"')+' onclick="ccFnBuyAllAsk()">'+esc(lbl)+
    ' · '+ccFnTag(p.vbNeed)+(p.usd ? ' · $'+p.usd.toFixed(2) : '')+'</button>';
}
function ccFnBuyAllAsk(){
  const T=L(), p=ccFnBuyAllPlan(); if(!p.ok) return;
  const q=T.ccFnBuyAllAsk ? T.ccFnBuyAllAsk(p.its.length, ccNum(p.vbNeed), p.usd ? '$'+p.usd.toFixed(2) : '')
    : 'Buy '+p.its.length+' items for '+ccNum(p.vbNeed)+' V-Bucks'+(p.usd ? ' (top up $'+p.usd.toFixed(2)+')' : '')+'?';
  ccAsk(ccPirateOn() ? (T.ccFnBuyAll ? T.ccFnBuyAll(p.its.length) : 'Buy all ('+p.its.length+')')+' · '+ccChestT().freeW+'?' : q, ccFnBuyAll);
}
function ccFnBuyAll(){
  const p=ccFnBuyAllPlan(); if(!p.ok) return;
  const cr=CAREER.career, day=careerToday(), own=ccFnOwn(), eq=ccFnEq();
  if(p.usd){ cr.balance=Math.round(((cr.balance||0)-p.usd)*100)/100; CAREER.vb=(CAREER.vb||0)+p.n*p.pack.vb; }
  p.its.forEach(it=>{
    const price=ccFnCost(it); if((CAREER.vb||0)<price) return;
    CAREER.vb-=price;
    own[it.id]={t:it.t, n:it.name, r:it.r, d:day};
    if(!eq[it.t]) eq[it.t]=it.id;
    ccSacSpend(price);
  });
  CC_FN_JUST={name:(L().ccFnBoughtAll ? L().ccFnBoughtAll(p.its.length) : p.its.length+' items')};
  careerSave(); careerRenderHub('items');
}
function ccFnBuy(i){
  const it=ccFnItem(i), day=careerToday(), today=ccFnShopDay(day)||[];
  if(!it || !today.some(x=>x.i===i) || ccFnOwn()[it.id]) return;
  const price=ccFnCost(it);
  if((CAREER.vb||0)<price) return;
  CAREER.vb-=price;
  ccFnOwn()[it.id]={t:it.t, n:it.name, r:it.r, d:day};
  if(!ccFnEq()[it.t]) ccFnEq()[it.t]=it.id;
  CC_FN_JUST={name:it.name, t:it.t};
  ccSacSpend(price);
  careerSave(); careerRenderHub('items');
}
/* НАБОРЫ (Bundle) — его «123» 21.10 на «что ещё можно добавить» в магазин. Цена и дни набора — настоящие (fortnite.gg,
   CC_FN_SHOP.bun: [имя, цена, первый день, последний]); состава там нет, поэтому набор встаёт в витрину, только когда
   в ней стоит скин или сет с его именем («Psycho Bundle» — сет Psycho), и собирается из этих предметов. Зачёркнутая
   цена — сумма их цен по отдельности, как в игре; уже купленное убавляет цену набора долей (так делает и Epic). */
let CC_FN_BUN_TODAY=[];
function ccFnDataDay(day){
  let d=String(day||'').slice(0, 10), guard=0;
  while(typeof CC_FN_SHOP!=='undefined' && d>CC_FN_SHOP.last && guard++<20) d=ccAddDays(d, -364);
  return d;
}
function ccFnBundles(list, day){
  const B=(typeof CC_FN_SHOP!=='undefined' && CC_FN_SHOP.bun) || [], d=ccFnDataDay(day), out=[];
  const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g, '');
  const bySet=new Map(), outfit=new Map();
  list.forEach(it=>{ if(it.set){ const k=norm(it.set); if(!bySet.has(k)) bySet.set(k, []); bySet.get(k).push(it); }
                     if(it.t==='o') outfit.set(norm(it.name), it); });
  const used=new Set();
  B.forEach(b=>{
    if(!(b[2]<=d && d<=b[3])) return;
    const base=norm(String(b[0]).replace(/\s*bundle$/i, ''));
    let its=bySet.get(base), set=null;
    if(its) set=its[0].set;
    else { const o=outfit.get(base); if(o && o.set){ its=bySet.get(norm(o.set)); set=o.set; } }
    if(!its || its.length<2 || used.has(set)) return;
    its=ccFnBunTrim(its, b[1], outfit.get(base));
    if(its.length<2) return;
    const sum=its.reduce((s, it)=>s+ccFnPrice(it), 0);
    if(!(b[1]<sum)) return;
    used.add(set);
    out.push({k:out.length, name:b[0], p:b[1], sum:sum, set:set, its:its});
  });
  return out;
}
/* Состав набора не больше, чем стоит его цена. Набор с именем скина брал всю серию: «Yuji Itadori Bundle» за 1 900
   получал 26 предметов Jujutsu Kaisen на 21 100. Наборы Epic дают скидку около трети, поэтому сюда идёт его скин,
   потом рюкзак, кирка, глайдер и остальное, пока сумма не дойдёт до цены / 0.6. */
const CC_FN_BUN_OFF=0.6;
function ccFnBunTrim(its, price, hero){
  const sumOf=a=>a.reduce((s, it)=>s+ccFnPrice(it), 0);
  const cap=price/CC_FN_BUN_OFF;
  if(sumOf(its)<=cap*1.15) return its;
  const rank={o:0, b:1, p:2, g:3, e:4, w:5};
  // Набор одного персонажа — без чужих скинов.
  const rest=its.filter(it=>it!==hero && !(hero && it.t==='o')).sort((a, c)=>(rank[a.t]!=null ? rank[a.t] : 9)-(rank[c.t]!=null ? rank[c.t] : 9) || ccFnPrice(c)-ccFnPrice(a));
  const out=hero ? [hero] : [];
  let sum=sumOf(out);
  rest.forEach(it=>{ const p=ccFnPrice(it); if(sum+p<=cap*1.15){ out.push(it); sum+=p; } });
  return out;
}
function ccFnBunPrice(b){
  const own=ccFnOwn(), left=b.its.filter(it=>!own[it.id]).reduce((s, it)=>s+ccFnPrice(it), 0);
  return left<=0 ? 0 : Math.max(100, Math.round(b.p*left/b.sum/50)*50);
}
function ccFnBunHTML(b, era){
  const T=L(), own=ccFnOwn(), all=b.its.every(it=>own[it.id]), price=ccFnBunPrice(b), off=b.sum-b.p;
  const hero=b.its.find(it=>it.t==='o') || b.its[0];
  const bg=(era && era.noRar) ? ccFnSetHue(hero) : (CC_FN_RAR[hero.r] || CC_FN_RAR.rare);
  return '<div class="cc-fn-it big bun'+(all ? ' own' : '')+'" data-t="o" style="--fn-bg:'+bg+'" onclick="ccFnPeekBun(event,'+b.k+')">'+
    ((all || ccPirateOn()) ? '' : '<span class="cc-fn-tag">'+esc(T.ccFnOff ? T.ccFnOff(off) : off+' V-Bucks off')+'</span>')+
    '<span class="cc-fn-img"><img src="'+ccFnImg(hero.id)+'" alt="" loading="lazy" onerror="this.remove()"></span>'+
    '<b>'+esc(b.name)+'</b><em>'+esc(T.ccFnBundleN ? T.ccFnBundleN(b.its.length) : b.its.length+' items')+'</em>'+
    (all ? '<span class="cc-fn-own">'+esc(T.ccFnOwned)+'</span>'
      : '<button class="cc-fn-buy" '+((ccPirateOn() || (CAREER.vb||0)>=price) ? '' : 'disabled title="'+esc(T.ccFnNoVb)+'"')+' onclick="ccFnBuyBundle('+b.k+')">'+
          ccFnTag(price, (price<b.sum || ccPirateOn()) ? b.sum : 0)+'</button>')+'</div>';
}
function ccFnBuyBundle(k){
  const b=CC_FN_BUN_TODAY[k], day=careerToday(); if(!b) return;
  const today=new Set((ccFnShopDay(day)||[]).map(x=>x.i));
  if(!b.its.every(it=>today.has(it.i))) return;
  const base=ccFnBunPrice(b); if(!base) return;
  const price=ccPirateOn() ? 0 : base; if((CAREER.vb||0)<price) return;
  CAREER.vb-=price;
  const own=ccFnOwn(), eq=ccFnEq();
  b.its.forEach(it=>{ if(!own[it.id]){ own[it.id]={t:it.t, n:it.name, r:it.r, d:day}; if(!eq[it.t]) eq[it.t]=it.id; } });
  CC_FN_JUST={name:b.name, t:'o'};
  ccSacSpend(price);
  ccFnPeekClose();
  careerSave(); careerRenderHub('items');
}
/* ПАКИ ЗА ДЕНЬГИ (Notion «26.10.26», тестер: «add packs for money example: polar legends pack, agency renegades pack»;
   его «паки за деньги пусть будут, какие были в игре»). Настоящие паки Epic (Starter, Legends, Quest Packs) — вики,
   tools/fetch-fn-packs.js + build-fn-packs.js → CC_FN_SHOP.packs: [имя, день выхода, цена $, V-Bucks внутри, предметы].
   Покупаются с баланса карьеры, как V-Bucks: цена США той даты × множитель региона (CC_VB_REGION). Сколько пак стоял
   в магазине, вики не пишет — у нас CC_FN_PACK_DAYS дней с выхода (наша мерка). Уже купленные предметы пака не дешевят:
   у Epic пак за деньги продаётся одной ценой. */
const CC_FN_PACK_DAYS=30;
let CC_FN_PACK_TODAY=[];
function ccFnPackT(){
  return ({ru:{h:'Паки', n:n=>'предметов: '+n, own:'Куплен', bal:'Баланс карьеры', noBal:'Не хватает денег на балансе карьеры', note:'Паки Epic за деньги: с баланса карьеры, цена своего региона. Каждый пак стоит в магазине 30 дней с выхода.'},
    fr:{h:'Packs', n:n=>n+' objets', own:'Acheté', bal:'Solde de la carrière', noBal:'Solde de la carrière insuffisant', note:'Packs Epic en argent réel : payés avec le solde de la carrière, au prix de ta région. Chaque pack reste 30 jours en boutique.'},
    it:{h:'Pacchetti', n:n=>n+' oggetti', own:'Acquistato', bal:'Saldo della carriera', noBal:'Saldo della carriera insufficiente', note:'Pacchetti Epic a pagamento: si pagano col saldo della carriera, al prezzo della tua regione. Ogni pacchetto resta 30 giorni nel negozio.'},
    pt:{h:'Pacotes', n:n=>n+' itens', own:'Comprado', bal:'Saldo da carreira', noBal:'Saldo da carreira insuficiente', note:'Pacotes da Epic pagos em dinheiro: saem do saldo da carreira, pelo preço da sua região. Cada pacote fica 30 dias na loja.'},
    de:{h:'Packs', n:n=>n+' Gegenstände', own:'Gekauft', bal:'Karriere-Guthaben', noBal:'Nicht genug Karriere-Guthaben', note:'Echtgeld-Packs von Epic: bezahlt mit dem Karriere-Guthaben, zum Preis deiner Region. Jedes Pack bleibt 30 Tage im Shop.'},
    es:{h:'Packs', n:n=>n+' objetos', own:'Comprado', bal:'Saldo de la carrera', noBal:'Saldo de la carrera insuficiente', note:'Packs de Epic con dinero real: se pagan con el saldo de la carrera, al precio de tu región. Cada pack está 30 días en la tienda.'}})[LANG]
    || {h:'Packs', n:n=>n+' items', own:'Owned', bal:'Career balance', noBal:'Not enough career balance', note:'Epic real-money packs: paid from the career balance at your region’s price. Each pack stays in the shop for 30 days after release.'};
}
function ccFnBalHTML(){ return '<div class="cc-fn-bal">'+esc(ccFnPackT().bal)+': <b>$'+(Math.round((CAREER.career.balance||0)*100)/100).toFixed(2)+'</b></div>'; }
function ccFnPacksToday(day){
  const P=(typeof CC_FN_SHOP!=='undefined' && CC_FN_SHOP.packs) || [], d=ccFnDataDay(day), m=CC_VB_REGION[ccCareerRegion()] || 1;
  return P.filter(p=>p[1]<=d && d<ccAddDays(p[1], CC_FN_PACK_DAYS)).map((p, k)=>({k:k, name:p[0], usd:Math.round(p[2]*m*100)/100, vb:p[3]||0,
    its:p[4].map(x=>({id:x[0], t:x[1], r:x[2], name:x[3]}))}));
}
function ccFnPackOwned(p){ const own=ccFnOwn(); return p.its.every(it=>own[it.id]); }
function ccFnPackHTML(p, era){
  const T=ccFnPackT(), all=ccFnPackOwned(p), hero=p.its.find(it=>it.t==='o') || p.its[0];
  const bg=(era && era.noRar) ? ccFnSetHue(hero) : (CC_FN_RAR[hero.r] || CC_FN_RAR.rare);
  return '<div class="cc-fn-it big bun cc-fn-pack'+(all ? ' own' : '')+'" data-t="o" style="--fn-bg:'+bg+'">'+
    '<span class="cc-fn-img"><img src="'+ccFnImg(hero.id)+'" alt="" loading="lazy" onerror="this.remove()"></span>'+
    '<b>'+esc(p.name)+'</b><em>'+esc(T.n(p.its.length))+(p.vb ? ' · +'+ccNum(p.vb)+' V-Bucks' : '')+'</em>'+
    '<span class="cc-fn-pack-its">'+p.its.slice(0, 6).map(it=>'<img src="'+ccFnImg(it.id, true)+'" alt="" title="'+esc(it.name)+'" loading="lazy" onerror="this.remove()">').join('')+'</span>'+
    (all ? '<span class="cc-fn-own">'+esc(T.own)+'</span>'
      : '<button class="cc-fn-buy" '+(((CAREER.career.balance||0)>=p.usd) ? '' : 'disabled title="'+esc(T.noBal)+'"')+' onclick="ccFnBuyPack('+p.k+')">$'+p.usd.toFixed(2)+'</button>')+'</div>';
}
function ccFnBuyPack(k){
  const cr=CAREER.career, day=careerToday();
  const p=ccFnPacksToday(day).find(x=>x.k===k);
  if(!p || ccFnPackOwned(p) || (cr.balance||0)<p.usd) return;
  cr.balance=Math.round(((cr.balance||0)-p.usd)*100)/100;
  if(p.vb) CAREER.vb=(CAREER.vb||0)+p.vb;
  const own=ccFnOwn(), eq=ccFnEq();
  p.its.forEach(it=>{ if(!own[it.id]){ own[it.id]={t:it.t, n:it.name, r:it.r, d:day}; if(!eq[it.t]) eq[it.t]=it.id; } });
  CC_FN_JUST={name:p.name, t:'o'};
  careerSave(); careerRenderHub('items');
}
/* ПОКАЗ ПРЕДМЕТА (там же, пункт 3): нажатие на плитку — большая картинка (скин в полный рост, featured.png), имя, тип,
   набор, стили и покупка, как панель справа в магазине Глав 5–7. Нажатие на саму цену — сразу покупка, как было. */
function ccFnPeekClose(){ const o=document.getElementById('ccFnPeek'); if(o) o.remove(); }
function ccFnPeekOpen(html){
  ccFnPeekClose();
  const o=document.createElement('div'); o.id='ccFnPeek'; o.className='cc-fn-peek';
  o.onclick=e=>{ if(e.target===o) ccFnPeekClose(); };
  o.innerHTML='<div class="cc-fn-peek-in" role="dialog" aria-modal="true"><button class="cc-fn-peek-x" onclick="ccFnPeekClose()" aria-label="Close">✕</button>'+html+'</div>';
  document.body.appendChild(o);
}
function ccFnPeek(e, i){
  if(e && e.target && e.target.closest('button')) return;
  const it=ccFnItem(i); if(!it) return;
  const T=L(), own=!!ccFnOwn()[it.id], price=ccFnCost(it), era=ccFnShopEra(careerToday());
  const bg=era.noRar ? ccFnSetHue(it) : (CC_FN_RAR[it.r] || CC_FN_RAR.rare), nSty=CC_FN_STYLES_ON ? (CC_FN_SHOP.sty||{})[i] : 0;
  const img=it.t==='o' ? ccFnFull(it.id) : ccFnImg(it.id);
  ccFnPeekOpen('<div class="cc-fn-peek-art" style="--fn-bg:'+bg+'"><img src="'+img+'" alt="" onerror="if(!this.dataset.f){this.dataset.f=1;this.src=\''+ccFnImg(it.id)+'\';}else this.remove()"></div>'+
    '<div class="cc-fn-peek-txt"><b>'+esc(it.name)+'</b><em>'+esc(T['ccFnType_'+it.t]||'')+(it.set ? ' · '+esc(it.set) : '')+'</em>'+
    (nSty ? '<span class="cc-fn-peek-sty">+ '+esc(T.ccFnStylesN ? T.ccFnStylesN(nSty) : nSty+' styles')+'</span>' : '')+
    (own ? '<span class="cc-fn-own">'+esc(T.ccFnOwned)+'</span>'
      : '<button class="cc-fn-buy" '+((CAREER.vb||0)>=price ? '' : 'disabled title="'+esc(T.ccFnNoVb)+'"')+' onclick="ccFnBuy('+i+');ccFnPeekClose()">'+ccFnTag(price, ccPirateOn() ? ccFnPrice(it) : 0)+'</button>')+'</div>');
}
function ccFnPeekBun(e, k){
  if(e && e.target && e.target.closest('button')) return;
  const b=CC_FN_BUN_TODAY[k]; if(!b) return;
  const T=L(), own=ccFnOwn(), price=ccFnBunPrice(b), hero=b.its.find(it=>it.t==='o') || b.its[0];
  ccFnPeekOpen('<div class="cc-fn-peek-art" style="--fn-bg:'+ccFnSetHue(hero)+'"><img src="'+ccFnFull(hero.id)+'" alt="" onerror="if(!this.dataset.f){this.dataset.f=1;this.src=\''+ccFnImg(hero.id)+'\';}else this.remove()"></div>'+
    '<div class="cc-fn-peek-txt"><b>'+esc(b.name)+'</b><em>'+esc(T.ccFnBundleN ? T.ccFnBundleN(b.its.length) : b.its.length+' items')+'</em>'+
    '<span class="cc-fn-peek-its">'+b.its.map(it=>'<span'+(own[it.id] ? ' class="own"' : '')+'><img src="'+ccFnImg(it.id, true)+'" alt="" loading="lazy" onerror="this.remove()"><i>'+esc(it.name)+'</i></span>').join('')+'</span>'+
    (price ? '<button class="cc-fn-buy" '+((ccPirateOn() || (CAREER.vb||0)>=price) ? '' : 'disabled title="'+esc(T.ccFnNoVb)+'"')+' onclick="ccFnBuyBundle('+k+')">'+ccFnTag(price, (price<b.sum || ccPirateOn()) ? b.sum : 0)+'</button>'
      : '<span class="cc-fn-own">'+esc(T.ccFnOwned)+'</span>')+'</div>');
}
/* КОД АВТОРА (его выбор 20.10). Как в игре: в магазине вписываешь код креатора, и 5% твоих покупок идёт ему
   (у нас — счётчик CAREER.sac.vb; за каждые 5000 V-Bucks поддержки креатор благодарит в ленте, +подписчики — оценка
   режима). Свой код — с 1000 подписчиков (порог Support-a-Creator у Epic); раз в месяц он платит 5% с покупок фанатов:
   подписчики × 0,4% покупающих × $8 × 5% — ОЦЕНКА режима, у Epic числа фанатских покупок нет. */
const CC_SAC_MIN=1000, CC_SAC_THANK=5000, CC_SAC_RATE=0.004*8*0.05;
// Все, у кого в игре есть код: креаторы Про-Ама и каналы CC_CREATORS_MORE (про-игроки тоже, у Bugha и Clix коды есть).
function ccSacCreators(){
  const out=[], seen=new Set();
  const add=(name, login, fol, ava)=>{ const k=String(login||name).toLowerCase(); if(seen.has(k)) return; seen.add(k); out.push({name, fol:fol||0, ava}); };
  if(typeof CC_PROAM_TWITCH!=='undefined') Object.keys(CC_PROAM_TWITCH).forEach(n=>{
    const t=CC_PROAM_TWITCH[n]||[]; add(n, t[0], t[1], typeof ccProAmAvatar==='function' ? ccProAmAvatar(n) : ''); });
  if(typeof CC_CREATORS_MORE!=='undefined') Object.keys(CC_CREATORS_MORE).forEach(rg=>(CC_CREATORS_MORE[rg]||[]).forEach(([n, login, f, file])=>
    add(n, login, f, file ? 'photos/creators/'+file : '')));
  return out.sort((a,b)=>b.fol-a.fol);
}
function ccSacFilter(q){
  q=String(q||'').trim().toLowerCase();
  document.querySelectorAll('#ccSacModal .cc-sac-list button').forEach(b=>{ b.style.display=(!q || b.dataset.n.indexOf(q)>=0) ? '' : 'none'; });
}
function ccSacSet(name){
  CAREER.sac=name ? {code:name, since:careerToday(), vb:0, thanked:0} : null;
  ccSacPickClose(); careerSave(); careerRenderHub('items');
}
function ccSacSpend(price){
  const s=CAREER.sac; if(!s || !s.code) return;
  s.vb=(s.vb||0)+Math.round(price*0.05);   // без благодарностей в ленте (его слово 20.10: «код автора не надо благодарить»)
}
function ccSacOwnOn(){ try{ return careerReach()>=CC_SAC_MIN; }catch(e){ return false; } }
/* СВОЙ КОД (его слово 20.10: «пусть будет возможность создать свой код автора и получать деньги с этого»): с 1000
   подписчиков кнопка «Создать код» — код по нику (можно свой: 3–16 латинских букв и цифр); платит только созданный. */
function ccSacOwnCode(){ return (CAREER && CAREER.sacOwn && CAREER.sacOwn.code) || null; }
function ccSacCreate(){
  if(!ccSacOwnOn() || ccSacOwnCode()) return;
  const inp=document.getElementById('ccSacOwnIn');
  let code=String((inp && inp.value) || CAREER.player.nick || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
  if(code.length<3) code=('CODE'+code).slice(0, 16);
  CAREER.sacOwn={code, since:careerToday(), earned:0};
  careerNews('good', 'ccNewsSacOwn', [code]);
  careerSave(); careerRenderHub('items');
}
/* ПИАР КОДА В X (его слово 20.10: «можно в твиттер добавить, чтоб пиарить код»). Пост, где стоит твой код, — промо:
   за месяц выплата по коду растёт на CC_SAC_PROMO за каждый такой пост, засчитывается один в день и не больше
   CC_SAC_PROMO_MAX постов (+45%). Как в жизни: код в био ничего не делает, код в посте после хорошего вечера — делает.
   ОЦЕНКА режима, у Epic числа нет. Идея поста с кодом — первой в «идеях» над полем (ccPostIdeas). */
const CC_SAC_PROMO=0.15, CC_SAC_PROMO_MAX=3;
function ccSacPromoOf(month){ const p=CAREER && CAREER.sacOwn && (CAREER.sacOwn.promo||{})[month]; return p ? Math.min(CC_SAC_PROMO_MAX, p.n||0) : 0; }
function ccSacPromoMul(month){ return 1+CC_SAC_PROMO*ccSacPromoOf(month); }
// Засчитать пост как промо, если в нём стоит свой код. Возвращает true, если засчитан.
function ccSacPromoPost(text){
  const code=ccSacOwnCode(); if(!code || !ccSacOwnOn()) return false;
  if(String(text||'').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').split(' ').indexOf(code)<0) return false;
  const o=CAREER.sacOwn, m=ccMonthKey(), d=careerToday();
  o.promo=o.promo||{};
  const p=o.promo[m]||(o.promo[m]={n:0, days:[]});
  if(p.days.indexOf(d)>=0 || p.n>=CC_SAC_PROMO_MAX) return false;
  p.days.push(d); p.n++;
  // Старые месяцы не копятся в сейве.
  Object.keys(o.promo).forEach(k=>{ if(k<ccMonthKey(ccAddDays(d, -62))) delete o.promo[k]; });
  return true;
}
// Выплата своего кода — за каждый перейдённый первое число месяца (из careerAdvanceBody). Платится за прошлый месяц —
// и прибавка от промо того месяца.
function ccSacTick(from, to){
  if(!CAREER || !CAREER.career || !ccSacOwnCode() || !ccSacOwnOn() || !(to>from)) return;
  let paid=0;
  for(let d=ccAddDays(from, 1); d<=to; d=ccAddDays(d, 1)) if(d.slice(8)==='01') paid+=Math.round(careerReach()*CC_SAC_RATE*ccSacPromoMul(ccMonthKey(ccAddDays(d, -1))));
  if(!paid) return;
  const cr=CAREER.career; cr.balance=Math.round(((cr.balance||0)+paid)*100)/100; cr.earnings=(cr.earnings||0);
  CAREER.sacOwn.earned=Math.round(((CAREER.sacOwn.earned||0)+paid)*100)/100;
  careerNews('good', 'ccNewsSacPaid', [ccNum(paid), ccSacOwnCode()]);
}
function ccSacPickOpen(){
  const T=L(), list=ccSacCreators();
  let el=document.getElementById('ccSacModal');
  if(!el){ el=document.createElement('div'); el.id='ccSacModal'; el.className='cc-sac-modal'; document.body.appendChild(el); }
  el.innerHTML='<div class="cc-sac-in"><h4>'+esc(T.ccSacTitle||'Support a Creator')+'</h4><button class="cc-sac-x" onclick="ccSacPickClose()">✕</button>'+
    '<input class="cc-sac-q" type="search" placeholder="'+esc(T.ccSacFind||'Search')+'" oninput="ccSacFilter(this.value)">'+
    '<div class="cc-sac-list">'+list.map(c=>'<button data-n="'+esc(c.name.toLowerCase())+'" onclick="ccSacSet(\''+esc(c.name).replace(/'/g, '')+'\')">'+
      (c.ava ? '<img src="'+esc(c.ava)+'" alt="" loading="lazy" onerror="this.remove()">' : '<i>'+esc(c.name.slice(0,1))+'</i>')+
      '<b>'+esc(c.name)+'</b><em>'+esc(ccFollowers(c.fol))+'</em></button>').join('')+'</div>'+
    (CAREER.sac ? '<button class="cc-sac-off" onclick="ccSacSet(null)">'+esc(T.ccSacOff||'Remove code')+'</button>' : '')+'</div>';
  el.style.display='flex';
}
function ccSacPickClose(){ const el=document.getElementById('ccSacModal'); if(el) el.style.display='none'; }
function ccSacTileHTML(){
  const T=L(), s=CAREER.sac, own=ccSacOwnOn();
  return '<div class="cc-sac"><span><em>'+esc(T.ccSacTitle||'Support a Creator')+'</em>'+
    (s ? '<b>'+esc(s.code)+'</b><small>'+esc(T.ccSacGiven ? T.ccSacGiven(ccNum(s.vb||0)) : (s.vb||0)+' V-Bucks')+'</small>' : '<b>—</b>')+'</span>'+
    '<button onclick="ccSacPickOpen()">'+esc(s ? (T.ccSacChange||'Change') : (T.ccSacEnter||'Enter code'))+'</button>'+
    '<span class="cc-sac-own"><em>'+esc(T.ccSacOwn||'Your code')+'</em>'+(ccSacOwnCode()
      ? '<b>'+esc(ccSacOwnCode())+'</b><small>'+esc(T.ccSacOwnPay ? T.ccSacOwnPay(ccNum(Math.round(careerReach()*CC_SAC_RATE*ccSacPromoMul(ccMonthKey()))))  : '')+
        ' · '+esc(T.ccSacPromoRow ? T.ccSacPromoRow(ccSacPromoOf(ccMonthKey()), CC_SAC_PROMO_MAX, Math.round(CC_SAC_PROMO*100*ccSacPromoOf(ccMonthKey()))) : '')+
        ' · '+esc(T.ccSacOwnEarned ? T.ccSacOwnEarned(ccNum(CAREER.sacOwn.earned||0)) : '')+'</small>'
      : own ? '<span class="cc-sac-mk"><input id="ccSacOwnIn" maxlength="16" value="'+esc(String(CAREER.player.nick||'').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0,16))+'">'+
        '<button onclick="ccSacCreate()">'+esc(T.ccSacCreate||'Create code')+'</button></span>'
      : '<small>'+esc(T.ccSacOwnLock ? T.ccSacOwnLock(ccNum(CC_SAC_MIN)) : '')+'</small>')+'</span></div>';
}
/* ПОДАРОК ИЗ МАГАЗИНА (его выбор 20.10): любой предмет витрины дня можно подарить — напарнику или тому, с кем у тебя
   переписка (не клубу, не менеджеру и не штабу). Платишь V-Bucks, он пишет «спасибо» в личку; у напарника растёт
   терпение (+8, до 100). Один и тот же предмет одному человеку — один раз. */
function ccGiftPeople(){
  const out=[], seen=new Set();
  const add=(h, rec)=>{ if(!h) return; const k=hKey(h); if(seen.has(k)) return; seen.add(k); out.push({h, rec}); };
  (CAREER.partners||[]).forEach(r=>{ const c=ccMateCardOf(r); if(c) add(c.handle, r); });
  careerDms().forEach(t=>{ const w=t.who||{}; if(w.org || w.agent || w.staff || w.club) return; add(w.handle, null); });
  return out.slice(0, 30);
}
function ccFnGiftOpen(i){
  const T=L(), it=ccFnItem(i); if(!it) return;
  const price=ccFnPrice(it), sent=CAREER.fnGifts||{};
  let el=document.getElementById('ccSacModal');
  if(!el){ el=document.createElement('div'); el.id='ccSacModal'; el.className='cc-sac-modal'; document.body.appendChild(el); }
  const ppl=ccGiftPeople();
  el.innerHTML='<div class="cc-sac-in"><h4>'+esc(T.ccFnGiftTitle ? T.ccFnGiftTitle(it.name, ccNum(price)) : 'Gift '+it.name)+'</h4><button class="cc-sac-x" onclick="ccSacPickClose()">✕</button>'+
    (ppl.length ? '<div class="cc-sac-list">'+ppl.map(p=>{ const done=(sent[hKey(p.h)]||[]).indexOf(it.id)>=0;
      return '<button '+(done ? 'disabled' : '')+' onclick="ccFnGift('+i+', \''+esc(String(p.h)).replace(/'/g, '')+'\')">'+
        '<i>'+esc(String(p.h).slice(0,1).toUpperCase())+'</i><b>'+esc(p.h)+'</b><em>'+esc(done ? (T.ccFnGiftDone||'already gifted') : (p.rec ? (T.ccFnGiftMate||'teammate') : ''))+'</em></button>'; }).join('')+'</div>'
      : '<div class="ch-empty">'+esc(T.ccFnGiftNobody||'Nobody to gift yet')+'</div>')+'</div>';
  el.style.display='flex';
}
function ccFnGift(i, handle){
  const it=ccFnItem(i), day=careerToday(), today=ccFnShopDay(day)||[];
  if(!it || !today.some(x=>x.i===i)) return;
  const price=ccFnPrice(it), k=hKey(handle);
  CAREER.fnGifts=CAREER.fnGifts||{};
  if((CAREER.fnGifts[k]||[]).indexOf(it.id)>=0 || (CAREER.vb||0)<price) return;
  CAREER.vb-=price;
  CAREER.fnGifts[k]=(CAREER.fnGifts[k]||[]).concat(it.id);
  ccSacSpend(price);
  const p=ccGiftPeople().find(x=>hKey(x.h)===k);
  if(p && p.rec) p.rec.patience=Math.min(100, (p.rec.patience||50)+8);
  try{ const t=careerDmFind(handle) || (p && p.rec ? careerMateThread() : null); if(t) careerDmPush(t, 'them', 'dmGiftThanks', [it.name]); }catch(e){}
  // Поста в Медиа нет (28.10, его «подарки из магазина тоже»): спасибо приходит в личку, этого достаточно.
  CC_FN_JUST={name:it.name};
  ccSacPickClose(); careerSave(); careerRenderHub('items');
}
function ccFnEquip(slot, id){
  if(id && !(ccFnOwn()[id] && ccFnOwn()[id].t===slot)) return;
  if(id) ccFnEq()[slot]=id; else delete ccFnEq()[slot];
  CC_FN_PICK=null; careerSave();
  // Новый образ — напарнику сразу, его лобби рисует меня в нём (MP.card, fnSkin).
  if(slot==='o' && ccMpOn() && typeof MP!=='undefined' && MP.sendCard) MP.sendCard();
  careerRenderHub(CH_TAB);
}
function ccFnPick(slot){ CC_FN_PICK=CC_FN_PICK===slot ? null : slot; careerRenderHub(CH_TAB); }
function ccFnShopOpen(){ careerTab('items'); }
function ccFnLockerOpen(slot){ CC_FN_PICK=slot||'o'; careerTab('locker'); }
function ccFnCardHTML(it, owned, canPay, big, era, day){
  const bg=(era && era.noRar) ? ccFnSetHue(it) : (CC_FN_RAR[it.r] || CC_FN_RAR.rare), T=L();
  const isNew=!owned && ccFnIsNew(it, day);
  return '<div class="cc-fn-it '+(big ? 'big' : 'sm')+(owned ? ' own' : '')+'" data-i="'+it.i+'" data-t="'+it.t+'" style="--fn-bg:'+bg+'" onclick="ccFnPeek(event,'+it.i+')">'+
    (isNew ? '<span class="cc-fn-tag">'+esc(T.ccFnNew||'NEW!')+'</span>' : '')+
    '<span class="cc-fn-img"><img src="'+ccFnImg(it.id)+'" alt="" loading="lazy" onerror="this.remove()"></span>'+
    ((CC_FN_SHOP.sty||{})[it.i] ? '<span class="cc-fn-sty" title="'+esc(T.ccFnStylesN ? T.ccFnStylesN(CC_FN_SHOP.sty[it.i]) : '')+'">+</span>' : '')+
    '<b>'+esc(it.name)+'</b><em>'+esc(T['ccFnType_'+it.t]||'')+'</em>'+
    (owned ? '<span class="cc-fn-own">'+esc(T.ccFnOwned)+'</span>'
      : '<button class="cc-fn-buy" '+(canPay ? '' : 'disabled title="'+esc(T.ccFnNoVb)+'"')+' onclick="ccFnBuy('+it.i+')">'+
          ccFnTag(ccFnCost(it), ccPirateOn() ? ccFnPrice(it) : 0)+'</button>')+'</div>';   // подарок скинов снят (его слово 20.10)
}
function ccFnShopHTML(){
  const T=L(), cr=CAREER.career, day=careerToday();
  if(typeof CC_FN_SHOP==='undefined'){
    ccFnShopLoad(()=>{ if(CH_TAB==='items') careerRenderHub('items'); });
    return '<div class="ch-tile"><div class="ch-empty">'+esc(T.ccFnLoading)+'</div></div>';
  }
  const list=ccFnShopDay(day)||[], own=ccFnOwn(), vb=CAREER.vb||0;
  const packs=ccVbPacks(day);
  const just=CC_FN_JUST; CC_FN_JUST=null;
  const vbTile='<div class="ch-tile cc-vb-tile"><h4>'+esc(T.ccVbPacksH)+'</h4>'+
    '<div class="cc-vb-now"><i class="cc-vb-ic"></i><b>'+ccNum(vb)+'</b>'+
      (just ? '<span class="cc-shop-just" role="status">'+esc(just.vb ? '+'+ccNum(just.vb)+' V-Bucks' : T.ccShopBought(just.name))+'</span>'+
        (just.t ? '<button class="cc-fn-tolock" onclick="ccFnLockerOpen(\''+just.t+'\')">'+esc(T.ccFnToLocker)+'</button>' : '') : '')+'</div>'+
    ccFnBalHTML()+'<div class="cc-vb-packs">'+packs.map((p, k)=>'<button class="cc-vb-pack" '+((cr.balance||0)>=p.usd ? '' : 'disabled title="'+esc(ccFnPackT().noBal)+'"')+
      ' onclick="ccVbBuy('+k+')"><b><i class="cc-vb-ic"></i>'+ccNum(p.vb)+'</b><em>$'+p.usd.toFixed(2)+'</em></button>').join('')+'</div>'+
    '<div class="ch-hint">'+esc(T.ccVbNote(regionName(ccCareerRegion())))+'</div>'+ccSacTileHTML()+'</div>';
  const era=ccFnShopEra(day);
  // Как в игре: витрина делится на наборы (скин рядом со своим рюкзаком, киркой, дельтапланом), скин — большая плитка,
  // остальное — маленькие рядом. Наборы — по цене, дорогие выше; предметы без набора — в конце, по типам.
  const TORD={o:0, b:1, p:2, g:3, w:4, e:5};
  const setSort=a=>a.slice().sort((a, b)=>TORD[a.t]-TORD[b.t] || ccFnPrice(b)-ccFnPrice(a));
  // Секундомер у заголовка раздела (Season X и дальше), в Главе 1 время справа в шапке панели.
  const clock='<span class="cc-fn-clock"><i></i>'+esc(T.ccFnTomorrow)+'</span>';
  let secN=0;
  const sec=(h, items, cls, keep, buns)=>'<div class="cc-fn-sec" id="ccFnSec'+(secN++)+'"><h5><span>'+esc(h)+'</span>'+clock+'</h5><div class="cc-fn-grid'+(cls||'')+'">'+
    (buns||[]).map(b=>ccFnBunHTML(b, era)).join('')+
    (keep ? items : setSort(items))
      .map(it=>ccFnCardHTML(it, !!own[it.id], vb>=ccFnCost(it), (cls && cls!==' feat') ? false : it.t==='o', era, day)).join('')+'</div></div>';
  const bySet=new Map(), loose={};
  list.forEach(it=>{ if(it.set){ if(!bySet.has(it.set)) bySet.set(it.set, []); bySet.get(it.set).push(it); } else (loose[it.t]=loose[it.t]||[]).push(it); });
  // Набор из одного предмета — не раздел, а «россыпь» по типу.
  [...bySet].forEach(([k, a])=>{ if(a.length<2){ bySet.delete(k); (loose[a[0].t]=loose[a[0].t]||[]).push(a[0]); } });
  const worth=a=>a.reduce((s, it)=>s+ccFnPrice(it), 0);
  const sets=[...bySet].sort((a, b)=>worth(b[1])-worth(a[1]));
  // Наборы дня (ccFnBundles) — первой плиткой в разделе своего сета; в старых витринах — в «Рекомендуемых».
  const buns=ccFnBundles(list, day); CC_FN_BUN_TODAY=buns;
  const bunOf=k=>buns.filter(b=>b.set===k);
  const looseHTML=cls=>['o','b','p','g','e','w'].filter(t=>loose[t]).map(t=>sec(T['ccFnTypes_'+t]||'', loose[t], cls)).join('');
  let body, top='';
  const old=era.v==='a' || era.v==='b' || era.v==='c';
  if(old){
    // До v14.00: «Рекомендуемые» — наборы со скином эпик+ (большие плитки), «Ежедневные» — остальное ровными квадратами.
    const feat=sets.filter(([, a])=>a.some(it=>it.t==='o' && !/^(common|uncommon|rare)$/.test(it.r)));
    const daily=sets.filter(s=>feat.indexOf(s)<0).flatMap(s=>s[1]).concat(...Object.values(loose));
    // Глава 1 (и Season X) писала «Featured Items» / «Daily Items», Глава 2 — уже «Featured» / «Daily» (скриншоты v10.20 / v11.30).
    const ch1=era.v!=='c';
    body=(feat.length ? sec(ch1 ? T.ccFnFeatItems||T.ccFnFeatured : T.ccFnFeatured, feat.flatMap(s=>setSort(s[1])), ' feat', true, buns) : '')+
      (daily.length ? sec(ch1 ? T.ccFnDailyItems||T.ccFnDaily : T.ccFnDaily, daily, ' daily', false, feat.length ? null : buns) : '');
    // Глава 2: вкладки Featured | Daily над лентой, нажатие листает к разделу.
    if(era.v==='c') top='<div class="cc-fn-tabs">'+(feat.length ? '<button onclick="ccFnTabTo(0)">'+esc(T.ccFnFeatured)+'</button>' : '')+
      (daily.length ? '<button onclick="ccFnTabTo('+(feat.length ? 1 : 0)+')">'+esc(T.ccFnDaily)+'</button>' : '')+'</div>';
    body='<div class="cc-fn-row">'+body+'</div>';
  } else body=sets.map(([k, a])=>sec(k, a, '', false, bunOf(k))).join('')+looseHTML();
  // 2026: баннер дорогого набора сверху — имя, «набор из N», картинки предметов, цена и кнопка к его разделу.
  if(era.hero && sets.length){
    const [hk, ha]=sets[0], heroIt=ha.find(it=>it.t==='o') || ha[0], hn=ha.some(it=>!own[it.id] && ccFnIsNew(it, day));
    top='<div class="cc-fn-hero-offer" style="--fn-bg:'+ccFnSetHue(heroIt)+'"><img class="cc-fn-hero-art" src="'+ccFnImg(heroIt.id)+'" alt="" onerror="this.remove()">'+
      '<div class="cc-fn-hero-l">'+(hn ? '<span class="cc-fn-tag">'+esc(T.ccFnNew||'NEW!')+'</span>' : '')+'<b>'+esc(hk)+'</b>'+
      '<em>'+esc(T.ccFnBundleN ? T.ccFnBundleN(ha.length) : ha.length+' items')+'</em>'+
      '<span class="cc-fn-hero-its">'+ha.slice(0, 6).map(it=>'<img src="'+ccFnImg(it.id, true)+'" alt="" loading="lazy" onerror="this.remove()">').join('')+'</span>'+
      '<span class="cc-fn-hero-buy"><button onclick="ccFnTabTo(0)">'+esc(T.ccFnView||'View')+'</button>'+ccFnTag(worth(ha))+'</span></div></div>';
  }
  // Подвал: записка Главы 1–2 про косметику; с осени 2023 — плашки «Поддержи автора» и «Обновится завтра».
  const sac=CAREER.sac;
  /* «Creator supported: …» — в игре был всегда: в 2019-м справа над витриной, в Главе 3 справа внизу; с осени 2023
     он в плашках подвала (ниже). */
  const sacLine='<div class="cc-fn-sacline">'+esc(T.ccFnSacSup||'Creator supported')+': <b>'+esc(sac ? sac.code : (T.ccFnSacNone||'None'))+'</b></div>';
  if(old) top=sacLine+top;
  const foot=old ? '<p class="cc-fn-note">'+esc(T.ccFnNote||'')+'</p>'
    : (era.v==='d' ? sacLine :'<div class="cc-fn-foot"><span>'+esc(T.ccSacTitle||'Support a Creator')+': '+esc(sac ? sac.code : '—')+'</span><span>'+esc(T.ccFnTomorrow)+'</span></div>');
  const grid='<div class="ch-tile cc-fn-shop cc-fs-'+era.v+(era.noRar ? ' norar' : '')+'"><h4><span class="cc-fn-ttl">'+esc(T.ccFnShopH(ccHdrDate(day)))+'</span>'+
    ' <span class="cc-fn-era">'+esc(T.ccFnEra(era.ch))+'</span></h4>'+(list.length ? ccFnBuyAllHTML() : '')+
    (list.length ? top+body+foot : '<div class="ch-empty">'+esc(T.ccFnEmpty)+'</div>')+'</div>';
  // Паки за деньги дня — своей плиткой под V-Bucks (ccFnPacksToday).
  const pk=ccFnPacksToday(day), PT=ccFnPackT();
  const packTile=pk.length ? '<div class="ch-tile cc-fn-shop cc-fn-packs cc-fs-'+era.v+(era.noRar ? ' norar' : '')+'"><h4>'+esc(PT.h)+'</h4>'+
    ccFnBalHTML()+'<div class="cc-fn-grid">'+pk.map(p=>ccFnPackHTML(p, era)).join('')+'</div><div class="ch-hint">'+esc(PT.note)+'</div></div>' : '';
  return ccPirateHTML()+vbTile+packTile+grid;
}
function ccFnTabTo(n){
  const s=document.getElementById('ccFnSec'+n); if(!s) return;
  const row=s.closest('.cc-fn-row');
  if(row) row.scrollTo({left:s.offsetLeft-row.offsetLeft, behavior:'smooth'}); else s.scrollIntoView({behavior:'smooth', block:'start'});
}
// Образ в шкафчике: шесть слотов, надеть из купленного.
function ccFnLoadoutHTML(){
  if(!CAREER || !CAREER.career) return '';
  const T=L(), own=CAREER.fnOwn||{}, eq=CAREER.fnEq||{};
  const era=ccFnShopEra(careerToday());
  const slot=s=>{ const id=eq[s];
    return '<button class="cc-fn-slot'+(CC_FN_PICK===s ? ' on' : '')+'" onclick="ccFnPick(\''+s+'\')" style="--fn-bg:'+(id && own[id] ? (CC_FN_RAR[own[id].r]||CC_FN_RAR.rare) : '#1d2433')+'">'+
      (id ? '<img src="'+esc((ccFnStyleOf(id)||{}).img||ccFnImg(id, true))+'" alt="" loading="lazy" onerror="this.remove()">' : '<i>+</i>')+
      '<em>'+esc(T['ccFnType_'+s]||'')+'</em></button>'; };
  // Как шкафчик в игре той главы: слева большой образ (надетый скин), справа ячейки по разделам.
  const o=eq.o && own[eq.o] ? eq.o : null;
  const hero='<button class="cc-fn-hero" onclick="ccFnPick(\'o\')" style="--fn-bg:'+(o ? (CC_FN_RAR[own[o].r]||CC_FN_RAR.rare) : '#1d2433')+'">'+
    (o ? '<span class="cc-fn-floor"></span>'+ccFnStyleBadge(o)+'<img class="full" src="'+ccFnFull(o)+'" data-id="'+esc(o)+'" alt="" loading="lazy" onerror="ccFnHeroErr(this)">'+'<b>'+esc(own[o].n||o)+(ccFnStyleOf(o) ? ' · '+esc(ccFnStyleOf(o).name) : '')+'</b>' : '<i>+</i><b>'+esc(T.ccFnType_o)+'</b>')+'</button>';
  const cat=(h, ss)=>'<div class="cc-fn-cat"><h5>'+esc(h)+'</h5><div class="cc-fn-slots">'+ss.map(slot).join('')+'</div></div>';
  if(era.k==='c5') return ccFnLocker5HTML();
  const slots='<div class="cc-fn-lk">'+hero+'<div class="cc-fn-cats">'+cat(T.ccFnCatChar, ['o','b','p','g'])+cat(T.ccFnTypes_e+' · '+T.ccFnTypes_w, ['e','w'])+'</div></div>';
  let pick='';
  if(CC_FN_PICK){
    const mine=Object.keys(own).filter(id=>own[id].t===CC_FN_PICK);
    pick='<div class="cc-fn-pick">'+(mine.length
      ? mine.map(id=>'<button class="cc-fn-pit'+(eq[CC_FN_PICK]===id ? ' on' : '')+'" onclick="ccFnEquip(\''+CC_FN_PICK+'\',\''+esc(id)+'\')" style="--fn-bg:'+(CC_FN_RAR[own[id].r]||CC_FN_RAR.rare)+'">'+
          '<img src="'+ccFnImg(id, true)+'" alt="" loading="lazy" onerror="this.remove()"><b>'+esc(own[id].n||id)+'</b></button>').join('')+
        (eq[CC_FN_PICK] ? '<button class="cc-fn-pit off" onclick="ccFnEquip(\''+CC_FN_PICK+'\',null)"><b>'+esc(T.ccFnTakeOff)+'</b></button>' : '')
      : '<div class="ch-empty">'+esc(T.ccFnNone)+' <a href="#" onclick="ccFnShopOpen();return false;">'+esc(T.ccFnToShop)+'</a></div>')+'</div>'+ccFnStylesHTML(CC_FN_PICK);
  }
  return '<div class="ch-tile cc-fn-load cc-fn-'+era.k+'"><h4><span class="cc-fn-ttl">'+esc(T.ccFnLoadout)+'</span> <span class="cc-fn-era">'+esc(T.ccFnEra(era.ch))+'</span></h4>'+
    slots+pick+'</div>';
}
/* Шкафчик нынешнего Fortnite (Notion «19.10», его скрин): синий фон, слева столбик разделов, посередине
   «My Locker Loadout / CHARACTER» и ячейки, ниже «EMOTES»; справа скин в полный рост, над кнопками — что выбрано
   и где им пользуются; внизу «Save Loadout» и «В магазин». */
const CC_FN_SLOT_ICO={o:'👤', b:'🎒', p:'⛏', g:'🪂', e:'💃', w:'🎨'};
function ccFnLocker5HTML(){
  const T=L(), own=CAREER.fnOwn||{}, eq=CAREER.fnEq||{};
  const tile=s=>{ const id=eq[s], it=id && own[id];
    return '<button class="cc-lk5-slot'+(CC_FN_PICK===s ? ' on' : '')+'" onclick="ccFnPick(\''+s+'\')" title="'+esc(T['ccFnType_'+s]||'')+'"'+
      (it ? ' style="--fn-bg:'+(CC_FN_RAR[it.r]||CC_FN_RAR.rare)+'"' : '')+'>'+
      (it ? '<img src="'+esc((ccFnStyleOf(id)||{}).img||ccFnImg(id, true))+'" alt="" loading="lazy" onerror="this.remove()">' : '<i>'+CC_FN_SLOT_ICO[s]+'</i>')+'</button>'; };
  const sel=(CC_FN_PICK && eq[CC_FN_PICK] && own[eq[CC_FN_PICK]]) ? CC_FN_PICK : 'o';
  const sid=eq[sel] && own[eq[sel]] ? eq[sel] : null, sit=sid ? own[sid] : null;
  const day=careerToday(), modes=['Battle Royale'].concat(day>='2023-12-09' ? ['Fortnite Festival'] : [], day>='2024-06-14' ? ['Reload'] : []);
  const model=sid
    ? (sel==='o' ? ccFnStyleBadge(sid)+'<img class="full" src="'+ccFnFull(sid)+'" data-id="'+esc(sid)+'" alt="" loading="lazy" onerror="ccFnHeroErr(this)">'
                 : ccFnStyleOf(sid) ? '<img class="icon" src="'+esc(ccFnStyleOf(sid).img)+'" alt="" loading="lazy">'
                 : '<img class="icon" src="'+ccFnImg(sid)+'" alt="" loading="lazy" onerror="this.remove()">') : '';
  const info=sit ? '<div class="cc-lk5-info"><em>'+esc(T['ccFnType_'+sel]||'')+' – Fortnite</em><b>'+esc(sit.n||sid)+'</b>'+
      '<span>'+esc(T.ccFnUsable||'This item is usable in:')+'</span><div class="cc-lk5-tags">'+modes.map(m=>'<i>'+esc(m)+'</i>').join('')+'</div></div>' : '';
  let pick='';
  if(CC_FN_PICK){
    const mine=Object.keys(own).filter(id=>own[id].t===CC_FN_PICK);
    pick='<div class="cc-lk5-pick">'+(mine.length
      ? mine.map(id=>'<button class="cc-lk5-slot'+(eq[CC_FN_PICK]===id ? ' on' : '')+'" onclick="ccFnEquip(\''+CC_FN_PICK+'\',\''+esc(id)+'\')" title="'+esc(own[id].n||id)+'" style="--fn-bg:'+(CC_FN_RAR[own[id].r]||CC_FN_RAR.rare)+'">'+
          '<img src="'+ccFnImg(id, true)+'" alt="" loading="lazy" onerror="this.remove()"></button>').join('')+
        (eq[CC_FN_PICK] ? '<button class="cc-lk5-slot off" onclick="ccFnEquip(\''+CC_FN_PICK+'\',null)"><b>'+esc(T.ccFnTakeOff)+'</b></button>' : '')
      : '<div class="ch-empty">'+esc(T.ccFnNone)+'</div>')+'</div>'+ccFnStylesHTML(CC_FN_PICK);
  }
  const rail=[['o','👤'],['e','💃'],['w','🎨']].map(([k, ic])=>'<button class="'+((k==='o' ? ['o','b','p','g'] : [k]).indexOf(CC_FN_PICK||'o')>=0 ? 'on' : '')+'" onclick="ccFnPick(\''+k+'\')">'+ic+'</button>').join('');
  return '<div class="ch-tile cc-fn-load cc-fn-c5 cc-lk5"><nav class="cc-lk5-rail">'+rail+'</nav>'+
    '<div class="cc-lk5-mid"><em class="cc-lk5-sub">'+esc(T.ccLkSub||'My Locker Loadout')+'</em><h3>'+esc(T.ccLkChar||'CHARACTER')+'</h3>'+
      '<div class="cc-lk5-grid">'+['o','b','p','g'].map(tile).join('')+'</div>'+
      '<h3 class="dim">'+esc(T.ccLkEmotes||'EMOTES')+'</h3><div class="cc-lk5-grid">'+['e','w'].map(tile).join('')+'</div>'+pick+'</div>'+
    '<div class="cc-lk5-stage">'+model+info+'</div>'+
    '<div class="cc-lk5-btns"><button onclick="careerSave()">'+esc(T.ccFnSave||'Save Loadout')+'</button>'+
      '<button onclick="ccFnShopOpen()">'+esc(T.ccFnToShop)+'</button></div></div>';
}
/* СТИЛИ СКИНА (его выбор 20.10): у купленного предмета — варианты Epic (fortnite-api /v2/cosmetics/br/<id>, поле variants;
   у ~1500 скинов есть). Грузятся по требованию и кэшируются; выбранный стиль — CAREER.fnStyle[id]=tag. Картинка стиля у Epic —
   портрет 128 px, полного роста нет: в шкафчике предмет показывается стилем, фигура в меню остаётся основной. */
const CC_FN_VAR={};
function ccFnVariants(id){
  if(CC_FN_VAR[id]!==undefined) return CC_FN_VAR[id];
  CC_FN_VAR[id]=null;
  try{ const c=sessionStorage.getItem('fnvar|'+id); if(c){ CC_FN_VAR[id]=JSON.parse(c); return CC_FN_VAR[id]; } }catch(e){}
  fetch('https://fortnite-api.com/v2/cosmetics/br/'+encodeURIComponent(id)).then(r=>r.json()).then(j=>{
    const opts=[]; ((j && j.data && j.data.variants)||[]).forEach(ch=>(ch.options||[]).forEach(o=>{ if(o.image) opts.push({tag:ch.channel+':'+o.tag, name:o.name||o.tag, img:o.image}); }));
    CC_FN_VAR[id]=opts.slice(0, 24);
    try{ sessionStorage.setItem('fnvar|'+id, JSON.stringify(CC_FN_VAR[id])); }catch(e){}
    if(CH_TAB==='locker' || CH_TAB==='items') careerRenderHub(CH_TAB);
  }).catch(()=>{ CC_FN_VAR[id]=[]; });
  return null;
}
// Выбранный стиль: картинка лежит в сейве (fnStyleImg), список вариантов подтягивается сам — после перезагрузки он пуст, и стиль пропадал.
// Стили сняты: у источника нет моделей стилей в полный рост, только портреты 128 px. Выбор, отметка в магазине и карточка выключены.
const CC_FN_STYLES_ON=false;
function ccFnStyleOf(id){
  if(!CC_FN_STYLES_ON) return null;
  const t=CAREER && CAREER.fnStyle && CAREER.fnStyle[id]; if(!t) return null;
  const v=(CC_FN_VAR[id]!==undefined) ? CC_FN_VAR[id] : ccFnVariants(id);
  const o=v && v.find(x=>x.tag===t); if(o) return o;
  const img=CAREER.fnStyleImg && CAREER.fnStyleImg[id];
  return img ? {tag:t, name:'', img:img} : null;
}
function ccFnStyleSet(id, tag){
  if(!ccFnOwn()[id]) return;
  CAREER.fnStyle=CAREER.fnStyle||{};
  CAREER.fnStyleImg=CAREER.fnStyleImg||{};
  const o=tag && (CC_FN_VAR[id]||[]).find(x=>x.tag===tag);
  if(tag){ CAREER.fnStyle[id]=tag; if(o) CAREER.fnStyleImg[id]=o.img; } else { delete CAREER.fnStyle[id]; delete CAREER.fnStyleImg[id]; }
  careerSave(); careerRenderHub(CH_TAB);
}
/* Стиль у скина: у источника (fortnite-api) на стиль есть только портрет 128 px, модели в полный рост нет.
   Модель остаётся в полный рост, а выбранный стиль стоит рядом карточкой с портретом и названием. */
function ccFnStyleBadge(id){
  const s=ccFnStyleOf(id); if(!s) return '';
  return '<span class="cc-fn-stybadge"><img src="'+esc(s.img)+'" alt="" loading="lazy" onerror="this.remove()"><em>'+esc(L().ccFnStyles||'Style')+(s.name ? '<b>'+esc(s.name)+'</b>' : '')+'</em></span>';
}
// Ряд стилей надетого в выбранном слоте; пустой, пока варианты не пришли или их нет.
function ccFnStylesHTML(slot){
  if(!CC_FN_STYLES_ON) return '';
  const T=L(), id=slot && (CAREER.fnEq||{})[slot]; if(!id || !ccFnOwn()[id]) return '';
  const v=ccFnVariants(id); if(!v || v.length<2) return '';
  const cur=(CAREER.fnStyle||{})[id]||v[0].tag;
  return '<div class="cc-fn-styles"><h5>'+esc(T.ccFnStyles||'Styles')+'</h5><div>'+v.map((o, i)=>
    '<button class="cc-fn-style'+(o.tag===cur ? ' on' : '')+'" title="'+esc(o.name)+'" onclick="ccFnStyleSet(\''+esc(id)+'\', '+(i===0 ? 'null' : '\''+esc(o.tag).replace(/'/g, '')+'\'')+')">'+
      '<img src="'+esc(o.img)+'" alt="" loading="lazy" onerror="this.remove()"><em>'+esc(o.name)+'</em></button>').join('')+'</div></div>';
}
let CC_SHOP_SEC='gear', CC_SHOP_JUST=null, CC_DEALS=null;
const CC_SHOP_SLOTS=['mouse','keyboard','headset','monitor','pc','chair','stream'];
// Без прокрутки (Notion 15.10, скрин 3): scrollIntoView к шапке магазина уводил за верх экрана панель карьеры
// над ним — «пропала панелька, когда нажал роскошь». Раздел меняется на месте.
function ccShopSec(k){ CC_SHOP_SEC=k; careerRenderHub('shop'); }
function ccShopEffect(it){
  if(it.unlock==='mobile') return L().ccShopMobFx(it.mob||0);
  if(it.unlock) return L().ccShopConsoleFx+(it.con ? ' · '+L().ccShopConFx(it.con) : '');
  return (it.reach ? L().ccShopReach+' +'+Math.round(it.reach*100)+'%'
        : it.conf ? L().ccShopConf+' +'+it.conf
        : it.cap ? L().ccShopCap+' +'+it.cap
                 : L().ccShopTrain+' +'+Math.round(it.train*100)+'%')+
    (it.skill ? Object.keys(it.skill).map(k=>' · +'+it.skill[k]+' '+(L()[ATTR_LABEL[k]]||k.toUpperCase())).join('') : '')+
    (it.days ? ' · '+L().ccShopMonth : '');
}
/* «Было → станет»: что именно поменяет покупка, по тем же числам, что читает игра. Слот заменяет слот,
   поэтому разница — от лучшего, что уже стоит в нём (как careerGearAdd и careerGearSkill). */
function ccShopDelta(it){
  if(!it) return [];
  const T=L(), out=[], held=key=>it.slot
    ? CC_SHOP.reduce((v,x)=>(x.slot===it.slot && careerOwns(x.id) && (x[key]||0)>v) ? (x[key]||0) : v, 0) : 0;
  if(it.train){ const g=it.train-held('train'); if(g>0){ const cur=Math.round((careerDayGear()-1)*100);
    out.push(T.ccShopTrain+' +'+cur+'% → +'+(cur+Math.round(g*100))+'%'); } }
  if(it.skill){
    let a=null; try{ a=attrsFor(careerCard()); }catch(e){}
    const cs={}; CC_SHOP.forEach(x=>{ if(x.slot===it.slot && x.skill && careerOwns(x.id) && (!cs._r || x.rank>cs._r)){ cs._r=x.rank; cs.s=x.skill; } });
    Object.keys(it.skill).forEach(k=>{ const g=it.skill[k]-((cs.s||{})[k]||0); if(g<=0) return;
      const lab=T[ATTR_LABEL[k]]||k.toUpperCase();
      // Статы дробные (рейтинг сезона) — в строке целыми, как на карточке (Notion «19.10»: «почему пишется миллионные»).
      if(a && a[k]!=null){ const to=clamp(a[k]+g, 35, 99); if(to>a[k]) out.push(lab+' '+Math.round(a[k])+' → '+Math.round(to)); } else out.push(lab+' +'+g); });
  }
  if(it.cap){ const g=it.cap-held('cap'); if(g>0){ const cur=careerEnergyMax(); out.push(T.ccShopCap+' '+cur+' → '+(cur+g)); } }
  if(it.reach){ const cur=Math.round(held('reach')*100); out.push(T.ccShopReach+' +'+cur+'% → +'+Math.round(it.reach*100)+'%'); }
  if(it.conf){ const cur=(CAREER.gear && CAREER.gear.conf) || 0; out.push(T.ccShopConf+' +'+cur+' → +'+it.conf); }
  return out;
}
function ccShopDeltaHTML(it){ const d=ccShopDelta(it); return d.length ? d.map(x=>'<span>'+esc(x)+'</span>').join('') : esc(ccShopEffect(it)); }
// Отклик на покупку: строка в шапке и подсветка карточки, пока не прошло 8 секунд или не сменился раздел.
function ccShopJust(key, name, delta){ CC_SHOP_JUST={key:key, name:name, delta:(delta||[]).join(' · '), t:Date.now()}; }
function ccShopJustOn(key){ return !!(CC_SHOP_JUST && Date.now()-CC_SHOP_JUST.t<8000 && (key==null || CC_SHOP_JUST.key===key)); }
function ccShopImg(it, cls){
  return it && it.img ? '<img class="'+cls+(it.wide?' wide':'')+'" src="'+CC_DEVICE_DIR+it.img+'" alt="" loading="lazy" onerror="this.remove()">' : '';
}
// Следующая ступень слота (или null, если лучшая уже стоит) и лучшая из купленных.
function ccShopLadder(slot){
  const rungs=CC_SHOP.filter(x=>x.slot===slot).sort((a,b)=>a.rank-b.rank);
  const have=ccShopSlotRank(slot);
  return {rungs:rungs, have:have, cur:rungs.find(x=>x.rank===have)||null, next:rungs.find(x=>x.rank>have)||null};
}
function ccShopGiftBtn(it, can){
  if(!(ccMpOn() && it && !it.days)) return '';
  return ccPeerOwns(it.id) ? '<span class="cc-owned cc-gift-has">'+L().ccGiftHas+'</span>'
    : '<button class="ch-sign cc-gift"'+(can?'':' disabled')+' onclick="careerGift(\''+it.id+'\')">🎁 '+L().ccGiftBtn+'</button>';
}
function ccShopLadderHTML(slot, fresh){
  const T=L(), cr=CAREER.career, l=ccShopLadder(slot);
  if(!l.rungs.length) return '';
  const it=l.next || l.cur, can=!!l.next && (cr.balance||0)>=l.next.cost;
  const pips=l.rungs.map(x=>'<i class="'+(x.rank<=l.have?'on':'')+'"></i>').join('');
  const isNew=l.next && fresh.has(l.next.id);
  return '<div class="cc-lad'+(l.next?'':' max')+(isNew?' fresh':'')+(ccShopJustOn('slot:'+slot)?' just':'')+'">'+
    ccShopImg(it, 'cc-lad-img')+
    '<div class="cc-lad-in">'+
      '<div class="cc-lad-top"><b>'+esc(T['ccSlot_'+slot]||slot)+'</b><span class="cc-pips">'+pips+'</span></div>'+
      (l.cur ? '<div class="cc-lad-now">'+T.ccShopNow+': '+esc(T['ccShop'+l.cur.id]||l.cur.id)+'</div>' : '')+
      (l.next
        ? '<div class="cc-lad-next">'+esc(T['ccShop'+l.next.id]||l.next.id)+'</div>'+
          '<div class="cc-lad-fx">'+ccShopDeltaHTML(l.next)+'</div>'
        : '<div class="cc-lad-fx">'+esc(ccShopEffect(l.cur))+'</div>')+
      // Купленная консоль или телефон: галочка «Турниры в календаре» на всю платформу.
      (l.cur && l.cur.unlock ? '<div class="cc-lad-plat">'+ccPlatCalBtn(ccPlatGroup(l.cur.unlock==='mobile' ? 'mobile' : 'any'))+'</div>' : '')+
    '</div>'+
    '<div class="cc-lad-buy">'+(l.next
      ? '<button class="ch-sign"'+(can?'':' disabled')+' onclick="careerBuy(\''+l.next.id+'\')">$'+ccNum(l.next.cost)+'</button>'+ccShopGiftBtn(l.next, can)
      : '<span class="cc-owned">'+T.ccShopMaxed+'</span>')+'</div>'+
  '</div>';
}
// Вещь без лесенки (стол, буткемп, зал) — одной строкой, без обрезки.
function ccShopRowHTML(it, fresh){
  const cr=CAREER.career, stay=it.days ? ccStayOf(it.id) : null, own=careerOwns(it.id) || !!stay;
  const can=!own && (cr.balance||0)>=it.cost;
  return '<div class="cc-buy cc-buy2'+(own?' own':'')+(ccShopJustOn('item:'+it.id)?' just':'')+'">'+ccShopImg(it, 'cc-buy-img'+(it.wide?' cc-buy-img-wide':''))+
    '<div class="cc-buy-in"><b>'+esc(L()['ccShop'+it.id]||it.id)+'</b>'+
    '<span class="cc-delta">'+(own ? esc(ccShopEffect(it)) : ccShopDeltaHTML(it))+'</span></div>'+
    (stay ? '<span class="cc-owned">'+L().ccShopUntil(ccDayLabel(stay.until))+'</span>'
     : own ? (it.unlock ? ccPlatCalBtn(ccPlatGroup(it.unlock==='mobile' ? 'mobile' : 'any')) : '<span class="cc-owned">'+L().ccShopOwned+'</span>')
     : '<button class="ch-sign"'+(can?'':' disabled')+' onclick="careerBuy(\''+it.id+'\')">$'+ccNum(it.cost)+'</button>')+
    ccShopGiftBtn(own?null:it, can)+'</div>';
}
// Галочка «Турниры в календаре» у купленной консоли или телефона (группа: console / mobile).
function ccPlatCalBtn(g){
  const on=ccPlatCalOn(g), T=L();
  return '<button type="button" class="cc-platcal'+(on ? ' on' : '')+'" role="switch" aria-checked="'+on+'" onclick="ccPlatCalToggle(\''+g+'\')">'+
    '<i aria-hidden="true">'+(on ? '✓' : '')+'</i>'+esc(T.ccPlatCal)+'</button>';
}
/* Лучшая покупка сейчас: самая дешёвая по карману ступень, которая качает тренировку или навык; нет таких — самая
   дешёвая вообще; ничего не по карману — ближайшая с тем, сколько не хватает. */
function ccShopBest(){
  const bal=CAREER.career.balance||0;
  const cand=CC_SHOP_SLOTS.map(s=>ccShopLadder(s).next).filter(Boolean)
    .concat(CC_SHOP.filter(x=>!x.slot && !x.unlock && !careerOwns(x.id) && !(x.days && ccStayOf(x.id))));
  if(!cand.length) return null;
  const by=a=>a.slice().sort((x,y)=>x.cost-y.cost)[0];
  const ok=cand.filter(x=>x.cost<=bal);
  const trains=ok.filter(x=>x.train || x.skill);
  return trains.length ? {it:by(trains), can:true} : ok.length ? {it:by(ok), can:true} : {it:by(cand), can:false};
}
function ccShopBestHTML(){
  const T=L(), b=ccShopBest(); if(!b) return '';
  const it=b.it, short=it.cost-(CAREER.career.balance||0);
  return '<div class="ch-tile cc-shop cc-best"><h4>'+T.ccShopBest+'</h4>'+
    '<div class="cc-lad'+(ccShopJustOn('item:'+it.id)?' just':'')+'">'+ccShopImg(it, 'cc-lad-img')+
      '<div class="cc-lad-in"><div class="cc-lad-next">'+esc(T['ccShop'+it.id]||it.id)+'</div>'+
      '<div class="cc-lad-fx">'+ccShopDeltaHTML(it)+'</div>'+
      (b.can ? '' : '<div class="cc-lad-now">'+T.ccShopShort('$'+ccNum(short))+'</div>')+'</div>'+
      '<div class="cc-lad-buy"><button class="ch-sign"'+(b.can?'':' disabled')+' onclick="careerBuy(\''+it.id+'\')">$'+ccNum(it.cost)+'</button></div>'+
    '</div></div>';
}
/* ВИТРИНА ДНЯ — как Item Shop в Fortnite: три вещи со скидкой 10/20/30%, набор от дня и ника, завтра другой.
   В неё идут следующие ступени устройств и машины, комнаты и роскошь — то, что вообще можно купить. */
const CC_DEAL_CUTS=[0.1, 0.2, 0.3];
function ccDealsToday(){
  const cr=CAREER.career, day=careerToday();
  if(CC_DEALS && CC_DEALS.day===day && CC_DEALS.cr===cr) return CC_DEALS.list;
  const cand=[];
  CC_SHOP_SLOTS.concat(['car']).forEach(s=>{ const n=ccShopLadder(s).next; if(n) cand.push({kind:'gear', it:n}); });
  CC_SHOP.filter(x=>!x.slot && !careerOwns(x.id) && !(x.days && ccStayOf(x.id))).forEach(x=>cand.push({kind:'gear', it:x}));
  CC_LUX.filter(x=>!ccLuxOwns(x.id)).forEach(x=>cand.push({kind:'lux', it:x}));
  const rnd=careerRng(ccHashStr('deals|'+(CAREER.player.nick||'')+'|'+day));
  for(let i=cand.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); const t=cand[i]; cand[i]=cand[j]; cand[j]=t; }
  const cuts=CC_DEAL_CUTS.slice().sort(()=>rnd()-0.5);
  const list=cand.slice(0, 3).map((c,i)=>Object.assign({}, c, {cut:cuts[i], price:Math.max(10, Math.round(c.it.cost*(1-cuts[i])/10)*10)}));
  CC_DEALS={day:day, cr:cr, list:list};
  return list;
}
// Цена витрины — только у вещи, которая сегодня на витрине; иначе null и платится обычная.
function ccDealPrice(id){ const d=ccDealsToday().find(x=>x.it.id===id); return d ? d.price : null; }
function ccDealBuy(i){
  const d=ccDealsToday()[i]; if(!d) return false;
  return d.kind==='lux' ? careerLuxBuy(d.it.id, false, d.price) : careerBuy(d.it.id, d.price);
}
function ccDealsHTML(){
  const T=L(), bal=CAREER.career.balance||0;
  const cards=ccDealsToday().map((d,i)=>{
    const own=d.kind==='lux' ? ccLuxOwns(d.it.id) : (careerOwns(d.it.id) || !!(d.it.days && ccStayOf(d.it.id)) || (d.it.slot && ccShopSlotRank(d.it.slot)>=d.it.rank));
    const name=d.kind==='lux' ? T['ccLux_'+d.it.id] : (T['ccShop'+d.it.id]||d.it.id);
    return '<div class="cc-deal'+(own?' own':'')+'">'+
      '<em class="cc-deal-cut">−'+Math.round(d.cut*100)+'%</em>'+
      (d.it.img ? '<img src="'+CC_DEVICE_DIR+d.it.img+'" alt="" loading="lazy" onerror="this.remove()">' : '<span class="cc-deal-ico">'+(d.it.ico||'')+'</span>')+
      '<b>'+esc(name)+'</b>'+
      '<s>$'+ccNum(d.it.cost)+'</s>'+
      (own ? '<span class="cc-owned">'+T.ccShopOwned+'</span>'
           : '<button class="ch-sign"'+(bal>=d.price?'':' disabled')+' onclick="ccDealBuy('+i+')">$'+ccNum(d.price)+'</button>')+
    '</div>';
  }).join('');
  if(!cards) return '';
  // В шапке магазина, справа от баланса (Notion 15.10, скрин 4: «пусть витрина дня будет там, где красное»).
  return '<div class="cc-shop-head-r"><div class="cc-deals-h"><b>'+T.ccDealsTitle+'</b><span>'+T.ccDealsHint+'</span></div>'+
    '<div class="cc-deals">'+cards+'</div></div>';
}
// Сколько в разделе можно купить прямо сейчас — цифра на чипе.
/* Каталог девайсов окном поверх магазина (его слово 23.11: «кликаешь в магазине - поверх окно с девайсами на выбор, и
   выбор большой»). В «Сетапе» - карточка на каждое место шкафчика (что стоит сейчас), клик открывает окно со всеми
   моделями этого места: фильтр по цене, покупка в любом порядке, купленное сразу надевается (ccDevPick). */
let CC_DEV_TIER='all', CC_DEV_MODAL=null;
const CC_DEV_SHOP_KEYS=['mouse', 'keyboard', 'mpad', 'headset', 'monitor', 'ctl', 'con', 'mob', 'mctl', 'mcool'];
function ccDevSlotsOf(key){ return key==='con' ? ['ps', 'xbox'] : key==='mob' ? ['android', 'ios'] : [key]; }
function ccDevTierSet(t){ CC_DEV_TIER=t; ccDevModalSync(); }
function ccDevCardHTML(x){
  const T=L(), bal=(CAREER.career.balance||0);
  const own=careerOwns(x.id), key=ccDevKey(x), eff=ccDevEff(key), inUse=!!(eff && eff.id===x.id);
  const btn=!own ? '<button class="ch-sign"'+(bal>=x.cost ? '' : ' disabled')+' onclick="careerBuy(\''+x.id+'\')">$'+ccNum(x.cost)+'</button>'
    : inUse ? '<span class="cc-owned">'+T.ccDevInUse+'</span>'
    : '<button class="cc-chip" onclick="ccDevPick(\''+key+'\', \''+x.id+'\', \'shop\')">'+(key==='con' || key==='mob' ? T.ccDevUseBtn : T.ccDevEquip)+'</button>';
  return '<div class="cc-dev-card'+(own ? ' own' : '')+(inUse ? ' on' : '')+(ccShopJustOn('item:'+x.id) || ccShopJustOn('slot:'+x.slot) ? ' just' : '')+'">'+ccShopImg(x, 'cc-dev-card-img')+
    '<b>'+esc(T['ccShop'+x.id]||x.id)+'</b><em>'+esc(T['ccDevTier_'+(x.tier||'m')]+(ccDevFx(x, T) ? ' · '+ccDevFx(x, T) : ''))+'</em>'+btn+'</div>';
}
function ccDevModalHTML(key){
  const T=L();
  const tiers='<div class="cc-dev-tiers">'+['all','b','m','f'].map(t=>'<button class="cc-chip'+(CC_DEV_TIER===t ? ' on' : '')+'" onclick="ccDevTierSet(\''+t+'\')">'+esc(T['ccDevTier_'+t])+'</button>').join('')+'</div>';
  const slots=ccDevSlotsOf(key);
  const grids=slots.map(s=>{
    const list=CC_SHOP.filter(x=>x.slot===s && ccDevCatItem(x) && (CC_DEV_TIER==='all' || x.tier===CC_DEV_TIER || (x.starter && CC_DEV_TIER==='b'))).sort((a,b)=>a.cost-b.cost);
    if(!list.length) return '';
    return (slots.length>1 ? '<h5 class="cc-dev-plat">'+esc(T['ccSlot_'+s]||s)+'</h5>' : '')+'<div class="cc-dev-cat">'+list.map(ccDevCardHTML).join('')+'</div>';
  }).join('');
  const extra=key==='con' ? '<div class="cc-lad-plat">'+ccPlatCalBtn('console')+'</div>'
    : key==='mob' ? ccMobRateLineHTML()+'<div class="cc-lad-plat">'+ccPlatCalBtn('mobile')+'</div>' : '';
  return '<div class="cc-devm-head"><h4>'+esc(T['ccDevSlot_'+key]||key)+'</h4><span class="cc-devm-bal">$'+ccNum(CAREER.career.balance||0)+'</span>'+
    '<button class="cc-devm-x" aria-label="'+esc(T.ccClose||'Close')+'" onclick="ccDevModalClose()">×</button></div>'+
    (key==='con' || key==='mob' ? '<div class="ch-hint">'+esc(T.ccShopDevHint)+'</div>' : '')+tiers+grids+extra;
}
function ccDevModalOpen(key){
  CC_DEV_MODAL=key;
  let m=document.getElementById('ccDevModal');
  if(!m){ m=document.createElement('div'); m.id='ccDevModal'; m.className='cc-devm';
    m.onclick=e=>{ if(e.target===m) ccDevModalClose(); };
    m.innerHTML='<div class="cc-devm-in ch-tile" role="dialog" aria-modal="true"></div>'; (document.getElementById('screen-career-hub')||document.body).appendChild(m); }
  m.style.display='flex'; ccDevModalSync();
}
function ccDevModalSync(){
  const m=document.getElementById('ccDevModal'); if(!m || !CC_DEV_MODAL || m.style.display==='none') return;
  const box=m.querySelector('.cc-devm-in'), y=box.scrollTop; box.innerHTML=ccDevModalHTML(CC_DEV_MODAL); box.scrollTop=y;
}
function ccDevModalClose(){ CC_DEV_MODAL=null; const m=document.getElementById('ccDevModal'); if(m) m.style.display='none'; }
// Карточки мест в «Сетапе»: что стоит сейчас и сколько моделей на выбор.
function ccShopDevSlotsHTML(){
  const T=L();
  return '<div class="ch-tile cc-shop"><h4>'+T.ccDevTitle+'</h4><div class="ch-hint">'+esc(T.ccDevShopHint)+'</div><div class="cc-devslots">'+
    CC_DEV_SHOP_KEYS.map(k=>{
      const eff=ccDevEff(k), n=CC_SHOP.filter(x=>ccDevKey(x)===k && ccDevCatItem(x)).length;
      const img=eff && eff.img ? '<img class="cc-devslot-img" src="'+CC_DEVICE_DIR+eff.img+'" alt="" loading="lazy" onerror="this.remove()">' : '<span class="cc-devslot-img cc-dev-auto">'+ccInputIcon(k==='ctl' || k==='con' ? 'pad' : k==='mob' || k==='mctl' || k==='mcool' ? 'mob' : 'kbm')+'</span>';
      return '<button class="cc-devslot" onclick="ccDevModalOpen(\''+k+'\')">'+img+'<b>'+esc(T['ccDevSlot_'+k]||k)+'</b><em>'+esc(eff ? (T['ccShop'+eff.id]||eff.id) : T.ccDevStd)+'</em><span class="cc-devslot-n">'+esc(T.ccDevModels(n))+'</span></button>';
    }).join('')+'</div></div>';
}
function ccShopAffordable(sec){
  const cr=CAREER.career, bal=cr.balance||0;
  const slotN=slots=>slots.filter(s=>{ const n=ccShopLadder(s).next; return n && bal>=n.cost; }).length;
  if(sec==='gear') return slotN(CC_SHOP_SLOTS)+CC_SHOP.filter(x=>!x.slot && !careerOwns(x.id) && !(x.days && ccStayOf(x.id)) && bal>=x.cost).length;
  if(sec==='home'){ const f=ccFlat(), have=f && f.place===ccFlatPlace() ? (ccFlatOf(f.id)||{}).mult||0 : 0;
    return CC_FLATS.filter(x=>x.mult>have && bal>=ccFlatPrice(x, ccFlatPlace())).length; }
  if(sec==='fame') return (ccCharityReady() && bal>=CC_CHARITY_FUNDS[0] ? 1 : 0)+
    CC_MERCH.filter(m=>{ const n=ccMerchNow(); return (!n || m.cost>n.cost) && bal>=m.cost; }).length;
  if(sec==='lux') return slotN(['car'])+CC_LUX.filter(x=>!ccLuxOwns(x.id) && bal>=x.cost).length;
  return 0;
}
function careerShopHTML(){
  const T=L(), cr=CAREER.career;
  const fresh=new Set(careerShopNew().map(it=>it.id));
  const secs=[['gear', T.ccSecGear], ['home', T.ccSecHome], ['fame', T.ccSecFame], ['lux', T.ccSecLux], ['club', T.ccSecClub]];
  if(!secs.some(s=>s[0]===CC_SHOP_SEC)) CC_SHOP_SEC='gear';
  const conf=(CAREER.gear && CAREER.gear.conf) || 0;
  const head='<div class="ch-tile cc-shop-head"><div class="cc-shop-head-l">'+
    '<div class="cc-shop-bal"><em>'+T.ccBalance+'</em><b>$'+ccNum(cr.balance||0)+'</b></div>'+
    (ccShopJustOn() ? '<div class="cc-shop-just" role="status">'+T.ccShopBought(esc(CC_SHOP_JUST.name))+(CC_SHOP_JUST.delta ? ' · '+esc(CC_SHOP_JUST.delta) : '')+'</div>' : '')+
    '<div class="cc-shop-stats">'+
      '<span><em>'+T.chEarnings+'</em><b>$'+ccNum(cr.earnings||0)+'</b></span>'+
      // То, на что умножается сегодняшняя тренировка, буткемп включая.
      '<span><em>'+T.ccShopTrain+'</em><b>+'+Math.round((careerDayGear()-1)*100)+'%</b></span>'+
      '<span><em>'+T.ccShopCap+'</em><b>'+careerEnergyMax()+'</b></span>'+
      (conf ? '<span><em>'+T.ccShopConf+'</em><b>+'+conf+'</b></span>' : '')+
    '</div>'+
    '<div class="cc-shop-secs">'+secs.map(([k,t])=>{ const n=ccShopAffordable(k);
      return '<button class="cc-sec'+(CC_SHOP_SEC===k?' on':'')+'" onclick="ccShopSec(\''+k+'\')">'+esc(t)+
        (n ? '<i>'+n+'</i>' : '')+'</button>'; }).join('')+'</div>'+
    '<div class="cc-shop-why">'+T['ccSecHint_'+CC_SHOP_SEC]+'</div>'+
  '</div>'+ccDealsHTML()+'</div>';
  let body='';
  if(CC_SHOP_SEC==='gear'){
    const rooms=CC_SHOP.filter(x=>!x.slot && !x.unlock);
    body=ccShopBestHTML()+ccShopDevSlotsHTML()+
      '<div class="ch-tile cc-shop"><h4>'+T.ccSecGear+'</h4><div class="cc-lads">'+
      CC_SHOP_SLOTS.filter(s=>CC_DEV_CAT_SLOTS.indexOf(s)<0).map(s=>ccShopLadderHTML(s, fresh)).join('')+'</div></div>'+
      '<div class="ch-tile cc-shop"><h4>'+T.ccShopRooms+'</h4><div class="cc-buys">'+rooms.map(it=>ccShopRowHTML(it, fresh)).join('')+'</div></div>'+
      careerCheatHTML();
  } else if(CC_SHOP_SEC==='home') body=careerFlatHTML()+careerMoveHTML();
  else if(CC_SHOP_SEC==='fame') body=careerOwnCupHTML()+careerMerchHTML()+careerCharityHTML();
  else if(CC_SHOP_SEC==='lux') body='<div class="ch-tile cc-shop"><h4>'+T.ccSlot_car+'</h4><div class="cc-lads">'+ccShopLadderHTML('car', fresh)+'</div>'+
      (conf ? '<div class="ch-hint" style="margin-top:8px;">'+T.ccConfFloor(Math.round((CC_FORM_MAX-conf)*10)/10)+'</div>' : '')+'</div>'+careerLuxHTML();
  else body=careerClubHTML();
  return '<div class="ch-grid cc-shop-grid" style="grid-template-columns:minmax(0,1fr);">'+head+body+'</div>';
}

/* ---- Being asked about it ---------------------------------------------------
   After a notable night someone asks for a quote, three answers:
   the duo (credit, partner stays longer), the boast (most reach, confidence),
   the blame (also travels, partner reads it). Moves only reach, form and partner
   patience, sized against existing costs: promotion = 12 reach, award 8, quote 2-4;
   a result moves form 0.5, a quote 0.25. The night is read off history, not stored,
   and the question is gone when the next result lands. */
/* Which nights get asked about.

   Not all of them. Somebody asking after every Victory Cup and every
   Performance Evaluation is not press, it is a pop-up — and the answer stops
   costing anything the moment it is asked weekly.

   The nights that settle something: the divisional cup, which is the ladder
   itself; the Weekly Final; every stage of a Major, because a Play-In and a
   Heat both decide whether there is a Major to play; and the three LANs.

   Left out on purpose: the Performance Evaluation and the Victory Cup are open
   nights, the Reload circuit is a different competition, and the Global
   Championship Last Chance is a qualifier — Epic's own multiplier table already
   rates that one as a qualifier rather than as a final. */
const CC_IV_KINDS=['cup','final','major','summit','globals','rc'];
const CC_IV=[
  {id:'win',    when:r=>r.place===1},
  {id:'podium', when:r=>r.place<=3},
  {id:'pass',   when:r=>!!r.passed},
  {id:'miss',   when:r=>r.of>10 && r.place>r.of*0.6}
];
/* Three lines is a script, not an interview.

   The first pass asked one question per kind of night and offered the same
   three answers to all of them, so the second time a career won something it
   was reading a repeat. Two things fix that without inventing a system:

   Each kind of night carries several ways of being asked, picked by the day it
   happened on — so the same career gets a different question next time, and the
   same save asks the same question twice rather than rerolling on every render.

   And the answers are written per kind. "That one is on the duo" is a thing to
   say after a win and a strange thing to say after finishing 140th; the shapes
   are the same three — credit, boast, blame — because those are what move the
   three numbers, but the words belong to the night. */
const CC_IV_VARIANTS=4;
/* answer: [reach x of a division, form, partner patience, reputation]

   Reputation is the fourth column and the slowest one. Every other thing an
   answer moves is spent inside a week - reach fades, form fades, a partner's
   patience is repaired by the next good night - so the loud answer was free and
   the generous one bought nothing that lasted. What a scene actually remembers
   about somebody is whether they are easy to play with, and it remembers it for
   years.

   Blame is worth three of what credit is worth, in the wrong direction, because
   that is how it works: one public "I carried" outlives four "we played well".
   The boast is neutral - being loud is not being difficult. */
const CC_IV_ANSWERS=[
  {id:'duo',   reach:2, form:0.25, mate:4,  rep:1},
  {id:'boast', reach:4, form:0.5,  mate:0,  rep:0},
  {id:'blame', reach:3, form:0,    mate:-8, rep:-3}
];
// Which wording this night gets. Seeded on the night itself, so it is stable
// across a redraw and different across two wins.
function ccIvVariant(row){
  return (ccHashStr(ccIvKey(row)+'|'+(row.place||0)) % CC_IV_VARIANTS)+1;
}
function ccIvKey(r){ return r.day+'|'+r.kind+'|'+(r.stage||''); }
function careerInterview(){
  const cr=CAREER.career;
  const row=(cr.log||[]).slice(-1)[0];
  if(!row || !(row.of>1)) return null;
  if(CC_IV_KINDS.indexOf(row.kind)<0) return null;
  if(cr.ivDone===ccIvKey(row)) return null;
  const q=CC_IV.find(x=>x.when(row));
  return q ? {key:ccIvKey(row), id:q.id, v:ccIvVariant(row), row:row} : null;
}
/* Who is in the seats beside you, named the way a sentence names them.

   The interview handed every line one name — careerPartnerCard, the first mate
   — and every answer was written about two people: "that one is on the duo",
   "we both worked for that", "I carried, he was a passenger". In a trio season
   the player was answering as if they had played a duo. His report, 20 August.

   `at` is for the posts, which write the answer into the feed as the player's
   own words and mention whoever it is about. A list cannot be handed to a line
   that puts the @ on itself, so the trio wordings take the names already
   written out and the duo ones are left exactly as they were. */
/* Everybody who is already in this career's squad, as the keys a pool filters on.

   Half a dozen places asked careerPartnerCard — the first seat — and meant "the
   people I play with". In a duo those are the same thing and in a trio they are
   not, so the second chair went on living its own life in the scene: it turned
   up in the season table playing the same Weekly Final beside somebody else, it
   announced a new duo at the season break, and it stood in the list of people
   you can write to asking for a duo. His report, 20 August.

   The player is in it too, under both names: the nickname the hub prints and,
   for a career played as somebody real, the handle the roster knows them by. */
function ccMyPeople(){
  const out=new Set();
  const me=careerCard(); if(me) out.add(hKey(me));
  const pl=CAREER && CAREER.player;
  if(pl && pl.handle) out.add(hKey({handle:pl.handle}));
  if(pl && pl.nick) out.add(hKey({handle:pl.nick}));
  careerMates().forEach(m=>{ if(m) out.add(hKey(m)); });
  // Гонка: напарники соперника — тоже «свои люди» для списков, их не предлагать.
  if(typeof ccRaceOn==='function' && ccRaceOn()) ccRaceTakenKeys().forEach(k=>out.add(k));
  return out;
}
/* Duo/trio wording by key: if a line has a trio version (same key with a `t` suffix) it is used in a trio season,
   otherwise the duo line stays (most are about a person, not a pair). careerDmPush and careerNews store
   the resolved key, so a message keeps the wording of the season it was written in. */
// size — формат, под который пишут (переписка помнит его в t.fmt: сквад на кап дуо-года, Notion «19.10»: «squads
// нужно собрать, но пишет 2 человека вместо 4»); без него — размер года. Сквад — свои реплики (хвост q), где они есть.
function ccSquadKey(key, size){
  const n=size || careerSquadSize();
  if(n<=2) return key;
  if(n>=4 && L()[key+'q']) return key+'q';
  if(L()[key+'t']) return key+'t';
  /* A voice variant falls back to the trio line the whole scene shares.

     Four people say "I have no partner" four different ways — dmNoPartner1 to 4,
     see ccVoiceOf — and writing a trio version of each of them would be sixteen
     lines to say one thing. Where a variant has no trio wording of its own the
     plain trio line is used, which is a voice lost and a season kept. */
  const base=String(key).replace(/[1-4]$/, '');
  return (base!==key && L()[base+'t']) ? base+'t' : key;
}
// The same, resolved for a screen rather than for a stored line.
function ccSay(key){
  const f=L()[ccSquadKey(key)];
  return typeof f==='function' ? f.apply(null, [].slice.call(arguments, 1)) : (f||'');
}
/* The squad written as one argument for the lines that put the @ on themselves.

   ccPostWon and its podium sibling take a handle and write " @" in front of it,
   in three languages and seven wordings. Joining the seats with " @" hands them
   the whole squad without any of those lines having to know how many chairs the
   season has. */
function ccMateTagArg(){
  return careerMates().filter(Boolean).map(c=>ccHandle(c.handle)).join(' @');
}
function ccMateNames(at){
  const names=careerMates().filter(Boolean).map(c=>(at?'@':'')+c.handle);
  if(names.length<2) return names[0]||'';
  return names.slice(0, -1).join(', ')+L().ccListAnd+names[names.length-1];
}
// One line out of the set written for this kind of night. Falls back to the
// first, so a variant that is not written yet reads as the one that is rather
// than as nothing at all — and in a trio season a trio wording, marked with a
// t, is tried before the duo one it replaces.
function ccIvLine(prefix, id, v, args){
  const l=L();
  const trio=careerSquadSize()>2;
  const f=(trio && (l[prefix+id+'t'+v] || l[prefix+id+'t1'])) ||
          l[prefix+id+v] || l[prefix+id+'1'] || l[prefix+id];
  return typeof f==='function' ? f.apply(null, args||[]) : (f||'');
}
/* The post an answer becomes, in the season's own voice.

   Same rule as the buttons and one thing more: the trio wording is only used
   when it exists, because the arguments differ. A duo line writes "@" itself
   and is handed a handle; a trio line is handed "@Sky and @Scroll" already
   written out, and handing that to a duo line would print "@@Sky and @Scroll". */
function ccIvSaidKey(aid, v){
  const trio=careerSquadSize()>2;
  return (trio && L()['ccIvSaid'+aid+'t'+v]) ? 'ccIvSaid'+aid+'t'+v : 'ccIvSaid'+aid+v;
}
function careerInterviewSay(which){
  const iv=careerInterview(); if(!iv) return;
  const a=CC_IV_ANSWERS.find(x=>x.id===which); if(!a) return;
  const cr=CAREER.career;
  cr.ivDone=iv.key;
  const got=careerReachAdd(CC_REACH_DIV(cr.division)*a.reach);
  if(a.form) cr.form=clamp((cr.form||0)+a.form, -CC_FORM_MAX, CC_FORM_MAX);
  if(a.mate) careerMateRecords().forEach(pr=>{
    pr.patience=clamp((pr.patience||CAREER_PATIENCE_START)+a.mate, 0, 100); });
  if(a.rep) careerRepAdd(a.rep);
  // The answer is a post, in the player's own voice, because that is whose it
  // is — and the post is the wording that was on the button, not a fourth line
  // that says something else.
  const said=ccIvSaidKey(a.id, iv.v);
  // A trio wording is handed the whole squad, written out; a duo one the one
  // handle it has always been handed. See ccIvSaidKey.
  const who = /t\d$/.test(said) ? ccMateNames(true)
            : (careerPartnerCard() ? careerPartnerCard().handle : '');
  careerNews(a.id==='blame' ? 'bad' : 'good', said, [who, iv.row.place]);
  careerSave();
  careerRenderHub('centre');
  return got;
}
function careerInterviewPass(){
  const iv=careerInterview(); if(!iv) return;
  CAREER.career.ivDone=iv.key;
  careerSave();
  careerRenderHub('centre');
}
function careerInterviewHTML(){
  const iv=careerInterview(); if(!iv) return '';
  const mate=careerPartnerCard();
  // Everybody in the squad, because that is who an answer is about in a trio
  // season. In a duo it is the one name it always was. See ccMateNames.
  const who=careerSquadSize()>2 ? ccMateNames(false) : (mate ? mate.handle : '');
  return '<div class="ch-tile cc-iv"><h4>'+L().ccIvTitle+'</h4>'+
    '<div class="ch-hint">'+esc(ccIvLine('ccIvQ', iv.id, iv.v, [iv.row.place, iv.row.of]))+'</div>'+
    '<div class="cc-iv-acts">'+
      CC_IV_ANSWERS.filter(a=>a.id!=='blame' || mate).map(a=>
        '<button class="cc-act" onclick="careerInterviewSay(\''+a.id+'\')">'+
          esc(ccIvLine('ccIvA'+a.id, iv.id, iv.v, [who, iv.row.place]))+
        '</button>').join('')+
      '<button class="cc-back cc-iv-skip" onclick="careerInterviewPass()">'+
        L().ccIvPass+'</button>'+
    '</div></div>';
}

/* ---- Playing none of it -----------------------------------------------------
   Skip a week/month: the mode plays them with the real runners, fields, growth,
   money, news and history, not a shortcut model. It answers the two run prompts:
   the drop as the room would, in the player's queue (careerLandingPick), and the
   day off on the best rating a day's energy buys. Club offers, duo invites and the
   shop stay in the inbox. Stops at end of span or end of season, whichever first. */
const CC_FF_WEEK=7, CC_FF_MONTH=30;
let CC_FF=null;
// Beside Play, not instead of it: a career that wants to watch this one still
// can. Gone at the season boundary, where the only move is to start a year.
/* Two buttons that said "A week" and "A month" and nothing else.

   Which is a duration, not an action: the player asked what they were even
   supposed to click. A button has to say what pressing it does, so the row
   carries the verb — play it for me — and the buttons carry the span, with the
   fast-forward glyph on them so the shape reads before the words do. */
/* И эти две кнопки спрашивают.
 *
 * Правка: «вот эти кнопки когда нажимаешь, должно быть
 * подтверждение». Одно нажатие — и месяц карьеры прожит: турниры отыграны, дни
 * потрачены, предложения протухли, напарник, может быть, ушёл. У выбора дня на
 * календаре подтверждение было с самого начала (careerFfAsk и полоса под ним),
 * у двух кнопок рядом — нет.
 *
 * Спрашивает обработчик клика, а не careerFastForward: сам прогон гоняют
 * симуляция и проверки, а нативная модалка в headless Chrome вешает страницу
 * навсегда — так уже случилось с careerSkipWeek. */
/* Один вопрос на всю карьеру — перемотка, скип недели, кик тиммейта, новая
   карьера: текст, «Да», «Отмена», в стиле остальных модалок. Скриншот: «сделай кнопку под стиль игры а не такое окно» — поверх экрана
   стояло системное «This page says». Продолжение — колбэком: модалка не
   блокирует. В headless продолжение не зовётся, как не звалось и с confirm
   (он там молча отвечает «нет») — сами ходы харнессы зовут напрямую. */
let CC_ASK_GO=null, CC_ASK_NO=null;
/* opts — когда «да/нет» не отвечают на вопрос. У окна про метку выбор не между
   согласием и отказом, а между двумя действиями («поставить» и «сыграть без»),
   и второе — тоже действие, а не отмена: см. onNo. */
function ccAsk(text, go, opts){
  const m=document.getElementById('ccAskModal');
  if(!m){ if(typeof confirm!=='function' || confirm(text)) go();
          else if(opts && opts.onNo) opts.onNo();
          return; }
  CC_ASK_GO=go;
  CC_ASK_NO=(opts && opts.onNo) || null;
  document.getElementById('ccAskText').textContent=text;
  document.getElementById('ccAskYes').textContent=(opts && opts.yes) || L().ccAskYes;
  document.getElementById('ccAskNo').textContent=(opts && opts.no) || L().ccAskNo;
  m.style.display='flex';
}
/* Сказать, не спрашивая.

   Модалка в приложении одна и у неё две кнопки. Здесь вторая прячется, а на
   первой стоит «понятно»: бывают сообщения, у которых нет второго исхода —
   например, отказ во входе в лобби чужого дивизиона. Кнопка возвращается на
   место в ccAskGo, иначе следующий настоящий вопрос остался бы без «нет». */
function ccTell(text){
  const m=document.getElementById('ccAskModal');
  // Под пробой и перемоткой модалки нет — и говорить некому.
  if(!m) return;
  ccAsk(text, function(){}, {yes:L().ccTellOk, no:L().ccTellOk});
  const no=document.getElementById('ccAskNo');
  if(no) no.style.display='none';
}
function ccAskGo(yes){
  const m=document.getElementById('ccAskModal');
  if(m) m.style.display='none';
  // Вернуть вторую кнопку, если её прятал ccTell.
  const noBtn=document.getElementById('ccAskNo');
  if(noBtn) noBtn.style.display='';
  const go=CC_ASK_GO, no=CC_ASK_NO;
  CC_ASK_GO=null; CC_ASK_NO=null;
  if(yes){ if(typeof go==='function') go(); }
  else if(typeof no==='function') no();
}
