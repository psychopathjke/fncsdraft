// Комнату перестраивает ОТВЕТ, а не тот, кто открыл пикер.
//
// Его отчёт, 28 августа: «когда меняю локацию у другого игрока пишет The
// nights split at game 2». Сверка таблиц назвала и место, и повод: смена
// локации — это «законтестить», единственный ответ, на котором открывается
// пикер.
//
// А пикер, кроме показа, ПЕРЕСТРАИВАЛ СОСТАВ КОМНАТЫ: выбрасывал ботов, чьи
// ники пересеклись с твоими, и ставил тебя первым в массиве. Порядок команд
// решает исход — симуляция ходит по массиву. В одиночной карьере это незаметно
// (пикер один), в команде его открывает ОДИН из двоих, и комнаты у них
// расходились с этого места.
//
// Здесь проверяется, что перестройка живёт отдельно от показа, делает ровно
// то, что делала, и зовётся обеими сторонами.
//
//   node tools/check-mp-room-same.js

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
  const team=(name, handles)=>({name:name, squad:handles.map(h=>({handle:h}))});
  try{
    // ---- что перестройка делает ------------------------------------------
    const you=team('ты', ['Sky','1111']);
    const a=team('a', ['alpha','bravo']);
    const namesake=team('тёзка', ['charlie','Sky']);   // пересёкся ником
    const b=team('b', ['delta','echo']);
    const field=[a, namesake, you, b];
    const bots=ccLandingNormalize(field, you);
    out.notes.после=field.map(t=>t.name).join(',');
    check('ты стоишь первым', field[0]===you, out.notes.после);
    check('тёзка выброшен', field.indexOf(namesake)<0, out.notes.после);
    check('остальные на месте', field.length===3 && field[1]===a && field[2]===b,
          out.notes.после);
    check('вернулись боты без тебя', bots.length===2 && bots.indexOf(you)<0);

    /* ---- и перестройка ИДЕМПОТЕНТНА --------------------------------------
       Тот, кто открыл пикер, зовёт её дважды: раз внутри показа и раз после
       ответа. Второй вызов обязан ничего не менять, иначе он сам стал бы
       причиной расхождения. */
    const was=field.map(t=>t.name).join(',');
    ccLandingNormalize(field, you);
    ccLandingNormalize(field, you);
    check('повторная перестройка ничего не меняет',
          field.map(t=>t.name).join(',')===was, was+' -> '+field.map(t=>t.name).join(','));

    // ---- показ больше не перестраивает сам --------------------------------
    const src=document.documentElement.outerHTML;
    /* Тело функции — до следующего объявления, а не «сколько-то тысяч
       символов»: иначе поиск заезжает в соседние функции и ловит их код за
       свой. Ищется без регулярки — она в этой строке уже один раз порвалась
       при вставке, а indexOf надёжнее и читается так же. */
    const bodyOf=(head)=>{
      const a=src.indexOf(head);
      if(a<0) return '';
      const rest=src.slice(a+head.length);
      const marks=['\\nfunction ', '\\nasync function '];
      let end=rest.length;
      marks.forEach(function(mk){
        const i=rest.indexOf(mk);
        if(i>=0 && i<end) end=i;
      });
      return rest.slice(0, end);
    };
    const at=src.indexOf('async function showFinalsLandingPicker(');
    const body=at<0 ? '' : src.slice(at, at+700);
    out.notes.пикер=body.replace(/\\s+/g,' ').slice(0, 120);
    check('пикер зовёт общую перестройку', body.indexOf('ccLandingNormalize(')>=0,
          at<0 ? 'функции нет' : 'нет вызова');
    check('и не переписывает массив сам',
          body.indexOf('finalTeams.length=0')<0, 'перестройка осталась в показе');

    /* ---- и обе стороны зовут её на ответе «законтестить» ------------------
       Читается по исходнику, а не по вере: тот, кто пикер не открывал, обязан
       привести комнату к тому же виду. */
    const lpBody=bodyOf('async function careerLandingPick(');
    const lp=src.indexOf('async function careerLandingPick(');
    check('высадка зовёт перестройку на обеих сторонах',
          lpBody.indexOf('ccLandingNormalize(field, you)')>=0,
          lp<0 ? 'функции нет' : 'нет вызова');

    /* ---- и дом на острове ставит ОТВЕТ, а не показ -----------------------
       Метка даёт ауру, аура даёт силу, сила решает вечер. Ставил её пикер, то
       есть один из двоих; у напарника её не было. Хуже: careerSpotSet зовёт
       careerSave, а тот посреди вечера отправлял состояние напарнику, и у
       того выбрасывались кэши мира прямо во время игры. */
    const pzBody=bodyOf('async function pickInitialZone(');
    check('пикер метку больше не ставит',
          pzBody.indexOf('careerSpotSet(')<0, 'careerSpotSet остался в пикере');
    check('её ставит высадка, у обоих', lpBody.indexOf('ccLandingSpot(z)')>=0,
          'нет вызова');

    /* ---- и посреди вечера командное состояние не ездит --------------------
       Признак «идёт вечер» — подменённый генератор. */
    const svBody=bodyOf('function careerSave()');
    check('сохранение не шлёт состояние посреди вечера',
          svBody.indexOf('!CC_MP_RAND') >= 0, 'шлёт');
    const arBody=bodyOf('function ccMpApplyRemote(');
    /* ---- вопрос задаёт ИГРА, а не показ -----------------------------------
       Условие вопроса содержало  — признак ПОКАЗА: «убили в тех
       кадрах, что успели показать». Рядом стоит alive() — факт игры. Один
       досматривает бой на офспавне и получает dead, второй перематывает и не
       получает: число вопросов разное, номера разъезжаются, вечера чужие. Его
       слова: «это ломается, после того как оффспавн убивают». */
    const stopsAt=src.indexOf('for(const stop of CC_GAME_STOPS)');
    const stopsBody=stopsAt<0 ? '' : src.slice(stopsAt, stopsAt+4000);
    check('вопрос не зависит от того, что успели показать',
          stopsBody.indexOf('!dead && alive()')<0, 'условие вопроса смотрит на показ');
    check('и по-прежнему не спрашивает выбывшего',
          stopsBody.indexOf('alive() && game.aliveCount()>1')>=0, 'нет проверки живости');

    /* ---- украшения не тратят общий поток ---------------------------------
       Конфетти сыплет по семь бросков на бумажку и до ста шестидесяти штук за
       поздравление — больше тысячи бросков из ОБЩЕГО потока вечера. А
       высыпается оно не всегда: celebrate молчит под пропуском, и пропуск
       включается у двоих от одного сообщения, которое застаёт их в разных
       местах кода. Отсюда «не сходятся таблицы в финалах»: поздравление стоит
       как раз между этапами. */
    const cfBody=bodyOf('function confettiBurst(');
    const cf=cfBody.split('Math.random').length-1;
    out.notes.конфетти=cf;
    check('конфетти берёт свою случайность, а не общую', cf<=1,
          'обращений к Math.random: '+cf);
    check('и берёт её из отложенного генератора', cfBody.indexOf('CC_MP_RAND')>=0,
          'нет CC_MP_RAND');

    check('и чужое состояние посреди вечера не применяется',
          arBody.indexOf('if(CC_MP_RAND) return;')>=0, 'применяется');
  }catch(e){ out.err=String(e&&e.stack||e); }
  document.getElementById('__out').textContent=
    'PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mproom-'));
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
console.log('комнату перестраивает ответ, и одинаково у обоих');
fs.rmSync(dir, { recursive: true, force: true });
