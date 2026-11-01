// v0.32 decluttering: explanatory notes are folded behind a small circled "?" next to the option they explain.
// The note nodes are kept (scripts still write to them); only their display changes.
const NOTES=['label > small:not([id])','#setup-conditions .micro:not([role])','#setup-aircraft .micro:not([role])','#setup-chart .start-form > div > p','.chart-note','#selection-status',
 '.scenario-brief small','.scene-help:first-of-type','#playback-note','#review-panel > .micro','#scenario-book > .micro','.lesson-limit','#review-progress'];
export function foldNotes(root=document){
 for(const note of root.querySelectorAll(NOTES.join(','))){
  if(note.dataset.helpFolded)continue;if(!note.id&&!note.textContent.trim()){note.remove();continue;} /* nothing left to explain */note.dataset.helpFolded='1';note.classList.add('help-note');
  const prev=note.previousElementSibling;
  if(prev?._helpBtn){prev._helpBtn._notes.push(note);note._helpBtn=prev._helpBtn;continue;} // consecutive notes share one "?"
  const reuse=(el)=>{const q=el?.querySelector(':scope > .help-q');if(q){q._notes.push(note);note._helpBtn=q;return true;}return false;};
  {let h=prev;while(h&&(h.hidden||h.classList.contains('help-row')))h=h.previousElementSibling;const ey=note.parentElement?.querySelector(':scope > .eyebrow, :scope > div > .eyebrow');if(!note.parentElement||note.parentElement.tagName!=='LABEL'){if(h&&(/^H[1-4]$/.test(h.tagName)||h.classList.contains('eyebrow'))&&reuse(h))continue;if(ey&&reuse(ey))continue;}}
  const b=document.createElement('button');b.type='button';b.className='help-q';b.textContent='?';b.setAttribute('aria-label','Açıklamayı göster');b.setAttribute('aria-expanded','false');b._notes=[note];note._helpBtn=b;
  b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();showTip(b,e);});
  const label=note.parentElement?.tagName==='LABEL'?note.parentElement:null;
  if(label){const field=label.querySelector('select,input');(field?field:note).before(b);continue;} // "?" right after the option name
  let head=prev;while(head&&(head.hidden||head.classList.contains('help-row')))head=head.previousElementSibling;
  if(head&&(/^H[1-4]$/.test(head.tagName)||head.classList.contains('eyebrow'))){head.append(b);continue;} // "?" beside the section title
  const host=note.parentElement?.querySelector(':scope > .eyebrow, :scope > div > .eyebrow');if(host&&host!==note){host.append(b);continue;}
  const row=document.createElement('div');row.className='help-row';note.before(row);row.append(b);
 }
}

// v0.32.2: the note opens as a small box at the pointer's upper-right, not inline below.
let tip=null,tipOwner=null;
function closeTip(){if(tip){tip.remove();tip=null;tipOwner?.setAttribute('aria-expanded','false');tipOwner=null;}}
function showTip(b,e){
 if(tipOwner===b){closeTip();return;}closeTip();
 const text=b._notes.map(n=>n.textContent.trim()).filter(Boolean);if(!text.length)return;
 tip=document.createElement('div');tip.className='help-tip';tip.setAttribute('role','tooltip');tip.innerHTML=text.map(t=>`<p>${t.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</p>`).join('');
 (document.fullscreenElement??document.body).appendChild(tip);tipOwner=b;b.setAttribute('aria-expanded','true');
 const r=b.getBoundingClientRect(),x=e.clientX||r.right,y=e.clientY||r.top,w=tip.offsetWidth,h=tip.offsetHeight,W=innerWidth,H=innerHeight;
 tip.style.left=Math.max(8,Math.min(W-w-8,x+10))+'px';tip.style.top=Math.max(8,Math.min(H-h-8,y-h-10))+'px';
}
addEventListener('pointerdown',e=>{if(tip&&!tip.contains(e.target)&&!e.target.closest?.('.help-q'))closeTip();},true);
addEventListener('keydown',e=>{if(e.key==='Escape')closeTip();});addEventListener('scroll',closeTip,true);addEventListener('resize',closeTip);
