// FNCS 2024 в режиме драфта: три плитки Мейджоров и год, свой круг, Форт-Уэрт.
//
// Его слово 21 сентября 2026 («3456789 делай», п. 7): в карьере год 2024-й есть, в драфте
// плиток не было. Круг 2024-го — не машина хитов: открытый квалификатор → очки серии →
// полуфинал в две сетки → финал на 50 (DRAFT_M24, масштаб под поле драфта). Проверяется:
// плитки ведут на наборы f1–f3 с непустым ростером, год — цепочка трёх; круг Мейджора 3
// доходит до карточки итогов, платит по таблице 2024-го и, когда место взято, летит в
// Форт-Уэрт (пробуем до N раз лучшими картами Европы); Мейджор 1 без ЛАНа тоже доигрывается.
//
//   node tools/check-draft-2024.js [attempts]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const ATTEMPTS = +(process.argv[2] || 10);
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<pre id="__probe" style="display:none"></pre>
<script>
(async function(){
  const out={fails:[], notes:{}, err:null, errs:[]};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  window.addEventListener('error', e=>{ out.errs.push(String(e.message)+' @'+e.lineno); });
  try{
    showFinalsLandingPicker=function(){ return Promise.resolve(new Map()); };
    pickInitialZone=function(){ return Promise.resolve(new Map()); };
    stageLandingPicker=function(){ return Promise.resolve(new Map()); };
    offerSquadChoice=function(){ return Promise.resolve('a'); };
    // ---- плитки ------------------------------------------------------------
    check('плитки 2024 на лендинге', !!document.querySelector('[onclick*="cards2024major3"]') && !!document.querySelector('[onclick*="year2024"]'));
    ['cards2024','cards2024major2','cards2024major3','year2024'].forEach((k,i)=>{
      chooseMode(2, k);
      check('плитка '+k+' → набор '+['f1','f2','f3','f1'][i], pendingCardSet===['f1','f2','f3','f1'][i], String(pendingCardSet));
      check('и ростер набора не пуст', cardRosterPlayers(pendingCardSet).length>100, String(cardRosterPlayers(pendingCardSet).length));
    });
    check('год 2024 — цепочка трёх Мейджоров', JSON.stringify(YEAR_CHAINS.year2024)==='["f1","f2","f3"]');
    check('словари: пять языков знают Форт-Уэрт', ['ru','en','fr','it','pt'].every(l=>{ const d=I18N[l]; return d && typeof d.gc2024Champion==='string' && typeof d.gc2024QualifiedNote==='function' && typeof d.modeFncs2024Desc==='string'; }));
    // ---- Мейджор 3 → Форт-Уэрт ---------------------------------------------
    chooseMode(2, 'cards2024major3');
    CARD_SET='f3'; CARD_MODE=true; squadSize=2; isMajorMode=true; YEAR_KEY=null;
    useLandingSet('f3');
    const roster=cardRosterPlayers('f3').filter(p=>p.region==='EU').sort((a,b)=>b.rating-a.rating);
    let reached=false, last=null;
    for(let n=1; n<=${ATTEMPTS} && !reached; n++){
      drafted=roster.slice(0, 2); skipAnimation=true;
      await runMajorTournament();
      const cards=[].slice.call(document.querySelectorAll('#majorStages .stage-card, #runSummary .stage-card')).map(c=>{ const h=c.querySelector('h4'); return h ? h.textContent.trim() : '(no title)'; });
      last={run:n, cards, places:runPlaces.map(p=>p.title+' #'+p.rank+'/'+p.total), earnings:runEarnings.map(e=>e.label+' = '+e.amount), seat:runLanSeat};
      reached=cards.some(t=>/Форт-Уэрт|Fort Worth/.test(t)) && cards.some(t=>/Итоги симуляции|Your run/.test(t));
    }
    out.notes.last=last;
    check('круг Мейджора 3 доходит до итогов', last && last.cards.some(t=>/Итоги симуляции|Your run/.test(t)), JSON.stringify(last && last.cards));
    check('за '+${ATTEMPTS}+' попыток лучшими картами Европы место в Форт-Уэрт взято и ЛАН сыгран', reached, JSON.stringify(last && last.places));
    check('финал платит по таблице 2024-го (EU №1 — $170 000 на дуо)', prizeFor('EU', 1)===170000 && prizeFor('EU', 50)===1000, prizeFor('EU',1)+'/'+prizeFor('EU',50));
    check('Форт-Уэрт платит своей таблицей', prizeFor('GC2024', 1)===400000, String(prizeFor('GC2024', 1)));
    check('строка места на LAN названа Форт-Уэртом', last && last.seat && /Форт-Уэрт|Fort Worth/.test(last.seat.event), JSON.stringify(last && last.seat));
    check('без ошибок JS', out.errs.length===0, out.errs.slice(0,3).join(' | '));
    // ---- Мейджор 1: круг без ЛАНа тоже кончается итогами -------------------
    chooseMode(2, 'cards2024'); CARD_SET='f1'; CARD_MODE=true; squadSize=2; isMajorMode=true; useLandingSet('f1');
    const r1=cardRosterPlayers('f1').filter(p=>p.region==='EU').sort((a,b)=>b.rating-a.rating);
    drafted=r1.slice(40, 42); skipAnimation=true;
    await runMajorTournament();
    const c1=[].slice.call(document.querySelectorAll('#majorStages .stage-card, #runSummary .stage-card')).map(c=>{ const h=c.querySelector('h4'); return h ? h.textContent.trim() : '(no title)'; });
    out.notes.m1=c1;
    check('Мейджор 1 начинается открытым квалификатором', c1.length>0 && /квалификатор|Open Qualifier/.test(c1[0]), c1[0]);
    check('и заканчивается карточкой (итоги или вылет)', c1.some(t=>/Итоги симуляции|Your run/.test(t)) || document.getElementById('finalBanner').style.display==='block', JSON.stringify(c1));
    check('без ошибок JS', out.errs.length===0, out.errs.slice(0,3).join(' | '));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__probe').textContent='BEGINPROBE'+encodeURIComponent(JSON.stringify(out))+'ENDPROBE';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'd24-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
  '--virtual-time-budget=900000', '--dump-dom', 'file:///' + tmp.replace(/\\/g, '/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const m = dom.match(/BEGINPROBE((?:%[0-9A-Fa-f]{2}|[A-Za-z0-9!'()*\-._~])+)ENDPROBE/);
if (!m) { console.error('проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.notes.last) { console.log('  последний круг: ' + JSON.stringify(out.notes.last.places)); console.log('  деньги: ' + JSON.stringify(out.notes.last.earnings)); console.log('  карточки: ' + JSON.stringify(out.notes.last.cards)); }
if (out.err) { console.error(out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.error('FAILED: ' + f)); process.exit(1); }
console.log('FNCS 2024 в драфте: три плитки и год, свой круг, Форт-Уэрт после третьего Мейджора');
