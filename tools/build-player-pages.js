// Страницы игроков для поиска (16.10, его «4»): /player/<ник> на каждого игрока, у которого на сайте есть хотя бы
// три карточки, фото или призовые 2026, плюс /players — список всех со ссылками. Люди гуглят «peterbot fncs»,
// и каждая такая страница — вход на сайт из поиска.
//
// Данные — с самой игры (tools/dump-player-pages.js): те же карточки, места и рейтинги, что в драфте. Страницы
// английские: по-английски ищут почти все, кто ищет ник. Собираются в папку деплоя из build-deploy.js и попадают
// в sitemap.xml этой же папки.
//
//   node tools/build-player-pages.js <папка деплоя> [dump.json]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const OUT = path.resolve(process.argv[2] || '');
if (!process.argv[2] || !fs.existsSync(path.join(OUT, 'index.html'))) throw new Error('нужна папка деплоя с index.html');
let dumpPath = process.argv[3];
if (!dumpPath) {
  dumpPath = path.join(os.tmpdir(), 'player-pages-' + Date.now() + '.json');
  execFileSync(process.execPath, [path.join(__dirname, 'dump-player-pages.js'), dumpPath], { stdio: 'inherit' });
}
const D = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));
const SITE = 'https://fncsdraft.com';
const TODAY = new Date().toISOString().slice(0, 10);

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const REGION = { EU: 'Europe', NAC: 'NA Central', NAW: 'NA West', BR: 'Brazil', ASIA: 'Asia', ME: 'Middle East', OCE: 'Oceania', UNK: '' };
const MON = { 'янв': 'Jan', 'фев': 'Feb', 'мар': 'Mar', 'апр': 'Apr', 'мая': 'May', 'май': 'May', 'июн': 'Jun', 'июл': 'Jul', 'авг': 'Aug',
  'сен': 'Sep', 'окт': 'Oct', 'ноя': 'Nov', 'дек': 'Dec' };
const enDate = s => String(s || '').replace(/([а-яё]{3})[а-яё]*/gi, (m, a) => MON[a.toLowerCase()] || m).replace(/^—$/, '');
const yearOf = c => +(String(c.date).match(/(20\d\d)/) || String(c.ev).match(/(20\d\d)/) || [0, 0])[1];
let dn = null; try { dn = new Intl.DisplayNames(['en'], { type: 'region' }); } catch (e) {}
const country = cc => { if (!cc || cc.length !== 2) return ''; try { return dn ? dn.of(cc.toUpperCase()) : ''; } catch (e) { return ''; } };
const ord = n => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
const money = n => '$' + Math.round(n).toLocaleString('en-US');

const earnBy = new Map((D.earn || []).map(e => [String(e.n).toLowerCase(), e]));
// Кто получает страницу: три карточки и больше, или фото, или призовые 2026.
const P = D.players.filter(g => g.cards.length >= 3 || g.photo || earnBy.has(g.handle.toLowerCase()));

// Адрес: ник латиницей и цифрами; тёзкам — страна (или регион) хвостом.
const slugBase = h => String(h).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const mainRegion = g => Object.keys(g.regions).sort((a, b) => g.regions[b] - g.regions[a])[0];
// Сила игрока для порядка: лучший рейтинг, потом число карточек. У тёзок чистый адрес — сильнейшему.
const power = g => Math.max(...g.cards.map(c => c.rating || 0)) * 1000 + g.cards.length;
const taken = new Set();
P.slice().sort((a, b) => power(b) - power(a)).forEach(g => {
  const b = slugBase(g.handle) || 'player';
  let s = taken.has(b) ? b + '-' + (g.cc || mainRegion(g) || '').toLowerCase().replace(/[^a-z0-9]+/g, '-') : b;
  let i = 2; const s0 = s; while (taken.has(s)) s = s0 + '-' + (i++);
  taken.add(s); g.slug = s;
});

const HEAD_CSS = `@font-face{font-family:'Oswald';font-style:normal;font-weight:200 700;font-display:swap;src:url(/fonts/oswald-latin.woff2) format('woff2');unicode-range:U+0000-00FF,U+2000-206F;}
@font-face{font-family:'Oswald';font-style:normal;font-weight:200 700;font-display:swap;src:url(/fonts/oswald-latin-ext.woff2) format('woff2');unicode-range:U+0100-02BA,U+1E00-1EFF;}
:root{--go:#ffdd00;--go-ink:#0b0f12;--bg:#0e1116;--panel:#161b22;--ink:#eef2f6;--dim:#8b98a8;--accent:#00c9a7;--line:#262e39;
  --font-display:'Oswald','Arial Narrow',Impact,sans-serif;}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%;background:#0b0e13}
body{margin:0;background:linear-gradient(180deg,#0d141a 0%,#0e1116 45%,#0b0e13 100%) fixed;color:var(--ink);font:16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;}
.wrap{max-width:860px;margin:0 auto;padding:22px 16px 72px}
.crumb{font-family:var(--font-display);text-transform:uppercase;letter-spacing:.06em;font-size:13px;color:var(--dim);margin:0 0 22px}
.crumb a{color:var(--accent);text-decoration:none}
h1,h2{font-family:var(--font-display);font-weight:600;letter-spacing:.03em;line-height:1.1;margin:0}
h1{font-size:clamp(34px,8vw,58px);text-transform:uppercase}
h2{font-size:22px;text-transform:uppercase;letter-spacing:.05em;color:var(--accent);margin:34px 0 12px}
a{color:var(--accent)}
.hero{display:flex;gap:18px;align-items:center;margin:0 0 18px}
.hero>div{min-width:0}
h1{overflow-wrap:anywhere}
.hero img.ph{width:112px;height:112px;object-fit:cover;object-position:top;border-radius:12px;background:#0b1640;border:1px solid var(--line);flex:0 0 auto}
.sub{color:var(--dim);margin:6px 0 0;font-size:15px}
.sub img{width:20px;height:auto;vertical-align:-3px;margin-right:6px}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin:18px 0 6px;padding:0;list-style:none}
.stats li{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:12px 14px}
.stats b{display:block;font-family:var(--font-display);font-size:28px;font-weight:600;color:var(--go);line-height:1.1}
.stats span{font-size:13px;color:var(--dim)}
.cta{display:inline-block;background:var(--go);color:var(--go-ink);font-family:var(--font-display);font-weight:600;font-size:17px;letter-spacing:.06em;
  text-transform:uppercase;line-height:1;padding:14px 24px 13px;text-decoration:none;transform:skewX(-8deg);margin:18px 0 4px}
.cta span{display:inline-block;transform:skewX(8deg)}
.cta:focus-visible{outline:2px solid #fff;outline-offset:3px}
.tbl{width:100%;border-collapse:collapse;font-size:14px}
.tbl th{text-align:left;font-family:var(--font-display);font-weight:500;text-transform:uppercase;letter-spacing:.05em;font-size:12px;color:var(--dim);padding:6px 8px;border-bottom:1px solid var(--line)}
.tbl td{padding:8px;border-bottom:1px solid var(--line);vertical-align:top}
.tbl td.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.tbl td.r b{display:inline-block;min-width:34px;text-align:center;font-family:var(--font-display);font-weight:600;border-radius:5px;padding:1px 4px;background:#20304a;color:#fff}
.tbl td.r b.hi{background:var(--go);color:var(--go-ink)}
.tbl small{display:block;color:var(--dim);font-size:12px}
.p1{color:var(--go);font-weight:700}
.links{display:flex;flex-wrap:wrap;gap:8px;margin:0;padding:0;list-style:none}
.links a{display:inline-block;padding:6px 10px;border:1px solid var(--line);border-radius:8px;background:var(--panel);text-decoration:none;color:var(--ink);font-size:14px}
.links a:hover{border-color:var(--accent)}
.note{color:var(--dim);font-size:13px;margin-top:26px}
@media(max-width:560px){.hero img.ph{width:84px;height:84px}.tbl .hide-s{display:none}}`;

function page({ title, desc, canon, body, ld }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#0e1116">
<link rel="canonical" href="${canon}">
<link rel="icon" type="image/png" sizes="96x96" href="/favicon-96.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="profile">
<meta property="og:site_name" content="FNCS Draft">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canon}">
<meta property="og:image" content="${SITE}/og-image.png">
<meta name="twitter:card" content="summary_large_image">
${ld ? '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>' : ''}
<style>${HEAD_CSS}</style>
</head>
<body>
<main class="wrap">
${body}
</main>
</body>
</html>
`;
}

function playerPage(g, others) {
  const reg = mainRegion(g), cards = g.cards.slice().sort((a, b) => yearOf(b) - yearOf(a) || (a.place || 999) - (b.place || 999));
  const best = Math.max(...cards.map(c => c.rating || 0));
  const wins = cards.filter(c => c.place === 1 && /grand final|final/i.test(c.ev)).length;
  const bestPlace = cards.filter(c => c.place).reduce((m, c) => Math.min(m, c.place), Infinity);
  const years = [...new Set(cards.map(yearOf).filter(Boolean))].sort();
  const orgs = [...new Set(cards.map(c => c.org).filter(Boolean))];
  const e = earnBy.get(g.handle.toLowerCase());
  const ctry = country(g.cc);
  const span = years.length ? (years[0] === years[years.length - 1] ? years[0] : years[0] + '–' + years[years.length - 1]) : '';
  const title = g.handle + ': FNCS results, stats and cards | FNCS Draft';
  const desc = g.handle + (ctry ? ' (' + ctry + ')' : '') + ' in FNCS' + (span ? ' ' + span : '') + ': ' + cards.length + ' tournament results' +
    (isFinite(bestPlace) ? ', best finish ' + ord(bestPlace) : '') + (orgs.length ? ', teams: ' + orgs.slice(0, 3).join(', ') : '') +
    '. Draft ' + g.handle + ' in the free FNCS Draft game.';
  const flag = g.cc ? '<img src="/flags/w20/' + esc(g.cc) + '.png" alt="" width="20">' : '';
  const rows = cards.map(c => '<tr><td>' + esc(c.ev) + '<small>' + esc(enDate(c.date)) + (c.org ? ' · ' + esc(c.org) : '') + '</small></td>' +
    '<td class="n' + (c.place === 1 ? ' p1' : '') + '">' + (c.place ? ord(c.place) : '-') + '</td>' +
    '<td class="n hide-s">' + (c.pts != null ? esc(c.pts) + ' pts' + (c.matches ? '<small>' + esc(c.matches) + ' games</small>' : '') : '') + '</td>' +
    '<td class="n r"><b' + (c.rating >= 90 ? ' class="hi"' : '') + '>' + esc(c.rating) + '</b></td></tr>').join('\n');
  const body = `<nav class="crumb"><a href="/">FNCS Draft</a> / <a href="/players">Players</a> / ${esc(g.handle)}</nav>
<div class="hero">${g.photo ? '<img class="ph" src="/' + esc(g.photo.replace(/^\/+/, '')) + '" alt="' + esc(g.handle) + '" width="112" height="112" loading="lazy">' : ''}
<div><h1>${esc(g.handle)}</h1><p class="sub">${flag}${esc([ctry, REGION[reg] || reg, span ? 'FNCS ' + span : ''].filter(Boolean).join(' · '))}</p></div></div>
<ul class="stats">
<li><b>${cards.length}</b><span>FNCS results on record</span></li>
${isFinite(bestPlace) ? '<li><b>' + ord(bestPlace) + '</b><span>best finish</span></li>' : ''}
${wins ? '<li><b>' + wins + '</b><span>final wins</span></li>' : ''}
<li><b>${best}</b><span>best card rating</span></li>
${e ? '<li><b>' + money(e.e) + '</b><span>prize money in 2026</span></li>' : ''}
</ul>
<a class="cta" href="/"><span>Draft ${esc(g.handle)} in FNCS Draft</span></a>
<h2>Tournament history</h2>
<table class="tbl"><thead><tr><th>Event</th><th class="n">Place</th><th class="n hide-s">Points</th><th class="n">Card</th></tr></thead><tbody>
${rows}
</tbody></table>
${orgs.length ? '<h2>Teams</h2><p>' + orgs.map(esc).join(', ') + '</p>' : ''}
${others.length ? '<h2>More players from ' + esc(REGION[reg] || reg) + '</h2><ul class="links">' + others.map(o => '<li><a href="/player/' + o.slug + '">' + esc(o.handle) + '</a></li>').join('') + '</ul>' : ''}
<p class="note">Results come from Epic Games tournament data and Liquipedia. The card rating is how FNCS Draft rates this result in its game, not an official number. FNCS Draft is a fan project, not affiliated with Epic Games.</p>`;
  const ld = { '@context': 'https://schema.org', '@type': 'ProfilePage', name: title, url: SITE + '/player/' + g.slug,
    mainEntity: Object.assign({ '@type': 'Person', name: g.handle, description: 'Fortnite competitive player' },
      ctry ? { nationality: ctry } : {}, orgs.length ? { affiliation: orgs.slice(0, 5).map(o => ({ '@type': 'SportsTeam', name: o })) } : {}) };
  return page({ title, desc, canon: SITE + '/player/' + g.slug, body, ld });
}

const byRegion = {};
P.forEach(g => { const r = mainRegion(g); (byRegion[r] = byRegion[r] || []).push(g); });
Object.values(byRegion).forEach(l => l.sort((a, b) => power(b) - power(a)));

fs.mkdirSync(path.join(OUT, 'player'), { recursive: true });
let bytes = 0;
P.forEach(g => {
  const l = byRegion[mainRegion(g)], i = l.indexOf(g);
  // Соседи по силе в своём регионе — внутренние ссылки, по которым поиск обходит все страницы.
  const others = l.slice(Math.max(0, i - 6), i + 7).filter(o => o !== g).slice(0, 12);
  const html = playerPage(g, others);
  bytes += html.length;
  fs.writeFileSync(path.join(OUT, 'player', g.slug + '.html'), html);
});

// /players — все страницы, по регионам, сильные первыми.
const order = ['EU', 'NAC', 'NAW', 'BR', 'ASIA', 'ME', 'OCE', 'UNK'];
const idxBody = `<nav class="crumb"><a href="/">FNCS Draft</a> / Players</nav>
<h1>FNCS players</h1>
<p class="sub">${P.length.toLocaleString('en-US')} Fortnite competitive players with their FNCS results from 2019 to 2026. Pick a player to see every tournament on record.</p>
<a class="cta" href="/"><span>Play FNCS Draft</span></a>
${order.filter(r => byRegion[r]).map(r => '<h2>' + esc(REGION[r] || 'Other') + '</h2><ul class="links">' +
  byRegion[r].map(g => '<li><a href="/player/' + g.slug + '">' + esc(g.handle) + '</a></li>').join('') + '</ul>').join('\n')}`;
fs.writeFileSync(path.join(OUT, 'players.html'), page({ title: 'FNCS players: results 2019-2026 | FNCS Draft',
  desc: 'Every Fortnite FNCS player in FNCS Draft: tournament results, best finishes and teams from 2019 to 2026.', canon: SITE + '/players', body: idxBody }));

// sitemap.xml этой папки: свои адреса дописываются к тем, что уже есть.
const smPath = path.join(OUT, 'sitemap.xml');
let sm = fs.readFileSync(smPath, 'utf8');
const urls = ['<url><loc>' + SITE + '/players</loc><lastmod>' + TODAY + '</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>']
  .concat(P.map(g => '<url><loc>' + SITE + '/player/' + g.slug + '</loc><lastmod>' + TODAY + '</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>'));
sm = sm.replace('</urlset>', urls.join('\n') + '\n</urlset>');
fs.writeFileSync(smPath, sm);
console.log('страниц игроков: ' + P.length + ' (' + Math.round(bytes / 1048576) + ' МБ), /players, sitemap +' + urls.length);
