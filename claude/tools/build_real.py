# Builds assets/terrain/<name>-real.js for a real flight area: DEM grids, tree grid (S2 + OSM), surface grid, OSM features.
import sys,json,math,base64,numpy as np
from PIL import Image
from scipy import ndimage as nd
sys.path.insert(0,'/tmp/claude-0/-home-claude/9b9e4939-1d9e-5007-9a82-b82b5614c694/scratchpad/scripts')
from woody import woody
W='/tmp/claude-0/-home-claude/9b9e4939-1d9e-5007-9a82-b82b5614c694/scratchpad/work/'
name,key,lat0,lon0,demfile,demx0,demy0,img,osmf,conifer=sys.argv[1],sys.argv[2],float(sys.argv[3]),float(sys.argv[4]),sys.argv[5],int(sys.argv[6]),int(sys.argv[7]),sys.argv[8],sys.argv[9],sys.argv[10]=='1'
kx=111320*math.cos(math.radians(lat0));kz=110574
dem=np.frombuffer(open(W+demfile,'rb').read(),'<i2').reshape(720,936).astype(np.float32)*.25
def demAt(x,z):  # bilinear in arcsec grid
    lon=lon0+x/kx;lat=lat0-z/kz
    fx=(lon-32)*3600-demx0-.5; fy=(40-lat)*3600-demy0-.5   # pixel centres
    fx=np.clip(fx,0,935.999);fy=np.clip(fy,0,719.999)
    i=np.floor(fx).astype(int);j=np.floor(fy).astype(int);i=np.minimum(i,934);j=np.minimum(j,718);u=fx-i;v=fy-j
    return (dem[j,i]*(1-u)+dem[j,i+1]*u)*(1-v)+(dem[j+1,i]*(1-u)+dem[j+1,i+1]*u)*v
# ---- trees from imagery ----
RI=int(__import__('os').environ.get('RI','4500'));NI=int(__import__('os').environ.get('NI','2048'))
s=woody(W+img)            # 0..1 per image px (4.39 m)
a=np.asarray(Image.open(W+img).convert('RGB')).astype(np.float32);R_,G_,B_=a[...,0],a[...,1],a[...,2];L=(R_+G_+B_)/3
greenish=nd.uniform_filter(np.clip((G_-R_+2)/10,0,1),5)
osm=json.load(open(W+osmf))
def px(p):return ((p[0]+RI)/(2*RI)*NI,(p[1]+RI)/(2*RI)*NI)
from PIL import ImageDraw
def mask(cond,width=None,fill=True):
    im=Image.new('L',(NI,NI),0);d=ImageDraw.Draw(im)
    for e in osm:
        if e.get('n') or not cond(e['t']):continue
        pts=[px(p) for p in e['p']]
        if len(pts)<2:continue
        if fill and len(pts)>2:d.polygon(pts,fill=255)
        else:d.line(pts,fill=255,width=max(1,int(round((width(e['t']) if callable(width) else width or 1)/(2*RI)*NI))))
    return np.asarray(im)>0
forest=mask(lambda t:t.get('landuse')=='forest' or t.get('natural')=='wood')
orchard=mask(lambda t:t.get('landuse')=='orchard')
def rw(t):
    h=t.get('highway');return {'motorway':24,'trunk':20,'primary':14,'secondary':12,'tertiary':10,'residential':8,'unclassified':8,'service':6,'track':5}.get(h,6)+6
roads=mask(lambda t:'highway' in t and t['highway'] not in('proposed','construction','footway','path'),rw,fill=False)
blds=mask(lambda t:'building' in t)
water=mask(lambda t:t.get('natural')=='water' or t.get('landuse')=='reservoir')
blds_buf=nd.binary_dilation(blds,iterations=2)
dens=s.copy()
dens[forest]=np.maximum(dens[forest],.72)
dens[orchard]=np.maximum(dens[orchard],.45)
dens[roads|blds_buf|water]=0
# OSM single trees / tree rows
for e in osm:
    t=e['t']
    if e.get('n') and t.get('natural')=='tree':
        x,y=px(e['p']);xi,yi=int(x),int(y)
        if 0<=xi<NI and 0<=yi<NI:dens[max(0,yi-1):yi+2,max(0,xi-1):xi+2]=np.maximum(dens[max(0,yi-1):yi+2,max(0,xi-1):xi+2],.9)
rows=mask(lambda t:t.get('natural')=='tree_row',8,fill=False);dens[rows]=np.maximum(dens[rows],.8)
# resample to 10 m cells
NC=RI*2//10
def cells(arr,fn=np.mean):
    ys=(np.arange(NC)+.5)*10/(2*RI)*NI  # centre px
    yy,xx=np.meshgrid(ys,ys,indexing='ij')
    return nd.map_coordinates(nd.uniform_filter(arr.astype(np.float32),3),[yy-.5,xx-.5],order=1)
D=cells(dens);cl=nd.grey_closing(D,size=3);D=np.where(D>.18,np.maximum(D,np.minimum(1,cl*1.25)),D);GR=cells(greenish);FO=cells(forest);OR=cells(orchard)
kind=np.zeros_like(D,dtype=np.uint8)            # 0 oak scrub,1 riparian broad/poplar,2 conifer,3 orchard
kind[GR>.55]=1
if conifer:kind[FO>.5]=2
else:kind[(FO>.5)&(GR>.55)]=1
kind[OR>.5]=3
q=np.clip(np.round(D*31),0,31).astype(np.uint8);q[q<4]=0
tb=(kind<<5|q).astype(np.uint8)
tb[q==0]=0
def rle(b):
    b=b.ravel();out=bytearray();i=0;n=len(b)
    while i<n:
        v=b[i];j=i
        while j<n and j-i<255 and b[j]==v:j+=1
        out+=bytes([j-i,v]);i=j
    return base64.b64encode(bytes(out)).decode()
# ---- surface classes (20 m) ----
NS=RI*2//20
def cells20(arr):
    ys=(np.arange(NS)+.5)*20/(2*RI)*NI;yy,xx=np.meshgrid(ys,ys,indexing='ij')
    return nd.map_coordinates(nd.uniform_filter(arr.astype(np.float32),5),[yy-.5,xx-.5],order=1)
Lc=cells20(L);RG=cells20(R_-G_);Wt=cells20(water);Bd=cells20(nd.binary_dilation(blds,iterations=4))
sc=np.zeros((NS,NS),np.uint8)          # 0 grass/steppe
sc[(RG>28)&(Lc<125)]=1                   # plowed field
sc[(Lc>=125)&(RG<=40)]=2                 # stubble / dry grass
sc[(Lc>=168)]=3                          # bare eroded ground / rock
sc[Bd>.35]=5;sc[Wt>.5]=4
# ---- DEM grids (bare-earth: open the DSM under dense trees) ----
def grid(Rg,N):
    c=np.linspace(-Rg,Rg,N);xx,zz=np.meshgrid(c,c);return demAt(xx,zz)
base=float(demAt(np.array(0.),np.array(0.)))
NG=RI*2//30+1;gi=grid(RI,NG);go=grid(9500,191)
# canopy removal where the 30 m cell is mostly trees
Dg=nd.map_coordinates(D,[ (np.arange(301)*30)/10, (np.arange(301)*30)/10 ],order=1) if False else None
ys=np.arange(NG)*30/10;yy,xx=np.meshgrid(ys,ys,indexing='ij');Dg=nd.map_coordinates(nd.uniform_filter(D,3),[np.minimum(yy,NC-1),np.minimum(xx,NC-1)],order=1)
op=nd.grey_opening(gi,size=3);gi=np.where(Dg>.35,gi-(gi-op)*np.clip((Dg-.35)/.3,0,1),gi)
enc=lambda g:base64.b64encode(np.round((g-base)*4).astype('<i2').tobytes()).decode()
# ---- features ----
feats=[]
for e in osm:
    t=e['t']
    if e.get('n'):
        if t.get('power') in('tower','pole'):feats.append({'tags':{'power':t['power']},'points':[e['p']]})
        continue
    keep={}
    for k in ['building','building:levels','height','highway','power','natural','landuse','waterway','name','width','voltage','leisure','amenity']:
        if k in t:keep[k]=t[k]
    if not keep:continue
    if 'highway' in keep and keep['highway'] in('proposed','construction','footway','path','steps'):continue
    if any(k in keep for k in ['building','highway','power','waterway']) or keep.get('natural')=='water' or keep.get('landuse') in('residential','quarry','industrial','cemetery'):
        pts=e['p'];B=RI-20
        inside=lambda q:abs(q[0])<=B and abs(q[1])<=B
        if all(inside(q) for q in pts):feats.append({'tags':keep,'points':pts});continue
        if 'building' in keep or keep.get('natural')=='water' or 'landuse' in keep:continue   # polygons crossing the edge are dropped
        cur=[]
        def clip(a,b):
            t0,t1=0.,1.;dx,dz=b[0]-a[0],b[1]-a[1]
            for p_,q_ in ((-dx,a[0]+B),(dx,B-a[0]),(-dz,a[1]+B),(dz,B-a[1])):
                if p_==0:
                    if q_<0:return None
                    continue
                r=q_/p_
                if p_<0:t0=max(t0,r)
                else:t1=min(t1,r)
                if t0>t1:return None
            return [a[0]+dx*t0,a[1]+dz*t0],[a[0]+dx*t1,a[1]+dz*t1],t1<1
        for i in range(1,len(pts)):
            c=clip(pts[i-1],pts[i])
            if c is None:
                if len(cur)>1:feats.append({'tags':keep,'points':cur})
                cur=[];continue
            a2,b2,cut=c
            if not cur:cur=[[round(a2[0],1),round(a2[1],1)]]
            cur.append([round(b2[0],1),round(b2[1],1)])
            if cut:
                if len(cur)>1:feats.append({'tags':keep,'points':cur})
                cur=[]
        if len(cur)>1:feats.append({'tags':keep,'points':cur})
js=f"""// Gerçek uçuş sahası ({name}). Merkez K{lat0} D{lon0}, yerel çerçeve: x doğu, z güney (m).
// Yükseklik: Copernicus DEM GLO-30 (© DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018, Copernicus/ESA).
// Ağaç ve zemin ızgaraları: Sentinel-2 cloudless 2023 (EOX, CC BY-NC-SA 4.0; Copernicus Sentinel verisi) görüntüsünden
// ağaç tepesi tespiti + OpenStreetMap (ODbL) orman / meyve bahçesi / tek ağaç / ağaç sırası. Yapılar, yollar, enerji hatları: OSM.
export const {key}={{"name":{json.dumps(name)},"lat0":{lat0},"lon0":{lon0},"base":{base:.2f},"scale":0.25,
"inner":{{"R":{RI},"N":{NG},"data":"{enc(gi)}"}},
"outer":{{"R":9500,"N":191,"data":"{enc(go)}"}},
"trees":{{"R":{RI},"cell":10,"N":{NC},"rle":"{rle(tb)}"}},
"surface":{{"R":{RI},"cell":20,"N":{NS},"rle":"{rle(sc)}"}},
"features":{json.dumps(feats,separators=(',',':'))}}};
"""
open(sys.argv[11],'w').write(js)
print(name,'base',base,'trees>0',(q>0).sum(),'mean dens',D.mean(),'feats',len(feats),'bytes',len(js))
for k in range(4):print(' kind',k,((kind==k)&(q>0)).sum())
print(' surface',np.bincount(sc.ravel(),minlength=6))
