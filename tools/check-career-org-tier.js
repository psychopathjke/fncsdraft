// Уровень клуба в карьере (его «почему BIG так далеко» → «делай», 8.10): дуэт в дуо-год — полный состав,
// призовые только поднимают. BIG 2026 (vic0 + Malibuca) не режется до ~85, Sentinels со слабым составом
// по-прежнему поднимает история клуба, клуб из одного человека — по-прежнему срезан.
//   node tools/check-career-org-tier.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(String.fromCharCode(92)).join('/');
const CH = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => fs.existsSync(p));
const BOOT = `<pre id="__out" style="display:none"></pre><script>window.addEventListener('load',()=>setTimeout(()=>{ const out={fails:[], notes:{}};
const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d!=null ? ': '+d : '')); };
try{
  localStorage.setItem('fncsdraft_career', JSON.stringify({v:1, player:{nick:'P', age:18, source:'rookie', country:'de', countryPing:15, closeRangeEdge:0, region:'EU', ovr:82, role:'roleIGL', attrs:ccRookieAttrs(82,'roleIGL'), ageEdge:0, photo:null, handle:null, cardRegion:null, nat:null}, career:{season:1, day:'2026-03-10', division:1, earnings:0, balance:0, reach:500, tokens:[], log:[], news:[]}, partner:null, partners:[]}));
  careerLoad();
  check('дуо-год', careerSquadSize()===2, String(careerSquadSize()));
  check('дуэт 93 с малыми призовыми не опускается', ccOrgTier('BIG', 93, 2)===93, String(ccOrgTier('BIG', 93, 2)));
  check('дуэт 93 без призовых не режется', ccOrgTier('Нет Такого Клуба', 93, 2)===93, String(ccOrgTier('Нет Такого Клуба', 93, 2)));
  check('один человек — срез к 78 наполовину', ccOrgTier('Нет Такого Клуба', 94, 1)===86, String(ccOrgTier('Нет Такого Клуба', 94, 1)));
  check('история клуба поднимает слабый состав', ccOrgTier('Sentinels', 78, 4)>78, String(ccOrgTier('Sentinels', 78, 4)));
  const big=careerOrgPool().find(o=>o.name==='BIG'); out.notes.big=big && {tier:big.tier, roster:big.roster, n:big.n};
  check('BIG 2026 в карьере — по составу, не ~85', big && big.tier>=Math.round(big.roster)-0.5, JSON.stringify(out.notes.big));
  // Подписчики клуба и его медийка (его слово 8.10: «пусть фоловеры рядом с клубом пишет, типо даёт клуб медийку»).
  const fz=ccOrgFollowers('FaZe Clan', 90), unk=ccOrgFollowers('Нет Такого Клуба', 80);
  check('FaZe — настоящее число', !fz.est && fz.n>1000000, JSON.stringify(fz));
  check('неизвестный — оценка со знаком', unk.est && ccOrgFolText(unk).charAt(0)==='≈');
  check('большой клуб даёт больше медийки', ccOrgMediaMonth('FaZe Clan', 90)>ccOrgMediaMonth('Нет Такого Клуба', 70) && ccOrgMediaSign('FaZe Clan', 90)>ccOrgMediaSign('Нет Такого Клуба', 70));
  check('академия — вдвое меньше', ccOrgMediaMonth('FaZe Clan', 90, true)===Math.round(ccOrgMediaMonth('FaZe Clan', 90)/2));
  const r0=CAREER.career.reach; CAREER.offers=[{name:'Team Falcons', tier:90, salary:5000, goal:'top', academy:false}]; careerSign(0);
  out.notes.sign=CAREER.career.reach-r0;
  check('подписал — объявление клуба от его аудитории', CAREER.career.reach-r0===ccOrgMediaSign('Team Falcons', 90), String(CAREER.career.reach-r0));
  const r1=CAREER.career.reach; careerPayWages('2026-03-15', '2026-05-15'); out.notes.month=CAREER.career.reach-r1;
  check('два месяца — две медийки клуба', CAREER.career.reach-r1===2*ccOrgMediaMonth('Team Falcons', 90), String(CAREER.career.reach-r1));
  // и в списке предложений (его слово 8.10: «при выборе клуба не пишет фоловеры клуба»)
  { const keep=CAREER.org; CAREER.org=null; CAREER.offers=[{name:'Team Falcons', tier:90, salary:5000, goal:'top', academy:false}];
    const ot=careerOrgTileHTML(); check('в предложениях — подписчики клуба и медийка', ot.indexOf(ccOrgFolText(ccOrgFollowers('Team Falcons', 90)))>=0 && ot.indexOf(L().ccOrgMediaRow(ccNum(ccOrgMediaMonth('Team Falcons', 90))))>=0, ot.slice(0,200));
    CAREER.org=keep; CAREER.offers=null; }
  const tile=careerOrgTileHTML(); check('на карточке клуба — подписчики и медийка', tile.indexOf('👥')>=0 && tile.indexOf(ccOrgFolText(ccOrgFollowers('Team Falcons', 90)))>=0 && tile.indexOf(L().ccOrgMedia)>=0);
  check('подписчики игрока: настоящее — без ≈', ccFollowText('Malibuca', 93).charAt(0)!=='≈' && ccFollowText('Нет Такого', 80).charAt(0)==='≈', ccFollowText('Malibuca', 93)+' / '+ccFollowText('Нет Такого', 80));
  check('профиль игрока показывает подписчиков', careerWhoHTML('Malibuca').indexOf('👥 '+ccFollowText('Malibuca'))>=0);
  // «Позвать в клуб» — отказ держится 30 дней (Notion 8.10: «опять спам можно»).
  { const weak={handle:'WeakMate', region:'EU', rating:60, _ovr:60, nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null};
    CAREER.partner={card:weak, patience:50, since:'2026-01-01', dev:0}; CAREER.partners=[CAREER.partner];
    CAREER.org={name:'Team HavoK', tier:95, salary:1000, since:1, paid:0};
    const n0=(CAREER.career.news||[]).filter(n=>n.k==='roClubNo').length;
    ccOrgBringMate('WeakMate'); ccOrgBringMate('WeakMate'); ccOrgBringMate('WeakMate');
    const n1=(CAREER.career.news||[]).filter(n=>n.k==='roClubNo').length;
    check('три нажатия — одна новость отказа', n1-n0===1, String(n1-n0));
    const strip=ccRostersStripHTML(); check('вместо кнопки — «клуб отказал, снова с»', strip.indexOf('ch-ro-clubno')>=0 && strip.indexOf('ccOrgBringMate')<0);
    CAREER.career.day=ccAddDays(CAREER.career.day, 31); check('через месяц — снова можно', ccRostersStripHTML().indexOf('ccOrgBringMate')>=0); }
}catch(e){ out.fails.push(String(e.stack||e)); }
document.getElementById('__out').textContent='@@B@@'+encodeURIComponent(JSON.stringify(out))+'@@E@@'; }, 500));<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'orgtier-')), tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CH, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--virtual-time-budget=300000', '--dump-dom', 'file:///' + tmp.split(String.fromCharCode(92)).join('/')], { maxBuffer: 1 << 30, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const out = JSON.parse(decodeURIComponent(dom.match(/@@B@@([^@<]*)@@E@@/)[1]));
if (out.fails.length) { console.log(['FAIL ' + JSON.stringify(out.notes)].concat(out.fails).join(String.fromCharCode(10))); process.exit(1); }
console.log('OK уровень клуба в карьере ' + JSON.stringify(out.notes));
