// Награды сезона: четыре номинации рядом с игроком года. Его слово 10 сентября
// («8 делай»): голосование сцены после Глобалов — игл, фраггер, новичок, дуо.
//
// Проверяется: номинации считаются из того, что карьера пишет (ПР, журнал
// вечеров, пары сцены), тройки с процентами пишутся в награды один раз за сезон,
// пресса пишет про каждую, плитка и слайд церемонии их показывают, новый сезон
// начинает журнал вечеров заново.
//
//   node tools/check-career-awards.js
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
      v:1, player:{nick:'Gala', age:17, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-10-20', division:1, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    LANG='ru'; CC_L_CACHE={};
    const cr=CAREER.career;
    useLandingSet(careerBrSet());
    // ---- сезон, в котором было что судить -------------------------------------
    const me=careerCard();
    const field=careerCupField(cr, [me], 50);
    const you=careerYouTeam([me]); you.isYou=true; you.name='Твой состав: '+me.handle; you.squad=[me];
    const teams=[you].concat(field.slice(0, 39));
    for(let d=0; d<3; d++){
      cr.day=ccAddDays('2026-10-01', d*2);
      teams.forEach((t,i)=>{ t.wins=i<3?1:0; t.stageElims=40-i; t.stagePts=300-i*5; });
      careerPrAdd(teams, {div:1, kind:'cup', stage:null});
    }
    cr.day='2026-10-27'; cr.seasonOver=true;
    const cats=careerAwardCats();
    out.steps.push('номинации: '+Object.keys(cats).map(k=>k+' '+cats[k].length+(cats[k][0]?' ('+cats[k][0].n+' '+cats[k][0].pct+'%)':'')).join(' · '));
    check('игл года посчитан', cats.igl.length>=1 && cats.igl[0].pct>0, JSON.stringify(cats.igl));
    check('фраггер года — по килам журнала', cats.frag.length===3 && cats.frag[0].p>=cats.frag[1].p, JSON.stringify(cats.frag));
    check('дуо года — пара сцены', cats.duo.length>=1 && / & /.test(cats.duo[0].n), JSON.stringify(cats.duo));
    check('доли тройки складываются в сто', ['igl','frag','duo'].every(k=>{ const t=cats[k]; return !t.length || Math.abs(t.reduce((a,r)=>a+r.pct,0)-100)<=2; }));
    // ---- церемония пишет награды один раз ---------------------------------------
    const n0=(cr.news||[]).length;
    const win=careerAwardSeason();
    check('игрок года на месте', !!win);
    const won=careerAwardCatsWon(1);
    check('новичок года — ты, семнадцать лет и лучший рейтинг', cats.rookie.length>=1 && cats.rookie[0].you, JSON.stringify(cats.rookie));
    check('номинации записаны в награды', won.length>=3 && won.every(a=>a.top && a.top.length && a.top[0].n===a.name), JSON.stringify(won.map(a=>a.cat+':'+a.name)));
    check('пресса написала про каждую', (cr.news||[]).filter(n=>n.k==='ccNewsAwardCat'||n.k==='ccNewsAwardCatYou').length===won.length, String((cr.news||[]).length-n0));
    const again=careerAwardSeason();
    check('второй раз не судится', again===null && careerAwardCatsWon(1).length===won.length);
    // ---- плитка и слайд --------------------------------------------------------
    const tile=careerSeasonCatsHTML();
    check('плитка номинаций собрана', /cc-aw/.test(tile) && /Игл года|Фраггер года|Дуо года/.test(tile) && /% голосов сцены/.test(tile), tile.replace(/<[^>]+>/g,' ').slice(0,160));
    check('в плитке — тройка с процентами', (tile.match(/cc-goty-row/g)||[]).length>=2, tile.replace(/<[^>]+>/g,' ').slice(0,200));
    const y=ccGalaYear();
    check('церемония — пять слайдов, номинации перед игроком года', CC_GALA_SLIDES===5 && /cc-aw/.test(ccGalaSlide(3, y)) && /cc-goty/.test(ccGalaSlide(4, y)) && !/cc-aw/.test(ccGalaSlide(4, y)));
    out.steps.push('плитка: '+tile.replace(/<[^>]+>/g,' ').replace(/\\s+/g,' ').slice(0,180));
    // ---- свои награды в сводке, новый сезон чистит журнал ------------------------
    check('careerAwardsWon считает номинации', careerAwardsWon('cat')===won.filter(a=>a.you).length);
    const plogBefore=Object.keys(cr.plog||{}).length;
    careerNewSeason();
    check('новый сезон — журнал вечеров с нуля', plogBefore>0 && Object.keys(CAREER.career.plog||{}).length===0);
    check('награды прошлого сезона остались', careerAwardCatsWon(1).length===won.length);
    out.steps.push('новый сезон: журнал чист, награды сезона 1 остались');
  }catch(e){ out.fails.push('исключение: '+String(e && e.stack || e).slice(0,300)); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccawards-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=60000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
const m = dom.match(/BEGIN((?:%[0-9A-Fa-f]{2}|[A-Za-z0-9!'()*\-._~])*)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if (out.errs && out.errs.length) { console.error('page errors: ' + out.errs.slice(0, 5).join(' | ')); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.error('FAILED: ' + f)); process.exit(1); }
console.log('the season ends with four nominations beside the player of the year');
fs.rmSync(dir, { recursive: true, force: true });
