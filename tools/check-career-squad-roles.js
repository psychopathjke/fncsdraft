// One IGL per squad, and exactly one.
//
// His rule, 21 August: a duo is an IGL and a fragger, a trio is an IGL and two
// fraggers. There is never a second caller and never a squad without one. What
// that has to mean everywhere: the search offers only the half you are missing;
// your own role can only be swapped while the squad still comes out right; the
// invented teams in a lobby are cast the same way; and the role bonus is paid
// for one caller rather than for "both roles present".
//
//   node tools/check-career-squad-roles.js
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
  const made = (handle, ovr, role) => ({handle:handle, nat:'de', region:'EU', org:null,
    tier:'ladder', event:'', date:'-', placement:null, rating:ovr, _targetOvr:ovr,
    _attrs:ccRookieAttrs(ovr, role)});
  const seed = (myRole, mateRoles, size) => { CAREER = {
    player:{nick:'Probe', ovr:80, ovrExact:80, region:'EU', role:myRole,
            country:'de', age:17, attrs:ccRookieAttrs(80, myRole)},
    career:{season:1, day:'2026-02-02', division:3, size:size||2, earnings:0, balance:0,
            tokens:[], log:[], news:[], form:0, grind:0},
    dms:[], gear:{own:[], train:0},
    partners:(mateRoles||[]).map((r,i)=>({card:made('Matey'+i, 78, r),
      handle:'Matey'+i, patience:80, since:'2026-01-05', dev:0}))}; };

  const done = () => {
    try {
      // ---- what the squad is missing ------------------------------------
      seed('roleFRG', []);
      check('a fragger alone is looking for a caller', ccSquadRoleWanted()==='roleIGL',
            String(ccSquadRoleWanted()));
      seed('roleIGL', []);
      check('and a caller alone is looking for a fragger', ccSquadRoleWanted()==='roleFRG',
            String(ccSquadRoleWanted()));
      // A trio with two seats open can take either — the last seat is the one
      // that has to answer for the caller.
      seed('roleFRG', [], 3);
      check('a trio with two seats open can take either', ccSquadRoleWanted()===null,
            String(ccSquadRoleWanted()));
      seed('roleFRG', ['roleFRG'], 3);
      check('and with one seat left it must be the caller',
            ccSquadRoleWanted()==='roleIGL', String(ccSquadRoleWanted()));
      seed('roleIGL', ['roleFRG'], 3);
      check('a trio that already calls fills up with fraggers',
            ccSquadRoleWanted()==='roleFRG', String(ccSquadRoleWanted()));

      // ---- swapping your own role ---------------------------------------
      /* One caller per squad still holds — but the rule used to hold the
         player still with it. A fragger sitting beside a caller had the button
         greyed out, the only caller had it greyed out too, and the search
         would not seat a second caller either, so a career that wanted to
         change halves of the game had no move at all. His player, 21 August:
         "не я не могу почему то и он не меняет".
         An invented squadmate moves over with you, because his role was never
         a fact about him — it is how his stats are laid out. */
      seed('roleFRG', ['roleIGL']);
      out.notes.besideCaller = ccRoleSwapCan();
      check('a fragger beside an invented caller may take the call',
            ccRoleSwapCan().ok, String(ccRoleSwapCan().why));
      check('and the invented caller is the one who moves over',
            (ccRoleSwapCan().move||{}).want==='roleFRG',
            JSON.stringify(ccRoleSwapCan().move));
      seed('roleIGL', ['roleFRG']);
      check('the only caller may stop calling if somebody picks it up',
            ccRoleSwapCan().ok, String(ccRoleSwapCan().why));
      check('and it is the invented fragger who picks it up',
            (ccRoleSwapCan().move||{}).want==='roleIGL',
            JSON.stringify(ccRoleSwapCan().move));
      // And it sticks. The seat's role lives on the record rather than on the
      // card, because ccMateLift rebuilds the card — and drops its laid-out
      // stats — on every rating the partner develops.
      careerRoleSwap();
      out.notes.afterSwap={mine: ccRoleNow(),
        mate: (attrsFor(careerMates()[0])||{}).roleKey};
      check('the swap moves both halves of the duo',
            ccRoleNow()==='roleFRG' &&
            (attrsFor(careerMates()[0])||{}).roleKey==='roleIGL',
            JSON.stringify(out.notes.afterSwap));
      check('and the recast keeps his rating',
            Math.abs((attrsFor(careerMates()[0])||{}).ovr-78)<=1,
            String((attrsFor(careerMates()[0])||{}).ovr));
      /* Настоящего игрока не пересаживают молча — но и не запрещают ему
         пересесть. Здесь стояло «рядом с настоящим кнопка гаснет», и это было
         прежним ограничением, а не правилом: его правка от 21 августа как раз
         про то, чтобы можно было предложить.

         Поэтому рядом с настоящим ИГЛом кнопка открыта, и в обмене помечено,
         что вторая половина — живой человек: careerRoleSwap на этой пометке и
         спрашивает, прежде чем двинуть кого-нибудь. Что он может отказаться и
         что отказ не двигает никого — у check-career-mate-role. */
      seed('roleFRG', ['roleIGL']);
      CAREER.partners[0].card.tier='cardmode';
      out.notes.besideRealCaller = ccRoleSwapCan();
      const beside=ccRoleSwapCan();
      check('a real caller beside you may be asked, not moved',
            beside.ok===true && !!beside.move && beside.move.real===true,
            JSON.stringify(out.notes.besideRealCaller));
      check('and the swap hands over calling',
            beside.move.want==='roleFRG' && beside.want==='roleIGL',
            beside.move.want+' / '+beside.want);
      seed('roleFRG', []);
      check('with the seat empty the role is yours to pick', ccRoleSwapCan().ok);
      // Two fraggers is a squad that is already wrong: swapping fixes it, so it
      // is allowed rather than locked.
      seed('roleFRG', ['roleFRG']);
      check('and a duo of two fraggers may fix itself', ccRoleSwapCan().ok);

      // ---- the search offers the missing half ---------------------------
      seed('roleFRG', []);
      CAREER.career.division=1;
      CC_DUO_SEAT=null;
      const pool=careerDuoSearchPool();
      out.notes.pool={n:pool.length, roles:Array.from(new Set(pool.map(p=>p.role)))};
      check('the search has somebody in it', pool.length>4, String(pool.length));
      /* Недостающая половина идёт первой, но список полный.
         Здесь стояло «в списке только она», и это было правилом ровно до того,
         как у разговора появился выход из совпавших ролей: раньше позвать «не
         ту» половину было некуда, поэтому её и прятали. Его правка от
         21 августа: «поиск нужно всех игроков, там только противоположная
         роль». Проверяется то, что осталось правдой — порядок. */
      const firstOther=pool.findIndex(p=>p.role!=='roleIGL');
      const lastWant=pool.map(p=>p.role).lastIndexOf('roleIGL');
      out.notes.poolOrder={firstOther:firstOther, lastWant:lastWant};
      check('the search shows everybody, not only one half',
            pool.some(p=>p.role!=='roleIGL'), out.notes.pool.roles.join(','));
      check('and the half you are missing comes first',
            firstOther<0 || lastWant<firstOther, JSON.stringify(out.notes.poolOrder));

      // ---- the lobby is cast the same way -------------------------------
      // Invented cards only: a real pair keeps the roles its own scene gave it.
      const igls = t => t.squad.filter(c=>attrsFor(c).roleKey==='roleIGL').length;
      const twoMade=[made('Aa', 70, 'roleIGL'), made('Bb', 70, 'roleIGL')];
      const t2=careerTeam(twoMade);
      out.notes.castDuo={igls: igls(t2), roles: t2.squad.map(c=>attrsFor(c).roleKey)};
      check('an invented duo of two callers is recast', igls(t2)===1,
            out.notes.castDuo.roles.join(','));
      const threeMade=[made('Cc', 70, 'roleFRG'), made('Dd', 70, 'roleFRG'), made('Ee', 70, 'roleFRG')];
      const t3=careerTeam(threeMade);
      out.notes.castTrio={igls: igls(t3), roles: t3.squad.map(c=>attrsFor(c).roleKey)};
      check('and an invented trio of three fraggers gets a caller', igls(t3)===1,
            out.notes.castTrio.roles.join(','));
      check('the recast keeps their rating',
            t3.squad.every(c=>Math.abs(attrsFor(c).ovr-70)<=1),
            t3.squad.map(c=>attrsFor(c).ovr).join(','));

      // ---- and the bonus is paid for one caller -------------------------
      // The role bonus lives in card mode, which is the mode a career plays in.
      const prevMode = CARD_MODE; CARD_MODE = true;
      const bonus = cards => buildTeam(cards).roleBonus;
      const twoCallers=bonus([made('Ff', 70, 'roleIGL'), made('Gg', 70, 'roleIGL')]);
      const oneCaller=bonus([made('Hh', 70, 'roleIGL'), made('Ii', 70, 'roleFRG')]);
      const trioTwoCallers=bonus([made('Jj',70,'roleIGL'), made('Kk',70,'roleIGL'), made('Ll',70,'roleFRG')]);
      const trioOneCaller=bonus([made('Mm',70,'roleIGL'), made('Nn',70,'roleFRG'), made('Oo',70,'roleFRG')]);
      out.notes.bonus={twoCallers, oneCaller, trioTwoCallers, trioOneCaller};
      check('one caller is worth the role bonus', oneCaller>0, String(oneCaller));
      check('two callers are worth nothing', twoCallers===0, String(twoCallers));
      check('a trio with two callers is worth nothing either',
            trioTwoCallers===0, String(trioTwoCallers));
      check('and a trio built the right way is paid',
            trioOneCaller===oneCaller, trioOneCaller + ' vs ' + oneCaller);
      CARD_MODE = prevMode;
    } catch (e) { out.err = String(e && e.stack || e); }
    document.getElementById('__out').textContent =
      'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
  };
  if (typeof ccMapsReady === 'function') ccMapsReady(done); else done();
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccrole2-'));
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
console.log('one caller per squad, and exactly one');
fs.rmSync(dir, { recursive: true, force: true });
