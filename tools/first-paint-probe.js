// Что видит человек, пока приложение ещё качается.
//
// Повод — отзыв игрока 5 сентября 2026 («в последнее время не могу зайти на
// сайт»). Сайт жив и с нашей стороны отвечает за 0.13 с, но с сайта перед
// первым экраном уезжает ~1.8 МБ сжатого app.js, а ВЕСЬ текст первого экрана
// подставляется из словаря уже в нём (data-i18n). Проба отвечает на прямой
// вопрос: сколько текста видно ДО того, как приложение доехало.
//
// Берётся собранная папка деплоя (оболочка + app.js отдельно), из оболочки
// вырезается тег приложения, и снимается то, что осталось.
//
//   node tools/first-paint-probe.js <папка деплоя> [out.png]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const DIR = process.argv[2];
if (!DIR) { console.error('нужна папка деплоя'); process.exit(2); }
const OUT = process.argv[3] || path.join(os.tmpdir(), 'firstpaint.png');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const shell = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');
// Без приложения — то есть ровно то, что видно, пока оно едет.
const bare = shell.replace(/<script[^>]*src="(app|zone-sim|zone-replay|mp)\.js[^"]*"[^>]*><\/script>/g, '');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'firstpaint-'));
// Оболочке нужны её же файлы рядом: шрифты, арт, стили внутри неё самой.
for (const f of fs.readdirSync(DIR)) {
  const src = path.join(DIR, f);
  if (fs.statSync(src).isDirectory()) continue;
  fs.copyFileSync(src, path.join(dir, f));
}
for (const d of ['fonts', 'art']) {
  const src = path.join(DIR, d);
  if (fs.existsSync(src)) fs.cpSync(src, path.join(dir, d), { recursive: true });
}
const tmp = path.join(dir, 'bare.html');
fs.writeFileSync(tmp, bare +
  '<pre id="__o" style="display:none"></pre><script>(function(){' +
  'var t=(document.body.innerText||"").replace(/\\s+/g," ").trim();' +
  'var keys=document.querySelectorAll("[data-i18n]").length;' +
  'var filled=0;' +
  'document.querySelectorAll("[data-i18n]").forEach(function(el){' +
  '  if((el.textContent||"").trim()) filled++; });' +
  'document.getElementById("__o").textContent="PB"+"EGIN"+encodeURIComponent(' +
  'JSON.stringify({chars:t.length, keys:keys, filled:filled, head:t.slice(0,160)}))+"PE"+"ND";' +
  '})();<' + '/script>');

execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
  '--allow-file-access-from-files', '--virtual-time-budget=15000',
  '--window-size=1280,760', '--screenshot=' + OUT,
  'file:///' + tmp.split(path.sep).join('/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: 'pipe' });
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=15000', '--dump-dom',
  'file:///' + tmp.split(path.sep).join('/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
const out = m ? JSON.parse(decodeURIComponent(m[1])) : null;
if (out) {
  console.log('  видимого текста без приложения: ' + out.chars + ' знаков');
  console.log('  подписей из словаря на странице: ' + out.keys + ', из них с текстом: ' + out.filled);
  console.log('  начало: ' + JSON.stringify(out.head));
}
console.log('снимок: ' + OUT);
