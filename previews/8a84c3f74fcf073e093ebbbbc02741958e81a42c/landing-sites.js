import {terrainHeight,landCoverAt,roadAt,surfaceProfile} from './terrain-data.js';
export {terrainHeight} from './terrain-data.js';
// DEM slope and OSM land cover; material/landing suitability remains inferred.
export function surfaceAt(x,z,area="terrain"){
 if(area!=="terrain")return surfaceProfile(x,z,area).label;
 const slope=Math.hypot((terrainHeight(x+1,z)-terrainHeight(x-1,z))/2,(terrainHeight(x,z+1)-terrainHeight(x,z-1))/2);
 if(roadAt(x,z))return 'Haritalanmış yol · zemin teyitsiz';
 if(landCoverAt(x,z)==='wetland')return 'Sulak alan · yumuşak zemin olası';
 if(slope>.15)return 'Taşlık / eğimli';
 return slope<.04?'Az eğimli açık arazi · zemin teyitsiz':'Bozkır / eğimli arazi';
}
export function siteDistances(position,site,area="terrain"){const horizontal=Math.hypot(position[0]-site.x,position[2]-site.z),vertical=Math.abs(position[1]-terrainHeight(site.x,site.z,area));return {horizontal,vertical,slant:Math.hypot(horizontal,vertical)};}
export function validateSites(raw=[]){
 if(!Array.isArray(raw)||raw.length>100)throw Error('En fazla 100 özel saha kaydedilebilir');
 const seen=new Set();return raw.map(t=>{if(!t||!Number.isInteger(t.number)||t.number<3||t.number>100000||seen.has(t.number)||![t.x,t.z].every(Number.isFinite)||Math.abs(t.x)>6000||Math.abs(t.z)>6000)throw Error('Geçersiz aday saha');seen.add(t.number);if(t.at!==undefined&&!(Number.isFinite(t.at)&&t.at>=4&&t.at<=600))throw Error('Geçersiz aday saha');return t.at===undefined?{number:t.number,x:t.x,z:t.z}:{number:t.number,x:t.x,z:t.z,at:t.at};});
}
export function landingOptions(config,base){return [...base.filter(o=>!(config.hiddenSites??[]).includes(o.id)),...(config.customSites??[]).filter(t=>t.at===undefined).map(t=>({id:'site-'+t.number,label:t.number+' · Seçilen aday saha',text:surfaceAt(t.x,t.z,config.flightArea)+' · Erişim, rüzgâr ve kalan enerjiyle hesaplanır; iniş garantisi değildir.',risk:false}))];}
