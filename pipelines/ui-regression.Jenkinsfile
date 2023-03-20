pipeline {
  agent { docker { image 'node:20' } }
  stages {
    stage('Install') { steps { sh 'npm ci || npm install' } }
    stage('Smoke') { parallel { stage('UI') { steps { sh 'npm test' } } stage('API') { steps { sh 'npm run test:api || true' } } } }
    stage('Publish') { steps { archiveArtifacts artifacts: 'reports/**', allowEmptyArchive: true } }
  }
}
