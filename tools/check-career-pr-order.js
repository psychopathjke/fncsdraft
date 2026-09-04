// Power Ranking: место решает, вес решает, потолок никого не склеивает.
//
// Отчёт игрока 1 сентября 2026: «me and my friend made a duo carreer and we
// have same pr even if there are solo cups». Замер двумя клиентами показал, что
// одинаковый ПР был не у них двоих, а у всей верхушки лобби: обрезка о
// потолок склеивал первые 54 места из 100 в тяжёлых событиях дивизиона 1.
// Со 2 сентября модели Epic здесь нет вовсе: таблица мест и множители событий
// сняты с самого Tracker (12 422 результата, 100 профилей), потолка нет.
//
// Что проверяется — ровно то, что тогда сломалось:
//   * наверху каждое следующее место рейтингуется строго ниже, и нигде не выше;
//   * при одном месте и дивизионе тяжёлое событие стоит СТРОГО выше лёгкого;
//   * даже последнее место в самом простом событии что-то добавляет;
//   * дивизион ниже стоит дешевле при прочих равных.
//
//   node tools/check-career-pr-order.js
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
window.__errs = [];
window.addEventListener('error', function(e){ window.__errs.push(String(e.message) + ' @' + e.lineno); });
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out = {steps: [], errs: null, fail: null};
  const fail = m => { out.fail = m; throw new Error(m); };
  try{
    // ccEventPR читает careerToday/season только через decay, которого здесь нет,
    // но CAREER должен существовать — заводим пустую карьеру.
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'PR', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:90, role:'roleIGL', attrs:null, ageEdge:4},
      career:{season:1, day:'2026-04-25', division:1, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();

    const KINDS=[['cup',''],['victory',''],['eval',''],['final',''],['reload','open'],
                 ['reload','final'],['rc',''],['major','playin'],['major','heats'],
                 ['major','final'],['summit','upper'],['summit','final'],
                 ['globals',''],['gclc',''],['solo','qual'],['solo','final']];
    const OF=100;
    const at=(place,kind,stage,div)=>ccEventPR({place:place, of:OF, kind:kind, stage:stage, div:div});

    // ---- место решает -----------------------------------------------------
    /* Два разных требования, и оба нужны.

       НАВЕРХУ — строго: каждое из первых двадцати пяти мест бьёт следующее.
       Там живёт вся жалоба игрока («кто лучше заплейсил соло, у того пр
       больше»), и там ступени обязаны быть видимыми.

       ВНИЗУ — не строго, но и не вверх: кривая гладкая, а очки целые, поэтому
       93-е и 94-е из ста законно совпадают. Требуется невозрастание и то, что
       на десять мест разница всё-таки набегает. У самого Tracker то же самое:
       десять тысяч мест не разложить по целым между пятёркой и тысячей. */
    let flat=0, worst=null, up=0, slow=0;
    KINDS.forEach(function(k){
      [1,3,5].forEach(function(div){
        for(let p=1;p<OF;p++){
          const a=at(p,k[0],k[1],div), b=at(p+1,k[0],k[1],div);
          if(b>a){ up++; if(!worst) worst=k[0]+'/'+(k[1]||'-')+' div'+div+': '+p+' -> '+a+', '+(p+1)+' -> '+b; }
          if(p<25 && !(a>b)){ flat++; if(!worst) worst=k[0]+'/'+(k[1]||'-')+' div'+div+': '+p+' -> '+a+', '+(p+1)+' -> '+b; }
        }
        for(let p=1;p+10<=OF;p++) if(!(at(p,k[0],k[1],div)>at(p+10,k[0],k[1],div))) slow++;
      });
    });
    if(up) fail(up+' places rate ABOVE the one in front of them — '+worst);
    if(flat) fail(flat+' pairs inside the top 25 rate the same — '+worst);
    if(slow) fail(slow+' places do not beat the one ten below them');
    out.steps.push('the top 25 separate place by place, and ten places apart always separate, in '+
                   KINDS.length+' event kinds and 3 divisions');

    // ---- накопительно, а не среднее --------------------------------------
    // Потолка в модели Tracker нет вовсе, зато есть обещание, ради которого её
    // и взяли: сыгранное только добавляет. Проверяется на самом слабом
    // результате, какой бывает.
    const weak=ccEventPR({place:OF, of:OF, kind:'cup', stage:'', div:5});
    if(!(weak>0)) fail('the last place in the plainest event is worth '+weak+' — playing has to add something');
    out.steps.push('even last place in the plainest event adds '+weak+' points');

    // ---- вес решает -------------------------------------------------------
    const w=(kind,stage)=>ccPrMult({kind:kind, stage:stage, div:1});
    /* Пары, измеренные у Tracker и упорядоченные СТРОГО. Финал Саммита с
       гранд-финалом Мейджора сюда не берутся: у них обоих ×10, это площадка
       наверху таблицы, а не ошибка. */
    const heavier=[[['globals',''],['rc','']],
                   [['major','final'],['major','heats']],
                   [['rc',''],['reload','final']],
                   [['major','heats'],['major','playin']],
                   [['final',''],['cup','']],
                   [['reload','final'],['reload','open']]];
    heavier.forEach(function(pair){
      const A=pair[0], B=pair[1];
      if(!(w(A[0],A[1])>w(B[0],B[1]))) fail('the weights themselves disagree: '+A[0]+' vs '+B[0]);
      [1,25,50,100].forEach(function(p){
        // Вес сравнивается на одном поле — дивизион держим первым для всех.
        const a=at(p,A[0],A[1],1), b=at(p,B[0],B[1],1);
        if(!(a>b)) fail('at place '+p+' the heavier '+A[0]+' ('+a+') does not beat '+B[0]+' ('+b+')');
      });
    });
    out.steps.push('a heavier event outranks a lighter one at every place');

    // ---- дивизион ниже стоит дешевле --------------------------------------
    [1,50,100].forEach(function(p){
      const d1=at(p,'cup','',1), d3=at(p,'cup','',3), d5=at(p,'cup','',5);
      if(!(d1>d3 && d3>d5)) fail('at place '+p+' the divisions do not step down: '+d1+' / '+d3+' / '+d5);
    });
    out.steps.push('a lower division pays less for the same place');

    out.steps.push('base 1st '+Math.round(ccPrBase(1))+', 100th '+Math.round(ccPrBase(100))+
                   ' · globals 1st '+at(1,'globals','',1)+', 100th '+at(100,'globals','',1)+
                   ' · solo final 1st '+at(1,'solo','final',1)+
                   ' · D1 cup 1st '+at(1,'cup','',1)+' (below the knee, untouched)');
  } catch(e){ if(!out.fail) out.fail = String(e && e.message || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEG'+'IN' + encodeURIComponent(JSON.stringify(out)) + 'E'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccpr-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=120000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if ((out.errs||[]).length) console.error('page errors: ' + out.errs.join(' | '));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
if ((out.errs||[]).length) process.exit(1);
console.log('the Power Ranking orders by place, by weight and by division');
