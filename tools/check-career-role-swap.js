// The role is a choice the career can take back, whoever it is playing.
//
// His ask, 21 August: the role was picked once, on the creation screen, and a
// career played as somebody real never picked it at all — it arrived off
// Liquipedia with the player and nothing in the mode could move it. What has to
// hold now: the button switches the half you play; the six numbers tilt towards
// it without the rating moving; a real player's own shape is tilted rather than
// replaced by a template; and the switch survives a save and a reload.
//
//   node tools/check-career-role-swap.js
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
  const out = {fails: [], notes: {}, err: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  const cardRole = () => { const c = careerCard(); return c ? attrsFor(c).roleKey : null; };
  const cardOvr  = () => { const c = careerCard(); return c ? attrsFor(c).ovr : null; };
  const six = () => { const c = careerCard(); const a = c ? attrsFor(c) : null;
    return a ? {aim:a.aim, end:a.end, sur:a.sur, exp:a.exp, clu:a.clu, con:a.con} : null; };

  const build = (mode, handle) => {
    localStorage.clear();
    careerEntry();
    ccSetMode(mode);
    ccPickRegion('EU');
    if (mode === 'card') { ccPickCard(handle); }
    else {
      ccPickRole('roleFRG'); ccPickDiv(3); ccPickCountry('rs');
      const n = document.getElementById('ccNick');
      n.value = 'RoleTest'; n.dispatchEvent(new Event('input', {bubbles:true}));
    }
    if (typeof ccSync === 'function') ccSync();
    document.getElementById('ccStart').click();
  };

  const done = () => {
    try {
      // ---- a built player switches, and keeps his rating -----------------
      build('rookie');
      const wasRole = ccRoleNow(), wasOvr = cardOvr(), wasSix = six();
      check('a built player starts on the role he was built for',
            wasRole === 'roleFRG', String(wasRole));
      careerRoleSwap();
      const nowSix = six();
      out.notes.built = {from: wasRole, to: ccRoleNow(), ovr: [wasOvr, cardOvr()],
                         six: [wasSix, nowSix]};
      check('the button switches the half he plays', ccRoleNow() === 'roleIGL', String(ccRoleNow()));
      check('and the card he shows switches with it', cardRole() === 'roleIGL', String(cardRole()));
      check('the rating does not move', Math.abs(cardOvr() - wasOvr) <= 1,
            wasOvr + ' -> ' + cardOvr());
      check('the shape tilts towards the new half',
            nowSix.sur > wasSix.sur && nowSix.end > wasSix.end && nowSix.aim < wasSix.aim,
            JSON.stringify(nowSix));
      // Twice is back where he started, which is what "a choice you can take
      // back" has to mean.
      careerRoleSwap();
      out.notes.builtBack = {role: ccRoleNow(), six: six()};
      check('and switching back is switching back', ccRoleNow() === 'roleFRG', String(ccRoleNow()));

      // ---- and nobody else gets to move you ------------------------------
      // His rule, 21 August: the player changes his own role and nothing else
      // does. The two conversations that used to swap it — a leaving partner
      // asking you to move over, and the same offer as an argument — no longer
      // put it on the table at all.
      CAREER.dms = [{id:'t1', state:'leaving', who:{handle:'Matey', role:ccRoleNow(), ovr:80},
                     msgs:[], kept:{}}];
      CAREER.career.balance = 99999;
      out.notes.keepWays = careerMateKeepable(careerDms()[0]);
      check('a leaving partner cannot ask for your role',
            out.notes.keepWays.indexOf('role') < 0, out.notes.keepWays.join(','));
      CAREER.dms = [{id:'t2', state:'declined', who:{handle:'Hard', role:ccRoleNow(), ovr:95},
                     msgs:[{from:'them', k:'dmNo', day:careerToday()}], used:{}, args:0}];
      out.notes.argWays = careerDmArgs(careerDms()[0]);
      check('and it is not something to argue with either',
            out.notes.argWays.indexOf('role') < 0, out.notes.argWays.join(','));

      // ---- a real player switches too -----------------------------------
      // Somebody the roster gives a role to: that is the case that could not be
      // moved at all before, because attrsFor read it off Liquipedia every time.
      const roster = careerRosterNowEU();
      const real = roster.find(p => realRoleKey(p) && attrsFor(p).roleKey === realRoleKey(p));
      out.notes.real = {handle: real && real.handle, role: real && realRoleKey(real)};
      check('the roster still names somebody by role', !!real);
      build('card', real.handle);
      const realWas = ccRoleNow(), realOvr = cardOvr(), realSix = six();
      check('the career opens on his real role', realWas === realRoleKey(real),
            realWas + ' vs ' + realRoleKey(real));
      /* Взятая карточка приносит с собой своё дуо, а роль с 21 августа меняется
         обменом: место в игре одно, и уйти из него можно только отдав его. Если
         рядом настоящий игрок, careerRoleSwap сперва спрашивает его — и вправе
         услышать «нет». Здесь проверяется своя половина обмена, поэтому соседу
         ставится настрой, при котором он соглашается; что он может и отказаться,
         и что отказ не двигает никого, проверяет check-career-mate-role. */
      const mateRec = careerMateRecords()[0];
      if (mateRec) mateRec.patience = 100;
      out.notes.realMate = mateRec ? {who: mateRec.handle, patience: mateRec.patience} : null;
      careerRoleSwap();
      out.notes.realSwap = {from: realWas, to: ccRoleNow(), ovr: [realOvr, cardOvr()],
                            six: [realSix, six()]};
      check('a real player can change role', ccRoleNow() !== realWas, String(ccRoleNow()));
      check('and his card says so', cardRole() === ccRoleNow(), String(cardRole()));
      check('his rating is untouched', Math.abs(cardOvr() - realOvr) <= 1,
            realOvr + ' -> ' + cardOvr());
      // His own shape, tilted — not the rookie template, which would print the
      // same six numbers for every player who ever switched.
      const tmpl = ccRookieAttrs(realOvr, ccRoleNow());
      const same = ['aim','end','sur','exp','clu','con'].every(k => six()[k] === tmpl[k]);
      check('and it is his own shape rather than a template', !same, JSON.stringify(six()));

      // ---- it is in the save --------------------------------------------
      const want = ccRoleNow();
      careerSave();
      CAREER = null;
      careerLoad();
      out.notes.reloaded = {role: ccRoleNow(), card: cardRole()};
      check('the switch survives a reload', ccRoleNow() === want, String(ccRoleNow()));
      check('and the card comes back on the new role', cardRole() === want, String(cardRole()));
    } catch (e) { out.err = String(e && e.stack || e); }
    document.getElementById('__out').textContent =
      'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
  };
  if (typeof ccMapsReady === 'function') ccMapsReady(done); else done();
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccrole-'));
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
console.log('the role is a choice, and it can be taken back');
fs.rmSync(dir, { recursive: true, force: true });
