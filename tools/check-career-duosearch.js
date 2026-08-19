// Writing first to anybody in your own region.
//
// The inbox was the only door: careerDmPool builds the handful who turn up on
// their own, and careerDmWrite would only look them up in that same handful, so
// a player could answer but never choose. His ask, 18 August — "дать возможность
// любому игроку на их регионе написать, что предложить дуо сыграть".
//
// What this holds: the list is the region rather than the shortlist, it obeys
// the rule that real names live only in Division 1, the search filters it, and
// writing to somebody the inbox never mentioned actually opens a conversation
// and gets an answer back.
//
//   node tools/check-career-duosearch.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<script>
(function(){
  const out = {fails: [], notes: {}, err: null};
  function done(){ document.title='PBEGIN'+encodeURIComponent(JSON.stringify(out))+'PEND'; }
  function check(what, ok, saw){ if(!ok) out.fails.push(what + (saw!==undefined ? ' — ' + saw : '')); }

  function start(div, nick){
    localStorage.clear();
    careerEntry();
    ccPickRole('roleFRG'); ccPickDiv(div); ccPickRegion('EU'); ccPickCountry('de');
    const n=document.getElementById('ccNick');
    n.value=nick; n.dispatchEvent(new Event('input',{bubbles:true}));
    if(typeof ccSync==='function') ccSync();
    document.getElementById('ccStart').click();
  }

  window.addEventListener('load', function(){
    try{
      // ---- Division 5: the ladder, generated, and nobody real -------------
      start(5, 'Searcher');
      const low = careerDuoSearchPool();
      out.notes.low = {n: low.length, top: low[0] && low[0].ovr, bottom: low[low.length-1] && low[low.length-1].ovr};
      check('the list below Division 1 is wider than the inbox',
            low.length > careerDmPool().length, low.length + ' vs ' + careerDmPool().length);
      check('and nothing in it is a real card', low.every(function(w){ return !w.roster; }));
      check('and nothing in it passes the generated ceiling',
            low.every(function(w){ return w.ovr <= CC_GEN_TOP; }),
            String(Math.max.apply(null, low.map(function(w){ return w.ovr; }))));
      // Same names tomorrow: the list is seeded on the season, not the day.
      const again = careerDuoSearchPool().map(function(w){ return w.handle; }).join(',');
      check('and it is the same list on the next day',
            again === low.map(function(w){ return w.handle; }).join(','));

      // ---- The window, and the filter -------------------------------------
      ccDuoFindOpen();
      const body = document.getElementById('duoFindBody').innerHTML;
      check('the window opens with rows', /cc-buy/.test(body));
      check('and a field to type in', !!document.getElementById('duoFindQ'));
      const pick = low[3];
      ccDuoFindQ(pick.handle.slice(0, 3));
      const filtered = document.getElementById('duoFindBody').innerHTML;
      check('typing filters the list', filtered.indexOf(pick.handle) >= 0);
      const dropped = low.filter(function(w){
        return w.handle.toLowerCase().indexOf(pick.handle.slice(0,3).toLowerCase()) < 0; });
      if (dropped.length)
        check('and drops what does not match', filtered.indexOf(dropped[0].handle) < 0, dropped[0].handle);
      ccDuoFindQ('');
      ccDuoFindClose();

      // ---- Writing to somebody the inbox never offered ---------------------
      const inbox = new Set(careerDmPool().map(function(w){ return hKey(w.handle); }));
      const stranger = low.filter(function(w){ return !inbox.has(hKey(w.handle)); })[0];
      check('there is somebody outside the inbox to write to', !!stranger);
      if (stranger) {
        careerDmWrite(stranger.handle);
        const t = careerDmFind(stranger.handle);
        out.notes.wrote = {who: stranger.handle, ovr: stranger.ovr,
                           msgs: t && t.msgs.map(function(m){ return m.from + ':' + m.k; })};
        check('the conversation opened', !!t && t.msgs.length > 0);
        check('and you spoke first', !!t && t.msgs[0].from === 'you');
        check('and they answered in it', !!t && t.msgs.some(function(m){ return m.from === 'them'; }));
      }

      // ---- Division 1: the real roster, whole ------------------------------
      start(1, 'Searcher');
      const top = careerDuoSearchPool();
      out.notes.d1 = {n: top.length, real: top.filter(function(w){ return w.roster; }).length};
      check('Division 1 searches the real roster', top.length > 100, String(top.length));
      check('and every one of them is a real card', top.every(function(w){ return w.roster; }));
      check('and it is bigger than the inbox', top.length > careerDmPool().length);

      done();
    }catch(e){ out.err = String(e && e.stack || e); done(); }
  });
})();
</script>
`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'duo-'));
const tmp = path.join(dir, 'probe.html');
fs.writeFileSync(tmp, src.replace('</body>', BOOT + '</body>'));
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--window-size=1440,900',
  '--virtual-time-budget=120000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer: 512*1024*1024, encoding:'utf8'});
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('a career can write first to anybody in its own region');
fs.rmSync(dir, {recursive: true, force: true});
