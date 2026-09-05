// Строка набора на карте: здоровье, ресы, лут, сёрдж.
//
// Его правка 5 сентября 2026: «я бы хотел на симуляцию добавить ресурсы, лут,
// который есть, и сёрдж». Всё это считалось и раньше, но видно было только в
// подсказке к вопросу. Проверяется сама панель (ccKitPanel) на собранном
// кадре — без вечера, потому что панель читает только кадр и свою команду:
//   ресы досчитываются по зоне кадра от последней остановки;
//   лут — свой пак, пока не выбран, потом имена предметов;
//   сёрдж — порог фазы и «под сёржем», когда движок бьёт тебя;
//   выбывший отряд — одна строка «выбыли».
//
//   node tools/check-career-kit-panel.js
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

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out={fails:[], notes:[], err:null};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  const txt=()=>((CC_RUN_MAP.querySelector('.zr-kit')||{}).textContent||'').replace(/\\s+/g,' ').trim();
  try{
    LANG='ru'; CC_L_CACHE={};
    const T=L();
    const map=document.createElement('div'); document.body.appendChild(map);
    CC_RUN_MAP=map;
    const you={isYou:true, name:'ME', _mats:220, _loot:null};
    const lobby=[{name:'A'}, you, {name:'B'}];
    const dot=(o)=>Object.assign({x:0,y:0,alive:true,a:0,h:100,e:0,p:0,u:0,n:0}, o||{});
    CC_KIT_ZONE=3;   // остановка третьей зоны прошла: потрачено три круга

    // ---- зона 1 на кадре: ресы досчитаны назад на два круга -----------------
    ccKitPanel(lobby, {zone:1, players:100, surgeAt:0, dots:[dot(), dot({h:80}), dot()]});
    out.notes.push('z1: '+txt());
    check('панель встала на карте', !!map.querySelector('.zr-kit'));
    const q=s=>map.querySelector(s);
    check('здоровье — из кадра', q('.zk-vitals') && q('.zk-vitals').dataset.hp==='80', (q('.zk-vitals')||{}).outerHTML);
    // 80 очков отряда — щит 60 и здоровье 100, как на HUD (верхняя половина — щит).
    check('щит и здоровье разложены как в игре', q('.zk-shield b').textContent==='60' && q('.zk-health b').textContent==='100',
          q('.zk-shield b').textContent+'/'+q('.zk-health b').textContent);
    check('ресы на первой зоне — полные минус один круг', q('.zk-mats') && q('.zk-mats').dataset.total==='440', (q('.zk-mats')||{}).outerHTML);
    const stacks=[...map.querySelectorAll('.zk-mats span')].map(s=>+s.textContent);
    check('три стопки в сумме дают ресы', stacks.length===3 && stacks.reduce((a,b)=>a+b,0)===440, stacks.join('+'));
    check('лут до третьей зоны — пять пустых слотов', map.querySelectorAll('.zk-slot.empty').length===5 &&
          (q('.zk-hotbar').title||'')===T.ccKitLootNone, String(map.querySelectorAll('.zk-slot.empty').length));
    check('сёрдж на первой зоне выключен', txt().indexOf(T.ccKitSurgeOff)>=0, txt());

    // ---- зона 3: ресы как есть, сёрдж активен, ты над порогом -----------------
    ccKitPanel(lobby, {zone:3, players:84, surgeAt:90, surgeLine:null, dots:[dot(), dot({h:64}), dot()]});
    out.notes.push('z3: '+txt());
    check('ресы на зоне остановки — как в модели', q('.zk-mats').dataset.total==='220', q('.zk-mats').dataset.total);
    check('сёрдж ещё не бьёт — порог и живые', txt().indexOf(T.ccKitSurgeAt(90, 84))>=0, txt());
    check('и не красный, пока бьют не тебя', !map.querySelector('.zk-surge.on'));

    // ---- сёрдж включился, ты над порогом: как на HUD игры, «+N над порогом» ----
    ccKitPanel(lobby, {zone:4, players:80, surgeAt:74, surgeLine:-30, dots:[dot(), dot({h:64, n:239}), dot()]});
    out.notes.push('z4: '+txt());
    // Словарная строка режется по « · »: заголовок плашкой, число строкой под ним.
    check('над порогом — на сколько урона', txt().replace(/\\s+/g,' ').indexOf(T.ccKitSurgeAbove(269).split(' · ').join(''))>=0 ||
          (q('.zk-surge b') && q('.zk-surge span') && (q('.zk-surge b').textContent+' · '+q('.zk-surge span').textContent)===T.ccKitSurgeAbove(269)), txt());

    // ---- лут выбран, ресы кончились, под сёржем -------------------------------
    you._loot={weapons:[{name:'Pump'},{name:'AR'}], heals:[{name:'Minis'},{name:'Medkit'}], move:{name:'Sliders'}};
    you._mats=100; CC_KIT_ZONE=5;
    ccKitPanel(lobby, {zone:5, players:70, surgeAt:60, surgeLine:-80, dots:[dot(), dot({h:41, u:1, n:-120}), dot()]});
    out.notes.push('z5: '+txt());
    check('лут — пять слотов с именами', /Pump.*AR.*Minis.*Medkit.*Sliders/.test(txt()) && map.querySelectorAll('.zk-slot.empty').length===0, txt());
    check('мало ресов — жёлтая пометка', !!map.querySelector('.zk-mats.low') && (q('.zk-mats').title||'').indexOf(T.ccKitLow)>=0, q('.zk-mats').title);
    check('под сёржем — плашка и сколько до порога', !!map.querySelector('.zk-surge.on') &&
          (q('.zk-surge b').textContent+' · '+q('.zk-surge span').textContent)===T.ccKitSurgeUnder(40), txt());

    // ---- выбыли ----------------------------------------------------------------
    ccKitPanel(lobby, {zone:6, players:50, surgeAt:50, dots:[dot(), dot({alive:false, h:0, p:23}), dot()]});
    check('выбывший отряд — одна строка', txt()===T.ccKitOut, txt());

    // ---- без карты панель молчит и не падает -----------------------------------
    CC_RUN_MAP=null;
    ccKitPanel(lobby, {zone:7, players:40, surgeAt:40, dots:[dot(), dot(), dot()]});
    check('без карты ничего не рисуется', document.querySelectorAll('.zr-kit').length===1);

    // ---- и по-английски -----------------------------------------------------
    LANG='en'; CC_L_CACHE={}; CC_RUN_MAP=map; you._mats=300; CC_KIT_ZONE=3;
    ccKitPanel(lobby, {zone:3, players:84, surgeAt:90, dots:[dot(), dot({h:90}), dot()]});
    out.notes.push('en: '+txt());
    check('английская строка — без кириллицы', !/[А-Яа-я]/.test(txt()), txt());
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncskit-'));
const tmp = path.join(dir, 'index.html');
const BASE = '<base href="file:///' + ROOT.split(path.sep).join('/') + '/">';
fs.writeFileSync(tmp, BASE + src + BOOT);
const dom = execFileSync(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
  '--virtual-time-budget=30000', '--dump-dom', 'file:///' + tmp.replace(/\\/g, '/')
], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.notes.forEach(n => console.log('  ' + n));
if (out.err) { console.error('ERROR: ' + out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.error('FAILED: ' + f)); process.exit(1); }
console.log('the map shows what you carry: health, mats, loot and the surge');
fs.rmSync(dir, { recursive: true, force: true });
