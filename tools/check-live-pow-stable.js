// Колонка силы стоит на месте, пока игрок сам её не сдвинул.
//
// Жалоба его игрока, 24 августа: «в начале каждой игры почему-то разная сила,
// в чём проблема? и во всех режимах». Замер подтвердил: связка силой 96
// показывала 91, 102, 97, 96, 94, 98, 95, 98, 99, 98, 91 за одиннадцать игр —
// это множитель формы (FORM_SPREAD_OPEN = ±16% на игру), который движку нужен
// (им откалибрована дисперсия открытых этапов), а игроку не виден и решать по
// нему нечего.
//
// Поэтому механика осталась, а показ изменился: _pfBase помнит, что выпало
// форме, и колонка показывает силу карточки плюс то, что добавили ЛУТ и
// ВЫСОКАЯ ЗЕМЛЯ — ровно то, на что игрок влияет.
//
//   node tools/check-live-pow-stable.js
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
      v:1, player:{nick:'PowProbe', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    skipAnimation=true; CC_SKIP_RUN=true;
    const cr=CAREER.career, me=careerCard();
    drafted=[me]; CARD_MODE=true; squadSize=2; useLandingSet(careerBrSet());
    const you=careerYouTeam([me]); you.isYou=true; you.name='you';
    const field=[you, ...careerCupField(cr, [me], ccTeams(50), null, false, 0)];
    // Так колонка и считает — см. livePow в simulateGamesLive.
    const shown=t=>Math.round(t.pow + (t._pf - (t._pfBase!=null ? t._pfBase : t.pow)));

    // ---- 1. без выборов игрока колонка не двигается ----------------------
    const seen=new Set(), raw=new Set();
    for(let g=0; g<11; g++){
      simulateGame(field, {lobbySquads:field.length, lobbyPlayers:field.length*2});
      seen.add(shown(you));
      raw.add(Math.round(you._pf));
    }
    out.notes.shown=[...seen]; out.notes.rawPf=[...raw]; out.notes.pow=Math.round(you.pow);
    check('колонка показывает одно и то же число', seen.size===1,
          [...seen].join(', '));
    check('и это сила карточки', [...seen][0]===Math.round(you.pow),
          [...seen][0]+' против '+Math.round(you.pow));
    /* Контроль: САМА форма при этом бросается и меняется — иначе проверка
       мерила бы выключенный движок, а не починенный показ. */
    check('контроль: форма всё-таки бросается', raw.size>1,
          [...raw].slice(0,6).join(', '));

    // ---- 2. лут и высокая земля колонку двигают --------------------------
    field.forEach(t=>{ t._pf=Math.max(1, t.pow); t._pfBase=t._pf; });
    const before=shown(you);
    /* null вместо you — это и значит «ходы за игрока»: с переданным you
       комната пропускает его, потому что его выбор приходит из панели. */
    ccRoomLoot(field, null);
    ccRoomLate(field, null);
    const after=shown(you);
    out.notes.loot={before:before, after:after};
    check('выборы в игре колонку двигают', after!==before, before+' → '+after);
  }catch(e){ out.fail=String(e && e.stack || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccpow-'));
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
if (out.fails.length) process.exit(1);
console.log('сила в таблице — карточка плюс то, что сделал игрок');
