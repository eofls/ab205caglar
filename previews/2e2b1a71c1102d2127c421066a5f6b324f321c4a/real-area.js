/* v0.39 gerçek uçuş sahaları (Arazi = Gölbaşı, Tepeler = Alagöz / Ballıkuyumcu / Hisarlıkaya).
   Copernicus GLO-30 yükseklik ızgarası (±4.5 km 30 m, ±9.5 km 100 m), Sentinel-2 görüntüsünden tespit edilen ağaç ızgarası
   (10 m hücre: yoğunluk + tür), zemin sınıfı ızgarası (20 m) ve OSM yapı / yol / enerji hattı / su. Fizik, iniş yeri seçimi,
   harita ve 3B sahne aynı veriyi kullanır. */
import {TEPELER} from './assets/terrain/tepeler-real.js';
import {GOLBASI} from './assets/terrain/golbasi-real.js';
const b64=s=>typeof atob==='function'?Uint8Array.from(atob(s),c=>c.charCodeAt(0)):new Uint8Array(Buffer.from(s,'base64'));
function i16(s){const b=b64(s);return new Int16Array(b.buffer,b.byteOffset,b.byteLength/2);}
function unrle(s,n){const b=b64(s),out=new Uint8Array(n);let k=0;for(let i=0;i<b.length;i+=2){out.fill(b[i+1],k,k+b[i]);k+=b[i];}return out;}
function grid(g){return {R:g.R,N:g.N,a:i16(g.data)};}
function gridAt(g,x,z,scale){const f=(g.N-1)/(2*g.R),fx=Math.max(0,Math.min(g.N-1.0001,(x+g.R)*f)),fz=Math.max(0,Math.min(g.N-1.0001,(z+g.R)*f)),i=Math.floor(fx),j=Math.floor(fz),u=fx-i,v=fz-j,N=g.N,A=g.a;
 return ((A[j*N+i]*(1-u)+A[j*N+i+1]*u)*(1-v)+(A[(j+1)*N+i]*(1-u)+A[(j+1)*N+i+1]*u)*v)*scale;}
function make(P){
 const inner=grid(P.inner),outer=grid(P.outer),T=P.trees,S=P.surface;let trees=null,surf=null;
 const tr=()=>trees??=unrle(T.rle,T.N*T.N),sf=()=>surf??=unrle(S.rle,S.N*S.N);
 const height=(x,z)=>{const ai=Math.max(Math.abs(x),Math.abs(z)),R=inner.R;if(ai<R-150)return gridAt(inner,x,z,P.scale);if(ai<R){const k=(ai-(R-150))/150;return gridAt(inner,x,z,P.scale)*(1-k)+gridAt(outer,x,z,P.scale)*k;}return gridAt(outer,x,z,P.scale);};
 /* tree cell (10 m): {d: 0..1 density, kind: 0 meşe/çalı, 1 dere boyu (kavak / söğüt), 2 çam, 3 meyve bahçesi} */
 const treeCell=(x,z)=>{const i=Math.floor((x+T.R)/T.cell),j=Math.floor((z+T.R)/T.cell);if(i<0||j<0||i>=T.N||j>=T.N)return null;const v=tr()[j*T.N+i];if(!v)return null;return {d:(v&31)/31,kind:v>>5};};
 const surfaceClass=(x,z)=>{const i=Math.floor((x+S.R)/S.cell),j=Math.floor((z+S.R)/S.cell);if(i<0||j<0||i>=S.N||j>=S.N)return 0;return sf()[j*S.N+i];};
 const features=P.features;
 /* OSM power lines: transmission (power=line) on 26 m towers, distribution (minor_line) on 9 m poles */
 const lines=[];for(const f of features){const p=f.tags.power;if((p==='line'||p==='minor_line')&&f.points.length>1){const pts=f.points.map(q=>[q[0],q[1]]);if(p==='minor_line'){pts.h=9;pts.dist=true;}else pts.h=26;lines.push(pts);}}
 return {name:P.name,lat0:P.lat0,lon0:P.lon0,base:P.base,height,treeCell,surfaceClass,features,lines,R:inner.R};
}
export const REAL_AREAS={terrain:make(GOLBASI),mountain:make(TEPELER)};
export const realArea=area=>REAL_AREAS[area]??null;
/* local metres ⇄ geographic (same frame as the data builder) */
export function toLatLon(area,x,z){const r=REAL_AREAS[area];if(!r)return null;const kx=111320*Math.cos(r.lat0*Math.PI/180);return {lat:r.lat0-z/110574,lon:r.lon0+x/kx};}
export function fromLatLon(area,lat,lon){const r=REAL_AREAS[area];const kx=111320*Math.cos(r.lat0*Math.PI/180);return {x:(lon-r.lon0)*kx,z:-(lat-r.lat0)*110574};}
