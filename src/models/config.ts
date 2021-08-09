import { IDuplicateFileFinderConstructor } from './duplicate-file-finder';
import { IResultHandlerConstructor } from './result-handler';
import { Util } from './util';

export class Config implements IResultHandlerConstructor, IDuplicateFileFinderConstructor {
  
  pathToCheck: string;
  outputDir: string;
  jsFileName: string;
  htmlFileName: string;

  constructor(params: Config) {
    this.htmlFileName = params.htmlFileName;
    this.jsFileName = params.jsFileName;
    this.outputDir = params.outputDir;
    this.pathToCheck = params.pathToCheck;
  }

  static hasConfig = (value: unknown): value is Config => (
    Util.isObject<Config>(value)
    && typeof value.htmlFileName === 'string'
    && typeof value.jsFileName === 'string'
    && typeof value.outputDir === 'string'
    && typeof value.pathToCheck === 'string'
  )

}
