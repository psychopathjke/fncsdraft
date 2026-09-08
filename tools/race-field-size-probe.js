// Сколько весит комната гонки (act 'field') — против лимита Durable Object в 128 КиБ
// на одно значение хранилища и против объёма, который едет догоняющему клиенту.
//
// Комната вечера у хозяина упаковывается ccRacePackBot: карточки каждого бота плюс
// имя и сила. Дивизионный кубок — 170 команд, значит 168 ботов; ЛАН и Мейджор меньше.
// Если одно сообщение больше сотни килобайт, лента вечера (st.feed) не влезет в DO.
//
//   node tools/race-field-size-probe.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out = {rows: [], err: null};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Sizer', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:500, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    squadSize=2; CARD_MODE=true; useLandingSet(careerBrSet());
    const me=careerCard();
    [['кубок Д1', careerCupSize(1)], ['Мейджор', 100], ['ЛАН', 50]].forEach(function(pair){
      const field=careerCupField(CAREER.career, [me], pair[1], null, false, 0);
      const bots=field.slice(0, pair[1]-2).map(ccRacePackBot);
      const msg=JSON.stringify({t:'act', kind:'field', payload:{q:1, by:'abcdefgh', v:{n:pair[1], rolls:0, bots:bots}}});
      out.rows.push({what:pair[0], teams:pair[1], bots:bots.length, bytes:msg.length,
                     perBot:Math.round(msg.length/Math.max(1,bots.length)),
                     card:JSON.stringify(ccRacePackCard(me)).length});
    });
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='BEG'+'IN'+encodeURIComponent(JSON.stringify(out))+'E'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccsize-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=120000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('проба не дала вывода'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
const KIB = 1024;
console.log('вечер              команд  ботов   сообщение   на бота   лимит DO 128 КиБ');
out.rows.forEach(r => console.log(
  r.what.padEnd(18) + String(r.teams).padStart(6) + String(r.bots).padStart(7) +
  (Math.round(r.bytes/KIB) + ' КиБ').padStart(12) + (r.perBot + ' Б').padStart(10) +
  ('   ' + (r.bytes > 128*KIB ? 'НЕ ВЛЕЗАЕТ' : 'влезает одно, лента из ' + Math.floor(128*KIB/r.bytes)))));
console.log('одна карточка: ' + out.rows[0].card + ' Б');
