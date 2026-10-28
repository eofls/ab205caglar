// Synthetic training rubric, NOT a measured AB-205 failure probability or certification limit.
// Numerical anchors intentionally separate from the validated-curve structural solver.
export const DAMAGE_MODEL=Object.freeze({version:'screening-1',referenceMassKg:2800,normalSpeedMps:5,slidingSpeedMps:12,attitudeDeg:12});
export function damageScreening(p){
 const c=p.contact,w=Math.max(0,c.descentMps),v=Math.max(0,c.groundSpeedMps);
 const pitch=Math.abs(p.pitch*180/Math.PI),roll=Math.abs(p.roll*180/Math.PI),mass=p.massKg/2800;
 const normal=100*mass*(w/5)**2,sliding=25*mass*(v/12)**2,attitude=2*Math.max(0,pitch-8)**2+3*Math.max(0,roll-5)**2;
 // Sensitivity envelope of REQUIRED average force, not measured structural capacity.
 const strokes=[.1,.3],lift=Math.max(0,p.liftN??0),forceRangeN=strokes.map(stroke=>Math.max(0,p.massKg*(9.80665+w*w/(2*stroke))-lift)).sort((a,b)=>a-b);
 // Illustrative contact load split. Pitch/roll bias is a reduced-order assumption, not 6DOF.
 const front=Math.max(.1,Math.min(.9,.5+p.pitch)),right=Math.max(.1,Math.min(.9,.5+p.roll));
 const loadShares=[['Ön sağ',front*right],['Ön sol',front*(1-right)],['Arka sağ',(1-front)*right],['Arka sol',(1-front)*(1-right)]].map(([label,share])=>({label,share,requiredForceRangeN:forceRangeN.map(f=>f*share)}));
 const score=normal+sliding+attitude,level=score<25?0:score<80?1:score<180?2:3;
 const labels=['Belirgin hasar beklenmiyor','Hafif hasar olası','Önemli hasar olası','Ağır hasar olası'];
 const mechanisms=[];
 if(normal>=20)mechanisms.push('Skid/crosstube kalıcı şekil değişimi ve bağlantı yükleri');
 if(normal>=100)mechanisms.push('Gövde tabanı ve transmisyon/motor taşıyıcılarında hasar riski');
 if(sliding>=15)mechanisms.push('Yer sürati nedeniyle skid aşınması, takılma ve devrilme riski');
 if(attitude>10)mechanisms.push('Eğik temas nedeniyle asimetrik yük, kuyruk/gövde temas riski');
 if(!mechanisms.length)mechanisms.push('Düşük temas enerjisi; bu tarama belirgin bir hasar mekanizması işaretlemedi');
 return {model:DAMAGE_MODEL.version,level,score,normal,sliding,attitude,mechanisms,forceRangeN,loadShares,assumedStopDistanceM:strokes,
 damage:labels[level]+' · benzetim tahmini',accident:['Düşük sonuç şiddeti','Sınırlı sonuç şiddeti','Ciddi sonuç şiddeti','Çok ciddi sonuç şiddeti'][level]+' · eğitim sınıfı',
 reason:mechanisms.join('. ')+'. Eşikler eğitim tasarımıdır; gerçek AB-205 kırılma sınırı, hasar olasılığı veya resmi kaza-kırım sınıfı değildir.'};
}
