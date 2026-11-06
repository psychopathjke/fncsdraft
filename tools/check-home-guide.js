// Гайд на главной: кнопка в меню, окно открывается и закрывается, старт ведёт в карьеру, текст есть на всех языках.
//   node tools/check-home-guide.js
const fs=require('fs'),os=require('os'),path=require('path');const {execFileSync}=require('child_process');
const fails=[]; const check=(n, ok, d)=>{ if(!ok) fails.push(n+(d!=null ? ': '+d : '')); };
const KEYS=['hmGuideBtn','hmGuideH','hmGuide1','hmGuide2','hmGuide3','hmGuideGo','hmGuideMore','hmGmH','hmGm1','hmGm2','hmGm3','hmGm4','hmGm5','hmGm6','hmGm7'];
for(const l of ['de','es']){ const s=fs.readFileSync(path.join(__dirname,'..','i18n-'+l+'.js'),'utf8'); KEYS.forEach(k=>check(l+' '+k, s.includes('"'+k+'":'))); }
const body=String.raw`
const fails=[]; const check=(n, ok, d)=>{ if(!ok) fails.push(n+(d!=null ? ': '+d : '')); };
for(const l of ['en','ru','fr','it','pt']) for(const k of ${JSON.stringify(KEYS)}) check(l+' '+k, typeof I18N[l][k]==='string' && I18N[l][k].length>1 && !I18N[l][k].includes('\u2014'));
const m=document.getElementById('homeGuide'), btn=document.querySelector('.site-nav .nav-guide');
check('кнопка в меню', !!btn); check('окно есть', !!m);
homeGuideOpen(); check('открывается', m.classList.contains('on'));
check('подробнее ведёт на about', /about$/.test(document.getElementById('homeGuideMore').getAttribute('href')));
homeGuideClose(); check('закрывается', !m.classList.contains('on'));
homeGuideOpen(); document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'})); check('Escape закрывает', !m.classList.contains('on'));
homeGuideOpen(); const keep=careerStart; let started=0; careerStart=()=>{started++;};
m.querySelector('.hero-btn-go').click(); careerStart=keep;
check('старт запускает карьеру', started===1, started); check('старт закрывает окно', !m.classList.contains('on'));
return {fails};
`;
const tmp=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'guide-')),'body.js'); fs.writeFileSync(tmp, body);
const out=execFileSync(process.execPath,[path.join(__dirname,'probe-run.js'), tmp, '120000'],{encoding:'utf8',maxBuffer:1<<26,stdio:['ignore','pipe','ignore']});
const res=JSON.parse(out); if(res.err) fails.push(res.err); else res.fails.forEach(f=>fails.push(f));
if(fails.length){ fails.forEach(f=>console.log('FAIL '+f)); process.exit(1); }
console.log('OK check-home-guide');
