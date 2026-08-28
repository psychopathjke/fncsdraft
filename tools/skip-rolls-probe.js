// Сколько бросков тратит КОМАНДНЫЙ вечер — со скипом и без.
//
// Его скрины, 28 августа: два клиента одного лобби показали разные вечера —
// топ-75 и победители MALIBUCA+TH0MASHD против #117 и MOMSY+SKYJUMP. Оба
// считают под ОДНИМ сидом сервера, значит разойтись они могут одним способом:
// потратив РАЗНОЕ ЧИСЛО бросков. Тогда поток сдвигается, и дальше всё чужое.
//
// Меряется именно командный путь: в одиночной карьере пропуск НАРОЧНО уводит
// своё лобби на другой расчёт (simulateGame вместо показа с вопросами), и
// разница там ожидаемая. В команде этого нет — mine от пропуска не зависит, —
// поэтому любая разница здесь и есть та самая поломка.
//
// Считаются броски СЕЯННОГО генератора: сид вечера ставится поверх Math.random
// (ccMpSeedOn), поэтому счётчик вешается на careerRng — на то, из чего этот
// генератор и делается.
//
//   node tools/skip-rolls-probe.js [день]

const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const DAY = process.argv[2] || '2026-01-05';   // Дуо Виктори Кап 1 — его случай
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BASE = '<base href="file:///' + ROOT + '/">';
const head = `<script>
window.__errs=[];
window.addEventListener('error', function(e){ window.__errs.push(String(e.message)+' @'+e.lineno); });
<\/script>`;

const boot = (skip) => `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={notes:{}, fail:null};
  const wait=ms=>new Promise(r=>setTimeout(r, ms));
  try{
    // Счётчик на генераторе карьеры: из него сделан сид вечера.
    window.__rolls=0;
    const realRng=careerRng;
    careerRng=function(seed){
      const g=realRng(seed);
      return function(){ window.__rolls++; return g(); };
    };

    setInterval(function(){
      const am=document.getElementById("ccAskModal");
      if(am && am.style.display==="flex"){ const no=document.getElementById("ccAskNo");
        if(no && no.textContent===L().ccSpotGatePlay){ no.click(); return; } }
      const c0=document.querySelector(".cc-choice-btn"); if(c0){ c0.click(); return; }
      const p=document.querySelector(".landing-picker"); if(!p) return;
      const z=p.querySelectorAll(".land-zone"); if(!z.length) return;
      z[0].click();
      const c=p.querySelector("#gameLandingConfirm"); if(c && !c.disabled) c.click();
    }, 20);

    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Rolls', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:93, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'${DAY}', division:1, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[], seed:'fixed-world',
              mp:{code:'ABC123', role:'a'}}, partner:null}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs=ccRookieAttrs(93,'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));

    // Подставное лобби: напарник всегда голосует так же и всегда «дошёл».
    let n=0;
    MP.connect=function(){ MP.state='live'; return Promise.resolve(); };
    MP.send=function(m){
      if(!m) return;
      if(m.t==='ready') return MP.say({t:'start', seed:'team-РОВНО|${DAY}', n:++n, day:m.day});
      if(m.t==='act'){
        // Эхо, и ответ за напарника на его вопросы — см. check-mp-seed.
        MP.say({t:'act', kind:m.kind, n:++n, by:'peer',
                payload:{v:m.payload && m.payload.v, by:'peer'}});
        const base=String(m.kind).replace(/@$/, '');
        const canned={drop:{id:'quiet'}, loot:'take', late:'hg'};
        if(/@$/.test(m.kind) && canned.hasOwnProperty(base))
          MP.say({t:'act', kind:base, n:++n, by:'peer',
                  payload:{v:canned[base], by:'peer'}});
        return;
      }
      if(m.t==='digest')return MP.say({t:'close', team:m.team, n:++n});
    };
    MP.state='live';
    MP.peer={handle:'howly', nat:'ru', region:'EU', rating:92, org:null, tier:'ranked',
             event:'', placement:null, _targetOvr:92, _attrs:null, _roleKey:'roleFRG',
             form:0, tired:0, sick:false, camp:null, gear:[], sim:false};
    careerEntry();
    out.notes.событие=(careerNext()||{}).title||'—';

    const play=document.querySelector('#screen-career-hub .ch-play');
    if(!play){ out.fail='нет кнопки вечера'; throw new Error(out.fail); }
    const before=window.__rolls;
    const sk=setInterval(()=>{ if(!${skip?'true':'false'}) return;
      const b=document.getElementById('majorSkipBtn');
      if(b && !b.disabled) b.click(); }, 20);
    play.click();
    let card=null;
    for(let i=0;i<16000 && !card;i++){
      await wait(25);
      card=[...document.querySelectorAll('#majorStages .stage-card')]
        .find(c=>c.querySelector('button[onclick*="careerBackToHub"]'));
    }
    clearInterval(sk);
    if(!card){ out.fail='результат не пришёл'; throw new Error(out.fail); }
    out.notes.бросковЗаВечер=window.__rolls-before;
    out.notes.строк=document.querySelectorAll(
      '#majorStages .stage-card table.lobby-table tbody tr').length;
    out.notes.таблица=[...document.querySelectorAll(
      '#majorStages .stage-card table.lobby-table tbody tr')].slice(0,3)
      .map(tr=>[...tr.children].map(td=>td.textContent.trim()).join(' ')).join(' / ');
  }catch(e){ if(!out.fail) out.fail=String(e && e.stack || e); }
  out.errs=(window.__errs||[]).slice(0,2);
  document.getElementById('__out').textContent=
    'PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const run = (tag, skip) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'skiproll-'));
  const tmp = path.join(dir, 'index.html');
  fs.writeFileSync(tmp, BASE + head + src + boot(skip));
  const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
    '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
    'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
  const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
  if (!m) { console.error(tag + ': проба не отработала, копия ' + tmp); process.exit(2); }
  const out = JSON.parse(decodeURIComponent(m[1]));
  if (out.fail) { console.error(tag + ': ' + out.fail); process.exit(1); }
  if (out.errs && out.errs.length) console.error(tag + ' ошибки страницы: ' + out.errs.join(' | '));
  fs.rmSync(dir, { recursive: true, force: true });
  return out.notes;
};

const a = run('без скипа', false);
const b = run('со скипом', true);
console.log('день ' + DAY + ' · ' + (a.событие || '—') + ' · КОМАНДНЫЙ вечер');
console.log('  без скипа: бросков ' + a.бросковЗаВечер + ', строк ' + a.строк);
console.log('             ' + a.таблица);
console.log('  со скипом: бросков ' + b.бросковЗаВечер + ', строк ' + b.строк);
console.log('             ' + b.таблица);
if (a.бросковЗаВечер === b.бросковЗаВечер && a.таблица === b.таблица)
  console.log('СОШЛОСЬ — пропуск общий поток не трогает');
else
  console.log('РАЗОШЛОСЬ: разница ' + Math.abs(a.бросковЗаВечер - b.бросковЗаВечер) +
              ' бросков' + (a.таблица === b.таблица ? '' : ', и таблицы разные'));
