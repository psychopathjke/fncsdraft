// A career survives a full disk, and a portrait is stored at the size it is shown.
//
// His screenshot, 20 August, taken on the phone: a red box over a Division 5
// season one saying the career is not being saved, QuotaExceededError. Season
// one cannot fill a quota with results — what fills it is the photograph, which
// went into the save as the camera wrote it, three to five megabytes of it.
//
//   node tools/check-career-save-size.js
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
'  function check(what, ok, saw){ if(!ok) out.fails.push(what + (saw!==undefined ? " — " + saw : "")); }',
'',
'  window.addEventListener("load", function(){',
'    try{',
'      // A photograph the size a phone takes: noise, so it does not compress to',
'      // nothing and the numbers mean something.',
'      var big=document.createElement("canvas");',
'      big.width=1600; big.height=1200;',
'      var g=big.getContext("2d");',
'      for(var y=0;y<1200;y+=8) for(var x=0;x<1600;x+=8){',
'        g.fillStyle="rgb("+((x*7)%256)+","+((y*11)%256)+","+((x*y)%256)+")";',
'        g.fillRect(x,y,8,8);',
'      }',
'      var src=big.toDataURL("image/png");',
'      out.notes.photoIn=Math.round(src.length/1024)+"KB";',
'      ccPhotoShrink(src, function(small){',
'        out.notes.photoOut=Math.round(small.length/1024)+"KB";',
'        check("the portrait is re-encoded as a JPEG",',
'              small.indexOf("data:image/jpeg")===0, small.slice(0, 24));',
'        // A phone photograph is megabytes and comes out tens of kilobytes; the',
'        // noise field above is the hardest case there is for a JPEG, so the',
'        // line is drawn where it says "this can never blow a quota again".',
'        check("and what is stored is small enough to keep",',
'              small.length < src.length && small.length < 200*1024,',
'              small.length+" vs "+src.length);',
'        var img=new Image();',
'        img.onload=function(){',
'          out.notes.photoPx=img.naturalWidth+"x"+img.naturalHeight;',
'          check("no bigger than the size it is drawn at",',
'                Math.max(img.naturalWidth, img.naturalHeight)<=CC_PHOTO_MAX,',
'                out.notes.photoPx);',
'          quota();',
'        };',
'        img.onerror=function(){ check("the shrunk portrait loads", false); quota(); };',
'        img.src=small;',
'      });',
'',
'      // And the save itself, against a storage that is out of room.',
'      function quota(){',
'        try{',
'          var roster=careerRosterNowEU();',
'          CAREER={v:1, player:{nick:"T", age:19, source:"built", country:"RS",',
'                               region:"EU", ovr:88},',
'                  career:{season:3, size:2, day:"2026-02-08", division:1, earnings:0,',
'                          log:[{season:3, day:"2026-02-08", kind:"final", place:3, of:50}],',
'                          news:[], rel:{id:"x", rows:"a|1|1|1|1"}},',
'                  partners:[{handle:roster[1].handle, cardRegion:"EU", patience:80,',
'                             since:"2026-01-01"}],',
'                  dms:[{id:"d", who:{handle:"Someone", ovr:80}, state:"open",',
'                        msgs:[1,2,3,4,5,6,7,8].map(function(n){',
'                          return {from:"them", k:"dmProps", a:[n, 50]}; })}]};',
'          for(var i=0;i<40;i++) CAREER.career.news.push({season:3, day:"2026-02-08",',
'            kind:"good", k:"ccPostWon", a:["Cup", "X", 1], id:"n"+i,',
'            tbl:{div:1, cap:"Cup", rows:[1,2,3,4,5].map(function(p){',
'              return {p:p, n:"Somebody & Somebody", s:100}; }), me:"You"}});',
'',
'          // Anything over this many characters is refused, the way a full',
'          // localStorage refuses: the write throws QuotaExceededError.',
'          var LIMIT=2400, wrote=null;',
'          var real=Storage.prototype.setItem;',
'          Storage.prototype.setItem=function(k, v){',
'            if(String(k).indexOf("career")>=0 && String(v).length>LIMIT){',
'              var e=new Error("quota"); e.name="QuotaExceededError"; throw e;',
'            }',
'            wrote=String(v); return real.call(this, k, v);',
'          };',
'          var before=JSON.stringify(CAREER).length;',
'          careerSave();',
'          Storage.prototype.setItem=real;',
'          out.notes.save=before+" -> "+(wrote?wrote.length:0)+" (limit "+LIMIT+")";',
'          check("a save too big for the disk still lands", !!wrote && wrote.length<=LIMIT,',
'                out.notes.save);',
'          check("and the screen is not left saying it failed", CC_SAVE_FAIL==null,',
'                String(CC_SAVE_FAIL));',
'          check("the log is never what is given up",',
'                (CAREER.career.log||[]).length===1,',
'                String((CAREER.career.log||[]).length));',
'          out.notes.left="news "+(CAREER.career.news||[]).length+',
'                         ", rel "+(CAREER.career.rel?"kept":"gone")+',
'                         ", msgs "+((CAREER.dms[0].msgs||[]).length);',
'          done();',
'        }catch(e){ out.err=String(e && e.stack || e); done(); }',
'      }',
'    }catch(e){ out.err = String(e && e.stack || e); done(); }',
'  });',
'})();',
'</script>'
].join('\n');

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'savesize-'));
const tmp = path.join(dir, 'probe.html');
fs.writeFileSync(tmp, src.replace('</body>', BOOT + '</body>'));
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--window-size=1200,900',
  '--virtual-time-budget=60000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
if (Object.keys(out.notes).length) console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('the portrait is stored small, and a full disk does not end a career');
fs.rmSync(dir, { recursive: true, force: true });
