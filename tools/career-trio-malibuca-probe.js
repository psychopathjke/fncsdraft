// «Каждый кап новое трио, на примере Malibuca». Его отчёт, 28 августа, уже
// после выкладки.
//
// Проба ведёт ОДИН сейв через комнаты разных турниров подряд — кубок дивизиона,
// финал недели, открытый турнир, хиты Мейджора, Ласт Ченс — и после каждой
// печатает, с кем сидит Malibuca & vic0 и что лежит в памяти карьеры
// (cr.trios). Если третий меняется, видно, КАКАЯ комната переписала память.
//
//   node tools/career-trio-malibuca-probe.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set CHROME to chrome.exe');

const HEAD = `<script>
window.__errs = [];
window.addEventListener('error', function(e){ window.__errs.push(String(e.message) + ' @' + e.lineno); });
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out = {rows:[], errs:null, fail:null};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'ProbeM', age:19, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:96, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:'vic0', cardRegion:'EU', nat:null},
      career:{season:2, size:3, day:'2026-02-10', division:1, earnings:0, balance:0,
              reach:0, tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    CARD_MODE=true; squadSize=3;
    const cr=CAREER.career;
    const KEY='malibuca+vic0';
    // Игрок ВЗЯЛ карточку vic0 — Malibuca остался один. Это и есть его случай.
    const me=careerCard();
    const drafted=me ? [me] : [];
    // Игрок ВЗЯЛ карточку vic0 — значит Malibuca остался один. Его отчёт.
    CAREER.player.handle='vic0';

    const third=field=>{
      const t=(field||[]).find(x=>{
        const h=(x.squad||[]).map(c=>hKey(c));
        return h.indexOf('malibuca')>=0;
      });
      if(!t) return 'не в комнате';
      return (t.squad||[]).map(c=>c.handle).join(' & ');
    };

    // Комнаты в том порядке, в каком их видит календарь недели за неделей.
    const rooms=[
      ['кубок Д1',        ()=>careerCupField(cr, drafted, careerCupSize(1), null, false, 0)],
      ['финал недели',    ()=>careerCupField(cr, drafted, ccTeams(50), null, false, 0)],
      ['открытый (2100)', ()=>careerCupField(cr, drafted, 2100, null, true, 0)],
      ['хиты Мейджора',   ()=>careerCupField(Object.assign({}, cr, {division:1}), drafted,
                                             ccTeams(50)*ccMajorHeats(), null, false, CC_FIELD_SHARP.heats)],
      ['Ласт Ченс',       ()=>careerCupField(cr, drafted, 1200, null, true, CC_FIELD_SHARP.heats)],
      ['кубок Д1 снова',  ()=>careerCupField(cr, drafted, careerCupSize(1), null, false, 0)],
      ['финал недели 2',  ()=>careerCupField(cr, drafted, ccTeams(50), null, false, 0)],
      ['кубок Д1 третий', ()=>careerCupField(cr, drafted, careerCupSize(1), null, false, 0)]
    ];
    out.vic0=(careerPools().duos||[]).filter(d=>d.cards.some(c=>hKey(c)==='vic0'))
      .map(d=>d.cards.map(c=>c.handle+'|k='+String(c._k)+'|'+(c.region||'?')+'|'+String(c.event||'').slice(0,28)).join(' + '));
    out.taken=[me].map(c=>hKey(c));
    (function(){
      const t=new Set(['vic0']);
      const q=careerRealDuos(t, careerRng(careerSeed(cr,'iso')), 1, 33, CC_FIELD_SHARP.heats);
      out.isoPairSeated=q.some(d=>d.cards.some(c=>hKey(c)==='vic0'));
      const qo=careerRealDuos(t, careerRng(careerSeed(cr,'iso2')), 'all', 2100, 0);
      out.isoOpen=qo.filter(d=>d.cards.some(c=>hKey(c)==='malibuca')).map(d=>d.cards.map(c=>c.handle).join(' & '));
      out.isoOrphan=q.filter(d=>d.cards.some(c=>hKey(c)==='malibuca'))
        .map(d=>d.cards.map(c=>c.handle).join(' & '));
    })();
    let day=new Date('2026-02-10T00:00:00Z');
    rooms.forEach(function(r){
      cr.day=day.toISOString().slice(0,10);
      day=new Date(day.getTime()+3*86400000);
      const before=(cr.trios||{})[KEY]||null;
      const f=r[1]();
      const after=(cr.trios||{})[KEY]||null;
      out.me=(me&&me.handle)||null; out.orphan=JSON.stringify(cr.orphanMate||{});
      out.rows.push({room:r[0], seat:third(f), memoBefore:before, memoAfter:after,
                     rewritten: before!==null && after!==before});
      // Вечер играется — книга роста двигается, как в жизни.
      simulateGames(f.slice(0, Math.min(f.length, 400)), 6, victoryR1Points, 3);
      careerGrowField(f.slice(0, Math.min(f.length, 400)), null);
    });
  } catch(e){ out.fail=String(e && e.stack || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccmal-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(String.fromCharCode(92)).join('/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=600000','--dump-dom',
  'file:///' + tmp.split(String.fromCharCode(92)).join('/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.fail) { console.error(out.fail); process.exit(1); }
console.log('в открытом поле Malibuca:', out.isoOpen);
console.log('изолированно: vic0 в очереди?', out.isoPairSeated, '| Malibuca:', out.isoOrphan);
console.log('пары с vic0:', JSON.stringify(out.vic0,null,1), 'taken:', out.taken);
console.log('карточка игрока:', out.me, '| orphanMate:', out.orphan);
out.rows.forEach(r => console.log(
  (r.rewritten ? ' ПЕРЕПИСАНО ' : '            ') +
  r.room.padEnd(18) + ' | ' + String(r.seat).padEnd(40) +
  ' | память: ' + String(r.memoBefore) + ' -> ' + String(r.memoAfter)));
