// Рычаги игроку внутри игры: стиль стройки и лечение.
//
// Его слово, 5 сентября 2026: «хп не меняется, билды тоже не понятно от чего
// зависит, нужно дать контроль игроку». Проверяется без вечера, на собранной
// команде и под skipAnimation (вопрос отвечает сам первым вариантом):
//   первый вариант стройки — обычный, ресы уходят как раньше (баланс не сдвинут);
//   экономный и тяжёлый множители меняют списание и силу на названные числа;
//   лечение нужно только когда щит или здоровье ниже порога;
//   отхилиться — щит полный, здоровье плюс, сила минус, и это записано;
//   середина игры молчит, когда ресы полные и щит целый.
//
//   node tools/check-career-kit-controls.js
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
(async function(){
  const out={fails:[], notes:[], err:null};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  try{
    CAREER={player:{nick:'Ctl', ovr:80}, career:{}};
    skipAnimation=true;
    const mk=()=>({isYou:true, name:'ME', pow:90, _pf:90, _pc:90, _mats:550, _buildMul:1,
                   _loot:{weapons:[],heals:[{name:'Minis'}],move:null}, _sq:{hp:100, shield:100}});
    // ---- стройка: первый вариант обычный -----------------------------------
    let you=mk();
    await ccAskBuild(you, null);
    check('под скипом стройка обычная', you._buildMul===1 && you._pf===90, you._buildMul+'/'+you._pf);
    ccKitSpend([you], CC_MATS_ZONE);
    check('и круг стоит как раньше', you._mats===550-CC_MATS_ZONE, String(you._mats));
    // ---- множители --------------------------------------------------------
    you=mk(); you._buildMul=CC_BUILD_STYLE.eco.mul; ccKitSpend([you], CC_MATS_ZONE);
    check('экономно — круг дешевле', you._mats===550-Math.round(CC_MATS_ZONE*CC_BUILD_STYLE.eco.mul), String(you._mats));
    you=mk(); you._buildMul=CC_BUILD_STYLE.heavy.mul; ccKitSpend([you], CC_MATS_ZONE);
    check('много — круг дороже', you._mats===550-Math.round(CC_MATS_ZONE*CC_BUILD_STYLE.heavy.mul), String(you._mats));
    check('цены стройки — размен, не подарок', CC_BUILD_STYLE.eco.pow<0 && CC_BUILD_STYLE.heavy.pow>0 && CC_BUILD_STYLE.norm.pow===0);
    // ---- лечение: когда нужно ----------------------------------------------
    you=mk();
    check('целый отряд лечить не надо', !ccHealNeeded(you));
    check('и середина молчит', ccMidQuiet(you));
    you._sq.shield=20;
    check('снятый щит — лечение нужно', ccHealNeeded(you) && !ccMidQuiet(you));
    you._sq.shield=100; you._sq.hp=40;
    check('битое здоровье — тоже', ccHealNeeded(you));
    // ---- лечение: что делает -----------------------------------------------
    you=mk(); you._sq.shield=10; you._sq.hp=50;
    const r=ccHealApply(you);
    out.notes.push('heal → '+JSON.stringify(r)+' pf '+you._pf);
    check('щит полный', you._sq.shield===100);
    check('здоровье плюс, не выше сотни', you._sq.hp===Math.min(100, 50+CC_HEAL_HP), String(you._sq.hp));
    check('время на хилки стоит силы', you._pf===90-CC_HEAL_POW, String(you._pf));
    check('и это записано', you._healed===1);
    // ---- под скипом лечение не выбирается само (первый вариант — играть так) --
    you=mk(); you._sq.shield=10;
    await ccAskHeal(you, null);
    check('под скипом отряд не лечится сам', you._sq.shield===10 && you._pf===90, you._sq.shield+'/'+you._pf);
    // ---- словарь: все строки на обоих языках ------------------------------
    ['ru','en'].forEach(l=>{ LANG=l; CC_L_CACHE={}; const T=L();
      check(l+': строки стройки и лечения', typeof T.ccBuildTitle==='string' && typeof T.ccHealGoNote==='function' &&
            T.ccBuildEcoNote(66,1).length>5 && T.ccHealTitle(20,50).length>5 && T.ccHealDone(80,1).length>5); });
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsctl-'));
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
console.log('the player decides how the squad builds and when it heals');
fs.rmSync(dir, { recursive: true, force: true });
