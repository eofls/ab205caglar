# Converts the user-supplied FBX, preserving geometry and material provenance.
import sys,pathlib,json,hashlib
import numpy as np
from fbx_binary import parse,walk
src=pathlib.Path(sys.argv[1]);a=list(walk(parse(src)));cs=[v for n,v,c in a if n=='C'];mats={v[0]:{'name':v[1].split('::')[-1],'color':next(vv[4:] for nn,vv,cc in walk(c) if nn=='P' and vv[0]=='DiffuseColor')} for n,v,c in a if n=='Material'}
meshes=[]
for n,p,c in a:
 if n!='Geometry':continue
 d={n:v for n,v,c in c};v=d['Vertices'][0].reshape(-1,3);ix=d['PolygonVertexIndex'][0];tri=[];face=[]
 for i in ix:
  face.append(int(i if i>=0 else -i-1))
  if i<0:
   for k in range(1,len(face)-1):tri.extend([face[0],face[k],face[k+1]])
   face=[]
 used=np.unique(tri);mapping={int(old):j for j,old in enumerate(used)};v=v[used];model=next(t[2] for t in cs if t[1]==p[0]);mid=next(t[1] for t in cs if t[2]==model and t[1] in mats)
 meshes.append({'name':p[1].split('::')[-1],'material':mid-100,'positions':v.round(6).flatten().tolist(),'indices':[mapping[i] for i in tri]})
out={'source':src.name,'sha256':hashlib.sha256(src.read_bytes()).hexdigest(),'materials':list(mats.values()),'meshes':meshes}
pathlib.Path('dist/assets/models/ab205-reference.js').write_text('export const AB205_REFERENCE='+json.dumps(out,separators=(',',':'))+';\n')
print(len(meshes),'meshes;',sum(len(m['indices'])//3 for m in meshes),'triangles')
