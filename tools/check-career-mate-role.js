// Роль меняется обменом, и у настоящего напарника её спрашивают.
//
// Его правка: «можно было менять роль или предложить игроку, с которым ты
// играешь, сменить роль, и статы у него поменяются».
//
// Односторонней пересадки в этом моде не бывает: ccSquadRoleFits держит ровно
// одного ИГЛа, так что уйти из роли можно только отдав её. Поэтому «предложить
// сменить роль» — это не отдельная кнопка, а вторая половина своей собственной,
// и проверяется здесь именно граница между «пересадить» и «попросить»:
//
//   * выдуманного соседа мод двигает молча — у него нет своих вечеров;
//   * настоящего — только после согласия, стоящего на его наклоне и терпении;
//   * отказ не двигает никого, включая тебя: иначе команда осталась бы без ИГЛа;
//   * согласившийся меняет шесть чисел и не меняет седьмое;
//   * пересадка переживает развитие, потому что живёт на записи, а не на карточке.
//
//   node tools/check-career-mate-role.js
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
  const done=()=>{
    try{
      localStorage.clear();
      careerEntry();
      ccPickRole('roleIGL'); ccPickDiv(1); ccPickRegion('EU'); ccPickCountry('de');
      const n=document.getElementById('ccNick');
      n.value='Caller'; n.dispatchEvent(new Event('input',{bubbles:true}));
      if(typeof ccSync==='function') ccSync();
      document.getElementById('ccStart').click();

      if(!careerPartnerCard()){
        careerSeatTopUp();
        const s=careerDms().find(x=>x.state==='offer' && !x.who.org && !x.who.brand);
        if(s) careerDmAccept(s.id);
      }
      const mate=careerPartnerCard();
      check('somebody is in the seat to ask', !!mate);
      if(!mate) throw new Error('no partner to ask');

      const roleOf=c=>(attrsFor(c)||{}).roleKey;
      const six=c=>{ const a=attrsFor(c)||{}; return ATTR_KEYS.map(k=>a[k]).join(','); };
      const before={who:mate.handle, real:mate.tier!=='ladder',
                    role:roleOf(mate), six:six(mate),
                    ovr:Math.round(attrsFor(mate).ovr)};
      out.notes.before=before;
      check('mine is IGL and the seat beside me is not',
            ccRoleNow()==='roleIGL' && before.role==='roleFRG',
            ccRoleNow()+' / '+before.role);

      /* ---- обмен, а не пересадка --------------------------------------
         Уйти из роли одному нельзя: команда без ИГЛа не играет. Кнопка
         открывается ровно потому, что рядом есть кому её принять. */
      const can=ccRoleSwapCan();
      out.notes.can={ok:can.ok, want:can.want, why:can.why,
                     move:can.move && {at:can.move.at, want:can.move.want,
                                       real:can.move.real}};
      check('stepping out of calling is only possible as a swap',
            can.ok===true && !!can.move && can.move.want==='roleIGL',
            JSON.stringify(out.notes.can));
      check('and the mode knows whether the other half is a real player',
            can.move.real===before.real, String(can.move.real));

      // ---- отказ не двигает никого ------------------------------------
      const rec=careerMateRecords()[0];
      const odds=careerMateRoleOdds(0, can.move.want);
      out.notes.odds={patience:odds.patience, need:odds.need, lean:odds.lean,
                      yes:odds.yes};
      check('the answer is made of his patience against his shape',
            odds.need===Math.max(5, Math.min(95, Math.round(50-odds.lean*4))),
            odds.need+' from lean '+odds.lean);
      const twice=careerMateRoleOdds(0, can.move.want);
      check('and it is the same answer twice',
            twice.yes===odds.yes && twice.need===odds.need,
            JSON.stringify(out.notes.odds));

      if(before.real){
        rec.patience=Math.max(0, odds.need-10);
        careerRoleSwap();
        out.notes.refused={mine:ccRoleNow(), his:roleOf(careerPartnerCard()),
                           patience:rec.patience};
        /* Обе половины на месте. Двинуть себя и услышать «нет» значило бы
           оставить команду без зовущего — то есть сломать состав отказом. */
        check('a no moves nobody, me included',
              ccRoleNow()==='roleIGL' && roleOf(careerPartnerCard())===before.role,
              JSON.stringify(out.notes.refused));
        rec.patience=Math.min(100, odds.need+10);
      }

      // ---- согласие двигает обоих --------------------------------------
      careerRoleSwap();
      const after=careerPartnerCard();
      out.notes.after={mine:ccRoleNow(), his:roleOf(after), six:six(after),
                       ovr:Math.round(attrsFor(after).ovr)};
      check('a yes moves both halves',
            ccRoleNow()==='roleFRG' && roleOf(after)==='roleIGL',
            JSON.stringify(out.notes.after));
      check('his six numbers are different afterwards', six(after)!==before.six,
            out.notes.after.six+' vs '+before.six);
      /* И седьмое — то же. Пересевший не стал хуже или лучше, он стал делать
         другое; рейтинг у роли не занимают. */
      check('and his rating is not', Math.abs(out.notes.after.ovr-before.ovr)<=1,
            out.notes.after.ovr+' vs '+before.ovr);
      check('the squad still has exactly one caller',
            ccSquadRoles().filter(r=>r==='roleIGL').length===1,
            ccSquadRoles().join(','));

      /* ---- и пересадка переживает развитие -----------------------------
         ccMateLift пересобирает карточку под каждый новый рейтинг и стирает с
         неё разложенные статы, поэтому согласие записано на pr.role. Без этого
         напарник возвращался бы в свою роль после первого же вечера. */
      check('the move is stored on the record', rec.role==='roleIGL',
            String(rec.role));
      rec.dev=(rec.dev||0)+3;
      const later=careerPartnerCard();
      out.notes.afterDev={his:roleOf(later), ovr:Math.round(attrsFor(later).ovr)};
      check('and it survives him developing', roleOf(later)==='roleIGL',
            JSON.stringify(out.notes.afterDev));

      /* ---- охрана на месте --------------------------------------------
         ccCastLadderRole отличает придуманного от настоящего, иначе
         ccSquadCastRoles молча переписывала бы измеренные статы всякий раз,
         когда собирает лобби. Согласие снимает эту дверь, и только оно. */
      const real=PLAYERS.find(p=>p.region==='EU' && p.tier==='cardmode' &&
                                 ccCardYear(p)===CC_NOW_YEAR);
      const copy={...real, _attrs:null};
      const want=ccRoleOther((attrsFor(copy)||{}).roleKey);
      out.notes.guard={handle:copy.handle, want:want,
                       cast:ccCastLadderRole(copy, want),
                       recast:ccRecastRole({...copy, _attrs:null}, want)};
      check('a real card is not recast without a word',
            out.notes.guard.cast===false, JSON.stringify(out.notes.guard));
      check('but it can be recast once there is one',
            out.notes.guard.recast===true, JSON.stringify(out.notes.guard));
    }catch(e){ out.err=String(e && e.stack || e); }
    document.getElementById('__out').textContent=
      'PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
  };
  if(typeof ccMapsReady==='function') ccMapsReady(done); else done();
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mrole-'));
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
console.log('a role changes by swap, and a real partner is asked');
fs.rmSync(dir, { recursive: true, force: true });
