// Год и регион гонки задаёт хозяин — его слово 22.09: «запрети другие года выбирать и регионы:
// глава выбирает год и регион, потом по ссылке игрок заходит и выбирает уже из выбранного года».
//
// Проверяется: ссылка приглашения несёт y и r хозяина; страница, открытая по ней, заводит
// экран создания на этом годе и регионе, остальные чипы заперты, ccPickYear/ccPickRegion
// на другое не переключают; вошедший кодом без ссылки, но с другим годом/регионом — вечер
// не начнётся (ccRaceModeWhy называет причину).
//
//   node tools/check-race-host-world.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');
const SL = String.fromCharCode(92);
const run = (query, boot) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rhw-'));
  const tmp = path.join(dir, 'index.html');
  fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(SL).join('/') + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + boot);
  const html = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--virtual-time-budget=30000', '--dump-dom',
    'file:///' + tmp.split(SL).join('/') + query], { maxBuffer: 1 << 28 }).toString();
  const m = /PBEGIN(.*?)PEND/.exec(html);
  if (!m) throw new Error('no result for ' + query);
  return JSON.parse(decodeURIComponent(m[1]));
};
const BOOT1 = `
<pre id="__out" style="display:none"></pre>
<script>
setTimeout(function(){
  const out={fails:[], notes:{}, err:null};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  try{
    MP.connect=function(){ return Promise.reject(new Error('нет лобби')); };
    check('по ссылке открыт экран создания', document.getElementById('screen-career-create').classList.contains('active'));
    check('код, год и регион прочитаны из ссылки', CC_MP_NEW && CC_MP_NEW.code==='ABC123' && CC_MP_NEW.year===2024 && CC_MP_NEW.region==='NAC', JSON.stringify(CC_MP_NEW));
    check('год и регион хозяина стоят', CC.year===2024 && CC.region==='NAC', CC.year+'/'+CC.region);
    const ych=[...document.querySelectorAll('#ccYearChips .cc-chip')];
    check('чужие годы заперты', ych.filter(b=>b.disabled).length===2 && ych.find(b=>!b.disabled).textContent.indexOf('2024')===0, ych.map(b=>b.textContent.slice(0,4)+(b.disabled?'x':'')).join(','));
    const rch=[...document.querySelectorAll('#ccRegionChips .cc-chip')];
    check('чужие регионы заперты', rch.filter(b=>!b.disabled).length===1, rch.map(b=>b.textContent+(b.disabled?'x':'')).join(','));
    check('подпись говорит, кто задал', document.getElementById('ccYearNote').textContent.indexOf(L().ccMpLockedBy)>=0);
    ccPickYear(2026); ccPickRegion('EU');
    check('переключить на другое нельзя', CC.year===2024 && CC.region==='NAC', CC.year+'/'+CC.region);
    check('ссылка хозяина несёт год и регион', /join=ABC123&y=2024&r=NAC/.test((function(){ CAREER={career:{year0:2024, year:2024, day:'2024-02-01', region:'NAC'}, player:{}}; return ccMpInviteURL('ABC123'); })()));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
}, 1200);
<` + `/script>`;
const BOOT2 = `
<pre id="__out" style="display:none"></pre>
<script>
setTimeout(function(){
  const out={fails:[], notes:{}, err:null};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  try{
    // Вошёл кодом со своим миром: карьера 2026/EU, а хозяин — 2024/NAC.
    localStorage.setItem('fncsdraft_career', JSON.stringify({v:1, player:{nick:'Gamma', age:19, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6, region:'EU', ovr:90, role:'roleIGL', attrs:null, ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], race:{code:'ABC123', role:'b', since:'2026-02-02'}}, partners:[]}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career')); s.player.attrs=ccRookieAttrs(90,'roleIGL'); localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerLoad();
    MP.state='live'; MP.act=function(){}; MP.peerAt={};
    const pool=ccSceneRoster('EU').filter(c=>hKey(c)!==hKey(careerCard()));
    CC_RACE_PEERS['host']={id:'host', card:ccRacePackCard(pool[3]), mates:[ccRacePackCard(pool[4])], div:1, season:1, day:'2026-02-02', pow:100, y:2024, rg:'NAC'};
    check('другой год хозяина — вечер не начнётся', ccRaceModeWhy()===L().ccRaceWhyyear, String(ccRaceModeWhy()));
    CC_RACE_PEERS['host'].y=2026;
    check('другой регион хозяина — тоже', ccRaceModeWhy()===L().ccRaceWhyregion, String(ccRaceModeWhy()));
    CC_RACE_PEERS['host'].rg='EU';
    check('тот же мир — препятствия нет', ccRaceModeWhy()===null, String(ccRaceModeWhy()));
    const line=ccRaceMyLine();
    check('своя строка несёт год и регион', line.y===2026 && line.rg==='EU', JSON.stringify({y:line.y, rg:line.rg}));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
}, 600);
<` + `/script>`;
const a = run('?join=ABC123&y=2024&r=NAC', BOOT1);
const b = run('', BOOT2);
let bad = 0;
[a, b].forEach((out, i) => {
  if (out.err) { console.log('ERR ' + (i ? 'код' : 'ссылка') + ': ' + out.err); bad++; }
  out.fails.forEach(f => { console.log('FAIL ' + f); bad++; });
});
if (bad) process.exit(1);
console.log('OK check-race-host-world');
