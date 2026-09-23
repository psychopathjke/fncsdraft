// Рейтинг выдуманных тоже двигается — но своей книгой и с потолком.
//
// Его слово 23 сентября: «чтобы рейтинг у игрока и ботов мог понижаться от
// слишком плохих результатов, и чтобы он у ботов мог и повышаться — потому что
// он вообще не меняется». Диагностика (tools/ladder-grow-diag.js, дивизион 4)
// сказала то же числом: в поле 1259 человек, 1258 из них выдуманные, а книга
// роста после вечера пустая. Ниже Дивизиона 1 не двигался никто.
//
// Проверяется здесь: комната низкого дивизиона и правда почти вся выдуманная;
// после вечера её люди лежат в СВОЕЙ книге (CAREER.devL), а не в книге сцены
// (CAREER.dev); книга не длиннее потолка; сдвиги идут в обе стороны; и сдвиг
// доезжает до самой карточки — careerLadderPlayer собирает её из полосы и про
// книгу сам бы не узнал.
//
//   node tools/check-career-ladder-growth.js [дивизион]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const DIV = +(process.argv[2] || 4);
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');
const SL = String.fromCharCode(92);
const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out={steps:[], fails:[], notes:{}, err:null, errs:[]};
  window.addEventListener('error', e=>{ out.errs.push(String(e.message)+' @'+e.lineno); });
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  const card=(h, o)=>({handle:h, region:'EU', rating:o, _ovr:o, nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Lad', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6,
        region:'EU', ovr:70, role:'roleIGL', attrs:null, ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, size:2, year:2026, year0:2026, day:'2026-01-12', division:${DIV},
              earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'ladg'},
      partner:{card:card('M1',70), patience:60, since:'2025-11-01', dev:0},
      partners:[{card:card('M1',70), patience:60, since:'2025-11-01', dev:0}]}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs=ccRookieAttrs(70, 'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerEntry();

    const cr=CAREER.career, me=careerCard(), mates=careerMates();
    const drafted=[me].concat(mates.filter(Boolean));
    const you=careerYouTeam(drafted);
    const field=[you, ...careerCupField(cr, drafted, 400, null, false, 0)];
    const faces=[].concat(...field.map(t=>t.squad||[])).filter(Boolean);
    const made=faces.filter(c=>c.tier==='ladder');
    out.notes.room={teams:field.length, faces:faces.length, made:made.length};
    check('комната низкого дивизиона — почти вся выдуманная',
          made.length > faces.length*0.8, JSON.stringify(out.notes.room));

    /* Вечер. Очки раздаются руками, а не прогоном: проверяется книга, а не
       симуляция, и комната в четыреста команд считалась бы секундами. */
    const rnd=careerRng(12345);
    field.forEach(t=>{ t.stagePts=Math.round(rnd()*1000); t.wins=0; t.stageElims=0; });
    CAREER.dev=CAREER.dev||{}; CAREER.devL=CAREER.devL||{};
    const devWas=Object.keys(CAREER.dev).length;
    careerGrowField(field, you);

    const lad=CAREER.devL, keys=Object.keys(lad);
    out.notes.book={lad:keys.length, dev:Object.keys(CAREER.dev).length, devWas:devWas, cap:CC_DEV_L_MAX};
    check('выдуманные попали в свою книгу', keys.length > 0, JSON.stringify(out.notes.book));
    check('и не попали в книгу сцены',
          Object.keys(CAREER.dev).length === devWas, JSON.stringify(out.notes.book));
    check('книга выдуманных не длиннее потолка',
          keys.length <= CC_DEV_L_MAX, keys.length+' > '+CC_DEV_L_MAX);
    out.notes.sample=keys.slice(0,4).map(k=>k+' '+lad[k]);
    check('сдвиги идут в обе стороны',
          keys.some(k=>lad[k]>0) && keys.some(k=>lad[k]<0), JSON.stringify(out.notes.sample));

    /* И сдвиг доезжает до карточки. careerLadderPlayer собирает её из полосы;
       без чтения книги (careerDevOf) запись оставалась бы мёртвой. */
    const who=keys.sort((a,b)=>Math.abs(lad[b])-Math.abs(lad[a]))[0];
    const band=ccBand(cr.division);
    lad[who]=12;                                   // заметный сдвиг, чтобы не спорить с округлением
    const lifted=careerLadderPlayer(careerRng(1), band, new Set(), null, null, null, false);
    const plain=careerLadderPlayer(careerRng(1), band, new Set(), null, null, null, false);
    out.notes.lift={who:who, band:band, sameNick:lifted.handle===plain.handle};
    // Один и тот же бросок даёт одного и того же человека — значит сравнивать честно.
    check('бросок воспроизводим', lifted.handle===plain.handle, JSON.stringify(out.notes.lift));
    lad[hKey(lifted)]=12;
    const after=careerLadderPlayer(careerRng(1), band, new Set(), null, null, null, false);
    out.notes.lift.before=plain._targetOvr; out.notes.lift.after=after._targetOvr;
    check('сдвиг доезжает до рейтинга карточки',
          after._targetOvr > plain._targetOvr, JSON.stringify(out.notes.lift));

    check('без ошибок JS', out.errs.length===0, out.errs.slice(0,3).join(' | '));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccladg-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(SL).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const html = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.split(SL).join('/')], { maxBuffer: 1 << 28, timeout: 1500000 }).toString();
const m = /PBEGIN(.*?)PEND/.exec(html);
if (!m) { console.log('FAIL: no result'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
console.log(JSON.stringify(out.notes));
if (out.errs && out.errs.length) out.errs.slice(0, 5).forEach(e => console.log('JSERR ' + e.slice(0, 400)));
if (out.err) { console.log('ERR ' + out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
console.log('OK check-career-ladder-growth');
