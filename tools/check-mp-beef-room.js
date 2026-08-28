// Биф входит в раздачу дропа своего лобби — значит обязан быть общим.
//
// Его скрин, 28 августа (страница «neeww»): после шести игр открытого раунда
// чужие строки таблицы у двоих совпадают до очка, а своя строка разная (329
// против 333, 42 элима против 44). Так выходит, когда чужие лобби считаются
// одинаково, а своё — нет. Своё лобби раскладывает careerSpotFearOn, а тот
// читает careerBeefHot() — cr.beefs, которое до сегодняшнего дня было личным.
//
// Здесь два измерения: (1) при горячем бифе с ботом из комнаты раскладка
// своего лобби ДРУГАЯ, чем без него, — то есть биф действительно решает
// дроп; (2) 'beefs' едет в командном состоянии, и ccApplyTeamState приносит
// его напарнику.
//
//   node tools/check-mp-beef-room.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
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
  const out = {fails: [], notes: {}, err: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  try {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Beefy', age:19, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:0, region:'EU', ovr:90, role:'roleIGL', attrs:ccRookieAttrs(90,'roleIGL'),
        ageEdge:0, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[], seed:'beef-world', mp:{code:'ABC123', role:'a'},
              spots:{}},
      partners:[]}));
    careerLoad();
    CARD_MODE=true; squadSize=2;
    useLandingSet(careerBrSet());
    const cr=CAREER.career;
    const me=careerCard();
    const you=careerYouTeam([me]); you.isYou=true;
    // Дом — первая коробка острова, чтобы бифу было куда тянуть.
    const home=ALL_LANDING_ZONES[0];
    careerSpotSet(0, ACTIVE_LANDING_SET);      // (индекс, остров)
    const field=[you, ...careerCupField(cr, [me], 50, 'beefroom', false, 0)];
    const bots=field.filter(t=>t!==you);
    const rival=bots[0];
    const face=careerBeefFace(rival);
    out.notes.rival=face && face.handle;
    // Раскладка своего лобби — ровно так, как её делает careerLandingPick.
    const lay=()=>{
      Math.random=careerRng(ccHashStr('beef-night'));   // один и тот же вечер
      careerSpotFearOn(you);
      out.notes.homes=careerSpotZones(ACTIVE_LANDING_SET).length; out.notes.beefZones=CC_BEEF_ZONES?CC_BEEF_ZONES.size:null; out.notes.beefSet=CC_BEEF_SET?[...CC_BEEF_SET]:null;
      const g=buildBotLandingAssignment(bots).zoneGroups;
      careerSpotFearOff();
      let at=null; g.forEach((list,z)=>{ if(list.indexOf(rival)>=0) at=ALL_LANDING_ZONES.indexOf(z); });
      return at;
    };
    cr.beefs=[];
    const cold=lay();
    cr.beefs=[{h:face.handle, w:0, l:2, met:3, since:careerToday(), last:careerToday(), hot:true}];
    const hot=lay();
    out.notes.zone={cold:cold, hot:hot, home:ALL_LANDING_ZONES.indexOf(home)};
    check('биф решает дроп соперника (иначе ключ незачем)', cold!==hot || hot===out.notes.zone.home,
          'без бифа коробка '+cold+', с бифом '+hot);
    check('с бифом соперник падает на дом', hot===out.notes.zone.home, 'упал в '+hot+', дом '+out.notes.zone.home);
    // И это едет по проводу.
    check("'beefs' — командный ключ", CC_TEAM_KEYS.indexOf('beefs')>=0, CC_TEAM_KEYS.join(','));
    const wire=ccTeamState();
    check('биф в состоянии команды', Array.isArray(wire.beefs) && wire.beefs.length===1 && wire.beefs[0].h===face.handle);
    cr.beefs=[];
    ccApplyTeamState(wire);
    check('и приезжает напарнику', cr.beefs.length===1 && cr.beefs[0].hot===true);
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccbeef-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(String.fromCharCode(92)).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=120000', '--dump-dom',
  'file:///' + tmp.split(String.fromCharCode(92)).join('/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out.notes));
if (out.err) { console.error('ERR: ' + out.err); process.exit(1); }
out.fails.forEach(f => console.log(' FAIL ' + f));
if (out.fails.length) process.exit(1);
console.log('биф решает дроп своего лобби и едет по проводу');
