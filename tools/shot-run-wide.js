// Снимок прогона: карта и таблица рядом, в настоящей вёрстке экрана.
//
// Ширина этого экрана — единственный рычаг, который делает ники на карте
// читаемыми: их размер считается в cqh от высоты карты. Смотреть на это надо
// глазами и на разных окнах, поэтому размер окна — аргумент.
//
//   node tools/shot-run-wide.js [ширина] [высота]      по умолчанию 1920×1080
// Кладёт shot-run-<ширина>x<высота>.png рядом с репозиторием.
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.SHOT_DIR || ROOT;
const W = +(process.argv[2] || 1920), H = +(process.argv[3] || 1080);
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<script src="tools/shot-field.js"><\/script>
<script>
(function(){
  try{
    show('screen-results');                 // он же ставит wrap-wide
    useLandingSet('m2');
    const set='m2';
    const ratio=MAP_ASPECT[set].split('/');
    const aspect=Number(ratio[1])/Number(ratio[0]);

    // Та же оболочка, что строит раннер: карточка этапа, внутри строка с
    // таблицей, карта монтируется рядом. Собрана здесь руками, потому что
    // проверяется ГЕОМЕТРИЯ, а не турнир, — гонять ради кадра целый вечер
    // значит ждать минуту и получить случайную его секунду.
    const container=document.getElementById('majorStages');
    const shell=document.createElement('div');
    shell.className='stage-card';
    shell.innerHTML='<h4>Weekly Final · Game 6 of 11</h4>'+
      '<div class="stage-live">'+
        '<div class="lobby-wrap" style="margin-top:6px;max-height:max(520px, calc(100vh - 300px));overflow-y:auto;">'+
        '<table class="lobby-table lobby-live"><thead><tr>'+
        '<th>'+L().rankHeader+'</th><th>'+L().teamHeader+'</th>'+
        '<th class="num">'+L().ptsHeader+'</th><th class="num">'+L().matchesWord+'</th>'+
        '<th class="num">'+L().winsWord+'</th><th class="num">'+L().killsHeader+'</th>'+
        '<th class="num">'+L().avgHeader+'</th>'+
        '</tr></thead><tbody id="__body"></tbody></table></div></div>';
    container.appendChild(shell);

    const res=ShotField.record(7);
    const roster=res.roster||[];
    const body=document.getElementById('__body');
    body.innerHTML=roster.slice(0,50).map(function(t,i){
      const pts=520-i*9, m=6, w=i<3?2:(i<9?1:0), k=44-i;
      return '<tr'+(i===4?' class="me"':'')+'><td>'+(i+1)+'</td><td>'+
        (t.names||t.name||'—')+'</td><td class="num">'+pts+'</td>'+
        '<td class="num">'+m+'</td><td class="num">'+w+'</td>'+
        '<td class="num">'+k+'</td><td class="num">'+(90-i)+'</td></tr>';
    }).join('');

    const stageLive=shell.querySelector('.stage-live');
    const handle=ZoneReplay.mount(stageLive, MAP_ART[set],
      MAP_ASPECT[set].replace('/',' / '), aspect);
    handle.wrap.style.setProperty('--zr-cap',
      'min(100%, calc((100vh - '+CC_MAP_TOP+'px) / '+aspect.toFixed(4)+'))');
    stageLive.classList.add('stage-live-playing');

    // Кадр посреди матча: ники на карте есть, пока команды живы.
    const tl=res.timeline||[];
    let cut=tl.length-1;
    for(let i=0;i<tl.length;i++) if(tl[i].alive<=24){ cut=i; break; }
    ZoneReplay.play(handle, tl.slice(0, cut+1), {frameMs:8, labels:{zone:'ZONE'}, roster:res.roster});
  }catch(e){
    document.body.insertAdjacentHTML('beforeend',
      '<pre style="position:fixed;left:0;top:0;z-index:99999;margin:0;padding:12px;'+
      'background:#300;color:#fff;font:12px monospace;white-space:pre-wrap;width:100%">'+
      String(e && e.stack || e)+'</pre>');
  }
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccrun-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const out = path.join(OUT, 'shot-run-' + W + 'x' + H + '.png');
execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--hide-scrollbars',
  '--window-size=' + W + ',' + H,
  '--run-all-compositor-stages-before-draw','--virtual-time-budget=40000',
  '--screenshot=' + out, 'file:///' + tmp.replace(/\\/g,'/')], {stdio:'ignore'});
fs.rmSync(dir, {recursive:true, force:true});
console.log('  ' + path.relative(ROOT, out));
