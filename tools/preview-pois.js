// Draws the wiki's POI markers, at the positions build-2025-zone-loot.js
// computes for them, over the map that ships — so the alignment is looked at
// rather than trusted.
const fs=require('fs'), os=require('os'), path=require('path');
const { execFileSync } = require('child_process');
const ROOT='C:/Users/FoxOS_User/Desktop/fncsdraftmajor';
const SET=process.argv[2]||'t3';
const PTS=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));   // [{n,X,Y}]
const OUT=process.argv[4];
const CHROME=[process.env.CHROME,'C:/Program Files/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA||'')+'/Google/Chrome/Application/chrome.exe'].find(p=>p&&fs.existsSync(p));
const art=fs.readFileSync(path.join(ROOT,'art/map-'+SET+'.jpg')).toString('base64');
const dots=PTS.map(p=>`<div style="position:absolute;left:${p.X}%;top:${p.Y}%;transform:translate(-50%,-50%);
  font:700 11px sans-serif;color:#fff;text-shadow:0 0 3px #000,0 0 6px #000;white-space:nowrap;">
  <span style="color:#0f0;">●</span> ${p.n}</div>`).join('');
const html=`<body style="margin:0;background:#0b1117;">
<div style="position:relative;width:1100px;"><img src="data:image/jpeg;base64,${art}" style="width:100%;display:block;">
${dots}</div></body>`;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'poi-'));
const f=path.join(dir,'p.html'); fs.writeFileSync(f,html);
execFileSync(CHROME,['--headless=new','--disable-gpu','--no-sandbox','--virtual-time-budget=20000',
  '--window-size=1120,1180','--screenshot='+OUT,'file:///'+f.replace(/\\/g,'/')],{encoding:'utf8'});
console.log('wrote',OUT);
