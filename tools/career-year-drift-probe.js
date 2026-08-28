// Куда уезжают рейтинги сцены ЗА ГОД карьеры, а не за сорок вечеров одной комнаты.
//
// Его слово, 27 августа: «за год карьеры упал рейтинг у всех», со скрином
// списка сцены, где верх — 94/94/93. И то же самое 25 августа на странице
// «фикшу баги»: «упал рейтинг за год на 6, не должно такого быть, почему они
// вообще падают».
//
// career-scene-drift-probe меряет 40 вечеров ОДНОЙ комнаты Дивизиона 1 и
// показывает почти ноль. Год — это другое: кубки, мейджоры, опены на тысячи
// команд, ЛАНы, и careerGrowField зовётся с полем каждого из них. Здесь год
// перематывается по-настоящему (careerFastForward), а до и после снимается
// рейтинг одних и тех же людей сцены.
//
// Печатается то, что видит он: верх списка, среднее по сцене и худшие сдвиги.
//
//   node tools/career-year-drift-probe.js [дней]

const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const DAYS = +(process.argv[2] || 365);
const CHROME = [process.env.CHROME,
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
(async function(){
  const out={errs:null, err:null, played:0, from:null, to:null, rows:[], summary:null};
  try{
    const days=careerYearDays();
    let day=null;
    for(let d=CC_YEAR_FROM; d<=CC_YEAR_TO; d=ccAddDays(d,1))
      if((days.get(d)||[]).some(e=>e.kind==='cup')){ day=d; break; }
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Drift', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:day, division:1, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    if(!careerPartnerCard()){
      careerSeatTopUp();
      const s=careerDms().find(x=>x.state==='offer' && !x.who.org && !x.who.brand);
      if(s) careerDmAccept(s.id);
    }

    /* Рейтинг человека сцены так, как его показывает список: базовая карточка
       плюс книга роста этой карьеры (careerDevOf). Берём ИМЕННО книгу, потому
       что PLAYERS карьера не переписывает. */
    const roster=ccSceneRoster(ccCareerRegion()).filter(c=>c && c.handle);
    const ovrOf=c=>{ const a=attrsFor(c)||{}; return (c._ovr!=null?c._ovr:a.ovr)||0; };
    const before=new Map();
    roster.forEach(c=>{ const v=ovrOf(c); if(v>0) before.set(hKey(c), {h:c.handle, was:v}); });

    /* Напарник и свой игрок — рядом со сценой, на том же году.

       Его вопрос, 27 августа: «чет тимейт быстро растет, игроки так же все?»,
       со снимком: он 97, напарник 99 почти во всех статах. Сцену и напарника
       двигают РАЗНЫЕ функции (careerGrowField и careerMateGrow), поэтому
       сравнивать их надо на одном прогоне, а не по памяти. */
    const mateOvr=()=>{ const c=careerPartnerCard(); if(!c) return null;
                        const a=attrsFor(c)||{}; return Math.round(c._ovr!=null?c._ovr:a.ovr); };
    out.mate={было:mateOvr(), запись:0};
    out.me={было:CAREER.player.ovr};

    const realDigest=careerFfDigest;
    let caught=null;
    careerFfDigest=function(ff){ caught=ff; };
    out.from=careerToday();
    await careerFastForward(${DAYS});
    careerFfDigest=realDigest;
    out.to=careerToday();
    out.played=(caught && caught.played && caught.played.length)||0;
    out.err=(caught && caught.err)||null;

    // После года книга роста уже стоит — сдвиг читаем прямо из неё.
    const rows=[];
    before.forEach((v,k)=>{ rows.push({h:v.h, was:Math.round(v.was*10)/10,
                                       d:Math.round((careerDevOf({handle:v.h}))*100)/100}); });
    // Возраст — ради его правки «чем моложе, тем быстрее растёт».
    rows.forEach(r=>{ r.age=ccAgeNow(r.h)||null; });
    const band=r=>r.age==null?'—':r.age<=17?'до 17':r.age<=19?'18-19':r.age<=21?'20-21':r.age<=24?'22-24':r.age<=27?'25-27':'28+';
    const bands={};
    rows.forEach(r=>{ const k=band(r); (bands[k]=bands[k]||[]).push(r.d); });
    out.byAge={};
    Object.keys(bands).forEach(k=>{ const a2=bands[k];
      out.byAge[k]={людей:a2.length, средний:Math.round(a2.reduce((s,v)=>s+v,0)/a2.length*100)/100}; });
    rows.sort((a,b)=>b.was-a.was);
    const moved=rows.filter(r=>r.d!==0);
    const avg=a=>a.length ? Math.round(a.reduce((s,r)=>s+r.d,0)/a.length*100)/100 : 0;
    const top=rows.slice(0, 20), mid=rows.slice(20, 80), low=rows.slice(80);
    const rec=(CAREER.partners||[]).find(x=>careerPartnerCard() && hKey(x.handle)===hKey(careerPartnerCard()));
    out.mate.стало=mateOvr(); out.mate.запись=Math.round(((rec&&rec.dev)||0)*100)/100;
    out.me.стало=CAREER.player.ovr;
    out.summary={
      людейВСцене:rows.length, сдвинулось:moved.length,
      среднееПоСцене:avg(rows), среднееПоДвинувшимся:avg(moved),
      топ20:avg(top), середина:avg(mid), низ:avg(low),
      упало:moved.filter(r=>r.d<0).length, выросло:moved.filter(r=>r.d>0).length
    };
    out.rows={верх:rows.slice(0,10),
              худшие:rows.slice().sort((a,b)=>a.d-b.d).slice(0,8),
              лучшие:rows.slice().sort((a,b)=>b.d-a.d).slice(0,5)};
  }catch(e){ out.err={day:'-', kind:'-', text:String((e&&(e.stack||e.message))||e)}; }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'yeardrift-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=3000000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')],
  {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.errs && out.errs.length) console.error('ошибки страницы: ' + out.errs.slice(0,3).join(' | '));
if (out.err) console.error('перемотка встала: ' + JSON.stringify(out.err).slice(0, 300));
console.log('перемотано: ' + out.from + ' → ' + out.to + ', турниров сыграно: ' + out.played);
console.log(JSON.stringify(out.summary, null, 1));
console.log('по возрастам за год:'); Object.keys(out.byAge||{}).sort().forEach(k=>console.log('  '+k.padEnd(6)+' '+String((out.byAge[k].людей)).padStart(4)+' чел   '+out.byAge[k].средний));
console.log('напарник: ' + (out.mate&&out.mate.было) + ' -> ' + (out.mate&&out.mate.стало) + ', запись ' + (out.mate&&out.mate.запись));
console.log('свой игрок: ' + (out.me&&out.me.было) + ' -> ' + (out.me&&out.me.стало));
console.log('верх списка:'); (out.rows.верх||[]).forEach(r=>console.log('  ' + r.h + ' ' + r.was + '  сдвиг ' + r.d));
console.log('худшие:');     (out.rows.худшие||[]).forEach(r=>console.log('  ' + r.h + ' ' + r.was + '  сдвиг ' + r.d));
console.log('лучшие:');     (out.rows.лучшие||[]).forEach(r=>console.log('  ' + r.h + ' ' + r.was + '  сдвиг ' + r.d));
