// v0.51 bitiş denetimi: her acil durum × her karar seçeneği → temas, hasar, son evre, sonuç olayı (anormal bitiş arama)
import {DEFAULT_CONFIG} from '../../catalog.js';
import {EMERGENCIES} from '../../emergency-catalog.js';
import {programRun,emergencyDecisionDefs} from '../../program-flight.js';
import {componentDamage} from '../../component-damage.js';
import {contactSeverity} from '../../contact-assessment.js';
const only=process.argv[2];
const row=(r)=>{const ct=r.contact,last=r.samples.at(-1),dm=ct?componentDamage({contact:ct,roll:last?.roll??0,pitch:last?.pitch??0,massKg:2800}):null,mx=dm?Math.max(0,...dm.parts.map(q=>q.severity)):0,sev=ct?contactSeverity(Math.max(0,ct.descentMps)).percent:null,res=r.events.filter(e=>e.kind==='Sonuç').map(e=>e.title).join('/');
 const flags=[];if(ct&&ct.obstacle&&/iniş tamamlandı/.test(last?.phase??''))flags.push('ENGEL+İNİŞ');if(ct&&sev>=60&&mx<.35)flags.push('SERT/HASARSIZ');if(ct&&sev<20&&mx>=.35)flags.push('YUMUŞAK/HASARLI');if(!ct&&r.endReason==='contact')flags.push('TEMASSIZ');
 return `${r.duration.toFixed(0).padStart(4)}s ${ct?`v${ct.descentMps.toFixed(1)} gs${(ct.groundSpeedMps/.5144).toFixed(0)} %${sev} hasar%${Math.round(mx*100)}${ct.obstacle?' !'+ct.obstacle:''}`:'temas yok'} | ${last?.phase??''}${res?' | '+res:''}${flags.length?'  <<'+flags.join(',')+'>>':''}`;};
for(const e of EMERGENCIES.filter(e=>e.kind==='program'&&(!only||e.id===only))){const st=e.start??{},area=e.area??st.area??'terrain';
 const c={...DEFAULT_CONFIG,program:'emergency',emergencyId:e.id,customStart:true,startHeightFt:st.h??500,startIasKt:st.v??80,flightArea:area,startX:st.x??0,startZ:st.z??0,headingDeg:st.hdg??(area==='airfield'?65:0),mode:'watch'};
 const defs=emergencyDecisionDefs(e),ref=Object.values(defs).map(d=>({id:d.id,option:d.reference,at:0}));
 console.log(`${e.id.padEnd(18)} REF ${row(programRun(c,ref))}`);
 for(const d of Object.values(defs))for(const o of d.options){if(o.id===d.reference)continue;try{console.log(`${''.padEnd(18)} ${d.id}=${o.id}${o.risk?'(R)':''} ${row(programRun(c,ref.map(x=>x.id===d.id?{...x,option:o.id}:x)))}`);}catch(err){console.log('  ERR',d.id,o.id,err.message);}}}
