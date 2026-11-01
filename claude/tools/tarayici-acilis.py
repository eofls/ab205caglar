from playwright.sync_api import sync_playwright
import time,sys
A=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]
with sync_playwright() as p:
  b=p.chromium.launch(args=A)
  for name,kw in [('telefon',p.devices['iPhone 13']),('masaustu',{'viewport':{'width':1400,'height':900}})]:
    ctx=b.new_context(**kw);pg=ctx.new_page();logs=[]
    pg.on("console",lambda m:logs.append(f"{m.type}: {m.text[:200]}") if m.type in('error','warning') else None);pg.on("pageerror",lambda e:logs.append("ERR "+str(e)[:300]));pg.on("crash",lambda:logs.append("CRASH"))
    t=time.time();pg.goto("http://localhost:8801/",wait_until="load")
    for i in range(40):
      pg.wait_for_timeout(3000)
      m=pg.evaluate("()=>({heap:performance.memory?Math.round(performance.memory.usedJSHeapSize/1e6):null,loaded:!!globalThis.__sceneView?.heli?.loaded,lost:globalThis.__sceneView?.contextLost??null,ver:document.title})")
      if m['loaded']:break
    print(name,round(time.time()-t),'s',m);print('\n'.join(logs[:15]));ctx.close()
  b.close()
