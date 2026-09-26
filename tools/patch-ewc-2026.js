// Посадить в парижский ЛАН настоящие сорок пар (см. tools/build-ewc-2026.js).
//
// Правится одно место — ccRcField: вместо выдуманного броска по ростеру поле
// берётся из RC_TEAMS_2026 в порядке итогового места, а регион каждой пары
// приезжает вместе с ней (ccLanSeats кладёт его в summitRegion, и колонка
// «Регион» в таблице перестаёт врать). Если год не 2026-й или кого-то из пары
// нет в карточках — остаётся прежний бросок, поэтому старые годы не трогаются.
//
//   node tools/build-ewc-2026.js && node tools/patch-ewc-2026.js
const fs = require('fs'), path = require('path');
const FILE = path.join(path.resolve(__dirname, '..'), 'index.html');
const GEN = path.join(__dirname, '2026-ewc.generated.js');
const CRLF = String.fromCharCode(13) + String.fromCharCode(10), LF = String.fromCharCode(10);
let src = fs.readFileSync(FILE, 'utf8');
const WAS_CRLF = src.includes(CRLF);
if (WAS_CRLF) src = src.split(CRLF).join(LF);
if (src.includes('RC_TEAMS_2026')) { console.log('уже впаяно'); process.exit(0); }

const gen = fs.readFileSync(GEN, 'utf8').trim();
const anchor = 'function ccRcField(cr, worldCr, drafted, stage, teams){';
if (src.split(anchor).length - 1 !== 1) throw new Error('якорь ccRcField не один');

const block = gen + LF + LF +
'/* Настоящее поле Парижа: те же сорок пар, что приехали на Esports World Cup.\n' +
'\n' +
'   Отзыв игрока 26 сентября: ЛАН собирался людьми его же региона, а в жизни это\n' +
'   один мировой турнир на сорок дуо — двенадцать европейских, восемь из NA\n' +
'   Central, по четыре из остальных пяти регионов. Пары садятся тем же\n' +
'   ccLanSeats, что и Саммит с Глобалами, поэтому регион приезжает вместе с парой\n' +
'   и колонка «Регион» в таблице показывает её собственный, а не регион первой\n' +
'   карточки.\n' +
'\n' +
'   Кого нет в карточках — того пропускаем молча: список настоящий, а набор\n' +
'   карточек своего года, и пара из чужого года просто не находится. Если\n' +
'   осталось меньше половины, поле строится по-старому броском. */\n' +
'let CC_RC_REAL=null;\n' +
'function ccRcRealTeams(seated){\n' +
'  if(ccNowYear()!==2026) return null;\n' +
'  if(CC_RC_REAL) return CC_RC_REAL;\n' +
'  const rows=RC_TEAMS_2026.map(t=>({duo:t.d, reg:t.r}));\n' +
'  const built=ccLanSeats(rows, rows.length, null, seated||new Set());\n' +
'  CC_RC_REAL=(built.length>=RC_TEAMS_2026.length/2) ? built : null;\n' +
'  return CC_RC_REAL;\n' +
'}\n';

src = src.replace(anchor, block + anchor);

// Бросок заменяется на выборку из настоящего поля — стадии и срезы прежние.
const drawOld = '  const draw=(n, salt, skip)=>ccAsWorld(()=>careerCupField(worldCr,\n' +
                '      drafted.concat(skip||[]), n, salt, false, CC_FIELD_SHARP.globals));';
if (src.split(drawOld).length - 1 !== 1) throw new Error('якорь draw не один');
const drawNew = '  const mine=new Set((drafted||[]).map(c=>hKey(c)));\n' +
  '  const real=ccRcRealTeams(mine);\n' +
  '  /* Настоящие сорок пар идут в том порядке, в каком они закончили турнир:\n' +
  '     группа берёт верх списка, сёрвайвл и финал — следующих, мимо уже взятых.\n' +
  '     Без списка (не 2026-й или карточек не хватило) — прежний бросок. */\n' +
  '  const draw=(n, salt, skip)=>{\n' +
  '    if(real){\n' +
  '      const used=new Set((skip||[]).map(c=>hKey(c)));\n' +
  '      return real.filter(t=>!((t.squad||[]).some(c=>used.has(hKey(c))))).slice(0, n);\n' +
  '    }\n' +
  '    return ccAsWorld(()=>careerCupField(worldCr,\n' +
  '      drafted.concat(skip||[]), n, salt, false, CC_FIELD_SHARP.globals));\n' +
  '  };';
src = src.replace(drawOld, drawNew);

fs.writeFileSync(FILE, WAS_CRLF ? src.split(LF).join(CRLF) : src, 'utf8');
console.log('впаяно; index.html ' + (fs.statSync(FILE).size / 1048576).toFixed(2) + ' МБ');
