// Move the original controls, never clone them: IDs, handlers and session stay shared.
export class FullscreenLayout {
 constructor({document:doc,root,button,entries,onChange=()=>{}}){
  this.doc=doc;this.root=root;this.button=button;this.active=false;this.onChange=onChange;
  this.entries=entries.map(({node,slot})=>{const anchor=doc.createComment('fullscreen-home');node.before(anchor);return {node,slot,anchor};});
  this.listener=()=>this.sync();doc.addEventListener('fullscreenchange',this.listener);doc.addEventListener('webkitfullscreenchange',this.listener);doc.addEventListener('keydown',e=>{if(e.key==='Escape'&&this.root.classList?.contains('pseudo-fs'))this.exit();});
 }
 sync(){
  const active=this.doc.fullscreenElement===this.root||(this.doc.webkitFullscreenElement===this.root)||!!this.root.classList?.contains('pseudo-fs');if(active===this.active)return;
  this.active=active;
  for(const {node,slot,anchor} of this.entries){if(active)slot.appendChild(node);else anchor.after(node);}
  this.button.textContent=active?'Tam ekrandan çık ⤢':'Tam ekran ⤢';this.button.setAttribute('aria-pressed',String(active));
  this.onChange(active);
 }
 // v0.33: tablets/phones (iPhone Safari, embedded viewers without fullscreen permission) fall back to a fixed full-window layout
 /* v0.34.2 tablets: full screen is always landscape and laid out like the desktop. The page itself goes browser-fullscreen
    (no browser bars), the scene panel fills the window; if the tablet is held upright the panel is drawn rotated 90°
    (landscape) and touch / pointer coordinates are mapped back, so camera drag, field picking and buttons stay exact. */
 isTablet(){const w=this.doc.defaultView;try{return !!w&&w.matchMedia('(pointer:coarse)').matches&&Math.min(w.screen.width,w.screen.height)>=600;}catch{return false;}}
 orient(){const w=this.doc.defaultView,h=this.doc.documentElement,r=this.root;if(!w||!h?.classList)return;const on=this.tabletFs&&r.classList.contains('pseudo-fs')&&w.innerHeight>w.innerWidth;
  h.classList.toggle('tablet-fs',!!this.tabletFs&&r.classList.contains('pseudo-fs'));h.classList.toggle('fs-rot',on);
  if(on){Object.assign(r.style,{width:w.innerHeight+'px',height:w.innerWidth+'px',transform:`translateX(${w.innerWidth}px) rotate(90deg)`});}else{r.style.width=r.style.height=r.style.transform='';}
  if(on&&!this.rotHooks)this.installRotation();}
 installRotation(){const w=this.doc.defaultView,h=this.doc.documentElement,root=this.root;this.rotHooks=true;
  const def=(e,k,v)=>{try{Object.defineProperty(e,k,{value:v,configurable:true});}catch{}};
  const map=e=>{if(!h.classList.contains('fs-rot')||!root.contains(e.target))return;const sx=e.clientX,sy=e.clientY;if(sx===undefined)return;const x=sy,y=w.innerWidth-sx;def(e,'clientX',x);def(e,'clientY',y);def(e,'pageX',x+w.scrollX);def(e,'pageY',y+w.scrollY);if(e.movementX!==undefined){const mx=e.movementX,my=e.movementY;def(e,'movementX',my);def(e,'movementY',-mx);}};
  for(const t of ['pointerdown','pointermove','pointerup','pointercancel','pointerover','pointerenter','pointerleave','pointerout','mousedown','mousemove','mouseup','click','dblclick','contextmenu','wheel'])w.addEventListener(t,map,{capture:true,passive:true});
  const El=w.Element?.prototype,orig=El?.getBoundingClientRect;if(!orig)return;
  El.getBoundingClientRect=function(){const r=orig.call(this);if(!h.classList.contains('fs-rot')||!root.contains(this))return r;return new w.DOMRect(r.top,w.innerWidth-r.right,r.height,r.width);};}
 async toggle(){if(this.active)await this.exit();else if(this.isTablet()){const r=this.root,d=this.doc;this.tabletFs=true;r.classList.add('pseudo-fs');d.documentElement?.classList?.add('pseudo-fs-on');
   try{const e=d.documentElement;if(e.requestFullscreen)await e.requestFullscreen();else if(e.webkitRequestFullscreen)await e.webkitRequestFullscreen();}catch{}
   try{await d.defaultView?.screen?.orientation?.lock?.('landscape');}catch{}
   if(!this.resizeHook){this.resizeHook=()=>this.orient();d.defaultView?.addEventListener('resize',this.resizeHook);d.defaultView?.addEventListener('orientationchange',this.resizeHook);}
   this.orient();this.sync();}
  else{const r=this.root;try{if(r.requestFullscreen)await r.requestFullscreen();else if(r.webkitRequestFullscreen)await r.webkitRequestFullscreen();else throw Error('no fullscreen');}catch{if(!r.classList)throw Error('denied');r.classList.add('pseudo-fs');this.doc.documentElement?.classList?.add('pseudo-fs-on');}this.sync();}}
 async exit(){const r=this.root;if(r.classList?.contains('pseudo-fs')){r.classList.remove('pseudo-fs');this.doc.documentElement?.classList?.remove('pseudo-fs-on');
  if(this.tabletFs){this.tabletFs=false;this.orient();try{this.doc.defaultView?.screen?.orientation?.unlock?.();}catch{}try{if(this.doc.fullscreenElement)await this.doc.exitFullscreen();else if(this.doc.webkitFullscreenElement)this.doc.webkitExitFullscreen?.();}catch{}}
  this.sync();return;}if(this.doc.fullscreenElement===r){await this.doc.exitFullscreen();this.sync();}else if(this.doc.webkitFullscreenElement===r){this.doc.webkitExitFullscreen?.();this.sync();}}
}
