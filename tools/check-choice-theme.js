// У каждой остановки вечера — своё лицо (его слово 8.09: «в симуляции дизайн докрутить
// каждого выбора по тематике»).
//
// Проверяется:
//   * каждый вызов ccChoiceBox в игре называет свой вид остановки (шестым аргументом);
//   * у каждого названного вида есть тема в CC_CHOICE_THEME, и краски у видов разные;
//   * кольцо рисуется с номером зоны и догорает пропорционально номеру;
//   * полоса шанса появляется только там, где ход назван процентом («65%…», «33 in 100»),
//     и не появляется у ходов без числа;
//   * панель несёт краску момента в --th, а без вида остаётся жёлтой, как была.
//
//   node tools/check-choice-theme.js
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

// ---- сначала исходник: ни один вопрос не должен остаться безымянным ----------
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const calls = [];
let at = 0;
for (;;) {
  const i = src.indexOf('ccChoiceBox(', at);
  if (i < 0) break;
  at = i + 12;
  if (/function\s+$/.test(src.slice(Math.max(0, i - 12), i))) continue;
  // Аргументы вызова: до парной закрывающей скобки.
  let d = 1, j = at;
  for (; j < src.length && d > 0; j++) {
    const c = src[j];
    if (c === '(') d++;
    else if (c === ')') d--;
  }
  const args = src.slice(at, j - 1);
  const line = src.slice(0, i).split('\n').length;
  const kind = (args.match(/,\s*'([a-z]+)'\s*$/) || [])[1] || null;
  calls.push({line, kind});
}
const nameless = calls.filter(c => !c.kind);
if (!calls.length) { console.error('FAILED: вызовов ccChoiceBox не нашлось — проба смотрит не туда'); process.exit(1); }
if (nameless.length) {
  console.error('FAILED: вопрос без вида остановки, строки ' + nameless.map(c => c.line).join(', '));
  process.exit(1);
}
const kinds = [...new Set(calls.map(c => c.kind))].sort();
console.log('  вопросов в игре: ' + calls.length + ', видов: ' + kinds.join(', '));

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out={steps:[], fail:null};
  const fail=m=>{ out.fail=m; throw new Error(m); };
  try{
    const want=${JSON.stringify(kinds)};
    // ---- тема есть у каждого вида, и краски разные --------------------------
    const miss=want.filter(k=>!CC_CHOICE_THEME[k]);
    if(miss.length) fail('нет темы у видов: '+miss.join(', '));
    const paint={};
    want.forEach(k=>{ const t=CC_CHOICE_THEME[k]; (paint[t.th]=paint[t.th]||[]).push(k); });
    const shared=Object.keys(paint).filter(c=>paint[c].length>1)
      .filter(c=>paint[c].some(k=>!/^(farm|build|mats)$/.test(k)));
    if(shared.length) fail('одна краска на разные моменты: '+shared.map(c=>c+' → '+paint[c].join('+')).join('; '));
    out.steps.push('краска момента у каждого вида: '+want.map(k=>k+' '+CC_CHOICE_THEME[k].th).join(', '));

    // ---- кольцо: номер зоны и доля вечера ------------------------------------
    want.forEach(k=>{
      const t=CC_CHOICE_THEME[k], svg=ccChoiceDial(t);
      if(svg.indexOf('>'+t.zone+'<')<0) fail(k+': на кольце нет номера зоны '+t.zone);
      const m=svg.match(/stroke-dasharray="([\\d.]+) ([\\d.]+)"/);
      if(!m) fail(k+': кольцо без дуги');
      const share=+m[1]/+m[2], want2=t.zone/CC_CHOICE_ZONES;
      if(Math.abs(share-want2)>0.02) fail(k+': дуга '+share.toFixed(2)+' против доли вечера '+want2.toFixed(2));
    });
    if(ccChoiceDial(null)!=='') fail('без темы кольцо всё равно рисуется');
    out.steps.push('кольцо несёт номер зоны и догорает по ходу вечера ('+want.length+' видов)');

    // ---- полоса шанса: только там, где ход назван числом ---------------------
    const bar=s=>ccChoiceOdds(s);
    if(bar('65%: held the middle — +6').indexOf('--v:65%')<0) fail('процент не стал полосой');
    if(bar('33 in 100: we clean it up').indexOf('--v:33%')<0) fail('«33 in 100» не стало полосой');
    if(bar('33 из 100: забираем').indexOf('--v:33%')<0) fail('«33 из 100» не стало полосой');
    if(bar('40/60: made it — +4, did not — extra damage').indexOf('--v:40%')<0) fail('«40/60» не стало полосой');
    if(bar('Mats 400 · 500 за круг')!=='') fail('пара, не дающая ста, принята за шанс');
    if(bar('No bonus — and no risk')!=='') fail('полоса появилась там, где числа нет');
    if(bar('+300 mats')!=='') fail('ресы приняты за процент');
    if(bar('120%: невозможное')!=='') fail('процент больше ста принят за шанс');
    if(bar(null)!=='') fail('пустая заметка дала полосу');
    out.steps.push('полоса шанса — только у ходов, названных процентом');

    // ---- панель красится, и без вида остаётся жёлтой -------------------------
    // Панель садится в настоящий #majorStages приложения — свой такой же завести нельзя,
    // getElementById отдаст первый. Поэтому ищем её по всему документу.
    const prevSkip=skipAnimation;
    skipAnimation=false;
    if(typeof careerSimSet==='function') careerSimSet(false);
    if(typeof CC_FF!=='undefined') CC_FF=false;
    const opts=[{id:'a', title:'Один', note:'65%: держим'}, {id:'b', title:'Два', note:'нет числа'}];
    ccChoiceBox('Проба', 'подсказка', opts, null, null, 'rot');
    const box=document.querySelector('#majorStages .cc-choice');
    if(!box) fail('панель не построилась');
    if(box.dataset.th!=='rot') fail('вид остановки не записан в панель: '+box.dataset.th);
    if(box.style.getPropertyValue('--th')!==CC_CHOICE_THEME.rot.th) fail('краска момента не проставлена');
    if(!box.querySelector('.cc-dial')) fail('кольца нет в заголовке');
    const bars=box.querySelectorAll('.cc-odds');
    if(bars.length!==1) fail('полос шанса '+bars.length+', ждали одну');
    box.remove();
    ccChoiceBox('Проба', '', opts, null, null, null);
    const plain=document.querySelector('#majorStages .cc-choice');
    if(plain.dataset.th) fail('панель без вида получила тему');
    if(plain.style.getPropertyValue('--th')) fail('панель без вида получила краску');
    if(plain.querySelector('.cc-dial')) fail('панель без вида получила кольцо');
    plain.remove();
    skipAnimation=prevSkip;
    out.steps.push('панель несёт вид и краску; без вида — как была, жёлтой и без кольца');
  }catch(e){ if(!out.fail) out.fail=String(e && e.stack || e); }
  document.getElementById('__out').textContent='BEG'+'IN'+encodeURIComponent(JSON.stringify(out))+'E'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccth-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=120000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('проба не дала вывода'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
console.log('у каждой остановки вечера своя краска, своё кольцо и свои шансы на виду');
