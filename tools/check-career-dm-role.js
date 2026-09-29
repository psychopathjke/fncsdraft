// Одна роль на двоих — это выбор, а не тупик.
//
// Написать можно кому угодно, включая свою же половину игры. Раньше на этом всё
// и кончалось: жмёшь «взять», мод печатает «кто-то из нас должен пересесть» и
// делает return. Выхода из этой строки не было ни одного, и жать можно было
// сколько угодно — его сообщение, 21 августа: «жму и ничего не происходит,
// нужно дать выбор — спросить, пересядет ли игрок на другую роль, или самому
// стать ролью того, кто нужен».
//
// Проверяется то, из чего этот выбор сделан:
//   * тупик помечает ветку, а не сыплет одинаковыми репликами;
//   * недостающая роль — противоположная его, в обе стороны;
//   * «пусть пересядет он» — просьба, и он может отказаться;
//   * согласие едет с ним в кресло и переживает развитие;
//   * «пересяду сам» отказа не знает — это своя роль;
//   * после любого исхода в команде ровно один зовущий.
//
//   node tools/check-career-dm-role.js
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
  const start=(role)=>{
    localStorage.clear();
    careerEntry();
    ccPickRole(role); ccPickDiv(1); ccPickRegion('EU'); ccPickCountry('de');
    const n=document.getElementById('ccNick');
    n.value='Asker'; n.dispatchEvent(new Event('input',{bubbles:true}));
    if(typeof ccSync==='function') ccSync();
    document.getElementById('ccStart').click();
    (CAREER.partners||[]).length=0;
    careerSave();
  };
  /* Заявка от человека той же роли, что и у игрока: ровно тот случай, который
     упирался в стену. Берётся с роастера, чтобы это был настоящий игрок. */
  const clashThread=()=>{
    const want=ccRoleNow();
    const who=careerRosterNowEU().find(p=>attrsFor(p).roleKey===want &&
                                          !ccMyPeople().has(hKey(p)));
    if(!who) return null;
    const t=careerDmThread({handle:who.handle, ovr:who._ovr, nat:who.nat,
      role:attrsFor(who).roleKey, roster:true, cardRegion:who.region||'EU',
      club:who.org||null, pay:0});
    careerDmPush(t, 'them', 'dmNoPartner', [who._ovr]);
    t.state='offer';
    careerSave();
    return t;
  };
  const done=()=>{
    try{
      // ---- тупик помечается, а не повторяется --------------------------
      start('roleFRG');
      const t=clashThread();
      check('somebody of the same role wrote', !!t);
      if(!t) throw new Error('no same-role candidate on the roster');
      const before=t.msgs.length;
      careerDmAccept(t.id);
      const afterOne=t.msgs.length;
      careerDmAccept(t.id);
      out.notes.clash={role:t.who.role, mine:ccRoleNow(), need:t.roleFix,
                       msgs:[before, afterOne, t.msgs.length]};
      check('the squad is short the other half', t.roleFix==='roleIGL',
            String(t.roleFix));
      check('and the line is said once, not once per press',
            t.msgs.length===afterOne, JSON.stringify(out.notes.clash));
      check('nobody was seated on the way', !careerPartnerCard());

      // ---- и в обратную сторону ----------------------------------------
      start('roleIGL');
      const t2=clashThread();
      careerDmAccept(t2.id);
      out.notes.otherWay={mine:ccRoleNow(), his:t2.who.role, need:t2.roleFix};
      check('two callers are short a fragger instead', t2.roleFix==='roleFRG',
            JSON.stringify(out.notes.otherWay));

      // ---- «пересяду сам» отказа не знает ------------------------------
      const need2=t2.roleFix;
      careerDmRoleMine(t2.id);
      out.notes.mine={now:ccRoleNow(), seated:!!careerPartnerCard(),
                      roles:ccSquadRoles()};
      check('taking it myself moves me', ccRoleNow()===need2, String(ccRoleNow()));
      check('and seats him straight after', !!careerPartnerCard(),
            JSON.stringify(out.notes.mine));
      check('one caller in the squad',
            ccSquadRoles().filter(r=>r==='roleIGL').length===1,
            ccSquadRoles().join(','));

      // ---- «пусть пересядет он» — просьба ------------------------------
      start('roleFRG');
      const t3=clashThread();
      careerDmAccept(t3.id);
      const odds=careerDmRoleOdds(t3);
      out.notes.odds={need:odds.need, want:odds.want, lean:odds.lean, yes:odds.yes};
      check('the answer is made of his shape against what the seat is worth',
            odds.need===Math.max(5, Math.min(95, Math.round(50-odds.lean*4))),
            JSON.stringify(out.notes.odds));
      const twice=careerDmRoleOdds(t3);
      check('and it is the same answer twice', twice.yes===odds.yes,
            JSON.stringify(out.notes.odds));

      /* Отказ: ставим ему форму, при которой просьба идёт против его игры.
         Никто при этом не двигается — ни он, ни игрок. */
      const card=ccDmWhoCard(t3.who);
      const a=attrsFor(card);
      card._attrs={...a, aim:99, clu:99, end:40, sur:40, _floored:false};
      const no=careerDmRoleOdds(t3);
      out.notes.refuse={need:no.need, want:no.want, yes:no.yes};
      check('a shape all the way against it refuses', no.yes===false,
            JSON.stringify(out.notes.refuse));
      careerDmRoleTheirs(t3.id);
      out.notes.afterNo={seated:!!careerPartnerCard(), mine:ccRoleNow(),
                         stillAsking:t3.roleFix};
      check('a no seats nobody and moves nobody',
            !careerPartnerCard() && ccRoleNow()==='roleFRG' && t3.roleFix==='roleIGL',
            JSON.stringify(out.notes.afterNo));

      // Согласие: форма в сторону просьбы.
      card._attrs={...a, aim:40, clu:40, end:99, sur:99, _floored:false};
      const yes=careerDmRoleOdds(t3);
      check('a shape that fits it agrees', yes.yes===true,
            JSON.stringify({need:yes.need, want:yes.want}));
      careerDmRoleTheirs(t3.id);
      const seated=careerPartnerCard();
      out.notes.afterYes={seated:seated && seated.handle,
                          his:seated && attrsFor(seated).roleKey,
                          mine:ccRoleNow()};
      check('a yes seats him in the role he agreed to',
            seated && attrsFor(seated).roleKey==='roleIGL',
            JSON.stringify(out.notes.afterYes));
      check('and I stayed where I was', ccRoleNow()==='roleFRG', String(ccRoleNow()));
      check('one caller here too',
            ccSquadRoles().filter(r=>r==='roleIGL').length===1,
            ccSquadRoles().join(','));

      /* И пересадка живёт на записи, а не на карточке: ccMateLift пересобирает
         карточку под каждый новый рейтинг и стирает разложенные статы. */
      const rec=careerMateRecords()[0];
      rec.dev=(rec.dev||0)+3;
      out.notes.afterDev={role:attrsFor(careerPartnerCard()).roleKey,
                          stored:rec.role};
      check('and it survives him developing',
            attrsFor(careerPartnerCard()).roleKey==='roleIGL',
            JSON.stringify(out.notes.afterDev));

      /* ---- его роль держит НАПАРНИК, а не ты ----------------------------
         Скрин 29.09: трио, ты ФРГ, рядом ИГЛ, пишет ещё один ИГЛ. «Беру ФРГ я»
         ничего не меняло — ты уже ФРГ — и ветка шла по кругу: «Ты тоже ИГЛ» /
         «Хорошо, тогда ФРГ беру я» раз за разом. Теперь называется напарник,
         «пересяду сам» не предлагается, повторное нажатие реплик не множит. */
      const realSize=careerSquadSize, realSeats=careerMateSeats;
      careerSquadSize=()=>3; careerMateSeats=()=>2;
      const t4=clashThread() || (()=>{ throw new Error('no second IGL'); })();
      // Пишет ИГЛ, а не игрок той же роли, что ты: clashThread берёт роль игрока (ФРГ).
      const igl=careerRosterNowEU().find(p=>attrsFor(p).roleKey==='roleIGL' && !ccMyPeople().has(hKey(p)));
      t4.who={handle:igl.handle, ovr:igl._ovr, nat:igl.nat, role:'roleIGL', roster:true,
              cardRegion:igl.region||'EU', club:null, pay:0};
      const m0=t4.msgs.length;
      careerDmAccept(t4.id);
      const m1=t4.msgs.length;
      const last=t4.msgs[t4.msgs.length-1]||{};
      careerDmRoleMine(t4.id); careerDmRoleMine(t4.id); careerDmAccept(t4.id);
      out.notes.mateHolds={mine:ccRoleNow(), need:t4.roleFix, mineOk:t4.roleMineOk,
        mate:t4.roleMate, key:last.key||last.k||last.text, msgs:[m0, m1, t4.msgs.length]};
      check('the clash names the mate who holds the role', t4.roleMineOk===false && !!t4.roleMate,
            JSON.stringify(out.notes.mateHolds));
      check('and says so, not «you are an IGL too»', JSON.stringify(last).indexOf('dmRoleClashMate')>=0,
            JSON.stringify(last));
      check('pressing «I take it» again adds nothing', t4.msgs.length===m1,
            JSON.stringify(out.notes.mateHolds));
      check('with a free seat left there is nobody to replace', t4.roleMate && t4.roleMate.swap===false,
            JSON.stringify(t4.roleMate));
      // Полный состав: ИГЛ-напарник сильнее ФРГ-напарника, уходит слабый — ИГЛ остаётся.
      const realMates=careerMates;
      const scroll=realMates()[0];
      const weakFrg=careerRosterNowEU().filter(p=>attrsFor(p).roleKey==='roleFRG' && !ccMyPeople().has(hKey(p)))
        .sort((a,b)=>attrsFor(a).ovr-attrsFor(b).ovr)[0];
      careerMates=()=>[scroll, weakFrg];
      t4.roleFix=null; t4.roleFixKey=null;
      careerDmAccept(t4.id);
      out.notes.full={mate:t4.roleMate, mineOk:t4.roleMineOk};
      check('a full squad offers to take the mate’s seat', t4.roleMate && t4.roleMate.swap===true &&
            t4.roleMate.handle===scroll.handle, JSON.stringify(out.notes.full));
      careerMates=realMates;
      careerSquadSize=realSize; careerMateSeats=realSeats;
    }catch(e){ out.err=String(e && e.stack || e); }
    document.getElementById('__out').textContent=
      'PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
  };
  if(typeof ccMapsReady==='function') ccMapsReady(done); else done();
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dmrole-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g, '/') + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=120000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out.notes, null, 1));
if (out.err) { console.error(out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('one role between two is a choice, not a wall');
fs.rmSync(dir, { recursive: true, force: true });
