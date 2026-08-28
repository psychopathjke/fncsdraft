// Сторож локстепа: один и тот же вечер, посчитанный ДВУМЯ РАЗНЫМИ браузерами
// из одного сида, обязан дать таблицу до последнего очка одинаковую.
//
// Это первый шаг мультиплеерной карьеры (вариант A): сервер вечер не считает,
// его считают оба клиента сами, а по сети летят только решения. Значит вопрос
// один: течёт ли в расчёт что-нибудь личное — ник, деньги, журнал, инбокс, —
// чего у второго игрока другое.
//
// Запускает Chrome дважды: «клиент А» с одной личной жизнью и «клиент Б» с
// совсем другой, при одинаковом состоянии КОМАНДЫ. Сравнивает хеш таблицы.
//
// Это СТОРОЖ, а не проба: он гоняется на каждой сборке. Локстеп — единственное
// допущение, на котором стоит командная карьера, и ломается он молча: таблицы
// разъезжаются, а на экране у обоих всё выглядит нормально до конца вечера.
//
//   node tools/check-lockstep.js
const fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set the CHROME environment variable to chrome.exe');

// Всё, что различает двух живых игроков за одним столом, кроме состояния команды.
const CLIENTS = [
  { tag: 'A', nick: 'Ilyusha', balance: 0,     log: 0,  dms: 0, first: false, dev: false },
  { tag: 'B', nick: 'howly',   balance: 48000, log: 12, dms: 5, first: true,  dev: false },
  /* Контроль: этому клиенту сервер выдал другой сид мира. Комната обязана
     разъехаться — иначе проба не умеет ловить расхождение вообще, и её
     «сошлось» ничего не стоит. Именно сид, а не книга роста сцены: книга
     меняет то, что написано на карточках, а силу вечера, как выяснилось,
     не двигает — см. заметку про careerDevOf. */
  { tag: 'C', nick: 'Ilyusha', balance: 0,     log: 0,  dms: 0, first: false, seed: 'team-OTHER' }
];

const boot = (c) => `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out={notes:{}, err:null};
  try{
    // «Клиент Б» до этого пожил своей жизнью: другой ник, деньги, журнал,
    // инбокс — и вдобавок успел построить пару чужих полей, чтобы прогреть
    // кэши пула и сцены не так, как у первого.
    const noise=${c.first ? 'true' : 'false'};
    const mkLog=n=>Array.from({length:n},(_,i)=>({season:1, day:'2026-02-0'+(i%9+1), div:1,
      place:i+1, of:150, pts:200+i, passed:true, ovr:90, games:11, wins:0, elims:20,
      avg:9, mate:'nobody', mates:['nobody'], prize:i*100, kind:'cup', stage:'final'}));
    CAREER={player:{nick:${JSON.stringify(c.nick)}, ovr:93, ovrExact:93, region:'EU',
        role:'roleIGL', country:'ru', age:20, attrs:ccRookieAttrs(93,'roleIGL')},
      career:{season:1, day:'2026-02-02', division:1, earnings:${c.balance},
        balance:${c.balance}, tokens:[], log:mkLog(${c.log}), news:[], form:0, grind:0,
        size:2, sizes:{1:2}, seasonOver:false, trios:{},
        // Соль мира — командная, а не от ника: иначе у двоих разные лобби.
        seed:${JSON.stringify(c.seed || 'team-2508')}},
      dev:{}, dms:Array.from({length:${c.dms}},(_,i)=>({id:'d'+i, state:'offer',
        who:{handle:'nobody'+i}, text:'hi'})), partners:[], gear:{own:[], train:0}};
    /* Кэши пула и сцены строятся на первое обращение и живут до конца страницы.
       Состояние мира (книга роста) приезжает от сервера ПОСЛЕ загрузки, значит
       кэши обязаны быть сброшены — иначе клиент считает вечер по вчерашней
       сцене и молча расходится со вторым. Ровно это careerLoad делает для
       CC_NOW_CARDS, когда открывают другую карьеру. */
    CC_POOLS=null; CC_NOW_CARDS={}; CC_EU_ALL={}; CC_ARC_PAIRS={}; CC_NAT_POOL={};
    if(noise){
      // чужие поля до расчёта — греют CC_POOLS, сцену и генераторы
      const cr0=Object.assign({}, CAREER.career, {division:3, day:'2026-03-02'});
      careerCupField(cr0, [careerCard()], 200, 'noise1', true, 0);
      careerCupField(cr0, [careerCard()], 120, 'noise2', false, 4);
    }
    // ---- вечер команды ----------------------------------------------------
    /* Состав — обе живые карточки, одинаковые у обоих клиентов: ровно то, чем
       лобби обменивается при входе. Свою careerCard() здесь брать нельзя — она
       у каждого своя, и тогда клиенты сравнивали бы разные команды. */
    const cardOf=(nick, ovr, role, nat)=>({handle:nick, nat:nat, region:'EU', org:null,
      tier:'career', event:'career', date:'—', placement:null,
      rating:ovr, _targetOvr:ovr, _attrs:ccRookieAttrs(ovr, role)});
    const squad=[cardOf('Ilyusha', 93, 'roleIGL', 'ru'), cardOf('howly', 91, 'roleFRG', 'de')];
    const cr=Object.assign({}, CAREER.career, {division:1});
    out.notes.poolTop=careerPools().duos.slice(0,3)
      .map(d=>d.cards.map(c=>c.handle+':'+Math.round(attrsFor(c).ovr)).join('+'));
    const field=careerCupField(cr, squad, ccCupField(1), 'night', false, 0);
    const scroll=field.find(t=>String(t.name).indexOf('Scroll')>=0);
    out.notes.scroll=scroll ? {name:String(scroll.name).replace(/<[^>]*>/g,''),
      pow:scroll.pow, ovrs:scroll.squad.map(c=>Math.round(attrsFor(c).ovr))} : 'нет в комнате';
    const you=careerYouTeam(squad); you.isYou=true;
    you.name=L().yourTeamPrefix+teamLabel(squad);
    const room=[you].concat(field);
    // Сид вечера — общий, как его раздал бы сервер.
    const rng=careerRng(hashStr('night|2026-02-02|'+CAREER.career.seed));
    const rand=Math.random, mode=CARD_MODE, ss=squadSize;
    Math.random=rng; CARD_MODE=true; squadSize=2;
    try{ simulateGames(room, 11, wfPoints, 1); }
    finally{ Math.random=rand; CARD_MODE=mode; squadSize=ss; }
    // Комната ДО симуляции: если разъезжается уже здесь, дело не в движке.
    out.notes.roomBefore=room.map(t=>String(t.name).replace(/<[^>]*>/g,'')
      +'~'+Math.round(t.pow||0));
    // И что вышло по играм у своей строки.
    out.notes.myGames=(you.stageLog||[]).map(g=>g.place+'/'+(g.elims!=null?g.elims:'-'));
    const ranked=room.slice().sort((a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0)
      || b.stageElims-a.stageElims);
    out.notes.table=ranked.map((t,i)=>(i+1)+' '+String(t.name).replace(/<[^>]*>/g,'')+
      ' '+(t.stagePts||0)+'/'+(t.wins||0)+'/'+(t.stageElims||0));
    out.notes.you=ranked.indexOf(you)+1;
    out.notes.rows=ranked.length;
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent=
    'PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const runs = CLIENTS.map(c => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cclock-' + c.tag + '-'));
  const tmp = path.join(dir, 'index.html');
  fs.writeFileSync(tmp, src + boot(c));
  const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
    '--allow-file-access-from-files', '--virtual-time-budget=180000', '--dump-dom',
    'file:///' + tmp.split(String.fromCharCode(92)).join('/')],
    { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
  const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
  if (!m) { console.error('клиент ' + c.tag + ': проба не отработала, копия ' + tmp); process.exit(2); }
  const out = JSON.parse(decodeURIComponent(m[1]));
  if (out.err) { console.error('клиент ' + c.tag + ': ' + out.err); process.exit(1); }
  fs.rmSync(dir, { recursive: true, force: true });
  return out.notes;
});

const hash = t => crypto.createHash('sha1').update(t.join('\n')).digest('hex').slice(0, 12);
const [a, b, c] = runs;
console.log('клиент A: строк ' + a.rows + ', своё место ' + a.you + ', хеш ' + hash(a.table));
console.log('клиент B: строк ' + b.rows + ', своё место ' + b.you + ', хеш ' + hash(b.table));
// Сначала комната: разъехалась она — движок ни при чём.
if (hash(a.roomBefore) !== hash(b.roomBefore)) {
  const at = a.roomBefore.findIndex((r, i) => r !== b.roomBefore[i]);
  console.error('КОМНАТА разъехалась ещё до симуляции, строка ' + (at + 1));
  console.error('  A: ' + a.roomBefore[at]);
  console.error('  B: ' + b.roomBefore[at]);
  console.error('  совпало строк подряд: ' + at + ' из ' + a.roomBefore.length);
  process.exit(1);
}
console.log('комната до симуляции: одинаковая (' + a.roomBefore.length + ' строк)');
if (JSON.stringify(a.myGames) !== JSON.stringify(b.myGames)) {
  console.error('СИМУЛЯЦИЯ разъехалась при одинаковой комнате');
  console.error('  A по играм: ' + a.myGames.join(' '));
  console.error('  B по играм: ' + b.myGames.join(' '));
}
if (hash(a.table) === hash(b.table)) {
  console.log('верх таблицы: ' + a.table.slice(0, 3).join(' | '));
  if (hash(c.table) === hash(a.table)) {
    console.error('Scroll у A: '+JSON.stringify(a.scroll)); console.error('Scroll у C: '+JSON.stringify(c.scroll)); console.error('комната A==C: '+(hash(a.roomBefore)===hash(c.roomBefore))); const at2=a.roomBefore.findIndex((r,i)=>r!==c.roomBefore[i]); console.error(at2<0?'ни одной разной строки в комнате':('первая разная строка комнаты '+(at2+1)+':  A: '+a.roomBefore[at2]+'   C: '+c.roomBefore[at2])); console.error('игры A: '+a.myGames.join(' ')); console.error('игры C: '+c.myGames.join(' ')); console.error('пул A: '+a.poolTop.join(' | ')); console.error('пул C: '+c.poolTop.join(' | ')); console.error('КОНТРОЛЬ НЕ СРАБОТАЛ: клиент с ДРУГИМ СИДОМ МИРА дал ту же');
    console.error('таблицу — значит проба не умеет ловить расхождение, верить ей нельзя');
    process.exit(1);
  }
  console.log('контроль: клиент с другим сидом мира разъехался (хеш ' + hash(c.table) + ') — проба ловит');
  console.log('СОШЛОСЬ — вечер считается одинаково в двух браузерах, локстеп возможен');
  process.exit(0);
}
const first = a.table.findIndex((r, i) => r !== b.table[i]);
console.error('РАЗОШЛОСЬ на строке ' + (first + 1));
console.error('  A: ' + a.table[first]);
console.error('  B: ' + b.table[first]);
process.exit(1);
