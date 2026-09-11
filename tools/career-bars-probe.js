// Что показывают полоски щита и здоровья на самом деле.
//
// Его слово 11 сентября: «по армору, чет нереалистично почему-то всегда 0 почти,
// и 100 здоровья всегда». Замер по кадрам записанной игры: сколько времени щит
// стоит на нуле, сколько здоровье на сотне, и как выглядят медианы по кругам.
//
//   node tools/career-bars-probe.js [игр]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');
const GAMES = Number(process.argv[2] || 12);
const FIELD = fs.readFileSync(path.join(__dirname, 'check-replay-pace.js'), 'utf8')
  .match(/const FIELD = `([\s\S]*?)`;/)[1];

const PAGE = `<!doctype html><meta charset="utf-8"><body><pre id="out"></pre>
<script src="zone-sim.js"><\/script>
<script>
${FIELD}
// Ручки полосок — из окружения, чтобы подбирать не правкой движка: CC_TUNE='{"CHIP_HP":1.4}'.
if(${JSON.stringify(process.env.CC_TUNE||'')} && ZoneSim.tune) ZoneSim.tune(JSON.parse(${JSON.stringify(process.env.CC_TUNE||'')}));
// Команды остаются под рукой: по ним считается, отчего лобби умирает.
var TEAMS=null, _fake=fakeField;
fakeField=function(n){ TEAMS=_fake(n); return TEAMS; };
(function(){
  var out={games:${GAMES}, byZone:{}, sh0:0, hp100:0, n:0, shSum:0, hpSum:0, dead:{}};
  var push=function(z, sh, hp){
    var b=out.byZone[z] || (out.byZone[z]={sh:[], hp:[]});
    b.sh.push(sh); b.hp.push(hp);
    out.n++; out.shSum+=sh; out.hpSum+=hp;
    if(sh<=0) out.sh0++;
    if(hp>=100) out.hp100++;
  };
  for(var g=0; g<${GAMES}; g++){
    var game=record(17+g);
    game.timeline.forEach(function(f){
      (f.dots||[]).forEach(function(d){
        if(!d || !d.alive) return;
        push(f.zone, (d.sh==null?100:d.sh), (d.h==null?100:d.h));
      });
    });
    (TEAMS||[]).forEach(function(t){ var c=t._deathCause || 'alive'; out.dead[c]=(out.dead[c]||0)+1; });
  }
  var med=function(a){ if(!a.length) return null; var b=a.slice().sort(function(x,y){ return x-y; }); return b[Math.floor(b.length/2)]; };
  var lo=function(a, p){ if(!a.length) return null; var b=a.slice().sort(function(x,y){ return x-y; }); return b[Math.floor(b.length*p)]; };
  out.zones=Object.keys(out.byZone).sort(function(a,b){ return a-b; }).map(function(z){
    var b=out.byZone[z];
    return {zone:+z, n:b.sh.length, shMed:med(b.sh), shP10:lo(b.sh,0.1), hpMed:med(b.hp), hpP10:lo(b.hp,0.1),
            sh0:Math.round(b.sh.filter(function(x){ return x<=0; }).length/b.sh.length*100),
            hp100:Math.round(b.hp.filter(function(x){ return x>=100; }).length/b.hp.length*100)};
  });
  delete out.byZone;
  out.shMean=Math.round(out.shSum/out.n*10)/10;
  out.hpMean=Math.round(out.hpSum/out.n*10)/10;
  out.sh0pc=Math.round(out.sh0/out.n*100);
  out.hp100pc=Math.round(out.hp100/out.n*100);
  document.getElementById('out').textContent='BEG'+'IN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bars-'));
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
console.log('игр ' + out.games + ', кадров живых отрядов ' + out.n);
console.log('щит: среднее ' + out.shMean + ', на нуле ' + out.sh0pc + '% времени');
console.log('здоровье: среднее ' + out.hpMean + ', на сотне ' + out.hp100pc + '% времени');
// Причины сводятся к четырём: дуэль (ник соперника), шторм, сёрдж, дожил.
const groups={};
Object.keys(out.dead).forEach(k=>{ const g=(k==='storm'||k==='surge'||k==='alive') ? k : 'duel'; groups[g]=(groups[g]||0)+out.dead[k]; });
const tot=out.games*50;
console.log('отчего умирают: ' + ['duel','storm','surge','alive'].filter(k=>groups[k])
  .map(k => k + ' ' + Math.round(groups[k]/tot*100) + '%').join(', '));
console.log('');
console.log('круг   n     щит: медиана / p10 / нулей%    здоровье: медиана / p10 / сотен%');
out.zones.forEach(z => console.log(
  String(z.zone).padStart(3) + String(z.n).padStart(7) +
  String(Math.round(z.shMed)).padStart(12) + ' /' + String(Math.round(z.shP10)).padStart(4) + ' /' + String(z.sh0).padStart(4) + '%' +
  String(Math.round(z.hpMed)).padStart(14) + ' /' + String(Math.round(z.hpP10)).padStart(4) + ' /' + String(z.hp100).padStart(4) + '%'));
