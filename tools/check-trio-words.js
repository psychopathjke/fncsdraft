// В трио-сезоне сцена не говорит «дуо».
//
// Его скрин, 24 августа: под постом в трио-сезоне комментарий профи «пиши если
// будешь искать дуо» — и подпись «опять в трио про дуо пишут». Механика для
// этого есть с 20 августа (ccSquadKey: ключ с `t` на конце читается, когда
// сезон в трио), но часть строк её мимо: банк комментариев брался как
// L().ccCoPro напрямую, подзаголовок события дня собирался ключом руками,
// список друзей и строка про ушедшего напарника — тоже.
//
// Проверка ходит по строкам, которые сцена говорит ИГРОКУ, и требует, чтобы в
// трио-сезоне в них не было слова «дуо» ни на одном из трёх языков. Плюс живой
// прогон: настоящий комментарий профи под настоящим постом.
//
//   node tools/check-trio-words.js
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
  const DUO=/дуо|\\bduo\\b/i;
  try{
    /* Карьера в трио-сезоне. Второй сезон карьеры — трио-год (нечётные годы
       дуо, чётные трио, см. careerNewSeason), поэтому сезон переводится тем же
       путём, каким его проходит игрок. */
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Trio', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:3, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    careerNewSeason();
    out.notes.squad=careerSquadSize();
    check('сезон в трио', careerSquadSize()===3, String(careerSquadSize()));

    /* Строки, которые сцена говорит игроку про состав. Список именной: ключей
       со словом «дуо» в файле шесть десятков, и половина из них — про
       настоящий FNCS, который и правда играется дуо (описания режимов,
       ачивки, заголовки этапов Мейджора). Здесь только карьерные. */
    const KEYS=['ccCoPro','ccPostDuoSplitBy','ccNewsPartnerLeft','ccFriendsNone',
                'ccDayEvscrimupSub','ccLfdTitle','ccNewsLfd','ccNewsDropped',
                'ccNewsMateLeftFor','ccDuoFree','ccDuoWith','dmAsk','dmTakeIt',
                'dmAskBtn','dmNoDuo','dmPromoted','dmNoPartner','tlDuo','tlDuoPoached'];
    const say=(lang, key)=>{
      setLang(lang);
      const v=L()[ccSquadKey(key)];
      if(typeof v==='function'){
        try{ return String(v('X','Y','Z')); }catch(e){ return String(v('X')); }
      }
      if(Array.isArray(v)) return v.join(' | ');
      return String(v==null?'':v);
    };
    ['ru','en','fr'].forEach(lang=>{
      KEYS.forEach(k=>{
        const t=say(lang, k);
        if(!t) return;                       // ключа в этом языке нет — не наше дело
        check(lang+' · '+k+' без «дуо»', !DUO.test(t), t.slice(0,70));
      });
    });
    setLang('ru');

    /* И живьём: комментарий профи под постом. Кивок профи ставится руками —
       он приходит от результата вечера, а вечер тут не играется. */
    const cr=CAREER.career;
    cr.nod={day:careerToday(), who:'SomePro'};
    const n={id:'p1', k:'ccNewsCup', day:careerToday(), a:[3, 50]};
    const html=ccPostComments(n, {you:true}, {replies:4});
    out.notes.comments=String(html).replace(/<[^>]*>/g,' ').replace(/\\s+/g,' ').slice(0,160);
    check('комментарии под постом без «дуо»', !DUO.test(String(html)), out.notes.comments);
    check('и комментарии вообще есть', String(html).length>0);

    /* Контроль: в ДУО-сезоне те же строки говорят «дуо» — иначе проверка
       measures nothing и была бы зелёной на любом тексте. */
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Duo', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:3, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    check('контроль: сезон в дуо', careerSquadSize()===2, String(careerSquadSize()));
    const duoLine=say('ru','ccCoPro');
    setLang('ru');
    check('контроль: в дуо-сезоне про дуо и пишут', DUO.test(duoLine), duoLine.slice(0,70));
  }catch(e){ out.fail=String(e && e.stack || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cctrio-'));
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
out.steps.filter(s => s.startsWith(' FAIL')).forEach(s => console.log(s));
console.log('  проверок: ' + out.steps.length + ', красных: ' + out.fails.length);
console.log('  ' + JSON.stringify(out.notes));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
if ((out.errs || []).length) console.error('page errors: ' + out.errs.join(' | '));
if (out.fails.length) process.exit(1);
console.log('в трио-сезоне сцена говорит про трио');
