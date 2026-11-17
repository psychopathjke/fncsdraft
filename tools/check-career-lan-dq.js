// Снятие команды перед ЛАНом (ccLanDqRoll): место на Global Championship уходит следующей по таблице финала.
// 2024, финал Мейджора 1: ты на месте сразу под квотой. Со снятием место твоё и есть новость, без снятия места нет.
// Снятая команда не едет в зал (ccGcSimYear, ownOf). Жребий одинаковый при повторе (командная игра).
//   node tools/check-career-lan-dq.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const body = `
const out={};
const pl={nick:'Dq', age:18, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6, region:'EU', ovr:85, role:'roleIGL', attrs:ccRookieAttrs(85,'roleIGL'), ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null};
const seed=()=>{
  localStorage.setItem('fncsdraft_career', JSON.stringify({v:1, player:pl,
    career:{season:1, size:2, year:2024, year0:2024, day:null, division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'dq24'},
    partners:[], dev:{}, devV:2}));
  careerLoad(); CAREER.career.day='2024-04-01';
};
const q=ccGc24Seats(1);
const rows=[]; for(let i=0;i<q;i++) rows.push([{h:'TeamA'+i},{h:'TeamB'+i}]); rows.push('you'); for(let i=0;i<10;i++) rows.push([{h:'Low'+i},{h:'Lower'+i}]);
out.quota=q;
seed(); CC_LAN_DQ_ODDS=1; ccGcKeepFinal(2024, 1, rows.slice());
const k1=CAREER.career.gfKeep['2024|1'];
out.withDq={dq:k1.dq, seat:ccLanDqSeatYou(2024, 1), news:(CAREER.career.news||[]).map(n=>n.k)};
const again=JSON.stringify(k1.dq); delete k1.dq; ccLanDqRoll(2024, 1); out.same=JSON.stringify(CAREER.career.gfKeep['2024|1'].dq)===again;
seed(); CC_LAN_DQ_ODDS=0; ccGcKeepFinal(2024, 1, rows.slice());
out.noDq={dq:CAREER.career.gfKeep['2024|1'].dq, seat:ccLanDqSeatYou(2024, 1), news:(CAREER.career.news||[]).map(n=>n.k)};
CC_LAN_DQ_ODDS=0.12;
return out;`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'landq-'));
const probe = path.join(dir, 'probe.js');
fs.writeFileSync(probe, body);
let txt = '';
try { txt = execFileSync('node', [path.join(__dirname, 'probe-run.js'), probe, '300000'], { encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] }); }
finally { fs.rmSync(dir, { recursive: true, force: true }); }
let r; try { r = JSON.parse(txt.slice(txt.indexOf('{'))); } catch (e) { console.log('FAIL проба не вернула JSON: ' + txt.slice(0, 300)); process.exit(2); }
const fails = [];
if (r.err) fails.push('ошибка: ' + r.err);
else {
  if (!r.withDq.dq || !r.withDq.dq.you) fails.push('со снятием место не перешло к игроку: ' + JSON.stringify(r.withDq.dq));
  if (r.withDq.seat !== true) fails.push('со снятием ccLanDqSeatYou не true');
  if (!r.withDq.news.includes('ccNewsDqSeat')) fails.push('нет новости ccNewsDqSeat: ' + r.withDq.news.join(','));
  if (!r.same) fails.push('жребий снятия не повторяется');
  if (r.noDq.dq !== null) fails.push('без шанса кого-то сняли');
  if (r.noDq.seat !== false) fails.push('без снятия игрок под квотой получил место');
  if (r.noDq.news.some(k => /ccNewsDq/.test(k))) fails.push('без снятия есть новость о снятии');
}
if (fails.length) { fails.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
console.log('OK снятие команды отдаёт место следующей (квота ' + r.quota + ', ты ' + (r.quota + 1) + '-й), без снятия места нет');
