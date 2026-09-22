// Вкладка пишет в свой слот, даже если другая вкладка переставила указатель активного слота.
//
// Его случай 22.09: хозяин гонки открыл свою же ссылку приглашения во второй вкладке того же
// браузера и завёл карьеру в другом слоте; первая вкладка со следующим сохранением писала свою
// карьеру в чужой слот — «пропадает кнопка race у главы лобби».
//
//   node tools/check-career-slot-tab.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
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
  const out={fails:[], notes:{}, err:null};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  try{
    localStorage.setItem('fncsdraft_career_active', '1');
    localStorage.setItem('fncsdraft_career', JSON.stringify({v:1, player:{nick:'Host', age:19, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6, region:'EU', ovr:90, role:'roleIGL', attrs:null, ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], race:{code:'HOST01', role:'a', since:'2026-02-02'}}, partners:[]}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career')); s.player.attrs=ccRookieAttrs(90,'roleIGL'); localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerLoad();
    check('вкладка запомнила слот 1', CC_SLOT_TAB===1, String(CC_SLOT_TAB));
    // Другая вкладка переставила указатель на слот 2 и завела там свою карьеру.
    localStorage.setItem('fncsdraft_career_active', '2');
    localStorage.setItem('fncsdraft_career_s2', JSON.stringify({v:1, player:{nick:'Guest'}, career:{season:1, day:'2026-02-02', division:3, log:[], news:[]}, partners:[]}));
    CAREER.career.balance=777;
    careerSave();
    const s1=JSON.parse(localStorage.getItem('fncsdraft_career')), s2=JSON.parse(localStorage.getItem('fncsdraft_career_s2'));
    check('своё сохранение легло в слот 1', s1 && s1.player.nick==='Host' && s1.career.balance===777 && s1.career.race && s1.career.race.code==='HOST01', JSON.stringify(s1 && {nick:s1.player.nick, bal:s1.career.balance, race:s1.career.race}));
    check('слот 2 другой вкладки не тронут', s2 && s2.player.nick==='Guest' && s2.career.division===3, JSON.stringify(s2 && s2.player));
    check('карьера в памяти всё ещё с гонкой', !!(CAREER.career.race && CAREER.career.race.code==='HOST01'));
    // Сама вкладка выбрала слот 2 — теперь пишет туда.
    ccSlotUse(2); careerLoad();
    check('после своего выбора слот 2', CC_SLOT_TAB===2 && CAREER.player.nick==='Guest', String(CC_SLOT_TAB)+' '+CAREER.player.nick);
    // Адрес в лобби — свой на слот: две карьеры одного браузера не сливаются в одного человека.
    const id2=ccMpId(); ccSlotUse(1); careerLoad(); const id1=ccMpId();
    check('у слотов разные адреса в лобби', id1 && id2 && id1!==id2 && localStorage.getItem('fncsdraft_mp_id')===id1 && localStorage.getItem('fncsdraft_mp_id_s2')===id2, id1+' / '+id2);
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'slottab-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(SL).join('/') + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const html = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--virtual-time-budget=30000', '--dump-dom',
  'file:///' + tmp.split(SL).join('/')], { maxBuffer: 1 << 28 }).toString();
const m = /PBEGIN(.*?)PEND/.exec(html);
if (!m) { console.log('FAIL: no result'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.log('ERR ' + out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
console.log('OK check-career-slot-tab');
