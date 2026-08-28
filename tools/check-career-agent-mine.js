// Менеджер, которого ты взял, — и только он.
//
// Три его правки со страницы «26.08»:
//   «один и тот же менеджер пишет — пусть не пишут, когда есть менеджер»,
//   «я взял его... но пишет он, пусть пишет мой менеджер»,
//   «нажал разорвать контракт, когда была орга, потом до этого нажал не искать
//    оргу — и после этого не пишет вообще, оргу нельзя найти; пусть у менеджера
//    будет кнопка, чтоб игрок запросил офер у орги, и это сообщение
//    автоматически пишется в лс менеджеру».
//
// Первое и второе — одна поломка: подпись искала тред «любого менеджера»
// (find(x=>x.who.agent)) и писала «с этого дня разговариваю с клубами я» в
// диалог ЧУЖОГО, который просто написал раньше. Третье — переключатель поиска
// клуба жил только на плитке подписанного клуба: разорвал контракт с
// выключенным поиском — и включить его больше негде, а плитка при этом
// говорила «клубы тебя видят».
//
//   node tools/check-career-agent-mine.js
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
(async function(){
  const out = {fails: [], notes: {}, err: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  const seed = () => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'Probe', age:19, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:0, region:'EU', ovr:95, role:'roleIGL',
              attrs:ccRookieAttrs(95,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-07-24', division:1, earnings:0, balance:200000,
              reach:9000, tokens:[], log:[], news:[]},
      partners:[]
    }));
    careerLoad();
  };
  const threadOf = name => careerDms().find(t => t.who && t.who.agent &&
                                                hKey(t.who.handle) === hKey(name));
  try {
    // ---- 1. пишет тот, кого взял ----------------------------------------
    seed();
    // Первым написал один менеджер — так это и происходит: письмо приходит
    // само (careerAgentDm), а игрок потом выбирает в списке кого угодно.
    const wrote = careerAgentDm();
    check('менеджер написал сам', !!wrote, JSON.stringify(wrote && wrote.who));
    const strangerName = wrote.who.handle;
    const mineName = (CC_AGENTS.find(a => a.name !== strangerName) || {}).name;
    out.notes.who = {написал:strangerName, взяли:mineName};

    careerSignAgent(mineName);
    check('подписан тот, кого выбрали', (careerAgent()||{}).name === mineName,
          JSON.stringify(careerAgent()));
    const mineThread = threadOf(mineName), otherThread = threadOf(strangerName);
    check('у взятого менеджера есть свой диалог', !!mineThread);
    check('и согласие написано в нём', mineThread &&
          (mineThread.msgs||[]).some(m => m.k === 'dmAgentYes'),
          JSON.stringify(mineThread && (mineThread.msgs||[]).map(m => m.k)));
    check('а в чужом диалоге его нет', !otherThread ||
          !(otherThread.msgs||[]).some(m => m.k === 'dmAgentYes'),
          JSON.stringify(otherThread && (otherThread.msgs||[]).map(m => m.k)));

    // ---- 2. чужой менеджер больше не предлагает --------------------------
    if(otherThread){
      CH_DMKIND=null; CH_SOCIAL='dms'; careerDmOpen(otherThread.id);
      const html=(document.getElementById('chBody')||{}).innerHTML||'';
      out.notes.otherFoot=(html.match(/dm-foot[sS]{0,200}/)||["нет подвала"])[0].replace(/<[^>]+>/g," ").trim().slice(0,120);
      check('в чужом диалоге нет кнопки «подписать»',
            html.indexOf('careerSignAgentFromDm') < 0, html.slice(0, 200));
      check('и нет действий моего менеджера',
            html.indexOf('careerEndAgentFromDm') < 0 && html.indexOf('ccClubPickOpen') < 0);
      check('вместо них сказано, что менеджер уже есть',
            html.indexOf(L().ccAgentHave) >= 0);
    }
    // А в СВОЁМ диалоге действия на месте. (Без треда проверять нечего —
    // это и есть первая поломка, о ней уже сказано выше.)
    if(!mineThread) throw new Error('у взятого менеджера нет своего диалога — дальше проверять нечего');
    CH_DMKIND=null; CH_SOCIAL='dms'; careerDmOpen(mineThread.id);
    const mineHtml=(document.getElementById('chBody')||{}).innerHTML||'';
    out.notes.mineFoot={есть:mineHtml.indexOf("dm-foot")>=0, ник:mineHtml.indexOf(mineName)>=0, вид:CH_SOCIAL, тред:CH_DM, длина:mineHtml.length};
    check('в своём диалоге действия менеджера есть',
          mineHtml.indexOf('careerEndAgentFromDm') >= 0, mineHtml.slice(0, 200));

    // Новых писем от других менеджеров тоже нет.
    const before=careerDms().length;
    careerAgentDm(); careerAgentDm();
    check('другие менеджеры не пишут, когда свой есть',
          careerDms().length === before, before + ' -> ' + careerDms().length);

    // ---- 3. поиск клуба выключается и включается без клуба ---------------
    CAREER.org = null;
    CAREER.scoutOff = true;
    const tile = careerOrgTileHTML();
    out.notes.tile = tile.replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ').trim().slice(0, 140);
    check('переключатель поиска есть и без клуба',
          tile.indexOf('careerScoutToggle()') >= 0, out.notes.tile);
    check('и плитка не врёт, что клубы смотрят',
          tile.indexOf(L().ccFreeAgentOpen) < 0 && tile.indexOf(L().ccScoutOffHint) >= 0,
          out.notes.tile);
    careerScoutToggle();
    check('после включения плитка снова обычная',
          careerOrgTileHTML().indexOf(L().ccFreeAgentOpen) >= 0);

    // ---- 4. просьба к менеджеру — с его плитки, и она пишется в лс -------
    const agTile = careerAgentTileHTML();
    check('на плитке менеджера есть просьба найти клуб',
          agTile.indexOf('careerPitchAsk()') >= 0, agTile.slice(0, 200));
    const msgsBefore = (threadOf(mineName).msgs||[]).length;
    const club = (careerPitchClubs()[0]||{}).name;
    check('менеджеру есть кому написать', !!club, JSON.stringify(careerPitchClubs().slice(0,3)));
    careerAgentPitch(threadOf(mineName).id, club);
    const after = threadOf(mineName).msgs || [];
    check('просьба написана в лс менеджеру', after.length > msgsBefore,
          msgsBefore + ' -> ' + after.length);
    check('и это просьба игрока, а не менеджера',
          after.some(m => m.k === 'dmPitchAskClub' && m.from === 'you'),
          JSON.stringify(after.slice(-4).map(m => m.from + ":" + m.k)));
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agentmine-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('пишет тот, кого взял; чужие молчат; клуб можно искать и без клуба');
fs.rmSync(dir, { recursive: true, force: true });
