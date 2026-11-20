# Split index.html into source modules without breaking the checks

## Why

`index.html` is ~184k lines. Nobody new can find their way in it, editors struggle, and every diff
is against one file. But ~360 harnesses copy `index.html` as a whole into a temp folder and run it from
`file://`, many without `<base href>`, so the file itself has to stay whole.

## Shape

Sources move to `src/`; `index.html` becomes a build output that is still committed, so every
harness, probe and deploy step keeps reading exactly what it reads today.

```
src/
  head.html            <head> up to the main <style>
  css/*.css            one file per area (base, draft, career, manager, competitive ...)
  body.html            the static screens
  strings/{ru,en,fr,it,pt}.js
  data/cards-*.js      generated card tables (builders write here instead of into index.html)
  game/*.js            draft, squads, landing, runs
  career/*.js          one file per feature (cups, away, solo series, social, shop ...)
  mgr/*.js             Fortnite Manager (keeps the MGR markers around it)
  tail.html
tools/assemble.js      concatenates src/ in a fixed order into index.html
```

`tools/assemble.js --check` rebuilds in memory and fails if `index.html` differs. CI runs it first,
so an edit made straight into `index.html` instead of `src/` is caught on the next push.

## Steps (each one ships on its own, guards green after each)

1. `assemble.js` with a single source file that is today's `index.html`; `--check` in CI. Proves the
   round trip is byte-exact. No behaviour change.
2. Cut out CSS and the static body. Pure text moves; the assembled file is byte-identical.
3. Cut out strings per language and the generated card data; point `tools/build-*.js` at `src/data`.
4. Career, by feature, largest first. Order inside the bundle stays the same, so hoisting and
   top-level `const` order do not change. Byte-identical output after every move.
5. Manager into `src/mgr/` with its markers.
6. Only after all moves: real modules (ES `import`) where it pays, with the deploy build bundling them.

Byte-identical output is the safety net: as long as `assemble.js --check` passes, no harness can
tell the difference, and a move cannot change behaviour.

## Cost and risk

Steps 1-3 are mechanical and low risk. Step 4 is most of the work. Every open branch that touches
`index.html` has to be merged before the cut it overlaps, or rebased by re-applying its diff to the
matching `src/` file. Memory notes and tools that quote `index.html` line numbers go stale; names
stay valid.
