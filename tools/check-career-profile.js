/* Профиль внутри карьеры: ник, аватарка и дата на плашке.

   Просьбы зрителя, 22 августа: «сменить ник или аву во время карьеры» и
   «добавить плашку даты в день игры, так как на самой плашке когда турик, не
   показывает день недели и дату».

   Переименование в этом моде безопасно по устройству, а не по случайности:
   @-адрес считает ccHandle при каждой отрисовке, авторство постов — ccPostAuthor
   в момент показа. Значит старые посты переезжают на новое имя сами и счётчик
   под профилем остаётся верным. Это тут и проверяется — если кто-то однажды
   решит хранить имя в записи поста, тест покраснеет.

   Отдельно стережётся то, что менять нельзя: карьера, взятая карточкой
   настоящего игрока, держит его в pl.handle, и careerCard по нему каждый раз
   ищет карточку. Переименуешь — карьера потеряет свои же результаты.

   И проверка ника: он должен требовать буквы или цифры, но в ЛЮБОМ алфавите.
   Первая версия спрашивала «ccHandle не пустой» и пропускала «!!!», потому что
   ccHandle при пустом результате возвращает исходную строку — иначе кириллица
   и иероглифы остались бы без @-адреса.

   node tools/check-career-profile.js
*/
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) { console.error('Chrome не найден'); process.exit(2); }

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out={nick:[], notes:{}, err:null};
  const done=()=>{
    try{
      // Дата на плашке вне карьеры — её быть не должно: у драфта своего числа нет.
      out.notes.whenInDraft=ccStageWhen();

      localStorage.clear();
      careerEntry();
      ccPickRole('roleFRG'); ccPickDiv(3); ccPickRegion('EU'); ccPickCountry('de');
      const n=document.getElementById('ccNick');
      n.value='Base'; n.dispatchEvent(new Event('input',{bubbles:true}));
      if(typeof ccSync==='function') ccSync();
      document.getElementById('ccStart').click();

      // ---- дата на плашке -------------------------------------------------
      out.notes.today=careerToday();
      out.notes.when=ccStageWhen();
      const shell=createStageCardShell('Проверка - 50');
      out.notes.cardHasWhen=shell.card.innerHTML.indexOf('stage-when')>=0;
      out.notes.cardShows=(shell.card.querySelector('.stage-when')||{}).textContent||'';

      // ---- какой ник принимается -----------------------------------------
      [['Novyy',true],['   ',false],['!!!',false],['---',false],['',false],
       ['Кирилл',true],['ゆうま',true],['x',true],['7',true],['  Tr1m  ',true]]
        .forEach(([v,want])=>{
          const got=careerNickSet(v);
          out.nick.push({v:v, want:want, got:!!got, now:CAREER.player.nick});
        });

      // ---- переименование не теряет своих постов --------------------------
      careerNickSet('Pered');
      careerNews('good','ccNewsRelThrough',['проверка','#1']);
      const feed=()=>CAREER.career.news||[];
      const mineBefore=feed().filter(x=>ccPostAuthor(x).you).length;
      const nameBefore=ccPostAuthor(feed()[0]).name;
      careerNickSet('Posle');
      out.notes.postsBefore=mineBefore;
      out.notes.postsAfter=feed().filter(x=>ccPostAuthor(x).you).length;
      out.notes.authorBefore=nameBefore;
      out.notes.authorAfter=ccPostAuthor(feed()[0]).name;
      out.notes.handleFollows=ccHandle(CAREER.player.nick);

      // ---- фото: ставится, снимается, доживает до сейва --------------------
      const PIC='data:image/gif;base64,R0lGODlhAQABAAAAACw=';
      out.notes.photoSet=careerPhotoSet(PIC)===true && CAREER.player.photo===PIC;
      const key=Object.keys(localStorage).find(k=>/career/i.test(k));
      let saved=null; try{ saved=JSON.parse(localStorage.getItem(key)||'null'); }catch(e){}
      out.notes.photoSaved=!!(saved && saved.player && saved.player.photo);
      out.notes.photoCleared=careerPhotoSet(null)===true && CAREER.player.photo===null;

      // ---- чужое имя не меняется, фото — можно ----------------------------
      const wasNick=CAREER.player.nick;
      CAREER.player.handle='Sky';
      out.notes.realNickLocked=careerNickSet('Ne Sky')===false &&
                               CAREER.player.nick===wasNick;
      out.notes.realPhotoOk=careerPhotoSet(PIC)===true;
      CAREER.player.handle=null;
      careerPhotoSet(null);

      // ---- кнопки на экране ----------------------------------------------
      careerRenderHub();
      const html=document.body.innerHTML;
      out.notes.btnNick=html.indexOf(L().ccNickAsk)>=0;
      out.notes.btnPhoto=html.indexOf(L().ccPhotoPick)>=0;
      out.notes.fileInput=!!document.getElementById('chPhotoInput');
    }catch(e){ out.err=String(e&&e.stack||e); }
    document.getElementById('__out').textContent=
      'PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
  };
  if(typeof ccMapsReady==='function') ccMapsReady(done); else done();
})();
<\/script>`;

const src = fs.readFileSync(ROOT + '/index.html', 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prof-'));
const tmp = dir + '/index.html';
const fwd = s => s.split(String.fromCharCode(92)).join('/');
fs.writeFileSync(tmp, '<base href="file:///' + fwd(ROOT) + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=300000', '--dump-dom',
  'file:///' + fwd(tmp)], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('проба не отработала; копия в ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
const N = out.notes;

let bad = 0;
const check = (ok, what) => { if (!ok) { bad++; console.error('  БАГ  ' + what); }
                             else console.log('  ok   ' + what); };

console.log('день карьеры ' + N.today + ', плашка пишет «' + N.cardShows + '»\n');
console.log('какой ник принимается:');
out.nick.forEach(r => {
  const ok = r.got === r.want;
  if (!ok) bad++;
  console.log((ok ? '  ok   ' : '  БАГ  ') + JSON.stringify(r.v).padEnd(12) +
    (r.got ? 'принят' : 'отклонён').padEnd(10) + 'ник: ' + r.now);
});
console.log('');
check(N.when && N.when.length > 0, 'плашка турнира несёт день и число: ' + N.when);
check(N.cardHasWhen, 'и это правда попадает в разметку карточки');
check(!N.whenInDraft, 'а в драфте даты нет — ей там неоткуда взяться');
check(N.authorBefore !== N.authorAfter, 'старый пост переезжает на новое имя: ' +
      N.authorBefore + ' → ' + N.authorAfter);
check(N.postsAfter === N.postsBefore,
      'и своих постов не убыло: ' + N.postsBefore + ' → ' + N.postsAfter);
check(N.handleFollows === 'posle', '@-адрес идёт за ником: @' + N.handleFollows);
check(N.photoSet, 'фото ставится');
check(N.photoSaved, 'и доживает до сейва');
check(N.photoCleared, 'и снимается обратно');
check(N.realNickLocked, 'имя настоящего игрока не переписывается');
check(N.realPhotoOk, 'а фото ему поменять можно');
check(N.btnNick && N.btnPhoto, 'обе кнопки на плитке профиля');
check(N.fileInput, 'и поле выбора файла на месте');

if (bad) { console.error('\nне сходится: ' + bad); process.exit(1); }
console.log('\nпрофиль правится из карьеры, и вечер знает своё число');
fs.rmSync(dir, { recursive: true, force: true });
