// Сильные имена 2024-го сидят в комнате и сидят с напарником — в КАЖДОМ сезоне.
//
// Его слово 24 сентября, страница «2610»: «в третьем сезоне 2024 года swizzy,
// vanyak, ping, wox без тиммейтов и не играют турниры вообще», и рядом — как
// должно быть: «в первом сезоне малич с ваняком играет, а мерстач с янизом».
//
// Сообщение написано до того, как уехала правка 25 сентября (ccRestPairs), и
// на текущей сборке не воспроизводится. Но проба нужна по двум причинам.
//
// Первая — сам отчёт: человек пропадает из вечера молча, никакой ошибки при
// этом не видно, и заметить это можно только глазами по именам.
//
// Вторая — моя же правка: ccRestPairs впускает пару ТОЛЬКО ЦЕЛИКОМ и
// пропускает её, если одна половина уже занята. Это ровно тот механизм,
// которым человека можно потерять, и он должен быть под присмотром.
//
//   node tools/check-career-2024-seats.js
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
  // Названные им поимённо — и ещё двое, о которых он писал как о правильных.
  /* Ники в ростере встречаются с хвостами и пробелами, поэтому сравнение идёт
     по нормализованному НАЧАЛУ, а не точным равенством: точное сравнение эту
     же пробу и покраснило на ровном месте. «ping» у него — это Pingu. */
  const WANT=['swizzy','vanyak3kk','pingu','wox','malibuca','merstach'];
  const norm=h=>String(h||'').trim().toLowerCase();
  try{
    const run=(season, day)=>{
      localStorage.setItem('fncsdraft_career', JSON.stringify({
        v:1, player:{nick:'Seats', age:20, source:'rookie', country:'de', countryPing:15,
          closeRangeEdge:6, region:'EU', ovr:96, role:'roleIGL', attrs:null, ageEdge:4,
          photo:null, handle:null, cardRegion:null, nat:null},
        career:{season:season, size:2, year:2024, year0:2024, day:day, division:1,
                earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'seats'},
        partner:{card:card('M1',88), patience:60, since:'2024-01-01', dev:0},
        partners:[{card:card('M1',88), patience:60, since:'2024-01-01', dev:0}]}));
      const s=JSON.parse(localStorage.getItem('fncsdraft_career'));
      s.player.attrs=ccRookieAttrs(96,'roleIGL');
      localStorage.setItem('fncsdraft_career', JSON.stringify(s));
      careerEntry();
      const cr=CAREER.career, me=careerCard(), mates=careerMates().filter(Boolean);
      const f=careerCupField(cr, [me].concat(mates), 400, null, true, 0);
      const seen=new Map(); let реальных=0; let одиночки=0;
      (f||[]).forEach(t=>{
        const sq=(t.squad||[]).filter(Boolean);
        if(sq.length===1) одиночки++;
        sq.forEach(c=>{
          if(c.tier!=='ladder') реальных++;
          const h=norm(c.handle);
          WANT.forEach(w=>{ if(h===w || h.indexOf(w)===0)
            seen.set(w, (c.handle+' + '+(sq.filter(x=>x!==c).map(x=>x.handle).join('+')||'ОДИН'))); });
        });
      });
      return {команд:(f||[]).length, реальных:реальных, одиночки:одиночки,
              состав:Array.from(seen.entries()).map(([k,v])=>k+' → '+v),
              пропали:WANT.filter(w=>!seen.has(w)),
              безНапарника:Array.from(seen.entries()).filter(([,v])=>v.indexOf('+ ОДИН')>=0).map(([k])=>k)};
    };
    const R={};
    [[1,'2024-02-15'],[2,'2024-05-15'],[3,'2024-09-15']].forEach(function(p){
      const r=run(p[0], p[1]);
      R['сезон'+p[0]]=r;
      /* Кто именно приехал в конкретный вечер — дело явки и сида мира, и
         требовать поимённого присутствия было бы неправдой: та же проба на
         другом сиде находит и Vanyak, и Merstach там, где на этом сиде их нет.
         Меряется другое: кто ПРИЕХАЛ, тот приехал с напарником. Человек без
         пары в комнате — это и есть то, о чём он писал. */
      check('сезон '+p[0]+': кто приехал, тот с напарником',
            r.безНапарника.length===0, JSON.stringify(r));
      check('сезон '+p[0]+': и хоть кто-то из названных приехал',
            r.состав.length>0, JSON.stringify(r));
      /* И комната не худеет от сезона к сезону: ccRestPairs впускает пару
         только целиком, и если половины начнут массово оказываться занятыми,
         настоящих в зале станет меньше — это видно числом, а не глазами. */
      check('сезон '+p[0]+': настоящих в комнате не меньше семисот',
            r.реальных>=700, JSON.stringify({реальных:r.реальных}));
      check('сезон '+p[0]+': нет команд из одного человека',
            r.одиночки===0, JSON.stringify({одиночки:r.одиночки}));
    });
    out.notes=R;
    const n=[R['сезон1'].реальных, R['сезон2'].реальных, R['сезон3'].реальных];
    check('от сезона к сезону зал не худеет',
          Math.max.apply(null,n)-Math.min.apply(null,n) <= 40, JSON.stringify(n));
    check('без ошибок JS', out.errs.length===0, out.errs.slice(0,3).join(' | '));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccseat-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(SL).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const html = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.split(SL).join('/')], { maxBuffer: 1 << 28, timeout: 1500000 }).toString();
const m = /PBEGIN(.*?)PEND/.exec(html);
if (!m) { console.log('FAIL: no result'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out.notes));
if (out.errs && out.errs.length) out.errs.slice(0, 5).forEach(e => console.log('JSERR ' + e.slice(0, 300)));
if (out.err) { console.log('ERR ' + out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
console.log('OK check-career-2024-seats');
