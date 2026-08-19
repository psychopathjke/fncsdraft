// Nothing in the hub is wider than the phone it is on.
//
// A tester, 18 August: "I can't swipe right" — the tab strip and the identity
// bar running past the right edge of the screen with no way to reach them. The
// strip wraps now and the bar wraps now, so anything still hanging over the edge
// is something else pushing the page wider than the viewport, and a page that is
// wider than the screen cannot always be scrolled sideways on a phone.
//
// So this asks the layout directly, on every tab: is the document wider than the
// window, and if so, what is sticking out.
//
//   node tools/check-career-no-sideways.js [width]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const WIDTH = parseInt(process.argv[2], 10) || 380;

const BOOT = [
'<script>',
'(function(){',
'  var out = {fails: [], notes: {}, err: null};',
'  function done(){ document.title = "PBEGIN" + encodeURIComponent(JSON.stringify(out)) + "PEND"; }',
'',
'  function widest(){',
'    var vw = document.documentElement.clientWidth;',
'    var worst = [];',
'    var all = document.querySelectorAll("#screen-career-hub *");',
'    for (var i = 0; i < all.length; i++) {',
'      var el = all[i], r = el.getBoundingClientRect();',
'      if (r.width < 4 || r.height < 4) continue;',
'      var over = Math.round(r.right - vw);',
'      if (over > 1) worst.push({',
'        tag: el.tagName.toLowerCase(),',
'        cls: String(el.className || "").slice(0, 40),',
'        w: Math.round(r.width), over: over,',
'        txt: String(el.textContent || "").trim().slice(0, 24).replace(/\\s+/g, " ")});',
'    }',
'    worst.sort(function(a,b){ return b.over - a.over; });',
'    // The deepest element is the one to name; its parents are only wide because',
'    // of it, so one per width is enough to act on.',
'    return worst.slice(0, 5);',
'  }',
'',
'  window.addEventListener("load", function(){',
'    try{',
'      localStorage.clear();',
'      careerEntry();',
'      ccPickRole("roleFRG"); ccPickDiv(1); ccPickRegion("EU"); ccPickCountry("de");',
'      var n=document.getElementById("ccNick");',
'      n.value="Narrow"; n.dispatchEvent(new Event("input",{bubbles:true}));',
'      if(typeof ccSync==="function") ccSync();',
'      document.getElementById("ccStart").click();',
'      CAREER.career.balance = 500000;',
'',
'      out.notes.viewport = document.documentElement.clientWidth;',
'      var tabs = ["centre","career","calendar","social","table","shop","history"];',
'      out.notes.tabs = {};',
'      tabs.forEach(function(t){',
'        try { careerTab(t); } catch(e) { return; }',
'        var doc = document.documentElement;',
'        var over = doc.scrollWidth - doc.clientWidth;',
'        var w = widest();',
'        out.notes.tabs[t] = {pageOver: over, worst: w};',
'        if (over > 1)',
'          out.fails.push(t + ": the page is " + over + "px wider than the screen" +',
'            (w.length ? " — widest is ." + w[0].cls + " by " + w[0].over + "px" : ""));',
'      });',
'      done();',
'    }catch(e){ out.err = String(e && e.stack || e); done(); }',
'  });',
'})();',
'</script>'
].join('\n');

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'side-'));
const tmp = path.join(dir, 'probe.html');
fs.writeFileSync(tmp, src.replace('</body>', BOOT + '</body>'));
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--window-size=' + WIDTH + ',760',
  '--virtual-time-budget=60000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('nothing in the hub reaches past the edge of the screen');
fs.rmSync(dir, { recursive: true, force: true });
