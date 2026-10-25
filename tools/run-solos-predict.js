// Прогон прогноза финала FNCS Solos 2026: финалисты из tools/measured/solos-2026-final.json (выгрузки Epic с Tracker),
// каждый финал региона играется движком игры N раз (tools/probes/solos-predict-body.js) → tools/measured/solos-2026-predict.json,
// из которого build-solos-predict.js собирает /predict/fncs-solos-2026.
//   node tools/run-solos-predict.js [N=200] [регионы через запятую]
const fs=require('fs'), os=require('os'), path=require('path'); const {execFileSync}=require('child_process');
const N=+(process.argv[2]||200), REGS=(process.argv[3]||'EU,NAC,NAW,BR,ASIA,ME,OCE').split(',');
const DROPS=path.join(__dirname,'measured','solos-2026-drops.json');
const data=fs.readFileSync(path.join(__dirname,'measured','solos-2026-final.json'),'utf8');
const body=fs.readFileSync(path.join(__dirname,'probes','solos-predict-body.js'),'utf8')
  .replace('__DATA__', data).replace('__REGS__', JSON.stringify(REGS)).replace('__N__', String(N))
  // Настоящие дропы с eucompetitive (fetch-solos-drops.js); нет файла — все регионы на точках движка.
  .replace('__DROPS__', fs.existsSync(DROPS) ? fs.readFileSync(DROPS,'utf8') : '{}');
const tmp=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'spred-')),'body.js'); fs.writeFileSync(tmp, body);
const o=JSON.parse(execFileSync(process.execPath,[path.join(__dirname,'probe-run.js'), tmp, String(N*7*7500+600000)],{encoding:'utf8',maxBuffer:1<<28,stdio:['ignore','pipe','ignore']}));
if(o.err) throw new Error(o.err);
const out={event:'FNCS Solos 2026 Finals', harvested:JSON.parse(data).harvested, runs:N, set:o.set, mapImg:'art/map-s42.jpg', mapAspect:'921/843', zoneRects:o.zoneRects, realRects:o.realRects||{}, regions:o.regions};
// Прогон части регионов дописывает их в готовый файл, остальные остаются как были.
const OUTF=path.join(__dirname,'measured','solos-2026-predict.json');
if(fs.existsSync(OUTF)){ const old=JSON.parse(fs.readFileSync(OUTF,'utf8'));
  Object.keys(old.regions||{}).forEach(r=>{ if(!out.regions[r]) out.regions[r]=old.regions[r]; });
  Object.keys(old.realRects||{}).forEach(r=>{ if(!REGS.includes(r)) out.realRects[r]=old.realRects[r]; }); }
fs.writeFileSync(OUTF, JSON.stringify(out));
Object.keys(o.regions).forEach(r=>{ const t=o.regions[r][0]; console.log(r, t.n, Math.round(t.win*100)+'%'); });
