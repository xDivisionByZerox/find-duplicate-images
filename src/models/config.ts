import { IDuplicateFileFinderConstructor } from './duplicate-file-finder';
import { IResultHandlerConstructor } from './result-handler';
import { Util } from './util';

export class FindConfig implements Required<IResultHandlerConstructor>, Required<IDuplicateFileFinderConstructor> {

  pathToCheck: string;
  outputDir: string;
  jsFileName: string;
  htmlFileName: string;
  recursive: boolean;

  constructor(params: FindConfig) {
    this.htmlFileName = params.htmlFileName;
    this.jsFileName = params.jsFileName;
    this.outputDir = params.outputDir;
    this.pathToCheck = params.pathToCheck;
    this.recursive = params.recursive ?? true;
  }

  static hasConfig = (value: unknown): value is FindConfig => (
    Util.isObject<FindConfig>(value)
    && typeof value.htmlFileName === 'string'
    && typeof value.jsFileName === 'string'
    && typeof value.outputDir === 'string'
    && typeof value.pathToCheck === 'string'
    && (
      value.recursive === undefined
      || typeof value.recursive === 'boolean'
    )
  )

}

export class DeleteConfig {

  path: string;

  constructor(params: DeleteConfig) {
    this.path = params.path;
  }

  static hasConfig = (value: unknown): value is DeleteConfig => (
    Util.isObject<DeleteConfig>(value)
    && typeof value.path === 'string'
  )
}
