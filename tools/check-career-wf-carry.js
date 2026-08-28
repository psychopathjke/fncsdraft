// Saturday is made of the people who qualified on Tuesday.
//
// The Weekly Final used to draw its own fifty out of the pool. Same seed as the
// cup, so the same faces were available — but it took the first forty-nine of
// the shuffle rather than the forty-nine who finished above the line, so a duo
// could sit at 24 in the week's table and not be in the room on Saturday. His
// player, 21 August, with the table beside it: Scroll and Sky at 24.
//
//   node tools/check-career-wf-carry.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set CHROME to chrome.exe');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out={fails:[], notes:{}, err:null};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d!==undefined?': '+d:'')); };
  const key=t=>ccRelKey(t).split(';').join(',');
  const done=()=>{
    try{
      localStorage.clear();
      careerEntry();
      ccPickRole('roleFRG'); ccPickDiv(1); ccPickRegion('EU'); ccPickCountry('de');
      const n=document.getElementById('ccNick');
      n.value='Weekly'; n.dispatchEvent(new Event('input',{bubbles:true}));
      if(typeof ccSync==='function') ccSync();
      document.getElementById('ccStart').click();
      const cr=CAREER.career;
      cr.balance=99999;

      const me=careerCard();
      const drafted=[me];
      // The cup's own field, which is what a week is played against.
      const cup=careerCupField(cr, drafted, careerCupSize(cr.division), ccCupWeekSalt());
      out.notes.cup={teams:cup.length, cut:ccTeams(CAREER_CUP_CUT)};
      check('the cup seats a room worth qualifying out of', cup.length>60, String(cup.length));

      /* A cut that is deliberately NOT the front of the shuffle: the teams the
         old code would have taken are the first forty-nine, so this takes the
         last forty-nine instead. If they come back on Saturday, the room is
         made of the standings rather than of the draw. */
      const want=ccTeams(CAREER_CUP_CUT)-1;
      const tail=cup.slice(-want);
      cr.wf={monday:careerMonday(careerToday()), cut:tail.map(key).join(';')};
      const wf=careerWeeklyFinalField(cr, drafted);
      out.notes.final={teams:wf.length, want:want};
      check('the Final seats the right number', wf.length===want,
            wf.length+' of '+want);
      const inFinal=new Set(wf.map(key));
      const missing=tail.map(key).filter(k=>!inFinal.has(k));
      out.notes.missing=missing.slice(0,5);
      check('everybody who made the cut is in the room', missing.length===0,
            missing.length+' left out, e.g. '+missing.slice(0,3).join(' / '));
      // And nobody is in it twice.
      check('and nobody is in it twice', inFinal.size===wf.length,
            inFinal.size+' of '+wf.length);

      /* A save written before the cut was recorded still opens: no list means
         the Final falls back to the draw it always used. */
      cr.wf={monday:careerMonday(careerToday())};
      const legacy=careerWeeklyFinalField(cr, drafted);
      out.notes.legacy=legacy.length;
      check('a save with no list still fills the room', legacy.length===want,
            legacy.length+' of '+want);

      /* And a list naming people the draw no longer holds is topped up rather
         than left short. */
      cr.wf={monday:careerMonday(careerToday()), cut:'nobody&nohow;alsonot&here'};
      const stale=careerWeeklyFinalField(cr, drafted);
      out.notes.stale=stale.length;
      check('a stale list is topped up to a full room', stale.length===want,
            stale.length+' of '+want);
    }catch(e){ out.err=String(e && e.stack || e); }
    document.getElementById('__out').textContent=
      'PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
  };
  if(typeof ccMapsReady==='function') ccMapsReady(done); else done();
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wfcarry-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g, '/') + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=60000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('Saturday is made of the people who qualified');
fs.rmSync(dir, { recursive: true, force: true });
