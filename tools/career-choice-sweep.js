// Чего стоят решения игры: сколько мест и побед приносят хайграунд, рефреш и
// лут против «ничего не выбрал». Меряется на настоящих играх карты.
//
//   node tools/career-choice-value-probe.js [игр]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const GAMES = +(process.argv[2] || 400);
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
(function(){
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
    const me=careerCard();
    const mkField=()=>{
      const you=careerYouTeam([me]); you.isYou=true; you.name='you';
      return [you, ...careerCupField(CAREER.career, [me], ccTeams(50), null, false, 0)];
    };
    // Прибавка применяется ровно так же, как её применяет игра: к _pf/_pc
    // после расстановки, до расчёта.
    const run=(add)=>{
      let places=0, wins=0, top10=0;
      for(let g=0; g<${GAMES}; g++){
        const field=mkField();
        buildBotLandingAssignment(field.filter(t=>!t.isYou));
        const you=field.find(t=>t.isYou);
        you.landingZone=ALL_LANDING_ZONES[0];
        field.forEach(t=>{ t._elims=0; t._feed=[];
          t._pf=Math.max(1, t.pow*gameForm()); t._pc=Math.max(1, t._pf+(t.closeEdge||0)); });
        if(add) ccAddGamePow(you, add);
        const order=simulateGameOnMap(field, {lobbySquads:field.length});
        const at=order.indexOf(you)+1;
        places+=at; if(at===1) wins++; if(at<=10) top10++;
      }
      return {place:+(places/${GAMES}).toFixed(2),
              wins:+(wins/${GAMES}*100).toFixed(1),
              top10:+(top10/${GAMES}*100).toFixed(1)};
    };
    out.rows.push({what:'ничего', add:0, ...run(0)});
    out.rows.push({what:'+4 (хг/лут)', add:4, ...run(4)});
    out.rows.push({what:'+8', add:8, ...run(8)});
    out.rows.push({what:'+14', add:14, ...run(14)});
  }catch(e){ out.errs.push(String(e && e.stack || e)); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccval-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=900000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('проба не дала вывода'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if(out.errs.length) console.error(out.errs.join('\n'));
console.log('решение              сила   ср. место   побед %   топ-10 %');
out.rows.forEach(r => console.log(
  r.what.padEnd(20), String('+'+r.add).padStart(4),
  String(r.place).padStart(10), String(r.wins).padStart(9), String(r.top10).padStart(10)));
