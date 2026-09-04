// Упавшая плитка не вешает карьеру.
//
// Отзыв его игрока 4 сентября: «sometimes when u click on "next day" the site
// freezes and u have to refresh it». Шаг дня был защищён (CC_DAY_ERR), а
// ОТРИСОВКА после него — нет: день проходил, хаб падал на одной плитке, экран
// оставался вчерашним с мёртвыми кнопками, и помогал только F5.
//
// Проверка ломает отрисовку нарочно и смотрит, что игрок видит ошибку, а не
// зависший экран, и что после починки хаб рисуется снова.
//
//   node tools/check-career-hub-guard.js
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
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({v:1,
      player:{nick:'Guard', age:18, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:6, region:'EU', ovr:88, role:'roleIGL', attrs:null,
              ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-01-07', division:1, earnings:0, balance:1000,
              reach:5000, tokens:[], log:[], news:[]},
      partner:null}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs=ccRookieAttrs(88,'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerEntry();
    const dayWas=careerToday();

    // ---- плитка падает --------------------------------------------------
    const realHonour=careerTopHonour;
    careerTopHonour=function(){ throw new Error('плитка сломалась нарочно'); };
    let threw=false;
    try{ careerRenderHub('centre'); }catch(e){ threw=true; }
    check('отрисовка не бросает наверх', !threw);
    const body=document.getElementById('chBody');
    out.notes.plate=!!(body && body.querySelector('.cc-ffo-err'));
    check('игрок видит, что сломалось', out.notes.plate,
          (body ? body.innerHTML.slice(0, 120) : 'нет тела'));
    check('и текст ошибки в ней есть',
          !!(body && body.textContent.indexOf('плитка сломалась нарочно')>=0));
    check('и есть кнопка обратно',
          !!(body && body.querySelector('button[onclick*="careerRenderHub"]')));
    check('ошибка запомнена', typeof CC_HUB_ERR==='string' && CC_HUB_ERR.length>0);
    /* И её можно ПРИСЛАТЬ. По скриншоту телефона чинить нечего: там одна
       строка без стека и без версии. Кнопка кладёт в буфер сборку, вкладку и
       стек — то, чего не хватало по отзыву «сайт зависает на next day». */
    check('есть кнопка «скопировать ошибку»',
          !!(body && body.querySelector('button[onclick*="ccHubErrCopy"]')));
    check('в буфер уедет стек, а не одна строка',
          typeof CC_HUB_ERR_FULL==='string' && CC_HUB_ERR_FULL.indexOf(CC_BUILD)>=0 &&
          CC_HUB_ERR_FULL.indexOf('плитка сломалась нарочно')>=0,
          String(CC_HUB_ERR_FULL).slice(0, 80));
    check('и версия видна на самой плашке',
          !!(body && body.querySelector('.cc-ffo-build')) &&
          body.textContent.indexOf(CC_BUILD)>=0);

    // ---- и день всё ещё идёт ---------------------------------------------
    careerNextDay();
    check('день прошёл, несмотря на битую плитку', careerToday()!==dayWas,
          careerToday()+' vs '+dayWas);

    // ---- плитку починили — хаб вернулся -----------------------------------
    careerTopHonour=realHonour;
    careerRenderHub('centre');
    check('хаб нарисовался снова', !document.querySelector('#chBody .cc-ffo-err'));
    check('и метка ошибки снята', CC_HUB_ERR===null);

    // ---- упавший ШАГ дня тоже не вешает -----------------------------------
    const realAdvance=careerAdvanceTo;
    careerAdvanceTo=function(){ throw new Error('день сломался нарочно'); };
    let threw2=false;
    try{ careerSkipWeek(); }catch(e){ threw2=true; }
    careerAdvanceTo=realAdvance;
    check('careerSkipWeek не бросает наверх', !threw2);
    check('и говорит, какой день не прошагался',
          !!(CC_DAY_ERR && String(CC_DAY_ERR.text).indexOf('день сломался нарочно')>=0),
          JSON.stringify(CC_DAY_ERR));
    /* И экран после этого живой: тело нарисовано, а красная строка дня стоит
       в панели дня (кнопки «следующий день» на неотработанном дне нет по
       правилу — там стоит «выбери, на что уходит день»). */
    const b2=document.getElementById('chBody');
    check('тело хаба нарисовано', !!(b2 && b2.children.length>0));
    check('и красная строка дня видна',
          !!(b2 && b2.textContent.indexOf('день сломался нарочно')>=0),
          b2 ? b2.textContent.slice(0, 100) : 'нет тела');
  }catch(e){ out.err=String(e&&e.stack||e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hubguard-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=300000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log('  ' + JSON.stringify(out.notes));
if (out.fails.length) { out.fails.forEach(f => console.error('FAILED: ' + f)); process.exit(1); }
console.log('битая плитка показывает ошибку, а не вешает карьеру');
