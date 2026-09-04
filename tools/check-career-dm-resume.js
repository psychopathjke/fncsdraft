// Письмо о месте называет лучший результат прошлого сезона.
//
// Его слово, 30 августа: «когда игрок пишет о результатах в лс, пусть там
// будут результаты с крупных турниров, с ЛАНов и т.д., или див-капы — смотря
// какой лучший в прошлом сезоне». Проверяется:
//   1) дивизион 1, сезон 1: настоящая карточка — строка с опубликованным
//      турниром и местом, Мировой/ЛАН выше Мейджора;
//   2) дивизион 4: игрок лестницы — «дивизион 4, лучшее в кубке — топ N»,
//      число одно и то же от письма к письму;
//   3) письмо о месте (careerSeatDm) несёт вторую строку с результатом;
//   4) сезон 2: архив прошлого сезона — ник из таблицы Мирового получает
//      именно её (и место из неё).
//
//   node tools/check-career-dm-resume.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');
const SL = String.fromCharCode(92);
const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out={fails:[], notes:{}, err:null};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  const seed=(div, season)=>{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Reader', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:div===1 ? 92 : 70, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:season||1, day:'2026-02-02', division:div, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[], seed:'resume-seed'},
      partner:null}));
    careerEntry();
  };
  try{
    // 1. Настоящая карточка.
    seed(1, 1);
    const pool=careerDmPool();
    check('в дивизионе 1 пишут настоящие', pool.length>0 && pool.every(w=>w.roster));
    const withRec=pool.map(w=>({w, r:ccDmResume(w)})).filter(x=>x.r);
    check('у настоящих есть результат', withRec.length>0);
    const real=withRec.find(x=>x.r.ev);
    check('результат — турнир и место', !!real && typeof real.r.ev==='string' && real.r.ev.length>3 && real.r.place>=1, JSON.stringify(real && real.r));
    out.notes.real=real && {h:real.w.handle, r:real.r};
    // Мировой выше Мейджора: Malibuca играл и то и другое.
    const mal=ccDmResume({handle:'Malibuca', roster:true, ovr:96});
    out.notes.mal=mal;
    check('Малибука: лучшее — из крупного турнира', !!mal && !!mal.ev && ccDmResumeRank(mal.ev)<20, JSON.stringify(mal));
    // 3. Письмо о месте несёт результат.
    careerDms().length=0;
    careerSeatDm(careerToday()+'|0|0');
    const t=careerDms().find(x=>x.state==='offer' && x.who && !x.who.org && !x.who.brand);
    check('письмо о месте пришло', !!t);
    const ks=(t ? t.msgs : []).map(m=>m.k);
    check('второй строкой — результат', ks.indexOf('dmSeatRec')===1 || ks.indexOf('dmSeatRecDiv')===1, ks.join(','));
    const text=t ? ccText(t.msgs[1]) : '';
    check('строка читается', text.indexOf('топ')>=0 || text.indexOf('top')>=0, text);
    out.notes.line=text;
    // 2. Лестница — кубок дивизиона.
    seed(4, 1);
    const w4=careerDmPool()[0];
    check('в дивизионе 4 пишет лестница', !!w4 && !w4.roster);
    const r4=ccDmResume(w4), r4b=ccDmResume(w4);
    check('лестница: дивизион и место в кубке', !!r4 && r4.div===4 && r4.place>=1 && r4.place<=12 && !r4.ev, JSON.stringify(r4));
    check('число не плавает', JSON.stringify(r4)===JSON.stringify(r4b));
    out.notes.ladder=r4;
    // 4. Архив прошлого сезона.
    seed(1, 2);
    const tbl=careerArchiveFinal(1, 'g|gc');
    check('архив Мирового за сезон 1 есть', !!tbl && tbl.rows && tbl.rows.length>2);
    if(tbl){
      const row=tbl.rows.find(r=>r.p>1 && String(r.name).indexOf(' & ')>0);
      const h=String(row.name).split(' & ')[0].trim();
      const ra=ccDmResume({handle:h, roster:true, ovr:95});
      check('ник из таблицы Мирового получает Мировой', !!ra && ra.ev===tbl.cap && ra.place===row.p, JSON.stringify({h, ra, p:row.p, cap:tbl.cap}));
    }
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ccdmres-')); const tmp=path.join(dir,'index.html');
fs.writeFileSync(tmp, '<base href="file:///'+ROOT.split(SL).join('/')+'/">'+fs.readFileSync(path.join(ROOT,'index.html'),'utf8')+BOOT);
const dom=execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files','--virtual-time-budget=120000','--dump-dom','file:///'+tmp.split(SL).join('/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir,{recursive:true,force:true});
const m=dom.match(/PBEGIN([\s\S]*?)PEND/); if(!m){ console.error('проба не отработала'); process.exit(2); }
const out=JSON.parse(decodeURIComponent(m[1]));
if(out.err){ console.error('ERR: '+out.err); process.exit(1); }
out.fails.forEach(f=>console.log(' FAIL '+f)); if(out.fails.length) process.exit(1);
console.log('письмо о месте называет лучший результат прошлого сезона · '+JSON.stringify(out.notes));
