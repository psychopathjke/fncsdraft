// Стиль игры (кейить/обычно/спокойно) действует на каждую игру карьеры, а не только
// там, где спрашивают высадку. 5.10, игрок: «it only lets me do that in FNCS».
//
//   node tools/check-career-style-every.js
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
(async function(){
  const out={steps:[], fails:[], errs:null};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Keyer', age:18, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:80, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:2, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[], playStyle:'key'},
      partner:null}));
    careerEntry();
    LANG='ru'; CC_L_CACHE={};
    const cr=CAREER.career;
    useLandingSet(careerBrSet());
    const me=careerCard();
    const field=careerCupField(cr, [me], 50).slice(0, 49);
    const you=careerYouTeam([me]); you.isYou=true; field.push(you);
    skipAnimation=true; CC_SKIP_RUN=true; show('screen-results');
    check('своя команда в поле', !!you);
    CAREER_RUN=true;
    const k0=cr.keyGames||0;
    // Игра БЕЗ вопроса высадки — как первый раунд капа (раздача).
    await simulateGamesLive(field, 1, victoryR1Points, 1, 'stage', 0, null, null, {stageName:'probe'});
    check('кейить ставится и без вопроса высадки', you._seekMul===CC_KEY_SEEK && you._keyLoot>0, you._seekMul+'/'+you._keyLoot);
    check('игра засчитана в набитую руку', (cr.keyGames||0)===k0+1, k0+'→'+cr.keyGames);
    cr.playStyle='chill';
    await simulateGamesLive(field, 1, victoryR1Points, 1, 'stage', 0, null, null, {stageName:'probe'});
    check('спокойно — свой множитель', you._seekMul===CC_CHILL_SEEK, you._seekMul);
    CAREER_RUN=false;
    // Переключатель у «Играть» на Центре.
    const html=ccPlayStyleHTML();
    check('переключатель собирается', /cc-style/.test(html) && /data-st="key"/.test(html));
    out.steps.push('кейить без вопроса высадки: seek '+CC_KEY_SEEK+', рука '+k0+'→'+(k0+1));
  }catch(e){ out.fails.push('исключение: '+String(e && e.stack || e).slice(0,300)); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BE'+'GIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccstyle-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=240000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
const m = dom.match(/BEGIN((?:%[0-9A-Fa-f]{2}|[A-Za-z0-9!'()*\-._~])*)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if (out.errs && out.errs.length) { console.error('page errors: ' + out.errs.slice(0, 5).join(' | ')); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.error('FAILED: ' + f)); process.exit(1); }
console.log('play style applies to every career game, not only to drop-question ones');
fs.rmSync(dir, { recursive: true, force: true });
