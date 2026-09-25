// Титул что-то значит, когда ты зовёшь человека к себе.
//
// Слова его игрока 25 сентября: «won ewc and still stuck with teammates that
// have rating 80 im rating 93».
//
// Тяга при уговорах (careerDmMargin) читала ровно ОДНУ строку журнала —
// последнюю, и только если она этого сезона: топ-3 стоит +3, проход +2. То
// есть победа на лане жила до ближайшего вторника: сыграл недельный кубок,
// она перестала быть последней, и её не стало. Замер до правки, карьера 93 в
// дивизионе 1, трио: 96-го зовёт с запасом 0 — монетка, ровно как до победы.
//
// Репутация это не лечит и не должна: её собственное правило говорит, что она
// про поведение, а не про результаты.
//
// Теперь к тяге идёт лучший КРУПНЫЙ результат (CC_BIG_RUNS: финал мейджора,
// Саммит, Reload Championship, GC Last Chance, глобалы) за этот сезон и
// прошлый. Берётся лучшее, а не сумма, и недельные кубки не в счёт.
//
//   node tools/check-career-crown.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');
const SL = String.fromCharCode(92);
const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out={fails:[], notes:{}, errs:[], err:null};
  window.addEventListener('error', e=>out.errs.push(String(e.message)+' @'+e.lineno));
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  const card=(h,o)=>({handle:h, region:'EU', rating:o, _ovr:o, nat:'de', tier:'ladder',
                      event:'ladder', placement:null, rarity:'common', partner:null});
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Crown', age:21, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:93, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:2, size:3, year:2026, year0:2025, day:'2026-08-20', division:1,
              earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'crown'},
      partner:{card:card('M80a',80), patience:60, since:'2025-11-01', dev:0},
      partners:[{card:card('M80a',80), patience:60, since:'2025-11-01', dev:0},
                {card:card('M80b',80), patience:60, since:'2025-11-01', dev:0}]}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs=ccRookieAttrs(93,'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerEntry();

    /* Один и тот же человек из инбокса, чтобы сравнивать было с чем: берём
       самого сильного, до кого дотянуться тяжелее всего. */
    const best=()=>{ const p=(careerDmPool()||[]).slice()
        .sort((a,b)=>(b.ovr||0)-(a.ovr||0))[0]; return p||null; };
    const who=best();
    check('в инбоксе есть кто-то сильнее меня', !!who && who.ovr>CAREER.player.ovr,
          who ? (who.handle+' '+who.ovr) : 'пусто');
    const mOf=()=>Math.round(careerDmMargin(who)*100)/100;

    CAREER.career.log=[];
    const без=mOf();

    // Недельный кубок выигран — крупным он не считается и тягу дать не должен.
    CAREER.career.log=[{season:2, day:'2026-08-18', kind:'cup', place:1, of:33, passed:true}];
    const кубок=mOf();

    // Саммит выигран — вот это и есть EWC.
    CAREER.career.log=[{season:2, day:'2026-07-10', kind:'summit', stage:'final', place:1, of:50, passed:true},
                       {season:2, day:'2026-08-18', kind:'cup',    place:14, of:33, passed:false}];
    const титул=mOf();

    // Он же, но в прошлом сезоне — осенний титул обязан значить что-то зимой.
    CAREER.career.log=[{season:1, day:'2025-07-10', kind:'summit', stage:'final', place:1, of:50, passed:true},
                       {season:2, day:'2026-08-18', kind:'cup',    place:14, of:33, passed:false}];
    const прошлый=mOf();

    // Позапрошлый — уже нет.
    CAREER.career.log=[{season:0, day:'2024-07-10', kind:'summit', stage:'final', place:1, of:50, passed:true},
                       {season:2, day:'2026-08-18', kind:'cup',    place:14, of:33, passed:false}];
    const давний=mOf();

    // Подиум там же — меньше титула, но больше нуля.
    CAREER.career.log=[{season:2, day:'2026-07-10', kind:'summit', stage:'final', place:3, of:50, passed:true},
                       {season:2, day:'2026-08-18', kind:'cup',    place:14, of:33, passed:false}];
    const подиум=mOf();

    // Три финала подряд не складываются: берётся лучшее.
    CAREER.career.log=[{season:2, day:'2026-05-10', kind:'major',  stage:'final', place:1, of:50, passed:true},
                       {season:2, day:'2026-06-10', kind:'globals',               place:1, of:50, passed:true},
                       {season:2, day:'2026-07-10', kind:'summit', stage:'final', place:1, of:50, passed:true},
                       {season:2, day:'2026-08-18', kind:'cup',    place:14, of:33, passed:false}];
    const трижды=mOf();

    out.notes.запас={без:без, недельныйКубок:кубок, титул:титул, прошлыйСезон:прошлый,
                     позапрошлый:давний, подиум:подиум, триТитула:трижды, кого:who&&who.handle,
                     егоОвер:who&&who.ovr, мой:Math.round(CAREER.player.ovr)};

    check('победа на лане поднимает тягу', титул>без+3, JSON.stringify(out.notes.запас));
    check('недельный кубок крупным не считается', кубок<титул, JSON.stringify(out.notes.запас));
    check('титул прошлого сезона ещё считается', прошлый===титул, JSON.stringify(out.notes.запас));
    check('позапрошлого — уже нет', давний<титул, JSON.stringify(out.notes.запас));
    check('подиум меньше титула, но больше пустого', подиум<титул && подиум>давний,
          JSON.stringify(out.notes.запас));
    check('три титула не складываются', трижды===титул, JSON.stringify(out.notes.запас));
    check('и 96-го теперь зовут не монеткой', титул>0, JSON.stringify(out.notes.запас));
    check('без ошибок JS', out.errs.length===0, out.errs.slice(0,3).join(' | '));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cccrown-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(SL).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const html = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=300000', '--dump-dom',
  'file:///' + tmp.split(SL).join('/')], { maxBuffer: 1 << 28, timeout: 900000 }).toString();
const m = /PBEGIN(.*?)PEND/.exec(html);
if (!m) { console.log('FAIL: no result'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out.notes));
if (out.errs && out.errs.length) out.errs.slice(0, 5).forEach(e => console.log('JSERR ' + e.slice(0, 300)));
if (out.err) { console.log('ERR ' + out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
console.log('OK check-career-crown');
