// Онлайн-карьера: переезд в другой регион и замена третьего.
// Вдвоём напарника-человека не оставишь, поэтому переезд всегда командой (регион турниров тоже меняется).
// Крестик у третьего убирает бота из cr.mates, у напарника-человека — ничего.
//   node tools/check-mp-kick-move.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out={notes:{}, err:null};
  const made=(h,ovr,role)=>({handle:h, nat:'de', region:'EU', org:null, tier:'ladder', event:'', date:'-', placement:null,
    rating:ovr, _targetOvr:ovr, _attrs:ccRookieAttrs(ovr, role||'roleFRG')});
  const seed=(mp, size, partners)=>{ CAREER={
    player:{nick:'Mover', ovr:80, ovrExact:80, region:'EU', role:'roleIGL', country:'de', countryPing:15, age:18, attrs:ccRookieAttrs(80,'roleIGL')},
    career:{season:1, day:'2026-03-02', division:3, size:size, sizes:{1:size}, diff:'easy', earnings:0, balance:100000, rent:0,
      tokens:[], log:[], news:[], newsN:0, seed:'fixed', mp:mp, region: mp?'EU':undefined, mates:[]},
    dms:[], gear:{own:[], train:0}, partners:partners||[]}; };
  try{
    ccAsk=function(msg, go){ go(); };
    seed(null, 2, [{card:made('MateA',78), handle:'MateA', patience:50, since:'2026-01-05', dev:0}]);
    careerMoveRegion('NAC','us-tx');
    out.notes.soloAlone={career:ccCareerRegion()};
    seed({code:'ABC123', role:'a'}, 3, []);
    MP.peer={handle:'howly', nat:'ru', region:'EU', rating:91, _targetOvr:91, _attrs:null, _roleKey:'roleFRG'};
    MP.send=function(){};
    careerMoveAsk('NAC','us-tx');
    out.notes.mpAlone={career:ccCareerRegion()};
    seed({code:'ABC123', role:'a'}, 3, []);
    CAREER.career.mates=[{card:made('Third',75), handle:'Third', patience:50, since:'2026-01-05', dev:0}];
    out.notes.kickThird={ret:careerMateKick(1), crMates:CAREER.career.mates.map(p=>p.handle)};
    CC_MP_THIRD_OK=true;
    out.notes.replaceThird={ret:careerMateSeat({card:made('NewThird',80), handle:'NewThird', patience:50, since:'2026-03-02', dev:0}, 1), crMates:CAREER.career.mates.map(p=>p.handle)};
    CC_MP_THIRD_OK=false;
    CAREER.partners=[{card:made('OldSoloBot',70), handle:'OldSoloBot', patience:50, since:'2026-01-05', dev:0}];
    out.notes.kickPeer={ret:careerMateKick(0), partners:CAREER.partners.map(p=>p.handle)};
  }catch(e){ out.err=String(e&&e.stack||e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mpkick-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g, '/') + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
  '--virtual-time-budget=60000', '--dump-dom', 'file:///' + tmp.replace(/\\/g, '/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const m = dom.match(/PBEGIN([\w%\-.!~*'()]*)PEND/);
if (!m) { console.error('FAIL проба не запустилась'); process.exit(2); }
const r = JSON.parse(decodeURIComponent(m[1])), n = r.notes, fails = [];
if (r.err) fails.push('ошибка: ' + r.err);
if (n.soloAlone && n.soloAlone.career !== 'NAC') fails.push('одиночная карьера: после переезда регион ' + n.soloAlone.career);
if (n.mpAlone && n.mpAlone.career !== 'NAC') fails.push('онлайн: после переезда регион турниров ' + n.mpAlone.career);
if (n.kickThird && !(n.kickThird.ret && n.kickThird.crMates.length === 0)) fails.push('онлайн: третий не выгнан ' + JSON.stringify(n.kickThird));
if (n.replaceThird && !(n.replaceThird.ret && n.replaceThird.crMates[0] === 'NewThird')) fails.push('онлайн: замена третьего не встала ' + JSON.stringify(n.replaceThird));
if (n.kickPeer && (n.kickPeer.ret || n.kickPeer.partners.length !== 1)) fails.push('онлайн: крестик у напарника-человека что-то сделал ' + JSON.stringify(n.kickPeer));
if (fails.length) { fails.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
console.log('OK переезд онлайн меняет регион команды, третий выгоняется и меняется, напарника-человека выгнать нельзя');
