// Сколько стоит просчитать ЧУЖОЙ хит — то есть можно ли собирать финалы
// целиком из результатов, а не посевом.
//
// Его вопрос, 27 августа: «а могут всегда из симуляции собирать». Могут, если
// вечер заведёт и соседние хиты: движок для чужих лобби уже есть (внутри одной
// игры так считаются все лобби, кроме показываемого). Вопрос в цене.
//
// Здесь она меряется прямо: сколько миллисекунд занимает одна игра лобби на
// пятьдесят команд без карты и без показа, и во что это выливается за вечер.
//
//   node tools/heat-sim-cost-probe.js [повторов]

const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const REPS = +(process.argv[2] || 40);
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
  const out={err:null, ms:null, reps:${REPS}, per:null, plan:null};
  try{
    squadSize=2; CARD_MODE=true;
    useLandingSet('m2');
    const make=(n)=>{
      const a=[];
      for(let i=0;i<n;i++){
        const h='b'+i;
        a.push({name:'T'+i, pow:90+(i%21), closeEdge:0,
                squad:[{handle:h+'a', rating:60},{handle:h+'b', rating:60}], _uid:i});
      }
      return a;
    };
    // Одна игра чужого лобби — ровно тот вызов, каким считаются чужие лобби
    // внутри simulateGamesLive: без карты, без кадров, без показа.
    const t0=performance.now();
    for(let r=0;r<${REPS};r++){
      const lobby=make(50);
      lobby.forEach(t=>{ t._elims=0; t._feed=[]; });
      simulateGame(lobby, null);
    }
    const t1=performance.now();
    out.ms=Math.round(t1-t0);
    out.per=Math.round((t1-t0)/${REPS}*100)/100;
    /* Во что это выливается. Глубокий регион: три хита по пятьдесят, пять игр.
       Свой уже считается, значит доплата — два хита. У Reload: отбор даёт
       восемьдесят, хит на двадцать, то есть четыре хита по восемь игр,
       доплата — три. */
    out.plan={
      мейджорДоплатаИгр: 2*5,
      мейджорДоплатаМс: Math.round(out.per*2*5),
      reloadДоплатаИгр: 3*8,
      reloadДоплатаМс: Math.round(out.per*3*8)
    };
  }catch(e){ out.err=String(e&&e.stack||e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'heatcost-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=300000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')],
  {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log('одна игра лобби на 50 команд: ' + out.per + ' мс (' + out.reps + ' повторов, ' + out.ms + ' мс всего)');
console.log(JSON.stringify(out.plan, null, 1));
