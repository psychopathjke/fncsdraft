// Every island with zones must also have its map art and its aspect.
// errlog 26.10c: Lyon (t4) came with art and zones but no MAP_ASPECT entry, so
// simulateGamesLive threw "reading 'split'" on every live night on that island.
//
//   node tools/check-map-tables.js
const fs = require('fs'), path = require('path'), vm = require('vm');
const src = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

function table(name){
  const at = src.indexOf('const ' + name + '=');
  if(at < 0) throw new Error(name + ' not found');
  const st = src.indexOf('{', at);
  let d = 0, j = st;
  for(; j < src.length; j++){ if(src[j] === '{') d++; else if(src[j] === '}' && !--d) break; }
  return Object.keys(vm.runInNewContext('(' + src.slice(st, j + 1).replace(/\/\/[^\n]*/g, '') + ')'));
}
const aspect = new Set(table('MAP_ASPECT')), art = new Set(table('MAP_ART')), zones = table('ZONE_SETS');
const bad = [];
zones.forEach(k => {
  if(!aspect.has(k)) bad.push(k + ': no MAP_ASPECT');
  if(!art.has(k)) bad.push(k + ': no MAP_ART');
});
art.forEach(k => { if(zones.indexOf(k) >= 0 && !aspect.has(k)) bad.push(k + ': art without aspect'); });
if(bad.length){ console.log('FAIL ' + [...new Set(bad)].join('; ')); process.exit(1); }
console.log('ok: ' + zones.length + ' islands with zones, all have art and aspect');
