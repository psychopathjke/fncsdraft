// Turning the year over has to leave the hub standing.
//
// His screenshots, 18 August: a career in its third season, January 2028, with
// the identity bar gone and the tab strip crushed to a sliver under the site
// header. The fast-forward stops dead at the season boundary — its loop reads
// !cr.seasonOver — so nothing that walks days ever crosses it. The crossing is
// its own button, careerNewSeason(), and this is what it leaves behind.
//
//   node tools/check-career-newseason.js [seasons]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const SEASONS = parseInt(process.argv[2], 10) || 2;

const BOOT = `
<script>window.NSEASONS = ${SEASONS};</script>
<script>
(function(){
  const out = {fails: [], notes: {}, err: null};
  function done(){ document.title='PBEGIN'+encodeURIComponent(JSON.stringify(out))+'PEND'; }
  const errs = [];
  window.addEventListener('error', e => errs.push(String(e.message)));
  window.addEventListener('unhandledrejection', e =>
    errs.push('rejection: ' + String(e.reason && e.reason.message || e.reason)));

  function shot(tag){
    const top = document.querySelector('.ch-top');
    const tabs = [].slice.call(document.querySelectorAll('[onclick*="careerTab"]'))
      .filter(e => e.offsetHeight > 0);
    const r = top ? top.getBoundingClientRect() : null;
    return {tag: tag,
            season: CAREER.career.season,
            division: CAREER.career.division,
            topH: r ? Math.round(r.height) : null,
            topText: top ? (top.innerText||'').replace(/\\s+/g,' ').trim().slice(0,40) : null,
            tabs: tabs.length,
            tabTop: tabs.length ? Math.round(tabs[0].getBoundingClientRect().top) : null,
            tabH: tabs.length ? Math.round(tabs[0].getBoundingClientRect().height) : null,
            scrollY: Math.round(window.scrollY),
            docH: document.documentElement.scrollHeight,
            winH: window.innerHeight,
            digest: !!document.querySelector('.cc-ff-card')};
  }

  window.addEventListener('load', async function(){
    try{
      careerEntry();
      ccPickRole('roleFRG'); ccPickDiv(1); ccPickRegion('EU'); ccPickCountry('de');
      const nick=document.getElementById('ccNick');
      nick.value='Turn'; nick.dispatchEvent(new Event('input',{bubbles:true}));
      if(typeof ccSync==='function') ccSync();
      document.getElementById('ccStart').click();

      const offer = careerDms().filter(t => t.who && !t.who.org && !t.who.fan
                                            && !t.who.hater && !t.who.agent)[0];
      if (offer) careerDmAccept(offer.id);

      out.notes.steps = [shot('start')];

      for (let i = 0; i < window.NSEASONS; i++) {
        // Трио-год начинается с недобором: с 11.09 перемотка встаёт «не с кем играть», как и
        // должна. Сторож добирает состав перед годом — ровно то, что сделал бы игрок.
        for (let k = 0; k < 3 && typeof careerMatesShort === 'function' && careerMatesShort() > 0; k++) {
          if (typeof careerSeatTopUp === 'function') careerSeatTopUp();
          const o = careerDms().filter(t => t.state === 'offer' && t.who && !t.who.org && !t.who.fan && !t.who.hater && !t.who.agent && !t.who.brand)[0];
          if (!o) break;
          careerDmAccept(o.id);
        }
        // Walk to the end of the season the way the button does.
        await careerFastForward(400);
        out.notes.steps.push(shot('season ' + CAREER.career.season + ' played'));
        if (!CAREER.career.seasonOver) {
          out.notes.stuck = {day: careerToday(), ffErr: (typeof CC_FF!=='undefined' && CC_FF && CC_FF.err) || null, next: JSON.stringify(careerNext()), guardHint: 'careerFastForward(400) ходит не больше 400 дней за раз', ffo: (document.querySelector('.cc-ffo-err')||{}).textContent||null, mates: (typeof careerMates==='function') ? careerMates().length : null, seats: (typeof careerMateSeats==='function') ? careerMateSeats() : null, size: CAREER.career.size, short: (typeof careerMatesShort==='function') ? careerMatesShort() : null, ask: (document.getElementById('ccAskModal')||{style:{}}).style.display, askTxt: ((document.getElementById('ccAskModal')||{}).innerText||'').slice(0,120)};
          out.fails.push('season ' + CAREER.career.season + ' never ended');
          break;
        }
        careerNewSeason();
        const after = shot('after turn ' + (i+1));
        out.notes.steps.push(after);

        // Present is not the same as visible: the bug put it above the fold.
        out.notes.steps.filter(function(x){ return /played$/.test(x.tag); }).forEach(function(x){
          if (x.scrollY > 4)
            out.fails.push(x.tag + ': the page is scrolled ' + x.scrollY +
              'px, so the identity bar sits above the fold');
        });
        if (after.topH == null) out.fails.push(after.tag + ': the identity bar is gone');
        else if (after.topH < 30) out.fails.push(after.tag + ': the identity bar collapsed to ' + after.topH + 'px');
        if (!after.tabs) out.fails.push(after.tag + ': no tabs');
        if (after.tabH != null && after.tabH < 20)
          out.fails.push(after.tag + ': the tab strip is ' + after.tabH + 'px tall');
      }

      out.notes.pageErrors = errs;
      if (errs.length) out.fails.push('threw: ' + errs.join(' | '));
      done();
    }catch(e){ out.err = String(e && e.stack || e); done(); }
  });
})();
</script>
`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ns-'));
const tmp = path.join(dir, 'probe.html');
fs.writeFileSync(tmp, src.replace('</body>', BOOT + '</body>'));
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--window-size=1440,900',
  '--virtual-time-budget=1800000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer: 512*1024*1024, encoding:'utf8'});
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('the year turns over and the hub is still standing');
fs.rmSync(dir, {recursive:true, force:true});
