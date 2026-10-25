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
  const CREDIT = { vitalscrims: '<a href="https://vitalscrims.com/competitive" rel="noopener">Vital Scrims</a>', zet_fnsub: '<a href="https://x.com/zet_fnsub" rel="noopener">LYNX Zet</a> and <a href="https://x.com/AC_Bird1" rel="noopener">Bird</a>',
    majorscrims: '<a href="https://www.majorscrims.com/tournaments/fncs-solo-finals-2026" rel="noopener">Major Scrims</a>' };
  const vital = !!CREDIT[src];
  const tags = real && DROPS && DROPS.regions[reg] && DROPS.regions[reg].boxes.length <= Z.length ? DROPS.regions[reg].boxes.map(b => b.tags) : null;
  const at = new Map();
  rows.forEach((r, i) => { if (r.drop === '' || r.dropShare < 0.5) return; const k = +r.drop; (at.get(k) || at.set(k, []).get(k)).push({ r, i }); });
  // Кто на настоящей карте точку не отметил, тому прогон дал свободную точку (коробки после карты) — на карте его не рисуем,
  // иначе он ложится поверх чужих коробок (BR 25.10: FAZER, IMEYFISHY на чужих спотах); перечисляем под картой.
  const unmarked = [];
  const boxes = [...at.entries()].map(([k, list]) => {
    const z = Z[k]; if (!z) return '';
    if (tags && k >= tags.length) { list.forEach(x => unmarked.push(x.r.n)); return ''; }
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
      : 'No public drop map for this region yet, so boxes are where each player drops in our runs.') + ' On a shared drop two or more players land together and fight for the loot; the number is how many.' +
      (unmarked.length ? ' Not found on the drop map, so they land alone in our runs: ' + unmarked.map(esc).join(', ') + '.' : '') + '</p>';
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
  return '<section class="glass reg" id="' + reg + '" data-reg="' + reg + '"><h2>' + esc(REGION[reg]) + (PRIZE[reg] ? ' <small>1st place ' + PRIZE[reg] + '</small>' : '') + '</h2>' +
    '<ul class="fav">' + cards + '</ul>' + mapHTML(reg, rows) +
    '<table class="tbl"><thead><tr><th>#</th><th>Player</th><th class="n">Rating</th><th class="n">Win</th><th class="n">Top 10</th><th class="n hide-s">Avg place</th><th class="hide-s">Drop</th></tr></thead><tbody>' + table + '</tbody></table></section>';
}

// Дизайн главного экрана (26.10, его «предикты тож дизайн измени» — как /competitive): синее стекло, Fira XC, пилюли.
const CSS = `@font-face{font-family:'Fira Sans Extra Condensed';font-style:normal;font-weight:700;font-display:swap;src:url(/fonts/fira-xc-700-latin.woff2) format('woff2');unicode-range:U+0000-00FF,U+2000-206F;}
@font-face{font-family:'Fira Sans Extra Condensed';font-style:normal;font-weight:900;font-display:swap;src:url(/fonts/fira-xc-900-latin.woff2) format('woff2');unicode-range:U+0000-00FF,U+2000-206F;}
:root{--go:#ffdd00;--go-ink:#0b0f12;--ink:#eaf0ff;--dim:#b7c3e6;--dimmer:#8fa0cc;--cyan:#9fe1ff;--lime:#d7ff3a;--hot:#ff4d5e;
  --line:rgba(180,200,255,.2);--row:rgba(126,150,224,.18);--row-h:rgba(150,180,255,.3);--r:16px;
  --font-display:'Fira Sans Extra Condensed','Oswald','Arial Narrow',Impact,sans-serif;}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;background:#0b1640}
body{margin:0;color:var(--ink);font:15px/1.55 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background-color:#0b1640;
  background-image:radial-gradient(900px 520px at 12% -6%,rgba(60,100,220,.5),rgba(60,100,220,0)),radial-gradient(700px 480px at 92% 8%,rgba(150,180,255,.3),rgba(150,180,255,0)),
  radial-gradient(1100px 700px at 50% 110%,rgba(30,50,140,.6),rgba(30,50,140,0));background-attachment:fixed;min-height:100vh}
a{color:var(--cyan)}
.wrap{max-width:1000px;margin:0 auto;padding:18px 20px 80px}
.top{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;border-bottom:2px solid rgba(180,200,255,.15);padding-bottom:14px;margin-bottom:22px}
.logo{display:flex;align-items:center;gap:10px;text-decoration:none;color:#fff}
.logo b{font:italic 900 30px/1 var(--font-display);letter-spacing:-.01em;text-transform:uppercase}
.logo i{font-style:inherit;background:linear-gradient(180deg,#e9fbff 0%,#9fe1ff 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.site-nav{display:flex;gap:4px}
.nav-pill{font:600 15px var(--font-display);letter-spacing:.06em;text-transform:uppercase;color:#e6ecff;text-decoration:none;padding:8px 16px;border-radius:999px;white-space:nowrap}
.nav-pill:hover{background:rgba(255,255,255,.12);outline:3px solid rgba(255,255,255,.92)}
.nav-pill.on{background:#e4ebf7;color:#0b1a3a}
h1,h2,h3{font-family:var(--font-display);font-weight:700;margin:0;line-height:1.08}
.glass{position:relative;overflow:hidden;border-radius:var(--r);background:linear-gradient(160deg,#1d3b8c 0%,#13265f 46%,#0b1640 100%);box-shadow:inset 0 0 0 1px rgba(180,200,255,.18)}
.glass>*{position:relative}
.head{padding:24px 28px 26px}
.crumb{font:700 13px var(--font-display);text-transform:uppercase;letter-spacing:.08em;color:var(--dim);margin:0 0 10px}
.crumb a{color:var(--cyan);text-decoration:none}
.head h1{font-size:clamp(34px,6vw,58px);font-weight:900;font-style:italic;text-transform:uppercase;letter-spacing:-.01em}
.sub{color:#c9d5f0;margin:10px 0 0;font-size:15px;max-width:760px}
.tabs{display:flex;flex-wrap:wrap;gap:6px;margin:22px 0 14px;padding:0;list-style:none}
.tabs button{font:700 15px var(--font-display);letter-spacing:.05em;color:#fff;background:rgba(150,180,255,.18);border:none;border-radius:999px;padding:8px 18px;cursor:pointer;min-height:40px}
.tabs button:hover{background:rgba(150,180,255,.32)}
.tabs button[aria-selected="true"]{background:#e4ebf7;color:#0b1a3a}
.reg{padding:20px 22px 22px}
.reg[hidden]{display:none}
.reg h2{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;font-size:clamp(26px,4vw,36px);font-weight:900;font-style:italic;text-transform:uppercase;margin:0 0 14px}
.reg h2 small{font:700 13px var(--font-display);font-style:normal;letter-spacing:.08em;color:#0b1a3a;background:var(--lime);border-radius:999px;padding:3px 10px}
.fav{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:0 0 16px;padding:0;list-style:none}
.fav li{background:var(--row);border-radius:12px;padding:12px 14px;position:relative;min-width:0}
.fav li:first-child{box-shadow:inset 0 0 0 2px var(--go)}
.fav em{position:absolute;top:8px;right:12px;font:900 18px var(--font-display);color:var(--dim);font-style:normal}
.fav li:first-child em{color:var(--go)}
.fav b{display:block;font:700 22px var(--font-display);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fav b img{vertical-align:-1px;margin-right:6px}
.fav strong{display:block;font:900 40px/1.05 var(--font-display);color:var(--go)}
.fav span{font-size:13px;color:var(--dim)}
.map{position:relative;border-radius:12px;overflow:hidden;box-shadow:inset 0 0 0 1px rgba(180,200,255,.2);aspect-ratio:${P.mapAspect || '921/843'};background:#0b1640;container-type:inline-size}
.map img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:brightness(.72) saturate(.85)}
.z{position:absolute;border:1.5px solid rgba(238,242,246,.55);border-radius:5px;background:rgba(11,15,18,.38);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;box-shadow:inset 0 0 0 1px rgba(0,0,0,.35)}
.z.hot{border-color:var(--hot);background:rgba(255,77,94,.30);box-shadow:0 0 0 1px rgba(255,77,94,.35),0 0 12px rgba(255,77,94,.35)}
.z.fav{border-color:var(--go);border-width:2px;box-shadow:0 0 10px rgba(255,221,0,.45)}
.z.fav i{color:var(--go)}
.z i{font-style:normal;font-family:var(--font-display);font-weight:700;letter-spacing:.02em;font-size:max(6px,1.3cqw);line-height:1.15;color:#fff;white-space:nowrap;pointer-events:none;position:relative;z-index:1;
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
.tbl{width:100%;border-collapse:separate;border-spacing:0 4px;font-size:14px;margin-top:14px}
.tbl th{text-align:left;font:700 12px var(--font-display);text-transform:uppercase;letter-spacing:.08em;color:var(--dimmer);padding:2px 10px}
.tbl th.n,.tbl td.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.tbl td{padding:8px 10px;background:var(--row);vertical-align:top}
.tbl td:first-child{border-radius:10px 0 0 10px}.tbl td:last-child{border-radius:0 10px 10px 0}
.tbl tr:hover td{background:var(--row-h)}
.tbl td img{vertical-align:-2px;margin-right:6px}
.rb{display:inline-block;min-width:16px;height:12px;line-height:12px;padding:0 2px;font:700 7px/12px sans-serif;text-align:center;border-radius:2px;background:#2a3f80;color:#dfe8fb;margin-right:6px;vertical-align:1px}
.tbl small{display:block;color:var(--dim);font-size:12px}
.p1{color:var(--go);font:700 16px var(--font-display)}
.btn{display:inline-block;font:700 18px/1 var(--font-display);letter-spacing:.04em;text-transform:uppercase;text-decoration:none;border-radius:10px;padding:13px 28px 12px;margin-top:22px;
  background:var(--go);color:var(--go-ink);box-shadow:0 4px 0 #b59c00,0 8px 18px rgba(0,0,0,.35)}
.btn:hover{transform:translateY(-1px);filter:brightness(1.06)}
.btn:active{transform:translateY(2px);box-shadow:0 2px 0 #b59c00,0 4px 10px rgba(0,0,0,.35)}
.btn.alt{background:rgba(150,180,255,.22);color:#fff;box-shadow:none;margin-left:8px}
.note{color:var(--dim);font-size:13px;margin:8px 0 0}
.how{padding:16px 20px;margin-top:22px;font-size:14px;color:var(--dim)}
.how b{color:#fff;font-family:var(--font-display);font-size:16px;letter-spacing:.04em;text-transform:uppercase}
@media(max-width:620px){.wrap{padding:14px 14px 64px}.head{padding:20px 18px}.reg{padding:16px 14px 18px}.logo b{font-size:24px}.nav-pill{padding:7px 12px;font-size:14px}
  .tbl .hide-s{display:none}.fav{grid-template-columns:1fr}.fav li{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}.fav strong{font-size:30px}.btn.alt{margin-left:0}}`;

const REALS = REGS.filter(r => P.realRects && P.realRects[r]);
const total = REGS.reduce((s, r) => s + P.regions[r].length, 0);
const top = REGS.map(r => P.regions[r][0] && P.regions[r][0].n + ' (' + r + ')').filter(Boolean).slice(0, 4).join(', ');
const title = 'FNCS Solos 2026 Finals prediction: win chances for every region | FNCS Draft';
const desc = 'Who wins the FNCS Solos 2026 Finals? ' + total + ' finalists in ' + REGS.length + ' regions, each final simulated ' + P.runs +
  ' times with real drops and Epic scoring. Favourites: ' + top + '.';
const body = `<header class="top"><a class="logo" href="/"><img src="/logo.png" alt="" width="40" height="40"><b><i>FNCS</i> DRAFT</b></a>
<nav class="site-nav" aria-label="site"><a class="nav-pill" href="/">Career</a><a class="nav-pill on" href="/competitive">Competitive</a></nav></header>
<section class="glass head"><p class="crumb"><a href="/competitive">Competitive</a> / Predictions</p>
<h1>FNCS Solos 2026 Finals prediction</h1>
<p class="sub">${total} real finalists, ${REGS.length} regions. Every final played ${P.runs} times in the FNCS Draft engine: 12 games, Epic scoring (placement points + 4 per elimination), each player holding the same drop all final. Day 1 on 26 October, Day 2 on 27 October 2026, 18:00 UTC.</p></section>
<div class="tabs" role="tablist">${REGS.map((r, i) => '<button role="tab" aria-selected="' + (i ? 'false' : 'true') + '" data-tab="' + r + '">' + r + '</button>').join('')}</div>
${REGS.map(regionHTML).join('\n')}
<div class="glass how"><b>How it works.</b> Finalists come from Epic's own leaderboards (Fast Track top 8, both Heats top 35, Last Chance top 22). A player who is in FNCS Draft plays with their 2026 rating, built from the whole year: Majors, Global Championship, cups. A player who is not gets a rating from their qualifier results, scaled against the players we do know in the same region. ${REALS.length ? 'Drops in ' + REALS.join(', ') + ' are real, taken from the community drop map: each player lands on their own spot every game, and a shared spot is a fight at the landing. ' + (REALS.length < REGS.length ? 'Where no drop map is out yet, the game deals the drops: stronger players pick the richer spots first.' : '') : 'Drops are dealt by the game: stronger players pick the richer spots first, and a spot two players want becomes a fight at the landing.'} It is a simulation, not a promise.</div>
<a class="btn" href="/">Play the FNCS career</a><a class="btn alt" href="/competitive">Tournament calendar</a>
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
<meta name="theme-color" content="#0b1640">
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
