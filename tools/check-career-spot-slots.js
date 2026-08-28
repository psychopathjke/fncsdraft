// Дом можно поставить на КАЖДОМ острове, на котором играют.
//
// Баг игрока, 24 августа (страница «bags» в Notion): «when you play your own
// career then after a season you cant pick the spots anymore».
//
// Слотов три — сезонный остров, Релоад 1-2 и Релоад 3-4 (CC_SPOT_SLOTS), — но
// считались они по ВСЕМ ключам cr.spots. А сезонный остров за карьеру меняется
// не раз: дуо-год сам переезжает с m2 на s42 21 августа, трио-год ходит по
// t1/t2/t3, и каждый новый сезон приносит следующий. Дома на островах, на
// которых уже не играют, держали слоты вечно — и на второй сезон окно писало
// «все три уже стоят на других картах», то есть поставить дом было нельзя
// нигде и никогда больше.
//
// Проба занимает все три слота на островах первого сезона, потом переводит
// карьеру на следующий сезон и требует, чтобы дом на НОВОМ острове ставился.
//
//   node tools/check-career-spot-slots.js
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

const HEAD = `<script>
window.__errs=[];
window.addEventListener('error', e=>window.__errs.push(String(e.message)+' @'+e.lineno));
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out={steps:[], fails:[], notes:{}, errs:null, fail:null};
  const check=(n, ok, d)=>{ out.steps.push((ok?'  ok  ':' FAIL ')+n+(d?': '+d:''));
                            if(!ok) out.fails.push(n+(d?': '+d:'')); };
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Spotter', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:3, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    const cr=CAREER.career;

    // Три слота занимаются по-настоящему: сезонный остров и оба острова Релоада.
    const first=careerBrSet();
    out.notes.firstIsland=first;
    check('дом на сезонном острове ставится', careerSpotSet(0, first)===true, first);
    check('дом на Релоаде 1-2 ставится', careerSpotSet(0, 'r1')===true);
    check('дом на Релоаде 3-4 ставится', careerSpotSet(0, 'r3')===true);
    out.notes.usedAfterThree=careerSpotUsed();
    check('заняты все три слота', careerSpotUsed()===CC_SPOT_SLOTS,
          String(careerSpotUsed()));

    /* Сезон вперёд — тем же путём, каким его проходит игрок. Остров сезона
       после этого другой: дуо-год едет на s42 после 21 августа, трио-год — на
       свои t-острова. */
    careerNewSeason ? careerNewSeason() : null;
    const next=careerBrSet();
    out.notes.nextIsland=next;
    out.notes.season=cr.season;
    check('сезон сменился', cr.season>1, String(cr.season));

    // Главное: на острове НОВОГО сезона место под дом есть.
    if(next!==first){
      check('на новом острове есть место под дом', careerSpotRoom(next)===true,
            'used='+careerSpotUsed()+' islands='+JSON.stringify(Object.keys(careerSpots())));
      check('и дом на нём ставится', careerSpotSet(1, next)===true, next);
      check('дом действительно встал', careerSpotList(next).length>0, next);
    } else {
      // Сезон остался на том же острове — тогда дом там и так стоит, и менять
      // его можно всегда: проверяем это, чтобы проба не молчала.
      check('дом на прежнем острове меняется', careerSpotRoom(next)===true, next);
      out.steps.push('  ..  остров сезона не сменился ('+next+'), проверен обмен на месте');
    }

    // И острова Релоада своих слотов не теряют.
    check('Релоад 1-2 остался домом', careerSpotList('r1').length>0);
    check('Релоад 3-4 остался домом', careerSpotList('r3').length>0);

    /* Его наводка, 24 августа: «в трио же своя карта и тд может из-за этого
       поломалось чет» — и она верная, только острова меняются ещё чаще, чем
       раз в сезон. Трио-год ходит по t1/t2/t3 ПО ДАТАМ внутри одного сезона
       (CC_TRIO_ISLANDS), а дуо-год переезжает с m2 на s42 21 августа. То есть
       за две карьеры островов набирается пять-шесть при трёх слотах.
       Проверяем прямо: на каждом острове года дом должен ставиться. */
    if(careerSquadSize()===3){
      const walk=[['2026-02-02','t1'], ['2026-05-02','t2'], ['2026-07-02','t3']];
      walk.forEach(([day, want])=>{
        cr.day=day;
        const set=careerBrSet();
        check('трио-год, '+day+' — остров '+want, set===want, set);
        check('на нём есть место под дом', careerSpotRoom(set)===true,
              set+' used='+careerSpotUsed());
        check('и дом ставится', careerSpotSet(2, set)===true, set);
      });
      out.notes.trioIslands=Object.keys(careerSpots());
    }

    /* Отдельно — прямой случай из жалобы: дома на островах, на которых больше
       не играют, не должны занимать слоты. Подсаживаем два таких вручную. */
    const spots=careerSpots();
    spots['t1']=[{i:0, aura:3, won:1, day:'2026-03-01'}];
    spots['m1']=[{i:0, aura:1, won:0, day:'2026-03-02'}];
    check('чужие острова слотов не занимают', careerSpotUsed()<=CC_SPOT_SLOTS,
          'used='+careerSpotUsed()+' islands='+Object.keys(spots).join(','));
  }catch(e){ out.fail=String(e && e.stack || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccslots-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=300000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:256*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('проба ничего не вернула'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log(s));
console.log('  ' + JSON.stringify(out.notes));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
if ((out.errs || []).length) console.error('page errors: ' + out.errs.join(' | '));
if (out.fails.length) { console.error('красных: ' + out.fails.length); process.exit(1); }
console.log('дом ставится на каждом острове, на котором играют');
