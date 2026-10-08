// Слоты менеджера и выход из менеджера (его слова 8.10: «когда нажимаешь стать менеджером, не дают на выбор карьеру…
// по аналогии с карьерой игрока»; «из обычной карьеры перебрасывает в карьеру менеджера», «после матча нажимаю в карьеру
// и меня перебрасывает»).
//   1) ушёл из менеджера верхним меню в карьеру игрока — менеджер выключен, «в карьеру» после матча ведёт в хаб карьеры;
//   2) «Стать менеджером» при сохранённой карьере открывает выбор слотов; новая карьера во втором слоте не трогает первый.
//   node tools/check-mgr-slots.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(String.fromCharCode(92)).join('/');
const CH = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => fs.existsSync(p));
const BOOT = `<pre id="__out" style="display:none"></pre><script>window.addEventListener('load',()=>setTimeout(()=>{ const out={fails:[], notes:{}};
const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d!=null ? ': '+d : '')); };
const active=()=>{ const a=document.querySelector('.screen.active'); return a ? a.id : null; };
try{
  ['fncsdraft_manager','fncsdraft_manager_s2','fncsdraft_manager_active','fncsdraft_career_active'].forEach(k=>localStorage.removeItem(k));
  const card={handle:'SlotMate', region:'EU', rating:80, _ovr:80, nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null};
  localStorage.setItem('fncsdraft_career', JSON.stringify({v:1,
    player:{nick:'Slot', age:18, source:'rookie', country:'de', countryPing:15, closeRangeEdge:0, region:'EU', ovr:80, role:'roleIGL', attrs:ccRookieAttrs(80,'roleIGL'), ageEdge:0, photo:null, handle:null, cardRegion:null, nat:null},
    career:{season:1, day:'2026-02-10', division:1, earnings:0, balance:0, reach:500, tokens:[], log:[], news:[]},
    partner:{card:card, patience:40, since:'2026-01-01', dev:0}, partners:[{card:card, patience:40, since:'2026-01-01', dev:0}]}));
  // новый менеджер (пустые слоты — сразу выбор клуба)
  mgrStart();
  check('без сохранений — сразу выбор клуба', !!document.querySelector('.mgn-club'), active());
  mgrTake(0); mgrSave();
  check('менеджер включён', MGR_ACTIVE && CAREER && CAREER._mgr);
  check('слот 1 — прежний ключ', !!localStorage.getItem('fncsdraft_manager'));
  // ушёл верхним меню в карьеру игрока
  careerStart();
  out.notes.afterCareerStart={mgr:MGR_ACTIVE, mgrCareer:!!(CAREER && CAREER._mgr), screen:active()};
  check('вход в карьеру выключает менеджера', !MGR_ACTIVE, JSON.stringify(out.notes.afterCareerStart));
  if(document.querySelector('#ccSlotGrid button')) careerSlotOpen(1);
  check('открыта карьера игрока, не тень менеджера', CAREER && !CAREER._mgr && CAREER.player && CAREER.player.nick==='Slot', CAREER && CAREER.player && CAREER.player.nick);
  careerBackToHub();
  check('«в карьеру» после матча — хаб карьеры', active()==='screen-career-hub', active());
  // и даже если флаг остался включённым — вечер игрока не уходит в клуб
  MGR_ACTIVE=true; careerBackToHub(); MGR_ACTIVE=false;
  check('флаг без тени менеджера не уводит в клуб', active()==='screen-career-hub', active());
  // слоты
  mgrStart();
  const cars=()=>[...document.querySelectorAll('#mgBody .mg-slots .cc-car')];
  out.notes.slots1=cars().map(e=>e.textContent.trim().slice(0,40));
  check('есть сохранение — выбор слотов', cars().length===2 && !!document.querySelector('#mgBody .cc-car-new'), JSON.stringify(out.notes.slots1));
  const first=JSON.parse(localStorage.getItem('fncsdraft_manager')).club.name;
  mgrSlotNew(2);
  check('новая карьера — выбор клуба', !!document.querySelector('.mgn-club'));
  mgrTake(1); mgrSave();
  check('вторая карьера во втором слоте', !!localStorage.getItem('fncsdraft_manager_s2'));
  check('первая не тронута', JSON.parse(localStorage.getItem('fncsdraft_manager')).club.name===first);
  mgrToSlots();
  out.notes.slots2=cars().map(e=>e.textContent.trim().slice(0,40));
  check('на экране две карьеры и «Новая»', cars().length===3, JSON.stringify(out.notes.slots2));
  mgrSlotOpen(1);
  check('продолжить первую — её клуб', MGR && MGR.club && MGR.club.name===first, MGR && MGR.club && MGR.club.name);
  mgrToSlots(); mgrSlotDrop(2); mgrSlotDrop(2);
  check('удаление в два нажатия', !localStorage.getItem('fncsdraft_manager_s2'));
}catch(e){ out.fails.push(String(e.stack||e)); }
document.getElementById('__out').textContent='@@B@@'+encodeURIComponent(JSON.stringify(out))+'@@E@@'; }, 500));<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mslots-')), tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CH, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--virtual-time-budget=180000', '--dump-dom', 'file:///' + tmp.split(String.fromCharCode(92)).join('/')], { maxBuffer: 1 << 30, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const out = JSON.parse(decodeURIComponent(dom.match(/@@B@@([^@<]*)@@E@@/)[1]));
if (out.fails.length) { console.log(['FAIL ' + JSON.stringify(out.notes)].concat(out.fails).join(String.fromCharCode(10))); process.exit(1); }
console.log('OK слоты менеджера ' + JSON.stringify(out.notes));
