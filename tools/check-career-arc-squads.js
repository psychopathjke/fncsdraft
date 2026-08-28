// История называет те же составы, что и лобби, и не пересобирает их заново.
//
// Архив спрашивал у карточки её настоящего напарника — `if(lead.partner)` — а
// поле partner не заполнено ни у одной карточки ни в одном регионе (EU 911,
// NAC 600, ASIA 538 — ноль). Ветка не срабатывала никогда, и каждая таблица
// истории собирала пары заново из свободных: между таблицей Мейджора 1 и
// таблицей Мейджора 2 одного сезона напарника сохраняли 19% людей, между
// таблицей и живым лобби — 26%, в трио-сезоне 0%. Его игрок, 25 августа:
// «на крупных турнирах дуосы меняются в финале».
//
// Плюс вторая половина того же утра: «выиграли саммит, а в истории результатов
// турнира нас нет» — Саммит и Париж стояли в архиве только у дуо-сезонов
// (`if(size===2)`), хотя календарь играет их каждый год.
//
//   node tools/check-career-arc-squads.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set the CHROME environment variable to chrome.exe');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out={fails:[], notes:{}, err:null};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  try{
    const seed=(size)=>{ CAREER={player:{nick:'Ilyusha', ovr:93, ovrExact:93, region:'EU',
        role:'roleIGL', country:'ru', age:20, attrs:ccRookieAttrs(93,'roleIGL')},
      career:{season:1, day:'2026-08-20', division:1, earnings:0, balance:0, tokens:[],
        log:[], news:[], form:0, grind:0, size:size, sizes:{1:size}, seasonOver:false, trios:{}},
      dms:[], partners:[], gear:{own:[], train:0}};
      CH_ARC_TBL={}; };
    const mates=rows=>{ const m=new Map();
      rows.forEach(r=>{ const h=String(r.name).split(/\\s*&\\s*/).map(s=>s.trim().toLowerCase());
        h.forEach(x=>m.set(x, h.slice().sort().join('+'))); });
      return m; };
    const liveMates=field=>{ const m=new Map();
      field.forEach(t=>{ const h=t.squad.map(c=>String(c.handle||'').toLowerCase());
        h.forEach(x=>m.set(x, h.slice().sort().join('+'))); });
      return m; };
    const agree=(a,b)=>{ let seen=0, same=0, ex=null;
      b.forEach((v,k)=>{ const o=a.get(k); if(!o) return; seen++;
        if(o===v) same++; else if(!ex) ex=k+': '+o+' | '+v; });
      return {seen:seen, same:same, share:seen?same/seen:0, example:ex}; };

    // ---- дуо-сезон: две таблицы одного сезона и живое лобби ---------------
    seed(2);
    const m1=careerArchiveFinal(1,'m|1|EU'), m2=careerArchiveFinal(1,'m|2|EU');
    check('таблицы финалов вообще строятся', !!(m1 && m2 && m1.rows.length>10));
    const across=agree(mates(m1.rows), mates(m2.rows));
    out.notes.acrossTables=across;
    check('в двух турнирах одного сезона у человека один и тот же напарник',
          across.seen>50 && across.share>=0.95,
          across.seen+' человек, совпало '+across.same+' — '+across.example);
    const me=careerCard(), mine=[me].concat(careerMates().filter(Boolean));
    CAREER.career.day='2026-08-01';
    const live=careerCupField(Object.assign({}, CAREER.career, {division:1}), mine,
                              ccTeams(50), null, false, CC_FIELD_SHARP.final);
    const vsLive=agree(liveMates(live), mates(m2.rows));
    out.notes.vsLive=vsLive;
    check('и это те же пары, против которых карьера играла',
          vsLive.seen>40 && vsLive.share>=0.95,
          vsLive.seen+' человек, совпало '+vsLive.same+' — '+vsLive.example);
    // Контроль: пары приходят из пула, а не из соседей по рейтингу.
    const pool=careerPools();
    const key=d=>d.cards.map(c=>hKey(c)).sort().join('|');
    const inPool=new Set(pool.duos.map(key));
    const rows=m2.rows.filter(r=>String(r.name).indexOf(' & ')>0).slice(0, 20);
    let recorded=0;
    rows.forEach(r=>{ const h=String(r.name).split(' & ').map(s=>hKey(s.trim())).sort().join('|');
      if(inPool.has(h)) recorded++; });
    out.notes.recordedTop20=recorded;
    check('верх таблицы — записанные пары', recorded>=17, recorded+' из 20');

    // ---- трио-сезон: ЛАНы на месте ---------------------------------------
    seed(3);
    const a=careerArchiveSeason(1);
    const slots=a.global.map(g=>g.slot);
    out.notes.trioSlots=slots;
    check('в трио-сезоне архив держит Саммит', slots.indexOf('summit')>=0, slots.join(','));
    check('и Reload Championship', slots.indexOf('rc')>=0, slots.join(','));
    const st=careerArchiveFinal(1,'g|summit');
    out.notes.trioSummitRows=st?st.rows.length:null;
    check('и таблица Саммита строится в составе сезона',
          st && st.rows.length===ccArcCount(3, CC_SUMMIT_STAGE.final.field),
          st?String(st.rows.length):'таблицы нет');
    // Выигранный Саммит стоит в своей же таблице первой строкой.
    CAREER.career.log=[{season:1, day:'2026-05-31', div:1, place:1, of:33, pts:420,
      passed:true, ovr:93, games:12, wins:2, elims:30, avg:5, mate:'howly',
      mates:['howly','tox'], prize:100000, kind:'summit', stage:'final'}];
    CH_ARC_TBL={};
    const won=careerArchiveFinal(1,'g|summit');
    const at=won ? won.rows.findIndex(r=>r.you)+1 : 0;
    out.notes.wonSummitAt=at;
    check('выигранный Саммит стоит в истории первой строкой', at===1,
          at?('строка '+at):'своей строки в таблице нет');
  }catch(e){ out.err=String(e&&e.stack||e); }
  document.getElementById('__out').textContent=
    'PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccarcsq-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=180000', '--dump-dom',
  'file:///' + tmp.split(String.fromCharCode(92)).join('/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('история называет те же составы, что и лобби');
fs.rmSync(dir, { recursive: true, force: true });
