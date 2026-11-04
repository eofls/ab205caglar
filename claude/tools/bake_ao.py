# v0.43 arazi ortam kapatma (ambient occlusion) dokusu: DEM'den ufuk tabanlı AO, gri tonlu PNG.
# Kullanım: python3 claude/tools/bake_ao.py  → assets/terrain/{tepeler,golbasi,guvercinlik}-ao.png
import re,json,base64,numpy as np
from PIL import Image
def load(path,var):
    s=open(path).read();i=s.index('export const '+var+'=')+len('export const '+var+'=')
    m=re.search(r'"inner":\s*\{\s*"R":\s*(\d+),\s*"N":\s*(\d+),\s*"data":\s*"([^"]+)"',s[i:])
    scale=float(re.search(r'"scale":\s*([\d.]+)',s[i:]).group(1))
    R,N=int(m.group(1)),int(m.group(2));a=np.frombuffer(base64.b64decode(m.group(3)),dtype='<i2').astype(np.float32).reshape(N,N)*scale
    return R,N,a
def ao(h,cell,dirs=16,steps=24,maxd=900.):
    N=h.shape[0];acc=np.zeros_like(h)
    for k in range(dirs):
        a=2*np.pi*k/dirs;dx,dz=np.cos(a),np.sin(a);best=np.zeros_like(h)
        for s in range(1,steps+1):
            d=maxd*(s/steps)**1.5;oi=dx*d/cell;oj=dz*d/cell
            # bilineer kaydırılmış örnek (kenarda kenar değeri)
            ii=np.clip(np.arange(N)[None,:]+oi,0,N-1.001);jj=np.clip(np.arange(N)[:,None]+oj,0,N-1.001)
            i0=np.floor(ii).astype(int);j0=np.floor(jj).astype(int);u=ii-i0;v=jj-j0
            i0=np.broadcast_to(i0,(N,N));j0=np.broadcast_to(j0,(N,N));u=np.broadcast_to(u,(N,N));v=np.broadcast_to(v,(N,N))
            hs=(h[j0,i0]*(1-u)+h[j0,i0+1]*u)*(1-v)+(h[j0+1,i0]*(1-u)+h[j0+1,i0+1]*u)*v
            best=np.maximum(best,np.arctan2(hs-h,d))
        acc+=np.sin(np.maximum(best,0))
    return np.clip(1-acc/dirs*1.6,0,1)
for name,path,var in [('tepeler','assets/terrain/tepeler-real.js','TEPELER'),('golbasi','assets/terrain/golbasi-real.js','GOLBASI'),('guvercinlik','assets/terrain/guvercinlik-dem.js','GUV_DEM')]:
    R,N,h=load(path,var);cell=2*R/(N-1);o=ao(h,cell)
    img=Image.fromarray((o*255).astype(np.uint8),'L').resize((min(1024,N*2),)*2,Image.BICUBIC)
    img.save(f'assets/terrain/{name}-ao.png',optimize=True);print(name,R,N,round(cell,1),'min',o.min().round(2),'mean',o.mean().round(3))
