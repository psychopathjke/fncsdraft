// Страница прогноза финала FNCS Solos 2026 (25.10, его «сделать симуляцию крупного турнира… все регионы» и
// «ещё надо учитывать, кто падает на локацию, карты лендинга»): /predict/fncs-solos-2026.
//
// Данные — tools/measured/solos-2026-predict.json: финалисты по выгрузкам Epic (Tracker, хиты, ласт-ченс,
// Fast Track), каждый финал сыгран движком игры N раз — 12 игр, очки Epic, точка падения держится весь финал.
// Собирается в папку деплоя из build-deploy.js и добавляет адрес в sitemap.xml.
//
//   node tools/build-solos-predict.js <папка деплоя>
const fs = require('fs'), path = require('path');
const OUT = path.resolve(process.argv[2] || '');
if (!process.argv[2] || !fs.existsSync(path.join(OUT, 'index.html'))) throw new Error('нужна папка деплоя с index.html');
const SRC = path.join(__dirname, 'measured', 'solos-2026-predict.json');
if (!fs.existsSync(SRC)) { console.log('прогноз: нет ' + SRC + ', пропуск'); process.exit(0); }
const P = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const DSRC = path.join(__dirname, 'measured', 'solos-2026-drops.json');
const DROPS = fs.existsSync(DSRC) ? JSON.parse(fs.readFileSync(DSRC, 'utf8')) : null;
const SITE = 'https://fncsdraft.com', SLUG = 'fncs-solos-2026', URL = SITE + '/predict/' + SLUG;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pct = v => v >= 0.995 ? '99%' : v > 0 && v < 0.005 ? '<1%' : Math.round(v * 100) + '%';
const REGS = ['EU', 'NAC', 'NAW', 'BR', 'ASIA', 'ME', 'OCE'].filter(r => P.regions[r]);
const REGION = { EU: 'Europe', NAC: 'NA Central', NAW: 'NA West', BR: 'Brazil', ASIA: 'Asia', ME: 'Middle East', OCE: 'Oceania' };
const PRIZE = { EU: '$60,000', NAC: '$50,000' };
const via = v => { const [st, r] = String(v || '').split(':'); return ({ fast: 'Fast Track', heats: 'Heats', lcq: 'Last Chance' }[st] || st) + (r ? ' #' + r : ''); };
// Флаг каждому (25.10, его «флаги добавь всем»): страна Epic, иначе solos-2026-nat.json (страна из базы eucompetitive
// по id аккаунта, потом национальность из игры), а у кого её нет нигде — значок региона, как cardFlag в игре.
const NSRC = path.join(__dirname, 'measured', 'solos-2026-nat.json');
const NAT = fs.existsSync(NSRC) ? JSON.parse(fs.readFileSync(NSRC, 'utf8')) : {};
const flag = (r, reg) => {
  const c = r.c || NAT[reg + '|' + r.n];
  return c ? '<img src="/flags/w20/' + esc(String(c).toLowerCase()) + '.png" alt="" width="16" loading="lazy">'
    : '<span class="rb">' + esc(reg) + '</span>';
};

function mapHTML(reg, rows) {
  // Регион с настоящей картой дропов (fetch-solos-drops.js) рисует её коробки, остальные — точки движка.
  const real = P.realRects && P.realRects[reg];
  const Z = (real && real.rects) || P.zoneRects || [];
  // Ники с самой карты (коробки в том же порядке, что rects прогона).
  // Чья карта: eucompetitive (EU), Vital Scrims (NAC/NAW/ME/OCE), сводка LYNX Zet в X (ASIA).
  const src = real && DROPS && DROPS.regions[reg] && DROPS.regions[reg].source;
  const CREDIT = { vitalscrims: '<a href="https://vitalscrims.com/competitive" rel="noopener">Vital Scrims</a>', zet_fnsub: '<a href="https://x.com/zet_fnsub" rel="noopener">LYNX Zet</a> and <a href="https://x.com/AC_Bird1" rel="noopener">Bird</a>' };
  const vital = !!CREDIT[src];
  const tags = real && DROPS && DROPS.regions[reg] && DROPS.regions[reg].boxes.length <= Z.length ? DROPS.regions[reg].boxes.map(b => b.tags) : null;
  const at = new Map();
  rows.forEach((r, i) => { if (r.drop === '' || r.dropShare < 0.5) return; const k = +r.drop; (at.get(k) || at.set(k, []).get(k)).push({ r, i }); });
  const boxes = [...at.entries()].map(([k, list]) => {
    const z = Z[k]; if (!z) return '';
    // Как на карте eucompetitive (25.10, его «сделай такой же как референс»): все ники коробки столбиком, капсом,
    // белым с чёрной обводкой; общая точка — красная. На настоящей карте — их же короткие ники (без клана).
    const names = list.slice().sort((a, b) => a.i - b.i).map(x => (tags && tags[k] && tags[k].length === list.length) ? null : x.r.n);
    const shown = names.includes(null) ? tags[k] : names;
    // Цвета сайта (25.10, его «дизайн и цвет прямоугольников можешь изменить»): одиночная — светлая рамка,
    // общая — красная заливка с числом игроков, точка топ-10 прогноза — жёлтая рамка.
    const fav = list.some(x => x.i < 10), hot = list.length > 1;
    return '<div class="z' + (hot ? ' hot' : '') + (fav ? ' fav' : '') + '" style="left:' + z.x + '%;top:' + z.y + '%;width:' + z.w + '%;height:' + z.h + '%">' +
      (hot ? '<b>' + list.length + '</b>' : '') + shown.map(n => '<i>' + esc(String(n).toUpperCase()) + '</i>').join('') + '</div>';
  }).join('');
  const legend = '<div class="lg"><span><s class="l-solo"></s>Solo drop</span><span><s class="l-hot"></s>Shared drop</span><span><s class="l-fav"></s>Top-10 favourite</span></div>';
  return '<div class="map"><img src="/' + esc(P.mapImg || 'art/map-s42.jpg') + '" alt="Landing spots, ' + esc(REGION[reg]) + ' final" loading="lazy">' + boxes + '</div>' + legend +
    '<p class="note">' + (real ? 'Real drops: the ' + (vital ? '' : 'Day ' + real.day + ' ') + 'drop map by ' + (vital ? CREDIT[src] : '<a href="https://eucompetitive.com/maps" rel="noopener">eucompetitive.com</a>') + ', every player on the spot they actually land on.'
      : 'No public drop map for this region yet, so boxes are where each player drops in our runs.') + ' On a shared drop two or more players land together and fight for the loot; the number is how many.</p>';
}

function regionHTML(reg) {
  const rows = P.regions[reg];
  const fav = rows.slice(0, 3);
  const cards = fav.map((r, i) => '<li><em>' + (i + 1) + '</em><b>' + flag(r, reg) + esc(r.n) + '</b><strong>' + pct(r.win) + '</strong><span>to win · top 10 ' + pct(r.top10) + '</span></li>').join('');
  const table = rows.map((r, i) => {
    const mates = (r.mates || []).filter(m => m[1] >= 0.25).map(m => esc(m[0])).join(', ');
    return '<tr><td class="n">' + (i + 1) + '</td><td>' + flag(r, reg) + '<b>' + esc(r.n) + '</b><small>' + via(r.via) + (r.real ? '' : ' · rating from qualifiers') + '</small></td>' +
      '<td class="n">' + r.ovr + '</td><td class="n' + (i < 3 ? ' p1' : '') + '">' + pct(r.win) + '</td><td class="n">' + pct(r.top10) + '</td><td class="n hide-s">' + r.avgPlace + '</td>' +
      '<td class="hide-s">' + (r.contest >= 0.5 ? (mates ? 'shared with ' + mates : 'shared drop') : 'solo drop') + '</td></tr>';
  }).join('');
  return '<section class="reg" id="' + reg + '" data-reg="' + reg + '"><h2>' + esc(REGION[reg]) + (PRIZE[reg] ? ' <small>1st place ' + PRIZE[reg] + '</small>' : '') + '</h2>' +
    '<ul class="fav">' + cards + '</ul>' + mapHTML(reg, rows) +
    '<table class="tbl"><thead><tr><th>#</th><th>Player</th><th class="n">Rating</th><th class="n">Win</th><th class="n">Top 10</th><th class="n hide-s">Avg place</th><th class="hide-s">Drop</th></tr></thead><tbody>' + table + '</tbody></table></section>';
}

const CSS = `@font-face{font-family:'Oswald';font-style:normal;font-weight:200 700;font-display:swap;src:url(/fonts/oswald-latin.woff2) format('woff2');unicode-range:U+0000-00FF,U+2000-206F;}
:root{--go:#ffdd00;--go-ink:#0b0f12;--bg:#0e1116;--panel:#161b22;--ink:#eef2f6;--dim:#8b98a8;--accent:#00c9a7;--line:#262e39;--hot:#ff4d5e;
  --font-display:'Oswald','Arial Narrow',Impact,sans-serif;}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%;background:#0b0e13}
body{margin:0;background:linear-gradient(180deg,#0d141a 0%,#0e1116 45%,#0b0e13 100%) fixed;color:var(--ink);font:16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;}
.wrap{max-width:900px;margin:0 auto;padding:22px 16px 72px}
.crumb{font-family:var(--font-display);text-transform:uppercase;letter-spacing:.06em;font-size:13px;color:var(--dim);margin:0 0 22px}
.crumb a{color:var(--accent);text-decoration:none}
h1,h2{font-family:var(--font-display);font-weight:600;letter-spacing:.03em;line-height:1.1;margin:0}
h1{font-size:clamp(32px,7vw,54px);text-transform:uppercase}
h2{font-size:24px;text-transform:uppercase;letter-spacing:.05em;color:var(--accent);margin:26px 0 12px}
h2 small{font-size:14px;color:var(--dim);letter-spacing:.04em;margin-left:8px}
a{color:var(--accent)}
.sub{color:var(--dim);margin:8px 0 0;font-size:15px}
.tabs{display:flex;flex-wrap:wrap;gap:6px;margin:22px 0 0;padding:0;list-style:none}
.tabs button{font:600 15px var(--font-display);letter-spacing:.06em;text-transform:uppercase;background:var(--panel);color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:8px 14px;cursor:pointer;min-height:40px}
.tabs button[aria-selected="true"]{background:var(--go);color:var(--go-ink);border-color:var(--go)}
.reg[hidden]{display:none}
.fav{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:0 0 16px;padding:0;list-style:none}
.fav li{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:12px 14px;position:relative;min-width:0}
.fav em{position:absolute;top:8px;right:12px;font:600 14px var(--font-display);color:var(--dim);font-style:normal}
.fav b{display:block;font-family:var(--font-display);font-size:20px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fav b img{vertical-align:-1px;margin-right:6px}
.fav strong{display:block;font:600 34px/1.1 var(--font-display);color:var(--go)}
.fav span{font-size:13px;color:var(--dim)}
.map{position:relative;border-radius:12px;overflow:hidden;border:1px solid var(--line);aspect-ratio:${P.mapAspect || '921/843'};background:#0b1640}
.map img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:brightness(.72) saturate(.85)}
.map{container-type:inline-size}
.z{position:absolute;border:1.5px solid rgba(238,242,246,.55);border-radius:5px;background:rgba(11,15,18,.38);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;box-shadow:inset 0 0 0 1px rgba(0,0,0,.35)}
.z.hot{border-color:var(--hot);background:rgba(255,77,94,.30);box-shadow:0 0 0 1px rgba(255,77,94,.35),0 0 12px rgba(255,77,94,.35)}
.z.fav{border-color:var(--go);border-width:2px;box-shadow:0 0 10px rgba(255,221,0,.45)}
.z.fav i{color:var(--go)}
.z i{font-style:normal;font-family:var(--font-display);font-weight:600;letter-spacing:.02em;font-size:max(6px,1.3cqw);line-height:1.15;color:#fff;white-space:nowrap;pointer-events:none;position:relative;z-index:1;
  text-shadow:0 1px 2px rgba(0,0,0,.9),0 0 3px rgba(0,0,0,.8)}
.z b{position:absolute;top:-1px;right:-1px;transform:translate(35%,-35%);min-width:max(12px,1.9cqw);height:max(12px,1.9cqw);padding:0 3px;border-radius:999px;background:var(--hot);color:#fff;font:700 max(7px,1.15cqw)/max(12px,1.9cqw) var(--font-display);text-align:center;z-index:2;box-shadow:0 1px 3px rgba(0,0,0,.6)}
.z.fav b{background:var(--go);color:var(--go-ink)}
.lg{display:flex;flex-wrap:wrap;gap:6px 16px;margin:10px 0 0;font-size:13px;color:var(--dim)}
.lg span{display:inline-flex;align-items:center;gap:6px}
.lg s{display:inline-block;width:16px;height:11px;border-radius:3px;text-decoration:none}
.l-solo{border:1.5px solid rgba(238,242,246,.55);background:rgba(11,15,18,.38)}
.l-hot{border:1.5px solid var(--hot);background:rgba(255,77,94,.30)}
.l-fav{border:2px solid var(--go)}
.k.hot{color:var(--hot)}
.tbl{width:100%;border-collapse:collapse;font-size:14px;margin-top:14px}
.tbl th{text-align:left;font-family:var(--font-display);font-weight:500;text-transform:uppercase;letter-spacing:.05em;font-size:12px;color:var(--dim);padding:6px 8px;border-bottom:1px solid var(--line)}
.tbl th.n,.tbl td.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.tbl td{padding:7px 8px;border-bottom:1px solid var(--line);vertical-align:top}
.tbl td img{vertical-align:-2px;margin-right:6px}
.rb{display:inline-block;min-width:16px;height:12px;line-height:12px;padding:0 2px;font:700 7px/12px sans-serif;text-align:center;border-radius:2px;background:#2a3442;color:#cfd8e3;margin-right:6px;vertical-align:1px}
.tbl small{display:block;color:var(--dim);font-size:12px}
.p1{color:var(--go);font-weight:700}
.cta{display:inline-block;background:var(--go);color:var(--go-ink);font-family:var(--font-display);font-weight:600;font-size:17px;letter-spacing:.06em;
  text-transform:uppercase;line-height:1;padding:14px 24px 13px;text-decoration:none;transform:skewX(-8deg);margin:18px 0 4px}
.cta span{display:inline-block;transform:skewX(8deg)}
.note{color:var(--dim);font-size:13px;margin:8px 0 0}
.how{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin-top:30px;font-size:14px;color:var(--dim)}
.how b{color:var(--ink)}
@media(max-width:560px){.tbl .hide-s{display:none}.fav{grid-template-columns:1fr}.fav li{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}.fav strong{font-size:26px}}`;

const REALS = REGS.filter(r => P.realRects && P.realRects[r]);
const total = REGS.reduce((s, r) => s + P.regions[r].length, 0);
const top = REGS.map(r => P.regions[r][0] && P.regions[r][0].n + ' (' + r + ')').filter(Boolean).slice(0, 4).join(', ');
const title = 'FNCS Solos 2026 Finals prediction: win chances for every region | FNCS Draft';
const desc = 'Who wins the FNCS Solos 2026 Finals? ' + total + ' finalists in ' + REGS.length + ' regions, each final simulated ' + P.runs +
  ' times with real drops and Epic scoring. Favourites: ' + top + '.';
const body = `<p class="crumb"><a href="/">FNCS Draft</a> / Predictions</p>
<h1>FNCS Solos 2026 Finals prediction</h1>
<p class="sub">${total} real finalists, ${REGS.length} regions. Every final played ${P.runs} times in the FNCS Draft engine: 12 games, Epic scoring (placement points + 4 per elimination), each player holding the same drop all final. Day 1 on 26 October, Day 2 on 27 October 2026, 18:00 UTC.</p>
<div class="tabs" role="tablist">${REGS.map((r, i) => '<button role="tab" aria-selected="' + (i ? 'false' : 'true') + '" data-tab="' + r + '">' + r + '</button>').join('')}</div>
${REGS.map(regionHTML).join('\n')}
<div class="how"><b>How it works.</b> Finalists come from Epic's own leaderboards (Fast Track top 8, both Heats top 35, Last Chance top 22). A player who is in FNCS Draft plays with their 2026 rating, built from the whole year: Majors, Global Championship, cups. A player who is not gets a rating from their qualifier results, scaled against the players we do know in the same region. ${REALS.length ? 'Drops in ' + REALS.join(', ') + ' are real, taken from the community drop map: each player lands on their own spot every game, and a shared spot is a fight at the landing. ' + (REALS.length < REGS.length ? 'Where no drop map is out yet, the game deals the drops: stronger players pick the richer spots first.' : '') : 'Drops are dealt by the game: stronger players pick the richer spots first, and a spot two players want becomes a fight at the landing.'} It is a simulation, not a promise.</div>
<a class="cta" href="/"><span>Play the FNCS career</span></a>
<script>
(function(){var b=document.querySelectorAll('.tabs button'),s=document.querySelectorAll('.reg');
function show(r){b.forEach(function(x){x.setAttribute('aria-selected',x.getAttribute('data-tab')===r?'true':'false');});s.forEach(function(x){x.hidden=x.getAttribute('data-reg')!==r;});}
b.forEach(function(x){x.addEventListener('click',function(){show(x.getAttribute('data-tab'));try{history.replaceState(null,'','#'+x.getAttribute('data-tab'));}catch(e){}});});
var h=(location.hash||'').slice(1).toUpperCase();show(${JSON.stringify(REGS)}.indexOf(h)>=0?h:'${REGS[0]}');})();
</script>`;
const ld = { '@context': 'https://schema.org', '@type': 'Article', headline: 'FNCS Solos 2026 Finals prediction', url: URL, datePublished: P.harvested || '2026-10-25',
  about: { '@type': 'SportsEvent', name: 'FNCS Solos 2026 Finals', startDate: '2026-10-26', endDate: '2026-10-27' }, publisher: { '@type': 'Organization', name: 'FNCS Draft', url: SITE } };
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#0e1116">
<link rel="canonical" href="${URL}">
<link rel="icon" type="image/png" sizes="96x96" href="/favicon-96.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="article">
<meta property="og:site_name" content="FNCS Draft">
<meta property="og:title" content="FNCS Solos 2026 Finals prediction">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${URL}">
<meta property="og:image" content="${SITE}/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
<style>${CSS}</style>
</head>
<body>
<main class="wrap">
${body}
</main>
</body>
</html>
`;
fs.mkdirSync(path.join(OUT, 'predict'), { recursive: true });
fs.writeFileSync(path.join(OUT, 'predict', SLUG + '.html'), html);
const sm = path.join(OUT, 'sitemap.xml');
if (fs.existsSync(sm)) {
  let x = fs.readFileSync(sm, 'utf8');
  if (x.indexOf('/predict/' + SLUG + '<') < 0) {
    x = x.replace('</urlset>', '<url><loc>' + URL + '</loc><lastmod>' + new Date().toISOString().slice(0, 10) + '</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>\n</urlset>');
    fs.writeFileSync(sm, x);
  }
}
console.log('прогноз: /predict/' + SLUG + ' (' + REGS.length + ' регионов, ' + total + ' финалистов, ' + Math.round(html.length / 1024) + ' КБ)');
