// Does index.html still parse?
//
// The app is one file with one very large inline script, and a stray brace in
// it is a blank page rather than an error anybody sees. This pulls every
// <script> block that has no src out of the file and hands it to the JS parser,
// which is the cheapest possible check that an edit did not break the whole
// app.
//
//   node tools/check-index.js
'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');

var file = path.join(__dirname, '..', 'index.html');
var src = fs.readFileSync(file, 'utf8');
var re = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi;
var m, n = 0, bad = 0;

while((m = re.exec(src))){
  // The page also carries a JSON-LD block, which is data wearing a script tag.
  if(/type\s*=\s*["'](?!text\/javascript|module)/i.test(m[1])) continue;
  n++;
  // Line number of the block's start, so a failure points at the file rather
  // than at an offset in a string.
  var line = src.slice(0, m.index).split('\n').length;
  try {
    new vm.Script(m[2], {filename: 'index.html:' + line});
  } catch(e){
    bad++;
    console.log('  FAIL  script block at index.html:' + line);
    console.log('        ' + e.message);
  }
}

console.log('  ' + (n - bad) + '/' + n + ' script blocks parse');
process.exit(bad ? 1 : 0);
