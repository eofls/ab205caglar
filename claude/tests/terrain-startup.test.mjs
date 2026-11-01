import test from 'node:test';
import assert from 'node:assert/strict';
import {Scene} from '../../vendor/three.module.js';
import {addTerrainDetail} from '../../terrain-detail.js';
import {AIRFIELD_FEATURES} from '../../assets/terrain/guvercinlik-osm.js';
import {terrainHeight} from '../../terrain-data.js';
for(const area of ['terrain','airfield'])test(`${area}: real building data constructs without blocking app startup`,()=>{
 const scene=new Scene();
 const group=area==='terrain'?addTerrainDetail(scene):addTerrainDetail(scene,AIRFIELD_FEATURES,area);
 assert.ok(group.children.length>0);
 group.traverse(o=>{assert.ok(o.position.toArray().every(Number.isFinite));});
});
test('building height and ground elevation remain independent',()=>{
 const feature={tags:{building:'yes',height:'12'},points:[[0,0],[10,0],[10,10],[0,10],[0,0]]};
 const group=addTerrainDetail(new Scene(),[feature],'airfield');
 /* v0.35 buildings are merged per material (walls / roofs); the footprint sits on the ground, the roof 12 m above it */
 const ys=[];group.traverse(o=>{if(o.isMesh&&o.name==='Binalar'){const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++)ys.push(p.getY(i));}});
 const g=terrainHeight(4.5,4.5,'airfield');assert.ok(Math.abs(Math.min(...ys)-(g-.05))<.02,`base ${Math.min(...ys)} vs ${g}`);assert.ok(Math.abs(Math.max(...ys)-Math.min(...ys)-12)<.02);
});
