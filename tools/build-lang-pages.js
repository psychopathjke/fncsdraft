// Главная и /about на каждом языке сайта: /ru/, /fr/, /it/, /pt/, /de/, /es/ (+ /ru/about и т.д.).
//
// ЗАЧЕМ (23.10, его «поиск в гугле со всех стран работает со всех языков?»). Язык сайт выбирал в браузере,
// по языку системы, на одном адресе — Google обходит из США и видел только английский. По-русски, по-французски,
// по-немецки сайт не находился: ни одного неанглийского слова в индексе. Теперь у каждого языка свой адрес
// с переведёнными title/description, <html lang>, текстом первого экрана и hreflang между всеми версиями.
//
// Страница языка — та же оболочка, что и главная: app.js один на всех, язык берётся из адреса (CC_PATH_LANG
// в index.html). <base href="/"> — чтобы app.js, фото и шрифты нашлись из /ru/ по тем же относительным путям.
//
//   node tools/build-lang-pages.js <папка сборки> <снимок текста json>   (зовёт build-deploy.js)
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.resolve(process.argv[2]);
const DUMPS = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const SITE = 'https://fncsdraft.com';
const LANGS = ['ru', 'fr', 'it', 'pt', 'de', 'es'];

// Заголовки и описания — из CC_SEO в index.html (одна правда с тем, что ставит setLang).
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const m = src.match(/const CC_SEO=(\{[\s\S]*?\n\});/);
if (!m) throw new Error('CC_SEO не найден в index.html');
const SEO = Function('return ' + m[1])();

const attr = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function alternates(page) {   // page: '' (главная) или 'about'
  const url = l => SITE + '/' + (l === 'en' ? '' : l + '/') + page;
  return ['en'].concat(LANGS).map(l => '<link rel="alternate" hreflang="' + l + '" href="' + url(l) + '">').join('') +
    '<link rel="alternate" hreflang="x-default" href="' + url('en') + '">';
}

// Сразу после <meta charset>: кодировка обязана стоять в первых 1024 байтах, а <base> — до первого относительного пути.
const inject = (h, add) => /<meta charset="[^"]*">/i.test(h) ? h.replace(/<meta charset="[^"]*">/i, x => x + add) : h.replace('<head>', '<head>' + add);

function setMeta(html, sel, value) {
  const re = new RegExp('(<meta ' + sel + ' content=")[^"]*(")');
  if (!re.test(html)) throw new Error('нет <meta ' + sel + '>');
  return html.replace(re, '$1' + attr(value) + '$2');
}

const shell = fs.readFileSync(path.join(OUT, 'index.html'), 'utf8');
if (!/<head>/.test(shell) || !/<html lang="en"/.test(shell)) throw new Error('оболочка без <head> или <html lang="en">');

// Английская главная тоже знает о своих переводах.
fs.writeFileSync(path.join(OUT, 'index.html'), inject(shell, alternates('')), 'utf8');

let texts = 0, aboutN = 0;
const en = DUMPS.en || {};
for (const l of LANGS) {
  const seo = SEO[l];
  if (!seo) throw new Error('нет CC_SEO.' + l);
  let h = inject(shell, '<base href="/">' + alternates(''))
    .replace('<html lang="en"', '<html lang="' + l + '"')
    
    .replace(/<title>[^<]*<\/title>/, '<title>' + attr(seo.t) + '</title>')
    .replace(/<link rel="canonical" href="[^"]*">/, '<link rel="canonical" href="' + SITE + '/' + l + '/">');
  h = setMeta(h, 'name="description"', seo.d);
  h = setMeta(h, 'property="og:title"', seo.t);
  h = setMeta(h, 'property="og:description"', seo.d);
  h = setMeta(h, 'property="og:url"', SITE + '/' + l + '/');
  h = setMeta(h, 'name="twitter:title"', seo.t);
  h = setMeta(h, 'name="twitter:description"', seo.d);
  // Ссылка «О сайте» с главной языка ведёт на /about того же языка (если перевод есть).
  if (fs.existsSync(path.join(ROOT, 'i18n-about', 'about.' + l + '.html'))) h = h.split('href="about.html"').join('href="/' + l + '/about"');
  h = h.replace(/<meta property="og:locale" content="[^"]*">/, '');
  // Текст первого экрана: английский, вшитый prefillI18n, меняется на снимок этого языка ключ в ключ.
  const tr = DUMPS[l] || {};
  for (const k of Object.keys(en)) {
    if (typeof tr[k] !== 'string' || !tr[k] || tr[k] === en[k]) continue;
    const re = new RegExp('(\\sdata-i18n="' + reEsc(k) + '"[^>]*>)' + reEsc(en[k]) + '(</)', 'g');
    h = h.replace(re, (all, a, b) => { texts++; return a + tr[k] + b; });
  }
  fs.mkdirSync(path.join(OUT, l), { recursive: true });
  fs.writeFileSync(path.join(OUT, l, 'index.html'), h, 'utf8');

  // /about на этом языке — готовый перевод из i18n-about/ (нет файла — нет страницы, без полупереводов).
  const ab = path.join(ROOT, 'i18n-about', 'about.' + l + '.html');
  if (fs.existsSync(ab)) {
    const a = fs.readFileSync(ab, 'utf8');
    if (!a.includes('<html lang="' + l + '"')) throw new Error(ab + ': не тот <html lang>');
    fs.writeFileSync(path.join(OUT, l, 'about.html'), inject(a, alternates('about')), 'utf8');
    aboutN++;
  }
}
// Английская /about — hreflang, только если переводы есть у всех.
const aboutAll = aboutN === LANGS.length;
if (aboutAll) {
  const p = path.join(OUT, 'about.html');
  fs.writeFileSync(p, inject(fs.readFileSync(p, 'utf8'), alternates('about')), 'utf8');
}

// sitemap.xml: адреса языков рядом с главной.
const smPath = path.join(OUT, 'sitemap.xml');
const today = new Date().toISOString().slice(0, 10);
const extra = LANGS.map(l => '<url><loc>' + SITE + '/' + l + '/</loc><lastmod>' + today + '</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>' +
  (fs.existsSync(path.join(OUT, l, 'about.html')) ? '<url><loc>' + SITE + '/' + l + '/about</loc><lastmod>' + today + '</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>' : '')).join('\n');
const sm = fs.readFileSync(smPath, 'utf8');
if (!sm.includes('</urlset>')) throw new Error('sitemap.xml без </urlset>');
fs.writeFileSync(smPath, sm.replace('</urlset>', extra + '\n</urlset>'), 'utf8');

console.log('языки: ' + LANGS.map(l => '/' + l + '/').join(' ') + ' · текста первого экрана переведено: ' + texts +
  ' · /about на языках: ' + aboutN + '/' + LANGS.length + (aboutAll ? '' : ' (hreflang у английской /about не ставится)'));
