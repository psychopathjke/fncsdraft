// Writes the FNCS 2025 prize tables as index.html wants them.
//
// Source: Epic's own FNCS 2025 Official Rules, Attachment C "Event Prizes",
// https://www.fortnite.com/competitive/news/fncs-2025-official-rules — one
// table per region, applied to each of the three Majors. That last part is not
// an assumption: Liquipedia's Major 1 and Major 2 Europe pages both declare a
// prize pool of $816,000 and both list the same 25 payouts as the rules do.
//
// The ranges below are transcribed from that Attachment. Nothing is derived —
// no percentage of a pool, no scaling of one region off another — and each
// region's total is asserted against the pool Liquipedia declares for it. A
// transcription slip in any single number breaks the sum, which is the point.
const RANGES = {
  EU:   [[1,1,180000],[2,2,120000],[3,3,81000],[4,4,60900],[5,5,47850],
         [6,10,34800],[11,15,17400],[16,20,8700],[21,25,4350]],
  NAC:  [[1,1,180000],[2,2,76500],[3,3,51000],[4,4,35700],[5,5,28050],
         [6,10,20400],[11,15,10200],[16,20,5100],[21,25,2550]],
  NAW:  [[1,1,45000],[2,2,27000],[3,3,18000],[4,4,15300],[5,5,11700],
         [6,10,7200],[11,15,3600],[16,20,1800]],
  BR:   [[1,1,45000],[2,2,27000],[3,3,18000],[4,4,15300],[5,5,11700],
         [6,10,7200],[11,15,3600],[16,20,1800]],
  ASIA: [[1,1,27000],[2,2,13500],[3,3,9000],[4,4,7650],[5,5,5850],
         [6,10,3600],[11,15,1800]],
  ME:   [[1,1,27000],[2,2,13500],[3,3,9000],[4,4,7650],[5,5,5850],
         [6,10,3600],[11,15,1800]],
  OCE:  [[1,1,27000],[2,2,13500],[3,3,9000],[4,4,7650],[5,5,5850],
         [6,10,3600],[11,15,1800]]
};
// Prize pools as Liquipedia declares them on each region's Major pages.
const POOL = {EU:816000, NAC:562500, NAW:180000, BR:180000, ASIA:90000, ME:90000, OCE:90000};

const tables = {};
let bad = 0;
Object.keys(RANGES).forEach(reg => {
  const t = {};
  RANGES[reg].forEach(([from, to, usd]) => { for (let p = from; p <= to; p++) t[p] = usd; });
  const sum = Object.values(t).reduce((a, b) => a + b, 0);
  const ok = sum === POOL[reg];
  if (!ok) bad++;
  console.error(reg.padEnd(5), 'places', String(Object.keys(t).length).padStart(2),
                'sum', String(sum).padStart(7), 'pool', String(POOL[reg]).padStart(7),
                ok ? 'OK' : 'MISMATCH');
  tables[reg] = t;
});
if (bad) { console.error('\n' + bad + ' region(s) do not add up — fix the transcription before shipping it'); process.exit(1); }

console.log('const P2025_PRIZES=' + JSON.stringify(tables) + ';');
console.log('const PRIZE_TABLES_2025={t1:P2025_PRIZES, t2:P2025_PRIZES, t3:P2025_PRIZES};');
