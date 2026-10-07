// Закреп в личке (его слово 7.10: «пусть медиа в личке закреп будет: тимейт, менеджер»).
// Во «Все» переписка с тиммейтом и со СВОИМ менеджером стоят первыми под «Закреплено» и ниже не повторяются;
// чужой менеджер, клуб и фанат — на своих местах; во вкладке раздела закрепа нет, тиммейт — в своём разделе.
//   node tools/check-career-dm-pin.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(String.fromCharCode(92)).join('/');
const CH = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => fs.existsSync(p));
const BOOT = `<pre id="__out" style="display:none"></pre><script>window.addEventListener('load',()=>setTimeout(()=>{ const out={fails:[], notes:{}};
const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d!=null ? ': '+d : '')); };
try{
  const card={handle:'PinMate', region:'EU', rating:80, _ovr:80, nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null};
  localStorage.setItem('fncsdraft_career', JSON.stringify({v:1,
    player:{nick:'Pin', age:18, source:'rookie', country:'de', countryPing:15, closeRangeEdge:0, region:'EU', ovr:80, role:'roleIGL', attrs:ccRookieAttrs(80,'roleIGL'), ageEdge:0, photo:null, handle:null, cardRegion:null, nat:null},
    career:{season:1, day:'2026-02-10', division:1, earnings:0, balance:0, reach:500, tokens:[], log:[], news:[]},
    partner:{card:card, patience:40, since:'2026-01-01', dev:0}, partners:[{card:card, patience:40, since:'2026-01-01', dev:0}]}));
  careerLoad();
  const fan=careerDmThread({handle:'PinFan', ovr:null, roster:false, fan:true}); careerDmPush(fan, 'them', 'dmAgent', [10, 2]);
  const club=careerDmThread({handle:'PinClub', ovr:null, roster:false, org:true}); careerDmPush(club, 'them', 'dmAgent', [10, 2]);
  const mine=CC_AGENTS[0], other=CC_AGENTS[1];
  const ta=ccAgentThreadOf(other.name, true); careerDmPush(ta, 'them', 'dmAgent', [10, 2]);
  const tm=ccAgentThreadOf(mine.name, true); careerDmPush(tm, 'them', 'dmAgent', [10, 2]);
  CAREER.agent={name:mine.name, at:mine.at||null, photo:mine.photo||null};
  const mt=careerMateThread(); careerDmPush(mt, 'them', 'dmAgent', [10, 2]);
  CAREER.career.day=ccAddDays(CAREER.career.day, 1);
  const order=html=>{ const d=document.createElement('div'); d.innerHTML=html; const side=d.querySelector('.dm-side'); if(!side) return null;
    return [...side.querySelectorAll('.dm-side-h, .dm-line')].map(e=>e.classList.contains('dm-side-h') ? '#'+(e.classList.contains('dm-side-pin') ? 'PIN' : e.textContent.trim())
      : (['PinMate','PinFan','PinClub',mine.name,other.name].find(n=>e.textContent.indexOf(n)>=0)||'?')); };
  CH_DMKIND=null;
  const all=order(careerSocialHTML()); out.notes.all=all;
  check('есть боковая колонка', !!all);
  if(all){
    check('первым — «Закреплено»', all[0]==='#PIN', all.join(' | '));
    check('под ним тиммейт, потом свой менеджер', all[1]==='PinMate' && all[2]===mine.name, all.join(' | '));
    check('закреплённые ниже не повторяются', all.filter(x=>x==='PinMate').length===1 && all.filter(x=>x===mine.name).length===1, all.join(' | '));
    check('чужой менеджер, клуб и фанат — не в закрепе', all.indexOf(other.name)>3 && all.indexOf('PinClub')>3 && all.indexOf('PinFan')>3, all.join(' | '));
  }
  CH_DMKIND='duos';
  const duos=order(careerSocialHTML()); out.notes.duos=duos;
  check('во вкладке раздела закрепа нет, тиммейт в своём разделе', duos && duos.indexOf('#PIN')<0 && duos.indexOf('PinMate')>=0, duos && duos.join(' | '));
  CAREER.agent=null; CH_DMKIND=null;
  const noAg=order(careerSocialHTML()); out.notes.noAgent=noAg;
  check('без менеджера закреплён только тиммейт', noAg && noAg[1]==='PinMate' && noAg[2]!==mine.name, noAg && noAg.join(' | '));
}catch(e){ out.fails.push(String(e.stack||e)); }
document.getElementById('__out').textContent='@@B@@'+encodeURIComponent(JSON.stringify(out))+'@@E@@'; }, 500));<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dmpin-')), tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CH, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--virtual-time-budget=120000', '--dump-dom', 'file:///' + tmp.split(String.fromCharCode(92)).join('/')], { maxBuffer: 1 << 30, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const out = JSON.parse(decodeURIComponent(dom.match(/@@B@@([^@<]*)@@E@@/)[1]));
if (out.fails.length) { console.log(['FAIL ' + JSON.stringify(out.notes)].concat(out.fails).join(String.fromCharCode(10))); process.exit(1); }
console.log('OK закреп в личке ' + JSON.stringify(out.notes));
