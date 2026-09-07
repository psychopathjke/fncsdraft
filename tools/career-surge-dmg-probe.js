// Сколько здоровья снимает сёрдж за игру — движок в карьерной комнате против
// реплеев этапа. В tools/real-stage-curves.json у каждой игры записано число
// 25-очковых тиков сёрджа (третий элемент): тики × 25 / (100 × размер отряда)
// = сколько «жизней отряда» сёрдж снял с лобби за игру. Движок считает то же
// по s.surgeTaken (zone-sim applySurge) / 100. Рядом — смерти от сёрджа и от
// шторма за игру и кривая живых, чтобы видеть, что ломает поднятый урон.
//
//   REAL=major2_heats STAGE=heats node tools/career-surge-dmg-probe.js [игр]
//   TUNE='{"SURGE_DUTY":0.05}' — подкрутка движка на время пробы (см. alive-probe).
//   REAL=solo_series_final SOLO=1 STAGE=final — соло-этап.
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const GAMES = +(process.argv[2] || 60);
const TUNE = process.env.TUNE || '';
const DIV = +(process.env.DIV || 1);
const SOLO = process.env.SOLO === '1';
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const STAGE = process.env.REAL || 'major2_heats';
const STAGES = JSON.parse(fs.readFileSync(path.join(__dirname, 'real-stage-curves.json'), 'utf8'));
const DIVS = JSON.parse(fs.readFileSync(path.join(__dirname, 'real-division-curves.json'), 'utf8')).sessions;
Object.keys(DIVS).forEach(d => { STAGES['div' + d] = DIVS[d]; });
if (!STAGES[STAGE]) throw new Error('нет этапа ' + STAGE + ' в real-stage-curves.json');
const rows = STAGES[STAGE];
const squadSize = SOLO ? 1 : 2;
// Тики есть не у каждого реплея: в дивизионных кривых у шести из десяти записей
// дивизиона 1 третьего поля нет вовсе (снято раньше, чем тики стали считать).
// Такие записи — не ноль, а «не измерено», и в среднее не входят; раньше
// `r[2] || 0` считал их нулями и выдавал по D1 1.7 «жизни» вместо 4.3.
const withTicks = rows.filter(r => r.length > 2 && r[2] != null);
if (!withTicks.length) throw new Error('у этапа ' + STAGE + ' ни у одного реплея нет числа тиков сёрджа');
const realTicks = withTicks.map(r => r[2]);
const realLives = realTicks.map(t => t * 25 / (100 * squadSize));
const mean = a => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
const realCurve = Array.from({length:11}, (_, z) => mean(rows.map(r => r[1][z] || 0)));
if (withTicks.length < rows.length) console.log('тики сёрджа записаны у ' + withTicks.length + ' реплеев из ' + rows.length + ' — остальные в среднее не идут');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const GAMES_N=${GAMES};
  const out={curve:[], lives:[], surgeDeaths:[], stormDeaths:[], errs:[]};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Probe', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:${DIV}, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[], sim:true},
      partner:null}));
    careerEntry();
    squadSize=${squadSize}; CARD_MODE=true; useLandingSet(careerBrSet());
    careerSimSet(true); skipAnimation=true;
    if(typeof ccZoneTuneFor==='function') ccZoneTuneFor({type:${JSON.stringify(process.env.KIND||'cup')}, stage:${JSON.stringify(process.env.STAGE||'')}||undefined, day:careerToday()});
    if(${JSON.stringify(process.env.PROFILE||'')} && ZoneSim.profile) ZoneSim.profile(${JSON.stringify(process.env.PROFILE||'')});
    const tune=${JSON.stringify(TUNE)};
    if(tune && ZoneSim.tune) ZoneSim.tune(JSON.parse(tune));
    const me=careerCard();
    const sum=new Array(12).fill(0); let n=0;
    for(let g=0; g<GAMES_N; g++){
      const you=careerYouTeam([me]); you.isYou=true; you.name='you';
      const field=${SOLO
        ? `[you, ...careerSoloField(CAREER.career, [me], 99, ${JSON.stringify(process.env.OPENFIELD||'')}==='1', ${JSON.stringify(process.env.STAGE||'')}||undefined)]`
        : `[you, ...careerCupField(CAREER.career, [me], ccTeams(50), null, ${JSON.stringify(process.env.OPENFIELD||'')}==='1', g%8)]`};
      buildBotLandingAssignment(field.filter(t=>!t.isYou));
      you.landingZone=ALL_LANDING_ZONES[g%ALL_LANDING_ZONES.length];
      await playGameWithChoices(field, null, null);
      const game=you._game;
      const fr=(game && game.frames) ? game.frames() : [];
      const seen={};
      fr.forEach(f=>{ if(f.zone>=1 && f.zone<=11 && seen[f.zone]==null){ seen[f.zone]=f.alive; } });
      for(let z=1; z<=11; z++) sum[z]+= (seen[z]!=null ? seen[z] : 0);
      const sqs=(game && game.squads) || [];
      let taken=0, sd=0, std=0;
      sqs.forEach(s=>{ taken+=(s.surgeTaken||0); if(s.deathCause==='surge') sd++; if(s.deathCause==='storm') std++; });
      out.lives.push(+(taken/100).toFixed(2)); out.surgeDeaths.push(sd); out.stormDeaths.push(std);
      n++;
    }
    for(let z=1; z<=11; z++) out.curve.push(+(sum[z]/Math.max(1,n)).toFixed(1));
  }catch(e){ out.errs.push(String(e && e.stack || e)); }
  document.getElementById('__out').textContent='BEG'+'IN'+encodeURIComponent(JSON.stringify(out))+'E'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccsurge-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=1800000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('проба не дала вывода'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.errs.length) console.error(out.errs.join('\n'));
const fmt = v => v.toFixed(2);
console.log('этап ' + STAGE + ' (' + rows.length + ' реплеев, отряд ' + squadSize + '), движок ' + GAMES + ' игр' + (TUNE ? ', ' + TUNE : ''));
console.log('сёрдж за игру, жизней отряда:  реплеи ' + fmt(mean(realLives)) + ' [' + realLives.map(fmt).join(' ') + ']');
console.log('                               движок ' + fmt(mean(out.lives)) + '  (смертей от сёрджа ' + fmt(mean(out.surgeDeaths)) + ', от шторма ' + fmt(mean(out.stormDeaths)) + ' за игру)');
let gap = 0;
const line = out.curve.map((v, i) => { gap += Math.abs(v - realCurve[i]); return String(i+1) + ':' + v + '/' + realCurve[i].toFixed(0); });
console.log('живых на старте зон движок/реплеи: ' + line.join('  '));
console.log('средний разрыв по зонам: ' + (gap / out.curve.length).toFixed(1) + ' отряда');
