# FBX (binary, Blender export) -> GLB. Geometry, UVs, normals, materials and embedded textures are kept as they are;
# object transforms are written as node matrices (metres). Material settings are taken from a reference glTF JSON
# (the same model's own GLB export) when its material names match.
import sys,json,struct,pathlib,math,numpy as np
from fbx_binary import parse,walk

def euler_xyz(rx,ry,rz):
    rx,ry,rz=[math.radians(v) for v in (rx,ry,rz)]
    cx,sx,cy,sy,cz,sz=math.cos(rx),math.sin(rx),math.cos(ry),math.sin(ry),math.cos(rz),math.sin(rz)
    X=np.array([[1,0,0],[0,cx,-sx],[0,sx,cx]]);Y=np.array([[cy,0,sy],[0,1,0],[-sy,0,cy]]);Z=np.array([[cz,-sz,0],[sz,cz,0],[0,0,1]])
    return Z@Y@X
def m4(R=None,t=None,s=None):
    M=np.eye(4)
    if R is not None:M[:3,:3]=R
    if s is not None:M[:3,:3]=M[:3,:3]@np.diag(s)
    if t is not None:M[:3,3]=t
    return M

def convert(src,dst,ref_json=None,unit=0.01,skip=(),jpeg_over=0):
    nodes=parse(pathlib.Path(src));top={n[0]:n for n in nodes};objs=top['Objects'][2]
    conns=[c[1] for c in top['Connections'][2]];byid={o[1][0]:o for o in objs}
    name=lambda o:o[1][1].split('\x00')[0]
    props=lambda o:{p[1][0]:p[1][4:] for c in o[2] if c[0]=='Properties70' for p in c[2]}
    child_of={};
    for c in conns:
        if c[0]=='OO':child_of.setdefault(c[2],[]).append(c[1])
    parent={c[1]:c[2] for c in conns if c[0]=='OO' and byid.get(c[1],[''])[0]=='Model'}
    def local(o):
        P=props(o);g=lambda k,d:np.array([float(x) for x in P.get(k,d)])
        T=g('Lcl Translation',[0,0,0]);Rl=g('Lcl Rotation',[0,0,0]);S=g('Lcl Scaling',[1,1,1]);Rpre=g('PreRotation',[0,0,0]);Rpost=g('PostRotation',[0,0,0])
        Roff=g('RotationOffset',[0,0,0]);Rp=g('RotationPivot',[0,0,0]);Soff=g('ScalingOffset',[0,0,0]);Sp=g('ScalingPivot',[0,0,0])
        M=m4(t=T)@m4(t=Roff)@m4(t=Rp)@m4(R=euler_xyz(*Rpre))@m4(R=euler_xyz(*Rl))@np.linalg.inv(m4(R=euler_xyz(*Rpost)))@np.linalg.inv(m4(t=Rp))@m4(t=Soff)@m4(t=Sp)@m4(s=S)@np.linalg.inv(m4(t=Sp))
        G=m4(t=g('GeometricTranslation',[0,0,0]))@m4(R=euler_xyz(*g('GeometricRotation',[0,0,0])))@m4(s=g('GeometricScaling',[1,1,1]))
        return M,G
    def world(o):
        M,_=local(o);p=parent.get(o[1][0],0)
        return (world(byid[p])@M) if p in byid and byid[p][0]=='Model' else M
    # images
    images=[];img_index={}
    for o in objs:
        if o[0]=='Video':
            content=[c[1][0] for c in o[2] if c[0]=='Content' and c[1]]
            if content and len(content[0])>0:img_index[o[1][0]]=len(images);images.append((name(o).rsplit('.',1)[0],bytes(content[0])))
    tex_img={}
    for o in objs:
        if o[0]=='Texture':
            vid=[k for k in child_of.get(o[1][0],[]) if byid.get(k,[''])[0]=='Video']
            if vid and vid[0] in img_index:tex_img[o[1][0]]=img_index[vid[0]]
    mat_tex={}
    for c in conns:
        if c[0]=='OP' and c[1] in tex_img and byid.get(c[2],[''])[0]=='Material':mat_tex.setdefault(c[2],{})[c[3]]=tex_img[c[1]]
    ref=json.loads(open(ref_json).read()) if ref_json else None
    refmats={m.get('name'):m for m in (ref or {}).get('materials',[])}
    mats=[];mat_index={}
    def material(o):
        if o[1][0] in mat_index:return mat_index[o[1][0]]
        nm=name(o);P=props(o);base={'name':nm}
        if nm in refmats:
            r=json.loads(json.dumps(refmats[nm]));base.update({k:v for k,v in r.items() if k not in('pbrMetallicRoughness','normalTexture','emissiveTexture','occlusionTexture')});pbr=dict(r.get('pbrMetallicRoughness',{}));pbr.pop('baseColorTexture',None);pbr.pop('metallicRoughnessTexture',None)
        else:
            col=[float(x) for x in P.get('DiffuseColor',[.8,.8,.8])][:3];op=float(P.get('Opacity',[1])[0]) if 'Opacity' in P else 1.0
            pbr={'baseColorFactor':col+[op],'metallicFactor':0,'roughnessFactor':.7}
            if op<1:base['alphaMode']='BLEND'
        t=mat_tex.get(o[1][0],{}).get('DiffuseColor')
        if t is not None:pbr['baseColorTexture']={'index':t}
        base['pbrMetallicRoughness']=pbr;mat_index[o[1][0]]=len(mats);mats.append(base);return mat_index[o[1][0]]
    bin=bytearray();views=[];accs=[];meshes=[];gnodes=[]
    def add(arr,target=None,kind='VEC3',comp=5126,minmax=False):
        a=np.ascontiguousarray(arr);off=len(bin);bin.extend(a.tobytes());
        while len(bin)%4:bin.append(0)
        v={'buffer':0,'byteOffset':off,'byteLength':a.nbytes};
        if target:v['target']=target
        views.append(v);acc={'bufferView':len(views)-1,'componentType':comp,'count':int(a.shape[0]),'type':kind}
        if minmax:acc['min']=a.min(0).tolist();acc['max']=a.max(0).tolist()
        accs.append(acc);return len(accs)-1
    for o in objs:
        if o[0]!='Model' or o[1][2]!='Mesh':continue
        nm=name(o)
        if any(nm.startswith(s) for s in skip):continue
        gids=[k for k in child_of.get(o[1][0],[]) if byid.get(k,[''])[0]=='Geometry']
        if not gids:continue
        g=byid[gids[0]];d={c[0]:c for c in g[2]}
        V=d['Vertices'][1][0].reshape(-1,3).astype(np.float64);PVI=d['PolygonVertexIndex'][1][0].astype(np.int64)
        idx=np.where(PVI<0,-PVI-1,PVI);ends=np.where(PVI<0)[0];starts=np.concatenate([[0],ends[:-1]+1])
        def layer(nm2,data,index):
            L=d.get(nm2)
            if not L:return None
            c={x[0]:x[1][0] if x[1] else None for x in L[2]};arr=np.asarray(c[data],dtype=np.float64);mapping=c['MappingInformationType'];refmode=c['ReferenceInformationType']
            dim=3 if data=='Normals' else 2;arr=arr.reshape(-1,dim)
            if refmode=='IndexToDirect':arr=arr[np.asarray(c[index],dtype=np.int64)]
            if mapping=='ByPolygonVertex':return arr
            if mapping in('ByVertice','ByVertex'):return arr[idx]
            if mapping=='ByPolygon':return np.repeat(arr,ends-starts+1,axis=0)
            return np.repeat(arr[:1],len(idx),axis=0)
        N=layer('LayerElementNormal','Normals','NormalsIndex');UV=layer('LayerElementUV','UV','UVIndex')
        Lm=d.get('LayerElementMaterial');polymat=np.zeros(len(starts),dtype=np.int64)
        if Lm:
            c={x[0]:x[1][0] if x[1] else None for x in Lm[2]};mm=np.asarray(c['Materials'],dtype=np.int64)
            polymat=mm if c['MappingInformationType']=='ByPolygon' else np.repeat(mm[:1],len(starts))
        omats=[k for k in child_of.get(o[1][0],[]) if byid.get(k,[''])[0]=='Material']
        _,G=local(o);P=V@G[:3,:3].T+G[:3,3];P=P[idx]
        Nn=(N@np.linalg.inv(G[:3,:3]).T) if N is not None else None
        tri=[];tmat=[]
        for pi,(s,e) in enumerate(zip(starts,ends)):
            for k in range(s+1,e):tri.append((s,k,k+1));tmat.append(polymat[pi])
        tri=np.array(tri,dtype=np.int64);tmat=np.array(tmat)
        prims=[]
        for mi in np.unique(tmat):
            T=tri[tmat==mi].reshape(-1)
            # identical corners (same position, normal and UV after float32 rounding) are merged; the surface is unchanged
            pp=P[T].astype(np.float32);cols=[pp]
            nn=None
            if Nn is not None:nn=Nn[T].copy();nn/=np.maximum(1e-9,np.linalg.norm(nn,axis=1))[:,None];nn=nn.astype(np.float32);cols.append(nn)
            uv=None
            if UV is not None:uv=UV[T].copy();uv[:,1]=1-uv[:,1];uv=uv.astype(np.float32);cols.append(uv)
            key=np.ascontiguousarray(np.concatenate(cols,axis=1)).view(np.dtype((np.void,4*sum(c.shape[1] for c in cols)))).ravel()
            _,first,inv=np.unique(key,return_index=True,return_inverse=True)
            attrs={'POSITION':add(pp[first],34962,'VEC3',minmax=True)}
            if nn is not None:attrs['NORMAL']=add(nn[first],34962)
            if uv is not None:attrs['TEXCOORD_0']=add(uv[first],34962,'VEC2')
            ind=inv.reshape(-1).astype(np.uint16 if len(first)<65536 else np.uint32);prim={'attributes':attrs,'indices':add(ind,34963,'SCALAR',5123 if ind.dtype==np.uint16 else 5125)}
            if omats:prim['material']=material(byid[omats[min(int(mi),len(omats)-1)]])
            prims.append(prim)
        meshes.append({'name':nm,'primitives':prims})
        W=world(o);W=np.diag([unit,unit,unit,1])@W
        gnodes.append({'name':nm,'mesh':len(meshes)-1,'matrix':W.T.reshape(-1).tolist()})
    gimgs=[];gtex=[]
    for nm,b in images:
        if jpeg_over and b[:4]==b'\x89PNG' and len(b)>jpeg_over:
            import io
            from PIL import Image
            im=Image.open(io.BytesIO(b))
            if im.mode=='RGB':o=io.BytesIO();im.save(o,'JPEG',quality=92,subsampling=0,optimize=True);b=o.getvalue() if len(o.getvalue())<len(b) else b
        off=len(bin);bin.extend(b)
        while len(bin)%4:bin.append(0)
        views.append({'buffer':0,'byteOffset':off,'byteLength':len(b)});mime='image/png' if b[:4]==b'\x89PNG' else 'image/jpeg'
        gimgs.append({'name':nm,'mimeType':mime,'bufferView':len(views)-1});gtex.append({'source':len(gimgs)-1,'sampler':0})
    gl={'asset':{'version':'2.0','generator':'fbx2glb (AB-205 lab)'},'scene':0,'scenes':[{'nodes':list(range(len(gnodes)))}],'nodes':gnodes,'meshes':meshes,'materials':mats,
        'textures':gtex,'images':gimgs,'samplers':[{'magFilter':9729,'minFilter':9987,'wrapS':10497,'wrapT':10497}],'accessors':accs,'bufferViews':views,'buffers':[{'byteLength':len(bin)}]}
    js=json.dumps(gl,separators=(',',':')).encode();js+=b' '*((4-len(js)%4)%4)
    out=struct.pack('<III',0x46546C67,2,12+8+len(js)+8+len(bin))+struct.pack('<II',len(js),0x4E4F534A)+js+struct.pack('<II',len(bin),0x004E4942)+bytes(bin)
    pathlib.Path(dst).write_bytes(out);return gl

if __name__=='__main__':
    gl=convert(sys.argv[1],sys.argv[2],sys.argv[3] if len(sys.argv)>3 else None)
    print('nodes',len(gl['nodes']),'materials',len(gl['materials']),'images',len(gl['images']))
