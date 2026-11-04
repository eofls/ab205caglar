// Kinematic screening, not a landing guarantee. Acceleration is assumed constant only in this diagnostic.
export const LANDING_MODEL=Object.freeze({responseSeconds:.35,commandUpAccelMps2:4,referenceContactMps:5});
export function stoppingAssessment({heightM,descentMps,upAccelMps2,responseSeconds=LANDING_MODEL.responseSeconds}){
 if(![heightM,descentMps,upAccelMps2,responseSeconds].every(Number.isFinite)||responseSeconds<0)throw Error('Geçersiz durdurma girdisi');
 const h=Math.max(0,heightM),w=Math.max(0,descentMps),a=Math.max(0,upAccelMps2),delayDistance=w*responseSeconds,usable=Math.max(0,h-delayDistance);
 const required=w===0?0:usable>0?w*w/(2*usable):null;
 const distance=w===0?0:a>0?delayDistance+w*w/(2*a):null;
 return {requiredUpAccelMps2:required,availableUpAccelMps2:a,responseDistanceM:delayDistance,stoppingDistanceM:distance,
  heightMarginM:distance===null?null:h-distance,insufficient:w>0&&(a===0||usable===0||required>a),
  optimisticResidualMps:Math.sqrt(Math.max(0,w*w-2*a*usable))};
}
