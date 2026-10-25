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
const heroHTML = finalsLive ? `<section class="glass hero">
  <span class="tag">Next up · Finals</span>
  <h2>FNCS Solos 2026 Finals</h2>
  <p class="sub">The first solo FNCS in years. 100 players per region, two days, six games a night.</p>
  <ul class="when">${finals.map(f => {
    const fav = PRED && PRED.regions[f.reg] && PRED.regions[f.reg][0];
    return `<li data-t="${esc(f.begin)}"><b>${esc(f.reg)}</b><time datetime="${esc(f.begin)}">${esc(f.begin.slice(5, 16).replace('T', ' '))} UTC</time>` +
      (fav ? `<span>Fav: ${esc(fav.n)} ${Math.round(fav.win * 100)}%</span>` : '') + '</li>';
  }).join('')}</ul>
  <a class="btn" href="/predict/fncs-solos-2026">Win chances and drop maps</a>
</section>` : '';

// Окна, которых у eucompetitive нет (26.10: их сезон S43 пуст, а FNCS Solos Reload с 3 ноября уже в календаре Tracker) —
// из comp-calendar-tracker.json (imp_calendar страниц fortnitetracker.com/events, снят Playwright'ом). Конца окна Tracker
// не даёт — три часа от начала, как у обычного капа.
const TRK = read('comp-calendar-tracker.json');
if (TRK) {
  const have = new Set(CAL.events.map(e => e.w));
  TRK.windows.forEach(x => {
    if (!x.w || have.has(x.w)) return;
    const reg = String(x.w).split('_').pop();
    CAL.events.push({ w: x.w, ev: x.ev, name: x.title + (x.sub ? ' · ' + x.sub : ''), region: reg, begin: x.begin.replace('+00:00', 'Z'),
      end: new Date(Date.parse(x.begin) + 3 * 3600e3).toISOString(), status: 'tracker', pretty: true });
  });
}

// ---- Календарь как в карьере (26.10, его «календарь в виде календаря как в карьере»): сетка месяца с понедельника,
// в клетке — плашки серий дня цветом вида, у дня FNCS — обложка; клик по дню — список окон с временем зрителя.
// В страницу едет только сам список окон с начала прошлого месяца (строки — таблицей, окна — массивами).
const from = new Date(NOW); from.setUTCDate(1); from.setUTCMonth(from.getUTCMonth() - 1); from.setUTCHours(0, 0, 0, 0);
const upcoming = CAL.events.filter(e => Date.parse(e.begin) >= from.getTime() && REGS.includes(regOf(e)))
  .sort((a, b) => a.begin < b.begin ? -1 : a.begin > b.begin ? 1 : 0);
const series = n => n.replace(/ · (Week|Round|Session|Heat) \d+/g, '').replace(/ · Qualifier \d+ ·/g, ' ·').replace(/ · (Day \d+ )?Round \d+$/, '').trim();
const STR = [], strIx = new Map();
const sid = v => { if (!strIx.has(v)) { strIx.set(v, STR.length); STR.push(v); } return strIx.get(v); };
const KINDS = ['fncs', 'cash', 'ranked', 'other'];
// Обложка дня (26.10, его «добавь логотипы в календаре и пусть высший кап показывает»): плитка Epic самого старшего
// окна дня (tools/fetch-comp-art.js кладёт их в art/comp). У окон без своей картинки (ноябрь с Tracker) — плитка той же
// серии (id события без сезона и региона), у FNCS без неё — общая плитка FNCS.
const artFile = u => 'art/comp/' + String(u).split('/').pop().split('?')[0].replace(/^[0-9a-f]{8}-/, '').replace(/\.(png|jpeg)$/i, '.jpg');
const hasArt = u => u && fs.existsSync(path.join(__dirname, '..', artFile(u)));
const famOf = ev => String(ev || '').replace(/^epicgames_S\d+_/, '').replace(/_(EU|NAC|NAW|BR|ASIA|ME|OCE)$/, '').replace(/(Reload)?(Qualifiers|_HeatsStage|_LastChanceQualifier|_Final|FastTracks)$/, '');
const famArt = new Map();
CAL.events.forEach(e => { if (hasArt(e.img) && !famArt.has(famOf(e.ev))) famArt.set(famOf(e.ev), '/' + artFile(e.img)); });
const fncsArt = [...CAL.events].reverse().find(e => /FNCSSolo/.test(e.w) && hasArt(e.img));
const artOf = e => hasArt(e.img) ? '/' + artFile(e.img) : famArt.get(famOf(e.ev)) || (kind(e.w) === 'fncs' && fncsArt ? '/' + artFile(fncsArt.img) : '');
// Старшинство окна дня: финал FNCS, остальной FNCS, призовые серии (Performance, Nick Eh 30), кэш-капы, ranked, прочее.
const rankOf = (e, nm) => kind(e.w) === 'fncs' ? (/Final/.test(nm) ? 100 : 80) : /PerformanceEvaluation|NickEh30/.test(e.w) ? 60 : kind(e.w) === 'cash' ? 50 : kind(e.w) === 'ranked' ? 30 : 10;
const ART = {};
const CALDATA = upcoming.map(e => {
  const nm = e.pretty ? e.name : pretty(e.name);
  return [Math.round(Date.parse(e.begin) / 60000), Math.round(Date.parse(e.end || e.begin) / 60000), REGS.indexOf(regOf(e)), KINDS.indexOf(kind(e.w)), sid(series(nm)), sid(nm), sid(artOf(e)), rankOf(e, nm)];
});

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
    top.slice(0, 300).map((p, i) => `<tr data-reg="${esc(p.reg)}"${i >= 15 ? ' class="more"' : ''}><td class="n">${i + 1}</td><td>${flag(p.c)}<b>${esc(p.n)}</b></td><td>${esc(p.reg)}</td>` +
      `<td class="n">${p.cups}</td><td class="n">${p.wins || ''}</td><td class="n p1">${money(p.usd)}</td></tr>`).join('') + '</tbody></table>';
  const latest = RES.windows.slice().sort((a, b) => a.begin > b.begin ? -1 : 1).slice(0, 60);
  resHTML = latest.map(w => {
    const t3 = w.top.slice(0, 3);
    return `<article class="glass res" data-reg="${esc(regOf(w))}"><header><i>${esc(regOf(w))}</i><time datetime="${esc(w.begin)}">${esc(w.begin.slice(0, 10))}</time></header>` +
      `<h4>${esc(pretty(w.name))}</h4><ol>` + t3.map(x => `<li><div>${x.ids.map((id, i) => flag(x.c[i]) + esc(x.n[i] || x.epic[i] || '?')).join(' + ')}</div>` +
      `<span>${x.pts} pts${x.usd ? ' · ' + money(x.usd) : ''}</span></li>`).join('') + '</ol></article>';
  }).join('');
}

// ---- Шапка как у главной (26.10, его «сделай дизайн компетитив как главный экран»): логотип, пилюли навбара.
const NAV = `<header class="top"><a class="logo" href="/"><img src="/logo.png" alt="" width="40" height="40"><b><i>FNCS</i> DRAFT</b></a>
<nav class="site-nav" aria-label="site"><a class="nav-pill" href="/">Career</a><a class="nav-pill on" href="/competitive" aria-current="page">Competitive</a></nav></header>`;

// Синее стекло главной: фон #0b1640 с подсветкой, панели-градиенты с лучами, Fira Sans Extra Condensed в заголовках,
// пилюли навбара, жёлтая кнопка со «ступенькой», заголовки разделов — разделитель меню Fortnite (линии по бокам).
const CSS = `@font-face{font-family:'Fira Sans Extra Condensed';font-style:normal;font-weight:700;font-display:swap;src:url(/fonts/fira-xc-700-latin.woff2) format('woff2');unicode-range:U+0000-00FF,U+2000-206F;}
@font-face{font-family:'Fira Sans Extra Condensed';font-style:normal;font-weight:900;font-display:swap;src:url(/fonts/fira-xc-900-latin.woff2) format('woff2');unicode-range:U+0000-00FF,U+2000-206F;}
:root{--go:#ffdd00;--go-ink:#0b0f12;--ink:#eaf0ff;--dim:#b7c3e6;--dimmer:#8fa0cc;--cyan:#9fe1ff;--lime:#d7ff3a;--hot:#ff4d5e;
  --line:rgba(180,200,255,.2);--row:rgba(126,150,224,.18);--row-h:rgba(150,180,255,.3);--r:16px;--r-sm:10px;
  --font-display:'Fira Sans Extra Condensed','Oswald','Arial Narrow',Impact,sans-serif;}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;background:#0b1640}
body{margin:0;color:var(--ink);font:15px/1.55 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background-color:#0b1640;
  background-image:radial-gradient(900px 520px at 12% -6%,rgba(60,100,220,.5),rgba(60,100,220,0)),radial-gradient(700px 480px at 92% 8%,rgba(150,180,255,.3),rgba(150,180,255,0)),
  radial-gradient(1100px 700px at 50% 110%,rgba(30,50,140,.6),rgba(30,50,140,0));background-attachment:fixed;min-height:100vh}
a{color:var(--cyan)}
.wrap{max-width:1320px;margin:0 auto;padding:18px 20px 80px}
.top{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;border-bottom:2px solid rgba(180,200,255,.15);padding-bottom:14px;margin-bottom:22px}
.logo{display:flex;align-items:center;gap:10px;text-decoration:none;color:#fff}
.logo b{font:italic 900 30px/1 var(--font-display);letter-spacing:-.01em;text-transform:uppercase}
.logo i{font-style:inherit;background:linear-gradient(180deg,#e9fbff 0%,#9fe1ff 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.site-nav{display:flex;gap:4px}
.nav-pill{font:600 15px var(--font-display);letter-spacing:.06em;text-transform:uppercase;color:#e6ecff;text-decoration:none;padding:8px 16px;border-radius:999px;white-space:nowrap}
.nav-pill:hover{background:rgba(255,255,255,.12);outline:3px solid rgba(255,255,255,.92)}
.nav-pill.on{background:#e4ebf7;color:#0b1a3a}
h1,h2,h3,h4{font-family:var(--font-display);font-weight:700;margin:0;line-height:1.08}
.glass{position:relative;overflow:hidden;border-radius:var(--r);background:linear-gradient(160deg,#1d3b8c 0%,#13265f 46%,#0b1640 100%);box-shadow:inset 0 0 0 1px rgba(180,200,255,.18)}
.glass>*{position:relative}
.head{padding:26px 28px}
.head h1{font-size:clamp(38px,6vw,64px);font-weight:900;font-style:italic;text-transform:uppercase;letter-spacing:-.01em}
.head p{color:#c9d5f0;margin:8px 0 0;max-width:640px}
.hero{margin-top:16px;padding:24px 28px 26px}
.tag{display:inline-block;font-size:11px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:#0b1a3a;background:var(--lime);padding:3px 9px;border-radius:999px}
.hero h2{font-size:clamp(30px,5vw,48px);font-style:italic;font-weight:900;text-transform:uppercase;margin:10px 0 4px}
.hero .sub{color:#c9d5f0;margin:0 0 16px}
.when{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
.when li{background:var(--row);border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:2px}
.when b{font:700 20px var(--font-display);letter-spacing:.04em}
.when time{font-size:13px;color:#fff}
.when span{font-size:12px;color:var(--dim)}
.when li.live{box-shadow:inset 0 0 0 2px var(--hot)}
.btn{display:inline-block;font:700 18px/1 var(--font-display);letter-spacing:.04em;text-transform:uppercase;text-decoration:none;border-radius:10px;padding:13px 28px 12px;margin-top:18px;
  background:var(--go);color:var(--go-ink);box-shadow:0 4px 0 #b59c00,0 8px 18px rgba(0,0,0,.35)}
.btn:hover{transform:translateY(-1px);filter:brightness(1.06)}
.btn:active{transform:translateY(2px);box-shadow:0 2px 0 #b59c00,0 4px 10px rgba(0,0,0,.35)}
.sec{display:flex;align-items:center;gap:12px;font:700 20px var(--font-display);letter-spacing:.08em;text-transform:uppercase;color:#fff;margin:34px 0 14px}
.sec::before,.sec::after{content:'';flex:1;height:2px;background:rgba(255,255,255,.35)}
.sec::before{flex:0 0 24px}
.sec small{font:400 13px/1.3 -apple-system,Segoe UI,Roboto,sans-serif;letter-spacing:0;text-transform:none;color:var(--dim);order:3}
.regs{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 14px}
.regs button{font:700 15px var(--font-display);letter-spacing:.05em;color:#fff;background:rgba(150,180,255,.18);border:none;border-radius:999px;padding:8px 16px;cursor:pointer;min-height:38px}
.regs button:hover{background:rgba(150,180,255,.32)}
.regs button[aria-pressed="true"]{background:#e4ebf7;color:#0b1a3a}
/* Календарь и призовые рядом (26.10, его «пусть рядом с календарем будет лидерборд с призовыми»); уже 1100 — друг под другом. */
.grid{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(300px,1fr);gap:18px;align-items:start}
@media(max-width:1100px){.grid{grid-template-columns:1fr}}
#earn th:nth-child(3),#earn td:nth-child(3){display:none}
.grid #earn{font-size:13px}.grid #earn td{padding:7px 8px}

.panel{padding:16px 18px 18px}
.panel>h3{font:700 18px var(--font-display);letter-spacing:.08em;text-transform:uppercase;margin:0 0 4px}
.panel>p.small{color:var(--dim);font-size:13px;margin:0 0 10px}
.day h4{font:700 14px var(--font-display);letter-spacing:.1em;text-transform:uppercase;color:var(--cyan);margin:14px 0 6px}
.day:first-child h4{margin-top:4px}
.day ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:5px}
.ev{display:grid;grid-template-columns:auto 38px 1fr auto;gap:10px;align-items:center;background:var(--row);border-radius:12px;padding:9px 12px;font-size:14px;border-left:4px solid transparent}
.ev:hover{background:var(--row-h)}
.ev time{font:700 16px var(--font-display);font-variant-numeric:tabular-nums;white-space:nowrap;min-width:46px;color:#fff}
.ev i,.res i{font:700 12px var(--font-display);font-style:normal;letter-spacing:.06em;color:var(--dim)}
.ev em{font-style:normal;font:700 11px var(--font-display);letter-spacing:.08em;text-transform:uppercase;color:#0b1a3a;background:rgba(228,235,247,.85);border-radius:999px;padding:2px 8px;white-space:nowrap}
.ev.k-fncs{border-left-color:var(--go)}.ev.k-fncs span{font-weight:700;color:#fff}.ev.k-fncs em{background:var(--go)}
.ev.k-cash{border-left-color:var(--lime)}.ev.k-cash em{background:var(--lime)}
.ev.k-ranked{border-left-color:var(--cyan)}.ev.k-ranked em{background:var(--cyan)}
.ev.live{box-shadow:inset 0 0 0 2px var(--hot)}
.ev.live em{background:var(--hot);color:#fff}.ev.live em::before{content:'LIVE · '}
.tbl{width:100%;border-collapse:separate;border-spacing:0 4px;font-size:14px}
.tbl th{text-align:left;font:700 12px var(--font-display);text-transform:uppercase;letter-spacing:.08em;color:var(--dimmer);padding:2px 10px}
.tbl td{padding:8px 10px;background:var(--row)}
.tbl td:first-child{border-radius:10px 0 0 10px}.tbl td:last-child{border-radius:0 10px 10px 0}
.tbl tr:hover td{background:var(--row-h)}
.tbl .n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.tbl td img,.res img{vertical-align:-2px;margin-right:6px}
.tbl tbody tr:nth-child(-n+3):not(.hide) td:first-child{color:var(--go);font-weight:900}
.p1{color:var(--go);font:700 16px var(--font-display);letter-spacing:.02em}
.tbl tr.more,.tbl tr.hide{display:none}
.tbl.all tr.more:not(.hide){display:table-row}
.morebtn{margin-top:8px;font:700 15px var(--font-display);letter-spacing:.06em;text-transform:uppercase;color:#fff;background:rgba(150,180,255,.22);border:none;border-radius:10px;padding:10px 18px;cursor:pointer}
.morebtn:hover{background:rgba(150,180,255,.36)}
.results{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
.res{padding:14px 16px}
.res header{display:flex;justify-content:space-between;font-size:12px;color:var(--dim)}
.res h4{font-size:19px;margin:6px 0 8px;text-transform:uppercase;letter-spacing:.02em}
.res ol{margin:0;padding:0;list-style:none;font-size:14px;counter-reset:p}
.res li{counter-increment:p;display:grid;grid-template-columns:22px 1fr;column-gap:4px;padding:5px 0;border-top:1px solid rgba(180,200,255,.12)}
.res li::before{content:counter(p);font:900 16px var(--font-display);color:var(--dim);grid-row:span 2}
.res li:first-child::before{color:var(--go)}
.res li span{color:var(--dim);font-size:12px}
.note{color:var(--dimmer);font-size:13px;margin:12px 0 0}
.foot{margin-top:34px;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}
@media(max-width:620px){.wrap{padding:14px 14px 64px}.head,.hero{padding:20px 18px}.logo b{font-size:24px}.nav-pill{padding:7px 12px;font-size:14px}
  .ev{grid-template-columns:auto 34px 1fr;row-gap:2px}.ev em{grid-column:3;justify-self:start}}
.cal-bar{display:flex;align-items:center;gap:8px;margin:6px 0 10px}
.cal-bar h4{font:italic 900 24px var(--font-display);text-transform:uppercase;margin:0 4px;min-width:0}
.cal-nav{width:38px;height:36px;border:none;border-radius:10px;background:#fff;color:#0b0f12;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;padding:0}
.cal-nav svg{width:16px;height:16px;fill:currentColor}
.cal-nav:hover{background:var(--go)}
.cal-nav:disabled{background:rgba(255,255,255,.14);color:var(--dimmer);cursor:default}
.cal-today{margin-left:auto;border:none;border-radius:10px;background:#fff;color:#0b0f12;font:700 14px var(--font-display);letter-spacing:.06em;text-transform:uppercase;padding:10px 16px;cursor:pointer}
.cal-today:hover{background:var(--go)}
.cal-dow,.cal-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px}
.cal-dow span{font:700 11px var(--font-display);letter-spacing:.08em;text-transform:uppercase;color:#8094c4;text-align:center;padding:2px 0 4px}
.cal-day{position:relative;aspect-ratio:4/3;min-width:0;border:none;border-radius:8px;background:rgba(255,255,255,.045);padding:5px;display:flex;flex-direction:column;gap:3px;overflow:hidden;
  text-align:left;color:inherit;font:inherit;cursor:pointer;background-size:cover;background-position:center}
.cal-void{background:none;cursor:default}
.cal-day.has{background-color:rgba(255,255,255,.1);box-shadow:inset 0 0 0 1px rgba(150,185,255,.22)}
.cal-day.art{justify-content:flex-end}
.cal-day.art::before{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,12,32,.15) 0%,rgba(8,12,32,.35) 45%,rgba(8,12,32,.9) 100%)}
.cal-day.art .cal-n{position:absolute;top:6px;left:7px}
.cal-day.r100{box-shadow:inset 0 0 0 2px var(--go)}
.cal-top{display:block;font:700 12px/1.2 var(--font-display);letter-spacing:.02em;padding:3px 6px;border-radius:4px;color:#0b1a3a;background:rgba(228,235,247,.92);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cal-top.k-fncs{background:var(--go)}.cal-top.k-cash{background:var(--lime)}.cal-top.k-ranked{background:var(--cyan)}
.cal-day>*{position:relative}
.cal-day:not(.cal-void):hover{box-shadow:inset 0 0 0 2px var(--cyan)}
.cal-day.now{box-shadow:inset 0 0 0 2px #35e0ff;background-color:rgba(53,224,255,.13)}
.cal-day.picked{box-shadow:inset 0 0 0 2px var(--go)}
.cal-day.past{opacity:.55}
.cal-day.live .cal-n::after{content:' LIVE';color:var(--hot);font-size:9px;letter-spacing:.06em}
.cal-n{font:900 13px/1 var(--font-display);color:#6d7fae}
.cal-day.has .cal-n,.cal-day.art .cal-n{color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.8)}
.cal-ev{display:block;font:700 12px/1.25 var(--font-display);letter-spacing:.02em;padding:2px 4px;border-radius:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#0b1a3a;background:rgba(228,235,247,.9)}
.cal-ev.k-fncs{background:var(--go)}.cal-ev.k-cash{background:var(--lime)}.cal-ev.k-ranked{background:var(--cyan)}
.cal-more{font:700 11px var(--font-display);color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.8);letter-spacing:.03em}
.calday{margin-top:14px}
.calday h4{font:700 15px var(--font-display);letter-spacing:.1em;text-transform:uppercase;color:var(--cyan);margin:0 0 8px}
.calday ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:5px}
.ev.done{opacity:.5}
@media(max-width:620px){#earn th:nth-child(3),#earn td:nth-child(3),#earn th:nth-child(5),#earn td:nth-child(5){display:none}.tbl td{padding:8px 7px}.cal-day{padding:3px;aspect-ratio:auto;min-height:46px}.cal-top{font-size:0;height:5px;padding:0;border-radius:2px}.cal-more{display:none}.cal-bar h4{font-size:19px}}
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
document.querySelectorAll('.when li').forEach(function(li){var t=Date.parse(li.dataset.t); li.querySelector('time').textContent=fmtDT.format(t);
 if(t<=now && now<t+3*3600e3) li.classList.add('live');});
var D=${JSON.stringify(CALDATA)},S=${JSON.stringify(STR)},R=${JSON.stringify(REGS)},K=${JSON.stringify(KINDS)},KL=${JSON.stringify(KINDS.map(k => KIND[k]))},ART=${JSON.stringify(ART)};
var DOW=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
var fmtM=new Intl.DateTimeFormat(undefined,{month:'long',year:'numeric'});
function dk(d){return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();}
var today=new Date(), cur={y:today.getFullYear(),m:today.getMonth()}, pick=dk(today);
var first=D.length?new Date(D[0][0]*60000):today, last=D.length?new Date(D[D.length-1][0]*60000):today;
function byDay(){var m={}; D.forEach(function(e){ if(reg!=='ALL'&&R[e[2]]!==reg) return; var k=dk(new Date(e[0]*60000)); (m[k]=m[k]||[]).push(e);}); return m;}
function esc(x){return String(x).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function renderCal(){
 var by=byDay(), y=cur.y, m=cur.m, days=new Date(y,m+1,0).getDate(), lead=(new Date(y,m,1).getDay()+6)%7;
 var atStart=y*12+m<=first.getFullYear()*12+first.getMonth(), atEnd=y*12+m>=last.getFullYear()*12+last.getMonth();
 var h='<div class="cal-bar"><button class="cal-nav" data-d="-1" aria-label="Previous month"'+(atStart?' disabled':'')+'><svg viewBox="0 0 16 16"><path d="M10.5 2.5L5 8l5.5 5.5 1.5-1.5-4-4 4-4z"/></svg></button>'+
  '<h4>'+esc(fmtM.format(new Date(y,m,1)))+'</h4><button class="cal-nav" data-d="1" aria-label="Next month"'+(atEnd?' disabled':'')+'><svg viewBox="0 0 16 16"><path d="M5.5 2.5L11 8l-5.5 5.5L4 12l4-4-4-4z"/></svg></button>'+
  '<button class="cal-today">Today</button></div><div class="cal-dow">'+DOW.map(function(d){return '<span>'+d+'</span>';}).join('')+'</div><div class="cal-grid">';
 for(var i=0;i<lead;i++) h+='<div class="cal-day cal-void"></div>';
 for(var d=1;d<=days;d++){
  var k=y+'-'+(m+1)+'-'+d, list=by[k]||[], seen={}, chips=[], fncs=false;
  list.forEach(function(e){ if(seen[e[4]]) return; seen[e[4]]=1; chips.push(e); });
  chips.sort(function(a,b){return b[7]-a[7];});
  var top=chips[0], img=top?S[top[6]]:'';
  var past=new Date(y,m,d+1)<today, live=list.some(function(e){return e[0]*60000<=now&&now<e[1]*60000;});
  h+='<button class="cal-day'+(list.length?' has':'')+(img?' art':'')+(top?' r'+top[7]:'')+(k===dk(today)?' now':'')+(k===pick?' picked':'')+(past?' past':'')+(live?' live':'')+'" data-k="'+k+'"'+
   (img?' style="background-image:url('+img+')"':'')+'><span class="cal-n">'+d+'</span>'+
   (top?'<span class="cal-top k-'+K[top[3]]+'">'+esc(S[top[4]])+'</span>':'')+
   (chips.length>1?'<span class="cal-more">+'+(chips.length-1)+' more</span>':'')+'</button>';
 }
 h+='</div>';
 var el=document.getElementById('cal'); el.innerHTML=h;
 el.querySelectorAll('.cal-nav').forEach(function(b){b.onclick=function(){var t=new Date(cur.y,cur.m+(+b.dataset.d),1); cur={y:t.getFullYear(),m:t.getMonth()}; renderCal();};});
 el.querySelector('.cal-today').onclick=function(){cur={y:today.getFullYear(),m:today.getMonth()}; pick=dk(today); renderCal();};
 el.querySelectorAll('.cal-day:not(.cal-void)').forEach(function(b){b.onclick=function(){pick=b.dataset.k; renderCal();};});
 renderDay(by);
}
function renderDay(by){
 var p=pick.split('-'), list=(by[pick]||[]).slice().sort(function(a,b){return a[0]-b[0];}), el=document.getElementById('calDay');
 el.innerHTML='<h4>'+esc(fmtD.format(new Date(+p[0],p[1]-1,+p[2])))+'</h4>'+(list.length?'<ul>'+list.map(function(e){
  var t=e[0]*60000, end=e[1]*60000, cls='ev k-'+K[e[3]]+(t<=now&&now<end?' live':'')+(end<now?' done':'');
  return '<li class="'+cls+'"><time>'+fmtT.format(t)+'</time><i>'+R[e[2]]+'</i><span>'+esc(S[e[5]])+'</span><em>'+KL[e[3]]+'</em></li>';
 }).join('')+'</ul>':'<p class="note">No cups on this day'+(reg==='ALL'?'':' in '+reg)+'.</p>');
}
function apply(){
 document.querySelectorAll('.regs button').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.r===reg?'true':'false');});
 document.querySelectorAll('.res').forEach(function(x){x.hidden=reg!=='ALL'&&x.dataset.reg!==reg;});
 renderCal();
 var n=0; document.querySelectorAll('#earn tbody tr').forEach(function(tr){var on=reg==='ALL'||tr.dataset.reg===reg; tr.classList.toggle('hide',!on);
  if(on){n++; tr.classList.toggle('more',n>15); tr.firstChild.textContent=n;}});
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
<section class="glass head"><h1>Competitive</h1>
<p>Fortnite tournaments in your time zone, prize money and results for every region. Updated with every site build.</p></section>
${heroHTML}
<h2 class="sec">Region</h2>
${regButtons}
<div class="grid">
<section class="glass panel" aria-label="Calendar"><h3>Calendar</h3><p class="small">In your time zone. Pick a day to see every cup on it.</p>
<div id="cal" class="cal"></div><div id="calDay" class="calday"></div></section>
<section class="glass panel" aria-label="Prize money"><h3>Prize money · ${esc(monthName)}</h3>
<p class="small">${paid ? money(paid) + ' paid in cash cups and FNCS so far. ' : ''}Duos: each player gets the payout.</p>
${earnHTML || '<p class="note">No paid cups yet this month.</p>'}
${earnHTML ? '<button class="morebtn" type="button">Show more</button>' : ''}
</section></div>
<h2 class="sec">Latest results</h2>
<div class="results">${resHTML || '<p class="note">No results yet.</p>'}</div>
<div class="foot"><p class="note">Calendar and leaderboards: Epic Games via <a href="https://eucompetitive.com" rel="noopener">eucompetitive.com</a> and Fortnite Tracker. Payout tables: Epic, via Fortnite Tracker.</p>
<a class="btn" href="/">Play the FNCS career</a></div>
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
