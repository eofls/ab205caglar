// v0.32 infrastructure stub for item H (instructor–student). Not wired into the UI yet (planned for the evening update).
// A shared "room" carries the instructor's scenario choice and a failure trigger to students viewing the same artifact.
// It uses the artifact runtime's room capability when the host offers it, and otherwise degrades to a local, single-viewer room.
export async function openRoom(id='ab205-default'){
 let room=null;try{room=globalThis.claude?.use?await globalThis.claude.use('room'):null;}catch{room=null;}
 const listeners=new Set(),local={id,state:{scenario:null,failureAt:null,instructor:null}};
 const emit=st=>{for(const f of listeners)try{f(st);}catch{}};
 return {shared:!!room,id,
  get state(){return local.state;},
  onChange(f){listeners.add(f);return()=>listeners.delete(f);},
  async publish(patch){local.state={...local.state,...patch};emit(local.state);try{await room?.set?.(id,local.state);}catch{}return local.state;}};
}
