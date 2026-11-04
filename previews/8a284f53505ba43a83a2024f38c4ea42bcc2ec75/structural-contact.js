// Data-driven, one-dimensional energy/stroke foundation. No AB-205 curve is supplied by default.
export function structuralContact(p,model=null){
 if(!p.contact||p.contact.time===0)return {available:false,reason:'Dinamik temas yok'};
 if(!model)return {available:false,reason:'Doğrulanmış kuvvet–deformasyon eğrisi ve geçerlilik aralığı bekleniyor'};
 const {curve,source,maxMassKg,minMassKg,maxAttitudeDeg}=model;
 if(typeof source!=='string'||!source.trim()||!Array.isArray(curve)||curve.length<2||!Number.isFinite(minMassKg)||!Number.isFinite(maxMassKg)||minMassKg<=0||maxMassKg<minMassKg||!Number.isFinite(maxAttitudeDeg)||maxAttitudeDeg<0)throw Error('Yapısal model verisi eksik');
 for(let i=0;i<curve.length;i++){const x=curve[i];if(!Number.isFinite(x.strokeM)||!Number.isFinite(x.forceN)||x.forceN<0||x.strokeM<0||(i===0?x.strokeM!==0:x.strokeM<=curve[i-1].strokeM))throw Error('Geçersiz kuvvet–deformasyon eğrisi');}
 if(p.massKg<minMassKg||p.massKg>maxMassKg||Math.max(Math.abs(p.pitch),Math.abs(p.roll))*180/Math.PI>maxAttitudeDeg||Math.abs((p.contact.normalY??1)-1)>.001)return {available:false,reason:'Kütle, tutum veya zemin eğimi model kapsamı dışında'};
 if(!Number.isFinite(p.massKg)||p.massKg<=0||!Number.isFinite(p.contact.descentMps)||!Number.isFinite(p.pitch)||!Number.isFinite(p.roll))throw Error('Geçersiz temas durumu');
 const energy=.5*p.massKg*Math.max(0,p.contact.descentMps)**2,support=Math.max(0,p.liftN??0),weight=p.massKg*9.80665;
 if(energy===0)return {available:true,source,strokeM:0,peakForceN:0,residualEnergyJ:0,capacityExceeded:false,reason:'Düşey kinetik enerji yok; statik denge hesabı yapılmadı'};
 let absorbed=0,peak=0;
 for(let i=1;i<curve.length;i++){
  const a=curve[i-1],b=curve[i],dx=b.strokeM-a.strokeM,k=(b.forceN-a.forceN)/dx,work=u=>(a.forceN+support-weight)*u+.5*k*u*u;
  // Find the FIRST energy crossing, including a softening curve whose work later decreases.
  const linear=a.forceN+support-weight,remaining=energy-absorbed,disc=linear*linear+2*k*remaining;
  const roots=Math.abs(k)<1e-10?(linear>0?[remaining/linear]:[]):disc>=0?[(-linear+Math.sqrt(disc))/k,(-linear-Math.sqrt(disc))/k]:[];
  const u=roots.filter(x=>x>=0&&x<=dx+1e-10).sort((x,y)=>x-y)[0];
  if(u!==undefined){const stroke=Math.min(dx,u);peak=Math.max(peak,a.forceN,a.forceN+k*stroke);return {available:true,source,strokeM:a.strokeM+stroke,peakForceN:peak,residualEnergyJ:0,capacityExceeded:false,reason:'Sabit rotor desteği ile tek eksenli enerji hesabı; hasar/yaralanma sınıfı değildir'};}
  absorbed+=work(dx);peak=Math.max(peak,a.forceN,b.forceN);
 }
 return {available:true,source,strokeM:curve.at(-1).strokeM,peakForceN:peak,residualEnergyJ:Math.max(0,energy-absorbed),capacityExceeded:true,reason:'Girilen eğrinin stroku tükendi; yapısal kırılma sınıfı belirlenmedi'};
}
