// Полоски щита и здоровья ЖИВУТ, а смерти остаются там, где их калибровали.
//
// Его слово 11 сентября: «по армору, чет нереалистично почему-то всегда 0 почти,
// и 100 здоровья всегда». Замер тогда: щит на нуле 69% времени, здоровье на
// сотне 97%. Причина — щит возвращался тем же темпом, что здоровье (0.8 в
// секунду), а уходил по 2.0 за очко контакта; здоровья же перестрелка не
// касалась вовсе.
//
// Здесь проверяется то, что видно игроку, и то, что нельзя сломать по дороге:
//   щит рано полный, к середине тает, к концу пустеет;
//   здоровье не стоит на сотне весь матч;
//   смерти по-прежнему дуэль/шторм/сёрдж в тех же долях (контактом не убивают).
//
//   node tools/check-career-bars.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');
const GAMES = 6;
const FIELD = fs.readFileSync(path.join(__dirname, 'check-replay-pace.js'), 'utf8')
  .match(/const FIELD = `([\s\S]*?)`;/)[1];

const PAGE = `<!doctype html><meta charset="utf-8"><body><pre id="out"></pre>
<script src="zone-sim.js"><\/script>
<script>
${FIELD}
var TEAMS=null, _fake=fakeField;
fakeField=function(n){ TEAMS=_fake(n); return TEAMS; };
(function(){
  var out={sh:{}, hp:{}, n:0, sh0:0, hp100:0, dead:{}, knobs:null};
  try{ out.knobs=ZoneSim.tuned ? ZoneSim.tuned() : null; }catch(e){}
  for(var g=0; g<${GAMES}; g++){
    var game=record(31+g);
    game.timeline.forEach(function(f){
      (f.dots||[]).forEach(function(d){
        if(!d || !d.alive) return;
        var sh=(d.sh==null?100:d.sh), hp=(d.h==null?100:d.h);
        (out.sh[f.zone]=out.sh[f.zone]||[]).push(sh);
        (out.hp[f.zone]=out.hp[f.zone]||[]).push(hp);
        out.n++; if(sh<=0) out.sh0++; if(hp>=100) out.hp100++;
      });
    });
    (TEAMS||[]).forEach(function(t){
      var c=t._deathCause, k=(c==='storm'||c==='surge') ? c : (c ? 'duel' : 'alive');
      out.dead[k]=(out.dead[k]||0)+1;
    });
  }
  var med=function(a){ if(!a || !a.length) return null; var b=a.slice().sort(function(x,y){ return x-y; }); return b[Math.floor(b.length/2)]; };
  out.shMed={}; out.hpMed={};
  Object.keys(out.sh).forEach(function(z){ out.shMed[z]=Math.round(med(out.sh[z])); out.hpMed[z]=Math.round(med(out.hp[z])); });
  delete out.sh; delete out.hp;
  out.sh0pc=Math.round(out.sh0/out.n*100);
  out.hp100pc=Math.round(out.hp100/out.n*100);
  document.getElementById('out').textContent='BEG'+'IN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'barsguard-'));
fs.writeFileSync(path.join(dir, 'i.html'), PAGE);
fs.copyFileSync(path.join(ROOT, 'zone-sim.js'), path.join(dir, 'zone-sim.js'));
const url = 'file:///' + path.join(dir, 'i.html').split(path.sep).join('/');
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=120000', '--dump-dom', url],
  { maxBuffer: 256 * 1024 * 1024, encoding: 'utf8' });
fs.rmSync(dir, { recursive: true, force: true });
const m = dom.match(/BEGIN([^<]*)END/);
if (!m) { console.error('проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));

const fails = [];
const fail = t => fails.push(t);
const tot = GAMES * 50;
const pc = k => Math.round((out.dead[k] || 0) / tot * 100);

console.log('  щит на нуле ' + out.sh0pc + '% времени, здоровье на сотне ' + out.hp100pc + '%');
console.log('  медиана щита по кругам: ' + Object.keys(out.shMed).sort((a, b) => a - b).map(z => z + ':' + out.shMed[z]).join(' '));
console.log('  медиана здоровья: ' + Object.keys(out.hpMed).sort((a, b) => a - b).map(z => z + ':' + out.hpMed[z]).join(' '));
console.log('  смерти: дуэль ' + pc('duel') + '%, шторм ' + pc('storm') + '%, сёрдж ' + pc('surge') + '%');

if (out.sh0pc > 45) fail('щит стоит на нуле ' + out.sh0pc + '% времени — полоска мертва');
if (out.hp100pc > 90) fail('здоровье на сотне ' + out.hp100pc + '% времени — полоска мертва');
if (!(out.shMed[2] >= 60)) fail('на второй зоне щит уже не полный: ' + out.shMed[2]);
if (!(out.shMed[7] <= 60)) fail('к седьмой зоне щит не растрачен: ' + out.shMed[7]);
if (pc('storm') < 4 || pc('storm') > 16) fail('доля смертей от шторма уехала: ' + pc('storm') + '%');
if (pc('surge') > 4) fail('сёрдж стал убивать: ' + pc('surge') + '%');
if (pc('duel') < 75) fail('дуэли перестали быть главной причиной смерти: ' + pc('duel') + '%');

fails.forEach(f => console.log(' FAIL ' + f));
if (fails.length) process.exit(1);
console.log('полоски живут: щит тает к концу, здоровье не стоит на сотне, смерти на своих местах');
