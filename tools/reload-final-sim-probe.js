// Из чего собирается финал круга Reload — из сыгранного или из посева.
//
// Его слово, 27 августа: «делай финал релоад». Из отбора выходит восемьдесят
// команд, хит — двадцать, отсечка пять: четыре хита дают ровно двадцать мест
// финала. Игрок отыгрывает один, а остальные пятнадцать мест финал добирал
// свежим полем — то есть за три четверти зала никто не играл.
//
// Здесь считается запись прошедших: после своего хита и после того, как мир
// доиграл соседние (ccRelWorldHeats зовётся ходом дня).
//
//   node tools/reload-final-sim-probe.js [папка сборки]

const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = (process.argv[2] || path.resolve(__dirname, '..')).replace(/\\/g, '/');
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
  const out={err:null, notes:{}};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Rel', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:0, region:'EU', ovr:93, role:'roleIGL',
        attrs:ccRookieAttrs(93,'roleIGL'), ageEdge:0, photo:null,
        handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-01', division:1, earnings:0, balance:5000,
              reach:9000, tokens:[], log:[], news:[]},
      partners:[{handle:'Sbari', cardRegion:'EU', dev:0, since:'2026-01-12'}]}));
    careerLoad();
    skipAnimation=true; CC_SKIP_RUN=true;
    const cr=CAREER.career, me=careerCard();
    const drafted=[me].concat(careerMates().filter(Boolean));
    CARD_MODE=true; squadSize=careerSquadSize(); window.drafted=drafted;
    useLandingSet('r1');

    const PO=ccScaleStage(CC_RELOAD_STAGE.playin);
    const HE=ccScaleStage(CC_RELOAD_STAGE.heat);
    const FI=ccScaleStage(CC_RELOAD_STAGE.final);
    out.notes.отборОтсечка=PO.cut;
    out.notes.хитПоле=HE.field; out.notes.хитОтсечка=HE.cut;
    out.notes.финалПоле=FI.field;
    out.notes.хитов=Math.max(2, Math.round(PO.cut/HE.field));

    // Таблица отбора: восемьдесят прошедших, как её пишет вечер.
    const you=careerYouTeam(drafted); you.isYou=true; you.name='you';
    const pool=[you, ...careerCupField(Object.assign({}, cr, {division:1}),
                                       drafted, PO.cut, null, true, 0)];
    const through=pool.slice(0, PO.cut);
    cr.relSeed={season:cr.season, size:careerSquadSize(), set:'r1', next:'heat',
                through:through.map(t=>t.isYou ? 'you' : ccStageSeatRow(t)), out:null};

    // Комната хита — та же, что построит вечер.
    const ev={series:1, set:'r1', stage:'heat', id:'ReloadEliteSeries1', label:'heat'};
    const room=ccRelRoom(you, drafted, Object.assign({}, cr, {division:1}), ev, HE,
                         false, CC_FIELD_SHARP.heats);
    out.notes.комнатаХита=room.length;
    // Сколько верхних отбора сидит со мной — то, на что он жаловался.
    const top=through.slice(0, HE.field);
    const mine=new Set(room.map(ccSeatKey));
    out.notes.верхнихОтбораВМоёмХите=top.filter(t=>mine.has(ccSeatKey(t))).length;

    // Свой хит сыгран: пишем его прошедших тем же кодом, что и вечер.
    room.forEach((t,i)=>{ t.stagePts=1000-i*7; t.wins=0; t.stageElims=0; });
    const ranked=room.slice().sort(heatsRank);
    const q=heatQualifiers(room, HE.cut, false);
    const prevRows=cr.relSeed.through;
    const seeded=prevRows.map(r=>r==='you' ? you : ccStageTeamFrom(r));
    const hs=seedHeats(seeded, Math.max(2, Math.round(seeded.length/HE.field)));
    const at=hs.findIndex(h=>h.indexOf(you)>=0);
    const pending=hs.filter((h,i)=>i!==(at<0?0:at))
                    .map(h=>h.filter(t=>t!==you).slice(0, HE.field).map(ccStageSeatRow))
                    .filter(r=>r.length>=2);
    cr.relSeed={season:cr.season, size:careerSquadSize(), set:'r1', next:'final',
                through:ranked.filter(t=>q.has(t)).map(t=>t===you?'you':ccStageSeatRow(t)),
                out:null, pending:pending};
    out.notes.записьПослеСвоегоХита=cr.relSeed.through.length;
    out.notes.отложеноХитов=pending.length;

    // Ход дня: мир доигрывает соседние.
    const n=(typeof ccRelWorldHeats==='function') ? ccRelWorldHeats() : 0;
    out.notes.мирСыгралХитов=n;
    out.notes.записьПослеМира=(cr.relSeed.through||[]).length;
    out.notes.доляФиналаИзСыгранного=
      Math.round(Math.min(out.notes.записьПослеМира, FI.field)/FI.field*100)+'%';
  }catch(e){ out.err=String(e&&e.stack||e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'relfinal-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=600000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')],
  {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
