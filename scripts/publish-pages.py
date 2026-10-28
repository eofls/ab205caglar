"""Trusted publisher. Never execute files from the downloaded preview artifact."""
import json, os, re, shutil, subprocess, pathlib, html

def run(*args):
    return subprocess.check_output(args,text=True).strip()
def api(endpoint):
    return json.loads(run('gh','api',endpoint))

repo=os.environ['GITHUB_REPOSITORY']
run_id=os.environ['SOURCE_RUN']
mode=os.environ.get('PUBLISH_MODE','preview')
assert run_id.isdigit() and mode in ('preview','approve')
source=api(f'repos/{repo}/actions/runs/{run_id}')
assert source['conclusion']=='success' and source['status']=='completed', 'Source tests must pass'
assert source['head_repository']['full_name']==repo, 'Fork publication is not enabled'
assert source['path']=='.github/workflows/tests.yml', 'Unexpected source workflow'
assert source['event'] in ('push','pull_request','workflow_dispatch')
sha=source['head_sha'];assert re.fullmatch('[0-9a-f]{40}',sha)
if mode=='approve':
    assert source['head_branch']=='main' and source['event']!='pull_request', 'Approve a tested main run only'
    comparison=api(f'repos/{repo}/compare/{sha}...main')
    assert comparison['status'] in ('ahead','identical'), 'Commit is not in main history'
artifacts=api(f'repos/{repo}/actions/runs/{run_id}/artifacts')['artifacts']
assert any(a['name']=='site-preview' and not a['expired'] for a in artifacts), 'Preview artifact unavailable; rerun tests'
stage=pathlib.Path('stage');shutil.rmtree(stage,ignore_errors=True);stage.mkdir()
run('gh','run','download',run_id,'--repo',repo,'--name','site-preview','--dir',str(stage))
allowed={'.html','.css','.js','.mjs','.json','.png','.jpg','.jpeg','.webp','.webmanifest','.wasm','.bin','.glb','.gltf','.txt','.csv','.svg','.mp3','.wav','.ogg','.md'}
total=0
for f in stage.rglob('*'):
    assert not f.is_symlink(), 'Symlink in artifact'
    assert not any(p.startswith('.') for p in f.relative_to(stage).parts), 'Hidden artifact path'
    if f.is_file():
        assert f.suffix.lower() in allowed, f'Unexpected file: {f}'
        total+=f.stat().st_size
assert total<150*1024*1024 and (stage/'index.html').is_file()
assert (stage/'reports/index.html').is_file()
assert re.fullmatch('[0-9a-f]{40}',json.loads((stage/'build-info.json').read_text())['commit'])
if mode=='approve':assert json.loads((stage/'build-info.json').read_text())['commit']==sha, 'Artifact revision mismatch'
# The publishing checkout is trusted main. Its credential is the scoped Actions token.
run('git','config','user.name','github-actions[bot]')
run('git','config','user.email','41898282+github-actions[bot]@users.noreply.github.com')
publication=pathlib.Path('publication')
exists=bool(run('git','ls-remote','--heads','origin','pages-data'))
if exists:
    run('git','fetch','origin','pages-data')
    run('git','worktree','add','--detach',str(publication),'FETCH_HEAD')
else:
    run('git','worktree','add','--detach',str(publication),'HEAD')
    run('git','-C',str(publication),'checkout','--orphan','pages-data-initial')
    run('git','-C',str(publication),'rm','-rf','.')
destination=publication/'previews'/sha
shutil.rmtree(destination,ignore_errors=True);shutil.copytree(stage,destination)
metadata=publication/'publication.json'
state=json.loads(metadata.read_text()) if metadata.exists() else {'previews':[], 'approved':None}
state['previews']=[x for x in state['previews'] if x['sha']!=sha]+[{'sha':sha,'run':run_id}]
# Limit preview storage; never prune the approved build.
for old in state['previews'][:-10]:
    if old['sha']!=state.get('approved'):shutil.rmtree(publication/'previews'/old['sha'],ignore_errors=True)
state['previews']=state['previews'][-10:]
if mode=='approve':
    state['approved']=sha
    shutil.rmtree(publication/'live',ignore_errors=True);shutil.copytree(stage,publication/'live')
metadata.write_text(json.dumps(state,indent=2))
links=''.join(f'<li><a href="previews/{x["sha"]}/">{x["sha"][:8]}</a> · <a href="previews/{x["sha"]}/reports/">Karar raporu</a></li>' for x in reversed(state['previews']))
live='<a href="live/">Onaylı uygulamayı aç</a>' if state['approved'] else 'Henüz canlı sürüm onaylanmadı.'
(publication/'index.html').write_text('<!doctype html><html lang="tr"><meta charset="utf-8"><title>AB-205 sürümler</title><style>body{font:18px system-ui;max-width:900px;margin:60px auto;padding:20px}li{margin:20px 0}</style><h1>AB-205 sürümleri</h1><p>'+live+'</p><h2>Test edilmiş önizlemeler</h2><ul>'+links+'</ul><p>Önizlemeler deneysel geliştirme sürümleridir.</p></html>')
(publication/'.nojekyll').write_text('')
run('git','-C',str(publication),'add','.')
if subprocess.run(['git','-C',str(publication),'diff','--cached','--quiet']).returncode:
    run('git','-C',str(publication),'commit','-m',f'{mode}: tested build {sha}')
    run('git','-C',str(publication),'push','origin','HEAD:refs/heads/pages-data')
with open(os.environ['GITHUB_STEP_SUMMARY'],'a') as out:
    out.write(f'## Publication\n\nMode: {mode}. Tested source: `{sha}`. Run: {run_id}.\n\nPreview path: `previews/{sha}/`. Approved path: `live/`.\n')
# Remove worktree metadata before upload-pages-artifact; only public static files remain.
(publication/'.git').unlink(missing_ok=True)
