from pathlib import Path

required = [
    Path('pipelines/ui-regression.Jenkinsfile'),
    Path('shared-library/vars/notifyBuild.groovy'),
    Path('docker/Dockerfile'),
]
missing = [str(path) for path in required if not path.exists()]
if missing:
    raise SystemExit(f'Missing required files: {missing}')
print('pipeline assets validated')
