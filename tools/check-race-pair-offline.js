// Пара в гонке — без сокета: договор, состав, адрес вопросов, строка и плитка.
//
// Живой сторож (check-race-pair.js, настоящий воркер) играет вечер; здесь дешёвая часть:
// приглашение и согласие по проводу (act pair/pairok/unpair через ccRacePairSaw), пара только в
// дуо-сезон и в одном дивизионе, состав пары у обоих один (ccRacePairCards — по hKey), команда
// пары (ccRacePairTeamInto) с mpTag старшего, строка гонки везёт напарника-человека и bench,
// соперник-пара садится по строке старшего, плитка рисует кнопки.
//
//   node tools/check-race-pair-offline.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
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
  const out={fails:[], notes:{}, err:null};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({v:1, player:{nick:'Alfa', age:19, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6, region:'EU', ovr:90, role:'roleIGL', attrs:null, ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], race:{code:'PAIR01', role:'a', since:'2026-02-02'}}, partners:[]}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career')); s.player.attrs=ccRookieAttrs(90,'roleIGL'); localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerLoad();
    // свой бот-напарник
    const pool=ccSceneRoster('EU').filter(c=>hKey(c)!==hKey(careerCard()));
    careerMateSeat({handle:pool[0].handle, cardRegion:pool[0].region, patience:60, since:'2026-01-01'});
    const me=ccMpId();
    // соперник по проводу: строка гонки с карточкой (упакованной, как шлёт ccRacePackCard)
    const rivalCard=ccRacePackCard(pool[5]), rivalMate=ccRacePackCard(pool[6]);
    const sent=[]; MP.act=function(k,p){ sent.push({k,p}); };
    CC_RACE_PEERS['peerB']={id:'peerB', card:rivalCard, mates:[rivalMate], div:1, season:1, day:'2026-02-02', pow:100, nick:'Beta'};
    check('до договора пары нет', !ccRacePairOn());
    check('под строками — явная кнопка «Объединиться с Beta», строка раскрывается по нажатию', /ccRaceRowToggle\\('peerB'\\)/.test(careerRaceTileHTML()) && careerRaceTileHTML().indexOf(L().ccRacePairWithBtn('Beta'))>=0 && /cc-race-pane-all/.test(careerRaceTileHTML()));
    ccRaceRowToggle('peerB');
    check('после нажатия — «Объединиться» с подсказкой', /careerRacePairAsk\\('peerB'\\)/.test(careerRaceTileHTML()) && careerRaceTileHTML().indexOf(L().ccRacePairHint)>=0);
    const botBefore=careerMates()[0] && careerMates()[0].handle;
    // 1. я зову — уходит act pair, плитка ждёт
    careerRacePairAsk('peerB');
    check('приглашение ушло', sent.some(x=>x.k==='pair' && x.p.to==='peerB'), JSON.stringify(sent));
    check('плитка: «зовёшь в пару»', careerRaceTileHTML().indexOf(L().ccRacePairSent)>=0);
    // 2. согласие приходит — пара стоит, строка гонки везёт человека и bench
    CC_RACE_PEERS['peerB'].pair=me;
    ccRacePairSaw({kind:'pairok', payload:{by:'peerB', to:me, nick:'Beta'}});
    check('пара стоит', ccRacePairOn() && ccRacePairId()==='peerB', JSON.stringify(CAREER.career.race.pair));
    check('свой бот отпущен и ищет команду', careerMateRecords().length===0 && (CAREER.career.news||[]).some(n=>JSON.stringify(n).indexOf('ccNewsPairFreed')>=0 || /свободен|free agent/.test(String(n.text||''))), JSON.stringify({recs:careerMateRecords().length, bot:botBefore}));
    check('напарник теперь — друг (careerMates)', careerMates().length===1 && hKey(careerMates()[0])===hKey(rivalCard), JSON.stringify(careerMates().map(m=>m.handle)));
    check('кубок играть можно — напарника хватает', !careerNoMate('cup'));
    const cards=ccRacePairCards();
    check('состав пары — две карточки людей по hKey', cards && cards.length===2 && hKey(cards[0])<hKey(cards[1]), JSON.stringify((cards||[]).map(c=>c.handle)));
    const line=ccRaceMyLine();
    check('строка гонки: напарник — человек, скамейки нет, адрес пары', line.mates.length===1 && hKey(line.mates[0])===hKey(rivalCard) && !line.bench && line.pair==='peerB', JSON.stringify({mates:line.mates.map(m=>m.handle), bench:line.bench, pair:line.pair}));
    check('сила пары в строке — careerTeam двух карточек', line.pow===careerTeam(cards, true).pow, line.pow+' vs '+careerTeam(cards,true).pow);
    // 3. команда вечера — из пары, адрес по старшему
    const you=careerYouTeam([careerCard()].concat(careerMates())); you.isYou=true;
    ccRacePairTeamInto(you);
    check('команда вечера — два человека', (you.squad||[]).length===2 && you.squad.some(c=>hKey(c)===hKey(rivalCard)) && you.mpTag===':'+hKey(cards[0]), you.mpTag+' '+(you.squad||[]).map(c=>c.handle).join('+'));
    check('вопрос пары решает старший по hKey', ccMpMine('land'+you.mpTag)===(hKey(careerCard())===hKey(cards[0])) || !ccMpLock());
    // 4. скамейка и напарник видны в занятых ключах
    const taken=ccRaceTakenKeys();
    check('соперник и его bench — занятые ключи', taken.has(hKey(rivalCard)) && taken.has(hKey(rivalMate)));
    // 5. чужая пара садится один раз — по строке старшего
    CC_RACE_PEERS['peerC']={id:'peerC', card:ccRacePackCard(pool[8]), mates:[ccRacePackCard(pool[9])], pair:'peerD', div:1, season:1, day:'2026-02-02', pow:99};
    CC_RACE_PEERS['peerD']={id:'peerD', card:ccRacePackCard(pool[9]), mates:[ccRacePackCard(pool[8])], pair:'peerC', div:1, season:1, day:'2026-02-02', pow:99};
    const tC=ccRaceRivalTeam(CC_RACE_PEERS['peerC']), tD=ccRaceRivalTeam(CC_RACE_PEERS['peerD']);
    check('чужая пара — один и тот же состав и адрес с обеих строк', tC.mpTag===tD.mpTag && tC.squad.map(hKey).join('+')===tD.squad.map(hKey).join('+'), tC.mpTag+' / '+tD.mpTag);
    // 6. разрыв
    ccRacePairSaw({kind:'unpair', payload:{by:'peerB', to:me}});
    check('после разрыва пары нет — и напарника тоже, ищи нового', !ccRacePairOn() && !CAREER.career.race.pair && careerMates().length===0);
    careerMateSeat({handle:pool[1].handle, cardRegion:pool[1].region, patience:60, since:'2026-01-01'});
    // 6b. голос за перемотку считает и уснувшего соседа (пульс старше 90 с) — его отчёт 22.09.
    MP.peerAt=MP.peerAt||{}; MP.peerAt['peerB']=Date.now()-600000;
    check('перемотка ждёт голос уснувшей вкладки', ccMpFfHumans()>=2, String(ccMpFfHumans()));
    delete MP.peerAt['peerB'];
    // 7. отказ по дивизиону и трио
    CC_RACE_PEERS['peerB'].div=2;
    check('другой дивизион — пары не предлагают', ccRacePairWhy(CC_RACE_PEERS['peerB'])==='div');
    CC_RACE_PEERS['peerB'].div=1; CAREER.career.size=3;
    check('трио-сезон — пары нет', ccRacePairWhy(CC_RACE_PEERS['peerB'])==='trio');
    CAREER.career.size=2;
    // 8. приглашение мне — кнопки принять/отказать, отказ шлёт pairno
    sent.length=0;
    ccRacePairSaw({kind:'pair', payload:{by:'peerB', to:me, nick:'Beta'}});
    check('плитка: принять/отказать', /careerRacePairYes\\(\\)/.test(careerRaceTileHTML()) && /careerRacePairNo\\(\\)/.test(careerRaceTileHTML()));
    careerRacePairNo();
    check('отказ ушёл', sent.some(x=>x.k==='pairno' && x.p.to==='peerB'));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rpair-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(SL).join('/') + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const html = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--virtual-time-budget=60000', '--dump-dom',
  'file:///' + tmp.split(SL).join('/')], { maxBuffer: 1 << 28 }).toString();
const m = /PBEGIN(.*?)PEND/.exec(html);
if (!m) { console.log('FAIL: no result'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.log('ERR ' + out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
console.log('OK check-race-pair-offline');
