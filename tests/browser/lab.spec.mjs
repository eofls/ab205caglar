import {test,expect} from '@playwright/test';

test.beforeEach(async({page})=>{
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.url().startsWith('http://127.0.0.1:4173/')&&r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 page.testErrors=errors;
 await page.goto('/');
 await expect(page.locator('#start-height')).not.toHaveValue('');
});
test.afterEach(async({page},info)=>{
 await info.attach('browser-errors',{body:JSON.stringify(page.testErrors),contentType:'application/json'});
 expect(page.testErrors).toEqual([]);
});
test('WebGL2, supplied helicopter model and a rendered frame',async({page})=>{
 await page.waitForFunction(()=>globalThis.__sceneView?.heli?.loaded===true);
 expect(await page.evaluate(()=>{
  const v=globalThis.__sceneView;
  return !v.fallback&&v.renderer.getContext() instanceof WebGL2RenderingContext&&v.renderer.info.render.calls>0;
 })).toBe(true);
 await expect(page.locator('#scene-host canvas').first()).toBeVisible();
 await page.locator('#scene-panel').screenshot({path:'test-results/scene.png'});
});
test('diagram click, 1 ft / 1 kt keyboard selection and numeric inputs',async({page})=>{
 const chart=page.locator('#chart-picker');
 const b=await chart.boundingBox();
 await chart.click({position:{x:(274+40/80*(648-274))/712*b.width,y:(624-300/600*(624-75))/820*b.height}});
 await expect(page.locator('#start-height')).toHaveValue('300');
 await expect(page.locator('#start-ias')).toHaveValue('40');
 await chart.focus();await page.keyboard.press('ArrowUp');await page.keyboard.press('ArrowRight');
 await expect(page.locator('#start-height')).toHaveValue('301');
 await expect(page.locator('#start-ias')).toHaveValue('41');
 await page.locator('#start-height').fill('287');await page.locator('#start-ias').fill('53');
 await page.locator('#start-form button[type=submit]').click();
 await expect(page.locator('#height-value')).toHaveText('287');
 await expect(page.locator('#ias-value')).toHaveText('53');
});
test('play, pause, rewind, reset and condition changes',async({page})=>{
 await page.locator('#start-lesson').click();
 await page.locator('#play').click();
 await expect.poll(async()=>Number(await page.locator('#seek').inputValue())).toBeGreaterThan(.2);
 await page.locator('#play').click();
 const before=Number(await page.locator('#seek').inputValue());
 await page.waitForTimeout(400);
 expect(Number(await page.locator('#seek').inputValue())).toBe(before);
 await page.locator('#back').click();expect(Number(await page.locator('#seek').inputValue())).toBeLessThanOrEqual(before);
 await page.locator('#reset').click();await expect(page.locator('#seek')).toHaveValue('0');
 await page.locator('#setup-tab-conditions').click();await page.locator('[name=flightArea]').selectOption('water');
 await page.locator('#config-form button[type=submit]').click();
 await expect(page.locator('[name=flightArea]')).toHaveValue('water');
});
test('fullscreen keeps notifications, transport, instruments and decisions interactive',async({page})=>{
 await page.locator('#start-lesson').click();
 await page.locator('#scene-fullscreen').click();
 await expect(page.locator('#scene-fullscreen')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#fullscreen-transport #play')).toBeVisible();
 await expect(page.locator('#fullscreen-rpm #rotor-rpm')).toBeVisible();
 await expect(page.locator('#fullscreen-event #event-panel')).toBeVisible();
 await page.locator('#fullscreen-transport [data-jump="8"]').click();
 await expect(page.locator('#fullscreen-decision #decision')).toBeVisible();
 const answer=page.locator('#fullscreen-decision [data-choice]').first();
 await answer.click();await expect(answer).toHaveClass(/selected/);
 await page.locator('#scene-fullscreen').click();
 await expect(page.locator('#scene-fullscreen')).toHaveAttribute('aria-pressed','false');
 await expect(page.locator('#fullscreen-transport #play')).toHaveCount(0);
 await expect(page.locator('#transport-panel #play')).toBeVisible();
});
test('without WebGL, diagram and playback remain usable',async({browser})=>{
 const context=await browser.newContext();
 await context.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...a){if(String(kind).includes('webgl'))return null;return get.call(this,kind,...a);};});
 const p=await context.newPage();await p.goto('/');
 await expect.poll(()=>p.evaluate(()=>!!globalThis.__sceneView?.fallback)).toBe(true);
 await p.locator('#start-height').fill('100');await p.locator('#start-ias').fill('30');await p.locator('#start-form button').click();
 await p.locator('#play').click();await expect.poll(async()=>Number(await p.locator('#seek').inputValue())).toBeGreaterThan(0);
 await context.close();
});
