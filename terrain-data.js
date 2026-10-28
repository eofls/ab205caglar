import {AIRFIELD_FEATURES,AIRFIELD_GREEN} from './assets/terrain/guvercinlik-osm.js';
import {GUV_DEM} from './assets/terrain/guvercinlik-dem.js';
/* v0.37 Güvercinlik gerçek arazisi (Copernicus GLO-30): pist orta noktasına göre yükseklik; meydan çekirdeği (çit içi)
   eski düz pist yüzeyi olarak kalır, dışarı 450 m'de gerçek araziye geçer. */
const GDEM=(()=>{const dec=g=>{const b=typeof atob==='function'?Uint8Array.from(atob(g.data),c=>c.charCodeAt(0)):new Uint8Array(Buffer.from(g.data,'base64'));return {R:g.R,N:g.N,a:new Int16Array(b.buffer,b.byteOffset,b.byteLength/2)};};return {inner:dec(GUV_DEM.inner),outer:dec(GUV_DEM.outer)};})();
function gridAt(g,x,z){const f=(g.N-1)/(2*g.R),fx=Math.max(0,Math.min(g.N-1.0001,(x+g.R)*f)),fz=Math.max(0,Math.min(g.N-1.0001,(z+g.R)*f)),i=Math.floor(fx),j=Math.floor(fz),u=fx-i,v=fz-j,N=g.N,A=g.a;
 return ((A[j*N+i]*(1-u)+A[j*N+i+1]*u)*(1-v)+(A[(j+1)*N+i]*(1-u)+A[(j+1)*N+i+1]*u)*v)*GUV_DEM.scale;}
export function airfieldRealHeight(x,z){const ai=Math.max(Math.abs(x),Math.abs(z));if(ai<GDEM.inner.R-60)return gridAt(GDEM.inner,x,z);if(ai<GDEM.inner.R){const k=(ai-(GDEM.inner.R-60))/60;return gridAt(GDEM.inner,x,z)*(1-k)+gridAt(GDEM.outer,x,z)*k;}return gridAt(GDEM.outer,x,z);}
const AERO=AIRFIELD_FEATURES.filter(f=>f.tags.aeroway==='apron'||f.tags.aeroway==='taxiway');
import {REAL_AREAS} from './real-area.js';
import {TEPE_SITES} from './assets/terrain/tepeler-sites.js';
export {TEPE_SITES};
/* v0.39 Arazi sahası gerçek Gölbaşı verisi (real-area.js): OSM yapı / yol / hat / su; eski ızgara kaldırıldı */
export const FEATURES=REAL_AREAS.terrain.features;
export const DEM={lat:REAL_AREAS.terrain.lat0,lon:REAL_AREAS.terrain.lon0,baseElevationM:REAL_AREAS.terrain.base};
const REAL=a=>REAL_AREAS[a]??null;
/* MSL elevation (m) of a point: base of the area frame + local height */
export function areaElevationM(x,z,area){const r=REAL(area);if(r)return r.base+terrainHeight(x,z,area);if(area==='airfield')return 818.8+terrainHeight(x,z,area);return 914+terrainHeight(x,z,area);}
export function insidePolygon(x,z,points){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
export function landCoverAt(x,z,area="terrain"){if(REAL(area)){const c=REAL(area).surfaceClass(x,z);return c===4?'water':c===5?'built':'steppe';}if(area==="water")return islandHeight(x,z)>0?"steppe":"water";if(area==="forest")return "forest";if(WETLANDS.some(f=>insidePolygon(x,z,f.points)))return 'wetland';return 'steppe';}
export function roadAt(x,z){for(const f of FEATURES.filter(f=>f.tags.highway))for(let i=1;i<f.points.length;i++){const a=f.points[i-1],b=f.points[i],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));if(Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz)<(f.tags.highway==='track'?2:3))return f.tags.highway;}return null;}
export function terrainColor(x,z,area="terrain"){if(area==="water"&&islandHeight(x,z)<=0){const w=Math.sin(x*.021+z*.013)*Math.sin(z*.019-x*.008),near=Math.max(0,1-Math.hypot(Math.max(0,Math.abs(x-750)-60),Math.max(0,Math.abs(z+300)-60))/260);return [.12+.03*w+.07*near,.31+.04*w+.06*near,.39+.03*w+.03*near];}
 if(area==="water"){const hh=islandHeight(x,z);return hh<3?[.74,.69,.5]:[.34+hh*.003,.42+hh*.004,.24];}
 if(area==="forest"){const m=Math.sin(x*.031+z*.017)*Math.cos(z*.023-x*.011),st=forestStand(x,z);if(st.kind==='road')return [.56+.03*m,.5+.03*m,.39];if(st.kind==='clearcut'){const k=hash2(Math.floor(x/3),Math.floor(z/3));return [.43+.05*m+.04*k,.39+.04*m+.03*k,.27+.02*k];}if(st.kind==='young')return [.27+.04*m,.36+.04*m,.17];return st.density<.05?[.4+.04*m,.47+.04*m,.27]:[.18+.04*m,.25+.04*m,.12+.025*m];}
 if(REAL(area)){const c=REAL(area).surfaceClass(x,z),t=REAL(area).treeCell(x,z),n=Math.sin(x*.011+z*.007)*Math.cos(z*.009-x*.004)*.5+.5;let b=[[.50,.47,.33],[.47,.33,.22],[.66,.58,.42],[.75,.70,.60],[.20,.30,.30],[.55,.52,.47]][c]??[.5,.47,.33];if(t&&t.d>.25)b=b.map((v,i)=>v*(1-t.d*.6)+[.20,.27,.14][i]*t.d*.6);return b.map(v=>v*(.94+.12*n));}
 if(area==="mountain"){const h=terrainHeight(x,z,area),sl=Math.hypot((terrainHeight(x+6,z,area)-terrainHeight(x-6,z,area))/12,(terrainHeight(x,z+6,area)-terrainHeight(x,z-6,area))/12),n=Math.sin(x*.012+z*.009)*Math.cos(z*.011-x*.005)*.5+.5,hi=Math.max(0,Math.min(1,(h-70)/460)),rock=Math.max(0,Math.min(1,(sl-.18)/.3));const grass=[.23+n*.07,.34+n*.06,.15],alpine=[.40,.36,.25],stone=[.35,.33,.29];return [0,1,2].map(i=>(grass[i]*(1-hi)+alpine[i]*hi)*(1-rock)+stone[i]*rock);}
 if(area==='airfield'){const q=runwayCoordinates(x,z),n=Math.sin(x*.009+z*.004)*Math.cos(z*.007)*.5+.5;if(Math.abs(q.across)<235&&Math.abs(q.along)<1180){const m=(Math.floor(q.along/14)%2+2)%2;return [.36+n*.05+m*.025,.47+n*.05+m*.02,.24+n*.02];}return [.45+n*.08,.47+n*.05,.3+n*.03];}
 const h=terrainHeight(x,z,area),wet=landCoverAt(x,z,area)==='wetland',n=Math.sin(x*.007+z*.003)*Math.cos(z*.006)*.5+.5;return new Array(3).fill(0).map((_,i)=>(wet?[.29,.34,.22]:[.47,.43,.31])[i]+n*.07+h*.00025);}

export const FLIGHT_AREAS={terrain:'Arazi',airfield:'Meydan',forest:'Ormanlık',mountain:'Tepeler',water:'Su üstü'};
export const RUNWAY={heading:64.51*Math.PI/180,length:2017,width:36,lat:39+56/60+7/3600,lon:32+44/60+27/3600};
export function runwayCoordinates(x,z){return {along:x*Math.sin(RUNWAY.heading)-z*Math.cos(RUNWAY.heading),across:x*Math.cos(RUNWAY.heading)+z*Math.sin(RUNWAY.heading)};}
export function islandHeight(x,z){return Math.max(26-((x-750)/7)**2/100-((z+300)/10)**2/100,18-((x+1100)/10)**2/100-((z-500)/8)**2/100, -1);}
// Mountain area (v0.30): massifs + ridged fractal detail; the flight corridor along x≈0 keeps a rougher but
// landable valley floor. Deterministic and shared by physics, collision and rendering.
function hash2(x,z){const s=Math.sin(x*127.1+z*311.7)*43758.5453;return s-Math.floor(s);}
function vnoise2(x,z){const i=Math.floor(x),j=Math.floor(z),u=x-i,v=z-j,su=u*u*(3-2*u),sv=v*v*(3-2*v),a=hash2(i,j),b=hash2(i+1,j),c=hash2(i,j+1),d=hash2(i+1,j+1);return (a+(b-a)*su)*(1-sv)+(c+(d-c)*su)*sv;}
function ridged(x,z){let a=1,f=1/520,s=0,w=1;for(let i=0;i<4;i++){const n=1-Math.abs(vnoise2(x*f+i*7.3,z*f-i*3.1)*2-1),q=n*n*w;s+=q*a;w=Math.min(1,q*1.8);a*=.5;f*=2.07;}return s;}
export function terrainHeight(x,z,area='terrain'){
 if(area==='airfield'){const q=runwayCoordinates(x,z),core=Math.max(-1008.5,Math.min(1008.5,q.along))*(9*.3048/2017);
  const d=Math.max(Math.abs(q.along)-1300,q.across-450,-700-q.across,0),k=Math.min(1,d/450);if(k<=0)return core;const w=k*k*(3-2*k);return core*(1-w)+(airfieldRealHeight(x,z)+1)*w;}
 if(area==='water')return Math.max(0,islandHeight(x,z));
 {const r=REAL(area);if(r)return r.height(x,z)+microRelief(x,z,area)*.5;}
 return REAL_AREAS.terrain.height(x,z)+microRelief(x,z,area); /* orman sahası: Gölbaşı yükseklik ızgarası üzerinde yönetilen orman */
}
/* v0.35.7 arazi: a few gentle tepeler away from the default corridor (x≈0) */
const TR_HILLS=[[-950,-1350,380,26],[1150,-950,420,22],[-1350,750,400,30],[950,1150,380,20],[1650,-1850,450,34],[-1750,-450,420,24],[600,-2300,360,18]];
function terrainHills(x,z){let h=0;for(const [cx,cz,r,a] of TR_HILLS){const d=Math.hypot(x-cx,z-cz)/r;if(d<1.6)h+=a*Math.exp(-d*d*2.2);}return h;}
// Deterministic obstacle positions shared by rendering and collision; AGL remains ground-based.
// ---------------------------------------------------------------------------------------------------------------
// v0.33 world model. One deterministic description of each flight area shared by physics (collision, contact surface),
// the hazır akış pilot (landing-zone choice), the start-position map and the 3D scene.
//   • micro-relief (gullies / mounds) on top of the DEM or procedural relief
//   • vegetation: forest with clearings and meadows, wind-break tree rows on field edges, orchards, lone trees,
//     mountain pines, island trees
//   • buildings (OSM footprints with heights) as collision volumes
//   • surface kinds: paved, field (plowed), stubble, grass, steppe, wetland (soft), rock, sand, forest floor, water
// ---------------------------------------------------------------------------------------------------------------
function fbm(x,z,oct=3){let s=0,a=.5,f=1,n=0;for(let i=0;i<oct;i++){s+=a*vnoise2(x*f+i*17.1,z*f-i*9.7);n+=a;a*=.5;f*=2.03;}return s/n;}
export function microRelief(x,z,area){if(globalThis.EXP?.noMicro)return 0;
 if(area==='airfield'||area==='water')return 0;
 const r=Math.hypot(x,z);let fade=Math.min(1,Math.max(0,(r-40)/140));
 if(!fade)return 0;
 const amp=area==='mountain'?.9:area==='forest'?.6:1.15;
 // broad swells + a narrower gully pattern; amplitude ~±1 m, slopes up to ~5° on their own
 const gully=Math.max(0,1-Math.abs(vnoise2(x/140+9.2,z/140-4.4)-.5)*9);
 return fade*(amp*((fbm(x/80,z/80)-.5)*2+.3*(vnoise2(x/26+5.1,z/26-2.7)-.5)*2)-.9*gully*gully*(area==='mountain'?1.4:1));
}
// ---- field parcels (terrain area): rotated grid, each parcel has a crop/surface and some edges carry tree rows ----
const PARCEL={theta:.21,U:260,V:170};
function parcelUV(x,z){const c=Math.cos(PARCEL.theta),s=Math.sin(PARCEL.theta);return [x*c+z*s,-x*s+z*c];}
function parcelIndex(x,z){const [u,v]=parcelUV(x,z);return [Math.floor(u/PARCEL.U),Math.floor(v/PARCEL.V)];}
export function parcelKind(i,j){const h=hash2(i*3.17+.5,j*5.31+.25);return h<.36?'field':h<.68?'stubble':'grass';}
const rowOnUEdge=(i,j)=>hash2(i*7.7+1.3,j*2.9-4.1)<.3,rowOnVEdge=(i,j)=>hash2(i*4.3-2.2,j*8.1+3.7)<.22;
/* v0.35 field roads (tarla yolları): straight dirt tracks along some parcel edges, shared by the ground texture, the
   surface model (dirt) and the tree rows (poplars stand beside a track, not on it) */
export const trackOnU=i=>i!==0&&hash2(i*2.71+.3,9.1)<.3,trackOnV=j=>j!==0&&hash2(4.4,j*3.33-.7)<.24; // none through the default start point
export const FIELD_TRACK={U:PARCEL.U,V:PARCEL.V,theta:PARCEL.theta,width:4};
export function fieldTrackDist(x,z){const [u,v]=parcelUV(x,z),i=Math.round(u/PARCEL.U),j=Math.round(v/PARCEL.V);let d=Infinity;if(trackOnU(i))d=Math.abs(u-i*PARCEL.U);if(trackOnV(j))d=Math.min(d,Math.abs(v-j*PARCEL.V));return d;}
// ---- OSM helpers ----
const WETLANDS=FEATURES.filter(f=>f.tags.natural==='wetland'),RESIDENTIAL=FEATURES.filter(f=>f.tags.landuse==='residential'),ROADS=FEATURES.filter(f=>f.tags.highway);
function segDist(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz);}
function polyEdgeDist(x,z,pts){let d=Infinity;for(let i=1;i<pts.length;i++)d=Math.min(d,segDist(x,z,pts[i-1],pts[i]));return d;}
function nearRoad(x,z){let d=Infinity;for(const f of ROADS)d=Math.min(d,polyEdgeDist(x,z,f.points));return d;}
// ---- forest meadows: open patches along and beside the default northbound corridor ----
export const FOREST_MEADOWS=[[30,-380,55],[-230,-760,70],[190,-1160,95],[-70,-1640,62],[430,-620,42],[-520,-300,58],[620,-1500,80],[-420,-1250,48]];
const TREE_CELL={forest:15,terrain:10,mountain:10,airfield:30,water:16};
// v0.33.1 managed forest: compartments (bölme) on a rotated 300 m grid hold mature stands, thinned stands, young
// plantations (2-5 m pines) and clear-cuts (kütüklü kesim sahası); forest roads with cleared verges and a 30 m fire
// break cross it; natural glades and meadows stay. Shared by physics, landing-zone search, map and scene.
const STAND={cell:300,theta:.35};
/* forest roads: along z (x = f(z)) or along x (z = f(x)); the first one carries the fire break */
export const FOREST_ROADS=[{along:'z',f:z=>260+35*Math.sin(z/400)},{along:'x',f:x=>-900+60*Math.sin(x/350)},{along:'z',f:z=>-700+50*Math.sin(z/300+1)},{along:'x',f:x=>650+45*Math.sin(x/420+2)}];
export function forestRoadDistance(x,z,from=0){let best=Infinity;for(let k=from;k<FOREST_ROADS.length;k++){const r=FOREST_ROADS[k],d=r.along==='z'?Math.abs(x-r.f(z)):Math.abs(z-r.f(x));if(d<best)best=d;}return best;}
export function forestStand(x,z){
 if(Math.hypot(x,z)<70)return {kind:'open',density:0};
 for(const [mx,mz,r] of FOREST_MEADOWS){const d=Math.hypot(x-mx,z-mz);if(d<r)return {kind:'meadow',density:0};if(d<r+14)return {kind:'edge',density:.9*(d-r)/14};}
 const fb=Math.abs(x-260-35*Math.sin(z/400));if(fb<15)return {kind:fb<3?'road':'firebreak',density:0};
 {const d=forestRoadDistance(x,z,1);if(d<3)return {kind:'road',density:0};if(d<7.5)return {kind:'verge',density:0};}
 const cs=Math.cos(STAND.theta),sn=Math.sin(STAND.theta),u=(x*cs+z*sn)/STAND.cell,v=(-x*sn+z*cs)/STAND.cell,i=Math.floor(u),j=Math.floor(v),fu=u-i,fv=v-j,h=hash2(i*1.31+5.2,j*2.87-3.1);
 if(h<.24){const r=clearcutRect(i,j);if(Math.abs(fu-r.cu)<r.w&&Math.abs(fv-r.cv)<r.d)return {kind:'clearcut',density:0};}
 const c=vnoise2(x/240+3.3,z/240-1.7);if(c<.2)return {kind:'glade',density:0};
 if(h>=.24&&h<.42)return {kind:'young',density:.95};
 if(h>=.42&&h<.56)return {kind:'thinned',density:.42*Math.min(1,(c-.2)/.07)};
 return {kind:'mature',density:.9*Math.min(1,(c-.2)/.07)};}
function clearcutRect(i,j){return {w:(110+80*hash2(i+.3,j+9.1))/STAND.cell/2,d:(85+70*hash2(i+4.7,j+.2))/STAND.cell/2,cu:.5+(hash2(i+2.2,j+2.9)-.5)*.25,cv:.5+(hash2(i+7.4,j+1.3)-.5)*.25};}
// Clear-cut outlines (world x,z corners) for the ground texture and the start map.
export function forestClearcuts(R=3000){const out=[],cs=Math.cos(STAND.theta),sn=Math.sin(STAND.theta),n=Math.ceil(R*1.5/STAND.cell);
 for(let i=-n;i<=n;i++)for(let j=-n;j<=n;j++){if(hash2(i*1.31+5.2,j*2.87-3.1)>=.24)continue;const r=clearcutRect(i,j),pts=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>{const u=(i+r.cu+a*r.w)*STAND.cell,v=(j+r.cv+b*r.d)*STAND.cell;return [u*cs-v*sn,u*sn+v*cs];});
  if(pts.some(([x,z])=>Math.abs(x)<R&&Math.abs(z)<R))out.push(pts);}return out;}
let GREENIDX=null;function greenIndex(x,z){if(!GREENIDX){GREENIDX=new Map();for(const g of AIRFIELD_GREEN){const xs=g.points.map(p=>p[0]),zs=g.points.map(p=>p[1]);for(let i=Math.floor(Math.min(...xs)/200);i<=Math.floor(Math.max(...xs)/200);i++)for(let j=Math.floor(Math.min(...zs)/200);j<=Math.floor(Math.max(...zs)/200);j++){const k=i+','+j;(GREENIDX.get(k)??GREENIDX.set(k,[]).get(k)).push(g);}}}return GREENIDX.get(Math.floor(x/200)+','+Math.floor(z/200))??[];}
function treeDensity(x,z,area){
 if(REAL(area)){const c=REAL(area).treeCell(x,z);if(!c)return 0;for(const s of PAD_CLEAR[area]??[])if(Math.hypot(x-s.x,z-s.z)<s.r)return 0;return Math.max(0,Math.min(1,(c.d-.25)/.75));}
 switch(area){
  case 'forest':return forestStand(x,z).density;
  case 'terrain':{if(Math.abs(x)<110&&z<250&&z>-2600)return 0;for(const f of RESIDENTIAL)if(insidePolygon(x,z,f.points))return .5;
   for(const f of WETLANDS){const d=polyEdgeDist(x,z,f.points);if(d<22&&!insidePolygon(x,z,f.points))return .6;}
   return .012;}
  case 'mountain':{const corridor=Math.abs(x-60*Math.sin(z/520));if(corridor<120)return .02;const n=vnoise2(x/180-2.1,z/180+6.3);return n>.52?Math.min(.75,(n-.52)*3):.01;}
  case 'airfield':{const q=runwayCoordinates(x,z);if(Math.abs(q.across)<260&&Math.abs(q.along)<1300)return 0;for(const g of greenIndex(x,z))if(insidePolygon(x,z,g.points))return .4;return .003;}
  case 'water':return islandHeight(x,z)>3?.3:0;
 }return 0;
}
function treeSpec(x,z,area,h,kind){
 if(REAL(area)){const c=REAL(area).treeCell(x,z)?.kind??0,a=hash2(x,z+1),b=hash2(z,x);
  if(c===1)return h<.45?{kind:'poplar',height:14+7*a,radius:1.8+.7*b}:{kind:'broad',height:9+5*a,radius:3.4+1.6*b};
  if(c===2)return {kind:'conifer',height:9+7*a,radius:2.4+1.2*b};if(c===3)return {kind:'broad',height:4+2*a,radius:2+.8*b};
  return {kind:'broad',height:4.5+4*a,radius:2.2+1.5*b};}
 if(area==='forest'&&kind==='young')return {kind:'conifer',height:2.2+2.8*hash2(x,z+1),radius:1.1+.6*hash2(z,x)};
 if(area==='forest')return h<.7?{kind:'conifer',height:15+8*hash2(x,z+1),radius:3.6+1.2*hash2(z,x)}:{kind:'broad',height:12+5*hash2(x,z+1),radius:4+1.5*hash2(z,x)};
 if(area==='mountain')return {kind:'conifer',height:8+7*hash2(x,z+1),radius:2.5+1.3*hash2(z,x)};
 if(kind==='orchard')return {kind:'broad',height:4.5+2*hash2(x,z+1),radius:2.2+.8*hash2(z,x)};
 if(kind==='poplar')return {kind:'poplar',height:16+6*hash2(x,z+1),radius:1.8+.6*hash2(z,x)};
 return {kind:'broad',height:(area==='water'?6:8)+4*hash2(x,z+1),radius:3+1.6*hash2(z,x)};
}
function cellTree(i,j,area){const C=TREE_CELL[area]??24,x=(i+.5)*C+(hash2(i*1.7,j*2.3)-.5)*C*.7,z=(j+.5)*C+(hash2(i*3.1,j*.7)-.5)*C*.7,h=hash2(i*.37+11,j*.53-7);
 const d=treeDensity(x,z,area);if(h>=d)return null;if(REAL(area))return {x,z,...treeSpec(x,z,area,hash2(i*9.1,j*4.7),'')};const kind=area==='forest'?(forestStand(x,z).kind==='young'?'young':''):area==='terrain'?(RESIDENTIAL.some(f=>insidePolygon(x,z,f.points))?'orchard':WETLANDS.length&&d>=.6?'poplar':'lone'):'';return {x,z,...treeSpec(x,z,area,hash2(i*9.1,j*4.7),kind)};}
// rows of poplars on some parcel edges (terrain area)
function rowTrees(minX,maxX,minZ,maxZ){const out=[],c=Math.cos(PARCEL.theta),s=Math.sin(PARCEL.theta),corners=[[minX,minZ],[maxX,minZ],[minX,maxZ],[maxX,maxZ]].map(([x,z])=>parcelUV(x,z));
 const u0=Math.min(...corners.map(q=>q[0])),u1=Math.max(...corners.map(q=>q[0])),v0=Math.min(...corners.map(q=>q[1])),v1=Math.max(...corners.map(q=>q[1])),toXZ=(u,v)=>[u*c-v*s,u*s+v*c],SP=8;
 for(let i=Math.floor(u0/PARCEL.U);i<=Math.floor(u1/PARCEL.U)+1;i++)for(let j=Math.floor(v0/PARCEL.V);j<=Math.floor(v1/PARCEL.V);j++){if(!rowOnUEdge(i,j))continue;const u=i*PARCEL.U+(trackOnU(i)?4.5:0);for(let v=Math.max(j*PARCEL.V,Math.floor(v0/SP)*SP);v<Math.min((j+1)*PARCEL.V,v1+SP);v+=SP){const [x,z]=toXZ(u+(hash2(u,v)-.5)*1.5,v+(hash2(v,u)-.5)*2);if(x>=minX&&x<=maxX&&z>=minZ&&z<=maxZ&&!(Math.abs(x)<110&&z<250&&z>-2600)&&nearRoad(x,z)>5)out.push({x,z,...treeSpec(x,z,'terrain',0,'poplar')});}}
 for(let j=Math.floor(v0/PARCEL.V);j<=Math.floor(v1/PARCEL.V)+1;j++)for(let i=Math.floor(u0/PARCEL.U);i<=Math.floor(u1/PARCEL.U);i++){if(!rowOnVEdge(i,j))continue;const v=j*PARCEL.V+(trackOnV(j)?4.5:0);for(let u=Math.max(i*PARCEL.U,Math.floor(u0/SP)*SP);u<Math.min((i+1)*PARCEL.U,u1+SP);u+=SP){const [x,z]=toXZ(u+(hash2(v,u)-.5)*2,v+(hash2(u,v)-.5)*1.5);if(x>=minX&&x<=maxX&&z>=minZ&&z<=maxZ&&!(Math.abs(x)<110&&z<250&&z>-2600)&&nearRoad(x,z)>5)out.push({x,z,...treeSpec(x,z,'terrain',0,'poplar')});}}
 return out;}
// All trees whose trunk lies in a box (used by collision, landing-zone search, map and scene).
function treesInBoxRaw(minX,maxX,minZ,maxZ,area){const C=TREE_CELL[area]??24,out=[];
 for(let i=Math.floor(minX/C)-1;i<=Math.floor(maxX/C);i++)for(let j=Math.floor(minZ/C)-1;j<=Math.floor(maxZ/C);j++){const t=cellTree(i,j,area);if(t&&t.x>=minX&&t.x<maxX&&t.z>=minZ&&t.z<maxZ)out.push(t);}
 return out;}
// 64 m tiles are generated once and cached (collision queries run many times per simulated second).
const TILE=64,TILES=new Map();
function tileTrees(ti,tj,area){const k=area+':'+ti+':'+tj;let v=TILES.get(k);if(!v){v=treesInBoxRaw(ti*TILE,(ti+1)*TILE,tj*TILE,(tj+1)*TILE,area);TILES.set(k,v);}return v;}
export function treesInBox(minX,maxX,minZ,maxZ,area){const out=[];for(let i=Math.floor(minX/TILE);i<=Math.floor(maxX/TILE);i++)for(let j=Math.floor(minZ/TILE);j<=Math.floor(maxZ/TILE);j++)for(const t of tileTrees(i,j,area))if(t.x>=minX&&t.x<=maxX&&t.z>=minZ&&t.z<=maxZ)out.push(t);return out;}
export function treesNear(x,z,r,area){return treesInBox(x-r,x+r,z-r,z+r,area);}
// Backwards-compatible forest cell accessor (tests / older callers).
export function treeAt(i,j){return cellTree(i,j,'forest');}
// ---- procedural farmsteads (terrain area): small house + barn + shed groups in a few parcels away from the corridor ----
export const FARMSTEADS=(()=>{const out=[];const spots=[[-760,-980,.3],[640,-1460,1.1],[-1180,260,.7],[980,-420,2.2],[-420,-1880,1.6],[1460,-1120,.4],[-1620,-720,2.8],[300,820,1.9]];
 const box=(cx,cz,w,l,a,h,kind)=>{const c=Math.cos(a),s=Math.sin(a),pts=[[-w/2,-l/2],[w/2,-l/2],[w/2,l/2],[-w/2,l/2],[-w/2,-l/2]].map(([x,z])=>[cx+x*c-z*s,cz+x*s+z*c]);return {tags:{building:kind,height:String(h),source:'procedural'},points:pts};};
 for(const [x,z,a] of spots){out.push(box(x,z,10,8,a,6,'house'),box(x+22*Math.cos(a),z+22*Math.sin(a),24,12,a,8,'barn'),box(x-16*Math.sin(a),z+16*Math.cos(a),8,6,a,4,'shed'));}return out;})();
export function extraFeatures(area){return [];}
// ---- boulders (mountain rocky slopes, scattered elsewhere) as low obstacles ----
const BOULDER_CELL=18;
function cellBoulder(i,j,area){if(area!=='mountain'&&area!=='terrain')return null;const x=(i+.5)*BOULDER_CELL+(hash2(i*5.1,j*1.9)-.5)*BOULDER_CELL*.8,z=(j+.5)*BOULDER_CELL+(hash2(i*2.7,j*6.3)-.5)*BOULDER_CELL*.8,h=hash2(i*.71+3,j*.29-5);
 if(REAL(area)){if(h>.06)return null;for(const s of PAD_CLEAR[area]??[])if(Math.hypot(x-s.x,z-s.z)<s.r)return null;const c=REAL(area).surfaceClass(x,z);if(c===4||c===5||c===1)return null;const sl=Math.hypot(terrainHeight(x+3,z,area)-terrainHeight(x-3,z,area),terrainHeight(x,z+3,area)-terrainHeight(x,z-3,area))/6;const d=(c===3?.05:0)+(sl>.3?.05:sl>.15?.015:.002);if(h>=d)return null;return {x,z,height:.6+1.6*hash2(x,z),radius:.8+1.4*hash2(z,x),kind:'rock'};}
 if(area==='terrain'){if(Math.abs(x)<110&&z<250&&z>-2600)return null;if(h>.006)return null;return {x,z,height:1+1.2*hash2(x,z),radius:1.2+1.2*hash2(z,x),kind:'rock'};}
 const sl=Math.hypot(terrainHeight(x+3,z,area)-terrainHeight(x-3,z,area),terrainHeight(x,z+3,area)-terrainHeight(x,z-3,area))/6;const corridor=Math.abs(x-60*Math.sin(z/520));
 const d=corridor<120?.01:sl>.25?.35:sl>.12?.12:.03;if(h>=d)return null;return {x,z,height:.8+2.2*hash2(x,z),radius:1+2*hash2(z,x),kind:'rock'};}
const BTILES=new Map();
export function bouldersInBox(minX,maxX,minZ,maxZ,area){if(area!=='mountain'&&area!=='terrain')return [];const out=[];for(let ti=Math.floor(minX/64);ti<=Math.floor(maxX/64);ti++)for(let tj=Math.floor(minZ/64);tj<=Math.floor(maxZ/64);tj++){const k=area+':'+ti+':'+tj;let v=BTILES.get(k);if(!v){v=[];for(let i=Math.floor(ti*64/BOULDER_CELL)-1;i<=Math.floor((ti+1)*64/BOULDER_CELL);i++)for(let j=Math.floor(tj*64/BOULDER_CELL)-1;j<=Math.floor((tj+1)*64/BOULDER_CELL);j++){const b=cellBoulder(i,j,area);if(b&&b.x>=ti*64&&b.x<(ti+1)*64&&b.z>=tj*64&&b.z<(tj+1)*64)v.push(b);}BTILES.set(k,v);}for(const b of v)if(b.x>=minX&&b.x<=maxX&&b.z>=minZ&&b.z<=maxZ)out.push(b);}return out;}
// ---- buildings: OSM footprints with heights, indexed on a 50 m grid ----
const BUILDING_HEIGHT={industrial:9,apartments:15,hangar:12,school:10,roof:5,construction:8,train_station:8,yes:6,house:6,barn:8,shed:4};
/* v0.35 one height per building, shared by rendering and collision: OSM height / levels, else a type range varied by a
   hash of the footprint (Ankara: 4–10 storey apartment blocks, 6–12 m industrial sheds, 10–14 m hangars) */
export function buildingHeightOf(f){const t=f.tags??{};if(Number(t.height))return Number(t.height);if(t['building:levels'])return Number(t['building:levels'])*3;
 const p=f.points??[[0,0]],cx=p.reduce((a,q)=>a+q[0],0)/p.length,cz=p.reduce((a,q)=>a+q[1],0)/p.length,k=hash2(Math.round(cx),Math.round(cz)),b=t.building;
 if(t.aeroway==='hangar'||b==='hangar')return 10+k*4;if(b==='apartments')return 12+Math.floor(k*7)*3;if(b==='industrial')return 6+k*6;if(b==='school')return 9+k*3;if(b==='roof')return 4.5;if(b==='construction')return 6+k*9;if(b==='train_station')return 8;if(b==='shed')return 3.5;if(b==='barn')return 6+k*2;
 return BUILDING_HEIGHT[b]?BUILDING_HEIGHT[b]*(.8+k*.5):5+k*4;}
let BUILDINGS=null;
function buildingIndex(area){BUILDINGS??={};if(BUILDINGS[area])return BUILDINGS[area];const src=REAL(area)?REAL(area).features:area==='airfield'?AIRFIELD_FEATURES:[],list=[],grid=new Map();
 for(const f of src){if(!f.tags.building&&f.tags.aeroway!=='hangar')continue;const pts=f.points,xs=pts.map(p=>p[0]),zs=pts.map(p=>p[1]);const h=buildingHeightOf(f);
  if(f.tags.layer==='-1')continue;const b={pts,h,minX:Math.min(...xs),maxX:Math.max(...xs),minZ:Math.min(...zs),maxZ:Math.max(...zs)};b.cx=(b.minX+b.maxX)/2;b.cz=(b.minZ+b.maxZ)/2;list.push(b);
  for(let i=Math.floor(b.minX/50);i<=Math.floor(b.maxX/50);i++)for(let j=Math.floor(b.minZ/50);j<=Math.floor(b.maxZ/50);j++){const k=i+','+j;(grid.get(k)??grid.set(k,[]).get(k)).push(b);}}
 return BUILDINGS[area]={list,grid};}
export function buildingsNear(x,z,r,area){const {grid}=buildingIndex(area),out=new Set();for(let i=Math.floor((x-r)/50);i<=Math.floor((x+r)/50);i++)for(let j=Math.floor((z-r)/50);j<=Math.floor((z+r)/50);j++)for(const b of grid.get(i+','+j)??[])out.add(b);return [...out];}
export function buildingList(area){return buildingIndex(area).list;}
// ---- obstacles: highest solid surface at a point (terrain, tree crown, roof) ----
export function obstacleHeight(x,z,area){let y=terrainHeight(x,z,area);
 for(const t of treesNear(x,z,7,area))if(Math.hypot(x-t.x,z-t.z)<t.radius)y=Math.max(y,terrainHeight(t.x,t.z,area)+t.height);
 for(const r of bouldersInBox(x-4,x+4,z-4,z+4,area)){const d=Math.hypot(x-r.x,z-r.z);if(d<r.radius)y=Math.max(y,terrainHeight(r.x,r.z,area)+r.height*Math.sqrt(1-(d/r.radius)**2));}
 if(area==='terrain'||area==='airfield'||area==='mountain')for(const b of buildingsNear(x,z,0,area))if(x>=b.minX&&x<=b.maxX&&z>=b.minZ&&z<=b.maxZ&&insidePolygon(x,z,b.pts))y=Math.max(y,terrainHeight(b.cx,b.cz,area)+b.h);
 return y;}
// Highest obstacle top (absolute) whose crown/roof/rock comes within r metres of (x,z) horizontally; terrain if none.
export function obstacleTopNear(x,z,area,r=9){let y=terrainHeight(x,z,area);
 for(const t of treesNear(x,z,r+8,area))if(Math.hypot(x-t.x,z-t.z)<r+t.radius)y=Math.max(y,terrainHeight(t.x,t.z,area)+t.height);
 for(const b of bouldersInBox(x-r-4,x+r+4,z-r-4,z+r+4,area))if(Math.hypot(x-b.x,z-b.z)<r+b.radius)y=Math.max(y,terrainHeight(b.x,b.z,area)+b.height);
 if(area==='terrain'||area==='airfield'||area==='mountain')for(const b of buildingsNear(x,z,r,area))if(x>=b.minX-r&&x<=b.maxX+r&&z>=b.minZ-r&&z<=b.maxZ+r&&(insidePolygon(x,z,b.pts)||polyEdgeDist(x,z,b.pts)<r))y=Math.max(y,terrainHeight(b.cx,b.cz,area)+b.h);
 return y;}
// Horizontal distance from a point to the nearest obstacle taller than `above` metres over the ground.
export function obstacleClearance(x,z,area,r=40,above=1.5){let best=r;
 for(const t of [...treesNear(x,z,r+6,area),...bouldersInBox(x-r-4,x+r+4,z-r-4,z+r+4,area)]){if(t.height<above)continue;const d=Math.hypot(x-t.x,z-t.z)-t.radius;if(d<best)best=Math.max(0,d);}
 if(area==='terrain'||area==='airfield'||area==='mountain')for(const b of buildingsNear(x,z,r,area)){if(x>=b.minX&&x<=b.maxX&&z>=b.minZ&&z<=b.maxZ&&insidePolygon(x,z,b.pts))return 0;const d=polyEdgeDist(x,z,b.pts);if(d<best)best=d;}
 return best;}
// ---- surface at a point ----
const SURF={paved:{label:'Asfalt / beton',friction:.35,roughness:0},field:{label:'Sürülmüş tarla · yumuşak',friction:.78,roughness:.75},stubble:{label:'Anız',friction:.6,roughness:.4},grass:{label:'Çayır',friction:.55,roughness:.3},
 rough:{label:'Toprak / taşlı düzensiz zemin',friction:.65,roughness:.65},wetland:{label:'Sulak alan · yumuşak zemin',friction:.85,roughness:.5},rock:{label:'Kayalık yamaç',friction:.7,roughness:.95},sand:{label:'Kum',friction:.72,roughness:.25},
 forest:{label:'Orman tabanı / ağaç engelleri',friction:.65,roughness:.65},dirt:{label:'Toprak yol',friction:.5,roughness:.2}};
const surf=(kind,slope,extra)=>({kind,...SURF[kind],slope,...extra});
export const HELI_PANELS={along:[469,343,216,90],across:-159,size:20};
export function surfaceProfile(x,z,area='terrain'){
 const slope=Math.hypot((terrainHeight(x+1,z,area)-terrainHeight(x-1,z,area))/2,(terrainHeight(x,z+1,area)-terrainHeight(x,z-1,area))/2);
 if(area==='water'&&islandHeight(x,z)<=0)return {kind:'water',label:'Su yüzeyi',friction:.2,roughness:0,slope};
 const q=runwayCoordinates(x,z);if(area==='airfield'&&Math.abs(q.across-HELI_PANELS.across)<=8&&HELI_PANELS.along.some(a=>Math.abs(q.along-a)<=8))return {kind:'paved',label:'Helikopter paneli',friction:.35,roughness:0,slope};if(area==='airfield'&&Math.abs(q.across)<=18&&Math.abs(q.along)<=1008.5)return {kind:'paved',label:'Asfalt pist',friction:.35,roughness:0,slope};
 if(area==='airfield'){for(const f of AERO){if(f.tags.aeroway==='apron'&&insidePolygon(x,z,f.points))return {kind:'paved',label:'Beton apron',friction:.35,roughness:0,slope};if(f.tags.aeroway==='taxiway')for(let i=1;i<f.points.length;i++){const a=f.points[i-1],b=f.points[i],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));if(Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz)<(Number(f.tags.width)||15)/2)return {kind:'paved',label:'Taksi yolu',friction:.35,roughness:0,slope};}}return surf('grass',slope);}
 if(area==='water')return islandHeight(x,z)<3?surf('sand',slope):surf('grass',slope);
 if(area==='forest'){const st=forestStand(x,z);if(st.kind==='road')return {...surf('dirt',slope),label:'Orman yolu'};if(st.kind==='clearcut')return {...surf('rough',slope),label:'Kesim sahası · kütük ve çalı'};if(st.kind==='firebreak')return {...surf('grass',slope),label:'Yangın emniyet şeridi'};
  if(st.density>.05)return st.kind==='young'?{...surf('forest',slope),label:'Genç ağaçlandırma · 2–5 m'}:surf('forest',slope);return surf('grass',slope);}
 if(REAL(area)){const c=REAL(area).surfaceClass(x,z);if(c===4)return {kind:'water',label:'Su yüzeyi',friction:.2,roughness:0,slope};if(roadNear(x,z,area)<3.5)return surf('dirt',slope);if(slope>.36)return surf('rock',slope);if(treeDensity(x,z,area)>.3)return surf('forest',slope);
  if(c===5)return {...surf('rough',slope),label:'Yerleşim · bahçe duvarı / çit'};if(c===3)return slope>.2?surf('rock',slope):{...surf('rough',slope),label:'Çıplak / aşınmış zemin'};if(c===1)return surf('field',slope);if(c===2)return surf('stubble',slope);return surf(slope>.18?'rough':'grass',slope);}
 if(area==='mountain')return slope>.28?surf('rock',slope):treeDensity(x,z,area)>.3?surf('forest',slope):surf(slope>.14?'rough':'grass',slope);
 if(WETLANDS.some(f=>insidePolygon(x,z,f.points)))return surf('wetland',slope);
 if(nearRoad(x,z)<3.5)return surf('dirt',slope);
 if(area==='terrain'&&fieldTrackDist(x,z)<2.2)return {...surf('dirt',slope),label:'Tarla yolu'};
 const [i,j]=parcelIndex(x,z);return surf(parcelKind(i,j),slope);
}
export function surfaceKindsInfo(){return SURF;}

// Power lines (v0.31): towers and conductors shared by collision and rendering. Placed away from the default
// northbound entry corridor so they matter when a field is chosen near them. Catenary sag ≈ 3.5 m mid-span.
export const POWER_LINES={terrain:REAL_AREAS.terrain.lines,mountain:REAL_AREAS.mountain.lines,airfield:[], /* v0.37 temsili hat kaldırıldı (gerçek şehir dokusu üstünden geçiyordu) */forest:[[[-1600,700],[-400,650],[800,600],[1900,560]]],water:[]};
const TOWER_H=20,WIRE_OFFSETS=[-3.2,0,3.2];
/* v0.35 village / farmstead distribution lines (köy enerji hatları): 9 m wooden poles, two conductors, ~1 m sag */
const DIST_H=9,DIST_SAG=1.1,DIST_OFFSETS=[-.7,.7];
const lineH=l=>l.h??TOWER_H,lineSag=l=>l.dist?DIST_SAG:3.5,lineOff=l=>l.dist?DIST_OFFSETS:WIRE_OFFSETS;
export function powerLineGeometry(area){return (POWER_LINES[area]??[]).map(line=>Object.assign(line.map(([x,z])=>({x,z,y:terrainHeight(x,z,area)})),{h:lineH(line),dist:!!line.dist}));}
// Distance from a point to the nearest conductor (3D), with the conductor height following a parabolic sag.
export function wireDistance(x,y,z,area){let best=Infinity;for(const line of POWER_LINES[area]??[])for(let i=1;i<line.length;i++){const [ax,az]=line[i-1],[bx,bz]=line[i],dx=bx-ax,dz=bz-az,L=Math.hypot(dx,dz);if(L<1)continue;const ux=dx/L,uz=dz/L,t=Math.max(0,Math.min(L,(x-ax)*ux+(z-az)*uz)),px=ax+ux*t,pz=az+uz*t,lat=(x-px)*-uz+(z-pz)*ux;
  if(Math.abs(lat)>12||Math.abs((x-px)*ux+(z-pz)*uz)>1)continue;const f=t/L,ha=terrainHeight(ax,az,area)+lineH(line),hb=terrainHeight(bx,bz,area)+lineH(line),wy=ha+(hb-ha)*f-lineSag(line)*4*f*(1-f);
  for(const o of lineOff(line)){const d=Math.hypot(lat-o,y-wy);if(d<best)best=d;}}return best;}
// Lowest conductor height (absolute) when (x,z) lies within `r` metres of a power line, else -Infinity.
export function wireTopNear(x,z,area,r=10){let top=-Infinity;for(const line of POWER_LINES[area]??[])for(let i=1;i<line.length;i++){const [ax,az]=line[i-1],[bx,bz]=line[i],dx=bx-ax,dz=bz-az,L=Math.hypot(dx,dz);if(L<1)continue;const ux=dx/L,uz=dz/L,t=(x-ax)*ux+(z-az)*uz;if(t<-r||t>L+r)continue;const lat=Math.abs((x-ax)*-uz+(z-az)*ux);if(lat>r+3.2)continue;const f=Math.max(0,Math.min(1,t/L)),ha=terrainHeight(ax,az,area)+lineH(line),hb=terrainHeight(bx,bz,area)+lineH(line);top=Math.max(top,ha+(hb-ha)*f-lineSag(line)*4*f*(1-f)+.5);}return top;}
export const POWER_LINE_SPEC={towerHeightM:TOWER_H,offsetsM:WIRE_OFFSETS,sagM:3.5};

/* v0.39 Tepeler: KML iniş yerleri (tepe / kapalı). Tepe üstleri ve kapalı bölge ortaları ağaçsız ve kayasız tutulur
   (gerçekte de açık alan); MT_HILLS eski arayüz için [x, z, r, yükseklik] */
const PAD_CLEAR={mountain:TEPE_SITES.map(s=>({x:s.x,z:s.z,r:s.kind==='confined'?24:30}))};
export const MT_HILLS=TEPE_SITES.filter(s=>s.kind==='pinnacle').map(s=>[s.x,s.z,260,terrainHeight(s.x,s.z,'mountain')]);
/* v0.39.2 yol ızgara indeksi (40 m): yüzey sorgusu her yolu taramıyor (harita ve iniş yeri değerlendirmesi telefonda donuyordu) */
const ROAD_G={};function roadGrid(area){if(ROAD_G[area])return ROAD_G[area];const g=new Map(),C=40;for(const f of REAL_AREAS[area].features){if(!f.tags.highway)continue;const p=f.points;for(let i=1;i<p.length;i++){const a=p[i-1],b=p[i],seg=[a,b];for(let gi=Math.floor((Math.min(a[0],b[0])-8)/C);gi<=Math.floor((Math.max(a[0],b[0])+8)/C);gi++)for(let gj=Math.floor((Math.min(a[1],b[1])-8)/C);gj<=Math.floor((Math.max(a[1],b[1])+8)/C);gj++){const k=gi+','+gj;(g.get(k)??g.set(k,[]).get(k)).push(seg);}}}return ROAD_G[area]=g;}
function roadNear(x,z,area){const L=roadGrid(area).get(Math.floor(x/40)+','+Math.floor(z/40));if(!L)return Infinity;let d=Infinity;for(const [a,b] of L)d=Math.min(d,segDist(x,z,a,b));return d;}
