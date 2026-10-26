// Обложки турниров для календаря /competitive (26.10, его «добавь логотипы в календаре»): плитки Epic 800×800
// с cdn2.unrealengine.com (календарь eucompetitive отдаёт их копии со своего CDN — берём оригинал у Epic по имени
// файла), уменьшенные до 320 px, в art/comp/. Скачивается только то, чего ещё нет. Уменьшает PowerShell
// (System.Drawing); не Windows или не вышло — остаётся оригинал.
//   node tools/fetch-comp-art.js   (зовёт fetch-competitive.js)
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'art', 'comp');
const CAL = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/measured/comp-calendar.json'), 'utf8'));
const fileOf = u => String(u).split('/').pop().split('?')[0].replace(/^[0-9a-f]{8}-/, '');

function shrink(file) {
  if (process.platform !== 'win32') return false;
  const ps = `Add-Type -AssemblyName System.Drawing; $i=[System.Drawing.Image]::FromFile('${file}'); $b=New-Object System.Drawing.Bitmap 320,320;` +
    ` $g=[System.Drawing.Graphics]::FromImage($b); $g.InterpolationMode='HighQualityBicubic'; $g.DrawImage($i,0,0,320,320); $i.Dispose();` +
    ` $c=[System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders()|?{$_.MimeType -eq 'image/jpeg'}; $p=New-Object System.Drawing.Imaging.EncoderParameters 1;` +
    ` $p.Param[0]=New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality,[long]80); $b.Save('${file}.tmp',$c,$p); $b.Dispose(); $g.Dispose()`;
  try { execFileSync('powershell', ['-NoProfile', '-Command', ps], { stdio: 'ignore' }); fs.renameSync(file + '.tmp', file); return true; }
  catch (e) { try { fs.unlinkSync(file + '.tmp'); } catch (_) {} return false; }
}

(async () => {
  fs.mkdirSync(DIR, { recursive: true });
  const EVF = path.join(ROOT, 'tools/measured/comp-events-2026.json');
  const EV = fs.existsSync(EVF) ? JSON.parse(fs.readFileSync(EVF, 'utf8')) : {};
  const urls = [...new Set(CAL.events.map(e => e.img).concat(Object.values(EV).map(e => e && e.poster)).filter(Boolean))];
  let got = 0;
  for (const u of urls) {
    const name = fileOf(u).replace(/\.(png|jpeg)$/i, '.jpg');
    const out = path.join(DIR, name);
    if (fs.existsSync(out)) continue;
    let r = await fetch('https://cdn2.unrealengine.com/' + fileOf(u)).catch(() => null);
    if (!r || !r.ok) r = await fetch(u).catch(() => null);
    if (!r || !r.ok) { console.log('обложка: нет ' + name); continue; }
    fs.writeFileSync(out, Buffer.from(await r.arrayBuffer()));
    shrink(out); got++;
  }
  console.log('обложки турниров: ' + urls.length + ' (новых ' + got + ') → art/comp');
})().catch(e => { console.error(e); process.exit(1); });
