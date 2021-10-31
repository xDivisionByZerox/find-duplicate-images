import { exec } from 'child_process';
import path from 'path';

const backendEntry = path.join(__dirname, 'backend', 'index.js');
exec(`node ${backendEntry}`);

function getStartBrowserCommand() {
  const { platform } = process;
  switch (platform) {
    case 'darwin': return 'open';
    case 'win32': return 'start';
    default: return 'xdg-open';
  }
}

const viewFile = path.join(__dirname, 'frontend', 'frontend.html');
const cmd = getStartBrowserCommand();
exec(`${cmd} ${viewFile}`);