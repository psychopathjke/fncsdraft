// Мнение напарника перед выбором (ccMateOpinion, 7 сентября 2026).
//
// Из его списка идей 6 сентября: «мнение напарника». В дуо с бот-напарником
// под заголовком вопроса стоит строка «<ник>: я бы — «…»», а на кнопке, за
// которую он, — метка с его ником. Проверяется:
//   * в дуо с ботом строка и ровно одна метка есть, строка называет вариант
//     из списка;
//   * напарник осторожен — чаще за ход по умолчанию, но не всегда;
//   * с живым напарником (мультиплеер) и в соло строки нет;
//   * мнение не меняет ответ: клик по другой кнопке отдаёт другую кнопку;
//   * под симуляцией панель не строится и берётся ход по умолчанию;
//   * строка словаря есть во всех пяти языках.
//
//   node tools/check-career-mate-opinion.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const HEAD = `<script>
window.__errs = [];
window.addEventListener('error', function(e){ window.__errs.push(String(e.message) + ' @' + e.lineno); });
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {steps: [], errs: null, fail: null};
  const fail = m => { out.fail = m; throw new Error(m); };
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Duo', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:500, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    skipAnimation=false; CC_CHOICE_WAIT=60000;
    const host=document.createElement('div'); document.body.appendChild(host);
    const opts=()=>[{id:'a', title:'Alpha'}, {id:'b', title:'Bravo', def:true}, {id:'c', title:'Charlie'}];

    // ---- дуо с ботом ----------------------------------------------------------
    careerSquadSize=()=>2; ccMpOn=()=>false; careerMates=()=>[{handle:'Mate', ovr:85}];
    let picks={dflt:0, other:0};
    for(let i=0; i<40; i++){
      const p=ccChoiceBox('T', 'hint', opts(), host);
      await new Promise(r=>setTimeout(r, 0));
      const box=host.querySelector('.cc-choice');
      if(!box) fail('no panel');
      const line=box.querySelector('.cc-choice-mate');
      if(!line || !/Mate/.test(line.textContent)) fail('no mate line: '+(line && line.textContent));
      const marked=box.querySelectorAll('.cc-choice-btn.mate');
      if(marked.length!==1) fail('mate marks: '+marked.length);
      if(marked[0].dataset.mate!=='Mate') fail('the mark carries '+marked[0].dataset.mate);
      const title=marked[0].querySelector('.cc-choice-tt b').textContent;
      if(!line.textContent.includes(title)) fail('the line «'+line.textContent+'» does not name «'+title+'»');
      if(marked[0].classList.contains('def')) picks.dflt++; else picks.other++;
      // Мнение не меняет ответ: жмём Alpha, получаем Alpha.
      box.querySelector('.cc-choice-btn[data-at="0"]').click();
      if((await p).id!=='a') fail('the answer followed the mate, not the click');
    }
    if(!(picks.dflt>picks.other)) fail('the bot mate is not cautious: default '+picks.dflt+', other '+picks.other);
    if(!(picks.other>0)) fail('the bot mate never disagrees with the default in 40 questions');
    out.steps.push('duo with a bot mate: one line, one mark, names an option; default '+picks.dflt+' / other '+picks.other+' of 40; the click wins');

    // ---- живой напарник и соло — молчат -----------------------------------------
    ccMpOn=()=>true;
    let p=ccChoiceBox('T', 'hint', opts(), host); await new Promise(r=>setTimeout(r, 0));
    if(host.querySelector('.cc-choice-mate')) fail('a human partner got a bot line');
    host.querySelector('.cc-choice-btn[data-at="1"]').click(); await p;
    ccMpOn=()=>false; careerSquadSize=()=>1;
    p=ccChoiceBox('T', 'hint', opts(), host); await new Promise(r=>setTimeout(r, 0));
    if(host.querySelector('.cc-choice-mate')) fail('a solo evening got a mate line');
    host.querySelector('.cc-choice-btn[data-at="1"]').click(); await p;
    out.steps.push('multiplayer and solo: no line');

    // ---- под симуляцией — ход по умолчанию без панели ----------------------------
    careerSquadSize=()=>2; careerSimSet(true);
    const r=await ccChoiceBox('T', 'hint', opts(), host);
    careerSimSet(false);
    if(r.id!=='b' || host.querySelector('.cc-choice')) fail('simulation built a panel or missed the default: '+r.id);
    out.steps.push('simulation: default, no panel');

    // ---- словарь ------------------------------------------------------------------
    ['ru','en','fr','it','pt'].forEach(l=>{ LANG=l; CC_L_CACHE={}; const D=L();
      if(typeof D.ccMateLeans!=='function' || !D.ccMateLeans('x').includes('x')) fail(l+': ccMateLeans is missing'); });
    out.steps.push('five languages carry the line');
  } catch(e){ if(!out.fail) out.fail = String(e && e.message || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEG'+'IN' + encodeURIComponent(JSON.stringify(out)) + 'E'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccmate-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=120000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if ((out.errs||[]).length) console.error('page errors: ' + out.errs.join(' | '));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
if ((out.errs||[]).length) process.exit(1);
console.log('the bot mate has an opinion before every choice, and only an opinion');
