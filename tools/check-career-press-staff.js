// Ответы стаффу (17.10) и подписчики с пресс-конференции: варианты открываются после реплики стаффа,
// эффект раз в день, единица подписчиков с ответа на пресс-конференции — 0.15% охвата (не 1%).
//   node tools/check-career-press-staff.js
const path = require('path'), { execFileSync } = require('child_process');
const out = JSON.parse(execFileSync(process.execPath, [path.join(__dirname, 'probe-run.js'), path.join(__dirname, 'probes', 'press-staff.js'), '90000'],
  { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 26 }));
const fails = [];
const check = (n, ok, d) => { if (!ok) fails.push(n + (d != null ? ': ' + JSON.stringify(d) : '')); };
if (out.err) fails.push(out.err);
else {
  check('после реплики стаффа открыт вопрос', out.ask && out.ask.key, out.ask);
  check('три ответа и кнопка штаба', out.btns.length === 4, out.btns);
  check('разговор с психологом: форма +0.1, усталость −1, вопрос закрыт', out.after.form > 0.09 && out.after.grind === -1 && !out.after.ask, out.after);
  check('ответ и реплика стаффа в ветке', out.thread.length === 3 && /^you:/.test(out.thread[1]) && /^them:/.test(out.thread[2]), out.thread);
  check('эффект — раз в день', out.second === 0, out.second);
  check('у Кинча тоже есть ответы', out.kinchAsk);
  check('клип от SMM даёт немного охвата (0.6% от 20k)', out.smmReach > 0 && out.smmReach <= 150, out.smmReach);
  check('пресс-конференция: единица 0.15% охвата', Math.abs(out.pressUnit - 30.36) < 1, out.pressUnit);
}
if (fails.length) { fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('ответы стаффу и подписчики с пресс-конференции в порядке');
