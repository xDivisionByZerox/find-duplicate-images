import { execSync } from 'child_process';
import fsPromise from 'fs/promises';
import { IFileInfo } from './find-duplicate-files';
import { Util } from './util';

export interface IResultHandlerConstructor {
  outputDir: string;
  jsFileName: string;
  htmlFileName: string;
}

export class ResultHandler {

  private readonly $outputDir: string;
  private readonly $htmlOutputFile: string;
  private readonly $jsOutputFile: string;

  constructor(params: IResultHandlerConstructor) {
    this.$outputDir = params.outputDir;
    this.$htmlOutputFile = Util.getPath(this.$outputDir, params.htmlFileName);
    this.$jsOutputFile = Util.getPath(this.$outputDir, params.jsFileName);
  }

  async ouputResults(files: IFileInfo[][]) {
    await fsPromise.mkdir(this.$outputDir, {
      recursive: true,
    });
    await fsPromise.writeFile(this.$jsOutputFile, `const data = ${JSON.stringify(files)};`);

    const location = __dirname.replace(/\\/g, "/");
    const pathToFile = Util.getPath(location, 'find-duplicate-files.html');
    await fsPromise.copyFile(pathToFile, this.$htmlOutputFile);

    try {
      console.log('Trying to automatically open results');
      const cmd = this.getStartBrowserCommand();
      execSync(`${cmd} ${this.$htmlOutputFile}`);
    } catch {
      console.log('Coult not open results automatically. Please open', this.$htmlOutputFile, 'in your browser to view the results.');
    }
  }

  private getStartBrowserCommand() {
    const { platform } = process;
    if (platform === 'darwin') {
      return 'open';
    } else if (platform === 'win32') {
      return 'start';
    } else {
      return 'xdg-open';
    }
  }
};
