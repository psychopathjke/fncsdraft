// Третьего в командной карьере можно заменить: «Найти нового» под ним открывает поиск, письмо помнит кресло,
// на два «да» новый садится вместо него. Раньше поиск в команде открывался только для пустого кресла.
//   node tools/check-mp-third-swap.js

const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
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
  const out={fails:[], notes:{}, err:null};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  const sent=[];
  const seed=(lobbyRole)=>{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Third', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:0, region:'EU', ovr:90, role:'roleIGL',
        attrs:ccRookieAttrs(90,'roleIGL'), ageEdge:0, photo:null,
        handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:0,
              reach:0, tokens:[], log:[], news:[], seed:'fixed-world',
              size:3, sizes:{1:3}, mp:{code:'ABC123', role:lobbyRole}},
      partners:[]}));
    careerLoad();
    MP.peer={handle:'howly', nat:'ru', region:'EU', rating:91,
             _targetOvr:91, _attrs:null, _roleKey:'roleFRG'};
    sent.length=0;
    MP.send=function(m){ sent.push(m); };
    ccMpThirdWire();
  };
  const offers=()=>careerDms().filter(t=>t.state==='offer' && t.who &&
                                         !t.who.org && !t.who.brand);
  try{
    seed('a');
    // Третий уже сидит.
    const pool=careerDuoSearchPool(true).filter(w=>w.ovr<=80 && w.role!=='roleIGL' && w.role!=='roleFRG');
    const pool2=careerDuoSearchPool(true).filter(w=>w.ovr<=78);
    const first=pool2[0];
    check('есть кого посадить', !!first);
    CAREER.career.mates=[{handle:first.handle, cardRegion:'EU', patience:60, since:careerToday()}];
    check('третий сидит', careerMates().length===2 && hKey(careerMates()[1])===hKey(first), JSON.stringify(careerMates().map(m=>m&&m.handle)));
    // Кнопка «Найти нового» под ним открывает поиск.
    ccDuoFindOpen(1);
    const modal=document.getElementById('duoFindModal');
    check('поиск открылся при полном составе', modal && modal.style.display==='flex', modal && modal.style.display);
    out.notes.seat=CC_DUO_SEAT;
    check('поиск помнит кресло третьего', CC_DUO_SEAT===1, String(CC_DUO_SEAT));
    ccDuoFindClose();
    // Письмо на это кресло, и посадка на два «да».
    const next=pool2.find(w=>hKey(w)!==hKey(first) && (!w.role || w.role!=='roleIGL'));
    careerDmWrite(next.handle, 1);
    const t=careerDmFind(next.handle);
    check('письмо помнит кресло', t && t.seat===1, t && String(t.seat));
    if(t){ t.state='offer'; CC_MP_THIRD_OK=true; try{ careerDmAccept(t.id); } finally{ CC_MP_THIRD_OK=false; } }
    const now=careerMates().map(m=>m&&m.handle);
    out.notes.состав=now;
    check('новый сел вместо третьего', now.length===2 && hKey({handle:now[1]})===hKey(next), JSON.stringify(now));
    check('старый ушёл', !now.some(h=>hKey({handle:h})===hKey(first)), JSON.stringify(now));
    check('напарник-человек на месте', hKey({handle:now[0]})===hKey({handle:'howly'}), JSON.stringify(now));
  }catch(e){ out.err=String(e&&e.stack||e); }
  document.getElementById('__out').textContent=
    'PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mpswap-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\w%\-.!~*'()]*)PEND/);
if (!m) { console.error('проба не отработала; копия в ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('третьего в команде меняют через поиск');
fs.rmSync(dir, { recursive: true, force: true });
