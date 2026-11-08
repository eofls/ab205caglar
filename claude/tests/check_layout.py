"""Structural regression checks; this is not browser/visual QA."""
from html.parser import HTMLParser
from pathlib import Path
class Parser(HTMLParser):
 def __init__(self):
  super().__init__();self.nodes=[];self.stack=[]
 def handle_starttag(self,tag,attrs):
  n={'tag':tag,'attrs':dict(attrs),'parents':self.stack.copy()};self.nodes.append(n)
  if tag not in ('area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'):self.stack.append(n)
 def handle_endtag(self,tag):
  assert self.stack and self.stack[-1]['tag']==tag,('Mismatched HTML',tag)
  self.stack.pop()
p=Parser();p.feed(Path('dist/index.html').read_text());assert not p.stack
ids=[n['attrs']['id'] for n in p.nodes if 'id' in n['attrs']];assert len(ids)==len(set(ids))
byid={n['attrs']['id']:n for n in p.nodes if 'id' in n['attrs']}
chart=byid['setup-chart'];assert 'hidden' not in chart['attrs'];assert any(n['tag']=='aside' for n in chart['parents']);assert not any(n['tag']=='details' for n in chart['parents'])
for ident in ['start-form','start-height','start-ias','chart-picker','point','point-halo','selection-status']:assert chart in byid[ident]['parents'],ident
for ident,maximum in [('start-height','600'),('start-ias','80')]:
 a=byid[ident]['attrs'];assert a['step']=='1' and a['min']=='0' and a['max']==maximum
for n in p.nodes:
 a=n['attrs']
 if 'data-setup-tab' in a:
  panel=byid[a['aria-controls']]['attrs'];assert panel['aria-labelledby']==a['id'];assert ('hidden' in panel)==(a['aria-selected']=='false')
 if 'src' in a:assert Path('dist',a['src']).exists(),a['src']
assert byid['setup-conditions'] in byid['config-form']['parents'];assert byid['setup-presets'] in byid['scenario-list']['parents']
for ident in ['scene-host','seek','lesson-panel','start-lesson']:assert any('center-column' in n['attrs'].get('class','').split() for n in byid[ident]['parents'])
assert 'hidden' in byid['lesson-panel']['attrs']
print('PASS: balanced HTML, unique IDs, visible left chart, input ranges, tab mappings, player and S01 placement, assets')

for ident in ['fullscreen-event','fullscreen-decision','fullscreen-transport']:
 assert byid['scene-panel'] in byid[ident]['parents']
assert byid['scene-panel'] not in byid['event-panel']['parents']
assert byid['scene-panel'] not in byid['transport-panel']['parents']
assert byid['scene-panel'] not in byid['decision']['parents']
print('PASS: fullscreen slots inside fullscreen root; original panels remain in normal layout until entry')
assert 'hidden' in byid['setup-aircraft']['attrs']
assert byid['setup-aircraft'] in byid['aircraft-form']['parents']
assert byid['setup-chart']['attrs'].get('hidden') is None
for name in ['grossWeightLb','initialRotorRpm','airframeType','engineType','bladeType','pitotLocation','externalLoad','manualRevision']:
 matches=[n for n in p.nodes if n['attrs'].get('name')==name]
 assert len(matches)==1 and byid['aircraft-form'] in matches[0]['parents'],name
for asset in ['autorotation-reference.png','rotor-reference.png']:assert Path('dist',asset).exists()
print('PASS: aircraft fields belong to separate form; source evidence exists; chart remains default')

assert byid['scene-host'] in byid['rpm-readout']['parents']
assert byid['fullscreen-right'] in byid['fullscreen-event']['parents']
assert byid['fullscreen-right'] in byid['fullscreen-rpm']['parents']
assert ids.index('fullscreen-event') < ids.index('fullscreen-rpm')
for ident in ['rotor-rpm','engine-rpm','rpm-phase','rpm-note']:assert byid['rpm-readout'] in byid[ident]['parents']
print('PASS: single RPM overlay; fullscreen slot follows event box within right column')

for ident in ['book-form','book-name','book-save','book-import','book-export','book-list']:assert byid['scenario-book'] in byid[ident]['parents']
for ident in ['review-choices','comparison-rows']:assert byid['review-panel'] in byid[ident]['parents']
for name in ['cloudCover','lighting']:
 nodes=[n for n in p.nodes if n['attrs'].get('name')==name]
 assert len(nodes)==1 and byid['config-form'] in nodes[0]['parents']
print('PASS: book, review and atmosphere controls are present in their own panels/forms')

assert byid['scene-host'] in byid['control-display']['parents']
assert byid['control-display']['attrs']['role']=='group'
assert Path('dist/control-display.js').exists()
print('PASS: control display inside scene/fullscreen root, accessible group, renderer asset present')

pedals=[n for n in p.nodes if n['attrs'].get('name')=='pedalMode']
assert len(pedals)==0
print('PASS: automatic pedal selector removed (v0.52)')

assert byid['scene-panel'] in byid['contact-result']['parents']
assert 'hidden' in byid['contact-result']['attrs']
assert byid['contact-result']['attrs']['role']=='status'
assert '.scene-panel:fullscreen .contact-result:not([hidden])' in Path('dist/style.css').read_text()
print('PASS: final severity overlay is hidden by default, accessible and within fullscreen root')
