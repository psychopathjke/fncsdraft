// В команде третьего на трио-капы дуо-года выбирают ДВОЕ, и на вечере играет выбранный, а не филл.
//
// Его вопрос 22.10: «всем филом, а выбрать игрока я могу?» (Telegram: «в трио чела позвать невозможно» — кнопка
// «Позвать» в онлайне была мёртвой). Теперь: «Позвать» открывает поиск сцены, по проводу уходит 'fmtpick' с ником,
// напарника спрашивают именем, ответ 'fmtpick-ok' применяют ОБА (эхо приходит и звавшему) в cr.fmtPick — ключ
// команды; ccMpFmtBegin сажает выбранного первым, филл — на остаток.
//
//   node tools/check-mp-fmt-pick.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(String.fromCharCode(92)).join('/');
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out={fails:[], notes:{}, err:null};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d!==undefined?': '+d:'')); };
  const sent=[];
  const seed=(role)=>{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'ev1lstephan', age:20, source:'rookie', country:'ru', countryPing:15, closeRangeEdge:0, region:'EU',
        ovr:88, role:'roleIGL', attrs:ccRookieAttrs(88,'roleIGL'), ageEdge:0, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, year:2024, year0:2024, day:'2024-09-30', division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[],
              seed:'fixed-world', mp:{code:'ABC123', role:role}},
      partners:[]}));
    careerLoad();
    MP.peer={handle:'Misery', nat:'ru', region:'EU', rating:88, _targetOvr:88, _attrs:null, _roleKey:'roleFRG'};
    sent.length=0;
    MP.send=function(m){ sent.push(m); };
    ccMpThirdWire();
  };
  try{
    seed('a');
    check('онлайн включён', ccMpOn()===true);
    check('год — дуо, трио-кап впереди и сбор открыт', careerSquadSize()===2 && !!ccFormatNext(3) && !ccFmtOpenFrom(3),
          careerSquadSize()+' '+ccFormatNext(3)+' '+ccFmtOpenFrom(3));
    // Кнопка в плитке «Составы» — живая: открывает поиск формата 3.
    const tile=ccRostersTileHTML();
    check('в плитке у трио есть «Позвать»', /ccDuoFindOpen\\(null, 3\\)/.test(tile));
    ccDuoFindOpen(null, 3);
    check('поиск открылся (в команде он был закрыт молча)', document.getElementById('duoFindModal').style.display==='flex');
    check('и он — для трио', CC_DUO_FMT===3, String(CC_DUO_FMT));
    const btns=[...document.querySelectorAll('#duoFindBody .cc-buy button.ch-sign')];
    check('у строк поиска — кнопка «Позвать», без писем и лимитов', btns.length>0, String(btns.length));
    const pick=careerDuoSearchPool(true).find(w=>w && w.handle && !w.club) || careerDuoSearchPool(true)[0];
    out.notes.pick=pick && pick.handle;
    ccDuoFindWrite(pick.handle);
    const ask=sent.filter(m=>m.t==='act' && m.kind==='fmtpick')[0];
    check('по проводу ушло предложение с ником и форматом', !!(ask && ask.payload.h===pick.handle && ask.payload.f===3), JSON.stringify(ask && ask.payload));
    check('письма в личку не было', !careerDmFind(pick.handle));
    check('пока ждём — окно ожидания', !!document.querySelector('.cc-mp-wait'));
    check('до ответа никто не выбран', !((CAREER.career.fmtPick||{})[3]||[]).length);
    // Ответ «нет» — ничего не меняется.
    MP.say({t:'act', kind:'fmtpick-ok', by:'other', payload:{f:3, h:pick.handle, ok:false, to:ccMpId(), by:'other'}});
    check('на «нет» никто не садится', !((CAREER.career.fmtPick||{})[3]||[]).length);
    // Ответ «да» — садится у звавшего.
    MP.say({t:'act', kind:'fmtpick-ok', by:'other', payload:{f:3, h:pick.handle, ok:true, to:ccMpId(), by:'other'}});
    check('на «да» выбранный записан', ((CAREER.career.fmtPick||{})[3]||[])[0]===pick.handle, JSON.stringify(CAREER.career.fmtPick));
    check('выбор — ключ команды (уедет напарнику и переживёт перезаход)', CC_TEAM_KEYS.indexOf('fmtPick')>=0 && 'fmtPick' in ccTeamState());
    const tile2=ccRostersTileHTML().replace(/<[^>]+>/g,' ');
    out.notes.tile=tile2.replace(/\\s+/g,' ').slice(0,400);
    check('плитка показывает троих', tile2.indexOf(pick.handle)>=0 && /3\\/3/.test(tile2), tile2.replace(/\\s+/g,' '));
    // Вечер трио-капа: выбранный — в составе, филла нет.
    const sw=ccMpFmtBegin(3);
    const mates=(CC_MP_FMT_MATES||[]).map(r=>r && r.card && r.card.handle);
    out.notes.night=mates;
    check('на вечере играет выбранный', mates[0]===pick.handle, JSON.stringify(mates));
    check('и он один — третье место занято им, а не филлом', mates.length===1, JSON.stringify(mates));
    ccEventRosterEnd(sw);

    // ---- сторона напарника: спрашивают именем, отвечает «да», и у него тоже записано ----
    seed('b');
    MP.say({t:'act', kind:'fmtpick', by:'other', payload:{f:3, h:pick.handle, by:'other'}});
    const text=(document.getElementById('ccAskText')||{}).textContent||'';
    out.notes.question=text;
    check('напарника спросили', document.getElementById('ccAskModal').style.display==='flex');
    check('и спросили именем', text.indexOf(pick.handle)>=0, text);
    ccAskGo(true);
    const back=sent.filter(m=>m.t==='act' && m.kind==='fmtpick-ok')[0];
    check('ответ «да» ушёл звавшему', !!(back && back.payload.ok===true && back.payload.to==='other'), JSON.stringify(back && back.payload));
    MP.say({t:'act', kind:'fmtpick-ok', by:ccMpId(), payload:back.payload});
    check('и у отвечавшего тот же выбор (садят оба на одном событии)', ((CAREER.career.fmtPick||{})[3]||[])[0]===pick.handle, JSON.stringify(CAREER.career.fmtPick));
  }catch(e){ out.err=String(e&&e.stack||e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mpfmt-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--user-data-dir=' + path.join(dir, 'p'),
  '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom', 'file:///' + tmp.split(String.fromCharCode(92)).join('/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const m = dom.match(/PBEGIN([\w%\-.!~*'()]*)PEND/);
if (!m) { console.error('проба не отработала; копия в ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out.notes, null, 1));
if (out.err) { console.error(out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('третьего на трио-капы в команде выбирают двое, и на вечере играет он');
fs.rmSync(dir, { recursive: true, force: true });
