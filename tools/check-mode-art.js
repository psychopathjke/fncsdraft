// Every mode tile has a picture on it.
//
// The career tile lost its own on the day the tiles went lazy: it copied the
// computed background off the Majors' tile at DOMContentLoaded, and by then the
// observer had not painted that tile either, so it copied nothing and read as a
// grey gradient. He caught it on 19 August — "верни превьюху на карьеру".
//
// A copy cannot be caught by looking at the markup, so this waits for the page
// to settle and then asks each tile what it is actually painted with.
//
//   node tools/check-mode-art.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = [
'<script>',
'(function(){',
'  var out = {fails: [], notes: {}, err: null};',
'  function done(){ document.title = "PBEGIN" + encodeURIComponent(JSON.stringify(out)) + "PEND"; }',
'  window.addEventListener("load", function(){',
'    // Give the observer a scroll to react to, then read what stuck.',
'    window.scrollTo(0, document.body.scrollHeight);',
'    setTimeout(function(){ window.scrollTo(0, 0); }, 400);',
'    setTimeout(function(){',
'      try{',
'        var tiles = [].slice.call(document.querySelectorAll(".ec-art"));',
'        out.notes.tiles = tiles.length;',
'        var blank = [];',
'        tiles.forEach(function(el){',
'          var bg = getComputedStyle(el).backgroundImage || "";',
'          var has = bg && bg !== "none" && bg.indexOf("url(") >= 0;',
'          if (!has) blank.push(el.id || el.getAttribute("data-art") || "(unnamed)");',
'        });',
'        out.notes.blank = blank;',
'        if (out.notes.tiles < 6) out.fails.push("expected the wall of mode tiles — " + out.notes.tiles);',
'        if (blank.length) out.fails.push("tiles with no picture: " + blank.join(", "));',
'        // And the career tile by name, because it is the one that broke.',
'        var car = document.getElementById("careerArt");',
'        var cbg = car ? getComputedStyle(car).backgroundImage : "";',
'        out.notes.career = cbg.slice(0, 90);',
'        if (!car) out.fails.push("the career tile is gone");',
'        else if (cbg.indexOf("url(") < 0) out.fails.push("the career tile is bare — " + cbg);',
'        done();',
'      }catch(e){ out.err = String(e && e.stack || e); done(); }',
'    }, 1500);',
'  });',
'})();',
'</script>'
].join('\n');

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
// Inside the project, or every relative art path resolves to nowhere.
// Во временную папку системы и с уборкой на любом выходе — см. разбор в
// check-career-edges.js.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'probe-art-'));
process.on('exit', () => { try{ fs.rmSync(dir, {recursive:true, force:true}); }catch(e){} });
const tmp = path.join(dir, 'probe.html');
fs.writeFileSync(tmp, src.replace('</body>', BOOT + '</body>'));
// The page fetches maps.js beside itself, so the probe needs its own copy.
fs.copyFileSync(path.join(ROOT, 'maps.js'), path.join(dir, 'maps.js'));
let dom;
try {
  dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
    '--allow-file-access-from-files', '--window-size=1280,900',
    '--virtual-time-budget=60000', '--dump-dom',
    'file:///' + tmp.split(path.sep).join('/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('every mode tile is painted, the career one included');
