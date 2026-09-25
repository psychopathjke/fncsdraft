// В список на выбор не попадает тот, кто в сборной уже сидит.
//
// Его слово 22 сентября, со скриншотами: на карточке сборной «Skvii 85 #3
// TRIAL SEAT», и он же стоит среди выбираемых — «#3 Skvii 85». То же с
// «1Lusha 83». Одного человека можно было взять в состав вторым.
//
// Починено там же 22 сентября: место отбора достаётся лучшему из невыбранных
// (rest[0]), и пул выбора в ccNatSquadHTML отрезает его — .slice(1). Пробы на
// это не было, а правило держится ровно на одном срезе: сдвинется он, и
// капитан снова увидит в списке собственного четвёртого.
//
// Здесь проверяется результат: ни одна карточка из состава не предлагается к
// выбору, и в самом составе нет повторов.
//
//   node tools/check-career-nat-pick.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');
const SL = String.fromCharCode(92);
const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out={fails:[], notes:{}, errs:[], err:null};
  window.addEventListener('error', e=>out.errs.push(String(e.message)+' @'+e.lineno));
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  const card=(h,o)=>({handle:h, region:'EU', rating:o, _ovr:o, nat:'de', tier:'ladder',
                      event:'ladder', placement:null, rarity:'common', partner:null});
  try{
    /* Капитаном сборной: только капитан вообще видит список выбора. Рейтинг
       высокий, чтобы им и оказаться. */
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Natman', age:20, source:'rookie', country:'ru', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:96, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, size:2, year:2026, year0:2026, day:'2026-11-07', division:1,
              earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'natpick'},
      partner:{card:card('M1',88), patience:60, since:'2026-01-01', dev:0},
      partners:[{card:card('M1',88), patience:60, since:'2026-01-01', dev:0}]}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs=ccRookieAttrs(96,'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerEntry();

    const mine=ccNationsMine();
    check('сборная собралась', !!mine, String(mine));
    if(mine){
      const N=ccNatState();
      /* Отбор должен быть сыгран — до него списка выбора нет вовсе (капитану
         показывают «после отбора»). Ставим его результат руками. */
      if(!(N.trialRank && N.trialRank.length)){
        N.trialRank=(mine.ranked||[]).map(hKey);
        careerSave();
      }
      const m2=ccNationsMine();
      const html=ccNatSquadHTML()||'';
      out.notes.капитан=!!m2.captain;
      out.notes.состав=(m2.squad||[]).map(c=>c?(c.handle+' '+ccCardOvr(c)):'—');

      // Кого предлагают: ключи со всех кнопок выбора.
      const keys=[];
      html.replace(/ccNatPick\\('([^']*)'\\)/g, function(_, k){ keys.push(k); return _; });
      // Кнопка снятия выбора тоже зовёт ccNatPick — её отсекаем по классу.
      const pickKeys=[];
      html.replace(/<button class="cc-nat-chip" onclick="ccNatPick\\('([^']*)'\\)/g,
                   function(_, k){ pickKeys.push(k); return _; });
      out.notes.предлагают=pickKeys.length;

      const seated=new Set((m2.squad||[]).filter(Boolean).map(hKey));
      const clash=pickKeys.filter(k=>seated.has(k));
      out.notes.ивСоставеИвСписке=clash;
      check('никого из состава не предлагают выбрать заново', clash.length===0,
            JSON.stringify({состав:out.notes.состав, пересечение:clash}));

      const inSquad=(m2.squad||[]).filter(Boolean).map(hKey);
      check('в составе нет повторов', new Set(inSquad).size===inSquad.length,
            JSON.stringify(out.notes.состав));

      check('список выбора не пуст', pickKeys.length>0 || (m2.picks||[]).length>=2,
            JSON.stringify({предлагают:pickKeys.length, выбрано:(m2.picks||[]).length}));

      /* И сам пробный игрок — именно тот, кого правило обещает: лучший из
         невыбранных по отбору, rest[0]. */
      const pk=(m2.picks||[]).map(hKey);
      const rest=(m2.ranked||[]).filter(p=>pk.indexOf(hKey(p))<0);
      const trial=(m2.squad||[])[3];
      out.notes.пробное=trial?trial.handle:null;
      check('на пробном месте стоит лучший из невыбранных',
            !trial || (rest[0] && hKey(rest[0])===hKey(trial)),
            JSON.stringify({пробное:out.notes.пробное, ожидалось:rest[0]?rest[0].handle:null}));
    }
    /* И то, из-за чего он обвёл красным заголовок карточки: страна там была
       написана по-русски посреди английского интерфейса, а рядом должен стоять
       её флаг. Оба берутся по НАЗВАНИЮ страны — NAT_EN и FLAG_CODE, — и новая
       страна в сцене без строки в этих таблицах молча отдаёт русское слово и
       пустое место вместо флага. */
    const book=(typeof ccNationsBook==='function') ? ccNationsBook() : null;
    const nats=(book && book.byNat) ? Object.keys(book.byNat) : [];
    check('страны сцены прочитались', nats.length>0, String(nats.length));
    LANG='en';
    const безПеревода=nats.filter(n=>!NAT_EN[n]);
    const безФлага=nats.filter(n=>!flagImg(n, 16));
    out.notes.стран=nats.length;
    out.notes.безПеревода=безПеревода;
    out.notes.безФлага=безФлага;
    check('у каждой страны есть английское имя', безПеревода.length===0,
          безПеревода.slice(0,8).join(', '));
    check('у каждой страны есть флаг', безФлага.length===0, безФлага.slice(0,8).join(', '));
    LANG='ru';

    check('без ошибок JS', out.errs.length===0, out.errs.slice(0,3).join(' | '));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccnat-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(SL).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const html = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=300000', '--dump-dom',
  'file:///' + tmp.split(SL).join('/')], { maxBuffer: 1 << 28, timeout: 900000 }).toString();
const m = /PBEGIN(.*?)PEND/.exec(html);
if (!m) { console.log('FAIL: no result'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out.notes));
if (out.errs && out.errs.length) out.errs.slice(0, 5).forEach(e => console.log('JSERR ' + e.slice(0, 300)));
if (out.err) { console.log('ERR ' + out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
console.log('OK check-career-nat-pick');
