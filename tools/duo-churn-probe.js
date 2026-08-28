// Доживают ли записанные дуо до пятого сезона — и какие.
//
// Его слово, 27 августа: «еще дуосы не меняются после трио почти одни и теже,
// у меня 2030 год, скай скролл до сих пор играют».
//
// Пары берутся из записанного снимка года, а развести их мог только
// CAREER.splits — который на границе сезона стирался. Здесь считается, сколько
// пар остаётся в пуле каждый сезон и что происходит с верхушкой поимённо.
//
//   node tools/duo-churn-probe.js [папка сборки]

const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = (process.argv[2] || path.resolve(__dirname, '..')).replace(/\\/g, '/');
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
  const out={err:null, seasons:[], top:{}, churn:null};
  try{
    const seed=(season)=>{
      localStorage.setItem('fncsdraft_career', JSON.stringify({
        v:1, player:{nick:'Churn', age:20, source:'rookie', country:'de', countryPing:15,
          closeRangeEdge:0, region:'EU', ovr:93, role:'roleIGL',
          attrs:ccRookieAttrs(93,'roleIGL'), ageEdge:0, photo:null,
          handle:null, cardRegion:null, nat:null},
        career:{season:season, day:'2026-02-02', division:1, earnings:0, balance:0,
                reach:9000, tokens:[], log:[], news:[], seed:'fixed-world'},
        partners:[]}));
      careerLoad();
      ccWorldReset();
    };
    out.churn=(typeof CC_DUO_CHURN!=='undefined') ? CC_DUO_CHURN : null;

    // Верхушка снимка первого сезона — за ней и следим.
    seed(1);
    const base=careerRealDuos(new Set(), careerRng(1), 1, 400, null)||[];
    const keyOf=d=>d.cards.map(c=>hKey(c)).sort().join('+');
    const nameOf=d=>d.cards.map(c=>c.handle).join(' & ');
    const watch=base.slice().sort((a,b)=>ccDuoOvr(b)-ccDuoOvr(a)).slice(0,10)
                    .map(d=>({k:keyOf(d), n:nameOf(d)}));

    for(let s=1;s<=6;s++){
      seed(s);
      const duos=careerRealDuos(new Set(), careerRng(1), 1, 400, null)||[];
      const live=new Set(duos.map(keyOf));
      // И что от этого становится с комнатой: сколько команд поля реальные.
      const me=careerCard();
      const field=careerCupField(CAREER.career, [me], careerCupSize(1), null);
      const isReal=t=>(t.squad||[]).every(c=>c && c.tier!=='ladder');
      const real=field.filter(isReal).length;
      out.seasons.push({сезон:s, год:2025+s, парВПуле:duos.length,
                        изВерхушкиЖивы:watch.filter(w=>live.has(w.k)).length,
                        командВПоле:field.length, реальных:real,
                        доляРеальных:Math.round(real/field.length*100)+'%'});
      watch.forEach(w=>{ (out.top[w.n]=out.top[w.n]||[]).push(live.has(w.k)?1:0); });
    }
  }catch(e){ out.err=String(e&&e.stack||e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'duochurn-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=600000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')],
  {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log('CC_DUO_CHURN = ' + out.churn);
console.log('');
console.log('сезон  год   пар в пуле  из топ-10   реальных команд в поле');
out.seasons.forEach(r => console.log('  ' + String(r.сезон).padStart(2) + '   ' + r.год +
  '      ' + String(r.парВПуле).padStart(4) + '        ' + r.изВерхушкиЖивы + ' / 10' + '      ' + String(r.реальных).padStart(3) + ' / ' + r.командВПоле + '  (' + r.доляРеальных + ')'));
console.log('');
console.log('верхушка по сезонам (1 = вместе):');
Object.keys(out.top).forEach(n => console.log('  ' + n.padEnd(28) + out.top[n].join(' ')));
