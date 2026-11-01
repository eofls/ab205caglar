import test from 'node:test';import assert from 'node:assert/strict';import * as T from '../../vendor/three.module.js';import {CanvasScene,projectPoint} from '../../canvas-scene.js';import {Session} from '../../engine.js';
test('compatibility projection rejects clipped points and maps visible center',()=>{const c=new T.PerspectiveCamera(43,4/3,.1,100);c.position.set(0,0,10);c.lookAt(0,0,0);c.updateMatrixWorld();const m=new T.Matrix4().multiplyMatrices(c.projectionMatrix,c.matrixWorldInverse);assert.deepEqual(projectPoint([0,0,0],m,800,600),[400,300]);assert.equal(projectPoint([0,0,20],m,800,600),null);});
test('Canvas compatibility runs without WebGL and retains camera and timeline behavior',()=>{
 const oldDoc=globalThis.document,oldObserver=globalThis.ResizeObserver;let fills=0;
 const ctx={createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4)};},putImageData(){},drawImage(){fills++;},setTransform(){},fillRect(){fills++;},beginPath(){},moveTo(){},lineTo(){},closePath(){},stroke(){},fill(){fills++;},arc(){},fillText(){}};
 const canvas=()=>({style:{},listeners:{},setAttribute(){},getContext(type){assert.equal(type,'2d');return ctx;},addEventListener(k,cb){this.listeners[k]=cb;},setPointerCapture(){}});
 const status={},motion={},host={clientWidth:640,clientHeight:480,offsetWidth:640,children:[],appendChild(c){this.children.push(c);},querySelector(id){return id==='#scene-status'?status:motion;}};
 globalThis.document={createElement:canvas};globalThis.ResizeObserver=class{observe(){}disconnect(){}};
 try{const view=new CanvasScene(host,Error('WebGL disabled'));assert.equal(host.children.length,2);const session=new Session({scenario:'safe',mode:'watch'});session.seek(20);view.update(session);view.draw();assert.ok(fills>0);assert.match(status.textContent,/Uyumluluk/);const before=view.heli.root.position.clone();session.seek(35);view.update(session);session.seek(20);view.update(session);assert.deepEqual(view.heli.root.position,before);
 const d=view.distance;view.canvas.listeners.wheel({preventDefault(){},deltaY:100});assert.ok(view.distance>d);view.preset('top');assert.equal(view.elevation,1.5);host.clientWidth=1200;view.resize();assert.equal(view.width,1200);
 }finally{globalThis.document=oldDoc;globalThis.ResizeObserver=oldObserver;}
});
