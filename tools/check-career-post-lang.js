// Пост про метку переводится вместе с языком.
//
// Замечено 4 сентября на флаке check-language-switch: в английской ленте
// стояло «dropping зона 9 tonight» — имя зоны собиралось В МОМЕНТ ПОСТА и
// уезжало в запись строкой, а значит навсегда оставалось русским. Правило
// самой ленты (см. ccText) обратное: в записи едут ЧИСЛА, слова строятся на
// показе.
//
// Проверка пишет пост обоими способами — новым (число) и старым (строка из
// сейва) — и смотрит, что первый переводится, а второй хотя бы не ломается.
//
//   node tools/check-career-post-lang.js
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
  try{
    // Запись поста ровно такая, какую пишет careerNews: ключ и аргументы.
    const post={k:'ccPostDropCall', a:['someone', 9]};
    setLang('ru', false);
    const ru=ccText(post), ruZone=L().landingZoneSuffix(9);
    setLang('en', false);
    const en=ccText(post), enZone=L().landingZoneSuffix(9);
    out.notes.ru=ru; out.notes.en=en;
    check('по-русски зона названа по-русски', ru.indexOf(ruZone)>=0 && ru.indexOf('зона 9')>=0, ru);
    check('и по-английски — своим словом', en.indexOf(enZone)>=0, en+' / '+enZone);
    check('по-английски — по-английски', en.indexOf('zone 9')>=0, en);
    check('и русского в английском не осталось', en.indexOf('зона')<0, en);

    // Старый сейв: в аргументе лежит готовая строка. Не переводится (нечем),
    // но и не ломается — пост должен читаться.
    const old={k:'ccPostDropCall', a:['someone', 'зона 9']};
    const oldEn=ccText(old);
    out.notes.old=oldEn;
    check('старый пост не ломается', oldEn.indexOf('зона 9')>=0 && oldEn.indexOf('undefined')<0, oldEn);

    // И помощник сам по себе.
    setLang('ru', false);
    check('ccZoneName знает число', ccZoneName(3)===L().landingZoneSuffix(3), ccZoneName(3));
    check('и пропускает строку', ccZoneName('zone 3')==='zone 3', ccZoneName('zone 3'));
    check('и не падает на пустом', ccZoneName(null)==='' && ccZoneName(undefined)==='');
  }catch(e){ out.err=String(e&&e.stack||e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'postlang-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=120000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log('  ' + JSON.stringify(out.notes));
if (out.fails.length) { out.fails.forEach(f => console.error('FAILED: ' + f)); process.exit(1); }
console.log('пост про метку говорит на языке экрана');
