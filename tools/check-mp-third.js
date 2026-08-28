// Третьего в команду берут двое, и спрашивают именем.
//
// Его слово, 27 августа: «тимейта ищут тоже выбор двоих должен учитываться,
// кто-то нажимается взять в трио и у его тимейта высвечивается берем ли в
// комнаду». Раньше третьего сажал владелец лобби молча, а второй узнавал об
// этом по составу.
//
// Тонкое место здесь одно, и оно стоит всей проверки: письма про кресло лежат
// в ЛИЧНОМ инбоксе — их пишут одному владельцу лобби (careerSeatDm). Значит
// послать напарнику номер ветки нельзя: у него такой ветки нет, и вопрос
// вышел бы с пустым именем. По проводу едет имя, а садит третьего тот, у кого
// письмо; запись о нём уезжает вторым обычным путём — полем mates командного
// состояния.
//
// Сама посадка на два «да» проверяется в tools/check-mp-no-randoms.js, здесь —
// сторона напарника и то, что уезжает по проводу.
//
//   node tools/check-mp-third.js

const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out={fails:[], notes:{}, err:null};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  const sent=[];
  const seed=(lobbyRole)=>{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Third', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:0, region:'EU', ovr:90, role:'roleIGL',
        attrs:ccRookieAttrs(90,'roleIGL'), ageEdge:0, photo:null,
        handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:0,
              reach:0, tokens:[], log:[], news:[], seed:'fixed-world',
              size:3, sizes:{1:3}, mp:{code:'ABC123', role:lobbyRole}},
      partners:[]}));
    careerLoad();
    MP.peer={handle:'howly', nat:'ru', region:'EU', rating:91,
             _targetOvr:91, _attrs:null, _roleKey:'roleFRG'};
    sent.length=0;
    MP.send=function(m){ sent.push(m); };
    ccMpThirdWire();
  };
  const offers=()=>careerDms().filter(t=>t.state==='offer' && t.who &&
                                         !t.who.org && !t.who.brand);
  try{
    // ---- сторона предлагающего: по проводу уходит ИМЯ --------------------
    seed('a');
    careerSeatTopUp();
    const one=offers()[0];
    check('владельцу лобби пишут про третье кресло', !!one);
    ccMpThirdAsk(one.id);
    const msg=sent.filter(m=>m.t==='act' && m.kind==='third')[0];
    out.notes.предложение=msg && msg.payload;
    check('предложение ушло напарнику', !!msg);
    check('и оно несёт имя, а не только номер письма',
          !!(msg && msg.payload && msg.payload.who),
          JSON.stringify(msg && msg.payload));
    check('имя — то же, что в письме',
          !!(msg && msg.payload.who===ccMpThirdWho(one.id)),
          JSON.stringify(msg && msg.payload.who));
    check('пока ждём — на экране об этом сказано',
          !!document.querySelector('.cc-mp-wait'));

    /* ---- сторона напарника: инбокс пустой, а вопрос всё равно с именем ---
       Ровно тот случай, ради которого имя и едет: ветки с таким id у него
       нет и быть не может. */
    seed('b');
    check('второму в лобби писем про кресло не приходит', offers().length===0,
          String(offers().length));
    MP.say({t:'act', kind:'third', by:'other',
            payload:{id:'нетТакойВетки', by:'other', who:'howly'}});
    const modal=document.getElementById('ccAskModal');
    const text=(document.getElementById('ccAskText')||{}).textContent||'';
    out.notes.вопрос=text;
    check('напарника спросили', modal && modal.style.display==='flex',
          modal && modal.style.display);
    check('и спросили именем, а не номером', text.indexOf('howly')>=0, text);

    // Ответ уходит обратно и адресован тому, кто спрашивал.
    ccAskGo(true);
    const back=sent.filter(m=>m.t==='act' && m.kind==='third-ok')[0];
    out.notes.ответ=back && back.payload;
    check('ответ ушёл', !!back);
    check('ответ — согласие', !!(back && back.payload.ok===true));
    check('и адресован тому, кто предлагал',
          !!(back && back.payload.to==='other'), JSON.stringify(back && back.payload));

    /* Отвечавший НЕ сажает: у него нет ветки, и посадка на его стороне
       означала бы двух разных третьих в одной команде. Состав приедет ему
       полем mates. */
    MP.say({t:'act', kind:'third-ok', by:'other',
            payload:{id:'нетТакойВетки', ok:true, to:'other'}});
    check('отвечавший никого не сажает', careerMates().length===1,
          JSON.stringify(careerMates().map(m=>m&&m.handle)));
  }catch(e){ out.err=String(e&&e.stack||e); }
  document.getElementById('__out').textContent=
    'PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mpthird-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('проба не отработала; копия в ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('третьего берут двое, и спрашивают именем');
fs.rmSync(dir, { recursive: true, force: true });
