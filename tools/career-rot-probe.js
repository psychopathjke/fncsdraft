// Что стоит стиль ротации в движке — и как это ложится на реплеи.
//
// Замер по реплеям (три игры финала Major 2 EU, 2 августа 2026, момент выхода
// с позиции): середина — сразу 82% доживают до зоны через одну, со штормом
// 77%, позже — единицы; концовка — сразу 63%, со штормом 49%. См. CC_ROT_REAL.
//
// Проба играет одинаковые комнаты полным конвейером вечера, а на вопросе
// ротации отвечает одним и тем же стилем (остальные вопросы — ход по
// умолчанию), и печатает: дожил ли игрок до седьмой и до девятой зоны, место,
// победы, топ-10. «бот» — стиля нет, команда ходит по навыку, как под
// симуляцией.
//
//   node tools/career-rot-probe.js [игр на стиль]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const GAMES = +(process.argv[2] || 200);
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const GAMES_N=${GAMES};
  const out={rows:[], errs:[]};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Probe', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    squadSize=2; CARD_MODE=true; useLandingSet(careerBrSet());
    skipAnimation=true;
    const me=careerCard();
    let STYLE=null;
    // Вопросы задаёт настоящая игра; отвечает проба: ротация — стилем, всё
    // остальное — ходом по умолчанию.
    ccChoiceBox=async function(title, hint, options){
      if(STYLE && options.some(o=>o.id==='early')) return options.find(o=>o.id===STYLE) || options.find(o=>o.def) || options[0];
      return options.find(o=>o.def) || options[0];
    };
    const run=async (style)=>{
      STYLE=style;
      let places=0, wins=0, top10=0, z7=0, z9=0;
      for(let g=0; g<GAMES_N; g++){
        const you=careerYouTeam([me]); you.isYou=true; you.name='you';
        const field=[you, ...careerCupField(CAREER.career, [me], ccTeams(50), null, false, g%8)];
        buildBotLandingAssignment(field.filter(t=>!t.isYou));
        you.landingZone=ALL_LANDING_ZONES[g%ALL_LANDING_ZONES.length];
        // Мувмент нужен в паке — иначе стиля move не будет в меню.
        const order=await playGameWithChoices(field, null, null);
        const at=order.indexOf(you)+1;
        places+=at; if(at===1) wins++; if(at<=10) top10++;
        // Дожил до зоны: по кадрам — последняя зона, в которой отряд игрока был жив.
        const fr=you._game && you._game.frames ? you._game.frames() : [];
        const i=field.indexOf(you);
        let lastZone=0; fr.forEach(f=>{ const d=(f.dots||[])[i]; if(d && d.alive) lastZone=f.zone; });
        if(lastZone>=7) z7++; if(lastZone>=9) z9++;
      }
      return {style:style||'бот', place:+(places/GAMES_N).toFixed(2), wins:+(wins/GAMES_N*100).toFixed(1),
              top10:+(top10/GAMES_N*100).toFixed(1), z7:+(z7/GAMES_N*100).toFixed(1), z9:+(z9/GAMES_N*100).toFixed(1)};
    };
    for(const s of [null, 'early', 'with', 'late', 'move']) out.rows.push(await run(s));
  }catch(e){ out.errs.push(String(e && e.stack || e)); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccrot-'));
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
if(out.errs.length) console.error(out.errs.join('\n'));
console.log('стиль     дожил до 7-й %   до 9-й %   ср. место   побед %   топ-10 %   (' + GAMES + ' игр на стиль)');
out.rows.forEach(r => console.log(r.style.padEnd(9), String(r.z7).padStart(14), String(r.z9).padStart(10),
  String(r.place).padStart(11), String(r.wins).padStart(9), String(r.top10).padStart(10)));
console.log('реплеи, середина: сразу 82%, со штормом 77% доживают до зоны через одну; концовка: сразу 63%, со штормом 49%');
