import * as T from './vendor/three.module.js';
export const DIMENSIONS={rotorDiameterM:14.71168,bodyLengthM:12.6238};
// Local axes: nose +X, up +Y. Skid contact is y=0. Geometry is a visual approximation.
export function createHelicopter(){
 const root=new T.Group();root.name='AB-205 reference-based visual model';const parts={};let active=root;const part=(name)=>{const g=new T.Group();g.name=name;root.add(g);parts[name]=g;active=g;return g;};part('cabin');
 const mat=(color,metalness=0)=>new T.MeshStandardMaterial({color,roughness:.38,metalness});
 const roofGlass=mat('#506851',.25);
 const white=mat('#ecece3'),red=mat('#b92b32'),blue=mat('#183f70'),glass=mat('#18343c',.45),metal=mat('#8a9697',.65),black=mat('#242b2a');
 function mesh(g,m,x,y,z,parent=active){const a=new T.Mesh(g,m);a.position.set(x,y,z);a.castShadow=true;a.receiveShadow=true;parent.add(a);return a;}
 function box(w,h,d,m,x,y,z,parent=active){return mesh(new T.BoxGeometry(w,h,d),m,x,y,z,parent);}
 function ell(w,h,d,m,x,y,z){const a=mesh(new T.SphereGeometry(1,24,16),m,x,y,z);a.scale.set(w,h,d);return a;}
 function tube(a,b,r,m,parent=active){const av=new T.Vector3(...a),bv=new T.Vector3(...b),d=bv.clone().sub(av);const o=mesh(new T.CylinderGeometry(r,r,d.length(),10),m,...av.clone().add(bv).multiplyScalar(.5).toArray(),parent);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o;}
 // Broad cabin, rounded cockpit and narrower roof/engine housing.
 // Section-built cabin avoids intersecting ellipsoids hiding the window surfaces.
 const sections=[[-2.6,1.25,2.55,.42],[-2.2,.9,2.78,.82],[-1.55,.72,2.88,1.02],[.3,.72,2.88,1.04],[1.45,.78,2.85,1.0],[2.05,.82,2.65,.94],[2.65,.9,2.15,.8],[3.1,1.05,1.78,.56],[3.32,1.2,1.62,.13],[3.34,1.31,1.5,.025]];
 const rings=[];for(let i=0;i<sections.length-1;i++)for(let k=0;k<4;k++){const f=k/4;rings.push(sections[i].map((v,j)=>v+(sections[i+1][j]-v)*f));}rings.push(sections.at(-1));
 const vertices=[],indices=[],N=32;
 for(const [x,lo,hi,w] of rings)for(let j=0;j<N;j++){const a=j/N*Math.PI*2,c=Math.cos(a),sn=Math.sin(a);vertices.push(x,(lo+hi)/2+(hi-lo)/2*Math.sign(c)*Math.abs(c)**.65,w*Math.sign(sn)*Math.abs(sn)**.65);}
 for(let i=0;i<rings.length-1;i++)for(let j=0;j<N;j++){const a=i*N+j,b=i*N+(j+1)%N;indices.push(a,b,a+N,b,b+N,a+N);}
 const hull=new T.BufferGeometry();hull.setAttribute('position',new T.Float32BufferAttribute(vertices,3));hull.setIndex(indices);hull.computeVertexNormals();const cabin=mesh(hull,white,0,0,0);cabin.name='section-built-cabin';
 function sideWidth(x,y){let i=sections.findIndex((v,j)=>j<sections.length-1&&x>=v[0]&&x<=sections[j+1][0]);if(i<0)i=x<sections[0][0]?0:sections.length-2;const a=sections[i],b=sections[i+1],f=Math.max(0,Math.min(1,(x-a[0])/(b[0]-a[0]))),lo=a[1]+(b[1]-a[1])*f,hi=a[2]+(b[2]-a[2])*f,w=a[3]+(b[3]-a[3])*f;const yy=Math.max(-.999,Math.min(.999,(y-(lo+hi)/2)/((hi-lo)/2)));return w*Math.max(0,1-Math.abs(yy)**(2/.65))**(.65/2);}
 function stripe(points,material){for(const side of [-1,1]){const v=[],idx=[],rows=[];for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1],steps=Math.ceil((b[0]-a[0])/.09);for(let j=0;j<steps;j++){const f=j/steps;rows.push(a.map((n,k)=>n+(b[k]-n)*f));}}rows.push(points.at(-1));for(let i=0;i<rows.length;i++){const [x,lo,hi]=rows[i];for(let k=0;k<=4;k++){const y=lo+(hi-lo)*k/4;v.push(x,y,side*(sideWidth(x,y)+.025));if(i&&k){const a=(i-1)*5+k-1,b=a+1;idx.push(a,b,a+5,b,b+5,a+5);}}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();const m=material.clone();m.side=T.DoubleSide;mesh(g,m,0,0,0);}}

 stripe([[-2.3,1.15,1.7],[-1.6,1.08,1.46],[0,1.02,1.19],[1.5,1.07,1.2],[2.65,1.18,1.29],[3.12,1.3,1.4]],red);
 stripe([[-2.3,1.75,2.02],[-1.6,1.42,1.79],[0,1.3,1.45],[1.5,1.31,1.4],[2.65,1.36,1.43],[3.12,1.43,1.49]],blue);
 stripe([[-2.2,2.3,2.56],[-1.5,2.45,2.65],[-.1,1.7,1.87],[1.5,1.5,1.56],[2.8,1.56,1.61]],red);

 part('engine');ell(1.55,.45,.75,red,-.65,2.98,0);
 box(1.5,.13,1.6,white,.35,2.94,0);
 part('cockpit');
 for(const z of [-1,1]){
  // Framed, flatter cockpit glazing follows the supplied side/front references.
  const pane=(vertices,material)=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices.flat(),3));g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();const m=material.clone();m.side=T.DoubleSide;return mesh(g,m,0,0,0);};
  pane([[1.72,1.82,z*1.03],[1.72,2.65,z*.91],[2.22,2.48,z*.89],[2.62,1.83,z*.88]],glass);
  pane([[2.66,1.85,z*.86],[2.26,2.49,z*.87],[2.62,2.53,z*.12],[3.12,1.85,z*.12]],glass);
  pane([[1.3,2.99,z*.2],[1.3,2.99,z*.7],[2.08,2.8,z*.72],[2.2,2.79,z*.2]],roofGlass);
  tube([1.7,1.82,z*1.065],[1.7,2.68,z*.94],.035,white);
  tube([1.7,2.68,z*.94],[2.28,2.53,z*.91],.035,white);
  tube([2.28,2.53,z*.91],[2.7,1.82,z*.9],.035,white);
  tube([2.7,1.82,z*.9],[1.7,1.82,z*1.065],.035,white);
  tube([2.65,2.56,z*.1],[3.15,1.83,z*.1],.035,white);
  tube([2.94,1.92,z*.15],[2.63,2.3,z*.4],.018,black);
  for(const x of [-1.48,.68])tube([x,1.02,z*1.075],[x,2.84,z*1.075],.025,white);
  tube([-1.48,2.84,z*1.075],[.68,2.84,z*1.075],.028,metal);
  tube([-1.48,1.02,z*1.075],[.68,1.02,z*1.075],.022,metal);
  box(2.45,.045,.055,metal,-.45,2.9,z*1.09);
  tube([-.95,.56,z*1.28],[.55,.56,z*1.28],.035,metal);
  for(let i=0;i<7;i++)box(.045,.24,.025,black,-1.54+i*.12,3.12,z*.735);
  for(let i=0;i<13;i++)mesh(new T.SphereGeometry(.014,5,4),metal,-1.4+i*.16,1.03,z*1.1);
  const lamp=mesh(new T.SphereGeometry(.045,8,6),mat(z<0?'#e83d40':'#3dbd85'),.1,2.89,z*1.1);lamp.name='navigation-lamp';
  box(.77,.78,.035,glass,1.23,2.18,z*1.052);
  box(.89,.72,.035,glass,.15,2.2,z*1.054);box(.89,.72,.035,glass,-.91,2.2,z*1.054);
  tube([.68,1.06,z*1.075],[.68,2.85,z*1.075],.023,metal);
  tube([-1.48,1.06,z*1.075],[-1.48,2.85,z*1.075],.023,metal);
  box(.22,.035,.06,metal,.59,1.67,z*1.1);
  part(z<0?'skidLeft':'skidRight');
  tube([-1.9,.12,z*1.3],[2.05,.12,z*1.3],.075,metal);
  tube([2.05,.12,z*1.3],[2.48,.4,z*1.3],.075,metal);
  for(const x of [-1.25,1.18]){tube([x,.14,z*1.3],[x,.5,z*1.3],.06,metal);tube([x,.5,z*1.3],[x,1.05,0],.065,metal);}active=parts.cockpit;
 }
 // Tapered tail boom, stabilizer, vertical fin and tail rotor.
 part('tailBoom');
 const boom=mesh(new T.CylinderGeometry(.55,.18,6.5,16),white,-5.12,2.1,0);boom.rotation.z=-Math.PI/2;
 for(const side of [-1,1]){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([-1.88,1.89,side*.56,-1.88,2.12,side*.56,-8.3,2.17,side*.195,-8.3,2.06,side*.195],3));g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();const material=blue.clone();material.side=T.DoubleSide;mesh(g,material,0,0,0);}
 part('stabilizer');
 box(1,.11,2.8,white,-6.45,2.12,0);box(.35,.12,2.8,red,-6.9,2.12,0);
 part('fin');
 const fin=new T.Shape();fin.moveTo(-8.45,1.95);fin.lineTo(-9.42,4.06);fin.lineTo(-8.68,4.06);fin.lineTo(-7.86,2.05);fin.closePath();
 mesh(new T.ExtrudeGeometry(fin,{depth:.16,bevelEnabled:false}),red,0,0,-.08);
 // Crescent and star on both faces of the red fin, reconstructed from supplied livery.
 for(const side of [-1,1]){const crescent=new T.Shape();crescent.absarc(0,0,.18,.65,Math.PI*2-.65,false);crescent.absarc(.07,0,.145,Math.PI*2-.8,.8,true);crescent.closePath();const m=white.clone();m.side=T.DoubleSide;mesh(new T.ShapeGeometry(crescent),m,-8.84,3.3,side*.09);const star=new T.Shape();for(let j=0;j<10;j++){const a=Math.PI/2+j*Math.PI/5,r=j%2?.038:.09;const x=Math.cos(a)*r,y=Math.sin(a)*r;if(j)star.lineTo(x,y);else star.moveTo(x,y);}star.closePath();mesh(new T.ShapeGeometry(star),m,-8.59,3.3,side*.091);}
 tube([-8.95,3.75,-.38],[-8.95,3.75,.45],.09,metal);
 const tail=new T.Group();tail.position.set(-8.95,3.75,-.48);root.add(tail);parts.tailRotor=tail;tail.name='tailRotor';
 box(.14,2.6,.045,black,0,0,0,tail);box(.23,.25,.07,red,0,1.17,0,tail);box(.23,.25,.07,red,0,-1.17,0,tail);
 // Exhaust and transmission/mast. Main rotor diameter from Figure 2-3.
 active=parts.engine;
 const exhaust=mesh(new T.CylinderGeometry(.3,.32,.62,16),metal,-2.05,3.02,0);exhaust.rotation.z=Math.PI/2;
 const opening=mesh(new T.CircleGeometry(.26,16),black,-2.37,3.02,0);opening.rotation.y=-Math.PI/2;
 part('mast');
 tube([-.3,3.12,0],[-.3,4.05,0],.085,metal);tube([-.3,3.48,-1.1],[-.3,3.48,1.1],.035,metal);
 const rotor=new T.Group();rotor.position.set(-.3,4.15,0);root.add(rotor);parts.mainRotor=rotor;rotor.name='mainRotor';
 for(const side of [-1,1]){const blade=new T.Group();blade.name=side<0?'bladeLeft':'bladeRight';rotor.add(blade);parts[blade.name]=blade;box(DIMENSIONS.rotorDiameterM/2-.4,.055,.53,black,side*(DIMENSIONS.rotorDiameterM/4+.2),0,0,blade);}
 for(const s of [-1,1])box(.4,.052,.29,red,s*(DIMENSIONS.rotorDiameterM/2-.2),0,0,rotor);
 box(.65,.15,.4,metal,0,0,0,rotor);
 tube([1.2,2.88,0],[1.35,3.43,0],.016,black);
 // Hub links, stabilizer paddles, skid caps and radio antenna details.
 for(const z of [-1,1]){box(.3,.055,.42,metal,-.3,3.48,z*1.08);tube([-.62,3.58,z*.26],[-.62,4.1,z*.32],.025,metal);}
 tube([-.8,3.24,0],[-1.05,3.94,0],.018,black);
 box(.2,.07,.7,black,-.75,.9,0);
 part('transmission');box(.9,.34,.74,metal,-.3,3.12,0);part('controls');for(const side of [-1,1])tube([-.5,3.3,side*.3],[-.48,4.03,side*.36],.023,metal);active=parts.cabin;
 const debris=new T.Group();debris.name='impactFragments';root.add(debris);for(let i=0;i<4;i++){const fragment=box(i<2?1.4:.35,.045,i<2?.25:.16,black,0,.1,0,debris);fragment.visible=false;}
 // Lettering is a transparent canvas decal, never required for headless geometry tests.
 if(typeof document!=='undefined'){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;const ctx=canvas.getContext('2d');
  if(ctx){ctx.fillStyle='#fff';ctx.font='bold 65px sans-serif';ctx.textAlign='center';ctx.fillText('JANDARMA',256,72);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;for(const z of [-1,1]){const decal=mesh(new T.PlaneGeometry(1.6,.28),new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false}),-1.15,1.64,z*1.045);decal.rotation.y=z<0?Math.PI:0;}}
 }
 root.userData={visualOnly:true,dimensions:DIMENSIONS,detailRevision:'0.24',referenceLimits:'Photo reconstruction, not original CAD'};for(const g of Object.values(parts)){g.userData.restPosition=g.position.clone();g.userData.restRotation=g.rotation.clone();g.userData.restScale=g.scale.clone();}return {root,rotor,tail,parts,debris};
}
