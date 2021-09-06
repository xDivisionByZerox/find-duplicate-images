import { execSync } from 'child_process';
import fsPromise from 'fs/promises';
import { IFileInfo } from '..';
import { Util } from './util';
import path from 'path';

export interface IResultHandlerConstructor {
  outputDir: string;
  jsFileName: string;
  htmlFileName: string;
}

export class ResultHandler {

  private readonly $outputDir: string;

  private readonly $htmlOutputFilePath: string;
  private readonly $jsOutputFilePath: string;

  private readonly $htmlTemplateFileName = 'index.template.html';
  private readonly getHtmlTemplateFilePath = Util.getPath(path.dirname(process.argv[1]!), this.$htmlTemplateFileName);

  constructor(params: IResultHandlerConstructor) {
    this.$outputDir = params.outputDir;
    this.$htmlOutputFilePath = Util.getPath(this.$outputDir, params.htmlFileName);
    this.$jsOutputFilePath = Util.getPath(this.$outputDir, params.jsFileName);
  }

  async ouputResults(files: IFileInfo[][]): Promise<void> {
    if(files.length <= 0) {
      console.log('There were no duplicates found. You\'re good to go!');

      return;
    }

    await fsPromise.mkdir(this.$outputDir, {
      recursive: true,
    });
    
    await Promise.all([
      fsPromise.writeFile(this.$jsOutputFilePath, `const data = ${JSON.stringify(files)};`),
      fsPromise.copyFile(this.getHtmlTemplateFilePath, this.$htmlOutputFilePath),
    ]);

    try {
      console.log('Trying to automatically open results');
      const cmd = this.getStartBrowserCommand();
      execSync(`${cmd} ${this.$htmlOutputFilePath}`);
    } catch {
      console.log('Coult not open results automatically. Please open', this.$htmlOutputFilePath, 'in your browser to view the results.');
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
