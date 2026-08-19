/* Build the Europe ping map.

   Source: Eurostat GISCO, CNTR_RG_10M_2020_4326 — the European Commission's own
   country geometry. Natural Earth was here first and drew Crimea as Russian,
   which is its default point of view; GISCO draws the borders the EU recognises,
   so Crimea and the Donbas are Ukrainian. For a map of European esports that is
   the right authority to follow.

   GISCO uses the EU's country codes rather than ISO: EL for Greece, UK for the
   United Kingdom. Everything else matches. */
const fs=require('fs');
const SRC=process.env.GISCO || __dirname+'/gisco_10M.geojson';
const geo=JSON.parse(fs.readFileSync(SRC,'utf8'));

const WANT={
  de:'DE', at:'AT', nl:'NL', be:'BE', lu:'LU', ch:'CH', cz:'CZ', pl:'PL',
  si:'SI', sk:'SK', se:'SE', hu:'HU', dk:'DK', it:'IT', no:'NO', rs:'RS',
  hr:'HR', ba:'BA', fr:'FR', bg:'BG', me:'ME', fi:'FI', gb:'UK', gr:'EL',
  ad:'AD', ee:'EE', al:'AL', mk:'MK', lv:'LV', ro:'RO', lt:'LT', mt:'MT',
  by:'BY', is:'IS', es:'ES', md:'MD', ie:'IE', ua:'UA', pt:'PT', tr:'TR',
  cy:'CY', ru:'RU', ge:'GE', am:'AM', az:'AZ'
};
const LON0=-26, LON1=82, LAT0=22, LAT1=71.6;              // the frame
const WLON0=-40, WLON1=96, WLAT0=12, WLAT1=81;            // where we actually cut

const byId={};
geo.features.forEach(f=>{ byId[f.properties.CNTR_ID]=f; });

/* Everybody else inside the frame who is inside the reach. The ping for a
   country nobody measured is the fit in tools/build-ping-fit.js — the same
   curve the other six regions are drawn with — and the reach is 150 ms, which
   is his line for where a duo stops being playable at all. */
const REACH=150;
const FIT=JSON.parse(fs.readFileSync(__dirname+'/ping-fit.json','utf8'));
const PLACES=process.env.NE_PLACES;
const CITY={};
if(PLACES && fs.existsSync(PLACES)){
  JSON.parse(fs.readFileSync(PLACES,'utf8')).features.forEach(f=>{
    const pr=f.properties, c=String(pr.ISO_A2||'').toLowerCase(), pop=+pr.POP_MAX||0;
    if(!c || c.length!==2 || !pop || !f.geometry) return;
    const [lon,lat]=f.geometry.coordinates;
    (CITY[c]=CITY[c]||[]).push({pop,lat,lon});
  });
}
const FRA=FIT.servers.EU, RAD=6371, TT=Math.PI/180;
function gkm(a,b){
  const dLat=(b.lat-a.lat)*TT, dLon=(b.lon-a.lon)*TT;
  const q=Math.sin(dLat/2)**2+Math.cos(a.lat*TT)*Math.cos(b.lat*TT)*Math.sin(dLon/2)**2;
  return 2*RAD*Math.asin(Math.min(1,Math.sqrt(q)));
}
// The anchor the fit was made on: the nearest city over a million, or the
// largest where a country has none.
// The same anchor, measured to any server rather than only to Frankfurt.
function anchorTo(c, to){
  const cs=CITY[c]; if(!cs||!cs.length) return null;
  const big=cs.filter(x=>x.pop>=1000000);
  const use=big.length?big:[cs.slice().sort((x,y)=>y.pop-x.pop)[0]];
  return use.reduce((b,x)=>gkm(x,to)<gkm(b,to)?x:b);
}
function anchor(c){
  const cs=CITY[c]; if(!cs||!cs.length) return null;
  const big=cs.filter(x=>x.pop>=1000000);
  const use=big.length?big:[cs.slice().sort((x,y)=>y.pop-x.pop)[0]];
  return use.reduce((b,x)=>gkm(x,FRA)<gkm(b,FRA)?x:b);
}
function seat(c){
  const cs=CITY[c]; return cs&&cs.length ? cs.slice().sort((x,y)=>y.pop-x.pop)[0] : null;
}
// GISCO's id for a two-letter code, where the two differ.
const GID={gb:'UK', gr:'EL'};
const NEW=[];
Object.keys(CITY).forEach(c=>{
  if(WANT[c]) return;
  const id=(GID[c]||c.toUpperCase());
  if(!byId[id]) return;
  const p=seat(c), a=anchor(c);
  if(!p||!a) return;
  if(p.lon<LON0||p.lon>LON1||p.lat<LAT0||p.lat>LAT1) return;
  const ping=Math.max(1, Math.round(FIT.a+FIT.b*gkm(a,FRA)));
  if(ping>REACH) return;
  WANT[c]=id; NEW.push({c, ping});
});
NEW.sort((a,b)=>a.ping-b.ping);
console.log('joined the map ('+NEW.length+'): '+NEW.map(x=>x.c+' '+x.ping).join(' '));
fs.writeFileSync(__dirname+'/eu-new-pings.json', JSON.stringify(NEW));

const missing=Object.entries(WANT).filter(([,id])=>!byId[id]);
if(missing.length){ console.log('NOT FOUND:', missing); process.exit(1); }

function polysOf(f){
  const g=f.geometry;
  if(g.type==='Polygon') return [g.coordinates];
  if(g.type==='MultiPolygon') return g.coordinates;
  return [];
}



// Russia's outline crosses the antimeridian, so its ring jumps from +180 to
// -180 and back. Clipped as-is that jump draws a band straight across the map.
// Unwrapping the longitudes — letting them run past 180 instead of resetting —
// makes the ring continuous again, and the far east then clips away cleanly.
function unwrap(r){
  let off=0; const out=[r[0]];
  for(let i=1;i<r.length;i++){
    const d=r[i][0]-r[i-1][0];
    if(d>180) off-=360; else if(d<-180) off+=360;
    out.push([r[i][0]+off, r[i][1]]);
  }
  // A ring that still does not close went round a pole. Which pole decides where
  // the closure goes: Antarctica closed over the north would wrap the whole
  // world and paint the ocean solid.
  const a=out[0], b=out[out.length-1];
  if(Math.abs(b[0]-a[0])>180){
    let lat=0; for(const q of out) lat+=q[1];
    const pole = lat/out.length < 0 ? -89 : 89;
    out.push([b[0],pole],[a[0],pole]);
  }
  return out;
}

function clipRing(r, keep, inter){
  const out=[];
  for(let i=0;i<r.length;i++){
    const a=r[i], b=r[(i+1)%r.length], ka=keep(a), kb=keep(b);
    if(ka) out.push(a);
    if(ka!==kb) out.push(inter(a,b));
  }
  return out;
}
function clipTo(r,x0,x1,y0,y1){
  const lerp=(a,b,t)=>[a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t];
  r=clipRing(r,p=>p[0]>=x0,(a,b)=>lerp(a,b,(x0-a[0])/(b[0]-a[0])));
  if(!r.length) return r;
  r=clipRing(r,p=>p[0]<=x1,(a,b)=>lerp(a,b,(x1-a[0])/(b[0]-a[0])));
  if(!r.length) return r;
  r=clipRing(r,p=>p[1]>=y0,(a,b)=>lerp(a,b,(y0-a[1])/(b[1]-a[1])));
  if(!r.length) return r;
  r=clipRing(r,p=>p[1]<=y1,(a,b)=>lerp(a,b,(y1-a[1])/(b[1]-a[1])));
  return r;
}
const clip      = r => clipTo(unwrap(r), WLON0, WLON1, WLAT0, WLAT1);  // for drawing
const clipFrame = r => clipTo(unwrap(r), LON0,  LON1,  LAT0,  LAT1);   // for placing labels

const merc=lat=>Math.log(Math.tan(Math.PI/4+lat*Math.PI/360));
const W=1000;
const X=lon=>(lon-LON0)/(LON1-LON0)*W;
const K=W/(LON1-LON0)*(180/Math.PI);
const Y0=merc(LAT1)*K;
const Y=lat=>Y0-merc(lat)*K;
const H=Math.round(Y(LAT0));

function dp(pts, eps){
  if(pts.length<4) return pts;
  const keep=new Array(pts.length).fill(false);
  keep[0]=keep[pts.length-1]=true;
  const st=[[0,pts.length-1]];
  while(st.length){
    const [i,j]=st.pop();
    let best=-1, bd=eps;
    const [x1,y1]=pts[i],[x2,y2]=pts[j];
    const dx=x2-x1, dy=y2-y1, len=Math.hypot(dx,dy)||1;
    for(let k=i+1;k<j;k++){
      const d=Math.abs((pts[k][0]-x1)*dy-(pts[k][1]-y1)*dx)/len;
      if(d>bd){ bd=d; best=k; }
    }
    if(best>=0){ keep[best]=true; st.push([i,best],[best,j]); }
  }
  return pts.filter((_,i)=>keep[i]);
}
// Douglas-Peucker anchors on the two endpoints, so a closed ring — where they
// are the same point — collapses to nothing. Split at the far side first.
function dpRing(pts, eps){
  if(pts.length<8) return pts;
  let far=0, fd=-1;
  for(let i=1;i<pts.length;i++){
    const d=(pts[i][0]-pts[0][0])**2+(pts[i][1]-pts[0][1])**2;
    if(d>fd){ fd=d; far=i; }
  }
  if(far<2 || far>pts.length-2) return dp(pts,eps);
  return dp(pts.slice(0,far+1),eps).concat(dp(pts.slice(far),eps).slice(1));
}

// Where the number goes. A centroid is the wrong answer for a shape like
// Norway or Croatia — it lands in the sea, or in a neighbour. What we want is
// the roomiest point inside the country and inside the frame: the centre of
// the largest circle that fits. Its radius doubles as the label size, so a
// country with a fat middle gets a big number and a thin one gets a small one.
function poleOfInaccessibility(rings, H){
  const inside=(px,py)=>{
    let s=false;
    for(const r of rings)
      for(let i=0,j=r.length-1;i<r.length;j=i++){
        const [xi,yi]=r[i],[xj,yj]=r[j];
        if((yi>py)!==(yj>py) && px<(xj-xi)*(py-yi)/(yj-yi)+xi) s=!s;
      }
    return s;
  };
  const edge=(px,py)=>{
    let m=1e9;
    for(const r of rings)
      for(let i=0,j=r.length-1;i<r.length;j=i++){
        const a=r[j], b=r[i];
        const dx=b[0]-a[0], dy=b[1]-a[1], L=dx*dx+dy*dy;
        let t=L?((px-a[0])*dx+(py-a[1])*dy)/L:0;
        t=t<0?0:t>1?1:t;
        const d=Math.hypot(px-(a[0]+t*dx), py-(a[1]+t*dy));
        if(d<m) m=d;
      }
    return m;
  };
  let bx=0,by=0,bd=-1;
  const scan=(x0,x1,y0,y1,step)=>{
    for(let x=x0;x<=x1;x+=step) for(let y=y0;y<=y1;y+=step){
      if(x<0||x>1000||y<0||y>H||!inside(x,y)) continue;
      const d=Math.min(edge(x,y), x, 1000-x, y, H-y);
      if(d>bd){ bd=d; bx=x; by=y; }
    }
  };
  let lo=[1e9,1e9], hi=[-1e9,-1e9];
  rings.forEach(r=>r.forEach(p=>{
    if(p[0]<lo[0])lo[0]=p[0]; if(p[0]>hi[0])hi[0]=p[0];
    if(p[1]<lo[1])lo[1]=p[1]; if(p[1]>hi[1])hi[1]=p[1];
  }));
  scan(lo[0],hi[0],lo[1],hi[1],4);
  // Andorra and Malta are smaller than the scan step, so the search finds no
  // interior point at all. Fall back to the middle of their box — they get a
  // callout badge anyway, and a missing point would anchor its leader line at
  // the corner of the map.
  if(bd<0) return {x:+((lo[0]+hi[0])/2).toFixed(1), y:+((lo[1]+hi[1])/2).toFixed(1),
                   r:+(Math.min(hi[0]-lo[0], hi[1]-lo[1])/2).toFixed(1)};
  scan(bx-4,bx+4,by-4,by+4,1);
  return {x:+bx.toFixed(1), y:+by.toFixed(1), r:+bd.toFixed(1)};
}

const EPS=0.55;
const out={};
for(const [code,id] of Object.entries(WANT)){
  let d='', minx=1e9,miny=1e9,maxx=-1e9,maxy=-1e9, best=null, bestA=0;
  const framed=[];
  polysOf(byId[id]).forEach(poly=>{
    poly.forEach((r,ri)=>{
      const c=clip(r);
      if(c.length<4) return;
      let pts=dpRing(c.map(([lon,lat])=>[X(lon),Y(lat)]), EPS);
      if(pts.length<4) return;
      let A=0;
      for(let i=0;i<pts.length;i++){ const p=pts[i],q=pts[(i+1)%pts.length]; A+=p[0]*q[1]-q[0]*p[1]; }
      if(Math.abs(A)/2<0.7) return;
      d+='M'+pts.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join('L')+'Z';
      // Labels are measured on the framed shape, not the drawn one, so a country
      // that runs off the edge is still numbered where you can see it.
      const fr=clipFrame(r);
      if(fr.length<4) return;
      const fp=dpRing(fr.map(([lon,lat])=>[X(lon),Y(lat)]), EPS);
      framed.push(fp);
      fp.forEach(p=>{ if(p[0]<minx)minx=p[0]; if(p[0]>maxx)maxx=p[0];
                      if(p[1]<miny)miny=p[1]; if(p[1]>maxy)maxy=p[1]; });
      if(ri===0){
        let fa=0;
        for(let i=0;i<fp.length;i++){ const p=fp[i],q=fp[(i+1)%fp.length]; fa+=p[0]*q[1]-q[0]*p[1]; }
        fa=Math.abs(fa)/2;
        if(fa>bestA){ bestA=fa; best=fp; }
      }
    });
  });
  if(!d){ console.log('too small to draw, dropped:', code); delete WANT[code]; continue; }
  const pole=poleOfInaccessibility(framed, H);
  const cx=pole.x, cy=pole.y;
  // The flag fills the biggest visible piece, not the whole bounding box. Russia
  // runs off the top of the frame, so a flag fitted to its full box hides the
  // white stripe off-canvas, and Norway owns Jan Mayen eight hundred kilometres
  // out to sea, which stretches its box across half the map.
  let px=minx, py=miny, pw=maxx-minx, ph=maxy-miny;
  if(best){
    let a=1e9,b=1e9,c=-1e9,e=-1e9;
    best.forEach(q=>{ if(q[0]<a)a=q[0]; if(q[0]>c)c=q[0]; if(q[1]<b)b=q[1]; if(q[1]>e)e=q[1]; });
    px=a; py=b; pw=c-a; ph=e-b;
  }
  out[code]={d, cx, cy, r:pole.r,
             w:+(maxx-minx).toFixed(1), h:+(maxy-miny).toFixed(1),
             px:+px.toFixed(1), py:+py.toFixed(1), pw:+pw.toFixed(1), ph:+ph.toFixed(1)};
}

// Backdrop: every country in frame, drawn flat and grey, so the map reads as a
// map and not as a scatter of flags floating in blue.
let landD='';
geo.features.forEach(f=>{
  polysOf(f).forEach(poly=>{
    poly.forEach(r=>{
      const c=clip(r); if(c.length<4) return;
      let pts=dpRing(c.map(([lon,lat])=>[X(lon),Y(lat)]), 1.1);
      if(pts.length<4) return;
      let A=0; for(let i=0;i<pts.length;i++){const p=pts[i],q=pts[(i+1)%pts.length];A+=p[0]*q[1]-q[0]*p[1];}
      if(Math.abs(A)/2<4) return;
      landD+='M'+pts.map(p=>p[0].toFixed(0)+' '+p[1].toFixed(0)).join('L')+'Z';
    });
  });
});

console.log('H='+H+'  land='+landD.length+'  paths='+
  Object.values(out).reduce((s,o)=>s+o.d.length,0));
console.log('label room: '+Object.entries(out).map(([c,o])=>c+':'+o.r).join(' '));
fs.writeFileSync(__dirname+'/map.json', JSON.stringify({H, land:landD, c:out}));
