// Source-image coordinates, roof-mounted IAS scale. Selection resolution is
// one unit; this does not certify the accuracy of the scanned chart boundaries.
export const PLOT={left:274,right:648,top:75,bottom:624,width:712,height:820,maxHeight:600,maxIas:80};
export function pointToStart(x,y){
 if(!Number.isFinite(x)||!Number.isFinite(y)||x<PLOT.left||x>PLOT.right||y<PLOT.top||y>PLOT.bottom)return null;
 return {startHeightFt:Math.round((PLOT.bottom-y)/(PLOT.bottom-PLOT.top)*600),startIasKt:Math.round((x-PLOT.left)/(PLOT.right-PLOT.left)*80)};
}
export function startToPoint(height,ias){return {x:PLOT.left+ias/80*(PLOT.right-PLOT.left),y:PLOT.bottom-height/600*(PLOT.bottom-PLOT.top)};}
