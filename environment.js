// Visual environment layer (v0.30): sky, clouds, surface shading, water, downwash, windsock, distant terrain.
// Rendering only. Physics, collision and AGL keep using terrain-data.js; nothing here changes the flight result.
import * as T from './vendor/three.module.js';
import {LITE} from './device-profile.js';
import {terrainHeight,islandHeight,RUNWAY,runwayCoordinates,surfaceProfile} from './terrain-data.js';

const NOISE=`
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float shrubs(vec2 p){vec2 i=floor(p),f=fract(p);float m=0.;for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 g=vec2(float(x),float(y)),c=i+g;vec2 o=vec2(h21(c),h21(c+7.3));float r=.22+.28*h21(c+3.1),pr=step(.42,h21(c+9.7));float d=length(g+o-f);m=max(m,pr*(1.-smoothstep(r*.45,r,d))*(.6+.4*h21(c+1.9)));}return m;}
float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
 return mix(mix(h21(i),h21(i+vec2(1,0)),u.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*vnoise(p);p=p*2.03+vec2(17.1,9.7);a*=.5;}return s;}
`;

// ---------- Sky dome: analytic gradient + sun disk/halo, colours follow the selected weather ----------
export function createSky(){
 const mat=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,depthTest:true,fog:false,
  uniforms:{night:{value:0},top:{value:new T.Color('#4f86c6')},horizon:{value:new T.Color('#c9dbe3')},below:{value:new T.Color('#8c9a8f')},sunDir:{value:new T.Vector3(.4,.7,.3).normalize()},sunColor:{value:new T.Color('#fff2d6')},haze:{value:.5},cloud:{value:0}},
  vertexShader:`varying vec3 vDir;void main(){vDir=normalize(position);vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}`,
  fragmentShader:`uniform vec3 top,horizon,below,sunColor,sunDir;uniform float haze,cloud,night;varying vec3 vDir;${NOISE}
  void main(){vec3 d=normalize(vDir);float h=d.y;vec3 c=mix(horizon,top,pow(clamp(h,0.,1.),.5));
   c=mix(c,horizon*1.05+vec3(.02),exp(-max(h,0.)*16.)*.45*(1.-night)); /* v0.43 ufukta parlak pus bandı */
   {vec2 dz=normalize(d.xz+1e-5),sz=normalize(sunDir.xz+1e-5);float az=dot(dz,sz);c+=sunColor*.07*pow(max(az,0.),3.)*exp(-max(h,0.)*5.)*(1.-night);c*=1.-.05*max(-az,0.)*smoothstep(0.,.5,h)*(1.-night);} /* güneş tarafında sıcak ufuk, karşı tarafta daha koyu mavi */
   if(h<0.)c=mix(horizon,below,clamp(-h*4.,0.,1.));
   float sd=max(dot(d,normalize(sunDir)),0.);c+=sunColor*(pow(sd,900.)*6.*(1.-cloud*.85)+pow(sd,24.)*.22+pow(sd,4.)*.10*haze);
   // high cirrus streaks, faint
   float ci=fbm(d.xz/(max(h,.08))*1.6+vec2(3.,7.));c=mix(c,vec3(1.),smoothstep(.62,.9,ci)*.18*smoothstep(.02,.3,h)*(1.-cloud));
   if(night>.5){vec2 sp=d.xz/(d.y+1.2)*180.;float st=step(.9965,h21(floor(sp)))*smoothstep(.02,.2,h)*(1.-cloud);c+=vec3(st)*(.6+.4*h21(floor(sp)+3.));}
   gl_FragColor=vec4(c,1.);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`});
 const mesh=new T.Mesh(new T.SphereGeometry(9000,48,24),mat);mesh.name='Gökyüzü';mesh.frustumCulled=false;mesh.renderOrder=-10;
 return mesh;
}
export function updateSky(sky,weather,lighting,cover){
 const u=sky.material.uniforms,dusk=lighting==='dusk',over=cover==='overcast',night=lighting==='night';u.night.value=night?1:0;
 if(night){u.horizon.value.set(weather.sky);u.top.value.set('#03060d');u.below.value.set('#06080c');u.sunColor.value.set('#c7d6ff');u.haze.value=.15;u.cloud.value=over?1:cover==='scattered'?.35:0;u.sunDir.value.set(-.3,.55,-.5).normalize();return u.sunDir.value;}
 u.horizon.value.set(weather.sky);
 u.top.value.set(dusk?'#5d6f9a':over?'#8e9aa3':'#2f6cb8');
 u.below.value.set(dusk?'#6f5f58':'#7f8c84');
 u.sunColor.value.set(dusk?'#ffb47a':'#fff3da');
 u.haze.value=dusk?1.6:over?.2:.6;u.cloud.value=over?1:cover==='scattered'?.35:0;
 u.sunDir.value.set(dusk?.85:.58,dusk?.12:.56,dusk?.5:.42).normalize(); /* v0.43 gündüz güneşi ≈38°: arazi kabartısı ve gölgeler daha belirgin */
 return u.sunDir.value;
}

// ---------- Soft billboard clouds ----------
/* v0.48 kümülüs dokusu: üstü kabarık ve aydınlık, altı düz ve gri-mavi gölgeli; kenarda ince yumrular (yumuşak top yığını değil) */
const CLOUD_TEX=[];function cloudTexture(v=0){if(CLOUD_TEX[v])return CLOUD_TEX[v];
 const W=256,H=160,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');let seed=7+v*131;const r=()=>(seed=(seed*16807)%2147483647)/2147483647;
 const base=H*.72,blobs=[];for(let i=0;i<26;i++){const px=40+r()*176,rad=14+r()*(30-Math.abs(px-128)/9),py=base-rad*.55-r()*rad*(1.2-Math.abs(px-128)/150);blobs.push([px,py,rad]);}
 for(let i=0;i<60;i++){const q=blobs[Math.floor(r()*blobs.length)],a=r()*Math.PI*2,d=q[2]*(.7+r()*.3);blobs.push([q[0]+Math.cos(a)*d,Math.min(base-4,q[1]+Math.sin(a)*d*.8),q[2]*(.25+r()*.25)]);}
 const al=document.createElement('canvas');al.width=W;al.height=H;const ax=al.getContext('2d');for(const [px,py,rad] of blobs){const g=ax.createRadialGradient(px,py,0,px,py,rad);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.75,'rgba(255,255,255,.9)');g.addColorStop(1,'rgba(255,255,255,0)');ax.fillStyle=g;ax.beginPath();ax.arc(px,py,rad,0,6.283);ax.fill();}
 ax.globalCompositeOperation='destination-out';const gb=ax.createLinearGradient(0,base-2,0,base+10);gb.addColorStop(0,'rgba(0,0,0,0)');gb.addColorStop(1,'rgba(0,0,0,1)');ax.fillStyle=gb;ax.fillRect(0,base-2,W,H);
 const sh=x.createLinearGradient(0,0,0,H);sh.addColorStop(0,'#f6f8fa');sh.addColorStop(.5,'#e9edf1');sh.addColorStop(.74,'#c6ced8');sh.addColorStop(1,'#b2bcc8');x.fillStyle=sh;x.fillRect(0,0,W,H);
 for(const [px,py,rad] of blobs.slice(0,26)){const g=x.createRadialGradient(px-rad*.35,py-rad*.4,0,px-rad*.2,py-rad*.2,rad*.9);g.addColorStop(0,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.beginPath();x.arc(px,py,rad,0,6.283);x.fill();} /* yumruların güneş tarafı parlak */
 x.globalCompositeOperation='destination-in';x.drawImage(al,0,0);
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;CLOUD_TEX[v]=t;return t;
}
export function createClouds(){
 const group=new T.Group();group.name='Bulutlar';if(typeof document==='undefined')return group;
 const tex=cloudTexture(0);let seed=11;const r=()=>(seed=(seed*16807)%2147483647)/2147483647;
 for(let i=0;i<46;i++){const m=new T.SpriteMaterial({map:tex,color:'#ffffff',transparent:true,depthWrite:false,fog:true,opacity:.9});const s=new T.Sprite(m);
  const a=r()*Math.PI*2,d=500+r()*3800;s.position.set(Math.cos(a)*d,430+r()*260,Math.sin(a)*d);const k=260+r()*420;s.scale.set(k,k*.62,1);m.map=cloudTexture(i%4);group.add(s);}
 return group;
}
/* v0.48 kapalı havada stratus: geniş, yassı, tabanı koyu bulut tabakası (ayrı kümülüs topları değil) */
let STRATUS=null;function stratusTexture(){if(STRATUS||typeof document==='undefined')return STRATUS;const W=256,H=96,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');let sd=53;const r=()=>(sd=(sd*16807)%2147483647)/2147483647;
 const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#d9dee3');g.addColorStop(.6,'#b7bfc8');g.addColorStop(1,'#98a2ad');x.fillStyle=g;x.fillRect(0,0,W,H);
 for(let i=0;i<220;i++){const px=r()*W,py=r()*H,rad=8+r()*26;const q=x.createRadialGradient(px,py,0,px,py,rad);{const v=r()<.5?255:110;q.addColorStop(0,`rgba(${v},${v},${v+6},.07)`);}q.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=q;x.fillRect(px-rad,py-rad,rad*2,rad*2);}
 x.globalCompositeOperation='destination-in';const m=x.createRadialGradient(W/2,H/2,H*.2,W/2,H/2,W*.5);m.addColorStop(0,'rgba(0,0,0,.95)');m.addColorStop(.45,'rgba(0,0,0,.7)');m.addColorStop(1,'rgba(0,0,0,0)');x.save();x.scale(1,H/W*2);x.fillStyle=m;x.fillRect(0,0,W,W);x.restore();
 STRATUS=new T.CanvasTexture(c);STRATUS.colorSpace=T.SRGBColorSpace;return STRATUS;}
export function updateClouds(group,weather,cover){
 const n=cover==='clear'?0:cover==='scattered'?16:46,ov=cover==='overcast';
 group.children.forEach((s,i)=>{if(s.userData.far){s.visible=!ov;s.material.color.set(weather.cloudColor);s.material.opacity=cover==='clear'?.55:.7;return;}s.visible=i<n;s.material.color.set(weather.cloudColor);s.material.opacity=ov?.7:.85;
  s.userData.cu??=s.material.map;s.userData.sc??=s.scale.clone();const st=ov&&typeof document!=='undefined';s.material.map=st?stratusTexture():s.userData.cu;if(st)s.scale.set(s.userData.sc.x*3,s.userData.sc.y*.7,1);else s.scale.copy(s.userData.sc);});
}
/* v0.43 açık havada da ufukta birkaç uzak kümülüs (8–12 km, gölgesiz): gökyüzü boş ve yapay görünmez */
export function addFarClouds(group){if(typeof document==='undefined'||group.userData.farAdded)return;group.userData.farAdded=true;const tex=cloudTexture(1);let seed=29;const r=()=>(seed=(seed*16807)%2147483647)/2147483647;
 for(let i=0;i<9;i++){const m=new T.SpriteMaterial({map:tex,color:'#ffffff',transparent:true,depthWrite:false,fog:false,opacity:.55});const sp=new T.Sprite(m);const a=r()*Math.PI*2,d=6500+r()*2200;sp.position.set(Math.cos(a)*d,700+r()*400,Math.sin(a)*d);const k=1100+r()*1300;sp.scale.set(k,k*.55,1);sp.material.map=cloudTexture(i%4);sp.userData.far=true;group.add(sp);}}

// ---------- Surface detail for terrain/runway materials (world-space noise, slope rock, snow line) ----------
/* v0.43 gerçekçilik: zemin malzemesi için ortak (paylaşılan) uniform'lar — bulut gölgesi, rüzgâr, zaman, ayrıntı dokusu */
export const SURFACE_U={uTime:{value:0},uCloud:{value:0},uWind:{value:new T.Vector2(0,0)},uDet:{value:null},uAO:{value:null},uAOR:{value:0}};
/* v0.43 DEM’den önceden hesaplanmış ortam kapatma (vadiler ve dere yatakları koyu): claude/tools/bake_ao.py */
const AO_FILES={mountain:['tepeler-ao.png',6500],terrain:['golbasi-ao.png',4500],airfield:['guvercinlik-ao.png',4000]},AO_TEX={};
export function setSurfaceArea(area){const f=AO_FILES[area];if(!f||typeof document==='undefined'){SURFACE_U.uAOR.value=0;return;}let t=AO_TEX[area];if(!t){t=AO_TEX[area]=new T.TextureLoader().load('assets/terrain/'+f[0]);t.flipY=false;t.colorSpace=T.NoColorSpace;t.wrapS=t.wrapT=T.ClampToEdgeWrapping;}SURFACE_U.uAO.value=t;SURFACE_U.uAOR.value=f[1];}
/* bozkır zemini ayrıntı dokusu (döşenir): toprak lekeleri, kuru ot sapları, çakıl. Ortalama parlaklık ≈0,5: uydu rengini bozmaz, yalnız doku katar */
function detailTexture(){if(typeof document==='undefined')return null;const N=LITE?512:1024,c=document.createElement('canvas');c.width=c.height=N;const x=c.getContext('2d');let seed=17;const r=()=>(seed=(seed*16807)%2147483647)/2147483647;
 /* v0.44 bozkır zemini ayrıntı dokusu: uzun çizgiler yerine (yakından bakışta paralel çizik gibi görünüyordu) döşenebilir gürültü
    lekeleri, toprak kesekleri, çakıl ve kısa ot tutamları. Ortalama parlaklık ≈0,5. */
 const img=x.createImageData(N,N),d=img.data,G=new Float32Array(N*N);
 const oct=(f,amp)=>{const M=f,grid=new Float32Array(M*M);for(let i=0;i<M*M;i++)grid[i]=r()*2-1;for(let y=0;y<N;y++)for(let X=0;X<N;X++){const u=X/N*M,v=y/N*M,i0=Math.floor(u),j0=Math.floor(v),fu=u-i0,fv=v-j0,su=fu*fu*(3-2*fu),sv=fv*fv*(3-2*fv),g=(i,j)=>grid[((j%M+M)%M)*M+((i%M+M)%M)];G[y*N+X]+=amp*((g(i0,j0)*(1-su)+g(i0+1,j0)*su)*(1-sv)+(g(i0,j0+1)*(1-su)+g(i0+1,j0+1)*su)*sv);}};
 oct(4,26);oct(9,20);oct(22,16);oct(56,12);oct(140,9);
 for(let i=0;i<N*N;i++){const v=128+G[i];d[i*4]=d[i*4+1]=d[i*4+2]=Math.max(0,Math.min(255,v));d[i*4+3]=255;}x.putImageData(img,0,0);
 const wrap=(px,py,fn)=>{for(const ox of [-N,0,N])for(const oy of [-N,0,N]){x.save();x.translate(ox,oy);fn(px,py);x.restore();}};
 for(let i=0;i<(LITE?700:2600);i++){const px=r()*N,py=r()*N,rad=.8+r()*2.6,v=r()<.5?220:40;wrap(px,py,(a,b)=>{x.fillStyle=`rgba(${v},${v},${v*.92},${.25+r()*.3})`;x.beginPath();x.ellipse(a,b,rad,rad*(.6+r()*.4),r()*3,0,6.283);x.fill();});} /* kesek ve çakıl */
 for(let i=0;i<(LITE?900:3400);i++){const px=r()*N,py=r()*N,n=3+Math.floor(r()*4),len=N*(.003+r()*.006),v=r()<.6?185:70;x.strokeStyle=`rgba(${v},${v},${v*.85},${.22+r()*.22})`;x.lineWidth=.6+r()*.6;wrap(px,py,(a,b)=>{x.beginPath();for(let k=0;k<n;k++){const ang=-Math.PI/2+(r()-.5)*2.2;x.moveTo(a,b);x.lineTo(a+Math.cos(ang)*len,b+Math.sin(ang)*len);}x.stroke();});} /* kısa ot tutamı (yıldız biçimli) */
 const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;t.colorSpace=T.NoColorSpace;t.generateMipmaps=true;return t;}
SURFACE_U.uDet.value=detailTexture();
export function enhanceSurface(material,{rock=.0,snowLine=1e9,detail=1,asphalt=false,runway=false,canopy=false}={}){
 material.userData.surface={rock,snowLine,detail,asphalt,canopy};
 material.onBeforeCompile=sh=>{
  sh.uniforms.uRock={value:rock};sh.uniforms.uSnow={value:snowLine};sh.uniforms.uDetail={value:detail};sh.uniforms.uTime=SURFACE_U.uTime;sh.uniforms.uCloud=SURFACE_U.uCloud;sh.uniforms.uWind=SURFACE_U.uWind;sh.uniforms.uDet=SURFACE_U.uDet;sh.uniforms.uAO=SURFACE_U.uAO;sh.uniforms.uAOR=SURFACE_U.uAOR;
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWorldPos;varying vec3 vWorldN;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvWorldPos=(modelMatrix*vec4(transformed,1.)).xyz;vWorldN=normalize(mat3(modelMatrix)*objectNormal);');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uRock,uSnow,uDetail,uTime,uCloud,uAOR;uniform vec2 uWind;uniform sampler2D uDet,uAO;varying vec3 vWorldPos;varying vec3 vWorldN;'+NOISE)
   .replace('#include <color_fragment>',`#include <color_fragment>
   {vec2 w=vWorldPos.xz;float cd=length(cameraPosition-vWorldPos),nearF=1.-smoothstep(90.,700.,cd);
    float n1=fbm(w*.012),n2=vnoise(w*.19),n3=vnoise(w*1.7),n4=vnoise(w*7.3),n5=vnoise(w*23.);
    {float fw0=length(fwidth(w));n3=mix(.5,n3,1.-smoothstep(.3,.9,fw0*1.7));n4=mix(.5,n4,1.-smoothstep(.3,.9,fw0*7.3));n5=mix(.5,n5,1.-smoothstep(.3,.9,fw0*23.));} /* v0.44 piksel boyutundan ince gürültü söner: uzakta moire çizgisi olmaz */
    vec3 base=diffuseColor.rgb;float lum=dot(base,vec3(.299,.587,.114));
    ${asphalt?`float det=(n2-.5)*.10+(n3-.5)*.10+(n4-.5)*.08+(n5-.5)*.06*nearF;diffuseColor.rgb*=1.+det*uDetail;
    diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*.82,smoothstep(.55,.8,vnoise(w*vec2(.05,.9))));
    diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*.62,smoothstep(.72,.9,vnoise(w*vec2(.9,.012)))*.55);
    {/* v0.45 asfaltta çatlak (sırt gürültüsü) ve onarım yaması; piksel boyutundan inceyse söner */float fwA=length(fwidth(w)),ca=1.-smoothstep(.08,.3,fwA);float r1=abs(vnoise(w*.16+vec2(vnoise(w*.05)*3.))-.5);diffuseColor.rgb*=1.-(1.-smoothstep(.0,.022,r1))*.2*ca*smoothstep(.45,.65,vnoise(w*.03+5.));
     vec2 pc=floor(w/vec2(7.,4.5));float pt=step(.93,h21(pc));diffuseColor.rgb*=1.-pt*.13*(1.-smoothstep(.6,1.6,fwA));diffuseColor.rgb*=1.+(h21(floor(w*.5))-.5)*.05*ca;}${runway?`
    {/* v0.43 pist: teker izi (lastik birikintisi) temas bölgelerinde ve orta hatta, yamalı asfalt */vec2 rd=vec2(${Math.sin(RUNWAY.heading).toFixed(5)},${(-Math.cos(RUNWAY.heading)).toFixed(5)}),rp=vec2(-rd.y,rd.x);float ra=dot(w,rd),rc=dot(w,rp);
     float dth=1008.-abs(ra),tz=smoothstep(100.,200.,dth)*(1.-smoothstep(600.,800.,dth));float lane=exp(-pow(rc/5.5,2.));float streak=vnoise(vec2(ra*.04,rc*3.1));
     diffuseColor.rgb*=1.-.42*tz*lane*smoothstep(.25,.75,streak);diffuseColor.rgb*=1.-.12*lane*smoothstep(.4,.8,vnoise(vec2(ra*.01,rc*.8)));
     diffuseColor.rgb*=1.+.10*(step(.7,vnoise(vec2(ra,rc)*.06))-.3);}`:''}`:`
    /* uydu pikselinin (4–10 m) üstünde örtüye göre ince ayrıntı: bitki örtüsünde ot / çalı lekeleri, çıplak zeminde toprak ve taş */
    ${canopy?`/* v0.44 uydu görüntüsündeki ağaç tepeleri (koyu yeşil) zeminde halı gibi görünmez: 3B ağaçların altı gölgeli toprak / ot olur */
    {float gEx=base.g-max(base.r,base.b*1.25);float cn=max(smoothstep(.003,.018,gEx)*(1.-smoothstep(.06,.13,lum)),1.-smoothstep(.03,.07,lum))*(1.-smoothstep(1700.,2500.,cd));
     vec3 floorC=mix(vec3(.15,.115,.07),vec3(.11,.105,.06),n2)*(.85+.3*n3);base=mix(base,floorC,cn*.92);diffuseColor.rgb=base;lum=dot(base,vec3(.299,.587,.114));}`:''}
    float green=clamp((base.g-max(base.r,base.b))*7.+.25,0.,1.),bright=smoothstep(.38,.68,lum);
    float macro=(n1-.5)*.30+(n2-.5)*.15;
    {/* v0.44 orta ölçek (3–15 m) doğal düzensizlik: uydu pikselinin bulanık “fırça” görünümü kırılır */float mf=1.-smoothstep(1400.,4200.,cd);float m1=vnoise(w*.075+3.1)*.65+vnoise(w*.19+1.3)*.35;float m2=vnoise(w*.31+7.);macro+=((m1-.5)*.34+(m2-.5)*.24)*mf;
     diffuseColor.rgb*=mix(vec3(1.),vec3(.94,1.03,.9),smoothstep(.55,.8,m1)*mf*(.3+.7*(1.-bright)));}
    {/* v0.44 bozkırda çalı / ot öbeği benekleri (≈2 m, öbekler hâlinde): açık renkli kuru zeminde 1,5 km'ye kadar görülür; piksel boyutundan küçükse söner (titreme olmaz) */
     float fw=length(fwidth(w)),vis=(1.-smoothstep(1.4,4.,fw))*(1.-smoothstep(1500.,2200.,cd)),cl=smoothstep(.4,.7,vnoise(w*.06-4.));
     if(vis*cl>.02){float sp=${LITE?'smoothstep(.6,.82,vnoise(w*.42+11.))':'shrubs(w*.42+11.)'}*cl;diffuseColor.rgb*=1.-sp*vis*(.3+.25*bright)*(1.-green*.5)*uDetail;}}
    float grass=(n4-.5)*.24+(n5-.5)*.20-smoothstep(.62,.8,vnoise(w*2.6))*.16;
    float soil=(n3-.5)*.18+(n5-.5)*.12-step(.955,h21(floor(w*2.2)))*.22;
    diffuseColor.rgb*=1.+(macro+mix(soil,grass,green)*nearF*.6)*uDetail;
    {float d1=texture2D(uDet,w/9.).r,d2=texture2D(uDet,mat2(.8,-.6,.6,.8)*w/41.+.37).r,dd=(d1-.5)*1.15*(1.-smoothstep(150.,900.,cd))+(d2-.5)*.7*(1.-smoothstep(400.,2600.,cd));diffuseColor.rgb*=1.+dd*uDetail;} /* döşenen ayrıntı dokusu: iki ölçek, tekrar görünmez */
    diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.8,.76,.68),bright*.8); /* parlak çıplak zemin plastik beyaz görünmez */
    {float hl=max(0.,dot(diffuseColor.rgb,vec3(.299,.587,.114))-.32);diffuseColor.rgb=diffuseColor.rgb/(1.+hl*1.6)*mix(vec3(1.),vec3(1.,.95,.86),smoothstep(0.,.25,hl));} /* v0.44 kireçli / açık zemin kar gibi beyaz parlamaz: tepe değerleri sıkıştırılır, sıcak ton */
    diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.92,1.02,.9),green*smoothstep(.3,.7,n2)*.35);`}
    float slope=1.-clamp(normalize(vWorldN).y,0.,1.);
    ${asphalt?'':`{/* v0.45 çıplak yamaçlarda yağmur oyuntusu (yarıntı) izleri: eğim yönünde uzun, enine dar koyu çizgiler; Ankara çevresi marn tepelerine özgü */
     vec3 wn=normalize(vWorldN);vec2 dn=wn.xz/max(1e-3,length(wn.xz));float sl=smoothstep(.06,.28,1.-wn.y)*(1.-smoothstep(1800.,3500.,cd));
     if(sl>.01){vec2 q=vec2(dot(w,dn)*.025,dot(w,vec2(-dn.y,dn.x))*.32);float gl=vnoise(q+vec2(0.,vnoise(q*.7+3.)*2.))*.7+vnoise(q*2.1+9.)*.3;float fwG=length(fwidth(w))*.32;
      float rill=smoothstep(.6,.82,gl)*(1.-smoothstep(.4,1.,fwG));diffuseColor.rgb*=1.-rill*sl*(.16+.2*smoothstep(.3,.6,lum))*uDetail;diffuseColor.rgb*=1.+smoothstep(.15,.3,1.-gl)*sl*.05;}}`}
    ${asphalt?'':'{vec3 wn=normalize(vWorldN);float nf=clamp(-wn.z*4.,0.,1.)*smoothstep(.02,.18,1.-wn.y),sf=clamp(wn.z*4.,0.,1.)*smoothstep(.02,.18,1.-wn.y);diffuseColor.rgb*=mix(vec3(1.),vec3(.86,.93,.82),nf*.7);diffuseColor.rgb*=mix(vec3(1.),vec3(1.05,1.01,.94),sf*.5);} /* v0.44 kuzey yamaçlar daha koyu ve yeşil (nem), güney yamaçlar kuru ve açık */'}
    float rk=smoothstep(.24,.5,slope+(n2-.5)*.12)*uRock;
    vec3 rockC=mix(vec3(.35,.33,.29),vec3(.47,.44,.38),n3)*(0.8+n1*.4);diffuseColor.rgb=mix(diffuseColor.rgb,rockC,rk);
    float sn=smoothstep(uSnow-18.,uSnow+12.,vWorldPos.y+(n1-.5)*60.)*(1.-smoothstep(.45,.7,slope));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.93,.95,.97),sn);
    if(uAOR>0.){vec2 aq=(w+uAOR)/(2.*uAOR);if(aq.x>0.&&aq.y>0.&&aq.x<1.&&aq.y<1.)diffuseColor.rgb*=mix(1.,texture2D(uAO,aq).r,.85);} /* vadiler, dere yatakları ve tepe etekleri gölgede */
    /* bulut gölgeleri rüzgârla kayar */
    if(uCloud>.001){${LITE?'float cs=smoothstep(.48,.72,vnoise(w*.0015-uWind*uTime*.0015+vec2(13.,5.)));':'float cs=smoothstep(.48,.72,fbm(w*.0015-uWind*uTime*.0015+vec2(13.,5.)));'}diffuseColor.rgb*=1.-cs*uCloud;}}`)
   .replace('#include <normal_fragment_maps>',LITE?'#include <normal_fragment_maps>':`#include <normal_fragment_maps>
   {/* v0.44 zemin kabartısı dünya uzayında sonlu farkla: ekran türevli (dFdx) kabartı yatık bakışta çizgi çizgi görünüyordu.
       Yakında tümsek ve taşlar, orta mesafede yamaçlarda 15–45 m ölçekli sırt ve yarıntı. */
    vec2 w=vWorldPos.xz;float fwB=length(fwidth(w));
    float cd=length(cameraPosition-vWorldPos),bf=1.-smoothstep(60.,520.,cd),mf=${asphalt?'0.':'(1.-smoothstep(900.,3200.,cd))*smoothstep(.015,.12,1.-normalize(vWorldN).y)'};
    if(bf>0.||mf>0.){float a1=1.-smoothstep(.3,.9,fwB*.8),a2=1.-smoothstep(.3,.9,fwB*3.4),e=max(.06,fwB*.6);
     #define HB(q) (${asphalt?'(vnoise((q)*3.)*.015)*bf':'(vnoise((q)*.09)*.38+vnoise((q)*.21+2.)*.18+vnoise((q)*.8)*.22*a1+vnoise((q)*3.4)*.06*a2)*bf+(vnoise((q)*.022+1.7)*2.4+vnoise((q)*.06)*1.1)*mf'})
     float h0=HB(w),hx=HB(w+vec2(e,0.)),hz=HB(w+vec2(0.,e));vec3 nW=normalize(normalize(vWorldN)+vec3(-(hx-h0)/e,0.,-(hz-h0)/e));
     normal=normalize((viewMatrix*vec4(nW,0.)).xyz)*(gl_FrontFacing?1.:-1.);
     #undef HB
    }}`);
 };
 material.customProgramCacheKey=()=>'surface2-'+[rock,snowLine,detail,asphalt,runway,canopy].join('-');
 material.needsUpdate=true;return material;
}

// ---------- Water: analytic wave normals, sky-reflection fresnel, sun glint, shore foam, rotor downwash ripples ----------
/* v0.43 su malzemeleri kaydı: deniz / göl yüzeyi ve gerçek sahalardaki göletler aynı gökyüzü ve güneşle güncellenir */
export const WATER_MATS=new Set();
export function createWater(){
 const geo=new T.PlaneGeometry(60000,60000,1,1);geo.rotateX(-Math.PI/2);
 const m=new T.Mesh(geo,waterMaterial(true));m.name='Su yüzeyi';m.position.y=.06;m.receiveShadow=false;return m;
}
export function waterMaterial(sea=false){
 const mat=new T.ShaderMaterial({fog:true,transparent:false,
  uniforms:T.UniformsUtils.merge([T.UniformsLib.fog,{time:{value:0},sunDir:{value:new T.Vector3(.4,.7,.3)},skyTop:{value:new T.Color('#3f7cc4')},skyHorizon:{value:new T.Color('#c9dbe3')},deep:{value:new T.Color('#0f3a4c')},shallow:{value:new T.Color('#2f7f86')},sunColor:{value:new T.Color('#fff3da')},heli:{value:new T.Vector4(0,0,999,0)},wind:{value:new T.Vector2(0,0)}}]),
  vertexShader:`#include <common>
  #include <fog_pars_vertex>
  varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vec4 mvPosition=viewMatrix*w;gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
  }`,
  fragmentShader:`#include <common>
  #include <fog_pars_fragment>
  uniform float time;uniform vec3 sunDir,skyTop,skyHorizon,deep,shallow,sunColor;uniform vec4 heli;uniform vec2 wind;varying vec3 vW;${NOISE}
  float sq(float x){return x*x;}
  float island(vec2 p){return max(26.-sq((p.x-750.)/7.)/100.-sq((p.y+300.)/10.)/100.,18.-sq((p.x+1100.)/10.)/100.-sq((p.y-500.)/8.)/100.);}
  vec2 wave(vec2 p,vec2 d,float k,float a,float s){float ph=dot(p,d)*k-time*s;return d*(a*k*cos(ph));}
  void main(){vec2 p=vW.xz;float ws=.6+length(wind)*.06;
   float cd=length(cameraPosition-vW),fN=clamp(1.-cd/350.,0.,1.),fM=clamp(1.-cd/1400.,0.,1.),graz=clamp(abs(cameraPosition.y-vW.y)/max(cd,1.)*5.,0.,1.);fN*=graz;fM*=mix(.25,1.,graz); /* v0.39 sıyırma açısında da uzakta küçük dalgalar söner: kumlanma ve şerit görüntüsü yok */
   vec2 g=wave(p,normalize(vec2(.8,.6)),.045,.55*ws*(.35+.65*fM),1.25)+wave(p,normalize(vec2(-.4,.9)),.083,.32*ws*fM,1.7)+wave(p,normalize(vec2(.95,-.3)),.17,.16*ws*fN,2.4)+wave(p,normalize(vec2(-.7,-.7)),.31,.08*ws*fN,3.3);
   g+=(vec2(vnoise(p*.9+time*.4),vnoise(p*.9-time*.37))-.5)*.25*fN;g*=mix(1.,.3,clamp(cd/3000.,0.,1.));
   // rotor downwash: radial ripples and a darkened, roughened disc under the rotor
   float dh=distance(p,heli.xy),ag=heli.z,str=heli.w*clamp(1.-ag/18.,0.,1.);
   if(str>0.){float rr=sin(dh*1.4-time*9.)*exp(-dh/22.)*str;g+=normalize(p-heli.xy+1e-3)*rr*.9;}
   vec3 n=normalize(vec3(-g.x,1.,-g.y));vec3 v=normalize(cameraPosition-vW);
   float fres=.02+.98*pow(1.-max(dot(n,v),0.),5.);vec3 r=reflect(-v,n);
   vec3 sky=mix(skyHorizon,skyTop,pow(clamp(r.y,0.,1.),.5));
   #if SEA==1
   float isl=island(p);
   #else
   float isl=-30.;
   #endif
   vec3 body=mix(deep,shallow,clamp(1.+isl/30.,0.,1.)*.85);
   vec3 c=mix(body,sky,fres);
   float glint=pow(max(dot(r,normalize(sunDir)),0.),260.)*5.+pow(max(dot(r,normalize(sunDir)),0.),40.)*.18;c+=sunColor*glint;
   float shore=smoothstep(-5.,-.3,isl)*(1.-smoothstep(-.3,.6,isl));float foam=shore*smoothstep(.35,.7,vnoise(p*.35+time*.3)+.35*sin(isl*2.+time*1.5));
   float spray=str*exp(-dh/16.)*smoothstep(.4,.9,vnoise(p*1.3+time*2.));
   c=mix(c,vec3(.93,.96,.97),clamp(foam*.8+spray*.85,0.,1.));
   gl_FragColor=vec4(c,1.);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
   #include <fog_fragment>
  }`});
 if(!sea)mat.uniforms.deep.value.set('#1d3f3c'),mat.uniforms.shallow.value.set('#2e5a52'); /* gölet: daha koyu, yeşilimsi */
 mat.defines={SEA:sea?1:0};WATER_MATS.add(mat);return mat;
}

// ---------- Distant terrain ring (beyond the 6 km physics tile, visual horizon only) ----------
/* v0.39 gerçek sahalar: zemin düzlemi yarıçapı, geniş uydu görüntüsü ve kapsadığı yarıçap */
function filteredTexture(url,filter,N){const c=document.createElement('canvas');c.width=c.height=N;const x=c.getContext('2d');x.fillStyle='#9a8a6c';x.fillRect(0,0,N,N);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;const im=new Image();im.onload=()=>{x.filter=filter;x.drawImage(im,0,0,N,N);x.filter='none';t.needsUpdate=true;};im.src=url;return t;}
export const REAL_GROUND={forest:{half:4000,outer:9400},water:{half:4000,outer:9400},airfield:{half:3000,wide:'guvercinlik-s2-genis.jpg',wideR:7000,outer:9000},terrain:{half:4500,wide:'golbasi-s2-genis.jpg',wideR:9500,outer:9400},mountain:{half:6500,wide:'tepeler-s2-genis.jpg',wideR:9500,outer:9400}};
export function createHorizon(area){
 const RG=REAL_GROUND[area],half=RG?.half??3000,edge=half-10,inner=half-50,outer=RG?.outer??9000,seg=200,rings=30,pos=[],col=[],idx=[],uv=[],real=!!RG?.wide,wr=RG?.wideR??7000; /* v0.37 meydan, v0.39 arazi ve tepeler: gerçek arazi + geniş uydu görüntüsü */
 const base={terrain:[.55,.52,.40],airfield:[.50,.50,.38],forest:[.20,.30,.18],mountain:[.42,.42,.40],water:[.12,.30,.38]}[area]??[.5,.5,.4];
 const hfun=(x,z)=>{const d=Math.hypot(x,z),k=Math.min(1,(d-inner)/1500);if(area==='water'){const a=Math.atan2(z,x);return d>6200&&(Math.sin(a*3+1)>.2)?Math.max(0,(d-6200)*.06*(.6+.4*Math.sin(a*7)))*k:-.5;}
  const ridge=n2(x*.0007,z*.0007)*(area==='mountain'?900:area==='forest'?240:area==='airfield'?160:220)+n2(x*.0021+3,z*.0021)*(area==='mountain'?260:70);return ridge*k;};
 for(let r=0;r<=rings;r++){const d=inner+(outer-inner)*Math.pow(r/rings,1.6);for(let i=0;i<=seg;i++){const a=i/seg*Math.PI*2,x=Math.cos(a)*d,z=Math.sin(a)*d,sq=Math.min(1,edge/Math.max(Math.abs(Math.cos(a)),Math.abs(Math.sin(a)))/d),ex=x*sq,ez=z*sq,y=real?terrainHeight(r===0?ex:x,r===0?ez:z,area)-(r===0?1.5:.3*Math.min(1,r/3)):hfun(x,z)+(r===0?terrainHeight(ex,ez,area)-2:0);pos.push(r===0?ex:x,y-(r>0&&Math.max(Math.abs(x),Math.abs(z))<half-5?18:0),r===0?ez:z); /* v0.39 ufuk halkası zemin düzleminin köşeleri altında kalır (z-fighting titremesi yok) */uv.push(((r===0?ex:x)+wr)/(2*wr),1-((r===0?ez:z)+wr)/(2*wr));
  const snow=area==='mountain'&&y>620?Math.min(1,(y-620)/140):0;const c=area==='water'&&y<=0?base:[base[0]*(.85+.2*Math.sin(i)),base[1],base[2]];col.push(...c.map((v,j)=>v*(1-snow)+[.92,.94,.96][j]*snow));}}
 for(let r=0;r<rings;r++)for(let i=0;i<seg;i++){const a=r*(seg+1)+i,b=a+seg+1;idx.push(a,b,a+1,a+1,b,b+1);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();if(real){g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));const tex=area==='airfield'?filteredTexture('assets/terrain/'+RG.wide,'saturate(0.76) hue-rotate(6deg) contrast(1.12) brightness(0.96)',1024):filteredTexture('assets/terrain/'+RG.wide,'saturate(0.66) hue-rotate(9deg) contrast(1.12) brightness(0.95)',LITE?1024:2048);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;const m=new T.Mesh(g,enhanceSurface(new T.MeshStandardMaterial({map:tex,roughness:1}),{detail:.4}));m.name='Ufuk arazisi (gerçek)';return m;}
 const m=new T.Mesh(g,enhanceSurface(new T.MeshStandardMaterial({vertexColors:true,roughness:1}),{rock:area==='mountain'?1:0,snowLine:area==='mountain'?640:1e9,detail:.7}));m.name='Ufuk arazisi';return m;
}
function hash(x,z){const s=Math.sin(x*127.1+z*311.7)*43758.5453;return s-Math.floor(s);}
function n2(x,z){const i=Math.floor(x),j=Math.floor(z),u=x-i,v=z-j,a=hash(i,j),b=hash(i+1,j),c=hash(i,j+1),d=hash(i+1,j+1),su=u*u*(3-2*u),sv=v*v*(3-2*v);return (a+(b-a)*su)*(1-sv)+(c+(d-c)*su)*sv;}

// ---------- Rotor downwash particles (dust, spray, leaves) ----------
function softDot(){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.5,'rgba(255,255,255,.45)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new T.CanvasTexture(c);}
export function createDownwash(){
 const N=1100,geo=new T.BufferGeometry(),pos=new Float32Array(N*3),alpha=new Float32Array(N),size=new Float32Array(N);
 geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setAttribute('alpha',new T.BufferAttribute(alpha,1));geo.setAttribute('size',new T.BufferAttribute(size,1));
 const seeds=Array.from({length:N},(_,i)=>({a:hash(i,1)*Math.PI*2,life:1.4+hash(i,2)*1.8,off:hash(i,3)*4,sp:.7+hash(i,4)*.6,up:hash(i,5)}));
 const mat=new T.ShaderMaterial({transparent:true,depthWrite:false,fog:true,uniforms:T.UniformsUtils.merge([T.UniformsLib.fog,{map:{value:typeof document==='undefined'?null:softDot()},color:{value:new T.Color('#b9a888')},scale:{value:300}}]),
  vertexShader:`#include <common>
  #include <fog_pars_vertex>
  attribute float alpha;attribute float size;varying float vA;uniform float scale;void main(){vA=alpha;vec4 mvPosition=modelViewMatrix*vec4(position,1.);gl_PointSize=size*scale/max(1.,-mvPosition.z);gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
  }`,
  fragmentShader:`#include <common>
  #include <fog_pars_fragment>
  uniform sampler2D map;uniform vec3 color;varying float vA;void main(){vec4 t=texture2D(map,gl_PointCoord);gl_FragColor=vec4(color,t.a*vA);if(gl_FragColor.a<.01)discard;
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
  }`});
 const points=new T.Points(geo,mat);points.frustumCulled=false;points.name='Rotor aşağı akımı';points.userData={N,seeds};return points;
}
export function updateDownwash(points,{time,position,agl,rpmRatio,area,ground,contact,impact=0}){
 const {N,seeds}=points.userData,pos=points.geometry.attributes.position.array,alpha=points.geometry.attributes.alpha.array,size=points.geometry.attributes.size.array;
 const surf=surfaceProfile(position[0],position[2],area),water=surf.kind==='water',paved=surf.kind==='paved',forest=area==='forest';
 points.material.uniforms.color.value.set(water?'#eef4f6':paved?'#b9b6ad':forest?'#6f7a4a':area==='mountain'?'#a59d8c':'#bda983');
 const strength=Math.max(0,Math.min(1,(1-agl/16)))*Math.min(1,Math.max(0,rpmRatio-.25)/.55)*({paved:.04,grass:.32,forest:.3,wetland:.15,rock:.4,water:1}[surf.kind]??.6)+(impact>0?impact:0); /* v0.41 asfaltta toz yok denecek kadar az, çimde az; toprak / anızda orta */
 const gy=terrainHeight(position[0],position[2],area)+(water?.1:.05);
 for(let i=0;i<N;i++){const s=seeds[i],age=((time+s.off)%s.life)/s.life,r=3+age*(water?16:20)*s.sp*(1+impact*.8),a=s.a+age*.4;
  pos[i*3]=position[0]+Math.cos(a)*r;pos[i*3+2]=position[2]+Math.sin(a)*r;pos[i*3+1]=gy+.3+age*(water?2.5:3.5)*(.4+s.up)+(forest?age*2:0);
  const vis=strength*(1-age)*Math.min(1,age*6)*(i<N*Math.min(1,strength*1.3)?1:0);alpha[i]=Math.min(.6,vis*(water?.7:.38));size[i]=(water?1.6:2.6)+age*(water?3:6);}
 points.visible=strength>.01;points.geometry.attributes.position.needsUpdate=points.geometry.attributes.alpha.needsUpdate=points.geometry.attributes.size.needsUpdate=true;
}

// ---------- Airfield furniture: windsock (from configured wind), tower, PAPI, threshold/end lights, edge lines ----------
function stripeTexture(){const c=document.createElement('canvas');c.width=128;c.height=16;const x=c.getContext('2d');for(let i=0;i<5;i++){x.fillStyle=i%2?'#f4f1ea':'#e5532d';x.fillRect(i*128/5,0,128/5+1,16);}const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;}
export function createAirfieldExtras(){
 const g=new T.Group();g.name='Meydan donanımı';const H=RUNWAY.heading,sx=Math.sin(H),cz=-Math.cos(H),at=(al,off)=>{const x=al*sx+off*Math.cos(H),z=al*cz+off*Math.sin(H);return [x,terrainHeight(x,z,'airfield'),z];};
 const white=new T.MeshStandardMaterial({color:'#efeee6',roughness:.9,polygonOffset:true,polygonOffsetFactor:-4});
 // continuous runway edge lines
 for(const off of [-16.5,16.5]){const geo=new T.PlaneGeometry(.9,2000,1,40);geo.rotateX(-Math.PI/2);geo.rotateY(-H);const p0=at(0,off);geo.translate(p0[0],0,p0[2]);const p=geo.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,terrainHeight(p.getX(i),p.getZ(i),'airfield')+.16);const m=new T.Mesh(geo,white);g.add(m);}
 // touchdown-zone pairs
 for(const end of [-1,1])for(const k of [150,450,600]){for(const off of [-6,6]){const geo=new T.PlaneGeometry(1.8,22);geo.rotateX(-Math.PI/2);geo.rotateY(-H);const p=at(end*(1008.5-k),off);const m=new T.Mesh(geo,white);m.position.set(p[0],p[1]+.16,p[2]);g.add(m);}}
 // threshold (green) and end (red) lights, PAPI boxes
 const lightGeo=new T.SphereGeometry(.42,8,6);
 for(const end of [-1,1])for(let k=-8;k<=8;k++){const p=at(end*1009.5,k*2.1);const m=new T.Mesh(lightGeo,new T.MeshBasicMaterial({color:end<0?'#4cff7a':'#ff4a3d'}));m.position.set(p[0],p[1]+.45,p[2]);g.add(m);}
 for(let i=0;i<4;i++){const p=at(-1008.5+300,-30-i*9);const box=new T.Mesh(new T.BoxGeometry(1.6,1,1.2),new T.MeshStandardMaterial({color:'#2e2e2e'}));box.position.set(p[0],p[1]+.5,p[2]);box.rotation.y=-H;g.add(box);const lamp=new T.Mesh(new T.CircleGeometry(.45,12),new T.MeshBasicMaterial({color:i<2?'#ffffff':'#ff3b30'}));lamp.position.set(p[0]-Math.sin(H)*.62,p[1]+.6,p[2]+Math.cos(H)*.62);lamp.rotation.y=-H+Math.PI;g.add(lamp);}
 // v0.39 uçuş kulesi: Güvercinlik Meydan Talimatı K39°56'20" D032°44'26" → pist çerçevesinde boyuna +151 m, enine −370 m (9 nolu taksi yolu batı ucu önü)
 {const p=at(151,-370),mat=new T.MeshStandardMaterial({color:'#d9d4c4',roughness:.8});const shaft=new T.Mesh(new T.BoxGeometry(6,22,6),mat);shaft.position.set(p[0],p[1]+11,p[2]);shaft.castShadow=true;g.add(shaft);
  const cab=new T.Mesh(new T.CylinderGeometry(5.6,4.6,4.2,8),new T.MeshStandardMaterial({color:'#1d2a30',roughness:.15,metalness:.6}));cab.position.set(p[0],p[1]+24,p[2]);g.add(cab);
  const roof=new T.Mesh(new T.CylinderGeometry(6.4,6.4,.6,8),mat);roof.position.set(p[0],p[1]+26.4,p[2]);g.add(roof);
  const beacon=new T.Mesh(new T.SphereGeometry(.5,8,6),new T.MeshBasicMaterial({color:'#ff3b30'}));beacon.position.set(p[0],p[1]+27.4,p[2]);beacon.name='tower-beacon';g.add(beacon);}
 // windsock
 const sock=new T.Group();sock.name='Rüzgâr tulumu';const sp=at(-760,46);sock.position.set(sp[0],sp[1],sp[2]);
 const pole=new T.Mesh(new T.CylinderGeometry(.09,.12,6,8),new T.MeshStandardMaterial({color:'#d8d8d0'}));pole.position.y=3;sock.add(pole);
 const ring=new T.Group();ring.position.y=5.9;sock.add(ring);
 const cone=new T.Mesh(new T.CylinderGeometry(.18,.45,3.6,14,4,true),new T.MeshStandardMaterial({map:typeof document==='undefined'?null:stripeTexture(),side:T.DoubleSide,roughness:.9}));cone.geometry.rotateZ(Math.PI/2);cone.geometry.translate(-1.85,0,0);ring.add(cone);
 sock.userData={ring,cone};g.add(sock);g.userData.windsock=sock;
 return g;
}
export function updateAirfieldExtras(group,{time,windFromDeg,windKt}){
 const sock=group.userData.windsock;if(!sock)return;const {ring,cone}=sock.userData,to=(windFromDeg+180)*Math.PI/180;
 // sleeve points downwind; full extension around 15 kt
 ring.rotation.set(0,0,0);ring.rotation.y=-(to-Math.PI/2)+Math.PI;const lift=Math.min(1,windKt/15);ring.rotation.z=-(1-lift)*1.25+Math.sin(time*(2+windKt*.15))*.05*lift;
 cone.rotation.x=Math.sin(time*6.3)*.08*lift;
 const b=group.getObjectByName('tower-beacon');if(b)b.visible=Math.sin(time*3.1)>0;
}

// ---------- Forest: two tree types with per-instance tint and gentle wind sway ----------
/* v0.43 gerçekçi ağaç tacı: düzgün çokyüzlü yerine düzensiz (yumrulu) taç, alt tarafı gölgeli (vertex rengi), yumuşak gölgelendirme;
   iğne yapraklıda katmanlı, dişli silüet. Aynı örnek (instance) sayısı: kare hızı değişmez. */
const _n3=(x,y,z)=>{const s=Math.sin(x*12.9898+y*78.233+z*37.719)*43758.5453;return s-Math.floor(s);};
const _sn3=(x,y,z)=>{const fx=Math.floor(x),fy=Math.floor(y),fz=Math.floor(z),ux=x-fx,uy=y-fy,uz=z-fz,sm=t=>t*t*(3-2*t),a=sm(ux),b=sm(uy),c=sm(uz);let r=0;for(let i=0;i<2;i++)for(let j=0;j<2;j++)for(let k=0;k<2;k++)r+=_n3(fx+i,fy+j,fz+k)*(i?a:1-a)*(j?b:1-b)*(k?c:1-c);return r;};
function smoothByKey(g,keys){/* aynı noktadaki köşelerin normalleri birleştirilir: yumuşak (yuvarlak) taç gölgelemesi */g.computeVertexNormals();const n=g.attributes.normal,acc=new Map();for(let i=0;i<n.count;i++){const k=keys[i];const a=acc.get(k)??[0,0,0];a[0]+=n.getX(i);a[1]+=n.getY(i);a[2]+=n.getZ(i);acc.set(k,a);}
 for(let i=0;i<n.count;i++){const a=acc.get(keys[i]),l=Math.hypot(...a)||1;n.setXYZ(i,a[0]/l,a[1]/l,a[2]/l);}n.needsUpdate=true;}
/* v0.45 kaya: düzensiz, altı yassı ve koyu, yüzeyi köşeli (taş görünümü) */
export function rockGeometry(){const g=new T.IcosahedronGeometry(1,1),p=g.attributes.position,col=[],v=new T.Vector3();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).normalize();const r=1+.28*(_sn3(v.x*1.7+5,v.y*1.7,v.z*1.7+2)-.5)*2+.12*(_sn3(v.x*4,v.y*4+3,v.z*4)-.5)*2;v.multiplyScalar(r);if(v.y<-.2)v.y=-.2+(v.y+.2)*.3;p.setXYZ(i,v.x,v.y,v.z);const sh=.55+.5*Math.min(1,Math.max(0,(v.y+.3)/1.2));col.push(sh,sh*.98,sh*.95);}
 g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.computeVertexNormals();return g;}
export function lumpyCrown(low,det){const g=det!=null?(det<1?new T.DodecahedronGeometry(1,0):new T.IcosahedronGeometry(1,det)):LITE&&low?new T.DodecahedronGeometry(1,0):new T.IcosahedronGeometry(1,low?1:2), /* telefonda kalabalık ormanda 36 üçgen */p=g.attributes.position,col=[],keys=[];const v=new T.Vector3();
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).normalize();keys.push(Math.round(v.x*1e3)+','+Math.round(v.y*1e3)+','+Math.round(v.z*1e3));const r=1+.24*(_sn3(v.x*2.2+3,v.y*2.2+1,v.z*2.2+7)-.5)*2+.1*(_sn3(v.x*5,v.y*5,v.z*5)-.5)*2+(det===2||(det==null&&!low)?.09*(_sn3(v.x*10+2,v.y*10,v.z*10+5)-.5)*2:0); /* v0.44 yakın ayrıntıda ince yumrular */v.multiplyScalar(r);if(v.y<-.25)v.y=-.25+(v.y+.25)*.6;p.setXYZ(i,v.x,v.y,v.z);
  const sh=.34+.74*Math.pow(Math.min(1,Math.max(0,(v.y+.9)/1.9)),.85),vr=.9+.2*_sn3(v.x*4+9,v.y*4,v.z*4);col.push(sh*vr,sh*vr,sh*vr*.97);}
 g.setAttribute('color',new T.Float32BufferAttribute(col,3));smoothByKey(g,keys);return g;}
function coniferGeo(low,seg,rows){const g=new T.ConeGeometry(1,1,seg??(low?(LITE?6:8):12),rows??(low?(LITE?2:3):7),false);g.translate(0,.5,0);const p=g.attributes.position,col=[];
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=Math.atan2(z,x),rr=Math.hypot(x,z);const tier=.78+.22*((y*5)%1),jag=1+.1*Math.sin(a*7+y*13);const k=rr>1e-4?tier*jag:1;p.setXYZ(i,x*k,y,z*k);
  const sh=.36+.7*y;col.push(sh,sh,sh*.96);}
 g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.computeVertexNormals();return g;}
/* v0.43.1 orman: hücrelere bölünmüş, mesafeye göre ayrıntı seviyeli (LOD) çizim.
   Her ~250 m hücrenin kendi örnek (instance) kümesi var; kameraya yakın hücrede ayrıntılı yumrulu taç ve gölge,
   orta mesafede sade taç, uzakta gövdesiz en sade taç çizilir. Görüş dışındaki hücreler hiç çizilmez (frustum).
   Aynı ağaçlar, aynı yerler; yalnız çizim maliyeti düşer (yazılım WebGL'de ≈3 kat hızlı). */
/* v0.44 ağaç altı gölgesi (temas gölgesi / ortam kapatma): her ağacın altında yumuşak kenarlı koyu leke; gölge haritası
   olmayan orta mesafede de ağaç zemine oturur. Tek doku, örnek başına 2 üçgen. */
let _shadeTex=null;function treeShadeTex(){if(_shadeTex||typeof document==='undefined')return _shadeTex;const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,1,32,32,31);g.addColorStop(0,'rgba(0,0,0,.55)');g.addColorStop(.55,'rgba(0,0,0,.42)');g.addColorStop(.85,'rgba(0,0,0,.14)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,64,64);_shadeTex=new T.CanvasTexture(c);return _shadeTex;}
/* uzak hücreler için en sade taç (36 / 12 üçgen) */
function lumpyFar(){const g=new T.DodecahedronGeometry(1,0),p=g.attributes.position,col=[];const v=new T.Vector3();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).normalize();if(v.y<-.25)v.y=-.25+(v.y+.25)*.6;p.setXYZ(i,v.x,v.y,v.z);const sh=.34+.74*Math.min(1,Math.max(0,(v.y+.9)/1.9));col.push(sh,sh,sh*.97);}g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.computeVertexNormals();return g;}
function coniferFar(){const g=new T.ConeGeometry(1,1,6,1,false);g.translate(0,.5,0);const p=g.attributes.position,col=[];for(let i=0;i<p.count;i++){const sh=.36+.7*p.getY(i);col.push(sh,sh,sh*.96);}g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.computeVertexNormals();return g;}
const SUN0=new T.Vector3(.58,.56,.42).normalize();
/* v0.44 ağaç rengi çeşitliliği: koyu yeşil, zeytin, sarımsı yeşil, griye çalan yeşil (aynı türde de ağaçtan ağaca fark) */
const TREE_PAL=[[1,1,1],[1,1,1],[.85,.92,1.15],[1.25,1.12,.85],[1.15,.98,.8],[.9,.85,.95],[1.35,1.2,.7]];
function placeShade(m,sun){const o=new T.Object3D(),up=new T.Vector3(0,1,0),nrm=new T.Vector3(),q=new T.Quaternion(),el=Math.max(.12,Math.asin(Math.min(1,sun.y))),hx=-sun.x,hz=-sun.z,hl=Math.hypot(hx,hz)||1,dx=hx/hl,dz=hz/hl,yaw=Math.atan2(dx,dz),k=1/Math.tan(el);
 m.userData.trees.forEach((t,i)=>{const L=Math.min(t.h*k,t.h*4),len=Math.max(2*t.r,L*.85+t.r),off=Math.max(0,L*.5-t.r*.2);nrm.set(t.nx,1,t.nz).normalize();q.setFromUnitVectors(up,nrm);o.quaternion.copy(q).multiply(new T.Quaternion().setFromAxisAngle(up,yaw));o.position.set(t.x+dx*off,t.y+.12+off*(-t.nx*dx-t.nz*dz),t.z+dz*off);o.scale.set(t.r*2.1,1,len);o.updateMatrix();m.setMatrixAt(i,o.matrix);});
 m.instanceMatrix.needsUpdate=true;m.computeBoundingSphere();}
export function createForest(objects,{time,area,provider=null,buildR=0}={time:{value:0}}){
 const group=new T.Group();group.name='Orman';
 const many=objects.length>(LITE?3000:9000),tiersN=many?2:3; // v0.33: large forests use two crown tiers
 const sway=(mat,amp)=>{mat.onBeforeCompile=sh=>{sh.uniforms.uTime=time;sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uTime;').replace('#include <begin_vertex>',`#include <begin_vertex>
  #ifdef USE_INSTANCING
  float ph=instanceMatrix[3].x*.031+instanceMatrix[3].z*.027;float k=max(0.,position.y+.5)*${amp.toFixed(3)};transformed.x+=sin(uTime*1.3+ph)*k;transformed.z+=cos(uTime*1.1+ph*1.7)*k*.7;
  vLeaf=(instanceMatrix*vec4(transformed,1.)).xyz;
  #endif`).replace('#include <common>','#include <common>\nvarying vec3 vLeaf;');
  /* v0.43 yaprak dokusu: taç yüzeyinde ışık–gölge benekleri, köşeli yüzey görünmez */
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vLeaf;float lh(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}float ln(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(lh(i),lh(i+vec3(1,0,0)),f.x),mix(lh(i+vec3(0,1,0)),lh(i+vec3(1,1,0)),f.x),f.y),mix(mix(lh(i+vec3(0,0,1)),lh(i+vec3(1,0,1)),f.x),mix(lh(i+vec3(0,1,1)),lh(i+vec3(1,1,1)),f.x),f.y),f.z);}')
   .replace('#include <color_fragment>','#include <color_fragment>\n {float a=ln(vLeaf*1.6),b=ln(vLeaf*5.3),c2=ln(vLeaf*13.);diffuseColor.rgb*=.5+.62*smoothstep(.15,.85,a)+.22*(b-.5)+.12*(c2-.5);diffuseColor.rgb*=mix(vec3(1.),vec3(.92,1.04,.86),smoothstep(.55,.9,b));} /* v0.44 yaprak kümeleri: koyu boşluklar, ışıkta sarımsı yeşil */');};mat.customProgramCacheKey=()=>'sway2'+amp;return mat;};
 const trunkMat=new T.MeshStandardMaterial({color:'#4e3f2f',roughness:1});
 const crownC=sway(new T.MeshStandardMaterial({color:'#ffffff',roughness:.92,vertexColors:true}),.05);
 const crownB=sway(new T.MeshStandardMaterial({color:'#ffffff',roughness:.9,vertexColors:true}),.06);
 /* ayrıntı seviyeleri: 0 yakın, 1 orta, 2 uzak */
 const trunkGeo=new T.CylinderGeometry(.22,.38,1,6).translate(0,.5,0);
 const coneG=[LITE?coniferGeo(0,8,3):coniferGeo(false),LITE?coniferGeo(0,6,2):coniferGeo(true),coniferFar()],ballG=[lumpyCrown(0,LITE?1:2),lumpyCrown(0,LITE?0:1),lumpyFar()];
 const o=new T.Object3D(),col=new T.Color();
 const shadeTex=treeShadeTex(),shadeMat=shadeTex?new T.MeshBasicMaterial({map:shadeTex,color:'#000000',transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,fog:true}):null,shadeGeo=new T.PlaneGeometry(1,1).rotateX(-Math.PI/2);
 /* hücrelere dağıt */
 const C=LITE?300:250,built=new Map(); /* anahtar → hücre kaydı ya da null (boş hücre) */
 const bucket=trees=>{const cells=new Map();trees.forEach(t=>{const k=Math.floor(t.x/C)+':'+Math.floor(t.z/C);let c=cells.get(k);if(!c){c={key:k,ix:Math.floor(t.x/C),iz:Math.floor(t.z/C),conifer:[],broad:[],poplar:[],all:[],y:0};cells.set(k,c);}c.all.push(t);c.y+=t.y;
  (t.treeKind==='conifer'?c.conifer:t.treeKind==='poplar'?c.poplar:t.treeKind==='broad'?c.broad:(hash(t.x*.13,t.z*.17)>.38)?c.conifer:c.broad).push(t);});return cells;};
 const list=[];let sunNow=SUN0;
 const buildCell=c=>{
  const cg=new T.Group();cg.name='Orman hücresi';const cx=(c.ix+.5)*C,cz=(c.iz+.5)*C,cy=c.y/c.all.length;
  const trunks=new T.InstancedMesh(trunkGeo,trunkMat,c.all.length);
  c.all.forEach((t,i)=>{o.position.set(t.x,t.y,t.z);o.rotation.set(0,0,0);o.scale.set(1,t.height*.55,1);o.updateMatrix();trunks.setMatrixAt(i,o.matrix);});
  const BL=3,PL=3,nT=Math.max(1,c.conifer.length*tiersN),nB=Math.max(1,c.broad.length*BL+c.poplar.length*PL); /* v0.44 geniş yapraklı 3, kavak 3 yumru: düzensiz silüet */
  const tiers=new T.InstancedMesh(coneG[0],crownC,nT),balls=new T.InstancedMesh(ballG[0],crownB,nB);
  if(!c.conifer.length)tiers.count=0;if(!c.broad.length&&!c.poplar.length)balls.count=0;
  c.conifer.forEach((t,i)=>{const tint=hash(t.x,t.z);for(let k=0;k<tiersN;k++){const f=tiersN===2?[.2,.5][k]:.22+k*.22,base=t.y+t.height*f,hgt=t.height*(tiersN===2?[.62,.5][k]:.48-k*.08),rad=t.radius*(1-(tiersN===2?.35:.24)*k)*.95;o.position.set(t.x,base,t.z);o.rotation.set(0,tint*6+k,0);o.scale.set(rad,hgt,rad);o.updateMatrix();tiers.setMatrixAt(i*tiersN+k,o.matrix);
   col.setRGB((.06+tint*.04),(.15+tint*.06-k*.01),(.08+tint*.03));tiers.setColorAt(i*tiersN+k,col);}});
  c.poplar.forEach((t,i)=>{const tint=hash(t.z,t.x),u=hash(t.x*.7,t.z*1.3);for(let k=0;k<PL;k++){const f=[.42,.62,.8][k],rr=t.radius*[1,.86,.58][k]*(.9+.2*hash(t.x+k,t.z)),hh=t.height*[.3,.26,.2][k];o.position.set(t.x+(hash(t.x+k*3,t.z)-.5)*t.radius*.5,t.y+t.height*f,t.z+(hash(t.x,t.z+k*5)-.5)*t.radius*.5);o.rotation.set((u-.5)*.25,tint*4+k*1.7,(hash(t.z+k,t.x)-.5)*.2);o.scale.set(rr,hh,rr*(.85+.25*u));o.updateMatrix();const n=c.broad.length*BL+i*PL+k;balls.setMatrixAt(n,o.matrix);const pv=TREE_PAL[Math.floor(hash(t.x*3.1,t.z*1.7)*TREE_PAL.length)];col.setRGB((.10+tint*.05)*(1+.06*k)*pv[0],(.19+tint*.05)*(1+.05*k)*pv[1],(.06+tint*.03)*pv[2]);balls.setColorAt(n,col);}});
  c.broad.forEach((t,i)=>{const tint=hash(t.z,t.x),u=hash(t.x*1.9,t.z*.3);for(let k=0;k<BL;k++){const a=tint*6.28+k*2.1,sp=t.radius*(k?.55:.15),rr=t.radius*(k?.72+.18*hash(t.x+k,t.z):.95),hh=t.height*(k?.24:.3)*(.9+.2*u);o.position.set(t.x+Math.cos(a)*sp,t.y+t.height*(k?.6+.08*hash(t.z+k,t.x):.66),t.z+Math.sin(a)*sp);o.rotation.set(tint*3+k,tint*5+k*1.3,(u-.5)*.4);o.scale.set(rr,hh,rr*(.85+.3*hash(t.x,t.z+k)));o.updateMatrix();balls.setMatrixAt(i*BL+k,o.matrix);
   {const pv=TREE_PAL[Math.floor(hash(t.x*2.3,t.z*4.1)*TREE_PAL.length)];col.setRGB((.09+tint*.07)*(1+.05*k)*pv[0],(.16+tint*.07)*(1+.05*k)*pv[1],(.05+tint*.04)*pv[2]);}balls.setColorAt(i*BL+k,col);}});
  if(!c.conifer.length)tiers.setColorAt(0,col);if(!c.broad.length&&!c.poplar.length)balls.setColorAt(0,col);
  /* v0.44 ağaç gölgesi: güneşin tersine uzanan yumuşak elips (zemin eğimine yatık). Gölge haritası yalnız helikopterin
     çevresini kapsadığı için ağaçlar gölge haritasına girmez; bütün sahada aynı ve ucuz gölge. */
  let shade=null;if(shadeMat){shade=new T.InstancedMesh(shadeGeo,shadeMat,c.all.length);shade.userData.trees=c.all.map(t=>{const e=2.5;let nx=0,nz=0;if(area){nx=(terrainHeight(t.x-e,t.z,area)-terrainHeight(t.x+e,t.z,area))/(2*e);nz=(terrainHeight(t.x,t.z-e,area)-terrainHeight(t.x,t.z+e,area))/(2*e);}return {x:t.x,y:t.y,z:t.z,h:t.height,r:t.radius*(t.treeKind==='poplar'?1.15:1),nx,nz};});placeShade(shade,SUN0);shade.renderOrder=1;}
  trunks.computeBoundingSphere();tiers.computeBoundingSphere();balls.computeBoundingSphere();
  /* aynı örnek matrisleri ve renkleri paylaşan sade kopyalar (orta / uzak) */
  const lod=(src,geos)=>geos.map((g,i)=>{if(i===0)return src;const m=new T.InstancedMesh(g,src.material,src.count||1);m.instanceMatrix=src.instanceMatrix;m.instanceColor=src.instanceColor;m.count=src.count;m.boundingSphere=src.boundingSphere;m.visible=false;return m;});
  const T3=lod(tiers,coneG),B3=lod(balls,ballG);
  /* v0.47 uzak seviyede yuvarlak taçlı ağaç başına tek yumru (üç yumru yerine): uzakta fark görünmez, köşe sayısı üçte bir */
  {const nb=c.broad.length+c.poplar.length;if(nb){const far=new T.InstancedMesh(ballG[2],crownB,nb);let n=0;for(const t of c.broad){const tint=hash(t.z,t.x),pv=TREE_PAL[Math.floor(hash(t.x*2.3,t.z*4.1)*TREE_PAL.length)];o.position.set(t.x,t.y+t.height*.64,t.z);o.rotation.set(0,tint*5,0);o.scale.set(t.radius*1.12,t.height*.36,t.radius*1.12);o.updateMatrix();far.setMatrixAt(n,o.matrix);col.setRGB((.09+tint*.07)*pv[0],(.16+tint*.07)*pv[1],(.05+tint*.04)*pv[2]);far.setColorAt(n++,col);}
   for(const t of c.poplar){const tint=hash(t.z,t.x),pv=TREE_PAL[Math.floor(hash(t.x*3.1,t.z*1.7)*TREE_PAL.length)];o.position.set(t.x,t.y+t.height*.6,t.z);o.rotation.set(0,tint*4,0);o.scale.set(t.radius,t.height*.42,t.radius);o.updateMatrix();far.setMatrixAt(n,o.matrix);col.setRGB((.10+tint*.05)*pv[0],(.19+tint*.05)*pv[1],(.06+tint*.03)*pv[2]);far.setColorAt(n++,col);}
   far.computeBoundingSphere();far.visible=false;B3[2]=far;}}
  for(const m of [trunks,...T3,...B3]){m.receiveShadow=true;m.castShadow=false;if(m.instanceColor)m.instanceColor.needsUpdate=true;cg.add(m);}
  if(shade){shade.castShadow=shade.receiveShadow=false;cg.add(shade);if(sunNow!==SUN0)placeShade(shade,sunNow);}
  const rec={key:c.key,cx,cz,cy,cg,trunks,T3,B3,shade,level:-1};list.push(rec);group.add(cg);built.set(c.key,rec);return rec;};
 for(const c of bucket(objects).values())buildCell(c);
 /* v0.47 orman helikopterle birlikte: kameranın buildR çevresindeki eksik hücreler kare başına ≈5 ms'lik dilimlerle kurulur, uzaklaşan hücreler bırakılır */
 const dropCell=rec=>{rec.cg.removeFromParent();for(const m of rec.cg.children)if(m.isInstancedMesh)m.dispose();const i=list.indexOf(rec);if(i>=0)list.splice(i,1);built.delete(rec.key);};
 const stream=cam=>{if(!provider||!buildR)return false;const t0=performance.now(),i0=Math.floor((cam.x-buildR)/C),i1=Math.floor((cam.x+buildR)/C),j0=Math.floor((cam.z-buildR)/C),j1=Math.floor((cam.z+buildR)/C);let changed=false;
  const want=[];for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){const k=i+':'+j;if(built.has(k))continue;const dx=Math.max(0,Math.abs(cam.x-(i+.5)*C)-C/2),dz=Math.max(0,Math.abs(cam.z-(j+.5)*C)-C/2);if(Math.hypot(dx,dz)<buildR)want.push([Math.hypot(dx,dz),i,j,k]);}
  want.sort((a,b)=>a[0]-b[0]);for(const [,i,j,k] of want){if(performance.now()-t0>5)break;const trees=provider(i*C,(i+1)*C,j*C,(j+1)*C).filter(t=>Math.floor(t.x/C)===i&&Math.floor(t.z/C)===j);if(!trees.length){built.set(k,null);continue;}const c=bucket(trees).get(k);if(c){buildCell(c);changed=true;}}
  for(const [k,rec] of [...built]){if(!rec){const [i,j]=k.split(':').map(Number);if(Math.hypot((i+.5)*C-cam.x,(j+.5)*C-cam.z)>buildR+700)built.delete(k);continue;}if(Math.hypot(rec.cx-cam.x,rec.cz-cam.z)>buildR+700){dropCell(rec);changed=true;}}
  return changed;};
 /* kamera konumuna göre ayrıntı seviyesi (her karede çağrılır; 15 m altı hareketlerde atlanır) */
 const near=LITE?140:160,mid=LITE?480:560,last={x:1e9,y:0,z:1e9};
 group.userData.updateLOD=cam=>{const ch=stream(cam);if(!ch&&Math.abs(cam.x-last.x)+Math.abs(cam.z-last.z)+Math.abs(cam.y-last.y)<15)return;last.x=cam.x;last.y=cam.y;last.z=cam.z;
  for(const c of list){const dx=Math.max(0,Math.abs(cam.x-c.cx)-C/2),dz=Math.max(0,Math.abs(cam.z-c.cz)-C/2),d=Math.hypot(dx,dz,Math.max(0,cam.y-c.cy-30)*.5);const L=d<near?0:d<mid?1:2;if(L===c.level)continue;c.level=L;
   c.T3.forEach((m,i)=>m.visible=i===L);c.B3.forEach((m,i)=>m.visible=i===L);c.trunks.visible=L<2;if(c.shade)c.shade.visible=L<2;
   }};
 Object.defineProperty(group.userData,'lodCells',{get:()=>list.length,enumerable:true});
 group.userData.setSun=(sun,strength)=>{if(!shadeMat)return;shadeMat.opacity=strength;shadeMat.visible=strength>.02;const k=sun.x.toFixed(2)+sun.y.toFixed(2)+sun.z.toFixed(2);if(group.userData.sunKey===k)return;group.userData.sunKey=k;sunNow=sun.clone();for(const c of list)if(c.shade)placeShade(c.shade,sun);};
 return group;
}
// ---------- Draw-call reduction: merge static meshes sharing a material colour ----------
export function mergeStatic(group){
 const buckets=new Map(),drop=[];group.updateMatrixWorld(true);
 group.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||!o.material?.color||o.material.map)return;const key=o.material.color.getHexString()+(o.material.side===T.DoubleSide?'d':'f');(buckets.get(key)??buckets.set(key,{mat:o.material,list:[]}).get(key)).list.push(o);});
 for(const {mat,list} of buckets.values()){if(list.length<4)continue;const pos=[],nor=[];
  for(const m of list){const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();g.applyMatrix4(m.matrixWorld);if(!g.attributes.normal)g.computeVertexNormals();pos.push(g.attributes.position.array);nor.push(g.attributes.normal.array);drop.push(m);g.dispose();}
  const total=pos.reduce((a,b)=>a+b.length,0),P=new Float32Array(total),N=new Float32Array(total);let k=0;pos.forEach((a,i)=>{P.set(a,k);N.set(nor[i],k);k+=a.length;});
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(P,3));geo.setAttribute('normal',new T.BufferAttribute(N,3));geo.computeBoundingSphere();
  const merged=new T.Mesh(geo,mat);merged.castShadow=merged.receiveShadow=true;merged.name='birleşik-'+mat.color.getHexString();group.add(merged);}
 for(const m of drop){m.removeFromParent();m.geometry.dispose();}
 return group;
}

// ---------- Power lines: lattice-style towers, three sagging conductors, orange aviation marker balls ----------
import {powerLineGeometry,POWER_LINE_SPEC} from './terrain-data.js';
/* v0.35 village distribution line: wooden poles every ~65 m, a cross-arm, two sagging conductors */
const WOOD=new T.MeshStandardMaterial({color:'#6b5338',roughness:.95});
function distLine(g,line){const H=line.h??9,poles=[];for(let i=1;i<line.length;i++){const A=line[i-1],B=line[i],L=Math.hypot(B.x-A.x,B.z-A.z),n=Math.max(1,Math.round(L/65));for(let k=i===1?0:1;k<=n;k++){const f=k/n,x=A.x+(B.x-A.x)*f,z=A.z+(B.z-A.z)*f;poles.push({x,z,y:terrainHeight(x,z,'terrain'),dir:Math.atan2(B.x-A.x,B.z-A.z)});}}
 const wire=new T.LineBasicMaterial({color:'#262624'});
 for(const p of poles){const pole=new T.Mesh(new T.CylinderGeometry(.11,.15,H,6),WOOD);pole.position.set(p.x,p.y+H/2,p.z);pole.castShadow=true;g.add(pole);const arm=new T.Mesh(new T.BoxGeometry(.12,.12,2),WOOD);arm.position.set(p.x,p.y+H-.25,p.z);arm.rotation.y=p.dir+Math.PI/2;g.add(arm);}
 for(let i=1;i<poles.length;i++){const A=poles[i-1],B=poles[i],L=Math.hypot(B.x-A.x,B.z-A.z)||1,ux=(B.x-A.x)/L,uz=(B.z-A.z)/L;for(const o of [-.7,.7]){const pts=[];for(let k=0;k<=12;k++){const f=k/12;pts.push(new T.Vector3(A.x+(B.x-A.x)*f+o*uz,A.y+(B.y-A.y)*f+H-.2-1.1*4*f*(1-f),A.z+(B.z-A.z)*f-o*ux));}g.add(new T.Line(new T.BufferGeometry().setFromPoints(pts),wire));}}}
export function createPowerLines(area){
 const g=new T.Group();g.name='Enerji hatları';const lines=powerLineGeometry(area);if(!lines.length)return g;
 const steel=new T.MeshStandardMaterial({color:'#8d918c',roughness:.6,metalness:.5}),wireMat=new T.LineBasicMaterial({color:'#1d1f1e'}),marker=new T.MeshStandardMaterial({color:'#ff6a1a',roughness:.6});
 const H=POWER_LINE_SPEC.towerHeightM;
 for(const line of lines){
  if(line.dist){distLine(g,line);continue;}
  for(let i=0;i<line.length;i++){const t=line[i],a=line[Math.max(0,i-1)],b=line[Math.min(line.length-1,i+1)],dir=Math.atan2(b.x-a.x,b.z-a.z);
   const tower=new T.Group();tower.position.set(t.x,t.y,t.z);tower.rotation.y=dir+Math.PI/2;
   const mast=new T.Mesh(new T.CylinderGeometry(.35,1.6,H,4,1,true),steel);mast.position.y=H/2;mast.rotation.y=Math.PI/4;tower.add(mast);
   const arm=new T.Mesh(new T.BoxGeometry(.35,.35,7.8),steel);arm.position.y=H;tower.add(arm);
   for(const o of POWER_LINE_SPEC.offsetsM){const ins=new T.Mesh(new T.CylinderGeometry(.12,.12,.9,6),new T.MeshStandardMaterial({color:'#cfd8d0'}));ins.position.set(0,H-.45,o);tower.add(ins);}
   tower.traverse(o=>{if(o.isMesh)o.castShadow=true;});g.add(tower);}
  for(let i=1;i<line.length;i++){const A=line[i-1],B=line[i],L=Math.hypot(B.x-A.x,B.z-A.z),ux=(B.x-A.x)/L,uz=(B.z-A.z)/L;
   for(const o of POWER_LINE_SPEC.offsetsM){const pts=[];for(let k=0;k<=24;k++){const f=k/24,x=A.x+(B.x-A.x)*f+o*-uz,z=A.z+(B.z-A.z)*f+o*ux,y=A.y+(B.y-A.y)*f+H-POWER_LINE_SPEC.sagM*4*f*(1-f);pts.push(new T.Vector3(x,y,z));}
    g.add(new T.Line(new T.BufferGeometry().setFromPoints(pts),wireMat));}
   for(const f of [.33,.66]){const x=A.x+(B.x-A.x)*f,z=A.z+(B.z-A.z)*f,y=A.y+(B.y-A.y)*f+H-POWER_LINE_SPEC.sagM*4*f*(1-f);const ball=new T.Mesh(new T.SphereGeometry(.45,12,8),marker);ball.position.set(x,y,z);g.add(ball);}}
 }
 return g;
}

// ---------- Rain streaks around the camera ----------
export function createRain(){
 const N=2400,pos=new Float32Array(N*6),geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));
 const seeds=Array.from({length:N},(_,i)=>[hash(i,7)*80-40,hash(i,8)*60,hash(i,9)*80-40,8+hash(i,10)*4]);
 const lines=new T.LineSegments(geo,new T.LineBasicMaterial({color:'#b9c6cc',transparent:true,opacity:.45,depthWrite:false}));lines.frustumCulled=false;lines.name='Yağmur';lines.userData={N,seeds};lines.visible=false;return lines;
}
export function updateRain(rain,{time,camera,on,windX=0,windZ=0}){rain.visible=on;if(!on)return;const {N,seeds}=rain.userData,p=rain.geometry.attributes.position.array,c=camera.position;
 for(let i=0;i<N;i++){const [x,y0,z,v]=seeds[i],y=((y0-time*v)%60+60)%60-20,dx=windX*.05,dz=windZ*.05;const X=c.x+x,Y=c.y+y,Z=c.z+z;p[i*6]=X;p[i*6+1]=Y;p[i*6+2]=Z;p[i*6+3]=X+dx;p[i*6+4]=Y+1.1;p[i*6+5]=Z+dz;}
 rain.geometry.attributes.position.needsUpdate=true;}

// ---------- v0.34.1 emergency smoke (engine fire: dark trail from the exhaust; cabin smoke: light wisps) ----------
export function createSmoke(){
 const N=220,geo=new T.BufferGeometry(),pos=new Float32Array(N*3),alpha=new Float32Array(N),size=new Float32Array(N);
 geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setAttribute('alpha',new T.BufferAttribute(alpha,1));geo.setAttribute('size',new T.BufferAttribute(size,1));
 const mat=new T.ShaderMaterial({transparent:true,depthWrite:false,fog:true,uniforms:T.UniformsUtils.merge([T.UniformsLib.fog,{map:{value:typeof document==='undefined'?null:softDot()},color:{value:new T.Color('#3a3836')},scale:{value:300}}]),
  vertexShader:`#include <common>
  #include <fog_pars_vertex>
  attribute float alpha;attribute float size;varying float vA;uniform float scale;void main(){vec4 mvPosition=modelViewMatrix*vec4(position,1.);vA=alpha*smoothstep(3.,16.,-mvPosition.z);gl_PointSize=min(140.,size*scale/max(1.,-mvPosition.z));gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
  }`,
  fragmentShader:`#include <common>
  #include <fog_pars_fragment>
  uniform sampler2D map;uniform vec3 color;varying float vA;void main(){vec4 t=texture2D(map,gl_PointCoord);gl_FragColor=vec4(color,t.a*vA);if(gl_FragColor.a<.01)discard;
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
  }`});
 const points=new T.Points(geo,mat);points.frustumCulled=false;points.name='Duman';points.visible=false;points.userData={N};return points;
}
/* trail: [{t,p:[x,y,z],s}] emitted along the flight path; each puff drifts downwind, rises and spreads with its age */
export function updateSmoke(points,{trail,time,windX=0,windZ=0,kind='engine'}){
 const {N}=points.userData,pos=points.geometry.attributes.position.array,alpha=points.geometry.attributes.alpha.array,size=points.geometry.attributes.size.array,cabin=kind==='cabin';
 points.material.uniforms.color.value.set(cabin?'#c9c6c0':'#34322f');let n=0;
 for(let i=trail.length-1;i>=0&&n<N;i--){const q=trail[i],age=time-q.t;if(age<0||age>(cabin?4:9))continue;const h=Math.sin(i*12.9898)*43758.5453,j=h-Math.floor(h);
  pos[n*3]=q.p[0]+windX*age*.5+(j-.5)*age*1.2;pos[n*3+1]=q.p[1]+age*(cabin?.6:1.1);pos[n*3+2]=q.p[2]+windZ*age*.5+(j*7%1-.5)*age*1.2;
  alpha[n]=q.s*Math.min(1,.25+age*4)*(1-age/(cabin?4:9))*(cabin?.4:.8);size[n]=(cabin?1.6:3)+age*(cabin?1.8:3.4);n++;}
 for(let k=n;k<N;k++){alpha[k]=0;size[k]=0;}
 points.visible=n>0;points.geometry.setDrawRange(0,n);points.geometry.attributes.position.needsUpdate=points.geometry.attributes.alpha.needsUpdate=points.geometry.attributes.size.needsUpdate=true;
}

// ---------- v0.43 yakın çevrede ot ve çalı kümeleri (kamera alçakken): zemin dokusunun bulanıklığını yakında gizler ----------
function grassTexture(){const c=document.createElement('canvas');c.width=128;c.height=128;const x=c.getContext('2d');let seed=5;const r=()=>(seed=(seed*16807)%2147483647)/2147483647;
 for(let i=0;i<120;i++){const bx=14+r()*100,h=40+r()*84,lean=(r()-.5)*34,w=.9+r()*1.6,sh=.5+r()*.5,gr=r()<.3;const g=x.createLinearGradient(0,128,0,128-h);const c1=gr?[150,160,112]:[208,196,146];g.addColorStop(0,`rgba(${Math.round(c1[0]*sh*.45)},${Math.round(c1[1]*sh*.45)},${Math.round(c1[2]*sh*.4)},1)`);g.addColorStop(.5,`rgba(${Math.round(c1[0]*sh)},${Math.round(c1[1]*sh)},${Math.round(c1[2]*sh)},1)`);g.addColorStop(1,`rgba(${Math.round(c1[0]*sh*1.08)},${Math.round(c1[1]*sh*1.05)},${Math.round(c1[2]*sh)},1)`);x.strokeStyle=g;x.lineWidth=w;x.beginPath();x.moveTo(bx,128);x.quadraticCurveTo(bx+lean*.3,128-h*.6,bx+lean,128-h);x.stroke();} /* v0.44 dipte koyu, uçta açık; saman ve gri-yeşil yapraklar */
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;}
export function createGrass(){if(typeof document==='undefined')return null;const N=LITE?2200:6500;
 /* v0.45 üç kart, dışa doğru yatık: yukarıdan bakınca X çizgisi değil yuvarlak ot öbeği görünür */
 const merge=[0,1,2].map(k=>{const q=new T.PlaneGeometry(1,1);q.translate(0,.5,0);q.rotateX(k%2?.38:-.38);q.rotateY(k*Math.PI/3);return q;});const g=new T.BufferGeometry();const pos=[],uv=[],nor=[],idx=[];let o=0;for(const q of merge){pos.push(...q.attributes.position.array);uv.push(...q.attributes.uv.array);for(let i=0;i<q.attributes.position.count;i++)nor.push(0,1,0);idx.push(...Array.from(q.index.array,v=>v+o));o+=q.attributes.position.count;}
 g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('normal',new T.Float32BufferAttribute(nor,3));g.setIndex(idx);
 const m=new T.MeshLambertMaterial({map:grassTexture(),alphaTest:.45,side:T.DoubleSide,color:'#ffffff'});m.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <normal_fragment_begin>','#include <normal_fragment_begin>\n normal=normalize((viewMatrix*vec4(0.,1.,0.,0.)).xyz);').replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n totalEmissiveRadiance+=diffuseColor.rgb*.16;');}; /* v0.45 ince ot yaprağı ışığı geçirir: alçak güneşte kara leke olmaz */ /* ot yaprakları yukarı bakan normalle aydınlanır: arka yüz kararmaz */
 const mesh=new T.InstancedMesh(g,m,N);mesh.name='Ot kümeleri';mesh.count=0;mesh.frustumCulled=false;mesh.receiveShadow=true;mesh.userData={at:null,area:null,N};return mesh;}
const GRASS_TINT={grass:[.8,.76,.55],stubble:[.92,.82,.58],field:[.84,.78,.55],rough:[.82,.74,.54],wetland:[.6,.7,.44],forest:[.6,.66,.42]}; /* v0.44 kasım bozkırı: kuru saman ve gri-yeşil */
const _vn2=(x,z)=>{const xi=Math.floor(x),zi=Math.floor(z),u=x-xi,v=z-zi,su=u*u*(3-2*u),sv=v*v*(3-2*v),h=(a,b)=>{const q=Math.sin(a*127.1+b*311.7)*43758.5453;return q-Math.floor(q);};return (h(xi,zi)*(1-su)+h(xi+1,zi)*su)*(1-sv)+(h(xi,zi+1)*(1-su)+h(xi+1,zi+1)*su)*sv;};
/* v0.43 kare hızı: yerleşim kare başına ≈3 ms’lik dilimlerle hesaplanır, hücre türü önbellekte tutulur (takılma olmaz) */
const _hh=(a,b)=>{const q=Math.sin(a*127.1+b*311.7)*43758.5453;return q-Math.floor(q);};
export function updateGrass(mesh,cam,area,agl){if(!mesh)return;const U=mesh.userData;if(agl>45||area==='water'){mesh.visible=false;U.job=null;return;}
 if(U.area!==area){U.cache=new Map();U.area=area;U.at=null;mesh.count=0;}
 if(!U.job&&(!U.at||Math.hypot(cam.x-U.at[0],cam.z-U.at[1])>=28)){U.job={gx:cam.x,gz:cam.z,ci0:Math.round((cam.x-75)/1.8),ci1:Math.round((cam.x+75)/1.8),cj0:Math.round((cam.z-75)/1.8),cj1:Math.round((cam.z+75)/1.8),ci:null,cj:null,list:[]};U.job.ci=U.job.ci0;U.job.cj=U.job.cj0;}
 const J=U.job;if(J){const t0=performance.now(),R=75;
  while(J.ci<=J.ci1&&performance.now()-t0<3){const ci=J.ci,cj=J.cj;J.cj++;if(J.cj>J.cj1){J.cj=J.cj0;J.ci++;}
   const cx=ci*1.8+(_hh(ci,cj)-.5)*1.8,cz=cj*1.8+(_hh(cj+17,ci-5)-.5)*1.8,pn=_vn2(cx*.05,cz*.05)*.7+_vn2(cx*.17+9,cz*.17)*.3;if(_hh(ci+3,cj+9)>.08+.85*Math.min(1,Math.max(0,(pn-.3)/.4)))continue; /* v0.44 otlar öbek öbek: çıplak lekeler ve sık tutamlar */const fr=Math.hypot(cx-J.gx,cz-J.gz)/R;if(fr>1||_hh(ci-11,cj+23)<fr*fr)continue;
   const key=ci*100003+cj;let c=U.cache.get(key);if(!c){const k=surfaceProfile(cx,cz,area).kind;c={k,h:GRASS_TINT[k]?(U.hFn?U.hFn(cx,cz):terrainHeight(cx,cz,area)):0}; /* v0.52 ot çizilen zemin ağının üstünde (havada/gömülü durmaz) */U.cache.set(key,c);if(U.cache.size>60000)U.cache.clear();}
   if(GRASS_TINT[c.k])J.list.push([cx,cz,c.k,c.h,fr]);}
  if(J.ci>J.ci1){const o=new T.Object3D(),col=new T.Color();let n=0;for(const [cx,cz,k,h,fr] of J.list){if(n>=U.N)break;const t=GRASS_TINT[k],s=(.5+((Math.abs(cx*31+cz*17)%10)/10)*.7)*(1-.45*fr);
    const gq=_vn2(cx*.11+4,cz*.11-2);o.position.set(cx,h-.02,cz);o.rotation.set(0,(cx*.37+cz*.71)%6.28,0);o.scale.set(s*1.3,s*(k==='stubble'?.45:k==='rough'?.8:.65)*(.8+.5*gq),s*1.3);o.updateMatrix();mesh.setMatrixAt(n,o.matrix);const v=.72+((Math.abs(cx*13+cz*7)%10)/10)*.3;col.setRGB(t[0]*v*(1-.12*gq),t[1]*v,t[2]*v*(1-.05*gq));mesh.setColorAt(n,col);n++;}
   mesh.count=n;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;U.at=[J.gx,J.gz];U.job=null;}}
 mesh.visible=mesh.count>0;}
