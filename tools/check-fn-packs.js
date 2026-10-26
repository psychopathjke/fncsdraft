// Паки за деньги в магазине карьеры (Notion «26.10.26»: «add packs for money example: polar legends pack, agency renegades
// pack»; его «паки за деньги пусть будут, какие были в игре»).
//   * 26.12.2019 в магазине стоит Polar Legends Pack, цена — $22.99 × множитель региона;
//   * покупка списывает баланс, кладёт все предметы пака в шкафчик, второй раз не продаётся;
//   * через 30 дней после выхода пака в магазине нет.
//
//   node tools/check-fn-packs.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');
const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
window.__errs=[]; window.addEventListener('error', e=>window.__errs.push(String(e.message)+' @'+e.lineno));
window.addEventListener('load', function(){
  const out={steps:[], fail:null};
  const fail=m=>{ out.fail=m; throw new Error(m); };
  const done=()=>{ out.errs=window.__errs; document.getElementById('__out').textContent='BEG'+'IN'+encodeURIComponent(JSON.stringify(out))+'E'+'ND'; };
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({v:1, player:{nick:'Packer', age:20, source:'rookie', country:'de',
      countryPing:15, closeRangeEdge:6, region:'EU', ovr:80, role:'roleIGL', attrs:null, ageEdge:4},
      career:{season:1, year:2019, year0:2019, day:'2019-12-26', division:1, earnings:0, balance:100, reach:0, tokens:[], log:[], news:[]}, partner:null}));
    careerEntry();
    ccFnShopLoad(function(){
      try{
        const pk=ccFnPacksToday('2019-12-26'), polar=pk.find(p=>p.name==='Polar Legends Pack');
        if(!polar) fail('no Polar Legends Pack on 26 Dec 2019: '+pk.map(p=>p.name).join(', '));
        const want=Math.round(22.99*(CC_VB_REGION[ccCareerRegion()]||1)*100)/100;
        if(polar.usd!==want) fail('price '+polar.usd+' instead of '+want);
        careerRenderHub('items');
        const tile=[...document.querySelectorAll('.cc-fn-packs .cc-fn-pack b')].find(b=>b.textContent==='Polar Legends Pack');
        if(!tile) fail('the shop does not draw the pack');
        out.steps.push('26.12.2019: Polar Legends Pack in the shop at $'+polar.usd+' ('+polar.its.length+' items)');
        const bal=CAREER.career.balance;
        ccFnBuyPack(polar.k);
        if(Math.abs(CAREER.career.balance-(bal-polar.usd))>0.001) fail('balance '+CAREER.career.balance+' after buying');
        const own=ccFnOwn(); if(!polar.its.every(it=>own[it.id])) fail('not every item of the pack is in the locker');
        const b2=CAREER.career.balance; ccFnBuyPack(polar.k);
        if(CAREER.career.balance!==b2) fail('the pack was sold twice');
        out.steps.push('bought: $'+polar.usd+' off the balance, '+polar.its.length+' items in the locker, not sold twice');
        if(ccFnPacksToday('2020-02-10').some(p=>p.name==='Polar Legends Pack')) fail('the pack is still in the shop 48 days later');
        out.steps.push('gone from the shop after 30 days');
      }catch(e){ if(!out.fail) out.fail=String(e && e.message || e); }
      localStorage.clear(); done();
    });
  }catch(e){ if(!out.fail) out.fail=String(e && e.message || e); done(); }
});
<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccpacks-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files',
  '--user-data-dir=' + path.join(dir, 'prof'), '--virtual-time-budget=60000','--dump-dom','file:///' + tmp.replace(/\\/g,'/')],
  {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/BEGIN([\w%\-.!~*'()]*)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if ((out.errs||[]).length) console.error('page errors: ' + out.errs.join(' | '));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
if ((out.errs||[]).length) process.exit(1);
console.log('real-money packs are in the career shop');
