import { execSync } from 'child_process';
import path from 'path';

function getStartBrowserCommand() {
  const { platform } = process;
  switch (platform) {
    case 'darwin': return 'open';
    case 'win32': return 'start';
    default: return 'xdg-open';
  }
}

const configurationFile = path.join(__dirname, 'frontend.html')
const cmd = getStartBrowserCommand();
execSync(`${cmd} ${configurationFile}`);