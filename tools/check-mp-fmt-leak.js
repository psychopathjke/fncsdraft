// Формат трио-капа, не снятый брошенным вечером, снимается новым вечером и abandonRun (errlog 15.11, пара 2022:
// у одного все капы тройкой с филлом anas, у другого парой). И в карточке едут консоль и мобильная сила напарника.
//
//   node tools/check-mp-fmt-leak.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(String.fromCharCode(92)).join('/');
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out={fails:[], notes:{}, err:null};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d!==undefined?': '+d:'')); };
  const sent=[];
  const seed=(role)=>{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'ev1lstephan', age:20, source:'rookie', country:'ru', countryPing:15, closeRangeEdge:0, region:'EU',
        ovr:88, role:'roleIGL', attrs:ccRookieAttrs(88,'roleIGL'), ageEdge:0, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, year:2024, year0:2024, day:'2024-09-30', division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[],
              seed:'fixed-world', mp:{code:'ABC123', role:role}},
      partners:[]}));
    careerLoad();
    MP.peer={handle:'Misery', nat:'ru', region:'EU', rating:88, _targetOvr:88, _attrs:null, _roleKey:'roleFRG'};
    sent.length=0;
    MP.send=function(m){ sent.push(m); };
    ccMpThirdWire();
  };
  try{
    seed('a');
    check('год дуо', careerSquadSize()===2, String(careerSquadSize()));
    const sw=ccEventRosterBegin(3);
    check('трио-кап поднял формат до трёх с филлом', careerSquadSize()===3 && (CC_MP_FMT_MATES||[]).length===1, careerSquadSize()+' '+JSON.stringify(CC_MP_FMT_MATES&&CC_MP_FMT_MATES.length));
    out.notes.fill=(CC_MP_FMT_MATES||[]).map(r=>r.card.handle);
    // Вечер брошен: finally раннера не наступил. Новый вечер (careerPlayRun0) зовёт ccFmtSwapLeak.
    check('до чистки формат залип (контроль)', CC_EVENT_SIZE===3);
    ccFmtSwapLeak();
    check('новый вечер снял залипший формат', careerSquadSize()===2 && CC_MP_FMT_MATES===null && CC_EVENT_SIZE===0, careerSquadSize()+' '+CC_EVENT_SIZE);
    const sw2=ccEventRosterBegin(3);
    check('следующий трио-кап снова поднимает формат', !!sw2 && careerSquadSize()===3);
    ccEventRosterEnd(sw);   // поздний finally брошенного вечера
    check('поздний finally брошенного вечера не трогает живой', careerSquadSize()===3 && (CC_MP_FMT_MATES||[]).length===1, careerSquadSize()+'');
    abandonRun();
    check('abandonRun тоже снимает', careerSquadSize()===2 && CC_MP_FMT_MATES===null);
    ccEventRosterEnd(sw2);
    check('двойное снятие безвредно', careerSquadSize()===2 && CC_EVENT_SIZE===0);
    const c=MP.card();
    out.notes.card={conDev:c && c.conDev, mobPow:c && c.mobPow};
    check('в карточке едут консоль и мобильная сила', !!(c && c.conDev && isFinite(c.conDev.ps) && isFinite(c.conDev.any) && isFinite(c.mobPow)), JSON.stringify(out.notes.card));
    check('mobDev — ключ команды', CC_TEAM_KEYS.indexOf('mobDev')>=0);
  }catch(e){ out.err=String(e&&e.stack||e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mpleak-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--user-data-dir=' + path.join(dir, 'p'),
  '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom', 'file:///' + tmp.split(String.fromCharCode(92)).join('/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const m = dom.match(/PBEGIN([\w%\-.!~*'()]*)PEND/);
if (!m) { console.error('проба не отработала; копия в ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out.notes, null, 1));
if (out.err) { console.error(out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('формат капа не залипает после брошенного вечера, консоль напарника едет с карточкой');
fs.rmSync(dir, { recursive: true, force: true });
