import test from 'node:test';import assert from 'node:assert/strict';
import {Session} from '../../engine.js';
import {APPROVED_REFERENCE_CHOICES as A} from '../../catalog.js';
const start=()=>{const s=new Session({scenario:'safe'});s.seek(999);s.choose('priority','control');s.seek(999);s.choose('landing','shared');return s;};
test('a field picked mid-scenario opens its own decision at that instant',()=>{const s=start(),t=s.time,id=s.addSite(150,-380);assert.equal(s.config.customSites[0].at,Number(t.toFixed(3)));assert.equal(s.pending.id,'redirect-3');assert.deepEqual(s.pending.options.map(o=>o.id),[id,'keep']);s.choose('redirect-3',id);assert.ok(s.answers.some(a=>a.id==='redirect-3'&&a.option===id));});
test('answering no removes the field and the decision, flow continues',()=>{const s=start(),t=s.time;s.addSite(150,-380);s.choose('redirect-3','keep');assert.equal(s.config.customSites.length,0);assert.notEqual(s.pending?.id,'redirect-3');assert.equal(s.time,t);});
test('right-click removal drops the decision and later answers',()=>{const s=start(),id=s.addSite(150,-380);s.removeSite(id);assert.equal(s.config.customSites.length,0);assert.ok(!s.scenario.decisions.some(d=>d.id==='redirect-3'));});
test('redirect run completes deterministically and ends near finite state',()=>{const s=start(),id=s.addSite(-300,-250);s.choose('redirect-3',id);for(let i=0;i<14;i++){s.seek(999);if(!s.pending)break;s.choose(s.pending.id,A[s.pending.id]??A[s.pending.id.replace(/-\d+$/,'')]);}const c=s.evidence().summary.contact;assert.ok(Number.isFinite(c.descentMps)&&c.time>6);});
