/* Чем глубже стадия, тем сильнее комната.

   Жалоба тестера, 21 августа: «лобби слабые везде, кроме Глобалов». Она была
   верной, и причина оказалась одна на все турниры: careerRealDuos ровно
   перемешивала пары дивизиона 1 и отдавала первые сколько-нужно, поэтому финал
   Мейджора был случайными пятьюдесятью парами из ста тридцати — ровно той же
   силы, что его собственная квалификация, и той же, что Глобалы. Три стадии
   давали одно и то же число, потому что это был один и тот же бросок.

   Проверяется не абсолютная сила комнаты — она поедет от любой правки
   рейтингов, — а порядок между стадиями, который поехать не должен:

     плей-ин  <  хиты  <  финал        (Мейджор)
     отборы   <  хиты  <  финал        (Reload)

   и что в глубокой комнате вообще стоит верх региона, а не середина.

   node tools/check-career-lobby-depth.js
*/
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) { console.error('Chrome не найден'); process.exit(2); }

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out={rows:{}, err:null};
  const done=()=>{
    try{
      localStorage.clear();
      careerEntry();
      ccPickRole('roleFRG'); ccPickDiv(3); ccPickRegion('EU'); ccPickCountry('de');
      const n=document.getElementById('ccNick');
      n.value='Depth'; n.dispatchEvent(new Event('input',{bubbles:true}));
      if(typeof ccSync==='function') ccSync();
      document.getElementById('ccStart').click();

      const cr=CAREER.career;
      const mine=[careerCard()].concat(careerMates()).filter(Boolean);
      // Комнаты строятся так же, как во время забега.
      CARD_MODE=true; squadSize=careerSquadSize(); drafted=mine.slice();
      const ovrOf=t=>{
        const cs=(t && t.squad) || [];
        const vs=cs.map(c=>(c && (c.ovr!=null?c.ovr:c.rating))||0).filter(v=>v>0);
        return vs.length ? vs.reduce((a,b)=>a+b,0)/vs.length : 0;
      };
      const run=(key, div, size, open, sharp)=>{
        const lob=Object.assign({}, cr, {division:div});
        const f=careerCupField(lob, mine, size, null, !!open, sharp||0)||[];
        const vs=f.map(ovrOf).filter(v=>v>0).sort((a,b)=>b-a);
        if(!vs.length) return;
        out.rows[key]={n:vs.length, top:Math.round(vs[0]),
          mean:Math.round(vs.reduce((a,b)=>a+b,0)/vs.length*10)/10,
          low:Math.round(vs[vs.length-1])};
      };
      run('mjPlayin', cr.division, CC_MAJOR_STAGE.playin.field, false, 0);
      run('mjHeats',  1, CC_MAJOR_STAGE.heats.field, false, CC_FIELD_SHARP.heats);
      run('mjFinal',  1, CC_MAJOR_STAGE.final.field, false, CC_FIELD_SHARP.final);
      run('relOpen',  cr.division, 100, true, 0);
      run('relHeat',  1, 20, false, CC_FIELD_SHARP.heats);
      run('relFinal', 1, 20, false, CC_FIELD_SHARP.final);
      // Верх Европы — по тому же сезонному рейтингу, что и комнаты.
      const pool=(careerPools().players||[])
        .map(p=>(p.ovr!=null?p.ovr:p.rating)||0).filter(v=>v>0).sort((a,b)=>b-a);
      out.euTop=Math.round(pool[0]||0);
      out.euMean=pool.length ? Math.round(pool.reduce((a,b)=>a+b,0)/pool.length*10)/10 : 0;
    }catch(e){ out.err=String(e&&e.stack||e); }
    document.getElementById('__out').textContent=
      'PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
  };
  if(typeof ccMapsReady==='function') ccMapsReady(done); else done();
})();
<\/script>`;

const src = fs.readFileSync(ROOT + '/index.html', 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'depth-'));
const tmp = dir + '/index.html';
const fwd = s => s.split(String.fromCharCode(92)).join('/');
fs.writeFileSync(tmp, '<base href="file:///' + fwd(ROOT) + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=300000', '--dump-dom',
  'file:///' + fwd(tmp)], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('проба не отработала; копия в ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }

const R = out.rows;
const NAME = {mjPlayin:'Мейджор · плей-ин', mjHeats:'Мейджор · хиты',
  mjFinal:'Мейджор · финал', relOpen:'Reload · отборы',
  relHeat:'Reload · хиты', relFinal:'Reload · финал'};
console.log('Европа: верх ' + out.euTop + ', средний ' + out.euMean + '\n');
console.log('стадия                команд   верх  средн    низ');
Object.keys(NAME).forEach(k => {
  const r = R[k]; if (!r) return;
  console.log('  ' + NAME[k].padEnd(20) + String(r.n).padStart(5) +
    String(r.top).padStart(7) + String(r.mean).padStart(7) + String(r.low).padStart(7));
});

let bad = 0;
const check = (ok, what) => { if (!ok) { bad++; console.error('  БАГ  ' + what); }
                             else console.log('  ok   ' + what); };
console.log('');
const need = ['mjPlayin','mjHeats','mjFinal','relOpen','relHeat','relFinal']
  .filter(k => !R[k]);
if (need.length) { console.error('нет замера для: ' + need.join(', ')); process.exit(1); }
// Порядок. Зазор в 2 балла, чтобы шум одного броска не считался за порядок.
const GAP = 2;
check(R.mjHeats.mean  >= R.mjPlayin.mean + GAP, 'хиты Мейджора сильнее плей-ина');
check(R.mjFinal.mean  >= R.mjHeats.mean,        'финал Мейджора не слабее хитов');
check(R.relHeat.mean  >= R.relOpen.mean + GAP,  'хиты Reload сильнее отборов');
check(R.relFinal.mean >= R.relHeat.mean,        'финал Reload не слабее хитов');
// И три стадии не могут быть одним и тем же броском.
check(!(R.mjHeats.mean === R.mjFinal.mean && R.mjHeats.low === R.mjFinal.low),
      'хиты и финал — разные комнаты, а не один бросок');
// Верх региона обязан быть в глубокой комнате: это её смысл.
check(R.mjFinal.top >= out.euTop - 1, 'в финале Мейджора стоит верх Европы');
check(R.relFinal.top >= out.euTop - 1, 'в финале Reload стоит верх Европы');
// А низ глубокой комнаты — выше среднего по региону, иначе это не отбор.
check(R.mjFinal.low > out.euMean, 'слабейший в финале Мейджора выше среднего по Европе');
if (bad) { console.error('\nне сходится: ' + bad); process.exit(1); }
console.log('\nпорядок комнат держится');
fs.rmSync(dir, { recursive: true, force: true });
