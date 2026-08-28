// Те же ли выдуманные соперники от недели к неделе в низких дивизионах.
//
// Его слово, 27 августа: «мне кажется прибавлять должны и отбавлять все, смотря
// на результаты». Реальные люди сцены так и живут (careerGrowField), а
// выдуманные из лестницы книгой роста пропускаются — `if(c.tier==='ladder')`.
// Это не решение, а следствие: careerSeed сеется КАЛЕНДАРНОЙ НЕДЕЛЕЙ, значит
// на следующей неделе генератор выдаёт других людей, и расти некому.
//
// Здесь это проверяется прямо: одна карьера, один дивизион, четыре недели
// подряд — сколько ников повторяется.
//
//   node tools/ladder-persist-probe.js [дивизион] [папка сборки]

const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const DIV = +(process.argv[2] || 4);
const ROOT = (process.argv[3] || path.resolve(__dirname, '..')).replace(/\\/g, '/');
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
  const out={err:null, weeks:[], overlap:[], div:${DIV}};
  try{
    const days=careerYearDays();
    const cups=[];
    for(let d=CC_YEAR_FROM; d<=CC_YEAR_TO && cups.length<4; d=ccAddDays(d,1))
      if((days.get(d)||[]).some(e=>e.kind==='cup')) cups.push(d);

    const rosterOf=(day)=>{
      localStorage.setItem('fncsdraft_career', JSON.stringify({
        v:1, player:{nick:'Lad', age:20, source:'rookie', country:'de', countryPing:15,
          closeRangeEdge:0, region:'EU', ovr:70, role:'roleIGL',
          attrs:ccRookieAttrs(70,'roleIGL'), ageEdge:0, photo:null,
          handle:null, cardRegion:null, nat:null},
        career:{season:1, day:day, division:${DIV}, earnings:0, balance:0,
                reach:0, tokens:[], log:[], news:[], seed:'fixed-world'},
        partners:[]}));
      careerLoad(); ccWorldReset();
      const me=careerCard();
      const field=careerCupField(CAREER.career, [me], careerCupSize(${DIV}), null);
      const names=new Set();
      field.forEach(t=>(t.squad||[]).forEach(c=>{ if(c && c.handle) names.add(hKey(c)); }));
      return names;
    };

    let prev=null;
    cups.forEach((d,i)=>{
      const n=rosterOf(d);
      let same=0;
      if(prev) n.forEach(k=>{ if(prev.has(k)) same++; });
      out.weeks.push({неделя:i+1, день:d, людей:n.size,
                      совпалоСПрошлой: prev ? same : null,
                      доля: prev && n.size ? Math.round(same/n.size*100)+'%' : '—'});
      prev=n;
    });
  }catch(e){ out.err=String(e&&e.stack||e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ladderp-'));
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
console.log('дивизион ' + out.div);
console.log('неделя  день         людей   совпало с прошлой');
out.weeks.forEach(w => console.log('   ' + w.неделя + '    ' + w.день + '    ' +
  String(w.людей).padStart(4) + '     ' +
  (w.совпалоСПрошлой == null ? '—' : w.совпалоСПрошлой + '  (' + w.доля + ')')));
