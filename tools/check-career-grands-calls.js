// «qual grands, land X» — посты после хитов.
//
// Его слово, 5 сентября 2026: «во время хитов в сошиал ещё можно писать qual
// grands land туда, где метка стоит у игрока… также и боты, которые
// квальнулись, могут писать».
//
// Что проверяется (без вечера, на собранной комнате): прошедший игрок пишет
// свой пост с номером зоны, где садился; из прошедших ботов пишут трое
// сильнейших, каждый от своего имени и со своей точкой; не прошедший игрок
// молчит, боты — нет; слово «grands»/«finals» ставит словарь; в записи едет
// НОМЕР зоны (пост переводится вместе с языком, как ccPostDropCall).
//
//   node tools/check-career-grands-calls.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out={fails:[], notes:[], err:null};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({v:1,
      player:{nick:'Caller', age:18, source:'rookie', country:'de', countryPing:15, closeRangeEdge:0,
              region:'EU', ovr:80, role:'roleIGL', attrs:null, ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-04-17', division:1, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[]},
      partners:[]}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs=ccRookieAttrs(80,'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerLoad();
    useLandingSet(careerBrSet());
    const Z=ALL_LANDING_ZONES;
    check('на острове есть зоны', Z.length>=6, String(Z.length));
    const team=(h, pow, z)=>({name:h.toUpperCase(), squad:[{handle:h}], pow:pow, landingZone:Z[z]});
    const you={name:'ME', isYou:true, squad:[{handle:'Caller'}], pow:90, landingZone:Z[4]};
    const bots=[team('alpha',95,1), team('bravo',92,2), team('charlie',88,3), team('delta',70,5)];

    // ---- прошёл: свой пост + три бота ---------------------------------------
    CAREER.career.news=[];
    const n=ccGrandsCalls('grands', you, true, [you].concat(bots));
    const news=CAREER.career.news;
    const mine=news.filter(e=>e.k==='ccPostQualGrands');
    const theirs=news.filter(e=>e.k==='ccPostBotQualGrands');
    out.notes.push('posts: '+n+' → '+news.map(e=>e.k+'['+(e.a||[]).join(',')+']').join(' | '));
    check('свой пост один', mine.length===1, String(mine.length));
    check('в своём посте — номер зоны, где садился', mine[0] && mine[0].a[0]===5, JSON.stringify(mine[0]&&mine[0].a));
    check('и остров под картинку', mine[0] && mine[0].zone===4 && !!mine[0].set, JSON.stringify(mine[0]));
    check('ботов пишут трое', theirs.length===3, String(theirs.length));
    check('и это трое сильнейших, delta молчит', theirs.every(e=>e.a[0]!=='delta'),
          theirs.map(e=>e.a[0]).join(','));
    check('каждый бот — со своей точкой', theirs.every(e=>typeof e.a[1]==='number' && e.a[1]>=1),
          theirs.map(e=>e.a[1]).join(','));
    // Автор: свой — ты, бот — первый аргумент.
    check('свой пост подписан игроком', CC_POST_BY.ccPostQualGrands==='you');
    check('пост бота подписан ботом', CC_POST_BY.ccPostBotQualGrands==='arg0');
    // Текст строится на показе и называет зону — в обоих языках.
    const was=LANG;
    ['ru','en'].forEach(l=>{
      LANG=l; CC_L_CACHE={};
      const t=ccText(mine[0]), tb=ccText(theirs[0]);
      out.notes.push(l+': "'+t+'" / "'+tb+'"');
      check(l+': свой пост называет зону', t.indexOf(ccZoneName(5))>=0, t);
      check(l+': пост бота называет его зону', tb.indexOf(ccZoneName(theirs[0].a[1]))>=0, tb);
      check(l+': в посте бота нет слова duo', !/дуо|\\bduo\\b/i.test(tb), tb);
    });
    LANG=was; CC_L_CACHE={};

    // ---- не прошёл: своего поста нет, боты пишут ----------------------------
    CAREER.career.news=[];
    ccGrandsCalls('grands', you, false, bots);
    check('не прошёл — своего поста нет', !CAREER.career.news.some(e=>e.k==='ccPostQualGrands'));
    check('а прошедшие боты пишут всё равно', CAREER.career.news.filter(e=>e.k==='ccPostBotQualGrands').length===3);

    // ---- соло: слово «финал», а не «гранды» ---------------------------------
    CAREER.career.news=[];
    ccGrandsCalls('finals', you, true, [you]);
    LANG='en'; CC_L_CACHE={};
    const solo=ccText(CAREER.career.news[0]);
    out.notes.push('solo en: "'+solo+'"');
    check('в соло квал — в финал', /FINALS/.test(solo) && !/GRANDS/.test(solo), solo);
    LANG=was; CC_L_CACHE={};

    // ---- без записанной точки — пост без неё, а не «зона 0» -----------------
    CAREER.career.news=[];
    ccGrandsCalls('grands', {name:'X', isYou:true, squad:[{handle:'Caller'}]}, true, []);
    const bare=ccText(CAREER.career.news[0]);
    check('без точки пост короче, но живой', bare.length>5 && bare.indexOf(ccZoneName(0))<0, bare);
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsgrands-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, src + BOOT);
const dom = execFileSync(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
  '--virtual-time-budget=60000', '--dump-dom', 'file:///' + tmp.replace(/\\/g, '/')
], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.notes.forEach(n => console.log('  ' + n));
if (out.err) { console.error('ERROR: ' + out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.error('FAILED: ' + f)); process.exit(1); }
console.log('after the heats the feed says who qualified and where they land');
fs.rmSync(dir, { recursive: true, force: true });
