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
    check('снятый щит — лечение нужно', ccHealNeeded(you));
    check('но меню середины ради него не встаёт: пьётся молча', ccMidQuiet(you));
    you._sq.shield=100; you._sq.hp=40;
    check('битое здоровье — тоже', ccHealNeeded(you));
    // ---- лечение: пьётся само, из стака, и тратит предметы --------------------
    // Его слово 8.09: «пусть сам юзается, если нужно… и тратят хилл». Вопроса больше нет.
    you=mk(); you._sq.shield=10; you._sq.hp=50;
    you._loot={weapons:[], heals:[{name:'Shield Potion', rarity:'blue', n:3}, {name:'Med Kit', rarity:'green', n:2}], move:null};
    const before=ccHealLeft(you);
    const r=ccHealAuto(you);
    out.notes.push('heal → '+JSON.stringify(r)+' pf '+you._pf+' left '+ccHealLeft(you));
    check('отряд вылечился сам', !!r && !ccHealNeeded(you), JSON.stringify(r));
    check('щит долит до сотни', you._sq.shield===100, String(you._sq.shield));
    check('хилки потрачены', ccHealLeft(you)<before, before+' → '+ccHealLeft(you));
    check('и записано, сколько выпито', you._healed===r.used && r.used>0, String(you._healed));
    check('время стоит силы', you._pf===90-r.pow && r.pow>=0, you._pf+' / '+r.pow);
    check('в строке названы предметы', /Shield Potion|Med Kit/.test(r.what), r.what);
    // Что во что льётся: зелье — только щит, аптечка — только здоровье.
    you=mk(); you._sq.shield=0; you._sq.hp=100;
    you._loot={weapons:[], heals:[{name:'Med Kit', n:3}], move:null};
    check('аптечка щит не поднимает', ccHealAuto(you)===null && you._sq.shield===0, String(you._sq.shield));
    you=mk(); you._sq.shield=100; you._sq.hp=30;
    you._loot={weapons:[], heals:[{name:'Shield Potion', n:3}], move:null};
    check('зелье здоровье не чинит', ccHealAuto(you)===null && you._sq.hp===30, String(you._sq.hp));
    you=mk(); you._sq.shield=20; you._sq.hp=20;
    you._loot={weapons:[], heals:[{name:'Slurpfish', n:3}], move:null};
    const both=ccHealAuto(you);
    check('слёрп-рыба льётся и в щит, и в здоровье', !!both && you._sq.shield>20 && you._sq.hp>=20, JSON.stringify(both));
    // Целому отряду пить незачем, и пустой пак не лечит.
    you=mk(); you._loot={weapons:[], heals:[{name:'Shield Potion', n:3}], move:null};
    check('целый отряд не пьёт', ccHealAuto(you)===null);
    you=mk(); you._sq.shield=5; you._loot={weapons:[], heals:[], move:null};
    check('без хилок не лечится', ccHealAuto(you)===null && you._sq.shield===5);
    // Стак: числа из листа вики, а не с потолка.
    check('три больших зелья и шесть маленьких', CC_HEAL_KIT['Shield Potion'].stack===3 &&
          CC_HEAL_KIT['Small Shield Potion'].stack===6, JSON.stringify(CC_HEAL_KIT['Shield Potion']));
    check('большое зелье — полсотни щита', CC_HEAL_KIT['Shield Potion'].heal===50);
    check('аптечка — сотня здоровья за десять секунд', CC_HEAL_KIT['Med Kit'].heal===100 && CC_HEAL_KIT['Med Kit'].secs===10);
    // Пак кладёт хилки стаком, а не по одной.
    const packed=ccPackFrom([], [{name:'Small Shield Potion', rarity:'green'}, {name:'Small Shield Potion', rarity:'green'},
                                 {name:'Small Shield Potion', rarity:'green'}, {name:'Med Kit', rarity:'green'}]);
    check('одинаковые хилки — один слот со счётом', packed.heals.length===2 &&
          packed.heals[0].n===3 && packed.heals[1].n===1, JSON.stringify(packed.heals.map(h=>h.name+'×'+h.n)));
    check('стак не больше, чем влезает', ccPackFrom([], new Array(9).fill(0).map(()=>({name:'Shield Potion', rarity:'blue'})))
          .heals[0].n===CC_HEAL_KIT['Shield Potion'].stack);
    check('счёт виден в строке пака', /×3/.test(ccPackLine(packed)), ccPackLine(packed));
    // ---- словарь: все строки на обоих языках ------------------------------
    ['ru','en'].forEach(l=>{ LANG=l; CC_L_CACHE={}; const T=L();
      check(l+': строки стройки и лечения', typeof T.ccBuildTitle==='string' && typeof T.ccHealAuto==='function' &&
            T.ccBuildEcoNote(66,1).length>5 && T.ccHealAuto('Shield Potion ×2', 100, 80, 1, 3).length>10); });
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
