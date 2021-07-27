const fs = require('fs');
const childProcess = require('child_process');

const htmlTemplateFileName = 'index.template.html'
childProcess.execSync('npx tsc').toString();
childProcess.execSync('npx webpack').toString();
fs.copyFileSync(`src/${htmlTemplateFileName}`, `build/${htmlTemplateFileName}`)
