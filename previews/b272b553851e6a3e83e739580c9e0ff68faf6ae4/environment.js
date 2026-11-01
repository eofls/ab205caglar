// Visual environment layer (v0.30): sky, clouds, surface shading, water, downwash, windsock, distant terrain.
// Rendering only. Physics, collision and AGL keep using terrain-data.js; nothing here changes the flight result.
import * as T from './vendor/three.module.js';
import {LITE} from './device-profile.js';
import {terrainHeight,islandHeight,RUNWAY,runwayCoordinates,surfaceProfile} from './terrain-data.js';

const NOISE=`
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
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
  void main(){vec3 d=normalize(vDir);float h=d.y;vec3 c=mix(horizon,top,pow(clamp(h,0.,1.),.42));
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
 u.top.value.set(dusk?'#5d6f9a':over?'#8e9aa3':'#3f7cc4');
 u.below.value.set(dusk?'#6f5f58':'#7f8c84');
 u.sunColor.value.set(dusk?'#ffb47a':'#fff3da');
 u.haze.value=dusk?1.6:over?.2:.6;u.cloud.value=over?1:cover==='scattered'?.35:0;
 u.sunDir.value.set(dusk?.85:.42,dusk?.12:.72,dusk?.5:.38).normalize();
 return u.sunDir.value;
}

// ---------- Soft billboard clouds ----------
function cloudTexture(){
 const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');let seed=7;const r=()=>(seed=(seed*16807)%2147483647)/2147483647;
 for(let i=0;i<34;i++){const px=60+r()*136,py=96+r()*70-(i<8?30:0),rad=26+r()*46,g=x.createRadialGradient(px,py,0,px,py,rad);g.addColorStop(0,'rgba(255,255,255,.55)');g.addColorStop(.6,'rgba(255,255,255,.22)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,256,256);}
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;
}
export function createClouds(){
 const group=new T.Group();group.name='Bulutlar';if(typeof document==='undefined')return group;
 const tex=cloudTexture();let seed=11;const r=()=>(seed=(seed*16807)%2147483647)/2147483647;
 for(let i=0;i<46;i++){const m=new T.SpriteMaterial({map:tex,color:'#ffffff',transparent:true,depthWrite:false,fog:true,opacity:.9});const s=new T.Sprite(m);
  const a=r()*Math.PI*2,d=500+r()*3800;s.position.set(Math.cos(a)*d,430+r()*260,Math.sin(a)*d);const k=260+r()*420;s.scale.set(k,k*.42,1);group.add(s);}
 return group;
}
export function updateClouds(group,weather,cover){
 const n=cover==='clear'?0:cover==='scattered'?16:46;
 group.children.forEach((s,i)=>{s.visible=i<n;s.material.color.set(weather.cloudColor);s.material.opacity=cover==='overcast'?.95:.8;});
}

// ---------- Surface detail for terrain/runway materials (world-space noise, slope rock, snow line) ----------
export function enhanceSurface(material,{rock=.0,snowLine=1e9,detail=1,asphalt=false}={}){
 material.userData.surface={rock,snowLine,detail,asphalt};
 material.onBeforeCompile=sh=>{
  sh.uniforms.uRock={value:rock};sh.uniforms.uSnow={value:snowLine};sh.uniforms.uDetail={value:detail};
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWorldPos;varying vec3 vWorldN;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvWorldPos=(modelMatrix*vec4(transformed,1.)).xyz;vWorldN=normalize(mat3(modelMatrix)*objectNormal);');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uRock,uSnow,uDetail;varying vec3 vWorldPos;varying vec3 vWorldN;'+NOISE)
   .replace('#include <color_fragment>',`#include <color_fragment>
   {vec2 w=vWorldPos.xz;float n1=fbm(w*.012),n2=vnoise(w*.19),n3=vnoise(w*1.7),n4=vnoise(w*7.3);
    float det=${asphalt?'(n2-.5)*.10+(n3-.5)*.10+(n4-.5)*.08':'(n1-.5)*.34+(n2-.5)*.16+(n3-.5)*.10+(n4-.5)*.05'};
    diffuseColor.rgb*=1.+det*uDetail;
    ${asphalt?'diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*.82,smoothstep(.55,.8,vnoise(w*vec2(.05,.9))));':''}
    float slope=1.-clamp(normalize(vWorldN).y,0.,1.);
    float rk=smoothstep(.24,.5,slope+(n2-.5)*.12)*uRock;
    vec3 rockC=mix(vec3(.35,.33,.29),vec3(.47,.44,.38),n3)*(0.8+n1*.4);diffuseColor.rgb=mix(diffuseColor.rgb,rockC,rk);
    float sn=smoothstep(uSnow-18.,uSnow+12.,vWorldPos.y+(n1-.5)*60.)*(1.-smoothstep(.45,.7,slope));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.93,.95,.97),sn);}`);
 };
 material.customProgramCacheKey=()=>'surface-'+[rock,snowLine,detail,asphalt].join('-');
 material.needsUpdate=true;return material;
}

// ---------- Water: analytic wave normals, sky-reflection fresnel, sun glint, shore foam, rotor downwash ripples ----------
export function createWater(){
 const geo=new T.PlaneGeometry(60000,60000,1,1);geo.rotateX(-Math.PI/2);
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
   float isl=island(p);vec3 body=mix(deep,shallow,clamp(1.+isl/30.,0.,1.)*.85);
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
 const m=new T.Mesh(geo,mat);m.name='Su yüzeyi';m.position.y=.06;m.receiveShadow=false;return m;
}

// ---------- Distant terrain ring (beyond the 6 km physics tile, visual horizon only) ----------
/* v0.39 gerçek sahalar: zemin düzlemi yarıçapı, geniş uydu görüntüsü ve kapsadığı yarıçap */
function filteredTexture(url,filter,N){const c=document.createElement('canvas');c.width=c.height=N;const x=c.getContext('2d');x.fillStyle='#9a8a6c';x.fillRect(0,0,N,N);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;const im=new Image();im.onload=()=>{x.filter=filter;x.drawImage(im,0,0,N,N);x.filter='none';t.needsUpdate=true;};im.src=url;return t;}
export const REAL_GROUND={forest:{half:4000,outer:9400},water:{half:4000,outer:9400},airfield:{half:3000,wide:'guvercinlik-s2-genis.jpg',wideR:7000,outer:9000},terrain:{half:4500,wide:'golbasi-s2-genis.jpg',wideR:9500,outer:9400},mountain:{half:4500,wide:'tepeler-s2-genis.jpg',wideR:9500,outer:9400}};
export function createHorizon(area){
 const RG=REAL_GROUND[area],half=RG?.half??3000,edge=half-10,inner=half-50,outer=RG?.outer??9000,seg=200,rings=30,pos=[],col=[],idx=[],uv=[],real=!!RG?.wide,wr=RG?.wideR??7000; /* v0.37 meydan, v0.39 arazi ve tepeler: gerçek arazi + geniş uydu görüntüsü */
 const base={terrain:[.55,.52,.40],airfield:[.50,.50,.38],forest:[.20,.30,.18],mountain:[.42,.42,.40],water:[.12,.30,.38]}[area]??[.5,.5,.4];
 const hfun=(x,z)=>{const d=Math.hypot(x,z),k=Math.min(1,(d-inner)/1500);if(area==='water'){const a=Math.atan2(z,x);return d>6200&&(Math.sin(a*3+1)>.2)?Math.max(0,(d-6200)*.06*(.6+.4*Math.sin(a*7)))*k:-.5;}
  const ridge=n2(x*.0007,z*.0007)*(area==='mountain'?900:area==='forest'?240:area==='airfield'?160:220)+n2(x*.0021+3,z*.0021)*(area==='mountain'?260:70);return ridge*k;};
 for(let r=0;r<=rings;r++){const d=inner+(outer-inner)*Math.pow(r/rings,1.6);for(let i=0;i<=seg;i++){const a=i/seg*Math.PI*2,x=Math.cos(a)*d,z=Math.sin(a)*d,sq=Math.min(1,edge/Math.max(Math.abs(Math.cos(a)),Math.abs(Math.sin(a)))/d),ex=x*sq,ez=z*sq,y=real?terrainHeight(r===0?ex:x,r===0?ez:z,area)-(r===0?1.5:.3*Math.min(1,r/3)):hfun(x,z)+(r===0?terrainHeight(ex,ez,area)-2:0);pos.push(r===0?ex:x,y-(r>0&&Math.max(Math.abs(x),Math.abs(z))<half-5?18:0),r===0?ez:z); /* v0.39 ufuk halkası zemin düzleminin köşeleri altında kalır (z-fighting titremesi yok) */uv.push(((r===0?ex:x)+wr)/(2*wr),1-((r===0?ez:z)+wr)/(2*wr));
  const snow=area==='mountain'&&y>620?Math.min(1,(y-620)/140):0;const c=area==='water'&&y<=0?base:[base[0]*(.85+.2*Math.sin(i)),base[1],base[2]];col.push(...c.map((v,j)=>v*(1-snow)+[.92,.94,.96][j]*snow));}}
 for(let r=0;r<rings;r++)for(let i=0;i<seg;i++){const a=r*(seg+1)+i,b=a+seg+1;idx.push(a,b,a+1,a+1,b,b+1);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();if(real){g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));const tex=area==='airfield'?new T.TextureLoader().load('assets/terrain/'+RG.wide):filteredTexture('assets/terrain/'+RG.wide,'saturate(0.72) hue-rotate(7deg) contrast(1.08) brightness(0.93)',LITE?1024:2048);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;const m=new T.Mesh(g,enhanceSurface(new T.MeshStandardMaterial({map:tex,roughness:1}),{detail:.4}));m.name='Ufuk arazisi (gerçek)';return m;}
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
 const strength=Math.max(0,Math.min(1,(1-agl/16)))*Math.min(1,Math.max(0,rpmRatio-.25)/.55)*(paved?.35:1)+(impact>0?impact:0);
 const gy=terrainHeight(position[0],position[2],area)+(water?.1:.05);
 for(let i=0;i<N;i++){const s=seeds[i],age=((time+s.off)%s.life)/s.life,r=3+age*(water?16:20)*s.sp*(1+impact*.8),a=s.a+age*.4;
  pos[i*3]=position[0]+Math.cos(a)*r;pos[i*3+2]=position[2]+Math.sin(a)*r;pos[i*3+1]=gy+.3+age*(water?2.5:3.5)*(.4+s.up)+(forest?age*2:0);
  const vis=strength*(1-age)*Math.min(1,age*6)*(i<N*Math.min(1,strength*1.3)?1:0);alpha[i]=Math.min(.75,vis*(water?.75:.55));size[i]=(water?1.6:2.6)+age*(water?3:6);}
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
export function createForest(objects,{time}={time:{value:0}}){
 const group=new T.Group();group.name='Orman';const conifer=[],broad=[];
 const poplar=[];objects.forEach((t,i)=>(t.treeKind==='conifer'?conifer:t.treeKind==='poplar'?poplar:t.treeKind==='broad'?broad:(hash(t.x*.13,t.z*.17)>.38)?conifer:broad).push(t));
 const many=objects.length>(LITE?3000:9000),tiersN=many?2:3; // v0.33: large forests use two crown tiers and no shadow casting (tablet frame rate)
 const sway=(mat,amp)=>{mat.onBeforeCompile=sh=>{sh.uniforms.uTime=time;sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uTime;').replace('#include <begin_vertex>',`#include <begin_vertex>
  #ifdef USE_INSTANCING
  float ph=instanceMatrix[3].x*.031+instanceMatrix[3].z*.027;float k=max(0.,position.y+.5)*${amp.toFixed(3)};transformed.x+=sin(uTime*1.3+ph)*k;transformed.z+=cos(uTime*1.1+ph*1.7)*k*.7;
  #endif`);};mat.customProgramCacheKey=()=>'sway'+amp;return mat;};
 const trunkMat=new T.MeshStandardMaterial({color:'#4e3f2f',roughness:1});
 const coneGeo=new T.ConeGeometry(1,1,8,1);coneGeo.translate(0,.5,0);
 const crownC=sway(new T.MeshStandardMaterial({color:'#ffffff',roughness:.95,flatShading:true}),.05);
 const crownB=sway(new T.MeshStandardMaterial({color:'#ffffff',roughness:.95,flatShading:true}),.06);
 const o=new T.Object3D(),col=new T.Color();
 const trunks=new T.InstancedMesh(new T.CylinderGeometry(.22,.38,1,6).translate(0,.5,0),trunkMat,objects.length);
 const tiers=new T.InstancedMesh(coneGeo,crownC,Math.max(1,conifer.length*tiersN)),balls=new T.InstancedMesh(many?new T.DodecahedronGeometry(1,0):new T.IcosahedronGeometry(1,1),crownB,Math.max(1,broad.length*2+poplar.length));
 objects.forEach((t,i)=>{o.position.set(t.x,t.y,t.z);o.rotation.set(0,0,0);o.scale.set(1,t.height*.55,1);o.updateMatrix();trunks.setMatrixAt(i,o.matrix);});
 conifer.forEach((t,i)=>{const tint=hash(t.x,t.z);for(let k=0;k<tiersN;k++){const f=tiersN===2?[.2,.5][k]:.22+k*.22,base=t.y+t.height*f,hgt=t.height*(tiersN===2?[.62,.5][k]:.48-k*.08),rad=t.radius*(1-(tiersN===2?.35:.24)*k)*.95;o.position.set(t.x,base,t.z);o.rotation.set(0,tint*6+k,0);o.scale.set(rad,hgt,rad);o.updateMatrix();tiers.setMatrixAt(i*tiersN+k,o.matrix);
  col.setRGB(.13+tint*.06,.26+tint*.08-k*.01,.13+tint*.04);tiers.setColorAt(i*tiersN+k,col);}});
 poplar.forEach((t,i)=>{const tint=hash(t.z,t.x);o.position.set(t.x,t.y+t.height*.55,t.z);o.rotation.set(0,tint*4,0);o.scale.set(t.radius,t.height*.46,t.radius);o.updateMatrix();balls.setMatrixAt(broad.length*2+i,o.matrix);col.setRGB(.15+tint*.06,.27+tint*.06,.11+tint*.03);balls.setColorAt(broad.length*2+i,col);});
 broad.forEach((t,i)=>{const tint=hash(t.z,t.x);for(let k=0;k<2;k++){o.position.set(t.x+(k?1.4:-.8)*(tint-.5)*2,t.y+t.height*(.62+k*.12),t.z+(k?-.9:1.1)*(tint-.5)*2);o.rotation.set(tint*3,tint*5+k,0);o.scale.set(t.radius*(.95-.2*k),t.height*(.30-.05*k),t.radius*(.95-.2*k));o.updateMatrix();balls.setMatrixAt(i*2+k,o.matrix);
  col.setRGB(.16+tint*.08,.24+tint*.07,.10+tint*.04);balls.setColorAt(i*2+k,col);}});
 for(const m of [trunks,tiers,balls]){m.castShadow=!many;m.receiveShadow=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;group.add(m);}
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
