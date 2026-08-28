// Что у двоих обязано совпадать, чтобы вечер вообще начался.
//
// Его слова, 28 августа: «еще они должны выбрать один режим смотреть/играть
// должно запрещать если у них разные» и «еще игроки должны быть в одном
// дивизионе… нужно запрещать если один в 1 другой в 5 типо».
//
// Оба запрета — про одно и то же: про вещи, которые выглядят личной настройкой,
// а на деле решают, КАК посчитается вечер.
//
//   Режим «смотреть» не задаёт вопросов вовсе (careerSimOn в
//   playGameWithChoices). Двое в разных режимах проходят игру по разным путям
//   — ровно то, чем был опасен пропуск, только на весь вечер.
//
//   Дивизион у команды один и лежит в CC_TEAM_KEYS, поэтому поле строится из
//   него. Опасен не он сам, а вход: стартовый дивизион игрок выбирает на
//   экране создания, а первое состояние от сервера переписывало командные поля
//   целиком — и карьера вошедшего вторым молча меняла дивизион.
//
// Здесь же проверяется и то, из-за чего эти два запрета вообще заработали:
// карточка напарника теперь ПЕРЕСЫЛАЕТСЯ. До 28 августа она уезжала ровно один
// раз, в hello, и всё, что менялось потом, до второго не доезжало.
//
//   node tools/check-mp-same.js

const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out={fails:[], notes:{}, err:null};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  const seed=(team, div)=>{
    const cr={season:1, day:'2026-02-02', division:div||1, earnings:0, balance:0,
              reach:0, tokens:[], log:[], news:[], seed:'fixed-world', size:2};
    if(team) cr.mp={code:'ABC123', role:'b'};
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Same', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:0, region:'EU', ovr:90, role:'roleIGL',
        attrs:ccRookieAttrs(90,'roleIGL'), ageEdge:0, photo:null,
        handle:null, cardRegion:null, nat:null},
      career:cr, partners:[]}));
    careerLoad();
    CC_MP_DIV_BAD=null;
    MP.state='live';
    MP.peer={handle:'howly', nat:'ru', region:'EU', rating:90, _targetOvr:90,
             _attrs:null, _roleKey:'roleFRG', sim:false};
  };
  try{
    // ---- режим: карточка его везёт ---------------------------------------
    seed(true, 1);
    careerSimSet(true);
    check('режим уезжает в карточке', MP.card().sim===true, JSON.stringify(MP.card().sim));
    careerSimSet(false);
    check('и обратно тоже', MP.card().sim===false, JSON.stringify(MP.card().sim));

    // ---- режим: разошлись — вечер не начинается ---------------------------
    seed(true, 1);
    careerSimSet(false);            // я играю
    MP.peer.sim=false;              // и он играет
    check('одинаковый режим не мешает', ccMpModeWhy()===null, String(ccMpModeWhy()));
    MP.peer.sim=true;               // а теперь он смотрит
    out.notes.режим=ccMpModeWhy();
    check('разные режимы названы', !!ccMpModeWhy(), String(ccMpModeWhy()));
    check('и вечер с ними не начинается', careerCanPlayKind('cup')===false);
    /* Про режим напарника мы можем и не знать — старая сборка, карточка ещё в
       пути. Запрет на незнании запер бы карьеру наглухо, поэтому его нет. */
    delete MP.peer.sim;
    check('неизвестный режим не запрещает ничего', ccMpModeWhy()===null,
          String(ccMpModeWhy()));

    /* ---- и кнопка вечера при этом НЕ становится «пропустить» -------------
       Его отчёт, 28 августа: «только смотреть нажимаю, опять скипается
       турнир». Скипал не режим (замер — tools/sim-shows-probe.js: «только
       смотрю» матч показывает), а кнопка: непроходимый вечер по старому
       правилу превращался из «Играть» в «Пропустить», и следующее нажатие
       пропускало турнир. В команде день двигает только сервер, так что
       пропуск там и не сработал бы — предлагать его незачем. */
    seed(true, 1);
    careerSimSet(false);
    MP.peer.sim=true;
    try{ careerRenderHub('centre'); }catch(e){ out.notes.ошибкаРендера=String((e&&(e.message||e))||e); }
    const hub=(document.getElementById('chBody')||{}).innerHTML||'';
    // Карточка матча осталась карточкой матча, а не подменилась днём.
    check('вечер остался карточкой матча, а не панелью дня',
          hub.indexOf('ch-next')>=0 && hub.indexOf('ch-simwrap')>=0,
          'карточка: '+(hub.indexOf('ch-next')>=0)+', режим: '+(hub.indexOf('ch-simwrap')>=0));
    check('кнопка вечера не предлагает пропустить день',
          hub.indexOf('careerSkipAsk()')<0, 'careerSkipAsk на экране');
    check('кнопка вечера заглушена', /class="ch-play"[^>]*disabled/.test(hub),
          (hub.match(/<button class="ch-play"[^>]*>/)||[''])[0]);
    check('и причина написана рядом', hub.indexOf(L().ccMpModeDiff)>=0);
    /* И самое главное — строка режима на экране ОСТАЛАСЬ. Она рисовалась
       только для проходимого вечера, то есть при расхождении исчезала вместе
       с кнопкой: чинить режим было нечем, выход только через разрыв дуо. */
    check('кнопки режима на месте — ими это и чинится',
          hub.indexOf('careerSimSet(')>=0, 'строки режима нет');

    // ---- режим виден под кнопками, которыми его и меняют -------------------
    seed(true, 1);
    careerSimSet(false);
    MP.peer.sim=true;
    const row=careerSimRowHTML();
    check('под кнопками сказано, что у напарника',
          row.indexOf(L().ccSimAuto)>=0, row.slice(0, 200));
    check('и сказано, что вечер не начнётся',
          row.indexOf(L().ccMpModeDiff)>=0, row.slice(0, 200));

    // ---- смена режима уходит напарнику сразу ------------------------------
    seed(true, 1);
    const sent=[];
    MP.send=function(m){ sent.push(m); };
    careerSimSet(true);
    check('смена режима уехала карточкой',
          sent.some(m=>m.t==='card' && m.card && m.card.sim===true), JSON.stringify(sent));

    /* ---- дивизион: в такое лобби не пускает вовсе ------------------------
       Его слово: «все равно могу зайти в лобби, если игрок другого дивизиона,
       запрети». Первая правка запрещала играть, оставляя карьеру командной с
       живой связью, — то есть тупик: играть нельзя, а выйти надо догадаться.
       Теперь вход откатывается целиком. */
    seed(true, 5);
    const before=CAREER.career.division;
    const ok=ccMpStateOk({division:1, day:'2026-06-01', season:1});
    check('состояние чужого дивизиона отвергнуто', ok===false, String(ok));
    check('и карьера снова одиночная — из лобби выкинуло',
          ccMpOn()===false, JSON.stringify(CAREER.career.mp));
    check('дивизион остался своим', CAREER.career.division===before,
          before+' -> '+CAREER.career.division);
    /* И день тоже: чужое состояние переписывало все командные поля разом,
       так что карьера уезжала ещё и по календарю. */
    check('и день чужой команды не приехал', CAREER.career.day==='2026-02-02',
          CAREER.career.day);
    check('и связь закрыта', MP.state==='off', String(MP.state));
    // Причина сказана окном: плитки команды после отката уже нет.
    const told=(document.getElementById('ccAskText')||{}).textContent||'';
    out.notes.дивизион=told;
    check('причина показана окном', told.indexOf('5')>=0 && told.indexOf('1')>=0, told);
    check('и у окна одна кнопка — выбирать тут нечего',
          (document.getElementById('ccAskNo')||{}).style.display==='none',
          (document.getElementById('ccAskNo')||{}).style.display);
    // Вторая кнопка возвращается на место, иначе следующий вопрос без «нет».
    ccAskGo(true);
    check('и возвращается на место после закрытия',
          (document.getElementById('ccAskNo')||{}).style.display==='',
          (document.getElementById('ccAskNo')||{}).style.display);
    // Сейв тоже одиночный: иначе после перезагрузки карьера снова командная.
    careerLoad();
    check('и сейв записан одиночным', ccMpOn()===false, JSON.stringify(CAREER.career.mp));

    // ---- свой дивизион проходит и всё применяется -------------------------
    seed(true, 5);
    check('своё состояние принимается', ccMpStateOk({division:5, day:'2026-06-01'})===true);
    check('и запрета больше нет', ccMpDivWhy()===null, String(ccMpDivWhy()));
    check('и из лобби никого не выкинуло', ccMpOn()===true, JSON.stringify(CAREER.career.mp));
    /* А своя же команда пускает всегда, даже если сейв отстал на дивизион:
       вечер мог оборваться ровно на повышении. Команду называет сид. */
    seed(true, 4);
    CAREER.career.seed='team-ЭТА';
    check('в своё лобби пускает и с отставшим сейвом',
          ccMpStateOk({division:3, seed:'team-ЭТА'})===true && ccMpOn()===true,
          CAREER.career.division+' / '+ccMpOn());
    check('и состояние команды применилось бы', ccMpDivWhy()===null, String(ccMpDivWhy()));
    // А чужая команда с чужим сидом — по-прежнему нет.
    seed(true, 4);
    CAREER.career.seed='team-МОЯ';
    check('чужое лобби с чужим сидом не пускает',
          ccMpStateOk({division:1, seed:'team-ЧУЖАЯ'})===false && ccMpOn()===false,
          CAREER.career.division+' / '+ccMpOn());

    // У создателя лобби команда пустая — сравнивать не с чем.
    check('пустое состояние никого не блокирует', ccMpStateOk({})===true);
    check('и отсутствующее тоже', ccMpStateOk(null)===true);

    /* ---- двое не могут быть одним человеком -----------------------------
       Его скрин, 28 августа: в команде SWIZZY и SWIZZY. Ник — ключ, по
       которому команда собирается и отличается от чужих, поэтому правило по
       ключу ника: одинаковые карточки и просто тёзки ломают одно и то же. */
    seed(true, 1);
    CAREER.career.mp.role='b';
    const meNow=careerCard();
    check('свой ник есть', !!(meNow && meNow.handle), JSON.stringify(meNow && meNow.handle));
    MP.peer={handle:meNow.handle, nat:'de', region:'EU', rating:90,
             _targetOvr:90, _attrs:null, _roleKey:'roleIGL', sim:false};
    out.notes.одинаковые=ccMpSameWhy();
    check('одинаковый игрок назван', !!ccMpSameWhy(), String(ccMpSameWhy()));
    check('и вечер с ним не начинается', careerCanPlayKind('cup')===false);
    // Вошедшего выкидывает из лобби, чтобы он сменил карточку и вошёл снова.
    ccMpPeerCheck();
    check('вошедшего выкинуло из лобби', ccMpOn()===false,
          JSON.stringify(CAREER.career.mp));

    // А владелец лобби остаётся: ему менять нечего, ждёт второго.
    seed(true, 1);
    CAREER.career.mp.role='a';
    MP.peer={handle:careerCard().handle, nat:'de', region:'EU', rating:90,
             _targetOvr:90, _attrs:null, _roleKey:'roleIGL', sim:false};
    ccMpPeerCheck();
    check('владелец лобби остаётся', ccMpOn()===true, JSON.stringify(CAREER.career.mp));
    check('но играть не может', careerCanPlayKind('cup')===false);
    check('и плитка говорит почему',
          careerMpTileHTML().indexOf(ccMpSameWhy())>=0);

    // Разные игроки — никаких запретов.
    seed(true, 1);
    MP.peer={handle:'howly', nat:'ru', region:'EU', rating:90,
             _targetOvr:90, _attrs:null, _roleKey:'roleFRG', sim:false};
    check('разные игроки не мешают', ccMpSameWhy()===null, String(ccMpSameWhy()));
    ccMpPeerCheck();
    check('и из лобби никого не выкинуло', ccMpOn()===true);

    /* ---- в команде обязательно игл и фраггер ------------------------------
       Его слово, 28 августа: «обязательно в команде, один фраге один игл». Это
       следствие разделения вопросов по ролям: команда из двух иглов оставляет
       фраггерский вопрос без хозяина, и его берёт тай-брейк по нику — то есть
       случайный человек, а не тот, чья это работа. */
    seed(true, 1);
    CAREER.player.role='roleIGL';
    CAREER.player.attrs=ccRookieAttrs(90,'roleIGL');
    /* Карточка напарника пересобирается, а не правится: attrsFor кладёт
       посчитанное в _attrs и на второй вызов отдаёт его же — правка _roleKey
       на месте осталась бы незамеченной. По проводу карточка каждый раз
       приезжает новым объектом, так что это ловушка проверки, а не игры. */
    const peerAs=(role)=>({handle:'howly', nat:'ru', region:'EU', rating:90,
      _targetOvr:90, _attrs:null, _roleKey:role, sim:false});
    MP.peer=peerAs('roleFRG');
    check('игл и фраггер — так и надо', ccMpRolesWhy()===null, String(ccMpRolesWhy()));
    MP.peer=peerAs('roleIGL');
    out.notes.роли=ccMpRolesWhy();
    check('два игла названы', !!ccMpRolesWhy(), String(ccMpRolesWhy()));
    check('и вечер с ними не начинается', careerCanPlayKind('cup')===false);
    check('плитка команды говорит почему',
          careerMpTileHTML().indexOf(ccMpRolesWhy())>=0);
    // Из лобби при этом НЕ выкидывает: чинится кнопкой под своей карточкой.
    check('но из лобби не выкидывает', ccMpOn()===true, JSON.stringify(CAREER.career.mp));
    // Роли ещё не знаем — не запрещаем.
    MP.peer={handle:'howly', nat:'ru', region:'EU', sim:false};
    check('неизвестная роль напарника ничего не запрещает',
          ccMpRolesWhy()===null || careerCanPlayKind('cup')!==false, String(ccMpRolesWhy()));

    // ---- одиночная карьера ничего этого не знает --------------------------
    seed(false, 3);
    check('в одиночной карьере про режим ничего не говорят', ccMpModeWhy()===null);
    check('и про дивизион тоже', ccMpDivWhy()===null);
    check('и про одинаковых игроков тоже', ccMpSameWhy()===null);
    /* А «может ли она играть» здесь не спрашивается нарочно: это решает
       календарь, а не мультиплеер, и утверждение про него стерегло бы не то. */
  }catch(e){ out.err=String(e&&e.stack||e); }
  document.getElementById('__out').textContent=
    'PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mpsame-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('проба не отработала; копия в ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('режим и дивизион у двоих обязаны совпадать, иначе вечер не начнётся');
fs.rmSync(dir, { recursive: true, force: true });
