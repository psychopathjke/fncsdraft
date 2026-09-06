// Что меняют ступени ресов в концовке (CC_MATS_BANDS) — и не перекосили ли они
// комнату.
//
// Его вопрос 6 сентября: «как ресурсы влияют на количество силы? чем больше,
// тем же лучше в реальной игре». Было «есть/нет» (ниже порога −3, выше ноль),
// стало три ступени по замеру Tracker 2020 (см. комментарий у CC_MATS_BANDS).
//
// Проба гоняет одинаковые комнаты полным конвейером вечера
// (playGameWithChoices под симуляцией: лут, стройка, середина, концовка — и
// комната ходит за игрока тем же броском) в двух режимах:
//
//   порог    — как было: ниже трети −3, выше ноль
//   ступени  — как сейчас: верхняя треть 0, средняя −1, нижняя −3
//
// и печатает: место, победы и топ-10 игрока (должны стоять на месте — штраф
// общий), и по каждой ступени долю команд, которые в ней заканчивают, с их
// топ-10 и средним местом. Последнее — форма для сравнения с таблицей
// Tracker'а: низ должен доживать заметно реже верха.
//
//   node tools/career-mats-band-probe.js [игр на режим]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const GAMES = +(process.argv[2] || 300);
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
  const out={rows:[], bands:[], errs:[]};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Probe', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[], sim:true},
      partner:null}));
    careerEntry();
    squadSize=2; CARD_MODE=true; useLandingSet(careerBrSet());
    careerSimSet(true);
    skipAnimation=true;
    const me=careerCard();
    const NEW=CC_MATS_BANDS.map(b=>({from:b.from, pow:b.pow}));
    const OLD=[{from:CC_MATS_LOW/CC_MATS_FULL, pow:0}, {from:0, pow:-CC_MATS_PEN}];
    const setBands=(b)=>CC_MATS_BANDS.splice(0, CC_MATS_BANDS.length, ...b);
    const bandOf=t=>{ const f=ccMats(t)/CC_MATS_FULL; return f>=2/3 ? 'верх' : f>=1/3 ? 'середина' : 'низ'; };

    const run=async (mode)=>{
      setBands(mode==='порог' ? OLD : NEW);
      let places=0, wins=0, top10=0;
      const band={'верх':{n:0,top10:0,place:0}, 'середина':{n:0,top10:0,place:0}, 'низ':{n:0,top10:0,place:0}};
      for(let g=0; g<GAMES_N; g++){
        const you=careerYouTeam([me]); you.isYou=true; you.name='you';
        const field=[you, ...careerCupField(CAREER.career, [me], ccTeams(50), null, false, g%8)];
        buildBotLandingAssignment(field.filter(t=>!t.isYou));
        you.landingZone=ALL_LANDING_ZONES[g%ALL_LANDING_ZONES.length];
        const order=await playGameWithChoices(field, null, null);
        const at=order.indexOf(you)+1;
        places+=at; if(at===1) wins++; if(at<=10) top10++;
        field.forEach(t=>{ const b=band[bandOf(t)]; const p=order.indexOf(t)+1;
          b.n++; b.place+=p; if(p<=10) b.top10++; });
      }
      const total=Object.values(band).reduce((s,b)=>s+b.n,0);
      out.bands.push({mode, rows:Object.keys(band).map(k=>({band:k,
        share:+(band[k].n/total*100).toFixed(1),
        top10:band[k].n ? +(band[k].top10/band[k].n*100).toFixed(1) : null,
        place:band[k].n ? +(band[k].place/band[k].n).toFixed(1) : null}))});
      return {place:+(places/GAMES_N).toFixed(2),
              wins:+(wins/GAMES_N*100).toFixed(1),
              top10:+(top10/GAMES_N*100).toFixed(1)};
    };
    out.rows.push({what:'порог',   ...(await run('порог'))});
    out.rows.push({what:'ступени', ...(await run('ступени'))});
  }catch(e){ out.errs.push(String(e && e.stack || e)); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccmats-'));
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
console.log('игрок (' + GAMES + ' игр на режим)');
console.log('режим        ср. место   побед %   топ-10 %');
out.rows.forEach(r => console.log(
  r.what.padEnd(12), String(r.place).padStart(9), String(r.wins).padStart(9),
  String(r.top10).padStart(10)));
out.bands.forEach(b => {
  console.log('\nкомната, режим «' + b.mode + '»: ресы на восьмой зоне');
  console.log('ступень      доля %   топ-10 %   ср. место');
  b.rows.forEach(r => console.log(
    r.band.padEnd(12), String(r.share).padStart(6), String(r.top10).padStart(10),
    String(r.place).padStart(11)));
});
