// Матчевая статистика копится и в ЖИВОМ вечере, а не только в быстром.
//
// Прогон 27 сентября (финал Мейджора 1 через настоящий интерфейс) показал: после
// вечера приходит личный разбор, а доски лидеров нет. Причина — в живом
// показе, simulateGamesLive, накопитель accumulateMatchStats не звался вовсе:
// он стоял только в трёх быстрых путях, которыми считаются чужие лобби и
// перемотка. То есть урон, ассисты, метсы, время в шторме и расстояние
// набирались у КОГО УГОДНО, кроме тех, чей вечер игрок смотрел.
//
// Теперь копится в обоих местах живого показа — и в своём лобби, и в чужих,
// которые считаются тем же проходом.
//
//   node tools/patch-livestats.js
const fs = require("fs"), path = require("path");
const FILE = path.join(path.resolve(__dirname, ".."), "index.html");
const CRLF = String.fromCharCode(13) + String.fromCharCode(10), LF = String.fromCharCode(10);
let src = fs.readFileSync(FILE, "utf8");
const WAS_CRLF = src.includes(CRLF);
if (WAS_CRLF) src = src.split(CRLF).join(LF);

const lines = src.split(LF);
let done = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].indexOf("t[logKey].push({game:g+1, place, elims,") < 0) continue;
  if (lines[i + 1] && lines[i + 1].indexOf("accumulateMatchStats") >= 0) continue;
  const pad = (lines[i].match(/^\s*/) || [""])[0];
  lines[i] = lines[i] + LF + pad +
    "// Матчевая статистика вечера — здесь же: живой показ копит её наравне с" + LF + pad +
    "// быстрым счётом, иначе доска лидеров после сыгранного вечера пуста." + LF + pad +
    "accumulateMatchStats(t, place, order.length, pointsFn(place), ccKillPts(elims, killMult));";
  done++;
}
if (done !== 2) throw new Error("мест живого показа найдено " + done + ", а нужно два");
src = lines.join(LF);
fs.writeFileSync(FILE, WAS_CRLF ? src.split(LF).join(CRLF) : src, "utf8");
console.log("накопитель добавлен в живой показ (" + done + " места)");
