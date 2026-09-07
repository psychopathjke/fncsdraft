// Снимок панели набора на карте (ccKitPanel): щит и здоровье, сёрдж, ресы тремя
// стопками, кирка и пять слотов — чтобы на HUD можно было посмотреть, а не рассуждать.
//
//   node tools/shot-kit.js [out.png]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.argv[2] || path.join(process.env.SHOT_DIR || ROOT, 'shot-kit.png');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<div id="__shot" style="position:fixed;left:0;top:0;width:900px;z-index:99999;background:#0d1230;padding:0;margin:0"></div>
<script>
(async function(){
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Probe', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:1000, reach:0, tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    squadSize=2; CARD_MODE=true; useLandingSet(careerBrSet());
    const set=ACTIVE_LANDING_SET;
    const host=document.getElementById('__shot');
    const ratio=MAP_ASPECT[set].split('/');
    const handle=ZoneReplay.mount(host, 'art/map-'+set+'.jpg', ratio[0]+' / '+ratio[1], Number(ratio[1])/Number(ratio[0]), {});
    CC_RUN_MAP=handle.wrap;
    const pool=CC_LOOT_BY_SET[ccLootSet()];
    const w=(n,r)=>{ const o=pool.weapons.find(x=>x.name===n && x.rarity===r)||pool.weapons.find(x=>x.name===n)||pool.weapons[0]; return o; };
    const you={isYou:true, name:'ME', _mats:1500, _loot:{weapons:[w('Assault Rifle','epic'), w('Pump Shotgun','rare')],
      heals:[pool.heals.find(x=>/Slurp|Shield|Mini/i.test(x.name))||pool.heals[0], pool.heals.find(x=>/Med|Bandage/i.test(x.name))||pool.heals[1]],
      move:pool.heals.find(x=>CC_MOVE_ITEMS.indexOf(x.name)>=0)||null}};
    const lobby=[{name:'A'}, you, {name:'B'}];
    CC_KIT_ZONE=5;
    const dot=(o)=>Object.assign({x:0,y:0,alive:true,a:0,h:100,sh:100,e:0,p:0,u:0,n:0}, o||{});
    ccKitPanel(lobby, {zone:5, players:58, surgeAt:60, surgeLine:-40, secondsLeft:71, dots:[dot(), dot({h:84, sh:70, e:2, n:210}), dot()]});
  }catch(e){ document.title='ERR '+String(e && e.message || e); }
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cckit-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--hide-scrollbars','--window-size=920,640',
  '--run-all-compositor-stages-before-draw','--virtual-time-budget=20000',
  '--screenshot=' + OUT, 'file:///' + tmp.replace(/\\/g,'/')], {stdio:'ignore'});
fs.rmSync(dir, {recursive:true, force:true});
console.log('wrote ' + OUT);
