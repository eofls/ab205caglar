import test from 'node:test';
import assert from 'node:assert/strict';
import {FullscreenLayout} from '../../fullscreen-layout.js';
import {Session} from '../../engine.js';
// Minimal DOM fixture for controller tests; not a substitute for native browser QA.
class Node extends EventTarget{
 constructor(name){super();this.name=name;this.children=[];this.parentNode=null;this.attrs={};}
 appendChild(node){node.remove();this.children.push(node);node.parentNode=this;return node;}
 remove(){if(this.parentNode){const list=this.parentNode.children;list.splice(list.indexOf(this),1);this.parentNode=null;}}
 before(node){node.remove();const p=this.parentNode;p.children.splice(p.children.indexOf(this),0,node);node.parentNode=p;}
 after(node){node.remove();const p=this.parentNode;p.children.splice(p.children.indexOf(this)+1,0,node);node.parentNode=p;}
 setAttribute(k,v){this.attrs[k]=v;}
}
function fixture(){
 const doc=new EventTarget();doc.fullscreenElement=null;doc.createComment=()=>new Node('anchor');
 const root=new Node('scene'),button=new Node('fullscreen-button'),home=new Node('normal-view');
 const entries=['event','transport','decision','rpm'].map(name=>{const node=new Node(name),slot=new Node(name+'-slot');home.appendChild(node);root.appendChild(slot);return {node,slot};});
 root.requestFullscreen=async()=>{doc.fullscreenElement=root;doc.dispatchEvent(new Event('fullscreenchange'));};doc.exitFullscreen=async()=>{doc.fullscreenElement=null;doc.dispatchEvent(new Event('fullscreenchange'));};
 const layout=new FullscreenLayout({document:doc,root,button,entries});return {doc,root,button,home,entries,layout};
}
test('Fullscreen and Esc preserve original controls, live values, callbacks and ordering across repeated entries',async()=>{
 const f=fixture(),controls=f.entries[1].node;let clicks=0;controls.value='18.4';controls.addEventListener('click',()=>clicks++);
 for(let i=0;i<3;i++){
  await f.layout.toggle();for(const e of f.entries)assert.equal(e.node.parentNode,e.slot);assert.equal(f.button.attrs['aria-pressed'],'true');controls.dispatchEvent(new Event('click'));controls.value='25';
  await f.doc.exitFullscreen();for(const e of f.entries)assert.equal(e.node.parentNode,f.home);assert.equal(controls.value,'25');assert.equal(f.layout.active,false);assert.equal(f.button.attrs['aria-pressed'],'false');
  assert.deepEqual(f.home.children.filter(n=>n.name!=='anchor').map(n=>n.name),['event','transport','decision','rpm']);
 }assert.equal(clicks,3);
});
test('Denied fullscreen and unrelated fullscreen changes leave normal controls accessible',async()=>{
 const f=fixture();f.root.requestFullscreen=async()=>{throw Error('Permission denied');};await assert.rejects(f.layout.toggle());assert.equal(f.layout.active,false);for(const e of f.entries)assert.equal(e.node.parentNode,f.home);
 f.doc.fullscreenElement=new Node('other');f.doc.dispatchEvent(new Event('fullscreenchange'));for(const e of f.entries)assert.equal(e.node.parentNode,f.home);
});
test('Playback and decisions use one session across fullscreen transitions',async()=>{
 const f=fixture(),s=new Session({scenario:'safe'}),transport=f.entries[1].node,decision=f.entries[2].node;
 transport.addEventListener('click',()=>s.playing?s.pause():s.play());decision.addEventListener('click',()=>s.choose(s.pending.id,s.pending.id==='priority'?'control':'shared'));
 await f.layout.toggle();transport.dispatchEvent(new Event('click'));s.tick(30);assert.equal(s.time,s.scenario.decisions[0].at);assert.equal(s.playing,false);
 decision.dispatchEvent(new Event('click'));transport.dispatchEvent(new Event('click'));s.tick(30);assert.equal(s.time,s.scenario.decisions[1].at);
 await f.layout.exit();assert.equal(s.time,s.scenario.decisions[1].at);assert.equal(s.pending.id,'landing');await f.layout.toggle();decision.dispatchEvent(new Event('click'));transport.dispatchEvent(new Event('click'));s.tick(1);assert.equal(s.time,s.scenario.decisions[1].at+1);
 transport.dispatchEvent(new Event('click'));s.tick(5);assert.equal(s.time,s.scenario.decisions[1].at+1);
});
