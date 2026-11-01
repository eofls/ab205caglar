import struct,zlib,pathlib,numpy as np,json

def parse(path):
 b=path.read_bytes(); ver=struct.unpack_from('<I',b,23)[0]; wide=ver>=7500; h=25 if wide else 13
 def node(pos):
  end,n,sz=struct.unpack_from('<QQQ' if wide else '<III',b,pos); ln=b[pos+h-1]; name=b[pos+h:pos+h+ln].decode(errors='replace');pos+=h+ln;props=[]
  if end==0:return None,pos
  for _ in range(n):
   t=chr(b[pos]);pos+=1
   if t in 'YCLFDI':
    fmt={'Y':'h','C':'?','L':'q','F':'f','D':'d','I':'i'}[t];v=struct.unpack_from('<'+fmt,b,pos)[0];pos+=struct.calcsize(fmt)
   elif t in 'SR':
    l=struct.unpack_from('<I',b,pos)[0];pos+=4;v=b[pos:pos+l];pos+=l
    if t=='S':v=v.decode(errors='replace')
   elif t in 'fdlibc':
    l,enc,sz=struct.unpack_from('<III',b,pos);pos+=12;v=b[pos:pos+sz];pos+=sz
    if enc:v=zlib.decompress(v)
    v=np.frombuffer(v,dtype={'f':'<f4','d':'<f8','l':'<i8','i':'<i4','b':'u1','c':'u1'}[t])
   else:raise ValueError(t)
   props.append(v)
  children=[]
  while pos<end-h:
   ch,pos=node(pos)
   if ch:children.append(ch)
   else:break
  return (name,props,children),end
 nodes=[];p=27
 while p<len(b)-h:
  n,p=node(p)
  if n is None:break
  nodes.append(n)
 return nodes

def walk(nodes):
 for n in nodes:
  yield n
  yield from walk(n[2])
