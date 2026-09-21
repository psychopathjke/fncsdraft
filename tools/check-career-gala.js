// Церемония закрытия сезона — отдельный последний день года.
//
// Его правка 4 сентября: «может церемонию игрока какую-то сделать — отдельный
// последний день, и там что-то показывают игроку за весь сезон».
//
// Проверяется: день церемонии стоит в календаре на CC_YEAR_TO и играть его
// нельзя; кнопка «Смотреть церемонию» есть только на конце сезона и стоит
// ПОСЛЕ «Нового сезона» (её дорогой ходят полтора десятка проверок); окно само
// не всплывает; четыре экрана листаются вперёд и назад, показывают числа года,
// вечера, награды и последним — игрока года; закрытие убирает окно.
//
//   node tools/check-career-gala.js
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
  const seed=(extra)=>{
    const cr=Object.assign({season:1, day:CC_YEAR_TO, division:1, earnings:41200,
      balance:41200, reach:120000, twitch:64000, tokens:[], news:[],
      log:[
        {season:1, day:'2026-03-02', div:1, place:6, of:150, kind:'cup', ovr:88, wins:1, elims:38, prize:0},
        {season:1, day:'2026-04-06', div:1, place:2, of:150, kind:'cup', ovr:89, wins:3, elims:52, prize:1200},
        {season:1, day:'2026-05-24', div:1, place:4, of:33, kind:'major', stage:'final', ovr:90, wins:1, elims:31, prize:9500},
        {season:1, day:'2026-09-28', div:1, place:3, of:100, kind:'globals', ovr:91, wins:2, elims:44, prize:24500}
      ],
      pr:{rows:{
        'Malibuca':{v:[[820,40],[760,120],[700,200]]},
        'Keegorka':{you:true, v:[[790,50],[720,130],[640,210]]},
        'Vic0':{v:[[700,60],[660,140],[610,220]]},
        'th0masHD':{v:[[640,70],[600,150],[560,230]]},
        'Sky':{v:[[590,80],[560,160],[520,240]]}
      }},
      aw:{last:'2026-10', won:[{kind:'month', key:'2026-05', season:1, name:'Keegorka', you:true}]}
    }, extra||{});
    localStorage.setItem('fncsdraft_career', JSON.stringify({v:1,
      player:{nick:'Keegorka', age:17, source:'rookie', country:'rs', countryPing:26,
              closeRangeEdge:6, region:'EU', ovr:91, role:'roleIGL', attrs:null, ageEdge:4,
              photo:null, handle:null, cardRegion:null, nat:null},
      career:cr, partners:[]}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs=ccRookieAttrs(91,'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerEntry();
    careerAwardSeason();
  };
  try{
    // ---- день в календаре --------------------------------------------------
    seed({seasonOver:true});
    const on=(careerEvents().get(CC_YEAR_TO)||[]).filter(e=>e.kind==='gala');
    out.notes.day=CC_YEAR_TO;
    check('церемония стоит последним днём года', on.length===1, JSON.stringify(on));
    check('и носит имя из словаря', on.length && on[0].label===L().ccGalaDay,
          on.length ? on[0].label : '—');
    check('и обложку сезона', on.length && !!on[0].art, JSON.stringify(on[0]||{}));
    check('играть её нельзя', careerCanPlayKind('gala')===false);
    check('и она не считается турниром', CC_PLAYABLE.indexOf('gala')<0);

    // ---- кнопка на карточке конца сезона ------------------------------------
    careerTab('centre');
    check('окно само не всплывает', !document.getElementById('ccGalaModal'));
    const btns=[].slice.call(document.querySelectorAll('#chBody .ch-play'));
    out.notes.btns=btns.map(b=>b.textContent.trim());
    check('кнопка церемонии есть', btns.some(b=>/ccGalaOpen/.test(b.getAttribute('onclick')||'')),
          JSON.stringify(out.notes.btns));
    check('но первой стоит новый сезон',
          /careerNewSeason/.test((btns[0]&&btns[0].getAttribute('onclick'))||''),
          JSON.stringify(out.notes.btns));

    // Посреди года её нет — год ещё идёт.
    seed({seasonOver:false, day:'2026-05-04'});
    careerTab('centre');
    check('посреди сезона церемонии не предлагают',
          !document.querySelector('#chBody .ch-play[onclick*="ccGalaOpen"]'));

    // ---- само окно ----------------------------------------------------------
    seed({seasonOver:true});
    careerTab('centre');
    ccGalaOpen();
    const el=()=>document.getElementById('ccGalaModal');
    check('окно открывается', !!el());
    const s1=el().textContent;
    out.notes.s1=s1.slice(0,60);
    check('первый экран называет сезон', s1.indexOf(L().ccGalaTitle(1))>=0, out.notes.s1);
    check('и говорит, сколько вечеров', s1.indexOf(L().ccGalaOpenLine(1,4))>=0, out.notes.s1);

    ccGalaGo(1);
    const s2=el().textContent;
    out.notes.s2=s2.slice(0,80);
    check('второй экран — числа года', s2.indexOf(L().ccGalaYearH)>=0, out.notes.s2);
    check('и в них четыре вечера', s2.indexOf('4')>=0 && s2.indexOf(L().ccGalaEvents)>=0, out.notes.s2);
    check('и призовые года', s2.indexOf(ccMoney(35200))>=0, out.notes.s2);
    check('и лучшее место', s2.indexOf('#2')>=0, out.notes.s2);

    ccGalaGo(1);
    const s3=el().textContent;
    out.notes.s3=s3.slice(0,80);
    check('третий экран — вечера года', s3.indexOf(L().ccGalaRunsH)>=0, out.notes.s3);
    check('и в них большой вечер', s3.indexOf(L().ccRunMajor)>=0, out.notes.s3);
    check('и награда месяца', s3.indexOf(L().ccGalaAwardsH)>=0 &&
          s3.indexOf(L().ccGalaMonthWon(ccMonthName('2026-05')))>=0, out.notes.s3);

    // 10.09: перед игроком года — слайд номинаций (CC_GALA_SLIDES=5).
    ccGalaGo(1);
    const s35=el().innerHTML;
    check('четвёртый экран — номинации, ещё не последний', !/ccGalaFinish/.test(s35) && s35.indexOf('ccGalaGo(1)')>=0);
    ccGalaGo(1);
    const s4=el().innerHTML;
    check('последним — игрок года', s4.indexOf('cc-goty')>=0);
    check('и он назван', s4.indexOf('Malibuca')>=0);
    check('на последнем экране зовут в новый сезон',
          /ccGalaFinish/.test(s4), s4.slice(0,80));
    check('дальше листать некуда', (function(){ ccGalaGo(1);
          return el().innerHTML.indexOf('cc-goty')>=0; })());

    // Назад — и снова числа года.
    ccGalaGo(-1); ccGalaGo(-1); ccGalaGo(-1);
    check('назад листается', el().textContent.indexOf(L().ccGalaYearH)>=0);

    ccGalaClose();
    check('закрытие убирает окно', !el());
  }catch(e){ out.err=String(e&&e.stack||e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\u002fscript>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gala-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=300000', '--dump-dom',
  'file:///' + tmp.split(path.sep).join('/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log('  ' + JSON.stringify(out.notes));
if (out.fails.length) { out.fails.forEach(f => console.error('FAILED: ' + f)); process.exit(1); }
console.log('церемония закрытия сезона стоит последним днём и показывает год');
