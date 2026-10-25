// Страница /competitive (25.10, его «отдельной вкладкой, как компететив… календарь турниров, за месяц призы игроков,
// новости»; «хочу чтоб на сайте было 2 вкладки карьера и компетитив»).
//
// Из tools/measured: comp-calendar.json и comp-results.json (fetch-competitive.js), solos-2026-predict.json (прогноз).
// Время в разметке — UTC, страница переводит его в часы зрителя и прячет прошедшее. Регион по умолчанию —
// по часовому поясу браузера. Английская, как /predict.
//
//   node tools/build-competitive.js <папка деплоя>   (зовёт build-deploy.js)
const fs = require('fs'), path = require('path');
const OUT = path.resolve(process.argv[2] || '');
if (!process.argv[2] || !fs.existsSync(path.join(OUT, 'index.html'))) throw new Error('нужна папка деплоя с index.html');
const M = path.join(__dirname, 'measured');
const read = f => fs.existsSync(path.join(M, f)) ? JSON.parse(fs.readFileSync(path.join(M, f), 'utf8')) : null;
const CAL = read('comp-calendar.json'), RES = read('comp-results.json'), PRED = read('solos-2026-predict.json');
if (!CAL) { console.log('competitive: нет comp-calendar.json, пропуск'); process.exit(0); }
const SITE = 'https://fncsdraft.com';
const NOW = Date.now();
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const REGS = ['EU', 'NAC', 'NAW', 'BR', 'ASIA', 'ME', 'OCE'];
const money = v => '$' + Math.round(v).toLocaleString('en-US');
const flag = c => c && fs.existsSync(path.join(__dirname, '..', 'flags', 'w20', String(c).toLowerCase() + '.png'))
  ? '<img src="/flags/w20/' + esc(String(c).toLowerCase()) + '.png" alt="" width="16" loading="lazy">' : '';

// Имя окна Epic → человеческое. У Epic в календаре сырые id («ConsoleVCC SolosZB Event8Round2»).
const WORDS = [[/ConsoleVCC/g, 'Console Victory Cash Cup'], [/MobileVictoryCup/g, 'Mobile Victory Cup'], [/ReloadSoloVictoryCup/g, 'Reload Solo Victory Cup'],
  [/ReloadCashCup/g, 'Reload Cash Cup'], [/RankedCupReloadDuos/g, 'Ranked Reload Duos Cup'], [/RankedCupSoloReload/g, 'Ranked Reload Solo Cup'],
  [/RankedCupDuos/g, 'Ranked Duos Cup'], [/RankedCupSolo/g, 'Ranked Solo Cup'], [/ArenaTestCup/g, 'Arena Cup'], [/PSNickEh30/g, 'Nick Eh 30 Cup'],
  [/FNCSSoloQualifiers/g, 'FNCS Solos Qualifier'], [/FNCSSoloFastTracks/g, 'FNCS Solos Fast Track'], [/FNCSSolo/g, 'FNCS Solos'],
  [/HeatsStage/g, 'Heats'], [/LastChanceQualifier/g, 'Last Chance'], [/LastChanceLobby/g, 'Last Chance Lobby'], [/\bFinal\b/g, 'Finals'],
  [/SolosZB|DuosZB|\bZB\b/g, 'Zero Build'], [/Event(\d+)\s*Round(\d+)/g, 'Week $1 · Round $2'], [/Event(\d+)/g, 'Week $1'],
  [/Round(\d+)/g, 'Round $1'], [/Qual(\d+)/g, 'Qualifier $1 ·'], [/Day(\d+)/g, 'Day $1'], [/Heat(\d+)/g, 'Heat $1'], [/\s*-\s*/g, ' · ']];
function pretty(name) {
  let s = String(name || '');
  WORDS.forEach(([re, to]) => { s = s.replace(re, to); });
  return s.replace(/\s+/g, ' ').replace(/· ·/g, '·').replace(/\s·\s*$/, '').trim();
}
const kind = w => /FNCS/.test(w) ? 'fncs' : /VCC|VictoryCup|CashCup|PerformanceEvaluation|NickEh30/.test(w) ? 'cash' : /Ranked/.test(w) ? 'ranked' : 'other';
const KIND = { fncs: 'FNCS', cash: 'Cash cup', ranked: 'Ranked cup', other: 'Cup' };
const regOf = e => REGS.includes(e.region) ? e.region : (String(e.w).split('_').pop());

// ---- Главное событие: финал FNCS Solos с прогнозом
const finals = CAL.events.filter(e => /FNCSSolo_Final_Day1_/.test(e.w)).map(e => ({ reg: regOf(e), begin: e.begin }))
  .filter(f => REGS.includes(f.reg)).sort((a, b) => a.begin < b.begin ? -1 : 1);
const finalsLive = finals.length && Date.parse(finals[finals.length - 1].begin) + 2 * 86400e3 > NOW;
const heroHTML = finalsLive ? `<section class="hero">
  <span class="tag">Next up · Finals</span>
  <h2>FNCS Solos 2026 Finals</h2>
  <p class="sub">The first solo FNCS in years. 100 players per region, two days, six games a night.</p>
  <ul class="when">${finals.map(f => {
    const fav = PRED && PRED.regions[f.reg] && PRED.regions[f.reg][0];
    return `<li data-t="${esc(f.begin)}"><b>${esc(f.reg)}</b><time datetime="${esc(f.begin)}">${esc(f.begin.slice(5, 16).replace('T', ' '))} UTC</time>` +
      (fav ? `<span>Fav: ${esc(fav.n)} ${Math.round(fav.win * 100)}%</span>` : '') + '</li>';
  }).join('')}</ul>
  <a class="cta" href="/predict/fncs-solos-2026"><span>Win chances and drop maps</span></a>
</section>` : '';

// ---- Календарь: всё от «сейчас» на 14 дней вперёд
const until = NOW + 14 * 86400e3;
const upcoming = CAL.events.filter(e => Date.parse(e.end || e.begin) > NOW - 3 * 3600e3 && Date.parse(e.begin) < until && REGS.includes(regOf(e)))
  .sort((a, b) => a.begin < b.begin ? -1 : a.begin > b.begin ? 1 : 0);
const byDay = new Map();
upcoming.forEach(e => { const d = e.begin.slice(0, 10); if (!byDay.has(d)) byDay.set(d, []); byDay.get(d).push(e); });
const calHTML = [...byDay.entries()].map(([d, list]) => `<div class="day" data-day="${d}"><h3><time datetime="${d}">${d}</time></h3><ul>` +
  list.map(e => `<li class="ev k-${kind(e.w)}" data-reg="${esc(regOf(e))}" data-t="${esc(e.begin)}" data-end="${esc(e.end || e.begin)}">` +
    `<time datetime="${esc(e.begin)}">${esc(e.begin.slice(11, 16))}</time><i>${esc(regOf(e))}</i>` +
    `<span>${esc(pretty(e.name))}</span><em>${KIND[kind(e.w)]}</em></li>`).join('') + '</ul></div>').join('');

// ---- Призы за месяц и последние результаты
let earnHTML = '', resHTML = '', monthName = '', paid = 0;
if (RES && RES.windows.length) {
  monthName = new Date(RES.month + '-01T00:00:00Z').toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const P = new Map();
  RES.windows.forEach(w => w.top.forEach(x => {
    if (!x.usd) return;
    x.ids.forEach((id, i) => {
      const o = P.get(id) || { n: x.n[i] || x.epic[i] || '?', c: x.c[i], reg: regOf(w), usd: 0, cups: 0, wins: 0 };
      o.usd += x.usd; o.cups++; if (x.rank === 1) o.wins++; P.set(id, o); paid += x.usd;
    });
  }));
  const top = [...P.values()].sort((a, b) => b.usd - a.usd);
  earnHTML = `<table class="tbl" id="earn"><thead><tr><th>#</th><th>Player</th><th>Region</th><th class="n">Cups paid</th><th class="n">Wins</th><th class="n">Earned</th></tr></thead><tbody>` +
    top.slice(0, 300).map((p, i) => `<tr data-reg="${esc(p.reg)}"${i >= 25 ? ' class="more"' : ''}><td class="n">${i + 1}</td><td>${flag(p.c)}<b>${esc(p.n)}</b></td><td>${esc(p.reg)}</td>` +
      `<td class="n">${p.cups}</td><td class="n">${p.wins || ''}</td><td class="n p1">${money(p.usd)}</td></tr>`).join('') + '</tbody></table>';
  const latest = RES.windows.slice().sort((a, b) => a.begin > b.begin ? -1 : 1).slice(0, 60);
  resHTML = latest.map(w => {
    const t3 = w.top.slice(0, 3);
    return `<article class="res" data-reg="${esc(regOf(w))}"><header><i>${esc(regOf(w))}</i><time datetime="${esc(w.begin)}">${esc(w.begin.slice(0, 10))}</time></header>` +
      `<h4>${esc(pretty(w.name))}</h4><ol>` + t3.map(x => `<li>${x.ids.map((id, i) => flag(x.c[i]) + esc(x.n[i] || x.epic[i] || '?')).join(' + ')}` +
      `<span>${x.pts} pts${x.usd ? ' · ' + money(x.usd) : ''}</span></li>`).join('') + '</ol></article>';
  }).join('');
}

// ---- Шапка: две вкладки сайта
const NAV = `<header class="top"><a class="logo" href="/"><img src="/logo.png" alt="" width="34" height="34">FNCS <span>DRAFT</span></a>
<nav class="tabs" aria-label="site"><a href="/">Career</a><a href="/competitive" aria-current="page" class="on">Competitive</a></nav></header>`;

const CSS = `@font-face{font-family:'Oswald';font-style:normal;font-weight:200 700;font-display:swap;src:url(/fonts/oswald-latin.woff2) format('woff2');unicode-range:U+0000-00FF,U+2000-206F;}
:root{--go:#ffdd00;--go-ink:#0b0f12;--panel:#161b22;--ink:#eef2f6;--dim:#8b98a8;--accent:#00c9a7;--line:#262e39;--hot:#ff4d5e;--font-display:'Oswald','Arial Narrow',Impact,sans-serif;}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%;background:#0b0e13}
body{margin:0;background:linear-gradient(180deg,#0d141a 0%,#0e1116 45%,#0b0e13 100%) fixed;color:var(--ink);font:15px/1.55 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;}
a{color:var(--accent)}
.wrap{max-width:1040px;margin:0 auto;padding:16px 16px 72px}
.top{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;border-bottom:1px solid var(--line);padding-bottom:12px;margin-bottom:20px}
.logo{display:flex;align-items:center;gap:8px;font:italic 700 22px var(--font-display);color:var(--ink);text-decoration:none;letter-spacing:.02em}
.logo span{color:var(--go)}
.tabs{display:flex;gap:4px;background:var(--panel);border:1px solid var(--line);border-radius:999px;padding:4px}
.tabs a{font:600 15px var(--font-display);letter-spacing:.06em;text-transform:uppercase;color:var(--ink);text-decoration:none;padding:8px 18px;border-radius:999px}
.tabs a.on{background:var(--go);color:var(--go-ink)}
h1,h2,h3,h4{font-family:var(--font-display);font-weight:600;letter-spacing:.03em;margin:0;line-height:1.15}
h1{font-size:clamp(30px,6vw,48px);text-transform:uppercase}
h2.sec{font-size:22px;text-transform:uppercase;letter-spacing:.05em;color:var(--accent);margin:34px 0 12px;display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
h2.sec small{font:400 13px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;color:var(--dim);letter-spacing:0;text-transform:none}
.lead{color:var(--dim);margin:6px 0 0}
.hero{margin-top:22px;background:linear-gradient(135deg,rgba(255,221,0,.10),rgba(0,201,167,.08));border:1px solid var(--line);border-radius:16px;padding:18px 18px 20px}
.hero .tag{display:inline-block;font:600 12px var(--font-display);letter-spacing:.1em;text-transform:uppercase;background:var(--hot);color:#fff;padding:3px 8px;border-radius:4px}
.hero h2{font-size:clamp(26px,5vw,38px);text-transform:uppercase;margin:8px 0 4px}
.hero .sub{color:var(--dim);margin:0 0 12px}
.when{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
.when li{background:rgba(11,15,18,.55);border:1px solid var(--line);border-radius:10px;padding:8px 10px;display:flex;flex-direction:column;gap:1px}
.when b{font:600 16px var(--font-display);letter-spacing:.05em}
.when time{font-size:13px}
.when span{font-size:12px;color:var(--dim)}
.when li.live{border-color:var(--hot)}
.cta{display:inline-block;background:var(--go);color:var(--go-ink);font:600 16px/1 var(--font-display);letter-spacing:.06em;text-transform:uppercase;padding:13px 22px 12px;text-decoration:none;transform:skewX(-8deg);margin-top:14px}
.cta span{display:inline-block;transform:skewX(8deg)}
.regs{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px}
.regs button{font:600 14px var(--font-display);letter-spacing:.06em;background:var(--panel);color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:7px 12px;cursor:pointer;min-height:38px}
.regs button[aria-pressed="true"]{background:var(--go);color:var(--go-ink);border-color:var(--go)}
.grid{display:grid;grid-template-columns:1.1fr .9fr;gap:22px;align-items:start}
@media(max-width:860px){.grid{grid-template-columns:1fr}}
.day h3{font-size:15px;text-transform:uppercase;letter-spacing:.08em;color:var(--dim);margin:14px 0 6px}
.day ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px}
.ev{display:grid;grid-template-columns:auto 40px 1fr auto;gap:8px;align-items:center;background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--line);border-radius:8px;padding:7px 10px;font-size:14px}
.ev time{font-variant-numeric:tabular-nums;font-weight:600;white-space:nowrap;min-width:46px}
.ev i,.res i{font:600 12px var(--font-display);font-style:normal;letter-spacing:.05em;color:var(--dim)}
.ev em{font-style:normal;font-size:11px;color:var(--dim);text-transform:uppercase;letter-spacing:.05em;white-space:nowrap}
.ev.k-fncs{border-left-color:var(--go)}.ev.k-fncs span{font-weight:700}
.ev.k-cash{border-left-color:var(--accent)}
.ev.k-ranked{border-left-color:#7d8cff}
.ev.live{border-color:var(--hot);box-shadow:0 0 0 1px rgba(255,77,94,.35)}
.ev.live em::before{content:'LIVE · ';color:var(--hot);font-weight:700}
.tbl{width:100%;border-collapse:collapse;font-size:14px}
.tbl th{text-align:left;font:500 12px var(--font-display);text-transform:uppercase;letter-spacing:.05em;color:var(--dim);padding:6px 8px;border-bottom:1px solid var(--line)}
.tbl td{padding:7px 8px;border-bottom:1px solid var(--line)}
.tbl .n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.tbl td img,.res img{vertical-align:-2px;margin-right:5px}
.p1{color:var(--go);font-weight:700}
.tbl tr.more,.tbl tr.hide{display:none}
.tbl.all tr.more:not(.hide){display:table-row}
.morebtn{margin-top:10px;background:none;border:1px solid var(--line);color:var(--ink);border-radius:8px;padding:8px 14px;cursor:pointer;font:600 14px var(--font-display);letter-spacing:.05em}
.results{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px}
.res{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:10px 12px}
.res header{display:flex;justify-content:space-between;font-size:12px;color:var(--dim)}
.res h4{font-size:16px;margin:4px 0 6px}
.res ol{margin:0;padding-left:18px;font-size:13px}
.res li{margin:2px 0}
.res li span{display:block;color:var(--dim);font-size:12px}
.res li:first-child{color:var(--go)}
.note{color:var(--dim);font-size:13px;margin:10px 0 0}
[hidden]{display:none!important}`;

const JS = `(function(){
var tz=(Intl.DateTimeFormat().resolvedOptions().timeZone||'');
var guess=/^Europe|^Africa/.test(tz)?'EU':/Sao_Paulo|Argentina|Santiago|Montevideo|Bogota|Lima|America\\/(Recife|Fortaleza|Bahia|Belem|Manaus)/.test(tz)?'BR':
 /Los_Angeles|Vancouver|Phoenix|Denver|Tijuana/.test(tz)?'NAW':/^America/.test(tz)?'NAC':/Australia|Auckland|Pacific/.test(tz)?'OCE':
 /Dubai|Riyadh|Qatar|Kuwait|Bahrain|Baghdad|Tehran|Muscat|Amman|Beirut|Jerusalem/.test(tz)?'ME':/^Asia/.test(tz)?'ASIA':'EU';
var saved=null; try{saved=localStorage.getItem('compReg');}catch(e){}
var reg=saved||guess;
var fmtT=new Intl.DateTimeFormat(undefined,{hour:'2-digit',minute:'2-digit'}), fmtD=new Intl.DateTimeFormat(undefined,{weekday:'long',day:'numeric',month:'long'});
var fmtDT=new Intl.DateTimeFormat(undefined,{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
var now=Date.now();
document.querySelectorAll('.ev').forEach(function(li){var t=Date.parse(li.dataset.t),e=Date.parse(li.dataset.end);
 li.querySelector('time').textContent=fmtT.format(t); if(e<now) li.remove(); else if(t<=now) li.classList.add('live');});
document.querySelectorAll('.when li').forEach(function(li){var t=Date.parse(li.dataset.t); li.querySelector('time').textContent=fmtDT.format(t);
 if(t<=now && now<t+3*3600e3) li.classList.add('live');});
document.querySelectorAll('.day').forEach(function(d){ if(!d.querySelector('.ev')) { d.remove(); return; }
 var h=d.querySelector('h3 time'); h.textContent=fmtD.format(Date.parse(d.dataset.day+'T12:00:00Z')); });
function apply(){
 document.querySelectorAll('.regs button').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.r===reg?'true':'false');});
 document.querySelectorAll('.ev,.res').forEach(function(x){x.hidden=reg!=='ALL'&&x.dataset.reg!==reg;});
 document.querySelectorAll('.day').forEach(function(d){d.hidden=!d.querySelector('.ev:not([hidden])');});
 var n=0; document.querySelectorAll('#earn tbody tr').forEach(function(tr){var on=reg==='ALL'||tr.dataset.reg===reg; tr.classList.toggle('hide',!on);
  if(on){n++; tr.classList.toggle('more',n>25); tr.firstChild.textContent=n;}});
 try{localStorage.setItem('compReg',reg);}catch(e){}
}
document.querySelectorAll('.regs button').forEach(function(b){b.addEventListener('click',function(){reg=b.dataset.r;apply();});});
var mb=document.querySelector('.morebtn'); if(mb) mb.addEventListener('click',function(){document.getElementById('earn').classList.add('all'); mb.remove();});
apply();
})();`;

const regButtons = '<div class="regs" role="group" aria-label="Region">' + ['ALL'].concat(REGS).map(r => `<button type="button" data-r="${r}">${r === 'ALL' ? 'All' : r}</button>`).join('') + '</div>';
const title = 'Fortnite Competitive: tournament calendar, prize money and results | FNCS Draft';
const desc = 'Every Fortnite tournament this week in your time zone, who earned the most prize money in ' + (monthName || 'the month') +
  ', the latest cup results and FNCS predictions. All regions.';
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}/competitive"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${SITE}/competitive"><meta property="og:type" content="website"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.ico"><style>${CSS}</style></head>
<body><div class="wrap">${NAV}
<h1>Competitive</h1>
<p class="lead">Fortnite tournaments in your time zone, prize money and results for every region. Updated with every site build.</p>
${heroHTML}
<h2 class="sec">This week <small>Times in your time zone. Live cups are marked.</small></h2>
${regButtons}
<div class="grid">
<section aria-label="Calendar">${calHTML || '<p class="note">No tournaments in the next two weeks.</p>'}</section>
<section aria-label="Prize money">
<h2 class="sec" style="margin-top:14px">Prize money · ${esc(monthName)} <small>${paid ? money(paid) + ' paid in cash cups and FNCS' : ''}</small></h2>
${earnHTML || '<p class="note">No paid cups yet this month.</p>'}
${earnHTML ? '<button class="morebtn" type="button">Show more</button>' : ''}
<p class="note">From Epic's own leaderboards and payout tables. Duos: each player gets the payout.</p>
</section></div>
<h2 class="sec">Latest results</h2>
<div class="results">${resHTML || '<p class="note">No results yet.</p>'}</div>
<p class="note">Calendar and leaderboards: Epic Games via <a href="https://eucompetitive.com" rel="noopener">eucompetitive.com</a>. Payout tables: Epic, via Fortnite Tracker.</p>
<a class="cta" href="/"><span>Play the FNCS career</span></a>
</div><script>${JS}</script></body></html>`;
fs.writeFileSync(path.join(OUT, 'competitive.html'), html, 'utf8');

// sitemap
const smPath = path.join(OUT, 'sitemap.xml');
if (fs.existsSync(smPath)) {
  let sm = fs.readFileSync(smPath, 'utf8');
  if (!sm.includes(SITE + '/competitive<')) sm = sm.replace('</urlset>', '<url><loc>' + SITE + '/competitive</loc><lastmod>' + new Date().toISOString().slice(0, 10) + '</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>\n</urlset>');
  fs.writeFileSync(smPath, sm, 'utf8');
}
console.log('competitive: /competitive (' + upcoming.length + ' окон в календаре, ' + (RES ? RES.windows.length : 0) + ' призовых окон, ' + Math.round(html.length / 1024) + ' КБ)');
