// Трансферный список клуба: цена, недельные предложения, отказ, продажа, снятие.
//   node tools/check-mgr-sale.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(String.fromCharCode(92)).join('/');
const CH = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => fs.existsSync(p));
const BOOT = `<pre id="__out" style="display:none"></pre><script>window.addEventListener('load',()=>setTimeout(()=>{ const out={fails:[], notes:{}};
const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d!=null ? ': '+d : '')); };
try{
  localStorage.removeItem('fncsdraft_manager'); MGR_NEW_YEAR=2024; MGR_NEW_REGION='EU'; MGR_NEW_SIDE='real'; mgrOpenNew(2024); mgrTake(0);
  const h=mgrAll()[0], n0=mgrOwned().length;
  mgrSheetOpen(h);
  const btn=document.querySelectorAll('#mgSheet button[onclick*="mgrSaleSet"]');
  check('в карточке игрока три цены', btn.length===3, btn.length);
  btn[0].click();
  check('игрок на трансфере', !!mgrSaleOf(h) && mgrSaleOf(h).ask>0, JSON.stringify(MGR.saleList));
  check('в карточке снять с трансфера', !!document.querySelector('#mgSheet button[onclick*="mgrSaleOff"]'));
  check('список на вкладке переговоров', mgrSaleListHTML().includes(h));
  let m=null, d=CAREER.career.day;
  for(let i=0; i<30 && !m; i++){ d=ccAddDays(d, 7); mgrSaleWeek(d); m=MGR.inbox.find(x=>x.sale); }
  check('предложение пришло', !!m);
  const k=MGR.inbox.length; for(let i=0; i<30; i++){ d=ccAddDays(d, 7); mgrSaleWeek(d); }
  check('пока не отвечено, второго нет', MGR.inbox.length===k, MGR.inbox.length-k);
  if(m){ out.notes.offer={from:m.from, sum:m.sum, ask:mgrSaleOf(h).ask};
    check('сумма рядом с ценой', m.sum>=mgrSaleOf(h).ask*0.85 && m.sum<=mgrSaleOf(h).ask*1.1);
    const mor=mgrMorale(h); mgrInboxDo(m.id, false);
    check('отказ не бьёт мораль', mgrMorale(h)===mor);
    let m2=null; for(let i=0; i<40 && !m2; i++){ d=ccAddDays(d, 7); mgrSaleWeek(d); m2=MGR.inbox.find(x=>x.sale && !x.done); }
    check('после отказа приходит новое', !!m2);
    if(m2){ const cash=MGR.club.cash; mgrInboxDo(m2.id, true);
      check('продан', mgrOwned().length===n0-1 && !mgrOwned().some(x=>hKey(x)===hKey(h)));
      check('деньги пришли', MGR.club.cash===cash+m2.sum, cash+' '+MGR.club.cash+' '+m2.sum);
      check('из списка убран', !mgrSaleOf(h)); } }
  const h2=mgrAll()[0]; mgrSaleSet(h2, 'high'); mgrSaleOff(h2);
  check('снят с трансфера', !mgrSaleOf(h2));
  const D=LANG; ['ru','en','fr','it','pt','de','es'].forEach(l=>{ LANG=l; const T=mgrTSale(); check('строки '+l, ['put','on','off','low','mid','high','hint'].every(x=>T[x])); }); LANG=D;
}catch(e){ out.fails.push(String(e.stack||e)); }
document.getElementById('__out').textContent='@@B@@'+encodeURIComponent(JSON.stringify(out))+'@@E@@'; }, 500));<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mgrsale-')), tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CH, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--virtual-time-budget=300000', '--dump-dom', 'file:///' + tmp.split(String.fromCharCode(92)).join('/')], { maxBuffer: 1 << 30, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const out = JSON.parse(decodeURIComponent(dom.match(/@@B@@([^@<]*)@@E@@/)[1]));
if (out.fails.length) { console.log(['FAIL ' + JSON.stringify(out.notes)].concat(out.fails).join(String.fromCharCode(10))); process.exit(1); }
console.log('OK трансферный список ' + JSON.stringify(out.notes));
