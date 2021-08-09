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

  private readonly $htmlOutputFileName: string;
  private readonly getHtmlOutputFilePath = () => Util.getPath(this.$outputDir, this.$htmlOutputFileName);

  private readonly $jsOutputFileName: string;
  private readonly getJsOutputFilePath = () => Util.getPath(this.$outputDir, this.$jsOutputFileName);

  private readonly $htmlTemplateFileName = 'index.template.html';
  private readonly getHtmlTemplateFilePath = () => Util.getPath(path.dirname(process.argv[1]!), this.$htmlTemplateFileName);

  constructor(params: IResultHandlerConstructor) {
    this.$outputDir = params.outputDir;
    this.$htmlOutputFileName = params.htmlFileName;
    this.$jsOutputFileName = params.jsFileName;
  }

  async ouputResults(files: IFileInfo[][]) {
    await fsPromise.mkdir(this.$outputDir, {
      recursive: true,
    });
    
    await Promise.all([
      fsPromise.writeFile(this.getJsOutputFilePath(), `const data = ${JSON.stringify(files)};`),
      fsPromise.copyFile(this.getHtmlTemplateFilePath(), this.getHtmlOutputFilePath()),
    ]);

    try {
      console.log('Trying to automatically open results');
      const cmd = this.getStartBrowserCommand();
      execSync(`${cmd} ${this.getHtmlOutputFilePath()}`);
    } catch {
      console.log('Coult not open results automatically. Please open', this.getHtmlOutputFilePath(), 'in your browser to view the results.');
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
