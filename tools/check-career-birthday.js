// A career can have a birthday.
//
// careerBirthdays has posted birthday lines since 17 August, off CC_BORN — the
// eighty-one real dates the roster carries. A built player has no handle, so it
// had no date to read and the day never came round for them. His ask, 21 August:
// let the date be typed in where the age is, so the scene wishes the player a
// happy birthday on the day.
//
//   node tools/check-career-birthday.js
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
  const set=(id, v)=>{ const el=document.getElementById(id);
    el.value=v; el.dispatchEvent(new Event('input',{bubbles:true})); return el; };
  const done=()=>{
    try{
      // ---- the field on the way in --------------------------------------
      localStorage.clear();
      careerEntry();
      ccPickRole('roleFRG'); ccPickDiv(5); ccPickRegion('EU'); ccPickCountry('de');
      set('ccNick', 'Birthday');
      const ageBox=document.getElementById('ccAge'), bornBox=document.getElementById('ccBorn');
      check('the create screen has somewhere to put a date', !!bornBox);
      out.notes.bounds={min:bornBox.min, max:bornBox.max, start:careerStartDay()};
      check('and it will not take an age the mode refuses',
            bornBox.min && bornBox.max && bornBox.min<bornBox.max,
            JSON.stringify(out.notes.bounds));

      // A date the career would start at seventeen on: born 2008-07-14, career
      // starts 5 January 2026.
      set('ccBorn', '2008-07-14');
      out.notes.typed={born:CC.born, age:ageBox.value, locked:ageBox.readOnly};
      check('the date is taken', CC.born==='2008-07-14', String(CC.born));
      check('and the age follows it', ageBox.value==='17', ageBox.value);
      check('and the number stops being a choice', ageBox.readOnly===true);
      // Clearing it hands the number back.
      set('ccBorn', '');
      check('clearing it gives the number back',
            CC.born===null && ageBox.readOnly===false,
            CC.born+'/'+ageBox.readOnly);
      set('ccBorn', '2008-07-14');
      if(typeof ccSync==='function') ccSync();

      const btn=document.getElementById('ccStart');
      check('the career can start with one', btn.disabled===false);
      btn.click();
      const pl=CAREER.player, cr=CAREER.career;
      out.notes.saved={born:pl.born, age:pl.age, playerAge:ccPlayerAge()};
      check('the date is kept on the save', pl.born==='2008-07-14', String(pl.born));
      check('and the career is seventeen on day one', ccPlayerAge()===17,
            String(ccPlayerAge()));

      // ---- and the day comes round ---------------------------------------
      cr.balance=99999;
      cr.news=[];
      // Stand the day before, then cross the birthday.
      cr.day='2026-07-13';
      careerBirthdays('2026-07-13', '2026-07-15');
      const keys=(cr.news||[]).map(e=>e.k);
      out.notes.posted=keys.slice(0,6);
      check('the player posts it', keys.indexOf('ccPostBdayMe')>=0, keys.join(','));
      check('and the scene wishes them a happy birthday',
            keys.indexOf('ccPostBdayEpic')>=0, keys.join(','));
      const epic=(cr.news||[]).find(e=>e.k==='ccPostBdayEpic');
      out.notes.epic={day:epic && epic.day, args:epic && epic.a};
      check('on the day itself', epic && epic.day==='2026-07-14',
            epic && epic.day);
      check('and it is eighteen by then', epic && epic.a[1]===18,
            epic && String(epic.a[1]));
      // And it comes from Fortnite Competitive rather than from the player.
      const who=ccPostAuthor(epic);
      out.notes.author={name:who.name, verified:!!who.verified, you:!!who.you};
      check('and Fortnite is the one saying it',
            who.name===CC_PRESS.name && !who.you, JSON.stringify(out.notes.author));

      // A day that is not the birthday says nothing.
      cr.news=[];
      careerBirthdays('2026-07-15', '2026-07-17');
      check('and says nothing on the other days',
            (cr.news||[]).every(e=>e.k!=='ccPostBdayEpic' && e.k!=='ccPostBdayMe'),
            (cr.news||[]).map(e=>e.k).join(','));

      // ---- a career without one is untouched ------------------------------
      localStorage.clear();
      careerEntry();
      ccPickRole('roleFRG'); ccPickDiv(5); ccPickRegion('EU'); ccPickCountry('de');
      set('ccNick', 'Plain');
      set('ccAge', '19');
      if(typeof ccSync==='function') ccSync();
      document.getElementById('ccStart').click();
      out.notes.plain={born:CAREER.player.born, age:ccPlayerAge()};
      check('a career with no date still starts', !!CAREER.player);
      check('and keeps its counter', CAREER.player.born==null && ccPlayerAge()===19,
            JSON.stringify(out.notes.plain));
      CAREER.career.news=[];
      careerBirthdays('2026-07-13', '2026-07-15');
      check('and is wished nothing',
            (CAREER.career.news||[]).every(e=>e.k!=='ccPostBdayMe'),
            (CAREER.career.news||[]).map(e=>e.k).join(','));
    }catch(e){ out.err=String(e && e.stack || e); }
    document.getElementById('__out').textContent=
      'PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
  };
  if(typeof ccMapsReady==='function') ccMapsReady(done); else done();
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bday-'));
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
console.log('the scene knows when your birthday is');
fs.rmSync(dir, { recursive: true, force: true });
