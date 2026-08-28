// Спрашивают про ТВОЁ лобби, а не про всё поле этапа.
//
// Жалоба его игрока, 27 августа: «я контестил команду в последней игре и
// выиграл кон, но они почему-то в этой игре были топ 21».
//
// Так это и получалось. Комнату для вопроса раскладывал careerLandingPick по
// всему полю, а играется поле лобби по пятьдесят, и делилось оно на них
// случайно уже ПОСЛЕ вопроса. В Плей-Ине Мейджора поля пятьсот с лишним
// команд, то есть одиннадцать лобби: тот, на кого летишь контестить, попадал
// в твой матч примерно раз из одиннадцати, а в остальных случаях играл своё
// лобби, где на него никто не падал.
//
// Проверяется контракт, а не текст: simulateGamesLive отдаёт в opts.dropEachGame
// комнату, и эта комната — ровно то лобби, в котором игрок сыграет эту игру.
// Контроль в том же прогоне: без лобби (одно поле) комната не приходит вовсе и
// раннер честно падает на своё поле.
//
//   node tools/check-drop-lobby-room.js

const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set the CHROME environment variable to chrome.exe');

const BASE = '<base href="file:///' + ROOT + '/">';
const HEAD = `<script>
window.__errs = [];
window.addEventListener('error', function(e){ window.__errs.push(String(e.message) + ' @' + e.lineno); });
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {steps: [], errs: null, fail: null};
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const fail = m => { out.fail = m; throw new Error(m); };
  try{
    squadSize = 2; CARD_MODE = true;
    useLandingSet('m2');
    skipAnimation = true;
    document.getElementById('majorStages') || fail('нет контейнера этапов');
    await wait(50);

    const FIELD = 260, LOBBY = 50, GAMES = 3;
    const teams = [];
    for (let i = 0; i < FIELD; i++) {
      const h = 'bot' + i;
      teams.push({name:'Team ' + i, pow: 90 + (i % 21), closeEdge: 0,
        squad:[{handle:h+'a', rating:60}, {handle:h+'b', rating:60}]});
    }
    teams[7].isYou = true; teams[7].name = 'you';
    const you = teams[7];

    // Что раннер получил в вопросе, и в каком лобби игрок на самом деле сыграл.
    const asked = [];
    const played = [];
    const seenRoom = [];
    // Ловим лобби игрока изнутри: creditLandingContests зовётся по каждому
    // лобби этой игры, значит то, в котором стоит игрок, — его матч.
    const realCredit = window.creditLandingContests;
    window.creditLandingContests = function(list){
      if (list && list.some(t => t.isYou)) played.push(list);
      return realCredit.apply(this, arguments);
    };

    await simulateGamesLive(teams, GAMES, p => Math.max(0, 60 - p), 1, 'stage', 0, null, null,
      {lobbySize: LOBBY, stageName: 'probe',
       dropEachGame: (g, room) => {
         asked.push(room ? room.length : null);
         seenRoom.push(room);
         return null;
       }});

    window.creditLandingContests = realCredit;

    out.steps.push('поле ' + FIELD + ', лобби ' + LOBBY + ', игр ' + GAMES);
    out.steps.push('в вопрос пришли комнаты: ' + JSON.stringify(asked));
    if (asked.some(n => n == null)) fail('комната не пришла в вопрос вовсе');
    if (asked.some(n => n > LOBBY)) fail('в вопрос пришло всё поле: ' + Math.max.apply(null, asked));
    if (played.length < GAMES) fail('лобби игрока нашлось ' + played.length + ' раз из ' + GAMES);

    for (let g = 0; g < GAMES; g++) {
      const room = seenRoom[g], lob = played[g];
      if (!room) fail('игра ' + (g+1) + ': комнаты нет');
      if (!room.some(t => t.isYou)) fail('игра ' + (g+1) + ': игрока нет в комнате вопроса');
      const inRoom = new Set(room);
      const off = lob.filter(t => !inRoom.has(t));
      if (off.length) fail('игра ' + (g+1) + ': в лобби ' + off.length +
                           ' команд, которых не было в комнате вопроса');
    }
    out.steps.push('комната вопроса = лобби игрока во всех ' + GAMES + ' играх');

    // Контроль: жеребьёвка ДЕЙСТВИТЕЛЬНО тасует, иначе совпадение ничего не
    // значит — одно и то же лобби каждую игру совпало бы само собой.
    const keys = played.map(l => l.map(t => t.name).sort().join(','));
    if (new Set(keys).size === 1) fail('лобби все игры одно и то же — жеребьёвки нет');
    out.steps.push('лобби разное каждую игру: ' + new Set(keys).size + ' из ' + GAMES);

    // И без лобби комната не приходит: раннер должен уметь упасть на своё поле.
    const asked2 = [];
    await simulateGamesLive(teams.slice(0, 40), 1, p => Math.max(0, 60 - p), 1, 'stage', 0, null, null,
      {stageName: 'probe2', dropEachGame: (g, room) => { asked2.push(room); return null; }});
    if (asked2[0] != null) fail('без lobbySize пришла комната ' + asked2[0]);
    out.steps.push('без лобби комната не приходит — раннер играет своим полем');
  } catch(e){ if(!out.fail) out.fail = String(e && e.stack || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'droplobby-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, BASE + HEAD + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);

const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--window-size=1440,1400',
  '--virtual-time-budget=300000', '--dump-dom', 'file:///' + tmp.replace(/\\/g, '/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if (out.errs && out.errs.length) { console.error('page errors: ' + out.errs.slice(0, 4).join(' | ')); process.exit(1); }
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
console.log('высадка спрашивается по своему лобби, а не по всему полю');
fs.rmSync(dir, { recursive: true, force: true });
