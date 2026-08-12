// Plays a recorded zone timeline over the Major's map. Knows nothing about the
// simulation: it is handed frames and draws them.
(function(root){
  'use strict';

  function el(tag, cls, css){
    var e = document.createElement(tag);
    if(cls) e.className = cls;
    if(css) e.style.cssText = css;
    return e;
  }

  var ZOOM_MAX = 8;

  // What the box is actually showing, in the frames' own units.
  //
  // The camera is a CSS transform on the stage, so the SVG inside it never
  // learns that anything moved — it keeps drawing all hundred units of island
  // whatever is on screen. The labels have to know: a name for a squad off the
  // left edge is a name nobody can read, and the room the names are competing
  // for is the room in the box, not the room on the island.
  function setView(handle, tx, ty, s){
    if(!handle) return;
    var vbH = Number(handle.svg.dataset.vbh) || 100;
    var W = handle.wrap.clientWidth || 520;
    var H = handle.wrap.clientHeight || (W * vbH / 100);
    handle.view = {
      x0: (-tx / s) / W * 100,
      y0: (-ty / s) / H * vbH,
      x1: ((W - tx) / s) / W * 100,
      y1: ((H - ty) / s) / H * vbH
    };
  }

  // Wheel to zoom on the point under the cursor, drag to pan, double-click to
  // put it back. The pan is clamped so the edge of the island can never be
  // dragged into the middle of the frame — at any zoom the box stays full of
  // map, which is what stops a zoomed replay from getting lost.
  function addZoom(wrap, stage, handle){
    var scale = 1, tx = 0, ty = 0, dragging = false, lastX = 0, lastY = 0, moved = false;

    function apply(){
      stage.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')';
      wrap.style.cursor = scale > 1 ? (dragging ? 'grabbing' : 'grab') : 'zoom-in';
      if(handle) handle.scale = scale;
      setView(handle, tx, ty, scale);
    }
    // Set by the events rather than by apply(), which also runs once at mount
    // and would hand the camera over before anybody had touched anything.
    function touched(){ if(handle) handle.byHand = true; }
    function clampPan(){
      var w = wrap.clientWidth, h = wrap.clientHeight;
      tx = Math.min(0, Math.max(w - w * scale, tx));
      ty = Math.min(0, Math.max(h - h * scale, ty));
    }
    function zoomAt(px, py, factor){
      var next = Math.min(ZOOM_MAX, Math.max(1, scale * factor));
      if(next === scale) return;
      // Hold whatever is under the pointer still while the rest grows past it.
      tx = px - (px - tx) * (next / scale);
      ty = py - (py - ty) * (next / scale);
      scale = next;
      if(scale === 1){ tx = 0; ty = 0; }
      clampPan(); apply();
    }

    wrap.addEventListener('wheel', function(e){
      e.preventDefault(); touched();
      var r = wrap.getBoundingClientRect();
      zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.0016));
    }, {passive:false});

    wrap.addEventListener('pointerdown', function(e){
      if(scale === 1) return;
      touched();
      dragging = true; moved = false;
      lastX = e.clientX; lastY = e.clientY;
      wrap.setPointerCapture(e.pointerId);
      apply();
    });
    wrap.addEventListener('pointermove', function(e){
      if(!dragging) return;
      tx += e.clientX - lastX; ty += e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      moved = true;
      clampPan(); apply();
    });
    function release(e){
      if(!dragging) return;
      dragging = false;
      if(e.pointerId != null && wrap.hasPointerCapture(e.pointerId)) wrap.releasePointerCapture(e.pointerId);
      apply();
    }
    wrap.addEventListener('pointerup', release);
    wrap.addEventListener('pointercancel', release);

    wrap.addEventListener('dblclick', function(e){
      e.preventDefault(); touched();
      if(scale > 1){ scale = 1; tx = 0; ty = 0; apply(); return; }
      var r = wrap.getBoundingClientRect();
      zoomAt(e.clientX - r.left, e.clientY - r.top, 3);
    });
    // A single click at rest is a zoom in, the way a map behaves; a click that
    // ended a drag is not.
    wrap.addEventListener('click', function(e){
      if(moved || e.detail > 1) return;
      if(scale > 1) return;
      touched();
      var r = wrap.getBoundingClientRect();
      zoomAt(e.clientX - r.left, e.clientY - r.top, 2.2);
    });

    apply();
  }

  function mount(container, mapSrc, aspectCss, aspect, opts){
    opts = opts || {};
    var wrap = el('div', 'zone-replay',
      'position:relative;width:100%;max-width:520px;margin:8px auto 0;aspect-ratio:' + aspectCss + ';' +
      'border-radius:10px;overflow:hidden;border:1px solid var(--lb-line);');

    // The map and the drawing on it move together, so they share one transform
    // and the header, the roster and the kill feed sit outside it — those are
    // read, not inspected, and they should not slide off when the map does.
    //
    // No `will-change: transform`. It promotes this to its own composited layer,
    // and a promoted layer is rasterised once and then stretched — which is
    // exactly what a camera that zooms to nearly 7x must not do. Without it the
    // browser re-rasterises the map at the scale it is actually being shown at,
    // and the island stays as sharp as its own pixels allow. The camera moves a
    // handful of times a match, so there is nothing here worth promoting for.
    var stage = el('div', null, 'position:absolute;inset:0;transform-origin:0 0;');
    wrap.appendChild(stage);

    var img = el('img', null,
      'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;');
    img.src = mapSrc;
    stage.appendChild(img);

    // The map is darkened by a sheet laid over it rather than by a filter on
    // it. A CSS filter is the other half of the same problem: it forces its own
    // raster, and that raster is what gets stretched. This is a fill, and a
    // fill has no resolution.
    var tint = el('div', null,
      'position:absolute;inset:0;background:rgba(9,12,24,.34);pointer-events:none;');
    stage.appendChild(tint);

    // The viewBox is the map's own shape, not a square, so the frames' world
    // units map to the screen with one scale on both axes. A square viewBox
    // stretched into a rectangular box turns every circle into an ellipse and
    // shears anything rotated — which markers are.
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    var vbH = 100 * (aspect || 1);
    svg.setAttribute('viewBox', '0 0 100 ' + vbH.toFixed(3));
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.dataset.vbh = vbH;
    svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
    stage.appendChild(svg);

    var head = el('div', null,
      'position:absolute;top:0;left:0;right:0;display:flex;justify-content:space-between;' +
      'align-items:center;padding:5px 7px;font-size:11px;font-weight:800;color:#fff;' +
      'letter-spacing:.04em;background:linear-gradient(180deg,rgba(0,0,0,.72),rgba(0,0,0,0));');
    wrap.appendChild(head);

    // The squads the map itself had no room to name. A circle the size of a
    // coin with eleven squads in it cannot carry eleven plates, and the ones it
    // cannot carry are named here instead, with a colour swatch tying each line
    // back to its arrow.
    var side = el('div', null,
      'position:absolute;right:6px;top:26px;display:none;flex-direction:column;gap:2px;' +
      'font-size:9.5px;font-weight:700;line-height:1.25;color:#eef2fb;text-shadow:0 1px 2px #000;' +
      'pointer-events:none;max-width:44%;text-align:right;');
    wrap.appendChild(side);

    var feed = el('div', null,
      'position:absolute;left:7px;bottom:6px;display:flex;flex-direction:column;' +
      'align-items:flex-start;gap:3px;pointer-events:none;');
    wrap.appendChild(feed);

    var handle = {wrap:wrap, stage:stage, svg:svg, head:head, side:side, feed:feed,
                  lines:[], scale:1, mapPixels:0};

    // How many pixels across the map actually is. The camera reads it to decide
    // how far in it is worth going: magnifying an island past its own
    // resolution buys a larger blur and nothing else. Read off the image rather
    // than written down, so a sharper map raises the ceiling by arriving.
    img.addEventListener('load', function(){ handle.mapPixels = img.naturalWidth || 0; });
    if(img.complete && img.naturalWidth) handle.mapPixels = img.naturalWidth;

    // Zooming in on the map, for when the circle is a coin and nine squads are
    // standing in it. Off unless the caller asks: taking the wheel away from a
    // page whose replay is one card among many is worse than not zooming.
    //
    // A hand on the wheel takes the camera off play() for good. Two things
    // writing one transform is a fight the viewer always loses.
    if(opts.zoom) addZoom(wrap, stage, handle);

    container.appendChild(wrap);
    return handle;
  }

  // Stroke widths are in screen pixels — non-scaling-stroke makes them so — and
  // they were being given user units. 0.45 of a pixel is not a line, which is
  // why the safe zone was all but invisible however big the circle was.
  function circle(cx, cy, r, stroke, widthPx, dash, fill){
    var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', r);
    c.setAttribute('fill', fill || 'none');
    c.setAttribute('stroke', stroke);
    c.setAttribute('stroke-width', widthPx);
    c.setAttribute('vector-effect', 'non-scaling-stroke');
    if(dash) c.setAttribute('stroke-dasharray', dash);
    return c;
  }

  // The rectangle with the safe circle punched out of it, by the even-odd rule.
  // One path, so there is no mask to keep in step and nothing to clip.
  function outsideCircle(vbW, vbH, cx, cy, r){
    return 'M0 0 H' + vbW + ' V' + vbH + ' H0 Z ' +
           'M' + (cx - r) + ' ' + cy +
           ' a' + r + ' ' + r + ' 0 1 0 ' + (r*2) + ' 0' +
           ' a' + r + ' ' + r + ' 0 1 0 ' + (-r*2) + ' 0 Z';
  }

  // The storm, as the game draws it: everything outside the safe circle washed
  // purple, everything inside left alone — and a magenta rim burning along the
  // edge, fading outward.
  //
  // The rim is the whole point. The real map has no line on the safe zone; what
  // marks it is the wall itself, glowing on the storm side. Without it this
  // rendering had a hard flat step from island to purple that read as a fill
  // boundary rather than as something you die in, which is why every attempt to
  // make the edge visible ended up drawing a ring on top of it instead.
  //
  // It is a radial gradient rather than a blur filter or a stack of strokes.
  // A filter is recomputed every frame over a full-page SVG; stacked strokes
  // were the first attempt and they failed for a better reason — a stroke is
  // measured in screen pixels, so the band stayed the same handful of pixels
  // wide however big the circle was, and the alphas piled up into exactly the
  // hard pink ring this is meant to replace. The gradient is measured in the
  // map's own units, so the glow is proportional to the circle: wide and soft
  // around the first one, tight around the last.
  var seq = 0;
  function stormFill(vbW, vbH, cx, cy, r){
    var d = outsideCircle(vbW, vbH, cx, cy, r);
    var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', d);
    p.setAttribute('fill-rule', 'evenodd');
    p.setAttribute('fill', 'rgba(150,54,214,.44)');
    g.appendChild(p);

    // How far the burn reaches past the wall, in map units. Proportional, with
    // a floor so the endgame circles keep an edge at all and a ceiling so the
    // opening one does not wash half the island.
    var gw = Math.max(0.55, Math.min(r * 0.09, 2.4));
    var R = r + gw, inner = r / R;
    var id = 'zr-rim-' + (++seq);

    var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    var grad = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
    grad.setAttribute('id', id);
    grad.setAttribute('gradientUnits', 'objectBoundingBox');
    [[0, 'rgba(255,86,214,0)'],
     [inner * 0.995, 'rgba(255,86,214,0)'],
     [inner, 'rgba(255,150,240,.6)'],
     [inner + (1 - inner) * 0.35, 'rgba(255,86,214,.3)'],
     [1, 'rgba(214,60,200,0)']].forEach(function(s){
      var st = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      st.setAttribute('offset', s[0]);
      st.setAttribute('stop-color', s[1]);
      grad.appendChild(st);
    });
    defs.appendChild(grad);
    g.appendChild(defs);

    var rim = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    rim.setAttribute('cx', cx); rim.setAttribute('cy', cy); rim.setAttribute('r', R);
    rim.setAttribute('fill', 'url(#' + id + ')');
    g.appendChild(rim);
    return g;
  }

  function pad2(n){ return (n < 10 ? '0' : '') + n; }

  // The feed is built as markup so a name can carry its squad's colour, so
  // anything interpolated into it has to be escaped on the way in.
  function esc(t){ return String(t == null ? '' : t)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  // Team names carry markup in the app — a flag image sits inside them — and an
  // SVG text node escapes rather than renders it, so the tag would be printed
  // out literally. Everything drawn here goes through this first.
  function plain(name){ return String(name == null ? '' : name).replace(/<[^>]+>/g, '').trim(); }

  // A stable colour per squad, by the golden angle. Neighbouring indices land
  // far apart on the wheel, so fifty squads on one island stay distinguishable
  // and — the point of this — the same squad is the same colour all match, which
  // is what lets you follow one across the rotations.
  function hueFor(i){ return (i * 137.508) % 360; }
  function colourFor(i){ return 'hsl(' + hueFor(i).toFixed(0) + ' 85% 62%)'; }

  // Ink that can actually be read on a given pill. The first version hard-coded
  // near-black, which is right for the generated colours — they are all 62%
  // lightness — and wrong for yours, because yours is the theme accent and in
  // All FNCS that is a dark blue. Black on dark blue is not a label.
  //
  // var(--accent) has to be resolved before it can be measured, so the accent is
  // read off the document once and cached.
  var accentCache = null;
  function resolve(colour){
    if(colour.indexOf('var(') !== 0) return colour;
    if(accentCache == null){
      accentCache = (getComputedStyle(document.documentElement)
        .getPropertyValue('--accent') || '#3f62ca').trim();
    }
    return accentCache;
  }
  function luminance(colour){
    var c = resolve(colour);
    var m = c.match(/^#([0-9a-f]{6})$/i);
    if(m){
      var n = parseInt(m[1], 16);
      return (0.2126*((n>>16)&255) + 0.7152*((n>>8)&255) + 0.0722*(n&255)) / 255;
    }
    var h = c.match(/hsl\(\s*([\d.]+)[\s,]+([\d.]+)%[\s,]+([\d.]+)%/i);
    if(h) return Number(h[3]) / 100;      // lightness is close enough to rank these
    return 0.5;
  }
  function inkOn(colour){ return luminance(colour) > 0.55 ? '#0b0e18' : '#ffffff'; }

  // The field the endgame starts at: at this many squads the replay slows down
  // and the camera comes in. Nothing to do with the names any more — those are
  // laid out by the room they find rather than by how many are left.
  var LABEL_BELOW = 12;

  // How long a list beside the map is allowed to get before there is nowhere
  // left to put the names at all.
  var SIDE_MAX = 28;

  // The zoom at which two squads standing on the same roof are far enough apart
  // on screen to be worth fanning out. See cluster().
  var NAME_ZOOM = 2.2;

  // The squad marker: the arrowhead the real map uses, pointing the way the
  // squad is travelling. A heading is worth more than a dot here — the whole
  // subject is rotations, and an arrow says who is already moving to the next
  // circle and who is still sitting on their ground.
  //
  // Drawn nose-right in local units and rotated into place, with a concave back
  // so it reads as a chevron rather than a wedge at the size these end up.
  //
  // Longer in the nose and deeper in the notch than the first one, because with
  // the names off the map the arrow is the only thing carrying a squad: which
  // way it points has to be readable at a glance rather than worked out. The
  // corners are rounded off by the join rather than by the path, so the shape
  // stays one straight-edged silhouette and does not go soft at small sizes.
  var MARKER = 'M 2.35 0 L -1.5 -1.55 L -0.75 0 L -1.5 1.55 Z';

  // Drawn against the camera, not with it. Zooming in is for telling two squads
  // apart when they are standing on the same roof — magnifying the arrows along
  // with the ground would put them back on top of each other, three times the
  // size. So the marker keeps its size on screen and the ground grows past it.
  // Two paths, not one. The under-copy is the same shape drawn as a fat stroke
  // in near-black, which puts a hard dark edge around the arrow whatever it is
  // standing on — pale sand, dark water, or the purple wash of the storm. A
  // single stroked path could not do it: a stroke straddles the outline, so
  // half of it eats into the colour, and thickening it until the edge read
  // turned a small arrow into a blob. Widths are in screen pixels, which is
  // what non-scaling-stroke means, so the outline stays one crisp pixel-and-a-
  // half at every zoom the camera reaches.
  function marker(x, y, angle, fill, isYou, scale){
    var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    var where = 'translate(' + x.toFixed(3) + ' ' + y.toFixed(3) + ') ' +
                'rotate(' + angle.toFixed(1) + ') ' +
                'scale(' + ((isYou ? 1.3 : 0.95) / (scale || 1)).toFixed(4) + ')';
    g.setAttribute('transform', where);

    var under = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    under.setAttribute('d', MARKER);
    under.setAttribute('fill', 'rgba(6,8,16,.92)');
    under.setAttribute('stroke', 'rgba(6,8,16,.92)');
    under.setAttribute('stroke-width', isYou ? 3 : 2.1);
    under.setAttribute('stroke-linejoin', 'round');
    under.setAttribute('vector-effect', 'non-scaling-stroke');
    g.appendChild(under);

    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', MARKER);
    p.setAttribute('fill', fill);
    // Yours carries a white rim on top of the dark one, the way it carries a
    // white ring everywhere else it appears.
    p.setAttribute('stroke', isYou ? '#ffffff' : fill);
    p.setAttribute('stroke-width', isYou ? 1.5 : 0.5);
    p.setAttribute('stroke-linejoin', 'round');
    p.setAttribute('vector-effect', 'non-scaling-stroke');
    g.appendChild(p);
    return g;
  }

  // --- kill feed, built the way the game's own feed is: a pill for each side
  // with a badge between them. A name is far easier to find in a coloured pill
  // than in a run of text, and the pill carries the same colour as that squad's
  // marker, so a line in the feed and an arrow on the map are the same object.
  var BADGE = {
    kill:  {bg:'#ec1e79', svg:'<circle cx="7" cy="7" r="3.1" fill="none" stroke="#fff" stroke-width="1.8"/>' +
                              '<path d="M7 0.7v2.4M7 10.9V13.3M0.7 7h2.4M10.9 7h2.4" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>'},
    // A bolt for surge, a droplet for the storm. The two were the same glyph in
    // two colours, and a bolt reads as electricity — which is the surge, not the
    // wall you walked into.
    storm: {bg:'#6b58d6', svg:'<path d="M7 1.2c3.1 3.9 4 5.9 4 7.3a4 4 0 0 1-8 0c0-1.4.9-3.4 4-7.3z" fill="#fff"/>'},
    surge: {bg:'#e8a020', svg:'<path d="M7.6 1.4 3.2 8h3l-.8 4.6L11 6H8z" fill="#fff"/>'}
  };

  function badge(kind){
    var b = BADGE[kind] || BADGE.kill;
    return '<span style="display:inline-flex;align-items:center;justify-content:center;' +
      'width:18px;height:18px;border-radius:6px;flex:none;background:' + b.bg + ';' +
      'box-shadow:0 1px 3px rgba(0,0,0,.55);">' +
      '<svg viewBox="0 0 14 14" width="13" height="13">' + b.svg + '</svg></span>';
  }

  function pill(name, colour, isYou){
    return '<span style="display:inline-block;padding:2px 7px;border-radius:4px;' +
      'background:' + colour + ';color:' + inkOn(colour) + ';font-size:10.5px;font-weight:800;' +
      'white-space:nowrap;max-width:150px;overflow:hidden;text-overflow:ellipsis;' +
      'box-shadow:0 1px 3px rgba(0,0,0,.5)' + (isYou ? ',0 0 0 1.5px #fff' : '') + ';">' +
      esc(name) + '</span>';
  }

  function feedRow(inner){
    return '<div style="display:flex;align-items:center;gap:5px;">' + inner + '</div>';
  }

  // The counters the real overlay carries: players left, then squads left.
  function counter(iconSvg, now, total){
    return '<span style="display:inline-flex;align-items:center;gap:3px;' +
      'background:rgba(8,12,24,.62);border-radius:5px;padding:1px 6px 1px 4px;">' +
      '<svg viewBox="0 0 12 12" width="9" height="9" style="flex:none;">' + iconSvg + '</svg>' +
      '<b style="font-size:11px;">' + now + '</b>' +
      '<span style="font-size:9px;opacity:.62;">/' + total + '</span></span>';
  }
  var ICON_PLAYER = '<circle cx="6" cy="3.3" r="2.1" fill="#8fd0ff"/>' +
                    '<path d="M1.6 11c0-2.6 2-4.2 4.4-4.2S10.4 8.4 10.4 11z" fill="#8fd0ff"/>';
  var ICON_SQUAD  = '<circle cx="3.6" cy="3.4" r="1.9" fill="#7de3a8"/>' +
                    '<circle cx="8.6" cy="3.9" r="1.6" fill="#7de3a8" opacity=".75"/>' +
                    '<path d="M0.4 10.6c0-2.3 1.5-3.7 3.3-3.7s3.3 1.4 3.3 3.7z" fill="#7de3a8"/>' +
                    '<path d="M7.2 10.6c0-1.9 1-3 2.3-3s2.1 1.1 2.1 3z" fill="#7de3a8" opacity=".75"/>';

  // Turns "cause:victim" strings into feed rows and appends them to the
  // handle's running feed. Shared by draw(), which reads events off a frame as
  // it plays, and note(), which is handed events that were never part of a
  // frame at all — one code path so a pre-game death and an in-game one render
  // identically.
  function pushEvents(handle, events, roster){
    if(!events || !events.length) return;
    roster = roster || [];
    var indexOfName = {};
    for(var n=0;n<roster.length;n++) indexOfName[plain(roster[n].name)] = n;
    var pillFor = function(name){
      var idx = indexOfName[name];
      if(idx == null) return pill(name, '#c9d2e6', false);
      return pill(name, roster[idx].you ? 'var(--accent)' : colourFor(idx), roster[idx].you);
    };
    for(var e=0;e<events.length;e++){
      // Strip the markup before splitting, not after. A team name carries a flag
      // image, so the raw name holds `<img src="https://…">` — and that `https:`
      // is the first colon in the string. Splitting first cut the killer's name
      // in half and printed the wreckage: the feed read `<img src="https` beside
      // `//flagcdn.com/w40/fr…` instead of two squads. Tags out first, and the
      // only colon left is the one this format put there.
      // Each half is trimmed on its own: the tag sat between the name and the
      // colon, so removing it leaves a space that would miss the roster lookup
      // and cost the squad its colour.
      var raw = plain(events[e]);
      var cut = raw.indexOf(':');
      var cause = plain(raw.slice(0, cut)), victim = plain(raw.slice(cut + 1));
      var row = (cause === 'storm' || cause === 'surge')
        ? badge(cause) + pillFor(victim)
        : pillFor(cause) + badge('kill') + pillFor(victim);
      handle.lines.push(feedRow(row));
    }
    while(handle.lines.length > 4) handle.lines.shift();
    handle.feed.innerHTML = handle.lines.join('');
  }

  // --- squads standing on the same ground
  //
  // The collapse pulls everybody to one point, so the last five squads of a
  // game are at identical coordinates: one arrow drawn five times, and a header
  // that says five are alive above a map showing one. No amount of zoom
  // separates coordinates that are equal.
  //
  // So a cluster is fanned onto a small ring — in screen terms, not map terms,
  // which is what keeps it honest: the fan is the width of a marker, the same
  // few pixels whatever the camera is doing, and it says "several here" rather
  // than moving anybody anywhere the eye can measure. Only while zoomed in,
  // because at full map a two-unit nudge is 2% of the island and the overlap
  // was never the problem there.
  var FAN = 2.2;                 // ring radius, in user units before the camera
  // How close two squads have to be to count as one cluster. Wider than the
  // fan, because what collides is the names and a name is several marker widths
  // long: at the fan's own width it grouped only squads standing on the same
  // pixel and left every pair a unit apart printing over each other.
  var NAME_SEP = 4.2;

  function cluster(dots, scale){
    var out = [], i;
    if(scale < NAME_ZOOM){
      for(i=0;i<dots.length;i++) if(dots[i].alive) out.push([i]);
      return out;
    }
    // Greedy against the group's first squad rather than a grid of buckets.
    // Buckets were the first version and they miss the case they exist for: two
    // squads a marker apart, either side of a bucket edge, are further apart in
    // the index than two squads at opposite corners of the same bucket.
    var sep = NAME_SEP / scale, heads = [];
    for(i=0;i<dots.length;i++){
      if(!dots[i].alive) continue;
      var joined = false;
      for(var h=0;h<heads.length;h++){
        var dx = dots[i].x - heads[h].x, dy = dots[i].y - heads[h].y;
        if(dx*dx + dy*dy <= sep*sep){ out[h].push(i); joined = true; break; }
      }
      if(joined) continue;
      heads.push(dots[i]);
      out.push([i]);
    }
    return out;
  }

  function offsetIn(group, at, scale){
    if(group.length < 2) return {dx: 0, dy: 0};
    var r = FAN / scale, a = (at / group.length) * Math.PI * 2;
    return {dx: Math.cos(a) * r, dy: Math.sin(a) * r};
  }

  // --- names, as the kill feed writes them
  //
  // Coloured text with a dark outline was the first version and it is not
  // legible on this map. The generated colours are all one lightness by
  // construction, the island underneath them is not, and a five-pixel letter
  // in a mid-tone hue over grass, rock and water is a smudge with an outline
  // around it. The feed has never had this problem, because the feed puts the
  // name in a filled pill and picks ink that can be read on it — so the map
  // does the same, and a line in the feed and a label on the map become the
  // same object drawn twice.
  //
  // The pill is sized off the character count rather than off a measurement.
  // getBBox() forces layout of the SVG per label per frame, which is fifty of
  // them ten times a second, and a bold sans is close enough to 0.58em a
  // character for a name that is a handful of them.
  // 2.5 was the first size and it was legible and far too heavy: thirty-one
  // pills over a zone-7 circle is a wall of labels with a map behind it. The
  // fill is what makes a name readable here, not the size of it, so the size
  // came back down until the markers were the loudest thing on the map again.
  var NAME_SIZE = 2.05;        // user units before the camera, so ~11px on screen
  var CHAR_W = 0.58, PAD_X = 0.55, PAD_Y = 0.36, LINE = 1.12;

  // A duo is two handles, and the app joins them with an ampersand — which on
  // one line is a pill fifteen characters wide, half a circle across at the
  // zoom the endgame plays at. Stacked, the pill is as wide as the longer
  // handle and twice as tall, which is the shape a map has room for.
  //
  // Yours arrives with the app's own "your squad" prefix in front of it. That
  // belongs on a standings row, where it says which line is yours among a
  // hundred; on the map the white ring already says it, and the prefix is
  // three times the length of what it introduces.
  // Real handles are not five characters long. "Aegis Kijarssf" and
  // "SNKGOATT" are what the field is actually made of, and a pill is as wide as
  // its longest line — so the line is cut to something a map can carry and the
  // list beside the map, which has a whole column to itself, keeps them whole.
  var HANDLE_MAX = 11;

  function clip(handle){
    handle = handle.trim();
    return handle.length > HANDLE_MAX ? handle.slice(0, HANDLE_MAX - 1) + '…' : handle;
  }

  function nameLines(name, isYou, full){
    var text = plain(name);
    if(isYou){
      var colon = text.indexOf(': ');
      if(colon > 0) text = text.slice(colon + 2);
    }
    var parts = text.split(' & ');
    // Trios and squads: the first handle, then the rest of the roster count,
    // because four names stacked is a column, not a label.
    if(parts.length > 2) parts = [parts[0], '+' + (parts.length - 1)];
    if(full) return parts;
    for(var i=0;i<parts.length;i++) parts[i] = clip(parts[i]);
    return parts;
  }

  // The nameplate the game itself draws over a player: a near-black plate, the
  // name on it in white, and a health bar under the name. It replaces a pill
  // filled with the squad's colour, which was reported unreadable twice — and
  // it is the better answer for the reason the game arrived at it. A coloured
  // fill has to be legible against fifty hues of island and against whatever
  // ink the hue allows; a dark plate is legible against everything, and the
  // colour goes where it costs nothing: a stripe down the edge, tying the plate
  // back to its arrow.
  //
  // The bar is the squad's health, which the engine has always tracked and the
  // frames now carry. Storm and surge are what move it, so a plate with a short
  // bar is a squad that is out of position or being pushed by surge.
  var PLATE_BG = 'rgba(9,12,20,.86)', PLATE_LINE = 'rgba(255,255,255,.18)';
  var BAR_H = 0.42, BAR_GAP = 0.28, STRIPE = 0.5;   // fractions of the font size

  // How tall a plate of this many lines comes out. Shared with the code that
  // stacks them into a column, which used to carry its own guess at it and got
  // it wrong the moment the plate grew a health bar — every row overlapped the
  // one above.
  function plateHeight(lineCount, fs){
    return fs * (1 + (lineCount - 1) * LINE) + PAD_Y * fs * 2 + fs * BAR_H + fs * BAR_GAP;
  }

  // What a plate of these lines would take up, worked out before anything is
  // drawn. The placement below has to know how much room a name wants before it
  // can decide whether there is any.
  function plateSize(lines, fs){
    var widest = 0;
    for(var n=0;n<lines.length;n++) widest = Math.max(widest, lines[n].length);
    var stripe = fs * STRIPE;
    var textW = widest * CHAR_W * fs;
    return {w: textW + PAD_X * fs * 2 + stripe, h: plateHeight(lines.length, fs),
            textW: textW, stripe: stripe};
  }

  // Drawn from its top-left corner rather than from the squad it belongs to,
  // because by this point somebody else has already decided where it goes.
  function plate(left, top, lines, colour, isYou, fs, hp){
    var size = plateSize(lines, fs);
    var barH = fs * BAR_H;
    var stripe = size.stripe, textW = size.textW, w = size.w, h = size.h;

    var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    var r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    r.setAttribute('x', left.toFixed(3)); r.setAttribute('y', top.toFixed(3));
    r.setAttribute('width', w.toFixed(3)); r.setAttribute('height', h.toFixed(3));
    r.setAttribute('rx', (fs * 0.22).toFixed(3));
    r.setAttribute('fill', PLATE_BG);
    r.setAttribute('stroke', isYou ? '#ffffff' : PLATE_LINE);
    r.setAttribute('stroke-width', isYou ? 1.5 : 0.75);
    r.setAttribute('vector-effect', 'non-scaling-stroke');
    g.appendChild(r);

    // The squad's colour, as a stripe down the left edge.
    var key = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    key.setAttribute('x', (left + fs * 0.16).toFixed(3));
    key.setAttribute('y', (top + fs * 0.2).toFixed(3));
    key.setAttribute('width', (stripe * 0.55).toFixed(3));
    key.setAttribute('height', (h - fs * 0.4).toFixed(3));
    key.setAttribute('rx', (stripe * 0.27).toFixed(3));
    key.setAttribute('fill', colour);
    g.appendChild(key);

    var textLeft = left + stripe + PAD_X * fs;
    var first = top + PAD_Y * fs + fs * 0.79;
    for(var k=0;k<lines.length;k++){
      var t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t.setAttribute('x', textLeft.toFixed(3));
      t.setAttribute('y', (first + k * fs * LINE).toFixed(3));
      t.setAttribute('font-size', fs.toFixed(3));
      t.setAttribute('font-weight', '700');
      t.setAttribute('fill', '#ffffff');
      // The second handle is the same name one rank quieter, so a duo reads as
      // one plate rather than as two squads stacked.
      if(k) t.setAttribute('opacity', '.78');
      t.textContent = lines[k];
      g.appendChild(t);
    }

    // The bar, on its own track, the way the game draws it.
    var barY = top + h - PAD_Y * fs - barH;
    var track = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    track.setAttribute('x', textLeft.toFixed(3)); track.setAttribute('y', barY.toFixed(3));
    track.setAttribute('width', textW.toFixed(3)); track.setAttribute('height', barH.toFixed(3));
    track.setAttribute('rx', (barH * 0.4).toFixed(3));
    track.setAttribute('fill', 'rgba(255,255,255,.16)');
    g.appendChild(track);

    var frac = Math.max(0, Math.min(1, (hp == null ? 100 : hp) / 100));
    if(frac > 0){
      var bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bar.setAttribute('x', textLeft.toFixed(3)); bar.setAttribute('y', barY.toFixed(3));
      bar.setAttribute('width', (textW * frac).toFixed(3));
      bar.setAttribute('height', barH.toFixed(3));
      bar.setAttribute('rx', (barH * 0.4).toFixed(3));
      // Green while it is health and amber once it is a problem, which is the
      // one thing the game's own bar cannot say and this map can.
      bar.setAttribute('fill', frac > 0.35 ? '#4ade80' : '#f0a537');
      g.appendChild(bar);
    }
    return g;
  }

  // --- where each name goes
  //
  // Every fixed arrangement of many names has been tried on this map and every
  // one was reported unreadable, because they all decide the layout before
  // looking at it: a plate hung above each arrow overlaps the moment two squads
  // are a name apart, and a column beside a cluster is a wall of text the
  // moment the cluster is ten squads deep. The fix for that was to stop drawing
  // them, which left an island of anonymous arrows — and that was reported too.
  //
  // So no arrangement is decided in advance. A name is offered eight places
  // around its own arrow and takes the first one that is free — free of the
  // other plates already down, free of everybody else's arrow, and inside what
  // the camera is showing. A squad with nowhere to put its name keeps its arrow
  // and is named in the list beside the map instead, so nobody goes unnamed and
  // nothing is printed on top of anything else.
  //
  // Order matters, because the ones asked first get the good ground: yours, and
  // then outwards from yours. What a map is read for is who is around you, and
  // if a name has to be given up it should be the one furthest from the fight.
  var GAP_PX = 6;        // between an arrow and its own plate, in screen pixels
  var ARROW_PX = 8;      // how much room an arrow keeps to itself, likewise
  var PLATE_PX = 2;      // and between two plates, so they never touch

  // The share of the visible box the plates may cover between them. This is the
  // difference between a labelled map and a wall of labels, and it is the one
  // number worth turning: at 0.35 the early game is the wall that was reported,
  // at 0.08 the endgame loses names it has room for. It is a share of the box
  // rather than a count of squads on purpose — the same rule then names four
  // squads on a full island and eleven in a zone-8 circle, which is what a
  // count could never do.
  var INK = 0.18;

  // The zone the rest of the field gets its names. Before it the map carries
  // one name and it is yours, because until the circle is small the question a
  // viewer has is "where am I and where is it closing to" and fifty answers to
  // a question nobody asked is the wall this has been reported as twice. From
  // zone 10 the question changes to who is left in there with you, and that is
  // a question worth putting the names back for — the replay slows down at the
  // same zone for the same reason.
  //
  // Yours is exempt at every zone. It is the one name that is never a crowd.
  var NAME_ZONE = 10;

  // The eight places a plate is offered, in the order it is offered them:
  // above first, because that is where the game itself puts a nameplate and
  // where the eye looks for one, then the sides, then below, then the corners.
  function slotAt(k, x, y, w, h, gx, gy){
    var dx = gx * 0.7, dy = gy * 0.7;
    switch(k){
      case 0: return {left: x - w/2,      top: y - gy - h};
      case 1: return {left: x + gx,       top: y - h/2};
      case 2: return {left: x - gx - w,   top: y - h/2};
      case 3: return {left: x - w/2,      top: y + gy};
      case 4: return {left: x + dx,       top: y - dy - h};
      case 5: return {left: x - dx - w,   top: y - dy - h};
      case 6: return {left: x + dx,       top: y + dy};
      default:return {left: x - dx - w,   top: y + dy};
    }
  }

  // The thread from a plate back to the arrow it belongs to. A plate that could
  // not go straight above its squad has gone wherever there was room, and in a
  // circle with a dozen squads in it "wherever there was room" is not obviously
  // anybody's — the thread is what makes it obvious. Drawn from the nearest
  // point of the plate's own edge, so it is as short as it can be, and under the
  // plates rather than over them.
  function leader(x, y, r, colour){
    var ex = Math.min(Math.max(x, r.left), r.left + r.w);
    var ey = Math.min(Math.max(y, r.top), r.top + r.h);
    var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    for(var k=0;k<2;k++){
      var l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      l.setAttribute('x1', x.toFixed(3)); l.setAttribute('y1', y.toFixed(3));
      l.setAttribute('x2', ex.toFixed(3)); l.setAttribute('y2', ey.toFixed(3));
      l.setAttribute('stroke', k ? colour : 'rgba(6,8,16,.85)');
      l.setAttribute('stroke-width', k ? 1 : 2.6);
      l.setAttribute('stroke-linecap', 'round');
      l.setAttribute('vector-effect', 'non-scaling-stroke');
      g.appendChild(l);
    }
    return g;
  }

  function overlaps(a, b, pad){
    return a.left - pad < b.left + b.w && b.left - pad < a.left + a.w &&
           a.top  - pad < b.top  + b.h && b.top  - pad < a.top  + a.h;
  }

  // Returns {plates: {index: {left, top, lines, hp}}, slots: {index: k}}. The
  // slots come back so the next frame can offer each squad the place it had
  // last time first: without that a plate flips from over its arrow to under it
  // as a neighbour drifts past, and a map of names blinking between two
  // positions is harder to read than no names at all.
  function placeNames(frame, roster, at, scale, view, ux, uy, memory, reserved){
    var fs = NAME_SIZE / scale;
    var gx = GAP_PX * ux, gy = GAP_PX * uy;
    var ax = ARROW_PX * ux, ay = ARROW_PX * uy;
    var padX = PLATE_PX * ux;
    var taken = reserved.slice(), plates = {}, slots = {}, i;
    var budget = (view.x1 - view.x0) * (view.y1 - view.y0) * INK;

    var me = -1;
    for(i=0;i<roster.length;i++) if(roster[i] && roster[i].you){ me = i; break; }
    // With nobody flagged as yours, the middle of the safe circle stands in for
    // it: that is where the game is.
    var from = (me >= 0 && at[me]) ? at[me]
             : (frame.circle ? {x: frame.circle.cx, y: frame.circle.cy}
                             : {x: 50, y: (view.y0 + view.y1) / 2});
    var order = [];
    for(i=0;i<frame.dots.length;i++){
      if(!frame.dots[i].alive || !at[i]) continue;
      var dx = at[i].x - from.x, dy = at[i].y - from.y;
      order.push({i: i, d: (i === me ? -1 : dx*dx + dy*dy)});
    }
    order.sort(function(a, b){ return a.d - b.d; });

    function free(r, self){
      if(r.left < view.x0 || r.top < view.y0 ||
         r.left + r.w > view.x1 || r.top + r.h > view.y1) return false;
      for(var t=0;t<taken.length;t++) if(overlaps(r, taken[t], padX)) return false;
      for(var a=0;a<order.length;a++){
        var j = order[a].i;
        if(j === self) continue;
        var q = at[j];
        if(q.x < r.left - ax || q.x > r.left + r.w + ax) continue;
        if(q.y < r.top  - ay || q.y > r.top  + r.h + ay) continue;
        return false;
      }
      return true;
    }

    var others = frame.zone >= NAME_ZONE;
    for(var k=0;k<order.length;k++){
      var idx = order[k].i, who = roster[idx] || {}, p = at[idx];
      if(idx !== me && !others) continue;
      // Off the edge of what the camera is showing: there is no point naming a
      // squad the viewer cannot see.
      if(p.x < view.x0 || p.x > view.x1 || p.y < view.y0 || p.y > view.y1) continue;
      var lines = nameLines(who.name, who.you);
      if(!lines.length || !lines[0]) continue;
      var box = plateSize(lines, fs);
      var ink = box.w * box.h;
      // Yours is drawn whatever is left, because the one name the map has
      // always carried is the one you are watching.
      if(ink > budget && idx !== me) continue;
      var tries = [], was = memory[idx];
      if(was != null) tries.push(was);
      for(var s=0;s<8;s++) if(s !== was) tries.push(s);
      var spot = null;
      for(var t=0;t<tries.length && !spot;t++){
        var r = slotAt(tries[t], p.x, p.y, box.w, box.h, gx, gy);
        r.w = box.w; r.h = box.h; r.k = tries[t];
        if(free(r, idx)) spot = r;
      }
      // Yours is drawn even when there is nowhere for it. Everybody else gives
      // their name up to the list rather than print it over a neighbour, but
      // the squad the viewer is following is the one thing the map is answering
      // — so it takes the place above its arrow, pulled inside the frame, and
      // the arrows underneath give way to it. It is drawn after them, so what
      // it covers is an arrow and never another name.
      if(!spot && idx === me){
        spot = slotAt(was == null ? 0 : was, p.x, p.y, box.w, box.h, gx, gy);
        spot.w = box.w; spot.h = box.h; spot.k = was == null ? 0 : was;
        spot.left = Math.min(Math.max(spot.left, view.x0), view.x1 - box.w);
        spot.top  = Math.min(Math.max(spot.top,  view.y0), view.y1 - box.h);
      }
      if(!spot) continue;
      taken.push(spot);
      budget -= ink;
      plates[idx] = {left: spot.left, top: spot.top, w: box.w, h: box.h,
                     x: p.x, y: p.y, lines: lines, fs: fs};
      slots[idx] = spot.k;
    }
    return {plates: plates, slots: slots};
  }

  function aliveIndices(frame){
    var out = [];
    for(var i=0;i<frame.dots.length;i++) if(frame.dots[i].alive) out.push(i);
    return out;
  }

  // The squads still standing that the map found no room to name.
  function leftovers(frame, plates){
    var out = [];
    for(var i=0;i<frame.dots.length;i++) if(frame.dots[i].alive && !plates[i]) out.push(i);
    return out;
  }

  // The parts of the box that are not the map: the header band across the top,
  // the kill feed in the bottom corner, and one row of the list beside it. In
  // screen pixels, because that is what they are — they sit outside the stage
  // and do not move when the camera does.
  var HEAD_PX = 26, FEED_PX = 78, ROW_PX = 14;

  function draw(handle, frame, labels, roster){
    roster = roster || [];
    handle.svg.innerHTML = '';
    var vbH = Number(handle.svg.dataset.vbh) || 100;

    // Storm first, so the circles and everybody's markers sit on top of it.
    handle.svg.appendChild(stormFill(100, vbH,
      frame.circle.cx, frame.circle.cy, frame.circle.radius));
    // One ring on the map, and it is the circle you have to run to.
    //
    // The zone you are standing in does not get a line, because it does not
    // need one: the storm wash above already ends exactly on it, and an edge
    // between purple and island reads as a wall on its own. Everything drawn on
    // top of that was decoration — first a six-pixel pink rim, then a white
    // line, then a dashed one — and each of them was louder than the squads,
    // which are what the map is for.
    //
    // The dark line under the white is not a second ring. It is the shadow that
    // keeps a hairline legible against both sides of itself: the island is
    // pale, the storm is purple, and a white thread crossing both needs
    // something to sit on.
    if(frame.next){
      handle.svg.appendChild(circle(frame.next.cx, frame.next.cy, frame.next.radius,
        'rgba(12,8,26,.45)', 3.4));
      handle.svg.appendChild(circle(frame.next.cx, frame.next.cy, frame.next.radius,
        'rgba(255,255,255,.96)', 1.6));
    }

    // The arrows first, all of them, and the names on top afterwards — an
    // arrow drawn over a name is the thing that was reported: "не видно ников
    // из-за стрелочек". Nothing on this map may cover a name.
    var scale = handle.scale || 1;
    var groups = cluster(frame.dots, scale);
    var at = [], i;

    for(var g=0;g<groups.length;g++){
      var grp = groups[g];
      for(var m=0;m<grp.length;m++){
        var d;
        i = grp[m]; d = frame.dots[i];
        var who = roster[i] || {};
        var off = offsetIn(grp, m, scale);
        at[i] = {x: d.x + off.dx, y: d.y + off.dy};
        handle.svg.appendChild(marker(at[i].x, at[i].y, d.a || 0,
          who.you ? 'var(--accent)' : colourFor(i), who.you, scale));
      }
    }

    // The room the names are laid out in is the room on screen, so the box is
    // measured in the frames' own units: the header band across the top and the
    // kill feed in the corner are put down as occupied before a single name is,
    // because a plate behind either of them is a plate nobody can read.
    var view = handle.view || {x0: 0, y0: 0, x1: 100, y1: vbH};
    var boxW = handle.wrap.clientWidth || 520;
    var boxH = handle.wrap.clientHeight || (boxW * vbH / 100);
    var ux = (100 / boxW) / scale, uy = (vbH / boxH) / scale;
    var vw = view.x1 - view.x0, vh = view.y1 - view.y0;
    var chrome = [
      {left: view.x0, top: view.y0, w: vw, h: HEAD_PX * uy},
      {left: view.x0, top: view.y1 - FEED_PX * uy, w: vw * 0.52, h: FEED_PX * uy}
    ];

    // Twice, because the list beside the map is drawn where the plates want to
    // be and its height is not known until the plates have been tried: the
    // first pass says how many squads the map could not name, and the second
    // keeps that many rows of the right-hand column clear for them.
    var mem = handle.slots || {};
    var put = placeNames(frame, roster, at, scale, view, ux, uy, mem, chrome);
    var spare = leftovers(frame, put.plates);
    if(spare.length && frame.alive <= SIDE_MAX){
      var band = Math.min(vh - HEAD_PX * uy, spare.length * ROW_PX * uy);
      put = placeNames(frame, roster, at, scale, view, ux, uy, mem,
        chrome.concat([{left: view.x1 - vw * 0.46, top: view.y0 + HEAD_PX * uy,
                        w: vw * 0.46, h: band}]));
      spare = leftovers(frame, put.plates);
    }
    handle.slots = put.slots;

    // Threads first, then the plates, so a thread ends under the plate it
    // belongs to and never crosses the name on it.
    for(i=0;i<frame.dots.length;i++){
      if(put.plates[i])
        handle.svg.appendChild(leader(put.plates[i].x, put.plates[i].y, put.plates[i],
          (roster[i] || {}).you ? '#ffffff' : colourFor(i)));
    }

    for(i=0;i<frame.dots.length;i++){
      var pl = put.plates[i];
      if(!pl) continue;
      var node = plate(pl.left, pl.top, pl.lines,
        (roster[i] || {}).you ? 'var(--accent)' : colourFor(i),
        !!(roster[i] || {}).you, pl.fs, frame.dots[i].h);
      // Which squad a plate belongs to, so the checks can tell the map's names
      // from the list's without reading the text back out of them.
      node.setAttribute('data-squad', i);
      handle.svg.appendChild(node);
    }

    // The list beside the map is where the squads the map had no room for get
    // their names back, once the field is short enough to list. A swatch per
    // line ties each name to the arrow wearing that colour. Nobody is in both:
    // a name on the map and the same name in the list is the same fact printed
    // twice, in the two places the map is shortest of room.
    if(handle.side){
      var listed = frame.alive <= SIDE_MAX ? spare : [];
      if(!listed.length){
        handle.side.style.display = 'none'; handle.side.innerHTML = '';
      } else {
        var rows = [];
        for(var kk=0;kk<listed.length;kk++){
          var k = listed[kk];
          var r = roster[k] || {};
          // Whole handles here: the list has a column to itself and does not
          // have to fit over anybody's ground.
          var nm = nameLines(r.name, r.you, true).join(' & ');
          if(!nm) continue;
          var col = r.you ? 'var(--accent)' : colourFor(k);
          rows.push('<div data-squad="' + k + '" style="display:flex;align-items:center;gap:4px;justify-content:flex-end;">' +
            (r.you
              ? '<span style="padding:0 5px;border-radius:3px;background:var(--accent);' +
                'color:' + inkOn('var(--accent)') + ';box-shadow:0 0 0 1px rgba(255,255,255,.65);">' +
                esc(nm) + '</span>'
              : '<span>' + esc(nm) + '</span>') +
            '<span style="width:0;height:0;flex:none;border-style:solid;' +
              'border-width:4px 0 4px 7px;border-color:transparent transparent transparent ' + col +
              ';filter:drop-shadow(0 0 1px rgba(0,0,0,.9));"></span></div>');
        }
        handle.side.innerHTML = rows.join('');
        handle.side.style.display = 'flex';
      }
    }

    var secs = frame.secondsLeft;
    var totS = roster.totalSquads || frame.dots.length;
    var totP = roster.totalPlayers || totS;
    handle.head.innerHTML =
      '<span style="display:flex;align-items:center;gap:7px;">' +
        '<span>' + esc(labels.zone) + ' ' + frame.zone + '</span>' +
        '<span style="opacity:.8;font-variant-numeric:tabular-nums;">' +
          Math.floor(secs/60) + ':' + pad2(secs % 60) + '</span></span>' +
      '<span style="display:flex;align-items:center;gap:5px;">' +
        counter(ICON_PLAYER, (frame.players != null ? frame.players : frame.alive), totP) +
        counter(ICON_SQUAD, frame.alive, totS) + '</span>';

    pushEvents(handle, frame.events, roster);
  }

  // A frame that was never recorded, made from the two either side of it.
  //
  // The engine keeps every eighth tick, and a tick is two seconds, so recorded
  // frames are sixteen game-seconds apart — far enough that a squad crosses
  // several times its own size between them and the replay reads as a slideshow
  // of jumps. Nothing is missing from the recording; what is missing is the
  // drawing in between, and that costs nothing to work out.
  //
  // Everything that has a position is carried across: the storm, the circle it
  // is closing to, and every marker with its heading. They have to move
  // together — interpolating the markers alone would slide them over a storm
  // edge that was still jumping, which reads worse than the jumps did.
  function lerp(a, b, k){ return a + (b - a) * k; }

  function lerpCircle(a, b, k){
    if(!a || !b) return a || b || null;
    return {cx: lerp(a.cx, b.cx, k), cy: lerp(a.cy, b.cy, k), radius: lerp(a.radius, b.radius, k)};
  }

  function between(a, b, k, keepEvents){
    if(!b || k <= 0) return keepEvents ? a : shallowNoEvents(a);
    var dots = [];
    for(var i=0;i<a.dots.length;i++){
      var d = a.dots[i], e = b.dots[i] || d;
      // A squad that dies between the two frames stays where it fell rather than
      // gliding to wherever its corpse's coordinates happen to be.
      var moving = d.alive && e.alive;
      var turn = ((((e.a || 0) - (d.a || 0)) % 360) + 540) % 360 - 180;
      dots.push({
        x: moving ? lerp(d.x, e.x, k) : d.x,
        y: moving ? lerp(d.y, e.y, k) : d.y,
        alive: d.alive,
        a: (d.a || 0) + turn * k,
        // Health does slide between frames: it is a quantity that was on its
        // way somewhere, unlike a kill or a place.
        h: moving ? lerp(d.h == null ? 100 : d.h, e.h == null ? 100 : e.h, k)
                  : (d.h == null ? 100 : d.h),
        // Not interpolated. A kill is a whole number that happened at a moment,
        // and a place is a fact; sliding either one between frames would put a
        // squad on two and a half eliminations and half of eighth place.
        e: d.e || 0,
        p: d.p || 0
      });
    }
    return {
      zone: a.zone,
      // The clock only runs down inside a phase; across a phase boundary it
      // resets upward, and sliding it there would run the timer backwards.
      secondsLeft: b.secondsLeft <= a.secondsLeft
        ? Math.round(lerp(a.secondsLeft, b.secondsLeft, k)) : a.secondsLeft,
      alive: a.alive,
      players: a.players,
      circle: lerpCircle(a.circle, b.circle, k),
      next: lerpCircle(a.next, b.next, k),
      dots: dots,
      // The kill feed is a list of things that happened, not a thing with a
      // position: it is printed once, on the frame that recorded it.
      events: keepEvents ? a.events : null
    };
  }

  function shallowNoEvents(f){
    var out = {}, key;
    for(key in f) if(Object.prototype.hasOwnProperty.call(f, key)) out[key] = f[key];
    out.events = null;
    return out;
  }

  // Drawing more often than this buys nothing anybody can see and costs a full
  // rebuild of the layer each time.
  var MIN_DRAW_MS = 28;

  // --- how fast to play each frame
  //
  // One speed for the whole match spends the same eight seconds on the circle
  // nobody fought in as on the endgame, and twelve of those is a minute and a
  // half of mostly waiting. What is worth watching is the part you are in.
  //
  // Which part that is gets read off what happened, not off where anybody is
  // standing. Standing next to somebody was the first rule and it does not
  // work: measured over a hundred and twenty recorded games, another squad is
  // within contact range of yours in half of all frames, and dropping the range
  // to two world units only takes that to 43%. That is the same finding the
  // engine itself rests on — squads fight when the circle stops leaving them
  // room, not when they are merely near each other — so proximity marks half
  // the match and separates nothing.
  //
  // A fight your squad was in does separate it. The landing fight, the
  // third-party in zone 5 and the last trade of the game are all the same test,
  // and it needs no list of key moments to name them.
  //
  // The endgame is slow whether or not you are still in it: by then everybody
  // left is in the same circle and there is nothing left to skip past. Where it
  // starts is LABEL_BELOW, the same count that puts the names of who is left up
  // beside the map — the point the replay stops being a field and starts being
  // a list of squads is the point it is worth watching at all.
  var LEAD = 2, TRAIL = 1;      // frames of run-up and of aftermath around a fight of yours
  // 2.4x was the first setting and it reads as rushed: the quiet stretch is
  // where a rotation is legible, and at 38ms a frame the map redraws faster
  // than a squad's heading can be followed across it. 1.6 keeps the saving
  // worth having without turning the mid-game into a flicker.
  var PACE_FAST = 1.6, PACE_SLOW = 1;
  // And a gear between them, from the zone where the game changes character.
  // Zones 1 to 4 close inside the circle they came from, so rotating is a
  // choice of where to stand; from zone 5 the circle is smaller than its own
  // drift and lands somewhere else entirely, so everybody has to cross the
  // lobby. That is where a replay stops being fifty squads sitting on their
  // ground and starts being the game, and it is worth a little more time.
  var PACE_LATE = 1.2;
  var LATE_ZONE = 5;
  // And a gear below the fight, for the last circles. From NAME_ZONE the map
  // has the whole field's names on it and there are a dozen squads in a circle
  // the size of a coin — the point of the replay by then is not what happened
  // but whether yours is still in it, and that is watched rather than read. At
  // 1 it goes by before the question lands. Half speed puts about two seconds
  // on the last three zones, which is the part worth having.
  //
  // Applied last and as a floor rather than as an assignment, so a fight of
  // yours in zone 11 cannot speed the replay back up to fight pace.
  var PACE_CLOSE = 0.5;

  // --- and where to point the camera
  //
  // The same two moments, seen closer. A fifty-duo island drawn into 520 pixels
  // gives a duo about four pixels of it, which is enough to follow a rotation
  // and not enough to watch a fight: in the last circles the arrows overlap
  // outright. So the map moves in on what the pacing already decided is worth
  // the time, and everything else plays wide.
  //
  // The camera holds longer than the pacing does. A fight window is four frames
  // — under half a second — and zooming in and back out inside that reads as a
  // pump rather than as a camera. It leads by the same two frames and lingers
  // for five.
  var LEAD_CAM = 2, TRAIL_CAM = 5;
  var FIGHT_NEAR = 6;      // world units — who else is in the shot when you are fighting
  // The tightest the shot ever gets. 5 pinned it against ZOOM_MAX, which made
  // every fight the closest the camera can physically go and read as a jump
  // rather than a move; 7 lands a fight at about the same distance the endgame
  // settles on, so the two look like one camera.
  var FIGHT_MIN = 7;
  var LATE_MIN = 6.5;      // the endgame, where the circle itself is under a unit across
  var VIEW_MARGIN = 1.35;  // room around whatever is being fitted

  // The smallest circle holding both of two circles. Used to keep the zone you
  // are standing in and the one you are running to in the same shot.
  function enclose(a, b){
    if(!a) return b; if(!b) return a;
    var dx = b.cx - a.cx, dy = b.cy - a.cy, d = Math.sqrt(dx*dx + dy*dy);
    if(d + b.r <= a.r) return a;
    if(d + a.r <= b.r) return b;
    var r = (a.r + b.r + d) / 2;
    // How far along the line from a to b the new centre sits.
    var k = d ? (r - a.r) / d : 0;
    return {cx: a.cx + dx * k, cy: a.cy + dy * k, r: r};
  }

  // The smallest circle holding a set of points. Not the true one — the
  // bounding box's is a fraction wide — but a fight is two or three squads and
  // the margin is larger than the error.
  function fitAround(pts, floor){
    if(!pts.length) return null;
    var minx = pts[0].x, maxx = minx, miny = pts[0].y, maxy = miny;
    for(var i=1;i<pts.length;i++){
      if(pts[i].x < minx) minx = pts[i].x; else if(pts[i].x > maxx) maxx = pts[i].x;
      if(pts[i].y < miny) miny = pts[i].y; else if(pts[i].y > maxy) maxy = pts[i].y;
    }
    var dx = (maxx - minx) / 2, dy = (maxy - miny) / 2;
    return {cx: minx + dx, cy: miny + dy,
            r: Math.max(floor, Math.sqrt(dx*dx + dy*dy) * VIEW_MARGIN)};
  }

  // The speed and the shot for every frame, worked out once. It has to be the
  // whole timeline rather than a frame at a time, because slowing down on the
  // frame a kill is printed is slowing down after it: the run-up is the part
  // worth seeing, and the camera has to already be there when it starts.
  //
  // A view is `{cx, cy, r}` in world units — show at least this much around
  // this point — or null for the whole map. Turning that into a scale belongs
  // to whoever knows the size of the box, which is not this.
  function directTrack(timeline, roster){
    var n = timeline.length, out = new Array(n), i, j;
    for(i=0;i<n;i++) out[i] = {pace: PACE_FAST, view: null, fight: false};
    roster = roster || [];
    var me = -1;
    for(i=0;i<roster.length;i++) if(roster[i] && roster[i].you){ me = i; break; }
    var mine = me >= 0 ? plain(roster[me].name) : null;

    function markAround(at){
      for(j = Math.max(0, at - LEAD); j <= Math.min(n - 1, at + TRAIL); j++) out[j].pace = PACE_SLOW;
      for(j = Math.max(0, at - LEAD_CAM); j <= Math.min(n - 1, at + TRAIL_CAM); j++) out[j].fight = true;
    }

    for(i=0;i<n;i++){
      var f = timeline[i];
      if(f.zone >= LATE_ZONE) out[i].pace = PACE_LATE;
      if(f.alive <= LABEL_BELOW) out[i].pace = PACE_SLOW;
      var ev = f.events;
      if(!ev || !ev.length) continue;
      for(var e=0;e<ev.length;e++){
        var raw = plain(ev[e]), cut = raw.indexOf(':');
        // Either side of it: the kill you got and the one that got you.
        // With nobody flagged as yours — a replay watched rather than played —
        // every death in the lobby counts, which is the same rule with the
        // whole field as the subject.
        if(mine == null ||
           plain(raw.slice(0, cut)) === mine || plain(raw.slice(cut + 1)) === mine){
          markAround(i);
          break;
        }
      }
    }

    // The last circles, after everything else has had its say: a floor on the
    // speed rather than a setting of it, so nothing above can put it back up.
    for(i=0;i<n;i++)
      if(timeline[i].zone >= NAME_ZONE) out[i].pace = Math.min(out[i].pace, PACE_CLOSE);

    for(i=0;i<n;i++){
      var fr = timeline[i], dots = fr.dots, k, pts = [];
      // Your fight: you and whoever is close enough to be in it. A squad
      // already dead still has its last position, which is what the shot holds
      // on for the seconds after you go down.
      if(out[i].fight && me >= 0 && dots[me]){
        var d = dots[me];
        pts.push(d);
        for(k=0;k<dots.length;k++){
          if(k === me || !dots[k] || !dots[k].alive) continue;
          var ax = dots[k].x - d.x, ay = dots[k].y - d.y;
          if(ax*ax + ay*ay <= FIGHT_NEAR*FIGHT_NEAR) pts.push(dots[k]);
        }
        out[i].view = fitAround(pts, FIGHT_MIN);
        continue;
      }
      // The endgame: everybody still standing, which tightens on its own as the
      // circle collects them rather than needing a schedule.
      if(fr.alive <= LABEL_BELOW){
        for(k=0;k<dots.length;k++) if(dots[k] && dots[k].alive) pts.push(dots[k]);
        out[i].view = fitAround(pts, LATE_MIN);
        continue;
      }
      // From zone 5, the circle and the circle it is closing to, together.
      //
      // Both, and that is the whole of it. Zones 1 to 4 close inside the circle
      // they came from, so framing the one you are standing in shows the one
      // you are running to for free. From zone 5 the drift is larger than the
      // new radius and the next circle lands somewhere else entirely — frame
      // the current one and the map hides the only thing anybody is looking at.
      // Held together, the shot opens at about 3.4x when the two are far apart
      // and closes to the floor as they converge, which is the zoom-in this
      // asks for arriving on its own rather than on a schedule.
      if(fr.zone >= LATE_ZONE && fr.circle){
        var v = enclose({cx: fr.circle.cx, cy: fr.circle.cy, r: fr.circle.radius},
                        fr.next ? {cx: fr.next.cx, cy: fr.next.cy, r: fr.next.radius} : null);
        // And your own squad, wherever it is. Late for the rotation is exactly
        // when you want to see yourself, and a shot you have run out of is a
        // shot of somebody else's game.
        if(me >= 0 && dots[me] && dots[me].alive)
          v = enclose(v, {cx: dots[me].x, cy: dots[me].y, r: 1.5});
        out[i].view = {cx: v.cx, cy: v.cy, r: Math.max(LATE_MIN, v.r * 1.12)};
      }
    }
    return out;
  }

  // How long the camera takes to arrive. Long enough to read as a camera and
  // not as a cut; short enough that a fight it is moving to is still on.
  var CAM_EASE_MS = 360;

  // Screen pixels each pixel of the map may be stretched across before the
  // camera stops going in. See ceiling() below.
  var MAX_UPSCALE = 2;

  // Drives one handle's stage transform from a view. The view is in world
  // units and knows nothing about the box; this is the only part that does.
  //
  // The pan is clamped exactly as the hand-driven zoom clamps it, so the edge
  // of the island can never be dragged into the middle of the frame — a squad
  // fighting in the corner of the map is shown against the corner of the map.
  function newCamera(handle){
    var at = null;                      // {cx, cy, r}, where the camera is now

    function box(){
      var vbH = Number(handle.svg.dataset.vbh) || 100;
      var W = handle.wrap.clientWidth || 520;
      var H = handle.wrap.clientHeight || (W * vbH / 100);
      return {vbH: vbH, W: W, H: H};
    }
    function wide(b){ return {cx: 50, cy: b.vbH/2, r: b.vbH/2}; }

    // The most the map can be magnified before it is mush. MAX_UPSCALE is how
    // many screen pixels one of its own may be stretched across: at 1 the map
    // is never enlarged at all and the endgame is too wide to read, at 3 it is
    // the blur that was reported. 2 is the compromise, and it is measured
    // rather than picked — a 1100-pixel island in a 520-pixel box gives 4.2x,
    // and the same rule gives 6.2x the day a 1600-pixel map replaces it.
    function ceiling(b){
      if(!handle.mapPixels) return ZOOM_MAX;
      return Math.max(1, (handle.mapPixels / b.W) * MAX_UPSCALE);
    }

    return {
      // k is how much of the way to move this step; 1 cuts straight there.
      to: function(view, k){
        if(handle.byHand) return;       // a hand on the wheel owns the transform
        var b = box(), want = view || wide(b);
        // The first frame of a game arrives where it is meant to be rather than
        // sliding in from wherever the last game finished.
        if(at === null) at = {cx: want.cx, cy: want.cy, r: want.r};
        else {
          k = Math.max(0, Math.min(1, k));
          at.cx += (want.cx - at.cx) * k;
          at.cy += (want.cy - at.cy) * k;
          at.r  += (want.r  - at.r ) * k;
        }
        // The box holds the whole map at scale 1, so fitting a radius means
        // fitting it on the tighter of the two axes — the shorter one, since
        // the viewBox is the map's own shape.
        //
        // And never past what the map has pixels for. The island is 1100 across
        // and the box about 520, so at 6.8x the camera was showing 162 source
        // pixels stretched over 520 — a three-fold magnification, which is
        // where "плохо видно при зуме" comes from. Everything drawn on top is
        // vector and stays sharp whatever this says; it is the photograph
        // underneath that runs out, so the ceiling is the photograph's.
        var s = Math.max(1, Math.min(ZOOM_MAX, ceiling(b), (b.vbH/2) / Math.max(0.001, at.r)));
        var tx = b.W/2 - (at.cx/100) * b.W * s;
        var ty = b.H/2 - (at.cy/b.vbH) * b.H * s;
        tx = Math.min(0, Math.max(b.W - b.W*s, tx));
        ty = Math.min(0, Math.max(b.H - b.H*s, ty));
        handle.scale = s;
        setView(handle, tx, ty, s);
        handle.stage.style.transform =
          'translate(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px) scale(' + s.toFixed(4) + ')';
      }
    };
  }

  function play(handle, timeline, opts){
    opts = opts || {};
    var frameMs = opts.frameMs || 90;
    // `pace: false` plays the whole match at one speed and never moves the
    // camera off the whole map.
    var track = opts.pace === false ? null : directTrack(timeline, opts.roster);
    function beat(i){
      return track ? track[Math.max(0, Math.min(track.length-1, i))] : {pace:1, view:null};
    }
    var camera = newCamera(handle);
    // Starting the feed over used to happen right here, unconditionally. That
    // breaks the moment a caller wants this game's feed to open on something
    // that never came from a frame — the landing fights, pushed via note()
    // before this is ever called — since an unconditional clear would wipe
    // them out before the first frame even drew. So clearing the feed is the
    // caller's job now, via clearFeed(), done before anything is noted for
    // the game about to play.
    if(handle.side){ handle.side.innerHTML = ''; handle.side.style.display = 'none'; }

    var smooth = opts.smooth !== false &&
                 timeline.length > 1 &&
                 frameMs >= MIN_DRAW_MS * 1.5 &&
                 !(typeof matchMedia === 'function' &&
                   matchMedia('(prefers-reduced-motion: reduce)').matches);

    return new Promise(function(resolve){
      function show(frame){
        draw(handle, frame, opts.labels, opts.roster);
        // The observer is caller code and runs inside the timer callback that
        // owns this promise: a throw here would take the scheduler with it, and
        // the promise would neither resolve nor reject — a tournament waiting on
        // it would wait for ever. Drawing first also means a broken observer
        // costs its own updates and not the map.
        if(opts.onFrame){ try { opts.onFrame(frame); } catch(err){ } }
      }

      function finish(){
        if(timeline.length) show(timeline[timeline.length-1]);
        resolve();
      }

      if(!smooth){
        var i = 0;
        (function next(){
          if(i >= timeline.length || (opts.isSkipped && opts.isSkipped())){ finish(); return; }
          // Cut rather than glide, for a reader who has asked for no motion.
          camera.to(beat(i).view, 1);
          show(timeline[i++]);
          // How long the frame is held, rather than how it is animated between
          // — so the pacing still applies where the interpolation does not.
          setTimeout(next, frameMs / beat(i - 1).pace);
        })();
        return;
      }

      // Driven by a timer against a clock rather than by animation frames.
      // Animation frames stop dead in a hidden tab, and this promise is what a
      // tournament waits on before it plays the next game — a run left in a
      // background tab would never come back. A timer is throttled there
      // instead of frozen, so the replay finishes slowly and the run goes on,
      // which is the behaviour the page has always had.
      // The clock accumulates rather than being read off the start time, because
      // the speed changes as it goes: elapsed-since-started only tells you where
      // you would be if it never had.
      var last = null, at = 0, speed = null, shown = -1, lastDraw = -1e9;
      var clock = (typeof performance !== 'undefined' && performance.now)
        ? function(){ return performance.now(); } : function(){ return Date.now(); };

      (function step(){
        if(opts.isSkipped && opts.isSkipped()){ finish(); return; }
        var now = clock();
        if(last === null) last = now;
        // Capped: a tab that was in the background resumes where it left off
        // instead of jumping the rest of the match in one step.
        var dt = Math.min(now - last, 250);
        last = now;
        var beat0 = beat(Math.floor(at));
        // Eased into rather than switched, so a change of speed reads as the
        // replay slowing down and not as a dropped frame.
        speed = speed === null ? beat0.pace
                               : speed + (beat0.pace - speed) * Math.min(1, dt / 220);
        camera.to(beat0.view, dt / CAM_EASE_MS);
        at += dt / frameMs * speed;
        var i = Math.floor(at);
        if(i >= timeline.length - 1){ finish(); return; }
        var fresh = i !== shown;
        if(fresh || now - lastDraw >= MIN_DRAW_MS){
          shown = i; lastDraw = now;
          show(between(timeline[i], timeline[i+1], at - i, fresh));
        }
        setTimeout(step, MIN_DRAW_MS / 2);
      })();
    });
  }

  function unmount(handle){
    if(handle && handle.wrap && handle.wrap.parentNode) handle.wrap.parentNode.removeChild(handle.wrap);
  }

  // One frame, drawn where it is. Unlike play() this leaves the kill feed
  // alone, so a caller driving its own clock can put a frame on the screen
  // without wiping the list of who has just died — which is what a caller that
  // reached for play() one frame at a time was doing to itself.
  function show(handle, frame, opts){
    opts = opts || {};
    draw(handle, frame, opts.labels, opts.roster);
  }

  // Start the feed over: for a scrub, where the frames about to arrive are not
  // the ones that filled it.
  function clearFeed(handle){
    handle.lines.length = 0;
    handle.feed.innerHTML = '';
  }

  // Push feed rows that never came from a frame — the landing fights the
  // engine resolves before the timeline starts. Call this after clearFeed()
  // and before play(): play() no longer starts the feed over on its own, so
  // whatever is noted here is still there when the first frame draws.
  function note(handle, events, roster){
    pushEvents(handle, events, roster);
  }

  root.ZoneReplay = {mount:mount, play:play, unmount:unmount,
                     between:between, show:show, clearFeed:clearFeed, note:note,
                     directTrack:directTrack};
})(typeof globalThis !== 'undefined' ? globalThis : this);
