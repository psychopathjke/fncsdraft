// Больше реплик (его слово 7.10: «просто больше фраз добавить, реплаи тимейту, менеджеру и т.д.»).
// Правило: на всех пяти языках каждая доп. реплика лички разворачивается без меток и без undefined/NaN; пулы реплаев
// под постами длиннее исходных; одна и та же реплика тиммейта в разные дни звучит по-разному (не одна фраза навсегда);
// старое сообщение без номера варианта читается как раньше.
//   node tools/check-lines-more.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(String.fromCharCode(92)).join('/');
const CH = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => fs.existsSync(p));
const BOOT = `<pre id="__out" style="display:none"></pre><script>window.addEventListener('load',()=>setTimeout(()=>{ const out={fails:[], notes:{}};
try{
  const sample=['3', '50', 'Vitality', '12,000', '2026-03-14'];
  ['ru','en','fr','it','pt'].forEach(lang=>{
    LANG=lang; CC_L_CACHE={};
    const M=CC_LINES_MORE[lang]||{}; let n=0, bad=0;
    Object.entries(M.dm||{}).forEach(([k, arr])=>arr.forEach(tpl=>{ n++;
      const s=ccMoreFill(tpl, [3, 50, 'Vitality', '2026-03-14']);
      if(/[{}]|undefined|NaN/.test(s)){ bad++; if(bad<4) out.fails.push(lang+' '+k+': '+s); } }));
    const co=Object.keys(M.co||{}); let longer=0;
    co.forEach(k=>{ if(L()[k].length > (I18N[lang][k]||I18N.en[k]).length) longer++; });
    out.notes[lang]={dm:n, co:co.length, longer};
    if(n<300) out.fails.push(lang+': доп. реплик лички '+n);
    if(longer<co.length) out.fails.push(lang+': пулы реплаев не выросли ('+longer+' из '+co.length+')');
  });
  LANG='ru'; CC_L_CACHE={};
  // Разговор с тиммейтом: одна и та же реплика в разные дни.
  localStorage.removeItem('fncsdraft_career');
  const t={id:'probe-mate', who:{handle:'ProbeMate'}, msgs:[]};
  const texts=new Set();
  const day0=CC_YEAR_FROM;
  CAREER={career:{season:1, day:day0}, player:{}};
  for(let d=0; d<12; d++){ CAREER.career.day=ccAddDays(day0, d); careerDmPush(t, 'them', 'dmMateGood', [3]); texts.add(ccText(t.msgs[t.msgs.length-1])); }
  out.notes.mateGoodDistinct=texts.size; out.notes.sample=[...texts].slice(0,4);
  if(texts.size<3) out.fails.push('dmMateGood за 12 дней — '+texts.size+' разных фраз');
  // Старый сейв: сообщение без vi — исходная фраза.
  const old={from:'them', k:'dmMateGood', a:[3]};
  if(ccText(old)!==L().dmMateGood(3)) out.fails.push('старое сообщение читается не как раньше: '+ccText(old));
}catch(e){ out.fails.push(String(e.stack||e)); }
document.getElementById('__out').textContent='@@B@@'+encodeURIComponent(JSON.stringify(out))+'@@E@@'; }, 500));<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lines-')), tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CH, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--virtual-time-budget=60000', '--dump-dom', 'file:///' + tmp.split(String.fromCharCode(92)).join('/')], { maxBuffer: 1 << 30, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const out = JSON.parse(decodeURIComponent(dom.match(/@@B@@([^@<]*)@@E@@/)[1]));
if (out.fails.length) { console.log(['FAIL ' + JSON.stringify(out.notes)].concat(out.fails).join(String.fromCharCode(10))); process.exit(1); }
console.log('OK больше реплик ' + JSON.stringify(out.notes));
