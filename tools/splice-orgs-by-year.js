// Переписывает встроенный ORGS_BY_YEAR в index.html из tools/measured/orgs-by-year.json:
// {год: {major<n>|major<n>q|globals: {ник: [клуб, регион]}}}.
//   node tools/splice-orgs-by-year.js
'use strict';
const fs = require('fs'), path = require('path');
const file = path.join(__dirname, '..', 'index.html');
const src = JSON.parse(fs.readFileSync(path.join(__dirname, 'measured', 'orgs-by-year.json'), 'utf8'));
const out = {};
Object.keys(src).sort().forEach(y => {
  out[y] = {};
  Object.keys(src[y]).forEach(k => {
    out[y][k] = {};
    Object.keys(src[y][k]).forEach(h => { const e = src[y][k][h]; out[y][k][h] = [e.club, e.reg || null]; });
  });
});
let s = fs.readFileSync(file, 'utf8');
const a = s.indexOf('  const ORGS_BY_YEAR=');
if (a < 0) throw new Error('ORGS_BY_YEAR not found');
const nl = s.includes('\r\n') ? '\r\n' : '\n';
const b = s.indexOf(nl, a);
const line = s.slice(a, b);
if (!/;\s*$/.test(line)) throw new Error('ORGS_BY_YEAR is not one line');
s = s.slice(0, a) + '  const ORGS_BY_YEAR=' + JSON.stringify(out) + ';' + s.slice(b);
fs.writeFileSync(file, s);
console.log('ORGS_BY_YEAR:', Object.keys(out).map(y => y + ' ' + Object.keys(out[y]).map(k => k + '=' + Object.keys(out[y][k]).length).join(' ')).join(' | '));
