import numpy as np,sys
from PIL import Image
from scipy import ndimage as nd
def woody(path):
    a=np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    R,G,B=a[...,0],a[...,1],a[...,2];L=(R+G+B)/3
    Ls=nd.gaussian_filter(L,.7)
    loc=nd.uniform_filter(L,25)
    crown=np.clip((loc-Ls-6)/10,0,1)*np.clip((100-Ls)/25,0,1)*np.clip((G-R+40)/25,0,1)
    # strongly green dark pixels (riparian, irrigated poplars) count fully
    green=np.clip((G-R+2)/10,0,1)*np.clip((90-Ls)/25,0,1)
    std=np.sqrt(np.maximum(nd.uniform_filter(L*L,11)-nd.uniform_filter(L,11)**2,0))
    gsm=(nd.uniform_filter(np.clip((G-R+4)/10,0,1),11)>.6)&(std<6)       # large smooth green: crop, reeds, lawn
    gsm=nd.binary_dilation(nd.binary_opening(gsm,iterations=2),iterations=9)
    green[gsm]=0;crown[gsm]=0
    c=np.maximum(crown,green)
    dens=nd.uniform_filter(c,5)*1.6
    return np.clip(dens,0,1)
if __name__=='__main__':
    s=woody(sys.argv[1]);Image.fromarray((s*255).astype(np.uint8)).save(sys.argv[2]);print(s.mean())
