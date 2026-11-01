import {APPROVED_REFERENCE_CHOICES} from '../../catalog.js';
export function completeSession(s,options={}){for(let i=0;i<16;i++){s.seek(999);if(!s.pending)return s;const id=s.pending.id;s.choose(id,options[id]??APPROVED_REFERENCE_CHOICES[id]??APPROVED_REFERENCE_CHOICES[id.replace(/-\d+$/,'')]);}throw Error('Decision loop');}
